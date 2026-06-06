---
name: smart-home-guide
description: |
  Smart home setup advisor covering ecosystem selection (Alexa, Google, Apple HomeKit), device categories, automation routines, network setup, privacy considerations, budget-friendly approaches, and troubleshooting.
  Use when the user asks about smart home guide, or needs help with smart home setup advisor covering ecosystem selection (alexa, google, apple homekit), device categories, automation routines, network setup, privacy considerations, budget-friendly approaches, and troubleshooting.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of smart home guide.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-maintenance automation guide"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Smart Home Guide
## When to Use

**Use this skill when:**
- User asks about smart home guide
- User needs guidance on smart home guide topics
- User wants a structured approach to smart home guide

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

1. **What's your current setup?** (Any smart devices already? Which ecosystem?)
2. **What phone do you use?** (iPhone/Android -- affects ecosystem recommendation)
3. **What do you want to automate?** (Lighting, security, climate, entertainment, all)
4. **What's your primary goal?** (Convenience, energy savings, security, accessibility, fun)
5. **Budget?** (Starter/$100-300, moderate/$300-1000, comprehensive/$1000+)
6. **Technical comfort level?** (Plug and play only, comfortable with apps, can handle networking)
7. **Renting or owning?** (Impacts permanent installations)
8. **Privacy concerns?** (Always listening? Cloud vs local? Camera comfort level?)
9. **Who else lives in the home?** (Tech-savvy? Children? Elderly? Guests?)
10. **Internet setup?** (Router type, WiFi coverage, speed, mesh system?)
11. **Any specific pain points?** (Always skipping lights, security worries, energy waste)

## Ecosystem Selection

### The Big Three Comparison
```
ECOSYSTEM COMPARISON MATRIX:

                  | AMAZON ALEXA      | GOOGLE HOME        | APPLE HOMEKIT
------------------|-------------------|--------------------|-----------------
Voice Assistant   | Alexa             | Google Assistant    | Siri
Hub/Speaker       | Echo lineup       | Nest lineup         | HomePod/HomePod Mini
Best For          | Widest device     | Search, info,       | Apple users,
                  | compatibility     | natural language     | privacy, seamless
                  |                   |                     | iOS integration
Phone Pairing     | Works with both   | Best with Android   | Best with iPhone
Device Support    | Widest (150K+)    | Very wide (80K+)    | Curated (1000+)
                  |                   |                     | but growing w/ Matter
Privacy           | Cloud-based,      | Cloud-based,        | Local processing,
                  | recordings stored | recordings stored   | end-to-end encrypted
                  | (opt-out avail.)  | (opt-out avail.)    |
Local Control     | Limited           | Limited             | Strong
Price Range       | $-$$$             | $-$$$               | $$-$$$
Automation Power  | Routines (good)   | Routines (good)     | Scenes/Automations
                  |                   |                     | (good)
Multi-Room Audio  | Good              | Good                | Excellent (AirPlay 2)
Smart Display     | Echo Show series  | Nest Hub series     | None (use iPad)
Learning Curve    | Easy              | Easy                | Easy for Apple users
Intercom          | Drop-In           | Broadcast           | Intercom

RECOMMENDATION BY USER TYPE:
  Android + value focus  --> Google Home or Amazon Alexa
  iPhone + privacy focus --> Apple HomeKit
  Maximum device options --> Amazon Alexa
  Best voice assistant   --> Google Home (most natural language understanding)
  Tightest integration   --> Apple HomeKit (for all-Apple households)
  Mixed household        --> Amazon Alexa (most universal)
```

### Matter Protocol
```
MATTER: THE UNIVERSAL STANDARD

What is Matter?
  Samsung, and 250+ companies. Devices with Matter support work across
  ALL ecosystems.

Why it matters (pun intended):
  - Buy once, work everywhere (Alexa, Google, HomeKit, SmartThings)
  - Local control (faster, works without internet)
  - Improved security standards
  - No vendor lock-in

What to look for:
  - "Matter compatible" or Matter logo on packaging
  - Thread border router support (for best mesh networking)
  - Matter over WiFi (works with existing network)
  - Matter over Thread (low-power mesh, best for sensors and locks)

RECOMMENDATION: When possible, buy Matter-compatible devices.
They future-proof your investment regardless of ecosystem changes.
```

## Device Categories

### Smart Lighting
```
SMART LIGHTING OPTIONS:

SMART BULBS:

  Recommendation tiers:
    Budget: Wyze Bulb ($8), Sengled ($10)
    Mid-range: Philips Hue ($15-50, requires hub for full features)
    Premium: LIFX ($30-60, no hub needed, rich colors)

SMART SWITCHES:

  Recommendation:
    Best overall: Lutron Caseta (rock solid, no neutral wire needed)
    Budget: TP-Link Kasa or Treatlife ($15-20)
    Premium: Lutron RadioRA 3 (whole-home, professional)

SMART PLUGS:

LIGHT STRIPS:

STARTER RECOMMENDATION:
  Renters: 2-4 smart bulbs in most-used rooms + smart plugs for lamps
  Owners: Smart switches in most-used rooms + smart bulbs for accent/color
  Budget entry: 2 smart plugs ($10-15 total) for table lamps
```

### Smart Security
```
SMART SECURITY OPTIONS:
VIDEO DOORBELL:
  Purpose: See who's at the door, record activity, two-way talk
  Options:
  Installation: DIY (battery) or wired (basic electrical)
  Subscription: Most require monthly sub for video history ($3-10/month)
  Without sub: Live view only, no recording history
SECURITY CAMERAS:
  Indoor:
    Wyze Cam v3: $25 (best budget, local storage option)
    Blink Indoor: $30 (Alexa, battery powered)
  Outdoor:
    Arlo Pro: $150-250 (all ecosystems)
SMART LOCKS:
  Purpose: Keyless entry, remote lock/unlock, access codes for guests
  Options:
    Schlage Encode Plus: $250-300 (Apple Home Key, built-in WiFi)
    Yale Assure Lock 2: $200-280 (Matter, Thread)
  Installation: DIY, replaces deadbolt or fits over existing
SMART SENSORS:
  Door/window sensors: Know when doors open ($10-25 each)
  Motion sensors: Trigger lights, detect activity ($15-30 each)
  Water leak sensors: Place near water heater, washer, sinks ($10-20 each)
  Smoke/CO detectors: Google Nest Protect ($100-130, interconnected alerts)
SECURITY SYSTEM:
  DIY systems (no contract):
    Ring Alarm: $200-400 (base + sensors)
    SimpliSafe: $200-500 (base + sensors)
    Abode: $200-400 (most ecosystem-agnostic)
  Professional monitoring: $10-20/month (optional with all above)
```

### Smart Climate Control
```
SMART CLIMATE OPTIONS:

SMART THERMOSTAT:
  Quick recommendations:
    Ecobee SmartThermostat: Best room sensor system
    Google Nest: Best learning algorithm
    Budget: Wyze Thermostat ($60-80, remarkably capable)

SMART FANS:
  Ceiling fans with smart control:
    Bond Bridge: Makes existing fan smart ($80-100)
    Hunter, Fanimation: WiFi-built-in ceiling fans ($150-500)
  Stand/tower fans: Dreo, Dyson (WiFi models)

SMART VENTS:
  Direct airflow where needed, close in unused rooms:
    Flair Smart Vent: $80-100 per vent
    Keen Home Smart Vent: $80-100 per vent

SMART HUMIDIFIER/AIR PURIFIER:
  Levoit, Smartmi, Dyson: WiFi-enabled with air quality monitoring
  Automated: Turn on/off based on humidity or air quality readings
```

### Smart Entertainment
```
SMART ENTERTAINMENT:

STREAMING DEVICES:
  Amazon Fire TV Stick: $30-50 (Alexa voice control)
  Google Chromecast: $30-50 (Google Cast from phone)
  Apple TV 4K: $130-180 (AirPlay, HomeKit hub, best privacy)
  Roku: $30-100 (platform-agnostic, most apps)

MULTI-ROOM AUDIO:
  Amazon Echo: Alexa-based multi-room ($25-200 per speaker)
  Google Nest: Google-based multi-room ($30-100 per speaker)
  Sonos: Premium, works with all ecosystems ($200-500 per speaker)
  Apple HomePod: AirPlay 2 ($100-300 per speaker)

SMART TV:
  Most modern TVs have built-in smart features
  If not: add a streaming stick ($30-50)
  Voice control: "Play The Office on Netflix"
  Automation: TV turns on at 7 PM with evening routine

UNIVERSAL REMOTE:
  SofaBaton: Smart universal remote ($40-80)
  Harmony (discontinued but functional if owned)
  Most smart speakers can control smart TVs directly
```

## Automation Routines

### Essential Automations
```
TOP 10 AUTOMATIONS TO SET UP FIRST:
1. GOOD MORNING ROUTINE
   Trigger: Voice command "Good morning" or alarm time
   Actions:
     - Lights gradually brighten (simulate sunrise)
     - Thermostat adjusts to awake temperature
     - Morning news/weather briefing plays
     - Coffee maker turns on (via smart plug)
2. LEAVING HOME
   Trigger: Voice command "Goodbye" or geofence (phone leaves area)
   Actions:
     - All lights off
     - Thermostat to away mode
     - Lock all doors
     - Security system armed
     - Robot vacuum starts
3. ARRIVING HOME
   Trigger: Geofence (phone enters area) or door unlock
   Actions:
     - Exterior lights on (if after sunset)
     - Thermostat to home mode
     - Security system disarmed
     - Interior lights on in entry and main room
4. BEDTIME ROUTINE
   Trigger: Voice command "Goodnight" or set time
   Actions:
     - All lights off (except hallway night light)
     - Doors locked (verify with notification)
     - Thermostat to sleep temperature
     - Security cameras to night mode
     - White noise machine on (via smart plug)
     - Phone charge reminder
5. MOTION-ACTIVATED LIGHTS
   Trigger: Motion sensor detects movement
   Conditions: Only when dark (sunset to sunrise)
   Actions:
     - Lights turn on at 50% brightness
     - Auto-off after 5 minutes of no motion
   Best locations: Hallways, bathrooms, closets, garage
6. SUNSET AUTOMATION
   Trigger: Sunset (dynamically adjusts daily)
   Actions:
     - Exterior lights on
     - Interior accent lights on
     - Close smart blinds (if equipped)
7. WATER LEAK ALERT
   Trigger: Water sensor detects moisture
   Actions:
     - Send notification to all family phones
     - Flash lights red as visual alert
     - Smart water shutoff valve closes (if installed)
   Location: Under sinks, near water heater, near washing machine
8. GUEST MODE
   Trigger: Voice command or scene activation
   Actions:
     - Set temporary smart lock code
     - Disable interior cameras
     - Adjust thermostat for comfort
     - Set WiFi guest network
9. MOVIE NIGHT
   Trigger: Voice command "Movie time"
   Actions:
     - Living room lights dim to 10%
     - TV turns on
     - Sound system activates
     - Close blinds
10. AWAY/VACATION MODE
    Trigger: Manual activation before leaving
    Actions:
      - Lights simulate occupancy (random on/off schedule)
      - Thermostat to energy saving
      - All cameras to high alert
      - Daily summary notifications
```

### Advanced Automation Templates
```
AUTOMATION TEMPLATE:

Name: _______________
Trigger: _______________
  [ ] Time-based (specific time)
  [ ] Event-based (device state change)
  [ ] Location-based (geofence)
  [ ] Voice command
  [ ] Sensor reading (temp, humidity, motion, light level)

Conditions (if applicable):
  [ ] Only during specific times
  [ ] Only if someone is home / no one is home
  [ ] Only if a device is in a certain state
  [ ] Only on certain days

Actions (in order):
  1. _______________
  2. _______________
  3. _______________
  4. _______________

Delay between actions: ___ seconds
```

## Network Setup

### WiFi Requirements for Smart Home
```
NETWORK CONSIDERATIONS:

BANDWIDTH:
  Most smart devices use very little bandwidth individually.
  However, cameras are bandwidth-heavy:
    Each camera: 2-5 Mbps upload for HD, 5-10 for 4K
    4 cameras = 8-20 Mbps upload (check your plan's upload speed)

DEVICE COUNT:
  Average smart home: 20-50 devices
  Each device = one connection on your router

WIFI COVERAGE:
  Smart devices throughout the home need strong WiFi everywhere.
  Solution for dead spots: WiFi mesh system
    Budget: TP-Link Deco ($100-200 for 3-pack)
    Mid-range: Google Nest WiFi Pro, Eero ($200-350)
    Premium: Ubiquiti, Netgear Orbi ($300-600)

NETWORK SEGMENTATION (advanced, recommended):
  Create separate WiFi networks:
    1. Main network: phones, computers, tablets
    2. IoT network: smart home devices
    3. Guest network: visitors

  Why: IoT devices are often less secure. Separating them
  prevents a compromised smart bulb from accessing your
  computer. Many modern routers support this easily.

2.4 GHz vs 5 GHz:
  Most smart devices use 2.4 GHz (longer range, slower speed)
  Phones/computers prefer 5 GHz (shorter range, faster)
  Ensure your router has both bands
```

## Privacy Considerations
```
SMART HOME PRIVACY GUIDE:

WHAT'S LISTENING/WATCHING:
  Voice assistants: Microphone always listening for wake word
    - Recordings may be stored in cloud and reviewed by humans
    - Opt out of voice recording storage (check settings)
    - Physical mute button available on all smart speakers

  Cameras: Video stored in cloud (most services)
    - Consider local storage options (Wyze with SD card, HomeKit Secure Video)
    - Be transparent with household members and guests
    - Avoid cameras in bedrooms and private spaces
    - Indicator lights should always be on when camera is active

DATA COLLECTED:
  - Usage patterns (when you're home, sleep schedule, habits)
  - Voice recordings (can be deleted, opt-out of human review)
  - Location data (geofencing)
  - Energy usage patterns
  - Video footage

PRIVACY-FOCUSED CHOICES:
  Best privacy: Apple HomeKit (local processing, encrypted, minimal data sharing)
  Good privacy: Any Matter/Thread device with local control
  Privacy trade-off: Amazon and Google (more data collected, but opt-out options exist)
  Local-only options: Home Assistant (advanced, fully local, open source)

PRIVACY CHECKLIST:
  [ ] Review privacy settings in each app
  [ ] Disable voice recording storage or set auto-delete
  [ ] Use strong, unique passwords for each account
  [ ] Enable two-factor authentication
  [ ] Review who has access to your smart home accounts
  [ ] Keep firmware updated on all devices
  [ ] Inform household members and guests about devices
  [ ] Place cameras only in appropriate locations
  [ ] Consider a VPN for your home network
  [ ] Regularly review connected devices and remove unused ones
```

## Budget Smart Home Plans
```
BUDGET TIERS:

STARTER ($50-150):
  - 2 smart plugs ($15): lamps, coffee maker
  - 1 smart speaker ($25-50): voice control hub
  - 2 smart bulbs ($15-20): bedroom, living room
  Total: ~$55-85
  Impact: Voice-controlled lights, scheduled appliances

BASIC ($150-300):
  Everything above, plus:
  - Smart thermostat ($60-250): energy savings
  - 2 more smart bulbs or a light strip ($20-40)
  - Water leak sensor ($10-15)
  Total: ~$245-390
  Impact: Energy savings, basic automation, safety

INTERMEDIATE ($300-700):
  Everything above, plus:
  - Video doorbell ($60-130)
  - Smart lock ($150-250)
  - 2-3 additional smart lights/switches ($30-75)
  - Motion sensor ($15-25)
  Total: ~$555-1,070
  Impact: Security, keyless entry, comprehensive lighting

COMPREHENSIVE ($700-2000):
  Everything above, plus:
  - 2-3 security cameras ($60-150 each)
  - Multi-room audio (2-3 additional speakers, $60-200 each)
  - Smart blinds or shades ($50-200 each)
  - Additional sensors (door, motion, temperature)
  - Robot vacuum ($200-500)
  Total: ~$1,130-3,200
  Impact: Full home automation, security, entertainment
```

## Troubleshooting
```
COMMON SMART HOME ISSUES:
DEVICE OFFLINE:
  1. Check WiFi -- is your internet working?
  2. Check if device has power (smart bulb switch turned off?)
  3. Restart the device (unplug 10 sec, replug)
  4. Restart your router
  5. Check for firmware updates
  6. Re-add device to app if nothing else works
VOICE COMMANDS NOT WORKING:
  1. Rephrase -- try simpler command
  2. Check device name (rename to simple, unique names)
  3. Ensure device is in correct room group
  4. Check that skill/integration is still linked
  5. Restart smart speaker
AUTOMATION NOT TRIGGERING:
  1. Verify trigger conditions are correct
  2. Check if device is online and responsive
  3. Check for time zone settings
  4. Verify conditions (e.g., "only at night" -- is it night?)
  5. Check for app updates
  6. Rebuild the automation from scratch
SLOW RESPONSE:
  1. Check WiFi signal at device location
  2. Too many devices on network -- consider mesh system
  3. Use local control where possible (Thread, Matter)
  4. Check for interference (microwaves, baby monitors on 2.4 GHz)
  5. Restart router
DEVICE WON'T CONNECT DURING SETUP:
  1. Ensure phone is on 2.4 GHz WiFi (most common issue)
  2. Move closer to router during setup
  3. Disable VPN on phone during setup
  4. Check that Bluetooth is enabled (some devices use it for setup)
  5. Factory reset device and try again
  6. Check app for known issues or required updates
```

## Output Format

When providing smart home advice:
```
SMART HOME PLAN

Ecosystem: [recommended ecosystem and why]
Current Setup: [what they have]
Goals: [what they want to achieve]
Budget: $[range]

RECOMMENDED DEVICES:
  Priority 1: [device] - $[cost] - [why first]
  Priority 2: [device] - $[cost] - [why second]
  Priority 3: [device] - $[cost] - [why third]

SETUP ORDER:
  1. [First device to set up and how]
  2. [Second device]
  3. [Automations to create]

AUTOMATIONS TO SET UP:
  [List of recommended automations with triggers and actions]

NETWORK CONSIDERATIONS:
  [Any WiFi improvements needed]

PRIVACY SETTINGS:
  [Key settings to configure]

TOTAL ESTIMATED COST: $[amount]
ESTIMATED MONTHLY SAVINGS (energy): $[amount]
```

## Example

**Input:** "Help me get started with smart home guide"

**Output:** A structured smart home guide plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
