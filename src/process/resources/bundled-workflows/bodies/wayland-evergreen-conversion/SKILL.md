---
name: wayland-evergreen-conversion
description: >-
  Convert a one-time launch into an evergreen funnel that runs on autopilot.
  Reshapes existing launch assets into an evergreen presentation, ethical
  scarcity mechanic, automated lead flow, and an evergreen email drip.

  Use when the user has a finished live launch (webinar replay, email sequence,
  sales page, cart dates) and wants a structured process to make it run
  continuously for every new lead.

  Do NOT use for designing a launch from scratch or for a single asset edit one
  atomic skill can handle.
license: Apache-2.0
type: workflow
skills: "funnels-evergreen funnels-cart-cycle-launch funnels-daily-pivot funnels-story-drip"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing funnels evergreen automation step-by-step scarcity
  category: marketing
  depends: "funnels-evergreen funnels-cart-cycle-launch funnels-daily-pivot funnels-story-drip"
---
# Evergreen Conversion

**Estimated time:** 20-30 minutes

This workflow converts an existing one-time launch into an evergreen funnel that
runs on autopilot. Evergreen is not a launch with a timer slapped on it. A real
evergreen funnel resets conviction with each new lead, simulates scarcity
ethically, and handles the "I missed the cart" objection structurally. The
build reshapes the user's existing launch assets rather than inventing new ones.

## Steps

**Step 1: Gather the Launch Assets** (uses: funnels-evergreen)

Ask the user to paste or describe the live-launch elements they already have:
webinar replay, email sequence, sales page, cart-open dates, and so on. The more
material they provide, the cleaner the conversion. Do not advance until you have
a concrete inventory of the launch assets to work from.

- Input: user's existing live-launch elements
- Output: inventory of launch assets to convert
- Key focus: evergreen reshapes existing assets, so capture them fully first

**Step 2: Infer the Evergreen Shape** (uses: funnels-evergreen)

From the launch assets, recommend the evergreen shape. Present the recommended
shape with reasoning and let the user confirm or pick a different shape
(replay-VSL, deadline-funnel, challenge-evergreen, or application-only). The
shape determines how every later piece is built.

- Input: launch assets from Step 1
- Output: confirmed evergreen shape
- Key focus: pick the structural pattern the assets best support

**Step 3: Infer the Scarcity Mechanic** (uses: funnels-cart-cycle-launch)

Recommend the scarcity mechanic that ethically replaces cart-open dates, using
the chosen shape and the launch assets. The mechanic must be REAL, not a fake
countdown. Present it with reasoning and ask the user to confirm or override.

- Input: evergreen shape from Step 2, launch assets from Step 1
- Output: confirmed ethical scarcity mechanic
- Key focus: real scarcity per-lead, never a fabricated timer

**Step 4: Convert the Evergreen Presentation** (uses: funnels-evergreen)

Convert the launch presentation into its evergreen form using the assets, the
shape, and the scarcity mechanic. The presentation must reset conviction for
each new lead as if it were live. Show the evergreen presentation to the user
and ask whether to refine it or proceed to the lead flow and email sequences.
Revise on feedback before advancing.

- Input: launch assets, evergreen shape, scarcity mechanic
- Output: evergreen presentation
- Key focus: a presentation that re-earns conviction for every fresh lead

**Step 5: Design the Lead Flow** (uses: funnels-daily-pivot)

Design the automated lead flow so every new lead enters, runs through the
scarcity mechanic, and reaches the offer without manual intervention. Use the
evergreen presentation, the shape, and the scarcity mechanic. This is the
autopilot spine of the funnel.

- Input: evergreen presentation, shape, scarcity mechanic
- Output: automated lead flow design
- Key focus: every new lead enters and runs the system end to end with no manual steps

**Step 6: Design the Evergreen Email Sequence** (uses: funnels-story-drip)

Design the evergreen email drip that follows up each lead, using the evergreen
presentation and the lead flow in evergreen-drip mode. Show the lead flow and
email sequence to the user and ask whether to assemble the complete evergreen
blueprint or refine the lead flow or sequence. Revise on feedback before
advancing.

- Input: evergreen presentation, lead flow, evergreen-drip mode
- Output: evergreen email drip sequence
- Key focus: per-lead follow-up that mirrors the live launch on a rolling basis

**Step 7: Assemble the Evergreen Blueprint** (uses: funnels-evergreen)

Assemble the complete evergreen conversion blueprint. Open with the evergreen
shape and scarcity mechanic, then present the source launch assets, the
evergreen presentation, the lead flow, and the email sequence. Deliver it as the
final artifact: a full evergreen system where every new lead enters, runs
through scarcity, and gets follow-up.

- Input: all confirmed outputs from Steps 1 through 6
- Output: complete evergreen conversion blueprint
- Key focus: one coherent autopilot system the user can switch on
