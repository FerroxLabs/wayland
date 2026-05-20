---
name: insurance-navigation-framework
description: |
  Teaches how to read an Explanation of Benefits, understand prior authorization processes, navigate the insurance appeal process, and decode common insurance terminology. Produces reference guides and step-by-step checklists for common insurance interactions without advising on plan selection or coverage decisions.
  Use when the user asks about reading an EOB, understanding a denied claim, the prior authorization process, how to appeal an insurance decision, or decoding insurance terminology.
  Do NOT use for recommending specific insurance plans, advising on coverage choices, interpreting specific policy benefits, or providing legal advice about insurance disputes.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "checklist step-by-step planning"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---
# Insurance Navigation Framework

> **Disclaimer:** This skill provides general educational information about how to read insurance documents, understand insurance processes, and navigate common insurance interactions. It does NOT constitute legal advice, financial advice, or a determination of what any specific policy covers or requires. Insurance rules vary significantly by plan type, state, employer, and policy year. For complex disputes or coverage questions, consult a licensed patient advocate, health insurance counselor, or healthcare attorney.

---

## When to Use

**Use this skill when the user:**
- Has received an Explanation of Benefits (EOB) and cannot interpret the columns, codes, or math behind the numbers
- Received a claim denial letter and wants to understand what the denial means, why it happened, and what their options are
- Needs to understand the prior authorization (PA) process before an upcoming procedure, medication, or specialist visit
- Is confused by insurance terminology on a bill, EOB, or insurance card (e.g., deductible accumulation, coinsurance vs. copay, out-of-pocket maximum status)
- Received a medical bill that does not match their EOB and wants to know how to reconcile it
- Wants a step-by-step checklist for submitting an internal appeal or requesting an external independent review
- Received a surprise bill from an out-of-network provider at an in-network facility
- Wants to understand what happens when a prior authorization is denied and how to escalate
- Is preparing to call their insurance company and wants to know what to say, what to ask, and what documentation to gather

**Do NOT use this skill when the user:**
- Asks which health insurance plan to choose during open enrollment -- refer to a personal finance or benefits-selection skill
- Asks whether a specific service is covered under their specific policy -- this requires reading their Summary of Benefits and Coverage (SBC) or calling their insurer directly
- Asks about Medicaid or Medicare eligibility, enrollment windows, or specific program rules -- these programs have distinct administrative frameworks and state-specific variations that require a dedicated skill
- Asks about COBRA enrollment decisions or COBRA vs. marketplace plan comparisons -- this is a personal financial planning decision
- Asks about employer-sponsored HSA or FSA contribution strategy -- refer to a benefits-optimization or tax-planning skill
- Is seeking legal representation for an insurance dispute or bad faith claim -- refer them to a licensed attorney or state insurance commissioner
- Asks about workers' compensation or auto insurance medical payments coverage -- these are distinct insurance systems with different appeal frameworks
- Asks about prescription drug formulary tier management or specialty pharmacy prior authorization specifics beyond the general PA framework -- these require pharmacy-benefit-specific guidance

---

## Process

### Step 1: Identify the Exact Nature of the User's Insurance Interaction

Before providing any guidance, classify which of the four core interaction types the user is dealing with. Each requires a different output.

- **Document decoding:** User has a document in hand (EOB, denial letter, provider bill, RA -- Remittance Advice) and needs to understand what it says
- **Process navigation:** User is about to take an action (submit a PA, file an appeal, dispute a bill) and needs a step-by-step roadmap
- **Terminology clarification:** User encountered insurance language they do not understand and needs plain-language definitions with examples
- **Discrepancy resolution:** User has a mismatch between what they expected to pay and what they were billed

Ask a focused clarifying question if the situation is unclear: "Do you have a document in front of you, or are you trying to understand a process before something happens?" This single question usually resolves the classification.

Identify the user's insurance type, because processes differ significantly:
- **Commercial/employer-sponsored (ERISA-governed):** Appeal rights include internal appeal, then external independent review; governed by federal ERISA and ACA rules
- **Individual marketplace (ACA):** Similar appeal rights; state insurance commissioner oversight applies
- **Self-funded employer plans:** ERISA governs, not state insurance law; the employer is the insurer; the insurance company is only the administrator (TPA)
- **Medicare Advantage:** Has distinct appeal timelines (72 hours for urgent, 14 days standard organization determination, 14 days for reconsideration); ALJ hearings available after $180+ threshold (2024)
- **Medicaid managed care:** State-specific; fair hearings available; notice-and-appeal timelines often shorter

### Step 2: Build the Foundational Terminology Reference Relevant to the User's Issue

Do not dump the full glossary on the user. Select the 6-10 terms most relevant to their specific question. Always explain each term with a concrete numerical example.

**Core cost-sharing terms (most frequently misunderstood):**

- **Premium:** The monthly payment to maintain coverage -- does not count toward the deductible or out-of-pocket maximum in most plans
- **Deductible:** The amount the patient pays 100% of before the plan's cost-sharing kicks in. Most plans have separate in-network and out-of-network deductibles. Family plans often have two structures: individual embedded deductible (each person has their own threshold) or family aggregate deductible (the family must collectively meet it before anyone gets cost-sharing benefits). Note: preventive services are typically covered before the deductible under ACA-compliant plans.
- **Copay:** A flat fee at the time of service (e.g., $30 for a primary care visit, $50 for a specialist, $10 for generic drugs). Copays may or may not count toward the deductible depending on the plan design. Copays always count toward the out-of-pocket maximum.
- **Coinsurance:** A percentage split applied after the deductible is met. A plan with 80/20 coinsurance means insurance pays 80% of the allowed amount; the patient pays 20%. This continues until the out-of-pocket maximum is reached.
- **Allowed amount (also called "allowable" or "negotiated rate"):** The maximum the insurance will recognize for a given service from an in-network provider. In-network providers are contractually prohibited from billing more than this amount. Out-of-network providers have no such restriction -- they can bill any amount, and the patient may owe the difference (balance billing).
- **Out-of-pocket maximum (OOP max):** The federal ACA cap for in-network services ($9,450 single / $18,900 family for 2024 plans). Once met, the plan pays 100% of covered in-network services. Premiums never count. Balance-billed amounts from out-of-network providers never count.
- **Balance billing:** When an out-of-network provider bills the patient for the difference between their charge and the insurance's payment. Largely prohibited for emergency services and for out-of-network providers at in-network facilities under the No Surprises Act (effective January 2022).
- **Coordination of Benefits (COB):** When a patient has two insurance plans, the primary plan pays first; the secondary plan pays some or all of the remainder. The patient cannot profit -- total payment cannot exceed 100% of the allowed amount.

**Claims process terms (essential for denial and appeal navigation):**

- **Claim:** A formal request to insurance for payment, submitted by a provider (or the patient in self-pay situations) using a standard form (CMS-1500 for professional services, UB-04 for facility/hospital services)
- **CPT code (Current Procedural Terminology):** A standardized 5-digit code identifying the procedure or service performed. Insurance coverage decisions are made at the CPT code level. A single appointment may have multiple CPT codes billed.
- **ICD-10 code (International Classification of Diseases, 10th revision):** The diagnosis code that justifies the medical necessity of the CPT code. Mismatch between the diagnosis code and procedure code is a common reason for denials.
- **Remittance Advice (RA):** The document sent to the provider explaining how the claim was paid or denied. The EOB is the patient-facing version of the same information. CARC (Claim Adjustment Reason Codes) and RARC (Remittance Advice Remark Codes) on the RA provide granular denial reasons.
- **NCPDP claim (pharmacy):** Prescription drug claims use a different format from medical claims; pharmacy claims are adjudicated in real-time at the point of sale, not retrospectively.

### Step 3: Guide the User Through Reading the Specific Document They Have

**For an Explanation of Benefits (EOB):**

Walk through each column in order. The exact layout varies by insurer, but the core fields are standardized:

1. **Header information:** Member name, member ID, group number, plan name, claim number, date the EOB was generated. The claim number is the most important field -- reference it in every call to the insurer.

2. **Service line items:** Each CPT code billed appears as a separate line. A single provider visit may have 2-5 line items (e.g., office visit code + vaccine administration code + vaccine product code).

3. **Key calculation chain (always the same):**
   - Billed amount (provider charge) -- Adjustment (contractual write-off) = Allowed amount
   - Allowed amount -- Insurance paid -- Other credits (COB, etc.) = Patient responsibility
   - Patient responsibility = your share of deductible + copay + coinsurance (in that order of application)

4. **Remark codes / denial codes:** These are alphanumeric codes in a small box or column. Look these up using the insurer's EOB legend (usually printed on the back of the paper EOB or linked in a digital EOB). Common codes: CO-97 (benefit included in another service already adjudicated), CO-4 (service inconsistent with modifier), PR-1 (deductible), PR-2 (coinsurance), PR-3 (copay), OA-23 (service not covered by this payer).

5. **The critical comparison step:** The "Patient Responsibility" on the EOB is what the provider is permitted to bill you. If the bill from the provider is higher, the provider is either (a) also billing for services not yet processed, (b) billing before the EOB arrived and using their estimated patient share, or (c) incorrectly balance billing. Request an itemized statement from the provider and match each line item to the EOB.

**For a Denial Letter:**

Denial letters are required by law (ACA, ERISA) to contain specific elements. Help the user find each one:

1. **The specific reason for denial** -- not just "medical necessity" but the specific clinical criteria used (e.g., the insurer's clinical coverage policy name and number)
2. **The relevant plan provision** -- the specific section of the plan document used to support the denial
3. **Instructions for appeal** -- internal appeal process, deadline, address/portal for submission
4. **Deadline for internal appeal** -- this is non-negotiable. Missing this deadline forfeits appeal rights.
5. **Notice of independent external review rights** -- required to be included if applicable

### Step 4: Explain the Prior Authorization Process in Sequence

Prior authorization (PA) is an advance approval requirement that exists for specific services, medications, or equipment deemed high-cost or potentially overutilized. It does not guarantee payment.

**The PA lifecycle -- what happens and who does what:**

1. **Trigger identification:** Provider's office checks whether a PA is required by querying the insurer's online portal, calling the provider relations line, or using a clearinghouse tool. Patient action: ask the provider's office, "Has a prior authorization been checked for this service?"

2. **PA submission (provider-initiated):** The provider's office submits the PA request via the insurer's provider portal, by fax (common for older systems), or via an electronic PA clearinghouse. The request includes: CPT code, diagnosis codes, clinical notes supporting medical necessity, and the ordering provider's NPI.

3. **Insurance review:** An insurance nurse or medical director reviews against the insurer's clinical criteria (often based on MCG or InterQual clinical criteria tools). For standard PA: decision required within 14 calendar days federally (some states require faster). For urgent/expedited PA: 72 hours federally. For concurrent review (ongoing hospitalization): 24 hours.

4. **Possible outcomes:**
   - **Approved:** PA number issued. Provider must reference this number on the claim. Patient should write it down.
   - **Partially approved:** Fewer units, a lower-level service, or a shorter duration approved. Provider can modify the service plan or request a peer-to-peer review.
   - **Denied:** Written denial issued. Same appeal rights apply as a claim denial. The provider can request a **peer-to-peer review** (provider calls the insurance medical director directly) -- this is often the fastest resolution pathway.
   - **Pended/more information requested:** Insurer requests additional clinical documentation. A specific deadline to respond will be stated.

5. **Patient role in PA:** Primarily verification. Before any scheduled procedure: ask the provider's office for the PA number and approval date. Confirm the approved CPT code matches what will be performed. If there is a discrepancy, flag it before the service.

6. **What a PA is NOT:** A guarantee of coverage or payment. Claims can still be denied post-PA for other reasons (coding error, patient no longer enrolled, service performed differently than approved). Always verify active enrollment on the date of service.

### Step 5: Walk Through the Insurance Appeal Process -- Internal First, Then External

**Internal Appeal (Mandatory First Step):**

The ACA requires all non-grandfathered plans to have an internal appeal process. ERISA-governed plans have parallel requirements.

1. **Deadline:** The appeal window is typically printed on the denial letter. ACA minimum standard: 180 days for post-service claim denials. Urgent care appeals: 72 hours. Some plans offer shorter windows -- the plan's stated deadline controls if it is longer than the federal minimum. Missing the deadline is the single most common and most consequential mistake.

2. **Build the appeal file.** Every appeal package should include:
   - The appeal letter (written by patient or provider, or both)
   - A copy of the original claim denial letter
   - A copy of the EOB for the denied service
   - A Letter of Medical Necessity (LMN) from the treating physician -- this is the single most powerful piece of documentation. It should reference the insurer's clinical criteria by name and explain why the patient meets those criteria.
   - Relevant medical records (office notes, lab results, imaging reports, prior treatment attempts that failed -- demonstrating "step therapy" requirements were met)
   - Published peer-reviewed clinical literature supporting the treatment, if the denial was on medical necessity grounds
   - If the denial was for a code/billing reason: a corrected claim or a statement from the provider explaining the correct coding with supporting documentation

3. **Write the appeal letter.** The letter must include: member name and ID, claim number, date of service, CPT codes in dispute, the specific reason stated in the denial, and a direct rebuttal of each reason with supporting evidence. Cite the insurer's own clinical policy by number if it was referenced in the denial. Tone is factual and clinical -- not emotional.

4. **Submit via certified mail or the insurer's secure portal.** If mailing, send certified mail with return receipt. Keep a copy of everything. Note the submission date.

5. **Timeline for insurer response:** ACA standards -- 60 days for post-service internal appeal decision; 30 days for pre-service; 72 hours for urgent. The insurer must notify the member of the decision in writing.

**External Independent Review (After Internal Appeal Exhausted or After 72-Hour Urgent Denial):**

1. External review is available after exhausting internal appeals (or after 72 hours on an urgent PA denial without resolution). For ACA-compliant plans, this right is guaranteed regardless of state law.

2. An Independent Review Organization (IRO) -- a third-party clinical organization not affiliated with the insurer -- reviews the case. Their decision is binding on the insurer.

3. Deadline to request external review: 4 months after receiving the internal appeal denial (federal standard, some states are shorter).

4. Patient submits the same appeal file to the IRO. The IRO contacts the insurer for additional records. Decision is typically rendered within 45 days (standard) or 72 hours (urgent).

5. If the IRO overturns the denial, the insurer must cover the service. If the IRO upholds the denial, further options include state insurance commissioner complaints, ERISA civil litigation (for employer plans), or legislative assistance requests (state representatives often have insurance liaison offices).

### Step 6: Guide the User Through Dispute-Specific Troubleshooting

Match the user's specific scenario to the appropriate resolution pathway:

| Denial Reason | First Call | Documentation Needed | Special Pathway |
|---|---|---|---|
| Medical necessity | Provider (request peer-to-peer + LMN) | Clinical notes, LMN, peer-reviewed literature | Peer-to-peer review often resolves fastest |
| Not a covered benefit | Insurance (request plan document citation) | Plan's SBC, SPD, denial letter | External review may not apply to benefit exclusions -- check |
| Prior auth not obtained | Provider billing (provider error in most cases) | Auth records, date of service, provider's auth submission records | Provider may need to retroactively request auth or write off the charge |
| Coding/billing error | Provider billing (request corrected claim) | Correct CPT/ICD-10 codes, provider's coding rationale | Corrected claim resubmission; no formal appeal needed |
| Out-of-network provider at in-network facility | Insurance + No Surprises Act process | Facility contract status, provider's participation status, date of service | File a No Surprises Act complaint with CMS if applicable |
| Out-of-pocket max met but still billed | Insurance + provider | OOP accumulation statement, all prior EOBs from plan year | Request YTD accumulation report from insurance |
| Coordination of Benefits confusion | Both insurers | Both insurance cards, both EOBs for same service | COB dispute process -- primary insurer adjudicates first |

### Step 7: Prepare the User for Every Insurance Phone Call

Insurance company phone calls are the primary resolution mechanism for most issues, and poor preparation leads to circular conversations, lost documentation, and missed escalation opportunities.

**Before calling -- gather every item:**
- Insurance card (member ID, group number, plan name, customer service phone number)
- EOB or denial letter (claim number, date of service, CPT codes at issue)
- Provider name, NPI number (if available), and billing department phone number
- Pen and paper or open a notes document

**During the call -- always do these things:**
- State at the start: "I need your name, employee ID, and a reference number for this call"
- Ask: "What is the specific reason code for this denial?" and "What clinical criteria was applied?"
- Ask: "What documentation would change this determination?"
- Ask: "What is the exact deadline for submitting an appeal?"
- Ask: "Is there a peer-to-peer review option for this denial?"
- At the end: Read back every key piece of information to confirm accuracy

**Document the call immediately:**
- Date, time, duration
- Representative name and employee/reference ID
- Call reference number (different from claim number)
- Summary of every commitment made ("the representative said X would be reprocessed within 10 business days")
- This documentation is the foundation of any escalation or complaint

### Step 8: Produce the Correct Output for the User's Specific Situation

Based on the classification from Step 1, generate the appropriate output format from the section below. Always include:
- The relevant terminology definitions for their situation (not the full glossary)
- The correct process checklist (EOB reading, appeal, PA verification, or bill reconciliation)
- The phone call preparation checklist
- The common issues and actions table relevant to their specific scenario

---

## Output Format

```
## Insurance Navigation Guide: [Specific Topic]

> Note: Insurance rules vary by plan type, state, and employer. The processes
> below follow federal ACA and ERISA standards. Verify deadlines and specific
> procedures with your insurer directly.

---

### Terminology Reference

| Term | Plain Language Definition | Example |
|---|---|---|
| [Term 1] | [Definition in one sentence] | [Concrete dollar/percentage example] |
| [Term 2] | [Definition in one sentence] | [Concrete dollar/percentage example] |

---

### [EOB Reading Guide / Appeal Checklist / PA Verification Checklist / Bill Reconciliation Guide]

**Step 1: [Action verb + specific action]**
- What you are looking for: [Specific field name or document element]
- What it means: [Plain language explanation]
- What to do if it is wrong: [Specific action]

**Step 2: [Action verb + specific action]**
- ...

---

### The Math for This Situation

| Field | Your Numbers | Explanation |
|---|---|---|
| Billed Amount | $[X] | What the provider charged |
| Contractual Adjustment | -$[Y] | Write-off for being in-network |
| Allowed Amount | $[Z] | Insurance's recognized rate |
| Insurance Paid | $[A] | Plan's portion after your cost-sharing |
| Your Patient Responsibility | $[B] | What your bill should say |

---

### What to Do Next: Decision Tree

**If [Condition A]:** → Take [Action A] → Timeline: [X days]
**If [Condition B]:** → Take [Action B] → Contact: [Insurance / Provider billing / State dept]
**If [Condition C]:** → Take [Action C] → Document: [Specific items to save]

---

### Common Issues and Actions

| Issue | Most Likely Cause | Immediate Action | Escalation if Unresolved |
|---|---|---|---|
| [Issue 1] | [Specific cause] | [Specific action with who to call] | [Escalation path] |
| [Issue 2] | [Specific cause] | [Specific action with who to call] | [Escalation path] |
| [Issue 3] | [Specific cause] | [Specific action with who to call] | [Escalation path] |

---

### Appeal Package Checklist (if applicable)

- [ ] Appeal letter (include: member ID, claim number, date of service, specific denial reason, rebuttal argument)
- [ ] Copy of denial letter (highlight the denial reason and deadline)
- [ ] Copy of EOB for the denied service
- [ ] Letter of Medical Necessity from treating physician (reference insurer's clinical criteria by name)
- [ ] Relevant medical records (office notes, labs, imaging, prior treatment failures)
- [ ] Published clinical guidelines or peer-reviewed literature (if medical necessity denial)
- [ ] Corrected claim or coding rationale (if billing/coding denial)
- [ ] Certified mail tracking number or portal submission confirmation

---

### Phone Call Preparation Checklist

**Before calling [Insurance / Provider billing], have ready:**
- [ ] Insurance card: member ID [___], group number [___]
- [ ] Claim number from EOB or denial letter: [___]
- [ ] Date(s) of service in question: [___]
- [ ] Provider name and CPT codes at issue: [___]
- [ ] Pen/notes open to record rep name, employee ID, call reference number

**Questions to ask on the call:**
- "What is the specific reason code for this denial?"
- "What clinical criteria was applied and what is the policy name/number?"
- "What documentation would change this determination?"
- "What is the exact deadline to file an appeal?"
- "Is a peer-to-peer review available?"
- "Can you confirm the representative name, employee ID, and a call reference number?"

---

### Key Deadlines for This Situation

| Action | Deadline | Consequence of Missing |
|---|---|---|
| File internal appeal | [X days from denial letter date] | Loss of appeal rights |
| Request external review | 4 months from internal denial | Loss of IRO access |
| Correct billing error | Varies by provider (30-90 days typical) | Sent to collections |
```

---

## Rules

1. **Never skip the document classification step.** Attempting to explain the appeal process to someone who just needs help reading an EOB -- or vice versa -- creates confusion. Always identify whether the user has a document, a process question, or a discrepancy first.

2. **Never tell a user whether their specific service should have been covered.** This requires reading the actual plan document (Summary Plan Description or Evidence of Coverage), which varies by plan. Provide the framework for how they can determine this themselves -- specifically by asking insurance to cite the exact plan provision used.

3. **Always anchor the appeal deadline prominently.** The single most consequential mistake in insurance navigation is missing the appeal deadline. Repeat the deadline at least twice in any appeal guidance, once in the checklist. A typical internal appeal window is 180 days, but some plans and some denial types have shorter windows -- the denial letter controls.

4. **Always distinguish between a PA approval and a guarantee of payment.** Many users incorrectly believe that getting a prior authorization means the claim will be paid. PA approves the medical necessity review for a specific service at a point in time -- it does not validate enrollment, network status on the date of service, or correct coding. A claim can be denied after a PA is granted.

5. **Always identify the plan type before describing the appeal process.** ERISA self-funded plans are not subject to state insurance laws -- complaints to the state insurance commissioner are not effective for these plans. The appeal goes to the plan administrator, then to ERISA civil litigation, not to the state regulator. This distinction matters enormously.

6. **Never advise on the substance of a medical necessity determination.** The user's clinician is the appropriate source for medical justification. The skill's role is to explain that the insurer used clinical criteria (MCG, InterQual, or proprietary), how to get those criteria disclosed, and how to structure the physician's Letter of Medical Necessity to respond to those criteria specifically.

7. **Always include the peer-to-peer review option for any PA denial or medical necessity denial.** A peer-to-peer review -- where the treating physician calls the insurer's medical director directly -- resolves a significant proportion of medical necessity denials without requiring a formal written appeal. Most users and many providers are not aware this option exists.

8. **Never conflate the EOB with a bill.** State this explicitly and emphatically. Acting on an EOB as if it were a bill (paying before the provider's bill arrives, disputing it with the wrong party) is a very common user error. The EOB is informational; the provider's bill is the payment request.

9. **Always flag the No Surprises Act when the user describes a bill from a provider they did not choose (emergency care, ancillary providers at in-network facilities).** Since January 1, 2022, balance billing protections apply federally for emergency services and for non-emergency services from out-of-network providers at in-network facilities (with limited exceptions). Patients cannot be charged more than the in-network cost-sharing amount in these situations. Direct users to file a complaint with CMS if they believe this law applies.

10. **Always recommend requesting an itemized bill (line-by-line) rather than a summary statement when reconciling a medical bill.** Itemized bills are available on request from any provider. They show every individual charge with the corresponding CPT code and unit cost. Comparison to the EOB is only possible with an itemized bill -- summary bills do not contain enough detail. Many billing errors (duplicate charges, unbundled codes, charges for services not rendered) are invisible without the itemized version.

---

## Edge Cases

### 1. The Bill Arrived Before the EOB
Some providers send bills before the claim has fully processed. The user receives a bill but has no EOB yet.

**Handling:** Tell the user not to pay until the EOB arrives and the patient responsibility amount is confirmed. Call the provider's billing department and ask them to "hold the bill pending EOB processing." Insurance companies typically process clean claims within 14-30 days. If more than 45 days have passed since the service date without an EOB, call the insurance company to verify the claim was received and is not suspended.

### 2. The User Has Employer Self-Funded Coverage (ERISA)
The user's employer is large (typically 500+ employees) and self-funds their health plan -- they just use an insurance company name (Aetna, Cigna, UnitedHealthcare) as the administrator.

**Handling:** This changes the appeal escalation path entirely. After internal appeal, external review may still apply (many self-funded plans voluntarily participate), but state insurance commissioner complaints are ineffective -- ERISA preempts state law. Escalation goes to the U.S. Department of Labor (Employee Benefits Security Administration -- EBSA) or to ERISA civil litigation. The user can identify a self-funded plan if the denial letter or plan documents reference "ERISA" prominently or if the SBC says "This plan is not insured."

### 3. Claim Was Denied Because the Provider Did Not Get a Prior Authorization (Provider Error)
The service was medically appropriate and covered, but the provider failed to obtain required prior authorization before performing the service.

**Handling:** This is a provider administrative failure, not a clinical denial. The user should:
- Confirm with the provider's office whether they attempted to obtain PA
- Request a retroactive (retro) authorization from the insurer (some plans allow this within 30-90 days of service for extenuating circumstances)
- If retro auth is denied, ask the provider's billing department whether they will write off the patient's responsibility since the failure was theirs
- File an appeal arguing "administrative error by provider" -- some insurers will process these charitably for one-time events
- Do NOT pay the full billed amount before this process plays out

### 4. The User's OOP Maximum Was Reached Mid-Year But Bills Keep Arriving
The user believes they have met their out-of-pocket maximum but providers are still billing them for cost-sharing.

**Handling:** This is usually one of three problems:
- **Accumulation tracking lag:** Insurance's records of OOP accumulation may lag by 2-4 weeks. Bills from recent services may have generated before the OOP max was officially recorded as met.
- **Out-of-network spending excluded:** OOP max only applies to in-network spending for most plans. Out-of-network cost-sharing may have a separate, higher OOP max -- or no cap at all.
- **Non-covered services:** Services that are not covered benefits do not count toward the OOP max, so cost-sharing for excluded services never accumulates.

Request a Year-to-Date Accumulation Statement from the insurer by name. This document shows the running total of deductible and OOP max accumulation for the plan year. Compare it to all EOBs received. The math should reconcile.

### 5. The Insurer Is Requesting Step Therapy (Fail First) for a Medication
The user's physician prescribed a specific drug, but the insurer is requiring the patient to try and fail cheaper alternatives first before they will cover the preferred drug.

**Handling:** Step therapy (fail-first) protocols are common for specialty and brand-name drugs. Explain:
- The prescribing physician must document that the required step-therapy alternatives are clinically contraindicated or were previously tried and failed
- Most states have step therapy override laws (over 30 states as of 2024) that allow exceptions for patients for whom the required alternatives are inappropriate
- The physician submits a step therapy exception request with clinical documentation
- If denied, standard internal and external appeal rights apply
- Patient assistance programs from the drug manufacturer may help cover costs during the appeal period -- this is not insurance advice, it is a cost bridge strategy

### 6. The User Received a Surprise Bill After Emergency Care
The user went to an in-network emergency room but received a bill from an out-of-network emergency physician or specialist who saw them.

**Handling:** The No Surprises Act (effective January 1, 2022) explicitly prohibits balance billing in emergency situations and for out-of-network providers at in-network facilities. The patient's maximum cost-sharing is the in-network cost-sharing amount.

Steps:
1. Confirm the facility was in-network at the time of service
2. Ask the billing provider to submit the claim through the insurer's Independent Dispute Resolution (IDR) process rather than billing the patient
3. If the provider refuses or continues to bill: file a complaint at cms.gov/nosurprises (or call 1-800-MEDICARE for Medicare, state insurance department for Medicaid)
4. Do not pay a balance-billed amount that exceeds the insurer's EOB patient responsibility before this process concludes
5. Note: the No Surprises Act does not apply to ground ambulance services as of 2024 -- this is a known gap in the law

### 7. The User Is Uninsured or the Claim Was Submitted Without Insurance
The user received care without insurance, or a provider submitted a claim to the wrong insurer, or the service date fell outside the enrollment period.

**Handling:** If the user was uninsured at the time of service:
- Request an itemized bill
- Ask the provider for the "self-pay" or "uninsured" discount -- most hospitals (especially nonprofits required to maintain charity care programs under ACA Section 501(r)) have formal financial assistance programs
- Hospitals are required to screen uninsured patients for charity care eligibility -- ask explicitly for a financial assistance application
- Compare the billed charge to Medicare's published payment rate for the same service (publicly available in CMS fee schedules) as a negotiating reference point -- providers typically accept 110-140% of Medicare as reasonable for uninsured patients
- Payment plans are available from virtually all providers -- request one in writing

---

## Example

**User Input:** "I got a denial letter from my insurance company for physical therapy. It says 'not medically necessary.' My doctor ordered it after my knee surgery. I don't know what to do -- they are giving me 30 days to appeal and I have no idea where to start."

**Output:**

---

## Insurance Navigation Guide: Appealing a Medical Necessity Denial for Physical Therapy

> Note: The process below follows ACA and ERISA federal standards. Your plan may have additional requirements. All deadlines below are based on what you described -- verify your specific deadline against your denial letter.

---

### Your Situation at a Glance

Your insurance denied physical therapy ordered by your physician after knee surgery, citing "not medically necessary." This is a clinical denial, not a billing or administrative error. It means the insurer's medical reviewer determined that the request did not meet their internal clinical criteria -- not that your doctor is wrong, and not that the service is categorically excluded. This type of denial has a strong track record of being overturned on appeal when the right documentation is submitted.

**Critical fact:** You have 30 days from the denial letter date. This is your internal appeal deadline. Do not miss it.

---

### Terminology for This Situation

| Term | Definition | Applies to Your Case How |
|---|---|---|
| Medical Necessity | The insurer's standard that a service must be clinically appropriate, evidence-based, and not primarily for the patient's convenience | The insurer's reviewer decided PT did not meet their criteria -- your appeal will argue it does |
| Clinical Criteria / Coverage Policy | The insurer's internal guidelines (often MCG or InterQual) used to decide whether a service is medically necessary | Ask the insurer for the specific policy name and version number used in the denial -- you have the right to this |
| Letter of Medical Necessity (LMN) | A letter from your physician documenting clinical justification for the service, explicitly addressing the insurer's criteria | This is the most important document in your appeal |
| Internal Appeal | A formal request for the insurer to reconsider the denial -- reviewed by someone who was not involved in the original decision | Your required first step |
| Peer-to-Peer Review | A direct phone call between your surgeon or referring physician and the insurer's medical director | Often faster than a written appeal -- ask your surgeon's office about this |
| External Independent Review | Review by an independent third-party organization if the internal appeal fails -- binding on the insurer | Available to you after internal appeal is denied |

---

### Your Appeal -- Step by Step

**Step 1: Get the exact denial reason before you do anything else**

Call the member services number on your insurance card today. Say: "I received a denial for physical therapy, claim number [X]. I need to know the specific clinical criteria that was applied and the policy name and number."

Write down:
- The representative's name and employee ID
- The call reference number
- The exact policy name/number used (example: "MCG Clinical Criteria PT-023")
- What specific element of the criteria was not met

You have a legal right to this information. If they refuse, escalate to a supervisor.

---

**Step 2: Call your surgeon's office -- today**

Tell them: "My insurance denied the PT referral for medical necessity. I need two things: a Letter of Medical Necessity for my appeal, and I want to know if you can request a peer-to-peer review with my insurer's medical director."

The peer-to-peer review is a phone call between your surgeon and the insurer's medical director. It is the fastest pathway to overturning a medical necessity denial. It costs you nothing. Your surgeon's office handles the scheduling.

If the peer-to-peer review resolves the denial, you are done. If it does not, you still file the written internal appeal.

---

**Step 3: Build your appeal file**

Collect the following documents:

- [ ] **The denial letter** (the one you received -- highlight the denial reason and the 30-day deadline)
- [ ] **The EOB** for the denied physical therapy claim (if you have one)
- [ ] **Letter of Medical Necessity** from your surgeon -- it must do the following:
  - State the diagnosis (post-operative status, specific procedure, date of surgery)
  - State the functional limitation (e.g., "patient has 45 degrees of knee flexion, normal is 135 degrees")
  - Identify the specific insurer clinical policy by name and explain why the patient meets those criteria
  - State that PT is the appropriate evidence-based treatment and that failure to provide it risks re-injury or permanent functional deficit
- [ ] **Relevant medical records** -- your surgeon's operative report, the post-op visit notes ordering PT, any PT evaluation if one was done
- [ ] **Clinical guidelines** -- the American Academy of Orthopaedic Surgeons (AAOS) and American Physical Therapy Association (APTA) publish evidence-based guidelines for post-surgical PT. Your surgeon or a medical librarian can provide the relevant citation. Including a 1-page summary strengthens the appeal.
- [ ] **Your appeal letter** (write this yourself or have your surgeon's office write it -- see format below)

---

**Step 4: Write the appeal letter**

The appeal letter should be concise -- 1-2 pages -- and structured as follows:

> **[Date]**
>
> **To:** [Insurer name], Appeals Department
>
> **Re:** Internal Appeal -- Claim Number [X] -- Member Name [Your Name] -- Member ID [Your ID]
>
> **Service in question:** Physical therapy, CPT [code], Date of Service [or requested start date]
>
> **Reason for appeal:** The denial cited [exact denial language]. I am appealing because this determination is not supported by clinical evidence and does not correctly apply [Policy Name/Number].
>
> **Clinical facts:** [State concisely: surgery date, diagnosis, current functional limitations documented in medical records]
>
> **Why the criteria are met:** [Cite the specific policy the insurer used and explain, criterion by criterion, how the patient meets each one. Reference the LMN and medical records.]
>
> **Supporting evidence:** [Reference the clinical guidelines you are including. Name them specifically.]
>
> **Requested resolution:** Reversal of the denial and authorization for physical therapy as ordered by [Surgeon Name], [Number of visits] over [Timeframe].
>
> **Enclosures:** [List every document included]

---

**Step 5: Submit the appeal**

- Submit via the insurer's member portal (keeps a digital timestamp) OR by certified mail with return receipt
- Keep a copy of every document submitted
- Note the submission date -- the response clock starts here
- ACA standard: insurer must respond to a post-service internal appeal within **60 days**. If the PT is upcoming (pre-service), the standard is **30 days**.

---

**Step 6: If the internal appeal is denied -- external review**

If the insurer upholds the denial after internal appeal, you are entitled to an external review by an Independent Review Organization (IRO). Request this immediately -- you have **4 months from the internal denial** to file.

The IRO reviews the same file and makes a binding decision (the insurer must comply if the IRO overturns). External review overturns medical necessity denials at meaningful rates, particularly for post-surgical care where clinical evidence is strong.

---

### Decision Tree for Your Situation

**If peer-to-peer review overturns the denial:** → Request the authorization number in writing → Confirm it with your PT provider before starting

**If peer-to-peer does not resolve it:** → Proceed with written internal appeal within 30 days → Submit full documentation package

**If internal appeal is denied:** → Request external independent review → Deadline is 4 months from internal denial letter

**If you miss the 30-day appeal deadline:** → Contact the insurer to ask for a deadline extension (rare but sometimes granted) → Contact your state insurance commissioner's office → Contact a patient advocate or your state's SHIP (State Health Insurance Assistance Program) for free guidance

---

### Common Issues in This Scenario and Actions

| Issue | Most Likely Cause | Immediate Action | Escalation |
|---|---|---|---|
| Insurer won't tell you what criteria were used | Denial letter is vague | Request in writing; cite your right to the clinical rationale under ERISA/ACA | File complaint with state insurance department or DOL EBSA |
| Surgeon's office won't write an LMN | Unfamiliar with the process | Provide them the insurer's policy name/number; ask specifically for a "clinical justification letter" | Ask the PT provider -- they often write LMNs for their own services |
| 30-day deadline is too short to gather records | Documentation takes time | Submit the appeal letter and EOB by the deadline with a note that supporting records are in transit -- establishes the appeal was filed on time | Call insurer to confirm the deadline is paused while records are gathered |
| Peer-to-peer review denied | Insurer scheduling issues or policy | Proceed directly to written appeal | Note the peer-to-peer attempt in your appeal letter |
| Internal appeal denied -- second denial letter received | IRO review is next step | Request external review immediately -- do not wait | Use the same appeal file; add the internal denial letter as a new exhibit |

---

### Phone Call Preparation Checklist

**Before calling insurance:**
- [ ] Denial letter in hand -- find the claim number, denial reason, and 30-day deadline
- [ ] Insurance card -- member ID, group number, appeals department phone number
- [ ] The EOB for this service (if received)
- [ ] Notes open to record: rep name, employee ID, call reference number

**Questions to ask on the call:**
- "What is the specific clinical criteria name and version number used to deny this claim?"
- "What specific element of the criteria was not met?"
- "Is a peer-to-peer review between my surgeon and your medical director available for this denial?"
- "What is the exact deadline for filing my internal appeal?"
- "What is the address or portal for submitting the appeal?"
- "Can you confirm your name, employee ID, and a call reference number for this conversation?"

---

### Key Deadlines -- Do Not Miss These

| Action | Deadline | Consequence of Missing |
|---|---|---|
| File internal appeal | 30 days from denial letter date (your plan's stated deadline) | Loss of right to appeal this denial |
| Request peer-to-peer review | As soon as possible -- call today | Peer-to-peer may no longer be available after a written appeal is filed at some insurers |
| Submit additional appeal documents | Before insurer closes the file (ask for confirmation of record closure date) | Documents not considered in the review |
| Request external independent review | 4 months from internal appeal denial | Loss of access to IRO -- binding external review no longer available |
