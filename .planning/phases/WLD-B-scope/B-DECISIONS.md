# Milestone B — Scope Decisions (decision dossier)

Seven items need a call: **build now / defer / descope**, and if build, **prompt vs enforced**.
Each was researched read-only against the live code (independent agents, file:line evidence).
This doc arms the decision — **Sean makes the call**. Nothing here is built.

## TL;DR — recommended calls

| Item                                         | Recommendation                                                     | If built        | Why (one line)                                                              |
| -------------------------------------------- | ------------------------------------------------------------------ | --------------- | --------------------------------------------------------------------------- |
| **COW-06** end-to-end cowork journey         | **BUILD NOW** (preview headline), live-tested                      | S–M             | Pieces already exist; it _is_ the north-star demo                           |
| **IMG-01** image/vision in composer          | **BUILD NOW**, enforced, honest-degradation minimum                | M (L full)      | Real reported bug, still unguarded; dead-center everyman feature            |
| **COW-04** source/citation ledger            | **Prompt-level now**, defer enforced typed ledger                  | S / L           | Model self-cites already; enforced store collides with "no parallel stores" |
| **COW-05** type-aware validation             | **Prompt-level now**, defer enforced gate                          | S / M           | officecli gives real validation already; prose directs it                   |
| **VOC-04** provider-neutral voice + receipt  | **DEFER** (thin enforced VoiceReceipt only if Voice is advertised) | M               | Neutral seam already shipped in VOC-01/02/03; refactor is purity            |
| **CMP-01** shared-model Web/Cloud proof      | **DEFER** to Phase-5 hardening                                     | S–M (test-only) | Already holds incidentally — the server build compiles it                   |
| **SBX-02** project localhost/toolchain grant | **DEFER** out of preview; enforced-only if ever built              | L, cross-repo   | Gate lives in Core (no localhost exception); dev-power, not everyman        |

**Net for the preview: build 2 (COW-06, IMG-01), prompt-back 2 (COW-04/05), defer 3 (VOC-04, CMP-01, SBX-02).**

---

## BUILD NOW

### COW-06 — Complete ordinary-composer source-to-delivery journey

**Call: BUILD NOW as the preview's headline knowledge-work journey. Effort S–M.**
The constituent pieces already exist: Cowork is a preset launched from the ordinary composer
(no mode switch — structurally already true), plan steering (`ExecutionSnapshot.plan` +
`planHistory`), the trusted-receipt surface (`ReceiptTrustSurface.tsx`, WorkbenchHost
`ProjectionPanel.tsx`), and real officecli validation. Remaining work is wiring + a Playwright
E2E exercising the whole path (bring a doc → cited, validated DOCX/PDF back, inspectable).
COW-04/05 ride along at prompt-level fidelity. This is the demo that sells the preview.

### IMG-01 — Ordinary-composer image/vision input

**Call: BUILD NOW, ENFORCED, scoped to the honest-degradation minimum. Effort M (preview); L (full).**
The reported image failure is **still unguarded**: the composer accepts images
(`FileService.ts`, `PasteService.ts`) but the send path never checks `hasModelCapability(…,
'vision')` — an image can be sent to a non-vision model and silently dropped. Vision _is_
detectable per-model (`modelCapabilities.ts`, `modelCapabilityRules.ts`); the missing piece is
wiring that into the send path. Preview-minimum: (1) on attach, resolve the route's vision
capability and **block the send with an honest message** if it can't see images; (2) fail
closed on malformed/dropped images; (3) never invent a credential diagnosis for a capability
mismatch. Defer to Phase 5: the hostile-fixture corpus + multi-provider packaged replay.
**Enforced, not prompt** — an advisory that still sends blind defeats the requirement and
leaves the bug live.

## PROMPT-LEVEL NOW (defer enforcement)

### COW-04 — Source/citation ledger

**Call: prompt-level now; defer the enforced typed ledger to the next Cowork milestone. S now / L enforced.**
`cowork.md` already instructs the model to record precise locators and never manufacture
citations; a heuristic Citations panel + receipts' `sourceDependencyDigest` give honest, coarse
provenance. A durable per-claim ledger with locators is a new persistent store that must fold
into the canonical execution model (the roadmap forbids "parallel stores") — real L work, and
the roadmap already reserves it for the next Cowork milestone.
_Confirm before relying on provenance in the preview:_ whether Core actually emits
`source_dependency_digest` for DOCX/PDF cowork runs today (the adapter consumes it if present).

### COW-05 — Type-aware validation and scoped revision

**Call: prompt-level now; defer the enforced gate. S now / M enforced.**
Closest to done: `officecli validate` gives real executable validation and `cowork.md` directs
the model to run it and degrade honestly. An enforced gate (declared-type record +
"validation must have run" delivery block + scoped-revision guard, feeding the existing
`ExecutionValidation`/validation-receipt slots) is the natural next-milestone build. Do **not**
descope — honest validation is central to the trust story.

## DEFER

### VOC-04 — Provider-neutral speech adapters + VoiceReceipt

**Call: DEFER. If Voice is on the preview's advertised surface, take only the thin enforced-VoiceReceipt slice. Effort M.**
The provider-neutral _seam_ already shipped (VOC-01/02/03): one config type per modality, one
consent gate keyed by provider, one dispatch point. A formal adapter-registry refactor is
internal-elegance with ~zero preview payoff. `VoiceReceipt` is genuinely new (zero references
in `src/`) but its value is real only if voice outcomes must enter the trusted-receipt story —
which no preview user exercises. If built: enforced at the service boundary (receipt is the
return value), advisory in the UI, reusing the `ExecutionReceipt` shape.

### CMP-01 — Shared model compiles/contract-tests through Web/Cloud composition

**Call: DEFER to Phase-5 hardening. Effort S–M, test-only.**
The substance already holds: the standalone server (`dist-server/server.mjs`, via
`NodePlatformServices` / `register-node`) won't build unless the shared model compiles through
the Web/Cloud composition root — so "compiles through composition" is _continuously verified by
the existing build_. Missing is only the named replay/round-trip assertion. Explicitly a
non-product proof (the roadmap text disclaims Cloud/Hosted/deployment). No prompt-vs-enforced
axis — it's a test, not a runtime gate. Lowest-value of the five for a preview.

### SBX-02 — Purpose-scoped Project localhost/toolchain grants

**Call: DEFER out of preview; ENFORCED-only if ever built. Effort L, cross-repo.**
The grant primitive doesn't exist and the gate lives in **Core, not the desktop** — the app's
own SecurityPane states "Bundled Core v0.12.25 has no safe Project-scoped localhost exception."
The "everything else blocked" half is present and honest (SBX-01 read-only projection). This is
developer-power, the opposite of the everyman north star, and can't be built in this repo alone
(needs Core work + desktop UI + proving 8 sibling paths stay blocked). If ever built it must be
**enforced** — a network boundary with an advisory "are you sure?" is the SSRF/rebinding footgun
the requirement exists to prevent. Current honest "not in this build" posture is correct for the
preview (matches A-03 IN-or-physically-absent).

---

## Decision capture

**Sean's call (2026-07-23): BUILD ALL SEVEN, no deferments.** All landed locally on
`worktree-agent-desktop-integration` (nothing pushed). Full suite 15,611 pass / 0 real
failures (1 pre-existing WorkflowDetailModal flake, passes isolated).

| Item   | Call                 | Status                                                                                        | Commit                            |
| ------ | -------------------- | --------------------------------------------------------------------------------------------- | --------------------------------- |
| IMG-01 | BUILD, enforced      | ✅ fail-closed image/vision send gate + 7 tests                                               | `a0b8c82d2`                       |
| CMP-01 | BUILD                | ✅ composition contract test (5, digest-pinned, host-neutral)                                 | `ff26e32dc` (+re-pin `fdf332c64`) |
| SBX-02 | BUILD (desktop core) | ✅ fail-closed grant resolver + SSRF host-class + 42 tests. Wiring/Core-hook = next increment | `9a70287ee`                       |
| VOC-04 | BUILD, both halves   | ✅ adapter registries + VoiceReceipt; VOC-03 consent gate verified intact; 110 tests          | `172a1a0a7`, `68231d960`          |
| COW-04 | BUILD, enforced      | ✅ citation ledger folded into canonical execution model (no parallel store)                  | `0bdda68de`                       |
| COW-05 | BUILD, enforced      | ✅ type-aware validation + scoped-revision delivery gate (real officecli)                     | `0bdda68de`                       |
| COW-06 | BUILD                | ✅ end-to-end journey wired + Workbench validation facet + journey test                       | `033abc541`                       |

### Honest limitations carried forward (documented Core hooks, NOT descopes)

- **SBX-02:** the security-critical resolver is built + tested (grants only ever NARROW Core's
  block). Remaining: process-side request-gate consult, the desktop→Core contract field, and an
  HONEST SecurityPane affordance (must say "pending Core support", never imply localhost works —
  Core ships no localhost exception). End-to-end egress needs the Core capability.
- **COW-04:** ledger + enforcement + rendering built. Live population needs Core to emit a
  `source_citation` evidence event + widening the `chatLib.ts` transform whitelist — deliberately
  NOT widened for an event Core doesn't yet emit. COW-05 validation has no such gap (populated
  today from real `officecli validate` runs).
- **VOC-04:** VoiceReceipt is return-value-enforced + advisory-logged; renderer UI surfacing is
  the follow-on. Hosted-provider cost is honestly reported `unavailable` (no faked number).
