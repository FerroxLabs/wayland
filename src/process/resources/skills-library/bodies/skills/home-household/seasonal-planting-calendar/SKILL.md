---
name: seasonal-planting-calendar
description: |
  Creates a zone-aware planting calendar based on USDA hardiness zone and frost dates, with planting windows for vegetables, herbs, and cool/warm-season crops. Includes succession planting schedules and seed-starting timelines.
  Use when the user asks when to plant specific crops, needs a planting schedule for their zone, wants to know seed-starting dates, or asks about succession planting for extended harvests.
  Do NOT use for full garden design and layout (use vegetable-garden-planning), plant problem diagnosis (use plant-care-troubleshooting), or indoor houseplant schedules (use indoor-plant-care).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "gardening planning checklist"
  category: "home-household"
  subcategory: "gardening"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Seasonal Planting Calendar

## When to Use

**Use this skill when:**
- A user asks when to plant a specific vegetable, herb, or flower and mentions their location, ZIP code, or USDA zone
- A user wants a complete planting schedule for an upcoming season and needs it anchored to their actual frost dates
- A user asks when to start seeds indoors and wants specific dates relative to transplanting outdoors
- A user wants to stagger plantings of lettuce, radishes, beans, or other short-season crops for continuous harvest
- A user is planning a fall or winter garden and needs to count backward from their first fall frost
- A user asks about soil temperature requirements before direct sowing warm-season crops
- A user wants to know which crops they can still plant given a mid-season start
- A user in a hot or tropical climate needs a planting framework not based on frost dates

**Do NOT use when:**
- The user needs spatial layout, bed organization, companion planting pairings, or spacing decisions -- use `vegetable-garden-planning`
- The user has a plant that is yellowing, wilting, showing disease symptoms, or failing to thrive -- use `plant-care-troubleshooting`
- The user is asking about watering schedules, potting mix, or repotting for indoor plants -- use `indoor-plant-care`
- The user needs a lawn aeration, overseeding, or fertilization schedule -- use `lawn-care-schedule`
- The user is asking about perennial flower beds, bulb planting for ornamentals, or landscape shrub timing -- the frost-date framework still applies but the specific crop data in this skill is for edible gardens
- The user wants pest identification or integrated pest management strategy -- use `garden-pest-management`

---

## Process

### Step 1: Gather Zone, Frost Dates, and Garden Context

Accurate planting calendars require three anchoring data points: USDA hardiness zone, last spring frost date (LFD), and first fall frost date (FFD). Never proceed with generic calendar months alone.

- Ask the user for their USDA zone or ZIP code if they have not provided it. Zones are available from the USDA Plant Hardiness Zone Map, which was updated in 2023 and is significantly more granular than earlier versions.
- Use the zone as a starting estimate only. Actual frost dates vary within a zone due to microclimates: low-lying areas, proximity to large bodies of water, urban heat islands, and slope orientation can shift local frost dates by 2-4 weeks from zone averages.
- **Always recommend** that the user verify their specific frost dates with their state's cooperative extension service or NOAA's climate normals database (ask a local master gardener or county extension agent if unsure).
- Collect secondary context: How large is the garden? Is it raised beds, containers, or in-ground? Do they have access to row covers, cold frames, or a greenhouse? These tools shift effective planting windows by 2-6 weeks and must factor into the calendar.
- Ask which crops they want to grow. Do not build a 40-crop calendar for someone who only wants tomatoes, peppers, and lettuce -- tailor the output tightly to their stated goals.

**Frost date reference by zone (NOAA 30-year climate normals, average dates):**
| Zone | Last Spring Frost (LFD) | First Fall Frost (FFD) | Avg Growing Season |
|------|------------------------|------------------------|-------------------|
| 3a | June 1-15 | Aug 15-Sept 1 | 75-90 days |
| 3b | May 15 - June 1 | Sept 1-15 | 90-110 days |
| 4a | May 15-25 | Sept 15-25 | 105-130 days |
| 4b | May 1-15 | Sept 25 - Oct 5 | 120-140 days |
| 5a | April 25 - May 5 | Oct 5-15 | 140-155 days |
| 5b | April 15-25 | Oct 15-25 | 155-170 days |
| 6a | April 5-15 | Oct 25 - Nov 5 | 165-185 days |
| 6b | March 25 - April 5 | Nov 5-15 | 185-205 days |
| 7a | March 15-25 | Nov 10-20 | 200-220 days |
| 7b | March 1-15 | Nov 20 - Dec 1 | 220-240 days |
| 8a | Feb 20 - March 5 | Nov 28 - Dec 10 | 240-265 days |
| 8b | Feb 10-20 | Dec 8-20 | 265-285 days |
| 9a | Jan 20 - Feb 10 | Dec 15 - Jan 1 | 285-310 days |
| 9b | Jan 10-20 | Dec 20 - Jan 15 | 310+ days |
| 10+ | Frost rare or absent | Frost rare or absent | Year-round |

---

### Step 2: Classify All Requested Crops by Temperature Tolerance

Every planting decision flows from how a crop responds to cold air, cold soil, and heat. Misclassifying a crop is the most common source of planting errors.

**Category 1 -- Hardy cool-season crops (survive hard frost to 26 degrees F, germinate in 40-degree-F soil):**
- Can be direct sown outdoors 4-6 weeks before LFD when soil is workable (not frozen or waterlogged)
- Can be transplanted even earlier if using row covers
- Examples: kale, spinach, turnips, kohlrabi, mache, claytonia, arugula, overwintered onions
- Fall planting is often more productive than spring for these crops -- bolting is not a risk in cooling fall temperatures
- Soil temperature for germination: 40-85 degrees F (optimal 60-65)

**Category 2 -- Semi-hardy cool-season crops (survive light frost to 28-30 degrees F, thrive 45-75 degrees F):**
- Direct sow 2-4 weeks before LFD; transplant 3-5 weeks before LFD with some frost protection
- Examples: lettuce, peas, Swiss chard, beets, carrots, parsnips, broccoli, cauliflower, cabbage, Brussels sprouts, cilantro, dill, parsley
- Soil temperature for germination: 45-85 degrees F (optimal 65-70)

**Category 3 -- Tender warm-season crops (killed by frost, need soil above 60 degrees F, prefer air temperatures 65-85 degrees F):**
- Transplant outdoors at or 1-2 weeks after LFD when nighttime lows consistently exceed 50 degrees F
- Direct sow 1-2 weeks after LFD when soil temperature at 2-inch depth exceeds 60 degrees F
- Examples: tomatoes, cucumbers, summer squash, zucchini, beans (pole and bush), basil, corn, tomatillos
- Soil temperature for germination: 60-95 degrees F (optimal 70-85)

**Category 4 -- Heat-loving crops (stunted or fail below 65 degrees F soil, thrive in 80-95 degree F air temperatures):**
- Plant 2-4 weeks after LFD, not before
- Examples: peppers, eggplant, sweet potatoes, melons, watermelon, okra, lima beans, southern peas, lemongrass, ginger
- Peppers and eggplant will sit dormant or develop chilling injury if transplanted into soil below 60 degrees F -- warmer is always better
- Sweet potatoes require soil above 65 degrees F for slips to establish; 70 degrees F is ideal
- Soil temperature for germination: 65-95 degrees F (optimal 80-85)

**Soil thermometer note:** A $10-15 soil thermometer is one of the most useful tools in vegetable gardening. Check soil temperature at a 2-inch depth in the morning (the coldest reading of the day) before planting warm-season crops. Do not rely on air temperature or calendar dates alone for soil-temperature-sensitive crops.

---

### Step 3: Calculate Indoor Seed-Starting Dates

Count backward from the outdoor transplant date, not from the last frost date directly. These are distinct dates for most crops.

**The formula:** Seed start date = Transplant date minus weeks-to-transplant-size

**Indoor seed-starting reference table:**
| Crop | Weeks Indoors Before Transplanting | Transplant Timing Relative to LFD | Notes |
|------|-----------------------------------|------------------------------------|-------|
| Onions (from seed) | 10-12 weeks | 4-6 weeks before LFD | Slow-growing; need early start and strong light |
| Celery/Celeriac | 10-12 weeks | 2-3 weeks before LFD | Germinates slowly at 65-70 degrees F; needs consistent moisture |
| Peppers | 8-10 weeks | On LFD or 1-2 weeks after | Start early; peppers are slow and need warmth (75-85 degrees F soil to germinate) |
| Eggplant | 8-10 weeks | 1-2 weeks after LFD | Similar needs to pepper; chilling injury risk if transplanted cold |
| Leeks | 8-10 weeks | 4 weeks before LFD | Start same time as onions; slow establishment |
| Tomatoes | 6-8 weeks | On LFD or 1 week after | 8 weeks produces stocky transplants; avoid leggy seedlings |
| Broccoli/Cauliflower | 6-8 weeks | 3-4 weeks before LFD | Spring transplants; start 6 weeks for spring, 6 weeks before fall transplant date |
| Cabbage | 6-8 weeks | 3-4 weeks before LFD | Tolerates frost; transplant early with row cover protection |
| Brussels Sprouts | 6-8 weeks | 3-4 weeks before LFD | Long season crop; must get in ground early enough to mature before fall FFD |
| Basil | 4-6 weeks | 1-2 weeks after LFD | Very frost sensitive; harden off carefully |
| Lettuce | 4-6 weeks | 4-5 weeks before LFD | Fast-germinating; transplants extend the season by several weeks |
| Swiss chard | 4-6 weeks | 2-3 weeks before LFD | Easy to start; can also direct sow |
| Cucumbers | 3-4 weeks | 1-2 weeks after LFD | Do not start too early -- roots resent disturbance and leggy starts perform poorly |
| Summer squash/zucchini | 3-4 weeks | 1-2 weeks after LFD | Grows rapidly; long-started seedlings become pot-bound and stunted |
| Winter squash/pumpkins | 3-4 weeks | 1-2 weeks after LFD | Some varieties need 100+ days; starting indoors saves critical time in short-season zones |
| Melons/Watermelons | 3-4 weeks | 2-3 weeks after LFD | Need warm soil; Zone 5 and colder benefit from transplants and black plastic mulch |

**Germination conditions and equipment:**
- Use a heat mat set to 75-80 degrees F for peppers, eggplant, tomatoes, and basil. Germination rate for peppers drops dramatically below 70 degrees F.
- Use grow lights positioned 2-3 inches above seedlings for 14-16 hours per day. Insufficient light is the primary cause of leggy, weak transplants.
- Thin to one seedling per cell once true leaves appear. Crowded cells produce weak root systems.
- Begin fertilizing with half-strength balanced liquid fertilizer (5-5-5 or similar) once seedlings have their first set of true leaves. Seed-starting mix contains no nutrients.

**Hardening off (mandatory for all transplants):**
- Begin 7-10 days before planned transplant date
- Day 1-2: 1-2 hours outdoors in shade, no wind exposure
- Day 3-4: 2-3 hours with indirect sun
- Day 5-6: 4-5 hours with morning sun
- Day 7-8: 6-8 hours with full sun
- Day 9-10: Overnight outdoors if temps allow (above 50 degrees F for warm-season crops)
- Skip hardening off or rush it, and transplant shock will set crops back 2-3 weeks -- negating the benefit of starting early

---

### Step 4: Build the Month-by-Month Planting Calendar

Calculate every date relative to the user's confirmed LFD and FFD. Never use absolute calendar months without anchoring them to the user's specific frost dates.

**Calendar construction method:**
- Start with LFD as the reference zero point (call it Week 0)
- Count backward in weeks for cool-season crops and seed starting
- Count forward in weeks for warm-season and heat-loving crops
- Count backward from FFD for fall planting windows
- Overlay the two sequences (spring-forward and fall-backward) to identify the full-season calendar

**Key timing anchors:**
| Timing | Action |
|--------|--------|
| LFD minus 12 weeks | Start onion, celery, leek seeds indoors |
| LFD minus 10 weeks | Start pepper and eggplant seeds indoors |
| LFD minus 8 weeks | Start tomato, broccoli, cabbage seeds indoors |
| LFD minus 6 weeks | Start lettuce, chard transplants indoors; direct sow hardy cool-season crops outdoors |
| LFD minus 4 weeks | Direct sow semi-hardy crops outdoors; transplant brassicas with row cover |
| LFD minus 2 weeks | Begin hardening off warm-season transplants |
| LFD (Week 0) | Monitor nighttime temps; transplant tomatoes when nights stay above 50 degrees F |
| LFD plus 1-2 weeks | Transplant peppers, eggplant, basil; direct sow beans, corn, cucumbers, squash |
| LFD plus 3-4 weeks | Plant heat-lovers: melons, sweet potatoes, okra |
| FFD minus 10 weeks | Start fall broccoli, cauliflower, cabbage seeds indoors |
| FFD minus 8 weeks | Transplant fall brassicas outdoors |
| FFD minus 8 weeks | Direct sow fall lettuce, spinach, arugula, kale |
| FFD minus 6 weeks | Last direct sow of fast crops (radishes, mache, spinach) |
| FFD minus 3-4 weeks | Plant garlic cloves (for next year's harvest) |
| FFD minus 2 weeks | Cover cold-hardy fall crops with row cover for frost extension |

---

### Step 5: Design the Succession Planting Schedule

Succession planting is the practice of making multiple small plantings of a single crop at staggered intervals to extend harvest over weeks or months rather than getting a single large glut. It is most valuable for crops that mature quickly, bolt in heat, or degrade rapidly after harvest.

**How to calculate succession intervals:**
- Divide the total planting window by the days-to-maturity
- For leaf crops: replant when the previous sowing reaches 4-6 inches tall (about 2-3 weeks after germination in spring)
- For root crops and beans: replant when the previous sowing is clearly established (2-3 weeks after germination)
- Stop succession planting with enough days remaining before the crop's limiting factor (heat bolting for cool-season crops, fall frost for warm-season crops)

**Succession planting reference guide:**
| Crop | Days to Harvest | Succession Interval | Spring Window | Summer Window | Fall Window | Notes |
|------|----------------|--------------------|--------------|-----------|-----------| ------|
| Radishes | 22-30 days | Every 10-14 days | LFD -6 to LFD -2 | Avoid peak heat | FFD -8 to FFD -4 | Skip planting in soil above 80 degrees F |
| Leaf lettuce | 30-45 days | Every 2-3 weeks | LFD -6 to LFD +2 | Shade extends window | FFD -8 to FFD -4 | Switch to heat-tolerant varieties (Jericho, Nevada) in summer |
| Spinach | 35-50 days | Every 2-3 weeks | LFD -6 to LFD -1 | Bolts; avoid | FFD -8 to FFD -4 | Bolts in day length over 14 hours; fall planting is more reliable |
| Bush beans | 50-60 days | Every 2-3 weeks | LFD to LFD +2 | LFD +4 to FFD -10 | -- | Stop planting 60 days before FFD to ensure harvest |
| Arugula | 25-40 days | Every 2 weeks | LFD -5 to LFD | Bolts quickly | FFD -7 to FFD -3 | Bolts and turns bitter above 75 degrees F |
| Cilantro | 45-70 days (to seed) | Every 2-3 weeks | LFD -3 to LFD +1 | Limited; use shade | FFD -8 to FFD -4 | Slow-bolt varieties (Leisure, Santo) extend spring window |
| Dill | 40-60 days | Every 3 weeks | LFD -2 to LFD +3 | Limited | FFD -8 | Self-seeds prolifically; allow some to bolt for natural succession |
| Peas (shell/snap) | 60-75 days | One or two plantings | LFD -6 to LFD -4 | Cannot tolerate summer heat | FFD -10 to FFD -8 | Short planting window; fall planting needs at least 70 days before FFD |
| Scallions/Green onions | 50-70 days | Every 3 weeks | LFD -5 to LFD | Yes | FFD -10 | Slow germination; can direct sow or transplant |
| Kale | 50-70 days (to harvest) | One or two plantings | LFD -6 | -- | FFD -8 | Fall kale sweeter; frost improves flavor by converting starches to sugars |

---

### Step 6: Add Season-Extension Strategies

Season extension tools are often the difference between a 140-day growing season and an effective 180-day season. Include recommendations calibrated to the user's zone and stated goals.

**Row covers (Reemay or spunbond fabric):**
- Lightweight (0.5 oz/sq yard): provides 2-4 degrees F of frost protection; allows 85-90% light transmission; extends season by 2-3 weeks
- Medium weight (1.5 oz/sq yard): provides 4-6 degrees F of frost protection; 70% light transmission; extends season by 3-5 weeks
- Heavy weight (2.0+ oz/sq yard): provides 6-10 degrees F of frost protection; reduces light significantly; primarily used for hard freeze protection, not active growing
- Lay directly on crops or use wire hoops to keep fabric off foliage; anchor edges with soil, sandbags, or landscape staples

**Cold frames:**
- Typically a bottomless box with a transparent lid (old storm windows, corrugated polycarbonate, or twin-wall polycarbonate)
- Adds 4-8 weeks to both ends of the season depending on construction and location
- Vent on warm days (above 40 degrees F outside) to prevent overheating; unvented cold frames can exceed 90 degrees F on sunny winter days
- Orient south-facing for maximum solar gain

**Black plastic mulch:**
- Raises soil temperature by 5-10 degrees F; critical for warm-season crops in Zone 5 and colder
- Particularly useful for peppers, melons, eggplant, and sweet potatoes where soil temperature is the limiting factor
- Lay 1-2 weeks before transplanting to pre-warm the soil

**Wall-O-Waters and season starters:**
- Allow tomato transplants 3-4 weeks earlier than normal -- up to 6 weeks before LFD in Zone 5-6
- Fill outer cells with water; thermal mass absorbs daytime heat and releases it overnight
- Plants inside can withstand nights down to 16-20 degrees F when properly filled

---

### Step 7: Format and Deliver the Calendar

Assemble all data into the output format below. Include:
- A header with confirmed zone, LFD, and FFD
- An indoor seed-starting table sorted chronologically
- Spring planting table with direct sow vs. transplant column
- A succession planting schedule for all applicable crops
- Fall planting table counting backward from FFD
- A monthly at-a-glance summary for quick reference
- Any zone-specific notes or season-extension recommendations

---

## Output Format

```
## Planting Calendar: Zone [X] (LFD: [Month Day], FFD: [Month Day], Growing Season: ~[N] days)

> **Important:** All dates are calculated from LFD = [date] and FFD = [date].
> Verify your local frost dates at your county cooperative extension or NOAA's
> climate data portal. Microclimates can shift these dates by 1-3 weeks.

---

### Indoor Seed Starting

| Start Date | Crop | Variety Notes | Weeks Indoors | Transplant Date | Germination Temp |
|------------|------|---------------|---------------|-----------------|-----------------|
| [Date] | [Crop] | [e.g., determinate tomato for short seasons] | [N] weeks | [Date] | [N] degrees F |

---

### Spring Outdoor Planting

| Date Range | Crop | Method | Soil Temp Required | Notes |
|------------|------|--------|--------------------|-------|
| [Date range] | [Crop] | Direct sow / Transplant | [N] degrees F | [Specific note] |

---

### Succession Planting Schedule

| Crop | First Planting | Replant Every | Last Planting Date | # of Plantings | Bolting / Stop Trigger |
|------|---------------|---------------|--------------------|---------------|----------------------|
| [Crop] | [Date] | [N] weeks | [Date] | [N] | [Heat bolt / FFD -N weeks] |

---

### Summer Maintenance Calendar

| Date Range | Action | Purpose |
|------------|--------|---------|
| [Date] | [Task] | [Why it matters] |

---

### Fall Planting Calendar (Counting Backward from FFD: [date])

| Plant By Date | Crop | Days to Maturity | Method | Notes |
|--------------|------|-----------------|--------|-------|
| [Date] | [Crop] | [N] days | Direct sow / Transplant | [Note] |

---

### Season Extension Options

| Tool | Protection Level | Effective Date Shift | Best Used For |
|------|-----------------|---------------------|---------------|
| Row cover (lightweight) | +3-4 degrees F | +2-3 weeks | Cool-season crops, frost protection |
| Row cover (medium) | +5-6 degrees F | +3-4 weeks | Brassicas, fall extension |
| Cold frame | +4-8 degrees F | +4-6 weeks | Starting/ending season |
| Black plastic mulch | Soil +8-10 degrees F | Enables earlier transplant | Tomatoes, peppers, melons |
| Wall-O-Waters | Down to 16-20 degrees F | +3-6 weeks (spring) | Tomatoes only |

---

### Monthly At-a-Glance

| Month | Priority Actions | What to Watch For |
|-------|-----------------|------------------|
| [Month] | [1-3 key tasks] | [Timing trigger or risk] |

---

### Crop-Specific Notes
[Any additional notes about specific varieties, regional considerations,
 soil temperature warnings, or timing nuances for the crops requested]
```

---

## Rules

1. **Always anchor to frost dates, never to calendar months alone.** A Zone 4 gardener and a Zone 8 gardener follow the same sequence of steps but months apart. Presenting dates without the zone and frost date context they derive from will cause real planting failures.

2. **Distinguish between soil temperature and air temperature for every warm-season crop.** Soil temperature lags air temperature by 2-4 weeks in spring. A warm April week does not mean the soil at 2-inch depth has crossed 60 degrees F. This is the most common cause of poor germination and transplant shock in spring.

3. **Always specify direct sow vs. transplant for every crop.** Cucumbers, squash, beans, corn, peas, and root crops do best from direct sow and resent root disturbance. Starting them indoors longer than 3-4 weeks will produce root-bound, stunted transplants that underperform direct-sown seedlings.

4. **Include hardening off time in all transplant date calculations.** If the transplant target date is May 10, the hardening off window starts May 1-3. Failing to account for this means transplants hit the garden without acclimatization and suffer a 2-3 week setback.

5. **Never omit the fall planting calendar.** Fall is the most overlooked and often most productive season for cool-season crops. Kale, spinach, lettuce, broccoli, and carrots planted in late summer produce harvests through October or November in most zones. Presenting only a spring calendar is an incomplete service.

6. **Flag bolting risk for all cool-season crops.** Spinach, cilantro, arugula, and lettuce bolt (go to seed) when day length exceeds 14 hours and temperatures regularly exceed 80 degrees F. Include the expected bolting window and recommend heat-tolerant varieties or shade cloth for summer succession.

7. **Specify days-to-maturity when recommending varieties for short-season zones.** In Zone 3-4, the difference between an 85-day tomato and a 70-day tomato can mean the difference between a full harvest and a crop killed by early frost. Always recommend short-season varieties (65-75 day tomatoes, 65-day cucumbers, etc.) for zones with growing seasons under 130 days.

8. **Do not present frost dates as exact.** They are 30-year statistical averages with a 50% probability of frost on that date. There is a 10% probability of frost up to 2-3 weeks after the "last frost date." For frost-sensitive crops like basil, peppers, and transplanted tomatoes, recommend using season-extension tools or waiting for more reliable warmth rather than transplanting exactly on the LFD.

9. **Flag the soil workability constraint for early spring direct sowing.** Many gardeners in Zones 4-5 can technically sow peas or spinach 6 weeks before LFD by the calendar, but late snow, frozen ground, or saturated soil makes this impossible. Include a note that soil must be friable (crumbles rather than smears when squeezed) before any direct sowing.

10. **Include garlic planting timing in every calendar for Zone 5 and colder.** Fall-planted hardneck garlic is one of the most rewarding crops a gardener in a cold climate can grow, and most novice gardeners do not know about it. Plant cloves 4-6 weeks before hard freeze (FFD minus 3-5 weeks) at 2-3 inches deep with 6 inches of straw mulch on top. Harvest the following July when lower leaves begin to yellow.

---

## Edge Cases

### Zone 3-4 (Under 120-Day Growing Season): The Short-Season Override
The standard timing tables do not work without modification for Zone 3b and colder. Apply these adjustments:
- Nearly everything except radishes, peas, and direct-sown spinach should be started indoors
- Choose varieties specifically labeled for short seasons: "Stupice" tomato (60 days), "Bush Pickle" cucumber (45 days), "Astro" arugula, "Earlirouge" sweet corn (65 days)
- Wall-O-Waters allow tomato transplants in Zone 4 as early as late April -- 5-6 weeks before the LFD
- High tunnels (unheated plastic-covered structures) effectively shift a Zone 4 garden to Zone 6 conditions inside
- Avoid warm-season crops with days-to-maturity exceeding 85 days unless using season extension tools; melons and sweet potatoes are marginal without black plastic mulch and row cover
- Fall planting window is very narrow (FFD minus 6 weeks maximum); prioritize kale, spinach, and radishes, which are the most frost-tolerant

### Zone 9-10 (Frost-Rare or Frost-Free): Inverse Season Planning
The frost-date framework must be entirely replaced with a cool season/warm season framework:
- **Cool season (October-March):** This is peak growing season. Plant all brassicas, lettuces, root vegetables, peas, cilantro, and parsley during this window. These crops fail in summer heat regardless of zone.
- **Warm season (March-October):** Tomatoes, peppers, cucumbers, squash, and beans are planted in late winter (February-March) and harvested by June-July before the most intense heat arrives. A second planting in August-September for fall harvest is common.
- Summer temperatures in Zone 9-10 are the primary limiting factor, not frost. Many crops go dormant, bolt, or develop fungal disease under prolonged summer heat and humidity.
- Provide a bimodal calendar with two peak planting seasons rather than the spring-summer-fall linear structure.
- Garlic should be planted in November-December; pre-chill garlic cloves in the refrigerator for 4-6 weeks before planting in very warm zones (9b, 10) to simulate the cold stratification they require.

### Mid-Season Start (User Missed the Spring Window): Rapid Reassessment
If a user contacts you in June, July, or August having missed the spring planting window, reframe the conversation around what is still achievable:
- Calculate remaining growing days to FFD
- If 90+ days remain: direct sow beans, cucumbers, summer squash, and fast-maturing tomato varieties (but transplants only if available; starting tomatoes from seed in June will not produce before frost in Zone 5 or colder)
- If 70-90 days remain: focus on fall crops -- plant lettuce, kale, arugula, broccoli transplants, and radishes for fall harvests
- If 50-70 days remain: spinach, arugula, lettuce, and radishes are the only viable crops; plant immediately
- Frame the response positively: "You have a great fall garden window" rather than "you missed spring"
- Provide the succession planting table starting from the current date, truncated to what fits the remaining season

### Raised Beds vs. In-Ground Gardens: Soil Temperature Difference
Raised beds warm 2-4 weeks faster than in-ground soil in spring and cool 2-4 weeks faster in fall. This shifts the planting calendar meaningfully:
- In Zones 5-6, raised bed gardeners can often transplant tomatoes and peppers 1-2 weeks earlier than in-ground gardeners in the same location
- Raised beds are more vulnerable to early fall frost because the soil has less thermal mass
- Recommend black plastic mulch for in-ground warm-season crops in Zones 4-5; it is less necessary in raised beds where the soil warms faster

### Container and Balcony Gardens: Modified Timing
Container gardeners face unique constraints that alter the standard timing:
- Containers dry out rapidly and can freeze solid in winter, killing roots -- this matters for container-grown perennial herbs (thyme, sage, rosemary)
- Small containers (under 5 gallons) have very little thermal mass and experience more extreme temperature swings than in-ground soil
- Tomatoes need a minimum 5-gallon container (10-15 gallon preferred for full-size varieties); underpotted tomatoes stall in growth regardless of planting timing
- Succession planting works especially well in containers because spent crops can be removed and replaced individually without disturbing adjacent plantings
- Lightweight row cover draped over container plants on frost nights provides adequate protection without permanent infrastructure

### Regional Anomalies: Fog, Coastal, and High Altitude Zones
USDA zones are based solely on minimum winter temperature. They do not account for:
- **Pacific Coast marine climates (Zone 9-10 coastal California):** Summer temperatures are cool (55-65 degrees F highs), which is too cold for tomatoes and peppers to set fruit well despite the frost-free classification. Warm-season crops must be timed to the inland heat, or cold-tolerant varieties ("Stupice," "Legend") must be used.
- **High elevation Zone 5 (Colorado Front Range, Intermountain West):** Strong UV radiation accelerates plant growth but afternoon thunderstorms can cause hail damage. Short-season varieties are mandatory. Plant in sheltered locations and be prepared for late spring snowstorms even after LFD.
- **Gulf Coast Zone 8-9:** High summer humidity drives fungal disease pressure. Timing tomatoes to finish production before June heat and humidity is critical. Consider planting tomatoes in February-March (as transplants from fall-started seeds) for a spring-only harvest cycle.

### User Has No Zone Information: Estimation from City or Region
If the user cannot identify their USDA zone or does not know their frost dates:
- Ask for their nearest large city or general region (e.g., "suburban Chicago" or "central Virginia")
- Provide an estimated zone with the caveat that this is approximate
- Recommend they confirm with their state's cooperative extension service
- Chicago area: Zone 5b-6a, LFD around April 25 - May 5, FFD around October 15-25
- Atlanta area: Zone 7b-8a, LFD around March 5-15, FFD around November 15-25
- Denver area: Zone 5b-6a but with significant microclimate variation, LFD May 1-15
- Seattle area: Zone 8b, LFD March 1-15 but cool summers limit heat-loving crops
- Houston area: Zone 9a, LFD January 20 - February 10; summer heat stops warm-season crops by June
- Do not build a detailed calendar until frost dates are confirmed -- flag this explicitly

---

## Example

**Input:** "I'm in Zone 6a, last frost around April 10, first fall frost around November 1. I want to grow tomatoes (2 varieties), peppers, lettuce, basil, cilantro, and zucchini. This is a raised bed garden. What's my full-season planting calendar?"

---

**Output:**

## Planting Calendar: Zone 6a (LFD: April 10, FFD: November 1, Growing Season: ~205 days)

> **Important:** All dates are calculated from LFD = April 10 and FFD = November 1.
> Verify your local frost dates at your county cooperative extension service.
> As a raised bed garden, your soil will warm 2-3 weeks faster than in-ground plots --
> you can often transplant tomatoes and peppers 1 week earlier than Zone 6a in-ground gardeners.
> A 50% frost probability exists on April 10; for best results transplant warm-season crops
> when nighttime lows are consistently above 50 degrees F (typically April 15-20 in your zone).

---

### Indoor Seed Starting

| Start Date | Crop | Variety Notes | Weeks Indoors | Transplant Date | Germination Temp |
|------------|------|---------------|---------------|-----------------|-----------------|
| Jan 13 | Peppers | Choose 1 sweet bell and 1 frying/snack type (faster maturing than bells) | 10-12 weeks | April 20-28 | 78-85 degrees F; use heat mat |
| Feb 3 | Tomatoes | Choose 1 indeterminate slicer (75-80 days) and 1 determinate paste or cherry (65-70 days) for extended harvest | 8-10 weeks | April 18-25 | 70-75 degrees F |
| Feb 10 | Eggplant (optional add-on) | If desired -- same timeline as pepper | 8-10 weeks | April 20-28 | 78-85 degrees F; heat mat |
| March 10 | Basil | Genovese or Italian Large Leaf; very frost sensitive | 4-6 weeks | April 22-30 | 70-75 degrees F |
| March 15 | Lettuce transplants | Oakleaf, Buttercrunch, or Jericho (heat-tolerant for extended spring window) | 4 weeks | April 1-8 | 60-65 degrees F; cool germination |

---

### Spring Outdoor Planting

| Date Range | Crop | Method | Soil Temp Required | Notes |
|------------|------|--------|--------------------|-------|
| March 1-10 | Lettuce (seed) | Direct sow 1/8 inch deep | 45 degrees F (germinates down to 40) | Sow thinly; thin to 6 inches for leaf types; raised bed soil may be workable early March |
| March 1-10 | Cilantro (first succession) | Direct sow 1/4 inch deep, 3 inches apart | 50 degrees F | Bolt-resistant varieties: Leisure, Santo; this planting will bolt by late May |
| March 10-20 | Spinach | Direct sow 1/2 inch deep, 3 inches apart | 40 degrees F | Spring spinach is short-lived; expect 4-6 harvests before bolting in late May |
| March 20-April 1 | Arugula | Direct sow thinly | 40 degrees F | Cut-and-come-again; bolts when temps exceed 75 degrees F consistently |
| April 1-10 | Lettuce transplants (from indoor starts) | Transplant to 8-inch spacing | 45 degrees F | From March 15 starts; plant out 1 week before LFD; cover with lightweight row cover if frost threatens |
| April 1-10 | Peas (snap or shell) | Direct sow 1 inch deep, 2 inches apart | 45 degrees F | This is late for Zone 6a spring peas; plant as soon as possible for harvest before summer heat arrives |
| April 10 | Begin monitoring overnight temperatures for transplant window | -- | -- | Wait until 3+ consecutive nights above 50 degrees F before transplanting tomatoes; peppers prefer 55 degrees F nights |
| April 18-25 | Tomatoes | Transplant (from Feb 3 starts) | 60 degrees F at 2-inch depth | Raised bed soil should reach 60 degrees F by mid-April; confirm with soil thermometer before planting |
| April 20-28 | Peppers | Transplant (from Jan 13 starts) | 65 degrees F at 2-inch depth | Peppers suffer chilling injury below 55 degrees F; raised beds warm faster than in-ground, but verify soil temp |
| April 22-30 | Basil | Transplant (from March 10 starts) | 60 degrees F | Basil dies at 32 degrees F and is damaged at prolonged temps below 50 degrees F; harden thoroughly |
| April 25 - May 1 | Zucchini | Direct sow OR transplant from 3-week-old starts | 65 degrees F | Sow 2 seeds per hill, 1 inch deep; thin to 1 plant when 4 inches tall; raised beds will have adequate soil temp by late April |
| May 1-10 | Cilantro (second succession) | Direct sow | 55 degrees F | Partial shade will extend this planting's life into June; expect bolting by mid-June |

**Hardening off schedule:**
Begin hardening off tomatoes, peppers, and basil starting April 8-10.
- April 8-10: 1-2 hours outdoor shade only
- April 11-14: 3-4 hours indirect/morning sun
- April 15-18: Full day outdoors, bring in if frost forecast
- April 18-20: Overnight outdoors if nights above 50 degrees F (tomatoes); nights above 55 degrees F (peppers, basil)
- April 18-25: Transplant tomatoes; April 20-28: Transplant peppers and basil

---

### Succession Planting Schedule

| Crop | First Planting | Replant Every | Last Planting Date | # of Plantings | Bolting / Stop Trigger |
|------|---------------|---------------|--------------------|---------------|----------------------|
| Lettuce (leaf) | March 1 | 2-3 weeks | Aug 15 | 7-8 total | Spring bolt when temps exceed 80 degrees F; use Jericho or Nevada varieties for summer plantings; direct sow summer in light shade |
| Arugula | March 1 | 2 weeks | Sept 1 | 8-9 total | Bolts when temps consistently exceed 75 degrees F; summer succession in shade only |
| Cilantro | March 1 | 2-3 weeks | Sept 15 | 7-8 total | Spring successions bolt by mid-May; resumeplanting in mid-August for productive fall window |
| Zucchini | April 25 | Not needed (plant only 1-2 plants) | -- | 1-2 plants total | 1 zucchini plant is usually sufficient; succession not needed; plants become powdery mildew-prone by August in Zone 6 -- second succession planting in late June extends fresh production |
| Basil | April 22 | Can start second round indoors June 1 for fresh late-summer plant | July 1 transplant | 2 generations | Basil peaks and then declines after first flowering; pinch flowers constantly; replace plant in July for vigorous late-summer harvest |

**Cilantro summer gap strategy:** Cilantro bolts too quickly for productive summer harvests in Zone 6 heat. Skip succession plantings from approximately June 15 to August 1. Resume planting in mid-August for a productive fall window (August-October). The fall cilantro crop in Zone 6 is often the best of the year.

---

### Summer Maintenance Calendar

| Date Range | Action | Purpose |
|------------|--------|---------|
| Late May - June | Mulch tomatoes and peppers with 3-inch layer of straw or wood chips after soil reaches 70 degrees F | Retain moisture, suppress weeds, prevent soil splash on lower leaves (reduces early blight) |
| June | Pinch basil flower buds as soon as they appear weekly | Delays bolting by 4-6 weeks and maintains leaf production |
| June 15 - July 1 | Stop cool-season succession plantings (arugula, spring cilantro window closes) | Prevent wasted effort on crops that will bolt immediately |
| June 15 | Begin supporting tomatoes: cage, stake, or trellis all plants; remove any suckers from indeterminate varieties if using single-stake method | Unsupported indeterminate tomatoes become unmanageable by July |
| July 1-10 | Start second-generation basil indoors or purchase transplant for mid-July installation | Replaces the spring basil plant which begins declining after repeated flowering |
| July 10-20 | Start fall broccoli and cauliflower seeds indoors for August transplant (if adding to plan) | Requires 6-7 weeks indoors; transplants go out FFD minus 10 weeks = ~Aug 20 |
| July 15 - Aug 1 | Begin succession-planting lettuce again after summer peak heat | Direct sow in partial shade (east-facing bed side, under taller crops) for fall harvest |
| July 20 | Evaluate zucchini for powdery mildew; consider replacing with second planting if first plant is declining | Zone 6 late July heat and humidity creates prime conditions for powdery mildew |
| Aug 1-15 | Restart cilantro successions in earnest for fall harvest | Prime fall cilantro window begins; weather cools and bolting slows dramatically |
| Aug 1-15 | Direct sow spinach, arugula, lettuce for fall harvest | Count back 50 days from FFD (Nov 1) plus 14-day buffer for slowed autumn growth = plant by Aug 10-20 |

---

### Fall Planting Calendar (Counting Backward from FFD: November 1)

| Plant By Date | Crop | Days to Maturity | Method | Notes |
|--------------|------|-----------------|--------|-------|
| Aug 10 | Spinach | 35-45 days | Direct sow 1/2 inch deep | Fall spinach is excellent in Zone 6; frost improves sweetness; overwintered spinach may survive under row cover |
| Aug 10-20 | Lettuce (leaf) | 30-45 days | Direct sow or transplant | Plant heat-tolerant varieties in August heat (Jericho, Nevada); switch to Buttercrunch and Oakleaf in September |
| Aug 15-20 | Arugula | 30-40 days | Direct sow thinly | Fall arugula is ideal -- no bolting risk in cooling temps; peppery flavor intensifies with cool nights |
| Aug 20-30 | Kale (fall planting) | 50-60 days | Transplant from late-July indoor starts OR direct sow | Kale is at its best in fall; light frost (28-30 degrees F) converts starches to sugars; flavor peaks in October-November |
| Aug 20 - Sept 1 | Radishes | 25-28 days | Direct sow 1/2 inch deep, 2 inches apart | 3-4 succession plantings possible in fall window; radishes are one of the easiest crops for September production |
| Sept 1-10 | Cilantro (final fall successions) | 45-70 days to leaf harvest | Direct sow thickly | This window produces the best cilantro of the year in Zone 6; harvest leaves until hard freeze |
| Sept 15 - Oct 1 | Garlic (hardneck) | Overwinter (harvest July next year) | Plant cloves 2-3 inches deep, 6 inches apart | Choose Rocambole or Porcelain types for Zone 6; mulch with 6 inches of straw after planting; remove scapes in June |
| Oct 1-10 | Cover fall crops with row cover (medium weight) | -- | Drape over wire hoops | Extends harvest 3-4 weeks past first frost; lettuce, spinach, and kale survive to late November in Zone 6 with protection |

---

### Season Extension Options

| Tool | Protection Level | Effective Date Shift | Best Used For |
|------|-----------------|---------------------|---------------|
| Lightweight row cover (0.5 oz) | +2-4 degrees F | +2-3 weeks | Early spring lettuce, fall harvest extension for cool-season crops |
| Medium row cover (1.5 oz) | +4-6 degrees F | +3-4 weeks | Fall kale/spinach/arugula through November |
| Wall-O-Waters | Down to 18 degrees F overnight | +3-5 weeks for tomatoes | Spring tomato transplants; remove when temps stabilize above 60 degrees F nights |
| Black plastic mulch | Soil +8-10 degrees F | Enables 1-2 weeks earlier transplant | Tomatoes, peppers in Zone 6 raised beds -- less critical but useful for peppers |
| Cold frame | +4-8 degrees F | +5-7 weeks total | Overwinter spinach and mache; start spring lettuce in January-February |

**Raised bed specific note:** Your raised beds should reach 60 degrees F soil temperature approximately April 12-15, roughly 5-7 days earlier than in-ground soil in the same location. You can likely transplant tomatoes a week earlier than Zone 6a in-ground averages suggest. Use a soil thermometer to confirm before planting.

---

### Monthly At-a-Glance

| Month | Priority Actions | What to Watch For |
|-------|-----------------|------------------|
| January | Start pepper seeds indoors under grow lights (Jan 13); set up heat mat at 80 degrees F | Leggy seedlings indicate insufficient light; raise lights or add more hours |
| February | Start tomato seeds Feb 3 (8-9 weeks before LFD) | Check for damping off (stem rot at soil line); ensure good airflow around seedlings |
| Early March | Direct sow lettuce, spinach, arugula
