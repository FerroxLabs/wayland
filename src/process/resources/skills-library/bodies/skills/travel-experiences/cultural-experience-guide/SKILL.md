---
name: cultural-experience-guide
description: |
  Creates a cultural site prioritization and visit planning framework for
  travel destinations. Produces ranked site lists with visit timing, etiquette
  notes, and logistical details. Use when the user asks about planning cultural
  visits abroad, prioritizing museums and historical sites, understanding local
  cultural practices, or creating a culture-focused travel day. Do NOT use for
  general itinerary building (use trip-itinerary-builder), local food
  experiences (use food-tourism-planner), or walking tour creation (use
  city-walking-tour-builder).
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
# Cultural Experience Guide

## When to Use

Use this skill when the user's request centers on evaluating, prioritizing, and planning visits to cultural sites -- museums, temples, mosques, churches, palaces, archaeological ruins, historic quarters, indigenous heritage sites, traditional craft workshops, performing arts venues, and ceremonial spaces.

**Specific trigger scenarios:**
- User asks which cultural sites in a destination are worth visiting and how to rank them against limited time
- User wants to understand entry protocols, dress codes, or behavioral expectations at religious or heritage sites
- User asks about the difference between guided and self-guided visits for major cultural landmarks
- User is planning a single culture-focused day or half-day within a larger trip
- User wants to know optimal visit times to avoid crowds at specific museums or heritage sites
- User is researching a destination's cultural landscape before departure to build informed expectations
- User asks about skip-worthy versus unmissable experiences at a specific cultural destination
- User wants to understand how to engage respectfully with living cultural traditions (ceremonies, religious observances, artisan communities)
- User has mobility, budget, or time constraints and needs a curated short list rather than a complete site inventory

**Do NOT use when:**
- User needs a complete multi-day city itinerary with hotels, restaurants, and logistics woven together -- use `trip-itinerary-builder` instead
- User's primary interest is food culture, night markets, or culinary traditions -- use `food-tourism-planner` instead
- User wants a self-guided walking tour with turn-by-turn directions through neighborhoods -- use `city-walking-tour-builder` instead
- User only needs a customs and etiquette briefing without site recommendations -- use `local-customs-briefing` instead
- User is asking about adventure or outdoor activities even if culturally adjacent (trekking to ruins counts as outdoor adventure, not cultural visit planning)
- User needs visa, insurance, or safety travel advice -- those are separate compliance and safety skills

---

## Process

### Step 1: Gather Destination and Interest Profile

Before generating any recommendations, collect the following from the user. If the user has provided partial information in their initial message, fill in what you can and ask only for the genuinely missing critical inputs.

- **Destination specificity:** City, district, or region. Vague answers like "Japan" or "Southeast Asia" require clarification before proceeding -- the skill requires a specific geographic unit where you can meaningfully identify 10-15 cultural sites.
- **Available days for cultural visits:** Not total trip length -- specifically how many days or half-days the user intends to allocate to cultural activities. If unknown, assume one cultural day per two travel days as a default.
- **Cultural interest taxonomy:** Present the user with the following categories and ask them to rank top 2-3: ancient history and archaeology, religious and spiritual architecture, fine and decorative arts, military and political history, indigenous and pre-colonial heritage, contemporary art and design, performing arts (music, theater, dance), folk traditions and living culture (festivals, craft workshops), colonial and modern history.
- **Prior knowledge level:** First-time visitor with no background, returning visitor who has done the basics, or a studied traveler with specific knowledge gaps. This determines whether you recommend foundational sites or secondary deep-dive experiences.
- **Physical considerations:** Walking endurance (can comfortably walk 8+ km, limited to 3-4 km, significant mobility limitation), stair tolerance, heat sensitivity (relevant for outdoor sites in tropical climates), and whether children or elderly travelers are in the group.
- **Budget tier:** Free-to-low (under $10/person/day on entry fees), moderate ($10-30), high ($30-80 including premium guided tours), or unlimited (private guide, exclusive access experiences). Clarify currency if the destination uses a non-obvious local currency.
- **Group composition:** Solo traveler, couple, family with children (ages matter -- under 6 vs. 6-12 vs. teenagers), adult group. This affects pacing, site selection (interactive vs. contemplative), and whether guided tours make sense.
- **Language capacity:** Fluent in local language, conversational, basic phrases only, or English-only. This affects how much you recommend audio guides, translation apps, or guided tours.
- **Trip timing relative to departure:** If the user is departing within 2 weeks, flag advance booking urgency immediately for any site requiring tickets.

### Step 2: Compile the Cultural Site Inventory

Research and list 10-15 cultural sites and experiences for the destination. For each site in the inventory, document all of the following fields:

- **Site name and category:** Use precise category labels -- do not call everything a "landmark." Use: archaeological site, UNESCO World Heritage Site, living religious site, museum (art/history/science/ethnographic), palace/royal residence, fortress/castle, historic quarter or district, indigenous cultural center, artisan cooperative, traditional theater venue, site of historical atrocity/memorial, sacred natural site.
- **Core cultural significance:** One sentence that communicates WHY this site matters culturally or historically, not just that it is famous. "Angkor Wat is the world's largest religious monument, built as a Hindu cosmological model in the 12th century before transitioning to a Buddhist site" is useful. "A famous temple in Cambodia" is not.
- **Visit duration range:** Express as minimum (speed walk / highlights only) and recommended (full engagement). Example: "45 minutes minimum / 2.5 hours recommended." Many travelers underestimate duration because they read the minimum and pack in too many sites.
- **Entry cost:** Local currency first, USD equivalent second. Note whether the cost includes access to all areas or whether premium sections (treasury rooms, rooftop access, special exhibitions) cost extra. Note whether tickets are purchased on-site or exclusively online.
- **Crowd pattern:** Low season vs. high season timing, best days of the week, best hours of the day. Most major sites follow a predictable pattern: peak crowds arrive 30-45 minutes after opening as tourists emerge from hotels, thin during midday heat, peak again at 3-4 PM as afternoon tours arrive. Early morning advantage is almost universal.
- **Accessibility rating:** Fully accessible (elevator, ramps, accessible toilets), partially accessible (ground floor only, uneven surfaces), limited (significant stairs, unpaved paths, no accommodations), inaccessible for wheelchair users. Note specific barriers where known.
- **Dress and behavioral requirements:** Be precise. "Covered shoulders and knees" is clear. "Modest dress" is not. Note whether head coverings are required for women only, men only, or all visitors. Note shoe removal requirements. Note whether loaner sarongs or cloaks are available at the entrance (common at Southeast Asian temples and some mosques). Note photography restrictions per zone, not just a blanket rule.
- **Booking requirements:** Walk-in, timed entry ticket (book online 24-48 hours ahead), advance reservation required (book 1-4 weeks ahead), or pre-book months ahead (major sites like the Vatican Museums, Uffizi Gallery, Sagrada Família, and Versailles during peak season). Note the official booking channel.
- **Language of interpretation:** Whether on-site signage, audio guides, and exhibits are available in the visitor's language. Note whether audio guides must be rented, downloaded, or are included in admission.

### Step 3: Apply the Three-Axis Prioritization Framework

Score every site in the inventory on three axes and calculate a composite priority score. This framework prevents the common mistake of recommending only the most famous sites regardless of fit.

**Axis 1 -- Uniqueness (weight: x2, max 5 per axis)**
Ask: can this cultural experience be replicated elsewhere in the world, or at other points in this trip?
- 5: Globally singular -- this experience exists nowhere else (the Acropolis, Petra, Angkor Wat, the Forbidden City)
- 4: Nationally unique -- the best example of its type in this country but comparable examples exist internationally
- 3: Regionally notable -- among the best in this region but not nationally definitive
- 2: Locally significant -- interesting in context but comparable to sites in many other destinations
- 1: Generic -- a fine arts museum, a city history museum, a war memorial of the type found in nearly every major city

**Axis 2 -- Personal Relevance (weight: x1, max 5)**
Ask: how directly does this site address the user's top stated interests?
- 5: Core interest match -- the user specifically named this type of site or this period/tradition
- 4: Strong adjacency -- closely related to a stated interest
- 3: Moderate relevance -- broadens the cultural picture but not central to stated interests
- 2: Weak relevance -- interesting but unlikely to resonate deeply with this user's profile
- 1: Mismatch -- belongs to a category the user did not list or explicitly de-prioritized

**Axis 3 -- Logistics Score (weight: x1, max 5)**
Ask: how practical is this visit given the user's stated time, budget, accessibility, and booking situation?
- 5: Easy and affordable -- walk-in, low cost, centrally located, no special preparation needed
- 4: Minor friction -- affordable with some pre-planning (online ticket, one transit connection)
- 3: Moderate complexity -- requires advance booking, half-day commitment, or above-budget cost
- 2: Significant barrier -- requires months-ahead booking, expensive, far from base, or physically demanding for this user
- 1: Effectively inaccessible -- sold out, incompatible with mobility needs, requires special credentials or connections

**Composite score formula:**
(Uniqueness x 2) + Personal Relevance + Logistics Score = Priority Score (maximum 20)

Sites scoring 16-20 are Tier 1 (strongly recommend). Sites scoring 11-15 are Tier 2 (recommend if time permits). Sites scoring 10 or below are Tier 3 (skip unless the user has specific reasons). Present the top 5-8 sites as the recommended shortlist, with the full ranked table included for the user's reference.

### Step 4: Plan Visit Logistics for Each Recommended Site

For every site in the recommended shortlist, provide:

- **Optimal visit window:** Not just "morning" -- specify a time range. "Arrive by 8:15 AM, 15 minutes before the 8:30 AM official opening" is actionable. Explain why this window is optimal (crowd avoidance, lighting conditions, temperature, alignment with religious hours, guided tour departure times).
- **Transportation from central accommodation:** Specify the transit mode, route or line name, approximate travel time, and approximate cost. For cities with complex transit, name the specific station or stop. If walking is feasible (under 25 minutes), say so and note approximate distance.
- **Booking action required:** State clearly whether the user needs to take action now. If advance booking is required, give a concrete lead time (e.g., "book at least 2 weeks ahead in April, tickets sell out by Monday of the prior week in peak season"). Do not assume the user will figure out the urgency.
- **Visit sequence within the site:** For large sites (major museums, archaeological complexes), note which galleries or sections to prioritize if time is short, which sections tend to be most crowded and when to visit them, and what to skip if fatigued.
- **Clustering logic:** Group sites by geographic proximity. Identify which sites are within 15 minutes of each other and can be paired in a morning or afternoon. Do not build a day that requires crossing the city four times.
- **Fatigue management:** Flag when a site is physically intensive (extensive walking, outdoor heat exposure, long stair climbs) and schedule it earlier in the day when energy is higher. Schedule shorter or more passive experiences (a garden, a market, a performance) after intensive sites.

### Step 5: Build Etiquette and Cultural Preparation Notes

This section serves two functions: practical preparation (avoid being turned away at the entrance) and respectful engagement (avoid causing offense or disrupting living communities).

**Site-specific requirements:**
- Document dress code requirements in specific terms: which body parts must be covered, to what length, for which gender, and whether the requirement is enforced (guards at the gate) or advisory.
- Photography rules should be noted at the zone level where possible. Many sites allow photography in courtyards but not in inner sanctuaries. Some allow photography of objects but not of worshippers. Specify.
- Note behavioral expectations that may surprise Western visitors: removing shoes before entering even outdoor temple platforms (common in Southeast Asia), not turning your back to a sacred image when exiting (Buddhist and Hindu temples), not pointing the soles of feet toward sacred objects (Southeast and South Asian cultures), the specific gestures for greeting monks or clergy, restrictions on women touching or approaching certain sacred objects (some Shinto shrines, Orthodox Christian altars).
- Note tipping conventions that apply specifically to cultural contexts: tipping guides in countries where this is expected vs. offensive, donations at religious sites (amount, placement, whether it is genuinely voluntary or socially pressured).

**Language preparation:**
- Provide 5-8 phrases specific to cultural site contexts in the local language: greeting, thank you, "may I take a photo?", "I'm sorry" (for accidental transgressions), "where is the entrance/exit?", "how much does this cost?", and any phrases specific to religious or ceremonial contexts (e.g., a respectful greeting for a monk or a prayer hall).
- Include phonetic pronunciation -- not linguistic romanization notation but actual spoken approximations a native English speaker can produce adequately.
- Note where English is reliably available (international destinations, UNESCO sites) vs. where it is uncommon and preparation matters more.

**Common visitor mistakes:**
- Identify the 3-5 most common mistakes tourists make at these specific sites and frame them preventively. These should be based on the actual destination -- not generic "be respectful" advice. At many popular temples in Thailand, the most common mistake is wearing shorts; at the Vatican, it is attempting to enter without confirmation tickets in hand; at Angkor Wat, it is visiting the main temple during the midday heat when every other tourist is also there and surfaces are at 45°C.

### Step 6: Address Guided vs. Self-Guided Decision

For each recommended site, make a specific recommendation about whether the user should hire a guide, use an audio guide, use a self-guided approach, or join a group tour. Use the following decision criteria:

**Hire a licensed local guide when:**
- The site's significance is not well-communicated through on-site signage (common at archaeological sites and indigenous cultural centers)
- The site involves access to areas not open to self-guided visitors (inner sanctuaries, restricted floors, private collections)
- The user has expressed strong interest depth that exceeds what a tour provides
- The site involves a living culture where local interpretation prevents misunderstanding (village visits, craft workshops, ceremonial sites)
- The group composition includes children who would benefit from a storyteller rather than a sign-reader

**Use an audio guide when:**
- The site has well-developed audio content (most major European and North American museums)
- The user prefers to move at their own pace but wants expert interpretation
- Budget does not support a private guide
- Note: premium audio apps (Bloomberg Connects, official museum apps, Rick Steves Audio Europe for European sites) are often superior to rented on-site devices

**Self-guided is sufficient when:**
- The site's significance is visceral and visual -- extensive interpretation would detract rather than add (Fushimi Inari's torii path, a medieval old town, a viewing pavilion)
- The user has prior knowledge and is visiting to deepen rather than build understanding
- The site has excellent multilingual on-site signage

**Avoid group tours when:**
- Crowd separation is a priority (the tour arrives with 40 other tourists)
- The user's pace and interests diverge significantly from the group format
- The user is visiting early morning specifically for crowd avoidance -- a guided group tour often defeats this purpose

### Step 7: Assemble the Complete Cultural Visit Plan

Combine all preceding outputs into a structured day-by-day schedule that respects:

- **Two-major-site maximum per day.** A major site is defined as any site requiring 90 minutes or more of recommended visit time. Supplementing with one or two minor sites (a market, a short temple, a viewpoint) is fine, but more than two major sites produces cultural fatigue and reduces engagement quality for all sites visited.
- **Alternation of intensity.** Do not schedule two intensive, information-heavy sites on consecutive days without a lighter cultural experience as relief. A museum followed by a palace followed by an archaeological site over three days will produce diminishing returns by day three.
- **Morning prime time for top-ranked sites.** Sites ranked 1-3 should always be scheduled in the early morning slot to capture optimal conditions and avoid crowds. Save mid-tier sites for afternoons.
- **Weather and seasonality context.** Note if the travel month affects any specific site (monsoon season flooding a courtyard, cherry blossom season adding viewing value, Ramadan changing mosque access hours, summer solstice drawing large crowds to Stonehenge, etc.).
- **Buffer capacity.** Leave at least one half-day unscheduled in a 5-day cultural trip. Cultural sites frequently reveal unexpected depth, and the most memorable experiences often come from time given to linger or explore unexpected discoveries.

---

## Output Format

```
## Cultural Experience Plan

**Destination:** [City, Country]
**Travel Dates:** [Month/dates] -- [season notes if relevant]
**Cultural Focus:** [Ranked interest areas from user input]
**Group:** [Composition, mobility notes]
**Budget for Culture:** [Tier + daily estimate per person]
**Days Available for Cultural Visits:** [Number]

---

### Full Site Inventory and Priority Scores

| Rank | Site | Category | Uniqueness (x2) | Relevance | Logistics | Score /20 | Min Duration | Rec Duration | Cost (local) | Cost (USD ~) |
|------|------|----------|-----------------|-----------|-----------|-----------|-------------|-------------|------------|------------|
| 1 | [Site name] | [Category] | [1-5] | [1-5] | [1-5] | [score] | [min] | [rec] | [local currency] | [$USD] |
| 2 | [Site name] | [Category] | [1-5] | [1-5] | [1-5] | [score] | [min] | [rec] | [local currency] | [$USD] |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Tier 1 (Score 16-20):** [Site names] -- strongly recommend
**Tier 2 (Score 11-15):** [Site names] -- recommend if time permits
**Tier 3 (Score ≤10):** [Site names] -- skip unless specific interest

---

### Recommended Site Profiles

#### [Rank]. [Site Name] -- [Score/20]
**Category:** [Precise category]
**Cultural Significance:** [2-3 sentence explanation of why this site matters historically or culturally -- not just that it is famous]

**Logistics at a Glance**
| Factor | Detail |
|--------|--------|
| Best arrival time | [Specific time window with reason] |
| Visit duration | [Minimum] -- [Recommended] |
| Entry cost | [Local currency] (~$[USD]) |
| Premium areas | [Any add-on costs for inner sections, towers, audio guide] |
| Booking required | [Walk-in / Online 48hr ahead / Book 2+ weeks ahead / Book months ahead] |
| Getting there | [Transit line or route, time from central area, cost] |
| Accessibility | [Rating: Full / Partial / Limited -- specific barriers] |
| Guided vs. self | [Specific recommendation for this site] |

**What to See First:** [If a large complex, the sequence that maximizes the visit]
**Skip if Short on Time:** [What to cut without missing the essential experience]
**Dress Code:** [Specific requirements -- body parts, lengths, gender-specific rules]
**Photography Rules:** [Zone-by-zone if applicable]
**Insider Notes:** [2-3 specific tips that make the difference between a mediocre and excellent visit]
**Pair With:** [Nearby site for same-day clustering, and why they work together]

[Repeat for each recommended site, Ranks 1 through 5-8]

---

### Guided vs. Self-Guided Decision Summary

| Site | Recommendation | Reasoning | Estimated Guide Cost |
|------|---------------|-----------|----------------------|
| [Site 1] | [Private guide / Audio guide / Self-guided / Group tour] | [Specific reason] | [Cost or N/A] |
| [Site 2] | [Private guide / Audio guide / Self-guided / Group tour] | [Specific reason] | [Cost or N/A] |

---

### Etiquette and Cultural Preparation

#### Dress Code Requirements by Site

| Site | Requirement | Gender-Specific? | Loaners Available? | Enforcement |
|------|-------------|-----------------|---------------------|-------------|
| [Site 1] | [Specific requirements] | [Yes/No -- detail] | [Yes/No] | [Strict/Advisory] |
| [Site 2] | [Specific requirements] | [Yes/No -- detail] | [Yes/No] | [Strict/Advisory] |

#### Photography Rules by Site

| Site | General Rule | Restricted Zones | Flash Allowed | Video Allowed |
|------|-------------|-----------------|---------------|---------------|
| [Site 1] | [Overall rule] | [Specific no-photo zones] | [Yes/No] | [Yes/No] |

#### Behavioral Expectations

| Context | Correct Behavior | Common Tourist Mistakes | Why It Matters |
|---------|-----------------|------------------------|----------------|
| [Entering religious site] | [Specific actions] | [What tourists get wrong] | [Cultural/religious significance] |
| [Interacting with clergy or ritual practitioners] | [Specific actions] | [Common mistakes] | [Significance] |
| [Photography of people] | [Correct approach] | [Common mistakes] | [Why] |
| [Donations and tipping] | [Amount, placement, convention] | [Common mistakes] | [Why] |

#### Essential Phrases

| English | [Local Language] | Phonetic | When to Use | Notes |
|---------|-----------------|----------|-------------|-------|
| Excuse me | [translation] | [pronunciation] | [context] | [gender/formality notes if applicable] |
| Thank you (formal) | [translation] | [pronunciation] | [context] | [notes] |
| May I take a photo? | [translation] | [pronunciation] | [context] | [notes] |
| I'm sorry | [translation] | [pronunciation] | [context] | [notes] |
| Where is the entrance? | [translation] | [pronunciation] | [context] | [notes] |
| How much does this cost? | [translation] | [pronunciation] | [context] | [notes] |
| [Context-specific phrase] | [translation] | [pronunciation] | [context] | [notes] |

#### Top 5 Mistakes to Avoid at These Specific Sites
1. [Specific mistake with this destination -- consequence and prevention]
2. [Specific mistake -- consequence and prevention]
3. [Specific mistake -- consequence and prevention]
4. [Specific mistake -- consequence and prevention]
5. [Specific mistake -- consequence and prevention]

---

### Day-by-Day Cultural Schedule

| Day | Time | Activity | Site | Duration | Notes |
|-----|------|----------|------|----------|-------|
| [Day 1] | 8:00 AM | [Site name] | [Category] | [X hrs] | [Key logistics note] |
| [Day 1] | 11:00 AM | Transit + lunch | -- | 1.5 hrs | [Suggested lunch area] |
| [Day 1] | 1:00 PM | [Site name] | [Category] | [X hrs] | [Key logistics note] |
| [Day 1] | Evening | [Light cultural activity] | -- | [X hrs] | [Optional] |
| [Day 2] | ... | ... | ... | ... | ... |

**Pacing Notes:**
- [Any day-specific note about physical intensity, weather exposure, or timing sensitivities]
- [Note any advance booking actions the user must take before these days]

---

### Cultural Experience Budget

| Site | Entry (per person) | Premium Add-ons | Guide/Audio | Transport | Daily Total (2 people) |
|------|--------------------|-----------------|-------------|-----------|----------------------|
| [Site 1] | [cost] | [optional cost] | [cost or N/A] | [cost] | [$X] |
| [Site 2] | [cost] | [optional cost] | [cost or N/A] | [cost] | [$X] |
| **TOTAL** | | | | | **[$X]** |

**Per-person total:** $[X] over [N] days (~$[X]/day per person)
**Budget assessment:** [Does this fit the stated budget tier? What are the optional upgrades available?]

---

### Advance Booking Action List

| Site | Booking Required | Lead Time | Platform | Action by [Date] |
|------|-----------------|-----------|----------|------------------|
| [Site 1] | [Yes/No] | [How far ahead] | [Official site/app] | [Specific action] |
| [Site 2] | [Yes/No] | [How far ahead] | [Official site/app] | [Specific action] |
```

---

## Rules

1. **Never recommend a cultural site without explaining its specific significance.** Saying "the Louvre is a world-famous art museum" teaches the user nothing. Explaining that the Louvre's Denon Wing houses the chronological development of Western European painting from Byzantine altarpieces through Neoclassicism -- and that this single wing alone requires 2 hours to do justice to -- gives the user something to work with.

2. **Always apply the three-axis scoring framework before presenting recommendations.** Subjective rankings based on what "most visitors see" reproduce tourist trap itineraries rather than user-optimized plans. Every site must have a score, and the score must reflect the specific user's interests and constraints, not a generic visitor profile.

3. **Never use the word "modest" without defining it.** "Modest dress" means entirely different things in a Buddhist temple in Thailand (knees and shoulders), a mosque in Morocco (full-length sleeves, headscarf for women), a Catholic basilica in Rome (covered shoulders), and a Shinto shrine in Japan (no restrictions). Specify exactly what must be covered, to what length, and for which gender.

4. **Always distinguish between enforced dress codes and advisory ones.** Many religious sites have dress requirements that are culturally important but not enforced at the gate -- a visitor wearing shorts will enter but will cause offense. Others will physically turn away non-compliant visitors. This distinction matters for trip planning and should be stated explicitly.

5. **Cap cultural recommendations at 2 major sites per day and defend this limit if the user pushes back.** Research on museum fatigue shows that cognitive engagement drops significantly after 2-3 hours of active cultural absorption. A visitor who spends 3 hours at two sites is far more engaged and retentive than one who speed-walks through five. Hold this limit firmly and explain the reasoning.

6. **Never assume advance booking availability.** During peak travel seasons (spring and fall in Europe, December-January in Southeast Asia, summer everywhere), timed entry tickets for top sites sell out days or weeks ahead. Always check and state the required lead time specifically, not generically. "Book ahead" is not useful -- "book at least 3 weeks ahead for April visits; tickets open 60 days in advance on the official site" is useful.

7. **Always flag photography restrictions at the zone level, not just site level.** A blanket "photography allowed" note for a site that prohibits photography in its inner sanctuary or treasury will cause the user to inadvertently violate rules that may result in film deletion or ejection. When in doubt, state "verify photography rules at each gallery or hall entrance."

8. **Always provide the booking channel, not just the booking requirement.** "Book online" is incomplete. Name the official booking platform (the museum's own site, the national heritage trust website, a specific government ticketing portal). This prevents users from buying through third-party resellers at inflated prices or with non-refundable terms.

9. **Match the guided tour recommendation to the actual site conditions.** A well-signed, well-documented site with excellent multilingual interpretation (most major Smithsonian museums, the British Museum, the Rijksmuseum) does not need a private guide for a general visitor. An archaeological site with minimal on-site interpretation (Tikal, Hampi, Samarkand's Registan without good signage) benefits enormously from a licensed local guide. Make the specific case for or against a guide at each site.

10. **Include a buffer day or half-day in any plan of 4 or more days.** Cultural travel produces unexpected depth -- a conversation with a local expert, an extended stay in a gallery wing you did not plan for, or a spontaneous encounter with a festival or ceremony. A fully packed schedule with no flex punishes the user for seizing the best experiences of the trip. State the buffer day explicitly in the schedule and explain its purpose.

11. **Present entry fees in local currency first, USD second.** Local currency is what the traveler will encounter at the gate. USD conversion gives a benchmark for budget assessment. Never present costs in USD alone -- this creates confusion and potential underpreparedness when the user arrives.

12. **Distinguish between a living religious site and a heritage tourism site.** A temple that is actively used for daily worship has different protocols than a temple preserved as a museum. At living religious sites, visitor behavior directly affects the experience of worshippers. At heritage sites, restrictions are more about preservation than active piety. This distinction affects how you frame etiquette guidance.

---

## Edge Cases

### Religious Sites with Restricted Access by Gender, Caste, or Faith

Some religious sites restrict access entirely or partially based on visitor characteristics that cannot be modified. The inner sanctuary of Puri Jagannath Temple in Odisha, India, is restricted to Hindus only. The Western Wall in Jerusalem has gender-separated prayer sections. Parts of Mount Athos in Greece are restricted to men with a special permit (the diamonitirion) issued in limited daily quantities. Several mosques restrict access during the five daily prayer times, closing to tourists for 20-30 minutes at each prayer hour.

Handle this edge case by: documenting the restriction clearly and without euphemism, identifying which portions of the site (if any) are accessible to all visitors, suggesting nearby alternative sites if the primary site is fully inaccessible to the user's group, and noting any official process for obtaining special access where applicable. Never omit a site from the inventory because of access restrictions -- note them transparently and let the user decide.

### High-Demand Sites Requiring Months-Ahead Booking

Sites in this category include Sagrada Família (Barcelona) during summer -- up to 3 months ahead for specific time slots; the Uffizi Gallery (Florence) during spring -- 2-4 weeks ahead minimum; the Sistine Chapel and Vatican Museums -- 3-6 weeks ahead during Easter season; Angkor Wat sunrise photography spots during December-February -- no formal booking but arrival by 4:30 AM required. The Palace of Versailles on summer weekends requires booking the morning before at minimum.

When the user's departure is within the advance booking window and a priority site may be sold out:
- Recommend checking the official site immediately for remaining availability
- Note whether cancellation tickets are available and at what frequency (Uffizi cancellations appear regularly, often releasing 48-72 hours before the visit date)
- Provide a specific alternative site rated closest to the sold-out site on the uniqueness axis -- if the Uffizi is sold out, the Accademia Gallery (David) is a strong alternative with less advance demand
- Flag queue arrival times for walk-up attempts at sites that hold a small portion of daily tickets for on-site purchase (many French national museums release 10-15% of daily tickets at the gate as first-come walk-up entries)

### Traveler with Mobility Limitations

Mobility limitations range from mild (prefers elevators, limited stair tolerance) to significant (wheelchair user, cannot walk more than 500 meters without rest). Each affects site eligibility differently.

Document the specific access conditions for each recommended site: total walking distance through the site (many large museums exceed 3 km of walking), availability of wheelchairs for loan or rent on-site, elevator availability vs. stairs-only access between floors, surface conditions (smooth marble vs. cobblestone vs. unpaved paths), and proximity of accessible drop-off points. Many ancient and archaeological sites (Machu Picchu, the Acropolis, Pompeii) have severely limited wheelchair access that is not obvious from promotional materials.

For travelers with significant mobility limitations: prioritize sites with a high significance-to-physical-effort ratio (major urban museums are typically excellent; hilltop temples and ruins are typically poor), note the accessible entrance location separately from the main entrance (it is often different and not well-signed), and identify which site sections are accessible so the user can make an informed choice about partial visits rather than skipping the site entirely.

### Family Travel with Children Under 8

Young children change the calculus of cultural site planning in three ways: duration tolerance (30-50% reduction from recommended adult visit duration), behavioral environment compatibility (silence requirements, fragile objects, no running spaces), and engagement format (interactive exhibits, tactile elements, and outdoor spaces hold attention better than flat paintings and vitrines).

For families with children under 8: lead with sites that have outdoor components (archaeological sites, palace gardens, open-air traditional villages) or strong interactive elements (science museums, ethnographic museums with hands-on zones, living history sites). Schedule major museums for the morning, not the afternoon -- children's energy and patience are highest in the first two hours after breakfast. Break visits after 60-75 minutes for a snack or outdoor activity. Note which sites have stroller-accessible routes (many do, but require entering through the accessibility entrance). Flag sites where silence is strictly enforced and the family should self-assess their child's readiness.

For children aged 8-12, the full recommended approach works with minor modifications: brief story-based framing before each site ("this palace was built by a king who had 600 wives and spent 40 years creating it") sustains engagement. Audio guide use is often effective with older children. Duration tolerance approaches adult levels for strongly themed sites.

### Traveling During a Major Festival or Religious Observance

Local festivals and religious observances create two opposite effects: some sites become more extraordinary to visit (witnessing a live ceremony at a temple during a festival, seeing a city transformed by Diwali illuminations, attending a traditional performance in a historic venue during a cultural festival), while others become effectively inaccessible (sites closed for major holidays, mosques overwhelmed with worshippers during Eid, Buddhist temples packed to capacity during Vesak).

When the user's travel dates overlap with a significant local observance:
- Identify which of the recommended sites will be affected and in which direction (enhanced vs. impaired access)
- Adjust the schedule to front-load sites that will be more crowded or closed, scheduling them for earlier in the trip before the observance begins
- Add the festival or observance itself to the cultural inventory and score it -- a major religious festival or cultural event often rates 5 on uniqueness and is worth reshaping a day around
- Note any specific etiquette requirements that apply during the observance period (Ramadan etiquette in Muslim-majority countries applies beyond just mosque visits; behavior in public, eating and drinking in public, dress standards in any public space are all affected)

### The "Skip the Famous One" Dilemma

Frequently, a destination's most visited site has become so crowded and commercialized that the cultural experience is degraded. The Mona Lisa in the Louvre is almost universally described as disappointing by visitors due to crowd density and distance. The Trevi Fountain at noon in summer is almost inaccessible. The top deck of Sacré-Coeur often involves a 90-minute queue.

When a globally famous site ranks below a less-known alternative on the scoring framework, do not override the framework simply because the famous site "should" be recommended. Explain transparently: "The Louvre's Venus de Milo and Winged Victory of Samothrace rival the Mona Lisa in art-historical significance and are typically viewable without a crowd. If your primary interest is the Mona Lisa specifically, visit on a Tuesday at 9:00 AM and expect to view from 5-6 meters behind a rope. If your interest is Renaissance painting more broadly, the Denon Wing's French, Spanish, and Italian galleries offer a superior experience with a fraction of the crowd." Give the user an informed choice rather than a default recommendation.

### Sensitive and Atrocity Heritage Sites

Sites memorializing historical atrocities (Auschwitz-Birkenau, the Killing Fields of Choeung Ek, the Apartheid Museum in Johannesburg, Hiroshima Peace Memorial Park, Srebrenica Memorial) require different preparation and handling than conventional cultural sites. These sites are simultaneously among the most historically significant and emotionally demanding cultural experiences available to a traveler.

When recommending these sites: provide a clear advance emotional preparation note -- these visits are often described as among the most impactful of a traveler's life, and that impact is not uniformly positive in the short term. Note specific behavioral requirements (silence throughout at Auschwitz; no photography of human remains at Choeung Ek; no smiling or casual photographs at memorial sites). Note whether guided tours are recommended (almost always yes for atrocity sites -- local guides provide historical context that transforms the experience from observing to understanding). Note approximate emotional duration: most visitors find they need 30-60 minutes of quiet or decompression time after an intensive atrocity heritage visit, and this should be built into the schedule as a non-negotiable buffer.

---

## Example

**Input:** "I'm going to Istanbul for 4 days in October with my partner. We're both really interested in Byzantine history and Islamic architecture -- that's our main thing. We've never been to Turkey. Neither of us speaks Turkish but we can learn a few phrases. Budget is moderate -- maybe $20-30 per person per day for entry fees and guides. We're both healthy and fine with walking."

---

## Cultural Experience Plan

**Destination:** Istanbul, Turkey
**Travel Dates:** October (4 days) -- excellent timing: post-summer crowds, mild weather (~18°C), Bosphorus in autumn light
**Cultural Focus:** Byzantine history (primary), Islamic architecture (primary)
**Group:** Couple, healthy adults, comfortable walking, English-only with phrase preparation
**Budget for Culture:** Moderate -- $20-30 per person per day (~$160-240 total for 4 days, 2 people)
**Days Available for Cultural Visits:** 4 full days

---

### Full Site Inventory and Priority Scores

| Rank | Site | Category | Uniqueness (x2) | Relevance | Logistics | Score /20 | Min | Rec | Cost (TRY ~) | Cost (USD ~) |
|------|------|----------|-----------------|-----------|-----------|-----------|-----|-----|------------|------------|
| 1 | Hagia Sophia | Living religious/Byzantine monument | 5 | 5 | 4 | 19 | 45 min | 2 hr | Free (mosque) | Free |
| 2 | Topkapi Palace Complex | Ottoman palace/imperial museum | 5 | 4 | 4 | 18 | 1.5 hr | 3.5 hr | ~680 TRY | ~$21 |
| 3 | Chora Church (Kariye Mosque) | Byzantine mosaic church | 5 | 5 | 3 | 18 | 1 hr | 2 hr | ~400 TRY | ~$12 |
| 4 | Basilica Cistern | Late Roman/Byzantine underground cistern | 5 | 5 | 5 | 20 | 45 min | 1.5 hr | ~400 TRY | ~$12 |
| 5 | Blue Mosque (Sultan Ahmed) | Ottoman mosque | 5 | 4 | 5 | 19 | 30 min | 1 hr | Free | Free |
| 6 | Archaeological Museum Complex | Byzantine/classical archaeology | 4 | 5 | 4 | 17 | 1.5 hr | 3 hr | ~500 TRY | ~$15 |
| 7 | Grand Bazaar | Ottoman commercial heritage | 3 | 2 | 5 | 13 | 45 min | 2 hr | Free entry | Free |
| 8 | Süleymaniye Mosque | Ottoman mosque/Sinan masterwork | 4 | 4 | 5 | 17 | 30 min | 1 hr | Free | Free |
| 9 | Istanbul Modern | Contemporary Turkish art | 2 | 2 | 4 | 10 | 1 hr | 2 hr | ~400 TRY | ~$12 |
| 10 | Galata Tower | Genoese medieval tower | 3 | 3 | 3 | 12 | 30 min | 45 min | ~600 TRY | ~$18 |

**Tier 1 (16-20):** Basilica Cistern, Hagia Sophia, Blue Mosque, Topkapi Palace, Chora Church, Süleymaniye Mosque, Archaeological Museum
**Tier 2 (11-15):** Grand Bazaar, Galata Tower
**Tier 3 (≤10):** Istanbul Modern (skip -- low relevance to stated interests)

---

### Recommended Site Profiles

#### 1. Basilica Cistern -- Score 20/20
**Category:** Late Roman/Byzantine underground cistern
**Cultural Significance:** Built by Emperor Justinian I in 532 CE to supply water to the Great Palace of Constantinople, the Basilica Cistern is the largest surviving Byzantine subterranean structure in Istanbul. Its 336 marble columns -- many recycled from earlier Roman temples -- support a vaulted brick ceiling over a flooded chamber. Two Medusa heads used as column bases in the northwest corner are among the most discussed examples of Byzantine repurposing of classical material. It illustrates the engineering ambition of the Justinianic building program at the same moment Hagia Sophia was being constructed above ground.

**Logistics at a Glance**
| Factor | Detail |
|--------|--------|
| Best arrival time | 9:00 AM at opening -- afternoon crowds are dense and the walkways narrow |
| Visit duration | 45 minutes minimum / 1.5 hours recommended |
| Entry cost | ~400 TRY (~$12 USD) per person |
| Premium areas | No add-on costs; recently renovated (2022) with improved lighting and walkways |
| Booking required | Online purchase recommended; walk-up available but lines form after 11 AM in October |
| Getting there | 5-minute walk from Hagia Sophia and Blue Mosque -- cluster all three in Sultanahmet |
| Accessibility | Fully accessible; elevator and ramp access after recent renovation |
| Guided vs. self | Self-guided is excellent; the audio tour included with recent renovation is high quality |

**What to See First:** Walk to the northwest corner immediately upon entering -- the two Medusa column bases are the most significant archaeological elements and are easiest to view before crowds fill the walkways.
**Skip if Short on Time:** The central walkway view of the full cistern is the essential experience -- if pressed, view the Medusa heads and take in the ceiling from the central platform.
**Dress Code:** None required -- it is no longer a functioning mosque or church.
**Photography Rules:** Allowed throughout; tripods require a permit; flash is permitted but produces poor results -- the low lighting is best captured with a raised ISO setting.
**Insider Notes:** The cistern is approximately 6°C cooler than the street -- bring a light layer in October. The classical music often played in the space (cello or violin ensemble) is a genuine atmospheric enhancement, not a tourist gimmick. The fish visible in the water have been there since the Ottoman period.
**Pair With:** Hagia Sophia (8-minute walk) and Blue Mosque (5-minute walk) -- schedule all three in the Sultanahmet cluster on Day 1.

---

#### 2. Hagia Sophia -- Score 19/20
**Category:** Living religious site / Byzantine architectural monument
**Cultural Significance:** Completed in 537 CE under Emperor Justinian I, Hagia Sophia was the largest enclosed space in the world for nearly 1,000 years and remained the defining architectural achievement of Byzantine Christianity. Its 31-meter-diameter dome appears to float on a ring of light created by 40 windows at its base -- an engineering solution that was not structurally replicated for 400 years. After the Ottoman conquest in 1453, Mehmed II immediately converted it to a mosque, plastering over the Christian mosaics and adding four minarets. Under Atatürk it became a secular museum in 1934. Since 2020 it has functioned as a working mosque again. The building is therefore simultaneously the greatest surviving Byzantine structure, the first great Ottoman mosque, and one of the most contested heritage sites in the world.

**Logistics at a Glance**
| Factor | Detail |
|--------|--------|
| Best arrival time | 9:00 AM when the mosque opens to visitors between prayer times; avoid 12:30 PM (Friday midday prayer closes it to visitors for ~1.5 hours) |
| Visit duration | 45 minutes minimum / 2 hours recommended |
| Entry cost | Free (mosque) -- visitors enter the non-prayer zone |
| Premium areas | The upper gallery (Byzantine mosaics including the Deësis mosaic) -- same ticket, but requires climbing a steep ramp |
| Booking required | No advance booking -- free entry, queue at the entrance |
| Getting there | Central Sultanahmet Square; walking distance from all other Sultanahmet sites |
| Accessibility | Ground floor fully accessible; upper gallery not wheelchair accessible (steep ramp) |
| Guided vs. self | **Strongly recommend a licensed guide for at least 90 minutes** -- the layers of Byzantine, Ottoman, and modern political history embedded in every surface require expert contextualization |

**What to See First:** Enter and immediately look up at the dome and the semi-domes flanking it -- stand at the center of the nave and orient before moving to specific elements. Then proceed to the upper gallery for the Byzantine mosaics.
**Skip if Short on Time:** The exterior approach and courtyard can be skipped -- enter directly and prioritize the interior dome experience and the Deësis mosaic in the upper gallery.
**Dress Code:** As a working mosque, dress code is strictly enforced: shoulders covered, knees covered for all genders, women must cover their hair with a headscarf. Disposable scarves are available at the entrance but bringing your own is more comfortable. Shoes must be removed and bagged (bags provided) before entering the prayer hall. Be prepared -- the enforcement is consistent.
**Photography Rules:** Photography allowed in the visitor areas; not permitted during active prayer. Flash permitted on the exterior and in the upper gallery; the ground floor dark zones are better photographed without flash using available light.
**Insider Notes:** The Deësis mosaic in the upper gallery -- a 13th-century Byzantine mosaic of Christ flanked by the Virgin Mary and John the Baptist -- is considered one of the finest surviving examples of Byzantine figural art and is partially restored. It is easy to miss because the upper gallery is a separate circuit from the main floor. Do not leave without seeing it. The Ottoman sultan's loge (Hünkar Mahfili) added by Murad III is visible from the upper gallery and illustrates the Ottoman architectural layering.
**Pair With:** Basilica Cistern (8-minute walk) and Blue Mosque (directly across the square).

---

#### 3. Chora Church (Kariye Mosque) -- Score 18/20
**Category:** Byzantine mosaic and fresco church
**Cultural Significance:** The Church of the Holy Saviour in Chora contains what many Byzantine art historians consider the finest surviving collection of Byzantine mosaics and frescoes in the world -- surpassing even those remaining in Hagia Sophia. Created in the early 14th century under the patronage of Theodore Metochites, the mosaics in the narthex and parecclesion represent the full narrative of Byzantine theological iconography: the life of the Virgin, the life of Christ, and the Last Judgment. The Anastasis fresco (Christ's descent into Hades to raise Adam and Eve) in the parecclesion is a masterwork of Late Byzantine painting. The church was converted to a mosque in 1511 and most mosaics were plastered over; converted to a museum in 1948; and reverted to mosque status in 2020. Many mosaics are currently covered while restoration work continues.

**Logistics at a Glance**
| Factor | Detail |
|--------|--------|
| Best arrival time | 9:00-10:00 AM -- the site draws far fewer visitors than Hagia Sophia |
| Visit duration | 1 hour minimum / 2 hours recommended for detailed mosaic examination |
| Entry cost | ~400 TRY (~$12) per person |
| Premium areas | No add-on costs |
| Booking required | Walk-in; rarely sells out even in October |
| Getting there | 30-35 minute tram + walk from Sultanahmet (T1 tram to Topkapı stop, then 15-min walk through Fatih neighborhood) or taxi/rideshare ~20 min |
| Accessibility | Limited; uneven mosaic floors, narrow passages, no elevator to upper sections |
| Guided vs. self | **Strongly recommend a specialist Byzantine art guide or a detailed illustrated guidebook** -- without context, the iconographic program is largely opaque to visitors unfamiliar with Byzantine theological narrative |

**What to See First:** The outer narthex mosaics depicting the life of the Virgin, then the inner narthex for the life of Christ, then directly to the parecclesion for the Anastasis fresco.
**Skip if Short on Time:** The upper portions of the inner narthex can be skipped if lighting is poor -- the essential experiences are the parecclesion frescoes and the genealogy dome mosaics.
**Dress Code:** As a mosque: shoulders covered, knees covered, women cover hair. Same requirements as Hagia Sophia.
**Photography Rules:** Photography allowed; the mosaics are best photographed with a zoom lens and no flash. Some sections may be covered for ongoing restoration -- confirm current access status on arrival.
**Insider Notes:** The walk to Chora through the Fatih neighborhood is itself historically rich -- you will pass through one of
