---
name: airport-navigation-guide
description: |
  Creates a terminal-to-gate workflow with check-in timelines, security
  preparation steps, connection procedures, and gate-area logistics.
  Gathers flight details, airport, traveler experience level, and special
  needs to produce a timed step-by-step airport navigation plan from
  arrival at the airport to boarding the plane.
  Use when the user asks about airport navigation, check-in procedures,
  how early to arrive at the airport, connecting flight logistics, or
  getting through security efficiently.
  Do NOT use for flight booking strategies (use travel logistics skills),
  travel itinerary building (use trip-itinerary-builder), or airport
  lounge access evaluation.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel checklist step-by-step guide"
  category: "travel-experiences"
  subcategory: "travel-logistics"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Airport Navigation Guide

## When to Use

**Use this skill when:**
- A user asks how to navigate an unfamiliar airport, find their gate, or understand the departure sequence from arriving at the terminal to boarding the plane
- A user wants to know how early to arrive at the airport for a domestic, international, or connecting flight -- including specific timing for their situation
- A user needs a step-by-step security screening preparation checklist, including what to remove, what is allowed in carry-on, and how expedited programs change the process
- A user has a connecting flight and wants to know if their layover is long enough, how to get between terminals, and what to do if they miss the connection
- A user is a first-time flyer, a nervous traveler, or someone unfamiliar with airport procedures who needs each step explained without assuming prior knowledge
- A user is traveling with children, requires mobility assistance, or has special luggage (oversized, fragile, sporting equipment) and needs adapted guidance
- A user is flying internationally for the first time and needs to understand passport control, customs, and documentation requirements at the departure airport or a connecting hub
- A user has a very tight connection and needs an optimized, time-critical transfer plan with contingency steps
- A user asks about re-clearing security at a layover airport, inter-terminal shuttles, or airside vs. landside transfers

**Do NOT use when:**
- The user wants to book or compare flights, find low fares, or evaluate routing options -- use a travel booking or flight-search skill
- The user wants a full multi-day trip itinerary with accommodation, activities, and logistics -- use `trip-itinerary-builder`
- The user wants to evaluate airport lounge access, Priority Pass benefits, or premium check-in perks -- use a travel benefits or lounge-access skill
- The user is asking about arriving at their destination and clearing immigration and customs there -- this skill covers departure and transit only; note the distinction and redirect
- The user wants ground transportation or transfer options from the airport to their hotel -- include a one-line note at most; do not build it out
- The user wants visa requirements or entry eligibility for a foreign country -- that is a separate regulatory domain
- The user wants advice on flight-delay compensation, EU261 claims, or airline passenger rights -- that is a consumer rights domain

---

## Process

### Step 1: Gather all required flight and traveler details before building the plan

Ask for every piece of information listed below before generating the plan. Do not estimate or assume -- wrong inputs produce wrong timing.

- **Departure airport:** Full name or IATA code (e.g., JFK, LHR, SYD). This affects terminal complexity, known security wait times, and inter-terminal logistics.
- **Departure time:** The scheduled time shown on the boarding pass or itinerary, not the gate-close time.
- **Flight type:** Domestic (same country), international (crossing a border), or transborder (e.g., US to Canada, which involves customs at departure).
- **Airline and flight number:** Determines which terminal and check-in area to target. Many large airports have airline-specific terminals (e.g., at LAX, TBIT is the international terminal; at Heathrow, terminals are airline-specific).
- **Check-in status:** Fully checked in with mobile boarding pass, printed boarding pass in hand, or needs to check in at the airport. This eliminates or adds a step.
- **Luggage:** Carry-on only, checking one bag, checking multiple bags, oversized items (ski equipment, bicycles, surfboards, firearms). Oversized bags go to a separate counter, not the standard bag drop.
- **Connection details (if applicable):** Layover airport, scheduled arrival time of first flight, scheduled departure time of connecting flight, connection duration in minutes, same airline or separate airlines, same terminal or known different terminal.
- **Traveler profile:** First-time flyer, occasional traveler (1-5 flights per year), frequent flyer, unaccompanied minor, traveling with infant or children under 12, senior traveler, traveler requiring mobility assistance or wheelchair.
- **Trusted traveler program membership:** TSA PreCheck (US domestic), Global Entry (US international re-entry), NEXUS (US-Canada), CLEAR (biometric fast-lane, US only), EU registered traveler programs, or equivalent expedited security programs. These programs reduce security time dramatically and change the preparation checklist.
- **Special circumstances:** Medical devices (insulin pumps, pacemakers, CPAP machines), liquid medications exceeding 100ml, baby formula or breast milk, emotional support needs, anxiety about flying.

If the user cannot provide some details (e.g., gate number is not yet assigned), note that in the plan and provide the step "check departure screens upon arrival."

---

### Step 2: Calculate the recommended airport arrival time using a structured decision matrix

Apply the following base times, then apply every applicable modifier. The final arrival time is the sum of the base time plus all applicable additions.

**Base times (measured before scheduled departure):**

| Scenario | Base arrival window |
|---|---|
| Domestic, carry-on only, already checked in online | 75 minutes |
| Domestic, carry-on only, needs airport check-in | 90 minutes |
| Domestic, checking bags, already checked in online | 105 minutes |
| Domestic, checking bags, needs airport check-in | 120 minutes |
| Transborder (e.g., US-Canada), carry-on only | 120 minutes |
| Transborder, checking bags | 150 minutes |
| International, carry-on only, already checked in online | 150 minutes |
| International, carry-on only, needs airport check-in | 180 minutes |
| International, checking bags, already checked in online | 180 minutes |
| International, checking bags, needs airport check-in | 180-210 minutes |

**Add the following modifiers (cumulative):**

- **Peak travel period** (US Thanksgiving week, Christmas Dec 22-Jan 2, Memorial Day weekend, July 4 week, spring break mid-March, summer June-August): Add 30-45 minutes to domestic, 45-60 minutes to international
- **Major hub airport with known congestion** (LAX, JFK, ORD, LHR, CDG, DXB, ATL during peak): Add 20-30 minutes
- **First-time flyer or traveler with high anxiety:** Add 30 minutes
- **Traveling with children under 5 or with a stroller:** Add 20 minutes
- **Mobility assistance required (wheelchair or special assistance requested):** Add 30 minutes and note that the airline must be contacted 48 hours in advance
- **No expedited security program:** If the traveler has standard screening only at a large US hub, add 15-20 minutes vs. PreCheck/CLEAR
- **Red-eye or pre-dawn departure (before 05:00):** Subtract 15-20 minutes for reduced crowds, but add a note to verify that check-in counters and bag drop open at least 90 minutes before departure for that airline

**Minimum hard floors -- never recommend less than:**
- 90 minutes for any domestic flight, any circumstances
- 120 minutes for any international flight, any circumstances

---

### Step 3: Build the timed departure sequence with specific elapsed times

Use the recommended arrival time as the anchor and calculate forward to departure. Assign a clock time to every step, not just a duration. The user should be able to look at their phone and say "I am on schedule."

**Sequence components and standard duration ranges:**

**Arrival and orientation (8-15 minutes):**
- Enter the terminal and locate the airline-specific departure information screens (FIDS -- Flight Information Display Systems)
- Confirm flight status: on time, delayed, gate assigned or TBD
- Identify the correct check-in zone by airline (international airports often use zones A through G; domestic airports often use numbered check-in islands)
- Locate the check-in counter, self-service kiosk bank, or bag-drop lane for the specific airline
- Note restroom location near check-in for use before queuing

**Check-in and bag drop (10-35 minutes depending on method and queue):**
- Online check-in complete, carry-on only: skip to security -- 0 minutes at desk
- Online check-in complete, checking bags: bag-drop lane only -- 10-15 minutes
- Self-service kiosk check-in: 10-20 minutes including kiosk interaction and bag drop
- Full-service counter check-in: 20-35 minutes (longer on holidays, shorter off-peak)
- At check-in for international flights: passport inspection, security questions ("Did you pack your own bag?" "Has your bag been in your possession at all times?"), and entry of passport information into airline system may add 5-10 minutes
- Receive the luggage receipt (also called bag tag receipt) and attach it to carry-on or photograph it -- this is the claim reference if the bag is delayed
- If checking oversized items (ski bags, surfboard bags, bicycles): go to the oversized baggage counter, which is almost always separate from main check-in, often at the end of the check-in hall or near a dedicated door

**Security screening (15-50 minutes depending on airport, time, and program):**
- Standard domestic security (TSA, no PreCheck): 20-40 minutes at major hubs during peak
- TSA PreCheck: 5-15 minutes
- CLEAR + TSA PreCheck: 5-10 minutes (CLEAR handles biometric identity verification; PreCheck handles the dedicated lane -- they stack for fastest passage)
- International security (varies widely): 20-50 minutes; airports like LHR T5 and DXB have efficient layouts; LGW South, CDG Terminal 2E, and US international terminals can be slower
- Preparation begins before reaching the bin counter -- the more preparation done in the queue, the faster the bin loading process

**Walking time to gate (5-25 minutes depending on airport size):**
- Small regional airports (under 20 gates): 5 minutes
- Medium airports (20-60 gates, single concourse): 8-15 minutes
- Large hub airports with single terminal (ATL, DFW concourse D): 10-20 minutes
- Airports with multiple concourses connected by underground train (ORD, DFW, MCO, MIA): 15-25 minutes including train wait
- Gates at the far end of a long concourse (LAX's TBIT, JFK T4, LHR T3): 10-20 minutes of walking after passing security

**Gate area time (minimum 20 minutes before boarding; 30-45 minutes recommended):**
- Boarding typically opens 30-40 minutes before departure for domestic, 40-50 minutes for international
- Gate doors typically close 10-15 minutes before departure for domestic, 15-20 minutes for international
- Use this time for: restroom (go 15-20 minutes before boarding begins, not after it starts), food and water (obtain before boarding begins -- on-board service is not guaranteed on short flights), device charging (gate area outlets or USB stations), confirming gate on the departure screen

**Boarding sequence (15-40 minutes total from group 1 to doors close):**
- Most airlines board in a defined sequence: pre-boarding (wheelchair, families with young children, active military on some airlines), then elite frequent flyer tiers (top-tier first), then business/first class, then economy by zone or group number
- Zone 1 / Group 1: called approximately 35 minutes before departure
- Middle zones: approximately 25-30 minutes before departure
- Last zones: approximately 20-25 minutes before departure
- Encourage the user to listen for their specific boarding group, not just "when boarding starts" -- boarding the plane in the wrong group causes delays and may result in no overhead bin space

---

### Step 4: Build the detailed security preparation checklist

The checklist differs significantly based on the traveler's screening program. Always distinguish between standard and expedited lanes.

**Standard screening checklist (no PreCheck or equivalent):**
- Laptop and tablets (larger than a paperback book) removed from bag and placed in a separate bin, flat
- All other electronics (e-readers, cameras, portable batteries larger than 100Wh) removed from bag
- Liquids bag: all liquids, aerosols, gels, creams, and pastes in containers of 100ml/3.4oz or less, all fitting inside a single clear, resealable, one-liter (quart-sized) plastic bag, presented separately in a bin. One bag per person.
- Belt removed and placed inside the carry-on or in a bin (not around the belt loops -- it slides off and gets left behind)
- Jacket, coat, hoodie, and vest removed and placed in a bin or draped over the bag in the bin
- Shoes removed (standard TSA screening requires this; EU airports vary -- many European airports do not require shoe removal but some do)
- Pockets completely emptied: phone, keys, coins, wallet, gum, medication, boarding pass all go inside the carry-on or into a bin
- Watch, belt, and metal jewelry placed inside carry-on (more secure than a bin, which is open)
- If carrying a CPAP machine: remove from bag and place in its own bin (exempt from electronic device rules, treated like a medical device)

**TSA PreCheck lane checklist (US domestic and participating airports):**
- Laptop stays in the bag -- no removal required
- Liquids bag stays in the bag -- no removal required
- Shoes stay on
- Belt stays on
- Light jacket stays on
- Empty pockets of metal: keys and coins go in the bag

**CLEAR-equipped airports:**
- CLEAR uses iris scan or fingerprint to verify identity biometrically at a CLEAR pod before the security lane
- CLEAR members skip the document check queue and go directly to the TSA screening lane (and PreCheck lane if enrolled in both)
- The physical screening process is otherwise identical to PreCheck or standard, depending on enrollment

**Medical items and exemptions:**
- Liquid medications exceeding 100ml are allowed in "reasonable quantities" for the flight -- declare them separately at the start of the screening process, before placing items in bins
- Insulin pumps and insulin do not need to be removed from the body, but the traveler should inform the TSO (transportation security officer) before going through the scanner; body scanner can detect the device; the TSO will conduct a hand inspection
- Pacemakers and implanted metal devices: inform the TSO before the scanner -- a hand wand or pat-down will be used instead of the body scanner
- Baby formula, breast milk, and baby food/juice: explicitly exempt from the 100ml rule -- declare separately, will be tested with a liquid scanner wand, do not need to be in a clear bag

---

### Step 5: Build the connection plan (if applicable)

Classify the connection into one of four types and apply the corresponding procedure:

**Type 1 -- Airside, same terminal, same airline:**
- Deplaning to connecting gate with no security re-check
- Walk from arrival gate to departure gate within the same secure area
- Minimum recommended connection time: 35 minutes domestic, 45 minutes international
- If connection is 35-60 minutes: flag as tight, advise sitting near the front of the plane on the inbound leg, have carry-on positioned for fast deboarding

**Type 2 -- Airside, different concourse or terminal, same airport, no re-screening:**
- Walk or take intra-airport transit (shuttle bus, underground train, moving walkway) between concourses within the secure zone
- Examples: ATL underground train between concourses (3-5 min), DFW SkyLink train between terminals (4-8 min), ORD underground walkway between B and C gates (5-8 min walking)
- Minimum recommended connection time: 50 minutes domestic, 60 minutes international
- Check whether the transit runs at the connection time (especially for early morning flights -- ATL trains run continuously, but smaller shuttle buses have gaps)

**Type 3 -- Landside, different terminal, same airport, requires re-screening:**
- Passenger must exit the secure area, transit between terminals by bus or train, and re-clear security
- Examples: JFK AirTrain between terminals (8-15 min ride plus wait), LHR inter-terminal bus (10-15 min), LAX between domestic and TBIT (bus transfer 10-20 min)
- Minimum recommended connection time: 90 minutes domestic, 120 minutes international
- Add full security preparation time for the second screening

**Type 4 -- International to international or international to domestic with immigration and customs:**
- Passenger must clear passport control (immigration), collect checked bags, clear customs, re-check bags with the airline, and re-clear security
- This is required whenever connecting through a country as the first point of entry (e.g., connecting through Toronto from Europe to a US city -- US CBP preclearance is at YYZ, so the passenger clears US customs in Toronto, not the US)
- Minimum recommended connection time: 120 minutes absolute minimum; 150-180 minutes strongly preferred for first-time travelers
- Immigration queues during peak arrival banks at major hubs (JFK 12:00-17:00, LHR 07:00-10:00, AMS 07:00-11:00) can be 30-60 minutes alone

**For all connection types, provide:**
- Step-by-step transit instructions for the specific airports mentioned
- The decision threshold: if connection time is below the minimum recommended for that type, explicitly flag it as "tight" or "high risk" and provide the missed-connection response protocol
- A note on where to find the connecting gate (all airports have FIDS screens throughout; connecting flight info is also on the boarding pass)

---

### Step 6: Build the "If Something Goes Wrong" section with specific response protocols

Every navigation plan must include this section. Use specific action sequences, not general advice.

**Scenario: Flight is delayed**
- If delay is under 30 minutes: no action needed; monitor the departure screen
- If delay is 30-90 minutes: check for gate change; if connecting flight is affected, go to the airline's gate agent and ask them to note the connection in the system
- If delay exceeds 90 minutes or the connection becomes impossible: go to the airline service desk (not the gate agent -- the desk has more rebooking authority); bring all booking documents; ask for rebooking on the next available flight

**Scenario: Missed connection (regardless of cause)**
- Go immediately to the airline's transfer desk or service desk in the connecting airport -- do not go to departures, do not re-clear security
- For connections missed due to the inbound airline's delay (their fault): rebooking is at no charge; accommodation and meal vouchers are required under EU261 (EU departures or EU airlines on any route), DOT guidelines (US), and most airline contracts of carriage on long delays
- For connections missed due to the traveler's own delay (e.g., arrived at gate late): rebooking is at the airline's discretion; a standby fee may apply; travel insurance with "missed connection" coverage can reimburse reasonable costs
- Always ask explicitly: "Is my checked bag being transferred to the new flight automatically?" If the answer is uncertain, ask the desk to tag the bag to the new flight number

**Scenario: Lost or forgotten boarding pass**
- Go to the nearest airline check-in counter or service desk with a government-issued photo ID and the booking reference
- If using a mobile boarding pass and the phone has died: request a reprint; most airlines can reprint from their system using name + booking reference; no fee applies
- If security has already been cleared and the boarding pass was lost airside: the gate agent can scan the booking reference from the airline's system; ID is required

**Scenario: Checked bag not at arrival carousel**
- Do not leave the baggage claim area before filing a report
- Go to the airline's baggage service office (located in the baggage claim hall -- all major airlines have a desk)
- File a Property Irregularity Report (PIR); receive a reference number; provide a delivery address if the bag will be forwarded
- Most misrouted bags are located and delivered within 24-48 hours; the airline is responsible for reasonable delayed-baggage expenses (toiletries, essential clothing) after a defined period (typically 12 hours for domestic, 21 hours for international under Montreal Convention)
- Photograph the PIR reference number and the baggage receipt tag

---

### Step 7: Add profile-specific adaptations based on traveler type

Apply the correct profile adaptations from this list:

**First-time flyer:**
- Expand every step with explanatory context -- do not assume knowledge of FIDS screens, bin procedures, or gate numbering systems
- Explain what to say at the check-in counter (airline staff will guide -- it is a conversation, not a test)
- Explain what the security scanner sounds mean (a beep means stop and wait; a TSO will guide the next steps -- it is not alarming)
- Explain boarding groups: they are printed on the boarding pass; listen for the group number and move forward when it is called
- Recommend arriving at the early end of the arrival window

**Traveling with children under 12:**
- Most airlines allow pre-boarding for families with children under 2 (lap infant) or under a certain age (varies: Delta and United allow "families with children needing extra time" -- check with the gate agent)
- Family lanes at security: TSA has designated family lanes at most major airports -- children under 12 do not need to remove shoes under TSA rules
- Pack a dedicated "security access" pocket in the carry-on: liquids bag and laptop should be extractable in 30 seconds without unpacking the full bag
- Bring extra snacks and entertainment in the under-seat bag (not in the overhead bin) -- access to overhead bin is impossible during taxi and early flight

**Traveler requiring wheelchair or mobility assistance:**
- Contact the airline at least 48 hours before the flight; some airlines recommend 72 hours
- At the airport, go to the check-in counter and identify the need; a wheelchair escort service will be assigned; the escort navigates check-in, security, and gate access
- Security for wheelchair users: the wheelchair itself will be screened; the traveler receives a pat-down instead of walking through the scanner; the TSO will explain each step
- Pre-boarding is provided as standard for passengers requiring mobility assistance -- board before Zone 1 is called
- At the gate, inform the gate agent of any need for jetway assistance or a jet bridge vs. stairs boarding

**Traveler with anxiety about flying or airports:**
- Specificity is the primary anxiety-reduction tool -- provide every step in advance so nothing is a surprise
- Normalize common experiences: security alarms from forgotten items in pockets are routine and resolved in under 2 minutes; gate changes happen in approximately 10-15% of flights and are shown on screens; boarding delays are common and do not indicate mechanical problems
- Recommend a specific calming technique for the gate wait: the 4-7-8 breathing pattern (inhale 4 counts, hold 7 counts, exhale 8 counts) is clinically documented as reducing acute anxiety
- Recommend informing a flight attendant upon boarding -- they are trained to assist anxious flyers and can check in periodically during the flight

---

## Output Format

```
## Airport Navigation Plan: [Departure Airport] → [Destination]

**Flight:** [Airline] [Flight number] | Departing [HH:MM]
**Route type:** [Domestic | International | Transborder]
**Luggage:** [Carry-on only | Checking [X] bag(s) | Oversized item: specify]
**Check-in status:** [Online check-in complete with mobile/printed boarding pass | Needs airport check-in]
**Expedited security:** [TSA PreCheck | CLEAR + PreCheck | Global Entry | Standard screening]
**Traveler profile:** [First-time flyer | Occasional traveler | Frequent flyer | Traveling with children | Requires mobility assistance]
**Connections:** [None | Yes -- [Layover airport], [Connection time], [Connection type 1-4]]

---

### Recommended Airport Arrival Time: [HH:MM] ([X hours Y minutes] before departure)

**Calculation breakdown:**
- Base time: [X minutes] ([scenario])
- Modifier: [+/- X minutes] ([reason])
- Modifier: [+/- X minutes] ([reason])
- **Total buffer:** [X minutes]

---

### Step-by-Step Airport Sequence

| Step | Clock time | Action | Duration | Key notes |
|------|------------|--------|----------|-----------|
| 1 | [HH:MM] | Arrive at [Terminal X], locate departure screens | 10 min | Confirm flight status and gate assignment |
| 2 | [HH:MM] | [Check-in at kiosk/counter / Bag drop only / Proceed to security] | [X min] | [Have passport/ID ready; answer security questions] |
| 3 | [HH:MM] | Security screening -- [Standard / PreCheck / CLEAR] | [X min] | [See preparation checklist below] |
| 4 | [HH:MM] | Re-pack, re-dress, verify all items retrieved from bins | 5 min | Count: phone, laptop, bag, belt, shoes, liquids |
| 5 | [HH:MM] | Walk to Gate [X] via [concourse/train/walkway] | [X min] | [Re-check departure screen on arrival at gate] |
| 6 | [HH:MM] | Arrive at gate area | -- | Confirm gate screen shows [Flight number] to [Destination] |
| 7 | [HH:MM] | Gate time: restroom, food, water, charging | [X min] | Use restroom by [HH:MM]; board with water |
| 8 | [HH:MM] | Boarding begins (Group 1) | 35 min | Your boarding group: [Group X -- listed on boarding pass] |
| 9 | [HH:MM] | Your boarding group called | -- | Have [boarding pass + ID / passport] in hand |
| 10 | [HH:MM] | Scheduled departure | -- | Gate closes [X] min before this time |

---

### Security Preparation Checklist

**[Standard screening / TSA PreCheck / CLEAR + PreCheck]**

Items to remove and place in bins:
- [ ] [Laptop -- remove from bag, flat in own bin | Stays in bag (PreCheck)]
- [ ] [Tablet -- remove from bag, flat in own bin | Stays in bag (PreCheck)]
- [ ] Liquids bag: [clear 1L bag, all containers ≤100ml | Stays in bag (PreCheck)]
- [ ] Belt: [remove, place in bag or bin | Can stay on (PreCheck)]
- [ ] Jacket/hoodie: [remove, place in bin | Can stay on (PreCheck)]
- [ ] Shoes: [remove and place in bin | Stay on (PreCheck, and at most European airports)]
- [ ] Pockets completely emptied: [phone, keys, coins, wallet inside carry-on]
- [ ] Metal items (watch, jewelry): [place inside carry-on]

Exemptions for this traveler:
- [ ] [Baby formula/breast milk: declare separately; does not count toward 100ml rule]
- [ ] [Liquid medications over 100ml: declare at start of screening]
- [ ] [Medical device: inform TSO before scanner; hand inspection will follow]

---

### Connection Plan: [Layover Airport]

**Connection type:** [Type 1 / 2 / 3 / 4] -- [Description]
**Scheduled connection time:** [H:MM]
**Risk assessment:** [Comfortable | Manageable | Tight -- flag | High risk -- flag prominently]

| Stage | Action | Time estimate |
|-------|--------|---------------|
| Deplane [Flight 1] | Walk off aircraft; check departure screens | 8-12 min |
| [Immigration / no immigration] | [Queue, passport, questions, stamp / proceed directly] | [X-X min] |
| [Customs / no customs] | [Collect bag, customs line, re-check / proceed directly] | [X-X min] |
| [Re-screening / no re-screening] | [Security prep checklist above / airside transfer] | [X-X min] |
| Transit to gate | [Walk / train / bus] to Gate [X] | [X-X min] |
| Gate arrival | Check screen, board when called | [X min buffer] |

**If the connection is tight:** [Specific expedited instructions -- sit near front, ask crew on landing, designated connection service desk location]

---

### If Something Goes Wrong

**Flight delayed:**
[Specific steps based on delay duration and connection impact]

**Missed connection:**
[Steps: service desk location, rebooking rights, bag transfer confirmation, accommodation entitlement]

**Lost boarding pass:**
[Steps: nearest service desk, documents needed, reprint process]

**Checked bag not at carousel:**
[Steps: PIR filing, reference number, delivery address, expense reimbursement rights]

---

### Special Notes for This Traveler

[Profile-specific guidance: first-time flyer explanations, family boarding, mobility assistance, anxiety tips, etc.]
```

---

## Rules

1. **Never give a vague time recommendation.** "Give yourself plenty of time" is not an output of this skill. Every timing statement must be a specific clock time (e.g., "Arrive at 10:45") and a specific duration (e.g., "2 hours 45 minutes before departure"). If information is missing to calculate exact times, ask for it before generating the plan.

2. **Never go below the hard floors.** 90 minutes is the absolute minimum for any domestic flight recommendation regardless of how experienced the traveler is or how small the airport. 120 minutes is the absolute minimum for any international flight. These are not negotiable -- missed flights due to under-budgeted airport time are a documented source of severe travel disruption.

3. **Check-in status changes the entire sequence.** A traveler with a completed mobile boarding pass and carry-on only has a fundamentally different flow than one who needs to check in and drop a bag. Always confirm check-in status before building the timed sequence. If the traveler is unsure whether online check-in is complete, advise them to verify the airline's app or email confirmation before arriving at the airport.

4. **Expedited security programs are not interchangeable.** TSA PreCheck applies to security screening only. Global Entry applies to US customs re-entry only (though Global Entry members automatically receive PreCheck). CLEAR handles identity verification but does not replace TSA screening -- CLEAR members must still choose a standard or PreCheck lane for the physical screening. Do not tell a CLEAR-only member that they skip security.

5. **Gate information is always provisional.** Gates are assigned and changed by operations control in real time, sometimes as late as 30 minutes before departure. Never state a gate number as confirmed unless the user says it is currently showing on the departure screen. Always include a reminder to verify the gate on the FIDS screens after clearing security.

6. **The 100ml liquids rule applies to containers, not to quantity.** A container labeled 150ml with only 10ml remaining still fails the rule -- it is the container size, not the fill level, that matters at most security checkpoints. Do not tell travelers that a "mostly empty" large container is acceptable.

7. **Connection classification must be accurate.** The difference between a Type 2 (airside same airport, no re-screening) and Type 3 (landside transfer with re-screening) connection can be 45 minutes of required buffer time. Always clarify whether the connecting airport requires leaving the secure zone for a terminal change. When uncertain, flag the connection as requiring Type 3 timing as a precaution.

8. **Immigration and customs always require bag collection and re-check when entering a country for the first time.** Even if the traveler is "just connecting," if they are clearing immigration at the first port of entry, they must collect their bags, go through customs, and re-check with the airline. This is true for US CBP pre-clearance airports (Dublin, Shannon, Toronto, Vancouver, Abu Dhabi, and others) as well. Do not tell a traveler their bags will transfer automatically when this is not the case.

9. **Boarding group timing changes carry-on bin availability.** Last boarding groups on full flights frequently find the overhead bins full and must gate-check their carry-on. If the traveler has valuables, medication, or items they need during the flight in their carry-on, note this risk and advise them to keep essential items in a smaller personal-item bag under the seat, which cannot be gate-checked involuntarily.

10. **Special assistance must be booked in advance -- it cannot always be arranged at the airport on the day.** Wheelchair assistance, unaccompanied minor services, and medical device accommodations require advance notice (typically 24-72 hours depending on the airline and service). If a traveler mentions a special need and their flight is within 24 hours, note the risk that the specific service may not be fully available and advise contacting the airline immediately.

---

## Edge Cases

### Tight connection (under 60 minutes domestic / under 90 minutes international)

Flag this at the top of the connection plan section in bold: **"TIGHT CONNECTION -- RISK OF MISS."**

Provide a dedicated expedited transfer plan:
- On the inbound flight, select or request a seat as close to Row 1 as possible (or the first row of economy if premium is not available) -- every row equates to roughly 1 minute of deboarding time at major hub aircraft sizes
- When the inbound plane is taxiing, ask a flight attendant to contact the gate agent at the connecting terminal to notify them of the connection -- most airlines have a "connecting flight notification" procedure for passengers with under-60-minute connections
- When the seatbelt sign turns off, stand and retrieve your bag before most passengers -- this is time-sensitive
- Have the connecting gate number visible before landing (check before electronics must go off during final descent, or check the in-flight map which typically shows connecting gate assignments)
- Walk, do not browse or stop -- skip food, restrooms, and anything non-essential until you have reached the connecting gate or confirmed the new boarding is not yet closed
- At a US domestic tight connection: if the first flight landed more than 5 minutes late due to airline cause, the gate agent is obligated to hold the connecting flight for a reasonable period when the number of connecting passengers is significant
- If the connection is missed despite best effort: go directly to the airline's transfer service desk (in the arrivals or connecting flights corridor) -- not to a check-in desk and not through an exit

### First international flight with passport control unfamiliarity

Add a dedicated passport control section between the security and gate sections of the plan:

- **What passport control is:** A government immigration checkpoint that verifies the right to enter or transit through a country. It is staffed by government officers, not airline employees.
- **Queue selection:** Citizens/nationals use one queue; all other passports use a separate queue. Ensure the traveler goes to the correct queue for their passport.
- **What to have ready:** Passport (open to the photo page), boarding pass for the connecting or destination flight, any completed arrival card (many countries require this -- it is distributed on the plane or available at the immigration hall and takes 2 minutes to complete)
- **At the booth:** Approach when the officer waves you forward. Present documents. Answer questions directly and briefly: destination, purpose of travel, length of stay. Do not volunteer unsolicited information. The process takes 30 seconds to 2 minutes.
- **Receiving a stamp:** Not all countries stamp passports for transit -- this is normal. Some countries use digital entry systems and do not stamp at all (Australia's SmartGate, Singapore's AutoGate, US Global Entry kiosks).
- **If there is a problem:** Immigration officers will direct the traveler to a secondary inspection room -- this is not an arrest or accusation; it is a secondary documentation check that is resolved in most cases within 30-60 minutes with full documentation

### Traveling with an infant, lap child, or stroller

- A stroller (pushchair) and a car seat combined count as one free checked item on most US carriers and many international ones -- verify the specific airline policy, as budget carriers frequently charge
- **Gate-checking a stroller:** At the departure gate, request a gate-check tag from the gate agent before boarding begins. Fold the stroller at the top of the jet bridge, affix the tag, and leave it. It will be brought to the jet bridge on arrival (not the baggage carousel) -- the traveler retrieves it as they exit the aircraft
- **Lap infant boarding:** Infants under 2 are typically seated on the parent's lap. A boarding pass may or may not be required (varies by airline). Confirm with the airline at check-in -- the gate agent needs to record the infant in the system
- **Liquid exemptions at security:** Baby formula, breast milk, toddler milk, and baby food/juice are explicitly exempt from the 100ml rule under TSA rules and EU aviation security rules. Declare them to the security officer at the start of screening. They will be tested with a liquid trace detection wand and passed through. Do not pack them in the liquids bag -- place them separately

### Airport requiring re-screening at a second terminal

Several major airports require passengers to exit the secure zone and re-clear security when moving between terminals during a connection:
- JFK: AirTrain connects terminals; passengers arriving in T1 connecting to T7 (not linked airside) must exit, take AirTrain, and re-clear security -- approximately 25-35 minutes total
- LAX: Terminals 1-8 and TBIT are not fully connected airside; some cross-terminal connections require landside bus and re-screening -- approximately 30-45 minutes total
- LHR: Terminals 1-5 are not all airside-connected; T3 to T5 requires bus transfer and re-screening -- approximately 30-40 minutes
- CDG: Terminals 2E and 2F are airside-linked; 2E and 2G are not -- re-screening required for some connections

When this applies, add full security preparation time to the connection window, note that the traveler will need their boarding pass for the connecting flight to re-enter security (not just the inbound boarding pass), and add the re-screening checklist to the connection plan.

### Red-eye or very early pre-dawn departure (before 05:00)

- Many airport food and beverage outlets do not open until 05:30-06:00 -- advise eating before leaving for the airport
- Some airports close partially or fully overnight and reopen between 03:00-04:00 -- the traveler should verify the terminal opening time, which is published on the airport's official information service and sometimes differs from the check-in counter opening time
- Some airline check-in counters do not open until 2-3 hours before the first scheduled departure -- if the traveler has an 04:00 departure and the counter opens at 02:30, bag drop cannot happen before then; factor this into the plan
- Expedited security lanes (TSA PreCheck, CLEAR) sometimes do not open before 04:30-05:00 even at large airports -- the traveler may need to use standard lanes even if enrolled
- Taxi and rideshare demand at 01:00-02:00 can vary significantly by city; note that surge pricing is common and services may be slower

### Traveler with a medical device (insulin pump, CPAP, pacemaker, cochlear implant)

- **Insulin pumps:** Cannot go through the X-ray machine (tube could be damaged by radiation) and should not go through body scanners (some manufacturers advise against). The traveler should inform the TSO before screening begins and request a hand pat-down and hand inspection of the pump. This adds approximately 5-10 minutes to screening -- budget this time.
- **CPAP machine:** Exempt from electronics screening restrictions in the US (FAA Modernization Act). Placed in its own bin. Should be clean and dry, as it may be inspected. Distilled water for the humidifier is subject to the 100ml rule -- advise packing distilled water in checked luggage and purchasing at the destination, or flying without the humidifier.
- **Pacemaker / cochlear implant:** Should not pass through metal detectors or body scanners. Inform the TSO. A hand wand or full pat-down will be used. Carry the device card (issued by the manufacturer and cardiologist) that identifies the device -- TSOs may ask to see it.
- **Liquid medications (including insulin) over 100ml:** Allowed in reasonable quantities. Must be declared at the start of screening. Will be tested with liquid detection. Prescription label on the medication matching the traveler's name helps resolve questions quickly.

### Missed or cancelled flight at the origin (not a connection)

- If the flight is cancelled before the traveler reaches the airport: contact the airline by phone and via the app simultaneously -- rebooking is faster by app for most major carriers; phone queues spike when mass cancellations occur
- If the flight is cancelled while the traveler is at the airport: go to the airline service desk, not the gate; the gate agent can rebook but the desk agent typically has more system access and authority
- Under EU261/2004 (applicable to flights departing the EU, or EU-carrier flights arriving in the EU from outside): cancellations with less than 14 days' notice entitle the passenger to a choice of refund or rerouting, plus care (meals and hotel if delay exceeds certain thresholds) -- €250/400/600 compensation depending on route distance, unless caused by extraordinary circumstances (severe weather, ATC strike, pandemic)
- Under US DOT rules: airlines must refund the full ticket price for cancelled flights regardless of reason; there is no EU261-style flat compensation requirement, but the airline's own contract of carriage governs additional care
- Keep all receipts for food and accommodation purchased during an airline-caused delay -- these are the basis for reimbursement claims

---

## Example

**Input from user:** "I'm flying from Chicago O'Hare (ORD) on United Airlines, departing at 13:15, domestic flight to Denver. I've already checked in online and have my mobile boarding pass. I'm checking one bag. I have TSA PreCheck. I'm a pretty experienced traveler but it's been about a year since I flew. Peak summer travel. What time should I arrive and what's my step-by-step plan?"

---

## Airport Navigation Plan: Chicago O'Hare (ORD) → Denver (DEN)

**Flight:** United Airlines | Departing 13:15
**Route type:** Domestic
**Luggage:** Checking 1 bag
**Check-in status:** Online check-in complete -- mobile boarding pass ready
**Expedited security:** TSA PreCheck enrolled
**Traveler profile:** Experienced traveler (occasional, 1+ year gap)
**Connections:** None

---

### Recommended Airport Arrival Time: 11:00 (2 hours 15 minutes before departure)

**Calculation breakdown:**
- Base time: 105 minutes (domestic, checking bags, already checked in online)
- Modifier: +30 minutes (peak summer travel -- ORD is one of the busiest US airports; summer Friday/Saturday bag-drop queues at United are known to run 20-30 minutes)
- PreCheck modifier: -0 minutes applied to arrival time (PreCheck shortens security time to approximately 10-15 minutes, which was already partially reflected in the base time; arrival time is set conservatively because bag drop is the rate-limiting step, not security)
- **Total recommended buffer:** 135 minutes

**Why not earlier?** ORD bag-drop wait times for United on summer weekdays peak between 11:00 and 14:00. Arriving at 11:00 puts you at the front of that window. Earlier arrival provides diminishing returns since bags cannot be dropped more than 4 hours before departure on United domestic flights.

---

### Step-by-Step Airport Sequence

| Step | Clock Time | Action | Duration | Key Notes |
|------|------------|--------|----------|-----------|
| 1 | 11:00 | Arrive at ORD. United departs from Terminal 1 (Concourses B and C). Enter via Terminal 1 sign from departures curb or garage. | 8 min | Locate the FIDS (departure screens) -- confirm your flight is "ON TIME" and note the gate. United at ORD uses Concourses B and C. |
| 2 | 11:08 | United bag drop -- United check-in hall, Terminal 1 | 20 min | You are already checked in. Go to the bag drop / checked baggage line (not the full check-in queue). Have your mobile boarding pass and government-issued ID accessible. Tag your bag, receive the luggage receipt -- photograph it and keep a digital copy. |
| 3 | 11:28 | Walk to TSA PreCheck lane, Terminal 1 | 5 min | PreCheck lanes at ORD T1 are clearly marked. Confirm your boarding pass shows "TSA PRE" in the header -- if it doesn't, you must use the standard lane, which has longer waits. |
| 4 | 11:33 | TSA PreCheck screening | 12 min | See PreCheck checklist below. At ORD Terminal 1, PreCheck is efficient on weekday midmornings. |
| 5 | 11:45 | Clear security -- re-confirm belongings | 3 min | Verify: phone, boarding pass accessible, bag zipped. Belt and shoes stay on (PreCheck). |
| 6 | 11:48 | Walk to gate (Concourse B or C) | 12 min | ORD Terminal 1 connects Concourses B and C via an underground walkway with moving sidewalks and light displays -- this is expected, not a wrong turn. Check the FIDS at the concourse entrance to confirm your gate. |
| 7 | 12:00 | Arrive at gate area | -- | Confirm the gate screen shows your flight number UA [XXXX] to Denver (DEN) at 13:15. If the gate has changed since bag drop, the screen will show the new gate. |
| 8 | 12:00 -- 12:40 | Gate time: food, water, charging, restroom | 40 min | There are several food options in both ORD concourses airside. Buy water now -- the Denver flight will have beverage service, but on-board service may be limited on a full aircraft. Gate power outlets are available at most ORD B/C gates. |
| 9 | 12:35 | Use restroom -- before boarding starts | -- | Do this before boarding is called, not after. Once the gate area line forms, restrooms become harder to access quickly. |
| 10 | 12:40 | Boarding begins -- United Group 1 (elite) | -- | Listen for boarding announcements. Your boarding group is printed on your mobile boarding pass (swipe to full boarding pass view). United boards in the sequence: pre-boarding, then Premier elite tiers, then Business/First, then Economy groups 1 through 5. |
| 11 | ~12:50 | Your boarding group called | -- | Approach the gate scanner with mobile boarding pass visible and phone brightness turned up. Gate scanner reads the QR code. Move through promptly. |
| 12 | 13:15 | Scheduled departure | -- | Gate closes approximately 10 minutes before departure (13:05). Do not be in the restroom or at a food counter after 12:55. |

---

### Security Preparation Checklist

**TSA PreCheck lane -- streamlined process**

Because you have PreCheck, your screening is significantly simplified:
- [ ] **Laptop stays in your bag** -- no removal required
- [ ] **Liquids bag stays in your bag** -- no removal required
- [ ] **Belt stays on** -- no removal required
- [ ] **Shoes stay on** -- no removal required
- [ ] **Light jacket stays on** -- no removal required
- [ ] Empty pockets of metal items only: keys and coins go in your carry-on bag or jacket pocket (not a loose bin)
- [ ] Keep phone accessible to scan boarding pass at the ID check podium before the screening lane
- [ ] Walk through the PreCheck scanner (a standard metal detector, not a body scanner) when directed

**One reminder after a gap year of travel:** Double-check that your PreCheck Known Traveler Number (KTN) is correctly entered in your United profile. If it was removed or expired, your boarding pass will not show "TSA PRE" and you will need the standard lane. Check the boarding pass header now, before you get to the airport.

---

### Connection Plan

None applicable for this itinerary.

---

### If Something Goes Wrong

**Flight delayed at ORD:**

- Delays under 30 minutes: no action needed. Monitor the departure screen for gate changes. ORD has a high volume of weather-related short delays, particularly afternoon thunderstorms in summer. Your 13:15 departure is in the higher-risk part of the day for summer ORD delays.
- Delays 30-90 minutes: check the United app for real-time updates -- it is generally faster than gate screens for delay information. No action needed unless you have a connection at DEN (you don't on this trip).
- Delays over 90 minutes or outright cancellation: go to the United customer service desk in the terminal (not the gate -- the gate agent handles boarding only). Alternatively, call United's reservations line or rebook via the United app, which now supports rebooking directly in-app during irregular operations. Rebooking on the next available ORD-DEN flight is at no charge for airline-caused delays.
- **Summer weather note:** ORD is one of the most delay-prone US airports in summer due to convective weather (afternoon thunderstorms). The 13:15 departure is in the higher-risk window. This is not a reason to be concerned, but it is worth having the United app open and notifications enabled.

**Lost mobile boarding pass (phone dead or app failure):**

1. Go to the nearest United customer service kiosk or agent counter -- not the gate
2. Provide your name and booking confirmation number (this is in your confirmation email -- save it offline before traveling)
3. They will reprint the boarding pass on paper at no charge
4. If your phone is simply dead, airport charging stations are available in most ORD concourses; a kiosk reprint is faster

**Checked bag not at DEN carousel:**

1. Do not leave the baggage claim hall at DEN without filing a report
2. United's baggage service office is located adjacent to the carousel area at DEN -- look for the United baggage desk
3. File a Property Irregularity Report (PIR) and receive a reference number -- photograph or screenshot this
4
