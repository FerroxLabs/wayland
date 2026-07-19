# Wayland Transfer — encrypted instance migration

Status: follow-on packet P1; contract captured during Wave 0 so every new store
remains portable. P1 is not part of the 16-packet first Cockpit preview gate.

## 1. Product promise

A user can move a complete, application-consistent Wayland setup to another
Wayland Desktop, self-hosted Cloud, or hosted Pro instance without manually
copying hidden folders. The export includes supported settings, chats, Projects,
Teams, files, artifacts, archives, schedules, workflows, assistants, skills,
memory, receipts, and configuration references. The destination shows exactly
what will transfer, what needs re-authentication, what cannot resume, and what
will conflict before it changes live state.

The user-facing noun is **Wayland Transfer**. The artifact extension is
`.wayland-transfer.zip`; ZIP64 is only the transport container. User content,
filenames, object metadata, and the complete manifest remain inside authenticated
encrypted payloads.

## 2. Security truth

- Default transfer is destination-bound: the new Wayland instance creates a
  single-use public import key bound to the destination instance, destination
  principal/tenant, requested transfer scope, and a 15-minute maximum expiry.
  The source verifies its displayed fingerprint. The private key remains under
  the destination import authority and is destroyed on success, cancellation,
  revocation, or expiry. The archive cannot be opened as a normal plaintext ZIP.
- Format v1 has no algorithm negotiation. Destination mode uses suite `WT-D1`:
  HPKE base mode with DHKEM(X25519, HKDF-SHA256), HKDF-SHA256, and
  ChaCha20-Poly1305. Recovery mode uses suite `WT-R1`: Argon2id with exactly
  256 MiB memory, three iterations, parallelism one, a fresh 128-bit salt, and
  XChaCha20-Poly1305 with one fresh 192-bit nonce per encrypted object/chunk.
  Implementations reject unknown suites, parameter downgrades, nonce reuse, and
  algorithm substitution rather than negotiating a weaker fallback.
- For format v1, the `WT-R1` parameters are fixed rather than caller-controlled:
  Argon2 version `0x13`, memory exactly 256 MiB, iterations exactly three,
  parallelism exactly one, a 32-byte derived key, and a fresh 128-bit salt.
  Offline recovery uses a high-entropy recovery phrase or passphrase. The
  non-sensitive outer header repeats those exact values for deterministic
  validation; any lower *or higher* value, integer overflow, duplicate field,
  or unsupported Argon2 version is rejected before KDF allocation. A future
  resource profile requires a new transfer-format/suite version, never
  unauthenticated parameter negotiation inside `WT-R1`.
- Every encrypted chunk binds bundle ID, schema, ordinal, declared length, and
  content digest as associated data. A signed, encrypted manifest binds the
  complete object graph, exclusions, source instance, creation epoch, and
  compatibility floor/ceiling.
- The outer ZIP contains only format/version, KDF or recipient-key envelope,
  bounded ciphertext chunks, and signatures. It contains no plaintext object
  names, chat titles, Project names, user identifiers, provider names, or file
  inventory.
- Plaintext API keys, OAuth refresh tokens, cookies, SSH keys, and OS-vault
  secrets are never placed in a portable archive. The bundle carries a redacted
  credential/reconnection inventory. Optional same-owner device transfer may
  rewrap supported secrets directly into the destination OS vault without
  exposing their bytes to the renderer or archive.
- Wayland must not claim encryption makes owner data impossible to convert.
  Once an authorized instance decrypts data to use it, a sufficiently modified
  client can observe it. Destination-bound transfer and signed import raise the
  barrier to casual extraction; they are not absolute DRM.

### 2.1 Source export authority

Export is a consequential operation and may never be initiated by an agent,
schedule, channel, Team child, connector, or background service on inferred
authority.

- Desktop requires the active local profile owner, an explicit export review,
  and OS-backed step-up authentication for a full export, sensitive Memory, or
  any optional vault rewrap. A scoped non-sensitive export still requires an
  interactive owner confirmation.
- Self-hosted Cloud and hosted Pro require an authenticated tenant principal
  with the explicit `instance.export` permission, current tenant membership,
  step-up authentication, and any tenant policy approval/dual-control rule.
  Server or support operators cannot silently assume this role.
- The source authority rejects cross-tenant objects, unresolved ownership,
  stale step-up state, destination-principal/tenant mismatch, and any object
  family whose producer cannot attest the requested scope.
- A signed source export-authorization receipt binds a pseudonymous actor ID,
  source instance and tenant, role/policy version, approved object families,
  mutation epoch, encryption mode, destination key/fingerprint or recovery
  mode, exclusions, expiry, and terminal outcome. The outer archive and support
  receipt expose none of the actor, tenant, or inventory values.
- Destination pairing authenticates confidentiality, not source identity. A
  source is displayed as authenticated only when its instance/tenant signing
  key chains to an already trusted relationship. Otherwise its signature proves
  bundle integrity and continuity only, and the UI says `unverified source`.

### 2.2 Destination import authority

Possession of a destination public key or encrypted bundle is not authority to
mutate the destination. Key issuance, dry-run approval, and final publication
are separate consequential operations under one destination authorization.

- Desktop issues a single-use import key only to the active local profile owner
  after interactive destination selection and owner confirmation. Applying a
  full import, sensitive Memory, executable-capable content, identity/role
  changes, or vault rewrap additionally requires fresh OS-backed step-up
  authentication. The owner must approve the content-addressed final dry-run;
  the key-generation confirmation cannot pre-approve an unknown result.
- Self-hosted Cloud and hosted Pro require a current authenticated destination
  tenant principal with explicit `instance.import` permission, current tenant
  membership, fresh step-up authentication, and every configured tenant
  approval or dual-control rule both when the key is issued and immediately
  before publication. Support, source-tenant, service, agent, schedule, Team,
  connector, and background identities cannot assume this authority.
- The destination rejects wrong-instance, wrong-principal, wrong-tenant,
  cross-tenant, expired/revoked membership, stale step-up, scope widening,
  policy-version drift, dry-run digest drift, approval-set drift, and any object
  family outside the issued key scope. Authorization loss after decryption
  aborts before publication, destroys staged authority, and requires a fresh
  key and approval; it never falls back to possession of the archive.
- The destination signs an import-authorization receipt binding a pseudonymous
  actor ID, destination instance/tenant, role and policy versions, approved
  object families, issued key ID/fingerprint/expiry, source trust state, final
  manifest and dry-run digests, approval/dual-control receipt IDs, pre-import
  recovery point, publication mutation epoch, and terminal outcome. No actor,
  tenant, object inventory, or authorization details enter the plaintext outer
  container or content-free support receipt.

## 3. Export inventory

Included when supported and selected:

- application preferences, shell choice, accessibility and disclosure settings;
- chats, messages, attachments, Projects, Project references, pins, and labels;
- Desktop Teams, members, roles, workflows, schedules, automations, and paused
  state, without widening authority on the destination;
- user-created assistants, skills, templates, and non-secret connector
  definitions with version/provenance;
- Wayland-managed workspaces/files, artifacts, previews, citations, receipts,
  activity history, archives, and quarantine records;
- a Constitution v2 portable revision-authority envelope containing the active
  and every still-required retired key ID/material rewrapped to the transfer
  authority, authenticated history coverage, and rotation/migration receipts.
  It may be created only while the original revision authority is healthy and
  never exposes raw OS-vault bytes in the outer archive;
- memory and user-model material under an explicit sensitive-data disclosure;
- model/provider/agent configuration references, budgets, requested ceilings,
  and capability expectations without credentials;
- exact source versions, schema versions, adapter versions, platform facts,
  object counts, sizes, exclusions, and resumability levels.

Excluded or capability-graded:

- external files outside Wayland-managed roots unless the user explicitly adds
  them after a size/location preview;
- live processes, uncommitted external side effects, and backend-owned sessions
  whose adapter has no authenticated export/resume contract;
- device-bound licenses, machine identities, and OS-vault items that cannot be
  rewrapped safely;
- caches and reproducible downloaded runtimes unless explicitly required for an
  offline migration.

## 4. One application-consistent export

P1 reuses the M0 quiescence and mutation-epoch authority. It must not invent a
second backup system.

1. Preflight inventories every registered store, estimates size/time, identifies
   external files, missing adapters, credentials, active work, and exclusions.
2. The user chooses full or scoped transfer and a destination-bound or recovery
   encryption method.
3. Export enters the global quiescence barrier, pauses new dispatch, settles or
   honestly marks active work, checkpoints databases, and snapshots all declared
   stores at one mutation epoch. Any non-acknowledging writer aborts the export.
4. A content-addressed inner object graph and encrypted manifest are built in a
   private same-filesystem staging directory. All at-rest staging bytes remain
   encrypted under a fresh ephemeral staging key held outside the renderer;
   plaintext is streamed through bounded memory or scoped non-persistent handles.
   Publication is one atomic rename.
5. The exporter reopens, authenticates, decrypts, hashes, and graph-validates the
   finished bundle before reporting success. Partial bundles are quarantined and
   never offered for import.

Every current or future durable store must register a versioned portability
descriptor naming its authority, quiescence hook, serializer, dependencies,
secret fields, size limits, compatibility range, conflict policy, and restore
verifier. An unregistered store is a build failure for P1 and blocks any “export
everything” claim.

Export cancellation and crash recovery destroy the ephemeral staging key first,
then remove and sync directory entries. Secure overwrite is not claimed on SSDs;
cryptographic erasure is the authority. Startup scans only the dedicated private
staging root, verifies ownership and its content-free journal, and completes
cleanup without logging filenames, object metadata, plaintext, keys, or tenant
identity. Staging is excluded from indexing, backup, crash/core dumps, support
archives, and extension/tool access. P1 cannot ship on a target that requires
unprotected plaintext staging.

## 5. Transactional import

1. Parse only the bounded outer header, enforce total/chunk/count/ratio limits,
   and reject path traversal, symlinks, duplicate names, polyglots, ZIP bombs,
   unknown critical fields, invalid signatures, or unsupported crypto/schema.
2. Decrypt into an isolated non-executable staging authority; never import code,
   skills, connectors, or files directly into live roots.
3. Validate the complete manifest/object graph, provenance, object hashes,
   referential integrity, schema transforms, malware/policy hooks, and declared
   compatibility before displaying a dry-run.
4. Show create/merge/replace/skip conflicts per object family, required
   re-authentication, unavailable agents/connectors, lost backend session state,
   authority downgrades, scheduled-work status, and disk impact.
5. Default to new destination IDs where collision could alias unrelated mutable
   objects. Apply one deterministic object ID map across Projects, chats, Teams,
   schedules, files, artifacts, and archives. Producer-signed receipts are
   immutable: preserve their exact source bytes, original IDs, digests, and
   signatures. Create a separate destination-signed provenance wrapper that
   maps source object/receipt IDs to destination object IDs. Never rewrite a
   receipt or claim it remains `verified` when its producer trust, binding, or
   dependency cannot be re-established; downgrade it to `integrity checked` or
   quarantine it with the exact reason.
6. Enter the destination quiescence barrier, create a pre-import recovery point,
   and stage both stores and any supported OS-vault rewrap under one import
   transaction. Vault entries use copy-on-write aliases plus a final authority
   pointer switch; direct mutation before the recovery point is forbidden. Run
   every registered verifier and publish stores plus vault authority together.
   Failure or cancellation restores store and vault state exactly. A repeated
   exact import is idempotent; a conflicting repeat fails closed.
7. Imported schedules, channels, Teams, workflows, and consequential actions are
   paused until the user rebinds credentials and explicitly reviews authority.
   For an `unverified source`, every executable-capable object—including skills,
   templates that enter prompts, assistants, connector definitions, scripts,
   and executable workflow nodes—is placed in a non-executable quarantine. It
   is absent from prompt composition, discovery, indexing, ToolSearch, agent
   context, schedules, and extension/tool access until the destination owner
   reviews it, destination policy and malware checks pass, and a separate
   destination-signed activation receipt is issued. Known-malicious or
   policy-forbidden content is rejected, not imported disabled. Verified-source
   content still follows ordinary least-authority and paused-action review; its
   signature never grants destination execution authority.

Before step 6, the destination verifies the Constitution portable revision-
authority envelope, rewraps it into the destination vault transaction, and
proves every imported Constitution revision/receipt against the active or
required retired authority. Missing, tampered, incomplete, or non-portable key
coverage quarantines the dependent configuration/history and prevents a
“complete transfer” claim; it never becomes a fresh trusted history silently.

Before decryption or consumed-key rejection, the destination validates the
bounded outer structure and streams the raw archive once to compute its full
ciphertext/archive digest without KDF work. A durable ingress replay index uses
`destination instance + destination key ID + bundle ID + full archive digest`
and stores the terminal import receipt plus a consumed-key tombstone. An exact
repeat returns that prior terminal result without decrypting or recovering the
destroyed private key. The same destination key ID or bundle ID with different
archive bytes, outer scope, or destination binding fails closed as a conflict.
No replay record contains plaintext inventory, decryption material, or a means
to recreate the private key.

After authenticated decryption, the destination transaction ledger additionally
binds manifest digest, source signing identity/trust state, authorization and
dry-run digests, ID map, pre-import recovery point, publication epoch, and
terminal transaction receipt. The ingress index and transaction ledger are
published atomically with the import, survive restart, and participate in the
pre-import recovery point. A crash before terminal publication follows the
recorded transaction recovery state; it never reapplies blindly. Only after the
exact-repeat lookup misses do expired, consumed, revoked, wrong-principal, or
wrong-tenant keys fail before decryption. Local trust is the user-confirmed
fingerprint; hosted trust additionally requires a destination tenant-key
attestation rooted in the configured service trust store.

## 6. Product surface

Settings → Data & Recovery exposes:

- **Transfer to another Wayland** — pair a destination and stream the bundle,
  or save a visibly labelled **15-minute, single-use destination bundle** with
  its destination fingerprint, expiry countdown, scope, and consumed/expired
  state. The UI warns before saving that it is not an offline backup. Expiry or
  consumption offers a fresh pairing/export; it never silently reuses the key.
- **Create recovery bundle** — passphrase/recovery-phrase encrypted offline file;
- **Import Wayland bundle** — inspect and dry-run before live mutation;
- a progress rail with Snapshot, Encrypt, Verify, Transfer, Import, Rebind, and
  Validate stages, plus outputs, exclusions, blockers, and a downloadable
  content-free support receipt.

No advanced object selection is required for the default full transfer. Power
users can inspect and exclude object families without losing dependency truth.

## 7. Required proof

- full and scoped transfer across macOS, Windows, Linux, self-hosted Cloud, and
  hosted Pro compatibility pairs;
- crash/power-loss/low-disk/cancellation at every export and import transition;
- wrong passphrase, wrong destination, tampering, truncation, reordering,
  duplicate chunks, rollback, replay, idempotent retry, conflicting repeat,
  expired/consumed/revoked/wrong-tenant import key, crypto-suite downgrade,
  nonce reuse, signer-trust failure, and schema drift;
- fixed `WT-R1` parameter validation before allocation, including excessive or
  overflowed memory/iteration/parallelism/header values and a proof that hostile
  recovery headers cannot trigger attacker-selected KDF resource consumption;
- ZIP slip/bomb/polyglot/symlink/permission/malicious-skill and oversized object
  corpus;
- exact object counts, hashes, references, archives, files, schedules, Teams,
  chats, Projects, receipts, and settings before/after;
- unavailable provider/agent/connector and backend-session downgrade journeys;
- no plaintext secrets or user metadata in the artifact, logs, crash reports,
  progress UI, or support receipt;
- source-role/tenant/step-up denial tests, export audit-receipt verification,
  transactionally failed/cancelled vault rewrap, crash cleanup with unreadable
  staging after key destruction, and no renderer/extension staging access;
- destination `instance.import`/membership/role/step-up/dual-control denial,
  final dry-run digest approval and drift rejection, import-authorization
  receipt verification, and authority loss between key issue and publication;
- exact-repeat lookup after private-key destruction, consumed-key tombstone
  restart replay, conflicting archive/key/bundle reuse, and proof that the
  ingress replay index contains no plaintext or decryption authority;
- unverified executable-object quarantine, prompt/ToolSearch/index/schedule
  non-reachability, explicit activation receipts, and malicious-content reject;
- saved destination-bundle expiry/countdown/consumption UX and recovery-bundle
  redirection proof;
- exact source receipt-byte preservation plus destination provenance mapping;
  forged remaps, rewritten receipt IDs, invalidated bindings, and false
  `verified` carry-over fail closed;
- Constitution active/required-retired key continuity, rotation receipt replay,
  missing-key quarantine, destination-vault rollback, and post-restart history
  verification;
- export/import/re-export determinism at the semantic object level without
  requiring byte-identical randomized ciphertext.

P1 accepts only when a representative full instance survives source export,
fresh destination import, restart, re-authentication, paused-authority review,
normal work, archive restore, scheduled-work resume, and a second verified
transfer without silent loss or authority widening.

## 8. Relationship to competitor migration

Existing OpenClaw, Hermes, Claude, and other inbound migration adapters remain
separate untrusted importers that normalize into this verified internal object
graph. Wayland Transfer does not emit their formats. That product boundary must
not be described as cryptographic impossibility: it is a supported-format and
destination-bound security decision, while users retain access to their own
decrypted work inside Wayland.
