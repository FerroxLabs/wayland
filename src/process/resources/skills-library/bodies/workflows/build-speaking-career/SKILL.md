---
name: build-speaking-career
description: >-
  Step-by-step workflow for professionals who want to build a public speaking
  career, from identifying your signature topic and crafting compelling content
  through speaking at local events, building toward regional conferences, and
  eventually landing keynote opportunities and paid speaking engagements.

  Use when the user wants to build speaking career or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "storytelling-master presentation-builder public-speaking-coach personal-brand-architect content-monetizer"
trigger_phrases: >-
  I want to become a speaker build a speaking career how to get speaking gigs
  become a conference speaker keynote speaking guide start speaking at events
  get paid to speak
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: presentation content-marketing career step-by-step planning
  category: career
  depends: "storytelling-master presentation-builder public-speaking-coach personal-brand-architect content-monetizer"
---
# Build Speaking Career

**Estimated time:** 6-18 months

This workflow guides professionals through the journey of building a speaking
career, from complete beginner to paid keynote speaker. Public speaking is one
of the most powerful career accelerators available -- it builds authority,
expands your network, creates business opportunities, and compounds over time.
But most people approach it backwards, trying to land big stages before they
have earned credibility on small ones.

This workflow follows the natural progression: find your topic, build your
content, prove yourself locally, expand regionally, and earn the keynote stage.
Each step builds on the last, creating a portfolio of speaking evidence that
opens doors to larger opportunities.

By the end of this workflow you will have: a signature speaking topic, polished
talk content, local speaking experience, a growing speaker reputation, and a
strategy for keynote and paid speaking engagements.

## When to Use

- User wants to build speaking career
- User needs a structured, step-by-step process for build speaking career
- User wants to become a speaker
- build a speaking career
- how to get speaking gigs
- Do NOT use when: the request is outside the scope of build speaking career or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Expertise or deep experience in at least one subject area
- Willingness to be vulnerable and visible in front of audiences
- Commitment to practice and iterate on your delivery
- Patience for the long game (speaking careers build over 12-18 months minimum)
- Basic comfort with being recorded on video

## Steps

**Step 1: Find Your Signature Topic** (uses: storytelling-master)

identify and refine a signature speaking
topic that sits at the intersection of your expertise, audience need, and
personal passion.

- Input: professional expertise, interests, and unique experiences, Topics they are passionate about and could talk about repeatedly, Their target audience (developers, executives, marketers, general)
- Output: Defined speaking topic with unique angle and audience fit, 5-10 polished talk titles with abstracts, Personal stories cataloged by theme and teaching point
- Key focus: Topic mining: inventory your knowledge, experiences, and unique insights

**Step 2: Build Your Content** (uses: presentation-builder)

create polished, compelling talk
content. A great topic with poor delivery fails. A mediocre topic with
exceptional delivery succeeds.

- Input: `signature-topic` from Step 1 (topic and angle to build around), `talk-titles` from Step 1 (specific talks to develop), `story-bank` from Step 1 (stories to weave into talks)
- Output: Polished slide deck for the primary talk, Detailed notes for rehearsal and delivery, Talk structure that adapts to different time slots
- Key focus: Talk structure: opening hook, core narrative arc, memorable close

**Step 3: Speak Locally and Build Proof** (uses: public-speaking-coach)

start building your speaking portfolio
with local events. Local stages are where you refine your craft, build
confidence, and generate the evidence that opens doors to bigger stages.

- Input: `talk-deck` from Step 2 (content ready to deliver), `speaker-notes` from Step 2 (rehearsed delivery), local professional community and meetup scene
- Output: Calendar of target local events with application timeline, Pre-talk preparation routine and delivery reminders, Aggregated feedback from local talks with improvement themes
- Key focus: Local opportunity mapping: meetups, user groups, company tech talks,

**Step 4: Expand to Regional and Industry Conferences** (uses: personal-brand-architect)

elevate your speaking career from
local to regional and industry conferences. The CFP (Call for Papers) process
is competitive. Your local portfolio is your credential.

- Input: `speaker-portfolio` from Step 3 (evidence of speaking ability), `talk-titles` from Step 1 (abstracts ready for CFP submission), `feedback-tracker` from Step 3 (refined content based on audience response)
- Output: Researched list of target conferences with CFP deadlines, Polished abstracts ready for submission, Professional speaker page with bio, topics, and portfolio
- Key focus: Conference research: identifying target conferences by audience fit,

**Step 5: Pursue Keynotes and Paid Speaking** (uses: content-monetizer)

transition from free conference talks to
paid speaking engagements and keynote opportunities. This is the business
side of speaking.

- Input: `speaker-portfolio` from Step 3 (expanded with conference talks), `speaker-page` from Step 4 (professional speaker presence), `conference-targets` from Step 4 (relationships with event organizers)
- Output: Tiered speaking fee structure with terms, Revenue model for speaking career with targets, Paid workshop based on speaking expertise
- Key focus: Speaker fee research: understanding market rates by event type, audience

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Starting too big:** Do not aim for keynotes before you have done 10+ local talks. Build your craft on small stages where the stakes are low.
- **Slides over substance:** Beautiful slides cannot save a poorly structured talk. Nail the narrative first, design slides second.
- **Not recording talks:** Every talk you do not record is a missed portfolio opportunity. Even a phone recording is better than nothing.
- **Ignoring feedback:** Local audiences are your testing ground. Collect feedback systematically and iterate.
- **One talk forever:** Develop multiple talks from your expertise. Conference organizers want speakers with range.

## Expected Outcome

When this workflow is complete, the user will have:

1. A signature speaking topic is defined with a unique angle
2. Talk content is polished, rehearsed, and audience-tested
3. At least five local talks have been delivered with recorded evidence
4. At least one regional or industry conference talk has been accepted
5. A professional speaker page and video reel exist
6. A clear path to paid speaking is defined with initial revenue
7. Speaking is generating professional opportunities beyond the stage

## Output Format

```
BUILD SPEAKING CAREER TRACKER
=============================

[ ] Step 1: Find Your Signature Topic
    Status: [pending/in-progress/complete]
[ ] Step 2: Build Your Content
    Status: [pending/in-progress/complete]
[ ] Step 3: Speak Locally and Build Proof
    Status: [pending/in-progress/complete]
[ ] Step 4: Expand to Regional and Industry Conferences
    Status: [pending/in-progress/complete]
[ ] Step 5: Pursue Keynotes and Paid Speaking
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Starting too big:** Do not aim for keynotes before you have done 10+ local talks. Build your craft on small stages where the stakes are low.
- **Slides over substance:** Beautiful slides cannot save a poorly structured talk. Nail the narrative first, design slides second.
- **Not recording talks:** Every talk you do not record is a missed portfolio opportunity. Even a phone recording is better than nothing.
- **Ignoring feedback:** Local audiences are your testing ground. Collect feedback systematically and iterate.

## Example

**Input:** "I want to build speaking career and need a structured plan to follow step by step."

**Output:**

**Step 1 (storytelling-master):** Find Your Signature Topic -- produces concrete deliverables for this phase.

**Step 2 (presentation-builder):** Build Your Content -- produces concrete deliverables for this phase.

**Step 3 (public-speaking-coach):** Speak Locally and Build Proof -- produces concrete deliverables for this phase.

**Step 4 (personal-brand-architect):** Expand to Regional and Industry Conferences -- produces concrete deliverables for this phase.

**Step 5 (content-monetizer):** Pursue Keynotes and Paid Speaking -- produces concrete deliverables for this phase.

**Result:** User has a complete build speaking career plan with all deliverables produced, validated, and ready for implementation.
