---
name: privacy-audit-guide
description: |
  Comprehensive personal privacy audit covering browser hardening, phone privacy settings, social media exposure reduction, data broker removal, and ongoing privacy maintenance routines.
  Use when the user asks about privacy audit guide, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of privacy audit guide or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security template guide advanced testing networking video-production email"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Privacy Audit Guide

You are an expert in personal digital privacy who conducts thorough privacy audits, identifies exposure points, and guides users through systematically reducing their digital footprint across browsers, devices, social media, and data brokers.


## When to Use

**Use this skill when:**
- User asks about privacy audit guide techniques or best practices
- User needs guidance on privacy audit guide concepts
- User wants to implement or improve their approach to privacy audit guide

**Do NOT use when:**
- The request falls outside the scope of privacy audit guide
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Privacy Audit Framework

### Audit Scope

```
Complete Personal Privacy Audit:
├── 1. Browser Privacy (30 min)
├── 2. Search Engine & DNS (15 min)
├── 3. Email Privacy (20 min)
├── 4. Phone Settings (30 min)
├── 5. Social Media Audit (45 min)
├── 6. Account & App Permissions (30 min)
├── 7. Data Broker Removal (60 min)
├── 8. Network Privacy (20 min)
└── 9. Ongoing Monitoring Setup (15 min)

Total: ~4 hours for initial audit
Maintenance: 30 min/month
```

## Browser Hardening

### Firefox Privacy Configuration

```
Settings -> Privacy & Security:

Enhanced Tracking Protection: Strict
  (May break some sites; fall back to Standard if needed)

Cookies: Delete cookies and site data when Firefox is closed
  Exceptions: Add sites you want to stay logged into

History: Use custom settings
  [ ] Remember browsing and download history (uncheck)
  [x] Remember search and form history (optional)
  [x] Clear history when Firefox closes

Permissions:
  Location: Block new requests
  Camera: Block new requests
  Microphone: Block new requests
  Notifications: Block new requests
  Autoplay: Block Audio and Video

HTTPS-Only Mode: Enable in all windows

Address Bar:
  [ ] Suggestions from sponsors (uncheck)
  [ ] Suggestions from the web (optional)

Telemetry:
  [ ] Allow Firefox to send technical data (uncheck all)
```

### Recommended Browser Extensions

| Extension | Purpose | Priority |
|-----------|---------|----------|
| uBlock Origin | Ad and tracker blocking | Essential |
| Privacy Badger | Learns to block invisible trackers | Recommended |
| Cookie AutoDelete | Auto-remove cookies after tab closes | Recommended |
| HTTPS Everywhere | Force HTTPS connections | Built into most browsers now |
| Decentraleyes | Local CDN emulation (reduces tracking) | Optional |
| Skip Redirect | Bypass tracking redirects | Optional |
| CanvasBlocker | Prevent canvas fingerprinting | Advanced |
| Multi-Account Containers | Isolate browsing contexts | Advanced (Firefox only) |

### Firefox about:config Privacy Tweaks

```
Open about:config and set:

# Disable telemetry
toolkit.telemetry.enabled = false
toolkit.telemetry.unified = false
toolkit.telemetry.archive.enabled = false

# Disable Pocket
extensions.pocket.enabled = false

# Disable prefetching (prevents DNS leaks)
network.dns.disablePrefetch = true
network.prefetch-next = false

# Disable WebRTC IP leak
media.peerconnection.enabled = false
  (Note: breaks video calls in browser - enable per-site if needed)

# Resist fingerprinting (may break some sites)
privacy.resistFingerprinting = true

# Disable beacon (analytics)
beacon.enabled = false

# First-party isolation
privacy.firstparty.isolate = true
```

### Browser Fingerprinting Check

```
Test your browser fingerprint:
1. Visit coveryourtracks.eff.org
2. Run the test
3. Review results:
   - Unique fingerprint = easily trackable
   - Goal: "partial protection" or better
4. If highly unique, consider:
   - Enabling resistFingerprinting
   - Using fewer extensions (paradoxically, more = more unique)
   - Using a common browser configuration
```

## Phone Privacy Settings

### iOS Privacy Audit

```
Settings -> Privacy & Security:

Location Services:
  [ ] Review each app:
      - "Never" for apps that do not need location
      - "While Using" for maps, weather, rideshare
      - "Never" for social media, shopping, news
  [ ] System Services (bottom):
      - Turn OFF: Location-Based Apple Ads
      - Turn OFF: Location-Based Suggestions
      - Turn OFF: Significant Locations

Tracking:
  [x] Ask Apps Not to Track = ON
  Review and deny any apps with tracking permission

App Privacy Report:
  Turn ON to monitor which apps access data

Analytics & Improvements:
  [ ] Share iPhone Analytics = OFF
  [ ] Share with App Developers = OFF
  [ ] Improve Siri & Dictation = OFF

Apple Advertising:
  [ ] Personalized Ads = OFF

Contacts, Calendars, Photos:
  Review each app's access - revoke unnecessary permissions

Camera & Microphone:
  Review which apps have access - minimize
```

### Android Privacy Audit

```
Settings -> Privacy:

Permission Manager:
  Review each permission category:
  - Camera: Only apps that need it
  - Microphone: Only apps that need it
  - Location: Minimize to "While in use" or "Deny"
  - Contacts: Only messaging/phone apps
  - Files: Only apps that genuinely need file access
  - Phone: Only phone/dialer apps

Privacy Dashboard (Android 12+):
  Review which apps used permissions recently

Google Settings:
  Settings -> Google -> Manage your Google Account:
  - Data & Privacy -> Activity controls:
    [ ] Web & App Activity = Pause (or auto-delete 3 months)
    [ ] Location History = Pause (or auto-delete 3 months)
    [ ] YouTube History = Pause (or auto-delete 3 months)
  - Ads:
    [ ] Ad personalization = OFF

Ads:
  Settings -> Privacy -> Ads:
  [ ] Delete advertising ID
  [ ] Opt out of Ads Personalization

Unused apps:
  Settings -> Apps -> Sort by last used
  Remove apps not used in 3+ months
  Revoke permissions for rarely used apps
```

## Social Media Privacy Audit

### General Principles

```
For each social media account, review:

1. Profile Visibility
   - What can strangers see? (name, photo, posts, friends)
   - Set to maximum privacy / "friends only"
   - Remove phone number from profile
   - Use a non-primary email address

2. Post History
   - Review and delete old posts with personal info
   - Limit past posts visibility (Facebook: "Limit Past Posts")
   - Remove location data from old posts

3. Connected Apps
   - Review all third-party app connections
   - Revoke access for apps you no longer use
   - Minimize permissions for remaining apps

4. Data Download
   - Request your data archive from each platform
   - Review what they have stored
   - Delete what you can

5. Search Engine Visibility
   - Disable "allow search engines to link to your profile"
   - Request removal of cached pages if needed
```

### Platform-Specific Settings

```
Facebook/Meta:
  Settings -> Privacy:
  - Who can see your future posts: Friends
  - Who can send friend requests: Friends of friends
  - Who can look you up by email/phone: Only me
  - Search engine linking: OFF
  Settings -> Apps and Websites:
  - Remove all unused app connections
  Settings -> Face recognition: OFF (if available)
  Settings -> Off-Facebook Activity:
  - Clear history and turn off future connections

Instagram:
  Settings -> Privacy:
  - Private Account: ON (if appropriate)
  - Activity Status: OFF
  - Story Sharing: OFF or Limited
  - Remove precise location from posts

LinkedIn:
  Settings -> Visibility:
  - Profile viewing options: Private mode
  - Email/phone visibility: Only me or connections
  Settings -> Advertising data:
  - Turn off all ad personalization options
  Settings -> Account:
  - Review and remove connected services
```

## Data Broker Removal

### Major Data Brokers to Opt Out From

```
Priority data brokers (remove from these first):

1. Spokeo
   Opt-out: spokeo.com/optout
   Search your name, copy the URL, submit removal

2. WhitePages / WhitePages Premium
   Opt-out: whitepages.com/suppression-requests
   Find your listing, request removal

3. BeenVerified
   Opt-out: beenverified.com/faq/opt-out
   Submit with email address used

4. Intelius
   Opt-out: intelius.com/opt-out
   Submit with full name and state

5. Radaris
   Opt-out: radaris.com -> find profile -> Control Information

6. MyLife
   Opt-out: mylife.com/ccpa/index.pubview

7. TruePeopleSearch
   Opt-out: truepeoplesearch.com -> find listing -> Remove This Record

8. FastPeopleSearch
   Opt-out: fastpeoplesearch.com/removal

9. ThatsThem
   Opt-out: thatsthem.com/optout

10. PeopleFinder
    Opt-out: peoplefinder.com/optout
```

### Opt-Out Process Template

```
For each data broker:
1. Search for yourself (full name + city/state)
2. Identify your listing(s)
3. Follow opt-out link (usually at bottom of page)
4. Submit removal request
5. Provide required verification (email, sometimes phone)
6. Document the date and broker in your tracking sheet
7. Verify removal in 2-4 weeks
8. Re-check in 6 months (data brokers re-add profiles)

Tracking Sheet:
| Broker | Date Requested | Date Verified | Re-check Date |
|--------|---------------|---------------|---------------|
| Spokeo | 2025-01-15 | 2025-01-29 | 2025-07-15 |
| ... | ... | ... | ... |
```

### Automated Removal Services

```
If manual removal is too time-consuming:

Paid services that automate opt-outs:
- DeleteMe (~$129/year) - scans 750+ brokers
- Kanary (~$89/year) - scans and monitors
- Privacy Duck (variable pricing) - manual removal service
- Optery (free tier + premium) - monitors and removes

These services:
  1. Scan data broker sites for your information
  2. Submit opt-out requests on your behalf
  3. Monitor for re-listing and re-submit removals
  4. Provide reports on what was found and removed
```

## Email Privacy

### Practices

```
Email privacy improvements:
├── Use email aliases for signups (SimpleLogin, AnonAddy)
│   - Real email never exposed to services
│   - Disable individual aliases when they get spam
│   - Some password managers include this feature
├── Disable remote image loading (tracking pixels)
│   - Gmail: Settings -> Images -> Ask before displaying
│   - Outlook: Settings -> View all Outlook settings -> Mail -> External images -> OFF
│   - Apple Mail: Settings -> Privacy -> Protect Mail Activity -> ON
├── Use end-to-end encrypted email for sensitive messages
│   - ProtonMail, Tutanota
│   - PGP/GPG for technical users
└── Unsubscribe audit
    - Unsubscribe from everything you do not read
    - Use unroll.me alternative (manually, as unroll.me reads emails)
```

## Ongoing Privacy Maintenance

### Monthly Tasks (15 min)

- [ ] Review app permissions on phone - revoke anything unnecessary
- [ ] Check for new data broker listings (search your name)
- [ ] Review and delete unused accounts
- [ ] Clear browser data / review cookie exceptions
- [ ] Check privacy dashboard on phone for suspicious app access

### Quarterly Tasks (30 min)

- [ ] Re-check data broker opt-outs (they re-list)
- [ ] Review social media privacy settings (platforms change defaults)
- [ ] Audit connected apps on all social/email accounts
- [ ] Update browser and extensions
- [ ] Review email aliases - disable compromised ones

### Annual Tasks (2 hours)

- [ ] Full privacy audit (repeat this guide)
- [ ] Request data export from major platforms
- [ ] Review and close unused online accounts
- [ ] Search your name/email/phone in search engines and data brokers
- [ ] Update privacy threat model based on life changes
- [ ] Evaluate new privacy tools and services

## Privacy Threat Levels

| Level | Profile | Key Actions |
|-------|---------|-------------|
| **Basic** | Average user wanting reasonable privacy | Browser hardening, phone settings, password manager |
| **Moderate** | Professional concerned about data exposure | Above + data broker removal, email aliases, VPN |
| **High** | Journalist, activist, public figure | Above + compartmentalized identities, encrypted comms, threat modeling |
| **Maximum** | At-risk individual with specific threats | Above + dedicated devices, Tor, operational security training |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to privacy audit guide
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Privacy Audit Guide Analysis

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

**Input:** "Help me with privacy audit guide for my current situation"

**Output:**

Based on your situation, here is a structured approach to privacy audit guide:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
