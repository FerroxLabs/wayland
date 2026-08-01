# Milestone A — Cockpit Preview Ship (CONTEXT)

**Created:** 2026-07-21 (planning reconciliation) · **Status:** ACTIVE · **Base:** `worktree-agent-desktop-integration` (LOCAL)

Milestone A is the only live build work after the 2026-07-20 pivot. It replaces the killed
"Phase 6 Preview" cohort-rollout ceremony (ROL-01/02/03 — SUPERSEDED). Goal: a shippable Cockpit
preview of Desktop, accepted by a green Sean + Claude live-test sweep (not a cohort).

**Acceptance model:** Sean + Claude live-test together; a green Playwright sweep IS acceptance.
Sweep driver: `scratchpad/sweep-cockpit.mjs` (connect Flux → activate Cockpit → walk all destinations + real chat).

**Note on tracking:** the `.planning/execution/` packet adapter + `wayland-gsd-gate` are DORMANT
(part of the killed ceremony). STATE.md + ROADMAP.md are the source of truth. These `A-*` packets are
the human work-tracking unit; a SUMMARY is written when a packet is live-test-accepted.

## Waves

- **Wave A — Package & matched-engine smoke** (BLOCKING, release-adjacent, do WITH Sean): A-01, A-02, A-03.
- **Wave B — Trust/quality floor** (BLOCKING for an honest preview): B-01, B-02.
- **Wave C — Hygiene** (non-blocking, tracked as a checklist in STATE.md, not packets).

## Guardrails

LOCAL only — no push/merge/release/deploy without Sean. Never touch `/Users/seandonahoe/dev/wayland/app`.
Independent audit + full suite (`bun run test:vitest`) before every commit. `electron .` loads the BUILT
`out/renderer` — run `bun run package` (~25s) after source edits before a sweep reflects them.
