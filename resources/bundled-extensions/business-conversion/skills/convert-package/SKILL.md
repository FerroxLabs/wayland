---
name: convert-package
slash_command: false
pack: business-conversion
family: conversion_composite
description: |
  Build a complete sales asset end-to-end via The Donahoe Method: diagnostic → primitives → fingerprint → page → integrity-gate → visual → audit → report. Composite orchestrator that calls 14-16 sub-skills via delegate_task in an 8-phase DAG (sequential where dependencies require it, parallel where they don't). Produces a client-ready full-asset bundle.
  Use when the user has a product brief and wants the full agency-replacement deliverable in one run - not for single-primitive work.
  Not for live-page audit (use /market landing) and not for partial Method runs (call individual /convert sub-skills).
triggers:
  - convert package
  - full sales asset
  - end to end sales page
  - end-to-end sales page
  - full method run
  - donahoe full build
  - build the full sales asset
  - build the page bundle
  - sales-asset bundle
negative_triggers:
  - just write the open
  - just the headline
  - audit my url
  - build my campaign
  - everything for the launch
  - launch my product
  - agency replacement
tags: [conversion, page, donahoe-method, composite, orchestration, sales-page]
priority: 100
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-four-questions, convert-temperature, convert-open, convert-three-locks, convert-bullets, convert-proof, convert-close, convert-sales-page, convert-above-fold, convert-scroll-rhythm, convert-mobile, convert-proof-stack, convert-audit, convert-report]
    delegation:
      max_concurrent_children: 5
attribution:
  lineage: "Wayland-owned cross-skill orchestration over The Donahoe Method (Wayland-owned operating system)"
---

# Convert Package - Full Sales-Asset Composite (the agency replacement)

> *"That's the Donahoe Method. Write like a human. Sell like you mean it. Close like you know it works."* - The Donahoe Method, summary

This skill is the suite-level orchestrator that takes a product brief and emits a complete, ship-ready sales asset built end-to-end through the Method. It calls 14-16 sub-skills across 8 phases, parallelizing where the DAG allows. The output is everything an agency would deliver - diagnostic, copy, page, integrity gate, visual specs, audit, client report - in one composite run.

**Note on `convert-transition`:** the transition library is consumed by `convert-chute` (which uses transitions as part of momentum engineering - open loops at section breaks, energy moves, etc.) rather than running as a standalone phase. When P3.5 invokes `convert-chute`, transitions are already integrated. There is no separate transition phase by design.

## When to Use

Trigger phrases: "convert package", "full sales asset", "agency replacement", "end to end sales page", "full method run", "donahoe full build", "build the whole thing", "everything for the launch", `/convert package <product>`.

Use when:
- The user has a product brief and wants the full deliverable, not just one primitive
- The user is replacing an agency engagement and wants the complete artifact bundle
- A net-new launch needs the asset stack assembled in one coordinated pass
- A re-launch requires rebuilding the page from the Method foundations up

Do NOT use for:
- A single primitive (use the specific sub-skill: `/convert open`, `/convert close`, etc.)
- Live-URL audits - use `/market landing <url>`
- Net-new offer construction - use `/funnel offer` first; package consumes the offer
- Funnel-level architecture (multi-asset campaigns) - use `/funnel build-campaign` (which can call this skill as one component)

## What This Composite Delivers

A complete asset bundle:

1. **Diagnostic** - The Four Questions answered + Market Temperature classification
2. **Method primitives** - The Open + The Three Locks + The Bullets + The Proof + The Cascade Close
3. **Sales page** - Full long-form direct-response page (copy + structure)
4. **Visual specs** - Above-fold hero spec + Scroll-rhythm map + Mobile compression + Proof-stack visual layouts
5. **Method audit** - 0-100 Donahoe Method score with prioritized fixes
6. **Client-ready report** - Aggregate of all of the above, formatted for handoff

Total artifacts: 12-14 files written to `out_path/<product-slug>/`.

## The Full DAG (8 phases, 14-16 sub-skill calls)

```
PHASE 1 - DIAGNOSTIC (sequential)
  └─ convert-four-questions <product>           [must run first; informs all others]
       └─ convert-temperature <product>         [depends on Four Questions output]

PHASE 2 - METHOD PRIMITIVES (parallel via delegate_task, max_concurrent_children: 5)
  ├─ convert-open <product>                     [depends on P1]
  ├─ convert-three-locks <product>              [depends on P1]
  ├─ convert-bullets <product>                  [depends on P1]
  ├─ convert-proof <product>                    [depends on P1]
  └─ convert-close <product>                    [depends on P1]

PHASE 2.5 - FINGERPRINT (sequential, after P2)
  └─ convert-fingerprint <product + P2 outputs> [develops only-you POV / contrarian voice that propagates through P3]

PHASE 3 - SALES PAGE ASSEMBLY (sequential)
  └─ convert-sales-page <product>               [composes P2 + P2.5 outputs into the page]

PHASE 3.5 - METHOD INTEGRITY GATE (sequential, three steps in order)
  ├─ convert-chute <P3 output>                  [engineers momentum: open loops, paragraph rhythm, transitions]
  ├─ convert-voice <P3 output>                  [applies Voice Rules - first person, contractions, no marketing-speak]
  └─ convert-bullshit-filter <P3 output>        [adversarial coaching pass - quotes 3 weakest lines, forces 3 rewrites each]

PHASE 4 - VISUAL SPECS (parallel via delegate_task, max_concurrent_children: 4)
  ├─ convert-above-fold <product>               [depends on P3 for headline + CTA]
  ├─ convert-scroll-rhythm <product>            [depends on P3 for section list]
  ├─ convert-mobile <product>                   [depends on P3 + P4.scroll-rhythm]
  └─ convert-proof-stack <product>              [depends on P2.proof + P3]

PHASE 5 - METHOD AUDIT (sequential, AFTER the integrity gate)
  └─ convert-audit <p3 output>                  [audits page AFTER P3.5 has had a chance to surface weaknesses; depends on P3 + P3.5 + P4]

PHASE 6 - CLIENT REPORT (sequential)
  └─ convert-report <all prior artifacts>        [depends on P1-P5; aggregates]
```

**Total sub-skill calls:** 14-16 (P1: 2 sequential; P2: 5 parallel; P2.5: 1 sequential; P3: 1 sequential; P3.5: 3 sequential; P4: 4 parallel; P5: 1 sequential; P6: 1 sequential).

**Why the integrity gate (P3.5) runs BEFORE the audit (P5):** the audit is an inspection - but the chute + voice + bullshit-filter steps actually FIX the draft. Running them after P3 (page assembly) and before P5 (audit) means the audit scores the post-fix version, not the raw page output. This avoids the "AI grades its own homework while still failing" problem identified in the Pass 1 cross-audit.

**The Bullshit Filter is a coaching pass, not a gate.** P3.5's filter call quotes the 3 weakest lines and forces 3 rewrites of each. The composite output includes those quotes + rewrites for the user to choose from. There is no "PASSED ✓" stamp anywhere - the user inspects the coaching artifact and decides whether to ship.

**Concurrency requirement:** This composite requires `delegation.max_concurrent_children >= 5` in the harness config. P2 fans out to 5 simultaneous children. P4 fans to 4 (within the same limit). If the harness is set lower than 5, P2 falls back to sequential - the asset still produces correctly, but slower (~3-5 minutes longer).

**Configuration check at runtime:**
```yaml
# In settings.json or pack-level config
delegation:
  max_concurrent_children: 5   # required for parallel phases of /convert package
```
If the runtime cannot meet this, log a warning and serialize P2 + P4. Note the fallback in the report.

## Inputs

Required:
1. **Product brief** - what we're selling. Minimum: product name, what it does, what it costs, who it's for. Better: full brief with target reader (one specific person), the nerve, founder credibility detail, real proof inventory, offer details.

Optional:
2. **Stated audience temperature** - overrides what `convert-temperature` would default; if provided, used as input rather than derived
3. **Brand visual constraints** - colors, typography, image style (informs P4 visual specs)
4. **Existing assets** - prior copy, prior page, prior audits - pulled in as comparison material in P5
5. **`out_path`** - caller-controlled output. Defaults to `build_report_path("business-conversion", instruction)/<product-slug>/`

If the product brief is too thin (e.g., just a product name), the orchestrator pauses at the start of P1 and asks the One Person Rule prompt:
*"Before I can run the Method, describe the one person you're writing this for. Not a segment - one specific human. Name them, give me their city, their day, what's keeping them up at night. The whole asset is built around this person."*

Don't proceed without the One Person.

## Workflow

### Pre-flight - config check + brief validation

1. Verify `delegation.max_concurrent_children >= 5`. If lower, log fallback warning.
2. Validate the product brief contains: product name, what it does, the One Person, the Nerve, the price/offer. If any missing, ask once for the missing fields.
3. Initialize `out_path/<product-slug>/`.

### Phase 1 - Diagnostic (sequential)

**Step 1.1 - `convert-four-questions <product>`**

Delegate. Inputs: product brief. Output: `01-four-questions.md` containing:
- Why You? (why this person, today)
- Why Me? (why this author/company)
- Why This? (the unique mechanism)
- Why Now? (the real reason to act today, never manufactured)

This output is the strategic foundation. Every later phase reads it.

**Step 1.2 - `convert-temperature <product>`**

Delegate. Inputs: product brief + `01-four-questions.md`. Output: `02-temperature.md` containing:
- Stated temperature (if user supplied)
- Diagnosed temperature (Ice Cold / Cool / Warm / Hot / Boiling)
- Awareness profile of the audience
- Implications for length, tone, pitch placement

### Phase 2 - Method Primitives (parallel)

Fan out 5 children via `delegate_task`. All read P1's outputs as context.

**Step 2.1 (parallel) - `convert-open <product>`**

Output: `03-open.md` - 5 candidate Four-Layer Opens with layer breakdown + recommended pick.

**Step 2.2 (parallel) - `convert-three-locks <product>`**

Output: `04-three-locks.md` - Want / Trust / Excuse content for each lock, mapped to scroll zones.

**Step 2.3 (parallel) - `convert-bullets <product>`**

Output: `05-bullets.md` - bullet bank across all 4 types (Keyhole / Flip / Snapshot / Scar), mixed for rhythm.

**Step 2.4 (parallel) - `convert-proof <product>`**

Output: `06-proof.md` - proof copy spanning all 5 types (Anecdote / Receipt / Drive-By / Namecheck / Because), inventoried by available real items.

**Step 2.5 (parallel) - `convert-close <product>`**

Output: `07-close.md` - full Cascade Close (Stack / Vision / Math / Safety Net / Door + P.S. + P.P.S.).

Wait barrier: all 5 must complete before P3.

### Phase 3 - Sales Page Assembly (sequential)

**Step 3.1 - `convert-sales-page <product>`**

Delegate. Inputs: product brief + `01-07.md`. Output: `08-sales-page.md` containing:
- Full long-form sales page copy (14-18 sections per the canonical skeleton)
- Section-by-section structure
- Paste-ready HTML/CSS (semantic, mobile-first)
- Method audit footer (preliminary; full audit lives in P5)

This skill composes the P2 primitives into the actual page. It is the most token-heavy single call in the composite.

### Phase 4 - Visual Specs (parallel)

Fan out 4 children. All read `08-sales-page.md`.

**Step 4.1 (parallel) - `convert-above-fold <product>`**

Output: `09-above-fold.md` - hero spec (wireframe + slot specs + HTML/CSS) + 5-second-test result.

**Step 4.2 (parallel) - `convert-scroll-rhythm <product>`**

Output: `10-scroll-rhythm.md` - section-by-section visual flow + Lock zone mapping + CTA anchor placements + transition specs.

**Step 4.3 (parallel) - `convert-mobile <product>`**

Output: `11-mobile.md` - mobile-first compression spec (375px baseline, verified at 320px) + sticky CTA spec + paste-ready mobile-first CSS.

**Step 4.4 (parallel) - `convert-proof-stack <product>`**

Output: `12-proof-stack.md` - visual proof patterns (1-7) mapped to real proof inventory + paste-ready HTML/CSS for each pattern.

Wait barrier: all 4 must complete before P5.

### Phase 5 - Method Audit (sequential)

**Step 5.1 - `convert-audit <p3 output + p4 outputs>`**

Delegate. Inputs: `08-sales-page.md` (the copy) + `09-12.md` (the visual specs). Output: `13-audit.md` containing:
- 0-100 normalized Donahoe Method score
- Dimension-by-dimension findings (8 dimensions)
- Prioritized rewrite recommendations
- Method audit footer

If the audit score is < 70, the report flags this and recommends the user iterate (rerun specific primitives + re-audit). The composite does NOT auto-iterate by default - that's a user decision. If the user adds `--auto-iterate` to the package call, the orchestrator can rerun the lowest-scoring primitive once and re-audit, capping at one iteration.

### Phase 6 - Client Report (sequential)

**Step 6.1 - `convert-report <all P1-P5 outputs>`**

Delegate. Inputs: every prior artifact. Output: `14-client-report.md` containing:
- Executive summary (the asset built, the Method score, the deliverable list)
- The Four Questions answered
- The temperature classification
- The full sales page (copy + HTML)
- Visual specs gallery (hero, scroll rhythm, mobile, proof stack)
- Method audit results
- Recommended next moves
- Asset list with file paths

This is the document the user hands to a client / stakeholder / launch team.

### Post-flight - bundle + summary

1. Write a `00-manifest.md` listing all 14 files with one-line descriptions.
2. Emit a console summary: total time, sub-skills run, audit score, output path.
3. If audit score < 70, surface the recommendation prominently: *"Audit scored X. Suggested iteration: rerun /convert <skill> on dimension <N>."*

## Output Structure

```
<out_path>/<product-slug>/
├── 00-manifest.md
├── 01-four-questions.md
├── 02-temperature.md
├── 03-open.md
├── 04-three-locks.md
├── 05-bullets.md
├── 06-proof.md
├── 07-close.md
├── 08-sales-page.md          ← the actual page (copy + HTML)
├── 09-above-fold.md           ← hero visual spec
├── 10-scroll-rhythm.md        ← section flow visual spec
├── 11-mobile.md               ← mobile compression spec
├── 12-proof-stack.md          ← proof visual patterns
├── 13-audit.md                ← Method audit + score
└── 14-client-report.md        ← client-ready aggregate
```

Each file is self-contained and readable independently. The client-report aggregates them for handoff.

## Output Template for the Manifest

```markdown
# Convert Package Manifest: <Product>

**Built via:** /convert package
**Date:** <ISO>
**One Person:** <named>
**Temperature:** <Ice Cold / Cool / Warm / Hot / Boiling>
**Audit score:** <X / 100>
**Output path:** <absolute path>

## Artifacts

| # | File | What it contains | Generated by |
|---|------|-------------------|---------------|
| 1 | 01-four-questions.md | Why You / Me / This / Now | convert-four-questions |
| 2 | 02-temperature.md | Audience temperature classification | convert-temperature |
| 3 | 03-open.md | 5 Four-Layer Open candidates + pick | convert-open |
| 4 | 04-three-locks.md | Want / Trust / Excuse content | convert-three-locks |
| 5 | 05-bullets.md | Bullet bank (4 types mixed) | convert-bullets |
| 6 | 06-proof.md | Proof copy (5 types) | convert-proof |
| 7 | 07-close.md | Cascade Close (5 layers + P.S./P.P.S.) | convert-close |
| 8 | 08-sales-page.md | Full sales page (copy + HTML) | convert-sales-page |
| 9 | 09-above-fold.md | Hero visual spec | convert-above-fold |
| 10 | 10-scroll-rhythm.md | Section flow + Lock map | convert-scroll-rhythm |
| 11 | 11-mobile.md | Mobile-first compression | convert-mobile |
| 12 | 12-proof-stack.md | Visual proof patterns | convert-proof-stack |
| 13 | 13-audit.md | 0-100 Method score + fixes | convert-audit |
| 14 | 14-client-report.md | Client-ready aggregate | convert-report |

## DAG actually executed

[diagram showing the 8 phases (P1, P2, P2.5, P3, P3.5, P4, P5, P6), what fanned in parallel, what serialized, total time]

## Next moves

<auto-recommendation based on audit score: ship-ready / iterate / re-run primitives>

---

*Generated by /convert package - The Donahoe Method end-to-end.*
```

## DAG Execution Notes

### Why Phase 2 fans out (parallelization rationale)

The five Method primitives in P2 (`open`, `three-locks`, `bullets`, `proof`, `close`) are **pairwise independent**. Each reads the same P1 inputs (Four Questions + Temperature) and produces independent output. None depends on another's output to run. Parallelizing them cuts P2 wall time from ~5x to ~1x (limited by the slowest child).

### Why Phase 3 must be sequential

`convert-sales-page` consumes ALL P2 outputs as inputs. It composes the Open into Section 1-2, the Three Locks across the zones, the Bullets into Section 8, the Proof into Sections 7+9, the Close into Sections 11-17. P3 cannot start until P2 is fully complete.

### Why Phase 4 fans out

The four visual sub-skills are pairwise independent given P3's output. `above-fold` reads only the hero copy; `scroll-rhythm` reads the section list; `mobile` reads the page structure for compression rules; `proof-stack` reads the proof copy + section placement. None depends on another's output.

### Why Phase 5 is sequential

The audit reads P3 (the page copy) and P4 (the visual specs) as input. It cannot start until both are complete.

### Why Phase 6 is sequential

The report aggregates all prior artifacts. Last in the DAG.

### Total wall-time estimate (with max_concurrent_children: 5)

- P1: ~2 sub-skills × 30s each = 60s
- P2: 5 parallel = ~max(child times) ≈ 60s (bottleneck = the slowest of 5)
- P3: 1 sub-skill × 90s = 90s (token-heaviest)
- P4: 4 parallel = ~max(child times) ≈ 45s
- P5: 1 sub-skill × 45s = 45s
- P6: 1 sub-skill × 30s = 30s
- **Total: ~5-6 minutes** (vs ~12-15 min serialized)

If `max_concurrent_children` is lower:
- =3: P2 takes 2 batches, P4 takes 2 batches; +90s
- =1 (serialized): +5-6 minutes total

### Failure handling

- **A child fails in P2:** the other 4 still complete. The orchestrator surfaces the failure, asks user whether to retry the failed child or proceed with degraded inputs. P3 cannot proceed until all P2 succeed (or are explicitly waived).
- **A child fails in P4:** P5 audits whatever visual specs completed. Missing visual specs are flagged in the audit's "Visual" section.
- **P3 fails:** halt. P3 is the load-bearing core; without it, downstream is meaningless.
- **P5 fails:** report still emits without an audit; flag prominently.
- **P6 fails:** all primitive artifacts still exist; user can manually compile.

## Pitfalls

- **Skipping the One Person Rule.** If the user gives a vague brief ("agency owners"), the entire composite produces generic copy. Halt at pre-flight and force a specific One Person definition.
- **Concurrency mismatch.** If the runtime can't meet `max_concurrent_children: 5`, P2 serializes. Surface this in the manifest so the user understands the time cost.
- **Composite ≠ pipeline.** This is a DAG, not a strict pipeline - phases that can run in parallel do. A simple linear "run skill A then B then C" doesn't capture the actual structure.
- **Iterative re-runs.** The composite produces v1. If the audit scores low (<70), iterating on the lowest-scoring primitive often lifts the score 10+ points. Treat v1 as a starting point, not a final.
- **Brief drift across children.** Each delegated child receives the same brief. If the brief is ambiguous, children may interpret differently and produce inconsistent outputs. Force precision in the brief at pre-flight.
- **Visual specs without copy alignment.** If P4's visual specs are produced from an early draft and P3's copy is regenerated, the visual specs become stale. The DAG enforces P4 reads from P3's final output - never from a partial.
- **Audit short-circuits.** Don't let the audit produce "looks good" rubber-stamps. The audit follows its rubric strictly; if a dimension scored 6, it's a 6, not "close enough to 7."
- **Report bloat.** The client report can grow to 50+ pages if every artifact is duplicated. The report SHOULD reference and excerpt; duplication is friction.
- **Auto-iteration loops.** `--auto-iterate` runs ONE iteration max. Multi-iteration auto-loops produce diminishing returns and risk drift; cap at one.

## Lineage

This composite is **Wayland-owned cross-skill orchestration**. The orchestration itself - the 8-phase DAG, the parallelization decisions, the wait barriers, the integrity-gate-before-audit ordering - is original Wayland design.

Every skill it calls is built on **The Donahoe Method** (Wayland-owned operating system). The Method is the substrate; this composite is the conductor.

No external lineage required for the orchestration design.

## Notes

- This skill is the suite's flagship "agency replacement" deliverable. The output bundle is what an agency would charge $5K-25K to produce; this composite produces it in 5-6 minutes.
- The audit is run *after* the page is built, not during. This is intentional: the Method primitives are designed to produce method-aligned output by construction, so the audit is a verification gate, not a corrective process.
- The visual specs (P4) produce paste-ready HTML/CSS. The user can take the bundle directly to Webflow / Framer / Wix / Carrd / static HTML. No framework dependencies.
- The composite can be invoked recursively from larger composites (e.g., `/funnel build-campaign` calls this once per asset). When invoked from a parent, the parent passes the brief; the One Person check still runs but can be auto-satisfied if the parent supplied the One Person.
- The 14-file output is deliberately granular. Each file is independently usable; the report aggregates them but doesn't replace them.
- Iterative refinement is the expected workflow: run package → review audit → rerun specific primitives → re-package (or just re-audit). This skill is the entry point for iteration, not just first-time builds.
- Composes upstream with `/funnel offer` (the offer is input to this skill) and downstream with `/launch` (suite-level meta-pack composite that calls this once per asset in a campaign).
