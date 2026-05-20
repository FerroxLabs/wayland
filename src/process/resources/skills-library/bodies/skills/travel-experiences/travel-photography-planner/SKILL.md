---
name: travel-photography-planner
description: |
  Creates a travel photography plan with shot lists, golden-hour timing, and
  location scouting workflows. Produces a day-by-day photography schedule with
  light windows, gear checklists, and composition notes for each location. Use
  when the user asks about planning photography during travel, creating shot
  lists for a destination, timing golden hour for travel photos, or scouting
  photo locations before a trip. Do NOT use for professional photography
  technique guidance (use design-creative photography skills), camera settings
  tutorials, or general trip planning (use trip-itinerary-builder).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel planning photography itinerary"
  category: "travel-experiences"
  subcategory: "experiences-activities"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Travel Photography Planner

## When to Use

**Use this skill when the user:**
- Asks to plan photography-focused days or sessions during an upcoming trip, including how to balance shooting time with other travel activities
- Wants a shot list for a specific destination -- whether an iconic city, national park, coastal region, or cultural festival -- organized by subject type and light window
- Needs accurate sunrise, sunset, golden hour, and blue hour timing for a specific destination and date range, and wants to know how those light windows map to specific locations
- Asks how to scout photo locations before or during a trip, including finding shooting positions, verifying access, checking tripod policies, and identifying backup angles
- Wants a gear packing list tailored to their specific camera system, destination conditions, and shot list (not a generic "bring a camera" list)
- Needs to organize a photo walk route in a city, district, or natural area where sequence and timing matter
- Is traveling with non-photographers and needs to integrate focused photography sessions into shared itinerary time without creating conflict
- Wants to plan around special light conditions: golden hour, blue hour, magic hour in mountain terrain, foggy mornings, rainy season diffused light, or nocturnal city photography

**Do NOT use this skill when:**
- The user wants general travel itinerary planning without a photography focus -- use `trip-itinerary-builder` instead, which handles logistics, accommodation, and activity sequencing
- The user asks about camera settings, exposure, depth of field, aperture, shutter speed, or technical photography technique -- use design-creative photography skills instead
- The user wants to edit, retouch, color grade, or post-process photos -- this is a separate domain requiring different tools and guidance
- The user wants a walking tour without a photography focus -- use `city-walking-tour-builder` instead
- The user is planning a professional commercial shoot requiring permits, location agreements, model releases, or crew coordination -- this skill covers personal/travel photography only
- The user asks about photo book creation, printing, or sharing workflows -- those are output-focused tasks beyond the scope of this planner
- The user needs wildlife-specific photography guidance requiring telephoto technique, hide construction, or animal behavior knowledge -- these require domain-specialized skills

---

## Process

### Step 1: Gather the Complete Photography Travel Profile

Ask the user for all essential inputs before building anything. Missing even one of these inputs will cause the plan to be wrong in a consequential way.

- **Destination and specific dates:** The difference between shooting in Kyoto in mid-November versus late March is the difference between autumn foliage and cherry blossoms -- the entire shot list changes. Dates also determine sunrise and sunset times to the minute, which anchor the entire schedule.
- **Experience level:** Categorize as one of four levels: (1) Smartphone only, (2) Camera beginner with auto or semi-auto modes, (3) Intermediate with manual exposure and lens awareness, (4) Advanced with full manual, filtration, and composition mastery. This changes which shots are achievable and how much setup time to budget per location.
- **Photography interests by priority:** Landscapes, architecture, street/documentary, food and markets, wildlife, portraits, night photography, abstract/detail, festivals and events. Ask them to rank their top three -- the plan focuses on those.
- **Exact gear available:** Camera body type (smartphone, compact, micro four-thirds mirrorless, full-frame mirrorless, crop-sensor DSLR, full-frame DSLR), every lens with focal length and maximum aperture, filters owned (polarizer, ND, graduated ND), tripod type (full travel tripod, mini/tabletop, gorilla grip), remote shutter, drone type and local regulations status.
- **Desired output:** Social media (requires vertical crop options and punchy single images), travel blog (requires variety -- establishing shots, details, people), print (requires technically clean exposures with high dynamic range), portfolio (requires 5-10 exceptional images rather than 50 acceptable ones), personal memories (relaxed, candid-friendly approach). Output format changes which shots to prioritize and how much time to spend at each.
- **Photography-to-travel ratio:** How many hours per day are fully dedicated to photography versus shared with travel companions or sightseeing? A 100% photography trip is planned completely differently from a trip where the user gets two hours per day.
- **Physical tolerance for early and late sessions:** Golden hour in summer at northern latitudes can mean a 4:30 AM alarm. Blue hour after sunset in winter ends quickly. Some users will not do this -- know before scheduling.
- **Specific must-have shots:** Landmark compositions they have seen and want to recreate, personal milestone shots, shots for a specific publication, or scenes that motivated the trip.

---

### Step 2: Research and Calculate Precise Light Conditions

This is the technical foundation of the entire plan. Inaccurate light timing wastes the user's most valuable travel resource -- the 60-minute golden hour window.

- **Sunrise and sunset times:** Calculate to the minute for the destination latitude and date range. Use the formula: at latitude 40°N in October, sunrise is approximately 7:15-7:45 AM and sunset 6:30-7:00 PM -- but this varies by 30-40 minutes across a month. At latitude 60°N (Stockholm, Helsinki), summer golden hour can last 2-3 hours; winter golden hour can be the entire low-sun day.
- **Golden hour definition and window:** The true photographic golden hour begins at sunrise and ends when the sun is approximately 6° above the horizon (roughly 30-45 minutes post-sunrise). The evening golden hour begins when the sun drops to approximately 6° above the horizon (roughly 45-60 minutes before sunset). In summer at mid-latitudes, this window is 45-60 minutes. In winter it compresses to 20-30 minutes. Near the equator, it compresses to 15-20 minutes due to the steep sun angle.
- **Blue hour definition and window:** Morning blue hour runs from approximately 30 minutes before sunrise to sunrise itself. Evening blue hour runs from sunset to approximately 20-30 minutes after sunset. Blue hour is optimal for: illuminated landmarks against a deep blue sky (the brief overlap of ambient and artificial light), cityscapes with water reflections, and any scene where artificial lighting anchors the composition.
- **Sun direction at key times:** At sunrise, the sun is approximately due east (azimuth 90°). At sunset, approximately due west (azimuth 270°). But the exact azimuth varies with latitude and season -- at 51°N (London) in June, the sun rises at azimuth ~47° (northeast) and sets at azimuth ~313° (northwest). This determines which building facades are front-lit, which streets are in shadow, and which viewpoints are backlit. Map sun azimuth to specific landmark orientations for accuracy.
- **Weather-driven light modifiers:** Mediterranean and coastal destinations often have morning mist that burns off by 9:00 AM -- this creates atmospheric conditions good for 45-60 minutes that are completely different from clear golden hour. Monsoonal regions have afternoon clouds that produce soft light and dramatic skies even when it is not raining. Mountain destinations at elevation produce sharper, cooler light with longer shadows. Note these patterns for the specific destination.
- **Artificial light conditions for night and blue hour:** Research which landmarks are floodlit (and at what hours they are lit -- many turn off lights at 11:00 PM or midnight), which neighborhoods have neon signs or market illumination, and whether the destination has significant light pollution that blocks stars. This determines night photography feasibility.
- **Moon phase for night sky photography:** If the user wants star trails or Milky Way shots, a new moon phase is mandatory. A full moon washes out stars but creates excellent landscape moonlight photography. Note the phase for the travel dates.

---

### Step 3: Build the Prioritized Shot List

A professional travel photographer completes 8-12 planned shots per day in a focused session. An intermediate travel photographer completes 4-8. Plan accordingly -- do not build a 40-shot list for a 3-day trip.

- **Tier 1 -- Anchor shots (2-4 per trip):** These are the defining images of the destination that the user will show others. They require the best light, advance scouting, and often the earliest or latest timing. These shots anchor the entire schedule and other activities are planned around them. For Paris: the Seine from Pont des Arts at blue hour with Notre Dame reflection. For Santorini: caldera with dome churches at sunset from Oia. For Marrakech: rooftop view over the medina at golden hour.
- **Tier 2 -- Strong supporting shots (5-10 per trip):** Shots that add depth and context to the anchor shots. They can be captured across a range of conditions but benefit from good light. Architecture details, street scenes, markets, food, and mid-scale landscape compositions fall here.
- **Tier 3 -- Opportunistic shots (ongoing):** Candid moments, unexpected scenes, textures, and details that are captured reactively rather than planned. These are noted as categories rather than specific shots -- "look for doorways with peeling paint," "watch for elderly residents at cafe tables in early morning." These cannot be scheduled but should be listed so the user is primed to notice them.
- **For each Tier 1 and Tier 2 shot, specify:** Exact location with neighborhood reference, GPS-approximate position if helpful, optimal time window (not just "morning" but "7:15-8:00 AM"), recommended focal length range, composition type (wide establishing, medium environmental, tight detail), anticipated challenge (crowds, access, weather dependency, moving subjects), and a fallback plan if the primary attempt fails.
- **Balance shot categories:** For a 5-day trip, a balanced shot list has approximately 4-6 architecture shots, 4-6 street/people shots, 3-4 detail/texture shots, 2-3 landscape/cityscape shots, and 2-4 night/blue hour shots. Adjust ratios based on the user's stated interests.
- **Sequence shots by geography, not by type:** A shot list organized by location clusters is more useful than a shot list organized by category. The user should be able to look at one section and execute everything in one neighborhood before moving to the next.

---

### Step 4: Develop the Location Scouting Workflow

Scouting is the difference between arriving at a location with a plan and arriving lost. For a trip of 4+ days, a 30-minute reconnaissance walk of the most important locations on Day 1 (midday, no pressure) pays enormous dividends.

- **Identify the exact shooting position:** Not just "from the bridge" but "from the north side of the bridge, approximately 1/3 of the way across, shooting southwest with a 35mm focal length to include both the waterfront buildings and the reflection below the railing." This level of specificity requires research from photo databases, travel photography forums, and satellite/street-level mapping tools.
- **Verify access conditions:** Entry fees and hours change seasonally. Many popular viewpoints are inaccessible before 8:00 AM even though golden hour happens at 6:30 AM. Some rooftop and elevated locations require hotel-guest access or specific purchases. Confirm whether tripods require a permit, are banned entirely, or are freely allowed -- this is venue-specific and not predictable from general knowledge.
- **Identify the crowd pattern:** Most popular photography locations are mobbed between 10:00 AM and 3:00 PM, particularly on weekends. The 45-minute window immediately around golden hour is increasingly popular -- arrive 20-30 minutes early at well-known viewpoints. Some locations are so popular (Trolltunga in Norway, Horseshoe Bend in Arizona) that you should expect other photographers in frame and plan compositions that either incorporate the crowd as a storytelling element or use a long lens to isolate subjects.
- **Identify alternate compositions:** Every location should have at least two planned compositions: the primary (if conditions are perfect) and the alternate (if the primary position is blocked, lit incorrectly, or crowded). For a famous arch framing a mountain, the primary might be centered symmetrical framing at f/8 -- the alternate might be an off-center composition from 20 meters to the side incorporating a foreground element.
- **Pre-visit scout vs. go-direct decision:** For Tier 1 shots that require specific positioning, tripod setup, and timing, always schedule a midday scout visit to confirm position before the golden hour shoot. For Tier 2 and Tier 3 shots that are more flexible, go direct. The scout visit should take no more than 15-20 minutes per location.
- **Map out inter-location transit times realistically:** Add 15 minutes of buffer to any transit time that involves stairs, hills, or navigating historic city centers on foot. Carrying camera gear adds fatigue -- a 20-minute walk without gear is a 25-minute walk with a full camera bag.

---

### Step 5: Build the Gear Checklist

Build the checklist from the shot list, not from a generic master list. Every item should map to a specific shot or condition in the plan.

- **Camera body and primary lens:** These are always essential and always in carry-on baggage. Never check a camera body or expensive lens. Full-frame mirrorless or DSLR systems: the 24-70mm f/2.8 is the single most versatile travel lens covering architecture, street, and food at a single stop. For crop-sensor systems, a 16-55mm f/2.8 equivalent covers similar range.
- **Secondary lens decisions by shot list:** If the shot list includes compressed telephoto architecture shots or wildlife, bring a 70-200mm. If it includes night skies, bring the widest fastest prime available (24mm f/1.4 or 35mm f/1.8 minimum). If it includes only street and architecture, leave telephoto at home -- the weight savings are meaningful on a walking-intensive trip.
- **Filters that actually change the shot:** A circular polarizing filter reduces reflections on water by up to two full stops and increases sky contrast -- bring it for any coastal, lake, or jungle destination. A 6-stop or 10-stop ND filter enables long-exposure water shots (silky rivers, blurred waterfalls) and is essential for those specific shots -- skip it if the shot list does not include them. A 2-stop graduated ND filter manages sky-to-land dynamic range in landscape shots where a tripod is used -- bring it for sunrise/sunset landscape shots.
- **Tripod decision framework:** Full tripod (carbon fiber travel tripod, 1-1.5kg): required for blue hour cityscapes, star photography, and long exposures. Mini/tabletop tripod: works for railing placement and low-angle shots, insufficient for elevated tripod heads. Gorilla grip: excellent for irregular surfaces and wrapping around railings, but unstable in wind. Check destination's tripod policies before packing. If 80% of the location list bans tripods, reconsider bringing a full tripod.
- **Battery and storage mathematics:** Each camera battery typically delivers 300-500 shots with standard use, or 200-300 shots in cold weather. For a full golden hour session of 2-3 hours: plan on 200-400 frames. Bring at minimum 3 batteries for full-day shooting. Memory cards: a 64GB card holds approximately 1,500-2,000 raw files at 24MP. Bring at minimum two cards -- one primary, one backup. Nightly offload to a laptop or portable SSD is mandatory.
- **Climate-specific additions:** High humidity destinations (Southeast Asia, Caribbean): bring silica gel packets for the camera bag and a lens cloth that does not scratch. Cold destinations: keep spare batteries in an inner jacket pocket (cold kills lithium batteries -- a battery that reads 20% at -5°C may read 60% when warmed). Coastal destinations: salt air is corrosive, keep the camera bag closed when not shooting, clean lenses and body more frequently.
- **Airline compliance:** Carry-on lithium batteries are limited to 100Wh per battery for standard rules (most camera batteries are 10-20Wh, well within limits), but total quantity restrictions apply. Drone batteries must be in carry-on and are often subject to airline-specific quantity rules (check before flying). Drone registration, licensing, and local flight permits are separate from gear packing -- note any required documentation.

---

### Step 6: Assemble the Day-by-Day Photography Schedule

The schedule must be realistic. A plan that requires five location changes before 9:00 AM will fail. Build around light windows as anchors, then fill the hours around them.

- **Anchor each day to its light windows first:** Write in golden hour AM and golden hour PM for each day before adding anything else. These are fixed appointments. Everything else fits around them.
- **Apply the 90-minute rule:** Any shooting session that requires full concentration (manual settings, tripod work, waiting for specific moments) should not exceed 90 minutes without a break. After 90 minutes, photographers make compositional errors, miss obvious shots, and make poor exposure decisions. Schedule coffee, a walk, or breakfast between intensive sessions.
- **Separate solo photo sessions from couple/group time explicitly:** If the user is traveling with non-photographers, the schedule should label each block as "solo photo" or "shared." The most accepted pattern: solo golden hour AM session while partner sleeps (5:30-8:30 AM), shared midday activities, optional shared golden hour PM at a scenic location where the non-photographer can also enjoy the setting. Do not exceed two solo photo sessions per day in a shared trip.
- **Build in the nightly backup routine:** 15-30 minutes before sleep to offload cards to a laptop or portable SSD. This is non-negotiable -- memory card failures and camera theft are real risks, and a backup on a separate device protects the entire trip's work. Label this as a scheduled activity.
- **Mark rest days:** A trip of 5+ days should have at least one half-day with no scheduled photography. Photographer fatigue is real -- seeing every scene as a potential shot is mentally exhausting over 5 days. A rest half-day improves the quality of shooting on subsequent days.
- **Include contingency notes for weather changes:** Each anchor shot should have a weather contingency: what to do if it is overcast, raining, or foggy at the scheduled time. Overcast light is excellent for markets, portraits, and detail shots. Rain creates reflection opportunities and empty streets. Fog creates atmospheric distance shots. Do not waste a bad-weather morning by staying in the hotel -- redirect to the most weather-tolerant shots on the list.

---

### Step 7: Add Destination-Specific Cultural and Ethical Photography Guidelines

This is not optional content -- cultural missteps can damage the user's experience and cause real harm to the people they photograph.

- **Research and list destination-specific photography restrictions:** Military sites, government buildings, courthouses, and border facilities have legal photography prohibitions in most countries. Religious sites vary enormously: many mosques prohibit cameras during prayer times; many Hindu temples restrict non-worshippers from photographing the inner sanctum; Japanese shrines generally allow exterior photography but restrict interior shots. Research the specific destination -- do not generalize.
- **Street photography cultural norms by region:** In Northern Europe, candid street photography is legally protected but socially awkward -- acknowledge subjects. In Mediterranean countries, photographing strangers without permission is common but direct engagement is appreciated. In many Middle Eastern and South Asian countries, photographing women without permission is culturally inappropriate. In some African and South American tourist areas, people expect payment for being photographed -- decide your policy in advance and be consistent.
- **Provide the local phrase for "May I take your photo?"** This single sentence, delivered with the camera visible, transforms interactions. Include it in the plan for non-English-speaking destinations.
- **Markets and vendors:** The ethical standard is to purchase something from a vendor before photographing their stall, or to ask permission first. Photographing food markets from above (elevated positions, wide shots of the crowd) is generally uncontroversial. Close-up shots of specific people working require acknowledgment.
- **Child photography:** Default to never photographing children without clear parental permission in any country. This is both an ethical standard and a legal protection for the photographer.

---

## Output Format

```
## Travel Photography Plan

**Destination:** [City, Country or Region]
**Travel Dates:** [Date range with month and year]
**Trip Length:** [N days]
**Gear Summary:** [Camera body + lens lineup + key accessories]
**Photography Focus:** [Top 3 interests in priority order]
**Output Goal:** [Social media / blog / portfolio / personal memories]
**Photography Ratio:** [Hours per day dedicated to photography vs. shared time]

---

### Light Schedule

| Date | Civil Twilight | Sunrise | Golden Hour AM | Solar Noon | Golden Hour PM | Sunset | Blue Hour PM |
|------|----------------|---------|----------------|------------|----------------|--------|--------------|
| [date] | [time] | [time] | [start – end] | [time] | [start – end] | [time] | [start – end] |
| [date] | [time] | [time] | [start – end] | [time] | [start – end] | [time] | [start – end] |

**Sun Direction Notes:**
- Golden hour AM: Sun azimuth approximately [degrees], best front-lighting on [compass-facing] facades
- Golden hour PM: Sun azimuth approximately [degrees], best light on [compass-facing] facades and [landmark]
- Moon phase during trip: [phase -- relevant for night photography planning]
- Weather pattern note: [any destination-specific light modifier -- fog, cloud pattern, seasonal condition]

---

### Shot List

#### Tier 1 -- Anchor Shots (Schedule around these)
| # | Shot | Location | Time Window | Focal Length | Composition | Challenge | Fallback |
|---|------|----------|-------------|--------------|-------------|-----------|---------|
| A1 | [description] | [exact location] | [time range] | [mm] | [framing] | [obstacle] | [alternate] |
| A2 | [description] | [exact location] | [time range] | [mm] | [framing] | [obstacle] | [alternate] |
| A3 | [description] | [exact location] | [time range] | [mm] | [framing] | [obstacle] | [alternate] |

#### Tier 2 -- Supporting Shots
| # | Shot | Location | Optimal Time | Focal Length | Composition | Notes |
|---|------|----------|--------------|--------------|-------------|-------|
| S1 | [description] | [location] | [time] | [mm] | [framing] | [tip] |
| S2 | [description] | [location] | [time] | [mm] | [framing] | [tip] |
| S3 | [description] | [location] | [time] | [mm] | [framing] | [tip] |
| S4 | [description] | [location] | [time] | [mm] | [framing] | [tip] |
| S5 | [description] | [location] | [time] | [mm] | [framing] | [tip] |

#### Tier 3 -- Opportunistic Shots (Stay primed for these)
- [Category and what to watch for]
- [Category and what to watch for]
- [Category and what to watch for]

---

### Location Scouting Notes

#### [Location Name]
- **GPS reference:** [neighborhood, street, or landmark reference]
- **Best shooting position:** [specific stand-here instruction]
- **Optimal focal length:** [mm range]
- **Access:** [hours, fees, booking required, dress code]
- **Tripod policy:** [Allowed freely / Allowed with restrictions / Not allowed / Unknown -- verify on arrival]
- **Best time for fewest people:** [time and day-of-week]
- **Light quality at golden hour AM:** [front-lit / backlit / side-lit / in shadow]
- **Light quality at golden hour PM:** [front-lit / backlit / side-lit / in shadow]
- **Alternate composition:** [where to go if primary position is blocked]
- **Scout visit recommended:** [Yes -- plan 15 min midday visit Day 1 / No -- go direct]
- **Paired with:** [nearest second location, walking distance]
- **Weather sensitivity:** [Good in rain / Needs clear sky / Works in overcast]

[Repeat block for each priority location]

---

### Gear Checklist

| Item | Include? | Shot List Justification | Airline / Transport Note |
|------|----------|------------------------|--------------------------|
| [Camera body] | Essential | All shots | Carry-on only |
| [Primary lens] | Essential | [shot types] | Carry-on only |
| [Secondary lens] | [Yes/Optional/No] | [shot types or "no shots require it"] | Carry-on only |
| Travel tripod | [Yes/Optional/No] | [blue hour shots if yes] | Check if full-size; attach if carbon mini |
| Polarizing filter ([mm]) | [Yes/Optional/No] | [water/sky shots] | Filter pouch, carry-on |
| ND filter ([stop]) | [Yes/Optional/No] | [long exposure shots] | Filter pouch, carry-on |
| Spare batteries (qty) | Essential | [N batteries for N hours daily] | Carry-on (lithium rules) |
| Memory cards (qty + size) | Essential | Primary + backup card | Carry-on |
| Lens cleaning kit | Essential | [climate note] | Carry-on |
| Rain cover | [Yes/No] | [weather note] | Stuff sack |
| Portable SSD / laptop | Recommended | Nightly backup | Carry-on |

---

### Day-by-Day Photography Schedule

#### Day [N]: [Session Theme]

**Anchor shot this day:** [Shot code from shot list]
**Weather contingency:** [What to shoot instead if conditions are poor]

| Time | Block Type | Activity | Location | Shot Codes | Light Condition |
|------|------------|----------|----------|------------|-----------------|
| [time] | [Solo photo / Shared / Transit / Rest / Backup routine] | [specific activity] | [location] | [A1, S2, etc.] | [golden hour / blue hour / midday / night] |

*Partner/group note: [Shared activities for the day; what non-photographers can do during solo sessions]*

[Repeat day block for each day]

---

### Gear Backup and Storage Routine (Daily -- 15 min)

**Every evening before sleep:**
1. Offload memory card to [laptop / portable SSD] using [direct USB or card reader]
2. Verify file count on backup matches file count on card before formatting
3. Do NOT format cards until backup is confirmed -- keep original card until next session
4. Charge all batteries overnight
5. Clean front lens element with [lens cloth / blower brush if dust present]

---

### Photography Ethics and Cultural Guidelines

**Destination-specific rules:**
- [Specific legal restriction]
- [Religious site policy]
- [Street photography norm for this region]

**Permission phrase in local language:** "[How to ask to photograph someone]" ([phonetic pronunciation])

**Child photography policy:** Never without explicit parental permission.

**Vendor/market etiquette:** [Destination-specific standard]

**Restricted subjects at this destination:** [Military, government, border, other]
```

---

## Rules

1. **Never provide light timing without destination coordinates and date specificity.** "Golden hour is around sunset" is useless. Golden hour in Reykjavik in June lasts 3 hours; in Singapore in December it lasts 15 minutes. Calculate to the specific destination and date range, and state the times in local time.

2. **The shot list size must be calibrated to the available photography hours, not to the list of interesting things in the destination.** A 2-day trip with 4 hours of photography time per day can realistically complete 8-12 shots. Building a 30-shot list for that trip guarantees failure and frustration. Under-plan and execute well.

3. **Always specify focal length recommendations in actual millimeters, not descriptions.** "A wide lens" is ambiguous. "24mm on full-frame (16mm on crop-sensor APS-C)" is actionable. The user needs to know which of their lenses to mount before arriving at the location.

4. **Tripod policies must be stated explicitly for every priority location.** Do not assume. Many of the world's most photographed sites have tripod bans (Eiffel Tower observation deck, many museum interiors, many temple sanctuaries). Arriving with a tripod at a banned location wastes setup time and may result in equipment being held at the entrance.

5. **Never schedule back-to-back golden hour sessions at locations more than 20 minutes apart by transit.** Morning golden hour and blue hour flow into each other -- transitioning between locations during this 90-minute window wastes irreplaceable light time. Plan each golden hour session at a single location cluster, then move during the dead midday hours.

6. **Do not recommend drone photography without explicit verification of local drone laws for the specific destination.** Many popular travel destinations have significant drone restrictions: all of national parks in certain countries, within 5km of airports, within city centers of many European capitals, and entirely prohibited in some countries. A drone that cannot legally fly is useless weight in a camera bag.

7. **Blue hour and night photography without a tripod requires a minimum aperture of f/1.8 and ISO sensitivity of 3200-6400 for proper exposure at most illuminated landmarks.** If the user's only lens is f/4 or slower, remove blue-hour shots from the schedule or add a tripod to the gear list. State this constraint explicitly rather than leaving the user to discover it on location at 7:00 PM.

8. **Include at least one rainy-day contingency shot cluster for every destination.** No travel photography plan is complete without a rain contingency. Wet streets and overcast skies are excellent for street photography, market interiors, cafe scenes, museum architecture, and covered market halls. A plan that collapses entirely in rain is not a plan.

9. **Reserve the final morning of any trip for a reshoot of the one anchor shot that did not fully succeed.** Travel conditions (crowds, weather, equipment issues) mean that the first attempt at a Tier 1 shot is rarely the best. A professional travel photographer always keeps the final morning for reshots of the best location. Incorporate this into the Day N schedule.

10. **The gear checklist must address carry-on vs. checked luggage explicitly for every camera item.** Camera bodies and lenses should always be in carry-on luggage. A camera bag checked as luggage is at risk for rough handling (mirror misalignment in DSLRs, lens element damage), theft (camera equipment is a known target for baggage theft), and pressure changes. Lithium batteries are prohibited in checked luggage under IATA regulations -- this is not a preference, it is a rule with legal consequences.

---

## Edge Cases

### Smartphone-Only Photographer
Smartphones (current flagship models) have fixed-focal-length equivalent sensors, limited manual exposure control, and excellent computational photography that compensates for physical lens limitations. Adjust the plan as follows:
- Remove all shots requiring focal lengths beyond approximately 65mm equivalent (current phone optical zoom limits range from 3x to 10x depending on model -- verify the user's specific model)
- Recommend the user use the native camera app in "Pro" or "Manual" mode for golden hour and blue hour shots to prevent the automatic HDR from washing out warm tones
- Add composition-focused reminders: rule of thirds, leading lines, and foreground-background layering matter even more on a phone because technical variation is limited
- Include a reference to a clip-on wide-angle or macro lens if the user is serious -- these $20-50 accessories meaningfully expand smartphone capability for architectural and detail shots
- Blue hour and night photography on smartphones: recommend using a mini tabletop tripod (most phones cannot hand-hold below 1/30s without motion blur), or the phone's built-in Night Mode which stacks multiple exposures
- Golden hour light benefits smartphones exactly as much as dedicated cameras -- the light quality, not the camera, is the variable

### Rainy Season or Persistently Overcast Destination
Overcast light eliminates harsh shadows and creates even illumination across subjects -- it is actively superior for markets, portraits, and any scene with significant contrast. Do not treat overcast as a failure mode.
- Shift Tier 1 shots away from panorama and landscape (which require dramatic sky) toward street level and interior subjects (which benefit from diffused light)
- Add: shooting through a rain-wet window (reflections and bokeh), puddle reflections of landmarks, umbrellas as compositional color elements, and empty streets during light rain (people shelter, streets clear)
- For wet conditions: add a waterproof camera cover to the gear list (the $15-25 slip-over covers work for showers; only weather-sealed bodies should be used in sustained rain without additional protection)
- Identify covered shooting locations: covered market halls, glass-roofed shopping arcades, museum atria, and covered bridges that allow shooting outward in rain
- Note that fog, which often accompanies wet weather, creates atmospheric perspective -- a foggy version of a panorama shot can be more compelling than the clear version

### Destination with Significant Photography Restrictions
Some of the world's most photographed destinations have serious restrictions that require upfront research rather than on-arrival discovery.
- **Legal restrictions:** Never recommend photographing military infrastructure, border facilities, or designated government buildings in any country. Consequences range from camera confiscation to detention. In some countries (Ethiopia, North Korea, certain restricted zones), unauthorized photography of specific subjects is a criminal offense.
- **Religious site restrictions:** Establish the rule for each site -- ban all photography, allow exterior only, allow interior without flash, allow photography outside of prayer times only. This is site-specific and must be researched for the destination.
- **Covert photography recommendation is never appropriate:** If a location prohibits photography, the plan must state this and exclude it. Do not suggest angles or techniques for photographing restricted areas covertly.
- **Commercial vs. personal photography:** In many national parks and heritage sites, tripods, monopods, or any support equipment triggers a "commercial photography" classification that requires a permit. Personal handheld photography is usually exempt. Clarify this distinction for any site where it applies.
- **Model releases:** If any of the user's intended photos include identifiable people's faces and the output goal is commercial or publication (not personal/blog), note that model releases may be required -- this crosses into professional photography territory and should be flagged.

### Traveling with Non-Photographers (Partners, Family, Groups)
The photography plan must not colonize the entire trip -- this is the most common complaint non-photographers have about traveling with photographers.
- Apply the "photographer's breakfast" pattern: the solo golden hour session from sunrise to 8:30 AM happens while the non-photographer sleeps. The photographer returns, and shared days start at a reasonable hour. This captures the two most valuable light windows of the day (golden hour AM and blue hour AM) without impacting shared time.
- Identify 3-4 locations where the non-photographer has genuine reasons to be present: scenic viewpoints with seating and a view they will also enjoy, markets with food and shopping, waterfront areas, or cafes within 100 meters of a priority shooting location.
- Establish a "photography limit" per shared session: the photographer gets 15-20 minutes per location during shared time before the group moves on. This is a real social contract that prevents trip-ruining tension.
- Plan the most photography-intensive day (typically Day 2 or Day 3) as a solo or mixed day -- not Day 1 (when the shared excitement of arrival matters) and not the final day (when shared experiences close the trip).

### Short Trip (1-2 Days Only)
A 2-day trip cannot attempt a comprehensive shot list. Ruthless prioritization is required.
- Select maximum 2 Tier 1 anchor shots for the entire trip -- these are the only shots that matter
- Assign one golden hour session per day entirely to one anchor shot (one for AM, one for PM), with no inter-location transitions during light windows
- Skip formal scouting -- go direct to the primary position using pre-researched positioning notes and arrive 20 minutes early to assess
- Build the entire sequence around walking distance clusters -- do not plan any location transitions requiring more than 15 minutes on foot
- Identify the single neighborhood or district that contains the highest density of all shot types and base all activity there
- The gear checklist compresses to: primary lens only (leave the secondary lens in the hotel to reduce carry weight), camera body, 2 batteries, 1 large memory card, no tripod unless the one Tier 1 shot is a blue-hour composition

### Ultra-Wide or Special Equipment Scenarios (Drone, ND Filters, Wide-Angle Primes)
When the user's gear list includes specialized equipment, the plan must address that equipment's specific opportunities and constraints.
- **Drone photography:** Before including any drone shot in the plan, verify the destination's drone regulations in detail. In the European Union, drone operation requires registration and may require a remote pilot certificate depending on the drone's weight class. Many US national parks prohibit drone launch. In many Asian cities, drone flight within 5km of any airport (and many urban areas fall within this radius) is prohibited. If the drone is legally operable: golden hour drone shots of coastal cliffs, agricultural patterns, and urban geometry are achievable in 15-20 minute battery windows; plan drone sessions as their own scheduled blocks accounting for battery swap and FAA/CAA pre-flight checks.
- **Long exposure with ND filters:** A 10-stop ND filter requires a tripod, a remote shutter release or 2-second timer to prevent vibration, and a scene with a moving element (water, clouds, pedestrians). The exposure time at ISO 100 f/8 with a 10-stop ND in bright midday sun is approximately 30-60 seconds -- plan 5-10 minutes per long exposure composition including setup, test exposures, and the exposure itself.
- **Ultra-wide prime (14-20mm full-frame):** Excellent for interior architecture, dramatic foreground-background landscapes, and night sky photography. Creates significant distortion in vertical lines -- foreground elements need to be deliberately placed. At golden hour, an ultra-wide at f/1.8 captures star fields or city lights against the last sky color in 15-30 second exposures.

### Travel Photography at Festivals, Markets, and Crowded Events
Events introduce timing dependencies, high crowd density, and high contrast lighting that require specific planning.
- Identify the specific event timing within the broader festival: the quiet preparation period (often 60-90 minutes before official opening) provides the best photography conditions -- vendors arranging goods, performers in costume without performance energy, and low crowd density
- Crowds themselves are compositional tools -- plan for crowd shots at peak density as well as empty-venue shots at off-hours; both tell different stories of the same event
- High contrast lighting is the dominant challenge at night markets and illuminated festival venues -- expose for the highlights (lit stalls, illuminated decorations) and allow shadows to fall, rather than exposing for the shadows and blowing out the light sources
- At festivals with significant movement (parades, processions, dance performances), minimum shutter speed for stopping subject motion without blur is approximately 1/500s for walking subjects, 1/1000s for fast movement -- account for this in the exposure settings the user's lens and ISO range can support

---

## Example

**Input:** "I'm going to Kyoto, Japan for 6 days in mid-November. I have a Sony A7IV with a 24-70mm f/2.8 GM and a 85mm f/1.8. I love architecture, traditional culture, and available light. My partner is not a photographer. I want portfolio-quality images for a travel blog, maybe 8-10 really strong shots."

---

## Travel Photography Plan

**Destination:** Kyoto, Japan
**Travel Dates:** Mid-November (November 13-18 as reference dates)
**Trip Length:** 6 days
**Gear Summary:** Sony A7IV (full-frame, 33MP) + 24-70mm f/2.8 GM + 85mm f/1.8
**Photography Focus:** Architecture, traditional culture, available light -- in that priority order
**Output Goal:** Travel blog + portfolio (8-10 exceptional shots, not 50 acceptable ones)
**Photography Ratio:** ~3 hours solo per day; remainder shared with non-photographer partner

---

### Light Schedule

| Date | Civil Twilight | Sunrise | Golden Hour AM | Solar Noon | Golden Hour PM | Sunset | Blue Hour PM |
|------|----------------|---------|----------------|------------|----------------|--------|--------------|
| Nov 13 | 6:02 AM | 6:30 AM | 6:30-7:15 AM | 11:50 AM | 4:15-4:55 PM | 4:55 PM | 4:55-5:20 PM |
| Nov 14 | 6:03 AM | 6:31 AM | 6:31-7:16 AM | 11:50 AM | 4:14-4:54 PM | 4:54 PM | 4:54-5:19 PM |
| Nov 15 | 6:04 AM | 6:32 AM | 6:32-7:17 AM | 11:50 AM | 4:13-4:53 PM | 4:53 PM | 4:53-5:18 PM |
| Nov 16 | 6:05 AM | 6:33 AM | 6:33-7:18 AM | 11:50 AM | 4:12-4:52 PM | 4:52 PM | 4:52-5:17 PM |
| Nov 17 | 6:06 AM | 6:34 AM | 6:34-7:19 AM | 11:50 AM | 4:11-4:51 PM | 4:51 PM | 4:51-5:16 PM |
| Nov 18 | 6:07 AM | 6:35 AM | 6:35-7:20 AM | 11:50 AM | 4:10-4:50 PM | 4:50 PM | 4:50-5:15 PM |

**Sun Direction Notes:**
- Golden hour AM: Sun azimuth approximately 115-120° (south-southeast), east-facing temple gates and garden ponds receive direct warm light; south-facing structures are front-lit
- Golden hour PM: Sun azimuth approximately 235-240° (west-southwest), western-facing pagoda facades and pond surfaces light up with warm orange tones
- November mid-Kyoto sunset is extremely compressed -- golden hour is only 40-45 minutes (the sun drops at a relatively steep angle at latitude 35°N). Arrive early, do not adjust tripod position during this window.
- Peak autumn foliage in Kyoto: Typically November 15-25. Mid-November is early peak at most locations -- foliage will be a mix of green-gold-red, not uniformly red yet. Eikan-do and Tofukuji tend to peak 5-7 days later than northern Kyoto temples.
- Moon phase (mid-November 2024 reference): Waning gibbous to third quarter -- insufficient darkness for star photography, but acceptable for moody night shots.
- Weather pattern: November is statistically Kyoto's driest month (average 6 rain days). Morning fog in the Arashiyama bamboo valley occurs approximately 1 in 4 days -- this is an opportunity, not a problem.

---

### Shot List

#### Tier 1 -- Anchor Shots (Schedule around these)
| # | Shot | Location | Time Window | Focal Length | Composition | Challenge | Fallback |
|---|------|----------|-------------|--------------|-------------|-----------|---------|
| A1 | Bamboo grove vertical columns with fog or directional morning light | Arashiyama bamboo path, northern section past the entrance gate | 6:30-7:30 AM | 35-50mm (compressed vertical) | Vertical, low horizon, converging lines of bamboo | Crowds arrive by 8:00 AM -- arriving at 6:30 AM is essential | If fogged out: return at dusk for low-light version with single visitor silhouette |
| A2 | Fushimi Inari torii gates tunnel: lone figure silhouette, warm backlight | Fushimi Inari upper mountain trail, past the third station (Yotsutsuji), approximately 40-minute climb | 4:00-4:50 PM | 35mm | Single figure (partner or stranger) silhouetted walking away through receding red gates | Upper trail is significantly less crowded than entrance; managing a cooperative silhouette requires a patient stranger or your partner walking ahead | If partner unwilling: reshoot at 6:30 AM on Day 5 with 24mm for a wider, architecturally focused version without figure |
| A3 | Kinkakuji (Golden Pavilion) morning reflection with autumn foliage framing | Kinkakuji-cho, reflection pond east bank, northeast corner of pond for diagonal framing | 6:30-7:15 AM | 70mm (compressed reflection, reduces visual noise from other visitors) | Horizontal, reflection at base of frame, foliage in upper right corner | Kinkakuji opens at 9:00 AM -- this shot requires the exterior view from the east-facing street before opening, or scouting the pond reflection shot from the public approach path before gates | Alternate: Ryoanji garden (5-minute walk) opens at 8:00 AM -- rock garden in morning light is a quieter, equally strong shot |

#### Tier 2 -- Supporting Shots
| # | Shot | Location | Optimal Time | Focal Length | Composition | Notes |
|---|------|----------|--------------|--------------|-------------|-------|
| S1 | Geisha or maiko figure walking lantern-lit street | Gion Hanamikoji-dori, evening | 6:00-8:00 PM | 85mm f/1.8 | Medium portrait with bokeh street lights in background, available light only | Never follow, block, or photograph up-close -- use 85mm to capture from a respectful distance. Evening weekday better than weekend |
| S2 | Autumn maples over stone garden path with vermillion lanterns | Eikan-do Zenrinji, east garden path | 10:00-11:30 AM (soft light, no harsh shadows in enclosed garden) | 35mm | Horizontal, path as leading line, lantern as foreground anchor | ¥1,000 entry fee. Peak foliage late November -- may be early on Nov 13-15. Return Nov 16-18 for peak color if applicable |
| S3 | Torii gate forest abstract: geometric repetition detail | Fushimi Inari lower section, dense gate corridors | 6:30-8:30 AM | 70mm (compressed), 85mm | Tight horizontal, gates filling entire frame, exposure on the lit base columns | This is a pattern shot, not a people shot -- shoot before crowds arrive for clean geometry |
| S4 | Temple monk in raked gravel garden | Daitokuji sub-temple (Daisen-in), garden view from covered walkway | 9:00-10:00 AM | 70mm | Medium environmental, monk centered or off-center with gravel raked pattern in foreground | Not all sub-temples are open; Daisen-in and Koto-in are reliably open. Do not photograph if monk appears to be in prayer -- wait |
| S5 | Kamo River at dusk with stone bridge and autumn trees reflecting | Sanjo-bashi or Gojo-bashi, river bank | 4:10-5:10 PM | 24-35mm | Wide horizontal, bridge diagonal, autumn trees upper frame, water reflection lower | Tripod recommended; accessible from city center, no entry fee |
| S6 | Street-level market life in Nishiki Market | Nishiki Ichiba, central corridor | 10:00-11:00 AM | 35mm f/2.8 | Medium, working-from-above vendors or street-level food close-up | Ask before photographing vendors directly. Wider early morning before crowds; market opens 9:00 AM. Do not use flash |
| S7 | Interior temple architecture: wooden beam ceiling with hanging lanterns | Higashi Honganji or Nishi Honganji, main hall | 9:00-11:00 AM | 24mm | Vertical looking up, symmetrical ceiling composition | Tripod may not be allowed inside -- handheld at ISO 3200-6400 with IBIS (A7IV has 5.5-stop IBIS, fully viable at 1/60s with 24mm) |

#### Tier 3 -- Opportunistic Shots (Stay primed for these)
- Temple entrance details: weathered wood textures, engravings on stone lanterns, moss on stone steps -- 70-85mm, close framing, morning sidelight
- Incense smoke rising in temple courtyards: backlit, silhouetted smoke against a dark tree or gate background, 70mm, tight framing
- Autumn leaf single close-up on stone or wood surface after rain or morning dew: 85mm macro range, extreme close, single leaf with water droplets
- Vending machines and modern contrast with traditional street: 24-35mm, wide shot incorporating both elements -- juxtaposition of modern and traditional is a distinctly Japanese visual story
- Elderly visitor in kimono at any shrine: 85mm from distance, moment-focused (bowing, touching incense smoke, walking stone path) -- always from a respectful distance, never approach

---

### Location Scouting Notes

#### Arashiyama Bamboo Grove (Sagano Bamboo Forest)
- **GPS reference:** North of Tenryu-ji garden, between Nonomiya Shrine and Okochi Sanso villa entrance
- **Best shooting position:** Enter at the main Kimono-Hanamichi street entrance and walk approximately 100 meters to where the path curves left -- here the bamboo creates a near-perfect converging line composition. Turn 180° for the reverse angle with the path curving away. The northern section (past the halfway point) is less visited in the early morning.
- **Optimal focal length:** 35-50mm captures the scale of the bamboo and allows the path to disappear into distance; 85mm compresses and abstracts the vertical stalks into a pattern
- **Access:** Public path, free, accessible 24 hours. Tenryu-ji garden (one entry point) opens at 8:30 AM but the main path is separately accessible.
- **Tripod policy:**
