---
name: festival-organizer
description: |
  Complete guide to organizing festivals and multi-day events covering permits and regulations, lineup and programming curation, vendor management, safety and security planning, marketing and promotion, ticketing strategy, volunteer management, and weather contingency planning. Use when the user asks about festival organizer or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "event-planning planning guide"
  category: "travel-experiences"
  subcategory: "event-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Festival Organizer

## When to Use

Use this skill when a user needs structured, actionable guidance for planning and executing a festival or multi-day event. This skill covers the full production lifecycle -- from initial concept through post-event wrap-up.

**Trigger this skill when the user:**
- Is planning a new music, food, arts, cultural, film, or community festival from scratch and needs a comprehensive roadmap
- Has an existing festival and needs help with a specific operational domain (permits, programming, vendor management, safety, or marketing)
- Needs a budget framework, revenue model analysis, or break-even calculation for a proposed event
- Is experiencing a planning crisis -- a permit denial, headliner cancellation, or weather emergency -- and needs rapid triage guidance
- Wants to evaluate whether a festival concept is viable before committing resources
- Needs to build a volunteer corps, staff structure, or vendor onboarding system
- Is scaling an existing festival (doubling attendance, adding a day, adding a stage) and needs to understand what changes at the new scale
- Has been hired as an event director or production manager and needs to assess what their predecessor has or hasn't completed
- Needs to draft RFPs (Requests for Proposal) for production vendors, security firms, or medical services
- Is applying for grants, sponsorships, or city partnerships and needs to articulate the event's structure and impact

**Do NOT use this skill when:**
- The user is planning a private party, wedding, or corporate event with fewer than 150 attendees -- use a general event planning skill instead
- The request is specifically about conference or trade show production, which has distinct exhibitor logistics, registration systems, and A/V requirements
- The user needs help with artist contract law, music licensing (ASCAP/BMI/SESAC), or intellectual property -- defer to a legal domain skill
- The user is asking about touring or road production management for a single artist's tour, which has different logistics than a stationary festival
- The user only needs help with social media content creation or digital advertising campaigns -- route to a marketing skill for that narrow scope
- The user is planning a sports event, marathon, or athletic competition -- the crowd dynamics, medical protocols, and venue requirements differ significantly
- The user's primary question is about financial modeling, investor decks, or startup fundraising for an events company -- route to a business planning skill

---

## Process

### Step 1: Intake and Feasibility Assessment

Before any planning begins, establish the event's core parameters. Missing or incorrect answers here cause cascading problems across every other planning domain.

- **Collect the five critical variables:** Event type (music, food, arts, cultural, film, community), expected attendance range (under 1,000 / 1,000--5,000 / 5,000--20,000 / 20,000+), number of days, total available budget, and time until the event date. These five variables determine almost every subsequent recommendation.
- **Assess timeline viability:** A first-time festival of any meaningful size (1,000+ attendees) requires a minimum of 9--12 months of lead time. A well-resourced team with established vendor relationships can compress this to 6 months for events under 5,000 attendees. Anything shorter risks permit failure, talent unavailability, and underdeveloped marketing. Flag this explicitly if the user's timeline is compressed.
- **Establish the revenue model:** The three primary models are ticket-driven (heavy reliance on advance sales, high financial risk if sales underperform), fee-and-sponsorship-driven (vendor fees and corporate sponsors cover costs, tickets are secondary or free), and grant-subsidized (common for arts and cultural festivals, requires reporting obligations). Most events use a hybrid. Identify the primary revenue driver before building a budget.
- **Identify the organizing entity:** Is the user a solo organizer, a small committee, a nonprofit, or a production company? This determines what insurance structures are available, whether volunteers can be used, what grant opportunities exist, and how decisions get made.
- **Assess the venue situation:** Is a venue secured, scouted, or unknown? Venue status is the single biggest variable in permitting, production, and marketing timelines. If the venue is unknown, all other planning is speculative.
- **Check for prior event history:** A first-time event at a new location has higher permit scrutiny, no brand recognition, and no data to project ticket sales. A returning event has audience data, vendor relationships, and city relationships. Tailor advice accordingly.

---

### Step 2: Permits, Insurance, and Regulatory Compliance

This is the critical path item that most first-time organizers underestimate. Permit denial or delay can kill an event. Start here in parallel with all other planning.

- **Identify your jurisdiction's special events office:** Most cities and counties have a dedicated office or coordinator that serves as a single point of contact for multi-agency permit routing. Schedule this meeting within the first two weeks of planning. They will tell you what permits are required, which agencies need to sign off, and what the realistic timelines are.
- **Build the complete permit matrix for your event type:**
  - Special Event Permit (city or county) -- typically 60--120 days for approval
  - Temporary Food Service Establishment Permit (health department) -- required for each food vendor
  - Alcohol/Liquor License or Temporary Event Permit (state liquor authority) -- often 60--90 days; some states require 120 days for new applicants
  - Amplified Sound/Noise Variance (city ordinance) -- may include decibel limits and curfew hours; get specifics in writing
  - Fire Marshal Permit -- required for any tent over a certain square footage (often 400 sq ft), any temporary structure, open flames, pyrotechnics, or propane use
  - Building Permit -- required for any stage, grandstand, or temporary structure over a certain height or occupancy threshold
  - Street Closure Permit -- if any public roads are used for event footprint, parking, or pedestrian access
  - Parks Use Permit -- if event is on public parkland
  - Generator/Electrical Permit -- for large power installations, often requires licensed electrician sign-off
  - Parking and Traffic Management Plan -- required by many jurisdictions above 2,500 attendees
  - Temporary Sanitation Permit -- for portable restrooms and gray water disposal
- **Insurance minimums by event size:**
  - Under 1,000 attendees: $1M general liability per occurrence, $2M aggregate
  - 1,000--10,000 attendees: $2M per occurrence, $4M aggregate; add liquor liability if serving alcohol
  - 10,000+ attendees: $5M per occurrence, $10M aggregate minimum; carriers may require higher limits
  - Event cancellation insurance: Typically 50--100% of total event budget. Trigger events include weather, key performer cancellation (check if "key person" rider covers headliners), and government shutdown orders.
  - Workers' compensation: Required for any paid staff in most jurisdictions; volunteer status can be ambiguous -- confirm with your insurance broker.
- **ADA compliance is not optional and is federally enforced:** Accessible parking with van-accessible spaces, paved or firm pathways from parking to all event areas, accessible restrooms (1 accessible unit per 20 portable units as a baseline), accessible viewing areas at each stage with sightlines above standing crowds, and companion seating.
- **Sound curfew and decibel limits are legally binding:** Get the exact decibel limit (commonly 85--95 dB at the property line) and curfew time (commonly 10 PM--11 PM) in writing before booking talent. Factor these into your stage design and schedule. A noise complaint after 10 PM can result in an immediate police shutdown.
- **Critical timing rule:** All permits should be in hand at least 30 days before the event. If a permit is pending at 30 days, escalate immediately.

---

### Step 3: Venue Assessment and Site Design

The venue defines the production, safety, and experience parameters for everything else.

- **Venue capacity calculation:** The industry standard for outdoor festival crowds is 1.0--1.5 square feet per person in densely packed areas (like a stage pit), 2.5--4 square feet per person for general festival grounds, and 6--10 square feet per person for comfortable open-air conditions. Work backward from your target attendance to determine the minimum usable square footage needed.
- **Power infrastructure assessment:** Map all existing electrical service points. Calculate your production power draw: a medium-sized stage with professional sound and lighting typically requires 200--400 amps at 208/240V three-phase. Large festival stages can require 800--1,200 amps. Generator sizing: add 25% headroom above calculated peak draw. Fuel consumption for a 400kW diesel generator runs approximately 25--30 gallons per hour.
- **Water and sanitation ratios:**
  - Portable restrooms: 1 unit per 50--75 attendees for a 4-hour event; for full-day events, increase to 1 per 35--50 attendees
  - Hand-washing stations: 1 station per 4--6 portable restrooms
  - Potable water: Minimum 32 oz per person per hour in hot weather, 16 oz per person per hour in mild weather; budget free water stations accordingly
  - Gray water disposal: Must be arranged with a licensed waste hauler; do not allow vendors to drain into storm drains
- **Site flow design -- the five core zones:**
  1. **Entry/Ticketing Zone:** Entry should handle peak ingress (often 30--40% of total attendance in the first 90 minutes). Calculate lane throughput: RFID wristband scanners process 600--900 people per lane per hour; barcode scanners process 300--500 per lane per hour; cash box office handles 150--250 per lane per hour.
  2. **Stage Zones:** Allow 100--150 feet of festival ground per 1,000 attendees in front of the stage. Stage barriers (bike racks or crowd barriers) should be placed at minimum 8--10 feet from the stage front to create a safety buffer zone with security access.
  3. **Food and Vendor Village:** Distribute vendors throughout the site rather than concentrating them. Vendor concentration creates crowd density pinch points that become dangerous during peak meal times.
  4. **Amenities Zone:** Restrooms, water, first aid, lost and found, phone charging. These should be visible from anywhere on site and marked with large overhead signage.
  5. **Back-of-House:** Artist compound, production offices, generator yard, fuel storage, volunteer check-in, vendor staging. Completely separated from public areas with secure fencing.
- **Emergency vehicle access lanes:** Required by fire code. Minimum 20-foot clear lanes must remain unobstructed throughout the event. Map these on your site plan and mark them physically on site with no-park signage and physical barriers.

---

### Step 4: Lineup and Programming Curation

Programming is the primary driver of ticket sales and audience loyalty. Build it around the revenue model and audience identity -- not around what acts are available.

- **Define your programming identity first:** What is the unique curatorial angle of this festival? "We book indie artists before they break nationally," "We celebrate regional foodways and artisan producers," "We present contemporary jazz with classical crossover." A clear identity makes booking decisions easier and marketing more compelling.
- **Talent budget allocation for music festivals:**
  - Headliners (1--3 acts): 35--50% of total talent budget; book 8--12 months out for emerging-national headliners, 12--18 months for established headliners
  - Mid-tier supporting acts (4--12 acts): 25--35% of talent budget; book 4--8 months out
  - Emerging and local acts (10--30 acts): 10--20% of talent budget; book 2--4 months out; these artists are often the most engaged with local audiences and press
  - Hospitality riders (accommodation, catering, transportation, backline): Budget 10--15% of talent fees as a hospitality multiplier; headliner riders can be substantial -- request riders before confirming to avoid surprises
- **Booking process for unrepresented artists:** Direct email or social contact; turnaround is fast (days to weeks). For represented artists: contact the booking agent at the talent agency, submit an offer including guarantee, support provided (sound, backline, accommodation, meals, and ground transport), set length, set time, and stage. Agents respond faster to written offers with all details included.
- **Schedule engineering -- build energy deliberately:**
  - Don't schedule your strongest mid-tier acts against each other on different stages simultaneously
  - Build to the headliner: attendance peaks at 70--80% capacity for mid-tier acts and 95--100% for headliners; plan food and restroom breaks during changeovers
  - For multi-day events, distribute talent quality across days rather than front-loading the best acts on day one; day two tickets are harder to sell and need programming incentive
  - Changeover times: 30--45 minutes for small stages with simple setups; 60--90 minutes for large stages with full production changes; factor this into your schedule realistically
- **Non-music programming increases dwell time and per-capita spending:** Workshops, interactive installations, artisan demonstrations, VIP experiences, kids' zones, and panel discussions keep attendees on site longer. Every additional 30 minutes of dwell time is estimated to increase per-capita food and beverage spending by 15--25%.
- **Backup programming for weather delays:** Have 1--2 acoustic or low-production acts available to perform in a covered area if main stage operations are halted by weather. This manages crowd behavior during a delay and preserves goodwill.

---

### Step 5: Vendor Onboarding and Operations

Vendors are both a revenue source and a service provider. Poorly managed vendors damage the attendee experience and create liability exposure.

- **Vendor fee structures -- choose based on your leverage and event size:**
  - Flat fee: Predictable revenue for organizer; $150--$500 for artisan/merchandise vendors, $500--$3,000 for food vendors depending on event size and expected traffic. Best for smaller events or when vendor volume is uncertain.
  - Revenue commission: 10--20% of gross sales; requires POS system integration or manual sales reporting (honor system). Works well at large, high-traffic events where sales are easy to verify.
  - Hybrid: Flat fee + commission above a threshold. Example: $500 flat + 12% of sales over $3,000. Protects the organizer if a vendor undersells while rewarding high performers.
- **Vendor application and curation process:**
  - Open applications 6--9 months before the event
  - Require: business license, health department permit (for food), certificate of insurance naming the festival and venue as additional insureds, menu or product list with pricing, equipment list including power requirements and vehicle dimensions
  - For food vendors, maintain cuisine diversity: no more than 2--3 vendors per cuisine category. Balance price points ($5--$10 entry-level options through $15--$25 premium items).
  - For artisan vendors, use a juried selection process with images of work to maintain quality and brand consistency
- **Vendor infrastructure requirements that organizers must provide:**
  - Electrical service: Specify amperage, voltage, and connector type available per space; most food trucks require 30--50 amps at 120/240V; commercial kitchen setups may require 60--100 amps
  - Space dimensions: Clearly define booth footprint including any overhang for awnings or serving windows
  - Setup and breakdown windows: Define these precisely. Staggered setup by vendor category (large vehicles first) prevents gridlock.
  - Vehicle access and parking: Where do vendor vehicles park after setup? This is frequently an afterthought that causes day-of chaos.
- **Vendor day-of management:**
  - Assign a dedicated vendor coordinator (not the event director -- this is a full-time day-of role)
  - Conduct a pre-event vendor meeting 60--90 minutes before gates open: confirm power connections, review emergency procedures, communicate the day's schedule
  - Create a vendor communication channel (WhatsApp group or radio channel) for real-time updates
  - Perform a mid-day check-in with each vendor to flag any issues before they escalate

---

### Step 6: Safety, Medical, and Security Planning

Safety planning is where most first-time organizers are dangerously underprepared. Inadequate safety planning creates legal liability and genuine risk to human life.

- **Medical staffing standards by attendance:**
  - Under 1,000: Minimum 2 EMTs with first aid station and AED; ambulance on call with confirmed ETA under 10 minutes
  - 1,000--5,000: Minimum 4--6 EMTs, 1 nurse or paramedic, on-site ambulance
  - 5,000--10,000: Full medical team with physician or PA on site, 2 ambulances, field medical units distributed throughout site, medical tent with cots and defibrillators
  - 10,000+: Contract with a specialized event medical company; they perform their own risk assessment and staff accordingly; budget $8--$20 per attendee for comprehensive coverage
  - The most common medical calls at festivals: dehydration/heat exhaustion, cuts and lacerations, substance intoxication, minor orthopedic injuries (twisted ankles from uneven terrain), and noise-induced ear complaints
- **Security staffing ratios:**
  - General population events (food, arts, family): 1 security officer per 150--200 attendees
  - Music festivals with alcohol service: 1 per 100--150 attendees
  - High-energy events (EDM, hip-hop, hard rock with mosh pit culture): 1 per 50--75 attendees
  - Mix of uniformed security, plain-clothes security (crowd observation), and perimeter patrol. Off-duty law enforcement as a supplement (not replacement) for civilian security.
  - All security staff must have a clear chain of command to the event security director, who reports directly to the event director
- **Crowd density and crush prevention:** Crowd crush becomes a risk when density exceeds 4 people per square meter in any area. Design your stage barriers, entry funnels, and pathways to prevent density concentration. Post crowd monitors at pinch points. At 3 people per square meter, implement flow control (slow or stop entry to dense areas). At 4 per square meter, initiate dispersal protocols immediately.
- **Emergency Action Plan (EAP) -- must be written, not just discussed:**
  - Evacuation routes from every area of the festival grounds mapped and posted
  - PA system coverage tested to confirm audibility in all areas
  - Chain of command for emergency decisions: who has authority to call a weather hold, cancel a performance, or initiate full evacuation?
  - Medical emergency protocol: radio call to medical base → dispatch to patient → triage → transport decision → hospital notification
  - Designated emergency assembly points outside the festival perimeter
  - Media spokesperson designated: one person only speaks to press during an emergency
  - Conduct a full EAP walkthrough with all department heads and security personnel 24--48 hours before the event

---

### Step 7: Marketing, Ticketing, and Revenue Execution

Marketing determines whether your programming reaches its intended audience. Ticketing strategy determines whether you capture the maximum revenue that demand supports.

- **Marketing timeline and channel strategy:**
  - 9--12 months out: Secure your date, lock venue, begin building email list through a "coming soon" landing page; announce on social media with a date reveal
  - 6--9 months out: First headliner announcement (your strongest card); early bird tickets go on sale simultaneously; goal is to capture the most enthusiastic fans at a discount before the full picture is known; early bird should be 20--30% below general admission price
  - 4--6 months out: Full lineup announcement; press release to local and regional media; influencer outreach with comp tickets in exchange for coverage; sponsor announcements
  - 2--4 months out: Paid advertising begins (geo-targeted social ads, Spotify playlist advertising for music festivals, streaming ads, event listing sites); street team with posters; community calendar submissions; partnership promotions with aligned local businesses
  - 4--6 weeks out: Urgency messaging ("Less than 500 tickets remain"); schedule release; app launch if applicable; media credential applications open; email blast to all ticket holders with logistics information
  - Event week: Daily social content; live streaming teasers; media check-in; day-of content plan assigned to dedicated social staff
  - Post-event: 48-hour recap content; thank-you emails; attendee survey; save-the-date for next year; sponsor impact report
- **Ticketing tier structure:**
  - Early Bird: 20--30% below GA price, limited quantity (10--20% of capacity), sells out quickly creating FOMO
  - General Admission: Standard price; where the bulk of revenue comes from
  - VIP: 2--4x GA price; must have genuinely differentiated experience -- dedicated entry lane, elevated viewing platform with barriers, upgraded restrooms, dedicated bar, covered lounge seating, commemorative wristband. If VIP doesn't feel meaningfully better, the tier erodes trust.
  - Super VIP / Platinum: 5--10x GA price, very limited quantity, may include meet-and-greet access, artist hospitality area access, catered food, private host
  - Single-day vs. multi-day passes: For multi-day events, price the multi-day pass at 70--80% of the combined single-day cost to incentivize the higher-value purchase
  - Group discounts: 10+ tickets at 15--20% discount; requires a minimum group contact for logistics
- **Ticket platform selection:**
  - Eventbrite: 3.7% + $1.79 per ticket for organizer-absorbed fees; best for events with broad general audiences due to discovery features
  - Dice: 8--12% absorbed into ticket price; strong for music events; has built-in resale controls
  - TicketTailor: Flat fee of approximately $0.26--$0.65 per ticket; no percentage; best for cost-conscious organizers with their own marketing channels
  - Custom-built or white-label: Only appropriate for large recurring events where the annual volume justifies development and maintenance cost
  - RFID wristbands: Add $2--$5 per attendee cost but increase entry throughput by 40--60% and enable cashless payment integration; required for events over 10,000 where entry speed is critical

---

### Step 8: Weather Contingency and Post-Event Operations

Weather planning and post-event wrap-up are consistently neglected until they cause a crisis.

- **Weather monitoring protocol:**
  - Begin monitoring 10 days out using multiple sources: National Weather Service hourly forecast, Weather Underground, and a specialized event weather service (DTN or Weather Decision Technologies for large events)
  - Appoint a weather monitor -- one person responsible for tracking conditions and communicating status to the event director throughout the event day
  - Define specific trigger thresholds in advance so decisions are not made in real time under pressure:
    - Lightning within 10 miles: Issue internal weather alert; brief security and medical; position crowd managers near entry points
    - Lightning within 5 miles: Halt all outdoor performances; direct attendees to designated shelter structures; do not resume until 30 minutes after last lightning strike within 5 miles
    - Sustained winds over 35 mph: Inspect all tent structures; consult with tent provider's engineer on wind rating; consider lowering or removing tents
    - Sustained winds over 50 mph: Evacuate tents; all personnel move to permanent structures or vehicles
    - Temperature over 95°F with heat index: Activate heat mitigation protocol (additional water, misting, shade); increase medical monitoring frequency; consider shortening outdoor programming windows
  - Lightning is the #1 weather cause of festival fatalities. There is no acceptable reason to keep attendees in an open field when lightning is within 5 miles.
- **Communication protocols for weather events:**
  - PA announcement script templates prepared in advance for each weather scenario (delay, shelter-in-place, full evacuation)
  - Social media and text notification plan: if you have a festival app or SMS list, mass notification must happen within 2 minutes of the decision
  - Radio tree: event director → department heads (security, medical, production, volunteer coordinator) → their teams
- **Post-event operations -- the 72-hour window:**
  - Day of (after close): Strike begins on schedule; site must be cleared to baseline condition within the timeframe required by the venue permit; document any damage before your team leaves
  - 24--48 hours post: Send attendee survey (online, 5--10 questions); send thank-you emails to volunteers, vendors, sponsors, and performers; publish recap content
  - 48--72 hours post: Complete financial reconciliation; collect and total all vendor commission reports; calculate final ticket revenue vs. projections; compile preliminary event report
  - 1--2 weeks post: Full debrief meeting with organizing team; department-by-department lessons learned; document everything in writing for next year
  - Sponsor reporting: Most sponsors require a post-event impact report within 30 days -- logo impressions, media coverage value, attendee demographics, social reach
  - Retain all permits, insurance certificates, and vendor contracts for minimum 3 years

---

## Output Format

When responding to a festival planning request, deliver structured output using the following template. Adjust depth and sections based on what the user has asked for -- if they need a full plan, use all sections; if they need help with one domain (e.g., vendor management), focus there.

---

```
FESTIVAL PLANNING DOCUMENT
==========================
Event Name: [Name or working title]
Event Type: [Music / Food / Arts / Cultural / Film / Community / Hybrid]
Date(s): [Date range or target window]
Location: [Venue or city]
Expected Attendance: [Per-day and total]
Event Days: [Number]
Total Budget: [$X] | Revenue Model: [Ticket-driven / Fee-driven / Sponsorship / Hybrid]
Lead Organizer / Organization: [Name or entity]
Days Until Event: [X days / months]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: FEASIBILITY ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Timeline Status:      [ ] Healthy (9+ months) [ ] Compressed (4-8 months) [ ] Critical (<4 months)
Budget Status:        [ ] Adequate [ ] Tight [ ] Underfunded -- identify gaps
Venue Status:         [ ] Confirmed [ ] In Negotiation [ ] Not Secured
Critical Path Item:   [The single most urgent thing to address]
Viability Assessment: [Go / Conditional Go / Do Not Proceed -- with reasoning]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2: PERMIT AND COMPLIANCE MATRIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
| Permit / Requirement       | Issuing Agency         | Lead Time | Status      | Deadline   |
|----------------------------|------------------------|-----------|-------------|------------|
| Special Event Permit       | City/County Events     | 90 days   | Not Started | [Date]     |
| Liquor / Alcohol Permit    | State Liquor Authority | 90 days   | Not Started | [Date]     |
| Temporary Food Service     | Health Department      | 30-60 days| Not Started | [Date]     |
| Fire Marshal Permit        | Fire Marshal's Office  | 60 days   | Not Started | [Date]     |
| Noise Variance             | City Ordinance Office  | 30-60 days| Not Started | [Date]     |
| [Additional permits...]    |                        |           |             |            |

Insurance Required:
- General Liability: $[X]M per occurrence / $[X]M aggregate
- Liquor Liability: [Yes/No -- required if serving alcohol]
- Event Cancellation: [Yes/No -- strongly recommended, $X coverage]
- Workers' Compensation: [Yes/No -- required if any paid staff]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3: BUDGET FRAMEWORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REVENUE PROJECTIONS
| Source             | Low Case  | Base Case | High Case |
|--------------------|-----------|-----------|-----------|
| Ticket Sales       | $         | $         | $         |
| Vendor Fees        | $         | $         | $         |
| Sponsorships       | $         | $         | $         |
| Bar / Beverage     | $         | $         | $         |
| Merchandise        | $         | $         | $         |
| Grants             | $         | $         | $         |
| TOTAL REVENUE      | $         | $         | $         |

EXPENSE PROJECTIONS
| Category                      | % of Budget | Estimated Cost |
|-------------------------------|-------------|----------------|
| Talent (performers + riders)  | 25-35%      | $              |
| Production (stage/sound/light)| 15-20%      | $              |
| Venue / Site Rental           | 8-12%       | $              |
| Marketing / PR / Advertising  | 10-15%      | $              |
| Security / Medical / Safety   | 5-10%       | $              |
| Permits / Insurance / Legal   | 3-6%        | $              |
| Sanitation / Waste / Fencing  | 3-5%        | $              |
| Staffing / Admin              | 5-8%        | $              |
| Contingency Reserve           | 10-15%      | $              |
| TOTAL EXPENSES                | 100%        | $              |

Break-Even Calculation:
  Total Expenses: $[X]
  Average Ticket Price: $[X]
  Break-Even Tickets: [X] ([X]% of capacity)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4: PROGRAMMING PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Programming Identity: [One sentence curatorial statement]

Talent Tiers:
| Tier              | # of Acts | Budget Allocation | Booking Deadline |
|-------------------|-----------|-------------------|-----------------|
| Headliner         |           | %                 |                 |
| Mid-Tier          |           | %                 |                 |
| Emerging / Local  |           | %                 |                 |

Stage Schedule Template (per day):
| Time      | Main Stage        | Stage 2           | Activity Area     |
|-----------|-------------------|-------------------|-------------------|
| [Time]    | [Act / Activity]  | [Act / Activity]  | [Workshop/Demo]   |
| [Time]    | Changeover        | [Act]             | [Activity]        |
| [Time]    | HEADLINER         | After-show        | Closed            |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5: VENDOR PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Vendor Mix Target:
| Category         | # of Vendors | Fee Structure  | Cuisine/Category Diversity   |
|------------------|--------------|----------------|------------------------------|
| Food Vendors     |              |                |                              |
| Beverage / Bar   |              |                |                              |
| Artisan / Craft  |              |                |                              |
| Sponsors / Exhibitors |         |                |                              |

Vendor Operational Requirements: [Power, space, water, vehicle access specifics]
Vendor Coordinator: [Assigned name or role TBD]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6: SAFETY AND MEDICAL PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Medical Staffing: [# EMTs, paramedics, nurses, physicians; ambulance status]
Security Staffing: [Total officers, ratio, mix of uniformed/plain-clothes/law enforcement]
First Aid Station Locations: [Site areas]
Emergency Vehicle Access Lanes: [Confirmed on site plan: Yes/No]
AED Locations: [Number and placement]
Weather Trigger Thresholds:
  - Lightning 10 miles: [Action]
  - Lightning 5 miles: [Action]
  - Winds 35 mph: [Action]
  - Winds 50 mph: [Action]
Emergency Action Plan: [Written: Yes/No | Walkthrough Scheduled: Date]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7: MARKETING AND TICKET SALES PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ticketing Platform: [Platform name and fee structure]
Ticket Tiers:
| Tier          | Price  | Quantity Available | Revenue Potential |
|---------------|--------|-------------------|-------------------|
| Early Bird    | $      | [X] ([X]% cap)    | $                 |
| General Admission| $   | [X]               | $                 |
| VIP           | $      | [X]               | $                 |
| Single Day    | $      | [X]               | $                 |

Marketing Channel Plan:
| Phase         | Channels                    | Budget | Key Actions              |
|---------------|-----------------------------|--------|--------------------------|
| 9-12 months   | Email, social, PR           | $      | Date reveal, email list  |
| 6-9 months    | Social, PR, early bird      | $      | Headliner announcement   |
| 4-6 months    | Paid ads, influencers       | $      | Full lineup drop         |
| 2-4 months    | Ads, street team, listings  | $      | Urgency campaigns        |
| <4 weeks      | All channels, logistics     | $      | Final push               |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8: VOLUNTEER AND STAFFING PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Paid Staff Roles: [List key paid positions]
Volunteer Target: [# needed + 25-30% buffer = total to recruit]
Volunteer Roles and Shift Structure:
| Role                | # Needed | Shift Length | Incentive            |
|---------------------|----------|--------------|----------------------|
| Gate / Registration |          | 4-6 hrs      | Free admission, shirt|
| Wayfinding          |          | 4-6 hrs      | Free admission, shirt|
| Stage Crew          |          | 6-8 hrs      | Free admission, meals|
| Vendor Liaison      |          | 6-8 hrs      | Free admission, meals|
| [Other roles]       |          |              |                      |

Volunteer Recruitment Sources: [Community organizations, colleges, service clubs]
Pre-Event Training: [Date, duration, content]
Communication Channel: [WhatsApp group / Radio channel assignment]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 9: WEATHER CONTINGENCY PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Weather Watcher: [Assigned name]
Monitoring Services: [National Weather Service + X]
Shelter Locations on Site: [Named structures or vehicles]
PA Announcement Scripts: [Prepared: Yes/No]
Performance Hold Protocol: [Defined thresholds -- see Section 6]
Cancellation Policy: [Published on ticket platform: Yes/No]
Event Cancellation Insurance: [Coverage amount / carrier]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 10: CRITICAL PATH AND 90-DAY ACTION ITEMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
| Priority | Action Item                              | Owner    | Deadline   | Status   |
|----------|------------------------------------------|----------|------------|----------|
| CRITICAL | [Most urgent item]                       |          |            | Open     |
| HIGH     |                                          |          |            | Open     |
| HIGH     |                                          |          |            | Open     |
| MEDIUM   |                                          |          |            | Open     |
| MEDIUM   |                                          |          |            | Open     |
| MEDIUM   |                                          |          |            | Open     |
```

---

## Rules

1. **Never recommend a timeline shorter than 6 months for an event over 1,000 attendees without explicitly flagging the specific risks that compressed timeline creates.** Permit applications alone often require 60--120 days. A 4-month timeline for a 2,000-person festival is not aggressive -- it is reckless, and the user needs to understand that.

2. **Never skip the permit matrix, even if the user only asks about one planning domain.** Permit issues surface in every domain: sound permits affect programming decisions, liquor permits affect revenue models, fire marshal requirements affect stage and tent design. Always include permit status as a foundational check.

3. **Never accept a budget figure without calculating break-even and testing it against realistic ticket sales projections.** A $150,000 budget that requires selling 85% of capacity to break even is fundamentally different from one that breaks even at 55% of capacity. Surface this math explicitly.

4. **Do not recommend specific insurance dollar amounts without asking about the jurisdiction and venue requirements.** Venue contracts and city permits often mandate specific minimums. The recommendations in this skill are baselines -- the user must confirm with their venue, city, and insurance broker.

5. **Always distinguish between what organizers must provide and what vendors provide themselves.** Food vendors provide their own health permits; organizers provide the temporary event permit that covers the overall site. This boundary is frequently confused and creates liability gaps.

6. **Never understate the lightning risk in a weather discussion.** Lightning within 5 miles requires stopping outdoor performances. This is not optional, not a judgment call, and not subject to commercial pressure from ticket holders or artist agents. State this clearly and unambiguously.

7. **Do not recommend volunteer-only security for any event over 500 attendees.** Volunteer safety teams are appropriate for low-risk crowd management (wayfinding, wristband checking). Crowd control, conflict de-escalation, and ejections require trained professional security personnel with legal authority in your jurisdiction.

8. **Always flag ADA compliance as a legal requirement, not a best practice.** The Americans with Disabilities Act applies to public events. Non-compliance is not a budget optimization decision -- it is a federal civil rights violation that creates legal exposure.

9. **When a user's budget is insufficient for their event scope, say so directly with specific numbers.** A user planning a 3,000-person music festival with a $30,000 budget is underfunded by a factor of 3--5x. Present the realistic cost range and offer to help them right-size the event rather than building a plan that will fail financially.

10. **Require a written Emergency Action Plan as a non-negotiable deliverable, not a verbal discussion.** An EAP that exists only in the event director's head is not an EAP. It must be documented, distributed to all department heads, and walked through in a pre-event rehearsal. This is where inadequate preparation causes the most serious real-world harm.

---

## Edge Cases

### 1. Permit Denial After Planning Has Advanced

If a user has already invested significantly in planning and faces a permit denial, triage immediately. Identify the specific denial reason: most denials fall into one of four categories -- missing documentation, non-compliance with a specific requirement, neighbor objection triggering a review process, or site unsuitability. Documentation and non-compliance issues are correctable; work with the user to address the specific deficiency and reapply. Neighbor objections often require a formal public comment process -- advise the user to attend any hearing with a prepared presentation on economic impact, noise management measures, and prior event history. Site unsuitability is the hardest denial to reverse; explore whether an alternate venue can be substituted at this stage and what ticket refund obligations that triggers. Never recommend moving forward without a permit by reducing the "official" event size while actually hosting a larger event -- this is illegal and creates criminal liability.

### 2. Headliner Cancellation Within 30 Days of the Event

A headliner cancellation 30 days or fewer before the event is a crisis requiring immediate structured response. First, check whether event cancellation insurance includes key performer cancellation coverage and what documentation the carrier requires. Second, contact the booking agent immediately to understand whether the artist's reason is medical (covered by most contracts), a contract dispute (may have legal remedies), or a force majeure event. Third, assess ticket sale patterns: if 70% of tickets sold after the headliner announcement, refunds may be the only credible response. If early bird and GA sales preceded the headliner announcement, partial refund or ticket downgrade credit may be viable. Fourth, begin contacting replacement acts immediately through all agent relationships. Fifth, communicate with ticket holders within 24 hours -- transparency about the situation and clear communication of options (refund, transfer, upgraded offering) prevents a social media crisis from compounding the problem.

### 3. First-Time Organizer with No Industry Relationships

A first-time organizer has no booking agent relationships, no vendor networks, no permit history with the city, and no brand recognition for marketing. Specific adaptations: for booking, start with local and regional acts whose agents and managers are reachable; use talent buyer consultants for first-time headliner negotiations (they charge 10--20% of talent budget but have the relationships); for vendors, partner with local food truck associations and artisan market organizers who can refer vetted vendors; for permits, engage a local event production consultant or entertainment lawyer who has worked with your city's events office before; for marketing, build partnerships with local media outlets, businesses, and community organizations who have existing audiences and are willing to co-promote in exchange for presence at the event. Expect the first year to have a 20--30% higher cost structure and lower revenue than a comparable event from an established organizer -- build this into the financial model.

### 4. Multi-Day Camping Festival

Camping adds an entirely separate operational layer. Required additions not covered in the standard framework: camping registration and site allocation system (numbered sites vs. open camping with capacity limits); 24-hour medical coverage across all days (not just event hours); overnight security staffing (typically reduced ratio but still required); shower and additional sanitation facilities beyond what daytime-only events require (camping festivals need 1 shower per 75--100 campers as a minimum); fire safety protocol for campsite fires (if allowed) or a no-open-fire policy; quiet hours enforcement; campsite check-in and vehicle management (when do cars leave the camping area?); waste management amplified (camping generates 3--5x the waste per person compared to a day festival); and emergency medical access to camping areas at night. Budget camping events at 30--40% higher cost per attendee than equivalent day-only events.

### 5. Event Budget in Severe Shortfall Against Plan

If the user's budget cannot support the event they've described, do not build a plan around an impossible budget. Present the gap explicitly with numbers. Offer three corrective paths: (1) Reduce scope -- shrink attendance capacity, reduce programming days, or simplify production to fit the budget; (2) Increase revenue -- identify specific, realistic revenue sources not yet tapped (corporate sponsors, vendor fee increases, VIP tier addition, local business partnerships, grant applications); (3) Defer the event -- push the date out to allow more fundraising and pre-sales. A festival that launches underfunded and fails financially causes lasting damage to the organizer's relationships with vendors, venues, artists, and the local community. It is better to delay than to fail publicly.

### 6. Urban Festival in a Dense Residential Area

Events in dense urban environments face amplified noise, parking, and neighbor relations challenges that rural or fairground events do not. Specific considerations: engage neighbors proactively before applying for permits -- a neighbor opposition campaign can derail an approval process; negotiate sound curfews with the city events office based on the specific block's residential density; hire a sound engineer experienced in outdoor reinforcement with cardioid subwoofer arrays, which can reduce rear and side bleed by 10--15 dB; establish a noise complaint hotline answered by a real person throughout the event (this is a standard condition in many city permits); coordinate with public transit authority for enhanced service during the event to reduce parking demand; address parking explicitly in your site plan with shuttle options from remote lots; and budget for 24-hour cleaning crews to address the immediate post-event street cleaning that dense neighborhoods expect.

### 7. Severe Weather Occurs During the Event

When weather conditions deteriorate during the event, decision-making authority must be pre-assigned and exercised clearly. The event director has final authority to halt or cancel performances -- this authority cannot be delegated in the moment to security, production, or artist management. When the weather trigger threshold is reached: (1) Event director makes the call; (2) Production director mutes the PA and prepares an announcement; (3) Security moves to crowd management positions; (4) Medical activates standby protocol; (5) PA announcement is made with shelter locations and expected duration. Do not attempt to continue performing until lightning is fully clear. Resumption requires a formal all-clear from the weather watcher after 30 minutes with no lightning within 5 miles. If conditions require cancellation of the remaining program, communicate this decision through PA and social media simultaneously, with clear information about what ticket holders' options are.

### 8. Volunteer No-Show Crisis on Event Day

A 20--30% volunteer no-show rate is normal and expected -- this is why recruitment targets are set 25--30% above minimum need. If no-shows exceed 40%, escalate to a staffing crisis protocol: contact your volunteer coordinator's call list of confirmed-but-not-scheduled alternates; contact local event staffing agencies for emergency day-of labor (expect to pay $18--$30 per hour at short notice); redistribute remaining volunteers to highest-priority roles (gate, first aid support, safety) and eliminate coverage at lower-priority roles (social media, merchandise); contact organizing committee members who are not assigned to department director roles to fill tactical gaps. The absolute priority roles that must be covered even in a severe shortfall: all entry/ticketing gates (revenue protection and capacity control), first aid station support, and stage security barrier positions. Everything else can be reduced.

---

## Example

**User Input:** "I'm planning a two-day outdoor music and food festival in a mid-size city. Expected attendance is 3,000 per day (6,000 total over the weekend). It's our first year. We have $180,000 total budget. The event is 8 months away. We've identified a city park as the venue but haven't submitted a parks permit application yet. We want local and regional bands, 2 stages, food vendors, craft beer, and a VIP section. We have a 5-person volunteer organizing committee and no paid staff yet."

---

**Output:**

```
FESTIVAL PLANNING DOCUMENT
==========================
Event Name: [Working Title -- TBD]
Event Type: Music / Food Hybrid
Date(s): [Target weekend -- 8 months out]
Location: City park -- permit pending
Expected Attendance: 3,000/day | 6,000 weekend total
Event Days: 2
Total Budget: $180,000
Revenue Model: Hybrid (ticket-driven + vendor fees + sponsorship)
Lead Organizer: 5-person volunteer committee
Days Until Event: ~240 days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: FEASIBILITY ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Timeline Status: HEALTHY -- 8 months is workable for a 3,000-person
  first-year event, but only if permit applications begin this week.
  The parks permit is your #1 action item. Without venue confirmation,
  no other planning is reliable.

Budget Status: TIGHT -- $180,000 for 6,000 total attendees is $30/attendee,
  which is below the $40-60/attendee that a quality two-day festival typically
  requires. The plan below works within this budget but requires:
  - Strong volunteer commitment (minimizing paid labor)
  - Sponsorship success of at least $20,000
  - Ticket revenue of at least $90,000
  Missing either of those targets means deficit. See break-even below.

Venue Status: NOT CONFIRMED -- This is critical path. Everything else is
  speculative until the parks permit is approved.

Critical Path Item: Submit parks permit application and request a meeting
  with the city's special events office within 5 business days. Your 8-month
  timeline is healthy, but a city park venue for 3,000 people will require
  coordination with multiple departments. Delay here collapses everything else.

Viability Assessment: CONDITIONAL GO
  -- Viable if parks permit is obtained and sponsorship target is met.
  -- Recommend a firm go/no-go decision at 6 months (2 months from now)
     based on permit status, early bird ticket sales,
