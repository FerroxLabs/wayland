---
name: home-electrical
description: |
  DIY home electrical guide covering safety fundamentals including breaker panels and testing for live wires, outlet and switch replacement, GFCI installation, light fixture swaps, guidelines for when to call a licensed electrician, wire gauge reference, and electrical code basics. Includes strong safety warnings throughout. Use when the user asks about home electrical or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-maintenance guide step-by-step"
  category: "hobbies-crafts"
  subcategory: "making-building"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Home Electrical

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to home electrical.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on home electrical
- User asks about home electrical best practices or techniques
- User wants a structured approach to home electrical

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of home electrical

## CRITICAL SAFETY WARNINGS

```
ELECTRICITY CAN KILL YOU. READ THIS ENTIRE SECTION FIRST.

1. ALWAYS turn off power at the breaker BEFORE touching any wiring
2. ALWAYS test with a non-contact voltage tester AFTER turning off breaker
3. NEVER assume a wire is dead - TEST EVERY TIME
4. NEVER work on the main panel or service entrance yourself
5. NEVER work in wet conditions
6. NEVER exceed the rated capacity of a circuit
7. NEVER use a wire gauge smaller than what the circuit requires
8. If you are unsure about ANYTHING, STOP and call a licensed electrician
9. Many jurisdictions require permits for electrical work beyond simple
   replacements - check your local codes BEFORE starting
10. Improper electrical work can cause fires, electrocution, and death.
    It can also void your homeowner's insurance.

THIS GUIDE COVERS SIMPLE REPLACEMENTS ONLY.
New circuits, panel work, and rewiring should be done by a licensed electrician.
```

## Questions to Ask First

Before providing guidance, establish the homeowner's situation:

1. What specific electrical task are you trying to do?
2. How old is your home? (Wiring type and condition varies by era)
3. What type of wiring do you have? (Romex/NM, knob-and-tube, BX/MC)
4. Can you identify your breaker panel and the correct breaker?
5. Do you own a non-contact voltage tester?
6. Do you have any electrical experience?
7. Is this a replacement (same-for-same) or new installation?
8. Are there any signs of electrical problems? (Flickering, burning smell, warm outlets)
9. Are you comfortable working with your hands and following precise instructions?
10. Have you checked your local building codes for permit requirements?

## Safety First: Breaker Panel

### Understanding Your Panel

```
BREAKER PANEL BASICS:
  Main breaker: Large breaker at top (100A, 150A, or 200A typical)
  Branch breakers: Individual circuits for different areas/appliances
  Each breaker is rated: 15A, 20A, 30A, 40A, 50A, etc.

  Single-pole breaker (120V): Lights, outlets, small appliances
  Double-pole breaker (240V): Dryer, oven, AC, water heater

BREAKER IDENTIFICATION:
  Label every breaker in your panel (if not already done)
  Method: Turn off one breaker at a time, identify what loses power
  Keep a printed diagram inside the panel door

HOW TO TURN OFF A BREAKER:
  1. Identify the correct breaker for the area you're working on
  2. Flip it firmly to the OFF position
  3. Test the outlet/fixture with a voltage tester to confirm
  4. If unsure which breaker, turn off the MAIN breaker (whole house)

WARNING SIGNS FROM YOUR PANEL:
  - Burning smell (EMERGENCY - call electrician immediately)
  - Scorch marks on breakers or panel
  - Breakers that trip repeatedly (do NOT just reset them)
  - Buzzing or humming from the panel
  - Double-tapped breakers (two wires on one breaker terminal)
  - Federal Pacific (FPE) or Zinsco panels (known safety hazards -
    consult electrician about replacement)
```

### Testing for Live Wires

```
NON-CONTACT VOLTAGE TESTER (NCVT):
  Cost: $15-$30 (Klein NCVT-2 recommended)
  How to use:
  1. Test the tester on a KNOWN live outlet first
  2. Turn off the breaker
  3. Hold the tester near each wire or terminal
  4. If it lights up / beeps: WIRE IS STILL LIVE - STOP
  5. If no response: Proceed with caution

  ALWAYS test the tester before and after each use.
  This simple habit could save your life.

MULTIMETER (For Verification):
  Set to AC Voltage (V~) range
  Touch probes to hot and neutral (should read ~0V if power is off)
  Touch probes to hot and ground (should read ~0V if power is off)
  If either reads 120V: POWER IS STILL ON

WIRE COLOR CODING (Standard Residential):
  BLACK:  Hot (carries current from panel)
  RED:    Hot (second hot in 240V or 3-way switch circuits)
  WHITE:  Neutral (return path to panel) - CAN be re-identified as hot
          in switch legs (should be marked with tape)
  GREEN:  Ground (safety, connects to grounding system)
  BARE:   Ground (same function as green)
  BLUE:   Hot (commercial, or for specific circuits in conduit)

  WARNING: In older homes, wire colors may NOT follow modern standards.
  ALWAYS test regardless of wire color.
```

## Outlet/Switch Replacement

### Replacing an Outlet (Receptacle)

```
TOOLS NEEDED:
  [ ] Non-contact voltage tester
  [ ] Flathead and Phillips screwdrivers
  [ ] Wire strippers (if needed)
  [ ] Needle-nose pliers
  [ ] New outlet (match the amperage: 15A or 20A)

STEP-BY-STEP:
  1. Turn off the breaker for the circuit
  2. TEST with voltage tester to confirm power is off
  3. Remove cover plate (one screw)
  4. Remove outlet from box (two screws, top and bottom)
  5. Pull outlet out gently, exposing wires
  6. PHOTOGRAPH the wiring before disconnecting anything
  7. Note which wires connect to which terminals:
     - Brass screws: Hot (black) wires
     - Silver screws: Neutral (white) wires
     - Green screw: Ground (bare/green) wire
  8. Disconnect wires (loosen screws, remove wires)
  9. Connect wires to new outlet in SAME configuration
     - Wrap wire clockwise around screw (so it tightens with screw)
     - OR use backstab holes (screw connections are more reliable)
  10. Push outlet back into box, screw in place
  11. Install cover plate
  12. Turn breaker back on
  13. Test with a plug-in outlet tester ($5-$10)

15A vs 20A OUTLETS:
  15A outlet: Two vertical slots + ground hole
  20A outlet: One vertical slot, one T-shaped slot + ground hole
  15A outlets can be used on 20A circuits
  20A outlets can ONLY be used on 20A circuits (12-gauge wire required)

NEVER:
  - Connect more than one wire to a single screw terminal
  - Force the outlet back if wires are bunched (fire risk)
  - Use backstab connections on 20A circuits (use screw terminals)
  - Reuse an outlet that shows signs of heat damage or arcing
```

### Replacing a Light Switch

```
SINGLE-POLE SWITCH (Most Common):
  Controls a light from ONE location
  Two brass/black screw terminals + green ground screw

  1. Power OFF and TESTED
  2. Remove cover plate and switch
  3. Photograph wiring
  4. Note: Two hot wires on brass screws, ground on green
  5. Disconnect and reconnect to new switch identically
  6. White wires in the box are usually connected together (wirenutted)
     and do not connect to the switch

THREE-WAY SWITCH:
  Controls a light from TWO locations
  One dark/common screw + two brass traveler screws + ground

  1. Power OFF and TESTED
  2. Identify the COMMON terminal (different color screw, often dark/black)
  3. Mark the wire on the common terminal with tape
  4. Photograph all connections
  5. Connect common wire to common screw on new switch
  6. Connect traveler wires to traveler screws (order doesn't matter)
  7. Connect ground

  WARNING: Do NOT mix up common and traveler wires.
  If the switch doesn't work correctly, common wire is likely wrong.

DIMMER SWITCH:
  Most modern dimmers use wire leads instead of screw terminals
  1. Power OFF and TESTED
  2. Remove old switch
  3. Connect dimmer leads to circuit wires using wire nuts
     - Black dimmer lead to hot wire
     - If dimmer has two black leads: One to each hot wire (same as switch)
     - Green lead to ground
  4. Gently fold wires into box, mount dimmer
  5. LED compatible dimmer required for LED bulbs (CL dimmer)
```

## GFCI Installation

### GFCI (Ground Fault Circuit Interrupter)

```
WHERE GFCI IS REQUIRED (NEC Code):
  - Bathrooms
  - Kitchens (within 6 feet of sink)
  - Garages
  - Outdoors
  - Basements (unfinished)
  - Laundry areas
  - Near pools, hot tubs, fountains
  - Crawl spaces

HOW GFCI WORKS:
  Monitors current on hot and neutral wires
  If there's a difference (current leaking to ground/person), trips in <1/30 second
  Protects against electrocution from ground faults

GFCI OUTLET INSTALLATION:
  1. Power OFF and TESTED
  2. Remove old outlet
  3. Identify LINE wires vs. LOAD wires:
     LINE wires: Come FROM the breaker panel (power source)
     LOAD wires: Go TO downstream outlets (outlets further on the circuit)

  4. If only one set of wires: Connect to LINE terminals only
  5. If two sets of wires:
     - LINE terminals (marked on GFCI): Connect the SOURCE wires
     - LOAD terminals (marked on GFCI): Connect DOWNSTREAM wires
     - This protects all downstream outlets with GFCI protection

  6. Connect ground wire to green screw
  7. Remove the yellow "LINE" and "LOAD" warning tape
  8. Install, restore power
  9. Press TEST button (should trip)
  10. Press RESET button (should restore power)
  11. Test monthly by pressing TEST button

  TO IDENTIFY LINE vs. LOAD:
  Method: Disconnect all wires. Turn breaker on. Carefully test each
  pair of wires with voltage tester. The pair that is HOT is LINE.
  Turn breaker OFF before connecting.

  WARNING: If LINE and LOAD are reversed, the GFCI will still work at
  THAT outlet but will NOT protect downstream outlets.
```

### GFCI vs. AFCI

```
GFCI: Protects against ground faults (electrocution)
AFCI: Protects against arc faults (electrical fires)

AFCI (Arc Fault Circuit Interrupter):
  Required by modern code for bedrooms, living rooms, and most circuits
  Usually installed as an AFCI breaker in the panel
  Can also be outlet-type (AFCI receptacle)
  If your AFCI breaker keeps tripping: May indicate a real arc fault
  (damaged wire, loose connection) - investigate before just resetting

Note: AFCI breaker installation is a PANEL-LEVEL task.
Recommend hiring a licensed electrician for AFCI breaker installation.
```

## Light Fixture Swaps

### Replacing a Light Fixture

```
THIS IS ONE OF THE SIMPLEST ELECTRICAL TASKS.

TOOLS:
  [ ] Non-contact voltage tester
  [ ] Screwdrivers
  [ ] Wire nuts (usually included with new fixture)
  [ ] Wire strippers
  [ ] Helper (to hold fixture while you wire)

STEPS:
  1. Turn off breaker for the light circuit
  2. TEST to confirm power is off (turn switch on, test at fixture)
  3. Remove old fixture:
     a. Remove bulbs and any glass covers
     b. Remove mounting screws or nut holding fixture to ceiling
     c. Lower fixture, expose wiring
     d. Photograph wire connections
     e. Disconnect wire nuts, separate wires
     f. Remove mounting bracket if new one is different

  4. Install new fixture:
     a. Install new mounting bracket to electrical box
     b. Connect ground wire first (bare/green to bare/green or box)
     c. Connect white (neutral) to white (neutral) - wire nut
     d. Connect black (hot) to black (hot) - wire nut
     e. Tug each connection to verify it's secure
     f. Carefully fold wires into box
     g. Mount fixture to bracket
     h. Install bulbs

  5. Turn power on, test

WEIGHT CONSIDERATIONS:
  Standard electrical boxes support up to 50 lbs
  Ceiling fans or heavy fixtures REQUIRE a fan-rated box
  Fan-rated boxes are reinforced and secured to framing
  If you're replacing a light with a fan: Verify box rating first

WIRE NUT SIZING:
  Yellow: 2 x #14 or 2 x #12
  Red: 3-4 x #14 or 3 x #12
  Twist wires together clockwise, then twist wire nut on clockwise
  No bare copper should be visible below the wire nut
```

## When to Call an Electrician

```
ALWAYS CALL AN ELECTRICIAN FOR:
  [ ] ANY work inside the breaker panel
  [ ] Adding new circuits
  [ ] Upgrading electrical service (100A to 200A)
  [ ] Running new wiring through walls
  [ ] Installing a sub-panel
  [ ] Any 240V circuit work (dryer, oven, AC, EV charger)
  [ ] Aluminum wiring concerns (pre-1972 homes)
  [ ] Knob-and-tube wiring (very old homes)
  [ ] Code violations identified during home inspection
  [ ] Repeated breaker tripping (may indicate serious problem)
  [ ] Burning smell from any outlet, switch, or panel
  [ ] Flickering lights throughout the house
  [ ] Warm or discolored outlets or switches
  [ ] Outdoor wiring and underground conduit
  [ ] Generator hookup (transfer switch required)
  [ ] Hot tub, pool, or spa wiring

SYMPTOMS THAT REQUIRE IMMEDIATE ATTENTION:
  - Sparks when plugging in devices (call electrician)
  - Buzzing from outlets or switches (call electrician)
  - Burning smell (turn off breaker immediately, call electrician)
  - Outlet or switch is warm/hot to touch (turn off breaker, call electrician)
  - Lights dim when appliances turn on (may indicate overloaded circuit)
  - Frequent breaker trips (DO NOT just reset - investigate cause)

CHOOSING AN ELECTRICIAN:
  - Licensed in your state/jurisdiction
  - Insured and bonded
  - Get 2-3 quotes for large jobs
  - Ask about permits (reputable electricians pull permits)
  - Check reviews and references
  - Master electrician preferred for complex work
```

## Wire Gauge Guide

```
WIRE GAUGE AND CIRCUIT CAPACITY:

Wire Gauge | Max Amps | Breaker | Common Use
-----------|----------|---------|---------------------------
14 AWG     | 15A      | 15A     | Lighting circuits, bedrooms
12 AWG     | 20A      | 20A     | Kitchen, bathrooms, general outlets
10 AWG     | 30A      | 30A     | Dryer, water heater, AC
8 AWG      | 40A      | 40A     | Range/oven, large AC
6 AWG      | 55A      | 50A     | Range, subpanel feed
4 AWG      | 70A      | 60A     | Subpanel, EV charger
2 AWG      | 95A      | 90A     | Large subpanel

CRITICAL RULE:
  Wire gauge must MATCH or EXCEED the breaker rating
  14 AWG wire on a 20A breaker = FIRE HAZARD
  12 AWG wire on a 15A breaker = Safe (oversized is fine)
  NEVER put a larger breaker on a circuit to "fix" tripping
  The breaker protects the wire from overheating

NM (ROMEX) CABLE DESIGNATION:
  14/2: 14-gauge, 2 conductors + ground (most common for 15A)
  12/2: 12-gauge, 2 conductors + ground (most common for 20A)
  12/3: 12-gauge, 3 conductors + ground (3-way switches, multi-wire)
  10/3: 10-gauge, 3 conductors + ground (dryer circuits)
```

## Electrical Code Basics

```
NATIONAL ELECTRICAL CODE (NEC) KEY POINTS:

OUTLET SPACING:
  No point along a wall should be more than 6 feet from an outlet
  (Practically: outlet every 12 feet along walls)
  Any wall space 2 feet or wider needs an outlet
  Kitchen countertops: Outlet every 4 feet, within 2 feet of each end
  Bathroom: At least one outlet within 3 feet of each sink
  Outdoor: At least one front, one back

DEDICATED CIRCUITS REQUIRED:
  Kitchen small appliance circuits: Minimum 2 (20A each)
  Refrigerator: Dedicated 20A circuit recommended
  Dishwasher: Dedicated 20A circuit
  Microwave: Dedicated 20A circuit
  Bathroom receptacles: Dedicated 20A circuit
  Laundry: Dedicated 20A circuit
  Garage: At least one 20A circuit
  Furnace/HVAC: Dedicated circuit per equipment specs

GROUND FAULT PROTECTION:
  GFCI required in: Bathrooms, kitchens, garages, outdoors,
  basements, laundry, within 6 feet of any sink

ARC FAULT PROTECTION:
  AFCI required in: Bedrooms, living rooms, family rooms,
  dining rooms, hallways, closets, sunrooms (varies by code year)

SMOKE AND CO DETECTORS:
  Smoke detector: Every bedroom, outside sleeping areas, every level
  CO detector: Outside each sleeping area, every level with fuel-burning
  Interconnected: When one alarms, they all alarm (required in new construction)

NOTE: Codes vary by jurisdiction. Your local code may differ from NEC.
Always check with your local building department for specific requirements.
```

## Simple Electrical Projects for DIY

```
SAFE FOR MOST HOMEOWNERS:
  Replacing outlets (same-for-same): 15 minutes each
  Replacing switches (same-for-same): 15 minutes each
  Installing GFCI outlets: 30 minutes each
  Replacing light fixtures: 30-60 minutes each
  Installing ceiling fan (fan-rated box already present): 1-2 hours
  Replacing doorbell: 30 minutes (low voltage, safer)
  Adding dimmer switches: 20 minutes each
  Replacing cover plates: 2 minutes each

REQUIRE COMFORT AND EXPERIENCE:
  Installing new outlets on existing circuits
  Running cable through accessible spaces
  Adding outdoor outlets (with GFCI protection)
  Installing under-cabinet lighting

ALWAYS HIRE A PROFESSIONAL:
  Panel upgrades and new breakers
  Rewiring rooms or whole house
  Service entrance work
  New circuit installation
  Any 240V work
  Buried or underground wiring
```

## Common Mistakes to Avoid

1. Working on live circuits (the #1 cause of electrical injuries in homes)
2. Not testing with a voltage tester after turning off the breaker
3. Using the wrong wire gauge for the circuit (fire hazard)
4. Overfilling electrical boxes (code violation, fire risk)
5. Making poor wire nut connections (loose connections cause arcing and fires)
6. Replacing a 15A breaker with a 20A breaker to stop tripping (DANGEROUS)
7. Backstab connections on outlets (less reliable, prone to loosening - use screws)
8. Not connecting ground wires (safety critical)
9. Ignoring signs of electrical problems (warm outlets, flickering, burning smell)
10. Attempting work beyond your skill level to save money (electrical fires and electrocution are not worth the savings)


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Home Electrical deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with home electrical for a mid-size project."

**Output:** A complete home electrical framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
