---
name: flooring-selection
description: |
  Compares flooring types (hardwood, LVP, laminate, tile, carpet) across traffic durability, moisture resistance, budget, DIY-ability, and maintenance requirements. Produces a scored comparison matrix with a recommendation based on the user's room conditions and priorities.
  Use when the user asks about choosing flooring, comparing flooring options, flooring for specific rooms, or the best floor type for their situation.
  Do NOT use for flooring installation instructions (use tile-installation for tile, or general DIY guidance), subfloor repair, or commercial flooring specifications.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-maintenance decision-making analysis"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Flooring Selection

## When to Use

**Use this skill when:**
- A user asks which flooring type to choose for a specific room -- kitchen, bathroom, basement, bedroom, living room, entryway, laundry room, mudroom, sunroom, or home gym
- A user wants to compare two or more flooring materials side by side (e.g., "Is LVP better than laminate for my situation?")
- A user needs flooring that meets specific constraints -- moisture exposure, pet traffic, wheelchair accessibility, radiant heating compatibility, or allergy management
- A user asks about flooring cost per square foot, total project budget, or long-term cost-of-ownership for different flooring types
- A user describes room conditions (slab subfloor, below-grade basement, high humidity, open floor plan) and needs help filtering their options
- A user is preparing to sell a home and wants to know which flooring choice maximizes resale value
- A user explicitly asks for a flooring comparison matrix, a scored recommendation, or wants to understand trade-offs across multiple options

**Do NOT use when:**
- The user needs step-by-step installation instructions -- use `tile-installation` for tile work, or a general DIY installation skill for click-lock flooring
- The user needs subfloor repair, leveling compound application, or moisture remediation -- those are distinct structural tasks outside this skill's scope
- The user needs commercial or industrial flooring specifications (epoxy coatings, rubber gym flooring, VCT tile for commercial kitchens) -- those involve building codes, ADA compliance, and OSHA standards not covered here
- The user is selecting flooring finish color, stain tone, grout color, or visual design matching -- use `interior-design-principles` for aesthetic decisions once the flooring type is chosen
- The user needs flooring for an outdoor space (deck, patio, porch) -- exterior materials like composite decking, pavers, and outdoor porcelain tile operate under entirely different criteria
- The user is asking about carpet pad selection, underlayment type alone, or adhesive products without a broader flooring decision -- those are installation-context questions
- The user has already decided on a flooring type and just needs help buying it -- direct them to the appropriate installation or purchasing skill

---

## Process

### Step 1: Gather Room Conditions and User Priorities

Before scoring anything, collect enough information to apply hard disqualifiers and weight the scoring matrix accurately. Missing information leads to inappropriate recommendations.

**Room geometry and location:**
- Room type (kitchen, bathroom, basement, etc.) -- this alone triggers several hard disqualifiers
- Square footage (length x width in feet; for irregular rooms, break into rectangles and sum)
- Floor location relative to grade: above-grade, on-grade slab, or below-grade (basement)
- Subfloor type: plywood over joists, OSB over joists, or concrete slab
- Ceiling height clearance if adding flooring thickness matters (door clearance, stair nosing)

**Environmental conditions:**
- Moisture exposure level -- use these specific categories:
  - **Dry:** Bedroom, living room, no moisture sources nearby
  - **Occasional spills:** Kitchen, dining room, mudroom
  - **Frequent wet:** Bathroom, laundry room, utility room
  - **Below-grade or high humidity:** Basement, crawlspace-adjacent areas
- Sunlight exposure: direct south- or west-facing windows accelerate UV fading in hardwood and LVP without UV inhibitors
- HVAC control: is the space climate-controlled year-round? Unheated garages or three-season sunrooms have extreme humidity swings that disqualify solid hardwood and some LVP products

**Traffic and use patterns:**
- Traffic level: light (guest bedroom), moderate (living room, home office), heavy (kitchen, entryway, main hallway), extreme (mudroom with outdoor access)
- Household composition: number of adults, children under 10 (spills, crayon, dropped food), elderly occupants (slip resistance), infants (floor-level comfort and hardness)
- Pets: species, size, and number matter -- a single small cat has different scratch impact than three 80-pound dogs; dog urine penetration is the decisive moisture failure mode for hardwood and laminate

**Budget:**
- Total project budget in dollars, or budget per square foot installed
- Whether DIY installation is desired, feasible, or required to stay in budget
- Whether the user values long-term cost of ownership or minimizing upfront spend

**Priorities ranking:** Ask the user to rank these if they have not volunteered the information:
1. Budget (upfront cost)
2. Durability and lifespan
3. Moisture resistance
4. DIY installability
5. Aesthetics and feel underfoot
6. Maintenance ease
7. Resale value impact
8. Specific functional needs (allergen control, slip resistance, sound absorption)

### Step 2: Apply Hard Disqualifiers Before Scoring

Hard disqualifiers eliminate flooring types that will physically fail in the environment. Do not score eliminated options -- doing so misleads users by making an impossible option look competitive. Apply these in order:

**Moisture-based disqualifiers:**
- **Solid hardwood:** Eliminate in any below-grade space (basement), bathroom, laundry room, or kitchen unless the user explicitly acknowledges the risk and plans for extraordinary moisture management. Solid wood at equilibrium moisture content of 6-8% will cup, buckle, or delaminate when ambient humidity exceeds 60% for extended periods.
- **Laminate:** Eliminate in all wet rooms (bathroom, laundry room) and high-spill kitchens. Laminate uses an HDF core that swells irreversibly when water penetrates seams. Even "waterproof" laminate marketing claims apply only to the surface layer -- seam penetration remains a failure point.
- **Standard carpet:** Eliminate in kitchens (hygiene -- grease and food bacteria), bathrooms (mold and mildew growth in backing), and basement slab installations without a moisture vapor barrier system. Carpet over a damp slab is a mold incubation environment.

**Structural disqualifiers:**
- **Solid hardwood:** Eliminate over concrete slab -- solid hardwood must be nail-down installed into a wood subfloor. It can be glue-down over concrete only in specific conditions (bone-dry slab, above-grade, controlled humidity) and most installers advise against it.
- **Nail-down flooring formats (solid hardwood, some engineered):** Eliminate over concrete without a plywood subfloor system, which adds $1.50-$3.00/sqft in subfloor material and installation cost.
- **Large-format porcelain tile (24"x24" or larger):** Flagged (not eliminated) on joist-and-subfloor systems -- verify floor deflection is within L/360 (the standard tile industry threshold). Undersized joists that flex cause cracked grout and cracked tiles.

**Application-based disqualifiers:**
- **Carpet:** Eliminate for allergy-sensitive households where the user identifies dust mite, pet dander, or respiratory allergies as a priority. Carpet retains 4-8x the allergen load of hard-surface flooring of equivalent area.
- **Solid hardwood, laminate:** Flag (not eliminate) for households with large dogs -- the user should weigh scratch risk explicitly.
- **Polished porcelain tile:** Flag for households with elderly occupants or toddlers -- the Coefficient of Friction (COF) for wet polished tile can fall below the 0.42 minimum recommended by the Americans with Disabilities Act (ADA). Textured or matte-finish tile with a COF of 0.60+ is safer.

### Step 3: Build the Candidate Master Comparison Matrix

Once disqualifiers are applied, evaluate surviving options against the full specification matrix below. Use this as a reference -- do not copy the entire matrix into output unless the user asks for a full comparison. Extract the relevant rows for the scored output.

| Feature | Solid Hardwood | Engineered Hardwood | LVP | Laminate | Porcelain Tile | Ceramic Tile | Carpet |
|---|---|---|---|---|---|---|---|
| **Material cost ($/sqft)** | $5-$15 | $4-$12 | $2-$7 | $1-$5 | $3-$12 | $1-$8 | $1-$6 |
| **Installed cost ($/sqft)** | $8-$22 | $7-$18 | $4-$10 | $3-$8 | $8-$20 | $5-$15 | $3-$10 |
| **Wear layer / hardness metric** | Janka hardness 900-2300 lbf depending on species | Janka same as solid top layer | Wear layer 6-40 mil | AC rating AC1-AC5 | Glazed surface (PEI 0-5 rating) | PEI 0-5 rating | Face weight 20-80 oz |
| **Moisture resistance** | Poor -- will cup, swell, buckle | Moderate -- tolerates humidity better than solid; not waterproof | Excellent -- 100% waterproof core | Poor (surface) / Varies (core) | Excellent -- impermeable | Excellent -- impermeable | Poor -- backing traps moisture |
| **Below-grade suitable** | No | Some products with vapor barrier | Yes | No | Yes | Yes | Only with comprehensive moisture management |
| **Subfloor type required** | Plywood nail-down preferred; glue-down on dry above-grade slab only | Glue, float, or nail-down; works over concrete with vapor barrier | Float over almost any flat surface | Float over flat surface | Mortar set over backerboard, concrete, or cement board | Same as porcelain | Stretch-in over any subfloor |
| **Min subfloor flatness** | 3/16" over 10 ft | 3/16" over 10 ft | 3/16" over 10 ft | 3/16" over 10 ft | 1/8" over 10 ft (large format 1/8" over 6 ft) | 1/8" over 10 ft | Tolerant |
| **Traffic durability** | High -- refinishable | High -- limited refinish cycles (1-3 depending on veneer thickness) | High -- wear layer dependent | Moderate -- AC4/AC5 for high traffic; AC1-AC3 wears quickly | Very high -- glazed surface is among hardest flooring | High | Low to Moderate -- fiber crushes under sustained point load |
| **Refinishability** | 5-10 times (0.75" solid) | 1-3 times (1.5-4mm veneer typical) | None -- replace individual planks | None | None | None | None -- replace |
| **Pet scratch resistance** | Low-Moderate (species matters; Brazilian cherry at Janka 2350 better than pine at 870) | Low-Moderate | High (wear layer 20 mil+) | Moderate (AC4+) | Excellent | Excellent | N/A (shows stains/odors instead) |
| **Pet urine resistance** | None -- urine wicks into wood grain permanently | None -- same failure mode | Excellent -- impermeable to liquid | None -- HDF core wicks moisture | Excellent | Excellent | None -- urine bonds to carpet backing, pad, and subfloor |
| **DIY difficulty** | Hard (nail gun, moisture acclimation, precise cutting) | Moderate (float or glue, acclimation required) | Easy (click-lock, no acclimation, basic saw) | Easy to Moderate (click-lock but requires flat subfloor prep) | Hard (wet saw, mortar mixing, grouting, leveling) | Hard | Moderate (requires stretcher tool, tack strips, seaming) |
| **Acclimation required** | Yes -- 3-5 days minimum in room at final temp/humidity | Yes -- 24-48 hours | No -- dimensionally stable | Yes -- 48 hours | No | No | No |
| **Lifespan** | 50-100+ years (with refinishing) | 20-50 years | 15-25 years (quality products) | 10-20 years | 50-75+ years | 40-60 years | 5-15 years |
| **Cost per year (lifetime)** | $0.09-$0.44/sqft/yr | $0.14-$0.90/sqft/yr | $0.16-$0.67/sqft/yr | $0.15-$0.80/sqft/yr | $0.11-$0.40/sqft/yr | $0.08-$0.38/sqft/yr | $0.20-$2.00/sqft/yr |
| **Maintenance requirements** | Refinish every 7-15 years; sweep weekly; no wet mop | Refinish 1-2 times over life; damp mop only | Sweep/damp mop; no wax | Sweep/damp mop; no steam cleaner | Grout sealing every 1-3 years; regrout every 10-15 years | Same as porcelain | Vacuum 1-2x weekly; professional deep clean yearly |
| **Allergen performance** | Good -- hard surface, easy to sweep | Good | Excellent -- nonporous | Good | Excellent | Excellent | Poor -- traps allergens, dust mites, pet dander |
| **Underfoot comfort** | Hard | Hard | Hard (slightly warmer than tile) | Hard (hollow sound without underlayment) | Cold, hard | Cold, hard | Soft, warm, high cushion |
| **Sound insulation (IIC rating)** | Low without underlayment | Low to moderate | Moderate with attached pad | Moderate with underlayment | Very low -- highest sound transmission | Very low | Very high -- best sound absorption |
| **Radiant heat compatible** | No -- expansion risk; some manufacturers void warranty above 80°F subfloor temp | Yes -- most products rated to 80-85°F subfloor temp | Yes -- most rated to 80-85°F; check max temp | Yes -- most rated to 80-85°F | Yes -- best conductor; fastest heat response | Yes | No -- insulates, reducing radiant efficiency |
| **Resale value impact** | High positive -- buyers recognize and pay premium for solid hardwood | Moderate positive | Neutral to positive (quality-dependent) | Neutral | High positive in kitchens and bathrooms | Moderate positive | Neutral to negative -- many buyers discount or plan to replace |
| **Eco / VOC concerns** | Natural material; finish VOCs during refinishing | Adhesive in core may off-gas; look for CARB Phase 2 compliance | PVC-based; look for FloorScore or GREENGUARD certification | Formaldehyde in HDF core; look for CARB Phase 2 or E1/E0 rating | No VOC concern | No VOC concern | Adhesives and backing can off-gas; look for Green Label Plus certification |

### Step 4: Score Remaining Candidates Against User Priorities

For each surviving flooring type, score it 1-5 on each criterion relevant to the user's situation. Use the definitions below to ensure consistent scoring -- do not assign scores intuitively.

**Budget Fit (1-5):**
- 5 = Installed cost is 25% or more below the user's stated budget
- 4 = Installed cost is within budget with room to spare
- 3 = Installed cost exactly meets the budget
- 2 = Installed cost exceeds budget by up to 25%
- 1 = Installed cost exceeds budget by more than 25% or is structurally unaffordable

**Moisture Suitability (1-5):**
- 5 = Fully waterproof; appropriate for wet rooms and below-grade
- 4 = High moisture resistance; appropriate for kitchens, moderate spills
- 3 = Moderate moisture resistance; appropriate for dry rooms with occasional spills
- 2 = Low moisture resistance; marginal for the stated environment
- 1 = Will fail in the stated environment (should already be eliminated)

**Traffic Durability (1-5):**
- 5 = Rated for heavy commercial or extreme residential traffic; will outlast the building
- 4 = Rated for heavy residential traffic; expected lifespan 30+ years
- 3 = Suitable for moderate traffic; will show wear in 10-20 years under heavy use
- 2 = Light-duty only; will degrade visibly within 5-10 years under stated traffic
- 1 = Inappropriate for traffic level stated

**DIY Feasibility (1-5):**
- 5 = First-time DIYer can complete with basic tools (utility knife, tapping block, pull bar); no special equipment
- 4 = Confident DIYer with a miter saw and basic experience can complete successfully
- 3 = Requires renting specialized tools (wet saw, floor nailer) or has a significant learning curve
- 2 = Professional strongly recommended; mistakes are costly to undo
- 1 = Professional installation required for warranty or structural reasons

**Aesthetic Match (1-5):**
- Score based on user's stated aesthetic preference -- warm/natural, modern/minimal, traditional, rustic, or neutral
- 5 = Strong match to stated aesthetic
- 3 = Neutral -- works but not the user's ideal
- 1 = Direct conflict with stated aesthetic

**Maintenance Burden (1-5):**
- 5 = Sweep and damp mop; no periodic treatments required
- 4 = Minor annual maintenance (grout sealing, occasional deep clean)
- 3 = Moderate periodic maintenance (refinishing possible but infrequent)
- 2 = Regular maintenance required or periodic professional service needed
- 1 = High maintenance burden relative to user's stated tolerance

**Weighting multipliers:** Apply 2x weight to the two or three criteria the user identified as highest priority. Apply 1x weight to secondary criteria. This prevents a high score on an irrelevant criterion from distorting the recommendation.

**Weighted total formula:**  
Sum of (score x weight) across all criteria = weighted total. Compare totals to rank candidates. A difference of 5+ points indicates a clear recommendation; a difference of 1-4 points indicates two equally valid options where user preference should decide.

### Step 5: Calculate the Full Cost Estimate

Never present material cost alone. Full installed cost includes:

**Material cost:** Base sqft price x square footage with waste allowance
- Rectangular rooms with minimal cuts: add 7-8% waste
- Diagonal installation, rooms with many angles or cutouts: add 12-15% waste
- Tile: add 10% for straight lay, 15% for diagonal or herringbone

**Installation cost:**
- DIY: $0 labor; add tool rental if applicable ($30-$75/day for wet saw, $40-$65/day for floor nailer)
- Professional installation rate benchmarks (these vary significantly by region -- present as ranges):
  - LVP click-lock: $1.50-$3.00/sqft labor
  - Engineered hardwood (float): $2.00-$4.00/sqft labor
  - Solid hardwood (nail-down): $3.00-$6.00/sqft labor
  - Porcelain/ceramic tile: $4.00-$12.00/sqft labor (complexity-dependent)
  - Carpet (stretch-in): $0.50-$1.50/sqft labor

**Necessary add-ons:**
- Underlayment: $0.25-$0.75/sqft if not pre-attached to plank; required for most floating floors
- Moisture barrier / vapor retarder: $0.10-$0.30/sqft for below-grade or slab installations
- Transition strips (T-molding, reducer, threshold, end cap): $10-$35 per transition
- Removal and disposal of existing flooring: $1.00-$3.00/sqft (carpet is cheapest to remove; tile is most expensive)
- Subfloor prep (leveling compound, plywood overlay): $1.00-$4.00/sqft if needed

**Long-term cost of ownership (annualized):**  
Calculate as: (total installed cost + expected maintenance costs over lifespan) / lifespan in years  
Present this metric when the user is debating a cheaper short-life option versus a more expensive long-life option. A $1,500 laminate floor replaced every 12 years costs $125/year. A $4,000 engineered hardwood floor lasting 40 years costs $100/year and may be refinished rather than replaced.

### Step 6: Identify the Recommendation and Runner-Up

**Primary recommendation criteria:**
- Highest weighted score among surviving candidates
- Passes all hard disqualifiers
- Total installed cost fits within the user's stated budget (if over budget, flag explicitly and offer a scaled-down approach)

**Runner-up criteria:**
- State the specific condition under which the runner-up becomes the better choice (e.g., "if you plan to stay in this home 30+ years," "if a professional is already on-site for another project," "if pet accidents are your single biggest concern")
- Do not present a runner-up that fails any hard disqualifier

**When to decline to recommend:** If the user's budget is genuinely insufficient for any appropriate flooring in their room conditions (e.g., $0.75/sqft for a bathroom), state this clearly. Recommending an inappropriate product to hit a budget number causes real harm -- the floor will fail and need replacement sooner.

### Step 7: Provide Actionable Next Steps

Every recommendation must end with a checklist of the 3-5 most important next actions specific to the chosen flooring type. These should be concrete, sequenced, and executable -- not generic advice.

**Examples of specific next steps by flooring type:**
- **LVP:** Confirm subfloor flatness with a long straightedge; select a wear layer of 20 mil or greater; order with at least 8% overage; verify the product's maximum temperature rating if near a sliding glass door with direct sun (surface temps can exceed 100°F)
- **Tile:** Pull a permit if required by local jurisdiction; identify whether the existing subfloor meets L/360 deflection; rent or purchase a quality wet saw (not an angle grinder for cuts near walls); plan grout joint width and color before ordering
- **Solid hardwood:** Measure room humidity over 7 days; deliver and acclimate the wood in the room before installation begins; select species Janka hardness appropriate for traffic (oak at 1290 lbf is a minimum threshold for heavy traffic)
- **Carpet:** Specify face weight (minimum 35 oz for bedrooms, 40+ oz for living rooms under heavy traffic); choose solution-dyed nylon for pet households (color goes all the way through the fiber, masking fading from pet urine cleaners)

---

## Output Format

```
## Flooring Recommendation: [Room Type]

### Room Profile
| Parameter           | Value                                     |
|---------------------|-------------------------------------------|
| Room                | [type and any relevant sub-location]      |
| Area                | [X] sqft                                  |
| Grade / Subfloor    | [above-grade plywood / on-grade slab / below-grade concrete] |
| Moisture exposure   | [dry / occasional spills / frequent wet / below-grade high humidity] |
| Traffic level       | [light / moderate / heavy / extreme]      |
| Household factors   | [pets (species, size, number), children ages, allergy status, mobility needs] |
| Budget              | $[X]–$[Y] total / $[A]–$[B] per sqft installed |
| Installation method | [DIY / Professional / Flexible]           |
| Aesthetic priority  | [warm-natural / modern-minimal / traditional / neutral] |
| Special conditions  | [radiant heat / open floor plan / home sale within X years / etc.] |

---

### Options Eliminated
| Flooring Type        | Reason Eliminated                                          |
|----------------------|------------------------------------------------------------|
| [Flooring type]      | [Specific technical disqualification with brief rationale] |
| [Flooring type]      | [Specific technical disqualification with brief rationale] |

---

### Scored Comparison (Surviving Options)

Priority weights: [List the 2-3 criteria weighted 2x, and which are 1x]

| Criteria             | Weight | [Option 1]       | [Option 2]       | [Option 3]       |
|----------------------|--------|------------------|------------------|------------------|
| Budget fit           | [1x/2x]| [1-5] ([rationale]) | [1-5] ([rationale]) | [1-5] ([rationale]) |
| Moisture suitability | [1x/2x]| [1-5] ([rationale]) | [1-5] ([rationale]) | [1-5] ([rationale]) |
| Traffic durability   | [1x/2x]| [1-5] ([rationale]) | [1-5] ([rationale]) | [1-5] ([rationale]) |
| DIY feasibility      | [1x/2x]| [1-5] ([rationale]) | [1-5] ([rationale]) | [1-5] ([rationale]) |
| Aesthetic match      | [1x/2x]| [1-5] ([rationale]) | [1-5] ([rationale]) | [1-5] ([rationale]) |
| Maintenance burden   | [1x/2x]| [1-5] ([rationale]) | [1-5] ([rationale]) | [1-5] ([rationale]) |
| [Additional criteria]| [1x/2x]| [1-5] ([rationale]) | [1-5] ([rationale]) | [1-5] ([rationale]) |
| **Weighted Total**   |        | **[X]**          | **[X]**          | **[X]**          |

---

### Primary Recommendation: [Flooring Type]

**Why this choice:**
[3-5 sentences. Lead with the decisive factor that makes this the winner. Name specific product specifications the user should look for (wear layer thickness, Janka rating, AC rating, PEI rating, etc.). Acknowledge any trade-off the user is accepting.]

**Key product specifications to look for:**
- [Specific spec 1 with threshold value]
- [Specific spec 2 with threshold value]
- [Spec 3 with threshold value if applicable]

**Full Budget Estimate:**
| Component                  | Calculation                                  | Cost Range         |
|----------------------------|----------------------------------------------|--------------------|
| Material                   | [X+waste%] sqft x $[low]–$[high]/sqft       | $[low]–$[high]     |
| Underlayment               | [X] sqft x $[rate] (if needed)              | $[low]–$[high]     |
| Moisture barrier           | [X] sqft x $[rate] (if applicable)          | $[low]–$[high]     |
| Removal of existing floor  | [X] sqft x $[rate]                          | $[low]–$[high]     |
| Subfloor prep              | [description if needed]                     | $[low]–$[high]     |
| Labor (professional)       | [X] sqft x $[rate] OR DIY                  | $[low]–$[high] / $0|
| Transition strips          | [number] transitions x $[rate]             | $[low]–$[high]     |
| Tool rental (DIY)          | [tool] x [days] if applicable               | $[low]–$[high]     |
| **Total Installed**        |                                              | **$[low]–$[high]** |
| **Annualized (lifespan)**  | $[total] / [X] years                        | **$[X]/year**      |

---

### Runner-Up: [Flooring Type]
**Weighted score:** [X]
**Choose this instead if:** [Specific condition that flips the recommendation -- be precise]
**Trade-off accepted:** [What you give up vs. the primary recommendation]
**Estimated installed cost:** $[low]–$[high]

---

### What to Watch Out For
- [Specific installation pitfall for this flooring type in this room context]
- [Common shopping mistake for this product category]
- [Maintenance mistake that shortens lifespan of this specific material]

---

### Next Steps (in sequence)
- [ ] [Concrete first action specific to chosen flooring type]
- [ ] [Second action -- measurement, subfloor prep, or product specification]
- [ ] [Ordering action with waste calculation]
- [ ] [Pre-installation action -- acclimation, permits, subfloor testing]
- [ ] [Optional: professional consultation trigger -- when to stop DIY and call a pro]
```

---

## Rules

1. **Apply hard disqualifiers before scoring -- never score a flooring type that will physically fail in the stated environment.** A flooring type that scores 48 out of 50 on secondary criteria but has a moisture disqualifier is still wrong for the room. Scoring it suggests it is a viable option.

2. **Never present material cost without installed cost.** A user who sees "$2/sqft laminate" and assumes that is their total cost will be surprised by $3-$6/sqft in additional installation, underlayment, and accessory costs. The installed cost is the real number.

3. **Include 10% waste overage as a default -- 15% for tile, diagonal installations, or rooms with significant cutouts.** Flooring sold per box rounds up to the nearest box anyway, and leftover material is valuable for future repairs. Running out mid-installation means waiting for a re-order and hoping dye lots match.

4. **For pet households, weight pet urine resistance heavily, not just scratch resistance.** Scratch resistance is recoverable (rugs, refinishing). Urine damage to solid hardwood and laminate is permanent -- it penetrates the wood grain and subfloor, requiring plank replacement and sometimes subfloor repair. This is the single most common flooring regret in pet-owning households.

5. **Always calculate and present annualized cost of ownership when comparing a budget option to a premium option.** The $1/sqft laminate versus the $6/sqft engineered hardwood comparison looks obvious until you calculate that the laminate replaced every 12 years over a 40-year period costs $0.08-$0.10/sqft/year more than buying the engineered hardwood once. This reframe changes many budget-focused decisions.

6. **Do not recommend flooring above the user's stated budget without explicitly flagging it as over-budget and explaining why it is worth considering.** Recommending a $15,000 project when the user said $5,000 without explicit acknowledgment is disrespectful of their constraint. If you make the case for spending more, make it with specific ROI reasoning.

7. **Radiant heat compatibility must be checked against specific product specifications, not assumed by category.** "LVP is generally compatible with radiant heat" is not sufficient -- some LVP products have maximum subfloor temperature ratings of 65°F, making them incompatible with typical radiant systems. When radiant heat is present, instruct the user to verify their specific product's temperature rating.

8. **Subfloor flatness thresholds are non-negotiable.** LVP and engineered hardwood require the subfloor to be flat within 3/16" over a 10-foot span. Tile requires 1/8" over 10 feet (or 1/8" over 6 feet for tiles larger than 15" on any side). Installing over an out-of-flat subfloor causes clicking planks, cracked grout, and premature failure. If subfloor prep is needed, include it in the budget estimate.

9. **VOC and formaldehyde off-gassing matter for households with children, pregnant occupants, or immune-compromised members.** Specifically: HDF-core laminate and some engineered hardwoods use urea-formaldehyde binders. Look for CARB Phase 2 compliance (California Air Resources Board standard, the strictest U.S. standard) or the European E1 / E0 rating for engineered products. LVP should be FloorScore or GREENGUARD Gold certified. Carpet should carry the Carpet and Rug Institute Green Label Plus certification.

10. **Resale value context only applies when the user mentions selling the home.** Do not volunteer resale value impact as a reason to choose hardwood over LVP in every recommendation -- resale value is one factor among many, and a user who plans to stay in their home for 20 years should optimize for livability and total cost of ownership, not resale perception. When resale is mentioned, flag that solid hardwood in main living areas and tile in bathrooms and kitchens consistently produce the highest return, while carpet in bedrooms has become neutral-to-negative in most markets.

11. **Never recommend a flooring type that requires a structural modification (adding plywood subfloor, reinforcing joists) without explicitly stating the modification, its cost, and the fact that it should be assessed by a professional.** Hidden structural costs can double a flooring project budget.

12. **If the user's described conditions conflict (e.g., "I want hardwood in my basement"), address the conflict directly.** Explain the specific failure mechanism (wood expands and cups when ambient relative humidity rises above 60%, which is common below grade), then offer the closest alternative that meets their aesthetic goal (wide-plank LVP in a wood-look finish achieves a similar aesthetic and is appropriate below grade).

---

## Edge Cases

### Radiant Floor Heating Systems
Flooring selection over radiant heat requires additional constraints beyond the standard matrix. Solid hardwood is incompatible with most radiant systems -- the repeated thermal cycling causes seasonal expansion and contraction that opens gaps in winter (dry, hot) and cups in summer (humid, cool). Even manufacturers who allow solid hardwood over radiant heat limit it to narrow-width planks (under 3" wide) and require the subfloor temperature to never exceed 80°F. The practical recommendation is to avoid solid hardwood entirely in radiant heat applications.

Engineered hardwood performs well over radiant heat because the cross-ply construction limits the seasonal movement that damages solid planks. Porcelain tile is the gold standard for radiant heat -- it conducts heat most efficiently, has no thermal expansion concerns, and is compatible with all hydronic and electric mat systems. LVP is compatible with most radiant systems but requires verification of the specific product's maximum rated subfloor temperature (most are 80-85°F, but some budget products are rated lower). Laminate is nominally compatible but the HDF core is moisture-sensitive and thermal cycling can accelerate seam failure over time.

When a user mentions radiant heat, add a checklist item: verify the product's radiant heat compatibility and maximum subfloor temperature in writing before purchasing.

### Concrete Slab Subfloor (On-Grade and Below-Grade)
Concrete slabs introduce two complications: moisture vapor transmission and the absence of a nailable substrate.

**Moisture testing is mandatory before any flooring installation over concrete.** The industry-standard test is ASTM F2170 (relative humidity probe test, requires drilling into the slab) or ASTM F1869 (calcium chloride test). As a low-cost field test, tape a 24" x 24" piece of clear polyethylene plastic to the slab with all edges sealed using duct tape. Leave it for 72 hours. Condensation or darkening of the concrete beneath indicates active moisture vapor emission requiring a vapor barrier or epoxy moisture mitigation system before flooring. This field test is qualitative -- if moisture is found, recommend professional testing with ASTM F2170 before proceeding.

Acceptable moisture vapor emission rate (MVER) thresholds:
- LVP: Most manufacturers require MVER below 5 lbs/1,000 sqft/24 hours (calcium chloride) or RH below 85% (probe test)
- Engineered hardwood: Typically MVER below 3 lbs/1,000 sqft/24 hours or RH below 75%
- Tile: No moisture concern (cement-based adhesives are unaffected)

If moisture levels exceed thresholds, the user must either install an epoxy vapor barrier system ($1.00-$3.00/sqft) or choose tile as the only practical option.

**Solid hardwood on slab:** Technically possible with a floating installation system (engineered only) or a glue-down application, but only for above-grade, bone-dry slabs with MVER below 3 lbs. Most flooring manufacturers void the warranty for glue-down hardwood over slab. Present this as a non-recommended option even when technically permissible.

### Open Floor Plans Spanning Multiple Rooms
When flooring must transition across a kitchen-living room-dining room open plan, continuity of material is the professional standard. Transition strips within a continuous open space look inexpensive and break visual flow. Hardwood or LVP can run continuously through all three zones if the room conditions allow it (moisture disqualifiers still apply at zone-specific points like the kitchen sink area).

If the user wants hardwood in the living/dining zones but the kitchen zone disqualifies hardwood on moisture grounds, the practical approach is:
1. Run LVP through all zones (compromise on aesthetic for continuity)
2. Use tile in the kitchen only, with a well-planned transition strip at the kitchen boundary
3. Accept that porcelain tile laid on the same plane as hardwood requires a reducer transition strip ($10-$25) that, when properly chosen, looks intentional

When specifying continuous flooring across an open plan, add 5% to the waste calculation for the additional cutting and fitting at interior walls and obstacles. Plan the plank layout direction before installation -- diagonal layout unifies a space visually but increases waste by 12-15% and installation difficulty significantly.

### Very Low Budget Situations (Under $2/sqft Material)
At material costs below $2/sqft, the realistic and honest options are:
- **Entry-level laminate (AC2-AC3 rating):** Appropriate for light-traffic bedrooms and living rooms in dry environments. Expected lifespan 8-12 years with normal care. Not appropriate for kitchens or bathrooms.
- **Low-grade LVP (6-8 mil wear layer):** The wear layer will show scratching and surface damage within 3-5 years under moderate traffic. Appropriate only for low-traffic rooms or temporary/rental situations.
- **Loop or level-cut pile carpet (20-25 oz face weight):** Budget end of the carpet market. Expect fiber crush and matting within 3-5 years under normal foot traffic.

Be transparent with the user: a $1.50/sqft material budget will not produce a durable, attractive floor in high-traffic areas. If budget is genuinely this constrained, recommend they focus on the highest-impact room only and choose the best LVP product they can afford at 6 mil minimum wear layer, understanding that it is a temporary solution. Do not recommend solid hardwood, engineered hardwood, porcelain tile, or quality LVP with 20 mil wear layers at this price point -- the installed cost will be 3-5x the material cost and far exceeds the stated budget.

### Wheelchair and Mobility Aid Use
Hard-surface flooring is strongly preferred, but surface texture and transition details matter more than the flooring category. Specific guidance:

- **Surface texture:** Smooth to slightly textured is best. Heavily embossed or hand-scraped hardwood, deeply textured tile, and shag carpet all create rolling resistance and potential tipping hazards for wheelchair users.
- **Grout lines:** Standard grout joints in tile (1/8" to 3/16" for planks, up to 1/4" for large format) are typically fine for wheelchair wheels. Decorative mosaic tile with many small grout joints (1-2" tiles) creates vibration and resistance.
- **Transitions:** ADA guidelines recommend transitions be flush or beveled to no more than 1/4" vertical rise. Standard T-molding transitions with a peak height of 5/8" or more can catch front casters and cause tip-overs. Specify flush-mount or low-profile transition systems.
- **Carpet:** If carpet is chosen for warmth or fall protection in a bedroom, specify low-pile commercial-grade carpet (loop pile, 1/4" or less pile height) with a firm pad -- not the thick, soft residential padding that creates rolling resistance.
- **LVP recommendation:** Wide-plank LVP (5" to 9" wide planks) with a smooth surface finish and low-profile transitions is typically the strongest recommendation for mobility-aid users who prefer a warm residential look. It eliminates grout lines, provides a smooth rolling surface, and transitions easily to other rooms.

### Flooring Over Existing Flooring (Double-Layer Installation)
Some users want to install new flooring over existing vinyl, tile, or hardwood rather than removing it. The key considerations:

- **Height clearance:** Adding a flooring layer raises the floor height by the thickness of the new material (typically 3/8" to 3/4"). Check door clearance (standard interior doors clear 3/4" to 1" above the subfloor), stair nosing fit, and transitions to adjacent rooms.
- **Acceptable base layers for floating LVP:** Firmly bonded existing sheet vinyl (no bubbles or loose areas), existing laminate, existing ceramic or porcelain tile (if grout lines are not excessively deep or the surface is skim-coated with floor leveler). Never install floating LVP over carpet.
- **Prohibited combinations:** Do not install tile over tile without removing the bottom layer -- the total thickness and additional weight exceed what most joist systems are designed for, and there is no way to achieve the required flatness for mortar adhesion.
- **When removal is mandatory:** Existing floor is water-damaged, has mold, is loose or delaminating, or the new floor type requires nailing or screwing into the subfloor.

When a user mentions installing over existing flooring, flag the height impact and confirm the existing floor is in good condition before recommending a skip-removal approach.

### High-End Aesthetic Priorities with Budget Mismatches
Occasionally a user describes a design vision (wide-plank white oak hardwood, large-format 24"x48" porcelain slab tile) that significantly exceeds their stated budget. Handle this as follows:

1. Acknowledge the aesthetic direction -- it is a legitimate target
2. Present the closest achievable alternative within budget (wide-plank LVP in a white oak pattern instead of solid white oak; 12"x24" porcelain instead of large-format slab)
3. Present the actual cost of the aspirational option with a specific dollar gap and an honest assessment of whether it is achievable with a timeline or phased approach
4. Never substitute a clearly inferior aesthetic without explaining why -- users deserve to make informed trade-offs, not be redirected without understanding what they are giving up

---

## Example

**Input:** "We're finishing our basement to make a family room and kids' playroom -- it's about 600 square feet on a concrete slab. We have one medium-sized dog. Two kids, ages 4 and 7. I care a lot about durability and easy cleaning, and my total budget for flooring is $4,000-$5,500. We're not opposed to DIY but have never done flooring before."

**Output:**

## Flooring Recommendation: Basement Family Room / Playroom

### Room Profile
| Parameter           | Value                                                            |
|---------------------|------------------------------------------------------------------|
| Room                | Below-grade basement -- family room and playroom combined        |
| Area                | 600 sqft                                                         |
| Grade / Subfloor    | Below-grade concrete slab                                        |
| Moisture exposure   | High humidity potential -- below-grade concrete vapor emission risk |
| Traffic level       | Heavy -- young children, dog, daily family use                   |
| Household factors   | 1 medium dog, children ages 4 and 7 (spills, rough play, dropped food) |
| Budget              | $4,000–$5,500 total ($6.67–$9.17/sqft installed)               |
| Installation method | DIY preferred (no prior experience)                              |
| Aesthetic priority  | Not specified -- assume warm and comfortable over cold/clinical   |
| Special conditions  | Below-grade; concrete slab; first-time DIY                       |

---

### Options Eliminated
| Flooring Type          | Reason Eliminated                                                           |
|------------------------|-----------------------------------------------------------------------------|
| Solid hardwood         | Cannot be installed on below-grade concrete slab; moisture will cause cupping and buckling; not nailable into concrete without plywood subfloor system |
| Laminate               | HDF core absorbs moisture vapor from concrete and swells irreversibly; below-grade basements routinely exceed laminate's moisture tolerance even without visible flooding |
| Carpet (standard)      | Below-grade moisture vapor trapped under carpet backing creates mold and mildew; dog and young children produce spills and accidents that saturate carpet irreversibly in a basement environment |

---

### Scored Comparison (Surviving Options)

**Priority weights:** Durability (2x), Moisture suitability (2x), Budget fit (2x), DIY feasibility (1x), Maintenance ease (1x), Aesthetic match (1x)

| Criteria             | Weight | LVP (20+ mil)              | Engineered Hardwood (float) | Porcelain Tile             |
|----------------------|--------|----------------------------|-----------------------------|----------------------------|
| Budget fit           | 2x     | 5 (well within at $4–$10/sqft installed) | 2 (professional install pushes to $10–$18/sqft; over budget for 600 sqft) | 3 (installed $8–$20/sqft; hits the top of budget or exceeds) |
| Moisture suitability | 2x     | 5 (100% waterproof; approved for below-grade with vapor barrier) | 2 (requires MVER below 3 lbs; at-risk on below-grade slab without aggressive vapor mitigation) | 5 (zero moisture concern; mortar and grout impervious to vapor) |
| Traffic durability   | 2x     | 4 (20 mil wear layer handles kids and dogs; resist scratches and scuffs) | 4 (comparable, but limited refinish cycles and veneer vulnerability) | 5 (glazed porcelain is hardest surface available; virtually indestructible under residential traffic) |
| DIY feasibility      | 1x     | 5 (click-lock floating; no adhesive, no special tools beyond a miter saw or circular saw) | 2 (floating engineered requires careful acclimation, moisture testing, and precise cutting; not recommended for first-time DIY on below-grade slab) | 1 (wet saw, mortar mixing, grouting, leveling, and tiling are not beginner-appropriate) |
| Maintenance ease     | 1x     | 5 (sweep and damp mop; no waxing, no sealing, no grout) | 3 (damp mop only; avoid standing water; periodic inspection of acclimation performance) | 3 (excellent surface durability but grout lines require annual sealing and periodic regrout) |
| Aesthetic match      | 1x     | 4 (wood-look planks are warmer and more inviting than tile for a playroom; wide variety of styles) | 5 (most authentic wood appearance) | 2 (cold underfoot and clinical look; not typical playroom aesthetic) |
| **Weighted Total**   |        | **54**                     | **31**                      | **38**                     |

---

### Primary Recommendation: LVP (Luxury Vinyl Plank) -- 20 mil Wear Layer Minimum

**Why this choice:**
LVP is the decisive recommendation for this basement. It is the only option that simultaneously passes the below-grade moisture disqualifier, fits comfortably within the $4,000-$5,500 budget with room to spare, and is achievable as a first-time DIY project. The 20 mil wear layer specification is critical for a household with a dog and two young children -- thinner LVP (6-12 mil) will show scratching from pet nails within 2-3 years, while 20 mil products are rated for heavy residential and light commercial traffic and will maintain their appearance for 15-20 years under this household's use pattern. The floating click-lock format means installation errors are correctable without special tools or professional remediation.

**Key product specifications to look for:**
- Wear layer thickness: 20 mil minimum; 28-40 mil for maximum durability
- Core type: WPC (Wood Plastic Composite) or SPC (Stone Plastic Composite) preferred for basements -- SPC is denser, more rigid, and more dimensionally stable under temperature swings; WPC is slightly warmer underfoot and more comfortable for children playing on the floor
- Attached underlayment: Look for products with a pre-attached cork or foam underlayment -- this eliminates a separate purchase, adds slight cushion underfoot (important for a playroom), and provides minor thermal comfort over cold concrete
- Maximum subfloor temperature rating: Verify it is at least 80°F (relevant only if the basement has radiant heat; mention if applicable)
- Waterproof rating: Must specify "waterproof core" not just "water-resistant surface" -- the entire plank including core must be waterproof for below-grade use

**Full Budget Estimate:**

| Component                     | Calculation                                      | Cost Range         |
|-------------------------------|--------------------------------------------------|--------------------|
| Moisture vapor test (plastic sheet method) | DIY field test first; pro ASTM F2170 if moisture found | $0–$300 (pro test) |
| Vapor barrier (6-mil poly sheeting) | 660 sqft x $0.10–$0.20/sqft                 | $66–$132           
