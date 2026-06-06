# Wayland Headless Server Deployment Guide

Deploy Wayland WebUI on headless Linux servers - cloud VMs, Kubernetes Pods, and containers - with proxy auto-fallback support.

**Translations**: [Chinese Version](#chinese-version) below.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Virtual Display (Xvfb)](#virtual-display-xvfb)
- [Service Management Script](#service-management-script)
- [Remote Access](#remote-access)
- [Proxy with Auto-Fallback](#proxy-with-auto-fallback)
- [Troubleshooting](#troubleshooting)
- [Architecture Overview](#architecture-overview)

---

## Prerequisites

- Linux x86_64 (Ubuntu 20.04+ / Debian 11+ recommended)
- At least 2GB RAM
- Wayland `.deb` package from [Releases](https://github.com/FerroxLabs/wayland/releases)

---

## Installation

```bash
# Download the latest .deb package
wget https://github.com/FerroxLabs/wayland/releases/latest/download/Wayland-linux-amd64.deb

# Install
sudo dpkg -i Wayland-linux-amd64.deb
sudo apt-get install -f  # Fix missing dependencies
```

> **Container note**: If you encounter dependency errors for `libegl1` / `libgles2` (common with NVIDIA runtime in containers), use `dpkg --force-all -i` to force install.

---

## Virtual Display (Xvfb)

Wayland is an Electron app and requires a display server. On headless servers (no monitor), use Xvfb to create a virtual display:

```bash
sudo apt-get install -y xvfb
```

Xvfb is used automatically by the startup script below via `xvfb-run`.

---

## Service Management Script

Since many cloud/container environments lack systemd, use the following nohup-based script.

Create `/opt/Wayland/start-wayland.sh`:

```bash
#!/bin/bash
# Wayland WebUI headless startup script
# Usage: ./start-wayland.sh [start|stop|restart|status]

PIDFILE="/var/run/wayland.pid"
LOGFILE="/var/log/wayland.log"
WORKDIR="$HOME"  # Change to your workspace directory

start() {
    if [ -f "$PIDFILE" ] && kill -0 "$(cat $PIDFILE)" 2>/dev/null; then
        echo "Wayland is already running (PID: $(cat $PIDFILE))"
        return 1
    fi
    echo "Starting Wayland WebUI..."
    cd "$WORKDIR"

    nohup xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" \
        /usr/bin/Wayland --webui --remote \
        > "$LOGFILE" 2>&1 &
    echo $! > "$PIDFILE"
    sleep 3
    if kill -0 "$(cat $PIDFILE)" 2>/dev/null; then
        echo "Wayland started successfully (PID: $(cat $PIDFILE))"
        echo "WebUI: http://$(hostname -I | awk '{print $1}'):25808"
    else
        echo "Wayland failed to start. Check log: $LOGFILE"
        rm -f "$PIDFILE"
        return 1
    fi
}

stop() {
    if [ ! -f "$PIDFILE" ]; then
        echo "Wayland is not running (no PID file)"
        return 1
    fi
    PID=$(cat "$PIDFILE")
    echo "Stopping Wayland (PID: $PID)..."
    kill "$PID" 2>/dev/null
    sleep 2
    kill -9 "$PID" 2>/dev/null
    pkill -f "Wayland --webui" 2>/dev/null
    rm -f "$PIDFILE"
    echo "Wayland stopped."
}

restart() {
    stop
    sleep 1
    start
}

status() {
    if [ -f "$PIDFILE" ] && kill -0 "$(cat $PIDFILE)" 2>/dev/null; then
        echo "Wayland is running (PID: $(cat $PIDFILE))"
        ss -tlnp | grep 25808
    else
        echo "Wayland is not running."
        rm -f "$PIDFILE" 2>/dev/null
    fi
}

case "${1:-start}" in
    start)   start ;;
    stop)    stop ;;
    restart) restart ;;
    status)  status ;;
    *)       echo "Usage: $0 {start|stop|restart|status}" ;;
esac
```

```bash
chmod +x /opt/Wayland/start-wayland.sh
```

> **Tip**: `WORKDIR` determines the directory Wayland can access for file operations. Set it to your project workspace.

---

## Remote Access

Wayland WebUI listens on port **25808**. Choose a method based on your network setup:

### Option A: Direct Access (Public IP)

Open port 25808 in your cloud provider's security group or firewall, then access via `http://YOUR_SERVER_IP:25808`.

### Option B: ngrok Tunnel (NAT / K8s / No Public IP)

```bash
pip3 install pyngrok
ngrok config add-authtoken YOUR_TOKEN

# Start tunnel
nohup ngrok http 25808 --log=stdout > /var/log/ngrok.log 2>&1 &

# Get public URL
curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "
import sys, json
[print(t['public_url']) for t in json.load(sys.stdin)['tunnels']]
"
```

> Note: ngrok free tier generates a new URL on each restart. You can claim a free static domain at [ngrok dashboard](https://dashboard.ngrok.com/).

### Option C: SSH Tunnel (From Your Local Machine)

```bash
ssh -L 25808:127.0.0.1:25808 user@YOUR_SERVER_IP
# Then access: http://localhost:25808
```

---

## Proxy with Auto-Fallback

If your server needs a proxy for certain APIs (e.g., via an SSH reverse tunnel to a local VPN), use the **PAC auto-fallback** approach: try proxy first, fall back to direct connection when the proxy is unavailable. No restart needed.

### Step 1: SSH Reverse Tunnel (Run on Your Local Machine)

Forward your local proxy port to the server:

```bash
ssh -R 7897:127.0.0.1:7897 user@YOUR_SERVER_IP
```

> Replace `7897` with your actual proxy port. The tunnel is active as long as the SSH session is open.

### Step 2: PAC File for Wayland (Electron / Chromium Layer)

Using `--proxy-server` is fragile - when the proxy goes down, **all** requests fail including the WebUI itself. Instead, use a **PAC (Proxy Auto-Configuration) file** that provides automatic fallback.

Create `/opt/Wayland/proxy.pac`:

```javascript
function FindProxyForURL(url, host) {
  // Localhost and private networks: always direct
  if (
    isPlainHostName(host) ||
    host === '127.0.0.1' ||
    host === 'localhost' ||
    shExpMatch(host, '10.*') ||
    shExpMatch(host, '192.168.*') ||
    shExpMatch(host, '172.16.*')
  ) {
    return 'DIRECT';
  }
  // All other requests: try proxy first, fallback to direct
  return 'PROXY 127.0.0.1:7897; DIRECT';
}
```

Then update the `nohup xvfb-run ...` line in your startup script:

```bash
    nohup xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" \
        /usr/bin/Wayland --webui --remote \
        --proxy-pac-url="file:///opt/Wayland/proxy.pac" \
        > "$LOGFILE" 2>&1 &
```

**How it works**:

- Chromium natively supports PAC proxy rules
- `"PROXY 127.0.0.1:7897; DIRECT"` means: try the proxy, and if it fails (connection refused / timeout), automatically fall back to a direct connection
- Failover is per-request and real-time - no restart needed when the SSH tunnel connects or disconnects

### Step 3: Auto-Detect Proxy for Shell Commands

Shell tools like `curl` and `wget` use `http_proxy` environment variables. Add automatic detection to `~/.bashrc` so the proxy env vars are set/unset dynamically before every command:

```bash
# === Proxy Auto-Detect ===
_auto_proxy() {
    if (echo > /dev/tcp/127.0.0.1/7897) 2>/dev/null; then
        export http_proxy=http://127.0.0.1:7897
        export https_proxy=http://127.0.0.1:7897
        export ALL_PROXY=socks5://127.0.0.1:7897
    else
        unset http_proxy https_proxy ALL_PROXY 2>/dev/null
    fi
}
_auto_proxy
PROMPT_COMMAND="_auto_proxy;${PROMPT_COMMAND}"
# === Proxy Auto-Detect End ===
```

**How it works**:

- `PROMPT_COMMAND` runs before every shell prompt, re-checking proxy availability
- SSH tunnel connected → proxy env vars set automatically
- SSH tunnel disconnected → proxy env vars cleared, commands use direct connection
- No manual intervention or terminal restart needed

### Step 4: Wayland Internal Proxy (Gemini API)

For Gemini API calls, configure the proxy inside Wayland WebUI:

**Settings → Gemini Settings → Proxy** → `http://127.0.0.1:7897`

> This proxy is handled by Wayland's Node.js layer (separate from the Chromium layer). When the SSH tunnel is down, Gemini API calls will fail, but the WebUI and other APIs remain functional.

---

## Troubleshooting

| Issue                                     | Solution                                                     |
| ----------------------------------------- | ------------------------------------------------------------ |
| `dpkg` dependency errors in containers    | `dpkg --force-all -i Wayland-linux-amd64.deb`                 |
| Wayland can only access `/tmp`             | Set `WORKDIR` in the startup script to your workspace path   |
| WebUI not accessible remotely             | Check firewall rules, or use ngrok / SSH tunnel              |
| All requests fail when proxy is down      | Use PAC file (`--proxy-pac-url`) instead of `--proxy-server` |
| `curl` fails after SSH tunnel disconnects | Add `PROMPT_COMMAND` auto-detect to `~/.bashrc` (see Step 3) |
| Port 25808 already in use                 | `kill $(lsof -t -i:25808)` then restart                      |
| Xvfb errors                               | `apt-get install -y xvfb libxkbcommon-x11-0`                 |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────┐
│  Headless Linux Server / Container               │
│                                                  │
│  start-wayland.sh                                 │
│       │                                          │
│       ▼                                          │
│  xvfb-run (virtual display)                      │
│       │                                          │
│       ▼                                          │
│  ┌────────────────────────────┐                  │
│  │  Wayland (Electron)        │                   │
│  │  ├─ Chromium (port 25808) │                   │
│  │  │  └─ proxy.pac          │──► PAC decides:   │
│  │  │     per-request        │   PROXY or DIRECT │
│  │  └─ Node.js (API calls)   │                   │
│  └────────────────────────────┘                  │
│           │                                      │
│           ▼                                      │
│  ┌─────────────────────────┐                     │
│  │ SSH Reverse Tunnel      │                     │
│  │ 127.0.0.1:7897          │                     │
│  │ (when available)        │                     │
│  └─────────────────────────┘                     │
│           │                                      │
│  ┌────────┴───────┐                              │
│  │  ngrok tunnel  │ (optional, for public URL)   │
│  └────────────────┘                              │
└──────────────────────────────────────────────────┘
```

---

---

# Chinese Version

# Wayland Headless Server Deployment Guide

Deploy Wayland WebUI on headless Linux servers (cloud VMs, Kubernetes Pods, containers) with proxy auto-fallback support.

## Prerequisites

- Linux x86_64 (Ubuntu 20.04+ / Debian 11+ recommended)
- At least 2GB RAM
- Wayland `.deb` package ([download](https://github.com/FerroxLabs/wayland/releases))

## Installation

```bash
# Download the latest .deb package
wget https://github.com/FerroxLabs/wayland/releases/latest/download/Wayland-linux-amd64.deb

# Install
sudo dpkg -i Wayland-linux-amd64.deb
sudo apt-get install -f  # Fix missing dependencies
```

> **Container environments**: If you encounter `libegl1` / `libgles2` dependency errors (common with NVIDIA runtimes), use `dpkg --force-all -i` to force install.

## Virtual Display (Xvfb)

Wayland is an Electron app and requires a display server. On headless servers, install Xvfb:

```bash
sudo apt-get install -y xvfb
```

## Service Management Script

Many cloud/container environments lack systemd. Use the following nohup-based management script.

Create `/opt/Wayland/start-wayland.sh`:

```bash
#!/bin/bash
# Wayland WebUI headless startup script
# Usage: ./start-wayland.sh [start|stop|restart|status]

PIDFILE="/var/run/wayland.pid"
LOGFILE="/var/log/wayland.log"
WORKDIR="$HOME"  # Change to your workspace directory

start() {
    if [ -f "$PIDFILE" ] && kill -0 "$(cat $PIDFILE)" 2>/dev/null; then
        echo "Wayland is already running (PID: $(cat $PIDFILE))"
        return 1
    fi
    echo "Starting Wayland WebUI..."
    cd "$WORKDIR"

    nohup xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" \
        /usr/bin/Wayland --webui --remote \
        > "$LOGFILE" 2>&1 &
    echo $! > "$PIDFILE"
    sleep 3
    if kill -0 "$(cat $PIDFILE)" 2>/dev/null; then
        echo "Wayland started successfully (PID: $(cat $PIDFILE))"
        echo "WebUI: http://$(hostname -I | awk '{print $1}'):25808"
    else
        echo "Wayland failed to start. Check log: $LOGFILE"
        rm -f "$PIDFILE"
        return 1
    fi
}

stop() {
    if [ ! -f "$PIDFILE" ]; then
        echo "Wayland is not running"
        return 1
    fi
    PID=$(cat "$PIDFILE")
    echo "Stopping Wayland (PID: $PID)..."
    kill "$PID" 2>/dev/null
    sleep 2
    kill -9 "$PID" 2>/dev/null
    pkill -f "Wayland --webui" 2>/dev/null
    rm -f "$PIDFILE"
    echo "Wayland stopped."
}

restart() { stop; sleep 1; start; }

status() {
    if [ -f "$PIDFILE" ] && kill -0 "$(cat $PIDFILE)" 2>/dev/null; then
        echo "Wayland is running (PID: $(cat $PIDFILE))"
        ss -tlnp | grep 25808
    else
        echo "Wayland is not running."
        rm -f "$PIDFILE" 2>/dev/null
    fi
}

case "${1:-start}" in
    start) start ;; stop) stop ;; restart) restart ;; status) status ;;
    *) echo "Usage: $0 {start|stop|restart|status}" ;;
esac
```

## Remote Access

Wayland WebUI listens on port **25808**. Choose a method based on your network setup:

| Method      | Use case                    | Command                                    |
| ----------- | --------------------------- | ------------------------------------------ |
| Direct      | Server has a public IP      | Open port 25808 in security group/firewall |
| ngrok       | NAT / K8s / no public IP    | `ngrok http 25808`                         |
| SSH tunnel  | Personal use only           | `ssh -L 25808:127.0.0.1:25808 user@server` |

## Proxy with Auto-Fallback

When the server needs a proxy for certain APIs (e.g., via an SSH reverse tunnel to a local VPN), use **PAC auto-fallback**: route through the proxy when available, fall back to direct connection automatically - no restart needed.

### Step 1: SSH Reverse Tunnel (Run on Your Local Machine)

```bash
ssh -R 7897:127.0.0.1:7897 user@YOUR_SERVER
```

### Step 2: PAC File for Wayland (Electron Layer)

The problem with `--proxy-server`: when the proxy goes down, **all requests** fail. Use a PAC file for automatic fallback instead.

Create `/opt/Wayland/proxy.pac`:

```javascript
function FindProxyForURL(url, host) {
  if (
    isPlainHostName(host) ||
    host === '127.0.0.1' ||
    host === 'localhost' ||
    shExpMatch(host, '10.*') ||
    shExpMatch(host, '192.168.*') ||
    shExpMatch(host, '172.16.*')
  ) {
    return 'DIRECT';
  }
  return 'PROXY 127.0.0.1:7897; DIRECT';
}
```

Add the following flag to the startup script: `--proxy-pac-url="file:///opt/Wayland/proxy.pac"`

**How it works**: Chromium natively supports PAC. `PROXY ...; DIRECT` means try the proxy first; if it fails, fall back to direct - evaluated per request in real time.

### Step 3: Shell Command Proxy Auto-Detection

Add the following to `~/.bashrc` so that `curl` and similar tools also detect the proxy automatically:

```bash
# === Proxy Auto-Detect ===
_auto_proxy() {
    if (echo > /dev/tcp/127.0.0.1/7897) 2>/dev/null; then
        export http_proxy=http://127.0.0.1:7897
        export https_proxy=http://127.0.0.1:7897
        export ALL_PROXY=socks5://127.0.0.1:7897
    else
        unset http_proxy https_proxy ALL_PROXY 2>/dev/null
    fi
}
_auto_proxy
PROMPT_COMMAND="_auto_proxy;${PROMPT_COMMAND}"
# === Proxy Auto-Detect End ===
```

**How it works**: `PROMPT_COMMAND` runs before every shell prompt, checks whether the proxy port is reachable, and switches proxy env vars in real time.

### Step 4: Wayland Internal Proxy (Gemini API)

Configure inside WebUI: **Settings → Gemini Settings → Proxy** → `http://127.0.0.1:7897`

> This proxy is handled by the Node.js layer, independently from Chromium. When the SSH tunnel is down, only Gemini API calls are affected.

## Troubleshooting

| Issue                                     | Solution                                                      |
| ---------------------- | ------------------------------------- |
| `dpkg` dependency errors in containers    | `dpkg --force-all -i` to force install                        |
| Wayland can only access `/tmp`            | Update `WORKDIR` in the startup script                        |
| WebUI not accessible remotely             | Check firewall/security group, or use ngrok                   |
| All requests fail when proxy is down      | Use PAC file instead of `--proxy-server`                      |
| `curl` fails after SSH tunnel disconnects | Add `PROMPT_COMMAND` auto-detect to `~/.bashrc`               |
| Port 25808 already in use                 | `kill $(lsof -t -i:25808)` then restart                       |
