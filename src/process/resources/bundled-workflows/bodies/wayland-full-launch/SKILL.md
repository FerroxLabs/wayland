---
name: wayland-full-launch
description: >-
  Full cross-pack product launch workflow. Directs a coordinated launch across
  positioning, offer architecture, funnel, copy assets, content cadence, sales
  follow-up, ads creative, and a calendar with dependencies, ending in a
  post-launch debrief plan.

  Use when the user wants a structured, multi-step process to plan and assemble a
  complete launch from brief to ready-to-ship package.

  Do NOT use for a single asset (one email, one sales page) or a quick question
  that one atomic skill can answer.
license: Apache-2.0
type: workflow
skills: "launch market-audit funnels-offer funnels-cart-cycle-launch convert-package content-calendar sales-followup market-ads market-launch"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing launch step-by-step planning campaign funnel
  category: marketing
  depends: "launch market-audit funnels-offer funnels-cart-cycle-launch convert-package content-calendar sales-followup market-ads market-launch"
---
# Full Launch

**Estimated time:** 90-120 minutes

This workflow directs a full product launch end to end. It coordinates the work
across positioning, offer, funnel, copy, content, sales follow-up, ads, and
scheduling, then produces a single assembled launch package plus a post-launch
debrief plan. It is a long workflow; session state is saved so the user can
resume. Keep total back-and-forth to a small interaction budget (about 8 user
touchpoints) by batching questions and only pausing at the defined review gates.

Throughout, carry forward the launch brief and the inferred launch shape so every
later step stays consistent with the original intent.

**Step 1: Kickoff and Capture the Launch Brief** (uses: launch)

Open the launch. Tell the user you will direct a full launch coordinated across
positioning, offer, funnel, copy, content, and sales follow-up, and that it is a
long session (90-120 min) whose state saves so they can resume. Ask the user for:
what is launching, the target launch date, the audience source, and what is
already built (if anything). Gather this before proceeding.

- Input: user goal
- Output: launch_brief (what is launching, launch date, audience source, current assets)
- Key focus: capture a complete brief in one exchange

**Step 2: Infer the Launch Shape** (uses: launch)

From the launch brief, infer the best launch shape: cart-cycle, evergreen,
mini-launch, or seeded waitlist. Present the recommended shape and a short
reasoning. Let the user override if they disagree, otherwise proceed with the
inferred shape.

- Input: launch_brief
- Output: shape (recommended launch shape + reasoning)
- Key focus: pick the launch structure that fits the brief

**Step 3: Build the Positioning** (uses: market-audit)

Produce the launch positioning: the angle the launch communicates. Use the brief
and the chosen shape as inputs and operate in launch-positioning mode. Show the
output to the user.

- Input: launch_brief, shape
- Output: positioning (the launch angle)
- Key focus: a sharp, single-minded launch angle

**Step 4: Review Positioning Gate** (uses: market-audit)

Show the positioning. Ask the user to either proceed to offer architecture or
refine the positioning. If they request refinement, gather their feedback and
re-run the positioning step with that feedback plus the brief, repeating up to 3
times until they approve, then continue.

- Input: positioning, user decision
- Output: approved positioning or refinement feedback
- Key focus: lock positioning before building the offer

**Step 5: Build the Offer Architecture** (uses: funnels-offer)

Build the offer using the approved positioning and the brief, in launch-offer
mode. Define the core offer, stack, pricing logic, and guarantee. Show the
output.

- Input: positioning, launch_brief
- Output: offer (offer architecture)
- Key focus: an offer the positioning can sell

**Step 6: Build the Funnel** (uses: funnels-cart-cycle-launch)

Build the launch funnel from the offer and shape, using the brief for context.
Lay out the funnel stages appropriate to the chosen shape (for a cart cycle:
pre-launch, open, mid, close). Show the output.

- Input: offer, shape, launch_brief
- Output: funnel (funnel architecture)
- Key focus: a funnel that matches the launch shape

**Step 7: Review Offer and Funnel Gate** (uses: funnels-cart-cycle-launch)

Show the offer plus funnel architecture. Ask the user to proceed to copy and
content or refine the offer/funnel. On refinement, gather feedback and re-run the
funnel step with the feedback and the offer, up to 3 times, then continue.

- Input: offer, funnel, user decision
- Output: approved funnel or refinement feedback
- Key focus: lock the offer and funnel before writing copy

**Step 8: Build the Copy Assets** (uses: convert-package)

Produce the launch copy assets from the offer, funnel, and positioning, in
launch-copy-assets mode. This is the package of conversion copy the funnel needs.
Show the output.

- Input: offer, funnel, positioning
- Output: copy_assets (launch copy package)
- Key focus: copy that carries the offer through the funnel

**Step 9: Build the Content Cadence** (uses: content-calendar)

Build the content cadence from the brief and offer, in launch-cadence mode: the
organic and owned-channel content schedule that warms and supports the launch.
Show the output.

- Input: launch_brief, offer
- Output: content_cadence (content schedule for the launch)
- Key focus: content that builds momentum into the open

**Step 10: Review Copy and Content Gate** (uses: convert-package)

Show the copy assets and content cadence. Ask the user to proceed to sales
follow-up and ads or refine copy/content. On refinement, gather feedback and
re-run the copy step with the feedback and offer, up to 2 times, then continue.

- Input: copy_assets, content_cadence, user decision
- Output: approved copy/content or refinement feedback
- Key focus: lock messaging before sales and ads

**Step 11: Build Sales Follow-up** (uses: sales-followup)

Build the sales follow-up sequence from the offer and funnel, in launch-followup
mode: the post-engagement outreach that recovers and closes. Show the output.

- Input: offer, funnel
- Output: sales_followup (follow-up sequence)
- Key focus: convert interested-but-unclosed buyers

**Step 12: Build Ads Creative** (uses: market-ads)

Build ad creative variants from the offer and positioning, in
launch-creative-variants mode. Produce a set of distinct creative angles aligned
to the positioning. Show the output.

- Input: offer, positioning
- Output: ads (creative variants)
- Key focus: paid creative that matches the launch angle

**Step 13: Build the Calendar With Dependencies** (uses: market-launch)

Build the full launch calendar with dependencies from the shape and brief, in
full-launch-calendar-with-dependencies mode. Sequence every asset and milestone
with its prerequisites so the launch can be executed against dates. Show the
output.

- Input: shape, launch_brief
- Output: calendar (dated launch calendar with dependencies)
- Key focus: an executable timeline tying every asset to a date

**Step 14: Build the Post-Launch Debrief Plan** (uses: launch)

Build the post-launch debrief plan from the brief, in post-launch-debrief-plan
mode: what to measure, when to review, and how to feed learnings into the next
launch. Show the output.

- Input: launch_brief
- Output: debrief_plan (post-launch debrief plan)
- Key focus: close the loop after the launch ends

**Step 15: Final Review and Assemble the Package** (uses: market-launch)

Show the sales follow-up, ads, calendar with dependencies, and debrief plan. Ask
the user if they are ready to assemble the complete launch package. If they want
changes to the calendar or debrief, gather feedback and re-run the calendar step
with the feedback and shape, up to 2 times. When approved, assemble the final
package combining shape, positioning, offer, funnel, copy assets, content
cadence, sales follow-up, ads, calendar, and debrief plan into one document.

- Input: all prior step outputs, user decision
- Output: launch_package (assembled full launch package)
- Key focus: one coherent, ready-to-execute launch package
