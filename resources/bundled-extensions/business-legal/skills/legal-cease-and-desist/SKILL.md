---
name: legal-cease-and-desist
description: Generate a cease-and-desist letter - trademark, copyright, IP misuse, defamation, breach of contract, or debt - with appropriate tone (professional / firm / litigation-threat), supporting evidence section, demand, and deadline. Templates only - not legal advice. High-stakes versions warrant attorney review before sending.
slash_command: false
attribution:
  lineage: "Wayland Business Suite (Original)"
metadata:
  wayland:
    tags: [cease-and-desist, letter, legal, smb, business]
---

> **Templates only - not legal advice.** Have an attorney review before signing or distributing.

# Legal - Cease-and-Desist Letter

Generate a cease-and-desist (C&D) letter. C&Ds are the most-requested generic SMB legal letter - they put a counterparty on notice, create a written record, and can resolve a dispute without litigation. They also carry risk: a poorly worded C&D can expose the sender to anti-SLAPP, *Twiqbal* counter-suits, FDCPA / state UDAP claims (for debt), declaratory-judgment actions (especially in trademark/copyright), and tortious-interference claims (for overreach). Tone and content must match the dispute's severity and the underlying legal theory.

## When to use

- Trademark infringement (your registered or unregistered mark used by another)
- Copyright infringement (where DMCA §512 doesn't apply or has failed - see `legal-dmca` first for hosted content)
- Defamation (false statements of fact causing reputational harm)
- Breach of contract (NDA, non-compete, license, service agreement)
- Debt collection (between business creditor and debtor - NOT consumer, see warning below)
- Misuse of trade secret or confidential information
- Harassment or stalking with a business / employment nexus
- IP misuse (patent, design rights - generally engage IP counsel directly)

## When NOT to use as-is

- **Consumer debt collection by a third-party debt collector** → FDCPA (15 USC §1692) governs and has technical content / disclosure requirements; this skill is for first-party (original creditor) debt or B2B debt only. Even first-party collection is regulated by state UDAP and statutes like CA Rosenthal Act and NY GBL §601 - surface those.
- **Retaliatory / SLAPP-prone disputes** (defamation against a public commentator, criticism of a public figure, consumer review platforms) → many states have anti-SLAPP statutes that allow the recipient to recover fees. Consult counsel before sending.
- **Patent infringement** → declaratory-judgment risk: a poorly aimed patent C&D can confer subject-matter jurisdiction and let the recipient sue for non-infringement in their preferred forum. Engage patent counsel.
- **Federal employment claims** (Title VII, FLSA, etc.) → statutory pre-suit procedures (EEOC charge) usually required; don't substitute a C&D.

## Required inputs (ask upfront)

1. **Jurisdiction (REQUIRED)** - country + state/province where the sender operates and where the recipient is located. **If unknown, ask once and refuse to generate if missing** - choice-of-law affects every threat-of-litigation phrase.
2. **Violation type** - trademark / copyright / IP / defamation / breach of contract / debt / trade-secret / harassment / other
3. **Sender** - name, role, contact info, attorney-of-record (if any)
4. **Recipient** - name, address (physical address required for legal effectiveness)
5. **Description of conduct** - specific facts, dates, URLs / quotations / receipts where applicable
6. **Demanded action** - cease specific conduct / pay amount / remove content / publish retraction / return materials
7. **Deadline** - typically 10-21 days for response; longer for complex demands
8. **Supporting evidence available** - registration certificates (trademark, copyright), contracts, witnesses, screenshots
9. **Tone preference** - professional (collaborative resolution) / firm (clear demand, no threats) / litigation-threat (explicit reservation of rights and intent to sue)
10. **Pre-litigation considerations** - has the sender consulted counsel? has the recipient been put on prior informal notice?

## Workflow

### Step 1: Choose the letter type

Match violation type to letter template (Step 4 has the canonical text for each).

### Step 2: Choose the tone

| Tone | When | Risk |
|---|---|---|
| **Professional** | First contact; relationship preservation matters; recipient may not realize the issue | Low; recipient may ignore |
| **Firm** | Second contact OR clear violation + uncooperative recipient | Moderate; sets up litigation if escalated |
| **Litigation-threat** | Last contact before filing; explicit deadline, explicit consequence | High - anti-SLAPP / UDAP / declaratory-judgment exposure if overreached |

If the user picks "litigation-threat" tone for any of these scenarios, **escalate the attorney-review warning prominently**:

- Defamation against a consumer reviewer or public commentator (anti-SLAPP risk)
- Patent claim (declaratory-judgment forum-shopping)
- Trademark claim against a similarly-named good-faith user (Lanham Act priority disputes)
- Debt collection across state lines (FDCPA + state UDAP)
- Anything where the underlying claim is genuinely contested

Reply to the user before generating: "You've requested a litigation-threat tone for a [scenario]. This category carries elevated risk of [specific risk]. I will generate the letter, but strongly recommend attorney review before sending. Proceed?"

### Step 3: Confirm the legal theory

For each violation type, ask the user to confirm one factual element - this is a sanity check, not legal advice:

- **Trademark**: do you have a registered mark (Reg No.) OR can you show priority of use in commerce?
- **Copyright**: do you own the work or have an exclusive license? Is it registered? (Registration is prerequisite for statutory damages and attorneys' fees in US.)
- **Defamation**: is the alleged statement (a) false, (b) of fact (not opinion), (c) "of and concerning" the sender, and (d) published to a third party? Are damages provable? In US, public-figure plaintiffs must show "actual malice" (NYT v. Sullivan).
- **Breach of contract**: is the contract in writing? Is the alleged breach material? Has the sender performed its own obligations?
- **Debt**: is there a written agreement or invoice trail? Is the debt within statute of limitations (varies by state, typically 3-6 years)?

If the user cannot answer the basic element check, refuse to generate the litigation-threat tone and downgrade to professional tone with a "let's discuss" frame.

### Step 4: Generate the letter - verbatim canonical templates

Common header (all letter types):

```
[SENDER LETTERHEAD]
[SENDER NAME]
[SENDER ADDRESS]
[SENDER PHONE / EMAIL]

[DATE]

VIA [CERTIFIED MAIL - RETURN RECEIPT REQUESTED, AND VIA EMAIL]

[RECIPIENT NAME]
[RECIPIENT ADDRESS]
[RECIPIENT EMAIL, if known]

Re: [ONE-LINE SUBJECT - e.g., "Notice of Trademark Infringement - [MARK]" or "Demand for Payment - Invoice [NUMBER]"]

Dear [RECIPIENT NAME OR "Sir or Madam"]:
```

#### A. Trademark cease-and-desist

```
This firm / company is the owner of the trademark [MARK] (the "Mark"), [registered with the United States Patent and Trademark Office, Reg. No. [NUMBER], for [GOODS/SERVICES] in International Class [NUMBER] / used continuously in commerce since [DATE] in connection with [GOODS/SERVICES]]. The Mark is well-known to consumers in connection with [BRIEF DESCRIPTION OF SENDER'S BUSINESS].

It has come to our attention that you are using the [allegedly infringing mark / domain / business name] [DESCRIBE - e.g., "GREEN LEAF COFFEE" at greenleafcoffee.com and on social media] in connection with [SIMILAR GOODS/SERVICES]. Specifically:

[FACTS - dates, URLs, screenshots referenced, point of first observed use]

This use is likely to cause confusion, mistake, or deception as to the source, sponsorship, or affiliation of your goods or services with ours. It accordingly constitutes (a) trademark infringement under [15 U.S.C. §1114 (registered) / §1125(a) (unregistered)] and (b) unfair competition under applicable federal and state law.

We demand that you:
1. Immediately cease all use of [INFRINGING MARK / DOMAIN / NAME] in connection with [GOODS/SERVICES];
2. Remove all uses from your website, marketing materials, social-media accounts, and other materials by [DEADLINE - e.g., 14 days];
3. Confirm in writing your compliance with the foregoing by [DEADLINE]; and
4. Identify all goods, marketing materials, and inventory bearing the infringing mark and confirm their disposition.

[Litigation-threat tone only - add:]
If we do not receive your written confirmation of compliance by [DEADLINE], we will pursue all available legal remedies, including injunctive relief, damages (including the disgorgement of profits and statutory damages of up to $200,000 per counterfeit mark per type of goods or services for willful infringement under 15 U.S.C. §1117), and attorneys' fees, without further notice.

This letter is sent without prejudice to any other rights or remedies available to us, all of which are expressly reserved.

Sincerely,

[NAME, TITLE]
```

#### B. Copyright cease-and-desist (where DMCA does not apply / has failed)

```
This [firm / company] is the owner of the copyright in the work titled [WORK TITLE], a [TYPE - e.g., photograph / article / software / video] first published on [DATE] [, registered with the U.S. Copyright Office under Reg. No. [NUMBER]].

It has come to our attention that you have reproduced, distributed, and/or publicly displayed our copyrighted work without authorization. Specifically:

[FACTS - URL where infringing copy appears, date observed, screenshots / archival captures attached]

This use constitutes copyright infringement under 17 U.S.C. §501.

We demand that you:
1. Immediately cease all use, reproduction, distribution, and display of the work;
2. Remove all copies from your website, server, social-media accounts, and any other location;
3. Provide a written certification of removal by [DEADLINE]; and
4. Identify any third parties to whom you have distributed the work.

[Litigation-threat tone only - add:]
The work [is registered / will be registered prior to filing suit, as required by 17 U.S.C. §411(a) per Fourth Estate Public Benefit Corp. v. Wall-Street.com (2019)]. If we do not receive your confirmation of compliance by [DEADLINE], we will pursue all available remedies, including injunctive relief, statutory damages of up to $150,000 per work for willful infringement (17 U.S.C. §504(c)), actual damages and disgorgement of profits, and attorneys' fees (17 U.S.C. §505).

This letter is sent without prejudice to any other rights or remedies, all of which are expressly reserved.

Sincerely,

[NAME, TITLE]
```

#### C. Defamation cease-and-desist

⚠️ **HIGH ANTI-SLAPP RISK** - surface verbatim before generating:

> Defamation C&Ds are frequently the subject of anti-SLAPP motions and counter-suits. A statement that is opinion, fair comment, substantially true, or about a public figure without "actual malice" is not defamatory. If your basis is contested, attorney review is essential before sending.

```
This [firm / company] / I represent [SENDER]. It has come to our attention that on [DATE] you published the following statement[s]:

[QUOTE THE STATEMENT(S) VERBATIM, with URL / location / publication]

The statement[s] are false. The truth is: [FACTUAL CORRECTION]. The statement[s] have caused [or are likely to cause] [SPECIFIC HARM - lost business, damaged reputation, etc.].

We demand that you:
1. Immediately remove the statement[s] from [PLATFORM(S)];
2. Publish a correction or retraction at the same location with reasonable prominence;
3. Cease making any similar statements; and
4. Provide written confirmation of compliance by [DEADLINE].

[Litigation-threat tone only - add:]
If we do not receive your confirmation by [DEADLINE], we will pursue all available remedies, including damages for defamation, defamation per se, and tortious interference, and injunctive relief.

This letter is sent without prejudice. All rights are expressly reserved.

Sincerely,

[NAME, TITLE]
```

#### D. Breach-of-contract cease-and-desist (e.g., NDA, non-compete, license)

```
This [firm / company] is a party to the [Agreement Name] dated [DATE] between [SENDER] and you (the "Agreement"). Under [Section X] of the Agreement, you agreed [QUOTE OR PARAPHRASE THE OBLIGATION].

In breach of that obligation, you have:

[FACTS - dates, conduct, evidence]

We demand that you:
1. Immediately cease the conduct described above;
2. Return [or destroy, certified in writing] all [confidential information / company property / specified materials];
3. Confirm in writing that you have done so by [DEADLINE]; and
4. [If applicable: identify all third parties to whom you have disclosed our confidential information].

[Litigation-threat tone only - add:]
If we do not receive your confirmation by [DEADLINE], we will pursue all available remedies, including [injunctive relief / damages / disgorgement] and attorneys' fees as provided in [Section X / applicable law].

This letter is sent without prejudice. All rights under the Agreement and at law are expressly reserved.

Sincerely,

[NAME, TITLE]
```

#### E. Demand for payment (B2B / first-party debt only - see warnings)

```
This [firm / company] is owed the amount of $[AMOUNT] for [DESCRIPTION OF GOODS/SERVICES / INVOICE(S) NUMBER(S)], originally due on [DATE]. Despite [PRIOR CONTACT - invoice sent, follow-up sent, etc. - list dates], the amount remains unpaid.

We hereby demand payment in full of $[AMOUNT], plus accrued interest of $[INTEREST] (if applicable per the parties' agreement), within [DEADLINE - typically 14-30 days] of the date of this letter.

Payment may be made by:
[WIRE / ACH / CHECK INSTRUCTIONS]

[Litigation-threat tone only - add:]
If full payment is not received by [DEADLINE], we will [pursue collection / file suit / refer the matter to counsel for collection]. We may also report the delinquency to commercial credit bureaus.

[State-UDAP cautions to consider including / surfacing for attorney review:]
- California Rosenthal Fair Debt Collection Practices Act (Civ. Code §1788 et seq.) extends to first-party creditors for many practices.
- New York GBL §§ 600 et seq. and FDCPA-analog state statutes regulate collection practices.
- Avoid statements that the unpaid debt will be "reported to your credit" unless the creditor actually furnishes data to consumer credit reporting agencies; doing so for B2B credit is acceptable.
- Avoid threats of action that the creditor does not intend to or cannot legally take (FDCPA §1692e - even where FDCPA does not apply, state UDAP claims do).

This letter is sent without prejudice. All rights are reserved.

Sincerely,

[NAME, TITLE]
```

### Step 5: Add evidence section

Below the demand, attach or list:

- Trademark registration certificate, if any
- Copyright registration certificate, if any
- Original contract, if breach
- Invoices / payment history, if debt
- Screenshots / archive captures (Wayback, archive.today timestamps)
- Photos, witness statements (if applicable)

### Step 6: Reservation of rights and signature block

```
Nothing in this letter is or shall be construed as a waiver of any of [SENDER]'s rights or remedies, all of which are expressly reserved.

Sincerely,

___________________________
[SENDER NAME]
[TITLE]
[FIRM / COMPANY]
[ADDRESS]
[EMAIL] | [PHONE]

cc: [ATTORNEY OF RECORD, if any]
```

### Step 7: Save and CYA reminder

Save to `build_report_path("business-legal", "cease-desist-<recipient>-<date>.md")`.

Before the user sends, surface a final CYA block:

> **Before sending:**
> 1. Have an attorney review high-stakes versions (defamation, patent, anti-SLAPP-prone, multi-state debt). The cost of an attorney review is typically $200-$1,000; the cost of a counter-suit or anti-SLAPP fee award is $5,000-$50,000+.
> 2. Send via certified mail with return receipt (creates evidence of delivery) AND email (creates timestamp).
> 3. Keep a copy with the postal receipt and email send confirmation.
> 4. Do not negotiate by phone after sending - every communication may be evidence; route responses to the address in the letter.
> 5. Calendar the deadline; act on it (filing suit, escalating) or the threat erodes credibility.

## Output footer (REQUIRED on every generated document)

End every generated cease-and-desist letter with this block, verbatim:

```
---
**DRAFT - NOT LEGAL ADVICE**

This document was generated as a starting template. It has not been reviewed by an attorney and may not comply with applicable law in your jurisdiction. Before signing, distributing, or relying on this document, you must:

1. Have a qualified attorney licensed in your jurisdiction review and revise it.
2. Verify all clauses are enforceable under applicable law.
3. Confirm it fits your specific situation, parties, and use case.

Generated by Wayland business-legal plugin. No warranty, express or implied.
```

---

> _Templates only - not legal advice. C&Ds carry counter-suit and anti-SLAPP risk - high-stakes versions should be attorney-reviewed before sending._
