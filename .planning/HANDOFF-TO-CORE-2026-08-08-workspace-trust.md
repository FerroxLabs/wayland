# Core → workspace trust breaks every Desktop chat on 0.12.26

**2026-08-08. Short version: 0.12.26 stops Wayland Core working in Desktop entirely.
We can fix our side with one flag. The ask here is the diagnostic, plus one design
question.**

---

## What happens

Every Wayland Core turn in Desktop dies before it starts:

```
[WCoreMcpAgent] Added MCP server: tvcontrol          <- publication fine
[wcore] Error: Profile '__wayland_desktop_session' not found in config
[WCoreManager] agent bootstrap failed; turn cannot start
```

## Why

`0.12.26` added workspace trust fingerprinting. Project config that expands authority —
`[profiles.*]`, `[mcp.servers.*]`, `[providers.*]` — is stripped unless the workspace is
trusted (`config.rs:5359-5372`).

Desktop spawns Core in a `wcore-temp-<ts>/` directory **it creates itself, per chat**,
and writes `.wayland-core.toml` there containing a launch-local
`[profiles.__wayland_desktop_session]` that narrows the MCP table to the connectors the
user picked for that conversation. Then it passes `--profile`.

Core has never seen that directory, so it is untrusted, so the profile block is
discarded — and then `--profile` cannot find what was just discarded.

**We are not disputing the control.** It is the right control. An untrusted repo should
not be able to grant itself MCP servers.

## Minimal repro (no Desktop involved)

```bash
mkdir ws && cd ws
printf '[profiles.p]\nmcp_servers = ["x"]\n' > .wayland-core.toml
wayland-core --profile p -p <provider> -k <key> -m <model> "hi"
```

| engine | result |
|---|---|
| 0.12.25 | works |
| 0.12.26-rc.2 | `Error: Profile 'p' not found in config` |
| 0.12.26-rc.2 + `--project-dir <ws>` | same failure |
| 0.12.26-rc.2 + `--trust-workspace` | **works** — `[mcp] Connected: 101 tools` |

Both engines *parse* the file — invalid TOML errors identically on both — so it is read
and then stripped, not ignored.

---

## Ask 1 (the real one): the error blames the wrong thing

```
Error: Profile '__wayland_desktop_session' not found in config
```

The file exists. The profile is in it. Core read it, discarded it on a trust decision,
then reported it as absent. The actual explanation is a `tracing::warn!` at
`config.rs:5370` that never reaches the user.

This cost us hours chasing the wrong layer — whether the file was written at all, whether
the transaction rolled it back, whether `--project-dir` resolved differently — before the
answer turned up in your source rather than your output. Every other consumer that writes
project config will lose the same hours.

**Suggested:** when a `--profile` lookup misses AND the project config contained that
profile before trust stripping, say so:

```
Profile 'X' was ignored: this workspace's executable configuration is not trusted.
Run with --trust-workspace, or `wayland-core ... --trust-workspace` once to persist.
```

More generally: stripping authority-expanding config is a *decision*, and decisions that
change behaviour should be visible at default verbosity, not a warn-level trace.

## Ask 2 (design question, your call)

Should a workspace the **app itself just created** be trusted by construction?

Desktop's `wcore-temp-*` is not a user artifact. Desktop creates the directory, writes the
config, spawns Core into it, and tears it down. There is no untrusted third party in that
loop — the config is app-owned, and Desktop already sanitises any pre-existing file
(`sanitizeProjectConfig` strips untrusted `[providers.*]`).

Requiring `--trust-workspace` there means Desktop asserts trust on every single chat spawn,
which is a flag that then exists in our command line permanently — and a flag that broad is
easy to point at the wrong directory later. A narrower mechanism (an env var Core honours
only for a directory it was handed, or a "this is an ephemeral app workspace" signal) might
be safer than us passing the general-purpose trust flag forever.

**If you would rather we just pass `--trust-workspace`, say so and we will.** We are
implementing exactly that now, guarded so it is only ever applied to our own generated
`wcore-temp-*` directory and never to a folder the user opened (`initAgent.ts:506`
already distinguishes them via `customWorkspace`).

## Ask 3 (small): semver

This is a breaking change for any consumer writing project config, shipped 0.12.25 →
0.12.26. Worth a line in the release notes even if the version number stays.

---

## Unrelated but blocking us

**`v0.12.26` stable is not published.** GitHub's newest release is `v0.12.26-rc.2`
(pre-release, Aug 5); `v0.12.25` is still tagged Latest; npm `dist-tags` show
`latest: 0.12.25`, `next: 0.12.26-rc.2`. We were told stable shipped — if a release run
reported success, it did not land. We cannot bundle a stable engine until that tag and its
seven assets exist.

## Status our side

- TVControl is **not** implicated. 2.2.2 connects with 101 tools the moment trust is
  granted. The catalog install path works end to end from the Library.
- W-0 (ToolSearch/MCP discovery) is confirmed FIXED in rc.2 — verified standalone: prompt →
  ToolSearch → `chart_get_state` → `chart_set_symbol`, chart physically moved.
- One open Desktop-side bug of our own, unrelated to you: after Core emits
  `stream_end / finish_reason: stop`, our UI keeps showing "running" indefinitely
  (observed 40s engine turn still "running" 6 minutes later on 0.12.25). Ours to fix.
