---
name: travel-safety-prep
description: |
  Creates a pre-departure safety checklist and emergency contacts template
  for travel. Gathers destination, trip type, traveler profile, and health
  considerations to produce a numbered action checklist with deadlines and
  an emergency reference card the traveler can carry.
  Use when the user asks about travel safety preparation, creating an
  emergency contacts card, pre-trip safety planning, or how to prepare for
  travel emergencies.
  Do NOT use for solo travel planning (use solo-travel-planner), travel
  insurance comparison (use travel-insurance-evaluator), or workplace
  safety compliance.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel safety checklist planning"
  category: "travel-experiences"
  subcategory: "travel-logistics"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Travel Safety Prep

## When to Use

**Use this skill when:**
- User asks about travel safety preparation or pre-trip safety planning
- User wants to create an emergency contacts card for travel
- User asks what safety steps to take before a trip
- User wants a pre-departure safety checklist
- User asks about health preparations, vaccinations, or medical readiness for travel
- User wants to prepare for potential emergencies while traveling

**Do NOT use when:**
- User wants a full solo travel itinerary with safety layers (use `solo-travel-planner`)
- User wants to compare travel insurance policies (use `travel-insurance-evaluator`)
- User wants visa or entry requirements (use `visa-requirements-checker`)
- User needs workplace or occupational safety planning
- User wants a packing list (use `packing-list-builder`)

## Process

1. **Gather safety planning parameters.** Ask the user for:
   - Destination country or region
   - Trip duration
   - Trip type (leisure, adventure, business, backpacking)
   - Number of travelers (solo, couple, family, group)
   - Any pre-existing medical conditions or medications
   - Planned high-risk activities (adventure sports, remote hiking, water activities)
   - Whether the trip is domestic or international
   - Emergency contact at home (name, relationship, phone)

2. **Build the document preparation checklist.** List critical documents to prepare:
   - Passport validity check (6+ months for international travel)
   - Passport and ID photocopies (paper and digital)
   - Travel insurance policy details (policy number, emergency phone)
   - Prescription copies for all medications
   - Accommodation addresses and phone numbers
   - Embassy or consulate contact for destination country
   - Itinerary copy shared with home contact

3. **Create the health and medical preparation section.** Include:
   - Vaccination requirements and recommendations for destination (consult travel health clinic)
   - Medication supply: full trip duration + 5 extra days in original packaging
   - Prescription letter from doctor for controlled medications
   - First aid kit contents list customized to trip type
   - Health insurance confirmation of international coverage
   - Location of hospitals and clinics near accommodation
   - Allergy and medical condition summary card in local language

4. **Build the communication and technology safety plan.** Include:
   - Phone setup: international roaming or local SIM card plan
   - Offline maps downloaded for destination
   - Location sharing setup with emergency contact
   - Emergency numbers saved in phone (local police, ambulance, fire, embassy)
   - Banking notification for travel dates (prevent card blocks)
   - Secure copies of documents in cloud storage accessible from any device

5. **Create the personal safety protocol.** Include:
   - Money safety: carry cash in multiple locations, use a money belt for large amounts
   - Valuables management: use accommodation safe, minimize visible expensive items
   - Transportation safety: licensed taxi identification, transit safety tips for destination
   - Neighborhood awareness: areas to enjoy and areas to avoid (especially after dark)
   - Scam awareness: 3-5 common scams at the destination with avoidance strategies

6. **Build the emergency response plan.** Include:
   - Emergency contacts card (wallet-sized, waterproof recommended)
   - Steps if passport is lost or stolen (embassy contact, police report, emergency travel document)
   - Steps if medical emergency occurs (who to call, what to say, documentation to provide)
   - Steps if belongings are stolen (police report, insurance claim initiation, card cancellation numbers)
   - Natural disaster or civil unrest protocol (embassy registration, evacuation routes, shelter-in-place guidance)

7. **Compile the pre-departure timeline.** Create a countdown checklist:
   - 8-12 weeks before: vaccinations, passport check, insurance purchase
   - 4 weeks before: document copies, banking notifications, prescriptions
   - 1 week before: technology setup, emergency card creation, final check
   - Day of departure: carry checklist verification, documents in multiple locations

## Output Format

```
## Travel Safety Prep: [Destination] -- [N] Days

**Trip type:** [Leisure | Adventure | Business | Backpacking]
**Travelers:** [Count and composition]
**Risk level:** [Low | Moderate | High] based on destination and activities

---

### Emergency Contacts Card (Print and Carry)

| Contact                     | Number / Info                         |
|-----------------------------|---------------------------------------|
| Local emergency number      | [Number]                              |
| Local police                | [Number]                              |
| Ambulance                   | [Number]                              |
| Nearest embassy/consulate   | [Address, phone, hours]               |
| Accommodation               | [Name, address, phone]                |
| Home emergency contact      | [Name, phone, relationship]           |
| Travel insurance emergency  | [Policy #, 24hr line]                 |
| Bank card emergency         | [Lost card phone number]              |
| [Second card emergency]     | [Lost card phone number]              |

---

### Pre-Departure Timeline

| Deadline          | Action                                              | Status |
|-------------------|-----------------------------------------------------|--------|
| 8-12 weeks before | [Action with specific detail]                       | [ ]    |
| 4-8 weeks before  | [Action with specific detail]                       | [ ]    |
| 2-4 weeks before  | [Action with specific detail]                       | [ ]    |
| 1 week before     | [Action with specific detail]                       | [ ]    |
| Day of travel     | [Action with specific detail]                       | [ ]    |

### Document Preparation Checklist

| # | Document                    | Action                              | Status |
|---|------------------------------|-------------------------------------|--------|
| 1 | [Document]                   | [Specific action]                   | [ ]    |

### Health and Medical Preparation

| # | Item                         | Action                              | Status |
|---|------------------------------|-------------------------------------|--------|
| 1 | [Item]                       | [Specific action]                   | [ ]    |

### Communication and Technology Setup

| # | Item                         | Action                              | Status |
|---|------------------------------|-------------------------------------|--------|
| 1 | [Item]                       | [Specific action]                   | [ ]    |

### Personal Safety Protocol

**Money and valuables:**
- [Specific guideline]

**Transportation:**
- [Specific guideline]

**Common scams at [Destination]:**
1. [Scam name]: [How it works] -- [How to avoid it]

### Emergency Response Procedures

**If passport is lost or stolen:**
1. [Step]
2. [Step]

**If medical emergency occurs:**
1. [Step]
2. [Step]

**If belongings are stolen:**
1. [Step]
2. [Step]
```

## Rules

1. NEVER include external URLs, specific brand names, or service provider names -- use generic descriptions
2. ALWAYS include an emergency contacts card formatted for printing and carrying
3. ALWAYS include a pre-departure timeline with specific deadlines counted back from departure
4. Every checklist item must have a specific action -- never use vague instructions like "be prepared" or "stay alert"
5. Include at least 3 destination-specific scam descriptions with avoidance strategies
6. Include emergency response procedures for at least 3 scenarios (passport loss, medical emergency, theft)
7. Health preparation must include a vaccination consultation recommendation -- never prescribe specific vaccines
8. NEVER provide medical diagnoses or treatment recommendations -- direct users to consult travel health professionals
9. Include a document preparation section for every trip, domestic or international
10. Communication setup must include offline capability (offline maps, downloaded documents) -- never assume internet access during emergencies
11. NEVER output general safety platitudes -- every item must be a specific, actionable step with a clear deadline or trigger

## Edge Cases

- **Trip to high-risk destination (active travel advisory):** Add a dedicated "Travel Advisory" section. Include embassy registration steps. Add enhanced communication protocol (check in twice daily). Include evacuation route research. Note that travel insurance may not cover destinations under active advisory.

- **Adventure travel with high-risk activities:** Create an activity-specific safety section for each planned activity (diving: certification verification, equipment check; trekking: altitude acclimatization schedule, group size requirements). Include emergency protocols specific to each activity type. Note activity-specific insurance requirements.

- **Traveling with medications (especially controlled substances):** Add a dedicated medications section: original packaging requirement, prescription letter in English and destination language, quantity documentation, declaration requirements at customs, temperature-sensitive storage plan. Research destination laws on controlled substances -- some medications legal at home may be restricted abroad.

- **Family with young children:** Add pediatric emergency clinic location. Include child-specific first aid kit items (liquid medication, dosage chart by weight). Add a lost-child protocol (meeting point, identification wristband, recent photo on phone). Include food allergy translation card in destination language.

- **Domestic trip (no passport or visa concerns):** Remove passport and visa sections. Focus on: insurance verification for out-of-state coverage, road safety if driving, weather and natural disaster preparation, health facility locations near accommodation.

- **Traveler with significant medical condition:** Elevate medical preparation to the top section. Include medical alert identification recommendation. Require the user to confirm condition and treatment details with their physician before travel. Add a medical summary card in the local language. Verify blood type availability and hospital capability at destination.

## Example

**Input:** "I am traveling to Morocco for 10 days with my partner. Leisure trip, we want to visit markets and do a desert tour. No medical conditions."

**Output:**

## Travel Safety Prep: Morocco -- 10 Days

**Trip type:** Leisure (markets, culture, desert tour)
**Travelers:** 2 adults (couple)
**Risk level:** Moderate (desert excursion, busy market areas)

---

### Emergency Contacts Card (Print and Carry)

| Contact                     | Number / Info                              |
|-----------------------------|--------------------------------------------|
| Local emergency number      | 19 (police), 15 (ambulance)                |
| Tourist police              | 177 (toll-free tourist assistance line)     |
| Nearest embassy/consulate   | [Check your country's embassy in Rabat or nearest consulate] |
| Accommodation (City)        | [Fill in after booking: name, address, phone] |
| Accommodation (Desert)      | [Fill in after booking: tour company contact] |
| Home emergency contact      | [Name, phone, relationship]                |
| Travel insurance emergency  | [Policy number, 24-hour line]              |
| Bank card emergency (Card 1)| [Card issuer lost card phone number]        |
| Bank card emergency (Card 2)| [Second card issuer lost card phone number] |

---

### Pre-Departure Timeline

| Deadline             | Action                                                          | Status |
|----------------------|-----------------------------------------------------------------|--------|
| 8-10 weeks before    | Check passport validity (6+ months), schedule travel health consultation | [ ] |
| 6-8 weeks before     | Purchase travel insurance, make document copies                  | [ ]    |
| 4 weeks before       | Notify bank of travel dates, research local SIM options          | [ ]    |
| 2 weeks before       | Download offline maps, save emergency numbers in phone           | [ ]    |
| 1 week before        | Print emergency card, share itinerary with home contact          | [ ]    |
| Day of travel        | Verify documents in carry-on, cash in money belt, phone charged  | [ ]    |

### Document Preparation Checklist

| # | Document                       | Action                                           | Status |
|---|--------------------------------|--------------------------------------------------|--------|
| 1 | Passport                       | Verify valid 6+ months past return date, 2 blank pages | [ ] |
| 2 | Passport photocopy (paper)     | Two copies: one in carry-on, one in checked bag   | [ ]    |
| 3 | Passport photocopy (digital)   | Photo stored in cloud and on phone                 | [ ]    |
| 4 | Travel insurance policy        | Print summary page with policy number and phone    | [ ]    |
| 5 | Accommodation confirmations    | Print addresses in French or Arabic for taxi use   | [ ]    |
| 6 | Desert tour confirmation       | Print booking with guide name and pickup details   | [ ]    |
| 7 | Return flight confirmation     | Print boarding pass or confirmation number         | [ ]    |
| 8 | Emergency contact card         | Print wallet-sized card from template above        | [ ]    |

### Health and Medical Preparation

| # | Item                           | Action                                           | Status |
|---|--------------------------------|--------------------------------------------------|--------|
| 1 | Travel health consultation     | Visit a travel clinic 6-8 weeks before -- they will assess vaccination needs for Morocco (Hepatitis A, Typhoid commonly recommended -- consult the clinic) | [ ] |
| 2 | First aid kit                  | Pack: band-aids, antiseptic wipes, anti-diarrhea medication, rehydration sachets, pain reliever, antihistamine, blister patches | [ ] |
| 3 | Sun protection                 | SPF 50+ sunscreen, hat, sunglasses (desert sun is intense -- UV index regularly 10+) | [ ] |
| 4 | Stomach preparation            | Pack anti-diarrhea medication and rehydration sachets -- traveler's stomach is common | [ ] |
| 5 | Prescriptions                  | If taking any medications: pack in original packaging with prescription label | [ ] |
| 6 | Nearest clinic research        | Identify clinic or hospital near city accommodation and note address | [ ] |

### Communication and Technology Setup

| # | Item                           | Action                                           | Status |
|---|--------------------------------|--------------------------------------------------|--------|
| 1 | Phone plan                     | Purchase local SIM at airport or activate international roaming | [ ] |
| 2 | Offline maps                   | Download Morocco map for offline use in maps application | [ ] |
| 3 | Location sharing               | Set up live location sharing with home contact     | [ ]    |
| 4 | Emergency numbers in phone     | Save 19 (police), 15 (ambulance), 177 (tourist police), embassy number | [ ] |
| 5 | Banking notification           | Call both card issuers: notify of Morocco travel dates to prevent blocks | [ ] |
| 6 | Cloud document backup          | Upload passport photo, insurance policy, itinerary to cloud storage | [ ] |
| 7 | Translation tool               | Download French and Arabic offline translation pack | [ ] |

### Personal Safety Protocol

**Money and valuables:**
- Carry daily spending cash in a front pocket or cross-body bag with zipper
- Keep larger cash reserves and backup card in a hidden money belt under clothing
- Split cash between two locations (one on each person)
- Use accommodation safe for passport, extra cash, and backup cards when going out
- Exchange currency at official exchange offices, not street changers

**Transportation:**
- Use licensed petit taxis (metered) within cities -- insist on the meter or agree on a price before entering
- For inter-city travel, use grand taxis from official stands or pre-booked private transfer
- For the desert tour, confirm the tour operator through your accommodation -- avoid street-solicited tours
- At night, arrange return transport before going out (have accommodation call a taxi)

**Common scams in Morocco:**
1. **"Free" henna or gift scam:** Someone applies henna to your hand or drapes a necklace on you without asking, then demands payment. **Avoid:** Firmly decline any unsolicited service or gift. Say "la, shukran" (no, thank you) and walk away.
2. **Fake guide in medina:** A person offers to "help" you find your hotel or a shop, leads you through alleys, then demands a guide fee. **Avoid:** Politely decline help. Use your offline map. If lost, ask a shopkeeper for directions.
3. **Overpriced market goods with aggressive negotiation:** Initial prices in markets may be 5-10x the fair price. **Avoid:** Research typical prices before shopping. Start at 30-40% of the asking price and negotiate from there. Be willing to walk away -- the final price is often offered as you leave.

### Emergency Response Procedures

**If passport is lost or stolen:**
1. File a police report at the nearest police station (bring a photocopy of your passport)
2. Contact your embassy or consulate (number on emergency card) to request an emergency travel document
3. Bring 2 passport photos and the police report to the embassy appointment
4. Notify your home contact of the situation
5. Contact your travel insurance to report the incident and ask about coverage for replacement costs

**If medical emergency occurs:**
1. Call 15 (ambulance) or have your accommodation call for you
2. If the situation allows, go to the nearest private clinic (generally faster and better equipped than public hospitals)
3. Contact your travel insurance 24-hour emergency line immediately -- they can coordinate care and direct payment
4. Keep all receipts, medical reports, and prescriptions for insurance claims
5. Contact your home emergency contact

**If belongings are stolen:**
1. Report to police immediately and obtain a written police report (required for insurance claims)
2. Call your bank to cancel stolen cards (use the numbers on your emergency card)
3. Contact your travel insurance to initiate a claim (provide the police report number)
4. If your phone is stolen, remotely lock and wipe it. Use your backup device or accommodation computer to access cloud-stored documents.
5. Contact your accommodation for assistance -- they can help with local police and language barriers
