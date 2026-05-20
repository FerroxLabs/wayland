---
name: jet-lag-recovery-plan
description: |
  Creates a jet lag recovery protocol covering pre-travel light schedule
  adjustment, in-flight strategies, and arrival adaptation plan. Produces a
  day-by-day recovery timeline with sleep, light exposure, meal timing, and
  activity scheduling customized to the route and time zone difference. Use
  when the user asks about managing jet lag, adjusting to a new time zone,
  preparing for long-haul travel, or recovering from east-west or west-east
  flights. Do NOT use for travel day logistics (use travel-day-optimizer),
  general sleep improvement (use health-wellness sleep skills), or flight
  booking (use airfare-search-strategy).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel planning checklist health-wellness"
  category: "travel-experiences"
  subcategory: "travel-logistics"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Jet Lag Recovery Plan

## When to Use

- User asks about managing or preventing jet lag
- User is traveling across 3 or more time zones and wants an adaptation plan
- User asks about adjusting sleep schedule before a trip
- User wants in-flight strategies for time zone changes
- User asks about how to recover from jet lag after arrival
- User needs a day-by-day recovery timeline for a specific route
- Do NOT use when: user needs travel day scheduling (use `travel-day-optimizer`), user needs general sleep hygiene improvement (use health-wellness skills), user is traveling across fewer than 3 time zones (adjustment is typically minor), user needs flight booking advice (use `airfare-search-strategy`)

## Process

1. **Gather travel details.** Ask the user for:
   - Origin city and time zone
   - Destination city and time zone
   - Direction of travel (eastbound or westbound)
   - Number of time zones crossed
   - Departure and arrival times (local times at each end)
   - Trip duration at destination (short trip vs. extended stay changes the strategy)
   - Flight duration and any layovers
   - Return trip timing (to plan for return jet lag if relevant)
   - Personal factors: age, caffeine sensitivity, sleep pattern (early bird vs. night owl), any sleep difficulties
   - Trip purpose: leisure (can rest on arrival) vs. business (must perform on Day 1)

2. **Assess the jet lag profile.** Calculate and classify:
   - **Time zone difference:** Number of hours ahead or behind
   - **Direction factor:** Eastbound travel (losing hours, harder to adjust -- body must advance its clock) vs. westbound (gaining hours, easier -- body must delay its clock)
   - **Adaptation rate:** The body adjusts approximately 1-1.5 hours per day. Calculate expected full adjustment time: time zone difference / 1.5 = days to full adjustment
   - **Severity classification:**
     - Mild: 3-5 zones (2-4 days to adjust)
     - Moderate: 6-8 zones (4-6 days to adjust)
     - Severe: 9-12 zones (6-9 days to adjust)
   - **Short trip exception:** If the trip is 2-3 days or fewer, full adjustment may not be worth pursuing. Consider staying on home time instead.

3. **Build the pre-travel adjustment.** Starting 3-5 days before departure:
   - **Eastbound:** Gradually shift bedtime and wake time 30-60 minutes earlier each day
   - **Westbound:** Gradually shift bedtime and wake time 30-60 minutes later each day
   - **Light exposure timing:** Align light exposure with the destination schedule (morning light for eastbound, evening light for westbound)
   - **Meal timing:** Begin shifting meal times toward the destination schedule (30-60 minutes per day)
   - **Caffeine management:** Reduce caffeine use 3 days before travel to improve sleep flexibility

4. **Create the in-flight protocol.** Based on departure time, arrival time, and flight duration:
   - **Set watch to destination time immediately** at boarding
   - **Sleep plan:** If arriving in the morning (destination time), sleep on the plane. If arriving in the evening, stay awake.
   - **Light exposure:** If the flight is during destination daytime, keep the window shade open or use a reading light. If destination nighttime, wear an eye mask.
   - **Hydration:** Target 250 mL (8 oz) of water per hour of flight. Avoid alcohol (disrupts sleep quality and dehydrates).
   - **Caffeine timing:** Use caffeine strategically -- drink coffee during the first half of destination morning, avoid after destination 2 PM.
   - **Movement:** Stand and walk the aisle every 2 hours during waking periods.
   - **Meal timing:** Eat meals at destination meal times, regardless of when the airline serves food.

5. **Build the arrival adaptation plan.** Day-by-day protocol for the first 3-5 days:
   - **Sleep timing:** When to go to sleep and when to wake up each day, gradually shifting toward the local schedule
   - **Light exposure schedule:** When to seek bright light (outdoors) and when to avoid it, based on direction and current adaptation stage
   - **Meal timing:** When to eat to reinforce the new schedule
   - **Activity intensity:** What types of activities are appropriate for each adaptation day (low-intensity on Day 1, building to normal)
   - **Nap rules:** If and when napping is acceptable (short naps of 20-30 minutes before 2 PM local time only)
   - **Caffeine window:** When caffeine is helpful vs. when it will disrupt nighttime sleep

6. **Compile the complete jet lag plan** with pre-travel schedule, in-flight protocol, and day-by-day arrival adaptation timeline.

## Output Format

```
## Jet Lag Recovery Plan

**Route:** [origin] to [destination]
**Time Zone Change:** [+/- hours] ([eastbound/westbound])
**Severity:** [mild / moderate / severe]
**Expected Full Adjustment:** [days]
**Trip Duration:** [nights]

### Jet Lag Profile

| Factor | Detail |
|--------|--------|
| Zones crossed | [number] |
| Direction | [east/west] (body must [advance/delay] clock) |
| Flight duration | [hours] |
| Departure (local) | [time] |
| Arrival (local) | [time] |
| Body clock on arrival | [equivalent home time] |
| Adjustment rate | ~1-1.5 hours per day |

### Pre-Travel Adjustment (3-5 Days Before)

| Day | Wake Time | Bedtime | Light Exposure | Meals | Notes |
|-----|-----------|---------|----------------|-------|-------|
| Day -3 | [time] | [time] | [morning/evening, duration] | [shifted timing] | [notes] |
| Day -2 | [time] | [time] | [light plan] | [shifted timing] | [notes] |
| Day -1 | [time] | [time] | [light plan] | [shifted timing] | [notes] |

### In-Flight Protocol

| Phase | Destination Time | Action |
|-------|------------------|--------|
| Boarding | [time] | [set watch, begin sleep or wake strategy] |
| [time block] | [time range] | [sleep / stay awake / eat / hydrate] |
| Pre-landing | [time] | [preparation for arrival] |

### Arrival Adaptation (Day-by-Day)

#### Day 1: [Arrival Day]
| Time (Local) | Body Clock | Action | Purpose |
|-------------|------------|--------|---------|
| [time] | [home time equivalent] | [specific action] | [why this helps adaptation] |

[Repeat for Days 2-5]

### Light Exposure Schedule

| Day | Seek Light (go outside) | Avoid Light (stay dim) | Why |
|-----|------------------------|----------------------|-----|
| Day 1 | [time window] | [time window] | [shift direction] |

### Nap Rules
- [when napping is acceptable and for how long]

### Caffeine Strategy

| Day | Caffeine OK Window | No Caffeine After |
|-----|-------------------|-------------------|
| Day 1 | [window] | [cutoff time] |

### Recovery Timeline

| Day | Expected Adjustment | How You Will Feel |
|-----|--------------------|--------------------|
| Day 1 | [hours adjusted] | [description] |
| Day 2 | [hours adjusted] | [description] |
| [continue until full adjustment] |
```

## Rules

1. NEVER present jet lag adaptation as instant -- the body adjusts at 1-1.5 hours per day maximum. Set realistic expectations.
2. ALWAYS note the direction of travel -- eastbound and westbound require opposite strategies
3. ALWAYS include light exposure timing as the primary jet lag tool -- light is the strongest circadian signal
4. Include specific times for every recommendation -- "get morning light" is too vague; "go outside between 8-10 AM local time" is actionable
5. Naps must be limited to 20-30 minutes and only before 2 PM local time -- longer or later naps delay adaptation
6. Caffeine is a tool, not a cure. Include a cutoff time (typically 8+ hours before desired bedtime) for every day
7. NEVER recommend sleeping pills or melatonin supplements -- this skill teaches behavioral adaptation, not medication. Note that travelers who want supplement guidance should consult their physician.
8. Include hydration recommendations for in-flight protocol -- dehydration worsens jet lag symptoms
9. For short trips (3 days or fewer), recommend partial adaptation or staying on home time rather than full adjustment
10. Include realistic "how you will feel" descriptions for each day so the traveler knows what to expect

## Edge Cases

- **Short business trip (2-3 days):** Full adaptation takes longer than the trip. Recommend staying on home time: schedule meetings during the overlap of home-waking and destination-waking hours. Sleep and eat on home time as much as possible. Use caffeine strategically during meetings. Accept that some fatigue is unavoidable.

- **Extreme zone change (10-12 zones):** At 10+ zones, eastbound vs. westbound distinction breaks down because traveling 10 zones east is nearly equivalent to 14 zones west. The body may adapt faster by going "the wrong way" (treating a 10-zone eastbound shift as a 14-zone westbound shift). Note both options and recommend the shorter adaptation path.

- **Overnight arrival (red-eye landing in early morning):** The traveler arrives exhausted but at the start of a full destination day. Protocol: resist the urge to sleep on arrival. Take a short nap (20-30 minutes maximum) if absolutely necessary, then push through to local bedtime. Get bright outdoor light immediately after arriving. Caffeine is acceptable until local 2 PM. Go to bed at local 9-10 PM even if exhausted earlier.

- **Traveler with existing sleep difficulties:** For travelers who already struggle with sleep, jet lag is compounded. Emphasize the behavioral tools (light, meals, activity) over sleep pressure (trying to force sleep at specific times). Accept that the first 2-3 nights may involve fragmented sleep. Avoid long naps that make nighttime sleep even harder. Maintain a consistent wake time even if nighttime sleep is poor.

- **Sequential time zone changes (multi-destination trip):** If the traveler moves through 3+ time zones at the first destination and then another 3+ at the second, they may be adapting to the second shift before fully recovering from the first. Recommend at least 3-4 nights at each destination for adaptation. If destinations are close in time zones (within 2 hours of each other), treat them as a single adaptation event.

## Example

**Input:** "I'm flying from New York (EST) to Tokyo (JST) for a 10-day vacation. Flight departs at 1 PM and arrives at 4 PM the next day (Tokyo time). I'm not great with early mornings normally. How do I handle the jet lag?"

**Output:**

## Jet Lag Recovery Plan

**Route:** New York (EST, UTC-5) to Tokyo (JST, UTC+9)
**Time Zone Change:** +14 hours (eastbound)
**Severity:** Severe (14 zones, but effectively -10 zones westbound adaptation may be easier)
**Expected Full Adjustment:** 7-9 days
**Trip Duration:** 10 nights (adequate for full adaptation)

### Jet Lag Profile

| Factor | Detail |
|--------|--------|
| Zones crossed | 14 eastbound (or equivalently, 10 westbound) |
| Direction | Eastbound -- but at 14 zones, the body may adapt westbound (delaying the clock by 10 hours is easier than advancing by 14) |
| Flight duration | ~14 hours |
| Departure (New York) | 1:00 PM EST |
| Arrival (Tokyo) | 4:00 PM JST (next day) |
| Body clock on arrival | 2:00 AM EST (you will feel like it is 2 AM) |
| Adjustment rate | ~1-1.5 hours per day = 7-10 days for full adjustment |

**Key insight:** Your body does not know "east" or "west" -- it takes the shortest path. Advancing your clock 14 hours is harder than delaying it 10 hours. Your body will likely adapt by delaying (shifting bedtime later and later) rather than advancing (trying to sleep earlier and earlier). The plan below supports this natural westbound-style adaptation.

### Pre-Travel Adjustment (3 Days Before)

| Day | Wake Time | Bedtime | Light Exposure | Meals | Notes |
|-----|-----------|---------|----------------|-------|-------|
| Day -3 | Normal (your usual) | 30 min later than usual | Bright light in the evening (7-9 PM) | Dinner 30 min later | Start shifting your body clock later |
| Day -2 | 30 min later | 60 min later than usual | Bright light in the evening (7-9 PM) | All meals 30 min later | Continue the shift |
| Day -1 | 60 min later | 90 min later than usual | Evening light, dim morning light | All meals 60 min later | Pack with the lights on to maintain evening alertness |

*Since you are not a morning person, delaying your schedule will feel natural.*

### In-Flight Protocol

| Phase | Destination Time (JST) | Your Body Clock (EST) | Action |
|-------|------------------------|-----------------------|--------|
| Boarding (1 PM EST) | 3:00 AM JST | 1:00 PM | Stay awake -- it is your body's afternoon. Watch a movie, read. |
| First meal service (3 PM EST) | 5:00 AM JST | 3:00 PM | Eat the meal -- treat it as your lunch (body clock agrees) |
| 6:00 PM EST | 8:00 AM JST | 6:00 PM | Put on eye mask. Try to sleep for 4-6 hours. This aligns with your body's evening/night. |
| 12:00 AM EST (in flight) | 2:00 PM JST | 12:00 AM | If awake, keep lights dim. Sip water. Try to rest even if not sleeping. |
| Second meal service (~3 AM EST) | 5:00 PM JST (pre-landing) | 3:00 AM | Wake up, eat the meal. Begin treating it as late afternoon. Splash water on face, use eye drops. |
| Landing (4:00 PM JST) | 4:00 PM JST | 2:00 AM | Your body thinks it is 2 AM. You will be exhausted. This is expected. |

**Hydration target:** 250 mL (8 oz) per waking hour = approximately 2 liters during the flight. Avoid alcohol entirely.

### Arrival Adaptation (Day-by-Day)

#### Day 1: Arrival Day (Body Clock: 2 AM when it is 4 PM local)
| Time (Local JST) | Body Clock (EST) | Action | Purpose |
|-------------------|-------------------|--------|---------|
| 4:00 PM | 2:00 AM | Land. Get through immigration and to accommodation. | Minimize decisions -- have transfer pre-arranged |
| 5:30 PM | 3:30 AM | Arrive at accommodation. Do NOT lie down on the bed. | Lying down triggers sleep you cannot afford yet |
| 6:00-7:30 PM | 4:00-5:30 AM | Go outside for a short walk (30-45 min). Get light exposure. Have a light dinner. | Evening light delays body clock (desired direction). Fresh air + activity combat fatigue. |
| 8:00 PM | 6:00 AM | Return to accommodation. Begin wind-down. Dim lights. | Your body is starting to wake up -- resist the urge to stay up late |
| 9:00-9:30 PM | 7:00-7:30 AM | Go to bed. Eye mask, dark room, cool temperature. | You are sleeping during your body's morning -- use blackout and mask |

*You will likely wake up at 2-4 AM local time (12-2 PM body clock). This is normal. Stay in bed in the dark. If still awake after 30 minutes, read in dim light until drowsy.*

#### Day 2: First Full Day (Body Clock: Shifted ~1-2 hours)
| Time (Local JST) | Body Clock (approx) | Action | Purpose |
|-------------------|---------------------|--------|---------|
| 6:00-7:00 AM | ~4:00-5:00 PM (previous day feel) | Wake up. Even if awake since 3 AM, get up by 7:00. | Anchoring wake time is the most powerful adaptation tool |
| 7:00-8:00 AM | -- | Go outside into bright morning light for 30+ minutes. Walk, explore the neighborhood, get breakfast. | Morning light advances your clock (now working both directions) |
| 8:00 AM-12:00 PM | -- | Light activities only. Visit nearby sites. Stay outdoors as much as possible. | Light exposure + gentle activity. Avoid anything requiring sharp focus. |
| 12:00-1:00 PM | -- | Lunch at local time | Meal timing reinforces clock |
| 1:00-2:00 PM | -- | If severely fatigued: take ONE nap, 20-30 minutes maximum. Set an alarm. | Short nap restores function without disrupting night sleep |
| 2:00-6:00 PM | -- | Continue light activities. Stay outside when possible. No caffeine after 2 PM. | Afternoon light continues adaptation |
| 6:00-7:00 PM | -- | Dinner | Eat at local time |
| 9:00-10:00 PM | -- | Bedtime | Aim for 10 PM. You may fall asleep easily (fatigue accumulation) |

#### Day 3: Building Adaptation (~3 hours shifted)
| Time (Local JST) | Action | Notes |
|-------------------|--------|-------|
| 6:30-7:00 AM | Wake up, morning light outside | You may sleep slightly longer tonight -- progress |
| Morning | Moderate activity -- sightseeing, walking | Energy improving |
| Afternoon | Normal activity level. Short nap only if necessary (by Day 3, try to skip it). | Push through afternoon fatigue |
| 9:30-10:00 PM | Bedtime | Sleep should be more consolidated |

#### Day 4-5: Significant Improvement (~5-7 hours shifted)
- Wake at 6:30-7:00 AM consistently
- Morning light for 20+ minutes
- Normal activity levels through the day
- You may feel an energy dip at 2-4 PM (your body's old late-night zone) -- this is normal and diminishing
- Bedtime at 10:00-10:30 PM

#### Day 6-7: Near-Full Adaptation (~8-10 hours shifted)
- Sleep should feel nearly normal
- Occasional early waking (5 AM) may persist -- get up and use the time
- Energy through the day is close to normal
- By Day 7-9, most travelers report feeling fully adjusted

### Light Exposure Schedule

| Day | Seek Bright Light (outdoor, 30+ min) | Avoid Bright Light | Why |
|-----|--------------------------------------|-------------------|-----|
| Day 1 (arrival PM) | 6:00-7:30 PM | After 8:00 PM (dim lights) | Evening light delays clock (desired) |
| Day 2 | 7:00-9:00 AM + afternoon outdoors | Before 6:00 AM (stay in dark room) | Morning light begins advancing clock to local |
| Day 3 | 7:00-8:30 AM | Before 5:30 AM | Continue morning advance |
| Day 4-5 | 7:00-8:00 AM (normal morning exposure) | No restriction needed | Clock is approaching local alignment |
| Day 6+ | Normal outdoor activity | Normal | Adapted |

### Nap Rules

- **Day 1 (arrival):** No nap -- push through to 9 PM bedtime
- **Day 2:** One nap allowed, maximum 30 minutes, before 2 PM local time. Set an alarm.
- **Day 3:** Try to skip the nap. If you must: 20 minutes maximum, before 1 PM.
- **Day 4+:** No naps. If drowsy in the afternoon, walk outside in bright light instead.

### Caffeine Strategy

| Day | Caffeine OK Window (local time) | No Caffeine After | Notes |
|-----|--------------------------------|-------------------|-------|
| Day 1 (arrival PM) | 4:00-6:00 PM | 6:00 PM | One coffee on arrival to stay awake until bedtime |
| Day 2 | 7:00 AM-1:00 PM | 1:00 PM | Morning caffeine only; strict afternoon cutoff |
| Day 3 | 7:00 AM-2:00 PM | 2:00 PM | Slightly relaxed cutoff as sleep improves |
| Day 4+ | Normal (7:00 AM-2:00 PM) | 2:00 PM | Standard caffeine hygiene |

### Recovery Timeline

| Day | Expected Adjustment | How You Will Feel |
|-----|--------------------|--------------------|
| Day 1 | 0 hours (arrival) | Exhausted, disoriented, fighting to stay awake. Everything feels surreal. This is the hardest day. |
| Day 2 | 1-2 hours | Very tired but functional. Alert in the morning, crashing by 2-4 PM. Sleep may be fragmented (wake at 3-4 AM). |
| Day 3 | 3-4 hours | Noticeably better. Morning energy good. Afternoon dip still present. Sleep improving -- may wake at 4-5 AM. |
| Day 4 | 5-6 hours | Good energy most of the day. Mild tiredness in late afternoon. Sleeping closer to full night. |
| Day 5 | 6-7 hours | Near-normal energy. Sleep timing approaching local schedule. |
| Day 6-7 | 8-9 hours | Feeling almost fully adjusted. Minor residual effects (early waking). |
| Day 8-10 | Full adaptation | Normal sleep-wake cycle on Tokyo time. Enjoy the remainder of the trip fully adjusted. |

### Return Trip Note

When you fly back (Tokyo to New York), you will experience jet lag in reverse: arriving with your body 14 hours ahead. The same principles apply but in the opposite direction. The return is typically easier because you are returning to your familiar home schedule and routine. Expect 4-6 days of adjustment upon return.
