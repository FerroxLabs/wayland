---
name: wayland-headline-lab
description: >-
  Generate 5-10 ranked headline angles for an offer or page, each with Method
  reasoning, then refine the winner.

  Use when the user wants headline options for a page or asset, with the Method
  logic behind each angle and an interactive refine loop.

  Do NOT use when the user wants a full sales letter (use
  wayland-full-sales-asset) or a copy audit (use wayland-conversion-audit).
license: Apache-2.0
type: workflow
skills: "convert-temperature convert-above-fold"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing conversion copywriting headlines above-fold step-by-step
  category: marketing
  depends: "convert-temperature convert-above-fold"
---

Headline lab. Generate ranked headline angles for an offer or page, each tagged
with Method reasoning (which Lock it breaks, which framework drives it), then let
the user pick a winner and refine it or request more variants.

**Step 1: Capture the brief** (uses: convert-above-fold)

Ask the user what the page or asset is and what action the headline must drive,
for example "lead-magnet opt-in for solo SaaS founders to download a runway
calculator." Capture the brief before generating anything.

- Input: user-supplied page/asset description and the target action
- Output: the captured headline brief
- Key focus: know the asset and the action before writing angles

**Step 2: Infer the audience temperature** (uses: convert-temperature)

Infer the audience temperature (cold, warm, hot) from the brief and state the
reasoning. Temperature decides how direct or curiosity-driven the headlines should
be. Let the user confirm or correct it.

- Input: the headline brief
- Output: the confirmed audience temperature with reasoning
- Key focus: calibrate the angles to the right temperature

**Step 3: Generate ranked headline angles** (uses: convert-above-fold)

Generate eight ranked headline angles for the brief, calibrated to temperature. Tag
each with Method reasoning: which Lock it breaks and which framework drives it.
Present them ranked best-first.

- Input: the brief and the temperature
- Output: eight ranked headline angles, each with a Method tag
- Key focus: distinct angles, each justified by the Method

**Step 4: Review, refine the winner, or generate more** (uses: convert-above-fold)

Present the ranked headlines and ask the user to refine a specific headline,
generate five more variants, or ship the list. If they pick a winner to refine,
iterate on that headline from their feedback (up to three passes). If they want
more, generate additional variants (up to two passes). Re-present after each pass
until they ship, then assemble the headline-lab document (brief, temperature,
ranked headlines).

- Input: the ranked headlines, the brief, temperature, user decision and feedback
- Output: the final approved headline list and the assembled headline-lab document
- Key focus: iterate to a winner the user ships, then package the list
