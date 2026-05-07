from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
from utils.model import run_detection

scan_bp = Blueprint("scan", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "dcm", "bmp", "tiff"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

SCAN_STORE = {}

@scan_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_scan():
    radiologist = get_jwt_identity()

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    patient_id = request.form.get("patient_id", "UNKNOWN")
    patient_name = request.form.get("patient_name", "Unknown Patient")
    patient_age = request.form.get("age", "N/A")
    scan_type = request.form.get("scan_type", "CT Chest")

    scan_id = str(uuid.uuid4())[:8].upper()
    filename = secure_filename(f"{scan_id}_{file.filename}")
    filepath = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    result = run_detection(filepath, scan_id)

    scan_record = {
        "scan_id": f"SC-{scan_id}",
        "patient_id": patient_id,
        "patient_name": patient_name,
        "patient_age": patient_age,
        "scan_type": scan_type,
        "radiologist": radiologist,
        "timestamp": datetime.utcnow().isoformat(),
        "original_image": filename,
        "gradcam_image": result.get("gradcam_image"),
        "detections": result.get("detections", []),
        "is_positive": result.get("is_positive", False),
        "top_confidence": result.get("top_confidence", 0.0),
        "model_version": "YOLOv11",
        "gradcam_enabled": True
    }

    SCAN_STORE[scan_record["scan_id"]] = scan_record
    return jsonify(scan_record), 200

@scan_bp.route("/<scan_id>", methods=["GET"])
@jwt_required()
def get_scan(scan_id):
    scan = SCAN_STORE.get(scan_id)
    if not scan:
        return jsonify({"error": "Scan not found"}), 404
    return jsonify(scan)

@scan_bp.route("/image/<filename>", methods=["GET"])
def serve_image(filename):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)

@scan_bp.route("/recent", methods=["GET"])
@jwt_required()
def recent_scans():
    radiologist = get_jwt_identity()
    scans = [s for s in SCAN_STORE.values() if s["radiologist"] == radiologist]
    scans.sort(key=lambda x: x["timestamp"], reverse=True)
    return jsonify(scans[:20])
