# Wayland WebUI Configuration Guide

## Overview

Wayland supports WebUI mode, allowing you to access the application through a browser. This is particularly useful for accessing Wayland remotely. Wayland provides three remote connection methods to suit different scenarios.

**Important**: WebUI configuration should be done through the Wayland settings interface - no command line required. This guide walks you through the configuration steps in the settings UI.

## Three Remote Connection Methods

| Connection Method               | Use Case                                    | Description                                                              | Difficulty     |
| ------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ | -------------- |
| **1. LAN Connection**           | Devices on the same WiFi/LAN                | Phone and computer on the same WiFi - just enable "Allow Remote Access"  | ⭐ Easy        |
| **2. VPN Software (Tailscale)** | Cross-network access (e.g. office to home)  | Uses VPN software like Tailscale - no public IP or server required       | ⭐ Very Easy   |
| **3. Server Deployment**        | Multi-user access, 24/7 uptime              | Deploy on a cloud server, accessible via public IP                       | ⭐⭐ Moderate  |

### How to Choose?

- **Same WiFi** → Use **LAN Connection**
- **Accessing home from office, or using mobile data** → Use **VPN Software (Tailscale)**
- **Need multi-user access or 24/7 uptime** → Use **Server Deployment**

---

## Default Configuration

- **Default port**: 25808
- **Local access URL**: `http://localhost:25808`
- **Remote access URL**: `http://<LAN_IP>:25808` (requires "Allow Remote Access" to be enabled)
- **Default username**: `admin`
- **Initial password**: Auto-generated on first launch and displayed in the settings interface

---

## Quick Start: Configuring WebUI Through the Settings Interface

### Opening the WebUI Settings

**Method 1: Via the Settings Button (Recommended)**

1. In the Wayland main interface, click the **Settings icon** (gear icon) in the bottom-left corner
2. In the settings menu, click **"WebUI"**
3. The WebUI configuration screen will open

**Method 2: Via Keyboard Shortcut**

- In the Wayland main interface, use the keyboard shortcut to open settings (see Wayland help docs for the exact shortcut)

**Method 3: Via URL (WebUI Mode)**

- If already in WebUI mode, navigate to: `http://<server-address>:25808/#/settings/webui`

### Configuration Steps

#### Step 1: Enable WebUI

1. In the WebUI settings screen, find the **"Enable WebUI"** toggle
2. Switch the toggle to the **on** position
3. Wait a few seconds - once the WebUI service starts, it will show a **"✓ Running"** status

#### Step 2: Enable Remote Access (if needed)

1. In the **"Allow Remote Access"** option, switch the toggle to the **on** position
2. If WebUI is already running, the system will automatically restart to apply the new setting

#### Step 3: Get Access Information

Once WebUI is running, the settings screen will display:

1. **Access URLs**:
   - **Local access**: `http://localhost:25808` (this machine only)
   - **Network access**: `http://<LAN_IP>:25808` (if remote access is enabled)

2. **Login credentials**:
   - **Username**: `admin` (click to copy)
   - **Password**: The initial password is displayed on first launch (click to copy)
   - If the password is hidden, click the **Reset icon** next to the password field to reset and display a new password

3. **QR code login** (if remote access is enabled):
   - Scan the QR code with your phone to log in automatically in the mobile browser
   - The QR code expires after 5 minutes - click "Refresh QR Code" to get a new one

---

## Method 1: LAN Connection

### Use Cases

- Phone and computer on the same WiFi
- Devices on the same local network
- Temporary remote access

### Configuration Steps

#### Step 1: Open the WebUI Settings

1. In the Wayland main interface, click the **Settings icon** in the bottom-left corner
2. Click **"WebUI"**

#### Step 2: Enable WebUI and Remote Access

1. Switch the **"Enable WebUI"** toggle to the **on** position
2. Switch the **"Allow Remote Access"** toggle to the **on** position
3. Wait for the service to finish starting

#### Step 3: Copy the Access URL

1. In the settings screen, find the **"Access URLs"** section
2. Copy the **network access URL** (format: `http://<LAN_IP>:25808`)
3. If the network access URL is not visible, "Allow Remote Access" is not enabled - go back to Step 2

#### Step 4: Access From the Remote Device

1. Make sure the remote device is on the same WiFi network as the Wayland computer
2. In the remote device's browser, paste and navigate to the copied URL
3. Log in using the **username** and **password** shown in the settings screen

---

## Method 2: VPN Software (Tailscale) - Cross-Network Access

### Use Cases

- Accessing your home Wayland from the office
- Accessing your home Wayland from a phone on mobile data
- Cross-network access without needing a public IP

### Advantages

- ⭐ Very simple: install the app, log in, done
- 🔒 Secure: encrypted VPN connection
- 🚀 Fast: no firewall or port-forwarding configuration needed
- 📱 Mobile-friendly: works on phones, tablets, and more

### Configuration Steps

#### Step 1: Configure WebUI on the Wayland Computer

1. **Open the WebUI settings screen**:
   - In the Wayland main interface, click the **Settings icon** in the bottom-left corner
   - Click **"WebUI"**

2. **Enable WebUI**:
   - Switch the **"Enable WebUI"** toggle to the **on** position
   - **Note**: When using Tailscale, you do **not** need to enable "Allow Remote Access" - Tailscale handles the networking

3. **Note down the access information**:
   - Note the **local access URL** shown (`http://localhost:25808`)
   - Note the **username** and **password**

#### Step 2: Install and Log In to Tailscale on the Wayland Computer

1. Visit [Tailscale's website](https://tailscale.com/) to download and install
2. Log in to your Tailscale account (register if this is your first time)
3. Confirm Tailscale shows "Connected" status

#### Step 3: Get the Tailscale IP

1. On the Wayland computer, open the Tailscale app
2. Note the Tailscale IP address shown (e.g. `100.x.x.x`)
3. Construct the access URL: `http://<Tailscale_IP>:25808`

#### Step 4: Install and Log In to Tailscale on the Remote Device

1. Install Tailscale on your phone or other remote device
2. Log in using the same Tailscale account
3. Confirm it shows "Connected" status

#### Step 5: Access From the Remote Device's Browser

1. Open the browser
2. Navigate to `http://<Tailscale_IP>:25808` (the address from Step 3)
3. Log in using the **username** and **password** shown in the settings screen

### Common Commands

```bash
# Check Tailscale status
tailscale status

# Check Tailscale IP
tailscale ip

# List all devices
tailscale status --json
```

---

## Method 3: Server Deployment

### Use Cases

- Multi-user access required
- 24/7 uptime required
- Deploying on a cloud server
- Accessible via public IP or domain name

### Prerequisites

- Cloud server (Linux/macOS)
- Public IP or domain name
- Firewall configuration access

---

### Linux Server Deployment (Recommended)

#### Step 1: Install Wayland on the Server

Follow the Wayland installation guide to install the Wayland application on the server.

#### Step 2: Configure WebUI Through the Settings Interface

1. **Open the WebUI settings screen**:
   - If the server has a graphical interface, open the Wayland application directly
   - If the server has no graphical interface, access the GUI via SSH port forwarding or VNC

2. **Configure WebUI**:
   - Click the **Settings icon** in the bottom-left corner
   - Click **"WebUI"**
   - Switch the **"Enable WebUI"** toggle to the **on** position
   - Switch the **"Allow Remote Access"** toggle to the **on** position

3. **Note down the access information**:
   - Note the **network access URL** shown (`http://<server_IP>:25808`)
   - Note the **username** and **password**

#### Step 3: Configure the Firewall

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 25808/tcp
sudo ufw reload

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=25808/tcp
sudo firewall-cmd --reload

# Or use iptables
sudo iptables -A INPUT -p tcp --dport 25808 -j ACCEPT
```

#### Step 4: Configure Auto-Start on Boot (Optional)

If you need Wayland to start automatically on boot, you can configure a systemd service. However, it is recommended to manage the WebUI through the Wayland settings interface rather than the command line.

#### Step 5: Get the Access URL

1. Get the server's public IP:

   ```bash
   curl ifconfig.me
   # or
   curl ipinfo.io/ip
   ```

2. Access URL: `http://<public_IP>:25808`

3. If you have a domain name configured: `http://<domain>:25808`

---

### macOS Server Deployment

#### Step 1: Install Wayland on the Server

Follow the Wayland installation guide to install the Wayland application on the macOS server.

#### Step 2: Configure WebUI Through the Settings Interface

1. Open the Wayland application
2. Click the **Settings icon** in the bottom-left corner
3. Click **"WebUI"**
4. Switch both **"Enable WebUI"** and **"Allow Remote Access"** toggles to the **on** position

#### Step 3: Configure the Firewall

```bash
# Allow port 25808
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /Applications/Wayland.app/Contents/MacOS/Wayland
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /Applications/Wayland.app/Contents/MacOS/Wayland
```

---

## Settings Interface Feature Reference

### WebUI Service Configuration

- **Enable WebUI**: Start or stop the WebUI service
- **Allow Remote Access**: When enabled, allows other devices on the LAN to connect
- **Access URLs**: Shows local and network access URLs (click to copy)

### Login Credentials

- **Username**: Default is `admin` (click to copy)
- **Password**:
  - The initial password is displayed on first launch (click to copy)
  - If the password is hidden, click the **Reset icon** to reset and display a new password
  - Click **Change Password** to set a custom password

### QR Code Login

- Only displayed when remote access is enabled
- Scan the QR code with your phone to log in automatically in the mobile browser
- The QR code expires after 5 minutes - click "Refresh QR Code" to get a new one

### Channels Configuration

- Configure Bot Tokens for chat platforms such as Telegram and Lark
- Enables accessing Wayland through IM applications

---

## Troubleshooting

### WebUI Won't Start

1. **Check if the port is already in use**:
   - If startup fails, the settings screen usually displays an error message
   - If the port is occupied, you can change the port in the configuration file (see "Custom Port" below)

2. **Check firewall settings**:
   - Linux: `sudo ufw status` or `sudo firewall-cmd --list-all`
   - macOS: System Preferences > Security & Privacy > Firewall
   - Windows: Control Panel > Windows Defender Firewall

### Cannot Access Remotely

1. **Confirm "Allow Remote Access" is enabled**:
   - In the WebUI settings screen, check that the "Allow Remote Access" toggle is on

2. **Check firewall settings** (see above)

3. **Confirm devices are on the same LAN** (for LAN connection method)

4. **Verify the IP address is correct**:
   - Check the "Network Access URL" displayed in the settings screen

5. **Check cloud server security group rules** (for server deployment method)

### Forgot Password

1. **Reset via the settings screen**:
   - In the WebUI settings screen, find the "Login Credentials" section
   - Click the **Reset icon** next to the password field
   - The new password will appear on screen - click to copy

### Tailscale Issues

**Q: Tailscale shows disconnected?**

- Check your network connection
- Confirm your Tailscale account is logged in
- Restart the Tailscale service

**Q: Cannot access via Tailscale IP?**

- Confirm both devices are logged in to Tailscale
- Check Tailscale status: `tailscale status`
- Confirm Wayland WebUI is enabled in the settings screen

---

## Custom Port

If you need to use a port other than the default (25808), you can set it via the configuration file:

### Configuration File Location

| Platform | Configuration File Path                                          |
| -------- | ---------------------------------------------------------------- |
| Windows  | `%APPDATA%/Wayland/webui.config.json`                            |
| macOS    | `~/Library/Application Support/Wayland/webui.config.json`        |
| Linux    | `~/.config/Wayland/webui.config.json`                            |

### Configuration Example

```json
{
  "port": 8080,
  "allowRemote": true
}
```

**Note**: After modifying the configuration file, you need to restart the WebUI service in the settings screen for the changes to take effect.

---

## Security Recommendations

### Basic Security

1. **Change the initial password**: After first launch, change the password immediately in the settings screen
2. **Use a strong password**: At least 8 characters, including letters, numbers, and special characters
3. **Rotate your password regularly**: It is recommended to change your password periodically

### Remote Access Security

1. **Only use remote access on trusted networks**
2. **Use Tailscale**: For cross-network access, Tailscale provides an encrypted connection and is more secure
3. **Configure your firewall**: Only allow access from necessary IP addresses
4. **Use HTTPS**: For production environments, it is recommended to configure HTTPS (requires a reverse proxy such as Nginx)

### Server Deployment Security

1. **Configure firewall rules**: Only open necessary ports
2. **Use a strong password**: Avoid default or weak passwords
3. **Keep software updated**: Keep Wayland and the operating system up to date
4. **Monitor logs**: Regularly review access logs
5. **Consider a reverse proxy**: Use Nginx or similar with SSL/TLS configured

### Tailscale Advantages

- 🔒 **Encrypted connections**: All traffic is encrypted
- 🛡️ **Zero-trust network**: Only authorized devices can connect
- 🚀 **Zero configuration**: No firewall or port-forwarding setup required
- 📱 **Cross-platform**: Supports Windows, macOS, Linux, iOS, and Android

---

## Integration with OpenClaw

Once WebUI is running, you can access Wayland through a browser and:

1. **Find the OpenClaw entry on the home page** (ACP agent list)
2. **Chat directly with OpenClaw**
3. **Enjoy the full Wayland interface**:
   - File preview and management
   - Multi-conversation management
   - Full tool and skill support

---

## Related Resources

- [Wayland Wiki - Remote Internet Access Guide](https://github.com/FerroxLabs/wayland/wiki/Remote-Internet-Access-Guide)
- [Wayland Wiki - WebUI Configuration Guide](https://github.com/FerroxLabs/wayland/wiki/WebUI-Configuration-Guide)
- [Tailscale Official Documentation](https://tailscale.com/kb/)

---

## Quick Reference

### Settings Interface Actions

1. **Open Settings**: Click the **Settings icon** in the Wayland bottom-left corner → click **"WebUI"**
2. **Enable WebUI**: Switch the "Enable WebUI" toggle to the **on** position
3. **Enable Remote Access**: Switch the "Allow Remote Access" toggle to the **on** position (if needed)
4. **Copy Access URL**: Click the **Copy icon** next to the access URL
5. **Copy Password**: Click the **Copy icon** next to the password (if visible)
6. **Reset Password**: Click the **Reset icon** next to the password

### Common Diagnostic Commands (for troubleshooting only)

```bash
# Check port
lsof -i :25808

# Check process
ps aux | grep Wayland

# Get IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Test connection
curl http://localhost:25808
```
