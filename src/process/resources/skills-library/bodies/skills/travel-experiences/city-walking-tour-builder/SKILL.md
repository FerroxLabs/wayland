---
name: city-walking-tour-builder
description: |
  Creates self-guided walking tours with timed segments, turn-by-turn navigation
  notes, and point-of-interest descriptions. Produces a complete walking route
  with estimated times between stops, rest points, and alternate shortcuts.
  Use when the user asks about creating a walking tour of a city, building a
  self-guided neighborhood walk, planning a themed walking route, or organizing
  a sightseeing walk with specific time constraints. Do NOT use for cultural
  site deep dives (use cultural-experience-guide), food tours (use
  food-tourism-planner), or hiking trail planning (use hobbies-crafts skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel itinerary planning step-by-step"
  category: "travel-experiences"
  subcategory: "experiences-activities"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# City Walking Tour Builder

## When to Use

- User asks about creating a walking tour of a city or neighborhood
- User wants a self-guided walking route with timed segments
- User asks about a themed walk (historical, architectural, street art, literary, market)
- User needs a walking tour that fits within a specific time window
- User wants turn-by-turn walking directions between points of interest
- User asks about organizing a walking itinerary for a group
- Do NOT use when: user needs a full multi-day itinerary (use `trip-itinerary-builder`), user wants deep cultural site analysis (use `cultural-experience-guide`), user wants food-focused walking (use `food-tourism-planner`), user needs nature hiking routes (use hobbies-crafts hiking skills)

## Process

1. **Gather walking tour parameters.** Ask the user for:
   - City and neighborhood or area of interest
   - Available time for the walk (1 hour, 2 hours, half-day, full day)
   - Theme or focus (general sightseeing, architecture, history, street art, local life, shopping, photography)
   - Walking fitness level (casual stroller, moderate walker, strong walker comfortable with hills)
   - Group composition (solo, couple, family with children, group with elderly members)
   - Starting point preference (hotel location, transit station, landmark)
   - Must-see items (specific sites or areas the user wants included)
   - Time of day (morning, afternoon, evening -- affects lighting, crowd levels, and what is open)

2. **Design the route structure.** Build the walking tour following these principles:
   - **Loop route preferred:** Start and end at the same point or within easy transit of each other
   - **Walking pace baseline:** 3 km/hour (1.9 mph) for flat terrain, reduce by 30% for hills or cobblestone
   - **Total walking distance:** Match to available time minus stop time. For a 2-hour tour: ~4 km walking + 6-8 stops of 5-10 minutes each
   - **Stop spacing:** 5-10 minutes of walking between stops to maintain interest without fatigue
   - **Direction flow:** Walk toward the best light (morning tours head east or south, afternoon tours head west)
   - **Elevation management:** Place uphill segments early in the route when energy is fresh

3. **Select and sequence points of interest.** For each stop:
   - Stop number and name
   - Type (landmark, viewpoint, hidden gem, historical site, street art, market, park, architectural highlight)
   - Why it matters (one-sentence significance or story)
   - Recommended time at the stop (quick look = 2 minutes, moderate = 5-10 minutes, extended = 15-20 minutes)
   - What to look for (specific architectural detail, inscription, view angle, photo composition)
   - Access notes (exterior only, free interior, paid entry, hours of operation)

4. **Write navigation segments.** Between each stop, provide:
   - Walking direction (turn left, continue straight, cross at the intersection)
   - Street names and landmarks for orientation
   - Estimated walking time and distance
   - What to notice along the way (interesting facades, side streets worth a glance, transition between neighborhoods)
   - Surface and terrain notes (stairs, steep incline, uneven cobblestone, accessible alternate route)

5. **Add practical support.** Include throughout the route:
   - Rest point locations (benches, cafes, parks) at the midpoint and three-quarter point
   - Water and restroom availability markers
   - Shortcut options (where to exit early if fatigued or short on time)
   - Extension options (where to add a detour for those with extra time)
   - Weather contingency (which segments work in rain, where to shelter)

6. **Compile the complete walking tour** with route map description, timed segments, navigation notes, and a summary card that can be referenced while walking.

## Output Format

```
## Self-Guided Walking Tour: [Title]

**City:** [city]
**Neighborhood(s):** [areas covered]
**Theme:** [tour focus]
**Total Distance:** [km / miles]
**Estimated Time:** [hours including stops]
**Difficulty:** [easy / moderate / challenging]
**Best Time:** [morning / afternoon / evening and why]

### Route Overview

**Start:** [starting location with transit access]
**End:** [ending location] ([loop / point-to-point])
**Stops:** [number] points of interest
**Walking time (moving):** [time]
**Stop time (viewing):** [time]

### Quick Reference Card

| Stop | Name | Time at Stop | Walk to Next | Running Total |
|------|------|-------------|-------------|---------------|
| 1 | [name] | [minutes] | [minutes walk] | [cumulative time] |
| 2 | [name] | [minutes] | [minutes walk] | [cumulative time] |
| -- | REST POINT | 10-15 min | -- | [cumulative time] |

### Detailed Route

#### Start: [Location Name]
[How to find the starting point from transit or landmark]

#### Segment 1: Start to Stop 1 ([distance], [time])
**Walk:** [turn-by-turn directions]
**Along the way:** [what to notice]
**Terrain:** [flat / uphill / stairs / cobblestone]

#### Stop 1: [Name]
- **What it is:** [brief description and significance]
- **Time here:** [minutes]
- **Look for:** [specific detail to find or observe]
- **Access:** [exterior only / free interior / paid entry]
- **Photo tip:** [best angle or composition]

#### Segment 2: Stop 1 to Stop 2 ([distance], [time])
**Walk:** [directions]
**Along the way:** [observations]

[Continue for all segments and stops]

### Practical Notes

**Rest Points:**
- [location] at approximately [time into the walk] -- [bench / cafe / park]

**Water and Restrooms:**
- [location] -- [type and access]

**Shortcut Option:**
- After Stop [N], you can exit the tour at [location] ([transit access])

**Extension Option:**
- After Stop [N], add a [time] detour to [location] for [what to see]

**Rain Plan:**
- [covered alternatives or sheltered route sections]
```

## Rules

1. NEVER estimate walking times based on straight-line distance -- use realistic street-level routing with turns and crossings
2. ALWAYS include walking time AND stop time as separate figures so the user can adjust pace
3. ALWAYS provide turn-by-turn navigation using street names and visible landmarks, not coordinates
4. Include at least one rest point with seating for every 60 minutes of total tour time
5. Note terrain hazards (stairs, steep hills, uneven surfaces, no sidewalk) for every segment
6. Provide a shortcut option for exiting the tour early at the midpoint
7. Every stop must include a specific "look for" detail -- never just say "admire the building"
8. Limit paid-entry stops to a maximum of 2 per tour -- walking tours should be primarily exterior
9. Include estimated total walking distance in both kilometers and miles
10. Note which stops are weather-dependent (outdoor viewpoints, gardens) and which work in any weather

## Edge Cases

- **Family with young children (under 6):** Reduce total distance to 2 km maximum. Space stops no more than 5 minutes of walking apart. Include at least one playground or open space where children can run. Recommend stroller accessibility for every segment or note where a stroller cannot go. Keep total tour time under 90 minutes including generous stop times.

- **Mobility limitations (wheelchair, walker, limited stairs):** Note every segment with stairs, steep grades (above 8%), or narrow passages. Provide an accessible alternate route for each inaccessible segment. Mark stops that require climbing to reach. Some historic districts have entirely flat routes through the main streets -- prioritize these.

- **Evening or night tour:** Adjust stop selection to locations that are interesting after dark (illuminated buildings, lively squares, viewpoints with city lights). Note which streets are well-lit and well-trafficked vs. quiet and dark. Include safety notes about carrying valuables and walking in unfamiliar areas after dark.

- **Very limited time (under 1 hour):** Create a focused micro-tour of 3-4 stops within a single neighborhood. Eliminate transit time between distant areas. Focus on the single most distinctive area rather than trying to cover the whole city. Walking distance should be under 1.5 km.

- **Large group (8+ people):** Note which sidewalks and passages are too narrow for groups. Suggest splitting into pairs at narrow sections. Choose stops with enough space for the group to gather without blocking pedestrians. Walking pace slows by 20-30% for large groups -- adjust time estimates accordingly.

## Example

**Input:** "I have a free morning in Prague, about 3 hours. I love architecture and history. I'm staying near the Old Town Square. Moderate fitness, comfortable with some hills."

**Output:**

## Self-Guided Walking Tour: Prague Historic Architecture Walk

**City:** Prague, Czech Republic
**Neighborhood(s):** Old Town, Jewish Quarter, Lesser Town approach
**Theme:** Architecture through the centuries -- Gothic, Baroque, Art Nouveau, Cubist
**Total Distance:** 4.5 km / 2.8 miles
**Estimated Time:** 3 hours (1 hour 45 min walking + 1 hour 15 min at stops)
**Difficulty:** Moderate (one sustained uphill, mostly flat cobblestone)
**Best Time:** Morning 8:00-11:00 AM (fewer crowds at major sites, good eastern light on facades)

### Route Overview

**Start:** Old Town Square (southeast corner, near the Astronomical Clock)
**End:** Old Town Square (loop route)
**Stops:** 8 points of interest
**Walking time (moving):** 1 hour 45 minutes
**Stop time (viewing):** 1 hour 15 minutes

### Quick Reference Card

| Stop | Name | Time at Stop | Walk to Next | Running Total |
|------|------|-------------|-------------|---------------|
| 1 | Astronomical Clock and Old Town Hall | 10 min | 8 min walk | 18 min |
| 2 | Church of Our Lady before Tyn | 10 min | 6 min walk | 34 min |
| 3 | Jewish Quarter street facades | 10 min | 10 min walk | 54 min |
| 4 | Art Nouveau hotel district | 8 min | 12 min walk | 1 hr 14 min |
| -- | REST POINT: riverside bench | 10 min | -- | 1 hr 24 min |
| 5 | Charles Bridge tower and statues | 15 min | 8 min walk | 1 hr 47 min |
| 6 | Lesser Town square and Baroque facades | 10 min | 10 min walk | 2 hr 7 min |
| 7 | Cubist lamp post and house | 8 min | 15 min walk | 2 hr 30 min |
| 8 | Powder Tower and Municipal House | 10 min | 8 min walk back to start | 2 hr 48 min |

### Detailed Route

#### Start: Old Town Square, Southeast Corner

Find the Astronomical Clock tower on the south side of Old Town Square. Stand facing the clock from the square (you will be looking south). This is your starting point.

#### Segment 1: Start to Stop 1 (0 m, immediate)
**Walk:** You are already here. Face the clock.
**Terrain:** Flat cobblestone square, wide open space

#### Stop 1: Astronomical Clock and Old Town Hall Tower
- **What it is:** The oldest operating astronomical clock in the world, installed in 1410. The tower dates to 1338. Gothic and Renaissance elements blend across the facade.
- **Time here:** 10 minutes
- **Look for:** The clock has three components -- the astronomical dial (middle, blue and gold) showing the position of the sun and moon, the calendar dial (bottom, painted months), and the procession of apostles (top windows, on the hour). Below the astronomical dial, find the four flanking figures: Vanity (holding a mirror), Greed (holding a purse), Death (the skeleton), and the Turk (shaking his head).
- **Access:** Exterior viewing free; tower climb for panoramic view is paid entry (~$5, 15 min if queue is short)
- **Photo tip:** Stand back 10 meters for a full clock face composition. If the hour is approaching, position yourself for the apostle procession.

#### Segment 2: Stop 1 to Stop 2 (200 m, 3 min)
**Walk:** From the clock, turn around to face north across the square. Walk directly across toward the two dark Gothic spires visible on the north side of the square. Cross the square diagonally toward the church entrance.
**Along the way:** Notice the Jan Hus Memorial in the center of the square (Art Nouveau monument from 1915). The pastel Baroque and Rococo merchant houses lining the square represent 400 years of architectural layering.
**Terrain:** Flat cobblestone

#### Stop 2: Church of Our Lady Before Tyn
- **What it is:** The dominant Gothic landmark of Old Town, with twin 80-meter spires. Construction began in the 14th century. The asymmetrical spires (the "male" wider spire and "female" narrower spire) are deliberate.
- **Time here:** 10 minutes (exterior)
- **Look for:** The church is hidden behind a row of houses -- you cannot see the full facade from the square. Look for the tympanum (triangular element between the spires) featuring a golden Madonna and Child. The church entrance is through the arcade of the house in front (look for a narrow passage on the left side).
- **Access:** Exterior free, interior free during open hours (check for service times)
- **Photo tip:** Shoot the spires framed between the merchant houses from the center of the square for the classic composition

#### Segment 3: Stop 2 to Stop 3 (450 m, 6 min)
**Walk:** From the church, walk north along Dlouha street (behind the church, heading away from the square). After 200 meters, turn left onto Kozí street. Continue to the edge of the Jewish Quarter (Josefov).
**Along the way:** Transition from Gothic Old Town to the 19th-century reconstruction of the Jewish Quarter. Notice how the building scale and style changes abruptly at the neighborhood boundary.
**Terrain:** Flat cobblestone, narrow sidewalks

#### Stop 3: Jewish Quarter Street Facades
- **What it is:** When the Jewish Quarter was rebuilt in the 1890s-1900s, the new buildings were constructed in a historicist mix of Neo-Renaissance, Neo-Baroque, and Art Nouveau styles. The streetscape is one of the most architecturally dense in Europe.
- **Time here:** 10 minutes
- **Look for:** Stand at the corner of Pařížská street and look down the boulevard. Every building is different yet harmonious. Find the ornamental stucco faces above the windows (mascarons), the wrought-iron balcony railings, and the ceramic tile details on the Art Nouveau buildings. The facades were designed as a complete ensemble even though individual architects designed each building.
- **Access:** Exterior free (the synagogues and cemetery are paid entry -- skip for this architecture-focused walk)
- **Photo tip:** Low angle looking up captures the ornamental details against the sky

#### Segment 4: Stop 3 to Stop 4 (500 m, 8 min)
**Walk:** Continue north on Pařížská street toward the river. At the end of the boulevard, you will see the Vltava River. Turn right and walk along the river embankment.
**Along the way:** Pařížská is the most expensive street in Prague (luxury retail). The tree-lined boulevard terminates in a river view that was designed into the urban plan.
**Terrain:** Flat, wide sidewalks

#### Stop 4: Art Nouveau Hotel District
- **What it is:** The riverfront area features outstanding Art Nouveau facades from the early 1900s. The large hotel buildings on this stretch showcase the organic curves, floral motifs, and mosaic decorations typical of Czech Art Nouveau.
- **Time here:** 8 minutes
- **Look for:** Ceramic mosaic panels above the ground floor (often depicting allegorical figures), curved balcony railings with organic plant-like ironwork, and the custom typography on the building name plates. Czech Art Nouveau is more geometric than French Art Nouveau -- notice the structured lines within the organic forms.
- **Access:** Exterior free, walk slowly along the embankment
- **Photo tip:** Morning light hits these east-facing facades directly -- ideal for color and detail

#### REST POINT: Riverside Bench (10-15 minutes)
**Location:** Benches line the river embankment between the Art Nouveau district and Charles Bridge. Sit, hydrate, and look across the river at the castle silhouette. Restrooms available at nearby restaurants for customers (order a coffee).

#### Segment 5: Rest to Stop 5 (350 m, 5 min)
**Walk:** Continue south along the river embankment toward the towers visible ahead. The Charles Bridge entrance is the large Gothic tower at the end of the embankment path.
**Terrain:** Flat, wide path

#### Stop 5: Charles Bridge Tower and Statues
- **What it is:** The 14th-century stone bridge with 30 Baroque statues. The Old Town Bridge Tower is considered one of the finest Gothic gateways in Europe.
- **Time here:** 15 minutes
- **Look for:** On the bridge tower facade, find the carved kingfisher (symbol of peace) above the archway. On the bridge itself, the 8th statue on the right (St. John of Nepomuk) is identifiable by the brass plaque rubbed gold by tourists touching it for luck. The bridge was originally a 10-meter-wide road -- look for the groove marks from centuries of cart wheels.
- **Access:** Bridge free; tower climb is paid entry (~$5)
- **Photo tip:** The best view of the bridge tower is from 20 meters back on the approach. On the bridge, shoot toward the castle with the statues framing the view.

#### Segment 6: Stop 5 to Stop 6 (400 m, 8 min)
**Walk:** Cross the Charles Bridge. At the far end, pass through the Lesser Town Bridge Tower and continue straight on Mostecká street to the Lesser Town Square.
**Along the way:** Notice the transition from Old Town architecture to the Baroque Lesser Town. The building colors shift to ochre, cream, and pale green.
**Terrain:** Flat cobblestone, bridge is flat but crowded -- walk at crowd pace

#### Stop 6: Lesser Town Square and Baroque Facades
- **What it is:** The central square of the Lesser Town (Malá Strana), dominated by the Baroque St. Nicholas Church. This neighborhood was largely rebuilt in Baroque style after a devastating fire in 1541.
- **Time here:** 10 minutes
- **Look for:** The St. Nicholas Church dome is the largest Baroque dome in Prague. The square is divided into upper and lower sections by the church. The palace facades around the square feature Baroque ornamentation -- look for the sculpted door portals with coats of arms and the elaborate window surrounds on the upper floors.
- **Access:** Square is free; church interior is paid entry (~$4) but the exterior and square are the architecture focus
- **Photo tip:** From the lower square, shoot the dome framed by the palace facades

#### Segment 7: Stop 6 to Stop 7 (1.2 km, 15 min)
**Walk:** Return across the Charles Bridge (retrace). After the Old Town Bridge Tower, turn left and walk south along the river briefly, then turn left onto Husova street. Follow Husova to the intersection with Betlémské Námstí.
**Along the way:** Husova street passes through the oldest part of the Old Town with a mix of Romanesque cellars (below current street level), Gothic ground floors, and later additions above.
**Terrain:** Flat cobblestone, narrow street sections

**SHORTCUT EXIT: After crossing the Charles Bridge back to Old Town, turn right on Karlova street and walk directly back to Old Town Square (5 minutes). This cuts the tour to approximately 2 hours.**

#### Stop 7: Cubist Lamp Post and House of the Black Madonna
- **What it is:** Prague is the only city in the world with Cubist architecture (applied the Cubist art movement to building design, 1910-1914). The House of the Black Madonna is the most famous example. Nearby, a Cubist-designed street lamp post demonstrates how the movement extended to urban furniture.
- **Time here:** 8 minutes
- **Look for:** The building facade uses angular, faceted surfaces instead of smooth planes -- as if the building was sculpted from crystal. Find the Black Madonna statue (a small dark figure in a cage) on the corner of the building at the second floor. The lamp post uses triangular geometry instead of the Art Nouveau curves you saw earlier.
- **Access:** Exterior free; interior has a Cubist cafe and museum (paid, allow 30 min if entering)
- **Photo tip:** Shoot the facade from across the intersection for the full angular effect

#### Segment 8: Stop 7 to Stop 8 (400 m, 6 min)
**Walk:** From the House of the Black Madonna, walk northeast along Celetná street (a straight pedestrian shopping street). The Powder Tower is visible at the end of the street.
**Along the way:** Celetná is the oldest street in Prague, part of the Royal Coronation Route. Every building facade has been updated over centuries but the street plan is medieval.
**Terrain:** Flat, wide pedestrian street

#### Stop 8: Powder Tower and Municipal House
- **What it is:** The Powder Tower (1475) is a Gothic gate and the formal entry to the Old Town. Immediately adjacent, the Municipal House (1912) is the masterpiece of Prague Art Nouveau. The juxtaposition of 15th-century Gothic and early-20th-century Art Nouveau is the perfect final stop.
- **Time here:** 10 minutes
- **Look for:** On the Powder Tower, the carved heraldic symbols and Gothic tracery. On the Municipal House, the massive mosaic above the entrance (depicting allegories of Czech national pride) and the ironwork canopy over the entrance. The building interior is lavishly decorated (accessible via guided tour or by visiting the cafe inside).
- **Access:** Exterior free; Powder Tower climb ~$5; Municipal House guided tour ~$10
- **Photo tip:** Stand where the two buildings nearly touch and shoot upward to capture the Gothic-vs-Art Nouveau contrast in a single frame

#### Return: Stop 8 to Start (300 m, 5 min)
**Walk:** From the Powder Tower, walk west on Celetná street. Continue straight back to Old Town Square (this is the same street you just walked, but continue past the House of the Black Madonna). The square appears ahead within 5 minutes.

### Practical Notes

**Rest Points:**
- Riverside bench at approximately 1 hour 15 min into the walk (after Stop 4)
- Lesser Town Square (Stop 6) has cafe seating at the 2-hour mark

**Water and Restrooms:**
- Public restrooms at Old Town Square (paid, small fee) at start and end
- Cafes along the riverfront and in Lesser Town Square for customers

**Shortcut Option:**
- After Stop 5 (Charles Bridge), skip the Lesser Town and return directly to Old Town Square via Karlova street (5 min). Reduces tour to approximately 2 hours and 3 km.

**Extension Option:**
- At Stop 6 (Lesser Town), climb Nerudova street toward the castle district (25-minute uphill walk) for panoramic views and Renaissance house signs. Adds 45-60 minutes.

**Rain Plan:**
- Stops 1-3 and 7-8 are in covered or sheltered areas. The riverfront (Stops 4-5) and Lesser Town (Stop 6) are exposed. In heavy rain, do Stops 1-3 and 7-8 as a shortened indoor-adjacent tour of approximately 1.5 hours.
