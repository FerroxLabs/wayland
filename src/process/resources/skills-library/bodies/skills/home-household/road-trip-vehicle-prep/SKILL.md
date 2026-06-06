---
name: road-trip-vehicle-prep
description: |
  Pre-trip vehicle inspection checklist, emergency kit assembly, navigation planning, and maintenance preparation for safe and reliable long-distance road travel.
  Use when the user asks about road trip vehicle prep, or needs help with pre-trip vehicle inspection checklist, emergency kit assembly, navigation planning, and maintenance preparation for safe and reliable long-distance road travel.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of road trip vehicle prep.
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
# Road Trip Vehicle Prep

## When to Use

**Use this skill when:**
- A user is planning a road trip of 200+ miles and wants to systematically inspect and prepare their vehicle before departure
- A user asks about pre-trip vehicle inspection, fluid checks, tire condition, or brake evaluation ahead of long-distance travel
- A user needs help assembling a terrain-specific or season-specific emergency kit for highway, mountain, desert, or winter driving
- A user wants to plan fuel stops, alternate routes, and driving schedules based on their vehicle's range and the trip's geography
- A user needs to verify their vehicle is within safe operating parameters -- tread depth, battery age, belt condition, fluid levels -- before committing to a multi-day journey
- A user is towing a trailer or hauling roof cargo and needs to understand weight limits, hitch ratings, and load distribution
- A user has a specific concern -- a noise, a warning light, a recent fluid leak -- and wants to decide whether to address it before a planned trip

**Do NOT use when:**
- The user's vehicle is already broken down and they need immediate roadside guidance -- use a roadside emergency response skill instead
- The user is asking about regular routine maintenance with no trip planned -- use a vehicle maintenance scheduling skill instead
- The user needs professional mechanical diagnosis of a specific fault code, fluid contamination, or internal engine noise -- refer them to a qualified mechanic
- The user is preparing a commercial vehicle, fleet truck, or CDL-regulated transport -- DOT inspection standards and weight regulations differ substantially from personal vehicle prep
- The user is asking about international driving requirements, carnets, or cross-border vehicle documentation -- those require a travel documentation skill
- The user is asking about purchasing a used vehicle to use on a road trip -- that requires a pre-purchase inspection skill, not trip prep
- The user has already departed and is mid-trip -- live troubleshooting of an active mechanical problem requires a different approach

---

## Process

### Step 1: Gather Trip and Vehicle Profile

Before issuing any checklist or recommendation, collect the following information. Do not skip this step -- tire pressures, fluid capacities, tow ratings, and maintenance intervals all depend on the specific vehicle.

- **Vehicle specifics:** Year, make, model, trim, engine, and current odometer reading. Ask if they know the last service date and what was done.
- **Trip parameters:** Origin, destination, total estimated miles, number of travel days, number of passengers, and whether they are towing or hauling significant cargo.
- **Terrain and season:** Highway interstate, mountain passes, desert corridors, unpaved roads, or a mix. Month of travel and expected weather (summer heat, winter snow, monsoon rain).
- **Lead time:** How many days until departure? This determines whether deferred maintenance is actually actionable before the trip.
- **Known issues:** Ask directly -- "Is there anything your vehicle is already doing that you've been meaning to address?" Squealing brakes, a slow tire leak, a check engine light, a rough idle.
- **Emergency kit status:** Do they have anything already assembled, or starting from zero?

Use the answers to calibrate every subsequent recommendation. A 2018 Toyota 4Runner heading into the Rocky Mountains in March with a family of four and a trailer needs completely different preparation advice than a 2021 Honda Civic doing a 400-mile interstate run in July.

---

### Step 2: Build the Maintenance Timeline

Map the user's lead time to a staged action plan. Assign tasks to the correct window -- tasks that need shop time cannot be scheduled for the day before departure.

**4+ weeks before departure:**
- Schedule a service appointment if the vehicle is within 2,000 miles of any of the following intervals: oil change (check manufacturer spec -- modern synthetics often run 7,500--10,000 miles; conventional oil runs 3,000--5,000 miles), tire rotation (every 5,000--7,500 miles), coolant flush (every 30,000--50,000 miles or 5 years), brake fluid flush (every 2 years or 30,000 miles -- brake fluid is hygroscopic and absorbs moisture, lowering boiling point), transmission service (30,000--60,000 miles depending on type -- CVT fluid is especially critical and often overlooked), or spark plug replacement (conventional plugs at 30,000 miles, iridium/platinum at 60,000--100,000 miles).
- Verify registration, insurance, and roadside assistance membership are current and stored in the vehicle.
- Research route-specific conditions: construction zones on FHWA and state DOT sites, seasonal pass closures, wildfire or flood area advisories.
- Order any accessories that require shipping: roof cargo carrier, recovery boards, satellite communicator.

**2 weeks before departure:**
- Complete all scheduled maintenance identified above.
- Address any known mechanical concerns -- a slow oil leak traced to a valve cover gasket, worn wiper blades, a sticky parking brake.
- Purchase emergency kit supplies in bulk (less expensive than gas station purchases en route).
- If traveling in winter, have alignment checked -- a car that pulls to one side on ice or snow is genuinely dangerous.

**3 days before departure:**
- Perform the full physical vehicle inspection (Step 3 below).
- Download offline navigation maps -- Google Maps and Apple Maps both support offline download for specific regions. For remote or international areas, use a dedicated offline app with topographic data.
- Wash the vehicle, paying attention to light lenses and mirrors. Dirty brake lights and turn signals are a safety deficiency, not an aesthetic one.
- Test-drive for at least 20 minutes, including highway speed, to verify brakes, steering, and no new warning lights appear under load.

**Day before departure:**
- Confirm fluid levels after any recent service (shops occasionally forget to top off washer fluid or return coolant to proper level).
- Inflate tires to door jamb specification (measure cold, before any driving).
- Fill the fuel tank completely so day one mileage math is simple.
- Load cargo using the weight distribution principles in Step 6.
- Share itinerary -- origin, route, stops, destination, expected arrival -- with a trusted person not on the trip.

---

### Step 3: Execute the Physical Vehicle Inspection

Work through this inspection systematically in the order below. The sequence matters -- fluids first so the engine is cold for accurate readings, then tires and exterior, then electrical with the car on.

**Fluids (engine cold or warm, not hot -- follow manufacturer guidance):**
- **Engine oil:** Pull dipstick, wipe, reinsert fully, pull again. Level should be between MIN and MAX marks. Color: fresh oil is amber-gold; dark brown-black indicates it is due for a change even if within mileage. Milky or foamy oil indicates coolant contamination -- this is a serious mechanical problem, do not depart until investigated.
- **Coolant/antifreeze:** Check the translucent overflow reservoir -- level should sit between the MIN and MAX lines. Do NOT open the radiator cap on a warm engine. Coolant color matters: green or orange coolant that looks brown or rusty is degraded and needs flushing. Depleted coolant protection leads to freeze-up (winter) or boil-over (desert/mountain grades).
- **Brake fluid:** Located in a small reservoir on the driver's side of the firewall under the hood. Level should be between MIN and MAX. Clear to light amber is healthy; dark brown fluid indicates contamination and moisture absorption -- boiling point is significantly reduced. This is a safety-critical fluid.
- **Power steering fluid (hydraulic systems):** Many modern vehicles use electric power steering with no fluid. For those that do, the reservoir is typically near the firewall; check level and look for dark or burnt-smelling fluid.
- **Transmission fluid:** Automatic transmissions: some have dipsticks (check with engine warm and running, in park), others are sealed units requiring a shop check. Manual transmissions are sealed fill-to-overflow systems. If the vehicle has any shifting hesitation or delayed engagement, flag it as a trip risk.
- **Windshield washer fluid:** Top off completely and carry a spare gallon. At highway speed in bug season, a dry reservoir is a visibility hazard within hours.
- **Visual leak check:** Look at the ground under the engine bay and transmission. Fresh oil is dark and wet; coolant leaves a sweet-smelling residue and a mineral ring when it dries; transmission fluid is bright red when new, dark red-brown when old; power steering fluid is similar to tranny fluid; brake fluid is thin and clear to amber and will strip paint.

**Tires (check cold -- before driving any significant distance):**
- Tread depth using a tread depth gauge (the most accurate method) or coin test: use a quarter, insert Lincoln's head into the groove -- if the top of his head is visible, you are at approximately 4/32", which is the minimum acceptable for a long trip. Below 2/32" is legally bald in most states. Record all four corners: FL / FR / RL / RR in 32nds of an inch.
- Tire pressure: Find the recommended pressure on the door jamb sticker (not the MAX PRESSURE molded on the sidewall -- that is the tire's structural limit, not the vehicle's specification). Typical passenger cars: 32--36 PSI front, 30--36 PSI rear. Trucks and SUVs with payload may spec higher. Use a quality dial gauge or digital gauge -- the stick-type gauges that come in cheap kits are notoriously inaccurate.
- Inspect sidewalls for cracks (ozone cracking appears as small lateral cracks and indicates aging rubber), bulges (a bulge indicates internal structural failure -- this tire will fail, do not travel on it), or cuts. Check the DOT code embossed on the sidewall -- the last four digits are the week and year of manufacture (e.g., "2319" = 23rd week of 2019). Tires older than 6 years should be replaced regardless of tread depth; at 10 years, replacement is mandatory.
- Spare tire: Confirm it is present, accessible (under-bed spares on trucks often corrode into place), properly inflated, and that the jack and lug wrench are accessible and complete. Full-size spare should match vehicle spec pressure; compact "donut" spares typically spec 60 PSI and are limited to 50 MPH and 50--70 miles.

**Brakes:**
- If the vehicle has alloy wheels, inspect brake pads through the wheel spokes. A wear indicator slot in the center of the pad is typically 2mm; if pad material is near or at the rotor surface, replacement is needed. Minimum pad thickness for trip travel: 3mm (approximately 1/8 inch).
- Rotor condition: Look for deep grooves, heat bluing (indicates sustained overheating), or significant rust pitting on the braking surface. Light surface rust burns off quickly; deep pitting does not.
- Brake pedal feel during the test drive: firm and responsive is correct. Spongy or low pedal = air in the lines or failing master cylinder. Pedal that sinks to the floor under steady pressure = serious hydraulic failure, do not travel until resolved.
- Listen during test drive: squealing (wear indicators touching rotor = replace soon), grinding (metal-on-metal = replace now), clicking or knocking = loose hardware.

**Electrical:**
- Battery: A 12V car battery is fully charged at 12.6--12.7V at rest; below 12.4V indicates a partially discharged or weak battery. Most auto parts stores perform free load tests. A battery over 4--5 years old on a long trip in extreme heat or cold is a meaningful risk. Check terminal connections for corrosion (white or blue-green buildup) -- clean with a baking soda solution and wire brush if present.
- Start the vehicle and check that the alternator is charging: voltage should read 13.8--14.7V with engine running. Below 13.5V suggests alternator output is low.
- Walk around the vehicle with engine running and a helper: all headlights (low and high beam), taillights, brake lights, turn signals (front and rear), reverse lights, hazard flashers, and license plate light.
- Check the dashboard for any stored warning lights. Address check engine, ABS, traction control, TPMS, or oil pressure lights before departure. A flashing check engine light indicates an active misfire -- stop and address. A steady check engine light is lower urgency but should be scanned for fault codes (free at most auto parts stores).

**Mechanical and Underhood:**
- Serpentine belt: Look for fraying, cracking on the ribbed side, glazing (shiny, slick surface), or chunks missing. A belt failure disables the alternator, power steering, and water pump simultaneously -- roadside failure risk is high.
- Coolant hoses: Squeeze the upper and lower radiator hoses when cold. They should feel firm and springy. Soft, mushy, or collapsing hoses are near failure. Check for swelling near clamps or seeping coolant residue at connections.
- Suspension bounce test: Push down firmly on each corner of the vehicle and release. A healthy shock/strut allows the body to rise once and settle. If it continues to bounce 2--3 times, the shock is worn. Worn shocks significantly increase stopping distance and reduce stability on curves.
- A/C and heat: Run both on the test drive. A/C should produce air at 40--45°F at the center vent on a moderate day. No cold air may indicate low refrigerant or a compressor issue. Heat should reach full temperature within 5 minutes of driving -- if it doesn't, the thermostat may be stuck open.
- Cabin air filter: Remove and inspect (usually behind the glove box or under the dash). A clogged cabin filter restricts both A/C and heat airflow significantly and is a 5-minute DIY replacement.

---

### Step 4: Assemble the Emergency Kit

Build the kit in tiers based on trip type, and physically consolidate it into one designated bag or bin in the vehicle. An emergency kit scattered across the trunk is a functionally useless emergency kit.

**Tier 1 -- Mandatory for every trip over 200 miles:**
- Jumper cables (minimum 16-gauge, 12-foot length) OR a lithium jump starter pack (1,000+ CCA rating for 4-cylinder; 2,000+ CCA for V8 or diesel). The jump starter is self-contained and does not require another vehicle. Keep it charged -- lithium packs lose charge over months.
- Tire inflation: A 12V portable air compressor rated to at least 150 PSI max pressure (the cheap 100 PSI units cannot fully inflate truck or SUV tires). Pair with a plug-type tire repair kit (string plugs and insertion tool) for punctures that don't damage the sidewall.
- Roadside warning: Three collapsible reflective triangles or LED road flares. Position one 10 feet behind the vehicle, one 100 feet back, and one 300 feet back. This is the standard FMCSA pattern for broken-down vehicles.
- First aid kit: Pre-built kits are fine if they include at minimum: adhesive bandages in multiple sizes, gauze pads (4x4), rolled bandage (ace wrap), antiseptic wipes, medical tape, nitrile gloves, a triangular bandage/sling, scissors, pain reliever (ibuprofen and acetaminophen), antihistamine (diphenhydramine), and any personal prescription medications in a labeled container.
- Light and power: Flashlight with spare batteries or a USB rechargeable flashlight. A headlamp is more useful than a handheld light for working under a vehicle at night. Portable USB battery bank (20,000 mAh is a practical minimum for multi-day trips) with appropriate cables for all devices in the vehicle.
- Basic tools: Multi-tool (Leatherman-type), duct tape, zip ties (assorted sizes), a 12-inch adjustable wrench, a flat and Phillips screwdriver. These handle 80% of roadside improvisation needs.
- Water and sustenance: Minimum 1 gallon of water per person for a short trip, 2 gallons per person for remote or desert travel. Non-perishable snacks with protein content (granola bars, jerky, nuts) -- caloric deficit in a stressful breakdown accelerates poor decision-making.
- Blanket: A compact emergency Mylar blanket at minimum; a real wool or fleece blanket is meaningfully better for actual cold.
- Documentation: Physical copies of insurance card, registration, roadside assistance info, and emergency contact numbers. Do not rely solely on a phone that may be dead or have no signal.

**Tier 2 -- Extended trips (400+ miles, 2+ days, or remote routing):**
- Extra fluids: One quart of the correct engine oil specification (check oil cap or owner's manual -- do not mix 5W-30 with 0W-20), one gallon of pre-mixed 50/50 coolant (pre-mixed is safer than concentrate because over-concentrating coolant actually raises freezing point and reduces heat transfer).
- Fire extinguisher: A dry chemical ABC-rated extinguisher, minimum 2.5 lb. Mount it within reach of the driver, not buried in the trunk.
- Tow strap: Nylon kinetic recovery strap rated to 2x vehicle weight (not a chain -- chains transmit shock load). Know how to use it before you need it.
- Fuses, wire connectors, and electrical tape: Match the fuse types in your vehicle's fuse box (check inside the fuse box cover for a diagram). Carry at minimum: 10A, 15A, 20A, 30A in both blade-type and mini-blade formats.
- Glass breaker and seatbelt cutter: Combined tool, keep it accessible from the driver's seat (clipped to sun visor or stored in door pocket), not in the emergency bag in the back.
- Work gloves: Heavy nitrile-coated gloves for tire changes and underhood work; protect hands from exhaust heat, battery acid, and road grime.

**Tier 3 -- Terrain-specific additions:**

*Mountain and winter travel:*
- Traction aids: Snow chains or AutoSock textile traction aids sized for your tire (confirm fitment before the trip -- carrying mis-sized chains is worse than carrying none because it creates false confidence). Chains must be installed before you need them, not on a snowpack at 11,000 feet in the dark.
- Ice scraper and snow brush combo with an extending handle.
- Collapsible shovel: useful for digging out tires or clearing a snow berm.
- Sand or kitty litter (a 10-lb bag): Pour under drive wheels for traction on packed snow or ice.
- Extra insulating layers and a sleeping bag rated to the lowest expected overnight temperature -- if the vehicle is stranded in a mountain pass overnight, the difference between a 20-degree bag and a Mylar sheet is life-threatening.
- Hand warmers (chemical, disposable) -- at least 6 pairs. Also useful for keeping fingers functional during a tire change in freezing temperatures.

*Desert and extreme heat travel:*
- Water: 2 gallons per person minimum beyond drinking needs -- engine cooling and radiator top-off consumption in desert conditions is real.
- Electrolyte replenishment: Oral rehydration salts or electrolyte packets. Heat exhaustion begins before thirst becomes noticeable.
- Shade tarp: A compact reflective tarp (8x10 or larger) with stakes and cord. In a breakdown in direct sun at 110°F ambient, a shade structure can reduce effective temperature by 20--30°F, which prevents heat stroke during a wait.
- Extra coolant: One gallon of pre-mixed coolant. Desert grades, stop-and-go traffic, and sustained high ambient temperatures push cooling systems to their limits.
- Signal: A signal mirror is effective for flagging distant vehicles or aircraft in open desert terrain without cell coverage.

*Remote or unpaved routes:*
- Full-size spare: A compact donut spare is not suitable for remote gravel, forest service roads, or high-clearance routes where a second flat is possible.
- Satellite communicator: A two-way satellite communicator (such as a dedicated PLB-type device) allows SOS signaling and text messaging in areas with no cell coverage. This is not optional for truly remote routes.
- High-lift jack and traction boards/recovery boards: A scissor or bottle jack is insufficient on soft or uneven ground. A high-lift jack rated to vehicle weight, combined with recovery boards (rigid plastic ramps placed under a buried tire), handles the most common off-pavement vehicle recovery scenarios.
- Paper maps: A state road atlas plus any national forest or BLM surface management maps for the specific region. GPS and cell phones fail; paper does not.

---

### Step 5: Plan the Route and Driving Schedule

Route planning for a road trip is not just navigation -- it is logistics, risk management, and pacing.

**Fuel range calculation:**
Use this formula to find safe usable range per tank:
`Tank capacity (gallons) × highway MPG × 0.80 = Practical range (miles)`

The 0.80 factor reserves roughly 20% of tank capacity as margin. Never plan to be below 1/4 tank, and in remote areas (defined as stretches with 50+ miles between gas stations), fill whenever you reach 1/2 tank. Find the vehicle's EPA highway MPG on the window sticker or manufacturer's website. Real-world fuel economy in mountains (grade and altitude) can be 15--20% lower than EPA estimates; in desert heat with A/C running, up to 10% lower.

**Fuel stop identification:**
- Map specific fuel stations on the route, noting the longest gap between stations.
- In the American Southwest, segments of 80--120 miles with no services are common on US highways. Note these explicitly in the driving plan.
- In winter mountain travel, many mountain pass gas stations close seasonally or keep limited hours. Verify before assuming availability.

**Driving schedule and fatigue management:**
- Maximum productive driving per day: 8 hours of actual drive time, which typically maps to 450--500 miles in good highway conditions. Beyond this, driver fatigue degrades reaction time and decision-making quality equivalently to 0.08 BAC.
- Plan a stop every 2 hours or 100--150 miles -- whichever comes first. Stops should include 10--15 minutes of standing, walking, and hydration. Leg blood pooling over multi-hour drives is both a comfort and a medical concern (deep vein thrombosis risk on trips exceeding 4--6 hours).
- Schedule major rest stops to occur at natural waypoints: restaurants, state welcome centers, rest areas with facilities.
- If driving through the night (not recommended but sometimes necessary): swap drivers every 90--120 minutes rather than every 2 hours. Circadian dip is most severe between 2:00 AM and 5:00 AM regardless of prior sleep -- this window has the highest drowsy-driving fatality rate.
- Plan alternate routes for each major segment: identify at least one alternate road in case of closure, construction, or weather diversion. Know which highways can serve as alternates to each interstate.

**Navigation setup:**
- Primary: GPS navigation with live traffic and real-time hazard alerts (updated maps).
- Secondary: Downloaded offline maps for the full route region. Offline download areas should overlap -- a single region download often has gaps at borders between downloaded areas.
- Tertiary: Paper atlas. Mark the intended route before departure.
- Note specific waypoints that require navigation attention: exits with short merge distances, split interchanges, and transitions between interstates.

---

### Step 6: Cargo Loading and Vehicle Dynamics

How weight is loaded affects handling, braking distance, and structural integrity.

**Weight limits:**
- Find the Gross Vehicle Weight Rating (GVWR) on the driver's door jamb sticker. This is the maximum allowable total weight of the vehicle including passengers, fuel, and cargo.
- Calculate: GVWR minus vehicle curb weight (in owner's manual or on NHTSA database) = total payload capacity. Passengers and luggage combined must not exceed this number.
- Exceeding GVWR is not just mechanical risk -- it voids most insurance liability for accidents and may create legal liability if someone is injured.
- For pickup trucks: Payload capacity is on a yellow sticker inside the driver's door -- it already accounts for curb weight and is the most direct number to use.

**Load placement principles:**
- Heavy items (coolers, tool boxes, camping gear) go lowest in the cargo area, as close to the vehicle's center as possible longitudinally (between the axles, not overhanging the rear axle).
- Weight should be distributed evenly left-to-right. A 50-lb imbalance between the left and right cargo sides is detectable in handling at highway speed and creates uneven tire wear.
- Nothing unsecured in the passenger cabin. In a 35 MPH sudden stop, a 10-lb object in the rear seat becomes a 350-lb projectile. Use a cargo net, cargo barrier, or store everything in the trunk.
- Roof cargo: Maximum roof load is specified in the owner's manual and is separate from total cargo capacity (typically 150--200 lbs for passenger cars). Roof cargo raises the center of gravity and meaningfully increases rollover tendency in sharp evasive maneuvers. Keep roof loads minimal and centered front-to-back and side-to-side. Check tie-down straps and cargo carrier lock at every fuel stop.

**Towing specifics (if applicable):**
- Know the vehicle's Gross Combined Weight Rating (GCWR): this is the maximum total weight of vehicle plus trailer.
- Tongue weight (the downward force on the hitch ball from the trailer) must be 10--15% of total trailer weight. Too little tongue weight causes trailer sway; too much overloads the rear axle.
- Trailer sway correction: If a trailer begins to sway, do NOT brake hard. Hold the steering wheel firmly, maintain or gently increase speed briefly to stabilize, then gradually decelerate. Hard braking during sway amplifies oscillation.
- Verify trailer wiring with a dedicated trailer wiring tester plug before departure. Test all running lights, brake lights, turn signals, and electric brakes if equipped.
- Transmission temperature: Towing, especially in mountains, can push transmission temperature into dangerous ranges. Transmission temperature gauges or tow/haul mode selection (on properly equipped vehicles) help manage this. If no tow/haul mode: use a lower gear on grades to maintain engine braking and reduce transmission load.

---

### Step 7: Pre-Departure Day-Of Verification

On departure day, run a 15-minute final check before loading passengers.

- Cold tire pressure check and adjustment to door jamb spec.
- Visual walk-around: Look for anything flat, leaking, dragging, or out of place (including anything placed behind a tire -- this happens).
- Confirm the spare tire is in place and the jack and wrench are accessible without completely unloading cargo.
- All devices charged: phones, GPS unit, portable jump starter, portable battery bank, satellite communicator if equipped.
- Emergency kit bag in accessible location -- not buried under 200 lbs of luggage. Ideally within reach without getting out of the vehicle (under a rear seat, behind the driver's seat).
- Share itinerary with a non-traveling contact: departure time, route, planned stops, destination, and a check-in protocol (e.g., "I'll text at each stop; if you don't hear from me by 10 PM, call me").
- Fuel tank: Full. Leave with a full tank so day-one range planning is based on a known quantity.

---

### Step 8: Roadside Situation Management

Prepare the user for in-trip decision-making so they are not making first-contact decisions in a crisis.

**If a warning light activates while driving:**
- Check engine light (steady): Indicates a stored fault code but not an imminent failure. Reduce speed slightly, avoid prolonged heavy acceleration, proceed to the next service area to have codes read. Common causes: loose gas cap (check and retighten), failed O2 sensor, catalytic converter efficiency fault.
- Check engine light (flashing/blinking): Indicates an active engine misfire. Unburned fuel entering the catalytic converter can cause permanent catalyst damage within minutes. Pull off safely and immediately. Do not continue driving.
- Oil pressure light: Oil pressure has dropped below safe operating range. Shut the engine off as soon as safely possible -- even a few seconds of driving with no oil pressure can cause catastrophic engine damage. Check oil level, add oil if low, and reassess.
- Temperature gauge in red / temp warning light: Overheating. Pull off immediately. Turn off A/C. Turn on the cabin heater to full blast and max fan -- the heater core is a secondary radiator and can draw heat from the coolant. Do NOT open the radiator cap until the engine is fully cool (30--45 minutes minimum). If coolant is low after cooling, add pre-mixed coolant slowly.
- ABS light: ABS system has faulted. Normal brakes still function; only the anti-lock function is disabled. Safe to drive cautiously but avoid panic stops and slippery conditions.
- TPMS light: One or more tires below threshold pressure (typically 25% below recommended). Check all four tires and the spare (some TPMS systems monitor the spare). Inflate as needed.

**If a tire goes flat at highway speed:**
- Do NOT jerk the wheel or brake hard. Hold the steering wheel firmly with both hands. Gradually reduce throttle. Allow the vehicle to decelerate naturally. When speed is below 30 MPH, brake gently to a stop as far off the road as possible -- past the fog line, ideally off pavement.
- Activate hazard lights immediately.
- Set out warning triangles at 10 feet, 100 feet, and 300 feet behind the vehicle.
- Evaluate the change: Is it safe? Is the ground level and firm? Is there adequate space away from traffic? If not -- especially at night or on a high-speed interstate -- it may be safer to call roadside assistance and wait in a safe location away from the vehicle.

---

## Output Format

When responding to a road trip vehicle prep request, structure the output as follows:

```
ROAD TRIP VEHICLE PREP PLAN
============================
Trip: [Origin] to [Destination] | [Total Miles] mi | Depart: [Date]
Vehicle: [Year Make Model] | [Odometer] mi | Last Service: [Date/Unknown]
Terrain: [Highway/Mountain/Desert/Mixed] | Season: [Month/Weather Conditions]
Passengers: [#] | Towing: [Yes/No -- trailer weight if yes]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: MAINTENANCE STATUS & RISK FLAGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Upcoming or Overdue Service Items:
  [ ] [Service item] -- Due at [X] mi / [X] months | Current: [X] mi | URGENCY: [High/Med/Low]
  [ ] [Service item] -- ...

Known Issues to Resolve Before Departure:
  ⚠ [Issue description] -- [Recommended action] -- [Can it wait? Yes/No]

SECTION 2: PRE-TRIP INSPECTION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fluids:
  [ ] Engine oil: Level _____ | Condition: Good / Change Due / Contaminated
  [ ] Coolant: Level _____ | Color/Condition: _____
  [ ] Brake fluid: Level _____ | Condition: Clear/Amber/Dark (flush if dark)
  [ ] Transmission fluid: Level _____ | Condition: _____
  [ ] Washer fluid: Full | Carry 1 spare gallon

Tires (check cold):
  Recommended pressure (door jamb): _____ PSI front / _____ PSI rear
  Tread depth: FL ___/32" | FR ___/32" | RL ___/32" | RR ___/32"
  [ ] Sidewalls: No cracks, bulges, or cuts
  [ ] DOT date code: All tires under 6 years (DOT last 4 digits: week/year)
  [ ] Spare: Present / Inflated to _____ PSI / Jack & wrench accessible

Brakes:
  [ ] Pad thickness: Front ___mm / Rear ___mm (minimum 3mm for trip travel)
  [ ] Rotor condition: No deep grooves or severe pitting
  [ ] Pedal feel: Firm / No pull / No spongy pedal noted on test drive

Electrical:
  [ ] Battery: Age _____ years | Voltage at rest: _____ V | Load test: Pass/Fail
  [ ] All exterior lights verified: Headlights / Tails / Brake / Turn / Hazard / Reverse
  [ ] No active dashboard warning lights
  [ ] Charging system: _____ V with engine running (target 13.8--14.7 V)

Mechanical:
  [ ] Serpentine belt: No cracks, fraying, or glazing
  [ ] Coolant hoses: Firm, no soft spots or seeping at clamps
  [ ] Suspension bounce test: Settles in one bounce (all four corners)
  [ ] A/C and heat functional
  [ ] Cabin air filter: Clean / Replace

SECTION 3: EMERGENCY KIT LIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tier 1 (Required):
  [ ] Jump starter pack (charged, _____ CCA rating) or jumper cables
  [ ] Portable air compressor + tire plug kit
  [ ] First aid kit (contents verified per list)
  [ ] 3x reflective triangles or LED road flares
  [ ] Flashlight / headlamp + spare batteries or rechargeable
  [ ] Multi-tool, duct tape, zip ties
  [ ] USB battery bank (20,000+ mAh, charged) + charging cables
  [ ] Water: _____ gallons | Snacks: Non-perishable, protein-rich
  [ ] Emergency blanket or fleece blanket
  [ ] Physical copies: insurance, registration, roadside assistance, emergency contacts

Tier 2 Additions ([if extended trip]):
  [ ] 1 qt engine oil (spec: _____)
  [ ] 1 gal pre-mixed coolant
  [ ] ABC fire extinguisher (2.5 lb min)
  [ ] Tow/recovery strap (rated _____ lbs)
  [ ] Fuse assortment (blade and mini-blade: 10A/15A/20A/30A)
  [ ] Glass breaker / seatbelt cutter (accessible from driver seat)
  [ ] Work gloves

Terrain Additions ([Winter / Desert / Remote]):
  [ ] [Terrain-specific items from Step 4, Tier 3]

SECTION 4: ROUTE & FUEL PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fuel Range Calculation:
  Tank: _____ gal × _____ MPG × 0.80 = _____ mi practical range

  Longest fuel gap on route: _____ mi (at [location])
  Refuel trigger: _____ gal / _____ tank (1/2 tank rule in remote areas)

Driving Schedule:
  Day 1: [Origin] → [Stop] → [Destination]
    Segment 1: [City] to [City] | _____ mi | _____ hr | Fuel stop: [City/Station]
    Segment 2: [City] to [City] | _____ mi | _____ hr | Fuel stop: [City/Station]
    Daily total: _____ mi / _____ hr drive time
    Planned departure: _____ AM | Planned arrival: _____ PM

  [Repeat for each travel day]

Alternate Route:
  Primary: [Route description]
  Alternate: [Route description] | Divert reason: [Weather/Construction/Closure]

Cell Coverage Gaps: [Locations with limited service on route]
Hospitals on Route: [Nearest facilities at key waypoints]

SECTION 5: CARGO & WEIGHT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GVWR: _____ lbs | Curb weight: _____ lbs | Payload capacity: _____ lbs
Estimated passenger weight: _____ lbs
Estimated cargo weight: _____ lbs
Total estimated load: _____ lbs | Margin remaining: _____ lbs

Weight placement notes: [Specific guidance based on trip configuration]

SECTION 6: TIMELINE TO DEPARTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[X] weeks out: [Specific tasks due this window]
[X] weeks out: [Specific tasks due this window]
3 days out: [Specific tasks due this window]
Day before: [Specific tasks due this window]
Day of: [Specific tasks due this window]
```

---

## Rules

1. **Never skip the vehicle profile step.** Tire pressures, oil specifications, tow ratings, maintenance intervals, and spare tire type all vary by vehicle. Generic recommendations for "most cars" can cause real harm -- especially if applied to a diesel, a hybrid with regenerative braking, or a vehicle with a sealed transmission.

2. **Maintenance timing must be actionable.** If the user departs in 3 days and needs a transmission service, say so clearly and flag it as a risk, not just a to-do. If the service cannot realistically happen before departure, advise the user on whether the trip can proceed safely without it.

3. **Distinguish safety-critical from comfort items.** Brake pad thickness under 3mm, a tire with a sidewall bulge, an oil pressure warning light, and brake fluid contamination are trip-stopping conditions. A dirty cabin air filter and a weak A/C are not. Frame recommendations proportionally to actual risk.

4. **Fluid top-offs do not replace fluid services.** If coolant is low because the system is losing fluid somewhere, topping it off is masking a leak. If brake fluid is dark, adding fresh fluid to dark fluid does not improve boiling point. Correct the underlying condition, do not paper over it.

5. **Coin tests are minimums, not targets.** The penny test (at 2/32") tells you a tire is legally bald. The quarter test (at 4/32") represents the minimum acceptable margin for a long trip in good weather. For wet-weather or winter travel, 6/32" or better is the responsible target.

6. **A compact spare ("donut") imposes hard operational limits.** 50 MPH maximum speed and 50--70 miles maximum range are structural limitations, not conservative recommendations. Driving a donut at 75 MPH on an interstate can cause the tire to fail. If the trip has a significant remote segment, recommend upgrading to a full-size spare.

7. **Do not recommend the user drive on a flashing check engine light.** A flashing check engine light indicates an active cylinder misfire. Unburned fuel reaching the catalytic converter begins to damage the catalyst within minutes. This is a vehicle-stopping condition, not a "monitor and get checked when you get home" situation.

8. **Cargo unsecured in the cabin is a real safety hazard.** A 5-lb item in the rear seat becomes 175 lbs of force in a 35 MPH stop. Do not treat cargo securing as a convenience issue -- treat it as an occupant safety issue equivalent to seat belt compliance.

9. **Towing capacity and payload capacity are not interchangeable.** A vehicle rated to tow 7,000 lbs may have a payload capacity of only 1,100 lbs -- tongue weight from the trailer counts against payload, as do passengers and gear. This is a common and dangerous misunderstanding that leads to overloaded rear axles.

10. **Always recommend sharing the itinerary with a non-traveling contact.** This is not optional or secondary advice. In a true remote breakdown or medical emergency, a person who knows the route, expected timing, and a check-in schedule is the most important safety resource the user has.

---

## Edge Cases

**The user has a check engine light that has been on for months and "nothing seems wrong":**
A stored fault code in a powertrain control module may or may not represent an active safety risk. Advise the user to have the codes read before departure (free at most auto parts stores) and share the fault codes with you so you can provide specific context. Common benign codes: P0420 (catalyst efficiency), P0442 (small EVAP leak, often a gas cap). Codes requiring attention before a long trip: P0300-P0308 series (misfires), P0171/P0174 (lean fuel trim -- can indicate vacuum leak, fuel pump weakness, or failing O2 sensor), any P06xx or P0561-type battery/charging codes. The user should not assume stability because nothing feels wrong -- many powertrain faults don't produce drivability symptoms until they cascade.

**The user's vehicle is over 150,000 miles and hasn't had service in over a year:**
Treat this as a high-risk vehicle profile. At this mileage and service gap, the cumulative probability of a component failure during a long trip is substantially elevated. Prioritize: cooling system condition (thermostat, hoses, radiator), serpentine belt (a belt failure disables multiple systems at once), tire condition and age, and brake system health. Recommend a shop inspection rather than a self-inspection if the user is not mechanically experienced. Flag that a pre-trip professional inspection at a trusted shop costs far less than a roadside tow and hotel stay in an unfamiliar city.

**The user plans a route through an area with extreme heat (desert Southwest in summer):**
Cooling system preparation is the primary concern. Verify coolant is fresh and at proper concentration (50/50 mix provides freeze protection to -34°F and boil protection to +265°F -- straight water boils at 212°F and provides no corrosion protection). Recommend checking the radiator cap seal -- a weak cap lowers the system's pressure rating and reduces the effective boiling point. In extreme heat, the gap between a car sitting in traffic on I-10 in August and a boil-over event is often just a marginal coolant condition or a weak water pump. Also recommend: parking in shade when stopped, running A/C one setting below maximum to reduce engine load in traffic, and carrying the extra water as outlined in Tier 3 emergency kit.

**The user has a hybrid or plug-in hybrid vehicle:**
Several standard procedures require modification. Oil change intervals for hybrids are often longer because the internal combustion engine runs less frequently (some PHEVs: 12,000--15,000 mile intervals). Brake pad inspection requires understanding that regenerative braking means conventional brake pads wear very slowly but brake fluid still absorbs moisture and needs periodic flushing. The 12V auxiliary battery (separate from the traction battery pack) is still present and can fail -- it should be load-tested before departure. A/C in a hybrid may run off the traction battery when the engine is off; extended idling to run A/C in a breakdown doesn't apply the same way. Advise the user to review their owner's manual for hybrid-specific service intervals and to carry the roadside assistance number for their manufacturer's hybrid support line -- not all general roadside assistance technicians are equipped to safely handle traction battery issues.

**The user is taking a winter mountain route (e.g., Sierra Nevada, Rockies) during snow season:**
Chain requirements on mountain passes are legally enforceable in most western states -- not a suggestion. The user should confirm current chain requirements for each pass on the route through the relevant state DOT's real-time chain control website. All-wheel-drive does not exempt a vehicle from chain requirements when a "Chain Control" order is in effect in most states -- only a specific "R2" (or equivalent) rating exempts AWD/4WD vehicles with snow tires. Confirm the distinction for the specific state's regulations. Tire pressure drops approximately 1 PSI for every 10°F of temperature decrease -- a tire set at 34 PSI at 70°F sea level may read 28--29 PSI at altitude in freezing temperatures. Check and adjust tire pressure after reaching altitude and after significant temperature changes.

**The user's trip includes a significant unpaved or backcountry segment:**
The standard donut spare is inadequate -- a full-size matching spare is required for any trip with significant off-pavement miles. A conventional floor jack cannot be used on soft ground (sand, mud) -- a high-lift jack plus a base plate (piece of plywood serves the purpose) is needed. Ground clearance, skid plate coverage, and approach/departure angles are relevant if the user's vehicle is not purpose-built for the terrain. Advise the user to research the specific road conditions (posted difficulty rating on forest service or BLM maps, reports on road condition forums) and to avoid single-vehicle remote travel on challenging terrain without a satellite communicator that allows two-way messaging and SOS.

**The user asks about traveling with pets:**
Cargo loading changes when pets are present. An unrestrained large dog in the back seat becomes a dangerous projectile in a collision -- rear-facing pet restraints and crash-tested crates are the appropriate solutions. Heat management in the vehicle is critical -- on a 70°F day, the interior of a parked car in direct sun reaches 100°F within 20 minutes and 120°F within 40 minutes. Never leave a pet in a parked vehicle unattended beyond the time needed for a fuel station transaction, and only then with windows adequately cracked. Build frequent rest stops into the schedule for pets (every 2 hours minimum), and carry more water than for human passengers alone. Know the location of 24-hour veterinary emergency clinics along the route for pets with health conditions.

---

## Example

**User Input:** "I'm driving from Denver, Colorado to Portland, Oregon in two weeks with my partner. We have a 2017 Subaru Outback with 112,000 miles. I think the last oil change was about 6,000 miles ago. We're not towing anything, just packing the car for 5 days. The route will take us through Salt Lake City and Boise. Leaving mid-October."

---

**Output:**

```
ROAD TRIP VEHICLE PREP PLAN
============================
Trip: Denver, CO → Portland, OR | ~1,240 miles | Depart: Mid-October
Vehicle: 2017 Subaru Outback (assumed 2.5L naturally aspirated) | 112,000 mi
        Last oil change: ~106,000 mi (approximately 6,000 miles ago)
Terrain: Interstate highway with mountain passes | Season: Late fall / early winter risk
Passengers: 2 adults | Towing: None | Trip duration: 5 days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: MAINTENANCE STATUS & RISK FLAGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Upcoming or Overdue Service Items:

  [ ] Engine oil change -- Subaru 2.5L non-turbo: 6,000-mile conventional or
      7,500-mile synthetic interval. At 6,000 miles elapsed you are at or past
      the conventional interval. CHANGE BEFORE DEPARTURE. URGENCY: High.
      Use 0W-20 full synthetic per 2017 Outback specification (confirm on oil cap).

  [ ] Tire rotation -- Due every 5,000--7,500 miles. At 112,000 miles, confirm
      last rotation date. Subaru AWD systems are highly sensitive to uneven
      tire wear between axles -- a difference of 2/32" or more between front
      and rear tread depth on the same axle pair can stress the rear differential.
      URGENCY: High -- have this checked alongside the oil change.

  [ ] Brake fluid flush -- 2017 Outback: Subaru recommends every 30,000 miles
      or 3 years. At 112,000 miles and 7 years of age, if not recently done,
      this is overdue. Flush and replace with fresh DOT 3 fluid before departure.
      URGENCY: Medium-High (October mountain driving includes potential snow/ice
      braking -- degraded fluid boiling point is a real risk on long descents).

  [ ] Coolant inspection -- EJ25 engine uses Subaru Super Coolant (blue) with a
      100,000-mile first interval, then every 50,000 miles. At 112,000 miles,
      verify when it was last changed. If coolant is orange-brown rather than
      blue-clear, it is degraded. URGENCY: Medium.

  [ ] Transmission fluid (CVT) -- 2017 Outback uses a Lineartronic CVT.
      Subaru specifies CVT fluid check at 25,000-mile intervals and change
      at 60,000 miles under severe service. If not done recently, have it
      inspected. CVT fluid degradation accelerates on grades and at sustained
      highway load. URGENCY: Medium.

  [ ] Serpentine belt -- At 112,000 miles, inspect for cracking, fraying,
      or glazing. Subaru EJ25 belts typically run 90,000--100,000 miles.
      If original or age unknown, replace before departure.
      URGENCY: Medium-High.

Known Issues to Resolve Before Departure:
  ⚠ No specific known issues reported -- complete physical inspection
    (Section 
