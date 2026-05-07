from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta

auth_bp = Blueprint("auth", __name__)

USERS_DB = {
    "dr.arjun@hospital.com": {
        "password": generate_password_hash("password123"),
        "name": "Dr. Arjun Mehta",
        "role": "radiologist",
        "initials": "AM"
    }
}

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").lower()
    password = data.get("password", "")

    user = USERS_DB.get(email)
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(
        identity=email,
        expires_delta=timedelta(hours=8)
    )
    return jsonify({
        "token": token,
        "user": {
            "email": email,
            "name": user["name"],
            "role": user["role"],
            "initials": user["initials"]
        }
    })

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    email = get_jwt_identity()
    user = USERS_DB.get(email)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "email": email,
        "name": user["name"],
        "role": user["role"],
        "initials": user["initials"]
    })

@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return jsonify({"message": "Logged out successfully"})
