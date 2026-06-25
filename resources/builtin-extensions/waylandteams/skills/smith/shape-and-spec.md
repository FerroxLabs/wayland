# Shape and spec

## When to use

Use this skill when the team is about to start a build and the appetite is unspoken. If a teammate or the user hands you a feature request without naming how long they're willing to bet on it, run this procedure before any spec. Also use it when an in-flight build is sliding past its budget and someone needs to decide whether to cut scope or extend the bet.

You are not coding here. You produce a written shaped concept that the coding agent (Cursor, Claude Code, the user's IDE) will turn into code.

## Procedure

1. **Name the raw idea in one sentence.** Whatever the user said, restate it as a single sentence ending in a verb the user can recognize. If you cannot restate it in one sentence, the idea is two ideas — split it.

2. **Fix the appetite.** Ask the user directly: *small batch (hours to a couple of days), medium (a week), or big batch (a multi-week cycle)?* Appetite is a budget, not an estimate. The point is not "how long will it take" — the point is "how long is the user willing to spend before we throw it out and try something else." Write the appetite at the top of the shaped doc.

3. **Find the meaningful problem.** Ask: *what is broken right now, and what does the user do today instead?* If the answer is "nothing, they don't have a way to do this yet," the problem is greenfield and risk goes up. If the answer is "they hack around it with a spreadsheet," the spreadsheet is the breadboard — start there.

4. **Breadboard the solution.** Draw, in text, three things: **places** (the screens or surfaces the user passes through), **affordances** (what they can do on each), and **connections** (what flows between them). Use fat-marker resolution — `[Inbox] → click row → [Detail view: title, body, archive, snooze] → snooze → [Inbox with row hidden]`. No pixels, no fonts, no React component names.

5. **Name the rabbit holes.** Walk the breadboard and ask: *which step here could eat the whole appetite if we let it?* Common culprits: auth flows, file uploads, search, anything cross-tenant, anything with a timezone. Write each rabbit hole as a one-liner with the chosen mitigation: cut it, time-box it, fake it for v1, or defer to a follow-up.

6. **Write the no-gos.** Explicit list of features the user might assume are in scope but are not. *No bulk actions in v1. No export. No mobile-specific styling.* The no-gos are how you protect the appetite.

7. **Hand the shaped doc to the architecture-decision step or the coding-agent ticket.** If the build needs a non-trivial technical call (storage, sync model, service boundary), route to `architecture-decisions.md` first. If it's a straight implementation, route to `agent-handoff.md`.

## Decision rules

- If the user can't pick an appetite, the idea isn't ready to spec. Send it back with two questions: what's the worst-case cost of being wrong, and what's the deadline the result is feeding into.
- If the breadboard has more than seven places, the appetite is wrong or the scope is wrong. Pick one.
- If a rabbit hole has no mitigation, it isn't a rabbit hole — it's the actual project. Re-shape around it.
- If the user pushes back on a no-go, that no-go is a hidden requirement. Promote it into scope and re-check the appetite.

## Anti-patterns

- Figma-resolution mockups before the breadboard. Visual detail launders unresolved scope.
- Listing features instead of places and affordances. Feature lists describe what the team agreed to build; breadboards describe what the user agreed to do.
- Skipping no-gos because "obviously we won't." Obvious to you, invisible to the coding agent.
- Letting "appetite" drift into "estimate." Appetite is a budget; estimate is a guess. Different artifact.

## Before-and-after

**Before:** *"Build a notifications inbox. Should support email, SMS, in-app. Probably needs filters, search, bulk archive. Reusable across products."*

**After (shaped):**
- **Appetite:** 1 week.
- **Problem:** Users miss in-app events because we email-blast everything; emails get filtered.
- **Breadboard:** `[Bell icon w/ count] → [Inbox list: title, preview, time] → click → [Detail view: full text, archive]`. Email is unchanged; bell mirrors the same payload.
- **Rabbit holes:** Read-receipt sync across tabs → fake it with optimistic update for v1. Cross-product reuse → out of scope, ship single-product first.
- **No-gos:** No SMS. No filters. No search. No bulk archive. No mobile-specific layout. No preferences UI — defaults only.

The "after" is twelve lines and the coding agent can start; the "before" is forty lines of feature-list and the coding agent will ask six clarifying questions before writing a line.
