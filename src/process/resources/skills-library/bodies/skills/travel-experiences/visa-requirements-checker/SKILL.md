---
name: visa-requirements-checker
description: |
  Creates a visa research checklist by destination and passport country with
  timeline deadlines, document requirements, and application process steps.
  Gathers travel destination, passport nationality, trip purpose, and duration
  to produce a structured visa preparation checklist with action items and
  deadlines counted back from the departure date.
  Use when the user asks about visa requirements, how to apply for a travel
  visa, what documents are needed for entry, or whether they need a visa for
  a specific country.
  Do NOT use for immigration or residency visas, work permit applications,
  student visa processes, or citizenship applications.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel research checklist planning"
  category: "travel-experiences"
  subcategory: "travel-logistics"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Visa Requirements Checker

## When to Use

**Use this skill when:**
- User asks whether they need a visa for a specific country and provides their passport nationality
- User wants step-by-step guidance on how to apply for a tourist or short-stay visitor visa
- User asks what documents are needed for entry into a foreign country for tourism, business meetings, or family visits
- User needs a backward-counted preparation timeline based on a specific departure date
- User wants to understand the difference between visa-free entry, visa on arrival, e-visa, and consulate visa -- and which applies to them
- User asks about transit visa requirements for layover countries on a multi-leg itinerary
- User has a multi-destination trip and needs visa requirements analyzed for each country in sequence
- User asks whether their planned activities (attending a conference, visiting a trade show, scouting business partners) require a business visa or fall under tourist entry rules

**Do NOT use when:**
- User is applying for an immigrant visa, permanent residency, or long-stay visa (more than 90 days as a rule of thumb for most countries) -- these require country-specific immigration guidance beyond this skill
- User needs a work permit, employment authorization, or sponsored work visa -- application structures, labor market tests, and employer sponsorship requirements are outside this skill's scope
- User is applying for a student visa or academic exchange program visa (F-1, Tier 4, Type D national visas) -- these involve university enrollment documentation, language proficiency requirements, and financial sponsorship rules that require a dedicated skill
- User is pursuing citizenship, naturalization, or permanent residency
- User has received a visa denial and needs to appeal, file a writ, or challenge an immigration decision -- refer to an immigration attorney
- User needs passport renewal guidance -- this is a separate process handled by the user's own government, not the destination country's consulate
- User needs emergency travel document or consular assistance abroad -- refer to their home country's embassy or consulate in the destination
- User is asking about refugee status, asylum applications, or humanitarian protection

---

## Process

### Step 1: Gather All Research Parameters Before Proceeding

Ask for -- or extract from the conversation -- every variable that affects visa determination. Do not begin research without knowing all of these:

- **Passport nationality:** The country whose passport they will travel on. If the user mentions dual citizenship, ask which passports they hold -- this is critical.
- **Destination country or countries:** For multi-destination trips, list every country in travel order.
- **Trip purpose:** Tourism, business (meetings, conferences, trade shows, contract signing), family visit, transit, medical treatment, religious pilgrimage, or voluntourism. The purpose determines the visa category, and misclassifying it is a major application error.
- **Planned trip duration in days:** Not just "two weeks" -- get a specific number of nights because visa-free allowances are measured in calendar days of stay, not nights, and the entry day counts as day one in most systems.
- **Planned departure date from home country:** This is the anchor for all timeline calculations.
- **Any layover countries:** Even a 2-hour airside connection can require a transit visa for some passport nationalities.
- **Dual citizenship or multiple passports:** If yes, ask which passport they intend to use for travel and whether they have stamps or visas from countries that might create problems at the destination (e.g., Israel stamps complicating entry into certain Middle Eastern countries).
- **Prior visa denials or overstays anywhere:** This affects disclosure requirements and risk level for the current application.
- **Current travel document validity:** Ask when their passport expires. If it expires within 9 months of the departure date, flag passport renewal as the immediate first priority before any visa steps.

### Step 2: Determine the Visa Category with Precision

Visa categorization is the most consequential step. Identify the applicable category using the passport-destination combination:

- **Visa-free entry:** The passport holder may enter the destination without obtaining any prior authorization. Key details to research and communicate:
  - Maximum permitted stay in days (commonly 30, 60, or 90 days; the Schengen Area applies a 90-days-in-any-180-day-rolling-window rule, not 90 days per year)
  - Whether the stay is automatically granted or subject to the immigration officer's discretion at the port of entry
  - Whether registration with local authorities is required after arrival (common in some Eastern European and Central Asian countries)
  - Entry/exit stamp rules -- some visa-free schemes require proof of sufficient funds and onward/return travel to be presented to border officers even without a formal visa

- **Visa on arrival (VOA):** Authorization is obtained at the destination airport's immigration counter or visa desk. Critical parameters:
  - Which entry ports support VOA (not all airports in a country may offer this -- inland or overland border crossings often do not)
  - Documents to prepare before landing: passport photos (typically 1-2, specific dimensions), completed arrival forms, exact fee in local currency or USD/EUR as accepted, proof of accommodation and return flight
  - VOA is at officer's discretion -- unlike a pre-approved visa, denial at the counter leaves the traveler stranded with little recourse
  - Queue times at major airports can exceed 2 hours for peak arrivals; this should be noted for travelers with tight connecting flights

- **E-visa (electronic visa):** Applied for online before travel; authorization linked to the passport number in the immigration database. Key details:
  - Official government portal URL (do not name it here, but always distinguish the legitimate immigration authority portal from third-party visa service websites, which charge service fees on top of the official fee)
  - Processing time range: typically 3-7 business days for routine applications; some countries offer 24-72 hour express processing for an additional fee
  - Whether single-entry or multiple-entry options are available and any price difference
  - E-visa approval format: most countries issue an approval notice via email that must be printed; some are linked purely to the passport number and require no paper document
  - Permitted entry ports: some e-visas restrict entry to specific airports or crossing points

- **Consulate or embassy visa (sticker/stamp visa):** The most complex category, requiring in-person or mail submission to the destination country's diplomatic mission. Key details:
  - Appointment scheduling timelines: popular consulates in major cities may have appointment slots booked 6-12 weeks in advance
  - Whether the consulate covers the applicant's jurisdiction (applicants typically apply at the consulate in their country of residence, not necessarily their country of citizenship -- these can differ for expats)
  - Processing time after submission: standard (15-30 business days), expedited (5-10 business days at additional cost), emergency processing
  - Passport must be submitted with the application and is physically held by the consulate during processing -- plan travel accordingly
  - Interview requirements: most short-stay tourist visas do not require interviews, but some consulates (particularly for U.S. Schengen, UK, Australian, and Canadian visa applications from certain nationalities) conduct in-person or video interviews

- **Transit visa:** Required for passing through a country's immigration control zone when the layover country's rules mandate it. Key distinctions:
  - **Airside transit (TWOV -- Transit Without Visa):** Staying within the secured international terminal without clearing immigration. Many countries exempt all nationalities from airside transit visas. Others (notably the UK, China, India) require specific nationalities to hold a transit visa even for airside connections.
  - **Landside transit:** Clearing immigration, exiting the secured zone, requiring full entry permission or a transit visa
  - Direct airside transit threshold: if the layover duration is under a specified limit (typically 8-24 hours), many countries permit airside transit without a visa. If the layover exceeds this threshold, the traveler may be routed through immigration.
  - Transit visa fees are often lower than full entry visas but may still require a full application with accommodation proof showing where the traveler is ultimately going

### Step 3: Map Passport Validity Against All Requirements

Passport validity is the most commonly overlooked failure point. Apply these rules systematically:

- **Six-month validity rule (most common):** The destination country requires the passport to remain valid for at least 6 months beyond the last day of the intended stay. Calculate: last day of the trip + 6 months = minimum passport expiry date required. Flag if the user's passport expires before that date.
- **Three-month validity rule (some Schengen countries for non-EU visitors):** Passport must be valid for 3 months beyond the intended departure date from the Schengen area.
- **Duration of stay + 30 days rule (some countries):** Passport must be valid for the entire stay plus an additional 30 days buffer.
- **Blank pages:** Most countries require 1-2 completely blank visa/entry pages. Israeli dual-stamp pages do not count. Pages filled with information pages, declarations, or canceled visas do not count. A passport with 5 pages remaining but none blank adjacent to each other may still be flagged.
- **Passport renewal lead time:** Most governments take 6-10 weeks for standard renewal; 2-4 weeks expedited; same-day emergency services exist but are limited in availability. If renewal is needed, it must appear as the first deadline in the timeline, preceding all visa steps.

### Step 4: Build the Document Checklist with Exact Specifications

Generic checklists cause application failures. Every document must carry its exact specification:

- **Passport:** State exact minimum validity required for this trip (calculated date), and minimum number of blank pages. Note if the passport must be in a certain physical condition (no water damage, torn pages, or delaminated cover -- many immigration officers refuse damaged passports).
- **Passport photographs:** This is the most common cause of e-visa photo rejection. Specify:
  - Dimensions in centimeters or inches (e.g., 3.5 x 4.5 cm, 2x2 inches)
  - Background color (white vs. light gray -- note these are not interchangeable)
  - Face coverage percentage (face must occupy 70-80% of the frame for most systems)
  - Glasses policy (most modern visa photo standards, including U.S., Schengen, and UK, prohibit glasses entirely since 2020-2022 updates)
  - Recency requirement (taken within the last 3-6 months)
  - Digital format for e-visas (JPEG, minimum resolution, maximum file size in KB/MB)
  - Whether colored or black-and-white is accepted
- **Proof of accommodation:** Hotel reservation confirmation with name, dates, and property address. For stays with friends or family, a notarized host invitation letter is typically required in lieu of hotel booking. Some consulates require the reservation be a confirmed booking rather than a tentative hold.
- **Proof of onward/return travel:** Return flight booking in the traveler's name showing departure from the destination. For multi-country itineraries, the onward ticket showing the full journey is sufficient. Note: some travelers buy refundable onward tickets specifically for visa applications -- this is common practice but the ticket must be genuine (not a fake PDF booking).
- **Financial proof:** This is often the most misunderstood document requirement. Key specifics:
  - Bank statements typically required for the last 3-6 months (not just the current balance)
  - Minimum balance thresholds vary by destination: many Schengen states suggest €50-100 per day of stay as a general benchmark; Japan informally expects ¥100,000-200,000 in accessible funds; India visa officers may ask for USD 1,000-3,000 equivalent for 30-day stays
  - Self-employed or freelance travelers may need business bank statements plus a business registration document
  - Sponsored travelers need a sponsorship letter from the sponsor plus the sponsor's financial statements
  - Foreign currency accounts are generally acceptable but must show easy accessibility
- **Travel insurance:** When required, note the minimum medical coverage (€30,000 for Schengen Area entry is mandatory; many non-Schengen countries that recommend insurance accept USD 10,000-50,000 medical coverage). The policy must cover the entire travel period including all destinations. Some countries require repatriation coverage specifically.
- **Purpose-specific documents:**
  - Tourism: hotel bookings and itinerary
  - Business: official company invitation letter on letterhead with signatures, trade show or conference registration confirmation, business card, company ID
  - Family visit: proof of family relationship (birth certificate, marriage certificate), host's residency status in destination country, host's bank statements showing capacity to support the visitor
  - Medical: letter from treating physician in destination country, appointment confirmation, estimated cost of treatment

### Step 5: Calculate the Preparation Timeline with Real Dates

When the user provides a departure date, calculate every deadline by counting backward from that date. Use specific calendar dates, not just "X weeks before departure." Apply these standard windows:

- **D-16 to D-12 weeks (earliest planning):** Check passport validity against calculated minimum expiry. If passport renewal is needed, initiate immediately -- passport renewal takes priority over everything and is the longest lead-time item. Begin researching visa category, official application portal, and required documents list.
- **D-12 to D-10 weeks:** Book consulate appointment if in-person submission is required (appointments at busy consulates can be scarce). Begin compiling documents: bank statements for the required lookback period, photos, accommodation bookings.
- **D-10 to D-8 weeks:** Finalize document compilation. Book accommodation and return flights if not already done (these are required for visa applications -- do not assume you can apply without confirmed bookings). For business visas, request invitation letters from hosts.
- **D-8 to D-6 weeks:** Submit application. For e-visas, apply during this window even if processing is only 3-5 days -- this buffer protects against rejection and reapplication. For consulate visas with standard 15-30 business day processing, submit no later than 8 weeks before departure.
- **D-6 to D-4 weeks:** Track application status using reference numbers provided at submission. If a consulate visa has not arrived by 5 weeks before departure, contact the consulate proactively. Do not make non-refundable accommodation and activity bookings that depend on visa approval until the visa is in hand.
- **D-4 to D-2 weeks:** Receive and verify visa. Check every field: exact name spelling against passport, passport number, visa validity dates, number of entries allowed, permitted stay duration. Any error on a visa sticker requires correction by the consulate before travel.
- **D-1 week:** Make 2 photocopies of the bio-data page and visa page. Store digitally in a cloud-accessible location (email to yourself works). Print the e-visa approval notice if applicable. Download offline copies of booking confirmations.
- **Day of travel:** Carry the original passport with visa, plus one photocopy stored in checked luggage or a separate bag. Carry printed e-visa approval if required. Have all supporting documents (insurance, accommodation, return ticket) accessible in carry-on for border questioning.

### Step 6: Identify Destination-Specific Pitfalls and Rejection Patterns

Generic pitfall lists are unhelpful. Identify pitfalls specific to the destination-passport combination:

- Photo specification mismatches are the leading cause of e-visa system rejections. Name the exact specification error that is most common for this destination's portal.
- Financial documentation insufficiency: some consulates reject applications where bank balances dip below the threshold even once in the statement period, even if the average is sufficient.
- Inconsistency between stated trip purpose and documented itinerary: a 30-day trip to a country with a 2-week tourist visa-free allowance will raise flags at immigration about intent.
- Overstay risk flagging: if the traveler's nationality has high historical overstay rates with the destination country, expect heightened scrutiny and potentially stricter document requirements at the border even if the visa is approved.
- Hotel booking vs. stay duration mismatch: booking 7 nights of accommodation for a 21-day visa application raises questions. The accommodation plan should logically account for the full intended stay.
- Application timing: submitting a consulate visa application too far in advance (more than 3-4 months before travel for most countries) may result in a visa issued with a start date months away that expires before the return trip.

### Step 7: Handle Transit Visa Analysis for Multi-Leg Journeys

For every layover lasting more than 0 minutes in an airport where the traveler could theoretically be diverted through immigration:

- Identify the layover country and layover duration from the itinerary.
- Determine if the traveler's passport nationality requires a transit visa for airside (international zone) transit specifically.
- Look for the Transit Without Visa (TWOV) scheme -- many countries maintain TWOV lists specifying which nationalities are exempt.
- Note any existing visas that exempt transit visa requirements (e.g., a valid U.S. visa or green card typically exempts many nationalities from transit visa requirements in Canada).
- Flag if the connection time is under 2 hours -- missed connection risk is real and if the traveler gets rerouted through a different hub, they could inadvertently enter a country for which they lack transit authorization.
- For overland multi-country trips, every border crossing country must be assessed.

### Step 8: Compile and Deliver the Complete Visa Preparation Package

Assemble all findings into the structured output format defined in the Output Format section. Always end with three critical reminders:
1. Visa requirements change frequently -- the information provided reflects current known requirements but must be verified with the official consular authority of the destination country within 4 weeks of departure.
2. Visa approval is never guaranteed -- a valid visa grants permission to seek entry, not guaranteed entry. Border officers retain discretionary authority.
3. This is a preparation guide, not legal advice. For complex cases (prior denials, dual nationality complications, unusual trip purposes), recommend consulting a licensed immigration attorney or accredited visa specialist.

---

## Output Format

```
## Visa Requirements: [Passport Nationality] Passport -> [Destination Country]

**Trip purpose:** [Tourism | Business | Family visit | Transit]
**Trip duration:** [X] days ([arrival date] to [departure date from destination])
**Departure date from home:** [Date]
**Prepared on:** [Date] -- verify requirements have not changed before applying

---

### Visa Type Determination

| Field                    | Detail                                                  |
|--------------------------|---------------------------------------------------------|
| **Visa category**        | [Visa-free | Visa on arrival | E-visa | Consulate visa] |
| **Maximum stay**         | [X] days per entry                                      |
| **Entry type**           | [Single entry | Multiple entry]                         |
| **Visa fee**             | [Amount and currency, or "None"]                        |
| **Processing time**      | [X-Y business days (standard) | [X] business days (expedited)] |
| **Application method**   | [Online portal | In-person at consulate | On arrival]   |
| **Permitted entry ports**| [All ports | Specific airports/border crossings listed] |

> **Disclaimer:** Visa regulations change without notice. All details below must be verified with
> the official consular authority or immigration ministry of [Destination Country] before submitting
> an application. This checklist is a preparation guide, not legal advice, and does not guarantee
> visa approval or entry.

---

### Passport Validity Check

| Requirement              | Required Value                    | Your Situation                |
|--------------------------|-----------------------------------|-------------------------------|
| Minimum validity at entry| Valid until at least [date]       | [Flag if close or insufficient]|
| Blank pages required     | [X] blank pages                   | [Note requirement]            |
| Physical condition       | No damage, tears, or delamination | [Note]                        |

[If passport renewal is needed, bold this block:]
**ACTION REQUIRED IMMEDIATELY: Passport expires [date], which is less than [X] months after
your last travel date. Initiate passport renewal before any visa steps. Standard renewal:
6-10 weeks. Expedited: 2-4 weeks. Emergency same-day services available at limited
passport offices.**

---

### Document Checklist

| # | Document | Required | Specification | Status |
|---|----------|----------|---------------|--------|
| 1 | Passport (original) | Yes | Valid until [minimum date], [X] blank pages, undamaged | [ ] |
| 2 | Passport photo -- [digital/print] | Yes | [W x H cm or inches], [background color], no glasses, face [70-80%] of frame, taken within [X] months, [JPEG/PNG if digital, max [X] KB] | [ ] |
| 3 | Visa application form | Yes | [Online at official portal / Paper form from consulate], completed in [language], signed | [ ] |
| 4 | Proof of accommodation -- all nights | Yes | [Hotel booking confirmation with property name, address, traveler name, and stay dates / Host invitation letter notarized] | [ ] |
| 5 | Return or onward flight | Yes | Confirmed booking in traveler's name showing departure from [destination] on [approximate date] | [ ] |
| 6 | Proof of financial means | [Yes / Recommended] | Bank statements covering [last X months], showing minimum balance of [amount or daily threshold x days of stay], in traveler's name | [ ] |
| 7 | Travel insurance | [Mandatory / Recommended] | Covers [start date] to [end date], minimum medical coverage [amount], includes [destination country], repatriation coverage [if required] | [ ] |
| 8 | [Invitation letter -- business] | [If applicable] | On company letterhead, signed by host company representative, stating purpose of visit, duration, and financial responsibility | [ ] |
| 9 | [Proof of employment / enrollment] | [If required] | Employer letter confirming employment status, salary, and approved leave -- or business registration for self-employed applicants | [ ] |
| 10| [Vaccination records] | [If required] | [Specific vaccine(s)] administered [at least X days before travel], recorded on [yellow card / digital certificate] | [ ] |
| 11| [Additional document specific to destination] | [Yes/No/If applicable] | [Exact specification] | [ ] |

---

### Preparation Timeline

| Deadline | Weeks Before Departure | Action | Status |
|----------|------------------------|--------|--------|
| [Date]   | 16 weeks               | Verify passport validity against required minimum date of [calculated date]. If renewal needed, begin immediately. | [ ] |
| [Date]   | 12 weeks               | Book consulate appointment (if required). Begin compiling bank statements for last [X] months. | [ ] |
| [Date]   | 10 weeks               | Confirm accommodation bookings and return flight. Take passport photo (print and/or digital per requirements). Request invitation or host letters. | [ ] |
| [Date]   | 8 weeks                | Complete and submit visa application [online / at consulate]. Retain submission receipt and reference number. | [ ] |
| [Date]   | 6 weeks                | Follow up on application status if no update received. Do not make non-refundable bookings dependent on visa approval until visa is confirmed. | [ ] |
| [Date]   | 4 weeks                | Receive and inspect visa: verify name matches passport exactly, check valid dates, entry count, and permitted stay duration. | [ ] |
| [Date]   | 2 weeks                | Re-verify any entry requirements that may have changed (health declarations, customs forms, currency limits). | [ ] |
| [Date]   | 1 week                 | Print 2 copies of all documents. Scan and email to yourself. Print e-visa approval notice (if applicable). Download offline booking confirmations. | [ ] |
| [Date]   | Day of travel          | Carry: original passport + visa, 1 printed document set in carry-on, 1 set in checked luggage. Have insurance card, accommodation address, and return ticket accessible for border officers. | [ ] |

---

### Fee Summary

| Fee | Amount | Currency | Payment Method | Notes |
|-----|--------|----------|----------------|-------|
| Visa application fee | [Amount] | [Currency] | [Credit card / Bank transfer / Cash on arrival] | [If multiple entry costs more, note] |
| Expedited processing (optional) | [Amount] | [Currency] | [Method] | [Optional -- only if needed] |
| Consulate service fee | [Amount] | [Currency] | [Method] | [If consulate charges separately from visa fee] |
| Passport photo | [Estimate] | [Currency] | [Photo shop / Self-print] | [If self-taken digital, minimal cost] |
| Travel insurance | [Estimate] | [Currency] | [Credit card] | [Varies widely by provider and coverage] |
| **Total estimated visa costs** | **[Amount]** | | | |

---

### Common Pitfalls and Rejection Patterns

1. **[Specific pitfall]:** [What goes wrong, why it matters, and exactly how to avoid it]
2. **[Specific pitfall]:** [What goes wrong, why it matters, and exactly how to avoid it]
3. **[Specific pitfall]:** [What goes wrong, why it matters, and exactly how to avoid it]
4. **[Specific pitfall]:** [What goes wrong, why it matters, and exactly how to avoid it -- add more as relevant]

---

### Transit Visa Requirements

| Layover Country | Airport | Layover Duration | Transit Visa Required | Exemption Conditions | Action Required |
|-----------------|---------|------------------|-----------------------|----------------------|-----------------|
| [Country]       | [Airport code] | [X hours]  | [Yes / No / Depends on duration] | [TWOV permitted for [passport nationality] if airside under [X hours] / Valid [US/UK/Schengen] visa exempts] | [None needed / Apply for transit visa / Ensure airside connection] |

---

### Additional Entry Requirements at Destination

| Requirement | Details |
|-------------|---------|
| Arrival card / Entry declaration | [Required or not; paper form or electronic pre-registration] |
| Customs declaration | [Currency limits, prohibited items to declare] |
| Health entry requirements | [Vaccinations, health declarations, medical insurance verification at border] |
| Registration after arrival | [Required within X days at local police/immigration office for stays over X days] |
| Currency rules | [Any restrictions on foreign currency import/export amounts] |
```

---

## Rules

1. **Never provide a visa determination without the passport nationality** -- the same destination country may be visa-free for one passport and require a full consulate visa for another. If the user has not stated their passport country, ask before proceeding.

2. **Always calculate and state specific calendar dates** in the timeline when the user provides a departure date. Dates like "8 weeks before departure" are insufficient -- convert them to actual dates (e.g., "January 15"). Count backward precisely.

3. **Always include the disclaimer that visa requirements change frequently** and must be verified with the official consular authority of the destination country. This disclaimer must appear prominently at the top of the Visa Type Determination section, not buried at the end of the document.

4. **Never guarantee visa approval or entry.** A visa is permission to seek entry -- it is not a right of entry. Border officers retain discretionary authority to deny entry even to holders of valid visas. Include this caveat in every output.

5. **Always check passport validity before any other document on the checklist.** If the passport does not meet the minimum validity requirement for the destination (most commonly 6 months beyond the last travel date), flag passport renewal as the first and highest-priority action item, before any visa steps begin.

6. **Passport photos are the leading cause of e-visa rejection.** Always state the exact dimensions, background color, face coverage percentage, glasses policy, recency requirement, and (for digital submissions) file format and maximum file size. Do not use vague descriptions like "recent photo with white background."

7. **Never advise the user to misrepresent their trip purpose, financial status, intended duration of stay, or any other application detail.** Misrepresentation on a visa application is a criminal offense in most jurisdictions and can result in multi-year or permanent bans on re-entry.

8. **If the user mentions a prior visa denial or overstay, treat this as a high-risk flag.** Most visa applications require disclosure of prior denials. Some countries (particularly the U.S., Canada, UK, Australia, and Schengen states) share denial and overstay data through bilateral intelligence-sharing agreements. Recommend full disclosure on the application and suggest consulting a licensed immigration specialist before applying.

9. **Always include a transit visa analysis for every itinerary with a layover in a third country.** Do not assume transit is visa-free. Specific nationalities require transit visas for airside connections in the UK, Canada, China, India, and several other countries -- failure to have these results in being offloaded at the departure airport.

10. **For multi-destination trips, create a separate visa section for each destination country** in itinerary order. Build a single combined timeline that identifies the critical path -- the application with the longest processing time determines the earliest possible application submission date for the overall trip.

11. **Distinguish clearly between mandatory requirements and recommended preparations.** Travel insurance is mandatory for Schengen entry but only recommended for many other destinations. Proof of financial means is required for consulate visa applications in most countries but not typically checked for visa-free entry. Blurring mandatory vs. recommended wastes the traveler's effort and creates confusion.

12. **Flag business vs. tourism activity limits clearly.** For business travelers using tourist visas or visa-free entry, specify which activities are permitted (attending meetings, conferences, scouting partnerships) vs. activities that require a business visa (signing contracts, receiving payment, providing services in the country). This line varies by country and is frequently misunderstood.

---

## Edge Cases

### Dual Citizenship and Multiple Passports
When the user holds two or more passports, the analysis must compare the entry conditions for each passport and recommend the one that provides the easiest entry -- or note if one passport actually creates complications at the destination. Specific considerations:
- Some countries (notably Israel, Iran, Cuba, and a handful of others) create secondary screening complications due to entry stamps or prior visas visible in a second passport. If the user holds a passport with stamps from a country that is politically sensitive at the destination, advise them to use the other passport for this trip if visa conditions allow.
- Countries like the United Arab Emirates, Saudi Arabia, Kuwait, Libya, and some others maintain entry restrictions for passports bearing Israeli entry stamps.
- Some countries require entry on the passport that matches the citizenship of the traveler's nationality -- for example, many countries with reciprocal visa agreements require entry on the nationality passport rather than a second passport held through naturalization.
- If the user holds a refugee travel document or stateless person travel document (not a conventional passport), standard visa-free agreements typically do not apply -- each country must be researched individually.

### Multi-Destination Trip (Multiple Countries in Sequence)
Create a separate visa section for each country in travel order. Then:
- Build a unified document checklist that flags which documents are shared across applications vs. destination-specific.
- Identify the critical path: the application with the longest processing time determines the overall planning timeline. If Country A requires a consulate visa with 6-week processing and Country B allows a 3-day e-visa, the timeline must be built around Country A.
- Check for cumulative stay limits: the Schengen Area's 90-in-180-day rule applies across all 27 Schengen member states combined, not per country. A traveler spending 30 days in France and 30 days in Germany in the same 180-day window has used 60 of their 90 permitted days.
- Some countries check for proof of visa to the next destination on entry -- particularly when exiting overland to a country known for strict entry requirements.

### Last-Minute Travel (Departure Within 4 Weeks)
This scenario requires an immediate triage approach:
- First, identify whether a consulate visa with standard 4-8 week processing is required. If so, present this as a serious risk factor that may make the trip impossible without expedited or emergency processing.
- Expedited processing options: many consulates offer paid expedited processing that reduces timelines to 5-10 business days. Emergency same-day or 72-hour processing exists at some consulates but is typically limited to genuine emergencies (medical, funeral, government business) rather than leisure travel.
- For e-visas and visas on arrival, last-minute travel is generally feasible -- 3-5 business day e-visa processing still fits a 4-week window with margin.
- Flag the document gathering risk: bank statements for the past 3-6 months, invitation letters, and employer letters may each take 3-10 business days to obtain. List these first and advise the user to begin immediately.
- If the trip is not feasible without a visa that cannot be obtained in time, say so clearly rather than providing false hope.

### Prior Visa Denial or Immigration Violation
Handle this case with particular care:
- Most visa applications include a question asking whether the applicant has ever been denied a visa, entry, or had an immigration violation (overstay, deportation, removal). These questions must be answered truthfully -- providing false information typically results in permanent inadmissibility.
- Visa denials are shared between the U.S., Canada, UK, Australia, and New Zealand (Five Eyes immigration cooperation) and increasingly between EU member states. A denial at one consulate may influence decisions at others.
- A prior denial does not automatically mean the next application will be denied, particularly if the reason for the original denial has been resolved (e.g., insufficient financial proof that has since improved).
- Recommend consulting a licensed immigration attorney or accredited visa specialist before submitting the next application. In the output, include a note that this checklist provides general preparation guidance only and that prior denial cases warrant professional review.
- If the prior violation was a deportation or removal order, entry may be permanently barred or require a formal waiver application -- far beyond the scope of this skill. Redirect clearly to an immigration attorney.

### Countries with Frequently Changing or Inconsistently Applied Visa Policies
Some destinations have visa policies that change frequently due to diplomatic shifts, reciprocity measures, or political conditions. Additionally, some countries' policies are technically clear on paper but inconsistently applied at ports of entry. Handle this by:
- Dating all information explicitly in the output ("information current as of [date]") and recommending verification within 2 weeks of travel.
- Identifying the most reliable official verification channel: the destination country's immigration ministry or foreign affairs ministry website, or the traveler's own government's travel advisory page (which typically includes entry requirement summaries).
- Noting if the destination has a known history of on-the-ground inconsistency: some countries have formal visa-free access but immigration officers at smaller border posts may not be familiar with the rules, causing unnecessary complications for overland travelers.

### Cruise or Organized Tour Entry (Not Standard Airport Arrival)
Cruise passengers and organized tour groups often have different entry rules than independent travelers:
- Many countries have specific "cruise visitor" categories that permit passport holders to go ashore for the day without a visa, even if a standard tourist visa would be required for air arrivals. This is common in Cuba, several Caribbean nations, and some island destinations.
- Organized tour groups sometimes enter under a group visa issued to the tour operator rather than individual visas. The individual traveler in this case does not hold a personal visa -- the group leader does, and separation from the group may void the entry authorization.
- Overland travelers entering by land border may face different rules than air arrivals, including different maximum stay durations, different document checks, and (in some cases) restricted crossings that are only available to residents of border regions.

### Traveler with Medical Conditions Requiring Medication or Medical Equipment
While not a visa issue per se, this frequently arises alongside visa preparation and should be noted:
- Controlled substances (certain painkillers, psychiatric medications, ADHD medications) are illegal to import in some countries even with a valid prescription. Some countries (Japan is a well-known example) prohibit common over-the-counter medications in the U.S. and Europe.
- Medical equipment (syringes, insulin pens, CPAP machines) may require a doctor's letter for border clearance.
- This is a customs and entry requirement that belongs in the "Additional Entry Requirements" section, not the visa section, but should be flagged when relevant.

---

## Example

**User input:** "I have a British passport and I'm planning a 3-week trip to India for tourism. I fly out on April 10. My layover on the way is in Dubai for about 4 hours."

---

## Visa Requirements: United Kingdom Passport -> India

**Trip purpose:** Tourism
**Trip duration:** 21 days
**Departure date from home:** April 10
**Prepared on:** [Current date] -- verify requirements have not changed before applying

---

### Visa Type Determination

| Field | Detail |
|-------|--------|
| **Visa category** | E-visa (India e-Tourist Visa -- eTV) |
| **Maximum stay** | 90 days per visit (180 days total per calendar year across all e-Tourist Visa entries) |
| **Entry type** | Double entry available under 90-day eTV; single entry under 30-day eTV |
| **Visa fee** | Approximately $25 USD (fees subject to change; payable by credit/debit card on the official India e-visa portal) |
| **Processing time** | 3-5 business days (standard); apply at least 4 days and no more than 120 days before arrival |
| **Application method** | Online via the Indian government's official e-Visa portal (indianvisaonline.gov.in) |
| **Permitted entry ports** | Designated e-visa ports only -- all major international airports including Delhi (DEL), Mumbai (BOM), Bangalore (BLR), Chennai (MAA), Kolkata (CCU), Hyderabad (HYD), and Kochi (COK) are designated. Verify your specific entry airport is on the current list before applying. |

> **Disclaimer:** India's visa regulations and fee structures change without notice. All details must be verified with the Indian High Commission in the UK or the official Indian e-Visa portal before submitting your application. This checklist is a research preparation guide only and does not constitute legal advice or guarantee visa approval or entry.

---

### Passport Validity Check

| Requirement | Required Value | Action |
|-------------|----------------|--------|
| Minimum validity at entry | Valid until at least July 10 (6 months beyond April 10 entry date) | Verify your passport expiry date. If it expires before July 10, renew before proceeding. |
| Blank pages required | Minimum 2 blank pages for entry stamps | Check your remaining blank visa/entry pages |
| Physical condition | No damage, water stains, torn pages, or delaminated cover | Inspect passport -- damaged passports are routinely refused at Indian immigration |

---

### Document Checklist

| # | Document | Required | Specification | Status |
|---|----------|----------|---------------|--------|
| 1 | Passport (original) | Yes | Valid until at least October 10 (6 months beyond last day of stay, April 30), minimum 2 blank pages, physically undamaged | [ ] |
| 2 | Digital passport photo | Yes | 10 x 10 cm square crop, white background only (not off-white or cream), no glasses, face 80% of frame, taken within 6 months, JPEG format, file size between 10 KB and 1 MB | [ ] |
| 3 | Scanned bio-data page of passport | Yes | JPEG or PDF, file size between 10 KB and 1 MB, all text clearly legible | [ ] |
| 4 | E-visa application form | Yes | Completed entirely online at official India e-Visa portal; do not use third-party sites (they charge extra service fees on top of the official fee without providing faster service) | [ ] |
| 5 | Proof of accommodation -- full trip | Yes | Hotel booking confirmations covering all 21 nights, showing property name and address in India, traveler's name, and stay dates. For stays with contacts, a host invitation letter is required. | [ ] |
| 6 | Return or onward flight | Yes | Confirmed booking in your name showing departure from India on or before May 1 (within 21-day stay window) | [ ] |
| 7 | Financial proof | Recommended (not mandatory for e-visa submission but may be requested at border) | Bank statements for the last 3 months showing consistent balance; unofficial threshold is GBP 50-100 equivalent per day of stay (approximately GBP 1,050-2,100 for 21 days). Carry these to the airport even if not formally submitted with the e-visa. | [ ] |
| 8 | Travel insurance | Strongly recommended | Covers April 10 to May 1, minimum USD 50,000 medical coverage recommended (not mandated but advisable for India given healthcare costs for visitors), includes medical evacuation/repatriation | [ ] |
| 9 | Yellow fever vaccination certificate | Conditional | Required only if you have been in a yellow fever-endemic country in the 6 days before arrival in India. Not required for direct travel from the UK. | [ ] |

---

### Preparation Timeline

| Deadline | Weeks Before Departure | Action | Status |
|----------|------------------------|--------|--------|
| January 12 | 13 weeks | Verify passport validity -- must be valid past October 10. Count blank pages. If renewal needed, initiate immediately: UK standard renewal is approximately 10 weeks. | [ ] |
| February 2 | 9 weeks | Confirm accommodation bookings and return flight. These are required for the e-visa application. | [ ] |
| February 16 | 8 weeks | Take and prepare digital passport photo: 10x10 cm square, white background, no glasses, JPEG under 1 MB. Scan bio-data page of passport. | [ ] |
| March 1 | 6 weeks | Submit e-visa application on official India e-Visa portal. Pay the $25 fee by credit card. Note: the portal can have technical issues -- attempt during off-peak hours. Save the application reference number immediately. | [ ] |
| March 6 | Approx. 5 days after submission | Expected e-visa approval email arrives. Check spam folder. Open and verify: name matches passport exactly (including middle names), passport number is correct, visa validity dates bracket your stay, entry count (double entry selected), and designated airport of arrival is listed. | [ ] |
| March 10 | 4 weeks | Print e-visa approval notice -- 2 printed copies. Indian immigration requires a printed copy; a phone screen is not reliably accepted at all Indian airports. | [ ] |
| March 27 | 2 weeks | Re-verify that your arrival airport is still on the designated e-visa ports list. Check UK government India travel advisory for any updated entry requirements. | [ ] |
| April 3 | 1 week | Print all documents: e-visa (2 copies), hotel confirmations, return flight, travel insurance certificate. Email scanned copies to yourself. Download offline copies to your phone. | [ ] |
| April 10 | Travel day | Carry-on: original passport, printed e-visa, return flight booking, hotel confirmations, insurance card, and approximate GBP cash or card for any incidentals. Checked luggage: 1 copy of all documents. At check-in desk, airline will verify your e-visa before boarding. | [ ] |

---

### Fee Summary

| Fee | Amount | Currency | Payment Method | Notes |
|-----|--------|----------|----------------|-------|
| India e-Tourist Visa fee | ~$25 | USD | Credit/debit card (online) | Fee set by Indian government, payable on official portal only |
| Third-party service fee | $0 | -- | N/A | Apply on the official portal only; third-party sites charge $30-80 extra for no added value |
| Digital passport photo preparation | GBP 5-15 | GBP | Photo shop or self-prepared | If self-prepared, use a photo editing tool to achieve the exact 10x10 cm square crop on white background |
| Travel insurance | GBP 30-80 | GBP | Credit card | Estimate for 21-day trip for UK resident; varies by provider, age, and coverage level |
| **Total estimated visa-related costs** | **~GBP 40-95** | | | |

---

### Common Pitfalls and Rejection Patterns

1. **Non-square photo format:** India's e-visa portal requires a square photo (10x10 cm) while many online photo tools default to the standard 3.5x4.5 cm passport photo format. Submitting a non-square or incorrectly cropped photo is the most common reason for portal rejection at the photo upload step. Use a photo editing tool to crop to a perfect square before uploading.

2. **Third-party website applications:** A large number of commercial websites mimic the look of the official Indian e-visa portal and charge GBP 50-120 to submit an application that could be submitted for $25 directly. These sites are not affiliated with the Indian government and offer no processing advantages. Always apply directly through the official government portal.

3. **Printing the e-visa:** British travelers frequently assume that showing the e-visa on a phone is sufficient at Indian immigration. While policies evolve, Indian immigration counters at most airports formally require a printed copy. Carry 2 printed copies. If you lose one, the second is in your checked bag.

4. **Middle name omissions:** The India e-visa application asks for your name exactly as it appears on your passport -- including any middle names. If your passport shows "James Edward Thornton" and you enter "James Thornton" on the application, the name mismatch can cause problems at immigration even if the passport number is correct. Copy your name character by character from your passport bio-data page.

5. **Arrival airport not on designated list:** India's e-visa is only valid for entry at officially designated e-visa airports. If your itinerary involves arriving at a smaller regional airport as an initial entry point, that airport may not be on the list. Verify your specific arrival airport is designated before applying. If it is not, you must apply for a conventional consulate visa instead.

---

### Transit Visa Requirements

| Layover Country | Airport | Layover Duration | Transit Visa Required | Exemption Conditions | Action Required |
|-----------------|---------|------------------|-----------------------|----------------------|-----------------|
| United Arab Emirates (Dubai) | Dubai International (DXB) | Approximately 4 hours | No | UK passport holders receive visa-free access to the UAE for up to 90 days per visit. Airside transit is always permitted without any visa. Landside transit (exiting to the terminal's public areas and shops, which are landside at DXB) also requires no visa for UK passport holders. | None required. No transit visa, no application needed. If your layover extends unexpectedly beyond 24 hours, you may exit the airport freely on your UK passport. |

---

### Additional Entry Requirements at Destination (India)

| Requirement | Details |
|-------------|---------|
| Arrival registration card | Completed on the aircraft before landing; airline will distribute the form. Keep the departure stub -- immigration may ask for it when you leave. |
| Customs declaration | Declare foreign currency in excess of USD 10,000 equivalent. Declare dutiable goods above the personal exemption threshold. |
| Health entry requirements | No mandatory vaccinations for direct arrival from the UK. Yellow fever certificate required if arriving within 6 days of being in an endemic country. Hepatitis A, Typhoid, and Tetanus vaccinations are strongly recommended by UK travel health services but are not border requirements. |
| Registration after arrival | Foreigners staying more than 180 days must register with the Foreigners Regional Registration Office (FRRO). For a 21-day tourist stay, no registration is required. |
| Currency rules | No restriction on foreign currency you can carry in, but amounts over USD 10,000 equivalent must be declared. Indian rupees may not be exported in amounts exceeding INR 25,000. |
