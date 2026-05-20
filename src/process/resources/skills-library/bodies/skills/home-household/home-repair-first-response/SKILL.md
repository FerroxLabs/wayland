---
name: home-repair-first-response
description: |
  Provides immediate triage guidance for common home emergencies including burst
  pipes, power outages, gas leaks, roof leaks, flooding, no heat in winter, and
  appliance failures. Focuses on what to do in the first 15 minutes to minimize
  damage before a professional arrives. Use when the user has an active home
  emergency, a sudden failure of a major system, or needs to know what to shut
  off and who to call. Do NOT use for routine maintenance (use annual-home-maintenance
  or specific system skills), non-emergency troubleshooting, or commercial building
  emergencies.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-maintenance troubleshooting guide"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Home Repair First Response

## When to Use

Use this skill when the user has an active, time-sensitive home emergency where the first 15--30 minutes of response directly determine the scale of physical damage, safety risk, or repair cost.

**Use this skill when:**
- Water is actively spraying, flowing, or pooling in the home from a burst pipe, failed fitting, overflowing fixture, or appliance supply line
- The user smells natural gas or propane anywhere inside the home or immediately adjacent to the exterior
- The user has no heat during freezing temperatures (below 32°F outdoor ambient) and cannot restore it within the next hour
- A circuit breaker, outlet, or electrical panel is sparking, emitting a burning smell, or producing visible smoke
- An active roof leak is allowing water into the living space during a storm
- Sewage is backing up through drains, toilets, or floor drains
- A water heater, washing machine, refrigerator ice maker line, or dishwasher supply line has failed and is actively flooding a space
- A tree, wind, or impact has compromised the building envelope (broken window, door, or section of roof or wall) during a severe weather event
- The user asks "what do I do right now" about a sudden system or appliance failure

**Do NOT use this skill when:**
- The user has a routine maintenance question (use the `annual-home-maintenance` skill instead)
- The user wants to plan or schedule a repair that is not urgent (use system-specific maintenance skills)
- The user smells gas AND reports dizziness, headache, nausea, or confusion -- this is a life-threatening emergency requiring immediate 911 contact and evacuation, not a troubleshooting conversation
- The user is dealing with a structural collapse, fire, or active flooding from an external body of water (river, storm surge) -- call 911 immediately; these are public emergency situations beyond first-response triage
- The user is in a commercial building, multi-tenant industrial space, or facility with a building engineer on call (institutional protocols supersede this guidance)
- The emergency has already passed and the user needs help planning remediation or repairs (use water-damage-remediation, mold-assessment, or insurance-claim skills)
- The user needs HVAC-specific deep diagnostics for a non-emergency heating situation (use the `hvac-troubleshooting` skill)

---

## Process

### Step 1: Classify the Emergency Type and Severity

Before giving any guidance, determine the specific emergency type. The wrong first instruction can cause injury or dramatically worsen damage.

- **Ask one clarifying question if necessary** to distinguish between emergency classes (e.g., "Is there standing water near any electrical outlets or appliances?" or "Do you smell anything burning?")
- Map the situation to one of six primary categories: (1) Water/Plumbing, (2) Gas, (3) Electrical, (4) Thermal/HVAC, (5) Structural/Roof, (6) Sewage/Drain
- Identify whether a life-safety threat is present -- gas, electricity in standing water, structural instability, or carbon monoxide are all evacuation-first scenarios
- Note the time of day and day of week -- emergency service pricing is 40--80% higher on nights (after 5pm), weekends, and holidays; this affects the call-vs-wait decision
- Note whether the user is a homeowner or tenant -- tenants have different action priorities and legal obligations (notify landlord immediately, mitigate damage, document everything)
- Ask whether vulnerable occupants are present: infants, elderly, or medically dependent individuals change the urgency threshold dramatically (no heat with an infant at home requires immediate escalation)

### Step 2: Deliver the First-5-Minutes Protocol

The first 5 minutes are not about diagnosis -- they are about stopping the bleeding. Provide a numbered, sequential list of immediate actions.

- **Water emergencies:** Identify the correct shutoff level -- fixture shutoff (under sink, behind toilet), appliance shutoff (behind washer, behind refrigerator, at water heater), zone shutoff (if present), or main building shutoff. Never instruct the user to search for a downstream shutoff if the main is faster and accessible.
- **Gas emergencies:** The protocol is non-negotiable -- no switches, no phones indoors, no flames, evacuate immediately, call from outside. There is no first-5-minutes mitigation for a gas leak other than evacuation.
- **Electrical emergencies:** Determine whether the threat is isolated (single outlet or appliance) or systemic (panel, burning smell, unknown source). Isolated: unplug or turn off that circuit. Systemic: shut off the main breaker if the panel is safe to approach, otherwise evacuate and call the power company.
- **Heat emergency (freezing weather):** Prioritize pipe freeze prevention immediately -- open cabinet doors under sinks, allow faucets to drip (cold side, 1--2 drops per second is sufficient), identify which pipes are most exposed (exterior walls, garage, crawlspace, unheated basement)
- **Roof leak:** Stop interior water spread first (bucket, tarp indoors under the leak), then assess whether attic access is safe to apply a temporary interior barrier
- **Sewage backup:** Stop all water use in the building immediately -- flushing, running faucets, laundry, dishwasher all add volume to a backed-up system

### Step 3: Locate the Shutoffs

The most common reason a minor emergency becomes a major one is that the occupant cannot find the shutoff quickly. Provide location guidance specific to home type.

- **Main water shutoff (basement or crawlspace home):** On the interior wall that faces the street, typically within 3--5 feet of where the supply pipe enters the foundation. Look at floor height -- the shutoff is usually within 12 inches of the floor. Two valve types: gate valve (round wheel handle, turn clockwise many rotations to fully close -- can be stiff if rarely used) or ball valve (lever handle, fully closed when perpendicular to the pipe -- quarter turn).
- **Main water shutoff (slab-on-grade home):** Often in a utility closet, near the water heater, near the washer/dryer, or near the front exterior wall. Some slab homes only have a street-side shutoff at the meter box.
- **Street-side shutoff (meter box):** Located at the curb or property line, in a covered in-ground box. Most require a meter key (T-shaped tool, $10 at hardware stores) but a large adjustable crescent wrench can work on many. The utility company can shut this off if the homeowner cannot.
- **Gas shutoff:** Each gas appliance has an individual shutoff on the supply line within 6 feet of the appliance (lever handle, perpendicular = closed). The main gas shutoff is on the gas meter outside the house -- requires a wrench to turn the square nut 90 degrees. Once shut at the meter, only the gas company can restore service (they will require an inspection before turning it back on).
- **Electrical main breaker:** At the top of the breaker panel, usually a double-pole breaker larger than the individual circuits. In older homes, the main disconnect may be a separate fused disconnect outside near the meter. If the panel is a Federal Pacific Stab-Lok or Zinsco (common in homes built 1950--1990) -- identifiable by the brand name on the panel door -- breakers may not trip reliably; treat any electrical emergency in these homes as higher risk.
- **HVAC shutoff:** Each furnace, air handler, and boiler has a power switch within sight of the unit (looks like a standard light switch on the wall). Gas furnaces also have a gas shutoff valve on the supply line.

### Step 4: Assess Damage and Prioritize Containment

Once the source is stopped, shift to limiting how far the damage spreads. The 30-minute window after shutoff determines the scope of the restoration bill.

- **Water spread assessment:** Water moves horizontally on hard floors faster than expected, wicks vertically up drywall at approximately 1 inch per hour, and moves through porous materials (wood subfloor, carpet padding, insulation) invisibly. The affected area is almost always larger than it appears.
- **Standing water removal priority:** Get water off the floor within 2 hours to prevent subfloor saturation. Tools in order of effectiveness: submersible utility pump ($40--80 rental, moves 30+ gallons per minute) → wet/dry vacuum (slower but effective for small areas) → towels and buckets (last resort). A standard wet/dry vacuum holds 5--6 gallons; a utility pump draining to the exterior is 10x faster for large volumes.
- **Drywall moisture entry point:** Water entered your wall cavities if the wall was wet for more than 30 minutes. Press the lower 12 inches of drywall -- if it feels soft or has a hollow sound when tapped, it has absorbed water. Saturated drywall cannot be dried in place effectively below 24 inches from the floor. Early extraction of the first 6--12 inches ("flood cut") saves the rest of the wall.
- **Furniture and contents protection:** Elevate furniture off wet floors immediately -- place furniture risers, aluminum foil squares, or wood blocks under legs to prevent wood staining and rust bleed from metal feet onto carpets. Wet upholstered furniture begins developing odor within 12 hours.
- **Electrical safety during water events:** Any outlet, appliance, switch, or panel within the affected water zone must be assumed energized until confirmed off. Do not enter standing water if you are unsure whether electricity is off. Use a non-contact voltage tester ($15--25) if available.

### Step 5: Document Before You Clean

Insurance documentation must happen before any cleanup begins. This step is always in the first 30 minutes, not after.

- **Video walk-through first:** A continuous video from door to damage with narration ("this is the basement, the water line here is about 4 inches on the east wall, this is the damaged pipe") is more valuable than individual photos. Do a full room pan before approaching the damage.
- **Photograph specific items:** Pipe break location and type, water line height on walls (put a ruler next to it), all damaged contents (move items to show them fully), water heater serial number tag (for age/warranty claims), any structural damage (buckled floors, wet insulation visible through a wall).
- **Time-stamp everything:** Your phone photos are automatically time-stamped. If using a separate camera, note the time in the video. Insurance adjusters use time stamps to verify the timeline of events and your response.
- **Do not discard any damaged items** until the insurance adjuster has seen them in person or you have explicit written permission from the insurer. Premature disposal of damaged property is one of the most common reasons claims are partially denied.
- **Note the meter reading:** For water loss claims, a before/after water meter reading proves the volume of water involved. Read and photograph your water meter immediately after shutoff.

### Step 6: Make the Right Calls in the Right Order

The sequence of calls matters -- the wrong call first wastes time during the critical window.

- **Call order for water emergency:** (1) Emergency plumber to fix the source, (2) Water damage restoration company for extraction/drying (many operate 24/7; calling them within the first hour versus the next morning can mean $5,000+ difference in final damage scope), (3) Insurance company to open a claim (within 24 hours is the standard requirement; doing it the same day is better).
- **Call order for gas emergency:** (1) 911 if anyone has symptoms, (2) Gas utility emergency line (printed on your bill, available 24/7, usually dispatches within 30--60 minutes), (3) Do not call a plumber or HVAC tech -- the utility company must clear the scene first, then you can engage repair contractors.
- **Call order for electrical emergency:** (1) Power company if the panel is inaccessible or there is smoke from the meter/service entrance, (2) Licensed electrician for any internal panel issue, burning smell, or wiring problem.
- **What to say to an emergency plumber:** State three things immediately -- what you have (burst pipe, flooding water heater, etc.), what you have already done (main shutoff is off), and what the access situation is (basement with exterior access, apartment on floor 4). This lets them prepare materials and equipment before arrival.
- **What to say to a restoration company:** Mention the water source type (clean water from supply pipe, gray water from appliance drain, black water from sewage) -- this determines the crew's protective equipment, pricing tier, and urgency. Clean water (Category 1) is the least costly. Gray water (Category 2) from appliances or toilet overflow requires moderate protective measures. Black water (Category 3) from sewage requires full PPE and hazmat protocols.

### Step 7: Temporary Mitigation While Waiting

Active steps the occupant can take between the shutoff and the professional's arrival that genuinely reduce the final damage scope.

- **Air movement for water events:** Every fan in the house pointed at wet areas. Ceiling fans on high. Box fans aimed at wet walls at floor level. Open windows if outdoor temperature is above 55°F and outdoor humidity is below 60%. Do NOT run HVAC in heating or cooling mode through wet ducts -- this spreads moisture and can cause mold to colonize the duct system.
- **Dehumidifier deployment:** A standard residential dehumidifier (30--50 pint) removes 1.5--2 gallons of water from the air per day -- helpful but not fast enough alone. Industrial dehumidifiers used by restoration companies remove 100+ pints per day. If the affected area is more than 200 square feet, a residential unit is insufficient on its own.
- **Roof leak tarping (interior):** Place a tarp or heavy plastic sheeting in the attic to divert water to a single collection point with a bucket. Use rope, tape, or staples to form a trough toward the lowest point. Do NOT walk on a wet, dark, or unfamiliar attic in emergency conditions -- ceiling joists are typically 16 or 24 inches on center, and stepping between them means falling through the ceiling.
- **Roof tarping (exterior):** Only if the occupant is experienced with roof work and conditions are safe (no active lightning, no steep pitch, no wet surfaces). A proper emergency tarp installation uses 1x4 lumber screwed through the tarp grommets to keep it from wind-lifting. Tarp must extend 3 feet past the ridge to prevent wind-driven water from getting under it.
- **Heat emergency pipe protection:** If heat is lost and outdoor temperature is below 20°F, the critical pipe-freeze threshold for interior pipes (even in conditioned space) can be reached within 6--12 hours depending on insulation quality. Supplemental heat sources: portable electric space heaters in the most vulnerable rooms (near exterior walls, in bathrooms on exterior walls). Keep garage doors closed. Open kitchen and bathroom cabinet doors under all sinks on exterior walls.
- **Sewage backup protection:** Wet sewage is a Category 3 biohazard. Do not allow children or pets near backed-up water. Wear rubber gloves and eye protection if you must remove items from the affected area. Do not use a shop vacuum on sewage water -- the filters cannot contain the pathogens and you will aerosolize them. Ventilate the space, then quarantine it until a professional arrives.

### Step 8: Deliver the After-Emergency Checklist

Once the acute emergency is resolved, a structured follow-up checklist prevents the most common post-emergency mistakes.

- **72-hour drying verification:** Wet drywall, subfloor, and framing lumber must reach below 16% moisture content (measured with a pin-type moisture meter, $25--50) within 72 hours to reliably prevent mold growth. Professional restoration crews use these readings to determine when to remove drying equipment.
- **Mold monitoring at 5 and 14 days:** Inspect all previously wet areas for visual mold, musty odor, or staining. Mold can colonize invisible surfaces (back of drywall, inside wall cavities, underside of subfloor) before it is visible from the room side.
- **Pipe-freeze follow-up:** After a freeze-caused burst is repaired, inspect all plumbing in unheated areas within 2 weeks. Pipe insulation sleeves (foam pipe wrap, R-value 0.5 per inch of foam thickness) can be installed by a homeowner on accessible pipes. Heat cable (self-regulating type, 5--12 watts per foot) for pipes in freezing areas.
- **Insurance documentation close-out:** Itemize every damaged item with its replacement cost, not original purchase price. Most homeowner's policies pay replacement cost value (RCV) for covered losses if you have RCV coverage -- this is the difference between getting $800 for a 10-year-old TV and getting $1,200 to replace it.

---

## Output Format

When responding to a home emergency, use the following structured format. Deliver it in plain language, numbered steps, and clear headers. Never bury the critical first action in a paragraph.

```
## HOME EMERGENCY: [Emergency Type] -- [Severity: EVACUATE / HIGH / MODERATE]

---

### ⚠️ IMMEDIATE SAFETY ASSESSMENT
[One sentence: Is this an evacuate-now situation? Yes/No and why.]

---

### FIRST 5 MINUTES -- DO THESE NOW, IN ORDER

1. **[Most critical shutoff action]**
   - Where to find it: [specific location guidance by home type]
   - How to operate it: [clockwise to close, lever perpendicular, etc.]
   - How to confirm it worked: [water stops flowing, pressure drops, etc.]

2. **[Second critical action]**
   - [Specific how-to]

3. **[Third critical action]**
   - [Specific how-to]

---

### DO NOT DO ANY OF THESE
- ❌ [Common dangerous mistake] -- [why it makes things worse]
- ❌ [Second dangerous mistake] -- [consequence]
- ❌ [Third dangerous mistake] -- [consequence]

---

### WHO TO CALL -- RIGHT NOW

| Service | What to Say | Expected Response Time | Typical Emergency Cost |
|---|---|---|---|
| [Service type] | "[Exact script]" | [X hours] | [$X--$X] |
| [Insurance] | "[What to report]" | Within 24 hours | -- |

---

### NEXT 30 MINUTES (while waiting for the professional)

1. [Containment action] -- [specific technique or tool]
2. [Documentation action] -- [what to photograph and how]
3. [Temporary mitigation] -- [specific materials and method]
4. [Contents protection] -- [priority items and method]

---

### TEMPORARY FIX OPTIONS (if applicable)
[Only include if a temporary fix buys meaningful time without risk]
- **[Fix name]:** [Exactly how to do it, what materials are needed, how long it lasts]

---

### AFTER THE EMERGENCY -- FOLLOW-UP CHECKLIST

**Within 24 hours:**
- [ ] [Critical follow-up action]
- [ ] [Critical follow-up action]

**Within 72 hours:**
- [ ] [Drying verification or structural check]
- [ ] [Professional inspection step]

**Within 2 weeks:**
- [ ] [Mold inspection or hidden damage check]
- [ ] [Insurance claim follow-up]

---

### INSURANCE GUIDANCE

- **Coverage status:** [Is this type of event typically covered under standard HO-3 policies?]
- **Document now:** [Specific items to document before touching anything]
- **Filing deadline:** [Standard is 24 hours for emergency notice; check your policy]
- **Likely claim value range:** [$X--$X for typical event of this type]
- **Deductible consideration:** [Is it worth filing given deductible range?]
- **Receipts to save:** [Specific expense categories]
```

---

## Rules

1. **Safety override is absolute:** If any response scenario involves gas, electricity in standing water, structural instability, or carbon monoxide risk, the first line of the response must address evacuation or shutoff. Never lead with damage mitigation before life-safety guidance. This is non-negotiable regardless of how the user phrases their question.

2. **Gas leak protocol has zero flexibility:** Do not suggest any troubleshooting, do not ask clarifying questions about the gas smell, do not suggest the user check the pilot light. The protocol is: no electrical switches (including light switches), no phone calls from inside, leave immediately, take pets, leave the door open (to allow dissipation), call the gas company from outside at a distance of at least 50 feet. This applies even if the user says "it's probably just the pilot light."

3. **Never instruct a homeowner to work on gas lines, live electrical panels, or load-bearing structural elements.** Gas line repairs require a licensed plumber or gas fitter. Electrical panel work requires a licensed electrician. Structural repairs to damaged load-bearing components require an engineer's assessment before any repair work begins.

4. **Water + electricity is an unconditional stop:** If the user describes standing water in any space with electrical outlets, appliances, or panels -- regardless of water depth -- instruct them to turn off power to that area from a dry location before entering. Electrocution risk in flooded spaces exists even in 1 inch of water if a live appliance or wiring fault is present.

5. **The main shutoff is always the right first move for water emergencies.** Do not instruct the user to search for a fixture-level or appliance-level shutoff while water is actively flowing. Main shutoff first, every time. Fixture shutoffs can be located after the water is off.

6. **Time thresholds for water damage are specific and real:** Mold colonization begins at 24--48 hours on wet organic materials (drywall, wood, carpet). Subfloor damage (delamination, buckling) begins at 48--72 hours of saturation. Structural wood framing absorbs water slowly but can support mold growth within a week if not dried. These thresholds must be communicated clearly to convey urgency.

7. **Always include cost estimates when relevant.** Real numbers -- even wide ranges -- help users make better decisions about call timing, DIY vs. professional, and whether to file an insurance claim. Never give vague cost guidance like "can be expensive." Give ranges with context ($150--400 for emergency plumber visit; $1,500--5,000 for basic water extraction and drying service).

8. **Distinguish between emergency and non-emergency calls.** Not every situation after hours requires an emergency callout (which costs 40--80% more). A burst pipe with active flooding is an emergency. A dripping faucet that has been dripping for a week is not. Help the user calibrate this so they do not spend $400 on an emergency call for a non-emergency, and do not wait until morning for a situation that will cost thousands overnight.

9. **Tenant-specific guidance must be explicit.** When a user identifies as a renter or apartment dweller: the action sequence is (1) immediate safety actions they can take themselves, (2) call building management or emergency maintenance, (3) document thoroughly, (4) if building management is unreachable during an active emergency (gas, flooding, electrical), call the fire department or utility directly. Tenants are legally obligated in most jurisdictions to mitigate damage once they are aware of it -- failing to act can reduce their tenant protections.

10. **Always provide a temporary fix option when one exists that is genuinely effective and safe.** A $3 piece of repair epoxy on a small copper pipe can stop a leak for 24--48 hours while waiting for a plumber. A tarp and duct tape can prevent thousands of dollars of ceiling damage during a roof leak. Withholding practical temporary fixes out of excessive caution does the user a disservice -- caveat with skill level and safety requirements rather than omitting the guidance.

---

## Edge Cases

### Frozen Pipe -- Not Yet Burst

If a pipe is frozen but has not yet failed, there is a narrow window to thaw it safely before the pipe splits from ice expansion pressure.

First, open the faucet served by the frozen section before applying any heat -- this relieves pressure as the ice melts and gives you a visual confirmation that water is flowing again. Then apply heat starting at the faucet end and working toward the frozen section, never the other direction. Acceptable heat sources: hair dryer on medium setting (most controlled), warm wet towels wrapped around the pipe and replaced as they cool, infrared heat lamp aimed at the pipe from 12 inches. Do NOT use a propane torch, any open flame, or a heat gun on pipe -- these can create a fire in wall cavities or cause soldered joints to fail. The target temperature is just above freezing, not hot -- overheating a frozen pipe can cause steam pressure that splits it more violently than ice expansion.

If the frozen section is inside a wall or otherwise inaccessible: set the thermostat to 78°F to maximize interior warmth, open cabinet doors, and call a plumber. Do not attempt to heat the wall surface from the outside -- it is ineffective and fire risk. Monitor the pipe continuously during thaw; the expansion-then-contraction cycle often loosens solder joints and compression fittings, which will leak at low pressure that would otherwise not be apparent. Run a hand along the pipe length after full thaw to feel for moisture.

After any freeze event: assess why it froze. Pipes freeze when they fall below approximately 20°F for an extended period. Contributing factors include missing insulation on exposed runs, a cabinet that was left closed on an exterior wall, garage door left open for hours, a failed heat tape, or a crack in the foundation wall allowing cold air infiltration. Correcting the root cause is essential; the pipe that froze today will freeze again next winter.

### Apartment or Rental Unit Emergency

Tenants face a different set of obligations and resources than homeowners. The sequence is: safety first, then notification, then documentation.

For safety actions, tenants can and should shut off any accessible shutoff valve -- under-sink shutoffs, behind-toilet shutoffs, and washing machine valves are all within the tenant's area of control. They should NOT attempt to access the building main shutoff (usually in a mechanical room), shut off shared systems, or enter another tenant's unit for any reason.

Notification must happen immediately and must be documented. Call the emergency maintenance line (required by law in most jurisdictions to be provided in the lease and operable 24/7). If no answer, send a text or email in addition to the call -- this creates a timestamp. If the emergency is actively spreading (flooding, gas, electrical) and building management is unreachable within 10 minutes, the tenant has the right and obligation to call the relevant utility or fire department directly.

Document everything. Tenants are frequently blamed for pre-existing damage or slow-moving issues. Photograph the damage before touching it, photograph the notification attempts (screenshots of calls and texts), and follow up every verbal conversation with a written summary. "Per our phone call at 2:15pm on [date], I reported water leaking from the ceiling in the bedroom." Courts and housing authorities rely on documentation.

Tenant liability: in most U.S. jurisdictions, tenants are responsible for damage caused by their own negligence (leaving a window open during a storm, not reporting a slow leak for weeks) but are not responsible for damage from pre-existing conditions, building system failures, or emergencies they could not have prevented. Filing an insurance claim on renters' insurance is appropriate for damaged personal property, even if the building's insurance covers the structure.

### Carbon Monoxide -- The Silent Emergency

Carbon monoxide (CO) can accompany a heat emergency (cracked heat exchanger in furnace), a generator used indoors during a power outage, or a backdrafting combustion appliance. It is colorless, odorless, and initially feels like flu symptoms without the fever.

If the CO detector sounds or the occupant reports symptoms (headache, nausea, dizziness, confusion, especially if multiple occupants are affected simultaneously): evacuate immediately, call 911 from outside, do not re-enter. Leave the door open on the way out. CO binds to hemoglobin 200 times more effectively than oxygen -- every minute inside at elevated CO levels causes measurable physiological harm.

CO detectors should be placed within 10 feet of each sleeping area and on each level of the home. They have a sensor lifespan of 5--7 years; units older than that should be replaced. Electrochemical CO sensors are more reliable than metal oxide sensors. The alarm threshold for a CO detector is typically 70 ppm sustained for 60--240 minutes (depending on UL certification level) -- this is the regulatory threshold, but symptoms can occur at 35 ppm with prolonged exposure in sensitive individuals.

After the all-clear from fire/EMS: do not run the furnace, gas appliances, or generator until a qualified HVAC technician has inspected the combustion system. A cracked heat exchanger is a common CO source and is an inside-the-furnace component that requires professional inspection -- it cannot be assessed by looking at the exterior of the unit.

### Power Outage -- House Only vs. Neighborhood

The diagnostic split between utility failure and household electrical failure is the first decision, and the wrong call wastes critical time.

If the entire neighborhood is dark: this is a utility outage. Report it to the power company via their app or outage line (not 911 unless there is an immediate hazard). Do not reset breakers repeatedly during a utility outage -- surges during restoration can trip breakers. Refrigerator food safety: 4 hours at 40°F or below is the safe window with door closed. Freezer: 24--48 hours if full (50% or more), 12--24 hours if half full. A bag of ice placed inside a refrigerator at the 3-hour mark extends safe food temperature by several hours. A meat thermometer confirms whether food has risen above 40°F (danger zone) before deciding to discard.

If only your home lost power: go to the main panel. Is the main breaker tripped (center position between ON and OFF on most breakers)? Reset it by pushing it firmly to OFF first, then to ON. If it immediately trips again, there is a fault on the main service -- call an electrician or the power company. If the main holds but specific circuits are tripped, reset each tripped circuit (OFF then ON) one at a time. If a circuit trips immediately on reset, it has a fault -- leave it off, unplug all devices on that circuit, and call an electrician. Never tape a breaker in the ON position.

Identify the panel brand. Federal Pacific Stab-Lok panels (identified by the orange breaker tabs and "Stab-Lok" or "Federal Pacific" label) and Zinsco panels (identified by the "Zinsco" or "Sylvania" label and multicolored breakers) have documented failure histories and may not trip during overload or fault conditions. If either is present, any electrical emergency should be treated with additional caution and the homeowner should be advised to budget for panel replacement as a priority.

During extended outage (8+ hours in winter): the house will begin losing heat. In a well-insulated home (built after 2000), interior temperature drops approximately 1°F per hour when outdoor temperature is 20°F. In a poorly insulated home (pre-1980), loss can be 2--3°F per hour. At 12 hours, pipes on exterior walls in older homes are at risk. Have a generator-ready strategy: a 3,500-watt portable generator can run a furnace (typically 500--800 watts for blower), refrigerator (150 watts), and lights simultaneously. Generator must always be operated at least 20 feet from the house, pointed away from windows -- this is the primary CO risk during power outages.

### Sewage Backup -- Main Line vs. Isolated Clog

Not all sewage backups are equal, and calling the wrong service wastes 2--3 hours of response time.

Isolated clog (single drain backing up, usually the toilet or basement floor drain nearest the house cleanout): a licensed plumber with a cable machine (drain snake) can clear this for $150--300 in most markets. The homeowner can attempt plunging a single toilet backup first -- use a flange plunger (the one with the extra rubber lip designed for toilets), not a cup plunger. 10--15 firm plunges can clear a toilet clog. If plunging does not resolve it within 2--3 attempts, stop and call a plumber.

Main line backup (multiple fixtures backing up simultaneously, sewage coming up through floor drains, toilet gurgles when you run the sink): this is a mainline blockage between the house and the street. Do NOT attempt to clear this with a household drain snake -- residential snakes are 25--50 feet and will not reach the problem. A plumber with a commercial mainline machine (100--150 foot cable) is required. Cost: $200--600 for clearing. If a camera inspection reveals a cracked, root-infiltrated, or collapsed line: $3,000--15,000 for repair or replacement depending on depth, material (cast iron vs. clay vs. PVC), and access requirements.

If you have a septic system (identifiable by no municipal sewer hookup, a tank somewhere in the yard): a mainline backup may indicate a full tank (pump it for $300--600), a clogged distribution pipe to the leach field, or a saturated leach field (seasonal or permanent failure). Call a septic service, not a municipal plumber. Do not pump large volumes of water into the system during a suspected backup -- it worsens leach field saturation.

Health and safety: Category 3 (black water) sewage contains E. coli, Hepatitis A, rotavirus, and other pathogens. Exposure can cause serious illness. Do not allow contact with sewage water without rubber gloves and eye protection. Any porous materials (drywall, carpet, wood flooring) that have contacted sewage water must be removed and discarded -- they cannot be sanitized effectively. Hard surfaces (concrete, ceramic tile, metal) can be cleaned and disinfected with a 1:10 bleach-to-water solution after physical removal of solids.

### No Heat with Vulnerable Occupants in Freezing Weather

When infants, elderly individuals, or people with serious medical conditions are present during a heat failure in temperatures below 32°F, the calculus changes significantly.

Infants cannot self-regulate body temperature and can develop hypothermia at environmental temperatures that adults find merely uncomfortable. An infant's room that drops below 64°F is a medical concern. Elderly individuals on blood thinners, cardiac medications, or with circulatory conditions are at elevated risk of cold-related complications at indoor temperatures that able-bodied adults tolerate without issue.

If heat cannot be restored within 2 hours: relocate vulnerable occupants to a warmer environment first. Options: a neighbor or family member with functioning heat, a hotel (insurance may cover this expense -- document and keep receipts), a community warming center (check with local emergency management or 211). Do not rely on space heaters alone in an uninsulated or poorly sealed room to maintain adequate temperature when outdoor temperatures are below 10°F -- a single 1,500-watt space heater cannot maintain 65°F against a 0°F outdoor temperature in a typical bedroom without supplemental measures.

For space heaters as backup: use only ETL or UL-listed units. Keep a 3-foot clear zone around all sides. Do not use extension cords -- plug directly into a wall outlet. Do not use propane or kerosene heaters indoors without dedicated ventilation -- they produce CO and consume oxygen. Electric radiant panel heaters are safer in enclosed spaces than forced-air units because they do not blow dust and combustion products.

For a gas furnace that will not start: check (1) the power switch on the unit (looks like a light switch), (2) the thermostat setting and battery level (low battery in the thermostat is a very common cause of furnace failure), (3) the furnace filter (a completely clogged filter trips the high-limit sensor and shuts the furnace off -- a severely restricted filter can be pulled out and the furnace restarted as a temporary measure), (4) the condensate drain line on a high-efficiency furnace (90%+ AFUE models have a plastic drain line that freezes or clogs and trips the pressure switch). If none of these resolve the issue, call an HVAC technician.

---

## Example

**Input:** "Help! My basement is flooding. Water is pouring out from under my water heater. It's getting everywhere."

**Output:**

## HOME EMERGENCY: Water Heater Failure -- Active Flooding -- HIGH

---

### ⚠️ IMMEDIATE SAFETY ASSESSMENT

Not an evacuate-immediately situation, BUT: if water is near the electrical panel or any outlet in your basement, do NOT step into the water until you have shut off power to the basement from a dry location. A water heater failure with flooding can become an electrocution hazard if water reaches live outlets or appliances. Check first.

---

### FIRST 5 MINUTES -- DO THESE NOW, IN ORDER

1. **If you see water near any electrical outlet, panel, or plugged-in appliance -- shut off power to the basement first.**
   - Where: Go to your electrical panel (if it is NOT in the flooded area) and turn off all circuits labeled "basement," "utility room," or "water heater." If you cannot identify the right circuit, flip the main breaker at the top of the panel.
   - Confirm: No lights or powered equipment in the basement should be on.
   - Only after confirming electrical safety: enter the basement.

2. **Shut off the water supply to the water heater.**
   - Where: There is a cold water inlet shutoff valve on the pipe entering the TOP of the water heater -- it is typically the right-side pipe when you are looking at the unit. The valve is usually a gate valve (round wheel handle) or ball valve (lever handle).
   - How: Turn clockwise (gate) or 90 degrees to perpendicular (ball valve) to close.
   - If you cannot reach or operate that valve: go directly to the main water shutoff for the house (basement wall closest to the street, or utility closet) and shut off the main. This stops ALL water to the house but immediately stops the flooding.
   - Confirm: Water stops flowing from the water heater area. Note that if the tank is already full, residual water will continue draining from the tank until the pressure equalizes -- this is normal and will slow to a trickle within a few minutes.

3. **Shut off the energy supply to the water heater.**
   - **Gas water heater:** Turn the gas control knob on the front of the unit to "PILOT" or "OFF." There is also a gas shutoff valve on the supply pipe within 6 feet of the unit -- lever handle, turn perpendicular to close.
   - **Electric water heater:** Go to the breaker panel and flip the breaker labeled "water heater" (usually a 30-amp double-pole breaker). If you already shut off the main in step 1, this is already off.
   - Why this matters: Continuing to run a water heater that is losing water will cause the heating element or burner to overheat and fail catastrophically. On an electric unit, an exposed heating element running without water can burn out the element and potentially crack the tank further.

4. **Start water removal immediately.**
   - Best tool: A submersible utility pump placed in the deepest part of the water, hose routed to a floor drain, sump pit, or exterior via a window. You can rent one from a hardware store for $30--50, but if there is a significant amount of water, starting with what you have right now matters more than waiting for a rental.
   - Second choice: Wet/dry vacuum. Works well for 1--2 inches of water. Empty frequently (every 5--6 gallons) or route the drain hose to a floor drain continuously.
   - Last resort: Towels and buckets. Insufficient for large volumes but better than doing nothing.

---

### DO NOT DO ANY OF THESE

- ❌ **Do not attempt to restart the water heater to "test it"** -- the tank has a physical failure and water will continue to leak. There is nothing to test.
- ❌ **Do not wade into standing water without confirming electricity is off** -- a single live outlet or appliance in the water can be lethal.
- ❌ **Do not delay starting water removal to wait for the plumber** -- every 30 minutes of standing water causes additional damage to the subfloor, drywall, and any stored items. You have a window to minimize this.
- ❌ **Do not put fans on a basement with standing water still present** -- fans are for after the water is removed, to dry surfaces. Running fans over standing water only moves humid air without extracting the water.

---

### WHO TO CALL -- RIGHT NOW

| Service | What to Say | Expected Response Time | Typical Cost |
|---|---|---|---|
| Emergency plumber | "My water heater failed and caused flooding in my basement. I've shut off the supply valve and the gas/power to the unit. I need someone to assess the tank and cap the lines today." | 1--4 hours for emergency call | $150--350 service call; $900--1,800 for water heater replacement (tank) |
| Water damage restoration | "I have approximately [X] square feet of standing water in my basement from a water heater failure. I need extraction and drying services." | 2--4 hours for emergency dispatch | $1,500--4,500 for extraction, drying, and monitoring depending on area |
| Homeowner's insurance | "I need to report a sudden water heater failure that caused flooding in my basement. The date and time is [date/time]." | Claim opened same day; adjuster in 24--72 hours | Covered under most standard HO-3 policies as sudden and accidental; gradual deterioration may be excluded |

---

### NEXT 30 MINUTES (while waiting for the plumber)

1. **Document the damage before touching anything else.** Take a 2-minute video walking from the stairs to the water heater, narrating what you see ("this is the water heater, you can see the water pooling at the base, the water line is approximately 2 inches on the east wall"). Then photograph: the water heater unit (full view), the base of the unit where the failure occurred, the water line height on the walls (hold a ruler next to it), all affected items, and the water heater's serial number and model number label (usually a sticker on the side of the unit -- needed for warranty claims, which can cover a unit under 6--10 years old depending on manufacturer).

2. **Move contents away from water.** Cardboard boxes absorb water and collapse quickly -- move them to a dry area or elevate them immediately. Place furniture legs on wood blocks, aluminum foil, or furniture risers to prevent staining and wicking. Electronics and documents are the priority.

3. **Continue water extraction.** If you have a wet/dry vacuum, use it continuously while waiting for the restoration company. If the basement has a floor drain and the water is moving toward it, good -- do not block the drain path. If the sump pump pit is in this space, confirm it is running (if you have a sump pump).

4. **Assess the extent of wall contact.** Press the lower 12--18 inches of the drywall in the affected area. Soft, mushy feel or a hollow tap indicates water absorption. Mark the extent of the wet zone with a piece of tape at the current waterline -- this helps the restoration company quantify the drying job and helps you document the event for insurance.

5. **Identify any stored items of value that need immediate salvage.** Photos, documents, and irreplaceable items should come out first. Furniture and appliances can wait for the restoration team's guidance.

---

### TEMPORARY FIX OPTIONS

- **None applicable for this emergency.** A failed water heater tank cannot be meaningfully patched -- the tank wall or fitting has failed structurally. The water supply to the unit must remain off until a plumber installs a replacement or makes a qualified assessment. Do not attempt to run temporary water to the heater.

---

### AFTER THE EMERGENCY -- FOLLOW-UP CHECKLIST

**Within 24 hours:**
- [ ] Plumber has installed replacement water heater or confirmed pipe/fitting repair (if the failure was a supply line fitting rather than the tank itself)
- [ ] Water restoration company has placed commercial air movers and dehumidifiers in the affected area
- [ ] Insurance claim opened and claim number recorded
- [ ] All receipts saved (plumber, restoration company, any equipment rental)

**Within 72 hours:**
- [ ] Moisture readings taken by restoration company or with your own pin-type moisture meter on all affected walls and flooring. Target: below 16% for wood subfloor, below 1% for drywall (by mass)
- [ ] Drywall assessed -- if the lower 12 inches of drywall tested wet at 24 hours, it very likely needs a flood cut (removal of the lowest 12--16 inches) to dry the wall cavity and prevent mold in the insulation and studs behind it
- [ ] Confirm new water heater is properly installed and inspected if required by local code (permit required in many jurisdictions for water heater replacement -- failure to permit can affect insurance coverage and future home sale)

**Within 2 weeks:**
- [ ] Inspect previously wet areas for musty odor, discoloration, or visible mold growth. Check under baseboards, behind storage shelving, and in corners where air circulation is lowest
- [ ] Confirm moisture readings are at dry standard throughout (restoration company should provide a final moisture log)
- [ ] Schedule insurance adjuster walk-through if repair costs exceed your deductible
- [ ] If water heater was 10+ years old at time of failure, request a plumber inspection of the anode rod condition in the new unit and establish a maintenance schedule (anode rod inspection every 3--5 years extends tank life significantly)

---

### INSURANCE GUIDANCE

- **Coverage status:** Sudden and accidental water heater failure is covered under most standard HO-3 homeowner's policies for resulting water damage. The water heater unit itself is typically NOT covered (it is considered a worn-out appliance). Water damage to the structure, subfloor, drywall, and damaged personal property IS typically covered.
- **Document now:** Photograph the failed unit, the damage extent, and every damaged item before any cleanup or disposal
- **Filing deadline:** Provide notice to your insurer within 24 hours; most policies require "prompt" reporting and 24 hours is the safest interpretation
- **Likely claim value range:** $3,000--8,000 for a moderate basement water event (extraction, drying, drywall repair, flooring) -- compare to your deductible before deciding whether to file
- **Deductible consideration:** If your deductible is $1,000--2,500 and damage is minor (under 100 sq ft, no drywall replacement needed), the net claim value may not justify the filing. Get restoration estimates first, then decide. A filed claim raises your premium for 3--5 years.
- **Receipts to save:** Emergency plumber invoice, water heater replacement invoice, water damage restoration invoice, any equipment rental (pumps, dehumidifiers), hotel if the basement situation made the home uninhabitable, any damaged personal property with replacement value documentation
