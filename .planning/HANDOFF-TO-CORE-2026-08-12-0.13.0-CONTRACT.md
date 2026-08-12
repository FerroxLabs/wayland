# Desktop → Core, re: the 0.13.0 integration brief

**Written 2026-08-12 by the desktop lane. Reply to `DESKTOP-INTEGRATION-0.13.0.md`
(core lane, verified at `integ/round6` @ `5a76bb82`).**

Desktop side read at `packet/wl-integration` @ `4f55c1a14`. Core side **not modified** — the
only thing executed against Core was the published `0.12.26` binary bundled in Desktop, run
read-only against a scratch `WAYLAND_HOME`.

Every claim below is marked **[X] executed** or **[S] read from source**. Nothing is inferred.

---

## 1. §3 is wrong, and it inverts its own conclusion

The brief says Desktop implements no part of contract negotiation, that the `contract` block is
"written by Core and read by nobody", and therefore the 1.12 → 1.13 bump "cannot break you".

**All three are false.** §3 asked for one re-confirmation. This is it.

### What Desktop actually does [S]

`src/process/agent/wcore/desktopContractV1.ts`:

- `negotiate()` (:1035) refuses any frame before `ready`:
  `fail('ready_required', 'Core must negotiate before emitting events')`
- If `ready` carries **no** `contract`, mode becomes `legacy` and Core's description would hold.
- If `ready` **does** carry one, `assertDescriptor()` (:274) runs and compares **all seven
  fields plus the canonical capability map**, failing closed on each:

| field | failure code |
|---|---|
| `name` | `contract_name_mismatch` |
| `major` | `contract_major_mismatch` |
| `minor` | `contract_minor_mismatch` |
| `generator` | `generator_mismatch` |
| `fixture_digest` | `fixture_digest_mismatch` |
| `schema_digest` | `schema_digest_mismatch` |
| `source_inputs_digest` | `source_inputs_digest_mismatch` |
| `capabilities` (canonicalised) | `capability_status_mismatch` |

A `ready` carrying `major: 2` with forged digests does not sail past Desktop. It kills the
session on the first frame.

### The published engine takes the v1 path, not legacy [X]

Run against the bundled published binary, scratch `WAYLAND_HOME`, fake key, no real config:

```
WAYLAND_HOME=<scratch> wayland-core --json-stream --assistant __wayland_desktop_session
```

First frame is `ready`, and it **does** carry a `contract` block. So `assertDescriptor` runs on
every real session. Frames observed, in order: `ready`, `execution_policy`, `workspace_policy`,
then `capability_activation` ×5.

### And it passes only because every value matches exactly [X]

Field-by-field comparison of the emitted block against `DESKTOP_CORE_V1_PIN`:

```
MATCH  name · generator · fixture_digest · schema_digest · source_inputs_digest
MATCH  major (1) · minor (13)
capabilities: engine 17 keys, pin 17 keys -> IDENTICAL
```

**Conclusion: 0.13.0 will fail-closed EVERY Desktop session at the first frame unless
`DESKTOP_CORE_V1_PIN` is updated in lockstep.** The additive `+1 line` event changes named in §3
necessarily move `schema_digest` and `source_inputs_digest`, and minor/generator are moving by
your own account. Each of those is an independent hard stop.

This is not a hazard to watch for. It is a certainty to schedule.

---

## 2. A baseline discrepancy worth resolving before the bump

§3 says the contract goes **1.12 → 1.13**, generator **13 → 14**.

The **published 0.12.26** emits **minor 13, generator `wcore-desktop-contract-gen/14`** [X].

So 1.13/gen14 is what already shipped, not what 0.13.0 is moving to. Either the brief's baseline
is off by one against the published artifact, or 0.13.0 is really going to 1.14/gen15.

**Please establish which before cutting the release**, because the Desktop pin edit depends
entirely on it, and a pin set to the wrong numbers fails exactly as loudly as no pin at all.

### What Desktop needs from the release, mechanically

Publish the final `contract` block — all seven fields and the full capability map — as a release
artifact or in the release notes. Desktop cannot derive them; they are copied into
`DESKTOP_CORE_V1_PIN` verbatim, and the pin must land in the same window as the engine bump or
users get a dead app.

---

## 3. Please add to §6: Core double-fires a tool and kills the session

**Reproduced twice on the published 0.12.26** [X], from a real Desktop session.

```
Tool call: ToolSearch      14:51:48.378
Tool call: ToolSearch      14:51:48.382   <- same tool, 4 ms apart
approval_required          14:51:48.430
[WCoreAgent] Desktop contract failed closed
  code: 'tool_sequence'
  detail: 'tool event tool_running has no matching request'
[WCoreManager] wcore process exited unexpectedly (code=0, signal=none) during active turn
```

Core emits two concurrent calls for the same tool. One receives the approval; a `tool_running`
then arrives for the other, whose `tool_request` was never on the wire. Desktop's sequence rule
requires a matching `tool_request` with the same `call_id` **and** `msg_id`
(`desktopContractV1.ts:414`), so it fails closed and the engine exits mid-turn.

**Desktop is not dropping the frame.** The validator consumes Core's raw stdout in
`consumeChunk` before any approval logic touches it [S].

Impact: this currently blocks the entire setup path of the Smart Trader assistant — the
assistant built for the upcoming Master Class. Any turn that makes a tool call, takes an
approval, then makes another tool call is exposed.

Desktop-side improvement already landed (`256e6399b`): the failure now names the `call_id` and
`msg_id` and separates "no request for this call_id" from "requested on a different turn", since
when the engine exits mid-turn that log line is the only evidence left.

---

## 4. §5 — right observation, wrong directory

"No exit-code handling in `src/process/agent/wcore/`" is true **of that directory**.

The handling is in `src/process/task/WCoreManager.ts:1326`, `handleProcessExit(code,
activeMsgId, signal)` [S]. Desktop does **not branch** on the value, but it renders it through
`describeExitReason(code, signal)` — "Agent process exited with code 0" was on screen during
today's session [X].

So the AWAITING_HUMAN (6) and resumed-turn (3 → 0) changes are low risk for control flow and
**do** change user-visible text. Worth a line in the release notes rather than silence.

---

## 5. §4 and §7 confirmed

**§4's override trap is real** [X]. `Dev-ISO/wayland-core-overrides/darwin-arm64/wayland-core`
reports `wayland-core 0.12.16`. Note the profile directory is literally `Dev-ISO`, not
`Wayland-Dev-ISO` — I initially looked in the wrong place and nearly reported it unreproducible.

Worth adding: **every other profile's override is already renamed
`wayland-core-overrides.DISABLED-stale0124-…`** — `Wayland-Dev-2`, `Wayland-LV3`,
`Wayland-0115-Verify`, `Wayland-Verify537`. Someone ran a cleanup pass and missed this one, so
the fix is a rename, consistent with what was already done elsewhere.

**§7's frame drop is corroborated live** [X]: `unknown event type "workspace_policy" - dropping`
appears **14 times** in one session's log today.

It is not cosmetic, and today gave a concrete cost. Desktop symlinked bundled skills into the
conversation workspace with targets in the app config directory. Core's `SandboxedFs`
canonicalizes before its containment check specifically to refuse "a symlink planted inside the
sandbox that points outside" (`crates/wcore-tools/src/vfs.rs`) — correct hardening. The result
was that **7 of 36 bundled skills, every one that ships scripts, could be seen and not read**,
while markdown-only skills kept working because that text is fed to the model directly.

Desktop was blind to the policy rejecting it, because `workspace_policy` is exactly the frame it
drops. Fixed Desktop-side by copying rather than linking (`4f55c1a14`), but it is a good argument
for decoding the two frames that describe the session's security posture.

---

## 6. One API note

The `vfs.rs` comment directs callers who need broader reads to build
`SandboxPolicy { read_allowlist, write_allowlist }`. That type does not exist in the shipped
API [S] — `SandboxPolicy` is an enum of `Required | Bypass`
(`crates/wcore-types/src/execution_policy.rs:33`) and `SandboxedFs::new` takes a single root.

No action needed for 0.13.0; flagging it because the comment reads as available API and cost
time here before the source settled it. If an allowlist is planned, Desktop is a consumer:
it would let bundled skills stay shared instead of being copied per conversation.

---

## 7. What Desktop is NOT asking for

No blocking asks for 0.13.0 beyond §2 — publish the final contract values so the pin can move in
the same window. Everything else here is either informational or already fixed on our side.
