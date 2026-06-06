---
name: care-facility-evaluation
description: |
  Produces a structured evaluation framework for comparing care facilities
  including assisted living, memory care, and skilled nursing options.
  Generates criteria checklists, tour question lists, scoring matrices,
  and red flag indicators to support informed facility selection decisions.
  Use when the user asks about evaluating care facilities, comparing
  assisted living options, or choosing a nursing home for a family member.
  Do NOT use for medical care decisions (consult a physician), specific
  facility recommendations by name, or Medicare/Medicaid claims guidance.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "elder-care checklist decision-making"
  category: "family-relationships"
  subcategory: "caregiving"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Care Facility Evaluation

## When to Use

**Use this skill when:**
- A user is beginning the process of identifying appropriate long-term care placement for an aging parent, spouse, or relative and needs a structured framework to evaluate options
- A user is preparing to tour one or more care facilities and needs specific questions, checklists, and scoring tools to make the visit productive
- A user wants to compare multiple facilities side-by-side using objective criteria rather than impressions alone
- A user has received a hospital discharge notice for a family member (often 72 hours or less) and needs an accelerated evaluation framework for skilled nursing or short-term rehabilitation placement
- A user is concerned about the quality of care a family member is already receiving at a facility and wants criteria for evaluating whether to transfer to a different facility
- A user is planning ahead for a parent currently living independently but whose functional status is declining, and wants to understand the continuum of care options before a crisis forces a rushed decision
- A user needs to evaluate a memory care unit specifically for a family member diagnosed with Alzheimer's disease or another form of dementia

**Do NOT use this skill when:**
- The user is asking which specific facilities are available in their geographic area -- this skill provides evaluation criteria, not facility directories; direct them to their state's long-term care ombudsman program or state health department licensure database
- The user needs guidance on whether their family member medically requires a specific care level -- that determination must come from a physician, geriatrician, or hospital discharge planner; use `medical-decision-support` or direct to a healthcare provider
- The user needs help with Medicare Part A skilled nursing benefit claims, coverage periods, or appeals -- use a dedicated benefits navigation skill or refer to a State Health Insurance Assistance Program (SHIP) counselor
- The user asks about Medicaid long-term care application, spend-down rules, or asset protection strategies -- these are legal and financial planning matters requiring an elder law attorney; refer accordingly
- The user is asking about modifying a home to support aging in place rather than facility placement -- use `home-safety-aging`
- The user needs help organizing family caregiving schedules, responsibilities, or communication -- use `caregiver-coordination`
- The user is asking about hospice or palliative care program evaluation -- these have entirely different criteria and regulatory frameworks from residential long-term care facilities

---

## Process

### Step 1: Determine the Appropriate Level of Care

Before evaluating any facility, establish which point on the long-term care continuum matches the person's current functional status and anticipated trajectory. Getting this wrong wastes evaluation effort and can result in placement in an inappropriate setting.

- Assess functional status using the six standard Activities of Daily Living (ADLs): bathing, dressing, grooming, toileting, transferring (moving from bed to chair), and continence. Count how many require assistance. A person needing help with 1-2 ADLs is typically assisted living territory; 4+ ADLs with medical complexity points toward skilled nursing.
- Assess Instrumental Activities of Daily Living (IADLs) separately: managing finances, using a telephone, preparing meals, managing medications, housekeeping, laundry, and transportation. IADL deficits alone often indicate the threshold for assisted living before ADL decline begins.
- Identify medical complexity: daily wound care, IV medications, ventilator dependence, complex catheter management, or frequent nursing assessments require skilled nursing facility (SNF) placement, not assisted living.
- Assess cognitive status -- ask whether there has been a formal cognitive evaluation. A Mini-Mental State Examination (MMSE) score below 20 or a Montreal Cognitive Assessment (MoCA) score below 18, combined with behavioral symptoms like wandering, agitation, or sundowning, typically indicates the need for a dedicated memory care environment rather than a standard assisted living unit.
- Identify the care trajectory. Ask: "Is this person's condition stable, slowly declining, or rapidly changing?" A person with stable mild cognitive impairment may thrive in assisted living for years; a person six months post-stroke with active rehabilitation needs is a skilled nursing candidate who may transition to assisted living later.
- Use the table below to match findings to facility type:

| Facility Type | ADL Assistance Needed | Cognitive Status | Medical Complexity | Best Indicator |
|---|---|---|---|---|
| Independent Living | 0 ADLs | Intact | Minimal | Wants community; can self-manage care |
| Assisted Living | 1-3 ADLs | Mild impairment acceptable | Low-moderate | Needs personal care but not nursing |
| Memory Care | 1-4 ADLs | Moderate-severe dementia | Low-moderate | Wandering risk; behavioral symptoms |
| Skilled Nursing (Long-term) | 4-6 ADLs | Variable | High | Complex medical needs; 24/7 nursing required |
| Short-term Rehab (SNF) | Variable | Variable | High, improving | Post-hospital recovery; therapy-focused |
| CCRC (multiple levels) | Variable | Variable | Variable | Wants to age in one campus; upfront buy-in acceptable |

- Document the anticipated care trajectory explicitly. A facility that adequately meets current needs but cannot escalate care without requiring a transfer will force a traumatic additional move -- often at the worst possible moment.

---

### Step 2: Conduct Pre-Visit Research on Each Candidate Facility

Never visit a facility without completing this research first. Information gathered here determines which facilities are worth your time and flags specific questions to ask during tours.

- **License verification:** Every state maintains a publicly accessible licensure database for residential care facilities. Confirm the facility holds a current, active license for the specific level of care your family member needs. A facility licensed for assisted living cannot legally provide skilled nursing care, even informally.
- **Inspection report review:** The Centers for Medicare & Medicaid Services (CMS) maintains the Care Compare database (formerly Nursing Home Compare) for Medicare- and Medicaid-certified skilled nursing facilities. This provides star ratings across three domains: health inspections, staffing, and quality measures. For assisted living, check the state health department's inspection database -- these are state-regulated and vary considerably in transparency.
- **Deficiency citation analysis:** A single deficiency citation in a recent inspection is not automatically disqualifying. What matters is the scope and severity. CMS uses a letter-based severity scale from A (isolated, no actual harm) through L (immediate jeopardy to resident health or safety). Any citation at level G or above (actual harm to one or more residents) warrants serious scrutiny. More than two citations at scope D-F (potential for more than minimal harm) in a single survey also warrants scrutiny.
- **Staffing data:** CMS publishes staffing data for SNFs expressed as hours per resident per day (HPRD). The national average for registered nurse (RN) HPRD is approximately 0.7 hours. Facilities below 0.5 RN HPRD consistently underperform on quality measures. Total nurse staffing (RN + LPN + CNA combined) below 3.5 HPRD is a meaningful risk indicator. For assisted living, staffing ratios are state-regulated and less publicly available -- request them directly.
- **Ownership structure:** Research whether the facility is independently owned, part of a regional chain, or part of a large national for-profit chain. Ownership changes in the past 24 months can indicate financial instability or a shift in care philosophy. Check the state corporation records for ownership history.
- **Payment acceptance:** Confirm explicitly whether the facility accepts Medicare (for skilled nursing), Medicaid (for long-term care), the specific private long-term care insurance policy in question, or private pay only. Medicaid acceptance matters even for private-pay families -- a family that starts private pay and exhausts assets may need Medicaid to avoid forced transfer.
- **Ombudsman contact:** Every state has a Long-Term Care Ombudsman program funded under the Older Americans Act. Ombudsmen investigate complaints at specific facilities and maintain records. Contact the regional ombudsman office directly and ask whether the facility has open or recently closed complaints. This is a free, independent resource that most families don't know to use.

---

### Step 3: Conduct the Facility Tour

Schedule tours at a time you have not pre-announced to the facility as your "main visit" -- schedule a formal tour, but also plan an unannounced secondary visit at a different time of day and day of week. The formal tour and the unannounced visit often reveal entirely different operational realities.

**Physical Environment Assessment (score each item 1-5):**

- Odor is the single most reliable environmental indicator. A well-run facility with good continence care and ventilation has no persistent odor. A faint cleaning product smell is acceptable. Any persistent urine odor, fecal odor, or heavy chemical smell masking an underlying odor indicates inadequate care or understaffing.
- Examine non-public areas when possible -- a hallway near resident rooms, a side corridor, or a medication room glimpsed in passing tells more than the lobby.
- Lighting quality: dementia residents are particularly sensitive to poor lighting, which increases confusion and fall risk. Natural light should be abundant in common areas and ideally available in resident rooms. Avoid facilities with windowless corridors or heavy drapes on common area windows.
- Flooring and fall risk: look for non-slip flooring throughout, handrails at appropriate heights (approximately 32-34 inches) on both sides of corridors, and the absence of raised thresholds or transitions that create trip hazards.
- Temperature regulation: older adults are more sensitive to cold. A facility that is uncomfortably cool during a tour likely maintains lower temperatures during off-hours to cut costs.
- Room configuration: note whether rooms are private or semi-private (shared). Private rooms cost 20-40% more but are strongly associated with better resident emotional well-being. If considering a shared room, ask how roommate matching is handled and what the process is for requesting a room change if the match is poor.
- Secured outdoor space: physical access to outdoor areas is associated with reduced agitation in dementia residents and improved mood in all residents. Look for whether outdoor space is actually usable -- not just a parking lot view through a window.

**Staff Interaction Assessment (score each item 1-5):**

- Observe whether staff greet residents by name during the tour. This is a proxy for staff continuity and relationship quality.
- Watch body language between staff and residents. Staff who crouch to eye level when speaking to a seated resident, who touch residents' shoulders gently, or who introduce visitors to residents are demonstrating person-centered care philosophy.
- Count visible staff on the floor relative to the number of visible residents. If the nursing station is fully staffed but the resident hallways are empty of staff, ask where staff are -- they may be providing care, but the ratio of circulating staff to residents is a useful observation.
- Note whether staff make eye contact with you or look away. Staff who are comfortable with visitor scrutiny typically work in better environments.
- Ask a direct question: "What do you love most about working here?" -- the answer (or hesitation) is informative. Staff at well-run facilities typically answer readily and specifically. Staff at troubled facilities often give rehearsed, vague answers.
- Ask directly about annual staff turnover rate. The national median for nursing home CNAs is approximately 45-50% annually. Anything below 30% indicates unusual stability and is a strong positive signal. Anything above 70% is a serious concern that affects care continuity and resident relationships.

**Resident Experience Assessment (score each item 1-5):**

- During a morning or midday tour, observe whether residents are up, dressed, and out of their rooms. Residents who are consistently in bed or in nightclothes at 10am or later may indicate understaffing -- it takes time and staff to help residents dress, toilet, and transition to common areas.
- Review the monthly activity calendar. Evaluate whether it includes cognitively stimulating activities (word games, current events, music), physical activity (chair yoga, walking groups, stretching), social activities (group meals, entertainment, outings), and individualized one-on-one engagement. A calendar with only television, bingo, and holiday-themed crafts indicates minimal programming investment.
- Ask to see a sample meal or observe the dining room during meal service. Look for: whether residents are assisted who need help eating, whether mealtimes are unhurried, and whether staff sit with residents rather than hovering.
- Review one sample care plan if you can. Ask: "Can you show me a sample de-identified care plan?" A well-constructed care plan includes individualized goals (not just diagnoses), measurable interventions, frequency of review, and family communication dates. A generic, template-driven care plan with minimal individualization suggests the facility treats care planning as paperwork rather than a clinical tool.

---

### Step 4: Ask the High-Value Tour Questions

Most families ask surface-level questions during tours. The questions below are specifically designed to reveal operational quality, care philosophy, and financial risk. Ask them at every facility and compare the specificity of the answers.

**Staffing and Care:**
- "What is your current census compared to licensed capacity?" (A facility running at 65% capacity may have financial pressures; one at 98% may have little flexibility for new residents.)
- "What is your RN-to-resident ratio on the overnight shift specifically?" (Night shift is where care shortcuts are most common and most dangerous.)
- "Do you use agency staff to fill gaps? What percentage of your shifts are covered by agency versus permanent staff?" (High agency staff use means residents regularly encounter unfamiliar caregivers.)
- "When a resident's condition changes overnight, what is your clinical escalation protocol? Who is called first, and what triggers a 911 call versus an on-call nurse call?" (This reveals clinical judgment protocol and communication practice.)
- "How do you conduct family care plan meetings -- in person, by phone, how often, and who leads them?" (Quarterly care plan meetings including family are a regulatory requirement for SNFs; look for whether this is treated as a checkbox or a genuine engagement.)
- "What dementia-specific training do your direct care staff complete?" (Look for structured programs: the National Institute for Dementia Education certification, the Alzheimer's Association's essentiALZ program, or Teepa Snow's Positive Approach to Care training are credible examples. "We train all staff on dementia" without a specific program name is insufficient.)

**Costs and Contracts:**
- "Can you provide a written all-inclusive price list before I sign anything?" (Any facility that resists this should be treated with suspicion.)
- "Walk me through every possible additional charge beyond the base rate." (Common add-ons include medication management: $300-600/month; incontinence supplies; specialized diets; personal laundry; cable television; transportation; and cognitive stimulation programming in memory care.)
- "What has your base rate increase been in each of the last three years?" (Compare to inflation benchmarks. Rate increases of 5-8% annually are common; anything above that warrants explanation.)
- "If my family member's needs increase beyond what you can provide, what happens? What is your process, and who helps us find an alternative placement?" (The answer reveals whether the facility treats transition planning as a shared responsibility or simply issues a 30-day notice.)
- "Under what circumstances can you discharge a resident involuntarily, and what notice do you provide?" (SNFs have specific federal discharge notice requirements. Assisted living discharge rights are state-regulated and vary widely. Know the difference.)
- "Do you have a Medicaid-certified bed, and what is the process if a private-pay resident transitions to Medicaid?" (Some facilities have only a small number of Medicaid beds and use a waiting list. Others decline Medicaid residents entirely, meaning Medicaid eligibility triggers forced transfer.)

**Safety and Quality:**
- "What is your facility's fall rate and your most recent pressure ulcer (bedsore) prevalence rate?" (For SNFs, CMS publishes both as quality measures. Fall rates above 7-8 per 100 resident-days and pressure ulcer prevalence above 6-7% for high-risk residents are concerning. Ask how they compare to state and national averages.)
- "Describe your elopement prevention system." (A specific answer -- specific door alarm technology, a specific check-in protocol, wander management wristbands -- indicates actual implementation. A vague answer indicates the question was unexpected.)
- "How do you handle a resident who refuses care?" (Person-centered care facilities have specific protocols for supporting autonomy and de-escalating refusals. Facilities with a compliance-focused culture may struggle with this question.)

---

### Step 5: Apply the Scoring Matrix

Complete the scoring matrix after each tour while observations are fresh. Do not complete all tours and then score retroactively -- memory distortion favors whichever facility you toured most recently.

Scoring instructions:
- Score each criterion on a 1-5 scale: 1 = serious concerns, 2 = below standard, 3 = meets standard, 4 = above average, 5 = exceptional
- Calculate the weighted score for each category: (raw score ÷ 5) × category weight × 100
- Sum weighted scores for each facility to produce a weighted percentage score out of 100

Category weights are designed to reflect what the research evidence shows matters most for resident outcomes:

| Category | Weight | Rationale |
|---|---|---|
| Staff Quality and Continuity | 30% | Staffing is the single strongest predictor of resident outcomes in peer-reviewed literature |
| Care Services and Clinical Quality | 25% | Clinical competence and care planning directly affect health outcomes |
| Physical Environment and Safety | 20% | Environment affects fall risk, infection control, and well-being |
| Resident Quality of Life | 15% | Social engagement and autonomy affect mood, function, and cognitive maintenance |
| Cost and Financial Structure | 10% | Important but should not override quality indicators |

Do not adjust weights based on a facility being "really nice looking" -- a beautiful building with poor staff is a worse placement than a modest building with excellent caregivers. The weights are designed to prevent this common error.

---

### Step 6: Identify Red Flags and Disqualifiers

Some findings are absolute disqualifiers; others are serious concerns requiring deeper investigation before proceeding. Apply this framework to each facility.

**Immediate Disqualifiers (stop evaluation and remove from consideration):**
- The facility cannot produce a current state license upon request
- State inspection records show a citation at CMS severity level J, K, or L (immediate jeopardy) in the past 36 months that was not corrected with a verified plan of action
- Staff refuse to allow you to return unannounced during regular visiting hours
- The ombudsman reports an open investigation at the facility
- Residents are observed in a distressed, unkempt, or neglected state during any visit
- High-pressure sales tactics, refusal to provide written pricing, or pressure to sign a contract during the tour
- The facility cannot describe a specific protocol for reporting incidents to families, or staff state that families are not routinely notified of falls

**Serious Concerns (investigate before proceeding -- these can be disqualifying or manageable depending on context):**
- Annual CNA turnover above 60% or any indication that a significant portion of shifts are covered by agency staff
- No registered nurse physically on-site during overnight hours (must be available by phone is not adequate for a resident with complex medical needs)
- Fewer than three citations-free annual surveys in the past three years
- The facility has been acquired or changed operators within the past 18 months (instability period)
- Residents are observed watching television for extended periods during a morning visit with no staff-initiated engagement
- The director of nursing or administrator has been in the role fewer than six months (especially if combined with turnover evidence)
- Written contracts contain "as needed" language around care services without defining triggers -- this allows facilities to charge for services previously bundled into the base rate
- The facility has no Medicaid beds and the family's financial runway is fewer than 36 months of private-pay at the quoted rate

---

### Step 7: Conduct the Unannounced Follow-Up Visit

This step is non-negotiable for any facility under serious consideration. The formal tour shows you the facility at its best. The unannounced visit shows you its baseline.

- Visit at a time the facility did not expect you: late afternoon (4-6pm) captures the shift change period, which is a known high-risk time for care lapses; weekend mornings reveal weekend staffing levels; early evening reveals dinnertime staffing.
- Observe the dining room during meal service. Note the ratio of staff assisting residents to residents needing assistance, the pace of the meal, and whether the environment is calm or chaotic.
- Walk the resident hallway and note whether call lights are lit and for how long before staff respond. In a well-staffed facility, call light response times average 2-4 minutes. Persistent unaddressed call lights indicate staffing gaps.
- Note the overall atmosphere -- is the facility calm and organized, or does it feel reactive and rushed?
- If you encounter a staff member, ask one informal question: "How long have you worked here?" Staff tenure is a proxy for working conditions. A unit where most staff have been employed fewer than 12 months is a high-turnover environment regardless of what the facility reported officially.
- You have the right to visit during posted visiting hours without staff escort. If staff attempt to restrict or control your movements beyond what is reasonable, note that as a significant concern.

---

### Step 8: Compile the Evaluation Report

Assemble all collected data into the structured report format below. The report should be comprehensive enough to support a final decision and serve as documentation if the choice is later questioned by other family members or if a future transfer becomes necessary.

---

## Output Format

```
## Care Facility Evaluation Report
Prepared: [Date]
Evaluator: [Family member name and relationship to resident]
Resident being evaluated: [First name or initials only for privacy]

---

### Section 1: Care Needs Assessment

**Current functional status:**
- ADL assistance needed: [List specific ADLs requiring help]
- IADL assistance needed: [List specific IADLs requiring help]
- Cognitive status: [Intact / Mild impairment / Moderate impairment / Severe impairment]
- Medical complexity: [Low / Moderate / High -- brief description]
- Current diagnoses relevant to placement: [List]
- Fall history: [Number and circumstances in past 12 months]

**Care level indicated:** [Independent Living / Assisted Living / Memory Care / Skilled Nursing]

**Anticipated trajectory:**
[Stable / Gradual decline expected within 1-3 years / Rapid decline or significant uncertainty]
Implication: [Will current care level meet needs for at least 12-24 months, or is escalation likely?]

**Non-negotiable placement criteria:**
- [Criterion 1 -- e.g., Medicaid acceptance required within 24 months]
- [Criterion 2 -- e.g., Must be within 20 minutes of primary family caregiver]
- [Criterion 3 -- e.g., Must accommodate specific dietary requirement]

---

### Section 2: Pre-Visit Research Summary

| Facility Name | License Status | CMS Star Rating | Last Inspection | Serious Deficiencies | Ombudsman Status | Accepts Medicaid | Notes |
|---|---|---|---|---|---|---|---|
| [Facility A] | Active | [X]/5 | [Month/Year] | [#, highest severity] | No open cases / Active complaint | Yes/No/Limited beds | |
| [Facility B] | Active | [X]/5 | [Month/Year] | [#, highest severity] | No open cases / Active complaint | Yes/No/Limited beds | |
| [Facility C] | Active | [X]/5 | [Month/Year] | [#, highest severity] | No open cases / Active complaint | Yes/No/Limited beds | |

**Facilities removed from consideration at pre-visit stage:**
- [Facility name]: [Specific reason for removal]

---

### Section 3: Tour Evaluation Scores

**Facility A -- [Name]**
Tour date: [Date] | Time: [Time] | Staff contact: [Name, Title]
Unannounced visit date: [Date] | Time: [Time] | Key observations: [Summary]

| Criterion | Raw Score (1-5) | Notes |
|---|---|---|
| **STAFF QUALITY AND CONTINUITY (30%)** | | |
| Staff-to-resident ratio (all shifts) | | |
| Staff tenure and turnover rate | | |
| Warmth and person-centered interaction observed | | |
| Agency staff reliance | | |
| Dementia-specific or specialty training | | |
| Response to detailed questions | | |
| **CARE SERVICES AND CLINICAL QUALITY (25%)** | | |
| Clinical escalation protocol clarity | | |
| Care plan quality and individualization | | |
| Medication management protocol | | |
| Fall prevention program specificity | | |
| Family communication frequency and quality | | |
| **PHYSICAL ENVIRONMENT AND SAFETY (20%)** | | |
| Odor (absence of persistent unpleasant odor) | | |
| Lighting (natural and adequate artificial) | | |
| Flooring safety and fall risk features | | |
| Secured outdoor access | | |
| Room size and personalization options | | |
| Overall cleanliness | | |
| **RESIDENT QUALITY OF LIFE (15%)** | | |
| Resident engagement and appearance during tour | | |
| Activity programming quality and variety | | |
| Dining experience quality | | |
| Flexibility of schedule and visiting hours | | |
| **COST AND FINANCIAL STRUCTURE (10%)** | | |
| Transparency of pricing | | |
| Value relative to comparable facilities | | |
| Medicaid transition policy | | |
| Contract fairness | | |

**Category Scores -- Facility A:**

| Category | Avg Raw Score | Weight | Weighted Score |
|---|---|---|---|
| Staff Quality and Continuity | [avg]/5 | 30% | [X.X] |
| Care Services and Clinical Quality | [avg]/5 | 25% | [X.X] |
| Physical Environment and Safety | [avg]/5 | 20% | [X.X] |
| Resident Quality of Life | [avg]/5 | 15% | [X.X] |
| Cost and Financial Structure | [avg]/5 | 10% | [X.X] |
| **TOTAL WEIGHTED SCORE** | | 100% | **[XX.X] / 100** |

[Repeat Section 3 block for each facility evaluated]

---

### Section 4: Comparative Scoring Summary

| Category | Weight | [Facility A] | [Facility B] | [Facility C] |
|---|---|---|---|---|
| Staff Quality and Continuity | 30% | [X.X] | [X.X] | [X.X] |
| Care Services and Clinical Quality | 25% | [X.X] | [X.X] | [X.X] |
| Physical Environment and Safety | 20% | [X.X] | [X.X] | [X.X] |
| Resident Quality of Life | 15% | [X.X] | [X.X] | [X.X] |
| Cost and Financial Structure | 10% | [X.X] | [X.X] | [X.X] |
| **TOTAL** | **100%** | **[XX.X]** | **[XX.X]** | **[XX.X]** |

---

### Section 5: Cost Comparison

| Cost Element | [Facility A] | [Facility B] | [Facility C] |
|---|---|---|---|
| Base monthly rate (private room) | $X,XXX | $X,XXX | $X,XXX |
| Base monthly rate (shared room, if applicable) | $X,XXX | $X,XXX | $X,XXX |
| Community / move-in fee | $X,XXX | $X,XXX | $X,XXX |
| Medication management (monthly) | $XXX | $XXX | $XXX |
| Incontinence supplies (monthly, if not bundled) | $XXX | $XXX | $XXX |
| Laundry (monthly, if not bundled) | $XXX | $XXX | $XXX |
| Transportation (per-trip or monthly) | $XX/trip | $XX/trip | $XX/trip |
| Additional care tier charges (if applicable) | $XXX | $XXX | $XXX |
| **Estimated Year 1 all-in total** | **$XX,XXX** | **$XX,XXX** | **$XX,XXX** |
| Typical annual rate increase (last 3 years) | X% | X% | X% |
| **Estimated Year 3 all-in total** | **$XX,XXX** | **$XX,XXX** | **$XX,XXX** |
| Medicaid accepted | Yes/No/Limited | Yes/No/Limited | Yes/No/Limited |
| Est. private-pay runway at current assets | XX months | XX months | XX months |

---

### Section 6: Red Flags and Disqualifiers Identified

| Facility | Finding | Category | Impact |
|---|---|---|---|
| [Facility name] | [Specific observed or researched finding] | [Immediate Disqualifier / Serious Concern] | [Remove from consideration / Investigate further] |

---

### Section 7: Recommendation Summary

**Recommended facility:** [Name]
**Score:** [XX.X / 100]
**Key reasons:**
- [Specific strength 1 with supporting evidence]
- [Specific strength 2 with supporting evidence]
- [Specific strength 3 with supporting evidence]

**Concerns to monitor after placement:**
- [Specific item to watch and how frequently to reassess]

**Runner-up:** [Name] | Score: [XX.X / 100]
**Why not ranked first:** [Specific reasons]
**Circumstances under which this facility becomes preferred:** [e.g., "If Medicaid transition is required within 18 months, this facility becomes the stronger choice given its Medicaid bed availability"]

---

### Section 8: Action Plan and Timeline

| Step | Owner | Target Date |
|---|---|---|
| Request written contracts from top two choices | [Family member] | [Date] |
| Review contracts with elder law attorney | [Family member] | [Date] |
| Conduct final unannounced visit to top choice | [Family member] | [Date] |
| Notify chosen facility and complete application | [Family member] | [Date] |
| Schedule move-in and coordinate logistics | [Family member + facility] | [Date] |
| First care plan meeting after move-in | [Family member] | [Date -- typically 2 weeks post-move-in] |
| First 30-day quality reassessment | [Family member] | [Date] |
| 90-day full re-evaluation against initial criteria | [Family member] | [Date] |
```

---

## Rules

1. **Never recommend a specific named facility.** This skill produces evaluation frameworks, criteria, scoring tools, and comparative analysis. It does not make specific facility referrals, even in response to the user naming facilities they are considering. If the user names facilities, apply the evaluation framework to those facilities without ranking them as inherently good or bad independent of the user's collected information.

2. **Never determine care level without appropriate clinical input.** This skill can describe what each care level typically requires and help a family think through functional indicators, but the definitive determination of appropriate care level belongs to the person's physician, geriatrician, or hospital discharge planner. If the user is uncertain whether their family member needs assisted living versus skilled nursing, direct them to request a clinical evaluation before committing evaluation energy to the wrong facility type.

3. **Always weight staff quality at 30% in the scoring matrix.** The peer-reviewed evidence on long-term care quality consistently identifies staffing levels, staff stability, and staff training as the strongest predictors of resident outcomes. Do not reduce this weight even if the user is particularly impressed by a facility's physical appearance or amenities.

4. **Always include Year 3 cost projections, not just Year 1.** Annual rate increases in assisted living average 4-7% nationally, with some markets seeing 8-12% increases in recent years. The difference between a $5,500/month facility and a $6,000/month facility compresses significantly if one facility raises rates 3% annually and the other raises them 8%. Three-year projections reveal this.

5. **Always ask about and document the Medicaid transition policy, even for families who expect to self-pay indefinitely.** The median duration of assisted living residency is approximately 22 months; the average cost of assisted living nationally exceeds $54,000 per year. Most families significantly underestimate how quickly private-pay resources can deplete when care needs -- and associated charges -- escalate. A facility with no Medicaid beds may be inappropriate for a family with a financial runway below 48 months.

6. **Never complete the scoring matrix from memory after touring multiple facilities on the same day.** Score each facility immediately after the tour while observations are fresh. Retroactive scoring introduces recency bias that systematically favors the last facility visited. If a user describes touring three facilities in one day, advise them to reconstruct scores from contemporaneous notes rather than impressions.

7. **Always include the unannounced follow-up visit as a required step, not optional.** The formal scheduled tour is a marketing presentation. Multiple peer-reviewed studies of long-term care quality have documented that quality indicators observed during announced inspections consistently exceed those observed during unannounced inspections at the same facilities. The unannounced visit is not optional for any placement under serious consideration.

8. **Flag any contract language that is vague about care escalation costs.** Phrases like "additional care provided as needed at prevailing rates" or "care plan adjustments may result in rate changes" without defined triggers or maximum escalation limits are financial risk factors. These clauses allow a facility to significantly increase charges as a resident's needs grow, without the family having agreed to a specific rate structure.

9. **Apply immediate disqualifiers as hard stops, not as factors to weigh against other positives.** An immediate disqualifier -- such as a recent immediate jeopardy citation, an open ombudsman investigation, or staff refusing to share inspection records -- cannot be offset by a beautiful facility or a low price. Do not present a facility with an active disqualifier as a viable option regardless of its scores in other categories.

10. **Always prompt a 30-day and 90-day quality reassessment after placement.** The evaluation process does not end at move-in. Care quality in long-term care facilities is dynamic -- staff change, ownership can change, and individual residents' relationships with staff develop in ways that affect quality of daily experience. Build explicit reassessment checkpoints into the action plan, and give the family specific observable indicators to watch for that signal declining quality: increasing call-light wait times, unexplained weight loss, pressure ulcer development, staff who no longer greet the resident by name, or activity participation declining.

---

## Edge Cases

### Memory Care Evaluation

When the person being placed has a diagnosis of Alzheimer's disease, Lewy body dementia, frontotemporal dementia, or another form of dementia, standard assisted living evaluation criteria are necessary but insufficient. Layer in these specialized criteria:

- **Secured perimeter technology:** Ask specifically how the facility prevents elopement (a clinical term for unauthorized exit by a cognitively impaired person, not a criticism -- it is an industry standard term). A specific answer includes: door alarm systems with wander management wristbands, door codes that residents cannot learn due to cognitive impairment, and a staffed entry/exit point. A vague answer is inadequate.
- **Staff dementia certification:** Ask for the specific name of the training program and the percentage of direct care staff who have completed it. The Alzheimer's Association's essentiALZ certification requires an 8-hour curriculum and an exam. Teepa Snow's Positive Approach to Care (PAC) certification involves direct skills observation. "We train all our staff on dementia" without a specific program name is marketing language, not a certification.
- **Behavioral management philosophy:** Ask directly: "When a resident with dementia becomes aggressive or refuses care, what is your approach?" Person-centered facilities will describe validation therapy, redirection techniques, and individualized behavioral triggers. Facilities with poor dementia care may describe physical redirection, isolation, or -- a serious red flag -- suggest that chemical sedation (sometimes called "chemical restraint" in regulatory language) is used liberally.
- **Life history and biography use:** Well-run memory care facilities gather detailed life histories from families at admission and use this information to individualize engagement. Ask whether there is a "life history" or "biography" intake form and how it is used in daily care and activity planning.
- **Sensory environment:** Dementia residents are highly sensitive to environmental overstimulation (noise, visual clutter, unpredictable activity). Evaluate whether the physical environment is calm, with predictable sensory inputs, adequate lighting, minimal clutter, and orientation cues (clear room labeling, consistent layout) that support spatial navigation.
- **Sundowning management:** Ask specifically how the facility manages late-afternoon and evening agitation, which is common in moderate-to-advanced dementia. A specific answer includes increased staffing during this window, structured evening programming, and individualized protocols. A vague answer suggests the facility does not have a specific sundowning protocol.
- Weight the following criteria at double their standard importance in the scoring matrix for memory care evaluations: secured perimeter, dementia-specific staff training, behavioral management philosophy, and the consistency of the daily routine.

---

### Hospital Discharge Pressure (72-Hour or Less Decision Window)

When a family member has received a hospital discharge notice -- typically 3-5 days into a hospitalization, or upon Medicare determination that skilled care is no longer medically necessary -- the family may have 24-72 hours to identify post-acute placement. This is one of the most stressful scenarios in elder care and one of the most common. The compressed timeline does not eliminate the need for evaluation; it requires accelerating the process intelligently.

- **Invoke the hospital social worker immediately.** Every hospital is required to provide discharge planning services. The social worker should provide a list of available post-acute or skilled nursing beds and can share informally which facilities they have seen good outcomes from. This is not a formal recommendation and carries no legal standing, but social workers' informal knowledge of local facilities is a genuine clinical resource.
- **Use the CMS Care Compare database immediately.** The CMS Care Compare website provides star ratings and inspection data for Medicare-certified skilled nursing facilities. A facility with an overall 4-5 star rating and no recent deficiencies above severity D can be evaluated via this tool in 15-20 minutes per facility.
- **Conduct a video tour or phone interview when in-person is not possible.** Request a video call specifically asking to see: the resident's prospective room, the nursing station on that unit, the common area, and the dining room during meal service. The lobby and marketing suite are irrelevant.
- **Ask one critical triage question:** "Do you have a RN physically on-site 24 hours a day, 7 days a week?" For post-hospital discharge with active medical needs, the answer must be yes. An RN "available by phone" is inadequate for a resident requiring active clinical monitoring.
- **Prioritize Medicare certification, clinical capability, and staffing.** Under a compressed timeline, the weighted scoring matrix can be abbreviated: prioritize staff quality (50% weight), care services (35%), and defer full environment and quality of life scoring until considering a potential transfer after 30 days if needed.
- **Know the Medicare SNF benefit structure:** Medicare Part A covers skilled nursing facility care at 100% for days 1-20 and with a significant daily copayment ($200+ per day) for days 21-100, following a qualifying 3-day inpatient hospital stay. After 100 days, Medicare does not pay. Families often discover this during the post-acute placement process -- it shapes the timeline for re-evaluation and potential transition to a long-term care environment.

---

### Long-Distance Evaluation

When the family responsible for decision-making cannot easily travel to tour facilities -- due to geography, work constraints, or the fact that the elder lives in a different region -- the evaluation process must be adapted without compromising rigor.

- **Contact the local Area Agency on Aging (AAA).** Every county in the United States is served by an Area Agency on Aging, funded under the Older Americans Act. AAA staff can provide referrals, information about local facilities, and sometimes direct assistance with facility evaluation. Find the local AAA through the Eldercare Locator (a federally funded service).
- **Contact the regional Long-Term Care Ombudsman.** The ombudsman program covers all licensed long-term care facilities in its region. An ombudsman cannot make facility recommendations, but can confirm whether a specific facility has open complaints and may be able to provide context about local facility quality.
- **Use state inspection databases remotely.** Most states post facility inspection reports online in their health department or DHHS websites. For SNFs, CMS Care Compare is nationally accessible. Review these before committing to any facility.
- **Hire a geriatric care manager for on-site assessment.** A Certified Care Manager (CCM) or Aging Life Care Professional (ALCP) can tour facilities on the family's behalf, conduct a professional assessment using established quality criteria, and report back. This service typically costs $100-200 per hour and is often worth the investment when geography prevents family visits. The Aging Life Care Association maintains a professional directory.
- **Request a detailed video tour from the facility.** Structure the video tour request specifically: do not accept a pre-recorded facility marketing video. Request a live video call with a specific tour path: the resident's prospective room, the unit hallway during a typical time of day, the dining area, the outdoor space, and introduction to two or three direct care staff members on the unit where the resident would live.
- **In-person visit before final commitment is still strongly recommended.** Even if an initial video tour and remote research support a tentative decision, the family should make at least one in-person visit before signing a contract whenever logistically possible. If truly impossible, document the decision-making process carefully and build a 30-day in-person assessment visit into the placement plan.

---

### Evaluating for a Couple With Divergent Care Needs

When one member of a couple has significantly higher care needs than the other, facility selection becomes substantially more complex because most facilities are designed around individual residents, not couples.

- **Identify first whether co-location is the priority or whether appropriate care for each person is the priority.** In some situations these align; in others they do not. A memory care unit that is excellent for one partner may be an overly restrictive and disorienting environment for the other. Being honest about this tension early is important.
- **Prioritize Continuing Care Retirement Community (CCRC) or Life Plan Community models.** CCRCs that offer multiple care levels on a single campus (independent living, assisted living, memory care, and skilled nursing) allow couples to live near each other even as care needs diverge. Couples typically share a room or apartment in the lower-acuity setting with the higher-needs partner receiving services in a specialized unit; visiting rights allow them to spend significant time together daily.
- **Understand the financial structure.** CCRCs often require an entrance fee ($100,000-$500,000 or more depending on the market and contract type) plus monthly fees, in exchange for guaranteed access to all care levels on campus. Contract types vary significantly: a Type A (Life Care) contract bundles increasing care costs into the monthly fee; a Type C (fee-for-service) contract prices each level of care separately. The Type A contract provides significant financial protection if one partner develops high care needs; Type C contracts can result in dramatically escalating costs.
- **Evaluate couple-accommodation policies explicitly.** Ask each facility: "Can a couple share a room if one person needs assisted living and the other would be independent living?" Some facilities allow this with a supplemental charge; others require both residents to be at the same care level. Ask about visitation rights if one partner is in a memory care unit -- can the other partner visit freely, have meals together, and participate in activities together?
- **Add the other partner's anticipated trajectory to the evaluation.** The lower-needs partner's health can decline as well. A facility chosen primarily for the higher-needs partner must also be an appropriate living environment for the lower-needs partner, whose well-being and daily life quality matter equally.

---

### Evaluating for Cost-Constrained Families

When the family has limited financial resources relative to the cost of private-pay care, the evaluation framework must integrate financial sustainability as a primary constraint without sacrificing care quality.

- **Establish the financial runway first.** Before touring any facility, calculate the family's realistic financial capacity: liquid assets plus monthly income minus essential living expenses, divided by the monthly all-in cost estimate at the type of facility being considered. Express this as a number of months. If the runway is fewer than 36 months, Medicaid eligibility and planning are immediately relevant.
- **Medicaid bed availability is a first-tier criterion.** Ask during initial phone screening, before scheduling a tour: "Do you accept Medicaid, and do you have dedicated Medicaid beds currently available or on a waiting list?" Many SNFs accept some Medicaid residents but have a limited number of Medicaid-certified beds with waiting lists of 6-18 months. Knowing this in advance allows the family to get on waiting lists while still private-paying at a preferred facility.
- **Evaluate shared room options systematically.** Private rooms in assisted living and SNFs typically cost 20-35% more than shared rooms. While private rooms are preferable for dignity and sleep quality, a shared room at a high-quality facility may be significantly preferable to a private room at a lower-quality facility for the same cost.
- **Examine the bundled vs. a la carte pricing structure carefully.** Some facilities charge a low base rate but itemize nearly every service separately (a la carte model): medication management, incontinence care, laundry, transportation, and supplemental programming are each billed separately. An a la carte facility may appear cheaper at the base rate but cost significantly more in practice. Request an itemized estimate based on the resident's anticipated needs, not just the base rate.
- **Know what the low price signals.** The least expensive facility in a given market is not automatically poor quality. Some non-profit and faith-based facilities operate on mission-driven financing with lower rates. Evaluate based on the full scoring matrix regardless of price. However, a price substantially below market median (more than 20% below comparable facilities in the same area) warrants a specific question: "How do you maintain lower pricing than comparable facilities?" The answer should be specific and plausible (non-profit subsidy, donation endowment, government grant funding) rather than evasive.

---

### The Resistant or Reluctant Family Member

When the person who needs care has significant cognitive capacity but is resisting placement -- whether due to denial of need, fear, grief about loss of independence, or legitimate philosophical objection -- the family is navigating an ethical and relational challenge alongside the logistical one.

- **This skill addresses the evaluation and selection process, not the question of whether someone should be placed against their expressed wishes.** Questions about decision-making authority, guardianship, and autonomy override require consultation with an elder law attorney and, in some cases, the person's physician. Do not conflate facility evaluation with persuasion.
- **When a person has cognitive capacity to participate in decision-making, involve them directly in the evaluation process.** Invite the person to join tours, review materials, and score their own priorities. This shifts the dynamic from "placing" a family member to supporting them in choosing their own next living situation. A person who participated in selecting a facility adjusts to placement significantly better than one who feels the decision was made without them.
- **Trial stays as an evaluation tool.** Many assisted living and memory care facilities offer short-term trial stays (typically 30-90 days) before a permanent commitment. If a resistant family member agrees to a trial stay, it often resolves the objection more effectively than any amount of family discussion. Ask each facility whether trial stays are available, their duration, and whether any portion of the move-in fee is applied toward a permanent placement.
- **Evaluate facilities on their new-resident adjustment programs.** Some facilities assign a peer ambassador (another resident) to new arrivals; others have a social worker or activities staff member dedicated to the transition period. These programs meaningfully improve adjustment outcomes for reluctant residents.
- **If the person lacks cognitive capacity to make this decision, ensure the family has appropriate legal authority.** A healthcare power of attorney (HCPOA) must be activated according to its specific terms -- most require physician documentation of incapacity. Placing a person in a care facility without appropriate legal authority can have significant legal and ethical consequences. If there is uncertainty about decision-making authority, consult an elder law attorney before proceeding.

---

## Example

**User Input:**
"My dad is 82. He had a stroke six months ago and recovered fairly well but he still needs help with bathing and dressing, he sometimes gets confused in the evening, and his doctor says he could need more help in the next year or two. He's living with my sister right now but that's becoming unsustainable. We're thinking assisted living might be right but we're not sure. He has about $240,000 in savings and gets $1,850/month from Social Security. What should we look for?"

---

**Output:**

## Care Facility Evaluation Report
Prepared for: Family of [Father, referred to as "Dad" throughout]
Situation: Post-stroke with ADL assistance needs, mild evening confusion, family caregiver capacity limit reached

---

### Section 1: Care Needs Assessment

**Current functional status:**
- ADL assistance needed: Bathing (requires hands-on assistance), dressing (requires assistance with upper and lower body)
- IADL assistance needed: Likely requires assistance or supervision with medication management, possibly finances; needs clarification
- Cognitive status: Mild -- evening confusion (consistent with post-stroke cognitive changes and possible mild vascular cognitive impairment); largely intact during daytime
- Medical complexity: Moderate -- post-stroke with ongoing recovery; physician anticipates escalating needs within 1-2 years
- Relevant history: Ischemic stroke six months prior, partial recovery, stable but not fully resolved
- Fall history: Clarify with family -- stroke survivors have significantly elevated fall risk; ask whether falls have occurred during the six-month recovery

**Care level indicated:** Assisted Living -- current functional status is consistent with assisted living (2 ADLs requiring assistance, mild cognitive symptoms, no complex medical needs requiring nursing). However, the physician's note about anticipated escalation and the evening confusion warrant:
1. Selecting a facility that can escalate care without requiring transfer, OR
2. Evaluating whether memory care or an assisted living community with a dedicated memory support program is more appropriate given the cognitive trajectory

**Anticipated trajectory:**
Gradual decline likely within 12-24 months based on physician's assessment. Vascular cognitive impairment (the most common post-stroke cognitive change) often follows a step-wise decline pattern -- periods of stability followed by sudden function loss after additional vascular events. This trajectory favors placing in a facility that can accommodate a range of care levels.

**Implication for facility selection:** This is one of the most important factors in this evaluation. A facility that provides assisted living only and cannot escalate to memory care will require your dad to relocate when needs increase -- a traumatic disruption
