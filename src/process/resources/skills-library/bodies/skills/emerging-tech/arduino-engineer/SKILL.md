---
name: arduino-engineer
description: |
  Guides sensor integration, actuator control, serial communication, library usage, and project patterns for Arduino-based embedded systems
  Use when the user asks about arduino engineer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of arduino engineer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced iot guide beginner-friendly"
  category: "emerging-tech"
  subcategory: "embedded-iot"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Arduino Engineer

You are an expert Arduino embedded systems engineer. You guide developers through sensor integration, actuator control, serial communication, library selection, and robust project architecture for Arduino-based platforms.


## When to Use

**Use this skill when:**
- User asks about arduino engineer techniques or best practices
- User needs guidance on arduino engineer concepts
- User wants to implement or improve their approach to arduino engineer

**Do NOT use when:**
- The request falls outside the scope of arduino engineer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Core Platform Knowledge

### Arduino Board Selection Guide

| Board | MCU | Clock | SRAM | Flash | Best For |
|-------|-----|-------|------|-------|----------|
| Uno R3 | ATmega328P | 16 MHz | 2 KB | 32 KB | Learning, simple projects |
| Nano | ATmega328P | 16 MHz | 2 KB | 32 KB | Breadboard prototyping |
| Mega 2560 | ATmega2560 | 16 MHz | 8 KB | 256 KB | Complex multi-sensor |
| Due | ATSAM3X8E | 84 MHz | 96 KB | 512 KB | High-speed processing |
| Nano 33 IoT | SAMD21 | 48 MHz | 32 KB | 256 KB | WiFi/BLE IoT projects |
| Nano 33 BLE Sense | nRF52840 | 64 MHz | 256 KB | 1 MB | ML, multi-sensor |
| ESP32 (compatible) | Xtensa | 240 MHz | 520 KB | 4 MB | WiFi/BLE, dual-core |

### Project Structure Pattern

```
project-name/
├── project-name.ino        # Main sketch (setup/loop)
├── config.h                # Pin definitions, constants
├── sensors.h / sensors.cpp # Sensor abstraction layer
├── actuators.h / actuators.cpp
├── communication.h / communication.cpp
├── state_machine.h / state_machine.cpp
└── README.md
```

## Sensor Integration Patterns

### Analog Sensor Reading with Filtering

```cpp
// config.h
#define SENSOR_PIN A0
#define NUM_SAMPLES 10
#define SAMPLE_INTERVAL_MS 10

// Exponential Moving Average filter
class EMAFilter {
private:
    float alpha;
    float filtered;
    bool initialized;
public:
    EMAFilter(float smoothing = 0.1)
        : alpha(smoothing), filtered(0), initialized(false) {}

    float update(float raw) {
        if (!initialized) {
            filtered = raw;
            initialized = true;
        } else {
            filtered = alpha * raw + (1.0 - alpha) * filtered;
        }
        return filtered;
    }

    float value() const { return filtered; }
};

// Median filter for spike rejection
class MedianFilter {
private:
    float buffer[NUM_SAMPLES];
    int index;
    bool filled;
public:
    MedianFilter() : index(0), filled(false) {}

    float update(float raw) {
        buffer[index] = raw;
        index = (index + 1) % NUM_SAMPLES;
        if (index == 0) filled = true;

        int count = filled ? NUM_SAMPLES : index;
        float sorted[NUM_SAMPLES];
        memcpy(sorted, buffer, count * sizeof(float));

        // Simple insertion sort for small arrays
        for (int i = 1; i < count; i++) {
            float key = sorted[i];
            int j = i - 1;
            while (j >= 0 && sorted[j] > key) {
                sorted[j + 1] = sorted[j];
                j--;
            }
            sorted[j + 1] = key;
        }
        return sorted[count / 2];
    }
};
```

### Digital Sensor: I2C Communication

```cpp
#include <Wire.h> .// Generic I2C sensor reader pattern
class I2CSensor {
protected:
    uint8_t address;

    bool writeRegister(uint8_t reg, uint8_t value) {
        Wire.beginTransmission(address);
        Wire.write(reg);
        Wire.write(value);
        return Wire.endTransmission() == 0;
    }

    uint8_t readRegister(uint8_t reg) {
        Wire.beginTransmission(address);
        Wire.write(reg);
        Wire.endTransmission(false);
        Wire.requestFrom(address, (uint8_t)1);
        return Wire.available() ? Wire.read() : 0;
    }

    int16_t readRegister16(uint8_t reg) {
        Wire.beginTransmission(address);
        Wire.write(reg);
        Wire.endTransmission(false);
        Wire.requestFrom(address, (uint8_t)2);
        if (Wire.available() >= 2) {
            int16_t high = Wire.read() << 8;
            return high | Wire.read();
        }
        return 0;
    }

public:
    I2CSensor(uint8_t addr) : address(addr) {}
    virtual bool begin() = 0;
    virtual void read() = 0;
};
```

### SPI Sensor Communication

```cpp
#include <SPI.h>

#define CS_PIN 10

void spiSetup() {
    pinMode(CS_PIN, OUTPUT);
    digitalWrite(CS_PIN, HIGH);
    SPI.begin();
}

uint8_t spiReadRegister(uint8_t reg) {
    SPI.beginTransaction(SPISettings(1000000, MSBFIRST, SPI_MODE0));
    digitalWrite(CS_PIN, LOW);
    SPI.transfer(reg | 0x80);   // Read bit
    uint8_t result = SPI.transfer(0x00);
    digitalWrite(CS_PIN, HIGH);
    SPI.endTransaction();
    return result;
}

void spiWriteRegister(uint8_t reg, uint8_t value) {
    SPI.beginTransaction(SPISettings(1000000, MSBFIRST, SPI_MODE0));
    digitalWrite(CS_PIN, LOW);
    SPI.transfer(reg & 0x7F);  // Write bit
    SPI.transfer(value);
    digitalWrite(CS_PIN, HIGH);
    SPI.endTransaction();
}
```

## Actuator Control Patterns

### Servo with Smooth Movement

```cpp
#include <Servo.h>

class SmoothServo {
private:
    Servo servo;
    int currentAngle;
    int targetAngle;
    unsigned long lastMove;
    int stepDelay; // ms between steps

public:
    SmoothServo(int delay_ms = 15)
        : currentAngle(90), targetAngle(90), lastMove(0), stepDelay(delay_ms) {}

    void attach(int pin) {
        servo.attach(pin);
        servo.write(currentAngle);
    }

    void setTarget(int angle) {
        targetAngle = constrain(angle, 0, 180);
    }

    void update() {
        if (millis() - lastMove < (unsigned long)stepDelay) return;
        if (currentAngle == targetAngle) return;

        currentAngle += (targetAngle > currentAngle) ? 1 : -1;
        servo.write(currentAngle);
        lastMove = millis();
    }

    bool isMoving() const { return currentAngle != targetAngle; }
};
```

### Motor Control with L298N

```cpp
class DCMotor {
private:
    uint8_t pinA, pinB, pinEnable;

public:
    DCMotor(uint8_t a, uint8_t b, uint8_t en)
        : pinA(a), pinB(b), pinEnable(en) {}

    void begin() {
        pinMode(pinA, OUTPUT);
        pinMode(pinB, OUTPUT);
        pinMode(pinEnable, OUTPUT);
    }

    void forward(uint8_t speed) {
        digitalWrite(pinA, HIGH);
        digitalWrite(pinB, LOW);
        analogWrite(pinEnable, speed);
    }

    void reverse(uint8_t speed) {
        digitalWrite(pinA, LOW);
        digitalWrite(pinB, HIGH);
        analogWrite(pinEnable, speed);
    }

    void brake() {
        digitalWrite(pinA, HIGH);
        digitalWrite(pinB, HIGH);
        analogWrite(pinEnable, 0);
    }

    void coast() {
        digitalWrite(pinA, LOW);
        digitalWrite(pinB, LOW);
        analogWrite(pinEnable, 0);
    }
};
```

## Non-Blocking Architecture

### State Machine Pattern

```cpp
enum class SystemState {
    IDLE,
    READING_SENSORS,
    PROCESSING,
    ACTUATING,
    COMMUNICATING,
    ERROR
};

class StateMachine {
private:
    SystemState state;
    unsigned long stateEnteredAt;
    unsigned long stateTimeout;

public:
    StateMachine() : state(SystemState::IDLE), stateEnteredAt(0), stateTimeout(0) {}

    void transition(SystemState newState, unsigned long timeout = 0) {
        state = newState;
        stateEnteredAt = millis();
        stateTimeout = timeout;
    }

    bool isTimedOut() const {
        return stateTimeout > 0 && (millis() - stateEnteredAt > stateTimeout);
    }

    SystemState current() const { return state; }
    unsigned long elapsed() const { return millis() - stateEnteredAt; }
};
```

### Task Scheduler (Cooperative Multitasking)

```cpp
typedef void (*TaskFunction)();

struct Task {
    TaskFunction func;
    unsigned long interval;
    unsigned long lastRun;
    bool enabled;
};

#define MAX_TASKS 8

class TaskScheduler {
private:
    Task tasks[MAX_TASKS];
    int taskCount;

public:
    TaskScheduler() : taskCount(0) {}

    int addTask(TaskFunction func, unsigned long interval_ms) {
        if (taskCount >= MAX_TASKS) return -1;
        tasks[taskCount] = {func, interval_ms, 0, true};
        return taskCount++;
    }

    void enableTask(int id, bool enabled) {
        if (id >= 0 && id < taskCount) tasks[id].enabled = enabled;
    }

    void run() {
        unsigned long now = millis();
        for (int i = 0; i < taskCount; i++) {
            if (tasks[i].enabled && (now - tasks[i].lastRun >= tasks[i].interval)) {
                tasks[i].func();
                tasks[i].lastRun = now;
            }
        }
    }
};
```

## Serial Communication

### Robust Command Parser

```cpp
#define CMD_BUFFER_SIZE 64

class CommandParser {
private:
    char buffer[CMD_BUFFER_SIZE];
    int index;

public:
    CommandParser() : index(0) { buffer[0] = '\0'; }

    // Call in loop(), returns true when complete command received
    bool read() {
        while (Serial.available()) {
            char c = Serial.read();
            if (c == '\n' || c == '\r') {
                if (index > 0) {
                    buffer[index] = '\0';
                    index = 0;
                    return true;
                }
            } else if (index < CMD_BUFFER_SIZE - 1) {
                buffer[index++] = c;
            }
        }
        return false;
    }

    const char* command() const { return buffer; }

    bool matches(const char* cmd) const {
        return strncmp(buffer, cmd, strlen(cmd)) == 0;
    }

    int intArg(int argIndex) const {
        const char* p = buffer;
        int count = 0;
        while (*p && count <= argIndex) {
            if (*p == ' ') { count++; p++; continue; }
            if (count == argIndex) return atoi(p);
            while (*p && *p != ' ') p++;
        }
        return 0;
    }
};
```

## Memory Optimization

### PROGMEM for Constant Data

```cpp
// Store strings in flash instead of SRAM
const char msg_ready[] PROGMEM = "System ready";
const char msg_error[] PROGMEM = "Error detected";

const char* const messages[] PROGMEM = { msg_ready, msg_error };

void printFlashString(const char* flashStr) {
    char c;
    while ((c = pgm_read_byte(flashStr++))) {
        Serial.print(c);
    }
}

// Use F() macro for inline strings
Serial.println(F("This stays in flash memory"));
```

### Memory Usage Check

```cpp
int freeMemory() {
    extern int __heap_start, *__brkval;
    int v;
    return (int)&v - (__brkval == 0 ? (int)&__heap_start : (int)__brkval);
}

void reportMemory() {
    Serial.print(F("Free SRAM: "));
    Serial.print(freeMemory());
    Serial.println(F(" bytes"));
}
```

## Common Pitfalls

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Using `delay()` | Blocks entire program | Use millis()-based timing |
| Not debouncing buttons | Ghost triggers | Software debounce (20-50ms) |
| Reading floating analog pins | Random noise values | Use pull-up/pull-down resistors |
| String concatenation in loops | Heap fragmentation, crash | Use char arrays, snprintf |
| Ignoring return codes | Silent failures | Check Wire.endTransmission() |
| No watchdog timer | Unrecoverable hangs | Enable WDT for production |
| Global interrupt disable | Missed timing events | Keep critical sections short |

## Library Selection Guide

| Task | Recommended Library | Notes |
|------|-------------------|-------|
| WiFi (ESP) | WiFi.h / ESP8266WiFi | Built-in for ESP boards |
| Displays (OLED) | Adafruit SSD1306 + GFX | Wide hardware support |
| JSON | ArduinoJson | Efficient, well-documented |
| Temperature | DallasTemperature | OneWire DS18B20 sensors |
| Motor shields | Adafruit Motor Shield V2 | I2C-based, stackable |
| SD card | SD.h / SdFat | SdFat is faster |
| NeoPixels | FastLED | More features than Adafruit lib |
| Real-time clock | RTClib | DS1307, DS3231, PCF8523 |

## Exercises

1. **Sensor Dashboard**: Read 3 analog sensors with EMA filtering, output JSON over Serial at 1 Hz
2. **Non-Blocking Blinker**: Control 4 LEDs at different rates using the TaskScheduler pattern
3. **I2C Scanner**: Write a device scanner that probes all 127 addresses and reports found devices
4. **Command Interface**: Build a serial command parser that controls servo angle, LED brightness, and reads sensor values
5. **Memory Profiler**: Create a sketch that reports SRAM usage at each stage of initialization to find memory hogs


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to arduino engineer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Arduino Engineer Analysis

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

**Input:** "Help me with arduino engineer for my current situation"

**Output:**

Based on your situation, here is a structured approach to arduino engineer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
