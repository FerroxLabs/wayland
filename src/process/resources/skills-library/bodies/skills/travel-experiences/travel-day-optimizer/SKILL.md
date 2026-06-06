---
name: travel-day-optimizer
description: |
  Creates minute-by-minute travel day schedules from departure to arrival,
  covering airport timelines, transit connections, check-in sequences, and
  contingency buffers. Produces a complete travel day checklist with time
  stamps, action items, and what-if scenarios for delays. Use when the user
  asks about organizing a travel day, planning airport timing, creating a
  departure-to-arrival schedule, or managing tight connections. Do NOT use for
  multi-day trip itineraries (use trip-itinerary-builder), packing guidance
  (use packing-list-builder), or airport navigation (use
  airport-navigation-guide).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel checklist step-by-step planning"
  category: "travel-experiences"
  subcategory: "travel-logistics"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Travel Day Optimizer

## When to Use

- User asks about planning their travel day schedule
- User needs a timeline from home to destination including airport, transit, and arrival logistics
- User asks about how early to arrive at the airport
- User wants a step-by-step departure day checklist
- User needs to plan for a tight connection or multi-segment journey
- User asks about managing travel day logistics with children, pets, or special needs
- Do NOT use when: user needs a multi-day trip itinerary (use `trip-itinerary-builder`), user needs packing guidance (use `packing-list-builder`), user needs airport terminal navigation (use `airport-navigation-guide`), user needs flight search strategy (use `airfare-search-strategy`)

## Process

1. **Gather travel day details.** Ask the user for:
   - Departure point (home address area or hotel)
   - Flight time(s) and airline(s)
   - Domestic or international flight
   - Number of connections and layover durations
   - Travelers (solo, couple, family with children ages, group size)
   - Luggage situation (carry-on only, checked bags, oversized items)
   - Transportation to airport (personal car with parking, ride service, public transit, hotel shuttle)
   - Any special circumstances (mobility needs, traveling with pet, first-time flyer, visa control required)
   - Return trip details (if building the arrival day schedule at destination)
   - Known airport factors (construction, busy terminal, small regional airport)

2. **Calculate the departure timeline.** Work backward from flight departure:
   - **Gate close time:** Flight departure minus 15-30 minutes (boarding starts 30-45 minutes before departure)
   - **Security clearance:** Allow 15 minutes (small airport, known traveler) to 60+ minutes (major hub, peak hours, international)
   - **Check-in and bag drop:** 0 minutes (online check-in, carry-on only) to 30-45 minutes (bag drop queue, counter check-in)
   - **Customs/immigration (international):** 0 minutes (domestic) to 20-45 minutes (passport control, departure immigration)
   - **Airport arrival target:** Sum of all above steps plus 15-minute buffer
   - **Transit to airport:** Estimate door-to-terminal time including parking, shuttle, or transit walk
   - **Pre-departure home tasks:** Final packing check, home security (lock doors, set thermostat), pet arrangements
   - **Wake-up time:** Transit departure time minus preparation time (shower, dress, final check)

3. **Build the connection timeline (if applicable).** For each layover:
   - **Minimum connection time:** Airline's official MCT for the airport (domestic-to-domestic, domestic-to-international, international-to-international)
   - **Terminal change required?** Factor in inter-terminal transit (train, bus, walking)
   - **Re-screening required?** Some connections require passing through security again
   - **Immigration/customs at connection:** International arrivals connecting domestically must clear customs
   - **Buffer assessment:** Layover duration minus required activities = available buffer. Flag if buffer is under 30 minutes.

4. **Build the arrival timeline.** From landing to final destination:
   - **Taxi to gate:** 5-15 minutes after landing
   - **Deplane:** 10-20 minutes (front of plane to back)
   - **Immigration/customs (international arrival):** 15-60 minutes depending on destination and queues
   - **Baggage claim:** 15-30 minutes after deplaning (checked bags)
   - **Ground transportation:** Ride service wait (5-15 min), public transit (check schedule), rental car (20-40 min with shuttle and paperwork), pre-arranged transfer (5-10 min)
   - **Transit to accommodation:** Drive or transit time from airport to hotel or destination
   - **Check-in:** Note check-in time at accommodation (early arrival may mean luggage storage)

5. **Create contingency plans.** For each risk point:
   - **Late departure from home:** Identify the latest possible airport arrival that still makes the flight
   - **Long security line:** Strategies (known traveler programs, alternative screening lanes)
   - **Flight delay:** Connection impact, rebooking rights, airline communication
   - **Missed connection:** Rebooking process, overnight options, travel insurance contact
   - **Lost luggage:** Filing process at destination, essentials in carry-on

6. **Compile the complete travel day schedule** with timestamped action items, contingency triggers, and a printable quick-reference card.

## Output Format

```
## Travel Day Schedule

**Route:** [origin] to [destination]
**Flight(s):** [flight numbers and times]
**Travelers:** [who]
**Luggage:** [carry-on only / checked bags]

### Timeline Summary

| Time | Action | Location | Notes |
|------|--------|----------|-------|
| [time] | Wake up | Home | [prep notes] |
| [time] | Leave for airport | Home | [transport method] |
| [time] | Arrive at airport | Terminal [X] | [check-in or proceed to security] |
| [time] | Security screening | Airport | [estimated wait] |
| [time] | At gate | Gate [X] | [boarding begins at X] |
| [time] | Flight departs | Aircraft | [flight duration] |
| [time] | Land at [destination/connection] | Airport | [next steps] |
[... continue for connections and arrival]

### Detailed Schedule

#### Phase 1: Home to Airport
[minute-by-minute with specific action items]

#### Phase 2: Airport Departure
[check-in, security, gate sequence]

#### Phase 3: In Flight
[what to do during flight, connection prep]

#### Phase 4: Connection (if applicable)
[terminal change, re-screening, gate location]

#### Phase 5: Arrival
[immigration, baggage, ground transport, accommodation]

### Contingency Plans

| Risk | Trigger | Action |
|------|---------|--------|
| [risk] | [when to worry] | [what to do] |

### Quick Reference Card (Print This)

| Item | Detail |
|------|--------|
| Flight 1 | [airline, number, time, terminal, gate] |
| Flight 2 | [if connection] |
| Confirmation | [booking reference] |
| Accommodation | [name, address, check-in time] |
| Emergency contacts | [airline phone, accommodation phone, travel insurance] |

### Pre-Departure Checklist
- [ ] [item]
- [ ] [item]
```

## Rules

1. ALWAYS work backward from flight departure time -- the flight time anchors the entire schedule
2. ALWAYS include buffer time at every stage -- plans without buffers fail at the first delay
3. Include specific time stamps for every action, not vague timeframes like "morning"
4. International flights require 2.5-3 hours at the airport; domestic flights require 1.5-2 hours minimum
5. Factor in day-of-week and time-of-day for security and traffic estimates -- Monday morning commute differs from Saturday afternoon
6. NEVER assume the best-case scenario for transit times or security lines -- plan for moderate delays
7. Include a "last possible departure from home" time as a contingency reference point
8. Note which items in the schedule are fixed (flight time) vs. flexible (when to wake up, when to eat)
9. Carry-on travelers save 20-40 minutes vs. checked-bag travelers -- reflect this in the timeline
10. Always include a pre-departure home checklist (lock up, electronics unplugged, out-of-office set, pet care confirmed)

## Edge Cases

- **Very early morning flight (departing before 7 AM):** Consider whether to sleep and wake very early (alarm at 3-4 AM) or stay up late and sleep on the plane. For connections requiring clear-headedness, recommend sleeping. Calculate the minimum wake-up time and note that security lines are typically shorter before 5 AM but airport services (food, shops) may be limited.

- **Traveling with children under 5:** Add 30-50% more time to every phase. Children need diaper changes, bathroom stops, feeding breaks, and emotional management. Recommend arriving at the airport 30 minutes earlier than the standard recommendation. Board early if the airline allows family pre-boarding. Pack entertainment and snacks in a dedicated child carry-on bag accessible during the entire journey.

- **Tight connection (under 90 minutes international, under 60 minutes domestic):** Flag this as high-risk. Identify the exact terminal and gate locations for both flights. Note whether the connection requires changing terminals, clearing immigration, or re-screening. Identify the airline's rebooking policy if the connection is missed. Recommend sitting near the front of the first aircraft to deplane faster.

- **Travel with mobility assistance (wheelchair, walker):** Contact the airline 48 hours before departure to arrange assistance. Note that wheelchair assistance adds time at both departure and arrival (waiting for escort, priority boarding, deplaning last or with assistance). Build 30 additional minutes into the airport schedule. Identify whether the connection airport has accessible inter-terminal transport.

- **Multi-time-zone travel (6+ hours difference):** Note the arrival local time and the traveler's body clock time. If arriving in the evening local time but morning body time, the traveler will be alert. If arriving in the morning local time but middle-of-the-night body time, they will be exhausted. Adjust the arrival schedule accordingly -- do not plan activities immediately after a red-eye arrival.

## Example

**Input:** "I have a 7:15 AM domestic flight tomorrow from a major hub airport. I'm checking one bag and live about 35 minutes from the airport by car. I'll use a ride service. What should my morning look like?"

**Output:**

## Travel Day Schedule

**Route:** Home to [Destination] (domestic)
**Flight:** 7:15 AM departure, major hub airport
**Travelers:** Solo
**Luggage:** 1 checked bag + carry-on

### Timeline Summary

| Time | Action | Location | Notes |
|------|--------|----------|-------|
| 4:15 AM | Wake up | Home | Alarm + backup alarm |
| 4:15-4:45 | Shower, dress, final pack check | Home | 30 min |
| 4:45-4:55 | Home departure checklist | Home | Lock up, lights, thermostat |
| 4:55 AM | Ride service pickup | Home | Pre-schedule the night before for 4:55 AM |
| 5:30 AM | Arrive at airport terminal | Departures drop-off | 35-min drive + buffer |
| 5:30-5:45 | Check in + bag drop | Airline counter or kiosk | Counter opens at 5:00 AM for early flights |
| 5:45-6:15 | Security screening | TSA checkpoint | 30-min estimate for early morning major hub |
| 6:15-6:30 | Walk to gate, buy water/coffee | Airside | 15 min buffer + essentials |
| 6:30 AM | Boarding begins | Gate | Group boarding, settle in |
| 7:15 AM | Flight departs | Aircraft | Estimated arrival: [calculate based on route] |

### Detailed Schedule

#### Phase 1: Home to Airport (4:15 AM - 5:30 AM)

**4:15 AM -- Wake up**
- Alarm on phone AND a backup alarm (clock or second device) -- you cannot afford to sleep through a 4 AM alarm
- Clothes laid out the night before (do not make decisions at 4 AM)
- Coffee or breakfast: eat something light before leaving or plan to buy at the airport after security

**4:15-4:45 AM -- Get ready**
- Shower and dress (15 minutes)
- Final suitcase check: confirm charger, medications, travel documents are packed (5 minutes)
- Move suitcase and carry-on to the door (5 minutes)
- Eat a quick breakfast or pack a granola bar for the ride (5 minutes)

**4:45-4:55 AM -- Home departure checklist**
- [ ] All windows closed and locked
- [ ] Stove and oven off (visually verify)
- [ ] Thermostat set to away temperature
- [ ] Lights on timer or off (leave one light on for security if preferred)
- [ ] Water: no dripping faucets, main shutoff if traveling more than a week
- [ ] Trash taken out (do not leave food waste for days)
- [ ] Pet care confirmed (if applicable)
- [ ] Reply-all or out-of-office set on work email (if applicable)
- [ ] Phone, wallet, keys, travel documents in hand

**4:55 AM -- Ride service pickup**
- Pre-schedule the ride the night before for exactly 4:55 AM
- Have the destination set to the correct terminal (check airline terminal assignment in advance)
- Estimated drive time: 35 minutes in pre-dawn traffic (minimal congestion at this hour)

**5:30 AM -- Airport arrival**
- Dropped off at departures level
- Proceed directly to airline check-in counter or kiosk area

#### Phase 2: Airport Departure (5:30 AM - 6:30 AM)

**5:30-5:45 AM -- Check-in and bag drop**
- If already checked in online: proceed to bag drop counter (5-10 minutes)
- If not checked in: use the kiosk for boarding pass, then bag drop (10-15 minutes)
- Confirm: bag tagged to correct destination, keep bag receipt/tag number

**5:45-6:15 AM -- Security screening**
- Estimated wait: 20-30 minutes at a major hub at 5:45 AM (early morning is moderate -- the pre-6 AM wave has passed and 7 AM flights are queuing)
- Have boarding pass and ID ready before reaching the front of the line
- Laptop out of bag, liquids bag accessible, shoes off if required, belt off, pockets empty
- After screening: repack at the bench, not at the conveyor

**6:15-6:30 AM -- Gate area**
- 45 minutes before departure. Boarding typically begins 30 minutes before.
- Locate your gate and confirm the departure board shows on-time
- Buy water (post-security) and coffee or a light snack if you skipped breakfast
- Charge phone if below 50% -- use gate-area outlets
- Use restroom before boarding begins (avoid the plane restroom on short flights)

**6:30 AM -- Boarding begins**
- Listen for your boarding group or zone
- Have boarding pass and ID accessible
- Board, stow carry-on (overhead bin space fills quickly on early flights -- board with your group, not later)

**7:15 AM -- Departure**

#### Phase 3: In Flight

- Flight duration: [calculate based on route]
- Set watch to destination time zone if different
- If planning ground transportation at arrival, use flight time to confirm ride or check transit schedules on any available in-flight connectivity

#### Phase 5: Arrival at Destination

**[Arrival time] -- Landing and taxi**
- Remain seated until the seatbelt sign is off (5-10 minutes after landing)
- Deplane: 10-15 minutes from middle of aircraft, 5 minutes from front

**[+15 min] -- Baggage claim**
- Proceed to baggage claim area (follow signs, check monitors for your flight's carousel number)
- Checked bags typically arrive 15-25 minutes after deplaning
- If bag does not appear after 30 minutes: proceed to airline baggage service desk before leaving the claim area

**[+30 min] -- Ground transportation**
- Ride service: request as you deplane, meet at designated pickup area (5-15 minute wait)
- Public transit: check schedule alignment with your arrival time
- Rental car: follow signs to rental car shuttle (add 20-40 minutes for shuttle + paperwork)

**[+45-60 min] -- Transit to accommodation**
- Estimate based on airport distance and time of day
- Check-in at accommodation (confirm check-in time -- if arriving before check-in, ask about luggage storage)

### Contingency Plans

| Risk | Trigger | Action |
|------|---------|--------|
| Ride service is late or cancels | Not arrived by 5:00 AM | Have a backup ride request ready. Last possible pickup: 5:10 AM (still makes the flight with tight security) |
| Long security line (45+ min) | See deep queue at 5:45 AM | Ask a TSA officer about expedited screening for flights departing in under 90 minutes. Some airports have a separate line for imminent departures. |
| Gate change | Board shows different gate | Check the departure board upon entering the terminal and again after security. Gate changes are common in the 30-60 minute window before departure. |
| Flight delay | Announced at gate or via notification | If connecting: check impact on connection time. Contact airline immediately if connection is at risk. If this is the final flight: wait at gate, adjust ground transportation timing. |
| Checked bag lost | Bag not on carousel after 30 min | File a report at the airline baggage desk before leaving the airport. Provide accommodation address for delivery. This is why essentials (medications, one change of clothes, charger) should always be in your carry-on. |

### Quick Reference Card (Print This)

| Item | Detail |
|------|--------|
| Flight | [Airline] [Flight Number], 7:15 AM, Terminal [X] |
| Booking reference | [confirmation code] |
| Ride pickup | 4:55 AM, pre-scheduled |
| Airport arrival target | 5:30 AM |
| Boarding | ~6:30 AM, Gate [check at airport] |
| Accommodation | [Name], [Address], check-in [time] |
| Emergency: Airline | [airline phone number] |
| Emergency: Accommodation | [hotel/host phone] |

### Pre-Departure Checklist (Night Before)
- [ ] Check in online (opens 24 hours before departure)
- [ ] Download boarding pass to phone AND take a screenshot
- [ ] Confirm ride service is scheduled for 4:55 AM
- [ ] Lay out tomorrow's clothes
- [ ] Set alarm for 4:15 AM + backup alarm
- [ ] Charge phone, laptop, portable battery overnight
- [ ] Pack liquids bag and place on top of carry-on
- [ ] Confirm checked bag is under weight limit (weigh with bathroom scale)
- [ ] Print or save accommodation check-in details
- [ ] Set out-of-office reply on work email if applicable
