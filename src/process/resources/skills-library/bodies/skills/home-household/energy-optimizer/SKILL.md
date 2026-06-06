---
name: energy-optimizer
description: |
  Home energy efficiency advisor covering DIY energy audits, insulation assessment, smart thermostat optimization, LED conversion, appliance ratings, solar evaluation, utility bill analysis, weatherization, and rebate/incentive finding.
  Use when the user asks about energy optimizer, or needs help with home energy efficiency advisor covering diy energy audits, insulation assessment, smart thermostat optimization, led conversion, appliance ratings, solar evaluation, utility bill analysis, weatherization, and rebate/incentive finding.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of energy optimizer.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-maintenance energy-efficiency guide"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Energy Optimizer

## When to Use

**Use this skill when:**
- User asks about energy optimizer
- User needs guidance on energy optimizer topics
- User wants a structured approach to energy optimizer

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Overview

This skill helps homeowners reduce energy consumption, lower utility bills, and improve home comfort through systematic efficiency improvements. Using the Department of Energy guidelines, ENERGY STAR standards, and building science principles, this advisor walks you through a DIY energy audit and prioritizes improvements by cost-effectiveness and impact.

## Questions to Ask the User First

1. **What type of home?** (Single-family, townhouse, condo, apartment)
2. **How old is the home?** (Impacts insulation, windows, systems)
3. **What region/climate?** (Heating-dominant, cooling-dominant, mixed)
4. **Current monthly energy bills?** (Electric, gas, oil -- averages or last 12 months)
5. **Heating system type?** (Gas furnace, heat pump, boiler, electric baseboard, etc.)
6. **Cooling system type?** (Central AC, heat pump, window units, none)
7. **Water heater type?** (Gas tank, electric tank, tankless, heat pump)
8. **Have you already made any efficiency improvements?**
9. **What's your comfort complaint?** (Drafty, uneven temps, high bills, all of the above)
10. **Budget for improvements?** ($0-100, $100-500, $500-2000, $2000+)
11. **Homeowner or renter?** (Determines what changes are possible)
12. **Are you interested in solar?** (For long-term planning)

## DIY Energy Audit Walkthrough

### Step 1: Utility Bill Analysis
```
UTILITY BILL ANALYSIS:

Gather 12 months of utility bills (most utilities have online history).

MONTHLY TRACKING:
| Month | Electricity (kWh) | Electric ($) | Gas (therms) | Gas ($) | Total ($) |
|-------|-------------------|-------------|-------------|---------|-----------|
| Jan   | ___               | $___        | ___         | $___    | $___      |
| Feb   | ___               | $___        | ___         | $___    | $___      |
| Mar   | ___               | $___        | ___         | $___    | $___      |
| Apr   | ___               | $___        | ___         | $___    | $___      |
| May   | ___               | $___        | ___         | $___    | $___      |
| Jun   | ___               | $___        | ___         | $___    | $___      |
| Jul   | ___               | $___        | ___         | $___    | $___      |
| Aug   | ___               | $___        | ___         | $___    | $___      |
| Sep   | ___               | $___        | ___         | $___    | $___      |
| Oct   | ___               | $___        | ___         | $___    | $___      |
| Nov   | ___               | $___        | ___         | $___    | $___      |
| Dec   | ___               | $___        | ___         | $___    | $___      |
| TOTAL | ___               | $___        | ___         | $___    | $___      |

BASELINE USAGE:
  The lowest month = your base load (always-on: fridge, water heater, lighting)
  Highest - lowest = your weather-dependent load (heating/cooling)

BENCHMARKING:
  Average US electricity: ~900 kWh/month, ~$130/month
  Average US gas: ~60 therms/month (heating season)
  Your usage vs average: _______________

IF YOUR BILLS ARE HIGH, the audit below will identify where energy is going.
```

### Step 2: Air Leak Detection
```
AIR LEAK DETECTION (biggest energy waster in most homes):

COMMON LEAK LOCATIONS (check all):
  [ ] Windows -- feel around frames and where glass meets frame
  [ ] Exterior doors -- check all edges and thresholds
  [ ] Electrical outlets on exterior walls (remove cover, feel for drafts)
  [ ] Light switches on exterior walls
  [ ] Recessed lights (can lights) in insulated ceilings
  [ ] Attic hatch or pull-down stairs
  [ ] Plumbing and wiring penetrations (where pipes/wires enter walls)
  [ ] Dryer vent
  [ ] Fireplace damper (close when not in use)
  [ ] Mail slot (if present)
  [ ] Where siding meets foundation
  [ ] Around A/C window units
  [ ] Exhaust fans
  [ ] Where foundation meets framing (sill plate)

DETECTION METHODS:

Method 1: INCENSE STICK TEST
  On a windy day, hold a lit incense stick near suspected leak areas.
  If smoke blows horizontally or wavers, you've found a leak.
  Mark each spot with painter's tape.

Method 2: HAND TEST
  On a cold, windy day, slowly move your hand around windows,
  doors, outlets. You'll feel cold air infiltrating.

Method 3: FLASHLIGHT TEST (for exterior gaps)
  At night, have someone shine a flashlight along exterior edges
  while you look from outside. Light visible = air leak.

Method 4: PRESSURIZE THE HOUSE (advanced)
  Close all doors, windows, and fireplace dampers.
  Turn on all exhaust fans (kitchen, bathroom).
  This creates negative pressure, making leaks easier to detect
  with the incense or hand method.

LEAK SEVERITY RATING:
  Small gap (< 1/16"): Caulk
  Medium gap (1/16" - 1/2"): Expanding foam or weatherstripping
  Large gap (> 1/2"): Backer rod + caulk, or hardware cloth + foam
```

### Step 3: Insulation Assessment
```
INSULATION CHECK:

ATTIC INSULATION:
  Access attic safely (headlamp, boards to walk on, mask)
  Measure depth of existing insulation: ___ inches
  Type: [ ] Fiberglass batts [ ] Blown cellulose [ ] Blown fiberglass [ ] None

  RECOMMENDED R-VALUES BY CLIMATE ZONE:
  Zones 1-3 (South): R-30 to R-38 (10-13 inches fiberglass)
  Zones 4-5 (Central): R-38 to R-49 (13-17 inches fiberglass)
  Zones 6-8 (North): R-49 to R-60 (17-21 inches fiberglass)

  Current R-value estimate: ___
  Target R-value: ___
  Gap: ___ inches more insulation needed

  NOTE: Attic insulation is the #1 most cost-effective insulation upgrade.
  Payback period: typically 1-3 years.

WALL INSULATION:
  Hard to check without removing material. Indicators:
  - Cold interior walls in winter = likely poor insulation
  - Touch interior of exterior wall: should be room temp, not cold
  - Check from attic: is the top of exterior walls insulated?
  - Check from basement/crawlspace: is the bottom insulated?
  - For definitive answer: professional energy audit with infrared camera

BASEMENT/CRAWLSPACE:
  [ ] Check rim joist area (where floor meets foundation)
      This is often the biggest uninsulated area. Insulate with rigid
      foam board or spray foam. R-10 to R-19 recommended.
  [ ] Basement walls: uninsulated concrete loses significant heat
      Interior rigid foam or stud wall with fiberglass
  [ ] Crawlspace: insulated floor above? Encapsulated? Vented?

PIPES AND DUCTS:
  [ ] Hot water pipes in unconditioned spaces: insulate with pipe foam
      Cost: $1-3 per 6-foot section. Saves $10-20/year on water heating.
  [ ] HVAC ductwork in unconditioned spaces (attic, crawlspace):
      Insulate with duct wrap or rigid board
      Leaky/uninsulated ducts waste 20-30% of heating/cooling energy
  [ ] Seal duct joints with mastic or metal tape (NOT duct tape)
```

### Step 4: Window and Door Assessment
```
WINDOW EFFICIENCY CHECK:

WINDOW TYPE IDENTIFICATION:
  [ ] Single pane (pre-1970s, very inefficient) -- R-value ~1
  [ ] Double pane, clear glass -- R-value ~2
  [ ] Double pane, Low-E coating -- R-value ~3
  [ ] Triple pane -- R-value ~5-7

CHECK FOR:
  [ ] Condensation between panes (seal failure -- window needs replacing)
  [ ] Drafts around frames (caulk/weatherstrip -- much cheaper than replacing)
  [ ] Cracked or broken glass
  [ ] Difficulty opening/closing (may indicate structural shifting)
  [ ] Missing or damaged weatherstripping

COST-EFFECTIVE WINDOW IMPROVEMENTS:
  (Listed from cheapest to most expensive)
  1. Caulk exterior gaps: $5-10 total
  2. Add weatherstripping: $3-8 per window
  3. Install window film (shrink-fit plastic): $5-10 per window, R-value +1
  4. Add cellular/honeycomb blinds: $30-100 per window, R-value +2-3
  5. Install storm windows: $50-200 per window
  6. Replace windows: $300-1000+ per window (long payback period)

IMPORTANT: Replacing windows is almost NEVER cost-effective for energy
savings alone. The payback period is 15-30+ years. Do it for comfort,
noise, aesthetics, or home value -- but not primarily for energy savings.
Fix air leaks around existing windows first (90% of the benefit at 5% cost).

DOOR CHECK:
  [ ] Weatherstripping around frame intact?
  [ ] Door sweep at bottom? (No daylight visible)
  [ ] Threshold adjusted properly?
  [ ] Deadbolt engages smoothly? (Misalignment = gap)
  [ ] Storm door present? (adds significant insulation value)
```

## Smart Thermostat Optimization
```
SMART THERMOSTAT GUIDE:

RECOMMENDED SETTINGS:
  Heating Season:
    When home and awake: 68F (saves significantly vs 72F)
    When asleep: 62-65F
    When away (8+ hours): 58-62F
    Each degree lower saves ~3% on heating bill

  Cooling Season:
    When home: 78F (with ceiling fans = feels like 72F)
    When away: 85F or off
    When sleeping: 75-78F
    Each degree higher saves ~3% on cooling bill

SMART THERMOSTAT BENEFITS:
  - Learns your schedule automatically
  - Adjusts based on occupancy detection
  - Remote control via phone
  - Energy usage reports
  - Integration with utility demand response programs
  - Estimated savings: 10-15% on heating, 10-15% on cooling

TOP PICKS:
  Ecobee SmartThermostat: Room sensors, Alexa built-in, $200-250
  Google Nest: Learning algorithm, clean interface, $130-250
  Honeywell Home T9: Room sensors, traditional brand, $150-200

INSTALLATION:
  DIY difficulty: Beginner-Intermediate
  Time: 30-60 minutes
  Need: Existing thermostat wires, C-wire (or adapter)
  When to call a pro: If you don't have a C-wire and adapter isn't included,
  or if your system is complex (heat pump + aux heat, multi-zone)

OPTIMIZATION TIPS:
  - Don't supersede the schedule frequently (defeats the purpose)
  - Use away mode when traveling
  - Set reasonable setbacks (extreme setbacks use more energy recovering)
  - Keep furniture and curtains away from thermostat
  - Lock the thermostat if household members constantly adjust it
```

## LED Conversion
```
LED LIGHTING CONVERSION:

WHY SWITCH:
  LED vs Incandescent:
    Energy use: 75-80% less
    Lifespan: 25,000 hours vs 1,000 hours
    Heat output: 80% less (reduces cooling load too)
    Cost per year per bulb (3 hrs/day): ~$1.50 vs ~$7.50

WHOLE-HOME CALCULATION:
  Number of light sockets in home: ___
  Currently incandescent/halogen: ___
  Currently CFL: ___
  Currently LED: ___

  Bulbs to convert: ___
  Cost per LED bulb: $2-5 average
  Total conversion cost: $___
  Annual savings: approximately $__ per bulb converted
  Payback period: ___ months

LED SELECTION GUIDE:
  Brightness:
    40W equivalent = 450 lumens (accent, bedside)
    60W equivalent = 800 lumens (general room)
    75W equivalent = 1100 lumens (reading, kitchen)
    100W equivalent = 1600 lumens (workshop, task)

  Color Temperature:
    2700K (Soft White): Warm, like incandescent. Best for living rooms, bedrooms.
    3000K (Warm White): Slightly brighter warm. Good for kitchens, bathrooms.
    3500K (Neutral): Clean, balanced. Good for offices, laundry.
    4000K (Cool White): Bright, crisp. Good for garages, task areas.
    5000K+ (Daylight): Very bright, blue-ish. Good for workshops, security.

  For most homes: 2700K throughout living areas, 3000-3500K in kitchens/baths/offices.

DIMMER COMPATIBILITY:
  Not all LEDs work with old dimmers (may buzz or flicker)
  Solution: Buy "dimmable" LEDs and if issues, replace dimmer switch
  with LED-compatible dimmer ($15-25, easy DIY swap)
```

## Appliance Efficiency
```
APPLIANCE ENERGY USAGE AND EFFICIENCY:

TOP ENERGY-CONSUMING APPLIANCES (typical home):

1. HVAC SYSTEM: 45-50% of energy bill
   Upgrade priority: HIGHEST
   If replacing: Look for SEER 16+ (AC), AFUE 95%+ (furnace),
   HSPF 9+ (heat pump)
   Heat pumps are most efficient option in moderate climates

2. WATER HEATER: 15-20% of energy bill
   Tank (gas): Look for Energy Factor 0.65+
   Tank (electric): Look for Energy Factor 0.95+
   Heat pump water heater: 2-3x more efficient than electric tank
   Tankless: saves 20-30% vs tank, unlimited hot water

3. WASHER/DRYER: 5-10% of energy bill
   Washer: ENERGY STAR, front-load uses 25% less energy than top-load
   Dryer: Heat pump dryers use 50% less energy (higher upfront cost)
   Free savings: Wash in cold water (saves 90% of washer energy)

4. REFRIGERATOR: 5-8% of energy bill
   ENERGY STAR models: 15-20% more efficient than minimum standard
   Age matters: A 2005 fridge uses 40%+ more than a 2024 model
   Maintenance: Clean coils every 6-12 months, check door seal

5. DISHWASHER: 2-4% of energy bill
   ENERGY STAR: uses 12% less energy and 30% less water
   Free savings: Run full loads, use air-dry setting

ENERGY STAR LABEL:
  Always look for ENERGY STAR when replacing any appliance.
  EnergyGuide yellow label shows estimated annual operating cost.
  Compare operating cost between models (may justify higher purchase price).

SHOULD I REPLACE MY OLD APPLIANCE?
  Calculate: (Old annual cost - New annual cost) x Expected life of new
  If this exceeds the price difference, replace.
  Rule of thumb: Replace refrigerators 15+ years old, HVAC 15+ years old.
```

## Solar Evaluation
```
SOLAR BASICS EVALUATION:

IS SOLAR RIGHT FOR YOUR HOME?

ROOF ASSESSMENT:
  Orientation: [ ] South-facing (ideal) [ ] East/West (good) [ ] North (poor)
  Shading: [ ] No shade [ ] Some shade [ ] Significant shade
  Roof condition: [ ] Good (15+ years left) [ ] Needs repair/replacement
  Roof type: [ ] Asphalt shingle (easy) [ ] Tile (possible) [ ] Metal (easy)
  Available area: ___ sq ft of suitable roof space

  Rule of thumb: 100 sq ft of roof = ~1 kW of solar = ~1,200-1,500 kWh/year

FINANCIAL EVALUATION:
  Current annual electricity cost: $___
  Average system size for your usage: ___ kW
  Estimated system cost (before incentives): $___
  Federal tax credit (30% ITC through 2032): -$___
  State/local incentives: -$___
  Net cost after incentives: $___
  Estimated annual savings: $___
  Simple payback period: ___ years

  Average US payback: 7-12 years
  System lifespan: 25-30+ years
  Return on investment: typically 10-20% annually after payback

OPTIONS:
  Purchase outright: Best ROI, you own the system
  Solar loan: $0 down, monthly payment < current electric bill (ideally)
  Solar lease/PPA: No upfront cost, lower savings, don't own the system
  Community solar: No roof installation, subscribe to a local solar farm

NEXT STEPS IF INTERESTED:
  1. Check your roof suitability (Google Sunroof tool is free)
  2. Get 3+ quotes from local installers (EnergySage.com for comparison)
  3. Ask about net metering policy in your area
  4. Check state and local incentives (DSIRE database: dsireusa.org)
  5. Review your HOA rules if applicable
```

## Rebates and Incentives
```
FINDING ENERGY EFFICIENCY REBATES:

FEDERAL INCENTIVES:
  [ ] Energy Efficient Home Improvement Credit (25C)
      30% credit up to $1,200/year for insulation, windows, doors, AC
      Up to $2,000 for heat pump, heat pump water heater
  [ ] Residential Clean Energy Credit (25D)
      30% credit for solar, battery storage, geothermal
  [ ] Inflation Reduction Act rebates (income-dependent)
      Up to $8,000 for heat pump
      Up to $1,750 for heat pump water heater
      Up to $840 for electric stove/dryer/panel upgrade

STATE INCENTIVES:
  Check: dsireusa.org (Database of State Incentives for Renewables & Efficiency)
  Your state: _______________
  Available programs: _______________

UTILITY REBATES:
  Check your electric and gas utility websites
  Common rebates:
    [ ] Smart thermostat: $50-100
    [ ] ENERGY STAR appliances: $25-300 per appliance
    [ ] Insulation: $0.10-0.50 per sq ft
    [ ] HVAC: $200-1,000 for high-efficiency systems
    [ ] LED bulbs: sometimes free through utility programs
    [ ] Home energy audit: often free or subsidized
    [ ] Heat pump: $500-2,000+

  Your electric utility: _______________
  Rebate page: _______________
  Your gas utility: _______________
  Rebate page: _______________

STACKING INCENTIVES:
  You can often combine federal + state + utility rebates.
```

## Priority Action Plan
```
ENERGY EFFICIENCY PRIORITY ORDER
(Ranked by cost-effectiveness and impact):

TIER 1: FREE / $0 (do today):
  [ ] Adjust thermostat settings (2-3 degrees)
  [ ] Switch to cold water washing
  [ ] Turn off lights when leaving rooms
  [ ] Unplug phantom loads (chargers, electronics on standby)
  [ ] Clean HVAC filter
  [ ] Close fireplace damper when not in use
  [ ] Use ceiling fans (counterclockwise summer, clockwise winter)
  [ ] Run dishwasher and laundry only with full loads
  [ ] Air-dry dishes instead of heated dry cycle
  Savings: 5-15% on bills

TIER 2: LOW COST / $20-200:
  [ ] Seal air leaks with caulk and weatherstripping ($50-100)
  [ ] Install LED bulbs throughout ($50-150)
  [ ] Insulate hot water pipes ($20-40)
  [ ] Add door sweeps ($10-20 each)
  [ ] Install smart power strips ($20-30 each)
  [ ] Lower water heater to 120F (free, saves $36-61/year)
  [ ] Window film for single-pane windows ($5-10/window)
  Savings: 10-20% on bills, payback 1-6 months

TIER 3: MODERATE / $200-2000:
  [ ] Install smart thermostat ($130-250)
  [ ] Add attic insulation ($500-1500 DIY, $1000-2500 pro)
  [ ] Seal and insulate ductwork ($200-600 DIY)
  [ ] Install storm windows ($50-200 each)
  [ ] Insulate rim joists ($200-500 DIY)
  Savings: 15-30% on bills, payback 1-3 years

TIER 4: SIGNIFICANT / $2000+:
  [ ] High-efficiency HVAC replacement ($5,000-15,000)
  [ ] Heat pump water heater ($1,500-3,500)
  [ ] Solar panel installation ($15,000-25,000 before incentives)
  [ ] Window replacement ($300-1000 per window)
  [ ] Spray foam insulation ($3,000-10,000)
  Savings: 30-70% on bills, payback 3-15 years
```

## Output Format

When providing energy optimization advice:
```
ENERGY EFFICIENCY ASSESSMENT

Home: [type, age, size, climate]
Current annual energy cost: $___
Estimated savings potential: $___/year (___%)

TOP PRIORITY ACTIONS:
  1. [Action] - Cost: $__ - Annual savings: $__ - Payback: __
  2. [Action] - Cost: $__ - Annual savings: $__ - Payback: __
  3. [Action] - Cost: $__ - Annual savings: $__ - Payback: __

AVAILABLE INCENTIVES:
  Federal: ___
  State: ___
  Utility: ___
  Total incentives available: $___

IMPLEMENTATION PLAN:
  This weekend: [free/low-cost actions]
  This month: [moderate actions]
  This year: [larger projects to plan for]

PROJECTED RESULTS:
  Current annual cost: $___
  After Tier 1 & 2: $___
  After all improvements: $___
  Total investment: $___
  Simple payback: ___ years
```

## Example

**Input:** "Help me get started with energy optimizer"

**Output:** A structured energy optimizer plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
