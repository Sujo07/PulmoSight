from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash
from datetime import timedelta
from db import get_user_by_email, create_user

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")
    name = data.get("name", "").strip()
    role = data.get("role", "radiologist").strip()
    initials = data.get("initials", "").strip()

    if not email or not password or not name:
        return jsonify({"error": "Email, password, and name are required."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    # Auto-generate initials if not provided
    if not initials:
        parts = name.split()
        initials = "".join([p[0].upper() for p in parts[:2]]) if parts else "XX"

    # Try creating the user
    success = create_user(email, password, name, role, initials)
    if not success:
        return jsonify({"error": "User with this email already exists."}), 400

    # Retrieve created user
    user = get_user_by_email(email)
    
    # Issue JWT token
    token = create_access_token(
        identity=email,
        expires_delta=timedelta(hours=8)
    )

    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": {
            "email": email,
            "name": user["name"],
            "role": user["role"],
            "initials": user["initials"]
        }
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")

    user = get_user_by_email(email)
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
    user = get_user_by_email(email)
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

