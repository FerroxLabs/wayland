---
name: vegetable-garden-planning
description: |
  Creates a vegetable garden plan with bed sizing, crop selection based on USDA hardiness zone, companion planting guidelines, and a zone-aware planting calendar. Produces a complete garden layout with planting schedule and expected harvest windows.
  Use when the user asks about starting a vegetable garden, planning garden beds, choosing vegetables to grow, companion planting, or creating a planting schedule based on their location.
  Do NOT use for ornamental garden design, indoor gardening (use indoor-plant-care), commercial farming, or flower garden planning.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "gardening planning guide"
  category: "home-household"
  subcategory: "gardening"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Vegetable Garden Planning

## When to Use

**Use this skill when:**
- A user wants to start a vegetable garden from scratch and needs help deciding what to grow, where to put beds, and how to sequence planting
- A user asks what vegetables will grow well in their climate zone, city, or region -- including specific questions about frost dates or growing season length
- A user needs a complete planting calendar with specific dates relative to their last and first frost dates
- A user asks about raised bed construction, in-ground bed preparation, sizing recommendations, or garden layout orientation
- A user asks about companion planting, interplanting strategies, or which plants to keep separated
- A user wants to know when to start seeds indoors, when to direct sow outdoors, and when to transplant seedlings
- A user wants to understand succession planting, crop rotation, or how to maximize yield from a small space
- A user is choosing between raised beds vs. in-ground beds and needs help with the decision

**Do NOT use when:**
- The user wants to grow herbs or vegetables exclusively indoors under grow lights or on windowsills -- use `indoor-plant-care`
- The user only needs a planting calendar for crops they've already decided to grow -- use `seasonal-planting-calendar`
- The user wants to design an ornamental garden, cottage garden, or mixed border with flowering plants as the primary focus
- The user needs help diagnosing sick plants, yellowing leaves, or pest infestations -- use `plant-care-troubleshooting`
- The user is planning a farm, market garden, or production operation exceeding 1/4 acre -- commercial growing involves irrigation design, soil amendment at scale, and equipment considerations beyond this skill
- The user is asking about growing in a greenhouse as the primary growing environment
- The user wants to plan a fruit tree orchard or perennial food forest -- those involve multi-year establishment timelines and different spatial logic

---

## Process

### Step 1: Gather Location, Space, and Experience Information

Before making a single recommendation, collect the minimum required inputs. Do not skip this step or assume defaults.

- **Zone or location:** Ask for the user's USDA Hardiness Zone (1-13) or their city and state. If they give a city, map it to a zone and state the zone explicitly so the user can confirm. USDA zones are based on average minimum winter temperature, not growing season -- use them as a starting point, then refine with actual frost dates.
- **Frost dates:** Ask for or look up the approximate last spring frost date and first fall frost date. These are the two most important numbers in the entire plan. Every planting date derives from them.
- **Available space:** Ask for the square footage available and whether they prefer raised beds, in-ground beds, or containers. If they don't know, ask whether they have a lawn area, a patio, or both.
- **Sun exposure:** Ask how many hours of direct sunlight the intended garden area receives per day. Confirm whether it is morning sun or afternoon sun -- afternoon sun is more intense and more valuable for heat-loving crops.
- **Experience level:** First-time gardener, grown a container garden before, or have previous in-ground garden experience. This determines how ambitious the crop list should be.
- **Household priorities:** Ask what the household most wants to eat. A plan built around crops the family doesn't cook will fail in motivation even if it succeeds agronomically.
- **Time commitment:** Ask how many hours per week they can realistically spend gardening. A 400 sqft garden in summer can require 3-5 hours per week of maintenance.

**Representative frost date ranges by USDA zone (continental US -- confirm with local cooperative extension):**

| Zone | Last Spring Frost | First Fall Frost | Growing Season |
|------|------------------|-----------------|----------------|
| 3b | May 15 -- June 1 | Sept 1 -- Sept 15 | 90 -- 110 days |
| 4a/4b | May 1 -- May 15 | Sept 15 -- Oct 1 | 110 -- 130 days |
| 5a/5b | April 15 -- May 1 | Oct 1 -- Oct 15 | 140 -- 160 days |
| 6a/6b | April 1 -- April 15 | Oct 15 -- Nov 1 | 160 -- 185 days |
| 7a/7b | March 15 -- April 1 | Nov 1 -- Nov 15 | 185 -- 215 days |
| 8a/8b | Feb 15 -- March 15 | Nov 15 -- Dec 1 | 210 -- 250 days |
| 9a/9b | Jan 15 -- Feb 15 | Dec 1 -- Dec 15 | 250 -- 300 days |
| 10a/10b | Frost-free most years | Frost-free most years | 300+ days |

**Microclimate adjustment factors:** Urban areas run 2-5 degrees F warmer than surrounding suburbs (urban heat island). Hilltops shed cold air and may have a 1-2 week earlier last frost than valley bottoms. Within 1 mile of a large body of water, frost dates may shift 1-3 weeks later in spring and 1-3 weeks later in fall. Elevation increases of 1,000 feet correspond to roughly one full zone colder.

---

### Step 2: Determine Bed Type, Size, and Orientation

Match the bed type and size to the user's space, soil, budget, and experience. These decisions lock in all subsequent layout work.

**Raised beds vs. in-ground beds -- decision framework:**

| Factor | Raised Bed | In-Ground |
|--------|-----------|-----------|
| Poor or clay soil | Strongly preferred -- fill with quality mix | Requires amendment; can take 1-3 seasons |
| Drainage problems | Eliminates standing water issues | Must address or bed will fail |
| Contaminated soil (near road, old paint, fill dirt) | Required -- eliminates contact with native soil | Not safe for edibles without testing |
| Budget | $50-$200+ for lumber, soil | Lower material cost; higher labor for amendment |
| Back/mobility issues | Add height to 24-30 inches for ADA access | More bending required |
| Soil warmup speed | Raised beds warm 2-3 weeks earlier in spring | Slower to warm; significant in Zones 4-5 |
| Water retention in hot zones | Dries faster -- needs more frequent irrigation | Better moisture retention in arid climates |

**Bed sizing by experience level:**

| Gardener Level | Recommended Starting Footprint | Rationale |
|----------------|-------------------------------|-----------|
| Complete beginner | One 4x4 ft raised bed (16 sqft) | Forces selection of 4-6 crops, low overwhelm, manageable cost |
| Some container or plot experience | One or two 4x8 ft raised beds (32-64 sqft) | Enough variety for a household's summer salads and side dishes |
| Experienced (3+ seasons) | 100-200 sqft total across multiple beds | Allows crop rotation across seasons and meaningful harvest surplus |
| Confident food producer | 200-400 sqft | Realistic for meaningful food production for a household of 2-4 |

**Critical bed design specifications:**
- Maximum bed width: 4 feet -- you must be able to reach the center from either side without stepping into the bed. Stepping on soil compacts it and destroys structure. For beds accessible from only one side (against a fence or wall), maximum width is 2 feet.
- Raised bed height: 6-8 inches minimum for most crops. 12 inches for optimal performance in all vegetable crops. 18-24 inches for deep-rooted crops (carrots, parsnips, potatoes) or for mobility-accessible gardens. Deeper beds require significantly more soil -- a 4x8x12 inch bed requires approximately 32 cubic feet (1.2 cubic yards) of soil mix.
- Raised bed soil mix (Mel's Mix variant is standard): 1/3 coarse vermiculite, 1/3 peat moss or coco coir, 1/3 blended compost. Pure compost compacts; pure topsoil compacts and drains poorly. Never fill a raised bed with only bagged topsoil.
- Pathway width: 18 inches minimum for foot traffic only. 30-36 inches if you will use a wheelbarrow or cart. Mulch pathways with wood chips, straw, or gravel to reduce mud and weed pressure.
- Bed orientation: Orient the long axis north-south in most situations. This allows the sun to arc east to west across the length of the bed, giving both sides relatively equal exposure. In Zones 7+ where summer heat is intense, an east-west orientation with tall crops on the south side can provide beneficial afternoon shade to heat-sensitive crops. Place the tallest crops (trellised cucumbers, pole beans, corn, indeterminate tomatoes) on the north end of any bed so they shadow only themselves and not shorter neighbors.

---

### Step 3: Select Crops Matched to Zone, Season, and Skill Level

The most common beginner mistake is choosing crops based on personal desire alone. Crop selection must be filtered through three lenses: (1) does the growing season have enough days to mature this crop, (2) does the user have the skill to manage this crop's requirements, and (3) does the crop deliver good returns per square foot for a small bed.

**Cool-season vs. warm-season crop categories:**

Cool-season crops grow best in soil temperatures of 45-75 degrees F and tolerate light frost (28-32 degrees F for brief periods). They fail and bolt (go to seed) in sustained heat above 80-85 degrees F. These are the backbone of spring and fall gardens.

Warm-season crops require soil temperatures above 60 degrees F to germinate and are killed by any frost. They thrive in air temperatures of 70-90 degrees F. Most fruiting crops (tomatoes, peppers, cucumbers, squash, beans) fall in this category.

**Crop ROI for small beds -- yield per square foot, difficulty, and beginner suitability:**

| Crop | Yield per Sqft | Difficulty | Min. Growing Days | Best Zone Range | Notes |
|------|---------------|-----------|-------------------|-----------------|-------|
| Lettuce (leaf) | High | Easy | 30-45 days | 3-10 | Best beginner crop; cut-and-come-again |
| Radishes | Very high | Very easy | 25-30 days | 3-10 | Fastest reward; plant as gap fillers |
| Spinach | High | Easy | 40-50 days | 3-9 | Bolts quickly in heat; best as spring/fall |
| Kale | High | Easy | 50-65 days | 3-9 | Frost improves flavor; very productive |
| Bush beans | High | Easy | 50-60 days | 3-9 | Direct sow only; fix nitrogen |
| Swiss chard | High | Easy | 50-60 days | 3-10 | Heat tolerant for a leafy green |
| Peas (bush/pole) | Medium | Easy | 60-70 days | 3-8 | Spring only in most zones; cool-season |
| Cucumbers | High | Easy-Medium | 50-65 days | 4-10 | Needs trellis for space efficiency |
| Zucchini | Very high | Easy | 50-60 days | 3-10 | One plant per household is usually enough |
| Tomatoes (determinate) | Medium-High | Medium | 65-75 days | 4-9 | More manageable than indeterminate types |
| Tomatoes (indeterminate) | Very high over season | Medium | 75-85 days | 5-9 | Requires staking/caging; grows all season |
| Peppers | Medium | Medium | 65-85 days | 5-10 | Need heat; underperform in cool summers |
| Carrots | Medium | Medium | 70-80 days | 3-9 | Need loose, deep, stone-free soil |
| Beets | High | Easy | 55-70 days | 3-9 | Both root and greens are edible |
| Garlic | High | Easy | 240 days (fall-planted) | 3-9 | Fall plant, summer harvest; no in-season attention |
| Corn | Low per sqft | Hard | 75-90 days | 4-9 | Needs large block for pollination; poor for small beds |
| Melons | Low per sqft | Hard | 80-100 days | 6-10 | Space-intensive; avoid in beds under 200 sqft |
| Broccoli | Medium | Medium | 60-80 days | 3-9 | Cool-season; plant in spring or fall |
| Eggplant | Medium | Medium | 70-90 days | 6-10 | Needs heat; better in Zones 7-10 |

**For first-time gardeners, recommend a starter set of 4-6 crops only.** A proven beginner combination for Zone 5-7 spring start:
- Tomatoes (1-2 plants -- determinate or compact cherry variety)
- Bush beans (one 3-foot row)
- Lettuce (leaf varieties for cut-and-come-again harvest)
- Radishes (sown with carrots as row markers and quick harvest reward)
- Basil (herb companion; keeps the user engaged with frequent harvests)
- Cucumbers (1-2 plants on a trellis)

**Seed vs. transplant decision rules:**
- Always start from transplant (purchased or homegrown): tomatoes, peppers, eggplant, broccoli, cauliflower, celery, leeks
- Always direct sow (transplanting damages root system or they grow too fast to justify starts): beans, peas, carrots, radishes, beets, turnips, parsnips, corn
- Can do either: cucumbers, squash, melons (direct sow is fine in Zones 5+; starting indoors 3-4 weeks early gives edge in short-season zones), lettuce, kale, chard, spinach

---

### Step 4: Plan the Spatial Layout

Translate crop choices into a physical layout that maximizes light, airflow, and access. Layout errors waste space and reduce yields.

**Spacing for intensive raised-bed planting (square-foot gardening spacing):**

| Crop | Intensive Spacing | Plants per 4x4 Bed Square | Notes |
|------|------------------|--------------------------|-------|
| Tomatoes (indeterminate) | 1 per 4 sqft | 4 max -- usually 2 is better | Cage or stake; needs 5-6 ft vertical clearance |
| Tomatoes (determinate/bush) | 1 per 2-3 sqft | 4-6 | Compact growth; stops at set height |
| Peppers | 1 per 1-2 sqft | 8-16 | Less sprawling than tomatoes |
| Cucumbers (trellised) | 1 per 1 sqft | 16 in a column (but grow on trellis) | Trellis doubles effective density |
| Bush beans | 1 per 0.25 sqft (4-inch spacing) | 16-25 | Plant in blocks for easier harvest |
| Pole beans | 1 per 0.25 sqft | Grow vertically on a trellis | 3-4x the yield of bush beans per sqft of bed |
| Zucchini/squash | 1 per 4-9 sqft | 1-2 max | Sprawling; often better at bed edge |
| Lettuce (head) | 1 per 1 sqft | 16 | Or 6-inch spacing for leaf varieties |
| Lettuce (leaf/loose) | 1 per 0.25 sqft | 64 | Cut outer leaves; center keeps growing |
| Kale | 1 per 1-2 sqft | 8-16 | Harvest lower leaves; grows tall |
| Spinach | 1 per 0.25-0.5 sqft | 16-64 | Direct sow broadcast; thin to spacing |
| Carrots | 1 per 0.1 sqft (3-inch spacing) | 64+ | Thin diligently at 2-inch seedling stage |
| Radishes | 1 per 0.06 sqft (2-3 inch spacing) | 100+ | Interplant throughout bed |
| Beets | 1 per 0.25 sqft (4-inch spacing) | 16-25 | Each "seed" is a seed cluster; thin to one |
| Basil | 1 per 1 sqft | 16 | Pinch flowers to extend harvest |
| Peas (bush) | 1 per 0.1 sqft | 100+ | Direct sow; early spring only |

**Vertical growing -- the most underused tool in small-bed gardening:**
A trellis running along the north edge of a 4-foot-wide bed adds 20-40 sqft of effective growing surface without occupying any additional ground space. Use cattle panel (16-foot galvanized wire panel bent into an arch), wooden stake-and-twine systems, or purpose-built A-frame trellises. Crops that grow vertically and should always be trellised in small beds: cucumbers, pole beans, peas, indeterminate tomatoes (cage or single-stake), and winter squash (if space allows, the fruits may need slings made from old pantyhose or mesh bags to support their weight).

**Interplanting strategies that increase bed productivity:**
- Plant fast crops (radishes, lettuce) between slow crops (tomatoes, peppers). The fast crops harvest before the slow ones need the space.
- Sow spinach in the shadow of a trellis where direct sun would otherwise bolt it.
- Underplant the north side of taller crops with shade-tolerant herbs: parsley, cilantro, mint (contained in a pot sunk into the bed to prevent invasive spreading).
- After spring crops bolt and are pulled (peas, lettuce), replace immediately with a warm-season succession -- this is a planned handoff, not an accident.

---

### Step 5: Apply Companion Planting

Companion planting is a real and documented phenomenon, but it is frequently overstated. The honest framework: a handful of companion interactions are well-supported by research or strong gardener observation; most "companion planting charts" are garden folklore. Use the supported interactions and avoid the documented antagonisms.

**Well-supported companion planting relationships:**

| Crop | Companion | Benefit | Mechanism |
|------|-----------|---------|-----------|
| Tomatoes | Basil | Pest deterrence (aphids, thrips); possibly flavor improvement | Volatile oils from basil may confuse pest host-finding |
| Tomatoes | Carrots | Physical compatibility; carrots aerate soil around tomato roots | No chemical interaction; purely spatial |
| Any brassica | Nasturtiums | Trap crop for aphids and whiteflies | Aphids prefer nasturtiums; inspect and remove |
| Squash/Zucchini | Nasturtiums | Squash bug deterrent | Anecdotal but widely reported; nasturtiums are sacrificial |
| Beans (any) | Corn, squash | Three Sisters system: beans fix nitrogen for corn; squash shades out weeds; corn supports pole beans | Nitrogen fixation is documented; shade competition is real |
| Carrots | Onions/leeks | Carrot fly and onion fly mutual deterrence | Each crop's volatile oils mask the other from pest insects |
| Brassicas | Dill (mature), cilantro | Attract parasitic wasps that prey on caterpillars | Flowering herbs attract Braconidae wasps; documented in IPM literature |
| Lettuce | Tall crops (tomatoes, beans) | Shade protection; lettuce tolerates and may prefer partial shade in Zones 6+ | Physical benefit; extends lettuce season by 2-4 weeks |
| Cucumbers | Dill (young, not flowering) | Aphid predator attraction | Dill attracts beneficial insects; remove before it bolts |

**Documented antagonisms to observe:**
- Alliums (onions, garlic, chives, leeks) and legumes (beans, peas): allium root exudates inhibit nitrogen fixation by Rhizobium bacteria on legume roots. Keep separated by at least 18 inches.
- Fennel: allelopathic to most vegetables -- do not plant fennel in or near a vegetable bed. Grow it in a container or isolated bed if at all.
- Potatoes and tomatoes: both are Solanaceae and share diseases (early blight, late blight, Verticillium wilt). Planting them together concentrates disease pressure. Also, allelopathic interactions have been reported.
- Dill (mature/flowering) and tomatoes: young dill is beneficial; mature flowering dill may cross-pollinate with carrots and has been reported to inhibit tomato growth. Harvest or remove before it goes to flower.

---

### Step 6: Build the Planting Calendar

Calculate all key dates relative to the two anchor points: last spring frost date (LFD) and first fall frost date (FFD). Present dates as actual calendar dates, not just relative weeks, once the user's frost dates are known.

**Master timing formula -- weeks relative to last frost date:**

| Timing | Action | Notes |
|--------|--------|-------|
| LFD minus 10-12 weeks | Start celery, leeks, onions from seed indoors | Slow-growing; need long indoor period |
| LFD minus 8-10 weeks | Start peppers, eggplant indoors | Peppers are extremely slow from seed; earlier is safer |
| LFD minus 6-8 weeks | Start tomatoes indoors | Most common beginner error: starting too late |
| LFD minus 6-8 weeks | Start broccoli, cauliflower, cabbage indoors | Or direct sow outdoors if temp is above 40 degrees F soil temp |
| LFD minus 4-6 weeks | Direct sow outdoors: peas, spinach, lettuce, kale, Swiss chard, radishes, beets | Soil temp must be at or above 35-40 degrees F; soil workable |
| LFD minus 3-4 weeks | Direct sow outdoors: carrots, turnips; transplant broccoli/cabbage starts outdoors | These tolerate light frost |
| LFD minus 2-3 weeks | Begin hardening off tomato and pepper seedlings: 1 hour of outdoor exposure increasing daily | Critical step -- skipping this causes transplant shock |
| LFD minus 0-2 weeks | Transplant cold-tolerant transplants: broccoli, kale transplants | Watch nighttime temps |
| LFD (last frost date) | Transition point; monitor nighttime forecasts closely for 2-3 weeks beyond LFD | Late frosts occur after LFD in some years |
| LFD plus 1-2 weeks | Transplant tomatoes, peppers outdoors (nighttime above 50 degrees F) | Tomatoes stall if soil temp is below 55 degrees F; don't rush |
| LFD plus 1-2 weeks | Direct sow beans, cucumbers, summer squash, zucchini (soil temp above 60 degrees F) | Use a soil thermometer; air temp is unreliable |
| LFD plus 3-4 weeks | Direct sow corn, melons, sweet potatoes (soil temp above 65 degrees F) | These are the most cold-sensitive crops |
| LFD plus 4-6 weeks | First succession planting of beans, cucumbers, lettuce (shade-sown), radishes | Every 2-3 weeks for continuous harvest of fast crops |
| FFD minus 10-12 weeks | Direct sow fall brassicas: broccoli, kale, cabbage, Brussels sprouts | These need a full season in fall |
| FFD minus 8-10 weeks | Direct sow or transplant fall lettuce, spinach, chard | Mid-summer planting; water well to establish in heat |
| FFD minus 6-8 weeks | Direct sow fall radishes, turnips, beets | Quick crops for fall harvest |
| FFD minus 4 weeks | Plant garlic cloves for overwintering (in most zones) | After first hard frost in Zones 3-6 |

**Soil temperature thresholds (use a probe thermometer at 2-inch depth):**
- 35 degrees F: minimum for spinach, peas germination (very slow)
- 40 degrees F: lettuce, kale, chard, beets
- 50 degrees F: carrots, onions, parsley
- 60 degrees F: beans, cucumbers, summer squash, zucchini
- 65 degrees F: corn, melons, basil
- 70 degrees F: peppers, eggplant (below 65 degrees F soil temp, transplants will stall and sulk)

---

### Step 7: Add Soil Preparation and Fertility Notes

A plan without soil guidance fails at the first shovel. Every garden plan must include baseline soil instructions.

**In-ground bed preparation sequence:**
1. Clear existing vegetation. For sod, either remove by hand (laborious but immediate) or smother with cardboard plus 4-6 inches of compost (lasagna/no-dig method; effective but needs 3-6 months).
2. Test soil if any uncertainty exists. A cooperative extension soil test ($10-$30) returns pH, macronutrient levels, and organic matter percentage. Home test kits measure pH only.
3. Amend based on test: most vegetable gardens perform best at pH 6.0-6.8. Below 6.0, add ground lime (dolomitic lime adds magnesium; calcitic lime is better if magnesium is not deficient). Above 7.0, add sulfur (slow) or acidifying fertilizer (faster).
4. Add 2-4 inches of compost to the surface and work into the top 6-8 inches for a new bed.
5. For established beds: top-dress with 1-2 inches of compost each season. No-dig approach preserves soil structure and microbial communities -- recommended after the first year.

**Basic fertility schedule:**
- At planting: 2-4 inches compost incorporated or top-dressed
- When seedlings are 6 inches tall or at transplanting: balanced slow-release organic fertilizer (4-4-4 or 5-5-5) per label rate
- When heavy feeders (tomatoes, peppers, squash) begin to flower: side-dress with higher-nitrogen source (blood meal, fish emulsion, balanced organic fertilizer)
- Avoid high-nitrogen fertilizers on crops grown for roots or fruits: excess nitrogen produces lush foliage at the expense of edible parts

**Common soil problems and corrections:**
- Clay-heavy soil: add coarse sand and compost in large quantities (a 1:1:1 ratio of native soil, coarse sand, and compost); avoid tilling wet clay (destroys structure permanently)
- Sandy soil with poor retention: add compost heavily; biochar at 5% volume improves water retention in sandy soil
- Low organic matter (below 2%): build compost into the system; every season add cover crops (annual ryegrass, crimson clover) if beds are fallow over winter

---

### Step 8: Assemble and Deliver the Complete Garden Plan

Combine all gathered information into the structured output format. Calculate every date as an actual calendar date (not "minus 6 weeks"). Include a visual layout description, full crop list with spacing and timing, companion planting notes, maintenance reminders, and a next-steps checklist appropriate to the user's experience level.

When assembling the plan:
- Lead with the garden profile so users can immediately verify your zone and date assumptions
- Use a visual grid or ASCII layout that makes spatial relationships obvious
- Show the planting calendar as actual dates, not relative formulas
- Include harvest windows so the user knows when to expect results
- Make the next steps checklist specific to what the user needs to do first given their current date relative to the LFD

---

## Output Format

```
## Vegetable Garden Plan: Zone [X] -- [Bed Size and Type]

### Garden Profile
| Parameter            | Value                          |
|----------------------|-------------------------------|
| USDA Zone            | [zone number and subzone]     |
| Last spring frost    | [calendar date or range]       |
| First fall frost     | [calendar date or range]       |
| Growing season       | [X] days                      |
| Bed dimensions       | [length x width x height]      |
| Total growing area   | [X] square feet               |
| Bed type             | [raised / in-ground / container] |
| Sun exposure         | [full sun X hrs / partial sun X hrs] |
| Orientation          | [north-south or east-west long axis] |

---

### Garden Layout
[Provide a visual ASCII grid or descriptive zone map]

```
NORTH (tallest crops -- trellis or cage)
+----------------------------------+
| [Crop A]  [Crop A]  [Crop B]     |  Row 1 -- 24-inch spacing
|                                  |
| [Crop C - 3 row block]           |  Row 2 -- 6-inch spacing
| [Crop C] [Crop C] [Crop C] ...   |
|                                  |
| [Crop D] [Crop D] [Herb companion]| Row 3 -- 12-inch spacing
|                                  |
| [Crop E - 2 rows] [Crop F]       |  Row 4 -- 3-4 inch spacing
+----------------------------------+
SOUTH (shortest crops -- full sun path)
```

Orientation note: [Explain light and airflow rationale for this specific layout]

---

### Crop List
| Crop         | Variety Type           | Spacing | Count  | Start Method         | Seed-Start Date | Transplant / Sow Date | Days to Harvest |
|--------------|------------------------|---------|--------|---------------------|-----------------|----------------------|-----------------|
| [Crop name]  | [Determinate/hybrid/etc] | [X] in | [count] | [Indoor start / Direct sow / Purchase transplant] | [date or N/A] | [date] | [X-Y days] |

---

### Companion Planting Notes
| Pairing                      | Benefit                              | Notes |
|------------------------------|--------------------------------------|-------|
| [Crop A] + [Companion B]     | [Specific benefit mechanism]         | [Placement or timing note] |
| [Crop C] -- avoid [Crop D]   | [Reason for incompatibility]         | [Minimum separation or alternative] |

---

### Planting Calendar
| Calendar Date      | Action                                            | Crop(s)                   |
|--------------------|---------------------------------------------------|---------------------------|
| [Month Day]        | [Start indoors / Direct sow / Transplant outdoors] | [Crop name(s)]            |

---

### Harvest Schedule
| Crop            | First Expected Harvest | Main Harvest Window     | Notes                          |
|-----------------|----------------------|-------------------------|-------------------------------|
| [Crop name]     | [Date]               | [Start date -- end date] | [Succession? Freeze/preserve?] |

---

### Soil and Bed Preparation
- [Bed fill recipe or in-ground amendment plan with quantities]
- [pH target and amendment if needed]
- [Pre-planting fertility action]

---

### Maintenance Schedule
| Task              | Frequency           | Notes                                    |
|-------------------|--------------------|-----------------------------------------|
| Watering          | [Daily/every X days] | [Method, quantity, timing]              |
| Fertilizing       | [Schedule]         | [Product type and rate]                 |
| Weeding           | [Weekly in season] | [Mulch recommendation]                  |
| Pest scouting     | [Weekly]           | [What to look for on these specific crops] |
| Succession sowing | [Specific dates]   | [Which crops and how often]             |

---

### Next Steps Checklist
[ ] [Immediate action 1 -- most time-sensitive given current date]
[ ] [Immediate action 2]
[ ] [Purchase/acquire list: seeds, materials, tools]
[ ] [Infrastructure task: build bed, install trellis, acquire soil]
[ ] [Skill-building task relevant to this gardener's level]
```

---

## Rules

1. **Never make planting date recommendations without knowing the user's frost dates.** A statement like "plant tomatoes in May" is accurate for Zone 6 and wrong for both Zone 4 (too early) and Zone 9 (too late by two months). All dates must be anchored to LFD and FFD.

2. **Right-size the plan to the user's experience level without condescension.** A first-time gardener should not receive a plan with more than 6-8 crop types. More crops mean more pests to identify, more schedules to track, and higher odds of discouragement. Recommend starting small and expanding the following year.

3. **Use a soil thermometer, not a calendar, for warm-season crop timing.** Air temperature is unreliable. A late-season cold snap can leave soil at 52 degrees F even when daytime highs are 70 degrees F. Beans planted in 52-degree soil will rot rather than germinate. Always specify soil temperature thresholds alongside calendar dates.

4. **Account for the hardening-off period in every plan that involves indoor seed starts.** Seedlings grown indoors under grow lights or a sunny window cannot go directly outside without a 7-10 day acclimatization process. Omitting this step causes sunscald, windburn, and transplant failure. Build this period explicitly into the planting calendar.

5. **Always specify crop variety type when it matters.** "Tomato" is not a sufficient recommendation. Specify determinate vs. indeterminate (affects space, support, and harvest timing), days-to-maturity category (early, mid, late), and growth habit (bush, vining, compact) where relevant to the user's space and zone.

6. **Flag crops that will fail for the given zone or season, even if the user requests them.** If a user in Zone 4 asks to grow watermelons in a standard raised bed, recommend a compact short-season variety (e.g., an 80-day variety started indoors 4 weeks before LFD) and explain the risk honestly. Do not simply include the crop without commentary.

7. **Succession planting must be included for all high-turnover crops.** Radishes mature in 25-30 days and the bed is empty; lettuce bolts by early summer; bush beans exhaust themselves in 6-8 weeks. Without succession sowing dates in the calendar, half the growing season is wasted. For every short-season crop, include at least one succession sowing date.

8. **Include companion planting as a functional tool, not a superstition list.** Only recommend companion pairings with documented or strongly observed benefits. Always explain the mechanism (nitrogen fixation, pest confusion, trap cropping, shade provision). Flag the most important antagonisms (fennel, alliums near legumes).

9. **Warn about common beginner overcommitments specific to the crops selected.** Zucchini and summer squash are extraordinarily productive -- one or two plants is enough for most families. Indeterminate tomatoes grow 5-8 feet tall and produce all season but require weekly pruning and staking. Corn requires a minimum 10x10 block for wind pollination and delivers low yield per sqft. Call these out explicitly.

10. **Incorporate at least one season-extension technique for Zones 3-5.** Row covers (lightweight floating fabric, 0.5-1.5 oz/sqft) add 4-8 degrees F of frost protection and can extend both the spring and fall seasons by 2-4 weeks. Cold frames (bottomless box with a transparent lid) can extend the fall season by 6-8 weeks in Zone 5 for cold-hardy crops. Wall-of-water (polycarbonate cylinders filled with water) allow tomato transplanting 3-4 weeks before the last frost date. These techniques are not optional in short-season climates -- they are the difference between a marginal and a productive garden.

---

## Edge Cases

### Short Growing Season (Zones 3-4, 90-130 days)
The primary constraint is days to maturity. Every crop must be vetted against the actual frost-to-frost window. Strategies:
- Prioritize crops that mature in under 60 days: radishes (25 days), lettuce (30-45 days), spinach (40-50 days), peas (60 days), bush beans (50-55 days), kale (50-65 days)
- For tomatoes: choose early-maturing varieties (60-70 days from transplant) rather than main-season varieties (75-90 days). Varieties bred for northern climates set fruit at lower temperatures than standard varieties
- Start tomatoes and peppers indoors 8-10 weeks before last frost -- the full indoor period is non-negotiable in Zone 3-4
- Use season extension aggressively: wall-of-water devices allow transplanting tomatoes 3-4 weeks before LFD; low tunnels with row cover extend fall harvest 3-6 weeks past FFD for cold-hardy crops
- Skip melons, sweet potatoes, okra, eggplant, and standard winter squash unless the user has a heated greenhouse or very long cold frame system
- For winter squash, choose compact bush-habit varieties with 80-day maturity (e.g., acorn or delicata types)

### Hot Climate with a Brutal Summer (Zones 8-10, especially inland areas)
The growing calendar flips. Summer is not the primary growing season -- it is a dormancy period for most crops. Strategies:
- Cool-season crops are the primary food garden and run October through April in Zone 8-9, November through March in Zone 10
- Spring warm-season crops run February-June before heat shuts them down. Plant tomatoes and peppers earlier than any other zone (February in Zone 9)
- Tomatoes stop setting fruit when daytime temperatures exceed 95 degrees F and nighttime temperatures stay above 75 degrees F. Choose heat-tolerant varieties for extended fruiting
- In July-August in Zone 8+, most vegetable production stops. Use this period to rest the soil, plant a heat-tolerant cover crop (cowpeas, sorghum-sudangrass), or grow sweet potatoes which thrive in extreme heat
- Provide shade cloth (30-50% density) over beds during peak summer to protect any survivor crops (sweet potatoes, okra, sweet potatoes, heat-tolerant herbs like rosemary and Thai basil)
- Soil moisture management is critical: drip irrigation on a timer and heavy mulch (3-4 inches of straw or wood chips) are essentially mandatory, not optional

### Container Gardening (Balcony, Patio, or No Ground Access)
Container gardening requires a fundamentally different approach than bed gardening:
- Minimum container sizes: tomatoes require a minimum 15-gallon container (5-gallon works only for compact/patio varieties); peppers and eggplant work in 5-gallon; cucumbers work in 5-gallon with a trellis; herbs and lettuce work in 2-3 gallon or window boxes
- Never use native garden soil in containers -- it compacts, drains poorly, and harbors pathogens in the concentrated environment of a pot
- Containers dry out 2-5x faster than raised beds. In summer, a 5-gallon tomato pot on a south-facing balcony may require watering twice daily. A self-watering container (reservoir-based) dramatically reduces this burden
- Weight matters on balconies: a wet 15-gallon container weighs 80-120 lbs. Check balcony load ratings. Use lightweight perlite-heavy mixes
- Fertility depletes faster in containers because watering flushes nutrients. Apply diluted liquid fertilizer (fish emulsion or liquid kelp) every 1-2 weeks rather than relying solely on slow-release granular at planting
- Dark-colored containers absorb heat and can cook roots in hot climates. Use light-colored or ceramic pots, or double-pot (decorative outer, plain inner)

### Shaded Garden (Under 6 Hours of Direct Sun)
Most people overestimate their sun. Conduct a sun audit on a clear day in summer: measure actual direct sun exposure at 9 AM, 12 PM, and 3 PM, noting when shade falls across the bed. Then:
- 6+ hours direct sun (full sun): all crops are possible
- 4-6 hours (partial sun): acceptable for leafy greens, herbs, peas, beets, chard; fruiting crops (tomatoes, cucumbers, squash) will produce below potential but may still yield
- Under 4 hours (partial shade): restrict to lettuce, spinach, kale, chard, parsley, cilantro, mint, and chives. Do not attempt fruiting crops; the disappointment is near-certain
- Dappled/filtered sun from tree canopy is not equivalent to direct sun even if total hours look adequate. Dappled light delivers much less photosynthetically active radiation
- Solutions for shaded spaces: move beds (even portable raised beds on wheels), use reflective mulch to redirect light, prune tree canopy (requires landowner permission), or accept a leafy green focus

### Soil Contamination and Unknown Site History
Any urban or suburban site near old structures, previous commercial use, or roadways should be treated with caution before growing food:
- Lead from old paint is the most common contaminant. Homes built before 1978 may have lead paint that has flaked into adjacent soil. Roadside soil often contains lead from decades of leaded gasoline use
- A cooperative extension soil test specifically for heavy metals ($20-$50 as a separate add-on) is strongly recommended for any urban lot before growing food in-ground
- Interim strategy while waiting for tests: use raised beds with a physical barrier (landscape fabric, heavy-gauge plastic liner, hardware cloth) separating native soil from the growing medium
- Contaminated sites can be used for gardening in raised beds with at least 12 inches of clean imported soil, as long as splash-back contamination is controlled with mulch
- Do not grow root vegetables (carrots, beets, radishes, potatoes) in contaminated soil -- roots directly contact soil particles

### Late Start (User Plans After the Optimal Window Has Passed)
When a user comes to planning mid-season (e.g., reaching out in July in Zone 6), the plan must acknowledge reality and pivot:
- Acknowledge what can no longer be started from seed outdoors (tomatoes for that year's spring crop, peppers, slow-maturing crops)
- Pivot to what can still succeed: fast-maturing crops for the remaining warm season (bush beans, cucumbers from transplant if available, summer squash), and begin planning the fall cool-season garden which starts 8-10 weeks before FFD
- Frame the season as fall garden season. In Zone 6 with an October 15 FFD, mid-July is ideal timing to start fall brassicas, kale, and schedule September lettuce and spinach sowing
- Use the remaining warm weeks to build soil: establish a compost pile, add cover crops, build beds for next year's garden

### First Garden on Lawn (Converting Turf)
Switching lawn to garden is the most common scenario but has unique complications:
- Existing turf introduces weed seed bank, grass root regrowth (especially with rhizomatous grass like Bermuda, quack grass, or crabgrass), and possible compaction
- No-dig/lasagna method: lay cardboard directly on turf (overlapping seams by 6 inches, removing tape and staples), wet thoroughly, pile 6-8 inches of compost or a raised bed on top. Earthworms and decomposition kill the turf in 2-3 months. Can plant into this system immediately with transplants.
- Tilling method: till in spring when soil is moist but not wet, allow weeds to germinate for 2-3 weeks, till shallowly a second time to kill the flush of germinating weeds (the "stale seedbed" technique), then plant. Warning: deep tilling brings dormant weed seeds to the surface; each subsequent tilling does the same.
- If soil is compacted below 4 inches (test by pushing a pencil into the soil -- if it stops at 4-6 inches, there is a compaction layer), deep loosen with a broadfork or subsoiling before covering with cardboard
- Lawn herbicide history: some broadleaf lawn herbicides (clopyralid, aminopyralid) persist in compost and can damage tomatoes, peppers, and other broadleaf vegetables. If lawn was treated with broadleaf herbicide in the past 2-3 years, test compost by growing indicator beans in a pot of it before adding to beds

---

## Example

**Input:** "I want to start a vegetable garden in my backyard. I'm in Richmond, Virginia -- I think that's Zone 7. I have a 6x10 foot space that gets sun all morning but is shaded around 2 PM. This is my first garden ever. I mostly want to grow things my family actually eats -- salads, tomatoes for sandwiches, and some fresh herbs."

---

## Vegetable Garden Plan: Zone 7a -- 6x10 Raised Bed, First Garden

### Garden Profile
| Parameter            | Value                                    |
|----------------------|------------------------------------------|
| USDA Zone            | 7a (confirmed for Richmond, VA)          |
| Last spring frost    | ~March 25 -- April 5                     |
| First fall frost     | ~November 1 -- November 10               |
| Growing season       | ~210 days                                |
| Bed dimensions       | 6 ft wide x 10 ft long x 12 in tall      |
| Total growing area   | 60 square feet                           |
| Bed type             | Raised bed (recommended for first garden)|
| Sun exposure         | ~6 hours direct sun (morning), partial afternoon shade |
| Orientation          | Long axis north-south                    |

**Sun note:** Six hours of direct morning sun is sufficient for the crops in this plan. The afternoon shade after 2 PM will actually benefit lettuce and herbs by reducing bolting in Richmond's hot summers. Tomatoes and peppers will perform slightly better with additional afternoon sun, but the plan accounts for this by selecting productive varieties suited to partial conditions.

---

### Bed Construction Recommendation

For a first in-ground-adjacent raised bed at 6x10x12 inches, you will need approximately 60 cubic feet (2.2 cubic yards) of growing medium. Recommended fill:

- 40% quality topsoil (screened, weed-free) -- provides mineral base
- 40% aged compost (blended from multiple sources if possible) -- adds fertility and biology
- 20% coarse perlite or vermiculite -- improves drainage and aeration

This mix should never be pure compost (compacts and becomes hydrophobic when dry) or pure topsoil (compacts and drains poorly in containers). Build or purchase a 2x8 or 2x12 cedar, redwood, or untreated pine frame. Avoid pressure-treated lumber (especially older CCA-treated green wood) in food gardens.

---

### Garden Layout (6x10 ft raised bed, viewed from south)

```
NORTH END (trellis on north fence or stakes -- 5-6 ft tall)
+----------------------------------------------------------+
|  [TOMATO - 1]        |  [TOMATO - 2]    |  [PEPPER - 1] |  Row 1: 24-in spacing; caged/staked
|  (Determinate        |  (Determinate    |  (Bell or     |
|   bush type)         |   bush type)     |   sweet type) |
+----------------------------------------------------------+
|  [CUCUMBER x2 - trellised on north wire, 12-in spacing] |  Row 2: vertical along north trellis
+----------------------------------------------------------+
|  [BASIL]  [BASIL]  [BASIL]  [BASIL]  [PARSLEY][PARSLEY] |  Row 3: 10-12 in spacing; herb companion row
+----------------------------------------------------------+
|  [BUSH BEANS - sown in block, 4-in spacing, 3 wide x 4 long] |  Row 4: dense bean block
|  [12 plants this section]                               |
+----------------------------------------------------------+
|  [LETTUCE x8 - leaf mix, 6-in spacing, 2 wide x 4 long] |  Row 5: cut-and-come-again
|  [SPINACH x8 - 4-in spacing, 2 wide x 4 long]          |
+----------------------------------------------------------+
|  [RADISHES - 3-in spacing, 1 wide row intercropped]     |  Row 6: south edge, sow between slower crops
|  [CARROTS - 3-in spacing, 2 rows]                       |  Full sun at south end
+----------------------------------------------------------+
SOUTH END (shortest plants; maximum sun access from south)
```

Trellis note: Install a cattle panel, bamboo poles with twine, or a purpose-built trellis running along the entire north end of the bed (6 feet wide, 5-6 feet tall). This is your highest-ROI infrastructure investment -- cucumbers trellised vertically occupy only 
