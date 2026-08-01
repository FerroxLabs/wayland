# Native Constitution authority v2 acceptance

Status: **HOLD — Stage A/Stage B source implementation and local aggregate
tests are green; Stage C immutable, signed-Classic, and target-package evidence
is not complete.**
Rejected predecessor: `991c502e74506ec3702f92e429a8b31b655412ba`
Rollback-safe root: `12ea88caf3cd6e490a054060ea96b0f60966bfd8`

Integration owner: Desktop lane `area:desktop-ui`, coordination issue
`FerroxLabs/wayland#886`. Native helper owner: the native-only Constitution
lane over `native/constitution-fs/src/main.rs` and Rust tests. Desktop authority
owner: the production Constitution lane over key state, transaction parsers,
service, routes/IPC, renderer, and JS tests. Independent audit owner: a
read-only exact-commit source-tracing lane. Candidate: unsealed. Required
receipts: `wave-0/receipts/NATIVE-CONSTITUTION-V2.json` for Stage A and
`wave-0/receipts/CONSTITUTION-RECOVERY.json` for Stage B/Stage C composition.
Both are content-addressed immutable evidence records. Stage A binds exact
Desktop/native commits, helper/protocol digests, revision/recovery key schema,
historical corpus/source/harness/toolchain provenance, commands, tests, and
limitations. Stage B/Stage C binds exact Stage A/B commits, projection/delta/
journal/rescue schema digests, signed Classic artifact identity, target package
identity, mandatory journey artifacts, and independent audit result. A mutable
pathname, branch head, unsealed worktree, or “latest” artifact satisfies
neither receipt.

This gate exists because the predecessor was locally green but failed an
immutable source-tracing audit at the real Desktop production boundary. No
subset of this file may be described as production-complete, and the rejected
commit must not be integrated into the rollback-safe root.

Wave 0 is deliberately local and non-destructive: it preserves same-device
revision authority and authenticated encrypted rescue, but it does not expose
portable key wrapping, rescue export/import, rescue deletion, pruning, or
automatic garbage collection. Those surfaces belong to the later
Recovery/Transfer program tracked by issue #903 and require a new independent
contract and audit. Their absence is fail-closed acceptance behavior.

## Required paired protocol

Native helper and Desktop consumer move together to a versioned v2 contract.
Silent extension of the v1 envelope is forbidden.

### Durable revision authority

- A dedicated 32-byte revision HMAC key is encrypted with the OS credential
  facility and stored outside `~/.wayland` in the app user-data authority.
- A cold read may initialize only the external revision HMAC authority beneath
  the explicit `app.getPath('userData')` authority path. This is the sole
  permitted read-side materialization and exists so an absent Constitution has
  one stable opaque revision across restart and response-loss replay.
- Cold or existing-state reads never create `~/.wayland`, a Constitution
  target, archive, default, transaction journal, or history. Mutation
  initialization may create those only through the declared filesystem
  authority path after compare-and-swap succeeds.
- The Constitution key-state schema binds the revision-key identity/digest.
- Missing, mismatched, malformed, symlinked, or replaced key state fails closed
  when v2 history exists. Production has no process-random fallback.
- Identical state has the same revision after Desktop/service restart.

The sole revision-key lifetime owner is the Desktop production Constitution
authority initialized by the main-process bridge with the explicit
`app.getPath('userData')` path. There is no process-random or implicit-path
fallback. Renderer, routes, IPC, and the native helper receive revisions or
keyed requests; they never independently open, create, rotate, export, or
replace revision keys.

Revision-key lifecycle is versioned and recovery-owned:

- key state records active key identity plus any retired verification keys
  needed by authenticated history; revision syntax binds the key identity;
- same-device backup carries only an authenticated OS-vault reference and
  encrypted envelope, never plaintext key bytes;
- cross-device/portable recovery is unavailable in Wave 0. No portable wrapper
  is created, accepted, advertised, or required for Wave 0 acceptance;
- rotation is one authenticated migration receipt binding old/new key IDs,
  history coverage, revision remapping, and rollback facts; retired keys remain
  until no accepted receipt/history depends on them;
- missing, mismatched, or lost active/retired keys quarantine v2 Constitution
  state and fail closed. The product may restore a valid envelope or a proved
  migration; it may not generate a replacement key over existing history;
- signed v0.11.8 runs only against the isolated transformed copy and never
  consumes v2 key state. The projection receipt binds its source snapshot,
  projected Constitution/SOUL/specialist bytes, and the exact separately
  preserved v2 authority envelope. The receipt is an authenticated,
  content-addressed, no-clobber record published and directory-synced beneath
  the external recovery authority; it is outside the Classic root and is never
  writable by or copied into the Classic session. Re-upgrade authenticates the
  receipt and envelope before restoring that exact envelope and proves
  revision/receipt continuity before considering Classic-session work;
- work created in the isolated Classic session is never assumed disposable.
  Re-upgrade computes content changes and explicit deletions against the bound
  projection, reacquires the current profile/quiescence authority, and imports
  each supported Constitution change through the persisted v2 CAS request
  identity assigned to that item when promotion is prepared. Each request
  binds the source projection digest, canonical Classic delta digest, expected
  current v2 revision, and resulting receipt. No-change restores the exact v2
  state.
  Concurrent v2 edits, unsupported Classic mutations, missing bindings,
  partial promotion, or validation failure retain both copies in a sealed
  rescue bundle and require visible resolution; they never overwrite current
  v2 state, mint authority, or silently strand Classic work. Exact replay is
  idempotent and changed facts conflict.

### Classic projection and promotion state machine

The downgrade/re-upgrade bridge is a versioned recovery protocol, not an
informal comparison of two directories:

- “external recovery authority” means a dedicated versioned signing/sealing
  key identified by key ID, encrypted by the OS credential facility beneath
  explicit app user-data, and excluded from the projected Classic tree. It is
  distinct from both Classic state and raw revision-key bytes. Projection,
  journal, decision, and rescue records use domain-separated HMACs
  over RFC 8785 canonical JSON and bind the signing-key ID. Publication uses a
  same-directory exclusive temporary file, file sync, no-clobber publish, and
  parent-directory sync. Missing key/envelope, key-ID mismatch, invalid MAC,
  non-canonical bytes, or ambiguous publication fails closed;
- external recovery key state has one active key ID and the exact retired
  verification/decryption key IDs still referenced by a projection, journal,
  decision, rescue, or accepted recovery receipt. The
  versioned state fixes the MAC algorithm to HMAC-SHA-256, the cipher to
  AES-256-GCM with a fresh 96-bit nonce and authenticated record
  schema/domain/key ID, and the wrapped-key envelope schema. Same-device backup
  preserves an authenticated OS-vault reference plus encrypted envelope.
  Wave 0 defines no portable wrapper. Rotation publishes one authenticated,
  no-clobber migration receipt binding old/new key IDs, every still-live record
  digest, re-MAC/re-encryption results, rollback facts, and the new authority
  head; retired keys remain until no live or accepted record depends on them.
  Loss, mismatch, or absence of an active or required retired key quarantines
  the affected recovery set. It may be restored from a valid envelope or proved
  rotation, but a replacement key may never be generated over existing records;

The external recovery crypto schema is normative rather than an
implementation hint:

- The vault secret is exactly 32 CSPRNG bytes. `keyId` is
  `rk1:` followed by unpadded base64url SHA-256 of those bytes. Raw secret bytes
  exist only in the OS vault. The
  canonical key-state record has exactly `contract`, `activeKeyId`, `keys`, and
  `authorityHeadSha256`; `contract` is
  `wayland-constitution-recovery-key-state/1.0`. `keys` is sorted by `keyId` and
  each exact entry is `{keyId,status,createdAt,retiredAt,vaultRef}` where status
  is `active` or `retired`, times are canonical UTC RFC 3339 strings,
  `retiredAt` is null only for active, and `vaultRef` is an opaque non-secret
  locator. Unknown, duplicate, unsorted, noncanonical, or multiple-active
  entries fail closed. `authorityHeadSha256` is the digest of the latest
  authenticated key-lifecycle event, not of the state object itself. An event
  has exactly `{contract,sequence,previousEventSha256,kind,oldKeyId,newKeyId,
newVaultRef,createdAt,coveredRecordDigests,macs}`. Contract is
  `wayland-constitution-recovery-key-event/1.0`; genesis has sequence zero,
  null predecessor/old key and kind `created`; rotation increments sequence,
  uses kind `rotated`, and binds the exact predecessor, old/new IDs, and the
  new key's opaque non-secret `newVaultRef`.
  `coveredRecordDigests` is the sorted complete live set. `macs` is sorted by
  key ID and contains exact `{keyId,valueBase64url}` entries over the RFC 8785
  event with `macs` omitted: genesis has the new-key MAC; rotation has both old-
  and new-key MACs so both generations consent. `authorityHeadSha256` is the
  full canonical event digest. Missing, forked, skipped, or singly
  authenticated rotation events fail closed. Loading key state first verifies
  the complete event chain and its MAC set, derives each key's `vaultRef` and
  creation time from the event that introduced it, its retired time from the
  rotation that replaced it, the sole active key, exact retired-key set, and
  covered live-record set from those events, then requires
  byte-for-byte equality with `activeKeyId`, `keys`, and
  `authorityHeadSha256`; key-state fields are never independent claims.
- From the vault secret derive two disjoint 32-byte keys with RFC 5869
  HKDF-SHA-256. Salt is the 32 raw bytes of
  `SHA-256("wayland-constitution-external-recovery/root/1.0")`; info is the
  exact UTF-8 string `record-encryption` or `record-mac`. A record encryption
  key is then HKDF-SHA-256 of the derived encryption key with the record's
  32-byte random salt and exact UTF-8 info
  `domain + "\u0000" + recordId`. No key is reused for both roles.
- Every sealed record is RFC 8785 canonical JSON with exactly
  `{contract,recordContract,domain,keyId,recordId,createdAt,kdf,cipher,plaintext,mac}`.
  `contract` is `wayland-constitution-recovery-envelope/1.0`; `kdf` is exactly
  `{name:"HKDF-SHA-256",saltBase64url,infoBase64url}`; `cipher` is exactly
  `{name:"AES-256-GCM",nonceBase64url,ciphertextBase64url,tagBase64url}`;
  `plaintext` is exactly `{bytes,sha256}`; and `mac` is exactly
  `{name:"HMAC-SHA-256",valueBase64url}`. All binary strings use unpadded
  canonical base64url; SHA-256 uses the lowercase `sha256:` form already
  defined here. AES-GCM nonce is 12 CSPRNG bytes and tag is 16 bytes.
- AES-GCM AAD is the RFC 8785 canonical JSON encoding of exactly
  `{contract,recordContract,domain,keyId,recordId,createdAt,kdf,plaintext}`.
  HMAC covers the RFC 8785 canonical envelope with the `mac` member omitted,
  including ciphertext and tag. Verification checks canonical bytes, HMAC,
  GCM tag, plaintext length, and plaintext digest before parsing plaintext.
  The tuple `(keyId,saltBase64url,nonceBase64url)` is globally unique; a failed
  or retried seal generates a new salt and nonce and no API accepts caller
  supplied values. Duplicate tuple detection quarantines both records.
- A same-device backup envelope has exactly
  `{contract,keyId,createdAt,vaultProvider,vaultRef,wrappedSecretBase64url,
wrappedCiphertextSha256}` with contract
  `wayland-constitution-recovery-same-device-wrap/1.0`. `vaultProvider` and
  `vaultRef` must match the active platform-vault authority; wrapped bytes are
  the vault-produced authenticated ciphertext for exactly the 32-byte secret,
  encoded as canonical unpadded base64url and checked against
  `wrappedCiphertextSha256` before vault use. It is restored only through that
  same provider/reference, then the decrypted secret's derived key ID is
  verified before
  loading any record. The wrapper makes no portable or cross-device claim and
  never falls back to plaintext, a machine-derived key, or a replacement key.
- the projection receipt binds schema/version, exact producer and candidate
  commits, source recovery-snapshot digest, source revision-authority identity,
  preserved encrypted v2-envelope digest, Classic root identity, canonical
  baseline object manifest, creation time, and recovery authority;
- supported identities are `constitution:CONSTITUTION.md`, legacy
  `constitution:SOUL.md` only during the declared migration, and
  `specialist:<NFC-normalized-id>`. Specialist IDs pass the production
  validator after Unicode NFC normalization and case-collision detection.
  Paths are derived from identities; Classic paths are never manifest
  authority. A projection contains exactly one primary Constitution identity.
  A Classic `SOUL.md` delta maps through the declared native legacy migration
  into canonical `CONSTITUTION.md`; simultaneous SOUL/CONSTITUTION primaries or
  an undeclared primary rename fails closed into rescue;
- the manifest is RFC 8785 canonical UTF-8 JSON with sorted object IDs and exact keys.
  Each item declares `create`, `replace`, or `delete`, baseline and final
  presence/digests and byte length. Every `create` or `replace` embeds the exact
  bounded final bytes as padded RFC 4648 `finalBytesBase64`; every `delete`
  declares final absence and carries no payload. Preparation decodes once,
  verifies canonical round-trip, length, and digest, seals the complete delta
  and rescue bundle before the first destination CAS, and thereafter dispatches
  only those sealed bytes. Rereading the mutable Classic root or resolving an
  external/content-addressed payload after preparation is forbidden.
  Digests are exactly `sha256:` plus 64 lowercase hexadecimal characters;
  base64 is padded RFC 4648 with round-trip canonicality and production size
  limits checked before allocation.
  Rename is an explicit delete plus create. Duplicate IDs, unknown keys/types,
  non-NFC IDs, traversal, absolute paths, separator injection, case-fold
  collision, unsupported files, digest disagreement, or non-canonical encoding
  fails closed into rescue;
- before mutation, changed Classic state presents exactly one decision:
  **Promote supported changes**, **Keep v2 unchanged and retain encrypted local
  rescue**, or **Discard Classic changes and restore v2**. Discard requires a
  second confirmation naming affected objects. Authenticated local rescue
  remains mandatory, visible, and retained. This three-way decision exists only
  before the first destination CAS. Once any item has committed, “discard
  promotion” cannot erase, roll back, or relabel that commit: the UI instead
  shows the committed receipt map and offers only authenticated resume of
  pending items or keep-current-v2 while retaining unresolved rescue. Restoring
  pre-promotion v2 afterward is a separate fresh destructive CAS workflow with
  its own expected revisions, archives, receipts, and confirmation;
- promotion atomically publishes a no-clobber journal under external recovery
  authority before dispatch. Its immutable fingerprint binds projection
  receipt, canonical delta, destination authority, ordered objects, expected
  revision map, and one random `promotionId`. Every item receives a persisted
  UUID before dispatch; exact replay reuses that UUID and fingerprint;
- journal state moves `prepared -> applying -> committed`, `conflicted`, or
  `rescued` through append-only, monotonically sequenced, hash-chained,
  authenticated event records plus an atomically CAS-published head. It durably
  maps every item to `pending`, `committed` with its authenticated CAS
  receipt/result revision, or `conflicted` with exact facts.
  Restart or response-loss reconciliation performs committed lookup with the
  persisted UUID/fingerprint before a live read and resumes only pending
  items. A later conflict never rolls back or hides an earlier commit; the
  terminal map, source copies, and receipts remain visible in rescue. Each event
  is written under a sequence-plus-digest no-clobber identity, synced, and only
  then may advance the authenticated head by compare-and-swap from its exact
  predecessor. The head is authority only when it resolves to one complete,
  contiguous, MAC-valid chain from the prepared genesis. A missing, torn, or
  noncanonical head/event; a head that skips or misbinds an event; competing
  valid successors; or a stale/concurrent writer fails closed into visible
  reconciliation/rescue and performs no further CAS. A synced orphan event
  whose head CAS did not commit is retained as non-authoritative evidence;
  restart either proves and replays the exact head transition idempotently or
  leaves it quarantined—it never selects an orphan by timestamp or sequence
  alone. Response loss at event publication and head CAS is replayed by exact
  event digest and predecessor head, never by minting a new event;
- rescue is an authenticated-encrypted, content-addressed, no-clobber bundle
  binding the projection receipt, promotion journal, destination authority,
  preserved v2 envelope, Classic baseline/final bytes, receipts, and conflicts.
  Its data key is protected by the OS vault. Rescue has no automatic GC and
  Wave 0 exposes no export, import, delete, purge, or prune entrypoint. Resume
  authenticates every digest before using sealed bytes.

### Durable request replay

- Every mutation producer supplies a valid UUID across HTTP, Electron IPC,
  preload/common types, service calls, and restore paths.
- The canonical request fingerprint binds schema version, intent, target,
  content digest or null, expected revision, and archive identity or null.
- Native `committed_lookup` authenticates the original UUID and fingerprint and
  returns only exact `committed`, definitive `rolled_back`, or `not_found`.
  Pending, corrupt, inconsistent, or missing proof fails closed; changed facts
  conflict.
- Lookup happens before any live read, target selection, archive generation, or
  compare-and-swap. A replayed success is reconstructed from authenticated
  receipt facts, never from current filesystem state.
- Reconciliation request identity is deterministic from the original
  transaction so reconciliation response loss is itself replayable.

### Reconcile before truth

- Pending inventory is non-creating.
- Every native read, list, archive read, and mutation preflight is guarded by
  the same authority or independently rejects pending state.
- Existing histories load existing keys only, reconcile deterministically, and
  only then expose read/list truth or run CAS.
- Missing or corrupt history/key material must never be rendered as absence.

### Atomic legacy migration

- SOUL-to-CONSTITUTION migration is one native anchored transaction.
- Under the native lock it proves canonical absence, holds a single-link
  regular SOUL source, and binds device, inode, byte digest, canonical absence,
  request, replacement, and archive facts.
- It archives/displaces SOUL, publishes CONSTITUTION, retires SOUL, and
  reconciles only to an exact pre-state or post-state. Split state is forbidden.
- Symlink, hardlink, inode substitution, in-place edit, canonical appearance,
  rename, crash-hook, and response-loss cases are adversarial tests.

### Honest platform capability

- Production owns an explicit Available/Unavailable Constitution authority.
- Only `UNSAFE_PLATFORM` becomes unavailable. It touches no Constitution root
  or key material, keeps ordinary chat alive, and produces typed IPC plus a
  bounded HTTP 503 rather than false absence.
- Missing/tampered helpers, corrupt receipts, key failure, pending-state
  failure, and reconciliation failure on a supported platform remain fatal.
- Prompt composition may degrade only for the explicit unsupported capability;
  it must not swallow supported-platform integrity failures.

### Durable renderer single-shot operations

- Autosave, reset, create, delete, explicit overwrite, and restore persist an
  outcome-unknown operation before dispatch.
- The persisted record binds kind, target, request UUID, expected revision,
  and content digest/draft reference. It never stores a password or transient
  grant.
- Crash, unmount, network loss, and 5xx reuse the exact identity and facts.
  Only an exact authenticated receipt clears success uncertainty; an
  authenticated `rolled_back` outcome permits a new UUID.

## Staged proof and merge order

Stage A may be locally sealed before recovery UI exists. It includes the paired
v2 helper/consumer protocol, durable revision-key lifecycle, authenticated
lookup, reconcile-before-truth, atomic legacy migration, mandatory IDs, durable
renderer identity for existing edit surfaces, and the native/service restore
primitive. It also includes the projection-receipt verifier, canonical
delta/tombstone parser, persisted promotion journal, per-item CAS replay,
partial-promotion reconciliation, and authenticated rescue primitives. Stage A
must replay fixtures produced by the nominated historical transaction
implementation. If harness-only wiring is required to invoke an already
present internal crash hook, its complete patch and digest are provenance-bound
and independently proved not to alter transaction logic; the resulting helper
digest is recorded separately from the producer commit. Current-code
simulations are not substitutes. Stage A is not root-integration authority.

Stage B follows the exact Stage A contract and adds recovery DTOs, routes/IPC,
UI, explicit promote/keep-v2/discard decisions, partial/conflict visibility,
local-rescue preservation, and its receipt. It also proves the negative surface:
no portable or destructive rescue entrypoint is registered. Stage C composes both exact
commits, runs historical migration, signed Classic, promotion, package, and
real journey proof, then performs the immutable zero-HIGH audit. Root
integration is allowed only after Stage C; the order cannot be inverted,
collapsed into mocked composition proof, or accepted without the Classic
promotion receipt.

## Proof required before aggregate acceptance

1. Native hostile tests cover exact replay for every mutation family, changed
   facts, corrupt/missing artifacts, pending state, roll-forward, rollback,
   deterministic reconciliation, guarded reads, and atomic legacy migration.
2. Service tests prove stable absent/present/specialist revisions across
   restart, durable key continuity, lookup-before-read replay,
   reconcile-before-truth, same-device recovery, key loss/quarantine, and
   authenticated rotation/migration. They also prove canonical Classic deltas,
   authenticated projection receipts, persisted item identities, no-change,
   create/replace/delete, partial commit plus restart, changed-fact conflict,
   pre-dispatch explicit discard, partial-commit disposition, encrypted rescue
   resume, and indefinite retention with proof that no export/import/delete/GC
   path exists. Journal proof injects
   crashes after event sync and before head CAS, after head CAS response loss,
   missing/torn tail and head records, stale-head writers, and competing
   concurrent successors; every case proves one authoritative chain or
   fail-closed rescue without an extra destination mutation.
   Version-pinned crypto vectors prove key IDs, HKDF outputs, RFC 8785 bytes,
   AES-GCM AAD/ciphertext/tag, HMAC, key-event dual-MAC chains, and same-device
   wraps. Negative vectors cover noncanonical base64url/JSON, wrong role key,
   AAD, tag, MAC, salt/KDF parameter, secret digest, key-state/head derivation,
   reused nonce tuple, missing retired key, forked/singly signed rotation, and
   wrong vault provider. Tests use fixed vector inputs only; production randomness is
   separately proved to reject caller-supplied salts/nonces.
3. HTTP/IPC/preload tests reject missing or malformed IDs before service entry,
   runtime-validate read/list envelopes, and preserve exact failure envelopes.
4. Stage C runs a real helper + real service + Express + actual renderer fetch journey
   commits a mutation, loses the response, stops the service/server, starts a
   new service with the same root, and replays the exact receipt. Update, reset,
   create, delete, and restore are covered; changed facts return conflict.
5. An immutable historical corpus is generated in an isolated tree from the
   transaction implementation at exact commit
   `991c502e74506ec3702f92e429a8b31b655412ba`. Its manifest binds producer
   commit, source-tree digest, compiler/toolchain, generator command/version,
   helper digest, fixture digests, and crash points including after ledger
   publication and before journal/receipt completion. Any additive harness-only
   patch used to invoke the commit's existing internal hook is stored verbatim,
   digest-bound, and independently source-traced to prove it changes no
   transaction, serialization, or durability logic. Candidate Stage A
   reconciles those actual bytes to authenticated terminal state before read or
   mutation. Current-code fixtures edited to resemble old state do not satisfy
   this item.
6. A signed/notarized v0.11.8 artifact runs only against the isolated projected
   copy, creates/replaces/deletes supported Classic objects, exits, and is
   re-upgraded through actual Stage B UI/service. Stage C proves no-change,
   successful promotion, partial replay, concurrent-v2 conflict, unsupported
   change rescue, pre-dispatch explicit discard, partial-commit disposition,
   indefinite encrypted local-rescue preservation, and no mutation of the
   preserved snapshot.
7. A packaged Windows smoke boots, registers ordinary routes, composes ordinary
   prompts, reports Constitution unavailable, and creates no false root/key or
   fallback backend.
8. Target-exact staged helper verification, codesigning, package-resource
   verification, typecheck, lint, formatting, focused suites, full suites, and
   diff hygiene pass on one immutable commit.
9. An independent exact-HEAD adversarial audit returns zero unresolved
   HIGH/BLOCKER findings before root integration.

## Current implementation truth

Verified against the unsealed candidate worktree on 2026-07-17:

- Stage A source now implements the paired v2 helper/consumer contract,
  external revision authority, authenticated lookup/reconciliation, durable
  renderer operation identities, archive restore primitives, and fail-closed
  prompt composition. Electron and standalone Web/Cloud startup both install
  an explicit production Constitution authority before prompt or route use;
  standalone truthfully exposes signed-Classic recovery as unavailable.
- The external recovery authority now implements the normative Cycle 22
  key/envelope lifecycle: fixed RFC 8785/HKDF/AES-GCM/HMAC vectors, active and
  retained verification keys, dual-MAC rotation, same-device wraps, tuple-reuse
  quarantine, no-clobber publication, and refusal to mint replacement authority
  over existing history.
- Classic promotion now has an authenticated append-only journal and sealed CAS
  head, predecessor claims, response-loss replay, torn/orphan/stale/concurrent
  writer rejection, partial reconciliation, and an immutable encrypted rescue
  payload sealed before the first destination CAS.
- The historical corpus contains committed and ledger-published/crash-pending
  states generated from exact producer commit
  `991c502e74506ec3702f92e429a8b31b655412ba`. Its manifests bind the producer
  tree/archive, helper build receipt, toolchain, generator, complete harness
  patch, transaction-region before/after digest, helper digest, fixture bytes,
  and crash point. A separately digest-bound deterministic manifest finalizer
  now reproduces the enriched manifests from the producer-emitted raw manifests;
  the exact finalization commands are retained and byte-reproduction is tested.
  Candidate tests replay those retained bytes.
- Stage B shared DTOs, archive and Classic authorities/services, restart-safe
  locator, hosted routes, Electron IPC/preload, renderer services and visible
  Settings recovery surfaces are present. The negative-surface suite proves no
  portable rescue export/import or destructive rescue lifecycle is registered
  in Wave 0.
- The real native helper/service/Express/renderer-fetch contract test proves
  committed replay and changed-fact conflict after service restart. Focused
  suites and `bun run typecheck` pass. The pre-Cycle-38 aggregate run passed
  13,959 Vitest tests plus 224 Bun-native tests with zero failures after the
  manifest-finalizer and standalone Docker corrections; it predates the new
  recovery consumer-journey file and is not exact-current aggregate evidence.
  That new file has separate focused proof, and the complete aggregate must be
  rerun against the eventual immutable Stage A/B candidate.
  Scoped lint and formatting are warning-free, `bun run build:server` passes
  with only the two recorded pre-existing direct-eval warnings, the Electron
  renderer build and i18n type/validation gates pass, and `git diff --check`
  passes. The i18n validator retains existing repository-wide translation-debt
  warnings; it reports the generated key type in sync and exits successfully.
- The standalone Docker source now builds the Linux helper from the exact crate
  in an isolated Rust stage, compiles its digest authority before the server
  bundle, and copies only the bound helper resources into the runtime image.
  The server bundle build and focused preparation/standalone tests pass; this is
  not yet a built-image or deployed-container receipt.

This remains **HOLD**, not acceptance. The candidate is a dirty, unsealed
worktree rather than one immutable Stage A/B commit; the required
`NATIVE-CONSTITUTION-V2.json` and `CONSTITUTION-RECOVERY.json` receipts do not
exist; no real signed/notarized v0.11.8 no-change/promotion/partial/conflict/
rescue/discard downgrade and re-upgrade journey has been captured; no packaged
Windows smoke or complete target-exact package/codesign/resource proof has been
captured on that same immutable commit; and no independent exact-HEAD audit has
returned zero unresolved HIGH/BLOCKER findings. Unit tests of Classic trust and
package manifests are supporting evidence only and do not substitute for those
Stage C artifacts.

Stage B source was developed provisionally before an immutable Stage A seal.
That does not waive the merge order: sealing must produce an exact Stage A
commit first, then an exact Stage B commit based on it, and the complete Stage B
proof must be rerun against that Stage A identity before Stage C. A single
combined commit cannot retroactively satisfy the two-stage evidence chain.
