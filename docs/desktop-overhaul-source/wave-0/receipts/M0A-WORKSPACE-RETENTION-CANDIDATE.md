# M0A managed-workspace retention candidate receipt

Date: 2026-07-16  
Scope: fail-closed retention classification, production authority inventory, and local dry-run UI  
Status: read-only inventory foundation; artifact/receipt ledgers, quarantine, recovery, and deletion authority remain open

## Contract implemented

`src/process/services/workspaceRetention.ts` classifies generated workspace
evidence without performing any filesystem or database mutation. The canonical
collector scans only direct app-generated `*-temp-<unix-ms>` children under one
captured canonical Desktop work root, canonicalizes every candidate and
authority reference, supports Wayland's trusted CLI-safe root alias, refuses
candidate symlinks/escapes, and preserves:

- any workspace referenced by a conversation or Project;
- any workspace retained by a schedule;
- any workspace containing a registered artifact, output, report, or receipt;
- any workspace with user content or post-creation mutation;
- any workspace explicitly promoted or selected by the user; and
- every workspace with foreign, malformed, incomplete, contradictory, or
  unknown evidence.

The production projection joins conversations, Projects, schedules, and active
worker processes. Desktop has no complete artifact or receipt workspace ledger
yet, so those authorities are truthfully `unavailable`; consequently the live
projection cannot produce a cleanup candidate. Positive references still show
why a workspace is protected, while any zero remains unknown.

Only a Wayland-managed, completely inventoried, unreferenced, unscheduled,
artifact-free, unmodified, user-content-free, non-promoted shell beyond the
declared retention window can become `quarantine-eligible`. That result is not
delete authority: later work must still provide a visible dry run, recoverable
quarantine, review/restore UI, and immutable receipt.

Storage now shows a trusted-local read-only summary of found, protected, and
reviewable workspaces, the authority inventories blocking cleanup, and the
protection reason for each generated workspace. The paired WebUI cannot invoke
the local-path projection. A user may reveal a protected workspace in the OS
file manager for inspection. There is no delete, quarantine, rename, or cleanup
provider or button in this slice.

The future ownership/snapshot/lifecycle boundary is normative in
`../WORKSPACE-OWNERSHIP-CONTRACT.md`. It reuses the universal work kernel's
future output/receipt events rather than creating a retention-only shadow store.

## Current proof

| Command | Result |
|---|---|
| focused retention/lifecycle/bridge/UI Vitest matrix | PASS — 10 files, 109 tests |
| targeted Oxlint over the bounded retention/deletion modules and tests | PASS — 0 warnings, 0 errors |
| `bun run typecheck` | PASS |
| `git diff --check` over the bounded implementation/planning files | PASS |

The retention adversarial matrix covers every preservation reason, missing
counts, unknown user/content/mutation/age state, incomplete inventory,
unproven provenance, invalid/negative/fractional evidence, an unelapsed
retention window, canonical aliases, unsafe symlinks, root escapes, ignored
ordinary folders, producer failures, orphan schedules/processes, hosted access
denial, visible fail-closed errors, and the absence of destructive UI.

## Open before any cleanup behavior

- Canonical artifact and receipt ledgers must make those two authority sources
  complete before any live candidate can leave `preserve`.
- The current content scan treats every directory entry as user-significant.
  Any future scaffolding exclusion needs a versioned app-created baseline and
  must retain the same symlink/boundary rules.
- Users still need explicit keep-forever promotion plus a separate reviewed,
  recoverable quarantine/restore journey.
- Quarantine must be recoverable and receipt-backed; permanent deletion needs a
  separate deliberate user action and retention policy.
- Conversation deletion remains database-only and must not silently trigger
  workspace mutation.

The conversation deletion bridge now also refuses to delete a chat while any
scheduled task references it, and refuses deletion when schedule authority
cannot be read. The former best-effort schedule cascade is removed. This keeps
files, reports, and schedules as separately deliberate user objects.

Workspace migration now preflights schedule authority before creating its
destination, requires every schedule to move with the chat, never removes a
schedule, compensates already-moved jobs if a later update fails, and preserves
the source conversation until schedule and message-history integrity both pass.

Team deletion now preflights schedule authority for every owned agent chat
before any mutation. User-created or unclassified schedules block deletion;
only explicitly tagged team rituals may be lifecycle-removed, and every chat is
re-inspected afterward so swallowed removal failures and concurrent jobs fail
closed. A failed conversation deletion preserves the team, task-board, and
mailbox records. Backend refusal is surfaced to the renderer rather than being
reported as success. The typed confirmation discloses the team-owned records
that are destroyed and states that workspace files, reports, and user-created
schedules remain.

Additional exact-current Team-retention proof passes 6 files / 67 tests,
bounded Oxlint passes 5 files with zero warnings/errors, TypeScript passes, and
`git diff --check` passes.

The visible Workspace browser now moves files and directories to recoverable OS
Trash. It has no permanent-unlink fallback: a runtime without Trash support
refuses the action and removes nothing. The confirmation and result copy state
that boundary. Deleting a scheduled task now stops future runs while preserving
every completed run conversation, workspace path, report/file reference, and
other conversation metadata; the live schedule grouping is detached and an
`archivedCronOrigin` provenance record is retained.

Additional exact-current recoverability proof passes 7 files / 88 tests,
TypeScript and `git diff --check` pass. The bounded new retention modules pass
Oxlint with zero warnings/errors; legacy workspace-operation files retain
pre-existing warnings and are not represented as warning-clean.

Project reference removal now archives the Wayland-managed copy inside the
Project workspace and exposes visible collision-safe restore in the reference
panel. Metadata precedes the atomic rename; traversal, symlinks, malformed
archive entries, and incomplete entries fail closed without unlinking user
bytes. Focused Project/reference proof passes 4 files / 49 tests and current
TypeScript passes.

Desktop and hosted legacy-file restore now share one persistent, atomic
pre-restore safety export under `recovery/legacy-file-imports`; import does not
begin if the recovery artifact cannot be published. The successful UI journey
reports its exact path, and Desktop restore failures are no longer swallowed.
The artifact remains truthfully file-only and non-authoritative. “Reset
everything” is disabled in the renderer and refused in the process until the
authoritative recovery-point gate can cover and verify SQLite, credentials,
Core profiles, and external references. Focused storage/reference/reset proof
passes 6 files / 37 tests; TypeScript passes; bounded new modules have zero lint
warnings/errors while disclosed legacy warnings remain outside the claim.

The in-flight workflow sidebar now says “Stop workflow” and retains the session
row in `ended` state instead of hard-deleting the plan/progress audit trail.
Parent chat, outputs, and files remain separate and untouched. The legacy delete
provider is a compatibility alias to the same end transition. The combined
exact-current retention/storage/workflow matrix passes 9 files / 132 tests;
TypeScript and diff hygiene pass.

User-installed skill removal and custom-assistant resource removal now move
their confined local resources to operating-system Trash with no permanent
unlink/rm fallback. Assistant IDs are validated as single path segments and
matched by exact filename prefix rather than interpolated regular expressions,
preventing a malformed ID from selecting unrelated assistants. A partial Trash
failure prevents removal of the assistant configuration record. Focused skill
proof passes 1 file / 27 tests; the combined exact-current recoverability matrix
passes 10 files / 137 tests; TypeScript and `git diff --check` pass. Existing
warnings in the legacy skill test harness and assistant editor remain disclosed
and are not represented as warning-clean.

The current assistant UI no longer calls those compatibility removal endpoints.
Its “Archive” action keeps the complete configuration and resource files,
sets the assistant disabled, and leaves the existing Disabled-section toggle as
the restore journey. It also corrects the prior config-family bug by handling
both preset and custom-agent stores without filtering either record out.
Focused assistant/archive and compatibility proof passes 3 files / 38 tests;
TypeScript passes. Bounded unchanged editor warnings remain disclosed.

Preview history no longer auto-prunes version 51 and beyond. Its index is
atomically published and corrupt/identity-mismatched/path-escaping state fails
closed rather than being overwritten as an empty history. Workspace snapshot
cleanup is limited to exact marker-owned transient Git baselines; name-prefix
lookalikes and unmarked legacy directories survive. Reverting a new or modified
workspace file preserves its current bytes in OS Trash before removing or
restoring it, fails closed when Trash is unavailable, and rejects traversal
outside the real workspace. The UI names that recovery boundary in the action
tooltip. Exact-current preview/snapshot/renderer proof passes 4 files / 54
tests; bounded Oxlint passes 5 files with zero warnings/errors; TypeScript and
diff hygiene pass.

Drop-folder ingest now retains the exact original source under the inbox's
`.processed/` archive instead of permanently consuming it. Archive publication
precedes removal of the top-level inbox name, the live watcher remains
non-recursive, and user-facing copy identifies the recovery location. The
one-shot processor now handles independent files concurrently while preserving
per-file error reporting. Exact-current import/index/UI proof passes 3 files /
34 tests; bounded Oxlint passes 2 files with zero warnings/errors; TypeScript
and diff hygiene pass. Extension audit found no active uninstall deletion path;
the builder's direct directory removal is limited to rollback of its newly
created target after a failed build.

This receipt is not M0A acceptance and authorizes no cleanup job.
