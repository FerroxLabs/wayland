---
name: hvac-maintenance
description: |
  Guides homeowners through HVAC system maintenance including filter replacement
  schedules, seasonal tune-up tasks, efficiency optimization, and troubleshooting
  common issues. Covers forced air, heat pumps, boilers, mini-splits, and window
  units with specific intervals and cost ranges. Use when the user asks about
  furnace or AC maintenance, filter changes, HVAC efficiency, or heating/cooling
  system care. Do NOT use for full annual home maintenance (use annual-home-maintenance),
  emergency HVAC failure diagnosis, or commercial HVAC systems.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-maintenance guide troubleshooting"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# HVAC Maintenance

## When to Use

**Use this skill when the user:**
- Asks how often to replace or check their HVAC filter, or what filter type and MERV rating to buy
- Wants a seasonal maintenance checklist for a furnace, central AC, heat pump, boiler, mini-split, or window unit
- Asks about reducing heating or cooling bills through system maintenance rather than behavioral changes
- Wants to know what HVAC maintenance they can safely do themselves versus what requires a licensed HVAC technician
- Reports reduced heating or cooling performance, unusual noises, higher-than-normal utility bills, or musty/burning smells and wants a diagnostic guide
- Has a new home and wants to understand the systems they inherited
- Asks how to prepare their system for winter or summer
- Wants to understand what a professional tune-up should include so they can evaluate whether the work was done correctly
- Is deciding between repairing an aging HVAC system versus replacing it

**Do NOT use this skill when:**
- The user has no heat during freezing temperatures or no cooling during dangerous heat -- this is an emergency; instruct them to call an HVAC contractor or their utility emergency line immediately and do not delay with a maintenance checklist (use `emergency-home-repair` if available)
- The user smells rotten eggs or sulfur near the furnace -- this indicates a gas leak; instruct them to leave the house immediately, avoid using electrical switches, and call the gas utility or 911 from outside
- The user needs a full annual home maintenance calendar covering plumbing, roofing, electrical, and landscaping (use `annual-home-maintenance`)
- The user is asking about commercial or industrial HVAC systems -- commercial systems involve different load calculations, refrigerant regulations, and code requirements
- The user needs to diagnose a complete system failure requiring refrigerant recovery, heat exchanger replacement, or gas valve replacement -- these require licensed HVAC technicians and are beyond homeowner scope
- The user is asking about installing a new HVAC system or comparing equipment quotes (use a separate equipment-selection or contractor-vetting skill)
- The user is troubleshooting electrical panel issues related to HVAC circuits -- this falls under electrical safety, not HVAC maintenance

---

## Process

### Step 1: Identify the HVAC System Type and Configuration

Before any maintenance guidance can be given, establish exactly what system the user has. Many homeowners do not know the difference between a heat pump and a furnace -- ask clarifying questions if the input is vague.

- **System type categories:** (a) Gas furnace + central AC (separate refrigerant system, shared ducts), (b) Electric heat pump + air handler (single refrigerant system, cools and heats), (c) Dual-fuel hybrid (gas furnace + heat pump, switchover typically at 35-40°F outdoor temp), (d) Boiler with radiators or radiant floor (hot water or steam, no ducts, no air filter), (e) Mini-split ductless system (one outdoor unit, one to eight indoor air handlers), (f) Window or portable AC units only, (g) Electric baseboard heating (no maintenance beyond cleaning dust from fins), (h) Geothermal heat pump (unique refrigerant loop, well pump, and heat exchanger considerations)
- **How to identify a heat pump vs. furnace + AC:** A heat pump has only one outdoor unit that operates for both heating and cooling. If the outdoor unit runs in the winter, it is a heat pump. A gas furnace + AC combination will have a flue pipe exiting through the roof or wall; the outdoor unit runs only during cooling season.
- **Determine age:** Ask the user to find the data plate on the indoor unit (usually inside the furnace cabinet door or on the air handler). The manufacture date is often encoded in the serial number -- most manufacturers use the first four digits as year and week (e.g., "1815" = 15th week of 2018). Age categories: under 5 years (new, warranty likely active), 5-15 years (mid-life, maintain aggressively), 15-25 years (aging, plan replacement), over 25 years (past expected life, replacement imminent)
- **Identify fuel type:** Natural gas, propane (LP), oil, or electric. This determines combustion maintenance requirements and professional service scope.
- **Identify filter type and size:** 1-inch disposable (most common, fits standard filter slot), 4-inch deep media (requires a special filter cabinet), electrostatic washable, electronic air cleaner, HEPA bypass, or no filter (boiler systems and some older systems)
- **Identify duct presence and type:** Metal supply and return ducts, flexible duct (grey or silver insulated flex), no ducts (boiler, mini-split, baseboard), or a mix

### Step 2: Gather Context That Changes the Maintenance Plan

Several variables significantly alter maintenance intervals and priorities -- collect this information before building the plan.

- **Occupancy and air quality factors:** Number of people in the home, presence of pets (each pet adds 20-30% more particulate load to the filter), smokers in the home (doubles filter replacement frequency), allergy or asthma sufferers (requires MERV 11-13 minimum, shorter replacement intervals), recent renovation (drywall dust can clog a 1-inch filter in weeks)
- **Home characteristics:** Square footage and number of stories (affects airflow balance), age of home and duct system, presence of unconditioned attic or crawlspace (duct leakage risk), basement versus slab foundation (affects condensate drainage and humidity)
- **Climate zone:** Heating-dominated climates (northern US, Canada) emphasize furnace tune-ups; cooling-dominated climates (southern US, southwest) emphasize AC and heat pump cooling maintenance; mixed climates need equal attention to both
- **Usage patterns:** Vacation home or seasonal-only use (start-up and shutdown procedures become critical), rental property (filter changes may be neglected -- increase inspection frequency), recently purchased home (unknown maintenance history, treat as deferred maintenance)
- **Current complaints:** Establish what problem, if any, triggered this conversation. High bills, uneven temperatures, strange sounds, smells, or system short-cycling all have specific diagnostic pathways

### Step 3: Build the Customized Filter Schedule

Filter maintenance is the single highest-impact DIY maintenance task. Build a specific schedule based on the collected context.

- **1-inch disposable filters:** Base interval is every 90 days. Adjust: subtract 30 days for each pet, subtract 30 days for allergy/asthma sufferers, reduce to 30 days during renovation, extend to 120 days for vacation homes that sit empty for extended periods. Minimum practical interval is 30 days.
- **4-inch media filters (e.g., 16x25x4 or 20x25x4):** Base interval is every 9-12 months. Adjust: 6-9 months with pets or allergy sufferers. Do not wash or vacuum 4-inch media filters -- the filter media is pleated to create surface area and compression destroys it.
- **Electrostatic washable filters:** Wash every 30-60 days. Wash with warm water and mild soap, rinse thoroughly, and allow to air dry completely -- installing a wet filter introduces moisture to the ductwork and creates mold risk. These filters have lower MERV ratings (typically MERV 6-8) than 4-inch media filters.
- **Electronic air cleaners (whole-house precipitators):** Clean the collector cells every 1-3 months by soaking in warm soapy water. A dirty electronic air cleaner can produce ozone and reduces airflow significantly.
- **MERV rating guidance:** MERV 6-8 -- basic filtration, adequate for clean homes; MERV 8-11 -- good all-purpose filtration, captures most dust, pollen, and pet dander; MERV 11-13 -- recommended for allergy/asthma, captures fine particles; MERV 14+ -- near-HEPA, significantly restricts airflow and is only safe if the system's blower and duct system are sized to handle the static pressure increase. Do not install MERV 14+ filters in systems designed for standard 1-inch filters without verifying the blower can handle the additional pressure drop.
- **Filter replacement how-to:** Always turn the system off at the thermostat before replacing the filter. Locate the arrow on the filter frame indicating airflow direction -- it always points toward the furnace/air handler, away from the return duct. Write the installation date on the filter frame with a permanent marker. Dispose of the old filter in a sealed bag to contain captured particulate.

### Step 4: Build the Seasonal DIY Maintenance Checklists

Seasonal tasks prevent the most common and expensive failure modes. Organize by season and system type, and include only tasks within homeowner capability.

**Spring tasks (March-April, before cooling season begins):**
- Replace or check the air filter
- Clear debris (leaves, grass clippings, seed pods) from around the outdoor condenser unit. Maintain 2 feet of clearance on all sides and 5 feet above. Do not mulch up to the unit.
- Gently rinse condenser coil fins with a garden hose, spraying from inside the unit outward (removes buildup of cottonwood, dirt, and grass clippings). Never use a pressure washer -- fin damage reduces efficiency measurably. Never rinse an energized unit.
- Straighten bent condenser fins with a fin comb (available for $10-20 at hardware stores). Bent fins reduce airflow through the coil and degrade efficiency.
- Clear the condensate drain line by pouring 1/4 cup of distilled white vinegar followed by 1 cup of warm water into the drain pan or the accessible clean-out point on the drain line. Algae growth is the leading cause of condensate drain clogs, which cause water damage and trigger safety float switches that shut the system off.
- Check the condensate drain pan for standing water (indicates a clogged drain that needs immediate attention), rust, or mold
- Inspect the insulation on refrigerant lines (the larger insulated suction line running from the outdoor unit to the indoor unit) for cracks or deterioration. Damaged insulation reduces efficiency and can cause condensation and moisture damage.
- Open all supply registers and return air vents -- check for furniture, rugs, or stored items blocking them
- Test the system by setting the thermostat to cooling mode, dropping the setpoint 5 degrees below room temperature, and confirming that cool air arrives within 5 minutes and that the outdoor unit starts
- Test the condensate overflow switch if present (typically a float switch in the secondary drain pan -- dribble water into the secondary pan to confirm it shuts the system off)

**Fall tasks (September-October, before heating season begins):**
- Replace or check the air filter
- Test carbon monoxide detectors on every floor of the home -- HVAC season is when CO risk increases
- Inspect the furnace flue/exhaust pipe for disconnections, rust holes, or bird/pest nests. B-vent (double-wall metal) pipes should be firmly connected with no gaps. PVC exhaust pipes for high-efficiency furnaces should be clear of debris at the exterior termination.
- Inspect the combustion air intake pipe (if present, typically a white PVC pipe entering the furnace) for blockage
- Clear the area around the furnace: no flammable materials within 3 feet, no stored items in contact with the unit
- Vacuum the furnace cabinet base and the return air area to reduce dust entering the system
- Lubricate the blower motor oil ports if present (older direct-drive blowers have oil ports on the motor housing -- add 2-3 drops of SAE 20 non-detergent motor oil). Newer electronically commutated (ECM) blower motors are sealed and require no lubrication.
- Visually inspect the visible portion of the heat exchanger through the burner access panel if visible -- look for rust, cracks, or hole patterns. Any crack in the heat exchanger is a carbon monoxide hazard requiring immediate professional attention.
- Test the furnace: set thermostat to heat mode, raise the setpoint 5 degrees above room temperature, confirm warm air within 3-5 minutes
- Check the condensate drain on high-efficiency (90%+) furnaces -- they produce condensate like an AC and the drain must be clear
- Test the humidifier (if present): flow-through humidifiers need the water panel/evaporator pad replaced annually; drum humidifiers need the drum pad replaced and the reservoir cleaned of mineral scale

**Heat pump -- additional fall/winter tasks:**
- Confirm defrost cycle operation: during heating mode below 40°F, ice buildup on the outdoor unit is normal and should clear in 20-30 minute defrost cycles. If ice covers the entire unit for hours, the defrost board or reversing valve may be malfunctioning.
- Ensure outdoor unit is elevated above typical snow accumulation level in northern climates
- Never operate a heat pump in heating mode below its rated low-temperature threshold (standard heat pumps: minimum 25-30°F; cold-climate heat pumps: rated to -13°F or below)
- Check that the auxiliary/emergency heat strips are operational -- these provide backup heat when outdoor temperatures drop below the heat pump's effective range

### Step 5: Build the Professional Service Checklist

Give the user a detailed checklist of what a professional HVAC tune-up should include so they can evaluate whether the work they paid for was thorough. This also helps users detect unscrupulous contractors who charge for tune-ups without performing them.

**Heating tune-up (fall, approximately 1-1.5 hours on site):**
- Inspect heat exchanger for cracks using inspection camera or chemical smoke test. A cracked heat exchanger allows combustion gases including carbon monoxide into the living space -- this is the most safety-critical check.
- Check flue gas composition: CO levels in flue gas should be below 200 ppm (air-free); CO2 should be 8-10% for natural gas. Elevated CO in the flue indicates combustion problems.
- Verify gas manifold pressure with a manometer: 3.5 inches WC for natural gas, 10-11 inches WC for propane
- Measure temperature rise across the heat exchanger (return air temperature versus supply air temperature). Should fall within the manufacturer's rated range, typically 40-70°F. Too low indicates a heat exchanger problem; too high indicates insufficient airflow.
- Inspect and clean burners. Natural gas burners should burn with a steady, mostly blue flame with small yellow tips. Solid yellow or orange flames indicate incomplete combustion.
- Test and clean the igniter (hot surface igniter normal resistance: 40-90 ohms; outside this range, replace before it fails)
- Test limit switches, pressure switches, and rollout switches
- Inspect and test gas valve operation
- Check heat exchanger flue draft with a draft gauge or smoke match test
- Measure static pressure in the duct system (total external static pressure should be below the air handler's rated maximum, typically 0.5-0.8 inches WC for residential systems)
- Tighten all electrical connections

**Cooling tune-up (spring, approximately 1-1.5 hours on site):**
- Measure refrigerant charge: suction line pressure and temperature are used to determine superheat (for fixed orifice/piston metering devices) or subcooling (for TXV/EEV metering devices). For a standard R-410A system with a piston metering device, target superheat is typically 10-20°F. For TXV systems, target subcooling is typically 8-12°F. Low superheat or subcooling indicates overcharge; high values indicate undercharge.
- Inspect for refrigerant leaks using electronic leak detector or UV dye method
- Clean evaporator coil with no-rinse coil cleaner spray if coil is accessible and dirty
- Clean condenser coil with coil cleaner and rinse
- Test capacitors with a capacitor meter: start and run capacitors degrade over time and should be within 5-10% of rated microfarad value. A failing run capacitor is the most common cause of compressor overheating.
- Test contactor for pitting or burning
- Measure supply and return temperature differential (should be 15-20°F difference indicating proper heat removal)
- Check condensate drain, pan, and float switch
- Measure compressor amperage (should be within nameplate RLA rating)
- Check blower wheel for buildup (a dirty blower wheel reduces airflow significantly -- each blade accumulates debris that disrupts airflow)

**Professional service costs:**
- Furnace tune-up: $80-150 (single stage), $120-180 (two-stage or modulating)
- AC or heat pump tune-up: $100-180
- Combined heating/cooling tune-up: $150-280
- Additional charge for refrigerant: $50-100 per pound for R-410A top-up (note: systems requiring repeated refrigerant additions have a leak that needs to be found and repaired, not just recharged)

### Step 6: Provide Efficiency Optimization Guidance

Quantify the financial impact of each maintenance action so the user understands the return on investment.

- **Filter maintenance:** A clogged filter increases system static pressure, reducing airflow and forcing the blower motor to work harder. A fully clogged 1-inch filter can increase energy consumption by 5-15% and, more critically, cause the evaporator coil to ice over (restricted airflow causes the coil temperature to drop below freezing) or the heat exchanger to overheat and trip the high-limit switch.
- **Condenser coil cleaning:** A dirty condenser coil (outdoor unit) forces the compressor to operate at higher head pressure. A 30% dirty condenser coil increases compressor power consumption by approximately 10-15% and raises compressor discharge temperature, reducing its lifespan. Annual condenser coil rinsing is the best single efficiency action for AC and heat pump systems.
- **Duct leakage:** The average US home loses 20-30% of conditioned air through duct leaks, primarily at joints and connections in unconditioned spaces (attics, crawlspaces, garages). Sealing duct leaks with mastic (preferred) or metal-backed tape (acceptable) -- not standard duct tape, which fails within 1-3 years due to heat cycling -- can reduce HVAC energy costs by 10-30%.
- **Thermostat setbacks:** Setting the thermostat back 7-10°F for 8 hours per day reduces heating and cooling costs by approximately 10% annually. A programmable or smart thermostat pays for itself in 1-2 years in most climates.
- **Evaporator coil cleanliness:** The evaporator coil (indoor cooling coil) accumulates dust, mold, and debris over years. A moderately dirty evaporator coil reduces system capacity by 15-20% and increases energy consumption by 10-15%. This is a professional cleaning task -- the coil is typically only accessible after removing the coil access panel, and no-rinse coil cleaner must be used carefully to avoid flooding the drain pan.
- **Blower motor speed setting:** Many furnace blower motors have multiple speed taps (low, medium, high) or adjustable ECM speeds. The blower should be set so that the temperature rise across the heat exchanger stays within the furnace's rated range. Too slow = overheating; too fast = insufficient heat transfer and cold air complaints.

### Step 7: Provide Noise and Symptom Diagnostics

When the user has a specific complaint, map symptoms to likely causes and triage as DIY versus professional.

**Noise diagnostics:**
- **Banging or booming at startup (gas furnace):** Delayed ignition -- gas is accumulating before igniting, causing a small explosion. This indicates dirty burners, low gas pressure, or a failing igniter. Call a professional. Do not ignore this -- it can crack the heat exchanger over time.
- **Squealing from indoor unit:** Worn belt (older belt-drive blowers, increasingly rare) or failing blower motor bearing. Call a professional -- belts and bearings are serviceable.
- **Squealing or grinding from outdoor unit:** Failing condenser fan motor bearing. Call a professional promptly -- a seized fan motor will overheat the compressor.
- **Clicking at startup (1-3 clicks):** Normal -- this is the igniter or thermostat relay activating.
- **Continuous clicking without ignition:** Failed igniter, failed gas valve, or interrupted pressure switch. Call a professional.
- **Rattling:** Check for loose access panels on the furnace cabinet (tighten screws), debris inside the outdoor unit (turn off power and remove), or loose ductwork. If rattling is internal and cannot be attributed to a panel or debris, call a professional.
- **Hissing from refrigerant lines or indoor unit:** May indicate refrigerant leak. Call a professional immediately -- do not attempt to find or repair refrigerant leaks.
- **Gurgling in a boiler system:** Air trapped in the radiator loop. Bleed the affected radiators (see Edge Cases).

**Performance diagnostics:**
- **Not cooling adequately:** Check filter (clogged?), check that outdoor unit is clear of debris and running, check that all registers are open, check thermostat setting and batteries. If all are normal, call a professional -- low refrigerant charge or failing compressor is likely.
- **Not heating adequately (gas furnace):** Check filter, check that all registers are open, check thermostat. If furnace is running but air feels barely warm, check the temperature rise (put a thermometer in a supply vent and a return vent -- should be 40-70°F warmer at supply). Insufficient rise often means restricted airflow; excessive rise often means a heat exchanger or gas pressure issue.
- **Short-cycling (system turns on and off every few minutes):** Causes include a clogged filter causing the high-limit switch to trip, a refrigerant overcharge or undercharge causing the pressure switch to trip, a failing capacitor, or an oversized system. Replace the filter first; if short-cycling continues, call a professional.
- **High energy bills without a change in behavior or weather:** Compare current bill to the same month the prior year. If bills are more than 15-20% higher, check the filter first, then compare thermostat settings, then schedule a professional tune-up. Significant efficiency drops often indicate refrigerant loss, dirty coils, or a failing component.
- **Uneven temperatures between rooms:** Check that all supply registers are open, check for furniture blocking returns, check for obvious duct disconnections in accessible areas (attic, crawlspace). Persistent imbalance warrants a professional airflow analysis.

### Step 8: Address Component Replacement Planning

Help the user understand when repair becomes uneconomical and how to plan for replacement costs.

- **The 50% rule:** If a single repair costs more than 50% of the replacement cost of the equipment, replacement is typically more economical, especially for systems over 10 years old. Example: a $1,400 compressor replacement on a 14-year-old AC unit with a replacement cost of $3,500-5,000 for the outdoor unit alone often tips toward replacement.
- **Age-adjusted repair thresholds:** New (under 5 years) -- repair almost always; 5-10 years -- repair unless cost exceeds 40% of replacement; 10-15 years -- repair only if under 25% of replacement cost; over 15 years -- budget for replacement, repair only minor items.
- **Efficiency improvements from replacement:** A 20-year-old gas furnace typically operates at 80% AFUE (Annual Fuel Utilization Efficiency). A modern high-efficiency furnace operates at 96-98% AFUE. For a home with $1,500/year in heating costs, upgrading from 80% to 96% AFUE saves approximately $250/year, providing roughly 10-12 year payback on the efficiency premium (not the full equipment cost).
- **SEER2 context for AC:** Older AC units manufactured before 2006 may be SEER 10 or below. Modern minimum is SEER2 14.3 (13 SEER by old measurement, effective January 2023 in northern US). High-efficiency units reach SEER2 22+. Upgrading from SEER 10 to SEER2 18 reduces cooling energy consumption by approximately 44%.
- **Budget ranges for replacement (residential, including installation):** Gas furnace -- $3,000-7,000 (standard efficiency) to $4,500-9,000 (high efficiency, 96%+ AFUE); central AC (outdoor unit and coil only) -- $3,500-7,000; full AC system replacement -- $5,000-12,000; heat pump system -- $5,000-12,000; mini-split (1 zone) -- $3,000-6,000 installed; boiler -- $5,000-12,000

---

## Output Format

Produce the following structured plan. Omit sections not applicable to the user's specific system type.

```
## HVAC Maintenance Plan

**System:** [system type, fuel type, estimated age, condition category]
**Location:** [climate context if mentioned -- heating-dominated, cooling-dominated, mixed]
**Filter:** [filter type, size, MERV rating if known]
**Household factors:** [pets, allergy sufferers, smokers, recent renovation if applicable]

---

### Filter Schedule

| Filter Type | Dimensions | Replace/Check Interval | Cost per Filter | Annual Cost Estimate |
|-------------|------------|----------------------|----------------|----------------------|
| [type] | [e.g., 16x25x1] | [interval with rationale] | $[range] | $[annual estimate] |

**Filter replacement procedure:**
1. [Step with specific instructions]
2. [Step with specific instructions]
3. [Step with specific instructions]

**Warning signs that indicate a bigger problem during filter check:**
- [Specific finding and what it means]
- [Specific finding and what it means]

---

### Seasonal DIY Maintenance Checklist

#### Spring Startup (Target: March-April)
**Estimated total time: [X] minutes**

- [ ] [Task name] -- [estimated time] -- [specific how-to instructions]
  - Tools needed: [tools, if any]
  - ⚠ Call a professional if: [specific failure sign]

[repeat for each task]

#### Fall Startup (Target: September-October)
**Estimated total time: [X] minutes**

- [ ] [Task name] -- [estimated time] -- [specific how-to instructions]
  - Tools needed: [tools, if any]
  - ⚠ Call a professional if: [specific failure sign]

[repeat for each task]

---

### Professional Tune-Up Guide

**Recommended frequency:** [schedule based on system type and age]
**Expected cost:** $[range]
**What to expect:** [duration and general scope]

#### What the Technician Should Do -- [Heating or Cooling]
1. [Task with detail of what it involves and why it matters]
2. [Task with specific measurement or outcome to verify]
[... continue for all applicable tasks]

#### Red Flags During Professional Service
- [Sign that technician is being thorough vs. superficial]
- [Sign that a recommendation is legitimate vs. upsell]
- [Specific measurement that should be documented and given to you]

---

### Symptom Diagnostic Guide

[Include only if user reported a specific complaint]

| Symptom | Likely Cause(s) | DIY Check | Professional Needed? |
|---------|----------------|-----------|---------------------|
| [symptom] | [cause] | [DIY step] | [Yes/Maybe/Unlikely] |

---

### Efficiency Optimization Actions

| Action | Why It Works | Estimated Savings | Cost to Implement | Priority |
|--------|-------------|------------------|-------------------|----------|
| [action] | [mechanism] | [% or $/year] | $[cost or $0] | High/Medium/Low |

---

### Component Lifespan and Replacement Planning

| Component | Expected Lifespan | Your System Age | Status | Action |
|-----------|------------------|-----------------|--------|--------|
| [component] | [lifespan range] | [age or unknown] | [OK / Monitor / Plan / Urgent] | [specific guidance] |

**Repair vs. Replace Guidance:**
- Current system age: [age]
- Estimated replacement cost: $[range]
- Maximum advisable single repair: $[50% threshold]
- Recommended budget timeline: [year range to budget for replacement]

---

### Maintenance Cost Summary

| Item | Frequency | Annual Cost |
|------|-----------|-------------|
| Filters | [interval] | $[range] |
| Professional tune-up(s) | [frequency] | $[range] |
| Estimated minor DIY supplies | Annual | $15-40 |
| **Total estimated annual maintenance cost** | | **$[range]** |

**Cost of neglect comparison:** [Specific dollar comparison: e.g., $X/year in maintenance vs. $Y,000 in premature compressor or heat exchanger failure]
```

---

## Rules

1. **Never instruct homeowners to work with refrigerant under any circumstances.** Refrigerant handling requires EPA Section 608 certification. Instructing a homeowner to add refrigerant, check refrigerant pressure using their own gauges, or attempt to repair refrigerant leaks is dangerous, illegal without certification, and harmful to the environment. The correct answer is always "call a licensed HVAC technician."

2. **Never instruct homeowners to work with gas connections, gas valves, or burner assemblies.** Gas line work requires permits and licensed contractors in virtually all jurisdictions. Even a visual check of a gas valve is outside homeowner scope -- the only gas-related DIY task is knowing how to shut off the gas at the meter shutoff valve in an emergency.

3. **Never instruct homeowners to disassemble, probe, or test heat exchangers** beyond a visual inspection through the access panel. Heat exchanger cracks allow carbon monoxide to enter the living space. If there is any suspicion of a cracked heat exchanger (visible cracks, CO detector triggering, soot on the furnace exterior), the system must be shut off and a professional called immediately.

4. **Always specify filter MERV rating alongside replacement interval.** A MERV 6 filter and a MERV 13 filter have wildly different replacement intervals, costs, and system pressure impacts. Giving a filter replacement interval without a MERV rating is incomplete guidance.

5. **Do not recommend MERV 14 or higher filters for standard 1-inch filter slots without a strong caveat.** MERV 14+ filters have a significantly higher pressure drop that can restrict airflow below the system's design minimum, causing evaporator coil icing, blower motor overheating, and heat exchanger high-limit trips. Only recommend MERV 14+ if the user has confirmed their system uses a 4-inch or 5-inch media filter cabinet designed for high-static filtration.

6. **Always tie maintenance tasks to the specific system type.** Condensate drain cleaning only applies to AC systems, heat pumps, and high-efficiency gas furnaces -- not standard-efficiency furnaces. Blower belt lubrication only applies to older belt-drive blowers. Radiator bleeding only applies to hot-water boiler systems. Generic checklists that include inapplicable tasks create confusion and erode user trust.

7. **When a user reports CO detector activation, gas smell, or burning electrical smell, stop the maintenance conversation and prioritize safety response.** These are emergency conditions. Instruct the user to leave the home, call 911 or the gas utility, and not return until cleared by emergency services. Do not continue with maintenance guidance until safety is confirmed.

8. **Always include the "call a professional if" trigger for every DIY task.** The goal is not to prevent the user from doing DIY maintenance -- it is to give them the decision criteria to recognize when a task has revealed a condition beyond their scope. A user who cleans the condenser coil and notices refrigerant oil stains on the lines needs to know that this indicates a refrigerant leak requiring professional service.

9. **Never recommend specific brand names for filters, equipment, or thermostats.** MERV rating, filter dimensions, and system compatibility specifications are the correct guidance. Brand recommendations introduce liability and quickly become outdated as product quality changes.

10. **Use accurate cost ranges based on national US averages, and acknowledge regional variation.** HVAC labor costs vary significantly by region -- a furnace tune-up in rural Iowa may cost $80, while the same service in the San Francisco Bay Area may cost $200. When giving cost ranges, note that the user should get multiple quotes and that prices vary by region, market conditions, and contractor quality.

11. **Acknowledge warranty implications of DIY maintenance.** Most residential HVAC equipment comes with a manufacturer's warranty (typically 5-10 years on parts, with registration extending compressor warranties on some brands). Some warranties require annual professional maintenance to remain valid. Instruct users to check their warranty documentation before skipping professional service.

12. **For any system over 15 years old, frame maintenance as "protect the remaining life and plan for replacement" rather than "invest heavily in restoration."** A $500 repair to coax another year out of a 22-year-old furnace may be reasonable; a $2,000 repair on the same system is not.

---

## Edge Cases

### Case 1: Unknown System -- User Cannot Identify Their Equipment
Some homeowners, particularly renters or new buyers, may not know what type of system they have or where the equipment is located.

- Guide the user through identification systematically: (1) Is there a forced-air vent system with a thermostat? If yes, locate the indoor air handler or furnace cabinet (often in basement, utility closet, attic, or garage). (2) Is there a flue pipe (metal chimney or PVC pipe) exiting through the wall or roof near the mechanical unit? If yes, it is a furnace (gas or oil). (3) Does the outdoor unit run in winter? If yes, it is a heat pump. (4) Are there radiators or radiant floor panels? If yes, it is a boiler system. (5) Are there wall-mounted or ceiling cassette units in individual rooms? If yes, it is a mini-split.
- If the user cannot identify the system, recommend they take photos of the indoor unit's data plate, the outdoor unit's data plate, and the thermostat, and search the model numbers online or consult a local HVAC contractor for a system assessment ($50-100 in most markets).
- Without system identification, provide only universal guidance: change or check the filter if one exists, keep clearances around outdoor equipment, test the system before each season, and schedule professional service.

### Case 2: No Filter Accessible or No Filter Present
Running an HVAC system without a filter is a common neglect scenario that causes expensive damage.

- Guide the user to locate the filter slot by tracing the largest duct from the indoor unit back to the largest vent, which is typically the return air grille. Filter slots are either at the return air grille or inside the furnace/air handler cabinet on the inlet side.
- If no filter slot is found and the system uses forced air, there may be a central return air filter grille -- look for a large louvered vent (typically 16x20 inches or larger) that is hinged or removable, usually in a hallway, stairwell, or central area of the home.
- If absolutely no filter is present and the system has been running without one: the evaporator coil and blower wheel are likely coated with dust and debris. This is a professional cleaning situation -- a severely dirty evaporator coil requires coil cleaner applied by a technician, and the blower wheel may need to be removed and washed. The cost for professional coil and blower cleaning is typically $150-400.
- Install a filter as soon as the slot is identified. Measure the existing filter frame for dimensions if a filter is found, or measure the filter slot opening. Order the closest standard size (standard sizes: 16x20x1, 16x25x1, 20x20x1, 20x25x1, 14x20x1).

### Case 3: Hot-Water Boiler System (No Air Filter)
Boiler systems are fundamentally different from forced-air systems, and the entire maintenance approach changes.

- No air filter to replace. The maintenance focuses on the water loop and heat distribution.
- **Boiler pressure:** System pressure on the pressure gauge should read 12-15 psi cold. Below 12 psi, the low-water cutoff may prevent operation. Add water through the manual fill valve (typically a lever handle on the cold water supply line feeding the boiler) until pressure reaches 15 psi. Above 25 psi hot, the pressure relief valve may discharge -- this indicates a failed expansion tank or fill valve problem requiring professional service.
- **Expansion tank:** A waterlogged expansion tank causes the pressure relief valve to discharge repeatedly. Test by tapping the tank -- a properly functioning tank sounds hollow in the upper half. A waterlogged tank sounds solid throughout. Expansion tank replacement is a professional task ($150-400 parts and labor).
- **Bleeding radiators:** Air accumulates at the top of radiators and prevents them from heating fully. Bleed each radiator annually (typically in fall): Use a radiator bleed key (sometimes a flathead screwdriver on modern valves), turn the bleeder valve counterclockwise 1/4 turn, hold a cloth below to catch water, wait until a steady stream of water flows with no sputtering air, then close the valve. Bleed the radiators farthest from the boiler first. After bleeding all radiators, check boiler pressure and add water if needed to restore to 12-15 psi.
- **Annual professional boiler service ($150-300):** Technician should: inspect burners and heat exchanger, check flue draft and combustion gases, clean heat exchanger surfaces, test safety controls (pressure relief valve, low-water cutoff, aquastat), check circulator pump operation, and test expansion tank.
- **Steam boiler (subset):** Steam boilers operate at 1-3 psi (much lower pressure than hot water). The water glass (sight glass) should show water at half-full when the boiler is cold. Steam boilers also require annual blowing down of the low-water cutoff float chamber to remove sediment.

### Case 4: Mini-Split Ductless System
Mini-splits have unique maintenance requirements distinct from ducted forced-air systems.

- **Indoor air handler filters:** Each indoor unit has a washable filter (typically a thin foam or mesh filter behind the front panel). Wash monthly during the cooling season and every 2-3 months during heating season. Open the front panel, slide out the filter, wash with warm water and mild soap, rinse, air dry completely, reinstall. If filters are neglected, the evaporator coil behind the filter accumulates a dense layer of biological growth (mold, mildew) that requires professional coil cleaning.
- **Indoor coil and blower wheel:** Even with regular filter cleaning, the indoor coil and scroll fan wheel accumulate mold and biofilm over 2-3 years. Symptoms: musty smell when unit turns on, reduced airflow, visible mold on the air outlet louvers. Professional cleaning (disassembling the indoor unit and washing the coil and wheel) costs $100-200 per head and should be done every 2-3 years in humid climates or 3-5 years in dry climates.
- **Outdoor unit maintenance:** Same as central AC -- keep clear of debris, rinse coil fins annually, check that drainage holes at the base of the unit are not clogged.
- **Condensate drainage:** Mini-split indoor heads drain via a small drain line (typically 3/4-inch PVC or vinyl tubing) running through the wall. This drain line can develop algae or become blocked. Flush annually by pouring 1/4 cup of vinegar into the condensate drain port (if accessible) or calling a professional to flush the drain with compressed air.
- **Multi-zone systems:** If one zone loses performance while others work normally, the issue is most likely that zone's indoor unit (dirty coil, blocked drain, failing fan) rather than the outdoor unit or refrigerant charge.

### Case 5: System Making Unusual Noises -- Noise Diagnostic Pathway
When a user leads with a noise complaint, prioritize the diagnostic before building a maintenance plan.

| Noise | Likely Source | DIY Resolution? | Urgency |
|-------|--------------|-----------------|---------|
| Banging/boom at furnace startup | Delayed ignition -- gas accumulating | No -- call professional | High |
| Squealing from indoor unit | Blower belt (old system) or motor bearing | No -- call professional | Moderate |
| Grinding from outdoor unit | Condenser fan motor bearing | No -- call professional promptly | High |
| Rattling from furnace cabinet | Loose access panel, loose screws | Yes -- inspect and tighten screws | Low |
| Rattling from outdoor unit | Debris inside unit | Yes -- power off, remove debris | Low |
| Hissing from refrigerant lines | Refrigerant leak | No -- call professional | High |
| Continuous clicking (no ignition) | Igniter, gas valve, pressure switch | No -- call professional | Moderate |
| Gurgling in boiler pipes | Air in hot-water loop | Yes -- bleed radiators | Low-Moderate |
| Popping/banging from ductwork | Thermal expansion, undersized ducts | Partially -- duct reinforcement if recurring | Low |
| Bubbling/gurgling from AC drain pan | Clogged condensate drain | Yes -- clear drain | Moderate |

For any noise involving potential gas leak, CO risk, or refrigerant hissing: do not proceed with DIY. Address safety first.

### Case 6: Very Old System (20+ Years)
A different framing is required for systems at or past their expected service life.

- **Expected lifespans:** Gas furnace 15-25 years; central AC 12-17 years; heat pump 12-15 years; hot-water boiler 15-30 years; steam boiler 25-50 years (cast iron sections); mini-split 12-20 years
- **Decision framework:** For a 22-year-old gas furnace, calculate: replacement cost ($4,000-8,000) × 50% = $2,000-4,000 maximum advisable repair investment. If the required repair exceeds this threshold -- or if the system has required 2-3 significant repairs in the past 2-3 years -- replacement is economically superior.
- **Efficiency gap:** A 20-year-old furnace likely has an 80% AFUE rating. A modern 96% AFUE furnace on a $1,800/year heating bill saves approximately $270/year -- a 10-year payback on the efficiency premium. The payback is faster in cold climates with high heating loads.
- **R-22 refrigerant consideration:** AC systems manufactured before 2010 may use R-22 refrigerant, which was phased out under EPA regulations. R-22 is now only available as reclaimed refrigerant and costs $100-200+ per pound compared to $30-50/lb for R-410A. A low R-22 system with a leak becomes uneconomical to recharge -- replacement with a modern R-410A or R-32 system is typically the right choice.
- **Safety note for old furnaces:** Older furnaces warrant a professional heat exchanger inspection every 1-2 years rather than every 3-5 years. A cracked heat exchanger in a furnace that has many remaining structural years otherwise can still present a dangerous CO poisoning risk.
- **Maintenance advice for aging systems:** Maintain filters diligently to reduce strain on the blower, keep the condenser clean to reduce compressor strain, but do not invest in duct sealing or insulation upgrades if system replacement is imminent -- save that investment for post-replacement, when new equipment will benefit from the efficiency improvement.

### Case 7: Musty or Burning Smell From HVAC System
Smell complaints require triage before maintenance guidance.

- **Musty smell (mildew-like):** Almost always indicates biological growth on the evaporator coil or in the ductwork. Causes: (a) evaporator coil is dirty and the drain pan is holding water, allowing mold growth; (b) condensate drain is slow and the pan intermittently floods; (c) ductwork has been exposed to moisture from a leak, flood, or extreme condensation. Solution sequence: (1) Replace the air filter immediately. (2) Check and clear the condensate drain. (3) Schedule professional evaporator coil cleaning ($150-350). (4) If smell persists after coil cleaning, consider a professional duct inspection for moisture intrusion.
- **Burning smell at first start of heating season:** Normal for up to 30 minutes -- dust on the heat exchanger and burners burning off at the start of the first heating cycle. If it persists beyond 30-60 minutes or recurs throughout the season, it indicates accumulated debris or a dirty heat exchanger requiring professional cleaning.
- **Burning plastic or electrical smell:** Shut the system off immediately at the thermostat and breaker. This indicates an electrical fault -- a failing blower motor, burned wiring insulation, a failing capacitor, or a failing control board. Call an HVAC technician. Do not restart the system.
- **Rotten egg / sulfur smell:** Gas leak. Do not use any electrical switches. Leave the home immediately. Call the gas utility or 911 from outside. This is an emergency, not a maintenance situation.
- **Oil smell (oil furnace systems):** Indicates incomplete combustion, a cracked heat exchanger, or a fuel leak. Call a licensed oil-burner technician promptly.

---

## Example

**Input:** "We just bought a house. It has a gas furnace and a central air conditioner, both about 12 years old. I think it uses a standard 1-inch filter. We have two dogs. One family member has seasonal allergies. I have no idea when they were last serviced. What do I need to do?"

**Output:**

---

## HVAC Maintenance Plan

**System:** Natural gas furnace + central AC (separate refrigerant system, shared ductwork), estimated 12 years old (aging end of mid-life -- approaching replacement window)
**Climate assumption:** Mixed heating/cooling climate (adjust if you are in a primarily heating or cooling climate)
**Filter:** 1-inch disposable -- recommendation below
**Household factors:** Two dogs (high particulate load), allergy sufferer (requires MERV 11 minimum)
**Service history:** Unknown -- treat as deferred maintenance and prioritize professional inspection this fall

---

### Step One: Do This Immediately (Before Seasonal Startup)

Because service history is unknown on a purchased home, the first priority is establishing a baseline and catching any deferred maintenance issues.

1. Locate the filter and check its condition. On a just-purchased home with unknown maintenance history, the filter may be severely clogged. Find the filter slot (either at the large return air vent, typically in a hallway, or inside the furnace cabinet). Pull the filter and inspect it. If it is dark grey or black on the dirty side, replace it immediately regardless of any schedule. Write the installation date on the new filter.
2. Locate the data plates on both the furnace and the outdoor AC unit. Take photos of the model and serial numbers. The serial number typically encodes the manufacture date -- your HVAC technician can confirm exact age, and some home warranty companies require this information.
3. Schedule a combined professional heating/cooling tune-up ($150-280). Given unknown service history on a 12-year-old system, a full assessment by a technician before the next heating season is the highest-value single action you can take. Do not skip this based on budget -- a cracked heat exchanger or failed capacitor discovered now is far cheaper than an emergency service call in January.

---

### Filter Schedule

| Filter Type | Dimensions | Replace Interval | Cost per Filter | Annual Cost Estimate |
|-------------|------------|-----------------|----------------|----------------------|
| 1-inch disposable, MERV 11 | [Confirm your size -- likely 16x25x1 or 20x25x1] | Every 45 days | $12-20 | $97-163 |

**Rationale for these specifications:**
- MERV 11 (not MERV 8): Your allergy sufferer needs MERV 11 minimum. MERV 11 captures particles as small as 1 micron, including pet dander, mold spores, and most pollen.
- 45-day interval: Base 90-day interval, reduced by 30 days for two dogs (high dander and fur load), which brings this to approximately 45-60 days. Start at 45 days; after 2-3 replacements, examine the filter at 45 days -- if it is only moderately grey, you can extend to 55-60 days.
- Do not use MERV 13+ in a standard 1-inch slot. The pressure drop is too high for most residential blowers and will reduce airflow, potentially causing the evaporator coil to ice over.

**Filter replacement procedure:**
1. Turn the thermostat to OFF (do not just lower the setpoint -- actually switch the system mode to off).
2. Locate the filter at the return air grille or inside the furnace cabinet at the inlet side.
3. Slide out the old filter and note the dimensions printed on the cardboard frame (e.g., 16x25x1). This is your exact filter size.
4. Note the arrow on the new filter's frame. This arrow must point toward the furnace (in the direction of airflow). Installing a filter backward significantly reduces its effectiveness.
5. Slide in the new filter. The fit should be snug with no visible gaps around the edges.
6. Write today's date on the filter frame with a permanent marker. Set a phone reminder for 45 days.
7. Place the old filter directly into a trash bag and seal it -- this prevents captured pet dander from re-entering the air.

**Warning signs during filter changes:**
- Filter is soaking wet: indicates a condensate drain problem -- check and clear the drain pan and drain line before the next cooling season
- Black mold visible on the filter or inside the filter slot: indicates biological growth in the ductwork or on the coil -- schedule professional coil inspection
- No filter present at all: the evaporator coil and blower wheel likely need professional cleaning ($200-400) -- schedule this at your upcoming tune-up

---

### Seasonal DIY Maintenance Checklist

#### Spring Startup (Target: Late March to April, Before First Hot Day)
**Estimated total time: 45-
