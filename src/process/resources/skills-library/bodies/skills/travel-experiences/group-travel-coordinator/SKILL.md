---
name: group-travel-coordinator
description: |
  Coordinates group travel logistics including preference gathering, consensus
  building, booking sequences, and cost-splitting workflows. Produces a
  complete group coordination plan with role assignments, decision frameworks,
  and shared booking timelines. Use when the user asks about organizing group
  trips, coordinating travel with friends or family groups, managing group
  booking logistics, or building consensus on travel plans. Do NOT use for
  couples trips (use honeymoon-trip-planner or trip-itinerary-builder),
  solo travel, or event planning (use family-relationships event skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel planning event-planning checklist"
  category: "travel-experiences"
  subcategory: "trip-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Group Travel Coordinator

## When to Use

- User is organizing travel for a group (4+ people)
- User asks about coordinating trip planning among friends, family, or colleagues
- User needs a system for gathering preferences and building consensus
- User wants a booking sequence that accounts for group logistics
- User asks about cost splitting for group travel
- User needs role assignments for distributed trip planning tasks
- Do NOT use when: user is planning a couples trip (use `honeymoon-trip-planner` or `trip-itinerary-builder`), user is planning solo (use `solo-travel-planner`), user is planning a formal event (use family-relationships event skills), user needs budget optimization only (use `budget-travel-planner`)

## Process

1. **Gather group profile.** Ask the organizer for:
   - Group size and composition (friends, family, mixed ages, colleagues)
   - Age range and physical capabilities within the group
   - How well the group has traveled together before (first time, annual tradition, experienced group)
   - Decision-making style (one organizer decides, democratic vote, subset of planners)
   - Budget range across the group (is everyone at the same level, or is there a spread?)
   - Dietary restrictions, medical needs, or accessibility requirements for any member
   - Destination preferences (decided, shortlisted, open)
   - Dates (fixed, flexible, needs coordination)
   - Communication channel the group uses (group chat, email thread, shared document)

2. **Establish roles and responsibilities.** Assign coordination roles to distribute the planning workload:
   - **Trip Organizer (1 person):** Overall coordinator, sets deadlines, makes final calls when consensus stalls. This is the user.
   - **Booking Coordinator (1-2 people):** Handles accommodation and transportation reservations. Collects payments.
   - **Activity Planner (1-2 people):** Researches and proposes activity options. Handles day-to-day scheduling.
   - **Finance Tracker (1 person):** Maintains the shared expense ledger. Tracks who has paid what.
   - **Communications Lead (1 person, often same as Organizer):** Sends reminders, collects responses, tracks RSVPs and deadlines.

3. **Run the preference gathering process.** Create and distribute a preference survey:
   - **Destination vote (if not decided):** Each member ranks top 3 choices. Use elimination voting if needed.
   - **Date availability:** Each member provides available date ranges. Find the overlap window.
   - **Budget declaration:** Each member states their maximum comfortable budget (private to organizer if sensitive).
   - **Activity interests:** Each member rates categories (beach, culture, adventure, nightlife, relaxation, food) on a 1-5 scale.
   - **Non-negotiables:** Each member lists 1-2 things they absolutely want to do and 1-2 things they absolutely will not do.
   - **Deadline for responses:** Set a firm deadline. Follow up individually with non-responders.

4. **Build consensus.** Analyze responses and identify:
   - **Common ground:** Activities and preferences shared by 75%+ of the group
   - **Subgroup interests:** Activities wanted by a subset (schedule these as opt-in side trips)
   - **Conflicts:** Opposing preferences that need resolution (budget mismatch, activity disagreements)
   - **Budget floor:** Use the lowest stated budget as the base plan. Offer optional upgrades for those with higher budgets.
   - Present 2-3 itinerary options that satisfy common ground and let the group vote.

5. **Create the booking sequence.** Order reservations by:
   - **Commitment dependencies:** Book items with cancellation flexibility first, non-refundable items last
   - **Availability urgency:** Book items that sell out (accommodation for large groups, popular excursions) earliest
   - **Payment collection:** Align payment collection with booking deadlines
   - For each booking, specify: who books, payment method (one person fronts, or split at booking), cancellation policy, and confirmation sharing method

6. **Design the cost-splitting framework.** Establish rules before booking:
   - Shared costs (accommodation, group transportation, shared meals) split equally or by room
   - Individual costs (personal activities, drinks, upgrades) tracked separately
   - Payment method (one person pays and gets reimbursed, rotating payer, expense-splitting application)
   - Settlement timeline (settle during trip, within 1 week after, at each booking)

7. **Compile the group coordination plan** with role assignments, survey template, consensus results, booking timeline, cost-splitting rules, and day-by-day schedule.

## Output Format

```
## Group Travel Coordination Plan

**Trip:** [destination], [dates]
**Group Size:** [number] travelers
**Organizer:** [name/role]
**Budget Range:** $[per-person range]
**Communication Channel:** [platform]

### Role Assignments

| Role | Person | Responsibilities | Deadlines |
|------|--------|-----------------|-----------|
| Trip Organizer | [name] | [tasks] | [key dates] |
| Booking Coordinator | [name] | [tasks] | [key dates] |
| Activity Planner | [name] | [tasks] | [key dates] |
| Finance Tracker | [name] | [tasks] | [key dates] |

### Preference Survey Template

**Send to group by:** [date]
**Response deadline:** [date]

[Survey content with all questions]

### Consensus Summary

**Destination:** [chosen destination and vote results]
**Dates:** [confirmed dates]
**Budget:** $[agreed per-person budget]
**Shared interests:** [activities everyone wants]
**Opt-in activities:** [activities for subgroups]
**Resolved conflicts:** [how disagreements were handled]

### Booking Sequence

| Order | Item | Book By | Who Books | Est. Cost | Payment Method | Cancellation |
|-------|------|---------|-----------|-----------|----------------|-------------|
| 1 | [item] | [date] | [person] | $[amount] | [method] | [policy] |

### Cost-Splitting Rules

| Category | Split Method | Tracking |
|----------|-------------|---------|
| Accommodation | [equal / per room / per bed] | [how tracked] |
| Group meals | [equal split] | [how tracked] |
| Individual activities | [each pays own] | [how tracked] |
| Transportation | [equal or by usage] | [how tracked] |

### Payment Collection Schedule

| Deadline | Amount per Person | Purpose | Collect Via |
|----------|------------------|---------|------------|
| [date] | $[amount] | [deposit for accommodation] | [method] |

### Day-by-Day Group Schedule

| Day | Group Activity | Opt-in Activity | Free Time | Meal Plan |
|-----|---------------|-----------------|-----------|-----------|
| [day] | [shared activity] | [optional side trip] | [when] | [group/individual] |

### Communication Timeline

| Date | Message | Audience | Action Required |
|------|---------|----------|-----------------|
| [date] | [what to send] | [whole group / subset] | [response/payment/confirmation] |
```

## Rules

1. NEVER assume all group members have the same budget -- always gather individual budget ranges and plan to the lowest comfortable level
2. ALWAYS establish cost-splitting rules before the first booking, not after
3. ALWAYS include opt-in side activities for subgroup interests rather than forcing everyone into every activity
4. Include at least 2 hours of free time per day where group members can do their own thing
5. Set explicit response deadlines for every survey and decision point -- group planning stalls without deadlines
6. Booking sequence must prioritize items with limited availability for large groups (accommodation, excursions with group size limits)
7. Include a communication timeline with specific message templates and send dates
8. NEVER schedule group activities before 9:00 AM unless the group explicitly agrees -- large groups have late risers
9. Plan group meals for no more than 50% of total meals -- large group dining is logistically complex and expensive
10. Include a contingency plan for the most common group travel problems (someone cancels, flight delay splits the group, budget overrun)

## Edge Cases

- **Wide budget gap within the group:** If the budget range spans 2x or more (e.g., $1,000 to $3,000 per person), plan the core trip at the lower budget. Offer "upgrade tiers" for higher-budget members (private room instead of shared, optional premium excursion). Never make the lower-budget members feel like they are holding the group back. Cost-splitting only applies to shared experiences at the base tier.

- **Mixed ages (children and elderly in the same group):** Schedule activities by physical intensity and alternate between active and relaxed. Identify activities suitable for the full age range vs. those that require splitting into subgroups. Children under 10 limit the pace significantly -- schedule 30% fewer activities than an adult-only group. Ensure the accommodation meets accessibility needs for elderly members.

- **Group member drops out after booking:** Include cancellation handling in the cost-splitting rules from the start. Options: the departing member covers their share of non-refundable costs, the group absorbs the difference and adjusts, or the spot is offered to a replacement. Decide the policy before bookings start and get group agreement in writing.

- **Decision deadlock (group cannot agree):** If consensus fails after 2 rounds of voting, the Trip Organizer makes the call. This should be stated upfront in the roles section. No trip plan survives endless deliberation. The rule: vote twice, then the organizer decides.

- **Very large group (12+ people):** Groups above 12 become unwieldy for shared activities. Split into 2-3 subgroups for daytime activities and reconvene for shared meals. Accommodation should have common gathering spaces. Assign a subgroup leader for each cluster. Communication should use a single channel with pinned logistics posts.

## Example

**Input:** "I'm organizing a trip for 8 friends to go somewhere warm in February. We're all in our late 20s-30s, no kids. Budgets vary -- some are comfortable spending $2,000 and others are closer to $1,200. We want beach, some nightlife, and good food. We've never traveled as a full group before."

**Output:**

## Group Travel Coordination Plan

**Trip:** Warm beach destination, February
**Group Size:** 8 travelers (all late 20s-30s, no children)
**Organizer:** [You]
**Budget Range:** $1,200-2,000 per person
**Communication Channel:** Group chat (recommend creating a dedicated trip chat separate from general friend chat)

### Role Assignments

| Role | Person | Responsibilities | Deadlines |
|------|--------|-----------------|-----------|
| Trip Organizer | You | Set deadlines, final decisions, booking oversight | Ongoing |
| Booking Coordinator | Volunteer 1 | Research and book accommodation + flights | Book by Week 8 before trip |
| Activity Planner | Volunteer 2 | Research local activities, nightlife, restaurant areas | Proposals by Week 6 |
| Finance Tracker | Volunteer 3 | Track all shared expenses, manage settlement | Weekly updates during trip |

**Assignment method:** Post in group chat: "I need 3 volunteers -- Booking Coordinator, Activity Planner, and Finance Tracker. Claim your role by [date]."

### Preference Survey Template

**Send to group by:** 12 weeks before trip
**Response deadline:** 10 weeks before trip (hard deadline -- non-responders get no vote)

```
TRIP SURVEY -- respond by [date]

1. DESTINATION VOTE (rank your top 3):
   A) [Option 1 -- e.g., Caribbean island destination]
   B) [Option 2 -- e.g., Central American coast]
   C) [Option 3 -- e.g., Southeast Asian beach]
   D) Suggest another: ___

2. DATE AVAILABILITY:
   Which February weeks work for you? (check all that apply)
   [ ] Feb 1-8  [ ] Feb 8-15  [ ] Feb 15-22  [ ] Feb 22-Mar 1

3. BUDGET (private -- reply to organizer directly, not the group):
   Maximum comfortable spend for this trip (flights + accommodation + spending): $___

4. ACTIVITY INTEREST (rate 1-5, where 5 = must do):
   Beach/pool relaxation: ___
   Snorkeling/water sports: ___
   Nightlife/bars: ___
   Local food exploration: ___
   Cultural sites/tours: ___
   Adventure activities (zip line, ATV, etc.): ___

5. NON-NEGOTIABLES:
   One thing I absolutely want to do: ___
   One thing I will NOT do: ___

6. DIETARY RESTRICTIONS / MEDICAL NEEDS:
   (or "none"): ___

7. ROOM PREFERENCE:
   [ ] Share a room (cheapest)  [ ] Want own room (pay premium)  [ ] Flexible
```

### Consensus Summary (Template -- fill after survey)

**Destination:** [Winning destination with vote tally, e.g., "Option B won 5-2-1"]
**Dates:** [Overlap window, e.g., "Feb 8-15 -- all 8 available"]
**Budget:** $1,200 per person base plan (lowest comfortable budget). Optional upgrades available.
**Shared interests:** Beach relaxation (8/8), food exploration (7/8), nightlife (6/8)
**Opt-in activities:** Snorkeling excursion (5 interested), adventure activity (4 interested)
**Resolved conflicts:** [e.g., "Cultural tour was low-priority (2/8) -- removed from group plan, available as individual option"]

### Booking Sequence

| Order | Item | Book By | Who Books | Est. Cost/Person | Payment Method | Cancellation |
|-------|------|---------|-----------|-----------------|----------------|-------------|
| 1 | Accommodation (villa or connected rooms) | 10 weeks before | Booking Coordinator | $350-500 (7 nights) | Organizer fronts deposit, group reimburses within 1 week | Free cancel 30 days out |
| 2 | Flights (individual bookings) | 8 weeks before | Each person books own | $300-600 | Each pays own | Per airline policy |
| 3 | Group excursion (snorkeling, opt-in) | 4 weeks before | Activity Planner | $50-80 | Collect from opt-in members | Free cancel 48 hours |
| 4 | Airport transfers (group van/shuttle) | 2 weeks before | Booking Coordinator | $15-25/person | Split equally among arriving group | Free cancel 24 hours |

### Cost-Splitting Rules

| Category | Split Method | Tracking |
|----------|-------------|---------|
| Accommodation | Equal 8-way split (or adjusted if some get private rooms) | Finance Tracker spreadsheet |
| Group dinners (3 planned) | Equal split at the table | Finance Tracker logs total |
| Individual meals | Each pays own | Not tracked |
| Group excursions | Split among participants only | Finance Tracker logs per activity |
| Nightlife / bar tabs | Each pays own (or split rounds evenly if agreed) | Not tracked |
| Transportation (shared taxis, van) | Equal split among riders | Finance Tracker logs |
| Groceries / shared supplies | Equal 8-way split | Finance Tracker logs receipts |

**Settlement method:** Finance Tracker maintains a running spreadsheet. Settle all balances within 1 week of returning home. Recommended: use a group expense-tracking method where each shared purchase is logged with who paid and who owes.

### Payment Collection Schedule

| Deadline | Amount per Person | Purpose | Collect Via |
|----------|------------------|---------|------------|
| 10 weeks before | $150 | Accommodation deposit (Organizer fronts, group reimburses) | Direct transfer to Organizer |
| 6 weeks before | $200 | Accommodation balance | Direct transfer to Booking Coordinator |
| 2 weeks before | $75 | Excursion deposits + airport transfer | Direct transfer to Activity Planner |
| During trip | Variable | Shared expenses as they occur | Finance Tracker logs, settle after |
| 1 week after return | Final settlement | Balance all shared expenses | Finance Tracker sends final tally |

### Day-by-Day Group Schedule

| Day | Group Activity | Opt-in Activity | Free Time | Meal Plan |
|-----|---------------|-----------------|-----------|-----------|
| Day 1 (Sat) | Arrive, settle in, grocery run for house supplies | -- | Afternoon-evening | Group welcome dinner (split) |
| Day 2 (Sun) | Beach day together | -- | All day (beach IS the activity) | Individual lunch, group dinner out |
| Day 3 (Mon) | Free morning | Snorkeling excursion (5 people, 1 PM) | Morning | Individual meals |
| Day 4 (Tue) | Explore local food district together (lunch) | -- | Afternoon + evening | Group lunch walk, individual dinner |
| Day 5 (Wed) | Free day | Adventure activity (4 people) | Full day for non-participants | Individual meals |
| Day 6 (Thu) | Beach day | -- | Afternoon | Group farewell dinner (split) |
| Day 7 (Fri) | Pack, depart | -- | Morning if late flights | Individual breakfast |

**Key pacing notes:**
- 3 group activities in 7 days (not every day)
- 2 opt-in activities for subgroups
- 3 fully free days where people do whatever they want
- 3 group meals out of 21 total meals (14% -- minimal group dining logistics)

### Communication Timeline

| Date | Message | Audience | Action Required |
|------|---------|----------|-----------------|
| 12 weeks before | Send preference survey | Whole group | Complete survey by [date] |
| 10 weeks before | Announce destination, dates, budget. Request deposit. | Whole group | Pay deposit within 5 days |
| 8 weeks before | Remind to book flights. Share accommodation confirmation. | Whole group | Book flights, share itinerary |
| 6 weeks before | Collect accommodation balance. Share activity options. | Whole group | Pay balance, vote on activities |
| 4 weeks before | Confirm excursion bookings. Collect opt-in payments. | Opt-in members | Pay activity deposits |
| 2 weeks before | Share final logistics doc (address, transfers, emergency contacts) | Whole group | Confirm arrival times |
| 1 day before | "See you tomorrow!" message with check-in logistics | Whole group | None -- excitement only |
| 1 week after return | Finance Tracker sends expense summary and settlement amounts | Whole group | Settle within 5 days |

### Contingency Plans

| Scenario | Plan |
|----------|------|
| **Someone drops out after accommodation is booked** | Departing member pays their share of non-refundable costs. Group can invite a replacement or absorb the difference (split 7 ways instead of 8). Establish this rule before booking. |
| **Flight delay splits the group on arrival** | Share accommodation address and check-in instructions with everyone in advance. Delayed members take their own transfer. No group activity on Day 1 to allow for staggered arrivals. |
| **Budget overrun mid-trip** | Finance Tracker flags when shared expenses exceed $100/person and the group decides whether to cut remaining shared costs or accept the overage. |
| **Personality conflict during trip** | Ample free time in the schedule lets people take space. The organizer should address conflicts privately, not in the group setting. |
