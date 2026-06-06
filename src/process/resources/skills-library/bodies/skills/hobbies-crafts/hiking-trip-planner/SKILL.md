---
name: hiking-trip-planner
description: |
  Plans day hikes and overnight backpacking trips with trail selection criteria, distance and elevation analysis, gear checklists, and safety preparation sequences. Gathers the user's fitness level, location, group size, and trip duration to produce a complete hiking plan with gear list and safety protocol.
  Use when the user asks about planning a hike, choosing a trail, building a hiking gear list, or preparing for a backpacking trip.
  Do NOT use for competitive trail running (use beginner-running-plan), mountaineering or technical climbing, wilderness survival training, or outdoor gear purchasing decisions (use outdoor-gear-selection-guide).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "hiking planning checklist step-by-step"
  category: "hobbies-crafts"
  subcategory: "outdoor-recreation"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Hiking Trip Planner

## When to Use

**Use this skill when:**
- User asks about planning a day hike or overnight backpacking trip
- User wants help choosing a trail based on fitness level and preferences
- User needs a gear checklist for hiking
- User asks about safety preparation for a hike
- User wants to plan a group hiking outing
- User mentions trail selection, elevation gain, or difficulty ratings

**Do NOT use when:**
- User asks about competitive trail running or race training (use `beginner-running-plan`)
- User needs mountaineering or technical climbing guidance
- User asks about long-distance thru-hiking logistics (multi-week trips)
- User wants to compare and purchase specific gear brands (use `outdoor-gear-selection-guide`)
- User asks about wilderness survival skills beyond standard hiking safety

## Process

1. **Gather trip parameters.** Ask the user for:
   - Trip type: day hike (under 8 hours) or overnight backpacking (1-3 nights)
   - Location or region (state, national park, or general area)
   - Group composition: number of hikers, ages, any children or dogs
   - Fitness level: sedentary (rarely walks more than 1 mile), moderate (walks 3-5 miles regularly), fit (exercises 3+ times per week), experienced hiker
   - Desired difficulty: easy (flat terrain, well-marked), moderate (some elevation, uneven terrain), strenuous (significant elevation gain, rough terrain)
   - Season and expected weather conditions
   - Any physical limitations or accessibility requirements

2. **Select trail criteria.** Based on user inputs, define the target trail profile:
   - **Distance range by fitness level:**
     - Sedentary: 2-4 miles round trip, under 500 ft elevation gain
     - Moderate: 4-8 miles round trip, 500-1,500 ft elevation gain
     - Fit: 6-12 miles round trip, 1,500-3,000 ft elevation gain
     - Experienced: 8-15+ miles round trip, 2,000-4,000+ ft elevation gain
   - **Elevation gain per mile targets:**
     - Easy: under 250 ft/mile
     - Moderate: 250-500 ft/mile
     - Strenuous: 500-1,000 ft/mile
     - Very strenuous: over 1,000 ft/mile
   - **Trail surface considerations:** paved, gravel, dirt, rocky, scramble sections
   - **Water source availability:** critical for trips over 4 hours or in hot weather
   - **Trail traffic level:** popular (well-maintained, easy to follow) vs. remote (navigation skills needed)

3. **Estimate hiking time.** Calculate expected duration using Naismith's Rule:
   - Base pace: 3 miles per hour on flat terrain
   - Add 30 minutes for every 1,000 ft of elevation gain
   - Add 10 minutes for every 1,000 ft of steep descent
   - Adjust for group: add 20% for groups with children, 10% for groups over 4 people
   - Add break time: 10 minutes per hour for day hikes, 15 minutes per hour for backpacking
   - Round up to nearest 30 minutes for the final estimate

4. **Build the gear checklist.** Generate a categorized gear list based on trip type:
   - **Day hike essentials (the Ten Essentials framework):**
     - Navigation: map of the area, compass or GPS device
     - Sun protection: sunscreen SPF 30+, sunglasses, hat
     - Insulation: extra layer appropriate to conditions
     - Illumination: headlamp with fresh batteries
     - First aid: basic first aid kit
     - Fire: lighter or waterproof matches (emergency use)
     - Repair tools: knife or multi-tool, duct tape
     - Nutrition: trail snacks (200-300 calories per hour of hiking)
     - Hydration: minimum 0.5 liters per hour of hiking, plus 0.5 liter reserve
     - Emergency shelter: emergency bivy or space blanket
   - **Overnight additions:**
     - Shelter: tent or hammock system with rain fly
     - Sleep system: sleeping bag rated 10 degrees below expected low, sleeping pad (R-value 3+ for 3-season)
     - Cook system: stove, fuel, pot, utensils, food for each meal plus one extra meal
     - Water treatment: filter, purifier, or chemical treatment
     - Clothing: complete change of base layer, camp shoes
     - Hygiene: toilet trowel, biodegradable soap, hand sanitizer

5. **Create safety preparation sequence.** Build a timeline of pre-trip safety steps:
   - **7 days before:**
     - Check trail conditions and closures with the local land management agency
     - Review weather forecast for the trip dates
     - Confirm group members and share the plan
   - **3 days before:**
     - Charge all electronic devices
     - Check first aid kit supplies and replace expired items
     - Verify vehicle parking requirements (permits, fees)
   - **1 day before:**
     - File a trip plan with someone not on the hike (route, expected return time, emergency contacts)
     - Check final weather forecast
     - Pack all gear and verify water and food quantities
     - Set a turnaround time: the latest time to turn back regardless of progress
   - **Morning of hike:**
     - Eat a high-carbohydrate breakfast 1-2 hours before start
     - Confirm trail conditions have not changed overnight
     - Do a 5-minute gear check at the trailhead before departing

6. **Define turnaround rules.** Establish non-negotiable turnaround criteria:
   - Turnaround time reached (set at 50% of available daylight for day hikes)
   - Any group member shows signs of heat exhaustion, hypothermia, or altitude sickness
   - Weather deteriorates beyond safe conditions (lightning within 6 miles, visibility under 100 feet)
   - Trail conditions are materially worse than expected (washouts, downed trees blocking route)
   - Water supply drops below 0.5 liters per person with no refill source ahead

## Output Format

```
## Hiking Trip Plan

### Trip Overview
| Parameter          | Value                          |
|--------------------|--------------------------------|
| Trip type          | [Day hike / Overnight]         |
| Location           | [Trail name and area]          |
| Distance           | [X miles round trip]           |
| Elevation gain     | [X ft total]                   |
| Estimated duration | [X hours including breaks]     |
| Difficulty rating  | [Easy / Moderate / Strenuous]  |
| Group size         | [X hikers]                     |
| Season             | [Season and expected weather]  |

### Trail Selection Criteria
- Distance range: [X-X miles based on fitness level]
- Max elevation gain: [X ft based on difficulty]
- Surface type: [paved / dirt / rocky]
- Water sources: [available / carry all water]
- Trail traffic: [popular / moderate / remote]

### Estimated Timeline
| Time     | Activity                              |
|----------|---------------------------------------|
| [HH:MM]  | Depart trailhead                      |
| [HH:MM]  | Reach [landmark 1]                    |
| [HH:MM]  | Break at [location]                   |
| [HH:MM]  | Reach [turnaround point / campsite]   |
| [HH:MM]  | Begin return / set up camp            |
| [HH:MM]  | Return to trailhead                   |
| [HH:MM]  | **Turnaround time (non-negotiable)**  |

### Gear Checklist
#### Navigation & Safety
- [ ] [Item 1]
- [ ] [Item 2]

#### Clothing & Insulation
- [ ] [Item 1]
- [ ] [Item 2]

#### Food & Water
- [ ] [Item 1 with quantity]
- [ ] [Item 2 with quantity]

#### [Overnight: Shelter & Sleep]
- [ ] [Item 1]
- [ ] [Item 2]

### Safety Protocol
#### Pre-Trip (7 Days Out)
- [ ] [Action 1]
- [ ] [Action 2]

#### Pre-Trip (1 Day Out)
- [ ] [Action 1]
- [ ] [Action 2]

#### Turnaround Rules
1. [Rule 1]
2. [Rule 2]
3. [Rule 3]

### Emergency Information
- Trip plan filed with: [Name, phone number]
- Nearest emergency services: [Location]
- Emergency contact: [Name, phone number]
```

## Rules

1. NEVER recommend a trail distance or elevation gain that exceeds the user's stated fitness level by more than one category
2. ALWAYS include turnaround time and turnaround rules in every hiking plan
3. ALWAYS include water quantity calculations based on trip duration and conditions
4. Calorie estimates for snacks must use 200-300 calories per hour of active hiking as the baseline
5. Water estimates must use 0.5 liters per hour as the minimum baseline, increasing to 0.75-1.0 liters per hour in temperatures above 80F or at elevations above 7,000 ft
6. Gear checklists must follow the Ten Essentials framework as the minimum for every day hike
7. Overnight trip plans must include water treatment method, not just water quantity
8. Time estimates must use Naismith's Rule with adjustments for group composition
9. NEVER suggest hiking alone in remote areas without explicit acknowledgment of additional solo hiking risks
10. Safety preparation must include filing a trip plan with a non-participant
11. If the user mentions children under 10, reduce recommended distance by 40% and elevation gain by 50%
12. If the user mentions dogs, note leash requirements and water needs for the animal (dogs need approximately 1 oz of water per pound of body weight per day of active hiking)

## Edge Cases

- **Complete beginner who has never hiked:** Recommend a 1-3 mile round trip on a well-maintained, popular trail with under 300 ft elevation gain. Suggest going on a weekday or early morning to avoid crowds. Include a note about breaking in footwear at least 1 week before the hike with shorter walks.

- **Hiking with young children (under 6):** Reduce distance to 1-2 miles maximum. Plan for frequent stops every 15-20 minutes. Recommend trails with interesting features (streams, rock formations, wildlife viewing areas) to maintain engagement. Estimate pace at 0.5-1 mile per hour. Include child-specific gear: child carrier for under-3, extra snacks, extra water, change of clothes, sun hat.

- **Hot weather hiking (over 90F):** Double the water estimate to 1.0 liter per hour minimum. Recommend starting before 7 AM or after 4 PM. Include electrolyte replacement in the gear list. Reduce distance recommendation by 25%. Add heat exhaustion warning signs to the safety protocol: headache, nausea, dizziness, excessive sweating followed by dry skin.

- **Winter or cold weather hiking:** Add cold-weather gear to checklist: insulated layers, waterproof outer shell, hand warmers, traction devices (microspikes) if ice is possible. Reduce available daylight calculation. Note that cold weather increases calorie burn by 10-40%. Increase food recommendations accordingly. Water still freezes: insulate water bottles or use an insulated hydration bladder.

- **High altitude hiking (above 8,000 ft):** Recommend acclimatization: arrive at altitude 1-2 days before a strenuous hike if traveling from near sea level. Reduce distance estimates by 20% and increase water to 0.75 liters per hour. Note altitude sickness symptoms: headache, nausea, shortness of breath disproportionate to exertion. Turnaround rule: descend immediately if any group member shows altitude sickness symptoms.

- **Solo hiking:** Include additional solo-specific safety steps: share real-time GPS location with an emergency contact, carry a personal locator beacon or satellite messenger for remote areas, avoid trails with technical scramble sections. Note that solo hiking in remote areas carries substantially higher risk.

## Example

**Input:** "I want to plan a day hike for this Saturday. I'm in the Denver, Colorado area. It'll be me and my partner -- we both exercise regularly but haven't done much hiking. It's early October."

**Output:**

## Hiking Trip Plan

### Trip Overview
| Parameter          | Value                                          |
|--------------------|-------------------------------------------------|
| Trip type          | Day hike                                        |
| Location           | Front Range trails near Denver, CO              |
| Distance           | 5-7 miles round trip                            |
| Elevation gain     | 1,000-1,500 ft total                            |
| Estimated duration | 3.5-4.5 hours including breaks                  |
| Difficulty rating  | Moderate                                        |
| Group size         | 2 hikers                                        |
| Season             | Early October -- expect 40-65F, possible afternoon showers |

### Trail Selection Criteria
- Distance range: 5-7 miles (fit but new to hiking -- moderate tier with slight reduction)
- Max elevation gain: 1,500 ft (moderate difficulty, accounts for altitude adjustment)
- Surface type: Dirt and rocky -- standard Front Range conditions
- Water sources: Carry all water (most Front Range day hike trails lack reliable water sources in October)
- Trail traffic: Popular to moderate -- well-marked trails recommended for first hikes
- Altitude note: Denver-area trailheads start at 5,500-8,500 ft. If you are visiting from a lower elevation, choose a trailhead below 7,500 ft and allow 1 day for acclimatization

### Estimated Timeline
| Time    | Activity                                        |
|---------|-------------------------------------------------|
| 7:30 AM | Depart trailhead (early start for best weather) |
| 8:45 AM | Reach midpoint landmark -- 10-minute break      |
| 9:30 AM | Reach turnaround point or summit                |
| 9:45 AM | Begin return                                    |
| 11:15 AM| Return to trailhead                             |
| 12:00 PM| **Turnaround time (non-negotiable)**            |

### Gear Checklist
#### Navigation & Safety
- [ ] Trail map (downloaded offline -- cell service unreliable on many Front Range trails)
- [ ] Headlamp with fresh batteries
- [ ] Basic first aid kit
- [ ] Emergency space blanket
- [ ] Lighter or waterproof matches
- [ ] Multi-tool or knife

#### Clothing & Insulation
- [ ] Moisture-wicking base layer top
- [ ] Insulating mid-layer (fleece or light puffy jacket -- October mornings are cold at altitude)
- [ ] Windproof and water-resistant outer shell
- [ ] Hiking pants or athletic pants (no cotton)
- [ ] Wool or synthetic hiking socks
- [ ] Broken-in hiking shoes or trail runners with ankle support
- [ ] Sun hat and warm beanie (temperature swings are large in October)
- [ ] Gloves (lightweight)

#### Food & Water
- [ ] 2 liters of water per person (4 liters total)
- [ ] Trail mix or energy bars: 3-4 per person (800-1,200 calories total)
- [ ] Electrolyte packets: 1 per person
- [ ] Small lunch or substantial snack for the turnaround point

#### Sun Protection
- [ ] Sunscreen SPF 30+ (UV is stronger at altitude)
- [ ] Sunglasses with UV protection

### Safety Protocol
#### Pre-Trip (7 Days Out)
- [ ] Check trail conditions on the local ranger district or trail-reporting community
- [ ] Review the 10-day weather forecast for the specific trailhead elevation
- [ ] Confirm Saturday availability for both hikers

#### Pre-Trip (1 Day Out)
- [ ] File trip plan with a friend or family member: trail name, trailhead location, expected departure and return times, vehicle description
- [ ] Check final weather forecast -- postpone if thunderstorms are forecast before noon
- [ ] Pack all gear and verify water and snack quantities
- [ ] Charge phones fully

#### Morning of Hike
- [ ] Eat a high-carbohydrate breakfast by 6:30 AM
- [ ] Do a 5-minute gear check at the trailhead
- [ ] Confirm turnaround time: 12:00 PM regardless of progress

#### Turnaround Rules
1. Turn back at 12:00 PM regardless of how far you have hiked
2. Turn back immediately if either hiker experiences headache with nausea or dizziness (possible altitude sickness -- descend to lower elevation)
3. Turn back if thunder is audible or lightning is visible -- descend below treeline immediately and avoid ridgelines
4. Turn back if water supply drops below 0.5 liters per person with more than 2 miles remaining

### Emergency Information
- Trip plan filed with: [Name and phone number -- fill in before Saturday]
- Nearest emergency services: [Varies by trailhead -- look up closest hospital to your chosen trail]
- In case of emergency: Call 911. Most Front Range trailheads have cell service at the parking area even if coverage is intermittent on the trail
