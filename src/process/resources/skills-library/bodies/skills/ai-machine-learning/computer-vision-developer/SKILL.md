---
name: computer-vision-developer
description: |
  Hands-on computer vision development covering image classification with transfer learning, object detection with YOLO and Faster R-CNN, semantic and instance segmentation, OpenCV image processing, data augmentation strategies, model optimization for edge deployment, video processing, and metrics for measuring model performance.
  Use when the user asks about computer vision developer, computer vision developer best practices, or needs guidance on computer vision developer implementation.
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

# Computer Vision Developer

## Overview

Computer vision development involves building systems that extract meaningful information from images and video. This skill covers practical implementation of core CV tasks: classification, detection, segmentation, and image processing. The focus is on production-ready code using modern frameworks (PyTorch, YOLO, OpenCV), with emphasis on data preparation, training strategies, measuring results, and deployment optimization.

## Image Classification

### Transfer Learning Pipeline

```python
import torch
import torch.nn as nn
from torchvision import models, transforms
from torch.utils.data import DataLoader, Dataset

# Data augmentation and normalization
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
    transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    transforms.RandomErasing(p=0.1),
])

val_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# Transfer learning with frozen backbone
class CustomClassifier(nn.Module):
    def __init__(self, num_classes, freeze_backbone=True):
        super().__init__()
        self.backbone = models.efficientnet_v2_s(weights='IMAGENET1K_V1')

        if freeze_backbone:
            for param in self.backbone.parameters():
                param.requires_grad = False

        # Replace classifier head
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(p=0.2),
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        return self.backbone(x)

    def unfreeze_backbone(self, num_layers=3):
        """Gradually unfreeze backbone layers for fine-tuning."""
        layers = list(self.backbone.features.children())
        for layer in layers[-num_layers:]:
            for param in layer.parameters():
                param.requires_grad = True
```

### Training Loop with Best Practices

```python
def train_classifier(model, train_loader, val_loader, num_epochs=30):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device)

    # Phase 1: Train head only (backbone frozen)
    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=1e-3, weight_decay=1e-4
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=10)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

    best_val_acc = 0
    patience = 5
    patience_counter = 0

    for epoch in range(num_epochs):
        # Unfreeze backbone after warm-up
        if epoch == 10:
            model.unfreeze_backbone(num_layers=3)
            optimizer = torch.optim.AdamW([
                {'params': model.backbone.features.parameters(), 'lr': 1e-5},
                {'params': model.backbone.classifier.parameters(), 'lr': 1e-4},
            ], weight_decay=1e-4)
            scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=20)

        # Training phase
        model.train()
        running_loss = 0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()

            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()

            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

        scheduler.step()

        # Validation phase
        val_acc = measure_accuracy(model, val_loader, device)
        print(f"Epoch {epoch}: Loss={running_loss/len(train_loader):.4f}, "
              f"Train Acc={100.*correct/total:.1f}%, Val Acc={val_acc:.1f}%")

        # Early stopping
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), 'best_model.pth')
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"Early stopping at epoch {epoch}")
                break
```

## Object Detection with YOLO

### YOLOv8 Training and Inference

```python
from ultralytics import YOLO

# Train custom YOLO model
model = YOLO('yolov8m.pt')  # Start from pretrained

results = model.train(
    data='dataset.yaml',       # Dataset configuration
    epochs=100,
    imgsz=640,
    batch=16,
    patience=20,               # Early stopping patience
    optimizer='AdamW',
    lr0=0.001,
    lrf=0.01,                  # Final LR = lr0 * lrf
    warmup_epochs=3,
    augment=True,
    mosaic=1.0,                # Mosaic augmentation
    mixup=0.1,                 # Mixup augmentation
    close_mosaic=10,           # Disable mosaic last 10 epochs
    device='0',                # GPU device
    project='runs/detect',
    name='custom-detector',
)

# Inference
model = YOLO('runs/detect/custom-detector/weights/best.pt')
results = model.predict(
    source='test_images/',
    conf=0.25,                 # Confidence threshold
    iou=0.45,                  # NMS IoU threshold
    max_det=100,               # Max detections per image
    save=True,
    save_txt=True,             # Save labels
)

# Process results
for result in results:
    boxes = result.boxes
    for box in boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        confidence = box.conf[0].item()
        class_id = int(box.cls[0].item())
        class_name = model.names[class_id]
        print(f"{class_name}: {confidence:.2f} at [{x1:.0f},{y1:.0f},{x2:.0f},{y2:.0f}]")
```

### Dataset Configuration

```yaml
# dataset.yaml
path: /data/my_dataset
train: images/train
val: images/val
test: images/test

nc: 5  # number of classes
names:
  0: car
  1: truck
  2: pedestrian
  3: bicycle
  4: traffic_sign

# Label format (YOLO): class_id center_x center_y width height (normalized 0-1)
# Example labels/train/image001.txt:
# 0 0.5 0.4 0.3 0.2
# 2 0.7 0.8 0.05 0.15
```

## Image Segmentation

### Semantic Segmentation with SegFormer

```python
from transformers import SegformerForSemanticSegmentation, SegformerImageProcessor
import torch
import numpy as np

class SemanticSegmentor:
    def __init__(self, model_name="nvidia/segformer-b2-finetuned-cityscapes-1024-1024"):
        self.processor = SegformerImageProcessor.from_pretrained(model_name)
        self.model = SegformerForSemanticSegmentation.from_pretrained(model_name)

    def segment(self, image):
        """Segment image and return per-pixel class labels."""
        inputs = self.processor(images=image, return_tensors="pt")

        with torch.no_grad():
            outputs = self.model(**inputs)

        logits = outputs.logits  # (batch, num_classes, H/4, W/4)

        # Upsample to original size
        upsampled = torch.nn.functional.interpolate(
            logits,
            size=image.size[::-1],  # (H, W)
            mode='bilinear',
            align_corners=False,
        )

        seg_map = upsampled.argmax(dim=1).squeeze().numpy()
        return seg_map

    def overlay_segmentation(self, image, seg_map, alpha=0.5):
        """Create colored overlay of segmentation on original image."""
        color_map = self._get_color_map()
        colored_seg = color_map[seg_map]
        overlay = (np.array(image) * (1 - alpha) + colored_seg * alpha).astype(np.uint8)
        return overlay
```

## OpenCV Image Processing

### Common Operations

```python
import cv2
import numpy as np

class ImageProcessor:
    """Production image processing pipeline with OpenCV."""

    def preprocess_for_model(self, image_path, target_size=(640, 640)):
        """Standard preprocessing pipeline."""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot read image: {image_path}")

        # Color space conversion (OpenCV loads as BGR)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Resize maintaining aspect ratio with padding
        img_resized = self.letterbox_resize(img_rgb, target_size)

        # Normalize to [0, 1]
        img_normalized = img_resized.astype(np.float32) / 255.0

        return img_normalized

    def letterbox_resize(self, image, target_size, fill_color=(114, 114, 114)):
        """Resize with padding to maintain aspect ratio."""
        h, w = image.shape[:2]
        target_h, target_w = target_size

        scale = min(target_w / w, target_h / h)
        new_w, new_h = int(w * scale), int(h * scale)

        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

        canvas = np.full((target_h, target_w, 3), fill_color, dtype=np.uint8)
        top = (target_h - new_h) // 2
        left = (target_w - new_w) // 2
        canvas[top:top + new_h, left:left + new_w] = resized

        return canvas

    def detect_edges(self, image, low_threshold=50, high_threshold=150):
        """Canny edge detection with preprocessing."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 1.4)
        edges = cv2.Canny(blurred, low_threshold, high_threshold)
        return edges

    def find_contours(self, image, min_area=100):
        """Find and filter contours by area."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, hierarchy = cv2.findContours(
            thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        return [c for c in contours if cv2.contourArea(c) >= min_area]

    def apply_perspective_transform(self, image, src_points, dst_size):
        """Apply perspective transformation (e.g., document straightening)."""
        dst_points = np.float32([
            [0, 0], [dst_size[0], 0],
            [dst_size[0], dst_size[1]], [0, dst_size[1]]
        ])
        matrix = cv2.getPerspectiveTransform(
            np.float32(src_points), dst_points
        )
        return cv2.warpPerspective(image, matrix, dst_size)
```

## Data Augmentation Strategies

### Augmentation by Task Type

```
Task                Recommended Augmentations         Avoid
---------------------------------------------------------------------------
Classification      RandomCrop, Flip, ColorJitter,    Aggressive geometric
                    Rotation, RandomErasing,          transforms that change
                    Mixup, CutMix                     class semantics

Object Detection    Mosaic, RandomScale, Flip,        Transforms that move
                    HSV augmentation, Copy-Paste      objects off-frame without
                                                      updating labels

Segmentation        Elastic transform, RandomCrop,    Transforms that create
                    Flip, Scale, ColorJitter          ambiguous boundaries

Medical Imaging     Rotation, Elastic deformation,    Aggressive color jitter
                    Flip (if anatomically valid),     (colors carry meaning),
                    Intensity normalization           Flips that change anatomy

OCR/Document        Perspective transform, slight     Heavy rotation,
                    rotation, noise, blur             color changes
```

## Model Optimization for Deployment

### ONNX Export and Quantization

```python
import torch
import onnx
from onnxruntime.quantization import quantize_dynamic, QuantType

# Export to ONNX
dummy_input = torch.randn(1, 3, 640, 640)

torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    opset_version=17,
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}},
)

# Verify ONNX model
onnx_model = onnx.load("model.onnx")
onnx.checker.check_model(onnx_model)

# Dynamic quantization (INT8)
quantize_dynamic(
    "model.onnx",
    "model_quantized.onnx",
    weight_type=QuantType.QInt8,
)

# Size comparison
import os
original_size = os.path.getsize("model.onnx") / 1e6
quantized_size = os.path.getsize("model_quantized.onnx") / 1e6
print(f"Original: {original_size:.1f}MB, Quantized: {quantized_size:.1f}MB")
print(f"Compression ratio: {original_size / quantized_size:.1f}x")
```

## Performance Metrics

### Metrics by Task

```
Classification:
  - Accuracy, Precision, Recall, F1-Score
  - Confusion Matrix
  - Top-k Accuracy (for many classes)
  - AUC-ROC (binary)

Object Detection:
  - mAP@0.5 (IoU threshold 0.5)
  - mAP@0.5:0.95 (COCO metric, averaged over IoU 0.5 to 0.95)
  - Precision-Recall curve per class
  - Inference FPS

Segmentation:
  - mIoU (mean Intersection over Union)
  - Pixel Accuracy
  - Dice Coefficient (F1 for segmentation)
  - Boundary F1 Score
```

## Video Processing

```python
class VideoProcessor:
    """Process video frames with detection model."""

    def process_video(self, video_path, model, output_path, skip_frames=1):
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        writer = cv2.VideoWriter(
            output_path, cv2.VideoWriter_fourcc(*'mp4v'),
            fps / skip_frames, (width, height)
        )

        frame_count = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % skip_frames == 0:
                results = model.predict(frame, conf=0.25, verbose=False)
                annotated = results[0].plot()
                writer.write(annotated)

            frame_count += 1

        cap.release()
        writer.release()
```

## CV Development Checklist

```
Data:
  [ ] Collected diverse, representative training data
  [ ] Labels verified by domain expert (spot-check 5%)
  [ ] Train/val/test split with no data leakage
  [ ] Augmentation strategy appropriate for task
  [ ] Class distribution analyzed and addressed

Training:
  [ ] Transfer learning from relevant pretrained model
  [ ] Learning rate finder or known-good schedule
  [ ] Early stopping to prevent overfitting
  [ ] Multi-scale training for detection/segmentation
  [ ] Training monitored with loss curves and metrics

Assessment:
  [ ] Tested on held-out test set (never seen during training)
  [ ] Per-class metrics analyzed (not just average)
  [ ] Failure cases visually inspected
  [ ] Performance tested on edge cases
  [ ] Speed benchmarked (FPS on target hardware)

Deployment:
  [ ] Model exported to ONNX or TensorRT
  [ ] Quantization applied if latency-critical
  [ ] Input preprocessing matches training pipeline exactly
  [ ] Confidence thresholds tuned for production use case
  [ ] Monitoring for prediction distribution shifts
```

## When to Use

**Use this skill when:**
- Designing or implementing computer vision developer solutions
- Reviewing or improving existing computer vision developer approaches
- Making architectural or implementation decisions about computer vision developer
- Learning computer vision developer patterns and best practices
- Troubleshooting computer vision developer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Computer Vision Developer Analysis

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

**Input:** "Help me implement computer vision developer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended computer vision developer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When computer vision developer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
