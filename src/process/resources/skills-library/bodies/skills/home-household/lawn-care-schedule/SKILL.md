---
name: lawn-care-schedule
description: |
  Creates a seasonal lawn care schedule covering fertilization timing, aeration, overseeding, mowing height, and watering by grass type and climate region. Produces a month-by-month maintenance calendar with specific tasks and timing.
  Use when the user asks about lawn care timing, fertilizer schedules, when to aerate or overseed, mowing height for their grass type, or seasonal lawn maintenance tasks.
  Do NOT use for garden planning (use vegetable-garden-planning), landscape design, weed identification, or commercial turf management.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "gardening checklist planning"
  category: "home-household"
  subcategory: "gardening"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Lawn Care Schedule

## When to Use

**Use this skill when:**
- User asks when to fertilize their lawn and how many times per year, or which season is most important for feeding their grass type
- User wants a month-by-month or season-by-season lawn care calendar tailored to their grass species and climate zone
- User asks when to aerate, whether to use core aeration or spike aeration, or how to know if their lawn needs aeration
- User asks about overseeding timing, seeding rates, or how to thicken a thin or patchy lawn
- User asks about mowing height, mowing frequency, or the "right" time to raise or lower the deck
- User wants to understand a watering schedule -- how much, how often, and what time of day
- User asks about dethatching timing, thatch thickness thresholds, or whether to dethatch before overseeding
- User wants to know what lawn care tasks to do "this month" given their location and grass type
- User asks about winterizing their lawn or preparing it for spring green-up
- User is experiencing summer dormancy browning and wants to know how to manage it

**Do NOT use when:**
- User wants vegetable garden planning, crop rotation, or planting schedules (use `vegetable-garden-planning`)
- User needs landscape design, hardscaping layout, or plant selection for beds and borders
- User wants to identify a weed or select a specific herbicide product for spot treatment or broadleaf control
- User is managing a commercial sports turf, golf course fairway, or athletic field with professional-grade equipment
- User wants to install a new lawn from scratch on bare soil -- sod installation, hydroseeding, and seedbed preparation are separate topics requiring grade work, soil amendment, and establishment protocols beyond this skill
- User is asking about lawn disease diagnosis -- fungal patch identification, dollar spot, brown patch, and pythium require a separate diagnostic skill
- User is asking about pest identification -- grubs, chinch bugs, armyworms, and mole crickets are a separate topic
- User wants a full soil amendment plan based on soil test results -- interpreting a complete soil test report with lime rates, sulfur applications, and micronutrient corrections is beyond this skill's scope

---

## Process

### Step 1: Determine Grass Type and Climate Zone

Before producing any calendar, classify the user's lawn into one of three categories. Every task, every timing window, and every product rate in this skill depends on this classification. Do not skip this step.

- **Ask directly if unknown:** "Do you know what type of grass you have? If not, does your lawn go brown and dormant in winter (warm-season) or stay green into late fall and green up early in spring (cool-season)?"
- Ask for the user's location (state, city, or USDA hardiness zone) to determine the relevant climate region
- If the user is in a transition zone state (Virginia, North Carolina, Tennessee, Arkansas, Kansas, Missouri, Kentucky, northern Georgia, northern Alabama), ask which grass type they have planted -- the zone itself does not determine the care schedule

**Grass type classification reference:**

| Category | Common Grasses | Optimal Growth Temp | Primary Growing Season | Geographic Range |
|---|---|---|---|---|
| Cool-season | Kentucky bluegrass, tall fescue, perennial ryegrass, fine fescue, creeping bentgrass | 60--75°F | Spring (March--May) and fall (September--November) | USDA Zones 3--6; transition zone with cool-season selection |
| Warm-season | Bermuda, zoysia, St. Augustine, centipede, bahia, buffalo grass | 80--95°F | Late spring through summer (May--September) | USDA Zones 7--10; transition zone with warm-season selection |
| Transition zone hybrids | Tall fescue (most common), Kentucky 31 fescue, certain zoysia cultivars | Varies | Depends on species | Zone 6--7 belt |

**Soil temperature lookup:** Soil temperature drives every biological process in a lawn -- germination, root growth, and fertilizer uptake. Soil temp at 2-inch depth is the number to use. Approximate seasonal soil temp milestones by zone:

| Event | Soil Temp Threshold | Zone 5 Timing | Zone 7 Timing | Zone 9 Timing |
|---|---|---|---|---|
| Crabgrass germination begins | 55°F for 3+ consecutive days | Mid-April | Early March | Late January |
| Cool-season seed germinates | 50--65°F | Mid-September | Early October | November |
| Warm-season green-up begins | 65°F | N/A | Mid-April | Early March |
| Warm-season fertilize window opens | 70°F soil | N/A | Late April | Early March |

If the user does not have a soil thermometer, use the forsythia phenological cue: forsythia blooms when soil is approximately 55°F. Redbud bloom coincides with roughly 60--65°F soil temperature.

---

### Step 2: Build the 12-Month Maintenance Calendar

Assign specific tasks to each month based on the grass type and zone determined in Step 1. The calendar below covers both grass categories -- use only the relevant one.

**Cool-season grass monthly framework (Zone 5 baseline -- adjust ±2--4 weeks for other zones):**

| Month | Tasks | Key Decision Points |
|---|---|---|
| March | Remove winter debris; inspect for snow mold (pink or gray mycelium patches); sharpen mower blades | If snow mold is severe, lightly rake affected areas to allow drying |
| April | First mow when grass exceeds target height by 50%; apply pre-emergent if NOT overseeding in fall | Soil temp watch: pre-emergent goes down at 55°F; do NOT apply if you plan to overseed the same year |
| May | Begin fertilization (first application); establish mowing rhythm; supplement rainfall if below 1 inch/week | Use slow-release nitrogen; bagging vs. mulching decision starts here |
| June | Raise mower deck to summer height; shift watering to early morning deep cycles | Transition to 2x/week watering if temperatures exceed 85°F regularly |
| July | High mow, deep water; accept light dormancy if water-restricted; do NOT fertilize dormant grass | Footprint test: if footprints stay visible 30+ seconds, water now |
| August | Plan fall work; order overseeding seed now; schedule aerator rental | Seed selection: 95%+ germination rate on label; check blend vs. straight variety |
| September | **Core aerate** (highest-priority month); **overseed** immediately after aeration; **fertilize** (most critical application of the year) | Do not apply pre-emergent if overseeding; keep seed moist daily until germination |
| October | Second fall fertilizer; continue mowing until growth stops; rake leaves promptly (smothered grass develops disease) | Overseed establishment check -- young seedlings need one more application of starter fertilizer if thin |
| November | Winterizer fertilizer (after growth slows but before ground freeze); final mow; clear leaves | Lower final mow height to 2.5--3 inches to prevent snow mold tunneling |
| December | No active tasks; avoid traffic on frozen crowns | Equipment winterization: drain fuel stabilizer, store mower blades |
| January | Planning month: order seed, schedule soil test, inventory fertilizer | Soil test results take 2--3 weeks; request from local extension office |
| February | Sharpen blades; service mower; watch for early green-up in southern zones | Do not rush first mow -- wait until grass is genuinely growing, not just thawing |

**Warm-season grass monthly framework (Zone 8 baseline -- adjust ±2--4 weeks):**

| Month | Tasks | Key Decision Points |
|---|---|---|
| January--February | No fertilization; dormant irrigation only if soil is very dry; mow if bermuda has winter ryegrass overseeded | Overseeded ryegrass needs 0.75--1 inch/week watering during dormancy period |
| March | Monitor for green-up (bermuda: soil hits 65°F); pre-emergent application before 55°F soil | Do NOT fertilize warm-season grass before 50% green-up -- cold-forced nitrogen burns stored carbohydrates |
| April | Green-up begins most of Zone 8; first fertilizer 2--4 weeks after confirmed green-up; begin mowing | Scalp the lawn once at green-up to remove dead material and stimulate lateral growth |
| May | Regular mowing rhythm; second fertilizer application; dethatch if thatch exceeds 0.5 inch | Dethatching timing: only when grass is growing vigorously; never dethatch during heat stress |
| June | Peak growth -- mow more frequently; fertilize bermuda and St. Augustine; monitor for chinch bugs | Bermuda in peak growth needs mowing every 3--5 days to maintain 1.5-inch height |
| July | Continue summer fertilization; deep water 1--1.5 inches/week; watch for heat/drought stress | Avoid fertilizing centipede in July -- it causes thatch buildup and nitrogen burn |
| August | Last fertilizer application 6--8 weeks before expected first frost; aerate if soil is compacted | Warm-season aeration: best done now while grass can recover before dormancy |
| September | Reduce fertilization to zero by mid-September; continue mowing; overseed with perennial ryegrass for winter color (optional) | Ryegrass overseeding: scalp to 0.5 inch, seed at 5--10 lbs/1,000 sqft, keep moist 14 days |
| October | Grass slows; reduce watering; mow as needed | Watch for first frost date -- bermuda goes dormant after first hard frost |
| November | Dormancy begins; no nitrogen; reduce or eliminate irrigation | Potassium application (0-0-30 or similar) in early fall improves cold hardiness |
| December | Full dormancy; no irrigation unless extreme drought | Brown color is normal and expected -- do not fertilize to "green it up" |

---

### Step 3: Set Mowing Height and Frequency

Mowing height is the most controllable variable in a home lawn program and has the largest single effect on lawn health, weed pressure, and drought tolerance.

**Mowing height by grass species:**

| Grass Species | Optimal Height Range | Minimum Acceptable Height | Summer Height Adjustment | Mowing Frequency (active growth) |
|---|---|---|---|---|
| Kentucky bluegrass | 2.5--3.5 inches | 2 inches | Raise to 3.5--4 inches | Every 5--7 days |
| Tall fescue | 3--4 inches | 2.5 inches | Raise to 4--4.5 inches | Every 7--10 days |
| Perennial ryegrass | 2--3 inches | 1.5 inches | Raise to 3 inches | Every 5--7 days |
| Fine fescue (creeping red, chewings, hard) | 2.5--4 inches | 2 inches | No adjustment needed (shade-adapted) | Every 10--14 days |
| Bermudagrass | 1--2 inches | 0.5 inches (rotary) | No adjustment -- keep consistent | Every 3--5 days |
| Zoysiagrass | 1.5--2.5 inches | 1 inch | No adjustment | Every 7--10 days |
| St. Augustinegrass | 2.5--4 inches | 2 inches | Raise to 3.5--4 inches | Every 7--10 days |
| Centipedegrass | 1.5--2 inches | 1 inch | No adjustment | Every 10--14 days |
| Buffalograss | 2--4 inches (or unmowed) | 1.5 inches | No adjustment -- drought tolerant | Every 14--21 days |
| Bahiagrass | 3--4 inches | 2.5 inches | No adjustment | Every 7--14 days |

**Critical mowing rules to convey to every user:**

- **The one-third rule:** Never remove more than one-third of the blade length in a single mowing session. If the target is 3 inches, mow when grass reaches 4.5 inches. Removing more than one-third exposes the thatch layer, shocks the plant, and causes temporary photosynthesis loss -- the lawn will look scalped and stressed for 5--7 days
- **Blade sharpness matters:** A dull blade tears grass tissue, creating ragged white tips that turn brown and create entry points for fungal disease. Sharpen mower blades every 20--25 hours of use, or at minimum every spring
- **Mow when dry:** Wet clippings clump, clog discharge chutes, and can spread fungal spores across the lawn
- **Clipping management:** Mulching clippings back into the lawn returns approximately 0.5 lbs of nitrogen per 1,000 sqft per season -- this is equivalent to one full fertilizer application and reduces thatch when clippings are short (one-third rule)
- **Directional variation:** Vary the mowing pattern each session to prevent grain formation (grass leaning in one direction) and soil compaction ruts along repeated tracks

---

### Step 4: Establish the Watering Program

Irrigation timing and volume mistakes are the most common cause of lawn decline in home settings -- both overwatering and underwatering produce stress symptoms that look similar to disease or insect damage.

**Core watering targets:**

- **Weekly volume:** 1--1.5 inches total per week (including rainfall), measured with a rain gauge or empty tuna can placed on the lawn during irrigation
- **Frequency:** 1--2 deep watering sessions per week for established lawns; daily light watering creates shallow root systems and trains the lawn to be irrigation-dependent
- **Timing:** Between 4:00 AM and 10:00 AM; morning watering allows leaf blades to dry by mid-day, sharply reducing fungal disease risk; evening watering leaves blades wet overnight and significantly increases brown patch, pythium, and dollar spot risk
- **Application rate vs. infiltration rate:** Sandy soils absorb water rapidly and may require two shorter cycles (split irrigation) to reach 1 inch without runoff; clay soils absorb slowly and benefit from a cycle-and-soak approach -- run for 15 minutes, pause 30 minutes, run again

**Watering by season:**

| Season | Cool-Season Grass | Warm-Season Grass |
|---|---|---|
| Early spring | Supplement only if rainfall below 0.75 inches/week | Minimal -- grass not actively growing yet |
| Late spring | 1 inch/week; rainfall often sufficient | 0.5--0.75 inches/week as growth accelerates |
| Summer | 1.25--1.5 inches/week; increase frequency in heat waves | 1--1.25 inches/week; bermuda tolerates mild drought |
| Fall | Taper to 0.75--1 inch/week; autumn rain usually supplements | Taper as growth slows; stop before dormancy |
| Winter | None (cool-season dormant) | Once per month in extreme drought (keep crowns alive) |

**Drought response protocol:**
- Cool-season grass can go dormant in summer heat and drought -- browning is not death, it is survival mode. Grass crowns survive dormancy if temperatures return to the acceptable range. Allow dormancy rather than maintaining a light-sprinkle habit that is insufficient for actual growth and promotes shallow roots
- Warm-season grass can survive 3--4 weeks without irrigation once established; bermuda is the most drought-tolerant, St. Augustine is the least among warm-season species

**How to diagnose watering needs without a gauge:**
- Step test: Walk across the lawn; if footprints remain visible after 30 seconds (blades do not spring back), soil moisture is critically low -- water within 24 hours
- Soil probe: Push a 6-inch screwdriver into the soil; if it penetrates easily to 4 inches, moisture is adequate; if it stops at 2 inches or less, the soil is too dry

---

### Step 5: Build the Fertilization Plan

Fertilizer timing follows the grass's natural growth cycles. Fertilizing at the wrong time diverts energy to the wrong plant processes and can damage the lawn.

**Key nitrogen principle:** Nitrogen drives shoot growth. Applying nitrogen when a grass is under heat or drought stress pushes leaf growth that the root system cannot support -- this depletes carbohydrate reserves, weakens the plant, and makes it more susceptible to disease.

**Annual nitrogen budget by grass type:**

| Grass Type | Total N per 1,000 sqft per Year | Number of Applications | Most Critical Application Window |
|---|---|---|---|
| Kentucky bluegrass | 3--4 lbs | 3--4 | September--October (fall) |
| Tall fescue | 2--3 lbs | 2--3 | September--October (fall) |
| Perennial ryegrass | 2--3 lbs | 2--3 | September--October (fall) |
| Fine fescue | 1--2 lbs | 1--2 | September (fall); minimal summer feeding |
| Bermudagrass | 3--6 lbs | 4--6 | May--August (active growth) |
| Zoysiagrass | 2--3 lbs | 2--3 | May--July |
| St. Augustinegrass | 2--4 lbs | 2--4 | April--August |
| Centipedegrass | 1--2 lbs | 1--2 | Late May, mid-July; NEVER overfeed |
| Buffalograss | 0.5--1 lb | 1 | Late May or early June |
| Bahiagrass | 2--3 lbs | 2--3 | Spring through summer |

**Reading a fertilizer bag to calculate application rate:**
- The three numbers on a bag (e.g., 32-0-8) are the N-P-K percentages by weight
- To apply 1 lb of nitrogen per 1,000 sqft using a 32-0-8 fertilizer: 1 ÷ 0.32 = 3.125 lbs of product per 1,000 sqft
- Formula: lbs of product needed = desired N lbs ÷ (N% ÷ 100)
- Starter fertilizer for overseeding uses higher phosphorus (e.g., 18-24-12) to support root establishment; after establishment, return to a maintenance formula

**Fertilizer form selection:**
- **Slow-release (polymer-coated or IBDU):** Releases nitrogen over 6--12 weeks; lower burn risk; preferred for spring and summer applications; slightly more expensive
- **Quick-release (urea, ammonium sulfate):** Results visible in 3--5 days; higher burn risk if misapplied or applied in heat; useful for fall feeding when soil temps are dropping
- **Organic (feather meal, compost, blood meal):** Slow-release by nature; improves soil microbiology over time; lower nitrogen concentration per pound means larger volume application; minimal burn risk
- **Winterizer blends (low N, high K):** Formulas like 22-0-14 or 13-0-46 (potassium nitrate) in fall build root carbohydrate reserves and improve cold hardiness without forcing excessive shoot growth before freeze

---

### Step 6: Determine Aeration and Overseeding Needs

Not every lawn needs aeration every year. Help the user diagnose whether aeration is warranted before scheduling it.

**Aeration decision criteria:**

| Indicator | Threshold for Action |
|---|---|
| Soil compaction (screwdriver penetration) | Cannot penetrate 4 inches easily |
| Thatch layer thickness | Exceeds 0.75 inches for cool-season; 0.5 inches for warm-season |
| Water pooling after rain | Puddles linger more than 2 hours after light rain |
| Heavy clay soil | Annual aeration recommended |
| High-traffic lawn (kids, dogs, play area) | Annual aeration recommended |
| Sandy soil, low traffic | Every 2--3 years |

**Core aeration vs. spike aeration:**
- Core aeration (hollow tines that remove plugs of soil 0.5--0.75 inches in diameter and 2--4 inches deep) is the only method that meaningfully relieves compaction -- it physically removes soil to create channels
- Spike aeration (solid tines that punch holes) actually compacts soil sidewalls and provides minimal benefit; do not recommend spike aeration for compaction relief
- Plugs left on the surface break down in 2--4 weeks and act as a natural top-dressing; do not rake them up

**Overseeding rates and seed selection:**

| Situation | Overseeding Rate | Notes |
|---|---|---|
| Thin lawn (50--75% coverage) | 4--6 lbs per 1,000 sqft (cool-season blend) | Aerate first for maximum seed-to-soil contact |
| Bare patches (less than 50% coverage) | 6--8 lbs per 1,000 sqft | Consider a starter fertilizer at time of seeding |
| Renovation overseeding after slit-seeding | 8--10 lbs per 1,000 sqft | Slit-seeder improves contact over broadcast alone |
| Bermuda winter color overseeding with ryegrass | 8--12 lbs per 1,000 sqft | Use annual ryegrass for one-season color; perennial ryegrass for more persistence |

**Post-overseeding management:**
- Keep the top 0.5 inch of soil consistently moist until germination (typically 7--14 days for ryegrass and tall fescue; 14--21 days for Kentucky bluegrass which is one of the slowest-germinating species)
- After germination, transition to deeper, less frequent watering over 2--3 weeks
- First mow of newly seeded areas: when new seedlings reach the target mowing height; use a sharp blade and do not bag (avoid disturbing fragile seedlings)
- Do not apply broadleaf herbicide to newly seeded areas for at least 8 weeks post-germination

---

### Step 7: Address Thatch Management

Thatch is the layer of dead and living organic material (stems, roots, rhizomes) that accumulates between the grass blades and the soil surface. Moderate thatch (under 0.5 inch) is beneficial -- it acts as a natural mulch. Excessive thatch creates problems.

**Measuring thatch:** Use a knife or trowel to cut a 2-inch plug of turf. The spongy brownish-tan layer between the green grass and the soil is thatch. Measure its thickness.

- **Under 0.5 inch:** Healthy; no action needed
- **0.5--0.75 inch:** Monitor; core aeration will help break it down over time
- **Over 0.75 inch:** Active thatch removal warranted -- dethatching or vertical mowing

**Thatch removal timing:**
- Cool-season grasses: late summer/early fall (August--September) so the lawn can recover before winter
- Warm-season grasses: late spring, 3--4 weeks after green-up, when grass is growing vigorously

**Grasses that accumulate thatch most aggressively:** Kentucky bluegrass, zoysiagrass, bermudagrass, and St. Augustinegrass. Tall fescue and centipede grass accumulate thatch slowly.

---

### Step 8: Compile and Deliver the Final Calendar

Assemble all gathered information into the structured output format defined below. Prioritize the most impactful seasonal tasks prominently. Call out the single most important upcoming task based on the user's timing. Include a soil test recommendation. Note that USDA Cooperative Extension services in each state offer region-specific calendars that reflect local microclimate conditions.

---

## Output Format

Produce the following structured output for every lawn care schedule request:

```
## Lawn Care Calendar: [Grass Type(s)] -- [Region/USDA Zone]

### Lawn Profile
| Parameter            | Value                                         |
|----------------------|-----------------------------------------------|
| Grass type           | [Species name]                                |
| Category             | [Cool-season / Warm-season / Transition mix]  |
| USDA zone            | [Zone number]                                 |
| Target mowing height | [X--X inches (season-specific if different)]  |
| Weekly water target  | [X--X inches/week]                            |
| Annual N budget      | [X--X lbs nitrogen per 1,000 sqft]            |
| Fertilizer apps/year | [X applications]                              |
| Aeration frequency   | [Annual / Every 2--3 years]                   |
| Overseeding needed   | [Yes -- [season] / No / As needed for patches]|

---

### Month-by-Month Calendar
| Month     | Priority Tasks                                     | Notes / Conditions                              |
|-----------|----------------------------------------------------|-------------------------------------------------|
| January   | [Task or "Dormant -- no active tasks"]             | [Condition note]                                |
| February  | [Task]                                             | [Condition note]                                |
| March     | [Task]                                             | [Condition note]                                |
| April     | [Task]                                             | [Condition note]                                |
| May       | [Task]                                             | [Condition note]                                |
| June      | [Task]                                             | [Condition note]                                |
| July      | [Task]                                             | [Condition note]                                |
| August    | [Task]                                             | [Condition note]                                |
| September | [Task]                                             | [Condition note]                                |
| October   | [Task]                                             | [Condition note]                                |
| November  | [Task]                                             | [Condition note]                                |
| December  | [Task or "Dormant -- no active tasks"]             | [Condition note]                                |

---

### Fertilizer Schedule
| App # | Month(s)  | Formula Type            | N-P-K Profile Example | Rate (lbs N per 1,000 sqft) | Notes                         |
|-------|-----------|-------------------------|-----------------------|-----------------------------|-------------------------------|
| 1st   | [Month]   | [Slow/Quick/Organic]    | [e.g., 32-0-8]        | [X lbs]                     | [Specific guidance]           |
| 2nd   | [Month]   | [Slow/Quick/Organic]    | [e.g., 22-0-14]       | [X lbs]                     | [Specific guidance]           |
| 3rd   | [Month]   | [Slow/Quick/Winterizer] | [e.g., 13-0-46]       | [X lbs]                     | [Most impactful application?] |

---

### Mowing Guide
| Season      | Target Height  | One-Third-Rule Trigger | Frequency               | Special Instructions              |
|-------------|----------------|------------------------|-------------------------|-----------------------------------|
| Spring      | [X--X inches]  | [X inches (mow when)]  | Every [X--X] days       | [e.g., bag first mowing]          |
| Summer      | [X--X inches]  | [X inches]             | Every [X--X] days       | [e.g., raise deck in heat]        |
| Fall        | [X--X inches]  | [X inches]             | Every [X--X] days       | [e.g., resume lower deck]         |
| Final mow   | [X--X inches]  | N/A -- single event    | Once                    | [Timing note re: frost/dormancy]  |

---

### Watering Guide
| Season      | Target per Week | Frequency       | Session Length / Volume    | Key Notes                                |
|-------------|-----------------|-----------------|----------------------------|------------------------------------------|
| Spring      | [X inch]        | [X]x/week       | [~X minutes / X inches]    | [Note about rainfall supplementation]    |
| Summer      | [X--X inches]   | [X]x/week       | [~X minutes / X inches]    | [Drought dormancy guidance if relevant]  |
| Fall        | [X inch]        | [X]x/week       | [~X minutes / X inches]    | [Taper guidance]                         |
| Winter      | [None / Minimal]| [N/A or 1x/mo]  | [N/A]                      | [Dormancy status]                        |

---

### Aeration and Overseeding Plan
| Task              | Timing          | Method                   | Rate / Depth               | Follow-Up                               |
|-------------------|-----------------|--------------------------|----------------------------|-----------------------------------------|
| Core aeration     | [Month/Season]  | Hollow-tine core aerator | 2--4 inch plug depth       | Leave plugs; apply seed/fertilizer over |
| Overseeding       | [Month/Season]  | Broadcast or slit-seeder | [X lbs per 1,000 sqft]     | Keep moist daily until germination      |
| Starter fertilizer| [At seeding]    | Granular broadcast       | 1 lb P per 1,000 sqft      | One application at seeding; transition after |

---

### Seasonal Priorities (Top 3 for This Lawn)
1. **[Highest-impact task with specific month]** -- [1--2 sentence explanation of why this matters most]
2. **[Second priority]** -- [1--2 sentence explanation]
3. **[Third priority]** -- [1--2 sentence explanation]

### Soil Test Recommendation
Test every 2--3 years through your local USDA Cooperative Extension office. Request pH, phosphorus, potassium, organic matter percentage, and cation exchange capacity (CEC). A pH below 6.0 for cool-season grass or below 6.5 for St. Augustine indicates lime is needed; above 7.2 in high-rainfall areas indicates elemental sulfur application may be warranted. Do not follow a generic fertilizer schedule if you have not tested in the past 3 years.
```

---

## Rules

1. **Always classify grass type before any other step** -- cool-season and warm-season grasses have fundamentally opposite peak care windows; providing a schedule without confirming grass type produces harmful advice (e.g., heavy fall fertilization on bermuda, or spring-only feeding on bluegrass)

2. **Fall is the king of cool-season lawn care; spring through summer is the king for warm-season** -- fertilization, aeration, and overseeding for cool-season grasses all peak in September--October; the same tasks for warm-season grasses peak in April--July; never reverse this

3. **Never recommend pre-emergent herbicide and overseeding in the same application window** -- pre-emergent herbicides work by inhibiting cell division in germinating seeds; they cannot distinguish between crabgrass seed and desirable turfgrass seed; if a user plans to overseed in fall, skip the spring pre-emergent or use it the following year

4. **Always apply the one-third mowing rule in every mowing recommendation** -- scalping grass is one of the most damaging practices a homeowner can perform; state the specific trigger height alongside every target height recommendation

5. **Never recommend fertilizer application on heat-stressed or drought-stressed turf** -- applying nitrogen to stressed grass forces shoot growth that the weakened root system cannot support; this depletes carbohydrate reserves and can kill sections of the lawn

6. **Recommend core aeration only -- not spike aeration** -- spike aeration compresses soil sidewalls and provides negligible compaction relief; only hollow-tine core aeration creates the channels needed for water, oxygen, and fertilizer to penetrate compacted soil

7. **Always include watering timing guidance (morning, before 10 AM)** -- evening watering significantly increases disease risk; this is not optional guidance, it is a disease prevention rule that belongs in every watering recommendation

8. **Do not recommend fertilizing warm-season grass until at least 50% green-up is confirmed** -- fertilizing dormant or semi-dormant warm-season grass forces growth using carbohydrate reserves rather than photosynthesis, weakening the plant's cold hardiness and making it more susceptible to late frost damage

9. **Centipede grass requires special handling** -- it is uniquely sensitive to excess nitrogen (causes thatch buildup, iron chlorosis, and "centipede decline"); cap total annual nitrogen at 1--2 lbs per 1,000 sqft and note this explicitly whenever centipede is the user's grass type; do not give it the same fertilizer rate as bermuda or St. Augustine

10. **Always include a soil test recommendation** -- generic fertilizer schedules are a starting point, not a prescription; without knowing soil pH, phosphorus levels, and potassium status, the user may be over-applying nutrients (causing runoff pollution and fertilizer burn) or under-applying the limiting nutrient; recommend testing every 2--3 years through a university extension service and adjusting the plan based on results

---

## Edge Cases

**Transition zone uncertainty (Zones 6--7):**
Users in Virginia, Kentucky, Tennessee, North Carolina, Arkansas, Kansas, Missouri, and the upper South frequently have mixed lawns or are unsure of their grass type. Handle as follows: if the user reports their lawn goes brown in winter, treat it as warm-season; if it stays green or greens up in early March, treat it as cool-season. For confirmed mixed lawns (bermuda patches in a tall fescue field, or vice versa), recommend managing for the dominant grass type and accepting that the secondary species will look stressed during its off-season. Tall fescue is the most common cool-season choice in the transition zone and needs extra summer stress management -- mow at 4--4.5 inches in July/August, water deeply 2x/week in heat, and do not fertilize from June through August.

**Newly seeded or recently sodded lawn (under 12 months old):**
New lawns require a different establishment protocol before the standard maintenance schedule applies. For seeded lawns: water lightly 2--3 times daily for the first 2--3 weeks to keep the top 0.5 inch moist until germination; after germination, transition to deeper and less frequent watering over 2 weeks. For sod: keep consistently moist for 14--21 days; sod roots will have bonded to soil when you can no longer peel back a corner without resistance. In both cases: delay the first fertilizer application until after the third mowing; use starter fertilizer (high phosphorus, e.g., 18-24-12) at time of seeding or sodding; do not apply broadleaf herbicides for 8 weeks post-establishment; do not aerate for the first full growing season.

**Shaded lawn conditions (under tree canopy or buildings):**
Most turfgrasses need 4--6 hours of direct sun for adequate growth. When a user describes a shady lawn, modify the recommendations as follows: recommend shade-tolerant species (fine fescue -- especially creeping red, hard fescue, or chewings fescue -- for cool-season; St. Augustinegrass for warm-season); raise the mowing height 0.5--1 inch above the standard recommendation (taller grass intercepts more light); reduce watering frequency (shade suppresses evapotranspiration and soils stay moist longer, creating ideal fungal conditions); reduce fertilizer rates by 25--30% (slow-growing shaded grass does not need as much nitrogen); accept that grass density will be lower in deep shade (less than 2 hours of direct sun) and ground covers may be more appropriate.

**Drought restrictions and mandatory water rationing:**
If a user is under municipal water restrictions, modify watering guidance to comply while minimizing lawn damage. For cool-season grass: allow summer dormancy; maintain a minimum of 0.5 inch per week if any irrigation is permitted -- this is enough to keep crowns alive without sustaining active growth; do not fertilize dormant grass; dormant cool-season grass typically recovers in 4--6 weeks once water restrictions lift and temperatures cool. For warm-season grass: bermuda and zoysia can tolerate 3--4 weeks without irrigation; St. Augustine needs more frequent rescue watering during extended drought or it will thin significantly. In all cases: never fertilize drought-stressed or dormant grass under restrictions; apply wetting agents to improve the penetration efficiency of the limited water available.

**Organic-only lawn care approach:**
When a user wants to avoid synthetic products, the core schedule still applies but the inputs change. For fertilization: use compost top-dressing (0.25-inch layer in fall for cool-season, late spring for warm-season) as the primary fertility source; supplement with organic granular fertilizers (feather meal, blood meal for nitrogen; bone meal for phosphorus; greensand or kelp meal for potassium). Nitrogen release from organic sources is temperature-dependent -- they will not work as quickly as synthetic in cold soil, so apply 2--3 weeks earlier than synthetic equivalents. For weed prevention: corn gluten meal applied in spring acts as a natural pre-emergent (note: it also mildly inhibits turfgrass seed germination, so do not apply in the same fall as overseeding); hand-pulling and high mowing heights are the primary weed management tools. For dethatching: a mulching mower plus topdressing with compost inoculated with beneficial microorganisms accelerates thatch decomposition naturally. Results from an organic program take 2--3 seasons to fully manifest -- set this expectation clearly.

**Cool-season lawn in extreme summer heat (Zone 7 cool-season users):**
Users who have chosen tall fescue or Kentucky bluegrass in Zone 7 (or even parts of Zone 6 with extreme summers) face an annual struggle with summer stress. Specific modifications: raise mowing height to maximum (tall fescue at 4--4.5 inches, bluegrass at 4 inches) from mid-June through mid-August; water more frequently (3x/week) in temperatures above 95°F; accept summer thinning as normal -- fall overseeding will restore density; do not attempt to fight summer dormancy with daily light watering; apply a light application of potassium (0-0-50 or similar) in late May to improve heat tolerance at the cellular level; avoid any nitrogen application between mid-June and mid-August.

**User unsure of lawn square footage:**
Fertilizer rates, seed rates, and lime rates are all calculated per 1,000 sqft. Help the user estimate: a standard suburban front yard is approximately 1,500--3,000 sqft; a small back yard is 1,000--2,000 sqft; measure the lawn using pacing (average adult stride = 2.5 feet), a measuring wheel, or a satellite mapping tool available from county assessor websites. For a rectangular lawn: length × width in feet ÷ 1,000 = number of thousands of square feet. For irregular shapes, break into rectangles and add. When in doubt, round up slightly on seed rates (extra seed rarely causes problems) and apply fertilizer conservatively (under-fertilizing is safer than over-fertilizing).

---

## Example

**Input:** "I have tall fescue in the Raleigh, NC area (Zone 7b/8a). Can you give me an annual lawn care schedule? My lawn has some thin patches from summer and I deal with compacted clay soil."

**Output:**

## Lawn Care Calendar: Tall Fescue -- Raleigh, NC (Zone 7b/8a)

### Lawn Profile
| Parameter            | Value                                                     |
|----------------------|-----------------------------------------------------------|
| Grass type           | Tall fescue (bunch-type cool-season grass)                |
| Category             | Cool-season (aggressive summer stress zone)               |
| USDA zone            | 7b/8a (transition zone, hot humid summers)                |
| Target mowing height | 3.5--4 inches (spring/fall); 4--4.5 inches (summer)      |
| Weekly water target  | 1 inch/week (spring/fall); 1.5 inches/week (summer)      |
| Annual N budget      | 2--3 lbs nitrogen per 1,000 sqft                         |
| Fertilizer apps/year | 2--3 (fall-heavy; no summer fertilization)               |
| Aeration frequency   | Annual (clay soil with compaction -- high priority)       |
| Overseeding needed   | Yes -- September, after aeration, to repair summer thinning |

---

### Month-by-Month Calendar

| Month     | Priority Tasks                                                                      | Notes / Conditions                                                                   |
|-----------|-------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| January   | No active tasks; equipment maintenance; review soil test results if ordered in fall | Tall fescue may stay partially green -- avoid heavy foot traffic on frost-covered blades |
| February  | Sharpen mower blades; order overseeding seed if planning spring patch repairs; soil test now if not done | Seed selection: elite turf-type tall fescue blend (not KY-31); check germination rate on label (95%+) |
| March     | Begin mowing when grass reaches 5--5.5 inches (cut to 4 inches); apply pre-emergent if NOT planning fall overseeding | Soil temp watch: apply pre-emergent at 55°F (mid-March in Raleigh); skip if fall overseeding is planned |
| April     | First fertilizer application; establish mowing rhythm (every 7--10 days); spot-treat winter weeds | Soil temp 60°F+ confirms active root growth; use slow-release nitrogen at 1 lb N/1,000 sqft |
| May       | Continue regular mowing; water supplementation if below 1 inch/week; begin raising deck | Begin transitioning mower height toward 4 inches by end of May |
| June      | Raise to 4--4.5 inches immediately; shift to deep watering 2x/week; NO fertilization | Raleigh summers are brutal for tall fescue; high mowing is the single most protective action |
| July      | Maintain high mowing; water 1.5 inches/week (3x/week if above 95°F); accept summer thinning | Do not fight browning or dormancy with daily light watering -- deepen the cycle instead; do NOT fertilize |
| August    | Order overseeding seed; schedule aerator rental; plan fall program | Target 3--5 lbs per 1,000 sqft of a premium turf-type tall fescue blend for thin-patch repair |
| September | **Core aerate** (most important month); **overseed** immediately after (broadcast, then rake lightly); apply starter fertilizer at seeding | Keep seed moist daily until germination (7--14 days for tall fescue); first mow of seedlings when they reach 4.5 inches |
| October   | **Fall fertilizer application** (most important feeding); continue mowing as growth resumes; water as needed | Lower deck back to 3.5--4 inches; apply 1 lb N/1,000 sqft slow-release; overseed establishment check |
| November  | **Winterizer fertilizer** (after growth slows, before ground freeze); final mow at 3--3.5 inches; clear leaves | Apply 0.5--1 lb N/1,000 sqft; do NOT apply after soil cools below 40°F |
| December  | Dormant; no irrigation needed unless extreme drought; no fertilization | Tall fescue may hold green in Zone 7b winters; mow once if it grows above 5 inches |

---

### Fertilizer Schedule

| App # | Month        | Formula Type                | N-P-K Profile Example | Rate (lbs N/1,000 sqft) | Notes                                                  |
|-------|--------------|-----------------------------|-----------------------|--------------------------|--------------------------------------------------------|
| 1st   | April        | Slow-release nitrogen        | 32-0-8                | 1 lb                     | Confirm soil temps at 60°F+; do not apply in cold soil |
| 2nd   | September    | Starter (at overseeding)     | 18-24-12              | Per label (high P rate)  | Applied at time of seeding; one application only       |
| 3rd   | October      | Slow-release nitrogen        | 29-0-4 or similar     | 1 lb                     | **Most important application**; rebuilds root reserves |
| 4th   | November     | Winterizer (low N, higher K) | 22-0-14               | 0.5--1 lb                | After growth slows; boosts cold hardiness              |

**Annual N total: approximately 3 lbs N/1,000 sqft**
**Important: Zero nitrogen from mid-June through August** -- fertilizing tall fescue during Raleigh summers actively damages the lawn.

---

### Mowing Guide

| Season       | Target Height  | One-Third-Rule Trigger  | Frequency          | Special Instructions                             |
|--------------|----------------|-------------------------|--------------------|--------------------------------------------------|
| Spring       | 3.5--4 inches  | Mow when grass hits 5.5 inches | Every 7--10 days | Bag first mowing to remove winter debris         |
| Summer       | 4--4.5 inches  | Mow when grass hits 6 inches | Every 10--14 days (growth slows) | HIGHEST priority single action for summer survival |
| Fall         | 3.5--4 inches  | Mow when grass hits 5.5 inches | Every 7--10 days | Resume lower deck after October 1                |
| Final mow    | 3--3.5 inches  | N/A -- single event     | Once in November   | Before ground freezes; prevents snow mold in wet winters |

**Blade note:** Sharpen mower blades every spring and mid-summer. Dull blades are especially damaging to tall fescue's coarse leaf texture -- torn tips turn white-brown and invite disease.

---

### Watering Guide

| Season  | Target/Week  | Frequency   | Session Target         | Key Notes                                                             |
|---------|--------------|-------------|------------------------|-----------------------------------------------------------------------|
| Spring  | 1 inch       | 1x/week     | 0.75--1 inch/session   | Raleigh spring rainfall usually adequate; supplement in dry spells   |
| Summer  | 1.5 inches   | 2--3x/week  | 0.5--0.75 inch/session | Apply before 9 AM; clay soil needs split cycles to avoid runoff      |
| Fall    | 0.75--1 inch | 1x/week     | 0.75 inch/session      | Overseed period: water daily (lightly) until germination; then taper |
| Winter  | None         | Dormant     | N/A                    | Resume only if extended drought (no rain for 4+ weeks) in Zone 7b    |

**Clay soil irrigation note:** Raleigh's red clay absorbs water slowly -- run sprinklers for 15 minutes, pause 30--45 minutes, run again to reach 0.75 inch per session without runoff. A tuna can or rain gauge on the lawn tells you exactly when you hit target.

---

### Aeration and Overseeding Plan

| Task               | Timing              | Method                     | Rate / Depth                         | Follow-Up                                               |
|--------------------|---------------------|----------------------------|--------------------------------------|---------------------------------------------------------|
| Core aeration      | Early September     | Hollow-tine core aerator   | 2--4 inch plug depth; 2 passes at 90° angles | Leave plugs on surface; they break down in 3--4 weeks  |
| Overseeding        | Immediately after aeration | Broadcast spreader then light raking | 3--5 lbs/1,000 sqft (turf-type tall fescue blend) | Water lightly daily until germination (7--14 days)     |
| Starter fertilizer | Same day as seeding | Granular broadcast         | Per label (high phosphorus formula)  | One application only; switch to slow-release N in October |

---

### Seasonal Priorities (Top 3 for This Lawn)

1. **September core aeration + overseeding** -- Raleigh's summer heat causes predictable tall fescue thinning every year; September aeration plus overseeding is not optional maintenance but the annual repair cycle that keeps this lawn dense. Clay soil compaction magnifies summer stress, making aeration essential rather than just beneficial. Without annual overseeding, tall fescue lawns in Zone 7b thin progressively over 3--5 years.

2. **Raise the mowing deck to 4--4.5 inches by June 1** -- tall fescue is a bunch-type grass with no lateral spread; it cannot recover from individual tiller loss the way Kentucky bluegrass or bermuda can. Taller grass in summer shades roots, retains soil moisture, and dramatically reduces the surface temperature at the crown where heat stress originates. This single adjustment is measurably more protective than additional watering.

3. **Fall fertilization in October (zero summer nitrogen)** -- applying nitrogen in June, July, or August to a heat-stressed tall fescue lawn in Raleigh is one of the fastest ways to kill it. Fall feeding when soil temps drop to 65--70°F supports root growth, not shoot growth -- this is
