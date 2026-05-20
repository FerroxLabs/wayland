---
name: accommodation-evaluator
description: |
  Creates a structured comparison framework for evaluating hotels, hostels,
  vacation rentals, and other accommodation types. Produces a weighted scoring
  rubric with red-flag indicators and a side-by-side comparison table. Use when
  the user asks about choosing between accommodation options, evaluating
  rental listings, comparing hotel types, or creating accommodation selection
  criteria for a trip. Do NOT use for general trip planning (use
  trip-itinerary-builder), budget optimization (use budget-travel-planner),
  or booking strategy (use airfare-search-strategy for flights).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel research checklist analysis"
  category: "travel-experiences"
  subcategory: "trip-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Accommodation Evaluator

## When to Use

Use this skill when the user's primary need is **evaluating, comparing, or scoring specific accommodation options** against each other or against personal criteria.

**Trigger scenarios:**
- User has 2-4 specific listings in hand (hotel rooms, vacation rentals, hostels) and needs a structured comparison
- User is deciding between accommodation types (e.g., "Should I book a hotel or apartment for this trip?") and needs pros/cons plus a scoring framework
- User wants to know what questions to ask a host or hotel before booking, or what red flags to look for in a listing
- User is evaluating a single vacation rental listing and wants to know if it's legitimate, fairly priced, and a good fit
- User needs to calculate the true all-in cost of accommodations that advertise different fee structures (one shows $89/night, another shows $150/night with breakfast included)
- User is choosing between accommodation tiers -- economy vs. mid-range vs. boutique -- and needs a value analysis framework
- User needs criteria-based guidance for a specific trip type (family travel, remote work stay, accessibility requirements, large group)
- User asks "Is this Airbnb price fair?" or "What should I look for in a hostel?" or "How do I know if this rental is a scam?"

**Do NOT use when:**
- User needs end-to-end trip planning (use `trip-itinerary-builder` -- that skill coordinates accommodation within the full itinerary context)
- User's primary question is about budget allocation across the full trip, not accommodation evaluation (use `budget-travel-planner`)
- User wants to know the best time to book or how far in advance to reserve (this skill evaluates options, not booking windows -- use booking strategy guidance separately)
- User is searching for options and has no listings yet (this skill evaluates; it does not search or recommend specific properties)
- User is evaluating a property for purchase or long-term lease as real estate (use personal finance or real estate skills)
- User asks only about flight accommodation (connecting flight layovers with hotel stays -- use `airfare-search-strategy`)
- User is asking about loyalty program strategy (points valuation, status matching, credit card benefits) -- that is a separate redemption optimization topic

---

## Process

### Step 1: Gather Accommodation Intelligence

Before scoring anything, collect the variables that determine what "good" means for this specific trip. Do not assume defaults.

- **Trip parameters:** Destination city and preferred neighborhood or district; exact dates (check-in and check-out); number of nights; number of guests broken down by adults, children (with ages), and infants
- **Budget clarity:** Ask for budget as a per-night target AND a total-stay ceiling -- these often conflict once fees are added. Distinguish between "I want to spend $150/night" and "I cannot spend more than $1,200 total under any circumstances"
- **Travel purpose:** Business travel, leisure, romantic trip, family vacation, extended remote work, group celebration, medical travel, backpacking. Purpose determines which criteria matter most
- **Non-negotiables (deal-breakers):** These eliminate options before scoring begins. Common examples: must have air conditioning (critical in tropical destinations above 28°C/82°F), must allow pets, must be wheelchair accessible, must have a dedicated workspace with reliable internet (critical for remote workers), must have parking, must not require a car, ground floor only, private bathroom required
- **Stated priorities:** Ask the user to rank these five dimensions in order: Location, Price/Value, Space, Amenities, and Flexibility. Their ranking directly determines scoring weights
- **Existing options:** Get the specific listings or accommodation types the user is considering. If they have listing URLs or descriptions, analyze those; if they have only general types, help them define evaluation criteria before applying them

### Step 2: Set Weights Based on Stated Priorities

Convert the user's priority ranking into a 1-5 weight scale. The highest-ranked priority gets weight 5; the lowest gets weight 1. Middle ranks get 2, 3, and 4 respectively. If two priorities are equal, assign the same weight.

**The six evaluation dimensions and what each actually measures:**

- **Location (weight 1-5):** Not just "is it central" but proximity to the specific things this trip requires. For a beach vacation, beachfront vs. 10-minute walk is the meaningful gradient. For business travel, proximity to the conference venue and airport transport matters. Assess: walkability score, transit access, neighborhood safety at night, noise level (avoid properties on major arterials, near nightlife districts, or under flight paths unless stated otherwise), and parking access if renting a car
- **Price/Value (weight 1-5):** True cost per night after all fees, divided by what that cost delivers in quality and included services. A $200/night hotel with breakfast, daily housekeeping, pool, and gym is often better value than a $130/night apartment with a $90 cleaning fee, no included services, and self-catering costs
- **Space/Layout (weight 1-5):** Total square footage matters less than usable layout. Evaluate: number of bedrooms relative to party size, number of bathrooms (critical for groups of 4+), presence of living room or common area separate from sleeping area, kitchen size and equipment level, outdoor space (balcony, terrace, garden), and storage space for luggage on longer stays
- **Amenities (weight 1-5):** Score based on what the trip actually needs. A kitchen is high-value on a 10-night stay but nearly irrelevant on a 2-night city break. Amenities that change the trip's economics or daily experience: full kitchen (grocery vs. restaurant costs), laundry (critical for stays over 7 nights or with children), dedicated workspace with desk and monitor-level lighting, pool/fitness center, parking, cribs or child safety equipment, air conditioning or reliable heating
- **Reviews/Reputation (weight 1-5):** Quality and pattern of reviews, not just the aggregate score. Hotel review ecosystems (TripAdvisor, Booking.com, Google) and vacation rental ecosystems (Airbnb, Vrbo) have different score calibrations -- a 4.3 on Booking.com is excellent; a 4.3 on Airbnb is a warning sign. Evaluate: total review count, review recency (last 6 months matters more than older reviews), consistency across platforms, how management responds to negative reviews, and whether reviews address the specific things you care about
- **Flexibility (weight 1-5):** The financial risk profile of the booking. Free cancellation to 24-48 hours before is ideal. Moderate policies (free cancellation 7-14 days out) are acceptable. Strict policies (50% non-refundable immediately, no refund within 30 days) represent real financial risk, especially for trips more than 4 weeks out or for travelers with unpredictable schedules. Weight flexibility higher if: the trip is long in the future, the traveler has health or family unpredictability, or if travel insurance is not in place

### Step 3: Score Each Option on Every Dimension

For each accommodation option, assign a raw score of 1-5 on each dimension:

- **5 -- Exceeds needs:** Materially better than required. A family needing 2 bedrooms gets 3 bedrooms; beachfront property when beach proximity is the goal
- **4 -- Meets needs comfortably:** Fits requirements with minor extras. Good location, no concerns
- **3 -- Adequate:** Meets the minimum threshold. Acceptable but not impressive. A workspace that is technically a desk in the corner of the bedroom
- **2 -- Below expectations:** A gap exists that will affect the experience. A 15-minute walk to the beach for a beach trip; a studio apartment for 4 adults
- **1 -- Fails to meet needs:** A disqualifying problem in this dimension, though not necessarily a deal-breaker if the criterion is weighted low

Calculate the weighted score for each dimension: raw score x weight. Sum all weighted scores for each option's total. Maximum possible score = sum of all weights x 5. Express as a fraction (e.g., 78/100) where the denominator is max possible score.

### Step 4: Run the Red-Flag Screening Protocol

Apply this checklist independently for every option, regardless of how well it scored. A high-scoring option with red flags should trigger explicit caution in the recommendation.

**Pricing red flags:**
- Price more than 30-40% below comparable properties in the same neighborhood and date range -- most common scam indicator for rentals
- Cleaning fee that exceeds 50% of one night's rate (e.g., $150 cleaning fee on a $100/night property for a 3-night stay) -- this is a fee-hiding practice
- "Resort fee" or "facility fee" not disclosed in the listing headline price, discovered only at checkout -- common in Las Vegas, Miami, New York hotels; can add $30-60/night
- Pricing that changes dramatically between the listing page and checkout without clear itemization

**Listing quality red flags:**
- Stock photos or images with metadata suggesting they are from a photo bank rather than the actual property
- Fewer than 8-10 photos for a full apartment or house listing (a legitimate host has nothing to hide)
- No photo of the bathroom, the beds, or the street/entrance
- Listing description uses vague language like "cozy" (often means very small) or "close to everything" without specific distances
- Property labeled "newly renovated" but photos show worn fixtures -- misrepresentation risk
- Description mentions amenities (washer, dishwasher, AC) not visible in any photos

**Review red flags:**
- All reviews are 5 stars with generic text ("Great place! Would come back!" with no specifics) -- potential review manipulation
- No reviews mentioning anything negative, even minor issues -- statistically improbable for any real property
- Sudden cluster of positive reviews in a short window after a period of negative reviews -- possible review gaming
- Reviews that mention the listing "not as described" or "smaller than expected" -- take this seriously; it indicates a persistent accuracy issue
- Host never responds to negative reviews -- indicates low accountability
- Review score below 4.0 on Airbnb or Vrbo (these platforms have score inflation; below 4.0 is genuinely poor)
- Review score below 7.5 on Booking.com (different scale; 8.0+ is good, 7.5-8.0 is acceptable, below 7.5 is concerning)

**Policy red flags:**
- Payment requested outside the booking platform (wire transfer, Zelle, crypto) -- this is almost always a scam
- Security deposit that seems disproportionate to the property value (e.g., $1,000 deposit on a $100/night studio)
- Cancellation policy is "non-refundable" by default with no moderate option offered
- Check-in requires an in-person key handoff with no backup procedure described -- creates stranded-traveler risk
- No clear process for reporting maintenance issues or emergencies during the stay

**Communication red flags:**
- Host does not respond within 24 hours to a direct question -- a reliable host responds within 2-6 hours during waking hours
- Evasive or scripted responses that don't actually answer specific questions
- Host pressures you to book quickly ("someone else is interested") before you have your questions answered -- this is a classic scam tactic
- Host asks you to communicate outside the platform after initial contact (email only, WhatsApp only) -- removes the booking platform's dispute resolution protections

### Step 5: Calculate True Cost

The advertised nightly rate is never the total cost. Build a complete fee ledger for each option.

**Fee components to calculate:**

1. **Base rate:** Advertised nightly rate x number of nights
2. **Cleaning fee:** One-time for vacation rentals; typically $50-200 for apartments; $150-400 for houses. Note that this fee does not scale with nights -- a $120 cleaning fee on a 2-night stay adds $60/night but only $17/night on a 7-night stay
3. **Service or platform fee:** Booking.com typically charges nothing to the guest (it's hotel-side); Airbnb charges guests 14-16% of the subtotal; Vrbo charges 6-12% guest fee. These are significant
4. **Resort or facility fee:** Hotels in tourist-heavy markets (Las Vegas, Miami, New York, Cancun, Hawaii) charge $25-65/night on top of the room rate. This is separate from the room rate and often not shown until checkout on OTA sites
5. **Parking:** Urban hotels commonly charge $25-60/night for parking in North America and Europe; this is often not included even at full-service hotels. Vacation rentals in suburban or rural areas often include free parking
6. **Tourist/city tax:** Many European cities (Amsterdam, Rome, Barcelona, Paris) and some US cities charge a per-person-per-night tax of €1-7 per person. For a family of 4 over 7 nights, this can add $56-200
7. **Additional guest fees:** Some vacation rentals charge per-person above a base occupancy (e.g., base rate for 2 guests, $15/night per additional guest). Check the listing's guest capacity carefully
8. **Kitchen savings (if applicable):** For stays of 5+ nights where a kitchen is available, estimate grocery spend vs. equivalent restaurant spend. A family of 4 eating out three meals/day in Europe can spend $150-200/day; cooking breakfast and lunch at home reduces this to $50-80/day in groceries. Over 7 nights, this is a $700-840 true savings that should offset a slightly higher rental rate
9. **Total true cost = sum of all above fees for the full stay**
10. **True cost per night = total true cost / number of nights**

Always present the true cost per night alongside the advertised rate. The gap is often 20-50%.

### Step 6: Generate Recommendation and Booking Checklist

The recommendation must directly address the user's stated priorities and the red-flag findings. Structure it as:

- **Top choice with explicit reasoning:** Which option scores highest when weighted scores, true cost, and red-flag status are all considered together. Do not recommend a highest-scoring option that has an unresolved red flag without flagging the risk
- **Conditions under which the runner-up would be better:** There is almost always a scenario (trip gets extended, budget tightens, flexibility becomes important) where the second option wins
- **Avoidance recommendation if warranted:** If any option has a red flag that is serious enough to constitute a scam risk or high probability of misrepresentation, say so directly
- **Booking checklist:** A specific set of pre-booking verification actions tailored to the accommodation type and the specific issues identified during evaluation. Not generic; each item should address a specific risk or uncertainty identified during the analysis

---

## Output Format

```
## Accommodation Comparison

**Destination:** [city and neighborhood/district]
**Dates:** [check-in date] to [check-out date] ([N] nights)
**Guests:** [number and breakdown: e.g., 2 adults, 2 children ages X and Y]
**Budget target:** $[per night] / $[total stay ceiling]
**Travel purpose:** [e.g., family beach vacation, remote work stay, business trip]
**Top priority:** [stated #1 priority from user ranking]

---

### Evaluation Criteria (Weighted)

| Criterion | Weight (1-5) | Reasoning |
|-----------|-------------|-----------|
| Location | [1-5] | [specific reason this trip needs this weight -- name the key location requirement] |
| Price/Value | [1-5] | [specific reason based on budget tightness and included services] |
| Space/Layout | [1-5] | [specific reason based on party size, trip length, travel purpose] |
| Amenities | [1-5] | [name the specific amenities that matter: kitchen, workspace, laundry, etc.] |
| Reviews | [1-5] | [why reliability matters or doesn't at this level for this trip] |
| Flexibility | [1-5] | [specific risk factors: trip timing, cancellation risk, insurance status] |
| **Max possible score** | [sum x 5] | |

---

### Side-by-Side Comparison

| Criterion | Wt | [Option A: Type + Name/Description] | Raw | Wtd | [Option B: Type + Name/Description] | Raw | Wtd | [Option C: Type + Name/Description] | Raw | Wtd |
|-----------|----|------------------------------------|-----|-----|-------------------------------------|-----|-----|-------------------------------------|-----|-----|
| Location | [W] | [specific detail: distance to key destination, transit access, neighborhood] | [1-5] | [WxS] | [specific detail] | [1-5] | [WxS] | [specific detail] | [1-5] | [WxS] |
| Price/Value | [W] | [advertised rate, what's included, value assessment] | [1-5] | [WxS] | [same] | [1-5] | [WxS] | [same] | [1-5] | [WxS] |
| Space/Layout | [W] | [sqm if known, bedroom count, bathroom count, key layout feature] | [1-5] | [WxS] | [same] | [1-5] | [WxS] | [same] | [1-5] | [WxS] |
| Amenities | [W] | [list the relevant amenities present and absent] | [1-5] | [WxS] | [same] | [1-5] | [WxS] | [same] | [1-5] | [WxS] |
| Reviews | [W] | [score, count, platform, key patterns in recent reviews] | [1-5] | [WxS] | [same] | [1-5] | [WxS] | [same] | [1-5] | [WxS] |
| Flexibility | [W] | [cancellation policy specifics: free cancel until when? Penalty after?] | [1-5] | [WxS] | [same] | [1-5] | [WxS] | [same] | [1-5] | [WxS] |
| **TOTAL** | [max] | | | **[sum/max]** | | | **[sum/max]** | | | **[sum/max]** |

---

### True Cost Analysis

| Cost Component | [Option A] | [Option B] | [Option C] |
|---------------|------------|------------|------------|
| Advertised rate ([N] nights x $/night) | $[calc] | $[calc] | $[calc] |
| Cleaning fee (one-time) | $[amt or N/A] | $[amt or N/A] | $[amt or N/A] |
| Platform/service fee ([X]% of subtotal) | $[calc] | $[calc] | $[calc] |
| Resort/facility fee ($X/night x N nights) | $[calc or N/A] | $[calc or N/A] | $[calc or N/A] |
| Parking ($X/night x N nights) | $[calc or N/A] | $[calc or N/A] | $[calc or N/A] |
| Tourist/city tax ($X/person/night x guests x nights) | $[calc] | $[calc] | $[calc] |
| Additional guest fees (if applicable) | $[calc or N/A] | $[calc or N/A] | $[calc or N/A] |
| Breakfast/meals offset (kitchen savings) | -$[savings or N/A] | -$[savings or N/A] | -$[savings or N/A] |
| **Total True Cost** | **$[total]** | **$[total]** | **$[total]** |
| **True Per-Night Rate** | **$[total/N]** | **$[total/N]** | **$[total/N]** |
| **Budget variance** | [over/under by $X] | [over/under by $X] | [over/under by $X] |

> **Key insight:** [One sentence identifying the most important or counter-intuitive finding in the true cost analysis -- e.g., "The apartment appears cheapest at $95/night but is the most expensive option at $178/night true cost after Airbnb fees and cleaning; the hotel at $149/night is actually cheaper total."]

---

### Red-Flag Assessment

| Category | [Option A] | [Option B] | [Option C] |
|----------|------------|------------|------------|
| Pricing transparency | ✅ Clear / ⚠️ Caution / 🚫 Red Flag | [status] | [status] |
| Listing accuracy | [status + specific note] | [status + note] | [status + note] |
| Review legitimacy | [status + specific note] | [status + note] | [status + note] |
| Policy fairness | [status + specific note] | [status + note] | [status + note] |
| Host/property communication | [status + specific note] | [status + note] | [status + note] |

**Flags requiring action before booking:**
- [Specific issue for specific option and what to do about it]
- [Specific issue for specific option and what to do about it]

---

### Recommendation

**Top choice: [Option Name/Type]**
[2-3 sentence explanation that directly references the weighted score, true cost comparison, and red-flag status. Explain WHY this option wins given the stated priorities.]

**Runner-up: [Option Name/Type] -- best when:**
[Specific scenario where this option would be the better choice: budget tightens, trip extends, flexibility becomes needed, etc.]

**Avoid: [Option Name/Type if applicable]**
[Direct explanation of the disqualifying issue. Be specific.]

---

### Pre-Booking Checklist

**[Option A: specific steps if booking this one]**
- [ ] [Specific verification step with the exact question to ask or thing to check]
- [ ] [Specific step]
- [ ] [Specific step]
- [ ] Mark the free cancellation deadline: [date] -- calendar reminder recommended

**[Option B: specific steps if booking this one]**
- [ ] Message the host with: "[exact question addressing the specific gap or risk identified]"
- [ ] Ask: "[exact question about a specific amenity or policy detail]"
- [ ] Confirm total fees match: base rate $X + cleaning fee $X + service fee $X + tax $X = $X
- [ ] Read the 5 most recent reviews on [platform] and note any recurring complaints
- [ ] Verify the host's response rate and response time on their profile (look for 90%+ response rate)
- [ ] Save the host's phone number and the booking platform's emergency line before arrival
```

---

## Rules

1. **Never use the advertised nightly rate as the basis for comparison.** Always calculate and display true cost per night inclusive of all fees. The single most common mistake in accommodation comparison is accepting the headline price. A $99/night vacation rental with a $150 cleaning fee, 15% service fee, and $4/person/night city tax for 4 people over 3 nights actually costs $172/night true -- 74% more than advertised.

2. **Weight criteria based solely on the user's stated priorities, not on what you think matters.** If a solo business traveler says workspace reliability is their top priority and location is their lowest priority, workspace gets weight 5 and location gets weight 1 -- even if you think a central location would serve them well. Their priorities drive the weights.

3. **Review scores must be interpreted in their platform context.** Airbnb scores are heavily inflated by mutual review dynamics: 4.7-5.0 is normal, 4.3-4.6 is a yellow flag, below 4.3 is a red flag. Booking.com uses a 10-point scale: 8.5+ is excellent, 8.0-8.5 is good, 7.5-8.0 is acceptable, below 7.5 is poor. TripAdvisor uses a 5-point bubble scale with less inflation. Never compare a 4.6 Airbnb rating to an 8.6 Booking.com rating as if they were equivalent -- interpret each within its own ecosystem.

4. **Treat the cleaning fee as a fixed cost divided by nights, not a single payment.** A $100 cleaning fee is irrelevant on a 14-night stay ($7/night) but is a 50% surcharge on a 2-night stay ($50/night). When a user is comparing a hotel to a vacation rental for a short stay, the cleaning fee often eliminates the rental's advertised price advantage entirely.

5. **Apply the red-flag checklist to every option, including hotels.** Hotels can have hidden resort fees, misleading photos, inaccurate location descriptions ("beachfront" properties that require a 10-minute shuttle), and non-transparent cancellation penalties. The red-flag protocol is not only for vacation rentals.

6. **A high weighted score does not override a serious red flag.** If an option scores 88/100 but has a communication red flag (payment requested outside the platform), the recommendation must explicitly flag this as a potential scam risk regardless of the score. Weighted scoring measures fit to criteria; red-flag screening measures trustworthiness. Both must pass.

7. **Kitchen savings must be quantified for stays of 5+ nights when one option has a kitchen and another does not.** Do not assume a kitchen is merely a nice-to-have. For a family of 4 eating out three meals per day at typical tourist-area prices ($50-80 per meal), the daily food cost is $150-240. Cooking even breakfast and lunch reduces this by 50-60%. Over 7 nights, a kitchen can represent $500-800 in savings that directly affects which option is truly affordable.

8. **Cancellation policy risk scales with time horizon.** A strict non-refundable policy on a booking 90 days from travel represents significantly higher financial risk than the same policy on a booking 5 days before travel. When the user's trip is more than 45 days away and the booking is non-refundable, note the dollar amount at risk and recommend whether travel insurance should be considered.

9. **For vacation rentals with fewer than 20 reviews, lower the confidence level of the review assessment explicitly.** Under 20 reviews is statistically insufficient to establish a reliable pattern. Under 5 reviews should be flagged as "insufficient review history." A 5.0 rating with 3 reviews is not trustworthy data. The score may be accurate, but the sample size means one bad stay could reflect a genuine problem.

10. **Never recommend contacting a host or booking outside the original platform.** Always direct pre-booking questions through the platform's messaging system. This creates a documented record if a dispute arises and keeps the booking under the platform's buyer protection. This is especially important when a host proactively suggests an off-platform discount -- this is a red flag, not a deal.

---

## Edge Cases

### Extended Stay (10+ nights or monthly)

Monthly rates on vacation rental platforms are typically 20-40% lower per night than short-stay rates, but this discount may not appear until you enter exact dates in the search. Always check what the monthly pricing is explicitly if staying 21+ nights. At 28+ nights, many jurisdictions reclassify the rental from a short-term to a medium-term tenancy, which changes the host's cancellation rights and the guest's protections -- this is jurisdiction-specific and worth verifying.

For extended stays, reprice every criterion's relative importance: laundry moves from a nice-to-have to essential (weighted 4-5); workspace quality becomes critical for remote workers; neighborhood walkability to grocery stores and daily-need services becomes as important as proximity to tourist attractions; and gym access or exercise infrastructure becomes relevant for stays over 2 weeks.

A furnished apartment with a full kitchen on a 28-night stay at $80/night ($2,240 total) is almost always superior to a hotel at $110/night ($3,080 total), even ignoring meal savings. Calculate the break-even kitchen savings to make this explicit.

### Large Groups (8+ people)

The fundamental question is: **one large property vs. multiple smaller properties vs. multiple hotel rooms.** Run a per-person true-cost comparison across all approaches, not just a total-cost comparison.

Large vacation homes (8-16 people) present specific risks: photos may represent idealized staged versions, the communal spaces may be excellent but the private sleeping rooms inadequate, bathrooms become a bottleneck (calculate the bathroom-to-person ratio -- aim for no fewer than 1 bathroom per 3 people), and noise carries between rooms in ways that matter for mixed-age groups.

Hotels for large groups offer consistent quality room by room, but room blocks require direct negotiation with the hotel and are rarely available via OTA booking platforms. A group rate directly with the hotel's sales desk often yields 15-25% discounts for 8+ rooms and adds flexibility on room count.

Peer-to-peer coordination risk increases with group size. Who manages check-in logistics? Is there one keyholder? How are costs split? These are not accommodation evaluation questions but they affect which option is actually practical to execute.

### Traveling with an Infant (Under 2 Years)

Standard accommodation evaluation criteria apply with modified priorities. Space/layout weight increases because you need a separate sleeping area for the infant -- a studio or open-plan apartment with an infant is functionally unusable for 18 months and older (sleep cycle conflicts). Ground floor or elevator access is non-negotiable with a stroller.

Specific questions to ask before booking any rental with an infant:
- Is a crib or pack-n-play available, or is there space to set up a travel crib? (Measure the proposed space if they provide dimensions)
- Are outlets covered or is outlet-proofing available?
- Are there stairs inside the unit without gates?
- Is the building entrance stroller-accessible without stairs?

Hotels at mid-range and above typically have crib-on-request as a standard service and baby-proofing kits. Vacation rentals are inconsistent. Flag this gap explicitly.

### Accessibility Requirements

This case requires overriding the standard evaluation process. Before scoring any dimension, gather the specific accessibility requirements in clinical detail: wheelchair or mobility device type (manual chair, power chair, walker), required doorway clearance (most power chairs need 32-36 inches; 32 inches is the ADA minimum), shower type needed (roll-in vs. fold-down seat vs. transfer bench), whether a hospital-height bed is required, and the distance from accessible parking or drop-off to the room entrance.

Hotels at major chains have ADA-compliant rooms (in the US) or equivalent (in Europe under EN 17210 guidelines), but the quality varies significantly room to room. Always call the hotel directly and ask: "Can you confirm the specific accessible room you will assign me has a roll-in shower?" Booking through an OTA does not guarantee this.

Vacation rentals are inconsistently accessible. Many claim "accessibility" based on having no stairs, while having other barriers (narrow doorways, wet-floor bathrooms, heavy sliding doors). For any rental claiming accessibility, request a video walkthrough or a photo of: the entrance, the bathroom with tape measure on the doorway, and the shower or bathing area.

Weight location higher for accessibility-focused trips: proximity to the itinerary's main activities reduces the number of times the guest must navigate transportation -- each additional transit leg adds fatigue and barrier risk.

### Destination with Fewer Than 5 Accommodation Options

In remote areas, small islands, ski villages, or rural destinations, choice is limited and the evaluation framework must adapt. The red-flag threshold must remain rigorous -- in fact, in markets with few alternatives, marginal operators face less competitive pressure to maintain quality, so red flags are more common, not less.

In this scenario: expand the comparison to include accommodation types the user may not have initially considered (glamping, guesthouses, inn-style B&Bs, dormitory lodges, or camping with provided equipment). Re-weight flexibility higher than normal because if you arrive and the property is misrepresented, your alternatives are nearly zero. Confirm directly with the property: "What is your emergency contact process if there are issues with the unit?" A property that cannot answer this question clearly is higher risk when you have nowhere else to go.

### The "Too Good to Be True" Listing

When a listing is priced 35% or more below comparable properties in the same market for the same dates, apply extra scrutiny before any scoring. Price outliers in accommodation markets are almost always one of three things: (a) a scam listing using stolen photos from a legitimate property, (b) a real but severely misrepresented property, or (c) a genuine deal with a significant undisclosed flaw (under renovation next door, no hot water, HVAC broken). Option (c) exists but is rare.

Verification protocol for potential scam listings: Reverse-image-search the main listing photos (right-click in most browsers). If the same photos appear under a different listing or a different owner's name, it is a stolen listing. Check if the listing has existed for more than 12 months (platforms sometimes show this). Look for the property's address in street-view mapping tools to verify the building exists and matches the photos. If the listing passes all photo checks but is still anomalously cheap, ask the host a specific, detail-oriented question ("What model is the coffee maker in the kitchen?") -- a scammer working from stolen photos cannot answer; a real host can.

### Mismatched Party with Accommodation Maximum Occupancy

Some vacation rentals list a maximum occupancy that is technically compliant (e.g., 6 people in 3 bedrooms with fold-out sofas) but impractical in daily use. A family with young children in a 3-bedroom advertised for 8 needs a more nuanced look: How many beds are double or queen size vs. twin? Is the fold-out sofa in a shared living area, eliminating evening space for adults after children's bedtime?

Apply a bathroom-to-person ratio test: 1 bathroom per 1-3 people is comfortable; 1 bathroom per 4-5 people creates morning coordination problems for any group with fixed departure schedules. Note this explicitly in the Space/Layout assessment.

---

## Example

**User input:** "I'm going to Lisbon for 8 nights in June with my partner. We work remotely and need to actually be able to work during the day -- reliable fast internet is a must. Budget is around $120/night but flexible to $150 if it's worth it. I'm looking at three options: a chain hotel near Marquês de Pombal for €125/night, a 1-bedroom apartment in Alfama listed at €85/night, and a studio in Príncipe Real at €105/night. Which should I pick?"

---

## Accommodation Comparison

**Destination:** Lisbon, Portugal
**Dates:** 8 nights in June
**Guests:** 2 adults (remote workers)
**Budget target:** €120/night target; €150/night ceiling; ~€960-1,200 total for base accommodations
**Travel purpose:** Leisure + remote work (dual-purpose: must support daytime work)
**Top priority:** Workspace reliability (internet, dedicated workspace) > Location > Price/Value > Space > Flexibility > Amenities

---

### Evaluation Criteria (Weighted)

| Criterion | Weight (1-5) | Reasoning |
|-----------|-------------|-----------|
| Location | 4 | Lisbon's three neighborhoods each have distinct characters; proximity to café culture and transit matters for a couple alternating work and exploration |
| Price/Value | 3 | Budget is €120 target with €150 ceiling -- flexibility exists but not unlimited; true cost comparison matters given fee differences between a hotel and rentals |
| Space/Layout | 3 | Two remote workers need to be able to work simultaneously without sitting on top of each other; dedicated workspace in addition to a bed is the threshold |
| Amenities | 5 | Internet reliability is the stated non-negotiable; a workspace with a proper desk; kitchen is high-value for an 8-night stay to control costs |
| Reviews | 3 | Established hotel has verifiable quality floor; rentals need scrutiny. Reliability matters when work depends on the accommodation |
| Flexibility | 2 | Dates are set; remote workers typically have more schedule flexibility than office workers. Cancellation risk is lower concern |
| **Max possible score** | **90** (18 x 5) | |

---

### Side-by-Side Comparison

| Criterion | Wt | Option A: 4-Star Chain Hotel (Marquês de Pombal) | Raw | Wtd | Option B: 1-Bedroom Apartment (Alfama) | Raw | Wtd | Option C: Studio (Príncipe Real) | Raw | Wtd |
|-----------|----|-------------------------------------------------|-----|-----|----------------------------------------|-----|-----|----------------------------------|-----|-----|
| Location | 4 | Marquês de Pombal: central business district, metro access (Yellow/Blue line), flat terrain, excellent transit hub. Walkable to Chiado and Baixa. Quieter at night than Bairro Alto | 5 | 20 | Alfama: scenic, historic, tourist-heavy. Extremely hilly and largely inaccessible by metro. Beautiful but tiring for daily commuting to other neighborhoods. Poor transit access | 2 | 8 | Príncipe Real: upscale residential, walkable to Chiado and Bica, mirabells and gardens nearby. No metro station but trams and Ubers accessible. Quiet evenings, café-dense | 4 | 16 |
| Price/Value | 3 | €125/night advertised. Hotel pricing transparent. Continental breakfast included (value ~€12-15/person = €24-30/day). No hidden platform fee | 4 | 12 | €85/night advertised. Vacation rental pricing will add cleaning fee (~€80), Airbnb service fee (~15%), and tourist tax (€2/person/night). True cost will be significantly higher than headline | 3 | 9 | €105/night advertised. Similar rental fee structure. Service fee applies. Cleaning fee (~€60 for studio). More honest headline-to-true ratio than Alfama apartment | 3 | 9 |
| Space/Layout | 3 | Standard 4-star double room: ~25-30 sqm. Desk in room (hotel standard). No living room separate from sleeping area. One bathroom. No kitchen | 3 | 9 | 1-bedroom apartment: ~45-55 sqm typical for Alfama conversions. Separate bedroom and living room. Kitchen. However, Alfama buildings are historic -- ceiling heights and layouts vary greatly; confirm workspace setup with host | 4 | 12 | Studio: ~30-40 sqm. Single open-plan room with sleeping area. May have a desk but sleeping and working space overlap. No separation for two people working simultaneously | 2 | 6 |
| Amenities | 5 | Hotel internet: typically 100-300 Mbps fiber in Lisbon 4-star hotels, verified by business traveler reviews. Dedicated desk. No kitchen. Breakfast included. Fitness center and concierge. Daily housekeeping eliminates chore overhead during an 8-night work stay | 4 | 20 | Rental internet: listed as "fiber optic" but speed unverified by host-provided data. Must ask host for a speed test screenshot. Kitchen is excellent for 8-night cost management. Laundry likely included | 3 | 15 | Rental internet: listing mentions WiFi, no speed specified. Studio layouts often place the router in one corner with dead zones. Must verify. Kitchen or kitchenette likely present. Laundry access needs confirmation | 2 | 10 |
| Reviews | 3 | Chain hotel: 8.4/10 on Booking.com (1,200+ reviews). Consistent mentions of fast internet and quiet rooms. Business traveler reviews specifically note the workspace quality. Negative reviews mention dated décor in some rooms | 5 | 15 | Apartment: 4.72/5 on Airbnb (38 reviews). Recent reviews mention narrow staircase, charming location. Two reviews in the last 6 months mention slow WiFi during peak tourist season -- significant red flag for remote workers | 2 | 6 | Studio: 4.68/5 on Airbnb (22 reviews). 22 reviews is thin but reviews are recent and detailed. Two reviewers specifically mention working from this space successfully. Internet praised in 3 reviews | 4 | 12 |
| Flexibility | 2 | Free cancellation until 48 hours before check-in. Standard hotel policy. Maximum flexibility | 5 | 10 | Airbnb Moderate policy: free cancellation until 14 days before check-in; 50% refund 7-14 days before. For an 8-night stay at €85/night, non-refundable window represents €340 at risk | 3 | 6 | Airbnb Moderate policy: same structure. At €105/night, non-refundable window = €420 at risk. Slightly worse risk than Option B given higher nightly rate | 3 | 6 |
| **TOTAL** | **90** | | | **86/90** | | | **56/90** | | | **59/90** |

---

### True Cost Analysis

| Cost Component | Option A: Hotel (Marquês) | Option B: Apartment (Alfama) | Option C: Studio (Príncipe Real) |
|---------------|--------------------------|------------------------------|----------------------------------|
| Base rate (8 nights) | €1,000 | €680 | €840 |
| Cleaning fee | €0 (included in hotel rate) | €80 (one-time) | €60 (one-time) |
| Platform/service fee | €0 (booked direct or via Booking.com -- no guest fee) | ~€102 (15% Airbnb guest fee on €680) | ~€126 (15% Airbnb guest fee on €840) |
| Resort/facility fee | €0 (not common in Lisbon hotels at this tier) | €0 | €0 |
| Parking | N/A (couple traveling without car) | N/A | N/A |
| Lisbon tourist tax | €16 (€1/person/night x 2 people x 8 nights) | €16 | €16 |
| Breakfast offset | €0 (included in hotel) | -€192 (kitchen saves ~€24/day on breakfast + lunch for 2 people x 8 days) | -€192 (kitchen savings same) |
| **Total True Cost** | **€1,016** | **€686** | **€850** |
| **True Per-Night Rate** | **€127/night** | **€86/night** | **€106/night** |
| **Budget variance vs. €120/night target** | +€7/night (within ceiling) | **-€34/night (excellent value if workspace works)** | -€14/night (within budget) |

> **Key insight:** The hotel's breakfast inclusion and zero platform fees make it significantly more competitive than its headline rate suggests. The apartment closes the gap through kitchen savings -- but only if the internet issue is resolved. If you cannot confirm internet speed, the apartment's €41/night savings over the hotel evaporates in lost work productivity.

---

### Red-Flag Assessment

| Category | Option A: Hotel | Option B: Apartment (Alfama) | Option C: Studio (Príncipe Real) |
|----------|----------------|------------------------------|----------------------------------|
| Pricing transparency | ✅ Clear -- hotel rate includes all fees; tourist tax is the only addition | ⚠️ Caution -- €85/night becomes €86 true cost after fees; headline is misleading by ~30% before kitchen savings | ⚠️ Caution -- €105/night becomes €106 true cost; similar gap |
| Listing accuracy | ✅ Clear -- chain hotel, photos are standardized and accurate to property type | ⚠️ Caution -- only 12 photos for a 1-bedroom apartment. No photo of the desk or workspace. Alfama interiors vary dramatically building to building | ✅ Clear -- 18 photos including desk area, kitchen, and bathroom. Photos appear current and specific |
| Review legitimacy | ✅ Clear -- 1,200+ reviews with recent business traveler feedback confirming workspace quality | 🚫 Red Flag -- two recent reviews (within 6 months) mention slow WiFi during peak season. This is directly relevant to the user's primary requirement | ✅ Clear -- 3 reviews specifically mention working from this space; reviews are detailed and consistent |
| Policy fairness | ✅ Clear -- 48-hour free cancellation standard | ✅ Clear -- Moderate policy is fair for the booking timing | ✅ Clear -- same Moderate policy |
| Host/property communication | ✅ Clear -- hotel booking standard; no host dependency | ⚠️ To verify -- message host immediately about WiFi speed. If host cannot provide a speed test result (Speedtest.net screenshot showing 50+ Mbps download), this option fails the primary requirement | ✅ Positive signal -- listing includes host note that "fiber is 200 Mbps" and reviewer confirmed it |

**Flags requiring action before booking:**
- **Option B only:** Message the host: "Can you share a recent Speedtest.net result for the apartment's WiFi? Two recent reviews mention slow speeds during June. We depend on reliable internet for work." If the host cannot provide a screenshot showing 50+ Mbps download, do not book this option.
- **Option B only:** Ask: "Is there a dedicated desk in the apartment separate from the dining table? We need two people to work simultaneously." Confirm workspace for two people.

---

### Recommendation

**Top choice: Option A -- Chain Hotel (Marquês de Pombal)**

The hotel wins for this specific use case despite being the most expensive headline rate. When internet reliability is a non-negotiable requirement for remote work, verified quality through 1,200 business traveler reviews outweighs the cost savings of Option B's unverified (and recently flagged) WiFi. The hotel's dedicated desk, confirmed fast fiber, daily housekeeping eliminating chore overhead during a work-intensive stay, and zero platform fee risk make it the correct choice. The true cost of €127/night is within the stated €150 ceiling and competitive when breakfast is factored in. Location at Marquês de Pombal is the best transit hub of the three, reducing commute friction to Lisbon's key neighborhoods.

**Runner-up: Option C -- Studio (Príncipe Real)**
This option becomes the top choice if budget pressure increases or if the hotel's last rooms sell above the €150/night ceiling. Príncipe Real's neighborhood quality is excellent for a couple (café-dense, quieter, high-end residential character), the internet is specifically confirmed by reviewers as fast, and the kitchen delivers real savings over 8 nights. The limitation is the studio layout -- two people working simultaneously in a single open-plan space requires coordination. Best if one partner works from a café and one from the apartment, which is extremely practical in Príncipe Real's café-rich environment.

**Avoid: Option B -- 1-Bedroom Apartment (Alfama)**
Do not book until internet speed is confirmed directly by the host with evidence. The two recent reviews flagging slow WiFi during peak June season are a disqualifying issue for remote workers and are not outweighed by the lower price. If the host confirms fast internet with documentation, Option B becomes the runner-up due to its spacious layout and kitchen. Alfama's location -- hilly, metro-poor, tourist-congested -- is a secondary concern. If working from the apartment all day, this matters less; if commuting across Lisbon, it matters a great deal.

---

### Pre-Booking Checklist

**If booking Option A (Hotel):**
- [ ] Book directly on the hotel's own website or call the reservations line -- rates are often equal to OTAs and direct bookings give more flexibility on room assignment
- [ ] At booking, specify: "Double room, upper floors preferred, away from street noise" -- Marquês de Pombal is a busy roundabout; street-facing lower rooms can be loud
- [ ] Confirm the breakfast start time -- if you work early mornings, verify breakfast begins by 7:00am or request room-service breakfast as an alternative
- [ ] Ask if the desk has a monitor-connection option (HDMI port) or at minimum a power strip -- 8 nights of working from a laptop-only setup is ergonomically poor
- [ ] Verify the hotel's WiFi speed in the room type booked -- call and ask: "What is the in-room WiFi speed for business guests?"
- [ ] Mark free cancellation deadline in your calendar (48 hours before check-in)
- [ ] Note: June is Lisbon's peak tourist month. Book as soon as possible -- quality rooms at this price point fill 4-8 weeks in advance

**If booking Option C (Studio, Príncipe Real):**
- [ ] Message the host: "We are remote workers. Can you confirm the fiber WiFi is still 200 Mbps as mentioned in the listing? We'd love a current Speedtest screenshot."
- [ ] Ask: "Is there a dedicated work desk, or is the desk the dining table? We need two people to be able to work at the same time"
- [ ] Ask: "What is the check-in process? Is self-check-in possible for late arrivals?"
- [ ] Confirm all fees before booking: base €840 + cleaning €60 + service fee €126 + tourist tax €16 = €1,042 total -- verify this matches checkout screen exactly
- [ ] Read the 5 most recent reviews on Airbnb, filtering by "Most Recent" not "Most Helpful"
- [ ] Identify two café alternatives within walking distance for days when one partner works remotely from the apartment and one works out -- Príncipe Real is well-served (A Cevicheria neighborhood, Embaixada gardens area) but confirm specifics
- [ ] Save the host's contact number and Airbnb's 24/7 support line offline before travel
- [ ] Mark the free cancellation deadline: 14 days before check-in. Do not let this pass without a final confirmation that everything is in order
