---
name: will-preparation-checklist
description: |
  Builds a comprehensive pre-attorney meeting checklist for will preparation by gathering
  information about assets, beneficiaries, executor preferences, and personal wishes. Produces
  a structured document the user can bring to an estate planning attorney.
  Use when the user asks about preparing to write a will, getting ready for an estate
  attorney meeting, what information they need for a will, or organizing their estate wishes.
  Do NOT use for drafting an actual will, providing legal advice on asset distribution,
  tax optimization strategies, or trust creation (use trust-basics-explainer instead).
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

# Will Preparation Checklist

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand legal concepts and processes. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Laws vary by jurisdiction and change over time. Always consult a qualified attorney licensed in your jurisdiction for advice on specific legal matters affecting you.

## When to Use

**Use this skill when:**
- User asks about preparing to write a will or create a last will and testament
- User wants to know what information to gather before meeting an estate attorney
- User asks what a will covers or what decisions they need to make
- User mentions wanting to organize their estate wishes for the first time
- User asks about choosing an executor or naming beneficiaries

**Do NOT use when:**
- User asks to draft or write an actual will document (refer to an estate attorney)
- User asks for advice on how to distribute assets among beneficiaries
- User asks about trust creation or trust funding (use `trust-basics-explainer`)
- User asks about tax implications of estate decisions (use `estate-tax-basics`)
- User asks about digital assets specifically (use `digital-estate-planner`)
- User needs help with an existing will dispute or probate issue (use `probate-process-explainer`)

## Process

1. **Explain the purpose of the checklist.** Tell the user that this checklist prepares them for a productive meeting with an estate planning attorney. The goal is to gather all the information the attorney will ask for so the meeting is efficient and thorough. This checklist does not create a will -- it creates the preparation document that makes the attorney meeting more productive.

2. **Gather personal information.** Ask the user to collect:
   - Full legal name and any prior names
   - Date of birth
   - Current state or country of residence (jurisdiction affects will requirements)
   - Marital status (single, married, divorced, widowed, domestic partnership)
   - Citizenship status (relevant for some estate planning considerations)
   - Whether they have an existing will, and if so, when it was last updated

3. **Inventory assets by category.** Walk the user through each asset category:
   - **Real property:** Primary residence, vacation homes, rental properties, vacant land. For each: address, approximate value, how title is held (sole, joint, tenants in common)
   - **Financial accounts:** Checking, savings, money market, CDs. For each: institution name, approximate balance, account type
   - **Investment accounts:** Brokerage accounts, mutual funds, individual stocks and bonds. For each: institution name, approximate value
   - **Retirement accounts:** 401(k), 403(b), IRA, Roth IRA, pension. For each: institution name, approximate value, current beneficiary designation
   - **Insurance policies:** Life insurance, annuities. For each: company, policy number, face value, current beneficiary
   - **Business interests:** Ownership in any business (LLC, corporation, partnership, sole proprietorship). For each: entity name, ownership percentage, approximate value
   - **Vehicles:** Cars, boats, motorcycles, RVs. For each: make, model, year, approximate value
   - **Personal property of significant value:** Jewelry, art, collectibles, antiques, firearms. For each: description, approximate value, any appraisals on file
   - **Digital assets:** Refer to `digital-estate-planner` for a comprehensive digital asset inventory

4. **Identify beneficiaries.** Ask the user to list everyone they want to include:
   - Full legal name of each beneficiary
   - Relationship to the user (spouse, child, sibling, friend, charity, organization)
   - Contact information (address, phone)
   - Whether any beneficiary is a minor (under 18) -- if so, note this for guardian and custodian discussion
   - Whether any beneficiary has special needs or receives government benefits -- if so, note this for special needs trust discussion

5. **Address executor selection.** Guide the user through executor considerations:
   - **Primary executor:** Who will be responsible for carrying out the will's instructions? Consider: trustworthiness, organizational ability, geographic proximity, willingness to serve, age and health
   - **Alternate executor:** Who serves if the primary executor cannot or will not serve?
   - **Executor compensation:** Some jurisdictions allow executor fees -- note whether the user has a preference on compensation
   - **Professional executor option:** If the user has no suitable individual, note that banks and trust companies can serve as executor

6. **Document guardianship preferences (if applicable).** If the user has minor children:
   - **Primary guardian:** Who should raise the children if both parents die?
   - **Alternate guardian:** Backup if primary guardian cannot serve
   - **Guardian selection criteria to discuss with attorney:** Shared values, parenting philosophy, financial stability, geographic location, willingness to serve, existing relationship with the children

7. **Capture specific wishes and distributions.** Ask about:
   - **Specific bequests:** Particular items to particular people (grandmother's ring to eldest daughter, book collection to local library)
   - **Residuary estate:** What happens to everything not specifically assigned? (Typically divided by percentage among named beneficiaries)
   - **Conditional bequests:** Any conditions on inheritance (reaching a certain age, completing education)
   - **Charitable giving:** Any organizations the user wants to include
   - **Disinheritance:** Anyone the user specifically wants to exclude (important to document explicitly for legal clarity)

8. **Note additional considerations.** Ask about:
   - **Funeral and burial preferences:** Burial vs. cremation, memorial service wishes, any pre-paid arrangements
   - **Pet care provisions:** If the user has pets, who should care for them and should funds be set aside
   - **Letter of intent:** Does the user want to write a non-binding personal letter explaining their decisions?
   - **Simultaneous death clause:** What should happen if the user and primary beneficiary die at the same time?
   - **No-contest clause:** Does the user want to include a provision discouraging will contests?

9. **Compile the preparation document.** Organize all gathered information into the output format below and remind the user to bring this document to their estate attorney meeting.

## Output Format

```
## Will Preparation Checklist

### 1. Personal Information
| Field                    | Details            |
|--------------------------|--------------------|
| Full legal name          | [name]             |
| Date of birth            | [date]             |
| State/country of residence | [location]       |
| Marital status           | [status]           |
| Citizenship              | [citizenship]      |
| Existing will?           | [yes/no, date]     |

### 2. Asset Inventory

#### Real Property
| Property         | Address     | Approx. Value | Title Held As     |
|------------------|-------------|---------------|-------------------|
| [property name]  | [address]   | $[amount]     | [sole/joint/etc.] |

#### Financial Accounts
| Account Type | Institution | Approx. Balance |
|-------------|-------------|-----------------|
| [type]      | [name]      | $[amount]       |

#### Investment Accounts
| Account Type | Institution | Approx. Value |
|-------------|-------------|---------------|
| [type]      | [name]      | $[amount]     |

#### Retirement Accounts
| Account Type | Institution | Approx. Value | Current Beneficiary |
|-------------|-------------|---------------|---------------------|
| [type]      | [name]      | $[amount]     | [name]              |

#### Insurance Policies
| Type | Company | Face Value | Current Beneficiary |
|------|---------|------------|---------------------|
| [type] | [company] | $[amount] | [name]          |

#### Business Interests
| Entity Name | Type | Ownership % | Approx. Value |
|-------------|------|-------------|---------------|
| [name]      | [LLC/Corp/etc.] | [%] | $[amount] |

#### Vehicles and Personal Property
| Item              | Description          | Approx. Value |
|-------------------|----------------------|---------------|
| [item]            | [details]            | $[amount]     |

### 3. Beneficiaries
| Name         | Relationship | Minor? | Special Needs? | Contact       |
|-------------|-------------|--------|----------------|---------------|
| [name]      | [relation]  | [y/n]  | [y/n]          | [info]        |

### 4. Executor Selection
| Role               | Name         | Relationship | Contact       |
|--------------------|-------------|-------------|---------------|
| Primary executor   | [name]      | [relation]  | [info]        |
| Alternate executor | [name]      | [relation]  | [info]        |
| Compensation pref. | [yes/no/discuss with attorney]              |

### 5. Guardianship (if minor children)
| Role               | Name         | Relationship | Contact       |
|--------------------|-------------|-------------|---------------|
| Primary guardian   | [name]      | [relation]  | [info]        |
| Alternate guardian | [name]      | [relation]  | [info]        |

### 6. Specific Wishes
#### Specific Bequests
| Item/Asset         | Recipient    | Notes          |
|--------------------|-------------|----------------|
| [item]             | [name]      | [conditions]   |

#### Residuary Estate Distribution
| Beneficiary  | Percentage | Conditions     |
|-------------|------------|----------------|
| [name]      | [%]        | [if any]       |

#### Charitable Bequests
| Organization | Amount/Percentage | Purpose        |
|-------------|-------------------|----------------|
| [org name]  | [amount or %]     | [unrestricted/specific] |

### 7. Additional Considerations
- [ ] Funeral/burial preferences documented
- [ ] Pet care provisions addressed
- [ ] Letter of intent drafted (optional)
- [ ] Simultaneous death clause preference noted
- [ ] No-contest clause preference noted

### 8. Questions for Attorney
- [List of specific questions based on the user's situation]
- [Flag any complex scenarios identified during preparation]

### Next Steps
- [ ] Schedule estate attorney consultation
- [ ] Bring this completed checklist to the meeting
- [ ] Gather physical copies of referenced documents (deeds, account statements, insurance policies)
- [ ] Bring government-issued photo ID to the meeting
```

## Rules

1. NEVER draft will language or legal document text -- this skill produces a preparation checklist only
2. NEVER advise the user on how to distribute assets among beneficiaries or recommend specific distributions
3. NEVER provide jurisdiction-specific legal conclusions without explicitly noting the jurisdiction and recommending local verification
4. This skill prepares users for professional estate planning engagement -- it does not replace an attorney
5. ALWAYS note when a user's situation triggers a recommendation to discuss a specific topic with their attorney (minor beneficiaries, special needs, business interests, blended families)
6. ALWAYS include the "Questions for Attorney" section populated with situation-specific questions based on what the user has shared
7. If the user mentions existing beneficiary designations on retirement accounts or insurance that conflict with their stated will wishes, flag this conflict explicitly and note that beneficiary designations typically take precedence over will provisions
8. NEVER recommend specific financial products, institutions, or professional service providers by name
9. Present all asset values as user-reported approximations -- do not calculate estate value totals or suggest whether the estate may be subject to estate tax
10. If the user asks about creating the will itself, redirect them to consult an estate planning attorney and explain that this skill only prepares the information they will need for that meeting

## Edge Cases

- **Blended families (stepchildren, prior marriages):** Flag that blended family situations often require more complex estate planning. Add specific attorney questions about stepchild inheritance rights, prenuptial agreement interactions, and prior divorce decree obligations. Note that stepchildren do not automatically inherit in most jurisdictions without explicit inclusion.

- **Business owners:** If the user owns a business, note that business succession planning is a specialized topic that may require a separate meeting or a different type of attorney. Add questions about buy-sell agreements, business valuation methods, and whether the business operating agreement has succession provisions.

- **User has no obvious executor candidate:** If the user cannot identify a trusted individual to serve as executor, include information about professional executors (banks, trust companies) as an option to discuss with the attorney. Note that professional executors charge fees, typically a percentage of estate value.

- **User wants to disinherit a family member:** Note that disinheritance requirements vary by jurisdiction. In community property states, a spouse generally cannot be fully disinherited without their consent. Add a specific attorney question about the legal requirements for valid disinheritance in the user's jurisdiction.

- **Very simple estate (single, no dependents, few assets):** Streamline the checklist by marking inapplicable sections as "N/A" rather than omitting them. Even simple estates benefit from a will, and the attorney may identify considerations the user has not thought of.

- **User already has a will and wants to update it:** Note that updating a will can be done through a codicil (amendment) or by creating an entirely new will. Add a question for the attorney about which approach is more appropriate given the scope of changes. Ask the user to bring the existing will to the meeting.

## Example

**Input:** "I'm married with two kids (ages 8 and 12) and want to prepare for my first meeting with an estate attorney about getting a will. We own a house and have some retirement accounts."

**Output:**

## Will Preparation Checklist

### 1. Personal Information
| Field                    | Details            |
|--------------------------|--------------------|
| Full legal name          | [to be filled]     |
| Date of birth            | [to be filled]     |
| State/country of residence | [to be filled]   |
| Marital status           | Married            |
| Citizenship              | [to be filled]     |
| Existing will?           | No                 |

### 2. Asset Inventory

#### Real Property
| Property         | Address     | Approx. Value | Title Held As     |
|------------------|-------------|---------------|-------------------|
| Primary residence | [address]  | $[amount]     | [discuss: joint tenancy? tenants by entirety?] |

#### Financial Accounts
| Account Type | Institution | Approx. Balance |
|-------------|-------------|-----------------|
| [list each checking, savings, etc.] | [name] | $[amount] |

#### Retirement Accounts
| Account Type | Institution | Approx. Value | Current Beneficiary |
|-------------|-------------|---------------|---------------------|
| [401k/IRA/etc.] | [name] | $[amount]  | [verify: is spouse named?] |

#### Insurance Policies
| Type | Company | Face Value | Current Beneficiary |
|------|---------|------------|---------------------|
| [life insurance if any] | [company] | $[amount] | [verify] |

### 3. Beneficiaries
| Name         | Relationship | Minor? | Special Needs? | Contact       |
|-------------|-------------|--------|----------------|---------------|
| [spouse]    | Spouse      | No     | No             | [info]        |
| [child 1]   | Child       | Yes (age 12) | No       | N/A           |
| [child 2]   | Child       | Yes (age 8)  | No       | N/A           |

**Note:** Both children are minors. You will need to discuss guardianship and how assets will be managed for them until they reach adulthood. See Section 5 below.

### 4. Executor Selection
| Role               | Name         | Relationship | Contact       |
|--------------------|-------------|-------------|---------------|
| Primary executor   | [consider: spouse, sibling, trusted friend] | | |
| Alternate executor | [who serves if primary cannot?] | | |

### 5. Guardianship (Minor Children Present)
| Role               | Name         | Relationship | Contact       |
|--------------------|-------------|-------------|---------------|
| Primary guardian   | [who should raise your children?] | | |
| Alternate guardian | [backup guardian] | | |

**Think about when choosing a guardian:**
- Shared values and parenting approach
- Willingness to serve (have you asked them?)
- Financial stability to absorb additional children
- Geographic location and impact on children's existing school and friendships
- Age and health of the proposed guardian
- Existing relationship between the guardian and your children

### 6. Specific Wishes
- Residuary estate: Discuss with attorney how to structure distributions for minor children (common options include outright at age of majority, staggered distributions at milestone ages, or testamentary trust)

### 7. Additional Considerations
- [ ] Funeral/burial preferences: [document your preferences]
- [ ] Pet care provisions: [if applicable]
- [ ] Simultaneous death clause: Discuss with attorney what happens if both spouses die in the same event

### 8. Questions for Attorney
1. How should we structure the will so assets are managed for our minor children until they reach adulthood?
2. Should we create a testamentary trust within the will for the children's inheritance?
3. At what age should the children receive their inheritance outright? (Common options: 18, 21, 25, or staggered)
4. Do our retirement account beneficiary designations align with our will intentions?
5. How is our house title currently structured, and does it need to change?
6. Do we need separate wills or can we do a joint will?
7. Should we also set up powers of attorney and healthcare directives at the same meeting?
8. What happens to our assets if both of us die before the children reach adulthood?

### Next Steps
- [ ] Both spouses fill in all blank fields above
- [ ] Verify current beneficiary designations on all retirement accounts and insurance policies
- [ ] Gather recent statements for all financial accounts
- [ ] Bring a copy of the house deed or title documents
- [ ] Discuss guardian choices with each other and with the proposed guardians
- [ ] Schedule estate attorney consultation
- [ ] Bring this completed checklist and all gathered documents to the meeting
