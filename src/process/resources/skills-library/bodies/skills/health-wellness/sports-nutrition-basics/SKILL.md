---
name: sports-nutrition-basics
description: |
  Teaches pre-workout, intra-workout, and post-workout nutrition timing frameworks with carbohydrate and protein targets for active individuals. Covers fueling strategies for endurance, strength, and general fitness training without prescribing specific foods for specific people.
  Use when the user asks about workout nutrition timing, what to eat before or after exercise, sports nutrition fundamentals, or fueling for athletic performance.
  Do NOT use for clinical sports nutrition, eating disorder management, supplement recommendations, or competition-specific nutrition periodization.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "nutrition fitness strategy"
  category: "health-wellness"
  subcategory: "nutrition-diet"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---
# Sports Nutrition Basics

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment, clinical assessment, or individualized prescription. Always consult a qualified healthcare professional -- ideally a registered dietitian with sports nutrition credentials -- before making significant changes to your diet or exercise program. If you have a medical condition, are pregnant, or have a history of disordered eating, do not rely on this skill for guidance.

---

## When to Use

**Use this skill when the user:**
- Asks what to eat before, during, or after workouts and wants a structured framework rather than a one-line answer
- Wants to understand why nutrition timing affects performance and recovery -- not just what to eat but the physiological rationale
- Is a recreational or amateur athlete (gym-goer, weekend runner, recreational cyclist, recreational team sport player) trying to optimize fueling without professional coaching
- Asks about carbohydrate or protein targets relative to training (e.g., "how many carbs do I need before a long run?")
- Wants to understand differences in fueling strategy between strength training, endurance training, and mixed-modality training (HIIT, CrossFit, team sports)
- Asks about hydration strategy for exercise, including electrolyte needs and fluid replacement
- Asks about fasted training and whether it is safe or effective for their goal
- Is struggling with energy during workouts, poor recovery between sessions, or excessive post-workout hunger and wants a nutrition explanation
- Asks general questions about the "anabolic window," glycogen replenishment, or muscle protein synthesis as they relate to exercise

**Do NOT use this skill when:**
- The user is a competitive or elite athlete needing periodized, competition-phase nutrition plans -- refer them to a sports dietitian (use `performance-periodization` if available)
- The user is asking about specific supplement protocols, ergogenic aids, creatine loading, beta-alanine dosing, or caffeine optimization -- this skill does not cover supplementation
- The user has a diagnosed medical condition (diabetes, kidney disease, celiac disease, irritable bowel syndrome) that directly affects exercise nutrition -- defer to their healthcare team
- The user is in active management of or recovery from an eating disorder, or shows signs of disordered eating behavior around exercise -- do not engage with nutrient targets; redirect to professional support
- The user wants standalone macro calculation without exercise context -- use `macro-calculation` skill
- The user is asking about nutrition for sport-specific performance optimization (e.g., race-day carbohydrate loading protocols for marathons, glycogen supercompensation strategies) -- these require individualized coaching beyond this skill's scope
- The user is asking about pediatric or adolescent athlete nutrition -- growth-phase needs require specialized guidance
- The user is pregnant or postpartum and wants exercise nutrition guidance -- medical supervision required

---

## Process

### Step 1: Gather Training Context Before Providing Any Framework

Do not skip to recommendations without understanding the user's training picture. Ask for, or infer from context:

- **Training modality:** Strength/resistance training, endurance (running, cycling, swimming), HIIT, team sports (soccer, basketball), or mixed modality (CrossFit, circuit training)
- **Session duration:** Under 45 minutes, 45-60 minutes, 60-90 minutes, 90+ minutes -- this is a critical threshold for intra-workout nutrition decisions
- **Training intensity:** Moderate (conversation-pace aerobic) vs. high intensity (intervals, heavy lifting, competition pace) -- intensity affects carbohydrate utilization rate
- **Training time of day:** Fasted morning (before any food), fed morning, midday, afternoon, evening -- this determines which windows exist before the session
- **Training frequency:** Days per week and whether any days include two sessions (doubles) -- two-a-day training fundamentally changes recovery nutrition urgency
- **Primary goal:** Performance and strength gain, endurance improvement, body composition change (fat loss with muscle preservation), or general health and energy
- **Current peri-workout habits:** What they are currently eating or not eating around training, and any problems they are noticing (low energy, GI distress, poor recovery, excessive soreness)
- **Body weight (optional but useful):** All carbohydrate and protein targets are expressed per kilogram of body weight. If the user provides weight, give absolute gram targets alongside the per-kilogram ranges.

If the user has provided enough context in their initial message, do not interrogate them with all of these questions -- extract what you can and make reasonable assumptions, stating them explicitly.

---

### Step 2: Explain the Physiological Rationale (Brief, Contextually Relevant)

Before presenting numbers, briefly anchor the framework to what is actually happening physiologically. This prevents the user from misapplying the framework. Select the 2-3 most relevant points for their training type:

**Glycogen:** Muscle glycogen is the primary fuel source for moderate-to-high intensity exercise. It is synthesized from dietary carbohydrates and stored in muscle (approximately 300-600g in a trained individual) and liver (approximately 80-100g). Glycogen depletion -- not fat depletion -- causes performance collapse ("hitting the wall") in endurance exercise and strength decline in later sets of resistance training. Pre-workout carbohydrates top up muscle and liver glycogen; post-workout carbohydrates replenish it.

**Blood glucose:** During exercise lasting over 60 minutes, liver glycogen is progressively depleted to maintain blood glucose. Intra-workout carbohydrate intake spares liver glycogen and maintains central nervous system function, which is why cognitive performance and coordination also decline in hypoglycemic states.

**Muscle protein synthesis (MPS):** Resistance exercise creates a net muscle protein balance that is negative during exercise and in the immediate post-exercise period without nutrition. Dietary protein -- specifically the essential amino acids, and leucine in particular -- triggers MPS. A leucine threshold of approximately 2-3g per meal is required to maximally stimulate MPS; this corresponds to roughly 20-40g of high-quality protein per meal. The MPS stimulus from protein feeding is time-limited: once maximally activated, consuming more protein in the same sitting does not further amplify MPS (the "muscle full" effect). This is why protein distribution across the day matters, not just the post-workout amount.

**Insulin and glycogen synthesis:** Post-exercise, muscle insulin sensitivity is elevated, meaning glucose uptake from the bloodstream into muscle is faster and requires less insulin. This is the physiological basis of the post-workout nutrition window -- carbohydrates consumed in this state are preferentially routed toward glycogen resynthesis. Glycogen resynthesis rate peaks at approximately 5-8 mmol/kg wet weight/hour in the first 30-60 minutes post-exercise with adequate carbohydrate feeding, compared to roughly 2-3 mmol/kg/hour at rest.

**Co-ingestion of protein + carbohydrates post-exercise:** Protein and carbohydrate co-ingestion post-exercise augments MPS beyond either alone in a fasted state, and the insulin response from carbohydrates enhances amino acid transport into muscle. For most recreational athletes, a balanced post-workout meal achieves this synergy naturally.

---

### Step 3: Apply the Three-Window Nutrition Framework

Present the three peri-workout windows with specific targets scaled to the user's training type and duration.

#### Pre-Workout Nutrition Window

**Objective:** Enter exercise with repleted liver and muscle glycogen, adequate circulating amino acids, and no GI discomfort. The pre-workout meal is not magic -- it is simply the final top-up of fuel stores that should already be well-maintained by daily nutrition.

**Timing and meal composition:**

- **3-4 hours before:** Full mixed meal. Carbohydrates 1.5-2.0 g/kg, protein 0.4-0.5 g/kg (approximately 25-35g for most people), fat and fiber in normal amounts. This is the safest timing because the stomach will be empty by exercise time regardless of meal size. Example: rice, chicken, and vegetables; pasta with meat sauce; oatmeal with eggs.

- **1-2 hours before:** Moderate-sized snack or lighter meal. Carbohydrates 0.5-1.0 g/kg, protein 15-25g, low fat and low fiber to reduce GI distress risk. Example: toast with eggs, yogurt and a banana, rice cakes with peanut butter (moderate).

- **30-45 minutes before:** Small, easily digestible carbohydrate snack only. Target 20-30g of fast-digesting carbohydrates, minimal protein, essentially no fat or fiber. Example: a ripe banana, white rice cake, sports gel, dilute sports drink. This is the window where high glycemic index sources are appropriate because rapid gastric emptying is desirable.

- **Under 30 minutes before:** Generally not recommended for solid food. Liquid carbohydrates (dilute sports drink, juice) are tolerated better. The concern is not "insulin spiking" (a myth) but actual gastric emptying time -- solid food consumed 10-15 minutes before exercise will still be in the stomach during the session.

**Carbohydrate type guidance:** Lower glycemic index sources (oats, sweet potato, legumes) are better for the 3-4 hour window because they provide sustained glucose release. Moderate-to-high glycemic index sources (white rice, white bread, ripe bananas, sports drinks) are appropriate for the 30-60 minute window because rapid absorption is the goal.

**Fat and fiber guidance:** Both slow gastric emptying and increase GI distress risk during exercise. The closer to exercise, the lower fat and fiber should be. A meal 3+ hours before can have normal fat content; a meal 60 minutes before should be low fat (under 10-15g) and low fiber (under 5g).

#### Intra-Workout Nutrition Window

The most commonly misapplied window. Most recreational exercisers do not need intra-workout nutrition.

**Sessions under 60 minutes:** Water only for most people. Muscle glycogen stores are sufficient to fuel a well-fed individual through 60 minutes of moderate-to-high intensity exercise without supplemental carbohydrates. The exception is fasted morning training at high intensity, where a small carbohydrate intake at the session start may benefit performance.

**Sessions 60-75 minutes at high intensity:** A small amount of carbohydrates (15-30g) may benefit performance in the final 15-20 minutes of the session. This is primarily relevant for high-intensity sessions (above approximately 75% VO2max or heavy resistance training volume days) rather than moderate-intensity steady-state exercise.

**Sessions 75-90 minutes at moderate-to-high intensity:** 30-60g of carbohydrates per hour, initiated after the first 45-60 minutes. At this duration, liver glycogen begins to become a meaningful limiting factor. Simple sugars (glucose, fructose, maltodextrin) are appropriate.

**Sessions 90+ minutes:** 60-90g of carbohydrates per hour is the evidence-based recommendation. This is a key threshold: consuming above 60g/hour requires gut training because intestinal glucose transporters (SGLT1) become saturated at approximately 60g/hour of glucose alone. The addition of fructose utilizes a separate transporter (GLUT5), which is why glucose:fructose ratios of 2:1 or 1:0.8 allow 90g/hour absorption without GI distress. Athletes new to intra-workout fueling should start at 30g/hour and progressively increase over several weeks. Attempting 90g/hour untrained gastrointestinally causes nausea, bloating, and cramping.

**Intra-workout protein:** Not needed during exercise. Protein oxidation for energy is minimal during exercise (under 5% of energy expenditure during moderate-intensity exercise). Protein consumed during exercise does not meaningfully contribute to MPS during the session -- the exercise itself is the MPS stimulus.

**Electrolyte guidance:** Sodium replacement becomes relevant for sessions exceeding 60 minutes, especially in hot and humid conditions. Sweat sodium concentration varies widely between individuals (300-1800 mg/L), but a practical starting point is 300-700 mg sodium per hour of intense exercise in the heat. Sports drinks with 400-700 mg sodium per liter are appropriate. Hyponatremia (dangerously low blood sodium) from drinking excessive plain water during long events (marathons, triathlons) is a real medical risk -- electrolyte intake prevents this in events over 3 hours.

#### Post-Workout Nutrition Window

**The old "30-minute anabolic window" is physiologically outdated** for individuals eating regular meals. Research by Stuart Phillips, Kevin Tipton, and others established that MPS is elevated for up to 24-48 hours post-resistance exercise, with the highest sensitivity in the first 1-2 hours. For recreational athletes eating multiple meals per day, the post-workout window should be understood as "within 2 hours" for most purposes.

**Exception -- the window does matter:** For athletes training in a fasted state, training twice per day with under 8 hours between sessions, or training very early and who will not eat for 3+ more hours, post-workout nutrition timing becomes more urgent. In these cases, eating within 30-60 minutes post-exercise produces meaningfully better recovery than waiting.

**Protein targets:**
- Minimum effective dose: 20g of leucine-rich protein (achievable with high-quality animal protein, soy, or carefully selected combinations)
- Optimal range: 30-40g for most individuals; 40g shows marginal benefit over 20g for larger individuals (over 80-90 kg) and older adults (over 40 years, who have anabolic resistance and benefit from larger single-meal protein doses)
- Upper effective limit per meal: approximately 40-50g for MPS purposes -- consuming 80g post-workout does not double MPS; the excess is oxidized or stored as fat/glucose

**Carbohydrate targets:**
- Strength/resistance training: 0.5-0.8 g/kg -- moderate carbohydrate needed for glycogen replenishment (resistance training depletes glycogen approximately 30-40% per session)
- Endurance (60-90 min): 0.8-1.2 g/kg -- higher priority, as endurance exercise depletes glycogen more completely
- Endurance (90+ min with significant depletion): 1.0-1.5 g/kg -- prioritize rapid resynthesis, especially if another session occurs within 24 hours
- Very high carbohydrate intake post-workout (1.2 g/kg every 30 minutes for 4-5 hours) is only relevant for glycogen supercompensation scenarios -- not applicable to this skill

**Co-ingestion:** Protein + carbohydrate post-workout is superior to either alone when the previous meal was more than 3-4 hours prior. When the pre-workout meal was recent (1.5-2 hours before a 45-60 minute session), amino acid availability is still elevated and a carbohydrate-containing meal post-workout is sufficient.

---

### Step 4: Differentiate Strategy by Training Type

#### Strength and Resistance Training (30-75 minutes)

Glycogen is used as a fuel source during resistance training, but not as completely as during sustained aerobic exercise. The primary nutritional concern is MPS and recovery, with secondary concern for glycogen replenishment.

- **Pre-workout focus:** Adequate protein (20-30g) and moderate carbohydrates (0.5-1.0 g/kg) 1-2 hours before. Fat and fiber are fine at the 3-hour mark.
- **Intra-workout:** Water only for most sessions. On high-volume days (4+ compound exercises, 5+ sets, total session over 60 minutes), a small intra-workout carbohydrate source (15-30g) may reduce perceived exertion and prevent strength decline in later sets.
- **Post-workout:** 30-40g protein + 0.5-0.8 g/kg carbohydrates within 2 hours.
- **Daily protein:** 1.6-2.2 g/kg/day distributed across 4-5 meals (approximately 25-40g per meal). This is the most important number for strength athletes -- daily totals dominate any timing effect.
- **Daily carbohydrates:** 3-5 g/kg/day for moderate training volume; up to 6 g/kg for very high volume training (5+ sessions per week, competitive powerlifting, bodybuilding-style volume).

#### Endurance Training (60-180+ minutes)

Glycogen is the rate-limiting substrate. Fat oxidation contributes substantially at moderate intensity (below approximately 65% VO2max) but cannot sustain high-intensity effort alone.

- **Pre-workout focus:** Higher carbohydrate intake 2-3 hours before (1.5-2.0 g/kg). Reducing fat and fiber in the final 60-90 minutes is more important here than for strength training, as GI distress during sustained running or cycling is a significant performance problem.
- **Intra-workout:** Mandatory for sessions over 60 minutes. 30-60g/hour for moderate intensity; 60-90g/hour for high intensity using a 2:1 glucose:fructose ratio. Begin fueling before fatigue is perceived -- waiting until "bonking" has already begun is too late.
- **Post-workout:** Glycogen resynthesis is the primary concern. Protein 20-30g + carbohydrates 0.8-1.2 g/kg within 1 hour (tighter window than for strength training, because the next session may be sooner and glycogen depletion is greater).
- **Daily carbohydrates:** 5-7 g/kg/day for moderate endurance training (60-90 min/day); 6-10 g/kg/day for high-volume endurance training (2+ hours/day, multiple days per week). For context, most people eating a general diet consume approximately 3-5 g/kg -- endurance athletes often underestimate their carbohydrate needs.
- **Carbohydrate loading (for events 90+ minutes):** 8-12 g/kg/day for 1-3 days before the event, tapering training simultaneously. This is at the boundary of this skill's scope -- mention it exists but note it requires more detailed planning.

#### HIIT and Mixed Modality (30-60 minutes)

HIIT has one of the highest carbohydrate utilization rates of any training mode because it spends significant time above the lactate threshold where fat oxidation is insufficient.

- **Pre-workout focus:** Carbohydrates are critical here -- going into HIIT with depleted glycogen produces a significant performance drop. Moderate carbohydrates (0.5-1.0 g/kg) 1-2 hours before.
- **Intra-workout:** Water only for sessions under 60 minutes. Sessions extending over 60 minutes (CrossFit, circuit classes) can benefit from 15-30g easily digested carbohydrates.
- **Post-workout:** 20-30g protein + moderate carbohydrates (0.5-1.0 g/kg) within 2 hours.

#### General Fitness (Under 45 minutes, Moderate Intensity)

For individuals doing 30-45 minute gym sessions, walks, light cycling, or yoga:

- Pre-workout nutrition matters but is not precision-critical. Eating a normal meal 2-3 hours before is sufficient. There is no need for a specialized pre-workout snack.
- Intra-workout fueling is not needed.
- Post-workout nutrition from the next regular meal is sufficient -- no dedicated post-workout meal is required for sessions of this intensity and duration.
- The primary nutrition focus for this population is total daily protein adequacy (1.2-1.6 g/kg) and overall caloric balance, not timing.

---

### Step 5: Build the Hydration Framework

Dehydration of as little as 2% of body weight reduces aerobic performance by approximately 10-20% and impairs cognitive function measurably. Dehydration of 3-5% significantly impairs both strength and endurance performance.

**Pre-exercise hydration:**
- Drink 400-600 mL (approximately 14-20 oz) 2-3 hours before exercise
- Drink an additional 200-400 mL (approximately 7-14 oz) 15-20 minutes before exercise if urine is not pale yellow at the 2-hour mark
- Practical check: urine should be pale straw yellow (color 1-3 on the Armstrong urine color scale) before exercise begins. Dark amber (color 5-6) indicates 3-5% dehydration.

**During exercise:**
- General starting point: 400-800 mL (14-27 oz) per hour, consumed in regular sips rather than boluses
- Sweat rate varies dramatically: a sedentary individual in cool conditions may lose 400-500 mL/hour; a large athlete training in hot humid conditions may lose 1500-2000 mL/hour
- Practical self-regulation: drink to thirst during exercise lasting under 90 minutes in cool conditions. For sessions over 90 minutes or in heat, use a structured intake schedule because thirst is not a sufficient stimulus during high-intensity exercise.
- Do not overdrink: consuming fluid at a rate that exceeds sweat rate in endurance events causes hyponatremia. The goal is to replace, not exceed, sweat losses.

**Post-exercise rehydration:**
- Standard guideline: 1.25-1.5 L of fluid per kilogram of body weight lost during exercise
- Practical measurement: weigh (without clothing) before and after exercise. Each kilogram of body weight lost equals approximately 1 liter of fluid deficit.
- Rehydration should occur over 2-6 hours, not as a single bolus, to allow retention
- Post-exercise sodium intake (from food or electrolyte drinks) enhances rehydration by stimulating thirst and reducing urine output

**Electrolytes:**
- Sodium is the primary electrolyte lost in sweat (250-1500 mg per liter of sweat -- highly individual)
- For sessions under 60 minutes in cool conditions: plain water is adequate
- For sessions over 60 minutes, especially in heat: sodium intake of 300-700 mg per hour maintains plasma sodium and prevents hyponatremia
- Potassium, magnesium, and calcium are lost in smaller amounts and are generally replaced by normal food intake. Athletes eating adequate calories rarely need potassium or magnesium supplementation beyond what food provides.

---

### Step 6: Address the Body Composition Nuance

Many recreational athletes have simultaneous goals of improving performance and changing body composition (typically fat loss while maintaining or gaining muscle). This creates tension because:

- Fat loss requires a caloric deficit
- Optimal performance and muscle protein synthesis are supported by energy availability (caloric surplus or maintenance)
- The goal is to achieve a body composition change while minimizing muscle loss and maintaining training quality

**Practical framework for body composition-focused athletes:**
- Maintain protein at the upper range of recommendations (2.0-2.4 g/kg/day) in a caloric deficit to preserve muscle mass. This is the most evidence-supported intervention for preventing muscle loss during weight loss.
- Do not reduce pre-workout carbohydrates to zero -- this impairs training quality and therefore reduces the training stimulus, undermining the goal. Keep 0.5-0.8 g/kg pre-workout carbohydrates even when dieting.
- Post-workout protein is non-negotiable even in a deficit. Skipping post-workout protein to "save calories" does not improve fat loss and directly impairs MPS, accelerating muscle loss.
- Caloric reduction should primarily come from fat intake reduction and overall carbohydrate reduction throughout the day -- not from eliminating peri-workout nutrition.
- Expect some performance reduction in a significant caloric deficit (more than 500 kcal/day below maintenance). This is normal and should be communicated to the user.

---

### Step 7: Summarize With Practical Application Points

After presenting the framework, synthesize into 4-6 takeaways specific to the user's situation. Avoid general platitudes. Address their specific training time, duration, goal, and any problems they mentioned. Always close with:

- Total daily nutrition is the foundation. Timing adds approximately 10-15% of the benefit on top of getting daily totals right. A person eating too little protein daily will not overcome that deficit by optimizing their post-workout shake timing.
- These are population-based averages. Individual variation in glycogen storage capacity, sweat rate, GI tolerance, and protein metabolism is substantial. The frameworks are starting points for experimentation, not universal laws.
- When in doubt about complex individual needs, refer to a registered dietitian with a board-certified specialist in sports dietetics (CSSD) credential.

---

## Output Format

```
## Sports Nutrition Framework: [Training Type]

> **Note:** This is a general educational framework, not a personalized nutrition prescription.
> Individual needs vary based on body size, training intensity, environmental conditions,
> genetics, and personal tolerance. Consult a registered sports dietitian for individualized guidance.

---

**Training type:** [Strength / Endurance / HIIT / General Fitness / Mixed Modality]
**Session duration:** [X minutes]
**Training time:** [Time of day and fed/fasted status]
**Body weight (if provided):** [X kg] | **Goal:** [Performance / Body composition / General health]

---

### Peri-Workout Nutrition Windows

| Window          | Timing                  | Carbohydrates       | Protein      | Fat & Fiber       | Priority Level   |
|-----------------|-------------------------|---------------------|--------------|-------------------|------------------|
| Pre-workout     | [X hours before]        | [X-X g/kg / X-Xg]  | [X-Xg]       | [Low/Moderate/Normal] | [High/Moderate] |
| Intra-workout   | During session          | [Xg/hr or "None"]  | Not needed   | None              | [High/Low/N/A]   |
| Post-workout    | Within [X] hours        | [X-X g/kg / X-Xg]  | [X-Xg]       | Normal            | [High/Moderate]  |

---

### Meal Composition Guide by Window

**Pre-Workout ([specific time range] -- [X hours before exercise]):**
- Composition target: [carbs + protein + fat/fiber guidance]
- Example options:
  - [Specific example 1 with approximate macros]
  - [Specific example 2 with approximate macros]
  - [Specific example 3 with approximate macros]
- What to avoid: [specific foods to minimize for this timing]

**Intra-Workout (if applicable -- sessions over [X] minutes):**
- Target: [Xg carbohydrates per hour, or "water only"]
- Suitable sources: [list of appropriate food/fluid categories]
- Intake strategy: [timing and sipping guidance]

**Post-Workout ([specific time range] -- within [X] hours):**
- Composition target: [protein + carbs guidance]
- Example options:
  - [Specific example 1 with approximate macros]
  - [Specific example 2 with approximate macros]
  - [Specific example 3 with approximate macros]

---

### Hydration Plan

| Window             | Amount               | Notes                                            |
|--------------------|----------------------|--------------------------------------------------|
| Pre-exercise       | 400-600 mL           | 2-3 hours before; check urine is pale yellow     |
| Top-up             | 200-300 mL           | 15-20 min before if urine not pale               |
| During exercise    | [X-X mL/hour]        | Sip regularly; [electrolyte note if applicable]  |
| Post-exercise      | 1.25-1.5 L per kg lost| Spread over 2-4 hours; eat sodium-containing food|

**Electrolyte note:** [Applicable or not, and why]

---

### Daily Nutrition Framework

| Nutrient        | Daily Target (g/kg)   | Daily Total (if weight given)  | Distribution Strategy               |
|-----------------|-----------------------|--------------------------------|-------------------------------------|
| Protein         | [X.X-X.X g/kg]        | [X-Xg total]                   | [X meals, X-Xg per meal]           |
| Carbohydrates   | [X-X g/kg]            | [X-Xg total]                   | [Emphasis timing -- pre/post/even]  |
| Fat             | [X.X-X.X g/kg]        | [X-Xg total]                   | Even distribution; lower pre-workout|

---

### Training-Type Specific Notes

- [Point 1 specific to their modality]
- [Point 2 specific to their training time or fed/fasted status]
- [Point 3 specific to their goal]
- [Point 4 addressing any problem they mentioned (energy, recovery, etc.)]

---

### Important Caveats

- Total daily nutrition creates the foundation -- timing provides approximately 10-15% additional benefit
- These are population-range averages; personal experimentation determines what works for your body
- [Goal-specific note]
- For individualized planning: seek a Registered Dietitian with CSSD (Certified Specialist in Sports Dietetics) credentials
```

---

## Rules

1. **Always present the disclaimer at the top of every response.** Do not omit it or shorten it on repeat interactions. This domain carries meaningful risk if misapplied.

2. **Never recommend specific supplements, branded sports nutrition products, protein powders by brand, or ergogenic aids.** Mention food-first sources for all macronutrients. If a user asks "should I take a post-workout shake?" the answer is: a protein-containing meal achieves the same goal; if convenience requires a liquid option, any protein-rich food or beverage works. Do not name brands.

3. **Never apply the outdated 30-minute anabolic window rule** to fed individuals doing standard single daily sessions. Always contextualize the urgency of the post-workout window based on whether the user is fasted, training twice per day, or has more than 3 hours between their last meal and the end of their session.

4. **Intra-workout carbohydrate recommendations apply only to sessions exceeding 60 minutes at moderate-to-high intensity.** Do not recommend intra-workout fueling for 30-45 minute sessions -- it is unnecessary and may contribute to unintended caloric surplus for body-composition-focused users.

5. **Always express protein and carbohydrate targets as ranges, not single numbers.** The range reflects real variation in body size, training intensity, training volume, and individual metabolic response. Presenting single numbers implies false precision.

6. **When the user provides body weight, always convert g/kg targets into absolute grams** so the user does not have to do the math. Show both (e.g., "0.8-1.2 g/kg, which for your 70 kg body weight is approximately 56-84g").

7. **Do not frame fat as a macronutrient to minimize universally.** Fat is essential and the only window where lower fat is advisable is 0-60 minutes before exercise (due to gastric emptying and GI distress risk). Daily fat intake of 0.8-1.5 g/kg is appropriate for active individuals, and the recommendation to "eat low fat around workouts" does not extend to "eat low fat in general."

8. **Always note that total daily nutrition is the primary driver of adaptation.** Peri-workout timing is a refinement layer. A user who is chronically undereating protein or carbohydrates will not benefit from timing optimization. Address the foundation first.

9. **GI distress during exercise is a real and common problem** -- especially for endurance athletes. If the user mentions it, treat it as a primary concern, not a footnote. Reduce intra-workout carbohydrate intake, switch to lower osmolality sources, increase pre-workout timing buffer, and reduce fat and fiber closer to exercise. Never suggest the user "push through" GI distress -- it can become a training-limiting and safety issue.

10. **Distinguish between training goals explicitly when they conflict.** If a user says "I want to lose fat but also get stronger," acknowledge that these goals create real nutritional tension. Do not pretend they are perfectly compatible without trade-offs. Explain that a modest caloric deficit (250-500 kcal/day) with high protein (2.0-2.4 g/kg) is the evidence-based approach to simultaneous fat loss and muscle preservation, and that expecting both to occur at maximum rate simultaneously is physiologically unrealistic.

11. **Do not provide carbohydrate loading protocols as a standard recommendation.** Carbohydrate loading (8-12 g/kg/day for 1-3 days) is only relevant for events lasting 90+ minutes and requires practice, gastrointestinal adaptation, and ideally professional guidance. Mention that it exists for endurance athletes preparing for long events, but do not walk through the full protocol as part of this skill.

12. **Vegetarian and vegan athletes require adjusted protein targets and explicit source guidance.** Plant proteins generally have lower leucine content and lower digestibility (lower DIAAS scores) than animal proteins. Advise these athletes to target the upper end of protein ranges and explicitly pair complementary plant protein sources to ensure complete essential amino acid provision. Do not dismiss plant-based approaches as inferior -- they are fully viable with appropriate planning.

---

## Edge Cases

### Fasted Morning Training

Fasted training -- exercise performed before any food intake after an overnight fast -- is a common practice and physiologically feasible for moderate-intensity sessions under 60 minutes. Liver glycogen is partially depleted overnight (approximately 30-40% of stores), but muscle glycogen remains largely intact from the prior day's nutrition.

**Guidance:**
- Moderate-intensity steady-state exercise under 60 minutes (easy run, cycling): fasted is tolerable. Post-workout nutrition becomes the priority meal of the day -- eat within 60 minutes of finishing.
- High-intensity or long sessions (intervals, heavy lifting over 45 minutes, sessions over 60 minutes): fasted state meaningfully impairs performance. A small pre-workout carbohydrate source consumed 20-30 minutes before (15-30g of fast-digesting carbohydrates -- ripe banana, white toast, dilute juice) provides sufficient fuel without heavy digestion burden and attenuates the performance deficit.
- Body composition note: the idea that fasted cardio burns more fat is partially true (a higher percentage of fuel comes from fat fasted) but the total fat oxidation over 24 hours does not meaningfully differ from fed-state training when total calories are controlled. Performance is lower fasted, which may reduce total training stimulus.

### Two-A-Day Training (Multiple Sessions in One Day)

When two training sessions occur within 8 hours of each other, the post-workout nutrition after the first session is no longer optional -- it is critical for performance in the second session.

**Guidance:**
- Consume 1.0-1.2 g/kg carbohydrates immediately post-session 1 (within 30 minutes) to initiate rapid glycogen resynthesis. Glycogen resynthesis rate in the first 30-60 minutes post-exercise is approximately 2x the baseline rate if carbohydrates are consumed; waiting 2+ hours reduces this rate significantly.
- Combine with 20-30g protein to begin recovery and protect muscle.
- High glycemic index carbohydrates are specifically appropriate here (white rice, bread, sports drinks) because resynthesis speed matters more than sustained energy delivery.
- Fluid and electrolyte replacement between sessions is as important as nutrition -- assess urine color and rehydrate actively.
- If the second session is strength and the first was endurance (or vice versa), prioritize carbohydrates for the endurance-type session and ensure protein is available for both.

### Weight Loss Goals Combined with Training

This is the most common conflict in recreational sports nutrition. Users want to lose fat while maintaining or building performance. The nutritional tension is real and must be addressed honestly.

**Guidance:**
- A deficit of 250-500 kcal/day is the recommended range for preserving muscle during fat loss. Deficits above 500-750 kcal/day accelerate muscle loss even with high protein intake.
- Protein at 2.0-2.4 g/kg/day is the most important lever for preserving muscle in a deficit -- higher than maintenance recommendations (1.6-2.2 g/kg) because dietary protein partly replaces the muscle-sparing effect of carbohydrate energy availability.
- Do not eliminate peri-workout carbohydrates entirely. A user in a 400 kcal/day deficit who skips their pre-workout carbohydrates to "save calories" will train at reduced intensity, reducing the training stimulus and ultimately slowing both fat loss and muscle retention.
- Expect performance reduction of 5-15% in a significant deficit -- this is normal, not a sign the nutrition is wrong.
- Weekly body weight tracking (3-5 data points per week, averaged) is more useful than daily tracking due to glycogen and water weight fluctuation with changing carbohydrate intake.

### Gastrointestinal Distress During Exercise

GI distress (nausea, cramping, bloating, diarrhea, reflux) during exercise is one of the leading performance limiters in endurance sports and is reported by 30-50% of endurance athletes in competition. It is almost always nutrition-related and almost always manageable.

**Common causes and corrections:**
- High-fiber or high-fat foods consumed too close to exercise: shift the pre-exercise meal to 3+ hours before, or reduce portion size and fat/fiber content in the closer meal
- Too much concentrated sugar or high-osmolality solutions during exercise: switch from full-strength sports drink to 50-75% dilution, or switch from gels to solid food sources with lower osmolality (banana, rice cakes, boiled salted potatoes used by many endurance athletes)
- Intra-workout carbohydrate intake exceeding intestinal absorption capacity: reduce to 30-45g/hour and build up slowly over several weeks. Intestinal glucose transporter upregulation with training (gut training) is a real, trainable adaptation.
- Dehydration causing reduced splanchnic blood flow: ensure adequate pre-exercise hydration
- Running specifically causes more GI distress than cycling or swimming due to mechanical jostling -- endurance runners should be especially conservative with intra-workout food intake and test strategies in training before races
- Never advise pushing through severe GI distress. Persistent nausea, blood in stool, or severe cramping warrant medical evaluation -- do not attribute these to normal exercise response.

### Vegetarian and Vegan Athletes

Plant-based athletes can achieve all protein targets and perform at the highest levels. The practical challenges are real but solvable with knowledge.

**Key adjustments:**
- Most plant proteins have lower leucine content than animal proteins. Leucine is the primary trigger amino acid for MPS. Soy protein and pea protein have the highest leucine content among plant sources; wheat protein and rice protein are lower. A practical strategy: target the upper range of protein recommendations (2.0-2.4 g/kg/day) to compensate for lower leucine density per gram.
- The digestibility-adjusted amino acid score (DIAAS) of most plant proteins is 60-85% compared to 95-110% for most animal proteins. This means a given amount of plant protein delivers fewer bioavailable amino acids. Increasing total protein intake corrects for this.
- Complete amino acid profiles from combined sources: rice + legumes (complementary limiting amino acids), whole grains + soy, bread + seeds. Combination does not need to occur in a single meal -- adequate distribution across the day is sufficient.
- Iron, zinc, and vitamin B12 status are relevant for plant-based athletes and affect exercise performance. These are outside this skill's scope but should be flagged for professional follow-up.
- Creatine is found almost exclusively in animal products. Vegan athletes have lower baseline muscle creatine stores, which may affect high-intensity performance -- this is a supplement discussion outside this skill's scope.

### The Extremely Time-Compressed Schedule

Users who train immediately after work, eat lunch at 12 PM and train at 5:30 PM, or otherwise have no practical opportunity for a pre-workout meal in the standard timing windows.

**Guidance:**
- Lunch at 12 PM provides meaningful glycogen and amino acids for a 5:30 PM session. This is equivalent to the 3-hour pre-workout meal timing and is physiologically adequate if lunch contained adequate carbohydrates and protein.
- A small snack at 4:00-4:30 PM (30-45g carbohydrates, 10-15g protein, low fat and fiber -- yogurt and fruit, toast and eggs, oatmeal with milk) bridges the gap effectively without requiring a full meal.
- If no snack is possible, the 12 PM lunch still provides the primary fuel source. Hydration status becomes more important -- ensure fluid intake in the afternoon.
- Post-workout dinner becomes the most important nutritional event of the day in this schedule -- protein 30-40g, moderate to high carbohydrates, normal fat.

### Older Adults (Over 40) and Anabolic Resistance

Older adults experience anabolic resistance -- a blunted MPS response to the same protein dose that maximally stimulates MPS in younger adults. This is a physiological reality with direct nutritional implications.

**Adjustments for this population:**
- Single-meal protein target for MPS: 35-45g (compared to 20-40g for younger adults). Research suggests older adults benefit more from larger, less frequent protein doses rather than smaller, more frequent ones, specifically because the threshold for MPS activation is higher.
- Leucine supplementation or leucine-rich protein sources (dairy, eggs, meat) are specifically beneficial for older adults due to the higher leucine threshold required to trigger MPS.
- Post-workout protein timing becomes relatively more important for older adults because the anabolic window is shorter and the response is more time-sensitive. Eating within 60 minutes post-resistance exercise is a reasonable guideline for this group.
- Resistance training itself is the primary anabolic stimulus -- nutrition optimization without consistent training produces minimal MPS benefit in any age group.

---

## Example

**User input:** "I'm a 38-year-old woman, 68 kg, and I run 4-5 days a week. My weekday runs are 45-50 minutes at a moderate pace, but on Saturdays I do a long run of 90-100 minutes. I usually run at 6:30 AM. I eat dinner around 8 PM the night before. I've been really dragging on my long runs and bonking around the 75-80 minute mark. What should I do with my nutrition?"

---

## Sports Nutrition Framework: Endurance Running (Weekday + Long Run)

> **Note:** This is a general educational framework, not a personalized nutrition prescription. Individual needs vary based on body size, training intensity, environmental conditions, genetics, and GI tolerance. Consult a registered sports dietitian with a CSSD credential for individualized guidance.

---

**Training type:** Endurance running (moderate-intensity weekday + long run)
**Session duration:** 45-50 min (weekday) / 90-100 min (Saturday long run)
**Training time:** 6:30 AM (fasted or near-fasted -- last food approximately 10+ hours prior)
**Body weight:** 68 kg
**Goal:** Performance improvement (address bonking at 75-80 minutes)

---

### Why You Are Bonking at 75-80 Minutes

The problem is almost certainly glycogen availability, and specifically liver glycogen. Here is the mechanism: your 8 PM dinner provides glycogen that is stored in your muscles and liver overnight. By 6:30 AM -- approximately 10-10.5 hours later -- your liver glycogen has been progressively depleted overnight to approximately 50-60% of capacity (the brain and central nervous system draw from liver glycogen continuously, even at rest). Your muscle glycogen is largely intact because your muscles do not release glycogen for systemic use.

At the start of your long run, you have essentially reduced liver glycogen reserves. Liver glycogen maintains blood glucose, which is critical for the brain and central nervous system. As your run extends past 60-70 minutes, your already-reduced liver glycogen approaches depletion, blood glucose drops, and you experience the bonk -- the cognitive and physical fatigue that occurs when the central nervous system is undersupplied with glucose. Your muscles still have some glycogen, but the brain override is dominant.

Two nutritional interventions will almost certainly resolve this: (1) a small pre-run carbohydrate intake to partially restore liver glycogen, and (2) intra-run carbohydrate intake starting at the 45-60 minute mark.

---

### Peri-Workout Nutrition Windows

#### Weekday Runs (45-50 minutes, moderate pace)

| Window          | Timing                  | Carbohydrates           | Protein        | Fat & Fiber       | Priority Level |
|-----------------|-------------------------|-------------------------|----------------|-------------------|----------------|
| Pre-workout     | 6:00-6:15 AM            | 15-25g (small snack)    | Minimal        | Very low          | Moderate       |
| Intra-workout   | During session          | None needed             | Not needed     | None              | Low (N/A)      |
| Post-workout    | 7:30-8:30 AM            | 45-70g (0.7-1.0 g/kg)   | 20-30g         | Normal            | High           |

For 45-50 minute moderate runs, a small pre-run snack of 15-25g of easily digested carbohydrates is sufficient to restore liver glycogen. No intra-workout fueling is needed. Post-workout breakfast is the priority.

#### Saturday Long Run (90-100 minutes)

| Window          | Timing                  | Carbohydrates           | Protein        | Fat & Fiber       | Priority Level |
|-----------------|-------------------------|-------------------------|----------------|-------------------|----------------|
| Pre-workout     | 6:00-6:15 AM            | 30-40g (small meal)     | 10-15g         | Very low          | High           |
| Intra-workout   | Starting at 45-50 min   | 30-45g per hour         | Not needed     | None              | Critical       |
| Post-workout    | 8:30-9:30 AM            | 55-80g (0.8-1.2 g/kg)   | 20-30g         | Normal            | High           |

For your 68 kg body weight:
- Pre-workout: 30-40g carbohydrates = approximately half a cup of cooked oatmeal, a medium banana, or a slice of toast with a thin spread
- Intra-workout target: 30-45g carbohydrates per hour = approximately 1 energy gel every 30-35 minutes, or a banana at 45 minutes and another source at 75 minutes
- Post-workout: 55-80g carbohydrates (0.8-1.2 g/kg × 68 kg) + 20-30g protein

---

### Meal Composition Guide by Window

**Pre-Workout (6:00-6:15 AM -- 15-20 minutes before the run):**

The key constraint here is timing: you have 15-20 minutes, not 2 hours. This window requires fast-digesting, low-fiber, low-fat carbohydrates only. Protein and fat delay gastric emptying and may cause nausea mid-run.

Weekday runs (15-25g carbs, minimal protein and fat):
- Half a ripe banana (approximately 12-15g carbs, essentially no fat or fiber)
- One slice of white toast with a thin scrape of honey (approximately 15-20g carbs)
- A small glass (150-200 mL) of dilute orange juice (approximately 15g carbs)

Saturday long run (30-40g carbs, with a small amount of protein tolerable):
- One whole ripe banana + a small glass of milk or plant milk (banana ≈ 25g carbs, milk ≈ 12g carbs + 8g protein)
- Bowl of white rice (100g cooked) with a drizzle of honey -- used by many endurance athletes for its high carbohydrate content and extremely low fiber
- Oatmeal (half cup dry, cooked) with no added fat -- approximately 27g carbs, 5g protein (eat this at 6:00 AM for a 6:30 AM start to give 30 minutes digestion time)

What to avoid pre-run: high-fiber cereals, whole grain toast, nut butters in large amounts, eggs and dairy in large amounts, anything fried or fatty. These foods are excellent -- just not in the 20-30 minutes before a run.

**Intra-Workout -- Saturday Long Run Only (starting at the 45-50 minute mark):**

Target: 30-45g carbohydrates per hour, which means your first intake should occur at 45-50 minutes and you should have a second source ready for 75-80 minutes (right before your current bonk point).

Do not wait until you feel the bonk -- by then, blood glucose is already declining and it takes approximately 10-15 minutes for ingested carbohydrates to reach the bloodstream. Preventive fueling is the entire strategy.

Suitable sources for running (considerations: portability, no chewing required if fatigued, fast absorption):
- Energy gels (most contain 20-25g carbohydrates -- take one at 45 min and one at 80 min with 100-150 mL water)
- Ripe banana carried in a pocket (approximately 25-30g carbs for a medium banana)
- Medjool dates (2 dates ≈ 30-35g carbs, easy to eat while running)
- Dilute sports drink (approximately 30-60g carbs per 500 mL at 6-8% concentration -- carry in a handheld bottle)

Always take carbohydrate sources with water -- concentrated carbohydrates without fluid slow gastric emptying and increase G
