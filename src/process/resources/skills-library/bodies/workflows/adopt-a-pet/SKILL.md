---
name: adopt-a-pet
description: >-
  Complete pet adoption workflow from research and lifestyle assessment through
  home preparation, finding and adopting the right pet, and successful
  integration into your household for a happy pet and confident owner.

  Use when the user wants to adopt a pet or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "new-pet-guide pet-behaviorist pet-trainer"
trigger_phrases: >-
  I want to adopt a pet help me adopt a dog adopting a cat getting a pet for the
  first time rescue pet adoption guide should I get a pet
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: pet-care habits family-events step-by-step planning
  category: life-event
  depends: "new-pet-guide pet-behaviorist pet-trainer"
  disclaimer: none
  difficulty: beginner
---
# Adopt A Pet

**Estimated time:** 4-8 weeks

Adopting a pet is a commitment of 10-20 years of daily care, emotional
connection, and financial responsibility. This workflow ensures the adoption
is successful for both you and the animal by guiding you through thorough
research, home preparation, finding the right match, the adoption process,
and the critical first weeks of integration.

The difference between a joyful adoption and a heartbreaking return is
preparation. This workflow provides that preparation.

By the end of this workflow you will have: clarity on the right type of pet
for your lifestyle, a prepared home, a well-matched adopted pet, and the
knowledge and systems needed for a smooth transition.

## When to Use

- User wants to adopt a pet
- User needs a structured, step-by-step process for adopt a pet
- User wants to adopt a pet
- User wants to adopt a dog
- adopting a cat
- Do NOT use when: the request is outside the scope of adopt a pet or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Stable living situation that allows pets (check lease agreements and HOA rules)
- Honest assessment of available time, energy, and finances for pet care
- All household members agree on getting a pet
- Willingness to commit to 10-20 years of care (depending on species)
- Openness to adopting from shelters and rescues (versus purchasing from breeders)

## Steps

**Step 1: Research and Self-Assessment** (uses: new-pet-guide)

determine the best type of pet for the user's
lifestyle. The goal is matching lifestyle to animal needs, not choosing a pet
based on looks alone.

- Input: living situation (house, apartment, urban, suburban, rural), Work schedule and daily time available for pet care, Activity level and outdoor habits
- Output: Ideal pet type, size, age, and temperament for the household, Monthly and annual cost projection for the matched pet type, Daily and weekly time requirements for the matched pet type
- Key focus: Species selection (dog, cat, rabbit, bird, fish, reptile, etc.)

**Step 2: Prepare Your Home** (uses: pet-behaviorist)

prepare your home for a safe and comfortable
arrival. A prepared home reduces stress for both pet and owner.

- Input: `pet-match-profile` from Step 1 (species and size determine preparation), Home layout and potential hazards, Existing pets in the household (if any)
- Output: Room-by-room pet-proofing checklist, Essential supplies to purchase before adoption, Designated areas for sleeping, eating, elimination, and play
- Key focus: Pet-proofing: toxic plants, chemicals, small objects, electrical cords, trash access

**Step 3: Find and Adopt Your Pet** (uses: new-pet-guide)

navigate the search and adoption process.
Patience in this step prevents regret later.

- Input: `pet-match-profile` from Step 1 (what you are looking for), `home-prep-checklist` from Step 2 (home is ready), Local shelters, rescues, and adoption events
- Output: Local shelters and rescues with contact information, Specific traits to look for and red flags to watch for, Completed application and adoption agreement
- Key focus: Identifying local shelters, breed-specific rescues, and foster networks

**Step 4: Integration and Bonding** (uses: pet-trainer)

guide the critical first weeks of integration.
Most adopted pets need 2-4 weeks to decompress and show their true personality
(the "3-3-3 rule": 3 days overwhelmed, 3 weeks settling, 3 months comfortable).

- Input: `space-plan` from Step 2 (where the pet lives in the home), `introduction-plan` from Step 2 (integration with existing pets/children), `medical-records` from Step 3 (health status and needs)
- Output: Established feeding, exercise, and rest schedule, Basic training goals and methods for the first month, Observations of behavior patterns, progress, and concerns
- Key focus: The 3-3-3 rule: set expectations for the adjustment timeline

## Decision Points

- **After Step 1:** What type of pet matches your lifestyle?
  - If **Dog**: Highest time and cost commitment. Requires daily walks, training, and significant attention.
  - If **Cat**: More independent but still needs daily care. Lower time commitment than dogs. Indoor recommended.
  - If **Small animal (rabbit, guinea pig, hamster)**: Smaller space needs but specific habitat requirements. Shorter lifespan for some species.
  - If **Other (bird, reptile, fish)**: Specialized care requirements. Research species-specific needs thoroughly.
- **After Step 2:** Where will you adopt from?
  - If **Local shelter**: Widest selection. Lower adoption fees. Many mixed breeds. Staff can advise on temperament.
  - If **Breed-specific rescue**: If you want a specific breed. Fosters know the animals well. May have longer wait times.
  - If **Foster network**: Animals in home environments. Foster families provide detailed behavior information.
  - If **Adoption event**: Concentrated opportunity to meet many animals. Bring your criteria list.

## Failure Handling

- **Impulse adoption:** Falling in love at the shelter without matching to lifestyle is the top cause of returns. Do the research first.
- **Underestimating costs:** Pets cost $1,000-$3,000+ annually. Vet emergencies can hit $2,000-$10,000. Budget realistically.
- **Expecting instant bonding:** The 3-3-3 rule means it takes weeks to months for an adopted pet to fully decompress. Patience is essential.
- **Skipping the vet visit:** Schedule a vet visit within the first week. Shelters do their best, but some conditions are not caught in the shelter environment.
- **Not training:** All dogs need basic training. All cats need litter box and scratch training. Start immediately with positive methods.

## Expected Outcome

When this workflow is complete, the user will have:

1. The pet type matches the household's lifestyle, schedule, and budget
2. The home is safe and properly set up before the pet arrives
3. The adoption is from a reputable source with full medical history
4. The pet is adjusting well within the 3-3-3 timeline
5. A veterinarian is established and the first checkup is complete
6. Basic training is in progress with positive results
7. All household members are comfortable and bonding with the pet

## Output Format

```
ADOPT A PET TRACKER
===================

[ ] Step 1: Research and Self-Assessment
    Status: [pending/in-progress/complete]
[ ] Step 2: Prepare Your Home
    Status: [pending/in-progress/complete]
[ ] Step 3: Find and Adopt Your Pet
    Status: [pending/in-progress/complete]
[ ] Step 4: Integration and Bonding
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Impulse adoption:** Falling in love at the shelter without matching to lifestyle is the top cause of returns. Do the research first.
- **Underestimating costs:** Pets cost $1,000-$3,000+ annually. Vet emergencies can hit $2,000-$10,000. Budget realistically.
- **Expecting instant bonding:** The 3-3-3 rule means it takes weeks to months for an adopted pet to fully decompress. Patience is essential.
- **Skipping the vet visit:** Schedule a vet visit within the first week. Shelters do their best, but some conditions are not caught in the shelter environment.


### Timeline Considerations

This workflow is designed to be completed sequentially, but experienced users may parallelize some steps. Key dependencies:

- Each step builds on outputs from previous steps
- Steps involving external parties may have variable timelines
- Budget constraints may require phasing steps across multiple weeks or months
- Regular progress reviews between steps help catch issues early

### Success Indicators

Track these signals to confirm the workflow is on track:

- Each step produces a concrete, reviewable deliverable
- User confidence increases as steps are completed
- Deliverables from early steps remain valid as later steps are executed
- No critical assumptions from earlier steps are invalidated
- External feedback (where applicable) is incorporated before proceeding

## Example

**Input:** "I want to adopt a pet and need a structured plan to follow step by step."

**Output:**

**Step 1 (new-pet-guide):** Research and Self-Assessment -- produces concrete deliverables for this phase.

**Step 2 (pet-behaviorist):** Prepare Your Home -- produces concrete deliverables for this phase.

**Step 3 (new-pet-guide):** Find and Adopt Your Pet -- produces concrete deliverables for this phase.

**Step 4 (pet-trainer):** Integration and Bonding -- produces concrete deliverables for this phase.

**Result:** User has a complete adopt a pet plan with all deliverables produced, validated, and ready for implementation.
