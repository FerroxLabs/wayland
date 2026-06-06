---
name: smart-home-setup
description: |
  Plans a smart home system covering device compatibility frameworks, hub versus hub-free architectures, network requirements, and privacy considerations. Produces a phased implementation plan with device categories, protocol selection, and network preparation steps.
  Use when the user asks about setting up smart home devices, choosing a smart home platform, connecting devices together, home automation planning, or smart home privacy and security.
  Do NOT use for specific device configuration or troubleshooting, home network infrastructure design (routers, switches, cabling), or commercial building automation systems.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-maintenance planning automation"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Smart Home Setup

## When to Use

**Use this skill when:**
- A user wants to start building a smart home from scratch and needs a platform, protocol, and phasing strategy -- not just a device list
- A user has a mix of existing smart devices and wants to unify them under one platform or expand their setup coherently
- A user is comparing smart home platforms or ecosystems and needs a structured decision framework (hub-based vs. voice-centric vs. open-source local)
- A user asks whether specific device types will work together -- compatibility questions rooted in protocol and platform architecture
- A user wants to automate routines (lighting schedules, thermostat geofencing, door-triggered scenes, motion-activated sequences) and needs to understand what automation engines can do this
- A user has privacy or data sovereignty concerns about smart home devices and wants to understand the trade-offs before committing
- A user wants to prioritize smart home investments within a budget and needs a phased rollout plan
- A user is moving into a new home and wants to plan infrastructure for smart home readiness before walls are finished or painted

**Do NOT use when:**
- A user needs step-by-step configuration of a specific device model (Wi-Fi credentials, app pairing flow, firmware update) -- this is device-specific troubleshooting, not architecture planning
- A user needs to design or upgrade physical network infrastructure -- router selection, access point placement calculations, Ethernet cabling runs, or switch port planning (use a home networking skill)
- A user is asking about commercial or industrial building automation (HVAC control systems, BACnet, Modbus, KNX bus wiring) -- these are entirely different standards and engineering domains
- A user wants detailed comparisons of professional home security monitoring services (contract terms, central station response times, false alarm policies)
- A user needs to assess whether a specific electrical modification requires a licensed electrician -- use a DIY-vs-hire assessment skill instead
- A user wants to evaluate solar, battery backup, or whole-home energy management systems -- these overlap with smart home but require separate electrical engineering scope

---

## Process

### Step 1: Diagnose the User's Starting Point and Constraints

Before recommending anything, gather the parameters that drive every subsequent decision. Missing even one of these frequently causes incompatible device purchases.

- **Current devices:** Ask what smart devices are already in the home and what platform or app manages them. A home already invested in one ecosystem changes recommendations entirely -- switching costs are real.
- **Home ownership and type:** Renter vs. owner determines whether hardwired devices (smart switches, hardwired cameras, deadbolt-replacing locks) are possible. Apartment renters face a fundamentally different device menu than homeowners.
- **Electrical vintage:** Homes built before approximately 1985 frequently lack neutral wires at switch boxes. This eliminates most standard smart dimmer and switch options. Ask directly if the user knows their home's age.
- **Primary goals, ranked:** Convenience, energy savings, security/monitoring, accessibility, or privacy. The ranked order changes phase sequencing -- a user who ranks energy savings first should get a smart thermostat in Phase 1, not Phase 2.
- **Technical comfort level:** There are three meaningful tiers: (1) plug-and-play only -- no hubs, no YAML, no router login; (2) app-comfortable -- willing to create automations in a graphical interface, set up a hub; (3) technically advanced -- willing to run local software, write automation scripts, manage a home server.
- **Budget and timeline:** Distinguish between "starting budget" (Phase 1 only) and "total intended budget." A $300 start with $1,500 total changes the hub recommendation vs. a $300 total ceiling.
- **Home size:** Square footage and floor count directly affect hub placement, mesh network needs, and Zigbee/Z-Wave relay device planning. Under 1,500 sqft is straightforward. Over 3,000 sqft requires explicit signal coverage planning.
- **Internet reliability:** Frequent outages shift recommendations strongly toward local-processing platforms. Cloud-only devices become liabilities in areas with unstable ISP service.

---

### Step 2: Explain the Protocol Landscape with Decision Clarity

Users frequently buy incompatible devices because they do not understand that "smart" devices speak different radio languages. This step prevents regret-purchases.

**The six protocols that matter in residential smart home:**

| Protocol | Radio Frequency | Typical Indoor Range | Self-Powered Devices? | Mesh Network | Hub Required | Primary Strength |
|---|---|---|---|---|---|---|
| Wi-Fi (2.4 GHz) | 2.4 GHz | 100-150 ft | No -- line powered only | No | No (uses router) | High bandwidth -- cameras, displays, video doorbells |
| Zigbee | 2.4 GHz | 30-60 ft per hop | Yes -- batteries viable | Yes -- each mains device repeats | Yes | Low power sensors, bulbs, buttons; large mesh ecosystems |
| Z-Wave | 908.42 MHz (US) | 30-100 ft per hop | Yes -- batteries viable | Yes | Yes | Interference-resistant; hard cap of 232 devices per network; locks, sensors |
| Thread | 2.4 GHz | 30-60 ft per hop | Yes -- batteries viable | Yes -- IPv6 mesh | Border router needed | Modern IP-based sensor mesh; foundation of Matter on Thread |
| Bluetooth Low Energy (BLE) | 2.4 GHz | 30-50 ft | Yes -- batteries viable | Limited (Bluetooth mesh exists but uncommon in consumer devices) | Phone or hub | Short-range controls, presence detection, device config |
| Matter (over Wi-Fi or Thread) | Varies by transport | Varies | Varies by transport | Depends on transport | No -- interoperability layer, not a radio | Cross-platform compatibility standard |

**Critical protocol decision rules:**
- Z-Wave operates at 908.42 MHz in North America, completely avoiding the congested 2.4 GHz band that Wi-Fi, Zigbee, Thread, and Bluetooth all share. In apartment buildings or dense neighborhoods with heavy 2.4 GHz congestion, Z-Wave sensors and locks are more reliable.
- A Zigbee mesh requires at least 3 mains-powered devices (not battery devices) to be robust. Battery-only Zigbee devices do NOT repeat signals. If a user buys only battery sensors, there is no mesh -- each device communicates directly to the hub.
- Thread requires a Thread Border Router, which is built into some smart speakers and hubs. A device supporting Thread but without a border router on the network cannot connect.
- Matter is an application-layer standard, not a physical radio. A Matter device still uses Wi-Fi or Thread to transmit. Matter certification means any certified app or controller can operate it -- it does not eliminate protocol considerations.
- Wi-Fi devices each maintain a persistent TCP connection to either a cloud server or local hub. At 30+ Wi-Fi smart devices, a consumer router's connection table can become saturated, causing instability. This threshold is why separating IoT devices matters at scale.

---

### Step 3: Select the Platform Architecture

The platform is the decision with the longest lock-in consequence. Help the user understand the real trade-offs before committing.

**Architecture Type 1 -- Voice-Centric (No Dedicated Hub)**
- Lowest setup friction. Devices connect to Wi-Fi directly and are managed through a single vendor's app and voice assistant.
- Automation capability is moderate -- if/then rules, time-based schedules, basic presence detection. Cannot do multi-condition logic like "if door opens AND time is between sunset and 10 PM AND motion sensor is inactive, then trigger alarm sequence."
- Cloud dependency is high. If the vendor's servers go down or the company discontinues the product, automations stop working. This is not hypothetical -- multiple major smart home cloud services have been discontinued with little warning.
- Best for: users with low technical comfort, renters, or anyone wanting to start and learn before committing deeper.

**Architecture Type 2 -- Dedicated Hub (Local Processing)**
- A dedicated hub runs locally. Automations execute in milliseconds even without internet because logic runs on the hub, not in the cloud.
- Hub supports multiple protocols simultaneously -- typically Zigbee, Z-Wave, and Wi-Fi. This is the only single-controller approach that spans all three major low-power protocols.
- Automation power is substantially higher -- multi-condition rules, time windows, delay sequences, state machines, and integration with external data sources (weather APIs for irrigation, calendar data for presence).
- Setup requires more learning. Hub configuration involves creating devices, rooms, automation rules, and understanding the hub's logic engine.
- Best for: users comfortable with technology who want long-term reliability and deep automation.

**Architecture Type 3 -- Open-Source Local Platform**
- Runs on local hardware (a dedicated low-power computer or network-attached storage device). The software is community-maintained and free.
- Maximum device compatibility -- integrations with thousands of device types, cloud services, and local protocols.
- Maximum automation power -- full scripting capability, custom dashboards, integration with external APIs, complex state machines.
- Requires willingness to maintain software -- updates, occasional breaking changes, troubleshooting. Not suitable for users who want a finished product.
- Privacy maximum -- nothing leaves the local network unless the user deliberately adds a cloud integration.
- Best for: technically advanced users, privacy-focused users, or users who want a long-term platform with no commercial lock-in.

**Architecture Type 4 -- Hybrid (Recommended for Most Users)**
- Combine a dedicated hub for local device management and automation logic with a voice assistant for daily interaction and quick commands.
- The voice assistant sends commands to the hub, not directly to devices. The hub executes locally.
- Add Matter devices going forward to maintain cross-platform flexibility.
- This approach retains local reliability while providing the convenient voice interface most users expect.

**Protocol-to-Platform alignment:**
| Platform Type | Zigbee Support | Z-Wave Support | Thread/Matter | Best Protocol Focus |
|---|---|---|---|---|
| Voice-centric only | Sometimes (via add-on) | Rarely | Yes (newer models) | Wi-Fi + Matter |
| Dedicated hub | Yes (native) | Yes (native or add-on) | Growing | Zigbee + Z-Wave + Matter |
| Open-source local | Yes (via USB radio) | Yes (via USB radio) | Yes (via border router) | All protocols |

---

### Step 4: Plan Device Categories by Priority and Impact

Sequence device categories by the ratio of impact to complexity, not by what is most impressive. Phase 1 must always create visible, immediate value to build confidence and ensure the platform choice is validated before significant money is spent.

**Phase 1 -- Quick Wins (Day 1, under $200 typically)**

| Device Category | What It Actually Does | Key Feature to Require | Typical Cost Range |
|---|---|---|---|
| Smart plugs | Switch any corded lamp, fan, or small appliance on/off by schedule, voice, or remote | Energy monitoring (measures wattage of the connected device -- worth paying extra for) | $12-$30 each |
| Smart bulbs | Replace any bulb with one that dims, changes color temperature (warm to cool white), and responds to schedules | Color temperature range: look for 2700K (warm white) to 6500K (daylight); this range covers all lighting moods | $10-$35 each |
| Voice assistant speaker | Central voice interface for the whole system | Far-field microphone pickup distance; local voice processing option if privacy matters | $30-$110 |

Phase 1 validation checklist before moving to Phase 2:
- All Phase 1 devices connect reliably without frequent dropouts
- At least one automation is working (e.g., sunset schedule for lamps)
- User is comfortable with the app and voice commands
- Network performance has not degraded (check that other household devices still stream video without buffering)

**Phase 2 -- Core Automation (Week 1-2, $130-$300)**

| Device Category | Impact Specifics | Installation Notes | Typical Cost Range |
|---|---|---|---|
| Smart thermostat | Documented average energy savings of 8-15% annually on HVAC costs through scheduling and geofencing. Needs C-wire (common wire) for most models -- verify before purchasing. | Requires HVAC compatibility check -- multi-stage systems, heat pumps, and steam boilers may require specific models. | $100-$250 |
| Motion sensors | Trigger lights, sound automations, and security notifications. Passive infrared (PIR) sensors are standard; look for adjustable sensitivity and a configurable timeout (how long after last motion detection before returning to "clear" state). | Battery-powered, no wiring needed. Placement: 6-7 ft height, corner position for maximum coverage angle. | $15-$40 |
| Door and window sensors | Binary open/closed state. Use cases: HVAC automation (turn off when window opens), security awareness, automation triggers, pet door monitoring. | Adhesive or screw mount. Verify gap distance spec -- most require less than 0.5 in gap between magnet and sensor body. | $12-$30 each |

**Phase 3 -- Security and Access (Week 2-4, $200-$800 depending on scope)**

| Device Category | What to Evaluate | Installation Complexity | Typical Cost Range |
|---|---|---|---|
| Smart lock | Evaluate auto-lock timer, guest code management (create/expire codes without being home), activity log, and whether it integrates with the home's automation platform. Most retrofit over existing deadbolt hardware without changing the door face. | Moderate -- deadbolt replacement; no electrical wiring but needs Bluetooth or Z-Wave/Zigbee pairing. | $150-$350 |
| Video doorbell | Key specs: resolution (1080p minimum), field of view (160° or wider is better for covering porch approaches), night vision method (infrared vs. color night vision), local storage option. Wired models (replacing existing doorbell wiring) are more reliable than battery models for high-traffic doors. | Wired: low voltage (16-24V AC from existing doorbell transformer). Battery: adhesive or screw mount. | $100-$280 |
| Indoor/outdoor cameras | Distinguish between indoor (stationary, lower weather protection) and outdoor (IP65 or IP66 rated minimum). Pan/tilt indoor cameras offer wider coverage per device. Local storage via SD card or NVR eliminates ongoing cloud subscription costs. | Outdoor: requires weatherproof mounting location and power source (wired or solar-assisted battery). | $50-$200 each |
| Smart garage door controller | Adds open/close command, status monitoring, and auto-close automation to an existing garage door opener. Most use a tilt sensor on the door plus a button relay connected to the opener's wall button terminals. | Low -- no new wiring; clips to existing opener. Verify compatibility with opener model before purchasing. | $25-$80 |

**Phase 4 -- Advanced Automation (Month 2+, highly variable cost)**

| Device Category | Impact Specifics | Complexity Notes | Typical Cost Range |
|---|---|---|---|
| Motorized blinds/shades | Automate to track sun position (close south-facing windows during peak afternoon heat), schedule for privacy, or integrate with lighting scenes. | Battery-powered retrofit motors exist for existing blinds. Hardwired motors require electrician for dedicated circuits per motor bank. | $100-$500 per window |
| Leak/flood sensors | Early detection prevents catastrophic water damage. Priority placement: under kitchen sink, under all bathroom vanities, near water heater, near washing machine, in basement (especially near sump pump). | Battery-powered, no wiring. Most have very loud local alarm plus app notification. | $15-$40 each |
| Smart smoke and CO detectors | Interconnected alarms (when one sounds, all sound) and phone notification when away. Key requirement: verify they are UL217 and UL2034 listed for smoke and CO respectively. Replace all detectors in the home simultaneously for interconnect compatibility. | Replaces existing battery or hardwired detectors. Hardwired models have battery backup and connect to existing wiring. | $80-$150 each |
| Smart irrigation controller | Zone-by-zone scheduling with weather intelligence (skips watering if rain is forecast or recent ET data suggests soil moisture is sufficient). Retrofit replaces existing timer panel. | Moderate -- needs zone wire count to match controller channel count. Most controllers handle 8-16 zones. | $80-$250 |
| Whole-home energy monitor | Clamp-on sensors attach to main electrical panel conductors and measure whole-home and per-circuit energy consumption in real time. | Requires panel access -- hire an electrician if not comfortable with panel work. | $300-$500 |

---

### Step 5: Address Network Requirements with Specific Thresholds

Network preparation is the most commonly skipped step and the most common cause of smart home unreliability. Give the user concrete thresholds, not vague guidance.

**Device count and network capacity:**
- 1-15 Wi-Fi smart devices: most dual-band consumer routers handle this without issue, provided the router was manufactured after 2018.
- 15-40 Wi-Fi smart devices: a mesh Wi-Fi system with 2-3 nodes is strongly recommended. The goal is not speed -- it is reliable association and a larger connection table.
- 40+ Wi-Fi smart devices: a dedicated IoT VLAN or isolated Wi-Fi network (separate SSID broadcasting only 2.4 GHz) is recommended. Many consumer routers support this via the guest network feature.

**The 2.4 GHz vs. 5 GHz critical detail:** The vast majority of smart home Wi-Fi devices support only 2.4 GHz. A router that automatically combines 2.4 GHz and 5 GHz into a single "smart connect" SSID can cause setup failures because the phone pairs to 5 GHz while the device needs 2.4 GHz. During smart device setup, temporarily disable the 5 GHz band or use a dedicated 2.4 GHz SSID for IoT devices.

**IoT network isolation rationale:** Isolating smart devices on a separate network segment does two things simultaneously: (1) a compromised IoT device cannot reach computers, phones, or NAS devices on the main network, and (2) IoT device broadcast traffic does not compete with high-priority traffic like video calls and game streaming.

**Upload bandwidth for cameras:** Each camera uploading to cloud storage consumes approximately 1-4 Mbps of upload bandwidth continuously during recording. A home with 4 outdoor cameras could consume 16 Mbps of upload continuously. Check the ISP plan's upload limit before adding cameras -- residential plans often have asymmetric upload speeds of 10-20 Mbps on cable or DSL connections.

**Zigbee mesh planning specifics:**
- Hub placement should be within 30 ft of at least 3-4 mains-powered Zigbee devices (bulbs, plugs, switches).
- Battery-powered devices (sensors, buttons, locks) do not repeat -- they are leaves on the mesh tree, not branches.
- Each Zigbee mesh hop degrades signal reliability by approximately 10-15%. Keep sensor-to-hub path length to 3 hops or fewer.
- Zigbee at 2.4 GHz can experience interference from Wi-Fi. Zigbee channels 15, 20, 25, and 26 avoid overlap with the most common Wi-Fi channels (1, 6, 11). Configure the Zigbee hub to use channel 25 or 26 as a default starting point.

**Z-Wave mesh planning specifics:**
- Z-Wave's 908.42 MHz frequency does not share spectrum with Wi-Fi, making it inherently more interference-resistant.
- Z-Wave has a hard maximum of 232 devices per controller network -- a ceiling almost no home approaches, but worth knowing.
- Z-Wave mesh hops have a maximum of 4 hops from device to controller. For large homes, plan the distribution of mains-powered Z-Wave devices (plugs, switches) to ensure no device is more than 4 hops away.

---

### Step 6: Address Privacy and Security with Concrete Actions

Do not treat this as a checkbox -- smart home devices introduce meaningful and specific privacy risks that the user deserves to understand before purchase. Frame the trade-offs honestly.

**Data collection categories and their specific risks:**

| Data Type | Which Devices Collect It | Risk If Exposed | Mitigation |
|---|---|---|---|
| Voice audio | Voice assistant speakers | Continuous recording clips uploaded to cloud; reviewed by vendor employees in some documented cases | Enable mute switch when not needed; select a device with local voice processing (the phrase "works locally" in specs); regularly delete voice history via the vendor app |
| Video footage | Indoor cameras, doorbells | Raw video streams or clips stored on vendor servers; potential subpoena access by law enforcement | Use local storage (SD card or NVR); set privacy zones to exclude neighbor property and public spaces; understand that wired local NVR keeps footage entirely off-cloud |
| Location data | Any device using geofencing | Precise home arrival/departure times create a behavioral profile | Geofencing requires an explicit decision -- the convenience of auto-unlocking or temperature changes trades against continuous location tracking |
| Device usage patterns | Smart plugs with energy monitoring, locks | When you wake up, sleep, leave, and return; appliance use patterns | Prefer devices that process usage data locally; some hubs aggregate this data locally without ever sending it to the vendor |
| Network traffic metadata | All Wi-Fi devices | Even encrypted traffic reveals connection timing and frequency | IoT network isolation limits damage from a compromised device; consider a local hub that eliminates device-to-cloud connections entirely |

**Minimum security actions -- non-negotiable:**
1. Change default credentials on every device and every hub during initial setup. Default passwords are publicly documented and actively exploited.
2. Enable two-factor authentication on every smart home account (platform app, camera account, hub web interface).
3. Keep firmware updated on all devices. Smart home devices have had documented vulnerabilities exploited through outdated firmware, including camera feeds accessed by third parties.
4. Audit third-party integrations quarterly. Revoke access for any service no longer actively used.
5. Never expose a hub's local web interface directly to the internet via port forwarding. Use a VPN or the hub vendor's secure remote access feature instead.

---

### Step 7: Produce the Implementation Plan

Assemble all information gathered in Steps 1-6 into the structured output format below. Every field must contain specific, user-appropriate content -- not generic placeholders.

When writing the automation ideas section, think in terms of trigger-condition-action logic, not just "if X then Y." The most useful automations are those with time or state conditions that prevent unwanted triggering (e.g., the motion light automation should include a "only during nighttime hours" condition, or it will turn lights on unnecessarily during the day).

---

## Output Format

```
## Smart Home Plan: [Home Type] -- [Primary Goal Focus]

### Situation Summary
| Parameter          | Value                        |
|--------------------|------------------------------|
| Home type          | [owned/rented; house/apartment/condo] |
| Size               | [sqft or bedroom count]      |
| Existing devices   | [list or "none"]             |
| Technical comfort  | [plug-and-play / app-level / advanced] |
| Primary goals      | [ranked: e.g., energy savings > convenience > security] |
| Budget             | [Phase 1 budget / total intended] |
| Electrical notes   | [neutral wire status if relevant; home age] |

### Platform Selection
| Decision              | Recommendation               | Rationale                                           |
|-----------------------|------------------------------|-----------------------------------------------------|
| Architecture type     | [voice-centric / hub-based / open-source / hybrid] | [specific reason based on goals and comfort level] |
| Primary protocol      | [Wi-Fi / Zigbee / Z-Wave / Thread / mixed]         | [why this protocol fits this home and use case]    |
| Hub recommendation    | [none / dedicated hub type]  | [why or why not based on device count and goals]   |
| Voice assistant       | [choice or "not required"]   | [rationale for inclusion or exclusion]             |
| Matter strategy       | [prefer Matter devices / add later / not relevant] | [how this affects buying decisions]               |

### Phase Implementation Plan
| Phase | Name               | Device Categories                     | Installation Type | Estimated Cost | Timeline     |
|-------|--------------------|---------------------------------------|-------------------|----------------|--------------|
| 1     | Quick Wins         | [specific device categories]          | Plug-in/wireless  | $[range]       | Day 1        |
| 2     | Core Automation    | [specific device categories]          | [mix]             | $[range]       | Weeks 1-2    |
| 3     | Security & Access  | [specific device categories]          | [mix]             | $[range]       | Weeks 2-4    |
| 4     | Advanced (optional)| [specific device categories]          | [mix]             | $[range]       | Month 2+     |
| **Total** |               |                                       |                   | **$[total range]** |          |

### Device Feature Requirements
For each Phase 1 and Phase 2 device category, list the specific features to look for:

**[Device Category 1]**
- Required: [specific feature with minimum spec]
- Required: [specific feature]
- Recommended: [nice-to-have feature]
- Avoid: [a common feature that causes problems in this use case]

**[Device Category 2]**
- Required: [specific feature with minimum spec]
- [continue for each major device category]

### Network Preparation Checklist
- [ ] Verify router handles [N] Wi-Fi devices -- [specific action if upgrade is needed]
- [ ] Create dedicated 2.4 GHz-only SSID for IoT devices named [suggested name]
- [ ] Confirm 2.4 GHz and 5 GHz are NOT band-combined during device pairing
- [ ] [Zigbee-specific: configure Zigbee channel to 25 or 26 to avoid Wi-Fi overlap -- if applicable]
- [ ] [Camera-specific: verify upload bandwidth is at least [N] Mbps for [N] cameras -- if applicable]
- [ ] [Mesh Wi-Fi recommendation if home is over 2,000 sqft or device count exceeds 20]
- [ ] Place hub in central location with line-of-sight to majority of devices

### Privacy and Security Checklist
- [ ] Change default credentials on every device immediately upon setup -- before connecting to other services
- [ ] Enable two-factor authentication on: [list specific accounts relevant to this plan]
- [ ] [Voice assistant specific: configure voice history settings -- delete or disable retention]
- [ ] [Camera specific: configure local storage and disable cloud upload -- or acknowledge cloud recording trade-off]
- [ ] Set up IoT network isolation -- separate SSID prevents compromised devices from reaching computers
- [ ] Schedule quarterly firmware update check for all devices
- [ ] Review and revoke third-party app integrations that are no longer active

### Automation Blueprint
| Automation Name        | Trigger                  | Condition                              | Action                            | Benefit                        |
|------------------------|--------------------------|----------------------------------------|-----------------------------------|--------------------------------|
| [Automation 1 name]    | [specific trigger event] | [time window or state condition]       | [specific device action]          | [measurable or practical benefit] |
| [Automation 2 name]    | [specific trigger event] | [time window or state condition]       | [specific device action]          | [measurable or practical benefit] |
| [Automation 3 name]    | [specific trigger event] | [time window or state condition]       | [specific device action]          | [measurable or practical benefit] |
| [Automation 4 name]    | [specific trigger event] | [time window or state condition]       | [specific device action]          | [measurable or practical benefit] |
| [Automation 5 name]    | [specific trigger event] | [time window or state condition]       | [specific device action]          | [measurable or practical benefit] |

### Expansion Path
[1-2 paragraphs describing how this plan grows. What Phase 4 devices make sense for this specific user. Whether a hub upgrade makes sense later. What Matter devices to prioritize when replacing devices that fail naturally.]

### Immediate Next Steps
- [ ] [Most important first action -- typically a platform/ecosystem decision or first purchase]
- [ ] [Second action -- typically verifying a constraint, such as neutral wire or C-wire]
- [ ] [Third action -- typically setting up network preparation before devices arrive]
- [ ] [Fourth action -- typically first device category installation with validation test]
- [ ] [Fifth action -- schedule Phase 2 based on Phase 1 stability]
```

---

## Rules

1. **Never name or recommend specific product brands or models** -- describe device categories and the precise feature specifications to look for. The smart home product market changes faster than advice can keep pace with; feature-based guidance stays relevant.

2. **Always confirm neutral wire status before recommending smart light switches** -- ask the user whether their home was built before approximately 1985 or whether they know if a white wire is present in their switch boxes. Recommending a standard smart dimmer to a user without a neutral wire causes a return trip to the hardware store and damages trust. No-neutral smart switches exist but are a narrower product category that must be explicitly specified.

3. **Always confirm C-wire availability before recommending a smart thermostat** -- most smart thermostats require a C-wire (common wire, typically blue in 5-wire HVAC configurations) for consistent power. Users with older 2-wire heating-only systems or heat pumps need models with adapter wire kits or specific compatibility. Ask the user to photograph their existing thermostat wiring or count the wires before committing to a model.

4. **Always include privacy and security guidance** -- never let a user proceed to purchase without explicitly understanding the data collection trade-offs. Cloud-dependent devices collect behavioral data; voice assistants record audio; cameras store video. These are documented facts, not theoretical concerns. The user should make a conscious, informed choice.

5. **Always recommend beginning with Phase 1 before committing to Phase 3 or 4** -- regardless of budget, a user who jumps directly to locks, cameras, and motorized blinds without first validating their platform choice and network stability is taking on compounding risk. Phase 1 validates the entire foundation.

6. **Matter compatibility is a forward-looking criterion, not a hard requirement** -- when a user is choosing between two otherwise equivalent devices, prefer the Matter-certified option for future-proofing. But do not reject non-Matter devices that are well-supported in the user's chosen platform. Matter adoption is still rolling out as of this writing, and the best device in a category may not yet be Matter-certified.

7. **For rental properties, exclude all devices requiring permanent modification** -- smart switches (unless the original switch is reinstalled at move-out), hardwired cameras (drilling exterior holes), doorbell replacement on a wired intercom system, and deadbolt-replacing smart locks without landlord written approval. The cost of violating a lease or losing a security deposit always exceeds the convenience of a smart lock.

8. **Cloud dependency is a product reliability risk, not just a privacy issue** -- smart home cloud services have been discontinued with 30-90 days' notice multiple times. For any device handling a critical function (primary door lock, smoke detector, heating control), require either a local processing fallback or ensure the platform has a strong track record of longevity. Mention this risk without alarming the user unnecessarily -- frame it as "here is why local processing matters for these specific functions."

9. **Do not recommend a hub until the user has validated their Phase 1 investment** -- recommending a hub before a user has any experience with smart home devices adds $100-$200 of hardware and a significant learning curve to an already unfamiliar process. The exception: if the user explicitly states they are comfortable with technology, have done research, and are committed to a multi-protocol setup from day one.

10. **Automation blueprints must include conditions, not just triggers** -- an automation that triggers on "motion detected" without a time or state condition will fire in unintended circumstances (motion during daylight turning on lights already at full brightness; motion outside a window triggering interior lights). Every automation recommendation must specify the condition layer that prevents false triggers.

11. **When the user has an existing smart home investment in one ecosystem, quantify the migration cost honestly** -- switching from one platform to another may require replacing devices that are not compatible with the new platform. Z-Wave and Zigbee devices move with the user if they change hubs. Wi-Fi devices using proprietary protocols are often stranded when the platform changes. Acknowledge this before recommending a platform shift.

12. **Always acknowledge that camera upload bandwidth is the limiting factor for camera-heavy setups** -- a user on a 10 Mbps upload cable plan cannot run 4 cameras uploading to cloud storage continuously. Calculate the bandwidth requirement (cameras × average bitrate in Mbps) and compare it to the user's available upload before recommending cloud recording.

---

## Edge Cases

### Rental Apartment -- No Permanent Modifications

The entire device menu shifts. Restrict recommendations to:
- Smart bulbs (plug-in lamp adapters where the fixture is hardwired -- these exist and allow a plug-in smart plug to control the fixture via a simple plug adapter; otherwise use bulb dimmers)
- Smart plugs for all corded appliances and lamps
- Battery-powered sensors (adhesive mount, no screws) for doors, windows, and motion
- Smart speakers placed on furniture
- Battery-operated smart locks that replace only the interior thumb-turn and keypad, not the full deadbolt cylinder -- these exist but are less common; verify that the existing lock cylinder is compatible
- For doorbell: battery-powered video doorbell with adhesive or removable mount; some lease agreements prohibit any doorbell modification at all -- confirm first

Flag that adhesive-mount devices must be applied to clean, primed surfaces; textured walls, freshly painted walls (less than 30 days), and wallpapered surfaces have poor adhesion and will fail. The user should test adhesive strength in a low-stakes location first.

### Older Home Without Neutral Wire at Switch Boxes

This is one of the most common smart home project failures. The user purchases smart switches, opens the junction box, and finds only two wires: a line (hot) and a load. No neutral.

Provide these specific options in order of effort:
1. **No-neutral compatible smart switches** -- a narrower product category but available for both single-pole and 3-way configurations. These draw a small trickle current through the bulb circuit to power themselves, which can cause incompatible LED bulbs to flicker. The user must verify bulb compatibility with the specific switch model.
2. **Smart bulbs instead of smart switches** -- preserves the existing switch wiring, controls the bulb directly via Zigbee, Z-Wave, or Wi-Fi. The downside: if someone uses the physical switch to cut power to the bulb, the bulb loses its smart functionality until power is restored. This is the "smart bulb problem" -- mitigate with a switch guard or a battery-powered smart switch overlay that mounts over the existing toggle without using the wiring at all.
3. **Run a neutral wire** -- an electrician can run a neutral from the nearest junction box where neutral is available. Cost varies by home layout but typically runs $100-$300 per switch location. Justified for high-traffic switches (kitchen, living room). Unreasonable for a 20-switch whole-home retrofit.
4. **Wireless switch overlay** -- a battery-powered wireless decora switch mounts over the existing switch (using the existing switch to maintain constant power) and communicates to the hub via Zigbee or Z-Wave. The hub then controls the smart bulb or a connected smart plug. This preserves the wall switch experience without wiring changes.

### Privacy-First User -- Minimal Cloud Exposure

Recommend an open-source local platform running on dedicated local hardware as the primary architecture. This shifts every device recommendation:
- Wi-Fi devices that connect only to the local hub and never ping the vendor's cloud -- many Wi-Fi devices support a local API mode; research whether the device has a local control API before purchasing
- Zigbee and Z-Wave sensors are inherently better for privacy -- they communicate to the hub via radio, not over the internet; the hub processes the data locally
- Avoid voice assistants entirely, or use a locally-processed voice assistant (open-source options exist for technically advanced users) that keeps all voice processing on-premises
- Cameras: use local NVR storage with no cloud account; IP cameras supporting the ONVIF standard can be integrated directly into the local platform without a vendor account
- The trade-off to communicate honestly: local-only setups require more setup time, occasional maintenance, and provide no automatic backup of configuration. The user owns the data but also owns the operational responsibility.

### Large Home Over 3,000 Square Feet

Signal coverage planning is a first-class concern, not an afterthought.

- Mesh Wi-Fi system: plan for one node per floor or one node per approximately 1,500 sqft. Place mesh satellite nodes where device density is highest, not just where aesthetically convenient. A mesh node in a closet with its own dense network of IoT devices is preferable to one in the open living room.
- Zigbee mesh: the hub must not be at the edge of the home. Place it centrally. Add mains-powered Zigbee devices (smart plugs or switches) in each wing or floor to ensure relay coverage. Test signal with the hub's diagnostic view after placing the first 10 devices -- most hubs show signal strength and path for each device.
- Z-Wave in large homes: the 100 ft range per hop is more generous than Zigbee's 60 ft, but large homes with thick masonry walls (CMU block, brick, stone) can reduce effective Z-Wave range to 50-60 ft per hop.
- Recommend a site survey before placing any hub: walk the home with a Wi-Fi analyzer app running to map signal strength from the current router position. Weak spots predict where smart devices will struggle regardless of protocol.
- Two-hub setups: some platforms support multiple hubs that share the same device namespace. For a home over 5,000 sqft, a paired hub in each half of the home may outperform a single central hub with marginal signal reach.

### Accessibility-Focused User

Smart home technology provides substantial real-world benefit for users with mobility limitations, visual impairment, or hearing impairment. Shift the entire phase prioritization accordingly:

- **Phase 1 for accessibility:** Voice control setup first (eliminates need to reach any switch, thermostat, or lock), smart plugs on every lamp the user currently needs to reach, and smart locks (keyless entry eliminates key fumbling for users with limited hand dexterity).
- Smart thermostats are high priority for users with conditions that make temperature regulation medically important.
- Motion-activated lighting is specifically valuable for mobility-impaired users navigating at night -- the lights activate before the user arrives, not requiring a switch interaction.
- For hearing-impaired users: smart doorbells with visual notification options (flashing lights via smart bulb scenes triggered by doorbell press), and smart smoke/CO detectors with app push notifications provide alerts independent of audible alarms.
- Voice assistant placement for visually impaired users: place a voice assistant speaker in every room so the user never needs to navigate to a single location to issue commands. The incremental cost of additional speakers is justified.
- Automations for accessibility users should default to always-on triggering (not time-limited) -- a mobility-impaired user waking at 3 AM still needs the hallway light to activate on motion.

### User With Existing Mixed-Ecosystem Devices

When the user already has devices spread across multiple incompatible platforms, provide a migration path that minimizes wasted investment:

- **Assess what stays:** Zigbee and Z-Wave devices are hardware-agnostic and move to any hub supporting those protocols. Wi-Fi devices using proprietary protocols may be permanently tied to their original ecosystem -- they either stay in that ecosystem or are decommissioned.
- **Hub as unification layer:** A multi-protocol hub can absorb Zigbee and Z-Wave devices from any previous hub. The migration process is: pair devices to the new hub one at a time, verify functionality, then update automations in the new platform's logic engine.
- **Matter as migration bridge:** Some existing devices can be updated via firmware to add Matter support, allowing them to be controlled by a new platform without hardware replacement. Check the device vendor's roadmap before assuming a device is stranded.
- **The "two app problem":** If a user insists on keeping two separate platforms (e.g., one vendor's ecosystem for kitchen appliances and another for lighting), provide honest guidance that cross-platform automations become difficult. A hub that integrates both platforms is a cleaner solution than maintaining two separate automation engines.

---

## Example

**Input:** "I own a 2,200 sqft, 3-bedroom house built in 1992. Currently no smart devices. I'm comfortable with technology -- I've set up a home network before and I understand how apps work, but I've never used smart home devices. My main goals are energy savings and convenience, in that order. I have a $800 budget to start and eventually want a pretty complete setup. I'm a little concerned about privacy -- I don't love the idea of a company recording me at home."

---

**Output:**

## Smart Home Plan: 3-Bedroom Owned Home (1992) -- Energy Savings + Convenience, Privacy-Aware

### Situation Summary
| Parameter          | Value                                                     |
|--------------------|-----------------------------------------------------------|
| Home type          | Owned single-family house                                 |
| Size               | 2,200 sqft, 3 bedrooms                                    |
| Existing devices   | None                                                      |
| Technical comfort  | App-level (has configured home networks; no smart home experience) |
| Primary goals      | Energy savings first, convenience second, privacy concern noted |
| Budget             | $800 Phase 1-2; full system eventually                    |
| Electrical notes   | 1992 construction -- most switch boxes will have neutral wires; verify one box before buying switches in bulk |

### Platform Selection
| Decision              | Recommendation                              | Rationale                                                                                    |
|-----------------------|---------------------------------------------|----------------------------------------------------------------------------------------------|
| Architecture type     | Hub-based (hybrid: hub for automation, limited voice assistant) | App-comfortable user benefits from local processing for reliability and privacy; hub unlocks Zigbee sensors (best for energy-saving automations) and complex multi-condition logic |
| Primary protocol      | Zigbee for sensors and bulbs; Z-Wave for lock; Wi-Fi for thermostat and doorbell | Zigbee gives broad low-cost sensor options; Z-Wave avoids 2.4 GHz congestion for the security-sensitive lock; Wi-Fi for devices needing high bandwidth or reliable cloud-free local API |
| Hub recommendation    | Dedicated multi-protocol hub supporting Zigbee, Z-Wave, and Wi-Fi local API integration | Manages all three protocols in one interface; runs automations locally (works during internet outages); no monthly fee |
| Voice assistant       | Optional and limited -- recommend a smart speaker placed in kitchen only, configured to minimize data retention | Privacy concern is legitimate; voice assistant is useful for hands-free cooking queries but should not be the primary automation engine for a privacy-aware household; hub handles automation logic locally |
| Matter strategy       | Prefer Matter-certified devices for thermostat and future switches; not required for Zigbee sensors | Thermostat is a long-term investment; Matter certification here avoids platform lock-in if hub strategy changes in 3+ years |

### Phase Implementation Plan
| Phase | Name               | Device Categories                                                   | Installation Type       | Estimated Cost  | Timeline     |
|-------|--------------------|---------------------------------------------------------------------|-------------------------|-----------------|--------------|
| 1     | Quick Wins         | Hub (1), smart plugs with energy monitoring (4), Zigbee smart bulbs (6 -- living room and primary bedroom) | Plug-in; no wiring     | $200-$280       | Day 1        |
| 2     | Energy Core        | Smart thermostat (1), door sensors (4 -- all exterior doors), window sensors (4 -- living room and bedroom windows), motion sensors (2 -- living room and hallway) | Low complexity; no electrical | $220-$350 | Weeks 1-2    |
| 3     | Access & Security  | Smart lock -- Z-Wave (1 front door), video doorbell -- wired (1), outdoor cameras (2)  | Moderate; doorbell uses existing low-voltage wiring | $320-$550 | Weeks 3-6    |
| 4     | Advanced (future)  | Smart light switches for high-traffic rooms (5), leak sensors (5 -- under sinks and water heater), smart smoke/CO detectors (replace all 3 existing) | Switch install requires neutral wire verification | $400-$600 | Month 2+     |
| **Total (Phase 1-3)** |               |                                                                     |                         | **$740-$1,180** |              |

Phase 1 budget of $800 covers Phases 1 and 2 comfortably at the low end, with Phase 3 as a planned second investment.

### Device Feature Requirements

**Hub (dedicated multi-protocol)**
- Required: native Zigbee radio (not just a Zigbee bridge that requires a separate device); native Z-Wave radio or Z-Wave USB adapter support
- Required: local automation engine -- automations must execute without an active internet connection
- Required: local web or app interface accessible from within the home network without connecting to a vendor cloud
- Recommended: active development community and regular firmware updates (longevity indicator)
- Avoid: hubs that route all device commands through vendor cloud servers as a primary path

**Smart Plugs with Energy Monitoring**
- Required: energy monitoring capability (measures watts drawn by connected device) -- this is the feature that enables the energy savings the user prioritized
- Required: 2.4 GHz Wi-Fi compatibility or Zigbee (either works with the hub)
- Required: local API access or Zigbee pairing so the hub controls them without cloud intermediary
- Recommended: scheduling and on/off power state reporting
- Avoid: plugs that require a subscription for full feature access

**Zigbee Smart Bulbs**
- Required: color temperature range of 2700K (warm white) to at least 5000K (cool daylight); this single feature covers all lighting mood needs
- Required: dimming capability
- Recommended: instant response to hub commands (under 500ms latency is normal for Zigbee)
- Avoid: bulbs that require a proprietary bridge -- they must pair directly to the multi-protocol hub

**Smart Thermostat**
- Required: confirm C-wire availability at the thermostat base before purchasing -- photograph current thermostat wiring. 1992 homes typically have a C-wire in the HVAC air handler but it may not be run to the thermostat base. If absent, a C-wire adapter kit works for most single-stage HVAC systems.
- Required: geofencing support for away/home temperature adjustment
- Required: local API or Matter certification so the hub can trigger automation-based setpoints
- Recommended: HVAC usage reporting (shows run time per day -- useful for measuring energy savings before and after)
- Avoid: thermostats requiring a proprietary app with no hub integration pathway

**Door and Window Sensors**
- Required: Zigbee (for local hub control without cloud)
- Required: battery life of at least 1 year on standard CR2032 or AA battery
- Recommended: tamper detection (secondary trigger if sensor cover is removed)
- Avoid: Wi-Fi door sensors -- unnecessary bandwidth use for a binary open/closed signal

**Motion Sensors**
- Required: Zigbee; passive infrared (PIR) detection
- Required: configurable sensitivity (adjustable detection zone to reduce false triggers from pets)
- Required: configurable timeout (how long "motion active" state persists after last detected movement -- 30 seconds to 5 minutes is the useful range)
- Recommended: illuminance (lux) sensor built in -- enables automations conditioned on whether the room is already bright, eliminating unnecessary light activations during daytime

**Z-Wave Smart Lock**
- Required: Z-Wave Plus certification (extended range, improved network management vs. original Z-Wave)
- Required: individual guest codes with expiration date setting
- Required: activity log with timestamps
- Required: auto-lock timer (default 1-5 minutes after unlock)
- Recommended: low battery alert sent to hub 30+ days before battery failure
- Avoid: locks that store all code management in the cloud only -- require an app connection to add/remove codes

### Network Preparation Checklist
- [ ] Log into router admin interface and confirm it supports separate SSIDs (most routers made after 2015 support this via "guest network" feature)
- [ ] Create a dedicated 2.4 GHz-only SSID named "Home-IoT" -- disable 5 GHz band on this SSID specifically
- [ ] Disable "band steering" or "smart connect" on the main SSID during device pairing sessions, or use the dedicated 2.4 GHz IoT SSID exclusively during smart device setup
- [ ] Hub placement: identify a central location on the main floor with a power outlet -- within approximately 25 ft of the living room (where the first Zigbee bulbs will be installed) to anchor the Zigbee mesh
- [ ] Configure Zigbee channel in hub settings to channel 25 or 26 to avoid overlap with 2.4 GHz Wi-Fi channels 1, 6, and 11
- [ ] Verify upload bandwidth: this plan (Phase 1-3) includes 2 outdoor cameras; confirm ISP plan provides at least 8 Mbps upload for cloud recording, or plan to use local NVR storage from the start
- [ ] With 2,200 sqft home: current router coverage is likely adequate for Phases 1-2 (hub handles Zigbee and Z-Wave traffic); reassess when Phase 3 cameras are added at the home's exterior perimeter
- [ ] Before buying smart switches in Phase 4: open one representative switch box in the home and verify a white neutral wire is present and connected to the wire bundle in the back of the box -- not just passing through

### Privacy and Security Checklist
- [ ] During hub setup: change the hub's default admin username and password before connecting any devices; write these credentials in a household password manager
- [ ] Enable two-factor authentication on: hub admin account, smart thermostat account, video doorbell account, outdoor camera account
