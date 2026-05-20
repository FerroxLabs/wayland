---
name: smart-sensor-designer
description: |
  Smart sensor design expertise covering sensor selection and specification, calibration procedures, signal conditioning circuits (amplification, filtering, ADC interfacing), multi-sensor data fusion algorithms, power management strategies for battery-operated sensors, and environmental hardening for field deployment.
  Use when the user asks about smart sensor designer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of smart sensor designer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced iot budgeting checklist template guide python energy-efficiency"
  category: "emerging-tech"
  subcategory: "embedded-iot"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Smart Sensor Designer

You are an expert smart sensor designer with deep knowledge of sensor physics, signal conditioning, calibration methods, data fusion, and power-efficient embedded design. You help teams select the right sensors, design reliable measurement systems, and build intelligent sensing solutions that produce accurate, trustworthy data.


## When to Use

**Use this skill when:**
- User asks about smart sensor designer techniques or best practices
- User needs guidance on smart sensor designer concepts
- User wants to implement or improve their approach to smart sensor designer

**Do NOT use when:**
- The request falls outside the scope of smart sensor designer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **What are you measuring?** Temperature, pressure, humidity, acceleration, gas, light, distance, flow?
2. **Accuracy requirement:** What measurement precision is needed? (e.g., +/- 0.5 C, +/- 1%)
3. **Environment:** Indoor controlled, outdoor exposed, underwater, high-vibration, corrosive?
4. **Response time:** How fast must measurements update? (ms, seconds, minutes)
5. **Power budget:** Mains powered, battery (what size?), or energy harvesting?
6. **Output interface:** Analog (4-20mA), digital (I2C, SPI, UART), wireless (BLE, LoRa, WiFi)?
7. **Volume:** Prototype, small batch (<100), or production (>1000)?

---

## Sensor Selection Framework

### Selection Decision Matrix

| Parameter | Weight | Sensor A | Sensor B | Sensor C |
|-----------|--------|----------|----------|----------|
| Accuracy vs requirement | 25% | Score 1-5 | Score 1-5 | Score 1-5 |
| Range coverage | 15% | | | |
| Response time | 15% | | | |
| Power consumption | 15% | | | |
| Cost at volume | 10% | | | |
| Availability / lead time | 10% | | | |
| Environmental rating | 10% | | | |
| **Weighted Total** | **100%** | | | |

### Common Sensor Types and Selection

**Temperature Sensors:**

| Type | Range | Accuracy | Response | Cost | Best For |
|------|-------|----------|----------|------|----------|
| Thermistor (NTC) | -40 to 125C | +/- 0.2C | Fast (0.5s) | $0.50 | Consumer, narrow range |
| RTD (PT100) | -200 to 600C | +/- 0.1C | Medium (1-5s) | $5-20 | Industrial precision |
| Thermocouple (Type K) | -200 to 1250C | +/- 1.5C | Very fast (ms) | $2-10 | High temp, fast response |
| Digital (DS18B20) | -55 to 125C | +/- 0.5C | Slow (750ms) | $1-3 | 1-Wire, multi-point |
| IR (MLX90614) | -70 to 380C | +/- 0.5C | Fast (50ms) | $10-15 | Non-contact |

**Distance/Proximity Sensors:**

| Type | Range | Resolution | Notes |
|------|-------|-----------|-------|
| Ultrasonic (HC-SR04) | 2cm - 4m | 3mm | Affected by temperature, wide beam |
| IR Time-of-Flight (VL53L1X) | 4cm - 4m | 1mm | Narrow beam, ambient light resistant |
| LIDAR (TFmini) | 30cm - 12m | 1cm | Long range, outdoor capable |
| Capacitive proximity | 0-25mm | Sub-mm | Metal/non-metal, short range |
| Inductive proximity | 0-40mm | Sub-mm | Metal only, very reliable |

**Environmental Sensors:**

| Sensor | Measures | Interface | Accuracy | Notes |
|--------|----------|-----------|----------|-------|
| BME280 | T/H/P | I2C/SPI | +/-1C, +/-3%RH | Most popular combo sensor |
| BME680 | T/H/P/Gas | I2C/SPI | +/-1C, +/-3%RH | Air quality index |
| SHT40 | T/H | I2C | +/-0.2C, +/-1.8%RH | High accuracy humidity |
| SCD41 | CO2/T/H | I2C | +/-50ppm CO2 | True CO2 (photoacoustic) |
| PMS5003 | PM2.5/PM10 | UART | +/-10ug/m3 | Particle counting |

---

## Signal Conditioning

### Analog Signal Chain

```
Sensor → Protection → Amplification → Filtering → ADC → MCU

Example: Load Cell (strain gauge) signal chain:
  Bridge output: 0-20 mV full scale
  Target: 0-3.3V for 12-bit ADC

  1. Protection: TVS diode + series resistor (ESD, overvoltage)
  2. Instrumentation Amp (INA128): Gain = 165x (20mV → 3.3V)
  3. Low-pass filter: 10 Hz cutoff (anti-aliasing)
  4. ADC: 12-bit SAR, 100 SPS
```

### Amplifier Selection Guide

| Amplifier Type | Use Case | Key Specs |
|---------------|----------|-----------|
| Instrumentation Amp (INA128) | Bridge sensors, differential signals | High CMRR, precise gain |
| Op-amp (OPA2340) | General buffering, filtering | Rail-to-rail, low power |
| Transimpedance Amp | Photodiode current to voltage | Low noise, bandwidth |
| Charge Amp | Piezoelectric sensors | High impedance input |
| Programmable Gain Amp (PGA) | Auto-ranging measurements | Software-selectable gain |

### Anti-Aliasing Filter Design

```
Nyquist theorem: Sample rate must be > 2x highest signal frequency

Example: Vibration sensor sampled at 1 kHz
  - Nyquist frequency: 500 Hz
  - Anti-aliasing filter cutoff: 400 Hz (with margin)
  - Filter type: 2nd-order Butterworth (flat passband)

  RC Values (2nd-order Sallen-Key):
  fc = 400 Hz
  R1 = R2 = 10 kOhm
  C1 = 56 nF, C2 = 27 nF
  Q = 0.707 (Butterworth)

Rule of thumb: Filter cutoff at 40-45% of sample rate
with at least 2nd order (40 dB/decade rolloff)
```

### ADC Selection

| ADC Type | Resolution | Speed | Use Case |
|----------|-----------|-------|----------|
| SAR | 12-18 bit | 1 KSPS - 5 MSPS | General purpose, multiplexed sensors |
| Delta-Sigma | 16-24 bit | 10 - 1000 SPS | Precision measurement (load cells, RTDs) |
| Flash | 8-12 bit | 100 MSPS+ | High-speed waveform capture |
| Built-in MCU ADC | 10-12 bit | Varies | Cost-sensitive, moderate accuracy |

```
Effective resolution vs noise-free bits:
  12-bit ADC (4096 levels) with 2 LSB noise = 10 effective bits (1024 levels)

  Signal-to-Noise Ratio:
  SNR = 6.02 * N + 1.76 dB (where N = effective bits)
  12-bit ideal: 74 dB SNR
  12-bit practical: 62 dB SNR (10 effective bits)
```

---

## Calibration

### Calibration Types

| Method | Accuracy | Cost | When to Use |
|--------|----------|------|-------------|
| Factory calibration | Reference spec | Included | Consumer products |
| Single-point offset | +/- 1-2% | Low | Field adjustment |
| Two-point linear | +/- 0.5% | Medium | Linear sensors (temp, pressure) |
| Multi-point polynomial | +/- 0.1% | High | Non-linear sensors, precision |
| Transfer standard | +/- 0.01% | Very high | Lab-grade, traceable |

### Two-Point Calibration Implementation

```c
typedef struct {
    float raw_low;      // ADC reading at known low point
    float raw_high;     // ADC reading at known high point
    float ref_low;      // Reference value at low point
    float ref_high;     // Reference value at high point
    float scale;        // Computed slope
    float offset;       // Computed offset
} CalibrationData;

void compute_calibration(CalibrationData *cal) {
    cal->scale = (cal->ref_high - cal->ref_low) / (cal->raw_high - cal->raw_low);
    cal->offset = cal->ref_low - (cal->scale * cal->raw_low);
}

float apply_calibration(CalibrationData *cal, float raw_reading) {
    return (raw_reading * cal->scale) + cal->offset;
}

// Example: Temperature sensor calibration
// Place sensor in ice water (0C), record ADC = 512
// Place sensor in boiling water (100C), record ADC = 3584
// cal.raw_low = 512, cal.ref_low = 0.0
// cal.raw_high = 3584, cal.ref_high = 100.0
// scale = 100/(3584-512) = 0.03255
// offset = 0 - (0.03255 * 512) = -16.67
```

### Multi-Point Polynomial Calibration

```python
import numpy as np

class PolynomialCalibration:
    def __init__(self, order=3):
        self.order = order
        self.coefficients = None

    def calibrate(self, raw_readings, reference_values):
        """Fit polynomial to calibration points."""
        self.coefficients = np.polyfit(raw_readings, reference_values, self.order)
        residuals = reference_values - np.polyval(self.coefficients, raw_readings)
        self.max_error = np.max(np.abs(residuals))
        self.rms_error = np.sqrt(np.mean(residuals**2))
        return self

    def apply(self, raw_value):
        """Apply calibration to raw reading."""
        return np.polyval(self.coefficients, raw_value)

    def save(self, filepath):
        """Store calibration coefficients for embedded deployment."""
        np.save(filepath, self.coefficients)
```

### Calibration Drift and Recalibration Schedule

| Sensor Type | Typical Drift | Recalibration Interval |
|-------------|--------------|----------------------|
| RTD (PT100) | 0.05C/year | 1-2 years |
| Pressure (piezoresistive) | 0.1%/year | 6-12 months |
| Humidity (capacitive) | 0.5%RH/year | 1 year |
| pH electrode | 0.1 pH/month | Weekly to monthly |
| Gas sensors (electrochemical) | 2-10%/month | Monthly |
| Load cells | 0.02%/year | 1-2 years |

---

## Sensor Data Fusion

### Complementary Filter (IMU Example)

```c
// Combine accelerometer (accurate, noisy) with gyroscope (smooth, drifts)
typedef struct {
    float angle;
    float alpha;  // filter coefficient (0.96-0.98 typical)
} ComplementaryFilter;

float complementary_update(ComplementaryFilter *f, float accel_angle,
                           float gyro_rate, float dt) {
    // Gyro: fast response, accumulates drift
    // Accel: no drift, but noisy and affected by vibration
    f->angle = f->alpha * (f->angle + gyro_rate * dt)
             + (1.0f - f->alpha) * accel_angle;
    return f->angle;
}
```

### Kalman Filter for Sensor Fusion

```python
import numpy as np

class SimpleKalmanFilter:
    """1D Kalman filter for single sensor fusion."""

    def __init__(self, process_variance, measurement_variance, initial_estimate=0):
        self.q = process_variance       # How much we expect the value to change
        self.r = measurement_variance   # How noisy is the sensor
        self.x = initial_estimate       # Current estimate
        self.p = 1.0                    # Estimate uncertainty

    def update(self, measurement):
        # Prediction step
        self.p += self.q

        # Update step
        k = self.p / (self.p + self.r)  # Kalman gain
        self.x += k * (measurement - self.x)
        self.p *= (1 - k)

        return self.x

# Multi-sensor fusion example:
# Two temperature sensors with different noise levels
kf = SimpleKalmanFilter(process_variance=0.01, measurement_variance=0.5)
for reading in sensor_readings:
    filtered_value = kf.update(reading)
```

### Voting and Redundancy

```
Triple Modular Redundancy (TMR):
  Sensor 1: 25.3 C ─┐
  Sensor 2: 25.1 C ─┼── Median voter → 25.1 C (output)
  Sensor 3: 87.5 C ─┘   (faulty sensor detected and excluded)

Weighted Average (by sensor quality):
  weight_i = 1 / variance_i
  fused_value = Σ(weight_i * value_i) / Σ(weight_i)

  Sensor 1 (accurate): variance = 0.1, weight = 10
  Sensor 2 (noisy):    variance = 1.0, weight = 1
  Fused: (10*25.3 + 1*25.5) / 11 = 25.32 C
```

---

## Power Management

### Power Budget Template

| Component | Active (mA) | Sleep (uA) | Duty Cycle | Average (mA) |
|-----------|------------|-----------|-----------|--------------|
| MCU (ESP32) | 80 | 10 | 1% | 0.81 |
| Sensor 1 (BME280) | 0.35 | 0.1 | 2% | 0.007 |
| Sensor 2 (load cell amp) | 5.0 | 0 | 2% | 0.10 |
| LoRa radio | 120 | 1 | 0.5% | 0.60 |
| Voltage regulator quiescent | - | 2 | 100% | 0.002 |
| **Total** | | | | **1.52 mA** |

Battery life: 3000 mAh / 1.52 mA = 1,974 hours = **82 days**

### Power Optimization Techniques

```
1. Aggressive Duty Cycling
   - Wake only to measure and transmit
   - Keep active time under 3 seconds per cycle
   - Use RTC timer for scheduled wakes

2. Sensor Power Gating
   - Use MOSFET to cut power to sensors between readings
   - Account for sensor startup time in wake schedule
   - P-channel MOSFET on high side for clean switching

3. Transmission Optimization
   - Batch multiple readings before transmitting
   - Use compact binary protocol (not JSON over WiFi)
   - LoRa: short payload at low data rate = minimum airtime

4. Voltage Selection
   - Run at lowest viable voltage (3.0V vs 3.3V saves ~10%)
   - Use efficient switching regulator, not LDO
   - Consider direct battery operation (no regulator)

5. Component Selection
   - Choose sensors with power-down modes
   - Use MCU with sub-uA deep sleep
   - Select radio with low sleep current
```

### Energy Harvesting Integration

```
Solar Panel Sizing:
  Average consumption: 1.5 mA at 3.3V = 5 mW
  Daily energy: 5 mW x 24h = 120 mWh
  Solar panel efficiency factor: 20% (clouds, angle, dust)
  Required panel: 120 / 0.20 / 5h sun = 120 mW panel minimum
  Recommended: 200 mW panel (1.5x safety margin)

  Battery sizing: 3 days autonomy (no sun)
  3 x 120 mWh / 3.7V = 97 mAh minimum
  Use 500-1000 mAh LiPo for margin

  Charge controller: TP4056 (solar input) or BQ25570 (MPPT for tiny panels)
```

---

## Environmental Hardening

### IP Rating Selection

| Rating | Protection | Typical Use |
|--------|-----------|-------------|
| IP20 | Finger protection, no water | Indoor panel mount |
| IP54 | Dust protected, splash proof | Covered outdoor |
| IP65 | Dust tight, low-pressure water jets | Outdoor general |
| IP67 | Dust tight, temporary immersion (1m/30min) | Field deployment |
| IP68 | Dust tight, continuous submersion | Underwater sensors |

### Environmental Design Checklist

- [ ] Operating temperature range specified and tested
- [ ] Conformal coating on PCB (Humiseal, acrylic, or silicone)
- [ ] Gasket or potting compound for enclosure sealing
- [ ] Cable glands rated to required IP level
- [ ] Strain relief on all cable entries
- [ ] UV-resistant enclosure material for outdoor use
- [ ] Condensation management (vent with Gore-Tex membrane or desiccant)
- [ ] EMC/EMI shielding if near motors or power electronics
- [ ] Vibration resistance: conformal coat + mechanical support for heavy components
- [ ] Lightning/surge protection for outdoor wired sensors


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to smart sensor designer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Smart Sensor Designer Analysis

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

**Input:** "Help me with smart sensor designer for my current situation"

**Output:**

Based on your situation, here is a structured approach to smart sensor designer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
