---
name: car-mechanic-advisor
description: |
  Car troubleshooting guide covering dashboard warning light decoding, common sounds and their meanings, basic diagnostic steps, DIY fixes like battery jump-starts and tire changes, maintenance schedules, when to see a mechanic, and repair cost estimation.
  Use when the user asks about car mechanic advisor, or needs help with car troubleshooting guide covering dashboard warning light decoding, common sounds and their meanings, basic diagnostic steps, diy fixes like battery jump-starts and tire changes, maintenance schedules, when to see a mechanic, and repair cost estimation.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of car mechanic advisor.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "automotive home-maintenance checklist"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Car Mechanic Advisor

> **SAFETY NOTE:** Vehicle repair and maintenance can involve hazardous materials, heavy components, and electrical systems. Always prioritize safety. If you are unsure about any procedure, consult a qualified mechanic. Never work under a vehicle supported only by a jack. Always disconnect the battery before working on electrical systems.

## When to Use

**Use this skill when:**
- User asks about car mechanic advisor
- User needs guidance on car mechanic advisor topics
- User wants a structured approach to car mechanic advisor

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

1. **What is your vehicle?** (Year / Make / Model / Mileage)
2. **What is the issue?** (Warning light / Strange sound / Performance problem / Maintenance question)
3. **When does it happen?** (Starting / Driving / Braking / Turning / Cold weather / Hot weather / All the time)
4. **How long has this been happening?** (Just started / Days / Weeks / Gradually worsening)
5. **Have any recent repairs or maintenance been done?**
6. **Are there any other symptoms?** (Smells / Vibrations / Pulling to one side / Fluid leaks)
7. **What is your comfort level with DIY repairs?** (None / Basic / Intermediate / Advanced)
8. **Do you have basic tools?** (Jack / Wrenches / Jumper cables / None)

---

## Dashboard Warning Light Decoder

### Critical Lights (STOP DRIVING)

| Light | Symbol | Meaning | Action |
|-------|--------|---------|--------|
| **Oil Pressure** | Oil can dripping | Low oil pressure - engine damage imminent | STOP immediately. Check oil level. Do NOT drive. |
| **Temperature** | Thermometer in water | Engine overheating | STOP. Turn off AC, turn on heater. Let cool. Check coolant. |
| **Brake System** | "BRAKE" or ! in circle | Brake failure or very low fluid | Stop safely. Check brake fluid. Do NOT drive if brakes feel soft. |
| **Battery/Charging** | Battery symbol | Alternator or charging system failure | Drive to nearest safe location. Battery will drain. |
| **Transmission Temp** | Thermometer in gear | Transmission overheating | Stop, let cool. Check trans fluid. |

### Important Lights (Address Soon)

| Light | Symbol | Meaning | Action |
|-------|--------|---------|--------|
| **Check Engine** | Engine outline | Engine/emissions issue (many causes) | Get code read (free at auto parts stores). Drive gently. |
| **Check Engine (Flashing)** | Flashing engine | Misfire - catalytic converter damage risk | Reduce speed, avoid heavy acceleration, get to mechanic soon. |
| **ABS** | "ABS" text | Anti-lock brake system issue | Normal brakes still work. Get checked within a week. |
| **Traction Control** | Car with squiggly lines | Traction system active or disabled | If stays on, get checked. If flashing, system is actively working. |
| **Airbag/SRS** | Person with circle | Airbag system malfunction | Get checked - airbags may not deploy in crash. |
| **Power Steering** | Steering wheel with ! | Power steering failure | Steering will be heavy. Safe to drive slowly to mechanic. |

### Advisory Lights (Schedule Service)

| Light | Symbol | Meaning | Action |
|-------|--------|---------|--------|
| **Tire Pressure (TPMS)** | ! inside tire cross-section | Low tire pressure | Check and inflate all tires to door sticker spec. |
| **Maintenance Required** | Wrench or "MAINT" | Scheduled maintenance due | Schedule oil change or service based on mileage. |
| **Fuel Level** | Gas pump | Low fuel | Refuel soon. ~30-50 miles remaining (varies by vehicle). |
| **Washer Fluid** | Windshield with spray | Low washer fluid | Refill washer fluid reservoir. |
| **Door Ajar** | Car with open door | Door, trunk, or hood not closed | Check all doors, trunk, and hood. |

### Check Engine Light Diagnosis
```
COMMON CHECK ENGINE LIGHT CAUSES (by frequency):

1. Loose gas cap (~15% of codes)
   - Tighten gas cap until it clicks
   - Light may take 1-3 drive cycles to reset
   - If light stays, get code read

2. Oxygen sensor failure
   - Affects fuel economy (10-40%)
   - Cost: $150-300 per sensor
   - Can lead to catalytic converter damage if ignored

3. Catalytic converter failure
   - Often caused by ignoring other issues
   - Cost: $500-2,500+
   - Required for emissions

4. Mass airflow sensor
   - Affects fuel economy and performance
   - Cost: $200-400
   - Sometimes cleaning the sensor helps

5. Spark plugs/ignition coils
   - Causes misfires, rough idle, poor acceleration
   - Cost: $100-400 (plugs) / $150-300 per coil
   - DIY difficulty: Moderate

6. EVAP system leak
   - Often a gas cap, hose, or valve issue
   - Cost: $50-500 depending on source
   - Usually not urgent

GET CODE READ:
- Free at AutoZone, O'Reilly, Advance Auto Parts
- Codes are formatted: P0XXX (powertrain), B0XXX (body), C0XXX (chassis)
- The code indicates a SYSTEM, not the exact failed part
- Example: P0420 = catalytic converter efficiency below threshold
  Could be: bad cat, bad O2 sensor, exhaust leak, engine issue
```

---

## Common Sounds and What They Mean

### Sound Diagnostic Guide
```
SQUEALING/SCREECHING:
- When braking: Brake pads worn (replace soon, $150-350 per axle)
- At startup or during acceleration: Serpentine belt worn/loose ($75-200)
- Constant high pitch: Power steering fluid low or pump failing ($200-600)

GRINDING:
- When braking: Brake pads completely worn, metal on metal (URGENT, $300-600+)
- When shifting (manual): Clutch issue or synchro damage ($500-2,000)
- From wheel area: Wheel bearing failing ($200-500 per wheel)
- When starting: Starter motor issue ($250-600)

CLICKING/TICKING:
- Fast clicking, no start: Dead battery (jump start)
- Slow clicking, no start: Weak battery or bad starter
- Ticking at idle: Low oil level, lifter tick, or exhaust leak
- Clicking when turning: CV joint worn ($200-400 per side)

KNOCKING/BANGING:
- Under hood, rhythmic: Engine knock (wrong fuel, carbon buildup, serious engine issue)
- From underneath over bumps: Worn struts/shocks or loose exhaust component
- Clunking when turning: Tie rod or ball joint worn (SAFETY issue, $150-400)
- Banging from rear: Loose exhaust or broken mount

HUMMING/DRONING:
- Gets louder with speed: Wheel bearing ($200-500) or tire issue
- Changes with engine speed: Transmission issue or power steering pump
- Constant drone at highway speed: Tire cupping (rotation or alignment needed)

HISSING:
- Under hood: Vacuum leak or coolant leak onto hot surface
- After shutting off: Normal cooling system pressure release
- From dashboard/vents: HVAC door actuator ($100-400)

WHINING:
- When accelerating: Transmission issue or differential
- From engine area: Power steering pump or alternator bearing
- At certain speeds: Differential or transfer case (AWD/4WD)
```

---

## DIY Fixes

### Jump-Starting a Battery
```
EQUIPMENT NEEDED:
- Jumper cables (12-gauge or thicker)
- Running vehicle with good battery (or portable jump starter)

STEP-BY-STEP:
1. Position vehicles nose-to-nose or side-by-side (DO NOT let them touch)
2. Turn off both vehicles and all accessories
3. Identify positive (+) and negative (-) terminals on both batteries

CONNECTION ORDER (CRITICAL):
4. RED cable to DEAD battery POSITIVE (+) terminal
5. RED cable to GOOD battery POSITIVE (+) terminal
6. BLACK cable to GOOD battery NEGATIVE (-) terminal
7. BLACK cable to UNPAINTED METAL on dead car's engine block
   (NOT the dead battery's negative terminal - spark risk)

8. Start the working vehicle, let idle for 2-3 minutes
9. Try starting the dead vehicle
10. If it starts, let both idle for 5 minutes

DISCONNECTION ORDER (Reverse):
11. BLACK cable from dead car engine block
12. BLACK cable from good battery negative
13. RED cable from good battery positive
14. RED cable from dead battery positive

AFTER JUMP:
- Drive for at least 20-30 minutes to recharge
- If battery dies again: likely needs replacement ($100-250)
- If battery is less than 3 years old: check for parasitic drain

SAFETY:
- Never lean over the battery (hydrogen gas explosion risk)
- Never connect red to negative or black to positive
- If battery is cracked, leaking, or frozen: DO NOT jump start
- Remove all jewelry before working near batteries
```

### Changing a Flat Tire
```
EQUIPMENT NEEDED (should be in your vehicle):
- Spare tire (check pressure periodically)
- Jack
- Lug wrench
- Owner's manual (for jack placement points)

STEP-BY-STEP:
1. Pull to a safe, flat location away from traffic
2. Turn on hazard lights
3. Apply parking brake
4. Place wheel wedges behind tires (rocks work if needed)

5. LOOSEN lug nuts (turn counterclockwise) BEFORE lifting vehicle
   - Use the wrench in a star pattern
   - Loosen only, do not remove yet
   - If stuck: stand on wrench (use body weight)

6. Place jack under vehicle at designated lift point (check manual)
7. Raise vehicle until flat tire is 6 inches off ground
8. Remove lug nuts completely (keep in a safe spot)
9. Remove flat tire (pull straight toward you)
10. Mount spare tire, push until lug bolts show through
11. Hand-tighten lug nuts

12. Lower vehicle until tire touches ground (not full weight yet)
13. Tighten lug nuts fully in a STAR PATTERN
    (not in a circle - star pattern ensures even seating)
14. Lower vehicle completely
15. Final tighten of lug nuts

AFTER INSTALLING SPARE:
- Compact spare ("donut"): Drive max 50 mph, max 50-70 miles
- Full-size spare: Drive normally, but get flat repaired
- Have flat inspected/repaired or replaced ASAP
- Retorque lug nuts after driving 50-100 miles
```

### Checking and Topping Off Fluids
```
FLUIDS TO CHECK REGULARLY:

1. ENGINE OIL
   How: Pull dipstick (warm engine, parked on level ground)
   Level: Between MIN and MAX marks
   Color: Honey/amber (new) to dark brown (needs change). Black = overdue.
   Top off with: Same weight oil as specified in manual (e.g., 5W-30)

2. COOLANT/ANTIFREEZE
   How: Check overflow reservoir level (NEVER open radiator cap when hot)
   Level: Between MIN and MAX marks on reservoir
   Color: Green, orange, pink, or blue (DO NOT mix colors/types)
   Top off with: 50/50 coolant mix or same type already in system

3. BRAKE FLUID
   How: Check reservoir under hood (usually near firewall, driver side)
   Level: Between MIN and MAX marks
   Color: Clear to light yellow (dark = needs flush)
   Top off with: DOT 3 or DOT 4 as specified (check cap)
   WARNING: Low brake fluid may indicate worn pads or a leak

4. POWER STEERING FLUID
   How: Check reservoir or dipstick (varies by vehicle)
   Level: Between HOT/COLD marks
   Top off with: Power steering fluid (check manual for type)
   Note: Some newer vehicles use electric power steering (no fluid)

5. TRANSMISSION FLUID
   How: Dipstick check (engine running, in Park, warm)
   Level: Between marks on dipstick
   Color: Red/pink (good), brown (service soon), black/burnt smell (urgent)
   Note: Many modern vehicles have sealed transmissions (dealer service only)

6. WINDSHIELD WASHER FLUID
   How: Check reservoir level
   Top off with: Washer fluid (not water, which can freeze)
```

---

## Maintenance Schedules

### Mileage-Based Maintenance
```
EVERY 3,000-5,000 MILES (or as specified):
[ ] Oil and filter change
    Traditional oil: every 3,000-5,000 miles
    Synthetic oil: every 5,000-10,000 miles (check manual)
    Cost: $30-75 (conventional) / $60-125 (synthetic)

EVERY 5,000-7,500 MILES:
[ ] Tire rotation
    Cost: $20-50 (often free with tire purchase)
    Pattern: Front-to-rear (directional) or cross-pattern (non-directional)

EVERY 15,000-30,000 MILES:
[ ] Air filter replacement ($15-40, easy DIY)
[ ] Cabin air filter ($15-30, usually easy DIY)
[ ] Brake inspection

EVERY 30,000-60,000 MILES:
[ ] Brake fluid flush ($75-150)
[ ] Transmission fluid change ($100-300)
[ ] Coolant flush ($75-150)
[ ] Spark plug replacement ($100-400)
[ ] Power steering fluid flush ($75-150)

EVERY 60,000-100,000 MILES:
[ ] Timing belt/chain inspection or replacement ($300-1,200)
    CRITICAL: If your car has a timing belt, this prevents catastrophic engine damage
[ ] Serpentine belt replacement ($75-200)
[ ] Water pump inspection ($300-750 if replacement needed)
[ ] Suspension component inspection

EVERY 100,000+ MILES:
[ ] Major service (all fluids, filters, belts, spark plugs)
[ ] Fuel system cleaning ($50-150)
[ ] Transmission overhaul assessment
```

### Seasonal Maintenance
```
SPRING:
[ ] Check tire condition and pressure
[ ] Replace wiper blades
[ ] Check AC system (before summer)
[ ] Wash undercarriage (remove road salt)
[ ] Check alignment (potholes from winter)

SUMMER:
[ ] Check coolant level and condition
[ ] Test AC performance
[ ] Check tire pressure (heat increases pressure)
[ ] Check battery (heat is battery's enemy)
[ ] Ensure spare tire is properly inflated

FALL:
[ ] Check antifreeze/coolant strength
[ ] Test heater and defroster
[ ] Check headlights and taillights (shorter days)
[ ] Consider winter tires (if applicable)
[ ] Check wiper blades

WINTER:
[ ] Battery test (cold cranking amps)
[ ] Check tire tread depth (penny test: insert penny, if you see Lincoln's head, need new tires)
[ ] Keep gas tank above half full (prevents fuel line freezing)
[ ] Emergency kit in trunk: blanket, flashlight, ice scraper, jumper cables, snacks, water
[ ] Check all lights and signals
```

---

## When to See a Mechanic

### DIY vs Mechanic Decision Guide

| Issue | DIY Possible? | Mechanic Needed? | Urgency |
|-------|:---:|:---:|---------|
| Oil change | Yes (easy) | Optional | Routine |
| Air filter | Yes (easy) | Optional | Routine |
| Wiper blades | Yes (easy) | Optional | As needed |
| Battery replacement | Yes (moderate) | Optional | Same day |
| Tire rotation | Yes (moderate) | Recommended | Routine |
| Brake pads | Yes (moderate-hard) | Recommended | Soon |
| Check engine light | Code read (easy) | For repair | Varies |
| Brake fluid flush | Possible (hard) | Recommended | Routine |
| Transmission service | No | Yes | Routine |
| Timing belt | No | Yes | Critical at mileage |
| Suspension work | No | Yes | Varies |
| AC repair | No | Yes | Comfort |
| Electrical diagnosis | No | Yes | Varies |
| Engine/transmission repair | No | Yes | Critical |

### Finding a Good Mechanic
```
HOW TO FIND A TRUSTWORTHY MECHANIC:

1. ASK FOR RECOMMENDATIONS
   - Friends, family, coworkers
   - Online reviews (Google, Yelp, BBB)
   - ASE certification is a positive indicator

2. LOOK FOR:
   - ASE (Automotive Service Excellence) certified technicians
   - Clean, organized shop
   - Willing to explain repairs
   - Provides written estimates before work
   - Warranty on parts and labor (90 days minimum)
   - Shows you the old parts
   - Doesn't pressure you into unnecessary work

3. RED FLAGS:
   - Won't provide written estimate
   - Adds services without your approval
   - Can't explain what's wrong in plain language
   - Pressure to do work immediately
   - Significantly cheaper than multiple other quotes
   - No warranty on work performed
   - Dirty, disorganized shop

4. GETTING ESTIMATES:
   - Get 2-3 estimates for major repairs
   - Ask: labor rate, parts cost, total estimate, warranty
   - Beware bait-and-switch (low quote, then "we found more issues")
   - Authorize ALL work before it begins
```

---

## Repair Cost Estimation

### Common Repair Costs (Approximate Ranges)
```
ENGINE:
Oil change: $30-75 (conventional) / $60-125 (synthetic)
Spark plugs: $100-400
Timing belt: $300-1,200
Head gasket: $1,000-3,000
Engine mount: $200-600
Thermostat: $150-350

BRAKES:
Brake pads (per axle): $150-350
Brake rotors + pads (per axle): $250-600
Brake fluid flush: $75-150
Brake caliper: $250-500
Brake line repair: $150-300

ELECTRICAL:
Battery: $100-250
Alternator: $300-700
Starter motor: $250-600
Fuse replacement: $5-20 (DIY) / $50-150 (shop)

SUSPENSION:
Struts/shocks (per pair): $300-800
Ball joints: $150-400
Tie rod end: $150-350
Wheel alignment: $75-150
Wheel bearing: $200-500

COOLING:
Radiator: $300-900
Water pump: $300-750
Coolant flush: $75-150
Radiator hose: $100-250

EXHAUST:
Catalytic converter: $500-2,500
Muffler: $100-400
Oxygen sensor: $150-400

TRANSMISSION:
Fluid change: $100-300
Clutch replacement (manual): $500-1,500
Transmission rebuild: $1,500-4,000+
Torque converter: $500-1,200

TIRES:
Single tire (sedan): $75-200
Set of 4 (sedan): $300-800
Set of 4 (SUV/truck): $400-1,200
Tire repair (patch): $15-30

Note: Luxury and European vehicles typically cost 30-100% more for parts and labor.
Prices vary significantly by region and shop type (dealer vs independent).
```

---

## Output Format

When diagnosing a vehicle issue, present it as:
```
VEHICLE DIAGNOSTIC ASSESSMENT
Vehicle: [Year Make Model]
Mileage: [Amount]
Reported Symptom: [Description]

LIKELY CAUSES (most to least probable):
1. [Cause] - Probability: [High/Medium/Low]
   Estimated Cost: $[Range]
   Urgency: [Drive immediately to shop / Schedule this week / Monitor]
   DIY Possible: [Yes/No]

2. [Cause] - Probability: [High/Medium/Low]
   Estimated Cost: $[Range]
   Urgency: [Level]
   DIY Possible: [Yes/No]

RECOMMENDED IMMEDIATE ACTION:
[What to do right now]

DIAGNOSTIC STEPS:
1. [Step]
2. [Step]
3. [Step]

DIY INSTRUCTIONS (if applicable):
Tools Needed: [List]
Difficulty: [Easy / Moderate / Hard]
Time: [Estimate]
[Step-by-step instructions]

WHEN TO SEE A MECHANIC:
[Criteria for professional help]
```

## Example

**Input:** "Help me get started with car mechanic advisor"

**Output:** A structured car mechanic advisor plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
