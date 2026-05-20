---
name: cybersecurity-personal
description: |
  Comprehensive guide to personal digital security covering password management strategies, two-factor authentication setup, VPN selection and usage, phishing recognition techniques, social engineering awareness, device security hardening, privacy settings for social media and browsers, data breach response procedures, and secure communication tools.
  Use when the user asks about cybersecurity personal, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of cybersecurity personal or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "health-wellness checklist guide cloud testing automation research networking"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---

# Personal Cybersecurity Guide

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.


## When to Use

**Use this skill when:**
- User asks about cybersecurity personal techniques or best practices
- User needs guidance on cybersecurity personal concepts
- User wants to implement or improve their approach to cybersecurity personal

**Do NOT use when:**
- The request falls outside the scope of cybersecurity personal
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. How many online accounts do you estimate you have (email, banking, social media, shopping)?
2. Do you currently use a password manager?
3. Do you have two-factor authentication enabled on your most important accounts?
4. Have you ever been a victim of a hack, phishing attack, or data breach?
5. What devices do you use daily (phone, laptop, tablet, smart home devices)?
6. Do you use public Wi-Fi frequently (coffee shops, airports, hotels)?
7. What is your comfort level with technology?
8. Do you handle sensitive information for work from personal devices?
9. How many people have access to your devices or accounts?
10. What is your biggest cybersecurity concern (identity theft, privacy, financial fraud)?

---

## Phase 1: Password Management

### Why Passwords Matter
Over 80% of data breaches involve compromised passwords. Reusing passwords across sites means one breach can compromise all your accounts.

### Password Best Practices

**Strong password characteristics:**
- Minimum 16 characters (longer is better)
- Mix of uppercase, lowercase, numbers, and special characters
- NOT based on personal information (birthdate, pet name, address)
- NOT a common word or phrase
- Unique for every account (no reuse)

**Passphrase method (recommended):**
Create a memorable phrase with random words:
Example: "correct-horse-battery-staple" (but use your own random words)
Add complexity: "Correct-Horse-Battery-Staple-42!"

### Password Managers

**Why use a password manager:**
- Generates strong, unique passwords for every account
- Remembers them all so you do not have to
- Auto-fills login forms securely
- Alerts you to compromised passwords
- Works across all your devices

**Recommended Password Managers:**

| Manager | Cost | Platforms | Key Features |
|---------|------|----------|-------------|
| Bitwarden | Free / $10/year premium | All platforms | Open source, excellent free tier |
| 1Password | $36/year | All platforms | Travel mode, family sharing |
| Dashlane | $60/year | All platforms | VPN included, dark web monitoring |
| KeePassXC | Free | Desktop (cross-platform) | Offline, open source, full control |

**Setting up a password manager:**
1. Choose a manager and create your account
2. Create a STRONG master password (this is the one password you must remember)
3. Write your master password on paper and store it in a secure physical location
4. Install the browser extension and mobile app
5. Start saving passwords as you log into sites
6. Gradually update weak or reused passwords with generated ones
7. Enable two-factor authentication on the password manager itself

### Passwords to Change First (Priority Order)
1. Email accounts (email is the key to all other account recovery)
2. Financial accounts (banking, investment, payment apps)
3. Password manager master password
4. Social media accounts
5. Cloud storage (Google Drive, iCloud, Dropbox)
6. Shopping accounts with saved payment information
7. Work accounts
8. All remaining accounts

---

## Phase 2: Two-Factor Authentication (2FA)

### What is 2FA?
Two-factor authentication requires two different types of verification to access an account: something you know (password) plus something you have (phone, security key) or something you are (biometrics).

### Types of 2FA (Ranked by Security)

| Method | Security Level | Convenience | Notes |
|--------|---------------|-------------|-------|
| Hardware security key (YubiKey, Titan) | Highest | Medium | Physical device, phishing-resistant |
| Authenticator app (TOTP) | High | High | Time-based codes on your phone |
| Push notification | High | Very High | Approve/deny on phone app |
| SMS text message | Medium | Very High | Better than nothing, but vulnerable to SIM swap |
| Email code | Low-Medium | High | If email is compromised, 2FA is bypassed |

### Setting Up 2FA

**Priority accounts for 2FA:**
1. Email (Gmail, Outlook, etc.)
2. Financial accounts (banks, investment platforms)
3. Password manager
4. Social media
5. Cloud storage
6. Work accounts
7. Shopping accounts with stored payment info

**Recommended authenticator apps:**
- Authy (cloud backup, multi-device sync)
- Google Authenticator
- Microsoft Authenticator
- 1Password (built into the password manager)

**Setup process (typical):**
1. Go to account security settings
2. Find "Two-Factor Authentication" or "Two-Step Verification"
3. Choose your 2FA method
4. Follow the setup wizard (usually scan a QR code with your authenticator app)
5. Save backup codes in your password manager or a secure location
6. Test the setup by logging out and back in

### Backup Codes
When you enable 2FA, most services provide backup codes. These are one-time-use codes for when you cannot access your 2FA device. Store these securely in your password manager and/or a physical secure location. Without them, you may lose access to your account if your phone is lost or broken.

---

## Phase 3: VPN Selection and Usage

### What a VPN Does (and Does Not Do)

**A VPN does:**
- Encrypt your internet traffic between your device and the VPN server
- Hide your IP address from websites you visit
- Protect data on public Wi-Fi from local eavesdropping
- Allow access to geo-restricted content
- Prevent your ISP from seeing which specific sites you visit

**A VPN does NOT:**
- Make you anonymous (the VPN provider can see your traffic)
- Protect against malware or phishing
- Protect accounts with weak passwords
- Make you invisible to law enforcement (with proper legal process)
- Protect data after it leaves the VPN server

### Choosing a VPN Provider

**Look for:**
- No-logs policy (independently audited)
- Strong encryption (WireGuard or OpenVPN protocols)
- Kill switch feature (blocks internet if VPN disconnects)
- Jurisdiction outside surveillance alliances (preferably)
- Transparent ownership and business model
- Regular independent security audits

**Recommended VPN providers:**

| VPN | Cost | Key Features | Audit Status |
|-----|------|-------------|-------------|
| Mullvad | $5.50/month | No email needed, anonymous payment | Audited |
| ProtonVPN | Free tier / $5-10/month | Swiss jurisdiction, open source | Audited |
| IVPN | $6-10/month | No email needed, transparent | Audited |
| Surfshark | $2-4/month | Unlimited devices, good value | Audited |
| NordVPN | $3-5/month | Large server network | Audited |

**Avoid:** Free VPNs from unknown providers (your data is often the product).

### When to Use a VPN
- Always on public Wi-Fi (coffee shops, airports, hotels)
- When accessing sensitive accounts on unfamiliar networks
- When you want to prevent ISP tracking
- When traveling internationally (access home services)

---

## Phase 4: Phishing Recognition

### What is Phishing?
Phishing is an attempt to trick you into revealing sensitive information (passwords, credit card numbers, personal data) by impersonating a legitimate entity through email, text, phone, or websites.

### Common Phishing Indicators

**Email phishing red flags:**
- [ ] Sender address does not match the claimed organization (hover over the "from" name)
- [ ] Generic greeting ("Dear Customer" instead of your name)
- [ ] Urgency or threat ("Your account will be closed in 24 hours!")
- [ ] Spelling and grammar errors
- [ ] Suspicious links (hover to see the actual URL before clicking)
- [ ] Unexpected attachments
- [ ] Requests for sensitive information (passwords, SSN, credit card)
- [ ] Too-good-to-be-true offers
- [ ] Slightly misspelled domains (amaz0n.com, paypa1.com, micros0ft.com)

**Text/SMS phishing (smishing):**
- Unexpected texts from unknown numbers
- Links to shortened URLs
- Urgent requests to verify accounts
- "You've won" messages
- Package delivery notifications you were not expecting

**Phone phishing (vishing):**
- Callers claiming to be from the IRS, Social Security, or police
- Threats of arrest or legal action
- Requests for payment via gift cards or wire transfer
- Caller ID spoofing (shows a legitimate number but is not)
- Pressure to act immediately without time to verify

### What to Do If You Suspect Phishing
1. Do NOT click links or open attachments
2. Do NOT reply to the message
3. Verify independently (call the organization using a number from their official website, not the one in the message)
4. Report phishing emails (forward to the organization and to reportphishing@apwg.org)
5. Delete the message
6. If you already clicked or entered information, change passwords immediately and enable 2FA

---

## Phase 5: Social Engineering Awareness

### Common Social Engineering Tactics

| Tactic | Method | Example |
|--------|--------|---------|
| Pretexting | Creating a false scenario | "I'm from IT, I need your password to fix an issue" |
| Baiting | Offering something enticing | USB drive left in a parking lot with malware |
| Tailgating | Following someone into a secure area | Walking into a building behind an employee |
| Quid pro quo | Offering a service for information | "Free tech support" that installs malware |
| Authority | Impersonating someone in power | "The CEO needs this wire transfer done immediately" |
| Scarcity/Urgency | Creating time pressure | "Only 2 left!" or "Act now or lose access" |

### Defense Against Social Engineering
- Verify identity independently before sharing any information
- Be suspicious of unsolicited contacts (even if they know some personal information about you -- this is often available publicly)
- Slow down and think before acting on urgent requests
- Never share passwords, even with "IT support"
- Question unusual requests, even from seemingly legitimate sources
- Establish verification procedures for sensitive requests (callback numbers, code words)

---

## Phase 6: Device Security

### Smartphone Security

- [ ] Enable screen lock (PIN minimum 6 digits, biometric preferred)
- [ ] Enable automatic updates (operating system and apps)
- [ ] Only install apps from official app stores
- [ ] Review app permissions regularly (revoke unnecessary access to camera, microphone, location, contacts)
- [ ] Enable Find My Device (for remote tracking and wiping)
- [ ] Enable automatic backup (encrypted)
- [ ] Disable Bluetooth and Wi-Fi auto-connect when not needed
- [ ] Use a VPN on public Wi-Fi

### Computer Security

- [ ] Enable full-disk encryption (BitLocker on Windows, FileVault on Mac)
- [ ] Set a strong login password
- [ ] Enable automatic operating system updates
- [ ] Install and maintain antivirus/antimalware software
- [ ] Enable firewall
- [ ] Back up data regularly (3-2-1 rule: 3 copies, 2 media types, 1 offsite)
- [ ] Lock screen when stepping away (Windows+L or Ctrl+Cmd+Q on Mac)
- [ ] Be cautious with USB drives from unknown sources

### Smart Home Device Security
- Change default passwords on all IoT devices (cameras, speakers, routers)
- Keep firmware updated
- Use a separate Wi-Fi network for IoT devices (if your router supports it)
- Disable features you do not use (remote access, voice purchasing)
- Research device privacy policies before purchasing

### Router Security
- Change default admin password
- Use WPA3 encryption (or WPA2 minimum)
- Change default network name (SSID) -- do not include personal information
- Enable automatic firmware updates
- Disable WPS (Wi-Fi Protected Setup)
- Consider a guest network for visitors

---

## Phase 7: Privacy Settings

### Social Media Privacy

**Facebook:**
- Set profile to "Friends Only" (not Public)
- Review who can see past posts (Limit Past Posts feature)
- Disable face recognition
- Review apps and websites connected to your account
- Disable location history
- Review tagged photos before they appear on your profile

**Instagram:**
- Set account to Private (if not a public figure or business)
- Disable activity status
- Review tagged photos before they appear
- Restrict who can message you

**General Social Media:**
- Do not share your full birthdate, address, or phone number
- Be cautious about check-ins and real-time location sharing
- Do not post vacation photos until after returning home
- Review friend/follower lists periodically
- Be cautious about quizzes and personality tests (data harvesting)

### Browser Privacy

- Use a privacy-focused browser (Firefox, Brave) or harden your current browser
- Install uBlock Origin (ad and tracker blocker)
- Enable Do Not Track (limited effectiveness but worth enabling)
- Clear cookies regularly or use containers (Firefox Multi-Account Containers)
- Use private/incognito mode for sensitive searches
- Consider a privacy-focused search engine (DuckDuckGo, Startpage)
- Disable third-party cookies
- Review and limit browser extensions (each extension can see your browsing)

---

## Phase 8: Data Breach Response

### If Your Data Has Been Breached

**Immediate actions (first 24 hours):**
1. Change passwords for the breached account immediately
2. If the password was reused anywhere, change those passwords too
3. Enable 2FA on the breached account (if not already active)
4. Check for unauthorized transactions on financial accounts
5. Monitor email for password reset requests you did not initiate

**Within the first week:**
- Place a fraud alert with one of the three credit bureaus (Equifax, Experian, TransUnion -- they are required to notify the other two)
- Review credit reports at AnnualCreditReport.com
- Consider a credit freeze (prevents new accounts being opened in your name)
- Check HaveIBeenPwned.com for other breaches involving your email
- Update security questions (if the breach included personal information)
- Monitor accounts closely for 6-12 months

**Credit Freeze vs. Fraud Alert:**

| Feature | Credit Freeze | Fraud Alert |
|---------|--------------|-------------|
| Duration | Until you lift it | 1 year (initial) or 7 years (extended) |
| Effect | Blocks all new credit inquiries | Requires additional verification |
| Cost | Free | Free |
| Effort to set up | Must contact each bureau separately | Contact one bureau, others are notified |
| To lift | PIN or password required at each bureau | Expires automatically |

### Secure Communication Tools

| Tool | Type | Key Feature |
|------|------|------------|
| Signal | Messaging | End-to-end encrypted, open source, minimal metadata |
| ProtonMail | Email | End-to-end encrypted, Swiss jurisdiction |
| Tuta (formerly Tutanota) | Email | End-to-end encrypted, German jurisdiction |
| Wire | Messaging | End-to-end encrypted, business and personal |
| iMessage | Messaging | End-to-end encrypted (Apple to Apple only) |

---

## Personal Cybersecurity Checklist

### Do This Today
- [ ] Check HaveIBeenPwned.com for your email addresses
- [ ] Install a password manager and start saving passwords
- [ ] Enable 2FA on your email accounts
- [ ] Update your phone's operating system to the latest version

### Do This Week
- [ ] Change your most critical passwords (email, banking, social media)
- [ ] Enable 2FA on financial accounts
- [ ] Review privacy settings on social media
- [ ] Install uBlock Origin on your browser
- [ ] Set up automatic backups for your phone and computer

### Do This Month
- [ ] Audit and update all account passwords (using password manager)
- [ ] Enable 2FA on all accounts that support it
- [ ] Review app permissions on your phone
- [ ] Set up a VPN for use on public Wi-Fi
- [ ] Check credit reports at AnnualCreditReport.com
- [ ] Review and limit browser extensions
- [ ] Change your router's default admin password

Cybersecurity is not about being perfectly secure -- that is impossible. It is about making yourself a harder target than the next person. Implement these measures in order of priority, and each step significantly reduces your risk.


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to cybersecurity personal
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Cybersecurity Personal Analysis

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

**Input:** "Help me with cybersecurity personal for my current situation"

**Output:**

Based on your situation, here is a structured approach to cybersecurity personal:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
