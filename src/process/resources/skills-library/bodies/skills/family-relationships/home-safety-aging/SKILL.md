---
name: home-safety-aging
description: |
  Produces a comprehensive home safety assessment checklist for aging in place,
  covering fall prevention, mobility accommodation, bathroom safety, lighting
  improvements, emergency contact setup, and room-by-room hazard identification.
  Generates prioritized modification plans with urgency levels and cost estimates.
  Use when the user asks about making a home safer for an elderly person,
  fall prevention, or aging-in-place modifications.
  Do NOT use for care facility evaluation (use care-facility-evaluation),
  medical assessment of fall risk (consult a physician), or full home
  renovation planning.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "elder-care checklist home-maintenance"
  category: "family-relationships"
  subcategory: "caregiving"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Home Safety Assessment for Aging in Place

## When to Use

**Use this skill when:**
- User asks about making a home safer for an aging parent or relative
- User wants a fall prevention checklist for a senior's home
- User asks about aging-in-place modifications or accommodations
- User wants to assess home hazards for an elderly family member
- User asks about bathroom safety, grab bars, or mobility aids for the home

**Do NOT use this skill when:**
- User wants to evaluate care facilities (use `care-facility-evaluation`)
- User needs medical assessment of fall risk or mobility (physician assessment required)
- User wants full home renovation planning (this covers safety modifications only)
- User asks about caregiver coordination (use `caregiver-coordination`)
- User asks about home maintenance schedules for a general household (this is specifically for aging safety)

## Process

1. **Assess current mobility and risk level.** Gather baseline information:
   - Current mobility status: independent, uses cane, uses walker, uses wheelchair
   - Recent fall history: number of falls in the past 6 months and circumstances
   - Vision status: corrected vision, low vision, significant impairment
   - Cognitive status: fully independent, occasional confusion, needs reminders
   - Current medications (some increase fall risk -- dizziness, drowsiness side effects)

   Note: This assessment gathers information for home modification planning. It is not a medical evaluation. If the user reports frequent falls or sudden changes in mobility, recommend a physician evaluation before or alongside home modifications.

2. **Conduct the room-by-room safety audit.** Walk through each area systematically:

   **Entryways and Exterior:**
   - [ ] Porch and walkway are well-lit (minimum 50 lumens per square foot at night)
   - [ ] Steps have contrasting color strips on edges for visibility
   - [ ] Handrails present on both sides of all exterior steps
   - [ ] Doorway thresholds are flush or ramped (no trip hazards above 1/4 inch)
   - [ ] Door locks and handles are operable with one hand and minimal grip strength
   - [ ] Welcome mat is secured flat (no curled edges)
   - [ ] House numbers are visible from the street for emergency responders

   **Living Areas:**
   - [ ] All walkways are at least 36 inches wide for walker or wheelchair clearance
   - [ ] Area rugs are removed or secured with non-slip backing
   - [ ] Electrical cords are routed along walls, never across walkways
   - [ ] Furniture is arranged to create clear, unobstructed paths
   - [ ] Frequently used items are stored between waist and shoulder height
   - [ ] Light switches are accessible at every room entrance
   - [ ] At least one chair has armrests and a seat height of 18-20 inches for easier standing

   **Kitchen:**
   - [ ] Frequently used items are on lower shelves (no step stools needed daily)
   - [ ] Step stool (if needed) has a handrail and non-slip surface
   - [ ] Stove has automatic shut-off feature or a stove guard timer installed
   - [ ] Floor surface is non-slip (no wax buildup)
   - [ ] Fire extinguisher is mounted within reach (not above cabinets)
   - [ ] Adequate task lighting over countertops and stove (under-cabinet lights recommended)
   - [ ] Hot water heater is set to 120 degrees F maximum to prevent scalding

   **Bathroom (highest-risk room):**
   - [ ] Grab bars installed next to toilet (wall-mounted, rated for 250+ lbs)
   - [ ] Grab bars installed inside shower or tub (at entry point and on back wall)
   - [ ] Non-slip mat or adhesive strips in tub and shower floor
   - [ ] Raised toilet seat installed (adds 3-4 inches for easier sitting and standing)
   - [ ] Shower chair or transfer bench available if standing is difficult
   - [ ] Handheld showerhead installed for seated bathing
   - [ ] Night light with automatic sensor for nighttime bathroom trips
   - [ ] Medicine cabinet contents are clearly labeled with large text
   - [ ] Floor mat outside shower is non-slip and lies flat

   **Bedroom:**
   - [ ] Bed height allows feet to rest flat on the floor when sitting on the edge (typically 20-23 inches including mattress)
   - [ ] Path from bed to bathroom is lit with motion-activated night lights
   - [ ] Light switch or lamp is reachable from the bed without standing
   - [ ] Phone or personal emergency response device is within reach from bed
   - [ ] Closet contents are organized with daily items at accessible height

   **Stairs (if applicable):**
   - [ ] Handrails on both sides, securely anchored (should support full body weight)
   - [ ] All steps are uniform height (uneven steps are a major fall risk)
   - [ ] Non-slip treads or contrasting color strips on each step edge
   - [ ] Adequate lighting at top, bottom, and along the stairway
   - [ ] Light switches at both top and bottom of stairs
   - [ ] No clutter or stored items on steps
   - [ ] Consider stair lift if mobility makes stairs unsafe (consult occupational therapist)

3. **Set up the emergency response system:**
   - [ ] Personal emergency response device (medical alert button) worn at all times
   - [ ] Emergency contact list posted by each phone and on the refrigerator
   - [ ] List includes: primary emergency contact, backup contact, physician, pharmacy, nearest hospital
   - [ ] Smoke detectors tested monthly (replace batteries every 6 months; replace units every 10 years)
   - [ ] Carbon monoxide detector on each floor
   - [ ] House key accessible to emergency contacts (lockbox with combination, spare with trusted neighbor)
   - [ ] Emergency information sheet on refrigerator: medical conditions, allergies, medications, blood type, insurance information

4. **Prioritize modifications by urgency:**

   **Immediate (complete within 1 week):**
   - Remove or secure loose rugs
   - Install night lights along bathroom path
   - Clear walkway obstructions
   - Set hot water heater to 120 degrees F
   - Post emergency contact information

   **Short-term (complete within 1 month):**
   - Install bathroom grab bars
   - Add non-slip surfaces to tub and shower
   - Install stove guard or auto-shutoff timer
   - Set up personal emergency response device
   - Add handrails to exterior steps

   **Medium-term (complete within 3 months):**
   - Improve lighting throughout (replace bulbs with brighter options, add under-cabinet lights)
   - Install raised toilet seat
   - Reorganize storage to eliminate overhead reaching
   - Add motion-activated lights in hallways
   - Replace round doorknobs with lever handles

   **Long-term (plan and budget):**
   - Stair lift installation
   - Walk-in shower conversion
   - Wheelchair ramp construction
   - Widening doorways (if wheelchair or wide walker needed)
   - Smart home devices (voice-activated lights, video doorbell, automated locks)

5. **Estimate costs for modifications.** Provide general cost ranges:

   | Modification | Estimated Cost Range | DIY Possible |
   |-------------|---------------------|--------------|
   | Grab bars (per bar, installed) | $30-80 | Yes, if anchored into studs |
   | Non-slip bath adhesives | $10-25 per set | Yes |
   | Raised toilet seat | $25-80 | Yes |
   | Handheld showerhead | $25-60 | Yes |
   | Night lights (motion-activated, 6-pack) | $15-30 | Yes |
   | Shower chair or transfer bench | $40-150 | N/A |
   | Under-cabinet lighting (per section) | $20-60 | Yes |
   | Lever door handles (per handle) | $15-40 | Yes |
   | Stove guard auto-shutoff | $80-200 | Yes |
   | Personal emergency response device | $20-50/month | N/A |
   | Stair lift (installed) | $3,000-8,000 | No |
   | Walk-in shower conversion | $3,000-10,000 | No |
   | Wheelchair ramp (installed) | $1,000-4,000 | Possible for experienced DIY |

6. **Create the follow-up schedule:**
   - [ ] Re-assess home safety every 6 months or after any change in mobility
   - [ ] Test smoke detectors and CO detectors monthly
   - [ ] Replace smoke detector batteries every 6 months
   - [ ] Check grab bar anchoring every 3 months
   - [ ] Review emergency contact list quarterly (update phone numbers, physician changes)
   - [ ] Check night light functionality monthly

## Output Format

```
## Home Safety Assessment Report

### Resident Profile
- **Name:** [Name]
- **Mobility status:** [Independent / Cane / Walker / Wheelchair]
- **Recent falls:** [Number in past 6 months, circumstances]
- **Vision:** [Corrected / Low vision / Significant impairment]

### Room-by-Room Findings

#### [Room Name]
| Item | Status | Action Needed | Priority | Est. Cost |
|------|--------|---------------|----------|-----------|
| [Item] | Pass/Fail | [Action] | Immediate/Short/Medium/Long | $XX |

### Emergency Preparedness
- [ ] Emergency response device: [In place / Needed]
- [ ] Emergency contacts posted: [Yes / No]
- [ ] Smoke/CO detectors tested: [Date]

### Priority Action Plan

**Immediate (This Week):**
1. [Action] -- [Cost estimate] -- [Who will do it]

**Short-Term (Within 1 Month):**
1. [Action] -- [Cost estimate] -- [Who will do it]

**Medium-Term (Within 3 Months):**
1. [Action] -- [Cost estimate] -- [Who will do it]

**Total Estimated Cost:** $X,XXX - $X,XXX

### Follow-Up Schedule
- Next reassessment: [Date -- 6 months from now]
- Smoke detector test: [Monthly on the 1st]
- Emergency contact review: [Quarterly]
```

## Rules

1. NEVER provide medical assessment of fall risk or mobility -- this skill assesses the home environment, not the person's medical condition
2. ALWAYS prioritize bathroom modifications first -- bathrooms account for the highest percentage of in-home falls among seniors
3. ALWAYS include cost estimates for every recommended modification
4. ALWAYS flag the hot water temperature check -- scalding injuries from water above 120 degrees F are preventable and common
5. Include the 36-inch minimum walkway width measurement for every room -- this is the ADA standard for walker or wheelchair passage
6. Flag grab bars as wall-mounted only -- suction cup grab bars are unreliable and can cause falls when they fail under load
7. Every assessment must include an emergency response system evaluation regardless of how minor the other findings are
8. Recommend professional installation for any modification that is structural (stair lifts, ramp construction, doorway widening, walk-in shower conversion)
9. ALWAYS recommend a follow-up reassessment schedule -- needs change, and a safe home today may have new hazards in 6 months
10. Present findings in a table format with pass/fail status, never as prose paragraphs

## Edge Cases

- **Rental property:** When the senior rents rather than owns, note which modifications require landlord permission (grab bars, ramp installation, doorway widening) vs. which can be done without permission (non-slip mats, night lights, furniture rearrangement). Many landlords will approve safety modifications if asked. The Fair Housing Act may require landlords to allow reasonable modifications at the tenant's expense for disabled individuals.

- **Multi-story home with stairs as primary barrier:** If stairs are the primary safety concern and a stair lift is not feasible (cost or structural reasons), recommend converting a ground-floor room to a bedroom and bathroom if possible. This avoids the stair risk entirely. If no ground-floor bathroom exists, a portable commode may be a temporary solution while planning renovations.

- **Cognitive impairment (dementia, Alzheimer's):** Add additional checks: stove controls that can be disabled when unsupervised, door alarms on exterior doors, locked cabinets for cleaning supplies and medications, simplified remote controls and phone interfaces, and labels on drawers and cabinets. Consider a home monitoring camera system for remote family members to check in (with the resident's knowledge and consent where possible).

- **Limited budget:** Focus on the highest-impact, lowest-cost modifications first: removing loose rugs (free), installing night lights ($15-30), securing grab bars in the bathroom ($30-80 per bar, can be DIY if studs are available), and posting emergency contacts (free). These four modifications address the most common fall scenarios for under $150 total.

- **Resistance to modifications:** When the senior resists changes to their home, start with the least visible modifications (night lights, non-slip bath strips, water heater adjustment) and frame them as maintenance updates rather than safety accommodations. Grab bars can be chosen in decorative styles that look like towel bars. The goal is safety without making the home feel institutional.

## Example

**Input:** "My dad is 82, uses a walker, and lives alone in a two-story house. He had a fall in the bathroom last month. What should we do to make his home safer?"

**Output:**

## Home Safety Assessment Report

### Resident Profile
- **Name:** [User's father]
- **Mobility status:** Walker
- **Recent falls:** 1 fall in the past month (bathroom)
- **Vision:** [Ask user to confirm]

### Priority Action Plan

**Immediate (This Week) -- Estimated Cost: $45-85:**
1. Remove all loose area rugs throughout the house -- $0 -- Family member
2. Install 3 motion-activated night lights along path from bedroom to bathroom -- $15-30 -- Family member
3. Verify hot water heater is set to 120 degrees F or below -- $0 -- Family member
4. Post emergency contact list by phone and on refrigerator -- $0 -- Family member
5. Clear any items stored on stairway steps -- $0 -- Family member

**Short-Term (Within 1 Month) -- Estimated Cost: $200-450:**
1. Install 3 grab bars in bathroom: beside toilet, shower entry, shower back wall (wall-mounted, 250+ lb rated, anchored into studs) -- $90-240 installed -- Handyperson or family member with stud finder
2. Place non-slip adhesive strips inside tub or shower -- $10-25 -- Family member
3. Install raised toilet seat (adds 4 inches) -- $40-80 -- Family member
4. Set up personal emergency response device (medical alert pendant) -- $20-50/month -- Family member helps with setup
5. Install handheld showerhead for seated bathing -- $25-60 -- Family member or plumber

**Medium-Term (Within 3 Months) -- Estimated Cost: $300-700:**
1. Add second handrail to stairway (currently likely has one side only) -- $100-200 installed -- Handyperson
2. Replace round doorknobs with lever handles on bathroom and bedroom doors -- $60-160 (4 handles) -- Family member
3. Install under-cabinet kitchen lighting -- $40-120 -- Family member
4. Add motion-activated lights in hallways -- $40-80 -- Family member
5. Install shower chair or transfer bench -- $50-150 -- Family member

**Long-Term Planning -- Estimated Cost: $3,000-10,000:**
1. Evaluate stair lift installation for main stairway -- $3,000-8,000 -- Professional installation required
2. Consider converting ground-floor room to bedroom to eliminate stair use entirely -- Variable -- Contractor assessment needed
3. Evaluate walk-in shower conversion to replace tub -- $3,000-10,000 -- Professional installation required

**Total Immediate + Short-Term Estimate:** $245-535
**Total All Modifications Estimate:** $3,545-11,235

### Bathroom-Specific Findings (Fall Location)

| Item | Status | Action | Priority | Est. Cost |
|------|--------|--------|----------|-----------|
| Grab bars near toilet | FAIL | Install wall-mounted bar | Short-term | $30-80 |
| Grab bars in shower | FAIL | Install 2 bars (entry + back wall) | Short-term | $60-160 |
| Non-slip tub surface | FAIL | Add adhesive strips | Short-term | $10-25 |
| Raised toilet seat | FAIL | Install 4-inch riser | Short-term | $40-80 |
| Night light | FAIL | Install sensor night light | Immediate | $5-10 |
| Floor mat | CHECK | Verify non-slip backing, lies flat | Immediate | $0-15 |
| Shower chair | ABSENT | Provide for seated bathing | Medium-term | $50-150 |

### Critical Note About Stairs
Your father uses a walker on a two-story home. Stairs with a walker are a significant fall risk. The short-term plan adds a second handrail, but the long-term goal should be either a stair lift or moving his bedroom and primary bathroom to the ground floor. Discuss this with his physician and consider an occupational therapist home visit for a professional stair safety assessment.

### Follow-Up Schedule
- Next full reassessment: 6 months from now or immediately after any fall
- Monthly: test smoke detectors, check night light function, check grab bar anchoring
- Quarterly: review emergency contacts, confirm emergency response device is functioning
