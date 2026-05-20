---
name: computer-vision
description: |
  Computer vision implementation covering image classification, object detection (YOLO), image segmentation, OCR (Tesseract), face detection, image preprocessing, data augmentation, transfer learning, model deployment, and edge inference.
  Use when the user asks about computer vision, computer vision best practices, or needs guidance on computer vision implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml deep-learning guide"
  category: "ai-machine-learning"
  subcategory: "applied-ai"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Computer Vision

## Overview

Computer vision enables machines to interpret and act on visual data. This skill covers practical implementation of core CV tasks -- classification, detection, segmentation, and OCR -- using modern frameworks and pre-trained models, with guidance on data augmentation, transfer learning, and deployment.

## Image Preprocessing

### Standard Pipeline

```python
import cv2
import numpy as np
from PIL import Image
import torchvision.transforms as T

class ImagePreprocessor:
    """Standard image preprocessing for CV models."""

    def __init__(self, target_size: tuple = (224, 224), normalize: bool = True):
        self.target_size = target_size
        self.normalize = normalize

    def preprocess_opencv(self, image_path: str) -> np.ndarray:
        """Preprocess with OpenCV."""
        img = cv2.imread(image_path)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Resize
        # ... (condensed) ...

        transforms.extend([
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

        return T.Compose(transforms)
```

### Common Preprocessing Operations

| Operation | When to Use | Library |
|-----------|------------|---------|
| Resize | Always (model input size) | cv2, PIL, torchvision |
| Normalize | Always (ImageNet stats for pretrained) | torchvision |
| Grayscale | OCR, edge detection | cv2 |
| Histogram equalization | Low contrast images | cv2 (CLAHE) |
| Denoising | Noisy images | cv2.fastNlMeansDenoising |
| Crop | Focus on region of interest | cv2, PIL |

## Data Augmentation

### Albumentations (Recommended)

```python
import albumentations as A
from albumentations.pytorch import ToTensorV2

def get_training_augmentations(image_size: int = 224) -> A.Compose:
    """Production training augmentation pipeline."""
    return A.Compose([
        A.RandomResizedCrop(height=image_size, width=image_size, scale=(0.8, 1.0)),
        A.HorizontalFlip(p=0.5),
        A.VerticalFlip(p=0.1),
        A.ShiftScaleRotate(
            shift_limit=0.1, scale_limit=0.15, rotate_limit=15, p=0.5
        ),
        A.OneOf([
            A.GaussNoise(var_limit=(10.0, 50.0)),
            A.GaussianBlur(blur_limit=(3, 7)),
            A.MotionBlur(blur_limit=5),
        ], p=0.3),
        A.OneOf([
            # ... (condensed) ...
        A.RandomResizedCrop(height=image_size, width=image_size, scale=(0.5, 1.0)),
        A.HorizontalFlip(p=0.5),
        A.RandomBrightnessContrast(p=0.3),
        A.HueSaturationValue(p=0.3),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2(),
    ], bbox_params=A.BboxParams(format='pascal_voc', label_fields=['labels']))
```

### Augmentation Strategy by Dataset Size

```
Dataset size < 500 images:
  -> Heavy augmentation + transfer learning essential
  -> Use MixUp, CutMix, Mosaic
  -> Consider synthetic data generation

Dataset size 500-5000:
  -> Moderate augmentation
  -> Standard flips, crops, color jitter
  -> Transfer learning highly recommended

Dataset size > 5000:
  -> Light augmentation
  -> Basic flips and normalization
  -> Can train from scratch for simple tasks
```

## Image Classification

### Transfer Learning with PyTorch

```python
import torch
import torch.nn as nn
from torchvision import models

def create_classifier(
    num_classes: int,
    backbone: str = "resnet50",
    pretrained: bool = True,
    freeze_backbone: bool = True,
) -> nn.Module:
    """Create a classifier with transfer learning."""

    if backbone == "resnet50":
        model = models.resnet50(weights="IMAGENET1K_V2" if pretrained else None)
        num_features = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(num_features, num_classes),
        # ... (condensed) ...

    # Freeze backbone layers
    if freeze_backbone:
        for param in list(model.parameters())[:-2]:
            param.requires_grad = False

    return model
```

### Hugging Face Image Classification

```python
from transformers import pipeline, AutoModelForImageClassification, AutoImageProcessor

# Quick inference with pipeline
classifier = pipeline("image-classification", model="google/vit-base-patch16-224")
result = classifier("photo.jpg")
# [{"label": "golden retriever", "score": 0.95}, ...]

# Fine-tuning
from transformers import TrainingArguments, Trainer
from datasets import load_dataset

dataset = load_dataset("imagefolder", data_dir="./data")

model = AutoModelForImageClassification.from_pretrained(
    "google/vit-base-patch16-224",
    num_labels=len(dataset["train"].features["label"].names),
    ignore_mismatched_sizes=True,
)
# ... (condensed) ...
        load_best_model_at_end=True,
    ),
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],
)

trainer.train()
```

### Model Selection Guide

| Model | Params | Accuracy (ImageNet) | Speed | Best For |
|-------|--------|-------------------|-------|----------|
| MobileNetV3-Small | 2.5M | 67.4% | Very fast | Mobile/edge |
| EfficientNet-B0 | 5.3M | 77.1% | Fast | Balanced |
| ResNet-50 | 25M | 80.4% | Medium | General purpose |
| EfficientNet-V2-S | 21M | 84.2% | Medium | High accuracy |
| ViT-B/16 | 86M | 84.5% | Slower | Max accuracy |
| ConvNeXt-Base | 88M | 85.8% | Slower | SOTA accuracy |

## Object Detection

### YOLOv8 (Ultralytics)

```python
from ultralytics import YOLO

# Load pretrained model
model = YOLO("yolov8n.pt")  # nano (fastest)
# model = YOLO("yolov8s.pt")  # small
# model = YOLO("yolov8m.pt")  # medium
# model = YOLO("yolov8l.pt")  # large

# Inference
results = model("image.jpg")

for result in results:
    boxes = result.boxes
    for box in boxes:
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        xyxy = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
        label = model.names[cls]
        # ... (condensed) ...
    patience=20,
    device="0",  # GPU
)

# Export for deployment
model.export(format="onnx")
model.export(format="tflite")
```

### YOLO Dataset Format

```yaml
# dataset.yaml
path: /path/to/dataset
train: images/train
val: images/val
test: images/test

names:
  0: person
  1: car
  2: bicycle
```

```
# Label format (one .txt per image)
# class_id center_x center_y width height (all normalized 0-1)
0 0.5 0.6 0.3 0.4
1 0.2 0.3 0.15 0.2
```

### Detection Model Comparison

| Model | mAP@50 (COCO) | Speed (ms) | Params | Best For |
|-------|---------------|------------|--------|----------|
| YOLOv8n | 37.3 | 1.2 | 3.2M | Real-time, edge |
| YOLOv8s | 44.9 | 2.0 | 11.2M | Balanced |
| YOLOv8m | 50.2 | 4.2 | 25.9M | High accuracy |
| YOLOv8x | 53.9 | 8.7 | 68.2M | Max accuracy |
| RT-DETR-L | 53.0 | 9.3 | 32M | Transformer-based |

## Image Segmentation

### Semantic Segmentation

```python
from transformers import pipeline

segmenter = pipeline("image-segmentation", model="nvidia/segformer-b0-finetuned-ade-512-512")

results = segmenter("street_scene.jpg")
for segment in results:
    print(f"{segment['label']}: score={segment['score']:.2f}")
```

### Instance Segmentation with SAM (Segment Anything)

```python
from segment_anything import sam_model_registry, SamPredictor, SamAutomaticMaskGenerator

# Load SAM model
sam = sam_model_registry["vit_h"](checkpoint="sam_vit_h.pth")
sam.to("cuda")

# Automatic mask generation
mask_generator = SamAutomaticMaskGenerator(sam)
masks = mask_generator.generate(image)

# Point-prompted segmentation
predictor = SamPredictor(sam)
predictor.set_image(image)

# Click a point to segment the object there
masks, scores, logits = predictor.predict(
    point_coords=np.array([[500, 375]]),
    point_labels=np.array([1]),  # 1 = foreground
    multimask_output=True,
)

# Use the highest-scoring mask
best_mask = masks[np.argmax(scores)]
```

### YOLO Segmentation

```python
from ultralytics import YOLO

model = YOLO("yolov8n-seg.pt")  # Instance segmentation

results = model("image.jpg")

for result in results:
    if result.masks:
        for mask, box in zip(result.masks.data, result.boxes):
            cls = int(box.cls[0])
            label = model.names[cls]
            binary_mask = mask.cpu().numpy()  # H x W binary mask
```

## OCR (Optical Character Recognition)

### Tesseract OCR

```python
import pytesseract
from PIL import Image
import cv2

def extract_text(image_path: str, preprocess: bool = True) -> str:
    """Extract text from image using Tesseract."""
    img = cv2.imread(image_path)

    if preprocess:
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Adaptive thresholding
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )

        # ... (condensed) ...
                    'x': data['left'][i],
                    'y': data['top'][i],
                    'width': data['width'][i],
                    'height': data['height'][i],
                },
            })
    return results
```

### EasyOCR (Multi-language)

```python
import easyocr

reader = easyocr.Reader(['en', 'fr', 'de'])

results = reader.readtext('document.jpg')
for (bbox, text, confidence) in results:
    print(f"'{text}' (confidence: {confidence:.2f})")
```

## Face Detection

### MediaPipe (Fastest)

```python
import mediapipe as mp

mp_face = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils

def detect_faces(image_path: str) -> list[dict]:
    """Detect faces using MediaPipe."""
    with mp_face.FaceDetection(model_selection=1, min_detection_confidence=0.5) as detector:
        image = cv2.imread(image_path)
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        results = detector.process(rgb)

        faces = []
        if results.detections:
            h, w = image.shape[:2]
            for detection in results.detections:
                bbox = detection.location_data.relative_bounding_box
                faces.append({
                    "confidence": detection.score[0],
                    "bbox": {
                        "x": int(bbox.xmin * w),
                        "y": int(bbox.ymin * h),
                        "width": int(bbox.width * w),
                        "height": int(bbox.height * h),
                    },
                })
        return faces
```

## Model Deployment

### ONNX Export

```python
import torch

def export_to_onnx(model, sample_input, output_path: str = "model.onnx"):
    """Export PyTorch model to ONNX format."""
    model.cpu()
    torch.onnx.export(
        model,
        sample_input,
        output_path,
        export_params=True,
        opset_version=17,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'},
        },
    )
# ... (condensed) ...
    session = ort.InferenceSession(
        model_path,
        providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
    )
    input_name = session.get_inputs()[0].name
    output = session.run(None, {input_name: input_data})
    return output[0]
```

### Edge Inference with TFLite

```python
import tensorflow as tf

def convert_to_tflite(saved_model_path: str, output_path: str, quantize: bool = True):
    """Convert model to TFLite for edge deployment."""
    converter = tf.lite.TFLiteConverter.from_saved_model(saved_model_path)

    if quantize:
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_types = [tf.float16]

    tflite_model = converter.convert()
    with open(output_path, 'wb') as f:
        f.write(tflite_model)
```

### Deployment Decision Tree

```
Target platform?
  CLOUD (GPU available):
    -> PyTorch/TensorRT (best performance)
    -> ONNX Runtime (portable)

  EDGE (mobile, IoT):
    -> TFLite (Android, Raspberry Pi)
    -> CoreML (iOS, macOS)
    -> ONNX Runtime Mobile

  BROWSER:
    -> TensorFlow.js
    -> ONNX Runtime Web

Latency requirement?
  < 10ms: TensorRT or hardware-specific optimization
  10-100ms: ONNX Runtime with GPU
  > 100ms: Any framework works
```

## Checklist

- [ ] Set up image preprocessing pipeline with proper normalization
- [ ] Implement data augmentation appropriate to dataset size
- [ ] Choose model architecture based on accuracy vs speed tradeoffs
- [ ] Use transfer learning for datasets under 10K images
- [ ] Set up proper train/val/test splits
- [ ] Track training metrics with experiment tracker
- [ ] Export model to deployment format (ONNX, TFLite, TensorRT)
- [ ] Benchmark inference latency on target hardware
- [ ] Implement preprocessing in the deployment pipeline (not just training)
- [ ] Test with edge cases (poor lighting, occlusion, unusual angles)
- [ ] Monitor model performance in production

## When to Use

**Use this skill when:**
- Designing or implementing computer vision solutions
- Reviewing or improving existing computer vision approaches
- Making architectural or implementation decisions about computer vision
- Learning computer vision patterns and best practices
- Troubleshooting computer vision-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Computer Vision Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement computer vision for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended computer vision approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When computer vision must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
