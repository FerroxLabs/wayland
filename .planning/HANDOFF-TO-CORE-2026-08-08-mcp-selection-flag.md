# Handoff to Wayland Core — session-local MCP selection, and two questions

**From:** Wayland Desktop (WLD-K, phase K-04 / ENG-01, ENG-02, ENG-03)
**Date:** 2026-08-08
**Status of the sender:** Desktop is shipping an interim fix (see "What Desktop is doing anyway"),
so **nothing here blocks your 0.12.26 release.** This is the durable mechanism ask.

---

## 1. The ask — a session-local MCP selection flag

### What Desktop needs

Each Desktop chat enables a different subset of MCP connectors. Connectors published into Core's
**global** `config.toml` load at startup for *every* session, so Desktop needs to narrow the tool
table to just the connectors selected for **this** chat.

Today Desktop does that by writing a throwaway `[profiles.__wayland_desktop_session]` block with an
`mcp_servers` allow-list and passing `--profile`. That is a config-file mutation standing in for what
is really a **per-process argument**.

### Proposed flag

```
--mcp-server <ID>        (repeatable)
--no-mcp-servers         (explicit empty set)
```

**Semantics we would rely on:**

| | behaviour |
|---|---|
| neither flag present | current behaviour, unchanged |
| one or more `--mcp-server` | after **all** config and profile merging, retain exactly those server IDs |
| `--no-mcp-servers` | retain none |
| unknown ID | **fatal startup error naming the missing IDs** — not a silent drop |
| duplicate IDs | harmless |
| both flags together | rejected as mutually exclusive |
| persistence | none — host-provided, session-local, never written to any config file |
| interaction with trust | applied **independently of workspace trust**, and independently of assistant/persona identity |

The "fatal on unknown ID" row is the one we care most about. The failure mode that cost us this week
was a silent drop, and a subtractive filter that silently retains nothing looks identical to a broken
connector.

### Why not the mechanisms that already exist

We looked at both before asking, and rejected them on our side:

- **`--profile` + `mcp_servers`** — what we use today. It requires Desktop to mutate a config file on
  every launch to express a per-process fact.
- **`--assistant` + `only_for_assistant`** — we looked hard at this, since your help text says the
  desktop host is expected to set `--assistant`, and there is a real e2e test
  (`crates/wcore-cli/tests/mcp_assistant_scoping_e2e.rs`) covering the deferred json-stream path we
  actually use. We are **not** using it for chat narrowing, because it can only *restrict*: a server
  **without** `only_for_assistant` is always injected. To express an exact per-chat allow-list Desktop
  would have to mark every entry, including ones the user hand-authored, and one missed marking is a
  cross-chat tool leak. It also encodes an N×M chat-by-server membership matrix in one file.
  **This is not a complaint about the feature** — it does what it says. It is the wrong shape for
  per-session selection, which is what `--mcp-server` would be.

---

## 2. Question — the misleading error (ENG-02)

On 0.12.26, when a workspace is untrusted, Core strips `[profiles.*]` from project config and then
reports **"Profile not found"** for a profile that *was present in a file Core parsed and then
discarded*.

That message sent us looking for a missing profile, a typo, and a path bug, in that order. The
information that would have ended it in a minute — "this section was stripped because the workspace
is untrusted" — was known to Core at the moment it was discarded.

**Ask:** when a section is dropped by the trust filter and something later fails because it is
missing, can the error say so? Even a single extra clause would do it:

> `Profile 'X' not found (project config sections were stripped: workspace is untrusted)`

We are absorbing this on our side too (Desktop's K-02 surfaces the engine's own stderr reason instead
of a contract-layer abstraction), so this is a quality-of-life ask, not a blocker.

---

## 3. Question — is wire-added stdio being disabled? (ENG-03)

**Stated carefully, because we have not seen this ship.**

While reading Core to understand the profile filter, we found in a **local, uncommitted** working-tree
edit that `to_mcp_server_config` refuses stdio:

> `wire-added stdio MCP servers are disabled because they launch a local process; configure trusted
> stdio servers before session startup`

We verified this is **not** in any released version — `git show v0.12.26-rc.2` shows
`"stdio" => TransportType::Stdio`, i.e. stdio is still accepted. So we are **not** reporting a
regression. We are asking about intent.

**Why it matters to us:** Desktop injects per-session stdio connectors over the wire with
`add_mcp_server` (`src/process/agent/wcore/index.ts`, the pre-message phase). If wire-added stdio is
disabled, that path stops working and every stdio connector would have to be published into config
ahead of startup — a significantly different integration.

**Ask:** if that change is intended to land, please tell us before it ships, and ideally with a
migration path. If it is an abandoned experiment, ignore this section entirely.

---

## What Desktop is doing anyway (so this is not a dependency)

Desktop is shipping the interim fix now: move the launch profile out of the per-chat *project* config
and into the **global** config root the engine is already pointed at via `WAYLAND_HOME`. Verified by
execution against 0.12.26-rc.2 — symlinks present, **no** trust flag, `[mcp] Connected to
'tvcontrol': 101 tools`, turn completes. It also works on 0.12.25, so Desktop supports both engines
and the pin can move whenever 0.12.26 publishes.

That fix is deliberately interim. Two independent design reviews both concluded that a host-supplied,
per-process capability list is the correct mechanism and a config-file mutation is not. If
`--mcp-server` lands, Desktop drops the global-config write entirely and stops touching the user's
`config.toml` on the launch path.

**Priority, honestly stated:** §1 is the one that changes our architecture. §2 is a small kindness
that saves the next person hours. §3 is a heads-up request, not a request for work.

---

## Verification notes

Everything asserted here about Core was established by **executing** or by `git show` against a
released tag — never by reading the working tree and assuming it ships. The one working-tree
observation (§3) is explicitly labelled as such. When we first flagged §3 we had it wrong: our search
method returned a zero we could not trust, and re-running it against a **known positive** showed the
change was uncommitted, not released. That correction is why §3 is phrased as a question.
