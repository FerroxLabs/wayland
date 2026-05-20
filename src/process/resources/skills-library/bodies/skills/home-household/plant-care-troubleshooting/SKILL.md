---
name: plant-care-troubleshooting
description: |
  Diagnoses common plant health problems using symptom-based analysis for garden and houseplants. Covers overwatering, underwatering, nutrient deficiency, light issues, and pest identification. Produces a diagnosis with treatment steps and prevention plan.
  Use when the user asks why a plant is wilting, yellowing, dropping leaves, has spots, or shows other signs of stress. Use for plant health troubleshooting, not human health.
  Do NOT use for lawn care issues (use lawn-care-schedule), vegetable garden planning (use vegetable-garden-planning), or any medical or health diagnosis of humans or animals.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "gardening troubleshooting planning"
  category: "home-household"
  subcategory: "gardening"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Plant Care Troubleshooting

## When to Use

**Use this skill when:**
- A user reports specific visible symptoms on a plant -- yellowing, browning, wilting, spots, distortion, discoloration, or unusual growth patterns -- and wants to understand why
- A user suspects a specific problem (overwatering, underwatering, pests, disease) but wants confirmation and a concrete treatment plan
- A user's plant is declining gradually or crashed suddenly and they do not know where to start
- A user wants to differentiate between two look-alike problems (e.g., spider mite damage vs. nutrient deficiency; overwatering vs. underwatering -- both cause wilting)
- A user asks about nutrient deficiency symptoms, interveinal chlorosis, or the visual signatures of macro- or micronutrient imbalances
- A user has already treated a plant problem once but the plant has not improved, and they want to reassess the diagnosis
- A user reports pest sightings or suspects pest damage on garden or houseplants
- A user's plant has survived but shows lingering symptoms (e.g., scarring, permanent leaf curl) and wants to know if recovery is possible

**Do NOT use when:**
- The problem involves turf grass, lawn patches, or sod -- use `lawn-care-schedule` instead
- The user wants to plan a new garden bed, design a planting layout, or select companion plants -- use `vegetable-garden-planning`
- The user is asking about growing vegetables from seed or crop rotation planning -- use `vegetable-garden-planning`
- The problem involves large tree health requiring arborist-level diagnosis: canopy dieback from fungal vascular disease (oak wilt, Dutch elm disease), root girdling, trunk wounds from equipment damage, or tree removal decisions -- these require in-person professional assessment
- The user has questions about human or animal health symptoms, even if they are plant-adjacent (e.g., "my child ate a leaf -- is it toxic?") -- refer to poison control or a veterinarian
- The user needs lawn overseeding, fertilization schedule design, or irrigation planning -- use `lawn-care-schedule`
- The user wants a full seasonal pruning plan or hedge trimming schedule rather than health problem-solving -- this is garden maintenance, not diagnostics

**Scope clarification:** This skill diagnoses plant health problems only. It covers houseplants, garden ornamentals, container plants, herbs, shrubs, and small woody plants. It does not provide medical, veterinary, or toxicological advice.

---

## Process

### Step 1: Gather the Minimum Diagnostic Dataset

Before forming any hypothesis, collect all of the following. Missing even one field -- especially watering frequency or soil moisture -- leads to incorrect diagnoses. Ask the user directly if any fields are absent.

- **Plant identity:** Species name, common name, or physical description (leaf shape, size, growth habit, whether it vines, rosettes, has thick succulent leaves, etc.). If the user cannot identify it, proceed to the identification sub-process in Edge Cases.
- **Primary symptom:** The single most noticeable problem. Yellowing? Wilting? Spots? Distortion? This is the diagnostic anchor.
- **Secondary symptoms:** Additional changes that accompany the primary symptom. Sticky residue? Webbing? Drooping? Smell?
- **Location of symptoms on the plant:** New growth (apical tips, youngest leaves) vs. old growth (lower, older leaves) vs. entire plant vs. one side only. This single factor eliminates half the diagnostic possibilities immediately.
- **Timeline:** Did this happen overnight or over weeks? Sudden onset suggests temperature shock, drought crisis, or chemical damage. Gradual onset suggests chronic mismanagement, slow-progressing disease, or nutrient depletion.
- **Watering habits:** How often, how much, and -- critically -- how the user decides when to water (by schedule vs. soil feel). Ask whether water pools in the saucer or drains freely.
- **Soil moisture right now:** Ask the user to press a finger 2 inches into the soil and report whether it is wet, moist, or dry.
- **Light conditions:** Hours of direct sun per day, compass direction of the nearest window (south-facing = most light, north-facing = least in the Northern Hemisphere), or outdoor exposure (full sun, part shade, dappled light under trees).
- **Pot type and drainage:** Does the pot have drainage holes? What material (terracotta dries faster than plastic or glazed ceramic)? How old is the potting mix?
- **Recent changes:** Moved, repotted, fertilized, treated with pesticides, subjected to a weather event, brought indoors for winter, recently purchased.
- **Fertilization history:** What product, what frequency, and when was it last applied. Fertilizer burn and nutrient deficiency are mirror-image problems that look similar but require opposite responses.

### Step 2: Apply the Symptom Location Filter

The location of symptoms on the plant is the single most powerful initial filter. Apply this before consulting the full symptom table.

**Symptoms confined to OLD GROWTH (lower, older leaves):**
- Overwatering or root rot (most common)
- Nitrogen deficiency (mobile nutrient -- plant cannibalizes old leaves first)
- Natural senescence (if only 1-2 leaves drop occasionally, this is normal)
- Root-bound pot reducing nutrient uptake

**Symptoms confined to NEW GROWTH (shoot tips, youngest leaves):**
- Iron, manganese, zinc, or copper deficiency (immobile micronutrients -- cannot be redistributed from old tissue)
- Calcium or boron deficiency (also immobile)
- Thrips or broad mite damage (pests that feed preferentially on soft new tissue)
- Herbicide damage (affects emerging tissue first)

**Symptoms on ALL LEAVES uniformly:**
- Severe drought stress
- Root rot at advanced stage
- Systemic disease (viral mosaic, vascular wilt)
- Significant soil pH imbalance locking out multiple nutrients simultaneously

**Symptoms on ONE SIDE or in PATCHES:**
- Sun scorch (sun-facing side)
- Cold damage (side nearest a window in winter)
- Pest colony (local infestation)
- Mechanical damage or chemical contact

### Step 3: Run the Full Symptom Diagnostic Table

Match the user's specific symptom profile to the table below. Use the Key Differentiator column to separate look-alike diagnoses before proceeding to a treatment recommendation.

**Leaf Color Symptoms:**

| Symptom | Most Likely Cause | Second Likely Cause | Key Differentiator |
|---------|------------------|--------------------|--------------------|
| Uniform yellow (lower/older leaves first) | Overwatering / root rot | Nitrogen deficiency | Overwatering: soil is wet, stems may be soft, pot may lack drainage. Nitrogen deficiency: soil drains well, plant looks healthy otherwise, yellowing is even with no mushiness |
| Interveinal chlorosis on NEW leaves (green veins, yellow between) | Iron deficiency (pH too high) | Manganese deficiency | Iron: usually pH above 7.0 locking out iron; confirm with soil pH test. Manganese: similar pattern but more common in acidic soils with high organic matter |
| Interveinal chlorosis on OLD leaves | Magnesium deficiency | -- | Magnesium is mobile; deficiency shows on older leaves first. Classic in roses and tomatoes. Confirm if plant has not been fertilized in months |
| Pale, washed-out overall color | Nitrogen deficiency (chronic) | Insufficient light | Nitrogen: all leaves pale, growth slows, no new leaves are deep green. Light: plant is also stretching or leaning, growth is spindly |
| Yellow with green veins on young leaves, soil pH unknown | Iron chlorosis | -- | Test soil pH; if above 6.5 for acid-loving plants (azaleas, blueberries, gardenias), acidify with sulfur amendment or chelated iron application |
| Brown tips, otherwise healthy | Low relative humidity | Fluoride/salt toxicity | Humidity: affects most leaves, especially wide-leaved tropicals. Salt: white crust on soil surface or pot rim, occurs with heavy fertilizing or tap water with high mineral content |
| Brown crispy edges | Underwatering | Wind scorch (outdoor) | Underwatering: soil is bone dry, pot feels light, plant may be wilting. Wind: only windward side affected, soil moisture is adequate |
| Brown soft spots with yellow halo | Overwatering / fungal rot | Bacterial leaf spot | Fungal: spots spread and merge in humid conditions. Bacterial: water-soaked margins, spots do not have fuzzy growth, spreads rapidly in wet weather |
| Brown dry papery spots (irregular shape) | Sun scorch | Anthracnose (fungal) | Sun scorch: confined to exposed upper leaf surfaces, no pattern. Anthracnose: angular spots following leaf veins, common in oaks and maples, worse after wet spring |
| White or silver stippling (tiny dots) | Spider mites | Thrips | Spider mites: fine webbing visible underneath, especially in dry, hot conditions. Thrips: stippling plus silvery streaks, check for tiny black fecal deposits on leaf undersides |
| White powdery coating (wiped off easily) | Powdery mildew | -- | Fungal; thrives in 60-80°F with high humidity but poor air circulation. Distinct from downy mildew (grows on leaf undersides, cannot be rubbed off) |
| Mosaic yellow-green mottling | Viral mosaic (TMV, CMV) | Nutrient deficiency | Viral: irregular mosaic pattern, often with leaf distortion, stunting; no treatment possible. Nutrient: uniform, no distortion; responds to fertilization |
| Black or dark purple coloration | Phosphorus deficiency | Cold damage / anthocyanin stress | Phosphorus: appears in seedlings or plants in cold soil below 55°F (phosphorus uptake is temperature-sensitive). Cold: stems also blacken, tissue dies |

**Structural and Growth Symptoms:**

| Symptom | Most Likely Cause | Key Action |
|---------|------------------|------------|
| Wilting with WET soil | Root rot or compacted/hydrophobic soil | Remove from pot; inspect roots; if brown and mushy, treat for root rot; if roots are healthy and soil is bone dry despite appearing dark, the soil may have become hydrophobic -- soak in water for 30 minutes |
| Wilting with DRY soil | Underwatering or heat stress | Water deeply until it drains; check if soil has pulled away from pot edges (sign of severe drying that prevents water absorption) |
| Leggy, etiolated growth (long internodes, small leaves, pale color) | Insufficient light | Measure light with a lux meter or plant app; most flowering houseplants need 2,000-10,000 lux; move to a brighter location or add a grow light (5,000-6,500K full-spectrum LED, 12-16 hours/day) |
| No flowering on a flowering plant | Insufficient light OR excess nitrogen | Verify species-specific light requirements; reduce nitrogen (high-N fertilizers promote foliage, inhibit flowers); some species require a cold dormancy period to trigger blooms |
| Sudden complete leaf drop | Temperature shock or draft | Identify recent temperature change; check if near an air conditioning vent, exterior door, or cold window; some tropical houseplants (ficus, gardenias) drop all leaves at once in response to a 10°F+ temperature swing |
| Root circling, stunted growth, dries out immediately after watering | Root-bound (pot-bound) | Check root ball; if roots circle the entire bottom or emerge from drainage holes, move up one pot size (typically 2 inches larger diameter); avoid jumping more than one size or the excess moist soil promotes root rot |
| Swollen, corky bumps on leaf undersides | Edema (physiological disorder) | Not a pest or disease; caused by overwatering during low-light, low-transpiration conditions (common in winter); reduce watering, improve light and air circulation; affected leaves will not recover but new growth will be clean |

### Step 4: Conduct Pest Identification

Only move to pest diagnosis if the user reports: visible insects, webbing, sticky honeydew, stippling, frass (insect droppings), distorted new growth, or shot-hole damage. Do not assume pests without physical evidence.

**Houseplant and Garden Pest Reference:**

| Pest | Identification | Damage Signature | Preferred Hosts | Treatment Escalation |
|------|---------------|-----------------|----------------|----------------------|
| Aphids | 1-3 mm soft-bodied insects; green, black, white, or pink depending on species; cluster on shoot tips and bud undersides; produce shiny honeydew | Curled, distorted new leaves; sticky deposits; sooty mold secondary infection on honeydew | Roses, peppers, beans, milkweed, most soft-stemmed plants | Level 1: strong water spray to knock off. Level 2: insecticidal soap (2% solution). Level 3: pyrethrin spray. Outdoors: encourage ladybugs and parasitic wasps |
| Spider mites | Barely visible (0.5 mm) red, yellow, or tan mites; fine silk webbing between leaves; most active in hot, dry conditions above 80°F | Yellow stippling on upper leaf surface; bronzed, dull appearance; severe infestation causes leaf drop | Orchids, palms, tomatoes, strawberries, conifers | Level 1: increase humidity above 50%, wash leaves. Level 2: insecticidal soap or neem oil on undersides. Level 3: miticide (spiromesifen, abamectin) -- rotating is critical because mites develop resistance rapidly |
| Mealybugs | White cottony clusters in leaf axils and stem crevices; eggs in waxy egg sacs; slow-moving | Yellowing, honeydew, sooty mold; severe cases cause wilting and dieback | Succulents, cacti, orchids, citrus, gardenias | Level 1: isopropyl alcohol (70%) on cotton swab for individual colonies. Level 2: insecticidal soap spray. Level 3: systemic imidacloprid (soil drench, indoor use) -- note: avoid imidacloprid on any flowering plant accessible to pollinators |
| Scale (soft and armored) | Brown, tan, or white waxy bumps on stems and leaf midribs; does not move when adult | Yellowing, stunted growth, honeydew, sooty mold; armored scale does not produce honeydew | Ficus, bay laurel, orchids, citrus, outdoor shrubs | Level 1: physical removal with soft brush + isopropyl alcohol. Level 2: horticultural oil (summer or dormant oil). Level 3: systemic insecticide for soft scale only (armored scale resists systemics) |
| Fungus gnats | Adults: 2-3 mm black flies resembling tiny mosquitoes; larvae: 5-6 mm transparent with black head, in top 3 inches of soil | Adult flies annoy; larvae damage fine feeder roots, causing wilting and yellowing; worse in overwatered containers | Any container plant in constantly moist organic media | Let top 2 inches dry completely between waterings; yellow sticky cards to monitor adult population; Bacillus thuringiensis israelensis (Bti) or Steinernema feltiae (beneficial nematodes) as soil drench to kill larvae |
| Whiteflies | 1-2 mm white, moth-like insects on leaf undersides; fly up in clouds when plant is disturbed | Yellowing, honeydew, sooty mold; severe cases cause leaf drop | Tomatoes, peppers, basil, poinsettias, fuchsias | Yellow sticky traps; insecticidal soap or neem oil on leaf undersides; avoid overhead watering which splashes larvae to new leaves |
| Thrips | 1-2 mm slender insects; pale yellow or black; fast-moving; found inside flower petals and on leaf surfaces | Silver-streaked stippling; distorted, papery new growth; dark fecal specks on leaf undersides; flower petal scarring | Peppers, onions, orchids, citrus, many ornamentals | Blue sticky traps (thrips are attracted to blue); spinosad spray (most effective organic option); remove and destroy heavily infested flowers |
| Slugs and snails | Silvery slime trails; irregularly shaped ragged holes, especially at leaf margins; damage occurs at night or in cloudy weather | Seedling destruction, large holes in leafy plants, severe damage to hostas | Hostas, lettuce, seedlings, strawberries, dahlias | Handpick after dark; iron phosphate bait (safe around pets and wildlife); copper tape barriers; remove debris and hiding spots; beer traps |
| Caterpillars | Visible caterpillars of various sizes; frass (dark pellet droppings) on leaves and below plant | Irregular large holes, defoliation; leaf skeletonization (sawfly larvae); entire leaf loss overnight | Brassicas (cabbage loopers), tomatoes (hornworms), various ornamentals | Bacillus thuringiensis kurstaki (Btk) spray -- kills caterpillars only, harmless to beneficials; handpick hornworms; row cover on brassicas |
| Root rot (Phytophthora / Pythium) | Not a pest but a water mold; roots are brown/black, mushy, smell foul; healthy roots should be white to tan and firm | Crown rot, wilting despite wet soil, lower stem blackening | Nearly all container plants in poorly draining soil | See root rot treatment protocol in Step 5 |

### Step 5: Assess Root Health When Root Problems Are Suspected

Root rot is the most frequently missed diagnosis because users do not want to disturb their plant. If any of these signs are present -- wilting with wet soil, persistent yellowing of lower leaves, mushy stems at the base, foul smell from the pot, or a plant that has been consistently overwatered -- guide the user through root inspection:

**Root Inspection Protocol:**
- Water the plant lightly (just enough to loosen soil) 24 hours before inspection if soil is bone dry and roots would be brittle
- Tip the pot sideways and gently slide the root ball out -- do not yank from the stem
- Brush away loose soil and examine the roots directly
- Healthy roots: white to light tan, firm, smooth texture, mild earthy smell
- Borderline roots: brown but still firm -- these are often viable but stressed
- Dead/rotten roots: dark brown to black, soft and slimy when squeezed, strong foul odor, disintegrate when touched

**Root Rot Treatment Protocol:**
- Using clean, sterilized scissors or pruning shears (wipe with 70% isopropyl alcohol), trim all rotten roots back to healthy tissue
- If the rot extends into the stem (crown rot), cut back to firm tissue even if significant stem material must be removed
- Optionally apply a light dusting of sulfur powder or cinnamon (both have antifungal properties) to the cut root surfaces
- Allow the trimmed root ball to air-dry in a shaded location for 30-60 minutes -- this allows cut surfaces to begin callusing and reduces the chance of reinfection
- Repot in fresh, sterile potting mix -- never reuse the old mix, which harbors Pythium and Phytophthora spores
- Choose a pot with drainage holes that is no more than 1-2 inches larger than the trimmed root ball (excess soil holds moisture that overwhelmed, reduced roots cannot absorb)
- Do not fertilize for 4-6 weeks after root rot treatment -- damaged roots cannot process fertilizer, and salt accumulation will burn recovery tissue
- Water very sparingly for the first 2 weeks: allow the top 2 inches to dry completely, then water just enough to moisten the root zone

**Soil pH Quick Reference:**
Nutrient lockout due to incorrect pH is one of the most underdiagnosed plant problems. Most houseplants and garden ornamentals thrive in a pH of 6.0-6.8. Test with an inexpensive probe or paper test kit.

| pH Level | Effect | Common Nutrients Affected |
|----------|--------|--------------------------|
| Below 5.5 | Highly acidic -- aluminum and manganese toxicity possible | Calcium, magnesium, phosphorus become less available |
| 5.5 - 6.0 | Optimal for acid-lovers (azaleas, blueberries, camellias) | Most nutrients available |
| 6.0 - 6.8 | Optimal for most houseplants and ornamentals | All major nutrients available |
| 6.8 - 7.5 | Slightly alkaline -- iron and manganese begin locking out | Iron chlorosis appears (interveinal on new growth) |
| Above 7.5 | Strongly alkaline -- multiple micronutrient deficiencies | Iron, manganese, zinc, boron all restricted |

To lower pH: amend with elemental sulfur (garden beds, slow-acting), acidifying fertilizer, or sulfuric acid-based products for containers. To raise pH: lime (calcium carbonate) or dolomitic lime (also adds magnesium).

### Step 6: Formulate the Diagnosis

Apply the following confidence framework before presenting a diagnosis:

**High Confidence:** Three or more symptoms point to the same cause, the pattern matches the species' known vulnerabilities, and the growing conditions logically explain the problem (e.g., wet soil + lower yellowing + mushy roots = root rot; high confidence).

**Medium Confidence:** Two symptoms align with one diagnosis, conditions are consistent, but one data point is ambiguous or missing (e.g., yellowing lower leaves + overwatering suspected but roots not inspected). State what confirmation test would elevate confidence.

**Low Confidence:** Only one symptom is present, the user cannot provide watering or light details, or the plant is unidentified. Provide a ranked list of top three possibilities with differential tests for each.

Present the most likely diagnosis first. Always provide at least one alternative and a specific test to differentiate between them.

### Step 7: Deliver the Treatment Plan and Prevention Protocol

Treatment steps must be time-sequenced and species-aware. Generic advice ("water less") is insufficient. Provide:
- The immediate action to take today
- The recovery window expectation (most plants show improvement in 2-4 weeks if treatment is correct)
- The monitoring criteria (what the user should look for to confirm recovery vs. continued decline)
- Adjustments to the long-term care routine that prevent recurrence
- A clear "When to Discard" threshold -- some plants are not recoverable, and the user should be given that information honestly rather than pursuing treatments that will not help

---

## Output Format

```
## Plant Diagnosis: [Plant Name / Species]

### Symptom Summary
| Field               | Detail                                              |
|---------------------|-----------------------------------------------------|
| Plant type          | [Common name + scientific name if known]            |
| Primary symptom     | [Most visible problem]                              |
| Secondary symptoms  | [Additional observations]                           |
| Symptom location    | [New growth / old growth / all over / one side]     |
| Timeline            | [Sudden onset vs. gradual / days vs. weeks]         |
| Watering habit      | [Frequency, method, soil moisture at time of report]|
| Light conditions    | [Hours, direction, intensity if known]              |
| Pot and soil        | [Drainage, pot material, age of mix]                |
| Recent changes      | [Repotted, moved, fertilized, weather event, etc.]  |
| Fertilization       | [Last application, product type, frequency]         |

---

### Diagnosis: [Primary Cause -- Specific Name]
**Confidence:** [High / Medium / Low]
**Diagnostic reasoning:** [3-5 sentences tracing each symptom to the diagnosis. Reference the specific data points the user provided. Explain WHY these symptoms together indicate this cause rather than others.]

---

### Alternative Diagnosis: [Second Most Likely Cause]
**Why it was considered:** [1-2 sentences explaining what symptoms overlap with the alternative.]
**How to rule it out:** [Specific test: check soil pH, inspect root color, look for webbing, etc. One concrete action the user can take right now to confirm or eliminate this alternative.]

---

### Treatment Plan
| Priority | Step | Specific Action | When |
|----------|------|----------------|------|
| Immediate | 1 | [Exact action with quantities, tools, technique] | Today |
| Immediate | 2 | [Follow-up immediate step] | Today |
| Short-term | 3 | [Recovery management action] | Days 3-7 |
| Short-term | 4 | [Monitoring check] | Week 2 |
| Ongoing | 5 | [Adjusted care routine] | Ongoing |

**Recovery window:** [Realistic timeline -- most plants show first signs of improvement in X weeks. Full recovery typically takes X months.]
**Monitoring criteria:** [What the user should see that confirms the treatment is working. What would signal that the treatment is not working and reassessment is needed.]

---

### Nutrient or pH Adjustment (if applicable)
| Nutrient / Amendment | Product Type | Rate | Frequency |
|---------------------|-------------|------|-----------|
| [e.g., chelated iron] | [Foliar spray / soil drench] | [oz per gallon, per sq ft] | [Weekly / monthly] |

---

### Prevention Plan
- **Watering adjustment:** [Specific rule for this plant: e.g., "Water when the top 2 inches of soil are dry, approximately every 7-10 days in summer and every 14-21 days in winter"]
- **Light optimization:** [Specific light requirement: lux range, window direction, grow light specs if needed]
- **Soil and drainage:** [Specific mix recommendation and drainage requirement]
- **Fertilization schedule:** [Product type, NPK ratio guidance, frequency, seasonal adjustments]
- **Environmental control:** [Humidity, temperature range, air circulation notes]

---

### When to Discard
[Specific, honest assessment of the point at which recovery is unlikely. Include: percentage of root loss, extent of stem/crown damage, or duration of decline that makes survival improbable. Where possible, provide a propagation-from-survivors option -- stem cuttings, leaf propagation, or division -- so the user does not lose the plant line entirely.]
```

---

## Rules

1. **Never diagnose from a single symptom.** Yellow leaves alone could mean overwatering, underwatering, nitrogen deficiency, iron chlorosis, root rot, viral infection, or natural aging. Require at least two corroborating data points before forming a diagnosis. State this explicitly if the user provides insufficient detail.

2. **Watering and soil moisture must be assessed before any diagnosis.** Overwatering and underwatering together account for the majority of houseplant emergency visits. Ask about soil moisture RIGHT NOW (finger test) before assuming any nutrient or pest problem.

3. **Symptom location on the plant is the most important filter -- apply it first.** Old-leaf symptoms indicate mobile nutrient problems or chronic overwatering. New-leaf symptoms indicate immobile nutrient deficiencies, pH lockout, or pest damage to tender tissue. Never skip this filter.

4. **Always provide a specific confirmation test alongside every alternative diagnosis.** Saying "it could also be nitrogen deficiency" is insufficient. Say "rule out nitrogen deficiency by checking that the soil drains freely and the stems are firm -- if both are true, do a water-only flush and apply a balanced fertilizer in 7 days; if the yellowing reverses, nitrogen was the cause."

5. **Treatment specificity is non-negotiable.** "Water less" fails the user. The correct instruction is: "Allow the top 2 inches of soil to dry completely before watering, approximately every 10-14 days in normal indoor conditions. Press a finger 2 inches into the soil -- if it feels moist, wait. If it feels dry and the pot feels lighter than usual, water deeply until water drains from the bottom hole."

6. **Pest identification requires physical evidence before treatment.** Do not recommend insecticide applications unless the user has confirmed insect presence visually or through sticky trap catches. Insecticide application without pest confirmation stresses the plant unnecessarily and kills beneficial insects.

7. **Do not recommend imidacloprid or systemic neonicotinoids on plants that flower or are accessible to pollinators outdoors.** For indoor use where no pollinators are present and systemic control is needed (severe mealybug, scale infestations that resist topical treatment), imidacloprid soil drench is acceptable. Always note this restriction explicitly.

8. **Root rot treatment requires pot and soil replacement -- not just reduced watering.** Pythium and Phytophthora spores persist in old potting mix and on pot walls. Reusing contaminated soil after root rot treatment causes immediate re-infection. Always recommend sterilized fresh mix and a clean pot (washed with a 10% bleach solution, rinsed thoroughly).

9. **Fertilizer burn and nutrient deficiency are opposite problems that look similar.** Marginal leaf burn with white soil crust = salt accumulation from excess fertilizer; flush soil with 3x pot volume of clean water. Pale uniform growth with no soil crust = deficiency; begin a balanced fertilizer at half label rate. Applying fertilizer to a plant with fertilizer burn dramatically worsens the problem.

10. **Give honest prognosis, including discard thresholds.** A plant with more than 80% root rot, crown rot into the vascular tissue, or viral systemic infection is not recoverable through any treatment the user can perform at home. Telling a user to keep treating an unrecoverable plant wastes time and delays replacing it. Always offer a propagation alternative (stem cutting, division) where physically possible so the plant line can continue.

11. **pH correction precedes nutrient supplementation.** If soil pH is out of range, adding more fertilizer will not correct a lockout condition -- the nutrients are present but chemically unavailable. Diagnose pH first; amend pH second; then fertilize if needed. Applying chelated iron is the fastest way to address iron chlorosis while pH correction takes effect (chelated iron bypasses pH sensitivity).

12. **Edema and overwatering have opposite treatments despite looking similar.** Edema (corky blisters on undersides of leaves) is caused by irregular watering and low transpiration, not by the plant drowning. Improving light and air circulation treats edema. Do not mistake edema for a fungal infection or pest damage.

---

## Edge Cases

**1. Plant shows multiple severe symptoms simultaneously (yellowing + wilting + spots + leaf drop)**
When a plant crashes across multiple symptom categories at once, prioritize root investigation first. The vast majority of multi-symptom catastrophic failures trace to root rot or complete root desiccation -- both of which deprive the entire plant of water and nutrients simultaneously, causing systemic failure. Inspect roots before diagnosing multiple independent problems. If roots are healthy, assess each symptom cluster independently: the plant may have acquired two separate problems (e.g., fungal leaf spot from splashing water combined with underwatering from a schedule disruption). Treat the most life-threatening issue first (water balance), then address secondary issues once the plant stabilizes.

**2. Plant was recently purchased, moved, or shipped and is now declining**
Newly purchased and recently relocated plants frequently show dramatic distress: leaf drop, wilting, yellowing -- all normal within the first 2-4 weeks. This is acclimatization stress or transplant shock caused by the transition from a high-light, high-humidity greenhouse environment to a lower-light, lower-humidity home environment. The plant is reducing its leaf mass to match available resources. Management: establish consistent conditions immediately; do not fertilize for 4-6 weeks (roots cannot process it); do not repot until the plant shows 2-3 new leaves of healthy growth. If leaf drop continues past 4-6 weeks or the stem becomes soft, re-evaluate for a true disease or pest problem.

**3. Outdoor plant in an unknown growing season or after a weather event**
Outdoor plant problems are heavily confounded by weather. Before diagnosing disease or pest issues, ask: Was there a frost in the past 2 weeks? A heat event above 95°F? Heavy rain followed by standing water? Hailstorm? Cold damage looks like bacterial infection (brown, water-soaked tissue); heat and drought stress looks like spider mite damage; hail damage looks like shot-hole disease. If weather was extreme recently, the diagnosis leans toward physical or temperature damage rather than pathogen activity. Most weather-damaged plants recover on their own if the underlying environmental stressor is removed and the plant is otherwise healthy.

**4. Edible plant with a disease or pest problem -- food safety concern**
Users with herb gardens, fruiting container plants, or kitchen garden vegetables often ask whether affected produce is still safe to eat. Provide plant safety guidance only, not dietary advice. General principles: remove and discard visibly diseased tissue (fungal or bacterial lesions); do not consume leaves with active pest colonies (honeydew and sooty mold make produce unpalatable and may harbor pest excrement); produce from the same plant that shows no visible disease symptoms is generally safe to consume after washing. Advise washing all homegrown produce thoroughly before eating regardless of disease status. If the user asks about plant toxicity to humans, direct them to poison control services -- this is outside the scope of this skill.

**5. User cannot identify the plant**
Do not refuse to help when the plant is unidentified. Ask the user to describe: approximate plant height, leaf shape (round, oval, elongated, lobed, compound), leaf surface texture (smooth, waxy, hairy, thick/succulent), growth habit (upright, trailing, rosette, vining), flower color and shape if applicable, and where they obtained the plant. Most common houseplants can be reliably identified from these features. Cross-reference against most common indoor plants: pothos, philodendron, snake plant, ZZ plant, peace lily, fiddle-leaf fig, monstera, dracaena, rubber plant, spider plant. If the plant remains unidentified, apply general broad-spectrum troubleshooting for the most likely stress type based on conditions, and note that identification would allow more specific guidance.

**6. User has already treated the plant and it is not improving**
Re-diagnosis is needed. Ask: What did you treat for, what specifically did you do, and how long ago? Then assess whether the original diagnosis was correct (re-examine symptoms through the diagnostic table) and whether the treatment was correctly applied. Common failure modes: treating for underwatering when root rot was the real cause (adding water accelerates rot); applying neem oil in direct sunlight (causes leaf burn); using insecticidal soap at too high a concentration (above 3% solution damages plant tissue); repotting a plant that needed pruning, not more soil. Revise the diagnosis based on how the plant responded to the first treatment -- a plant that got worse after watering is almost certainly overwatered, not underwatered.

**7. Viral infection suspected (mosaic, ring spot, necrotic patterns)**
Viral plant diseases have no treatment. If the symptom pattern includes irregular mosaic yellowing with leaf distortion, ring spots, or necrotic line patterns that do not match any nutrient deficiency or overwatering profile, consider viral infection. Confirming features: symptoms are random and asymmetric (not following the old-growth/new-growth pattern), the plant has not responded to any nutritional or watering corrections, and multiple plants nearby show similar symptoms. Management: remove and bag the infected plant (do not compost); clean all tools with 70% isopropyl alcohol; control aphids and other sap-sucking insects that vector viruses; do not propagate from infected plant tissue. Be clear with the user: there is no cure, and the plant must be discarded to prevent spread to other plants.

**8. High-value or sentimental plant in severe decline**
When a user indicates that a plant is irreplaceable (a cutting from a deceased family member's garden, a decades-old specimen, a rare cultivar), elevate the response priority toward salvage before discard. Explore all propagation options before recommending discarding: Can a single healthy stem cutting be taken and rooted in water or propagation mix before root rot claims the whole plant? Can the remaining healthy tissue be air-layered? Can leaves be used for propagation (succulents, African violets, begonias)? Even if the original plant cannot be saved, preserving genetic material through propagation is meaningful and should be offered as an option in all severe-case diagnoses.

---

## Example

**Input:** "I have a peace lily that has been in the same spot by a north-facing window for two years. It was doing fine until about three weeks ago. Now the leaves are turning yellow -- mostly the older lower ones -- and a few leaves are drooping even when I water it. The soil feels kind of wet when I check it, and I've been watering it every Sunday no matter what. There's also a faint smell from the pot. I haven't fertilized it in about six months."

---

## Plant Diagnosis: Peace Lily (Spathiphyllum wallisii)

### Symptom Summary
| Field               | Detail                                                                 |
|---------------------|------------------------------------------------------------------------|
| Plant type          | Peace lily (Spathiphyllum wallisii)                                   |
| Primary symptom     | Yellowing of lower, older leaves                                       |
| Secondary symptoms  | Drooping despite wet soil; faint foul odor from pot                   |
| Symptom location    | Lower and older leaves primarily; wilting throughout                  |
| Timeline            | Gradual onset over 3 weeks                                             |
| Watering habit      | Weekly on a fixed schedule regardless of soil moisture; soil is wet   |
| Light conditions    | North-facing window -- low light (~500-1,000 lux in most homes)       |
| Pot and soil        | Unknown drainage; in same pot for 2 years with original potting mix   |
| Recent changes      | No changes -- same location, same schedule for 2 years                |
| Fertilization       | No fertilization for 6 months                                          |

---

### Diagnosis: Root Rot from Chronic Overwatering (Pythium / Phytophthora spp.)
**Confidence:** High

**Diagnostic reasoning:** Four independent data points converge on root rot as the primary cause. First, watering on a rigid weekly schedule without checking soil moisture is the most common cause of chronic overwatering in container plants -- a peace lily in a north-facing window in autumn or winter requires water only every 10-21 days as light intensity and temperature drop. Second, the yellowing is confined to lower, older leaves -- a classic pattern for overwatering and root oxygen starvation, in which the roots cannot supply nutrients to the plant and the plant sacrifices older foliage. Third, wilting despite wet soil is the definitive sign that roots are no longer functional: a plant with healthy roots does not wilt in moist soil. Fourth, a foul odor from the pot is direct evidence of anaerobic decomposition -- rotting root tissue. Together these four factors make root rot the diagnosis with high confidence. The 2-year-old potting mix is a contributing factor: potting mix degrades over 12-18 months, losing its porous structure and retaining water much longer than fresh mix.

---

### Alternative Diagnosis: Nitrogen Deficiency
**Why it was considered:** Lower-leaf yellowing is also a signature of nitrogen deficiency, which is plausible given six months without fertilization.

**How to rule it out:** Nitrogen deficiency does not cause wilting in wet soil, does not produce a foul odor, and produces firm (not mushy) stems. Remove the plant from its pot and check the roots. If roots are white and firm, nitrogen deficiency is the primary diagnosis and fertilization is the correct treatment. If roots are brown, slimy, or disintegrating, nitrogen deficiency may be a secondary contributing factor but root rot is the primary problem -- and fertilizing a plant with root rot will cause further damage, not improvement.

---

### Treatment Plan
| Priority | Step | Specific Action | When |
|----------|------|----------------|------|
| Immediate | 1 | Remove the peace lily from its pot gently; slide the root ball out rather than pulling from stems | Today |
| Immediate | 2 | Inspect all roots: healthy roots will be white to tan and firm. Trim all brown, black, or mushy roots with scissors sterilized in 70% isopropyl alcohol; cut back to firm white tissue | Today |
| Immediate | 3 | If rot extends into the stem base (blackening above soil line), cut back to firm green tissue -- even if this means cutting the plant to 2-3 inches tall; peace lilies regenerate from the crown | Today |
| Immediate | 4 | Dust cut root surfaces lightly with powdered cinnamon or sulfur as a mild antifungal; allow the trimmed root ball to air-dry in a shaded location for 45-60 minutes | Today |
| Immediate | 5 | Repot in fresh sterile potting mix (standard indoor mix with added perlite at 20% by volume for improved drainage); use a clean pot with drainage holes that is no larger than 1-2 inches wider than the trimmed root ball; wash the old pot with a 10% bleach solution and rinse thoroughly before reuse | Today |
| Short-term | 6 | Do not water for 5-7 days after repotting to allow cut root surfaces to callus; on day 7, check moisture at 2-inch depth -- water only if the soil is dry at that depth | Days 5-7 |
| Short-term | 7 | Remove all yellowed leaves at their base -- they will not recover and redirecting energy to healthy tissue speeds recovery; do not remove drooping leaves that are still green, as they may recover once root function is restored | Today and Days 1-3 |
| Short-term | 8 | Resume watering ONLY when the top 2 inches of soil are dry to the touch -- for a peace lily in a north window, this will typically be every 10-14 days in summer and every 14-21 days in winter; do not return to a fixed weekly schedule | Ongoing from Week 2 |
| Ongoing | 9 | After 4-6 weeks and once new healthy leaves have emerged (confirming root function has resumed), begin fertilizing with a balanced liquid fertilizer (10-10-10 or similar) at half the label rate, monthly during the growing season (March-September); do not fertilize in winter | Month 2 onward |

**Recovery window:** Peace lilies are resilient if root rot is caught before it reaches the crown. Expect 2-4 weeks before new leaf growth appears. Full canopy recovery typically takes 2-3 months. If no new growth appears after 6 weeks and the remaining stems are soft, escalate to the When to Discard assessment.

**Monitoring criteria:** Positive signs -- new unfurling leaves, existing green leaves firming up and losing their droop, white roots visible at drainage holes after 4-6 weeks. Negative signs -- continued wilting after 2 weeks, new leaves emerging yellow or malformed, foul odor persisting after repotting (suggests crown rot was not fully removed).

---

### Prevention Plan
- **Watering adjustment:** Abandon the fixed weekly schedule entirely. Water a peace lily only when the top 2 inches of soil feel dry to the finger-press test. In a north-facing window, this will be approximately every 10-21 days depending on season. The pot should feel noticeably lighter than just after watering -- this weight difference is a reliable secondary indicator.
- **Light optimization:** North-facing windows provide roughly 500-1,000 lux -- adequate for peace lily survival but at the low end of its tolerance. Peace lilies prefer 1,000-2,500 lux of indirect light. Consider moving 2-3 feet closer to an east-facing window (morning sun, no harsh afternoon rays) if available. Avoid direct sun, which scorches peace lily leaves.
- **Soil and drainage:** Replace potting mix every 18-24 months. Mix 80% standard indoor potting mix with 20% perlite to maintain drainage as the mix ages. Always use a pot with at least one drainage hole; empty the saucer within 30 minutes of watering so roots do not sit in standing water.
- **Fertilization schedule:** Resume at half-strength balanced liquid fertilizer (10-10-10 or 20-20-20 diluted to half the label rate) once per month from April through August. Do not fertilize September through March -- peace lilies enter a slow-growth phase in low winter light and cannot process fertilizer efficiently, leading to salt buildup.
- **Environmental control:** Peace lilies prefer 65-85°F and relative humidity above 40%. Brown leaf tips (a separate issue) are caused by humidity below 30%, which is common in heated winter homes. A pebble tray with water under the pot (keeping the pot base above the water level) raises local humidity without increasing soil moisture.

---

### When to Discard
If root inspection reveals that more than 80% of the root system is rotten and the crown (the central growing point at soil level from which all leaves emerge) is brown, soft, and foul-smelling rather than firm and pale green, the plant cannot regenerate and should be discarded. Do not attempt to grow a crown-rotted peace lily in water or in new soil -- there is no functional tissue to generate new roots.

**Propagation salvage option:** Before discarding, examine whether any individual stems or offshoots (peace lilies often produce small pups around the base) retain firm, healthy tissue with at least one healthy leaf. These can be separated, their roots trimmed to any remaining healthy white root tissue, potted individually in fresh mix, and kept in a humid environment (a loose plastic bag tent over the pot creates a humidity chamber). Peace lily pups establish in 4-6 weeks under these conditions and will grow into full plants within one growing season.
