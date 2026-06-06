---
name: probate-process-explainer
description: |
  Explains the probate process at a literacy level, covering what probate is, when it
  applies, the typical sequence and timeline, what assets go through probate vs. those
  that bypass it, and common terminology. Produces a process overview and question list
  for attorney consultation.
  Use when the user asks about probate, what happens to assets after death, how long
  probate takes, whether an estate needs to go through probate, or probate terminology.
  Do NOT use for navigating a specific probate case, providing legal advice about probate
  disputes, or executor-specific duties (use executor-responsibilities-guide instead).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "estate-planning legal-literacy guide step-by-step"
  category: "legal-civic"
  subcategory: "estate-planning"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "intermediate"
---
# Probate Process Explainer

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand legal concepts and processes. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Laws vary significantly by jurisdiction and change over time. Always consult a qualified attorney licensed in your jurisdiction for advice on any specific legal matter affecting you.

---

## When to Use

**Use this skill when:**
- A user asks what probate is, how it works, or why it exists -- including someone who just experienced a death and is trying to understand what happens next
- A user wants to understand the sequence, timeline, and cost range for a typical probate proceeding
- A user asks which assets go through probate and which bypass it (the most common source of confusion in estate administration)
- A user asks about specific probate terminology they encountered in a document, a court notice, or a conversation with an attorney (letters testamentary, intestate succession, ancillary probate, etc.)
- A user asks whether an estate might qualify for simplified or streamlined probate procedures (small estate affidavits, summary administration, independent administration)
- A user wants to understand the difference between dying with a will (testate) and dying without one (intestate) in the context of what the court does
- A user asks generally about how probate can be avoided through advance planning -- to understand the options conceptually before meeting with an estate planning attorney
- A user received a notice from a probate court (notice to creditors, notice to beneficiaries) and does not understand what it means or what to do with it

**Do NOT use when:**
- A user is currently navigating an active probate case and needs guidance on specific decisions -- direct them to a licensed probate attorney in their jurisdiction
- A user asks about specific executor duties, executor liability, or the mechanics of administering an estate (use `executor-responsibilities-guide`)
- A user asks about trust administration -- what trustees do, how trusts are wound down, or how a trust compares to a will as a planning document (use `trust-basics-explainer`)
- A user asks about contesting a will, challenging an executor's decisions, or removing an executor -- these are adversarial legal proceedings requiring specialized counsel
- A user asks about estate tax, gift tax, or the generation-skipping transfer tax in the context of planning around them (use `estate-tax-fundamentals` or refer to a tax attorney)
- A user asks about Medicaid estate recovery -- the process by which a state claws back benefits paid for long-term care (use `medicaid-estate-recovery-explainer`)
- A user asks about specific state probate code sections or wants to know whether a particular asset is probate property in their specific jurisdiction without caveat -- always frame jurisdiction-specific answers as general guidance requiring local verification

---

## Process

### Step 1: Orient the User to What Probate Is and Why It Exists

Begin by establishing a clear mental model. Most users arrive with misconceptions -- they believe probate is a punishment for poor planning, that a will "avoids" probate, or that probate is inevitably slow and expensive.

- Define probate precisely: it is the court-supervised legal process that (a) authenticates a will, (b) appoints a fiduciary to manage the estate, (c) provides a mechanism for creditors to make claims, and (d) oversees the transfer of assets to rightful heirs or beneficiaries
- Emphasize what probate is NOT: it is not triggered by death itself, but by the presence of probate assets -- assets that have no automatic transfer mechanism outside of court
- Explain the three legitimate functions probate serves: protecting creditors from being skipped over, protecting beneficiaries from an executor acting in bad faith, and creating a clear public record of ownership transfer
- Clarify the will misconception immediately: a will does not avoid probate -- it is, in fact, a document that only operates THROUGH probate. A will names the executor and directs distribution, but the court is still the supervising authority. If a user thinks their loved one "had a will so probate isn't needed," correct this gently but clearly
- Note that probate is a state-law-governed process -- there is no federal probate system. Every state (and Washington D.C.) has its own probate code, court structure, filing fees, and procedural rules. Some states use the Uniform Probate Code (UPC), which creates a more streamlined process; others have traditional, more formal probate procedures

### Step 2: Determine Whether Probate Applies to the User's Situation

This is the most important analytical step. Before explaining the full process, help the user understand whether their situation even requires formal probate. The answer turns on one question: are there probate assets?

**Define a probate asset precisely:**
A probate asset is one that (a) was owned solely by the deceased at the time of death, and (b) has no legally effective automatic transfer mechanism -- no surviving co-owner with right of survivorship, no named beneficiary, and no trust to receive it.

**Walk through the asset-by-asset analysis using this framework:**

| Asset Class | Probate Trigger | Non-Probate Trigger |
|---|---|---|
| Real property | Titled solely in decedent's name | Joint tenancy with right of survivorship (JTWROS), tenancy by the entirety, community property with right of survivorship, or held in trust |
| Bank accounts | Solely owned, no POD designation | Joint account with survivorship, POD (payable-on-death) designation, or in trust |
| Brokerage/investment accounts | Solely owned, no TOD designation | TOD (transfer-on-death) designation, JTWROS, or in trust |
| Retirement accounts (IRA, 401k, 403b) | No named beneficiary, or estate is named beneficiary | Named individual beneficiary (passes by contract, not probate) |
| Life insurance proceeds | Estate is named beneficiary | Named individual beneficiary (pays directly) |
| Vehicles | Titled solely to decedent | Varies by state -- some have TOD title options |
| Business interests (LLC, partnership, corporation) | No buy-sell agreement or succession mechanism | Buy-sell agreement, operating agreement with succession clause, or interest held in trust |
| Personal property (furniture, jewelry, art) | No specific transfer mechanism | Held in trust; some states allow transfer-on-death for specific items |

**Identify the threshold for "small estate" procedures:**
Every state has some form of simplified administration for small estates. The threshold varies dramatically. The user should check their specific jurisdiction, but the general landscape is:
- Very low threshold states (under $50,000): typically requires a small estate affidavit signed under oath by an heir; no court appearance needed; creditor wait period still often applies
- Mid-range threshold states ($50,000-$100,000): may allow summary administration or a simplified probate petition with reduced court oversight
- High threshold states ($100,000-$200,000+): California's threshold was raised to $184,500 (indexed for inflation); allows affidavit procedure 40 days after death
- Some states measure the threshold against probate assets only, not total estate value (so a $500,000 estate with a $40,000 house and everything else in beneficiary-designated accounts might still qualify)
- Wisconsin, Colorado, and other UPC states allow "universal succession" -- a procedure where heirs can take assets without formal probate if creditors are properly addressed

### Step 3: Walk Through the Full Probate Sequence Step by Step

Present the process as a linear sequence with realistic time estimates. Be explicit that steps overlap in practice.

**Step 1 -- Filing the petition (Week 1 to 4):**
- The named executor (or any interested party if there is no will) files a petition for probate with the probate division of the superior or district court in the county where the decedent was domiciled at death
- Filing fees vary by jurisdiction: typically $150 to $400 for initial filing, with additional fees for publication, certified copies, and final accounting
- The petition includes: the death certificate, the original will (if one exists), a preliminary asset list, and information about heirs and beneficiaries
- The court assigns a case number and schedules a hearing (in formal probate states) or issues an order without a hearing (in informal/UPC states)
- In some jurisdictions, if a named executor does not file within 30 days of the death, any interested party may petition the court and priority rules determine who the court appoints

**Step 2 -- Validating the will (Weeks 2 to 6):**
- The court examines whether the will was executed with the formalities required by state law: typically two disinterested witnesses who signed in the testator's presence, the testator's signature, and in some states a notary
- A "self-proving affidavit" attached to the will (signed before a notary at the time of execution) allows the court to validate the will without calling witnesses -- this is why estate planning attorneys recommend it
- If there is no will, the court declares the estate intestate and applies the state's intestate succession statute to determine who inherits
- Holographic wills (handwritten, unwitnessed) are valid in about 25 states including Texas, California, and Virginia, but are more vulnerable to challenge

**Step 3 -- Appointing the executor or administrator (Weeks 2 to 8):**
- The court issues Letters Testamentary (with a valid will) or Letters of Administration (without a will, appointing an administrator)
- These letters are the executor's legal power of attorney -- without them, banks, title companies, and financial institutions will not act on the executor's instructions
- The executor typically must obtain a surety bond unless the will waives the bond requirement (most attorney-drafted wills include this waiver to save the estate money -- bond premiums typically run 0.5% to 1.0% of the bonded amount annually)
- Order 10 to 15 certified copies of the Letters -- each institution typically requires its own original certified copy

**Step 4 -- Notifying creditors and beneficiaries (Month 1 to 3):**
- The executor must publish a notice to creditors in a newspaper of general circulation in the county -- this is a legal requirement in virtually every jurisdiction
- Publication cost: typically $50 to $300 for a 3-to-6 week run
- The creditor claim period runs from the date of first publication: typically 3 months (California: 4 months from appointment or 60 days from actual notice to creditor, whichever is later; Florida: 3 months; New York: 7 months; Texas: 4 months)
- Individual notice must be sent to known or reasonably ascertainable creditors -- the Tulsa Professional Collection Services v. Pope Supreme Court case established that mere publication is insufficient for known creditors; they must receive actual notice
- Named beneficiaries and legal heirs must be individually notified of the probate proceeding within a specific window (30 to 60 days of appointment in most states)

**Step 5 -- Inventorying and appraising assets (Months 2 to 5):**
- The executor compiles a complete inventory of all probate assets as of the date of death, with fair market value (date-of-death valuations, not current value)
- Real property: typically requires a certified appraisal by a licensed real estate appraiser (appraisal fees: $300 to $600 for residential, more for commercial)
- Investment accounts: date-of-death statement from custodian
- Business interests: often require a formal business valuation (cost: $3,000 to $10,000+ depending on complexity)
- Personal property: certified personal property appraiser for jewelry, art, collectibles, or antiques with meaningful value; self-valuation acceptable for ordinary household goods
- The inventory is filed with the court in most jurisdictions; some states (Texas under independent administration) have reduced filing requirements
- The stepped-up basis rule under IRC Section 1014 means that inherited assets receive a new cost basis equal to fair market value at the date of death -- this is why accurate date-of-death appraisals matter for eventual capital gains tax purposes when heirs sell

**Step 6 -- Paying debts and expenses (Months 3 to 9):**
- Debts are paid in a statutory priority order -- the order varies by state, but the general hierarchy is:
  1. Costs of administration (attorney fees, executor compensation, court costs)
  2. Funeral and burial expenses (typically capped at a reasonable amount)
  3. Debts and taxes owed to federal government
  4. Medical expenses of last illness (some states)
  5. Debts and taxes owed to state government
  6. General creditor claims
  7. Subordinated or disputed claims
- If the estate is insolvent (debts exceed assets), lower-priority creditors get nothing -- the executor must follow the priority order exactly or face personal liability
- The executor has the right to contest creditor claims that appear invalid -- the probate court adjudicates disputed claims
- Secured debts (mortgage, car loan) are handled differently: the executor can pay them off, allow the beneficiary to assume them, or sell the asset and pay the lender from proceeds

**Step 7 -- Filing tax returns (Months 4 to 15):**
- Final individual income tax return (Form 1040): due April 15 of the year after death (or October 15 with extension), covering income from January 1 through date of death
- Estate income tax return (Form 1041, Fiduciary Income Tax): required if the estate earns $600 or more in income during administration (interest, rent, dividends from estate assets)
- Federal estate tax return (Form 706): required only if the gross estate exceeds the federal exemption amount ($13.61 million per individual in 2024 -- this amount is scheduled to drop by approximately half in 2026 when the Tax Cuts and Jobs Act provisions sunset unless Congress acts)
- State estate tax: 12 states and Washington D.C. have their own estate taxes with lower exemption thresholds (Massachusetts and Oregon start at $1 million; Washington state starts at $2.193 million)
- Inheritance tax: 6 states (Iowa, Kentucky, Maryland, Nebraska, New Jersey, Pennsylvania) impose inheritance tax -- paid by the beneficiary, not the estate, and typically exempt spouses and children in full

**Step 8 -- Distributing assets to beneficiaries (Months 6 to 18):**
- Distribution cannot happen until the creditor claim period has closed and all known debts are paid or provided for
- Specific bequests are distributed first (e.g., "I give my diamond ring to my daughter Sarah"), then the residuary estate is distributed
- Real property transfers require a deed executed by the executor -- an executor's deed -- which is recorded in the county where the property is located
- Personal property transfers typically use a bill of sale signed by the executor
- Each beneficiary should sign a receipt and release acknowledging distribution and releasing the executor from further claims

**Step 9 -- Closing the estate (Months 9 to 24):**
- The executor files a final accounting with the court showing every dollar that came in (asset inventory) and every dollar that went out (expenses, debts, distributions)
- Beneficiaries receive a copy and have an opportunity to object
- The court reviews and issues an order approving the accounting, releasing the executor from liability, and formally closing the estate
- In some states (Florida, for example), supervised administration requires court approval at multiple stages; unsupervised or independent administration (common in Texas, Illinois, and UPC states) requires only a final closing statement

### Step 4: Explain Timeline and Cost Ranges in Concrete Terms

Users need realistic expectations to plan. Frame these as ranges with the key drivers of variance.

**Timeline drivers:**
- Creditor notification period length (set by statute -- cannot be shortened regardless of whether creditors actually appear)
- Whether real property must be sold (adds 2 to 6 months)
- Tax return deadlines that do not align with the probate schedule
- Court calendar congestion (probate courts in Los Angeles County or Cook County, Illinois can add months just in scheduling)
- Whether the will is contested (adds 6 months to several years)
- Whether estate tax is owed (Form 706 extends timeline; estate tax is due 9 months after death but extensions are available)

**Cost structure and ranges:**

| Cost Component | Typical Range | Notes |
|---|---|---|
| Court filing fees | $150 -- $1,000 | Varies by state and sometimes by estate value |
| Publication fees | $50 -- $300 | Required creditor notice publication |
| Attorney fees | 1% -- 4% of estate value, or hourly at $200 -- $500/hr | Some states allow "statutory fees" as a percentage; others require hourly |
| Executor compensation | 1% -- 4% of estate value, or as set by will | Most states have a statutory fee schedule; family members often waive compensation |
| Appraisal fees | $300 -- $10,000+ | Depends on asset types |
| Surety bond (if required) | 0.5% -- 1.0% annually | Often waived in the will |
| CPA/tax professional | $500 -- $5,000+ | Depends on complexity |
| Total (rough estimate) | 2% -- 8% of estate value | Simple estates trend lower; complex, contested, or high-value estates higher |

Note for states with statutory attorney and executor fees (California Probate Code Section 10800-10810 as an example):
- California's statutory attorney fee: 4% of first $100,000; 3% of next $100,000; 2% of next $800,000; 1% on next $9 million -- applies to both attorney AND executor
- A $500,000 California estate triggers a statutory attorney fee of approximately $13,000 and an equivalent executor fee -- before any "extraordinary services" add-ons
- This is why California estates with significant real property often warrant trust-based planning

### Step 5: Define Key Probate Terminology in Context

Do not present a glossary in isolation. When a user asks about a term, anchor it to the process context where it appears.

**Core procedural terms:**
- **Probate estate:** The collection of assets subject to court-supervised administration -- only assets without automatic transfer mechanisms
- **Gross estate (for tax purposes):** A broader concept that includes probate and non-probate assets for estate tax calculation -- life insurance, retirement accounts, and jointly held property are included even though they bypass probate
- **Decedent:** The person who died
- **Testator/testatrix:** The person who made a will (testatrix is the feminine form, increasingly obsolete in modern usage)
- **Testate:** Dying with a valid will
- **Intestate:** Dying without a valid will, or with a will that fails entirely (void wills, wills entirely revoked before death)
- **Executor/executrix:** Person named in the will to administer the estate (modern usage: executor regardless of gender; personal representative is used in UPC states)
- **Administrator:** Court-appointed fiduciary when there is no will; also used when the named executor cannot or will not serve
- **Personal representative:** The umbrella term used in Uniform Probate Code states covering both executors and administrators
- **Letters Testamentary:** Court document granting the executor authority to act on behalf of the estate; issued when there is a valid will
- **Letters of Administration:** Same authority document issued when there is no will
- **Letters of Special Administration:** Limited authority issued on an emergency basis before full probate is complete -- used to secure assets or continue a business

**Succession terms:**
- **Heir:** A person who inherits by operation of intestate succession law (a legal designation based on relationship, not named in a will)
- **Beneficiary:** A person named in a will or trust to receive assets
- **Devisee:** Specifically, a beneficiary of real property under a will
- **Legatee:** Specifically, a beneficiary of personal property under a will (the distinction is rarely used in modern practice)
- **Residuary beneficiary:** Receives the "residuary estate" -- everything left after specific bequests and debts are satisfied
- **Per stirpes:** A distribution method where a deceased beneficiary's share passes down to their descendants (their "branch" of the family tree) -- if a son predeceases the testator, the son's children split the son's share
- **Per capita:** A distribution method where assets are divided equally among surviving members of a class -- if a son predeceases, his share is redistributed among remaining beneficiaries, not to his children
- **Intestate succession:** The state's default inheritance rules when there is no will -- typically: spouse first, then children, then parents, then siblings, then more distant relatives; exact shares vary significantly by state
- **Elective share (forced share):** A surviving spouse's right to claim a minimum share of the estate regardless of what the will says -- typically one-third to one-half; prevents disinheritance of a spouse

**Document and procedural terms:**
- **Holographic will:** A handwritten, unwitnessed will valid in approximately 25 states
- **Nuncupative will:** An oral will; valid only in very limited circumstances (imminent death, limited property value) in a small number of states
- **Codicil:** An amendment to an existing will; must be executed with the same formalities as the original
- **Pour-over will:** A will designed to "catch" assets not in a trust and direct them into the trust at death -- typically used alongside a revocable living trust
- **Self-proving affidavit:** A notarized statement by the testator and witnesses attached to the will confirming proper execution -- avoids the need to track down witnesses during probate
- **Ancillary probate:** A second probate proceeding required in a state other than the decedent's domicile when the decedent owned real property in that other state
- **Small estate affidavit:** A sworn statement used to claim estate assets in simplified proceedings below the state's threshold -- no court appearance required in most cases
- **Summary administration:** A streamlined probate process available in some states (Florida uses this term for estates that have been open 2+ years or have assets under a set threshold)
- **Independent administration:** A form of probate used in Texas, Illinois, and other states where the executor can act without court approval at each step, reducing time and cost significantly
- **Supervised administration:** Full court oversight at every stage; required if the will mandates it, if there are disputes, or if a court determines oversight is needed to protect beneficiaries

### Step 6: Address Intestate Succession When Relevant

When a user mentions no will exists, explain intestate succession clearly.

**The core principle:** When a person dies intestate, state law imposes a distribution scheme that reflects the legislature's best guess at what most people would want. It does not reflect anyone's actual wishes.

**Typical intestate succession hierarchy (varies by state):**
1. Surviving spouse (note: the spouse's share depends on whether there are children, whether the children are also the spouse's children, and the state's specific statute -- ranges from 100% to one-third)
2. Descendants (children, grandchildren) -- if no surviving spouse
3. Parents -- if no surviving spouse or descendants
4. Siblings -- if no surviving spouse, descendants, or parents
5. Grandparents -- if none of the above
6. Aunts, uncles, cousins -- continuing to more remote relatives
7. Escheat to the state if no heirs are found

**Key misconceptions to address:**
- A long-term unmarried partner receives NOTHING under intestate succession unless the state recognizes common law marriage (only about 9 states do) -- this is one of the most devastating consequences of dying without a will or trust
- Stepchildren do not automatically inherit from a stepparent who never legally adopted them
- Half-siblings inherit in intestate succession in most states but may receive different shares than full siblings depending on the state
- The intestate share for a surviving spouse varies wildly: in California (community property), the surviving spouse keeps their half of community property and inherits all of the decedent's separate property if there are no children; in New York, the spouse receives $50,000 plus one-half of the residue if there are children

### Step 7: Compile the Output and Generate the Attorney Question List

After presenting the process overview, generate a tailored question list for the user to bring to a probate attorney. The questions should be specific to the user's situation -- not generic. If the user has mentioned specific assets, a will or no will, and a state, incorporate those details.

The question list should cover:
- Whether the estate qualifies for simplified or expedited procedures in the jurisdiction
- The specific statutory creditor claim period and how it interacts with the timeline
- Whether any assets require an appraisal and at what standard (fair market value vs. assessed value)
- The attorney's fee structure (hourly vs. statutory vs. flat fee)
- Whether the will has a bond waiver and whether independent administration is available
- State-specific considerations (community property, state estate tax, specific asset types)
- Whether there are any creditors the executor already knows about and how to handle known claims before the claim period closes

---

## Output Format

Produce the following structured output. Tailor every table and every question to the user's specific situation. Do not generate generic placeholder questions.

---

```
## Probate Process Overview for [Decedent's Name / "This Estate"]

> This overview provides general legal literacy information. It is not legal advice.
> Laws vary by jurisdiction. Consult a probate attorney licensed in [state] for guidance
> on this specific estate.

---

### Section 1: Asset Analysis -- Probate vs. Non-Probate

| Asset | Estimated Value | Probate? | Reason | Immediate Action Needed |
|---|---|---|---|---|
| [Asset 1 -- e.g., primary residence at 123 Main St] | $[value] | Yes/No | [Brief reason] | [Action] |
| [Asset 2 -- e.g., Wells Fargo checking account] | $[value] | Yes/No | [Reason] | [Action] |
| [Asset 3 -- e.g., IRA at Fidelity] | $[value] | Yes/No | [Reason] | [Action] |
| [Asset 4] | $[value] | Yes/No | [Reason] | [Action] |
| **Estimated Probate Estate Total** | **$[total]** | -- | -- | -- |
| **Estimated Non-Probate Total** | **$[total]** | -- | -- | -- |

**Simplified Procedure Eligibility:** [Yes / No / Possibly -- depends on jurisdiction threshold]
Threshold in [state]: approximately $[amount]. This estate appears to [qualify / not qualify].
Verify the current threshold with a local probate attorney.

---

### Section 2: Probate Sequence and Timeline

| Step | Action | Who Is Responsible | Estimated Timeframe | Notes |
|---|---|---|---|---|
| 1 | File petition with [county] probate court | [Executor name or "person filing"] | Week 1-4 | File in [county], [state] -- where decedent was domiciled |
| 2 | Court validates will | Court | Weeks 2-6 | Will has [/does not have] a self-proving affidavit |
| 3 | Executor appointed; Letters Testamentary issued | Court | Weeks 2-8 | Order [10-15] certified copies |
| 4 | Notify beneficiaries and publish creditor notice | Executor | Months 1-2 | Creditor claim period: [X months] in [state] |
| 5 | Inventory and appraise probate assets | Executor | Months 2-5 | Real property appraisal needed; 401(k)/IRA statements for date-of-death value |
| 6 | Pay valid creditor claims and administration expenses | Executor | Months [3-9] | Priority order required by [state] law |
| 7 | File final income tax return and estate income tax return (Form 1041 if needed) | Executor / CPA | By [April 15 of following year] | Check whether estate income exceeds $600 |
| 8 | Distribute assets to beneficiaries per will or intestate succession | Executor | Months [6-18] | After creditor period closes and debts paid |
| 9 | File final accounting; court closes estate | Executor / court | Months [9-24] | [State] allows independent/supervised administration |

**Estimated Total Duration:** [X to Y months] for this estate based on the assets described.
**Key Bottleneck:** The [X-month] creditor notification period in [state] is the minimum floor.

---

### Section 3: Terminology Reference for This Estate

| Term | What It Means in This Context |
|---|---|
| [Term 1 -- e.g., Letters Testamentary] | [Concrete explanation in context of this estate] |
| [Term 2 -- e.g., Residuary estate] | [Explanation] |
| [Term 3 -- e.g., Per stirpes] | [Explanation if distribution clause uses this term] |
| [Term 4 -- e.g., Small estate affidavit] | [Explanation if estate may qualify] |
| [Term 5 -- e.g., Ancillary probate] | [Explanation if decedent owned out-of-state real property] |

---

### Section 4: Estimated Costs

| Cost Component | Estimated Range | Notes |
|---|---|---|
| Court filing fees | $[range] | Based on [state] schedule |
| Publication fees (creditor notice) | $50 -- $300 | One-time cost |
| Attorney fees | $[range] | [Statutory / hourly / flat fee] structure in [state] |
| Executor compensation | $[range] | [May be waived by executor] |
| Real property appraisal | $300 -- $600 | Residential; more for commercial |
| Business valuation (if applicable) | $3,000 -- $10,000+ | Only if business interests are probate assets |
| CPA / tax professional | $500 -- $3,000 | For final return and Form 1041 |
| **Estimated Total (rough range)** | **$[low] -- $[high]** | Approximately [X]% of estimated probate estate |

*These are estimates only. Obtain actual fee quotes from a probate attorney and CPA in [state].*

---

### Section 5: Questions to Bring to a Probate Attorney

**About the Process and Timeline:**
1. Does this estate qualify for simplified/small estate procedures in [state], and if so, what is the procedure?
2. What is the exact creditor claim period after publication in [county/state], and when does the clock start?
3. Can this estate be administered as an independent administration (without court approval at each step), and does the will authorize it?
4. Is a surety bond required, or does the will waive the bond requirement?
5. Does [state] require formal filing of the asset inventory with the court, or is it maintained by the executor?

**About Costs:**
6. Do you charge hourly, on a flat fee, or on the statutory fee schedule -- and what is the all-in estimate for this estate?
7. Is executor compensation expected, and what is the statutory rate in [state]?
8. Will the estate need a certified appraisal for the [real property / business interest / other asset], and who do you recommend?

**About Specific Assets and Circumstances:**
9. [Asset-specific question -- e.g., "The house has a mortgage -- what happens to the monthly payments during probate and can the estate make those payments?"]
10. [Beneficiary or succession question -- e.g., "The will says per stirpes -- one of the named children predeceased my father. Does his share go to his children (my nieces)?"]
11. [State-specific question -- e.g., "My father owned a vacation cabin in Idaho but lived in Oregon -- does that trigger ancillary probate in Idaho?"]
12. [Tax question to verify scope -- e.g., "Is the estate large enough to require a Form 706 federal estate tax return, or will only the final Form 1040 and possibly a Form 1041 be needed?"]

---

### Section 6: Immediate Action Checklist

- [ ] Obtain [10-15] certified copies of the death certificate from the funeral home or county vital records office -- each institution will require its own copy
- [ ] Locate the original will (not a copy -- the court typically requires the original) and note where it is being stored
- [ ] Check whether the will is held by an attorney's office (call them immediately -- they may have the original)
- [ ] Determine who is named as executor in the will -- that person must file the petition or authorize someone to do so
- [ ] Do NOT distribute any estate assets, pay any personal debts with estate funds, or retitle any assets before the executor is formally appointed by the court
- [ ] Secure probate assets: maintain property insurance on real estate, continue mortgage payments from estate account, secure personal property
- [ ] Contact financial institutions to determine whether accounts have POD designations (ask for account title and any beneficiary designations on file)
- [ ] Contact retirement account administrators (IRA, 401k) to verify beneficiary designations and receive claim forms -- these are handled outside probate
- [ ] Life insurance: contact the insurer to begin the claims process -- this is outside probate if there is a named individual beneficiary
- [ ] Identify a probate attorney in [state/county where decedent was domiciled] and schedule a consultation within the next 2-3 weeks
- [ ] [Any situation-specific action -- e.g., "If the decedent had a safe deposit box, the executor will need the court's authorization before accessing it in most states"]
```

---

## Rules

1. **Never state that a will avoids probate.** This is the single most persistent misconception in estate administration. A will operates THROUGH probate -- it instructs the probate court how to distribute assets, but it does not replace the probate process. Always correct this if the user states or implies it.

2. **Never give jurisdiction-specific legal conclusions without attaching a verification caveat.** Probate is entirely state law. The creditor claim period, the small estate threshold, the statutory fee schedule, the requirement to file an inventory -- all vary by state and sometimes by county. Any time you cite a specific number or rule, note the jurisdiction it applies to and direct the user to verify with a local attorney.

3. **Never tell a user whether their specific estate "must" or "does not need to" go through probate.** That is a legal conclusion. Explain the framework, apply the analysis to the facts the user has shared, and then explicitly recommend verification by a probate attorney. Use language like "based on what you've described, this estate may qualify..." rather than "this estate does not need probate."

4. **Always distinguish between the probate estate and the gross estate for tax purposes.** A user may have a $3 million estate with $2.9 million in retirement accounts -- almost none of which goes through probate -- but the entire $3 million is included in the gross estate for estate tax purposes. Failing to make this distinction causes users to incorrectly believe trust-based planning eliminates estate tax exposure.

5. **Never suggest that non-probate transfers are inherently superior to probate.** Beneficiary designations can conflict with the estate plan (naming an ex-spouse), create problems for minor beneficiaries (a 401k paid directly to a minor requires a court-appointed guardian of the property unless a custodianship is established), and cause unintended disinheritance if not updated. Joint tenancy can expose assets to a co-owner's creditors. Every probate avoidance technique has trade-offs that require individual legal analysis.

6. **When the user mentions an intestate estate, always address the surviving spouse's elective share.** Many users do not know that a surviving spouse cannot be completely disinherited by a will in most states. The elective share (typically one-third to one-half of the augmented estate) exists regardless of what the will says. If the user seems surprised that a spouse was excluded or receives very little under the will, mention this concept and refer them to an attorney.

7. **Always note that ancillary probate applies to out-of-state real property.** When a user mentions real property in multiple states, immediately flag that real property is probated in the state where it sits, not where the deceased lived. This is a significant source of unexpected cost and delay, and it is often overlooked.

8. **Do not estimate attorney fees for a specific estate without extensive caveats.** Attorney fee structures vary: hourly billing, statutory percentage fees, flat fees, or hybrid arrangements. What appears to be a modest estate can generate high fees if there are disputes, tax issues, or complex assets. Present ranges only, note the primary fee structure models, and direct the user to obtain quotes from at least two local probate attorneys.

9. **If the user is currently in the creditor notification period and wants to know if they can start distributing assets, give a firm and clear answer: not yet.** Distributing assets before the creditor claim period closes and before all known debts are satisfied can expose the executor to personal liability for unpaid creditor claims. This is one of the most serious executor errors in probate. Refer the user to the `executor-responsibilities-guide` for executor-specific rules.

10. **Always note that the federal estate tax exemption is scheduled to change significantly in 2026.** The Tax Cuts and Jobs Act doubled the federal estate tax exemption in 2018. As of 2024, it stands at $13.61 million per individual ($27.22 million for a married couple with proper planning). Unless Congress acts, the exemption reverts to approximately $7 million per individual (inflation-adjusted) on January 1, 2026. Any user with an estate that could approach the post-sunset threshold should be directed to an estate planning attorney to review existing plans before year-end 2025.

---

## Edge Cases

### The Estate Is Intestate (No Will)

When the deceased died without a valid will, the core process is the same but two things change fundamentally: the court appoints an administrator instead of an executor, and distribution follows the state's intestate succession statute rather than the deceased's wishes.

**Key handling points:**
- Explain the priority of appointment for administrator: surviving spouse is typically first in priority, then adult children, then parents, then siblings -- varies by state
- Explain that "intestate" does not mean the estate avoids probate -- it goes through the same (or even more intensive) court oversight precisely because there is no will to guide the process
- Address the long-term partner situation explicitly: an unmarried partner has no intestate rights in states that do not recognize common law marriage. This is one of the most devastating situations in estate administration and requires prompt consultation with an attorney to understand any legal claims (equitable claims, co-ownership of property, etc.) the partner may have outside of intestate succession
- Note that determining heirs can itself require court proceedings -- if family relationships are unclear, a "determination of heirship" proceeding may be needed before administration can proceed
- If the user is surprised or upset by who inherits under intestate succession, express empathy, explain the law accurately, and note that these outcomes can be avoided in the future through proper estate planning

### The Estate Has Real Property in Multiple States (Ancillary Probate)

When the decedent owned real property in states other than their domicile, probate must be opened in each additional state where real property exists. This is called ancillary probate.

**Key handling points:**
- The primary (domiciliary) probate proceeds in the state where the decedent lived; ancillary proceedings are filed in each state with real property
- Each ancillary probate has its own filing fees, its own attorney, its own creditor notification rules, and its own timeline -- costs multiply accordingly
- Ancillary probate can be avoided prospectively by holding out-of-state real property in a trust or in an LLC (the LLC interest is personal property subject to domiciliary probate, not ancillary probate -- though LLCs have their own complications)
- If the user is currently dealing with ancillary probate, they will need a probate attorney in each state with real property -- the primary estate attorney may not be licensed in all relevant states and may need to coordinate with local counsel
- Vacation properties, timeshares, and rental properties are common triggers -- note specifically that timeshares can sometimes be surrendered to the developer rather than put through probate, depending on the timeshare agreement and the developer's policies

### The Estate Qualifies for a Small Estate Procedure

**Key handling points:**
- Small estate thresholds are measured differently across states: some measure total probate assets, some measure total estate assets, some exclude real property from the calculation
- Two common mechanisms: (1) small estate affidavit -- a sworn statement signed by the heir that allows them to claim assets directly from financial institutions without any court involvement; and (2) summary or simplified probate -- a streamlined court process faster than full probate
- The affidavit procedure typically has a waiting period of 30 to 45 days from date of death before it can be used (California: 40 days; Washington: 10 days; Texas: no formal waiting period but 30-day "small estate affidavit" procedure under Estates Code Section 205)
- Even if an estate qualifies for a small estate procedure, the executor still has legal obligations to creditors -- the small estate affidavit process does not eliminate creditor liability, it just simplifies the asset transfer mechanism
- A common mistake: attempting to use a small estate affidavit to transfer real property. Most states do not allow the affidavit procedure for real estate -- real property typically requires at minimum a simplified probate court order even if the estate is small. California, however, allows a court order (Probate Code Section 13100 et seq.) to transfer real property under $184,500

### The Will Is Being Contested

When a user mentions conflict about the will's validity or the fairness of its terms, provide factual information but redirect any strategic or case-specific questions to a probate litigation attorney.

**Key handling points:**
- Explain the legal grounds for a will contest: (1) lack of testamentary capacity -- the testator did not understand the nature of making a will, the extent of their property, or who their natural heirs were; (2) undue influence -- someone exerted such pressure on the testator that the will reflects their wishes, not the testator's; (3) fraud or duress; (4) improper execution -- the will was not signed or witnessed correctly; (5) revocation -- a later will supersedes the one filed
- A will contest is an adversarial legal proceeding within the probate case -- it requires specialized probate litigation counsel, not just a general estate attorney
- Contest deadlines are jurisdictionally specific and strict: California allows a contest before or within 120 days after the will is admitted to probate; Texas allows a contest within 2 years of probate; New York allows a contest within the time set by the court's order to show cause. Missing the deadline forecloses the right to contest
- During a pending will contest, asset distribution is typically halted -- the entire estate may be frozen for months or years while the dispute is resolved
- Note that "no-contest clauses" (in terrorem clauses) in wills penalize beneficiaries who file losing contests by forfeiting their inheritance -- most states enforce these with some exceptions (California enforces them only against contests filed without probable cause)

### The Decedent Owned a Business Interest

Business interests create some of the most complex probate scenarios. The estate may include a majority ownership stake in an LLC, a partnership interest, or shares in a closely held corporation.

**Key handling points:**
- The operating agreement of an LLC, the partnership agreement, or the shareholder agreement of a corporation may govern what happens to the interest -- it may restrict transfer, require a buyout, or give other owners a right of first refusal. These contractual provisions interact with (and sometimes override) the probate process
- A business interest must be valued as of the date of death -- this almost always requires a formal business valuation by a credentialed appraiser (Certified Valuation Analyst or Accredited Senior Appraiser) -- a process that takes 4 to 8 weeks and costs $3,000 to $15,000 for a small business
- The executor may need to actively manage or wind down the business during probate -- this creates liability exposure and ongoing operational decisions that require legal and business guidance beyond estate administration
- If the decedent's estate is the sole owner of an LLC and the operating agreement has no successor provisions, the LLC may be in a state of legal limbo -- court orders may be needed to authorize the executor to act on behalf of the LLC
- The estate may qualify for a federal estate tax deferral under IRC Section 6166, which allows estate tax attributable to a closely held business to be paid in installments over 14 years if the business interest exceeds 35% of the adjusted gross estate -- this is a significant planning mechanism relevant to any estate with a business

### The Surviving Spouse Is Not the Primary Beneficiary Under the Will

When the will disinherits or substantially limits the surviving spouse's share, the elective share (forced share) becomes critical.

**Key handling points:**
- All U.S. states except Georgia provide some form of spousal protection -- the surviving spouse has the right to claim a minimum share of the estate regardless of the will's terms
- The elective share varies: one-third in most states, one-half in others; some states use the Uniform Probate Code's "augmented estate" approach, which includes both probate and non-probate assets in calculating the elective share -- this prevents circumventing the elective share by transferring assets to trusts or using beneficiary designations
- The spouse must actively elect to take the elective share -- it is not automatic. In most states, the election must be filed within 6 months to 9 months of the executor's appointment; missing the deadline means the spouse is bound by the will
- Community property states (Arizona, California, Idaho, Louisiana, Nevada, New Mexico, Texas, Washington, Wisconsin) handle this differently -- each spouse already owns one-half of community property, so the "elective share" concept operates differently; the decedent can only will away their half of community property and all of their separate property
- This is a situation requiring immediate attorney consultation -- the elective share window is short and irrevocable

### The Estate Contains Digital Assets or Cryptocurrency

An increasingly common situation that probate courts are still developing rules to handle.

**Key handling points:**
- Digital assets include: cryptocurrency (Bitcoin, Ethereum, etc.), online brokerage accounts, digital photos, domain names, social media accounts, NFTs, loyalty points, subscription services, and online businesses
- Cryptocurrency held in a self-custody wallet (where the decedent controlled the private keys) is inaccessible without those private keys -- if no one knows the seed phrase or private key, the assets are permanently lost. There is no "customer service" for decentralized cryptocurrency
- The Revised Uniform Fiduciary Access to Digital Assets Act (RUFADAA) has been adopted in 47 states -- it provides a framework for executors to access digital accounts but requires a specific grant of authority in the will, a power of attorney, or a trust. Without it, Terms of Service agreements typically prohibit access and tech companies will not cooperate
- Cryptocurrency held on a centralized exchange (Coinbase, Kraken, etc.) is more accessible -- exchanges have a death claim process, but they require Letters Testamentary and the claim process can take months
- Include a specific question for the attorney about digital asset authorization language if the decedent had cryptocurrency or significant digital assets

---

## Example

**User Input:** "My mother passed away two weeks ago. She lived in Texas her whole life. She had a will that leaves everything to me and my brother equally. She owned a house (just her name on it), a checking account at a local bank, a small IRA, and some personal belongings. There's also a small life insurance policy. She had a mortgage on the house and some credit card debt. What happens with probate?"

---

## Probate Process Overview for Your Mother's Estate (Texas)

> This overview provides general legal literacy information about the Texas probate process.
> It is not legal advice. Texas law applies specifics that differ from other states.
> Consult a probate attorney licensed in Texas -- ideally in the county where your mother lived.
> I am sorry for your loss.

---

### Section 1: Asset Analysis -- Probate vs. Non-Probate

| Asset | Probate? | Reason | Immediate Action Needed |
|---|---|---|---|
| House (solely in her name) | **Yes** | Real property titled to the deceased requires probate to transfer title to you and your brother | Continue paying the mortgage from estate funds; maintain homeowner's insurance |
| Checking account (no POD designation assumed) | **Yes -- verify** | If no payable-on-death designation on file, this is a probate asset | Call the bank to ask whether a POD designation exists on the account |
| IRA | **Most likely No** | IRAs pass by beneficiary designation, not through probate | Contact the IRA custodian immediately -- verify who is named as beneficiary; if it is you and your brother, request claim forms |
| Life insurance policy | **Most likely No** | Life insurance with a named individual beneficiary pays directly to that person | Contact the insurance company -- if you and your brother are named beneficiaries, file the death claim now (outside of probate) |
| Personal belongings (furniture, clothing, etc.) | **Yes** | Personal property without a transfer mechanism | Inventory and secure; distribute after executor is appointed and debts are paid |

**Estimated Probate Assets:** Likely the house and checking account -- the two largest items to address through probate.

**Small Estate Procedure Eligibility:** Texas has a small estate affidavit procedure (Texas Estates Code Section 205.001) for estates where the total value of non-exempt personal property does not exceed $75,000 and the decedent had no real property. Because your mother owned a house, the standard small estate affidavit procedure likely does not apply. However, Texas offers a streamlined process called **independent administration** that significantly reduces court involvement -- more on this below.

---

### Section 2: How Texas Probate Actually Works (and Why Texas Is Different)

Texas is one of the most executor-friendly probate states in the country because of **independent administration**. Under Texas Estates Code Chapter 401, if the will authorizes independent administration (most Texas wills do), the executor can administer the entire estate -- pay debts, sell assets, distribute property -- without court approval at each step. This is faster and far less expensive than the supervised administration used in many other states.

The will needs to be admitted to probate in Texas within **4 years of the date of death** (Texas Estates Code Section 256.003). File before this deadline.

**The Texas Probate Sequence for Your Mother's Estate:**

| Step | Action | Who | Estimated Timeframe | Texas-Specific Notes |
|---|---|---|---|---|
| 1 | File application
