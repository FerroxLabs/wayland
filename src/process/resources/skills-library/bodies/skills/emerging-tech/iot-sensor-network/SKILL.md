---
name: iot-sensor-network
description: |
  Guides design and deployment of mesh sensor networks including data collection, power management, communication protocols, and fleet management
  Use when the user asks about iot sensor network, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of iot sensor network or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced iot budgeting guide python automation networking sleep"
  category: "emerging-tech"
  subcategory: "embedded-iot"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# IoT Sensor Network

You are an expert IoT sensor network architect. You guide developers through mesh networking topologies, data collection pipelines, power management strategies, communication protocol selection, and scalable fleet management for distributed sensor deployments.


## When to Use

**Use this skill when:**
- User asks about iot sensor network techniques or best practices
- User needs guidance on iot sensor network concepts
- User wants to implement or improve their approach to iot sensor network

**Do NOT use when:**
- The request falls outside the scope of iot sensor network
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Network Topology Selection

### Topology Comparison

| Topology | Range | Scalability | Power | Complexity | Reliability | Best For |
|----------|-------|-------------|-------|------------|-------------|----------|
| Star | Short | Low (<20) | Low | Simple | Single point failure | Small indoor |
| Mesh | Extended | High (100+) | Medium | Complex | Self-healing | Large area |
| Tree | Medium | Medium | Medium | Medium | Branch failure | Hierarchical |
| Star-of-Stars | Extended | High | Low-Med | Medium | Gateway redundancy | Multi-room |

### Protocol Selection Matrix

| Protocol | Range | Data Rate | Power | Topology | License | Nodes |
|----------|-------|-----------|-------|----------|---------|-------|
| WiFi | 50m | 54+ Mbps | High | Star | ISM | ~32 |
| BLE Mesh | 30m | 2 Mbps | Very Low | Mesh | ISM | 32K |
| Zigbee | 100m | 250 kbps | Low | Mesh/Star | ISM | 65K |
| Z-Wave | 100m | 100 kbps | Low | Mesh | Licensed | 232 |
| LoRa | 15km | 50 kbps | Very Low | Star | ISM | 1000s |
| Thread | 30m | 250 kbps | Low | Mesh | ISM | 250+ |
| ESP-NOW | 200m | 1 Mbps | Low | Star/Mesh | ISM | 20 |

## ESP-NOW Mesh Network

### Sensor Node (ESP32)

```c
/* sensor_node.c - Battery-powered sensor node using ESP-NOW */

#include <esp_now.h>
#include <esp_wifi.h>
#include <esp_sleep.h>
#include <nvs_flash.h>
#include <string.h>

#define GATEWAY_MAC {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF}
#define SLEEP_DURATION_US (300 * 1000000ULL)  /* 5 minutes */
#define SENSOR_PIN ADC1_CHANNEL_0
#define BATTERY_PIN ADC1_CHANNEL_3

typedef struct __attribute__((packed)) {
    uint8_t  node_id;
    uint8_t  msg_type;      /* 0=data, 1=heartbeat, 2=alert */
    uint16_t sequence;
    float    temperature;
    float    humidity;
    float    battery_v;
    uint32_t uptime_ms;
} sensor_packet_t;

static uint16_t seq_num = 0;
static uint8_t gateway_mac[] = GATEWAY_MAC;

RTC_DATA_ATTR static uint16_t boot_count = 0;

static void on_data_sent(const uint8_t *mac, esp_now_send_status_t status) {
    if (status != ESP_NOW_SEND_SUCCESS) {
        /* Store in NVS for retry on next wake */
        store_failed_packet();
    }
}

static void init_espnow(void) {
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    esp_wifi_init(&cfg);
    esp_wifi_set_mode(WIFI_MODE_STA);
    esp_wifi_start();

    esp_now_init();
    esp_now_register_send_cb(on_data_sent);

    esp_now_peer_info_t peer = {
        .channel = 1,
        .encrypt = false
    };
    memcpy(peer.peer_addr, gateway_mac, 6);
    esp_now_add_peer(&peer);
}

static float read_battery_voltage(void) {
    /* Voltage divider: 100K/100K, Vmax = 4.2V -> ADC max ~2.1V */
    int raw = adc1_get_raw(BATTERY_PIN);
    return (raw / 4095.0f) * 3.3f * 2.0f;
}

void app_main(void) {
    boot_count++;
    init_espnow();

    sensor_packet_t pkt = {
        .node_id = CONFIG_NODE_ID,
        .msg_type = 0,
        .sequence = boot_count,
        .temperature = read_temperature_sensor(),
        .humidity = read_humidity_sensor(),
        .battery_v = read_battery_voltage(),
        .uptime_ms = boot_count * (SLEEP_DURATION_US / 1000)
    };

    /* Retry failed packets from NVS first */
    retry_stored_packets();

    esp_now_send(gateway_mac, (uint8_t *)&pkt, sizeof(pkt));
    vTaskDelay(pdMS_TO_TICKS(100));  /* Wait for send callback */

    /* Deep sleep */
    esp_wifi_stop();
    esp_deep_sleep(SLEEP_DURATION_US);
}
```

### Gateway Node

```python
#!/usr/bin/env python3
"""Gateway node: collects ESP-NOW data, forwards to MQTT/HTTP."""

import struct
import json
import time
import paho.mqtt.client as mqtt
from collections import deque
from threading import Lock

PACKET_FORMAT = "<BBHfffI"  # matches sensor_packet_t
PACKET_SIZE = struct.calcsize(PACKET_FORMAT)

class SensorGateway:
    def __init__(self, mqtt_broker: str, mqtt_port: int = 1883):
        self.mqtt = mqtt.Client(client_id="sensor-gateway")
        self.mqtt.connect(mqtt_broker, mqtt_port)
        self.mqtt.loop_start()

        self.node_registry = {}
        self.buffer = deque(maxlen=1000)
        self.lock = Lock()
        self.stats = {"received": 0, "forwarded": 0, "errors": 0}

    def process_packet(self, raw_data: bytes, rssi: int):
        """Parse and forward a sensor packet."""
        if len(raw_data) != PACKET_SIZE:
            self.stats["errors"] += 1
            return

        fields = struct.unpack(PACKET_FORMAT, raw_data)
        node_id, msg_type, seq, temp, hum, batt, uptime = fields

        payload = {
            "node_id": node_id,
            "type": ["data", "heartbeat", "alert"][msg_type],
            "sequence": seq,
            "temperature": round(temp, 2),
            "humidity": round(hum, 2),
            "battery_v": round(batt, 2),
            "uptime_ms": uptime,
            "rssi": rssi,
            "gateway_ts": time.time()
        }

        # Update registry
        with self.lock:
            self.node_registry[node_id] = {
                "last_seen": time.time(),
                "battery": batt,
                "rssi": rssi,
                "packets": self.node_registry.get(node_id, {}).get("packets", 0) + 1
            }

        # Publish to MQTT
        topic = f"sensors/node/{node_id}/data"
        self.mqtt.publish(topic, json.dumps(payload), qos=1)
        self.stats["received"] += 1
        self.stats["forwarded"] += 1

        # Battery alert
        if batt < 3.3:
            alert_topic = f"sensors/node/{node_id}/alert"
            self.mqtt.publish(alert_topic, json.dumps({
                "type": "low_battery",
                "voltage": batt,
                "node_id": node_id
            }), qos=1)

    def get_fleet_status(self) -> dict:
        """Return status of all known nodes."""
        now = time.time()
        with self.lock:
            status = {}
            for nid, info in self.node_registry.items():
                age = now - info["last_seen"]
                status[nid] = {
                    **info,
                    "status": "online" if age < 600 else "offline",
                    "last_seen_ago": int(age)
                }
            return status
```

## Power Management

### Power Budget Calculator

| Component | Active | Sleep | Duty Cycle | Average |
|-----------|--------|-------|------------|---------|
| ESP32 (WiFi TX) | 240 mA | 10 uA | 0.1% | 0.25 mA |
| BME280 sensor | 1 mA | 0.1 uA | 0.1% | 0.001 mA |
| Voltage regulator | 5 mA | 5 mA | 100% | 5 mA |
| **Total** | | | | **~5.25 mA** |
| **18650 (3000mAh)** | | | | **~24 days** |

### Deep Sleep Optimization (ESP32)

```c
/* Power-optimized wake cycle */

#include <esp_sleep.h>
#include <esp_pm.h>
#include <driver/rtc_io.h> ./* Use RTC memory to persist across deep sleep */
RTC_DATA_ATTR static int failed_sends = 0;
RTC_DATA_ATTR static float last_temp = 0;

/* Adaptive sleep: longer intervals when data is stable */
static uint64_t calculate_sleep_duration(float current_temp) {
    float delta = fabsf(current_temp - last_temp);
    last_temp = current_temp;

    if (delta > 2.0f) return 60 * 1000000ULL;    /* 1 min if changing fast */
    if (delta > 0.5f) return 300 * 1000000ULL;    /* 5 min if moderate */
    return 900 * 1000000ULL;                        /* 15 min if stable */
}

/* Disable unused peripherals before sleep */
static void prepare_for_sleep(void) {
    esp_wifi_stop();
    adc_power_release();

    /* Hold GPIO states during sleep if needed */
    rtc_gpio_hold_en(GPIO_NUM_25);  /* Keep LED off */

    /* Configure wake sources */
    esp_sleep_enable_timer_wakeup(calculate_sleep_duration(last_temp));
    esp_sleep_enable_ext0_wakeup(GPIO_NUM_33, 0);  /* Wake on button press */

    /* Isolate unused GPIO to prevent leakage */
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_OFF);
}
```

### Solar Power Sizing

```python
def calculate_solar_panel(
    avg_current_ma: float,
    battery_mah: float,
    peak_sun_hours: float = 4.0,
    panel_efficiency: float = 0.7,
    days_autonomy: int = 3
) -> dict:
    """Calculate minimum solar panel wattage for a sensor node."""

    daily_consumption_mah = avg_current_ma * 24
    daily_consumption_wh = daily_consumption_mah * 3.7 / 1000  # Assuming 3.7V LiPo

    # Panel must generate enough for daily use + charge losses
    required_generation_wh = daily_consumption_wh / panel_efficiency
    panel_watts = required_generation_wh / peak_sun_hours

    # Battery must last through autonomy period
    min_battery_mah = daily_consumption_mah * days_autonomy

    return {
        "daily_consumption_mah": round(daily_consumption_mah, 1),
        "daily_consumption_wh": round(daily_consumption_wh, 3),
        "min_panel_watts": round(panel_watts, 2),
        "recommended_panel_watts": round(panel_watts * 1.5, 2),  # 50% margin
        "min_battery_mah": round(min_battery_mah),
        "battery_adequate": battery_mah >= min_battery_mah
    }
```

## Data Pipeline Architecture

### Edge Processing Pattern

```python
class EdgeProcessor:
    """Process sensor data locally before transmitting."""

    def __init__(self, window_size: int = 12):
        self.window = []
        self.window_size = window_size
        self.last_sent = None
        self.threshold = 1.0  # Only send if delta > threshold

    def add_reading(self, value: float) -> dict | None:
        """Add reading, return packet only if transmission warranted."""
        self.window.append(value)
        if len(self.window) > self.window_size:
            self.window.pop(0)

        if len(self.window) < self.window_size:
            return None  # Still collecting

        stats = {
            "mean": sum(self.window) / len(self.window),
            "min": min(self.window),
            "max": max(self.window),
            "range": max(self.window) - min(self.window),
            "samples": len(self.window)
        }

        # Only transmit on significant change
        if self.last_sent is not None:
            if abs(stats["mean"] - self.last_sent) < self.threshold:
                return None

        self.last_sent = stats["mean"]
        self.window.clear()
        return stats
```

### Time-Series Storage (InfluxDB Pattern)

```python
from influxdb_client import InfluxDBClient, Point, WritePrecision
from datetime import datetime

class SensorStorage:
    def __init__(self, url: str, token: str, org: str, bucket: str):
        self.client = InfluxDBClient(url=url, token=token, org=org)
        self.write_api = self.client.write_api()
        self.query_api = self.client.query_api()
        self.bucket = bucket
        self.org = org

    def store_reading(self, node_id: int, measurement: str,
                      fields: dict, tags: dict = None):
        point = Point(measurement)
        point.tag("node_id", str(node_id))
        if tags:
            for k, v in tags.items():
                point.tag(k, str(v))
        for k, v in fields.items():
            point.field(k, float(v))
        point.time(datetime.utcnow(), WritePrecision.MS)

        self.write_api.write(bucket=self.bucket, record=point)

    def query_node_history(self, node_id: int, hours: int = 24) -> list:
        query = f'''
        from(bucket: "{self.bucket}")
            |> range(start: -{hours}h)
            |> filter(fn: (r) => r["node_id"] == "{node_id}")
            |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
            |> yield(name: "mean")
        '''
        result = self.query_api.query(query, org=self.org)
        return [
            {"time": record.get_time(), "value": record.get_value()}
            for table in result for record in table.records
        ]
```

## Fleet Management

### Node Health Monitoring

```python
import time
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class NodeHealth:
    node_id: int
    last_seen: float = 0
    battery_voltage: float = 0
    rssi: int = 0
    packet_count: int = 0
    error_count: int = 0
    expected_interval: int = 300  # seconds
    firmware_version: str = ""

    @property
    def is_online(self) -> bool:
        return (time.time() - self.last_seen) < (self.expected_interval * 2)

    @property
    def battery_percent(self) -> int:
        # LiPo discharge curve approximation
        if self.battery_voltage >= 4.2: return 100
        if self.battery_voltage <= 3.0: return 0
        return int((self.battery_voltage - 3.0) / 1.2 * 100)

    @property
    def packet_loss_rate(self) -> float:
        if self.packet_count == 0: return 0
        return self.error_count / (self.packet_count + self.error_count)


class FleetManager:
    def __init__(self):
        self.nodes: dict[int, NodeHealth] = {}

    def update_node(self, node_id: int, **kwargs):
        if node_id not in self.nodes:
            self.nodes[node_id] = NodeHealth(node_id=node_id)
        node = self.nodes[node_id]
        for key, value in kwargs.items():
            if hasattr(node, key):
                setattr(node, key, value)
        node.last_seen = time.time()
        node.packet_count += 1

    def get_alerts(self) -> list[dict]:
        alerts = []
        for nid, node in self.nodes.items():
            if not node.is_online:
                alerts.append({"node": nid, "type": "offline",
                             "since": node.last_seen})
            if node.battery_percent < 20:
                alerts.append({"node": nid, "type": "low_battery",
                             "percent": node.battery_percent})
            if node.packet_loss_rate > 0.1:
                alerts.append({"node": nid, "type": "high_packet_loss",
                             "rate": node.packet_loss_rate})
        return alerts
```

## Common Pitfalls

| Mistake | Impact | Solution |
|---------|--------|----------|
| No packet sequencing | Undetected data loss | Include sequence numbers |
| WiFi for battery nodes | Days instead of months | Use ESP-NOW, BLE, or LoRa |
| No local buffering | Data loss on connectivity gaps | NVS/flash ring buffer |
| Fixed sample rates | Wasted power on stable data | Adaptive sampling |
| No OTA update path | Manual firmware updates forever | Plan OTA from day one |
| Ignoring clock drift | Misaligned time-series data | NTP sync at gateway, relative timestamps at nodes |
| No encryption | Data interception, spoofing | AES-128 at minimum for ESP-NOW |

## Exercises

1. **Star Network**: Deploy 3 ESP32 sensor nodes reporting temperature to one gateway node via ESP-NOW, forwarding to serial console
2. **Power Profiler**: Measure actual current draw of a sensor node across wake/sleep cycles, compare to calculated budget
3. **Adaptive Sampling**: Implement edge processing that increases sample rate when readings change rapidly
4. **Fleet Dashboard**: Build a web dashboard showing real-time status, battery levels, and alerts for 5+ simulated nodes
5. **Resilient Pipeline**: Add NVS buffering to sensor nodes so data survives gateway outages, with automatic catch-up on reconnection


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to iot sensor network
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Iot Sensor Network Analysis

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

**Input:** "Help me with iot sensor network for my current situation"

**Output:**

Based on your situation, here is a structured approach to iot sensor network:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
