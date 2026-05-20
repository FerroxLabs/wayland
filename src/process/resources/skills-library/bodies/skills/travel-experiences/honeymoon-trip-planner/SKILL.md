---
name: honeymoon-trip-planner
description: |
  Creates romance-optimized travel itineraries for honeymoons and anniversary
  trips. Produces a day-by-day itinerary balancing relaxation, experiences, and
  surprise elements with booking sequences and budget breakdowns. Use when the
  user asks about planning a honeymoon, creating a romantic trip itinerary,
  organizing anniversary travel, or designing a couples getaway. Do NOT use
  for general trip planning (use trip-itinerary-builder), wedding planning
  (use family-relationships event skills), or group travel (use
  group-travel-coordinator).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel itinerary planning event-planning"
  category: "travel-experiences"
  subcategory: "experiences-activities"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Honeymoon Trip Planner

## When to Use

- User asks about planning a honeymoon trip
- User wants a romantic travel itinerary for a couples trip
- User asks about anniversary trip planning
- User wants to include surprise elements in a partners trip
- User needs to balance relaxation and activities for a romantic getaway
- User asks about honeymoon destination comparison
- Do NOT use when: user needs general trip planning without romantic focus (use `trip-itinerary-builder`), user is planning wedding events (use family-relationships skills), user needs group travel coordination (use `group-travel-coordinator`), user needs budget-focused travel (use `budget-travel-planner`)

## Process

1. **Gather couple profile.** Ask the user for:
   - Destination preferences (beach, mountains, city, island, countryside, multi-destination)
   - Travel dates, total duration, and flexible vs. fixed dates
   - Budget (total for the trip, not per person)
   - Travel style (luxury, moderate comfort, adventurous, mix)
   - Activity preferences for both partners (relaxation, adventure, culture, food, nightlife, nature)
   - Any activities one partner loves that the other tolerates (helps with scheduling balance)
   - Physical activity level (low-key, moderate, active)
   - Any dietary restrictions, health considerations, or mobility needs
   - Whether this is post-wedding (fatigue consideration) or a later celebration
   - Surprise element: does one partner want to plan surprises for the other? What kind?

2. **Design the pacing framework.** Honeymoon itineraries require different pacing than standard trips:
   - **Days 1-2:** Recovery and arrival relaxation (especially if immediately post-wedding). Light activities only, no early mornings, no packed schedules.
   - **Days 3-5 (mid-trip):** Peak activity days. Schedule the most memorable experiences here when energy is highest.
   - **Final 1-2 days:** Wind down with low-key activities, revisit favorite spots, pack without rush.
   - **Daily balance rule:** No more than one scheduled activity per half-day. Leave buffer time for spontaneous moments.
   - **Alone time:** Schedule at least one experience where each partner can do something they love solo (spa time, an activity the other skips) if the trip is 7+ days.

3. **Build the experience layer.** Select and schedule romantic and memorable experiences:
   - **Shared experiences:** 2-3 unique-to-destination activities both partners will enjoy
   - **Dining highlights:** 2-3 special dinner experiences (not every dinner needs to be elaborate)
   - **Relaxation anchors:** Daily downtime (pool, beach, room, spa) scheduled as protected time
   - **Surprise elements:** If requested, plan 1-2 surprises (pre-arranged by the planning partner) with logistics and booking instructions that keep the surprise intact
   - **Photography opportunities:** Schedule at least one golden-hour moment at a scenic location for couple photos

4. **Create the booking sequence.** Organize all reservations in chronological order:
   - Accommodation booking (with room type recommendations for the occasion)
   - Special dining reservations (some require 2-4 weeks advance)
   - Activity reservations (with cancellation policies noted)
   - Surprise element bookings (flagged as private to the planning partner)
   - Transportation between segments (if multi-destination)

5. **Build the budget breakdown.** Separate costs into categories:
   - Accommodation (nightly rate x nights)
   - Flights or transportation
   - Dining (special dinners separately from daily meals)
   - Activities and experiences
   - Surprise elements (flagged separately if one partner is planning secretly)
   - Contingency (10-15% of total budget for spontaneous additions)

6. **Assemble the complete honeymoon plan** with day-by-day itinerary, booking timeline, packing suggestions, and a private planning section for surprises.

## Output Format

```
## Honeymoon Itinerary

**Destination:** [destination]
**Dates:** [travel dates]
**Duration:** [nights]
**Style:** [luxury/moderate/adventurous/mixed]
**Budget:** $[total]

### Trip Pacing Overview

| Phase | Days | Focus | Energy Level |
|-------|------|-------|-------------|
| Arrival/Recovery | Days 1-2 | Settle in, decompress | Low -- no early alarms |
| Peak Experiences | Days 3-[N] | Activities, dining, exploration | Moderate to active |
| Wind Down | Final 1-2 days | Revisit favorites, relax | Low -- no packing stress |

### Day-by-Day Itinerary

#### Day [N]: [Theme]
| Time | Activity | Notes | Booked? |
|------|----------|-------|---------|
| Morning | [activity or free time] | [details] | [yes/no/walk-in] |
| Afternoon | [activity or free time] | [details] | [yes/no] |
| Evening | [dinner/activity] | [details] | [reservation needed] |

[Repeat for each day]

### Special Dining Experiences

| Night | Type | Ambiance | Dress Code | Budget | Book By |
|-------|------|----------|------------|--------|---------|
| Day [N] | [type] | [description] | [casual/smart casual/formal] | $[range] | [advance time] |

### Surprise Elements (PRIVATE -- for planning partner only)

| Day | Surprise | Logistics | Cost | Booking Deadline |
|-----|---------|-----------|------|-----------------|
| [day] | [description] | [how to arrange without partner knowing] | $[cost] | [date] |

### Booking Timeline

| Weeks Before | What to Book | Notes |
|-------------|-------------|-------|
| 8-12 weeks | [items] | [details] |
| 4-8 weeks | [items] | [details] |
| 1-2 weeks | [items] | [details] |

### Budget Breakdown

| Category | Estimated Cost | % of Budget |
|----------|---------------|-------------|
| Accommodation | $[amount] | [%] |
| Flights/Transport | $[amount] | [%] |
| Dining (special) | $[amount] | [%] |
| Dining (daily) | $[amount] | [%] |
| Activities | $[amount] | [%] |
| Surprises | $[amount] | [%] |
| Contingency (10-15%) | $[amount] | [%] |
| **Total** | **$[amount]** | **100%** |

### Packing Notes for Honeymoon
- [occasion-specific packing suggestions]
```

## Rules

1. NEVER pack the schedule like a sightseeing trip -- honeymoon pacing prioritizes quality of moments over quantity of activities
2. ALWAYS include at least 2 hours of unscheduled downtime per day
3. ALWAYS schedule the first 1-2 days as low-key recovery, especially for post-wedding trips
4. Include golden-hour timing for at least one scenic couple photo opportunity
5. Special dining reservations should be spaced out -- not every dinner needs to be a production
6. If surprise elements are requested, include a private section with logistics that can be hidden from the other partner
7. Budget must include a 10-15% contingency for spontaneous romantic additions
8. NEVER recommend specific hotels, restaurants, or venues by name -- describe the type, ambiance, and price tier
9. Balance both partners' preferences -- if one wants adventure and the other wants relaxation, alternate days or split half-days
10. Include practical notes about room type recommendations for the occasion (upgraded room categories, view requests, arrival amenities)

## Edge Cases

- **Immediately post-wedding (next day departure):** The couple will be physically and emotionally exhausted. Schedule nothing for Day 1 except arrival and settling in. Day 2 should be purely relaxation. Push all activities to Day 3 onward. Note that jet lag combined with wedding fatigue compounds recovery time.

- **One partner planned everything, wants to surprise the other:** Create a two-layer itinerary: the shared version shows the framework (destinations, dates, general activities) while a private addendum contains surprise details, booking instructions, and logistics. Note that some surprises require coordination with accommodation staff -- include the conversation script.

- **Significant budget constraint:** Focus spending on 1-2 splurge experiences rather than spreading a small budget thin across many mediocre ones. A single memorable dinner or excursion creates stronger memories than five average ones. Identify free or low-cost romantic activities at the destination (beach sunset, hilltop viewpoint, morning market walk).

- **Multi-destination honeymoon (2-3 locations):** Limit to 3 destinations maximum for trips under 14 days. Minimum 3 nights per location to avoid feeling rushed. Schedule transit days as rest days (no activities on travel days). Place the most relaxing destination last so the couple returns home rested.

- **Accessibility needs (mobility, dietary, sensory):** Research accessibility of recommended experience types at the destination. Note which romantic activities require physical agility and offer alternatives. For dietary restrictions, verify that special dining experiences can accommodate -- contact in advance rather than hoping on arrival.

## Example

**Input:** "We're planning our honeymoon for early June, 10 nights. We both like beach and some culture but nothing too intense. Budget is around $6,000 total including flights. We're leaving 2 days after the wedding. I'd love to plan one surprise dinner for my partner."

**Output:**

## Honeymoon Itinerary

**Destination:** Beach destination with cultural access (island or coastal region)
**Dates:** Early June, 10 nights
**Duration:** 10 nights / 11 days
**Style:** Moderate comfort with relaxation focus
**Budget:** $6,000 total

### Trip Pacing Overview

| Phase | Days | Focus | Energy Level |
|-------|------|-------|-------------|
| Arrival/Recovery | Days 1-3 | Beach, sleep in, pool | Very low -- post-wedding rest |
| Peak Experiences | Days 4-7 | Cultural day trips, special dinners, water activities | Moderate |
| Wind Down | Days 8-10 | Beach return, revisit favorites, slow mornings | Low -- no schedule pressure |

### Day-by-Day Itinerary

#### Day 1: Arrival and Collapse
| Time | Activity | Notes | Booked? |
|------|----------|-------|---------|
| Arrival | Check in, unpack slowly | Request early check-in if flying overnight | Pre-arranged |
| Afternoon | Pool or beach, nap | No plans, no alarms | N/A |
| Evening | Room service or casual walkable dinner | Do not dress up -- comfortable clothes, bare feet | Walk-in |

#### Day 2: Recovery Day
| Time | Activity | Notes | Booked? |
|------|----------|-------|---------|
| Morning | Sleep in, late breakfast | Do not set an alarm | N/A |
| Afternoon | Beach or pool, read, swim | Establish your beach spot for the trip | N/A |
| Evening | Casual beachside dinner | Walk to something close, explore the immediate area | Walk-in |

#### Day 3: Gentle Exploration
| Time | Activity | Notes | Booked? |
|------|----------|-------|---------|
| Morning | Late breakfast, morning swim | Still no early starts | N/A |
| Afternoon | Walk the nearby town or village, browse local shops | First light exploration, find your bearings | N/A |
| Evening | Sunset from a scenic viewpoint + dinner at a casual restaurant with a view | Find a spot with western exposure | Walk-in |

#### Day 4: First Activity Day
| Time | Activity | Notes | Booked? |
|------|----------|-------|---------|
| Morning | Snorkeling or kayaking excursion (half-day, beginner-friendly) | First scheduled activity -- choose water-based for a beach destination | Book 1 week before |
| Afternoon | Free -- rest from morning activity | Pool, nap, or explore | N/A |
| Evening | **Special Dinner #1** -- upscale restaurant with sunset view, smart casual | Book 4 weeks ahead, request window or terrace table | Reservation required |

#### Day 5: Cultural Day
| Time | Activity | Notes | Booked? |
|------|----------|-------|---------|
| Morning | Visit a historical site, temple, or old town (2-3 hours) | Schedule 9-11 AM before heat peaks | Walk-in or timed entry |
| Afternoon | Return to accommodation, pool time | Decompress after cultural outing | N/A |
| Evening | Dinner at a local food district -- casual, explore and choose on the spot | Walk the area, pick what looks inviting | Walk-in |

#### Day 6: Free Day
| Time | Activity | Notes | Booked? |
|------|----------|-------|---------|
| Morning | Whatever you want -- no schedule | Sleep in or early beach walk, couple's choice | N/A |
| Afternoon | Spa experience (couple's treatment if available) | Book 1-2 weeks ahead; 60-90 min treatment | Reservation needed |
| Evening | **Surprise Dinner** (see private section below) | Planning partner handles logistics | Pre-arranged |

#### Day 7: Second Activity Day
| Time | Activity | Notes | Booked? |
|------|----------|-------|---------|
| Morning | Boat tour, island hop, or guided nature experience (half-day) | Second and final scheduled excursion | Book 1-2 weeks ahead |
| Afternoon | Free -- beach or explore a new neighborhood | Light afternoon after morning activity | N/A |
| Evening | Casual dinner, perhaps revisit a favorite spot from earlier in the trip | No reservation needed | Walk-in |

#### Day 8: Wind Down Begins
| Time | Activity | Notes | Booked? |
|------|----------|-------|---------|
| All day | Beach day -- no plans, no obligations | Reclaim the relaxation mode | N/A |
| Evening | Golden-hour couple photo session at the most scenic spot you found | Bring camera or phone, dress nicely, capture the trip | Self-directed |

#### Day 9: Last Full Day
| Time | Activity | Notes | Booked? |
|------|----------|-------|---------|
| Morning | Revisit the best breakfast spot or market from the trip | Repeat the highlight | Walk-in |
| Afternoon | Final beach or pool session, start light packing | Do not leave all packing for tomorrow | N/A |
| Evening | **Special Dinner #2** -- farewell dinner at a memorable setting | Book 2-3 weeks ahead | Reservation needed |

#### Day 10: Departure Prep
| Time | Activity | Notes | Booked? |
|------|----------|-------|---------|
| Morning | Slow morning, final pack | Request late checkout if available | Pre-arranged |
| Afternoon/Evening | Depart or enjoy remaining time if evening flight | Keep one carry-on item of beach gear accessible for a last swim | N/A |

### Special Dining Experiences

| Night | Type | Ambiance | Dress Code | Budget | Book By |
|-------|------|----------|------------|--------|---------|
| Day 4 | Upscale coastal restaurant | Terrace with sunset, candlelit tables | Smart casual | $100-150 for two | 4 weeks before |
| Day 9 | Farewell dinner, scenic setting | Elevated or waterfront, intimate atmosphere | Smart casual | $80-120 for two | 2-3 weeks before |

### Surprise Elements (PRIVATE -- for planning partner only)

| Day | Surprise | Logistics | Cost | Booking Deadline |
|-----|---------|-----------|------|-----------------|
| Day 6 | Private beachside dinner setup (table on beach or terrace, candles, pre-ordered menu) | Contact accommodation concierge 2 weeks before arrival. Request: table for two at sunset location, candle or lantern lighting, pre-selected 3-course menu with wine pairing. Ask them to set up while you take your partner for a "short walk." Budget $120-180 for two including wine. | $120-180 | 2 weeks before arrival |

**How to keep it secret:** Tell your partner that you have "a casual dinner idea" for Day 6. Walk toward the setup location at the right time. The concierge handles the reveal.

### Booking Timeline

| Weeks Before | What to Book | Notes |
|-------------|-------------|-------|
| 8-12 weeks | Flights, accommodation | Request room upgrade for honeymoon, mention occasion at booking |
| 4-6 weeks | Special Dinner #1 reservation | Request terrace/sunset table, mention anniversary or honeymoon |
| 2-3 weeks | Spa treatment, Surprise dinner (via concierge), Special Dinner #2, Activity excursions | Spa and excursions fill quickly in peak season |
| 1 week | Confirm all reservations | Call or email to reconfirm |
| Day before each | Reconfirm dinner reservations | Especially the surprise dinner logistics |

### Budget Breakdown

| Category | Estimated Cost | % of Budget |
|----------|---------------|-------------|
| Flights (2 roundtrip) | $1,200-1,800 | 25-30% |
| Accommodation (10 nights at $150-200/night) | $1,500-2,000 | 30-33% |
| Special dinners (3 total including surprise) | $300-450 | 6-8% |
| Daily meals (7 days at $60-80/day for two) | $420-560 | 8-10% |
| Activities (2 excursions) | $150-250 | 3-5% |
| Spa treatment | $100-180 | 2-3% |
| Local transportation | $100-200 | 2-3% |
| Contingency (10%) | $600 | 10% |
| **Total** | **$4,370-6,040** | **~100%** |

**Note:** At the $6,000 total budget, there is comfortable room for all planned experiences with contingency. The midpoint of each range keeps the total around $5,200, leaving $800 for spontaneous additions.

### Packing Notes for Honeymoon
- **Smart casual outfit (x2):** For special dinners -- lightweight dress or linen shirt and trousers
- **Swimwear (x2-3):** Rotate to allow drying
- **Cover-up or sarong:** For walking from beach to restaurant
- **Comfortable walking shoes:** For cultural day and town exploration
- **Sandals:** For beach and casual evenings
- **Reef-safe sunscreen:** Essential for water activities and beach days
- **One "surprise outfit":** If the planning partner wants their partner to dress up for the surprise dinner, pack it in your own luggage
- **Camera or phone tripod:** For couple photos at golden hour (Day 8)
