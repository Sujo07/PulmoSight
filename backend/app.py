from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from routes.auth import auth_bp
from routes.scan import scan_bp
from routes.patients import patients_bp
from routes.reports import reports_bp
import os

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173"], supports_credentials=True)

app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "pulmosight-dev-secret")
app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "uploads")
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

jwt = JWTManager(app)

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(scan_bp, url_prefix="/api/scan")
app.register_blueprint(patients_bp, url_prefix="/api/patients")
app.register_blueprint(reports_bp, url_prefix="/api/reports")

@app.route("/api/health")
def health():
    return {"status": "ok", "model": "YOLOv11", "gradcam": True}

# Trigger reload after reportlab installation
if __name__ == "__main__":
    app.run(debug=True, port=5000)
