---
name: wayland-vsl-build
description: >-
  Build an 18-minute VSL script plus the hosting page and thank-you page, with
  buy-button reveal mechanics and a Bullshit Filter pass.

  Use when the user wants a complete video sales letter package built from an
  offer, with an interactive review at each beat.

  Do NOT use when the user wants a text sales letter (use
  wayland-full-sales-asset) or only a close (use wayland-close-rebuild).
license: Apache-2.0
type: workflow
skills: "convert-temperature convert-three-locks convert-vsl convert-vsl-page convert-thank-you-page convert-bullshit-filter"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing conversion copywriting vsl video-sales-letter step-by-step
  category: marketing
  depends: "convert-temperature convert-three-locks convert-vsl convert-vsl-page convert-thank-you-page convert-bullshit-filter"
---

Build a complete VSL package: an 18-minute video sales letter script, the hosting
page that reveals the buy button at the right moment, and the thank-you page,
finished with a Bullshit Filter pass. The user reviews at each beat.

**Step 1: Capture the offer brief** (uses: convert-vsl)

Ask the user for the offer, target prospect, and price point in one paragraph.
Capture the brief before any inference. Set expectations: an 18-minute script plus
the hosting page, reviewed at each beat.

- Input: user-supplied offer, prospect, and price point
- Output: the captured offer brief
- Key focus: a complete offer brief including price before scripting

**Step 2: Infer the audience temperature** (uses: convert-temperature)

Infer the audience temperature (cold, warm, hot) from the offer brief and state
the reasoning. Let the user confirm or correct it.

- Input: the offer brief
- Output: the confirmed audience temperature with reasoning
- Key focus: calibrate the script pacing and proof to temperature

**Step 3: Infer the conviction mechanism** (uses: convert-three-locks)

Infer the core conviction mechanism: the unique discovery or framework that makes
the offer feel inevitable and turns "why hasn't this worked for me yet" into "ah,
THIS is what I was missing." Without a unique mechanism a VSL feels like an
infomercial. State the mechanism and reasoning, and ask the user to confirm or
substitute their real mechanism.

- Input: the offer brief and the temperature
- Output: the confirmed conviction mechanism
- Key focus: lock the mechanism that makes the offer feel inevitable

**Step 4: Write the 18-minute VSL script** (uses: convert-vsl)

Write the 18-minute VSL script with timestamps and presenter cues, built on the
offer, temperature, and conviction mechanism. Present it and ask the user to
proceed to the hosting page or refine the script; if they refine, iterate from
their feedback (up to three passes).

- Input: offer brief, temperature, conviction mechanism
- Output: the approved 18-minute VSL script with timestamps and presenter cues
- Key focus: a paced script that lands the mechanism and earns the buy

**Step 5: Write the hosting page** (uses: convert-vsl-page)

Write the VSL hosting page with the buy-button reveal mechanics that surface the
button at the right moment in the script. Calibrate to temperature. Present it and
ask the user to proceed to the thank-you page or refine; if they refine, iterate
from their feedback (up to three passes).

- Input: the VSL script, offer brief, temperature
- Output: the approved hosting page with buy-button reveal mechanics
- Key focus: reveal the button at the conviction moment, not before

**Step 6: Write the thank-you page** (uses: convert-thank-you-page)

Write the close-screen and thank-you page for the package, built on the offer and
the script. Present it to the user.

- Input: offer brief, the VSL script
- Output: the thank-you / close-screen page
- Key focus: a thank-you page that confirms the purchase and sets next steps

**Step 7: Filter the script, review, and assemble** (uses: convert-bullshit-filter)

Run the Bullshit Filter on the VSL script and present the flagged lines. Ask the
user to assemble the complete VSL package or do more polish; if they want polish,
refine the script (up to three passes), Filtering again, until they approve. Then
assemble the VSL package: temperature, mechanism, script, hosting page, thank-you
page, and the Filter pass.

- Input: the VSL script, hosting page, thank-you page, user polish feedback
- Output: the Filter pass and the assembled complete VSL package
- Key focus: clean the script, then package the full VSL asset
