---
name: travel-insurance-evaluator
description: |
  Creates a travel insurance coverage comparison checklist and explains key
  policy clauses in plain language. Gathers trip details, traveler health
  profile, and risk factors to produce a side-by-side coverage comparison
  framework and a policy clause decoder that highlights what to look for
  and what exclusions to watch out for.
  Use when the user asks about travel insurance, how to choose a travel
  insurance policy, what travel insurance covers, or how to compare travel
  insurance options.
  Do NOT use for health insurance selection (use health-wellness or
  personal-finance skills), auto insurance, home insurance, or life
  insurance comparison.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel checklist insurance research"
  category: "travel-experiences"
  subcategory: "travel-logistics"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Travel Insurance Evaluator

## When to Use

**Use this skill when:**
- A user is planning an international or domestic trip and wants to understand what travel insurance to purchase, what coverage amounts are appropriate, or how to compare policies
- A user asks what travel insurance actually covers and wants jargon-free explanations of clause types like "covered reasons," "pre-existing condition waiver," "look-back period," or "medical necessity"
- A user has received quotes from multiple insurance aggregators and wants a structured framework to compare them side by side
- A user is planning adventure travel (trekking, diving, skiing, motorcycle touring, safari) and needs to understand whether standard policies exclude their activities
- A user is unsure whether their credit card travel benefits are sufficient and wants to know where the gaps are
- A user asks whether travel insurance is worth it for a specific trip type -- cruise, backpacking, all-inclusive resort, remote expedition, business travel
- A user has a pre-existing medical condition and wants to understand how that affects coverage eligibility, policy cost, and claims
- A user needs to understand the financial exposure of canceling or interrupting an expensive trip and whether the insurance cost justifies the risk
- A user is traveling to a destination with a high healthcare cost (United States, Switzerland, Japan, UAE) or a destination with extremely limited medical infrastructure (remote Africa, Central Asia, Pacific islands)

**Do NOT use when:**
- The user needs ongoing domestic health insurance for themselves or family members -- use a health-wellness or personal-finance skill focused on health plan selection
- The user wants to compare auto insurance, homeowner's insurance, renter's insurance, or liability coverage -- these are separate skill domains
- The user wants life insurance or disability insurance evaluated -- entirely different risk and actuarial frameworks
- The user is in the middle of an active travel insurance claim and needs claims support -- direct them to contact their insurer's 24-hour emergency line and document everything; do not simulate a claims agent
- The user wants to understand the mechanics of self-insuring for frequent travel (e.g., holding a dedicated emergency fund instead of buying insurance) -- use a personal-finance budgeting or risk management skill
- The user is asking about country-specific visa requirements for proof of insurance (e.g., Schengen visa mandatory insurance requirements) -- this is a visa logistics question, not a policy evaluation question; address it briefly and redirect to travel-logistics skills

## Process

### Step 1: Gather the Core Trip and Traveler Profile

Before generating any comparison or recommendation, collect the following information. If the user has not provided it, ask for it explicitly -- the quality of the output depends entirely on specificity.

- **Destination(s):** List every country or region, including transit countries. A transit through Dubai adds UAE to the risk profile. A multi-country itinerary requires confirming the policy covers all listed countries.
- **Trip dates and duration:** Exact departure and return dates. Trips over 30 days, 60 days, and 90 days cross important policy threshold limits that change which products are available.
- **Total pre-paid non-refundable trip cost:** This is the number that drives cancellation and interruption coverage limits. Include flights, accommodation, pre-booked tours, permits (like the Machu Picchu Inca Trail permit), safari lodges, cruise deposits, and any other non-refundable commitment. Separate refundable from non-refundable costs -- only non-refundable amounts need to be insured.
- **Number of travelers and ages:** Age is a primary pricing driver. Travelers over 60, 65, and 70 cross significant premium thresholds. Children under 17 are often covered free under a parent's policy.
- **Pre-existing medical conditions:** This is the most consequential variable for policy selection. Ask directly whether any traveler has been diagnosed with, treated for, or seen a doctor about any medical condition in the past 90, 180, or 365 days (the look-back period varies by policy). Even stable, well-managed conditions like hypertension, diabetes, or asthma affect coverage.
- **Planned activities:** Ask explicitly. "Hiking" is different from "trekking above 4,000m." "Swimming" is different from "scuba diving below 30m." "Driving" is different from "motorcycle rental." Specific activities must be matched against policy exclusion schedules.
- **Existing coverage:** Credit card travel benefits (which card, what tier -- Visa Infinite vs. Visa Signature have different coverage levels), employer travel insurance for business portions, national health system coverage abroad (EU EHIC/GHIC card, provincial health cards), and any annual travel policy already in place.
- **Budget sensitivity and risk tolerance:** Is the user comfortable with a $500 deductible in exchange for a lower premium? Are they risk-averse and want comprehensive CFAR coverage? This shapes recommendations.

### Step 2: Classify the Trip's Risk Profile

After gathering the profile, categorize the trip across four dimensions before generating any coverage recommendations. This prevents generic advice and produces trip-specific output.

**Medical risk level:**
- Low: Domestic trip, traveler has domestic health insurance, no adventure activities
- Medium: International trip to a country with reciprocal health agreements or quality public hospitals; traveler is under 60 and healthy
- High: Remote destination, country with poor or expensive healthcare, traveler over 60 or with pre-existing conditions
- Critical: Expedition-level adventure, extreme altitude, destination with no evacuation infrastructure within 6 hours, traveler with serious cardiac or respiratory history

**Financial cancellation risk:**
- Low: Trip cost under $1,500, most components refundable, flexible traveler
- Medium: Trip cost $1,500--$5,000, some non-refundable components
- High: Trip cost over $5,000 per person, or significant non-refundable deposits (safari, expedition, cruise)
- Critical: Trip cost over $10,000 per person, or deposits that are 100% non-refundable on any cancellation

**Activity risk level:**
- Standard: Walking tours, beach, city travel, museums, mild hiking on marked trails below 2,500m
- Elevated: Snorkeling, kayaking, horseback riding, cycling, moderate hiking at altitude
- High: Scuba diving, skiing, snowboarding, whitewater rafting, trekking above 3,500m, motorcycle rental
- Extreme: Rock climbing, mountaineering above 5,000m, skydiving, bungee jumping, off-piste skiing, moto-cross

**Duration risk:**
- Short: 1--7 days
- Standard: 8--30 days
- Extended: 31--90 days (changes policy type needed)
- Long-term: 91+ days (standard trip policies unavailable; requires expatriate or long-stay medical policy)

### Step 3: Determine Coverage Priorities and Minimum Amounts

Map the risk classification to specific coverage priorities and dollar minimums. These thresholds are based on real-world claims data and healthcare cost benchmarks:

**Medical emergency coverage minimums by destination:**
- United States (as destination): $500,000 minimum -- a 3-day ICU stay in a US hospital averages $30,000--$100,000. Many serious cases exceed $250,000.
- Western Europe: $100,000 minimum -- costs are lower but still significant for non-EU travelers without EHIC
- Japan, UAE, Singapore, Switzerland: $200,000 minimum -- among the highest healthcare costs outside the US
- Southeast Asia (Thailand, Bali, Vietnam): $50,000 minimum if traveling only between major cities; $100,000 for remote travel
- Sub-Saharan Africa, remote South America, Central Asia: $100,000 minimum for treatment plus evacuation costs
- Caribbean and Mexico resort areas: $50,000--$100,000 -- private hospitals in tourist areas are expensive; public hospitals are limited

**Medical evacuation coverage minimums:**
- Any international destination: $250,000 absolute minimum. This is non-negotiable.
- Remote or adventure destination: $500,000 recommended. A helicopter evacuation from a mountain in Nepal costs $5,000--$15,000 for the helicopter alone, plus ground transport and accompanying medical personnel.
- US as destination: $100,000 may be sufficient for in-country transport if medical coverage is high
- Note: Many low-cost policies cap evacuation at $50,000 or $100,000 -- this is a critical red flag for any trip outside a major city

**Trip cancellation coverage:**
- Must equal 100% of total non-refundable pre-paid trip costs. Not 80%, not "close to" -- 100%.
- If the total non-refundable cost is $6,400, the cancellation limit must be at least $6,400.
- Policies that cap cancellation at a flat $5,000 are inadequate for more expensive trips regardless of other features.

**Trip interruption coverage:**
- Should be 150% of trip cost -- the extra 50% covers last-minute one-way economy airfare home, which can be $1,000--$3,000, plus unused accommodation and missed pre-paid components.

**Travel delay:**
- Look for a daily benefit of $150--$250 per person and a total cap of $500--$1,000 per person
- The trigger threshold matters: policies that pay after 3 hours of delay are more useful than those requiring 12 hours
- Look for per-incident caps -- some policies cap a single delay event at $200, which is inadequate for an overnight delay

**Baggage loss:**
- A limit of $1,500--$2,500 per person is standard. If the traveler is carrying camera equipment, laptops, or jewelry, this is often insufficient -- those items require separate travel floater coverage or a homeowner's rider.
- Per-item limits are common: even a policy with a $2,500 total limit may cap any single item at $500. Electronics are frequently capped at $500--$750 per item.

### Step 4: Identify Pre-Existing Condition Implications

This step applies whenever any traveler has a medical history. It has the highest claims denial rate of any coverage category and deserves dedicated treatment.

**The look-back period** is the window of time before the policy purchase date during which the insurer reviews whether a condition existed. Standard look-back periods are 60, 90, 180, or 365 days depending on the policy. A condition "exists" if during that window: a doctor prescribed or changed medication, a test was ordered or resulted, a hospitalization occurred, or symptoms prompted a medical visit.

**Pre-existing condition waiver** (also called a "pre-existing condition exclusion waiver" or PCEW): Many policies offer to waive the exclusion for pre-existing conditions if certain conditions are met:
- The policy must be purchased within 14--21 days of the first trip payment (the most common window is 14 days; some providers extend to 21 days)
- The traveler must be medically able to travel at the time of purchase
- The full non-refundable trip cost must be insured (partial insurance of the trip voids the waiver)
- Failing any of these conditions eliminates the waiver, and claims related to the condition will be denied

**Without the waiver**, a traveler with hypertension who has a stroke abroad will likely face denial of medical emergency and evacuation claims if the stroke is attributed to the pre-existing condition. The insurer will review records.

**Stable condition definitions:** Some policies offer coverage for "stable" pre-existing conditions without a waiver. "Stable" typically means no change in medication, no new symptoms, no hospitalization, and no doctor visit for that condition within the look-back period. Read the exact policy definition -- "stable" varies significantly.

### Step 5: Evaluate Adventure Activity Coverage

Adventure activities are the most commonly misunderstood exclusion in travel insurance. Follow this exact evaluation approach:

**Step 5a:** List every planned activity explicitly -- not categories, specific activities. "Hiking" and "trekking at altitude" are different. "Swimming" and "scuba diving" are different. Specificity matters because exclusion schedules use specific language.

**Step 5b:** Cross-reference activities against the policy's exclusion schedule. Standard exclusions in most mid-tier travel policies include:
- Scuba diving below 30m (100 feet) -- recreational diving is usually covered to 30m; technical or deep diving requires a rider
- Mountaineering or climbing with ropes or fixed equipment
- Trekking above 4,000m or 5,000m (varies by policy -- always check altitude limit)
- Skiing or snowboarding outside marked trails (off-piste typically excluded unless specifically covered)
- Motorcycle or moped rental (many policies require the traveler to hold a valid motorcycle license at home; others exclude it entirely)
- Whitewater rafting above Grade III or IV
- Skydiving, bungee jumping, paragliding, hang gliding (some policies cover recreational paragliding, many do not)
- Competitive sports of any kind

**Step 5c:** For activities that are borderline or at the exclusion threshold, require written confirmation from the insurer before purchase -- not a phone agent's verbal assurance, written documentation. Claims adjusters operate on policy language, not what a sales agent said.

**Step 5d:** If the activity is uninsurable under standard travel policy (professional motorsport, mountaineering above 7,000m, BASE jumping), tell the user this clearly and note that specialist expedition insurance providers exist for extreme activities.

### Step 6: Audit Existing Coverage

Many travelers overpay for redundant coverage. Conduct a systematic audit before recommending additional purchase:

**Credit card travel benefits -- common by card tier:**
- Basic Visa/Mastercard (no annual fee): Typically no travel insurance benefits or minimal trip delay ($0--$300)
- Mid-tier cards ($95--$150 annual fee): Trip delay $500/person, lost/delayed baggage $1,000--$3,000, rental car CDW, possibly some cancellation coverage ($1,500--$5,000)
- Premium cards (Visa Infinite, World Elite Mastercard, $250--$695 annual fee): Trip cancellation $5,000--$10,000, trip interruption up to $10,000, medical emergency sometimes $1,000--$5,000 (usually inadequate), evacuation sometimes included
- Key gaps on ALL credit cards: Medical emergency above $5,000 is almost never covered adequately; evacuation is rarely covered; adventure activity coverage is almost always excluded

**National health system coverage abroad:**
- EU/EEA residents with EHIC/GHIC card: Emergency treatment at public facilities in EU/EEA countries at local resident rates -- this is NOT full coverage and does NOT cover medical evacuation or private hospitals
- UK travelers post-Brexit GHIC: Equivalent to EHIC for EU countries only
- Canadian provincial health: Extremely limited abroad -- typically $200--$400 CAD per day, which covers a fraction of international healthcare costs; NOT a substitute for travel medical coverage
- US Medicare: Does NOT cover care received outside the United States, with extremely narrow exceptions. US travelers relying on Medicare need full travel medical coverage.
- Australian Medicare: Does NOT cover international travel

**Employer and group coverage:** Some corporate travel policies cover business portions of a trip but NOT leisure days. Confirm exact coverage scope in writing before assuming it applies.

### Step 7: Apply the CFAR Decision Framework

Cancel for Any Reason (CFAR) coverage is the most expensive optional add-on and requires a specific decision framework:

**CFAR triggers automatic consideration when:**
- Total trip cost exceeds $3,000 per person
- The traveler explicitly mentions concern about canceling (health anxiety, family obligations, political situation, weather)
- The destination has elevated political risk or natural disaster history
- The trip is being booked far in advance (12+ months) when uncertainty is high
- The traveler has a health condition that is currently stable but could deteriorate

**CFAR economics:**
- CFAR typically adds 40--60% to the base policy premium
- Reimbursement is typically 50--75% of insured trip cost, NOT 100%
- CFAR must be purchased within 14--21 days of first trip payment (same window as pre-existing condition waiver)
- The trip must be canceled at least 48 hours before departure -- CFAR does not cover last-minute cancellations under 48 hours

**CFAR cost-benefit calculation:**
- Break-even point: If the probability of cancellation × trip cost × 75% reimbursement rate > CFAR premium cost, the expected value favors purchasing CFAR
- Example: $8,000 trip, 20% cancellation probability, 75% reimbursement = $1,200 expected value from CFAR. If CFAR costs $320 (40% of base $800 premium), it is clearly worthwhile.
- Practical guidance: CFAR is almost always worth considering for trips over $5,000 per person when cancellation risk is anything above minimal.

### Step 8: Produce the Structured Output

After completing all prior steps, generate the full evaluation output following the Output Format template below. Populate every field with trip-specific content -- never leave recommendations generic.

## Output Format

```
## Travel Insurance Evaluation: [Destination(s)] -- [N Days]

**Trip cost:** $[Total non-refundable] ([N] travelers, [ages])
**Travelers:** [N adults/children, age ranges]
**Key risk factors:** [List 3-5 specific, trip-relevant risks]
**Risk classification:** Medical [Low/Medium/High/Critical] | Financial [Low/Medium/High/Critical] | Activity [Standard/Elevated/High/Extreme] | Duration [Short/Standard/Extended/Long-term]

---

### Priority Coverage Profile

| Priority | Coverage Type          | Recommended Minimum          | Trip-Specific Justification                          |
|----------|------------------------|------------------------------|------------------------------------------------------|
| 1        | [Coverage type]        | $[Amount] per person         | [Specific reason tied to this trip's profile]        |
| 2        | [Coverage type]        | $[Amount] per person         | [Specific reason tied to this trip's profile]        |
| 3        | [Coverage type]        | $[Amount] per person         | [Specific reason tied to this trip's profile]        |
| 4        | [Coverage type]        | $[Amount] per person         | [Specific reason tied to this trip's profile]        |
| Optional | [Coverage type]        | [Percentage or amount]       | [When this becomes worth the extra cost]             |

---

### Coverage Comparison Template

Fill in the columns below with figures from each policy quote. Use "N/A" if not offered and "Rider" if available only as an add-on.

| Coverage Category          | Your Minimum     | Policy A     | Policy B     | Policy C     |
|----------------------------|------------------|--------------|--------------|--------------|
| Trip cancellation          | $[Amount]        | ______       | ______       | ______       |
| Trip interruption          | $[Amount]        | ______       | ______       | ______       |
| Medical emergency          | $[Amount]/person | ______       | ______       | ______       |
| Medical evacuation         | $[Amount]/person | ______       | ______       | ______       |
| Emergency reunion          | $[Amount]        | ______       | ______       | ______       |
| Accidental death (travel)  | $[Amount]        | ______       | ______       | ______       |
| Baggage loss               | $[Amount]/person | ______       | ______       | ______       |
| Baggage delay              | $[Amount]/day    | ______       | ______       | ______       |
| Travel delay trigger       | [X hours]        | ______       | ______       | ______       |
| Travel delay benefit       | $[Amount]/day    | ______       | ______       | ______       |
| [Activity] rider           | Required         | ______       | ______       | ______       |
| Cancel for any reason      | [Optional/Yes]   | ______       | ______       | ______       |
| Pre-existing condition wvr | [Yes/No needed]  | ______       | ______       | ______       |
| Deductible (medical)       | Under $[Amount]  | ______       | ______       | ______       |
| **Total Premium**          | --               | ______       | ______       | ______       |
| **Premium as % of trip**   | --               | ______       | ______       | ______       |

**What to look for when comparing:** A reasonable travel insurance premium for a standard international trip is 4--8% of total trip cost. Adventure travel or travelers over 65 should expect 8--12%. Anything under 3% of trip cost warrants scrutiny -- review the coverage limits closely.

---

### Key Policy Clauses Decoded

**1. [Clause Name]**
- **Plain-language meaning:** [What this actually means to the policyholder in clear terms]
- **What triggers a valid claim:** [Specific conditions that must be met for a payout]
- **Common exclusions under this clause:** [What is explicitly carved out]
- **Typical limit range:** [Industry-standard amounts to expect]
- **Red flag to watch for:** [Specific fine print issue common in this clause type]

**2. [Clause Name]**
[Same structure as above]

**3. [Clause Name]**
[Same structure as above]

**4. [Clause Name -- add only if highly relevant to this trip profile]**
[Same structure as above]

---

### Existing Coverage Gap Analysis

| Coverage Type          | Existing Coverage Source      | Existing Limit          | Gap                          | Recommended Action         |
|------------------------|-------------------------------|-------------------------|------------------------------|----------------------------|
| Trip cancellation      | [Credit card / None / Employer] | $[Amount or None]     | $[Shortfall or Full Gap]     | [Purchase / Top Up / Verify] |
| Medical emergency      | [Credit card / National health] | $[Amount or None]     | $[Shortfall or Full Gap]     | [Action]                   |
| Medical evacuation     | [Credit card / None]           | $[Amount or None]      | $[Shortfall or Full Gap]     | [Action]                   |
| Baggage loss           | [Credit card / None]           | $[Amount or None]      | $[Shortfall or Full Gap]     | [Action]                   |
| Travel delay           | [Credit card / None]           | $[Amount or None]      | $[Shortfall or Full Gap]     | [Action]                   |
| Adventure activities   | [Not covered anywhere]         | None                   | Full gap                     | Rider required             |

---

### CFAR Analysis (if applicable)

- **Trip cost insured:** $[Amount]
- **Estimated CFAR add-on cost:** ~40-60% above base premium, approximately $[Estimated dollar range]
- **Reimbursement rate:** 50-75% of insured trip cost = $[Dollar range]
- **Verdict:** [Purchase recommended / Consider if cancellation concern is above minimal / Not recommended at current trip cost]
- **Purchase deadline:** Must be purchased within [14/21] days of first trip payment on [Estimated deadline date if first payment date known]

---

### Pre-Existing Condition Waiver Checklist (if applicable)

- [ ] Identify the look-back period in the policy: [60/90/180/365] days
- [ ] Confirm the waiver purchase window: [14/21] days from first trip payment
- [ ] First trip payment date: [Date, if known]
- [ ] Waiver purchase deadline: [Calculated date]
- [ ] Confirm 100% of non-refundable trip cost is insured (partial coverage voids waiver)
- [ ] Confirm the traveler is medically able to travel as of the policy purchase date
- [ ] Request written confirmation from the insurer that the specific condition is covered under the waiver

---

### Purchase Checklist

**Critical verifications before purchasing:**
- [ ] Confirm all destination countries are explicitly listed as covered territories in the policy
- [ ] Verify [specific adventure activity] is covered -- in writing, not verbal confirmation
- [ ] Confirm medical evacuation limit is at least $[Recommended amount]
- [ ] Confirm trip cancellation limit equals or exceeds total non-refundable cost of $[Amount]
- [ ] Read the covered reasons list for trip cancellation -- confirm the most likely cancellation scenario for this trip is included
- [ ] Verify the medical deductible is acceptable ($[Amount])
- [ ] Confirm the policy's 24-hour emergency assistance number is staffed with coordination services, not just a message line
- [ ] Confirm the policy start date is on or before the departure date
- [ ] Check whether the policy covers trip costs already paid before the policy purchase date

**After purchasing:**
- [ ] Save the policy number, group number (if applicable), and 24-hour emergency line in your phone
- [ ] Email yourself and a trusted contact at home a copy of the declarations page
- [ ] Carry a printed policy summary with emergency contact information on the trip
- [ ] Note any documentation requirements for claims (receipts, medical records, police reports)

---

### Questions to Ask Before Purchasing

1. [Trip-specific activity question: "Does this policy cover [activity] at [specific conditions]?"]
2. What is the exact claims process for a medical emergency abroad -- do I pay first and get reimbursed, or do you pay the provider directly?
3. Is there a network of pre-approved hospitals at my destination, and am I required to use them?
4. What documentation is required to file a trip cancellation claim?
5. How are pre-existing conditions defined under this policy, and what is the look-back period?
6. Is the 24-hour assistance line staffed by medical professionals who can coordinate evacuation?
7. [Any additional trip-specific question based on the profile]
```

## Rules

1. **Never recommend a specific insurance product or provider by name.** The evaluation framework exists to help users compare options independently. Provider recommendations constitute financial advice and may also be outdated. Use generic terms: "comprehensive policy," "a policy with CFAR," "insurer," "policy provider."

2. **Medical evacuation must always be treated as a separate, critical coverage item -- never buried.** Many users focus on trip cancellation and overlook evacuation. A $500,000 evacuation from a remote destination is entirely realistic. Always surface this coverage prominently with a destination-appropriate minimum.

3. **Never conflate medical emergency coverage with medical evacuation coverage.** These are separate coverage lines with separate limits. A policy with $500,000 medical emergency and $50,000 evacuation is dangerously underinsured on evacuation. Treat them as independent items in every comparison.

4. **Pre-existing condition waiver timing is a hard deadline -- not a suggestion.** If the user has any relevant medical history, flag the waiver purchase window (typically 14 days from first trip payment) prominently and early. Missing this window by even one day eliminates the waiver permanently for that trip.

5. **Adventure activity coverage must be confirmed for the specific activity at specific conditions.** "Hiking" being covered does not mean "trekking at 4,500m" is covered. Altitude limits, depth limits, and equipment specifications are real exclusion triggers. Always require specificity, and always recommend written confirmation for borderline activities.

6. **Trip cancellation coverage must be set to 100% of non-refundable trip costs -- never less.** A policy with a $5,000 cancellation cap on a $7,200 non-refundable trip leaves $2,200 exposed. Always calculate the actual non-refundable amount and flag coverage gaps.

7. **Do not assume credit card travel benefits are adequate for any international trip.** Even premium credit card travel coverage almost universally falls short on medical emergency and medical evacuation. Audit credit card benefits carefully and present them as a partial gap fill, never as a substitute for a dedicated policy.

8. **Premium as a percentage of trip cost is a useful sanity check, not a decision rule.** Standard international trip insurance costs 4--8% of trip cost. Adventure travel, older travelers, and high-cost destinations push this to 8--12%. A premium significantly below 4% warrants scrutiny of coverage limits. But a high premium does not by itself mean better coverage -- always compare limits.

9. **CFAR is not a replacement for understanding the standard covered-reasons list.** Always decode what the standard cancellation clause covers before recommending CFAR. Many users pay for CFAR when their most likely cancellation reason (illness, injury, death of family member) is already a standard covered reason. CFAR is additive, not a replacement for understanding base coverage.

10. **Never state or imply that a specific scenario will definitely be covered.** Policy language governs claims. Coverage depends on the exact policy wording, the circumstances of the claim, and the adjuster's interpretation. Always frame coverage explanations as "policies with this clause generally cover..." or "a standard trip interruption clause would typically apply to..." -- never as guarantees.

11. **Always flag the 48-hour CFAR cancellation rule.** CFAR does not cover cancellations made less than 48 hours before departure. A traveler who gets ill the day before departure will typically fall under the medical cancellation clause, not CFAR. This distinction matters.

12. **For trips over 30 days, flag that standard trip policies may not be available and different product types are required.** Long-stay travel medical insurance, backpacker policies, or expatriate health policies have different coverage structures. Do not apply single-trip insurance logic to extended travel.

## Edge Cases

### Traveler With an Actively Managed Pre-Existing Condition

A traveler currently taking medication for hypertension, diabetes, COPD, or a cardiac condition faces the most complex insurance evaluation scenario. Address it with this framework:

First, determine the look-back period of any candidate policy (60, 90, 180, or 365 days). A condition is typically considered "pre-existing" if the traveler received treatment, had medication changed, experienced new symptoms, or sought medical advice for it during that window. A stable, unchanged prescription still counts as "active management" under most policy definitions -- the condition exists even if controlled.

Second, calculate the waiver purchase deadline. If the user has already made a trip payment, determine whether the 14-21 day window has passed. If it has passed, the waiver is no longer available for any policy, and claims related to the condition face denial risk. Be explicit about this.

Third, if the waiver is still available, emphasize that the entire non-refundable trip cost must be insured -- not just flights, not just part of the cost. Partial insuring of the trip voids the waiver on most policies.

Fourth, note that the waiver covers the pre-existing condition for medical, cancellation, and interruption claims -- but only if the claim is related to the covered condition. An unrelated emergency (broken leg from a fall) is covered under standard terms regardless of pre-existing conditions.

Finally, recommend that the traveler obtain a statement from their treating physician confirming they are medically fit to travel as of the policy purchase date. This documentation protects against a later claim denial on the grounds that they were not fit to travel at the time of purchase.

### Multi-Destination or Round-the-World Itinerary

When a trip includes five or more countries or spans multiple continents, the standard "destination" evaluation approach breaks down. Apply these additional checks:

Every country on the itinerary must be explicitly listed as a covered territory. Some policies exclude specific countries entirely due to travel advisories or sanctions (North Korea, certain conflict zones, and countries under Level 4 US State Department advisories are commonly excluded). A policy purchased for "Europe" may not cover a short side trip to Morocco.

The policy premium is typically based on the highest-risk destination in the itinerary. A trip that includes even one week in the United States requires US-grade medical coverage ($500,000+) for the entire policy period, not just for the US portion.

For round-the-world trips, look for "open jaw" or multi-destination policy structures. Some insurers offer these explicitly; others require destination-specific policies that must be coordinated to avoid gaps between policy end dates and the next policy start date.

For trips that cross a 30-day policy limit, segment the trip into policy periods and ensure there is no gap between periods. Some annual multi-trip policies cover each individual trip up to 30, 45, or 60 days -- confirm the per-trip duration limit matches the longest individual leg.

### Cruise Travel

Cruises have a unique insurance profile because the ship is the primary medical provider, shore excursions happen in multiple countries, and the cancellation penalty schedule is front-loaded and severe.

Cruise line cancellation penalties typically follow this structure: cancellation more than 90 days out loses only the deposit (typically 20-25% of cruise cost); 89-60 days out loses 50%; 59-30 days out loses 75%; under 30 days loses 100%. This means the financial exposure spikes sharply in the final 90 days -- travelers who book 12 months out have limited financial risk initially but must insure by the time the 90-day window closes.

Medical evacuation from a ship at sea is categorically different from land evacuation. A Coast Guard or helicopter evacuation from international waters can cost $100,000--$500,000. The ship's onboard medical center charges private rates -- a single overnight in the ship's infirmary can cost $3,000--$5,000. Ship medical facilities are equipped for stabilization, not for managing complex conditions. Evacuation to a port with a hospital is almost always required for serious illness.

Many cruisers assume the cruise line's own insurance product is the best option. Cruise line policies are typically competitive on cancellation (they know their own penalty schedule) but weak on medical emergency and evacuation. A standalone policy with strong medical and evacuation components is typically superior on those coverage lines.

Shore excursions through the cruise line are generally covered by the ship's liability for incidents on excursions they operate. Independent shore excursions booked outside the cruise line are not -- they carry standard destination risk and must be evaluated like any land travel.

### Domestic US Trip for a US Resident With Health Insurance

This is a case where significant existing coverage exists and additional insurance is only justified for specific gaps:

Domestic health insurance covers medical emergencies in the US (with possible out-of-network complications). A US traveler with comprehensive domestic health insurance does not need travel medical emergency coverage for US travel -- instead, they should verify out-of-network benefits if traveling to a region where their plan has limited network.

The genuine insurance needs for a domestic trip are: trip cancellation and interruption (if significant non-refundable costs exist), travel delay (if the itinerary is tight or weather risk is high), and baggage loss (if checking bags with valuable contents). Medical evacuation is not relevant if the traveler is within the US and has domestic health coverage.

Recommend evaluating whether credit card benefits cover trip delay and baggage adequately -- for a domestic trip with minimal non-refundable costs, credit card coverage plus domestic health insurance may be genuinely sufficient, making a separate policy unnecessary.

### Last-Minute Policy Purchase (After the 14-Day Window)

When a user asks about travel insurance within a few days of departure or weeks after making initial trip payments, they have missed the pre-existing condition waiver window and the CFAR purchase window. Address this directly:

The policy is still worth purchasing for medical emergency, medical evacuation, and baggage coverage -- these benefits are not time-sensitive relative to purchase date. A policy purchased one day before departure still provides full medical and evacuation coverage from the departure date.

However, trip cancellation coverage purchased within 24--72 hours of departure provides limited value for cancellation, since the cancellation risk window has largely passed. The main residual value is post-departure trip interruption.

Be transparent about what is no longer available: CFAR cannot be added. Pre-existing condition waiver cannot be added. Some policies have a "cancel for work reasons" clause that also requires early purchase. None of these can be retroactively obtained.

Recommend that the user still obtain quotes -- the medical and evacuation coverage alone justifies the premium for most international trips, even without the time-sensitive add-ons.

### Traveler Going to a Destination Under a Government Travel Advisory

This is one of the most common sources of claim denial surprise. When a government travel advisory (US State Department Level 3 or 4, UK FCDO "advise against all travel," or equivalent) is in place before the policy is purchased, most policies exclude:
- Trip cancellation due to the advisory itself (it was a known risk at purchase)
- Claims arising from the specific circumstances that generated the advisory (civil unrest, terrorism)
- Any claims in a region under a "do not travel" designation

Key nuance: if the travel advisory is issued AFTER the policy is purchased, it typically qualifies as a covered reason for cancellation (it became an unforeseen event). This is why purchasing insurance early -- immediately after the first trip payment -- matters for political risk situations.

Travelers planning trips to regions with any advisory level should review the terrorism and political instability coverage separately. Some policies include "cancel due to travel advisory issued after purchase" as a standard covered reason; others require a political risk or cancel-for-any-reason rider.

### Annual Multi-Trip Policy vs. Single-Trip Policy

Frequent travelers often overlook the annual multi-trip policy option. Apply this comparison when the user travels 3 or more times per year internationally:

Annual policies typically cover each trip for a maximum of 30, 45, or 60 days per trip (policy-specific). They cover an unlimited number of trips within a 12-month period for a single annual premium that is usually equivalent to 2-3 single-trip policies.

Annual policies are typically better for: travelers taking 4+ international trips per year, business travelers with regular international travel, and travelers who take short international trips that feel too minor to insure individually.

Annual policies are typically worse for: a single long trip that exceeds the per-trip day limit, trips with significant pre-paid non-refundable costs that require high cancellation limits (annual policies often cap cancellation at $2,500--$5,000 per trip, not per year), and trips to very high-risk destinations that require specialized coverage.

When recommending an annual policy, always verify the per-trip duration limit and the per-trip cancellation limit -- these are the two features where annual policies most commonly fall short relative to a trip-specific policy.

## Example

**Input:** "We're taking a 12-day trip to Japan -- two adults, ages 58 and 61. Total non-refundable costs are about $9,800 (business class flights, ryokan stays, and a food tour package). My husband had a minor cardiac event 8 months ago -- he's been stable on medication since then. We're wondering if we need travel insurance and how much it should cost. We have a premium Visa Infinite card."

---

## Travel Insurance Evaluation: Japan -- 12 Days

**Trip cost:** $9,800 non-refundable (2 travelers, ages 58 and 61)
**Travelers:** 2 adults; husband has documented cardiac history (cardiac event 8 months ago, currently managed with medication)
**Key risk factors:** High healthcare cost destination (Japan is among the 5 most expensive healthcare systems globally for uninsured foreign visitors), pre-existing cardiac condition, significant non-refundable trip cost, traveler age over 60
**Risk classification:** Medical HIGH | Financial CRITICAL | Activity STANDARD | Duration SHORT

---

### Priority Coverage Profile

| Priority | Coverage Type                  | Recommended Minimum              | Trip-Specific Justification                                                                                          |
|----------|--------------------------------|----------------------------------|----------------------------------------------------------------------------------------------------------------------|
| 1        | Medical emergency              | $200,000 per person              | Japan has no universal access for foreign visitors; a 3-day cardiac ICU admission in Tokyo can exceed $50,000 USD    |
| 2        | Medical evacuation             | $500,000 per person              | Medical repatriation from Japan to the US or Canada is a 13-14 hour flight; air ambulance costs $150,000--$350,000  |
| 3        | Trip cancellation              | $9,800 (full trip cost)          | Business class flights and ryokan reservations are typically non-refundable or carry 90-100% cancellation penalties  |
| 4        | Trip interruption              | $14,700 (150% of trip cost)      | If your husband requires hospitalization mid-trip, interruption covers last-minute one-way business class home        |
| 5        | Pre-existing condition waiver  | CRITICAL -- see section below    | Without waiver, any cardiac-related claim will be denied; this is the single most important purchase decision         |
| Optional | Cancel for any reason (CFAR)   | 75% of $9,800 = up to $7,350 back | At $9,800 trip cost and a traveler with cardiac history, CFAR is strongly worth considering; see CFAR analysis below |

---

### Coverage Comparison Template

Fill in the columns below with figures from each policy quote. Use "N/A" if not offered and "Rider" if available only as an add-on.

| Coverage Category          | Your Minimum          | Policy A     | Policy B     | Policy C     |
|----------------------------|-----------------------|--------------|--------------|--------------|
| Trip cancellation          | $9,800                | ______       | ______       | ______       |
| Trip interruption          | $14,700               | ______       | ______       | ______       |
| Medical emergency          | $200,000/person       | ______       | ______       | ______       |
| Medical evacuation         | $500,000/person       | ______       | ______       | ______       |
| Emergency reunion          | $25,000               | ______       | ______       | ______       |
| Accidental death (travel)  | $50,000               | ______       | ______       | ______       |
| Baggage loss               | $2,000/person         | ______       | ______       | ______       |
| Baggage delay              | $200/day              | ______       | ______       | ______       |
| Travel delay trigger       | 3--6 hours            | ______       | ______       | ______       |
| Travel delay benefit       | $200/day per person   | ______       | ______       | ______       |
| Pre-existing condition wvr | YES -- required       | ______       | ______       | ______       |
| Cancel for any reason      | Recommended           | ______       | ______       | ______       |
| Deductible (medical)       | Under $250            | ______       | ______       | ______       |
| **Total Premium**          | --                    | ______       | ______       | ______       |
| **Premium as % of trip**   | 8--12% = $784--$1,176 | ______       | ______       | ______       |

**Premium benchmark:** Expect 8--12% of trip cost for this profile (two travelers, one over 60 with cardiac history, Japan destination, CFAR included). Total premium should fall between $784 and $1,176 for a competitive comprehensive policy. Quotes significantly below $700 should be reviewed carefully for coverage limits.

---

### Key Policy Clauses Decoded

**1. Pre-Existing Condition Exclusion and Waiver**
- **Plain-language meaning:** Without a waiver, if your husband has any medical claim that an adjuster determines is related to his cardiac history -- including a new cardiac event, a medication interaction, or even a chest-pain ER visit that turns out to be unrelated -- the insurer will review his medical records, identify the prior cardiac event, and may deny the claim on the grounds that the condition was "pre-existing."
- **What triggers a valid claim (with waiver):** The waiver must be purchased within 14--21 days of your first trip payment. Since you presumably paid for flights and hotel some time ago, determine your first payment date immediately -- the waiver window may still be open, but it closes fast.
- **Common exclusions under this clause:** Even with a waiver, coverage applies only to sudden, unexpected medical events. Routine prescription refills abroad, elective procedures, and treatment the traveler knew they would likely need before departure are excluded. The waiver also requires that the full trip cost ($9,800) is insured -- partial coverage of only the hotels or only the flights voids it.
- **Typical limit:** The waiver itself is not a coverage limit -- it removes the exclusion. Coverage is then subject to normal medical emergency and evacuation limits.
- **Red flag:** Look-back periods vary dramatically: 60 days, 90 days, 180 days, or 365 days. Your husband's cardiac event was 8 months ago. A policy with a 180-day look-back would NOT consider it pre-existing (8 months = ~240 days, outside the window). A policy with a 365-day look-back WOULD consider it pre-existing. Read this carefully in every policy -- it may be the determining factor in which policy you choose.

**2. Medical Emergency Coverage -- What Happens Abroad**
- **Plain-language meaning:** This covers the cost of emergency medical treatment received at hospitals, clinics, and urgent care facilities while abroad -- doctor fees, surgery, hospitalization, diagnostic tests, and prescription medications required for the emergency. In Japan, this must be paid at the time of service or arranged through the insurer's direct-pay program.
- **What triggers a valid claim:** An unexpected illness or injury that requires medical treatment while traveling. "Emergency" is typically defined as a condition that would cause permanent harm or death without immediate treatment -- not routine care for a stable condition.
- **Common exclusions:** Treatment for a pre-existing condition (without waiver), dental care beyond emergency pain relief, treatment the traveler sought for elective or cosmetic purposes, care received after the policy expiration date.
- **Typical limit range:** $50,000--$500,000 per person for standard policies; $200,000--$500,000 recommended for Japan. Many low-cost policies cap at $50,000 -- inadequate for Japan.
- **Red flag:** Some policies require the insurer's pre-authorization for any treatment above a threshold ($1,000--$5,000). In a true emergency, call the insurer's 24-hour line before or as soon as possible after treatment begins -- failure to notify may result in reduced benefits.

**3. Trip Cancellation -- Covered Reasons**
- **Plain-language meaning:** If you cannot take the trip and cancel before departure, this reimburses your non-refundable pre-paid costs. The critical detail: it only covers cancellation for reasons specifically listed in the policy -- the covered reasons list is usually 10--20 specific scenarios.
- **What triggers a valid claim:** For this trip profile, the most relevant covered reasons are: a treating physician certifies that your husband (or you) is medically unfit to travel, a family member at home suffers a serious illness or death requiring your presence, or a natural disaster renders your destination uninhabitable.
- **Common exclusions:** Work obligations, change of mind, fear of flying, financial hardship (unless covered separately), government travel advisories issued before policy purchase, pre-existing conditions (without waiver).
- **Typical limit range:** Must match or exceed the non-refundable trip cost. Read the policy limit carefully -- some policies cap at a per-person or aggregate limit that may not cover business-class flights plus hotel for two.
- **Red flag:** Some policies require that the cancellation reason is the direct cause -- if your husband's doctor recommends cancellation as a "precaution" rather than declaring him medically unfit to travel, the claim may be disputed. Confirm what documentation is required for a physician-recommended cancellation.

**4. Medical Evacuation and Repatriation**
- **Plain-language meaning:** If your husband suffers a serious cardiac event in Japan and requires transport to a hospital with higher-level cardiac care, or needs to be flown home for treatment, this benefit covers the cost of that transport -- including an air ambulance, medical escort, and any required equipment.
- **What triggers a valid claim:** A physician at the treating hospital must declare that adequate care is not available locally and that transport is medically necessary. The insurer's assistance team typically coordinates the evacuation -- you should NOT arrange evacuation independently without contacting the insurer first, as self-arranged evacuations may not be reimbursed.
- **Common exclusions:** Evacuations arranged without insurer authorization, transport for non-emergency "convenience" (wanting to recover at home when local care is adequate), repatriation of remains (sometimes a separate coverage line -- verify this is included).
- **Typical limit range:** $50,000--$1,000,000. For Japan, $500,000 is the recommended minimum. Tokyo has excellent cardiac care, but if your husband needs a specialized intervention not available locally or wants to recover in his home country, a medical flight from Tokyo costs $150,000--$350,000 depending on configuration and medical personnel required.
- **Red flag:** Policies that bundle medical emergency and evacuation into a single combined limit are problematic -- if $100,000 is used for hospitalization, only $100,000 remains for evacuation in a combined $200,000 policy. Look for policies with separate, independent limits for each coverage type.

---

### Existing Coverage Gap Analysis

| Coverage Type          | Existing Coverage Source       | Existing Limit               | Gap                              | Recommended Action                     |
|------------------------|--------------------------------|------------------------------|----------------------------------|----------------------------------------|
| Trip cancellation      | Visa Infinite card             | $2,000--$5,000 typical       | $4,800--$7,800 gap on $9,800 trip | Purchase supplemental; credit card alone is insufficient |
| Medical emergency      | Visa Infinite card             | $1,000--$5,000 (typically)   | $195,000--$199,000 gap           | Full purchase required; credit card medical is negligible |
| Medical evacuation     | Visa Infinite card             | Not typically included        | Full gap: $500,000 needed        | Full purchase required                 |
| Baggage loss           | Visa Infinite card             | $1,500--$3,000                | Likely adequate for standard bags | Verify card limit; adequate if not carrying valuables |
| Travel delay           | Visa Infinite card             | $500/person typical          | Likely adequate for short delays | Verify per-incident cap                |
| Pre-existing condition | Visa Infinite card             | Not covered                  | Full gap                        | Requires dedicated travel policy with waiver |
| Trip interruption      | Visa Infinite card             | $2,000--$5,000 typical       | Significant gap on $14,700 target | Purchase supplemental                  |

**Important note on Visa Infinite medical coverage:** Premium credit card medical benefits are frequently misunderstood. While Visa Infinite cards often include trip-interruption and delay coverage at meaningful levels, the medical emergency limit is typically $1,000--$5,000 -- designed for a minor clinic visit, not
