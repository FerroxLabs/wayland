---
name: beneficiary-review-guide
description: |
  Guides users through auditing beneficiary designations across all account types that
  carry them (retirement, insurance, payable-on-death, transfer-on-death). Identifies
  common conflicts between beneficiary designations and will provisions, and produces
  a reconciliation checklist for attorney review.
  Use when the user asks about reviewing beneficiaries, checking who inherits their
  accounts, or whether their beneficiary designations are up to date.
  Do NOT use for recommending specific beneficiary choices, providing tax advice on
  beneficiary strategies, or drafting legal documents.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "estate-planning legal-literacy checklist guide"
  category: "legal-civic"
  subcategory: "estate-planning"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "beginner"
---
# Beneficiary Review Guide

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand legal concepts and processes. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Laws vary significantly by jurisdiction and change over time. Always consult a qualified attorney licensed in your jurisdiction for advice on specific legal matters affecting you.

---

## When to Use

**Use this skill when:**
- The user asks about reviewing or updating their beneficiary designations on any account type
- The user wants to know which of their accounts carry beneficiary designations that override their will
- The user has experienced a major life event -- marriage, divorce, remarriage, birth of a child, adoption, death of a named beneficiary, disability of a named beneficiary -- and wants to audit whether their designations still reflect their intent
- The user is confused about the relationship between what their will says and what their account designations say, or believes the will controls everything
- The user wants to produce a structured checklist they can bring to an estate planning attorney
- The user asks what "payable on death," "transfer on death," "per stirpes," or "per capita" means in the context of account beneficiaries
- The user has recently inherited an account and wants to understand how beneficiary designation mechanics worked to deliver that asset to them
- The user is setting up a new account and wants to understand what beneficiary designation options are available to them

**Do NOT use when:**
- The user asks who they should name as a beneficiary -- this requires individualized legal and financial judgment; refer to an estate planning attorney and/or financial planner (see `will-preparation-checklist` for broader estate planning)
- The user is asking about tax optimization strategies for beneficiary designations, such as stretch IRA rules, the 10-year rule under the SECURE Act, or charitable remainder trust structures -- refer to `estate-tax-basics` or a tax advisor
- The user asks about creating or revising a will -- use `will-preparation-checklist`
- The user asks about trust beneficiaries, trust funding, or whether to use a trust as beneficiary -- use `trust-basics-explainer`
- The user is involved in a contested beneficiary claim, a dispute with a financial institution over a designation, or a wrongful beneficiary removal situation -- refer immediately to a licensed attorney
- The user needs help completing an actual beneficiary designation form -- direct them to the institution and suggest attorney review before submitting
- The user asks about Medicaid spend-down, Medicaid beneficiary rules, or public benefits planning -- refer to an elder law attorney

---

## Process

### Step 1: Anchor the User to the Core Principle Before Anything Else

Before collecting any account information, establish the foundational concept that drives everything else in this skill. Without this anchor, users tend to underestimate why this review matters.

- State clearly and specifically: beneficiary designations are contractual agreements between an account holder and a financial institution or insurer. They operate entirely outside the probate system and are not controlled by a will, a trust (unless the trust is named as beneficiary), or a court order -- unless the court order specifically amends the underlying contract.
- Use a concrete illustration: if a person writes a will in 2022 leaving their entire estate to their new spouse, but their 401(k) still has their sibling named as beneficiary from 2007, the sibling receives the 401(k) -- the will has no power over it.
- Explain the probate bypass: assets with valid beneficiary designations pass directly to the named beneficiary, typically within weeks, without court involvement, attorney fees, or public record. This is by design and is one of the primary benefits of proper designation.
- Explain what happens when it goes wrong: if no valid beneficiary is named (because none was ever designated, or because all named beneficiaries have predeceased the account holder), the asset typically defaults to the account holder's estate, entering probate and potentially losing the tax-deferral advantages of retirement accounts.
- Note the ERISA federal preemption issue early: employer-sponsored retirement plans (401(k), 403(b), 457(b), pension plans) are governed by the Employee Retirement Income Security Act of 1974 (ERISA), a federal law. ERISA preempts state laws that would otherwise automatically revoke a beneficiary designation upon divorce. This is a critical distinction that affects millions of people.

### Step 2: Build a Complete Account Inventory

Walk the user through every category of asset that carries beneficiary designations. Use a systematic category-by-category approach rather than asking generally, because users routinely forget account types.

**Employer-Sponsored Retirement Accounts:**
- 401(k) plans -- the most common employer plan; beneficiary forms are held by the plan administrator (often an HR department or a third-party recordkeeper such as Fidelity, Vanguard, Empower, or T. Rowe Price)
- 403(b) plans -- used by nonprofits, hospitals, universities, and school districts; same beneficiary mechanics as 401(k)
- 457(b) plans -- used by state and local government employees; unlike 401(k) and 403(b), governmental 457(b) plans are not subject to ERISA, which affects the spousal consent requirement
- Defined benefit pension plans -- may have beneficiary designations for survivor annuity provisions; the election of a joint-and-survivor annuity vs. a single-life annuity is effectively a beneficiary decision with permanent consequences
- Thrift Savings Plan (TSP) -- the federal government retirement plan for civilian and military employees; has its own beneficiary designation form (Form TSP-3) that must be on file directly with the TSP, not the employing agency

**Individual Retirement Accounts:**
- Traditional IRA -- beneficiary designated through the financial institution (brokerage, bank, mutual fund company); no spousal consent required to name a non-spouse, but community property states may require spousal acknowledgment
- Roth IRA -- same mechanics as Traditional IRA; Roth accounts have no required minimum distributions during the owner's lifetime, making beneficiary designation particularly important for wealth transfer
- SEP IRA -- typically held at a financial institution; treated identically to a Traditional IRA for beneficiary purposes
- SIMPLE IRA -- same as Traditional IRA for beneficiary purposes after the two-year participation period
- Inherited IRA -- if the user has already inherited an IRA, they can name their own beneficiaries; the SECURE Act of 2019 and SECURE 2.0 Act of 2022 significantly changed inherited IRA distribution rules

**Life Insurance:**
- Term life insurance -- primary and contingent beneficiaries named on the policy; can be updated by submitting a change-of-beneficiary form to the insurance company; the policy controls, not the will
- Whole life insurance -- same designation mechanics; note that some older whole life policies have irrevocable beneficiary designations that cannot be changed without the beneficiary's consent
- Universal and variable universal life -- same mechanics; if the policy has accumulated cash value, the death benefit beneficiary and any loan provisions interact
- Group life insurance through an employer -- often overlooked; beneficiary forms are held by the employer's HR department or benefits administrator, not by the insurance company directly
- Accidental death and dismemberment (AD&D) policies -- have separate beneficiary designations from life insurance; often bundled with group life but may have a separate form

**Annuities:**
- Fixed, variable, and indexed annuities -- beneficiary designated on the annuity contract; upon death during the accumulation phase, the death benefit (often the account value or a guaranteed minimum) passes to the named beneficiary
- Immediate annuities (single-premium immediate annuities, or SPIAs) -- if structured with a period-certain or joint-and-survivor feature, the remaining payments or continued payments pass to the named beneficiary; if structured as a life-only annuity, there is no death benefit

**Bank Account Transfer Mechanisms:**
- Payable-on-death (POD) designations on checking accounts, savings accounts, money market accounts, and certificates of deposit -- upon death, the account balance transfers directly to the named POD beneficiary; the bank requires a certified death certificate and beneficiary identification
- Joint accounts with right of survivorship (JTWROS) -- not technically a beneficiary designation, but achieves similar result; the surviving joint owner receives the account balance automatically; important to distinguish from tenants-in-common ownership, which does not have survivorship
- Totten trust accounts -- an older form of POD designation still used in some jurisdictions; functionally equivalent to a modern POD designation

**Securities and Investment Accounts:**
- Transfer-on-death (TOD) brokerage accounts -- the TOD registration on the account directs securities to transfer directly to the named beneficiary upon death; the beneficiary receives the securities at their stepped-up cost basis (for income tax purposes) as of the date of death
- TOD registration is available for individual stocks, bonds, and mutual funds held in street name at most major brokerages; it is not available on all account types (e.g., corporate or trust accounts cannot use TOD)
- I Bonds and EE Bonds (U.S. savings bonds) -- have beneficiary or co-owner designations registered directly with TreasuryDirect; older paper bonds may have handwritten beneficiary information that needs to be verified

**Real Property Mechanisms:**
- Transfer-on-death deeds (also called beneficiary deeds) -- available in approximately 30 states; allow real property to pass directly to a named beneficiary upon death without probate; must be recorded with the county recorder during the owner's lifetime to be valid
- Lady Bird deeds (enhanced life estate deeds) -- available in Florida, Michigan, Texas, West Virginia, and a few other states; allow the owner to retain full control during their lifetime, including the right to sell or mortgage without beneficiary consent, while still designating a death beneficiary
- Joint tenancy with right of survivorship in real property -- same survivorship mechanic as JTWROS bank accounts; not a beneficiary designation per se but achieves direct transfer

**Tax-Advantaged Health and Education Accounts:**
- Health Savings Account (HSA) -- has a beneficiary designation; if the named beneficiary is a spouse, the HSA transfers as the surviving spouse's own HSA with no tax consequence; if the beneficiary is anyone other than a spouse, the entire HSA balance becomes taxable income to that beneficiary in the year of the account holder's death
- Flexible Spending Accounts (FSA) -- generally do not have beneficiary designations; unspent balances typically revert to the employer
- 529 college savings accounts -- have a successor account owner designation (not a direct beneficiary in the traditional sense); the successor owner takes over the account and its obligations; some 529 plans also allow a named beneficiary of the account value upon death

### Step 3: Gather Current Designation Information for Each Account

For each account identified in Step 2, collect the following specific data points. Many users do not have this information readily available -- guide them on where to find it.

- **Primary beneficiary:** Full legal name, relationship to account holder, date of birth (required by some institutions), Social Security Number or Tax ID (held on file by the institution, not necessarily known by the account holder)
- **Contingent (secondary) beneficiary:** Same information as primary; contingent beneficiary receives the account only if all primary beneficiaries have predeceased the account holder or disclaim the inheritance
- **Per stirpes vs. per capita designation:** Per stirpes means the deceased beneficiary's share passes to their descendants; per capita means the deceased beneficiary's share is divided equally among surviving beneficiaries -- this is a critical distinction that most users have never considered
- **Date the designation was last updated:** Institutions retain this information; it can be requested by the account holder
- **Whether the designation is on file vs. presumed:** Many people believe they named a beneficiary but have no confirmation; institutional records control, not memory
- **Location of the designation form:** Physical or electronic copies should be maintained with estate documents

Guide users on how to retrieve current beneficiary information from each institution type:
- Employer retirement plans: Contact HR or the plan's recordkeeper directly; many major recordkeepers (Fidelity NetBenefits, Vanguard retirement, Empower) allow online beneficiary review
- IRAs and brokerage accounts: Log into the account online and navigate to account services or beneficiary settings; alternatively, call the institution's customer service line
- Life insurance: Contact the insurance company directly or work through the agent of record; request a written confirmation of current beneficiary designation
- Bank accounts: Visit a branch or call customer service; some banks allow online POD designation management

### Step 4: Apply the Life Event Screening Framework

Map the user's life history against a structured set of trigger events that commonly produce stale or incorrect designations. For each event identified, flag the accounts most likely to be affected.

**Marriage (initial or remarriage):**
- Under ERISA, a spouse automatically has rights to employer retirement plan death benefits unless the spouse signs a notarized waiver -- but this automatic right does not apply to IRAs, life insurance, or bank accounts
- In community property states, the spouse may have a community property interest in assets accumulated during marriage regardless of beneficiary designation
- After marriage, many people want to add their new spouse as primary beneficiary -- but may forget to update one or more accounts, particularly older accounts from previous employers (former employer 401(k) plans rolled to IRAs)

**Divorce:**
- This is the highest-urgency trigger event in beneficiary review
- Under federal ERISA law, divorce does NOT automatically revoke an ex-spouse's beneficiary designation on employer retirement plans; the Egelhoff v. Egelhoff case (U.S. Supreme Court, 2001) confirmed this -- only a qualified domestic relations order (QDRO) can divide retirement account interests under ERISA
- State divorce-revocation statutes: approximately 26 states have enacted laws that automatically revoke an ex-spouse's beneficiary designation upon divorce on IRAs, life insurance, and bank accounts -- but these laws vary significantly and were not uniformly applied before certain state adoptions; confirm the applicable state law
- A divorce decree or settlement agreement that requires one spouse to maintain the other as beneficiary on a life insurance policy (typically for child support or alimony security) creates a contractual obligation -- changing that beneficiary could be a breach of the decree
- Recommend: check designations on every account within 30 days of divorce finalization

**Birth or Adoption of a Child:**
- Parents typically want to add children as contingent beneficiaries (if the spouse is primary)
- Critical issue: naming a minor child directly as beneficiary creates significant complications -- minors lack legal capacity to receive large sums, a court-supervised guardianship of the estate may be required, assets may be managed by a court-appointed guardian until the child turns 18 (or 21 in some states), at which point the full amount is distributed to the young adult with no restrictions
- Better approach: consult an attorney about naming a custodian under the Uniform Transfers to Minors Act (UTMA) or establishing a trust as beneficiary -- but this determination is for the attorney, not this skill
- Flag the issue and recommend attorney consultation

**Death of a Named Beneficiary:**
- If a primary beneficiary predeceases the account holder and there is a contingent beneficiary, the contingent receives the account
- If there is no contingent beneficiary, the account typically defaults to the estate (probate)
- Per stirpes designation: if a named beneficiary has died and the designation says "per stirpes," the deceased beneficiary's share passes to their descendants (the account holder's grandchildren, for example) -- no change to the designation form is needed, but the account holder should confirm this is the desired outcome
- The account holder should update the designation to name a new beneficiary to avoid relying on per stirpes fallback

**Disability of a Named Beneficiary:**
- If a beneficiary has a disability and receives means-tested government benefits (Supplemental Security Income, Medicaid), inheriting an account outright could disqualify them from those benefits
- A Special Needs Trust (SNT) as beneficiary can preserve benefit eligibility -- flag this for attorney review
- This is a complex planning issue beyond this skill's scope; identify it and refer

**Significant Asset Changes:**
- A new employer means a new 401(k) plan -- requires a new beneficiary designation from day one
- Rollover of an old 401(k) to an IRA -- the old plan's beneficiary designation does NOT transfer to the new IRA; a new designation must be filed at the IRA custodian
- Purchase of life insurance -- requires completing beneficiary designation at policy inception
- Opening a new brokerage account -- TOD registration is typically optional and must be affirmatively elected

### Step 5: Flag Conflicts Between Designations and the Will

This step addresses the direct overlap between what a will says and what a beneficiary designation says. Use a side-by-side comparison framework.

Common conflict patterns to identify:

**Pattern 1 -- The "Everything to My Spouse" Will:**
- User's will leaves everything to their spouse, but their 401(k) from a prior employer names their parents as beneficiaries from before the marriage
- Result: parents receive the 401(k); will is irrelevant to that asset

**Pattern 2 -- The Equal Division Will:**
- User's will divides the estate equally among three children, but their life insurance names only one child as beneficiary
- Result: that one child receives the entire life insurance benefit; the will's equal division applies only to probate assets

**Pattern 3 -- The Trust-Based Estate Plan:**
- User's attorney has set up a revocable living trust to hold their estate; their will is a "pour-over will" intended to fund the trust
- If beneficiary designations name individuals rather than the trust, those assets pass outside the trust entirely, defeating the estate plan
- This is a particularly common and serious conflict; flag it prominently and recommend attorney review

**Pattern 4 -- The Outdated Charity:**
- User's will makes a specific bequest to a charity, but they also intended to name the charity as beneficiary on their IRA (which has tax advantages for charitable giving) -- they never updated the IRA designation
- The charity receives nothing from the IRA under the current designation

**Pattern 5 -- The Divorce Decree Conflict:**
- User's divorce decree requires maintaining their ex-spouse as life insurance beneficiary for 5 years post-divorce; user changed the designation to their new spouse; the ex-spouse could sue the estate for breach of contract
- Flag divorce decrees as required documents in the attorney review package

### Step 6: Build the Reconciliation Checklist

Compile all findings into a structured, attorney-ready document using the Output Format defined below. The checklist should be complete enough that an estate planning attorney can use it as a working document in a consultation -- saving the client time and money.

- List every account identified, even those with no issues, to create a complete baseline record
- Flag each account with a status indicator: OK (designation appears current and consistent with expressed intent), REVIEW (designation may be outdated or unclear), CONFLICT (designation directly contradicts will provisions or life event has occurred), URGENT (requires action before the next attorney appointment)
- For retirement accounts specifically, note whether ERISA applies (employer plans) or state law applies (IRAs), because the rules differ
- Include the date the audit was conducted so the user and attorney know when the baseline was established

### Step 7: Generate Targeted Attorney Review Questions

Based on the specific issues identified in the audit, generate a prioritized list of questions for the estate planning attorney. Generic questions waste consultation time; targeted questions based on the user's actual situation maximize the value of the attorney meeting.

Question categories to address:
- Jurisdiction-specific questions: which state law governs each account type? Has the user's state adopted divorce-revocation statutes?
- Divorce decree compliance: does the decree contain any beneficiary-related obligations?
- Minor beneficiary strategy: custodial account, UTMA, or trust-as-beneficiary?
- Disability beneficiary planning: is a Special Needs Trust needed?
- Trust funding: should the revocable trust be named as beneficiary on any accounts, and if so, which ones?
- Coordination of IRAs: which IRA beneficiary structure best aligns with the overall estate plan?
- Community property issues: does the spouse have rights that affect the designation?
- ERISA spousal consent: has the required spousal consent been obtained for naming a non-spouse on any employer plan?

### Step 8: Establish a Review Cadence and Maintenance Protocol

Beneficiary designation audits are not one-time events. Provide a concrete maintenance schedule.

- **Minimum annual review:** Set a recurring calendar reminder, ideally at the same time each year (tax season is often used because financial documents are already assembled)
- **Event-triggered review:** Within 30 days of any of these events: marriage, divorce, death of a beneficiary, birth or adoption of a child, major change in financial circumstances, moving to a new state, opening a new account, rolling over an old retirement account, purchasing new insurance
- **Document retention:** Keep a copy of each completed and confirmed beneficiary designation form in the estate document binder or secure digital storage; financial institutions can and do lose forms, and having a copy protects the account holder's intent
- **Employer plan vigilance:** When changing jobs, confirm that the old employer plan designation has been handled (either rolled over to an IRA with a new designation or kept with the old plan and verified)

---

## Output Format

```
## Beneficiary Designation Audit
**Audit Date:** [DATE]
**Prepared For:** [NAME]
**Prepared By:** AI assistant -- for attorney review and verification

---

### SECTION 1: Core Principle (Confirm Understanding)

Beneficiary designations on accounts SUPERSEDE will provisions.
A valid beneficiary designation controls who receives that asset,
regardless of what the will says.

Employer retirement plans (401k, 403b, 457b, pensions) are governed
by federal ERISA law. ERISA preempts state divorce-revocation laws.
IRAs, life insurance, and bank/brokerage accounts are governed by
state law and the account contract.

---

### SECTION 2: Account Inventory

| # | Account Type      | Institution          | ERISA? | Primary Beneficiary | Contingent Beneficiary | Per Stirpes? | Last Updated | Audit Status     |
|---|-------------------|----------------------|--------|---------------------|------------------------|--------------|--------------|------------------|
| 1 | 401(k)            | [Employer/Recordkeeper] | YES | [Name or VERIFY]    | [Name or NONE]         | [Y/N/Unknown]| [Date]       | OK/REVIEW/CONFLICT/URGENT |
| 2 | Traditional IRA   | [Institution]        | NO     | [Name or VERIFY]    | [Name or NONE]         | [Y/N/Unknown]| [Date]       | OK/REVIEW/CONFLICT/URGENT |
| 3 | Roth IRA          | [Institution]        | NO     | [Name or VERIFY]    | [Name or NONE]         | [Y/N/Unknown]| [Date]       | OK/REVIEW/CONFLICT/URGENT |
| 4 | Life Insurance    | [Company]            | NO     | [Name or VERIFY]    | [Name or NONE]         | [Y/N/Unknown]| [Date]       | OK/REVIEW/CONFLICT/URGENT |
| 5 | POD Checking      | [Bank]               | NO     | [Name or VERIFY]    | N/A                    | N/A          | [Date]       | OK/REVIEW/CONFLICT/URGENT |
| 6 | TOD Brokerage     | [Institution]        | NO     | [Name or VERIFY]    | [Name or NONE]         | [Y/N/Unknown]| [Date]       | OK/REVIEW/CONFLICT/URGENT |
| 7 | HSA               | [Institution]        | NO     | [Name or VERIFY]    | [Name or NONE]         | N/A          | [Date]       | OK/REVIEW/CONFLICT/URGENT |
| 8 | [Other]           | [Institution]        | [Y/N]  | [Name or VERIFY]    | [Name or NONE]         | [Y/N/Unknown]| [Date]       | OK/REVIEW/CONFLICT/URGENT |

---

### SECTION 3: Life Event Flags

| Life Event            | Date Occurred | Accounts Potentially Affected | Action Needed                  |
|-----------------------|---------------|-------------------------------|-------------------------------|
| [Marriage/Divorce/etc]| [Date]        | [Account types]               | [Review/Update/Attorney review] |

---

### SECTION 4: Flagged Issues (Priority Ordered)

| Priority | Account        | Issue Description                              | Governing Law | Recommended Action              |
|----------|---------------|------------------------------------------------|---------------|---------------------------------|
| URGENT   | [Account]     | [Ex-spouse still named; ERISA plan; divorce revocation does not apply] | Federal ERISA | Contact HR; consult attorney before changing |
| HIGH     | [Account]     | [No contingent beneficiary; account would fall to estate if primary predeceases] | [State] contract | Add contingent after attorney consultation |
| HIGH     | [Account]     | [Minor child named directly; court guardianship may be required] | [State]       | Discuss UTMA vs. trust with attorney |
| MEDIUM   | [Account]     | [Designation predates current marriage by 10+ years; intent unclear] | [State]       | Verify and update |
| LOW      | [Account]     | [Designation appears current; no life events affect it] | N/A           | No immediate action needed |

---

### SECTION 5: Will vs. Designation Conflict Check

| Account/Asset    | What the Will Provides        | What the Designation Says     | Conflict? | Notes                              |
|------------------|-------------------------------|-------------------------------|-----------|-----------------------------------|
| [Account]        | [Will provision, if known]    | [Current beneficiary]         | YES/NO/UNKNOWN | [Explanation; designation controls] |

---

### SECTION 6: Missing Contingent Beneficiary Report

| Account        | Primary Beneficiary | Contingent Beneficiary | Risk If Primary Predeceases                   |
|----------------|---------------------|------------------------|----------------------------------------------|
| [Account]      | [Name]              | NONE                   | Falls to estate -- probate; tax consequences for retirement accounts |

---

### SECTION 7: Per Stirpes vs. Per Capita Designation Review

| Account   | Current Distribution Method | Effect If a Beneficiary Predeceases Account Holder | Preferred Method (for attorney discussion) |
|-----------|-----------------------------|----------------------------------------------------|-------------------------------------------|
| [Account] | Per stirpes / Per capita / Unknown | [Describe result under current method]   | [Discuss with attorney]                   |

---

### SECTION 8: Questions for Estate Attorney (Priority Ordered)

1. [URGENT -- Divorce/ERISA]: [Specific question based on audit findings]
2. [HIGH -- Minor beneficiary]: [Specific question if applicable]
3. [HIGH -- Trust funding]: Should [specific account] name the revocable trust as beneficiary?
4. [HIGH -- Community property]: Does my state's community property law affect any designations?
5. [MEDIUM -- Per stirpes]: Should all designations use per stirpes language?
6. [MEDIUM -- Divorce decree]: Does my divorce decree require me to maintain any specific designation?
7. [LOW -- Review cadence]: How often should I conduct this audit given my current situation?

---

### SECTION 9: Update Action Plan

**Before any changes are made, review the divorce decree (if applicable) and
consult your estate attorney. Changing a beneficiary designation is a legal
act with permanent consequences.**

- [ ] [URGENT] Retrieve current designation form from [Account/Institution] by [date]
- [ ] [URGENT] Schedule estate attorney consultation -- bring this audit document
- [ ] [HIGH] Review divorce decree for beneficiary-related obligations
- [ ] [HIGH] Update designation on [Account] to [intended beneficiary] after attorney approval
- [ ] [HIGH] Add contingent beneficiary to [Account] after attorney consultation
- [ ] [MEDIUM] Verify per stirpes language on [Account]
- [ ] [LOW] Confirm designation on [Account] -- appears current but verify date

---

### SECTION 10: Document Retention Checklist

- [ ] Obtain written confirmation of each updated designation from each institution
- [ ] Store copies of all designation confirmations with estate planning documents
- [ ] Note next scheduled review date: [DATE -- typically 12 months or next life event]
- [ ] Provide copy of this audit to estate attorney for file

---

### Section 11: How to Retrieve Beneficiary Information by Account Type

| Account Type          | How to Retrieve Current Designation                             |
|-----------------------|-----------------------------------------------------------------|
| 401(k) / 403(b)       | Contact HR department or log in to plan recordkeeper portal    |
| IRA                   | Log in to financial institution account; navigate to "Beneficiaries" or "Account Services" |
| Life Insurance        | Contact insurance company or agent of record; request written confirmation |
| HSA                   | Log in to HSA administrator portal or call administrator        |
| TOD Brokerage         | Log in to brokerage; navigate to account registration settings  |
| POD Bank Account      | Call bank or visit branch; request written confirmation         |
| TSP (federal employees)| Log in to tsp.gov; check Form TSP-3 on file                   |
| Annuity               | Contact annuity company or financial advisor; review contract   |

```

---

## Rules

1. **Never recommend a specific beneficiary.** The skill's role is to identify what the current designations are and whether they appear consistent with the user's expressed intent and known life circumstances. The choice of beneficiary is a legal, financial, and personal decision that requires professional advice.

2. **Always distinguish ERISA-governed accounts from non-ERISA accounts.** This is not a technicality -- it determines whether a state divorce-revocation law applies, whether spousal consent is required, and which federal or state rules govern a dispute. Employer retirement plans = ERISA; IRAs = state law and contract; life insurance = state law and contract.

3. **Never provide tax advice about beneficiary designation strategies.** The 10-year rule under SECURE Act 2.0, the stretch IRA rules for eligible designated beneficiaries, the tax treatment of inherited HSAs, and charitable giving strategies using IRA assets all require individualized tax analysis. Flag these issues and refer to `estate-tax-basics` or a tax advisor.

4. **Always flag the minor beneficiary problem.** Naming a minor child directly as beneficiary of a large account is almost never the correct outcome -- it creates court-supervised guardianship of the estate, restricts how funds can be used until majority, and distributes everything at age 18 (or 21 depending on state) with no restrictions. Identify it every time and direct the user to their attorney.

5. **Treat divorce as an URGENT trigger.** After any mention of divorce (the user's own or a relevant party's), flag all employer retirement accounts as requiring ERISA-specific analysis, note that state revocation laws may or may not apply to non-ERISA accounts, and instruct the user to locate and review their divorce decree before changing any designation.

6. **Always check for contingent beneficiaries on every account.** A missing contingent beneficiary is one of the most common and easily corrected oversights in estate planning. If the primary beneficiary predeceases the account holder and no contingent is named, the account typically falls to the estate, triggering probate and potentially eliminating the income tax deferral advantages of retirement accounts.

7. **Distinguish per stirpes from per capita designations.** Most users have no idea which method applies to their account or what the difference means. Per stirpes passes a deceased beneficiary's share to their descendants; per capita reallocates the share among surviving beneficiaries. Whether either outcome is desired depends on the user's family structure and intent. Flag the issue and recommend the attorney address it.

8. **Never instruct the user to change a beneficiary designation without attorney review first.** Particularly for retirement accounts, life insurance governed by a divorce decree, and accounts in community property states. The action of changing a designation is simple; the consequences of changing it incorrectly can be severe and irreversible.

9. **Account for rollover gaps.** When a user rolls over an old 401(k) to an IRA, the beneficiary designation from the old plan does not transfer. A new designation must be filed at the IRA custodian. This is one of the most common sources of unintended "no beneficiary" situations. Ask specifically whether the user has rolled over any accounts in the past several years.

10. **Flag the trust-as-beneficiary coordination issue.** If the user mentions that they have a revocable living trust or a pour-over will, the question of whether accounts should name the trust (or the trustee of the trust) as beneficiary rather than individuals becomes critical. Trusts-as-beneficiary on retirement accounts have complex rules under the SECURE Act. This is an attorney-level planning question -- identify it prominently and refer it.

11. **Always note the date of the audit.** Beneficiary designations change, and so do lives. The audit document should be time-stamped so that its value as a baseline is clear, and so the user and attorney know when a fresh review is needed.

12. **Do not assume any designation is current.** Even if the user says "I updated everything after my divorce," walk through each account category systematically. People routinely forget accounts -- especially old employer plans, inherited accounts, or accounts with small balances. The audit has value only if it is complete.

---

## Edge Cases

### 1. Recent Divorce with ERISA Employer Plan and State IRA

The user has divorced within the past two years. Their 401(k) from their current employer still names their ex-spouse. Their Roth IRA at a brokerage also names the ex-spouse.

**Handling:**
The 401(k) is an ERISA plan. The U.S. Supreme Court's Egelhoff v. Egelhoff (2001) decision makes clear that ERISA preempts state divorce-revocation statutes for employer plans. The ex-spouse's designation on the 401(k) remains valid despite the divorce unless the account holder files a new beneficiary designation form or a Qualified Domestic Relations Order (QDRO) was entered in the divorce proceeding that specifically addressed the retirement account.

The Roth IRA is not governed by ERISA; it is governed by state law and the custodial agreement. If the user's state has a divorce-revocation statute (approximately 26 states have enacted versions based on the Uniform Probate Code), the ex-spouse's designation on the Roth IRA may have been automatically revoked upon divorce -- but this is not guaranteed and depends on the specific state law, when it was enacted, and whether courts have applied it retroactively.

Action for this skill: flag both accounts as URGENT, note the ERISA/state distinction explicitly, instruct the user to locate the divorce decree and bring it to the attorney, and note that the attorney must determine (a) whether a QDRO addressed the 401(k) and (b) whether the state's divorce-revocation law applies to the Roth IRA.

### 2. All Named Beneficiaries Have Predeceased the Account Holder

The user has an IRA where they originally named a spouse as primary beneficiary and two siblings as contingent beneficiaries. The spouse died three years ago. Both siblings have since died as well. The user never updated the designation.

**Handling:**
With no surviving beneficiaries and no per stirpes language naming descendants, the IRA will default to the account holder's estate upon their death. This triggers probate for the IRA, eliminates the ability of a non-spouse beneficiary to take distributions over a 10-year period, and potentially compresses distribution timing, increasing income tax burden.

Mark this as URGENT. The user should immediately provide new beneficiary designations for the IRA. Also ask whether any of the deceased siblings had children (the account holder's nieces and nephews) whom the account holder may wish to name. Note that per stirpes designation at the initial setup might have addressed this situation automatically. Recommend the attorney address per stirpes language on all accounts during the consultation.

### 3. Minor Children as Intended Beneficiaries

The user has two children, ages 7 and 11. They want both children to inherit equally from their 401(k) if their spouse predeceases them.

**Handling:**
Naming minor children directly as beneficiaries on retirement accounts creates a legal gap: minors cannot receive large sums directly. A court will typically appoint a guardian of the estate (a formal, court-supervised role requiring annual accountings and court approval for significant expenditures) to manage the funds until the child reaches the age of majority -- typically 18 in most states, 21 in some. At that age, the full remaining balance is distributed to the young adult outright.

Two alternatives exist that the attorney can evaluate: (1) naming a custodian under the state's Uniform Transfers to Minors Act (UTMA), which allows a responsible adult to manage the funds informally until the child reaches a designated age (typically 21 or, in some states, up to 25); (2) naming a trust as beneficiary, which gives the account holder full control over distribution terms.

Note: naming a trust as beneficiary of a retirement account has important implications under the SECURE Act of 2019 -- specifically, whether the trust qualifies as a "see-through trust" (also called a conduit trust or accumulation trust) to allow beneficiaries to use the 10-year distribution rule. This is complex attorney-level planning.

Flag the issue prominently, decline to recommend a specific approach, and refer to the estate attorney.

### 4. Community Property State with Non-Spouse IRA Beneficiary

The user lives in California (a community property state) and wants to name a sibling as beneficiary on their IRA. Their spouse has not been consulted.

**Handling:**
California and the other community property states (Arizona, Idaho, Louisiana, Nevada, New Mexico, Texas, Washington, Wisconsin, and Alaska by election) treat assets accumulated during marriage as equally owned by both spouses. For employer retirement plans subject to ERISA, federal law requires the spouse's written, notarized consent to name a non-spouse beneficiary. This requirement does not technically apply to IRAs under federal law -- but community property law may give the spouse a 50% interest in IRA contributions made during the marriage.

If the user names their sibling as IRA beneficiary and the IRA contains community property funds, the surviving spouse may have a claim to 50% of the account regardless of the beneficiary designation. This is a jurisdiction-specific legal question that requires attorney analysis.

Flag this for attorney review. Note the state, note the community property issue, and note that spousal consent may be advisable even though not federally required for IRAs.

### 5. Revocable Living Trust Estate Plan with No Trust Named on Accounts

The user tells you their attorney set up a revocable living trust two years ago and they signed a "pour-over will." When you conduct the account inventory, none of their accounts name the trust as beneficiary -- all name individuals.

**Handling:**
A pour-over will is designed to catch assets that are not already in the trust at death and "pour" them into the trust at death -- but this process goes through probate. The accounts with individual beneficiary designations bypass the trust entirely and pass directly to those named individuals, regardless of the trust's terms.

Whether this is a problem depends on the attorney's intent. In some estate plans, naming individuals directly is preferred for retirement accounts to preserve the 10-year distribution period under the SECURE Act (certain trust structures work, but require careful drafting). In other estate plans, the trust is intended to govern all distributions.

Flag this as a CONFLICT requiring attorney review. The question for the attorney is: "I have a revocable living trust and a pour-over will. None of my accounts currently name the trust as beneficiary. Is this consistent with your intent for my estate plan, and if so, which accounts (if any) should name the trust?"

### 6. Federal Thrift Savings Plan (TSP) with Stale Designation

The user is a federal civilian employee or military member with a TSP account. They married six years ago but have not updated their TSP beneficiary since before the marriage.

**Handling:**
The TSP has specific beneficiary designation mechanics that differ from private-sector 401(k) plans in one important way: the TSP follows a statutory order of precedence if no Form TSP-3 is on file. That order is: (1) spouse, (2) children, (3) parents, (4) executor/administrator of estate, (5) next of kin. Unlike ERISA plans, the TSP does not automatically honor the spouse as beneficiary in the absence of a designation -- the statutory order applies.

However, if the user has an old Form TSP-3 on file naming a pre-marriage beneficiary, that form controls over the statutory order. Divorce does not automatically revoke a TSP designation; a court order issued in divorce proceedings can address it, but the account holder must still take affirmative action with the TSP.

The TSP Form TSP-3 must be submitted directly to the TSP -- not to the employing agency, not to the military branch, not to HR. It must be the most recent version of the form with original signatures. Direct the user to tsp.gov to retrieve and submit Form TSP-3.

### 7. Inherited Account with No Surviving Beneficiary Designation

The user recently inherited an IRA from a parent who died without having named any beneficiary. The account has passed to the parent's estate and is now in probate.

**Handling:**
When an IRA passes to the estate rather than a named beneficiary, the distribution rules are less favorable. If the account owner died before their required beginning date (the date they were required to start taking required minimum distributions -- generally April 1 of the year following the year they turn 73 under SECURE 2.0), the entire inherited IRA must be distributed within 5 years. If they died after their required beginning date, distributions are based on the deceased owner's remaining life expectancy under the single life expectancy table.

This situation is now beyond this skill's scope -- it involves probate administration and inherited IRA distribution rules. Flag the situation, explain the general problem (the probate and tax treatment of an IRA-to-estate scenario), and refer the user to both an estate attorney (for the probate) and a tax advisor (for the inherited IRA distribution planning).

The lesson for the user's own accounts: this is precisely why naming beneficiaries and contingent beneficiaries -- and keeping them current -- is critical.

### 8. User Has Accounts in Multiple States or Foreign Countries

The user has a brokerage account in the U.S., a pension from a former employer in Canada, and has real property in two U.S. states.

**Handling:**
Multi-jurisdictional situations substantially complicate beneficiary review. Key issues:
- Real property in two states: each state's law governs the real property in that state; a TOD deed that is valid in one state may not be recognized in another; the user may face ancillary probate in the second state if the property is not addressed
- Canadian pension: Canadian pension plans are governed by Canadian federal and provincial law; beneficiary designation mechanics, tax treatment, and survivor benefit rules may differ significantly from U.S. rules; a Canadian attorney familiar with cross-border estates should be consulted
- Foreign accounts generally: some countries do not recognize U.S. beneficiary designation concepts at all; estate distribution of foreign assets may be governed entirely by the foreign country's succession law, including forced heirship provisions common in civil law countries

Flag all multi-jurisdictional elements as requiring attorney review with specific note that the attorney should have cross-border estate planning experience if the foreign assets are significant.

---

## Example

**Input:** "I'm 54. I got divorced three years ago after a 22-year marriage. I remarried last year. My ex-husband and I didn't have a formal QDRO for my 403(b) -- my divorce decree just said he waived rights to it. I have two teenage daughters from my first marriage, ages 16 and 18. My new husband and I have a joint checking account. I also have a Roth IRA, a life insurance policy, and an HSA. I want my new husband to be protected but I also want my daughters to inherit eventually. Do I need to update my beneficiaries?"

**Output:**

---

## Beneficiary Designation Audit
**Audit Date:** [Today's Date]
**Prepared For:** [User]
**Prepared By:** AI assistant -- for estate attorney review and verification

---

### SECTION 1: Core Principle (Confirm Understanding)

Beneficiary designations on accounts SUPERSEDE will provisions.
If your accounts still name your ex-husband, he may receive those assets --
even after your divorce and remarriage, and even if your will leaves
everything to your current husband.

**Critical jurisdiction note for your 403(b):**
Your 403(b) is an employer-sponsored retirement plan governed by federal ERISA law.
A divorce decree stating your ex-husband "waived rights" to the 403(b) is NOT the
same as a Qualified Domestic Relations Order (QDRO) and does NOT automatically
remove him as beneficiary. Under federal ERISA law, only a new beneficiary
designation form or a QDRO entered before his death can change who receives
your 403(b). Your estate attorney must evaluate this immediately.

---

### SECTION 2: Account Inventory

| # | Account Type         | Institution               | ERISA? | Primary Beneficiary           | Contingent Beneficiary | Per Stirpes? | Last Updated     | Audit Status |
|---|----------------------|---------------------------|--------|-------------------------------|------------------------|--------------|------------------|--------------|
| 1 | 403(b)               | [Employer/Recordkeeper]   | YES    | [VERIFY -- may name ex-husband] | [VERIFY]             | Unknown      | [Check with HR]  | **URGENT**   |
| 2 | Roth IRA             | [Institution]             | NO     | [VERIFY -- may name ex-husband] | [VERIFY]             | Unknown      | [Check with institution] | **URGENT** |
| 3 | Life Insurance       | [Company]                 | NO     | [VERIFY -- may name ex-husband] | [VERIFY]             | N/A          | [Check with insurer] | **URGENT** |
| 4 | HSA                  | [Administrator]           | NO     | [VERIFY]                      | [VERIFY]               | N/A          | [Check with HSA admin] | REVIEW |
| 5 | Joint Checking (JTWROS) | [Bank]                 | NO     | New husband (survivorship)    | N/A                    | N/A          | [Date of account opening] | OK -- confirm JTWROS registration |

---

### SECTION 3: Life Event Flags

| Life Event           | Date              | Accounts Potentially Affected | Urgency          |
|----------------------|-------------------|-------------------------------|------------------|
| Divorce (22-year marriage) | ~3 years ago | 403(b), Roth IRA, Life Insurance, HSA | **URGENT** |
| Remarriage           | ~1 year ago       | 403(b) (ERISA spousal rights), Roth IRA, Life Insurance, HSA | **HIGH** |
| Daughter turned 18   | Recent            | All accounts -- contingent beneficiary planning | HIGH |
| Daughter age 16 -- still a minor | Ongoing | Any account naming her directly | HIGH |

---

### SECTION 4: Flagged Issues (Priority Ordered)

| Priority | Account         | Issue Description                                                                                        | Governing Law       | Recommended Action                                                                                  |
|----------|----------------|----------------------------------------------------------------------------------------------------------|---------------------|-----------------------------------------------------------------------------------------------------|
| **URGENT**   | 403(b)      | Divorce decree "waiver" does not substitute for a QDRO or a new beneficiary designation under ERISA. Ex-husband may still be the valid beneficiary. New husband has automatic ERISA spousal rights as current legal spouse. | Federal ERISA       | Contact HR or plan recordkeeper immediately to obtain current designation form. Consult attorney before changing -- confirm whether a QDRO is needed. |
| **URGENT**   | Roth IRA    | State divorce-revocation law may or may not have automatically revoked ex-husband's designation upon divorce. This depends on your state. | State law + contract | Retrieve current designation from custodian. Attorney must confirm whether state revocation law applied. |
| **URGENT**   | Life Insurance | Same issue as Roth IRA -- state law may or may not have revoked ex-husband's designation. Also check whether divorce decree required maintaining ex-husband as beneficiary for any period (e.g., for child support security). | State law + contract | Review divorce decree. Retrieve current designation from insurer. Do not change until attorney confirms there is no decree-based obligation to maintain ex-husband as beneficiary. |
| HIGH     | HSA             | If ex-husband is still named, he would receive the full HSA value tax-free (spouse beneficiary treatment). If current husband is not named, tax-free spousal rollover of HSA is lost. | State law + contract | Verify and update after attorney consultation. |
| HIGH     | Daughter age 16 | If named as direct beneficiary, minor cannot receive large account distributions without court-supervised guardianship of the estate. | State law           | Discuss with attorney: UTMA custodian vs. trust as beneficiary. |
| HIGH     | Daughter age 18 | Now an adult -- can receive distributions directly, but full distribution at 18 with no restrictions may not reflect your intent. | N/A                 | Discuss with attorney whether a trust is appropriate to manage distribution timing. |
| MEDIUM   | All accounts    | No confirmed contingent beneficiaries on any account. If primary beneficiary predeceases you, accounts may fall to estate. | Varies              | Add contingent beneficiaries to all accounts after attorney consultation. |
| MEDIUM   | 403(b)          | ERISA requires your current husband's written, notarized consent if you want to name anyone other than him as primary beneficiary. | Federal ERISA       | Discuss with attorney and plan administrator. |

---

### SECTION 5: Will vs. Designation Conflict Check

| Account/Asset       | What the Will Provides (if known)   | What the Designation Currently Says (estimated) | Conflict?   | Notes                                                  |
|---------------------|-------------------------------------|-------------------------------------------------|-------------|-------------------------------------------------------|
| 403(b)              | [Unknown without seeing will]       | Likely ex-husband (pre-divorce designation)     | PROBABLE    | Designation controls under ERISA regardless of will   |
| Roth IRA            | [Unknown]                           | Likely ex-husband (pre-divorce designation)     | PROBABLE    | State law may or may not have revoked it upon divorce  |
| Life Insurance      | [Unknown]                           | Likely ex-husband (pre-
