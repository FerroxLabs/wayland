---
name: email-security-hardener
description: |
  Email security expertise covering SPF, DKIM, and DMARC configuration for domain protection, phishing detection techniques, email encryption with PGP and S/MIME, secure email provider evaluation, email header analysis, business email compromise prevention, and building organizational email security policies.
  Use when the user asks about email security hardener, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of email security hardener or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security checklist analysis safety best-practices email fashion"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Email Security Hardener

You are an expert email security specialist who helps individuals and organizations protect their email infrastructure from phishing, spoofing, and interception. You configure DNS-based email authentication, train users to detect social engineering, and implement encryption for sensitive communications.


## When to Use

**Use this skill when:**
- User asks about email security hardener techniques or best practices
- User needs guidance on email security hardener concepts
- User wants to implement or improve their approach to email security hardener

**Do NOT use when:**
- The request falls outside the scope of email security hardener
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Scope:** Personal email security, or organizational/domain-level protection?
2. **Domain ownership:** Do you own a domain and manage its DNS records?
3. **Email provider:** Gmail, Microsoft 365, self-hosted, or other?
4. **Threat level:** General protection, or facing targeted attacks (journalists, activists, executives)?
5. **Compliance needs:** HIPAA, financial regulations, or other requirements for email?
6. **Current setup:** Do you already have SPF/DKIM/DMARC configured?

---

## Email Authentication (SPF/DKIM/DMARC)

### How Email Spoofing Works

```
Without authentication, anyone can send email claiming to be from your domain:

Attacker's server sends:
  From: ceo@yourcompany.com
  To: finance@yourcompany.com
  Subject: Urgent wire transfer needed

Without SPF/DKIM/DMARC, the recipient's server has no way to verify
that this email actually came from yourcompany.com's legitimate servers.

SPF, DKIM, and DMARC work together to prevent this.
```

### SPF (Sender Policy Framework)

```
SPF tells receiving servers which IP addresses are authorized
to send email for your domain.

DNS TXT Record:
  yourcompany.com IN TXT "v=spf1 include:_spf.google.com include:sendgrid.net -all"

Breakdown:
  v=spf1              - SPF version
  include:_spf.google.com  - Google Workspace can send for us
  include:sendgrid.net     - SendGrid can send for us
  -all                 - Reject ALL other senders (hard fail)

Qualifiers:
  +all  - Allow all (defeats the purpose, never use)
  ~all  - Soft fail (mark suspicious but deliver)
  -all  - Hard fail (reject unauthorized senders) -- RECOMMENDED
  ?all  - Neutral (no policy)

Common pitfall: SPF has a 10 DNS lookup limit.
  Each "include" counts as a lookup.
  Nested includes count too.
  Use SPF flattening tools if you exceed 10.
```

### DKIM (DomainKeys Identified Mail)

```
DKIM cryptographically signs outgoing emails. Receiving servers
verify the signature using a public key in your DNS.

DNS TXT Record:
  selector._domainkey.yourcompany.com IN TXT "v=DKIM1; k=rsa; p=MIGfMA0G..."

How it works:
  1. Your mail server signs each email with a private key
  2. Signature is added as a DKIM-Signature header
  3. Receiving server looks up your public key in DNS
  4. Verifies the signature matches the email content
  5. If content was modified in transit, verification fails

Setup (Google Workspace):
  Admin Console > Apps > Google Workspace > Gmail > Authenticate Email
  Generate DKIM key > Add DNS record > Start authentication

Setup (Microsoft 365):
  Microsoft 365 Defender > Email & Collaboration > Policies
  > DKIM > Select domain > Enable
```

### DMARC (Domain-based Message Authentication)

```
DMARC tells receiving servers what to do when SPF or DKIM fails,
and sends you reports about who is sending email as your domain.

DNS TXT Record:
  _dmarc.yourcompany.com IN TXT "v=DMARC1; p=reject; rua=mailto:dmarc@yourcompany.com; pct=100"

Rollout strategy (gradual enforcement):

Phase 1 (Monitor, 2-4 weeks):
  p=none; rua=mailto:dmarc-reports@yourcompany.com
  Collects reports without affecting delivery.
  Review reports to find legitimate senders you missed in SPF.

Phase 2 (Quarantine, 2-4 weeks):
  p=quarantine; pct=25; rua=mailto:...
  Quarantine 25% of failing emails. Monitor for false positives.
  Gradually increase pct to 100.

Phase 3 (Reject):
  p=reject; rua=mailto:...; pct=100
  Reject all emails that fail both SPF and DKIM.
  This is the goal -- full domain spoofing protection.

DMARC report analysis tools:
  - Valimail (free tier available)
  - dmarcian.com
  - Postmark DMARC tool (free)
  - DMARC Analyzer
```

---

## Phishing Detection

### Red Flags Checklist

```
Email Header Analysis:
  [ ] From address domain matches expected sender?
  [ ] Reply-To differs from From? (common in phishing)
  [ ] SPF/DKIM/DMARC pass? (check email headers)
  [ ] Received headers show expected mail servers?

Content Analysis:
  [ ] Urgency or fear language? ("Your account will be suspended")
  [ ] Request for credentials, money, or sensitive data?
  [ ] Generic greeting? ("Dear Customer" vs your name)
  [ ] Grammar/spelling errors? (less reliable -- AI has improved)
  [ ] Links go where they claim? (hover to check URL)
  [ ] Unexpected attachment? (especially .zip, .exe, .docm)

Contextual Analysis:
  [ ] Were you expecting this email?
  [ ] Does the request match normal procedures?
  [ ] If from a colleague, does the tone match their style?
  [ ] Would this person normally make this request via email?
```

### How to Verify Suspicious Emails

```
1. DO NOT click links or open attachments
2. Check the actual sender address (not just display name)
   Display: "IT Support <helpdesk@company.com>"
   Actual:  helpdesk@company-security-check.com  (FAKE)

3. Verify through a separate channel
   - Call the person using a known phone number (not one from the email)
   - Send a new email to their known address (don't reply)
   - Walk to their desk if possible

4. Check links without clicking
   - Hover to see actual URL
   - Use urlscan.io or VirusTotal to check URLs safely
   - Look for misspellings: "paypa1.com" vs "paypal.com"

5. Report to IT/Security team
   - Forward as attachment (preserves headers)
   - Most organizations have a report phishing button
```

---

## Email Encryption

### PGP/GPG Encryption

```
PGP provides end-to-end encryption for email content.

How it works:
  1. You generate a key pair (public + private)
  2. Share your public key with correspondents
  3. They encrypt messages with your public key
  4. Only your private key can decrypt them

Setup (GPG):
  # Generate key pair
  gpg --full-generate-key
  # Choose: RSA and RSA, 4096 bits, does not expire (or set expiry)

  # Export public key to share
  gpg --armor --export your@email.com > public_key.asc

  # Import someone's public key
  gpg --import their_public_key.asc

  # Encrypt a message
  gpg --encrypt --armor --recipient their@email.com message.txt

  # Decrypt a message
  gpg --decrypt encrypted_message.asc

Email clients with PGP support:
  - Thunderbird (built-in OpenPGP)
  - Mailvelope (browser extension for webmail)
  - GPG4Win + Outlook (Windows)
  - GPGTools + Apple Mail (macOS)
```

### Secure Email Provider Comparison

| Provider | Encryption | Jurisdiction | Open Source | Price |
|----------|-----------|-------------|-------------|-------|
| ProtonMail | E2E encrypted at rest | Switzerland | Yes | Free / $4/mo |
| Tutanota | E2E encrypted at rest | Germany | Yes | Free / $3/mo |
| Gmail | TLS in transit, Google scans | USA | No | Free / $6/mo |
| Microsoft 365 | TLS in transit, Microsoft access | USA | No | $6/mo |
| Fastmail | TLS in transit | Australia | Partial | $5/mo |

```
For high-security needs:
  ProtonMail or Tutanota (E2E encryption, privacy-focused jurisdiction)

For most business use:
  Google Workspace or Microsoft 365 with proper SPF/DKIM/DMARC
  Plus organizational policies and user training

For maximum privacy:
  Self-hosted mail server + PGP
  (High maintenance, not recommended for most people)
```

---

## Business Email Compromise (BEC) Prevention

### Common BEC Scenarios

```
1. CEO Fraud
   Attacker impersonates CEO, asks finance to wire funds
   "I need you to handle a confidential acquisition. Wire $50,000 to..."

2. Invoice Fraud
   Attacker compromises vendor email, sends fake invoice with new bank details
   "Our banking information has changed. Please send payment to..."

3. Account Compromise
   Attacker gains access to real employee email, requests payments from contacts
   Uses actual email threads to build credibility

4. Attorney Impersonation
   Attacker impersonates lawyer, creates urgency around legal matter
   "This is time-sensitive and confidential. Please wire..."
```

### Prevention Measures

```
Technical Controls:
  [ ] DMARC at p=reject on all company domains
  [ ] Email display name spoofing detection
  [ ] External email banner ("This email is from outside the organization")
  [ ] Link rewriting and sandboxing (Safe Links)
  [ ] Attachment scanning and detonation (Safe Attachments)

Process Controls:
  [ ] Dual authorization for wire transfers over threshold
  [ ] Verbal confirmation for payment changes via known phone number
  [ ] No financial transactions based solely on email requests
  [ ] Vendor bank change process requires in-person or phone verification

Training Controls:
  [ ] Regular phishing simulations (monthly)
  [ ] BEC-specific awareness training
  [ ] Reward reporting of suspicious emails (not punish clicking)
  [ ] Executive-specific training (they are primary targets)
```

---

## Personal Email Security Checklist

```
Account Security:
  [ ] Strong, unique password (20+ characters, password manager)
  [ ] Two-factor authentication enabled (hardware key preferred)
  [ ] Recovery options up to date (phone, backup email)
  [ ] App passwords revoked for unused applications
  [ ] Recent activity reviewed (check for unauthorized access)
  [ ] Connected apps audited (revoke unnecessary OAuth grants)

Email Hygiene:
  [ ] Separate email for sensitive accounts (banking, medical)
  [ ] Disposable email for signups (SimpleLogin, AnonAddy)
  [ ] Unsubscribe from unnecessary mailing lists
  [ ] Don't use email for sensitive file transfer (use encrypted sharing)

Domain Protection (if you own a domain):
  [ ] SPF record configured with -all
  [ ] DKIM enabled and DNS record published
  [ ] DMARC at p=reject with reporting
  [ ] Unused subdomains have SPF "v=spf1 -all" (prevent spoofing)
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to email security hardener
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Email Security Hardener Analysis

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

**Input:** "Help me with email security hardener for my current situation"

**Output:**

Based on your situation, here is a structured approach to email security hardener:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
