# Managed workspace ownership contract

Date: 2026-07-16  
Status: source-of-truth contract; no cleanup authority

## Purpose

Wayland may create temporary workspaces for chats, agents, scheduled runs, and
other execution. Those directories can contain user files, reports, generated
documents, code, task outputs, or receipts. A chat/database record and the
workspace it once used are separate authorities: deleting one must never imply
deleting the other.

The retention system answers only whether a generated workspace is safe to
preserve or eligible for a later human review. It does not delete anything.

## Current authoritative sources

| Source                           | Current producer                                    | Preservation strength                      | Current completeness                                                 |
| -------------------------------- | --------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| Conversations                    | Desktop SQLite `conversation.extra.workspace`       | Positive reference preserves               | Complete only when repository read and path canonicalization succeed |
| Projects                         | Desktop SQLite `projects.workspace`                 | Positive reference preserves permanently   | Complete only when repository read and path canonicalization succeed |
| Schedules                        | Desktop SQLite cron jobs plus conversation fallback | Any enabled or disabled schedule preserves | Complete only when every job resolves a workspace                    |
| Active work                      | `IWorkerTaskManager` process workspace              | Any live process preserves                 | Complete only when every task resolves a workspace                   |
| Files and reports                | Canonical workspace directory contents              | Any entry preserves                        | Preservation-only; no app-scaffolding exclusion exists               |
| Output registry                  | None                                                | Cannot prove zero                          | Unavailable                                                          |
| Workspace-bound receipt registry | None                                                | Cannot prove zero                          | Unavailable                                                          |

Recovery inventory already records the existing split: conversation evidence is
in SQLite, connector receipts are runtime/conversation state, and user-created
artifacts remain in referenced workspaces. There is no current global output
store that can truthfully answer “this is every output rooted in this
workspace.” The retention projection therefore reports output and receipt
authority as unavailable and preserves every production workspace.

## Required durable record

A future output/receipt ledger record must contain:

- immutable record ID and contract version;
- kind: `output` or `receipt`;
- producer identity and producer-native ID;
- canonical workspace identity captured by the trusted main process;
- workspace-relative path when the object is a file;
- owning conversation, Project, run/workflow/team, and schedule IDs when known;
- creation time and lifecycle state (`present`, `superseded`, `moved`, or
  `missing`);
- validation/evidence level and digest where one exists; and
- an append-only correction/tombstone reference rather than destructive record
  removal.

Model prose, tool output, candidate metadata, and a caller-supplied path cannot
mint a record. The trusted Desktop process records ownership only after it
observes the output/receipt on the accepted producer boundary.

## Snapshot and completeness contract

Zero is meaningful only when all authorities describe one stable observation:

1. capture a Desktop database/ledger generation;
2. enumerate conversations, Projects, schedules, outputs, and receipts;
3. capture live process workspaces;
4. canonicalize the work root and every referenced workspace;
5. scan direct generated candidates without following candidate symlinks;
6. confirm the database/ledger generation did not change; and
7. publish the dry-run report with its generation and timestamp.

Any read failure, truncation, missing workspace, generation change, unsafe path,
unknown producer, or unsupported record version makes the relevant authority
incomplete. Positive evidence may still explain why a workspace is protected;
absence cannot make it reviewable.

## Lifecycle boundary

`quarantine-eligible` is not a delete command. A future mutation lane requires:

1. a visible dry run and per-workspace reasons;
2. explicit human selection;
3. last-moment path, inode/file-identity, authority-generation, active-process,
   and content revalidation;
4. atomic move into app-owned recoverable quarantine;
5. an immutable quarantine receipt;
6. visible restore and keep-forever controls; and
7. a separate deliberate permanent-delete action after the published restore
   window.

Deleting a chat, Project, schedule, output index record, or receipt index record
never invokes this lifecycle implicitly.

Chat deletion also must not cascade into schedule deletion. Desktop blocks chat
deletion while any scheduled task still owns that chat, and fails closed when
schedule authority is unavailable. The user must explicitly remove or move the
scheduled task in Automations before deleting the chat history. Workspace files
remain untouched in either path.

Workspace migration likewise never treats “do not migrate” as permission to
delete schedules. Schedule authority is read before the destination chat is
created; schedules must move with the chat, and partial schedule updates are
compensated back to the source on failure. The source chat is deleted only after
message-count integrity and schedule migration both succeed.

Team deletion follows the same boundary across every agent conversation. Before
any process, session, chat, task board, mailbox, or team record is changed,
Desktop inventories all schedules for all team chats. User-created schedules
block deletion and schedule-authority failure fails closed. Only schedules with
the explicit agent-owned `configOptions.kind=ritual` tag belong to the Team
lifecycle; after attempting to uninstall them, Desktop re-reads every team chat
and refuses deletion if any schedule remains. Conversation deletion failure
preserves the team/task/mailbox record for repair. The typed confirmation names
the destructive team-owned records and states that workspace files, reports,
and user-created schedules remain. Team deletion never invokes workspace
cleanup or quarantine.

Archiving a scheduled task stops future execution without permanently deleting
the schedule definition or its skill directory. Desktop publishes a confined,
hash-bound archive record and byte-verifies a complete copy of the skill tree
before the database row may be removed. The original skill directory is moved
into that archive rather than recursively erased. Publication, path, symlink,
hash, or database failure keeps the live schedule and restarts its timer when
it was enabled. Automatic orphan cleanup uses the same archive boundary.

Archived schedules are visible in Automations and can be restored in-app. A
restored schedule always returns paused, with its complete skill tree, so the
user explicitly chooses when it runs again. Restore collision or tampering
fails closed; failed database insertion preserves the restored bytes inside the
archive. Remote paired clients may list or archive schedules but cannot restore
local executable schedule/skill state.

Archiving a schedule also does not delete completed run conversations.
New-conversation run chats are detached from the live schedule grouping,
retain their workspace and other metadata, and receive an
`archivedCronOrigin` provenance record. Their reports, files, messages, and
workspace remain independently available until the user deliberately acts on
those objects.

The visible Workspace file browser does not permanently unlink files or
directories. Its removal action moves the confined entry to the operating
system's recoverable Trash and tells the user it can be restored there. If the
runtime cannot provide recoverable Trash, the action fails closed and performs
no unlink/rm fallback. A future cloud-hosted mutation requires its own visible,
receipt-backed quarantine and restore journey before it may expose equivalent
functionality.

Project reference removal is likewise an archive operation, not unlink. The
trusted process moves a regular, non-symlink reference into a project-local
`.wayland/reference/.archive` entry whose metadata is written before the atomic
same-filesystem rename. The Project reference panel lists complete archive
entries and exposes collision-safe restore. Incomplete, malformed, symlinked,
or unknown entries remain untouched and hidden; they cannot become cleanup
authority. This project-local lifecycle is shared by Desktop and hosted/cloud
runtimes rather than depending on a desktop-only OS Trash.

Legacy file import may overwrite only its explicitly non-authoritative file
scope. Before either Desktop IPC or hosted WebUI applies an import, it must
atomically publish a matching legacy-file export under the durable
`recovery/legacy-file-imports` root. Import cannot begin if that safety export
fails. The UI must disclose the exact recovery path after success. This does
not claim database, Core, schedule, Project, provider, or external-workspace
coverage.

“Reset everything” has no deletion authority while a complete recovery point
cannot be captured and verified. A manifest or legacy file export is
insufficient. Both the renderer control and process provider fail closed until
the authoritative recovery path covers Desktop SQLite, credentials, Core
profiles, and external-state references; stale renderer invocation cannot
reach the retired unlink/rm implementation.

Stopping an active workflow is also not deletion authority. The sidebar action
transitions the workflow session to `ended`, removes it from the in-flight
strip, and preserves the workflow plan/progress row, parent chat, outputs, and
workspace files. The legacy `workflow.delete-session` endpoint is retained only
as a compatibility alias to the same non-destructive end transition so an older
renderer cannot hard-delete the audit row.

Removing a user-installed skill is a recoverable local operation. The trusted
process moves its confined directory to operating-system Trash and has no
unlink/rm fallback. Current Desktop does not delete custom assistants: the
visible action archives one by setting its existing configuration disabled,
keeps all rules/skills in place, and leaves the assistant in the Disabled
section where the ordinary enable toggle restores it. Compatibility endpoints
for an older renderer accept only a validated single-segment assistant ID,
match the exact filename family, and move confined resources to Trash. They
never construct a regular expression from renderer input; if any move fails,
the caller cannot remove the configuration record. Hosted removal remains
denied until a receipt-backed quarantine is designed.

Preview version history is user-visible work, even though its bytes live below
the cache root. It is not subject to an implicit version cap: every indexed
version remains available until a future visible quarantine/restore policy is
authorized. Index publication is atomic. A corrupt, identity-mismatched, or
path-escaping index fails closed and is not reinterpreted as empty history; a
file blocking the history directory is likewise left untouched.

Workspace snapshot Git directories are transient comparison baselines, not
user outputs. Current-session disposal may remove the exact in-memory gitdir.
Crash-recovery cleanup may remove only a non-symlink directory carrying the
exact Wayland snapshot ownership marker; a matching name prefix alone is not
cleanup authority. Unmarked and malformed legacy/lookalike directories remain.
The user-facing “revert” path is separate: newly created or currently modified
bytes move to operating-system Trash before a baseline is restored. Trash
failure preserves the workspace entry, and lexical traversal or a symlinked
ancestor outside the real workspace fails closed.

The memory drop folder is an inbox, not a shredder. After the converted memory
copy is durably written, Wayland creates an exclusive hard-link archive of the
exact source bytes under the drop folder's `.processed/` directory and only
then removes the top-level inbox name. If either publication or source-name
removal fails, the operation fails without losing the original bytes. The
watcher remains depth-zero, so archived sources are not re-ingested, and the UI
discloses where originals are kept.

Extension lifecycle hooks do not themselves delete extension directories. The
only direct extension-directory removal found in the active bridge is
transactional rollback of a newly created builder target after that same build
fails; it is not authority over a pre-existing extension or user workspace.

Memory curation is an archive operation, not permanent deletion. Before an
entry is removed from its active Markdown source, Desktop atomically publishes
the complete original block plus identity, source-relative path, timestamp,
and SHA-256 under that memory root's `.archive/deleted-entries/`. The original
source file remains even when the archived block was its final entry. The
Memory UI exposes Archived and can restore the block to its original file;
tampered records, path escape, duplicate summaries, and ambiguous IDs fail
closed. All memory edit/archive/restore operations serialize through one
mutation lock so concurrent read-transform-write cycles cannot erase each
other. Remote paired clients may read the archive but cannot invoke local
edit/archive/restore mutations. Wiki promotion remains copy-only: undo removes
the generated promoted wiki copy and index metadata while the source memory
entry remains active. No separate memory compaction or retention-pruning path
exists in the audited service tree.

## Implementation order

1. Keep the current preservation-only filesystem projection and local Storage
   UI.
2. Define a shared output/receipt event contract from the universal work kernel;
   do not create a retention-only shadow store.
3. Persist trusted output/receipt ownership with append-only corrections.
4. Add generation-bound snapshot reads and replay/adversarial proof.
5. Only then permit a dry run to report a review candidate.
6. Design and separately authorize quarantine/restore. Permanent deletion is a
   later, separately threat-modeled capability.
