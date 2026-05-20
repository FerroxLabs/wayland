---
name: waste-reduction-planner
description: |
  Conducts a household waste audit and produces a zero-waste action plan organized by waste stream (trash, recycling, compost, hazardous). Gathers the user's current waste habits, housing situation, and local services to produce a prioritized reduction plan with estimated waste diversion percentages and cost savings.
  Use when the user asks about reducing household waste, starting a zero-waste journey, improving recycling habits, or conducting a waste audit.
  Do NOT use for commercial or industrial waste management, hazardous waste disposal procedures, composting setup details (use composting-starter-guide), or municipal waste policy analysis.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "waste-reduction sustainability checklist planning"
  category: "sustainability"
  subcategory: "home-sustainability"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Waste Reduction Planner

## When to Use

**Use this skill when:**
- A user asks how to reduce the amount of trash, garbage, or waste their household generates
- A user wants to start a zero-waste or low-waste lifestyle and does not know where to begin
- A user wants to improve their recycling habits, learn what is and is not recyclable in their home, or stop contaminating recycling bins
- A user asks how to conduct a home waste audit or wants to understand their current waste composition
- A user wants to reduce single-use plastics, excess packaging, or disposable products from their daily life
- A user expresses guilt, overwhelm, or frustration about the amount of waste their household produces and wants actionable steps
- A user asks what to do with specific non-trash items such as old clothing, electronics, paint, or furniture that they do not want to send to landfill
- A user asks how much money they could save by wasting less food or buying fewer disposable products

**Do NOT use when:**
- The user is asking about commercial, institutional, or industrial waste streams -- this skill covers household waste only (refer to a facilities management or commercial sustainability resource)
- The user asks for detailed step-by-step composting setup, troubleshooting, or maintenance -- that level of composting guidance belongs in a `composting-starter-guide` skill
- The user is asking specifically about safe disposal of hazardous household waste (paint, pesticides, motor oil, fluorescent bulbs) -- provide the framework here but direct them to a `hazardous-waste-disposal` skill or local household hazardous waste (HHW) collection programs
- The user is asking about municipal solid waste policy, landfill siting, extended producer responsibility legislation, or waste management regulations -- that is a policy analysis task, not a household action plan
- The user asks about medical, pharmaceutical, or sharps waste -- that requires dedicated safety guidance outside this skill's scope
- The user is asking about e-waste (computers, TVs, phones) in depth -- while this skill acknowledges e-waste as a category, dedicated e-waste recycling guidance is a separate topic
- The user is a landlord asking about managing waste for tenants or a property manager overseeing a multi-unit complex -- this skill addresses the individual household, not building management

---

## Process

### Step 1 -- Gather the Household Waste Profile

Before producing any plan, collect the household context. The plan cannot be accurate without this information because waste composition, reduction levers, and available infrastructure vary dramatically by household.

Ask the user -- either directly or by inferring from what they have shared -- for the following:

- **Household size:** Number of people and approximate age ranges (toddlers, school-age children, and older adults each have distinct waste patterns -- diapers, school paper, adult incontinence products)
- **Housing type:** Single-family house, apartment, condo, townhouse, mobile home. This determines composting options (backyard bin, tumbler, vermicomposting, community drop-off), storage capacity, and whether permanent installations are allowed
- **Current waste output:** How many bags per week and what size -- 13-gallon kitchen bags weigh approximately 10-15 lbs each, 30-gallon tall kitchen bags weigh 15-25 lbs, 33-gallon outdoor bags weigh 20-35 lbs. Also note if they use a dumpster (estimate percentage of the dumpster used per week)
- **Recycling access:** Curbside single-stream, curbside separated, drop-off center only, or no recycling access. Note whether they currently use whatever recycling is available
- **Composting status:** Active backyard composting, active vermicomposting, community drop-off program, yard waste pickup (often separate from composting), interested but not started, not interested
- **Local yard waste program:** Many municipalities provide separate curbside pickup for leaves, grass clippings, and branches -- this is distinct from food scrap composting and is highly relevant to households with lawns
- **Known problem waste categories:** Ask what they notice piling up most -- packaging and plastic film, food scraps, cardboard, paper towels, takeout containers, junk mail, old clothing, or electronics
- **Budget:** Zero (behavioral only), low (under $50 in one-time purchases), moderate ($50-200), or no budget limit specified
- **Renter vs. owner status:** Renters cannot install permanent composting infrastructure, may not be able to add bins, and often have less control over which recycling options are available in their building

If the user has already provided several of these details in their message, extract them rather than re-asking. Only ask for the details that are missing and essential to the plan.

---

### Step 2 -- Conduct the 1-Week Waste Audit Walkthrough

The waste audit is the diagnostic foundation of the plan. A plan built only on national averages will misalign with the user's actual situation. Guide the user through a real or estimated audit.

**If the user is willing to do a 1-week audit:**

Instruct them to set up five labeled containers or areas in their kitchen or utility area before discarding any waste for one week:

1. **Recyclables** -- Clean paper, cardboard, glass bottles and jars, aluminum cans, steel/tin cans, plastic bottles and jugs (typically #1 PET and #2 HDPE -- the most widely accepted)
2. **Compostable organics** -- Fruit and vegetable scraps, coffee grounds and filters, tea bags (non-plastic), eggshells, paper napkins and paper towels, yard trimmings
3. **Potentially reusable or donatable** -- Clothing and textiles, small appliances, books, toys, furniture components, anything that has a second life
4. **True trash** -- Items that genuinely cannot be recycled, composted, repaired, or donated: plastic film, chip bags, soiled food containers, certain mixed-material packaging, fast food wrappers, hygiene products
5. **Special handling items** -- Batteries (do not put in trash), fluorescent bulbs, paint, electronics, medications

At the end of the week, instruct the user to estimate the volume or weight of each pile. A filled 13-gallon bag weighs roughly 10-15 lbs. A filled paper grocery bag weighs roughly 5-8 lbs. They can use a bathroom scale: weigh themselves holding the bag, then subtract their body weight.

**If the user cannot or will not do the audit:**

Use national EPA MSW (Municipal Solid Waste) composition data adjusted for household size to build an estimated audit. For a typical U.S. household in a single-family home, the approximate composition of what actually ends up in the trash can (after existing recycling) is:

| Material Category | % of Landfill-Bound Waste | Notes |
|---|---|---|
| Food waste | 21-24% | Largest single category; nearly all divertable |
| Plastic film and flexible plastic | 10-12% | Largely non-recyclable curbside; reduce at source |
| Paper and paperboard | 11-13% | High diversion potential through recycling and reduction |
| Rigid plastic (non-recycled) | 6-8% | Often recyclable but contaminated or uncollected |
| Yard waste (if not picked up separately) | 8-13% | Fully divertable |
| Textiles and leather | 6-8% | Largely divertable via donation or textile recycling |
| Wood | 4-6% | Partially divertable |
| Metals (non-recycled) | 4-5% | Largely recyclable if properly sorted |
| Glass (non-recycled) | 3-5% | Recyclable if sorted; often contaminated |
| Rubber and other | 4-6% | Limited diversion options |
| Truly non-divertable residuals | 10-15% | Sanitary items, composite materials, contaminated waste |

Walk the user through which categories are likely high or low for their household based on what they have shared about their habits.

---

### Step 3 -- Build the Waste Stream Action Plan

For each of the four primary waste streams, identify the specific reduction levers available to this household. Use the household profile from Step 1 to filter out options that are not feasible (e.g., do not recommend backyard composting to an apartment renter without a community program).

**Food Waste -- Highest Impact Stream**

Food waste is the single most impactful category both financially and environmentally. The average U.S. household wastes approximately 31-32% of the food it purchases, which translates to $1,300-1,800 per year for a family of four. Food waste in landfills also generates methane, a greenhouse gas 28-34 times more potent than CO2 over a 100-year period.

Reduction strategies by cause of food waste:

- **Overbuying:** Weekly meal planning before grocery shopping reduces impulse purchases. A rotating meal calendar of 10-14 dinner options reduces decision fatigue and waste simultaneously. The recommended method is to inventory what is already in the refrigerator and pantry before making a shopping list -- this single habit accounts for an estimated $200-400 in annual savings per household.
- **Poor storage:** Specific refrigerator zones matter. The crisper drawer maintains 90-95% humidity, which suits leafy greens and vegetables. The low-humidity drawer suits fruits. The door is the warmest zone -- store condiments and juice there, not dairy or eggs. Bread stored in the refrigerator dries out; stored at room temperature in a paper bag or bread box it lasts 3-5 days; stored in the freezer and toasted as needed it lasts indefinitely.
- **Portion miscalculation:** A standard serving of dry pasta is 2 oz (57g) per person; most households cook 3-4x the needed amount. Providing approximate serving size benchmarks can reduce cooking waste by 20-30%.
- **Expiration date misunderstanding:** "Best by" and "use by" dates are manufacturer quality indicators, not safety cutoffs (with the exception of infant formula). A standard visual and smell check is sufficient for most foods. Eggs last 3-5 weeks past the pack date when refrigerated. Hard cheeses with surface mold can be cut 1 inch around the mold and are safe to eat. This single behavioral shift can save a household $100-250 per year.
- **Unplanned leftovers:** Designating one dinner per week as a "use up the leftovers" meal reduces fridge-clearing waste significantly.
- **Unavoidable scraps:** Vegetable peels, coffee grounds, eggshells, and fruit cores cannot be eaten and should be composted rather than trashed. For households without composting access, this is where community drop-off programs or vermicomposting becomes relevant.

**Packaging and Plastic -- Second Highest Volume Stream**

Packaging reduction follows the material hierarchy: first reduce the packaging entering the home, then reuse what does enter, then recycle what cannot be reused, and finally dispose of what cannot be recycled.

- **Shopping behavior changes:** Choosing products in cardboard over plastic where options exist (e.g., butter in paper wrap, laundry powder in cardboard vs. liquid in plastic jugs, eggs in cardboard vs. foam) reduces hard-to-recycle plastic at the source.
- **Bulk purchasing:** Buying staples (rice, beans, nuts, oats, spices, cleaning supplies) in larger quantities reduces the packaging-to-product ratio significantly. A 25-lb bag of rice generates one piece of packaging vs. 12-15 pieces from individual 2-lb bags. Many areas have bulk food stores where customers bring their own containers.
- **Reusable bag compliance:** Studies show reusable bag use is habit-based and requires a trigger (bags stored in a visible, accessible location -- near the door or in the car, not in a cabinet). A household of 4 that shops twice weekly eliminates approximately 400-600 single-use bags per year with consistent reusable bag use.
- **Plastic film problem:** Plastic film (produce bags, bread bags, dry cleaning bags, bubble wrap, cereal bag liners) is NOT recyclable in curbside single-stream programs in most U.S. municipalities. It causes equipment jams at recycling facilities. The correct disposal is through plastic film drop-off bins at major grocery and retail chains. Reduce at source where possible; do not put in curbside recycling.
- **Takeout waste:** Single-use utensils, condiment packets, napkins, and sauce containers from takeout orders are a significant waste stream for households that order frequently. Requesting "no utensils" or "no extras" and using home utensils eliminates this entirely.

**Paper -- Third Highest Household Volume**

Paper waste is the second-largest material in the U.S. municipal waste stream by weight. For households, the primary paper waste sources are direct mail and advertising, packaging paper and cardboard, paper towels and napkins, and printed documents.

- **Junk mail volume:** The average U.S. household receives approximately 41 lbs of junk mail per year. Registration with mail preference opt-out services reduces this by 40-60% within 3 months. It is not immediate -- mailers use databases that take time to update.
- **Catalogs:** Individual catalog opt-outs through retailer websites or catalog removal services can eliminate 50-100 catalogs per household per year, each weighing 2-6 oz.
- **Paper towels and napkins:** The average U.S. household uses approximately 80 rolls of paper towels per year at a cost of $80-120 annually. Switching to a set of 20-30 cloth rags (cut from old t-shirts, worn towels, or purchased flour sack towels) eliminates nearly all of this and the cost recoups within one year.
- **Cardboard:** Cardboard boxes from online shopping are fully recyclable, but must be broken down flat and kept dry. Wet cardboard loses recycling value and should be composted instead. Cardboard with heavy wax coating (some produce boxes) is not recyclable and should be composted.
- **Shredded paper:** Loose shredded paper is a recycling contamination issue -- it clogs sorting machinery. It should be placed in a paper bag, the bag sealed, and then recycled. Shredded paper can also be composted.

**Textiles and Household Items -- Underestimated Stream**

Textiles are the fastest-growing component of municipal solid waste. The average U.S. household discards approximately 70-80 lbs of clothing and textiles per year. Only 15% is currently diverted from landfill through donation and recycling.

- **Repair before replacement:** A basic clothing repair kit (needle, thread, iron-on patches) can extend garment life by 1-3 years. Shoe resoling, zipper replacement, and button replacement are inexpensive and extend item life significantly.
- **Donation triage:** Items in good condition (clean, no holes, functional) should go to donation. Items in poor condition (worn, stained, torn) can go to textile recycling bins (accepted at many chain retailers and donation centers regardless of condition) for industrial rag and fiber processing -- they do not need to be wearable to be diverted from landfill.
- **Furniture and electronics:** Most municipalities have bulk item pickup programs, used furniture stores, or electronics recycling programs. These items should never go to the regular trash if an alternative exists.
- **Single-stream contamination from textiles:** Clothing, hoses, and plastic bags are the top three contaminators of single-stream recycling bins. They must never go in a recycling bin, even if they are "plastic."

---

### Step 4 -- Map Local Infrastructure

A waste reduction plan is only executable if it accounts for what infrastructure actually exists for the user. Infrastructure gaps require either a behavioral substitution or a drop-off workaround.

Build a quick infrastructure map for the user based on what they have shared:

| Service | Available? | Action If Not Available |
|---|---|---|
| Curbside recycling | [Yes/No] | Locate nearest drop-off center; shift plan toward reduce/reuse |
| Curbside compost/organics | [Yes/No] | Explore backyard, vermicompost, or community drop-off |
| Yard waste pickup | [Yes/No] | Backyard compost or mulching mower |
| Bulk item pickup | [Yes/No] | Schedule special pickup or locate donation/drop-off |
| HHW collection events | [Yes/No] | Store safely until next event; check municipality website |
| Plastic film drop-off | [Yes/No] | Most major grocery/retail chains offer this |
| Textile recycling bins | [Yes/No] | Most donation centers accept damaged textiles |

Note: The user must verify their specific municipality's recycling accepted materials list. Recycling rules vary enormously -- glass is curbside-accepted in some cities and completely excluded in others. Plastics #3-7 are not accepted in the majority of U.S. curbside programs despite the recycling symbol on the container.

---

### Step 5 -- Prioritize Actions Using the Impact-Effort Matrix

Rank all identified actions into four tiers based on two axes: impact (how much waste is diverted, in pounds per year or percentage) and effort (time, cost, and habit change required).

**Tier 1 -- Free, Immediate, High Impact (Start This Week)**
- Meal planning before grocery shopping
- Refrigerator reorganization using FIFO (first in, first out) principle
- Posting a recycling guide specific to the local municipality on the inside of a cabinet
- Requesting "no utensils" for all takeout orders
- Keeping reusable bags at the door or in the car
- Opting out of junk mail
- Using a reusable water bottle consistently

Estimated landfill diversion from Tier 1 alone: 20-35%

**Tier 2 -- Low Cost ($10-50), Moderate Habit Change (Month 1)**
- Switching to cloth napkins and rags (replaces paper napkins and paper towels)
- Adding a second small recycling bin inside the home to improve sorting compliance
- Switching to e-statements and digital billing
- Purchasing 4 reusable water bottles if not already owned
- Starting a food scrap collection container (countertop compost crock, $15-30) even before a composting outlet is established

Estimated additional diversion from Tier 2: 10-15%

**Tier 3 -- Habit and Behavior Change, Low to No Cost (Month 2-3)**
- Consistent once-weekly "use up the leftovers" dinner
- Checking the refrigerator and freezer inventory before every grocery trip
- Learning proper produce storage for the top 10 items the household buys
- Buying staple products in larger package sizes
- Making a list of which plastic types the local program actually accepts and sorting accordingly

Estimated additional diversion from Tier 3: 10-15%

**Tier 4 -- Investment or Infrastructure (Month 3+, Homeowners or High-Motivation)**
- Setting up a backyard compost bin or tumbler
- Transitioning bathroom and cleaning products to low-waste alternatives (bar soap, shampoo bars, refillable cleaning concentrates)
- Shopping at a bulk food store with reusable containers
- Transitioning to a reusable coffee system if the household uses K-cups or capsules (one household using 1,000 K-cups/year generates approximately 5-6 lbs of non-recyclable pod waste annually)
- Clothing repair kit and basic mending practice

Estimated additional diversion from Tier 4: 10-20%

**Total potential diversion across all four tiers: 50-75% of current landfill waste**

---

### Step 6 -- Quantify Impact and Financial Savings

Translate the plan into concrete numbers the user can track and feel motivated by. Use the household profile data to personalize these estimates.

**Baseline calculation:**
- Average U.S. per-capita waste generation: approximately 4.4 lbs per person per day (EPA, 2018 data -- the most recent comprehensive national dataset)
- Family of 4: approximately 6,424 lbs per year total waste generated
- After existing recycling (assumed 25-30% diversion if they have curbside and use it), trash-to-landfill baseline: approximately 4,500-5,000 lbs per year

**Financial savings to quantify and present:**
- Food waste reduction: $400-800 per year for a household of 4 at Tier 1-2 actions
- Paper towel elimination: $80-120 per year
- Reduced bottled water (4 people using reusable bottles): $300-600 per year if household was buying cases of water
- Reduced single-use item purchases (bags, napkins, plastic wrap): $50-100 per year

**Environmental impact framing (use these benchmarks):**
- Every ton of food diverted from landfill avoids approximately 0.52 metric tons of CO2-equivalent emissions (methane + avoided landfill decomposition)
- Every ton of paper recycled rather than landfilled saves approximately 3.3 cubic yards of landfill space and 17 trees worth of fiber equivalent
- These numbers are useful for users who are environmentally motivated, but for users who are budget-motivated, lead with the dollar figures

---

### Step 7 -- Build the Implementation Schedule and Tracking Method

Give the user a concrete starting point, not a list of everything to do eventually.

**Week 1 commitment:** Identify 3 specific Tier 1 actions the user commits to starting before the end of the week. Be specific: "This week, put your reusable bags in your car, not in a drawer. Set a 5-minute reminder on Sunday to plan this week's dinners before writing your grocery list. Write the local recycling list on an index card and tape it inside the cabinet above the bin."

**Month 1 checkpoint:** At the end of month 1, the user should be able to notice a reduction in the number of bags going to the curb. If they were filling 3 bags per week, a 20-30% reduction means 2-2.5 bags per week. This is the primary observable metric for tracking progress.

**Tracking methods:**
- Bag count per week (simplest and most motivating)
- Grocery receipt total (food waste reduction shows up as grocery bill savings within 2-4 weeks)
- Photo of the trash bin before it goes out (visual record over weeks shows volume reduction)
- Food waste log: list the items thrown away each week before moving to the trash, which creates visibility and accountability

---

### Step 8 -- Address Special Handling Items Without Going Out of Scope

For items that are NOT regular trash or recycling, provide directional guidance without replacing dedicated skills:

- **Batteries:** Never in the trash or recycling bin. Drop-off bins are available at most major retail, hardware, and electronic stores at no cost. Alkaline household batteries are technically landfill-legal in most U.S. states but are better diverted. Lithium and rechargeable batteries are a fire hazard in trash and recycling trucks and must be diverted.
- **Paint:** Latex paint can often be dried out and disposed of with regular trash (in small quantities) if no latex paint drop-off program exists. Oil-based paint is hazardous and requires HHW collection. Many municipalities and paint retailers have take-back programs.
- **Medications:** Do not flush (water contamination) and do not put in trash (abuse potential). Many pharmacies have drug take-back bins. National drug take-back events occur twice yearly in the U.S.
- **Electronics:** Many municipalities have e-waste drop-off programs. Retailer take-back programs exist for TVs, computers, and phones. Hard drives should be degaussed or physically destroyed before recycling for data security.

Do not provide detailed procedures for any of these -- acknowledge them, route to the correct resource, and keep the main plan focused on the four primary household waste streams.

---

## Output Format

Produce the following structured plan. Fill in all bracketed fields with the user's specific information. Do not leave any field as a generic placeholder in the final output.

```
## Household Waste Reduction Plan

### Household Profile
| Parameter              | Value                                    |
|------------------------|------------------------------------------|
| Household size         | [X people, note ages if relevant]        |
| Housing type           | [House / Apartment / Condo + location]   |
| Current weekly waste   | [X bags / estimated lbs per week]        |
| Recycling access       | [Curbside / Drop-off / None + using it?] |
| Composting status      | [Active / Interested / No access]        |
| Yard waste pickup      | [Yes / No]                               |
| Budget                 | [Zero / Low / Moderate / Not specified]  |
| Renter or owner        | [Owner / Renter]                         |

---

### Step 1 -- Estimated Waste Audit (1-Week Snapshot)
_Note: These are estimates based on [actual audit / national averages for household of X]. 
A 1-week physical audit will give more accurate numbers._

| Waste Category           | Est. Weekly | Est. Annual | % of Total | Diversion Potential |
|--------------------------|-------------|-------------|------------|---------------------|
| Food waste               | [X lbs]     | [X lbs]     | [X%]       | High (compost + prevention) |
| Recyclables in trash     | [X lbs]     | [X lbs]     | [X%]       | High (sorting improvement) |
| Packaging / plastic film | [X lbs]     | [X lbs]     | [X%]       | Moderate (reduce at source) |
| Paper products           | [X lbs]     | [X lbs]     | [X%]       | High (recycle + reduce) |
| Yard waste               | [X lbs]     | [X lbs]     | [X%]       | High (existing program) |
| Textiles / household items| [X lbs]    | [X lbs]     | [X%]       | Moderate (donation/repair) |
| Special handling items   | [X lbs]     | [X lbs]     | [X%]       | Via HHW + drop-off programs |
| True non-divertable      | [X lbs]     | [X lbs]     | [X%]       | Minimize over time |
| **Total**                | **[X lbs]** | **[X lbs]** | **100%**   |                     |

---

### Step 2 -- Action Plan by Waste Stream

#### Food Waste -- [X%] of your total waste, est. $[X-X] per year in wasted food
| Action                            | Why It Works                        | Est. Annual Impact          | Cost    | Difficulty |
|-----------------------------------|-------------------------------------|-----------------------------|---------|------------|
| [Specific action for this household] | [Mechanism explanation]          | [X lbs diverted OR $X saved]| [Free / $X] | [Easy / Moderate] |
| ...                               | ...                                 | ...                         | ...     | ...        |

#### Packaging and Plastic -- [X%] of your total waste
| Action                            | Why It Works                        | Est. Annual Impact          | Cost    | Difficulty |
|-----------------------------------|-------------------------------------|-----------------------------|---------|------------|
| [Specific action]                 | [Mechanism]                         | [X lbs or X items]          | [Cost]  | [Level]    |
| ...                               | ...                                 | ...                         | ...     | ...        |

#### Paper -- [X%] of your total waste
| Action                            | Why It Works                        | Est. Annual Impact          | Cost    | Difficulty |
|-----------------------------------|-------------------------------------|-----------------------------|---------|------------|
| [Specific action]                 | [Mechanism]                         | [X lbs]                     | [Cost]  | [Level]    |
| ...                               | ...                                 | ...                         | ...     | ...        |

#### Recycling Improvement -- [X%] currently going to landfill that could be captured
| Action                            | Why It Works                        | Est. Annual Impact          | Cost    | Difficulty |
|-----------------------------------|-------------------------------------|-----------------------------|---------|------------|
| [Specific action]                 | [Mechanism]                         | [X lbs diverted]            | [Cost]  | [Level]    |
| ...                               | ...                                 | ...                         | ...     | ...        |

#### Special Handling Items (Batteries, Paint, Electronics, Medications)
- [Item type]: [Where to take it / how to handle it without a detailed procedure]

---

### Step 3 -- Priority Implementation Tiers

| Tier | Actions Recommended                   | Est. Diversion | Cost Range | Timeline       |
|------|---------------------------------------|----------------|------------|----------------|
| 1    | [List 3-5 free, immediate actions]    | 20-35%         | Free       | Start this week |
| 2    | [List 3-4 low-cost actions]           | +10-15%        | Under $50  | Month 1        |
| 3    | [List 3-4 habit/behavior changes]     | +10-15%        | Free       | Month 2-3      |
| 4    | [List 2-3 infrastructure/investment]  | +10-20%        | $30-150+   | Month 3+       |

**Your recommended starting point this week:** [Name 3 specific, concrete actions with a brief how-to for each]

---

### Step 4 -- Estimated Annual Impact Summary

| Metric                        | Current Baseline  | After Full Plan   | Change           |
|-------------------------------|-------------------|-------------------|------------------|
| Total waste generated / year  | [X lbs]           | [X lbs]           | -[X lbs]         |
| Waste to landfill / year      | [X lbs]           | [X lbs]           | -[X lbs / X%]    |
| Weekly trash bags             | [X bags]          | [X bags]          | -[X bags]        |
| Food cost wasted annually     | $[X-X]            | $[X-X]            | Save $[X-X]/yr   |
| Paper towel / napkin spend    | $[X]              | $[X]              | Save $[X]/yr     |
| Estimated total annual savings| --                | --                | **$[X-X]/yr**    |
| Landfill diversion rate       | [X%] est.         | [X%] est.         | +[X percentage pts] |

---

### Step 5 -- Progress Tracking

**Observable milestones:**
- Week 1: [Specific visible change expected]
- Month 1: [Specific visible change expected, e.g., bags per week reduced]
- Month 3: [Specific visible change expected]

**How to track:**
- [Primary tracking method appropriate for this household]
- [Secondary tracking method if applicable]

**Note:** Verify your local recycling program's accepted materials list at your municipality's public works or waste management website before sorting. Rules vary by city and change over time.
```

---

## Rules

1. **Never present zero-waste as binary.** Zero-waste is a direction of travel, not a destination. Any household that reduces landfill waste by 20% has made a meaningful environmental contribution. Never make the user feel that partial progress is failure. Present the plan as a progression, not a test to pass.

2. **Always lead with free and behavioral actions before recommending any purchase.** The most impactful waste reduction actions (meal planning, FIFO fridge management, opting out of junk mail, using a reusable bag already owned) are free. Purchases should only appear in Tier 2 and beyond, and only if they provide a clear cost recovery timeline.

3. **Always filter out actions that are not feasible for the user's housing type.** Never recommend backyard composting to an apartment renter. Never recommend a bulk food store to someone who has acknowledged they do not have one nearby. Filter the plan to what is actually available and executable for this specific household.

4. **Recycling rules are local -- never make universal recycling claims.** Plastics #3-7 are not accepted in the majority of U.S. curbside programs. Glass is excluded from curbside in many cities. Shredded paper jams machinery in most facilities. Always include a note that the user must verify their specific municipality's accepted materials list before assuming something is recyclable at the curb.

5. **Food waste is always the highest-impact reduction category -- always address it first.** Even if the user's stated concern is plastic or packaging, food waste generates more landfill impact (by weight, by methane generation, and by financial cost to the household) than any other single category. It must appear prominently in every plan.

6. **Always include financial savings alongside environmental impact.** Dollar figures reinforce behavior change more reliably than abstract environmental metrics for most users. The annual cost of wasted food ($1,300-1,800 for a family of 4), the cost of paper towels ($80-120/year), and the cost of single-use water bottles ($300-600/year for a family that buys them regularly) are concrete and motivating numbers.

7. **Distinguish between renters and homeowners at every infrastructure decision point.** A renter cannot install a permanent composting bin, cannot drill holes or build structures, and may not be able to add bins in communal spaces. Renter-appropriate composting options are vermicomposting (indoors, no yard needed, a 2-cubic-foot bin works for 1-3 people) and community drop-off programs. Never omit the renter constraint.

8. **Never conflate the waste hierarchy tiers: reduce, then reuse, then recycle, then recover, then dispose.** Recycling is the third-best option, not the goal. A household that reduces its packaging purchasing is doing more than one that perfectly recycles all packaging. Do not let the plan over-index on recycling improvement when source reduction would have more impact.

9. **Plastic film (bags, wrap, film packaging) is NOT curbside recyclable in most U.S. municipalities -- never imply otherwise.** It is one of the most common recycling contaminants. Plastic film drop-off programs exist at major grocery and retail chains, or it must be reduced at source. Never put it in the recycling bin advice without the explicit caveat that this applies only to programs that specifically accept it.

10. **Use ranges, not single-point estimates.** Actual waste composition, food waste percentages, and cost savings vary significantly by household size, geography, income level, and purchasing behavior. Present all estimates as ranges (e.g., "$400-800 per year," "20-35% diversion") and note that the user's 1-week audit will produce more accurate figures than national averages.

---

## Edge Cases

**Apartment renter with no composting access and no yard**

Composting is typically off the table for infrastructure reasons. The approach is two-pronged: maximize food waste prevention (buying only what will be used, proper storage, using up leftovers) to reduce the amount of organic waste generated, and explore the narrow composting outlets available without a yard. Vermicomposting is the primary indoor composting option -- a 2-cubic-foot bin under the kitchen sink or in a closet processes food scraps for 1-3 people with minimal odor if maintained correctly. Many urban areas now have community composting drop-off programs, often at farmers markets, community gardens, or city-run collection points -- direct the user to search their city name plus "food scrap drop-off" to locate them. If neither vermicomposting nor community drop-off is feasible, focus the entire food-related component of the plan on reduction (buying less, storing better, wasting less) rather than diversion.

**Household already composting and recycling consistently**

Their current diversion rate is likely 40-55%, meaning they have already captured most of the easy wins. The next improvement tier is fundamentally different from a beginner's plan. Focus on the reduce and reuse layers rather than recycling optimization. Key next-level actions: buying staples in bulk to reduce packaging-to-product ratios, transitioning single-use bathroom and cleaning products to low-waste alternatives (bar soap, shampoo bars, refillable concentrate cleaning systems), learning about plastic film drop-off for the stream they cannot recycle curbside, addressing textile waste through repair and secondhand purchasing, and reducing K-cup or capsule coffee waste if applicable. Do not rehash composting or basic recycling -- acknowledge their existing habits and build only on the gaps.

**Household with infants or toddlers in diapers**

Disposable diapers are one of the most challenging household waste streams: each diaper weighs approximately 1.5-2 oz, and a newborn uses 8-10 per day, generating approximately 500-700 lbs of diaper waste per year. Do not push cloth diapering as the primary recommendation -- it is a significant lifestyle change requiring substantial laundry, proper washing protocols, and upfront cost ($300-600 for a full cloth diaper system), and it is not appropriate or feasible for every family. Instead, focus the plan on the controllable categories: food waste, packaging, and paper. If the family is interested in diapering alternatives, present cloth diapers and hybrid systems (cloth shell with biodegradable inserts) as options without advocacy. Acknowledge that the diapering period is temporary and focus progress on the streams where they can realistically reduce waste now.

**Rural household with no curbside recycling and no nearby drop-off**

The waste hierarchy prioritizes reduce and reuse above recycling -- in rural areas with limited recycling infrastructure, this is even more important. The entire plan should front-load source reduction: buying products with minimal or no packaging, buying in bulk, repairing and reusing items, eliminating single-use products entirely rather than generating recyclables that have nowhere to go. Composting is often highly feasible in rural areas -- backyard composting and yard waste management may already be practiced. The key reframe is that reduction is always more impactful than recycling, and this household's plan should reflect that.

**User is already doing many things and feels guilty about what remains**

Some users approach this topic from a place of environmental anxiety or guilt rather than practical problem-solving. Acknowledge their existing efforts explicitly before identifying gaps. A household that meal plans, composts, uses reusable bags, and recycles is likely diverting 50-65% of its waste -- that is substantially above the U.S. average of approximately 35%. What remains is often the hardest to address: composite materials, plastic film, medical and hygiene products, and packaging that is recyclable in theory but not in practice locally. For this user, provide a realistic framing: the remaining waste may have limited diversion options at the household level, and systemic changes (extended producer responsibility, packaging regulations) are the primary lever for those streams. The household has done what it can; advocacy and purchasing choices are the next appropriate step, not guilt about the irreducible residual.

**User in a region with a paid-by-weight or pay-as-you-throw (PAYT) trash program**

In PAYT municipalities, households pay directly for waste disposal by the bag or weight, which means waste reduction has an immediate and visible financial benefit beyond grocery savings. Many municipalities charge $1-3 per bag or $50-150 per year per household for trash service above a base allotment. In these contexts, the financial savings calculation should include the avoided disposal cost, not just food savings. Emphasize the direct cost connection: every bag not put to the curb is money saved. This is a powerful motivator and should be highlighted prominently in the impact summary for these households.

**User generating significant small business waste at home (home office, home bakery, etsy seller)**

Home-based business waste often blurs the household/commercial line. The skill can address packaging waste, paper, and consumables common to a home office (printer cartridges, packing materials, shipping boxes). However, if the user is generating food waste from a home bakery at commercial volumes, or large quantities of hazardous materials from a craft or manufacturing operation, note that household waste reduction strategies will have limited applicability to that portion of the waste stream and a commercial waste audit is the appropriate tool for the business component.

---

## Example

**Input:** "We're a family of 5 -- two adults and three kids, ages 2, 7, and 10. We rent a townhouse with a small backyard. We have curbside recycling and garbage pickup once a week. No composting pickup in our area. We probably fill 3-4 standard kitchen trash bags a week, sometimes more. We throw away a lot of food, way too many paper towels, and we feel like we're drowning in Amazon boxes and packaging. I also know we're recycling wrong because we just throw everything in hoping for the best. We're on a tight budget so we can't buy a lot of new stuff."

**Output:**

## Household Waste Reduction Plan

### Household Profile
| Parameter              | Value                                                    |
|------------------------|----------------------------------------------------------|
| Household size         | 5 people (2 adults, children ages 2, 7, 10)             |
| Housing type           | Townhouse rental with small backyard                     |
| Current weekly waste   | 3-4 standard kitchen bags (~13-gallon), est. 40-60 lbs/week |
| Recycling access       | Curbside (available, currently contaminated)             |
| Composting status      | No curbside program; backyard available                  |
| Yard waste pickup      | Unknown -- confirm with municipality                     |
| Budget                 | Tight -- free and low-cost actions only                  |
| Renter or owner        | Renter (limits permanent infrastructure changes)         |

---

### Step 1 -- Estimated Waste Audit (1-Week Snapshot)
_Based on national averages for a household of 5 with a 2-year-old. A 1-week physical sort will give more accurate numbers._

| Waste Category            | Est. Weekly | Est. Annual | % of Total | Diversion Potential |
|---------------------------|-------------|-------------|------------|---------------------|
| Food waste                | 12-14 lbs   | 624-728 lbs | 22-23%     | High (prevention + compost) |
| Recyclables going in trash| 7-9 lbs     | 364-468 lbs | 13-15%     | High (fix sorting) |
| Cardboard and paper       | 8-10 lbs    | 416-520 lbs | 14-16%     | High (recycle + reduce) |
| Packaging/plastic film    | 6-8 lbs     | 312-416 lbs | 11-13%     | Moderate (reduce at source) |
| Toddler-related waste     | 4-6 lbs     | 208-312 lbs | 7-9%       | Limited in short term |
| Paper towels/napkins      | 2-3 lbs     | 104-156 lbs | 3-5%       | High (cloth switch) |
| Textiles / household items| 2-3 lbs     | 104-156 lbs | 3-5%       | Moderate (donation) |
| True non-divertable       | 8-10 lbs    | 416-520 lbs | 14-18%     | Minimize over time |
| **Total**                 | **~50 lbs** | **~2,600 lbs** | **100%** |                  |

**Primary targets by volume:** Food waste, incorrectly sorted recyclables, cardboard and paper, and plastic packaging. These four categories together represent approximately 65% of your landfill-bound waste and all have actionable diversion paths.

---

### Step 2 -- Action Plan by Waste Stream

#### Food Waste -- approx. 22% of total waste, est. $1,500-2,000/year in wasted food for a family of 5

| Action                                      | Why It Works                                          | Est. Annual Impact              | Cost    | Difficulty |
|---------------------------------------------|-------------------------------------------------------|---------------------------------|---------|------------|
| Meal plan on Sunday before writing the grocery list | Buying only what you will use eliminates the biggest cause of food waste | Save $400-700/yr; divert 200-300 lbs | Free | Easy |
| FIFO fridge organization (older items in front) | Produce and leftovers get used before they go bad    | Divert 100-150 lbs/yr additional | Free   | Easy |
| Designate one dinner per week as "leftover night" | Clears the fridge of accumulating partial meals      | Divert 50-100 lbs/yr            | Free    | Easy |
| Learn proper storage for top 10 produce items | Correct storage can triple shelf life of many items  | Divert 75-125 lbs/yr            | Free    | Moderate |
| Start a small backyard compost for unavoidable scraps | Diverts all fruit/veg scraps and coffee grounds; backyard makes this feasible as a renter | Divert 200-300 lbs/yr | $0-40 (DIY pile) or $30-80 (purchased bin) | Moderate |

**Storage quick reference for your most-wasted items:**
- Berries: do not wash until eating; store dry in original container; or soak in 1:3 vinegar/water solution, dry completely, store loosely in container lined with paper towel -- lasts 5-7 days vs. 2-3 days unwashed
- Leafy greens: wrap in a dry paper towel (or cloth towel), store in a bag in the crisper drawer -- lasts 5-7 days vs. 2-3 days loose
- Herbs (cilantro, parsley): trim stems, stand in a glass of water in the refrigerator like flowers, cover loosely with a bag -- lasts 2 weeks vs. 4-5 days
- Bread: keep at room temperature in a paper bag for 3-5 days; slice and freeze what you won't use in 2 days and toast as needed
- Avocados: ripen on the counter, move to the refrigerator only when fully ripe -- stops ripening for 2-4 days; cut half stays fresh with the pit in, covered with beeswax wrap or a tight-fitting lid

#### Packaging, Plastic Film, and Amazon Boxes -- approx. 25-28% of total waste

| Action                                       | Why It Works                                       | Est. Annual Impact              | Cost       | Difficulty |
|----------------------------------------------|----------------------------------------------------|---------------------------------|------------|------------|
| Flatten and recycle all cardboard (keep dry) | Every Amazon box is fully recyclable if clean and flat | Divert 100-200 lbs/yr       | Free       | Easy |
| Request "no extras" or "no utensils" for all takeout | Eliminates a high-volume stream of truly unrecyclable waste | Divert 20-40 lbs/yr of non-recyclable items | Free | Easy |
| Take plastic film to grocery store drop-off bin | Bread bags, produce bags, bubble wrap, Amazon air pillows -- all accepted; none belong in curbside recycling | Divert 50-80 lbs/yr from landfill | Free | Easy -- requires one errand habit |
| Choose larger package sizes over multiple smaller ones | Fewer packages for the same product means less waste per unit | 15-25% packaging reduction on staples | Free | Moderate |
| Switch produce shopping to loose items, not pre-bagged | Pre-bagged produce uses unrecyclable plastic film; loose has none | Divert 10-20 lbs of plastic/yr | Free | Easy |

**Important:** Amazon padded mailers (gray plastic poly mailers) are NOT recyclable in curbside recycling. They belong in plastic film drop-off if the plastic has the film recycling symbol, or trash. Amazon paper mailers and cardboard boxes are fully curbside recyclable when broken down flat.

#### Paper and Paper Towels -- approx. 17-20% of total waste

| Action                                       | Why It Works                                       | Est. Annual Impact              | Cost       | Difficulty |
|----------------------------------------------|----------------------------------------------------|---------------------------------|------------|------------|
| Cut 15-20 cloth rags from old t-shirts or worn towels | Free cloth towels replace paper towels for 95% of uses -- spills, counter wiping, hand drying | Save $80-100/yr; divert 100+ lbs paper/yr | Free (use old fabric) | Easy |
| Opt out of junk mail (use DMAchoice and catalog preference services) | Average household receives 41 lbs of junk mail/year; opt-out reduces this 40-60% over 3 months | Divert 15-25 lbs/yr             | Free       | Easy -- one-time 20-minute task |
| Switch to digital statements for all bills and accounts | Paper statements add up to 5-10 lbs/year per account | Divert 10-25 lbs/yr            | Free       | Easy |
| Recycle shredded paper in a sealed paper bag, not loose | Loose shreds jam recycling machinery and cause contamination -- bagged shreds can be recycled | Keeps 5-10 lbs/yr out of contamination stream | Free | Easy |
| Compost wet or soiled cardboard instead of recycling | Wet cardboard has no recycling value; composting diverts it appropriately | Diverts 10-20 lbs/yr            | Free       | Easy |

#### Recycling Improvement -- est. 13-15% of your trash is recyclable material going to landfill

Your "wish-cycling" (putting everything in hoping for the best) is common and understandable, but contaminated recycling loads can result in entire bins being rejected and sent to landfill. Fixing this has high impact.

| Action                                       | Why It Works                                       | Est. Annual Impact              | Cost       | Difficulty |
|----------------------------------------------|----------------------------------------------------|---------------------------------|------------|------------|
| Print your municipality's actual accepted materials list and post it inside the cabinet above the bin | Sorting compliance rises dramatically when the list is visible at the point of decision | Divert 200-300 lbs/yr properly; prevent 50-100 lbs from being rejected due to contamination | Free | Easy -- one-time 10-minute task |
|
