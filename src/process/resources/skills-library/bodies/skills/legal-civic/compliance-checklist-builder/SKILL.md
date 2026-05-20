---
name: compliance-checklist-builder
description: |
  Builds a business compliance self-audit checklist organized by category (registration, tax, employment, industry-specific, data privacy, insurance) based on the user's business type, size, and location. Produces a prioritized checklist with deadlines, responsible parties, and resources for verification.
  Use when the user is starting a business and wants to know what compliance requirements apply, wants to audit their current compliance status, or needs to prepare for a compliance review.
  Do NOT use for tax preparation, regulatory filing, legal compliance certification, or industry-specific regulatory guidance requiring specialized expertise.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "legal-literacy checklist guide planning"
  category: "legal-civic"
  subcategory: "business-legal"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "intermediate"
---
# Compliance Checklist Builder

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand compliance concepts and processes. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Laws vary by jurisdiction and change frequently. Always consult a qualified attorney licensed in your jurisdiction and a licensed CPA or enrolled agent for advice on specific legal and tax matters affecting your business.

---

## When to Use

**Use this skill when:**
- A user is launching a new business and needs to know which registrations, permits, licenses, and ongoing filings apply before opening
- A user wants to self-audit their existing business for compliance gaps -- for example, after adding employees, crossing a revenue threshold, or expanding into a new state
- A user is preparing for a first meeting with a business attorney or CPA and wants to arrive with a structured list of compliance questions specific to their business type and location
- A user is expanding an existing business into a new state or jurisdiction and needs to understand foreign entity registration, new tax nexus, and additional licensing requirements
- A user is changing their business structure (e.g., converting a sole proprietorship to an LLC or an LLC to a corporation) and needs to understand what compliance obligations change as a result
- A user has recently hired their first employee (or first employees) and needs to understand the full stack of new employment compliance obligations that are triggered
- A user is adding an online sales channel to a previously brick-and-mortar business and needs to understand new sales tax nexus, data privacy, and PCI DSS obligations

**Do NOT use when:**
- The user wants to actually file registrations, tax returns, or permits on their behalf -- this skill builds checklists, it does not execute filings (use the user's state's online business portal directly)
- The user needs deep industry-specific regulatory compliance guidance -- for example, full FDA 21 CFR Part 11 compliance for a pharmaceutical manufacturer, SEC registration for an investment adviser, or FINRA compliance for a broker-dealer (these require specialized licensed professionals)
- The user is facing an active compliance investigation, enforcement action, regulatory subpoena, or litigation -- that is a legal emergency requiring an attorney immediately, not a checklist
- The user wants tax preparation, tax strategy, or tax return preparation (use a tax-specific skill or refer to a CPA/enrolled agent)
- The user needs HIPAA compliance implementation guidance beyond general awareness -- HIPAA technical and administrative safeguard implementation requires a specialized healthcare compliance consultant
- The user needs a legal compliance opinion letter or certification that can be presented to a third party (investors, lenders, regulators) -- that requires a licensed attorney
- The user is in a country outside the United States -- this skill is U.S.-focused; international compliance requires jurisdiction-specific expertise

---

## Process

### Step 1: Gather the Business Profile (Ask Before Building)

Before generating any checklist, collect the following information. If the user has not provided it, ask in a single grouped request to avoid back-and-forth. All items are material to checklist accuracy.

- **Business activity:** What does the business actually do? (e.g., "home cleaning service," "e-commerce clothing retailer," "SaaS software company," "food truck," "pediatric dental practice") -- a general category label is insufficient; the specific activity determines industry-specific licensing
- **Entity type:** Sole proprietorship, single-member LLC, multi-member LLC, S corporation, C corporation, general partnership, limited partnership, professional LLC (PLLC), nonprofit 501(c)(3), or other
- **Formation state:** The state where the entity is (or will be) registered -- this is the domestic state and governs annual report filings, franchise taxes, and operating agreement requirements
- **Operating state(s) and city/county:** Where the business physically operates, hires employees, or maintains inventory -- each state/locality with physical presence or nexus may trigger separate registration and tax obligations
- **Number of employees:** Include the owner if they work in the business. Thresholds matter: federal FMLA (50+ employees), ACA employer mandate (50+ full-time equivalent employees), COBRA (20+ employees), WARN Act (100+ employees), and many state laws have their own thresholds
- **Revenue range (approximate):** Under $50K / $50K-$250K / $250K-$1M / $1M-$5M / Over $5M -- triggers franchise tax filing thresholds, sales tax filing frequency, and CCPA/CPRA applicability
- **Products, services, or both:** Determines sales tax obligations (product taxability varies by state; services are taxable in some states)
- **Online sales:** Yes/No -- triggers multi-state sales tax economic nexus analysis
- **Customer data collected:** Yes/No, and if yes, what type (email/name only vs. financial data, health data, data from minors under 13, biometric data) -- each data type triggers different regulatory frameworks
- **Regulated activity or industry:** Does the business involve food, alcohol, firearms, cannabis, healthcare, financial services, real estate, insurance, childcare, transportation, or construction? These all have federal or state licensing layered on top of general business compliance.
- **Home-based or commercial location:** Home occupation permits are required in many municipalities; commercial locations require zoning verification and certificates of occupancy

---

### Step 2: Build Category 1 -- Business Registration and Licensing

Apply these rules systematically based on the profile gathered in Step 1.

- **Entity formation filing:** LLCs require Articles of Organization (or Certificate of Formation in Texas/Delaware); corporations require Articles of Incorporation. Filing fees vary by state: $50 (Kentucky, Iowa) to $500 (Massachusetts). Delaware and Wyoming are popular for their business-friendly statutes but note that a business operating in another state must still register as a foreign entity there, paying that state's fees on top of the domestic state fees.
- **Foreign entity registration:** Required in every state where the business has physical presence (office, employees, inventory, or regular in-person activity). File a "Certificate of Authority" or "Foreign Qualification" with the Secretary of State. Fees typically range from $100-$750 per state. Failure to register can result in fines, loss of the right to sue in that state's courts, and personal liability for officers who transact business without authorization.
- **Registered agent requirement:** Every LLC and corporation must maintain a registered agent in each state where registered -- someone physically present in the state to receive legal and regulatory documents. The owner can serve this role, or a registered agent service can be hired for $50-$300/year per state.
- **DBA (fictitious business name) filing:** Required when the business operates under any name other than the legal entity name. Filed at the county or state level depending on the state. Some states (California, Texas) require newspaper publication after filing. Fees are typically $10-$100.
- **Federal EIN:** Required for any business with employees, any partnership, any corporation, and multi-member LLCs. Single-member LLCs with no employees can use the owner's SSN but an EIN is strongly recommended for banking and liability reasons. Apply at IRS.gov at no cost; issued immediately online.
- **Business license vs. operating permit:** Most cities and many counties require a general business license or business operating permit. This is separate from industry-specific permits. Annual fees range from $25 (small municipalities) to $1,500+ (San Francisco Gross Receipts registration). Verify with the city clerk's office or local business licensing department.
- **Zoning compliance:** Before signing a lease or operating from any location, verify the property's zoning classification permits the intended use. Mixed-use, industrial, commercial, and residential zones have different permitted activities. A certificate of occupancy (CO) is required before operating in most commercial spaces after construction or change of use.
- **Professional licensing:** Many states require individual professional licenses before forming a business entity. Professions with licensing requirements in most or all states include: physicians, dentists, attorneys, CPAs, real estate agents, engineers, architects, contractors, insurance agents, mortgage brokers, cosmetologists, pest control operators, and HVAC technicians. The licensing board (not the Secretary of State) issues these -- identify the correct state board for each profession.

---

### Step 3: Build Category 2 -- Tax Compliance

Tax compliance has the most variability by state and entity type. Apply the following framework systematically.

- **Federal income tax entity classification:**
  - Sole proprietorship: Schedule C on Form 1040; self-employment tax at 15.3% on net earnings up to $168,600 (2024) + 2.9% Medicare above that threshold (subject to annual adjustment)
  - Single-member LLC (default): treated as disregarded entity; same as sole proprietorship unless S-corp election made
  - Multi-member LLC (default): treated as partnership; Form 1065 with Schedule K-1 to each member
  - S corporation: Form 1120-S with Schedule K-1 to shareholders; owners who work in the business must take a "reasonable salary" subject to payroll taxes
  - C corporation: Form 1120; flat 21% federal corporate income tax rate (post-TCJA); subject to double taxation on dividends unless reinvested
- **State income/franchise taxes:** All states with income taxes require a corresponding state return. But several states impose taxes on businesses regardless of income: Texas franchise tax (margin tax on revenue over $2.47 million threshold, rates of 0.331% for retail/wholesale or 0.75% for other businesses); Delaware franchise tax (minimum $50/year for LLCs, $400+ for corporations using authorized shares method); California minimum franchise tax ($800/year for LLCs, corporations, and LPs, even at a loss); New York State has a corporate franchise tax minimum of $25 for S-corps up to $200+ depending on payroll and capital.
- **Sales and use tax:** 45 states + Washington D.C. impose sales tax. No sales tax states: Alaska (but local jurisdictions may impose one), Delaware, Montana, New Hampshire, Oregon. Key decisions to make: (1) Is the product/service taxable in each state? (Food, prescription drugs, and clothing are exempt in some states but taxable in others.) (2) Does the business have nexus (physical or economic) in each state? (3) What is the correct tax rate for each jurisdiction, including state, county, city, and special district rates? Sales tax rates range from 0% to over 10% when combined with local rates.
- **Economic nexus thresholds (post-South Dakota v. Wayfair, 2018):** Every state with a sales tax has adopted economic nexus rules. The most common threshold is $100,000 in annual sales OR 200 transactions in the state, but variations exist: California ($500,000 in sales only, no transaction count), Pennsylvania ($100,000 in sales only), and others. Once nexus is established, the business must register with the state tax authority, collect sales tax, and remit it on a schedule (monthly for high-volume sellers, quarterly or annually for lower volume).
- **Estimated quarterly tax payments:** Required when expected tax liability exceeds $1,000 for the year (federal). Federal due dates: April 15 (Q1), June 15 (Q2), September 15 (Q3), January 15 of the following year (Q4). Most states mirror the federal schedule but verify -- California uses April 15, June 15, September 15, and January 15, but applies uneven percentages (30%/40%/0%/30%). Penalties for underpayment are based on the federal short-term rate plus 3 percentage points.
- **Payroll taxes (if employees exist):** Federal obligations include: (1) Income tax withholding based on W-4; (2) Social Security at 6.2% employer + 6.2% employee on wages up to the wage base ($168,600 in 2024); (3) Medicare at 1.45% employer + 1.45% employee with an additional 0.9% employee-only on wages over $200,000; (4) FUTA at 0.6% net (after state credit) on first $7,000 per employee; (5) State unemployment tax (SUTA) -- rates vary by state and employer experience rating, typically on the first $7,000-$56,000 of wages depending on the state.
- **1099 reporting:** Form 1099-NEC for any independent contractor paid $600+ per year; Form 1099-MISC for rent, prizes, and other miscellaneous payments over $600; due to the IRS by January 31 of the following year. Note: payments to corporations are generally exempt from 1099 reporting, but payments to attorneys are always reportable regardless of entity type.

---

### Step 4: Build Category 3 -- Employment Compliance

This category only applies if the business has employees (W-2) or engages independent contractors. Apply the following for each scenario.

- **New hire checklist (per employee):**
  - Form I-9 (Employment Eligibility Verification): must be completed within 3 business days of hire; keep on file for 3 years from hire date or 1 year after termination, whichever is longer; do NOT submit to the government -- retain in your files and have it available for inspection
  - Form W-4: collect before first paycheck; no submission to IRS required unless the employee claims exempt from withholding
  - State equivalent of W-4 if applicable (most states with income tax have their own form)
  - New hire report: must be submitted to the state's new hire reporting directory within 20 days in most states; some states have shorter windows (e.g., California: 20 days, New York: 20 days, Iowa: 15 days)
- **Wage and hour compliance:**
  - Federal minimum wage: $7.25/hour (stagnant since 2009)
  - State minimum wages (2024 examples): California $16/hour, New York City $16/hour, Washington state $16.28/hour, Texas remains at federal $7.25/hour
  - Many cities have higher minimum wages still: Seattle $19.97/hour, Denver $18.29/hour, Chicago $15.80/hour
  - Overtime: non-exempt employees must receive 1.5x their regular rate for hours worked over 40 in a workweek (federal FLSA). Some states (California, most notably) require daily overtime for hours over 8 in a day and double-time for hours over 12 in a day.
  - FLSA white-collar exemptions (executive, administrative, professional) require a minimum salary of $684/week ($35,568/year) as of 2024 -- note that the DOL has proposed increasing this threshold; verify current threshold.
- **Workplace posting requirements:** Federal posters required (all employers): FLSA minimum wage poster, FMLA poster (50+ employees), OSHA poster (Job Safety and Health -- It's the Law), Equal Employment Opportunity poster, Employee Polygraph Protection Act poster. Many states have additional required posters. The DOL provides free printable posters; must be posted where all employees can see them.
- **Workers' compensation:** Required in virtually every state; Texas is the only state where private employers can opt out (though opted-out employers lose tort immunity protections). State-specific: Ohio, North Dakota, Washington, and Wyoming require coverage through the state fund exclusively -- no private carriers allowed. Premiums are based on payroll and job classification codes. Misclassifying employees as independent contractors to avoid workers' comp coverage is a common compliance violation with significant penalty exposure.
- **Employee handbook:** Not legally required in most states but strongly recommended. Must-include policies to limit legal exposure: at-will employment statement (if applicable -- all states except Montana are at-will), sexual harassment prevention policy (mandatory in California, New York, and Illinois), paid sick leave policy (required by many states and cities), overtime/timekeeping policy, social media policy, remote work policy (if applicable), and disciplinary procedures.

---

### Step 5: Build Category 4 -- Data Privacy and Security

Data privacy is the fastest-evolving compliance area for small businesses. Apply based on data collection scope and geography of customers.

- **State consumer privacy laws (active as of 2024):**
  - California: CCPA/CPRA applies to for-profit businesses that: (a) have annual gross revenues over $25 million, OR (b) buy/sell/share personal data of 100,000+ consumers or households per year, OR (c) derive 50%+ of annual revenues from selling personal data. Rights include right to know, right to delete, right to opt out of sale/sharing. Enforcement by California Attorney General; statutory damages of $100-$750 per consumer per incident for data breaches.
  - Virginia (VCDPA): similar thresholds but applies to businesses processing data of 100,000+ consumers or 25,000+ consumers if 50%+ of gross revenue from data sale
  - Colorado (CPA), Connecticut (CTDPA), Texas (TDPSA), Montana (MCDPA), Oregon (OCPA), and others: all have similar frameworks with slightly different thresholds and rights. Check effective dates -- many of these became effective in 2023-2024.
  - Even businesses below these thresholds must have a basic privacy policy if they have a website that collects any personal information. Many state attorneys general have taken enforcement action against small businesses for deceptive privacy practices.
- **PCI DSS compliance:** Required of any business accepting credit or debit cards. Governed by the Payment Card Industry Security Standards Council. Compliance level depends on transaction volume: Level 4 merchants (under 20,000 Visa e-commerce transactions or up to 1 million total Visa transactions per year) can self-assess with a Self-Assessment Questionnaire (SAQ). Level 1 merchants (over 6 million Visa transactions per year) require an annual audit by a Qualified Security Assessor (QSA). Using a compliant payment processor (Stripe, Square, PayPal) does not automatically make the business PCI DSS compliant -- the business still must complete an SAQ and maintain certain internal controls.
- **COPPA (Children's Online Privacy Protection Act):** Federal law enforced by the FTC. Applies to any website or online service directed to children under 13, or that has actual knowledge it is collecting data from children under 13. Requires verifiable parental consent before collecting, using, or disclosing personal information from children. Violations can result in civil penalties up to $51,744 per violation.
- **Data breach notification:** All 50 states now have data breach notification laws. Most require notification within 30-72 hours of discovering a breach. Federal sector-specific laws also apply: HIPAA requires breach notification to HHS within 60 days; FTC Safeguards Rule (for financial institutions and adjacent businesses) requires notification within 30 days.
- **Website terms of service and privacy policy:** Required if collecting any personal data via a website. The privacy policy must disclose: what data is collected, how it is used, with whom it is shared, how users can request deletion, and how to contact the business about privacy concerns. A terms of service agreement is separate and governs the legal relationship with users. CalOPPA (California Online Privacy Protection Act) requires a conspicuous privacy policy link for any website accessible by California residents -- effectively all websites.

---

### Step 6: Build Category 5 -- Insurance Requirements

Insurance has both legally mandated components and strongly recommended components. Apply the following framework.

- **Workers' compensation:** Legally required in 49 states once you have employees (or in some states, after a certain number of employees). Texas is the single exception. Even in Texas, operating without workers' comp exposes the employer to direct tort liability for workplace injuries.
- **General liability:** Not legally required in most states but required by most commercial leases and many client contracts. Covers third-party bodily injury (slip-and-fall), property damage caused by your operations, and personal injury (defamation, advertising injury). A $1 million per occurrence / $2 million aggregate policy is a standard starting point for small businesses; costs range from $400-$1,500/year for low-risk businesses.
- **Professional liability (Errors and Omissions -- E&O):** Critical for service businesses. Required by contract for many professional services. Covers claims that your professional advice or service caused a client financial harm. Architects, engineers, IT consultants, accountants, marketing agencies, and consultants are the most common purchasers. Costs range from $500-$5,000+/year depending on profession and revenue.
- **Commercial auto:** Required if the business owns vehicles. Personal auto policies typically exclude business use. If employees use personal vehicles for business, a hired and non-owned auto endorsement is needed.
- **Commercial property:** Covers business equipment, furniture, inventory, and sometimes leasehold improvements. Commercial leases often require tenants to maintain property insurance on their own contents and equipment. The landlord's policy typically covers only the building structure.
- **Cyber liability insurance:** Increasingly important and sometimes required by client contracts. Covers first-party costs of a data breach (notification costs, forensics, credit monitoring for affected customers) and third-party liability (lawsuits from affected individuals, regulatory fines). Annual premiums for small businesses typically range from $500-$2,500 depending on revenue, data handled, and security controls in place.
- **Business owner's policy (BOP):** Bundles general liability + commercial property into a single package policy, typically at a discount. Most appropriate for small businesses with physical locations. Not available for all industries (construction, healthcare are often excluded from standard BOP eligibility).

---

### Step 7: Build Category 6 -- Ongoing Compliance Calendar

Create a recurring compliance calendar with specific frequencies and due dates.

- **Annual report filings:** Required in most states for LLCs and corporations. Deadlines vary: California Biennial Statement of Information (every 2 years, $20); Delaware annual report (March 1, starting at $50 for LLCs, $50+ for corporations based on authorized shares or assumed par value method); Florida annual report (May 1, $138.75); Texas does not have a traditional annual report but requires a Public Information Report (PIR) with the franchise tax filing due May 15. Late fees range from $25-$500 and can lead to administrative dissolution.
- **Sales tax return frequency:** Most states assign a filing frequency based on volume. Typically: over $1,200/month in collected tax = monthly; $300-$1,200/month = quarterly; under $300/month = annually. Monthly filers typically have a 20th-of-the-month deadline; due dates vary by state. File even in months where you collected $0 (zero returns are often required to avoid suspension of permit).
- **Federal payroll tax deposits:** Frequency depends on lookback period and liability amount. New employers are monthly depositors. Semi-weekly depositors must deposit by Wednesday if payroll ran on Wednesday/Thursday/Friday, and by Friday if payroll ran on Saturday/Sunday/Monday/Tuesday. If payroll tax liability reaches $100,000 on any day, a deposit is due the next business day (the "one-day rule").
- **FUTA (Form 940):** Filed annually by January 31. If undeposited FUTA liability exceeds $500 during any quarter, deposit by the last day of the month following that quarter.
- **State unemployment tax (SUTA):** Typically quarterly; most states require the return and payment by the last day of the month following the quarter end (April 30, July 31, October 31, January 31).
- **Business license renewals:** Most jurisdictions auto-renew annually but require the business to update information and pay a renewal fee. Some cities require affirmative renewal applications. Put all renewal dates on a single compliance calendar at the time of initial registration.
- **Secretary of State compliance:** Beyond annual reports, LLCs and corporations must update their registered agent, registered office address, officer/director information, and operating agreement within stated timeframes when changes occur. Failure to maintain current information can result in administrative dissolution and personal liability exposure.

---

## Output Format

Produce the following structured output after gathering all business profile information. Every table should be populated with specific, actionable items -- no placeholder rows.

```
## Business Compliance Checklist
### [Business Type] | [Entity Type] | [City, State]
**Generated for:** [Brief description of the business]
**Prepared:** [Month Year]
**Review date:** [12 months from generation date]

---

> ⚠️ **Important:** This checklist is for general educational purposes only. It is not a legal opinion, and it cannot account for every local ordinance, industry-specific requirement, or recent regulatory change. Verify every item with the relevant agency and confirm your overall compliance posture with a licensed business attorney and a CPA or enrolled agent before relying on this checklist.

---

### Business Profile
| Detail | Information |
|--------|-------------|
| Business activity | [Specific description] |
| Entity type | [Entity type] |
| Formation state | [State] |
| Operating location(s) | [City, County, State(s)] |
| Number of employees | [Number (include owner if working)] |
| Annual revenue (estimate) | [Range] |
| Products / Services / Both | [Answer] |
| Online sales | [Yes / No] |
| Customer data collected | [None / Basic contact / Financial / Health / Biometric / Minors] |
| Regulated industry | [Yes -- specify / No] |
| Home-based or commercial | [Home-based / Commercial location] |

---

### PHASE 1: Before Operating (Must Complete First)
*These items must generally be completed before you open, make your first sale, or hire anyone.*

| # | Compliance Item | Category | Est. Cost | Where to File / Verify | Priority |
|---|----------------|----------|-----------|------------------------|----------|
| 1 | [Entity formation filing] | Registration | $[Cost] | [Secretary of State URL description] | 🔴 Critical |
| 2 | [EIN application] | Registration | Free | IRS online application | 🔴 Critical |
| 3 | [DBA filing, if applicable] | Registration | $[Cost] | [County clerk / Secretary of State] | 🟡 If applicable |
| 4 | [City/county business license] | Registration | $[Cost] | [City clerk / licensing dept.] | 🔴 Critical |
| 5 | [Industry-specific permit 1] | Industry | $[Cost] | [Relevant agency] | 🔴 Critical |
| 6 | [Sales tax permit registration] | Tax | [Free / $Cost] | [State tax authority] | 🔴 Critical |
| 7 | [Zoning compliance / CO] | Zoning | [Varies] | [Local planning dept.] | 🔴 Critical |
| 8 | [General liability insurance] | Insurance | $[Annual range] | Private insurer / broker | 🔴 Critical |
| 9 | [Workers' comp if hiring] | Insurance | $[Annual range] | State fund or private carrier | 🔴 Critical if employees |

---

### PHASE 2: Within 30 Days of Opening (or First Hire)
*These items should be completed very early in operations -- most have hard legal deadlines triggered by hiring or first transactions.*

| # | Compliance Item | Category | Est. Cost | Deadline Trigger | Priority |
|---|----------------|----------|-----------|-----------------|----------|
| 1 | [I-9 for each employee] | Employment | Free | Within 3 business days of each hire | 🔴 Critical |
| 2 | [W-4 collection] | Employment | Free | Before first paycheck | 🔴 Critical |
| 3 | [New hire reporting] | Employment | Free | Within 20 days of hire (verify your state) | 🔴 Critical |
| 4 | [Payroll setup] | Employment | $[Monthly service cost] | Before first paycheck | 🔴 Critical |
| 5 | [Labor law posters] | Employment | $[Poster set cost] | Before first employee starts | 🔴 Critical |
| 6 | [Privacy policy / website terms] | Data Privacy | $[Cost] | Before website/store launches | 🟡 If collecting data |
| 7 | [PCI DSS SAQ] | Data Privacy | Free (self-assess) | Before accepting card payments | 🟡 If accepting cards |
| 8 | [State-specific employment filings] | Employment | [Varies] | [State-specific deadline] | 🟡 State-dependent |

---

### PHASE 3: Ongoing Recurring Compliance
*These items recur on regular schedules. Missing them results in penalties, interest, and potential loss of good standing.*

| # | Compliance Item | Category | Frequency | Approximate Due Date(s) | Est. Annual Cost |
|---|----------------|----------|-----------|------------------------|-----------------|
| 1 | [Federal income tax return] | Tax | Annual | [Entity-specific deadline] | CPA fees |
| 2 | [State income / franchise tax] | Tax | Annual | [State-specific deadline] | [Fee + CPA fees] |
| 3 | [Sales tax returns] | Tax | [Monthly / Quarterly / Annual] | [20th of following period] | [Included in payroll service] |
| 4 | [Payroll tax deposits + Form 941] | Tax | [Semi-weekly / Monthly + Quarterly] | [Deposit schedule] | [Payroll service] |
| 5 | [Annual report / Secretary of State] | Registration | Annual | [State-specific deadline] | $[Fee] |
| 6 | [Business license renewal] | Registration | Annual | [Renewal date] | $[Fee] |
| 7 | [Industry license renewal] | Industry | [Annual / Biennial] | [Renewal date] | $[Fee] |
| 8 | [Insurance renewals] | Insurance | Annual | [Policy expiration dates] | [Premium] |
| 9 | [Workers' comp audit] | Insurance | Annual | [Policy anniversary] | [Adjustment] |
| 10 | [Estimated tax payments] | Tax | Quarterly | Apr 15, Jun 15, Sep 15, Jan 15 | [Estimated amounts] |

---

### Industry-Specific Requirements
*Based on your business activity, the following industry-specific compliance items apply in addition to the general requirements above.*

| Requirement | Issuing Agency | What Is Required | How to Verify |
|-------------|---------------|-----------------|---------------|
| [License/permit/certification] | [Agency name and type] | [What exactly must be done, by whom, and how often] | [Where to verify current requirements] |

---

### Data Privacy Summary
*Applies only if you collect customer, employee, or user personal information.*

| Framework | Applies? | Why / Why Not | Required Action |
|-----------|----------|---------------|----------------|
| CCPA/CPRA (California) | [Yes / No / Monitor] | [Threshold analysis] | [Specific action if applicable] |
| Virginia VCDPA | [Yes / No / Monitor] | [Threshold analysis] | [Specific action if applicable] |
| Other state laws | [Yes / No / Monitor] | [States where customers are located] | [Specific action if applicable] |
| CalOPPA (website privacy) | [Yes if website] | All websites with CA-accessible visitors | Post compliant privacy policy |
| COPPA (children under 13) | [Yes / No] | [Does the business target or knowingly collect from children?] | [Specific action] |
| PCI DSS | [Level 4 / Level 3 / N/A] | [Based on transaction volume] | Complete annual SAQ; maintain controls |
| HIPAA | [Yes / No] | [Health data involved?] | [Specific action if applicable] |

---

### Insurance Coverage Matrix
| Coverage Type | Legally Required? | Contractually Required? | Recommended? | Est. Annual Premium |
|--------------|------------------|------------------------|-------------|---------------------|
| General liability | No (most states) | Often (leases/contracts) | Yes -- essential | $[Range] |
| Professional liability (E&O) | No (most) | Often (client contracts) | Yes for service businesses | $[Range] |
| Workers' compensation | Yes (49 states with employees) | -- | Yes -- critical | $[Range] |
| Commercial property | No | Often (lease) | Yes with physical location | $[Range] |
| Commercial auto | Yes (if business owns vehicles) | -- | Yes if vehicles used | $[Range] |
| Cyber liability | No | Growing (contracts) | Yes if collecting data | $[Range] |
| Business owner's policy (BOP) | No | -- | Yes for eligible small businesses | $[Range] |
| Umbrella / excess liability | No | Sometimes | Consider at $1M+ revenue | $[Range] |

---

### Jurisdiction-Specific Notes
*[State] has the following compliance characteristics that are different from typical/default rules:*

- **[Specific state tax quirk]:** [Details and impact on this business]
- **[Specific state employment law]:** [Details and impact]
- **[Local (city/county) requirements unique to this location]:** [Details]
- **[Any state preemption or exception to a federal rule]:** [Details]

---

### Key Compliance Thresholds to Monitor
*As your business grows, crossing these thresholds will trigger new compliance obligations.*

| Threshold | Compliance Triggered | Action Required |
|-----------|---------------------|----------------|
| 1st employee hired | I-9, W-4, new hire reporting, payroll taxes, workers' comp, labor posters | See Phase 2 employment items |
| 20 employees | COBRA (continuation health coverage) notification requirements | Review with benefits broker |
| 50 full-time equivalent employees | ACA employer mandate (offer affordable health coverage or face penalties); FMLA applies | Consult benefits counsel |
| $100K in sales in a state (typical) | Economic nexus -- must register for sales tax in that state | Register before next sales tax filing deadline |
| $25M annual revenue | CCPA/CPRA applicability threshold (if not already triggered by data volume) | Conduct data mapping and gap assessment |
| 100 FTE employees | WARN Act (60 days advance notice of mass layoffs or plant closings) | Review with employment attorney |

---

### Prioritized Questions for Your Attorney and CPA
*Bring these specific questions to your first professional consultation. They are the highest-risk open items based on your business profile.*

**For your business attorney:**
1. [Specific question about entity structure and liability exposure]
2. [Specific question about the most complex industry-specific licensing requirement]
3. [Specific question about contractor vs. employee classification if using contractors]
4. [Specific question about any multi-state operations or online sales jurisdiction]

**For your CPA or enrolled agent:**
1. [Specific question about entity tax election and whether S-corp election makes sense]
2. [Specific question about sales tax nexus and filing obligations]
3. [Specific question about state franchise or gross receipts tax]
4. [Specific question about estimated payment schedule and avoiding penalties]

---

*This checklist should be reviewed annually or whenever the business undergoes a material change: adding employees, expanding to new states, adding new products or services, exceeding revenue thresholds, or changing entity type. Requirements change -- what was compliant last year may not be compliant today.*
```

---

## Rules

1. **Never omit the disclaimer.** Present it before any substantive guidance. The disclaimer must specifically mention that laws vary by jurisdiction, change over time, and that the checklist is not a substitute for licensed professional advice.

2. **Never state that a checklist is complete.** Always explicitly note that jurisdiction-specific requirements (particularly at the county and city level) may not be fully captured, and that industry-specific requirements may have additional layers not covered in a general checklist. Local ordinances are especially hard to systematize.

3. **Always distinguish between what is legally required vs. strongly recommended.** Insurance is a prime example: general liability is not legally required in most states but is effectively mandatory for most commercial leases and client contracts. Presenting "required" and "recommended" in separate columns or with clear labels prevents users from under-insuring or over-spending on items incorrectly perceived as mandatory.

4. **Always identify the specific issuing agency for every compliance item.** "Get a business license" is useless. "Obtain a City of [City] Business Operating Permit from the [City] Development Services Department; apply online at [city's business licensing portal]" is actionable. Name the Secretary of State for entity filings, the IRS for EINs, the state comptroller or department of revenue for tax permits, the state labor department for unemployment accounts, and the relevant professional licensing board for professional licenses.

5. **Always apply the Wayfair economic nexus analysis for any business with online sales or multi-state operations.** Post-2018, the physical presence standard for sales tax no longer applies. A business with significant online sales into any state must evaluate whether it has crossed that state's economic nexus threshold ($100,000 in sales or 200 transactions in most states, but verify each state). Failing to register and collect sales tax in nexus states is one of the most common and costly compliance failures for e-commerce businesses.

6. **Always flag employee threshold triggers.** The compliance landscape changes dramatically at 1 employee (I-9, W-4, payroll taxes), 20 employees (COBRA), 50 FTE employees (ACA employer mandate, FMLA), and 100 employees (WARN Act). Build these into the "Key Compliance Thresholds to Monitor" section even when the user is currently below the threshold.

7. **Always assess data privacy requirements based on WHERE CUSTOMERS ARE LOCATED, not just where the business is located.** CCPA applies to California residents' data regardless of where the business is based. A Texas LLC selling to California consumers must evaluate CCPA. A business with national online sales must evaluate all active state consumer privacy laws.

8. **Never confuse entity formation state with operating/nexus state.** A Delaware LLC that operates entirely in California must: (a) pay the California $800 minimum franchise tax, (b) register as a foreign LLC in California, (c) file California state income tax returns, AND (d) pay Delaware franchise tax. Choosing a "tax-friendly" formation state (Delaware, Wyoming, Nevada) while operating in another state does not eliminate the operating state's tax obligations.

9. **Always surface the correct entity-specific tax forms and deadlines.** S-corp returns (Form 1120-S) are due March 15, not April 15. Partnership returns (Form 1065) are also due March 15. C-corp returns (Form 1120) are due April 15 (or the 15th day of the 4th month after fiscal year end). Missing an entity-level tax deadline triggers automatic penalties even if no tax is owed.

10. **Always recommend both a business attorney AND a CPA/enrolled agent as separate consultations.** These are not interchangeable. An attorney cannot give tax advice; a CPA cannot give legal opinions on entity structure or liability exposure. The user needs both. Frame the professional consultation questions specifically for each professional -- don't give the attorney the CPA's questions and vice versa. The "Questions for Your Attorney and CPA" section must be specific to the user's business profile, not generic.

---

## Edge Cases

### The Sole Proprietor Working From Home With No Employees

This is the lightest compliance burden but compliance requirements are not zero. Key items unique to this scenario:

- **Home occupation permit:** Required by many cities and counties before operating any business from a residential address. Restrictions typically limit: customer visits to the home, visible business signage, delivery vehicles, and hours of operation. Penalties for non-compliance can include fines and a cease-and-desist from the city. Check the local zoning ordinance -- the rules differ from "residential zoning is permitted" to "home occupation is permitted as an accessory use" to "no commercial activity in residential zones."
- **Homeowners or renters insurance gap:** A standard homeowners or renters insurance policy typically excludes business equipment and business liability. A home-based business needs either a home-based business endorsement to their existing policy (usually $25-$75/year) or a separate business owner's policy.
- **Self-employment tax:** A sole proprietor pays both the employer and employee halves of Social Security and Medicare -- 15.3% on net self-employment income up to the wage base and 2.9% above it. This is frequently a surprise to first-time self-employed individuals who were accustomed to only seeing the employee's 7.65% share withheld from a paycheck.
- **Health insurance deduction:** Self-employed sole proprietors can deduct 100% of health insurance premiums paid for themselves and their family above the line on Form 1040, but only if they are not eligible for coverage through an employer (or spouse's employer). Flag this as a question for their CPA.

### The Business Expanding Into a New State

Multi-state expansion triggers a cascade of compliance obligations that many small businesses miss:

- **Foreign entity registration** in the new state -- required as soon as the business hires an employee, opens an office, stores inventory, or conducts regular business meetings in the new state. The threshold for "doing business" varies by state but generally includes any of the above activities.
- **Registered agent in the new state** -- must be a person or entity with a physical address in the state, available during business hours to accept legal documents.
- **State income tax nexus** -- physical presence in a state generally creates income tax filing obligations in that state. Apportion income between states using the state's apportionment formula (most states use single-sales factor or three-factor apportionment).
- **Sales tax economic nexus** -- if the business already has economic nexus in the new state from online sales, in-person sales there will not create a new obligation but the existing one must already be fulfilled.
- **State unemployment account** -- if hiring employees in the new state, register for a SUTA account with the new state's workforce commission or labor department. Payroll taxes must be reported and paid in each state where employees work.
- **New state's employment laws** -- minimum wage, paid sick leave requirements, paid family leave (California, New York, New Jersey, Washington, Oregon, Colorado, Connecticut, Massachusetts, and others have mandatory state paid leave programs with specific contribution structures), and anti-discrimination laws may be more stringent in the new state.

### The Regulated Industry Business (Cannabis, Alcohol, Firearms, Financial Services)

These industries have compliance requirements that cannot be handled with a general checklist alone -- flag them prominently and escalate appropriately:

- **Cannabis:** Remains a Schedule I controlled substance under federal law (Controlled Substances Act) despite state-level legalization in many states. This creates structural conflicts: no federal banking (federally insured banks generally cannot service cannabis businesses); no federal tax deductions (IRC Section 280E disallows deductions for businesses "trafficking" in Schedule I substances except for cost of goods sold); and exposure to federal prosecution even in states where cannabis is legal. State licensing requirements are complex and expensive: application fees of $5,000-$100,000+; background checks; premises inspections; and ongoing track-and-trace compliance. A cannabis-specialized attorney is essential.
- **Alcohol:** Federal TTB (Alcohol and Tobacco Tax and Trade Bureau) permit is required for manufacturers, importers, and wholesalers. State liquor license from the state liquor control board is required for manufacturers, distributors, and retailers. Local permits are also required in most jurisdictions. Three-tier distribution laws in most states prohibit vertical integration (manufacturer/distributor/retailer ownership) with limited exceptions.
- **Financial services (investment advisers, money transmission):** Investment advisers managing over $110 million AUM must register with the SEC; those below that threshold register with the state securities regulator. Money transmitters (fintech, payment services) must obtain a money transmitter license (MTL) in most states -- this is a highly burdensome, state-by-state process; 49 separate state MTL applications may be required for a national product.
- **Healthcare:** Beyond HIPAA, healthcare providers face state-specific licensing through medical boards, dental boards, pharmacy boards, etc. Facilities (clinics, hospitals, labs) require separate facility licenses. Medicare/Medicaid participation requires enrollment in the respective programs and compliance with conditions of participation.

### The Online-Only Business With No Physical Location

A common misconception is that an online-only business has lighter compliance obligations. In practice, several areas are MORE complex:

- **Multi-state sales tax:** The entire customer base is potentially distributed across 45+ taxing states. Economic nexus thresholds can be reached quickly in multiple states simultaneously. The Streamlined Sales and Use Tax Agreement (SSUTA) -- adopted by 24 states -- allows simplified registration and filing but does not cover all states. Marketplace facilitator laws: if the business sells through Amazon, Etsy, eBay, or similar platforms, those platforms are now required to collect and remit sales tax in most states on behalf of third-party sellers. This changes but does not eliminate the seller's obligations (they must still file returns, just with $0 in states where the marketplace collected).
- **State corporate income tax nexus:** Some states argue that even a pure online business with no physical presence has income tax nexus due to "economic presence" or the location of intangible property -- a contested but real compliance risk.
- **Privacy policy compliance:** Mandatory. CalOPPA requires any website accessible from California (practically all websites) to have a conspicuous privacy policy. GDPR applies if any EU residents access the site and their data is collected -- even a U.S. company is subject to GDPR if it targets EU residents. GDPR non-compliance carries penalties of up to 4% of global annual turnover or €20 million, whichever is greater.
- **Payment processing compliance:** All payment processing must go through a PCI DSS compliant path. Using a hosted payment page (Stripe Checkout, PayPal) rather than collecting card data directly reduces but does not eliminate PCI obligations.

### The Business With Independent Contractors Only (No W-2 Employees)

Using only independent contractors does not eliminate employment-related compliance obligations:

- **Worker classification risk:** The IRS, Department of Labor, and every state tax authority scrutinize independent contractor classifications. The IRS uses a behavioral/financial/relationship control test; California uses the ABC test (a much stricter standard that presumes employment unless the business can prove: (A) freedom from control, (B) work is outside the usual course of the business's work, AND (C) the worker is customarily engaged in an independently established trade). Misclassification penalties include back payroll taxes, interest, penalties of 20%-35% of wages, and potential criminal liability for willful violations.
- **1099-NEC filing:** Required for any contractor paid $600+ in a year. Due to the IRS by January 31. Many states have their own 1099 reporting requirements filed simultaneously.
- **Contractor agreements:** Written independent contractor agreements are not legally required but are highly recommended to document the nature of the relationship. They should specify: scope of work, payment terms, IP ownership (work for hire provisions), non-disclosure terms, and contractor's responsibility for their own taxes.
- **General liability and indemnification:** Contracts with clients often require the business to maintain certain insurance levels and indemnify clients from contractor-caused damage. Verify that general liability coverage extends to work performed by contractors on the business's behalf.

### The Business Undergoing Entity Conversion (e.g., Sole Proprietorship to LLC)

Entity conversion is not simply a paperwork change -- it triggers a series of compliance updates:

- **New EIN:** A new EIN is generally required when a sole proprietor forms an LLC with employees or when any entity type changes significantly. The old EIN must be closed.
- **Close and reopen tax accounts:** State income tax accounts, sales tax permits, and unemployment insurance accounts are typically tied to the EIN and legal entity name. Many must be closed under the old entity and reopened under the new one.
- **Contract and account updates:** All business bank accounts, vendor contracts, client contracts, insurance policies, and licenses that reference the old entity name or structure must be updated. Credit card processing accounts are particularly important to transfer to the new entity to maintain PCI compliance continuity.
- **S-corp election timing:** If the user is converting to an LLC and wants to elect S-corp tax treatment for the LLC, the election (IRS Form 2553) must be filed by the 15th day of the third month of the tax year (March 15 for a calendar-year entity). Late elections can be filed under IRS Revenue Procedure 2013-30 with reasonable cause, but proactive timing is far simpler.
- **Operating agreement update:** An LLC formed from a sole proprietorship needs an operating agreement even if it is single-member. This document governs management, capital contributions, distributions, and transfer restrictions.

---

## Example

**Input:**

"I'm starting an online tutoring business based out of Denver, Colorado. I'll operate as a single-member LLC. I'm the only person working right now -- no employees, just me. I'll tutor K-12 students over Zoom for math and science subjects. I plan to market nationally and take payments via credit card through my website. I'll also be collecting email addresses for a newsletter. My expected revenue is around $80,000 in year one. What compliance requirements do I need to know about?"

---

**Output:**

## Business Compliance Checklist
### Online Tutoring Business | Single-Member LLC | Denver, Colorado
**Generated for:** Single-member LLC providing online K-12 math and science tutoring nationally via Zoom; no employees; website with credit card payments and email list.
**Prepared:** January 2025
**Review date:** January 2026

---

> ⚠️ **Important:** This checklist is for general educational purposes only. It is not a legal opinion, and it cannot account for every local ordinance, industry-specific requirement, or recent regulatory change. Verify every item with the relevant agency and confirm your overall compliance posture with a licensed Colorado business attorney and a CPA or enrolled agent before relying on this checklist.

---

### Business Profile
| Detail | Information |
|--------|-------------|
| Business activity | Online K-12 tutoring (math and science) via video conference |
| Entity type | Single-member LLC |
| Formation state | Colorado |
| Operating location(s) | Denver, Colorado (home-based; students located nationally) |
| Number of employees | 1 (owner only; no W-2 employees) |
| Annual revenue (estimate) | ~$80,000 (Year 1) |
| Products / Services / Both | Services only |
| Online sales | Yes -- all services delivered online; national customer base |
| Customer data collected | Basic contact info (email for newsletter); payment card data via website; data of minors (K-12 students) |
| Regulated industry | Education (not licensed by a state board for K-12 tutoring, but note COPPA applies due to data from minors) |
| Home-based or commercial | Home-based (Denver, Colorado) |

---

### PHASE 1: Before Operating (Must Complete First)

| # | Compliance Item | Category | Est. Cost | Where to File / Verify | Priority |
