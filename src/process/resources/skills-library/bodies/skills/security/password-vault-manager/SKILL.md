---
name: password-vault-manager
description: |
  Complete guide for setting up and using password managers including vault setup, migration strategies, password best practices, secure sharing, and emergency access planning.
  Use when the user asks about password vault manager, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of password vault manager or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security budgeting guide quick-reference cloud testing safety emergency-preparedness"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Password Vault Manager

You are an expert in personal password management who guides users through setting up, migrating to, and effectively using password vaults to eliminate password reuse and strengthen account security.


## When to Use

**Use this skill when:**
- User asks about password vault manager techniques or best practices
- User needs guidance on password vault manager concepts
- User wants to implement or improve their approach to password vault manager

**Do NOT use when:**
- The request falls outside the scope of password vault manager
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Password Manager Comparison

### Feature Matrix

| Feature | 1Password | Bitwarden | KeePass | Dashlane |
|---------|-----------|-----------|---------|---------|
| **Open source** | No | Yes (client) | Yes (full) | No |
| **Local vault option** | No | Self-host | Yes (default) | No |
| **Cloud sync** | Yes | Yes | Via plugin | Yes |
| **Browser extension** | All major | All major | Via KeePassXC | All major |
| **Mobile apps** | iOS, Android | iOS, Android | KeePassDX/etc | iOS, Android |
| **Family sharing** | 5 users | 6 users | Manual | 10 users |
| **TOTP built-in** | Yes | Yes (premium) | Via plugin | Yes |
| **Passkey support** | Yes | Yes | No | Yes |
| **CLI access** | Yes (op) | Yes (bw) | No | No |
| **Offline access** | Yes | Yes | Yes | Limited |
| **Audit/reports** | Watchtower | Vault health | No | Dark web scan |
| **Price (personal)** | ~$3/mo | Free / $1/mo | Free | ~$5/mo |

### Choosing the Right Manager

```
Decision framework:
├── Want full control / self-host?
│   ├── Technical user -> KeePass (local) or Vaultwarden (self-hosted Bitwarden)
│   └── Non-technical -> Bitwarden (cloud)
├── Want premium UX + team features?
│   └── 1Password
├── Budget-conscious / free tier?
│   └── Bitwarden (free tier is generous)
└── Family with mixed tech skills?
    └── 1Password or Bitwarden Families
```

## Initial Setup Guide

### Step 1: Create the Master Password

Requirements for a strong master password:

```
Minimum: 16 characters (20+ recommended)
Method:  Passphrase (4-6 random words + separator + number)

GOOD examples:
  "correct-horse-battery-staple-7"
  "maple.thunder.bicycle.quantum.93"
  "river+crystal+harbor+window+45"

BAD examples:
  "Password123!"         (too common)
  "MyDogMax2020"         (personal info)
  "aB3$kL9@mN2"          (hard to remember, still only 12 chars)

Generate with dice:
  1. Roll 5 dice -> look up word in EFF word list
  2. Repeat 5 times for 5 words
  3. Join with separator, add 2-digit number
  4. Practice typing it 20+ times before committing
```

### Step 2: Enable Two-Factor on the Vault

```
Priority order:
1. FIDO2 security key (YubiKey, etc.) - strongest
2. TOTP authenticator app - strong
3. Email verification - acceptable backup only

NEVER use SMS as the only 2FA for your password vault.

Setup:
1. Go to account security settings
2. Add FIDO2 key as primary
3. Add TOTP app as backup
4. Save recovery codes offline (printed, in safe)
5. Test login with each method
```

### Step 3: Configure Vault Settings

```
Recommended settings:
├── Auto-lock: 5 minutes (desktop), 1 minute (mobile)
├── Clipboard clearing: 30 seconds
├── Browser integration: Enable, with vault lock on browser close
├── Autofill: Enable for known sites, confirm on new sites
├── Password generator defaults:
│   ├── Length: 20+ characters
│   ├── Include: uppercase, lowercase, digits, symbols
│   └── Avoid ambiguous: l/1, O/0 (for manual entry cases)
└── Breach monitoring: Enable (Watchtower / Vault Health)
```

## Migration Strategy

### Phase 1: Export from Browser

```
Chrome:
  Settings -> Passwords -> three dots -> Export passwords -> CSV

Firefox:
  Settings -> Passwords -> three dots -> Export Logins -> CSV

Edge:
  Settings -> Passwords -> three dots -> Export passwords -> CSV

Safari:
  System Settings -> Passwords -> Export All Passwords -> CSV

IMPORTANT: Delete the exported CSV immediately after import.
Securely delete: use file shredder or overwrite before deletion.
```

### Phase 2: Import to Vault

```
1Password:
  1password.com -> Import -> Select source -> Upload CSV

Bitwarden:
  vault.bitwarden.com -> Tools -> Import data -> Select format -> Upload

Post-import:
  1. Verify count matches (exported N, imported N)
  2. Spot-check 10 random entries for correctness
  3. Test login to 5 critical accounts
  4. Delete source CSV securely
```

### Phase 3: Strengthen Weak Passwords

```
Priority order for password rotation:
1. Email accounts (recovery for everything else)
2. Financial accounts (banking, investment)
3. Cloud storage (Google Drive, Dropbox, iCloud)
4. Social media with personal data
5. Shopping sites with saved payment methods
6. Everything else

For each account:
  1. Open account in browser
  2. Navigate to password change
  3. Let vault generate new 20+ char password
  4. Save new password in vault
  5. Verify login works with new password
```

### Phase 4: Disable Browser Password Saving

```
Chrome:
  Settings -> Passwords -> turn off "Offer to save passwords"
  Settings -> Passwords -> turn off "Auto Sign-in"

Firefox:
  Settings -> Privacy & Security -> Logins and Passwords
  -> Uncheck "Ask to save logins and passwords"

Edge:
  Settings -> Passwords -> turn off "Offer to save passwords"

Safari:
  System Settings -> Passwords -> Password Options
  -> turn off "AutoFill Passwords"
```

## Vault Organization

### Recommended Structure

```
Vaults / Folders:
├── Personal
│   ├── Email
│   ├── Social Media
│   ├── Shopping
│   ├── Entertainment (streaming, gaming)
│   └── Government / Healthcare
├── Financial
│   ├── Banking
│   ├── Investment
│   ├── Insurance
│   └── Crypto (if applicable)
├── Work
│   ├── Company accounts
│   ├── SaaS tools
│   └── Development
├── Shared (family)
│   ├── Streaming services
│   ├── Home utilities
│   └── Family subscriptions
└── Secure Notes
    ├── Recovery codes
    ├── Wi-Fi passwords
    ├── Software licenses
    └── Important documents
```

### Item Naming Convention

```
Consistent naming makes search easy:

Format: [Service] - [Account identifier]

Examples:
  "Gmail - personal@gmail.com"
  "Chase - checking *1234"
  "AWS - company-prod"
  "Netflix - family plan"

Add tags for cross-cutting organization:
  #2fa-enabled  #needs-password-change  #shared  #work
```

## Secure Sharing

### Safe Sharing Practices

| Method | Use Case | Security Level |
|--------|----------|---------------|
| Vault sharing (family/team) | Ongoing shared access | High - encrypted, revocable |
| One-time share link | Temporary credential sharing | High - time-limited, single-use |
| Secure note in vault | Share recovery codes with spouse | High - encrypted at rest |
| Verbal (phone call) | One-time emergency access | Medium - no digital trail |
| Encrypted message (Signal) | Ad-hoc sharing | Medium - encrypted in transit |
| Email / SMS | **Never for passwords** | **Not acceptable** |
| Sticky note | **Never** | **Not acceptable** |

### Setting Up Family Sharing

```
1Password Families / Bitwarden Families:

Step 1: Create family organization
Step 2: Invite family members via email
Step 3: Create shared vaults:
  - "Shared - Streaming" (Netflix, Spotify, etc.)
  - "Shared - Home" (Wi-Fi, utilities, alarm code)
  - "Shared - Travel" (airline loyalty, hotels)
Step 4: Move relevant items to shared vaults
Step 5: Each family member keeps personal items in private vault
```

## Emergency Access

### Emergency Kit Setup

```
Create and store securely (fireproof safe, safety deposit box):

Emergency Kit Contents:
├── Master password (written, sealed envelope)
├── Recovery codes for the vault itself
├── Email account recovery codes
├── FIDO2 backup key location
├── Instructions for accessing vault
├── List of critical accounts (not passwords)
├── Trusted contact information
└── Legal document: digital estate authorization

DO NOT store digitally.
DO NOT email to yourself.
Review and update annually.
```

### Emergency Access Feature (Bitwarden)

```
Setup:
1. Settings -> Emergency Access
2. Add trusted contact (they need a Bitwarden account)
3. Choose access type:
   - View: Can see vault items (recommended for spouse)
   - Takeover: Can reset master password (full control)
4. Set wait time: 3-7 days (time for you to deny if mistaken)
5. Contact submits request -> you get notified -> auto-grants after wait time

Test annually:
1. Have trusted contact initiate emergency access
2. Verify you receive the notification
3. Deny the request (it was a test)
4. Confirm the flow works correctly
```

## Ongoing Maintenance

### Monthly Review

- [ ] Check breach monitoring alerts (Watchtower / Vault Health)
- [ ] Update any flagged weak or reused passwords
- [ ] Remove entries for deleted accounts
- [ ] Verify 2FA is enabled on all critical accounts

### Annual Review

- [ ] Rotate master password
- [ ] Review and update emergency kit
- [ ] Remove access for ex-employees, ex-partners
- [ ] Audit shared vault membership
- [ ] Export backup of vault (encrypted)
- [ ] Test recovery process with emergency kit
- [ ] Review and delete unused accounts (reduce attack surface)

## Password Policy Quick Reference

| Account Type | Min Length | Unique? | 2FA Required? | Rotation |
|---|---|---|---|---|
| Password vault | 20+ chars (passphrase) | Yes | Yes (FIDO2) | Annual |
| Email | 20+ chars | Yes | Yes | Annual |
| Financial | 20+ chars | Yes | Yes | Annual |
| Work SSO | Per policy | Yes | Yes | Per policy |
| Social media | 16+ chars | Yes | Yes | When breached |
| Shopping | 16+ chars | Yes | Recommended | When breached |
| Low-value accounts | 16+ chars | Yes | Optional | When breached |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| skipped master password | Use recovery codes or emergency access |
| Autofill not working | Check browser extension is unlocked; verify URL match |
| Duplicate entries | Use vault deduplication tool; merge manually |
| Sync not updating | Force sync; check internet; re-authenticate |
| Lost FIDO2 key | Use backup TOTP or recovery codes |
| Account locked out | Contact service support with identity verification |
| Vault corrupted | Restore from last backup export |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to password vault manager
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Password Vault Manager Analysis

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

**Input:** "Help me with password vault manager for my current situation"

**Output:**

Based on your situation, here is a structured approach to password vault manager:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
