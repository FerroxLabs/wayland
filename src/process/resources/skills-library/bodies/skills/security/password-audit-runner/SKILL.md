---
name: password-audit-runner
description: |
  Systematic process to audit, identify weak passwords, check for breaches, update credentials, and establish a secure password management workflow.
  Use when the user asks about password audit runner, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of password audit runner or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart security checklist cloud testing email"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Password Audit Runner

## When to Use

**Use this skill when:**
- A user wants to systematically audit all their passwords across personal or professional accounts and needs a structured methodology to follow from start to finish
- A user has just learned their email appeared in a data breach notification and needs to know exactly which accounts to prioritize, in what order, and how to remediate the exposure
- A user is setting up a password manager for the first time and needs to migrate credentials, establish a master password, configure 2FA, and create a secure ongoing maintenance routine
- A user is responsible for their organization's credential hygiene and needs to define a repeatable audit process -- covering account inventory, weakness scoring, breach correlation, and remediation tracking
- A user is conducting a security self-assessment before a major life event (job change, divorce, business sale, account consolidation) and needs to identify credential exposure risks
- A user is recovering from an account takeover, phishing incident, or credential stuffing attack and needs a systematic cleanup protocol rather than ad-hoc patching
- A user wants to evaluate the security posture of a shared household's digital accounts (family members, roommates) and establish shared standards without paranoia

**Do NOT use when:**
- The user is asking about enterprise identity and access management (IAM), Active Directory, LDAP, SSO federation, or privileged access management -- those require a dedicated IAM audit skill
- The user needs a penetration testing or red team methodology to actively crack or enumerate passwords in a controlled environment -- that is a separate offensive security skill
- The user is asking about API key rotation, service account credential management, or secrets management in CI/CD pipelines -- use a secrets management skill instead
- The user wants password policy configuration for a web application they are building (bcrypt cost factors, Argon2 tuning, salting strategies) -- use a credential storage security skill
- The user is asking about biometric authentication design, passkey (FIDO2/WebAuthn) implementation architecture, or hardware security key programming
- The user needs forensic investigation of a corporate breach involving credential theft at scale -- escalate to an incident response skill
- The user is a minor and the question involves circumventing parental controls or accessing accounts they are not authorized to use

---

## Process

### Step 1: Establish Audit Scope and Triage Level

Before touching any passwords, define the boundaries of the audit. The scope determines the order of operations and the tools involved.

- Ask the user: personal accounts only, mixed personal/work, or full household sweep? Each has different risk profiles and different remediation timelines.
- Classify the audit as one of three triage levels:
  - **Level 1 -- Reactive Breach Response:** A specific account or email is known to be compromised. Immediate remediation within 2 hours.
  - **Level 2 -- Targeted Hygiene Sweep:** No known breach, but the user suspects weak or reused passwords and wants a structured cleanup. Timeline: 1-3 days.
  - **Level 3 -- Full Credential Inventory Audit:** Comprehensive sweep of all accounts, password manager migration, 2FA setup, and ongoing maintenance protocol. Timeline: 1-2 weeks.
- Identify whether the user has an existing password manager. If yes, most managers (Bitwarden, 1Password, Dashlane) provide a built-in security audit dashboard -- use that as the primary scan tool rather than manual review.
- If no password manager exists, the first priority is establishing one before the audit proceeds, because otherwise updated passwords cannot be stored securely.
- Determine if the user has admin/recovery access to all accounts being audited. If locked out of any account, that account requires separate account recovery steps before it can be audited.

### Step 2: Run the Breach Exposure Check

This step uses external breach intelligence to identify already-compromised credentials. It costs nothing and takes under 10 minutes.

- Check all email addresses the user uses for account registration against the Have I Been Pwned (HIBP) database. The HIBP API uses k-anonymity: only the first 5 characters of a SHA-1 hash of the email are transmitted -- the full address is never sent to the server.
- For each breach returned, note: breach date, breach name, data types exposed (passwords, email addresses, phone numbers, physical addresses, financial data), and whether the breach has been verified.
- Treat "unverified" breaches with skepticism but not dismissal -- some legitimate breaches are labeled unverified because the source cannot be confirmed, not because the data is fake.
- If the user's password manager supports it (Bitwarden's "Data Breach Reports," 1Password's "Watchtower"), run the in-app breach check against stored credentials. These tools check stored usernames and URLs against breach databases without transmitting the raw passwords.
- For users without a manager: manually check high-priority account passwords against HIBP's Password Checker (hibp-passwordcheck endpoint). This uses k-anonymity for passwords too -- only the first 5 hex characters of the SHA-1 hash of the password are sent.
- Log every breach match in the audit tracking table (see Output Format below). Each entry needs: account name, email used, breach source, breach date, whether password reuse is suspected, and remediation status.
- If a breached password was reused across multiple accounts, tag ALL of those accounts as "Critical -- Reused Breach Password" even if they do not appear in the breach data themselves.

### Step 3: Complete the Account Inventory

A breach check only covers known compromises. The inventory catches structural weaknesses.

- Build the account inventory by working through categories systematically. Prompt the user to check: browser saved passwords (Chrome, Firefox, Safari, Edge all have exportable credential lists), email inboxes for account confirmation emails (search "welcome to" or "verify your account"), and phone app lists.
- For each account, assess four attributes:
  - **Password Age:** Over 12 months old = flag for review. Over 24 months = mandatory update regardless of breach status.
  - **Password Reuse:** If the same password or a minor variant (e.g., `Summer2022!` vs `Summer2023!`) appears on more than one account, flag both as Critical.
  - **Password Entropy:** A rough assessment without seeing the actual password. Ask the user: length (under 12 = Weak, 12-15 = Fair, 16+ = Good), character set (all lowercase = Weak, mixed case + numbers = Fair, mixed case + numbers + symbols = Good), pattern-based (dictionary word + number = Weak regardless of length).
  - **2FA Status:** None = flag regardless of password strength. SMS-only = flag as partial. App-based TOTP or hardware key = adequate.
- Classify each account by risk tier:
  - **Tier 1 -- Critical:** Email accounts (especially the primary recovery email), financial accounts (banks, brokerage, crypto), password manager, cloud storage with sensitive documents, work SSO/email
  - **Tier 2 -- High:** Social media, e-commerce with stored payment methods, healthcare portals, government/tax portals, telecom/phone carrier account
  - **Tier 3 -- Medium:** Streaming services, gaming accounts, loyalty programs with stored value
  - **Tier 4 -- Low:** Accounts with no payment method and no sensitive data (comment accounts, newsletter signups, forums)
- Do not let the user skip Tier 1 accounts to do Tier 3 first. The audit must follow the tier order.

### Step 4: Establish or Harden the Password Manager

The password manager is the infrastructure that makes the rest of the audit sustainable. Set this up before updating any passwords.

- If the user does not have a password manager, recommend based on their situation:
  - **Bitwarden** for individuals and households who want a free, open-source, audited solution with cross-platform sync. The free tier is genuinely sufficient for personal use. Self-hosting is available for technically advanced users.
  - **1Password** for users who want a polished interface, travel mode (temporarily removes sensitive vaults at border crossings), and strong family sharing. Costs $3/month individual, $5/month for families of 5.
  - **KeePassXC** for users who want zero cloud dependency, full offline operation, and maximum control. Requires manual sync (USB drive, Syncthing, or self-hosted cloud storage). No cost.
  - **Dashlane** is adequate but expensive; do not recommend unless the user already pays for it.
  - Avoid browser-native password managers (Chrome Passwords, iCloud Keychain alone) as the primary manager -- they lack cross-browser portability, emergency access features, and detailed audit capabilities.
- Master password requirements are non-negotiable: minimum 20 characters, passphrase of 5+ unrelated random words preferred (example structure: `violet-hammer-notebook-seven-cactus`), never reused anywhere, not based on biographical information, memorized not written on paper.
- Immediately after creating the master password: configure the emergency kit (1Password) or export the emergency sheet (Bitwarden) and store it in a physically secure location (safe, safety deposit box) -- not in a digital file.
- Enable 2FA on the password manager itself using an authenticator app, not SMS. Store the 2FA backup codes in the emergency kit, not in the password manager (obvious circular dependency problem).
- If migrating from a browser: export credentials from Chrome via `Settings > Autofill > Password Manager > Export`, from Firefox via `Settings > Privacy & Security > Logins and Passwords > Export Logins`. Import the CSV into the password manager, then immediately delete the exported CSV file -- it contains plaintext credentials.

### Step 5: Execute the Remediation Queue

With the inventory complete and the password manager ready, systematically update credentials in priority order.

- Work through Tier 1 accounts first without exception. For each account:
  1. Log into the account using the existing (potentially compromised) credential
  2. Navigate to security or account settings
  3. Generate a new password using the password manager's built-in generator: 20 characters minimum, all character classes enabled (uppercase, lowercase, numbers, symbols), no ambiguous characters optional but not required
  4. Save the new password to the manager BEFORE clicking save on the account -- prevents lockout if the update fails mid-session
  5. Update the password on the account and confirm the change
  6. Enable or verify 2FA using an authenticator app (Google Authenticator, Authy, or the authenticator built into some password managers)
  7. Save 2FA backup codes to the password manager as a secure note
  8. Log out of all other active sessions if the account supports it (this is the "Sign out of all devices" option available in Gmail, Apple ID, Facebook, etc.)
- For accounts with password reuse: update ALL instances of the reused password, not just the breached one. A single remaining reuse point is a live vulnerability.
- For accounts with "Forgot Password" style recovery: update the recovery email and phone number to ensure they are current and under the user's control.
- Do not change more than 10-15 accounts per session. Cognitive load and session fatigue lead to mistakes (mistyped passwords saved, 2FA skipped, browser cache of old passwords not cleared).

### Step 6: Verify, Test, and Document Remediation

Changed passwords and enabled 2FA must be verified -- not assumed to be working.

- For each updated account: log out completely, then log back in using ONLY the password manager to retrieve the credential. If the password manager does not autofill successfully, the credential was not saved correctly.
- Verify 2FA by completing a full login cycle including the authenticator code. Do not skip this -- a misconfigured 2FA setup can cause lockout.
- Check that backup codes for each 2FA-enabled account are saved as secure notes in the password manager, labeled clearly with the account name.
- Run the password manager's built-in security audit/health report after completing the remediation. Bitwarden's report checks for: reused passwords, weak passwords, unsecured (HTTP) websites, inactive 2FA on supported sites, and exposed passwords. 1Password Watchtower does the same plus checks for compromised websites. Confirm zero remaining Critical or High findings.
- Update the audit tracking table (see Output Format) with final remediation status for each account.
- For accounts that could not be remediated in this session (forgot username, account recovery required, shared credentials that need coordination), document them explicitly with a follow-up date.

### Step 7: Establish the Ongoing Maintenance Cadence

A one-time audit decays within months. Embed a recurring process.

- Set a **quarterly check** calendar reminder (15 minutes per session) covering: re-run HIBP check on all registered emails, review password manager security report, update any newly flagged weak or reused passwords, remove access for authorized apps or OAuth connections no longer needed, verify recovery contacts are current.
- Set an **annual deep audit** calendar reminder (2-3 hours) covering: full account inventory refresh (new accounts added, old accounts to delete), 2FA method review (upgrade SMS to TOTP where now available), password manager master password review (change only if there is reason to suspect exposure), review of emergency kit/access (is the physical backup still secure and accessible?).
- For account deletion: use justdeleteme.com classification guidance -- accounts rated "Easy" to delete should be deleted rather than abandoned. For accounts rated "Hard" or "Impossible," change the password to a long random string and remove all personal data where possible, then abandon the account.
- Establish a breach notification monitoring system. HIBP offers a free notification service -- register all email addresses. Have I Been Pwned will send an email the moment a new breach is published that includes the registered address.
- For household audits: define who is responsible for each account category. Avoid shared master passwords -- each household member should have their own password manager account, using a family sharing plan to share truly joint credentials (joint bank accounts, streaming services) as shared vault items.

### Step 8: Address Specific High-Risk Scenarios

Some accounts require extra steps beyond the standard remediation workflow.

- **Email accounts (Tier 1 critical path):** After updating the password and enabling 2FA, immediately check: forwarding rules (attackers often add forwarding rules to silently copy mail), delegated access, filters that auto-delete security alerts, connected apps with full email access. Remove anything unrecognized.
- **Financial accounts:** After password update, call the bank or financial institution's fraud line to flag potential compromise if there was a known breach. Review transaction history for the past 90 days. Set up transaction alerts for all amounts. For investment accounts, review beneficiary designations and recent login history.
- **Phone carrier account:** Update credentials and enable a carrier-level PIN or passcode (separate from the account password) to prevent SIM-swapping attacks. AT&T, Verizon, and T-Mobile all support a 6-15 digit SIM transfer PIN. This is the most overlooked step in most password audits.
- **Recovery email address:** Audit which accounts list a specific email as a recovery address. If that recovery email is weak or compromised, every account using it for recovery is also compromised. The primary recovery email must be the most hardened account in the entire ecosystem.
- **Accounts using "Sign in with Google/Facebook":** Review OAuth connected apps in Google Account settings (myaccount.google.com > Security > Third-party apps with account access) and Facebook settings (Settings > Security and Login > Apps and Websites). Revoke access for any app not actively used.

---

## Output Format

Deliver audit results using this structured tracking format. Populate each section as the audit progresses.

```
## PASSWORD AUDIT REPORT
Generated: [Date]
Audit Level: [Level 1 Reactive / Level 2 Targeted / Level 3 Full Inventory]
User Context: [Personal / Work / Household]

---

### BREACH EXPOSURE SUMMARY

Emails Checked: [List]
Total Breaches Found: [N]

| Email Address       | Breach Name            | Breach Date | Data Exposed                        | Password Reuse Risk | Status        |
|---------------------|------------------------|-------------|-------------------------------------|---------------------|---------------|
| user@email.com      | LinkedInBreach2012     | 2012-05     | Emails, passwords (SHA1)            | HIGH -- reused      | REMEDIATED    |
| user@email.com      | AdobeBreach2013        | 2013-10     | Emails, passwords (3DES), hints     | LOW                 | REMEDIATED    |
| work@company.com    | RockYou2024            | 2024-06     | Passwords                           | UNKNOWN             | IN PROGRESS   |

---

### ACCOUNT INVENTORY

| Account Name        | Tier     | Email Used          | Password Age  | Reuse Flag | Entropy  | 2FA Status     | Breach Match | Priority     |
|---------------------|----------|---------------------|---------------|------------|----------|----------------|--------------|--------------|
| Gmail (primary)     | Tier 1   | user@gmail.com      | 18 months     | YES        | Weak     | None           | YES          | CRITICAL     |
| Chase Bank          | Tier 1   | user@gmail.com      | 36 months     | NO         | Fair     | SMS only       | NO           | HIGH         |
| Work Microsoft 365  | Tier 1   | user@company.com    | 8 months      | NO         | Good     | TOTP app       | NO           | Monitor      |
| Amazon              | Tier 2   | user@gmail.com      | 24 months     | YES        | Weak     | None           | YES          | HIGH         |
| Netflix             | Tier 3   | user@gmail.com      | 12 months     | NO         | Fair     | N/A            | NO           | Low          |
| OldForum (unused)   | Tier 4   | olduser@email.com   | 72 months     | UNKNOWN    | Unknown  | None           | YES          | DELETE       |

---

### CRITICAL FINDINGS

[N] accounts have CRITICAL status requiring immediate action:

1. [Account Name] -- Reason: [Breached credential confirmed + password reused on 3 other accounts]
   Action Required: Change password, enable TOTP 2FA, log out all sessions, audit activity log
   Deadline: Within 2 hours

2. [Account Name] -- Reason: [Primary recovery email with 48-month-old password, no 2FA]
   Action Required: Change password to 20+ char passphrase, enable hardware key or TOTP 2FA
   Deadline: Within 2 hours

---

### REMEDIATION QUEUE

Sorted by priority tier. Complete in order.

| Priority | Account Name     | Action Required                                              | Owner      | Target Date | Status      |
|----------|------------------|--------------------------------------------------------------|------------|-------------|-------------|
| 1        | Gmail (primary)  | New 20-char password, enable TOTP, audit forwarding rules    | User       | TODAY       | IN PROGRESS |
| 2        | Chase Bank       | New 20-char password, upgrade SMS 2FA to TOTP               | User       | TODAY       | PENDING     |
| 3        | Amazon           | New 20-char password, enable TOTP, remove stored payment     | User       | TODAY       | PENDING     |
| 4        | All reuse sites  | New unique password on each (list below)                     | User       | 48 hours    | PENDING     |
| 5        | OldForum         | Delete account or randomize + abandon                        | User       | This week   | PENDING     |

---

### PASSWORD MANAGER STATUS

Manager Selected: [Bitwarden / 1Password / KeePassXC / None]
Master Password: [SET -- passphrase confirmed / NOT SET]
2FA on Manager: [Enabled -- TOTP / SMS / None]
Emergency Kit: [Stored securely / NOT COMPLETED]
Credentials Imported: [N accounts]
Security Report Score: [N% healthy / N reused / N weak / N breached]

---

### 2FA STATUS SUMMARY

| Account         | Current 2FA    | Target 2FA   | Status      |
|-----------------|----------------|--------------|-------------|
| Gmail           | None           | TOTP app     | PENDING     |
| Chase Bank      | SMS            | TOTP app     | PENDING     |
| Password Mgr    | None           | TOTP app     | CRITICAL    |
| Work M365       | TOTP app       | TOTP app     | COMPLETE    |

---

### CARRIER SIM-SWAP PROTECTION

Carrier PIN / Port Freeze Configured: [YES / NO / UNKNOWN]
Carrier Name: [Name]
Action Required: [Call carrier to set 6-15 digit transfer PIN if not done]

---

### MAINTENANCE SCHEDULE

Quarterly Check: [Next date]
Annual Deep Audit: [Next date]
HIBP Monitoring: [Active on: email list]

---

### OUTSTANDING ITEMS

Items not completed in this audit session requiring follow-up:

| Account         | Blocker                          | Follow-up Date |
|-----------------|----------------------------------|----------------|
| [Account name]  | [Recovery email access needed]   | [Date]         |
```

---

## Rules

1. **Never audit in the reverse priority order.** Email accounts must be hardened first because they are the master recovery key for every other account. Hardening a bank account while the recovery email remains compromised is security theater -- the attacker can trigger "Forgot Password" on the bank account and intercept the reset link.

2. **Never rely on a single breach check source.** HIBP covers billions of records but not every breach. Supplement with the password manager's in-app breach intelligence (1Password Watchtower, Bitwarden Breach Reports) and review whether any accounts have sent security alert emails the user may have ignored.

3. **Never dismiss "old" breaches as irrelevant.** A credential from the 2012 LinkedIn breach or the 2013 Adobe breach remains dangerous if the password has not been changed since then. Password age relative to breach date is what matters, not breach age alone.

4. **Never change passwords without saving to the manager first.** The correct sequence is: generate new password in manager, save it, then paste it into the account's change-password form. Doing it in reverse order (change on site first, then save to manager) creates a window where the password exists only in the browser session and can be lost if the session crashes.

5. **Never use SMS as the only 2FA method on Tier 1 accounts.** SIM-swapping attacks have successfully bypassed SMS 2FA to compromise bank accounts, email accounts, and crypto wallets. For Tier 1 accounts, the minimum acceptable 2FA method is a TOTP authenticator app. For the highest-value accounts (primary email, password manager, financial), a hardware security key (YubiKey 5 series, Google Titan) is strongly preferred.

6. **Never store backup codes inside the account they protect.** Storing Gmail backup codes in Gmail is circular -- if the account is compromised, the attacker has the backup codes too. Backup codes go into the password manager as a secure note, AND a physical copy goes into the emergency kit.

7. **Never export credential CSVs without immediate secure deletion.** Browser password exports create a plaintext file of every stored credential. That file must be imported into the password manager and then securely deleted (not just moved to trash -- use secure erase or overwrite-on-delete). On macOS, use `rm -P filename.csv` in Terminal. On Windows, use Eraser or SDelete from Sysinternals.

8. **Never treat "I have unique passwords" as sufficient without 2FA.** A unique 20-character password on a site that suffered a plaintext credential dump is still fully compromised. Password uniqueness prevents lateral movement but does not protect the original account. 2FA provides the second layer of defense that limits the damage of a direct credential compromise.

9. **Never skip the session revocation step on compromised accounts.** After changing a password on a breached account, revoke all active sessions. Most major services (Google, Apple, Facebook, Microsoft) offer a "Sign out of all other sessions" option in security settings. Without this step, an attacker with an active session cookie does not need the new password -- the session token remains valid.

10. **Never audit credentials over public Wi-Fi without a VPN.** Performing an audit requires logging into multiple accounts and potentially viewing saved passwords. On untrusted networks, this activity is observable at the network layer. Use a trusted network or a VPN with a no-log policy. WireGuard-based VPNs (Mullvad, ProtonVPN) offer the best combination of speed and trustworthiness.

---

## Edge Cases

### The User Has No Idea What Accounts They Have

Many users have hundreds of accounts accumulated over a decade, with no inventory. Do not attempt to build a comprehensive list from memory -- it will be incomplete.

- Instruct the user to search their primary inbox for: "welcome to", "verify your email", "activate your account", "your account has been created", "thanks for registering". This approach typically surfaces 80-90% of registered accounts.
- Cross-reference with the browser's saved passwords export, which may include accounts not in the inbox (accounts created with a secondary email or via social login).
- Review the phone's installed apps -- most apps have corresponding accounts.
- Check the "Sign in with Google" and "Sign in with Apple" connected apps lists, as social-login accounts may have no password at all and rely entirely on the identity provider's security.
- Triage the discovered list immediately: accounts with no sensitive data and no stored payment method can be categorized Tier 4 and handled last or skipped.

### The User Is Locked Out of the Account Being Audited

A user attempting an audit may discover they can no longer access an account -- either because it was already compromised, because they forgot the password, or because the recovery email address no longer exists.

- For locked accounts where the user is the legitimate owner: walk through the standard account recovery flow for that service before attempting the audit. Do not attempt to audit an account the user cannot currently access.
- If the recovery email for a locked account no longer exists (e.g., an old employer email after leaving the company): most services accept government ID verification as a fallback. Google, Apple, and Microsoft all have identity-based recovery processes.
- If recovery is impossible and the account contains no critical data: write off the account as unrecoverable in the audit log, change the associated email address everywhere else to prevent confusion, and monitor for any activity from that account.
- If recovery is impossible and the account IS critical (contains financial history, is the recovery address for other accounts): treat this as a Priority 0 item and escalate to the service's support team directly before proceeding with the rest of the audit.

### The User Has Shared Credentials with Other People

Households, couples, and small businesses often share passwords for joint services. Standard individual-focused remediation cannot be applied unilaterally.

- For joint accounts (shared bank, shared streaming, shared utility portal): both parties must be involved in the password change. Do not update a shared credential without coordinating -- you will lock the other party out.
- The correct long-term solution for shared credentials is a password manager with a shared vault (1Password Families/Teams, Bitwarden Organizations). Both parties access the shared item through their individual accounts.
- For business accounts where multiple employees share a single credential: escalate to recommending a proper SSO solution (Okta, Azure AD, Google Workspace). Shared credentials at the business level are a governance problem, not just a password hygiene problem, and cannot be sustainably managed with a personal password manager.
- For temporarily shared credentials (e.g., a contractor who needed access): treat the shared period as a full credential compromise. Change the password as soon as access is no longer needed.

### The User Has Used a Password Manager That Is Now Unavailable or Breached

LastPass suffered significant breaches in 2022 in which encrypted vault data was exfiltrated. Users of breached password managers face a unique situation.

- If the password manager itself was breached and vault data was potentially exfiltrated: treat ALL stored credentials as potentially compromised, regardless of individual breach status. The audit becomes a Level 1 Reactive response at scale.
- The triage priority remains the same (Tier 1 first), but the urgency is elevated -- complete Tier 1 remediation within 24 hours if vault data was known to be stolen.
- Migrate to a new password manager before updating credentials so that new passwords are stored securely from the start.
- Evaluate the vault encryption that was used. Vaults encrypted with PBKDF2-SHA256 at low iteration counts (LastPass historically used 5,000 iterations client-side prior to 2023, compared to the OWASP-recommended 600,000) are at significantly higher risk of offline brute-force attack against the master password.
- If the compromised manager had weak master password encryption: the master password itself may be crackable. Change all credentials even on accounts that have not appeared in any breach.

### The User Cannot Enable TOTP 2FA Because the Site Only Offers SMS

SMS 2FA is better than no 2FA but is vulnerable to SIM-swapping. When a site does not offer TOTP:

- Check whether the site offers any alternative: some sites accept hardware security keys (WebAuthn/FIDO2), email-based 2FA, or push notification apps (Duo, Okta Verify) even if TOTP is not listed.
- Enable carrier-level SIM lock (discussed in Step 8) to significantly raise the bar for SIM-swapping attacks, partially mitigating the SMS 2FA weakness.
- Prioritize ensuring the phone number associated with SMS 2FA is the user's current, active number -- not an old number that could be recycled and assigned to someone else.
- Log the account as "2FA: SMS -- SIM-swap risk noted" in the audit table. This is a known limitation, not an acceptable final state. Re-check annually whether TOTP has been added as an option.

### The User Is Auditing Accounts After a Relationship Ended (Divorce, Separation, End of Business Partnership)

This scenario involves accounts that may have been set up jointly or where a former partner had access.

- Treat every account the former partner had knowledge of as fully compromised. This includes accounts where they knew the password, accounts registered to a shared email address, and accounts they may have accessed.
- Check for authorized sessions, active delegates, or forwarding rules the former partner may have set up.
- Change the recovery phone number and email address on all accounts, not just the password. Recovery contacts that remain under a former partner's control allow account takeover even after password changes.
- For accounts that were genuinely joint (joint bank accounts, shared leases, shared subscriptions): coordinate through legal channels if necessary. Do not unilaterally lock a legitimate co-owner out of a joint financial account -- that has legal consequences separate from security.
- For accounts with billing tied to a shared payment method: update payment information first, because the former partner may retain the ability to cancel a subscription or trigger chargebacks.

### The User Is Auditing a Recently Deceased Person's Accounts (Digital Estate)

This is a sensitive and legally complex scenario.

- The audit goal shifts from security hardening to account closure and data preservation, not credential reuse or access recovery for ongoing use.
- Most major services (Google Inactive Account Manager, Apple Digital Legacy, Facebook Memorialization/Removal) have formal processes for next-of-kin access or account removal. Use these official channels -- do not attempt to access accounts using the deceased's credentials without legal authorization.
- For financial accounts: do not change passwords. Contact the financial institution's estate management department directly with the death certificate and legal documentation. Unauthorized access to a financial account, even of a deceased person, can constitute unauthorized computer access under the Computer Fraud and Abuse Act (CFAA).
- Document which accounts exist and which have been formally closed or memorialized, for estate administration purposes.

---

## Example

**Input from user:** "I got an email from my bank saying my email address was found in a recent data breach. I think I use the same password for my email and my bank account. I don't have a password manager and I'm not sure where to start."

---

**Output:**

## PASSWORD AUDIT REPORT
Generated: [Today's Date]
Audit Level: Level 1 -- Reactive Breach Response (escalating to Level 2 once immediate threat contained)
User Context: Personal

---

### SITUATION ASSESSMENT

You have a confirmed breach exposure with a high-severity configuration: password reuse between your email account and your bank account. This is the highest-risk scenario in credential security because:

1. If the attacker already has your email password, they may have accessed your email account and set up forwarding rules to silently monitor incoming messages -- including bank alerts and future password reset emails.
2. If your bank uses your email for password resets, the attacker can trigger "Forgot Password" on your bank account at any time and intercept the reset link.
3. The breach notification itself may have been emailed to the compromised inbox, meaning the attacker knows you've been alerted.

This is a 2-hour response situation. We will address it in priority order.

---

### BREACH EXPOSURE SUMMARY

| Email Address        | Breach Source     | Breach Date | Data Exposed               | Password Reuse Risk | Status     |
|----------------------|-------------------|-------------|----------------------------|---------------------|------------|
| yourname@gmail.com   | [Breach from bank notification] | Recent | Email, likely hashed password | CRITICAL -- reused on bank | PENDING |

**Next action:** Go to haveibeenpwned.com now and type your email address. Screenshot or copy the full list of all breaches shown. You may find additional breaches you were not notified about.

---

### IMMEDIATE REMEDIATION QUEUE (Complete in this exact order)

**Step 1 -- Secure your email account (do this RIGHT NOW, before anything else)**

Your email is the master key. If an attacker controls your email, they control every account that uses it for recovery.

1. Open a browser and go directly to your Gmail (or whichever email provider you use) by typing the address manually -- do not click links in any email.
2. Log in if you are not already logged in.
3. Immediately navigate to Security settings and check: Forwarding and POP/IMAP (look for any forwarding rules you did not create -- delete any that exist), Connected apps with email access, and Recent login activity (look for logins from unrecognized locations or devices).
4. Go to the password change screen. Create a new password using this structure: pick 5 unrelated random words and connect them with a symbol. Example: `violet-hammer-cactus-seven-notebook` -- something like this, not this exact phrase. This style of password is 37+ characters and extremely strong.
5. Write this new password on a piece of paper and put it somewhere physically safe. You will move it to a password manager shortly, but do not lose access while we set the manager up.
6. Immediately after changing the password, go to Security > 2-Step Verification and enable it using an authenticator app (download Google Authenticator or Authy on your phone). Do NOT use SMS-only if you can avoid it.
7. After enabling 2FA: find the backup codes section, save the 8-10 backup codes shown, and write them on the same paper as your password.
8. Go to "Manage your Google Account > Security > Your devices" and click "See all devices." Sign out of any device you do not recognize.

**Step 2 -- Secure your bank account (immediately after Step 1)**

1. Navigate directly to your bank's website (type the address -- do not use links from any email).
2. Log in using your current credentials.
3. Change your password to a NEW unique password -- different from your new email password. Use the same passphrase style: 5 random words. Write it on the same paper.
4. If your bank offers an authenticator app for 2FA, enable it now. If they only offer SMS, enable SMS 2FA anyway -- it is better than nothing for now. Note the SIM-swap limitation.
5. Immediately review the last 90 days of transactions. If you see ANY transactions you did not authorize, call the bank's fraud line immediately (number is on the back of your debit/credit card -- not from any email or website at this moment).
6. Log out all other active sessions if your bank's security settings offer this option.

**Step 3 -- Set up your password manager (within 4 hours of completing Steps 1 and 2)**

Given your situation (no existing manager, one confirmed breach, multiple accounts at risk), Bitwarden is the recommended choice. It is free, open-source, has been independently audited, and works across all devices.

1. Go to bitwarden.com on your computer and click "Get Started" for a free account.
2. Use a NEW email address for registration if possible, or use your now-secured primary email.
3. Create a master password: use a passphrase of 5+ random words. This is the one password you must memorize. Do not use the same passphrase as your email or bank password.
4. Install the Bitwarden browser extension and the mobile app on your phone.
5. Add your email account and bank account credentials to the vault manually (since they are already changed, just enter the new ones).
6. Export your saved passwords from your browser: in Chrome, go to Settings > Autofill and payments > Password Manager > click the settings gear > Export passwords. Import this file into Bitwarden (Settings > Import Data > Chrome CSV). Then find and delete the exported CSV file immediately.

---

### ACCOUNT INVENTORY (Preliminary -- Expand After Immediate Response Complete)

| Account             | Tier     | Password Same as Breached? | 2FA Status  | Priority      |
|---------------------|----------|-----------------------------|-------------|---------------|
| Gmail (primary)     | Tier 1   | YES -- confirmed reuse      | None        | CRITICAL      |
| Bank account        | Tier 1   | YES -- confirmed reuse      | Unknown     | CRITICAL      |
| Other email accounts| Tier 1   | Likely -- check now         | Unknown     | HIGH          |
| Amazon / Apple Pay  | Tier 2   | Possibly -- check           | Unknown     | HIGH          |
| Social media        | Tier 2   | Possibly -- check           | Unknown     | HIGH          |
| All other accounts  | Various  | Unknown                     | Unknown     | After Tier 1  |

**After completing Steps 1-3 above:** Work through the remaining account inventory using the Bitwarden Security Report (available in the Bitwarden web vault under "Reports") to identify any remaining reused or weak passwords.

---

### PASSWORD MANAGER STATUS

Manager Selected: Bitwarden (free tier)
Master Password: [To be set -- use 5-word passphrase]
2FA on Manager: [Enable TOTP immediately after setup]
Emergency Kit: Write master password + Bitwarden 2FA backup codes on paper, store physically secure location
Credentials Imported: [After browser export and import]

---

### 2FA STATUS SUMMARY

| Account         | Current 2FA    | Target 2FA   | Status      |
|-----------------|----------------|--------------|-------------|
| Gmail           | None           | TOTP app     | ACTION NOW  |
| Bank Account    | Unknown        | TOTP app     | ACTION NOW  |
| Bitwarden       | None           | TOTP app     | ACTION TODAY|
| Amazon          | Unknown        | TOTP app     | This week   |

---

### CARRIER SIM-SWAP PROTECTION

This step is often overlooked but is important given you will be relying on your phone for 2FA.

Action Required: Call your phone carrier's customer service line (number on your bill, not from a search engine result). Ask them to add a "SIM transfer PIN" or "port freeze" to your account. This prevents someone from transferring your phone number to a new SIM without this PIN, which is how SIM-swapping attacks work.

---

### MAINTENANCE SCHEDULE

After completing immediate response:
- Quarterly check: Re-run HIBP on your email, review Bitwarden security report, update any flagged items. Set a calendar reminder for 3 months from today.
- Annual audit: Full account inventory refresh. Set a calendar reminder for 12 months from today.
- HIBP monitoring: Register your email address at haveibeenpwned.com to receive automatic alerts for future breaches.

---

### AFTER THE IMMEDIATE RESPONSE IS COMPLETE

Once your email and bank account are secured and Bitwarden is set up, the reactive phase is over. You then have a Level 2 -- Targeted Hygiene Sweep outstanding:

- Search your email inbox for "welcome to" and "verify your account" to build a full account inventory
- Use Bitwarden's Security Report to identify any remaining reused or weak passwords among your imported credentials
- Work through the remediation queue by tier, updating passwords for all accounts that shared the compromised password
- Enable TOTP 2FA on every Tier 1 and Tier 2 account that supports it

You are not starting from zero -- you have already secured the two most critical accounts. The rest of the sweep, while important, does not carry the same urgency as the first two steps.
