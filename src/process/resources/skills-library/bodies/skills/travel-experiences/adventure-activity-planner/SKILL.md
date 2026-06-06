---
name: adventure-activity-planner
description: |
  Plans adventure activities for travel trips including activity selection,
  booking sequences, gear checklists, and difficulty assessments. Produces a
  step-by-step booking workflow with decision criteria at each stage. Use when
  the user asks about planning adventure activities abroad, booking outdoor
  experiences, creating activity itineraries for active trips, or organizing
  multi-day adventure excursions. Do NOT use for general trip itinerary building
  (use trip-itinerary-builder), fitness training plans (use health-wellness
  skills), or competitive sports preparation (use hobbies-crafts skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel planning checklist step-by-step"
  category: "travel-experiences"
  subcategory: "experiences-activities"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Adventure Activity Planner

## When to Use

- User wants to plan adventure activities for an upcoming trip
- User asks about booking outdoor or adrenaline experiences at a destination
- User wants to compare adventure activity options by difficulty, cost, or season
- User needs a gear checklist for a specific adventure activity
- User wants a step-by-step booking workflow for adventure experiences
- User asks about risk assessment or physical requirements for travel activities
- Do NOT use when: user needs a full multi-day trip itinerary (use `trip-itinerary-builder`), user wants fitness training for an activity (use health-wellness skills), user is planning competitive sports events (use hobbies-crafts skills), user needs travel insurance guidance (use `travel-insurance-evaluator`)

## Process

1. **Gather trip and traveler profile.** Ask the user for:
   - Destination region and specific areas within it
   - Travel dates and total days available for activities
   - Group composition (solo, couple, family with children ages, friend group)
   - Physical fitness level (sedentary, moderate, active, very active)
   - Prior adventure experience (none, some outdoor experience, experienced adventurer)
   - Budget range for activities (per person, per day or total)
   - Any medical conditions, injuries, or physical limitations
   - Risk tolerance (mild thrills, moderate challenge, high adrenaline)

2. **Identify candidate activities.** Based on destination and profile, compile a list of 5-10 candidate activities. For each activity, document:
   - Activity name and type (water, land, air, multi-element)
   - Physical difficulty rating (1-5 scale: 1 = accessible to most, 5 = requires significant fitness)
   - Technical skill requirement (none, basic instruction included, prior experience needed)
   - Minimum age requirement (if applicable)
   - Typical duration (half-day, full-day, multi-day)
   - Season availability (year-round, seasonal with specific months)
   - Price range per person
   - Booking lead time (walk-up, 1 week, 2-4 weeks, 1-3 months)

3. **Apply selection filters.** Narrow the candidate list using these decision criteria in order:
   - **Safety filter:** Remove any activity that exceeds the group's fitness or experience level by more than one tier
   - **Age filter:** Remove activities below the minimum age for any group member
   - **Budget filter:** Remove activities that exceed per-person budget by more than 20%
   - **Season filter:** Remove activities unavailable during travel dates
   - **Time filter:** Remove activities whose duration does not fit the available schedule
   - Present the filtered shortlist (3-5 activities) with a recommendation ranking

4. **Build the booking sequence.** For each selected activity, create a timeline:
   - Booking window (when to reserve relative to travel date)
   - Deposit or full payment requirements
   - Cancellation policy summary (free cancellation cutoff, partial refund window, no-refund zone)
   - Required documents (waivers, medical clearance, certifications)
   - Pre-activity preparation (training, fitness benchmarks, acclimatization needs)
   - Day-of logistics (meeting point, transportation, check-in time, duration)

5. **Create the gear checklist.** For each activity, list:
   - Gear provided by the operator (included in price)
   - Gear the traveler must bring (personal items required)
   - Gear the traveler should bring (recommended but optional)
   - Gear available for rental at the destination (with estimated rental cost)
   - Packing notes (weight, bulk, airline restrictions for specialty gear)

6. **Produce the risk assessment.** For each activity, document:
   - Common risks and how operators mitigate them
   - Weather-dependent cancellation conditions
   - Emergency protocol awareness (nearest medical facility, evacuation options)
   - Insurance considerations (does standard travel insurance cover this activity type)

7. **Compile the final activity plan.** Assemble the complete document with day-by-day activity assignments, booking action items with deadlines, a consolidated gear list, and a budget summary.

## Output Format

```
## Adventure Activity Plan

**Destination:** [destination]
**Travel Dates:** [dates]
**Travelers:** [group description]
**Activity Budget:** [budget per person or total]

### Activity Shortlist

| # | Activity | Type | Difficulty (1-5) | Duration | Price/Person | Best Months | Min Age |
|---|----------|------|-------------------|----------|--------------|-------------|---------|
| 1 | [name] | [type] | [rating] | [duration] | $[price] | [months] | [age] |
| 2 | [name] | [type] | [rating] | [duration] | $[price] | [months] | [age] |
| 3 | [name] | [type] | [rating] | [duration] | $[price] | [months] | [age] |

### Booking Sequence

#### Activity 1: [Name]
- **Book by:** [date or "X weeks before travel"]
- **Deposit:** [amount or "full payment at booking"]
- **Cancellation:** [free cancel by X, partial refund by Y, no refund after Z]
- **Documents needed:** [waivers, certifications, medical clearance]
- **Pre-activity prep:** [fitness targets, acclimatization, practice sessions]
- **Day-of logistics:**
  - Check-in: [time] at [location]
  - Transportation: [how to get there]
  - Duration: [start to finish]
  - What to wear: [clothing requirements]

[Repeat for each selected activity]

### Consolidated Gear Checklist

| Item | Activity | Provided | Bring | Rent Available | Rental Cost | Airline Notes |
|------|----------|----------|-------|----------------|-------------|---------------|
| [item] | [activity] | [yes/no] | [yes/no] | [yes/no] | $[cost] | [notes] |

### Risk Assessment Summary

| Activity | Key Risks | Weather Dependency | Nearest Medical | Insurance Note |
|----------|-----------|-------------------|-----------------|----------------|
| [name] | [risks] | [conditions] | [facility] | [coverage note] |

### Day-by-Day Activity Schedule

| Day | Date | Activity | Time | Notes |
|-----|------|----------|------|-------|
| 1 | [date] | [activity or rest/travel] | [time] | [logistics note] |

### Budget Summary

| Activity | Price/Person | Travelers | Subtotal |
|----------|-------------|-----------|----------|
| [name] | $[price] | [count] | $[total] |
| Gear rentals | | | $[total] |
| Transportation to activities | | | $[total] |
| **Total Activity Budget** | | | **$[grand total]** |

### Action Items (Booking Deadlines)
1. [ ] [date]: Book [activity] -- [booking link or method]
2. [ ] [date]: Submit [document] for [activity]
3. [ ] [date]: Begin [preparation] for [activity]
```

## Rules

1. NEVER recommend a specific activity operator or company by name
2. ALWAYS include difficulty ratings on a consistent 1-5 scale for every activity
3. ALWAYS apply the safety filter before presenting any shortlist -- never recommend activities that exceed the group's capability by more than one tier
4. Include cancellation policy details for every booked activity -- travelers need to know refund windows
5. Every gear item must specify whether it is provided, must be brought, or can be rented
6. Price estimates must be per-person ranges, not single figures -- acknowledge seasonal and group-size variation
7. Risk assessments must be factual and proportionate -- avoid both minimizing genuine risks and exaggerating common activities
8. NEVER present activities as safe without qualification -- all adventure activities carry inherent risk
9. Schedule rest days between high-intensity activities -- never stack two difficulty-4+ activities on consecutive days
10. Include transportation logistics between accommodation and each activity location

## Edge Cases

- **Family with young children (under 8):** Many adventure activities have minimum age requirements of 8-16 years. Filter aggressively for age-appropriate options. Suggest parallel activities where adults and children can do different things simultaneously (e.g., adults kayaking while children do a guided nature walk). Always note child-specific safety gear requirements.

- **Medical conditions or physical limitations:** If any traveler has a condition (heart condition, back injury, pregnancy, recent surgery), flag activities that may be contraindicated. Recommend consulting a physician before booking. Note that many operators require medical clearance forms for travelers with disclosed conditions. Do not make medical recommendations -- list the requirements and let the traveler decide with their physician.

- **Extreme weather destination (monsoon, hurricane season, extreme heat):** Activities may be unavailable or significantly altered during adverse seasons. Build contingency options for weather-dependent activities (indoor alternatives, different-day flexibility). Note that some operators cancel with full refunds for weather, while others offer rescheduling only.

- **Remote destination with limited infrastructure:** For destinations far from medical facilities (remote islands, backcountry, developing regions), increase the weight of the risk assessment. Recommend activities with operators who carry satellite communication and first aid equipment. Note evacuation time estimates to the nearest hospital.

- **Budget constraint below activity minimums:** If the per-person budget is below the minimum price for most activities at the destination, prioritize self-guided options (hiking, snorkeling from shore, cycling) over operator-guided experiences. Note the gear rental costs that replace operator fees.

## Example

**Input:** "My partner and I are going to Costa Rica for 10 days in March. We're both moderately fit, have done some hiking and snorkeling before. Budget is about $300 per person for activities total. What adventure activities should we plan?"

**Output:**

## Adventure Activity Plan

**Destination:** Costa Rica
**Travel Dates:** March (10 days)
**Travelers:** Couple, both moderately fit, some hiking and snorkeling experience
**Activity Budget:** $300 per person ($600 total)

### Activity Shortlist

| # | Activity | Type | Difficulty (1-5) | Duration | Price/Person | Best Months | Min Age |
|---|----------|------|-------------------|----------|--------------|-------------|---------|
| 1 | Rainforest canopy zipline tour | Air | 2 | Half-day (3-4 hr) | $50-85 | Year-round | 6 |
| 2 | Guided volcano hike | Land | 3 | Full-day (6-8 hr) | $40-70 | Dec-Apr (dry) | 8 |
| 3 | Snorkeling boat excursion | Water | 2 | Half-day (3-4 hr) | $45-75 | Dec-Apr (calm) | 6 |
| 4 | Whitewater rafting (Class II-III) | Water | 3 | Full-day (5-6 hr) | $70-100 | Year-round | 12 |
| 5 | Night wildlife walking tour | Land | 1 | Evening (2-3 hr) | $30-50 | Year-round | 5 |

### Booking Sequence

#### Activity 1: Rainforest Canopy Zipline Tour
- **Book by:** 1-2 weeks before travel
- **Deposit:** Full payment at booking (most operators)
- **Cancellation:** Free cancellation 48-72 hours before, no refund within 24 hours
- **Documents needed:** Signed liability waiver (provided day-of)
- **Pre-activity prep:** None required -- basic instruction included
- **Day-of logistics:**
  - Check-in: 7:30 AM at operator base (allow 30-45 min transfer from hotel zone)
  - Transportation: Most operators include hotel pickup in price -- confirm at booking
  - Duration: 3-4 hours including safety briefing and transfers
  - What to wear: Closed-toe shoes required, lightweight long pants recommended, no loose scarves or dangling jewelry

#### Activity 2: Guided Volcano Hike
- **Book by:** 1 week before travel (longer for peak season weekends)
- **Deposit:** Full payment or 50% deposit
- **Cancellation:** Free reschedule for weather, 48-hour free cancellation otherwise
- **Documents needed:** None
- **Pre-activity prep:** Break in hiking shoes before the trip -- 3-4 walks of 30+ minutes
- **Day-of logistics:**
  - Check-in: 6:00 AM (early start to avoid afternoon clouds)
  - Transportation: Confirm pickup or self-drive directions at booking
  - Duration: 6-8 hours including transfers and lunch stop
  - What to wear: Hiking shoes with ankle support, layers (temperature drops at elevation), rain shell

#### Activity 3: Snorkeling Boat Excursion
- **Book by:** 3-5 days before (walk-up possible but not guaranteed)
- **Deposit:** Full payment at booking
- **Cancellation:** Weather-dependent cancellation with full refund or reschedule
- **Documents needed:** None
- **Pre-activity prep:** Comfortable treading water for 30+ minutes
- **Day-of logistics:**
  - Check-in: 8:00 AM at marina
  - Transportation: Self-arrange to marina (15-30 min from most hotel zones)
  - Duration: 3-4 hours on water plus 30 min briefing
  - What to wear: Swimsuit, reef-safe sunscreen, cover-up for boat

#### Activity 4: Whitewater Rafting (Class II-III)
- **Book by:** 1-2 weeks before travel
- **Deposit:** Full payment at booking
- **Cancellation:** 48-hour free cancellation, weather cancellations fully refunded
- **Documents needed:** Signed waiver, swim competency self-declaration
- **Pre-activity prep:** Comfortable swimming in moving water
- **Day-of logistics:**
  - Check-in: 7:00 AM at river base
  - Transportation: Most operators include hotel transfers
  - Duration: 5-6 hours including safety briefing, river time, and lunch
  - What to wear: Quick-dry clothing, secured footwear (water sandals with heel strap or old sneakers)

#### Activity 5: Night Wildlife Walking Tour
- **Book by:** 2-3 days before (smaller groups, limited spots)
- **Deposit:** Full payment at booking
- **Cancellation:** 24-hour free cancellation
- **Documents needed:** None
- **Pre-activity prep:** None
- **Day-of logistics:**
  - Check-in: 5:30 PM at park entrance or lodge
  - Transportation: Self-arrange or confirm pickup
  - Duration: 2-3 hours
  - What to wear: Long pants, closed-toe shoes, insect repellent applied, dark colors (no white)

### Consolidated Gear Checklist

| Item | Activity | Provided | Bring | Rent Available | Rental Cost | Airline Notes |
|------|----------|----------|-------|----------------|-------------|---------------|
| Hiking shoes | Volcano hike | No | Yes | No | N/A | Wear on plane or pack in checked bag |
| Rain shell | Volcano hike | No | Yes | No | N/A | Lightweight, packable |
| Snorkel + mask | Snorkeling | Yes | Optional (own is better fit) | Yes at marina | $5-10 | Pack in carry-on if bringing own |
| Reef-safe sunscreen | Snorkeling | No | Yes | Limited | $8-15 | Liquid rules apply for carry-on |
| Water sandals | Rafting | No | Yes | Limited | $5-8 | Pack in checked bag |
| Headlamp or flashlight | Night tour | Sometimes | Recommended | Limited | $3-5 | Pack in checked bag (batteries removed) |
| Insect repellent | Night tour | Sometimes | Yes | Yes locally | $5-10 | Liquid rules apply |
| Daypack (20-30L) | All activities | No | Yes | No | N/A | Use as personal item on flight |
| Reusable water bottle | All activities | No | Yes | No | N/A | Empty through security, fill after |

### Risk Assessment Summary

| Activity | Key Risks | Weather Dependency | Nearest Medical | Insurance Note |
|----------|-----------|-------------------|-----------------|----------------|
| Zipline | Equipment failure (mitigated by dual cable systems), minor abrasion | Closed in lightning storms | Town clinic, 20-30 min | Covered by most travel policies |
| Volcano hike | Altitude fatigue, ankle injury on uneven terrain, sudden weather change | Cancelled in heavy rain or volcanic activity | Park ranger station, town clinic 45-60 min | Covered by most travel policies |
| Snorkeling | Jellyfish stings, sunburn, exhaustion in current | Cancelled in high surf or poor visibility | Boat carries first aid, marina clinic 15 min | Covered by most travel policies |
| Whitewater rafting | Falling from raft, cold water exposure, impact with rocks | Cancelled in flood conditions, runs in rain | River base has first aid, hospital 30-45 min | Verify policy covers water sports |
| Night wildlife tour | Insect bites, uneven terrain in low light | Runs in light rain, cancelled in heavy storms | Lodge or park station, 10-20 min | Covered by most travel policies |

### Day-by-Day Activity Schedule

| Day | Date | Activity | Time | Notes |
|-----|------|----------|------|-------|
| 1 | Arrival | Travel day | -- | Settle in, no activity |
| 2 | Day 2 | Night wildlife tour | 5:30 PM | Low-intensity start |
| 3 | Day 3 | Rainforest zipline tour | 7:30 AM | Half-day, afternoon free |
| 4 | Day 4 | Free / explore town | -- | Rest day before hike |
| 5 | Day 5 | Guided volcano hike | 6:00 AM | Full-day, rest evening |
| 6 | Day 6 | Free / beach day | -- | Recovery day |
| 7 | Day 7 | Snorkeling boat excursion | 8:00 AM | Half-day, afternoon free |
| 8 | Day 8 | Free / local exploration | -- | Rest before rafting |
| 9 | Day 9 | Whitewater rafting | 7:00 AM | Full-day adventure |
| 10 | Day 10 | Departure | -- | Pack and travel |

### Budget Summary

| Activity | Price/Person | Travelers | Subtotal |
|----------|-------------|-----------|----------|
| Zipline tour | $65 (mid-range) | 2 | $130 |
| Volcano hike | $55 (mid-range) | 2 | $110 |
| Snorkeling excursion | $60 (mid-range) | 2 | $120 |
| Whitewater rafting | $85 (mid-range) | 2 | $170 |
| Night wildlife tour | $40 (mid-range) | 2 | $80 |
| **Total Activity Budget** | | | **$610** |

**Per-person total: $305** (slightly over $300 target -- drop night tour to stay within budget, or look for combo discounts on zipline + rafting packages)

### Action Items (Booking Deadlines)

1. [ ] 4 weeks before: Book whitewater rafting (limited weekend spots in March)
2. [ ] 2 weeks before: Book zipline tour and volcano hike
3. [ ] 2 weeks before: Book night wildlife tour (small group, fills quickly)
4. [ ] 1 week before: Book snorkeling excursion
5. [ ] 1 week before: Break in hiking shoes (3-4 practice walks)
6. [ ] 3 days before: Confirm all pickup times and locations
7. [ ] Day before each activity: Check weather forecast and operator cancellation status
