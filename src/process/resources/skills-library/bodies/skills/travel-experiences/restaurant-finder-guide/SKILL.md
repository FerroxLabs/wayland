---
name: restaurant-finder-guide
description: |
  Creates a structured vetting criteria checklist and shortlisting process
  for finding restaurants while traveling. Gathers destination, cuisine
  preferences, dietary restrictions, budget, and dining occasion to produce
  a repeatable restaurant evaluation framework with a scored shortlist
  template and reservation logistics guide.
  Use when the user asks how to find restaurants while traveling, how to
  evaluate restaurants in a new city, how to avoid tourist traps, or how to
  choose where to eat on vacation.
  Do NOT use for meal planning at home (use home-household skills), recipe
  discovery, or food tourism itinerary building (use trip-planning skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel research guide step-by-step"
  category: "travel-experiences"
  subcategory: "experiences-activities"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Restaurant Finder Guide

## When to Use

**Use this skill when:**
- User asks how to find restaurants while traveling
- User wants to evaluate dining options in an unfamiliar city
- User asks how to avoid tourist trap restaurants
- User needs restaurant vetting criteria for a destination
- User wants a process for shortlisting restaurants before a trip
- User asks about dining reservations and logistics in another country

**Do NOT use when:**
- User wants a food-focused trip itinerary (use trip-planning or food tourism skills)
- User wants meal planning or recipes for home cooking (use home-household skills)
- User wants a full trip itinerary with restaurant slots already filled (use `trip-itinerary-builder`)
- User wants a restaurant review or rating of a specific restaurant
- User wants dietary or nutrition guidance (use health-wellness skills)

## Process

1. **Gather dining parameters.** Ask the user for:
   - Destination city or region
   - Cuisine preferences (local specialties, specific cuisines, open to anything)
   - Dietary restrictions or allergies
   - Budget per meal per person (budget, moderate, splurge)
   - Dining occasions (casual everyday, one special dinner, romantic, family-friendly)
   - Group size
   - How many meals per day they need restaurant recommendations for
   - Comfort level with language barriers (menus in foreign languages)
   - Preference for research-ahead vs. spontaneous discovery

2. **Establish vetting criteria.** Build a restaurant evaluation checklist:
   - **Location:** Within walking distance of planned activities or accommodation (15 min walk or less)
   - **Local vs. tourist:** Ratio of local to tourist patrons (visible from outside or described in reviews)
   - **Menu language:** Menu has pictures, English translation, or is navigable without the local language
   - **Price check:** Menu posted outside or prices visible online before sitting down
   - **Freshness indicators:** Open kitchen, ingredients on display, seasonal menu changes
   - **Service indicators:** Staff responsiveness, table turnover pace, reservation or walk-in
   - **Crowd indicators:** Busy during local meal times (good sign), empty when others are full (warning sign)
   - **Hygiene check:** Clean entrance, visible restroom condition (if accessible before ordering), food handling visible

3. **Define the shortlisting process.** Teach the user a repeatable method:
   - **Step 1: Identify candidates (5-10 per meal type).** Use a combination of:
     - Ask accommodation staff for their personal favorites (not tourist recommendations)
     - Check food review platforms -- look for reviews by locals, not just tourists
     - Walk through neighborhoods and note restaurants that are full during local meal times
     - Ask other travelers for recent experiences
   - **Step 2: Apply quick filters (narrow to 3-5).** Eliminate:
     - Restaurants on the main tourist drag with multi-language hawkers outside
     - Places with laminated photo menus of 50+ items (often pre-made, not fresh)
     - Restaurants that are empty during peak local dining hours
     - Places where prices are not visible before sitting down
   - **Step 3: Evaluate remaining candidates (narrow to 1-2).** Check:
     - Recent reviews (last 3 months) for consistency
     - Menu focus: restaurants with a short, focused menu often cook better than those with extensive menus
     - Reservation availability: very popular places may need booking 1-3 days ahead
     - Location fit: close to your day's activities to avoid long detours

4. **Build the shortlist template.** Create a scored comparison for the user's top picks:
   - Score each candidate on 5 criteria (1-5 scale)
   - Calculate totals for comparison
   - Include logistical details (address, hours, reservation needed, price range)

5. **Add reservation and logistics guidance.** Include:
   - Whether reservations are expected at the destination
   - How to make reservations (platform, phone, walk-in timing)
   - Typical meal times at the destination
   - Payment norms (cash vs. card, tipping, splitting)
   - Allergy communication approach (allergy card in local language)
   - What to do if the restaurant is full (waitlist, nearby alternatives)

6. **Add tourist trap identification guide.** Provide specific red flags:
   - Location-based red flags (directly facing major monument, bus parking nearby)
   - Menu-based red flags (enormous menu, photos of every dish, multiple cuisines)
   - Service-based red flags (aggressive outside recruiters, instant seating during peak hours)
   - Price-based red flags (no prices until the bill, "market price" without specification)

## Output Format

```
## Restaurant Finder Guide: [Destination]

**Cuisine focus:** [Local specialties | Specific cuisine | Open to anything]
**Budget:** [Budget: $X-Y | Moderate: $X-Y | Splurge: $X-Y per person]
**Dietary needs:** [Restrictions or none]
**Dining occasions:** [Casual | Special dinner | Family | Romantic]

---

### Vetting Criteria Checklist

Use this checklist for every restaurant you consider. Each criterion is scored 1-5.

| # | Criterion              | Score (1-5) | What to look for                              |
|---|------------------------|-------------|-----------------------------------------------|
| 1 | Location fit           | ___         | Within 15 min walk of accommodation or activity |
| 2 | Local authenticity     | ___         | Local patrons > tourist patrons during meal hours |
| 3 | Menu quality           | ___         | Short and focused menu, seasonal items, not a 50-page laminated booklet |
| 4 | Price transparency     | ___         | Prices visible before sitting down (posted outside or online) |
| 5 | Freshness signals      | ___         | Open kitchen, displayed ingredients, daily specials |
| **Total**               | ___/25      |                                                |

### Shortlisting Process

**Step 1: Identify 5-10 candidates per meal type**
- [Source 1: Ask accommodation staff for personal favorites]
- [Source 2: Review platforms -- filter for local reviewers, last 3 months]
- [Source 3: Walk neighborhoods during meal hours -- note which are full]
- [Source 4: Ask fellow travelers for specific recommendations]

**Step 2: Quick filter (narrow to 3-5)**
Eliminate if:
- [ ] On main tourist street with outside hawkers
- [ ] Laminated photo menu with 50+ items
- [ ] Empty during local peak dining hours
- [ ] No visible prices before ordering

**Step 3: Evaluate (narrow to 1-2)**
- [ ] Recent reviews (last 3 months) are consistently positive
- [ ] Menu is focused (under 20 main dishes)
- [ ] Location fits your day plan
- [ ] Reservation available or walk-in friendly

### Restaurant Shortlist Template

| Criterion           | Restaurant A | Restaurant B | Restaurant C |
|---------------------|-------------|-------------|-------------|
| Name                | ___         | ___         | ___         |
| Cuisine             | ___         | ___         | ___         |
| Price range/person  | ___         | ___         | ___         |
| Location score (1-5)| ___         | ___         | ___         |
| Authenticity (1-5)  | ___         | ___         | ___         |
| Menu quality (1-5)  | ___         | ___         | ___         |
| Review score (1-5)  | ___         | ___         | ___         |
| Freshness (1-5)     | ___         | ___         | ___         |
| **Total**           | ___/25      | ___/25      | ___/25      |
| Reservation needed  | ___         | ___         | ___         |
| Hours               | ___         | ___         | ___         |

### Tourist Trap Red Flags

| Red flag                             | Why it matters                          | What to do instead                  |
|--------------------------------------|-----------------------------------------|-------------------------------------|
| [Red flag 1]                         | [Explanation]                           | [Better alternative approach]       |
| [Red flag 2]                         | [Explanation]                           | [Better alternative approach]       |
| [Red flag 3]                         | [Explanation]                           | [Better alternative approach]       |

### Reservation and Logistics

- **Reservation norm:** [Expected | Recommended for dinner | Walk-in culture]
- **How to reserve:** [Platform, phone, in-person at lunch for dinner]
- **Typical meal times:** Lunch: [X:XX-X:XX], Dinner: [X:XX-X:XX]
- **Payment:** [Cash | Card | Both] -- [Tipping norm from local-customs-briefing]
- **If restaurant is full:** [Waitlist process, nearby backup plan, walk-in timing]

### Allergy Communication

For dietary restrictions at [Destination]:
- [Local language phrase for "I am allergic to ___"]
- [Local language phrase for "Does this contain ___?"]
- [Recommendation for printed allergy card in local language]
```

## Rules

1. NEVER include external URLs, specific restaurant names, review platform names, or reservation service names -- use generic descriptors
2. ALWAYS include a scored vetting criteria checklist with at least 5 criteria
3. ALWAYS include a tourist trap red flag section with at least 3 specific red flags
4. Include a blank shortlist comparison template the user can fill in
5. Include reservation and logistics guidance specific to the destination's dining culture
6. NEVER recommend specific restaurants -- provide the evaluation framework for the user to make their own choices
7. Include allergy communication phrases in the local language when the destination speaks a different language
8. The shortlisting process must be a repeatable 3-step method, not a one-time list
9. NEVER output vague guidance like "look for good restaurants" -- every step must have a specific, observable criterion
10. Include meal timing norms for the destination (locals often eat at different times than tourists expect)
11. Menu quality criterion must specifically penalize oversized, multi-cuisine menus and reward focused, seasonal menus

## Edge Cases

- **Destination with limited restaurant options (small town, remote area):** Reduce the shortlist to 2-3 options. Add local food sources: markets, bakeries, street vendors, accommodation-provided meals. Lower the criteria for "authenticity" -- in small towns, the one restaurant may be the local favorite by default.

- **Strict dietary restrictions (celiac, severe allergies, vegan in non-vegan-friendly culture):** Elevate allergy communication to the top of the guide. Include a pre-trip restaurant research strategy (identify safe options before arrival). Recommend cooking accommodation (apartment with kitchen) as a backup. Include a printed allergy card in the local language.

- **Destination where street food is the primary dining culture (Southeast Asia, Mexico City, India):** Adapt the vetting criteria for street food: visible cooking process (not pre-cooked sitting), high turnover (food is fresh, not sitting), local crowd size, clean preparation area. Include a separate street food evaluation section alongside the restaurant section.

- **Fine dining or special occasion restaurant search:** Add criteria for ambiance, service style, and reservation lead time. Note that special occasion restaurants often require booking 2-4 weeks in advance. Include dress code expectations. Reduce the weight of "budget" criteria and increase "experience" criteria.

- **Family dining with young children:** Add criteria for kid-friendliness: high chairs available, kids' menu or small portions, noise tolerance, speed of service, restroom accessibility. Prioritize early dinner timing (17:30-18:30). Reduce the weight of "authentic local experience" if it conflicts with child comfort.

- **Destination where restaurant culture is unfamiliar (e.g., izakaya ordering in Japan, hawker centers in Singapore):** Add a "how it works" section explaining the local restaurant format. Cover ordering process, seating norms, payment process, and any customs that differ from the user's home culture.

## Example

**Input:** "I need help finding good restaurants in Rome for a 5-day trip. Two of us, moderate budget (about 30-50 euros per person for dinner). We love pasta and seafood. No dietary restrictions."

**Output:**

## Restaurant Finder Guide: Rome, Italy

**Cuisine focus:** Italian -- pasta, seafood, Roman specialties
**Budget:** Moderate: 30-50 EUR per person for dinner; 10-20 EUR for lunch
**Dietary needs:** None
**Dining occasions:** Casual everyday + 1 special dinner

---

### Vetting Criteria Checklist

Use this checklist for every restaurant you consider in Rome. Score each 1-5.

| # | Criterion              | Score (1-5) | What to look for                                          |
|---|------------------------|-------------|-----------------------------------------------------------|
| 1 | Location fit           | ___         | Within 15 min walk of your day's area. Avoid eating only near your hotel -- eat near your activities. |
| 2 | Local authenticity     | ___         | Italian-speaking patrons during meal hours. Menu in Italian first, translations secondary. Staff are not standing outside recruiting passersby. |
| 3 | Menu quality           | ___         | Short menu (8-12 primi, 6-8 secondi). Handwritten daily specials. No photos of every dish. Traditional Roman dishes present (cacio e pepe, carbonara, amatriciana, gricia). |
| 4 | Price transparency     | ___         | Menu posted outside or visible before sitting. No surprise "coperto" (cover charge) above 2-3 EUR. No "market price" seafood without asking the price. |
| 5 | Freshness signals      | ___         | Daily specials change. Pasta cooked to order (visible kitchen activity). Seasonal ingredients on the menu. Bread is not stale. |
| **Total**               | ___/25      |                                                            |

### Shortlisting Process

**Step 1: Identify 5-10 candidates per neighborhood**
- Ask your accommodation host: "Where do YOU eat for a weeknight dinner?" (personal, not tourist answer)
- Walk through Trastevere, Testaccio, Monti, or Pigneto neighborhoods at 20:00 and note which places are full of Italians
- Check review platforms: filter for reviews written in Italian, not English
- Ask other travelers at your accommodation for recent finds

**Step 2: Quick filter (narrow to 3-5)**
Eliminate if:
- [ ] Located directly on Piazza Navona, the Pantheon square, or facing the Colosseum (tourist premium pricing)
- [ ] Staff member standing outside calling "ciao, sit down, best pasta!" (tourist trap behavior)
- [ ] Laminated photo menu in 6 languages with 80+ dishes including sushi and burgers alongside pasta
- [ ] Empty at 20:30 on a weeknight (Romans eat late -- empty at peak is a bad sign)

**Step 3: Evaluate (narrow to 1-2)**
- [ ] Recent reviews mention specific dishes and fresh preparation
- [ ] Menu is focused on Roman cuisine (not "Italian and international")
- [ ] Location fits tomorrow's activity plan
- [ ] Reservation available or manageable walk-in wait (under 20 min)

### Restaurant Shortlist Template

| Criterion           | Restaurant A | Restaurant B | Restaurant C |
|---------------------|-------------|-------------|-------------|
| Name                | ___         | ___         | ___         |
| Neighborhood        | ___         | ___         | ___         |
| Price range/person  | ___         | ___         | ___         |
| Location score (1-5)| ___         | ___         | ___         |
| Authenticity (1-5)  | ___         | ___         | ___         |
| Menu quality (1-5)  | ___         | ___         | ___         |
| Review score (1-5)  | ___         | ___         | ___         |
| Freshness (1-5)     | ___         | ___         | ___         |
| **Total**           | ___/25      | ___/25      | ___/25      |
| Reservation needed  | ___         | ___         | ___         |
| Hours               | ___         | ___         | ___         |

### Tourist Trap Red Flags in Rome

| Red flag                                        | Why it matters                                     | What to do instead                         |
|-------------------------------------------------|----------------------------------------------------|--------------------------------------------|
| Staff standing outside recruiting diners         | Real Roman restaurants do not need to drag people in. This is a sign of overpriced, mediocre food targeting tourists. | Walk past. Look for restaurants where you need to find the door yourself. |
| Menu with photos of every dish in 6 languages   | Photo menus signal pre-made food reheated to order. Real trattorias have a handwritten or short printed menu, often only in Italian. | Choose places with concise menus, daily specials boards, or Italian-first menus. |
| Located directly facing a major monument        | Prime location = prime rent = cutting costs on food quality. The view subsidizes the meal, not the kitchen. | Walk 2-3 blocks away from any major monument. Quality improves as tourist foot traffic decreases. |
| "Menu turistico" or "fixed tourist menu"        | These set-price menus offer quantity over quality at inflated prices. They rarely include the restaurant's best dishes. | Order from the regular menu. Ask the server what they recommend. |
| Empty at 20:30-21:00 on a weeknight             | Romans eat dinner at 20:00-21:30. An empty restaurant at peak time means locals have already voted with their feet. | Check back during peak hours. A full restaurant at 20:30 is a stronger signal than any review. |

### Reservation and Logistics

- **Reservation norm:** Recommended for dinner, especially Thursday-Saturday. Walk-in is fine for lunch and weeknight casual dining.
- **How to reserve:** Call the restaurant directly (number often posted outside or on review platforms). For popular places, reserve 1-2 days ahead. Some accept in-person lunch reservations for that evening.
- **Typical meal times:** Lunch: 12:30-14:30. Dinner: 20:00-22:30. Many restaurants close between 15:00-19:00 (no food service).
- **Payment:** Cash preferred at traditional trattorias. Cards accepted at mid-range and above. Ask before ordering if card-only. Tipping: not expected in Rome. A 1-2 EUR rounding up or leaving small coins is appreciated but not required. Coperto (cover charge) of 1-3 EUR per person is standard and legal.
- **If restaurant is full:** Ask if there is a wait. 15-20 min waits are common. Ask what time tables will open. Have a backup nearby. The streets of Trastevere and Testaccio have multiple options within a 5-minute walk.

### Allergy Communication

For food allergies in Rome (Italian):
- "Sono allergico/a a ___" (SOH-no ah-LAIR-jee-ko/kah ah ___) = I am allergic to ___
- "Contiene ___?" (kon-TYEH-neh ___?) = Does this contain ___?
- Common allergens: glutine (gluten), latticini (dairy), noci (nuts), frutti di mare (shellfish)
- Italian restaurants take allergies seriously when communicated clearly. Mention allergies when ordering, not after the food arrives.
