---
name: relocate-to-new-city
description: |
  Guides the user through relocating to a new city from neighborhood research
  through settling in, chaining destination comparison, budgeting, job search,
  moving logistics, and home evaluation skills across multiple categories.
  Use when the user is moving to a new city, relocating for work, or planning
  a geographic move to an unfamiliar area.
  Do NOT use for international immigration processes, military relocations
  with assigned housing, or temporary travel stays.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "planning checklist step-by-step guide"
  category: "life-event"
  depends: "destination-comparison budget-planning job-search-strategy moving-checklist home-safety-inspection project-kickoff"
  disclaimer: "none"
  difficulty: "intermediate"
---

# Relocate to a New City

**Estimated time:** 1-3 months (depending on whether a job is secured first and housing market speed)

**Geographic variation note:** Steps 1, 3, and 5 vary significantly by location. Cost of living, job markets, housing availability, lease terms, and local regulations differ across cities, states, and countries. Research your target city's specific conditions before making commitments.

## When to Use

- User is moving to a new city for work, personal reasons, or lifestyle change
- User needs a structured plan to coordinate the research, financial, career, and logistical aspects of relocation
- User wants to avoid common relocation mistakes (signing a lease without visiting, underestimating cost of living)
- Do NOT use when: relocating internationally (visa and immigration add significant complexity), moving within the same city, or planning a temporary stay under 6 months

## Prerequisites

Before starting this workflow, ensure:

1. Reason for relocation identified (job offer, job search, lifestyle, family, education)
2. Timeline established (firm start date vs. flexible)
3. Current housing situation understood (lease end date, home to sell, month-to-month)
4. Whether relocating solo or with family/partner

## Steps

**Step 1: Research and Compare Neighborhoods** (uses: destination-comparison)

Evaluate neighborhoods in the target city based on cost of living, commute, safety, amenities, and lifestyle fit. This step prevents the most common relocation mistake: choosing a neighborhood based on one factor (price or proximity to work) and discovering it fails on others.

- Input: Target city, workplace location (if known), lifestyle priorities (walkability, schools, nightlife, outdoor access, public transit), budget range for housing
- Output: Ranked neighborhood comparison matrix with scores on cost, commute, safety, amenities, and lifestyle fit. Top 3 neighborhoods identified with specific reasons for each.
- Key focus: Use multiple data sources (cost of living calculators, transit maps, crime statistics, school ratings if applicable). If possible, visit the top 3 neighborhoods in person at different times of day. Check commute times during actual rush hour, not just map estimates. Factor in parking costs, transit passes, and grocery proximity.

**Step 2: Build the Relocation Budget** (uses: budget-planning)

Create a comprehensive relocation budget that covers one-time moving costs, cost-of-living adjustments, and the financial transition period. This step reveals whether the move is financially viable and identifies gaps to address before committing.

- Input: Current income and expenses, target city cost of living data from Step 1, moving distance, housing deposit requirements, income changes (new salary, job search period)
- Output: One-time moving cost estimate, monthly budget for the new city, cost-of-living comparison (current vs. target), financial gap analysis, savings needed before moving
- Key focus: Include hidden costs: security deposit (often first + last month + deposit = 3 months rent), utility connection fees, moving company or truck rental, temporary housing if needed, replacing items that cannot be moved. If income will change, model the transition: how many months of expenses can you cover without income?

**Step 3: Secure Employment** (uses: job-search-strategy)

Execute a targeted job search in the new city, or formalize a remote work arrangement with your current employer. This step is critical if income continuity depends on employment at the destination.

- Input: Current employment status, industry, skills, target salary (adjusted for new city cost of living from Step 2), timeline
- Output: Job search plan targeting the new city, list of applications submitted, interview schedule, or remote work agreement documentation
- Key focus: If relocating without a job, secure employment before signing a lease if possible. When applying remotely, address relocation directly in the cover letter (state you are relocating to the city on a specific date, not that you "would consider relocating"). Use the target city address on applications if you have one (friend, family, mail service). Research the local job market: some industries cluster in specific neighborhoods, which feeds back into Step 1.

**Step 4: Execute the Physical Move** (uses: moving-checklist)

Plan and execute the logistics of moving belongings, terminating current housing, and transporting to the new city. This step coordinates the dozens of logistical details that make or break a smooth move.

- Input: Move date, inventory of belongings, moving distance, budget allocation from Step 2, current lease termination requirements
- Output: Complete moving timeline (4 weeks before through 1 week after), packing plan by room, moving company quotes or truck rental reservation, utility disconnection and connection schedules, address change list
- Key focus: Get 3 moving quotes minimum if hiring movers. Book 4-6 weeks in advance for peak season (May-September). Notify current landlord per lease requirements (typically 30-60 days). Transfer or cancel local memberships, subscriptions, and services. Forward mail, update address with banks, insurance, employer, and government agencies.

**Step 5: Evaluate the New Home** (uses: home-safety-inspection)

Inspect the new rental or purchased home for safety, functionality, and condition before or immediately after move-in. This step protects against inheriting problems and establishes the baseline condition for your tenancy.

- Input: New home access (virtual tour, in-person visit, or move-in day), inspection checklist, lease terms regarding move-in condition documentation
- Output: Condition report with photos (for rental deposit protection), safety verification (smoke detectors, locks, water temperature, electrical), maintenance items to request from landlord, immediate purchase list for safety items
- Key focus: Document everything with photos and timestamps on move-in day for rental deposit protection. Test all appliances, faucets, and electrical outlets. Verify smoke detectors and CO detectors are present and functional. Check water pressure, water heater temperature, and HVAC operation. Report any pre-existing damage to the landlord in writing within 48 hours.

**Step 6: Coordinate the Settling-In Process** (uses: project-kickoff)

Apply project coordination to the post-move settling-in period: establishing local services, building a routine, and integrating into the community. This step accelerates the transition from "moved" to "settled."

- Input: New home location, family needs (schools, healthcare, childcare), daily routine requirements (commute, shopping, fitness), social interests
- Output: Local services setup checklist (doctor, dentist, vet, mechanic, grocery, pharmacy), community integration plan (neighborhood groups, social activities, professional networking), 30-60-90 day settling-in timeline
- Key focus: Register with a primary care physician, dentist, and any specialists within the first month. Transfer prescriptions to a local pharmacy. If school-age children, enroll in schools and connect with parent networks. Find the daily essentials first: nearest grocery, pharmacy, gas station, urgent care. Join one local group or activity within the first month to begin building social connections.

## Decision Points

- **Before Step 1:** If relocating with a job offer in hand, Step 3 (job search) becomes "negotiate relocation assistance" instead. Many employers offer relocation packages that significantly reduce Step 2 costs.
- **After Step 1:** If cost of living in the target city exceeds current expenses by more than 25%, revisit whether the salary adjustment (or expected salary in the new market) closes the gap. If not, consider surrounding suburbs or adjacent cities.
- **After Step 2:** If the financial gap analysis shows a shortfall, three options: (a) delay the move to build more savings, (b) reduce housing budget and accept a longer commute, (c) secure employment first (Step 3) before committing to the move.
- **After Step 3:** If job search is unsuccessful after 60 days of active searching, reassess: is the industry strong in the target city? Would expanding the search radius to include remote positions help? Consider whether the move timeline needs to flex.
- **After Step 4:** If moving solo vs. with family, the settling-in priorities in Step 6 differ significantly. Solo relocators should prioritize social connections. Family relocators should prioritize schools and pediatricians.

## Failure Handling

- **Step 1 fails (cannot visit target neighborhoods):** Use virtual tools (street view, online reviews, local subreddits, remote video tours) but lower confidence in the assessment. Consider renting month-to-month initially so you can relocate within the city after arriving and experiencing neighborhoods firsthand.
- **Step 2 fails (cost of living makes the move unaffordable):** This is a critical stop point. Do not relocate into financial hardship. Either increase income (negotiate salary, add income sources) or adjust the target (different neighborhoods, different city, delay until savings meet the threshold).
- **Step 3 fails (job not secured before planned move date):** If savings cover 3+ months of expenses in the new city, the move can proceed with continued job search. If not, delay the move until employment is secured or savings reach the threshold. A move without income or savings is the single highest risk in relocation.
- **Step 4 fails (moving logistics disrupted):** Common failures: movers cancel, truck breaks down, closing/lease start delays. Have a contingency: temporary housing (extended-stay hotel, Airbnb) for up to 1 week, essential items in personal vehicle (not on the moving truck), and cash reserve for unexpected costs.
- **Step 5 fails (new home has significant issues):** If renting and issues are discovered on move-in, document and submit maintenance requests immediately. If issues are health or safety critical (no heat, mold, electrical hazards), contact the landlord in writing and reference local tenant rights if repairs are not made promptly.
- **Direction change (relocation canceled or postponed):** If you have not signed a lease or accepted a job offer, the main sunk cost is research time. If you have signed a lease, review the early termination clause or subletting options.

## Output Format

```
RELOCATION TRACKER
===================

Origin: ________________  Target: ________________
Move Date: ____________  Weeks Remaining: ______

Phase 1: Research
  [ ] Step 1: Neighborhoods researched
      - Top choice: ________________ (score: __/10)
      - Runner-up: ________________ (score: __/10)
      - In-person visit: [ ] completed

Phase 2: Financial and Career
  [ ] Step 2: Relocation budget complete
      - One-time moving costs: $______
      - Monthly cost-of-living change: +/-$______
      - Savings buffer: $______ (covers ___ months)
  [ ] Step 3: Employment secured
      - Status: [ ] job offer / [ ] remote confirmed / [ ] searching
      - Relocation assistance: $______
      - Start date: ______

Phase 3: Execute and Settle
  [ ] Step 4: Move complete
      - Movers booked: [ ]
      - Current lease notice: [ ] given
      - Utilities transferred: [ ]
      - Address changed: [ ]
  [ ] Step 5: New home inspected
      - Condition report: [ ] submitted
      - Safety check: [ ] passed
      - Maintenance requests: [ ] filed
  [ ] Step 6: Settled in
      - Local services (doctor, dentist, pharmacy): [ ] found
      - Social connection: [ ] joined 1+ group
      - Routine established: [ ]

Status: [RESEARCHING / PLANNING / MOVING / SETTLING / COMPLETE]
```

## Edge Cases

- **Relocating with school-age children:** Step 1 must weight school quality heavily. School enrollment often has deadlines and geographic boundaries. Research school registration requirements and timing before finalizing the neighborhood choice.
- **Relocating with pets:** Step 5 must verify pet policies at the new home (breed restrictions, weight limits, pet deposits). Interstate moves may require updated veterinary records and health certificates. Add pet-specific items to the moving checklist in Step 4.
- **Relocating without visiting first:** Higher risk. Use virtual tours, online reviews, and local contacts for Step 1 research. Consider a short-term (month-to-month) lease initially, then relocate within the city after experiencing neighborhoods firsthand.
- **Relocating for a partner's job (trailing spouse):** Step 3 job search is the critical challenge. Research the target city's job market for your field specifically. Some cities have strong industries in certain sectors and weak ones in others. Networking before the move can accelerate the search.
- **Downsizing during relocation:** Step 4 adds a decluttering phase before packing. Moving fewer items reduces costs significantly. Sell, donate, or discard items that cost more to move than to replace.
- **Relocating from a high cost-of-living to low cost-of-living area:** Step 2 may reveal significant savings. However, salary adjustments in the new area may offset the advantage. Model both income and expenses in the target city before assuming a financial improvement.

## Expected Outcome

When this workflow is complete, the user will have:

1. A well-researched neighborhood selection based on data, not assumptions
2. A realistic relocation budget with no financial surprises
3. Employment secured (or confirmed remote) in the new city
4. A smooth physical move with all logistics coordinated
5. A safe, documented new home ready for daily life
6. Local services established and a plan for community integration within the first 90 days


### Timeline Considerations

This workflow is designed to be completed sequentially, but experienced users may parallelize some steps. Key dependencies:

- Each step builds on outputs from previous steps
- Steps involving external parties may have variable timelines
- Budget constraints may require phasing steps across multiple weeks or months
- Regular progress reviews between steps help catch issues early

### Success Indicators

Track these signals to confirm the workflow is on track:

- Each step produces a concrete, reviewable deliverable
- User confidence increases as steps are completed
- Deliverables from early steps remain valid as later steps are executed
- No critical assumptions from earlier steps are invalidated
- External feedback (where applicable) is incorporated before proceeding

## Example

**Input:** Professional relocating from a mid-sized city to a major metro for a new job starting in 8 weeks, single, renting, current income $75,000 with new salary of $92,000.

**Output:**

**Step 1 (destination-comparison):**
Three neighborhoods compared: Downtown (walkable, expensive, 10-min transit commute), Midtown (moderate cost, 20-min commute, good restaurants), Suburb A (affordable, 45-min commute, quiet). Scoring: Midtown wins on balance -- affordable enough, reasonable commute, good amenities. Visit scheduled for a weekend to confirm.

**Step 2 (budget-planning):**
Current rent: $1,200. Target city Midtown rent: $1,800 for comparable apartment. Cost of living increase: 18%. New salary is 22% higher, covering the difference. One-time costs: $5,400 (first/last/deposit) + $3,200 (moving company) + $800 (travel and temporary housing) = $9,400. Savings available: $14,000. Financial model confirms affordability.

**Step 3 (job-search-strategy):**
Job already secured (triggering this relocation). Action: negotiate relocation assistance. Employer offers $3,000 relocation stipend and 1 week of temporary housing. This reduces out-of-pocket moving costs to $6,400. Remote work agreement for the first week to allow settling in.

**Step 4 (moving-checklist):**
6-week moving timeline created. Week 1: notify landlord (30-day notice), get moving quotes. Week 2: book movers ($2,800), begin packing non-essentials. Week 3: cancel local gym, utilities transfer request. Week 4: pack remaining items, clean current apartment. Week 5: moving day (Saturday), drive personal vehicle with essentials. Week 6: first week in new city (remote work while unpacking).

**Step 5 (home-safety-inspection):**
Move-in inspection completed: 47 photos documenting existing scuffs, one cracked tile in bathroom, and minor paint chips. Submitted condition report to landlord via email. Safety check: smoke detectors working, deadbolt functions, water heater at 120F. One issue found: bathroom exhaust fan not working. Maintenance request submitted.

**Step 6 (project-kickoff):**
30-day plan: Week 1 -- grocery store, pharmacy, gas station located. Week 2 -- primary care physician selected and appointment scheduled. Week 3 -- joined a local running group found through neighborhood app. Week 4 -- commute routine established, favorite coffee shop identified. 90-day goal: established 3 regular social connections, fully settled routine, first quarterly review at new job completed.

**Result:** Professional relocated successfully in 6 weeks. Total cost: $9,400 out of pocket minus $3,000 employer stipend = $6,400 net. First month in new city: productive at work by day 3, fully unpacked by day 10, social activities started by week 3. No major surprises due to thorough financial and neighborhood research.
