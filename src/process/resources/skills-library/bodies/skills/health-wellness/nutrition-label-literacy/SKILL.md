---
name: nutrition-label-literacy
description: |
  Teaches how to read and interpret food nutrition labels including serving size math, ingredient list interpretation, daily value percentages, and key nutrient identification. Produces a label reading guide that helps users make informed food comparisons without prescribing dietary choices.
  Use when the user asks about reading nutrition labels, understanding serving sizes, comparing food products, interpreting ingredient lists, or understanding daily value percentages on food packaging.
  Do NOT use for clinical dietary management, allergy identification (consult an allergist), macro calculation (use macro-calculation), or product recommendations.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "nutrition guide analysis"
  category: "health-wellness"
  subcategory: "nutrition-diet"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Nutrition Label Literacy

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

## When to Use

**Use this skill when:**
- A user asks how to decode a nutrition facts panel and does not know where to start -- they see numbers but do not know what those numbers mean in practice
- A user wants to compare two or more food products side-by-side (two cereals, two yogurts, two bread loaves) and needs a fair comparison methodology
- A user asks what a specific label element means: serving size, %DV, added sugars, DV footnote, the nutrient list order, or the ingredients section
- A user is trying to monitor a specific nutrient from food labels -- common examples include sodium, saturated fat, added sugars, dietary fiber, or potassium -- and needs a reading strategy for that nutrient
- A user does not understand multi-serving packaging and wants to know their true total intake from a package they plan to eat in full
- A user encounters front-of-package health claims ("reduced fat," "light," "good source of," "excellent source of") and wants to know what those regulated terms actually mean versus marketing language
- A user is reading a label for a food they have never bought before and wants a quick mental checklist to evaluate it without overthinking it
- A user asks about the ingredient list specifically: what the ordering means, how to spot hidden sugars, what certain additives are, or how to interpret ingredient groupings and sub-lists

**Do NOT use when:**
- The user needs clinical dietary targets set for a medical condition such as type 2 diabetes, chronic kidney disease, hypertension, or heart disease -- refer them to a registered dietitian (RD) or physician for individualized guidance
- The user has a known or suspected food allergy and needs to evaluate cross-contamination risk, manufacturing facility warnings, or allergen thresholds -- refer them to a board-certified allergist; the label's allergen statement is only a starting point, not a clinical safety guarantee
- The user wants macronutrient targets calculated for a fitness, body composition, or weight goal -- use the `macro-calculation` skill for that workflow
- The user is asking which product is "better" or "healthier" for their specific health condition -- this skill teaches how to read labels, not how to prescribe dietary choices for medical purposes
- The user needs guidance on reading supplement facts panels (different regulatory framework, different nutrient reference values, different rules for upper tolerable intake levels)
- The user is asking about infant formula labels, which follow separate FDA regulations with distinct nutrient requirements and formats not covered by this skill
- The user needs country-specific label literacy outside the U.S. FDA Nutrition Facts format -- Canadian, EU, Australian, and UK labels use different formats, different reference values, and different regulatory terminologies

---

## Process

### Step 1: Clarify the User's Specific Goal and Starting Point

Before delivering any label guidance, identify the three key variables that shape the entire response:

- **Is the user analyzing a specific label or learning the general skill?** If they have a specific label in front of them (described verbally or as text), use their actual numbers throughout. If they are learning generally, use realistic worked examples.
- **What nutrient or label element is their primary concern?** Sodium, added sugars, saturated fat, fiber, protein, calories, ingredient quality, and serving size math are the most common focal points. The reading strategy differs significantly for each.
- **What is their literacy baseline?** A user who asks "what does %DV mean?" needs foundational scaffolding. A user who says "I see 39% DV sodium per serving but I eat the whole can" already understands the concept and just needs the math confirmed. Calibrate depth accordingly.

If the user has not specified, ask one focused clarifying question: "Are you looking at a specific product right now, or would you like a general guide to how nutrition labels work?"

---

### Step 2: Establish the Serving Size Foundation -- This Governs Everything

Serving size is the single most misunderstood element of nutrition labels. Every number on the label is anchored to this one value. Address it first, always.

- **What a serving size is:** A standardized reference amount defined by the FDA called a Reference Amount Customarily Consumed (RACC). It reflects how much people typically eat of that food in one sitting -- it is a measurement unit, not a portion recommendation.
- **What a serving size is NOT:** It is not how much you should eat. It is not a suggestion. It is not a health claim. It is a calculation anchor.
- **Servings per container:** This is printed directly beneath serving size. A standard 18.8 oz can of condensed tomato soup may list "serving size: 1/2 cup condensed" with "about 2.5 servings per container." This means the entire can contains 2.5x every nutrient listed.
- **The multiplication rule:** If a label says 1 serving = 28g (about 1 oz), and you eat 56g, every single number on that label -- calories, fat, sodium, sugars, everything -- must be doubled.
- **Practical check:** Weigh or measure the actual amount you eat when first learning. Many people discover they eat 2--3 servings of cereal, 2 servings of pasta, or the entire contents of what they assumed was a single-serve package.
- **FDA "dual column" labeling:** Since 2020, the FDA requires certain packages that could reasonably be consumed in one sitting (between 1 and 3 servings) to display a dual-column label showing both "per serving" and "per package" values. If the user sees two columns, explain this format explicitly.
- **Weight vs. volume serving sizes:** Some labels use volume (1 cup, 2 tablespoons) and some use weight (30g, 55g). Weight in grams is more accurate. When comparing two products, converting to per-100g is the most precise normalization method.

---

### Step 3: Walk Through the Calorie Line and Nutrient Sections in Structured Order

Work from the top of the label downward. Each element builds on the one before it.

**Calories:**
- Total calories per serving -- the most prominent number on the panel.
- FDA quick reference for a single food item (not a meal): 40 calories = low, 100 = moderate, 400+ = high. This is not a judgment about the food -- dense foods like nuts have 160+ calories per serving and are nutritionally valuable.
- Calories from fat no longer appears on modern U.S. labels (removed in the 2016 label update). If a user sees it, they are looking at an older product.

**Total Fat and Fat Subcategories:**
- Total fat includes saturated fat, trans fat, polyunsaturated fat, and monounsaturated fat.
- Saturated fat has a %DV (limit: 20g/day on a 2,000-calorie diet, so 1g = 5% DV).
- Trans fat has no %DV because there is no safe threshold -- the goal is as close to 0g as possible. The FDA banned partially hydrogenated oils (the primary source), but 0.5g per serving or less can legally be listed as 0g. Check the ingredient list for "partially hydrogenated" oils to detect this.
- Polyunsaturated and monounsaturated fats have no %DV -- they are listed as informational only.

**Sodium:**
- Daily Value reference: 2,300 mg/day. Every 1% DV = 23 mg of sodium.
- FDA regulatory thresholds: "sodium free" = less than 5 mg/serving; "very low sodium" = 35 mg or less/serving; "low sodium" = 140 mg or less/serving; "reduced sodium" = at least 25% less than the regular version.
- Canned and processed foods are the dominant sodium sources in most diets -- a single can of broth, soup, or beans can contain 700--900 mg per serving.

**Total Carbohydrates, Dietary Fiber, Total Sugars, and Added Sugars:**
- Total carbohydrates includes everything: fiber, starches, total sugars.
- Dietary fiber: Daily Value is 28g/day. Less than 3g per serving is low fiber; 3g = "good source" (10%+ DV); 5g+ = "excellent source" (20%+ DV). Soluble vs. insoluble fiber is not required on the label but may appear voluntarily.
- Total sugars includes both naturally occurring sugars (lactose in dairy, fructose in whole fruit) and added sugars.
- Added sugars: Daily Value is 50g/day (based on 2,000-calorie reference). Added sugars have been required on U.S. labels since 2020. A product can have high total sugars but low added sugars (e.g., plain yogurt with 12g total sugars, 0g added sugars -- all lactose) or high added sugars (flavored yogurt with 25g total sugars, 17g added sugars).
- Sugar alcohols (sorbitol, xylitol, erythritol, maltitol): may appear voluntarily. They have fewer calories per gram than sugar (1.5--3 calories/gram vs. 4 for sugar) but can cause gastrointestinal distress in some individuals at high doses. They are not required to be listed as added sugars.

**Protein:**
- No %DV is required for protein on standard labels (it is required only on foods marketed for infants and children under 4, or when a protein content claim is made).
- Compare protein density across products by calculating grams of protein per 100 calories: divide protein grams by calories and multiply by 100.

**Vitamins and Minerals:**
- The 2016 FDA label update mandated Vitamin D, Calcium, Iron, and Potassium with %DV. Vitamins A and C are now voluntary.
- These are the nutrients of public health concern -- many Americans are consistently under-consuming Vitamin D, Calcium, and Potassium.
- %DV for these should trend toward 20%+ for a food to be considered a "good source."

---

### Step 4: Explain Percent Daily Value (%DV) as a Comparison Tool, Not a Personal Target

%DV is widely misunderstood. Teach it precisely.

- **The reference baseline:** %DV is calculated against nutrient reference values set for a 2,000-calorie/day diet. These are population-level reference amounts, not personalized targets. Someone eating 1,600 calories/day or 2,800 calories/day will have different actual needs.
- **The 5/20 rule:** 5% DV or less per serving is low for that nutrient. 20% DV or more per serving is high. This applies to every nutrient with a %DV. For nutrients you want to limit (saturated fat, sodium, added sugars), aim for low %DV. For nutrients you want to get enough of (fiber, vitamins, minerals), aim for high %DV.
- **%DV as a comparison tool:** The best use of %DV is product-to-product comparison within the same category. When comparing two brands of crackers, you do not need to know your personal sodium target -- if one has 8% DV sodium and the other has 15% DV sodium, the first has roughly half the sodium per serving.
- **The footnote at the bottom:** Labels include a standard footnote explaining that %DV is based on a 2,000-calorie diet. Point this out so users understand it is a population reference, not a personalized prescription.
- **Nutrients without %DV:** Trans fat, total sugars, sugar alcohols, and protein (in most cases) do not have a %DV. This is a regulatory decision, not an oversight. For trans fat, there is no established safe intake. For total sugars, there is no DV because naturally occurring sugars are not a concern. Added sugars do have a %DV (50g/day reference).

---

### Step 5: Decode the Ingredient List with Precision

The ingredient list is a different kind of information than the nutrition facts panel. It tells you what the food is made of, in what relative proportion, and with what additives.

- **The descending weight rule:** Ingredients are listed by weight, from most to least, at the time of manufacture. The first ingredient is the most abundant by weight. If "enriched bleached flour" is first and "whole wheat flour" is sixth, this is not a whole wheat product regardless of what the front of the package says.
- **The first-three heuristic:** The first three ingredients define the character of the food. If any form of sugar is in the first three ingredients, sugar is a primary ingredient.
- **Sugar aliases -- the full list:** High-fructose corn syrup (HFCS), corn syrup, corn syrup solids, cane sugar, cane juice, evaporated cane juice, brown sugar, raw sugar, turbinado sugar, coconut sugar, beet sugar, dextrose, maltose, sucrose, fructose, glucose, lactose (when added), maltodextrin (partially), fruit juice concentrate, apple juice concentrate, grape juice concentrate, honey, agave nectar, agave syrup, maple syrup, molasses, treacle, barley malt syrup, rice syrup, brown rice syrup. A product may list six different sugar aliases to spread them across the ingredient list, making none appear first -- but their combined weight could make sugar the dominant ingredient.
- **Ingredient sub-lists:** When a multi-ingredient component is used (e.g., "cheddar cheese (pasteurized milk, cheese cultures, salt, enzymes)"), the sub-ingredients appear in parentheses. These must be read as part of the whole.
- **The USDA organic seal vs. "natural":** "Organic" on a USDA-certified product means at least 95% of ingredients are organically produced. "Natural" has no FDA-defined meaning for most foods -- it is a marketing term. Neither term changes the nutritional profile of the product. The nutrition facts panel is the only objective reference.
- **Ingredient list length as a proxy:** A shorter ingredient list generally indicates less processing, but this is not absolute. A plain roasted nut has two ingredients (nuts, salt). A minimally processed product can have a complex-looking ingredient list due to added vitamins and minerals in a fortification blend. Teach users to look at the type and order of ingredients, not just the count.
- **Artificial vs. natural flavors:** Both terms describe compounds added to enhance flavor. "Natural flavor" means the flavor compound is derived from a natural source (plant, animal, fermentation). "Artificial flavor" means it is synthesized. Neither term tells you what the flavor is, how much is present, or whether there are any allergen concerns beyond the required allergen statement.

---

### Step 6: Apply Nutrient-Specific Reading Strategies

Once the foundational framework is established, apply it to the user's specific focus nutrient. Each nutrient has its own practical reading strategy:

**Sodium focus:**
- Know the thresholds: under 5% DV (115 mg) = low, 20%+ DV (460 mg) = high per serving.
- Always multiply by actual servings consumed. A bowl of canned soup typically means the whole can (2--2.5 servings), not one serving.
- Check ingredient list for: salt, sea salt, sodium chloride, monosodium glutamate (MSG), sodium benzoate, sodium nitrate/nitrite, sodium bicarbonate (baking soda), disodium inosinate, disodium guanylate, sodium phosphate.
- "No salt added" means no salt was added during processing but the food may still contain naturally occurring sodium.
- "Lightly salted" means at least 50% less sodium than the regular version.

**Added sugars focus:**
- The Added Sugars line is the critical number -- not Total Sugars.
- For a single food item, 5% DV (2.5g) is low; 20% DV (10g) is high. Many flavored yogurts, cereals, and sauces contain 20--50% of the daily added sugar reference in a single serving.
- Check the ingredient list for multiple sugar aliases -- count how many appear, and note their positions.
- Plain versions of products (plain oatmeal, plain yogurt, unsweetened almond milk) will have 0g or near-0g added sugars and can be sweetened at home with measurable amounts.

**Dietary fiber focus:**
- Look for "good source" (3g, 10%+ DV) or "excellent source" (5g+, 20%+ DV) per serving.
- First ingredient should be a whole grain (whole wheat, whole oats, brown rice, quinoa) for grain products -- "enriched" or "bleached" flour in the first position indicates refined grain.
- Psyllium husk, inulin, chicory root fiber, and oat bran are functional fibers sometimes added to boost the fiber count. These are not the same as intact fiber from whole foods, though they do count toward the total.
- Watch for "isolated fiber" additions in products that would not naturally be high-fiber -- fiber-added white bread, for example, uses added fiber to compensate for refined grain.

**Saturated fat focus:**
- Daily Value: 20g/day. Every 1g = 5% DV.
- Sources to check on ingredient list: butter, cream, coconut oil, palm oil, palm kernel oil, lard, tallow, partially hydrogenated oils.
- Compare saturated fat as %DV per serving across similar products (two cheeses, two crackers, two soups).

**Protein density focus:**
- Use the protein-per-calorie formula: (protein grams ÷ calories per serving) × 100. A food scoring 8+ grams of protein per 100 calories is considered protein-dense (e.g., canned tuna, Greek yogurt, egg whites, legumes).
- High-calorie protein sources like peanut butter score lower on this ratio even though the absolute grams of protein look reasonable.

---

### Step 7: Construct the Output (Comparison Table or Reading Guide)

Based on what the user needs, build one of the following outputs:

**For general label literacy:** Produce the full Label Reading Framework table (top-to-bottom guide) plus Key Takeaways tailored to any focus nutrient they mentioned.

**For two-product comparison:** Normalize both products to the same serving size before building the comparison table. The standard normalization units are: per 100g (most universal), per 1 cup, or per 1 oz (28g). Show the normalization math. Build a comparison table for every nutrient relevant to their goal, not every nutrient on the label.

**For single-label analysis with a specific product:** Use their actual label numbers. Calculate what they will actually consume based on realistic serving size (ask if unclear). Flag the two or three most relevant findings based on their stated goal.

**For ingredient list questions:** Walk through the ingredient list from their specific product. Identify the first-three pattern, count and name any sugar aliases present, note any sodium sources beyond salt, and explain what the sub-ingredient parenthetical groupings mean.

---

### Step 8: Deliver Key Takeaways and Flag Any Edge Cases

Close every response with 3--5 specific, actionable takeaways derived from the actual analysis -- not generic statements. For example:

- NOT: "Check the serving size." (generic)
- YES: "This package has 2.5 servings. If you drink the whole bottle, you are consuming 325 calories and 78g of total sugars -- not the 130 calories and 31g listed on the label."

Always include a note when the user's question approaches clinical territory (managing sodium for hypertension, managing sugars for pre-diabetes, managing potassium for kidney disease). Note that label reading is useful, but specific daily targets for medical management should come from their healthcare provider.

---

## Output Format

```
## Nutrition Label Guide: [Focus / Product / Comparison Context]

> Label data is based on the information provided. All analysis reflects the serving size
> stated on the label. Adjust all values proportionally if your actual intake differs.

---

### Section 1: Serving Size Reference

| Field                  | Value                         | What It Means                              |
|------------------------|-------------------------------|--------------------------------------------|
| Serving size           | [amount in household measure] | All label numbers are based on this amount |
| Serving size (grams)   | [Xg]                          | Use grams for precise comparison           |
| Servings per container | [X]                           | Multiply all values by this for full package |
| If you eat [Y amount]  | [scaling factor]              | All nutrients × [scaling factor]           |

---

### Section 2: Calorie and Macronutrient Summary

| Nutrient            | Per Serving  | %DV per Serving | Per Package (full) | %DV per Package |
|---------------------|--------------|-----------------|--------------------|-----------------|
| Calories            | [X]          | --              | [X]                | --              |
| Total fat           | [Xg]         | [X%]            | [Xg]               | [X%]            |
| Saturated fat       | [Xg]         | [X%]            | [Xg]               | [X%]            |
| Trans fat           | [Xg]         | no DV           | [Xg]               | no DV           |
| Sodium              | [Xmg]        | [X%]            | [Xmg]              | [X%]            |
| Total carbohydrates | [Xg]         | [X%]            | [Xg]               | [X%]            |
| Dietary fiber       | [Xg]         | [X%]            | [Xg]               | [X%]            |
| Total sugars        | [Xg]         | no DV           | [Xg]               | no DV           |
| Added sugars        | [Xg]         | [X%]            | [Xg]               | [X%]            |
| Protein             | [Xg]         | see note        | [Xg]               | --              |

---

### Section 3: [Focus Nutrient] Analysis

**Nutrient in focus:** [Sodium / Added Sugars / Saturated Fat / Fiber / Other]
**%DV framework:** 5% DV or less = low | 20% DV or more = high (based on 2,000-calorie reference diet)

| Assessment Point           | Result                                       |
|----------------------------|----------------------------------------------|
| Per-serving %DV            | [X%] -- [low / moderate / high]              |
| Full-package total         | [Xmg or g] ([X% DV] if full package consumed)|
| Label regulatory threshold | [e.g., "Low sodium" = ≤140 mg/serving]       |
| Ingredient list sources    | [Named sources found in ingredient list]     |
| Notable pattern            | [e.g., "3 sugar aliases in top 5 ingredients"]|

---

### Section 4: Ingredient List Breakdown (if applicable)

**First three ingredients:** [ingredient 1], [ingredient 2], [ingredient 3]
**Pattern identified:** [e.g., "Refined grain first -- not a whole-grain product despite packaging"]

| Position  | Ingredient                | Note                                         |
|-----------|---------------------------|----------------------------------------------|
| 1         | [ingredient]              | [Most abundant by weight]                    |
| 2         | [ingredient]              | [Observation]                                |
| 3         | [ingredient]              | [Observation]                                |
| [X]       | [ingredient]              | [Sugar alias / sodium source / additive note]|

---

### Section 5: Product Comparison (if applicable)

*Both products normalized to [100g / 1 cup / 1 oz] for fair comparison.*

| Nutrient          | [Product A] per [unit] | [Product B] per [unit] | Difference        |
|-------------------|------------------------|------------------------|-------------------|
| Calories          | [X]                    | [X]                    | [+/- X]           |
| [Focus nutrient]  | [Xg/mg] ([X% DV])     | [Xg/mg] ([X% DV])     | [X% more/less]    |
| Dietary fiber     | [Xg]                   | [Xg]                   | [observation]     |
| Added sugars      | [Xg]                   | [Xg]                   | [observation]     |
| Protein density   | [X g per 100 cal]      | [X g per 100 cal]      | [observation]     |

*Normalization math: [Product A serving Xg → multiply all nutrients by (100 ÷ Xg)]*

---

### Key Takeaways

1. [Specific, quantified finding from this analysis -- not generic advice]
2. [Specific, quantified finding from this analysis]
3. [Action the user can take based on this specific label]
4. [Any regulatory term clarification relevant to this product]
5. [Referral note if the analysis touches clinical territory]
```

---

## Rules

1. **Never deliver a number without its context.** A raw "890 mg of sodium" is meaningless to most users. Always pair it with its %DV, its per-package total, and a plain-language interpretation ("nearly 39% of the daily reference amount in one serving -- or 77% if you eat the full can").

2. **Normalize before comparing.** If two products have different serving sizes, you cannot compare them directly. Always convert to per-100g before building a comparison table. Show the math explicitly: if Product A is 30g/serving and Product B is 45g/serving, state: "Product A values × 3.33, Product B values × 2.22 to reach per-100g."

3. **Distinguish added sugars from total sugars every time this comes up.** These are fundamentally different line items with different health implications. Never conflate them. A plain yogurt with 12g total sugars (all lactose) is categorically different from a flavored yogurt with 12g total sugars (8g of which are added sugars).

4. **Trans fat 0g on the label does not mean trans fat free.** Explain to users that FDA rounding rules allow products with up to 0.49g of trans fat per serving to list 0g. The only way to verify is to check the ingredient list for "partially hydrogenated" oils. If the ingredient list contains any partially hydrogenated oil, trans fat is present regardless of what the label states.

5. **Never use value-judgment language about foods.** Do not say "this is unhealthy," "this is a bad food," "this ingredient is toxic," or "you should avoid this." Present the factual data from the label, explain what it means in context, and let the user apply their own goals and healthcare guidance. The role is analytical, not prescriptive.

6. **%DV is a comparison tool, not a personal target.** Every time %DV is discussed, note that it is based on a 2,000-calorie/day reference diet. Users with different caloric needs, medical conditions, or activity levels will have different actual requirements. This is a flagging rule, not a reason to avoid using %DV -- it remains the most useful quick-comparison metric on the label.

7. **The ingredient list is ordered by weight at time of manufacture -- this matters for water-containing foods.** Ingredients like water, broth, and milk appear early in many ingredient lists because they are heavy, even if they are not nutritionally dominant. Explain this when relevant. A soup whose first ingredient is "water" is not primarily water in terms of caloric contribution -- the water evaporates or is consumed without caloric impact.

8. **Front-of-package claims require regulatory context.** When a user asks about a label claim, always distinguish between FDA-regulated terms (low sodium, reduced fat, good source of, excellent source of, calorie free, light) and unregulated marketing language (natural, wholesome, artisan, premium, superfood, clean). Regulated terms have specific, legally defined nutrient thresholds. Unregulated terms are marketing language with no enforceable definition.

9. **Sugar aliases are deliberately obscured -- address this proactively.** When a user is focused on added sugars, always scan the ingredient list for the full range of sugar aliases (at least 20+ exist). A product can appear to have no added sugars dominating its ingredient list while actually containing six different sugar compounds spread across positions 4 through 15. Name the specific aliases present in the product under discussion.

10. **Flag multi-serving packages that masquerade as single-serve.** This is one of the most consequential label misreads in practice. Beverages (20 oz sodas, bottled teas, energy drinks), snack bags, and soups are the most common offenders. When a user describes consuming a whole package without measuring, always calculate and present the full-package totals, not just the per-serving values. State clearly: "If you consume the entire [product], your actual intake is [calculated totals]."

---

## Edge Cases

### Multi-Serving Packages Consumed as a Single Serving
This is the most common and consequential label misread. A 20 oz bottle of iced tea may list "serving size: 8 fl oz" and "2.5 servings per container." At 34g of added sugars per serving, consuming the full bottle delivers 85g of added sugars -- 170% of the daily reference value. The per-serving number (34g, 68% DV) is alarming enough on its own, but the full-package reality is far more striking. When this pattern appears, always calculate and present both values in the output. The FDA now requires "dual-column" labeling for packages between 1 and 3 servings that could reasonably be consumed in one sitting -- if the user describes a product in this range, note that a compliant label should already show the per-package column.

### Two Products with Different Serving Sizes
Direct comparison of label values across different serving sizes produces false conclusions. If whole wheat bread A has a 43g serving (2 slices) and whole wheat bread B has a 28g serving (1 thinner slice), bread A will appear to have more of every nutrient simply because the reference amount is larger. Normalize both to per-100g by dividing each nutrient value by its serving size in grams and multiplying by 100. Example: Bread A has 6g fiber per 43g serving → 6 ÷ 43 × 100 = 14g fiber per 100g. Bread B has 4g fiber per 28g serving → 4 ÷ 28 × 100 = 14.3g fiber per 100g. After normalization, they are nearly identical in fiber density -- a conclusion the raw label numbers would completely obscure. Always show this math in the output.

### Front-of-Package Claims That Seem to Contradict the Nutrition Facts Panel
A user may see "reduced fat" on a product and assume it is a nutritionally superior option. The FDA defines "reduced fat" as at least 25% less fat than the regular version -- but the reduced-fat version may still contain 30% DV saturated fat per serving, and manufacturers frequently compensate for fat reduction by adding more sugar or sodium to restore palatability. When a user asks about a front-of-package claim, always cross-reference it against the actual nutrition facts panel data. Provide the regulatory definition of the claim term, then show what the nutrition facts panel actually says, and let the user draw their own conclusion. Do not imply the product is better or worse overall -- just provide the full picture.

### Ingredient List Shows a Food Marketed as "Whole Grain" But Whole Grain Is Not the First Ingredient
This is a widespread issue in the bread, cracker, cereal, and pasta categories. A product can legally use the "made with whole grain" claim if it contains any amount of whole grain -- even if whole grain is the sixth ingredient and enriched refined flour is the first. The gold standard is that the first ingredient should be a whole grain (whole wheat flour, whole oats, whole rye, brown rice, quinoa). If "enriched flour," "wheat flour" (without "whole" preceding it), or "bleached flour" appears first, it is a refined grain product regardless of any whole grain claims. When this pattern appears, explain the regulatory gap between the marketing claim and the ingredient list reality without condemning the product -- just clarify what the ingredient list actually shows.

### User Is Managing a Nutrient for an Apparent Medical Condition
A user may say "I need to reduce my sodium because my doctor told me my blood pressure is high" or "I was told my A1C is elevated so I am watching my carbs." These are valid label-reading contexts that this skill can address -- monitoring sodium or added sugars from a food label is a legitimate and useful skill regardless of whether a medical condition is present. However, the specific daily target (e.g., "my doctor told me to stay under 1,500 mg sodium") should come from their healthcare provider. Provide the label-reading methodology (how to identify, calculate, and compare sodium from labels) while explicitly noting that the 2,300 mg/day DV reference on the label is a population reference, and that their individual target has been set by their doctor for their specific situation. Do not attempt to validate or contradict their doctor's instructions.

### Sugar Alcohols and Novel Sweeteners Listed on the Label
Sugar alcohols (erythritol, xylitol, sorbitol, maltitol, mannitol, lactitol, isomalt, hydrogenated starch hydrolysates) are partially absorbed and contribute fewer calories per gram than sugar (1.5--3 calories/gram vs. 4 for sucrose). They are not counted as added sugars. They are voluntarily listed on the label when present and may have a sub-line under Total Sugars. Some users confuse them with regular sugars; others are concerned about gastrointestinal effects (especially sorbitol and maltitol, which have the strongest laxative effect at high doses -- typically above 10--15g in a single sitting). Novel high-intensity sweeteners (stevia, monk fruit, allulose) appear in the ingredient list but have negligible caloric contribution. Allulose is unique: it must be listed as a carbohydrate but the FDA permits manufacturers to exclude allulose calories from the calorie count and exclude it from total and added sugars. If a user is confused by why a product's sugar count seems inconsistent with its ingredient list, check for these compounds.

### Label for a Product Marketed Primarily to Children
Children's nutritional needs differ substantially from adult needs and do not scale linearly with the 2,000-calorie adult reference. The %DV on all food labels -- including products marketed to children -- is based on adult reference values. A 4-year-old child eating a food with 15% DV sodium per serving is not consuming 15% of their sodium needs -- their daily sodium limit is approximately 1,200--1,500 mg (compared to the 2,300 mg adult reference), so the same serving could represent a much higher proportion of their appropriate daily intake. When users are reading labels for children, note this limitation explicitly and recommend discussing appropriate nutrient targets for their child's age with their pediatrician.

### User Has Conflicting Information From Multiple Label Claims
A user may present a product where the "light" claim conflicts with what they see on the label, or where "no sugar added" appears on a product that still has 15g of total sugars per serving. Explain the regulatory definitions precisely: "Light" means either 1/3 fewer calories or 50% less fat than the reference food. "No sugar added" means no sugar or sugar-containing ingredient was added during processing, but the product may still contain naturally occurring sugars from fruit, dairy, or other ingredients. "Unsweetened" means no sweeteners of any kind were added. "Sugar free" means less than 0.5g of sugar per serving. Walk through each claim with its specific regulatory definition, then show how the nutrition facts panel either confirms or contextualizes that claim.

---

## Example

**Input:** "I am trying to cut back on added sugars. Can you help me compare two granola bars? Bar A has a serving size of 42g (1 bar). Bar B has a serving size of 47g (1 bar). Here are the numbers -- Bar A: 190 calories, 7g total fat, 1g saturated fat, 0g trans fat, 115mg sodium (5% DV), 28g total carbohydrates, 3g dietary fiber (11% DV), 12g total sugars, 10g added sugars (20% DV), 4g protein. Bar B: 220 calories, 9g total fat, 1.5g saturated fat, 0g trans fat, 95mg sodium (4% DV), 30g total carbohydrates, 2g dietary fiber (7% DV), 15g total sugars, 6g added sugars (12% DV), 5g protein. Ingredient list for Bar A starts with: rolled oats, brown rice syrup, cane sugar, canola oil, honey... Ingredient list for Bar B starts with: whole grain oats, almonds, chicory root fiber, tapioca syrup, honey..."

**Output:**

## Nutrition Label Guide: Granola Bar Comparison -- Added Sugars Focus

> Label data is based on the information provided. Bar A: 42g/bar. Bar B: 47g/bar.
> Because the serving sizes differ, all values are normalized to per-100g for accurate comparison.

---

### Section 1: Serving Size Reference and Normalization

| Field                  | Bar A               | Bar B               | Normalization              |
|------------------------|---------------------|---------------------|----------------------------|
| Serving size           | 42g (1 bar)         | 47g (1 bar)         | Convert both to per-100g   |
| Normalization factor   | 100 ÷ 42 = 2.381   | 100 ÷ 47 = 2.128   | Multiply each nutrient by this factor |
| Servings per container | 1 (1 bar = 1 serving)| 1 (1 bar = 1 serving)| No full-package issue here |

*If you eat one full bar of either product, you consume 100% of the listed per-serving values. No multiplication needed for actual consumption -- the normalization is only for comparison.*

---

### Section 2: Calorie and Macronutrient Summary -- Per 1 Bar (as-consumed)

| Nutrient            | Bar A (42g, 1 bar) | Bar B (47g, 1 bar) |
|---------------------|--------------------|--------------------|
| Calories            | 190                | 220                |
| Total fat           | 7g (9% DV)         | 9g (12% DV)        |
| Saturated fat       | 1g (5% DV)         | 1.5g (8% DV)       |
| Trans fat           | 0g                 | 0g                 |
| Sodium              | 115mg (5% DV)      | 95mg (4% DV)       |
| Total carbohydrates | 28g (10% DV)       | 30g (11% DV)       |
| Dietary fiber       | 3g (11% DV)        | 2g (7% DV)         |
| Total sugars        | 12g (no DV)        | 15g (no DV)        |
| **Added sugars**    | **10g (20% DV)**   | **6g (12% DV)**    |
| Protein             | 4g                 | 5g                 |

---

### Section 3: Added Sugars Analysis -- Normalized to Per-100g

*Because Bar B is 12% heavier per serving, direct comparison of per-serving values overstates Bar B's added sugar. Per-100g normalization corrects for this.*

| Nutrient         | Bar A (per 100g) | Bar B (per 100g) | Interpretation                            |
|------------------|------------------|------------------|-------------------------------------------|
| Calories         | 452              | 468              | Nearly identical caloric density          |
| Added sugars     | **23.8g**        | **12.8g**        | Bar A has 86% more added sugar per gram of food |
| Total sugars     | 28.6g            | 31.9g            | Bar B higher in total -- but more naturally occurring sugars (see below) |
| Dietary fiber    | 7.1g             | 4.3g             | Bar A higher in fiber at equal weight     |
| Protein          | 9.5g             | 10.6g            | Bar B slightly more protein-dense         |

*Normalization math: Bar A -- divide each value by 42, multiply by 100. Bar B -- divide each value by 47, multiply by 100.*

**The key finding:** Bar B has 15g total sugars per bar vs. Bar A's 12g, which looks worse at first glance. But Bar A has 10g of added sugars (20% DV) versus Bar B's 6g (12% DV). Bar B's higher total sugar count likely reflects naturally occurring sugars from almonds and any fruit-based ingredients -- not added sugar. This is exactly the distinction the added sugars line was designed to reveal.

---

### Section 4: Ingredient List Analysis -- Added Sugar Focus

**Bar A -- First five ingredients:** Rolled oats, brown rice syrup, cane sugar, canola oil, honey

| Position | Ingredient        | Classification         | Observation                                     |
|----------|-------------------|------------------------|-------------------------------------------------|
| 1        | Rolled oats       | Whole grain            | Good -- grain base is intact whole grain        |
| 2        | Brown rice syrup  | **Sugar alias**        | High-glycemic added sugar, position 2 = abundant|
| 3        | Cane sugar        | **Added sugar**        | Second sugar source in top 3                    |
| 4        | Canola oil        | Fat source             | Neutral                                         |
| 5        | Honey             | **Sugar alias**        | Third sugar source in top 5                     |

**Pattern:** Three distinct added sugar sources appear in the first five ingredients of Bar A. Brown rice syrup (position 2), cane sugar (position 3), and honey (position 5) are all added sugars. By spreading them across multiple positions, no single sugar is the "dominant" ingredient -- but their combined contribution makes added sugar the most abundant ingredient class after oats. This is exactly the multi-alias pattern to watch for.

---

**Bar B -- First five ingredients:** Whole grain oats, almonds, chicory root fiber, tapioca syrup, honey

| Position | Ingredient         | Classification              | Observation                                      |
|----------|--------------------|-----------------------------|--------------------------------------------------|
| 1        | Whole grain oats   | Whole grain                 | First ingredient is intact whole grain -- strong |
| 2        | Almonds            | Nuts (protein, healthy fat) | Contributes to higher protein and fat content    |
| 3        | Chicory root fiber | Functional added fiber      | Inulin-type prebiotic fiber -- adds to fiber count but is added, not intact |
| 4        | Tapioca syrup      | **Sugar alias**             | Added sugar source                               |
| 5        | Honey              | **Sugar alias**             | Second added sugar source                        |

**Pattern:** Bar B has two added sugar aliases in the top five ingredients (tapioca syrup at position 4, honey at position 5) versus Bar A's three in the same window. The earlier positions are occupied by a whole grain, a nut, and a fiber source -- a structurally different profile. Note: chicory root fiber (inulin) is a functional fiber added to boost the fiber count. It is a legitimate fiber source but not the same as intact grain fiber. Bar B's 2g dietary fiber per bar includes some of this added fiber.

---

### Section 5: %DV Framework Applied to This Comparison

**The 5/20 rule applied:**

| Nutrient         | Bar A %DV (per bar) | Assessment          | Bar B %DV (per bar) | Assessment          |
|------------------|---------------------|---------------------|---------------------|---------------------|
| Saturated fat    | 5%                  | Low                 | 8%                  | Low-moderate        |
| Sodium           | 5%                  | Low                 | 4%                  | Low                 |
| Dietary fiber    | 11%                 | Moderate-good       | 7%                  | Moderate            |
| **Added sugars** | **20%**             | **High**            | **12%**             | **Moderate**        |

The 5%/20% DV thresholds make the comparison stark for added sugars: Bar A hits the "high" threshold at exactly 20% DV per bar. Bar B at 12% is in the moderate range. Both values are based on the 50g/day added sugars reference in a 2,000-calorie diet.

---

### Key Takeaways

1. **Bar A has 86% more added sugar per gram of food than Bar B**, despite appearing to have fewer total sugars per bar (12g vs. 15g). This is the difference between the added sugars line and the total sugars line in action -- always use the added sugars line when this is your focus nutrient.

2. **Bar A uses a classic multi-alias sugar pattern:** Brown rice syrup (position 2), cane sugar (position 3), and honey (position 5) all appear in the first five ingredients. Together they are likely the second most abundant ingredient class in the bar, behind oats. If they were listed as a single ingredient, "sugar" would almost certainly be in position 2.

3. **Bar B's higher total sugar count is partly explained by almonds** (position 2) and any naturally occurring sugars from other ingredients -- these do not appear in the added sugars line. Bar B's ingredient structure leads with a whole grain and a nut before any added sugar appears.

4. **The serving size difference (42g vs. 47g) matters.** Per-bar comparison favors Bar A on added sugars (10g vs. 6g), which is the right way to evaluate what you actually consume eating one bar. The per-100g normalization reveals that the gap is even larger on a gram-for-gram basis.

5. **If added sugars are your primary label focus**, Bar B is the lower-added-sugar option at 6g per bar (12% DV). Bar A at 10g per bar (20% DV) meets the threshold for "high" for a single food item. Your specific daily added sugar target should be guided by your healthcare provider, particularly if you are managing this for a medical reason -- but this skill gives you the comparison framework to evaluate any two products using the same method.
