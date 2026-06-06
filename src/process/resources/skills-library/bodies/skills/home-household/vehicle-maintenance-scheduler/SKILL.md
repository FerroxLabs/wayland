---
name: vehicle-maintenance-scheduler
description: |
  Vehicle maintenance scheduler covering mileage-based maintenance schedules, seasonal preparation for winter and summer, tire rotation and replacement, brake inspection intervals, fluid change schedules, filter replacements, battery care, and a maintenance log template.
  Use when the user asks about vehicle maintenance scheduler, or needs help with vehicle maintenance scheduler covering mileage-based maintenance schedules, seasonal preparation for winter and summer, tire rotation and replacement, brake inspection intervals, fluid change schedules, filter replacements, battery care, and a maintenance log template.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of vehicle maintenance scheduler.
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
# Vehicle Maintenance Scheduler

> **NOTE:** Always cross-reference manufacturer-specific intervals in the owner's manual. These schedules represent industry-standard guidelines, but OEM recommendations take precedence. Vehicles with oil life monitoring systems (GM's Oil Life System, Honda's Maintenance Minder, BMW's Condition Based Service) use algorithm-based alerts that override fixed mileage intervals -- follow those alerts unless you drive under severe conditions, in which case you may need to service earlier than the system suggests.

---

## When to Use

**Use this skill when:**
- A user wants to build a personalized, mileage- and date-based maintenance schedule for a specific vehicle (year, make, model, engine)
- A user is purchasing a used vehicle and needs to audit what maintenance is overdue based on current mileage and service history gaps
- A user is preparing a vehicle for seasonal transition (pre-winter antifreeze testing, pre-summer cooling system check, spring underbody wash after road salt exposure)
- A user has received a shop estimate and wants to prioritize which services are genuinely overdue vs. which are upsells based on their actual mileage and driving profile
- A user needs a structured maintenance log to track service history, forecast upcoming costs, and prepare for vehicle resale with documented records
- A user is approaching a major mileage milestone (60K, 100K, 150K) and needs a comprehensive service audit
- A user wants to compare DIY vs. shop costs for specific services and understand which repairs are realistic for a home mechanic

**Do NOT use when:**
- The user describes an active mechanical failure (engine misfiring, brake fade, overheating in progress) -- use a vehicle diagnostics or roadside troubleshooting skill instead
- The user needs a smog or emissions inspection -- regulations are jurisdiction-specific and require a certified emissions skill or local authority guidance
- The user is asking about major engine or transmission rebuilds -- those require a specialized engine rebuild or drivetrain repair skill
- The user needs warranty coverage advice -- defer to the dealership's warranty documentation and consumer protection resources
- The user is asking about commercial fleet maintenance (3+ vehicles operated for business) -- fleet management involves DOT compliance, FMCSA regulations, and dedicated fleet software beyond this skill's scope
- The user is working on a classic or antique vehicle (pre-1980) -- parts sourcing, ethanol-blended fuel considerations, and non-electronic ignition systems require a classic vehicle restoration skill

---

## Questions to Ask the User First

Before generating any schedule, collect the following. If the user volunteers this information upfront, skip directly to the Process section.

1. **Vehicle details:** Year / Make / Model / Engine (e.g., 2018 Honda CR-V 1.5T or 2015 Ford F-150 5.0 V8)
2. **Current odometer reading** (exact mileage)
3. **Last known service:** What was done and at what mileage? If unknown, state unknown -- that changes the approach significantly.
4. **Driving profile:** City stop-and-go, highway commuting, mixed, or severe (towing, off-road, dusty, extreme temps)
5. **Annual mileage estimate:** Under 7,500 / 7,500-12,000 / 12,000-15,000 / 15,000-20,000 / over 20,000
6. **Climate zone:** Sun Belt (sustained heat, UV exposure), Northern Rust Belt (road salt, freeze-thaw cycles), Mountain/Arid, Coastal (salt air humidity), or Temperate
7. **Maintenance minder system:** Does the dash display oil life percentage or a wrench icon system? (Honda, GM, BMW, and Ford use different systems)
8. **Service history availability:** Full dealer records, partial records, no records (just purchased used), or DIY-maintained with personal logs
9. **Goals:** Maximize vehicle longevity, minimize near-term spending, prepare for resale, or plan a specific long trip

---

## Driving Condition Classification

Proper classification determines whether to use normal or severe intervals. This distinction can shift a 7,500-mile oil change interval to 5,000 miles, and a 60,000-mile transmission service to 30,000 miles.

```
NORMAL CONDITIONS (all of the following must apply):
  - Trips predominantly over 10 miles in moderate temperatures (20F to 90F)
  - Mostly highway driving at sustained speeds
  - No towing, no trailer, payload under 50% of rated capacity
  - Annual mileage 10,000-15,000 miles
  - Flat to gently rolling terrain
  - No prolonged idling

SEVERE CONDITIONS (ANY single factor below qualifies as severe):
  - Short trips under 5 miles, especially below 40F (oil never reaches full operating temp,
    fuel and moisture contaminate oil)
  - Extended stop-and-go city driving (delivery, ride-share, urban commute)
  - Ambient temperatures routinely above 95F or below 10F
  - Towing, hauling, or payload over 50% of rated capacity
  - Off-road use, unpaved roads, dusty or sandy environments
  - Mountain driving with sustained grade climbing or engine braking descents
  - Extended idling (taxi, food truck, fleet operations)
  - High humidity environments (coastal or tropical climates)
  - Ride-share or delivery driving (high idle time + frequent stop-start)

IMPORTANT: Studies from AAA and the Car Care Council consistently show that
over 70% of drivers actually qualify as severe-condition drivers by at least
one criterion. When in doubt, use the severe schedule. The cost difference
between normal and severe intervals is small; the cost of premature engine
wear is large.
```

---

## Process

### Step 1: Establish the Vehicle Baseline

- Record the exact odometer reading and date as the baseline anchor for all future intervals
- Identify the engine type: gasoline naturally aspirated, turbocharged gasoline (turbo engines run hotter and require more frequent oil changes -- many manufacturers specify 5,000-mile intervals regardless of oil type), diesel, or hybrid (hybrids use the engine less at low speeds, which can actually extend oil change intervals while shortening brake inspection intervals due to regenerative braking masking pad wear)
- Look up the manufacturer's Maintenance Schedule B (severe) in the owner's manual, not just Schedule A (normal) -- most vehicles published after 2010 include both
- Confirm whether the vehicle uses a timing belt or timing chain. Timing belts (common on Honda, Toyota 4-cylinder, Subaru, Hyundai/Kia) have hard replacement intervals typically between 60,000 and 105,000 miles. Timing chains are designed to last the engine's life but can stretch and require tensioner service around 100,000-120,000 miles on high-mileage vehicles
- Note if the vehicle is turbocharged: turbos require full synthetic oil without exception, more frequent oil changes (often 5,000-mile caps even on synthetic), and a 60-second cool-down idle before shutdown to prevent oil coking in the turbo bearing

### Step 2: Audit Current Status Against Mileage Milestones

- Map every standard interval against the current odometer to identify overdue, due-soon, and upcoming services
- For vehicles with unknown service history (purchased used), apply the "unknown history protocol": treat all services as overdue up to the current mileage, prioritize in this order -- (1) engine oil and filter, (2) brake fluid test with a test strip or refractometer, (3) coolant freeze point test, (4) transmission fluid condition check via dipstick color and smell, (5) air filters visual inspection, (6) spark plugs if over 60,000 miles
- Calculate time-based intervals in addition to mileage -- a vehicle driven only 4,000 miles per year should still change oil at least annually even if the mileage interval is not reached
- Check tire DOT manufacturing date: the last four digits of the DOT code on the sidewall represent the week and year of manufacture (e.g., "2319" = 23rd week of 2019). Tires over 6 years old should be replaced regardless of tread depth. Tires over 10 years old are a safety hazard unconditionally.
- Run a battery load test benchmark: battery internal resistance increases with age. A battery that passes a voltage test (12.6V fully charged) may still fail a load test. Load test results below 70% of rated Cold Cranking Amps (CCA) mean replacement is imminent.

### Step 3: Classify Each Service by Priority

Assign each identified service one of four priority tiers:

```
TIER 1 -- SAFETY CRITICAL (address within 2 weeks or before next drive):
  Brake pads below 2mm, brake fluid moisture above 3% (test strip),
  tires with tread at or below 2/32", visible tire sidewall damage,
  any active warning light related to brakes or steering

TIER 2 -- OPERATIONALLY URGENT (address within 30 days):
  Oil overdue by more than 2,000 miles past interval, coolant freeze
  point inadequate for local winter temps, timing belt past due date,
  battery load test below 70% CCA in fall before winter

TIER 3 -- SCHEDULED MAINTENANCE (address within 90 days or next service):
  Filters, rotations, fluid top-offs, wiper blades, cabin air filter

TIER 4 -- PLANNED/UPCOMING (schedule within 6-12 months):
  Services approaching but not yet due, seasonal prep items,
  spark plug replacement approaching interval, major milestone services
```

### Step 4: Build the Mileage-Based Master Schedule

Use the table below as the foundational framework, then adjust based on vehicle-specific OEM data:

```
OIL AND FILTER:
  Conventional: Every 3,000-5,000 mi (rarely recommended for post-2010 vehicles)
  Synthetic Blend: Every 5,000-7,500 mi
  Full Synthetic: Every 7,500-10,000 mi (normal); 5,000-7,500 mi (severe or turbo)
  High-Mileage Synthetic (75K+ odometer): Same intervals; contains seal conditioners
    and detergents that reduce oil consumption in worn engines
  Oil Weight: Always use OEM-specified weight. 0W-20 is standard for most modern
    Asian and domestic engines. 5W-30 for older V8s. 0W-40 or 5W-40 for European
    vehicles (BMW, Mercedes, VW/Audi). Using the wrong viscosity can cause poor cold
    starts and increased wear.

TIRE ROTATION: Every 5,000-7,500 mi
  FWD: Front tires wear 2-3x faster than rear. Front axle tires move straight
    to rear (same side). Rear tires cross to front opposite sides.
  RWD: Rear axle wears faster. Rear tires move straight forward. Fronts cross to rear.
  AWD/4WD: X-pattern (each tire moves to opposite corner) or forward-cross depending
    on whether tires are directional. Critical to keep AWD tires within 2/32" of each
    other -- significant tread depth differences stress the center differential.
  Directional tires: Cannot be crossed. Rotate front-to-rear same side only.
    Staggered fitment (rear tires wider than front): Cannot be rotated -- plan for
    more frequent rear tire replacement or consider dismounting and remounting.

BRAKE INSPECTION:
  Visual: Every oil change (5,000-7,500 mi). Note pad thickness, rotor surface.
  Detailed caliper/hardware: Every 15,000-20,000 mi
  Brake fluid moisture test: Annually (test strips cost $2 each; above 3% moisture
    = flush needed due to lowered boiling point risking vapor lock)
  Typical front pad life: 25,000-50,000 mi (shorter in city driving)
  Typical rear pad life: 35,000-70,000 mi (unless rear disc with electronic parking
    brake -- those wear faster due to parking brake application)

AIR FILTERS:
  Engine air filter: Inspect at 15,000 mi, replace at 25,000-30,000 mi (dusty
    environments: inspect every 10,000 mi, replace at 15,000-20,000 mi)
  Cabin air filter: Replace every 15,000-25,000 mi or annually, whichever first.
    Activated carbon cabin filters (HEPA-style): Replace every 12,000-15,000 mi.
    Signs of need: musty AC smell, reduced airflow from vents, allergy symptoms.

SPARK PLUGS:
  Conventional copper: 30,000 mi (rare on modern vehicles -- mostly pre-2000)
  Platinum single: 60,000 mi
  Double platinum or iridium: 90,000-100,000 mi (many Toyota, Honda, Subaru engines)
  Iridium performance: Up to 120,000 mi (some BMW, Mercedes specifications)
  Note: Turbocharged engines often require plug replacement at 60,000 mi even with
    iridium plugs due to higher combustion heat and pressure.

COOLANT (ANTIFREEZE):
  Green (IAT -- Inorganic Additive Technology): Replace every 30,000 mi or 2 years
  Orange/Red (OAT -- Organic Acid Technology, e.g., GM Dex-Cool): Every 5 years or
    100,000-150,000 mi
  Pink/Blue (HOAT -- Hybrid OAT, Toyota Pink, European G13): Every 50,000 mi or
    5 years
  NEVER mix coolant types without full flush -- incompatible chemistries form silicate
    gels that clog the radiator and heater core.
  Test freeze point twice yearly: Spring (verify summer protection above 265F boil-over
    point) and Fall (verify freeze protection to at least -34F for most climates).

TRANSMISSION FLUID:
  Automatic (conventional ATF): 30,000-60,000 mi severe; 60,000-90,000 mi normal
  Automatic (synthetic ATF): 60,000-100,000 mi severe; 100,000+ mi normal
  CVT (Continuously Variable Transmission): 30,000-60,000 mi -- CVTs are extremely
    sensitive to fluid degradation; the "lifetime fluid" claim from some OEMs is
    misleading. Change at 60,000 mi to preserve CVT belt/chain life.
  Manual: Every 30,000-45,000 mi severe; 60,000 mi normal
  Note: Color and smell test. ATF should be red/pink with no burnt smell. Dark brown
    or black with burnt smell = service immediately. Never add universal ATF without
    verifying the specific fluid spec (e.g., Honda ATF-DW1, Toyota WS, ZF LifeguardFluid 8).

BRAKE FLUID:
  Replace every 2 years or 30,000 mi regardless of fluid appearance
  Brake fluid is hygroscopic -- it absorbs moisture from the atmosphere through
    microscopic pores in rubber brake lines and reservoir caps. At 3% moisture
    content, the boiling point of DOT 3 drops from 401F to 284F, risking vapor lock
    during hard braking. DOT 4 is more resistant but still absorbs moisture.
  DOT 3 and DOT 4 are compatible and can be mixed. DOT 5 (silicone) is NOT compatible
    with DOT 3/4 systems -- never mix.

POWER STEERING FLUID (hydraulic systems only):
  Check monthly via reservoir. Inspect for color (should be amber/red/clear).
  Replace every 50,000-100,000 mi or if foam, discoloration, or burnt smell
  Electric power steering (EPAS) -- no fluid, only inspect pump motor connector

DIFFERENTIAL AND TRANSFER CASE (AWD/4WD/RWD vehicles):
  Front and rear differential fluid: Every 30,000 mi severe; 60,000 mi normal
  Transfer case fluid: Every 30,000 mi (4WD), every 60,000 mi (AWD)
  Limited-slip differentials require specific additive (friction modifier) -- check
    for chatter on tight turns as a symptom of depleted additive

SERPENTINE/DRIVE BELT:
  Inspect every 25,000 mi; replace every 60,000-100,000 mi
  Visual signs: cracking, fraying, glazing (shiny surface), missing ribs
  Belt tension and automatic tensioner spring tension: Check by pressing belt midspan.
    Deflection over 1/2 inch on a long run indicates wear. Failed tensioner causes
    belt slippage without visible belt damage.
  Note: On interference engines, serpentine belt failure strands the vehicle. On
    non-interference engines, failure strands but does not cause engine damage.

TIMING BELT (interference engines only):
  Honda 4-cylinder (most): 60,000-90,000 mi (check specific model -- CR-V 2.4L is
    105,000 mi; 2017+ uses a chain)
  Toyota 4-cylinder (older): 60,000-90,000 mi (most post-2005 Camry 4-cyl use chain)
  Subaru EJ series: 105,000 mi
  Hyundai/Kia Theta II: 60,000 mi
  ALWAYS replace water pump simultaneously with timing belt -- water pump failure
    at 80,000 mi on a vehicle with a new belt at 70,000 mi requires complete disassembly
    again. Labor is nearly identical; the pump costs $30-80 in parts.
  Also replace: timing belt tensioner pulley and idler pulley, cam and crank seals
    if showing weeping oil. Full kit cost: $200-500 in parts; $400-900 labor.
    Catastrophic cost of skipping: $2,000-8,000 engine rebuild on interference engines.

BATTERY:
  Lifespan: 3-5 years in temperate climates; 2-4 years in extreme heat (Phoenix, AZ)
    or extreme cold (Minnesota winters) -- heat actually degrades batteries faster than
    cold, though cold exposes weakness
  Cold Cranking Amps (CCA) required: Check door jamb or owner's manual. Never replace
    with a lower CCA rating. Higher CCA is acceptable.
  Battery test methods: (1) Load test at auto parts store (free) using a conductance
    tester, (2) Voltage test: 12.6V = fully charged, 12.4V = 75%, 12.2V = 50%,
    below 12V = failing. (3) Self-discharge test: charge fully, wait 24 hours,
    recheck voltage. Drop over 0.2V indicates internal short.
  Terminal cleaning: Disconnect negative first, then positive. Apply baking soda paste
    to terminals, scrub with wire brush, rinse with water, dry, reconnect positive
    first, then negative. Apply terminal protector spray or petroleum jelly.
  If vehicle sat over 2 weeks: Use a smart charger/maintainer (Battery Tender brand
    is a common standard) -- avoids sulfation damage from deep discharge.
```

### Step 5: Layer the Seasonal Preparation Schedule

Address season-specific items on top of the mileage-based schedule, timed to climate transitions:

```
PRE-WINTER CHECKLIST (perform in October in Northern climates; November in mid-latitude):
  [ ] Antifreeze concentration test: Use a refractometer or float-type tester.
      Target: protection to at least -34F (-37C) for most North American climates.
      Full-strength antifreeze freezes at 0F -- always dilute 50/50 with distilled water.
  [ ] Battery load test: A battery at 70% capacity in summer becomes a non-starter at 10F.
      Cold reduces battery output to 40% of rated CCA at 0F. Replace any battery
      4+ years old or testing below 70% CCA before first hard freeze.
  [ ] Tire prep: Install dedicated winter tires when ambient temps drop consistently below 45F.
      All-season tires lose significant grip below 45F due to rubber compound hardening.
      Winter tires are compound-engineered to remain pliable below 45F.
      Minimum tread for safe winter driving: 6/32" (vs. 2/32" legal minimum).
      Tire pressure drops approximately 1 PSI for every 10F drop in temperature -- check
      and inflate cold tires to door-jamb spec, not the summer-set pressure.
  [ ] Windshield washer fluid: Replace summer fluid with -20F or -40F winter blend.
      Do not dilute winter washer fluid -- full-strength is required for freeze resistance.
  [ ] Wiper blades: Switch to winter/beam-style wipers that resist ice packing in the frame.
      Replace if blade smears or skips at any angle.
  [ ] Heating and defrost system test: Run heater on max, verify cabin reaches operating
      temperature within 5-8 minutes. Test front and rear defroster grid -- use a grid
      test kit or simply feel for heat zones on the glass.
  [ ] 4WD/AWD engagement test: Engage 4-High and 4-Low (if equipped) at least once
      before snow season to confirm vacuum/mechanical actuator function.
  [ ] Emergency kit: Wool blanket, chemical hand warmers (4-hour minimum), LED flashlight
      with fresh batteries, jumper cables (12-gauge minimum, 20-foot preferred), sand or
      cat litter (5 lb bag) for traction, collapsible snow shovel, reflective triangles,
      first aid kit, extra medications, water (insulated to prevent freezing), phone charger.

PRE-SUMMER CHECKLIST (perform in April in most climates):
  [ ] Coolant pressure test: A radiator cap that cannot hold 15 PSI allows the system to
      boil at a lower temperature. Caps cost $10-15 and are often overlooked.
  [ ] AC performance test: Set to maximum cooling. Center vent should reach 38-45F
      on a 70F day within 5 minutes. Weak output suggests refrigerant loss (R-134a recharge
      $100-250 at a shop; DIY recharge cans work for minor loss but do not fix leaks).
      R-1234yf (2014+ vehicles) requires shop-grade equipment -- no DIY cans available.
  [ ] Hose and belt inspection: Heat stresses rubber. Squeeze radiator hoses when cold --
      they should feel firm, not mushy or rock-hard. Look for cracks, swelling, or weeping
      at clamp connections.
  [ ] Winter tire removal: Remove dedicated winter tires when ambient temps consistently
      exceed 45F. Winter tires wear rapidly and handle poorly in warm temperatures.
  [ ] Alignment check: After winter potholes. Signs of misalignment: pulling to one side,
      uneven tire wear, steering wheel off-center on a straight road.
      Pothole impact can shift alignment by 0.5 degrees or more, causing rapid inner or
      outer edge tire wear.
  [ ] Undercarriage wash: Road salt causes corrosion of brake lines, fuel lines, frame
      rails, and suspension components. A high-pressure undercarriage wash in spring
      removes salt before it continues corroding during warm, humid months.
  [ ] Parking brake check: Salt and grime seize parking brake cables and rear drum
      mechanisms. Apply and release parking brake fully to verify smooth operation.
```

### Step 6: Generate the Personalized Schedule Output

Using all collected data, produce the formatted output (see Output Format section) with:
- Overdue items listed first with priority tier, estimated cost, and urgency note
- Due-soon items (within 3 months or 3,000 miles) listed second
- Upcoming items (3-12 months out) listed third with estimated mileage and calendar date targets
- Seasonal preparation checklist relevant to current month and climate
- 12-month cost projection broken into maintenance (scheduled) and contingency (likely repairs based on vehicle age/mileage)

### Step 7: Build the Maintenance Log Template

Provide the user with a structured log they can maintain digitally (spreadsheet) or on paper. The log anchors future scheduling to documented history rather than estimates:

```
VEHICLE PROFILE:
  Year/Make/Model: _______________ Engine: _______________
  VIN (last 6 digits for reference): _______________ 
  License Plate: _______________ State: _______________
  Purchase Date: _______________ Purchase Mileage: _______________
  Current Insurance Provider: _______________ Policy #: _______________
  Preferred Shop: _______________ Phone: _______________
  Emergency Roadside Service: _______________

MAINTENANCE LOG (one row per service event):
  Date | Odometer | Service Performed | Parts/Fluid Used (brand + spec) |
  Labor Cost | Parts Cost | Total | Shop/DIY | Tech Name | Next Due (mi) | Notes

UPCOMING SERVICES TRACKER:
  Service Name | Trigger Mileage | Trigger Date | Est. Cost | Priority | Scheduled Y/N

ANNUAL COST SUMMARY:
  Calendar Year | Oil Changes | Tires | Brakes | Fluids | Filters |
  Major Services | Unexpected Repairs | Annual Total | Cost Per Mile

TIRE LOG:
  Position (FL/FR/RL/RR) | Brand/Model | Size | DOT Code | Install Date |
  Install Tread Depth (32nds) | Last Rotation Date | Current Tread | Rotation Pattern

RECALL TRACKER:
  Check NHTSA recall database quarterly using VIN. Record:
  Recall #: ___ | Component: ___ | Notification Date: ___ | Repair Date: ___ | Dealer: ___
```

### Step 8: Provide Cost Planning and Prioritization Guidance

Help the user budget realistically by vehicle age bracket:

```
NEW VEHICLE (0-3 years / under 36,000 mi):
  Expected annual maintenance: $150-500
  Primary costs: Oil changes ($60-100 x 2-4/year), tire rotations ($0 if bundled
    with oil change at dealer), wiper blades ($20-40)
  Priority: Follow dealer schedule to preserve powertrain warranty. Use OEM-specified
    fluids and parts grades.

ESTABLISHED VEHICLE (3-7 years / 36,000-90,000 mi):
  Expected annual maintenance: $500-1,500
  Primary costs: First brake service ($250-500/axle), tire replacement ($400-800
    for a set of 4 mid-range all-seasons), 60K spark plugs, transmission service
  Priority: Proactive fluid services to extend drivetrain life. Battery replacement
    if approaching 4-5 years. Begin timing belt tracking if applicable.

HIGH-MILEAGE VEHICLE (7-12 years / 90,000-150,000 mi):
  Expected annual maintenance: $800-2,500
  Primary costs: Timing belt replacement if not done ($600-1,200 full kit + labor),
    coolant flush, potential suspension components (struts/shocks average $600-1,200
    per axle installed), wheel bearing inspection (humming noise on highway)
  Priority: Timing belt is life-critical. Do not defer past the interval.
    Evaluate whether repair cost exceeds vehicle value for major items.

VETERAN VEHICLE (12+ years / 150,000+ mi):
  Expected annual maintenance: $1,000-3,500+
  Rule of thumb: If the estimated annual maintenance plus likely repairs in a year
    exceeds 12 months of equivalent replacement vehicle payments, evaluate replacement.
  Priority: Keep up with oil changes and safety items (brakes, tires) religiously.
    Defer cosmetic and comfort items. Maintain emergency fund of $1,500-2,000
    for unexpected repairs.
```

---

## Output Format

Produce this structured output when presenting results to the user. Fill every field -- do not leave placeholders.

```
═══════════════════════════════════════════════════════
VEHICLE MAINTENANCE SCHEDULE
═══════════════════════════════════════════════════════
Vehicle:        [Year Make Model, Engine]
Current Mileage: [Exact odometer reading]
Driving Profile: [Normal / Severe -- state the qualifying factor]
Date Generated: [Today's date]
Climate Zone:   [Northern / Sun Belt / Coastal / Temperate]
═══════════════════════════════════════════════════════

⚠️ OVERDUE -- ACT WITHIN 2 WEEKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service          | Was Due At  | Now Overdue By | Est. Cost | Priority
[service name]   | [X,XXX mi]  | [X,XXX mi]     | [$XXX]    | TIER 1/2
[service name]   | [X,XXX mi]  | [X,XXX mi]     | [$XXX]    | TIER 1/2

📅 DUE SOON -- NEXT 30-90 DAYS OR 3,000 MILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service          | Due At      | Due By Date    | Est. Cost | Notes
[service name]   | [X,XXX mi]  | [Month Year]   | [$XXX]    | [note]
[service name]   | [X,XXX mi]  | [Month Year]   | [$XXX]    | [note]

📆 UPCOMING -- NEXT 3-12 MONTHS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service          | Due At      | Approx. Date   | Est. Cost | Notes
[service name]   | [X,XXX mi]  | [Month Year]   | [$XXX]    | [note]
[service name]   | [X,XXX mi]  | [Month Year]   | [$XXX]    | [note]

🌨️ SEASONAL PREPARATION -- [SEASON] CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] [Seasonal item with specific action and threshold]
[ ] [Seasonal item with specific action and threshold]
[ ] [Seasonal item with specific action and threshold]

💰 12-MONTH COST PROJECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━
Scheduled Maintenance (certain):   $[XXX - XXX range]
Likely Services (age/mileage based): $[XXX - XXX range]
Contingency Reserve (10-20% buffer): $[XXX - XXX]
Estimated Annual Total:            $[XXX - XXX]
Cost Per Mile (at [annual mileage]): $[X.XX]/mile

🔧 TIMING BELT STATUS
━━━━━━━━━━━━━━━━━━━━
[Belt or Chain] | [If belt: interval, last replacement, next due, urgency note]
[If chain: note that chains are typically lifetime but list tensioner inspection interval]

🔋 BATTERY STATUS
━━━━━━━━━━━━━━━━
Install Date/Mileage: [If known]
Age: [X years]
Recommended CCA: [XXX CCA per OEM]
Action: [No action needed / Load test recommended / Replace before winter / Replace now]

📝 SPECIAL NOTES FOR THIS VEHICLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Vehicle-specific notes: known issues, TSBs relevant to maintenance,
 OEM fluid specifications, CVT warning if applicable, etc.]
═══════════════════════════════════════════════════════
```

---

## Rules

1. **Never recommend conventional oil for turbocharged engines.** Turbo bearings spin at 100,000-200,000 RPM and require the thermal stability of full synthetic. Conventional oil coking in turbo bearing passages causes premature turbo failure ($1,500-3,500 to replace). If a user mentions a turbocharged engine, specify full synthetic and a 5,000-mile maximum interval.

2. **Always specify the exact fluid type, not just the category.** Saying "change transmission fluid" is incomplete. Specify "Honda ATF-DW1," "Toyota WS (World Standard)," "GM Dex-VI," or "ZF LifeguardFluid 8" as applicable. Using universal ATF in a vehicle that specifies a proprietary fluid can cause shift flares, shudder, and premature clutch pack wear.

3. **Never omit the timing belt question for pre-2015 Honda, Subaru, Hyundai/Kia, and Toyota 4-cylinder engines.** A missed timing belt interval on an interference engine is not a stranded-vehicle problem -- it is a $3,000-8,000 engine damage problem. Always flag it explicitly if mileage is within 20,000 miles of the interval.

4. **Do not tell CVT owners their fluid is "lifetime."** Nissan, Subaru, and Toyota CVT service manuals have quietly revised "lifetime" fluid recommendations downward after widespread premature CVT failures. Recommend 60,000-mile CVT fluid changes at the latest, 30,000-mile changes for severe drivers.

5. **Tire age is independent of tread depth.** A tire with 7/32" of tread but a 2015 DOT date is 9+ years old and dangerous due to rubber hardening, micro-cracking in the belt structure, and reduced wet traction. Always check the DOT date, not just the tread gauge.

6. **Brake fluid moisture is invisible to the eye.** Dark brake fluid is a symptom, but clear brake fluid can contain 3%+ moisture. Always recommend an annual brake fluid test strip test. This is a $2-5 item that accurately predicts vapor lock risk.

7. **AWD vehicles require tires within 2/32" tread depth of each other across all four positions.** Replacing only one or two tires on an AWD vehicle with significantly different tread depths forces the center differential or rear coupling to compensate constantly, causing premature wear or failure ($1,200-4,000 to replace). If one AWD tire is damaged, the user may need to replace two or four depending on remaining tread depth.

8. **Never combine coolant types without a complete system flush.** Green (IAT) and orange/red (OAT/HOAT) coolants use incompatible corrosion inhibitor chemistry. Mixing forms a siliceous gel that plugs the heater core and radiator tubes. A heater core replacement typically costs $600-1,200 in labor alone due to dashboard disassembly. If coolant type is unknown, flush with distilled water until color is neutral, then refill with the correct OEM-specified type.

9. **Brake pad thickness estimates from mileage alone are unreliable.** A highway driver may have 6mm of pad left at 50,000 miles. An urban stop-and-go driver may be at 2mm at 25,000 miles. Always instruct the user to verify pad thickness visually (through the wheel spokes with a flashlight) or by listening for the wear indicator squeal -- a high-pitched squeal while moving that stops when braking indicates the wear tab is contacting the rotor.

10. **Severe driving conditions compress all service intervals by 30-50%.** Do not simply list both schedules and let the user choose -- actively classify the driving profile based on the user's answers and apply the appropriate interval. If even one severe-condition factor applies, the severe schedule governs the entire vehicle, not just the service associated with that factor.

---

## Edge Cases

### Unknown Service History (Recently Purchased Used Vehicle)
Treat all services as potentially overdue and apply the following triage sequence:
- First priority: Engine oil and filter (change immediately if unknown -- cost is $60-100 and eliminates all risk)
- Second: Visually inspect brake pads through wheel spokes. If less than 4mm visible, inspect fully.
- Third: Test brake fluid with a moisture test strip (available at auto parts stores for $5-10/pack)
- Fourth: Check coolant freeze protection with a refractometer or float tester
- Fifth: Pull the engine air filter and inspect -- if gray or black with debris, replace ($15-40 DIY)
- Sixth: Check tire DOT dates and tread depth at all four corners simultaneously
- Seventh: Request a full inspection at a trusted shop ($50-120) to identify anything not visually accessible
- If the vehicle has over 80,000 miles and timing belt application: confirm belt replacement history or budget for immediate replacement

### Vehicle With Maintenance Minder System (Honda, GM, BMW, Mercedes)
- Honda Maintenance Minder uses codes (A, B, 1-7) to prescribe specific services, not just oil changes. Code "B1" means oil change + tire rotation. Code "B567" means oil change + tire rotation + engine air filter + brake fluid + coolant. Translate the dash code into specific services.
- GM Oil Life System bases its percentage on an algorithm tracking cold starts, idle time, trip length, and temperature. Zero percent oil life does not mean the oil is necessarily sludged -- it means the algorithm has reached its threshold. Still change within 500 miles of reaching 0%.
- BMW Condition Based Service (CBS) tracks engine oil, brake fluid, microfilter, vehicle inspection, and spark plugs independently. Each has its own countdown displayed in the iDrive menu. Do not wait for all CBS items to trigger simultaneously -- address each as it reaches 0%.
- Do not override these systems in favor of fixed intervals unless the driving profile is severe and the system does not account for it adequately.

### Preparing a Vehicle for Extended Storage (60+ Days)
This situation requires departure from normal interval logic:
- Perform oil change immediately before storage even if not at interval -- used oil contains combustion acids that corrode bearings during long sits
- Fill fuel tank completely and add a fuel stabilizer (Sta-Bil or equivalent, follow label ratio) within the last 10 miles driven before storage to prevent ethanol phase separation and varnish formation in injectors and carburetors
- Inflate tires 5 PSI above normal specification to compensate for slow leakage and reduce flat-spotting risk
- Disconnect the negative battery terminal or use a smart battery maintainer/float charger to prevent sulfation
- Place the vehicle on jack stands if storing over 6 months to eliminate flat-spot formation entirely
- Cover with a breathable car cover (not plastic) to prevent moisture trapping
- Place desiccant or DampRid in the interior to prevent mildew
- Do NOT apply parking brake during storage -- rear brake pads can fuse to rotors, especially after wet exposure

### Fleet of Two or More Household Vehicles
When a household runs two or more vehicles, offset service schedules intentionally:
- Stagger oil change dates by 2-3 months to distribute costs and avoid a single high-expense month
- Identify the primary (highest-mileage) vehicle and apply severe-condition scheduling to it regardless of driving type, since it accumulates service-triggering mileage faster
- Maintain a shared household vehicle log with separate sections per vehicle, unified annual budget view
- When one vehicle needs major work exceeding its value, that is the natural moment to consolidate to one vehicle temporarily and accelerate the replacement timeline for the other

### Post-Accident or Post-Flood Vehicle
Flood damage and collision both create hidden maintenance demands beyond obvious body repair:
- Post-flood: Drain and replace all fluids regardless of appearance (water contamination in differentials, transmission, and engine oil is not visible but causes rapid bearing failure). Brake fluid absorbs water readily -- flush immediately. Inspect wheel bearings for corrosion. Check electrical connectors for corrosion (spray with contact cleaner, apply dielectric grease).
- Post-collision (even minor): Inspect alignment (measure toe, camber, caster at a shop with a 4-wheel alignment rack). Inspect steering rack boots for tears. Check for brake line damage if the impact was near a wheel. Inspect the suspension geometry for bent control arms or subframe damage.
- Any airbag deployment: The vehicle requires professional inspection of the airbag system, seatbelt pretensioners, and any deployed side-curtain systems before returning to service.

### High-Altitude or Mountain Driving Profile
Altitude and mountain terrain create specific maintenance demands:
- At 5,000-10,000 feet elevation, engines run lean (less oxygen per intake stroke), increasing combustion temperature and accelerating spark plug wear. Reduce spark plug replacement interval by 15-20% for drivers routinely above 6,000 feet.
- Sustained downhill driving uses engine braking heavily, which loads the powertrain differently than flat driving -- increase transmission fluid inspection frequency to every 20,000 miles
- Brake heat from extended downhill grades accelerates brake fluid moisture absorption (heat cycles push moisture through seals). Test brake fluid after any trip involving 10+ miles of sustained descent.
- Cooling systems work harder at altitude (lower ambient air pressure reduces cooling efficiency). Maintain coolant to the full line consistently and inspect the radiator cap pressure rating annually.

### Electric Vehicle or Plug-In Hybrid Edge Case
Many users do not realize their hybrid or PHEV still requires traditional maintenance. Clarify:
- Full hybrid (Prius, Accord Hybrid): Oil still requires changing, but intervals can extend to 10,000 miles with 0W-20 synthetic because the engine cycles off frequently at low speeds, reducing combustion byproduct accumulation. However, short-trip cold starts may partially offset this -- assess driving profile carefully.
- PHEV (Prius Prime, RAV4 Prime, Pacifica Hybrid): Engine may not run for days at a time. Oil can accumulate fuel dilution from cold starts without reaching full operating temperature. Use time-based intervals (6 months) rather than mileage-based if the vehicle frequently operates in EV-only mode.
- Battery electric vehicles (BEV): No oil changes, no transmission fluid, no spark plugs. However: brake fluid (absorbs moisture through the hydraulic system regardless of motor type), cabin air filter, tire rotation (BEVs are heavier due to battery packs -- tires wear 20-30% faster than equivalent ICE vehicles), and 12V auxiliary battery (separate from the main traction battery, still 2-4 year lifespan).

---

## Example

**User Input:**
"I just bought a 2016 Subaru Outback 2.5i with 87,500 miles on it. The CarFax shows an oil change at 78,000 miles about 14 months ago and a tire rotation at 80,000 miles. I don't see any other records. I drive about 12,000 miles a year, mostly suburban mixed driving with some highway. I'm in the Chicago area. It's currently October."

---

**AI Response:**

Great timing to sort this out -- October in Chicago means winter prep is urgent alongside the catch-up maintenance. Here is a full assessment.

**Driving Profile Classification:** SEVERE. Suburban mixed driving in the Chicago metro involves frequent stop-and-go, cold starts from November through March, and road salt exposure. Even if no single factor is extreme, the combination qualifies as severe under industry standards.

**Estimated Annual Mileage Rate:** 12,000 miles/year = approximately 1,000 miles/month.

**Key Concern -- Timing Belt:** The 2016 Outback 2.5i (EJ25 engine) uses a timing belt, not a chain. Subaru's specified replacement interval is 105,000 miles. You are 17,500 miles away from that interval at your current pace -- that is approximately 17-18 months. This is not an emergency today, but it must be scheduled and budgeted now. The 2.5i is an interference engine, meaning a broken timing belt will cause catastrophic valve and piston damage. Budget $750-1,100 for timing belt + water pump kit + labor (always replace the water pump simultaneously). Target: 104,000-105,000 miles.

---

```
═══════════════════════════════════════════════════════
VEHICLE MAINTENANCE SCHEDULE
═══════════════════════════════════════════════════════
Vehicle:         2016 Subaru Outback 2.5i (EJ25 2.5L 4-cyl, Timing Belt)
Current Mileage: 87,500 miles
Driving Profile: SEVERE (suburban mixed, Chicago winters, road salt)
Date Generated:  October 2024
Climate Zone:    Northern -- Rust Belt (road salt, hard freeze, freeze-thaw)
═══════════════════════════════════════════════════════

⚠️ OVERDUE -- ACT WITHIN 2 WEEKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service                    | Was Due At   | Now Overdue By | Est. Cost | Priority
Engine Oil + Filter        | 83,000 mi    | 4,500 mi       | $70-90    | TIER 2
  (Last done 78K; severe profile = 5,000 mi max; 14 months also exceeds time limit)
Brake Fluid Test/Flush     | ~85,000 mi   | 2,500 mi       | $90-130   | TIER 2
  (No record of fluid change; assume 3+ years of moisture accumulation)
Cabin Air Filter           | ~82,000 mi   | 5,500 mi       | $20-35    | TIER 3
  (No record; replace as part of overdue service visit)
Engine Air Filter          | ~80,000 mi   | 7,500 mi       | $20-35    | TIER 3
  (No record; pull and inspect -- if gray/dark, replace immediately)

📅 DUE SOON -- NEXT 30-90 DAYS OR 3,000 MILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service                    | Due At       | Due By Date    | Est. Cost | Notes
Tire Rotation              | 87,500 mi    | Now / Nov 2024 | $25-50    | Overdue by 7,500 mi;
                           |              |                |           | Outback AWD -- X-pattern
Brake Pad Inspection       | 87,500 mi    | Nov 2024       | Free/visual| Inspect at oil change.
                           |              |                |           | Verify pads above 3mm.
Battery Load Test          | Oct 2024     | Before Nov 1   | Free       | Battery age unknown.
                           |              |                |           | Chicago winters demand
                           |              |                |           | 100% CCA. Test at any
                           |              |                |           | auto parts store (free).

📆 UPCOMING -- NEXT 3-18 MONTHS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service                    | Due At       | Approx. Date   | Est. Cost | Notes
Oil + Filter (#2)          | 92,500 mi    | March 2025     | $70-90    | Severe = 5,000 mi interval
Tire Rotation (#2)         | 92,500 mi    | March 2025     | $25-50    | Every 5,000 mi severe
Oil + Filter (#3)          | 97,500 mi    | Aug 2025       | $70-90
Tire Rotation (#3)         | 97,500 mi    | Aug 2025       | $25-50
Iridium Spark Plugs        | 90,000 mi    | Dec 2024       | $120-200  | Subaru specifies NGK
                           |              |                |           | iridium at 90K. DIY-
                           |              |                |           | accessible but requires
                           |              |                |           | correct torque (13-15 ft-lb)
Differential + Transfer    | 90,000 mi    | Dec 2024       | $150-250  | Rear diff fluid (Subaru
Case Fluid                 |              |                |           | ATF-HP or equivalent) +
                           |              |                |           | transfer case fluid.
                           |              |                |           | AWD -- never skip this.
Front/Rear Differential    | 90,000 mi    | Dec 2024       | Included above
Coolant Test               | Oct 2024     | Now            | Free       | Test freeze protection
                           |              |                |           | with float tester. Target:
                           |              |                |           | -34F protection.
                           |              |                |           | Subaru uses HOAT Pink;
                           |              |                |           | DO NOT mix with green IAT.
⚠️ TIMING BELT + WATER PUMP | 105,000 mi  | Feb-Mar 2026   | $750-1,100|
