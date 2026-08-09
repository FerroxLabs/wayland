# START HERE — 2026-08-09 end of session

Branch `packet/attribution-audit`, head pushed to ferrox. Full suite **16,411 / 0 failed**,
typecheck clean. Nothing merged, tagged, or PR'd.

## 1. A NEW CORE BINARY ARRIVED — this is the first task

`~/Desktop/wayland-core-rc/wayland-core`, **sha256 `e912ab2d…`** (80,811,264 bytes).
Docs beside it: `CORE-TO-DESKTOP-W1-BINARY.md`, `HANDOFF-TO-DESKTOP-2026-08-09.md`.
Core branches `integration/foundation-w1 @ b7e34e1b` and `build/w1-mac-2 @ 9c567eac`.

**I verified the sha and the digests myself, with both controls — reproduces exactly:**

| digest | in binary |
|---|---|
| schema `4971f456…` | present ×1 (unchanged from the current pin) |
| **NEW** fixture `3bf2f0f1…` | present ×1 |
| **NEW** source `677d0fd6…` | present ×1 |
| OLD fixture `710a602f…` | ABSENT |
| OLD source `6802f807…` | ABSENT |
| `deadbeef` (negative control) | ABSENT — so the method discriminates |

**To pin:** `src/process/agent/wcore/desktopContractV1.ts` — fixture -> `3bf2f0f1…`,
source -> `677d0fd6…`, schema and minor/generator UNCHANGED. **Re-run the three-way check
yourself before pinning** (Core's first build failed this silently). Port the contract
corpus from their commit rather than hand-editing digests, exactly as last time.

**Replace the bundled engine with `rm` THEN `cp`, never overwrite in place** (macOS).

### The part that costs us something
Core says the binary we have been measuring on **silently loses 82% of long output and
exits 0 on every failure**. So our **ToolSearch 23 -> 10** result was taken against a
truncating binary and Core explicitly asks us to **re-run the loop session** — their
matcher fix was only one of three halves. Treat that number as unconfirmed until re-run.
(The C-4 wire evidence used a local recorder, not the engine's output path, so it stands.)

Two items Core flags as still broken — **do not re-report**: git under sandbox, and the
read-only-contents defect.

## 2. Then the three packets from live-testing

`.planning/PANELS-NEXT-3-PACKETS.md` has the detail and the working CDP rig.

- **P1 FIRST — a regression I introduced.** `ActivityTimeline` renders a promoted
  single-step label as the summary AND still renders the child row, so Observability
  shows the same line twice. Assert on OCCURRENCE COUNT, not presence — my test
  asserted presence and passed either way.
- **P2 — K-03.** Lifecycle never reaches `completed` (observed live: assistant had
  answered, `data-lifecycle` still `running`). My spine-bar fix is correct in code and
  DEAD until this lands.
- **P3 — workbench navigation.** 5 tabs overflow 340px; sections are dynamic so it only
  worsens. Recommended: stacked collapsible sections, icons BESIDE labels not instead of
  them. `WorkbenchHost/index.tsx:335-342` records why an icon rail was already rejected.

## 3. SEAN'S DECISIONS THIS SESSION

- **KILL THE OBSERVABILITY TAB** — agreed with him. The transcript already renders the
  same timeline from the same messages; it is duplication, and "Observability" is a
  developer word in a product aimed at the non-dev everyman. Keep the inline timeline,
  fold the cost toggle into Progress. **Do it as part of P3**, since both touch the
  section contract. This DISCARDS the ACP-parity registration landed in `bb8e5387f` —
  that is accepted, not overlooked.
- **B1 trade: keep it** (installed descriptor beats the npx bridge). Port
  `readClaudeProviderEnvFromCcSwitch` and codebuddy's `--mcp-config` onto the generic
  path in T5.
- **Observability gating: fine**, but navigation must be genuinely discoverable.

## 4. Still open

File card driven by the file OUTCOME (never the `[[AION_FILES]]` marker — live forgery
hole). Windows unproven for T1 — mocked `spawn`, never real `CreateProcess`; book the box.
