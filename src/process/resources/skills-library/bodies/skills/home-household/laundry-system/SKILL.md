---
name: laundry-system
description: |
  Creates an efficient laundry routine covering sorting, washing settings by
  fabric type, stain treatment, drying methods, and scheduling for different
  household sizes. Includes water temperature guides, care label decoding, and
  time-saving batch strategies. Use when the user asks about laundry routines,
  fabric care, stain removal, washing machine settings, or organizing their
  laundry workflow. Do NOT use for dry cleaning guidance, commercial laundry
  operations, or cleaning products chemistry.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cleaning guide step-by-step"
  category: "home-household"
  subcategory: "cleaning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Laundry System

## When to Use

Use this skill when the user is asking about any aspect of home laundry care, routine building, or fabric handling:

- User wants to establish or overhaul a laundry routine -- they feel behind on laundry, laundry is piling up, or they have no consistent system
- User needs wash settings for a specific fabric type or garment (temperature, cycle selection, detergent type, dryer setting)
- User needs to treat a specific stain and wants to know the correct method before washing
- User wants to decode a care label symbol and understand what it means for how to wash the item
- User has a specific concern: colors bleeding, clothes shrinking, static, pilling, odor not coming out after washing, whites turning gray or yellow, towels losing absorbency
- User is setting up a new household (first apartment, new baby, college student) and needs to learn laundry fundamentals from scratch
- User wants to reduce laundry time, energy costs, or the number of loads per week through better batching and scheduling
- User asks about washing machine settings they do not understand (permanent press, pre-soak, extra rinse, delay start, soil level)

**Do NOT use this skill when:**

- The care label says "dry clean only" or the garment is high-value and the user is asking whether to risk machine washing it -- advise professional dry cleaning consultation instead (this skill does not cover garment restoration risk assessment for couture or vintage items)
- The washing machine itself is broken, leaking, not spinning, or displaying error codes -- use `appliance-troubleshooting` or `appliance-maintenance`
- The user asks about overall household cleaning routines -- use `weekly-cleaning-schedule`
- The user asks about commercial laundry operations, industrial textile care, or uniform laundering at scale -- this skill covers residential (1-10 person) households only
- The user is asking about the chemistry of cleaning products, surfactant selection, or DIY detergent formulation -- that requires a specialized chemistry/product-safety skill
- The user is asking about removing mold from walls or surfaces, not from fabric -- use a household mold remediation skill
- The user needs guidance on washing a down-filled item (sleeping bag, down jacket) at scale -- that requires specific front-loader + tennis ball technique and is handled under specialty item care

---

## Process

### Step 1: Identify the User's Immediate Need and Household Profile

Before delivering any guidance, determine whether the user has an urgent single question or needs a full system built. These require different outputs.

- **Urgent single question** (stain emergency, care label confusion, one specific garment): Skip to the relevant section -- provide the stain treatment, fabric setting, or label decode immediately without building a full system
- **Full system request** (routine, schedule, overwhelmed by laundry, new household): Collect the household profile before outputting anything
- If the user hasn't stated it, ask for exactly these five data points -- do not proceed with a full system plan without them:
  - Number of people in the household and rough age groups (toddlers, school-age, teens, adults, elderly)
  - Washer type: front-load HE, top-load HE (no agitator), top-load traditional (with agitator), or laundromat/shared facility
  - Dryer type: vented gas, vented electric, heat pump/condenser, or air-dry only
  - Laundry frequency preference: daily, every other day, twice weekly, once weekly, as-needed
  - Primary pain points (time, cost, specific damage problems, space, confusion about settings)
- Record whether the user has special circumstances that will affect the system: infant in the household, someone with allergies or skin conditions, athlete generating heavy activewear volume, someone with a physically demanding job (mechanics grease, healthcare worker sanitation needs, tradesperson with heavily soiled work clothes)

### Step 2: Build the Sorting Architecture

Sorting is the highest-leverage habit in a laundry system -- it prevents color bleeding, fabric damage, lint transfer, and heat-related shrinkage before any wash decision is made.

- **Minimum viable sort (3 bins):** Lights (whites, pastels, light gray), Darks (navy, black, charcoal, dark brown), and a catch-all for everything else (medium colors, mixed items)
- **Recommended sort for households of 3+ people (5 bins):** Lights, Darks, Colors (bright reds, yellows, oranges, bright blues -- the most likely bleeders), Towels/Linens, Delicates/Special Care
- **High-volume households (5+ people) or households with athletes (6 bins):** Add Activewear/Synthetics as its own category -- these require cold water and no fabric softener, which conflicts with the regular clothing wash
- Sorting rule for garments that are ambiguous: when in doubt about a color, sort darker -- a medium gray shirt goes with darks, not lights
- Pre-sort at source: place the bins where clothes actually come off (bedroom, bathroom) -- a bin in the laundry room only works if people walk their clothes there, which most households do not do consistently
- Teach each household member (age 7+) to sort their own clothes into the bins -- this is a 15-second habit that eliminates the sorting chore for the person managing laundry
- Label each bin physically -- color-coded labels or photos for young children

### Step 3: Create the Wash Settings Matrix

Every category from Step 2 needs a complete set of wash parameters. Do not give incomplete recommendations -- a temperature without a cycle type leaves the user to guess.

**Water Temperature Decision Framework:**

- **Hot water (120-130°F / 49-54°C):** Towels, bed sheets, pillowcases, heavily soiled work clothes, white cotton underwear and socks, cloth diapers, gym clothing with fungal concerns. Hot water kills bacteria, dust mites, and most pathogens. Use only on 100% cotton or cotton-blend items that have already been washed at least once (pre-shrunk). Never use on synthetics, wool, silk, or anything with dye that might bleed.
- **Warm water (90-105°F / 32-40°C):** Permanent press items, synthetic blends (polyester-cotton), moderately soiled everyday clothing in light to medium colors, jeans (first 3-4 washes before dye is stable), baby clothing (fragrance-free detergent). Warm water balances cleaning power with color and shape preservation.
- **Cold water (60-80°F / 15-27°C):** All darks, bright colors, delicates, wool (if the label permits machine washing at all), activewear, items prone to shrinking, lightly soiled casual clothing. Cold water is appropriate for approximately 80% of a typical household's laundry once sorted correctly. Modern enzyme-based detergents are fully effective in cold water.

**Cycle Selection by Fabric Type:**

- **Normal/Regular cycle:** Cotton, cotton blends, linen, heavily soiled items. High agitation + high spin speed. Appropriate for durable fabrics.
- **Permanent Press cycle:** Synthetic fibers (polyester, nylon, rayon, acetate), blended fabrics, dress shirts, khakis, anything that wrinkles easily. Reduced agitation during wash, cool-down rinse before spin -- the cool-down prevents heat-set wrinkles.
- **Delicate/Gentle cycle:** Silk, wool (machine-washable), lace, lingerie, loosely woven fabrics, anything with embellishments. Minimal agitation, slow spin. Use a mesh laundry bag for any item with hooks, underwires, drawstrings, or fragile embroidery.
- **Heavy Duty cycle:** Heavily soiled work clothes, rags, canvas items, thick denim, muddy sports uniforms. Maximum agitation and extended wash time.
- **Quick Wash (15-30 min):** Lightly soiled items only -- worn once, no visible soil, no odor. Do not use quick wash for stained items, heavily soiled loads, or full-capacity loads. Quick wash cycles use 30-40% less water, which reduces cleaning action proportionally.

**Detergent Dosing Rules (Critical -- Most Users Overdose by 2-4x):**

- HE front-loaders: 1-2 tablespoons per load (use the first line on the measuring cap -- that tiny amount feels wrong but is correct). These machines use 13-15 gallons per cycle vs. 40+ gallons for traditional top-loaders.
- HE top-loaders (no agitator): Same as front-loaders -- 1-2 tablespoons. Do not use regular detergent -- the high-suds formula cannot be fully rinsed in a low-water machine and leaves residue that smells sour and attracts mold.
- Traditional top-loaders (with agitator): Follow the cap line -- typically 3-4 tablespoons depending on load size and soil level.
- For hard water: add 25-30% more detergent than the standard dose. Hard water (above 120 ppm mineral content) neutralizes a portion of the surfactant before it reaches the fabric.
- Pre-treating with detergent counts -- if you applied liquid detergent directly to a stain before washing, reduce the dispenser amount by about 1 teaspoon.

### Step 4: Build the Drying Guide

The dryer causes more permanent clothing damage than the washer. Most shrinkage, elastic degradation, and pilling occurs in the dryer, not the wash cycle.

**Dryer Heat Settings:**

- **High heat (135-150°F / 57-65°C):** 100% cotton towels, bed sheets, work socks, heavy cotton sweatshirts. High heat is appropriate for pre-shrunk cotton that you want fully dry and sanitized. Reduces drying time to 45-55 minutes for a standard load.
- **Medium heat (120-130°F / 49-54°C):** Everyday cotton and cotton-blend clothing, jeans, regular t-shirts, children's clothing. The default setting for most household clothing. 40-55 minutes for a standard load.
- **Low heat (100-115°F / 38-46°C):** Permanent press synthetics, polyester blends, anything prone to static or pilling. Takes 50-70 minutes but prevents heat damage to synthetic fibers.
- **Air Fluff/No Heat:** Stuffed animals, pillows for freshening (not sanitizing), items you want to de-wrinkle slightly without heat, dryer-safe items that are almost dry and just need fluffing.

**Items That Must NEVER Enter the Dryer -- No Exceptions:**

- Anything with rubber, latex, or spandex elastic (sports bras, swimwear, compression leggings, elastic waistbands on delicates) -- heat degrades elastic permanently and irreversibly within 2-3 exposures
- Wool, cashmere, and merino wool in any form -- heat + agitation causes felting (the fibers interlock permanently and the item shrinks 25-50% and becomes stiff)
- Silk and rayon -- heat distorts the weave and can cause permanent shine, texture change, or shrinkage
- Items with screen-printed graphics, heat-transfer vinyl, or iron-on patches -- heat causes peeling and cracking (if you must dry, use air fluff only)
- Items with sequins, beading, or delicate embellishments -- plastic-backed sequins melt at medium heat
- Anything labeled "lay flat to dry" -- hanging these items while wet causes the weight of the water to stretch them out of shape; laying flat allows them to dry in correct dimensions
- Running shoes and sneakers with glued soles -- heat can soften the adhesive

**Air Drying Methods:**

- **Lay flat:** Wool, cashmere, structured knits, any garment with stretch that must retain its shape
- **Hang dry (hanger):** Dress shirts, blouses, structured jackets -- hang immediately out of the washer to prevent wrinkle-setting
- **Line dry (clothesline or drying rack):** Jeans, heavy cotton items, activewear -- turn dark items inside-out if line drying in sunlight (UV fading)
- Dry jeans inside-out in a shaded area or indoors to preserve dye

### Step 5: Create the Stain Treatment Protocol

Stain treatment is time-sensitive. The window between stain contact and permanent setting is 10-30 minutes for most protein-based stains (blood, food, sweat) and up to 24 hours for some grease stains if kept moist.

**The Universal Stain Rule:** Never put a stained item in the dryer until you are certain the stain is gone. The dryer heat polymerizes organic stains (proteins, tannins, oils) into the fabric at the molecular level. Once heat-set, most stains are permanent. If uncertain, air dry and inspect under good lighting before drying.

**Stain Classification Framework:**

- **Protein stains** (blood, sweat, egg, dairy, grass, biological fluids): Always treat with cold water first -- hot water cooks protein and sets the stain. Use enzyme-based detergent or a pre-treatment spray that contains protease enzymes. Let sit 10-15 minutes before washing cold.
- **Tannin stains** (coffee, tea, wine, fruit juices, beer): Rinse immediately with cold water. Apply liquid detergent or white vinegar directly. Do not use bar soap -- it sets tannin stains. Wash in the warmest water safe for the fabric.
- **Oil/Grease stains** (cooking oil, salad dressing, motor grease, cosmetics, butter): Absorb fresh oil with cornstarch, baking soda, or talcum powder for 15-30 minutes before any water contact -- water spreads oil stains. Brush off the powder, then apply dish soap (a degreaser) directly to the stain. Rub gently, let sit 10 minutes, wash warm.
- **Dye stains** (ink, berries, mustard, beet, tomato paste): Act within the first 15 minutes for best results. Apply rubbing alcohol (for ink), white vinegar (for berry/beet), or hydrogen peroxide 3% (for tomato and mustard). Work from the back of the stain outward to push the dye out rather than spreading it.
- **Combination stains** (ketchup = tomato + oil + vinegar; chocolate = protein + fat): Address the protein component first (cold water, enzyme treatment), then the oil component (dish soap). Sequence matters.

**Specific Stain Treatments:**

- **Grass:** Undiluted liquid laundry detergent applied directly, rubbed in, 15-minute sit, wash in warm water. The enzyme content breaks down chlorophyll.
- **Blood (fresh):** Cold running water immediately, working from the back of the fabric. Apply hydrogen peroxide 3% -- it will fizz as it oxidizes the hemoglobin. Blot, do not rub. Wash cold.
- **Blood (dried):** Soak in cold water with enzyme detergent for 30-60 minutes. Dried blood requires more dwell time for enzymes to break down the protein matrix.
- **Red wine:** Blot excess liquid. Pour club soda or cold water to dilute. Apply a paste of dish soap + hydrogen peroxide (1:1 ratio) for white or light fabrics. For dark fabrics use dish soap only (hydrogen peroxide may lighten dark dyes). Wash warm.
- **Coffee/tea:** Rinse with cold water. White vinegar applied directly, 5-minute sit, blot. Wash in warm water.
- **Grease/oil:** Cornstarch for 20 minutes. Brush off. Dish soap applied directly, gentle rubbing, 10-minute sit. Wash warm.
- **Ink (ballpoint):** Place item face-down on paper towels. Apply rubbing alcohol to the back of the stain -- the alcohol dissolves the ink and it transfers onto the paper towel. Replace paper towels as they absorb ink. Repeat until no more ink transfers. Apply liquid detergent, wash warm.
- **Mud:** Let dry completely -- do not add water to wet mud. Brush off dried mud. Treat residual stain with liquid detergent, wash warm.
- **Sweat yellowing (armpit stains on white shirts):** Baking soda + hydrogen peroxide + water paste (1:1:1 ratio), applied to the stain for 30-60 minutes. The yellowing is caused by aluminum compounds from antiperspirant reacting with sweat proteins -- the alkaline peroxide combination breaks this compound down. Wash in warmest safe temperature.
- **Crayon:** Scrape off excess wax. Place the stained area between paper towels and press with a warm iron (the heat melts the wax into the paper towel). Apply dish soap to the residual stain. Wash in warm water.

### Step 6: Design the Weekly Schedule

Map loads onto days based on household volume benchmarks and the user's lifestyle constraints (work schedule, school pickups, available time windows).

**Volume Benchmarks (Use These as Starting Points):**

- 1 person: 2-3 loads per week
- 2 people: 3-5 loads per week
- 3-4 people: 5-8 loads per week
- 5-6 people: 8-12 loads per week
- 7+ people: 12-16 loads per week (daily laundry rotation recommended)

**Schedule Design Principles:**

- Assign specific days, not "whenever" -- ambiguity causes pile-up. Even if the user has flexibility, they should choose fixed laundry days and treat them as non-negotiable.
- Anchor laundry days to routine anchors (workout days, trash day, weekend morning routines) -- habit stacking with existing behaviors improves follow-through
- For households doing 5+ loads per week, spread across at least 3 days -- doing all laundry in one marathon session leads to burnout and abandonment of the system
- Build in a buffer load slot -- real households generate irregular laundry (illness, guests, event clothing) -- the schedule should have capacity headroom, not run at 100% planned capacity every week
- Towels and sheets: wash sheets every 7-10 days (every 7 days is optimal for hygiene given skin cell, oil, and dust mite accumulation). Wash bath towels every 3-4 uses (more frequent in humid climates where towels do not dry fully between uses -- damp towels accumulate bacteria rapidly).
- Bed pillows: wash every 3-6 months in a front-load or large-capacity washer (pillow fill determines temperature -- polyester fill: warm; down fill: warm with mild detergent; memory foam: cannot machine wash)

**Time Budgeting:**

- Active laundry time (sorting, loading, transferring, folding, putting away): 12-18 minutes per load
- Machine time is not active time -- laundry should be designed to run in the background during other activities (morning routine, work-from-home day, sleeping on delay-start)
- Folding immediately out of the dryer while warm reduces wrinkles and eliminates the "wrinkled pile" problem -- build a 10-minute fold-immediately habit
- Total weekly active time benchmarks: 2 people = 25-40 minutes; 4 people = 55-90 minutes; 6 people = 90-140 minutes

### Step 7: Build the Care Label Decoding Reference

Care labels use standardized international symbols (ISO 3758). Every output for a household system should include a quick reference for the symbols the user is most likely to encounter and misread.

**Wash Basin Symbols:**

- Basin with number (30, 40, 60): Maximum wash temperature in Celsius. A basin with 30 means cold wash only (86°F). A basin with 60 means hot wash acceptable (140°F).
- Basin with one underline: Gentle cycle (permanent press or delicate)
- Basin with two underlines: Very gentle cycle (delicates only)
- Hand in basin: Hand wash only -- use cool water, minimal agitation, do not wring
- Basin with X through it: Do not wash -- this item must be dry cleaned or spot cleaned only

**Triangle Symbols (Bleach):**

- Plain triangle: Any bleach safe
- Triangle with two diagonal lines: Only oxygen-based (non-chlorine) bleach safe -- chlorine bleach will destroy the fabric or dye
- Triangle with X: Do not bleach under any circumstances

**Square/Circle Symbols (Drying):**

- Circle in square: Tumble dry safe
- Circle in square with dot: Tumble dry, low heat
- Circle in square with two dots: Tumble dry, medium heat
- Circle in square with three dots: Tumble dry, high heat
- Circle in square with X: Do not tumble dry
- Square with horizontal line: Lay flat to dry
- Square with curved line: Drape over line to dry (line dry)

**Iron Symbols:**

- Iron with one dot: Low heat (110°C / 230°F) -- silk, synthetics
- Iron with two dots: Medium heat (150°C / 302°F) -- wool
- Iron with three dots: High heat (200°C / 392°F) -- cotton, linen
- Iron with X: Do not iron
- Iron with lines (steam): Do not steam

### Step 8: Add Household-Specific Optimization Notes

Close the system with practical sustainability improvements tailored to the household's specific profile.

- For HE washer owners: run a monthly washer cleaning cycle (empty drum, hot water, washer cleaning tablet or 2 cups white vinegar + 1/2 cup baking soda added to the drum). Front-loaders in particular accumulate mold in the door gasket -- wipe the gasket dry after every wash cycle and leave the door ajar between uses.
- For dryer efficiency: clean the lint trap before every single load without exception (a clogged lint trap increases drying time by 25-30% and is a fire hazard). Check the exterior dryer vent annually for lint buildup or bird nests. A partially blocked vent duct extends drying time and can cause overheating.
- For color preservation: wash darks and brights inside-out (reduces surface fiber abrasion from agitation), use cold water (hot water accelerates dye release), and add 1/2 cup white vinegar to the rinse cycle (sets dyes slightly and removes detergent residue that dulls color)
- For fabric longevity: the single highest-impact change most households can make is reducing dryer heat and increasing air-dry usage. The tumbling mechanical action plus heat causes more fabric degradation than the wash cycle. That material in the lint trap is literally fibers abraded off of clothing.

---

## Output Format

Deliver the complete system in this structure. Fill every field with actual data -- do not leave placeholder text.

```
## Laundry System

**Household:** [number of people, age groups]
**Estimated Weekly Load Volume:** [number] loads per week
**Washer:** [type and key settings to know] | **Dryer:** [type]
**Schedule Model:** [loads spread across X days per week]

---

### Sorting Architecture
| Bin | What Goes In | Load Frequency |
|-----|-------------|---------------|
| [bin name in caps] | [specific item types] | [how many times per week] |

**Sorting Habits:**
- [household-specific sorting instructions]

---

### Wash Settings Matrix
| Category | Water Temp | Temp (°F) | Cycle | HE Detergent Dose | Special Instructions |
|----------|-----------|-----------|-------|------------------|---------------------|
| [category] | [cold/warm/hot] | [number] | [cycle name] | [tablespoons] | [notes] |

**Detergent Notes for This Washer Type:**
- [specific guidance for their washer]

---

### Drying Guide
| Category | Dryer Setting | Est. Time | Air Dry Method if Applicable |
|----------|--------------|-----------|------------------------------|
| [category] | [heat level or NO DRYER] | [minutes] | [method] |

**Never-Dryer List for This Household:**
- [specific items from their wardrobe/household that should never be dried]

---

### Stain Treatment Quick Reference
| Stain Type | First Response (First 5 min) | Full Treatment | Water Temperature | Warning |
|-----------|------------------------------|----------------|-------------------|---------|
| [stain] | [immediate action] | [full method] | [cold/warm/hot] | [what not to do] |

---

### Weekly Laundry Schedule
| Day | Load(s) | Start Time Suggestion | Active Time | Machine Time |
|-----|---------|----------------------|-------------|-------------|
| [day] | [load name] | [morning/evening/specific time] | [minutes] | [hours] |

**Total Weekly Active Time:** [X-Y minutes]
**Total Weekly Machine Time:** [X-Y hours] (background time, not active)

---

### Care Label Quick Reference
| Symbol | Meaning | What to Do |
|--------|---------|------------|
| [description of symbol] | [what it means] | [action] |

---

### Washer Maintenance Schedule
| Task | Frequency | Method |
|------|-----------|--------|
| [task] | [how often] | [how to do it] |

---

### Household Laundry Rules
(Post this near the laundry area or bins)
1. [specific rule]
2. [specific rule]
[continue as needed]
```

---

## Rules

1. **Never recommend hot water for synthetics, activewear, or any item with elastane/spandex content.** Heat above 105°F (40°C) begins to break down spandex fibers from the first exposure. Over 10-15 wash cycles at high heat, elastic garments lose 30-50% of their stretch recovery. The damage is cumulative and irreversible.

2. **Never put any item in the dryer if the care label says "dry clean only."** The label exists because the fabric or construction cannot survive water immersion combined with heat and mechanical agitation. Some dry-clean-only items can survive a delicate cold hand wash, but machine drying is a separate and additional risk -- do not combine both risks without explicitly flagging this to the user.

3. **Do not recommend fabric softener for towels, activewear/synthetics, or microfiber.** Fabric softener works by coating fibers with a thin layer of lubricating chemicals. On towels, this coating reduces absorbency by 40-50% over time -- towels that smell fine but leave you feeling damp are almost always over-softened. On moisture-wicking synthetics, the coating fills the micro-pores that enable wicking. On microfiber cleaning cloths, it destroys their ability to trap particles. White vinegar in the rinse cycle (1/2 cup) provides softening without coating.

4. **Treat stains before, not after, washing.** Once a stained item goes through a wash cycle without treatment, the washing process distributes the stain chemistry more deeply into the fiber. After drying, it is set. The correct sequence is always: treat -- check -- wash -- air dry to verify -- dryer only when confirmed clean.

5. **Always identify the stain type before treating it.** Applying the wrong treatment can permanently set a stain. The most dangerous error is applying hot water to a protein stain (blood, egg, dairy) -- hot water denatures the protein and bonds it to the fiber. The second most common error is applying water to a fresh grease stain -- water spreads the oil outward, creating a larger stain ring.

6. **Drum fill level for wash effectiveness: 3/4 full, never more than 4/4 full.** Overloading prevents adequate water circulation and mechanical action -- items at the center of an overloaded drum may not contact water at all in an HE low-water machine. Underloading (less than 1/2 drum) wastes water and energy. A full drum with room to move is the target.

7. **HE detergent and traditional detergent are not interchangeable.** HE detergent is low-sudsing formulated for machines that use 13-20 gallons of water. Traditional detergent creates high suds volume that cannot be rinsed out with low water volume -- the residue builds up in the machine, causes musty odors, and can harbor mold inside the drum and dispenser. If the user has an HE machine and is using traditional detergent, this is likely the cause of any odor complaints.

8. **Wash new dark garments (especially denim and dark cotton) separately for the first 2-3 washes.** New dark items -- particularly indigo-dyed denim -- carry excess surface dye that will bleed onto lighter items in the same load. After 2-3 washes, the excess surface dye has rinsed away and the item can be washed with other darks safely.

9. **The dryer lint trap must be cleaned before every load -- not weekly, not when you remember.** A lint trap that is 25% clogged reduces airflow and increases drying time by 15-20 minutes per load. A 50% clogged lint trap is a fire hazard. Lint accumulation in the vent duct (not just the trap) is the leading cause of residential dryer fires -- the vent duct should be inspected and cleared annually.

10. **Cold water washing is appropriate for the majority of a household's laundry volume and is not a hygiene compromise for normally soiled clothing.** The thermal disinfection threshold (killing most pathogens) is 140°F (60°C) sustained for several minutes -- most "hot" wash cycles in residential machines reach 120-130°F and do not hold that temperature long enough to fully disinfect. Genuine disinfection requires hot water + a full wash cycle + a dryer on high heat. For laundry that requires disinfection (illness-related laundry, cloth diapers, heavily contaminated items), specify hot water + long cycle + high-heat dry and note this explicitly.

---

## Edge Cases

### Laundromat Users (No In-Home Washer/Dryer)

Laundromat laundry requires a fundamentally different workflow -- the goal is to maximize parallel processing and minimize trips.

- Pre-sort at home into labeled bags or reusable tote bags -- one bag per load category. Label the bags so sorting at the laundromat is instant.
- Bring pre-measured detergent in small containers (reuse travel-size bottles) rather than carrying a full jug. Bring a pre-treatment spray bottle with a stain treatment solution.
- At the laundromat: claim multiple machines simultaneously. Start all loads within a 2-3 minute window so they finish at roughly the same time. 3 loads running in parallel = 1.5-2 hours total session. 3 loads run sequentially = 4-5 hours total.
- Top-load commercial laundromat machines use more water than residential HE machines -- use 3-4 tablespoons of regular or HE detergent, not the HE dose.
- Front-load commercial laundromat machines are HE -- use HE detergent at 1.5-2 tablespoons per load.
- Bring enough quarters for extra dryer cycles -- commercial dryers at laundromats are often older and less efficient. Budget an extra 10-15 minutes of dryer time per load compared to a residential dryer.
- Session time budget: pre-sort 10 min at home + travel + 30-35 min wash cycle + 45-55 min dry cycle + fold + travel = approximately 1.5-2.5 hours for 3-4 loads if running in parallel.

### Household With Infant or Toddler (Under Age 3)

Infant laundry requires specific chemical and temperature adjustments that differ from general household guidance.

- Use fragrance-free, dye-free detergent for all infant clothing and bedding. Infant skin has a pH of approximately 6.34 (slightly more acidic than adult skin) and a thinner stratum corneum -- fragrance compounds and optical brighteners in regular detergent are a common trigger for contact dermatitis in infants.
- Washing infant clothes separately from adult clothing is not medically necessary unless the infant has diagnosed skin sensitivity or eczema -- it is a choice, not a requirement. If washing with family laundry, ensure the detergent in use is fragrance/dye-free for the entire household during the infant stage.
- Cloth diapers require a specific 3-stage protocol: (1) cold pre-rinse to remove solids (2) hot wash with enzyme-free detergent (enzymes can degrade diaper cover elastics and waterproof layers over time) with an extra rinse cycle to remove all detergent residue (3) high-heat dry or line dry in direct sunlight (UV has natural sanitizing effect on white fabrics). Do not use fabric softener on cloth diapers -- it destroys absorbency.
- Treat formula and breast milk stains with cold water and enzyme detergent immediately -- both are protein stains. Formula stains that have been through the dryer are extremely difficult to remove.
- Increase wash frequency for bedding -- infants sweat significantly during sleep and spitting-up on sleep surfaces is common. Changing and washing crib sheets every 3-4 days rather than weekly is appropriate.

### Athlete or High-Activewear Volume Household

Households with athletes (team sports, runners, cyclists, gym members) generate a category of laundry that requires different chemistry and handling.

- Activewear must be treated as its own sort category. Washing activewear with cotton clothing in a regular warm cycle causes pilling on synthetic fabrics and destroys moisture-wicking properties.
- Wash activewear inside-out on cold, gentle cycle. This reduces pilling on the outer surface (the surface others see) and ensures the inner surface (against skin, where odor bacteria live) gets maximum agitation contact.
- Never use fabric softener on activewear. The softener molecules coat the micro-pores of polyester and nylon mesh that enable moisture transport -- after 5-6 washes with softener, moisture-wicking garments may retain moisture instead of dispersing it.
- If activewear retains odor after washing (a common complaint), the issue is biofilm buildup in the fabric structure -- bacteria have colonized the fiber interstices and are not being reached by the wash cycle. Protocol: soak in 1 cup white vinegar per gallon of cold water for 30 minutes before washing. The acetic acid disrupts the biofilm. Alternatively, use an enzyme-based sports wash detergent specifically formulated to break down the proteins in sweat biofilm.
- Compression garments (compression tights, base layers, compression socks) degrade rapidly with heat. Always air dry. Store folded, not on hangers (hanging distorts the elastane structure).
- Sports bras with underwires: always wash in a mesh laundry bag to prevent the underwire from poking through and damaging other items or the drum.

### Hard Water Areas (Water Hardness Above 150 ppm / 8.5 gpg)

Approximately 85% of US households have hard to very hard water. Hard water contains dissolved calcium and magnesium ions that interfere with detergent function and deposit mineral scale on fabrics.

- Hard water reduces detergent cleaning power because the calcium and magnesium ions react with detergent surfactants before the surfactants reach the fabric -- they are essentially being "used up" on the minerals instead of the soil.
- Symptoms of hard water laundry problems: clothes feel stiff and scratchy even after drying; white fabrics turn gray or yellow over time (mineral deposits); towels lose softness quickly; there is a visible white or chalky residue on dark fabrics after drying; detergent does not lather well even at full dose.
- Correction strategies: (1) increase detergent dose by 25-30% -- this compensates for the detergent deactivated by mineral ions; (2) add 1/2 cup white vinegar to the rinse cycle dispenser -- acetic acid chelates calcium and magnesium ions and helps flush them out; (3) use a water-softening laundry additive (sodium hexametaphosphate or citric acid-based products) added to the wash cycle.
- For permanent hard water correction: a whole-house ion-exchange water softener is the most effective solution. These systems exchange calcium/magnesium ions for sodium ions, producing genuinely soft water throughout the household. Cost range: $500-3,000 installed depending on system capacity and water hardness level. Monthly operating cost: $5-20 in salt pellets.
- Note for households with very hard water who switch to a water softener: initial loads may contain mineral deposits already embedded in fabrics -- run 2-3 wash cycles with a cup of white vinegar added to strip out accumulated mineral scale from existing laundry.

### Shared Laundry Facilities (Apartment Building, Condo)

Shared machines have specific challenges: machines used by many households accumulate other people's detergent residue, pet hair, and lint; availability is unpredictable; machine quality varies.

- Wipe down the drum interior with a damp cloth before loading delicate or light-colored items -- shared machines often have residue from fabric dye, bleach, or heavily scented detergent from previous users.
- Run a short empty hot-water cycle (if the machines allow it without a load and without paying) to flush residue before washing sensitive items like white shirts or baby clothing.
- Schedule laundry during off-peak times: Tuesday-Thursday mornings or late evenings. Weekend mornings in shared buildings are typically the highest-contention periods.
- If using shared machines for items you care about deeply (expensive athletic wear, delicate fabrics), pre-treat and handle those items separately -- consider hand washing in a sink rather than trusting a machine of unknown condition.
- Report consistently underperforming machines to building management with specifics (machine number, observed problem, date) -- a machine that does not heat water or does not fully drain will not clean clothing effectively and the record of complaints creates a paper trail for repair.

### Energy and Cost Optimization

For users with energy cost concerns or environmental priorities, the laundry system can be tuned for significant savings without sacrificing cleaning effectiveness.

- Switching all wash cycles from hot/warm to cold saves approximately 75-90% of the per-cycle energy cost -- heating water accounts for 75-90% of total washer energy consumption. Modern enzyme-based cold-water detergents are specifically formulated to be fully effective at 60-80°F.
- Use the highest spin speed available for every load. Higher spin speed removes more water mechanically before the dryer cycle -- at 1200 RPM spin vs. 800 RPM spin, items enter the dryer approximately 10-15% drier, reducing dryer time by 10-20 minutes per load. Mechanical water removal (spinning) costs pennies in electricity; thermal water removal (dryer heat) is dramatically more expensive.
- Air drying high-volume items (jeans, towels, sheets) even occasionally reduces energy consumption significantly. A full load of towels in a dryer costs $0.30-0.75 per cycle depending on energy rates and dryer type. A drying rack costs nothing to operate.
- Heat pump dryers (condenser dryers) use approximately 40-50% less energy than conventional vented dryers by recycling heat rather than exhausting it. They take longer (70-90 min vs. 45-55 min) but for households running 7+ loads per week, the annual energy savings can be $80-200.
- Delay Start function: run the washer and dryer during off-peak electricity rate hours (typically 9pm-7am in time-of-use rate areas). Some utility rate plans have 30-50% lower rates during off-peak hours. Set the delay start before bed and transfer the wash to the dryer in the morning.

### Removing Specific Damage Conditions

Some users come with a specific damage problem rather than a general system need. These require targeted diagnosis, not a full system build.

- **Clothes have a sour/musty smell even after washing:** The machine itself has mold or mildew buildup, typically in the door gasket (front-loaders) or under the agitator (top-loaders). Clean the gasket with a solution of 1/4 cup white vinegar + 1 tablespoon baking soda on a cloth. Run a hot empty drum cycle with 2 cups white vinegar + 1/2 cup baking soda in the drum (not the dispenser). Leave the door open between washes to allow drying. The garments themselves need to be re-washed in hot water (if fabric-safe) with 1 cup white vinegar added to the rinse cycle.
- **White fabrics have turned gray:** Cause is detergent residue accumulation or hard water mineral deposits. Treatment: run affected items through a wash cycle with 1 cup white vinegar and no detergent to strip residue. Follow with a regular wash cycle. For mineral deposits, use a citric acid-based whitening soak (1 tablespoon citric acid powder per gallon of warm water, 30-60 minute soak) before washing.
- **Dark fabrics look faded and dull:** Cause is usually detergent residue on the surface of the fibers (detergent scatters light, reducing apparent color saturation). Wash with 1/2 cup white vinegar in the rinse cycle -- it strips detergent residue and restores the fabric's natural surface. Ensure you are washing inside-out in cold water.
- **Clothes are pilling:** Pilling is caused by fiber breakage and tangling during mechanical agitation. Reduce agitation: switch from normal cycle to permanent press or delicate, reduce spin speed, use mesh laundry bags for items prone to pilling. Pilling cannot be reversed, but progression can be stopped. Existing pills can be removed with a fabric shaver (a battery or electric device with a small cutting head that shears pills flush with the fabric surface).

---

## Example

**Input:** "I've got 4 people -- me, my partner, and our two kids who are 7 and 12. We have a front-load HE washer and a gas dryer. Laundry is always piling up and I never know what temperature to use. The 12-year-old plays soccer. I feel like we're doing laundry wrong."

**Output:**

---

## Laundry System

**Household:** 4 people (2 adults, children ages 7 and 12)
**Estimated Weekly Load Volume:** 6-8 loads per week
**Washer:** Front-load HE (low water volume, requires HE detergent, 1-2 tablespoons per load)
**Dryer:** Gas vented
**Schedule Model:** 6 loads across 3 designated laundry days -- weekends stay laundry-free

---

### Sorting Architecture -- Set Up 5 Bins

| Bin | What Goes In | Approximate Frequency |
|-----|-------------|----------------------|
| LIGHTS | White t-shirts, underwear, light-gray socks, light-colored tops, white kids' uniforms (non-soccer) | 2x per week |
| DARKS | Black, navy, dark gray, dark brown clothing -- jeans, dark t-shirts, dark pants, dark socks | 2x per week |
| COLORS | Bright reds, oranges, yellows, bright blues, medium greens -- anything saturated that could bleed | 1x per week |
| TOWELS + SHEETS | Bath towels, hand towels, washcloths, all bed sheets and pillowcases | 1-2x per week |
| ACTIVEWEAR + DELICATES | Soccer kit (jersey, shorts, socks), all sports clothing from both kids and adults, sports bras, anything labeled "gentle" | 1-2x per week |

**Sorting rules for this household:**
- Place a bin in the kids' bedrooms and the master bedroom -- not just in the laundry room. Dirty clothes travel to bins, not to the floor.
- The 12-year-old sorts their own clothes. Takes 30 seconds per night. The 7-year-old can be guided by color.
- Soccer kit goes directly into the ACTIVEWEAR bin immediately after a game or practice -- stains treated while still fresh, not discovered 3 days later.
- Wash new dark jeans or clothing for the first 2-3 cycles in the DARKS bin only -- new dark fabrics bleed excess dye and will stain lighter items.
- Turn all jeans, dark t-shirts, and dark pants inside-out before putting them in the bin -- reduces surface fading from agitation.

---

### Wash Settings Matrix

| Category | Water Temp | Temp °F | Cycle | HE Detergent Dose | Special Instructions |
|----------|-----------|---------|-------|------------------|---------------------|
| Lights | Warm | 105°F | Normal | 1.5 tbsp (HE line 1) | Add 1/2 cup baking soda for brightness on whites. No bleach on items with any synthetic fiber content. |
| Darks | Cold | 80°F | Normal | 1.5 tbsp (HE line 1) | Wash inside-out. Zip all zippers to prevent snagging. Cold water slows dye release. |
| Colors | Cold | 80°F | Normal | 1.5 tbsp (HE line 1) | Cold water only -- warm or hot causes bright dyes (especially reds) to bleed. Wash new bright items alone for first wash. |
| Towels | Hot | 130°F | Heavy Duty | 2 tbsp (HE line 2) | No fabric softener -- ever. It coats fibers and destroys absorbency. Use 1/2 cup white vinegar in the rinse dispenser instead. |
| Sheets | Warm | 105°F | Normal | 1.5 tbsp (HE line 1) | Wash king-size sheets alone -- they need the full drum to agitate properly. Twin/full sheets can be combined. |
| Activewear / Soccer | Cold | 80°F | Gentle/Delicate | 1 tbsp (half of HE line 1) | Inside-out. Mesh laundry bag for sports bras. NO fabric softener. If soccer kit smells after washing, pre-soak 30 min in 1 cup white vinegar per gallon of cold water before washing. |

**HE Detergent Note:**
Your front-load HE washer uses approximately 13-15 gallons per cycle. Use 1-2 tablespoons per load maximum -- this is correct even though it looks like too little. Overdosing creates suds that the low water volume cannot rinse out, leading to residue buildup in the drum and dispensers that causes the machine to develop a musty smell over time. If your machine has a faint sour odor, overdosing is the likely cause.

---

### Drying Guide

| Category | Dryer Setting | Est. Time | Notes / Air Dry Instructions |
|----------|--------------|-----------|------------------------------|
| Lights | Medium heat | 40-50 min | Remove promptly. Fold while still warm. |
| Darks | Low-Medium heat | 45-55 min | Low heat slows additional fading. Fold immediately -- heat-set wrinkles in dark denim are difficult to remove. |
| Colors | Medium heat | 40-50 min | Remove promptly. |
| Towels | High heat | 50-60 min | Towels benefit from high heat -- full drying prevents mildew between uses. No items to remove from this load. |
| Sheets | Medium heat | 40-55 min | Remove and fold/put back on bed immediately to prevent wrinkle-setting. King sheets: 55+ minutes. |
| Activewear / Soccer | NO DRYER for elastic items | Air dry | **All sports bras, compression shorts, swimwear: hang or lay flat to dry.** Soccer jerseys and shorts: air dry or use air fluff (no heat) only. Heat degrades elastic permanently -- 3-4 dryer cycles at high heat can permanently destroy a sports bra's support. Soccer socks: can go in the dryer on low heat. |

**Never-Dryer List for This Household:**
- All sports bras (both adult and any worn by the 12-year-old for sports)
- Soccer jersey and shorts (any synthetic game-day gear)
- Anything labeled "lay flat to dry"
- Any item with sequins, iron-on graphics, or heat-transfer design
- Any wool or cashmere items

---

### Stain Treatment Quick Reference

| Stain Type | First Response (within 5 min) | Full Treatment Method | Temp | Critical Warning |
|-----------|-------------------------------|----------------------|------|-----------------|
| Grass (soccer) | Apply undiluted liquid laundry detergent directly to stain, rub gently | Let sit 15 min. Wash warm (normal cycle, lights or colors bin depending on uniform color). | Warm | Do NOT pre-treat with hot water -- protein component will set. Treat before putting in the bin. |
| Mud (soccer, playground) | Do nothing yet -- let dry completely | Brush off all dried mud first. Apply liquid detergent to remaining stain, let sit 10 min. Wash warm. | Warm | Do NOT rub wet mud -- it pushes deeper into fibers. The counterintuitive step (letting it dry) is correct. |
| Blood (playground scrapes, cuts) | Cold running water immediately through the back of the fabric | Apply 3% hydrogen peroxide directly -- it will fizz. Blot with cloth, do not rub. Repeat if needed. Wash cold. | COLD ONLY | HOT WATER SETS BLOOD PERMANENTLY. Cold water only, every step. Once dried, soak in cold water + enzyme detergent 30-60 min before washing. |
| Food grease / lunch box spills | Sprinkle baking soda on the stain immediately -- absorbs oil before it spreads. Leave 15-20 min. | Brush off baking soda. Apply dish soap directly to st
