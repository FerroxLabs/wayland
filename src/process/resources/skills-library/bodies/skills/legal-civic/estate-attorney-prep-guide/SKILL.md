---
name: estate-attorney-prep-guide
description: |
  Prepares users for their first estate planning attorney consultation by generating
  a comprehensive question list, a document gathering checklist, and evaluation criteria
  for choosing an estate attorney. Produces a meeting preparation packet the user can
  bring to their consultation.
  Use when the user asks about finding an estate attorney, preparing for an estate
  planning meeting, what to ask an estate lawyer, or how to evaluate an estate attorney.
  Do NOT use for providing legal advice, recommending specific attorneys, or drafting
  estate documents.
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

# Estate Attorney Prep Guide

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand legal concepts and processes. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Laws vary by jurisdiction and change over time. Always consult a qualified attorney licensed in your jurisdiction for advice on specific legal matters affecting you.

## When to Use

**Use this skill when:**
- User is planning to meet with an estate attorney for the first time
- User asks what questions to bring to an estate planning consultation
- User asks how to find or evaluate an estate planning attorney
- User wants to know what documents to gather before an estate planning meeting
- User asks what to expect during an estate planning consultation
- User is overwhelmed by estate planning and does not know where to start

**Do NOT use when:**
- User asks for a recommendation of a specific attorney or law firm
- User asks for legal advice about their estate plan (refer to their attorney)
- User is already working with an attorney and has specific legal questions about their plan
- User asks about a probate matter already in progress (use `probate-process-explainer`)
- User asks about specific estate documents (use the relevant skill: `will-preparation-checklist`, `trust-basics-explainer`, `power-of-attorney-explainer`, etc.)

## Process

1. **Determine where the user is in the process.** Ask about their current situation:
   - Have they already identified an attorney, or do they need guidance on finding one?
   - Is this their first estate plan, or are they updating an existing one?
   - What triggered their interest in estate planning (life event, age milestone, general preparedness)?
   - Do they have a general sense of their estate size and complexity?

2. **Guide attorney selection (if needed).** Help the user evaluate potential attorneys:

   **How to find candidates:**
   - State bar association lawyer referral service (searchable by practice area)
   - Referrals from trusted advisors (CPA, financial advisor)
   - Referrals from friends or family who have completed estate planning
   - Local bar association estate planning section
   - Board-certified estate planning specialists (not all jurisdictions offer this)

   **Evaluation criteria for initial screening:**
   - Does the attorney focus on estate planning (not a general practitioner who occasionally handles wills)?
   - How long have they practiced estate planning?
   - What credentials do they hold (board certification, LLM in taxation or estate planning)?
   - Do they offer a free or reduced-fee initial consultation?
   - What is their fee structure (flat fee per document, hourly rate, or comprehensive package)?
   - Are they licensed in the state where you reside?

   **Questions to ask during the initial consultation:**
   - What percentage of your practice is estate planning?
   - How many estate plans have you created in the last year?
   - Do you handle trust administration and probate as well, or only document creation?
   - What is your fee structure and what does it include?
   - How long does the process typically take from first meeting to signed documents?
   - Who in your office will I primarily work with (the attorney directly, or a paralegal)?
   - Do you provide ongoing review services (periodic updates as laws or circumstances change)?
   - What happens if I need to update my documents later -- is there a maintenance fee or retainer?

3. **Build the document gathering checklist.** Tell the user what to bring to their first meeting:

   **Personal Information:**
   - Full legal names and dates of birth for the user and spouse (if applicable)
   - Names, dates of birth, and contact information for all children and potential beneficiaries
   - Names and contact information for anyone the user is considering as executor, trustee, guardian, or agent

   **Financial Documents:**
   - Recent statements for all bank accounts
   - Recent statements for all investment and brokerage accounts
   - Recent statements for all retirement accounts (401k, IRA, pension)
   - Most recent tax return (provides a financial overview)
   - Life insurance policies (face values, beneficiary designations)
   - Annuity contracts

   **Property Documents:**
   - Real estate deeds or recent property tax statements
   - Vehicle titles
   - Business ownership documents (operating agreements, articles of incorporation, partnership agreements)
   - Any appraisals for valuable personal property (jewelry, art, collectibles)

   **Existing Legal Documents:**
   - Current will (if any)
   - Current trust documents (if any)
   - Current powers of attorney (if any)
   - Current healthcare directive (if any)
   - Prenuptial or postnuptial agreements
   - Divorce decrees
   - Any court orders affecting property or custody

   **Beneficiary Information:**
   - Current beneficiary designation forms for retirement accounts and insurance policies
   - Any planned charitable gifts (organization names and intended amounts)

4. **Generate the question list.** Based on the user's situation, create tailored questions organized by topic:

   **About the plan itself:**
   - What documents do I need (will, trust, POA, directive) and why?
   - Is a trust necessary for my situation, or is a will sufficient?
   - How do I ensure my beneficiary designations match my overall plan?
   - What happens if I move to a different state -- do I need to redo my documents?

   **About specific concerns:**
   - Minor children: guardianship, managing inheritance, age of distribution
   - Blended families: stepchild inheritance, prior marriage obligations
   - Business owners: succession planning, buy-sell agreements, entity considerations
   - Special needs: government benefit preservation, supplemental needs trust
   - Significant assets: estate tax exposure, tax reduction strategies

   **About cost and process:**
   - What is the total cost for the recommended documents?
   - How many meetings will the process require?
   - What is the timeline from start to signed documents?
   - How are updates handled after the initial documents are signed?

5. **Set expectations for the meeting.** Explain what typically happens:
   - The first meeting is usually a consultation where the attorney gathers information and makes recommendations
   - The attorney will ask many of the same questions this skill has covered
   - The user should be prepared to discuss sensitive topics (death, incapacity, family dynamics)
   - The attorney may recommend documents the user has not considered
   - Decisions do not need to be made on the spot -- most attorneys draft documents after the meeting and schedule a review meeting before signing

6. **Compile the meeting preparation packet.**

## Output Format

```
## Estate Attorney Meeting Preparation

### Attorney Evaluation Checklist (if still selecting)
| Criterion                  | Attorney 1 | Attorney 2 | Attorney 3 |
|---------------------------|------------|------------|------------|
| Estate planning focus (%)  | [%]        | [%]        | [%]        |
| Years of EP experience     | [years]    | [years]    | [years]    |
| Board certified?           | [y/n]      | [y/n]      | [y/n]      |
| Free consultation?         | [y/n]      | [y/n]      | [y/n]      |
| Fee structure              | [flat/hourly/package] | | |
| Licensed in your state?    | [y/n]      | [y/n]      | [y/n]      |
| Handles trust + probate?   | [y/n]      | [y/n]      | [y/n]      |

### Documents to Bring
- [ ] Photo ID (government-issued)
- [ ] Recent bank and investment account statements
- [ ] Recent retirement account statements (401k, IRA)
- [ ] Life insurance policy documents
- [ ] Real estate deeds or property tax statements
- [ ] Vehicle titles
- [ ] Business ownership documents (if applicable)
- [ ] Existing will, trust, POA, directive (if any)
- [ ] Prenup/postnup (if applicable)
- [ ] Divorce decree (if applicable)
- [ ] Most recent tax return
- [ ] Beneficiary designation copies from retirement accounts and insurance
- [ ] List of beneficiaries with full names and relationships
- [ ] List of proposed executor, trustee, guardian, agent candidates

### Questions for the Attorney

**About My Plan:**
1. Based on my situation, what documents do you recommend and why?
2. Do I need a trust, or is a will sufficient for my estate?
3. [Situation-specific question]
4. [Situation-specific question]

**About Specific Concerns:**
5. [If minor children: How should we structure guardianship and inheritance management?]
6. [If blended family: How do we handle stepchild inheritance rights?]
7. [If business owner: What business succession provisions are needed?]
8. [If significant assets: Am I near the estate tax threshold?]

**About Cost and Process:**
9. What is the total cost for the documents you are recommending?
10. How many meetings will the process require?
11. How long from start to signed documents?
12. How do I update documents later if my circumstances change?
13. Do you offer an annual review or maintenance plan?

### Information to Have Ready
| Topic              | Your Answer                |
|--------------------|---------------------------|
| Marital status     | [status]                  |
| Children (names, ages) | [list]               |
| Approximate estate value | [range]             |
| Primary residence state | [state]              |
| Existing documents | [will? trust? POA? none?] |
| Primary concern    | [what matters most to you] |

### What to Expect at the Meeting
1. The attorney will gather detailed information about your family, assets, and goals
2. They will explain which documents they recommend and why
3. You will discuss sensitive topics (death, incapacity, family dynamics) -- this is normal
4. You do NOT need to make all decisions at this meeting
5. The attorney will typically draft documents after the meeting and schedule a review
6. The signing appointment usually happens at a subsequent meeting

### Next Steps
- [ ] Gather all documents on the checklist above
- [ ] Fill in the "Information to Have Ready" table
- [ ] Discuss executor/guardian/agent choices with your spouse or family
- [ ] Bring this entire preparation packet to the meeting
```

## Rules

1. NEVER recommend specific attorneys, law firms, or legal service providers
2. NEVER provide legal advice about what estate documents the user needs -- present the common documents and let the attorney recommend based on the user's specific situation
3. NEVER provide jurisdiction-specific legal conclusions without explicitly noting the jurisdiction and recommending local verification
4. This skill prepares users for professional estate planning engagement -- it does not replace an attorney
5. ALWAYS include the document gathering checklist -- arriving unprepared wastes the attorney's time (and the user's money if billed hourly)
6. ALWAYS include both attorney evaluation criteria AND meeting preparation questions -- users may need guidance on selection before they can prepare for the meeting
7. If the user asks about online legal document services or DIY estate planning, note that while these exist, estate planning involves jurisdiction-specific rules and individual circumstances that benefit from professional guidance, especially for situations involving trusts, business interests, blended families, or significant assets
8. NEVER pressure the user into any particular level of estate planning complexity -- some people genuinely only need a simple will
9. ALWAYS note that the user should bring their spouse or partner to the meeting if they are doing joint estate planning
10. If the user mentions cost concerns, note that many attorneys offer flat-fee packages for standard estate plans and that some bar associations offer reduced-fee clinics

## Edge Cases

- **User cannot afford an attorney:** Note that some options exist for lower-cost estate planning: legal aid organizations (for those who qualify by income), law school clinics, state bar association pro bono programs, and reduced-fee clinics. A simple will created through a legitimate reduced-cost channel is far better than no will at all.

- **User already has documents but does not know if they are current:** Recommend they bring all existing documents to the consultation. The attorney can review them and advise whether they need updating. Common triggers for updates: changes in law, changes in family structure, changes in asset value, changes in named individuals (executor died, moved, etc.), or documents more than 5-7 years old.

- **User is doing estate planning for elderly parents:** Note that the parents must be mentally competent to sign legal documents. If there is any concern about cognitive decline, the estate planning meeting becomes more urgent. The attorney may assess competency as part of the process. The adult child can help gather documents and attend the meeting with the parents' permission.

- **User and spouse disagree about estate planning decisions:** This is common and the attorney is experienced in facilitating these conversations. Note that each spouse should feel comfortable expressing their preferences. Major areas of disagreement (executor choice, distribution to children, guardianship) should be identified before the meeting so the attorney can help facilitate discussion.

- **User has assets in multiple states or countries:** Note that estate planning across multiple jurisdictions is more complex. The user may need an attorney who practices in multiple states or may need separate counsel in each jurisdiction where they own real property. International assets add another layer of complexity. Flag this for the attorney at the outset.

- **User asks about online DIY services:** Acknowledge that online services exist and may work for very simple situations (single person, few assets, no minor children, no business interests). However, note that these services cannot provide the individualized analysis an attorney offers, may not account for jurisdiction-specific requirements, and errors in estate documents may not be discovered until after death when they are too late to fix.

## Example

**Input:** "I'm 38, married with a toddler, and we own a house. We have no estate planning documents at all. Where do we even start?"

**Output:**

## Estate Attorney Meeting Preparation

You are at an excellent starting point -- many families do not begin estate planning until much later, and having a young child makes this especially important. Here is how to prepare for your first attorney meeting.

### Finding an Estate Attorney

**Where to look:**
- Ask your mortgage lender, financial advisor, or CPA for referrals
- Search your state bar association's lawyer referral service for "estate planning"
- Ask friends or coworkers who have recently done estate planning

### Attorney Evaluation Checklist
| Criterion                  | Attorney 1 | Attorney 2 |
|---------------------------|------------|------------|
| Estate planning focus (%)  | [ask: what % of your practice?] | |
| Years of EP experience     | [ask]      | |
| Free initial consultation? | [ask]      | |
| Fee structure              | [flat fee packages are common] | |
| Licensed in your state?    | [verify]   | |
| Handles full estate plan?  | [will + trust + POA + directive?] | |

### Documents to Bring
- [ ] Photo IDs for both spouses
- [ ] Recent bank statements (all accounts)
- [ ] Recent retirement account statements (401k, IRA for both spouses)
- [ ] Life insurance policies (if any -- if none, the attorney may discuss this)
- [ ] Mortgage statement or property deed
- [ ] Vehicle titles
- [ ] Most recent joint tax return
- [ ] Current beneficiary designations on retirement accounts and any insurance
- [ ] Your child's birth certificate (for guardianship documentation)

### Information to Have Ready
| Topic              | Your Answer                |
|--------------------|---------------------------|
| Marital status     | Married                   |
| Children           | [child's name], age [toddler age] |
| Approximate home value | $[amount]             |
| Combined retirement accounts | $[approximate total] |
| Other significant assets | [list any]           |
| Life insurance     | [have it? how much? or none?] |
| State of residence | [your state]              |
| Existing documents | None                      |

### Questions for Your Attorney

**About your estate plan:**
1. We have no existing documents -- what do you recommend we create? (At minimum, most attorneys recommend: wills, financial POAs, healthcare POAs, healthcare directives for both spouses)
2. Do we need a trust, or are wills sufficient for our situation?
3. How do we set up guardianship for our child in our wills?
4. At what age should our child receive their inheritance if something happens to both of us? (Common options: 18, 21, 25, or staggered)

**About your child specifically:**
5. Should we create a testamentary trust within our wills to manage our child's inheritance?
6. How do we ensure life insurance proceeds are managed for our child rather than given as a lump sum to the guardian?
7. What if we want different guardians for personal care vs. financial management?

**About coordination:**
8. Should our retirement account beneficiary designations be updated as part of this process?
9. How does our house ownership (title) affect our estate plan?
10. Do we need more life insurance given that we have a young child? (The attorney may refer you to an insurance advisor)

**About cost and process:**
11. What is the total cost for the full package of documents?
12. How many meetings will this require?
13. How long until we have signed documents?
14. How do we update documents as our family grows or circumstances change?

### Decisions to Discuss With Your Spouse Before the Meeting
1. **Guardian for your child:** If both of you died, who would raise your child? Who is the backup? Have you asked them?
2. **Executor:** Who should handle your estate? Consider: a sibling, a trusted friend, or each other with a backup
3. **Healthcare agent:** Who makes medical decisions if one of you is incapacitated? (Often each other, with a backup)
4. **Distribution:** If something happens to both of you, how should assets be managed for your child until adulthood?

### What to Expect
1. The meeting will take 60-90 minutes
2. Both of you should attend together
3. The attorney will ask about your family, assets, and wishes in detail
4. You do not need to have all answers -- the attorney guides the conversation
5. After the meeting, the attorney drafts documents (1-3 weeks typical)
6. You return for a review and signing appointment
7. Total process: usually 3-6 weeks from first meeting to signed documents

### Next Steps
- [ ] Identify 2-3 estate planning attorneys and schedule consultations
- [ ] Gather all documents on the checklist above
- [ ] Have the guardian conversation with your spouse
- [ ] Fill in the "Information to Have Ready" table
- [ ] Bring this entire packet to the consultation
- [ ] Budget approximately $1,500-$4,000 for a standard couple's estate plan (varies significantly by region and complexity)
