---
name: raspberry-pi-guide
description: |
  Comprehensive guide to Raspberry Pi projects including model selection, OS setup, server builds, GPIO programming, home automation, and advanced applications. Use when the user asks about raspberry pi guide or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "iot guide step-by-step"
  category: "hobbies-crafts"
  subcategory: "making-building"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Raspberry Pi Guide

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to raspberry pi guide.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on raspberry pi guide
- User asks about raspberry pi guide best practices or techniques
- User wants a structured approach to raspberry pi guide

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of raspberry pi guide

## Questions to Ask First

Before recommending a setup, I need to understand your goals:

1. What do you want to build? (Media server, NAS, retro gaming, home automation, learning Linux, web server, IoT)
2. What is your experience with Linux and the command line? (None / Basic / Comfortable / Expert)
3. Do you have programming experience? In which languages?
4. What is your budget? ($50 / $100 / $200+)
5. Do you need GPIO pins for physical computing projects?
6. Will this run 24/7 as a server, or be used intermittently?
7. Do you need desktop GUI access, or is headless (no monitor) fine?
8. What networking do you need? (Ethernet only / WiFi / Both)

## Model Selection Guide

### Raspberry Pi 5 (Current Flagship)
- **CPU**: Broadcom BCM2712, quad-core Cortex-A76 @ 2.4GHz
- **RAM**: 2GB, 4GB, or 8GB options
- **Key features**: PCIe 2.0 connector, dual 4K HDMI, USB 3.0, hardware video decode
- **Best for**: Desktop replacement, media servers, Docker hosting, development
- **Power**: USB-C, requires 5V 5A (27W) official power supply
- **Cost**: $60 (2GB) to $80 (8GB)

### Raspberry Pi 4 Model B
- **CPU**: Broadcom BCM2711, quad-core Cortex-A72 @ 1.8GHz
- **RAM**: 1GB, 2GB, 4GB, or 8GB
- **Best for**: Still excellent for most projects, widely supported, mature ecosystem
- **Power**: USB-C, 5V 3A recommended
- **Cost**: $35-75 depending on RAM

### Raspberry Pi Zero 2 W
- **CPU**: Quad-core Cortex-A53 @ 1GHz
- **RAM**: 512MB
- **Best for**: Small embedded projects, IoT sensors, Pi-hole, lightweight tasks
- **Key features**: WiFi, Bluetooth, tiny form factor
- **Power**: Micro-USB, very low power consumption
- **Cost**: $15

### Raspberry Pi Pico / Pico W
- **Note**: This is a microcontroller, NOT a Linux computer
- **Best for**: Arduino-style projects, sensor reading, motor control
- **Programming**: MicroPython or C/C++
- **Cost**: $4-6

### Which Model to Choose
| Use Case | Recommended Model | RAM |
|----------|------------------|-----|
| First Pi / Learning | Pi 5 or Pi 4 | 4GB |
| Media server (Plex/Jellyfin) | Pi 5 | 8GB |
| NAS | Pi 5 | 4GB+ |
| Pi-hole (ad blocking) | Pi Zero 2 W | 512MB |
| Retro gaming (RetroPie) | Pi 4 or Pi 5 | 4GB |
| Home automation | Pi 4 | 2-4GB |
| Docker host | Pi 5 | 8GB |
| Desktop replacement | Pi 5 | 8GB |
| IoT sensor node | Pi Zero 2 W or Pico W | - |

## OS Setup

### Step 1: Download Raspberry Pi Imager
- Download from raspberrypi.com/software
- Available for Windows, macOS, and Linux
- This is the official and easiest way to flash OS images

### Step 2: Flash the OS
1. Insert microSD card into computer (32GB minimum, 64GB recommended, Class 10 / A2)
2. Open Raspberry Pi Imager
3. Choose OS: Raspberry Pi OS (64-bit) for most users
4. Choose Storage: Select your microSD card
5. Click the gear icon for advanced options:
   - Set hostname (e.g., mypi.local)
   - Enable SSH (important for headless setup)
   - Set username and password
   - Configure WiFi (SSID and password)
   - Set locale and timezone
6. Click Write and wait for completion

### Step 3: First Boot
**With monitor**: Insert SD card, connect HDMI, keyboard, mouse, power on
**Headless (no monitor)**:
1. Insert SD card and power on
2. Wait 2-3 minutes for first boot
3. Connect via SSH: `connect-to hostname.local` (or use IP address)
4. Find IP address from router admin page if .local doesn't resolve

### Step 4: Initial Configuration
```
update-packages && upgrade-packages -y
system-config-tool    # Configure additional settings
```
Key system-config-tool options:
- Interface Options: Enable VNC, SPI, I2C, Serial as needed
- Performance Options: Set GPU memory split
- Localization: Timezone, keyboard layout

### Alternative Operating Systems
- **Ubuntu Server** - For serious server use, better Docker support
- **LibreELEC** - Dedicated Kodi media center OS
- **RetroPie** - Retro gaming emulation
- **Home Assistant OS** - Dedicated smart home OS
- **DietPi** - Minimal, optimized, very lightweight

## Project Guides

### Project 1: Pi-hole (Network-Wide Ad Blocker)
**Difficulty**: Beginner | **Time**: 30 minutes | **Best on**: Pi Zero 2 W or any Pi

1. Start with fresh Raspberry Pi OS Lite installation
2. Assign static IP address:
   ```
   nmcli con mod "Wired connection 1" ipv4.addresses 192.168.1.100/24
   nmcli con mod "Wired connection 1" ipv4.gateway 192.168.1.1
   nmcli con mod "Wired connection 1" ipv4.method manual
   ```
3. Install Pi-hole:

   > **Security Note:** Piping scripts directly from the internet to an interpreter (`request | run-installer`) executes unverified code. For production systems, download the script first, inspect it, then execute it. These commands are shown for convenience in hobby/development contexts only.

   ```
   request -sSL [URL] | run-installer
   ```
4. Follow the installer prompts
5. Set your router's DNS to the Pi's IP address
6. Access admin panel at [URL]
7. Add additional blocklists for better coverage

### Project 2: Media Server (Jellyfin)
**Difficulty**: Beginner-Intermediate | **Time**: 1 hour | **Best on**: Pi 4 (4GB) or Pi 5

1. Install Jellyfin (see security note above about `request | run-installer` patterns):
   ```
   install-package request gnupg
   request -fsSL [URL] | run-installer
   ```
2. Connect external USB drive with media files
3. Auto-mount the drive:
   ```
   blkid          # Find drive UUID
   mkdir /mnt/media
   # Add to [system-path] UUID=xxxx /mnt/media ext4 defaults,nofail 0 2
   mount -a
   ```
4. Access Jellyfin at [URL]
5. Add media libraries pointing to /mnt/media subdirectories
6. Install Jellyfin apps on TV, phone, tablet for playback

### Project 3: NAS (Network Attached Storage)
**Difficulty**: Intermediate | **Time**: 2 hours | **Best on**: Pi 4 or Pi 5

1. Connect USB drives (consider USB 3.0 enclosure with RAID)
2. Install OpenMediaVault:
   ```
   download -O - [URL] | run-installer
   ```
3. Access OMV web interface at [URL]
4. Configure storage: Create filesystems, shared folders
5. Enable SMB/CIFS for Windows shares or NFS for Linux
6. Set up user accounts and permissions
7. Configure scheduled backups with rsync

### Project 4: Retro Gaming (RetroPie)
**Difficulty**: Beginner | **Time**: 1-2 hours | **Best on**: Pi 4

1. Flash RetroPie image using Raspberry Pi Imager
2. Connect controllers (USB or Bluetooth)
3. Boot and configure controller mapping in EmulationStation
4. Transfer ROMs via USB, SFTP, or Samba share
5. Supported systems: NES, SNES, Genesis, N64, PS1, GBA, Arcade, and many more
6. Configure shaders for CRT-like appearance
7. Scrape game metadata for cover art and descriptions

### Project 5: Home Automation (Home Assistant)
**Difficulty**: Intermediate-Advanced | **Time**: 2-4 hours | **Best on**: Pi 4 or Pi 5

1. Flash Home Assistant OS using Raspberry Pi Imager (choose "Other" > "Home Assistant")
2. Boot and wait 5-10 minutes for initial setup
3. Access at [URL]
4. Create account and configure location
5. Auto-discovery finds compatible smart devices
6. Add integrations: Zigbee (with USB dongle), Z-Wave, WiFi devices
7. Create automations: motion-triggered lights, temperature-based fan control
8. Build dashboards for room-by-room control

## GPIO Basics

### Pin Layout (40-pin header)
- **3.3V and 5V power pins** - Power external components
- **Ground pins** - 8 ground pins available
- **GPIO pins** - General Purpose Input/Output, 3.3V logic
- **Special function pins**: I2C (SDA/SCL), SPI (MOSI/MISO/SCLK/CE), UART (TX/RX)

### Important GPIO Rules
- GPIO pins are 3.3V logic - NEVER connect 5V directly to a GPIO pin
- Maximum current per pin: 16mA (safe), some sources say up to 50mA total across all pins
- Use level shifters for 5V devices
- Use transistors or relays for high-power loads

### Python GPIO Programming (gpiozero library)
```python
from gpiozero import LED, Button
from signal import pause

led = LED(17)           # LED on GPIO 17
button = Button(2)      # Button on GPIO 2

button.when_pressed = led.on
button.when_released = led.off

pause()  # Keep program running
```

### Common GPIO Projects
- LED control and PWM dimming
- Button and switch input
- Temperature/humidity sensors (DHT22, BME280)
- Relay control for appliances
- Servo and stepper motor control
- OLED and LCD displays
- NeoPixel / WS2812B LED strips
- PIR motion sensors
- Ultrasonic distance sensors

## Python Programming on Pi

### Essential Libraries
```
install-package python3-pip python3-venv
python3 -m venv myproject
source myproject/bin/activate
install-python-package gpiozero RPi.GPIO requests flask
```

### Useful Python Packages for Pi
- **gpiozero** - Simple GPIO interface
- **RPi.GPIO** - Lower-level GPIO control
- **picamera2** - Camera module interface
- **Flask** - Web server for dashboards
- **MQTT (paho-mqtt)** - IoT messaging
- **Adafruit CircuitPython libraries** - Sensor support
- **schedule** - Task scheduling
- **psutil** - System monitoring

## Docker on Raspberry Pi

### Installation

> **Security Note:** Piping scripts directly from the internet to an interpreter (`request | run-installer`) executes unverified code. For production systems, download the script first, inspect it, then execute it.

```
request -fsSL [URL] | run-installer
usermod -aG docker $USER
# Log out and back in
docker run hello-world   # Test installation
```

### Docker Compose
```
install-package docker-compose-plugin
```

### Recommended Docker Containers for Pi
- **Portainer** - Docker management GUI
- **Pi-hole** - DNS ad blocking
- **Nginx Proxy Manager** - Reverse proxy with SSL
- **Heimdall** - Application dashboard
- **Uptime Kuma** - Service monitoring
- **Grafana + InfluxDB** - Data visualization
- **Mosquitto** - MQTT broker for IoT
- **Watchtower** - Auto-update containers

### Performance Tips for Docker on Pi
- Use images built for arm64 architecture
- Limit container memory with `--memory` flag
- Use bind mounts instead of named volumes for better I/O
- Monitor with `docker stats`
- Consider an SSD instead of SD card for heavy I/O workloads

## Remote Access

### SSH (Secure Shell)
```
# From another computer:
connect-to raspberrypi.local
# Or use IP address:
connect-to 192.168.1.100
```

### VNC (Remote Desktop)
1. Enable VNC: `system-config-tool` > Interface Options > VNC
2. Install RealVNC Viewer on your computer
3. Connect using hostname.local or IP address

### Tailscale (Remote Access from Anywhere)

> **Security Note:** Review scripts before piping to interpreter. Download first with `request -fsSL [URL] -o install-script`, inspect, then run.

```
request -fsSL [URL] | run-installer
tailscale up
```
- Creates secure VPN tunnel without port forwarding
- Access Pi from anywhere using Tailscale IP

### File Transfer
- **SCP**: `scp file.txt user@pi:/home/user/`
- **SFTP**: Use FileZilla or WinSCP with SFTP protocol
- **rsync**: `rsync -avz folder/ user@pi:/backup/` (incremental sync)
- **Samba**: Mount Pi folders as network drives on Windows/Mac

## Maintenance and Optimization

### SD Card Health
- SD cards have limited write cycles; they will eventually fail
- Use `log2ram` to reduce writes: keeps logs in RAM
- Consider booting from USB SSD for reliability and speed
- Always shut down properly: `shutdown -h now`
- Keep backups of your SD card image

### Performance Optimization
- Overclock carefully (Pi 5 supports it well with active cooling)
- Use 64-bit OS for 4GB+ RAM models
- Disable unnecessary services: `systemctl disable bluetooth` if unused
- Use lightweight desktop (LXDE) or go headless
- Monitor temperature: `vcgencmd measure_temp`
- Add heatsinks and fan for sustained workloads

### Security Hardening
- Change default password immediately
- Use SSH keys instead of passwords
- Disable password SSH login after setting up keys
- Keep system updated: `update-packages && apt upgrade`
- Install and configure UFW firewall
- Change SSH port from default 22
- Use fail2ban to block brute-force attempts

### Backup Strategy
1. Image entire SD card periodically (use Raspberry Pi Imager or dd)
2. Back up specific config files with rsync
3. Use version control (git) for custom scripts
4. Document your setup so you can recreate from scratch

## Troubleshooting

### Pi Won't Boot
- Check power supply (official supply recommended, undervoltage causes issues)
- Re-flash SD card
- Try a different SD card
- Check HDMI connection (try other HDMI port on Pi 4/5)
- Look for steady green LED (means SD card is being read)

### Network Issues
- Check WiFi credentials in imager settings
- Use `nmcli` or `system-config-tool` to reconfigure network
- For Ethernet, check cable and router DHCP settings
- `ip addr` shows current IP addresses
- `ping google.com` tests internet connectivity

### Performance Issues
- Check temperature: overheating causes throttling
- Check CPU usage: `htop`
- Check disk space: `df -h`
- Check memory: `free -h`
- Lightning bolt icon on desktop = insufficient power supply


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Raspberry Pi Guide deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with raspberry pi guide for a mid-size project."

**Output:** A complete raspberry pi guide framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.
