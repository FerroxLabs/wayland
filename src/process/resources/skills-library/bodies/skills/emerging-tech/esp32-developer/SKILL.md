---
name: esp32-developer
description: |
  ESP32 microcontroller development expertise covering WiFi and BLE connectivity, MicroPython and Arduino framework programming, deep sleep power management, OTA firmware updates, sensor integration, FreeRTOS task management, and practical IoT project patterns for ESP32-S3, C3, and classic variants.
  Use when the user asks about esp32 developer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of esp32 developer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced iot beginner-friendly python planning networking performing-arts sleep"
  category: "emerging-tech"
  subcategory: "embedded-iot"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# ESP32 Developer

You are an expert ESP32 developer with deep experience building WiFi and BLE-connected IoT devices. You work fluently across the Arduino framework and MicroPython, understand FreeRTOS fundamentals, and specialize in power-efficient designs with reliable OTA update mechanisms.


## When to Use

**Use this skill when:**
- User asks about esp32 developer techniques or best practices
- User needs guidance on esp32 developer concepts
- User wants to implement or improve their approach to esp32 developer

**Do NOT use when:**
- The request falls outside the scope of esp32 developer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **ESP32 variant:** Classic ESP32, ESP32-S2, ESP32-S3 (USB OTG, AI acceleration), or ESP32-C3 (RISC-V)?
2. **Framework preference:** Arduino, ESP-IDF (native C), or MicroPython?
3. **Connectivity:** WiFi only, BLE only, or both? Any mesh networking needs?
4. **Power source:** USB powered, battery (what capacity?), or solar?
5. **Sensors/peripherals:** What sensors, displays, actuators are you connecting?
6. **Production or prototype?** One-off project or planning to manufacture?
7. **Update mechanism:** Will devices need OTA updates in the field?

---

## ESP32 Variant Selection

| Feature | ESP32 (Classic) | ESP32-S2 | ESP32-S3 | ESP32-C3 |
|---------|----------------|----------|----------|----------|
| CPU | Dual-core Xtensa 240MHz | Single-core Xtensa 240MHz | Dual-core Xtensa 240MHz | Single-core RISC-V 160MHz |
| WiFi | 802.11 b/g/n | 802.11 b/g/n | 802.11 b/g/n | 802.11 b/g/n |
| Bluetooth | BT 4.2 + BLE | None | BLE 5.0 | BLE 5.0 |
| USB | No native | USB OTG | USB OTG | No native |
| AI acceleration | None | None | Vector instructions | None |
| Best for | General purpose | Cost-sensitive WiFi | Camera/AI/USB | Low-cost BLE+WiFi |
| Deep sleep current | ~10 uA | ~5 uA | ~8 uA | ~5 uA |

---

## Arduino Framework

### Project Setup (PlatformIO)

```ini
; platformio.ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
lib_deps =
    knolleary/PubSubClient@^2.8
    bblanchon/ArduinoJson@^7.0
    adafruit/Adafruit BME280 Library@^2.2
upload_speed = 921600
board_build.partitions = min_spiffs.csv
```

### WiFi Connection with Reconnection Logic

```cpp
#include <WiFi.h>
#include <WiFiManager.h> .// Captive portal for config

const char* WIFI_SSID = "MyNetwork";
const char* WIFI_PASS = "MyPassword";
unsigned long lastReconnectAttempt = 0;

void setupWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nConnected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\nWiFi connection failed - entering AP mode");
    startCaptivePortal();
  }
}

// Alternative: WiFiManager captive portal (user configures via phone)
void startCaptivePortal() {
  WiFiManager wm;
  wm.setConfigPortalTimeout(180);  // 3 minute timeout
  if (!wm.autoConnect("ESP32-Setup")) {
    Serial.println("Portal timeout - restarting");
    ESP.restart();
  }
}

void ensureWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    unsigned long now = millis();
    if (now - lastReconnectAttempt > 5000) {
      lastReconnectAttempt = now;
      WiFi.reconnect();
    }
  }
}
```

### BLE Server (Peripheral)

```cpp
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLECharacteristic *pCharacteristic;
bool deviceConnected = false;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) { deviceConnected = true; }
  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    pServer->startAdvertising();  // Restart advertising
  }
};

class CharCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pChar) {
    String value = pChar->getValue();
    Serial.printf("Received: %s\n", value.c_str());
    // Process command from BLE client
  }
};

void setupBLE() {
  BLEDevice::init("ESP32-Sensor");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_WRITE |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pCharacteristic->addDescriptor(new BLE2902());
  pCharacteristic->setCallbacks(new CharCallbacks());

  pService->start();
  pServer->getAdvertising()->start();
}

void notifySensorData(float temperature) {
  if (deviceConnected) {
    char buf[16];
    snprintf(buf, sizeof(buf), "%.2f", temperature);
    pCharacteristic->setValue(buf);
    pCharacteristic->notify();
  }
}
```

### MQTT Integration

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

WiFiClient espClient;
PubSubClient mqtt(espClient);

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  JsonDocument doc;
  deserializeJson(doc, payload, length);
  const char* command = doc["cmd"];

  if (strcmp(command, "set_interval") == 0) {
    sensorInterval = doc["value"].as<int>();
  }
}

void setupMQTT() {
  mqtt.setServer("broker.hivemq.com", 1883);
  mqtt.setCallback(mqttCallback);
  mqtt.setBufferSize(512);
}

void ensureMQTT() {
  if (!mqtt.connected()) {
    String clientId = "esp32-" + String(WiFi.macAddress());
    if (mqtt.connect(clientId.c_str(), "user", "pass")) {
      mqtt.subscribe("home/esp32/commands");
      Serial.println("MQTT connected");
    }
  }
  mqtt.loop();
}

void publishSensorData(float temp, float humidity) {
  JsonDocument doc;
  doc["device"] = WiFi.macAddress();
  doc["temperature"] = temp;
  doc["humidity"] = humidity;
  doc["uptime"] = millis() / 1000;

  char buffer[256];
  serializeJson(doc, buffer);
  mqtt.publish("home/sensors/living-room", buffer, true);  // retained
}
```

---

## Deep Sleep and Power Management

### Sleep Mode Comparison

| Mode | Current Draw | Wake Sources | Wake Time | Use Case |
|------|-------------|-------------|-----------|----------|
| Active (WiFi) | 80-240 mA | N/A | N/A | Continuous operation |
| Modem sleep | 15-20 mA | Timer, GPIO | Instant | WiFi keepalive |
| Light sleep | 0.8 mA | Timer, GPIO, touch, UART | <1 ms | Fast response needed |
| Deep sleep | 10-150 uA | Timer, ext0/ext1, touch, ULP | ~250 ms | Battery sensor nodes |
| Hibernation | 2.5 uA | Timer, ext0 only | ~250 ms | Maximum battery life |

### Deep Sleep Implementation

```cpp
#include <esp_sleep.h>

#define SLEEP_DURATION_US  300000000ULL  // 5 minutes in microseconds
#define WAKEUP_PIN         GPIO_NUM_33

// RTC memory survives deep sleep
RTC_DATA_ATTR int bootCount = 0;
RTC_DATA_ATTR float lastReading = 0;

void enterDeepSleep() {
  Serial.println("Entering deep sleep...");

  // Disable WiFi and BLE before sleeping
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  btStop();

  // Configure wake sources
  esp_sleep_enable_timer_wakeup(SLEEP_DURATION_US);
  esp_sleep_enable_ext0_wakeup(WAKEUP_PIN, LOW);  // Wake on button press

  // Reduce power: disable unused peripherals
  esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_OFF);
  esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_SLOW_MEM, ESP_PD_OPTION_ON);  // Keep RTC memory

  Serial.flush();
  esp_deep_sleep_start();
  // Code after this line never executes - device resets on wake
}

void setup() {
  bootCount++;
  Serial.begin(115200);

  esp_sleep_wakeup_cause_t wakeup = esp_sleep_get_wakeup_cause();
  switch (wakeup) {
    case ESP_SLEEP_WAKEUP_TIMER:
      Serial.println("Woke from timer");
      break;
    case ESP_SLEEP_WAKEUP_EXT0:
      Serial.println("Woke from button");
      break;
    default:
      Serial.println("Initial boot");
      break;
  }

  // Read sensor, send data, go back to sleep
  float reading = readSensor();
  if (abs(reading - lastReading) > 0.5 || wakeup == ESP_SLEEP_WAKEUP_EXT0) {
    connectWiFiAndSend(reading);
    lastReading = reading;
  }
  enterDeepSleep();
}
```

### Battery Life Estimation

```
Battery Life = Battery Capacity (mAh) / Average Current (mA)

Example: 2000mAh battery, sensor reading every 5 minutes
- Active time per cycle: ~3 seconds at 150mA = 0.125 mAh
- Sleep time per cycle: ~297 seconds at 0.01mA = 0.0008 mAh
- Per cycle: 0.126 mAh
- Cycles per hour: 12
- Hourly consumption: 1.51 mAh
- Battery life: 2000 / 1.51 = ~1,325 hours = ~55 days

Optimization: Send data only when value changes significantly
- Reduces WiFi connections by 80-90%
- Battery life extends to 200+ days
```

---

## OTA (Over-The-Air) Updates

### Basic OTA with ArduinoOTA

```cpp
#include <ArduinoOTA.h>

void setupOTA() {
  ArduinoOTA.setHostname("esp32-living-room");
  ArduinoOTA.setPassword("ota-password");

  ArduinoOTA.onStart([]() { Serial.println("OTA Start"); });
  ArduinoOTA.onEnd([]() { Serial.println("OTA End"); });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
  });

  ArduinoOTA.begin();
}

void loop() {
  ArduinoOTA.handle();  // Must be called regularly
  // ... rest of loop
}
```

### HTTP OTA with Version Checking

```cpp
#include <HTTPClient.h>
#include <Update.h>

const char* FW_VERSION = "1.2.0";
const char* FW_URL = "[external resource]";
const char* VERSION_URL = "[external resource]";

void checkForUpdate() {
  HTTPClient http;
  http.begin(VERSION_URL);
  int httpCode = http.GET();

  if (httpCode == 200) {
    JsonDocument doc;
    deserializeJson(doc, http.getString());
    const char* latestVersion = doc["version"];

    if (strcmp(latestVersion, FW_VERSION) != 0) {
      Serial.printf("Update available: %s -> %s\n", FW_VERSION, latestVersion);
      performOTA();
    }
  }
  http.end();
}

void performOTA() {
  HTTPClient http;
  http.begin(FW_URL);
  int httpCode = http.GET();

  if (httpCode == 200) {
    int contentLength = http.getSize();
    WiFiClient *stream = http.getStreamPtr();

    if (Update.begin(contentLength)) {
      size_t written = Update.writeStream(*stream);
      if (written == contentLength) {
        Serial.println("OTA written successfully");
      }
      if (Update.end()) {
        Serial.println("OTA success - rebooting");
        ESP.restart();
      }
    }
  }
  http.end();
}
```

---

## MicroPython

### Setup and Basic Patterns

```python
# boot.py - runs on every startup
import network
import time

def connect_wifi(ssid, password, timeout=10):
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        wlan.connect(ssid, password)
        start = time.time()
        while not wlan.isconnected():
            if time.time() - start > timeout:
                raise RuntimeError("WiFi connection timeout")
            time.sleep(0.5)
    print(f"Connected: {wlan.ifconfig()[0]}")
    return wlan

wlan = connect_wifi("MyNetwork", "MyPassword")
```

```python
# main.py - application logic
import machine
import dht
import ujson
from umqtt.simple import MQTTClient
import time

# Sensor setup
sensor = dht.DHT22(machine.Pin(4))

# MQTT setup
client = MQTTClient("esp32", "broker.hivemq.com")
client.connect()

# Deep sleep function
def deep_sleep(duration_ms):
    rtc = machine.RTC()
    rtc.memory(b'sensor_wake')  # Persist data across sleep
    machine.deepsleep(duration_ms)

# Main loop
while True:
    try:
        sensor.measure()
        data = {
            "temperature": sensor.temperature(),
            "humidity": sensor.humidity(),
            "free_mem": gc.mem_free()
        }
        client.publish("home/sensor", ujson.dumps(data))
    except Exception as e:
        print(f"Error: {e}")

    time.sleep(60)  # Or use deep_sleep(300000) for 5 min sleep
```

### MicroPython vs Arduino Decision

| Factor | MicroPython | Arduino (C++) |
|--------|------------|---------------|
| Development speed | Fast (REPL, no compile) | Slower (compile/upload cycle) |
| Performance | 10-100x slower | Native speed |
| Memory usage | Higher overhead (~80KB) | Minimal overhead |
| Library ecosystem | Smaller | Massive |
| Best for | Prototyping, simple logic | Production, performance-critical |
| OTA updates | Upload .py files | Flash full firmware |

---

## FreeRTOS Task Management

```cpp
// Multi-tasking: sensor reading + MQTT + display
TaskHandle_t sensorTask, mqttTask, displayTask;

void sensorTaskFunc(void *param) {
  while (true) {
    float temp = readTemperature();
    xQueueSend(sensorQueue, &temp, portMAX_DELAY);
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}
void mqttTaskFunc(void *param) {
  while (true) {
    float temp;
    if (xQueueReceive(sensorQueue, &temp, pdMS_TO_TICKS(5000))) {
      publishSensorData(temp);
    }
    ensureMQTT();
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

void setup() {
  sensorQueue = xQueueCreate(10, sizeof(float));
  xTaskCreatePinnedToCore(sensorTaskFunc, "Sensor", 4096, NULL, 2, &sensorTask, 0);
  xTaskCreatePinnedToCore(mqttTaskFunc, "MQTT", 8192, NULL, 1, &mqttTask, 1);
  // Core 0: sensor + BLE, Core 1: WiFi + MQTT (WiFi runs on core 0 by default)
}
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to esp32 developer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Esp32 Developer Analysis

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

**Input:** "Help me with esp32 developer for my current situation"

**Output:**

Based on your situation, here is a structured approach to esp32 developer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
