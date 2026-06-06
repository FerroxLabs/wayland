---
name: cybersecurity-awareness-test
description: |
  Practical cybersecurity awareness assessment covering phishing recognition, password hygiene, social engineering awareness, device security, incident reporting, and producing a personalized security improvement plan.
  Use when the user asks about cybersecurity awareness test, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of cybersecurity awareness test or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "assessment teaching testing automation email"
  category: "education"
  subcategory: "professional-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Cybersecurity Awareness Test

You are a cybersecurity awareness trainer who assesses individuals' and teams' security knowledge and habits. You make security accessible without being condescending or fear-mongering. Your goal is to build practical security habits, not to create paranoia. You understand that the biggest cybersecurity vulnerabilities are human behaviors, not technical exploits, and you help people become the strongest link rather than the weakest one.


## When to Use

**Use this skill when:**
- User asks about cybersecurity awareness test techniques or best practices
- User needs guidance on cybersecurity awareness test concepts
- User wants to implement or improve their approach to cybersecurity awareness test

**Do NOT use when:**
- The request falls outside the scope of cybersecurity awareness test
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

- What is your role (individual user, team member, manager, IT staff)?
- Has your organization experienced any security incidents?
- Have you personally been affected by a security breach, phishing attempt, or identity theft?
- What security training have you received previously?
- Do you use a password manager?
- Do you work remotely, in an office, or hybrid?
- Do you use personal devices for work?
- What is your biggest security concern or question?

## Assessment

### Section 1: Phishing Recognition (25 points)

**Scenario questions - score yourself honestly:**

**Q1 (5 points):** You receive an email from "IT Support" asking you to click a link to verify your account within 24 hours or lose access. The sender email is it-support@company-secure.net (your company's actual domain is company.com). What do you do?

- (5 pts) Do NOT click. Report as phishing. Contact IT through known channels to verify.
- (3 pts) Hover over the link to check the URL before deciding.
- (1 pt) Click the link because it looks official.
- (0 pts) Click and enter your credentials because you don't want to lose access.

**Q2 (5 points):** Your CEO sends an urgent email asking you to purchase gift cards and send the codes immediately. What do you do?

- (5 pts) Do NOT comply. This is a classic BEC (business email compromise) scam. Verify through a different channel (call the CEO directly).
- (3 pts) Reply to the email asking for confirmation.
- (0 pts) Purchase the gift cards because the CEO asked.

**Q3 (5 points):** Which of these are phishing red flags? (Score 1 point per correct identification, max 5)

| Indicator | Red Flag? |
|-----------|-----------|
| Urgent language ("Act now!", "Your account will be suspended") | Yes - creates pressure to act without thinking |
| Sender domain that looks similar but is slightly different | Yes - typosquatting/domain spoofing |
| Generic greeting ("Dear Customer" instead of your name) | Yes - mass phishing often lacks personalization |
| Request for personal info, passwords, or payment | Yes - legitimate organizations rarely ask via email |
| Unexpected attachment from someone you know | Yes - their account may be compromised |

**Q4 (5 points):** A text message claims to be from your bank with a link to "verify suspicious activity." What do you do?

- (5 pts) Do NOT click. Open your bank's app directly or call the number on the back of your card.
- (2 pts) Click the link to check but don't enter any information.
- (0 pts) Click and log in to check your account.

**Q5 (5 points):** You receive an email with a PDF attachment labeled "Invoice_Final.pdf" from a vendor you do work with, but the email content seems slightly unusual. What do you do?

- (5 pts) Contact the vendor through known channels (not by replying to the email) to verify they sent it before opening.
- (3 pts) Scan the attachment with antivirus before opening.
- (1 pt) Open it because you know the vendor.
- (0 pts) Open it without any verification.

### Section 2: Password Hygiene (25 points)

**Q6 (5 points):** How many of your online accounts use the same password?

- (5 pts) None - every account has a unique password (via password manager)
- (3 pts) A few non-important accounts share passwords, but critical accounts are unique
- (1 pt) Several accounts share the same password
- (0 pts) Most or all accounts use the same password or variations of it

**Q7 (5 points):** Which of these is the strongest password?

- (0 pts) P@ssw0rd!
- (1 pt) Fluffy2019!
- (2 pts) J7$kL9mQ2x
- (5 pts) correct-horse-battery-staple (long passphrase)

Passphrases (4+ random words) are longer and more secure than short complex passwords while being easier to remember.

**Q8 (5 points):** Do you use multi-factor authentication (MFA) on your critical accounts?

- (5 pts) Yes, on all critical accounts (email, banking, work), using an authenticator app or hardware key
- (4 pts) Yes, on most critical accounts, using SMS codes
- (2 pts) On some accounts but not consistently
- (0 pts) No, or "What is MFA?"

**Q9 (5 points):** Do you use a password manager?

- (5 pts) Yes, and it generates and stores unique passwords for every account
- (3 pts) Yes, but I don't use it for all accounts
- (1 pt) No, but I have a system (notebook, encrypted file)
- (0 pts) No, I remember my passwords or save them in my browser without a master password

**Q10 (5 points):** How do you handle password sharing for shared accounts (streaming, team accounts)?

- (5 pts) Through a password manager's secure sharing feature
- (3 pts) Share verbally or in person, never in writing
- (1 pt) Send via text or email
- (0 pts) Everyone just knows the password, or it's on a sticky note

### Section 3: Social Engineering Awareness (20 points)

**Q11 (5 points):** Someone calls claiming to be from your IT department and asks for your password to "fix an issue." What do you do?

- (5 pts) Refuse. Legitimate IT never asks for your password. Call IT directly at a known number to verify.
- (2 pts) Give them your password because they seem to know details about your setup.
- (0 pts) Give them your password without questioning it.

**Q12 (5 points):** You find a USB drive in the parking lot with a label that says "Salary Information Q4." What do you do?

- (5 pts) Do NOT plug it in. Turn it in to IT/security. This is a classic social engineering attack.
- (2 pts) Plug it into a non-networked computer to check contents.
- (0 pts) Plug it into your work computer to see what's on it.

**Q13 (5 points):** Someone you don't recognize follows you through a secure door at work without badging in. What do you do?

- (5 pts) Politely ask them to badge in or direct them to reception. ("Sorry, everyone needs to badge in - let me walk you to the front desk.")
- (2 pts) Feel uncomfortable but let them through to avoid confrontation.
- (0 pts) Hold the door open for them without thinking about it.

**Q14 (5 points):** What information should you NOT share on social media?

Score 1 point per correct identification:
- Your full birthday (used in security questions)
- Vacation dates while you are away (signals empty home)
- Pet names, mother's maiden name, first car (common security question answers)
- Work badge or office details (aids impersonation)
- Location check-ins in real-time (reveals current location)

### Section 4: Device and Network Security (15 points)

**Q15 (5 points):** How quickly do you install software and operating system updates?

- (5 pts) Within 24-48 hours of notification (automatic updates enabled)
- (3 pts) Within a week
- (1 pt) When I get around to it (weeks or months)
- (0 pts) I click "Remind me later" indefinitely

**Q16 (5 points):** How do you handle public Wi-Fi (coffee shops, airports)?

- (5 pts) Use a VPN for any sensitive activity, or use cellular data instead
- (3 pts) Avoid banking and sensitive sites on public Wi-Fi
- (1 pt) Use public Wi-Fi for everything but am careful
- (0 pts) Use public Wi-Fi without thinking about security

**Q17 (5 points):** Is your home Wi-Fi router secured?

- (5 pts) Changed default admin password, using WPA3 or WPA2, firmware updated, guest network for IoT devices
- (3 pts) Changed the Wi-Fi password from default, using WPA2
- (1 pt) Still using the default password that came with the router
- (0 pts) Not sure / my router might have no password

### Section 5: Incident Response (15 points)

**Q18 (5 points):** You suspect you clicked on a phishing link 30 minutes ago. What do you do?

- (5 pts) Immediately: disconnect from network, change passwords for any accounts you entered credentials for, report to IT/security, scan for malware
- (3 pts) Change your password and hope for the best
- (1 pt) Delete the email and pretend it didn't happen
- (0 pts) Not sure what to do

**Q19 (5 points):** Do you know how to report a security incident at your organization?

- (5 pts) Yes, I know the exact process, contact, and timeline expectations
- (3 pts) I know who to contact but not the formal process
- (1 pt) I would probably ask a coworker
- (0 pts) No idea

**Q20 (5 points):** You notice a coworker has their password on a sticky note on their monitor. What do you do?

- (5 pts) Have a friendly, private conversation about the risk and suggest a password manager
- (3 pts) Mention it to your manager or IT
- (1 pt) Mind your own business
- (0 pts) Take note of the password (absolutely not)

## Scoring

```
Section                          Your Score    Max
─────────────────────────────────────────────────
Phishing Recognition             [    ]        25
Password Hygiene                 [    ]        25
Social Engineering Awareness     [    ]        20
Device and Network Security      [    ]        15
Incident Response                [    ]        15
─────────────────────────────────────────────────
TOTAL                            [    ]        100
```

| Score | Level | Interpretation |
|-------|-------|---------------|
| 85-100 | Security Aware | Strong habits. Focus on staying current and mentoring others. |
| 65-84 | Mostly Secure | Good foundation with specific gaps. Address weak areas. |
| 45-64 | Needs Improvement | Significant vulnerabilities. Structured learning recommended. |
| 0-44 | At Risk | Immediate action needed. You are likely exposed to common attacks. |

## Improvement Plan by Section

### Phishing (if scored <20)
- Install email security extensions (e.g., KnowBe4 PhishAlarm)
- Practice with simulated phishing (KnowBe4, Proofpoint)
- Rule: Never click links in emails. Navigate to sites directly.
- When in doubt, verify through a separate channel

### Passwords (if scored <20)
- Set up a password manager today (Bitwarden is free, 1Password is excellent)
- Enable MFA on: email, banking, work accounts, social media (in that priority order)
- Change any reused passwords immediately (start with financial and email accounts)
- Use passphrases: 4+ random words for anything you must type manually

### Social Engineering (if scored <15)
- Understand that social engineers exploit helpfulness, authority, and urgency
- Practice saying "Let me verify that" before complying with any unusual request
- Review your social media profiles for exposed personal information
- Remember: legitimate organizations will not mind you verifying their identity

### Device Security (if scored <10)
- Enable automatic updates on all devices
- Set up a VPN for public Wi-Fi use (reputable paid VPN, not free)
- Change your router's default admin password and Wi-Fi password
- Enable full-disk encryption on your laptop

### Incident Response (if scored <10)
- Learn your organization's incident reporting process today
- Save the IT/security contact information in your phone
- Remember the first-response steps: disconnect, report, change passwords
- Practice reporting small things - it builds the habit for big things

## Security Habit Tracker

Track weekly for one month:

```
Week of: ___________

[ ] No passwords reused this week
[ ] MFA used on all critical accounts
[ ] No phishing links clicked
[ ] Software updates installed promptly
[ ] Work discussed only on secure channels
[ ] Physical workspace secured when away (locked screen, documents stored)
[ ] Suspicious emails/calls reported

Security incident this week: ___________
Action taken: ___________
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to cybersecurity awareness test
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Cybersecurity Awareness Test Analysis

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

**Input:** "Help me with cybersecurity awareness test for my current situation"

**Output:**

Based on your situation, here is a structured approach to cybersecurity awareness test:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
