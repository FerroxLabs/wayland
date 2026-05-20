---
name: estate-document-organizer
description: |
  Creates a master document inventory template for estate-critical records including
  legal documents, financial accounts, insurance policies, property records, and digital
  access information. Produces a categorized filing system with location tracking for
  each document.
  Use when the user asks about organizing estate documents, creating a document inventory,
  where to store important papers, or how to ensure family members can find critical
  records.
  Do NOT use for drafting legal documents, providing financial advice, or digital asset
  management specifically (use digital-estate-planner for comprehensive digital inventory).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "estate-planning legal-literacy checklist template"
  category: "legal-civic"
  subcategory: "estate-planning"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "beginner"
---

# Estate Document Organizer

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand legal concepts and processes. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Laws vary by jurisdiction and change over time. Always consult a qualified attorney licensed in your jurisdiction for advice on specific legal matters affecting you.

## When to Use

**Use this skill when:**
- User asks about organizing their important documents for estate planning
- User wants to create a master list of where all their critical documents are located
- User asks what documents their family would need if something happened to them
- User is preparing for an estate attorney meeting and wants to gather documents
- User asks about safe storage for wills, deeds, and other legal records
- User wants a system for keeping estate-critical records current and accessible

**Do NOT use when:**
- User asks about creating or drafting legal documents (refer to an estate attorney)
- User asks about digital assets specifically (use `digital-estate-planner`)
- User asks about financial planning or investment decisions (refer to a financial advisor)
- User asks about document destruction schedules for tax records (refer to a tax advisor)
- User needs help understanding a specific document's contents (use the appropriate legal literacy skill)

## Process

1. **Explain the purpose of the document inventory.** An estate document organizer ensures that family members, executors, and attorneys can locate every critical document when needed. It does not replace proper legal document creation -- it ensures existing documents are catalogued, stored safely, and accessible to the right people at the right time.

2. **Walk through document categories.** Guide the user through each category, asking what they have and where it is currently stored:

   **Category 1: Legal Documents**
   - Last will and testament (original and copies)
   - Trust documents (if any)
   - Powers of attorney (financial and healthcare)
   - Healthcare directives / living will
   - Prenuptial or postnuptial agreements
   - Divorce decrees and settlement agreements
   - Adoption papers
   - Citizenship or naturalization documents
   - Court orders affecting custody, property, or support obligations

   **Category 2: Identity Documents**
   - Birth certificates (for account holder and dependents)
   - Social Security cards
   - Passports
   - Marriage certificate
   - Driver's licenses or state IDs
   - Military discharge papers (DD-214)

   **Category 3: Financial Account Records**
   - Bank account information (institution, account numbers, contact)
   - Investment and brokerage account records
   - Retirement account records (401k, IRA, pension)
   - Recent tax returns (minimum 3 years)
   - Business financial records (if applicable)
   - Loan documents (mortgage, auto, personal, student)
   - Credit card accounts

   **Category 4: Insurance Policies**
   - Life insurance policies
   - Health insurance cards and policy information
   - Homeowners or renters insurance
   - Auto insurance
   - Umbrella or liability policies
   - Long-term care insurance
   - Disability insurance

   **Category 5: Property Records**
   - Real estate deeds and titles
   - Mortgage documents
   - Vehicle titles and registrations
   - Property tax records
   - Home improvement records (for cost basis)
   - Rental property leases and agreements

   **Category 6: Estate Planning Specifics**
   - Beneficiary designation copies (retirement, insurance, POD/TOD accounts)
   - Letter of intent or letter of instruction (non-binding wishes)
   - Funeral and burial pre-arrangements
   - Organ donation documentation
   - Cemetery deed or memorial arrangements
   - Safe deposit box location and access information

   **Category 7: Business Documents (if applicable)**
   - Business formation documents (articles of incorporation, LLC operating agreement)
   - Partnership agreements
   - Buy-sell agreements
   - Business insurance policies
   - Key employee information
   - Business succession plan

3. **Document storage locations.** For each document, record:
   - Physical location (home safe, safe deposit box, attorney's office, filing cabinet)
   - Whether a digital copy exists and where it is stored
   - Who has access to the storage location
   - Whether the document is an original or a copy (some documents require originals)

4. **Address storage best practices.** Explain common storage considerations:
   - Original wills should be stored where the executor can access them promptly -- a safe deposit box may create access delays depending on jurisdiction
   - Fireproof home safes provide protection but ensure someone else knows the combination
   - Attorneys often keep original wills in their vault -- note which attorney and their contact information
   - Digital copies serve as backups but are not legal substitutes for originals in most cases
   - Safe deposit boxes may be sealed upon the owner's death in some jurisdictions -- discuss access provisions with the attorney

5. **Create the access plan.** Identify who needs to know what:
   - Executor: needs access to the will, financial records, and property documents
   - Healthcare agent: needs access to healthcare directive and insurance information
   - Financial POA agent: needs access to financial accounts and property records
   - Trusted family member: should know the location of this master inventory
   - Attorney: should have copies of all legal documents they prepared

6. **Compile the master inventory.** Organize all information into the output format template.

## Output Format

```
## Estate Document Master Inventory

### Document Owner: [Full Legal Name]
### Last Updated: [Date]
### Inventory Location: [Where this document itself is stored]
### Emergency Contacts Who Know About This Inventory: [Names and contact info]

---

### Category 1: Legal Documents
| Document                | Status    | Original Location     | Copy Location    | Last Updated |
|------------------------|-----------|-----------------------|------------------|-------------|
| Will                   | [have/need] | [location]          | [location]       | [date]      |
| Trust documents        | [have/need/N/A] | [location]    | [location]       | [date]      |
| Financial POA          | [have/need] | [location]          | [location]       | [date]      |
| Healthcare POA         | [have/need] | [location]          | [location]       | [date]      |
| Healthcare directive   | [have/need] | [location]          | [location]       | [date]      |
| Prenup/Postnup         | [have/N/A] | [location]          | [location]       | [date]      |
| Divorce decree         | [have/N/A] | [location]          | [location]       | [date]      |

### Category 2: Identity Documents
| Document                | Location           | Expiration Date | Notes           |
|------------------------|--------------------|-----------------|-----------------|
| Birth certificate      | [location]         | N/A             |                 |
| Social Security card   | [location]         | N/A             |                 |
| Passport               | [location]         | [date]          |                 |
| Marriage certificate   | [location]         | N/A             |                 |
| Military DD-214        | [location or N/A]  | N/A             |                 |

### Category 3: Financial Accounts
| Account Type   | Institution | Account # (last 4) | Primary Contact | Beneficiary On File |
|---------------|-------------|---------------------|-----------------|---------------------|
| Checking      | [name]      | [xxxx]              | [phone/web]     | [name or POD]       |
| Savings       | [name]      | [xxxx]              | [phone/web]     | [name or POD]       |
| 401(k)        | [name]      | [xxxx]              | [phone/web]     | [name]              |
| IRA           | [name]      | [xxxx]              | [phone/web]     | [name]              |
| Brokerage     | [name]      | [xxxx]              | [phone/web]     | [name or TOD]       |

### Category 4: Insurance Policies
| Policy Type    | Company      | Policy #     | Face Value   | Beneficiary    | Agent Contact |
|---------------|-------------|-------------|-------------|----------------|---------------|
| Life          | [company]   | [number]    | $[amount]   | [name]         | [contact]     |
| Health        | [company]   | [number]    | N/A         | N/A            | [contact]     |
| Homeowners    | [company]   | [number]    | $[coverage] | N/A            | [contact]     |
| Auto          | [company]   | [number]    | $[coverage] | N/A            | [contact]     |

### Category 5: Property Records
| Property/Asset  | Location/Description | Title Held As | Document Location | Value (approx.) |
|----------------|---------------------|---------------|-------------------|-----------------|
| Primary home   | [address]           | [ownership]   | [deed location]   | $[amount]       |
| Vehicle 1      | [make/model/year]   | [ownership]   | [title location]  | $[amount]       |

### Category 6: Estate Planning Specifics
| Item                          | Status         | Location           |
|------------------------------|----------------|--------------------|
| Beneficiary designation copies | [gathered/need] | [location]       |
| Letter of intent              | [written/not yet] | [location]     |
| Funeral pre-arrangements      | [yes/no]       | [location/provider] |
| Organ donation                | [registered/not] | [documentation]  |
| Safe deposit box              | [have/none]    | [bank, box #, key location] |

### Category 7: Business Documents (if applicable)
| Document              | Location           | Key Contact        |
|----------------------|--------------------|--------------------|
| [document name]      | [location]         | [name/phone]       |

---

### Access Plan
| Person              | Role              | Has Access To           | Contact          |
|--------------------|-------------------|-------------------------|------------------|
| [name]             | Executor          | Will, financial records  | [info]           |
| [name]             | Healthcare agent  | Healthcare directive     | [info]           |
| [name]             | Financial POA     | Financial accounts       | [info]           |
| [name]             | Attorney          | All legal documents      | [info]           |

### Professional Contacts
| Role                | Name              | Firm/Company    | Phone          |
|--------------------|-------------------|-----------------|----------------|
| Estate attorney    | [name]            | [firm]          | [phone]        |
| Financial advisor  | [name]            | [firm]          | [phone]        |
| CPA/Tax preparer   | [name]            | [firm]          | [phone]        |
| Insurance agent    | [name]            | [company]       | [phone]        |

### Review Schedule
- [ ] Annual review: [set month each year]
- [ ] Review after: marriage, divorce, birth, death, home purchase/sale, job change
- [ ] Share updated inventory location with executor and trusted family member
```

## Rules

1. NEVER include full account numbers, Social Security numbers, or passwords in the inventory -- use last-4-digits or reference codes only
2. NEVER advise the user on which estate documents they need -- present the complete category list and let the user and their attorney determine what applies to their situation
3. NEVER provide jurisdiction-specific legal conclusions without explicitly noting the jurisdiction and recommending local verification
4. This skill prepares users for professional estate planning engagement -- it does not replace an attorney
5. ALWAYS include the Access Plan section -- an inventory no one can find is useless
6. ALWAYS note that original documents may be required for legal proceedings -- copies may not suffice
7. If the user has a safe deposit box, note that access rules upon the owner's death vary by jurisdiction and should be discussed with an attorney
8. ALWAYS recommend a regular review schedule (annually at minimum, plus after major life events)
9. NEVER store this inventory in only one location -- recommend at least two secure locations with different access paths
10. If the user mentions they have no will or other legal documents, note the gap but do not pressure them -- suggest they discuss priorities with an estate attorney

## Edge Cases

- **User has documents scattered across multiple locations and cannot find some:** Start with what they can locate and mark missing documents explicitly. A partially complete inventory is far more useful than none. Suggest checking with their attorney, former employers (for retirement accounts), state unclaimed property databases, and insurance policy locators for potentially lost records.

- **User rents and has minimal assets:** The inventory still applies. Renters need identity documents organized, may have renter's insurance, should track bank accounts and retirement accounts from employment, and benefit from having a healthcare directive. Scale the template to their situation by marking inapplicable sections as N/A rather than removing them.

- **User is organizing for a parent who is losing cognitive capacity:** Note that the parent must still be competent to execute new legal documents (will, POA, directive). Prioritize gathering what already exists. If documents do not exist and the parent is losing capacity, note this as an urgent matter to discuss with an elder law attorney.

- **User asks about digital storage of original documents:** Digital copies serve as backups but generally cannot replace originals for legal proceedings. An original will with "wet" signatures is required in most jurisdictions. Scanned copies are useful for reference and as proof of existence, but the original must be preserved and accessible.

- **Married couple with both shared and separate assets:** Create separate inventories for each spouse's individual assets (premarital property, inherited assets) and a shared section for joint assets. Note that asset classification (separate vs. marital) varies by jurisdiction and can affect estate distribution.

## Example

**Input:** "My dad passed away last year and it took us months to find all his documents and figure out his accounts. I don't want to put my family through that. Help me get organized."

**Output:**

## Estate Document Master Inventory

### Document Owner: [Your Full Legal Name]
### Last Updated: [Today's Date]
### Inventory Location: [You will decide this -- see storage notes below]
### Emergency Contacts Who Know About This Inventory: [Executor and one trusted family member]

Based on your experience with your father's estate, you know firsthand why this matters. Let us build the inventory category by category. For each item, note what you have, where the original is stored, and whether a copy exists elsewhere.

---

### Category 1: Legal Documents
| Document                | Status    | Original Location     | Copy Location    | Last Updated |
|------------------------|-----------|-----------------------|------------------|-------------|
| Will                   | [have/need] | [where is it?]     | [copy where?]   | [date]      |
| Financial POA          | [have/need] | [where is it?]     | [copy where?]   | [date]      |
| Healthcare POA         | [have/need] | [where is it?]     | [copy where?]   | [date]      |
| Healthcare directive   | [have/need] | [where is it?]     | [copy where?]   | [date]      |

If you do not have any of these documents, note "NEED" and discuss priorities with an estate attorney. Given your experience, you likely want to start here.

### Category 2: Identity Documents
| Document                | Location           | Expiration Date | Notes           |
|------------------------|--------------------|-----------------|-----------------|
| Birth certificate      | [where?]           | N/A             |                 |
| Social Security card   | [where?]           | N/A             |                 |
| Passport               | [where?]           | [when?]         |                 |
| Marriage certificate   | [where? or N/A]    | N/A             |                 |

### Category 3: Financial Accounts
| Account Type   | Institution | Account # (last 4) | Primary Contact | Beneficiary On File |
|---------------|-------------|---------------------|-----------------|---------------------|
| [list every account] | | | | [verify each one] |

**Lesson from your experience:** Your family had to search for your father's accounts. Make sure every account is listed here with the institution's contact information so your family never has to guess.

### Category 4: Insurance Policies
| Policy Type    | Company      | Policy #     | Face Value   | Beneficiary    | Agent Contact |
|---------------|-------------|-------------|-------------|----------------|---------------|
| [list all policies] | | | | [verify] | |

### Category 5: Property Records
| Property/Asset  | Location/Description | Title Held As | Document Location | Value (approx.) |
|----------------|---------------------|---------------|-------------------|-----------------|
| [list all] | | | | |

### Category 6: Estate Planning Specifics
| Item                          | Status         | Location           |
|------------------------------|----------------|--------------------|
| Beneficiary designation copies | [gathered?]   | [where?]           |
| Letter of intent              | [consider writing one] | [location]  |
| Funeral preferences           | [documented?]  | [where?]           |
| Safe deposit box              | [have one?]    | [bank, box number, who has key?] |

---

### Access Plan
| Person              | Role              | Has Access To           | Contact          |
|--------------------|-------------------|-------------------------|------------------|
| [name your executor] | Executor        | Full inventory, legal docs | [phone/email]  |
| [name your healthcare agent] | Healthcare agent | Healthcare directive, insurance | [phone/email] |
| [trusted family member] | Backup contact | Knows inventory exists and location | [phone/email] |

### Storage Recommendations
Based on what your family experienced:
1. Store this inventory in two locations (home fireproof safe + secure digital backup)
2. Tell your executor where both copies are -- do not make them search
3. Store original will where it can be accessed promptly (discuss with attorney -- safe deposit boxes can cause delays in some jurisdictions)
4. Keep digital copies of all documents as backup, but preserve originals

### Review Schedule
- [ ] Set an annual review date: [pick a month you will remember -- many people use their birthday or the new year]
- [ ] Review immediately after: marriage, divorce, birth, death, home purchase or sale, retirement, major financial change
- [ ] Verify beneficiary designations annually (the most commonly overlooked update)
