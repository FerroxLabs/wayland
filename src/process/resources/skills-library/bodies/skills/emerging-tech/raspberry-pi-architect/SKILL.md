---
name: raspberry-pi-architect
description: |
  Guides Linux-based Raspberry Pi projects including GPIO programming, camera modules, headless setup, networking, and system architecture
  Use when the user asks about raspberry pi architect, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of raspberry pi architect or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced iot journaling template guide python api-design automation"
  category: "emerging-tech"
  subcategory: "embedded-iot"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Raspberry Pi Architect

You are an expert Raspberry Pi systems architect. You guide developers through Linux-based Pi projects including GPIO programming, camera integration, headless configuration, networking, and production-grade system design.


## When to Use

**Use this skill when:**
- User asks about raspberry pi architect techniques or best practices
- User needs guidance on raspberry pi architect concepts
- User wants to implement or improve their approach to raspberry pi architect

**Do NOT use when:**
- The request falls outside the scope of raspberry pi architect
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Platform Selection Guide

| Model | CPU | RAM | WiFi | GPIO | USB | Best For |
|-------|-----|-----|------|------|-----|----------|
| Pi 5 | BCM2712 Quad A76 2.4GHz | 4/8 GB | WiFi 5, BLE 5.0 | 40-pin | 2xUSB3, 2xUSB2 | Desktop-class projects |
| Pi 4B | BCM2711 Quad A72 1.8GHz | 2/4/8 GB | WiFi 5, BLE 5.0 | 40-pin | 2xUSB3, 2xUSB2 | General purpose |
| Pi Zero 2 W | RP3A0 Quad A53 1GHz | 512 MB | WiFi 4, BLE 4.2 | 40-pin | 1x micro USB | Compact, low-power |
| Pi Pico W | RP2040 Dual M0+ 133MHz | 264 KB | WiFi 4, BLE 5.2 | 26 GPIO | 1x micro USB | Microcontroller tasks |

## Headless Setup

### First Boot Configuration

```shell
# After flashing Raspberry Pi OS to SD card

# 1. Enable SSH (create empty file on boot partition)
touch /Volumes/bootfs/ssh

# 2. Configure WiFi (create on boot partition)
cat > ./Volumes/bootfs/wpa_supplicant.conf << 'EOF'
country=US
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="YourNetworkName"
    psk="YourPassword"
    key_mgmt=WPA-PSK
}
EOF

# 3. Set default user (Pi OS Bookworm+)
# Use Raspberry Pi Imager to pre-configure user/password

# 4. For Pi OS Bookworm+, use firstrun script or imager settings
cat > ./Volumes/bootfs/userconf.txt << 'EOF'
username:encrypted_password_hash
EOF
```

### Post-Boot Hardening

```shell
#!shell-interpreter
# initial-setup script - Run after first SSH connection

set -e

# Update system
sudo apt update && sudo apt full-upgrade -y

# Set timezone and locale
sudo raspi-config nonint do_change_timezone "America/New_York"
sudo raspi-config nonint do_change_locale "en_US.UTF-8"

# Set hostname
sudo raspi-config nonint do_hostname "my-pi-device"

# Disable password auth, use SSH keys only
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' \
    [system-path]
sudo systemctl restart sshd

# Install essential tools
sudo apt install -y \
    python3-pip python3-venv \
    git htop tmux \
    i2c-tools python3-smbus \
    libgpiod-dev python3-libgpiod

# Enable I2C and SPI
sudo raspi-config nonint do_i2c 0
sudo raspi-config nonint do_spi 0

# Set up automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

echo "Setup complete. Reboot recommended."
```

## GPIO Programming

### Modern GPIO with libgpiod (Python)

```python
#!/usr/bin/env python3
"""Modern GPIO access using libgpiod (replaces deprecated RPi.GPIO)."""

import gpiod
import time
from gpiod.line import Direction, Value, Edge, Bias

CHIP = "/dev/gpiochip4"  # Pi 5 uses gpiochip4, Pi 4 uses gpiochip0

# --- Digital Output ---
def blink_led(pin: int, count: int = 5, interval: float = 0.5):
    """Blink an LED on the specified GPIO pin."""
    with gpiod.request_lines(
        CHIP,
        consumer="led-blink",
        config={pin: gpiod.LineSettings(direction=Direction.OUTPUT)}
    ) as request:
        for _ in range(count):
            request.set_value(pin, Value.ACTIVE)
            time.sleep(interval)
            request.set_value(pin, Value.INACTIVE)
            time.sleep(interval)


# --- Digital Input with Pull-up ---
def read_button(pin: int) -> bool:
    """Read button state with internal pull-up resistor."""
    with gpiod.request_lines(
        CHIP,
        consumer="button-read",
        config={pin: gpiod.LineSettings(
            direction=Direction.INPUT,
            bias=Bias.PULL_UP
        )}
    ) as request:
        return request.get_value(pin) == Value.INACTIVE  # Active low


# --- Edge Detection (interrupt-driven) ---
def wait_for_button(pin: int, timeout_sec: float = 30.0):
    """Wait for button press using edge detection."""
    with gpiod.request_lines(
        CHIP,
        consumer="button-wait",
        config={pin: gpiod.LineSettings(
            direction=Direction.INPUT,
            bias=Bias.PULL_UP,
            edge_detection=Edge.FALLING,
            debounce_period=gpiod.line.Duration.from_milliseconds(50)
        )}
    ) as request:
        if request.wait_edge_events(timeout=gpiod.line.Duration.from_seconds(timeout_sec)):
            events = request.read_edge_events()
            print(f"Button pressed! {len(events)} event(s)")
            return True
        print("Timeout waiting for button press")
        return False
```

### I2C Sensor Reading

```python
#!/usr/bin/env python3
"""I2C sensor communication pattern."""

import smbus2
import struct
import time

class I2CDevice:
    """Base class for I2C device communication."""

    def __init__(self, bus_number: int, address: int):
        self.bus = smbus2.SMBus(bus_number)
        self.address = address

    def read_byte(self, register: int) -> int:
        return self.bus.read_byte_data(self.address, register)

    def read_word(self, register: int) -> int:
        high = self.bus.read_byte_data(self.address, register)
        low = self.bus.read_byte_data(self.address, register + 1)
        value = (high << 8) | low
        return value if value < 0x8000 else value - 0x10000

    def write_byte(self, register: int, value: int):
        self.bus.write_byte_data(self.address, register, value)

    def read_block(self, register: int, length: int) -> list:
        return self.bus.read_i2c_block_data(self.address, register, length)

    def close(self):
        self.bus.close()


class BME280(I2CDevice):
    """Example: BME280 temperature/humidity/pressure sensor."""

    ADDR = 0x76
    REG_CTRL_HUM = 0xF2
    REG_CTRL_MEAS = 0xF4
    REG_DATA = 0xF7

    def __init__(self, bus: int = 1):
        super().__init__(bus, self.ADDR)
        self._init_sensor()

    def _init_sensor(self):
        self.write_byte(self.REG_CTRL_HUM, 0x01)   # Humidity oversampling x1
        self.write_byte(self.REG_CTRL_MEAS, 0x27)  # Temp/press oversampling x1, normal mode

    def read_temperature(self) -> float:
        data = self.read_block(self.REG_DATA, 3)
        raw = (data[0] << 12) | (data[1] << 4) | (data[2] >> 4)
        # Simplified - real implementation needs calibration data
        return raw / 5120.0
```

### PWM with Hardware Support

```python
#!/usr/bin/env python3
"""Hardware PWM control for servos and motor speed."""

import subprocess

def setup_pwm(channel: int, frequency: int, duty_cycle: float):
    """
    Configure hardware PWM via sysfs.
    channel: 0 (GPIO18) or 1 (GPIO19)
    frequency: Hz
    duty_cycle: 0.0 to 1.0
    """
    pwm_path = f"/sys/class/pwm/pwmchip0/pwm{channel}"
    period_ns = int(1e9 / frequency)
    duty_ns = int(period_ns * duty_cycle)

    # Export channel if not already exported
    try:
        with open(f"/sys/class/pwm/pwmchip0/export", "w") as f:
            f.write(str(channel))
    except OSError:
        pass  # Already exported

    with open(f"{pwm_path}/period", "w") as f:
        f.write(str(period_ns))
    with open(f"{pwm_path}/duty_cycle", "w") as f:
        f.write(str(duty_ns))
    with open(f"{pwm_path}/enable", "w") as f:
        f.write("1")


def set_servo_angle(channel: int, angle: float):
    """Set servo angle (0-180 degrees). Assumes 50Hz PWM."""
    # Servo pulse: 0.5ms (0deg) to 2.5ms (180deg)
    duty = 0.025 + (angle / 180.0) * 0.1  # 2.5% to 12.5%
    setup_pwm(channel, 50, duty)
```

## Camera Integration

### Picamera2 (Modern API)

```python
#!/usr/bin/env python3
"""Camera capture using picamera2 (Pi OS Bookworm+)."""

from picamera2 import Picamera2
from libcamera import Transform
import time

class CameraManager:
    def __init__(self, resolution=(1920, 1080)):
        self.picam = Picamera2()
        config = self.picam.create_still_configuration(
            main={"size": resolution, "format": "RGB888"},
            transform=Transform(hflip=False, vflip=False)
        )
        self.picam.configure(config)

    def capture_image(self, path: str):
        self.picam.start()
        time.sleep(2)  # Auto-exposure settling
        self.picam.capture_file(path)
        self.picam.stop()
        print(f"Captured: {path}")

    def capture_timelapse(self, directory: str, interval_sec: int, count: int):
        self.picam.start()
        time.sleep(2)
        for i in range(count):
            path = f"{directory}/frame_{i:05d}.jpg"
            self.picam.capture_file(path)
            print(f"Captured frame {i+1}/{count}")
            if i < count - 1:
                time.sleep(interval_sec)
        self.picam.stop()

    def stream_video(self, duration_sec: int, output: str):
        video_config = self.picam.create_video_configuration(
            main={"size": (1280, 720), "format": "RGB888"}
        )
        self.picam.configure(video_config)
        self.picam.start_and_record_video(output, duration=duration_sec)
```

## Networking and Remote Access

### Systemd Service Template

```ini
# [system-path]
[Unit]
Description=My Pi Application Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/home/pi/app
ExecStart=/home/pi/app/venv/bin/python main.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=PYTHONUNBUFFERED=1

# Security hardening
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/home/pi/app/data
NoNewPrivileges=yes
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
```

```shell
# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable my-pi-service
sudo systemctl start my-pi-service
sudo journalctl -u my-pi-service -f  # Follow logs
```

### Flask API for Remote Sensor Access

```python
#!/usr/bin/env python3
"""Lightweight REST API for sensor data."""

from flask import Flask, jsonify
import threading
import time

app = Flask(__name__)
sensor_data = {"temperature": 0, "humidity": 0, "timestamp": 0}
lock = threading.Lock()

def sensor_loop():
    """Background thread reading sensors."""
    while True:
        # Replace with actual sensor reads
        with lock:
            sensor_data["temperature"] = read_temperature()
            sensor_data["humidity"] = read_humidity()
            sensor_data["timestamp"] = time.time()
        time.sleep(5)

@app.route("/api/sensors")
def get_sensors():
    with lock:
        return jsonify(sensor_data)

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "uptime": time.monotonic()})

if __name__ == "__main__":
    threading.Thread(target=sensor_loop, daemon=True).start()
    app.run(host="0.0.0.0", port=5000)
```

## Performance and Reliability

### Watchdog Timer

```shell
# Enable hardware watchdog
sudo apt install -y watchdog
sudo systemctl enable watchdog

# [system-path]
watchdog-device = /dev/watchdog
watchdog-timeout = 15
max-load-1 = 24
min-memory = 1
temperature-sensor = /sys/class/thermal/thermal_zone0/temp
max-temperature = 80
```

### Log Rotation

```shell
# [system-path]
[system-path] {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 pi pi
    postrotate
        systemctl restart my-pi-service
    endscript
}
```

### SD Card Longevity

```shell
# Reduce writes to extend SD card life

# 1. Mount tmp directories as tmpfs
echo "tmpfs /tmp tmpfs defaults,noatime,nosuid,size=100m 0 0" | sudo tee -a [system-path]
echo "tmpfs [system-path] tmpfs defaults,noatime,nosuid,size=50m 0 0" | sudo tee -a [system-path]

# 2. Disable swap
sudo dphys-swapfile swapoff
sudo dphys-swapfile uninstall
sudo systemctl disable dphys-swapfile

# 3. Use noatime mount option
# In [system-path] add noatime to root partition:
# /dev/mmcblk0p2 / ext4 defaults,noatime 0 1
```

## Common Pitfalls

| Mistake | Impact | Solution |
|---------|--------|----------|
| Using RPi.GPIO on Pi 5 | Crashes, no support | Use libgpiod / gpiod |
| No heat sink on Pi 5/4 | Thermal throttling | Add active/passive cooling |
| Running as root | Security vulnerability | Use groups (gpio, i2c, spi) |
| SD card as database store | Card wear, corruption | Use USB SSD or remote DB |
| Polling GPIO in tight loop | 100% CPU usage | Use edge detection/interrupts |
| No graceful shutdown | SD card corruption | Add shutdown button circuit |
| Ignoring power supply | Random crashes, data loss | Use official PSU (5V 3A+) |

## Exercises

1. **Headless Sensor Station**: Set up a Pi Zero 2 W headless with I2C temp/humidity sensor, logging data to CSV with systemd service
2. **Camera Trap**: Motion-triggered camera using GPIO PIR sensor and picamera2, saving timestamped images
3. **Network Monitor Dashboard**: Flask web app displaying CPU temp, memory usage, disk space, and network stats with auto-refresh
4. **GPIO Remote Control**: REST API controlling 4 relay outputs and reading 4 digital inputs, with systemd service and watchdog
5. **Timelapse System**: Automated timelapse capture with configurable interval, automatic cleanup of old files, and web gallery


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to raspberry pi architect
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Raspberry Pi Architect Analysis

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

**Input:** "Help me with raspberry pi architect for my current situation"

**Output:**

Based on your situation, here is a structured approach to raspberry pi architect:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
