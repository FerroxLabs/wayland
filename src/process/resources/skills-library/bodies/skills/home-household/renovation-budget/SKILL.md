---
name: renovation-budget
description: |
  Creates detailed home renovation budgets with cost-per-square-foot estimates by project type, contingency calculations, and cost-versus-value analysis. Produces a line-item budget table with material, labor, and contingency breakdowns.
  Use when the user asks about renovation costs, remodeling budgets, home improvement estimates, kitchen or bathroom remodel pricing, or how much a renovation will cost.
  Do NOT use for new construction budgets, commercial renovation, real estate investment analysis, or interior decorating without structural changes (use interior-design-principles instead).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-maintenance planning decision-making budgeting"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Renovation Budget

## When to Use

**Use this skill when:**
- A user asks how much a specific home renovation project will cost (kitchen, bathroom, basement, addition, deck, roof, windows, flooring, etc.)
- A user wants a structured budget before meeting with contractors or applying for a home equity loan
- A user needs cost-per-square-foot benchmarks to sanity-check a contractor's bid
- A user is deciding between renovation tiers and wants to understand the cost delta between budget, mid-range, and upscale scopes
- A user asks about contingency amounts, how much to set aside for surprises, or what could go wrong cost-wise on a renovation
- A user wants to compare the cost of a renovation against the value it adds to their home at resale
- A user is working backward from a fixed budget and needs to understand what scope that budget realistically buys
- A user is planning a phased renovation over multiple years and wants to understand cost implications of sequencing

**Do NOT use when:**
- The user is building a new home from scratch -- new construction uses entirely different cost structures (stick-frame cost per sqft, site work, foundation, utility hookups) that do not map to renovation pricing
- The user needs commercial or multi-family renovation analysis -- commercial builds involve different labor classifications, permitting complexity, ADA compliance costs, and occupancy requirements
- The user wants real estate investment ROI calculations -- net present value, cap rate analysis, and rental yield math belong in a personal finance or real estate investment skill
- The user wants decorating advice without structural or system changes (use `interior-design-principles`) -- paint color selection, furniture arrangement, and soft furnishing choices are not renovation budgeting
- The user needs help evaluating or selecting a contractor (use `diy-vs-hire`) -- contractor vetting, licensing checks, and contract negotiation are a separate domain
- The user is asking about landscaping, hardscaping, or outdoor structures beyond decks (use a landscape planning skill) -- outdoor grading, irrigation systems, and retaining walls have different cost drivers
- The user has experienced a casualty loss (fire, flood, tornado) and needs an insurance claim estimate -- insurance restoration budgets operate under Xactimate pricing and depreciation schedules that differ from standard renovation pricing

---

## Process

### Step 1: Establish Project Scope and Constraints

Before producing any numbers, gather the inputs that drive every downstream calculation. Missing inputs must be flagged explicitly rather than assumed silently.

- **Project type:** Identify the primary room or system being renovated. Common categories: kitchen, primary bathroom, secondary bathroom, basement finishing, bedroom or living area, whole-home renovation, deck or patio addition, exterior siding, roof replacement, window and door replacement, HVAC/mechanical system replacement, or addition (bump-out or second story). Each has distinct cost drivers.
- **Square footage:** For rooms, use interior floor area. For roofs, use total roof deck area (typically 10-15% larger than footprint due to pitch). For siding, use exterior wall area minus window and door openings. If the user does not know, offer typical ranges: a standard kitchen runs 100-200 sqft, a primary bathroom 50-100 sqft, a secondary bath 35-60 sqft, a finished basement 600-1,200 sqft for a typical single-family home.
- **Renovation scope:** Determine whether the project is (a) cosmetic -- retaining all existing layout, plumbing rough-ins, and electrical panel/circuit locations; (b) moderate -- retaining structural walls and primary system locations but replacing cabinets, fixtures, and finishes; or (c) full gut -- removing all finishes to studs, potentially relocating plumbing drains and vents, adding circuits, or modifying framing. Layout changes are the single largest cost multiplier.
- **Home age and construction type:** Pre-1960, 1960-1980, 1980-2000, and post-2000 homes carry different risk profiles. Home age drives the contingency rate. Ask specifically whether the home has had prior renovations to those spaces -- a kitchen last remodeled in 2010 carries far less hidden-risk than a 1955 kitchen never touched.
- **Geographic region:** Labor costs vary by up to 2x between low-cost rural markets and high-cost urban metros. A mid-range kitchen remodel averaging $35,000 nationally can run $20,000 in rural Appalachia or $65,000 in San Francisco. Instruct the user that all estimates require local validation. Provide national median estimates as the default baseline and note that Pacific Coast, Northeast corridor, and major metro markets typically run 30-60% above baseline, while rural South and Midwest markets may run 15-30% below.
- **Timeline and current life situation:** Ask whether the homeowner will vacate during renovation (adds temporary housing cost), whether they intend to stay (adds scope-sequencing considerations), and whether there is a hard deadline (rushed timelines add 10-20% to labor costs due to overtime and expedited material delivery).

---

### Step 2: Classify the Renovation Tier

Tier classification is the single most important scoping decision. Misclassifying a project -- treating a gut renovation as a mid-range update -- produces a budget that is useless or actively harmful to the homeowner.

- **Budget/Cosmetic Tier:** Retains all existing layout, plumbing locations, electrical circuits, and cabinetry boxes (possibly reface or paint). Work is limited to: painting walls and ceilings, replacing hardware, swapping fixtures (faucets, light fixtures, outlet covers), installing new countertops on existing cabinets, applying new flooring over existing subfloor (if in good condition), and refreshing tile grout or caulk. Typical project duration: 1-3 weeks. Does NOT require moving any supply or drain lines.
- **Mid-Range Tier:** Replaces all finishes and major components -- full cabinet replacement, new countertops, new flooring to subfloor, new fixtures, new lighting plan -- but keeps all supply and drain lines in their existing rough-in locations, keeps the existing electrical panel with circuit additions only (no panel upgrade), and retains all structural walls. May add a kitchen island if plumbing and gas are not required. Typical project duration: 4-10 weeks. Requires permits in most jurisdictions for electrical work.
- **Upscale Tier:** Involves at least one of the following: structural wall removal or relocation, moving a plumbing drain or vent stack, adding a wet bar or second sink requiring new drain lines, upgrading the electrical panel (100A to 200A), converting from electric to gas range (new gas line), custom millwork and built-ins, radiant floor heating, steam shower or soaking tub requiring reinforced floor framing, or premium imported materials with long lead times. Typical project duration: 10-20+ weeks. Always requires permits and inspections.
- **When tier is ambiguous:** If the user says "I want to update my bathroom" without specifying scope, present all three tiers with cost ranges and ask them to self-select. Never default to the budget tier to make numbers look appealing.

---

### Step 3: Apply Cost-Per-Square-Foot Baselines

Use the following national median baseline ranges. These represent fully installed cost including materials, labor, permits, and a standard 15% contingency. They are NOT contractor markup-free material costs.

| Project Type | Budget/Cosmetic | Mid-Range | Upscale |
|---|---|---|---|
| Kitchen | $75-$130/sqft | $130-$275/sqft | $275-$500+/sqft |
| Primary bathroom | $60-$110/sqft | $110-$225/sqft | $225-$450+/sqft |
| Secondary/hall bathroom | $50-$90/sqft | $90-$180/sqft | $180-$350+/sqft |
| Basement finishing | $25-$45/sqft | $45-$80/sqft | $80-$160+/sqft |
| Bedroom or living room refresh | $15-$30/sqft | $30-$65/sqft | $65-$130+/sqft |
| Whole-home renovation | $35-$55/sqft | $55-$110/sqft | $110-$225+/sqft |
| Deck addition (pressure-treated) | $15-$25/sqft | $25-$45/sqft | $45-$100+/sqft |
| Exterior siding replacement | $4-$8/sqft | $8-$18/sqft | $18-$40+/sqft |
| Roof replacement (asphalt) | $3-$5/sqft | $5-$10/sqft | $10-$20+/sqft |
| Window replacement (per window) | $300-$500/ea | $500-$900/ea | $900-$2,000+/ea |
| Flooring only (per sqft installed) | $3-$6/sqft | $6-$14/sqft | $14-$30+/sqft |
| HVAC replacement (central system) | $5,000-$8,000 flat | $8,000-$14,000 flat | $14,000-$25,000+ flat |

**Important calibration notes:**
- Kitchens and bathrooms are NOT priced purely by square footage -- they are dominated by fixture and cabinet costs. A 100 sqft kitchen and a 175 sqft kitchen may have similar cabinet costs. Use the per-sqft ranges only as a first approximation; break them into line items for accuracy.
- Basement finishing cost depends heavily on ceiling height, egress window requirements, and moisture mitigation needs. A wet basement adds $3,000-$15,000 before finish work begins.
- Whole-home renovation rates apply when 60%+ of the home's interior is being renovated simultaneously. Economies of scale from shared mobilization and simultaneous trades reduce per-sqft cost compared to room-by-room work.

---

### Step 4: Build the Line-Item Budget

Never present only a cost-per-sqft total. Always decompose the budget into categories that allow the user to make trade-off decisions.

**Standard cost allocation percentages by project type:**

For a kitchen renovation:
- Cabinets: 25-35% of total project cost (largest single line item by far)
- Countertops: 8-12% of total
- Appliances: 10-20% of total (user-supplied vs. contractor-supplied changes this)
- Labor (all trades combined): 30-40% of total
- Flooring: 5-8% of total
- Plumbing fixtures (sink, faucet, disposal): 3-5% of total
- Lighting and electrical: 4-7% of total
- Backsplash and tile: 3-6% of total
- Permits and inspections: 1-3% of total
- Dumpster rental and debris removal: 1-2% of total

For a bathroom renovation:
- Tile (floor and wall): 20-30% of total
- Labor (tile setter, plumber, electrician, finish carpenter): 35-45% of total
- Vanity and countertop: 10-15% of total
- Tub/shower system (including valve and trim): 12-20% of total
- Toilet: 2-4% of total
- Lighting and exhaust fan: 3-6% of total
- Permits and inspections: 2-4% of total
- Accessories (towel bars, mirror, medicine cabinet): 2-4% of total

**Labor cost breakdown by trade (national median hourly/daily rates):**
- General contractor overhead and profit: typically 15-25% markup on all subs and materials
- Plumber: $85-$150/hour; rough-in work billed per fixture or per day ($800-$1,500/day)
- Licensed electrician: $80-$140/hour; panel upgrade adds $1,500-$4,000 flat
- Tile setter: $8-$18/sqft installed (labor only), higher for mosaic or large-format tile
- Finish carpenter: $70-$120/hour; cabinet installation $75-$150/cabinet
- Painter: $2-$6/sqft walls, $3-$7/sqft ceilings (includes prep and primer)
- Flooring installer: $3-$8/sqft labor for LVP or hardwood; $6-$15/sqft for tile
- HVAC technician: $100-$150/hour; ductwork modifications $50-$80/linear foot

---

### Step 5: Set the Contingency Rate

Contingency is not a slush fund -- it is a calculated risk premium based on measurable risk factors. Always present contingency as a line item, never embed it silently in the base numbers.

**Contingency rate decision matrix:**

| Condition | Contingency Add |
|---|---|
| Home built after 2000, no known issues | 10% base |
| Home built 1980-2000, standard conditions | +3-5% (total 13-15%) |
| Home built 1960-1980 | +5-8% (total 15-18%) |
| Home built before 1960 | +10-12% (total 20-22%) |
| Known prior water damage (even if repaired) | +5% additional |
| Renovation involves opening walls or subfloor | +3-5% additional |
| Project in high-seismic or hurricane zone (additional code requirements) | +3-7% additional |
| Supply chain volatility for specialty materials | +2-5% additional |
| Homeowner has never renovated before (decision fatigue, change orders) | +3-5% additional |

Cap the total contingency recommendation at 30% -- beyond that, the underlying estimate is too uncertain to be useful and the project requires a professional assessment before budgeting.

**What contingency actually covers (itemize this for the user):**
- Subfloor damage discovered during demo: $500-$4,000 to sister or replace joists
- Hidden water damage in walls: $1,000-$8,000 depending on extent and mold presence
- Outdated wiring requiring panel upgrade or new circuits: $1,500-$5,000
- Galvanized supply pipe that cannot be reused: $2,000-$6,000 to repipe affected areas
- Asbestos abatement (floor tile, pipe insulation, drywall compound pre-1980): $1,500-$8,000 per affected area
- Lead paint stabilization or abatement (pre-1978): $1,000-$5,000
- Code-compliance upgrades triggered by permit: GFCI outlets, arc-fault breakers, ventilation requirements
- Material price increases between estimate and purchase: 5-15% on lumber, tile, and cabinet materials

---

### Step 6: Perform Cost-Versus-Value Analysis

Cost-versus-value analysis tells the homeowner what fraction of renovation spend they typically recoup in increased home sale price. It is a decision-making tool, not a guarantee.

**National median cost recovery rates (Remodeling Magazine Cost vs. Value methodology):**

| Project | Average Cost Recovery |
|---|---|
| Garage door replacement | 90-100% (highest ROI of any project) |
| Minor kitchen remodel (cosmetic, $10K-$20K) | 72-82% |
| Manufactured stone veneer exterior | 88-96% |
| Entry door replacement (steel) | 75-85% |
| Deck addition (wood) | 65-75% |
| Window replacement (vinyl) | 64-72% |
| Major kitchen remodel ($50K+) | 52-62% |
| Primary bathroom addition | 54-65% |
| Bathroom remodel (mid-range) | 60-70% |
| Primary suite addition | 50-62% |
| Basement finishing | 58-68% |
| Roof replacement (asphalt) | 55-65% |
| Second-story addition | 45-58% |

**Contextual rules for cost-versus-value interpretation:**
- ROI is highest when the home is under-improved relative to neighborhood comparables. Renovating the worst kitchen on the block recovers far more than renovating an already-nice kitchen.
- ROI is lowest when the renovation is taste-specific (unusual tile patterns, non-neutral colors, highly personalized layouts).
- In a strong seller's market with low inventory, buyers accept homes as-is more readily -- renovation ROI compresses because unimproved homes also sell well.
- The homeowner's holding period matters: a homeowner staying 10+ years derives substantial living value from the renovation independent of resale recovery. Frame cost-versus-value as a resale metric, not a quality-of-life metric.
- Always compute: (renovation cost) minus (estimated value added) = net cost to the homeowner. This is the true out-of-pocket cost net of value gain.

---

### Step 7: Identify Cost-Saving Opportunities

For each budget, provide at least three specific, quantified cost-saving strategies. These must be specific to the project type, not generic advice.

**Kitchen-specific savings:**
- Stock cabinets vs. semi-custom: saves $3,000-$8,000 on a typical kitchen. Stock cabinets from major home improvement retailers are available in 3-inch increments; filler strips close gaps. Quality has improved significantly -- stock boxes are now comparable to semi-custom construction.
- Laminate countertops vs. quartz: saves $1,500-$4,500. Modern laminate with realistic stone patterns is indistinguishable from a distance and appropriate for budget and mid-range tiers.
- Keep existing cabinet layout: moving a sink across the room costs $1,500-$4,000 in plumbing labor alone (extending drain lines, relocating vents). Moving an island with electrical adds another $800-$2,000.
- Appliance package deals: buying a matching suite from one manufacturer at a retailer during a promotional event saves 15-25% vs. purchasing individual units.
- Tile backsplash DIY installation: a motivated homeowner can tile a backsplash over a weekend with proper prep. Saves $300-$800 in labor; materials are identical.

**Bathroom-specific savings:**
- Prefab shower surround vs. custom tile: saves $1,500-$4,000. Acrylic surrounds have 40-year life spans, require no grout maintenance, and install in half the time.
- Standard toilet vs. wall-hung: wall-hung toilets require a steel carrier frame installed in the wall ($800-$1,500 extra) and complicate future repairs. Save $600-$1,200 by using a floor-mounted close-coupled toilet.
- Vanity from a supply house vs. custom built: prefabricated vanities with pre-cut tops are $400-$1,200; custom-built vanity with separate countertop runs $2,000-$5,000+.
- Resurface vs. replace tub: professional tub resurfacing (reglazing) costs $400-$650 and lasts 10-15 years with proper care. Tub replacement plus tile work runs $2,000-$6,000.

**Universal savings strategies:**
- Do your own demolition: gut demo on a bathroom or kitchen takes 1-2 days and saves $800-$2,500 in labor. Requires proper PPE, dumpster rental ($300-$500), and verification of asbestos/lead status before disturbing materials.
- Purchase materials directly and pay contractor labor only: most general contractors mark up materials 10-20%. Buying tile, flooring, and fixtures directly saves this markup -- but the contractor must agree to this arrangement in advance.
- Sequence work to avoid trade return trips: mobilization charges are real. Plan work so plumber rough-ins, electrical rough-ins, inspection, drywall, and finish trades flow in sequence without gaps. Each unnecessary return trip costs $150-$400 minimum.

---

### Step 8: Produce the Budget Document

Assemble all calculations into the structured output format. Every budget must include: project summary, line-item breakdown, material detail for the specific project type, cost-vs-value analysis, cost-saving strategies, and next steps checklist. Do not omit sections because the user did not ask for them -- all sections add value.

---

## Output Format

```
## Renovation Budget: [Project Type] -- [Tier]

### Project Summary
| Parameter              | Value                              |
|------------------------|------------------------------------|
| Project type           | [Kitchen / Bathroom / Basement / etc.] |
| Renovation area        | [X] sqft                           |
| Renovation tier        | [Budget / Mid-Range / Upscale]     |
| Home age               | [Year built or era]                |
| Layout changes         | [Yes -- [describe] / No]           |
| Cost-per-sqft range    | $[low]--$[high]                    |
| Contingency rate       | [X]%                               |
| Geographic adjustment  | [National baseline / +X% for [region]] |

---

### Line-Item Budget
| Category                     | Estimated Cost   | % of Subtotal |
|------------------------------|------------------|---------------|
| Materials (all items)        | $[amount]        | [X]%          |
| Labor (all trades)           | $[amount]        | [X]%          |
| Permits and inspections      | $[amount]        | [X]%          |
| Debris removal / dumpster    | $[amount]        | [X]%          |
| Design / architectural fees  | $[amount]        | [X]%          |
| **Subtotal (base estimate)** | **$[amount]**    | **100%**      |
| Contingency ([X]%)           | $[amount]        | --            |
| **Total Budget**             | **$[amount]**    | --            |

---

### Material Cost Detail
| Material / Component         | Specification              | Estimated Range   |
|------------------------------|----------------------------|-------------------|
| [Component 1]                | [Spec / grade description] | $[low]--$[high]   |
| [Component 2]                | [Spec / grade description] | $[low]--$[high]   |
| [Component 3]                | [Spec / grade description] | $[low]--$[high]   |
| [Component 4]                | [Spec / grade description] | $[low]--$[high]   |
| [Component 5]                | [Spec / grade description] | $[low]--$[high]   |

---

### Labor Cost Detail
| Trade                        | Scope of Work              | Estimated Range   |
|------------------------------|----------------------------|-------------------|
| [Trade 1]                    | [Specific tasks]           | $[low]--$[high]   |
| [Trade 2]                    | [Specific tasks]           | $[low]--$[high]   |
| [Trade 3]                    | [Specific tasks]           | $[low]--$[high]   |

---

### Contingency Risk Register
| Risk Item                    | Probability    | Estimated Cost if Triggered |
|------------------------------|----------------|-----------------------------|
| [Risk 1 -- specific to project] | [Low/Med/High] | $[low]--$[high]             |
| [Risk 2]                     | [Low/Med/High] | $[low]--$[high]             |
| [Risk 3]                     | [Low/Med/High] | $[low]--$[high]             |

---

### Cost vs. Value Analysis
| Metric                           | Value                        |
|----------------------------------|------------------------------|
| Total renovation budget          | $[amount]                    |
| Project type resale recovery     | [X]--[Y]%  (national median) |
| Estimated resale value added     | $[low]--$[high]              |
| Net homeowner cost after recovery| $[low]--$[high]              |
| Primary value driver             | [Living quality / Resale / Both] |
| Market context note              | [Statement about local market applicability] |

---

### Cost-Saving Opportunities
| Strategy                          | Estimated Savings    | Trade-Off             |
|-----------------------------------|----------------------|-----------------------|
| [Specific strategy 1]             | $[low]--$[high]      | [What you give up]    |
| [Specific strategy 2]             | $[low]--$[high]      | [What you give up]    |
| [Specific strategy 3]             | $[low]--$[high]      | [What you give up]    |

---

### Assumptions and Caveats
- [Key assumption 1 -- e.g., existing subfloor is in good condition]
- [Key assumption 2 -- e.g., no asbestos or lead paint present]
- [Key assumption 3 -- e.g., plumbing and electrical pass inspection without upgrades]
- All estimates reflect national median costs. Verify against local contractor quotes.

---

### Next Steps Checklist
- [ ] Obtain 3 competitive bids from licensed local contractors to establish true local pricing
- [ ] Schedule pre-renovation walkthrough with a contractor to identify hidden risks before finalizing contingency
- [ ] Confirm permit requirements with your local building department for this scope of work
- [ ] Open a dedicated renovation savings account and fund contingency before construction begins
- [ ] [Project-specific next step 1]
- [ ] [Project-specific next step 2]
```

---

## Rules

1. **Never present a single-point estimate.** All cost figures must be presented as ranges (low-to-high). The spread communicates inherent uncertainty -- a single number creates false precision and erodes trust when actual costs differ.

2. **Contingency is mandatory, not optional.** Every budget must include a contingency line item explicitly labeled as such. If a user says "just give me the base cost without contingency," explain why that produces an unusable budget and present the contingency separately so they can see it -- but never omit it entirely.

3. **Classify tier before calculating cost.** Never produce a dollar figure without first establishing whether the project is budget, mid-range, or upscale. A "bathroom remodel" can legitimately cost $4,000 or $40,000 -- the tier classification is what makes the estimate meaningful.

4. **Cost-per-sqft is a starting point, not the answer for kitchens and bathrooms.** Kitchen and bathroom budgets are driven primarily by fixture count, cabinet linear footage, and tile square footage -- not floor area. A 100 sqft kitchen with a large island, custom range hood, and premium appliances will massively exceed a 200 sqft kitchen with stock cabinets and basic appliances. Always break kitchens and baths into component line items.

5. **Flag permits proactively for every project involving electrical, plumbing, HVAC, or structural work.** Unpermitted work creates title and insurance problems at resale. Many homeowners do not know that replacing a water heater, adding a circuit, or finishing a basement requires a permit. Include permits in the budget regardless of whether the user mentions them.

6. **Regional adjustment is required disclosure, not optional commentary.** Every budget output must include a statement that national median estimates were used and that the user must validate against local contractor quotes. Pacific Coast and Northeast metro areas routinely run 40-70% above national median. Not disclosing this sets false expectations.

7. **When the user states a fixed budget, work backward.** Calculate the working budget after contingency (total budget ÷ 1.contingency rate), then determine what scope and tier that supports. Present this clearly. Never produce a wish list that exceeds the stated budget -- it wastes the user's time and creates anchor bias.

8. **Appliances are a separate conversation in kitchen budgets.** Appliance costs vary from $2,000 (builder-grade suite) to $20,000+ (professional range, column refrigerator) and are often user-supplied rather than contractor-supplied. Always break appliances out as a separate line and ask whether the user plans to supply them or purchase through the contractor.

9. **Pre-1978 homes require explicit hazardous material disclosure.** Anytime home age is pre-1978, flag lead paint and asbestos as potential cost items requiring professional testing before demo. Under the EPA Renovation, Repair and Painting (RRP) Rule, contractors working on pre-1978 homes must be RRP-certified. Budget $300-$500 for testing before demolition and $1,500-$8,000 per material type for abatement if present.

10. **Round consistently and appropriately.** Round project totals over $10,000 to the nearest $500. Round line items between $1,000 and $10,000 to the nearest $100. Round items under $1,000 to the nearest $25. Excessive false precision (e.g., "$27,342") signals misplaced confidence in an estimate; excessive rounding (e.g., "roughly $25,000-$40,000") is too vague to be useful for budgeting.

11. **Change orders are the #1 budget killer -- name them explicitly.** Warn users that change orders (scope additions after contract signing) average 10-15% of project cost on kitchen and bath renovations. Every time the homeowner changes a selection after work begins, it costs more than the original scope. Decision finality before construction is worth emphasizing.

12. **Do not recommend specific brands or product lines.** Describe materials by category and grade (stock cabinets, semi-custom cabinets, full-custom cabinets; quartz countertop, granite countertop, engineered stone; luxury vinyl plank, engineered hardwood, solid hardwood) without naming specific manufacturers or retailers.

---

## Edge Cases

### Fixed Budget Constraint
When the user states a specific dollar ceiling, the calculation works backward. Divide the stated budget by (1 + contingency rate as decimal) to find the working base budget. Example: user has $30,000 for a kitchen remodel in a 1990 home. Contingency rate: 17%. Working base budget: $30,000 ÷ 1.17 = $25,600. At $125-$275/sqft mid-range, $25,600 supports 93-205 sqft. For a 150 sqft kitchen, the affordable tier is low mid-range -- achievable with stock or semi-custom cabinets, laminate or entry-level quartz countertops, and LVP flooring. Present this as a scope statement: "Your $30,000 budget (including 17% contingency) supports a mid-range kitchen refresh at approximately 150 sqft if you use stock cabinetry, laminate or entry-level quartz countertops, and LVP flooring. Full custom cabinets or stone tile flooring would push the project into a range your budget cannot absorb."

### Phased Renovation
When renovation is planned across multiple calendar years, add 5-8% to the total estimated cost for phasing inefficiency. This covers: repeated mobilization fees (each phase has setup and teardown costs), temporary finishes between phases (patching drywall where future trades will re-open), protecting completed work during active construction in adjacent areas, and the certainty that material and labor costs will increase between phases. Additionally: if Phase 1 involves any shared systems (electrical panel, plumbing stack, HVAC) that Phase 2 also touches, it is almost always cheaper to address those systems in Phase 1 even if Phase 2 is two years away. Opening walls twice costs more than opening them once. Identify and flag shared-system dependencies explicitly.

### Home Built Before 1960 -- Known and Unknown Hazards
Homes pre-dating 1960 may contain: lead paint on all painted surfaces (pre-1978), asbestos in floor tiles (9x9 vinyl floor tile from the 1950s-60s is almost certainly asbestos-containing), pipe insulation (wrap on heating pipes), roof felt, drywall joint compound (pre-1977), and exterior siding (asbestos cement shingles). Knob-and-tube wiring (pre-1940s) cannot legally be covered with insulation and triggers a full panel and wiring evaluation in most jurisdictions when a permit is pulled. Galvanized steel water supply pipes are nearly 70 years old in a 1955 home -- they are near or at end of life and have reduced interior diameter from corrosion. Cast iron drain lines may be partially deteriorated. Add $2,500-$5,000 per identified hazard type to the contingency register. Do not price abatement as a certainty -- price it as a probabilistic contingency item.

### Homeowner Plans Significant DIY Labor
When the user intends to do meaningful work themselves (beyond minor tasks like painting), present a modified budget that separates "owner-supplied labor" from "contractor labor" as distinct lines. Quantify the labor savings using the trade rates from Step 4. Then add critical caveats: (1) Most jurisdictions require licensed electricians and plumbers to pull permits -- DIY electrical and plumbing may not pass inspection. (2) DIY work that must be re-done by a contractor due to code failure can cost more than hiring a professional from the start. (3) Tile installation, drywall finishing, and cabinet installation are skill-dependent -- a poor tile job is expensive to remediate. Reserve DIY for demolition, painting, and fixture installation where quality risk is lowest and licensing is not required.

### Post-Disaster Renovation (Flood, Fire, Mold)
When the renovation follows water damage, fire, or significant mold, the budget must include remediation costs before any renovation scope begins. Water damage remediation: $1,500-$10,000 depending on extent, class of water (clean, gray, or black), and whether mold is present. Mold remediation: $500-$6,000 for a contained bathroom wall; $10,000-$30,000 for structural framing contamination. Fire damage: smoke and soot cleaning of HVAC and ductwork adds $2,000-$5,000; structural char evaluation is required before rebuilding. In all post-disaster cases, note that if the homeowner has a homeowners insurance claim in progress, the insurance adjuster's estimate (produced in Xactimate) uses different unit pricing than standard contractor estimates. The homeowner may need a public adjuster if the insurance estimate appears to undervalue the loss.

### Renovation to Sell (Pre-Listing Prep)
When the user states they are renovating specifically to sell the home, shift the framing of the entire analysis toward cost-versus-value ROI rather than quality of finish. Key guidance for pre-listing renovations: (1) Never exceed the top-of-market comparable for the neighborhood -- over-improving produces the lowest ROI. (2) Focus on high-ROI items first: garage door replacement, fresh exterior paint, cleaned landscaping, minor kitchen refresh, and fresh neutral interior paint. (3) Avoid upscale finishes entirely -- future buyers have their own tastes and will not pay a premium for your specific premium choices. (4) Budget for staging ($1,500-$3,500) and professional photography ($300-$800) as part of the renovation-to-sell investment -- these have among the highest measurable ROI of any pre-listing expenditure.

### New Addition vs. Renovation
When the user wants to add square footage (bump-out, sunroom, second story, accessory dwelling unit), flag that addition costs use different unit pricing from renovation costs. Additions involve: new foundation or structural extension ($15,000-$40,000 for a ground-level addition depending on type), new roofline tie-in, exterior wall framing, new exterior envelope (siding, windows, roofing), and full interior finish. Addition costs typically run $150-$350/sqft of new gross floor area for a basic mid-range quality -- this is 2-3x higher per sqft than interior renovation because every square foot of addition requires full structural, envelope, and finish work from scratch. Ensure the user understands this distinction before budgeting.

### Luxury Material Long Lead Times
When the project involves premium materials with long manufacturing or shipping lead times -- custom cabinetry (8-16 weeks), imported stone slabs (4-10 weeks), specialty tile (6-12 weeks), custom windows and doors (10-20 weeks) -- flag that project scheduling must account for procurement. A common and expensive mistake: starting demolition before materials are on-site. A gutted kitchen waiting 10 weeks for cabinets costs the homeowner in temporary kitchen setup ($500-$2,000), contractor remobilization fees ($500-$1,500), and potential storage fees for early-delivered materials. Recommend the user confirm all material lead times and have materials on-site or in confirmed transit before demo begins.

---

## Example

**Input:** "I want to redo my primary bathroom. It's about 75 square feet. The house was built in 1987. I want to replace the tub with a walk-in tile shower, new double vanity, new tile floors, and new toilet. I'm not moving any walls but I'll need to relocate the drain for the shower pan."

---

**Output:**

## Renovation Budget: Primary Bathroom -- Mid-Range

### Project Summary
| Parameter              | Value                                        |
|------------------------|----------------------------------------------|
| Project type           | Primary bathroom                             |
| Renovation area        | 75 sqft                                      |
| Renovation tier        | Mid-Range (trending Upscale due to drain relocation) |
| Home age               | 1987 (1980--2000 era)                        |
| Layout changes         | Yes -- shower drain relocation required       |
| Cost-per-sqft range    | $130--$225/sqft (adjusted upward for drain work) |
| Contingency rate       | 20% (1980--2000 era + wall/subfloor opening) |
| Geographic adjustment  | National baseline -- verify against local contractor quotes |

---

### Line-Item Budget
| Category                     | Estimated Cost   | % of Subtotal |
|------------------------------|------------------|---------------|
| Materials (all items)        | $8,500           | 42%           |
| Labor (all trades)           | $9,200           | 46%           |
| Permits and inspections      | $600             | 3%            |
| Debris removal / dumpster    | $400             | 2%            |
| Design / planning            | $1,300           | 7%            |
| **Subtotal (base estimate)** | **$20,000**      | **100%**      |
| Contingency (20%)            | $4,000           | --            |
| **Total Budget**             | **$24,000**      | --            |

*Cost per sqft on base estimate: $267/sqft -- above the mid-range ceiling due to drain relocation. This is appropriate and expected.*

---

### Material Cost Detail
| Material / Component         | Specification                              | Estimated Range    |
|------------------------------|--------------------------------------------|--------------------|
| Floor tile                   | 12x24 porcelain, mid-grade                 | $700--$1,200       |
| Shower wall tile             | Large-format porcelain or ceramic, 75 sqft | $1,200--$2,500     |
| Shower pan / linear drain    | Custom mud bed with linear drain           | $400--$800         |
| Shower valve and trim        | Thermostatic or pressure-balance, chrome   | $350--$700         |
| Shower glass enclosure       | Semi-frameless, 36--48" entry              | $900--$2,200       |
| Double vanity (60")          | Pre-fabricated, soft-close, with top       | $1,200--$2,500     |
| Faucets (x2)                 | Single-hole or 3-hole, brushed nickel      | $200--$500         |
| Toilet                       | Elongated comfort height, 1.28 gpf         | $200--$500         |
| Vanity light fixture         | LED bar, 36--48"                           | $150--$400         |
| Exhaust fan                  | 110 CFM with timer, code-required          | $100--$250         |
| Accessories                  | Towel bars, robe hook, toilet paper holder | $150--$400         |
| Drywall and backer board     | Cement board in wet areas                  | $200--$500         |
| Paint and primer             | Bathroom-specific moisture-resistant       | $100--$200         |

---

### Labor Cost Detail
| Trade                        | Scope of Work                                              | Estimated Range  |
|------------------------------|------------------------------------------------------------|------------------|
| Plumber                      | Remove tub, relocate drain 18--24", set new shower rough-in, connect vanity, set toilet | $2,500--$4,000 |
| Tile setter                  | Demo old tile, install cement board, tile floor (75 sqft) and shower walls (approx. 90 sqft), grout and seal | $2,500--$4,500 |
| Electrician                  | New exhaust fan circuit (likely required by code), GFCI outlets, vanity light circuit | $600--$1,200 |
| Finish carpenter / general   | Demo, vanity installation, accessories, paint, trim        | $1,500--$2,500   |
| Drywall                      | Patch and finish after plumbing and electrical rough-in    | $400--$800       |

---

### Contingency Risk Register
| Risk Item                                  | Probability | Estimated Cost if Triggered  |
|--------------------------------------------|-------------|------------------------------|
| Subfloor rot beneath tub (common in 1987 homes with original caulk) | High | $800--$3,000 |
| Shower drain relocation hits cross-member or cast iron stack requiring reroute | Medium | $600--$2,000 |
| Existing exhaust fan ductwork not code-compliant (terminates in attic vs. exterior) | Medium | $300--$700 |
| Galvanized supply stub-outs corroded, require copper or PEX replacement at valves | Low--Medium | $400--$1,200 |
| Tile adhesion failure on original concrete subfloor (grind or self-level required) | Low | $300--$800 |

*Total contingency: $4,000 -- within the estimated risk exposure above. If all risks triggered simultaneously, exposure would reach $8,000, which is why 20% contingency is the minimum for this scope.*

---

### Cost vs. Value Analysis
| Metric                           | Value                                              |
|----------------------------------|----------------------------------------------------|
| Total renovation budget          | $24,000                                            |
| Project type resale recovery     | 60--70% (primary bathroom remodel, national median)|
| Estimated resale value added     | $14,400--$16,800                                   |
| Net homeowner cost after recovery| $7,200--$9,600                                     |
| Primary value driver             | Both -- daily living quality and resale appeal     |
| Market context note              | Recovery rate is higher in markets where comparable homes have updated primary baths. If neighbors have updated baths, this renovation closes a competitive gap and may recover 70--80%. If the neighborhood has mostly original baths, recovery is closer to the national median. |

---

### Cost-Saving Opportunities
| Strategy                                           | Estimated Savings   | Trade-Off                                                    |
|----------------------------------------------------|---------------------|--------------------------------------------------------------|
| Framed shower with acrylic panel vs. custom tile   | $2,500--$4,500      | Less custom appearance; appropriate for resale-focused projects but less premium than tile |
| Single vanity (48") vs. double vanity (60")        | $400--$1,000        | Reduces counter space; impacts functionality for two-person households |
| Standard mud-bed shower pan vs. linear drain       | $300--$600          | Conventional center drain is less contemporary in appearance but fully functional and easier to maintain |
| Owner-supplied toilet and faucets                  | $150--$400 in markup| Homeowner must coordinate delivery timing and accept responsibility for product selection |
| DIY demolition (remove tub, old tile, vanity)      | $600--$1,200        | 1--2 days labor; requires dumpster ($300--$500) and verified asbestos/lead status before disturbing any 1987-era materials |

---

### Assumptions and Caveats
- Existing subfloor is structurally sound and not waterlogged beneath the current tub area. Opening the floor may reveal damage requiring joist sistering or subfloor replacement.
- No asbestos is present in existing floor tile or wall materials. The home was built in 1987, after the primary asbestos phase-out, but some products continued into the late 1980s. If any floor tile or adhesive appears to be original 9x9 vinyl composition tile, test before disturbing.
- The existing electrical panel has capacity for one new circuit for the exhaust fan. If the panel is a Federal Pacific or Zinsco brand (common in 1987 homes and subject to recall concerns), budget an additional $2,000-$4,000 for panel replacement -- this is outside this project scope but should be flagged.
- Drain relocation assumes the existing drain can be moved within the existing joist bay without cutting structural members. Joist bays in a 1987 home are typically 16" on center; a 24-inch relocation may require a header.
- All estimates reflect national median costs. This project in a Northeast metro area may run $28,000-$34,000; in a rural Midwest market, $17,000-$21,000. Obtain 3 local bids before finalizing the budget.

---

### Next Steps Checklist
- [ ] Obtain 3 competitive bids from licensed local contractors; ask each to scope the drain relocation specifically and confirm their plumber has inspected the access point under the subfloor before pricing
- [ ] Have existing floor tile and any vinyl sheet goods tested for asbestos by a certified inspector before demo ($150-$300) -- 1987 is close enough to the hazard era to warrant testing
- [ ] Confirm permit requirements with your local building department: plumbing permit (drain relocation) and electrical permit (new circuit) are almost certainly required; verify whether a separate building permit is needed
- [ ] Finalize all material selections -- tile, vanity, fixtures, glass enclosure -- before signing a contract. Specify in the contract that these selections are locked; any change orders will be priced in writing before proceeding
- [ ] Establish a dedicated renovation account and deposit the full $24,000 (including $4,000 contingency) before construction begins
- [ ] Identify temporary bathroom access during the renovation: this project will render the primary bath non-functional for 3-5 weeks; confirm a secondary bathroom is available or budget for other arrangements
