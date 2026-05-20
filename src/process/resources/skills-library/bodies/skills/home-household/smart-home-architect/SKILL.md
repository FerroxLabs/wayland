---
name: smart-home-architect
description: |
  Smart home hub selection, automation routines, security and privacy considerations, voice control integration, energy monitoring, and system design for connected homes.
  Use when the user asks about smart home architect, or needs help with smart home hub selection, automation routines, security and privacy considerations, voice control integration, energy monitoring, and system design for connected homes.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of smart home architect.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-maintenance automation guide"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Smart Home Architect

## When to Use

**Use this skill when:**
- User asks about smart home architect
- User needs guidance on smart home architect topics
- User wants a structured approach to smart home architect

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Smart Home Planning

### Before You Buy Anything

**Step 1: Define Your Goals**

| Goal | Example Automations |
|------|-------------------|
| Convenience | Lights on at sunset, auto-lock doors, voice-controlled everything |
| Energy savings | Smart thermostat, automated lighting schedules, energy monitoring |
| Security | Cameras, smart locks, motion sensors, automated alerts |
| Entertainment | Multi-room audio, automated TV/projector, ambient lighting scenes |
| Comfort | Climate zone control, automated blinds, wake-up routines |
| Accessibility | Voice control for mobility limitations, automated door openers |

**Step 2: Choose Your Ecosystem**

This is the most important decision. Mixing ecosystems creates complexity.

| Ecosystem | Strengths | Weaknesses | Best For |
|-----------|----------|------------|----------|
| Apple HomeKit | Privacy-first, reliable, secure | Smaller device selection, Apple-only | Apple households, privacy-focused |
| Google Home | Excellent voice assistant, wide compatibility | Privacy concerns, Google dependency | Android users, voice-heavy homes |
| Amazon Alexa | Largest device selection, affordable | Privacy concerns, ad creep | Budget-conscious, variety seekers |
| Samsung SmartThings | Protocol-agnostic, powerful automations | Steeper learning curve | Tinkerers, mixed-brand homes |
| Home Assistant | Maximum flexibility, local control, privacy | Requires technical skill, self-hosted | Technical users, privacy purists |

**Step 3: Choose Your Protocol**

| Protocol | Range | Speed | Power | Best For |
|----------|-------|-------|-------|----------|
| Wi-Fi | Good | Fast | High (plugged in) | Cameras, speakers, displays |
| Zigbee | Good (mesh) | Fast | Very low (battery) | Sensors, bulbs, switches |
| Z-Wave | Good (mesh) | Moderate | Very low | Locks, sensors, switches |
| Matter | Varies | Fast | Varies | Future-proof, cross-platform |
| Bluetooth | Short | Moderate | Low | Proximity-based, simple devices |
| Thread | Good (mesh) | Fast | Very low | Next-gen sensors, newer devices |

**Recommendation**: Matter/Thread is the emerging standard backed by Apple, Google, Amazon, and Samsung. For new installations, prefer Matter-compatible devices when available.

## Room-by-Room Setup Guide

### Living Room
- **Smart lighting**: Bulbs or switches (switches are better - they work for everyone)
- **Smart speaker/display**: Central voice control hub
- **Smart TV or streaming device**: Voice-integrated entertainment
- **Smart plugs**: For lamps, fans, and non-smart devices
- **Motion sensor**: Auto-on lights, presence detection

### Kitchen
- **Smart display**: Recipe display, timers, video calls while cooking
- **Smart plugs**: Coffee maker on schedule, slow cooker remote control
- **Water leak sensor**: Under sink, near dishwasher
- **Smart lighting**: Task lighting with dimming capability

### Bedroom
- **Smart lighting**: Warm dim bulbs, wake-up light simulation
- **Smart blinds/shades**: Auto-open with alarm, close at night
- **Smart speaker**: Alarm, sleep sounds, voice control from bed
- **Temperature sensor**: Bedroom climate zone control

### Entryway
- **Smart lock**: Keyless entry, auto-lock, guest codes
- **Video doorbell**: See and talk to visitors remotely
- **Contact sensor**: Door open/close detection
- **Smart lighting**: Auto-on when arriving home

### Bathroom
- **Motion-activated lighting**: Night mode (dim, warm) vs. day mode (bright)
- **Humidity sensor**: Trigger exhaust fan automatically
- **Water leak sensor**: Near toilet, under vanity
- **Smart speaker (waterproof)**: Music, news, timers

## Automation Routines

### Essential Automations

**Good Morning**
```
Trigger: Alarm goes off (or 6:30 AM weekdays)
Actions:
  - Gradually increase bedroom lights over 15 minutes
  - Open bedroom blinds
  - Set thermostat to daytime temp
  - Start coffee maker
  - Play morning briefing on kitchen speaker
  - Announce weather and calendar events
```

**Leaving Home**
```
Trigger: Everyone's phone leaves geofence (or "Goodbye" voice command)
Actions:
  - Turn off all lights
  - Lock all doors
  - Set thermostat to away mode
  - Arm security system
  - Turn off non-essential smart plugs
  - Close garage door if open
```

**Arriving Home**
```
Trigger: First person's phone enters geofence
Actions:
  - Unlock front door
  - Turn on entryway and living room lights
  - Set thermostat to comfort mode
  - Disarm security system
  - Play welcome music (optional)
```

**Good Night**
```
Trigger: "Good night" voice command (or 10:30 PM)
Actions:
  - Turn off all lights except nightlights
  - Lock all doors
  - Close all blinds
  - Set thermostat to sleep temperature
  - Arm security system (home mode)
  - Set bathroom lights to night mode (dim, red)
  - Start white noise machine
```

**Away on Vacation**
```
Trigger: Manual activation
Actions:
  - Randomize light patterns to simulate occupancy
  - Lower thermostat to energy-saving mode
  - Send daily camera snapshot summaries
  - Alert on any door/window sensor activation
  - Pause robot vacuum schedule
  - Monitor water leak sensors with immediate alerts
```

### Conditional Automations

**Weather-Based**
- If temperature drops below 32F: Alert about pipes, adjust thermostat
- If UV index is high: Close motorized blinds on south-facing windows
- If rain is forecast: Send reminder to close windows, cancel sprinkler

**Time-Based**
- Sunset: Turn on outdoor and accent lighting
- Midnight: Ensure all doors locked, lights off
- Work hours: Set office lighting to bright/cool, minimize distractions

**Presence-Based**
- Room occupied: Lights on, climate active
- Room empty 15 minutes: Lights off, climate to setback
- No one home for 30 minutes: Full away mode

## Security Considerations

### Smart Home Security Layers

**Network Security (Critical)**
- Separate IoT network: Put smart devices on their own Wi-Fi SSID/VLAN
- Strong router password (not default)
- WPA3 encryption when possible
- Regular firmware updates on router
- Disable UPnP (Universal Plug and Play) on router
- Use a firewall that monitors IoT traffic

**Device Security**
- Change ALL default passwords immediately
- Enable two-factor authentication on every account
- Keep all device firmware updated
- Disable features you do not use (remote access, microphone on devices that do not need it)
- Buy from reputable manufacturers with security track records

**Account Security**
- Unique, strong password for each smart home platform
- Password manager for all accounts
- Two-factor authentication on every account
- Review connected devices and authorized apps quarterly

### Privacy Considerations

**Voice Assistants**
- Understand: voice assistants record and transmit audio to cloud servers
- Review and delete voice recordings periodically
- Disable "always listening" features in rooms where privacy is critical
- Use physical mute buttons when desired
- Consider local-only voice processing (Home Assistant with local STT)

**Cameras**
- Indoor cameras: Consider if the convenience is worth the privacy trade-off
- Position cameras on entrances and exteriors, not bedrooms or bathrooms
- Use cameras with local storage option (not cloud-only)
- Enable recording indicators (lights that show when active)
- Secure camera feeds with strong passwords and 2FA
- Understand who has access (family members, the cloud provider)

**Data Privacy**
- Read privacy policies for major platforms
- Opt out of data sharing where possible
- Prefer devices with local processing over cloud-dependent ones
- Consider which data you are comfortable sharing with which companies

## Energy Monitoring and Optimization

### Smart Thermostat Strategy
- **Savings**: Smart thermostats save 10-15% on heating/cooling (EPA estimates)
- **Learning thermostats** (Nest, Ecobee): Adapt to your schedule automatically
- **Temperature sensors**: Place in most-used rooms for zone-based comfort
- **Schedule**: Program setbacks during sleep and away periods
- **Geofencing**: Auto-adjust when everyone leaves/returns

### Energy Monitoring
- **Whole-home monitor** (Sense, Emporia Vue): Track total consumption and identify individual devices
- **Smart plugs with monitoring**: Track energy use of specific appliances
- **Solar integration**: Monitor generation vs. consumption
- **Time-of-use optimization**: Shift high-consumption activities to off-peak hours

### Cost Optimization Rules
- LED smart bulbs use 80% less energy than incandescent
- Smart plugs eliminate phantom/standby power draw
- Automated lighting ensures lights are never left on in empty rooms
- Climate setbacks during away/sleep save 10-15% annually
- Peak hour awareness: automate high-draw devices for off-peak times

## Troubleshooting Common Issues

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| Device goes offline repeatedly | Wi-Fi range or congestion | Add mesh Wi-Fi node, reduce device density per access point |
| Automation does not trigger | Condition not met, device offline | Check trigger conditions, verify device connectivity |
| Voice commands not recognized | Device name conflict, network issue | Rename devices to unique names, check connectivity |
| Slow response times | Cloud latency, Wi-Fi congestion | Prefer local-processing devices, improve Wi-Fi |
| Battery devices die quickly | Too-frequent reporting, low signal | Adjust polling interval, improve mesh network |
| Devices incompatible | Different protocols/ecosystems | Use a bridge (e.g., Zigbee stick with Home Assistant) |

## Getting Started: Recommended First Purchases

**Phase 1 (Week 1): Foundation**
- Smart speaker or display (voice control hub)
- 3-4 smart bulbs or 2 smart switches (most-used rooms)
- 1 smart plug (coffee maker or lamp)

**Phase 2 (Month 1): Security and Comfort**
- Smart lock for front door
- Video doorbell
- Smart thermostat

**Phase 3 (Month 2-3): Expansion**
- Motion sensors for key rooms
- Additional smart switches
- Water leak sensors
- Door/window contact sensors

**Phase 4 (Month 3+): Advanced**
- Smart blinds/shades
- Multi-room audio
- Energy monitoring
- Outdoor lighting automation
- Camera system (if desired)

**Budget**: Start with $200-400 for Phase 1. Full smart home: $1,000-3,000+ depending on scope.


## Output Format

```
SMART HOME ARCHITECT OUTPUT
===========================

Section 1: Assessment / Analysis
- Key findings
- Recommendations

Section 2: Action Plan
- Step-by-step guidance
- Timeline if applicable

Section 3: Resources
- Relevant references
- Next steps
```

## Example

**Input:** "Help me get started with smart home architect"

**Output:** A structured smart home architect plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
