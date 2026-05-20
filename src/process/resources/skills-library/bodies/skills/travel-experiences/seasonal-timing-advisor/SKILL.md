---
name: seasonal-timing-advisor
description: |
  Analyzes the best time to visit a travel destination across weather, crowd
  levels, and cost dimensions. Produces a month-by-month comparison matrix
  with a recommended travel window and tradeoff analysis. Use when the user
  asks about the best time to visit a destination, when to travel for the
  fewest crowds, cheapest flights, or best weather, or when comparing travel
  windows for a destination. Do NOT use for specific itinerary building (use
  trip-itinerary-builder), activity-specific seasonal availability (use
  adventure-activity-planner), or budget optimization (use
  budget-travel-planner).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel research planning guide"
  category: "travel-experiences"
  subcategory: "trip-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Seasonal Timing Advisor

## When to Use

Use this skill when the user's primary question is about WHEN to travel, not what to do or how to pay for it.

**Trigger scenarios -- use this skill when:**
- The user asks an open-ended "best time to visit" question for any destination at the city, region, or country level ("When should I go to Patagonia?", "What's the best month for Morocco?")
- The user wants to compare two or more specific travel windows and needs help choosing ("Should I go to Iceland in June or September?")
- The user is optimizing for a single dimension -- lowest crowds, cheapest flights, best weather, longest daylight -- and needs month-by-month data to support that decision
- The user wants to time their trip around a natural phenomenon with variable timing -- cherry blossoms, autumn foliage, aurora borealis, whale migration, wildflower bloom, monsoon retreat
- The user has a constraint (school calendar, public holidays, employer blackout periods) and needs to find the best window within those limits
- The user is asking about shoulder season strategy -- what months fall between peak and off-season, and what the tradeoffs are
- The user is comparing two or more destinations and wants to know which one is best visited in a specific month they have available

**Do NOT use this skill when:**
- The user already knows their travel dates and needs day-by-day planning -- use `trip-itinerary-builder` instead
- The user needs to know what outdoor or adventure activities are available in a specific season at a specific destination -- use `adventure-activity-planner` instead
- The user's primary concern is minimizing total trip cost through flight timing, credit card points, or fare class strategy -- use `budget-travel-planner` or `airfare-search-strategy` instead
- The user needs a packing list calibrated to the season and destination -- use `packing-list-builder` instead
- The user is asking about visa requirements or entry restrictions that are time-based -- use `destination-entry-requirements` instead
- The user is asking what to DO at a destination rather than WHEN to go -- redirect to `destination-highlights-guide`

---

## Process

### Step 1: Gather Destination and Traveler Context

Before producing any analysis, establish the inputs that determine which tradeoffs matter. Ask the user these questions if not already stated:

- **Destination specificity:** Is the destination a single city (Lisbon), a region (Scottish Highlands), or an entire country (Vietnam)? Large countries span multiple climate zones -- a single matrix for "Brazil" is meaningless because the Amazon, Rio, and Patagonia operate on entirely different seasonal logic.
- **Primary travel goal:** Identify the dominant activity type. Temple and garden touring requires dry, mild weather. Beach travel requires heat and low surf. Wildlife observation has hard seasonal windows (migrations, calving, breeding). Skiing requires snow cover. Cultural immersion is often best during local festivals. This goal determines which weather variables matter most.
- **Priority ranking:** Ask the user to order these three: (1) weather quality, (2) crowd levels, (3) cost. If they say "all three matter equally," explain that this usually points toward shoulder season and proceed with balanced analysis.
- **Flexibility window:** Establish how constrained the user is. Full flexibility (any month works) allows optimal recommendation. Partial flexibility (only certain months due to school calendar, work schedule, or companion constraints) means finding the best option within a limited window.
- **Deal-breakers:** Ask about hard exclusions -- cannot tolerate heat above 32C, cannot manage rain-heavy days, allergic to crowd situations, has physical limitations that make extreme weather dangerous. These eliminate months regardless of other factors.
- **Travel duration:** A 5-day trip can target the single best week within a month. A 3-week trip requires consistent conditions across the entire stay. Duration affects how much weather variability matters.
- **Group composition:** Solo or couple travelers have maximum flexibility. Families with school-age children are locked to school holiday windows in their home country. Retirees have full flexibility but may have greater sensitivity to extreme heat or cold. Groups including elderly or mobility-limited travelers need mild conditions and may need to avoid peak season transport chaos.

### Step 2: Map the Destination's Climate Architecture

Before building the matrix, understand the destination's climate structure. This shapes the entire analysis.

- **Identify the climate classification:** Use the Köppen climate system as a mental framework. Tropical destinations (Af, Aw) have wet/dry seasons but minimal temperature variation. Mediterranean climates (Csa, Csb) have hot-dry summers and mild-wet winters -- the opposite of many travelers' intuitions. Continental climates (Dfa, Dfb) have dramatic four-season swings. Arid climates (BWh, BWk) have extreme heat as the dominant variable.
- **Identify the hemisphere:** Southern Hemisphere destinations (Patagonia, South Africa, New Zealand, Australia) have seasons reversed from the Northern Hemisphere. December-February is their summer; June-August is their winter. This is a common source of traveler error.
- **Identify major weather events with defined seasons:** Typhoon season in East and Southeast Asia (June-November, with peak August-October). Atlantic hurricane season (June-November, with peak August-September). Indian Ocean monsoon (onset May-June in the southwest, retreating October-December). These create hard no-go periods for certain destinations.
- **Identify the dominant source markets for the destination:** This determines which school holiday calendars drive crowd spikes. European travelers dominate Mediterranean beaches, so French and German school holidays (July-August, Easter, Christmas) drive peak season. Chinese Golden Week (October 1-7, Chinese New Year in January-February) drives peaks in East and Southeast Asia. American spring break (mid-March) drives peaks in Caribbean and Mexico.
- **Identify natural phenomena timing:** Aurora borealis requires darkness and geomagnetic activity -- best September to March above 60° latitude, peaking around equinoxes. Cherry blossom timing in Japan correlates with winter cold accumulation and spring warming -- the Japan Meteorological Cooperation publishes forecasts, but timing varies 2-3 weeks year to year. Wildebeest migration in the Serengeti/Masai Mara follows a roughly predictable circuit: calving in Ndutu (January-March), northern push to Masai Mara river crossings (July-October), southern return (November-December). These phenomena define the visit for wildlife and nature travelers and override generic weather analysis.

### Step 3: Build the Month-by-Month Matrix

Compile data for all 12 months. Use the following specific variables:

**Weather variables:**
- Average daytime high (°C and °F)
- Average overnight low (°C and °F)
- Average monthly rainfall in millimeters
- Number of rain days per month (days with >1mm precipitation -- more meaningful than total rainfall because 100mm in 3 days is different from 100mm spread across 20 days)
- Humidity level: Low (<40% relative humidity), Moderate (40-60%), High (60-75%), Very High (>75%)
- Sunshine hours per day (especially critical for northern Europe and high-latitude destinations in winter)
- Extreme weather risk: typhoon probability, monsoon intensity, heat index warnings, frost probability

**Crowd variables (1-5 scale):**
- 1 = Near-empty. Major attractions accessible without queuing. Accommodation walk-in available.
- 2 = Quiet. Small crowds at popular sites. Booking 2-4 weeks ahead sufficient.
- 3 = Moderate. Noticeable tourist presence. Booking 1-2 months ahead recommended. 20-30 minute waits at top attractions.
- 4 = Busy. Significant queues (30-60+ minutes) at major sites. Accommodation books 2-3 months ahead. Crowded transport.
- 5 = Peak overload. Hours-long queues. Accommodation sold out months ahead. Transport systems at capacity. Visitor experience significantly degraded.
- Note both international tourist volume AND domestic holiday impacts separately when they diverge

**Cost variables:**
- Accommodation cost tier relative to annual average: Very Low (<70% of average), Low (70-85%), Average (85-115%), High (115-140%), Peak (>140%)
- Flight cost trend relative to annual average -- note that flights and hotels often peak at different times (hotels peak during school holidays; flights peak slightly earlier as people book)
- Note specific event-driven price spikes that break the normal seasonal pattern (Formula 1 races, major concerts, religious festivals that fill regional hotels)

**Events and phenomena:**
- Local public holidays that reduce services or create domestic travel surges
- International festivals with positive draw value (Carnival in Rio, Oktoberfest, Diwali)
- Natural phenomena windows (foliage, bloom, migration, aurora, bioluminescence)
- Major international sporting events that monopolize accommodation
- Seasonal attraction closures or reduced-hour operations

### Step 4: Score Each Month Against the User's Priority

Apply a weighted scoring framework based on the user's stated priority order:

**If weather is the top priority:**
- Identify the "comfort zone" for the stated activity. For sightseeing: 16-26°C with fewer than 8 rain days per month is generally optimal for walking-heavy travel. For beach: 28-33°C with low humidity and minimal rain. For skiing: consistent snowpack, temperatures below -5°C at elevation. For wildlife photography: whatever season produces the target animal behavior, even if uncomfortable.
- Score each month on a 1-5 weather comfort scale for the stated activity, not generically. July in Marrakech (43°C) scores 5 for heat endurance travelers and 1 for sightseeing walkers.
- Flag months with high weather variability -- a month that averages 22°C but swings between 12°C and 32°C within the month scores lower than a stable 20°C month, because planning and packing become unpredictable.

**If crowds are the top priority:**
- Identify months that score 1-2 on the crowd scale
- Cross-check that these months have at least minimally acceptable weather for the stated activity (a crowd rating of 1 is useless if the destination is underwater in monsoon)
- Identify the "sweet spot" months -- typically the 2-4 weeks at the edges of shoulder season where tourist infrastructure is still fully operational but visitor numbers have dropped 30-50% from peak

**If cost is the top priority:**
- Identify months where accommodation costs are 20%+ below annual average
- Note that the cheapest month is rarely the same as the lowest-crowd month -- some destinations have low prices AND high crowds during domestic holiday periods, while others have low prices AND low crowds during weather-challenged months
- Calculate approximate savings: a destination where peak accommodation averages $180/night and off-season averages $90/night represents a real $630 saving on a 9-night trip -- contextualize the numbers

**Balanced priority scoring method:**
- Assign each month a composite score: Weather Score (out of 5) + Crowd Score (out of 5, where 5 = emptiest) + Value Score (out of 5, where 5 = cheapest)
- Months scoring 11-15 out of 15 are the sweet spot candidates
- These almost always fall in what travel professionals call "true shoulder season" -- the 3-6 week windows just before and after peak season

### Step 5: Identify the Shoulder Season Boundaries with Precision

Generic advice says "visit in shoulder season." Expert advice identifies WHERE the shoulder season actually is and how wide it is.

- **Leading shoulder:** The weeks immediately before peak season begins. Infrastructure is fully operational (hotels staffed, attractions open, tours running). Prices are 10-25% below peak. Weather is building toward peak conditions but hasn't arrived. Crowds are 30-50% below peak volume. Risk: weather may not have fully arrived (blossoms not yet open, winter not fully cleared).
- **Trailing shoulder:** The weeks immediately after peak season ends. Same infrastructure benefits. Weather is still warm/good but declining. Crowds drop sharply within days of school resuming or a holiday ending -- this transition can happen within a single week. Prices drop 15-30% rapidly. Risk: some seasonal businesses close early, weather can deteriorate faster than expected.
- **Micro-shoulder windows within peak months:** Even during peak months, specific weeks are significantly less crowded. The week before major holidays (Christmas week before December 25, Thanksgiving week in the US). Weekdays vs. weekends at popular city destinations. The first week of August vs. the second week of August in European beach destinations. Identify these micro-windows for users locked into peak travel periods.

### Step 6: Analyze Tradeoffs with Specificity

For each recommended window, state the tradeoffs in measurable, concrete terms rather than vague language:

- Instead of "it might be a bit rainy," say "September averages 11 rain days, typically afternoon showers of 1-2 hours duration, rarely full-day events -- morning sightseeing is generally reliable."
- Instead of "crowds can be high," say "the Uffizi Gallery in Florence in August has 2-hour timed entry queues even with advance tickets; visiting in early November, queues reduce to 15-20 minutes and tickets are available same-day."
- Instead of "it can be expensive," say "Kyoto accommodation in cherry blossom season runs 40-60% above November prices, and rooms within walking distance of Maruyama Park require booking 3-4 months ahead."
- Quantify daylight impacts: December in Reykjavik provides only 5 hours of usable daylight; June provides 24 hours. This completely changes the visit experience.
- Note irreversibility of timing decisions: missing the Serengeti river crossings (July-September) means waiting a full year. Cherry blossoms last 7-10 days at any single location. The aurora requires booking months ahead in popular lodges -- missing the season means rebooking entirely.

### Step 7: Produce the Final Recommendation Structure

Deliver outputs in three tiers:

**Primary recommendation:** The single best timing window given the user's specific priorities. State the precise timing (not "November" but "November 10-25"), the specific conditions expected, the crowd reality, the cost level, and the one main tradeoff the user accepts by choosing this window.

**Alternative recommendation:** The second-best window, especially useful if the primary window is already booked out or doesn't fit the user's schedule. State why it's the second choice rather than first.

**Avoid advisory:** Specific months or periods to avoid, with explicit reasons. Be direct -- "avoid Golden Week (April 29-May 5) entirely; this is not hyperbole, domestic Japanese travel reduces the visitor experience to a fundamentally different and exhausting one" is more useful than "Golden Week can be busy."

---

## Output Format

```
## Best Time to Visit: [Destination]

**Your Priority:** [weather / crowds / cost / balanced -- state what the user told you]
**Primary Recommended Window:** [Month Day-Day, or Month-Month with precision]
**Alternative Window:** [Month Day-Day or Month-Month]
**Avoid:** [Specific months/periods]

---

### Month-by-Month Matrix

| Month | Avg High | Avg Low | Rain Days | Humidity | Sun Hrs/Day | Crowds (1-5) | Cost vs. Avg | Key Events / Notes |
|-------|----------|---------|-----------|----------|-------------|--------------|--------------|-------------------|
| Jan | [°C/°F] | [°C/°F] | [days] | [Low/Mod/High/V.High] | [hrs] | [1-5] | [Very Low/Low/Avg/High/Peak] | [events, phenomena, closures] |
| Feb | | | | | | | | |
| Mar | | | | | | | | |
| Apr | | | | | | | | |
| May | | | | | | | | |
| Jun | | | | | | | | |
| Jul | | | | | | | | |
| Aug | | | | | | | | |
| Sep | | | | | | | | |
| Oct | | | | | | | | |
| Nov | | | | | | | | |
| Dec | | | | | | | | |

*Crowd scale: 1 = near-empty | 2 = quiet | 3 = moderate | 4 = busy | 5 = peak overload*
*Cost vs. average: Very Low = <70% of annual avg | Low = 70-85% | Avg = 85-115% | High = 115-140% | Peak = >140%*

---

### Season Breakdown

#### Peak Season: [Months]
- **Dates:** [Specific date ranges, not just month names]
- **Weather:** [Temperature range, rainfall, humidity, sunshine hours -- specific numbers]
- **Crowds:** [Level and specific real-world impact -- queue times, booking lead times, transport saturation]
- **Cost premium:** [Percentage above annual average for accommodation and flights]
- **Who should visit now:** [Specific traveler types who benefit from peak timing]
- **Concrete drawbacks:** [Measurable impacts on the visit experience]

#### Shoulder Season: [Months]
- **Leading shoulder:** [Specific weeks before peak, with dates]
- **Trailing shoulder:** [Specific weeks after peak, with dates]
- **Weather:** [Conditions with variability note -- how much does it swing within this period?]
- **Crowds:** [Percentage reduction from peak, real-world experience]
- **Cost savings:** [Percentage below peak for accommodation and flights]
- **Who benefits most:** [Traveler types and goals that shoulder season suits]
- **Genuine risks:** [Not vague cautions -- specific problems that can occur]

#### Off-Season: [Months]
- **Weather reality:** [Actual conditions, not just "bad weather" -- is it cold? rainy? hot? dark?]
- **Crowds:** [Level -- usually 1-2, but note any domestic holiday exceptions]
- **Maximum savings:** [Percentage below annual average]
- **What remains open vs. closed:** [Specific attraction or infrastructure impacts]
- **Who this suits:** [Specific traveler types who thrive in off-season]

---

### Composite Scoring Summary

| Month | Weather Score (/5) | Value Score (/5) | Crowd Score (/5) | Total (/15) | Verdict |
|-------|-------------------|-----------------|-----------------|-------------|---------|
| Jan | | | | | |
| Feb | | | | | |
| Mar | | | | | |
| Apr | | | | | |
| May | | | | | |
| Jun | | | | | |
| Jul | | | | | |
| Aug | | | | | |
| Sep | | | | | |
| Oct | | | | | |
| Nov | | | | | |
| Dec | | | | | |

*Weather scored for [user's stated activity]. Value score inverted so 5 = cheapest. Crowd score inverted so 5 = emptiest.*

---

### Natural Phenomena and Event Calendar

| Month | Phenomenon / Event | Type | Visitor Impact |
|-------|-------------------|------|----------------|
| [month] | [event name] | [Natural / Festival / Holiday / Sporting] | [Positive draw / Negative crowd impact / Mixed] |

*Variable-timing phenomena noted with typical range in parentheses.*

---

### Recommended Windows -- Detailed Analysis

#### Primary Recommendation: [Month Day-Day]

**Why this window:** [3-5 sentences of specific reasoning tied to the user's priority. Reference specific numbers from the matrix.]

**Weather to expect:** [Daily rhythm -- morning conditions, afternoon conditions, evening. Temperature range day-to-night. Rain pattern (daily showers vs. multi-day systems). Packing implications.]

**Crowd reality:** [Specific sites and experiences where crowds are noticeable vs. manageable. Early morning strategy where relevant.]

**Cost level:** [Percentage vs. annual average. Typical accommodation price range if known. Booking lead time needed.]

**The tradeoff you accept:** [One clear, honest statement of what you give up by choosing this window over peak season.]

**Timing precision:** [If the recommended window has a sweet spot within it -- e.g., "the first 10 days of November are meaningfully less crowded than the final 10 days as foliage peaks" -- state it here.]

---

#### Alternative Window: [Month Day-Day]

**Why it's the alternative:** [Why this is second choice rather than primary.]

**Best suited for:** [Traveler types or scenarios where this window is actually preferable to the primary recommendation.]

**The tradeoff:** [What you give up vs. the primary recommendation AND vs. peak season.]

**Booking considerations:** [Lead time, specific logistics differences from primary recommendation.]

---

### Avoid Advisory

| Period | Specific Reason to Avoid | How Bad (1-5) | Exception Case |
|--------|--------------------------|---------------|----------------|
| [dates] | [specific reason] | [1-5] | [traveler type who might still visit] |

*Severity scale: 1 = minor inconvenience | 3 = significantly degrades experience | 5 = visit not recommended*

---

### Quick-Decision Summary

> **If you want the absolute best experience and crowds don't faze you:** [Month/dates]
> **If you want the best balance of experience and manageable crowds:** [Month/dates -- Primary recommendation]
> **If you want to avoid crowds above all else:** [Month/dates]
> **If cost is your primary driver:** [Month/dates]
> **If you're locked to [user's constraint, if stated]:** [Best option within their window]
```

---

## Rules

1. **Never state a single "best month" without immediately quantifying the tradeoffs.** Every timing recommendation involves sacrifice. If you name November as the best month, the next sentence must state what the traveler gives up by not going in October or December. The word "best" always requires the qualifier "best for [specific goal] because it sacrifices [specific thing]."

2. **Always include all 12 months in the matrix, even months that are genuinely unsuitable.** A traveler reading that July has 22 rain days and a typhoon probability of 40% understands WHY to avoid it. Simply omitting July leaves them wondering if they missed something. State the data; let the data make the argument.

3. **Distinguish between average rainfall and rain day count -- both matter and they tell different stories.** Bali in August averages 43mm of rainfall across 5 rain days -- brief afternoon showers, mostly dry. Bali in January averages 307mm across 20 rain days -- persistent, heavy, day-disrupting rain. Both are "rainy" months in a simple table but represent completely different visitor experiences. Always report both total rainfall AND rain day count.

4. **Crowd ratings must account for BOTH international tourists AND domestic travelers independently.** A destination can score 1 on international tourist volume but 5 on domestic holiday crowding during local school breaks or national holidays. Report these separately if they diverge significantly. Chinese mountain destinations in October Golden Week are domestically mobbed but internationally uncrowded -- this nuance changes the recommendation entirely.

5. **Apply source market school calendar logic, not just destination country holidays.** Mediterranean beach destinations peak based on French, German, British, and Dutch school holiday calendars, not Spanish or Italian ones. Southeast Asian city destinations peak based on Chinese, Korean, and Australian school calendars. American national park visitation peaks on US school and holiday calendars. Always identify the 2-3 largest source markets for the destination and apply THEIR calendars.

6. **Variable-timing natural phenomena must be flagged with historical range, not presented as fixed dates.** Cherry blossoms in Kyoto have bloomed as early as March 22 and as late as April 12 in the past 20 years. The aurora borealis requires a Kp index of 3+ and cloud-free skies -- both are unpredictable within a trip window. Wildflower bloom in Namaqualand varies by 4-6 weeks depending on winter rainfall. State the phenomenon, state the typical window, and flag the variability so the user understands the booking risk.

7. **Cost comparisons must be relative (percentage above/below annual average) rather than absolute dollar amounts.** Absolute prices change every year and vary by accommodation tier, booking timing, and room type. "Peak season accommodation runs 40-60% above the annual average" is useful and durable. "$280/night in peak vs. $160/night in shoulder" appears authoritative but becomes outdated and is tier-specific. Use relative comparisons as the primary metric; add absolute ranges only as illustrative context and note they are approximate.

8. **Note operational impacts on attractions explicitly.** Off-season is not simply "fewer people and cheaper" -- it often comes with closed boat tours, mothballed hotel pools, reduced museum hours, suspended seasonal restaurants, or partial closures for annual maintenance. The Alhambra closes certain sections in winter. Antarctic cruise operators run no departures May through September. Many boutique hotels in Mediterranean coastal towns close entirely from November through March. These operational limits are not incidental -- they determine whether the trip is viable.

9. **Never recommend a travel window for a safety-sensitive period without flagging it.** Typhoon season, monsoon season, hurricane season, and political instability periods must be explicitly noted even when the average conditions that month look acceptable. A month that has 20 good days and a 25% probability of a category-3 typhoon requires an honest risk statement. Direct the user to check current travel advisories through their national foreign ministry before booking.

10. **Shoulder season boundaries shift by destination and year -- do not present them as fixed.** The shoulder-to-peak transition at popular destinations can happen within a single week when school holidays begin. The trailing shoulder can collapse rapidly if a major event (a film festival, a sporting event, a royal wedding) fills accommodation. State typical shoulder season boundaries, but flag that the transition timing varies and early booking is still advisable even in shoulder season at popular destinations. Present shoulder season as a probability -- "typically 30-40% fewer visitors than peak" -- not a guarantee of emptiness.

11. **Sunshine hours matter as much as temperature for northern and southern high-latitude destinations.** In Edinburgh in December, the sun rises at 8:45 AM and sets at 3:30 PM -- 6.75 hours of daylight, with useful light for photography only from 9:30 AM to 2:30 PM. This radically constrains the sightseeing day and is not captured by temperature data alone. For any destination above approximately 50° or below -40° latitude, always include sunshine hours per day in the matrix and note the practical impact on a visitor's daily schedule.

12. **Multi-week trips require consistency analysis, not just average conditions.** A 3-week trip to Morocco in March may start in warm spring conditions and end in late-season cold with unpredictable rain. A 3-week trip to Southeast Asia in October spans both early-dry-season and late-monsoon conditions depending on the sub-region. For trips longer than 10 days, analyze within-month variability and flag whether conditions are consistent throughout the stay or transition mid-trip.

---

## Edge Cases

### Destinations Spanning Multiple Climate Zones
Countries like Peru, Vietnam, Colombia, India, and the United States contain multiple distinct climate systems that cannot be analyzed with a single matrix. When a user names such a destination:
- Ask which specific region(s) they plan to visit before building any matrix
- If they plan to travel through multiple zones in one trip, build a matrix for each zone and identify the month that represents the best compromise across all zones -- stating clearly which zone benefits and which sacrifices
- In Vietnam, for example, the dry season runs south to north across the country from November to April, meaning January is ideal for Ho Chi Minh City, February-March for Hoi An, and April for Hanoi -- a traveler moving north has a built-in seasonal alignment if they sequence the itinerary correctly
- Never apply a country-level generalization to a specific regional destination: "best time to visit India" is not answerable as a single matrix; "best time to visit Rajasthan" is

### Year-Round Tropical Destinations with Minimal Temperature Variation
Destinations like Singapore, Bali, Zanzibar, Costa Rica's Pacific coast, and the Maldives have average temperatures that vary less than 4°C across the year. Generic temperature-based seasonal analysis adds minimal value. Instead, focus the analysis on:
- Wet season vs. dry season (rainfall day count and intensity, not temperature)
- Ocean conditions for diving and snorkeling: visibility (measured in meters), sea state, marine life presence by month
- Humidity index rather than temperature: 28°C at 85% humidity feels different from 28°C at 55% humidity, and the difference is month-dependent
- Wildlife-specific seasonality: turtle nesting, whale shark aggregation, manta ray season
- Regional cyclone/typhoon season with specific historical impact data
- Note that "off-season" in these destinations often means "rain arrives in the afternoon but mornings are clear" rather than "consistently bad weather" -- this is an important distinction that makes off-season viable for most travelers

### Traveler Locked to School Holiday Windows
When a family with school-age children or a teacher can only travel in June-August, December-January, or spring break weeks, they are locked into the most popular travel periods globally. Do not simply say "these are peak times" and leave it there. Instead:
- Identify which WEEK within the summer window is least crowded at the destination -- in European city destinations, the last 10 days of August are significantly less crowded than July as French and German school holidays end
- For beach destinations, identify which beach region at the destination is least known to the dominant tourist source market
- For theme parks and major landmarks, identify early-morning entry strategies (rope drop timing, early admission perks) that partially offset peak crowding
- For December travel, identify the specific week: the week of December 5-12 is typically much quieter than December 19-January 3 even at popular winter destinations
- Frame the analysis as "best option within your constraint" rather than apologizing for the constraint

### Multi-Destination Trips with Competing Seasonal Logic
A trip combining Morocco and Portugal, Thailand and Nepal, Argentina and Peru, or Japan and Taiwan creates a situation where the optimal month differs by destination. Handle this as follows:
- Build a brief matrix for EACH destination in the itinerary
- Identify months that fall within at least the "acceptable" range (weather score 3+, crowd score 3+) for ALL destinations simultaneously
- Score the compromise months: "October works well for Japan (excellent), is acceptable for Taiwan (slightly hot but manageable), and avoids the worst crowding in both"
- State explicitly which destination gets the better of the timing compromise and which accepts a sub-optimal window -- the user may be able to sequence their itinerary to give each destination its best days (e.g., entering Thailand via the North in November when it's dry and cool, moving south to the Gulf islands in December when the Gulf coast enters dry season)

### Destinations with Safety or Political Seasonality
Some destinations have periods of elevated unrest, protest activity, or travel advisory changes that are partially seasonal -- around election cycles, anniversaries of political events, or religious calendar tensions. Handle carefully:
- Note the period as a "logistics risk window" without political characterization
- State that during these periods, transportation disruptions, attraction closures, and accommodation cancellations become more likely
- Do not advise the user on the political situation itself
- Direct the user to check their national government's travel advisory portal (e.g., the US State Department, UK FCDO, Australian DFAT) for current guidance before booking
- If the safety concern is weather-based (monsoon flooding, typhoon risk), be specific about the historical impact: "September 2023 saw major flooding in [region] that closed the main road access to [attraction] for 12 days" is more useful than "flooding is possible."

### Extreme Seasonality Destinations (Arctic, Antarctic, High Desert, Monsoon-Dominated)
Some destinations have months that are genuinely unsuitable and should not be dressed up with manufactured positives:
- Arctic destinations (Svalbard, northern Iceland, northern Norway above the Arctic Circle) have 24-hour darkness from late November to late January. This is not "peaceful" or "atmospheric" for a general traveler -- it is functionally dark during all potential sightseeing hours. State this clearly.
- Antarctic cruise itineraries operate only November through March (Southern Hemisphere summer). Outside this window, no passenger vessels operate. This is a hard constraint, not a preference.
- Monsoon-affected destinations like Rajasthan in July-August, or the Indian coast during the southwest monsoon (June-September), receive 80-90% of annual rainfall in 90 days. Some areas experience consecutive rain days lasting 5-10 days. Note the difference between monsoon destinations where infrastructure handles rain (Bali, where life continues during rain) vs. monsoon destinations where flooding disrupts roads and access (parts of Rajasthan, where rural temple sites become inaccessible).
- For these extreme-seasonality destinations, explicitly number the viable months: "This destination has 5 genuinely good visiting months (October-February), 3 marginal months, and 4 months when visiting is either physically very challenging or logistically impossible."

### The "Event or Bust" Traveler
Some users are traveling specifically for one event -- Carnival in Rio, Oktoberfest, the Running of the Bulls, a specific music festival, cherry blossom peak, the wildebeest crossing -- and the date is non-negotiable. For these users:
- Confirm the event dates (and for variable-timing phenomena, the typical date range and how to track forecasts)
- Shift the analysis to what TIME WITHIN the event window is best: the first weekend of Oktoberfest is less crowded than the last weekend; the quietest days of cherry blossom season are the first 2-3 days of bloom before full peak; the best wildebeest crossing days are unpredictable but morning game drives improve odds
- Note the accommodation and logistics reality for event-driven travel: rooms within 5km of Oktoberfest book out 12+ months ahead; Rio hotels during Carnival are 3-5x normal prices; Kyoto hotels during cherry blossom peak are sold out by January for March-April availability
- Provide "event logistics" guidance: which accommodation zones are viable if central options are full, what transport works when normal options are saturated

---

## Example

**Input:** "When should I visit Morocco? I want to see the Sahara desert, the medinas of Fez and Marrakech, and some coastal towns. I'm flexible on timing but I absolutely cannot handle extreme heat. Crowds don't bother me much, but I'd like to avoid paying premium prices if possible."

**Output:**

## Best Time to Visit: Morocco

**Your Priority:** Weather comfort (heat avoidance) > cost > crowds
**Primary Recommended Window:** Mid-October to mid-November
**Alternative Window:** Late February to mid-April (avoiding Easter weekend)
**Avoid:** June through August (extreme heat in desert and interior cities)

---

### Month-by-Month Matrix

| Month | Avg High | Avg Low | Rain Days | Humidity | Sun Hrs/Day | Crowds (1-5) | Cost vs. Avg | Key Events / Notes |
|-------|----------|---------|-----------|----------|-------------|--------------|--------------|-------------------|
| Jan | 18C/64F | 6C/43F | 8 | Moderate | 6.5 | 2 | Low | Marrakech Jazz Festival (Jan). Cold desert nights (-2C possible). |
| Feb | 20C/68F | 7C/45F | 7 | Moderate | 7.5 | 2 | Low | Almond blossom in Ourika Valley. Still cold overnight inland. |
| Mar | 22C/72F | 9C/48F | 7 | Moderate | 8 | 3 | Average | Warming rapidly. Wildflowers in Atlas foothills. Pleasant medina walking. |
| Apr | 26C/79F | 12C/54F | 6 | Low-Moderate | 9 | 3-4 | Average-High | Easter week drives European crowds (Level 4 that week). Otherwise comfortable. |
| May | 30C/86F | 16C/61F | 4 | Low | 10 | 3 | Average | Marrakech pushing toward hot. Sahara comfortable (35C daytime, cool nights). |
| Jun | 35C/95F | 20C/68F | 2 | Low | 11 | 2 | Low | Marrakech reaches 38-40C by late June. Physically demanding for medina walking. |
| Jul | 38C/100F | 23C/73F | 1 | Very Low | 11.5 | 2 | Low | Sahara reaches 45C+. Fez interior can hit 42C. Not recommended for this itinerary. |
| Aug | 38C/100F | 23C/73F | 1 | Very Low | 11 | 2-3 | Low-Average | As July but some European visitors despite heat. Oujda Festival of Rai music. |
| Sep | 34C/93F | 20C/68F | 3 | Low | 9.5 | 2 | Low-Average | Still hot but falling. Late September approaching tolerable. Fez Sacred Music postponement window. |
| Oct | 27C/81F | 14C/57F | 5 | Low-Moderate | 8.5 | 2-3 | Average | Excellent conditions. Sahara perfect (28C days, cool nights). Date harvest season. |
| Nov | 22C/72F | 10C/50F | 7 | Moderate | 7 | 2 | Low-Average | Very comfortable. Quieting fast after October. Evenings cool -- layer needed. |
| Dec | 19C/66F | 7C/45F | 8 | Moderate | 6.5 | 2 | Low | Cold nights (near 0C in Sahara desert camps). Festive atmosphere in coastal cities. |

*Crowd scale: 1 = near-empty | 2 = quiet | 3 = moderate | 4 = busy | 5 = peak overload*
*Cost vs. average: Very Low = <70% | Low = 70-85% | Avg = 85-115% | High = 115-140% | Peak = >140%*

---

### Season Breakdown

#### Peak Season: March-May and Late September-October
- **Dates:** March 10 through May 20; September 20 through October 31
- **Weather:** March-May brings ideal temperatures (22-30C) with minimal rain. September-October is warm (27-34C) declining to comfortable. Both windows are Morocco's most reliably pleasant seasons.
- **Crowds:** Level 3, rising to 4 during Easter week (dates vary -- confirm year's Easter before booking). French and Spanish travelers dominate spring; British and German travelers dominate autumn. Marrakech riads and Sahara desert camps require booking 6-10 weeks ahead in these windows.
- **Cost premium:** Accommodation runs 15-30% above annual average. Riad prices in Marrakech median around 25% above their low-season rates. Desert camp glamping reaches peak pricing.
- **Who should visit now:** This itinerary (desert + medinas + coast) is ideally suited to these windows. The combination of manageable heat, full-day outdoor viability, and reliable sunshine makes spring and autumn the objectively best seasons for Morocco's interior.
- **Concrete drawbacks:** Easter week specifically creates Marrakech crowd spikes. Marrakech's Jemaa el-Fna square is at its most hectic in late October as European half-term holidays arrive.

#### Shoulder Season: November and Late February-Early March
- **Leading shoulder (late February-early March):** February 20 to March 10. Pre-Easter, pre-peak conditions. Fez and Marrakech are noticeably quieter. Temperatures reach 18-22C -- slightly cooler than peak but entirely comfortable for medina walking. Riad availability is high. Sahara nights are cold (5-8C at camp) -- a sleeping bag liner is essential.
- **Trailing shoulder (November):** November 1-30. Post-peak drop-off is fast. Tourist volume falls 35-40% from October within the first week of November. Temperatures remain comfortable (18-22C highs) but evenings cool significantly (10C by late November). Rain frequency increases slightly to 7 days/month -- typically short afternoon events.
- **Cost savings:** 15-25% below peak window accommodation rates. Desert camps drop to low-season pricing by mid-November.
- **Who benefits most:** This itinerary is excellent in November. The Sahara is cool and dramatic rather than punishing. Fez medina feels navigable rather than gridlocked. Coastal towns like Essaouira get their characteristic Atlantic winds without summer surf crowds.
- **Genuine risks:** Late November Sahara nights can reach 3-5C -- sleeping bags in desert camps are essential, not optional. Rain systems moving in from the Atlantic occasionally produce 2-3 consecutive rain days in coastal Essaouira. The Atlas Mountain passes can see early-season snow by late November, occasionally closing the Tizi n'Tichka road between Marrakech and the Draa Valley.

#### Off-Season: June Through August
- **Weather reality:** June-August is NOT merely "warm" -- Marrakech averages 38C in July, with peaks reaching 44C. The medinas, with their narrow covered souks that trap heat, become physically unpleasant for extended walking by 10 AM. The Sahara reaches 45-50C during daytime hours in July -- Erg Chebbi camel rides operate only before 7 AM and after 5 PM, and the heat haze eliminates the photographic clarity that makes the desert compelling.
- **Crowds:** Level 2 -- genuinely few tourists, for obvious reasons. Mostly budget backpackers and heat-tolerant travelers.
- **Maximum savings:** Accommodation runs 30-40% below annual average. Desert camp glamping is cheapest of the year. Flights from Europe are cheapest, though airport transfers and logistics cost the same.
- **What remains open vs. closed:** All attractions remain open year-round in Morocco -- there are no significant closures in summer. However, many riad rooftop terraces and medina restaurant patios are unusable by midday heat. Coastal towns (Essaouira, Asilah, Chefchaouen at elevation) are significantly more bearable than interior cities.
- **Who this suits:** Travelers with high heat tolerance who prioritize cost savings and empty streets. Photographers who want medinas without tourists. Travelers flexible enough to adopt a Mediterranean-style schedule (early morning activity from 6-10 AM, midday rest indoors, late afternoon and evening activity from 5-9 PM).

---

### Composite Scoring Summary

*Weather scored for: sightseeing-intensive itinerary with heat avoidance as primary constraint*

| Month | Weather Score (/5) | Value Score (/5) | Crowd Score (/5) | Total (/15) | Verdict |
|-------|-------------------|-----------------|-----------------|-------------|---------|
| Jan | 3 | 4 | 4 | 11 | Good -- cold nights limit Sahara experience |
| Feb | 3 | 4 | 4 | 11 | Good -- cold improving, almond blossom bonus |
| Mar | 5 | 3 | 3 | 11 | Very Good -- heat avoidance comfortable |
| Apr | 4 | 3 | 3 | 10 | Good -- Easter week reduces score |
| May | 3 | 3 | 3 | 9 | Acceptable -- Marrakech warming fast |
| Jun | 1 | 4 | 4 | 9 | Not recommended -- heat deal-breaker |
| Jul | 1 | 5 | 5 | 11 | Score misleads -- heat makes visit impractical for this itinerary |
| Aug | 1 | 4 | 4 | 9 | Same as July |
| Sep | 2 | 4 | 4 | 10 | Late September only -- heat still significant |
| Oct | 5 | 3 | 3 | 11 | Excellent -- primary sweet spot |
| Nov | 5 | 4 | 4 | 13 | **Best overall** -- primary recommendation |
| Dec | 3 | 4 | 4 | 11 | Good -- Sahara cold nights are the main limit |

*Note: July scores 11 numerically but is excluded from recommendations because the weather score of 1 represents a hard deal-breaker (extreme heat that violates the user's stated constraint), not merely a low preference.*

---

### Natural Phenomena and Event Calendar

| Month | Phenomenon / Event | Type | Visitor Impact |
|-------|-------------------|------|----------------|
| Jan | Marrakech Jazz Festival | Festival | Positive -- adds cultural programming to a quiet month |
| Feb | Almond blossom, Ourika Valley | Natural | Positive -- visual spectacle within day-trip range of Marrakech |
| Apr (varies) | Easter week | Holiday | Negative -- European school holiday drives Level 4 crowds; avoid specific week |
| May-Jun | Rose Festival, Kelaat M'Gouna | Festival | Positive draw -- dramatic rose valley in bloom if routing through Draa Valley |
| Jun | Fez Sacred Music Festival | Festival | Positive -- world-class programming, but adds crowds to already-hot month |
| Oct | Date harvest season | Natural | Positive -- local markets fill with fresh dates; cultural richness |
| Nov | Marrakech Film Festival (varies) | Cultural | Mixed -- hotel prices spike in Marrakech for the week; worth checking dates |
| Nov-Dec | Sahara clear nights for stargazing | Natural | Positive -- lowest humidity and minimal cloud cover for desert camps |

---

### Recommended Windows -- Detailed Analysis

#### Primary Recommendation: October 15 -- November 20

**Why this window:** This 5-week period hits the precise point where Morocco's temperature drops from hot to comfortable, crowds have thinned from peak October levels, and costs are dropping toward low-season pricing. Your specific itinerary (Sahara, Fez, Marrakech, coastal towns) benefits uniformly from these conditions: the Sahara averages 26-30C in daytime with clear, low-humidity skies and cool nights (8-12C) that make the desert landscape dramatically beautiful without being dangerous. Fez medina is walkable for full days without heat exhaustion. Marrakech's rooftop terrace dining is comfortable in the evenings.

**Weather to expect:** Daytime highs of 22-27C in Marrakech and Fez, dropping to 14-18C by late November. Mornings start cool (12-15C) and warm by 10 AM. Rain risk is low in October (5 days average) and increases to 7 days in November -- typically short afternoon events rather than all-day systems. Sahara clear skies typical with excellent stargazing visibility. Essaouira on the coast will have Atlantic winds (the city earns its reputation as "the windy city" September-April) -- a light windproof layer is essential there.

**Crowd reality:** Level 2-3 in October falling to Level 2 by mid-November. The Bahia Palace in Marrakech, which can have 45-minute queues in spring peak, is walkable without queuing in November. Fez's leather tanneries -- always the most visited spot -- have a manageable flow of visitors, and the surrounding rooftop terraces are available without jostling. Desert camp operators have full inventory available with 3-4 weeks booking lead time rather than the 8-10 weeks needed in March.

**Cost level:** October runs approximately 15-25% above annual average; November drops to 10-20% below annual average. Riads in Marrakech that run $180-220/night in spring typically run $130-160/night in November. Desert glamping camps that reach $250+/night in March drop to $180-200/night range in November.

**The tradeoff you accept:** You miss the spring wildflowers and the Ourika Valley almond blossom. The Rose Festival in the Draa Valley (May-June) is not accessible from this window. Days are shorter than spring -- sunset at 5:45 PM in mid-November vs. 7:30 PM in April, limiting late afternoon golden-hour photography time at outdoor sites.

**Timing precision:** Within this window, October 15-31 offers slightly warmer and drier conditions; November 1-20 offers better pricing and emptier sites. If stargazing at the Sahara is a high priority, late October and early November have the best combination of clear skies and comfortable nighttime temperatures before desert nights become genuinely cold.

---

#### Alternative Window: February 20 -- April 5 (excluding Easter week)

**Why it's the alternative:** Spring offers warmer late-afternoon light, longer days, and the possibility of coinciding with the almond blossom season (February) or Ourika Valley roses (late May, just outside this window). Temperatures are ideal for the entire itinerary. This is Morocco's other "golden window."

**Best suited for:** Travelers who prefer warmth over cool, or who specifically want to experience the spring social atmosphere of Marrakech's Jemaa el-Fna square at its most vibrant. Photographers benefit from the long golden hours (sunset at 7:00-7:30 PM in late March-early April).

**The tradeoff:** Easter week -- which falls anywhere from late March to mid-April -- drives a Level 4 crowd surge in Marrakech specifically. Check Easter dates for your travel year before booking. The spring window also runs 20-30% higher in accommodation cost than the primary November recommendation. Booking lead time for Sahara desert camps increases to 8-10 weeks.

**Booking considerations:** Riads in Marrakech require 8-10 week advance booking in spring vs. 3-4 weeks in November. Fez medersas and the tanneries get significantly more visitation -- plan for tannery visits before 10 AM to avoid the midday tour group rush.

---

### Avoid Advisory

| Period | Specific Reason to Avoid | Severity (1-5) | Exception Case |
|--------|--------------------------|----------------|----------------|
