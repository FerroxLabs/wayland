---
name: digital-estate-planner
description: |
  Creates a systematic digital asset inventory covering online accounts, subscriptions,
  cryptocurrency, digital purchases, social media, cloud storage, and access credential
  management approaches. Produces a categorized digital asset catalogue and a legacy
  contact plan for attorney review.
  Use when the user asks about digital estate planning, managing online accounts after
  death, digital asset inventory, or what happens to digital accounts when someone dies.
  Do NOT use for drafting legal documents, recommending specific password managers,
  providing cryptocurrency investment advice, or general estate planning (use
  will-preparation-checklist or estate-attorney-prep-guide instead).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "estate-planning legal-literacy checklist template"
  category: "legal-civic"
  subcategory: "estate-planning"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "intermediate"
---

# Digital Estate Planner

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand legal concepts and processes. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Laws vary by jurisdiction and change over time. Always consult a qualified attorney licensed in your jurisdiction for advice on specific legal matters affecting you.

## When to Use

**Use this skill when:**
- User asks about planning for their digital assets after death or incapacity
- User wants to create an inventory of online accounts and digital property
- User asks what happens to email, social media, or cloud accounts when someone dies
- User wants to ensure a family member can access important digital accounts
- User asks about cryptocurrency and estate planning
- User asks about digital legacy planning or digital estate management

**Do NOT use when:**
- User asks about physical document organization (use `estate-document-organizer`)
- User asks about creating a will or trust (use `will-preparation-checklist` or `trust-basics-explainer`)
- User asks about cryptocurrency trading or investment strategies (refer to a financial advisor)
- User asks for recommendations of specific password management tools
- User needs help recovering access to a deceased person's account right now (contact the service provider directly)

## Process

1. **Explain why digital estate planning matters.** The average person has dozens to hundreds of online accounts. Without a plan, family members may not know these accounts exist, may not be able to access them, and may lose irreplaceable digital assets (photos, documents, cryptocurrency). Some accounts have monetary value (subscriptions, domain names, digital purchases). Others have sentimental value (photos, messages). A digital estate plan ensures nothing is lost.

2. **Walk through the digital asset categories.** Guide the user through a systematic inventory of their digital life:

   **Category 1: Email Accounts**
   - Primary email (often the recovery address for all other accounts)
   - Secondary and legacy email accounts
   - Work email (note: employer-owned, may not transfer)
   - Note: Email is often the "master key" -- access to email enables password resets for most other accounts

   **Category 2: Financial and Banking Accounts**
   - Online banking portals
   - Investment platform accounts
   - Payment services (digital wallets, peer-to-peer payment accounts)
   - Cryptocurrency wallets and exchange accounts
   - Tax preparation accounts
   - Note: These may have separate beneficiary designations (see `beneficiary-review-guide`)

   **Category 3: Social Media Accounts**
   - Major social platforms
   - Professional networking profiles
   - Messaging applications
   - Note: Most platforms have legacy contact or memorialization policies

   **Category 4: Cloud Storage and Digital Files**
   - Cloud storage services
   - Photo storage services
   - Document storage
   - Backup services
   - Note: Irreplaceable photos and documents may exist only in these accounts

   **Category 5: Subscriptions and Recurring Services**
   - Streaming services (music, video, audiobook)
   - Software subscriptions
   - News and publication subscriptions
   - Online memberships
   - Domain name registrations
   - Website hosting accounts
   - Note: Subscriptions continue billing until cancelled

   **Category 6: Digital Purchases and Licenses**
   - Digital music libraries
   - E-book libraries
   - App purchases
   - Video game libraries and in-game assets
   - Software licenses
   - Note: Many digital purchases are non-transferable licenses, not owned assets -- terms of service vary

   **Category 7: Cryptocurrency and Digital Financial Assets**
   - Cryptocurrency exchange accounts
   - Hardware wallet locations and access information
   - Software wallet applications
   - DeFi protocol positions
   - NFTs and digital collectibles
   - Note: Cryptocurrency without access credentials is permanently inaccessible -- there is no "skipped password" recovery for private keys

   **Category 8: Business and Professional Accounts**
   - Business social media accounts the user manages
   - Domain registrations and hosting for business websites
   - Professional licensing portals
   - Client management or CRM accounts
   - Freelancing platform profiles

3. **Address access credential management.** Help the user plan how credentials will be accessible:

   **Approach options (discuss with attorney which is appropriate):**
   - **Password manager with emergency access:** Many password managers offer an emergency access or legacy contact feature. A designated person can request access after a waiting period.
   - **Encrypted document:** A master credential document stored in a secure location (encrypted USB drive, sealed envelope with attorney, safe deposit box). The location is referenced in the estate plan.
   - **Legacy contact features:** Some platforms (email providers, social media) allow designating a legacy contact through their settings directly.
   - **Written instructions in sealed envelope:** Stored with estate documents. Simple but requires manual updates when credentials change.

   **Security considerations:**
   - Never include raw passwords in a will (wills become public record during probate)
   - Access instructions should be stored separately from the will
   - Consider a tiered approach: immediate access to critical accounts (financial, email), delayed access to personal accounts
   - Discuss credential storage approach with the estate attorney

4. **Document platform-specific legacy policies.** Note that major platforms have their own policies:
   - Some allow legacy contacts to manage the account after death
   - Some offer account memorialization (converting to a memorial)
   - Some allow account deletion upon verified death
   - Some require a court order for any access
   - Policies change over time -- review periodically

5. **Create the cryptocurrency-specific plan (if applicable).** Cryptocurrency requires special attention because:
   - Without the private key or seed phrase, cryptocurrency is permanently inaccessible
   - Exchange accounts may have their own beneficiary or inheritance processes
   - Hardware wallets require physical device AND PIN/passphrase
   - The location of wallets, seed phrases, and PINs must be documented securely
   - Discuss with attorney whether cryptocurrency should be held in a trust

6. **Compile the digital estate inventory.**

## Output Format

```
## Digital Estate Inventory

### Owner: [Full Legal Name]
### Last Updated: [Date]
### Access Plan Location: [Where credential access instructions are stored -- NOT in this document]

---

### Category 1: Email Accounts
| Account           | Provider     | Recovery Email | Legacy Contact Set? | Notes           |
|-------------------|-------------|----------------|---------------------|-----------------|
| [primary email]   | [provider]  | [email]        | [yes/no/N/A]        | Master account  |
| [secondary email] | [provider]  | [email]        | [yes/no/N/A]        |                 |

### Category 2: Financial and Banking
| Account           | Institution  | Has Beneficiary? | Linked Email     | Notes           |
|-------------------|-------------|------------------|------------------|-----------------|
| [online banking]  | [name]      | [yes/no]         | [email]          |                 |
| [investment]      | [name]      | [yes/no]         | [email]          |                 |
| [payment service] | [name]      | [balance?]       | [email]          | Cancel after transfer |

### Category 3: Social Media
| Platform          | Username     | Legacy Contact Set? | Preferred Action     |
|-------------------|-------------|---------------------|----------------------|
| [platform]        | [handle]    | [yes/no/N/A]        | [memorialize/delete/transfer] |

### Category 4: Cloud Storage
| Service           | Storage Used | Irreplaceable Content? | Backup Exists? | Notes |
|-------------------|-------------|------------------------|----------------|-------|
| [service]         | [GB/TB]     | [yes -- photos/docs]   | [yes/no]       |       |

### Category 5: Subscriptions
| Service           | Monthly Cost | Payment Method | Action After Death    |
|-------------------|-------------|----------------|-----------------------|
| [service]         | $[amount]   | [card/account] | [cancel/transfer]     |
| **Total monthly** | $[sum]      |                |                       |

### Category 6: Digital Purchases
| Platform          | Content Type | Approx. Value | Transferable? |
|-------------------|-------------|---------------|---------------|
| [platform]        | [music/books/games] | $[amount] | [check TOS]   |

### Category 7: Cryptocurrency (if applicable)
| Asset             | Location         | Approx. Value | Access Method         |
|-------------------|-----------------|---------------|------------------------|
| [currency]        | [exchange/wallet] | $[amount]    | [see secure access doc] |
| **Seed phrases**  | [secure location -- DO NOT list here] | | |
| **Hardware wallet**| [physical location] | | [PIN in secure access doc] |

### Category 8: Business/Professional
| Account           | Purpose      | Shared Access? | Transition Plan      |
|-------------------|-------------|----------------|----------------------|
| [account]         | [purpose]   | [who else has access?] | [delegate/close] |

---

### Access Credential Plan
| Method                    | Location              | Who Has Access         |
|--------------------------|----------------------|------------------------|
| Password manager         | [service name]       | [emergency contact set?] |
| Encrypted credential doc | [storage location]   | [who knows the location] |
| Legacy contact features  | [which platforms]    | [who is designated]     |
| Sealed instructions      | [with attorney? safe?] | [who knows]           |

### Questions for Attorney
1. [How should digital asset access be incorporated into the estate plan?]
2. [Should cryptocurrency be held in a trust?]
3. [How do digital asset access laws apply in my jurisdiction?]
4. [Should digital account access be part of the POA for incapacity as well as death?]

### Action Items
- [ ] Complete this inventory for all categories
- [ ] Set up legacy contacts on platforms that offer them
- [ ] Create secure credential access document (separate from this inventory)
- [ ] Inform executor and/or trusted person about this inventory and the access plan
- [ ] Set annual review reminder to update as accounts change
- [ ] Bring this inventory and access plan to estate attorney meeting

### Review Schedule
- [ ] Annual review: [set month]
- [ ] Update when adding major new accounts
- [ ] Update when changing password manager or credential storage approach
- [ ] Update cryptocurrency holdings whenever positions change significantly
```

## Rules

1. NEVER list actual passwords, PINs, seed phrases, or security answers in the inventory -- reference their secure storage location only
2. NEVER recommend specific password managers, cryptocurrency wallets, or digital services by name -- present categories and let the user choose tools
3. NEVER provide jurisdiction-specific legal conclusions without explicitly noting the jurisdiction and recommending local verification
4. This skill prepares users for professional estate planning engagement -- it does not replace an attorney
5. ALWAYS emphasize that cryptocurrency without access credentials is permanently lost -- there is no recovery mechanism for lost private keys
6. ALWAYS separate the inventory (what accounts exist) from the access plan (how to get into them) -- the inventory can be more widely shared, the access plan must be tightly controlled
7. ALWAYS note that digital purchase "ownership" is often a license, not a transferable asset -- terms of service govern transferability
8. If the user mentions cryptocurrency, prioritize the seed phrase and hardware wallet documentation -- this is the most time-sensitive element of digital estate planning
9. NEVER suggest methods to circumvent platform terms of service for account access after death
10. ALWAYS include subscription cancellation as an action item -- ongoing subscriptions can drain accounts indefinitely after death

## Edge Cases

- **User has significant cryptocurrency holdings:** Emphasize that this is the most urgent element of digital estate planning. Lost cryptocurrency cannot be recovered by any authority. Recommend: (1) document all wallets and exchange accounts, (2) store seed phrases and PINs in a physically secure location separate from this inventory, (3) discuss with attorney whether a cryptocurrency-specific trust is warranted, (4) consider naming a technically savvy executor or digital asset executor specifically.

- **User manages accounts for a small business:** Business digital accounts may need to be transitioned to a partner, successor, or employee rather than closed. Document which business accounts the user is the sole administrator for, and create a transition plan for each. Note that some business accounts may be owned by the business entity rather than the individual.

- **User is a content creator with monetized accounts:** Social media accounts, YouTube channels, blogs, and similar platforms with audiences and revenue may have significant financial value. These require special planning -- discuss with the attorney whether these should be treated as business assets. Document follower counts, monetization details, and any contractual obligations.

- **User does not use a password manager:** Recommend they discuss credential management approaches with their attorney. Minimum viable approach: a sealed envelope with login instructions stored in a secure location (attorney's office, home safe) with the location referenced in the estate plan. This is less secure than a password manager with emergency access but better than no plan at all.

- **Two-factor authentication complicates access:** Note that accounts with two-factor authentication tied to the user's phone or email create an additional access barrier. Document which accounts use 2FA and which device or method is used. If the phone is locked, the executor may need to contact the phone carrier and each service provider individually. Some password managers store 2FA codes alongside passwords, which simplifies legacy access.

- **User's digital assets include NFTs or domain names with significant value:** These are transferable digital assets (unlike many digital purchases). NFTs on blockchain are transferred via wallet access. Domain names can be transferred between registrar accounts. Both should be specifically inventoried with current market value estimates and included in estate planning discussions.

## Example

**Input:** "I have a bunch of online accounts, some crypto, and a lot of photos in the cloud. If something happened to me, my wife wouldn't even know most of these accounts exist. Help me make a plan."

**Output:**

## Digital Estate Inventory

### Owner: [Your Name]
### Last Updated: [Today's Date]
### Access Plan Location: [To be determined -- see Access Credential Plan section below]

Your goal is to make sure your wife can find and access what matters. Let us build the inventory category by category. Do NOT put actual passwords in this document -- we will address access separately.

---

### Category 1: Email Accounts
| Account           | Provider     | Recovery Email | Legacy Contact Set? | Notes           |
|-------------------|-------------|----------------|---------------------|-----------------|
| [your primary email] | [provider] | [recovery email] | [set one up if available] | This is the key to everything -- if your wife can access this email, she can reset most other passwords |
| [any secondary emails] | | | | |

### Category 2: Financial and Banking
| Account           | Institution  | Has Beneficiary? | Linked Email     | Notes           |
|-------------------|-------------|------------------|------------------|-----------------|
| [bank portal]     | [bank name] | [check POD status] | [email]        |                 |
| [investment account] | [institution] | [check TOD status] | [email]    |                 |
| [digital wallet/payment service] | [name] | [no -- transfer balance] | [email] | Has balance of $[amount]? |

### Category 3: Social Media
| Platform          | Username     | Legacy Contact Set? | Preferred Action     |
|-------------------|-------------|---------------------|----------------------|
| [platform 1]      | [handle]    | [check settings]    | [memorialize or delete?] |
| [platform 2]      | [handle]    | [check settings]    | [your preference?]   |

### Category 4: Cloud Storage -- YOUR PHOTOS LIVE HERE
| Service           | Storage Used | Irreplaceable Content? | Backup Exists? | Notes |
|-------------------|-------------|------------------------|----------------|-------|
| [photo storage service] | [GB] | YES -- family photos  | [do you have a second copy?] | **Priority: your wife should know this exists** |
| [cloud storage]   | [GB]        | [documents? yes/no]   | [backup?]      |       |

**Recommendation:** If irreplaceable photos exist only in one cloud account, consider creating a shared album or granting your wife direct access to the account now, rather than relying on post-death access procedures.

### Category 5: Subscriptions
| Service           | Monthly Cost | Payment Method | Action After Death    |
|-------------------|-------------|----------------|-----------------------|
| [streaming 1]     | $[amount]   | [card ending xxxx] | Cancel             |
| [streaming 2]     | $[amount]   | [card ending xxxx] | Cancel             |
| [software 1]      | $[amount]   | [card ending xxxx] | Cancel             |
| **Total monthly** | $[sum]      |                | **These will keep billing until cancelled** |

### Category 7: Cryptocurrency -- HIGHEST PRIORITY
| Asset             | Location         | Approx. Value | Access Method         |
|-------------------|-----------------|---------------|------------------------|
| [crypto asset 1]  | [exchange name]  | $[amount]     | See secure access doc  |
| [crypto asset 2]  | [hardware wallet brand] | $[amount] | Physical device + PIN |

**CRITICAL:** If you hold cryptocurrency in a hardware wallet or self-custody wallet, the seed phrase and PIN are the ONLY way to access those funds. There is no recovery process. No customer service to call. Document the following in your secure access plan (NOT here):
- Seed phrase (12 or 24 words) for each wallet
- Hardware wallet physical location
- Hardware wallet PIN
- Exchange account login credentials

---

### Access Credential Plan
| Method                    | Location              | Who Has Access         |
|--------------------------|----------------------|------------------------|
| Password manager         | [do you use one? set up emergency access for your wife] | |
| Secure credential document | [create one: encrypted file or sealed envelope] | [store with attorney or in home safe] |
| Legacy contact features  | [set up on email and social media platforms that support it] | [designate your wife] |

### Immediate Action Items
- [ ] Set up legacy contact on your primary email account
- [ ] Set up legacy contact on social media platforms that offer it
- [ ] Create a secure credential access document (sealed envelope or password manager emergency access)
- [ ] Tell your wife this inventory exists and where to find it
- [ ] Back up irreplaceable photos to a second location your wife can access
- [ ] Document cryptocurrency wallet locations, seed phrases, and PINs in the secure access document
- [ ] Bring this inventory to your next estate attorney meeting
- [ ] Set a calendar reminder to review and update annually
