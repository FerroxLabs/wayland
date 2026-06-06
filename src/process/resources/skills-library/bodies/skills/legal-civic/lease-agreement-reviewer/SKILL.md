---
name: lease-agreement-reviewer
description: |
  Reviews residential lease agreements clause by clause, identifying standard terms, red flags, and missing tenant protections. Produces a checklist of lease provisions with concern levels and questions to discuss with an attorney or tenant rights organization before signing.
  Use when the user has a lease or rental agreement to review, wants to understand what they are agreeing to, or needs to know what protections to look for in a residential lease.
  Do NOT use for commercial lease review, lease drafting, legal advice on whether to sign, or landlord-side lease analysis.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "legal-literacy contracts tenant-rights checklist"
  category: "legal-civic"
  subcategory: "personal-legal"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "beginner"
---
# Lease Agreement Reviewer

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand lease agreements and tenant protections. It does NOT constitute legal advice, create an attorney-client relationship, or represent you in any legal matter. Landlord-tenant law varies significantly by state, county, and city, and changes over time. Always consult a qualified attorney licensed in your jurisdiction or a certified tenant rights organization before making decisions about signing or disputing a lease.

---

## When to Use

**Use this skill when:**
- A user has received a residential lease or rental agreement (apartment, house, condo, townhouse, room rental, mobile home pad) and wants to understand what they are agreeing to before signing
- A user wants a structured clause-by-clause analysis identifying which provisions are standard, which are unusual, and which are potentially harmful
- A user is preparing questions for a tenant rights organization, legal aid clinic, or housing attorney consultation and wants to arrive informed
- A user is comparing two competing lease offers and wants to understand the material differences between them side by side
- A user is renewing an existing lease and wants to understand what changed from their current agreement
- A user received a lease addendum, pet addendum, parking agreement, or community rules document attached to a primary lease and wants to understand if those documents add concerning obligations
- A user wants to understand what tenant protections standard leases in their region typically include, so they can identify gaps in the document they received

**Do NOT use when:**
- The user wants to review a commercial, retail, industrial, or office lease -- commercial leases operate under entirely different legal frameworks with far fewer consumer protections, require a different skill
- The user wants to draft, write, or redline a lease agreement -- generating lease language constitutes legal drafting and is outside this skill's scope
- The user wants a definitive legal opinion on whether to sign a specific lease or whether a specific clause is enforceable -- that is legal advice requiring a licensed attorney
- The user is dealing with an active tenancy dispute, eviction notice, habitability complaint, or security deposit dispute -- use `tenant-rights-guide` instead, as those require dispute-focused guidance rather than lease literacy
- The user is a landlord wanting to create, audit, or strengthen their own lease from the landlord's perspective -- this skill is explicitly tenant-side
- The user is reviewing a lease-to-own or rent-to-own agreement -- those instruments contain purchase option provisions that fall under real estate contract law and require dedicated analysis beyond residential tenancy
- The user wants to understand section 8 / housing choice voucher program rules, which layer federal HUD requirements onto the lease in ways that require specialized knowledge

---

## Process

### Step 1: Gather Jurisdiction and Lease Context

Before analyzing any lease language, collect the information that determines which legal standards apply. Tenant protections vary more by location than almost any other area of consumer law.

- **State matters most:** Every U.S. state has its own landlord-tenant statute (e.g., California Civil Code §§ 1940-1954.06, New York Real Property Law, Texas Property Code Chapter 92, Florida Statute Chapter 83). Ask for the state if not provided.
- **City and county often matter more than state:** San Francisco, New York City, Los Angeles, Seattle, Portland, Chicago, and Washington D.C. have local rent control, just-cause eviction, and notice ordinances that significantly exceed state minimums. Ask for the city.
- **Property type matters:** Condominiums may have HOA rules that bind tenants. Mobile home park leases involve pad rental statutes. Single-family home rentals in many states are partially exempt from certain landlord-tenant protections. Room rentals in the landlord's primary residence (owner-occupied) may have different rules regarding discrimination protections and privacy rights.
- **Lease type and term:** Month-to-month leases have different notice and termination rules than fixed-term leases. Ask: Is this a new lease, a renewal, or a lease for a room in a shared house?
- **Is the user a first-time renter?** If so, explain concepts like joint and several liability, holdover tenancy, and security deposit escrow in plain language as you go -- do not assume prior knowledge.
- **Gather specific concern areas:** Ask if there are any specific clauses the user is already worried about, so those can be prioritized in the analysis.

---

### Step 2: Build the Lease Inventory

Before evaluating individual clauses, systematically catalog what the lease contains and what it is missing. A complete residential lease should address at minimum 15-18 subject areas. The absence of a provision is itself important information.

Work through the following inventory categories in order:

**Identity and Parties**
- Confirm the landlord's legal name, not just a DBA or property management company name. The legal entity that owns the property (LLC, trust, individual) is who the tenant has legal recourse against. If only a property management company is named, flag this.
- Confirm all adult occupants who will be living in the unit are listed by name as tenants. Unnamed occupants can be at legal risk in eviction scenarios and may not have standing to assert tenant rights.
- Verify the exact property address including unit number. Ambiguous property descriptions are a red flag in leases.

**Financial Terms**
- Rent amount and due date
- Grace period in days (if any -- note that grace periods are legally required in some states, e.g., Georgia requires a 5-day grace period; most do not mandate one)
- Late fee amount and trigger date -- in many states, late fees are capped: California caps late fees at a "reasonable" amount (courts have interpreted this as 5-10% of monthly rent); Texas caps fees at 12% of monthly rent for properties with fewer than 4 units and 10% for larger properties
- NSF / returned check fees
- Whether additional recurring fees (trash, amenity, parking, pest control, community fees) are bundled or listed separately -- these can meaningfully increase the effective monthly cost
- Security deposit amount, noting applicable state caps:
  - California: 2 months' rent (unfurnished), 3 months (furnished)
  - New York: 1 month's rent (for leases after June 2019 under HSTPA)
  - Texas: No statutory cap, but courts disfavor amounts over 2 months
  - Florida: No statutory cap
  - Massachusetts: 1 month's rent
  - Illinois: No statewide cap, but some municipalities have limits
- Pet deposit vs. non-refundable pet fee (legally distinct in most jurisdictions)
- Move-in fees distinct from security deposit (some states limit these)

**Lease Duration and Renewal**
- Fixed end date vs. month-to-month
- Automatic renewal clause: Does the lease automatically renew for another 12 months if the tenant does not provide advance notice? If so, how many days of notice are required to prevent auto-renewal? (60-90 days is common; some leases require as much as 120 days -- this is a serious trap)
- Holdover provisions: What happens if the tenant stays past the end date without signing a new lease? (Most leases convert to month-to-month; some impose penalty rent at 150-200% of the monthly rate during holdover)

**Entry and Privacy**
- Required notice period before landlord entry. State minimums:
  - California, Florida, New York: 24 hours
  - Texas: "Reasonable" notice (no defined statutory minimum, but case law suggests 24 hours)
  - Illinois: No statewide statute, but many municipalities require 24-48 hours
  - Nevada: 24 hours
- Whether the lease restricts entry to reasonable hours (typically 8am-8pm)
- Emergency entry exceptions -- confirm emergencies are actually limited to genuine emergencies (fire, flooding, gas leak) and not defined broadly to include routine maintenance
- Smart lock, lockbox, or key fob retention by the landlord or property management company -- this enables de facto unannounced entry and should be flagged

**Maintenance and Repairs**
- Landlord's affirmative duty to maintain habitable conditions -- the implied warranty of habitability exists in all U.S. states and cannot be waived by contract, so any clause purporting to waive it is unenforceable (note jurisdiction caveat)
- Tenant's repair obligations: Standard leases hold tenants responsible for damage beyond normal wear and tear. Flag any clause making tenants responsible for HVAC systems, structural repairs, roof, plumbing, or electrical systems -- these are landlord obligations in all U.S. jurisdictions
- Repair-and-deduct rights: Many states allow tenants to pay for essential repairs and deduct from rent under defined circumstances. The lease may or may not address this; absence means state law default applies
- Repair request procedure and required response timeline (many states set 14-30 days for non-emergency repairs; 24-72 hours for habitability emergencies)
- Who handles pest control -- many states (including California) place pest control obligations on landlords; leases shifting this to tenants should be flagged

**Termination and Move-Out**
- Tenant's required notice to vacate (typically 30-60 days for fixed-term leases; for month-to-month, often equal to the rent period)
- Early termination clause: Permitted basis, notice required, and penalty or fee
  - Legitimate early termination rights in many states include active military deployment (federal Servicemembers Civil Relief Act -- SCRA -- preempts state law), domestic violence situations, and uninhabitable conditions
  - Fees expressed as "$200 per remaining month" can be extremely expensive -- calculate the worst-case total and present it
  - Some states (e.g., California) require landlords to mitigate damages by attempting to re-rent the unit; if the unit re-rents quickly, the tenant's liability may be reduced regardless of what the lease says
- For-cause termination triggers: Review the list of tenant violations that can result in lease termination. Overly broad lists (e.g., "any lease violation" or "landlord's sole discretion") are red flags
- Move-out inspection rights: Many states grant tenants the right to attend a pre-move-out inspection and receive a written list of intended deductions -- California Civil Code § 1950.5 is the strongest model; not all states have this

**Prohibited or Restricted Activities**
- Pet policy: Distinguish between no-pets (absolute restriction), pets-with-permission, and breed/weight restrictions. Note that service animals and emotional support animals are NOT pets under federal law (Fair Housing Act / ADA) and pet deposits or pet fees generally cannot be charged for them -- any lease clause attempting to charge for a service/support animal is potentially unlawful
- Guest policy: Some leases limit overnight guests to a certain number of consecutive nights (7-14 days is common). Overly restrictive guest policies can implicate Fair Housing concerns in some contexts
- Subletting and assignment: Most leases prohibit subletting without landlord consent. Some jurisdictions limit how landlords can withhold consent
- Alteration restrictions: Distinguish between cosmetic changes (painting, mounting TVs) and structural changes. Many states protect tenants' right to make minor modifications for accessibility under Fair Housing Act
- Business operation prohibitions: These are usually standard but can conflict with work-from-home arrangements -- clarify whether running a home-based business that generates no client traffic or external business activity is prohibited

**Dispute Resolution**
- Mandatory binding arbitration clauses: Flag these. They waive the right to court proceedings and class actions, and while generally enforceable in residential leases, they can disadvantage tenants who have fewer resources than institutional landlords
- Attorney's fees provisions: A one-sided attorney's fees clause (landlord recovers fees if they prevail, tenant does not) is a red flag. Many states have "prevailing party" statutes that make attorney's fees reciprocal by operation of law regardless of what the lease says
- Jury trial waiver: Flag prominently. Courts in some jurisdictions have enforced these in residential leases; others have not. A tenant should understand what they may be waiving
- Venue selection clauses specifying an inconvenient county for dispute resolution

---

### Step 3: Apply Red Flag Scoring

After cataloging provisions, apply a severity rating to each concern. Use this framework:

**High Concern (advise user to discuss specifically with an attorney or tenant organization before signing):**
- Entry notice below 24 hours
- Landlord retains right to change lease terms unilaterally during the lease term
- Tenant waives right to habitable conditions
- Tenant is made solely responsible for structural repairs (roof, foundation, plumbing systems, HVAC systems)
- Security deposit exceeds state statutory cap
- Automatic renewal requiring more than 60 days advance notice to cancel
- Penalty rent at more than 150% during holdover
- Waiver of jury trial combined with mandatory arbitration and no cost-sharing for arbitration fees
- Any clause the user flags as confusing that, upon analysis, appears to significantly restrict tenant rights

**Medium Concern (note as unfavorable or uncommon; recommend clarification before signing):**
- No grace period for rent where state law does not require one
- Late fees above 5-10% of monthly rent
- Lease is silent on security deposit return timeline (state law default will apply -- verify it)
- Guest restrictions under 7 consecutive nights
- Unilateral pet fee changes permitted
- No emergency repair contact information
- Early termination fee greater than 2 months' rent
- Landlord retains a spare key or lockbox access without defined access restrictions

**Low Concern (note for awareness; standard in many markets):**
- No smoking (virtually universal and reasonable)
- Tenant responsible for renter's insurance
- Parking fees charged separately
- Written notice required for repair requests
- No alterations without written permission

---

### Step 4: Identify Missing Protections and Apply State Default Rules

When the lease is silent on a topic, the applicable state landlord-tenant statute governs. Silence is not always bad (some defaults strongly protect tenants), but tenants should know what defaults apply. Flag silence on:

- Security deposit return timeline: State defaults range from 14 days (California, Massachusetts) to 60 days (Texas). If the lease is silent, the statutory default applies -- tell the user what it is for their state if known
- Move-in condition report: California, Massachusetts, Virginia, and several other states require landlords to provide a condition checklist. Even where not required, recommend the tenant create their own
- Interest on security deposit: Massachusetts, New Jersey, and a handful of other states require deposits to earn interest. New York requires interest on deposits held by landlords with 6+ units
- Habitability standards: Implied warranty of habitability cannot be disclaimed -- any clause attempting to do so is void
- Retaliation protections: All 50 states have some form of anti-retaliation statute protecting tenants who assert their legal rights. A lease cannot waive these
- Lockout prohibition: Landlords cannot unilaterally lock tenants out, remove doors, or shut off utilities as a self-help eviction remedy -- this is prohibited in all U.S. jurisdictions, and any lease clause purporting to permit it is void

---

### Step 5: Calculate Total Financial Exposure

Present the user with a clear financial picture. Tenants frequently underestimate total move-in costs and total risk exposure.

**Move-In Cost Calculation:**
- First month's rent: $X
- Last month's rent (if required): $X
- Security deposit: $X
- Pet deposit (refundable): $X
- Non-refundable move-in or administrative fee: $X
- Pet fee (non-refundable): $X
- Parking deposit: $X
- **Total due at move-in: $X**

**Maximum Early Termination Exposure:**
- If the lease charges $Y per remaining month and the tenant leaves after Month 1 of a 12-month lease: 11 months × $Y = $Z
- If the lease charges a flat early termination fee: $Z
- Note: In states requiring landlord mitigation, actual liability may be lower

**Worst-Case Security Deposit Non-Return:**
- If the full deposit is withheld in bad faith and the user must pursue legal action, note that many states provide for double or triple damages plus attorney's fees for wrongful withholding (California: 2x; Massachusetts: up to 3x; New York: up to 2x under HSTPA)

---

### Step 6: Generate Jurisdiction-Informed Questions

After analysis, generate specific questions tailored to the lease's actual provisions and the user's stated jurisdiction. These questions are for the user to take to a tenant rights organization or attorney -- not generic questions but targeted ones based on what the lease actually says.

Structure questions in three categories:
1. **Verify before signing** -- questions that should be answered before the user commits
2. **Negotiate if possible** -- provisions the user might ask to change (entry notice, late fee, early termination)
3. **Know your rights regardless** -- statutory rights that exist whether or not the lease mentions them

---

### Step 7: Deliver the Move-In Protection Protocol

Regardless of lease quality, provide a concrete move-in action checklist. This protects the tenant from the most common sources of security deposit disputes:

- Document every pre-existing condition in every room with dated photographs (time-stamp enabled on phone, or use a service like Google Photos that automatically geotags)
- Complete a written move-in condition report and send a copy to the landlord via email or certified mail within the first 3-5 days of occupancy -- keep a copy with the timestamp
- Note the condition of carpets, walls, doors, windows, appliances, light fixtures, and plumbing fixtures
- Test all smoke detectors, CO detectors, and note whether they function on the move-in report
- Photograph the exterior of the unit, parking area, and common areas that the tenant is responsible for
- Request written confirmation of the security deposit amount, the institution where it is held, and the account number (some states require this disclosure automatically)
- Set up renter's insurance before the move-in date (not just if required by the lease -- it is always prudent)

---

### Step 8: Compile and Present the Analysis

Present findings in the structured output format below. Lead with the most urgent concerns so the user immediately understands what requires attention. Always close with the jurisdiction note and the specific recommendation to consult a local tenant rights resource.

---

## Output Format

```
## Lease Review: [Property Address]

> **Important:** This is an educational review to help you understand your lease.
> It does not constitute legal advice. Laws vary by jurisdiction. Consult a 
> licensed attorney or tenant rights organization before signing.

---

### Lease Snapshot

| Term | Detail | Notes |
|------|--------|-------|
| Property address | [Full address + unit] | Verify unit number is in the lease |
| Landlord / owner | [Name] | Confirm this is the legal property owner |
| Property manager | [Name if different] | Note who you contact for issues |
| Lease type | [Fixed-term 12-month / Month-to-month] | |
| Lease start date | [Date] | |
| Lease end date | [Date] | [X] months from start |
| Monthly rent | $[Amount] | |
| Grace period | [X] days / None stated | Verify local law default |
| Late fee | $[Amount] after [Day] | [X]% of rent -- flag if above 10% |
| Security deposit | $[Amount] = [X] months' rent | Check state cap |
| Pet deposit / fee | $[Amount] ([Refundable / Non-refundable]) | |
| Total move-in cost | $[Calculated total] | |
| Max early termination exposure | $[Calculated total] | Worst-case scenario |

---

### Clause-by-Clause Review

| Provision | What the Lease Says | Standard? | Concern Level | Notes |
|-----------|---------------------|-----------|---------------|-------|
| Landlord's legal name | [Detail] | Yes / No | None / Low / Medium / High | |
| All tenants named | [Detail] | Yes / No | | |
| Exact property address | [Detail] | Yes / No | | |
| Rent amount | $[Amount] | Yes | None | |
| Grace period | [X days / None] | Varies | [Level] | |
| Late fee | $[Amount] at Day [X] | [Typical / High] | [Level] | |
| Security deposit | $[Amount] | [Within limits / Exceeds limits] | [Level] | |
| Deposit return timeline | [X days / Not stated] | [Typical / Missing] | [Level] | |
| Deposit interest | [Yes / No / Not stated] | Varies by state | [Level] | |
| Deposit escrow | [Yes / No / Not stated] | Required in [states] | [Level] | |
| Landlord entry notice | [X hours / days] | 24 hrs typical | [Level] | |
| Entry hours restriction | [Stated / Not stated] | Common | [Level] | |
| Emergency entry definition | [Broad / Narrow / Not stated] | Narrow preferred | [Level] | |
| Maintenance obligations | [Tenant / Landlord / Split] | Landlord for structural | [Level] | |
| Repair request process | [Written / Oral / Not stated] | Written preferred | [Level] | |
| HVAC responsibility | [Tenant / Landlord] | Landlord | [Level] | |
| Pest control responsibility | [Tenant / Landlord] | Landlord in most states | [Level] | |
| Utilities included | [List] | Varies | None | |
| Tenant utility responsibility | [List] | Varies | None | |
| Lease auto-renewal | [Yes / No] | Common | [Level] | |
| Notice to prevent renewal | [X days] | 30-60 days typical | [Level] | |
| Holdover provision | [MTM / Penalty rate] | MTM standard | [Level] | |
| Early termination clause | [Fee structure] | Varies | [Level] | |
| SCRA military clause | [Present / Absent] | Standard | [Level] | |
| Domestic violence clause | [Present / Absent] | Required in [states] | [Level] | |
| Pet policy | [No pets / With permission / Restrictions] | Varies | [Level] | |
| Guest restrictions | [X nights] | 7-14 nights typical | [Level] | |
| Subletting policy | [Prohibited / With consent] | With consent typical | [Level] | |
| Alteration restrictions | [Detail] | Standard | [Level] | |
| Smoking policy | [Prohibited / Designated areas] | Standard | None | |
| Renter's insurance | [Required / Recommended / Not stated] | Common requirement | None | |
| Mandatory arbitration | [Yes / No] | Varies | [Level] | |
| Jury trial waiver | [Yes / No] | Flag if present | [Level] | |
| Attorney's fees | [One-sided / Prevailing party / None] | Prevailing party preferred | [Level] | |
| Move-in condition report | [Provided / Not stated] | Common | [Level] | |
| Unilateral rule changes | [Permitted / Not stated] | Should be prohibited | [Level] | |

---

### Red Flags (High and Medium Concern Items)

| Priority | Provision | What the Lease Says | Why It's Concerning | What Is Typical |
|----------|-----------|---------------------|--------------------|-----------------| 
| HIGH | [Provision] | [Exact or paraphrased language] | [Clear explanation of the risk] | [What standard leases say] |
| MEDIUM | [Provision] | [Language] | [Explanation] | [Standard] |

---

### Missing Protections

| Missing Item | Why It Matters | State Law Default (if known) | Recommended Action |
|-------------|---------------|-----------------------------|--------------------|
| Move-in condition report | Basis for deposit dispute resolution | Required in CA, MA, VA; tenant should create own regardless | Request form from landlord or create your own on Day 1 |
| Security deposit return timeline | Tenants need to know when to expect funds | [State] requires return within [X] days | Confirm statutory deadline |
| Emergency repair contact | Tenants need 24/7 reach in urgent situations | No default; should be in lease | Request before signing |
| [Other missing item] | [Why it matters] | [Default] | [Action] |

---

### Financial Exposure Summary

**Move-In Costs**
| Item | Amount |
|------|--------|
| First month's rent | $[X] |
| Last month's rent | $[X] / Not required |
| Security deposit | $[X] |
| Pet deposit (refundable) | $[X] |
| Non-refundable fees | $[X] |
| Parking deposit | $[X] |
| **Total due at move-in** | **$[X]** |

**Early Termination Worst Case**
| Scenario | Estimated Cost |
|----------|---------------|
| Leave after Month 1 (11 months remaining) | $[Calculated] |
| Leave after Month 6 (6 months remaining) | $[Calculated] |
| Flat fee (if applicable) | $[Amount] |
| Note: [State] requires landlord to mitigate / does not require mitigation | |

---

### Questions to Address Before Signing

**Verify Before Signing (Get Answers -- Do Not Sign Without These)**
1. [Specific question about High concern item]
2. [Question about security deposit limit compliance]
3. [Question about missing emergency contact provision]

**Consider Negotiating**
1. Can the entry notice be changed from [X hours] to 24 hours minimum?
2. Is the early termination fee negotiable given [circumstance]?
3. Will the landlord provide a written move-in condition form?

**Know Your Rights Regardless of What the Lease Says**
1. In [state], you have the right to [habitability / repair-and-deduct / retaliation protection] -- the lease cannot waive this
2. Service animals and emotional support animals cannot be subject to pet fees under the Fair Housing Act
3. [State-specific right based on jurisdiction provided]

---

### Move-In Protection Checklist

- [ ] Photograph every room, surface, appliance, and fixture with time-stamped photos before moving in
- [ ] Complete a written move-in condition report and email it to the landlord on Day 1
- [ ] Keep the landlord's email confirmation of receipt
- [ ] Confirm in writing the security deposit amount, the bank or institution holding it, and the account number (if required in your state)
- [ ] Set up all utilities you are responsible for before move-in to avoid a gap in service that could be attributed to you
- [ ] Obtain renter's insurance effective on your move-in date
- [ ] Test all smoke detectors and CO detectors on move-in day and document their working condition
- [ ] Request copies of all referenced but unattached documents (house rules, parking policy, community guidelines)

---

### Jurisdiction Note

This review applies general landlord-tenant principles common across U.S. jurisdictions. **[State/City provided by user]** may have specific rules that are more protective or more permissive than the general standards described here. Key areas to verify locally include:

- Security deposit cap: [Known state rule or "Verify with local tenant rights organization"]
- Entry notice requirement: [Known state rule or "Verify"]
- Deposit return timeline: [Known state rule or "Verify"]
- Rent control / rent stabilization: [Applicable or "Verify whether your city has local ordinances"]
- Just-cause eviction requirements: [Applicable in some cities or "Verify local ordinance"]

**Recommended local resources:**
- Your state's official tenant rights guide (search "[State] tenant rights landlord handbook")
- Local legal aid society (search "[City] legal aid housing")
- HUD-approved housing counseling agencies (search "HUD housing counselor [City]")
```

---

## Rules

1. **Never advise the user to sign or refuse to sign.** Present analysis, flag concerns, explain implications, and recommend consultation with a tenant rights organization or licensed attorney. The decision to sign belongs to the user. Phrases like "you should not sign this" or "this lease is fine" are outside this skill's scope.

2. **Never state definitively that a clause is unenforceable** without a clear jurisdiction caveat. A mandatory arbitration clause may be enforceable or unenforceable depending on state law and specific circumstances. Always say "may be unenforceable under [jurisdiction] law -- verify with an attorney" rather than "this clause is void."

3. **Treat lease silence as information, not safety.** When a lease does not address a topic, explicitly tell the user what the state law default is for their jurisdiction (or recommend they verify it). Silence in a lease is not the same as the absence of an obligation -- it means state law governs.

4. **Always calculate total financial exposure in real dollar amounts.** Do not just describe an early termination fee as "$200 per remaining month" -- calculate the worst-case total at Month 1, Month 3, and Month 6, and present those numbers explicitly. Users systematically underestimate cumulative cost.

5. **Distinguish between unfavorable and potentially unlawful.** A lease requiring tenants to pay for routine appliance maintenance is unfavorable but may be enforceable. A lease requiring the tenant to waive the implied warranty of habitability is potentially void as against public policy. Communicate that distinction clearly.

6. **Never attempt to modify, redline, or draft alternative lease language.** Even suggesting "the clause should say X instead of Y" approaches legal drafting. Direct the user to an attorney for any proposed modifications.

7. **Always flag service animal and emotional support animal provisions.** Many leases contain pet policies that would, if applied to service animals or emotional support animals, violate the Fair Housing Act and the Americans with Disabilities Act. Note this proactively in every review that contains a pet restriction clause.

8. **Maintain the tenant-side analytical frame throughout.** This skill is explicitly for the renter's benefit. Do not present both sides of a landlord-tenant trade-off as equivalent. When a clause is unfavorable to the tenant, say so plainly.

9. **When a lease references external documents (house rules, community policies, addenda) that the user has not provided, flag each reference explicitly.** Incorporated documents are legally binding even if the tenant has never read them. A common landlord tactic is to incorporate a lengthy "community rules" document that is only made available after signing. Recommend the user obtain and review all incorporated documents before signing.

10. **Apply jurisdiction-specific knowledge only when confident it is accurate; otherwise use the "verify locally" protocol.** Stating an incorrect security deposit cap for a specific state is worse than acknowledging uncertainty. When citing specific state statutes or numbers, be accurate and cite the relevant statute or code section by name. When uncertain, say "many states limit security deposits to 1-2 months' rent -- verify the specific limit in [state] with a local tenant rights organization" rather than guessing.

---

## Edge Cases

**The lease is unusually short or appears informal (1-2 pages)**
A bare-bones lease is not inherently safer than a detailed one. Brevity typically means many critical issues (habitability, deposit return process, notice periods, maintenance obligations) are left to state law defaults. This can actually benefit tenants in states with strong tenant protection statutes, or significantly harm them in states with minimal statutory protections. When a lease is very short, explicitly work through the full checklist of 15+ subject areas and note for each one that the lease is silent, then advise the user to verify their state's default rules. Flag that courts will look to state law to fill gaps, and the user should understand what those defaults are before signing.

**The user is one of multiple co-tenants all signing the same lease (joint tenancy)**
Explain joint and several liability in plain, concrete terms: if four roommates each owe $750 of a $3,000/month lease and one roommate stops paying, the landlord can pursue any or all of the remaining tenants for the full $3,000 -- not just the non-paying tenant's share. The tenant who pays for everyone can then pursue the non-paying roommate separately, but that is a separate civil dispute. Strongly recommend the co-tenants execute a separate written roommate agreement (not a document the landlord is party to) that specifies how rent is divided, which rooms are assigned to which tenant, how common utilities are split, procedures for one tenant wanting to leave, and what happens to the deposit contribution of a departing roommate. The landlord's lease will not protect roommates from each other.

**The user is being asked to sign a lease on a unit they cannot physically inspect before signing (fully remote relocation)**
Flag this prominently. A tenant who signs a lease without inspecting the unit has very limited recourse if the unit differs from photos or verbal descriptions -- unless the landlord's misrepresentation rises to fraud. Recommend a FaceTime or video walkthrough conducted by a trusted local contact. Emphasize that the move-in condition documentation process becomes even more critical in this scenario. Note that some states (e.g., California under AB 2565) have established some remote/out-of-state tenant protections, but these are limited.

**The lease contains a provision the user has been told is "standard in this market" by the landlord or agent**
Do not defer to the landlord's characterization. Analyze the provision on its own terms. "Standard" is often used to normalize unfavorable provisions. The correct framework is: (1) Is this provision legal under applicable state law? (2) Is this provision common in this market (genuinely)? (3) Is this provision favorable to the tenant compared to legal defaults? Present that analysis rather than simply accepting or rejecting the characterization.

**The lease is for a unit in a building with known rent control or rent stabilization (e.g., New York City, San Francisco, Los Angeles RSO units)**
Rent stabilization and rent control add a layer of tenant protections that significantly exceed what the lease itself provides. The lease may not mention stabilization status at all, but a unit's status is a matter of local law. Key questions: Is the unit stabilized? If so, what is the legal rent? Rent overcharges, preferential rents, and lease succession rights are all stabilization-specific issues that the lease may not reflect accurately. Strongly recommend the user contact the relevant local rent board (NYC Rent Guidelines Board, San Francisco Rent Board, LA Housing Department) to verify the unit's stabilization status and legal rent before signing.

**The lease requires the tenant to carry a specific renter's insurance amount (e.g., $100,000 liability) and names the landlord as an "additional insured"**
This provision is increasingly common and is generally enforceable. Explain the distinction: the tenant names the landlord as additional insured for liability purposes (so if a tenant-caused incident injures a third party, the landlord has some coverage), which is different from giving the landlord rights over the tenant's personal property coverage. Note that the liability coverage requirement is typically easy and inexpensive to meet -- standard renter's insurance policies include $100,000-$300,000 in liability coverage. However, flag if the lease requires the landlord to be named as additional insured on personal property coverage, which could create complications in a property loss claim.

**The lease contains a move-out cleaning fee that is charged regardless of the unit's condition**
Non-refundable cleaning fees are specifically prohibited in California (Civil Code § 1950.5), and courts in several other states have scrutinized them as improper attempts to circumvent security deposit laws. Flag any non-refundable cleaning fee, last-month cleaning charge, or mandatory professional cleaning requirement as requiring local legal verification. Distinguish between a cleaning deposit (refundable if unit is left clean) and a mandatory cleaning fee (charged regardless) -- the latter is more likely to be problematic under state law.

**The user suspects the landlord made verbal promises not reflected in the lease (verbal representations)**
Note the parol evidence rule: in most jurisdictions, courts will not allow parties to introduce evidence of prior verbal agreements to contradict a fully integrated written lease. The merger/integration clause (often appearing near the end of leases as "This Agreement constitutes the entire agreement between the parties...") explicitly prevents this. Any verbal promise the landlord made that does not appear in the written lease is effectively unenforceable. If a verbal promise is important to the user, recommend they request it be added to the lease as a written addendum before signing. This is a common and significant source of post-signing disputes.

---

## Example

**User Input:**
"I'm about to sign a 12-month lease for an apartment in Austin, Texas. Rent is $1,850/month, security deposit is $3,700 (two months' rent), and there's a $250 non-refundable administrative fee and a $65/month pet rent for my cat plus a $500 refundable pet deposit. The lease says the landlord can enter with 'reasonable notice, not less than 12 hours.' There's a clause saying I waive my right to a jury trial and all disputes go to binding arbitration, with each party paying their own arbitration costs. Early termination fee is $1,500 flat fee plus forfeiture of the security deposit. There's also a clause that says 'Tenant is responsible for maintaining all appliances including HVAC systems in good working order.' The lease auto-renews for 12 months unless I give 60 days notice. I haven't been provided the house rules document it references."

---

## Lease Review: [Austin, Texas Apartment]

> **Important:** This is an educational review to help you understand your lease. It does not constitute legal advice. Texas landlord-tenant law governs this lease, and some provisions may be more or less favorable than you realize under Texas Property Code Chapter 92. Consult a licensed Texas attorney or a local tenant rights organization before signing.

---

### Lease Snapshot

| Term | Detail | Notes |
|------|--------|-------|
| Property address | [Austin, TX -- unit address not specified] | Confirm exact unit number appears in lease |
| Lease type | Fixed-term, 12 months | Converts to 12-month auto-renewal |
| Monthly rent | $1,850 | |
| Grace period | Not stated | Texas does not require a grace period by statute; verify lease |
| Late fee | Not stated | Texas caps late fees at 12% (buildings <4 units) or 10% (4+ units) of monthly rent |
| Security deposit | $3,700 (2x monthly rent) | Texas has no statutory cap; 2 months is common |
| Pet deposit | $500 (refundable) | |
| Pet rent | $65/month | Recurring; $780/year |
| Non-refundable admin fee | $250 | Not a security deposit; confirm in writing |
| Total move-in cost | $6,300 | First month + deposit + pet deposit + admin fee |
| Max early termination exposure | $5,200 | Flat fee $1,500 + $3,700 deposit forfeiture |

---

### Clause-by-Clause Review

| Provision | What the Lease Says | Standard? | Concern Level | Notes |
|-----------|---------------------|-----------|---------------|-------|
| Landlord entry notice | "Reasonable notice, not less than 12 hours" | Below typical | **HIGH** | Texas Property Code has no stated minimum, but 24 hours is the widely applied professional standard |
| HVAC maintenance | Tenant responsible for HVAC "good working order" | Non-standard | **HIGH** | HVAC is a habitability system; landlord obligation under Texas Property Code § 92.153 |
| Jury trial waiver + mandatory arbitration | Both present, each party bears own costs | Varies | **HIGH** | Eliminates tenant's court options; arbitration costs can be prohibitive |
| Auto-renewal | 12-month auto-renewal, 60 days notice to cancel | Notice period above typical | **MEDIUM** | 60 days requires a reminder calendar entry; missing it locks you in for another year |
| Early termination | $1,500 flat fee + security deposit forfeiture | Punitive | **HIGH** | Total exposure: $5,200. Texas requires landlord to attempt mitigation; consult attorney |
| Security deposit | $3,700 (2 months) | Permissible | None | No Texas statutory cap; amount is within market norms |
| Pet deposit | $500 refundable | Standard | None | Confirm "refundable" is explicit in lease text |
| Pet rent | $65/month | Common | Low | Recurring cost; $780/year effective rent increase |
| Non-refundable admin fee | $250 | Common in Austin market | Low | Confirm this is explicitly labeled non-refundable and separate from security deposit |
| Deposit return timeline | Not stated | Missing | Medium | Texas Property Code § 92.103 requires return within 30 days; this is the statutory default |
| House rules document | Referenced but not provided | Red flag | **HIGH** | Incorporated documents are binding; you have not seen what you are agreeing to |
| Service animal policy | Not analyzed -- need pet clause language | Check | **Check** | Verify pet clause does not apply to service/support animals |

---

### Red Flags

| Priority | Provision | What the Lease Says | Why It's Concerning | What Is Typical |
|----------|-----------|---------------------|---------------------|-----------------|
| HIGH | HVAC maintenance | Tenant responsible for HVAC "in good working order" | HVAC is a core habitability system. Under Texas Property Code § 92.153, landlords must repair conditions materially affecting health/safety -- including heating and cooling in Texas heat. This clause attempts to shift that cost to the tenant and may conflict with Texas law | Landlord maintains all HVAC systems; tenant reports failures promptly |
| HIGH | Entry notice | 12 hours | Texas Property Code does not set a specific minimum notice period, but 12 hours is below the 24-hour standard applied by most Texas courts and professional property managers. Could result in disruptive or intrusive entries | 24 hours written notice is the widely used professional standard in Texas |
| HIGH | Jury trial waiver + mandatory arbitration + own-costs | Both waivers present; each party pays arbitration costs | Arbitration filing fees can reach $1,500-$3,000 for small claims that would cost $75 in county court. The combination of both waivers with own-costs makes it economically difficult for tenants to pursue legitimate claims | Prevailing party arbitration cost sharing, or no arbitration clause in tenant-friendly leases |
| HIGH | Early termination: deposit forfeiture | Flat $1,500 + full $3,700 deposit forfeit | Total exit cost of $5,200 if you leave any time during the lease. Texas courts have held that landlords must attempt to mitigate damages by re-renting -- the actual enforceable amount may be lower, but the lease is written to extract maximum penalty | Flat fee equivalent to 1-2 months' rent with no additional deposit forfeiture; or formula-based fee declining over time |
| HIGH | House rules not provided | Incorporated by reference into lease | You are being asked to agree to terms you have not read. The house rules document could contain significant restrictions on guests, noise, parking, storage, alterations, or pet policies that contradict verbal representations | All incorporated documents provided to tenant before signing |
| MEDIUM | Auto-renewal notice period | 60 days | 60 days requires you to decide in Month 10 whether you will renew -- before you likely know your situation. Missing the deadline locks you into another 12 months at potentially higher rent | 30 days is more tenant-friendly; 60 days is enforceable in Texas but should be calendared immediately upon signing |

---

### Missing Protections

| Missing Item | Why It Matters | Texas Law Default | Recommended Action |
|-------------|----------------|-------------------|--------------------|
| Deposit return timeline | Tenants need to know when to expect funds back | Texas Property Code § 92.103: 30 days from move-out (extended to avoid fraudulent itemizations) | Confirm the 30-day default applies; Texas also requires itemized written explanation for deductions |
| Emergency repair contact | Needed for HVAC failure, flooding, gas leaks | No statutory default for contact information | Request before signing |
| Move-in condition report form | Primary defense against wrongful deposit deductions | Texas does not require a specific form, but tenants have the right to document condition | Create your own written report with photos on Day 1; email to landlord |
| Landlord's duty to repair timeline | You need to know how quickly to expect repairs | Texas Property Code § 92.056: reasonable time, generally interpreted as 7-14 days for non-emergency; sooner for habitability emergencies | Request explicit repair response timeline be added as addendum |
| Grace period | Protects against late fees during minor payment delays | Not required under Texas law | Negotiate for a 3-5 day grace period if possible |

---

### Financial Exposure Summary

**Move-In Costs**
| Item | Amount |
|------|--------|
| First month's rent | $1,850 |
| Security deposit | $3,700 |
| Pet deposit (refundable) | $500 |
| Non-refundable admin fee | $250 |
| **Total due at move-in** | **$6,300** |

**Annual Pet Cost**
| Item | Amount |
|------|--------|
| Pet rent ($65 × 12) | $780 |
| Effective annual rent | $23,040 |

**Early Termination Worst Case**
| Scenario | Cost Under Lease As Written | Note |
|----------|----------------------------|------|
| Leave at any point during 12 months | $1,500 flat fee + $3,700 deposit | = $5,200 total |
| If landlord re-rents in 1 month (mitigation) | Potentially reduced | Texas courts may reduce; consult attorney |
| If landlord does not mitigate | Full $5,200 likely enforceable | |

---

### Questions to Address Before Signing

**Verify Before Signing**
1. Will the landlord provide the complete house rules document before you sign? You cannot agree to terms you have not read -- this is a non-negotiable ask.
2. Is the HVAC maintenance clause intended to mean you are responsible for filter changes and basic upkeep only, or does it include system repairs and replacements? Request written clarification or a lease addendum limiting your HVAC obligation to filter replacement.
3. Can you confirm in writing that the $500 pet deposit is refundable and distinct from the non-refundable admin fee?

**Consider Negotiating**
1. Can the entry notice be amended to 24 hours minimum to match professional management standards?
2. Is the early termination fee negotiable? $5,200 total exposure is substantially higher than a standard 1-2 month penalty. Would the landlord accept removing the deposit forfeiture component and keeping the flat fee?
3. Would the landlord agree to add a 3-5 day rent grace period?
4. Can the arbitration provision be modified so that arbitration costs are split based on who prevails, rather than each party bearing their own costs?

**Know Your Rights Regardless**
1. Under Texas Property Code § 92.153, your landlord is required to repair conditions materially affecting health and safety -- including heating and air conditioning in Texas summers. The lease clause making you responsible for HVAC likely conflicts with this statute for major repairs (not routine maintenance). Consult a Texas tenant rights attorney about enforceability.
2. Your security deposit must be returned within 30 days of move-out under Texas Property Code § 92.103, with a written itemization of any deductions. If the landlord wrongfully retains the deposit, you may be entitled to three times the deposit amount plus $100 and attorney's fees under § 92.109.
3. Your cat may qualify your apartment under Fair Housing Act considerations if you or a household member has a disability requiring the animal as an emotional support animal. In that case, pet rent and deposits generally cannot be charged. This applies independently of any lease language.
4. Texas Property Code § 92.331 prohibits landlords from retaliating against tenants for requesting repairs, filing complaints with code enforcement, or exercising other legal rights. The lease cannot waive this protection.

---

### Move-In Protection Checklist

- [ ] Obtain and read the complete house rules document before signing -- do not sign without it
- [ ] On move-in day, photograph every room, wall, floor, ceiling, appliance, fixture, and bathroom surface with time-stamped photos
- [ ] Test the HVAC system (both heat and A/C) on move-in day and document its working condition in writing
- [ ] Test all smoke detectors and CO detectors; document results
- [ ] Submit a written move-in condition report to the landlord via email within 3 days of move-in; retain your copy with the email timestamp
- [ ] Confirm the security deposit is being held per Texas law -- Texas does not require a separate escrow account, but confirm the amount in writing
- [ ] Calendar a reminder for 10 months from move-in: 60-day notice deadline to prevent auto-renewal
- [ ] Obtain renter's insurance effective on move-in date
- [ ] Request the landlord's emergency contact number and 24-hour repair contact in writing before move-in

---

### Jurisdiction Note

This review applies **Texas landlord-tenant law**, primarily Texas Property Code Chapter 92. Key Texas-specific rules:

- **Security deposit return:** 30 days from move-out (§ 92.103); wrongful withholding: 3x deposit + $100 + attorney's fees (§ 92.109)
- **Repair obligations:** Landlord must repair conditions materially affecting health/safety within a reasonable time after written notice (§ 92.056); HVAC likely qualifies
- **Entry notice:** No statutory minimum; 24 hours is the professional standard and is strongly recommended
- **Rent control:** Texas has no statewide rent control, and state law preempts local rent control ordinances -- Austin does not have rent stabilization
- **Just-cause eviction:** Texas does not require just cause for non-renewal of a fixed-term lease
- **Retaliation protection:** § 92.331 prohibits retaliation for tenant exercise of legal rights
- **Late fees:** Capped at 10-12% of monthly rent depending on building size (§ 92.019)

**Recommended Texas resources:**
- Texas Attorney General's Tenant Rights guide (Texas AG website)
- Texas RioGrande Legal Aid (serves Central Texas including Austin)
- Austin Tenants Council -- specifically serves Austin renters and can review your specific lease
