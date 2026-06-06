---
name: wayland-full-sales-asset
description: >-
  Write a complete long-form direct-response sales letter end-to-end:
  temperature, four-layer open, three locks, body and bullets, proof, and a
  Cascade Close.

  Use when the user wants a full sales letter built from scratch using The
  Donahoe Method, reviewing at each major beat.

  Do NOT use when the user only needs an audit of existing copy (use
  wayland-conversion-audit), a close rebuild (use wayland-close-rebuild), or a
  VSL (use wayland-vsl-build).
license: Apache-2.0
type: workflow
skills: "convert-temperature convert-four-questions convert-three-locks convert-open convert-package convert-close convert-bullshit-filter"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing conversion copywriting sales-letter donahoe-method step-by-step
  category: marketing
  depends: "convert-temperature convert-four-questions convert-three-locks convert-open convert-package convert-close convert-bullshit-filter"
---

Write a full long-form direct-response sales letter using The Donahoe Method,
end-to-end. Diagnose temperature, the Four Questions, and the Three Locks, then
write the four-layer open, the body, and the Cascade Close, Filter the close, and
assemble the complete letter. The user reviews at each major beat.

**Step 1: Capture the offer and prospect** (uses: convert-temperature)

Ask the user for the offer in one sentence and the target prospect in one
sentence. Capture both before any diagnosis. Set expectations that they will
review at the major beats (open, body, close).

- Input: user-supplied offer sentence and target-prospect sentence
- Output: the captured offer-and-prospect brief
- Key focus: get a crisp offer and prospect to anchor every downstream beat

**Step 2: Infer the audience temperature** (uses: convert-temperature)

Infer the audience temperature (cold, warm, hot) from the offer and prospect.
State the temperature, the reasoning, and the Method implication. Temperature is
the most-skipped, most-consequential decision in DR copy: wrong temperature means
wrong everything downstream. Let the user confirm or override.

- Input: the offer-and-prospect brief
- Output: the confirmed audience temperature with its Method implication
- Key focus: lock temperature first because it calibrates the whole letter

**Step 3: Diagnose the Four Questions** (uses: convert-four-questions)

Run the Four Questions diagnostic for this offer and prospect: Why You, Why Me,
Why This, Why Now. State the answers and reasoning, calibrated to temperature.
Ask the user to confirm or refine.

- Input: the offer-and-prospect brief and the temperature
- Output: the confirmed Four Questions diagnosis (Why You / Why Me / Why This / Why Now)
- Key focus: answer all four before structuring the letter

**Step 4: Diagnose the Three Locks** (uses: convert-three-locks)

Break the prospect down by the Three Locks: Want, Trust, Excuse. Every section of
the letter is engineered to break one of these locks, so lock the diagnosis here.
State the Want/Trust/Excuse breakdown and the reasoning, informed by temperature
and the Four Questions, and confirm with the user.

- Input: offer-and-prospect brief, temperature, Four Questions
- Output: the confirmed Want / Trust / Excuse breakdown
- Key focus: the locks diagnosis the entire structure flows from

**Step 5: Write the four-layer open** (uses: convert-open)

Write five ranked Four-Layer Opens for this offer, calibrated to temperature and
the Three Locks. Present them ranked with Method reasoning. Ask the user to pick
one, refine, or request more variants; if they want a different angle, refine the
opens from their feedback (up to three passes) before proceeding.

- Input: offer brief, temperature, Three Locks
- Output: five ranked Four-Layer Opens and the user's chosen open
- Key focus: a strong, temperature-calibrated open the user commits to

**Step 6: Write the body** (uses: convert-package)

Write the body sections in body-only mode: bullets, proof stack, and the
three-locks sequence, building on the chosen open. Calibrate to temperature and
the locks. Present the body and ask the user to proceed to the close or refine; if
they refine, iterate from their feedback (up to three passes).

- Input: offer brief, temperature, Three Locks, the chosen open
- Output: the approved body (bullets, proof stack, three-locks sequence)
- Key focus: a body that breaks each lock in sequence and earns the close

**Step 7: Write the Cascade Close** (uses: convert-close)

Write the Cascade Close for the letter, building on the body and the Three Locks:
Stack to Vision to Math to Safety Net to Door, plus P.S. and P.P.S. Address every
buyer type. Show the close.

- Input: offer brief, the body, Three Locks
- Output: a full Cascade Close covering all seven beats
- Key focus: close every lock and buyer type the letter has set up

**Step 8: Filter the close, review, and assemble** (uses: convert-bullshit-filter)

Run the Bullshit Filter on the Cascade Close and present the flagged lines
alongside the close. Ask the user to assemble the complete letter or refine the
close; if they refine, iterate from their feedback (up to three passes), Filtering
again, until they approve. Then assemble the complete sales letter: temperature,
Four Questions, Three Locks, open, body, close, and the Filter pass.

- Input: the Cascade Close, offer brief, body, user refinement feedback
- Output: the Filter pass and the assembled complete sales letter document
- Key focus: clean the close, then package the full letter end-to-end
