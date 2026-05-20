---
name: diy-vs-hire
description: |
  Evaluates whether a home improvement project should be done as DIY or by hiring a professional. Analyzes skill requirements, safety factors, permit needs, time investment, and cost-benefit trade-offs to produce a recommendation with rationale.
  Use when the user asks whether to do a project themselves or hire someone, wants to know if a job requires a professional, or is deciding between DIY and contractor for a specific task.
  Do NOT use for finding or vetting contractors, project budgeting (use renovation-budget instead), or scheduling home maintenance tasks.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-maintenance decision-making planning"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# DIY vs. Hire

## When to Use

**Use this skill when:**
- A user asks directly "Should I do this myself or hire someone?" for a specific home improvement or maintenance task
- A user describes a project and wants to understand the skill level, risk, or permit requirements before committing to an approach
- A user is calculating whether the cost savings of DIY justify the time and effort for a particular job
- A user is on the fence because they have some related experience but have never done this exact type of work
- A user wants to know which portions of a larger project they can handle themselves versus which require a licensed contractor
- A user has received a contractor quote and wants to evaluate whether self-performing the work is a realistic alternative
- A user asks whether a specific type of work legally requires a licensed professional in their jurisdiction

**Do NOT use when:**
- The user needs a step-by-step how-to guide for executing a specific task -- use task-specific skills like `paint-a-room`, `tile-installation`, or `drywall-repair` once the DIY decision is made
- The user needs a full renovation budget breakdown across multiple scopes of work -- use `renovation-budget` instead
- The user wants help finding, screening, or negotiating with contractors -- this skill does not source or evaluate service providers
- The user needs a scheduled maintenance calendar (seasonal HVAC service, gutter cleaning frequency, etc.) -- use `home-maintenance-schedule`
- The user is asking about commercial, multi-family, or rental property compliance beyond basic landlord-tenant maintenance questions

---

## Process

### Step 1 -- Gather Project Specifics Before Scoring Anything

Do not begin the assessment until you have enough information to rate each factor accurately. Ask the user to describe:

- **The exact task** -- not "bathroom work" but "replacing the toilet" or "moving the vanity 18 inches to install a double sink"
- **Current condition** -- is there existing infrastructure in place (wiring, plumbing rough-in, subfloor), or is this new construction-style work?
- **Their experience level** -- distinguish between: (a) no hands-on home improvement experience, (b) completed cosmetic projects (painting, caulking, hardware), (c) completed systems-adjacent work (replaced a faucet, patched drywall, installed a light fixture), (d) experienced DIYer with power tools and prior structural or mechanical work, (e) trade background or professional-level experience
- **Tools on hand** -- basic hand tools only, a full set of power tools, or specialty equipment (tile saw, pipe threader, laser level, oscillating multi-tool)
- **Time constraints** -- can they leave a system non-functional for multiple days, or does this need to be done in one session?
- **Primary priority** -- minimize out-of-pocket cost, minimize elapsed time, or maximize finished quality

If the user has not provided any of these, ask before scoring. A vague description like "I want to fix my deck" could range from replacing two rotted boards (LOW risk, no permit) to rebuilding a freestanding two-story deck (REQUIRED permit, structural engineering may apply).

---

### Step 2 -- Rate the Five Decision Factors

Evaluate each factor independently based on the specific project described, not a general category.

**Factor 1 -- Skill Requirement**

This factor measures the gap between what a tutorial can teach and what the job actually demands.

- **LOW:** A motivated person with no prior experience can complete this correctly after watching 1-2 videos. Mistakes are immediately visible and easily corrected. Examples: painting walls or trim, replacing outlet covers and switch plates, installing a pre-hung interior door in an existing rough opening, caulking a tub surround, replacing a toilet seat, installing peel-and-stick backsplash tile.
- **MEDIUM:** Requires learned hand skills or procedural knowledge that takes practice to execute correctly. First attempt has meaningful chance of a fixable mistake. Examples: tiling with thin-set and grout (layout, lippage, grout haze), hanging drywall and applying joint compound (multiple coats, feathering), installing a laminate floating floor (expansion gaps, transitions, cutting around door casings), replacing a wax ring toilet seal, installing a bathroom exhaust fan with existing wiring, replacing a circuit breaker (single breaker swap, not panel work).
- **HIGH:** Requires trade-level knowledge, code familiarity, or specialized diagnostic skill. Errors may not be visible and can cause latent damage or danger. Examples: electrical service panel modifications, load-bearing wall removal or modification, gas line extension or relocation, plumbing drain-waste-vent rough-in, roof deck and flashing installation, foundation crack repair involving structural elements, HVAC refrigerant work (legally requires EPA 608 certification).

**Factor 2 -- Safety Risk**

Rate the worst-case injury or property damage scenario if something goes wrong during execution.

- **LOW:** Risk of minor cuts, bruises, or muscle strain. Standard precautions (gloves, eye protection) are sufficient. Examples: painting, caulking, replacing hardware, installing shelving into studs, minor landscaping, replacing a toilet, installing flooring.
- **MEDIUM:** Risk of fall injury, power tool laceration, electrical shock from a de-energized circuit, or moderate property damage. Requires PPE beyond basic gloves, proper technique, and careful setup. Examples: working on a ladder above 8 feet, demolition with a reciprocating saw, installing a ceiling fan in a de-energized circuit, cutting cement board or fiber cement siding (silica dust), working in a crawl space with limited egress.
- **HIGH:** Risk of electrocution from live service conductors, explosion or CO poisoning from gas work, structural collapse, fall from elevation above 10 feet (especially roofing), asbestos or lead paint disturbance in pre-1980 homes, working with pressurized water heater systems, tree removal near structures. These risks are not eliminated by careful technique alone -- they require specialized training and, in some cases, licensed professionals by law.

**Factor 3 -- Permit and Code Requirements**

This is a factual determination, not an opinion. Permit requirements are set by local jurisdiction (city, county, or state building department) and vary considerably. Use these general rules as defaults, and always note that the user should verify with their local building department.

- **NONE:** Work is cosmetic or involves replacement in kind at the same location with no change to systems capacity or routing. Examples: painting, flooring replacement over existing subfloor, replacing fixtures at existing locations (faucets, toilets, light fixtures, ceiling fans), kitchen cabinet replacement without moving plumbing or electrical, adding outlets to an existing circuit in some jurisdictions.
- **POSSIBLE / JURISDICTION-DEPENDENT:** Permit may be required depending on the municipality, scope, or dollar value of the work. When in doubt, the default should be to call the building department before starting. Examples: fence construction (height and setback rules vary enormously), deck construction under a certain square footage, water heater replacement (required in many jurisdictions), adding a subpanel, installing a generator transfer switch, finishing a basement, converting a garage.
- **REQUIRED:** Almost universally requires permit and, in most jurisdictions, work must be performed by or under the supervision of a licensed contractor. Unpermitted work in these categories creates serious liability. Examples: any new electrical circuit from the panel, any gas line work, structural modifications including window enlargement and wall removal, plumbing rough-in or drain line relocation, HVAC installation or replacement, room additions, ADU construction.

**Critical note:** Unpermitted work on REQUIRED categories can void homeowner's insurance claims related to that system, trigger mandatory disclosure at resale, result in forced demolition and redo at the owner's expense, and carry municipal fines of $500--$5,000 or more.

**Factor 4 -- Cost Comparison**

Calculate each scenario with full-cost accounting, not just material cost.

*DIY Total Cost:*
- Materials at retail price (not contractor pricing)
- Tool purchase or rental -- be specific. A tile saw rental is $60-$80/day. A drywall lift rental is $45-$60/day. Purchasing a quality oscillating multi-tool is $80-$150.
- Disposal fees -- dumpster rental ($300-$600 for a 10-yard bin) or per-bag disposal for construction debris
- Time value -- ask the user their approximate hourly value or use a conservative $25-$35/hour as a default. A 20-hour DIY project carries $500-$700 in opportunity cost.
- Retry/correction cost -- for MEDIUM and HIGH skill projects, budget 15-25% for material waste, mistakes, and rework

*Professional Total Cost:*
- Materials at contractor pricing (typically 10-20% below retail, but marked up 15-25% on invoices)
- Labor at local market rates -- use these ranges as defaults (verify these are ballpark figures and actual rates vary by region and market conditions):
  - General handyman: $60-$100/hour
  - Electrician: $80-$150/hour
  - Plumber: $85-$160/hour
  - HVAC technician: $80-$150/hour
  - Tile setter: $8-$15/sq ft installed
  - Drywall finisher: $1.50-$3.50/sq ft for patch and finish
  - Painter: $25-$75/hour or $2-$6/sq ft walls
- Permit pulling fee if applicable (contractors often charge $150-$500 to pull and manage permits)
- Cleanup and disposal (usually included in professional bids)

*Savings Threshold:* If DIY saves less than 20-25% after accounting for time value, the benefit is marginal. Below 15% savings, professional work is almost always the better value -- you gain a warranty on labor, the work is insured, and you preserve your time.

**Factor 5 -- Consequence of Failure**

Rate what happens if the work is done incorrectly and the failure is not caught immediately.

- **LOW:** The failure is cosmetic and immediately visible. Correction costs time but not significant money. Examples: uneven paint, crooked outlet covers, grout haze, caulk that doesn't adhere, a shelf that's slightly out of level.
- **MEDIUM:** The failure creates functional problems or requires significant rework to fix. May require hiring a professional to correct what DIY damaged. Examples: tile set without enough thin-set coverage (hollow spots, eventual cracking and water intrusion), drywall joints that crack because compound was applied too thick, laminate flooring that buckles because expansion gaps were insufficient, a drain trap installed with incorrect slope causing slow drainage.
- **HIGH:** The failure is latent (not immediately visible), potentially dangerous, or structurally damaging. Examples: improper wiring connections causing a junction box fire years later, a gas fitting with a slow leak, a load-bearing wall modification that shifts the roof load path, a shower pan installed without proper liner causing subfloor and joist rot, a flat roof repair that fails and allows bulk water intrusion.

---

### Step 3 -- Apply the Decision Matrix

Score the project using this logic. Apply rules in order -- the first applicable rule determines the base recommendation.

**Rule 1 -- Mandatory HIRE (no exceptions):**
- ANY factor rated HIGH for safety AND the user does not have professional trade experience in that specific trade
- Gas line work of any kind (not just line extension -- includes appliance connections beyond the flexible connector)
- Electrical service entrance work, meter base work, or service panel modifications (adding circuits, replacing the panel, upgrading service)
- Any work involving asbestos-containing materials in pre-1978 construction -- testing and abatement require licensed asbestos contractors
- Any work involving lead paint disturbance in pre-1978 homes where children under 6 or pregnant women are present -- EPA RRP Rule applies
- Structural element modification (removing walls, enlarging openings, modifying ridge beams or headers) without an engineer's sign-off

**Rule 2 -- Strong recommendation to HIRE:**
- Permit is REQUIRED and the jurisdiction requires licensed contractor for that trade
- Consequence of failure is HIGH AND the user rates themselves as no experience or only cosmetic experience
- Three or more factors are MEDIUM and the user has no experience beyond cosmetic projects

**Rule 3 -- DIY WITH PREPARATION:**
- Skill is MEDIUM, safety is LOW or MEDIUM, permit is NONE or POSSIBLE, consequence is LOW or MEDIUM, and user has at least some experience with adjacent work
- Skill is HIGH but user has directly relevant trade background (licensed or formerly licensed, or worked in the trade)
- A clearly defined stopping point exists where a professional can be called if the DIY portion goes wrong without creating an unsafe condition

**Rule 4 -- DIY:**
- All five factors are LOW
- Skill is MEDIUM but user has directly relevant experience completing similar projects successfully
- Permit is NONE, consequence of failure is LOW, safety is LOW

---

### Step 4 -- Build the Cost Comparison with Specifics

Do not use vague ranges without explanation. For each line item, state your assumption. Example: "Assuming a 120 sq ft bathroom floor, tile at $3.50/sq ft retail, thin-set and grout for $45, a tile saw rental at $65/day, and 12 hours of DIY labor valued at $30/hour, total DIY cost is approximately $530. A tile contractor in this scope typically charges $8-$12/sq ft installed including materials, or $960-$1,440. DIY savings are approximately $430-$910 (45-63%)."

If the user has not given enough information to calculate specific costs, use ranges and state assumptions clearly. Do not fabricate specificity -- "approximately $200-$400 depending on fan model" is better than a false-precision figure.

---

### Step 5 -- Identify Project-Specific Gotchas

Every project has one or two non-obvious complications that turn a routine job into a problem. Identify these for the specific project and surface them explicitly.

Examples of gotchas by project type:
- **Ceiling fan in a new location:** Requires a new switch leg or wireless remote -- if no existing wiring path exists, this becomes a MEDIUM electrical project, not a simple fixture swap
- **Replacing a toilet:** The existing flange may be corroded, broken, or set too low or high for the new toilet -- a $150 toilet job can become a $400 flange repair if not checked first
- **Adding a bathroom exhaust fan:** Venting the fan to the attic instead of through the roof is a very common DIY mistake that causes mold from moisture accumulation -- the duct must terminate outside
- **Refinishing hardwood floors:** Drum sanders are extremely aggressive and can create deep gouges in 60 seconds on softwood floors -- sanding technique on a $5,000 floor is not a beginner skill
- **Installing a dimmer switch:** LED bulbs require LED-compatible dimmers; using a wrong dimmer with LED lighting causes flickering, buzzing, or shortened bulb life
- **Deck ledger attachment:** Improper ledger-to-house connections are the leading cause of deck collapses -- flashing and fastener pattern are critical and code-regulated
- **Painting over existing paint:** Glossy surfaces and surfaces with lead paint require specific prep (deglosser, encapsulation primer, or abatement) before new paint adheres properly
- **Running new plumbing supply lines:** In homes with galvanized steel supply pipes, new copper or PEX connections require proper transition fittings -- direct contact between galvanized and copper causes galvanic corrosion

---

### Step 6 -- Construct the Preparation Checklist (If DIY or DIY With Preparation)

This checklist must be project-specific. It should cover:

- Specific tools required, including any that need to be purchased or rented (include approximate cost)
- Safety equipment specific to this project (not generic "wear gloves") -- for example, "Use a P100 respirator when cutting fiber cement board, not a dust mask"
- The one or two techniques that make the difference between a professional result and a visible mistake
- The checkpoint moment -- what to look for before proceeding that tells you whether to call a professional instead
- Any materials that need to be on hand before starting (do not leave mid-project to buy supplies -- describe what a complete material list looks like)
- The specific failure mode to watch for during and after the work

---

### Step 7 -- Construct the Hiring Guidance (If Hire or DIY With Preparation)

If the recommendation is to hire a professional, provide guidance specific to this type of work:

- What license or certification to verify (electrician vs. electrical contractor license, master plumber vs. journeyman, general contractor vs. specialty contractor)
- The right type of contractor for this specific scope (a handyman can replace a water heater in some jurisdictions; an HVAC contractor is required for refrigerant work)
- What to ask during the estimate visit (scope inclusions, permit responsibility, cleanup, warranty on labor)
- What a reasonable bid looks like for this scope -- flag if a bid is suspiciously low (suggests unlicensed, uninsured, or cutting corners) or unusually high
- Red flags specific to this trade (HVAC company that recommends full system replacement for a capacitor failure; plumber who won't pull a permit for drain relocation; roofer who wants full payment before starting)

---

### Step 8 -- Deliver the Final Assessment

Use the Output Format below. Be explicit about which rule in the decision matrix drove the recommendation. Do not hedge -- give a clear recommendation with a clear rationale. If the user's situation genuinely makes the call close, say so and explain why, but still land on a specific recommendation.

---

## Output Format

```
## DIY vs. Hire Assessment: [Project Name]

### Decision: [DIY / HIRE / DIY WITH PREPARATION]

**Decision Driver:** [State which matrix rule applies and why -- e.g., "Rule 3 applies: Skill is MEDIUM,
all other factors are LOW or MEDIUM, and user has relevant adjacent experience."]

---

### Factor Analysis
| Factor                    | Rating          | Notes                                                   |
|---------------------------|-----------------|---------------------------------------------------------|
| Skill requirement         | LOW / MED / HIGH| [Specific note explaining why this rating was assigned] |
| Safety risk               | LOW / MED / HIGH| [Specific risk and how it is managed]                   |
| Permit/code requirements  | NONE / POSS / REQ| [Jurisdiction note; flag if user should verify locally] |
| Cost comparison           | DIY FAVORED / MARGINAL / HIRE FAVORED | [Summary of savings % and time value]  |
| Consequence of failure    | LOW / MED / HIGH| [What specifically goes wrong if this fails]            |

---

### Cost Breakdown
| Line Item                       | DIY Estimate      | Professional Estimate |
|---------------------------------|-------------------|-----------------------|
| Materials                       | $[amount]         | $[amount]             |
| Tools (purchase or rental)      | $[amount]         | Included              |
| Labor / Time value              | $[hours] @ $[rate]| $[amount]             |
| Permits and fees                | $[amount]         | $[amount]             |
| Disposal                        | $[amount]         | Typically included    |
| Contingency (mistakes/rework)   | $[amount]         | $0 (warranty covers)  |
| **Total**                       | **$[amount]**     | **$[amount]**         |
| **Savings (DIY vs. Hire)**      | **$[amount] ([X]%)**|                     |

---

### Rationale
[3-4 sentences. First sentence states the recommendation plainly and the dominant reason.
Second sentence acknowledges the strongest counter-argument. Third sentence addresses why
the recommendation still holds despite that counter-argument. Fourth sentence (if DIY)
names the one most critical thing to get right.]

---

### Project-Specific Gotchas
- [Non-obvious complication 1 -- what it is and how to check for it before starting]
- [Non-obvious complication 2]
- [Non-obvious complication 3 if applicable]

---

### Preparation Checklist [Include only if DIY or DIY With Preparation]
**Tools to acquire:**
- [ ] [Tool name] -- [why needed] -- [purchase $X or rent $X/day]

**Materials to have on-site before starting:**
- [ ] [Material] -- [quantity/specification]

**Safety equipment:**
- [ ] [Specific PPE item and why it applies to this project]

**Technique checkpoints:**
- [ ] [Specific technique or test to perform before proceeding past a critical step]

**Stop and call a professional if:**
- [Condition that indicates the project has exceeded DIY scope]

---

### Hiring Guidance [Include only if HIRE or DIY With Preparation]
**Contractor type to hire:** [Specific license type, not just "a contractor"]

**Reasonable bid range for this scope:** $[low] -- $[high]

**Questions to ask during estimates:**
- [Specific question relevant to this trade and project]
- [Specific question about permits and inspections]
- [Specific question about warranty and cleanup]

**Red flags for this project:**
- [Trade-specific red flag]
- [Pricing red flag with specific threshold]
```

---

## Rules

1. **Never recommend DIY for the absolute no-exception category**, which includes: gas line work beyond the flexible connector at an appliance, any modification to the electrical service entrance or main panel (adding circuits at the breaker, replacing breakers in a Federal Pacific or Zinsco panel is particularly dangerous and always requires a licensed electrician), structural element modifications without an engineer's review, and any asbestos or lead paint disturbance in regulated situations. State this as a hard limit, not a preference.

2. **Always flag permit requirements explicitly**, even if the user did not ask about permits. Unpermitted work in required categories creates three specific problems: insurance exclusions for damage traced to that system, mandatory disclosure on sale (creating negotiation leverage for buyers and potential deal-killer status), and forced correction orders from municipalities that can require tearing out finished work.

3. **Include time value in every cost comparison.** Use the user's stated hourly value or a default of $30/hour if they say cost savings are the priority and $50/hour if they say time is the priority. A 15-hour DIY project at $30/hour carries $450 in opportunity cost that belongs in the DIY total column, not hidden.

4. **Do not let superficial similarity override accurate factor assessment.** "Replace a light fixture" and "add a new light fixture" look similar but are fundamentally different -- one is a fixture swap at an existing location (LOW skill, no permit in most jurisdictions) and the other requires running a new circuit from the panel (HIGH skill, REQUIRED permit). Ask clarifying questions to ensure the project is fully understood before scoring.

5. **For MEDIUM-rated projects, always provide a specific preparation path** rather than a blanket hire recommendation. Many homeowners can successfully complete MEDIUM-skill projects with proper preparation. Defaulting to "hire" for all MEDIUM work underestimates capable users and is not useful guidance.

6. **Never cite specific contractors, platforms, or brand-name products** as recommendations. Describing what a quality professional or quality material looks like is appropriate; endorsing specific vendors is not.

7. **Surface the project-specific gotcha before the user starts.** Every trade has a class of failure that experienced practitioners know about and beginners consistently miss. These are more valuable than generic safety warnings. A beginner tiler who doesn't know about checking tile lippage after setting will discover the problem only after the adhesive cures. A beginner deck builder who doesn't know about ledger flashing will discover the problem only after the house wall rots.

8. **Calibrate the recommendation to the specific user's stated experience**, not the generic beginner. A user who says "I've retiled two bathrooms" is not a beginner at tile work, even if they have no plumbing experience. Score Factor 1 based on their experience with this type of work, not their overall DIY experience.

9. **Treat "DIY With Preparation" as a real recommendation, not a hedge.** It should come with a concrete preparation path: specific skills to practice (on a test piece, in a low-stakes area), specific tools to acquire before starting, and a defined stopping point where a professional should take over if a condition is discovered. Vague "do some research first" guidance is not a preparation path.

10. **If the user is in a condo, townhome, or has an HOA**, flag this as a mandatory first check before evaluating the project. HOA CC&Rs can prohibit specific materials (composite decking colors, exterior paint colors, fence styles), require approved contractors, and mandate advance approval for work that affects shared building elements. In condo buildings, any work touching common elements (exterior walls, shared plumbing stacks, structural elements) typically requires board approval. Proceeding without this check can result in mandatory removal of completed work.

---

## Edge Cases

### Rental Property (User is a Tenant)
The assessment changes fundamentally. Most home improvement work requires landlord authorization regardless of who pays for it. Tenants are typically permitted to: hang artwork (small fasteners), install temporary fixtures that can be removed without damage, replace light bulbs, and perform very minor repairs. Tenants are typically NOT permitted to: paint walls, install flooring, modify plumbing or electrical, add shelving that requires wall anchors, or install any appliance requiring utility connection. Before assessing a project, ask whether the user owns the property. If they are a renter, redirect the conversation to whether landlord approval is possible, and assess only if approval is confirmed or if the scope is explicitly cosmetic and removable.

### Pre-1978 Construction (Lead Paint and Asbestos Risk)
Homes built before 1978 likely contain lead-based paint on surfaces that have been repainted over -- disturbing these surfaces during demolition, sanding, or drilling creates a regulated hazard. Homes built before 1980 may contain asbestos in: floor tiles (9x9 vinyl tiles are a strong indicator), pipe insulation, duct wrap, textured ceiling finishes (popcorn ceilings), and roof shingles. Any project involving demolition, sanding painted surfaces, or disturbing textured finishes in pre-1978/1980 construction must include a hazmat check before proceeding. The correct sequence is: (1) assume hazardous material is present, (2) have the material tested by a certified lab before disturbing it, (3) if positive, hire a licensed abatement contractor. This is not optional -- EPA RRP (Renovation, Repair, and Painting) Rule applies to contractors, but homeowners working on their own residence have fewer legal restrictions while facing the same health risks.

### Emergency Situation (Active Failure)
When a system is actively failing -- pipe leaking, circuit tripping repeatedly, furnace not igniting in winter -- skip the full cost comparison matrix and prioritize containment. The immediate actions that are always DIY-appropriate: turn off the water at the nearest shutoff valve or main, trip the circuit breaker, close the gas shutoff valve at the appliance. After containment, the full assessment applies to the permanent repair. Do not let a cost comparison conversation delay a user from stopping an active water leak. State the emergency containment steps first, then conduct the standard assessment for the repair.

### Experienced Professional or Tradesperson
If the user discloses they hold or formerly held a trade license, or worked in a trade professionally, adjust the Skill Requirement and Safety Risk ratings accordingly for that specific trade. A licensed master electrician can DIY electrical panel work. A retired plumber can perform drain-waste-vent rough-in. However, even licensed professionals must pull permits when permits are required -- the permit exception for owner-occupied home improvement exists in some jurisdictions but should be verified, not assumed. Also note: trade competency is trade-specific. A licensed electrician is not automatically qualified to assess structural work.

### Historic District or Designated Landmark Property
Properties in local, state, or federal historic districts face restrictions that go far beyond standard building code. These can include: mandatory approval of exterior material changes (even replacing like-for-like siding), restrictions on window replacement (double-pane insulated glass units may not be permitted if they alter the historic character), required use of period-appropriate materials, and design review board approval before permits are issued. Even interior modifications in nationally registered properties can be restricted if the owner is taking federal tax credits. Before completing the assessment for any project involving exterior changes, ask whether the property is in a historic district. If yes, add a mandatory step: contact the local historic preservation office before any permit application or construction decision.

### Scope Creep Discovery (Finding Hidden Problems Mid-Project)
A very common scenario: user starts a LOW-rated DIY project, opens a wall or floor, and discovers a HIGH-rated problem -- a water-damaged floor joist, knob-and-tube wiring in a wall they are renovating, a corroded main drain line under the concrete slab. Address this by building a "stop and call" threshold into every assessment for MEDIUM and HIGH consequence projects. The threshold should be specific: "If you open the wall and find insulation that looks like gray or white fluffy material instead of fiberglass batts or foam, stop work -- this may be vermiculite or asbestos-containing cellulose and requires testing before proceeding." Generic "call a professional if you're not comfortable" advice fails users at exactly the moment they need specific guidance.

### Project Spans Multiple Trades or Skill Levels
Many projects involve multiple scopes with different risk profiles. A bathroom remodel might include: tile work (MEDIUM skill, LOW risk -- DIY appropriate), plumbing rough-in relocation (HIGH skill, REQUIRED permit -- hire), electrical for a new outlet circuit (HIGH skill, REQUIRED permit -- hire), and exhaust fan installation at an existing location (MEDIUM skill, NONE permit -- DIY with preparation). When a project spans multiple trade levels, break it into components and assess each separately. The correct output is a hybrid recommendation: "DIY the tile and paint; hire a licensed plumber for the drain relocation and a licensed electrician for the new circuit."

---

## Example

**Input:** "I want to replace the tile in my 55-square-foot guest bathroom -- just the floor, not the walls. The current tile is old and cracked. I've painted rooms and replaced a faucet before but never done tile work. I have basic hand tools and a circular saw but no tile saw. I'm trying to save money but don't want to end up with a disaster."

---

## DIY vs. Hire Assessment: Bathroom Floor Tile Replacement (55 sq ft)

### Decision: DIY WITH PREPARATION

**Decision Driver:** Rule 3 applies. Skill is MEDIUM, safety is LOW, permit is NONE, cost savings are significant (47-55%), and consequence of failure is MEDIUM but not irreversible. The user has directly adjacent experience (faucet replacement shows comfort working in a bathroom setting, painting shows project follow-through) and a clear motivation to save money. With specific preparation, this is achievable.

---

### Factor Analysis
| Factor                    | Rating          | Notes                                                    |
|---------------------------|-----------------|----------------------------------------------------------|
| Skill requirement         | MEDIUM          | Tile layout, thin-set coverage, and grout application require learned technique. Floor tile is more forgiving than wall tile because gravity is not working against you, but lippage (tiles not flush with each other) is the primary failure mode and requires careful technique to avoid. |
| Safety risk               | LOW             | Demo involves a floor-level work surface. Main risks are cuts from broken tile and knee strain. Knee pads are required; heavy gloves during demo. |
| Permit/code requirements  | NONE            | Replacing floor tile in kind at the same location is cosmetic work in virtually every jurisdiction. No permit required. |
| Cost comparison           | DIY FAVORED     | DIY at approximately $380-$480 vs. professional at $700-$900. Savings of $320-$520 (47-55%) justify the time investment for a cost-motivated user. |
| Consequence of failure    | MEDIUM          | Hollow spots under tile (insufficient thin-set coverage) cause cracking and water intrusion under the tile over time, eventually requiring re-demo and re-tile. Incorrect grout application causes haze that is difficult to remove after cure. Both failures are fixable but cost time and materials to redo. |

---

### Cost Breakdown
| Line Item                       | DIY Estimate      | Professional Estimate |
|---------------------------------|-------------------|-----------------------|
| Tile (55 sq ft + 10% overage)   | $110-$220         | $110-$220             |
| Thin-set mortar (50 lb bag)     | $20               | Included in labor rate|
| Grout (10 lb bag)               | $18               | Included in labor rate|
| Tile spacers, mixing bucket, float, sponges | $25-$35 | Not applicable       |
| Tile saw rental (1-day)         | $65               | Not applicable        |
| Demo tools (floor scraper, chisel set) | $25-$40 or owned | Not applicable  |
| Disposal (construction debris bag or haul) | $20-$40 | Typically included   |
| Labor / Time value (16 hrs @ $30/hr) | $480         | $350-$500 labor       |
| Contingency (tile waste, rework) | $30-$50          | $0 (warranty covers)  |
| **Total**                       | **$793-$948**     | **$810-$1,100**       |
| **Savings (DIY vs. Hire, excl. time value)** | **$315-$480 (47-55%)** -- $160-$470 net after time value | |

*Note: Time value is included for full-cost accounting, but if the user views this as a weekend project they would otherwise spend at home, the opportunity cost is lower. The raw material-and-tool savings of $315-$480 are the more relevant figure for a cost-motivated user who has flexible weekend time.*

---

### Rationale
Bathroom floor tile replacement is the canonical entry-level tile project -- the scale is small, the work is floor-level, and mistakes are visible before grout is applied so corrections can be made. The main argument against DIY here is the MEDIUM consequence of failure: hollow spots under tiles cause future cracking and water intrusion that can damage the subfloor, meaning a failed tile job is not just cosmetic. This risk is manageable, however, because proper thin-set coverage technique (back-buttering the tile in addition to combing the subfloor, pressing firmly, and checking for hollow spots by tapping before grout) is learnable and verifiable during installation -- not a hidden failure. The single most critical skill is consistent thin-set coverage: every tile should have 95%+ contact with the mortar bed when lifted and checked during the first few tiles set.

---

### Project-Specific Gotchas
- **Subfloor condition under the existing tile.** When you demo the old tile, you may find water-damaged or soft subfloor, especially around the toilet base or near the tub/shower edge. Probe the subfloor with a screwdriver after demo -- if it sinks or feels spongy, you have a rot issue that must be repaired before tiling. Soft subfloor under new tile will cause grout cracking within months. This is the most common scope-creep scenario in bathroom floor projects.
- **Toilet removal is required.** You cannot properly tile around a toilet -- the tile must go under the toilet flange area. Remove the toilet before tiling. This is a 30-minute task but requires a new wax ring on reinstallation ($8-$12). If the flange is corroded, broken, or sits more than 1/4 inch above or below the finished tile surface, you will need a flange extender kit or a plumber to reset the flange. Check the flange condition during demo, before purchasing tile.
- **Tile saw is necessary -- a circular saw is not a substitute.** Your circular saw cannot make the precise straight cuts needed for border tiles and the cuts around the toilet flange. A $65/day tile saw rental is non-negotiable for a professional result. Score cuts with a carbide scoring tool are acceptable for straight lines only; a jigsaw with a diamond blade can handle curved cuts around the toilet flange in a pinch.
- **Existing tile height vs. door clearance.** New tile plus thin-set adds approximately 3/8 to 1/2 inch of height to the floor. Check that the bathroom door swings freely over the existing tile before starting. If clearance is already tight, you may need to trim the door bottom after tiling. Check this before demolition.

---

### Preparation Checklist

**Tools to acquire:**
- [ ] Tile saw -- rent for $65/day from a tool rental center; plan to tile on Day 2 after Day 1 demo and layout
- [ ] V-notch or square-notch trowel (1/4 inch notch for floor tile up to 12x12; 3/8 inch for larger format) -- purchase $12-$18, do not improvise with a paint scraper
- [ ] Rubber grout float -- purchase $10-$15
- [ ] Bucket and margin trowel for mixing thin-set -- purchase $15-$20 total
- [ ] Knee pads (closed-cell foam) -- purchase $15-$25; this is a non-negotiable for a 55 sq ft floor project
- [ ] Tile spacers (3/16 inch for a traditional look; 1/8 inch for a modern tight-joint look) -- $5
- [ ] Non-contact tile lippage tester or a long straightedge (48-inch level) -- purchase $25 or use an existing level

**Materials to have on-site before starting:**
- [ ] Tile -- 55 sq ft + 10% overage = 61 sq ft; round up to account for the tile layout you choose
- [ ] Polymer-modified thin-set mortar (not premixed mastic for floor tile) -- 50 lb covers approximately 40-50 sq ft at 3/8 inch bed
- [ ] Unsanded grout (for joints 1/8 inch or less) or sanded grout (for joints wider than 1/8 inch) -- 10 lb covers approximately 50 sq ft
- [ ] Grout sealer -- apply after grout cures (48-72 hours); $12-$18 per bottle
- [ ] Wax ring for toilet reinstallation -- $10-$12; purchase before demo so you have it on hand
- [ ] Cement board or uncoupling membrane if existing subfloor requires a fresh substrate layer (inspect during demo)

**Safety equipment:**
- [ ] Heavy leather gloves during tile demolition -- broken tile edges are extremely sharp
- [ ] Safety glasses during demolition and tile cutting -- tile chips are a serious eye hazard
- [ ] Knee pads throughout the entire project -- not just for comfort; kneeling on concrete subfloor for 4+ hours causes real injury

**Technique checkpoints:**
- [ ] Before grouting: tap every tile with a knuckle or the handle of a screwdriver. A hollow sound indicates insufficient thin-set contact. Remove and reset any hollow tile before grout is applied.
- [ ] During the first 3-4 tiles: lift one tile immediately after setting to inspect thin-set coverage. You should see 95% or more of the tile back covered in mortar. If coverage is low, add back-buttering (apply a thin coat of thin-set directly to the tile back before setting in addition to the combed mortar on the floor).
- [ ] Layout dry run before any adhesive is applied: lay the tiles out without mortar to check the pattern, verify cut tile sizes at the perimeter (aim for cut tiles no smaller than half a tile), and identify the starting point that produces the most balanced appearance.

**Stop and call a professional if:**
- The subfloor feels soft or spongy anywhere, especially near the toilet flange, tub, or shower threshold -- this indicates water damage and requires subfloor repair before tiling
- The toilet flange is broken, severely corroded, or more than 1/4 inch out of plane with the finished tile surface -- flange repair or reset requires a plumber
- You discover vinyl floor tiles that are 9x9 inches with a felt or fibrous backing -- these are likely asbestos-containing and must be tested before any disturbance

---

### Hiring Guidance

**Contractor type to hire:** A tile setter or finish carpenter with tile experience. For this scope, a general handyman with documented tile experience is also appropriate -- this project does not require a licensed contractor in most jurisdictions.

**Reasonable bid range for this scope:** $700-$1,100 total for a 55 sq ft floor, including materials, labor, toilet pull-and-reset, and cleanup. Bids below $500 for this scope suggest unlicensed workers, very low-grade materials, or a misunderstanding of the scope.

**Questions to ask during estimates:**
- "Does your price include pulling and resetting the toilet and purchasing a new wax ring?"
- "What thin-set product do you use, and is it polymer-modified?" (Polymer-modified thin-set is the correct answer for bathroom floors; premixed mastic is not appropriate for wet areas)
- "What do you do if you find water damage or a damaged flange after demo? Will that be a change order, and what is your rate for that additional scope?"
- "What is your warranty on the tile work against cracking or grout failure?"

**Red flags for this project:**
- Contractor who proposes to tile directly over the existing tile without removing it -- in a bathroom, this adds height that affects the toilet flange and door clearance and does not address any underlying issues with the existing installation
- Bid that does not include pulling the toilet -- this is not optional; it indicates the contractor plans to cut around the toilet rather than tile under it properly
- Contractor who cannot name the thin-set product they plan to use or who proposes to use premixed mastic (tube or bucket adhesive) for a floor in a wet area
