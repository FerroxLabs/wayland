---
name: cycling-route-planner
description: |
  Plans cycling routes for recreational riders with distance calculation, elevation profile interpretation, road vs. trail surface selection, gear checklists, and ride-day preparation sequences. Gathers the user's experience level, bike type, and goals to produce a structured ride plan.
  Use when the user asks about planning a bike ride, choosing a cycling route, interpreting elevation profiles, or preparing for a recreational cycling outing.
  Do NOT use for competitive race training or racing strategy, professional bike fitting, mountain biking technical skills progression, or cycling commute planning for daily transportation (use green-transportation-planner).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "planning checklist step-by-step guide"
  category: "hobbies-crafts"
  subcategory: "outdoor-recreation"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Cycling Route Planner

## When to Use

**Use this skill when:**
- The user asks how to plan a recreational bike ride, including selecting a route, estimating time, or choosing a starting point
- The user wants help interpreting an elevation profile from a mapping tool like Komoot, Strava, Ride with GPS, or Google Maps cycling directions
- The user asks what gear to bring on a bike ride, or wants a packing checklist tailored to ride duration and conditions
- The user wants to compare two or more route options based on distance, surface type, traffic exposure, or elevation
- The user is planning a group ride and needs to reconcile different fitness levels among participants
- The user asks about ride-day logistics -- what to eat, when to leave, how to warm up, how to pace themselves
- The user wants to understand whether a specific route is appropriate for their current fitness or bike type
- The user is planning a special occasion ride -- a birthday century attempt, a first metric century, or a post-injury return to cycling
- The user asks about gravel riding surface selection, road quality, or how to find quiet country roads in their region

**Do NOT use when:**
- The user asks about structured training plans, FTP testing, power-based periodization, or race preparation (these require sport-specific coaching methodology beyond recreational planning)
- The user needs professional bike fitting -- saddle height, cleat alignment, reach, stack -- these require in-person biomechanical assessment and should be referred to a certified bike fitter
- The user is progressing through mountain biking technical skills such as drops, rock gardens, switchback cornering, or jump technique -- this is trail skills coaching, not route planning
- The user wants to plan a daily cycling commute optimized for transportation efficiency, route reliability, or traffic timing (use `green-transportation-planner`)
- The user asks about bicycle repair, drivetrain overhaul, wheel truing, or brake bleeding (use a dedicated bicycle maintenance skill)
- The user is asking about velodrome or track cycling, which has entirely different planning requirements
- The user asks about competitive time trial strategy, road racing tactics, or criterium pack riding

---

## Process

### Step 1: Gather Ride Parameters

Ask the user for the following inputs before producing any plan. If the user has provided several of these in their initial message, confirm or fill in only the gaps.

- **Bike type:** Road bike (drop bars, narrow tires), hybrid (flat bars, wider tires), gravel bike (drop bars, wider tires designed for mixed surfaces), cruiser (upright geometry, often single-speed), cyclocross, or mountain bike used on roads. Bike type controls surface compatibility, safe tire pressure ranges, and realistic speed.
- **Experience level:** Use these tiers as a reference framework:
  - Tier 1 -- New: rides fewer than 5 miles at a time, rarely or never rides
  - Tier 2 -- Casual: occasional rides of 5-15 miles, comfortable on flat ground
  - Tier 3 -- Regular: rides 2-3 times per week, comfortable at 15-25 miles, handles rolling terrain
  - Tier 4 -- Experienced: rides 3-5 times per week, comfortable at 25-50 miles, handles sustained climbs
  - Tier 5 -- Advanced: rides 5+ times per week, regularly completes 50+ mile routes
- **Ride goal:** Leisure (slow pace, scenic interest, conversation-friendly), fitness (moderate sustained effort, building aerobic base), or challenge (pushing distance or elevation limits intentionally)
- **Location or region:** Used to identify regional terrain character, surface quality, available paths, and seasonal weather norms
- **Available time:** Total window including travel to and from the start, not just saddle time -- this is a common planning error
- **Group composition:** Solo, pair, or group. For groups, identify the least experienced and least fit rider -- the plan is built to that baseline
- **Surface preference and bike path access:** Whether dedicated bike paths or separated infrastructure are available, or whether the route will involve road riding

---

### Step 2: Define Route Criteria

Once parameters are gathered, translate them into specific, plannable constraints.

- **Distance targets by experience tier:**
  - Tier 1: 3-8 miles -- short enough to finish without fatigue-induced danger
  - Tier 2: 8-18 miles -- allows exploration without overextending
  - Tier 3: 18-35 miles -- full half-day ride, manageable with good pacing
  - Tier 4: 35-65 miles -- standard day ride for fit recreational cyclists
  - Tier 5: 65-100+ miles -- century territory, requires fueling strategy
- **Elevation gain budgets by difficulty tier (measured in feet gained per mile ridden):**
  - Flat: 0-30 ft/mile -- typical of coastal plains, river paths, rail trails
  - Gently rolling: 30-60 ft/mile -- small hills, suburban terrain
  - Rolling: 60-100 ft/mile -- requires moderate climbing fitness
  - Hilly: 100-150 ft/mile -- significant sustained climbs, some above 7% grade
  - Mountainous: 150+ ft/mile -- sustained climbs, requires gearing appropriate for the bike
- **Bike-to-surface compatibility rules:**
  - Road bike (23-28mm tires): paved roads and smooth bike paths only. Avoids anything with loose gravel, mud, or poorly maintained pavement
  - Hybrid (35-50mm tires): paved roads, bike paths, packed gravel, hardpacked dirt
  - Gravel bike (38-50mm tires): all paved surfaces, gravel roads, hardpacked dirt, some loose gravel -- not technical singletrack
  - Mountain bike on roads (2.1"+ knobby tires): comfortable on everything but slower than a hybrid on pavement due to rolling resistance
- **Traffic exposure targets:**
  - Tier 1-2: bike paths and multi-use trails only, or roads with protected bike lanes
  - Tier 3: roads with bike lanes or wide paved shoulders (minimum 4 ft) acceptable
  - Tier 4-5: comfortable on marked bike routes with standard lanes, avoids high-speed arterials
- **Route shape logic:** For beginners and casual riders, an out-and-back route on a known bike path is the safest choice -- it eliminates navigation anxiety, allows bail-out at any point, and ensures the return path is known. Loop routes offer more variety but require reliable navigation and commitment to completion.

---

### Step 3: Interpret the Elevation Profile

This is a skill many recreational cyclists lack. Guide the user through each element.

- **Total elevation gain vs. elevation loss:** These are not the same number on point-to-point routes. A route with 1,200 ft of gain and 400 ft of loss involves a net 800 ft climb, which is much harder than a balanced loop with 800 ft gain and 800 ft loss.
- **Elevation gain per mile (the primary difficulty indicator):** Divide total gain by total distance. A 20-mile route with 2,000 ft of gain is 100 ft/mile -- firmly in the "hilly" category. A 40-mile route with 2,000 ft of gain is only 50 ft/mile -- rolling. Total gain alone is meaningless without distance context.
- **Grade percentage:** The critical climbing metric. Grade = (elevation change ÷ horizontal distance) × 100.
  - 0-3%: Flat to barely noticeable -- most riders can maintain full speed
  - 3-5%: Gentle grade -- slight effort increase, easy conversation maintained
  - 5-7%: Moderate -- noticeable effort, recreational riders shift to lower gears
  - 7-10%: Challenging -- many casual riders will slow significantly or dismount
  - 10-15%: Steep -- experienced riders push hard, beginners often walk
  - 15%+: Very steep -- even fit cyclists use lowest gears and high effort
- **Profile shape analysis:** Look at the elevation graph and categorize it:
  - Front-loaded: big climbs in the first half, easier return. Best for beginners -- hardest work when energy is highest
  - Back-loaded: flat start, climbs in the second half. Dangerous for under-prepared riders who deplete energy reserves before the hard section
  - Symmetrical loop: balanced climbs and descents throughout, good for intermediate riders
  - Lollipop: flat stem to a hilly loop, popular in organized rides -- allows warm-up before climbing
- **Descent considerations:** Descents are not free. Long, steep descents require braking strength and concentration, which fatigue hands and forearms. On wet or gravel roads, descents require speed reduction. Roads with switchback descents require technique. Alert the user if a route has a descent grade over 8% for more than 0.5 miles.
- **Practical reading tip:** When using Ride with GPS or Komoot, zoom the elevation chart to identify the steepest 0.5-mile segment. That number represents the worst-case gradient the user will encounter, and it should be within their capability.

---

### Step 4: Estimate Ride Time Accurately

Poor time estimates ruin rides. Use a multi-factor approach.

- **Base speeds by experience tier (on flat, calm conditions):**
  - Tier 1: 8-10 mph
  - Tier 2: 10-13 mph
  - Tier 3: 13-16 mph
  - Tier 4: 16-20 mph
  - Tier 5: 18-22 mph (recreational, not racing)
- **Elevation penalty:** For every 1,000 ft of total gain on a ride, add 45-60 minutes of riding time above the flat-terrain estimate. Alternatively, subtract 1.5-2.5 mph from average speed for routes with more than 60 ft/mile gain.
- **Wind adjustment:** Wind speed affects cyclists disproportionately. As a rule of thumb:
  - 10-15 mph headwind: subtract 2-3 mph from average
  - 15-20 mph headwind: subtract 4-5 mph, reduce planned distance
  - Tailwind: add 2-3 mph but don't extend the plan -- you may face a headwind on the return
  - Crosswind over 20 mph: recommend postponing for Tier 1-2 riders, caution Tier 3
- **Surface penalty:**
  - Packed gravel: subtract 1-2 mph vs. pavement
  - Loose gravel: subtract 2-4 mph
  - Hardpacked dirt trail: subtract 1-2 mph
  - Wet pavement: subtract 1-2 mph (caution, not speed penalty per se)
- **Break time:** Add structured stops to the time estimate, not just saddle time:
  - Tier 1-2: 10-15 minutes of break per hour of ride time
  - Tier 3: 5-10 minutes per hour
  - Tier 4-5: 5 minutes per hour
- **The Naismith-adapted cycling formula:** A reliable method for recreational cyclists:
  - Base time = distance (miles) ÷ average speed (mph)
  - Add 1 minute for every 25 ft of elevation gain
  - Add break time
  - Example: 20-mile route, 1,000 ft gain, Tier 3 rider = (20 ÷ 14) + (1,000 ÷ 25 min) = 85 min + 40 min = 2 hr 5 min + 15 min breaks = approximately 2 hr 20 min total
- **Buffer for group rides:** Add 15-20% to calculated time when riding with a group of 4 or more, due to regrouping, pace variation, and logistical pauses.

---

### Step 5: Build the Gear Checklist

Gear lists must be scaled to ride duration, temperature, and distance from support. Avoid generic all-inclusive lists -- tailor to the specific ride being planned.

- **Safety -- Non-negotiable on every ride:**
  - Helmet: correctly fitted (two-finger rule -- two fingers between helmet and eyebrow, snug chinstrap)
  - Rear light: solid red or flashing red, visible from 500 ft in daylight. Use even in bright conditions -- studies consistently show daytime rear lights reduce rear-end collision risk
  - Phone: charged, with emergency contact accessible. Use a stem-mount or top-tube bag mount to keep it accessible
  - Identification: a cycling-specific road ID or a card with name and emergency contact tucked in a jersey pocket or saddle bag

- **Flat repair -- Non-negotiable for any ride away from car support:**
  - Spare inner tube: must match tire size exactly (road: 700x23-28c, hybrid: 700x35-45c, gravel: 700x40-50c or 650bx47c). Carry one tube per rider for rides under 2 hours, two tubes for longer rides
  - Tire levers: 2-3 plastic levers. Metal levers can damage rims
  - Mini pump: brings tube to 60-80% of target pressure -- enough to ride home. A CO2 inflator (one 16g cartridge per tube) is faster but has no redundancy if misjudged
  - Patch kit (stick-on patches): backup for a second flat or a pinch flat

- **Hydration -- the most commonly under-prepared category:**
  - Standard conditions (under 75F): 20-24 oz (one standard bottle) per hour
  - Warm conditions (75-85F): 24-28 oz per hour
  - Hot conditions (85-95F): 28-32 oz per hour
  - For rides over 75 minutes, add electrolytes -- sweat contains sodium, potassium, and magnesium. Plain water alone causes hyponatremia risk during prolonged efforts in heat. Use electrolyte tablets (Nuun, SaltStick) or electrolyte drink mix, one serving per hour after the first hour
  - Know refill locations on the route before leaving -- a 3-hour ride on a hot day with no refill stop requires carrying 3+ bottles or a hydration pack

- **Nutrition by ride duration:**
  - Under 1 hour: No food needed for most riders with a meal 2-3 hours prior
  - 1-2 hours: One snack of 150-250 calories (banana, energy bar, fig cookies)
  - 2-3 hours: 200-300 calories per hour after the first hour. Begin eating at minute 45, not when hungry -- hunger lags energy depletion by 20-30 minutes
  - 3+ hours: Structured fueling every 20-30 minutes. Mix simple carbs (gels, chews, dates) and real food (rice cakes, peanut butter and honey sandwich)
  - Carbohydrate targets for sustained rides: 60-90g of carbohydrate per hour is the research-supported range for rides over 2.5 hours

- **Comfort and clothing by temperature:**
  - Below 40F: Thermal bib tights or leg warmers, base layer, insulated cycling jacket, full-finger gloves, shoe covers or warm socks, ear cover or cycling cap
  - 40-55F: Arm warmers, knee warmers or bib tights, light wind jacket, medium-weight gloves
  - 55-70F: Cycling shorts or bibs, base layer optional, arm warmers (can remove and pocket), light gloves optional
  - 70-85F: Shorts and jersey, sun arm sleeves optional for UV protection
  - Above 85F: Minimal, UV protection priority, light-colored clothing

- **Tools for rides over 2 hours:**
  - Multi-tool: minimum 3mm, 4mm, 5mm, 6mm hex keys (Allen), Phillips and flat screwdriver -- these cover seat post, stem, derailleur, brake lever adjustments
  - Chain quick link: one that matches chain speed (8-speed, 10-speed, 11-speed, 12-speed chain links are not interchangeable)
  - Tire boots: a cut from an old tire, dollar bill, or commercial boot -- placed inside the tire over a cut to prevent tube blowout through a sidewall gash

---

### Step 6: Design the Ride-Day Preparation Sequence

Most ride problems are preventable with systematic preparation.

- **Evening before:**
  - Tire pressure check and inflation to target range:
    - Road bike (23-28mm): 85-120 PSI -- heavier riders use higher end
    - Road bike (28-32mm): 75-90 PSI
    - Hybrid (35-45mm): 50-70 PSI
    - Gravel (40-50mm): 35-50 PSI -- lower pressure for better traction and comfort
    - Mountain bike on roads (2.1"+): 30-40 PSI
  - Chain lubrication: apply a drop of lubricant (wet lube for rain, dry lube for dry conditions) to each link, spin the chain through several times, wipe excess with a rag. A noisy or stiff chain loses 5-10 watts of efficiency
  - Brake check: squeeze each lever -- it should engage firmly before the lever comes within 1 inch of the handlebar
  - Quick release and thru-axle check: both wheels fully seated, no wobble
  - Charge devices: GPS computer, head light, rear light, phone
  - Lay out clothing the night before -- reduces morning friction and forgotten items

- **Morning of the ride:**
  - Pre-ride meal timing and composition: eat 2-3 hours before start for a real meal (oatmeal with banana, toast with eggs, rice bowl). If start time doesn't allow this, eat a small easily-digested snack 30-45 minutes before (banana, white toast with honey, energy bar)
  - Do not try new foods on a challenging ride day -- gastrointestinal distress is a common cause of abandoned rides
  - 60-second pre-ride check routine (the ABC Quick Check):
    - A -- Air: squeeze tires, verify they're at target pressure
    - B -- Brakes: squeeze both levers, verify firm engagement
    - C -- Chain and cranks: spin cranks, verify smooth shifting
    - Quick check: quick releases or thru-axles tight, both wheels spin freely

- **At the start:**
  - Warm-up: spend the first 10-15 minutes spinning at a very easy gear and cadence -- target 80-90 RPM at low resistance. This elevates heart rate gradually, lubricates joints, and primes the aerobic system. Riders who skip this often feel terrible for the first 20 minutes and mistake it for poor fitness
  - Pacing: for rides over 1.5 hours, the first 30 minutes should feel almost too easy. Starting fast depletes glycogen stores rapidly and creates performance collapse in the final third
  - Navigation: download the route to a device or screenshot maps before leaving in case cell service is unavailable. Identify the key navigation decision points, not just the total route

---

### Step 7: Produce the Final Ride Plan

Assemble all gathered information into the structured output format. Include specific, actionable recommendations -- not generic ones. If the user is in a region you can characterize (Pacific Northwest, New England, Great Plains, Southwest desert), incorporate appropriate regional knowledge about terrain, weather patterns, and typical road conditions.

- **Difficulty rating formula:** Combine distance and elevation into a single descriptor:
  - Easy: Tier 1-2 distance + flat to gently rolling elevation
  - Moderate: Tier 2-3 distance + rolling elevation, or Tier 1-2 distance + hilly
  - Challenging: Tier 3-4 distance + hilly, or Tier 4-5 distance + rolling
  - Strenuous: Tier 4-5 distance + hilly to mountainous
- **Include specific bail-out recommendations:** For rides over 1.5 hours, note a point at which the rider can cut the ride short and return by a shorter path or call for a pickup. This is especially important for new riders and solo rides.
- **Flag any specific hazard notes:** Railroad crossings (approach at 90 degrees, never parallel), cattle guards, chip-seal road surface (rough for narrow tires), known stretches with rumble strips, bridge expansion joints.

---

### Step 8: Confirm Understanding and Offer Refinement

Before finalizing, ask:
- Does the distance and time estimate fit within the stated time window, including travel to the start?
- Are there any physical limitations not yet mentioned (recent injury, cardiac condition, recent illness)?
- Does the user have all the listed gear, or should the checklist be adjusted based on what they already have versus what they'd need to acquire?

---

## Output Format

```
## Cycling Route Plan

### Ride Overview
| Parameter          | Value                                           |
|--------------------|-------------------------------------------------|
| Rider(s)           | [Solo / Pair / Group -- note levels if mixed]   |
| Ride goal          | [Leisure / Fitness / Challenge]                 |
| Bike type          | [Road / Hybrid / Gravel / Mountain]             |
| Distance           | [X miles]                                       |
| Total elevation    | [X ft gain / X ft loss]                        |
| Gain per mile      | [X ft/mile -- difficulty indicator]             |
| Estimated time     | [X hours X minutes, including breaks]           |
| Surface type       | [Paved path / Paved road / Gravel / Mixed]      |
| Traffic exposure   | [None -- bike path / Low / Moderate]            |
| Overall difficulty | [Easy / Moderate / Challenging / Strenuous]     |
| Best bail-out      | [Mile X -- describe the shorter option]         |

---

### Route Criteria Summary
- **Target distance range:** [X-X miles -- based on experience tier and time window]
- **Maximum elevation gain per mile:** [X ft/mile]
- **Surface requirement:** [specific compatibility with stated bike type]
- **Traffic level:** [appropriate for rider experience]
- **Route shape:** [Out-and-back / Loop / Lollipop -- and why]
- **Key features to look for:** [shade, rest areas, water refill points, scenic highlights]
- **Features to avoid:** [high-traffic roads, grades over X%, rough chip-seal for road bike, etc.]

---

### Elevation Profile Interpretation
| Metric                        | Value              | What It Means                        |
|-------------------------------|--------------------|--------------------------------------|
| Total gain                    | [X ft]             | [easy / moderate / hard for level]   |
| Total loss                    | [X ft]             | [net climb if gain > loss]           |
| Gain per mile                 | [X ft/mile]        | [flat / rolling / hilly / mountain]  |
| Steepest grade                | [X% at mile X]     | [easy / moderate / hard to climb]    |
| Profile shape                 | [front/back/even]  | [what this means for pacing]         |
| Recommendation                | [pacing advice and route shape suggestion]            |

---

### Estimated Time Breakdown
| Segment              | Miles  | Terrain         | Pace Est.    | Time Est.  | Notes                         |
|----------------------|--------|-----------------|--------------|------------|-------------------------------|
| [Start → Waypoint 1] | [X mi] | [flat/rolling]  | [X mph]      | [X min]    | [warm-up zone, easy effort]   |
| [Waypoint 1 → Mid]   | [X mi] | [rolling/climb] | [X mph]      | [X min]    | [main climbing section]       |
| Rest stop            | --     | --              | --           | [X min]    | [snack, water, brief rest]    |
| [Mid → Waypoint 2]   | [X mi] | [descent/flat]  | [X mph]      | [X min]    | [recovery section]            |
| [Waypoint 2 → End]   | [X mi] | [flat]          | [X mph]      | [X min]    | [cooldown pace]               |
| **Total**            | **[X]**| --              | **[X avg]**  | **[X hr]** | **[includes X min breaks]**   |

---

### Gear Checklist

#### Safety (Non-Negotiable)
- [ ] Helmet -- correctly fitted, buckle snug
- [ ] Rear light -- red, charged, mounted on seatpost or seatstay
- [ ] Front light -- charged (even for daytime rides)
- [ ] Phone -- charged, emergency contact accessible
- [ ] ID -- road ID, wallet card, or name on phone lock screen

#### Flat Repair Kit
- [ ] Spare inner tube -- [correct size for stated bike, e.g., 700x40c for hybrid]
- [ ] 2 tire levers -- plastic only
- [ ] Mini pump or CO2 inflator (16g cartridge)
- [ ] Patch kit (stick-on patches) -- backup
- [ ] [For rides over 2 hours: second spare tube]

#### Hydration & Nutrition
- [ ] Water: [X oz / X bottles -- calculated for duration and temperature]
- [ ] Electrolytes: [Yes/No -- specify if ride exceeds 75 min or temp exceeds 75F]
- [ ] [Snack/food item with calorie estimate -- scaled to ride length]
- [ ] [Secondary food for rides over 2 hours]
- [ ] [Cash or card for refuel stop, if applicable]

#### Clothing & Comfort
- [ ] [Specific clothing for stated temperature -- e.g., arm warmers, bib shorts, gloves]
- [ ] Sunscreen SPF 30+ -- exposed skin
- [ ] Sunglasses or clear cycling glasses
- [ ] [Optional: light jacket stowed in jersey pocket or saddle bag]

#### Tools & Repair (Rides Over 1 Hour)
- [ ] Multi-tool -- minimum 4mm and 5mm hex, Phillips screwdriver
- [ ] [Chain quick link if ride is over 2 hours or remote]
- [ ] [Tire boot if route includes rough roads]

---

### Ride-Day Prep Sequence

#### Evening Before
- [ ] Inflate tires to target pressure: [X-X PSI for stated bike type]
- [ ] Squeeze both brake levers -- firm engagement confirmed
- [ ] Spin cranks and check shifting through all gears
- [ ] Verify quick releases or thru-axles are fully seated
- [ ] Apply chain lube if chain looks dry or is noisy; wipe excess
- [ ] Charge: [head light / rear light / GPS computer / phone]
- [ ] Check weather forecast -- adjust clothing plan accordingly
- [ ] Lay out all gear and clothing

#### Morning Of Ride
- [ ] Eat pre-ride meal [X hours before start -- specify time based on start time]
- [ ] Fill water bottles: [X oz total]
- [ ] ABC Quick Check: Air, Brakes, Chain/cranks
- [ ] Pack saddle bag and jersey pockets using checklist above
- [ ] [Weather-specific addition -- e.g., rain jacket, extra layer]

#### At the Start
- [ ] Warm up for 10-15 minutes at easy spin -- very low gear, 80-90 RPM, minimal effort
- [ ] Confirm navigation: route loaded on device or screenshots saved
- [ ] Communicate estimated return time to someone not on the ride
- [ ] Note bail-out option at mile [X] in case of fatigue or mechanical

---

### Important Hazard Notes
- [Any specific hazard for this route type -- railroad crossings, chip-seal, descents, weather risk]
- [Traffic note if route includes any road sections]
- [Weather or seasonal note relevant to region]
```

---

## Rules

1. **Never exceed the experience tier by more than one step.** A Tier 1 rider should not receive a Tier 3 route under any circumstances, even if they express ambition. Present a Tier 2 route and explain why -- frame it as setting up success, not limiting the rider.

2. **Always include a helmet in every gear checklist.** This is not optional based on local laws or rider preference. It is listed first, without caveats, on every single checklist.

3. **Never use total elevation gain as the sole difficulty indicator.** Always pair it with gain per mile. A 3,000 ft climb over 60 miles (50 ft/mile, rolling) is categorically different from 3,000 ft over 20 miles (150 ft/mile, mountainous). Failing to make this distinction produces dangerously wrong difficulty assessments.

4. **Water estimates must account for temperature.** The base of 20 oz per hour is valid for mild conditions under 75F. Increase to 28-32 oz per hour at 85-95F, and 32-40 oz per hour above 95F. Failing to scale water to temperature is one of the most common causes of recreational cycling emergencies.

5. **For group rides, always plan to the weakest rider's capabilities.** This applies to distance, elevation, pace, and route complexity. State this explicitly in the plan -- experienced riders in the group may need to be counseled to resist the urge to push the pace.

6. **Rear light is mandatory on every ride regardless of time of day.** Daytime running lights for cyclists reduce rear-end incidents. This rule applies even to rides entirely on separated bike paths.

7. **Always include a bail-out point for rides over 1.5 hours.** For out-and-back routes, this is naturally the turnaround. For loops, identify the shortest route back from the farthest point. State it specifically in the plan with an approximate mileage.

8. **Never recommend road riding without bike lanes or wide shoulders to Tier 1-2 riders.** A rider who is still building bike-handling confidence should not be exposed to vehicle traffic without physical separation. Bike paths, multi-use trails, and protected lanes are the correct surface category for this tier.

9. **Time estimates must include elevation, wind, surface, and break penalties -- not just distance divided by speed.** A flat-terrain speed applied to a hilly or windy route will consistently underestimate ride time and cause riders to miss time windows, run out of water, or extend into darkness.

10. **Nutrition timing must be proactive, not reactive.** Explicitly state in the plan that eating should start at 45-60 minutes, regardless of hunger. Riders who wait until they feel hungry or tired are already depleted. This rule applies to any ride over 75 minutes.

11. **Spare tube size must match the tire size of the bike being used.** A 700x23c tube in a hybrid with 700x40c tires will over-stretch and fail. Always specify the correct tube size explicitly in the gear checklist.

12. **If the user mentions any physical health consideration -- recent surgery, heart condition, diabetes, asthma -- recommend they consult a physician before attempting the ride.** Do not modify a route to accommodate unstated medical conditions. Acknowledge the condition, note its relevance to cycling, and defer to medical guidance.

---

## Edge Cases

### Complete Beginner on Their First Real Ride
A rider who has never cycled as an adult, or has not ridden in 10+ years, is not even Tier 1 in the framework above -- they are at the "pre-Tier 1" stage. The plan changes substantially:

- Recommend a 3-5 mile out-and-back on a flat, dedicated bike path. Not a loop -- a simple straight path they can turn around on at any moment.
- Before going anywhere, recommend a 10-15 minute "shakedown" in a flat, empty parking lot. Practice braking, starting, stopping, and low-speed turning. New riders are most likely to crash in the first few minutes due to unfamiliarity with bike handling.
- Saddle height check: seated on the saddle with the heel on the pedal, the leg should be straight. When the ball of the foot is on the pedal in riding position, there should be a slight bend (approximately 25-30 degrees) at the bottom of the pedal stroke. A saddle too low causes knee pain; too high causes hip rocking and lower back pain.
- Gear list is minimal: helmet, one water bottle, phone, one spare tube and lever, mini pump. No other items are necessary for a 3-5 mile flat path ride.
- Pacing advice: go slower than seems necessary. Most new riders start too fast, feel exhausted within 10 minutes, and conclude they are unfit. The correct beginner pace feels almost embarrassingly slow.

### Riding in Extreme Heat (Above 90F)
Heat represents one of the most genuinely dangerous conditions in recreational cycling because symptoms of heat exhaustion develop rapidly and are often not recognized until serious.

- Reschedule if possible: recommend starting before 8 AM or after 6 PM when temperatures are below 80F. If the ride must happen in heat, reduce planned distance by 25-30%.
- Water escalation: 32-40 oz per hour. For rides over 90 minutes in heat, a hydration pack (Camelbak or similar) is more practical than bottles -- it allows drinking without removing hands from bars.
- Electrolytes become mandatory, not optional, in heat: begin electrolyte intake at 30 minutes, one serving per hour thereafter.
- Warning signs to stop the ride immediately: cramping that doesn't resolve with water and electrolytes, nausea, headache, dizziness, confusion, or stopping sweating (anhidrosis -- a dangerous sign of severe dehydration). If these occur, stop, get into shade, and call for a pickup. Do not try to ride through heat illness symptoms.
- Light-colored clothing is not cosmetic -- it reflects solar radiation. Add a lightweight white or light-colored cycling cap under the helmet. Wet the cap with water at rest stops.
- Sunscreen must be reapplied every 90 minutes during rides. One pre-ride application is insufficient.

### Riding in Rain or Wet Conditions
Wet roads change the physics of cycling significantly.

- Braking distance on wet roads is approximately double that of dry roads. This means riders should begin braking for stops and turns much earlier than usual.
- The most dangerous surfaces in wet conditions are:
  - Painted road markings (crosswalks, lane lines): extremely slippery when wet
  - Metal surfaces (manhole covers, storm grates, railroad tracks): near-zero friction when wet
  - Leaves on the road: comparable to ice
  - Freshly laid chip-seal: mud-like traction when wet
- Tire pressure adjustment: reduce by 5-10 PSI from normal target to increase contact patch and improve wet-road traction
- Eyewear: clear-lens cycling glasses are critical in rain -- spray from the road and front wheel significantly impairs vision. Riding without glasses in rain is uncomfortable and dangerous
- Drivetrain care: wet conditions saturate dry chain lube rapidly. Switch to wet lube (thicker, oil-based) for rain rides, and plan a chain lubrication immediately after the ride
- Fenders: if the bike has fender mounts, install clip-on fenders before a rain ride. Without fenders, the front wheel directs a spray of water directly onto the rider and drivetrain

### Riding in Cold Weather (Below 40F)
Cold is more forgiving than heat in terms of physical danger, but hypothermia and frostbite are genuine risks on long winter rides.

- The rule of thumb for cycling clothing: dress as if it is 15-20F warmer than the actual temperature, because cycling generates substantial body heat. A rider who is perfectly comfortable standing still will overheat if dressed that way on a bike.
- Extremities cool fastest: hands, feet, and ears need more insulation than the core. Layered gloves (liner + waterproof shell) work better than single heavy gloves. Lobster-claw cycling gloves offer better warmth-to-dexterity ratio than full mittens.
- Wind chill at cycling speeds: at 15 mph cycling speed into a 15 mph wind, wind chill at 35F ambient temperature approaches 15-17F. Calculate effective wind chill for the planned ride speed and wind conditions.
- Breathing cold air: for riders with exercise-induced asthma, cold air significantly increases bronchospasm risk. A balaclava or buff over the nose and mouth pre-warms and humidifies inhaled air, reducing bronchial irritation.
- Battery performance in cold: GPS computers and lights lose battery capacity rapidly below 40F. Lithium batteries are less affected than standard batteries. A device that shows 50% charge in a warm room may have 20-25% effective capacity at 32F.

### Multi-Day Ride or Overnight Bike Tour
A multi-day ride exceeds the single-ride scope of this skill, but when a user asks about it, redirect constructively rather than refusing.

- Confirm: is this a supported tour (vehicle carries bags) or self-supported? The difference is enormous in gear volume and planning complexity.
- For a supported single overnight (the best starting point for a first tour): plan each day as an individual single-day route using this skill. Day 1 should be shorter than the rider's comfortable maximum -- travel, logistics, and novelty create fatigue on top of physical effort.
- Daily calorie needs for sustained multi-day riding are 2,800-4,000 calories per day, depending on duration and effort. This is a meaningful nutritional planning challenge beyond single-day fueling.
- For self-supported touring: panniers (4-8 kg loaded) or bikepacking bags (2-4 kg) change the ride dynamics significantly. Reduce planned daily distance by 20-25% when loaded. Gear selection, bag weight, and waterproofing are entire planning domains unto themselves.
- Recommend the user plan a single supported overnight as their first tour experience before committing to multi-day self-supported touring. The logistical learning curve is steep.

### Route Planning Without Access to Elevation Data
Some users will ask for a route plan without access to Strava, Komoot, or similar tools that show elevation profiles.

- Use regional terrain knowledge to provide general guidance: coastal areas and river valleys are typically flat; foothills and any route described as "through the mountains" or "over a pass" will have substantial climbing; suburban areas are typically gently rolling.
- Provide general rules for estimating elevation on unknown roads:
  - Any road named "Summit," "Ridge," "Hill," or "Pass" in the name has significant elevation
  - Railroad grade trails (rail trails) are limited to under 2% grade by engineering -- among the flattest routes available
  - River or lakeshore paths typically follow flat contours with minimal elevation change
- If no elevation data is accessible, recommend the user drive the route in a car before cycling it to assess grades visually.

### User Describes a Route That Exceeds Their Capabilities
When the user states they want to do a specific route (perhaps a famous local route or an organized event) that is clearly beyond their current tier, handle this carefully and constructively.

- Do not simply refuse or dismiss the goal.
- Acknowledge the goal as legitimate and achievable with preparation.
- Identify the specific gaps: distance, elevation, or both.
- Build a progressive 3-6 week preparation plan that increases one variable at a time: increase weekly distance first, then add elevation, then combine both.
- For example: if a Tier 2 rider wants to complete a 50-mile hilly ride in 6 weeks, the build-up might be: Week 1: 15 miles flat, Week 2: 18 miles flat, Week 3: 20 miles with 600 ft gain, Week 4: 25 miles with 800 ft gain, Week 5: 30 miles with 1,200 ft gain, Week 6: rest/taper, Event day.

---

## Example

**Input:** "My wife and I want to do a bike ride next Saturday. We're in the Denver area. She has a hybrid and I just got a gravel bike. I ride a few times a week, maybe 20-25 miles usually, and she used to ride more but hasn't ridden regularly in a couple years. We'd have about 4 hours total from when we leave the house to when we need to be back. It'll probably be around 75-80F. We want to enjoy the scenery, not push hard."

---

**Output:**

## Cycling Route Plan

### Ride Overview
| Parameter          | Value                                                      |
|--------------------|------------------------------------------------------------|
| Rider(s)           | Pair -- you (Tier 3-4), wife (Tier 2, returning rider)     |
| Ride goal          | Leisure                                                    |
| Bike types         | Gravel bike (you), hybrid (wife)                           |
| Distance           | 18-22 miles                                                |
| Total elevation    | Under 800 ft gain                                          |
| Gain per mile      | Under 40 ft/mile -- gently rolling                         |
| Estimated time     | 2.5-3 hours including breaks                               |
| Surface type       | Paved bike path or paved road with bike lanes              |
| Traffic exposure   | Minimal -- bike path preferred                             |
| Overall difficulty | Easy to moderate                                           |
| Best bail-out      | Mile 9-10 -- natural turnaround for an out-and-back option |

---

### Route Criteria Summary
- **Target distance range:** 18-22 miles -- set to your wife's returning-rider capability (Tier 2), not your own. A 20-mile flat-to-rolling ride will feel like a good workout for her and an easy spin for you.
- **Maximum elevation gain per mile:** 40 ft/mile. Denver's flattest routes are along the South Platte River trail system and the Cherry Creek Trail, both of which stay comfortably under 30 ft/mile.
- **Surface requirement:** Both hybrid and gravel bike are compatible with paved paths and packed gravel, so mixed-surface multi-use paths are ideal.
- **Traffic level:** Bike path or protected route only. Your wife is returning to cycling after a break -- road traffic adds stress that works against the leisure goal.
- **Route shape:** Out-and-back on a well-signed multi-use trail. This gives you a natural turnaround and allows you to shorten the ride if your wife is fatiguing at the midpoint without navigating a loop.
- **Key features to look for:** Flat or gently rolling paved path, shade trees, a rest stop or cafe within the midpoint range (roughly miles 9-11), water fountains or restroom access.
- **Features to avoid:** Roads with traffic, grades over 5% for any sustained distance, routes that involve road crossings at high-volume intersections.

---

### Elevation Profile Interpretation
| Metric             | Value              | What It Means                                   |
|--------------------|--------------------|-------------------------------------------------|
| Total gain         | ~500-700 ft        | Very manageable for a returning rider           |
| Total loss         | ~500-700 ft        | Balanced -- no significant net climb            |
| Gain per mile      | ~25-35 ft/mile     | Gently rolling -- flat by Denver standards      |
| Steepest grade     | Under 3% sustained | No sections that require significant gear shift |
| Profile shape      | Even and gentle    | No front-loading or back-loading concerns       |
| Recommendation     | Maintain easy conversational pace throughout. At no point should either rider feel too winded to talk. If conversation becomes difficult, ease off the pace. This is the best real-time pacing check for a leisure ride. |

---

### Estimated Time Breakdown
| Segment               | Miles   | Terrain      | Pace Est.    | Time Est. | Notes                                  |
|-----------------------|---------|--------------|--------------|-----------|----------------------------------------|
| Start → Mile 5        | 5 mi    | Flat path    | 10-11 mph    | 28 min    | Warm-up zone, easy spin, assess wife's comfort |
| Mile 5 → Midpoint     | 5-6 mi  | Gently rolling | 10-11 mph  | 32 min    | Main outbound leg                      |
| Rest stop (midpoint)  | --      | --           | --           | 20 min    | Snack, water, stretch, enjoy the view  |
| Return leg            | 10-11 mi | Flat path   | 11-12 mph    | 55 min    | Slight advantage returning (tailwind or easier grade) |
| **Total**             | **20-21 mi** | --      | **~10.5 mph avg** | **~2 hr 15 min** | **Including 20 min break**   |

This leaves you with 45-60 minutes of buffer within your 4-hour window for travel to the trailhead, parking, and any pace variation.

---

### Gear Checklist

#### Safety (Non-Negotiable)
- [ ] Helmet for each rider -- confirm both fit correctly before leaving home
- [ ] Rear light -- red, charged, mounted on seatpost of each bike (even Saturday afternoon)
- [ ] Front light -- charged on each bike for daytime visibility
- [ ] Phone -- charged, each rider has it accessible
- [ ] ID -- card or road ID for each rider

#### Flat Repair Kit
- [ ] Spare inner tube -- **700x40-45c for wife's hybrid** (confirm her exact tire size the night before)
- [ ] Spare inner tube -- **700x40-50c for your gravel bike** (confirm your tire size)
- [ ] 2 plastic tire levers (one set shared is fine)
- [ ] Mini pump -- one pump is sufficient for two riders
- [ ] CO2 inflator (optional, one 16g cartridge as backup)
- [ ] Stick-on patch kit -- backup for a second flat

#### Hydration & Nutrition
At 75-80F, you are in the "warm" category. Scale accordingly.
- [ ] **2 water bottles per rider (4 bottles total) -- 24 oz each = 48 oz per person.** This covers roughly 2+ hours of warm-weather riding. Confirm there is a water fountain at the planned midpoint rest stop.
- [ ] Electrolyte tablets or mix -- one serving per person per hour after the first hour (bring 2 servings each, use at miles 10-11 rest stop and mile 15-16 mark)
- [ ] Snack for rest stop: banana, energy bar, or fig cookies -- 200-250 calories per person
- [ ] Optional: a second lighter snack each (like gummies or chews) for the final 5 miles if anyone is flagging
- [ ] Small amount of cash -- check if there is a coffee shop or food cart near the midpoint of your planned trail

#### Clothing (75-80F, morning start)
- [ ] Cycling shorts or comfortable athletic shorts -- padded shorts recommended for a 2+ hour ride, especially for your wife returning after a break
- [ ] Moisture-wicking jersey or athletic shirt -- no cotton (holds sweat and causes chafing and chills)
- [ ] Sunglasses
- [ ] Sunscreen SPF 30+ applied before leaving home; bring a small tube for reapplication at the rest stop
- [ ] Light cycling gloves -- optional but recommended for your wife whose hands may fatigue from grip pressure on a longer ride

#### Tools & Repair
- [ ] Multi-tool with 4mm and 5mm hex keys
- [ ] Note: both bikes should be running correctly before leaving. If either bike has a shifting or braking issue, address it the night before -- don't rely on a multi-tool fix during the ride

---

### Ride-Day Prep Sequence

#### Evening Before
- [ ] **Inflate tires:** Wife's hybrid to 55-60 PSI; your gravel bike to 40-45 PSI (slightly lower end of range -- the lower pressure will improve comfort on any path imperfections and is appropriate for the warm-weather ride)
- [ ] Squeeze both brake levers on both bikes -- verify firm engagement before the lever reaches 1 inch from the bar
- [ ] Spin cranks on both bikes -- smooth shifting through all gears. If either bike's derailleur is skipping, adjust the barrel adjuster now, not Saturday morning
- [ ] Apply one drop of dry lube to each chain link on both bikes; wipe excess off with a clean rag
- [ ] Charge: both rear lights, both front lights, your GPS or phone mount, both phones overnight
- [ ] Check Saturday forecast. If thunderstorms are predicted -- Denver is famous for afternoon storms -- plan to start by 8-9 AM to be off the trail before 1-2 PM storm risk window
- [ ] Lay out both gear kits the night before

#### Morning Of Ride
- [ ] Eat breakfast 2 hours before departure: oatmeal with banana and honey, or eggs on toast. Something with carbohydrates and a little protein. Avoid a heavy, greasy meal.
- [ ] Fill all 4 water bottles (2 per rider)
- [ ] ABC Quick Check on both bikes: Air (squeeze tires), Brakes (squeeze levers), Chain (spin cranks)
- [ ] Pack saddle bags and pockets: tubes, levers, pump, electrolytes, snacks, sunscreen, phone
- [ ] Apply sunscreen before dressing -- especially neck, back of hands, and any skin that will be exposed
- [ ] Give yourselves 20-25 minutes of travel time to the trailhead and parking

#### At the Start
- [ ] Begin with 10 minutes of very easy spinning at comfortable cadence -- this is especially important for your wife who hasn't ridden recently. Her legs will feel better for the whole ride if the first 10 minutes are genuinely easy.
- [ ] Set your pace to hers from the first pedal stroke. The ride goal is leisure -- you should be able to have a full conversation throughout.
- [ ] Confirm the midpoint and rest stop plan: agree on where you'll stop, how long you'll rest, and what the bail-out is if she's tired at that point (out-and-back means simply turning around and heading home from wherever you are)
- [ ] Tell someone at home your planned return time

---

###
