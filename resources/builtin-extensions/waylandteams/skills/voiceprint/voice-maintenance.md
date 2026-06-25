# voice-maintenance

**Mode skill.** Default-enabled on the Voiceprint specialist. Runs the Refresh path and the running-log loop. Decay kills voice files — this discipline keeps yours useful past month six.

## When to use

Use when the user reports drift ("drafts feel off"), changed format or audience (podcast, newsletter, new market), keeps editing the same AI tic out of drafts, or every six months. Also any time the user wants a one-line correction in the running log without a full refresh.

Trigger phrases:

- "My voice file feels stale."
- "Drafts have been off for weeks."
- "Time for a refresh."
- "Add this to my voice notes."
- "I keep editing this phrase out — capture it."

## Procedure

**1. Decide: refresh, addendum, or running-log entry.** Three actions, three rules.

- **Running-log entry.** One AI tic edited out, one phrase that got it right, one reader comment. Append to `voice-notes.md` (create if missing) with a date stamp and one line of context. No file change. The daily loop — the highest-impact habit here.
- **Project addendum.** Off-register writing (job app, guest post, one-off in a new format). Don't edit the canon. Write a short addendum the user pastes alongside it.
- **Full refresh.** When one is true: canon is 6+ months old, audience or format changed, drafts felt off more than once in a month, the log has 10+ entries the canon doesn't reflect.

**2. Running-log entry: append, stamp, stop.** The whole point is zero friction.

**3. Addendum: a short markdown block** with three sections: *Context* (one sentence on what this is for and who reads it), *Adjustments to the canon* (which DOs to dial up or down, which DON'Ts to relax or tighten), *Banned for this piece only* (words that fit the normal voice but not this audience). Hand back with: *"Paste alongside the canonical voice file, not in place of it."*

**4. Full refresh: load three inputs and recompile.**

- **Current `<username>-voice.md`.** What the user has been running with.
- **Running `voice-notes.md`.** Every entry is a real-world correction. A phrase appearing 3+ times as "AI keeps writing X, I keep editing it out" becomes a new DON'T. A move appearing 3+ times as "this draft nailed it because of X" becomes a new DO.
- **3–5 fresh samples from the last 90 days.** New writing reveals where the voice moved — often before the user can articulate it.

Diff old against new. Three categories:

- **Keep.** New samples confirm.
- **Update.** New samples partially contradict (move evolved, audience shifted, format changed). Rewrite to match; note in calibration when it shifted.
- **Cut.** Samples no longer support and the log doesn't defend.

Then add anything new the log and fresh samples surface that the old file missed.

**5. Save with date in body.** Below the H1: *"Last refresh: YYYY-MM-DD. Previous version archived at `<username>-voice-vN.md` if you want the diff."* Stamping tells the user (and model) how fresh the signal is.

## Decision rules

- **Log entries are append-only.** Don't rewrite them on refresh — they're the audit trail.
- **Don't refresh more than every three months without a trigger.** Premature refresh chases noise.
- **One bad draft isn't a trigger.** Could be a bad prompt or a bad day. Two or more is signal.
- **A model upgrade alone is not a trigger.** Test first; some upgrades fix the tics the file compensated for.
- **Addenda don't merge into the canon.** Bury them with the project.

## Anti-patterns

- **Refreshing without samples from the last 90 days.** You'll codify the old voice harder. Fresh writing is the input that matters.
- **Treating the log as a wish list.** "I wish I wrote shorter sentences" is not log material. "AI wrote 40 words, I cut to 12 — capture the move" is.
- **Editing the canon every time a draft misses.** Friction in the loop is what makes the canon trustworthy. Capture the tic; let it accumulate; refresh on signal.
- **Renaming the file across versions.** Keep `<username>-voice.md` canonical. Archive prior versions with a suffix. The model needs a stable pointer.
- **Refreshing right after a model upgrade.** Test the unchanged file for a week first. The right move is often "no change needed."

## Before / after

**Brief:** User says: *"This model keeps writing 'delve into' and I keep deleting it. Drives me up the wall."*

**Before** (premature refresh):
> Voiceprint opens a session, rebuilds the file, the user re-gathers samples — 45 minutes on a one-line update.

**After** (running-log entry):
> Append to `voice-notes.md`:
> *2026-05-17 — Banned: "delve into." User edits it out every time. Add to DON'T at next refresh.*
> Then wait. When two more entries accumulate, the trigger is real.

The log loop is the whole game. Daily friction, monthly cleanup, semi-annual rebuild.
