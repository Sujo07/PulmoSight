import os
import cv2
import numpy as np

MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "weights", "best.pt")
)

LABEL_MAPPING = {
    "cancer_detect_01": "Cancer Detect - Malignant",
    "cancer_detect_02": "Cancer Detect - Benign"
}

_model = None

def get_model():
    global _model
    if _model is None:
        from ultralytics import YOLO
        _model = YOLO(MODEL_PATH)
    return _model

def run_detection(image_path: str, scan_id: str) -> dict:
    upload_dir = os.path.dirname(image_path)
    gradcam_filename = f"{scan_id}_gradcam.png"
    gradcam_path = os.path.join(upload_dir, gradcam_filename)

    try:
        model = get_model()
        results = model(image_path, conf=0.25)[0]

        detections = []
        for box in results.boxes:
            conf = float(box.conf[0])
            cls = int(box.cls[0])
            raw_label = model.names[cls]
            label = LABEL_MAPPING.get(raw_label, raw_label)
            xyxy = box.xyxy[0].tolist()
            detections.append({
                "label": label,
                "confidence": round(conf * 100, 1),
                "bbox": xyxy
            })

        is_positive = any("malignant" in d["label"].lower() for d in detections)
        top_confidence = max((d["confidence"] for d in detections), default=0.0)

        gradcam_image = generate_gradcam(image_path, gradcam_path, model, results)

        return {
            "detections": detections,
            "is_positive": is_positive,
            "top_confidence": top_confidence,
            "gradcam_image": gradcam_filename if gradcam_image else None
        }

    except Exception as e:
        print(f"[PulmoSight] Detection error: {e}")
        return {"detections": [], "is_positive": False, "top_confidence": 0.0, "gradcam_image": None}


def generate_gradcam(image_path: str, output_path: str, model, results) -> bool:
    try:
        img = cv2.imread(image_path)
        if img is None:
            return False

        h, w = img.shape[:2]
        heatmap = np.zeros((h, w), dtype=np.float32)

        for box in results.boxes:
            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
            conf = float(box.conf[0])
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            sigma_x = max((x2 - x1) / 3, 1)
            sigma_y = max((y2 - y1) / 3, 1)

            for y in range(max(0, y1 - 20), min(h, y2 + 20)):
                for x in range(max(0, x1 - 20), min(w, x2 + 20)):
                    val = conf * np.exp(
                        -(((x - cx) ** 2) / (2 * sigma_x ** 2) +
                          ((y - cy) ** 2) / (2 * sigma_y ** 2))
                    )
                    heatmap[y, x] = max(heatmap[y, x], val)

        if heatmap.max() > 0:
            heatmap = heatmap / heatmap.max()

        heatmap_colored = cv2.applyColorMap(
            (heatmap * 255).astype(np.uint8), cv2.COLORMAP_JET
        )

        overlay = cv2.addWeighted(img, 0.6, heatmap_colored, 0.4, 0)

        for box in results.boxes:
            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
            conf = float(box.conf[0])
            raw_label = model.names[int(box.cls[0])]
            label = LABEL_MAPPING.get(raw_label, raw_label)
            cv2.rectangle(overlay, (x1, y1), (x2, y2), (0, 255, 0), 2)
            label_text = f"{label} {conf * 100:.1f}%"
            # Calculate text size to prevent overflow off image edges
            text_size = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)[0]
            text_w, text_h = text_size[0], text_size[1]

            # Shift text X coordinate left if it overflows the right edge
            text_x = x1
            if text_x + text_w > w:
                text_x = max(0, w - text_w - 10)

            # Shift text Y coordinate down into box if it overflows the top edge
            text_y = y1 - 6
            if text_y < 10:
                text_y = y1 + text_h + 6

            cv2.putText(overlay, label_text, (text_x, text_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

        cv2.imwrite(output_path, overlay)
        return True

    except Exception as e:
        print(f"[PulmoSight] Grad-CAM error: {e}")
        return False
