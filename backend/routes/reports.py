from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import os, io

reports_bp = Blueprint("reports", __name__)

@reports_bp.route("/generate/<scan_id>", methods=["GET"])
@jwt_required()
def generate_report(scan_id):
    radiologist = get_jwt_identity()

    from routes.scan import SCAN_STORE
    scan = SCAN_STORE.get(scan_id)
    if not scan:
        return jsonify({"error": "Scan not found"}), 404

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
        styles = getSampleStyleSheet()
        elements = []

        title_style = ParagraphStyle("title", parent=styles["Title"], fontSize=20, textColor=colors.HexColor("#0d3b66"))
        elements.append(Paragraph("PulmoSight — Radiology Report", title_style))
        elements.append(Spacer(1, 0.4*cm))

        subtitle_style = ParagraphStyle("subtitle", parent=styles["Normal"], fontSize=10, textColor=colors.grey)
        elements.append(Paragraph("AI-Assisted Lung Cancer Detection Report", subtitle_style))
        elements.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} | Radiologist: {radiologist}", subtitle_style))
        elements.append(Spacer(1, 0.6*cm))

        patient_data = [
            ["Field", "Value"],
            ["Scan ID", scan["scan_id"]],
            ["Patient Name", scan["patient_name"]],
            ["Patient ID", scan["patient_id"]],
            ["Patient Age", str(scan["patient_age"])],
            ["Scan Type", scan["scan_type"]],
            ["Scan Date", scan["timestamp"][:10]],
            ["Model", scan["model_version"]],
            ["Grad-CAM", "Enabled" if scan["gradcam_enabled"] else "Disabled"],
        ]
        table = Table(patient_data, colWidths=[5*cm, 10*cm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0d3b66")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0f4f8")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 0.6*cm))

        result_color = colors.red if scan["is_positive"] else colors.green
        result_label = "POSITIVE — Cancer Detected" if scan["is_positive"] else "NEGATIVE — No Cancer Detected"

        result_style = ParagraphStyle(
            "result",
            parent=styles["Normal"],
            fontSize=14,
            leading=18,
            textColor=result_color,
            fontName="Helvetica-Bold",
            spaceAfter=6
        )
        elements.append(Paragraph(f"Detection Result: {result_label}", result_style))
        elements.append(Paragraph(f"Top Confidence Score: {scan['top_confidence']}%", styles["Normal"]))
        elements.append(Spacer(1, 0.4*cm))

        if "images" in scan and len(scan["images"]) > 1:
            elements.append(Paragraph("Detailed Detection Analysis across Slices:", ParagraphStyle("subsub", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=11, spaceAfter=6, textColor=colors.HexColor("#0d3b66"))))
            for idx, img in enumerate(scan["images"], 1):
                img_name = img.get("filename_original", f"Slice {idx}")
                status = "POSITIVE" if img.get("is_positive") else "NEGATIVE"
                conf = img.get("top_confidence", 0.0)
                status_color = "red" if img.get("is_positive") else "green"
                elements.append(Paragraph(f"Slice {idx} ({img_name}): <font color='{status_color}'><b>{status}</b></font> (Confidence: {conf}%)", styles["Normal"]))
                for d in img.get("detections", []):
                    elements.append(Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;• Detected: <b>{d['label']}</b> with {d['confidence']}% confidence", styles["Normal"]))
                elements.append(Spacer(1, 0.2*cm))
        else:
            for i, det in enumerate(scan.get("detections", []), 1):
                elements.append(Paragraph(f"Detection {i}: {det['label']} — {det['confidence']}% confidence", styles["Normal"]))

        elements.append(Spacer(1, 0.8*cm))
        disclaimer_style = ParagraphStyle("disclaimer", parent=styles["Normal"], fontSize=9, textColor=colors.grey,
            borderColor=colors.orange, borderWidth=1, borderPadding=8, backColor=colors.HexColor("#fff8ee"))
        elements.append(Paragraph(
            "DISCLAIMER: This report is generated by an AI-assisted detection system (YOLOv11 + Grad-CAM) "
            "and is intended as a decision-support tool only. It does not constitute a clinical diagnosis. "
            "All findings must be reviewed and confirmed by a qualified radiologist or oncologist before "
            "any clinical decisions are made.", disclaimer_style))

        doc.build(elements)
        buffer.seek(0)

        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"PulmoSight_{scan_id}_{scan['patient_name'].replace(' ', '_')}.pdf",
            mimetype="application/pdf"
        )

    except ImportError:
        return jsonify({"error": "reportlab not installed. Run: pip install reportlab"}), 500