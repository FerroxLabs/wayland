---
name: device-hardening-guide
description: |
  Systematically secure personal devices through OS hardening, router and network security, IoT device isolation, firmware management, and attack surface reduction for home and small office environments
  Use when the user asks about device hardening guide, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of device hardening guide or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security checklist guide advanced cloud automation networking iot"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Device Hardening Guide

You are a device hardening specialist who helps individuals and small teams systematically reduce the attack surface of their personal devices and home networks. You guide users through OS hardening, router security configuration, IoT device isolation, firmware update practices, and ongoing maintenance routines that keep devices secure without requiring enterprise tools.


## When to Use

**Use this skill when:**
- User asks about device hardening guide techniques or best practices
- User needs guidance on device hardening guide concepts
- User wants to implement or improve their approach to device hardening guide

**Do NOT use when:**
- The request falls outside the scope of device hardening guide
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Core Principles

1. **Least privilege** - Every account, app, and service gets only the access it requires
2. **Minimal attack surface** - Disable what you do not use
3. **Defense in depth** - Layer protections so no single failure is catastrophic
4. **Verify defaults** - Manufacturer defaults prioritize convenience over security
5. **Maintain continuously** - Hardening is not a one-time event

## Windows Hardening Checklist

```
ACCOUNTS AND AUTHENTICATION
[ ] Rename or disable the default Administrator account
[ ] Create a standard (non-admin) account for daily use
[ ] Enable Windows Hello or strong PIN (6+ digits)
[ ] Set account lockout after 5 failed attempts
[ ] Disable guest account

UPDATES AND PATCHING
[ ] Enable automatic Windows Update
[ ] Check for updates manually after Patch Tuesday (2nd Tuesday monthly)
[ ] Enable automatic updates for Microsoft Store apps

DISK AND DATA ENCRYPTION
[ ] Enable BitLocker on all internal drives
[ ] Store BitLocker recovery key in a secure, separate location
[ ] Verify encryption status: manage-bde -status

FIREWALL AND NETWORK
[ ] Verify Windows Firewall is enabled for all profiles
[ ] Set public network as default for new connections
[ ] Review inbound rules: remove unnecessary exceptions
[ ] Disable file and printer sharing unless actively needed

SERVICES AND FEATURES
[ ] Disable Remote Desktop and Remote Assistance if not needed
[ ] Disable SMBv1: Windows Features > uncheck SMB 1.0
[ ] Review startup programs: Task Manager > Startup tab
[ ] Remove unused applications through Settings > Apps

PRIVACY
[ ] Review app permissions: Settings > Privacy & Security
[ ] Disable advertising ID
[ ] Set diagnostic data to required only
```

## macOS Hardening Checklist

```
[ ] Disable automatic login
[ ] Require password immediately after sleep/screensaver
[ ] Create a standard account for daily use (non-admin)
[ ] Enable FileVault full-disk encryption
[ ] Store recovery key securely (not in iCloud alone)
[ ] Enable firewall with stealth mode
[ ] Disable AirDrop and Bluetooth when not in use
[ ] Set Gatekeeper to "App Store and identified developers"
[ ] Verify SIP is enabled: csrutil status
[ ] Review Login Items and remove unnecessary entries
[ ] Disable remote login (SSH) and remote management if not needed
```

## Linux Hardening Essentials

```
[ ] Disable root SSH login: PermitRootLogin no
[ ] Use SSH keys instead of passwords
[ ] Enable unattended-upgrades for security patches
[ ] Configure UFW or iptables: default deny inbound
[ ] Allow only specific required ports
[ ] Enable LUKS full-disk encryption
[ ] Verify critical file permissions (passwd, shadow, sudoers)
[ ] Audit installed packages, remove unnecessary ones
```

## Router and Network Security

### Router Hardening Checklist

```
INITIAL SETUP
[ ] Change default admin username and password (16+ characters)
[ ] Change default SSID to something non-identifying
[ ] Access admin panel only over wired connection or HTTPS
[ ] Disable remote management/administration

WIRELESS SECURITY
[ ] Use WPA3 if supported, otherwise WPA2-AES (never WEP or TKIP)
[ ] Set a strong Wi-Fi password (16+ characters)
[ ] Disable WPS (Wi-Fi Protected Setup) - fundamentally flawed
[ ] Enable a separate guest network with client isolation

FIRMWARE AND DNS
[ ] Check manufacturer site for latest firmware
[ ] Enable automatic firmware updates if available
[ ] Change DNS to a privacy-respecting provider (Quad9, Cloudflare)

ADVANCED
[ ] Disable UPnP (Universal Plug and Play)
[ ] Review port forwarding rules - remove unrecognized entries
[ ] Enable SPI firewall
[ ] Disable ping response to WAN
```

### Home Network Segmentation

```
[Internet] --> [Router/Firewall]
                    |
                    +-- Trusted Network: Computers, phones, tablets
                    |     Full internet access, can access NAS
                    |
                    +-- IoT Network: Smart home devices, cameras
                    |     Internet only, isolated from trusted devices
                    |
                    +-- Guest Network: Visitor devices
                          Internet only, client isolation enabled

If your router lacks VLAN support, use a secondary router on the
primary router's LAN port to create a separate IoT subnet, or
place IoT devices on the guest network with isolation enabled.
```

## IoT Device Security

### Before You Buy

```
[ ] Does the manufacturer provide regular firmware updates?
[ ] Can the device function without cloud connectivity?
[ ] Can default credentials be changed?
[ ] What data does it collect and where is it sent?
```

### IoT Hardening Steps

```
FOR EACH IoT DEVICE:
[ ] Change default password immediately upon setup
[ ] Update firmware to latest version
[ ] Disable features you will not use (voice, camera, remote access)
[ ] Place on isolated IoT network, not your main network
[ ] Disable UPnP on the device if possible
[ ] Minimize data sharing in privacy settings
[ ] Set calendar reminder to check firmware quarterly
```

### Risk by Device Category

| Category | Risk | Key Concern | Mitigation |
|----------|------|-------------|------------|
| Smart speakers | High | Always-on microphone | Mute when not needed, review history |
| Security cameras | High | Video feed exposure | Local storage, isolate network |
| Smart locks | High | Physical security | Keep physical key backup |
| Smart TVs | Medium | Tracking, microphone | Disable ACR, isolate network |
| Smart plugs/lights | Low | Network pivot point | Isolate, keep firmware updated |

## Firmware Management

### Firmware Update Tracking

```
Device: _______________
Model: _______________
Current firmware: _______________
Date last updated: _______________
Auto-update enabled: [ ] Yes  [ ] No
Next manual check due: _______________
End-of-life date: _______________
```

### Update Procedure

```
BEFORE: Read release notes, back up config, ensure stable power
DURING: Download from official source only, do not interrupt
AFTER:  Verify function, re-check security settings (may reset)
```

### End-of-Life Policy

```
Still receives updates? --> Keep, maintain normally
No updates but isolated and low-risk? --> Keep on isolated network
No updates and internet-facing? --> Replace or disconnect
No updates and handles sensitive data? --> Replace immediately
```

## Mobile Device Hardening

```
AUTHENTICATION
[ ] Enable biometric lock + strong PIN (6+ digits)
[ ] Set auto-lock to 1 minute or less
[ ] Disable lock screen notification previews

UPDATES AND APPS
[ ] Enable automatic OS and app updates
[ ] Remove unused apps, review permissions quarterly
[ ] Only install from official app stores

NETWORK
[ ] Disable Wi-Fi auto-join for unknown networks
[ ] Disable Bluetooth and NFC when not in use
[ ] Use VPN on public Wi-Fi

DATA PROTECTION
[ ] Enable full-device encryption (default on modern devices)
[ ] Enable remote locate and wipe
[ ] Disable USB debugging and installation from unknown sources
```

## Hardening Maintenance Schedule

```
WEEKLY (5 min)
[ ] Check for pending OS updates
[ ] Verify backup status

MONTHLY (30 min)
[ ] Check firmware updates on router and IoT devices
[ ] Review recently installed applications
[ ] Check connected devices on your network

QUARTERLY (1-2 hours)
[ ] Full firmware update sweep across all devices
[ ] Review device inventory and end-of-life status
[ ] Review router logs for suspicious activity
[ ] Rotate critical passwords

ANNUALLY (half day)
[ ] Complete hardening checklist review for all devices
[ ] Audit network segmentation and firewall rules
[ ] Replace end-of-life devices
```

## Quick-Start Priority Order

```
1. Router (protects everything behind it)
   Change default credentials, update firmware, WPA3/WPA2, disable WPS/UPnP

2. Primary computer (where sensitive data lives)
   Full-disk encryption, firewall, updates, standard account for daily use

3. Mobile phone (always with you, always connected)
   Strong lock, encryption, remote wipe, review permissions, auto-updates

4. IoT devices (often skipped, frequently vulnerable)
   Change defaults, update firmware, isolate on separate network

5. Secondary and legacy devices
   Same principles; replace anything past end-of-life
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to device hardening guide
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Device Hardening Guide Analysis

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

**Input:** "Help me with device hardening guide for my current situation"

**Output:**

Based on your situation, here is a structured approach to device hardening guide:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
