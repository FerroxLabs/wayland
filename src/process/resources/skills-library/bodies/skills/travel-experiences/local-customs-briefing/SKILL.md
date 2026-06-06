---
name: local-customs-briefing
description: |
  Creates a customs, etiquette, tipping, and taboo reference card for a
  travel destination. Gathers the destination country or region and produces
  a structured quick-reference guide covering greetings, dining etiquette,
  dress codes, tipping norms, common taboos, and useful local phrases.
  Use when the user asks about local customs at a destination, tipping
  culture in another country, cultural etiquette for travel, or what not
  to do in a specific country.
  Do NOT use for visa or entry requirements (use visa-requirements-checker),
  trip itinerary building (use trip-itinerary-builder), or general cultural
  anthropology research.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel research guide checklist"
  category: "travel-experiences"
  subcategory: "trip-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Local Customs Briefing

## When to Use

**Use this skill when:**
- A user asks what to expect culturally at a specific travel destination -- greetings, table manners, dress norms, or social rules they are unfamiliar with
- A user asks directly about tipping culture: amounts, who to tip, when tipping is offensive, or how to handle the bill in another country
- A user asks "what NOT to do" or "what is rude" in a specific country, region, or cultural context
- A user is visiting a religious site (temple, mosque, shrine, church, synagogue) and needs guidance on appropriate conduct and dress
- A user is attending a culturally specific event -- a local festival, a traditional wedding, a funeral, a home-cooked meal at a local's house -- and wants to participate respectfully
- A user specifically requests a "cheat sheet," "quick guide," or "reference card" for customs at their destination
- A user asks about specific gestures, phrases, or behaviors they have heard about and want to understand before traveling
- A user is a first-time visitor to a destination with customs that differ significantly from their home culture and expresses concern about making mistakes

**Do NOT use when:**
- The user needs visa or entry requirements, passport validity rules, or border crossing logistics -- use `visa-requirements-checker`
- The user wants a day-by-day itinerary, route planning, or attraction scheduling -- use `trip-itinerary-builder`
- The user is preparing for business negotiations, formal presentations, or professional relationship building in another culture -- use a dedicated business-culture skill with deeper hierarchy, negotiation, and meeting protocol coverage
- The user wants to learn a foreign language at any meaningful depth -- this skill covers survival phrases only; use a language-learning skill for vocabulary building, grammar, or conversational fluency
- The user asks a general anthropology, sociology, or cultural history question about a society that is not tied to an imminent trip or travel behavior
- The user needs medical or health customs for travel (food safety, vaccination norms, pharmacy access) -- use a travel-health skill
- The user's question is purely about local laws, crime, or safety zones -- use a travel-safety skill, though safety-relevant customs (legal dress codes, photography restrictions with criminal penalties) should be noted here with a "Legal requirement" flag

---

## Process

### Step 1: Gather Destination and Trip Context

Before producing the reference card, ask the user for the following if not already stated:

- **Exact destination:** Country, region, and specific cities. Cultural norms frequently differ between urban centers and rural areas, between the capital and tourist-heavy zones, and between provinces with different ethnic or religious majorities. Japan's Tokyo vs. Okinawa, Indonesia's Bali vs. Java, and India's Rajasthan vs. Karnataka are not culturally interchangeable.
- **Trip type:** Pure tourism, visiting family or friends, attending an event (wedding, festival, religious pilgrimage), or a trip mixing leisure and work. Trip type determines which sections to weight most heavily.
- **Duration:** A 4-day trip needs a concise "survive and respect" card. A 3-week immersive visit warrants deeper guidance on recurring social situations.
- **Specific concerns:** Ask whether the user has any particular anxiety -- about tipping, about religious sites, about dietary restrictions affecting how they interact with food offers, or about their identity (LGBTQ+ travelers, travelers with visible religious symbols, travelers from a country that has political tension with the destination).
- **Cultural baseline:** Knowing the user's own cultural background helps calibrate what to highlight. A U.S. traveler visiting France needs guidance on the cheek-kiss greeting; a Brazilian traveler visiting France already understands that norm.

If the user provides enough context inline (e.g., "I am visiting Thailand for 10 days, mostly beach areas and some temple visits"), proceed directly without interrogating them. Only ask clarifying questions if the destination is ambiguous or if trip type would substantially change the output.

---

### Step 2: Assess the Cultural Complexity Profile of the Destination

Before writing the card, internally classify the destination across four dimensions:

- **Formality gradient:** High-formality cultures (Japan, South Korea, Germany, UAE) require more granular guidance on titles, greeting sequences, and deference to elders or hosts. Low-formality cultures (Australia, Netherlands, Brazil) still have taboos but fewer hierarchical rituals.
- **Religious influence on daily life:** Destinations where religious practice shapes public behavior (Saudi Arabia, Iran, Indonesia, India, Israel) need prominent sections on dress requirements, prayer time awareness, food restrictions, and gender interaction norms. Distinguish between cultures where religion is omnipresent in public life vs. cultures where it is primarily private.
- **Tipping economy type:** Countries fall into one of four tipping models -- (a) expected and percentage-based (U.S., Canada, Mexico), (b) appreciated but not obligatory (UK, Australia, most of Western Europe), (c) rounding-based and informal (much of Central Europe, Southeast Asia), or (d) not customary or actively offensive (Japan, South Korea, Iceland, Switzerland). Identifying the model determines how to frame the tipping section.
- **Taboo density:** Some destinations have a small number of high-stakes taboos with serious consequences (Singapore's anti-littering laws, Thailand's lèse-majesté laws regarding the monarchy). Others have many informal social norms with low individual stakes but cumulative respect value. Both need coverage but with different urgency framing.

---

### Step 3: Research and Structure Greeting and Interaction Norms

Cover the following with specificity -- never generalize with "people are friendly":

- **Physical greeting form:** Handshake (firm vs. limp, duration), bow (angle and context -- 15 degrees casual, 30 degrees respectful, 45 degrees formal apology in Japan), cheek kiss (how many, which side first, whether to actually touch the cheek or kiss the air), hands pressed together (wai in Thailand, namaste in India), nose press (hongi in Māori greeting), no physical contact (many conservative Muslim-majority cultures between men and women who are not family).
- **Gender-differentiated greetings:** In many cultures, greeting norms differ by the gender combination. A man greeting a woman may follow different rules than a woman greeting a woman. State these explicitly. In Gulf Arab countries, many men will not extend a hand to a woman they do not know -- the woman initiates if she wishes. In France, cheek kisses occur between women and between a man and a woman, but handshakes or back-patting are more common between men.
- **Title and name use:** First-name basis vs. title-plus-surname (Mr., Ms., Dr., or local equivalents). Note when and how a local signals it is acceptable to use their first name. In Germany, this transition (the "du vs. Sie" boundary) is explicit and significant.
- **Personal space norms:** Research-backed proxemics vary significantly. Northern Europeans and East Asians generally prefer larger personal space bubbles (70-120 cm conversational distance). Latin American, Middle Eastern, and Southern European cultures often stand closer (40-60 cm). State the practical implication: "Standing further away than locals expect may read as cold; standing closer than they expect may feel intrusive."
- **Eye contact calibration:** In the U.S. and much of Western Europe, sustained eye contact signals confidence and trustworthiness. In Japan, South Korea, and many African cultures, prolonged eye contact with authority figures is seen as challenging or disrespectful. In many Middle Eastern cultures, men maintain strong eye contact with men but avoid it with women who are not family.
- **Gift-giving at homes:** Whether a gift is expected, what is appropriate to bring, how many times to refuse before accepting (in Chinese, Korean, and Japanese culture, the first refusal is polite and not genuine), whether to open the gift immediately or set it aside, and what categories of gifts are taboo (clocks in China symbolize death; knives in many cultures symbolize cutting the relationship; flowers in Germany have specific count rules -- odd numbers for gifts, even numbers for funerals).

---

### Step 4: Research Dining Etiquette in Full

Dining is where tourists make the most culturally visible mistakes. Cover these elements:

- **Meal times by country:** Do not assume Western meal timing universally. Spain and Argentina eat dinner at 21:00-23:00. Japan and Germany eat dinner by 19:00. In Ethiopia, coffee ceremonies follow meals and can last 45 minutes -- leaving early is an insult. Morocco's long, multi-course family meals have a communal rhythm that tourists often rush.
- **Utensil rules and hand use:** Which hand is used and why matters. In many South Asian, Middle Eastern, and North African cultures, the right hand is for eating and the left hand is for bathroom hygiene -- offering food or touching communal dishes with the left hand is a significant transgression. Chopstick etiquette has multiple country-specific variations: in China, resting chopsticks parallel across the bowl signals you are finished; in Japan, sticking them upright in rice evokes funeral incense offerings.
- **Communal dish protocols:** In Middle Eastern, Ethiopian, and many Asian family-style meals, dishes are shared from central plates. Rules include: serve yourself from the portion in front of you (not reaching across), use the serving utensil (not your personal chopsticks or fork) to take food, and wait for the host to begin or signal.
- **Toasting and alcohol norms:** In Russia and Eastern Europe, toasting is a performance -- short speeches before each drink, maintaining eye contact during the clink, not clinking over someone's hand. In South Korea, never pour your own drink -- always pour for others and wait for someone to pour for you. In Muslim-majority destinations, alcohol may be unavailable, or available only in tourist areas, international hotels, or non-Muslim-licensed establishments.
- **Host dynamics:** In many cultures, the host refusing to let you pay for the meal is not a negotiation -- it is a definitive social act. In Iran, "ta'arof" means the first two or three refusals of an offer (a meal, a gift, money) are performative and should be gently declined in return; on the third offer, it is acceptable to accept. Understanding when "no" means "no" and when it is a ritual exchange prevents offense in both directions.
- **Table manners specific to the destination:** Finishing your plate completely signals "I am satisfied" in some cultures and "You did not give me enough" in others. Belching indicates satisfaction in some cultures (parts of China, Middle East) and is rude in others. Slurping is polite in Japan and rude in France.

---

### Step 5: Build the Tipping Guide with Exact Amounts

Tipping guidance must be actionable, not vague. Use the four-model framework from Step 2 to frame the section:

- **Model A (expected, percentage-based):** State the standard percentage, the high-end courtesy percentage, and what a low or no-tip signals. In the U.S., 18% is baseline, 20-22% is standard for good service, and 15% is considered low. In Canada and Mexico, similar percentages apply but delivery norms differ slightly.
- **Model B (appreciated, not obligatory):** State that tipping is not a structural part of server income, but a common courtesy. Provide a range (5-10%, or "round up to the nearest 5"). Note whether you leave cash on the table or hand it directly.
- **Model C (rounding-based):** Explain the rounding convention -- in Southeast Asia and much of Central Europe, rounding up to the nearest whole amount or leaving small coins is common in casual settings. Tour guides at cultural sites typically expect 2-5 USD equivalent per person. State amounts in local currency equivalents where helpful.
- **Model D (not customary or offensive):** Be direct and clear. Explain WHY it is not customary -- server wages in Japan and Iceland reflect full compensation; in South Korea, tipping in a non-tourist restaurant can confuse and embarrass staff. Note exceptions: international airport hotels, high-end tourist-facing establishments in cities, and tour operators catering to Western tourists where tipping has been adopted as a norm.

For each destination, provide specific figures for at least six categories:
1. Sit-down restaurant -- lunch vs. dinner if different
2. Taxi and rideshare
3. Hotel bellhop (per bag, per service)
4. Hotel housekeeping (per night or per stay)
5. Tour guides (half-day vs. full-day)
6. Bars and cafes
7. Spa, salon, and wellness services (often tipped at different rates than dining)

---

### Step 6: Research Dress Code Requirements by Context

Separate "legally required" from "culturally expected" from "practically advisable":

- **Legal requirements:** In Saudi Arabia and Iran, women are legally required to cover their hair in public. In some parts of Indonesia (Aceh province), Sharia dress codes carry legal penalties. In parts of Southeast Asia, disrespecting dress codes at sacred sites can result in fines or being refused entry. Label these explicitly with **[Legal requirement]**.
- **Religious site specifics:** Mosques require shoes removed, shoulders and knees covered, and women often need head coverings (scarves are often provided at entrances but bringing your own is more reliable). Hindu temples vary -- some require bare feet on the entire compound, not just the inner sanctum. Buddhist temples in Southeast Asia require covered shoulders and knees for both men and women. Jewish synagogues (for Orthodox congregations) require men to cover their heads (kippot often provided) and often separate seating. Churches in Southern Europe increasingly enforce no bare shoulders or short-shorts policies with signage.
- **Beach and swimming culture:** Northern Europe (Germany, Netherlands, Scandinavia) has common nudist beach areas; topless sunbathing is normalized in much of Southern Europe. In contrast, in Muslim-majority coastal destinations (Morocco, Egypt, Turkey's more conservative coastal towns) modest swimwear is appreciated or required outside of international resort enclaves. In Japan, tattoos -- not swimwear -- are the primary beach concern.
- **Urban vs. rural contrast:** In most developing-world destinations, the capital and tourist zones have relaxed dress norms compared to provincial towns and rural areas. A tourist wearing shorts in Marrakech's Djemaa el-Fna square will get unwanted attention; wearing the same shorts at a Casablanca shopping mall is unremarkable. Note these differentials.
- **Colors and symbolism:** White is the color of mourning in many South and East Asian cultures. Wearing white to a wedding in India or China can be jarring. In some West African cultures, colors carry specific ethnic or ceremonial meanings. These are lower-stakes than dress coverage rules but worth noting.

---

### Step 7: Compile Taboos and Common Tourist Mistakes

Every taboo entry must follow the three-part structure: **what the behavior is -- why it carries weight -- what to do instead**. Never leave the user knowing only what not to do without a constructive alternative.

Categories to investigate for every destination:

- **Gesture meanings:** The thumbs-up gesture is offensive in Iran, West Africa, and parts of Greece and Sardinia. The "OK" circle gesture is offensive in Brazil and Turkey. The beckoning finger (curling index finger toward yourself) is deeply rude in the Philippines, Japan, and parts of Southeast Asia. Pointing with the index finger is considered rude in much of Asia and the Middle East -- use an open hand gesture instead. The left hand has negative associations across South Asia, the Middle East, and sub-Saharan Africa for reasons of hygiene and religious practice.
- **Photography restrictions:** Sacred sites (Angkor Wat, Kyoto geisha districts, Indigenous sacred sites in Australia), people in traditional dress (Peruvian market vendors have begun requesting payment for being photographed), government buildings (common restriction globally), military installations (illegal in many countries), and people in general without consent (strong in many European countries under GDPR-adjacent social norms). Note where photography restrictions carry criminal penalties vs. social disapproval.
- **Verbal taboos and sensitive conversation topics:** The monarchy in Thailand is legally protected from criticism (lèse-majesté laws carry prison sentences). In China, Taiwan's political status, Tiananmen Square, and Tibet are politically sensitive. In Ireland, depending on the Northern Irish context, one should not casually assume political affiliations. In many former Soviet states, the Second World War is experienced as "the Great Patriotic War" and treated as deeply sacred. In India, caste history and contemporary politics around caste are sensitive with strangers. Know which topics are merely awkward and which could become confrontational or have legal implications.
- **Body language and posture:** In Thailand and much of Southeast Asia, touching someone on the head (even a child) is disrespectful as the head is considered the most sacred part of the body. Showing the sole of your shoe or foot directed at a person or a religious object is deeply offensive in most Muslim-majority and Buddhist cultures. In many Middle Eastern and Central Asian cultures, crossing your legs so that the sole of your foot faces someone in a formal setting is considered insulting.
- **Common tourist behaviors that erode trust or safety:** Haggling aggressively in cultures where a fixed price is the norm (most of East Asia, much of Europe). Accepting the first offer without any negotiation in cultures where haggling is expected (Morocco, Egypt, parts of South and Southeast Asia) -- not haggling can actually confuse vendors. Wearing expensive visible jewelry in high-pickpocket areas and in cultures where conspicuous wealth is considered poor taste. Drinking tap water in destinations where it is not potable and then attributing stomach illness to local food -- not a cultural taboo but a frequent error.

---

### Step 8: Compile the Phrases Section with Phonetic Precision

Phonetic guidance must be intelligible to a native English speaker who has no language training:

- Use syllable breaks with hyphens for clarity
- Capitalize the stressed syllable
- Avoid linguistic notation (IPA symbols) -- use intuitive English sound equivalents (e.g., "r" rolled, "ch" as in "cheese" vs. "ch" as in "Bach")
- Mark tones where relevant (Mandarin, Thai, Vietnamese) with simple descriptors: "rising," "falling," "flat," "rising then falling"
- Include at least 12 phrases, covering: hello, good morning, goodbye, thank you, please, excuse me, sorry, yes, no, how much, where is [X], I do not understand, help, and one culturally specific phrase (a toast, a meal-specific phrase, a respectful greeting)
- For languages with formal and informal registers (French tu/vous, German du/Sie, Japanese plain/polite), provide the formal/polite version for travel use

---

## Output Format

Produce the reference card in this structure. Every table must be populated with real, specific information -- no placeholder text in any field.

```
## Local Customs Briefing: [Country / Region and Cities]

**Quick summary:** [One to two sentences capturing the core cultural tone and the most important 
things a first-time visitor needs to internalize immediately. Be specific to this destination -- 
not a generic "be polite and respectful" statement.]

**Trip type adjustments:** [If the user specified a trip type that shifts emphasis, note it here. 
E.g., "Temple visits are the primary focus of this trip -- dress code and shoe-removal norms 
are elevated in this card."]

---

### Greetings and Interaction

| Situation                         | Custom                                         | Notes and Nuances                          |
|-----------------------------------|------------------------------------------------|--------------------------------------------|
| Greeting a stranger               | [Specific physical greeting + context]         | [Gender, age, or status modifiers]         |
| Formal introduction               | [Name and title convention]                    | [When first names become acceptable]       |
| Greeting an elder                 | [Any special deference custom]                 | [Bow angle, honorific, gesture]            |
| Saying goodbye                    | [Farewell custom]                              | [Formal vs. casual variants]               |
| Personal space                    | [Distance norm in cm or described]             | [Touch norms in conversation]              |
| Eye contact                       | [Direct or indirect, and in what contexts]     | [Authority vs. peer situations]            |
| Gift-giving (home visits)         | [Whether expected, what to bring, what to avoid] | [How many times to refuse, how to present] |

---

### Dining Etiquette

| Situation                         | Custom                                         | Notes and Nuances                          |
|-----------------------------------|------------------------------------------------|--------------------------------------------|
| Typical meal times                | [Breakfast / lunch / dinner timing]            | [Kitchen-closed windows if relevant]       |
| Utensil use                       | [Specific utensil or hand rules]               | [Which hand, specific chopstick rules]     |
| Communal dishes                   | [How shared dishes are served / taken]         | [Serving utensil rules]                    |
| Toasting and drinking             | [Toast phrase, pouring custom, alcohol norms]  | [Eye contact during toast, order of serving] |
| Finishing your plate              | [What a clean plate signals]                   | [Whether to leave some or finish all]      |
| Paying the bill                   | [Who pays, how to signal, cash vs. card]       | [Splitting customs]                        |
| At a host's home                  | [Arrival gift, host dynamics, leaving customs] | [Ta'arof-type refusal rituals if applicable] |
| Food taboos                       | [Prohibited ingredients or foods in this culture] | [Religious or cultural basis]           |

---

### Tipping Guide

**Tipping model: [Model A / B / C / D -- Expected / Appreciated / Rounding / Not customary]**

| Service                           | Standard tip                   | How to give it                 | Notes                          |
|-----------------------------------|--------------------------------|--------------------------------|--------------------------------|
| Sit-down restaurant (lunch)       | [Amount or %]                  | [Cash on table / card / hand]  | [Any exceptions]               |
| Sit-down restaurant (dinner)      | [Amount or %]                  | [Cash on table / card / hand]  | [Any exceptions]               |
| Taxi / rideshare                  | [Amount or round-up norm]      | [Cash or in-app]               | [Negotiated fare difference]   |
| Hotel bellhop                     | [Per-bag amount]               | [Hand directly]                | [International vs. local hotel] |
| Hotel housekeeping                | [Per-night or per-stay amount] | [Leave on pillow or in envelope] | [Daily vs. end-of-stay]      |
| Tour guide (half-day)             | [Per-person amount]            | [Hand directly, group vs. solo] | [Included in fee?]            |
| Tour guide (full-day)             | [Per-person amount]            | [Hand directly]                |                                |
| Bar or cafe                       | [Amount or practice]           | [Leave on bar / table]         |                                |
| Spa / salon                       | [% or amount]                  | [To technician directly]       | [High-end vs. budget]          |

---

### Dress Code

| Context                           | Requirement level    | Guideline                                  | Specific items needed          |
|-----------------------------------|----------------------|--------------------------------------------|--------------------------------|
| General public (urban)            | Cultural expectation | [Description of appropriate attire]        | [Anything to avoid]            |
| General public (rural / conservative areas) | Cultural expectation | [More conservative guideline]  | [Contrast with urban norm]     |
| Religious sites -- [specific type] | [Legal req. / Cultural req.] | [Covering requirements]       | [Shoes on or off, head covering, sarong] |
| Beaches and swimming              | Cultural expectation | [Swimwear norms]                           | [Topless / nude norms or restrictions] |
| Formal dining / upscale venues    | Cultural expectation | [Smart casual vs. formal standard]         |                                |
| Color and symbolic dress notes    | Awareness            | [Specific colors to be aware of]           | [Occasion context]             |

---

### Taboos and Common Mistakes

| Behavior to avoid                 | Why it matters in this culture                  | What to do instead                          |
|-----------------------------------|-------------------------------------------------|---------------------------------------------|
| [Specific gesture or action]      | [Cultural or religious significance]            | [Specific alternative behavior]             |
| [Specific gesture or action]      | [Cultural or religious significance]            | [Specific alternative behavior]             |
| [Verbal topic or comment]         | [Historical, political, or religious sensitivity] | [Safe alternative or how to redirect]     |
| [Photography behavior]            | [Legal or cultural significance]                | [When / how to ask permission or abstain]   |
| [Physical posture or body part]   | [Cultural significance]                         | [Correct alternative posture or behavior]   |
| [Tourist behavior pattern]        | [Why it reads as disrespectful]                 | [Adjusted behavior]                         |

---

### Useful Phrases

| English                           | [Language name]                | Pronunciation                               |
|-----------------------------------|--------------------------------|---------------------------------------------|
| Hello (formal)                    | [Phrase]                       | [Phonetic with stress marked]               |
| Good morning                      | [Phrase]                       | [Phonetic]                                  |
| Goodbye                           | [Phrase]                       | [Phonetic]                                  |
| Thank you                         | [Phrase]                       | [Phonetic]                                  |
| Please                            | [Phrase]                       | [Phonetic]                                  |
| Excuse me / Sorry                 | [Phrase]                       | [Phonetic]                                  |
| Yes / No                          | [Phrase] / [Phrase]            | [Phonetic]                                  |
| How much is this?                 | [Phrase]                       | [Phonetic]                                  |
| Where is [location]?              | [Phrase]                       | [Phonetic]                                  |
| I do not understand               | [Phrase]                       | [Phonetic]                                  |
| Do you speak English?             | [Phrase]                       | [Phonetic]                                  |
| Help!                             | [Phrase]                       | [Phonetic]                                  |
| [Culturally specific phrase --    | [Phrase]                       | [Phonetic]                                  |
|  toast, mealtime greeting, etc.]  |                                |                                             |

---

### ⚠ Legal and High-Stakes Notes
[Include this section only when the destination has customs that carry legal penalties, significant safety implications, or that are commonly violated by tourists with serious consequences. List them as a short bulleted list with the word **[Legal]** before any item that has criminal penalties, and **[Safety]** before items that are security-relevant.]

---

### Regional Variations
[Include this section when cultural norms differ significantly across regions within the destination -- 
e.g., urban vs. rural, North vs. South, majority-religion areas vs. secular cities. Keep to 3-5 
bullet points focused on the regions the user is actually visiting.]
```

---

## Rules

1. **Never produce placeholder output.** Every table cell must contain real, specific, destination-accurate information. A cell that says "[phrase]" or "[custom]" has not been filled in and is unacceptable output. If you are uncertain about a specific figure (like a tipping amount in a less-documented destination), state a reasonable range and note that local observation is the final authority.

2. **Distinguish legal requirements from cultural norms with explicit labels.** A traveler needs to know whether violating a dress code means a stern look from a local or a fine from law enforcement. Use **[Legal requirement]** for any norm enforced by law. Use **[Cultural expectation]** for norms enforced socially. Never conflate the two.

3. **Use the four-model tipping framework for every destination.** Identify which tipping model applies before populating the tipping table. In Model D (not customary) destinations, explain WHY -- the cultural or structural reason -- not just the fact. Never leave a traveler wondering if a "no tipping" instruction is safe to follow without context.

4. **Present all customs descriptively, not evaluatively.** Never describe a custom as "strange," "odd," "interesting," or "unusual." Never frame a custom as primitive or backward. Never praise a culture for customs the writer finds appealing. Use neutral, informational language: "It is customary to..." / "In this context, locals typically..." / "This practice reflects..."

5. **Note regional variation whenever a country has significant internal cultural diversity.** Countries like India, Indonesia, China, Nigeria, Morocco, and the United States contain vast regional differences in greeting, dress, dining, and tipping norms. Never produce a monolithic "entire country" card without acknowledging where regional differences are significant enough to affect traveler behavior. Weight the main card toward the specific regions the user is visiting.

6. **Every taboo entry requires a "what to do instead" resolution.** An entry that only tells a traveler what to avoid without offering a constructive alternative leaves them in an anxiety loop. Always close the taboo entry with a specific, actionable replacement behavior.

7. **The phrase table must include phonetic guides that are readable without linguistic training.** Do not use IPA notation. Use English sound-approximation phonetics with syllable breaks and stress marked through capitalization. For tonal languages (Mandarin, Thai, Vietnamese, Cantonese), note that tones exist and describe them in plain terms (e.g., "falling tone -- start high, end low, like a disappointed sigh") for the most important words.

8. **Include at minimum 12 useful phrases, and make at least one of them culturally specific** to the destination -- a local toast, a food appreciation phrase, a temple greeting, or a market phrase -- not only generic survival vocabulary.

9. **Never make assumptions about the user's cultural background, religion, gender, or dietary restrictions** unless they explicitly state them. Write the card to be useful to a broad range of travelers. If a specific traveler identity is mentioned (e.g., "I am vegetarian," "I am Muslim traveling to a non-Muslim country"), add a contextual note in the relevant section.

10. **Separate "legally required" from "practically advisable" from "tourist-area vs. local-area norms"** throughout the card. Many travelers visit a destination and experience only the tourist-normalized version of cultural interactions. The card should prepare them for both the sanitized tourist experience and what they might encounter if they venture into neighborhoods where fewer tourists go.

11. **Flag high-stakes verbal and political taboos explicitly.** Casual comments about a country's monarchy (Thailand), political status (Taiwan, Tibet, Kashmir, Western Sahara, Northern Cyprus), or historical atrocities may seem like normal conversation to a Westerner and carry legal risk or serious social offense at the destination. These belong in both the taboos section and the Legal/High-Stakes Notes section.

12. **Tipping amounts must be stated in the local currency AND the USD equivalent** (or the user's presumed currency if stated) to give the traveler a practical sense of scale. A 50 Thai baht tip sounds large to a first-time visitor who does not yet have a sense of Thai currency value -- stating "approximately $1.40 USD" anchors it immediately.

---

## Edge Cases

### 1. Country with Extreme Internal Cultural Variation
**Examples:** India (29 states, multiple religions, languages, and caste dynamics), Indonesia (17,000 islands, dozens of ethnic groups, Bali vs. Java vs. Aceh), China (Han vs. minority regions, Shanghai vs. rural Sichuan), Nigeria (Yoruba South vs. Hausa-Fulani North vs. Igbo Southeast).

**Handling:** Produce the main card focused explicitly on the regions the user named. Add a "Regional Variations" section at the bottom of the card noting 3-5 specific ways norms shift in other major areas. Do not attempt to produce a single unified card for a country like India and call it "India customs" -- label it clearly as the region visited. In India's case, note whether the user is visiting predominantly Hindu, Muslim, Sikh, or mixed-religion areas, as this affects dress codes, alcohol availability, food offering norms, and greeting customs.

### 2. Destination Where Tipping is Genuinely Offensive
**Examples:** Japan, South Korea, Iceland, Switzerland, Singapore.

**Handling:** State at the top of the tipping section: "Tipping is not a customary part of service culture here and may cause confusion or mild offense. Service workers are compensated through wages and service fees." Then explain the structural reason: Japan's service philosophy (omotenashi) holds that providing excellent service is a professional duty, and suggesting a server needs extra money can imply their employer is not paying them adequately. Iceland includes full service in menu prices by law. Then note the nuanced exceptions: some high-end Kyoto ryokans accept a "kokorozuke" gratuity envelope handed to the manager at check-in; some Reykjavik restaurants have adopted tipping norms in tourist-heavy areas. Give travelers a clear decision rule: "Follow the local standard (no tip). If you feel compelled to express extraordinary appreciation, an envelope at a traditional establishment is more graceful than leaving coins on a table."

### 3. Destination with Strict Religious Law Governing Public Behavior
**Examples:** Saudi Arabia (Islamic law governs dress, alcohol prohibition, gender mixing, prayer times), Iran (Islamic Republic law), Aceh province in Indonesia (Sharia-based regional law), Maldives (Islamic practices with tourist exceptions only in resort islands).

**Handling:** Elevate all legally enforced norms to a prominent **⚠ Legal Requirements** block at the top of the card, before the standard sections. Specify the law or regulation where known. Distinguish between areas where tourists are given latitude (Riyadh's tourist zones since Vision 2030, Maldives resort islands) and areas where the law applies uniformly. Include the practical daily-life implications: prayer times (Azan) affect restaurant and shop openings (often 20-30 minutes during each of 5 daily prayers), alcohol is illegal everywhere in Saudi Arabia including international hotels, and gender-mixing in public is regulated with nuance that has relaxed somewhat but not disappeared. Do not editorialize. Present the legal landscape factually.

### 4. User is Visiting Family Rather than Tourism
**Trigger signals:** "I am visiting my partner's family," "I am attending my friend's wedding," "My in-laws live there," "I am meeting my host family."

**Handling:** Shift the entire card's weighting. Expand the "At a host's home" dining section significantly. Include specific home-visit customs: arrival time norms (in many cultures, arriving exactly on time to a home dinner is actually early -- in Morocco, 20-30 minutes late is standard; in Germany, being late is rude; in Brazil, arriving 30-60 minutes after the stated time is normal), what to bring as a gift and what the gift-giving ritual looks like, how to interact with elders and children, whether to offer to help in the kitchen (welcomed in some cultures, intrusive in others), how long to stay, and how to signal it is time to leave without causing offense. Reduce space given to restaurant tipping and tourist-site dress codes. Add a brief section on "Navigating family expectations as an outsider."

### 5. User Has an Identity That May Create Specific Risk or Experience
**Trigger signals:** "I am gay," "My partner and I are a same-sex couple," "I wear a hijab," "I have a visible disability," "I am Black traveling to [destination]," "I have visible tattoos," "I am traveling solo as a woman."

**Handling:** Address the identity-specific context directly and practically, without alarm or condescension. For LGBTQ+ travelers: state the legal status (decriminalized, ambiguous, or criminal, with penalty range), the practical reality on the ground (many cities have active underground or semi-visible LGBTQ+ communities; legal criminalization does not always mean active enforcement, but it does create vulnerability), and the practical guidance (public displays of affection risk -- relevant for both same-sex and opposite-sex couples in many conservative destinations). For solo women travelers: address whether solo women are commonly seen in public, whether they will be approached, whether certain transport options (women-only train cars in Tokyo, women-only taxis in some Middle Eastern cities) exist and should be used. For travelers with visible tattoos in Japan: address the onsen and some public bath restrictions clearly, identify tattoo-friendly establishments. Frame all of this as practical safety and comfort information, not a reason to avoid the destination.

### 6. Destinations Where Two Distinct Cultural Norms Coexist Due to Tourism Pressure
**Examples:** Bali (deeply Hindu and traditional alongside heavily tourist-normalized Seminyak/Kuta), Morocco (ancient medina customs alongside tourist-facing Marrakech Djemaa el-Fna), Egypt (Islamic norms alongside very tourist-normalized Red Sea resorts), Thailand (devout Buddhist norms alongside tourist-zone nightlife districts).

**Handling:** Produce the card in two registers: "In tourist areas / resort zones" and "In local neighborhoods, temples, and markets." Make it explicit that behavior that goes unremarked in a Kuta beach bar would be deeply offensive 10 km away in a traditional Balinese village during a temple ceremony. Travelers who assume the tourist zone is a representative sample of the whole culture will be unprepared when they leave it. Note which contexts are likely for this traveler and calibrate accordingly.

### 7. Destination Where the Traveler's Home Country Has Current Political Tension
**Examples:** A U.S. traveler to Iran, an Israeli traveler to Malaysia, a Russian traveler to Poland or the Baltic states, a Chinese traveler to Taiwan during elevated tensions.

**Handling:** Note briefly and factually that the traveler's passport or presumed nationality may affect interactions in some contexts. Do not predict hostility, but do prepare the traveler for possible questions, for navigation of politically charged conversations, and for practical realities (some Israeli passport holders cannot enter certain countries; some nationalities may face additional scrutiny). Frame as information, not alarm. Keep it to 2-3 sentences in the Legal/High-Stakes Notes section. This skill does not cover visa/entry bar requirements -- refer to `visa-requirements-checker` for that -- but does note cultural reception dynamics.

---

## Example

**Input:** "I'm going to Morocco for 10 days -- Marrakech, the Atlas Mountains, and a night in the Sahara. Tourism, mostly. I want to know how to act and not embarrass myself."

---

## Local Customs Briefing: Morocco (Marrakech, Atlas Mountains, Sahara Region)

**Quick summary:** Morocco is a Muslim-majority country where religion, hospitality, and family are deeply intertwined with daily customs. Guests are treated with generosity and warmth, but respect for Islamic practice in dress, physical greetings, and food customs is essential -- and in some contexts, legally relevant. The further from urban tourist zones you travel, the more traditional the norms become: this matters significantly for your Atlas mountain villages and desert camp segments.

**Trip type notes:** Your itinerary moves between high-tourist zones (Marrakech medina, tourist riads) and rural/traditional zones (Atlas Berber villages, Saharan camps). The card highlights where norms shift between these contexts.

---

### Greetings and Interaction

| Situation                          | Custom                                                            | Notes and Nuances                                                              |
|------------------------------------|-------------------------------------------------------------------|--------------------------------------------------------------------------------|
| Greeting a local man (as a man)    | Handshake, sometimes followed by placing the right hand on the heart | In more traditional and rural areas, men may greet with cheek-to-cheek twice (left, right) among those who know each other |
| Greeting a local woman (as a man)  | Do not extend your hand first. Wait to see if she extends hers. If not, a nod and verbal greeting ("Salam") suffices. | Observant Muslim women may not shake hands with men outside their family. This is not a slight -- do not be offended or push. |
| Greeting a local woman (as a woman) | Cheek kiss (left then right) is common between women. Handshake with right hand is also acceptable. | Warmth and physical greeting between women is common. Verbal exchange of "La Bas?" ("How are you?") and response "La Bas, Hamdullah" (Fine, praise God) is a normal rhythmic exchange. |
| Greeting an elder or host          | Right hand on heart after shaking or after greeting, with a slight bow of the head | This gesture signals respect and sincerity. In Berber villages, elders are greeted first, before children or peers. |
| Saying goodbye                     | "B'slama" (informal farewell) or "Ma'a salaama" (formal). Right hand to heart again. | Farewells in home settings can be extended -- the host walking you to the door (and sometimes beyond) is a sign of respect. |
| Personal space                     | Closer conversational distance than Northern European norms -- roughly 40-50 cm is comfortable. | Moroccan men may stand very close when speaking with you; this is not aggressive. Stepping back repeatedly signals you are uncomfortable. |
| Eye contact                        | Moderate direct eye contact between same genders is normal and friendly. Men should avoid sustained eye contact with women they do not know. | With religious figures or elders, looking slightly downward is a sign of respect. |
| Gift-giving (if invited to a home) | Bring sweets (Moroccan pastries, dried fruit, high-quality dates), or honey. Fresh flowers are less common as a home gift than in Europe. Avoid alcohol. | Present the gift with your right hand or both hands. Your host may set it aside without opening it immediately -- this is polite, not indifferent. |

---

### Dining Etiquette

| Situation                          | Custom                                                            | Notes and Nuances                                                              |
|------------------------------------|-------------------------------------------------------------------|--------------------------------------------------------------------------------|
| Typical meal times                 | Breakfast: 7:00-9:00. Lunch: 13:00-15:00 (the main meal of the day). Dinner: 20:00-22:00. | During Ramadan, all timing shifts entirely: fast until sunset, then Iftar (the breaking of fast) followed by Suhoor before dawn. |
| Eating with hands                  | Traditional Moroccan home meals are often eaten with the right hand from a shared central dish (tagine, couscous). | Use only your right hand. The communal dish has an "in front of you" convention -- take from the portion in your section, not across the dish. |
| Communal couscous                  | Friday couscous is a tradition -- a large shared dish, often with broth poured over by the host. Wait for the host to begin. | The lamb or chicken pieces in the center are typically served to guests by the host as a gesture of honor. Accept graciously. |
| Bread (khobz)                      | Bread is present at every meal and treated with respect. It is used to scoop food from communal dishes. | Never throw bread away casually. If you drop bread, pick it up. Do not use bread as a plate on the floor. |
| Mint tea                           | Served multiple times -- in welcome, during negotiation in souks, after meals. Poured from a height to create foam. Refusing tea is a mild social rebuff. | Accepting tea is the socially graceful response even if you do not finish it. Three refills may be offered -- it is acceptable to decline after the first cup. |
| Alcohol norms                      | Morocco has a legal alcohol industry (wine is produced domestically). Alcohol is served in tourist riads, restaurants with licenses, and bars. | Alcohol is not offered or present in conservative homes and village settings. In Atlas mountain villages and Saharan camps, do not expect or request alcohol. |
| Paying the bill at a restaurant    | The bill is brought when you ask: say "L-hsab, afak" (the bill, please). One person typically pays in traditional culture -- splitting is understood in tourist restaurants. | Many medina restaurants and local spots are cash only. Always carry Moroccan dirhams (MAD). Cards are more reliable in tourist-facing riads and modern restaurants. |
| At a host's home                   | Arrive slightly after the stated time (10-15 minutes). Remove shoes at the entrance if you see shoes lined up or a mat. Compliment the food specifically. | You will be urged to eat more -- a gentle but firm "Baraka llah o feek" (God bless you, I am full) is an acceptable and respected response. |

---

### Tipping Guide

**Tipping model: Model C -- Rounding-based and expected in service interactions, with specific service-sector conventions.**

| Service                            | Standard tip                    | How to give it                      | Notes                                                       |
|------------------------------------|---------------------------------|-------------------------------------|-------------------------------------------------------------|
| Sit-down restaurant (lunch)        | 10% of the bill                 | Leave cash on the table or hand it directly | Roughly 20-40 MAD (~$2-4 USD) for a mid-range lunch. Not expected at hole-in-the-wall local spots but appreciated. |
| Sit-down restaurant (dinner)       | 10-15% of the bill              | Leave cash on the table             | At tourist-facing riads and upscale Marrakech restaurants, 15% is standard. |
| Taxi (petit taxi, city)            | Round up to the nearest 5 or 10 MAD | Tell the driver to keep the change | Always negotiate the fare before getting in, or insist on the meter. Tipping on top of a negotiated fare is optional. |
| Hotel bellhop                      | 10-20 MAD per bag (~$1-2 USD)   | Hand directly at the time of service |                                                             |
| Hotel housekeeping                 | 20-30 MAD per night (~$2-3 USD) | Leave on the bed or nightstand daily | Daily tipping ensures the person who serviced your room receives it. |
| Guided tour / day guide            | 50-100 MAD per person per half-day (~$5-10 USD); 100-200 MAD per person for a full-day (~$10-20 USD) | Hand directly at end of tour | In Atlas villages, your guide is often a community member -- tipping is economically significant. |
| Sahara desert camp guide / camel handler | 50-100 MAD per person (~$5-10 USD) | Hand at the end of the experience  | These are typically independent workers, not resort employees. |
| Souk porter or unofficial guide    | Agree on a price BEFORE accepting their help. 20-50 MAD (~$2-5 USD) for a short escort. | Pay at the end                      | "Faux guides" may lead you to shops for commissions. It is acceptable to decline offers of guiding. If you accept help, agree on compensation first. |
| Hammam (traditional bath) attendant | 20-50 MAD (~$2-5 USD) on top of the fee | Hand directly to your attendant    | High-end hammams may include service charges -- check the receipt. |

---

### Dress Code

| Context                            | Requirement level            | Guideline                                                          | Specific items to bring or avoid                               |
|------------------------------------|------------------------------|--------------------------------------------------------------------|----------------------------------------------------------------|
| General public (Marrakech medina)  | Strong cultural expectation  | Cover shoulders and knees for both men and women. Loose, breathable fabrics. | Shorts and sleeveless tops attract staring and persistent vendor attention. Linen trousers and cotton shirts or loose dresses work well. |
| General public (Marrakech Gueliz / modern quarter) | Cultural expectation | More relaxed -- mid-length shorts and short sleeves are common here. | Still conservative by resort-destination standards -- no beachwear off the beach. |
| Atlas Mountain villages            | Strong cultural expectation  | Conservative dress is very important in Berber village contexts. Full-length trousers, covered shoulders, loose clothing. | This is where tourist-zone norms do NOT translate. A T-shirt and shorts that were fine in a Marrakech riad café will draw discomfort from villagers. |
| Mosques                            | **[Legal/Religious requirement]** | Non-Muslims are not permitted inside most Moroccan mosques (exception: Casablanca's Hassan II Mosque, which has tourist hours). | If you are permitted entry: shoes off, women cover hair, everyone covers knees and shoulders. Carry a scarf. |
| Shrines and religious sites (zaouias, mausoleums) | Religious expectation | Same dress as mosque entry. Behave silently and respectfully. | Photography inside is generally prohibited. Observe before acting. |
| Sahara desert camp                 | Practical + cultural expectation | Loose layers for daytime heat; warm layers for night (desert nights drop significantly in temperature). Covered clothing is appreciated around camp staff and local Tuareg / Amazigh hosts. | A lightweight scarf (chèche) is practical for sand and appreciated as a gesture of cultural awareness. |
| Evening dining at a riad           | Smart casual                 | Neat, clean clothing. No need for formal dress. Moroccan fashion is colorful -- feel free to wear a djellaba or kaftan if offered one. | |
| Color notes                        | Awareness                    | White is commonly worn (clean, modest); green is associated with Islam and is treated with reverence. No specific prohibition on tourist color choices. | |

---

### Taboos and Common Mistakes

| Behavior to avoid                  | Why it matters in Morocco                                         | What to do instead                                                |
|------------------------------------|-------------------------------------------------------------------|-------------------------------------------------------------------|
| Public displays of affection       | Morocco has laws against public indecency, and unmarried couples displaying affection in conservative areas risk police attention. Even in tourist areas it is considered culturally inappropriate. | Hold hands if you are comfortable in very tourist-facing zones, but avoid kissing or embracing in public. Inside your riad is fully private. |
| Photographing people without permission -- especially in the medina | Many medina residents, market vendors, and water sellers in traditional dress have had their photos taken without consent for years and find it dehumanizing. Some will demand payment after, which can escalate. | Ask first: "Imken nsuwr lik?" (May I take your photo?). Accept a no gracefully. If you agree on payment, confirm the amount before photographing. |
| Photographing government buildings, military, or police | Photographing military installations, the Royal Palace, border facilities, and police in operational contexts can result in questioning and deletion of photos. | Keep cameras pointed at architecture, markets, landscapes. When uncertain about a building's status, ask your guide. |
| Entering a negotiation then walking away aggressively | In souk culture, entering a price negotiation is considered a social contract. Walking away mid-
