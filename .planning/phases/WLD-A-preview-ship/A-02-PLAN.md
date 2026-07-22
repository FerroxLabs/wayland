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

> **STATUS 2026-07-22 — BLOCKED (CI-authority boundary, by design).** The evidence-backed
> `dist:preview:mac` build enforces a capability seal (`writeCapabilitySeal` →
> `verifyCandidateCapabilitySeal`) that requires (1) repo var `WAYLAND_RELEASE_TRUST_ROOT_SHA` and
> (2) capability receipts **Sigstore-attested by the CI release-acceptance workflow** (`gh attestation
> verify`, protected branch `release-trust-v1`). Local receipts CAN be generated (done: all 5 caps'
> 30 acceptance suites pass) but CANNOT be attested locally — that's the trust root's purpose.
> **A sealed packaged build is CI + owner authority only.** Sean's call (2026-07-22): do Wave B first;
> trigger the CI release-acceptance build to produce + live-test the sealed candidate when ready. Do
> NOT circumvent the attestation gate.

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
