---
name: plan-a-wedding
description: |
  Guides the user through the complete wedding planning process from budget
  setting through day-of coordination, chaining budgeting, event planning,
  vendor management, and timeline skills across multiple categories.
  Use when the user wants to plan a wedding, organize a marriage ceremony,
  or coordinate a wedding celebration.
  Do NOT use for elopement logistics, vow renewal ceremonies, or
  corporate event planning.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "event-planning planning checklist step-by-step family-events"
  category: "life-event"
  depends: "budget-planning milestone-planning family-reunion-planning business-proposal professional-email holiday-planning project-kickoff"
  disclaimer: "none"
  difficulty: "intermediate"
---

# Plan a Wedding

**Estimated time:** 6-18 months (depending on wedding size and venue availability)

**Geographic variation note:** Steps 3, 4, and 6 vary by region. Venue availability, vendor pricing, marriage license requirements, and cultural customs differ significantly by location. Research local vendor markets and legal requirements early in the process.

## When to Use

- User wants to plan a wedding from start to finish with a structured approach
- User needs to coordinate multiple vendors, timelines, and budgets for a wedding celebration
- User is overwhelmed by wedding planning and wants a phased, systematic process
- Do NOT use when: planning an elopement (no vendor coordination needed), organizing a vow renewal (simpler scope), or planning a corporate event (different domain)

## Prerequisites

Before starting this workflow, ensure:

1. Wedding date range identified (season and year, even if exact date is flexible)
2. Rough guest count estimated (intimate <50, medium 50-150, large 150+)
3. Both partners aligned on overall vision (formal vs. casual, traditional vs. non-traditional)
4. Financial contributors identified (couple only, family contributions, etc.)

## Steps

**Step 1: Set the Wedding Budget** (uses: budget-planning)

Create a detailed wedding budget that allocates funds across all major wedding expense categories. This step prevents the most common wedding planning failure: overspending in early categories and having nothing left for later essentials.

- Input: Total available funds (savings + family contributions), guest count estimate, wedding style preferences
- Output: Itemized budget allocation with categories (venue, catering, photography, attire, flowers, music, invitations, officiant, transportation, contingency reserve), per-guest cost target
- Key focus: Allocate 10-15% as contingency reserve. Venue and catering typically consume 40-50% of budget. Set hard caps per category before any vendor conversations. Track every expense against the budget throughout the process.

**Step 2: Build the Wedding Timeline** (uses: milestone-planning)

Create a reverse-engineered timeline from the wedding date back to today, with milestones for every major decision, booking, and delivery. This timeline becomes the master schedule that coordinates all subsequent steps.

- Input: Wedding date (or date range), budget from Step 1, venue booking lead times in your area, vendor availability windows
- Output: Month-by-month milestone plan with deadlines, a "book by" date for each vendor category, and a critical path identifying which decisions block others
- Key focus: Venue must be booked first (everything else depends on date, location, and capacity). Photography books 8-12 months out in peak season. Invitations need 8-10 weeks before the wedding. Build buffer time for decisions that require both partners to agree.

**Step 3: Plan the Event Structure** (uses: family-reunion-planning)

Design the event flow, from ceremony through reception, using event planning principles. This step defines the guest experience, space requirements, and logistics that inform all vendor decisions.

- Input: Venue details (capacity, layout, indoor/outdoor), guest list draft, cultural or religious requirements, accessibility needs
- Output: Event flow timeline (ceremony, cocktail hour, dinner, dancing, send-off), space usage plan, seating arrangement framework, special requirements list (dietary, accessibility, cultural)
- Key focus: Map the guest experience minute by minute. Identify transition points between ceremony and reception. Account for setup and teardown time. Plan for weather contingencies if any portion is outdoors.

**Step 4: Manage Vendor Proposals** (uses: business-proposal)

Solicit, compare, and negotiate vendor proposals using structured evaluation criteria. Apply proposal-writing skills to create clear RFPs and evaluate vendor responses objectively.

- Input: Budget allocations from Step 1, event requirements from Step 3, timeline deadlines from Step 2
- Output: Vendor comparison matrices for each category (catering, photography, florist, DJ/band, officiant), selected vendors with signed contracts, payment schedules aligned with budget
- Key focus: Request itemized proposals, not package-only pricing. Compare vendors on: portfolio quality, references, backup plans, cancellation terms, and payment schedule flexibility. Negotiate before signing. Get everything in writing.

**Step 5: Coordinate Vendor Communication** (uses: professional-email)

Maintain clear, professional communication with all vendors throughout the planning process. This step ensures no details fall through the cracks between booking and the wedding day.

- Input: Signed vendor contracts from Step 4, event timeline from Step 3, specific requests and changes as they arise
- Output: Communication log with all vendors, confirmed delivery times, setup requirements, final headcounts, and special instructions delivered
- Key focus: Send final details to all vendors 2-3 weeks before the wedding. Confirm arrival times, setup needs, meal selections, and any last-minute changes. Create a vendor contact sheet for the day-of coordinator with names, phone numbers, and delivery times.

**Step 6: Manage the Guest Experience Timeline** (uses: holiday-planning)

Apply event timeline management to the guest-facing aspects: invitations, RSVPs, travel accommodations, rehearsal dinner, and post-wedding activities. This step handles the people side of logistics.

- Input: Guest list, event timeline from Step 3, venue location, out-of-town guest percentage
- Output: Invitation timeline with RSVP deadline, hotel block reservations, rehearsal dinner plan, welcome activities for out-of-town guests, transportation arrangements
- Key focus: Send save-the-dates 6-8 months out, formal invitations 8-10 weeks out, RSVP deadline 3-4 weeks before the wedding. Arrange hotel blocks early. Plan rehearsal dinner logistics separately. Create a wedding website with all travel and accommodation information.

**Step 7: Execute Day-Of Coordination** (uses: project-kickoff)

Apply project-kickoff principles to the wedding day itself: ensure every vendor, participant, and family member knows their role, timing, and contingency plan. This step is the final "launch" that brings all planning to fruition.

- Input: Finalized vendor contact sheet from Step 5, event timeline from Step 3, guest RSVP list from Step 6, wedding party roles and responsibilities
- Output: Minute-by-minute day-of timeline, emergency contact list, backup plans for weather and vendor no-shows, a designated point person for vendor questions, post-wedding wrap-up checklist
- Key focus: Assign a day-of coordinator (professional or trusted friend) who handles all vendor interactions so the couple does not. Create a "day-of binder" with every timeline, contact, and contract. Build 15-30 minute buffers between events. Prepare an emergency kit (sewing kit, stain remover, extra phone charger, cash for tips).

## Decision Points

- **After Step 1:** If total budget is under $5,000, consider a micro-wedding (under 20 guests) or courthouse ceremony with reception dinner. The 7-step process is designed for weddings with vendor coordination. Micro-weddings can skip Steps 4-5.
- **After Step 1:** If budget exceeds $50,000, consider hiring a professional wedding planner to manage Steps 2-7. This workflow provides the structure, but a planner adds local vendor expertise and day-of execution that this workflow cannot fully replace.
- **After Step 2:** If timeline is under 6 months, prioritize venue, officiant, and catering first. Photography and flowers can sometimes be booked on shorter timelines. Skip elaborate printed invitations in favor of digital.
- **After Step 3:** If destination wedding, Steps 4-6 change significantly: vendor selection is remote, guest travel logistics become the primary challenge, and a local coordinator at the destination is nearly essential.
- **After Step 4:** If a critical vendor cancels after booking, use the contract cancellation terms to recover deposits. Return to vendor comparison matrix from Step 4 and book the next-ranked option immediately.

## Failure Handling

- **Step 1 fails (budget disagreement between contributors):** Schedule a dedicated budget conversation using the budget-planning output as a neutral framework. Separate "must-haves" from "nice-to-haves" and find agreement on priorities before proceeding.
- **Step 2 fails (desired date unavailable at all target venues):** Flex the date by 1-2 weeks or consider a Friday/Sunday wedding, which often has better availability and lower pricing. Alternatively, expand venue search radius.
- **Step 3 fails (event structure conflicts with venue constraints):** Simplify the event flow. If the venue cannot accommodate a separate cocktail hour and reception, combine them. The event structure must fit the venue, not the other way around.
- **Step 4 fails (all vendors in a category exceed budget):** Reduce scope in that category (e.g., fewer floral arrangements, shorter photographer coverage) or reallocate from a lower-priority category. Do not eliminate contingency reserve to cover vendor costs.
- **Step 5 fails (vendor becomes unresponsive):** Escalate communication (phone call, then certified letter referencing contract terms). If a vendor ghosts within 30 days of the wedding, activate the backup vendor list from Step 4 and file a dispute for the deposit.
- **Step 7 fails (day-of emergency):** Every vendor should have a backup plan in their contract. For weather: have an indoor backup or tent plan decided 48 hours before. For vendor no-shows: the day-of coordinator calls the backup list. For medical emergencies: know the nearest hospital and have a first-aid kit on site.
- **Direction change (couple decides to scale down):** Most vendor contracts have cancellation terms. If scaling down more than 30 days out, renegotiate rather than cancel. Venue and catering can often accommodate reduced headcount with adjusted pricing.

## Output Format

```
WEDDING PLANNING TRACKER
========================

Budget Summary
  Total budget: $______
  Spent to date: $______
  Remaining: $______
  Contingency reserve: $______ (target: 10-15%)

Timeline Status (months until wedding: ____)
  [ ] Venue booked (Month 1)
  [ ] Key vendors booked (Months 2-3)
  [ ] Attire ordered (Month 4)
  [ ] Save-the-dates sent (Month 6)
  [ ] Guest list finalized (Month 8)
  [ ] Invitations sent (Month 9)
  [ ] Final vendor confirmations (Month 10)
  [ ] Rehearsal complete (Month 11)
  [ ] Wedding day (Month 12)

Vendor Tracker
  | Category     | Vendor Name | Contract | Deposit | Balance | Confirmed |
  |--------------|-------------|----------|---------|---------|-----------|
  | Venue        |             | [ ]      | $       | $       | [ ]       |
  | Catering     |             | [ ]      | $       | $       | [ ]       |
  | Photography  |             | [ ]      | $       | $       | [ ]       |
  | Music/DJ     |             | [ ]      | $       | $       | [ ]       |
  | Florist      |             | [ ]      | $       | $       | [ ]       |
  | Officiant    |             | [ ]      | $       | $       | [ ]       |

Guest Status
  Invited: ___  Accepted: ___  Declined: ___  Awaiting: ___

Day-of Timeline
  [Time] - [Event] - [Vendor responsible] - [Location]

Status: [PLANNING / VENDOR PHASE / FINAL DETAILS / WEDDING WEEK / COMPLETE]
```

## Edge Cases

- **Blended family dynamics:** Step 3 requires careful seating and ceremony role planning. Address family dynamics proactively: who walks down the aisle, seating for divorced parents, stepparent roles. Discuss in advance and assign a coordinator to manage day-of sensitivities.
- **Pandemic or weather cancellation:** Build force majeure clauses into all vendor contracts during Step 4. Understand each vendor's rescheduling policy vs. refund policy. Wedding insurance can cover some losses.
- **Destination wedding with mostly traveling guests:** Steps 4-6 change significantly. Most vendor selection happens remotely. Guest logistics (Step 6) become the most complex step. Consider a local wedding coordinator at the destination.
- **Very short timeline (under 4 months):** Compress Steps 1-4 into weeks instead of months. Prioritize venue, officiant, and catering. Accept limited choices in other vendor categories. Digital invitations replace printed.
- **Interfaith or multicultural ceremonies:** Step 3 must accommodate multiple ceremony traditions. Discuss with officiants from both traditions early. Allow extra ceremony time and explain traditions to guests in the program.
- **Micro-wedding (under 20 guests):** Steps 4-5 simplify dramatically. A single venue coordinator may replace all individual vendors. Focus budget on experience quality rather than vendor quantity.

## Expected Outcome

When this workflow is complete, the user will have:

1. A wedding budget with tracked expenses and contingency reserve
2. A comprehensive timeline with every milestone met on schedule
3. All vendors booked, contracts signed, and communication documented
4. Guest logistics handled (invitations, RSVPs, travel, accommodations)
5. A day-of coordination plan that runs the event without the couple managing logistics
6. A completed celebration with minimal stress and maximum enjoyment

## Example

**Input:** Couple planning a 120-guest wedding in 12 months with a $35,000 total budget, traditional ceremony, reception at a single venue.

**Output:**

**Step 1 (budget-planning):**
Budget allocated: venue/catering $15,000, photography $3,500, DJ $1,500, flowers $2,000, attire $2,500, invitations $800, officiant $500, transportation $600, decor $2,000, hair/makeup $800, favors $400, contingency $3,500, miscellaneous $1,900. Per-guest target: $125 for catering.

**Step 2 (milestone-planning):**
12-month timeline created. Month 1: book venue. Month 2: book photographer and DJ. Month 3: select caterer, florist. Month 4: order attire. Month 6: send save-the-dates. Month 8: finalize guest list. Month 9: send invitations. Month 10: final vendor meetings. Month 11: rehearsal planning. Month 12: wedding week.

**Step 3 (family-reunion-planning):**
Event flow: 4:00 PM ceremony (30 min), 4:30 PM cocktail hour, 5:30 PM dinner service, 7:00 PM toasts and first dance, 7:30 PM open dancing, 10:00 PM send-off. Seating arranged by table groups (family, college friends, work friends, partner's family). Three dietary accommodations tracked.

**Step 4 (business-proposal):**
RFPs sent to 3 caterers, 4 photographers, 2 DJs. Evaluation matrix scored on portfolio, references, price, and flexibility. Selected: mid-range caterer ($14,200 for 120 guests), documentary-style photographer ($3,200 for 8 hours), DJ with ceremony sound ($1,400).

**Step 5 (professional-email):**
Vendor communication log maintained. Final details confirmed 3 weeks out: catering headcount (118), photographer shot list (42 must-have shots), DJ playlist and do-not-play list, florist delivery time (11 AM). Vendor contact sheet created for day-of coordinator.

**Step 6 (holiday-planning):**
Save-the-dates sent at 6 months. Invitations sent at 10 weeks. RSVP deadline at 4 weeks before. Hotel block of 30 rooms reserved. Welcome dinner arranged for out-of-town guests (Friday evening). Wedding website launched with timeline, registry, and travel info.

**Step 7 (project-kickoff):**
Day-of binder assembled. Minute-by-minute timeline distributed to all vendors and wedding party. Coordinator (maid of honor) designated as vendor contact. Emergency kit packed. Rain plan confirmed with venue (indoor ceremony backup in ballroom). Tips prepared in labeled envelopes.

**Result:** 120-guest wedding executed on a $35,000 budget with $2,100 of contingency remaining. All vendors delivered as contracted. Ceremony started 5 minutes late (within buffer). No major issues on the day. Total planning time: approximately 200 hours over 12 months.
