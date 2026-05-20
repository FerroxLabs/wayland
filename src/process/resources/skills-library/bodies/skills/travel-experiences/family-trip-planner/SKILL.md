---
name: family-trip-planner
description: |
  Creates age-calibrated family trip itineraries with kid-friendly pacing,
  nap and meal windows, backup indoor activities, and family logistics.
  Gathers destination, dates, children's ages, family interests, and budget
  to produce a day-by-day schedule optimized for families with children.
  Use when the user asks to plan a family vacation, create a kid-friendly
  itinerary, organize a trip with children, or build a family travel schedule.
  Do NOT use for adult-only trips (use trip-itinerary-builder), solo travel
  (use solo-travel-planner), or group travel without children.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel planning parenting itinerary"
  category: "travel-experiences"
  subcategory: "trip-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Family Trip Planner

## When to Use

**Use this skill when:**
- A user asks to plan a family vacation, road trip, or multi-day outing that includes at least one child under age 18
- A user wants a day-by-day itinerary calibrated to children's energy cycles, attention spans, and nap schedules
- A user needs help structuring a trip where adult priorities must be balanced with children's developmental needs and stamina limits
- A user is traveling with a mixed-age group (toddler plus school-age, or school-age plus teen) and needs age-specific activity tracks
- A user needs family logistics built into the itinerary -- stroller access, kid-friendly dining, backup indoor plans, and medical facility proximity
- A user wants a "meltdown-proof" schedule that accounts for the unpredictability of traveling with young children
- A user is planning a reunion trip, multi-family vacation, or grandparent-inclusive trip where children are the pacing anchor
- A user explicitly asks for help managing the logistics of travel with children (car seat rentals, nap timing on travel days, airport strategy)

**Do NOT use when:**
- No children are present -- use `trip-itinerary-builder` for adult-only travel
- The user is traveling solo -- use `solo-travel-planner`
- The user wants only a budget breakdown without an itinerary -- use `budget-travel-planner`
- The user needs a packing list only, without an itinerary -- use `packing-list-builder`
- The user is planning group travel with no children involved
- The user needs travel document or visa advice -- this skill does not cover immigration logistics
- The user wants hotel or flight recommendations only -- this skill produces schedules, not booking guidance
- The user is asking about child safety while traveling internationally as a standalone topic -- this skill incorporates safety but does not replace country-specific travel advisories

---

## Process

### Step 1: Gather Complete Family Trip Parameters

Before building any itinerary, collect the following information. If the user provides partial details, ask follow-up questions to fill the gaps. Do not assume any parameter -- wrong assumptions about child ages will produce a structurally wrong itinerary.

**Required parameters:**
- Destination (city, region, or general area)
- Travel dates -- exact arrival and departure dates and times if known (flight schedules affect Day 1 and final day pacing dramatically)
- Number of adults and number of children with exact ages (not "young kids" -- you need ages in years)
- Accommodation type preference: hotel suite, vacation rental with kitchen, resort with kids' club, or no preference
- Mobility and transport method: rental car, own car, public transit, walkable area, or mixed
- Family interest clusters: nature/outdoor, animals, water/beach, museums/history, amusement parks, food experiences, cultural/city exploration
- Budget tier: budget (under $150/day total spend on activities and meals), moderate ($150-350/day), premium ($350+/day)
- Any hard constraints: must-do attractions, must-avoid activities, confirmed reservations already in place
- Special needs: food allergies, dietary restrictions, stroller dependency, wheelchair access, sensory sensitivities, fear of heights or water, sleep schedule inflexibility

**Clarifying questions to ask if not provided:**
- "What time does your youngest child typically nap, and how long?"
- "Is your child in diapers or pull-ups, or fully potty trained?"
- "How does your family handle afternoons -- does everyone rest, or just the youngest?"
- "Do you have older kids who would want separate activities from the toddler group?"
- "Are there any activities you've already confirmed or purchased tickets for?"
- "What's your meltdown threshold -- how many hours before the kids hit a wall?"

### Step 2: Assign Age-Group Pacing Profiles

Apply the correct pacing model to every child in the group. When multiple ages are present, the itinerary is built to the most restrictive profile present. If the gap between youngest and oldest is large (e.g., a 2-year-old and a 14-year-old), use the split-track framework described in Edge Cases.

**Infant (0-23 months):**
- Maximum 2 planned activity blocks per day (not counting meals and transit)
- Mandatory nap window: 60-120 minutes mid-morning (9:30-11:00) and 90-120 minutes early afternoon (13:00-15:00) -- schedule around these, not through them
- Feeding windows every 2-4 hours must be factored into timing
- No activity block should run longer than 45 continuous minutes before a feeding or change break
- Stroller access is non-negotiable -- every venue must accommodate strollers or have a carrier alternative
- Temperature sensitivity: avoid outdoor activities in direct sun above 85°F or below 50°F for extended periods

**Toddler (2-4 years):**
- Maximum 3 planned activity blocks per day
- Mandatory afternoon rest: 60-90 minutes, ideally 13:00-14:30
- Per-activity attention span: 30-45 minutes maximum before interest evaporates
- Include at least one gross motor / physical play block daily (playground, splash pad, sand play, open green space)
- Meal timing is strict: toddlers decompensate rapidly when hungry -- lunch no later than 12:30, dinner no later than 18:00
- Transition time between activities: budget 20 minutes minimum (packing up stroller, snack, bathroom, loading into car)

**School-age (5-10 years):**
- Maximum 4-5 planned activity blocks per day
- No mandatory nap, but schedule a 30-45 minute "regroup window" after lunch
- Per-activity attention span: 60-90 minutes before restlessness peaks
- Children in this range respond strongly to choice and agency -- build in at least one "kid picks" decision per day
- Include a mix of high-energy (active, running) and low-energy (museum, show, craft) blocks to prevent overstimulation
- Meal timing flexibility: lunch by 13:00, dinner by 19:00

**Tween/Teen (11-17 years):**
- Maximum 5-6 planned activity blocks per day
- No rest window needed, but avoid back-to-back highly structured activities -- include unstructured exploration time
- Per-activity engagement span: 60-120 minutes
- Independence blocks of 30-60 minutes (teen browses a market alone, explores a separate museum wing with a buddy) maintain engagement without resentment
- Avoid activities explicitly marketed as "for little kids" -- frame activities by experience, not age ("snorkeling," not "beginner kids' snorkel")
- Meal timing flexibility: lunch 12:30-13:30, dinner 19:00-20:00

**Mixed-age rule:** When the youngest child is under 5 and the oldest is 8+, build split-track blocks into Days 2+ so neither age group is chronically under-served. Label these explicitly in the schedule. Minimum 60% of daily activities must be full-family to maintain cohesion.

### Step 3: Map the Energy Architecture of Each Day

Children's energy follows a predictable arc. Building your daily structure against this arc -- rather than against tourist attraction opening hours -- is the fundamental difference between a functional family itinerary and a disaster.

**The family energy clock:**

| Time Window | Energy Level (Under-5) | Energy Level (5-10) | Optimal Activity Type |
|-------------|------------------------|----------------------|----------------------|
| 07:00-09:00 | High and cooperative | High | Breakfast, light prep, short travel |
| 09:00-12:00 | Peak -- best behavior | Peak -- high focus | Primary anchor activity (zoo, beach, hike, major attraction) |
| 12:00-13:00 | Declining sharply | Moderate | Lunch -- must happen by 12:30 for under-5 |
| 13:00-15:00 | Critical rest zone | Low-moderate | Nap (under-5), quiet time or pool (older kids) |
| 15:00-17:00 | Second wind -- moderate | Second wind | Secondary activity -- shorter, lower stakes |
| 17:00-18:00 | Fragile -- meltdown risk | Moderate declining | Transition, snack, travel back to base |
| 18:00-19:00 | Decompression mode | Decompression mode | Dinner (early for young kids) |
| 19:00+ | Wind-down | Wind-down | Pool, accommodation games, bedtime prep |

**Structural rules for every day:**
- Place the "big" attraction in the 09:00-12:00 window -- this is your anchor
- Never schedule a second high-effort attraction after 15:00 for families with children under 7
- Build a 20-minute buffer after every major activity for transition logistics
- Transit between two consecutive activities must be 20 minutes or under unless the transit is experiential (ferry, scenic train, horse-drawn carriage)
- Never schedule a full day of walking without a sit-down or ride break every 60-90 minutes

### Step 4: Build the Activity Matrix

For each planned activity, fill in this five-factor matrix before placing it in the schedule. This prevents "looks great on paper, collapses in practice" itineraries.

**Five-factor activity check:**
1. **Age fit:** What is the minimum age for this activity to be genuinely engaging (not just tolerated)?
2. **Duration:** What is the realistic family-paced duration, including bathroom visits, snack breaks, and loading/unloading?
3. **Energy demand:** High (hiking, theme park), moderate (zoo, aquarium, beach play), low (museum walk, boat tour)?
4. **Weather dependency:** Fully outdoor, fully indoor, or hybrid?
5. **Indoor backup:** If this activity is cancelled due to weather, meltdown, or closure, what is the nearest same-zone indoor alternative?

Do not include an activity in the itinerary if it fails any of the following:
- Energy demand is "High" and it falls after 15:00 for families with children under 7
- It has no viable indoor backup within 15 minutes
- Minimum age is above the age of any child in the family (do not force a 3-year-old through a 2-hour historical walking tour)
- Duration exceeds the age-appropriate attention span without a built-in break structure

### Step 5: Design the Dining Strategy

Feeding children while traveling is a logistical operation, not an afterthought. Meal failures (wrong timing, long waits, no kids' options) are the single most common trigger for family trip meltdowns.

**Dining rules by age group:**

- **Under-3:** Eat at the accommodation or bring food whenever possible for the first meal of the day. Restaurant meals for toddlers under 2 should be no more than 45 minutes at the table.
- **3-6:** Target restaurants that seat families within 10-15 minutes, have high chairs or booster seats, offer simple familiar foods (pasta, rice, grilled protein, fruit), and have direct access to a restroom.
- **7+:** More flexibility, but still avoid restaurants with waits over 20 minutes on non-celebration meals.

**Dining logistics to note in the itinerary:**
- Identify the dining area for each meal by neighborhood or landmark proximity, not by restaurant name (per Rules -- no specific brand names)
- Note whether the family has kitchen access for self-catered meals (vacation rentals make breakfast and lunch dramatically easier)
- Include a "snack anchor" time mid-morning (10:30) and mid-afternoon (15:30) -- these prevent the blood-sugar drops that cause toddler and child behavioral issues
- For families with food allergies: note the allergy management approach for each meal (see Edge Cases)

**Dinner timing thresholds:**
- Families with any child under 5: dinner seated no later than 18:00
- Families with children 5-10 only: dinner seated by 18:30-19:00
- Families with tweens/teens only: dinner 19:00-20:00 acceptable
- Mixed ages: defer to youngest child's threshold

### Step 6: Layer in Family Logistics and Safety Infrastructure

Every family itinerary must include non-negotiable logistics that adult-only itineraries omit. These are not optional additions -- they are structural requirements.

**Medical safety infrastructure:**
- Nearest pediatric urgent care or emergency room to the accommodation (note the neighborhood or landmark, not specific address)
- Nearest 24-hour pharmacy to accommodation
- Nearest pharmacy to each day's primary activity zone (in case a need arises away from base)
- Lost child protocol: designated meeting point (front entrance of accommodation, hotel concierge desk, designated landmark), plus the instruction to every child old enough to understand: "If separated, find a person in uniform or a family with children and stay in one place"
- Emergency information card: child's full name, parent's phone number, accommodation address, any allergy or medical conditions -- carried in child's pocket or attached to stroller

**Mobility and access infrastructure:**
- Stroller route notes: note which activity areas are stroller-friendly (paved, flat, elevator-accessible) vs. which require carrying
- Car seat logistics: if renting a car, note car seat rental or bring-your-own requirement (children under 40 lbs require a 5-point harness; children 40-80 lbs typically use a high-back booster -- verify destination requirements)
- Changing facilities: note which major venues have family restrooms or changing tables
- Quiet room or nursing room availability at major venues for infants

**Snack and hydration strategy:**
- Pack a day bag with: water bottles per person, age-appropriate snacks (whole fruit, crackers, pouches for toddlers, granola bars for older kids), extra snacks equal to one additional meal for any child under 5 (disrupted schedules drain snack reserves faster than expected)
- Identify one snack resupply point per day (grocery store, market, convenience store near the activity zone)

### Step 7: Construct the Full Itinerary and Run the Quality Check

Assemble all days using the Output Format template. After drafting, run this quality checklist before presenting:

**Mandatory quality checks:**
- [ ] Every day has the correct maximum activity count for the youngest child's age group
- [ ] Every outdoor activity has a named indoor backup in the same zone
- [ ] No high-energy activity falls after 15:00 for families with any child under 7
- [ ] Dinner timing is age-appropriate for the youngest child
- [ ] Every day has at least one "kid's choice" or "kid-driven" moment
- [ ] Every day has a rain/bad-day backup plan
- [ ] Transit between consecutive activities is 20 minutes or under (unless experiential transit)
- [ ] A nap or rest block exists for every day that includes a child under 5
- [ ] Family logistics section is complete (medical, pharmacy, lost child protocol, emergency card)
- [ ] Packing reminders section is specific to the ages present (not generic)
- [ ] No day has back-to-back high-energy activities without a recovery buffer
- [ ] Arrival day (Day 1) is always lighter than subsequent days -- never schedule a major attraction on arrival day unless arrival is before 10:00

### Step 8: Calibrate for Arrival and Departure Day Realities

Arrival and departure days require special handling that most itinerary planners ignore -- causing the first and last days to be the most chaotic.

**Arrival day rules:**
- If arrival is before noon: allow 90 minutes for check-in, unpacking, and settling before any outing
- If arrival is 12:00-15:00: afternoon only -- one low-key activity maximum, prioritize nearby and walkable
- If arrival is after 15:00: arrival day is logistics only -- no planned activities, dinner and accommodation orientation only
- Include time to locate the nearest grocery store for snacks, water, and breakfast supplies on Day 1

**Departure day rules:**
- Check-out time determines the activity window -- if 11:00 check-out, morning activity must end by 10:15 at the latest
- Last day should never include an activity more than 20 minutes from the airport or departure point if departure is in the afternoon
- Build a 30-minute buffer before airport departure for the reality of traveling with children (bathroom, gate discovery, stroller gate-checking)
- "Final treat" ritual on departure day (one small item the child picks) reduces departure-day meltdowns significantly

---

## Output Format

```
## Family Trip Itinerary: [Destination, Region]

**Travel Dates:** [Day, Month Date] -- [Day, Month Date] ([N] nights, [N] days)
**Family Composition:** [X] adults, [X] children (ages: [list in ascending order])
**Itinerary Pace:** [Relaxed | Moderate | Active] -- calibrated to youngest child, age [X]
**Budget Tier:** [Budget | Moderate | Premium]
**Transport Method:** [Rental car | Own car | Public transit | Walkable base | Mixed]
**Accommodation Type:** [Type and key family-relevant features]

---

### Family Safety & Logistics

| Category | Detail |
|----------|--------|
| Nearest pediatric urgent care | [Neighborhood or landmark reference near accommodation] |
| Nearest 24-hour pharmacy | [Neighborhood or landmark reference near accommodation] |
| Lost child meeting point | [Specific landmark: hotel front desk, fountain near entrance, etc.] |
| Emergency info card | Prepare card per child: name, parent phone, accommodation address, allergies |
| Car seat requirement | [Ages/weights of children and corresponding seat type required] |
| Stroller access | [Umbrella stroller recommended / Full stroller / Carrier backup] |

---

### Day [N]: [Date] -- [Thematic Day Title]

**Pacing:** [Relaxed | Moderate] | **Anchor Activity:** [Name of primary activity] | **Energy calibration:** Age [X]

| Time | Activity | Duration | Energy Demand | Ages Engaged | Indoor Backup |
|------|----------|----------|---------------|--------------|---------------|
| [HH:MM] | [Activity name and brief description] | [X min] | [High/Mod/Low] | [All / 3+ / 5+ / 10+] | [Named indoor alternative in same zone] |
| [HH:MM] | Snack break -- [location type] | 15 min | Low | All | -- |
| [HH:MM] | [Second activity] | [X min] | [H/M/L] | [Ages] | [Backup] |
| [HH:MM] | Lunch -- [neighborhood or dining zone description] | 45-60 min | Low | All | -- |
| [HH:MM] | Nap / Rest block -- [at accommodation / in car / at venue] | [X min] | None | [0-4 / All] | [Accommodation activity for older siblings] |
| [HH:MM] | [Afternoon activity -- moderate energy] | [X min] | [H/M/L] | [Ages] | [Backup] |
| [HH:MM] | Kid's choice: [specific options given to children] | [X min] | [H/M/L] | All | -- |
| [HH:MM] | Snack + transition back to base | 20 min | Low | All | -- |
| [HH:MM] | Dinner -- [dining zone, restaurant type description] | 60 min | Low | All | -- |
| [HH:MM] | Evening wind-down -- [pool / quiet play / bedtime prep] | [X min] | Low | All | -- |

**Kid's choice today:** [Specific decision given to children with 2-3 concrete options]
**Snack plan:** [Morning snack location/type + afternoon snack location/type + pack-in items]
**Nap logistics:** [Where, how long, what older kids do during this window]
**Rain/meltdown plan:** [Full alternative day schedule if weather or child condition makes original plan non-viable]

---
[Repeat Day structure for each day]
---

### Packing Reminders -- Age-Specific

**For [youngest child, age X]:**
- [Item 1 specific to this age: diapers, pull-ups, formula, toddler snacks, stroller]
- [Item 2: comfort object, favorite cup, white noise app]
- [Item 3: swim diaper, sun hat, UV protective swimsuit]
- [Item 4: emergency info card to attach to stroller]

**For [older child, age X]:**
- [Item 1: swimsuit, goggles, water shoes]
- [Item 2: small personal backpack with water bottle, snack, one activity item]
- [Item 3: headphones and downloaded entertainment for transit/rest times]
- [Item 4: simple camera or travel journal if child is interested]

**Shared family items:**
- Sunscreen SPF 50+ (reapply every 90 minutes in sun, every 60 minutes at beach/water)
- Refillable water bottles per person
- First aid kit: adhesive bandages, antiseptic wipes, children's pain reliever (weight-appropriate dose), antihistamine, thermometer, blister pads
- Day bag with dry bags (for wet swimwear and sandy items)
- Ziplock bags in multiple sizes (snack storage, wet gear, sandy shoes)
- Portable white noise device or app for nap portability in hotels
- Nightlight (unfamiliar rooms cause sleep disruption in children under 5)
- Change of clothes per child in the day bag (not in checked luggage)

**Electronics and entertainment:**
- Tablet(s) pre-loaded with downloaded shows, audiobooks, and offline games
- Portable battery pack for charging during transit
- Headphones per child (over-ear for under-5 for sound limitation)
```

---

## Rules

1. **Calibrate everything to the youngest child, without exception.** Activity count, timing windows, energy scheduling, and meal timing are all set by the youngest child's developmental needs. Never compromise this by scheduling "one quick extra thing" that pushes past the toddler's threshold.

2. **Never schedule a high-energy activity after 15:00 for any family with a child under 7.** High energy means anything requiring sustained walking over 30 minutes, physical exertion, theme park navigation, or complex transit. After 15:00 for young children, activities must be short (under 60 minutes), low-stakes, and close to base.

3. **Every outdoor activity must have a named indoor backup in the same zone.** "We'll figure it out if it rains" is not a plan. The backup must be a specific type of venue (children's museum, aquarium, indoor play center, shopping mall with play area) that is reachable within 15 minutes of the original activity location.

4. **Arrival day is always a light day.** Never place a major attraction on arrival day unless the family arrives before 10:00 and the attraction is within 20 minutes of accommodation. The first day must include grocery/supply acquisition time and accommodation orientation.

5. **Nap time is a structural element, not optional padding.** For children under 4, a skipped nap does not result in a tired but cooperative child -- it results in behavioral escalation that ruins the next 3 hours. Protect the nap window on every day. If an activity runs long and threatens the nap, cut the activity short.

6. **Meal timing is a safety constraint, not a preference.** Children under 5 experiencing delayed meals are physiologically likely to meltdown within 30-45 minutes of normal meal time. Lunch for families with under-5s must be seated by 12:30. Dinner must be seated by 18:00. These are not negotiable for pacing reasons.

7. **Every day must include at least one decision given to the children.** This is not a courtesy -- it is a behavioral management tool. Children who have one genuine choice per day demonstrate measurably better cooperation during adult-driven activities. The choice must be real and specific (two playground options, choice of ice cream flavor, which souvenir to pick), not illusory.

8. **Transit time between consecutive planned activities may not exceed 20 minutes for families with children under 8.** Longer transit kills the second activity before it begins. If two desired activities are more than 20 minutes apart, place a meal or nap between them, or choose one and replace the other with something closer.

9. **Never include an activity whose minimum age exceeds the age of any child in the family.** Do not place a 3-year-old through an activity calibrated for 6+. The child will not enjoy it, and the family will spend the activity managing the child rather than experiencing it. Either find an age-split solution or replace the activity.

10. **Include medical and safety infrastructure for every itinerary, with no exceptions.** The nearest pediatric urgent care, nearest 24-hour pharmacy, and a lost child protocol are required in every output. Do not omit these even for short or domestic trips -- pediatric emergencies do not respect itinerary length.

11. **Never pad the itinerary with a generic attraction that has no specific fit for this family's stated interests.** Every activity must connect directly to the family's stated interest clusters. A family that said "animals and beach" should not receive a 2-hour historical architecture walking tour on Day 2 to fill time.

12. **Departure day schedule must account for airport or departure logistics from the first scheduled activity.** Departure day activities must end far enough in advance that, accounting for packing, loading, transit, and a 30-minute child-logistics buffer, the family reaches their departure point without rushing. A rushing family with young children is a safety and wellbeing risk.

---

## Edge Cases

### Family with Both a Toddler (Under 4) and a Tween/Teen (11+)

This is the most structurally difficult family configuration because the pacing needs are nearly incompatible. The toddler's nap forces a midday pause that the teen experiences as wasted time, and the teen's tolerance for repeat "little kid" activities is low.

**Solution: The Parallel Track Model**
- Days 1 and last are always full-family (arrival bonding, departure ritual)
- On Days 2 through N-1, build one 90-minute parallel block into the afternoon where one adult takes the teen to an age-appropriate activity while the other adult handles the toddler's nap at accommodation
- The teen's parallel activity must be walkable or very close to accommodation (within 10 minutes) so the adult can be reached if the toddler has a medical need
- Full-family activities must be selected at the intersection of both age groups' genuine engagement: animals (zoos, aquariums), water experiences, active outdoor spaces, evening shows or performances
- Never force the teen into a morning full-family activity labeled as "for babies" -- reframe all activities in adult/teen language in the itinerary

### Single Parent Traveling Alone with Children

A solo parent has zero redundancy. If anything goes wrong, or a child needs to be carried, restrained, or removed, there is no backup adult. The itinerary must be structurally simpler and more conservative than a two-adult family itinerary.

**Required modifications:**
- Reduce maximum activity count by 1 per day across all age groups
- Eliminate all split-track parallel activities -- a solo parent cannot supervise children in two locations
- Prioritize accommodation proximity -- all activities within 20 minutes of base; reduce to 15 minutes for families with children under 4
- Note stroller-only routes -- a solo parent cannot carry a toddler and manage another child on stairs simultaneously
- Restroom strategy: for potty-training or recently trained children, note which venues have family restrooms where the parent can bring all children in together; avoid venues where the adult must choose between entering the men's or women's restroom with a mixed-gender group of children
- Increase snack buffer -- solo-parent transitions take longer; an extra 10 minutes should be added to every transition block

### Child with a Severe Food Allergy (e.g., Peanut, Tree Nut, Dairy, Gluten Intolerance)

Food allergies in children during travel require systematic management, not ad hoc handling. A reaction far from medical facilities on a family vacation is a serious risk.

**Required additions to the itinerary:**
- **Allergy card:** A written card in English and, if traveling internationally, the destination language listing the specific allergens, severity, and "this person cannot eat [X] -- please check all ingredients" -- include this in the packing list as a required item
- **Safe dining identification:** For each day's dining zone, note the type of establishment most likely to have allergy-aware protocols (casual sit-down restaurants with full menus and kitchen staff who can answer ingredient questions; note that buffet-style and street food carry higher cross-contamination risk)
- **Pack-in meals:** For any day with limited dining options (remote outdoor areas, theme parks with limited allergy-menu choices), schedule a packed meal from the accommodation kitchen or a known-safe grocery item
- **Medical escalation kit:** Families with anaphylactic allergy risk must pack and carry an epinephrine auto-injector at all times; note nearest emergency department (not just urgent care) for each activity zone
- **Snack supply:** Pack minimum 150% of expected snack needs; allergen-safe snacks are harder to source on the road than standard snacks

### Destination with Significant Heat or Climate Challenge (Desert, Tropical, High Altitude)

Standard energy-clock scheduling assumes temperate conditions. Extreme heat, humidity, high altitude, or monsoon risk requires structural modification.

**Heat and humidity (above 90°F / sustained humidity above 70%):**
- Shift the primary activity window to 08:00-11:00 -- before peak heat (11:00-15:00)
- The 11:00-15:00 window becomes the mandatory rest/cool block for all ages (air-conditioned accommodation, indoor venue, pool)
- Afternoon activity window shifts to 16:00-18:00 as temperatures decline
- Hydration becomes an active scheduled item -- note water stops every 45 minutes during outdoor activity
- Children under 5 are at significantly higher heatstroke risk -- limit direct sun exposure to 30-minute intervals with shade/water access

**High altitude (above 8,000 feet / 2,400 meters):**
- Add a 24-48 hour acclimatization buffer on arrival for children -- reduce activity intensity in the first two days
- Increase water intake reminders (altitude increases dehydration rate)
- Children may experience altitude sickness (headache, nausea, fatigue) with no warning -- include altitude sickness symptom recognition in the family safety section
- Avoid strenuous hiking for children under 5 until Day 3 at altitude
- Nearest medical facility becomes more important -- note its altitude capacity

### Multi-Family Trip (Two or More Families Traveling Together)

Coordination among multiple families multiplies logistical complexity. A poorly structured multi-family schedule results in constant waiting, different children melting down at different times, and adult frustration.

**Required structural additions:**
- Designate one "scheduling adult" per family to communicate activity readiness -- do not expect spontaneous coordination
- Build 15 minutes of buffer into every activity start time (multi-family groups are structurally slow to depart)
- Identify activities that work for all children across both families -- this is the activity pool for joint scheduling; activities that only suit one family's age range become optional, family-specific add-ons
- Shared dining: pre-identify restaurant types that can seat groups of [N total family members] without a 30-minute wait; note that groups over 6 should call ahead to most casual dining establishments
- One joint "rest day" activity per trip (pool at accommodation, park picnic) where no one is scheduled and children self-direct -- this prevents decision fatigue among adults and gives children unstructured play with peers
- Separate family budgets: do not intertwine expenses; note shared costs (group entry discount, split rental vehicles) vs. individual family costs

### Child with Sensory Processing Differences or Autism Spectrum Considerations

Children with sensory sensitivities, ASD, or anxiety disorders have specific environmental triggers that standard tourist venues produce in abundance: loud crowds, unexpected noises, bright lights, unfamiliar smells, and unpredictable schedules.

**Required itinerary modifications:**
- **Venue pre-assessment:** For every major venue, note the sensory environment (noise level, crowd density, lighting type). Many major attractions offer sensory-reduced hours (early morning openings, "quiet hours") -- schedule visits during these windows wherever possible.
- **Predictability scaffolding:** Include the full day's schedule in simple, visual language that can be shared with the child the night before and morning of. Surprises are a primary trigger -- the child should know what comes next at all times.
- **Escape route planning:** For every activity, note the nearest low-stimulation exit point (outside bench, quiet hallway, accommodation return route). If a child enters sensory overload, the family needs to know the fastest route to calm environment.
- **Reduction in crowd-heavy activities:** Replace peak-hour visits with off-peak equivalents. Arrive at major attractions at opening time (first 45 minutes are reliably the least crowded). Avoid weekend visits to high-traffic venues.
- **Comfort objects and regulation tools:** Add sensory regulation items to packing list (noise-canceling headphones, weighted travel blanket, fidget tools, preferred snack foods). These are not optional comfort items -- they are functional regulation supports.
- **Flexible exit expectation:** Note that every activity has an "exit at 50%" option -- if the child shows early signs of overwhelm, leaving at the halfway point is the correct decision, not a failure. Build schedule buffer to absorb an early exit without cascading the day.

### Very Long Family Trip (8+ Days)

Extended trips with children require rest-day engineering that shorter trips do not. Children's cumulative fatigue is not linear -- it compounds. By Day 5 of a high-activity schedule, behavior that was manageable on Day 1 becomes unmanageable, and a beautiful Day 6 itinerary produces only tears.

**Required structural additions:**
- **Mandatory rest day every 3-4 days:** A rest day is defined as: no transportation to a venue, no structured itinerary, unstructured play at accommodation (pool, beach adjacent to hotel, playground), and flexible meal timing. This is not a "wasted day" -- it is the reason Days 7-10 remain viable.
- **Activity count reduction in second half:** Reduce planned activities by one per day starting on Day 5. By Day 7+, even school-age children are running on cumulative fatigue. Fewer activities, better executed, produce a better experience than more activities poorly tolerated.
- **Laundry logistics:** For trips over 5 days, note a laundry day (Day 4 or 5) -- this is especially critical for families with young children who generate significantly more laundry than adults. Identify whether the accommodation has in-unit laundry or a nearby laundromat.
- **Familiarity anchors:** After Day 3, identify one recurring element that children can expect daily (same breakfast spot, same pool time window, same pre-bed routine) -- predictable anchors reduce behavioral resistance to the day's new activities.
- **Pacing review:** At the end of each day for trips 8+ days, mentally check whether the actual day matched the planned day. If children are showing fatigue signs earlier than scheduled, move the rest day earlier. Flexibility in long itineraries outperforms rigid adherence.

---

## Example

**Input:** "We're planning a 4-day trip to Washington D.C. in late June. There are 2 adults, a 4-year-old, and a 9-year-old. The 4-year-old still naps. We love history and animals. Moderate budget, rental car, staying in a hotel near the National Mall area."

---

## Family Trip Itinerary: Washington, D.C.

**Travel Dates:** Late June (4 days, 3 nights -- confirm exact dates)
**Family Composition:** 2 adults, 2 children (ages 4 and 9)
**Itinerary Pace:** Relaxed-Moderate -- calibrated to youngest child, age 4
**Budget Tier:** Moderate
**Transport Method:** Rental car + walking (National Mall is highly walkable; car used for off-Mall destinations)
**Accommodation Type:** Hotel with two queen beds or family suite near National Mall -- prioritize hotels with a lobby or lounge area suitable for downtime

---

### Family Safety & Logistics

| Category | Detail |
|----------|--------|
| Nearest pediatric urgent care | Georgetown University area has pediatric urgent care facilities; confirm nearest to your specific hotel block on arrival |
| Nearest 24-hour pharmacy | Multiple chain pharmacies within walking distance of National Mall hotels -- identify on arrival day |
| Lost child meeting point | Hotel front desk (briefed to both children before first outing) |
| Emergency info card | Prepare one card per child: child's name, parent's cell number, hotel name and address, any allergies -- laminate or keep in waterproof sleeve, attach to 4yo's belt loop or backpack |
| Car seat requirement | 4-year-old: forward-facing 5-point harness (typically 20-40 lbs) or high-back booster depending on weight; 9-year-old: high-back booster if under 80 lbs -- verify and arrange with rental car company in advance |
| Stroller access | Lightweight stroller for 4-year-old for long Mall walks; Mall pathways are fully paved and flat; note that Smithsonian museums are all stroller-accessible with elevators |

**D.C.-specific logistics note:** The National Mall and all Smithsonian Institution museums are free of charge. This makes budget management significantly easier -- moderate budget should be allocated primarily to dining, one ticketed attraction (National Zoo is free; International Spy Museum and National Air and Space Museum Udvar-Hazy are ticketed), transportation, and accommodation. Late June temperatures in D.C. average 85-92°F with high humidity -- see heat protocol notes embedded in daily schedules.

---

### Day 1: Arrival Day -- Settle In and Mall Orientation

**Pacing:** Relaxed | **Anchor Activity:** National Mall walk and first monument | **Energy calibration:** Age 4
**Heat note:** Late June D.C. humidity is significant. Afternoon outdoor activity after 14:00 should include a shaded rest point and hydration every 30 minutes.

| Time | Activity | Duration | Energy Demand | Ages Engaged | Indoor Backup |
|------|----------|----------|---------------|--------------|---------------|
| 10:00 | Arrive, check in, unload, locate pharmacy and nearest grocery store for snacks and breakfast supplies | 75 min | Low | All | -- |
| 11:15 | Walk to National Mall -- Lincoln Memorial end, wading pool area, allow kids to run on open grass | 75 min | Moderate | All | Smithsonian American History Museum (10 min walk from Lincoln Memorial end) |
| 12:45 | Lunch -- food truck cluster on Mall or casual dining near hotel (walk no more than 10 min) | 50 min | Low | All | -- |
| 13:40 | Nap at hotel for 4-year-old | 90 min | None | 4yo | 9yo: hotel pool with one adult, or quiet activity (book, downloaded show, travel journal) |
| 15:15 | Short walk to nearest Mall reflecting pool area -- WWII Memorial (low key, open space, accessible) | 60 min | Low | All | Hotel lobby exploration, gift shop near hotel |
| 16:20 | Snack stop + return to hotel | 20 min | Low | All | -- |
| 16:40 | Freshen up at hotel, hydration break | 20 min | None | All | -- |
| 17:00 | 9-year-old's choice: hotel pool swim OR walk to a nearby fountain/park | 45 min | Moderate | All | In-room movie preview, lobby games |
| 18:00 | Dinner -- casual family-friendly restaurant within 10-minute walk of hotel (look for Italian, American grill, or pizza -- all tend to have fast service and familiar items for 4-year-olds) | 60 min | Low | All | -- |
| 19:00 | Return to hotel, bedtime prep, light play | 60 min | Low | All | -- |

**Kid's choice today:** 9-year-old decides between pool and fountain walk after 4-year-old's nap
**Snack plan:** Purchase fruit, crackers, juice pouches, and water bottles at grocery store on arrival; pack day bag for afternoon Mall walk with one snack per person
**Nap logistics:** Hotel room nap for 4-year-old (bring portable white noise device); one adult stays at hotel; other adult takes 9-year-old to pool or lobby
**Rain/meltdown plan:** Smithsonian American History Museum in the morning (fully covered, free, stroller-accessible, 2 hours); lunch near hotel; afternoon in-room movie and hotel pool if available

---

### Day 2: Animal Day -- National Zoo

**Pacing:** Moderate | **Anchor Activity:** Smithsonian National Zoo | **Energy calibration:** Age 4
**Heat note:** National Zoo is heavily shaded in forested sections -- schedule animal houses and wooded paths during 11:00-13:00 to avoid peak heat on open pathways.

| Time | Activity | Duration | Energy Demand | Ages Engaged | Indoor Backup |
|------|----------|----------|---------------|--------------|---------------|
| 07:45 | Breakfast -- hotel or quick nearby cafe (pack water bottles and snacks in day bag) | 40 min | Low | All | -- |
| 08:30 | Drive to National Zoo (approximately 20-25 min from Mall-area hotels) -- arrive at opening | 25 min | Low | All | -- |
| 09:00 | National Zoo -- start at Kids' Farm (4yo priority area: goats, donkeys, cows, hands-on exhibits), then Great Cats, then Elephant Trails | 150 min | Moderate | All | Zoo indoor exhibits: Small Mammal House, Reptile Discovery Center (both are climate-controlled and engaging for both ages) |
| 11:30 | Mid-zoo snack break at a shaded bench area -- pack in or purchase at zoo food cart | 20 min | Low | All | -- |
| 11:50 | Giant Panda habitat + Amazonia (indoor, cool, excellent for both ages) | 50 min | Low-Moderate | All | Already indoor |
| 12:45 | Lunch -- zoo food area or picnic in shaded zoo lawn (picnic lunch packed from accommodation is budget-smart here) | 45 min | Low | All | -- |
| 13:30 | Drive back to hotel -- 4-year-old likely asleep in car (transfer to hotel bed; do not wake for nap) | 25 min | None | All | -- |
| 13:55 | Nap at hotel | 75 min | None | 4yo | 9yo: hotel pool with one adult or quiet activity at hotel; 9-year-old can use this time for a downloaded show, zoo animal journal, or sketching |
| 15:15 | Drive to Georgetown waterfront area (approximately 15 minutes) -- walk along waterfront, playground near waterfront for 4yo, bookshops and waterfront for 9yo | 75 min | Moderate | All | Georgetown indoor shops and bakeries in case of rain |
| 16:45 | 4-year-old's kid choice: playground one last time OR pick one animal figurine at a souvenir shop | 20 min | Low | All | -- |
| 17:05 | Drive back toward hotel | 15 min | Low | All | -- |
| 17:30 | Hotel debrief -- kids' choice of 30-minute quiet activity (coloring, animal book, tablet) | 30 min | Low | All | -- |
| 18:00 | Dinner -- casual restaurant, family-friendly dining strip near hotel; 9-year-old may want to order from the adult menu -- this is an appropriate age for that independence to be acknowledged | 60 min | Low | All | -- |
| 19:00 | Hotel pool (if evening swim is available) or bedtime prep | 45 min | Low | All | -- |

**Kid's choice today:** 4-year-old chooses playground or souvenir at Georgetown; 9-year-old chooses what to do during nap window (pool swim or personal downtime)
**Snack plan:** Pack morning snack (granola bars, fruit pouches for 4yo, crackers); purchase one zoo snack treat per child; pack picnic lunch OR plan to buy at zoo food area (moderate budget can absorb zoo food pricing for one meal)
**Nap logistics:** Zoo visit is timed so the drive back serves as the nap transition; transfer sleeping 4-year-old to hotel room without waking; if child does not sleep in car, implement hotel nap room routine immediately on return
**Rain/meltdown plan:** National Zoo indoor exhibits can absorb 3-4 hours even in heavy rain (Reptile House, Small Mammal House, Amazonia rainforest building, Kids' Farm covered areas); if full zoo day is not viable, replace afternoon Georgetown section with Smithsonian Natural History Museum (free, indoor, large mammal hall is excellent for animal-interested kids)

---

### Day 3: History Day -- Smithsonian Museums Calibrated for Both Ages

**Pacing:** Moderate | **Anchor Activity:** Smithsonian National Air and Space Museum (National Mall location) + American History | **Energy calibration:** Age 4

**Planning note:** Both Smithsonian locations on the National Mall are free. Air and Space is the highest-engagement museum for this age combination -- spacecraft and aircraft are engaging for 4-year-olds visually and for 9-year-olds intellectually. Natural History (dinosaurs, ocean hall, Hope Diamond) is the secondary option. Do not attempt more than two Smithsonian museums in one day with a 4-year-old.

| Time | Activity | Duration | Energy Demand | Ages Engaged | Indoor Backup |
|------|----------|----------|---------------|--------------|---------------|
| 08:00 | Breakfast at hotel or nearby bakery cafe -- eat a substantial breakfast because morning activity is indoor and cool | 45 min | Low | All | -- |
| 08:50 | Walk to National Air and Space Museum (Mall location -- approximately 5-15 min walk from most Mall hotels) | 15 min | Low | All | -- |
| 09:05 | Air and Space Museum -- Milestones of Flight Hall (first, most visually striking; 4-year-old engages with size and shapes; 9-year-old engages with history), How Things Fly gallery (hands-on for both ages), Space Race gallery (9yo focused) | 120 min | Low-Moderate | All | Already indoor; if 4yo fatigues, sit in IMAX lobby or museum café area |
| 11:05 | Snack on museum mall bench (shaded in the morning) | 15 min | Low | All | -- |
| 11:20 | Walk to National Museum of American History (10 min walk on Mall) -- focus on: Star-Spangled Banner gallery (awe-appropriate for both ages), First Ladies exhibition (9yo interest), transportation and innovation exhibits | 90 min | Low | All | Already indoor |
| 12:50 | Lunch -- Mall food vendors or café in American History Museum | 50 min | Low | All | -- |
| 13:40 | Nap at hotel (10-15 min walk from most Mall museums or short car return) | 90 min | None | 4yo | 9yo: National Gallery of Art Sculpture Garden (open-air, directly adjacent, free, fountains) or in-room quiet time |
| 15:15 | Walk to National Mall open lawn area -- kite flying (purchase at Mall vendor or bring from home), Frisbee, open play; this is unstructured and child-directed | 75 min | High-Moderate | All | Lincoln Memorial interior if weather prevents outdoor play |
| 16:30 | Walk toward hotel -- ice cream cart or food truck stop on Mall as afternoon treat | 20 min | Low | All | -- |
| 17:00 | Return to hotel, wind-down | 30 min | None | All | -- |
| 17:30 | 9-year-old's choice: hotel pool swim OR read/journal about favorite exhibit from today | 45 min | Moderate | 9yo primarily | 4yo with other adult in room |
| 18:15 | Dinner -- slightly more elevated casual dining for a "special night" -- 9-year-old can be acknowledged as an engaged museum participant today | 75 min | Low | All | -- |
| 19:30 | Pack day bags for tomorrow, bedtime prep | 30 min | None | All | -- |

**Kid's choice today:** 9-year-old chooses pool swim or personal time during nap; 4-year-old chooses which museum exhibit "toy" to photograph (if tablet or phone available -- builds engagement and creates a trip memory artifact)
**Snack plan:** Pack morning snacks in day bag; buy one snack per child at museum café; afternoon ice cream/treat from Mall vendor is the planned "treat moment"
**Nap logistics:** If hotel is more than 15 minutes from Museum on foot, drive for nap; consider whether 4-year-old can transfer from stroller nap in museum quiet area (some Smithsonian lobbies permit this) -- this enables 9-year-old to stay in museum with one adult while other adult stays with napping child
**Rain/meltdown plan:** This is already an indoor day -- all activities are covered. In a meltdown scenario for the 4-year-old, the American History museum café is a quiet sit-down option, and early hotel return is fully viable because the morning anchor (Air and Space) was completed.

---

### Day 4: Departure Day -- Final Mall Walk and Goodbye Ritual

**Pacing:** Relaxed | **Anchor Activity:** U.S. Capitol area walk + final Mall stop | **Energy calibration
