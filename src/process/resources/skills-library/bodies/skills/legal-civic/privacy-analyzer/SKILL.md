---
name: privacy-analyzer
description: |
  Framework for analyzing privacy policies and terms of service including key sections to examine, data collection red flags, opt-out rights under CCPA and GDPR, cookie consent, data sharing practices, account deletion rights, comparison framework, and children's privacy under COPPA.
  Use when the user asks about privacy analyzer, or needs help with framework for analyzing privacy policies and terms of service including key sections to examine, data collection red flags, opt-out rights under ccpa and gdpr, cookie consent, data sharing practices, account deletion rights, comparison framework, and children's privacy under coppa.
  Do NOT use when the request requires professional legal advice or falls outside the scope of privacy analyzer.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "legal-literacy contracts security"
  category: "legal-civic"
  subcategory: "personal-legal"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "intermediate"
---
# Privacy Analyzer

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand privacy policies, terms of service, and applicable consumer rights frameworks. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Laws vary by jurisdiction and change frequently. Always consult a qualified privacy attorney or your jurisdiction's data protection authority for advice on specific legal matters.

---

## When to Use

**Use this skill when the user:**
- Wants to understand what a specific app, website, or platform collects about them and whether that collection is proportionate to the service offered
- Needs to know their opt-out, deletion, correction, or portability rights under CCPA/CPRA, GDPR, state privacy laws, or COPPA before taking action
- Is evaluating whether to sign up for a service, share sensitive data, or connect a third-party app and wants an informed risk assessment
- Has received a data breach notification and wants to understand what was exposed and what rights they now have
- Is a parent concerned about what a children's app or platform collects from users under 13, and whether parental consent mechanisms are adequate
- Needs to draft a Subject Access Request, deletion request, or opt-out notice using legally grounded language
- Wants to compare the privacy practices of two or more competing services before choosing one
- Has noticed unexpected behavior -- targeted ads for private conversations, location-based marketing after disabling GPS, or a social graph they never explicitly built -- and wants to trace the likely data pathway
- Needs to understand what "selling" data means under California law versus what "sharing for cross-context behavioral advertising" means and why the distinction matters

**Do NOT use this skill when:**
- The user has received a formal legal complaint, regulatory notice, or is a subject of law enforcement data request -- refer them to a licensed privacy attorney immediately
- The user is a business needing to draft, audit, or certify a compliant privacy program -- that requires professional compliance counsel, not consumer-facing literacy guidance
- The request involves an active data breach response where legal hold, forensics, or regulatory notification deadlines apply -- this is attorney and CISO territory
- The user needs help with employment law privacy issues (employee monitoring, HR data) -- use an employment law skill instead
- The user is asking about healthcare data under HIPAA in a clinical context -- HIPAA compliance analysis requires specialized health law guidance
- The user needs analysis of financial data under GLBA or FCRA -- refer to financial privacy skill
- The request is about GDPR compliance for a company building a product -- this skill serves consumers, not controllers or processors

---

## Questions to Ask the User First

Before proceeding, gather the following. Not all questions are required -- tailor to the situation:

1. **Which service or company's policy are you reviewing?** Knowing the actual company allows identification of specific known practices, regulatory history, and whether the company has faced enforcement actions.
2. **What is your primary concern?** (Data selling, advertising profiling, AI/ML training on your content, biometric collection, children's use, unexpected marketing, data breach)
3. **Where do you live?** This determines which legal framework grants you rights: EU/EEA residents have GDPR, California residents have CCPA/CPRA, Virginia/Colorado/Connecticut/Texas residents have state laws.
4. **Have you already agreed to the policy, or are you evaluating before signing up?** This affects whether opt-out language or deletion rights are the primary focus.
5. **Is a child under 13 using this service?** Triggers COPPA analysis and heightened scrutiny.
6. **Is this related to a specific incident?** A breach notification, unexpected ad targeting, or data appearing somewhere it shouldn't redirects the analysis toward enforcement pathways.
7. **Are you evaluating for personal use or a business vendor decision?** Vendor evaluation adds contract and data processing agreement considerations.

---

## Process

### Step 1: Locate and Authenticate the Policy

- Find the actual privacy policy, not a summary. Look in the website footer under "Privacy," "Legal," or "Privacy Policy." On mobile apps, check Settings > About or the app store listing.
- Verify the policy date: look for "Last Updated" or "Effective Date" at the top. A policy last updated more than 24 months ago may not reflect current data practices and is itself a yellow flag.
- Confirm scope: some companies have separate policies for different products (e.g., Google has distinct policies for Workspace vs. consumer products). Make sure you are reading the policy that governs the specific service in question.
- Check for a separate "Cookie Policy," "Terms of Service," "Data Processing Addendum," or "California Privacy Notice" -- these are legally distinct documents that together form the complete picture. The main privacy policy often cross-references these without containing their substance.
- Note the entity name. The legal controller may be a parent company, subsidiary, or white-label operator different from the brand. This matters for filing complaints and sending legal requests.
- Verify the Data Protection Officer (DPO) contact if the service operates under GDPR. The DPO must be identifiable and reachable. Absence of a DPO contact for a EU-facing service is itself a potential GDPR violation.

### Step 2: Map the Data Collection Surface

- **Directly provided data:** Identify what the user actively submits: name, email, phone, date of birth, payment information, government ID, health information, sexual orientation, religious beliefs, biometric identifiers, photos, voice recordings, written content.
- **Automatically collected data:** This is usually more extensive than user-provided data and often buried. Look for: IP address, precise GPS coordinates, device identifiers (IDFA, GAID, MAC address), browser fingerprint components (screen resolution, font list, installed plugins), app usage patterns, search queries within the app, scroll depth, keystroke cadence, mouse movement patterns, network information, battery level (used for fingerprinting), and inferred attributes.
- **Third-party sourced data:** Identify whether the company buys or receives data from data brokers, credit bureaus, social platforms (via OAuth or pixel), advertising networks, or "partners." This enrichment layer often makes the actual data profile far richer than the directly collected data suggests.
- **Sensitive data categories:** Flag explicit collection of: precise geolocation, racial or ethnic origin, political opinions, religious beliefs, union membership, genetic data, biometric data for unique identification, health data, sex life or sexual orientation data. Under GDPR these require explicit consent (Article 9). Under CPRA these are "sensitive personal information" triggering additional opt-out rights.
- **Score the collection scope:** MINIMAL (only what is functionally necessary), MODERATE (some analytics beyond core function), EXTENSIVE (behavioral tracking, enrichment), EXCESSIVE (collection clearly disproportionate to service, e.g., a flashlight app requesting contacts).

### Step 3: Analyze Data Use Purposes

- Identify every stated purpose: service delivery, account management, customer support, safety and fraud prevention, legal compliance, research and analytics, product improvement, personalization, marketing and advertising, and -- critically -- AI and machine learning model training.
- The AI/ML training clause deserves special attention. Increasingly, services reserve the right to use user-generated content, communications, and behavioral data to train proprietary or third-party AI models. This use is often listed deep in the policy under "product improvement." Evaluate whether the user can opt out of this specific use.
- Check whether purposes are specific and limited ("to process your payment") or vague and expansive ("to improve our products and services and those of our partners"). Vague language grants the company enormous latitude.
- Look for the phrase "legitimate interests" (a GDPR lawful basis). When used for advertising or profiling, this is frequently challenged. Users have a right to object to processing under legitimate interests (GDPR Article 21).
- Identify any secondary use clause -- whether data collected for one purpose (service delivery) can be repurposed for another (advertising). Repurposing without fresh consent is a red flag under both GDPR and FTC expectations.

### Step 4: Audit Data Sharing and Third-Party Ecosystem

- **Categorize sharing recipients:**
  - Service providers and processors: LOW concern if bound by data processing agreements limiting use to the original purpose
  - Analytics providers (Google Analytics, Mixpanel, Amplitude): MEDIUM -- behavioral data leaves the service
  - Advertising networks and DSPs (demand-side platforms): HIGH -- real-time bidding involves sending your profile data to hundreds of entities per page load
  - Social media platforms via pixel or SDK: HIGH -- cross-context profile building
  - Data brokers: VERY HIGH -- data sold or licensed with minimal restrictions on downstream use
  - "Business partners" without named entities: HIGH -- vague language can encompass nearly anything
  - Government and law enforcement: MEDIUM -- distinguish between "when required by law" (compelled, acceptable) and "when we believe it may be appropriate" (voluntary, concerning)
  - Acquirers in merger/acquisition: MEDIUM-HIGH -- your data becomes an asset in a business transaction
- Ask explicitly: does the policy use the word "sell"? Under CCPA/CPRA, "selling" has a specific legal definition but "sharing for cross-context behavioral advertising" is equally regulated and often not labeled as selling.
- Identify whether third parties are named specifically or only described in categories. Named parties can be researched; category descriptions provide no meaningful disclosure.
- Check for "onward transfer" language: when your data is shared with a partner, what restrictions apply to that partner sharing with a fourth party? No restriction language means data can propagate indefinitely.

### Step 5: Assess User Rights and Opt-Out Mechanisms

- **For California residents (CCPA/CPRA):**
  - Confirm presence of "Do Not Sell or Share My Personal Information" link -- required on the homepage and any page where personal information is sold or shared. Absence is a violation.
  - Confirm "Limit the Use of My Sensitive Personal Information" link if the company processes sensitive PI.
  - Verify the request submission mechanism: web form, email, and toll-free number are all required for businesses subject to CCPA.
  - Note the 45-day response window (extendable to 90 days with notice).
  - Check for Global Privacy Control (GPC) recognition -- CPRA requires businesses to honor GPC signals as a valid opt-out.
- **For EU/EEA residents (GDPR):**
  - Confirm presence of a valid legal basis for each processing purpose. Consent for marketing, contract for service delivery, legal obligation for regulatory compliance.
  - Verify the right to withdraw consent is as easy as giving it (Article 7(3)).
  - Confirm Subject Access Request pathway: email to DPO or privacy@ address, with 30-day response window.
  - Confirm right to erasure (Article 17) conditions: data no longer necessary, consent withdrawn, no overriding legitimate grounds.
  - Check for data portability (Article 20): does the company provide data export in a machine-readable format (JSON, CSV)?
  - Confirm right to lodge a complaint with a supervisory authority is mentioned.
- **For other US state residents:**
  - Virginia (VCDPA): Right to access, correct, delete, portability, opt out of targeted advertising and sale. 45-day response. Appeal mechanism required.
  - Colorado (CPA): Same core rights. Must honor universal opt-out mechanism (GPC) as of July 2024.
  - Connecticut (CTDPA): Honors GPC. 45-day response. Appeals required.
  - Texas (TDPSA): Applies to companies that process data of Texas residents regardless of revenue threshold (with exceptions for small businesses).
  - Oregon (OCPA), Montana (MCDPA), Delaware (DPDPA): Similar core rights frameworks, effective 2024-2025.
- **Universal rights floor:** Even without a specific law, evaluate whether the service offers: data download, account deletion, marketing opt-out, and an identifiable contact for privacy questions. Absence of all four is a significant red flag regardless of jurisdiction.

### Step 6: Evaluate Cookie Consent and Tracking Mechanisms

- **Cookie categories to identify:**
  - Strictly necessary: Session management, authentication, shopping cart -- no consent required
  - Functional/preference: Language settings, UI preferences -- consent required under GDPR
  - Performance/analytics: Page views, session duration, error tracking -- consent required
  - Advertising/targeting: Cross-site behavioral tracking, retargeting pixels, interest-based profile building -- consent required; default should be OFF
  - Social media: Like buttons, share widgets, comment systems that load third-party scripts -- consent required
- Evaluate the cookie banner design for dark patterns:
  - Accept/reject asymmetry: "Accept All" button is prominent; reject requires navigating through multiple sub-menus
  - Pre-checked boxes for non-essential cookies
  - Confusing double-negatives: "Uncheck to opt out of not receiving targeted ads"
  - No "Reject All" button at the top level
  - Consent signal that doesn't actually disable third-party cookies
- Under GDPR (enforced by EU DPAs), any pre-ticked boxes or confusing rejection pathways are invalid consent. The Planet49 ruling (CJEU, 2019) established that pre-checked boxes do not constitute valid consent.
- **Practical tools the user can deploy:**
  - Browser-level: Firefox with Enhanced Tracking Protection (Strict mode), Safari Intelligent Tracking Prevention
  - Extension-level: uBlock Origin (blocks ad/tracker requests at network level), Privacy Badger (learning-based tracker blocking)
  - Signal-level: Global Privacy Control extension or browser setting -- legally recognized opt-out signal in California and Colorado
  - Network-level: NextDNS or Pi-hole for DNS-based tracker blocking across all devices on a network

### Step 7: Evaluate Data Retention and Deletion Rights

- Look for a specific retention schedule, not vague statements like "as long as necessary." GDPR requires defined retention periods or the criteria used to determine them.
- Red flags in retention language: "indefinitely," "for business purposes," "as permitted by law" without specificity.
- Distinguish between account deletion and data deletion. Many services "deactivate" accounts, retaining all underlying data. Insist on confirmation that deletion means actual purging, not deactivation.
- Ask whether backups are covered: a common response is that data persists in encrypted backups for 30-90 days after deletion request fulfillment. This is generally acceptable if the window is stated explicitly.
- Check for data that survives deletion by design: anonymized/aggregated analytics, data shared with third parties before deletion (the company may be unable to claw back), legal hold data, and data in backup systems.
- For GDPR, the right to erasure (Article 17) has defined exceptions: legal obligation, public interest in public health, archiving for scientific/historical research, establishment or defense of legal claims. Scrutinize whether a company invokes exceptions that don't actually apply to a consumer's situation.

### Step 8: Children's Privacy and COPPA Analysis

- COPPA applies to operators of websites and online services directed to children under 13, or those with actual knowledge they are collecting personal information from children under 13. "Directed to children" is determined by subject matter, visual content, music, animated characters, and other indicators -- not just by the service's own age gate.
- **COPPA requirements checklist:**
  - Clear, comprehensive privacy policy specifically addressing data collection from children
  - Direct notice to parents (not just a privacy policy link) before collection
  - Verifiable parental consent before any collection (email plus additional verification, or credit card verification, or video conference)
  - Parents can review the child's information at any time
  - Parents can refuse further collection or use
  - Parents can request deletion of the child's information
  - Collection must be limited to what is reasonably necessary for the activity
  - No behavioral advertising targeting children under 13
  - Reasonable data security measures
- **Age gate adequacy:** A simple "Enter your birthday" field is not verifiable parental consent -- it is security theater. Adequate COPPA compliance requires mechanisms that actually verify parent identity and obtain consent, not just assert the user is 13+.
- **Mixed-audience apps:** Apps not explicitly directed at children but used by them ("general audience" apps where children participate) must have procedures to handle users under 13 when discovered. Platforms like Instagram and TikTok have faced FTC enforcement for COPPA violations despite general-audience designations.
- **State additions:** Illinois BIPA (Biometric Information Privacy Act) requires written consent before collecting biometric data from any person including minors, with statutory damages of $1,000-$5,000 per violation.

---

## Output Format

Deliver the analysis using this structure, populated with specific findings:

```
PRIVACY POLICY ANALYSIS REPORT
================================
Service: [Company Name] -- [Product/Platform Name]
Policy Effective Date: [Date] | Analysis Date: [Today's Date]
User Jurisdiction: [California / EU-Germany / Virginia / etc.]
Applicable Laws: [GDPR / CCPA+CPRA / VCDPA / COPPA / etc.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: DATA COLLECTION SCOPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scope Rating: MINIMAL / MODERATE / EXTENSIVE / EXCESSIVE

Directly Provided:
  [List specific data types with context]

Automatically Collected:
  [List with flags for high-sensitivity items]

Third-Party Sourced:
  [List sources and data types received]

Sensitive Data Categories Collected:
  [ ] Precise geolocation    [ ] Biometrics
  [ ] Health data            [ ] Financial data
  [ ] Racial/ethnic origin   [ ] Political opinions
  [ ] Religious beliefs      [ ] Sexual orientation/gender identity
  [ ] Communications content [ ] Children's data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2: DATA USE PURPOSES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Service delivery             [Acceptable]
✓ Fraud prevention             [Acceptable]
✓ Legal compliance             [Acceptable]
⚠ Analytics and product improvement  [Review -- is opt-out available?]
⚠ Personalized advertising     [Opt out -- see Section 4]
✗ AI/ML model training on user content  [HIGH concern -- opt-out may not exist]
✗ Sale to third-party data brokers  [HIGH concern]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3: DATA SHARING ECOSYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
| Recipient Category          | Concern Level | Notes                     |
|-----------------------------|--------------|---------------------------|
| Service providers           | LOW          | Bound by data agreements  |
| Analytics platforms         | MEDIUM       | Behavioral data exits     |
| Advertising networks        | HIGH         | RTB ecosystem exposure    |
| Named third-party partners  | HIGH         | [List named parties]      |
| "Business partners" (vague) | VERY HIGH    | Scope undefined           |
| Data brokers                | VERY HIGH    | [Explicitly stated? Y/N]  |
| Law enforcement             | MEDIUM       | Compelled vs. voluntary?  |
| Acquirers (M&A)             | MEDIUM-HIGH  | Data as business asset    |

Data Sold (CCPA definition): YES / NO / AMBIGUOUS
Data Shared for Ad Targeting (CPRA): YES / NO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4: RED FLAGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Red Flags Found: [N]

HIGH SEVERITY:
  1. [Specific red flag] -- Policy Language: "[Exact quote]" -- Impact: [Explanation]
  2. [Specific red flag] -- Policy Language: "[Exact quote]" -- Impact: [Explanation]

MEDIUM SEVERITY:
  3. [Specific red flag] -- Policy Language: "[Exact quote]" -- Impact: [Explanation]

LOW SEVERITY:
  4. [Specific concern] -- Policy Language: "[Exact quote]" -- Impact: [Explanation]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5: YOUR RIGHTS AND HOW TO EXERCISE THEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Under [Applicable Law]:

Right to Know / Access:
  How: [Specific mechanism -- web form URL, email address]
  Timeline: [30 / 45 days with possible extension]
  Status: Available / NOT OFFERED (potential violation)

Right to Delete:
  How: [Specific mechanism]
  Timeline: [Number of days]
  Status: Available / NOT OFFERED

Right to Opt Out of Sale/Sharing:
  How: [DNSSMPI link / GPC / email]
  Status: Available / NOT OFFERED (potential CCPA violation)

Right to Correct:
  How: [Mechanism]
  Status: Available / NOT OFFERED

Data Portability (export):
  Format: [JSON / CSV / PDF]
  Status: Available / NOT OFFERED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6: COOKIE AND TRACKING ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cookie Consent Mechanism: [Banner / No banner / Server-side]
Dark Patterns Detected: YES / NO -- [Specify if yes]
GPC Honored: YES / NO / UNKNOWN

Tracker Categories Active:
  [ ] Strictly necessary
  [ ] Functional
  [ ] Analytics
  [ ] Advertising/targeting (DECLINE)
  [ ] Social media widgets (DECLINE)

Recommended Defensive Actions:
  - [Specific tool or setting for this user's browser/device]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7: CHILDREN'S PRIVACY (if applicable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COPPA Applicability: [Directed to children / General audience / Mixed]
Age Verification Mechanism: [Describe -- adequate or inadequate]
Parental Consent Process: [Describe]
Behavioral Advertising to Children: PRESENT / ABSENT
Compliance Assessment: COMPLIANT / LIKELY NON-COMPLIANT / UNCLEAR

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8: OVERALL ASSESSMENT AND ACTION PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Privacy Rating: GOOD / ACCEPTABLE / CONCERNING / POOR / DANGEROUS

Summary: [2-3 sentence plain-English summary of the most important findings]

IMMEDIATE ACTIONS (take now):
  1. [Specific step -- opt out of X, delete Y, enable Z]
  2. [Specific step]

SHORT-TERM ACTIONS (within 1 week):
  1. [Specific step -- submit SAR, download data, review connected apps]
  2. [Specific step]

IF CONSIDERING NOT USING THIS SERVICE:
  [ ] Download and save your existing data first
  [ ] Revoke OAuth/SSO connections
  [ ] Cancel any subscriptions
  [ ] Submit formal deletion request using template below

DELETION REQUEST TEMPLATE:
  To: [privacy@company.com / DPO contact]
  Subject: Account and Data Deletion Request -- [Your Name]

  "Under [CCPA/CPRA / GDPR Article 17 / VCDPA], I request the permanent
  deletion of all personal information held by [Company] relating to me.
  Full Name: [Name]
  Email Address: [Email on account]
  Account Username/ID: [If known]

  Please confirm in writing: (1) all personal data has been deleted,
  (2) backups will be purged within [30-90 days], (3) third-party
  processors have been notified of the deletion request, and (4) the
  date by which this will be complete.

  I expect a response within [30 days / 45 days] per [applicable law]."

COMPLAINT PATHWAYS (if rights are denied):
  California: California Privacy Protection Agency (CPPA) and CA Attorney General
  EU: [Relevant national DPA based on user's member state]
  US Federal: FTC complaint portal (for COPPA, deceptive practices)
  State AG: [User's state attorney general consumer protection division]
```

---

## Rules

1. **Never issue a privacy verdict without reading the actual policy language.** Analyzing a company's reputation is not the same as analyzing their policy. A well-regarded company may have a problematic policy, and vice versa. Quote the actual policy text when identifying red flags.

2. **Distinguish between data collection and data retention of deleted content.** Many policies state data is deleted within 30-90 days. This is often accurate for primary databases but not for distributed caches, CDN edge nodes, backups, or data already shared with third-party ad networks. Clarify this distinction to the user rather than treating deletion as clean and complete.

3. **"We do not sell your data" does not mean data is not shared for advertising.** Under CCPA/CPRA, "sharing" for cross-context behavioral advertising is regulated separately from "selling." Many companies that truthfully say they don't sell data still share it with hundreds of advertising partners through their ad tech stack. Flag this distinction explicitly.

4. **Never tell a user they definitely have GDPR rights without confirming EU/EEA residency or physical presence.** GDPR protects people based on location, not citizenship. A US citizen physically in Germany has GDPR rights. A German citizen living in the US does not for that interaction. Jurisdiction determines rights.

5. **Do not tell a user to "just use incognito mode" for privacy.** Incognito mode prevents local browser history storage but does not prevent the website from logging your visit, your ISP from seeing your traffic, or advertising networks from fingerprinting your browser. Describe the actual protective scope of any tool you recommend.

6. **Flag AI/ML training clauses as a distinct, emerging risk category.** Many users are unaware that their messages, photos, documents, and voice recordings may be used to train AI models. This is legally murky, may be irreversible (models retain learned patterns), and is distinct from targeted advertising risks. Treat it as a separate high-concern category.

7. **When a policy has not been updated in 24+ months, note that stated practices may lag actual practices.** Data practices evolve faster than policy updates. A policy from 2021 does not reflect integrations with large language model APIs, real-time bidding infrastructure, or new third-party SDK integrations that have been added since.

8. **Always match the rights discussion to the user's actual jurisdiction.** Do not recite all privacy laws to a user in Oklahoma -- they have neither GDPR nor CCPA rights. Focus on what actually applies. If the user's state has no comprehensive privacy law, focus on contractual rights offered by the service and FTC deceptive practices grounds.

9. **Treat any COPPA analysis with heightened caution.** COPPA violations carry FTC civil penalties up to $51,744 per violation per day. If a user has a child using a non-compliant service, communicate the seriousness and recommend they contact the FTC and remove the child's data immediately, not just "consider" doing so.

10. **Do not recommend specific brand-name VPN services as privacy solutions.** VPNs shift trust from the ISP to the VPN provider, do not prevent cookie-based or fingerprint-based tracking, and many consumer VPN services have poor logging and security practices. Describe the protection VPNs actually provide (hiding traffic from local network and ISP) and recommend users research provider independently rather than endorsing a specific product.

---

## Edge Cases

**Edge Case 1: The policy is extremely long (50,000+ words) or deliberately obfuscated**
Many large platform privacy policies are intentionally complex. When a user is overwhelmed, direct them to search the document for key terms rather than read it sequentially: search for "sell," "share," "third part," "partner," "biometric," "train," "model," "retain," "delete," and "children." These keyword hits surface the most important provisions faster than linear reading. Also note that excessive length and complexity is itself a regulatory concern -- GDPR Article 12 requires information to be provided in a "concise, transparent, intelligible and easily accessible form." A deliberately impenetrable policy may constitute a violation.

**Edge Case 2: The user has already agreed to the policy and now objects to a specific practice**
Agreeing to a policy does not eliminate all rights. Under GDPR, consent can be withdrawn at any time and must be as easy to withdraw as it was to give. Under CCPA/CPRA, the right to opt out of sale/sharing applies regardless of having agreed to a policy at sign-up. Under COPPA, parental consent can be revoked at any time. Help the user identify which rights persist post-agreement and how to exercise them now. Also note that if a company materially changed its policy after the user agreed and did not provide adequate notice, the original agreement may not cover the new practices.

**Edge Case 3: The company is non-US and has no GDPR or CCPA obligation**
A company serving global customers from, say, Southeast Asia may not fall under GDPR (if it neither targets EU persons nor monitors EU behavior) and may not meet CCPA thresholds. In this case, the user's legal rights framework is thin. Focus the analysis on: (1) what the policy actually says about sharing and deletion even if not legally mandated, (2) whether the service is subject to international frameworks like APEC CBPR, (3) practical tools (tracker blockers, account hygiene) that don't depend on legal rights, and (4) the user's ability to simply not use the service if practices are unacceptable. Do not overstate rights that don't exist.

**Edge Case 4: Policy says one thing, the app/service appears to do another**
When a user reports that their location tracking is "off" in settings but they are still receiving location-based ads, or that they opted out of data selling but are still in broker databases, this is a potential enforcement matter. Guidance: document the discrepancy carefully (screenshots with timestamps, settings screenshots, specific ad examples). For California residents, this can be reported to the California Privacy Protection Agency. For EU residents, to the relevant national DPA. For COPPA issues, to the FTC. Emphasize that companies face real penalties for honor-the-policy failures, not just failures to have a policy. This is no longer an analysis question -- it's an enforcement question.

**Edge Case 5: The service is being assessed as a vendor by a small business user**
Although this skill is primarily consumer-facing, sometimes a small business owner asks for help evaluating a SaaS vendor's privacy practices before sharing customer data with them. In this case, the analysis needs to expand to include: whether a Data Processing Agreement (DPA) is available and whether the vendor will sign one, whether the vendor is SOC 2 Type II certified or has equivalent attestation, what the vendor's sub-processor list looks like, and whether the vendor's practices are compatible with the business's own obligations to their customers. Note clearly that this moves toward compliance territory that benefits from attorney review, but provide the framework for the initial assessment.

**Edge Case 6: The policy mentions a class action waiver and mandatory arbitration**
Many privacy policies contain forced arbitration clauses that require users to resolve disputes through private arbitration rather than courts, and class action waivers that prevent users from joining collective suits. While this is technically a contracts issue, flag it in the privacy context because it limits the user's ability to seek redress for privacy violations through traditional legal channels. Note that some states (California, New Jersey) have rules limiting enforceability of such clauses in certain contexts, and COPPA disputes cannot be arbitrated away. Recommend the user understand this limitation before deciding whether to use the service.

**Edge Case 7: The service has had a documented data breach or FTC enforcement action**
Prior breaches and enforcement history are material context for a privacy analysis. If the service the user is analyzing has prior FTC consent decrees, state AG settlements, or documented major breaches (which are public record), this history substantially elevates the risk profile even if the current policy language is acceptable. FTC consent decrees are searchable through the FTC website. State AG settlements are often published through state AG press releases. Known major breaches are documented through the Privacy Rights Clearinghouse and similar repositories. When prior enforcement or breach history exists, add it as a contextual factor in the overall risk assessment with explicit notation.

---

## Example

**User Input:** "I'm a California mom and my 10-year-old has been using a popular kids' drawing and sharing app called 'ArtPals' for about 6 months. My daughter mentioned the app shows her ads. I'm looking at their privacy policy now and I'm concerned. Can you help me analyze it?"

---

**Output:**

```
PRIVACY POLICY ANALYSIS REPORT
================================
Service: ArtPals -- Kids Drawing & Sharing App
Policy Effective Date: March 14, 2022 | Analysis Date: [Current Date]
User Jurisdiction: California
Applicable Laws: COPPA (Federal), CCPA/CPRA (California), CalOPPA (California)

NOTE: Policy is 26 months old as of analysis. This is a yellow flag --
the app may have added third-party SDKs, ad networks, or AI features
since the policy was last updated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: DATA COLLECTION SCOPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scope Rating: EXTENSIVE (disproportionate for a children's drawing app)

Directly Provided:
  - First name, age/birthdate, parent email (required at signup)
  - Artwork created and shared within the app (user-generated content)
  - Text comments posted on other users' artwork
  - Profile photo (optional but permitted)

Automatically Collected:
  - Device type, OS version, and unique device identifier ⚠ HIGH
  - IP address (used for approximate geolocation) ⚠ MEDIUM
  - In-app behavior: which drawings viewed, time spent, features used
  - Advertising identifier (IDFA on iOS, GAID on Android) ✗ CRITICAL
    [Policy language: "We may collect your device's advertising identifier
    to provide relevant advertising experiences." -- This is behavioral
    ad targeting on a children's platform. Likely COPPA violation.]

Third-Party Sourced:
  - None explicitly stated (but see sharing section)

Sensitive Data Categories Collected:
  [✓] Children's data (age under 13 confirmed)
  [✓] Device advertising identifiers (enables behavioral profiling)
  [ ] Precise GPS geolocation -- NOT collected (positive)
  [ ] Biometrics -- NOT collected (positive)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2: DATA USE PURPOSES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Displaying artwork within the app          [Acceptable]
✓ Enabling social features (comments, likes) [Acceptable if parental consent obtained]
✓ Account management and safety              [Acceptable]
⚠ Analytics on app usage patterns           [Review -- is this shared with third parties?]
✗ "Providing relevant advertising experiences" [CRITICAL VIOLATION]
  COPPA explicitly prohibits behavioral advertising targeting children
  under 13. Collecting IDFA/GAID for ad targeting on a child's account
  is not a gray area -- it is a per-violation civil penalty exposure of
  up to $51,744 per child affected.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3: DATA SHARING ECOSYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
| Recipient Category          | Concern Level | Notes                            |
|-----------------------------|--------------|----------------------------------|
| Hosting infrastructure      | LOW          | AWS -- standard processor        |
| Analytics (unnamed provider)| MEDIUM       | Behavioral data -- not named     |
| Advertising networks        | CRITICAL     | Named: "AdColony, AppLovin,      |
|                             |              | Unity Ads" -- all behavioral     |
|                             |              | ad networks serving children     |
| "Content moderation partner"| MEDIUM       | Artwork reviewed by third party  |
| App store platforms         | LOW          | Apple/Google standard            |

Data Sold (CCPA definition): AMBIGUOUS
  [Policy language: "We do not sell personal information." However, sharing
  with behavioral advertising networks for targeted ad delivery is "sharing
  for cross-context behavioral advertising" under CPRA and is separately
  regulated even if technically not a "sale."]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4: RED FLAGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Red Flags Found: 6

HIGH/CRITICAL SEVERITY:
  1. Behavioral advertising targeting children under 13
     Policy Language: "We may collect your device's advertising identifier
     to provide relevant advertising experiences."
     Impact: Likely COPPA violation. Behavioral ads targeting minors are
     explicitly prohibited. This is the single most serious finding.

  2. Named behavioral ad networks (AdColony, AppLovin, Unity Ads)
     sharing data on children's devices
     Policy Language: "We work with advertising partners including
     AdColony, AppLovin, and Unity Ads to support our free service."
     Impact: These networks receive device identifiers enabling cross-app
     tracking of children. Each represents a data flow to a party with
     their own privacy practices.

  3. Policy is 26 months old
     Impact: Three ad network SDK versions, multiple iOS/Android privacy
     framework changes, and potentially new third-party integrations
     are not reflected in this document.

MEDIUM SEVERITY:
  4. Parental consent mechanism is inadequate
     Policy Language: "Parents can consent by providing their email
     address during account setup."
     Impact: COPPA requires verifiable parental consent. Email collection
     alone is not "verifiable." Acceptable methods include a credit card
     verification, a knowledge-based authentication, or a signed consent
     form. Email-only fails FTC standards.

  5. Artwork is visible to "all users" by default
     Policy Language: "Artwork is shared publicly to inspire the community
     unless parents set the account to private."
     Impact: Default-public settings for children's content is contrary
     to COPPA's data minimization and purpose limitation expectations.
     Should default to private.

LOW SEVERITY:
  6. No data retention period specified for children's data
     Policy Language: "We retain data as long as your account is active
     or as needed to provide services."
     Impact: COPPA expects operators to retain children's data only as
     long as reasonably necessary and then securely delete it. Indefinite
     retention violates this principle.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5: YOUR RIGHTS AND HOW TO EXERCISE THEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Under COPPA (as a parent of a child user):

Right to Review Child's Data:
  How: Email privacy@artpals.com with subject "COPPA Parental Review Request"
  Timeline: No statutory response deadline under COPPA, but FTC expects
  prompt response. Reasonable: 30 days.
  Status: Policy states this right exists -- test whether it is honored.

Right to Refuse Further Collection and Use:
  How: Same email -- state you withdraw consent for all data collection
  beyond what is strictly necessary for the core drawing service.
  Status: Available under COPPA -- company must honor this.

Right to Delete Child's Data:
  How: Request account deletion and all associated data.
  Timeline: Reasonable expectation: 30 days.
  Note: Request explicit confirmation that advertising network identifiers
  and shared data with AdColony, AppLovin, and Unity Ads have been
  subject to deletion requests to those third parties.

Under CCPA/CPRA (as a California resident -- the parent's rights):
  Right to opt out of sharing for behavioral advertising:
  Look for "Do Not Sell or Share My Personal Information" --
  this link was NOT found on ArtPals' homepage or in app settings.
  This is a likely CCPA violation if the service meets thresholds.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6: COOKIE AND TRACKING ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Platform: Mobile app (iOS/Android) -- traditional cookie consent
banners don't apply, but SDK-level tracking is equivalent.

Tracking SDKs in Use (based on policy disclosure):
  [ ] Analytics SDK: Unnamed -- MEDIUM concern
  [✓] AdColony SDK: Behavioral advertising -- DECLINE/REMOVE
  [✓] AppLovin SDK: Behavioral advertising -- DECLINE/REMOVE
  [✓] Unity Ads SDK: Behavioral advertising -- DECLINE/REMOVE

Defensive Action for iOS Devices:
  iOS 14.5+ App Tracking Transparency: Go to Settings > Privacy &
  Security > Tracking > Disable "Allow Apps to Request to Track."
  This prevents apps from accessing the IDFA.
  Additionally: Settings > Privacy & Security > Apple Advertising >
  Disable "Personalized Ads."

Defensive Action for Android Devices:
  Settings > Privacy > Ads > "Delete advertising ID" (Android 12+)
  or "Opt out of Ads Personalization" (earlier versions).
  This resets/limits GAID access for behavioral targeting.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7: CHILDREN'S PRIVACY (COPPA ASSESSMENT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COPPA Applicability: DIRECTED TO CHILDREN -- app is marketed to children
under 13, uses animated characters, and explicitly permits child accounts.

Age Verification Mechanism: INADEQUATE
  Current: Parent enters email at account creation.
  Required: Verifiable parental consent per 16 C.F.R. § 312.5.
  Gap: Email-only signup does not constitute verifiable consent.

Parental Consent Process: INADEQUATE
  Collection of advertising identifiers without verifiable parental
  consent is a COPPA violation regardless of other factors.

Behavioral Advertising to Children: PRESENT -- COPPA VIOLATION
  COPPA prohibits behavioral advertising targeting children under 13.
  Serving ads from AdColony, AppLovin, or Unity Ads using device
  identifiers collected from known child accounts is prohibited.

Compliance Assessment: LIKELY NON-COMPLIANT
  Specific concerns: (1) inadequate verifiable parental consent mechanism,
  (2) behavioral advertising targeting children, (3) sharing child device
  identifiers with multiple ad network third parties.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8: OVERALL ASSESSMENT AND ACTION PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Privacy Rating: POOR -- LIKELY COPPA NON-COMPLIANT

Summary: ArtPals collects advertising identifiers from children under 13
and shares them with three behavioral advertising networks, which is
prohibited under COPPA. The parental consent mechanism does not meet
federal verifiable consent standards. The policy is over two years old
and may not reflect current data practices. This app should not be used
in its current state until these practices are corrected.

IMMEDIATE ACTIONS (take now):
  1. On your daughter's iPhone: Settings > Privacy & Security > Tracking >
     Disable "Allow Apps to Request to Track." This immediately limits IDFA
     access for ArtPals and all apps.
  2. Delete the app from her device while you decide next steps.
  3. Screenshot the current policy (with date) and your daughter's account
     profile for documentation purposes.

SHORT-TERM ACTIONS (within 1 week):
  1. Send the COPPA parental data review request below to
     privacy@artpals.com. Request confirmation of what data was collected
     and shared with the named ad networks.
  2. File an FTC complaint at reportfraud.ftc.gov -- select "Online
     Shopping or Computers" then "Privacy." COPPA complaints are
     investigated by the FTC Bureau of Consumer Protection. You do not
     need to have suffered a financial harm to file.
  3. Consider also filing with the California AG office, as ArtPals
     may also face CCPA obligations for the parent account data.

COPPA PARENTAL DATA REQUEST AND DELETION LETTER:
  To: privacy@artpals.com
  Subject: COPPA Parental Review and Deletion Request -- [Child's Username]

  "I am the parent/legal guardian of a child under 13 who uses ArtPals
  under the username [USERNAME]. Under the Children's Online Privacy
  Protection Act (COPPA), 15 U.S.C. § 6501 et seq., I request:

  1. A complete review of all personal information collected from my child,
     including any device identifiers, advertising IDs, behavioral data,
     artwork, comments, and profile information.
  2. Identification of every third party -- including AdColony, AppLovin,
     and Unity Ads -- to which my child's data or device identifiers have
     been transmitted.
  3. Immediate cessation of all behavioral advertising targeting my child
     and withdrawal of any previously transmitted advertising identifiers
     from the named ad networks.
  4. Permanent deletion of all personal information collected from my child,
     including from third-party processors and advertising partners.
  5. Written confirmation of the above, including the date by which
     deletion will be complete.

  I also note that collecting advertising identifiers from children under 13
  for behavioral ad targeting without verifiable parental consent is a
  violation of 16 C.F.R. § 312 (COPPA Rule). I have documented this policy
  and am filing a concurrent FTC complaint.

  Parent Name: [Your Name]
  Parent Email: [Your Email]
  Child Account Username: [Username]
  Child Account Email (if used): [If applicable]
  Date of Request: [Date]"

COMPLAINT PATHWAYS:
  Federal: FTC -- reportfraud.ftc.gov (COPPA enforcement authority)
  California: California AG -- oag.ca.gov/contact/consumer-complaint-
    against-business-or-company (CCPA enforcement)
  California Privacy Protection Agency: cppa.ca.gov/regulations/
  App Store: Report the app to Apple/Google for COPPA non-compliance --
    both stores have policies against COPPA-violating apps and have
    removed apps following parent complaints.
```

---

*This analysis provides educational information to support informed decisions about privacy. It does not constitute legal advice. For COPPA enforcement matters involving documented violations affecting your child, consider consulting a consumer protection or privacy attorney in addition to filing FTC and state complaints.*
