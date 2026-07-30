# Core ↔ Desktop contract integration

> Goal: make Core↔Desktop conformance a **build-time property**, so a protocol
> divergence fails a pipeline instead of being re-discovered by hand each
> release — or in production.
>
> Status: the Desktop half of steps D1–D4 is implemented (see
> `src/process/agent/wcore/contract/`). Everything marked **C** is Core-side and
> needs scheduling in the Core lane.

---

## 1. What was actually wrong

Three findings from the Core↔Desktop conformance UAT, re-measured at Core
`e7bc6d88` (contract `wayland-desktop-core` v1.10, generator
`wcore-desktop-contract-gen/11`) and Desktop `b3694a18f`:

| #   | Finding                                              | Re-measured                                                                                                                                                                       |
| --- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Desktop drops safety-relevant frames                 | **19 of 52** contract event types (37%) were silently dropped, **17 of them `safety` criticality**. Reproduce: `node scripts/measure-wcore-frame-coverage.mjs --before b3694a18f` |
| 2   | The decoder is types-only, with no runtime validator | Confirmed. `index.ts` did `JSON.parse(line) as WCoreEvent` and switched on `type`; the `default:` arm logged at `warn` and dropped                                                |
| 3   | No contract negotiation exists                       | Confirmed Desktop-side. All 3 of Core's forged-`ready` adversarial fixtures (`version-mismatch`, `schema-mismatch`, `fixture-mismatch`) were accepted as if golden                |

**The original UAT figure of "27 of 38 frames (71%)" does not reproduce against
this corpus.** The corpus has since grown to 52 event types and Desktop has
gained handlers; the true numbers are above. The _shape_ of the finding stands —
it is the count that moved.

Two premises in the original framing also need correcting, because they change
what the plan has to do:

- **Core already emits its contract digest in the `ready` frame.** `events/ready.json`
  carries a full `contract` descriptor (`name`, `major`, `minor`, `generator`,
  `fixture_digest`, `schema_digest`, `source_inputs_digest`, `capabilities`)
  plus the launch `execution_policy`. Desktop was discarding both because
  `WCoreEvent['ready']` never declared the fields. This is not work Core needs
  to do; it is work Desktop needed to stop throwing away.
- **`workspace_policy` is not in the Desktop contract at all.** It exists as
  `ProtocolEvent::WorkspacePolicy` in `wcore-protocol/src/events.rs:583` and
  appears only in `schema/producer-complete.schema.json` under a branch titled
  _"Non-Desktop producer inventory discriminator"_. It is absent from
  `manifest.json`'s 52 events and from `schema/core-event.schema.json`. No
  Desktop-side change can make `workspace_policy` arrive — see **C4**.

Core is also further ahead than the finding implies: it ships a complete
reference host decoder (`wcore-protocol/src/contract/observation.rs::HostContractObserver`)
and a matching adversarial fixture set. The Desktop work is a faithful port of
semantics Core already specified, not a design from scratch.

---

## 2. Target architecture

```
wayland-core                                     wayland-desktop
─────────────────────────────────────            ─────────────────────────────────────
crates/wcore-protocol/contracts/desktop/v1
  manifest.json  (digests, criticality)
  schema/core-event.schema.json
  events/*.json      (golden)
  compat/*.json      (back-compat)
  adversarial/*.jsonl
        │
        │  C1: publish as a signed release asset
        ▼
   wayland-core-contract-v1.tar.gz
   + entry in the signed release manifest
        │
        │  D1: vendor + verify digests
        ▼
                                         resources/wcore-contract/v1/   (verbatim bytes)
                                         src/.../contract/generated/…   (derived runtime artifact)
                                                    │
   ready{contract:{digests…}} ─────────────────────▶│  D2: negotiate
   every subsequent frame     ─────────────────────▶│  D3: validate + criticality routing
                                                    │
        ◀───── C2/D5: CI gates on both sides ───────┘
```

The load-bearing idea: **the digests are the join.** Core's `fixture_digest` and
`schema_digest` are sha256 over `path + NUL + bytes` of the corpus files
(`wcore-protocol/src/contract/canonical.rs`). Desktop reimplements that
algorithm (`scripts/vendor-wcore-contract.mjs`) and recomputes both digests over
its own vendored copy. So Desktop does not merely _compare digest strings that
travelled with the files they describe_ — it independently derives them and
requires the derivation to land on the value Core published. That is what makes
a tampered or hand-edited corpus detectable.

---

## 3. Ordered plan

### Core side

**C1 — publish `contracts/desktop/v1` as a signed release asset.** _(blocking for
a trustworthy D1; everything else in Desktop works without it)_

`.github/workflows/release.yml` contains **zero** references to `contract`
(controls: 58 `manifest` hits and 34 signing hits in the same 869-line file, so
the grep is sound). The machinery already exists — the workflow mints keyless
Sigstore provenance via `attest-build-provenance@v4`, builds a signed release
manifest that digests every release file, and `extract_bundled_trust_root.py`
self-tests the trust root the updater verifies against. Extending it to one more
artifact is additive:

1. Tar `crates/wcore-protocol/contracts/desktop/v1` into
   `wayland-core-contract-v1-<version>.tar.gz`.
2. Emit it **before** the checksum step, so `manifest-build` digests it — the
   workflow's own comment notes that ordering is load-bearing because "a
   manifest cannot digest itself".
3. Attest it alongside the release archives.

Until C1 ships, Desktop's vendoring is a manual copy from a Core checkout and
its authenticity rests on that checkout, not on a signature. This is recorded in
`resources/wcore-contract/VENDORED.md`.

**C2 — Core CI fails if the producer emits an event absent from the corpus.**
The generator already derives the corpus from `spec.rs`, and
`desktop_contract_adversarial.rs` replays it. What is missing is the negative
direction: an assertion that every `ProtocolEvent` variant reachable on the
Desktop wire has a manifest entry and a golden fixture. `workspace_policy` (C4)
is the existing counter-example and would be caught by exactly this gate.

**C3 — decide the disposition of `sub_agent_event`'s duplicate schema branch.**
`schema/core-event.schema.json` has 53 `oneOf` branches for 52 types;
`sub_agent_event` appears twice. Harmless, but it means the root `oneOf` can
never be used as-is with strict `oneOf` semantics. Desktop dispatches by type
const and groups duplicates under `anyOf`, so it is unblocked either way.

**C4 — decide whether `workspace_policy` belongs on the Desktop wire.**
It carries workspace trust / sandbox-profile authority — the same class of
information as `execution_policy`, which _is_ Desktop-facing and _is_ marked
`safety`. Either promote it into `manifest.json` + `core-event.schema.json` +
a golden fixture, or record in `DEFERRED.md` why the Desktop deliberately does
not receive it. Right now it is neither, which is the worst of the three.

**C5 — fix the unsatisfiable `oneOf` in `goal_snapshot`.**
`goal_snapshot.goal.tasks.items.oneOf` has two branches that both declare
`additionalProperties: true` with no `required`, so **every** object — including
`{}` — matches both, and `oneOf` ("exactly one") can never be satisfied. Core's
own golden `events/goal_snapshot.json` therefore fails Core's own published
schema. This is only visible if you actually run the corpus through a JSON
Schema validator, which is why the fixture-replay tests in Rust never caught it.
Desktop works around it by rewriting nested `oneOf` → `anyOf` (documented in
`contract/decoder.ts`), and a test pins the blast radius so the workaround
cannot silently widen.

**C6 — expose the reference observer's decision table as data.**
Optional, and only worth doing if a third host appears. Today
`HostContractObserver`'s rules live in Rust control flow, so the Desktop port is
prose-faithful rather than mechanically derived. If the rules were emitted into
`manifest.json`, both hosts could be generated from them.

### Desktop side

**D1 — vendor the corpus and verify it. _(done)_**
`scripts/vendor-wcore-contract.mjs --from <core>` copies all 164 files verbatim
into `resources/wcore-contract/v1/` and derives
`src/process/agent/wcore/contract/generated/wcoreContract.generated.json`
(descriptor + criticality index + event schema) — the two things the runtime
needs, without bundling 159 fixtures into the app. `--check` re-derives both and
fails on drift. When C1 lands, the `--from` path becomes "download the signed
asset, `gh attestation verify`, then extract", and nothing else changes.

The corpus is listed in `.prettierignore`: a repo-wide `bun run format` will
otherwise reformat the vendored JSON and break every digest. (It did, once,
while this was being built — the digest check is what caught it.)

**D2 — negotiate on `ready`. _(done)_** See the decision table in §4.

**D3 — validate every frame at decode time. _(done)_**
`WCoreFrameDecoder` compiles one ajv validator per event type from Core's
schema. Nothing reaches `handleEvent` unvalidated.

**D4 — make an unhandled frame loud. _(done)_**
`WCoreAgent.routeFrame` replaces the old `default:` drop arm with a severity
ladder (§5), and `contract/coverage.ts` holds the explicit list of contract
events Desktop knowingly does not handle.

**D5 — CI gate. _(done)_** `bun run test:contract` now actually runs (the script
existed but pointed at a directory `vitest.config.ts` did not include, so it
passed via `--passWithNoTests`). It fails if:

- the vendored corpus digests do not reproduce;
- the generated artifact is stale relative to the corpus;
- a contract event is neither handled nor listed in `UNHANDLED_CONTRACT_EVENTS`;
- `HANDLED_CONTRACT_EVENTS` drifts from the real `switch` arms in `index.ts`;
- any golden corpus frame fails to decode;
- any adversarial frame is accepted.

**D6 — close the 18 remaining handler gaps.** _(not done — product work)_
`UNHANDLED_CONTRACT_EVENTS` lists 18 valid contract events Desktop decodes and
then ignores, 16 of them `safety`. They cluster into five features Desktop has
no surface for at all: turn recovery v1, workflow lifecycle v1 (ForgeFlows),
durable goals v1, runtime diagnostics v1, and Anvil receipts. Each is its own
piece of work; they are now visible and gated rather than silent.

**D7 — send the 12 host commands Desktop cannot currently send.** _(not done)_
`WCoreCommand` declares 11 of the contract's 23 commands. The missing ones —
`continue_with_budget`, `session_resync`, `resume_turn`,
`resolve_interrupted_approval`, `resolve_unknown_tool_effect`,
`remove_mcp_server`, `get_runtime_diagnostics`, and the five `goal_*` — are the
reason several D6 events can never arrive: Desktop cannot receive
`budget_grant_result` because it never sends `continue_with_budget`. D6 and D7
should be scheduled together, per feature.

---

## 4. Version negotiation

Three cases, three different answers. Refuse / warn / accept is a real choice
per case, so here is each one and why.

| Producer vs pinned                                                      | Action                                       | Justification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No `ready` before any other frame                                       | **Refuse**, fatal                            | Pre-negotiation, nothing is attributable to a known contract. Matches Core's `ReadyRequired`                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Second `ready` on one session                                           | **Refuse**, fatal                            | Core does not re-handshake; a second `ready` is either a bug or an attempt to re-negotiate downward mid-session                                                                                                                                                                                                                                                                                                                                                                                                   |
| `ready` carries no `contract` block                                     | **Refuse**, fatal, with `contract-missing`   | An engine predating negotiation (Core's `compat/events/ready.minimal.json`). There is no version and no digest, so there is nothing to trust. Distinct error code so the user is told "update wcore", not "malformed frame"                                                                                                                                                                                                                                                                                       |
| `name` differs                                                          | **Refuse**, fatal                            | Not our producer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **`major` differs** (either direction)                                  | **Refuse**, fatal                            | Majors are incompatible by definition. This is the case the UAT flagged: a forged `major: 2` must not be byte-indistinguishable from golden. Accepting-with-warning here would mean rendering frames whose meaning we do not know                                                                                                                                                                                                                                                                                 |
| **`minor` drift** (newer or older)                                      | **Accept**, warn, mark session `minor-drift` | Minors are additive by construction, and the unknown-event `critical` flag (§5) already carries the safety decision for anything new. Refusing would brick every Desktop the moment Core ships a minor — and Desktop can be pointed at a self-updated engine via `wcoreUpdater.ts`, so lockstep is not guaranteed. **This is a deliberate relaxation of Core's reference observer**, which returns `ContractMinorMismatch`. Core's observer is a conformance oracle pinned to one build; Desktop is a shipped app |
| **`schema_digest` / `fixture_digest` differ at the same `major.minor`** | **Refuse**, fatal                            | One version claiming two different corpora is tamper or a broken build. Nothing legitimate produces it. This is the tamper check, and it is only meaningful here                                                                                                                                                                                                                                                                                                                                                  |
| Any digest differs **under minor drift**                                | **Accept**, warn                             | The digests are taken over one specific `major.minor` corpus, so they are _expected_ to differ once the version differs. Enforcing them under drift is just refusing minor drift by another name. Per-frame schema validation continues to protect the session                                                                                                                                                                                                                                                    |
| `source_inputs_digest` differs                                          | **Accept**, warn                             | It hashes Core's Rust _sources_, not the wire. A comment change moves it without moving a byte on the wire; refusing would be a false positive                                                                                                                                                                                                                                                                                                                                                                    |
| `generator` differs                                                     | **Accept**, warn                             | Toolchain provenance. `schema_digest` + `fixture_digest` already cover wire shape                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Capability status differs                                               | **Accept**, warn                             | Feature drift, not a corrupt wire. Treat the differing capability as unavailable                                                                                                                                                                                                                                                                                                                                                                                                                                  |

Fatal refusals reject the `bootstrap` promise and stop the child, so the failure
surfaces at session start rather than as a silently degraded session. Non-fatal
refusals are per-frame and do not poison the stream — matching the reference
observer, where `observe_json_line` returns `Err` without invalidating the
observer.

---

## 5. Forward compatibility: unknown vs invalid

A frame Desktop does not _understand_ is not the same as a frame that is
_invalid_, and Core already put the discriminator on the wire. Every contract
event carries a `criticality` in `manifest.json` (`required` / `safety` /
`observational`), and unknown events carry an explicit `critical` boolean.

Desktop follows Core's rule exactly rather than inventing one:

| Frame                                           | Action                                                                          | Rationale                                                                                                                                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unknown type, `critical: false`                 | Drop, log at `debug`                                                            | Core explicitly said it is safe to ignore. This is the forward-compatibility escape hatch, and it is why Core can ship new observational events without a Desktop release                                                   |
| Unknown type, `critical: true`                  | Refuse the frame, `console.error`, surface to the user                          | Core explicitly said it is not safe to ignore                                                                                                                                                                               |
| Unknown type, **no** `critical` field           | Refuse the frame, surface to the user                                           | An event whose author did not classify it cannot be _assumed_ observational. Core's producer stamps the field, so a frame without it is either not Core or not finished. Matches `HostObservationError::UnknownCriticality` |
| Known type, valid                               | Dispatch                                                                        |                                                                                                                                                                                                                             |
| Known type, invalid, contract fit `exact`       | Refuse the frame, do **not** dispatch                                           | Acting on a frame that violated its own contract is how UI state gets corrupted. A `text_delta` whose `text` is a number must not reach the renderer                                                                        |
| Known type, invalid, contract fit `minor-drift` | Dispatch, marked `degraded`, `console.warn`                                     | Under a version skew the pinned schema is not authoritative for this producer, so a shape mismatch is expected drift rather than a violation. Blanking the UI over it would be the brittle choice                           |
| Known type, valid, no Desktop handler           | Do not dispatch; `console.error` if `safety`, `console.warn` if `observational` | The actual bug from finding #1. Still not rendered — that needs D6 — but no longer invisible                                                                                                                                |

Core's schemas are `additionalProperties: true` in 90 of 111 places, so a new
_field_ on an existing event is already tolerated. Only a changed field _type_
fails, and that is a genuine contract break.

---

## 6. Reproducing the measurements

```bash
# Before/after frame coverage, read from real git bytes and the real corpus
node scripts/measure-wcore-frame-coverage.mjs --before b3694a18f --out coverage.json

# Corpus integrity + generated-artifact freshness
node scripts/vendor-wcore-contract.mjs --check

# The full gate
bun run test:contract
```

---

## 7. Open items owned by Core

| Id  | Item                                                            | Why it matters                                                       |
| --- | --------------------------------------------------------------- | -------------------------------------------------------------------- |
| C1  | Publish `contracts/desktop/v1` as a signed release asset        | Desktop's vendored copy currently has no signature to verify against |
| C2  | CI gate: producer emits nothing absent from the corpus          | The only thing that stops the corpus drifting behind `events.rs`     |
| C3  | Duplicate `sub_agent_event` branch in the event schema          | Cosmetic, but blocks naive root-`oneOf` validation                   |
| C4  | `workspace_policy` is in neither the contract nor `DEFERRED.md` | Safety-class authority that no host can legitimately consume         |
| C5  | `goal_snapshot.goal.tasks.items.oneOf` is unsatisfiable         | Core's golden fixture fails Core's own published schema              |
| C6  | Emit the negotiation decision table as data                     | Would let hosts be generated rather than hand-ported                 |
