# WLD-K — live verification checklist (the real gate)

**Status: partially run on released 0.12.26. See the per-step results appended below.**

## Results, 2026-08-08 (released v0.12.26, source `98ad1c28`)

**L-1 — PASS, on the engine.** An MCP tool executes end to end and its output reaches the reply:
config-declared AND runtime `add_mcp_server`, `deferred` at default, on Flux and Gemini models,
with an independent witness file written by the tool body and a positive control run first.
Detail in `W-1-RESULT.md`. **In the packaged app it is still blocked** — first by Core C-5
(ToolSearch matching), now mitigated, and then by W-1a (the Autopilot approval wedge), which is
ours and open.

**L-2 — NOT VALIDLY RUN. Do not record this as a pass.** The config was byte-identical after a
real SIGKILL mid-launch and no `[profiles.__wayland_desktop_session]` was left behind — but the
**positive control failed**: polling the config every 250ms through a full launch never observed
the splice being written at all, and no `--profile` appeared in the engine spawn args. With no
connectors selected there is nothing for K-01's allowlist to filter, so nothing is written and
"clean afterwards" is vacuous. **To run this properly, first select at least one connector in the
chat** so the splice is actually written, confirm it appears mid-launch, and only then kill.
This is the same false-zero trap that nearly produced two bogus bug reports on this milestone.

**L-5 negative control, W-1b — a real defect found instead.** After one bootstrap failure, every
later turn replayed the identical cached error (same sentinel path, same PID) with no fresh spawn,
even after the sentinel file was gone from disk. Tracked as W-1b.

**K-02 — CONFIRMED LIVE.** An engine that refused to start put its reason in the chat as a durable
error tip rather than a silent spinner.

---

## Original checklist (unrun items below remain outstanding)

Every packet in the demo-critical line (K-01…K-04) is built, unit-tested and audited. None of it is
*proven* until the steps here execute against a real engine. This milestone's own success standard
says a mechanism claim is established by executing it, never by reading source — so until these are
run, the correct description of K-01/K-02/K-03 is "built and audited", not "working".

No live engine binary was usable in the worktree during the build session. Three separate executors
each stopped at their live checkpoint and said so rather than substituting a unit test. Keep that
discipline here.

## Preconditions

- Engine 0.12.25 available (the committed pin, `scripts/prepareWaylandCore.js:213`).
- Engine **0.12.26 STABLE** — published 2026-08-08T03:46:19Z (GitHub release `isPrerelease: false`,
  npm `latest: 0.12.26`). Select it with `WCORE_VERSION=v0.12.26`. **Do not bump
  `DEFAULT_WCORE_VERSION`.** That bump is a separate, deliberate act and is Sean's call.
- A chat workspace that is NOT trusted by Core (the default for an ordinary user's project dir) —
  this is the condition that triggered the whole milestone.
- TVControl 2.2.2 installed from the Library.
- **Back up your real global `config.toml` before starting.** K-01 mutates it by design. The whole
  packet exists to do that safely, but verify with a copy in hand the first time.

---

## L-1 — K-01 dual-version launch (PRF-01)

The headline claim: Desktop drives Wayland Core on both engines.

1. Fresh profile, Wayland Core selected, one prompt, execute a TVControl tool.
2. Repeat on **0.12.25**.
3. Repeat on **0.12.26 stable** (`WCORE_VERSION=v0.12.26`). Note the bundled binary on disk also
   reports `0.12.26` but is the rc.2 artifact from earlier testing — confirm which build each run
   actually used rather than trusting the version string alone.

**Pass:** the MCP tool executes on both. Before K-01, 0.12.26 died at bootstrap on every turn.

**Also check, and this is the part people skip:** open your global `config.toml` after the turn ends
and confirm `[profiles.__wayland_desktop_session]` is **gone** and your own content, comments and
formatting are intact.

## L-2 — K-01 crash safety (PRF-06)

1. Record the exact bytes of your global `config.toml` (`shasum -a 256`).
2. Start a chat and **SIGKILL Desktop mid-launch**, while the engine is starting.
3. Relaunch Desktop and start any chat.
4. Re-hash the config.

**Pass:** byte-identical to step 1. The unit suite has a real-process SIGKILL test for the primitive;
this proves it through the actual app.

## L-3 — K-01 concurrent launches (PRF-05)

1. Start two chats **with different connector selections** at the same time.
2. Confirm each engine sees only its own connectors, not the other's.

**Pass:** no cross-chat tool leakage. This is the invariant the launch profile exists to enforce.

## L-4 — K-01 settings write during launch (the O-1 residual)

1. Start a chat and, while it is launching, change something in Settings that writes config.
2. Let the turn finish.

**Pass:** your config never contains `[profiles.__wayland_desktop_session]` afterwards.
**Known and accepted:** that one launch may fail with "Profile not found". Transient, no persistent
damage, no data loss. Tracked as O-1 in `K-01-CROSSAUDIT.md`; the durable fix is unifying the two
locks and needs its own packet.

## L-5 — K-03 the turn that finishes (TRN-01/02/03) — **with the negative control**

1. Run an ordinary Core turn on 0.12.25. Confirm no regression on the normal path.
2. Reproduce the original repro — a prompt likely to end in a short, content-light `stream_end`.
   Confirm the UI leaves the running state promptly instead of sitting at "running".
3. Run a turn that ends in an **error** frame (an invalid API key will do). Confirm it also clears.
4. Spot-check a tool-heavy turn still reconciles cleanly.
5. **Negative control — do not skip this.** Revert `a211ea6cb` locally, confirm the same repro
   *still hangs*, then re-apply and confirm it does not.

Step 5 is what separates "we changed something and the symptom went away" from "we fixed the cause".
The root cause was established by feeding the consumer a newline-less frame directly; this proves the
real engine actually produces that split in production, which is the one thing planning could not
establish.

## L-6 — K-02 honest failure surfacing (DIA-01/02)

1. Force a start failure inside an untrusted workspace — the 0.12.26 stripped-config case is ideal.
2. Read the chat bubble.

**Pass:** it shows the engine's own reason, not "wcore Desktop contract rejected ready". Where the
stripped-config inference applies, the hedge reads as a *possibility*, not a verdict.

**Then the one that matters most:** put an API-key-shaped string somewhere the engine will echo to
stderr and force a failure. **No fragment of that key may appear in the UI, the logs, or the renderer
console.** Unit tests cover the known paths; this is the check that catches a path nobody modelled.

---

## After all six pass

- Update `.planning/STATE.md` and the WLD-K progress table.
- Only then is the "Master Class is safe at this line" boundary genuinely met.
- The `DEFAULT_WCORE_VERSION` bump to 0.12.26 becomes available — L-1 is exactly the evidence that
  makes it safe. It stays a deliberate, separate commit.

## If something fails

Fix the cause. Do not relax an assertion to make a step pass. A real security check was weakened on
this project once to satisfy a fixture artifact; a cross-audit caught it, not the author.
