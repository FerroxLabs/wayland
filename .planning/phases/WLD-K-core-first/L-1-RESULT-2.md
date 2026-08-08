# L-1 rerun on released Core v0.12.26 — three blockers found, two fixed

**Run 2026-08-08 against commit `a05a241b4`, packaged (`bun run package`) before each attempt.**
**Engine: released v0.12.26 (`--build-info` source `98ad1c28…`), bundled and attestation-verified.**

Everything below was established by running the packaged app against the real engine over CDP.
Nothing here is inferred from source. Where source is cited it is to name the cause of an
observed failure, never to assert behaviour on its own.

## Verdict

`Desktop → Wayland Core 0.12.26` now **starts, negotiates the contract, runs a turn, and calls
ToolSearch**. It did none of those before this session. It does **not** yet execute an MCP tool,
because of blocker 3, which is a Core behaviour change we have not yet adapted to.

| stage | before | after |
|---|---|---|
| descriptor handshake | `contract_minor_mismatch` | **negotiated** |
| first frame after `ready` | session killed on `workspace_policy` | **dropped cleanly, session lives** |
| turn runs | never | **48.8s turn, 11,776 input tokens** |
| ToolSearch called | never | **called** |
| MCP tool executes | no | **no — blocker 3** |

## Blocker 1 — the contract pin named a commit that never shipped. FIXED

Desktop pinned `1.0` / `wcore-desktop-contract-gen/1` from Core `d0aa0abc`, which lives on branch
`feat/887` and **is not an ancestor of any `v0.12.*` tag**. Released 0.12.26 emits `1.12` / `gen-13`.

It stayed invisible because **v0.12.25 ships no contract corpus at all** — no `ready.contract`, so
the consumer takes its legacy branch and no v1 machinery runs. 0.12.26 is the first released engine
to advertise a descriptor, so it is the first that could ever have caught this.

Fixed in `7165d443f` (corpus re-imported byte-for-byte from released 0.12.26, pin updated) and
`b4d37e4de` (bundled engine bumped to match — rc.2 advertises the same *version* but different
fixture and source digests, so it is not interchangeable).

## Blocker 2 — Core emits seven events its own corpus does not declare. FIXED our side

With the pin fixed, the handshake succeeded and the very next frame killed the session:

```
wcore Desktop contract rejected ready: unknown Core event workspace_policy is not explicitly noncritical
```

`workspace_policy` is emitted immediately after `ready` on every session and carries no `critical`
flag. The unknown-event rule was right to fail closed. The corpus is what is wrong.

Core's `PRODUCER_EVENT_TYPES` (`contract/spec.rs` at the pinned commit) declares **59** producer
events. The manifest generated from that same tree declares **52**. The difference:

`capability_activation`, `compact_offload`, `mid_flight_monitor_decision`, `provider_attempt`,
`provider_failure`, `provider_retry`, `workspace_policy`

Core's own reference host observer accepts these off `PRODUCER_EVENT_TYPES`, so only a host
validating against the **manifest** — the artifact hosts are told to validate against — trips over
them. Fixed in `a05a241b4`: Desktop drops exactly those seven under their own reason. Dropped, never
dispatched; there is no handler for any of them, so this matches what a legacy pre-corpus engine
produced in practice. **Core should add them to the corpus and re-cut** — see the handoff.

## Blocker 3 — runtime MCP now requires an assistant identity. NOT FIXED

Observed on the live run:

```
mcp_failed { name: 'wayland-team-guide',
             reason: 'active assistant identity is required for a runtime MCP declaration' }
MCP ToolSearch candidate pool: 0 tools from current-session receipts
```

Cause, in `crates/wcore-cli/src/main.rs` at the pinned commit:

```rust
fn scope_host_runtime_mcp(config: McpServerConfig, active_assistant: Option<&str>)
    -> Result<McpServerConfig, &'static str> {
    let active_assistant = active_assistant
        .filter(|assistant| !assistant.trim().is_empty())
        .ok_or("active assistant identity is required for a runtime MCP declaration")?;
    Ok(config.scoped_to_assistant(Some(active_assistant)))
}
```

**Every** wire-added `add_mcp_server` is now scoped to the active assistant, and **fails outright if
the host did not supply one**. Desktop launches ordinary chats without one, so every runtime MCP
publication fails and the tool pool is empty. This is why no tool executes.

The flag exists: `--assistant <id>`, documented in Core as *"The host's active assistant identity,
for per-assistant MCP scoping."*

**This deserves a design decision, not just a patch.** The milestone rejected option F
(`only_for_assistant`) as the primary narrowing mechanism because it can only restrict — an unmarked
server is always injected. Core 0.12.26 changes the calculus: runtime servers are now scoped to the
assistant **automatically and mandatorily**. If Desktop passes a per-chat assistant identity, that
scoping is exactly the per-chat MCP narrowing K-01's global-profile splice was invented to provide.
K-01 stays correct and shipped; whether it stays *necessary* is now an open question worth answering
before the Master Class.

## Environment blocker — plaintext credentials backend refuses to start on 0.12.26

Not a Desktop or Core defect, but it will hit real users and it hit this run first.

Core 0.12.26 refuses to start when `[storage.credentials] backend = "plaintext"` is set and durable
sessions are enabled. Sean's global `~/Library/Application Support/wayland-core/config.toml` has
exactly that. Verified matrix against the released binary:

| config | 0.12.26 |
|---|---|
| `backend = "plaintext"` + `[session] enabled = true` | **refuses to start** |
| same, **plus `WAYLAND_VAULT_PASSPHRASE`** | **still refuses** |
| `backend = "plaintext"` + `[session] enabled = false` | starts |
| `backend = "keyring"` + sessions enabled | starts |
| no `[storage.credentials]` block + sessions enabled | starts |

The second row is a **Core defect**: Core's own error text tells the user to set
`WAYLAND_VAULT_PASSPHRASE_FD` / `WAYLAND_VAULT_PASSPHRASE`, and doing so does not work while an
explicit `backend = "plaintext"` is configured. The advice sends the user down a dead end.

`backend = "plaintext"` is a deliberate opt-in (`wcore-cli/src/auth.rs`), not something Desktop or
Core writes on its own, so a fresh non-technical user will not hit it. Sean's machine will, every
time, until that line is removed.

The real config was backed up, temporarily neutralised for the run, and restored byte-identical
(`sha256:0bc1051d…` before and after, verified both times). It carries no edit from this session.

## Desktop UX defect — a failed bootstrap shows the user nothing

On the blocker-1 and blocker-2 failures the main process did everything right: it logged the cause,
called `emitStartFailure`, and emitted `error` + `finish`. The chat showed **nothing at all** — not
the error, and not even the user's own message, which was persisted to the database. The turn sat on
`queued` indefinitely.

This is the K-02 gap the previous run reported, now reproduced on demand and with the main-process
side ruled out. The remaining work is in the renderer, not in `WCoreManager`.

## Method notes

- The bundled engine reports `0.12.26` whether it is rc.2 or stable. Only `--build-info`
  distinguishes them, and their contract digests differ. Always check.
- `out/` must be rebuilt between code changes or the run tests stale code. This cost one full cycle
  earlier in the milestone and was avoided here by rebuilding before each attempt.
- `WAYLAND_DEV_PROFILE=L1-1226` resolves to `Application Support/L1-1226`, **not**
  `Application Support/Wayland-L1-1226`. A profile cloned to the prefixed name is silently ignored.
