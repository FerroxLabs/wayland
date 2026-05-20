---
name: indoor-plant-care
description: |
  Guides the selection and care of indoor houseplants based on available light, humidity, and maintenance commitment. Covers light requirements by plant type, watering frequency, humidity needs, and common houseplant selection by growing conditions.
  Use when the user asks about caring for houseplants, choosing plants for specific rooms, watering schedules, light requirements for indoor plants, or how to keep houseplants alive.
  Do NOT use for outdoor garden plants (use vegetable-garden-planning or seasonal-planting-calendar), plant disease diagnosis (use plant-care-troubleshooting), or commercial greenhouse management.
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
# Indoor Plant Care

## When to Use

**Use this skill when:**
- A user wants to select houseplants for a specific room, window type, or living situation and needs guidance matched to their actual conditions
- A user asks about watering frequency, watering technique, or why their watering schedule is not working (for established, currently healthy plants -- not a plant in decline)
- A user needs a complete care routine for a plant they just purchased or received as a gift
- A user wants to know which plants tolerate low light, neglect, dry air, or inconsistent care
- A user asks about humidity, soil mixes, fertilizing schedules, pot selection, or repotting for houseplants
- A user wants to improve a room's appearance or air quality with plants and needs plant recommendations matched to the specific space
- A user asks about growing basic culinary herbs (basil, mint, chives, parsley) on a kitchen windowsill -- treat these as houseplants with the care guidance in this skill
- A user is setting up plants for a new apartment, office desk, or specific room and needs a starting collection with a realistic care plan

**Do NOT use when:**
- A plant shows visible symptoms of disease, pest infestation, yellowing, wilting, or leaf drop that suggest a problem is already present -- use `plant-care-troubleshooting` for diagnosis and treatment
- The user is planning an outdoor garden, raised bed, or container garden on a patio or balcony -- use `vegetable-garden-planning` or `seasonal-planting-calendar`
- The user wants to grow food crops like tomatoes, peppers, cucumbers, or squash indoors under grow lights at scale -- this is indoor growing but belongs in a dedicated food-crop skill
- The user is managing a commercial greenhouse, nursery, or horticultural business with professional growing requirements
- The user is asking about landscape design, outdoor trees, shrubs, or perennial borders
- The user needs propagation techniques for advanced cloning or tissue culture -- basic propagation (cuttings, division) is within scope here, but advanced techniques are not

---

## Process

### Step 1: Assess the User's Growing Conditions Before Recommending Anything

Never recommend plants before establishing the conditions. Light is the single most important factor -- getting this wrong guarantees failure regardless of how carefully everything else is managed.

Ask for or infer the following parameters in order of importance:

- **Window direction and number:** North, south, east, or west? How many windows in the target room? Are they obstructed by trees, overhangs, neighboring buildings, or frosted glass? A south window blocked by a large oak tree delivers far less light than an unobstructed one.
- **Distance from window:** Light intensity drops with the inverse square law. A plant 8 feet from a south window receives roughly one-quarter the light of a plant 2 feet away. This matters enormously for light-hungry plants.
- **Hours of direct sun landing on the surface where the plant will sit:** Have the user observe for one day if uncertain, or use window direction as a reliable proxy (see light classification table in Step 2).
- **Room humidity:** Is the room heated with forced air in winter? Does it have air conditioning in summer? Is it a bathroom or kitchen with regular moisture? Typical forced-air heated homes in winter drop to 20-30% relative humidity -- well below what most tropical plants prefer.
- **Temperature and drafts:** Most tropical houseplants do well between 60 and 80 degrees F but suffer below 55 degrees F. Cold glass, floor vents, exterior doors, and poorly insulated walls create microclimates that damage plants. Ask if the intended spot is near a vent, radiator, or cold window.
- **Maintenance commitment:** Be specific -- ask how often they are realistically home, whether they travel, whether they have remembered to water plants in the past, and whether they enjoy the ritual of plant care or want something that requires minimal interaction.
- **Pets and children:** Ask specifically about cats and dogs. Several of the most popular and easily available houseplants (pothos, philodendron, monstera, peace lily, ZZ plant, dieffenbachia) are toxic to cats and dogs. This constraint narrows the selection significantly and must be established before any recommendation.
- **Aesthetic goals:** Trailing vines (pothos, string of pearls), large architectural statement plants (fiddle leaf fig, bird of paradise), small tabletop plants (peperomia, African violet), hanging basket plants (spider plant, heartleaf philodendron), or sculptural succulents -- understanding this shapes the final recommendation meaningfully.

### Step 2: Classify Available Light With Precision

Light classification is the decision gate for all plant selection. Use window direction as the baseline, then adjust for real-world modifiers.

**Indoor light level classification:**

| Light Level | Definition | Window Direction | Distance from Window | Foot-Candles (approximate) | What Grows Here |
|-------------|-----------|-----------------|---------------------|---------------------------|-----------------|
| Bright direct | Direct sun rays fall on the plant surface for 4+ hours per day | Unobstructed south-facing (northern hemisphere) | Within 2 feet | 2,000-5,000+ fc | Cacti, succulents, herbs, citrus |
| Bright indirect | Room is visibly well-lit but no direct beam of sun falls on the plant; bright enough to cast a soft shadow | East or west-facing; shaded south; south with a sheer curtain | Within 3 feet of east/west; 3-6 feet of south | 500-2,000 fc | Monstera, pothos, spider plant, rubber plant, fiddle leaf fig |
| Medium indirect | Comfortable to read by, but not bright; no direct sun; shadows are faint or absent | North-facing window near the glass; interior of a bright room; south window at 8-12 feet | 6-10 feet from south/west; 4-8 feet from north | 150-500 fc | Snake plant, ZZ plant, Chinese evergreen, pothos, cast iron plant |
| Low | Dim; cannot easily read fine print; shadows absent; requires artificial supplementation for most plants | Interior rooms; north windows set back; office cubicles | 10+ feet from any window | 50-150 fc | Snake plant, ZZ plant, cast iron plant (surviving, not thriving) |
| No natural light | No windows; relies entirely on artificial light | Windowless bathrooms, interior offices, closets | -- | Below 50 fc | Nothing survives long-term without a grow light |

**Real-world light modifiers -- always apply these adjustments:**
- North-facing windows in northern hemisphere provide cool, even, indirect light year-round -- never direct sun. Good for calathea and some ferns.
- South-facing windows in northern hemisphere provide the most total light and the only reliable direct sun opportunity for most temperate climates. Best for succulents, herbs, and light-hungry tropicals.
- East-facing windows deliver gentle morning sun (cooler, lower intensity) then indirect light the rest of the day -- ideal for many tropical plants that want brightness without the intensity of afternoon sun.
- West-facing windows deliver intense afternoon sun -- hotter and more intense than morning sun -- which can scorch plants with thin leaves (calathea, ferns) but suits succulents and cacti.
- Seasonal shift: in winter, the sun angle is lower. A south window that delivers 4 hours of direct sun in July may deliver only 1-2 hours in December. Plans must account for this.
- Dirty windows reduce light transmission by 20-40%. Clean windows matter more than most people realize.
- External obstructions (trees, buildings, overhangs) can reduce light by 30-70% compared to an unobstructed window of the same direction.

### Step 3: Match Plants to Conditions Using the Selection Framework

Once light, humidity, maintenance level, and pet safety are known, use the following matrix and then filter by the user's aesthetic preferences.

**Comprehensive plant selection matrix:**

| Light Level | Low Maintenance | Moderate Maintenance | Higher Maintenance | Pet Safe (all levels) |
|-------------|----------------|---------------------|-------------------|----------------------|
| Bright direct | Aloe vera, jade plant (Crassula ovata), ponytail palm, haworthia, many cacti | Echeveria, string of pearls (Senecio rowleyanus), bird of paradise | Citrus trees (Meyer lemon), bougainvillea | Haworthia, ponytail palm, certain Echeveria |
| Bright indirect | Pothos (Epipremnum aureum), spider plant, rubber plant (Ficus elastica), heartleaf philodendron | Monstera deliciosa, fiddle leaf fig (Ficus lyrata), peace lily | Calathea (all species), alocasia, string of pearls | Spider plant, peperomia, parlor palm, calathea |
| Medium indirect | Snake plant (Dracaena trifasciata), ZZ plant (Zamioculcas zamiifolia), cast iron plant | Chinese evergreen (Aglaonema), dracaena (most species) | Prayer plant (Maranta), Boston fern | Prayer plant, calathea, peperomia, cast iron plant |
| Low | Snake plant, ZZ plant, cast iron plant (Aspidistra elatior) | Chinese evergreen (dark-tolerant varieties like 'Silver Bay') | Peace lily (tolerates low but struggles) | Cast iron plant (low, pet safe) |

**Notable plant profiles for common user scenarios:**

- **Pothos (Epipremnum aureum):** Arguably the most forgiving tropical houseplant available. Tolerates low to bright indirect light, irregular watering, dry air, and significant neglect. Trails attractively. TOXIC to cats and dogs. The go-to recommendation for light-challenged rooms when pets are not a factor.
- **Snake plant (Dracaena trifasciata, formerly Sansevieria):** Accepts low to bright indirect light, watering every 2-6 weeks depending on season, and extremely dry air. Nearly impossible to kill through neglect alone. Can be killed by overwatering. Mildly toxic to cats/dogs (causes gastrointestinal upset but not life-threatening).
- **ZZ plant (Zamioculcas zamiifolia):** Stores water in thick rhizomes underground, making it extremely drought-tolerant. Tolerates low light. Slow-growing. Toxic to cats and dogs and mildly irritating to human skin -- wear gloves when handling.
- **Spider plant (Chlorophytum comosum):** Genuinely non-toxic to cats and dogs, fast-growing, tolerant of a wide range of conditions, produces "spiderettes" (baby plants on long runners). First-time plant owners and households with pets benefit greatly from this plant.
- **Calathea (various species including Calathea orbifolia, C. ornata, C. lancifolia):** Among the most visually spectacular foliage houseplants. Non-toxic to pets. However, requires consistent moisture, high humidity (50-70%), and is sensitive to fluoride in tap water -- distilled or filtered water preferred. Not suitable for neglectful waterers.
- **Monstera deliciosa:** Fast-growing, dramatic, easy to find. Tolerates a range of indirect light. Toxic to cats and dogs. Requires climbing support (moss pole or coco coir pole) as it matures. Leaves will not develop the characteristic splits (fenestrations) without sufficient bright indirect light -- a common disappointment in low-light rooms.
- **Peperomia (numerous species):** Over 1,000 species exist; most are compact, non-toxic, and tolerant of moderate to bright indirect light. Semi-succulent leaves store water. Ideal for small spaces and households with pets.
- **Parlor palm (Chamaedorea elegans):** Genuinely low-light tolerant palm; non-toxic to pets; adds tropical visual interest without requiring high light. Slow-growing. Prefers humidity above 40%.

### Step 4: Build a Precise Watering Protocol

Overwatering is the leading cause of houseplant death. The second leading cause is confusing "regular schedule" with "soil condition monitoring." Never prescribe a fixed-day schedule -- always anchor watering to soil moisture state.

**The finger test is the universal standard:** Insert a finger into the soil 1-2 inches deep. If it feels moist and cool, do not water. If it feels dry and room-temperature, water. This takes 3 seconds and is more accurate than any calendar.

**Soil moisture thresholds by plant type:**

| Plant Category | Water When... | Danger Zone | Signs of Overwatering | Signs of Underwatering |
|---------------|--------------|-------------|----------------------|----------------------|
| Cacti and succulents | Soil is completely dry 2+ inches deep; leaves start to look very slightly deflated | Keeping soil moist = death from root rot | Mushy base, yellowing, black stems | Wrinkled/shriveled leaves, very lightweight pot |
| ZZ plant and snake plant | Soil is completely dry at the bottom of the pot | Any persistent moisture below the surface | Yellow leaves starting at base, mushy stems | Wrinkling, curling leaves (rare) |
| Tropical foliage (pothos, philodendron, monstera) | Top 1-2 inches of soil are dry | Allowing water to sit in saucer more than 30 minutes | Yellow leaves, root rot smell, soft mushy stems | Wilting that recovers after watering, dry curling leaves |
| Calathea, prayer plant | Top 0.5-1 inch of soil is dry; never allow to dry out completely | Letting it sit bone dry causes leaf curl and browning tips | Same as tropical foliage | Curling leaves inward (a strong early signal), brown leaf edges |
| Ferns (Boston, staghorn) | Soil stays evenly moist; check every 4-5 days | Waterlogged soil causes root rot | Yellowing fronds at the base | Crispy brown frond tips, drooping |
| Herbs (basil, mint, parsley) | Top inch dry; herbs wilt dramatically as an early signal | Standing water in saucer | Yellowing lower leaves, mold on soil | Dramatic wilting (they recover quickly when watered) |

**Watering technique matters as much as frequency:**
- Water slowly and thoroughly until water flows freely from drainage holes. This ensures the entire root zone is moistened and flushes out accumulated salts from fertilizer.
- After 30 minutes, empty the saucer. A pot sitting in pooled water will wick up moisture continuously, saturating the bottom of the root zone and creating anaerobic conditions that cause root rot -- the most common killing mechanism in houseplant care.
- Use room-temperature water. Water below 60 degrees F can shock the roots of tropical plants, causing temporary growth stalls and in severe cases, root damage.
- Calatheas, prayer plants, and some palms are sensitive to fluoride and chlorine in tap water. These cause brown leaf tips. Collect tap water in a container and let it sit uncovered for 24 hours to off-gas chlorine, or use filtered/distilled water.
- Bottom watering (placing the pot in a basin of water for 20-30 minutes until the soil wicks up moisture from below) is excellent for plants that dislike wet foliage (African violets) and ensures deep root hydration.

**Seasonal watering adjustment -- this is non-negotiable:**
- In winter, reduced daylight hours slow plant growth by 30-70%. Water uptake slows proportionally. Most plants need 30-50% less water in winter than in summer. Failure to reduce winter watering is a major cause of winter root rot.
- In summer, high temperatures and increased light accelerate evaporation. Check soil more frequently -- plants that needed watering every 10 days in spring may need it every 6-7 days in July.

### Step 5: Address Fertilizing -- The Commonly Neglected Third Variable

Most users think about light and water but not fertilizing. Potting soil nutrients are depleted within 2-6 months. Unfertilized plants survive but do not grow vigorously, produce pale leaves, or fail to reach their full visual potential.

**Fertilizing fundamentals:**
- Fertilize only during the active growing season: March through September in northern hemisphere. Do not fertilize from October through February -- adding nutrients to a plant in its dormant or slow-growth phase causes salt buildup in the soil and can burn roots.
- Use a balanced liquid fertilizer (equal or near-equal N-P-K ratio, such as 20-20-20 or 10-10-10) diluted to half the label rate. The label rate is often set for commercial production; half-strength every 2-4 weeks is safer for home growers and prevents fertilizer burn.
- Foliage plants (pothos, monstera, philodendron) benefit from a slightly higher nitrogen formulation (higher first number, such as 3-1-2 ratio) to support leaf development.
- Flowering houseplants (African violet, peace lily, anthurium) benefit from a slightly higher phosphorus formulation (higher middle number) when approaching the bloom period.
- Slow-release granular fertilizers (small pellets pressed into the soil surface or mixed in at repotting) release nutrients over 3-6 months and reduce the frequency of intervention -- a good option for low-maintenance users.
- Always water the plant before fertilizing. Applying fertilizer to dry soil concentrates salts and can damage roots. Water first, then apply diluted fertilizer, or apply diluted fertilizer solution as the watering event itself.
- If white crusty deposits appear on the soil surface or the sides of terracotta pots, these are salt accumulations from fertilizer. Flush the soil by watering with three times the pot's volume of plain water, letting it drain completely.

### Step 6: Prescribe Humidity Solutions Matched to the User's Situation

Most homes run at 30-50% relative humidity under normal conditions. In winter with forced-air heating, this drops to 20-30%. The majority of popular houseplants come from humid tropical environments and prefer 40-70%.

**Humidity preference by plant category:**

| Plant Category | Preferred RH% | Typical Home RH% (winter) | Gap | Priority of Intervention |
|---------------|--------------|--------------------------|-----|--------------------------|
| Cacti and succulents | 10-40% | 20-40% | None | None needed |
| Snake plant, ZZ plant | 30-50% | 20-40% | Small | Low -- these tolerate dry conditions |
| Most tropical foliage (pothos, philodendron, monstera) | 40-60% | 20-40% | Moderate | Medium -- most manage but benefit from modest help |
| Calathea, prayer plant, alocasia | 50-70% | 20-40% | Large | High -- brown leaf edges and crispy tips appear without intervention |
| Orchids (phalaenopsis) | 50-70% | 20-40% | Large | High |
| Ferns (Boston, maidenhair) | 60-80% | 20-40% | Very large | Very high -- maidenhair fern nearly impossible without dedicated humidifier |

**Humidity solutions ranked by effectiveness:**

1. **Dedicated cool-mist ultrasonic humidifier (most effective):** Run during heating season, positioned within 3-4 feet of plants. Raises ambient RH by 15-30 percentage points. The correct solution for calatheas, ferns, and orchids. Clean the water reservoir weekly to prevent mold and mineral buildup. Use distilled water to prevent white mineral dust on plant leaves.
2. **Plant grouping:** Plants transpire through their leaves, raising the humidity of their immediate microclimate by 5-15%. Group 4+ plants together for a measurable effect. Does not reach the 60%+ levels that calatheas need but provides meaningful support.
3. **Pebble humidity tray:** Fill a shallow tray with clean pebbles and add water to just below the pebble surface. Set the pot on top of the pebbles so the pot base is above the water line (not sitting in water -- that causes root rot). Water evaporates around the plant, raising local RH by 5-10%. Effective as a supplement, not a primary solution.
4. **Bathroom placement:** Bathrooms with windows that receive moderate to low light benefit from natural humidity from showers. Works well for snake plants, ZZ plants, spider plants, and some ferns. The humidity spike from a shower does not persist long enough to genuinely help calatheas all day, but it is better than a dry room.
5. **Misting (least effective):** Spray misting raises humidity for approximately 10-30 minutes -- long enough to see droplets evaporate. It does not solve chronic low humidity. Additionally, misting leaves with standing water overnight promotes fungal diseases and bacterial leaf spot. If used at all, mist only in the morning so leaves dry during the day. Do not recommend misting as a primary humidity solution for any high-humidity plant.

### Step 7: Cover Potting, Soil, and Repotting Decisions

Soil mix and pot selection are underappreciated variables that directly affect watering frequency and root health.

**Pot selection principles:**
- Every pot used for permanent planting must have drainage holes. No exceptions. Decorative cachepots (pots without holes used as covers) are acceptable only if the plant is in a nursery pot with drainage inside -- always remove the nursery pot to water, let it drain completely, then return it.
- Terracotta pots are breathable and wick moisture through their walls, drying soil faster. This is ideal for succulents, cacti, and Mediterranean herbs, but requires more frequent watering for moisture-loving tropicals.
- Plastic and glazed ceramic pots hold moisture longer, which suits calatheas, ferns, and pothos. They are also lighter, which matters for large plants.
- Pot size: always pot up only one size at a time (1-2 inches larger in diameter than the current root ball). An oversized pot holds excess soil that stays wet long after the roots have absorbed what they need, creating root rot conditions. The common mistake is putting a small plant in a large pot for future growth -- this often kills the plant before it reaches that future.

**Soil mix by plant category:**

| Plant Category | Recommended Mix | Why |
|---------------|----------------|-----|
| Cacti and succulents | 50% potting mix + 50% inorganic grit (perlite or coarse sand -- use horticultural grade, not builder's sand which is too fine) | Extremely fast drainage; soil must not retain moisture |
| ZZ plant and snake plant | Standard indoor potting mix + 20-30% perlite | Improved drainage; these store water internally and do not need moisture-retentive soil |
| Tropical foliage (pothos, monstera, philodendron) | Standard indoor potting mix (acceptable as-is) or add 10-20% perlite for improved drainage | Good balance of moisture retention and drainage |
| Calathea, prayer plant | Peat-based or coco coir potting mix + 20% perlite + 10% orchid bark for aeration | Moisture-retentive but aerated; cannot dry out completely but also must not get waterlogged |
| Orchids | Specialized orchid bark mix (80% medium orchid bark + 20% perlite) -- never use standard potting soil | Orchid roots are aerial and require maximum airflow; standard soil rots them immediately |
| Herbs | Standard potting mix + 20% perlite; do not use garden soil indoors (too dense, brings pathogens) | Good drainage while holding enough moisture for frequent harvesting |

**When to repot:**
- Roots emerging from drainage holes and circling the outside of the root ball (root-bound) -- repot immediately
- Plant dries out unusually fast (within 2-3 days of watering) -- may be root-bound, leaving little soil to hold moisture
- Plant has been in the same pot for 2+ years with no size increase -- even if not visibly root-bound, soil nutrients are depleted and soil structure has degraded
- Best timing: spring (March-April) as the plant enters its active growing period. Repotting in winter stresses a dormant plant. Never repot a plant that is already stressed or showing symptoms -- stabilize it first.
- The repotting process: water the plant 24 hours before to make root separation easier. Remove from the old pot, gently loosen the outer root ball and shake off old soil. Inspect roots -- trim any black, mushy, or dead roots with clean scissors. Place in new pot with fresh mix, fill around the sides, tamp lightly, water thoroughly, and place in bright indirect light while it recovers for 1-2 weeks.

### Step 8: Deliver a Consolidated, Usable Care Plan

Compile all the above into a structured output (see Output Format below) that the user can actually follow without needing to re-read everything. The plan should:
- Name 2-3 starter plants (not more for first-time owners)
- Give a clear watering trigger (soil condition, not days)
- Include a seasonal adjustment summary
- Flag any specific concerns unique to the user's situation (pets, travel, dry heat, fluoride-sensitive plants)
- Provide potting and soil specifics matched to the recommended plants

---

## Output Format

```
## Indoor Plant Care Plan: [Room/Location] ([Key Conditions Summary])

### Growing Conditions Assessment
| Parameter              | User's Situation                                     |
|------------------------|------------------------------------------------------|
| Light level            | [Bright direct / Bright indirect / Medium / Low]     |
| Window direction(s)    | [N / S / E / W -- number of windows]                 |
| Distance from window   | [feet -- where plant will actually sit]              |
| Room humidity          | [Dry 20-30% / Moderate 40-50% / Humid 50-70%]        |
| Temperature range      | [degrees F -- note any drafts or vents nearby]       |
| Seasonal light shift   | [Note if winter will significantly reduce available light] |
| Maintenance commitment | [Low / Moderate / High -- with honest description]   |
| Pets or children       | [Yes (species) / No]                                 |
| Aesthetic goal         | [Trailing / Structural / Small tabletop / Hanging / Mixed] |

---

### Recommended Plants (Start with 2-3 maximum)

#### [Plant 1: Common Name (Latin Name)]
- **Light match:** [how it fits the user's light level]
- **Watering trigger:** [specific soil moisture condition that signals it is time to water]
- **Watering frequency (approximate):** [range, with seasonal note]
- **Humidity tolerance:** [preferred % and whether user's home meets this]
- **Humidity action needed:** [yes/no -- and what to do if yes]
- **Pet safety:** [Safe / Toxic to cats and dogs / Mildly toxic -- specify symptoms if relevant]
- **Soil mix:** [specific recommendation]
- **Pot type:** [terracotta / plastic / glazed ceramic -- and size guidance]
- **Fertilizing:** [timing and type]
- **Special notes:** [anything specific to this plant that commonly trips up owners]

#### [Plant 2: Common Name (Latin Name)]
[Same structure as Plant 1]

#### [Plant 3: Common Name (Latin Name)]
[Same structure as Plant 1]

---

### Weekly and Monthly Care Checklist

**Every watering session (check soil first):**
- [ ] Insert finger 1-2 inches into soil -- water only if dry at that depth (adjust threshold per plant type above)
- [ ] Water slowly until it flows freely from drainage holes
- [ ] Wait 30 minutes, then empty any water in the saucer
- [ ] Note how long since last watering -- use this to calibrate your next check

**Weekly tasks:**
- [ ] Rotate each pot 1/4 turn for even light exposure on all leaf surfaces
- [ ] Inspect leaf undersides for early signs of spider mites or mealybugs (if found, transfer to plant-care-troubleshooting skill)
- [ ] Check soil moisture on all plants

**Monthly tasks:**
- [ ] Wipe dust from large leaves with a damp cloth (dust blocks photosynthesis by up to 30%)
- [ ] Fertilize with half-strength diluted liquid fertilizer (spring through summer only -- skip October through February)
- [ ] Check for roots emerging from drainage holes or pushing up through the soil surface

**Seasonal tasks:**
| Task                          | Spring (Mar-May)          | Summer (Jun-Aug)           | Fall (Sep-Nov)              | Winter (Dec-Feb)             |
|-------------------------------|--------------------------|----------------------------|-----------------------------|------------------------------|
| Watering frequency            | Gradually increase        | Most frequent -- monitor closely | Begin reducing              | 30-50% less than summer      |
| Fertilizing                   | Resume monthly feeding    | Continue monthly           | Final feeding in September  | None                         |
| Light management              | Move to brighter spots    | Watch for leaf scorch on south windows | Begin moving closer to windows | Maximize light exposure      |
| Humidity management           | Heating ends -- may relax | AC can dry air -- monitor  | Heating starts -- add humidity support | Most critical period for humidifier |
| Repotting window              | Ideal time to repot       | Acceptable if needed       | Avoid if possible           | Do not repot                 |
| Pest vigilance                | Highest -- growth = pests | High                       | Medium                      | Lower but check monthly      |

---

### Potting Specifications
| Parameter         | Specification                                              |
|-------------------|------------------------------------------------------------|
| Pot type          | [terracotta / plastic / glazed ceramic -- with drainage requirement] |
| Pot size          | [current root ball + 1-2 inches diameter -- specific guidance] |
| Soil mix          | [specific blend with ratios -- e.g., 70% standard potting mix + 30% perlite] |
| Drainage layer?   | No -- drainage layers of gravel in the bottom of pots are a myth; they actually raise the perched water table and increase root rot risk. Use well-draining soil mix instead. |
| Repotting timing  | [When to expect it, signs to look for]                     |

---

### Specific Concerns for This User's Situation
[Address any flags identified during condition assessment: pet toxicity, travel schedule, dry heat issues, fluoride-sensitive plants, grow light needs, etc. Each concern gets a 2-3 sentence specific response.]

---

### Troubleshooting Handoff Triggers
If any of the following occur, transfer to `plant-care-troubleshooting`:
- Yellowing leaves that persist after adjusting watering
- Brown leaf tips spreading inward beyond the margins
- Visible insects on leaves, stems, or soil surface
- Mushy stems or a foul smell from the soil (root rot)
- Sudden leaf drop without obvious environmental cause
```

---

## Rules

1. **Never recommend plants before establishing light conditions.** Light determines whether a plant will survive -- recommending a fiddle leaf fig for a north-facing window is worse than no recommendation at all. Always classify light before plant selection.

2. **Always flag toxic plants when pets or young children are mentioned.** State the specific toxicity risk (e.g., "causes kidney failure in cats" for true lilies vs. "causes gastrointestinal upset" for pothos). The severity matters and affects whether the plant can be kept at all vs. kept out of reach.

3. **Never recommend fixed watering days.** Watering every Tuesday ignores pot size, soil type, season, humidity, and plant dormancy. Always give a soil-state trigger ("water when the top 1-2 inches are dry") with an approximate frequency as reference only.

4. **Never recommend plants without drainage holes.** This is non-negotiable. A decorative cachepot without drainage is only acceptable if a drainage-holed nursery pot sits inside it, and the user is instructed to remove it to water and let it drain.

5. **Do not recommend more than 3 starter plants to first-time or self-described neglectful plant owners.** New owners who acquire 6-10 plants immediately cannot calibrate the different watering rhythms of each plant. The result is a collection of dying plants and lost confidence. Start with 2-3, build success, then expand.

6. **Do not treat misting as a humidity solution.** It is ineffective for anything beyond 20-30 minutes and actively risks fungal disease on leaves with prolonged moisture. If a plant truly needs 60%+ humidity (calathea, maidenhair fern, orchid), prescribe a humidifier -- do not suggest misting as a workaround.

7. **Flag the drainage layer myth explicitly if the user mentions putting gravel or rocks in the bottom of the pot.** This is a widely repeated home tip that is demonstrably counterproductive. Gravel in the bottom raises the perched water table (the zone of saturated soil that forms above the drainage layer), creating exactly the waterlogged conditions it is meant to prevent.

8. **Do not recommend fertilizing in fall or winter.** Adding nutrients to a plant during its low-light, low-growth period pushes salt accumulation in the soil and does not produce growth because growth is limited by light, not nutrients. March through September only.

9. **Adjust care recommendations seasonally even if the user does not ask.** Most houseplant deaths in winter are caused by applying summer watering schedules to winter-dormant plants. Every care plan must include seasonal adjustments, not just one static schedule.

10. **Recommend potting up by one size only when repotting.** Moving a plant from a 4-inch pot to a 10-inch pot to avoid repotting again soon is a common and damaging mistake. Excess soil holds water far beyond the root zone and creates anaerobic conditions. One pot size up (1-2 inches wider in diameter) is the standard guidance.

11. **When recommending calathea or prayer plant, explicitly warn about water quality.** These plants are among the most fluoride-sensitive houseplants. Tap water in many municipalities causes brown leaf tips within weeks. Distilled or filtered water should be prescribed specifically, not mentioned as optional.

12. **Do not recommend the fiddle leaf fig (Ficus lyrata) for first-time plant owners or anyone who describes inconsistent care habits.** Despite its extreme popularity, it is one of the most finicky and temperamental houseplants -- dropping leaves from temperature drafts, inconsistent watering, being moved, or repotting at the wrong time. Manage user expectations heavily if they request it specifically.

---

## Edge Cases

### Windowless Rooms and Interior Offices
A room with no windows or only skylights with no lateral light cannot sustain most houseplants long-term. Snake plants and ZZ plants will survive for several months in very low light but will not grow, may gradually lose vigor, and will eventually decline. The honest answer is: without natural light, the sustainable options are either (a) a dedicated grow light or (b) a plant rotation -- keep plants under a grow light or in a bright location and rotate them into the dark room for 2-4 weeks at a time, then rotate them back out to recover. For permanent, no-maintenance green: high-quality artificial plants are not a cop-out in a windowless space -- they are the pragmatic answer. If the user insists on living plants, prescribe a full-spectrum LED grow light, 2700-3000K for tropical foliage, positioned 6-12 inches above the plant canopy, running 12-14 hours per day on a timer. A simple outlet timer costs very little and removes the burden of remembering to turn lights on and off.

### Frequent Travel (2+ Weeks Away Regularly)
Standard tropical houseplants (pothos, monstera, philodendron) can tolerate 10-14 days without watering if thoroughly watered before departure, but calatheas, ferns, and herbs cannot. For frequent travelers, the plant portfolio must consist entirely of drought-adapted species: snake plant, ZZ plant, ponytail palm (Beaucarnea recurvata), jade plant, haworthia, or cacti. These can safely tolerate 3-6 weeks without water if properly watered beforehand. For travelers who want tropical plants, self-watering pots with a reservoir can extend the safe interval to 2-3 weeks for pothos and spider plants. Watering globes (glass bulbs filled with water that slowly release into the soil) provide 1-2 weeks of slow irrigation as a supplement. Group plants together on a pebble tray, water all thoroughly, and set soil moisture indicators if available. Never ask a neighbor unfamiliar with plants to water -- they will either over-water and drown everything or under-water unpredictably. A single thorough watering before departure on drought-tolerant plants is safer than intermittent unknown intervention.

### Homes with Forced-Air Heat in Winter
Forced-air heating systems are the most desiccating environment for tropical houseplants. Relative humidity can drop to 15-20% near a heating vent -- comparable to a desert. Symptoms appear rapidly: brown, crispy leaf edges on calatheas and ferns; wilting despite moist soil (roots cannot transport enough water when the air is extremely dry); leaf drop on pothos and philodendron. Immediate actions: move plants away from direct vent airflow (minimum 3 feet), add a humidifier to the room, and group plants together. Also note that forced-air heated rooms have vertical humidity gradients -- humidity is higher near the floor. Placing humidity-sensitive plants on the floor level can help modestly. Reduce watering in winter since growth slows, but increase humidity support simultaneously -- the two adjustments go in opposite directions but are both correct.

### Cats That Actively Chew Plants
Even non-toxic plants cause gastrointestinal upset in cats if eaten in quantity. More importantly, cats often chew the same plants toxic to them. The only fully safe approach for a cat that actively chews plants is to either: (a) restrict plants to rooms the cat cannot access, (b) use only plants verified non-toxic (spider plant, calathea, peperomia, air plants, parlor palm, Boston fern), or (c) provide a dedicated pot of cat grass (Dactylis glomerata or Triticum aestivum -- wheat grass) as a diversion. Cat grass is non-toxic, grows quickly in a sunny window, and cats often preferentially chew it over houseplants. Replace every 3-4 weeks as it degrades. Note: spider plants contain compounds similar to opioids that mildly attract cats -- cats may chew them even though they are non-toxic. Mild vomiting is normal if they ingest significant amounts; it is not dangerous.

### Fluorescent or LED Office Lighting as the Only Light Source
Standard overhead office lighting (T8 fluorescent tubes, 4000K-6500K, at ceiling height of 8-10 feet) delivers approximately 50-200 foot-candles at desk level -- barely within the survivable range for the most shade-tolerant plants (snake plant, ZZ plant, cast iron plant). Standard LED office panel lights at ceiling height deliver similar values. Plants directly under and close to ceiling fixtures do better than those farther away. If a desk lamp or adjustable fixture is available, a full-spectrum LED bulb (5000-6500K, minimum 1000 lumens aimed at the plant) placed 12-18 inches from the plant can supplement effectively. Chinese evergreen (Aglaonema) and pothos are the two most reliable plants for office environments with only fluorescent or LED ambient light. Avoid any plant with high light requirements -- the disappointment of a non-fenestrating monstera or a snake plant that never grows in an office is common and preventable.

### User Has a Plant That Is Thriving in the Wrong Conditions (Anecdotal Exceptions)
Users sometimes report that their pothos is thriving in a dark bathroom or their cactus is doing fine in a north window. These are genuine occurrences and should not be dismissed. Individual plants develop some acclimatization, certain cultivars within a species are more tolerant, and "thriving" may be subjective. Handle by acknowledging their experience as valid, providing the standard range, and noting that while exceptions exist, giving the plant better conditions (more light, better drainage) will generally produce better growth and resilience. Never tell a user their thriving plant is dying -- build on success.

### Recently Purchased Plant That Is Dropping Leaves Immediately
New plant drop (sudden leaf loss in the first 1-4 weeks after purchase) is extremely common and is primarily caused by the transition from a greenhouse or retail environment to a home environment -- a phenomenon called acclimatization shock or transit stress. Greenhouses grow plants at 50-70% relative humidity under calibrated light. A home may offer 30% humidity and half the light. The plant sheds leaves that were grown in high-light conditions because they are too metabolically expensive to maintain in lower light. This is not a care failure. Instructions: place the plant in the brightest indirect light available, do not repot immediately (repotting adds stress to a stressed plant), maintain consistent watering (do not over-correct by watering more), and wait 4-6 weeks. New leaves that grow in the home conditions will be properly acclimatized. If leaf drop continues beyond 6 weeks or the stem shows softness -- transfer to `plant-care-troubleshooting`.

---

## Example

**Input:** "I just moved into an apartment. I have a west-facing window in my living room and a small north-facing window in the kitchen. I've killed every plant I've ever owned -- I forget to water. I have a dog and a 3-year-old. I want something that looks good and won't hurt them. Help."

**Output:**

## Indoor Plant Care Plan: New Apartment (West and North Windows, Dog + Child Safe, Minimal Maintenance)

### Growing Conditions Assessment
| Parameter              | User's Situation                                                  |
|------------------------|-------------------------------------------------------------------|
| Light level            | Bright indirect to medium (west window = afternoon sun + indirect; north kitchen = low-medium) |
| Window direction(s)    | West (living room, primary), North (kitchen, secondary)           |
| Distance from window   | To be confirmed -- recommend placing plants within 3 feet of west window |
| Room humidity          | Assumed moderate 40-50% (standard apartment -- verify in winter)  |
| Temperature range      | 65-75 degrees F typical apartment range                           |
| Seasonal light shift   | West window will remain consistent year-round but sun angle will lower in winter, reducing afternoon hours of direct light slightly |
| Maintenance commitment | Low -- explicitly forgets to water; recommending drought-tolerant species only |
| Pets or children       | Yes -- dog and 3-year-old; all recommendations must be non-toxic  |
| Aesthetic goal         | Looks good; no trailing low-to-ground plants (child can reach and pull) |

---

### Recommended Plants (Start with 2-3 maximum)

#### Plant 1: Spider Plant (Chlorophytum comosum)
- **Light match:** Excellent for west window -- handles bright indirect to some direct afternoon sun without scorching. Tolerates the north kitchen window as a secondary location.
- **Watering trigger:** Water when the top 1.5-2 inches of soil are dry. Insert finger to the second knuckle -- if dry and room temperature, water. Spider plants store some water in their thick root system and tolerate missing a watering cycle.
- **Watering frequency (approximate):** Every 7-14 days in spring/summer; every 14-21 days in fall/winter.
- **Humidity tolerance:** Prefers 40-60% but tolerates standard home humidity easily. No action needed in a normally conditioned apartment.
- **Humidity action needed:** None under normal conditions.
- **Pet safety:** Non-toxic to dogs and cats. Safe around children. (Note: contains mild opioid-like compounds that some cats find attractive -- they may nibble; this causes no toxicity, at most mild stomach upset.)
- **Soil mix:** Standard indoor potting mix as purchased. No amendment needed.
- **Pot type:** Plastic or glazed ceramic with drainage holes. Start in a 4-6 inch pot. Place in a hanging planter or on a shelf where the baby plantlets (spiderettes) can trail down attractively and out of the 3-year-old's immediate reach.
- **Fertilizing:** Half-strength liquid 20-20-20 diluted fertilizer once monthly, April through September. Nothing October through March.
- **Special notes:** Spider plants produce "spiderettes" -- baby plants on long runners that are highly engaging for children. You can snip these off and root them in water to grow new plants. This plant is one of the most forgiving houseplants that exists and an excellent first success story.

---

#### Plant 2: Peperomia (Peperomia obtusifolia -- Baby Rubber Plant, or any compact variety)
- **Light match:** West window is ideal -- bright indirect to gentle afternoon sun. Will tolerate the north kitchen window at medium light.
- **Watering trigger:** Water when the top 2 inches of soil are completely dry. The semi-succulent leaves store water -- this plant strongly prefers to dry out between waterings and will rot if kept moist.
- **Watering frequency (approximate):** Every 10-14 days in spring/summer; every 21-28 days in fall/winter. This is one of the more forgiving plants for a forgetful owner.
- **Humidity tolerance:** Tolerates 30-60% -- handles dry apartment air in winter without issues.
- **Humidity action needed:** None.
- **Pet safety:** Non-toxic to dogs and cats. Safe around children.
- **Soil mix:** Standard indoor potting mix + 20-30% perlite for improved drainage. The semi-succulent nature of this plant means it wants faster drainage than standard potting mix alone provides.
- **Pot type:** Terracotta pot (4-6 inch) -- the breathable walls dry soil faster, which suits this plant's preference. Drainage holes required.
- **Fertilizing:** Same as spider plant -- half-strength monthly, April through September only.
- **Special notes:** Extremely compact; will not get in the way or tip over easily. Available in dozens of varieties with different leaf textures and colors -- all with similar care. If you are going to forget to water, this plant forgives you.

---

#### Plant 3: Cast Iron Plant (Aspidistra elatior)
- **Light match:** The only truly appropriate recommendation for the north kitchen window. Handles low to medium light better than almost any other attractive foliage plant. Also tolerates the west window in a further position.
- **Watering trigger:** Water when the top 2 inches of soil are dry. Cast iron plant tolerates drought extremely well and will not punish a missed watering. Water every 14-21 days in summer; every 21-30 days in winter.
- **Watering frequency (approximate):** Every 14-21 days spring/summer; every 21-30 days fall/winter.
- **Humidity tolerance:** Tolerates 30-70% with no special requirements.
- **Humidity action needed:** None.
- **Pet safety:** Non-toxic to dogs and cats. Safe around children.
- **Soil mix:** Standard indoor potting mix is fine. Mix in 10-20% perlite if desired for improved drainage.
- **Pot type:** Any pot with drainage holes. This slow-growing plant may stay in the same pot for 3-5 years before needing repotting -- low-maintenance in every dimension.
- **Fertilizing:** Half-strength diluted fertilizer once monthly, April through September. Very slow feeder -- do not over-fertilize.
- **Special notes:** Named "cast iron" for its legendary tolerance of neglect, poor light, temperature fluctuations, and inconsistent care. It will not wow visitors with dramatic foliage, but it will be alive next year when everything else is uncertain. Place in the north kitchen window as a low-light workhorse.

---

### Weekly and Monthly Care Checklist

**Every watering session:**
- [ ] Check spider plant: insert finger 1.5-2 inches into soil -- if dry, water until it flows from drainage hole; wait 30 minutes; empty saucer
- [ ] Check peperomia: insert finger 2 inches deep -- must be completely dry before watering
- [ ] Check cast iron plant: same as peperomia; water only when dry 2 inches down
- [ ] Use room-temperature water for all three plants

**Weekly tasks:**
- [ ] Rotate each pot 1/4 turn to ensure even light on all sides
- [ ] Quick visual check for unusual spotting, wilting, or insects (60 seconds per plant)

**Monthly tasks:**
- [ ] Wipe dust from leaves (especially the cast iron plant's wide leaves) with a damp cloth
- [ ] Fertilize with half-strength liquid fertilizer during April through September
- [ ] Check soil of each pot -- adjust watering rhythm based on how long it took to dry out

**Seasonal adjustments:**
| Task                          | Spring (Mar-May)             | Summer (Jun-Aug)              | Fall (Sep-Nov)               | Winter (Dec-Feb)              |
|-------------------------------|------------------------------|-------------------------------|------------------------------|-------------------------------|
| Watering frequency            | Begin watering more often as growth resumes | Most frequent -- west window is bright and warm | Begin reducing gradually     | Minimum watering -- 30-50% reduction from summer |
| Fertilizing                   | Resume monthly feeding in March | Continue monthly             | Final feed in September      | None -- do not fertilize      |
| Light management              | Move plants closer to west window as needed | Monitor for leaf scorch on peperomia if in direct sun | Move all plants to maximize west window light | Prioritize brightest spots; west window is key |
| Humidity                      | Standard apartment humidity fine | AC may dry air slightly -- monitor leaf margins | Heating season starts -- watch for crispy tips | If forced-air heating, ensure plants are away from vents; add pebble tray if leaves show stress |

---

### Potting Specifications
| Parameter         | Specification                                                                |
|-------------------|------------------------------------------------------------------------------|
| Pot type          | Plastic or glazed ceramic with drainage holes for spider plant; terracotta with drainage for peperomia; any pot with drainage for cast iron plant |
| Pot size          | Start in existing nursery pots or match root ball + 1-2 inches. Do not upsize prematurely. |
| Soil mix          | Standard indoor potting mix for spider plant and cast iron plant; standard mix + 20-30% perlite for pepe
