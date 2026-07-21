---
phase: WLD-A-preview-ship
plan: A-01
type: execute
wave: A
depends_on: []
files_modified:
  - package.json
  - scripts/postinstall (wcore pin)
  - resources/bundled-wcore-shasums.json
  - scripts/prepareWaylandCore.js (verify)
autonomous: false
blocking: true
---

<objective>
Stage the exact signed Core the preview candidate will bundle, so the packaged app runs a matched
engine (not a mismatched dev engine). Release-adjacent — do deliberately with Sean.
</objective>

<tasks>
- Pick the target signed Core version vX.Y.Z (current signed `wayland-core` release).
- `node scripts/stage-wcore-bump.mjs vX.Y.Z --write` — updates package.json, postinstall, shasums, prepareWaylandCore.
- Verify: `WCORE_REQUIRE_VERIFIED=1 WCORE_FORCE_DOWNLOAD=1 node scripts/prepareWaylandCore.js` (checksums verify clean).
</tasks>

<verification>
The 4 pinned files agree on vX.Y.Z; prepareWaylandCore verifies signed checksums with no drift.
</verification>

<success_criteria>
Matched signed Core staged and checksum-verified; ready for `dist:preview`.
</success_criteria>

<output>Write A-01-SUMMARY.md recording the chosen version + checksum-verify output.</output>
