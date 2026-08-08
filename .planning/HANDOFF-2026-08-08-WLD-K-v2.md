# WLD-K handoff — Desktop runs on released Core v0.12.26

**Worktree** `~/dev/wayland-worktrees/packet-attribution`, branch `packet/attribution-audit`,
head **`974947758`**, 0 unpushed. Full suite **16,301 passed, 0 failed**, typecheck clean.
Nothing merged, nothing tagged.

Read in this order: this file → `phases/WLD-K-core-first/L-1-RESULT-2.md` (what live running
proved) → `HANDOFF-TO-CORE-2026-08-08-mcp-selection-flag.md` (the four asks for Core).

---

## 1. The headline

`DEFAULT_WCORE_VERSION` is now **`v0.12.26`**, bundled and attestation-verified
(`verified: true`; the rc.2 bundle it replaced was `verified: false`).

Desktop → Core 0.12.26 negotiates the contract, runs turns to completion, publishes MCP servers at
runtime (`Connected to 'wayland-team-guide': 2 tools`), and the model can see those tools by name
(`ToolSearch("aion")` → `aion_create_team`, `aion_list_models`). None of that worked this morning.

**Not proven, do not claim it:** an MCP tool's own *body* executing. The model repeatedly searched
for `aion_list_models`, got it back, and never issued the call. Also unproven: per-chat connector
selection (only the auto-published team-guide server was ever exercised).

## 2. Three blockers, all found by RUNNING it

1. **The contract pin named a commit that never shipped.** `1.0`/`gen-1` from Core `d0aa0abc` on
   branch `feat/887` — not an ancestor of any `v0.12.*` tag. Hidden because **0.12.25 ships no
   corpus at all**, so the consumer silently ran in legacy mode and validated nothing. Re-pinned to
   `1.12`/`gen-13`, corpus re-imported byte-for-byte from released 0.12.26.
2. **Core emits 7 events its own manifest omits.** `PRODUCER_EVENT_TYPES` = 59, manifest = 52.
   `workspace_policy` arrives right after `ready` on every session with no `critical` flag and
   killed the session. Desktop drops exactly those 7; `critical: true` still fails closed; the two
   safety-class ones are logged.
3. **`add_mcp_server` hard-fails without `--assistant`** (`scope_host_runtime_mcp`). Every runtime
   publication was refused. Desktop now always passes `--assistant wayland-desktop`, raw mode
   included.

## 3. 🔴 Sean's machine will not start 0.12.26 until one line changes

Verified with the SAME config file: **0.12.25 starts, 0.12.26 refuses.**

`~/Library/Application Support/wayland-core/config.toml` has `[storage.credentials]
backend = "plaintext"` with `[session] enabled = true`. Fixes that work: delete the `backend` line,
set `backend = "keyring"`, or `[session] enabled = false`.
**`WAYLAND_VAULT_PASSPHRASE` does NOT work** — Core's own remediation text is wrong (ENG-06).

It is a deliberate opt-in, so fresh users will not hit it. **This is Sean's call to make; do not
edit that file without asking.** Every temporary change during verification was restored
byte-identical (`sha256:0bc1051d…`, verified each time).

## 4. Cross-audit — 6 defects, all fixed in `2e32d11f7`

Codex 5.6 Sol + Kimi K3, independently. Worst: **the integer guard was dead in production** — it
hung off `validateOutboundCommandLine`, which the write path never calls; Codex proved it by
execution. Also: drop-list ran before the criticality check; the guard skipped decimal/exponent
spellings; raw mode wrongly exempted from `--assistant`; **two active attestation policies would
have failed the release gate** (`verifyFinalAcceptance` needs exactly one — v0.12.25 now
`superseded`).

## 5. K-02 closed (`974947758`)

The renderer hook was never the problem — a new DOM test drives the exact `emitStartFailure`
sequence through `useWCoreMessage` and it already surfaces the reason. The hole was that a
response-stream emit is delivered once and never replayed, and a bootstrap failure is exactly when
nobody is subscribed (turn sent from the new-chat surface while the conversation view is still
mounting). `emitStartFailure` now **persists** a durable error tip before emitting. Negative control
run both directions.

## 6. Next, in order

1. **Send Core the handoff** (ENG-01…06). Sean's action, not the agent's.
2. **Why does the model never invoke a discovered MCP tool?** It ToolSearches, gets the tool, and
   loops. This is the last gap between "MCP works" and "MCP works for a user".
3. **Per-chat connector selection on 0.12.26** — completely untested.
4. **L-2…L-6** (crash safety, concurrent launches, settings-write-during-launch, K-03 negative
   control, secret-leak check). All still outstanding.
5. **Is K-01's profile splice still NECESSARY?** Core now scopes runtime MCP to the assistant
   automatically. K-01 is correct and shipped either way; this is about whether it can retire.
6. K-05/K-06: agent installer + Flux fan-out, across all three OSes.

## 7. Guardrails that bit or nearly bit

- **NEVER `git add -A src`** — it sweeps in `constitutionFsAuthority.generated.ts`, which carries a
  local trust-root sha and must never be committed. It happened in `2e32d11f7` and was corrected in
  `9c4797e56` (restored to its exact prior bytes; history not rewritten, so that commit still
  contains it). Stage by explicit path.
- No merge, no tag, no release, no PR without Sean. `build-and-release.yml` fires on ANY tag.
- Never touch `~/dev/wayland/app` (canonical tree).
- gh writes must be FerroxLabs. No AI signatures in commits or PRs.

## 8. Method rules this milestone earned

- **`mcp_ready` never appears in the Desktop log** — Desktop handles it but does not log it.
  Grepping for it returns a FALSE ZERO. Same for `MCP ToolSearch candidate pool: 0`, which is
  logged synchronously at publication, before any receipt can land. Both nearly became false bug
  reports; the claim was settled by asking the model what tools it could see.
- `WAYLAND_DEV_PROFILE=X` → `Application Support/X`, **not** `Wayland-X`.
- The bundled binary reports `0.12.26` whether it is rc.2 or stable; only `--build-info` tells them
  apart, and their contract digests differ.
- Rebuild `out/` between code changes or you are testing stale code.
- CDP recipe, engine-override trap and cleanup: `~/.claude/.../memory/cdp-live-verify-recipe-desktop.md`.
