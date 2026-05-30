---
name: wayland-bullshit-clean
description: >-
  Run the Bullshit Filter on a single draft, automatically fix the three weakest
  lines, and return a cleaned copy.

  Use when the user has one draft of marketing or sales copy and wants it
  filtered for weak, vague, or hype-laden lines and rewritten in voice.

  Do NOT use when the user wants a full audit and score (use
  wayland-conversion-audit) or a whole directory of drafts cleaned at once (use
  wayland-bullshit-clean-batch).
license: Apache-2.0
type: workflow
skills: "convert-bullshit-filter convert-voice"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing conversion copywriting bullshit-filter voice cleanup
  category: marketing
  depends: "convert-bullshit-filter convert-voice"
---

Take a single copy draft, run it through the Bullshit Filter to find the lines
that are weakest by Donahoe-Method standards, then rewrite the three weakest
lines in the author's voice and hand back the cleaned draft. Fast, single-pass
cleanup, not a full scored audit.

Resolve the draft before starting: use the copy the user pasted or attached. If
nothing is provided, ask the user to paste the draft or point at the file. Do
not invent copy. If a `voice-notes.md` voice profile is available, use it to
keep the rewrites voice-aware.

**Step 1: Run the Bullshit Filter** (uses: convert-bullshit-filter)

Run the Bullshit Filter across the entire draft. Flag every line that is vague,
hype-laden, unsupported, or method-weak, and rank the offenders worst-first so
the next step knows which three lines to fix. Show the flagged lines with a
one-line reason for each.

- Input: the draft copy (pasted, attached, or from the named file)
- Output: ranked list of weak lines with reasons, worst-first
- Key focus: surface the weakest lines, do not yet rewrite them

**Step 2: Clean the weakest lines in voice** (uses: convert-voice)

Take the filter results and rewrite the three weakest flagged lines in the
author's voice. If a voice profile (`voice-notes.md`) is present, match its tone,
cadence, and vocabulary. Leave the rest of the draft untouched. Return the full
cleaned copy with the three rewritten lines in place, plus a short note on what
changed and why.

- Input: the draft copy, the ranked filter results, optional voice profile path
- Output: cleaned copy with the three weakest lines rewritten in voice, plus a change note
- Key focus: surgical voice-aware rewrite of only the weakest lines
