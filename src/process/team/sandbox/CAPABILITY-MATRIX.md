<!-- AUTHORITATIVE COPY: TEAM-BLITZ-PLAN.md §6.5. Keep in sync. -->

# Team Sandbox Capability Matrix

This document is the canonical reference for what an imported, sandboxed team
can do on the host. Every team-facing IPC handler and every MCP tool exposed
by `TeamMcpServer` is listed below with its sandbox behavior.

**How to read this table:** when a team is sandboxed (`team.isSandboxed === true`),
the enforcement layer checks `team.importCapabilityGrants[<cap>].by_user === true`
for the listed capability column. `deny` means the call throws
`TeamSandboxedError` regardless of capability grants. `n/a` means the
capability does not apply to this surface. `allow (if cap=true)` means the
call proceeds only when the user has granted that capability at import time.

Non-sandboxed teams (legacy / user-built) bypass every check - every cell
collapses to "allow".

---

## Core matrix (mirrors TEAM-BLITZ-PLAN.md §6.5)

| Surface | Tool / Handler | canReadFiles | canWriteFiles | canSpawnAgents | canNetwork | canCrossTeamMsg |
|---|---|---|---|---|---|---|
| MCP | `team_send_message` to OTHER team | n/a | n/a | n/a | n/a | **deny** |
| MCP | `team_send_message` to OWN team | n/a | n/a | n/a | n/a | allow |
| MCP | `team_spawn_agent` (leader-gated) | n/a | n/a | **deny** | n/a | n/a |
| MCP | `team_task_create` / `team_task_update` | n/a | n/a | n/a | n/a | n/a (carve-out - allowed in sandbox) |
| IPC | `team.workspace.readFile` within workspace, no symlinks ahead | allow (if cap=true) | n/a | n/a | n/a | n/a |
| IPC | `team.workspace.readFile` outside workspace OR symlink ahead | **deny** | n/a | n/a | n/a | n/a |
| IPC | `team.workspace.writeFile` (parent must exist) | n/a | allow (if cap=true) within workspace_dir, non-symlink | n/a | n/a | n/a |
| IPC | `team.workspace.mkdir` (non-recursive) | n/a | allow (if cap=true) within workspace_dir, non-symlink | n/a | n/a | n/a |
| IPC | `team.workspace.*` where path is `.env` / `.ENV` / `.Ssh/*` / `node_modules/.cache/*` / `node_modules/.bin/*` (case-insensitive + NFKC) | **deny** (always) | **deny** (always) | n/a | n/a | n/a |
| Network | `fetch` / `https.request` from team agent | n/a | n/a | n/a | **ALWAYS DENIED in v1** | n/a |

---

## Full MCP tool enumeration

Every tool currently routed by `TeamMcpServer.handleToolCall` is listed
here so no method is left ambiguous. Read tools default to `allow` (they
expose only data already visible to the user), write/spawn tools default
to `deny` unless capability granted.

| MCP tool | Behavior in sandbox | Capability gate | Notes |
|---|---|---|---|
| `team_send_message` (target = OWN team) | allow | none | Mailbox writes stay inside the team boundary; same-team coordination is the load-bearing primitive. |
| `team_send_message` (target = OTHER team via `args.team_id !== current`) | deny unless granted | `canCrossTeamMessage` | Throws `TeamSandboxedError` so the caller sees a uniform error. |
| `team_spawn_agent` | deny unless granted | `canSpawnAgents` | Already leader-gated; sandbox layer is an additional check. Throws `TeamSandboxedError`. |
| `team_task_create` | allow | none | Carve-out: tasks are first-class even in sandbox. Title/description must be sanitized at render time (W4c). |
| `team_task_update` | allow | none | Carve-out per matrix row above. Same sanitization requirement at render. |
| `team_task_list` | allow | none | Read-only on data the user already sees in the Activity tab. |
| `team_members` | allow | none | Read-only roster snapshot. |
| `team_rename_agent` | allow | none | Renames are purely cosmetic and bounded by the existing roster. |
| `team_shutdown_agent` | allow | none | Member-driven shutdown flow; cannot exfiltrate. Leader cannot be shut down (separate check). |
| `team_describe_assistant` | allow | none | Surfaces metadata about installed presets only. |
| `team_list_models` | allow | none | Read-only model catalog snapshot. |

---

## IPC enumeration (workspace FS)

The workspace FS handlers are wired in W4c. This matrix locks the contract
so the W4c implementer follows it.

| IPC channel | Behavior in sandbox | Capability gate | Notes |
|---|---|---|---|
| `team.workspace.readFile` | allow if path-OK | `canReadFiles` | Use `withOpenInsideWorkspace(..., 'read', body)`. Body MUST read via the returned `FileHandle`, never re-open by string. |
| `team.workspace.writeFile` | allow if path-OK + parent exists | `canWriteFiles` | Use `withOpenInsideWorkspace(..., 'write', body)`. Parent-must-exist enforced inside the wrapper. |
| `team.workspace.mkdir` | allow if path-OK | `canWriteFiles` | Non-recursive; one component per call. Use `withOpenInsideWorkspace(..., 'mkdir', body)`. |
| Any FS path matching `.env` / `.ssh` exact segment (NFKC + case-insensitive) | always deny | n/a | Throws `TeamSandboxedError` before any FS syscall. |
| Any FS path matching `node_modules/.cache/*` or `node_modules/.bin/*` (NFKC + case-insensitive) | always deny | n/a | TRIAGE round-5 Gemini HIGH: blocks fake CLI plant + downstream shell-exec escape. |
| Any FS path traversing a symlink at an ancestor | always deny | n/a | `lstat`-walk rejects before `fs.open` is attempted. |
| Any FS path whose final component is a symlink | always deny | n/a | `O_NOFOLLOW` causes the open to fail with `ELOOP`; the wrapper rethrows as `TeamSandboxedError`. |
| ACP `READ_TEXT_FILE` (imported team agent) | allow if path-OK | `canReadFiles` | W4 audit CRIT-1 (2026-05-19): routed through `gateAcpFileOp` → `withOpenInsideWorkspace`. Non-imported teams + non-team conversations remain on the legacy direct-fs path. |
| ACP `WRITE_TEXT_FILE` (imported team agent) | allow if path-OK | `canWriteFiles` | W4 audit CRIT-1 (2026-05-19): same gate as `READ_TEXT_FILE` plus parent-must-exist. |

---

## Network enumeration

| Surface | Behavior in sandbox | Capability gate | Notes |
|---|---|---|---|
| `fetch` / `https.request` from team agent | **ALWAYS DENIED in v1** | `canNetworkRequest` | W4 audit HIGH-1 (2026-05-19) fix: the review UI does NOT expose a grant row for this capability; `acceptTeamImport` forces `by_user: false` regardless of input. Agent-process network enforcement is v2 work. |

---

## Cross-references

- W4a `TeamExportSchema` (`src/process/team/importExport/TeamExportSchema.ts`)
  defines the five capability flags this matrix references.
- W4a `TeamSandboxedError` (`src/process/team/importExport/errors.ts`) is
  the uniform error type thrown by every `deny` cell above.
- `capabilityCheck.ts` in this directory provides the `isCapGranted` /
  `assertCapGranted` helpers consumed by enforcement points.
- `workspaceFs.ts` in this directory provides the path-validation +
  `O_NOFOLLOW` + denylist + fd-discipline primitives.
- W4c will add prompt-injection wrapping for inbound messages from
  sandboxed teams plus DOMPurify sanitization for task title / description
  at render time (TRIAGE round-3 HIGH XSS/SSRF fix).
