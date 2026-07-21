---
phase: WLD-A-preview-ship
plan: A-02
type: execute
wave: A
depends_on: [A-01]
files_modified: []
autonomous: false
blocking: true
---

<objective>
Build the preview artifact with the matched engine and prove it boots + works as a PACKAGED app
(not dev mode). The packaged artifact — not `electron .` — is the acceptance surface.
</objective>

<tasks>
- `bun run dist:preview:mac` (Win/Linux per distribution intent).
- Packaged smoke on the ARTIFACT: boot → Cockpit eligible (the standalone `cockpitPreviewBridge` stub resolves `cohort:cockpit-rollout-status` = eligible in a packaged build) → connect Flux → real-engine chat streams → walk all 13 Cockpit surfaces.
- Confirm no dev-only assumptions leak (built `out/renderer`, bundled Core path, MCP server build).
</tasks>

<verification>
Packaged app boots on a clean profile; Cockpit renders; real Flux chat streams end-to-end; sweep green on the artifact.
</verification>

<success_criteria>
A packaged preview candidate that a user can install and use Cockpit + real chat, engine matched.
</success_criteria>

<output>Write A-02-SUMMARY.md with the artifact path + packaged-smoke evidence (screenshots/sweep log).</output>
