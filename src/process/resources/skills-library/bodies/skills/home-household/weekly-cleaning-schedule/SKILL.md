---
name: weekly-cleaning-schedule
description: |
  Creates a room-by-room weekly cleaning plan customized to household size,
  available time, and home layout. Includes task-by-task checklists with time
  estimates per room, daily touch-up routines, and efficiency strategies for
  busy schedules. Use when the user asks about cleaning routines, weekly cleaning
  plans, how long cleaning should take, or maintaining a clean home with limited
  time. Do NOT use for deep cleaning or seasonal cleaning (use deep-cleaning-checklist),
  move-in/move-out cleaning (use move-cleaning), or commercial cleaning schedules.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cleaning checklist time-management"
  category: "home-household"
  subcategory: "cleaning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Weekly Cleaning Schedule

## When to Use

Use this skill when the user's request falls into one of these specific scenarios:

- User asks for a weekly cleaning routine, schedule, or plan for their home -- any size, any household composition
- User wants to know how long cleaning realistically takes for their home size and wants calibrated time estimates
- User wants to split cleaning across multiple days rather than doing one exhausting weekend marathon
- User asks how to maintain a clean home with limited time (under 3 hours per week), a busy job, or irregular hours
- User has pets, children, or allergy sufferers in the household and needs a cleaning routine adjusted for those factors
- User wants to divide cleaning responsibilities among household members or roommates in a fair, specific way
- User's current cleaning routine has broken down and they want to restart with a sustainable system
- User is overwhelmed by housework and wants to know what actually matters versus what can wait

**Do NOT use this skill when:**
- User needs a thorough deep-clean (scrubbing grout, cleaning behind appliances, washing walls) -- use `deep-cleaning-checklist` instead
- User is cleaning a home for move-in or move-out inspection -- use `move-cleaning`, which covers a different task scope and sequence
- User primarily needs to remove clutter and reorganize storage before cleaning is meaningful -- use `decluttering-method` first, then return here
- User is dealing with a hoarding situation, severe neglect, or post-construction cleanup -- these require professional remediation before a maintenance schedule applies
- User needs a commercial or rental property cleaning schedule (different task intervals, legal compliance considerations, and professional-grade product requirements)
- User is asking about seasonal deep tasks like chimney cleaning, exterior power washing, or HVAC filter replacement -- these belong in a seasonal home maintenance calendar, not a weekly routine

---

## Process

### Step 1: Gather Household Profile

Before building any schedule, collect the specific variables that determine time loads and task priorities. Ask the user for:

- **Home size:** Number of bedrooms, bathrooms, and main living areas (kitchen, living room, dining room, home office, laundry room, mudroom, finished basement)
- **Occupants:** Adults, children by age group (under 5, 5-12, teens), and pets by type (dog, cat, caged animal, reptile)
- **Flooring types:** Carpet, hardwood, tile, or a mix -- this determines vacuuming vs. sweeping/mopping strategy and total floor time
- **Weekly time budget:** Be specific. Ask "How many total hours per week can you realistically put toward cleaning -- not a stretch goal, but what you can actually sustain?" Common answers: under 1 hour, 1-2 hours, 2-3 hours, 3-5 hours
- **Preferred session structure:** One single session, daily 15-20 minute splits, two focused sessions mid-week and weekend, or fully flexible
- **High-friction areas:** Ask what rooms or messes bother them most, which rooms guests see, and which tasks they always skip. This reveals both priority and avoidance patterns
- **Existing habits:** Ask what they already do consistently (e.g., always run the dishwasher overnight, always vacuum Sundays). Build the new schedule around existing habits, not against them

### Step 2: Calculate the Baseline Time Load

Use calibrated time benchmarks to set realistic expectations before building the schedule. These assume standard-sized rooms and weekly maintenance cleaning (not initial heavy cleaning of a neglected space):

**Per-room time benchmarks (maintenance level):**

| Room | Light Household | Medium Household | Pets or Kids |
|------|----------------|-----------------|--------------|
| Kitchen (full clean) | 20-25 min | 28-35 min | +8-12 min |
| Primary bathroom | 12-15 min | 15-18 min | +3-5 min |
| Secondary bathroom | 8-10 min | 10-13 min | +2-3 min |
| Master bedroom | 10-14 min | 12-16 min | +4-6 min |
| Secondary bedroom | 7-10 min | 8-12 min | +3-5 min |
| Living room | 15-20 min | 18-25 min | +8-12 min |
| Dining room | 5-8 min | 6-10 min | +3-5 min |
| Home office | 5-8 min | 6-10 min | -- |
| Hallways + entryway | 5-8 min | 7-10 min | +2-4 min |
| Laundry room | 5-8 min | 5-8 min | -- |

**Whole-home weekly totals (excluding daily touch-ups):**
- Studio or 1BR/1BA: 45-75 minutes
- 2BR/1BA: 75-110 minutes
- 3BR/2BA: 110-165 minutes
- 4BR/2-3BA: 150-220 minutes
- 5BR/3+BA: 200-280 minutes

Add 15-20 minutes per week for a dog, 8-12 minutes per week for a cat, 10-15 minutes per week for children under 5.

If the user's time budget is less than what the baseline calculation requires, flag this immediately and offer either a "minimum viable clean" approach (see Edge Cases) or a zone-rotation system for larger homes.

### Step 3: Choose the Right Schedule Architecture

Match the schedule structure to the user's life, not the other way around. There are three primary architectures:

**Architecture 1 -- Single Weekly Session (best for: solo occupants, studio/1BR, people with unpredictable weekday schedules)**
- All rooms cleaned in one block, typically Saturday or Sunday morning
- Works best when the home is small (under 2BR) or the occupant is disciplined about daily touch-ups
- Risk: If the session gets skipped, the whole week falls behind. Build in a "makeup day" (e.g., "If Saturday is missed, do it Sunday before noon")
- Practical ceiling: around 90-120 minutes before fatigue and diminishing motivation set in. Homes larger than 3BR are poor candidates for single-session cleaning

**Architecture 2 -- Daily Mini-Sessions (best for: families, busy professionals who prefer short daily commitments, people with ADHD or attention-management challenges)**
- 15-25 minutes per day, rotating rooms or task categories
- The daily touch-up (10-12 minutes) is non-negotiable and separate from these sessions
- Highly sustainable because no single session feels burdensome
- Structure: Monday bathrooms, Tuesday kitchen deep, Wednesday bedrooms, Thursday living areas, Friday floors/entryway, weekend catch-up and rotation tasks

**Architecture 3 -- Hybrid Two-Session System (best for: 2-4 person households, 3BR/2BA homes, couples splitting responsibilities)**
- Mid-week session (Wednesday or Thursday): kitchen full clean + all bathrooms
- Weekend session (Saturday morning): bedrooms + living areas + floors
- Daily touch-ups bridge the gap
- This is the most effective system for average households because it separates the two highest-maintenance categories (kitchen/bathrooms, which degrade quickly) from the lower-urgency areas (bedrooms, living rooms)

### Step 4: Build the Daily Touch-Up Routine

The daily touch-up is the single highest-leverage habit in the entire schedule. Research in household management consistently shows that homes with a consistent 10-15 minute daily routine require 30-40% less time in their weekly sessions and are perceived as "clean" nearly all the time.

Structure every daily touch-up with these four components:

**1. Kitchen Reset (4-6 min):**
- Clear the sink: all dishes either loaded into dishwasher or hand-washed and drying
- Wipe stovetop with a damp microfiber cloth while still warm after cooking (this prevents cooked-on residue that requires 10x more effort to remove the next day)
- Wipe countertops with an all-purpose cleaner or vinegar solution
- A quick dry sweep of the kitchen floor if crumbs are visible

**2. Bathroom Surface Reset (1-2 min, morning routine integration):**
- After brushing teeth and washing face, spend 60-90 seconds: wipe the sink basin and faucet with a dry cloth left under the sink, wipe mirror with a microfiber cloth. This takes almost no time because the sink is already wet and the motion is trivial

**3. Clutter Pickup (3-4 min):**
- One pass through every shared living area to return items to their home location
- This is not organizing -- it is returning things that have drifted. Mail goes to the inbox, shoes go to the entryway, jackets go to hooks
- The "10-item pickup" method: challenge yourself to put away exactly 10 items. This creates a fast, gamelike habit rather than an open-ended task

**4. Pet and Child Micro-Tasks (2-3 min, if applicable):**
- Wipe pet feeding area after meals (prevents ant attraction and odor)
- Return children's toys to a designated bin (not to shelves -- a bin is fast)
- Quick lint roller pass on a pet's primary furniture spot

### Step 5: Assign Cleaning Order for Each Session

Cleaning order matters. Using the wrong sequence means you clean the same surface twice or spread contamination. Apply these rules within every session:

**Macro order (room sequence):**
- Start in the room farthest from the front door and work toward the exit. This way you never walk dirty-footed over cleaned floors
- Bathrooms and kitchen first (highest germ load, require products to dwell), bedrooms and living rooms last (lowest germ load)
- Exception: if vacuuming, do floors last in every room

**Micro order (within each room):**
1. Remove clutter and items that don't belong in the room
2. Dust top surfaces first: ceiling fans, tops of cabinets, light fixtures, crown molding (if within reach)
3. Dust mid-level: shelves, furniture surfaces, window sills, picture frames
4. Wipe surfaces: counters, appliance fronts, door handles, light switches
5. Clean fixtures: sinks, toilets, shower/tub (apply cleaner and let it dwell while you do other tasks in the room)
6. Return to scrub and rinse fixtures after dwell time
7. Floors last: vacuum or sweep first, then mop if applicable

**The "spray and dwell" technique is mandatory for bathrooms and kitchens:**
Apply bathroom cleaner to the toilet bowl, spray the shower/tub surfaces, and spray the kitchen sink at the beginning of the room session. Do all other tasks while the cleaner dwells (3-5 minutes minimum for most disinfectants to kill bacteria). Then return to scrub. This technique alone saves 5-8 minutes per bathroom because you are not manually scrubbing without chemistry doing its job first.

**Dry before wet -- always:**
Dust and sweep before wiping and mopping. Wet surfaces trap dust. Dusting after mopping deposits particles onto wet floors and defeats the purpose.

### Step 6: Identify and Assign Biweekly and Monthly Rotation Tasks

Not every task needs weekly attention. Overloading the weekly schedule with unnecessary tasks causes burnout and schedule abandonment. Use this frequency framework:

**Truly weekly (health, hygiene, and rapid-degradation tasks):**
- Kitchen: counters, stovetop, sink, floor, trash, exterior of appliances
- Bathrooms: toilet bowl and exterior, sink, mirror, floor
- All floors (vacuum/sweep) -- or twice weekly with pets
- Changing and laundering bed sheets (or every 10-14 days minimum)
- General dusting of eye-level and above surfaces
- Pet-specific tasks

**Biweekly (moderate accumulation rate):**
- Inside microwave
- Wipe cabinet and appliance fronts
- Dust below-eye-level surfaces and baseboards
- Vacuum under upholstered furniture
- Wipe interior of trash cans
- Vacuum upholstery (without pets -- with pets this becomes weekly)
- Window sills

**Monthly (slow accumulation, no health consequence if skipped one week):**
- Ceiling fans (use pillowcase method: slip an old pillowcase over each blade and pull back, trapping dust inside rather than releasing it into the air)
- Refrigerator interior (remove all items, wipe shelves and door gaskets)
- Interior window glass
- Light switch plates and door handles (deep clean, not just daily wipe)
- Oven interior
- Bathroom exhaust fans (vacuum the grate with a brush attachment)
- Wipe walls near high-touch areas (around light switches, near door handles)

Build a biweekly rotation into the schedule as "Week A" and "Week B" tasks that alternate. The user should note in their calendar which week they are on.

### Step 7: Assign Responsibilities in Multi-Person Households

If the household has multiple adults or teens capable of contributing, build the assignment system into the schedule. The key principle is **task ownership, not room ownership.** When responsibility is room-based, the person who cares less about a room will underclean it. When responsibility is task-based, each person has a clear deliverable.

**Assignment frameworks:**

- **Two-adult household:** Split by session (one person owns the mid-week session, one owns the weekend session). Each person's session is completely their responsibility. The daily touch-up is shared with clear handoffs (e.g., whoever cooks resets the kitchen, both do the bedroom pickup before bed)
- **Household with teens:** Teens take full ownership of one room (usually their bedroom and a shared bathroom). Assign complete task lists, not "help mom clean." Autonomy over method increases compliance
- **Roommate households:** Zone-based split (each person owns their bedroom plus a rotating shared space) is more sustainable than task-based splits, because roommates have different standards and rotational fairness is easier to track
- **Post-the-schedule rule:** A schedule that lives only in someone's head does not work. Post it physically (whiteboard, printed sheet on the fridge) or in a shared digital list (a shared checklist app with completion tracking). Visual accountability outperforms verbal agreement

### Step 8: Calculate Total Time, Flag Mismatches, and Present the Final Schedule

Sum all components: daily touch-ups x 7 days, focused session totals, and average biweekly rotation time. Compare to the user's stated weekly time budget.

**If total time exceeds budget by under 15%:** Recommend the schedule as-is and note that the first 2-3 weeks will feel tight as habits form, but sessions shorten as maintenance prevents buildup.

**If total time exceeds budget by 15-30%:** Identify which tasks can move to biweekly rotation without hygiene consequences. Common candidates: bedroom vacuuming (move to every 10 days), living room dusting (move to biweekly), hall bathroom cleaning (move to every 10 days if rarely used).

**If total time exceeds budget by more than 30%:** The user needs a minimum viable clean approach (see Edge Cases). Present the full schedule and the minimum viable clean side by side, and let the user choose where to start.

---

## Output Format

```
## Weekly Cleaning Schedule

**Home:** [X]BR / [X]BA [house/apartment/condo] | **Occupants:** [description]
**Pets:** [type and count, or "none"] | **Weekly Time Budget:** [hours]
**Schedule Type:** [Single session / Daily mini-sessions / Hybrid two-session]

---

### Daily Touch-Up (Every Day, [X]-[X] min)
*This routine bridges your sessions and is the most important habit in the schedule.*

- [ ] Kitchen reset: wipe stovetop, countertops, load/unload dishwasher -- [X] min
- [ ] Bathroom surface wipe: sink basin, faucet, mirror -- [X] min
- [ ] Clutter pickup: one pass through shared living areas -- [X] min
- [ ] [Pet/child task if applicable] -- [X] min

**Daily touch-up total: [X] min | Weekly contribution: [X] min ([X] min x 7 days)**

---

### [Day] -- [Session Name, e.g., "Bathrooms + Kitchen"] -- Est. [X]-[X] min

**[Room Name] ([X]-[X] min):**
- [ ] [Task -- technique note] -- [X] min
- [ ] [Task -- technique note] -- [X] min
- [ ] [Task -- technique note] -- [X] min

**[Room Name] ([X]-[X] min):**
- [ ] [Task -- technique note] -- [X] min
- [ ] [Task -- technique note] -- [X] min

---

### [Day] -- [Session Name, e.g., "Bedrooms + Living Areas + Floors"] -- Est. [X]-[X] min

**[Room Name] ([X]-[X] min):**
- [ ] [Task -- technique note] -- [X] min
- [ ] [Task -- technique note] -- [X] min

---

### Biweekly Rotation (Alternate Week A / Week B, ~[X] min each)

**Week A:**
- [ ] [Task] -- [X] min
- [ ] [Task] -- [X] min

**Week B:**
- [ ] [Task] -- [X] min
- [ ] [Task] -- [X] min

---

### Monthly Tasks (Not Part of Weekly Time Budget)
- [ ] [Task] -- [X] min
- [ ] [Task] -- [X] min

---

### Total Weekly Time Summary

| Component | Minutes |
|-----------|---------|
| Daily touch-up (7 days x [X] min) | [X] min |
| [Session 1 name] | [X] min |
| [Session 2 name, if applicable] | [X] min |
| Biweekly rotation (weekly average) | [X] min |
| **Total** | **[X] min (~[X] hrs [X] min)** |

**vs. your stated budget:** [X] hrs -- [match/over by X min/under by X min]

---

### Cleaning Order Reminder
For every session: top-to-bottom, dry-before-wet, farthest room to front door, spray-and-dwell on toilets/tubs/sinks before doing other tasks.

### Supply Checklist
- [ ] Microfiber cloths (6-8, laundered weekly)
- [ ] All-purpose cleaner (or 1:1 white vinegar and water spray)
- [ ] Bathroom/shower cleaner (rated for soap scum and mildew)
- [ ] Toilet bowl cleaner + brush
- [ ] Glass and mirror cleaner (or dry microfiber method)
- [ ] Baking soda (abrasive scrubbing for sinks, stovetops)
- [ ] Vacuum with appropriate attachments ([pet/standard])
- [ ] [Mop type appropriate to floor surface]
- [ ] Rubber gloves
- [ ] [Pet-specific: lint roller, enzyme-based odor spray]
```

---

## Rules

1. **Always include task-level time estimates in minutes.** Never give a session estimate without breaking it down by room and by task. Vague estimates ("about 30 minutes for the kitchen") without task-level support cause users to underestimate, run over time, and abandon the schedule after two weeks.

2. **Use the calibrated whole-home benchmarks as a reality check before building anything.** If the user says "I have 1 hour a week" and they have a 3BR/2BA home with two kids and a dog, say so directly: the baseline for that home is 150-180 minutes per week. Present the minimum viable clean as an alternative, not as the full schedule.

3. **Never skip the daily touch-up.** Every schedule, regardless of home size, architecture, or time budget, gets a daily touch-up routine. The daily touch-up is not optional and is not part of the weekly session time -- it runs parallel as a daily habit. Homes without a daily touch-up require 40-50% more weekly session time.

4. **Apply the spray-and-dwell rule in every bathroom and kitchen task sequence.** Apply cleaning products at the start of the room, do other tasks during the dwell, scrub and rinse at the end. Never sequence the schedule with product application immediately before scrubbing.

5. **Cleaning order within every session must be:** remove clutter first, top-to-bottom dusting, mid-level surface wiping, fixtures and high-touch surfaces, floors last. Explicitly note this in the schedule rather than assuming the user knows it. Many people vacuum before they dust, then undo their floor work.

6. **Biweekly rotation tasks must be explicitly labeled Week A and Week B,** not just "every other week." Users need a concrete way to track which rotation they are in. Recommend they put "Week A" or "Week B" in their calendar for the current week.

7. **For households with pets, floor tasks are never weekly -- they are at minimum twice-weekly.** A weekly vacuum in a dog or cat household allows visible pet hair accumulation and dander that affects air quality. Even a quick second vacuum pass mid-week (just high-traffic paths, 10 minutes) makes a meaningful difference.

8. **For households with children under 5, disinfection is a distinct step from cleaning.** Cleaning removes visible soil. Disinfecting kills pathogens. For high-touch surfaces (light switches, cabinet handles, toilet flush handle, door knobs, remote controls) in homes with young children, the disinfectant must be applied after cleaning and allowed to dwell per label instructions -- wiping it off immediately defeats the purpose.

9. **Never recommend a single session for homes larger than 3BR.** A single weekly session for a 4+BR home takes 3-4 hours, which is psychologically unsustainable for most households. Zone-rotation or hybrid two-session architectures are always more sustainable for large homes, even if the math says a single session is time-equivalent.

10. **In multi-person households, vague responsibility assignment is a failure mode.** "We both clean" or "we take turns" will not appear in the schedule. Every session and task must have a named assignee or a clear trigger for rotation. If the user resists specific assignment, note that undefined shared responsibility is the primary cause of cleaning conflict and schedule breakdown in households.

11. **Do not include specific cleaning product brand names.** Refer to product types: all-purpose cleaner, bathroom/shower cleaner, enzyme-based pet odor eliminator, microfiber cloth, HEPA-filter vacuum. Brand choices vary by region, availability, and user preference.

12. **When calculating total weekly time, always present it as a range and compare it explicitly to the user's stated budget.** A 2-hour schedule presented to someone who said "I have 2 hours a week" should flag that this is at the top of their budget and that the daily touch-ups are the buffer that keeps it from going over.

---

## Edge Cases

### Minimum Viable Clean (Under 1 Hour Per Week Total Budget)

When a user has a genuinely extreme time constraint -- single parent, multiple jobs, illness, caregiver responsibilities -- do not present a full schedule and tell them to cut it down. Present the Minimum Viable Clean directly.

The three zones that degrade fastest and pose hygiene risks if neglected: kitchen (foodborne bacteria, pest attraction), bathrooms (mold, cross-contamination), and high-traffic floors (allergen and debris accumulation). Everything else is cosmetic or can rotate every 2-3 weeks without consequence.

**Minimum Viable Clean structure (45-55 min per week + 8 min/day daily touch-up):**
- Kitchen (15-18 min): sink, counters, stovetop, floor -- no microwave interior, no cabinet fronts, no appliance deep wipe
- Bathroom 1 (12-14 min): toilet, sink, mirror, floor -- no tub unless visibly dirty
- Bathroom 2 (8-10 min): toilet, sink, floor
- High-traffic floors (10-12 min): vacuum or sweep the paths people actually walk -- living room, kitchen, main hallway
- Everything else: rotates on a 2-3 week cycle, addressed as capacity allows

Frame this explicitly as "maintaining hygiene and preventing rapid deterioration, not achieving a perfectly clean home." The user should know this is a sustainable floor, not a desirable ceiling.

### Very Large Home (4+ Bedrooms, 3+ Bathrooms)

A whole-home weekly clean for a large home requires 3-4+ hours in a single session. This is unsustainable for most households and leads to cleaning burnout -- the pattern of cleaning intensively once or twice, then abandoning the schedule entirely for weeks.

**Zone-rotation system for large homes:**
- Divide the home into 3-4 geographic zones (e.g., Zone 1: master suite + master bath; Zone 2: secondary bedrooms + hall bath; Zone 3: kitchen + dining + laundry; Zone 4: living areas + office + guest bath)
- Each week, one zone receives a full clean (30-45 min)
- All zones receive daily touch-ups throughout the week
- High-frequency rooms (kitchen, primary bathroom) are always cleaned weekly regardless of which zone is "in rotation"
- At any given time, 3 of 4 zones are being maintained at the touch-up level, and 1 zone is being deep-maintained. Every zone gets a full clean every 4 weeks

This system means the home is never completely pristine on any given day, but no zone ever degrades badly. It is psychologically sustainable and reduces per-session cleaning time to 60-80 minutes per week.

### Household with Allergies or Asthma

Standard cleaning advice does not address the specific techniques that actually reduce allergen load. Allergy-focused cleaning requires different tool choices and technique modifications:

- **Vacuuming:** HEPA-filter vacuum only. Non-HEPA vacuums exhaust fine particulates (including dust mite feces, the primary trigger for dust allergies) back into the air. Vacuum frequency: twice weekly for any carpeted areas. Bag-style vacuums are preferred over bagless for allergy households because emptying a bagless canister releases a concentrated cloud of particulates
- **Dusting:** Damp microfiber cloth only -- never dry dusting cloths or feather dusters, which redistribute particles into the air. Damp capture is essential
- **Bedding:** Wash in hot water (minimum 130°F / 54°C) weekly. This temperature kills dust mites. Warm water does not. Dry completely on high heat. Allergen-barrier pillow covers and mattress covers are a one-time purchase that dramatically reduce weekly maintenance burden
- **Bathroom ventilation:** Run exhaust fan during every shower and for 20 minutes after. Clean the exhaust fan grate monthly (accumulated dust reduces effectiveness to near zero)
- **For pet allergies specifically:** Vacuum upholstered furniture twice weekly, not once. Wash pet bedding weekly in hot water. Keep pets out of the primary bedroom if possible -- this single intervention reduces the allergen load where the occupant spends 8 hours unconscious more than any cleaning technique

### Household with Very Young Children (Under 5)

Young children create mess faster than adults, but they also introduce unique hygiene requirements that go beyond visible cleanliness:

- **Toy sanitizing:** Hard plastic toys that end up in mouths should be disinfected weekly. The most efficient method: wash in the dishwasher's top rack on a sanitize cycle, or soak for 5 minutes in a solution of 1 tablespoon bleach per gallon of water, then rinse and air dry. Stuffed animals go in the dryer on high heat for 20 minutes weekly (kills dust mites) and washed monthly
- **High-touch surface disinfection:** With toddlers, light switches, door handles, cabinet pulls, refrigerator handles, and toilet flush handles need weekly disinfection with a product that has a documented kill claim (check the product label for EPA registration). Wiping with an all-purpose cleaner cleans but does not disinfect
- **Floor cleaning frequency:** Toddlers are on floors constantly. Vacuuming/sweeping shifts from weekly to every 2-3 days for high-traffic areas. Mopping hard floors shifts to weekly minimum
- **Under-furniture cleaning:** Items roll under furniture constantly in toddler households. Add under-couch vacuuming to the weekly (not biweekly) rotation

### Roommate or Multi-Adult Household With Different Cleanliness Standards

This is one of the most common failure modes for cleaning schedules in shared households. The problem is not laziness -- it is that people have genuinely different internalized thresholds for what constitutes "clean enough," formed over years of different household environments.

**The solution is not to get everyone to the same standard -- it is to create explicit, measurable task definitions so that completion is objective, not subjective:**

- Replace "clean the bathroom" with "scrub toilet bowl and wipe exterior, clean sink and faucet, wipe mirror, sweep and mop floor, replace hand towel" -- this is a pass/fail checklist, not a judgment
- Use a rotating assignment calendar so no one person always does the most unpleasant tasks
- Establish "clean by" deadlines for tasks (e.g., kitchen must be reset by 9pm nightly) rather than open-ended responsibility
- For significantly mismatched standards, a "minimum standard" agreement works better than a "target standard" agreement. Define the floor: dishes not left in the sink overnight, bathroom cleaned by Saturday, trash taken out when full. People with higher standards can do additional cleaning beyond the agreement without resentment

### Post-Illness or Post-Guest Restoration

After a household illness event (flu, stomach virus, respiratory illness) or after hosting guests for multiple days, the weekly schedule temporarily requires a disinfection layer that supplements normal cleaning:

- All high-touch surfaces (door handles, light switches, faucets, toilet flush handles, remote controls, phone surfaces, stair rails) should be wiped with an EPA-registered disinfectant and allowed to dwell for the contact time listed on the label -- typically 2-4 minutes for most household disinfectants, not simply wiped and immediately dried
- Launder all towels, hand towels, and bed linens used during the illness or by guests, in hot water
- Ventilate the home for at least 30 minutes by opening windows in multiple rooms to create cross-ventilation, which dilutes airborne viral load in addition to surface disinfection
- The guest bedroom and primary bathroom used by guests should receive a full bathroom clean and bedroom clean regardless of where they fall in the regular weekly rotation

### Returning to a Schedule After a Gap (Neglected Home Restart)

When a user has not been maintaining any cleaning routine for weeks or months, the first session is not a maintenance clean -- it is a reset clean, and trying to fit it into the weekly schedule time budget will fail and discourage the user from continuing.

**Handle the restart explicitly:**
- Acknowledge that the first session will take longer -- typically 1.5-2x the normal weekly session time for a moderately neglected home
- Break the restart into two separate sessions over the first weekend: Session 1 (kitchen + all bathrooms, 90-120 min) on Saturday; Session 2 (all other rooms, 90-120 min) on Sunday
- After the reset, the normal weekly schedule will work as specified because maintenance cleaning is much faster than remedial cleaning
- Do not recommend the full reset be done at once if it exceeds 2 hours -- fatigue leads to abandonment and a return to neglect

---

## Example

**Input:** "I have a 3-bedroom, 2-bathroom house. It's me, my partner, and a dog. We both work full time. We have maybe 2.5-3 hours a week for cleaning total. Can you build us a schedule we can actually stick to?"

---

## Weekly Cleaning Schedule

**Home:** 3BR / 2BA house | **Occupants:** 2 adults
**Pets:** 1 dog | **Weekly Time Budget:** 2.5-3 hours
**Schedule Type:** Hybrid two-session -- mid-week kitchen/bathrooms + weekend bedrooms/living areas, bridged by daily touch-ups

---

### Daily Touch-Up (Every Day, 10-13 min)

*Do this every day. It is not optional and it is not part of your session time. It is what makes the sessions fast.*

- [ ] Wipe stovetop with a damp microfiber cloth while still warm after cooking -- 2 min
- [ ] Clear sink: load dishes into dishwasher or hand wash and rack dry -- 4 min
- [ ] Wipe kitchen countertops with all-purpose cleaner -- 2 min
- [ ] One pass through living areas: return 10 items to their home location (mail, shoes, dog toys, coats, etc.) -- 3 min
- [ ] Morning bathroom wipe: after your morning routine, spend 60-90 seconds wiping the primary sink basin and mirror with the microfiber cloth kept under the sink -- 1.5 min

**Daily total: ~12 min | Weekly contribution: ~84 min (7 days x 12 min)**

**Dog-specific daily:** After your dog eats, take the food bowl to the kitchen, rinse with hot water, and set to dry. Takes under 60 seconds and prevents bacterial buildup and ant attraction.

---

### Wednesday -- Kitchen + Bathrooms -- Est. 60-75 min

**Assignment:** Rotate weekly. This week: [Partner 1]. Next week: [Partner 2].

**Kitchen (28-35 min):**

*Start here. Apply cleaner to the sink and let it dwell while you do the first few tasks.*

- [ ] Spray kitchen sink with all-purpose cleaner or baking soda. Leave to dwell. Move on -- 0.5 min
- [ ] Clear any remaining items from countertops, remove dish drying rack and wipe beneath it -- 2 min
- [ ] Wipe all countertops and backsplash with all-purpose cleaner, including the area behind the faucet -- 5 min
- [ ] Wipe stovetop: remove grates if gas range, wipe burner wells and surface, replace grates. For electric/glass top: baking soda paste on any residue, wipe clean -- 5 min
- [ ] Return to sink: scrub basin with brush or non-scratch pad, scrub faucet base (limescale accumulates here), rinse, wipe dry to prevent water spots -- 4 min
- [ ] Wipe exterior of refrigerator, dishwasher front, and microwave exterior with a damp cloth -- 3 min
- [ ] Steam clean microwave interior: place a bowl of water with 2 tablespoons of white vinegar in the microwave, heat for 3 minutes, let sit 2 minutes. The steam loosens everything. Wipe with a cloth. This makes the interior trivial to clean -- 6 min (1 min setup, 5 min dwell while you do other tasks)
- [ ] Take out kitchen trash and recycling. Wipe rim of trash can with disinfectant -- 3 min
- [ ] Sweep kitchen floor to collect crumbs and dog hair -- 3 min
- [ ] Mop kitchen floor with appropriate cleaner for your floor type. Use a spray mop for speed -- 5 min

**Primary Bathroom (18-22 min):**

*Apply toilet bowl cleaner inside the bowl and spray the shower/tub with bathroom cleaner at the start. Let both dwell for at least 3-5 minutes while you do other tasks.*

- [ ] Apply toilet bowl cleaner inside bowl (get under the rim). Apply bathroom/shower cleaner to tub surfaces and tile walls. Let both dwell -- 1 min
- [ ] Wipe mirror with a dry microfiber cloth (no streaks) or glass cleaner -- 1.5 min
- [ ] Clean sink basin and faucet with all-purpose cleaner. Wipe under the faucet base where toothpaste and soap accumulate -- 3 min
- [ ] Wipe toilet exterior: tank, handle, lid top and bottom, seat top and bottom, bowl exterior, base (where it meets the floor). Use disinfectant. Work top-to-bottom to avoid cross-contamination -- 4 min
- [ ] Return to tub/shower: scrub with brush or non-scratch sponge (soap scum on grout lines needs a stiff brush). Rinse thoroughly -- 5 min
- [ ] Scrub toilet bowl with toilet brush, get under the rim where buildup hides, flush -- 2 min
- [ ] Sweep bathroom floor, then mop (spray mop or bucket mop for tile) -- 3 min
- [ ] Replace hand towel and bath mat with fresh ones. Add used ones to laundry -- 1 min

**Hall / Guest Bathroom (12-15 min):**

*Same spray-and-dwell sequence.*

- [ ] Apply toilet bowl cleaner, spray sink. Dwell -- 1 min
- [ ] Wipe mirror -- 1 min
- [ ] Scrub and wipe sink and faucet -- 2 min
- [ ] Wipe toilet exterior (top to bottom), scrub bowl, flush -- 4 min
- [ ] Sweep and mop floor -- 3 min
- [ ] Replace hand towel -- 1 min
- [ ] Check toilet paper supply, restock if needed -- 0.5 min

---

### Saturday Morning -- Bedrooms + Living Areas + Floors -- Est. 65-80 min

**Assignment:** Both partners, divided. [Partner 1]: bedrooms. [Partner 2]: living areas + floors. Run in parallel to cut total elapsed time to ~45 min.

**Partner 1: Bedrooms (35-40 min total)**

*Primary Bedroom (15-18 min):*
- [ ] Strip bed and start sheets in the washing machine before you begin anything else -- 3 min
- [ ] Dust nightstands, dresser, headboard, and all horizontal surfaces with a damp microfiber cloth (damp, not wet -- traps dust rather than spreading it) -- 4 min
- [ ] Dust ceiling fan blades using the pillowcase method: slip an old pillowcase over each blade, pull back to trap dust inside the case rather than releasing it into the air -- 3 min
- [ ] Vacuum floor including under the bed (pull mattress base slightly to reach underneath) -- 5 min
- [ ] Move bed sheets from washer to dryer before finishing the room -- 1 min
- [ ] Remake bed with clean sheets when dry (this takes ~5 min and can be done any time before bed Saturday night)

*Bedroom 2 / Office (10-12 min):*
- [ ] Dust all surfaces with damp microfiber cloth -- 3 min
- [ ] Tidy desk: return items to drawers, clear paperwork to inbox tray -- 3 min
- [ ] Vacuum floor -- 4 min

*Bedroom 3 / Guest Room (8-10 min):*
- [ ] Quick dust of main surfaces -- 2 min
- [ ] Vacuum floor -- 4 min
- [ ] Open window for 10 minutes while vacuuming to ventilate (guest rooms get stale air quickly, especially when unused) -- 0 min active

**Partner 2: Living Areas + Floors (35-40 min total)**

*Living Room (20-25 min):*
- [ ] Clear any remaining items from surfaces and coffee table -- 2 min
- [ ] Dust all surfaces with damp microfiber cloth: shelves, TV stand, coffee table, end tables, window sills -- 6 min
- [ ] Use upholstery attachment on vacuum to remove dog hair from couch cushions, armchair, and any other upholstered surfaces. Lift cushions and vacuum beneath them -- 6 min
- [ ] Wipe light switches, TV remote, door handles, and any frequently touched surfaces with disinfectant wipe -- 2 min
- [ ] Fluff cushions, fold throws -- 1 min

*Hallways, Entryway, Stairs (8-10 min):*
- [ ] Vacuum or sweep hallway, entryway, and stairs -- 5 min
- [ ] Wipe entryway floor with damp mop or cloth -- muddy paw prints concentrate here -- 3 min
- [ ] Check entryway organization: shoes, coats, leashes in their designated spots -- 1 min

*All-Room Floor Vacuum (runs while Partner 1 does final bedroom):*
- [ ] Vacuum all carpeted and hard floors throughout the home in one pass after Partner 1 has finished dusting all rooms (dust before vacuuming) -- 10-12 min

**Dog-Specific Tasks (Saturday, ~8-10 min):**
- [ ] Vacuum dog's primary sleeping area and any furniture the dog uses regularly -- 4 min
- [ ] Wash dog bed cover or blanket (add to laundry with towels) -- 1 min setup, machine does the rest
- [ ] Wipe down dog's regular contact surfaces (couch arm, window seat if used) with damp cloth -- 2 min
- [ ] If applicable: wipe muddy paw print residue from walls near the dog door or back entry -- 2 min

---

### Biweekly Rotation (Alternate Saturday sessions, ~15-20 min added)

**Week A -- Add to this Saturday's session:**
- [ ] Wipe all cabinet and drawer fronts in kitchen with damp cloth (fingerprints and splatter accumulate here) -- 5 min
- [ ] Clean refrigerator interior: remove all items, wipe shelves and door gaskets, discard expired items, replace -- 10 min
- [ ] Vacuum baseboards and corners throughout main living areas (use brush attachment) -- 5 min

**Week B -- Add to this Saturday's session:**
- [ ] Vacuum under couch, under beds (if not done during bedroom clean), and under dining table -- 6 min
- [ ] Wipe interior of trash cans in kitchen and bathrooms -- 4 min
- [ ] Clean bathroom exhaust fans: vacuum the grate cover with a brush attachment. If accessible, wipe the fan blades -- 5 min

**Mark your calendar.** Write "Week A" or "Week B" on today's date and alternate each Saturday. This prevents the common failure mode of never knowing which rotation you are in and always defaulting to skipping it.

---

### Monthly Tasks (Not Part of Weekly Budget -- Add When You Have Extra Time)

- [ ] Oven interior: use a spray oven cleaner the night before, wipe the next morning -- 15 min
- [ ] Interior windows: glass cleaner and microfiber cloth -- 15-20 min total
- [ ] Bathroom exhaust fan deep clean: remove the entire grate cover, wash with soap and water, dry, replace -- 10 min
- [ ] Wipe walls and door frames near high-touch areas (light switches, door handles, around the dog's entry/exit points) -- 10 min

---

### Total Weekly Time Summary

| Component | Minutes |
|-----------|---------|
| Daily touch-up (7 days x 12 min) | 84 min |
| Wednesday session (kitchen + 2 bathrooms) | 68 min |
| Saturday session (bedrooms + living areas + floors + dog tasks) | 73 min |
| Biweekly rotation (weekly average: ~18 min / 2) | 9 min |
| **Total** | **234 min (~3 hrs 54 min)** |

**vs. your stated budget:** You said 2.5-3 hours. The sessions themselves (Wednesday + Saturday) total ~141 minutes (~2 hrs 21 min), which fits inside 2.5 hours. The daily touch-ups are not weekend time -- they are 12 minutes distributed across each day, integrated into your existing morning and evening routines. The schedule is within reach.

**If you need to trim:** The biweekly rotation adds ~9 minutes per week on average. The dog tasks take 8-10 minutes on Saturday. The most cuttable item without hygiene consequence is Bedroom 3 (the guest room) -- reduce it to a quick 3-minute vacuum every other week.

---

### Cleaning Order Cheat Sheet (Post This on Your Utility Closet Door)

1. Apply cleaners to toilets and tub/shower FIRST -- let them dwell
2. Work top-to-bottom in every room (ceiling fan before floor)
3. Dry before wet (dust before mopping)
4. Farthest room from front door first -- end at the front door
5. Return to scrub fixtures AFTER doing all other room tasks

---

### Recommended Supply Kit

- Microfiber cloths x8 (wash weekly with towels in hot water -- do not use fabric softener, which destroys microfiber absorption)
- All-purpose cleaner spray (or 1:1 white vinegar + water in a labeled spray bottle -- add 10 drops of essential oil if you dislike the vinegar smell, it dissipates quickly)
- Bathroom shower/tub cleaner (choose one rated for soap scum and hard water mineral deposits)
- Toilet bowl cleaner + long-handled toilet brush (replace the brush every 3-4 months)
- Glass and mirror cleaner (or use a dry microfiber cloth on mirrors -- works as well as any product)
- Baking soda (abrasive scrub for sinks, stovetops, and tub grout)
- HEPA-filter vacuum with: upholstery attachment, brush attachment for baseboards, crevice tool for corners and stairs. With a dog, a HEPA filter is not optional
- Spray mop with washable pad (for kitchen and bathroom floors -- faster than a traditional mop and bucket)
- Rubber gloves (protect hands from cleaning products and reduce direct contact with toilet surfaces)
- Enzyme-based pet odor spray (for any accident areas, dog bed area, or anywhere odor persists -- enzyme formulas actually break down odor compounds rather than masking them)
- Old pillowcase x2 (dedicated to ceiling fan cleaning, stored with cleaning supplies)

---

**A note on the first two weeks:** The first time you run this schedule, the Wednesday session will take 10-15 minutes longer than estimated because you are clearing slight buildup from the period before the schedule started. By week 3, when daily touch-ups have been running consistently, you will find the sessions come in at or under the time estimates. The schedule calibrates to your home's maintenance level over time.
