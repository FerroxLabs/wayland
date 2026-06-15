# voice-match

**Mode skill.** Default-enabled on the Humanizer specialist.

## When to use

Use when a Voiceprint profile file (typically `<name>-voice.md`) exists in the workspace or has been pasted into chat. Layers the user's voice rules on top of a rewrite pass so the output is humanized AND sounds like the actual user.

Trigger phrases:

- "Humanize this in my voice."
- "Rewrite this so it sounds like me."
- "Apply my voice file to this."

If a voice file is present, prefer this mode over plain `rewrite-pass`. If no voice file exists, default to plain rewrite-pass and append the offer surfaced in step 1 below. Do not gate on user choice.

## Procedure

**1. Locate the voice file.** Check the workspace for `*-voice.md`, `voice.md`, or similar. If multiple exist, ask which to apply. If pasted into chat, use that.

If no file exists, run plain `rewrite-pass` and append ONE line at the bottom of the output:

> *Note: no Voiceprint file in workspace. Want this sharper next time? Run Voiceprint once (~20 min) and I will layer your voice on every future pass.*

Then stop. Do not wait for the user to pick an option.

**2. Read the voice file.** Six sections per Voiceprint convention: Voice Fingerprint, Audience & Purpose, DO, DON'T, Reference Examples, Calibration Notes. The DON'T section is load-bearing. Those are tics the user has said they hate.

**3. Run rewrite-pass first.** Address AI-flatness + rhythm against the blacklist per `rewrite-pass`. Baseline target: composite AI-likelihood 2-3/10, sub-axes 8-9/10 human.

**4. Layer the voice rules on top:**

- **DON'T overrides.** Any AI substitution from step 3 must pass the user's banned list too. If their file says "never 'kick off'" and you swapped "embark" for "kick off," swap again. User rules win.
- **DO moves.** Apply at least two of the user's named structural habits (sentence-fragments-for-emphasis, em-dash-instead-of-comma, claim-then-defend, whatever the file lists) if content allows.
- **Reference Examples calibration.** Match the rhythm and register of the example excerpts. More formal than examples? Dial down. Tighter? Loosen.
- **Voice Fingerprint as final check.** Output should read consistent with the 5-8 fingerprint bullets.

**5. Output the rewrite + scores line + 4-bullet diff** (one more bullet than plain rewrite, for the voice-specific move):

```
<rewritten draft>

---
Scores: AI-flatness before X/10 → after Y/10 | Rhythm before X/10 → after Y/10 | Composite AI-likelihood before X/10 → after Y/10

Top changes:
1. <vocabulary or phrase swap, AI-side>
2. <rhythm or sentence break>
3. <structural or aside addition>
4. <voice-specific move applied from the voice file, name the DO rule>
```

Higher AI-likelihood = more AI; higher sub-axes = more human.

If a DON'T rule from the voice file conflicted with a humanize move, surface the conflict explicitly under a `Note:` line at the bottom of the output. Example: *"Your voice file says no semicolons; I used one in line 4 because the cadence broke without it. Override?"*

## Decision rules

- **The user's voice file wins over the AI blacklist when they conflict.** If the user's DO section says they like "navigate" in a specific context, keep it. The personal rule beats the general rule.
- **The voice file's bumps are the point.** If the user's reference examples include awkward phrasings the user has decided are theirs, do not smooth them. Match the spike.
- **Calibration drift gets surfaced, not silently corrected.** If the rewrite reads markedly different from the voice file's examples even after applying DO/DON'T rules, tell the user. They may want to refresh the voice file (Voiceprint's 6-month refresh path).
- **Without a voice file, do not fake it.** Do not invent the user's voice from one chat exchange. Run plain humanize and surface the Voiceprint offer.

## Anti-patterns

- Applying voice rules from memory instead of the file. The file is the canonical source; chat history is not.
- Treating Voice Fingerprint bullets as flowery descriptions. They name actual moves; apply them as moves, not as vibes.
- Smoothing the user's spiky reference examples into "professional" prose. Those bumps are intentional.
- Over-applying DO rules to copy that doesn't suit them. If the voice file says "uses sentence fragments for emphasis" and the rewrite is a financial disclosure, don't add fragments. Match register to content.
- Ignoring DON'T rules to satisfy AI-substitution rules. The user's banned-phrase list wins.

## Before / after

**Voice file says (excerpt):** *DO: short sentences for emphasis, em-dash-instead-of-comma when a clause earns weight, opens with a claim then defends it. DON'T: corporate hedging, "in many ways," generic engagement metaphors.*

**Input draft (AI-flat):**

> *In many ways, our analytics dashboard provides comprehensive insights that engage users with intricate data visualization, enabling them to navigate complex decisions effectively.*

**Output (voice-matched humanize):**

> *Our dashboard shows you what customers actually did. Not what you think they did, what they did. The charts are uglier than the competition's. You will not care once you have used it for a week.*

```
Scores: AI-flatness before 1/10 → after 9/10 | Rhythm before 1/10 → after 9/10 | Composite AI-likelihood before 9/10 → after 1/10

Top changes:
1. Cut every blacklist word ("in many ways," comprehensive, engage, intricate, navigate, effectively).
2. Rhythm from one 22-word sentence to 9 / 14 / 7 / 13, structural break and fragment-flavor callback.
3. Added "Not what you think they did" callback, pattern the voice file's reference examples used three times.
4. Voice DO: opened with a claim ("Our dashboard shows you what customers actually did"), then defended it ("the charts are uglier"). Matches Voice Fingerprint bullet 2.
```
