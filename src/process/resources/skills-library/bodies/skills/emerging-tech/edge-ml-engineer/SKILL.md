---
name: edge-ml-engineer
description: |
  Guides TinyML deployment including model compression, on-device inference, hardware selection, data collection, and optimization for resource-constrained devices
  Use when the user asks about edge ml engineer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of edge ml engineer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced iot checklist guide python api-design cloud testing"
  category: "emerging-tech"
  subcategory: "embedded-iot"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Edge ML Engineer

You are an expert edge ML engineer specializing in TinyML. You guide developers through model design for microcontrollers, quantization and compression techniques, on-device inference optimization, hardware platform selection, data collection strategies, and production deployment of machine learning at the edge.


## When to Use

**Use this skill when:**
- User asks about edge ml engineer techniques or best practices
- User needs guidance on edge ml engineer concepts
- User wants to implement or improve their approach to edge ml engineer

**Do NOT use when:**
- The request falls outside the scope of edge ml engineer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Why Edge ML

### Cloud vs Edge Decision Matrix

| Factor | Cloud ML | Edge ML |
|--------|----------|---------|
| Latency | 50-500ms (network) | 1-50ms (local) |
| Privacy | Data leaves device | Data stays on device |
| Bandwidth | Continuous upload | Only results transmitted |
| Power | High (radio active) | Low (no transmission) |
| Cost at scale | Per-inference API cost | One-time model deployment |
| Connectivity | Required | Works offline |
| Model size | Unlimited | KB to low MB |
| Accuracy | State of the art | Good enough for task |

### Hardware Platform Selection

| Platform | Processor | RAM | Flash | ML Accelerator | Price | Best For |
|----------|-----------|-----|-------|----------------|-------|----------|
| Arduino Nano 33 BLE Sense | Cortex-M4 64MHz | 256KB | 1MB | None | ~$30 | Keyword, gesture |
| ESP32-S3 | Xtensa 240MHz | 512KB | 8MB | Vector instructions | ~$8 | Audio, vibration |
| STM32H747 | Cortex-M7 480MHz | 1MB | 2MB | None (fast CPU) | ~$25 | Vision, complex |
| Raspberry Pi Pico | RP2040 133MHz | 264KB | 2MB | None | ~$4 | Simple classification |
| MAX78000 | Cortex-M4 + CNN | 512KB | 512KB | CNN accelerator | ~$15 | Real-time vision |
| Nordic nRF5340 | Cortex-M33 128MHz | 512KB | 1MB | None | ~$12 | BLE + ML |
| Google Coral Micro | Cortex-M7 + TPU | 64MB | 128MB | Edge TPU | ~$30 | Vision, NLP |

## Model Development Pipeline

### Data Collection for Edge Devices

```python
#!/usr/bin/env python3
"""Data collection pipeline for TinyML training."""

import serial
import csv
import time
import numpy as np
from pathlib import Path


class SensorDataCollector:
    """Collect labeled sensor data from serial-connected device."""

    def __init__(self, port: str, baud: int = 115200):
        self.serial = serial.Serial(port, baud, timeout=1)
        self.data_dir = Path("dataset")
        self.data_dir.mkdir(exist_ok=True)

    def collect_class(self, class_name: str, duration_sec: int = 30,
                      sample_rate_hz: int = 100):
        """Collect data for a single class label."""
        output_file = self.data_dir / f"{class_name}.csv"
        samples = []

        print(f"Collecting '{class_name}' for {duration_sec}s...")
        print("Start the motion NOW!")
        time.sleep(1)

        start = time.time()
        while time.time() - start < duration_sec:
            line = self.serial.readline().decode().strip()
            if line:
                try:
                    values = [float(v) for v in line.split(",")]
                    values.append(time.time() - start)
                    samples.append(values)
                except ValueError:
                    continue

        with open(output_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["ax", "ay", "az", "gx", "gy", "gz", "timestamp"])
            writer.writerows(samples)

        print(f"Collected {len(samples)} samples -> {output_file}")
        return samples

    def create_windows(self, window_size: int = 128, stride: int = 64):
        """Segment continuous data into fixed-length windows."""
        windows = []
        labels = []

        for csv_file in self.data_dir.glob("*.csv"):
            class_name = csv_file.stem
            data = np.loadtxt(csv_file, delimiter=",", skiprows=1)
            sensor_data = data[:, :-1]  # Exclude timestamp

            for start in range(0, len(sensor_data) - window_size, stride):
                window = sensor_data[start:start + window_size]
                windows.append(window)
                labels.append(class_name)

        return np.array(windows), np.array(labels)
```

### TensorFlow Lite Micro Model Training

```python
#!/usr/bin/env python3
"""Train and convert model for TinyML deployment."""

import tensorflow as tf
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


def build_tiny_cnn(input_shape, num_classes):
    """Build a small CNN suitable for microcontroller deployment.

    Target: <50KB model size after quantization.
    """
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=input_shape),

        # Depthwise separable convolutions (much smaller than standard conv)
        tf.keras.layers.Conv1D(8, kernel_size=3, padding="same"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.ReLU(),
        tf.keras.layers.MaxPooling1D(pool_size=2),

        tf.keras.layers.DepthwiseConv1D(kernel_size=3, padding="same"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.ReLU(),
        tf.keras.layers.Conv1D(16, kernel_size=1),  # Pointwise
        tf.keras.layers.MaxPooling1D(pool_size=2),

        tf.keras.layers.GlobalAveragePooling1D(),
        tf.keras.layers.Dense(num_classes, activation="softmax")
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model


def quantize_model(model, representative_data):
    """Convert to int8 quantized TFLite model for MCU deployment."""

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]

    # Full integer quantization (required for most MCUs)
    def representative_dataset():
        for i in range(min(200, len(representative_data))):
            sample = representative_data[i:i+1].astype(np.float32)
            yield [sample]

    converter.representative_dataset = representative_dataset
    converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
    converter.inference_input_type = tf.int8
    converter.inference_output_type = tf.int8

    tflite_model = converter.convert()

    # Save model
    with open("model_quantized.tflite", "wb") as f:
        f.write(tflite_model)

    print(f"Model size: {len(tflite_model):,} bytes "
          f"({len(tflite_model)/1024:.1f} KB)")
    return tflite_model


def convert_to_c_array(tflite_model, output_path="model_data.h"):
    """Convert TFLite model to C header file for embedding in firmware."""

    hex_values = ", ".join(f"0x{b:02x}" for b in tflite_model)

    header = f"""/* Auto-generated model data - DO NOT EDIT */
#ifndef MODEL_DATA_H
#define MODEL_DATA_H

#include <stdint.h>

alignas(16) const uint8_t model_data[] = {{
    {hex_values}
}};

const unsigned int model_data_len = {len(tflite_model)};

#endif /* MODEL_DATA_H */
"""
    with open(output_path, "w") as f:
        f.write(header)

    print(f"C header written: {output_path}")
```

### Model Size Optimization Techniques

| Technique | Size Reduction | Accuracy Impact | Complexity |
|-----------|---------------|-----------------|------------|
| Int8 quantization | 4x smaller | <2% loss typical | Low |
| Pruning (50%) | ~2x smaller | 1-3% loss | Medium |
| Knowledge distillation | 3-10x smaller | 2-5% loss | High |
| Depthwise separable conv | 8-9x fewer params | Minimal | Low |
| Weight sharing | 2-4x smaller | 1-2% loss | Medium |
| Architecture search | Optimal for target | Varies | Very high |

## On-Device Inference

### TensorFlow Lite Micro Inference (C++)

```cpp
/* inference.cpp - TFLite Micro inference on microcontroller */

#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/micro/micro_mutable_op_resolver.h"
#include "tensorflow/lite/schema/schema_generated.h"
#include "model_data.h"

/* Arena size depends on model - start large, reduce until it fails */
constexpr int kArenaSize = 32 * 1024;  /* 32 KB */
alignas(16) uint8_t tensor_arena[kArenaSize];

/* Class labels */
const char* labels[] = {"idle", "walking", "running", "jumping"};
constexpr int kNumClasses = 4;

class TinyMLInference {
private:
    const tflite::Model* model;
    tflite::MicroInterpreter* interpreter;
    TfLiteTensor* input;
    TfLiteTensor* output;

    /* Only register ops your model actually uses */
    tflite::MicroMutableOpResolver<6> resolver;

public:
    bool init() {
        model = tflite::GetModel(model_data);
        if (model->version() != TFLITE_SCHEMA_VERSION) {
            return false;
        }

        /* Register only required operations */
        resolver.AddConv2D();
        resolver.AddDepthwiseConv2D();
        resolver.AddMaxPool2D();
        resolver.AddFullyConnected();
        resolver.AddReshape();
        resolver.AddSoftmax();

        static tflite::MicroInterpreter static_interpreter(
            model, resolver, tensor_arena, kArenaSize);
        interpreter = &static_interpreter;

        if (interpreter->AllocateTensors() != kTfLiteOk) {
            return false;
        }

        input = interpreter->input(0);
        output = interpreter->output(0);

        /* Report memory usage */
        size_t used = interpreter->arena_used_bytes();
        printf("Arena: %u / %u bytes used (%.1f%%)\n",
               used, kArenaSize, 100.0f * used / kArenaSize);

        return true;
    }

    int classify(const float* sensor_data, int data_length, float* confidence) {
        /* Quantize input */
        float input_scale = input->params.scale;
        int32_t input_zero = input->params.zero_point;

        for (int i = 0; i < data_length; i++) {
            int8_t quantized = (int8_t)(sensor_data[i] / input_scale + input_zero);
            input->data.int8[i] = quantized;
        }

        /* Run inference */
        uint32_t start_us = micros();
        if (interpreter->Invoke() != kTfLiteOk) {
            return -1;
        }
        uint32_t elapsed_us = micros() - start_us;
        printf("Inference: %u us\n", elapsed_us);

        /* Dequantize output and find best class */
        float output_scale = output->params.scale;
        int32_t output_zero = output->params.zero_point;

        int best_class = 0;
        float best_score = -1.0f;

        for (int i = 0; i < kNumClasses; i++) {
            float score = (output->data.int8[i] - output_zero) * output_scale;
            if (score > best_score) {
                best_score = score;
                best_class = i;
            }
        }

        *confidence = best_score;
        return best_class;
    }
};
```

### Keyword Spotting Example

```cpp
/* keyword_detection.cpp - Wake word detection pipeline */

#include "feature_extraction.h"
#include "inference.h"

#define AUDIO_SAMPLE_RATE 16000
#define WINDOW_SIZE_MS    30
#define WINDOW_STRIDE_MS  20
#define NUM_MFCC          13
#define NUM_FRAMES        49  /* ~1 second of audio */
#define DETECTION_THRESHOLD 0.85f

/* Ring buffer for audio samples */
class AudioBuffer {
    int16_t buffer[AUDIO_SAMPLE_RATE];  /* 1 second circular buffer */
    volatile int write_idx;

public:
    AudioBuffer() : write_idx(0) {}

    void push_samples(const int16_t* samples, int count) {
        for (int i = 0; i < count; i++) {
            buffer[write_idx] = samples[i];
            write_idx = (write_idx + 1) % AUDIO_SAMPLE_RATE;
        }
    }

    void get_latest(int16_t* out, int count) {
        int start = (write_idx - count + AUDIO_SAMPLE_RATE) % AUDIO_SAMPLE_RATE;
        for (int i = 0; i < count; i++) {
            out[i] = buffer[(start + i) % AUDIO_SAMPLE_RATE];
        }
    }
};

class KeywordDetector {
    AudioBuffer audio_buf;
    MFCCExtractor mfcc;
    TinyMLInference model;
    float features[NUM_FRAMES * NUM_MFCC];

    int consecutive_detections;
    static const int REQUIRED_CONSECUTIVE = 2;

public:
    bool init() {
        mfcc.init(AUDIO_SAMPLE_RATE, WINDOW_SIZE_MS, WINDOW_STRIDE_MS, NUM_MFCC);
        return model.init();
    }

    bool process_audio_chunk(const int16_t* samples, int count) {
        audio_buf.push_samples(samples, count);

        /* Extract MFCC features from latest 1 second */
        int16_t audio[AUDIO_SAMPLE_RATE];
        audio_buf.get_latest(audio, AUDIO_SAMPLE_RATE);
        mfcc.compute(audio, AUDIO_SAMPLE_RATE, features);

        /* Run inference */
        float confidence;
        int result = model.classify(features, NUM_FRAMES * NUM_MFCC, &confidence);

        if (result == 1 && confidence > DETECTION_THRESHOLD) {
            consecutive_detections++;
            if (consecutive_detections >= REQUIRED_CONSECUTIVE) {
                consecutive_detections = 0;
                return true;  /* Keyword detected */
            }
        } else {
            consecutive_detections = 0;
        }

        return false;
    }
};
```

## Performance Benchmarking

### Inference Profiling

```python
#!/usr/bin/env python3
"""Profile TFLite model on target hardware via serial."""

import serial
import json
import statistics


def benchmark_model(port: str, num_runs: int = 100):
    """Send benchmark command and collect timing data."""
    ser = serial.Serial(port, 115200, timeout=5)

    ser.write(b"BENCH\n")
    times = []

    for _ in range(num_runs):
        line = ser.readline().decode().strip()
        if line.startswith("INFER:"):
            us = int(line.split(":")[1])
            times.append(us)

    if times:
        print(f"Inference timing ({num_runs} runs):")
        print(f"  Mean:   {statistics.mean(times):>8.1f} us")
        print(f"  Median: {statistics.median(times):>8.1f} us")
        print(f"  Std:    {statistics.stdev(times):>8.1f} us")
        print(f"  Min:    {min(times):>8d} us")
        print(f"  Max:    {max(times):>8d} us")
        print(f"  FPS:    {1_000_000 / statistics.mean(times):>8.1f}")

    ser.close()
```

## Model Optimization Checklist

| Step | Action | Tool |
|------|--------|------|
| 1 | Profile baseline model size and accuracy | TF Model Summary |
| 2 | Replace Conv2D with DepthwiseConv2D | Manual architecture |
| 3 | Reduce input resolution if possible | Data pipeline |
| 4 | Apply post-training int8 quantization | TFLite Converter |
| 5 | Prune weights below threshold | TF Model Optimization Toolkit |
| 6 | Measure on-device inference time | Serial profiling |
| 7 | Reduce arena size to minimum | Binary search |
| 8 | Test accuracy on held-out validation set | Python evaluation |

## Common Pitfalls

| Mistake | Impact | Solution |
|---------|--------|----------|
| Training on desktop data only | Poor real-world accuracy | Collect data on target hardware |
| Float32 model on MCU | Too large, too slow | Always quantize to int8 |
| Oversized arena | Wasted RAM | Profile and minimize arena |
| No data augmentation | Overfitting to lab conditions | Add noise, shifts, scaling |
| Ignoring preprocessing | Input format mismatch | Match train-time preprocessing exactly |
| One-shot detection | False positives | Require consecutive detections |
| No model versioning | Deployment confusion | Version models, track in firmware |

## Exercises

1. **Gesture Classifier**: Train a 3-class accelerometer gesture model (<20KB), deploy on Arduino Nano 33 BLE Sense
2. **Anomaly Detector**: Build an autoencoder for vibration anomaly detection on ESP32, trigger alert on reconstruction error
3. **Keyword Spotter**: Train a 4-keyword audio model using MFCC features, deploy with streaming inference
4. **Quantization Study**: Compare float32, float16, and int8 model variants for size, speed, and accuracy on the same task
5. **Power Profiler**: Measure current draw during inference vs idle, calculate battery life for continuous classification


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to edge ml engineer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Edge Ml Engineer Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with edge ml engineer for my current situation"

**Output:**

Based on your situation, here is a structured approach to edge ml engineer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
