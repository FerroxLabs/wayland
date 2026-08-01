# Constitution recovery acceptance

Status: **Stage B source implementation and local aggregate tests are green;
aggregate Stage C remains HOLD. Wave 0 scope is local, non-destructive recovery.
Native restore belongs to Stage A v2 and is not blocked on aggregate production
acceptance.**

This packet owns the archive inventory DTO, authenticated routes/IPC, renderer
recovery UI, Classic promotion/rescue/discard decisions, partial/conflict
visibility, and aggregate restore journey. Wave 0 preserves authenticated,
encrypted rescue locally with no automatic garbage collection. Portable rescue
export/import and rescue deletion are unavailable: their routes, IPC channels,
DTO actions, and UI controls are not registered. They move to the separately
audited Recovery/Transfer program tracked by issue #903. Native restore,
projection verification, canonical delta parsing, promotion journaling,
authenticated replay lookup, partial reconciliation, rescue sealing, and
service primitives are prerequisites inside Stage A of
`NATIVE-CONSTITUTION-V2-ACCEPTANCE.md`; implementing those primitives does not
require this Stage B UI packet to be complete. Stage B may begin after the Stage
A helper/service contract is locally sealed, but neither stage may be integrated
into root or called accepted until the aggregate Stage C audit passes.
This is not a release receipt and cannot bypass the production Constitution
service.

Integration owner: Desktop lane `area:desktop-ui`, coordination issue
`FerroxLabs/wayland#886`. Native-helper surface owner:
`native/constitution-fs/src/main.rs` plus Rust tests. Desktop authority owner:
`src/process/services/constitution/` plus TS tests. Route/IPC/renderer owner:
Desktop Constitution recovery composition. Candidate: unsealed. Required
receipt: `wave-0/receipts/CONSTITUTION-RECOVERY.json`.
The receipt is content-addressed and binds exact Stage A/B commits, every
projection/delta/journal/rescue schema digest, historical corpus and harness
provenance, signed Classic and target package identity, real journey artifacts,
commands, limitations, and the exact-HEAD independent audit. A branch-relative
or mutable evidence link is not acceptance.

## Current implementation truth

Verified against the unsealed candidate worktree on 2026-07-17:

- Integration-order steps 1 through 6 are represented in source: shared DTOs,
  archive inventory/restore authority, Classic recovery authority and runtime,
  sealed restart-safe locator discovery, hosted routes, typed Electron IPC and
  preload, renderer services, `ConstitutionRecovery.tsx`,
  `ConstitutionClassicRecovery.tsx`, visible Settings composition, and the
  enumerated negative-surface gate.
- Classic promotion persists exact per-item identities and authenticated
  progress, seals rescue before mutation, supports no-change, create, replace,
  delete, response-loss replay, partial resume, conflict, pre-dispatch discard,
  and keep-v2 indefinite local preservation. Renderer retries reuse the
  persisted identity and do not retain destructive passwords.
- The restart-safe locator is outside live and Classic roots, derives from the
  canonical live installation identity, uses the shared external recovery
  authority and tuple registry, and is recovered on later v2 startup without a
  caller-supplied path.
- Electron initializes archive and Classic recovery against explicit user-data
  authority. Standalone Web/Cloud initializes the same native archive authority
  before prompt/route use and explicitly reports signed-Classic recovery
  unavailable rather than falling back to implicit state. The Docker source now
  builds and digest-binds the Linux helper before server bundling and copies its
  exact resource set into the runtime image; an actual built-image journey is
  still Stage C package evidence, not implied by this source claim.
- Focused DTO/service/IPC/HTTP/renderer/negative-surface suites and typecheck
  are green. The pre-Cycle-38 aggregate run passed 13,959 Vitest tests and 224
  Bun-native tests with zero failures after the manifest-finalizer and
  standalone Docker corrections; it predates the new recovery consumer-journey
  file and is not exact-current aggregate evidence. That file has separate
  focused proof, and the complete aggregate must be rerun against the eventual
  immutable Stage A/B candidate. Scoped lint and formatting are
  warning-free, `bun run build:server` passes with only the two recorded pre-
  existing direct-eval warnings, the Electron renderer build and i18n
  type/validation gates pass, and `git diff --check` passes. The i18n validator
  retains existing repository-wide translation-debt warnings; it reports the
  generated key type in sync and exits successfully.

This is implementation evidence, not the Stage B/Stage C receipt. The worktree
is not an immutable accepted commit; the required recovery receipt is absent;
the real signed/notarized v0.11.8 downgrade/re-upgrade journey matrix and target
package evidence have not been captured; and the independent exact-HEAD audit
has not yet returned zero unresolved HIGH/BLOCKER findings. Integration-order
steps 7 and 8 therefore remain incomplete, and step 9 is forbidden.

The existing Stage B source is provisional because it was written before Stage
A had an immutable local seal. Acceptance still requires an exact Stage A
commit followed by an exact Stage B commit based on that identity, with all
Stage B proof rerun against it. The current combined dirty worktree is not
allowed to collapse or bypass that evidence order.

## Invariants

- Archive inventory is authenticated, rate limited, metadata-only, and
  non-creating. Listing may not create the Constitution root, archive store,
  key material, defaults, or migration state.
- A row contains exactly `archiveId`, `archivedAt`, `targetKind`,
  `specialistId`, `sourceName`, `bytes`, and `targetRevision`.
  `specialistId` is explicitly null for the Constitution target. It never carries
  Constitution prose, passwords, grants, filesystem paths, or key material.
- `targetRevision` is the opaque backend revision of the authenticated archived
  bytes at their authenticated target under the currently active revision-key
  generation. It is derived only after archive authentication from the exact
  target and content digest; it is not an independently stored archive claim,
  a historical live revision, or mutation authority. Restoring unchanged
  archived bytes produces that revision while the same generation remains
  active. It is a preview binding, not mutation authority. Key rotation may
  remap it on the next authenticated inventory response while retained retired
  generations remain verifiable. Restore binds the preview supplied by the
  client and either authenticates/remaps it to the same target/content under the
  active generation or fails closed. Cold empty inventory still returns before
  revision-key or archive materialization.
- Restore always requires a fresh destructive password. A continuous edit
  grant never authorizes restore and is rejected if supplied as authority.
- Restore accepts only
  `{operationId,archiveId,expectedArchiveRevision,password,expectedRevision}`
  from the client. `expectedArchiveRevision` is the exact preview returned by
  inventory; `expectedRevision` is the live destination CAS revision.
  `operationId` is a renderer/client-owned UUIDv4 persisted with the pending
  destructive action before dispatch. HTTP and IPC pass it unchanged to the
  Stage A native `requestId`; neither transport nor the service may mint a new
  identity after dispatch uncertainty.
  The server derives and authenticates the archive target and content; the
  client may not select a target or submit replacement prose. Before native
  dispatch, the process authority globally reserves the operation UUID and
  durably records the authenticated principal, exact client facts,
  server-derived target/content digest, separate canonical process/native
  fingerprints, and unchanged native request ID. Passwords and prose are never
  recorded.
- Every restore first authenticates the hosted principal or validates the IPC
  sender, then performs global operation lookup and verifies its bound principal
  without revealing mismatches. A matching durable
  operation record performs native committed-receipt lookup with its stored
  fingerprint before inventory, current-target reads, password-authorized
  redispatch, or archive mutation. Native `committed` returns the same
  authenticated receipt even after source retirement. If no commit exists and
  native lookup is `not_found`, dispatch/re-dispatch with the same ID requires a
  fresh password. Native `rolled_back` permanently terminates that operation;
  it may not be redispatched and the client must persist a new UUID for a new
  attempt. Pending, corrupt, or inconsistent lookup fails closed. Reuse with a
  changed archive ID, archive preview, or live revision is conflict. A UUID is
  correlation only and never authorizes lookup or replay.
- The service compares `expectedRevision` against the live target, archives
  any displaced live target, commits the authenticated source archive through
  the native authority, and retires the source archive only after the commit
  receipt is durable.
- Success is receipt-only:
  `{success:true,data:{status:'committed',operationId,revision,receiptId}}` with
  the exact UUIDv4 request identity and opaque, non-empty `revision` and
  `receiptId`. Exact response-loss replay is byte-equivalent.
- Archive failure is exactly
  `{success:false,error:{code,message,retryable,operationId}}`; `operationId` is
  a syntactically valid exact-key parsed UUIDv4 or null when it was
  missing/malformed; echoing it makes no existence or authority claim. GET
  failures always carry null. It uses the exact archive error taxonomy and
  HTTP/IPC mappings below and never leaks archived content or raw native facts.
- Conflict is stable HTTP 409 and changes nothing: the live target is
  unchanged, the source archive remains active, the editor draft is preserved,
  and the password is cleared.
- Authentication, authorization, parsing, integrity, unsafe-filesystem, and
  native failures remain distinct errors. No error reflects archived prose or
  raw native output.
- Electron IPC and hosted HTTP share the same DTOs and service operation. IPC
  cannot mint revisions or receipts, convert errors to absence, or fall back to
  direct filesystem mutation.
- Changed Classic projection state is never silently restored over v2 or
  abandoned. The UI offers exactly promote, keep-v2 while retaining encrypted
  local rescue, or object-specific confirmed discard before the first promotion
  CAS. Once an item commits, discard cannot undo or conceal it; the UI offers
  resume-pending or keep-current-v2 while retaining rescue, and any later
  restoration is a separate destructive CAS workflow. It displays every
  promotion item and its pending/committed/conflicted terminal evidence from the
  authenticated journal.
- Rescue contents remain authenticated, encrypted, metadata-only, and retained
  locally. Wave 0 exposes no export, import, delete, purge, prune, or automatic
  garbage-collection path for rescue. Unknown or stale clients cannot reach
  such a route because those routes and IPC channels are absent, not soft
  enabled behind a renderer flag.

## Restart-safe Classic discovery authority

Stage B never accepts a caller-supplied filesystem path and never relies on the
process that prepared or launched Classic remaining alive. Production Classic
preparation publishes one authenticated internal locator event before the
Classic child is spawned. A later v2 Desktop derives the locator registry from
the canonical live `userData` identity, authenticates its complete history, and
discovers the projection authority without searching arbitrary user paths.

- The registry is outside both live `userData` and every Classic tree. Its root
  is exactly `<canonical-userData-parent>/.wayland-classic-recovery/v1/<binding>`,
  where `<binding>` is lowercase SHA-256 over canonical JSON containing the
  canonical live root plus its directory device and inode. Parent segments,
  registry segments, event directories, record directories, and files reject
  symlinks and identity changes. Classic preparation therefore preserves
  `liveStateTouched:false`; it does not write a locator, key, database row, or
  migration marker into the live v2 tree.
- Projection records live only at
  `records/<preparationId>/projection-authority.sealed`; promotion journals and
  rescue remain below that same preparation root. The DTO, renderer, hosted
  responses, logs, errors, receipts exposed to the renderer, and CLI success
  output never contain this path or the registry root.
- Locator history is an append-only, OS-vault/external-recovery-key sealed
  event chain at `locator/events/<six-digit-sequence>.sealed`. Each exact
  plaintext is contract
  `wayland-constitution-classic-recovery-locator-event/1.0` and contains only
  `{contract,sequence,previousEventSha256,eventId,kind,
installationBindingSha256,preparationId,projectionAuthoritySha256,
terminalState,operationReceiptId,createdAt}`. Unknown fields, noncanonical
  timestamps/UUIDs/digests, gaps, duplicate sequences, forks, changed
  installation binding, unsafe preparation IDs, and field/state mismatches fail
  closed.
- `kind` is exactly `activated` or `terminal`. `activated` has null terminal
  fields and may extend the chain only when no earlier preparation remains
  active. `terminal` must bind the current active preparation and projection
  digest; its state is exactly `no-change`, `committed`, `rescued`, or
  `discarded`, and its operation receipt is non-null except for authenticated
  `no-change`. Terminal publication never removes or rewrites projection,
  journal, rescue, locator, or retired recovery-key evidence. A later Classic
  preparation may start only after the preceding activation is terminal.
- Event publication is durable no-clobber: write and fsync an owner-only
  temporary file, link/create the deterministic next sequence exclusively,
  fsync the event directory, then remove the temporary. Competing writers
  reload the authenticated chain; exact `eventId` replay returns the existing
  event and every conflicting successor fails. There is no mutable head file
  whose rollback could select an older preparation.
- Locator envelopes use the same exact external-recovery authority and retained
  active/retired keys as projection, journal, and rescue records. Before any
  new envelope is sealed or any active projection is exposed, one shared tuple
  registry authenticates every sealed locator and every sealed record under
  all retained preparation roots. Duplicate key/salt/nonce tuples quarantine
  every implicated record and fail closed.
- Preparation order is projection authority publication, Classic-root atomic
  rename, locator activation publication, then Classic spawn. A crash before
  activation cannot expose user-created Classic changes because Classic has
  not launched. A crash after activation is restart-discoverable. A response
  loss after a terminal Constitution mutation replays through the durable
  operation authority and publishes/replays the exact terminal locator event;
  it never performs the Constitution mutation twice.
- Startup with no locator registry is ordinary absence and creates nothing.
  A present malformed/tampered registry, unreadable required retired key,
  missing active projection, projection digest mismatch, multiple active
  preparations, or Classic-root identity mismatch is an integrity/key failure,
  never absence and never a path prompt. Metadata is not registered as ready
  until this proof succeeds.

## Contract surface

- Shared DTO: `src/common/types/constitutionRecovery.ts`.
- Hosted inventory: `GET /api/constitution/archives`.
- Hosted restore: `POST /api/constitution/archives/restore`.
- Desktop IPC mirrors the same metadata inventory and restore request/result.
- Renderer recovery UI is isolated in `ConstitutionRecovery.tsx` and consumes
  only the shared client contract.

Archive recovery uses shared contract
`wayland-constitution-archive-recovery-dto/1.0`. All objects reject unknown
keys. Hosted inventory and IPC `constitution:archives:list` return exactly
`{success:true,data:{contract,archives}}`. `archives` contains at most 4096
exact rows
`{archiveId,archivedAt,targetKind,specialistId,sourceName,bytes,targetRevision}`:

- `archiveId` is UUIDv4; `archivedAt` is canonical RFC 3339 UTC with exactly
  millisecond precision; `targetKind` is `constitution` or `specialist`;
  `specialistId` is null exactly for `constitution` and otherwise a bounded NFC
  native object ID; `sourceName` is a server-derived NFC display name of 1..255
  Unicode scalar values; `bytes` is an integer from 0 through 262144; and
  `targetRevision` is an opaque NFC string of 1..4096 Unicode scalar values.
- Rows are ordered by `archivedAt` descending and then `archiveId` ascending by
  Unicode code-unit order. Duplicate IDs, invalid rows, bound overflow, and
  noncanonical ordering fail closed; the service never silently truncates,
  sorts, repairs, or drops authority data.
- Restore is hosted at the route above and IPC
  `constitution:archives:restore`; both accept exactly
  `{operationId,archiveId,expectedArchiveRevision,password,expectedRevision}`
  and return the success/failure envelopes in this packet. The HTTP and IPC
  adapters call the same process-authority operation and may not reinterpret a
  native result.
- `expectedArchiveRevision` binds the authenticated inventory preview. Restore
  accepts it when it verifies under the active generation or a retained retired
  generation and maps to the exact same authenticated target/content. A valid
  retained-generation preview is remapped in the receipt to the active
  generation; otherwise restore fails `STALE_ARCHIVE_REVISION` before live
  reads or mutation. Thus unchanged restore returns the listed revision only
  when no rotation intervened, and returns its authenticated active-generation
  remap after a valid rotation.

Before first native dispatch, the process authority durably writes an
authenticated, globally UUID-keyed operation record under literal contract
`wayland-constitution-archive-restore-operation/1.0` with exactly the authoritative
facts `{contract,operationId,principalBinding,archiveId,
expectedArchiveRevision,expectedRevision,target,contentSha256,
processRequestFingerprint,nativeRequestFingerprint,nativeRequestId,createdAt,
state}`. `principalBinding` is exactly
`{kind:'hosted-user',subjectSha256}` or
`{kind:'desktop-installation',installationId}`. `subjectSha256` is canonical
lowercase `sha256:<64 hex>` derived from the stable authenticated account
subject plus deployment namespace, never a raw user identifier.
`installationId` is the OS-vault-backed stable UUIDv4 for this Desktop
installation, not an ephemeral sender/window/webContents ID; every access still
requires current main-window sender validation. The binding is never supplied
by the renderer. `createdAt` is canonical RFC 3339 UTC with exactly millisecond
precision. Both fingerprints and `contentSha256` are canonical lowercase
`sha256:<64 hex>`. `target` uses the exact Stage A native target union and all
other IDs/revisions use the bounds above. `target` and `contentSha256` are derived
only after archive authentication. `processRequestFingerprint` binds contract,
principal binding, archive ID, expected archive preview, expected live revision,
derived target, and content digest. `nativeRequestFingerprint` is derived
separately and exactly as the Stage A native contract requires from native
schema version, restore intent, derived target, content digest, expected live
revision, and archive ID. Native lookup receives only
`nativeRequestFingerprint`; the process fingerprint and preview are never
misrepresented as the native fingerprint. `nativeRequestId` equals
`operationId`.

Digest preimages are exact restricted RFC 8785 UTF-8 bytes. `subjectSha256` is
SHA-256 of `{contract:'wayland-hosted-principal-subject/1.0',
deploymentNamespace,subject}`, where both strings are NFC, control-free and
1..1024 Unicode scalar values. `principalBindingSha256` is SHA-256 of
`{contract:'wayland-constitution-principal-binding/1.0',principalBinding}`.
`processRequestFingerprint` is SHA-256 of
`{contract:'wayland-constitution-archive-restore-process-fingerprint/1.0',
principalBindingSha256,archiveId,expectedArchiveRevision,expectedRevision,
target,contentSha256}`. Object keys, target encoding, Unicode rejection, and
digest output use the shared canonical recovery codec; no concatenation,
locale collation, platform JSON serialization, or implicit normalization is
permitted.
The record is authenticated, bounded, exact-key, durable before dispatch, and
contains no password, prose, path, grant, or raw native output. Source
retirement never deletes it. `state` is exactly `prepared`, `dispatched`,
`committed`, `rolled-back`, or `abandoned`; transitions are monotonic
`prepared -> dispatched -> committed|rolled-back` or
`prepared -> abandoned`. The authenticated `dispatched` event and head are
durable and parent-directory-synced under the same operation-authority lock
before invoking Native; Native invocation is impossible while the durable head
is `prepared`. Dispatch holds/owns the serialization claim until the Native call
has been made, so cancellation/compaction cannot interleave between the marker
and invocation. A crash after the marker reconciles `dispatched` through Native
lookup. Terminal records are immutable and retained for at least as long as the
native request/receipt history; neither archive retirement nor session logout
deletes or reassigns UUID ownership.

A never-dispatched `prepared` record may be terminalized as `abandoned` only
under the operation-authority lock after explicit cancellation or 30 days, and
only after proving the authenticated head is still `prepared`; the shared lock
and required marker-before-invocation rule prove no Native call is queued or in
flight. Native `not_found` is additional evidence, never the sole quiescence
claim. Compaction replaces it atomically with an authenticated exact
tombstone under contract
`wayland-constitution-archive-restore-operation-tombstone/1.0`:
`{contract,operationId,principalBindingSha256,processRequestFingerprint,
createdAt,terminalizedAt,outcome}`. Both timestamps are canonical RFC 3339 UTC
milliseconds, both digests are canonical lowercase `sha256:<64 hex>`, and
`outcome` is exactly `abandoned`. Tombstones are never deleted, reassigned, or
treated as absence; they preserve global UUID ownership and changed-fact
detection without retaining archive metadata. Reuse returns
`OPERATION_ABANDONED` and requires a newly persisted client UUID.
The authority contains at most 65,536 total live records plus tombstones per
Desktop installation or hosted deployment namespace. It checks this exact
authenticated inventory under the writer lock before accepting a new UUID; at
the bound it returns `OPERATION_AUTHORITY_FULL`, creates nothing, never evicts or
reassigns an old UUID, and requires explicit administrator recovery/migration.

Restore order is exact: authenticate principal/validate sender; exact-key parse;
load the globally UUID-keyed record; compare its principal and client facts
without exposing mismatch; if present, perform native committed lookup with the
persisted native fingerprint; return the authenticated receipt when committed;
return `ROLLED_BACK` and require a newly persisted UUID when rolled back;
return `OPERATION_ABANDONED` for an abandoned record/tombstone; continue same-ID
dispatch only for definitive `not_found`; only otherwise authenticate the current
source archive, derive/verify preview and target/content, require a fresh
destructive password, persist the operation record if absent, read the live target,
and dispatch. A pending record may resume only when newly authenticated archive
facts equal its stored facts; changed facts conflict. Wrong principals always
receive the same bounded `OPERATION_NOT_FOUND` response with HTTP/IPC 404 and
`retryable:false`, regardless of whether the UUID or archive exists. An exact
committed replay does not repeat the
destructive password challenge, but it still requires current principal/session
or sender authentication. Every first dispatch or non-committed redispatch does
require a fresh password.

Archive error codes are exactly `AUTH_REQUIRED`, `AUTH_FAILED`, `LOCKED_OUT`,
`INVALID_REQUEST`, `OPERATION_NOT_FOUND`, `OPERATION_ABANDONED`,
`OPERATION_AUTHORITY_FULL`, `ROLLED_BACK`, `ARCHIVE_NOT_FOUND`, `ARCHIVE_RETIRED`,
`STALE_ARCHIVE_REVISION`, `STALE_TARGET_REVISION`,
`ARCHIVE_TARGET_MISMATCH`, `CONFLICT`, `INTEGRITY_FAILURE`,
`UNSAFE_FILESYSTEM`, and `NATIVE_FAILURE`. Malformed input is HTTP 400;
authentication/authorization/lockout is 401/403/429; wrong-principal operation,
absent authorized archive, or retired archive is 404/404/410;
`OPERATION_ABANDONED`, `ROLLED_BACK`, stale archive/live revision, target mismatch,
and changed-fact replay are 409; integrity, unsafe-filesystem, and native
failures and `OPERATION_AUTHORITY_FULL` are 500/503 and fail closed. IPC carries the same code and retryability
without inventing transport-specific success. Hosted inventory requires an
authenticated same-origin session and safe-GET origin policy but no password,
operation ID, or mutation-only CSRF token. Hosted restore requires that session,
valid CSRF, rate limit, and fresh destructive password when dispatch is needed.
IPC inventory/restore require a registered preload channel and validated
main-window sender before any record or archive lookup.

`retryable` is exact by code: it is `true` only for `AUTH_REQUIRED`,
`AUTH_FAILED`, and `LOCKED_OUT`, where the same client facts may be resubmitted
after restoring session/fresh password/lockout expiry. It is `false` for every
other archive code. Wrong-principal/abandoned/rolled-back, stale, and conflict
outcomes require refreshed facts
and a newly persisted operation UUID; integrity, filesystem, and native failures
require diagnosis rather than automatic retry.

Classic recovery is a separate versioned section of that same shared DTO. All
JSON objects reject unknown keys and use canonical lowercase
`sha256:<64 hex>` digests, UUIDv4 operation IDs, opaque bounded revisions and
receipt IDs, and bounded NFC object IDs from the native acceptance contract.

- `GET /api/constitution/classic-recovery` and IPC
  `constitution:classic-recovery:get` return metadata only in the exact shared
  envelope `{success:true,data:{contract,recoveryRevision,
projectionReceiptSha256,promotionId,journalHeadSha256,state,items,rescue,
allowedActions,discardChallenge}}`.
- Contract is `wayland-constitution-classic-recovery-dto/1.0`. State is exactly
  `no-change`, `awaiting-decision`, `applying`, `partial`, `committed`,
  `conflicted`, `rescued`, or `discarded`. Items are sorted exact
  `{objectId,operation,state,resultRevision,receiptId,conflictCode}` metadata and
  never contain content, paths, keys, passwords, or raw errors.
- `rescue` is null or exact `{rescueId,sha256,bytes,createdAt}`.
  `rescueId` is the canonical lowercase plaintext-bundle content address;
  `sha256` authenticates the complete externally sealed record; `bytes` is
  1 through 16 MiB; and `createdAt` is canonical RFC 3339 UTC with exactly
  millisecond precision. None is a filesystem locator or mutation authority.
- `allowedActions` is a subset emitted only in canonical order:
  `promote`, `keep-v2`, `discard`, `resume`. No Wave 0 DTO contains
  `export-rescue`, `import-rescue`, `delete-rescue`, portable availability,
  or a deletion challenge.
- The exact state matrix is: `no-change` has no items, rescue, or actions;
  `awaiting-decision` has pending items, no rescue, and
  `promote,keep-v2,discard`; `applying` has current items and the authenticated
  pre-CAS rescue with no action; `partial` has the complete item map and rescue
  with `keep-v2,resume`; `committed` has committed terminal evidence, no
  rescue, and no action; `conflicted` has the complete item map and rescue with
  `keep-v2`; `rescued` has final items and rescue with no action; and
  `discarded` has uncommitted disposition evidence, no rescue, and no action.
- `projectionReceiptSha256` is non-null after projection. `promotionId` and
  `journalHeadSha256` are non-null only after promotion is prepared.
  `discardChallenge` is non-null exactly when discard is allowed. Challenges
  are opaque, revision-bound, rotate after state change, and are never persisted.
- `POST /api/constitution/classic-recovery/decision` and IPC
  `constitution:classic-recovery:decision` accept exactly
  `{operationId,projectionReceiptSha256,expectedRecoveryRevision,password,decision}`.
  Decision is exactly `{kind:"promote"}`, `{kind:"keep-v2"}`, or
  `{kind:"discard",confirmedObjectIds,confirmationText}`. Discard is rejected
  after any committed item. The object list is canonically sorted and exact;
  confirmation text is compared with the server challenge and never persisted.
- `POST /api/constitution/classic-recovery/resume` and IPC
  `constitution:classic-recovery:resume` accept exactly
  `{operationId,promotionId,projectionReceiptSha256,expectedRecoveryRevision,
expectedJournalHeadSha256,password}`. They perform committed lookup before
  current-state reads, advance only the authenticated head, and never replay a
  committed or conflicted item.
- Every Classic mutation requires the authenticated Desktop principal plus a
  fresh destructive password checked by the production Constitution authority.
  Continuous edit grants, renderer claims, projection contents, and possession
  of IDs or digests are never authority. Hosted requests require authenticated
  same-origin session and CSRF; IPC requires a registered preload channel and
  validated main-window sender. Rate limits and lockout match archive restore.
- Success is exactly `{success:true,data:{status,operationId,recoveryRevision,
promotionId,journalHeadSha256,receiptId,items,rescue}}`; status is one of the
  states above, nullable fields follow the matrix, and exact replay is
  byte-equivalent. Failure is exactly
  `{success:false,error:{code,message,retryable,operationId}}` using
  `AUTH_REQUIRED`, `AUTH_FAILED`, `LOCKED_OUT`, `INVALID_REQUEST`,
  `STALE_RECOVERY_REVISION`, `STALE_JOURNAL_HEAD`, `CONFLICT`,
  `OPERATION_NOT_FOUND`, `OPERATION_ID_CONFLICT`, `ROLLED_BACK`,
  `RECOVERY_KEY_UNAVAILABLE`, `OPERATION_AUTHORITY_FULL`,
  `INTEGRITY_FAILURE`, `UNSUPPORTED_CHANGE`, or `NATIVE_FAILURE`.
  Retryable is true only for authentication/lockout remediation. No error leaks
  prose, filesystem paths, key material, raw native output, or password facts.
- Wave 0 deliberately registers no hosted route or IPC channel for rescue
  export, rescue import, or rescue deletion. Renderer controls are absent.
  Local sealed rescue has no automatic GC and is preserved indefinitely until
  the Recovery/Transfer program supplies a separately reviewed, versioned,
  identity-safe protocol. This fail-closed absence is the acceptance behavior,
  not an incomplete implementation hidden behind a feature flag.

## Required transaction proof

- Empty and populated metadata inventory; no prose in success or error bodies.
- Inventory against a cold/absent root proves no filesystem or key creation.
- Correct password restore, wrong password, lockout, missing archive, tampered
  archive, target mismatch, stale revision, native refusal, and response loss.
- Archive metadata proof authenticates the archive first, derives
  `targetRevision` from its exact target/content digest under the active
  revision authority, proves unchanged restore returns it without intervening
  rotation, proves a retained-generation preview remaps only the same
  authenticated target/content after rotation, rejects unavailable/mismatched
  generations, and proves an empty cold inventory creates neither revision nor
  archive authority.
- Successful restore archives displaced bytes before replacement and returns
  the exact durable native receipt.
- Every failure before commit leaves the target and source archive unchanged.
- Every failure after an authoritative commit is replayable by stable request
  identity and cannot double-restore, double-archive, or mint a second receipt.
- Cold restart discovers the active Classic projection solely through the
  derived sealed locator registry. Proof covers absent non-creating startup,
  activation-before-spawn, crash before/after activation, event response loss,
  exact replay, competing activation/terminal writers, chain gap/fork/tamper,
  wrong installation root, missing/changed projection, missing retired key,
  multiple preparation roots, cross-root tuple reuse, terminal replay after
  Constitution response loss, and a second preparation only after the prior
  activation is terminal. No success/error/DTO/log exposes a filesystem path.
- Restore replay proves the client-persisted `operationId` reaches the native
  `requestId` unchanged across HTTP and IPC; the authenticated globally
  UUID-keyed pre-dispatch operation record retains server-derived target/content
  and both process/native fingerprints after source retirement; a second
  principal cannot reserve or resolve the same UUID; committed lookup precedes
  mutable reads; exact replay is byte-equivalent; wrong-principal lookup does
  not enumerate state; and changed archive preview/live revision/server facts
  conflict without generating a replacement identity.
- Replay proof exercises native `committed`, `not_found`, definitive
  `rolled_back`, and corrupt/pending/inconsistent lookup outcomes. Only
  `not_found` permits same-ID dispatch with fresh destructive authority;
  `rolled_back` makes the ID terminal and requires a new client-persisted UUID.
- Operation-authority proof covers the exact record contract, stable hosted and
  Desktop principal encodings across restart/window recreation, global
  cross-principal UUID collision, every monotonic state transition, explicit
  cancellation, 30-day abandoned-prepared compaction, no-dispatch plus native
  `not_found` evidence, durable marker-before-Native crash barriers,
  dispatch-versus-cancellation serialization, exact digest KATs, exact tombstone
  schema, the 65,536-entry fail-closed quota, and permanent UUID ownership after
  tombstoning. `ROLLED_BACK`, `OPERATION_ABANDONED`,
  `OPERATION_AUTHORITY_FULL`, and the fixed
  non-enumerating wrong-principal `OPERATION_NOT_FOUND` response are proved
  byte-equivalent across HTTP and IPC with exact status/retryability.
- Conflict UI preserves the draft, clears the password, refreshes authoritative
  metadata, and requires an explicit retry against the new revision.
- A successful receipt removes/updates local recovery state immediately;
  best-effort refresh cannot keep controls locked indefinitely or resurrect a
  retired archive.
- Hosted route -> actual fetch client -> reducer proof and Electron IPC ->
  renderer reducer proof use the production contracts, not independent mocks
  that merely agree with each other.
- Exact projection receipt plus no-change, promote create/replace/delete,
  response loss, restart/partial resume, concurrent-v2 conflict, unsupported
  Classic mutation, pre-dispatch confirmed discard, partial-commit disposition,
  and encrypted local rescue retention are exercised through the real Stage B
  DTO/service/reducer. Tampered receipt/journal/rescue, changed-fact replay,
  duplicate/colliding identity, and traversal fail before mutation or plaintext
  exposure.
- Every Classic mutation is exercised with valid fresh destructive authority,
  wrong password, lockout, expired/reused authority, continuous-edit grant,
  unauthenticated hosted session, missing/wrong CSRF token, unregistered IPC
  channel, wrong sender/window, malformed/unknown DTO keys, stale recovery
  revision, stale journal head, changed-fact operation-ID replay, response loss,
  and exact successful replay. Assertions prove no password, path, prose, key,
  or raw native fact leaks into persistence, logs, JSON, IPC, or errors.
- Metadata GET is separately proved to require authenticated same-origin session
  or validated IPC sender, require no password or operation ID, perform no
  mutation/materialization, reject cross-origin access, and expose only its exact
  metadata envelope.
- Archive DTO proof covers exact version, field presence/nullability, canonical
  timestamps, ID/string/byte/list bounds, duplicate IDs, ordering, unknown keys,
  HTTP/IPC names, stable error mapping, operation-ID echo, and
  non-enumerating wrong-principal failures. Rotation is injected between GET
  and POST and response loss before and after source retirement.
- Classic DTO proof exhaustively covers the state/action/nullability matrix,
  canonical action order, sealed-rescue bounds, timestamps, unknown keys,
  HTTP/IPC codes, retryability, and non-enumerating principal behavior.
- Decision proof covers each allowed action, rotating discard challenge,
  wrong/expired challenge, object mismatch, and discard rejection after first
  commit. Resume injects partial commit, process death, stale/competing head,
  and repeated response loss.
- Negative surface proof enumerates registered hosted routes, preload channels,
  main-process IPC handlers, renderer actions, production service methods,
  native-helper request unions/command dispatch/protocol verbs, startup hooks,
  scheduled/background jobs, cleanup registries, retention workers, and updater
  migrations. It proves no Wave 0 export/import/delete/purge/prune/GC entrypoint
  or implicit lifecycle exists. Direct requests to unregistered HTTP paths
  return the ordinary non-enumerating route miss; unregistered IPC sends and
  unknown native verbs are rejected before service or filesystem entry. Cold
  start, restart, key rotation, application upgrade, conflict, discard, and
  chat deletion preserve the authenticated sealed rescue and every active or
  required-retired recovery key needed to authenticate it.

## Integration order

1. Stage A v2 implements and locally seals native restore, projection receipt
   verification, canonical delta/tombstones, durable multi-object promotion,
   authenticated replay/rollback lookup, partial reconciliation, encrypted
   local rescue, non-creating inventory, and Desktop service wrappers.
2. Add the shared recovery DTO and contract tests against the exact sealed
   Stage A record codec.
3. Add the derived, sealed, append-only Classic locator registry; publish its
   activation before Classic spawn, discover it on cold v2 startup, bind Stage
   B to the authenticated projection, and prove terminal replay without rescue
   deletion or live-state writes during preparation.
4. Add authenticated hosted routes and typed Electron IPC for inventory,
   restore, Classic decision, and Classic resume only.
5. Add `ConstitutionRecovery.tsx`, explicit Classic disposition, conflict,
   progress, and local-rescue-preservation surfaces.
6. Prove the negative surface gate: no export/import/delete/purge/prune/GC
   route, channel, service entrypoint, action, control, native-helper verb,
   startup hook, updater migration, scheduled/background job, cleanup registry,
   retention worker, or implicit lifecycle exists in Wave 0.
7. Run focused hostile, route-client, IPC-client, full renderer, TypeScript,
   lint, package, and aggregate adversarial proof.
8. Stage C composes exact Stage A/B commits, runs historical producer replay,
   signed-v0.11.8 no-change/promotion/partial/conflict/local-rescue/discard,
   real helper/service/Express/fetch and IPC journeys, and requires zero
   unresolved HIGH/BLOCKER before root integration.
9. Only then update Wave 0 receipts; never infer M0A/M0B or release acceptance.

## Deferred Recovery/Transfer boundary

Portable full-instance transfer is tracked by issue #903 and
`../INSTANCE-MIGRATION.md`. Rescue export/import and destructive rescue
deletion require a new versioned contract, independent adversarial audit, and
their own immutable acceptance receipt. Cycle 30 exposed unresolved hazards in
portable key-event continuity, HKDF inputs, import receipt derivation, native
root-identity recomputation, deletion-claim authority, ledger key separation,
and pathname-race-safe deletion. None is waived. Wave 0 neither implements nor
claims those surfaces; it preserves the encrypted local rescue so the later
program can migrate it without data loss.
