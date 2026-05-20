---
name: activity-planner
description: |
  Age-appropriate activity planning for children covering indoor/outdoor activities, educational and STEM projects, sensory play, seasonal ideas, and budget-friendly options organized by developmental stage.
  Use when the user asks about activity planner, or needs help with age-appropriate activity planning for children covering indoor/outdoor activities, educational and stem projects, sensory play, seasonal ideas, and budget-friendly options organized by developmental stage.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of activity planner.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "parenting family-events planning"
  category: "family-relationships"
  subcategory: "parenting"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Activity Planner

## When to Use

**Use this skill when:**
- User asks about activity planner
- User needs guidance on activity planner topics
- User wants a structured approach to activity planner

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Overview

This skill generates tailored activity recommendations for children based on their age, interests, available resources, setting, and developmental goals. Activities are grounded in early childhood education principles including Montessori, Reggio Emilia, and play-based learning research.

## Questions to Ask the User First

Before recommending activities, gather the following:

1. **How old is the child (or children)?** (Include all children if planning for multiple ages)
2. **Indoor or outdoor?** (Or both?)
3. **What's the weather/season?** (Current conditions and location climate)
4. **How much time do you have?** (15 minutes, 1 hour, half day, full day)
5. **What's your budget?** ($0 pantry items only, $0-10, $10-25, $25+)
6. **How many children?** (Solo, sibling group, playdate, party-sized group)
7. **Any special interests?** (Dinosaurs, space, animals, art, cooking, etc.)
8. **Any developmental goals?** (Fine motor, social skills, reading readiness, etc.)
9. **Supervision level available?** (Fully hands-on, nearby, independent play)
10. **Any materials to avoid?** (Allergies, sensory sensitivities, mess tolerance)

## Activity Selection Framework

### Age-Appropriate Activity Matrix

```
ACTIVITY SUITABILITY SCORING:

For each activity, evaluate:
  [S] Safety: Is it safe for this age? (required pass)
  [D] Development: Does it match developmental stage? (1-5)
  [E] Engagement: Will it hold interest for the time needed? (1-5)
  [A] Accessibility: Do you have materials/space? (1-5)
  [L] Learning: Does it build skills? (1-5)

Score = (D + E + A + L) / 4  -->  Recommend if >= 3.5
```

## Activities by Age Group

### Infant Activities (0-12 Months)

**Sensory Exploration:**
- High-contrast card viewing (0-3 months)
- Texture boards with fabric swatches (3-6 months)
- Water play in shallow bin with supervision (6-9 months)
- Taste-safe sensory bins: cooked pasta, mashed banana, gelatin (9-12 months)
- Musical shaker bottles (sealed, large enough to not be a choking hazard)

**Motor Development:**
- Tummy time with mirrors and toys just out of reach
- Reaching and grasping: dangling scarves, soft toys
- Cruising stations: furniture arranged for safe pulling up
- Ball rolling back and forth (early turn-taking)
- Stacking and knocking down soft blocks

**Language Building:**
- Narrate everything: "I'm putting on your blue sock"
- Sing action songs: Itsy Bitsy Spider, Pat-a-Cake
- Read board books with exaggerated expression
- Play peekaboo (object permanence development)
- Point and name objects during walks

### Toddler Activities (1-3 Years)

**Sensory Play:**

| Activity | Materials | Skills Built | Mess Level |
|----------|-----------|-------------|------------|
| Cloud dough | Flour + baby oil | Fine motor, sensory | High |
| Water transfer | Cups, sponges, bowls | Fine motor, pouring | Medium |
| Finger painting | Paint, paper, smocks | Creative expression | High |
| Playdough kitchen | Playdough, cookie cutters | Fine motor, pretend play | Low |
| Nature collage | Leaves, sticks, glue, paper | Sensory, art, nature | Medium |
| Rice bin | Dyed rice, scoops, containers | Sensory, fine motor | Medium |
| Shaving cream play | Shaving cream on tray | Sensory, pre-writing | Medium |

**Gross Motor:**
- Obstacle course: pillows, tunnels, chairs to crawl under
- Dance party with freeze dance
- Ball pit in inflatable pool or laundry basket
- Riding toys and push toys
- Climbing (supervised): playground, indoor climbers
- Bubble chasing outdoors

**Pre-Academic (Play-Based):**
- Color sorting with pom-poms and muffin tin
- Shape puzzles and shape sorters
- Counting steps, snacks, toys during daily activities
- Letter magnets on fridge (exposure, not drilling)
- Matching games with household objects

### Preschool Activities (3-5 Years)

**STEM Activities:**

```
Activity: Volcano Eruption
Age: 3-5
Materials: Baking soda, vinegar, dish soap, food coloring, container
Setup Time: 5 minutes
Activity Time: 20-30 minutes (they'll want to repeat)
Skills: Chemical reactions, prediction, observation
Steps:
  1. Place container on tray (baking sheet works)
  2. Add 3 tbsp baking soda to container
  3. Add drop of dish soap and food coloring
  4. Let child pour vinegar in
  5. Observe and discuss: "What happened? Why do you think?"
  6. Repeat with variations: more/less vinegar, different colors
Cost: $0 (pantry items)
```

```
Activity: Sink or Float Laboratory
Age: 3-5
Materials: Basin of water, various household objects
Setup Time: 5 minutes
Activity Time: 30 minutes
Skills: Prediction, hypothesis testing, density concepts
Steps:
  1. Gather 10-15 objects of varying density
  2. Before each object: "Do you think this will sink or float?"
  3. Record predictions on paper (draw or write)
  4. Test each object
  5. Compare results to predictions
  6. Group objects: sinkers vs floaters
  7. Discuss: "What do the floaters have in common?"
Cost: $0
```

**Creative Projects:**
- Process art (focus on creating, not the product)
- Junk model building with recyclables
- Puppet making and puppet shows
- Collage with magazine cutouts
- Nature painting (paint with leaves, pinecones, flowers)
- Playdough sculptures

**Outdoor Activities:**
- Nature scavenger hunt (printable checklist)
- Mud kitchen with old pots and utensils
- Gardening: plant seeds, water, observe growth
- Bug hunt with magnifying glass
- Chalk drawing on sidewalk/driveway
- Puddle jumping and rain walks

### School-Age Activities (6-11 Years)

**STEM Projects:**

```
Activity: Bridge Engineering Challenge
Age: 6-11
Materials: Popsicle sticks, glue, small weights (coins)
Budget: $5-10
Time: 1-2 hours
Skills: Engineering design, problem-solving, physics concepts
Steps:
  1. Challenge: Build a bridge between two stacks of books (12" apart)
  2. Provide materials: 50 popsicle sticks, glue
  3. Planning phase: sketch design (10 min)
  4. Building phase: construct bridge (30-45 min)
  5. Testing phase: add weights one at a time until failure
  6. Reflection: What worked? What would you change?
  7. Optional: rebuild with improvements (engineering iteration)
```

```
Activity: Coding Without Computers
Age: 6-11
Materials: Grid paper, colored pencils, instruction cards
Budget: $0
Time: 30-60 minutes
Skills: Logical thinking, sequencing, debugging
Steps:
  1. Draw a 10x10 grid
  2. Mark a start and end point
  3. Add obstacles (colored squares)
  4. Write directional "code": UP 3, RIGHT 2, DOWN 1...
  5. Partner traces the path following the code
  6. Debug: if path hits obstacle, find and fix the error
  7. Advance: add loops ("REPEAT 3: RIGHT 1, UP 1")
```

**Creative and Artistic:**
- Stop-motion animation with phone/tablet and toys
- Comic book creation
- Friendship bracelet making
- Origami projects (increasing complexity)
- Cooking/baking with measurement math
- Journal/diary with drawing and writing

**Outdoor Adventures:**
- Geocaching (free app, family-friendly)
- Bike riding and trail exploration
- Fort building with sticks or snow
- Star gazing with constellation map
- Bird watching with identification guide
- Orienteering with compass basics

### Tween/Teen Activities (12+ Years)

**Independent/Social Projects:**
- Photography challenges (themed daily prompts)
- Podcast or video creation
- Cooking challenge: plan, budget, shop, cook a full meal
- Community service project planning and execution
- Room redesign/redecoration project
- Start a small business (lemonade stand to Etsy shop)
- Book or movie club with friends

**STEM Advanced:**
- Arduino/Raspberry Pi starter projects
- App design (Scratch, App Inventor)
- Chemistry experiments with kitchen science
- Astronomy: telescope viewing, planet tracking apps
- 3D printing design (if access available)
- Robotics kits

## Seasonal Activity Calendars

### Spring Activities
- Plant a garden (vegetables, herbs, or flowers)
- Rain science: measure rainfall, water cycle experiments
- Bug observation journals
- Kite building and flying
- Outdoor art with natural materials
- Bird nest observation (from safe distance)

### Summer Activities
- Backyard water play: sprinklers, water balloons, slip and slide
- Lemonade stand (math, business, social skills)
- Nature camp at home: daily themed adventures
- Tie-dye projects
- Stargazing and meteor shower watching
- Homemade ice cream science

### Fall Activities
- Leaf collection and identification
- Apple picking and applesauce making
- Pumpkin investigations: weight, circumference, seed counting
- Nature collage with fall materials
- Hayride or corn maze
- Harvest cooking with seasonal produce

### Winter Activities
- Snow experiments: measure, melt, refreeze, compare
- Indoor fort building and reading marathon
- Holiday craft projects
- Board game tournaments
- Indoor scavenger hunts
- Hot chocolate science (dissolving, temperature)

## Budget-Friendly Activity Framework

### $0 Activities (Pantry/Household Items Only)

```
Cardboard Box Universe:
  - Large box --> house, car, rocket ship, boat
  - Small boxes --> building blocks, dollhouse furniture
  - Tubes --> tunnels, telescopes, marble runs
  - Egg cartons --> paint palettes, sorting trays, caterpillars
  All you need: boxes, tape, markers, imagination
```

- Kitchen band: pots as drums, rice shakers, spoon instruments
- Blanket fort with flashlights and books
- Sock puppets from orphan socks
- Sorting games with household items (buttons, pasta shapes)
- Scavenger hunts (indoor or neighborhood walk)
- Dance party (phone or free music streaming)
- Storytelling circle (take turns adding to a story)
- Shadow puppet theater with flashlight and hands

### $1-10 Activities
- Sidewalk chalk art gallery
- Bubble solution (dish soap + water + glycerin) with wand making
- Bead jewelry making
- Simple science kits from dollar store materials
- Planting seeds in egg cartons
- Watercolor painting
- Balloon games (volleyball, static electricity experiments)

### $10-25 Activities
- Pottery/clay projects with air-dry clay
- Tie-dye kit
- Simple robotics or circuit kits
- Baking project with new ingredients
- Craft store project kits
- Nature journal with field guide book

## Activity Planning Templates

### Single Child, Rainy Day, 3 Hours

```
RAINY DAY ADVENTURE PLAN

Child: [name], Age: [age]
Available Time: 3 hours
Setting: Indoor
Budget: $[amount]

Hour 1 - Active Play:
  Activity: _______________
  Materials needed: _______________
  Setup time: _______________

Transition: Snack break (involve child in preparation)

Hour 2 - Creative/Focused:
  Activity: _______________
  Materials needed: _______________
  Setup time: _______________

Transition: Free play / cleanup together

Hour 3 - Calm/Winding Down:
  Activity: _______________
  Materials needed: _______________
  Setup time: _______________
```

### Multi-Age Group Activity Plan

```
GROUP ACTIVITY PLANNER

Children: [names and ages]
Age Range: [youngest] to [oldest]
Setting: [indoor/outdoor]
Duration: [time]

Base Activity: _______________
(Choose activity adaptable to multiple levels)

Adaptation for youngest ([age]):
  - Simplified version: _______________
  - Extra support needed: _______________

Adaptation for middle ([age]):
  - Standard version: _______________

Adaptation for oldest ([age]):
  - Extended challenge: _______________
  - Leadership role: _______________

Cooperative element: _______________
(How can different ages contribute to a shared goal?)
```

### Weekly Activity Schedule Template

```
WEEKLY ACTIVITY ROTATION

Monday:    Art & Creative Expression
Tuesday:   STEM / Science Exploration
Wednesday: Active / Gross Motor Play
Thursday:  Cooking / Life Skills
Friday:    Free Choice / Child-Led Play
Saturday:  Family Adventure / Outing
Sunday:    Calm Activities / Nature

Each day's activity:
  Name: _______________
  Materials: _______________
  Prep needed (day before): _______________
  Learning domain: [physical / cognitive / social / creative / language]
```

## Educational Activity Integration

### Sneaky Learning Activities

Activities that build academic skills without feeling like "school":

**Math:**
- Cooking with measurement (fractions, doubling recipes)
- Store play with play money (addition, making change)
- Building with blocks (geometry, spatial reasoning)
- Board games: Monopoly Jr, Yahtzee, chess

**Literacy:**
- Restaurant play with menus and order pads
- Letter hunts on nature walks (find things starting with B)
- Story dictation: child tells story, adult writes, child illustrates
- Post office play: write letters to family members

**Science:**
- Kitchen chemistry (baking = chemical reactions)
- Weather station: daily temperature, cloud observation
- Animal observation: backyard wildlife journal
- Growing experiments: same seed, different conditions

**Social Studies:**
- Map making of bedroom, house, neighborhood
- Cultural cooking: try recipes from different countries
- Family history interviews with grandparents
- Community helper visits or role play

## Group Activity Ideas

### Playdate Activities (2-4 Kids)
- Collaborative art mural
- Treasure hunt with clues
- Relay races and obstacle courses
- Cooperative building challenge
- Dress-up and dramatic play
- Group cooking project

### Party Activities (5+ Kids)
- Station rotation (art, games, building, snack)
- Group scavenger hunt
- Parachute games (use a bedsheet)
- Capture the flag or tag variations
- Group craft: each child contributes to one piece
- Talent show or dance performance

## Output Format

When recommending activities, provide:

```
ACTIVITY RECOMMENDATION

Activity Name: [name]
Best For: Age [range], [setting], [energy level]
Time Required: [prep] + [activity] + [cleanup]
Materials: [itemized list with likely-at-home vs need-to-buy]
Budget: $[amount]
Skills Developed: [list 3-5 developmental areas]
Mess Factor: [Low / Medium / High]
Adult Involvement: [Fully hands-on / Nearby supervision / Independent]

STEP-BY-STEP:
1. [Preparation step]
2. [Setup step]
3. [Activity steps]
4. [Extension ideas for longer engagement]

VARIATIONS:
- Easier version: [for younger children]
- Harder version: [for older children or repeat engagement]
- Group version: [for multiple children]

LEARNING EXTENSION:
- Questions to ask during activity: [list]
- Books that connect: [titles]
- Follow-up activities: [what to do next time]
```

## Example

**Input:** "Help me get started with activity planner"

**Output:** A structured activity planner plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
