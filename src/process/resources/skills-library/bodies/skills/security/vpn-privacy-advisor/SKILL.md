---
name: vpn-privacy-advisor
description: |
  Guide for understanding and using VPNs including protocol comparison, provider evaluation criteria, when to use a VPN, setup across devices, and privacy-focused configuration.
  Use when the user asks about vpn privacy advisor, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of vpn privacy advisor or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security checklist guide advanced testing automation networking iot"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# VPN Privacy Advisor

You are an expert in VPN technology and online privacy who helps users understand when and how to use VPNs effectively, select trustworthy providers, and configure VPN connections for maximum privacy and performance.

## When to Use a VPN

### VPN Is Beneficial

| Situation | Why VPN Helps |
|-----------|---------------|
| Public Wi-Fi (coffee shops, airports, hotels) | Encrypts traffic from local network eavesdroppers |
| ISP is known to sell/log browsing data | Prevents ISP from seeing destinations |
| Accessing region-restricted content | Routes traffic through another country |
| Torrenting (legal content) | Prevents ISP from throttling/logging P2P traffic |
| Bypassing network censorship | Circumvents restrictive firewalls |
| Working remotely on employer's network | Secures connection to company resources |
| Preventing IP-based tracking | Masks real IP from websites and services |

### VPN Does NOT Help With

| Misunderstanding | Reality |
|-----------------|---------|
| "VPN makes me anonymous" | VPN provider can see your traffic; websites use cookies/fingerprinting |
| "VPN protects from malware" | Not a substitute for antivirus/endpoint security |
| "VPN prevents all tracking" | Cookies, browser fingerprinting, and account logins still track you |
| "VPN protects my passwords" | HTTPS already encrypts passwords in transit |
| "Free VPN is fine" | Free VPNs often monetize by selling your data |
| "Any VPN is trustworthy" | You are shifting trust from ISP to VPN provider |

## VPN Protocol Comparison

| Protocol | Speed | Security | Obfuscation | Best For |
|----------|-------|----------|-------------|----------|
| **WireGuard** | Excellent | Strong | Low | General use, mobile |
| **OpenVPN** | Good | Strong | Good | Compatibility, bypassing blocks |
| **IKEv2/IPSec** | Very Good | Strong | Low | Mobile (handles network switching) |
| **Lightway** | Excellent | Strong | Medium | ExpressVPN users |
| **SSTP** | Good | Strong | Good | Windows, firewall bypass |
| **L2TP/IPSec** | Fair | Moderate | Low | Legacy compatibility only |
| **PPTP** | Fast | **Broken** | Low | **Never use** |

### Protocol Selection Guide

```
Default choice:
  WireGuard - fastest, modern cryptography, small codebase

If WireGuard is blocked:
  OpenVPN (TCP port 443) - looks like HTTPS traffic

If you need maximum compatibility:
  OpenVPN - works on nearly every platform

For mobile devices:
  WireGuard or IKEv2 - handles network switching gracefully

For bypassing deep packet inspection:
  OpenVPN with obfuscation (Stunnel/Shadowsocks)
  or proprietary protocols with stealth mode
```

## Provider Evaluation Criteria

### Trust Assessment Checklist

```
ESSENTIAL criteria (all must be met):
  [ ] No-logs policy (independently audited)
  [ ] Jurisdiction with no mandatory data retention
  [ ] Open-source clients (at minimum)
  [ ] Regular third-party security audits
  [ ] WireGuard and/or OpenVPN support
  [ ] Kill switch included
  [ ] DNS leak protection
  [ ] No traffic selling, no ads injection

IMPORTANT criteria:
  [ ] RAM-only servers (no disk logging possible)
  [ ] Warrant canary maintained
  [ ] Accepts anonymous payment (crypto, cash)
  [ ] Independent infrastructure (not rented shared servers)
  [ ] Multi-hop / double VPN option
  [ ] Split tunneling support
  [ ] Transparent ownership and team

RED FLAGS (avoid providers with these):
  ✗ Free with no clear revenue model
  ✗ Logs user activity or connection metadata
  ✗ Headquarters in 14 Eyes with weak privacy laws
  ✗ No independent audit of no-logs claims
  ✗ Owned by data broker or advertising company
  ✗ Exaggerated marketing claims ("military-grade")
  ✗ No kill switch or DNS leak protection
  ✗ Only proprietary protocols available
```

### Jurisdiction Considerations

```
Favorable jurisdictions:
  - Panama (no data retention laws)
  - Switzerland (strong privacy laws)
  - British Virgin Islands (no data retention laws)
  - Iceland (strong constitutional protections)
  - Sweden (some protections, but 14 Eyes member)

Less favorable:
  - United States (NSLs, FISA court)
  - United Kingdom (Investigatory Powers Act)
  - Australia (Assistance and Access Act)

Note: Jurisdiction matters less if the provider
genuinely keeps no logs. A provider with verified
no-logs in a "bad" jurisdiction may be more trustworthy
than an unaudited provider in a "good" jurisdiction.
```

## Setup Guides

### Desktop Setup (Windows/macOS/Linux)

```
Step 1: Choose a provider and subscribe
  - Use a privacy-focused email for signup
  - Pay with cryptocurrency or privacy card if available

Step 2: Download the official client
  - Always from the provider's official website
  - Verify the download hash if provided

Step 3: Configure settings
  Recommended settings:
  ├── Protocol: WireGuard (default)
  ├── Kill switch: ON (always)
  ├── DNS leak protection: ON
  ├── Auto-connect on startup: ON (optional)
  ├── Split tunneling: Configure for specific apps if needed
  └── Server: Auto-select nearest or choose specific country

Step 4: Verify the connection
  1. Connect to VPN
  2. Visit ipleak.net or browserleaks.com
  3. Confirm IP matches VPN server, not your real IP
  4. Confirm DNS queries go through VPN
  5. Check for WebRTC leak (should show VPN IP or be blocked)
```

### Mobile Setup (iOS/Android)

```
Step 1: Install from official app store
  - Check developer name matches VPN provider

Step 2: Configure
  ├── Protocol: WireGuard or IKEv2
  ├── Kill switch / Always-on VPN: ON
  │   - Android: Settings -> Network -> VPN -> Always-on
  │   - iOS: Enabled in app settings
  ├── Auto-connect on untrusted networks: ON
  ├── Trusted networks: Add home Wi-Fi (optional)
  └── On-demand rules: Connect on cellular + Wi-Fi

Step 3: Battery optimization
  - Exempt VPN app from battery optimization (Android)
  - WireGuard uses minimal battery (better than OpenVPN)
```

### Router-Level VPN

```
Benefits:
  - All devices protected without individual apps
  - Covers IoT devices, smart TVs, gaming consoles
  - Single point of configuration

Drawbacks:
  - Slower than device-level (router CPU is weaker)
  - All traffic goes through VPN (no split tunneling)
  - More complex setup and troubleshooting

Setup options:
  1. VPN provider's router app (if available)
  2. Flash router with OpenWrt/DD-WRT + WireGuard
  3. Buy a pre-configured VPN router
  4. Set up on a dedicated device (Raspberry Pi as gateway)

Recommended: Use device-level VPN for primary devices,
router-level for IoT devices on a separate VLAN.
```

## Split Tunneling Configuration

### What to Route Through VPN

```
THROUGH VPN (privacy-sensitive):
  ├── Web browsing (all browsers)
  ├── Email clients
  ├── Messaging apps
  ├── Torrent clients
  └── Any app accessing sensitive data

BYPASS VPN (performance-sensitive):
  ├── Online gaming (latency matters)
  ├── Video calls (Zoom, Teams - quality matters)
  ├── Banking apps (may flag VPN as suspicious)
  ├── Local network devices (printers, NAS)
  ├── Speed tests
  └── Streaming if not geo-shifting
```

## DNS Configuration

### DNS Privacy Options

| Option | Privacy | Speed | Setup |
|--------|---------|-------|-------|
| VPN provider's DNS | High (within VPN tunnel) | Good | Automatic |
| DNS over HTTPS (DoH) | High | Good | Browser/OS setting |
| DNS over TLS (DoT) | High | Good | OS/router setting |
| Custom resolver (NextDNS, Quad9) | High + filtering | Good | Manual config |
| ISP default DNS | Low | Varies | Default (change this) |

### Recommended DNS Setup

```
With VPN connected:
  Use VPN provider's DNS (default, stays in tunnel)

Without VPN:
  Use encrypted DNS:
  ├── NextDNS: Custom filtering + privacy
  │   DoH: [external resource]]
  │   DoT: [your-id].dns.nextdns.io
  ├── Quad9: Malware-blocking + privacy
  │   DoH: [external resource]
  │   DoT: dns.quad9.net
  └── Cloudflare: Fast + privacy
      DoH: [external resource]
      DoT: one.one.one.one
```

## VPN Leak Testing

### What to Test

```
After connecting to VPN, check each:

1. IP Address Leak
   Visit: ipleak.net
   Expected: Shows VPN server IP, NOT your real IP

2. DNS Leak
   Visit: dnsleaktest.com -> Extended test
   Expected: DNS servers belong to VPN provider, NOT your ISP

3. WebRTC Leak (browser)
   Visit: browserleaks.com/webrtc
   Expected: No local IP address visible
   Fix: Disable WebRTC in browser
     Firefox: about:config -> media.peerconnection.enabled = false
     Chrome: Install WebRTC Leak Prevent extension

4. IPv6 Leak
   Visit: test-ipv6.com
   Expected: No IPv6 connectivity, or IPv6 through VPN
   Fix: Disable IPv6 if VPN does not support it

5. Kill Switch Test
   Disconnect VPN abruptly (kill the process)
   Expected: All internet access stops immediately
   If traffic flows without VPN -> kill switch is not working
```

## Advanced Privacy Configuration

### Multi-Hop (Double VPN)

```
Your device -> VPN Server 1 -> VPN Server 2 -> Internet

Benefits:
  - Second server only sees traffic from first server
  - Harder to correlate entry and exit traffic
  - Extra protection against compromised server

When to use:
  - High-threat model (journalists, activists)
  - When accessing very sensitive resources
  - When trusting a single VPN server is insufficient

Cost: ~50% speed reduction
```

### VPN + Tor

```
VPN then Tor (recommended if using both):
  Your device -> VPN -> Tor Entry -> Tor Relay -> Tor Exit -> Internet
  - ISP sees VPN traffic (not Tor)
  - VPN sees Tor traffic (not destinations)
  - Tor exit sees internet requests

Note: This is slower and usually unnecessary for most users.
Use only if you have a specific threat model that requires it.
```

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Slow speeds | Distant server / protocol overhead | Switch to WireGuard; choose closer server |
| Cannot connect | Firewall blocking VPN port | Try OpenVPN TCP on port 443 |
| Websites block VPN | IP is flagged as VPN | Try different server; use dedicated IP |
| Banking site blocks access | VPN IP mismatch with account region | Add banking to split tunnel bypass |
| DNS not resolving | DNS leak protection misconfigured | Reset DNS to VPN provider's servers |
| Frequent disconnects | Unstable network / aggressive NAT | Switch protocol; enable keep-alive |
| Kill switch locks out internet | VPN service crashed | Restart VPN app; disable/re-enable kill switch |
| WebRTC leaking real IP | Browser WebRTC enabled | Disable WebRTC or use browser extension |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to vpn privacy advisor
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Vpn Privacy Advisor Analysis

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

**Input:** "Help me with vpn privacy advisor for my current situation"

**Output:**

Based on your situation, here is a structured approach to vpn privacy advisor:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
