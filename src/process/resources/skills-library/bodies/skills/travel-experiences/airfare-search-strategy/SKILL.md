---
name: airfare-search-strategy
description: |
  Creates a booking-window and alert strategy for finding low-fare airfare.
  Produces a search timeline, fare monitoring plan, and booking decision
  framework based on route type, travel dates, and flexibility. Use when the
  user asks about finding cheap flights, when to book airfare, how to set fare
  alerts, or how to optimize flight search timing. Do NOT use for trip
  itinerary building (use trip-itinerary-builder), travel day logistics (use
  travel-day-optimizer), or travel rewards and points strategy (use
  travel-rewards-optimizer).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel research planning checklist"
  category: "travel-experiences"
  subcategory: "travel-logistics"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Airfare Search Strategy

## When to Use

Use this skill when the user's primary need is finding the lowest available fare, understanding when to book, or building a systematic monitoring plan for a specific flight. Specific trigger scenarios include:

- User asks "when is the best time to book a flight to [destination]?" or any variation on booking timing
- User wants to know if they should book now or wait for a cheaper fare
- User asks how to set up fare alerts for a specific route or date range
- User describes a trip and asks how to minimize airfare costs
- User asks about day-of-week differences, departure time savings, or flexible date strategies
- User wants to know if a fare they found is "a good deal" and whether to pull the trigger
- User asks about using alternate airports or accepting a connection to save money
- User needs a structured search timeline: when to start, how often to check, when to commit

**Do NOT use this skill when:**
- The user needs a full trip itinerary built out -- use `trip-itinerary-builder` instead
- The user is asking about optimizing travel day logistics, airport connections, or layover navigation -- use `travel-day-optimizer`
- The user's primary question is about maximizing points, miles, or credit card rewards for flights -- use `travel-rewards-optimizer`
- The user needs guidance on navigating a specific airport, terminals, or ground transport -- use `airport-navigation-guide`
- The user is asking about travel insurance, visa requirements, or entry documents -- those are separate logistics domains outside this skill's scope
- The user is booking travel for a group of 10+ and needs formal group contract terms -- recommend they contact the airline group desk directly, as online search strategy does not apply to contracted group fares

---

## Process

### Step 1: Gather Flight Search Parameters

Collect everything needed to classify the route and build an accurate strategy before offering any booking advice.

- **Origin and destination:** Get specific cities and clarify whether the user is locked to a specific airport or open to the metro area. "New York to Los Angeles" could mean JFK, LGA, or EWR on the origin side and LAX, BUR, LGB, ONT, or SNA on the destination side -- each pair can have materially different fares.
- **Travel dates:** Determine how fixed the dates are. Fixed dates (must depart Friday, must return Sunday) severely limit options. Flexible by 1-3 days opens up day-of-week savings. Flexible by 1-2 weeks opens up the full calendar search. Fully open-ended is the ideal scenario for savings.
- **Trip type:** Round-trip, one-way, or open-jaw (fly into one city, out of another). Open-jaw tickets are often mispriced and can deliver unexpected savings or allow a multi-city itinerary at no premium.
- **Travelers:** Number of adults, children (2-11), and lap infants (under 2). A lap infant on international flights typically costs 10% of the adult fare. Two or more travelers searching together will always be priced at the highest per-person fare available in that quantity -- a single seat at a sale price disappears when you search for two.
- **Cabin class:** Economy, premium economy, business, or first. Basic Economy (a restricted sub-fare of economy) requires special handling -- it is not the same as standard economy and has critical restrictions.
- **Connection tolerance:** Nonstop preferred, 1 stop acceptable, or any routing. Connecting itineraries can be $80-300 cheaper on many routes, but assess total door-to-door time and layover risk.
- **Baggage needs:** Carry-on only vs. 1 checked bag vs. 2 checked bags. This is the most commonly misunderstood true-cost variable. A "$199" basic economy fare with two checked bags at $35-45 each each way can easily exceed a "$249" standard economy fare that includes one bag.
- **Change and cancellation needs:** If there is any chance plans may change, a non-refundable basic economy fare is a liability. A refundable fare or a standard fare with fee-based changes is a real cost consideration that must factor into comparisons.
- **Loyalty affiliations:** If the user has status or miles with a carrier or alliance, factor in whether positioning the itinerary on a partner airline captures miles or whether booking through a specific channel affects cost.

---

### Step 2: Classify the Route Type and Seasonal Context

Route type is the single most important variable in determining booking window and strategy. Do not give generic advice before classifying the route.

- **Competitive domestic route** (e.g., New York--Los Angeles, Chicago--Miami, Dallas--Denver): Three or more carriers compete aggressively. Fares fluctuate constantly. Sales occur frequently. Optimal booking window: 1-4 months ahead, with the statistical sweet spot at 3-6 weeks before departure on most such routes (unlike international, domestic fares can still be competitively priced relatively close in). However, this is highly route-dependent -- do not apply the 3-week rule universally.
- **Thin domestic route** (e.g., small regional cities, single-carrier monopoly routes): One carrier controls capacity. Fares are higher, climb steadily, and rarely go on sale. Book 2-4 months out. Waiting almost always results in higher fares on these routes.
- **Major transatlantic route** (e.g., US East Coast--London, New York--Paris, Boston--Dublin): High carrier competition, robust inventory. Optimal booking window: 3-6 months ahead. September and October transatlantic fares are typically 20-40% below June-August peak. January and February departures can be found for 40-60% below summer pricing.
- **Transpacific route** (e.g., US--Japan, US--Australia, US--Southeast Asia): Fewer carriers, longer flights, higher base fares. Booking window: 4-8 months ahead. Sales exist but are less frequent. Holiday periods are brutal for transpacific routes -- book 6+ months out for summer or Lunar New Year travel.
- **Intra-Europe or intra-Asia short-haul international:** Low-cost carriers dominate. Fares can be found extremely cheaply 6-12 weeks out, but also extremely cheaply 6-12 months out during promotional periods. The booking curve is U-shaped: very cheap early, rises in the middle, spikes close in. Search early and set alerts.
- **Seasonal peak overlay:** Any route during Christmas/New Year (Dec 20--Jan 3), US Thanksgiving week, spring break (March-April), and peak summer (late June--late August) behaves differently. Fares for peak periods start rising 4-8 months before departure and rarely drop. The "wait for a sale" tactic fails during peak periods. Book as early as you are willing to commit.
- **Shoulder season advantage:** The weeks immediately before and after peak periods are where the best value typically appears. First week of September (post-summer transatlantic), first week of January (post-holiday), late May (pre-summer Europe), and October/November (fall international) are consistently strong value windows.

---

### Step 3: Establish a Price Anchor and Historical Context

Before telling a user whether to book, you need to establish what a normal fare looks like for this specific route and season.

- **Baseline check:** Assess the current fare for the target route and dates. This becomes the price anchor. All subsequent monitoring is measured against this anchor.
- **Historical fare context by route type:**
  - Competitive domestic round-trip economy: $150-350 (short-haul under 3 hours), $250-500 (cross-country), $350-700 (Alaska/Hawaii)
  - Transatlantic economy round-trip from US East Coast: $400-800 (shoulder season), $700-1,200 (peak summer)
  - Transatlantic economy from US West Coast: $500-900 (shoulder), $800-1,400 (peak)
  - Transpacific US--Japan/Korea round-trip: $600-1,000 (shoulder), $900-1,500 (peak)
  - US--Southeast Asia (Thailand, Vietnam): $700-1,200 (shoulder), $1,000-1,600 (peak)
  - US--Australia/New Zealand: $900-1,400 (shoulder), $1,200-1,800 (peak)
- **Price anchor formula:** Check fares for the target dates. Check fares for ±7 days on each side. Check fares for a comparable period in the prior year if context allows. The median of these checks becomes the anchor. A fare 15% or more below the anchor is a strong deal. A fare 10-15% below the anchor is a reasonable deal worth monitoring. A fare at or above the anchor is not a deal.
- **Fare class within the cabin:** Even within "economy," there are typically 4-8 fare buckets (Y, B, M, H, K, L, V, U in a typical IATA ladder). The cheapest bucket has the most restrictions. Understanding that the published "economy" price you see is a specific fare bucket -- not a fixed price -- explains why fares seem to change randomly.

---

### Step 4: Build the Booking Window Timeline

Translate the route classification and current date into a concrete, dated action plan.

- **Calculate the departure date in weeks from today.** Every recommendation below uses "weeks to departure" as its primary variable.
- **International routes -- booking window rules:**
  - 26+ weeks out: Monitor only. Fares exist but are often not at their competitive best yet. Exception: if you see a fare 20%+ below the historical average, book it -- a genuine error fare or promotional sale should not be passed up even outside the window.
  - 16-26 weeks out: Active monitoring window. Set alerts. Begin checking every 3-4 days. If a strong deal appears (15%+ below anchor), consider booking.
  - 8-16 weeks out: Sweet spot for most international routes. This is when the highest density of competitive fares appears. Search daily. Act within 24-48 hours of seeing a target-price fare.
  - 4-8 weeks out: Booking becomes urgent. Fares are trending upward. If you have not booked, act now unless you are within striking distance of your target price.
  - Under 4 weeks: Book regardless for international. Prices are climbing. The probability of a meaningful drop below today's price is less than 15% based on observed fare behavior.
- **Domestic routes -- booking window rules:**
  - 12+ weeks out: Monitor. Domestic fares this far out are rarely at their lowest.
  - 6-12 weeks out: Prime monitoring window. Competitive routes often have their best fares here.
  - 3-6 weeks out: Last strong-deal window for domestic. Book a good fare immediately when you see it.
  - 14-21 days out: Domestic fares begin rising rapidly. Book now even if slightly above target.
  - Under 14 days: Fares are at near-maximum. Apply last-minute tactics (see Edge Cases).
- **Decision deadline -- hardcode a date:** Every search strategy must have an absolute booking deadline -- the date by which the user commits regardless of price. Frame this as: "If you have not booked by [date], book at whatever price is available. The cost of not traveling is zero; the cost of a last-minute fare is real."

---

### Step 5: Design the Fare Alert Architecture

Fare alerts are the passive monitoring layer. Set them correctly or they generate noise without value.

- **How fare alerts work:** Search engines and airlines use pricing algorithms that reprice inventory continuously. An alert fires when the observed price for a queried route and date combination drops below the threshold you set. Alerts work best for specific origin-destination pairs and broad date ranges.
- **Alert threshold calibration:** Set the primary alert at your target price (15% below anchor). Set a secondary alert at the anchor price itself as a "monitor closely" trigger. Setting an alert at your absolute maximum budget is not useful -- that fires when you are already at your limit.
- **Date-range alerts vs. fixed-date alerts:** Date-range alerts (e.g., "any departure date in September") catch unexpected price drops on dates you had not considered. Fixed-date alerts are more precise but miss adjacent deals.
- **Multiple origin alerts:** If the user is open to multiple airports, set separate alerts for each viable origin. EWR, JFK, and LGA to LHR on the same travel dates may have fares that differ by $80-200 per person.
- **Alert fatigue management:** Set no more than 3-5 active alerts per trip. More than that becomes noise. Prioritize the most likely origin-destination pairs and the target date range.
- **Act within 24-48 hours:** When an alert fires, the fare may only last hours. Verify it immediately, confirm the total cost including bags and fees, and be prepared to book the same day. Waiting 3 days after an alert fires to compare more options often results in missing the fare entirely.
- **Clear browsing data or use private/incognito mode:** Some search engines exhibit dynamic pricing behavior where repeated searches for the same route result in incrementally higher displayed prices. This is not universal, but it is observed often enough that using a private browsing session for fare checks is standard practice.

---

### Step 6: Conduct the True Cost Analysis

The cheapest advertised fare is almost never the cheapest option after all costs are applied.

- **Baggage fee comparison:** Major US legacy carriers (full-service) typically include one checked bag in standard economy on international routes. On domestic routes, checked bag fees at major carriers typically run $35-45 for the first bag, $45-65 for the second. Low-cost carriers charge for carry-ons on some fare classes -- verify per-carrier baggage rules before comparing.
- **Seat selection fees:** Basic economy fares on most carriers do not allow seat selection (or assign the worst seats). Standard economy typically allows selection at booking, sometimes for free, sometimes for $10-50. Families with children must read the fine print carefully -- being split across the cabin is a real risk on basic economy.
- **Change and cancellation fees:** Basic economy fares are typically non-changeable and non-refundable (you lose the entire fare). Standard economy fares changed within 60 days may incur fees of $50-200 on domestic routes (some carriers have eliminated domestic change fees entirely post-2020 -- verify current policy). International change fees are $100-400 on most legacy carriers.
- **Alternate airport ground transport:** If you are using a secondary airport (e.g., saving $80 per person by flying into Oakland instead of SFO, or Newark instead of JFK), the ground transport cost eats into the savings. A $40 bus or rail option may still make the alternate airport worthwhile. A $120 car service roundtrip may eliminate the savings entirely. Calculate this explicitly.
- **Connection opportunity costs:** A 14-hour itinerary that saves $150 per person vs. a 7-hour nonstop costs real time. For business trips or trips with tight arrival requirements, the value of your time should factor into this analysis.
- **Total cost formula per option:** Base fare × number of travelers + baggage fees (both directions) + seat selection (if required) + ground transport delta (if alternate airport) = true total cost.

---

### Step 7: Assess Flexibility Savings Opportunities

Flexibility is the most powerful tool for fare reduction. Quantify the value of each flexibility option.

- **Day-of-week departure:** Tuesday and Wednesday departures are typically the cheapest days to fly on most US domestic and transatlantic routes. Saturday departures are often cheaper than Friday or Sunday for domestic travel (counterintuitive -- business travelers avoid Saturdays). For international, Saturday returns are often cheaper than Sunday returns.
- **Time-of-day selection:** Early morning (5:00-7:00 AM departures) and late night (9:00 PM+ departures) are typically $20-60 cheaper than midday and afternoon departures. They also have lower rebooking risk because they are less likely to be delayed by aircraft flow problems from earlier in the day.
- **Date shifting value:** Shifting departure by 1-3 days can yield $30-150 per person savings on competitive domestic routes. On transatlantic routes, shifting 3-5 days around the shoulder/peak boundary can yield $100-300 per person savings.
- **One-week shift for seasonal boundary crossings:** Labor Day (first Monday in September) is a hard line for transatlantic fares -- the same flight on Monday after Labor Day can be $100-200 cheaper than the Friday before. Similar effects exist around school spring break starts and ends.
- **Splitting a round-trip into two one-ways:** Combining two different carriers (one outbound, one return) is sometimes cheaper than a round-trip on one airline, particularly when a low-cost carrier is competitive in only one direction. The risk: no interline protection if the outbound is delayed and causes a missed return.
- **Open-jaw routing:** If a user wants to visit London and Paris, flying into London and returning from Paris is often the same price as a London round-trip. The user saves the London-Paris flight and eliminates a backtrack. This is consistently underutilized.
- **Positioning flights:** If a user lives near a small airport with expensive fares, driving or taking a train to a larger hub airport and connecting there is sometimes the cheapest total option. This is route- and region-specific but worth calculating when the fare differential exceeds $150.

---

### Step 8: Compile and Deliver the Search Plan

Assemble everything into the output format below. The plan should be immediately actionable -- the user should be able to read it and know exactly what to do today, next week, and at the booking deadline.

- Confirm every key parameter was captured before finalizing advice.
- Include specific dates (not just "6 weeks before departure" -- calculate the actual calendar date).
- State the price anchor clearly. State the target price. State the maximum price. State the booking deadline.
- Flag the most impactful flexibility tactic for this specific user's parameters.
- Highlight any unusual conditions (holiday travel, monopoly route, recent capacity changes) that override standard advice.

---

## Output Format

```
## Airfare Search Strategy

**Route:** [origin airport code] to [destination airport code], round-trip / one-way / open-jaw
**Alternate Airports Considered:** [list if applicable, or "None -- metro is single-airport"]
**Travel Dates:** [specific dates or date range]
**Flexibility Window:** [fixed / ±3 days / ±1 week / fully flexible]
**Travelers:** [N adults, N children ages X, N lap infants]
**Cabin Class:** [Economy / Basic Economy eligible / Premium Economy / Business]
**Baggage Requirements:** [carry-on only / 1 checked bag each / 2 checked bags each]
**Change Flexibility Needed:** [none -- book cheapest / moderate -- want change option / high -- prefer refundable]
**Budget Target:** $[amount] per person round-trip / total
**Route Type:** [Competitive domestic / Thin domestic / Major transatlantic / Transpacific / Intra-regional international / Seasonal peak overlay]

---

### Price Anchor

| Metric | Value |
|--------|-------|
| Current baseline fare (today's observed price) | $[amount] per person |
| Historical average for this route and season | $[amount] per person |
| Target price (strong deal -- book immediately) | $[amount] per person (approx. [X]% below average) |
| Acceptable price (reasonable deal) | $[amount] per person |
| Maximum price (book before exceeding this) | $[amount] per person (your budget ceiling) |

---

### Booking Window Timeline

| Phase | Dates | Weeks to Departure | Action | Expected Fare Behavior |
|-------|-------|-------------------|--------|------------------------|
| Early monitor | [date range] | [N]+ weeks | Set alerts, check weekly | Fares exist but not at competitive best |
| Active search window | [date range] | [N]-[N] weeks | Search every 3-4 days, ready to book | Best deal density; act within 24-48 hrs of target fare |
| Closing window | [date range] | [N]-[N] weeks | Daily monitoring, book on target fare immediately | Prices beginning upward trend |
| Book regardless | [date range] | [N]-[N] weeks | Book at best available price today | Fares rising, probability of drop below today's price <15% |
| Last resort | [date range] | Under [N] weeks | Apply last-minute tactics (see notes) | Near-maximum pricing |

---

### Fare Alert Setup

| Alert # | Route | Dates Covered | Price Threshold | Purpose |
|---------|-------|---------------|-----------------|---------|
| Alert 1 | [origin] to [destination] | [date range] | $[amount] | Primary target -- book immediately if triggered |
| Alert 2 | [alternate origin] to [destination] | [date range] | $[amount] | Alternate airport monitor |
| Alert 3 | [origin] to [alternate destination] | [date range] | $[amount] | Alternate airport monitor |
| Alert 4 | [origin] to [destination] | ±3 days around target | $[amount] | Date-flexible early warning |

**Alert guidance:** When an alert fires, verify the fare in a private browsing session, calculate the true cost (see below), and be prepared to book within 24 hours. Fares at the target price do not persist for days.

---

### Flexibility Savings Analysis

| Tactic | Applicable? | Estimated Savings/Person | How to Capture |
|--------|-------------|--------------------------|----------------|
| Depart [Tuesday or Wednesday] instead of [Friday or Sunday] | [Yes / No -- dates are fixed] | $[range] | Use date grid/calendar view in fare search |
| Depart [N] days earlier (by [date]) | [Yes / No] | $[range] | Check [specific date] vs. target date |
| Return [N] days later (by [date]) | [Yes / No] | $[range] | Check [specific date] vs. target date |
| Use [alternate airport code] as origin | [Yes / No -- based on ground transport cost] | $[fare savings] minus $[transport cost] = net $[savings] | Search [airport] separately |
| Fly into [alternate destination airport] | [Yes / No -- based on ground transport need] | $[fare savings] minus $[transport cost] = net $[savings] | Search [alternate airport code] separately |
| Accept 1 stop instead of nonstop | [Yes / No -- based on connection tolerance] | $[range] | Filter for 1-stop itineraries and compare |
| Shift travel week (avoid [specific peak week]) | [Yes / No] | $[range] | Compare week of [dates] vs. adjacent week |
| Split into two one-way tickets | [Yes / No -- routing-dependent] | $[range or "break-even"] | Price outbound and return separately |
| Open-jaw routing ([city A] in, [city B] out) | [Yes / No -- trip-dependent] | $[range or "not applicable"] | Search as open-jaw if trip allows |

**Highest-impact tactic for your trip:** [Specify the single best flexibility option based on the user's specific parameters]

---

### Booking Decision Framework

| Observed Fare | Weeks Remaining | Decision | Reasoning |
|---------------|-----------------|----------|-----------|
| Below $[target] | Any | Book immediately | Below historical average. Probability of further drop is low. |
| $[target] to $[anchor] | 8+ weeks | Monitor and wait | Within normal range; time remains in the active window. |
| $[target] to $[anchor] | 4-8 weeks | Book within 48 hours | Closing window. This price is likely to climb. |
| $[anchor] to $[max] | 4+ weeks | Apply flexibility tactics, then book | Above average. Explore alternate dates/airports before committing. |
| $[anchor] to $[max] | Under 4 weeks | Book now | Inside the window where fares reliably rise. |
| Above $[max] | Any | Apply all flexibility tactics | Above budget. Use every flexibility option before accepting. |
| Fare jumped 20%+ in one week | Any | Book within 24-48 hours | Demand surge or capacity reduction. Prices are accelerating. |

---

### True Cost Comparison

| Option | Carrier Type | Base Fare (per person) | Bags (each way, per person) | Seat Selection | Change/Cancel Policy | **True Cost (total, [N] travelers)** |
|--------|-------------|------------------------|----------------------------|----------------|----------------------|--------------------------------------|
| Option 1: [description] | [Legacy/LCC] | $[amount] | $[amount] | $[amount] | [policy summary] | **$[total]** |
| Option 2: [description] | [Legacy/LCC] | $[amount] | $[amount] | $[amount] | [policy summary] | **$[total]** |
| Option 3: [description] | [Legacy/LCC] | $[amount] | $[amount] | $[amount] | [policy summary] | **$[total]** |
| Alternate airport option | [Legacy/LCC] | $[amount] | $[amount] | $[amount] | [policy summary] | **$[total] + $[ground transport]** |

**Recommendation:** [State which option represents the best true value and why, in 1-2 sentences]

---

### Dated Action Plan

| Calendar Date | Weeks to Departure | Action Required |
|---------------|--------------------|-----------------|
| [specific date -- today] | [N] weeks | Set all fare alerts (see alert table above). Note current baseline fare of $[amount]. |
| [specific date] | [N] weeks | First active check. Compare to baseline. Note trend direction. |
| [specific date] | [N] weeks | Increase search frequency to every 2-3 days. |
| [specific date] | [N] weeks | If fare is at $[anchor] or below, book now. Do not wait past this date for a deal. |
| [specific date] -- **Decision Deadline** | [N] weeks | **Book at whatever price is available.** Below this line, the probability of a meaningful price drop is statistically low. |
| [specific date] -- **Last Resort Deadline** | [N] weeks | Apply last-minute tactics. Book regardless of price. |

---

### Special Conditions and Notes

- [Any unusual conditions for this route: monopoly carrier, recent route changes, known capacity constraints]
- [Seasonal overlay notes: holiday adjacency, school calendar effects, local event demand spikes]
- [Fare class recommendation: Is Basic Economy appropriate for this user's parameters, or should they avoid it?]
- [Loyalty program note: Does the user's airline affiliation affect which carrier or channel to prioritize?]
```

---

## Rules

1. **Never guarantee a specific price will appear.** Fare pricing is algorithmically dynamic. Historical patterns inform probability, not certainty. Always use "historically," "typically," and "based on observed patterns" rather than "the fare will be $X on [date]."

2. **Always calculate and present true cost, not advertised base fare.** The cheapest headline fare is the wrong number to compare. Every fare comparison must include bags (both directions), seat selection if required, and the opportunity cost of change restrictions. Presenting base fares alone without this context is actively misleading.

3. **Always include a hard booking deadline.** A search strategy without a commitment deadline causes analysis paralysis. The user must have a specific calendar date by which they book regardless of price. Never let the strategy trail off into "keep monitoring."

4. **Do not apply domestic booking window rules to international routes, or vice versa.** The "book 6 weeks out" rule is a domestic shorthand that is wrong for international routes, where the sweet spot is 3-6 months for most routes. Mixing these up causes expensive mistakes.

5. **Holiday travel is categorically different from standard travel.** For Christmas, Thanksgiving, summer peak, and spring break travel, the entire booking framework shifts to "book as early as possible." The standard monitoring and wait strategy causes users to pay 40-80% more than if they had booked at first availability. State this explicitly and prominently when holiday travel is detected.

6. **Account for group size in fare availability.** A user traveling with 4 people cannot apply single-seat pricing. Fare search results default to showing the cheapest available seat -- if only 1 seat is available at that price, searching for 4 returns the next pricing tier. Always note that 2+ travelers should be searched as a group to see the real fare.

7. **Basic Economy is not interchangeable with standard Economy.** Basic Economy fare class restrictions -- no seat selection, no changes, no cancellations, no upgrades, sometimes no carry-on bags -- make it a categorically different product. A user who needs any flexibility, has checked bags, or is traveling with family should not book Basic Economy even when it is cheaper on the surface.

8. **Alternate airport recommendations must include ground transport cost.** Never recommend an alternate airport without explicitly calculating the additional time and cost to get to/from that airport. A $70 fare savings erased by a $90 car service recommendation is not a savings recommendation.

9. **Fare alert thresholds must be set below the target, not at the budget ceiling.** An alert set at the maximum acceptable price notifies the user when they can barely afford the fare, not when they are getting a deal. Set the primary alert at the target "strong deal" price (15-20% below anchor) and a secondary alert at the anchor price as a "watch now" signal.

10. **Private/incognito browsing is standard practice for fare searches.** Some search engines exhibit price escalation behavior on repeated identical searches. Instruct users to use private browsing mode for any fare search where they are actively monitoring prices. This is not paranoia -- it is documented search behavior on multiple major platforms.

11. **One-way split ticketing carries rebooking risk.** When recommending two one-way tickets on different carriers, explicitly note that if the outbound flight is delayed causing a missed return, the passenger is on their own -- there is no interline agreement, and the missed return ticket is typically a forfeited fare.

12. **Do not recommend "error fares" as a reliable strategy.** Error fares (mispriced fares that appear briefly due to system glitches) are occasionally real and occasionally honored, but they cannot be planned around. They are windfalls, not strategies.

---

## Edge Cases

### Last-Minute Travel (Departure Within 14 Days)

Standard booking window logic does not apply. Fares are at or near maximum pricing. Apply a different toolkit:

- Search connecting itineraries specifically -- nonstop fares are usually the most expensive close-in, while connecting itineraries have residual inventory that carriers price lower to fill.
- Search one-way in both directions from different carriers, not a round-trip on a single airline. The combination can undercut the round-trip price.
- Early morning (before 7 AM) and red-eye (after 9 PM) departures have meaningfully less demand at this booking horizon. A 6 AM Tuesday departure can be $80-150 cheaper than a midday departure within 2 weeks.
- Consider nearby alternate airports more aggressively at this horizon. A 90-minute drive to a secondary airport is more justifiable when it saves $200+ per person, which is possible at last-minute pricing.
- Check one-day shifts. Departing on Thursday instead of Friday within a 2-week window can save $100-200 on domestic routes.
- For international last-minute, premium economy and business class are sometimes priced surprisingly close to economy at this horizon due to unsold premium cabin inventory. It is worth checking.

---

### Holiday Peak Travel (Thanksgiving, Christmas/New Year, Spring Break, Peak Summer)

The standard "monitor and wait" strategy fails completely for holiday travel. Key distinctions:

- Fares for Thanksgiving week (US domestic) start rising meaningfully in August -- 3-4 months before departure. Waiting until October typically costs 30-50% more.
- Christmas/New Year international fares start rising in September for December travel. A transatlantic fare that costs $600 in September can cost $1,100-1,400 for the same dates in November.
- For holiday travel, treat "book now" as the default and "wait" as requiring special justification. Do not give monitoring and wait advice for peak holiday travel -- it is the wrong approach.
- Shoulder dates around holidays offer real savings: Thanksgiving travel on Tuesday vs. Wednesday saves $80-200 on many domestic routes. Christmas travel departing December 23 vs. December 22 is often materially cheaper. A December 26 or 27 return is typically cheaper than December 30 or 31.
- If the holiday fare exceeds budget significantly, recommend shifting the trip entirely rather than waiting for a sale that will not come.

---

### Budget Airline (Low-Cost Carrier) Routes

Low-cost carriers (LCCs) price differently and require separate analysis:

- LCC base fares are frequently the cheapest option in the search results, but the unbundled fee structure can reverse the value comparison.
- A one-way LCC fare at $79 with a $35 checked bag, $25 carry-on fee (on ultra-low-cost carriers), and $20 seat selection becomes $159 before taxes -- potentially more expensive than a legacy carrier's all-in fare.
- Some ultra-low-cost carriers do not appear in major fare aggregators. Their fares must be checked directly on the carrier's website. A strategy that ignores direct search on LCC sites may miss the lowest price entirely.
- LCC cancellation policies are typically more punitive -- many offer only a travel credit rather than a refund, and credits may expire in 12 months or require a rebooking fee. A user with uncertain plans should price in the cost of this restriction.
- LCC on-time performance and rebooking capacity in irregular operations (weather cancellations, etc.) is typically worse than legacy carriers. For time-sensitive travel (connecting cruise, important event), price in the risk of irregular operations.

---

### Group Travel (5-9 Passengers)

Online booking systems typically allow up to 6-9 passengers per booking. Groups at or approaching this limit have specific complications:

- Search results displayed for 6+ passengers reflect the per-person price at the highest fare bucket that has that many seats. A flight showing $249 for 1 passenger may show $349 for 6 passengers on the same flight -- this is not a bug, it is real inventory pricing.
- For groups of 5-6, it is sometimes cheaper to split into two separate bookings (e.g., 3+2 or 3+3) rather than booking all as one group, if lower fare buckets have only 2-3 seats available.
- Groups of 10+ should contact the airline's group desk directly. Group fares include a name-change window, a deposit-and-final-payment structure, and sometimes blocked seating. The per-seat price for a legitimate group contract may be competitive with or lower than online pricing.
- Seating: Unless seats are specifically assigned at booking (which may cost extra), a group booking on one reservation does not guarantee seats together. At check-in, airlines can typically seat families with young children together when requested, but adult groups have no such guarantee.

---

### Fully Flexible Traveler (Dates and Destination Open)

This is the most advantageous fare-searching scenario and benefits from a different approach:

- Use "anywhere" or "everywhere" destination search tools available in major fare search engines to see which destinations from your home airport have the lowest prices in your target travel period.
- Use calendar or month-view search (showing full months of prices rather than a single date) to identify the cheapest departure date within your flexible window.
- Combine the two: search "cheapest destination from [airport] in [month]" to find both the destination and the date simultaneously optimized for price.
- This scenario can reduce airfare by 40-60% compared to searching for a fixed route on fixed dates.
- For this user, the booking window advice is inverted: act fast when a genuinely low-priced deal appears, because the best deals are often flash sales or limited inventory. A $350 round-trip fare to Europe is not going to be sitting there for three weeks.

---

### International Student or Long-Stay Travel (One-Way, or Stays Exceeding 30 Days)

Long-stay international travel has unique fare dynamics:

- Round-trip fares are almost always cheaper than one-way fares on international routes, sometimes by 50-100%. A traveler planning to be abroad for 6 months may find it cheaper to buy a round-trip and not use the return than to buy a one-way ticket.
- Open-jaw itineraries (different return city) often price similarly to standard round-trips and add flexibility at no premium.
- Some airlines and booking systems penalize open-ended or very long return dates (90-365 days out). If the user does not know their return date, pricing a flexible return ticket vs. the unused return ticket on a cheap round-trip is a real calculation to do.
- Student fare programs exist on some carriers and are priced outside standard fare buckets. These offer more flexible change policies and may include extra baggage. They are not widely advertised but are worth investigating for students with flexible travel dates.

---

### Transatlantic "Error Fare" or Flash Sale Sighting

Occasionally a user will report seeing an unusually low fare (e.g., $200 round-trip to Europe from the US) and ask if it is real:

- Do not dismiss it immediately, but do not build expectations. Genuine error fares do appear 3-8 times per year on major transatlantic routes, typically due to currency conversion errors, system misconfigurations, or routing errors.
- If the fare is more than 60% below the normal floor for that route, it may be an error fare. Error fares are sometimes honored and sometimes cancelled by the airline.
- Recommended approach: Book it if the user is willing to accept the risk that the ticket may be cancelled. Airlines in most jurisdictions are not legally required to honor pricing errors, but many do honor them once ticketed, especially on domestic routes.
- Do not book non-refundable hotels or connecting flights on the strength of an error fare until ticketing is confirmed and the fare has been stable for 24+ hours.
- Never characterize error fares as part of a reliable strategy. They are serendipitous.

---

## Example

**Input:**
"I want to fly from Chicago to Tokyo for two weeks in late March. Just me, economy. I can be flexible by about 5 days. I don't have a bag -- just a carry-on. Budget is $1,000 per person round-trip. Right now it's December 15th, so I have about 3-4 months. What's my strategy?"

---

**Output:**

## Airfare Search Strategy

**Route:** Chicago (ORD or MDW) to Tokyo (NRT or HND)
**Alternate Airports Considered:** ORD is the primary hub with the most transpacific options; MDW serves only domestic. NRT (Narita) and HND (Haneda) are both viable Tokyo airports with different ground transport costs to central Tokyo.
**Travel Dates:** Late March, approximately March 22-April 5, flexible ±5 days
**Flexibility Window:** ±5 days on departure and return
**Travelers:** 1 adult
**Cabin Class:** Economy
**Baggage Requirements:** Carry-on only (no checked bag fees)
**Change Flexibility Needed:** Moderate -- prefer standard economy with change option over Basic Economy
**Budget Target:** $1,000 per person round-trip
**Route Type:** Transpacific -- competitive but thin (4-6 carriers serve ORD-TYO with various routings); late March includes spring break overlap beginning ~March 22

---

### Price Anchor

| Metric | Value |
|--------|-------|
| Current baseline fare (today's observed price, mid-December) | $820-950 per person |
| Historical average for ORD-TYO late March | $850-1,050 per person round-trip |
| Target price (strong deal -- book immediately) | $750 or below (approx. 15-20% below average) |
| Acceptable price (reasonable deal) | $750-900 per person |
| Maximum price (book before exceeding this) | $1,000 per person (your budget ceiling) |

**Seasonal context:** Late March for Chicago-Tokyo is shaped by two overlapping forces. US spring break begins around March 22, which increases demand from this end. Japan's cherry blossom season peaks late March to early April, making this one of the highest-demand inbound periods for Japan. This combination means fares for the March 22-April 5 window are at seasonal peak. Fares for March 15-22 are meaningfully lower. Your ±5 days of flexibility is extremely valuable here -- shifting the departure to March 17-19 and the return to March 31-April 2 could place your travel in a significantly cheaper pricing band.

---

### Booking Window Timeline

| Phase | Dates | Weeks to Departure | Action | Expected Fare Behavior |
|-------|-------|-------------------|--------|------------------------|
| Early monitor (now) | Dec 15 -- Jan 15 | 14-18 weeks | Set all alerts. Check current fares to establish anchor. Do not book yet unless target fare appears. | Fares are present but typically not at competitive best this far out. However, a strong promotional fare now is worth taking. |
| Active search window | Jan 15 -- Feb 28 | 8-14 weeks | Search every 2-3 days. Act within 24 hours of seeing target fare. | Best deal density for transpacific typically falls in this window. |
| Closing window | Mar 1 -- Mar 15 | 5-8 weeks | Daily monitoring. Book immediately if fare is at or below $900. | Prices trending upward. Any fare at $900 or below should be booked same day. |
| Book regardless | Mar 15 -- Mar 22 | 3-5 weeks | Book at best available price. Do not continue to wait. | Rapid price escalation, cherry blossom demand peaking. |
| Last resort | After Mar 22 | Under 3 weeks | Apply last-minute transpacific tactics. Prices are near-maximum. | $1,100-1,400+ likely. Apply all flexibility tactics before booking. |

---

### Fare Alert Setup

| Alert # | Route | Dates Covered | Price Threshold | Purpose |
|---------|-------|---------------|-----------------|---------|
| Alert 1 | ORD to NRT | Mar 17 -- Apr 2 (±5-day window) | $750 | Primary target -- strong deal, book immediately |
| Alert 2 | ORD to NRT | Mar 17 -- Apr 2 | $900 | Monitor closely -- acceptable deal |
| Alert 3 | ORD to HND | Mar 17 -- Apr 2 | $750 | Haneda alternative (closer to central Tokyo, may have different fare) |
| Alert 4 | ORD to NRT | Mar 12 -- Mar 22 (slightly earlier departure) | $700 | Checks pre-spring-break pricing band |

**Alert guidance:** When any alert fires, open a private browsing session immediately, verify the fare, and be prepared to book the same day. Transpacific promotional fares at the target price do not persist for days -- inventory at those fare buckets is limited (often 4-8 seats).

---

### Flexibility Savings Analysis

| Tactic | Applicable? | Estimated Savings/Person | How to Capture |
|--------|-------------|--------------------------|----------------|
| Depart March 17-19 (before spring break surge) vs. March 22+ | Yes -- 5-day flexibility allows this | $100-250 | Search March 17 and March 18 departures separately; compare to March 22 |
| Return April 1-3 instead of April 5+ | Yes | $50-100 | Avoids full cherry blossom peak extension; search April 1-3 return |
| Fly into Haneda (HND) instead of Narita (NRT) | Yes | $0-80 fare savings | HND is closer to central Tokyo -- 30-40 min vs. 60-90 min, reducing ground transport cost. Net advantage: HND is preferred even at equal fare. |
| Accept 1 stop via a US West Coast hub (LAX, SFO, SEA) | Yes -- if tolerant of 16-20 hr total travel | $50-150 | Filter for 1-stop itineraries. Note: ORD nonstop to NRT does not exist -- all routings have at least one connection or are technically a "direct" with hub. Most ORD-TYO itineraries already connect via a West Coast hub. |
| Depart Tuesday or Wednesday vs. Friday or Sunday | Yes | $40-100 | Check midweek departures in the same week. Tuesday is typically cheapest transpacific departure day. |
| Shift entire trip to March 12-26 (fully pre-spring break, pre-cherry blossom peak) | Only if user can shift 5+ days earlier | $200-350 | March 12-18 travel is meaningfully cheaper than March 22+ for this destination |
| Split into two one-way tickets (ORD-TYO outbound, TYO-ORD return on different carrier) | Possible | $0-100 net | Check outbound and return pricing separately. Useful only if one direction has a strong carrier-specific sale. Note: no interline protection on separate tickets. |

**Highest-impact tactic for your trip:** Departing March 17-19 instead of March 22+ is likely worth $100-250 per person and keeps you within your stated ±5 day flexibility. Combined with a midweek (Tuesday) departure, this single shift could reduce your fare by $150-300 and drop you comfortably within the $750-850 target range.

---

### Booking Decision Framework

| Observed Fare | Weeks Remaining | Decision | Reasoning |
|---------------|-----------------|----------|-----------|
| Below $750 | Any | Book immediately | Below historical average for this route and season. Probability of a lower fare for late March cherry blossom season is very low. |
| $750-900 | 8+ weeks | Book within 48 hours | This is a reasonable-to-good fare for this specific travel window. Cherry blossom season routinely pushes fares above $1,000+. |
| $750-900 | 5-8 weeks | Book same day | Closing window. This fare is likely close to the lowest you will see. |
| $900-1,000 | 5+ weeks | Apply flexibility tactics (date shift, alternate Tokyo airport, midweek departure), then book | Above midpoint but within budget. Use the March 17-19 date shift tactic first. |
| $900-1,000 | Under 5 weeks | Book now | Inside the booking window where transpacific fares reliably rise. |
| Above $1,000 | Any | Shift departure to March 15-19 window first | Your dates are straddling a significant pricing boundary. A 3-5 day shift forward likely brings fare below $1,000. |
| Fare jumped $150+ in one week | Any | Book within 24-48 hours | Demand surge, likely cherry blossom tourism momentum. Prices will continue to accelerate. |

---

### True Cost Comparison

Since you are carry-on only, baggage fees drop out of this comparison, which significantly simplifies it. The main variables are base fare, seat selection, and change policy.

| Option | Carrier Type | Base Fare | Carry-On | Seat Selection | Change Policy | **True Cost (1 traveler)** |
|--------|-------------|-----------|----------|----------------|---------------|---------------------------|
| Legacy carrier nonstop* (ORD via West Coast hub to NRT) | Full-service | $820 | Included | $0-30 (complimentary on most full-service carriers in economy) | Change fee $0-200 depending on fare bucket | **$820-850** |
| Legacy carrier on mid-tier fare bucket | Full-service | $720 | Included | $0-30 | Change fee $150-200 | **$720-750** |
| Basic Economy variant | Full-service restricted | $650 | Included (international usually) | No selection -- random seat assigned | Non-changeable, non-refundable | **$650** (but zero flexibility -- if plans change, you lose the ticket) |
| Low-cost carrier (limited transpacific service) | LCC | $580-680 | May require check if personal item only | $15-30 | Minimal -- typically credit only | **$610-720** + verify carry-on policy carefully |

*Note: All ORD-TYO routings involve at least one connection via a US West Coast hub (LAX, SFO, SEA, ORD direct to NRT does not currently operate as a nonstop with most carriers). This is expected for the route -- it is not a disadvantage.

**Recommendation:** The mid-tier legacy carrier fare at $720-750 provides the best balance of price, change flexibility, and included carry-on. Basic Economy saves $70-100 but costs you all flexibility -- for a solo transpacific trip, the change fee insurance is worth $70. Verify whether the carrier you select includes seat selection at no charge in standard economy for international routes (many do).

**Haneda vs. Narita note:** If fares to HND and NRT are within $30 of each other, choose HND. The Keikyu Airport Express to Shinagawa takes 13 minutes (¥410 / ~$3 USD) vs. the Narita Express to Tokyo Station at 50-60 minutes (¥3,070 / ~$21 USD). HND saves roughly $18-36 round-trip in ground transport and 75-90 minutes of travel time. Factor this into the true cost comparison.

---

### Dated Action Plan

| Calendar Date | Weeks to Departure | Action Required |
|---------------|--------------------|-----------------|
| December 15 (today) | ~15 weeks | Set all four fare alerts (see alert table). Note current baseline fare of $850-950. Begin weekly checks. |
| December 22-31 | ~14 weeks | Holiday period -- fare checking is lower priority. Confirm alerts are active. |
| January 6 | ~12 weeks | First active check. Compare to December baseline.
