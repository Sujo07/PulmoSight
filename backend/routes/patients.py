from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import uuid
from datetime import datetime

patients_bp = Blueprint("patients", __name__)

PATIENTS_DB = {
    "PT-001": {"id": "PT-001", "name": "Rajesh Kumar", "age": 58, "gender": "Male", "contact": "+91-9876543210", "scans": []},
    "PT-002": {"id": "PT-002", "name": "Priya Sharma", "age": 45, "gender": "Female", "contact": "+91-9123456789", "scans": []},
    "PT-003": {"id": "PT-003", "name": "Amit Bose", "age": 63, "gender": "Male", "contact": "+91-9001234567", "scans": []},
}

@patients_bp.route("/", methods=["GET"])
@jwt_required()
def list_patients():
    query = request.args.get("q", "").lower()
    patients = list(PATIENTS_DB.values())
    if query:
        patients = [p for p in patients if query in p["name"].lower() or query in p["id"].lower()]
    return jsonify(patients)

@patients_bp.route("/<patient_id>", methods=["GET"])
@jwt_required()
def get_patient(patient_id):
    patient = PATIENTS_DB.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify(patient)

@patients_bp.route("/", methods=["POST"])
@jwt_required()
def create_patient():
    data = request.get_json()
    patient_id = f"PT-{str(uuid.uuid4())[:6].upper()}"
    patient = {
        "id": patient_id,
        "name": data.get("name"),
        "age": data.get("age"),
        "gender": data.get("gender"),
        "contact": data.get("contact", ""),
        "created_at": datetime.utcnow().isoformat(),
        "scans": []
    }
    PATIENTS_DB[patient_id] = patient
    return jsonify(patient), 201
