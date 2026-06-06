---
name: wifi-troubleshooter
description: |
  Diagnose and fix WiFi problems - slow speeds, dead zones, interference, connection drops, and security issues with step-by-step solutions.
  Use when the user asks about wifi troubleshooter, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of wifi troubleshooter or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart home-maintenance budgeting checklist testing branding performing-arts video-production"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# WiFi Troubleshooter

## When to Use

**Use this skill when:**
- A user reports slow internet speeds, buffering, or inability to stream video at expected quality
- A user has dead zones or weak signal in specific rooms or areas of their home
- A user experiences frequent disconnections, drops, or devices that periodically lose WiFi
- A user cannot connect one or more devices to their network despite other devices working
- A user suspects unauthorized access to their network or wants to review security settings
- A user has recently moved their router, added new devices, or changed ISP plans and noticed degraded performance
- A user wants to optimize their network for a specific use case -- gaming, remote work, smart home, video calls
- A user is comparing mesh systems, range extenders, or powerline adapters to solve coverage problems
- A user asks why their WiFi is slower than their paid internet plan

**Do NOT use when:**
- The user needs help configuring an enterprise or business-grade network with VLANs, 802.1X authentication, or managed switches -- refer to a network administration skill
- The user's issue is with a cellular data connection or mobile hotspot rather than a home WiFi network
- The user is troubleshooting a wired Ethernet-only connection with no WiFi component
- The user needs ISP-level diagnostics (line quality, DOCSIS signal levels, fiber ONT provisioning) beyond what they can check themselves -- advise them to call their ISP
- The user is asking about WiFi 6E or 6 GHz band enterprise deployment in a commercial building
- The user needs VPN configuration or split-tunneling setup -- refer to a network security skill
- The user is asking about parental controls or content filtering as a primary goal -- refer to a parental controls skill

---

## Process

### Step 1: Triage the Problem with Five Diagnostic Questions

Before recommending any fix, gather the minimum viable information to avoid sending the user down the wrong path.

- **Scope:** "Does this affect all devices in the house, or just one specific device?"
- **Location:** "Does it happen everywhere in your home, or only in certain rooms or when you're far from the router?"
- **Timing:** "Is this constant, or does it happen at certain times of day -- like evenings or weekends?"
- **Baseline:** "Has this always been slow or was it working fine before? If it changed, what changed around the same time?"
- **Equipment:** "Do you have a separate modem and router, a combo unit from your ISP, or a mesh system like Eero or Google Nest?"

These five answers immediately narrow the problem to one of six categories: ISP/modem issue, router hardware issue, placement/coverage issue, channel interference issue, device-specific issue, or congestion/bandwidth issue. Do not skip this step -- jumping to router settings before confirming the modem is healthy wastes time.

### Step 2: Establish a Baseline with Speed Tests

A speed test done incorrectly produces misleading data. Guide the user through a valid test sequence.

- **Wired baseline first:** Connect a laptop directly to the router or modem-router combo using an Ethernet cable. Run a speed test at fast.com or use the built-in test at the ISP's website. This isolates whether the problem is upstream of WiFi entirely.
- **5 GHz WiFi baseline:** Move to within 10 feet of the router, connect to the 5 GHz band (usually the network name ending in "-5G" or "-5GHz"), and run the same test. Result should be within 20% of the wired result on a modern router.
- **Problem location test:** Move to the location where the user experiences issues and run the test again. Note the drop-off.
- **Time-of-day test:** If the user reports evening slowdowns, ask them to run the test again during peak hours (7 PM -- 10 PM) and again at 6 AM. A 50%+ drop in the evening on wired Ethernet almost always indicates ISP congestion or a modem provisioning issue, not a WiFi problem.
- **Interpret results against the plan:** A user paying for 300 Mbps who sees 280 Mbps wired but only 40 Mbps on WiFi in the next room has a WiFi coverage or interference problem. A user seeing 40 Mbps on wired has an ISP or modem problem.

### Step 3: Check the Physical Layer Before Touching Settings

Most WiFi problems are caused by physical placement, hardware condition, or cable quality -- not software settings. Check these before logging into any admin panel.

- **Router placement:** The router should be centrally located, elevated to shelf or desk height (minimum 2 feet off the floor), and in the open. Signal travels through walls at a loss of roughly 3--5 dB per drywall layer and 10--15 dB per concrete or brick wall. A router in a corner basement loses 2--3 wall traversals before it even reaches the center of the home.
- **Cable integrity:** A coaxial or phone line that has a damaged splitter, corroded F-connector, or sharp bend can reduce DOCSIS signal quality enough to cause packet loss. Ask the user whether their modem has any blinking lights when the problem occurs -- a blinking "online" or "internet" light indicates the modem is losing sync with the ISP.
- **Router temperature:** Consumer routers operating above 55°C begin throttling their radios. A router in an enclosed entertainment cabinet, on top of another device that generates heat, or in a room without ventilation is a common cause of drops that begin after 2--3 hours of use and resolve after a restart.
- **Antenna orientation:** On routers with external antennas, vertical orientation (pointing straight up) maximizes coverage on the same floor. For multi-story homes, tilting one antenna 45 degrees or pointing it horizontally increases vertical signal propagation.

### Step 4: Diagnose Channel Interference

Channel interference from neighboring networks is one of the top causes of poor WiFi performance in apartments, condos, and densely populated neighborhoods. It is invisible without scanning tools.

- **Scan the RF environment:** On Windows, open Command Prompt and run `netsh wlan show networks mode=bssid` to see channels in use. On macOS, hold Option and click the WiFi menu bar icon, then select "Open Wireless Diagnostics" -- in the Window menu, open the Scan tab to see signal strength and channel of every nearby network. On Android, WiFi Analyzer (open-source version) provides a clear channel graph.
- **2.4 GHz channel selection:** The 2.4 GHz band has 11 channels in the US (13 in Europe), but only channels 1, 6, and 11 are non-overlapping. If a scan shows 5 networks on channel 6, switch to channel 1 or 11. Setting a router to "Auto" channel selection does not always pick the least congested option.
- **5 GHz channel selection:** The 5 GHz band has 25 non-overlapping 20 MHz channels in the US (UNII-1, UNII-2, UNII-2e, UNII-3). Channels 36, 40, 44, and 48 (UNII-1) are indoor-only and not subject to DFS (Dynamic Frequency Selection) radar avoidance, making them the most stable choices. Channels 52--144 (UNII-2 and UNII-2e) are subject to DFS and can cause a 30--60 second blackout if radar is detected. Channels 149--165 (UNII-3) are also stable but may have reduced power limits in some countries.
- **Channel width:** 80 MHz and 160 MHz channel widths increase peak throughput but also increase the chance of interference in congested areas. In dense apartment buildings, try 40 MHz on 5 GHz and 20 MHz on 2.4 GHz for stability over peak speed.
- **Non-WiFi interference sources:** Microwave ovens emit broadband noise at 2.4 GHz when in use. Older Bluetooth devices (pre-Bluetooth 4.0) also use 2.4 GHz with frequency hopping. Baby monitors, wireless cameras, and Z-Wave devices can cause issues. The fix is to move the router away from these devices or switch affected devices to 5 GHz.

### Step 5: Log Into the Router and Audit Settings

Router admin panels contain settings that, when incorrectly configured, significantly degrade performance. Walk the user through accessing and checking these.

- **Access the admin panel:** Default gateway IP can be found on Windows by running `ipconfig` and looking at the "Default Gateway" field. On macOS, go to System Preferences > Network > WiFi > Advanced > TCP/IP tab. Common defaults are 192.168.1.1 (Netgear, Linksys, ASUS, most others) and 192.168.0.1 (TP-Link, D-Link). App-managed routers (Google Nest, Eero, Orbi via app) do not expose a traditional web interface.
- **Firmware update:** This is the highest-priority action in the admin panel. Router firmware updates fix security vulnerabilities, stability bugs, and sometimes add band steering and MU-MIMO improvements. Find it under Administration, Advanced, or Maintenance. Warn the user that the router will restart during the update.
- **Band steering:** On dual-band routers with a single SSID for both bands, check whether band steering is enabled. When working correctly, it pushes capable devices to 5 GHz. When misconfigured, it can cause devices to stick to 2.4 GHz. If a user reports that a device "always seems to be on the slow band," disabling band steering and creating separate SSIDs (e.g., "HomeNetwork" and "HomeNetwork-5G") lets them manually control which band each device uses.
- **Transmit power:** Consumer routers default to maximum transmit power, which can actually cause problems. A router at 100% power overwhelms its own receiver when a device sends back at a lower power level -- this is called the near-far problem. Setting transmit power to 75% or "Medium" can improve stability for devices close to the router.
- **QoS (Quality of Service):** If the user has a busy household with streaming, gaming, and video calls happening simultaneously, enabling QoS and prioritizing video call traffic (mark DSCP EF or use device-based prioritization for work laptops) prevents gaming or file downloads from starving video call packets.
- **DHCP lease table and device count:** Check the connected device list. Consumer routers can typically handle 30--50 concurrent connections before performance degrades. A smart home with 40+ devices (bulbs, plugs, sensors, cameras) consuming 2.4 GHz slots can cause connectivity issues for phones and laptops.

### Step 6: Implement the Coverage Solution Appropriate to the Home Layout

After confirming the router is healthy and settings are correct, address coverage gaps with the right hardware solution.

- **Single-family home under 1,500 sq ft:** A well-placed single router with current-generation hardware (WiFi 5 or WiFi 6) should cover this space. If it doesn't, the issue is placement or interference, not the need for additional hardware.
- **Single-family home 1,500--3,000 sq ft with 1--2 floors:** A single WiFi 6 router placed centrally covers most of this range. If dead zones exist in far corners or the floor above/below, a single mesh satellite or range extender positioned at the edge of good signal (not at the edge of the dead zone) will extend coverage. The extender must have at least -65 dBm signal from the main router to provide a useful backhaul.
- **Home over 3,000 sq ft, multi-story, or with problematic construction (brick, concrete, steel stud):** A mesh system with wired Ethernet backhaul is the correct solution. Wireless backhaul mesh systems sacrifice approximately 50% of throughput at each hop because the same radio that serves clients must also communicate with the main router. Wired backhaul eliminates this penalty. Run Cat5e or Cat6 to satellite locations and configure each satellite as a wired access point.
- **Rental with no ability to run cable:** Powerline adapters (HomePlug AV2 or G.hn standard) transmit network data over existing electrical wiring. Performance ranges from 100--500 Mbps in real-world use depending on wiring age and circuit layout. They do not work across different electrical phases (a common issue in US homes with 240V split-phase wiring) -- devices must be on the same phase. MoCA adapters use coaxial cable (already present in most US homes for cable TV) and achieve 1 Gbps+ with far lower latency than powerline.

### Step 7: Verify the Fix and Document the Baseline

After implementing changes, confirm the fix actually resolved the problem with objective measurements.

- Re-run the speed test sequence from Step 2 at the same locations as the initial tests.
- Check signal strength at problem locations: a device should show at least -67 dBm (or "3 bars") for reliable HD streaming. Below -72 dBm, packet loss becomes significant. On macOS, Option-click the WiFi icon to see RSSI in dBm. On Windows, use `netsh wlan show interfaces` for the current signal level in dBm.
- Test the specific use case that was failing: if the complaint was Zoom call drops in the home office, make a test call. If the complaint was buffering on the TV, stream 4K content for 15 minutes.
- If the fix involved changing router settings, document the new settings for the user so they can restore them after a factory reset. Relevant settings to record: WiFi name (SSID), password, channel, channel width, firmware version, and any QoS rules.
- Establish a maintenance schedule: router firmware should be checked every 3 months. A full restart of the router and modem every 2--4 weeks prevents memory leak issues common in consumer firmware.

---

## Output Format

When delivering a WiFi troubleshooting session, structure your response using this format:

```
## WiFi Diagnosis Report

### Problem Summary
- Reported symptom: [exact description from user]
- Affected scope: [All devices / Specific device / Specific location]
- Duration: [Ongoing / Recent change / Intermittent]

### Baseline Measurements (if available)
| Test | Result | Expected | Gap |
|------|--------|----------|-----|
| Wired speed | X Mbps | Y Mbps (plan speed) | Z% |
| 5 GHz WiFi at router | X Mbps | >80% of wired | Z% |
| 5 GHz WiFi at problem location | X Mbps | >50% of wired | Z% |
| Signal strength at problem location | X dBm | Better than -67 dBm | - |

### Root Cause Assessment
Primary cause: [One clear statement of most likely cause]
Contributing factors:
- [Factor 1 with brief explanation]
- [Factor 2 with brief explanation]

### Recommended Fix Sequence
Priority 1 -- Do This First (Free, Takes <5 Minutes):
[ ] Step with exact instructions

Priority 2 -- Do This If Priority 1 Doesn't Resolve It:
[ ] Step with exact instructions

Priority 3 -- Hardware/Infrastructure Change (If Needed):
[ ] Recommendation with cost estimate and rationale

### Settings to Change
| Setting | Current (if known) | Recommended | Reason |
|---------|-------------------|-------------|--------|
| [Setting name] | [Value] | [Value] | [Why] |

### Security Audit Findings (if relevant)
[ ] WPA3 or WPA2 in use: Yes / No / Unknown
[ ] Default admin password changed: Yes / No / Unknown
[ ] Guest network configured: Yes / No
[ ] Unauthorized devices detected: Yes / No

### Follow-Up Verification
After implementing fixes, confirm resolution by:
- [ ] [Specific test 1]
- [ ] [Specific test 2]

### If Problem Persists
[Clear escalation path -- what to check next or when to call ISP]
```

---

## Rules

1. **Never skip the wired speed test.** Without a wired baseline, it is impossible to determine whether a slow WiFi problem is actually a slow ISP or modem problem. Recommending a mesh upgrade when the real issue is a failing modem wastes the user's money.

2. **Never recommend factory-resetting the router as an early step.** A factory reset erases all settings, custom SSIDs, port forwarding rules, and QoS configuration. It should be the second-to-last resort before hardware replacement. Always exhaust firmware updates, channel changes, placement adjustments, and setting audits first.

3. **Never tell the user their router is fine based on its age alone.** A 3-year-old router running outdated firmware with a memory leak can perform as poorly as a failed unit. Conversely, a new router configured with DFS channels, 160 MHz width, and maximum transmit power in a dense apartment may perform worse than a properly configured older unit.

4. **Distinguish between ISP congestion and local WiFi issues.** If the wired speed test shows throttling during peak hours (evenings, weekends) and full speed at 6 AM, the problem is ISP congestion on the shared node, not anything the user can fix at home. Do not waste their time optimizing router settings for an ISP problem. The correct action is to contact the ISP, escalate a capacity complaint, or switch providers.

5. **Specify which band (2.4 GHz vs 5 GHz) when giving channel advice.** These are entirely separate radio systems with different channel plans, different interference profiles, and different range characteristics. Mixing advice for the two bands confuses users and leads to incorrect settings.

6. **Do not recommend WiFi extenders/repeaters as a first-line solution for whole-home coverage.** Wireless repeaters create a second network segment with NAT complications, introduce latency (typical wireless relay adds 2--5 ms per hop plus the overhead of half-duplex operation on the backhaul), and can make performance worse if placed too far from the main router. Recommend them only as a budget solution for a single isolated dead zone, with the explicit caveat that wired solutions outperform them.

7. **Account for WiFi 6 (802.11ax) vs WiFi 5 (802.11ac) vs WiFi 4 (802.11n) capability mismatches.** A WiFi 6 router does not improve speeds for devices that only support WiFi 4. Always ask about the age of the devices involved when diagnosing slow speeds -- an old laptop with an 802.11n adapter will max out around 150 Mbps regardless of router quality.

8. **Treat DHCP exhaustion as a real possibility in smart home environments.** Many consumer routers use a default DHCP pool of 50 addresses (192.168.1.100 -- 192.168.1.150). A home with 55+ smart devices will see new devices fail to connect with no error that clearly indicates the root cause. Recommend expanding the DHCP pool to 192.168.1.50 -- 192.168.1.254 in homes with many IoT devices.

9. **Do not recommend disabling WPS without confirming the user doesn't use it.** WPS push-button pairing has known vulnerabilities (Pixie Dust attack, brute-force PIN attack), and should be disabled -- but some printers and older smart home devices rely on WPS for initial setup. Warn the user to verify their devices first, or disable WPS after completing any device setup that requires it.

10. **Always end a troubleshooting session with a verification test, not just "let me know if it works."** A specific, reproducible test -- re-running a speed test, making a 10-minute video call, checking signal dBm at the problem location -- creates an objective pass/fail criterion and prevents the user from returning with the same problem that was only partially resolved.

---

## Edge Cases

### Edge Case 1: ISP-Supplied Modem-Router Combo in "Double NAT" with User's Own Router

Some ISPs (Comcast Xfinity, Spectrum, Cox) provide a gateway device that functions as both a modem and a router. If the user then connects their own router behind it, both devices perform NAT, creating Double NAT. Symptoms include gaming consoles failing to open NAT (stuck in "Strict" or "Moderate"), voice calls degrading, and some VPN configurations failing. The fix is to either: (a) put the ISP gateway in "Bridge Mode" or "IP Passthrough" mode (terminology varies -- Xfinity calls it "Bridge Mode," AT&T calls it "IP Passthrough," Cox calls it "Bridge Mode") so it passes the public IP directly to the user's router, or (b) use only the user's router and disable the WiFi on the ISP gateway. Option (a) requires a call to the ISP or access to the gateway's admin panel. Option (b) avoids Double NAT but means the ISP gateway's WiFi is still active -- disable it to prevent interference.

### Edge Case 2: 2.4 GHz Band Completely Saturated in an Apartment Building

In dense urban environments, a 2.4 GHz band scan may reveal 15--30 networks on channels 1, 6, and 11, with average signal levels of -70 dBm or higher. In this case, there is no clean channel available on 2.4 GHz. The correct solution is to migrate all capable devices to 5 GHz (which has less penetration through walls but also less interference from neighbors) and create a dedicated 2.4 GHz SSID only for devices that cannot use 5 GHz (older IoT devices, some printers). Enable WMM (Wi-Fi Multimedia) QoS on the 2.4 GHz radio to prioritize real-time traffic over bulk data. Accept that 2.4 GHz performance will be degraded and set expectations accordingly.

### Edge Case 3: Mesh System Satellites Placed Too Far Apart

The most common mesh installation error is placing the satellite at the location where coverage is needed (the dead zone) rather than at the edge of good coverage from the main router. A satellite receiving -80 dBm from the main router provides a poor wireless backhaul and will deliver worse performance than no satellite at all -- devices that roam to it will get 5--15 Mbps even if the main router is providing 300 Mbps. The rule of thumb: satellite placement should achieve at least -65 dBm from the main unit. Test signal strength at the proposed satellite location before installing it. If the dead zone cannot be reached from a -65 dBm placement point, a second intermediate satellite or a wired backhaul is required.

### Edge Case 4: Intermittent Drops Caused by Router DHCP Lease Renewal Timing

Some devices -- particularly older Android phones and some smart TVs -- send DHCP renewal requests with incorrect timing, causing brief connectivity interruptions every 24 hours (or at whatever the DHCP lease interval is set to). The symptom is a device that drops for 10--30 seconds at a consistent time of day and then reconnects automatically. The fix options are: (a) shorten the DHCP lease time to 4--8 hours to make renewals more frequent and less disruptive, (b) assign the problematic device a DHCP reservation (static IP tied to its MAC address), which prevents the lease negotiation entirely, or (c) set the device to use a manual static IP address within the router's subnet.

### Edge Case 5: High Channel Utilization Due to Legacy 802.11b/g Devices

The 802.11 protocol requires backward compatibility -- a single 802.11b device (11 Mbps maximum) connecting to a modern access point forces the entire 2.4 GHz radio to slow its preamble transmission rate and increases per-packet airtime for all devices on that radio by 2--10x. Common culprits are old printers, original-generation smart plugs, and first-generation Zigbee or WiFi bridges. The fix is to disable 802.11b rates in the router's advanced wireless settings. Look for "Basic Rate Set," "Supported Rates," or "Legacy Rate Support" in the wireless configuration. Setting the minimum rate to 11 Mbps (eliminating 1 and 2 Mbps 802.11b rates) or 24 Mbps (eliminating all 802.11b/g rates below 24 Mbps) dramatically reduces channel utilization and improves performance for all clients, at the cost of dropping support for the oldest devices.

### Edge Case 6: MU-MIMO and OFDMA Benefits Misunderstood

A user with a WiFi 6 router who has 40+ devices may report that performance is still poor during peak household usage. The issue is that MU-MIMO (simultaneous spatial streams to multiple clients) requires client support -- and only devices with WiFi 6 adapters support WiFi 6 MU-MIMO. Older devices (WiFi 4 and 5) still connect as single-stream clients and serialize access to the channel. OFDMA (Orthogonal Frequency Division Multiple Access, a WiFi 6 feature) helps by subdividing the channel into resource units, allowing multiple devices to transmit simultaneously even if they're older -- but only if the router's firmware implements downlink and uplink OFDMA correctly. If the user has a mixed-generation device environment, the practical gains from WiFi 6 hardware are marginal until they also replace client devices. The more impactful fix for many-device homes is segmenting devices across frequency bands (dedicating a 5 GHz radio to laptops and phones, 2.4 GHz to IoT devices) to reduce per-radio client count.

### Edge Case 7: VPN on Router Degrading All Household Traffic

Some users run a VPN client directly on their router (to route all household traffic through the VPN). Consumer routers have limited CPU resources -- a VPN tunnel on OpenVPN protocol typically saturates a router CPU at 30--80 Mbps, creating a hard ceiling regardless of the paid internet plan or WiFi hardware quality. Symptoms are identical to ISP throttling (slow speeds on all devices, at all times, in all locations) except that disabling the VPN immediately restores full speed. WireGuard VPN protocol is approximately 3--5x more CPU-efficient than OpenVPN on the same hardware. If the user insists on a router-level VPN, recommend switching to WireGuard if the router firmware supports it (DD-WRT and OpenWRT both do), or upgrading to a router with a hardware AES-NI instruction set that offloads encryption to dedicated silicon.

### Edge Case 8: 6 GHz Band (WiFi 6E) with WPA3 Requirement

WiFi 6E routers operating in the 6 GHz band require WPA3 security -- the 6 GHz radio will not operate with WPA2. Devices that only support WPA2 will not see or connect to the 6 GHz SSID at all. Users upgrading to a WiFi 6E router who set all SSIDs to WPA3 may find that some devices (smart TVs, older gaming consoles, first-generation smart speakers) suddenly cannot connect. The solution is to maintain a separate 2.4 GHz or 5 GHz SSID with WPA2 compatibility ("WPA2/WPA3 Transition Mode" is available on most WiFi 6E routers and allows both WPA2 and WPA3 devices to coexist on the same SSID for those bands). The 6 GHz SSID remains WPA3-only as required.

---

## Example

**User Input:** "My WiFi has been really slow lately, especially in my bedroom which is at the far end of the house from the router. I'm paying for 400 Mbps from my ISP but my laptop in the bedroom only gets about 20 Mbps. The living room right next to the router is fine. I have a TP-Link Archer AX50 router. The modem is a Motorola MB8600 I bought myself."

---

## WiFi Diagnosis Report

### Problem Summary
- Reported symptom: Slow WiFi speeds (20 Mbps) in bedroom
- Affected scope: Single location (bedroom at far end of house from router)
- Duration: Recent degradation ("lately") -- not a baseline condition

### Baseline Measurements

| Test | Result | Expected | Assessment |
|------|--------|----------|------------|
| Wired speed (to confirm) | Not yet measured | 380--400 Mbps | Run this first |
| 5 GHz WiFi at router | Not yet measured | 300+ Mbps | Run this second |
| 5 GHz WiFi in bedroom | ~20 Mbps reported | 150+ Mbps | Far below threshold |
| Signal strength in bedroom | Not yet measured | Better than -67 dBm | Likely -75 to -80 dBm |

**Action:** Before doing anything else, connect the laptop to the Motorola MB8600 directly via Ethernet and run a test at fast.com. This confirms whether the 400 Mbps plan is being delivered. The MB8600 is a DOCSIS 3.1 modem capable of multi-gigabit, so it is unlikely to be the bottleneck -- but this step eliminates ISP issues from the investigation.

### Root Cause Assessment

**Primary cause:** Insufficient signal strength in the bedroom due to distance and wall attenuation. A single router at one end of a house typically loses 15--25 dB of signal over 40--60 feet through 3--4 interior walls. The TP-Link Archer AX50 is a competent WiFi 6 router with a maximum output of 23 dBm on 5 GHz -- but at -75 dBm RSSI in the bedroom, the link will negotiate to low MCS rates (MCS 3--5 on a single spatial stream), producing exactly the 15--30 Mbps range you're experiencing.

**Contributing factors:**
- The bedroom device may be connecting to 2.4 GHz rather than 5 GHz due to band steering holding it there, further limiting throughput
- If band steering is enabled and the 5 GHz signal is too weak in the bedroom, the device may have switched to 2.4 GHz which is slower per Mbps but reaches farther -- this would explain a working but slow connection at 20 Mbps (typical of a 2.4 GHz connection at distance) rather than no connection at all
- Something may have changed recently that introduced new interference -- a new neighbor's router, a new device in the home, or the router being moved or blocked

### Recommended Fix Sequence

**Priority 1 -- Do This First (Free, Takes 5 Minutes):**
- [ ] Open Command Prompt on the bedroom laptop, run `netsh wlan show interfaces` -- look for "BSSID" and "Radio type." If it shows 802.11n, the laptop is on 2.4 GHz. If it shows 802.11ax or 802.11ac, it's on 5 GHz
- [ ] Scan for the TP-Link's 5 GHz network in the bedroom (likely named your SSID with "-5G" appended, or the same name if band steering is on). If you can see it, try manually connecting to it and retest speed
- [ ] Confirm the AX50's firmware is current: log into 192.168.0.1 (TP-Link default), go to Advanced > System Tools > Firmware Upgrade, check for updates. A firmware update resolved a known band steering regression in early AX50 firmware versions

**Priority 2 -- Settings Optimization (Free, Takes 15 Minutes):**
- [ ] Log into the TP-Link admin panel at 192.168.0.1 (default username/password: admin/admin -- change this if you haven't)
- [ ] Go to Wireless > Wireless Settings > 5 GHz and verify the channel is set to a UNII-1 channel (36, 40, 44, or 48) rather than a DFS channel (52--144). DFS channel radar events cause temporary radio blackouts
- [ ] Check channel width: if set to 80 MHz or 160 MHz, try 40 MHz and retest. This reduces peak throughput but often improves range stability and reduces interference
- [ ] Under Advanced Wireless settings, look for "Transmit Power" -- if it is set to "High" or "Maximum," try "Medium" (75%) which reduces near-far interference and sometimes improves performance at range
- [ ] Disable band steering temporarily (Advanced > Wireless > Band Steering, toggle off) and create a dedicated 5 GHz SSID called "HomeNetwork-5G." Manually connect the bedroom laptop to this SSID to force 5 GHz negotiation

**Priority 3 -- Hardware Solution (If Settings Don't Resolve It):**

Since the living room is working fine and the problem is distance-specific, this is a coverage/range problem that a single router cannot solve without help.

Option A -- TP-Link RE700X WiFi 6 Range Extender ($70--90): Place it in the hallway midpoint between the router and bedroom, where it can see at least -60 dBm from the AX50. This will provide roughly 200--300 Mbps in the bedroom via a dedicated 5 GHz backhaul channel on the AX50 (the RE700X uses a separate radio for backhaul). Note: this creates a second network segment -- your laptop will need to reconnect to the extender's network name when in the bedroom.

Option B -- TP-Link Deco XE75 Mesh System ($200--250 for 2-pack): Replace the AX50 with a mesh system. Place one Deco unit where the AX50 currently is and a second unit in the hallway. Configure with wired Ethernet backhaul if you can run a cable from your current router location to the hallway Deco (a Cat6 cable through the crawlspace or attic). Wired backhaul eliminates the throughput penalty of wireless mesh. Expected result: 300+ Mbps in the bedroom. The Motorola MB8600 connects directly to the primary Deco node, replacing the AX50.

Option C -- TP-Link EAP670 Access Point with Ethernet backhaul ($80): If you can run a single Cat6 cable from the router to the bedroom (or to a central hallway location), a wired access point provides the best performance at the lowest ongoing cost. This is the recommended solution if any cable path is feasible.

**Recommendation:** Given that you have one isolated dead zone and no mention of whole-home coverage issues, Option A is the quickest fix. If you're willing to run one cable, Option C provides better long-term performance.

### Settings to Change

| Setting | Current (likely) | Recommended | Reason |
|---------|-----------------|-------------|--------|
| 5 GHz Channel | Auto (may be on DFS 100) | Channel 36, 40, 44, or 48 | Avoid DFS radar-avoidance blackouts |
| 5 GHz Channel Width | 80 MHz | 40 MHz (try first) | Better range stability in most home layouts |
| Band Steering | Enabled | Disabled (create separate SSIDs) | Allows manual control of which band each device uses |
| Transmit Power | High | Medium | Reduces near-far problem |
| Admin Password | admin/admin (default) | Change immediately | Default credentials are a security risk |
| Firmware | Unknown | Update to latest | AX50 had band steering and range fixes in post-release firmware |

### Security Audit Findings

- [ ] WPA3 or WPA2 in use: Check under Wireless Security settings -- confirm it shows WPA2-PSK (AES) or WPA3 minimum, NOT TKIP or WEP
- [ ] Default admin password changed: Unknown -- change it now if not already done
- [ ] Guest network configured: Not mentioned -- recommended if guests visit
- [ ] Unauthorized devices detected: Check Advanced > Network > LAN > DHCP Client List -- review all connected devices

### Follow-Up Verification

After implementing the fixes above:
- [ ] Run `netsh wlan show interfaces` again in the bedroom and confirm "Radio type" shows 802.11ax or 802.11ac (5 GHz connected)
- [ ] Run fast.com from the bedroom laptop -- target is at least 150 Mbps (37% of plan speed at range is a reasonable expectation through interior walls; above 200 Mbps would indicate excellent 5 GHz coverage)
- [ ] Check signal strength: Option-click WiFi on Mac or use WiFi Analyzer on a phone -- confirm RSSI in bedroom is -67 dBm or better after any hardware changes

### If Problem Persists After Priority 1 and 2 Fixes

If speed in the bedroom remains under 50 Mbps after firmware update, channel optimization, and manual 5 GHz band selection, the signal attenuation through your home's construction is beyond what the AX50 can overcome from its current position. Proceed to Priority 3 hardware solution. The MB8600 modem is not a factor in this issue -- it is correctly separated from the router and is not the bottleneck.
