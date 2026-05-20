---
name: two-factor-setup
description: |
  Complete guide for setting up and managing two-factor authentication including TOTP apps, FIDO2/WebAuthn hardware keys, recovery strategies, backup codes, and account protection prioritization.
  Use when the user asks about two factor setup, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of two factor setup or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security checklist template cloud testing planning safety emergency-preparedness"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Two-Factor Authentication Setup

You are an expert in multi-factor authentication who guides users through selecting, configuring, and managing 2FA across all their accounts with robust recovery planning.


## When to Use

**Use this skill when:**
- User asks about two factor setup techniques or best practices
- User needs guidance on two factor setup concepts
- User wants to implement or improve their approach to two factor setup

**Do NOT use when:**
- The request falls outside the scope of two factor setup
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## 2FA Methods Comparison

### Security Hierarchy

```
STRONGEST ──────────────────────────────────── WEAKEST

FIDO2/WebAuthn  >  TOTP App  >  Push Notification  >  SMS/Voice
(Hardware key)     (Authenticator)  (App prompt)        (Text message)

Phishing-resistant:  YES        NO         NO              NO
Requires internet:   NO         NO         YES             YES
SIM-swap proof:      YES        YES        YES             NO
```

### Detailed Comparison

| Method | Security | Convenience | Offline | Phishing Proof | Cost |
|--------|----------|-------------|---------|----------------|------|
| **FIDO2 key** | Excellent | Medium | Yes | Yes | $25-70 |
| **TOTP app** | Strong | Good | Yes | No | Free |
| **Push notification** | Good | Excellent | No | No | Free |
| **SMS code** | Weak | Good | No | No | Free |
| **Email code** | Weak | Fair | No | No | Free |
| **Backup codes** | Strong (one-time) | Fair | Yes | N/A | Free |

## TOTP Authenticator Setup

### Recommended Apps

| App | Platform | Cloud Backup | Export | Open Source |
|-----|----------|-------------|--------|-------------|
| Aegis | Android | Encrypted backup | Yes | Yes |
| Raivo | iOS | iCloud encrypted | Yes | Yes |
| 2FAS | iOS, Android | Cloud + local | Yes | Yes |
| Authy | iOS, Android, Desktop | Encrypted cloud | No | No |
| Google Authenticator | iOS, Android | Google account | Yes | No |
| Microsoft Authenticator | iOS, Android | Cloud backup | No | No |

### Setup Process

```
Step 1: Install authenticator app
  - Download from official app store only
  - Set up app lock (biometric or PIN)
  - Enable encrypted backup if available

Step 2: Enable 2FA on an account
  1. Go to account's Security Settings
  2. Find "Two-Factor Authentication" or "2-Step Verification"
  3. Select "Authenticator App" option
  4. Scan QR code with your authenticator app
  5. Enter the 6-digit code to verify
  6. SAVE the backup/recovery codes immediately

Step 3: Save recovery information
  - Screenshot the QR code (store encrypted, offline)
  - Copy the secret key text (store in password vault)
  - Save backup codes (print or store in vault)
  - Test the code works before closing setup
```

### TOTP Secret Key Backup

```
When setting up TOTP, the service shows a QR code.
That QR code encodes a URI like:

  otpauth://totp/Service:user@email.com?secret=JBSWY3DPEHPK3PXP&issuer=Service

The "secret" value is what generates your codes.

Backup strategy:
1. Save the secret key text in your password vault
   (as a custom field on the login entry)
2. If you lose your phone, you can re-add the TOTP
   to a new device using this secret key
3. Some apps (Aegis, 2FAS) support encrypted export
   of all TOTP entries - do this monthly
```

## FIDO2 / WebAuthn Hardware Keys

### Hardware Key Options

| Key | USB-A | USB-C | NFC | Lightning | Biometric | Price |
|-----|-------|-------|-----|-----------|-----------|-------|
| YubiKey 5 NFC | Yes | No | Yes | No | No | ~$50 |
| YubiKey 5C NFC | No | Yes | Yes | No | No | ~$55 |
| YubiKey 5Ci | No | Yes | No | Yes | No | ~$75 |
| YubiKey Bio | Yes/C | Varies | No | No | Yes | ~$85 |
| Google Titan | Varies | Yes | Yes | No | No | ~$30 |
| Nitrokey FIDO2 | Yes | No | No | No | No | ~$30 |
| SoloKeys | Yes | Yes | No | No | No | ~$25 |

### Setup Checklist

```
Step 1: Buy TWO keys (primary + backup)
  - Different form factors if possible
    (e.g., USB-C primary, USB-A + NFC backup)

Step 2: Register both keys on every account
  1. Go to account Security Settings
  2. Add Security Key (primary)
  3. Touch the key when prompted
  4. Name it: "YubiKey Primary - USB-C"
  5. Add Security Key (backup)
  6. Touch the backup key when prompted
  7. Name it: "YubiKey Backup - USB-A NFC"

Step 3: Store the backup key securely
  - Home safe, safety deposit box, or trusted person
  - NOT in the same bag as your laptop

Step 4: Also keep TOTP as a fallback method
  - In case both keys are unavailable
  - Some services require a backup method anyway
```

### Supported Services

```
High-value accounts that support FIDO2:
├── Google / Gmail
├── Microsoft / Outlook
├── Apple (iCloud) - with passkeys
├── GitHub
├── Facebook
├── Twitter/X
├── Dropbox
├── Cloudflare
├── AWS
├── 1Password
├── Bitwarden
├── Coinbase
├── Stripe
└── Many more (check dongleauth.com for full list)
```

## Account Prioritization

### Enable 2FA in This Order

```
CRITICAL (do these first):
├── 1. Email accounts (recovery path for everything)
├── 2. Password manager
├── 3. Financial accounts (banking, investment)
├── 4. Cloud storage (Google, Apple, Microsoft)
└── 5. Domain registrar (if you own domains)

HIGH PRIORITY:
├── 6. Social media (identity theft vector)
├── 7. Work/employer accounts
├── 8. Developer accounts (GitHub, AWS, npm)
├── 9. Crypto exchanges
└── 10. Phone/carrier account (SIM-swap protection)

MEDIUM PRIORITY:
├── 11. Shopping (Amazon, with saved payment)
├── 12. Streaming services
├── 13. Gaming accounts
└── 14. Forums and communities

For each account:
  [ ] Enable strongest available 2FA method
  [ ] Save backup codes
  [ ] Register backup security key
  [ ] Update password vault entry with 2FA status
```

## Recovery Strategies

### The Recovery Code System

```
When you enable 2FA, most services give you recovery codes.

Storage Strategy (3 locations):
1. Password vault - in a secure note or custom field
2. Printed copy - in a home safe or lockbox
3. Encrypted file - on an encrypted USB drive

Recovery Code Template:
┌────────────────────────────────────────┐
│  Service: Google (user@gmail.com)      │
│  Date: 2025-01-15                      │
│  Codes:                                │
│    xxxx-xxxx-xxxx  [ ] Used            │
│    xxxx-xxxx-xxxx  [ ] Used            │
│    xxxx-xxxx-xxxx  [ ] Used            │
│    xxxx-xxxx-xxxx  [ ] Used            │
│    xxxx-xxxx-xxxx  [ ] Used            │
│    xxxx-xxxx-xxxx  [ ] Used            │
│    xxxx-xxxx-xxxx  [ ] Used            │
│    xxxx-xxxx-xxxx  [ ] Used            │
│  FIDO2 Keys Registered:               │
│    Primary: YubiKey 5C NFC             │
│    Backup: YubiKey 5 NFC              │
│  TOTP App: Aegis (Android)             │
└────────────────────────────────────────┘
```

### Recovery Scenarios

| Scenario | Recovery Path |
|----------|--------------|
| Lost phone (TOTP) | Restore from encrypted app backup; or use backup codes; or use FIDO2 key |
| Lost FIDO2 key | Use backup FIDO2 key; or use TOTP; or use backup codes |
| Lost phone AND keys | Use printed backup codes; then re-enroll new devices |
| New phone | Export TOTP from old phone; or restore from app cloud backup |
| skipped which app | Check password vault notes for which authenticator app |
| Used all backup codes | Generate new codes from account settings immediately |
| Account locked out | Contact service support with identity verification documents |

### Phone Migration Checklist

```
When switching to a new phone:

BEFORE wiping old phone:
  [ ] Export TOTP entries from authenticator app
  [ ] Verify cloud backup of authenticator app is current
  [ ] Test that FIDO2 NFC keys work with new phone
  [ ] Ensure password vault app is on new phone and synced

On new phone:
  [ ] Install authenticator app
  [ ] Restore from encrypted backup OR re-import secrets
  [ ] Test 2FA login on 3 critical accounts
  [ ] Verify all entries are present (compare count)

After verification:
  [ ] Factory reset old phone
  [ ] Remove old phone from trusted devices on key accounts
```

## Passkeys (Modern Authentication)

### What Passkeys Are

```
Passkeys replace passwords entirely:
- Based on FIDO2/WebAuthn standard
- Private key stays on your device, never sent to server
- Phishing-proof by design (tied to specific domain)
- Biometric unlock (fingerprint, face) instead of typing
- Synced across devices via platform (Apple, Google, Microsoft)
  or password manager (1Password, Bitwarden)
```

### Passkey Setup

```
Step 1: Check if your password manager supports passkeys
  - 1Password: Yes (recommended for cross-platform)
  - Bitwarden: Yes
  - Apple Keychain: Yes (Apple devices only)
  - Google Password Manager: Yes (Chrome/Android)

Step 2: Create a passkey on a supported service
  1. Go to account security settings
  2. Find "Passkeys" or "Sign-in methods"
  3. Click "Create passkey"
  4. Choose where to store it (password manager or platform)
  5. Authenticate with biometrics
  6. Passkey is created and stored

Step 3: Keep a backup authentication method
  - Passkeys are still new; keep password + TOTP as backup
  - Register passkeys in your password manager for cross-device access
```

## 2FA Audit Checklist

### Quarterly Review

- [ ] Verify TOTP codes still generate correctly for all accounts
- [ ] Check that FIDO2 keys are physically accounted for
- [ ] Review accounts list - any new critical accounts missing 2FA?
- [ ] Rotate backup codes if any have been used
- [ ] Update authenticator app to latest version
- [ ] Test recovery process on one account
- [ ] Remove 2FA from accounts you no longer use (then delete account)

### Annual Review

- [ ] Full audit of all accounts and their 2FA status
- [ ] Test backup FIDO2 key on 3 critical accounts
- [ ] Refresh printed recovery codes
- [ ] Update emergency access documentation
- [ ] Verify phone migration plan is still current
- [ ] Consider upgrading 2FA method (SMS to TOTP, TOTP to FIDO2)
- [ ] Check for new passkey support on frequently used services

## Common Mistakes to Avoid

1. **SMS-only 2FA on critical accounts** - Vulnerable to SIM-swapping attacks
2. **No backup method configured** - Single point of failure
3. **Recovery codes not saved** - Locked out permanently
4. **TOTP secrets not backed up** - Phone loss = account loss
5. **Only one FIDO2 key registered** - Key loss = account loss
6. **Same authenticator for personal and work** - Separation of concerns
7. **Ignoring phone carrier PIN** - Protect against SIM-swap
8. **Not testing recovery** - Discover problems before an emergency
9. **Leaving old devices as trusted** - Remove when no longer in use
10. **Sharing 2FA codes over text/email** - Defeats the purpose of 2FA


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to two factor setup
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Two Factor Setup Analysis

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

**Input:** "Help me with two factor setup for my current situation"

**Output:**

Based on your situation, here is a structured approach to two factor setup:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
