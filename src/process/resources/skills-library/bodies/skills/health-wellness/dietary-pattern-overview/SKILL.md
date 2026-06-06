---
name: dietary-pattern-overview
description: |
  Provides educational overviews of major dietary patterns including Mediterranean, plant-based, low-carb, DASH, paleo, and whole-food approaches. Explains the core principles, typical food composition, research-supported benefits, and practical considerations of each pattern without prescribing any specific diet for the user.
  Use when the user asks about different diets, what a Mediterranean or keto diet involves, comparing dietary approaches, or understanding the principles behind a specific dietary pattern.
  Do NOT use for personalized diet prescriptions, clinical dietary therapy, eating disorder guidance, or macro calculations (use macro-calculation).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "nutrition planning research"
  category: "health-wellness"
  subcategory: "nutrition-diet"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Dietary Pattern Overview

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

---

## When to Use

**Use this skill when:**
- The user asks what a specific named dietary pattern involves -- Mediterranean, ketogenic, DASH, paleo, plant-based, whole-food, flexitarian, carnivore, low-FODMAP, Okinawan, Nordic, or similar
- The user wants a side-by-side comparison of two or more dietary approaches to understand their differences before making a choice
- The user asks about the philosophical or scientific rationale behind a dietary pattern ("Why does keto work?" or "What is the logic behind paleo?")
- The user wants to understand what specific foods are emphasized, limited, or entirely excluded within a dietary framework
- The user asks about research-supported outcomes associated with a particular dietary pattern (cardiovascular markers, metabolic health, weight trends, longevity associations)
- The user wants to understand how two dietary patterns might be combined or overlaid (e.g., Mediterranean-style low-carb, plant-based whole foods)
- The user needs help understanding the vocabulary of nutrition science -- terms like ketosis, glycemic index, phytonutrients, bioavailability, or net carbs -- in the context of a dietary pattern

**Do NOT use when:**
- The user wants a personalized diet plan specifying what they personally should eat -- redirect to a registered dietitian (RD) or registered dietitian nutritionist (RDN)
- The user asks you to calculate their specific macros, calories, or nutrient targets -- use the `macro-calculation` skill instead
- The user is managing an active eating disorder (anorexia, bulimia, binge eating disorder, ARFID) -- dietary pattern information can be triggering or harmful; recommend a healthcare provider specializing in eating disorders
- The user needs clinical nutrition therapy for a specific medical condition (renal disease, phenylketonuria, Crohn's disease requiring elemental nutrition, etc.) -- this requires an RD with clinical specialization
- The user asks for a specific meal plan, shopping list, or weekly menu -- use a meal-planning skill or refer to an RD
- The user is asking about therapeutic ketogenic diet for epilepsy management -- this is a clinical protocol supervised by a neurologist and dietitian team, not a consumer dietary pattern
- The user is asking about medically supervised very-low-calorie diets (VLCDs) or protein-sparing modified fasts -- these require clinical supervision

---

## Process

### Step 1: Clarify the Scope of the Request

Before generating any content, identify exactly what the user wants:

- **Single pattern deep dive:** The user wants to understand one dietary pattern thoroughly -- its principles, food composition, research profile, and practical realities
- **Comparison request:** The user wants to compare two or more patterns -- requires a structured comparison table and explicit analysis of where patterns converge and diverge
- **Principled inquiry:** The user wants to understand the metabolic or scientific logic behind a pattern (e.g., why does reducing carbohydrates potentially affect body composition?)
- **Practical application questions:** The user wants to know how a dietary pattern works in real life -- cost, social dining, meal prep difficulty, traveling while following it
- **Research inquiry:** The user wants to know what the evidence actually says about a pattern -- quality and size of studies, what outcomes have been studied, what remains uncertain

If the user's request is ambiguous, ask one targeted clarifying question rather than asking multiple questions at once. Typical clarifying questions:
- "Are you looking for a deep overview of one pattern, or a comparison between specific patterns?"
- "Is there a particular aspect you're most curious about -- the food list, the research evidence, or the day-to-day practicality?"

### Step 2: Identify Which Dietary Pattern(s) to Profile

Recognize the major dietary patterns and their variants:

**Carbohydrate-spectrum patterns (organized from highest to lowest carb intake):**
- High-carb whole food (Okinawan traditional, ornish-style): >60% calories from carbohydrates, predominantly plant-derived
- Mediterranean: 40-50% carbohydrates from whole food sources
- DASH: 50-55% carbohydrates, emphasis on low sodium
- Flexitarian: Primarily plant-based with occasional animal products, variable macros
- Paleo: 20-35% carbohydrates, excludes grains and legumes
- Low-carb (non-ketogenic): 50-130g carbohydrates per day
- Ketogenic: <50g total carbohydrates per day (typically 20-30g net carbs to maintain ketosis)
- Carnivore / zero-carb: Near 0g carbohydrates

**Food-philosophy patterns (defined by inclusion/exclusion rules rather than macros):**
- Whole-food plant-based (WFPB): No animal products, no refined foods
- Vegetarian (lacto-ovo): Excludes meat and fish; includes dairy and eggs
- Vegan: Excludes all animal-derived products
- Raw food: Uncooked plant foods, sometimes includes raw animal products
- Paleo: Excludes grains, legumes, dairy, and processed foods
- Carnivore: Exclusively animal products

**Condition-associated patterns (originally designed for health management):**
- DASH: Originally designed for hypertension management
- Low-FODMAP: Designed for irritable bowel syndrome symptom management
- Gluten-free: Required for celiac disease; used electively by others
- Anti-inflammatory diets: Mediterranean-adjacent with additional emphasis on specific phytonutrient-rich foods

If the user names a diet not listed here (e.g., a branded program), identify its closest evidence-based analog and note the relationship.

### Step 3: Construct the Dietary Pattern Profile

For each pattern, build the profile across six dimensions:

**Dimension 1 -- Core Organizing Principle**
Identify the single metabolic, philosophical, or historical logic that defines the pattern. This is the "why" behind the food rules.
- Mediterranean: Food culture optimization -- the eating patterns of populations with historically low rates of chronic disease
- Ketogenic: Metabolic substrate shift -- reducing carbohydrates to <50g/day forces hepatic ketogenesis, producing beta-hydroxybutyrate, acetoacetate, and acetone as alternative fuel substrates
- DASH: Nutrient composition targeting -- specifically engineered to deliver high potassium, magnesium, calcium, and fiber while reducing sodium below 2,300mg/day (or 1,500mg/day for stricter DASH)
- Paleo: Evolutionary mismatch hypothesis -- the premise that modern metabolic dysfunction stems from consuming foods (grains, legumes, processed foods, dairy) that postdate the human evolutionary adaptation period
- Whole-food plant-based: Phytonutrient density + fiber optimization -- maximizing micronutrients, antioxidants, and prebiotic fiber while eliminating saturated fat from animal sources and industrial processing
- Plant-based (flexitarian): Reduction principle -- directional shift toward plants without absolute exclusion rules

**Dimension 2 -- Macro Distribution**
Use specific percentage ranges and gram-based targets where relevant:
- Always express both percentage of total calories AND absolute gram ranges where meaningful (especially for carbohydrates, where absolute grams determine metabolic state)
- Note that protein is typically expressed as g/kg body weight in clinical research (0.8g/kg is the RDA minimum; 1.2-2.0g/kg is relevant for active individuals)
- Distinguish between total carbohydrates and net carbohydrates (total carbs minus dietary fiber) -- this distinction is critical for ketogenic and low-carb patterns

**Dimension 3 -- Food Framework**
Organize foods into:
- **Foundational foods** (eat freely, form the base of the pattern)
- **Moderate foods** (consume in measured portions or limited frequency)
- **Restricted foods** (occasional or strictly limited)
- **Excluded foods** (pattern definition requires avoidance)

Be specific with food examples rather than food categories alone. "Fish" is less useful than "fatty fish (salmon, mackerel, sardines, herring) 2-4x/week; white fish (cod, halibut) as desired."

**Dimension 4 -- Research Profile**
Distinguish between levels of evidence:
- **Large, long-term randomized controlled trials (RCTs):** Highest evidence -- PREDIMED trial (Mediterranean), ACCORD trial (low-fat), DIRECT trial (Mediterranean vs. low-fat vs. low-carb)
- **Prospective cohort studies:** Large population observations over time -- strong for associations, cannot prove causation (Nurses' Health Study, EPIC, Blue Zones research)
- **Short-term RCTs (under 12 months):** Useful for mechanistic insights, metabolic marker changes
- **Mechanistic and animal studies:** Hypothesis-generating only

Use language calibrated to evidence quality:
- "Multiple large RCTs have consistently demonstrated..." (strong)
- "Prospective cohort data suggest an association between..." (moderate)
- "Preliminary research and mechanistic studies suggest..." (weak/early)
- "Research on this pattern is limited to small short-term studies..." (insufficient)

**Dimension 5 -- Practical Realities**
Assess across five factors with specific, honest ratings:
- **Cost:** Low (<$50/week per person for most meals), Moderate ($50-100/week), High (>$100/week)
- **Meal prep complexity:** Low (minimal cooking required), Moderate (regular cooking from whole ingredients), High (requires significant planning, label reading, or specialized ingredients)
- **Social dining compatibility:** Easy (pattern fits most restaurant menus), Moderate (requires some menu navigation), Challenging (requires significant communication with hosts/restaurants, or avoidance of social eating situations)
- **Travel compatibility:** Easy, Moderate, Challenging
- **Long-term adherence data:** Reference actual study dropout rates and adherence data where available -- ketogenic diets show dropout rates of 30-50% at 12 months in most RCTs; Mediterranean shows 70-80%+ retention at 12 months in major trials

**Dimension 6 -- Nutrient Considerations and Common Gaps**
Every dietary pattern has predictable nutritional vulnerabilities:
- **Ketogenic:** Risk of inadequate fiber (most individuals get 10-15g/day vs. 25-38g recommended), electrolyte depletion (sodium, potassium, magnesium) during adaptation, reduced micronutrient diversity
- **Vegan/WFPB:** Risk of vitamin B12 deficiency (supplementation universally required), vitamin D, long-chain omega-3s (EPA/DHA), heme iron (non-heme iron has lower bioavailability -- ~2-20% vs. heme iron at 15-35%), zinc, iodine, calcium
- **Carnivore:** Risk of fiber absence, vitamin C deficiency, folate deficiency, and highly elevated saturated fat intake
- **Paleo:** Calcium and iodine may be low without dairy and iodized salt
- **DASH:** Generally nutritionally complete; attention to adequate protein for older adults

### Step 4: Apply the Comparison Framework (When Multiple Patterns Requested)

When comparing two or more patterns, structure the comparison along these axes:

**Metabolic axis:** Where does the pattern sit on the insulin-glucose spectrum? Does it rely primarily on glucose oxidation, mixed substrate utilization, or preferential fat oxidation (ketosis)?

**Restriction axis:** How many food groups are excluded? Score from 0 (no exclusions) to 5 (extreme restriction). Mediterranean = 1 (limits processed foods); Carnivore = 5 (excludes all plant foods).

**Evidence axis:** How robust is the research base? Use the evidence pyramid logic above.

**Sustainability axis:** What do long-term adherence studies show? What are the primary barriers to adherence?

**Convergence analysis:** Always identify what the patterns have in common -- this is educationally powerful. Nearly all evidence-based patterns share: emphasis on minimally processed whole foods, reduction of refined sugar and added sugars, reduction of ultra-processed foods, and adequate protein.

### Step 5: Address Common Mechanistic Questions

Users often ask "why does [pattern] work?" Provide mechanistic depth:

**On ketosis:** When net carbohydrate intake drops below approximately 20-50g/day, hepatic glycogen depletes within 24-48 hours. The liver increases fatty acid oxidation and produces ketone bodies (primarily beta-hydroxybutyrate). The brain, which normally uses glucose exclusively, adapts to use beta-hydroxybutyrate as a fuel substrate after 2-4 weeks of adaptation. This metabolic shift alters appetite signaling (reduced ghrelin secretion is one proposed mechanism), reduces insulin secretion and circulating insulin levels, and shifts energy metabolism toward fat oxidation.

**On Mediterranean pattern benefits:** The Mediterranean pattern delivers high quantities of polyphenols (oleocanthal in extra-virgin olive oil has been studied for anti-inflammatory effects), omega-3 fatty acids from fatty fish (EPA and DHA, which modulate inflammatory eicosanoid production), high dietary fiber from legumes and whole grains (supporting microbiome diversity and SCFA production), and moderate amounts of resveratrol from wine. No single component explains the pattern's associations -- it is the totality of the food matrix that researchers believe drives outcomes.

**On DASH mechanisms:** The DASH pattern delivers approximately 4,700mg/day of potassium (nearly double typical American intake), which modulates sodium-potassium ATPase pump activity and reduces vascular smooth muscle tension. High magnesium intake supports endothelial function. The sodium restriction target of 1,500-2,300mg/day (vs. an average US intake of ~3,400mg/day) reduces renin-angiotensin-aldosterone system activation.

**On plant-based mechanisms:** High dietary fiber (35-60g/day in whole-food plant-based patterns vs. the US average of ~15g/day) feeds colonic microbiota that produce short-chain fatty acids (butyrate, propionate, acetate), which influence gut barrier integrity, systemic inflammation, and insulin sensitivity. High phytonutrient density provides polyphenols, carotenoids, and flavonoids with antioxidant and anti-inflammatory signaling properties.

### Step 6: Frame the Educational Context

Always close with clear framing that prevents the information from being misapplied:

- No dietary pattern is universally optimal. The DIRECT trial (2008) directly compared Mediterranean, low-fat, and low-carb diets in 322 adults over 2 years. All three groups lost weight and improved metabolic markers. The pattern that worked best for any individual was strongly predicted by adherence -- not theoretical superiority of the pattern itself.
- Individual variation is real and large. Studies consistently show that individuals vary dramatically in glycemic response to identical foods (the CGM research from Weizmann Institute, 2015, showed that two people eating identical meals could have opposite glycemic responses). Gut microbiome composition, genetics, activity level, stress, and sleep all modulate how an individual responds to a dietary pattern.
- The most consistent finding in nutrition science: reducing ultra-processed food intake, regardless of the specific dietary pattern followed, is associated with better health outcomes. Ultra-processed foods (NOVA classification Group 4) now account for approximately 57-60% of calories in the average American diet.

### Step 7: Deliver and Format the Output

Structure the output according to the Output Format below. When comparing patterns, lead with individual profiles, then build the comparison table. Always close with the Important Notes section.

---

## Output Format

Use this template for single pattern overviews. Adapt the comparison section for multi-pattern requests.

```
## Dietary Pattern: [Pattern Name]

**Core organizing principle:** [One to two sentences explaining the metabolic or philosophical
logic that defines the pattern]

**Origin / Background:** [Brief context -- was this derived from population research,
evolutionary hypothesis, clinical research, or cultural tradition?]

---

### Macro Distribution

| Macro           | % of Total Calories | Typical Daily Grams*    | Primary Sources                            |
|-----------------|---------------------|-------------------------|--------------------------------------------|
| Carbohydrates   | [X-X%]              | [X-Xg]                  | [Specific whole food sources]              |
| Fat             | [X-X%]              | [X-Xg]                  | [Specific fat sources]                     |
| Protein         | [X-X%]              | [X-Xg / X-Xg per kg BW] | [Specific protein sources]                 |

*Based on a 2,000 kcal reference intake. Individual targets vary by body size and activity level.

---

### Food Framework

| Category              | Foundational (Eat Freely)                    | Moderate (Measured Portions)         | Restricted/Excluded                        |
|-----------------------|----------------------------------------------|--------------------------------------|--------------------------------------------|
| Vegetables            | [Specific examples]                          | [Specific examples]                  | [Specific examples]                        |
| Fruits                | [Specific examples]                          | [Specific examples]                  | [Specific examples]                        |
| Proteins              | [Specific examples]                          | [Specific examples]                  | [Specific examples]                        |
| Fats & Oils           | [Specific examples]                          | [Specific examples]                  | [Specific examples]                        |
| Grains & Starches     | [Specific examples]                          | [Specific examples]                  | [Specific examples]                        |
| Dairy & Alternatives  | [Specific examples]                          | [Specific examples]                  | [Specific examples]                        |
| Legumes               | [Specific examples]                          | [Specific examples]                  | [Specific examples]                        |
| Beverages             | [Specific examples]                          | [Specific examples]                  | [Specific examples]                        |

---

### Research Profile

| Evidence Level                    | Key Findings                                                              | Study Examples / Context                      |
|-----------------------------------|---------------------------------------------------------------------------|-----------------------------------------------|
| Large RCTs                        | [Specific findings]                                                       | [Trial names or descriptors]                  |
| Prospective cohort data           | [Associated outcomes]                                                     | [Study population / timeframe context]        |
| Short-term mechanistic studies    | [Metabolic marker changes]                                                | [Duration, populations studied]               |
| Areas of scientific uncertainty   | [What is not yet resolved]                                                | [Active research questions]                   |

---

### Practical Assessment

| Factor                     | Rating       | Detail                                                                 |
|----------------------------|--------------|------------------------------------------------------------------------|
| Cost (per person/week)     | [$/rating]   | [What drives cost; how to reduce if applicable]                        |
| Meal prep complexity       | [Level]      | [What skills / equipment / time are required]                          |
| Social dining ease         | [Level]      | [Restaurant navigation; communicating needs to hosts]                  |
| Travel compatibility       | [Level]      | [Ease of maintaining pattern while traveling]                          |
| Long-term adherence        | [Level + %]  | [What research shows about long-term dropout and adherence]            |
| Athletic performance       | [Level]      | [Compatibility with different training modalities]                     |

---

### Predictable Nutrient Gaps

| Nutrient                  | Risk Level   | Reason                                            | Monitoring / Mitigation                          |
|---------------------------|--------------|---------------------------------------------------|--------------------------------------------------|
| [Nutrient name]           | [High/Mod/Low]| [Why this pattern may under-deliver this nutrient]| [Dietary strategies or monitoring note]          |

---

### Important Notes

- This is educational information about the [Pattern Name] dietary pattern -- it is not a
  recommendation that you follow it
- Individual responses to dietary patterns vary significantly based on genetics, gut microbiome,
  activity level, stress, sleep, and medical history
- [Pattern-specific note about any medical conditions that warrant particular caution or
  consultation before adopting this pattern]
- A registered dietitian (RD/RDN) can assess whether this pattern aligns with your specific
  health profile and goals
```

### Comparison Output Addition (When Multiple Patterns Requested)

After individual profiles, add:

```
## Pattern Comparison: [Pattern A] vs. [Pattern B] [vs. Pattern C]

### At a Glance

| Factor                      | [Pattern A]        | [Pattern B]        | [Pattern C if applicable] |
|-----------------------------|--------------------|--------------------|---------------------------|
| Carb intake                 |                    |                    |                           |
| Fat intake                  |                    |                    |                           |
| Protein intake              |                    |                    |                           |
| Food group exclusions       |                    |                    |                           |
| Restriction level (0-5)     |                    |                    |                           |
| Evidence base strength      |                    |                    |                           |
| Typical long-term adherence |                    |                    |                           |
| Cost (per person/week)      |                    |                    |                           |
| Social dining ease          |                    |                    |                           |
| Key nutritional gap         |                    |                    |                           |

### Where These Patterns Converge

[What do both/all patterns agree on? Typically: minimally processed foods, vegetable emphasis,
reduction of refined sugar, adequate protein]

### Where These Patterns Diverge

[The fundamental philosophical, metabolic, or practical differences -- not just lists,
but explanation of WHY they diverge]

### Decision Factors

The following factors most strongly predict which of these patterns might be a better fit
for any given individual -- note these are conversation starters for an RD, not a prescription:

- **Carbohydrate tolerance:** [How does the individual respond to carbohydrate-rich foods?
  High fasting glucose or insulin resistance may make lower-carb approaches worth exploring
  with a healthcare provider]
- **Food preferences and cultural background:** [Strong food preferences predict adherence
  better than theoretical benefits]
- **Social and lifestyle context:** [Frequent travel, business dining, or limited cooking
  time meaningfully affects which patterns are sustainable]
- **Medical context:** [Conditions that may make one pattern more or less appropriate --
  always note that this requires professional guidance]
```

---

## Rules

1. **Never prescribe -- always describe.** The entire skill is educational framing. Never use language like "you should eat" or "you need to follow." Use "the pattern emphasizes," "research has associated," "individuals who follow this pattern typically."

2. **Evidence language must match evidence quality.** Use "multiple large RCTs consistently demonstrate" only when that is true. Use "preliminary research suggests" for mechanistic or short-term studies. Never upgrade weak evidence to sound more conclusive.

3. **Macro ranges must be specific and sourced to the pattern's actual research.** Do not use made-up ranges. Ketogenic carbohydrate intake is specifically <50g total or <20-30g net carbs -- not "very low." DASH sodium target is 1,500-2,300mg/day -- state the number.

4. **Never declare any dietary pattern "best" or imply that others are invalid.** Even patterns with weaker evidence bases (carnivore, raw food) should be described accurately with honest assessment of evidence quality. Dismissing patterns the user is interested in damages trust and is not your role.

5. **Nutrient gap warnings must be specific and actionable.** "Vegan diets may lack some nutrients" is useless. "Vitamin B12 is found exclusively in animal products and is universally recommended as a supplement for those following strict vegan diets; deficiency develops over months to years and can cause irreversible neurological damage if uncaught" is the appropriate level of specificity.

6. **When a user mentions a medical condition, do not provide condition-specific dietary guidance -- but do not be unhelpfully vague either.** It is appropriate to say "DASH was specifically developed for hypertension management and has the most research in that context; your cardiologist or a registered dietitian can help assess whether it fits your situation." It is not appropriate to say "Mediterranean diet cures hypertension."

7. **Never recommend specific branded foods, supplements, or products within any pattern description.** Generic food descriptions (extra-virgin olive oil, fatty fish, whole oats) are appropriate. "Buy Brand X omega-3 supplement" is not.

8. **Practical ratings must be honest, not aspirational.** Ketogenic diet social dining is genuinely challenging -- saying it is "moderate" to be polite is inaccurate and misleading. Social dining with a carnivore diet at a vegan restaurant is not "easy." Honesty about practical barriers helps users make realistic assessments.

9. **Convergence analysis is mandatory in comparison responses.** Every evidence-based dietary pattern shares common ground with others. Identifying this convergence -- minimizing ultra-processed foods, emphasizing whole food vegetables, adequate protein -- is scientifically accurate and prevents the user from believing that patterns are entirely opposed when they are not.

10. **Do not moralize about dietary choices.** Users asking about carnivore, ketogenic, raw food, or other patterns that may seem extreme deserve the same respectful, accurate, information-dense response as users asking about Mediterranean or DASH. Neutral, expert tone throughout.

11. **When a pattern lacks robust research, say so clearly and explain what that means practically.** Lack of RCT evidence does not mean a pattern is dangerous -- it means the effects are unknown. Be accurate about what we know, what we don't, and what that uncertainty means for decision-making.

12. **Always note that the most replicated finding in nutrition research is that adherence predicts outcomes more reliably than pattern selection.** The DIRECT trial and multiple others demonstrate this. This is the most practically useful piece of information for someone trying to choose a dietary pattern.

---

## Edge Cases

### A User Asks About a Branded or Fad Diet With Limited Research

Examples: Whole30, SlimFast, Atkins Phase 1, cabbage soup diet, military diet, blood type diet.

**How to handle:**
1. Identify the closest evidence-based analog (Whole30 is essentially a stricter version of paleo; Atkins Phase 1 is functionally ketogenic with very aggressive carb restriction at 20g/day).
2. Describe the branded approach accurately -- what it restricts, what it emphasizes, what its stated goals are.
3. Note explicitly the state of the research: "Whole30 has not been studied in peer-reviewed long-term trials; its core principles overlap with paleo, which has been studied in shorter-term RCTs with generally mixed results."
4. Note the red flag if applicable: any diet that promises rapid, extreme results (more than 1-2 lbs/week sustainable loss), eliminates multiple major food groups simultaneously, or requires expensive proprietary products warrants increased skepticism about the marketing vs. the evidence.
5. Do not mock or dismiss -- describe and contextualize.

### A User Wants to Combine Two Patterns (e.g., Plant-Based Ketogenic, Paleo-Mediterranean)

These hybrid approaches are increasingly common and some are nutritionally viable; others create significant planning challenges.

**Common combinations and their viability:**
- **Plant-based ketogenic (vegan keto):** Viable but requires careful planning. Fat sources become heavily reliant on avocados, coconuts, nuts, seeds, and olive oil. Protein must come exclusively from tofu, tempeh, seitan (but seitan is wheat gluten, which some keto followers limit), edamame, and protein-rich plant foods. B12 supplementation is required. Net carbs must remain below 20-30g, which limits even legumes. Practical difficulty: High.
- **Mediterranean low-carb:** Highly viable and studied. The DIRECT trial's low-carb arm was essentially a Mediterranean-influenced low-carb approach. Fish, olive oil, vegetables, and nuts form the foundation; grains and legumes are reduced but not necessarily eliminated. This is one of the more sustainable hybrid approaches.
- **DASH + plant-based:** Highly compatible. DASH already emphasizes plant foods and low-fat dairy; replacing dairy with fortified plant alternatives and removing lean meat is a natural overlap. Requires B12 supplementation if fully vegan.
- **Paleo + carnivore elements:** The carnivore pattern is the extreme end of the paleo spectrum. Combining them simply means a more meat-heavy paleo pattern. Not nutritionally concerning in the short term; long-term effects on gut microbiome diversity (reduced by fiber absence) are an area of active research.

For any combination, identify: (a) what constraints overlap and reinforce each other, (b) what constraints conflict and how the conflict can be resolved, (c) what the heightened nutritional gap risks are when combining restrictions, and (d) whether the combination is complex enough to warrant RD guidance (answer is usually yes for strict hybrid approaches).

### A User Has a Medical Condition That Motivates the Question

A user may say "I have Type 2 diabetes -- I heard low-carb is good for me" or "I have high blood pressure and want to know about DASH."

**How to handle:**
1. Do not avoid the topic entirely -- that is unhelpfully evasive.
2. Provide the general educational overview of the dietary pattern they asked about.
3. Acknowledge that the condition they mentioned is relevant context: "DASH was specifically developed and researched in the context of blood pressure management and has the most robust evidence base for that application."
4. Be explicit about the limits: "The specific application of any dietary pattern to your blood pressure management -- including whether DASH is appropriate given your medications, kidney function, and other factors -- is a clinical decision that requires an RD and your prescribing physician."
5. Particularly flag: dietary patterns that interact with medications require medical supervision. Low-carb diets significantly affect insulin requirements in people with diabetes. DASH and low-sodium approaches affect diuretic dosing. These are not footnotes -- they are safety-relevant points.

### A User Asks About Intermittent Fasting (IF)

Intermittent fasting is a meal timing framework, not a dietary composition pattern. However, it is frequently conflated with dietary patterns and users often ask about it in this context.

**What IF actually is:** A structured approach to the timing of eating windows rather than specification of what is eaten. Common protocols:
- **16:8 (Leangains protocol):** 16-hour fasting window, 8-hour eating window daily
- **5:2 (Fast Diet):** Five days of normal eating, two non-consecutive days restricted to 500-600 kcal
- **OMAD (One Meal a Day):** Extreme 23:1 fasting-to-eating ratio; nutritional adequacy is difficult to achieve
- **Alternate Day Fasting (ADF):** Every other day is a fasting or very low calorie day

**What research shows:** Short-term studies (under 12 months) show that IF produces similar weight loss to continuous caloric restriction when total caloric intake is matched. The theoretical mechanisms (improved insulin sensitivity, cellular autophagy during fasting states, improved metabolic flexibility) are supported by mechanistic studies but large long-term human RCTs are limited.

**Contraindications to note:** IF is generally inappropriate for people with a history of eating disorders, pregnant or breastfeeding individuals, people with type 1 diabetes on insulin, those with a history of hypoglycemia, and underweight individuals. Always note this clearly.

**How to respond:** Explain what IF is, what protocols exist, what the evidence shows, how it can be layered over any dietary pattern, and what the contraindications are. Then redirect to dietary composition patterns if that is what the user actually needs.

### A User Expresses Frustration or Confusion About Conflicting Dietary Science

Users commonly encounter headlines like "Red meat causes cancer!" followed by "Saturated fat is fine again!" and experience genuine confusion and distrust of nutrition science.

**Acknowledge the legitimate problem:** Nutrition science has real methodological challenges. The majority of nutrition research relies on food frequency questionnaires (FFQs) -- self-reported dietary recall over extended periods. FFQ accuracy has been extensively criticized; studies show systematic underreporting of total calories and poor precision on specific food quantities. This is not a minor issue -- it is a fundamental limitation of the field's primary measurement tool.

**Explain the confounding problem:** Population studies cannot randomize people to decades-long dietary patterns. People who eat more vegetables also tend to exercise more, smoke less, sleep more, and have higher socioeconomic status. Separating dietary effects from lifestyle confounders is genuinely difficult. This is why nutrition headlines flip -- individual studies capture associations within specific populations under specific conditions.

**Anchor to the areas of genuine consensus:** Across virtually all dietary patterns supported by research, the following points are broadly agreed upon:
- Minimizing ultra-processed foods (NOVA Group 4) is consistently associated with better health outcomes
- Adequate vegetables and fruits provide micronutrients and fiber with minimal known downside
- Excessive added sugar intake (>25-50g/day depending on guideline) is consistently associated with negative metabolic markers
- Adequate protein intake (minimum 0.8g/kg body weight; higher for active individuals and older adults) is universally supported
- Severe restriction of any major food group warrants nutritional monitoring
- Long-term adherence predicts outcomes more reliably than the theoretical superiority of any pattern

**Validate and educate:** Validate the user's frustration -- the conflicting headlines are real, not imagined. Then explain why they exist (methodological limitations, media oversimplification, industry funding of research). Help the user understand how to interpret study types. A single observational study suggesting a correlation is not the same as multiple replicated RCTs demonstrating a mechanism.

### A User Asks Specifically About Performance Nutrition in the Context of a Dietary Pattern

For users asking how dietary patterns interact with athletic training:

- **Aerobic/endurance performance:** Mediterranean, DASH, and whole-food plant-based patterns are compatible with endurance training. Adequate carbohydrate availability supports glycogen replenishment. Ketogenic approaches may maintain steady-state aerobic performance after 4-6 weeks of adaptation but consistently show reduced performance in high-intensity efforts (above approximately 70-80% VO2max) where glucose is the preferred substrate.
- **Strength/power performance:** Protein adequacy is the primary concern across all patterns. 1.6-2.2g protein per kg body weight is the evidence-based range for maximizing muscle protein synthesis with resistance training. This is achievable in all patterns but requires planning in vegan/WFPB approaches. Creatine, which is found in animal products, tends to be lower in vegans/vegetarians -- supplementation may be relevant (direct the user to a sports dietitian for specifics).
- **Weight class sports:** Rapid weight manipulation through very low carbohydrate intake (depleting glycogen and associated water retention -- glycogen binds approximately 3-4g water per gram stored) is common practice but carries health risks in certain populations -- note this requires sports-specific nutrition guidance.

---

## Example

**User Input:** "Can you explain what the Mediterranean diet and the ketogenic diet are? I've heard a lot about both and I'm trying to understand how they compare -- what they actually involve, what the science says, and how practical each is."

---

**Output:**

## Dietary Pattern Comparison: Mediterranean vs. Ketogenic

> **Educational Note:** The following is general information about two well-studied dietary patterns. It is not a recommendation that you adopt either approach. Individual responses to dietary patterns vary significantly, and a registered dietitian can help assess which approach, if either, aligns with your specific health profile and goals.

---

## Dietary Pattern: Mediterranean

**Core organizing principle:** Reflect the traditional eating patterns of populations living around the Mediterranean Sea (particularly Crete, southern Italy, and Greece in the 1960s), which were associated with low rates of cardiovascular disease despite moderate-to-high fat intake. The pattern is defined by food culture rather than strict macronutrient rules -- olive oil as the primary fat, abundant plant foods, regular fish, modest animal protein, and minimal processed foods.

**Origin:** Derived from epidemiological observations by Ancel Keys and colleagues in the Seven Countries Study (1958-1970), formalized into dietary guidelines by researcher Antonia Trichopoulou, and operationalized for clinical research most prominently in the PREDIMED trial (Spain, 2003-2013).

---

### Macro Distribution

| Macro           | % of Total Calories | Typical Daily Grams*    | Primary Sources                                              |
|-----------------|---------------------|-------------------------|--------------------------------------------------------------|
| Carbohydrates   | 40-50%              | 200-250g                | Whole grains (farro, barley, bulgur), legumes, vegetables, fruits |
| Fat             | 35-40%              | 78-89g                  | Extra-virgin olive oil (primary), nuts, fatty fish, small amounts of full-fat dairy |
| Protein         | 15-20%              | 75-100g / ~1.0-1.2g/kg  | Fish (especially fatty fish), legumes, poultry, eggs, small amounts of red meat |

*Based on a 2,000 kcal reference intake. Individual needs vary.

---

### Food Framework

| Category              | Foundational (Eat Freely)                              | Moderate (Measured Portions)                    | Restricted/Excluded                               |
|-----------------------|--------------------------------------------------------|-------------------------------------------------|---------------------------------------------------|
| Vegetables            | All non-starchy vegetables; tomatoes, leafy greens, eggplant, zucchini, artichokes | Starchy vegetables (potatoes, sweet potatoes) -- 1-2 servings/day | Fried vegetables in refined oils                  |
| Fruits                | Berries, citrus, stone fruits, figs, grapes            | Dried fruits (concentrated sugar); fruit juice  | Added-sugar fruit products                        |
| Proteins              | Fatty fish (salmon, sardines, mackerel, anchovies) 2-4x/week; legumes daily | Poultry (3-4x/week), eggs (4-7/week)            | Red meat (limited to a few servings/month); processed meats (minimized) |
| Fats & Oils           | Extra-virgin olive oil as primary cooking fat (3-4 tbsp/day in research protocols) | Nuts and seeds (30g/day); olives               | Butter, margarine, refined vegetable oils as primary fats |
| Grains & Starches     | Whole grains: farro, barley, whole wheat, oats, bulgur, whole grain pasta | White bread, white rice (occasional)            | Refined grain products as dietary staples; ultra-processed grain products |
| Dairy                 | Small amounts of aged cheese; Greek-style yogurt        | Full-fat dairy in moderation                    | Low-fat processed dairy products are not emphasized; no strict exclusion |
| Legumes               | Lentils, chickpeas, white beans, fava beans -- daily consumption | Hummus in moderate portions                     | No exclusions                                     |
| Beverages             | Water, herbal tea, coffee (without added sugar)         | Red wine -- 1 glass/day for women, up to 2 for men in research protocols (not a recommendation for non-drinkers to start) | Sugar-sweetened beverages, excessive alcohol      |

---

### Research Profile

| Evidence Level                    | Key Findings                                                                                                     | Study Context                                                              |
|-----------------------------------|------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| Large RCTs                        | PREDIMED trial: Mediterranean diet supplemented with extra-virgin olive oil or nuts reduced major cardiovascular events by ~30% vs. low-fat control in high-risk adults over ~5 years | 7,447 adults, Spain, published NEJM 2013 (revised 2018 after randomization correction); remains largest Mediterranean diet RCT |
| Large RCTs                        | DIRECT trial: Mediterranean diet produced comparable or superior weight loss and metabolic improvements vs. low-fat diet over 2 years | 322 moderately obese adults; demonstrated adherence advantage of Mediterranean over low-fat |
| Prospective cohort data           | Higher adherence to Mediterranean pattern associated with reduced all-cause mortality, reduced incidence of cardiovascular disease, Type 2 diabetes, and certain cancers in multiple large cohorts | EPIC study (>500,000 Europeans), Nurses' Health Study, Health Professionals Follow-Up Study |
| Short-term mechanistic studies    | Improvements in LDL oxidation, HDL function, blood pressure, fasting glucose, inflammatory markers (CRP, IL-6) in multiple short-term RCTs | 3-6 month intervention studies; consistent direction of effect across diverse populations |
| Areas of scientific uncertainty   | Relative contribution of individual components (olive oil vs. fish vs. fiber vs. polyphenols) cannot be fully disaggregated; optimal olive oil quantity; applicability across different cultural contexts | Active research into Mediterranean pattern adaptation for non-Mediterranean populations |

---

### Practical Assessment

| Factor                     | Rating         | Detail                                                                                                                     |
|----------------------------|----------------|----------------------------------------------------------------------------------------------------------------------------|
| Cost (per person/week)     | Moderate ($60-90) | Extra-virgin olive oil and fatty fish are the primary cost drivers; canned sardines and legumes significantly reduce cost without compromising pattern fidelity |
| Meal prep complexity       | Moderate       | Requires regular cooking from whole ingredients; most dishes are not technically complex; olive oil-based cooking is straightforward; meal prep can be batched |
| Social dining ease         | Easy           | Mediterranean-style foods are widely available in restaurants; the pattern accommodates most menus without requiring significant modification or explanation |
| Travel compatibility       | Easy           | Fish, olive oil, vegetables, and nuts are available in most food environments globally; the pattern is defined by emphasis rather than strict exclusion, making it flexible |
| Long-term adherence        | High (70-80%+ at 12 months in major trials) | Among the highest adherence rates of any studied dietary pattern; food variety, palatability, and social compatibility are cited as key adherence drivers |
| Athletic performance       | Good across most modalities | Adequate carbohydrate supports glycogen stores for training; omega-3s from fish support recovery and anti-inflammatory response; good compatibility with endurance training |

---

### Predictable Nutrient Gaps

| Nutrient       | Risk Level  | Reason                                                               | Monitoring / Mitigation                                           |
|----------------|-------------|----------------------------------------------------------------------|-------------------------------------------------------------------|
| Vitamin B12    | Low-Moderate | If following a plant-forward Mediterranean variant that significantly reduces fish and animal protein | Ensure regular inclusion of fish (2-4x/week covers B12 needs for most people) |
| Iron           | Low         | Lower red meat intake; non-heme iron from legumes has lower bioavailability | Pair legumes with vitamin C-rich foods to enhance non-heme iron absorption; consume adequate legumes |
| Calcium        | Low         | Possible if dairy is minimized | Sardines with bones, leafy greens, and fortified foods offset this |

---

## Dietary Pattern: Ketogenic

**Core organizing principle:** Restrict carbohydrate intake to a level that depletes hepatic glycogen stores (typically <50g total carbs, or 20-30g net carbs per day), triggering the liver to produce ketone bodies (beta-hydroxybutyrate, acetoacetate, acetone) from fatty acid oxidation. In this metabolic state -- nutritional ketosis -- ketone bodies serve as the primary fuel substrate for the brain and most other tissues. The result is a fundamental shift from glucose-based to fat-based energy metabolism.

**Origin:** Developed as a clinical treatment for pediatric drug-resistant epilepsy at Johns Hopkins in the 1920s (the classic ketogenic diet), where it remains a supervised medical protocol. The consumer ketogenic diet emerged from research on low-carbohydrate weight loss approaches by Atkins in the 1970s, refined and popularized from the 1990s onward. The modern ketogenic diet for metabolic health draws on mechanistic research into insulin signaling, adipose tissue metabolism, and appetite regulation.

---

### Macro Distribution

| Macro           | % of Total Calories | Typical Daily Grams*    | Primary Sources                                                    |
|-----------------|---------------------|-------------------------|--------------------------------------------------------------------|
| Carbohydrates   | 5-10%               | 20-50g total (20-30g net) | Non-starchy vegetables only; small amounts of nuts and seeds       |
| Fat             | 65-75%              | 144-167g                | Olive oil, avocados, nuts, seeds, butter/ghee, fatty cuts of meat, full-fat dairy, coconut products |
| Protein         | 20-25%              | 100-125g / ~1.2-1.6g/kg  | Beef, pork, lamb, poultry, fish, eggs, full-fat dairy               |

*Based on a 2,000 kcal reference intake. Note: protein must be moderated on strict ketogenic protocols, as excess protein undergoes gluconeogenesis and can disrupt ketosis. This is a key distinction from high-protein low-carb approaches.

**Net carbohydrate calculation:** Net carbs = Total carbohydrates -- Dietary fiber -- Sugar alcohols (erythritol subtracts fully; maltitol subtracts partially). This calculation is critical to determining whether an individual will maintain nutritional ketosis.

---

### Food Framework

| Category              | Foundational (Eat Freely)                                              | Moderate (Measured Portions)                                    | Restricted/Excluded                                               |
|-----------------------|------------------------------------------------------------------------|-----------------------------------------------------------------|-------------------------------------------------------------------|
| Vegetables            | Leafy greens (spinach, arugula, kale), zucchini, cauliflower, broccoli, asparagus, cucumber, celery, bell peppers | Onions, tomatoes, Brussels sprouts (carbs add up quickly in quantity) | Root vegetables (carrots, potatoes, sweet potatoes, parsnips), corn, peas |
| Fruits                | Avocados (technically a fruit; high fat, low net carb); small amounts of berries (raspberries, blackberries have lowest net carbs at ~5-6g/100g) | Strawberries (moderate); lemon/lime juice in small quantities   | All fruit except avocado and limited berries; dried fruit; fruit juice |
| Proteins              | Beef, lamb, pork (all cuts), chicken (especially thighs), fatty fish (salmon, mackerel, sardines), eggs | White fish (cod, halibut) -- lower fat, fine on keto; shellfish (some have carbs -- mussels, oysters require portioning) | Breaded or battered proteins; processed meats with fillers/sugar |
| Fats & Oils           | Extra-virgin olive oil, avocado oil, butter, ghee, coconut oil, lard, tallow, heavy cream | MCT oil (medium-chain triglycerides -- rapidly converted to ketones, useful in adaptation phase) | Margarine; refined vegetable oils (corn, soybean, canola in large amounts); no inherent exclusion but ketogenic dieters typically minimize these |
| Grains & Starches     | None                                                                    | None                                                            | All grains (wheat, rice, oats, corn, barley, rye); bread, pasta, rice, cereals, oatmeal |
| Dairy                 | Hard cheeses (cheddar, gouda, parmesan -- very low carb), full-fat cream, sour cream, cream cheese | Soft cheeses in measured portions; whole milk (higher carb at ~12g/cup -- typically avoided) | Low-fat and non-fat dairy (higher carb content proportionally); sweetened dairy; yogurt (most varieties too high in carbs) |
| Legumes               | None                                                                    | None                                                            | All legumes (lentils, chickpeas, black beans, kidney beans -- too high in net carbs) |
| Beverages             | Water, sparkling water, black coffee, unsweetened tea, bone broth (electrolytes) | Dry wine (approximately 2-4g carbs per 5oz glass); spirits (0 carbs) | All sugar-sweetened beverages; fruit juice; beer (~13g carbs/12oz); sweetened alcoholic drinks |

---

### Research Profile

| Evidence Level                    | Key Findings                                                                                                                  | Study Context                                                                              |
|-----------------------------------|-------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| Short-to-medium term RCTs         | Ketogenic and very-low-carbohydrate diets consistently produce greater short-term (3-6 month) weight loss than low-fat diets in head-to-head comparisons; this advantage narrows at 12 months and largely disappears at 24 months when adherence is controlled for | Meta-analyses of 20+ RCTs; advantage appears largest in first 6 months; DIRECT trial showed comparable 2-year outcomes |
| Short-term RCTs                   | Significant reductions in fasting triglycerides (often 20-50% reductions in hypertriglyceridemia cases), improved HDL cholesterol, and reduced fasting insulin observed consistently in short-term studies | Multiple RCTs across diverse populations; effect size on triglycerides among the most consistent findings |
| Short-term RCTs                   | LDL cholesterol response is heterogeneous -- some individuals show substantial LDL increases (including LDL-P and ApoB increases in some studies); others show no change or decreases | This heterogeneity is clinically relevant; LDL response appears linked to the type of fat consumed and individual genetic variation (ApoE genotype may predict response) |
| Type 2 diabetes research          | Studies in Type 2 diabetes show significant improvements in HbA1c, fasting glucose, and reduced medication requirements over 6-24 months in some trials | Virta Health 2-year study (n=349) demonstrated maintained T2D remission markers; requires medical supervision due to medication adjustments needed as glucose improves |
| Areas of scientific uncertainty   | Long-term (beyond 2 years) effects on cardiovascular outcomes, renal function, gut microbiome diversity, and bone health are not well established; most RCTs are short-term and small; the optimal protein level to maintain ketosis
