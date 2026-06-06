---
name: appliance-maintenance
description: |
  Provides maintenance schedules and troubleshooting for major household appliances
  including refrigerators, dishwashers, washing machines, dryers, ovens, and
  water heaters. Includes specific cleaning intervals, part replacement timelines,
  and DIY vs. professional repair guidance with cost estimates. Use when the user
  asks about appliance care, cleaning, unusual noises, reduced performance, or
  extending appliance lifespan. Do NOT use for HVAC systems (use hvac-maintenance),
  full home maintenance calendars (use annual-home-maintenance), or commercial
  kitchen equipment.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-maintenance checklist cleaning"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Appliance Maintenance

## When to Use

Use this skill when the user's request clearly centers on a specific major household appliance and falls into one of these scenarios:

- The user asks for a maintenance schedule, cleaning routine, or care tips for a refrigerator, dishwasher, washing machine, dryer, range/oven, microwave, or water heater
- The user describes a symptom -- noise, odor, leak, poor performance, error code, or failure to start -- and wants to diagnose or fix it
- The user wants to know whether to repair or replace a specific appliance, with cost context
- The user asks how long an appliance typically lasts or whether their appliance is near end-of-life
- The user has already had a repair done and wants to know if the price was reasonable or what to watch for next
- The user is buying a used appliance and wants to know what condition indicators to check
- The user wants to reduce utility bills and suspects an aging appliance is contributing to high energy use
- The user asks about a specific part -- such as a water inlet valve, door gasket, heating element, or anode rod -- and whether they should replace it themselves

**Do NOT use this skill when:**
- The user's problem involves HVAC, heat pumps, furnaces, or central air systems -- use `hvac-maintenance` instead
- The user smells gas near any appliance -- instruct them to leave the home immediately without flipping any switches, then call their gas utility's emergency line from outside; this is a life-safety emergency, not a maintenance call
- The user needs a full seasonal home checklist across all systems -- use `annual-home-maintenance` instead
- The appliance is a commercial or industrial unit (commercial dishwashers, industrial ovens, commercial refrigeration) -- these require licensed technicians and different service intervals
- The user's issue is clearly electrical wiring, panel, or breaker work -- refer to a licensed electrician; appliance maintenance does not include household wiring
- The user asks about portable or small countertop appliances (toasters, blenders, coffee makers, air fryers) -- these are not covered by this skill's lifespan and maintenance frameworks

---

## Process

### Step 1: Identify the Appliance and Gather Key Variables

Before providing any guidance, collect the information that determines which maintenance path to follow. Do not give generic advice without these specifics.

- **Appliance type:** Get the exact type -- not just "washer" but front-load or top-load (agitator or impeller); not just "water heater" but tank, tankless, or heat pump; not just "range" but gas, electric coil, or electric smooth-top/induction
- **Age:** Ask the approximate year of purchase or installation. If the user does not know, ask for model number clues or when they moved in -- these narrow the estimate
- **Current symptoms:** Ask for specific descriptions: Is the noise grinding, rattling, squealing, clicking, or buzzing? Does the smell occur during a specific cycle? Is the leak from the bottom, door, or back? Are there any error codes showing on the display?
- **Usage context:** A household of four runs a washer 7-10 loads per week; a single person runs 2-3. Heavy use ages appliances faster. Also ask about hard water (leaves white mineral deposits on fixtures), which accelerates scale buildup in water-using appliances
- **Maintenance history:** Has the user ever cleaned the dryer vent, descaled the water heater, or run a dishwasher cleaning cycle? Many symptoms stem from years of deferred maintenance rather than part failure

### Step 2: Assess Appliance Status Against Lifespan Benchmarks

Use the expected lifespan table below as your baseline. Age alone does not determine status -- age relative to expected lifespan does.

| Appliance | Expected Lifespan | Early Life (Invest in Maintenance) | Mid Life (Prime Maintenance Window) | Late Life (Minimal Investment, Plan Replacement) |
|---|---|---|---|---|
| Refrigerator | 13-17 years | 0-6 years | 7-12 years | 13+ years |
| Dishwasher | 9-13 years | 0-4 years | 5-9 years | 10+ years |
| Front-load washer | 10-14 years | 0-4 years | 5-9 years | 10+ years |
| Top-load washer | 10-15 years | 0-5 years | 6-10 years | 11+ years |
| Dryer (gas or electric) | 13-15 years | 0-5 years | 6-11 years | 12+ years |
| Gas range/oven | 13-18 years | 0-6 years | 7-12 years | 13+ years |
| Electric range/oven | 13-16 years | 0-5 years | 6-11 years | 12+ years |
| Microwave (over-range) | 9-10 years | 0-3 years | 4-7 years | 8+ years |
| Water heater (tank) | 8-12 years | 0-3 years | 4-8 years | 9+ years |
| Water heater (tankless) | 15-20 years | 0-6 years | 7-14 years | 15+ years |

- **Early life:** Emphasize proper habits and preventive maintenance; return on investment is highest here
- **Mid life:** Comprehensive maintenance plus targeted part replacement (belts, hoses, filters); the user should plan for end-of-life 3-6 years out
- **Late life:** Focus on low-cost maintenance only; do not recommend expensive repairs; begin replacement planning and budget guidance

### Step 3: Apply the Repair-vs-Replace Decision Framework

Before providing troubleshooting steps, apply this framework whenever a symptom suggests a potentially costly repair:

**The 50% Rule:** If the estimated repair cost exceeds 50% of the cost of a comparable new replacement unit AND the appliance is past 50% of its expected lifespan, replacement is nearly always the better financial decision.

**The Escalation Check:** Some failures are indicators that more failures are coming soon. Flag these as escalation risks:
- Compressor failure in a refrigerator -- compressors cost $300-600 installed, and when they fail, other sealed-system components (evaporator, condenser) are often degraded
- Control board failure in any appliance -- boards cost $150-400 and their failure often indicates voltage spikes or moisture intrusion that will affect other boards
- Inner drum bearing failure in a washer -- replacing bearings costs $200-350 in labor and parts; if the machine is over 8 years old, replacement is almost always cheaper
- Heat exchanger failure in a tankless water heater -- these cost $500-900 to replace and are a late-life indicator

**The Energy Cost Factor:** Add this to the framework for refrigerators and water heaters specifically. An older, inefficient refrigerator can cost $150-250/year more in electricity than a modern Energy Star unit. An old electric water heater at 0.85 EF (energy factor) versus a heat pump water heater at 3.5-4.0 EF can save $400-600/year in energy. Factor these savings into the replace decision for any unit over 12 years old.

### Step 4: Build the Maintenance Schedule

For each appliance, provide a frequency-based task list. Use the following structure and fill it with appliance-specific tasks (detailed per-appliance guidance is in the Edge Cases and Example sections):

- **After every use (or daily):** Tasks that take under 1 minute; habit-forming behaviors that prevent the majority of failures
- **Monthly:** Tasks that take 5-30 minutes; cleaning cycles, filter checks, visual inspections
- **Quarterly (every 3 months):** Tasks that take 15-45 minutes; component cleaning, drain filter service, descaling
- **Annually:** Tasks that take 30-90 minutes; deeper inspections, part replacements on schedule, dryer vent cleaning
- **Lifespan milestones:** Proactive part replacements tied to age, not failure (inlet hoses at 5 years, anode rods at 3-5 years, dryer belt inspection at 8 years)

Always flag tasks that require the user to disconnect power first. Always flag tasks that require the user to turn off the water supply first.

### Step 5: Diagnose Symptoms Using Probability Ordering

When the user presents a specific symptom, diagnose by probability -- most common cause first. This saves the user from immediately buying parts for a rare cause when the common cause is free to fix.

- **Start with the free/zero-cost checks:** Is the lint trap clean? Is the drain filter clogged? Is the appliance level? Is the door seal intact? Is the water supply valve fully open? Is the air gap clear?
- **Move to low-cost part checks ($5-50):** Water inlet screens blocked? Door strike loose? Drain hose kinked? Leveling feet loose?
- **Then intermediate DIY repairs ($30-150):** Heating element, water valve, door gasket, drain pump, thermostat, belt replacement
- **Flag professional-only work:** Sealed refrigerant systems (EPA 608 certification required), gas valve and burner adjustment, control board replacement (unless user has electronics experience), inner drum bearing replacement (requires full drum disassembly)

For every DIY repair recommendation, provide: part name, typical part cost range, estimated time for a first-timer, minimum tools required, and a risk assessment (what goes wrong if done incorrectly).

### Step 6: Provide Cost Context for Every Recommendation

Maintenance advice without cost context forces the user to make blind decisions. Include:

- **DIY part cost:** Realistic range for the specific part, acknowledging that prices vary by brand compatibility
- **DIY total cost:** Part plus any consumables (cleaning solutions, hose clamps, plumber's tape)
- **Professional repair cost:** Labor plus parts for a typical residential service call, including the $75-150 diagnostic fee that most appliance repair companies charge before any work is done
- **Replacement cost range:** Budget ($400-700), mid-range ($700-1,200), and premium ($1,200-2,500+) tiers where applicable, so the user can calibrate the repair-vs-replace decision against their actual budget
- **Annual maintenance cost:** Total cost to properly maintain the appliance per year, so the user understands the cost of care versus the cost of neglect

### Step 7: Deliver Prioritized Action Items

End every response with a tiered action list -- not just a schedule. The user should know exactly what to do today, this week, and on an ongoing basis.

- **Immediate (do today or this week):** Address any safety concerns (dryer vent blockage, water heater pressure relief valve testing, frayed hose), active symptoms requiring diagnosis, or deferred maintenance that is causing the current problem
- **Short-term (this month):** Cleaning tasks, purchasing replacement parts for scheduled replacements, establishing habit-based maintenance (door ajar, lint trap cleaning)
- **Long-term (ongoing schedule):** Monthly, quarterly, and annual tasks with suggested calendar reminders
- **Financial planning:** When to start budgeting for replacement, estimated replacement cost, and whether to consider an extended warranty on a new purchase

### Step 8: Flag Safety Concerns Explicitly

Safety concerns must be called out with a clear visual marker -- bold text, a warning label, or a dedicated section. Never bury a safety warning in a paragraph of general advice.

- **Fire risk:** Dryer lint buildup in the vent (2,900 dryer fires per year in the US), oven grease buildup, frayed power cords
- **Water damage risk:** Aging rubber washing machine hoses (replace every 5 years with braided stainless), dishwasher drain hose disconnection, water heater pressure relief valve failure
- **Scalding risk:** Water heater temperature above 120°F (140°F if there is a dishwasher without a booster heater -- check the dishwasher specs)
- **Carbon monoxide risk:** Gas appliance burner issues, blocked flue venting on water heaters -- direct the user to install a CO detector within 10 feet of any gas appliance if they do not already have one
- **Electrical risk:** Never allow a user to work inside a control board, touch capacitors in a microwave (they hold lethal charge even when unplugged -- microwave capacitors can store 2,100 volts), or splice appliance wiring

---

## Output Format

Use this structure when responding to a user. Adapt the number of appliances and sections to what was asked.

```
## Appliance Maintenance Plan

### [Appliance Type] -- [Gas/Electric/Front-Load/Top-Load/Tank/Tankless as applicable]
**Age:** [X years] | **Expected Lifespan:** [X-X years] | **Status:** [Early Life / Mid Life / Late Life]
**Remaining Useful Life (estimated):** [X-X years]
**Annual Maintenance Cost:** ~$[X-X]

---

#### ⚠️ Safety Flags
[List any immediate safety concerns specific to this appliance, age, and symptoms. If none, omit this section.]

---

#### Maintenance Schedule
| Frequency | Task | Time Required | DIY Cost |
|-----------|------|---------------|----------|
| After every use | [specific habit-based task] | [time] | $0 |
| Monthly | [specific cleaning or inspection task] | [time] | $[range] |
| Quarterly | [specific component service task] | [time] | $[range] |
| Annually | [specific deep-service task] | [time] | $[range] |
| At [X] years | [proactive part replacement milestone] | [time] | $[range] |

---

#### Symptom Diagnosis (if applicable)
| Symptom Reported | Most Likely Cause | DIY Fix | DIY Cost | Pro Repair Cost |
|------------------|-------------------|---------|----------|-----------------|
| [symptom] | [cause, in order of probability] | [specific steps] | $[range] | $[range] |

---

#### Repair-vs-Replace Analysis (if applicable)
**Repair cost estimate:** $[X-X]
**Replacement cost (comparable unit):** $[X-X]
**50% threshold:** $[X] (50% of replacement cost)
**Appliance age vs. lifespan:** [X] years / [X-X] year lifespan = [X%] through expected life
**Recommendation:** [Repair / Replace / Borderline -- see notes]
**Reasoning:** [2-3 sentences explaining the specific calculation and any escalation risks]

---

#### Prioritized Action List
**Do this week:**
- [Specific task 1]
- [Specific task 2]

**Do this month:**
- [Specific task 1]
- [Specific task 2]

**Add to your ongoing calendar:**
- Monthly: [task]
- Quarterly: [task]
- Annually: [task]

---

### Replacement Budget Planner
| Appliance | Current Age | Lifespan | Est. Replace Window | Budget Tier | Est. Cost |
|-----------|-------------|----------|---------------------|-------------|-----------|
| [name] | [X yrs] | [X-X yrs] | [X-X years from now] | Mid-range | $[X-X] |
```

---

## Rules

1. **Never instruct users to open sealed refrigerant systems.** Refrigerant handling requires EPA Section 608 certification. Any symptom pointing to a refrigerant leak (warm fridge, ice buildup only on one side of the evaporator, hissing sound) must be referred to a certified HVAC/R technician. DIY refrigerant recharge kits sold in auto stores are not appropriate for household refrigerators.

2. **Never instruct users to work on microwave internal components.** The capacitor in a microwave stores up to 2,100 volts and can deliver a fatal shock even when the unit has been unplugged for days. The only safe DIY microwave work is cleaning interior surfaces, replacing the turntable, and replacing the light bulb (on models with accessible bulb covers). All internal repairs require a qualified technician or unit replacement.

3. **Always apply the 50% repair-vs-replace rule with actual numbers.** Do not state the rule abstractly -- calculate the threshold using the specific repair estimate and the actual replacement cost for a comparable unit. Show the math explicitly so the user can follow the reasoning.

4. **Always disconnect power (and water for plumbing-connected appliances) before any maintenance task beyond surface cleaning.** Specify whether this means unplugging the unit, switching off the dedicated circuit breaker, or turning off the cold water supply valve. The exact procedure depends on the appliance and task.

5. **Dryer vent cleaning is not optional -- flag it as a fire safety task.** Lint buildup in dryer vents is responsible for approximately 2,900 residential fires per year in the US. Vents must be cleaned annually for households doing 5+ loads per week, and every 2 years for lighter use. A vent run longer than 25 feet or with more than two 90-degree bends needs more frequent cleaning because lint accumulates faster.

6. **Water heater anode rod inspection is mandatory for extending tank water heater life.** The anode rod (a magnesium or aluminum rod inside the tank) sacrificially corrodes to protect the tank lining. When it is consumed (down to the core wire), the tank itself begins corroding. Inspect at 3 years; replace if less than 1/2 inch of magnesium/aluminum remains, or if it is heavily coated with calcium. A $30-50 anode rod replacement can extend tank life by 4-6 years.

7. **Washing machine inlet hoses are a top-five home water damage cause.** Rubber hoses degrade from the inside out and show no external warning before failing. Recommend replacement with braided stainless steel hoses at 5 years regardless of visible condition. Braided stainless hoses cost $15-30 for a pair and are a 15-minute DIY swap. Always turn off the water supply valves behind the washer before replacing.

8. **Hard water areas require more frequent descaling of all water-using appliances.** Water hardness above 120 mg/L (7 grains per gallon) significantly accelerates scale buildup in dishwashers, washing machines, water heaters, and refrigerator water/ice systems. Ask the user if they have hard water or if they see white mineral deposits on faucets and fixtures. In hard water areas, reduce all water-related maintenance intervals by 30-50%.

9. **Cost estimates must always be presented as ranges, not single figures.** Labor rates for appliance repair vary from $60-120/hour by region. Parts vary by brand compatibility. Always give a realistic low-high range and note that the diagnostic fee ($75-150) is typically charged separately from repair labor, even if the repair is declined.

10. **Do not recommend specific replacement appliance brands, but do recommend specific features.** When replacement is appropriate, guide the user toward feature categories: Energy Star certification for refrigerators and dishwashers, steam cycle capability for front-load washers to reduce allergens, self-cleaning vs. steam clean ovens (note that pyrolytic self-clean cycles heat to 900°F and are hard on oven door gaskets), and first-hour recovery rate (not just tank size) for water heaters.

---

## Edge Cases

### Hard Water Scaling in Water-Using Appliances

Water hardness above 120 mg/L (roughly 7 grains per gallon -- most municipal water hardness reports use grains/gallon) causes calcium carbonate to precipitate onto heating elements, water inlets, and spray nozzles. This is one of the most commonly overlooked causes of appliance degradation.

- **Dishwasher:** White film on dishes, glasses, and the interior walls is the primary indicator. Scale on the heating element reduces efficiency and eventually burns out the element. Use a citric acid descaler (not vinegar -- vinegar's acidity is too low to fully dissolve calcium at dishwasher concentrations) monthly in hard water areas. Citric acid packets cost $3-5 each. Run empty on the hottest cycle.
- **Washing machine:** Scale inside the drum and on water inlet valve screens reduces water flow and leaves white residue on dark fabrics. Run a monthly hot cleaning cycle with citric acid or a washing machine descaler tablet. Clean the inlet valve screens (two screens, one per hose connection) every 6 months -- turn off water supply, disconnect hoses, use needle-nose pliers to remove screens, rinse under running water, reinstall.
- **Water heater (tank):** Scale accumulates on the bottom of the tank (the loudest indicator is a rumbling or popping noise during heating), which insulates the heating element and causes it to overheat and burn out prematurely. Flushing 2-3 gallons from the drain valve every 6 months removes loose sediment; annual full flush recommended. In hard water areas, a whole-house water softener reduces maintenance burden across all appliances significantly and typically pays for itself within 5-7 years in appliance longevity alone.
- **Refrigerator ice maker and water dispenser:** Scale in the water filter housing and ice mold causes slow dispensing and off-flavor ice. Replace the water filter every 6 months instead of the standard 12 months. Descale the ice mold annually by running a cleaning cycle per the owner's manual (most modern refrigerators have an ice maker cleaning mode).

### Appliance Under Active Manufacturer or Extended Warranty

This edge case requires a different approach because DIY repair beyond basic cleaning can void coverage.

- **Manufacturer's limited warranty** typically covers parts and labor for 1 year on the full appliance; some brands offer 5-year coverage on specific components (compressors, motors). Check the warranty card or the manufacturer's website with the model number.
- **Extended service plans** (purchased separately) often exclude: damage caused by failure to follow the owner's manual, cosmetic damage, filter replacements, and "consumable" parts. Read the exclusion list carefully.
- **What is safe to do under warranty without voiding it:** Cleaning lint traps, cleaning filters designed to be user-serviceable (dishwasher filters, refrigerator water filters), wiping interior surfaces, running manufacturer-recommended cleaning cycles, adjusting leveling feet. These are explicitly described as user responsibilities in virtually all owner's manuals.
- **What will likely void warranty:** Replacing any internal part (even a door gasket), using non-approved cleaning chemicals inside the appliance, opening any panel or access cover beyond what the owner's manual shows.
- **Action:** When a warranted appliance has a malfunction, advise the user to call the manufacturer's service line first. They will often dispatch a warranty repair technician at no cost. The diagnostic call is the user's first step -- not self-diagnosis.

### Rental Property -- Tenant Perspective

Tenant responsibilities vary by lease and jurisdiction, but most follow a consistent baseline that landlords and courts recognize:

- **Tenant responsibility (almost universally):** Cleaning appliance interiors and exteriors, removing and cleaning dishwasher filters, cleaning refrigerator coils if accessible, cleaning lint traps, reporting malfunctions promptly in writing
- **Landlord responsibility (almost universally):** All mechanical repairs, part replacements, pest damage, appliance replacements when the appliance fails through normal use
- **Gray areas:** Drain blockages (courts often split based on what caused the clog -- grease from cooking habits is tenant responsibility; aging pipes are landlord responsibility), refrigerator water filter replacement, and dryer vent cleaning
- **Advise tenants to:** Document every appliance issue with photos or video with timestamps, submit all maintenance requests in writing (email creates an automatic timestamp and paper trail), and keep copies of all requests and responses. In most US states, if a landlord fails to repair essential appliances (refrigerator, stove) within a reasonable timeframe (typically 14-30 days), tenants have legal remedies including rent withholding or repair-and-deduct up to a statutory limit.
- **Do not advise tenants to perform any repair themselves** unless the lease explicitly grants that right and the repair is clearly cosmetic or consumable (replacing a light bulb inside the fridge, for example).

### Appliance Past Its Expected Lifespan (10+ Years on Shorter-Lived Units, 15+ on Longer-Lived)

When an appliance is clearly in late life, the maintenance philosophy shifts entirely:

- **Do not invest in major repairs.** A $250 repair on a 12-year-old dishwasher (expected lifespan 9-13 years) makes no financial sense. Parts for older models become scarce, expensive, and sometimes only available as "pulls" from other used units.
- **Focus on minimal maintenance that sustains function:** Cleaning, descaling, filter replacement, and clearing blockages. These cost under $20 and buy time.
- **Watch for the "cascade failure" pattern.** When one major component fails on an old appliance (control board, motor, compressor), another failure typically follows within 6-18 months. One repair does not reset the clock.
- **Prepare for replacement proactively.** Advise the user to set aside $50-100/month into a dedicated appliance replacement fund. A sudden appliance failure -- especially a refrigerator or water heater -- creates pressure to make a rushed, poorly researched replacement purchase. Planning avoids this.
- **Energy cost acceleration in old age.** A refrigerator manufactured before 2001 uses 2-3x the electricity of a current Energy Star model. A water heater more than 12 years old loses efficiency as scale builds up. If the user's utility bills seem high, check the appliance age before assuming it is a utility rate issue.

### Smart Appliances, Connected Appliances, and Error Codes

Modern appliances with digital displays show error codes that can dramatically narrow diagnosis -- but misreading them is equally common.

- **Error codes are not universal.** There is no cross-manufacturer standard. An E1 code on one brand means "water supply issue," on another it means "control board fault," and on a third it means nothing (it is a startup self-test display). Never interpret an error code without confirming the exact model number and the manufacturer's error code chart.
- **How to find the right error code information:** The owner's manual is always the authoritative source. The model number is typically printed on a label inside the door frame (washers, dryers, dishwashers) or on the back/side of the unit (refrigerators, ovens). Entering "[brand] [model number] error code [code]" into a search will almost always surface the correct manufacturer documentation.
- **Common error code pattern categories across manufacturers (not universal, but statistically common):**
  - Codes containing "E1," "F1," or "01" frequently indicate control board or communication errors
  - Codes containing "E3," "F3," or "03" frequently indicate temperature sensor or thermistor faults
  - Codes containing "OE," "F21," "5D," or "Sud" frequently indicate drain issues or excessive suds
  - Codes containing "LE," "UL," or "UE" frequently indicate motor load or balance issues
- **Smart appliance diagnostics:** Many newer appliances can transmit diagnostic data to a smartphone app or a service technician's device via Wi-Fi or NFC. If the user has a connected appliance, advise them to run the appliance's built-in diagnostic mode before any other troubleshooting -- this generates a specific fault log that a service technician can interpret accurately and speeds up repair time.
- **After clearing an error code:** If an error code appears once and does not recur after the user addresses the likely cause, it was likely a transient fault. If the same error code recurs within 5 cycles, it indicates a persistent underlying problem that requires diagnosis.

### Combination and Compact Units

Combo washer-dryers, stacked units, and compact apartment appliances have unique constraints that standard maintenance guidance does not address:

- **Ventless combo washer-dryers (condenser drying):** These units collect moisture in a condenser rather than venting it outside. The condenser drawer or filter must be cleaned monthly -- more often in hard water areas. Failure to clean it causes clothes to remain damp after the dry cycle and creates mold growth in the condenser housing. The drain pump filter also needs quarterly service just as a standard front-load washer does.
- **Vented stacked units:** The dryer vent in a stacked configuration is often shorter and more constricted than in a dedicated laundry room. Inspect and clean the vent run at least twice per year. The stacking kit brackets -- metal rails that prevent the dryer from shifting -- must be inspected annually for looseness. A dryer falling off a stacked washer is a crush injury risk.
- **Compact dishwashers (countertop or 18-inch):** These units typically do not have an accessible drain filter; they use a self-cleaning grinder. Maintenance focuses on interior descaling and spray arm cleaning. The spray arm holes (1-2mm diameter) clog easily -- remove the spray arm monthly (usually twists off counterclockwise) and clear each hole with a toothpick.
- **Over-range microwaves:** The grease filter (a metal mesh filter underneath the unit) must be cleaned monthly by soaking in hot soapy water and air drying. The charcoal recirculation filter (used when the unit is not externally vented) must be replaced every 6 months -- it cannot be cleaned. If the microwave is externally vented, it does not have a charcoal filter. The exhaust fan motor is the most common failure point and requires professional service or unit replacement.

---

## Example

**Input:** "My dishwasher is about 8 years old and my dishes have been coming out with white spots and a gritty film on them lately. Also, it seems like it's not cleaning the bottom rack as well as the top rack. What's going on and what should I be doing to maintain it?"

---

**Output:**

## Appliance Maintenance Plan

### Dishwasher -- Built-In Standard (assumed 24-inch)
**Age:** 8 years | **Expected Lifespan:** 9-13 years | **Status:** Late Mid Life -- entering the replacement planning window
**Remaining Useful Life (estimated):** 1-5 years
**Annual Maintenance Cost (if kept in good condition):** ~$30-50

---

#### ⚠️ Safety Flags

None critical at this time. However: before cleaning the filter or inspecting the spray arms, run a rinse cycle to remove standing water, then open the door and allow the interior to cool for 10 minutes. The heating element on the bottom of the tub reaches 140-160°F during the dry cycle and retains heat.

---

#### Symptom Analysis -- White Spots, Gritty Film, and Uneven Cleaning

Your symptoms are almost certainly related to three overlapping problems: hard water scaling, a clogged drain filter, and blocked spray arm nozzles. These are the three most common causes of exactly the pattern you are describing -- white film and residue with worse performance on the bottom rack. Here is what is happening in each case and how to fix it:

**Problem 1: Hard water mineral deposits (white spots and film)**

White spots on glasses and dishes are calcium carbonate deposits left behind when hard water evaporates. If you see white buildup on your faucets, inside your kettle, or on shower doors, you have hard water -- which is the root cause. The dishwasher itself is not malfunctioning; it is working correctly but cannot overcome chemistry without help.

Immediate fix (one-time deep descale):
1. Empty the dishwasher completely.
2. Place 2 cups of white vinegar in a dishwasher-safe bowl on the bottom rack. Run a hot water cycle (the hottest setting available). The vinegar dissolves calcium deposits from the interior walls, door, and spray arms.
3. After the cycle completes and the interior cools, sprinkle 1 cup of baking soda across the bottom of the tub. Run a short hot cycle. This neutralizes residual odors and polishes the stainless interior.
4. Going forward, add a rinse aid dispenser to every load. Rinse aid breaks water surface tension so it sheets off dishes instead of beading and evaporating to leave mineral spots. Set the dispenser to level 4-5 out of 6 if you have hard water. Refill when the indicator light shows (typically every 3-4 weeks with normal use).
5. If white film recurs quickly despite rinse aid, switch to using a dishwasher descaler product containing citric acid (not vinegar alone) monthly. Citric acid is significantly more effective than vinegar for heavy scale because it chelates calcium ions directly.

**Problem 2: Clogged drain filter (gritty film and reduced cleaning)**

Modern dishwashers (post-2010 on most brands, post-2005 on some) replaced self-cleaning grinder mechanisms with manual mesh filters because filters are quieter. The tradeoff is that the filter requires regular cleaning -- and most owners have never cleaned it because no one told them it existed.

The filter is located at the bottom of the dishwasher tub, typically at the base of the lower spray arm. It consists of two pieces: a cylindrical upper filter and a flat mesh lower filter. When the filter is clogged with food particles, grease, and debris, the recirculation pump pulls from a contaminated water supply and redistributes that debris onto your dishes -- which explains the gritty film. It also reduces water pressure to the spray arms, which reduces cleaning performance.

How to clean the filter (15 minutes, tools: none):
1. Pull out the lower rack completely.
2. Locate the cylindrical filter at the bottom center of the tub. Twist it counterclockwise (usually 1/4 turn) and lift straight up.
3. Below the cylindrical filter is a flat mesh filter -- lift it out.
4. Rinse both filter pieces under warm running water. Use a soft toothbrush to scrub the mesh -- do not use a scouring pad, which will damage the fine mesh screen.
5. If filters are coated in grease, soak them in hot soapy water for 10 minutes first.
6. Inspect the filter well (the area where the filter sits) for accumulated debris and wipe it clean.
7. Reinstall the flat filter first, then the cylindrical filter. Twist clockwise to lock.

Clean this filter monthly going forward. Based on your symptoms, yours is likely heavily clogged and may need a second cleaning cycle (rinse, inspect, rinse again) to fully clear.

**Problem 3: Blocked bottom spray arm nozzles (bottom rack cleaning worse than top)**

The bottom spray arm is a rotating plastic arm with 8-12 small holes (approximately 1.5-2mm diameter). Food particles, mineral deposits, and debris block these holes over time, reducing water pressure and spray coverage -- which is why your bottom rack performance has declined faster than the top. The top spray arm (located under the upper rack) is partially protected from falling debris and typically stays cleaner longer.

How to clean the spray arms (20 minutes, tools: toothpick, needle, or thin wire):
1. Remove the lower rack. The bottom spray arm snaps off its center hub -- press the center tab and pull up, or unscrew the center nut (counterclockwise) depending on your model.
2. Hold the spray arm up to a light source and look through each nozzle hole. Blocked holes will appear dark or opaque.
3. Use a toothpick or thin wire to clear each blocked hole. Do not use a drill bit or any tool that will enlarge the hole.
4. Rinse the spray arm under running water while holding a finger over the center hub to force water through the nozzles. You should see clear water jets from every hole.
5. Check that the spray arm spins freely on its hub bearing. If it is stiff, the bearing is worn. A replacement spray arm costs $15-30 (model-specific) and is a 5-minute DIY swap.
6. Reinstall the spray arm and confirm it rotates freely by hand before running a cycle.
7. Also clean the upper spray arm using the same method -- remove it (typically unscrews counterclockwise), clear any blocked nozzles, rinse, reinstall.

---

#### Maintenance Schedule
| Frequency | Task | Time Required | DIY Cost |
|-----------|------|---------------|----------|
| After every load | Leave the door slightly ajar for 15-20 minutes after the cycle ends to allow steam and residual moisture to escape -- reduces interior mold and odor | 5 sec | $0 |
| Every load | Use rinse aid -- fill the dispenser and set to level 4-5 for hard water | 1 min | ~$0.10/load |
| Every load | Scrape (do not pre-rinse) dishes before loading -- modern dishwashers need a small amount of food soil to activate the enzymes in detergent; rinsing dishes too clean can actually result in worse cleaning | 30 sec | $0 |
| Monthly | Clean the drain filter (cylindrical + flat mesh) -- remove, scrub with toothbrush, rinse, reinstall | 15 min | $0 |
| Monthly | Run a descaling cycle: empty machine, 2 cups white vinegar on the bottom rack, hottest cycle | 1 hr (machine time) | $0.50 |
| Monthly | Check and refill rinse aid dispenser | 2 min | ~$3/month |
| Every 3 months | Clean both spray arms -- remove, clear all nozzle holes with a toothpick, rinse, reinstall | 20 min | $0 |
| Every 3 months | Wipe the door gasket (the rubber seal around the door perimeter) with a damp cloth -- remove food debris and check for tears or mold | 5 min | $0 |
| Annually | Inspect and clean the interior walls, door inner panel, and detergent dispenser with a citric acid descaler cycle (run empty with a commercial dishwasher cleaner tablet, $4-6) | 1.5 hrs total | $5-7 |
| Annually | Inspect the door springs and hinges for wear -- the door should feel balanced and stay open at a 45-degree angle without slamming down or springing up | 5 min | $0 (inspect) |
| Annually | Check the water supply inlet valve hose under the sink (connects dishwasher to hot water supply) for bulging, cracking, or leaks at the connection points | 5 min | $0 (inspect) |
| At 8-10 years (NOW) | Inspect the spray arm bearing hubs and filter housing for stress cracks -- plastic components become brittle with age and heat cycling; replace if cracked (parts are $10-40 each) | 10 min | $0-40 |

---

#### Common Issues and Fixes
| Symptom | Most Likely Cause | DIY Fix | DIY Cost | Pro Repair Cost |
|---------|-------------------|---------|----------|-----------------|
| White spots / film on dishes | Hard water deposits; insufficient rinse aid | Run vinegar descale cycle; add rinse aid; increase rinse aid dispenser level | $0-1 | $80-120 (descale service) |
| Gritty residue on dishes | Clogged drain filter recirculating debris | Clean filter monthly | $0 | $100-150 |
| Bottom rack cleans worse than top | Blocked lower spray arm nozzles | Clear spray arm holes with toothpick | $0 | $100-150 |
| Standing water after cycle | Clogged filter + drain hose blockage | Clean filter; check drain hose for kinks; check air gap (if present) on the sink | $0 | $100-200 |
| Musty odor from interior | Mold in filter housing, door gasket, or interior crevices | Deep clean cycle + leave door ajar after every load | $1-2 | $100-150 |
| Door latch does not catch | Worn door latch or misaligned strike plate | Replace door latch assembly ($20-40, 20 min DIY) | $20-40 | $120-200 |
| Water leaks from door seal | Torn or hardened door gasket | Replace door gasket ($30-70, 30 min DIY -- pull old gasket from channel, push new one in) | $30-70 | $150-250 |
| Detergent pod does not dissolve | Dispenser door spring broken, or pod placed incorrectly | Replace dispenser door spring ($8-20, 20 min DIY); ensure pod goes in the dispenser cup, not the bottom of the tub | $8-20 | $100-180 |
| Loud grinding during wash cycle | Debris (glass chip, bone fragment) in the pump impeller | Remove filter, use a flashlight to inspect impeller cavity, remove debris with needle-nose pliers | $0 | $120-200 |

---

#### Repair-vs-Replace Analysis

At 8 years old on a 9-13 year lifespan, your dishwasher is entering its replacement planning window. Here is how to think about any future repairs:

**50% threshold for your appliance:**
- Replacement cost for a comparable mid-range dishwasher: $600-900 installed
- 50% threshold: $300-450
- Current appliance age vs. lifespan: 8 years / 9-13 years = 62-89% through expected life

**Implication:** Your dishwasher is past the 50% lifespan mark. Any repair costing over $300 -- a control board failure, wash pump motor failure, or major door mechanism failure -- makes replacement the better financial choice. For repairs under $150 (spray arm, door latch, gasket, filter housing), repair is still sensible given the low cost. The current issues (scaling, blocked filter and spray arms) cost nothing to fix, so address those immediately.

**Energy note:** If your dishwasher was manufactured before 2012, it likely uses 6-10 gallons per wash cycle. Current Energy Star certified dishwashers use 3.5 gallons or less. If you replace it, look for Energy Star certification and a water consumption figure below 4.0 gallons per cycle -- this saves approximately $35-50/year in water and energy costs.

---

#### Prioritized Action List

**Do this week:**
- Clean the drain filter -- this is the most likely contributor to the gritty film and is causing active degradation; it takes 15 minutes and costs nothing
- Clear all nozzle holes on both spray arms -- this directly addresses the uneven cleaning performance you are seeing
- Run a full descaling cycle with 2 cups of white vinegar on the hottest cycle

**Do this month:**
- Purchase rinse aid (a standard 16 oz bottle, $4-6, lasts 2-3 months) and fill the dispenser to level 4-5
- Wipe down the door gasket and inspect it for tears or mold
- If the white film is severe, run a citric acid descaler (commercial dishwasher cleaner tablet, $4-6) cycle after the vinegar cycle

**Add to your ongoing calendar:**
- Monthly: Clean drain filter + run descaling cycle
- Quarterly: Clean spray arms; wipe door gasket
- Annually: Full interior descale + door spring and hinge inspection + supply hose inspection
- Now (year 8): Start budgeting for replacement. Set aside $50-75/month so that when this dishwasher reaches the end of its life (likely 1-5 years from now), you can replace it without financial pressure.

---

### Replacement Budget Planner
| Appliance | Current Age | Lifespan | Est. Replace Window | Budget Tier | Est. Cost |
|-----------|-------------|----------|---------------------|-------------|-----------|
| Dishwasher (24-inch built-in) | 8 years | 9-13 years | 1-5 years from now | Budget | $400-600 |
| | | | | Mid-range | $600-900 |
| | | | | Premium | $900-1,500 |

**Buying guidance when you reach replacement:** Prioritize a third rack (adds utensil washing capacity and is a strong indicator of overall build quality), 4.0 gallons-per-cycle or less (Energy Star), and a stainless steel interior tub (plastic tub interiors absorb odors and are associated with shorter appliance life in higher-humidity climates). Skip Wi-Fi connectivity on dishwashers -- it adds cost without meaningful maintenance benefit.
