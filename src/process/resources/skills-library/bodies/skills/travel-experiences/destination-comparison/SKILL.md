---
name: destination-comparison
description: |
  Creates a scored comparison table across candidate travel destinations using
  weighted criteria. Gathers the user's travel priorities, budget, dates, and
  constraints to produce a side-by-side destination evaluation matrix with
  numerical scores and a ranked recommendation.
  Use when the user asks to compare travel destinations, choose between
  vacation options, decide where to travel, or evaluate multiple trip
  possibilities against their preferences.
  Do NOT use for comparing accommodations within a single destination,
  trip itinerary building (use trip-itinerary-builder), or travel budget
  creation (use budget-travel-planner).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel research analysis itinerary"
  category: "travel-experiences"
  subcategory: "trip-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Destination Comparison

## When to Use

**Use this skill when:**
- The user explicitly names 2-5 candidate destinations and wants help deciding between them (e.g., "I'm torn between Japan, Peru, and Morocco")
- The user asks "where should I travel?" with at least two stated constraints (budget, season, trip type, departure city) that allow you to generate and compare concrete options
- The user has a clear trip type in mind (honeymoon, family vacation, adventure travel, cultural immersion, beach holiday) and wants destinations ranked against that purpose
- The user wants to compare destinations across a specific travel season and needs weather, crowd levels, and pricing context for that exact window
- The user is revisiting a previous destination shortlist and wants a structured framework to make a final decision
- The user has mismatched priorities within a travel group (one person wants beaches, the other wants culture) and needs a neutral scoring framework to find the best compromise
- The user is deciding between a familiar destination and an unfamiliar one and needs novelty and ease-of-travel factors quantified alongside the usual criteria

**Do NOT use when:**
- The user has already chosen a destination and wants a day-by-day plan -- use `trip-itinerary-builder` instead
- The user wants to compare hotels, resorts, or rental properties within a single destination -- this is an accommodation comparison, not a destination comparison
- The user needs a detailed travel budget with itemized cost breakdowns for a chosen destination -- use `budget-travel-planner`
- The user is asking about visa requirements for a specific passport and destination pair -- use `visa-requirements-checker`
- The user is comparing flight prices only (price comparison with no destination decision involved) -- treat this as a logistics query, not a destination evaluation
- The user wants a ranking of "the best beaches in the world" without any personal constraints -- this is a listicle request, not a personalized comparison
- The user has a single destination in mind and is asking what to do there -- use `trip-itinerary-builder`

---

## Process

### Step 1: Gather Core Parameters (Do Not Skip This Step)

Before scoring anything, collect the following. If the user has omitted one or more of these, ask for them explicitly -- scores are meaningless without this context.

- **Candidate destinations:** Require at least 2. If the user cannot name any, see the Edge Cases section for the "blank slate" protocol. Maximum of 5 for a manageable comparison; if the user names more than 5, ask them to narrow to their top 5 before proceeding.
- **Travel dates or season:** Exact dates are ideal but not required. A month or season is sufficient. This is critical because it determines weather scores, crowd levels, and pricing tiers.
- **Trip duration:** In days. This affects how many activities are realistic and whether travel time within a destination matters.
- **Group composition:** Solo traveler, couple, family with children (ages matter -- toddler vs. teenager), group of friends, multigenerational. This determines which criteria are relevant (family-friendliness, nightlife, etc.).
- **Budget per person per day (excluding flights):** Ask for a daily on-the-ground budget. If the user gives a total trip budget, divide by trip duration and number of travelers to get a daily-per-person figure. Common tiers: ultra-budget (under $50/day), budget ($50-100), moderate ($100-200), comfortable ($200-350), luxury (above $350).
- **Top 3 priorities, ranked:** Ask the user to rank their top priorities. Do not let them say "everything is important" -- push for a ranked top 3. Use probing questions: "If you had to pick one thing you absolutely could not sacrifice, what would it be?"
- **Deal-breakers:** Must-haves (e.g., "must be English-speaking") and must-avoids (e.g., "no destinations requiring a visa," "cannot travel anywhere with a Level 3 travel advisory")
- **Departure city or country:** Affects flight cost estimates and travel time. A 5-hour flight vs. a 20-hour journey changes the effective trip value significantly.

### Step 2: Validate Destination Eligibility Against Deal-Breakers

Before building the comparison matrix, run each destination through the deal-breaker filter.

- Check visa requirements against the user's passport. If the user has a US, EU, UK, or Australian passport, note which destinations require visas and what the processing time is. If a visa takes 6-8 weeks and the user is traveling in 3 weeks, flag as disqualified or high-risk.
- Check government travel advisories. Level 1 (normal) and Level 2 (exercise increased caution) are generally comparable. Level 3 (reconsider travel) and Level 4 (do not travel) should be flagged prominently as disqualifiers unless the user explicitly accepts the risk.
- Check weather fit. If a destination is in its monsoon season, hurricane season, or typhoon season during the user's dates, apply a weather warning -- not just a low score, but an explicit flag in the output.
- If a destination is disqualified by a deal-breaker, exclude it from the matrix but explain clearly why. If the user has only 2 destinations and one is disqualified, offer to suggest an alternative before proceeding.

### Step 3: Select and Define 6-8 Comparison Criteria

Choose criteria based on the user's stated priorities and group composition. Always include the four universal criteria (daily cost, weather fit, ease of travel, safety) and then add 2-4 priority-specific criteria.

**Universal criteria (always include):**
- **Daily cost on the ground:** Estimated average daily spend per person for accommodation (mid-range standard), 3 meals, local transport, and 1-2 activities. Use real-world data ranges: Tokyo ~$130-180/day mid-range, Lisbon ~$120-160/day, Bangkok ~$60-100/day, Bali ~$50-90/day, Mexico City ~$70-110/day, Medellín ~$40-70/day.
- **Weather fit for travel dates:** Score based on temperature comfort (16-28°C is the common sweet spot for most travelers), precipitation likelihood, and humidity. A destination in its peak season scores 5; a destination in its shoulder season with some rain scores 3; a destination in monsoon season scores 1-2.
- **Ease of travel:** Composite of direct flight availability from departure city, visa requirements, language accessibility (English prevalence), and local transport quality (public transit, taxi availability, scooter rentals, internal connectivity).
- **Safety for traveler profile:** Overall safety considering the specific group (solo female traveler, couple, family). Use OSAC and Numbeo crime index data as reference. Petty crime prevalence, tourist scam density, and infrastructure safety all factor in.

**Priority-specific criteria (select based on user priorities):**
- **Food scene:** Street food culture, fine dining options, dietary accommodation (vegetarian, halal, gluten-free), market and culinary experience quality
- **Beach quality:** Water temperature, clarity, wave conditions, sand quality, proximity to accommodation hubs, beach crowding
- **Cultural depth:** Museums, UNESCO World Heritage Sites, living cultural practices, architectural heritage, local art scenes
- **Outdoor and adventure:** Hiking and trekking quality, water sports, wildlife encounters, terrain diversity, guided expedition availability
- **Nightlife and social scene:** Bar and club quality, entertainment options, live music, rooftop bars, social traveler density
- **Family-friendliness:** Child-friendly activities, stroller/wheelchair accessibility, kid menus, pool and beach safety, pediatric healthcare availability
- **Nature and scenery:** National parks, biodiversity, landscape photography quality, scenic drives, unique natural phenomena
- **Novelty and uniqueness:** How different the destination is from what the traveler has already visited; distinctiveness of experience

### Step 4: Assign Importance Weights with Precision

Convert user priorities to a three-tier weight system:

- **Weight 3 -- Critical (top priority):** The user's #1 stated priority. Maximum of 2 criteria at this weight.
- **Weight 2 -- Important:** The user's #2 and #3 priorities, plus any must-pass universal criteria (cost if budget is tight, safety if group composition warrants).
- **Weight 1 -- Nice-to-have:** Supporting criteria that add value but are not decisive.

The total weight sum should fall between 12 and 20 for a 6-8 criterion comparison. This range ensures that individual criterion differences are meaningful but not exaggerated.

Do not assign weight 3 to more than 2 criteria -- this flattens the scoring by making everything "critical" and defeats the purpose of weighting. If the user insists everything is equally important, push back: "For the scoring to be meaningful, I need to know what you care about most. Even if you care about everything, which one would you be most disappointed to sacrifice?"

### Step 5: Score Each Destination With Explicit Justification

Use a 1-5 integer scale for each criterion. Never score in half-points -- this creates false precision. Every score requires a one-line justification. The scoring logic:

- **5 -- Outstanding:** The destination is genuinely among the world's best for this criterion, or it is a near-perfect match for the user's specific dates and profile
- **4 -- Strong:** The destination performs noticeably above average. A traveler would be pleased, possibly impressed.
- **3 -- Adequate:** The destination meets baseline expectations. Not a draw, not a disappointment.
- **2 -- Weak:** The destination underperforms on this criterion. A traveler might be disappointed.
- **1 -- Poor:** The destination is a poor fit for this criterion -- either inherently (no beaches in a landlocked city) or contextually (monsoon season during travel dates)

Apply scores consistently across destinations. If Bangkok scores 5 on food, ask yourself: does Lisbon genuinely score 5 as well, or is it 4? Both can score highly, but the difference between a 4 and a 5 should be articulable in one sentence.

**Calculate weighted scores:**
- Weighted score = raw score x criterion weight
- Total score = sum of all weighted scores for that destination
- Maximum possible score = sum of (5 x criterion weight) for all criteria

**Express totals as [actual]/[maximum].** For example, 57/70, not just "57." This lets the user immediately understand how close to perfect each destination is.

### Step 6: Build the Comparison Matrix and Destination Summaries

After scoring, present the full matrix (see Output Format). Then write a destination summary for each location covering:

- **Strengths:** The 2-3 criteria where the destination scored 4-5, with real-world context (e.g., "September in Lisbon averages 26°C with fewer than 3 rain days -- peak weather")
- **Weaknesses:** Criteria where the destination scored 1-3, explained honestly without over-softening
- **Real daily cost estimate:** A specific dollar range for mid-range travelers at this destination during the travel period, not just "affordable" or "expensive"
- **Best for:** The traveler archetype this destination serves best (e.g., "couples who prioritize atmospheric cities and wine culture over beach time")
- **Watch out for:** The single most common disappointment travelers experience at this destination that is relevant to this user's profile
- **Deal-breaker flags:** Any warnings from Step 2 that survived to this stage (visa complexity, weather risks, safety advisories)

### Step 7: Produce the Ranked Recommendation and Next Steps

Rank destinations by total weighted score, highest to lowest.

- If the top two destinations are within 8% of each other in total score, explicitly state: "This is a statistically close comparison. The scores suggest [Destination A] has a narrow edge on your stated priorities, but the difference is marginal. The deciding factor is likely [specific criterion where they differ most]."
- An 8% threshold is meaningful for a max score of 70 (8% = ~5.6 points) -- within that range, scores reflect genuine similarity rather than a clear winner.
- If the top destination has a weather warning or visa complexity flag, note that the mathematical winner may not be the practical winner.
- Frame the recommendation explicitly in terms of the user's own words: "Based on your stated priorities -- [food, then beaches, then culture] -- [Destination] scores highest because..."
- Never say a destination is universally better. Always anchor the recommendation to the user's specific profile.

Close with a Next Steps section that routes the user to the appropriate follow-up skill based on their likely decision, and includes 2-3 practical logistics tips specific to the winning destination and travel dates.

---

## Output Format

```
## Destination Comparison: [Trip Type -- e.g., "Couples Beach and Culture Trip, September"]

**Travelers:** [Count and composition]
**Dates:** [Month/season or specific dates]
**Duration:** [X days]
**Budget:** [$X-Y per person per day, excluding flights]
**Departing from:** [City/country]

---

### Deal-Breaker Check

| Destination    | Visa Required? | Travel Advisory | Weather Warning | Status    |
|----------------|----------------|-----------------|-----------------|-----------|
| [Destination A]| [Yes/No/On arrival] | [Level 1-4] | [None/Note] | ✅ Eligible / ⚠️ Flag / ❌ Disqualified |
| [Destination B]| ...            | ...             | ...             | ...       |
| [Destination C]| ...            | ...             | ...             | ...       |

[If any destination is flagged or disqualified, explain here in 1-2 sentences.]

---

### Criteria and Weights

| Criterion           | Weight | Tier       | Reason                                      |
|---------------------|--------|------------|---------------------------------------------|
| [Criterion 1]       | 3      | Critical   | User's #1 priority                          |
| [Criterion 2]       | 3      | Critical   | User's #2 priority                          |
| [Criterion 3]       | 2      | Important  | User's #3 priority                          |
| [Criterion 4]       | 2      | Important  | Universal -- budget fit                     |
| [Criterion 5]       | 2      | Important  | Universal -- weather fit                    |
| [Criterion 6]       | 1      | Supporting | Ease of travel from [departure city]        |
| [Criterion 7]       | 1      | Supporting | Safety for [group composition]              |
| **Total weight**    | **14** |            |                                             |

### Comparison Matrix

| Criterion        | Wt | [Dest A] | [A] Wtd | [Dest B] | [B] Wtd | [Dest C] | [C] Wtd |
|------------------|----|----------|---------|----------|---------|----------|---------|
| [Criterion 1]    | 3  | [1-5]    | [SxW]   | [1-5]    | [SxW]   | [1-5]    | [SxW]   |
| [Criterion 2]    | 3  | [1-5]    | [SxW]   | [1-5]    | [SxW]   | [1-5]    | [SxW]   |
| [Criterion 3]    | 2  | [1-5]    | [SxW]   | [1-5]    | [SxW]   | [1-5]    | [SxW]   |
| [Criterion 4]    | 2  | [1-5]    | [SxW]   | [1-5]    | [SxW]   | [1-5]    | [SxW]   |
| [Criterion 5]    | 2  | [1-5]    | [SxW]   | [1-5]    | [SxW]   | [1-5]    | [SxW]   |
| [Criterion 6]    | 1  | [1-5]    | [SxW]   | [1-5]    | [SxW]   | [1-5]    | [SxW]   |
| [Criterion 7]    | 1  | [1-5]    | [SxW]   | [1-5]    | [SxW]   | [1-5]    | [SxW]   |
| **TOTAL**        |    |          | **[X]/[Max]** |   | **[X]/[Max]** |   | **[X]/[Max]** |

### Score Justifications

**[Destination A]**
| Criterion     | Score | Justification                                              |
|---------------|-------|------------------------------------------------------------|
| [Criterion 1] | [1-5] | [One specific sentence with real-world context]            |
| [Criterion 2] | [1-5] | [One specific sentence with real-world context]            |
| ...           | ...   | ...                                                        |

**[Destination B]**
[Same structure]

**[Destination C]**
[Same structure]

### Destination Profiles

---

**[Destination A] -- Score: [X]/[Max]**

- **Estimated daily cost (mid-range):** $[X]-$[Y] per person (accommodation $[X]-[Y] + food $[X]-[Y] + transport $[X]-[Y] + activities $[X]-[Y])
- **Strengths:** [2-3 specific strengths tied to high-scoring criteria]
- **Weaknesses:** [1-2 specific weaknesses tied to low-scoring criteria]
- **Best for:** [Specific traveler archetype]
- **Watch out for:** [The single most common relevant disappointment]
- **Flags:** [Any deal-breaker-adjacent notes not disqualifying but worth knowing]

---

**[Destination B] -- Score: [X]/[Max]**
[Same structure]

---

**[Destination C] -- Score: [X]/[Max]**
[Same structure]

---

### Ranked Recommendation

| Rank | Destination    | Score         | One-Line Verdict                              |
|------|----------------|---------------|-----------------------------------------------|
| 🥇 1 | [Destination]  | [X]/[Max] ([Y]%) | [Why it wins against this user's priorities]  |
| 🥈 2 | [Destination]  | [X]/[Max] ([Y]%) | [Its strongest differentiator]                |
| 🥉 3 | [Destination]  | [X]/[Max] ([Y]%) | [What it does best, where it falls short]     |

**Recommendation:** Based on your priorities -- [restate user's top 3 in their own words] -- **[Destination A]** is the strongest match because [2-3 sentence specific rationale anchored to the scoring].

[If close: "Note: [Dest A] and [Dest B] are within [X]% of each other. If [specific criterion] is more important to you than the scores suggest, [Dest B] may be the better call."]

---

### Next Steps

**If you choose [Top Destination]:**
- **Itinerary:** Use `trip-itinerary-builder` for a [X]-day plan -- consider a [suggested split, e.g., "3 days city + 4 days coast + 3 days wine region"] structure
- **Visa:** [Specific visa status for typical passport holders, processing time if applicable]
- **Booking timing:** [Specific lead time recommendation for this destination and season]
- **Key logistic:** [One destination-specific practical tip, e.g., "Book the Alhambra 2-3 months ahead -- daily tickets sell out for peak season"]

**If you choose [Runner-up]:**
- **Itinerary:** Use `trip-itinerary-builder` for a [X]-day plan
- **Key difference from [Winner]:** [What changes about the trip experience]
- **Best time caveat:** [If timing affects the runner-up differently]
```

---

## Rules

1. **Never score without explicit justification.** Every score in the matrix must have a corresponding one-sentence justification in the Score Justifications table. A score without context is an opinion; a score with a specific reason is an evaluation.

2. **Run the deal-breaker check before building the matrix.** A destination with a Level 3 or Level 4 travel advisory, an active monsoon season during travel dates, or a visa requirement that cannot be met in the available time should be flagged or removed before any scoring occurs. Surfacing this early saves the user from optimizing around an ineligible option.

3. **Never assign weight 3 to more than 2 criteria.** If all criteria are "critical," the weighting system collapses into a uniform average, which adds no value. Push back on users who rank everything equally and help them identify their true top priorities.

4. **Daily cost scores must reference real estimated ranges, not subjective impressions.** Do not say a destination "scores 4 on cost because it's affordable." Say it "scores 4 because mid-range travelers typically spend $70-100/person/day -- within the user's $100-150 budget with comfortable headroom." Specificity validates the score.

5. **Weather scores must be specific to the user's exact travel month, not annual averages.** A destination that is excellent in April and in monsoon in August must score 1-2 for an August traveler, even if its annual reputation is sunny. Pull month-specific climate data: average temperature, average rain days per month, humidity levels.

6. **Express final scores as X/Maximum, not just X.** The maximum possible score is the sum of (5 x weight) for all criteria. Showing 57/70 communicates much more than 57 alone -- it tells the user the destination scored 81% of its theoretical maximum.

7. **Flag close comparisons using the 8% threshold.** If the top two destinations fall within 8% of the maximum score of each other (e.g., within 5.6 points on a 70-point scale), explicitly tell the user the scores are statistically close and pivot the recommendation to the differentiating criterion rather than the overall number.

8. **Never universalize the recommendation.** Always anchor it to the user's stated profile. "Portugal is the best destination" is wrong. "Portugal is the strongest match for your priorities of weather-fit, food, and culture in September" is correct.

9. **Preserve deal-breaker flags through to the recommendation, even if the destination scores well.** A destination can score 65/70 and still carry a weather warning for the user's specific dates. The recommendation section must surface this tension explicitly: "Despite scoring highest overall, note that [destination] enters its wet season in [month] -- expect [X] rain days and [Y] conditions."

10. **Do not compare inherently incomparable destinations without adjusting criteria.** If the user is comparing a landlocked mountain destination (e.g., Cusco) against a beach destination (e.g., Maldives), do not score Cusco on beach quality -- replace it with a relevant criterion (e.g., hiking/trekking) or note the score is N/A with an explanation. An N/A counts as 0 in weighted calculations and should be disclosed.

11. **Flight time and cost are not included in the daily budget score but must be disclosed.** Note approximate flight duration and cost range from the user's departure city in the Next Steps section. A $1,200 flight to Bali vs. a $350 flight to Lisbon from New York materially affects the true trip cost and may change the user's decision.

12. **For group trips with mixed priorities, weight criteria based on the group's collective priority list, not any single member's.** Note explicitly when a destination serves one group member's priorities significantly better than another's -- this is often the most actionable insight for a group decision.

---

## Edge Cases

### User Cannot Name Any Destinations ("Blank Slate" Protocol)
If the user has constraints but no candidate destinations, generate 3-4 suggestions before running the comparison. Base suggestions on: budget tier, departure city flight routes, travel season climate data, and trip type. Present suggestions briefly with a one-sentence pitch each, confirm 2-3 with the user, then proceed to the full comparison. Do not attempt to compare vague suggestions -- confirm the destinations are the user's actual candidates before scoring.

### Two or More Destinations Are Tied Within 8%
Do not fabricate a winner. Instead, identify the single criterion where the two destinations diverge most and frame the choice around it: "Both Portugal and Japan score 60/70. The clearest differentiating factor is ease of travel: Portugal is Schengen visa-free and 2 hours from London, while Japan requires a longer flight and, depending on your passport, a visa application. If travel convenience matters, Portugal wins. If you want the more distinctive cultural experience, Japan wins." Let the user make the final call with this framing.

### One Destination Is Dramatically More Expensive Than Others
When one destination's estimated daily cost exceeds the user's stated budget by more than 25%, flag it as "over budget" before scoring. Either (a) exclude it with an explanation and offer to suggest an alternative, or (b) keep it in the comparison with a prominent ⚠️ budget warning, noting what budget adjustment would be required. Do not score it a 1 on cost and bury the issue -- the user needs to know upfront.

### Destinations in Radically Different Categories (Beach vs. Mountain vs. City)
When comparing destinations that fundamentally differ in experience type, adjust criteria so no destination is structurally penalized. Replace category-specific criteria with experience-agnostic versions: instead of "beach quality," use "outdoor recreation quality" which can apply to surfing, hiking, or cycling equally. Note explicitly in the output: "Because these destinations offer fundamentally different travel experiences, the comparison reflects how well each matches your priorities, not which is objectively 'better.'"

### User Is Choosing Between Domestic and International Destinations
Add two additional criteria specifically for this comparison type: **novelty/distinctiveness** (international destinations typically score higher here) and **ease and total travel cost** (domestic destinations typically score higher). These two criteria often cancel each other out, which is exactly the trade-off the user is navigating. Also note that international trips require travel insurance, possible currency exchange costs ($10-30 in fees), international phone plans ($10-50 for a 10-day trip), and potential jet lag recovery days that consume part of the trip duration.

### User Has Visited One or More Candidate Destinations Before
Ask directly: "Have you visited any of these destinations before?" If yes, add a **novelty** criterion weighted at 1-2 depending on how much the user values new experiences. Score previously visited destinations lower on novelty (2 or 3 depending on whether the user would return) and note in the summary: "You've visited [Destination] before -- consider whether revisiting serves your goals or whether the other options offer more discovery."

### Large Group With Conflicting Priorities
Ask each party (or the group leader on behalf of distinct factions) for their top priority. Build a composite priority list: if one person ranks beaches first and the other ranks culture first, both get weight 2 (Important) rather than one getting weight 3. Add a "group satisfaction" perspective to each Destination Profile: "For [traveler type A], this destination scores best on [criterion]. For [traveler type B], it is [better/weaker] because [reason]." This makes the recommendation feel fair to all parties rather than favoring one traveler's preferences.

### User Is Planning a Shoulder-Season or Off-Season Trip
Users planning to travel during off-peak periods often do so specifically to avoid crowds and save money. Adjust the scoring to reflect this: a destination with lower-than-average tourist density during the travel period should score higher on "ease of travel" and its cost score should reflect the off-season pricing, which can be 20-40% below peak rates. Note that some off-season destinations have reduced operating hours for attractions, closed beach clubs, or limited transportation links -- these operational limitations should appear in "Watch out for."

---

## Example

**Input:** "I need help deciding between Lisbon (Portugal), Oaxaca (Mexico), and Chiang Mai (Thailand) for a solo trip in March. I'm a solo female traveler, 28 years old, departing from New York. I care most about food culture, then art and creative scenes, then budget. I'm trying to stay under $100/person/day on the ground. Trip would be 12 days."

---

## Destination Comparison: Solo Female Cultural and Food Trip, March

**Travelers:** 1 (solo female, 28)
**Dates:** March (12 days)
**Budget:** Under $100 per person per day on the ground (excluding flights)
**Departing from:** New York (JFK/EWR)

---

### Deal-Breaker Check

| Destination     | Visa Required?                | Travel Advisory | Weather Warning       | Status      |
|-----------------|-------------------------------|-----------------|----------------------|-------------|
| Lisbon, Portugal| No (Schengen, 90-day tourist) | Level 1         | None                  | ✅ Eligible  |
| Oaxaca, Mexico  | No (visa-free, 180-day)       | Level 2 (state-level varies) | None        | ⚠️ See note |
| Chiang Mai, Thailand | No (30-day visa on arrival or e-visa) | Level 1 | None           | ✅ Eligible  |

**Oaxaca note:** Mexico's overall advisory is Level 2 (exercise increased caution). Oaxaca state itself currently carries a Level 2 advisory, not Level 3 or 4. Oaxaca city is considered significantly safer than Mexico's border regions or resort areas with high cartel activity. Solo female travelers report Oaxaca city center as generally safe, but standard solo travel precautions apply: use registered taxis or app-based rides (not street hails), avoid walking alone late at night in unfamiliar neighborhoods, and keep hotel contact details on hand. This does not disqualify Oaxaca but is worth noting in trip planning.

---

### Criteria and Weights

| Criterion                  | Weight | Tier       | Reason                                                  |
|----------------------------|--------|------------|---------------------------------------------------------|
| Food culture and scene      | 3      | Critical   | User's #1 stated priority                               |
| Art and creative scene      | 3      | Critical   | User's #2 stated priority                               |
| Daily cost (budget fit)     | 2      | Important  | User's #3 priority; hard limit of $100/day              |
| Weather fit (March)         | 2      | Important  | Universal -- month-specific climate                     |
| Safety for solo female      | 2      | Important  | Elevated weight due to solo female traveler profile     |
| Ease of travel from NYC     | 1      | Supporting | Flight duration and connectivity from JFK/EWR           |
| Neighborhood walkability    | 1      | Supporting | Relevant for solo exploration without guide dependency  |
| **Total weight**            | **14** |            |                                                         |

---

### Comparison Matrix

| Criterion                | Wt | Lisbon | Lisbon Wtd | Oaxaca | Oaxaca Wtd | Chiang Mai | CM Wtd |
|--------------------------|----|--------|-----------|--------|-----------|------------|--------|
| Food culture and scene   | 3  | 4      | 12        | 5      | 15        | 5          | 15     |
| Art and creative scene   | 3  | 4      | 12        | 5      | 15        | 3          | 9      |
| Daily cost (budget fit)  | 2  | 3      | 6         | 5      | 10        | 5          | 10     |
| Weather fit (March)      | 2  | 3      | 6         | 5      | 10        | 4          | 8      |
| Safety for solo female   | 2  | 5      | 10        | 3      | 6         | 5          | 10     |
| Ease of travel from NYC  | 1  | 4      | 4         | 4      | 4         | 2          | 2      |
| Neighborhood walkability | 1  | 5      | 5         | 5      | 5         | 3          | 3      |
| **TOTAL**                |    |        | **55/70** |        | **65/70** |            | **57/70** |

---

### Score Justifications

**Lisbon, Portugal**

| Criterion                | Score | Justification                                                                                         |
|--------------------------|-------|-------------------------------------------------------------------------------------------------------|
| Food culture and scene   | 4     | Exceptional seafood, pastéis de nata, wine culture, and a thriving natural wine bar scene -- but less distinctive than Oaxaca or Chiang Mai at the world-food level |
| Art and creative scene   | 4     | LX Factory, MAAT museum, strong street art (Mouraria, Intendente), and a growing independent gallery scene; slightly less globally renowned than Oaxaca's artisan tradition |
| Daily cost (budget fit)  | 3     | Mid-range daily spend typically $110-150 in March -- slightly above the $100 target; budget travelers can reach $80-100 with hostel accommodation and local restaurants, but it requires discipline |
| Weather fit (March)      | 3     | Average March temperatures 14-18°C; approximately 10-12 rain days in March -- shoulder season, pleasant but not peak; some days require a jacket |
| Safety for solo female   | 5     | Consistently ranked among Europe's safest cities for solo female travelers; low crime rate, well-lit central neighborhoods, very little street harassment reported |
| Ease of travel from NYC  | 4     | Direct overnight flights JFK-LIS in ~7 hours; Schengen entry straightforward; English widely spoken in tourism areas |
| Neighborhood walkability | 5     | Lisbon's historic center (Alfama, Baixa, Bairro Alto, Príncipe Real) is extremely walkable; tram and metro supplement well; flat areas accessible on foot |

**Oaxaca, Mexico**

| Criterion                | Score | Justification                                                                                         |
|--------------------------|-------|-------------------------------------------------------------------------------------------------------|
| Food culture and scene   | 5     | UNESCO-recognized cuisine; home of mole negro, tlayudas, mezcal culture, chocolate markets, and world-class contemporary Mexican restaurants alongside centuries-old traditional cooking -- one of the planet's great food destinations |
| Art and creative scene   | 5     | Monte Albán archaeological site, MACO contemporary art museum, Textile Museum, master artisan villages (Teotitlán del Valle for rugs, San Bartolo Coyotepec for black clay), thriving gallery scene -- a complete and authentic creative ecosystem |
| Daily cost (budget fit)  | 5     | Mid-range daily cost $45-75/person including boutique guesthouse ($30-50/night), restaurant meals ($3-12 per meal), and market lunches; well within budget even with splurge days |
| Weather fit (March)      | 5     | March is peak dry season in Oaxaca; temperatures 23-28°C daily, minimal rain (under 2 days/month), low humidity, clear skies -- near-ideal conditions |
| Safety for solo female   | 3     | Oaxaca city center is safer than Mexico's headline figures suggest, but a Level 2 advisory warrants elevated awareness; standard precautions essential (app-based transport, avoiding unfamiliar areas after dark, not displaying expensive equipment on market streets) |
| Ease of travel from NYC  | 4     | Typically 2 connections (NYC to Mexico City or Oaxaca via a hub city); ~7-9 hours travel time; no visa required; Spanish language barrier real outside tourist areas but manageable |
| Neighborhood walkability | 5     | Oaxaca city's historic center is compact and extremely walkable; zócalo, Jalatlaco, Reforma neighborhood all navigable on foot; artisan villages accessible by day trips |

**Chiang Mai, Thailand**

| Criterion                | Score | Justification                                                                                         |
|--------------------------|-------|-------------------------------------------------------------------------------------------------------|
| Food culture and scene   | 5     | Northern Thai cuisine is distinct and exceptional -- khao soi, sai oua sausage, nam prik noom (roasted green chili dip), exceptional night markets, superb vegetarian options, some of Southeast Asia's best cooking school options for travelers |
| Art and creative scene   | 3     | Nimman Road area has independent galleries and design shops; MAIIAM Contemporary Art Museum is strong; Saturday and Sunday markets have craft vendors; but the scene lacks the depth and international recognition of Oaxaca's or Lisbon's |
| Daily cost (budget fit)  | 5     | Daily costs $35-65/person at mid-range (guesthouse $15-30/night, meal $2-8); easily the most budget-friendly of the three; leaves room for cooking classes, massages, and day trips |
| Weather fit (March)      | 4     | March is hot and dry season, 32-36°C -- very warm but no rain; one caveat is smoke season (agricultural burning in the region, February-April), which can affect air quality and has become more pronounced in recent years; not a deal-breaker but worth noting |
| Safety for solo female   | 5     | Chiang Mai is consistently rated among Asia's safest cities for solo female travelers; strong solo traveler infrastructure, English widely spoken in the old city, low street harassment |
| Ease of travel from NYC  | 2     | No direct flights; minimum 1-2 connections with 20-24 hours total travel time; significant journey from New York; jet lag adjustment will consume 1-2 days of a 12-day trip |
| Neighborhood walkability | 3     | Old city (within the moat) is walkable; Nimman area requires songthaew or tuk-tuk; overall the city is more scooter/transport-dependent than Lisbon or Oaxaca; sidewalks uneven in places |

---

### Destination Profiles

---

**Lisbon, Portugal -- Score: 55/70 (79%)**

- **Estimated daily cost (mid-range):** $110-150 per person (accommodation $60-90/night in a 3-star hotel or stylish guesthouse + meals $30-40 + transport $10 metro/tram + activities $10-20)
- **Strengths:** Exceptional safety for solo female travelers; beautiful, walkable historic neighborhoods; strong food scene especially for wine, seafood, and pastry culture; excellent natural wine bar scene has exploded in the last five years; easy direct flight from NYC
- **Weaknesses:** March weather is pleasant but not warm -- Atlantic coast in spring means some rain days and temperatures requiring layers; daily costs push the upper edge of the $100 budget; art scene is strong but less world-renowned than Oaxaca's artisan tradition
- **Best for:** Solo female travelers who prioritize safety and ease without sacrificing food quality; travelers who want a European city experience with strong walkability and English accessibility
- **Watch out for:** The budget is tight for Lisbon at the $100/day target -- budget accommodation (hostel dorm) can bring it down, but mid-range solo travel in Lisbon now regularly exceeds $100/day. Plan carefully or accept some budget flexibility.
- **Flags:** None -- clean deal-breaker check

---

**Oaxaca, Mexico -- Score: 65/70 (93%)**

- **Estimated daily cost (mid-range):** $50-80 per person (accommodation $30-55/night in a well-reviewed guesthouse or boutique hotel + meals $12-20/day eating market and local restaurants + transport $3-8 + activities $5-15)
- **Strengths:** One of the world's great food destinations -- mole, mezcal, chocolate, and traditional markets form an unmatched culinary ecosystem; artisan and contemporary art scenes are genuinely world-class and deeply integrated with daily life; March weather is near-perfect; exceptional budget value leaves room for cooking classes, mezcal tastings, and day trips to archaeological sites
- **Weaknesses:** Level 2 travel advisory warrants real (not paranoid) precaution for solo female travelers; Spanish fluency helps significantly outside the city center; some artisan village day trips require organized transport
- **Best for:** Culturally driven solo travelers who want to immerse in a living, layered creative and culinary tradition without the tourist-veneer of larger Mexican cities
- **Watch out for:** Safety requires active management, not passive assumption. Use app-based transport (DiDi or Uber are available in Oaxaca city), keep valuables minimal on market streets, and arrange accommodation in well-reviewed areas (Jalatlaco and city center are the safest zones). This is manageable -- hundreds of thousands of solo female travelers visit Oaxaca annually without incident -- but it requires awareness.
- **Flags:** ⚠️ Level 2 advisory -- read above. Day trips to surrounding villages (Monte Albán, Hierve el Agua, artisan communities) are best done with organized group tours or reputable local guides, not improvised solo transportation.

---

**Chiang Mai, Thailand -- Score: 57/70 (81%)**

- **Estimated daily cost (mid-range):** $40-70 per person (guesthouse $15-30/night + 3 meals $8-15 + songthaew/Grab transport $5-8 + activities $10-20 including a massage)
- **Strengths:** Outstanding budget value -- the most affordable of the three by a significant margin; Northern Thai cuisine is genuinely exceptional and distinct from what most Western travelers know as "Thai food"; extremely safe for solo female travelers; great cooking school options for a food-focused trip
- **Weaknesses:** The 20-24 hour travel time from New York is a significant commitment for a 12-day trip -- jet lag will affect the first 1-2 days; art and creative scene, while present, doesn't match Oaxaca's depth or Lisbon's gallery concentration; smoke season (agricultural burning, Feb-April) can reduce air quality and affect outdoor activities
- **Best for:** Budget-focused solo travelers prioritizing food immersion and safety who are comfortable with the long-haul flight and can plan around smoke season air quality
- **Watch out for:** The smoke season (locally called "smoky season" or "haze season") in March can be significant in Chiang Mai -- PM2.5 levels sometimes reach unhealthy ranges in late February and March. Check air quality forecasts before and during travel, and consider bringing an N95 mask. This doesn't make Chiang Mai unvisitable but is a real quality-of-life factor that many travelers are surprised by.
- **Flags:** ⚠️ Smoke/haze season in March is a real consideration, not a minor footnote.

---

### Ranked Recommendation

| Rank | Destination     | Score    | One-Line Verdict                                                             |
|------|-----------------|----------|------------------------------------------------------------------------------|
| 🥇 1 | Oaxaca, Mexico  | 65/70 (93%) | Dominant on your top two priorities (food culture + art scene) and budget; best weather of the three in March |
| 🥈 2 | Chiang Mai      | 57/70 (81%) | Ties Oaxaca on food and budget but falls short on art scene depth; long-haul flight and smoke season are real trade-offs |
| 🥉 3 | Lisbon, Portugal| 55/70 (79%) | Safest option by a wide margin and easiest travel from NYC, but pushes your budget ceiling and scores lower on food and art compared to the others |

**Recommendation:** Based on your priorities -- food culture first, creative and art scene second, staying under $100/day third -- **Oaxaca** is the clear standout. It scores 93% of its maximum possible score and leads on your top two criteria by meaningful margins. The food culture in Oaxaca (mole, mezcal, indigenous ingredient markets, cooking traditions that predate European contact) and the art ecosystem (artisan villages, MACO, the ceramics and textile traditions integrated into daily commerce) are among the most authentic and layered in the world at any budget tier.

The safety consideration is real and should be respected, but it is manageable with standard solo traveler practices. Oaxaca city is categorically different from Mexico's genuinely high-risk areas, and the solo female traveler community there is large and well-established.

**Note:** Chiang Mai and Lisbon are within 4% of each other (81% vs. 79%). If smoke season air quality in March is a concern you cannot accept, or if the 20-hour flight from New York feels like too much for 12 days, Lisbon becomes the stronger alternative -- particularly for a traveler who values simplicity, safety, and a walkable European city experience.

---

### Next Steps

**If you choose Oaxaca (recommended):**
- **Itinerary:** Use `trip-itinerary-builder` for a 12-day plan -- a strong structure is 7 days Oaxaca city (food markets, cooking class, MACO, mezcal distillery visit) + 2 day-trip days (Monte Albán archaeological site, Teotitlán del Valle artisan village) + 2-3 days at Hierve el Agua or Sierra Norte mountains
- **Visa:** No visa required for US passport holders -- 180-day tourist entry stamp on arrival
- **Flights from NYC:** Approximately $350-550 round trip (JFK or EWR to OAX via Mexico City or another hub); book 6-8 weeks ahead for March
- **Booking timing:** March is Oaxaca's high season -- book accommodation 6-8 weeks ahead; cooking class spots (Seasons of My Heart, Los Danzantes) book 2-4 weeks ahead
- **Key safety logistics:** Download DiDi (dominant rideshare app in Oaxaca) before you go; book accommodation in Jalatlaco or within 4 blocks of the zócalo for the safest and most walkable base
- **Budget tip:** Your $100/day budget allows $50-55/night accommodation in a well-reviewed boutique guesthouse in Jalatlaco, leaving $45-50/day for food (which goes very far -- a market lunch is $3-6, a nice dinner is $15-25)

**If you choose Chiang Mai:**
- **Itinerary:** Use `trip-itinerary-builder` for a 12-day plan; build in a recovery day at the start for jet lag; consider 9 days Chiang Mai + 3-day extension to Pai or Chiang Rai
- **Flights from NYC:** $700-1,100 round trip (JFK to CNX via Tokyo, Seoul, Bangkok, or another Asian hub); 20-24 hours each way
- **Smoke season:** Check real-time air quality on IQAir before and during travel; the window of clean air in March varies year to year

**If you choose Lisbon:**
- **Itinerary:** Use `trip-itinerary-builder` for a 12-day plan; a strong structure is 5 days Lisbon (Alfama, Bairro Alto, Belém, Mouraria) + 3 days Sintra and Cascais coast + 4 days Alentejo wine region or Porto
- **Budget management:** At $100/day, choose between a private room in a guesthouse (not a 3-star hotel) and eating at tascas (traditional local taverns) rather than tourist-facing restaurants -- this keeps costs on target
- **Flights from NYC:** $450-750 round trip direct JFK-LIS; Tap Air Portugal and others fly this route nonstop in ~6.5-7 hours
