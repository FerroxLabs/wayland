---
name: multimodal-ai-builder
description: |
  Multimodal AI pipeline design covering vision-language models, text-audio integration, image generation, model selection across modalities, preprocessing pipelines, fusion architectures, and production deployment of multi-modal inference systems.
  Use when the user asks about multimodal ai builder, multimodal ai builder best practices, or needs guidance on multimodal ai builder implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml guide best-practices"
  category: "ai-machine-learning"
  subcategory: "applied-ai"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Multimodal AI Builder

## Overview

Multimodal AI systems process and generate content across multiple data types -- text, images, audio, and video -- within unified architectures. Building production multimodal pipelines requires understanding modality-specific preprocessing, fusion strategies, model selection trade-offs, and serving infrastructure.

## Multimodal Architecture Patterns

```
Pattern 1: Late Fusion (Separate Encoders, Combined Output)
+----------+     +-----------+
| Text     | --> | Text Enc  | --+
+----------+     +-----------+   |    +----------+     +--------+
+----------+     +-----------+   +--> | Fusion   | --> | Output |
| Image    | --> | Vision Enc| --+    | Layer    |     | Head   |
+----------+     +-----------+   |    +----------+     +--------+
+----------+     +-----------+   |
| Audio    | --> | Audio Enc | --+
+----------+     +-----------+

Pattern 2: Early Fusion (Shared Tokenization)
All modalities -> Unified Tokenizer -> Shared Transformer -> Output

Pattern 3: Cross-Attention Fusion
Text Encoder <--cross-attention-- Vision Encoder features
```

## Model Selection Matrix

### Vision-Language Models

| Model | Provider | Max Image Res | Context | Latency | Cost/1M in |
|-------|----------|---------------|---------|---------|------------|
| GPT-4o | OpenAI | 2048x2048 | 128K | ~2s | $2.50 |
| Claude 3.5 Sonnet | Anthropic | 8000x8000 | 200K | ~2s | $3.00 |
| Gemini 1.5 Pro | Google | 3072x3072 | 2M | ~3s | $1.25 |
| LLaVA-NeXT | OSS | 672x672 | 4K | ~1s | Free (GPU) |
| Pixtral | Mistral | Variable | 128K | ~2s | $2.00 |

### Text-to-Speech / Speech-to-Text

| Model | Direction | Languages | Latency | Cost |
|-------|-----------|-----------|---------|------|
| Whisper large-v3 | STT | 99+ | ~0.3x RT | Free (OSS) |
| Deepgram Nova-2 | STT | 36+ | Real-time | $0.0043/min |
| OpenAI TTS-1-HD | TTS | ~20 | ~1s | $15/1M chars |
| ElevenLabs | TTS | 29+ | ~0.5s | $0.18/1K chars |
| Coqui XTTS-v2 | TTS | 17+ | ~2s | Free (OSS) |

### Model Selection Decision Tree

```
Text + Image Understanding:
  Need OCR / documents? -> Claude 3.5 Sonnet or GPT-4o
  Need video? -> Gemini 1.5 Pro (native video, long context)
  Self-hosted? -> LLaVA-NeXT or Qwen-VL
  Default -> GPT-4o

Text + Audio:
  Real-time transcription? -> Deepgram Nova-2
  Batch transcription? -> Whisper large-v3 (self-hosted)
  Voice cloning? -> ElevenLabs or Coqui XTTS-v2
  Default TTS -> OpenAI TTS-1-HD

Image Generation:
  Photorealism? -> Flux.1 Pro or Midjourney v6
  API automation? -> DALL-E 3 or Flux.1 Pro
  Self-hosted? -> Stable Diffusion XL
```

## Image Preprocessing Pipeline

```python
from PIL import Image
import base64
import io
from typing import Union

class ImagePreprocessor:
    """Prepare images for multimodal model input."""

    def __init__(self, max_pixels: int = 2048 * 2048, quality: int = 85):
        self.max_pixels = max_pixels
        self.quality = quality

    def load_and_preprocess(self, source: Union[str, bytes]) -> dict:
        """Load image and prepare for API."""
        img = Image.open(source if isinstance(source, str) else io.BytesIO(source))
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        img = self._resize_within_budget(img)
        return {"image": img, "base64": self._to_base64(img), "dimensions": img.size}

    def _resize_within_budget(self, img: Image.Image) -> Image.Image:
        w, h = img.size
        if w * h <= self.max_pixels:
            return img
        scale = (self.max_pixels / (w * h)) ** 0.5
        return img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    def _to_base64(self, img: Image.Image) -> str:
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=self.quality)
        return base64.b64encode(buffer.getvalue()).decode("utf-8")
```

## Vision-Language Inference

```python
from openai import OpenAI

class VisionLanguagePipeline:
    """Unified vision-language inference."""

    def __init__(self, model: str = "gpt-4o"):
        self.model = model
        self.client = OpenAI()
        self.preprocessor = ImagePreprocessor()

    def analyze_image(self, image_path: str, prompt: str) -> str:
        processed = self.preprocessor.load_and_preprocess(image_path)
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {
                        "url": f"data:image/jpeg;base64,{processed['base64']}",
                        "detail": "high",
                    }},
                ],
            }],
            max_tokens=4096,
        )
        return response.choices[0].message.content
```

## Audio Processing Pipeline

```python
import whisper
import librosa
import numpy as np

class SpeechToTextPipeline:
    """Speech-to-text with preprocessing."""

    def __init__(self, model_size: str = "large-v3", device: str = "cuda"):
        self.model = whisper.load_model(model_size, device=device)

    def transcribe(self, audio_path: str, language: str = None) -> dict:
        result = self.model.transcribe(
            audio_path, language=language, word_timestamps=True,
        )
        return {
            "text": result["text"],
            "language": result["language"],
            "segments": [
                {"start": s["start"], "end": s["end"], "text": s["text"].strip()}
                for s in result["segments"]
            ],
        }

def preprocess_audio(
    input_path: str, target_sr: int = 16000,
    normalize: bool = True, trim_silence: bool = True,
) -> np.ndarray:
    """Preprocess audio for model input."""
    audio, sr = librosa.load(input_path, sr=target_sr, mono=True)
    if trim_silence:
        audio, _ = librosa.effects.trim(audio, top_db=30)
    if normalize:
        peak = np.max(np.abs(audio))
        if peak > 0:
            audio = audio / peak * 0.95
    return audio
```

## Video Frame Extraction

```python
import cv2
from PIL import Image

def extract_keyframes(
    video_path: str, interval_sec: float = 2.0, max_frames: int = 50,
) -> list[dict]:
    """Extract representative frames from video for analysis."""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frames = []

    for frame_idx in range(0, total_frames, int(fps * interval_sec)):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if ret:
            img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            frames.append({"frame_idx": frame_idx, "timestamp": round(frame_idx / fps, 2), "image": img})
        if len(frames) >= max_frames:
            break
    cap.release()
    return frames
```

## Fusion Strategy Selection

| Fusion Type | Best For | Trade-off |
|-------------|----------|-----------|
| Late Fusion | Independent modalities | Simple but misses cross-modal patterns |
| Early Fusion | Tightly coupled modalities | Powerful but expensive to train |
| Cross-Attention | One modality conditions on another | Balanced complexity and performance |
| Bottleneck | Dimensionality reduction | Compact but may lose information |

## Cost Optimization

| Strategy | Savings | Implementation |
|----------|---------|----------------|
| Image resolution tiering | 30-60% | Low-res first, high-res only if needed |
| Audio chunking | 20-40% | Process only speech segments, skip silence |
| Model cascading | 40-70% | Cheap model first, expensive for hard cases |
| Caching | 50-90% | Hash inputs, cache identical requests |

### Model Cascading Pattern

```python
class MultimodalCascade:
    """Route to cheaper models first, escalate when needed."""

    def __init__(self):
        self.cheap_model = "gpt-4o-mini"
        self.expensive_model = "gpt-4o"
        self.client = OpenAI()

    def analyze_with_cascade(self, image_path: str, prompt: str) -> dict:
        result = self._call_model(self.cheap_model, image_path, prompt)
        confidence = self._estimate_confidence(result)
        if confidence >= 0.85:
            return {"result": result, "model_used": self.cheap_model, "cost": "low"}
        result = self._call_model(self.expensive_model, image_path, prompt)
        return {"result": result, "model_used": self.expensive_model, "cost": "high"}

    def _estimate_confidence(self, response: str) -> float:
        hedging = ["i'm not sure", "unclear", "might be", "possibly", "hard to tell"]
        count = sum(1 for p in hedging if p in response.lower())
        return max(0.0, 1.0 - count * 0.15)
```

## Production Serving Architecture

```
+-------------+     +------------------+     +--------------+
|  API        | --> | Router /         | --> | Text Model   |
|  Gateway    |     | Orchestrator     |     | (GPU Pool A) |
+-------------+     |  - Parse input   | --> +--------------+
                    |  - Route modality|     | Vision Model |
                    |  - Merge results | --> | (GPU Pool B) |
                    +------------------+     +--------------+
```

## Checklist

- [ ] Identify required modalities and select models for each
- [ ] Implement modality-specific preprocessing (image resizing, audio normalization)
- [ ] Choose fusion strategy matching the relationship between modalities
- [ ] Build input validation to reject malformed or oversized inputs
- [ ] Implement model cascading to optimize cost
- [ ] Set up GPU pool routing for different model types
- [ ] Add caching for repeated multimodal inputs
- [ ] Monitor latency, cost, and error rates per modality
- [ ] Test edge cases: corrupted images, silent audio, very long text
- [ ] Plan capacity for peak load across GPU pools

## When to Use

**Use this skill when:**
- Designing or implementing multimodal ai builder solutions
- Reviewing or improving existing multimodal ai builder approaches
- Making architectural or implementation decisions about multimodal ai builder
- Learning multimodal ai builder patterns and best practices
- Troubleshooting multimodal ai builder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Multimodal Ai Builder Analysis

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

**Input:** "Help me implement multimodal ai builder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended multimodal ai builder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When multimodal ai builder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
