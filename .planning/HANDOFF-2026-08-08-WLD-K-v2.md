# WLD-K handoff — Desktop runs on released Core v0.12.26

**Worktree** `~/dev/wayland-worktrees/packet-attribution`, branch `packet/attribution-audit`,
head **`425b596d7`**, in sync with `ferrox`. Full suite **16,301 passed, 0 failed**, typecheck clean.
**Nothing merged, nothing tagged, no PR.** Only `AGENTS.md` is dirty (permanent, never staged).

**Read in this order**

1. this file — state and the work list
2. `phases/WLD-K-core-first/L-1-RESULT-2.md` — what live running actually proved
3. `HANDOFF-TO-CORE-2026-08-08-v0.12.26-host-findings.md` — C-1…C-4, Sean's to send
4. `HANDOFF-TO-CORE-2026-08-08-mcp-selection-flag.md` — the earlier ENG-01…03 asks

---

## 1. Where we are

`DEFAULT_WCORE_VERSION` is **`v0.12.26`**, bundled and attestation-verified (`verified: true`; the
rc.2 bundle it replaced was `verified: false`).

**Proven by running the packaged app against the real engine:** contract negotiates · session
survives past `ready` · turns run to completion with rendered replies · Desktop publishes an MCP
server at runtime and Core connects it (`Connected to 'wayland-team-guide': 2 tools`) · the model
sees those tools by name (`ToolSearch("aion")` → `aion_create_team`, `aion_list_models`) · builtin
tools execute (`Bash` → Success) · provider errors render in the chat.

**NOT proven — do not claim either:** an MCP tool's own _body_ executing, and per-chat connector
selection. Only the auto-published team-guide server was ever exercised.

### The eleven commits

```
7165d443f  re-pin the Desktop contract to released Core v0.12.26
b4d37e4de  bundle released Core v0.12.26 as the default engine
a05a241b4  stop v0.12.26 killing every session on workspace_policy
1bf0fe2fe  docs: L-1 result
d2f8926b0  declare an assistant identity so 0.12.26 accepts runtime MCP
2e32d11f7  remediate the 6 defects the cross-audit found
f8494a840  docs: what the rerun proved, and what it did not
9c4797e56  revert: restore the generated constitution FS authority
974947758  make an engine bootstrap failure durable, not just streamed   ← K-02 closed
8e908ba2e  docs: handoff
425b596d7  docs: Core handoff (C-1..C-4)
```

## 2. 🔴 Sean's machine will not start 0.12.26 until one line changes — HIS CALL

Verified with the SAME config file: **0.12.25 starts, 0.12.26 refuses.**

`~/Library/Application Support/wayland-core/config.toml` has `[storage.credentials]
backend = "plaintext"` with `[session] enabled = true`. Any one of these fixes it: delete the
`backend` line · `backend = "keyring"` · `[session] enabled = false`.
**`WAYLAND_VAULT_PASSPHRASE` does NOT work** — Core's own advice is wrong (C-3).

**Do not edit that file without asking.** Every temporary change during verification was restored
byte-identical, `sha256:0bc1051d…`, verified each time. Fresh users will not hit this — it is a
deliberate opt-in.

---

## 3. The work list — our side, ordered, workflow-ready

Each item states what "done" means so it can be handed to an agent without re-deriving scope.

### W-1 — Why does the model never invoke a discovered MCP tool? **✅ ANSWERED — see `phases/WLD-K-core-first/W-1-RESULT.md`**

**Root cause is Core's, and it is `ToolSearch` matching, not the deferred-tool design.**
`tool_search.rs:120-123` requires **every whitespace token** of the query to be a literal substring
of the tool name or description. A query containing the tool's EXACT name still misses if any other
word does not appear — proven back to back in one session:
`ToolSearch("probe")` matches, `ToolSearch("wld_probe_secret tool schema parameters")` does not.
Punctuation is part of the token, so `aion_list_models,` never matches. The model rephrases with
more words, matches less, and loops. Not model-specific: 28/28 tool calls were `ToolSearch` on
`claude-sonnet-5`, 19 returning "no match"; re-repro'd on `gpt-5.6-sol`.
**Proven working:** once a search matches, an MCP tool's body executes end to end and its output
reaches the reply — on config-declared AND runtime `add_mcp_server`, `deferred` at default, on Flux
and Gemini models, verified by a witness file the tool itself writes.
Filed to Core as **C-5** (top of the summary table). Remaining on our side: a cheap usage-guidance
prompt so the model searches by one distinctive keyword — raises the match rate without waiting.

### W-1a — Autopilot wedge **✅ WITHDRAWN — not a defect, I was wrong**

I reported this as blocking MCP invocation. It is a **false alarm in the log line**, nothing more.
The `turn may wedge` line fires 5 times in the live log and **4 of the 5 are followed within ~70ms
by `[Bash success] Exit code: 0`** — the tool ran every time (verified with `grep -A2`). The turn
that skipped the MCP tool called `Bash` instead: a model choice, not a block.
Residual nit: silence or correct the alarm, since a warning that never comes true trains people to
ignore it. Not a blocker, no packet needed.

### W-1b — A failed bootstrap is never retried **✅ FIXED `c967368e3`**

After one `refused to start`, later turns replayed the identical cached error — same sentinel path,
same PID, 95s apart, with **no second `(start) failed` line between them**, so nothing respawned.
`startError` had one writer and no reset. `sendMessage` now retries once per turn via
`ensureBootstrap()`; guards cover a surviving agent identity, a retained profile lease, and
teardown. Negative control run both directions.

### W-2 — Per-chat connector selection on 0.12.26 **[S · untested]**

Only the auto-published `wayland-team-guide` was ever exercised. A user-selected connector
(`wayland-search-skills` is enabled in the test profile) has never reached the pool on this engine.
_Done when:_ a connector chosen in the composer produces its tools in that chat and not in another.

### W-3 — L-2…L-6, the rest of live verification **[M · all outstanding]**

From `phases/WLD-K-core-first/LIVE-VERIFY.md`, none run on 0.12.26:

- **L-2** crash safety: SIGKILL mid-launch, global `config.toml` byte-identical after
- **L-3** concurrent launches with different connector selections, no cross-chat tool leakage
- **L-4** settings write during launch (the accepted O-1 residual)
- **L-5** K-03's turn-that-finishes **including its negative control** — revert `a211ea6cb`, confirm
  the repro still hangs, re-apply, confirm it does not
- **L-6** honest failure surfacing **plus the secret-leak check**: put an API-key-shaped string where
  the engine will echo it to stderr, force a failure, confirm no fragment reaches UI, logs or the
  renderer console
  _Done when:_ each has a recorded result, pass or fail, in `LIVE-VERIFY.md`.

### W-4 — Is K-01's profile splice still NECESSARY? **[S · decision, then possibly L]**

Core 0.12.26 now scopes runtime MCP to the assistant automatically. If Desktop passed a _per-chat_
assistant identity, that scoping may already deliver the per-chat narrowing the global-profile splice
was invented for. K-01 is correct and shipped either way — this is only about whether it can retire.
**Blocked on Core answering C-2 question 1.** Do not rework K-01 before that answer.

### W-5 — O-1 / O-2 lock unification **[M · deferred with sign-off]**

`configBridge` writes the same global `config.toml` under an unrelated `writeLock`. The damaging
branch is closed (it refuses to persist the ephemeral table); unifying the locks needs its own packet
because of ABBA risk. Tracked in `K-01-CROSSAUDIT.md`.

### W-6 — K-05a / K-05b / K-06 **[L each · not started]**

Agent installer (npm subset first), non-npm channels, then Flux fan-out. Needs all three OSes:
`seandesktop` 100.109.207.54 (Windows) · `wayland-soak` 100.81.158.63 (Linux, Ubuntu 24.04).
`hetzner-dsm` 95.216.244.213 is a DIFFERENT project. Hard constraint on K-06: API key + base URL
only, **never Claude subscription OAuth** (standing hard NO, ToS).

### W-7 — Send Core the handoff **[Sean's action, not an agent's]**

`HANDOFF-TO-CORE-2026-08-08-v0.12.26-host-findings.md` (C-1…C-4) plus the earlier ENG-01…03 file.
No duplicates in Core's 15 open issues; their #183 is related to C-3.

---

## 4. Guardrails — the ones that bit, first

- **NEVER `git add -A src`.** It sweeps in `src/process/services/constitution/constitutionFsAuthority.generated.ts`,
  which carries this machine's local trust-root sha and must never be committed. **It happened this
  session** in `2e32d11f7`, corrected in `9c4797e56` by restoring the exact prior bytes. History was
  not rewritten, so that commit still contains it. **Stage by explicit path.**
- No merge, no tag, no release, no PR without Sean. `build-and-release.yml` fires on **ANY** tag.
- Never touch `~/dev/wayland/app` — the canonical tree. All work stays in the worktree.
- gh writes must be **FerroxLabs** (drifts to TradeCanyon). No backticks in gh/wl comment bodies.
- No AI signatures in commits or PRs. No history rewriting.
- Never relax, skip or delete an existing test to make something pass. Fix the cause.
- Never weaken the security shell (`sandbox`, `contextIsolation`, CSP, `bridgeAllowlist`,
  `urlValidation`, DOMPurify, `safeStorage`). Never touch the signing pipeline.
- `migrations.ts` `aionrs` SQL literals never change. `FoundrySkills` is never renamed.
  `prek run --all-files` is forbidden.
- Burner Flux keys live at `~/.config/wayland-smoke/` — never commit, print, echo or log them.
  **Sean should rotate the burn key that was pasted in chat.**

## 5. Method rules this milestone earned — these caught real errors

- **False zeros.** `mcp_ready` never appears in the Desktop log — Desktop handles it but never logs
  it, so grepping returns zero and means nothing. `MCP ToolSearch candidate pool: 0` is logged
  synchronously at publication, before any receipt can land. **Both nearly became false bug
  reports.** Confirm a method finds a known positive before believing a zero.
- **A check on the wrong path is a dead check.** The integer guard hung off a method production never
  calls. It passed its test and protected nothing. Codex found it by execution, not by reading.
- **Run a negative control.** The K-02 fix was proven by removing the persistence (red) and restoring
  it (green). Do this for every non-trivial fix.
- `WAYLAND_DEV_PROFILE=X` → `Application Support/X`, **not** `Wayland-X`. A profile cloned to the
  prefixed name is silently ignored.
- The bundled binary reports `0.12.26` whether it is rc.2 or stable. Only `--build-info` tells them
  apart, and their contract digests differ.
- Rebuild `out/` between code changes or you are testing stale code. This cost a full cycle once.
- rtk truncates: `wc -l`, `grep -c`, enumeration. Use `rtk proxy <cmd>` when counting or listing.

## 6. Live-verify recipe

`~/.claude/projects/-Users-seandonahoe-dev-wayland/memory/cdp-live-verify-recipe-desktop.md` —
`WAYLAND_MULTI_INSTANCE=1 WAYLAND_DEV_PROFILE=L1-1226 WAYLAND_DISABLE_AUTO_UPDATE=1 bun run start`,
CDP on 127.0.0.1:9230. Helper scripts (`cdp.js`, `click.js`, `type.js`, `key.js`, `shot.js`) were in
the session scratchpad and are **gone after a compact** — rewrite from the recipe.
Check for a stale `<profile>/wayland-core-overrides/` before any engine-dependent run; it silently
supersedes the bundled binary.
Clean up: `lsof -tiTCP:9230 | xargs kill -9`, then `pkill -f packet-attribution`.

## 7. Cross-audit panel

Codex 5.6 Sol `codex exec -m gpt-5.6-sol -s read-only --skip-git-repo-check "…" < /dev/null` ·
Kimi K3 `/Users/seandonahoe/.kimi-code/bin/kimi -p "…" --output-format text` · internal
`ferrox-code-reviewer`. **Gemini is degraded — Sean's call, skip it.** This session's panel found 6
real defects on a diff that already had a full green suite. Green CI is not evidence.
