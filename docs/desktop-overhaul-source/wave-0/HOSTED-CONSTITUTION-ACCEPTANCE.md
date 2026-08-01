# Hosted Constitution journey acceptance

Status: **bounded pre-v2 renderer behavior prerequisite accepted; durable v2
renderer journey and aggregate acceptance remain open**.

This packet defines the closure contract for the three hosted Constitution HIGH
findings without weakening the agent-authority, destructive-action, CSRF,
rollback, or evidence boundaries. It does not itself close all three findings
and is not a release receipt.

## Bounded pre-v2 renderer prerequisite — 2026-07-16

The exact clean renderer candidate
`de9f3c9adb4203654667c4feea7f8d44a7d7668e` closes the then-bounded intrinsic
hosted read, specialist, conflict, reset-receipt, and delete-race findings. It
is the accepted pre-v2 renderer behavior prerequisite for later composition;
it is not the durable v2 renderer journey. Earlier
commits `09148604c0f652c2a51c101bb808f19460f65d1a` and
`d1374911ddcf8d31fe8b59b759dcd80293af0702` are correction history, not
standalone acceptance points.

The bounded behavior includes explicit present/absent/error read truth,
opaque revisions for absent targets, exact response envelopes, duplicate-safe
specialist inventory, read-absent-CAS creation, explicit three-way conflict
resolution, authoritative reset receipts even when refresh fails, strict
boolean success discriminants, and synchronous delete ownership that locks
the target editor and autosave path through the destructive request.

Exact candidate proof: 6 focused files / 48 tests, the full renderer suite at
2,114 passed with 2 skipped across 282 files, full TypeScript, candidate lint
with zero errors and three non-blocking warnings, diff validation, a clean
worktree, and independent source tracing with zero intrinsic HIGH/BLOCKER.

This is not durable-v2 or aggregate hosted acceptance. The renderer must still
persist outcome-unknown identity/facts before autosave, reset, create, delete,
explicit overwrite, and restore; recover exact operations across remount and
response loss; and clear them only from authenticated terminal truth. It must
then be
composed with the production native authority and proven through the real
authenticated route -> HTTP client -> reducer path. Non-creating startup/read,
request replay after response loss, exact native/IPC/HTTP envelopes,
production helper staging, packaged-byte verification, and full destructive
recovery remain separate gates. No renderer proof may be used to imply those
gates passed.

Production composition candidate
`991c502e74506ec3702f92e429a8b31b655412ba` now performs that composition in
an isolated clean worktree. Its local proof passes 154/154 combined
integration/authority tests, 39/39 native tests, strict Clippy, Rust formatting,
full TypeScript, 47/47 package tests, diff validation, real registered-route ->
actual fetch-client replay for all four mutation families, and exact staged
Darwin ARM64 helper digest
`sha256:141e9ec8e2163a31d4be124dcaa0dbb4cffddf7295b8bd6fd17d9ecc4559bd17`.
This paragraph records a candidate, not acceptance. Independent review rejected
`991c502e7` for integration because the real service cannot replay a committed
already-present main/reset mutation after response loss; the registered-route
test's mocked service masked that mismatch. Root remains unchanged. A corrected
exact commit needs real-service present-update/reset replay proof and a fresh
zero-HIGH/BLOCKER audit. The aggregate composition also needs packaged Windows
boot proof: unsupported helper authority must degrade Constitution capability
without crashing main-process initialization or enabling a filesystem fallback.

## Bounded candidate receipt — 2026-07-16

Commit `61d79d22c538998e0a76371eea343df93f781df3` (tree
`3c1ebc9a643e8efdc205b909bfc0e14b05321f38`) closes only the scoped grant and
autosave portion of this packet:

- opaque five-minute edit grants are stored only by digest and bound to the
  authenticated user, direct socket peer, expiry, and exact canonical or
  specialist write scope;
- reset and specialist delete reject edit grants and still require fresh
  destructive password step-up;
- autosave is serialized and coalesced, retains the latest dirty buffer across
  expiry or request failure, rejects stale completion, exposes retry, and
  persists principal-scoped recovery with a close guard;
- grant/network authorization failure clears the password and remains
  retryable; audit rows record action, target, and success/failure without
  password, plaintext grant, or document prose.

Evidence: 9 focused files / 54 tests, migration v54 2/2, TypeScript, 21-file
scoped lint with zero warnings/errors, canonical formatting, diff validation,
1,330 full Vitest files / 13,734 tests with 139 skipped, 26 Bun-native files /
191 tests, production Web renderer build, server bundle build, clean worktree,
and independent review with zero unresolved HIGH/BLOCKER inside this bounded
slice.

This bounded receipt is superseded for pre-v2 renderer behavior by the bounded
prerequisite above. Durable v2 operation identity, anchored non-creating native reads, production
CAS/archive authority, archive restore, filesystem hostile proof, the real
route-client seam, full native/package integration, and the complete aggregate
journey corpus below remain HOLD.

The later native root attempt `a2debfd66ed4385af0e9e9b258f153469e6f5e85`
failed cold-checkout helper discovery and full-root TypeScript proof and was
explicitly reverted at `12ea88caf3cd6e490a054060ea96b0f60966bfd8`.
Current tracked content is again exactly the bounded candidate tree above.
Native commit `6ddcdefa003e1b29fc15654dc477e42c510703df` remains an isolated
low-level candidate only; it also lacks reboot-reconstructable authenticated
pending facts, production key/service ownership, package/signing authority,
supported-host CI, and Windows-native parity. None of those gaps may be
silently inherited as hosted acceptance.

## Historical findings and current disposition

1. **CLOSED in the bounded candidate:** hosted canonical and specialist writes
   previously had no usable continuous authority because every write required
   destructive password step-up. `61d79d22c` adds the scoped edit-grant path
   while preserving fresh destructive authority for reset and delete.
2. **CLOSED only in the bounded pre-v2 renderer prerequisite:** specialist inventory,
   single-item read, existing-content hydration, read-absent-CAS creation,
   revision ordering, and destructive-delete locking are coherent without a
   hosted dependency on `window.electronAPI`.
3. **CLOSED only in the bounded pre-v2 renderer prerequisite:** hosted read failures remain
   errors, absent is explicit, present empty content remains present, and
   conflict/reset outcomes preserve authoritative revision truth. Native
   non-creating filesystem proof and the real route-client composition remain
   aggregate gates rather than renderer gaps.

## Required protocol

### Read truth

- Authenticated, rate-limited reads return an explicit discriminated state:
  `present` with content, or `absent`. Transport, authentication, parse,
  unsafe-filesystem, and server errors remain errors and may never become
  `absent` or empty content.
- Add hosted specialist inventory and single-specialist read routes with the
  same `present` / `absent` / error truth. IDs use the canonical server
  allowlist. All error bodies are bounded and redacted.
- Read/list implementation routes through the accepted anchored, non-creating
  Constitution filesystem backend. A read must not materialize `~/.wayland`,
  Constitution directories, defaults, archives, transaction state, or history.
  The only permitted cold-read initialization is the external revision HMAC
  authority beneath the explicit `app.getPath('userData')` authority path, as
  defined by the paired native v2 contract; it supplies the stable opaque
  absent revision and may not create Constitution filesystem state.

### Scoped autosave authority

- Add an authenticated, CSRF-protected edit-authorization route. It performs
  the existing operator-network and step-up-password checks before issuing a
  cryptographically random, short-lived opaque grant.
- Store only a digest of the grant server-side. Bind it to authenticated user,
  direct socket peer, expiry, and the exact edit scopes it authorizes. Never
  place the plaintext grant in logs, URLs, localStorage, durable config, or
  audit payloads.
- Canonical Constitution and specialist create/edit autosave may consume this
  grant through a dedicated header. They still require authenticated session,
  secure transport, CSRF, route rate limits, canonical target validation, size
  limits, anchored CAS/archive transactions, and audit status.
- The edit grant does **not** authorize reset, delete, archive restore, key
  rotation, or any other destructive action. Expiry/revocation fails closed and
  preserves the unsaved editor buffer while offering an explicit unlock flow.
- Do not re-send or retain the user's password for each debounce save.

### Separate destructive authority

- Reset/default restore, specialist delete, and archive restore each require a
  fresh destructive confirmation and step-up password. A continuous edit grant
  is rejected for these routes.
- Destructive operations use the accepted archive/recovery transaction and
  return status/receipt identity only; they never echo archived prose in an
  error response.

### Cohesive editor behavior

- The hosted editor renders distinct loading, present, absent, authorization
  required, save error, and read error states. A read error leaves the editor
  non-destructive and retryable.
- `absent` may offer an explicit initialize-default action. It must never be
  inferred from empty content and must not run automatically after a failed
  request.
- Hosted specialist inventory and existing content hydrate before edit. Create,
  edit, close, delete, and refresh all use the same HTTP contract; no hosted
  branch may depend on `window.electronAPI`.
- Autosave is serialized/coalesced. At most one write is in flight per target,
  a stale completion cannot mark a newer buffer saved, and the latest dirty
  value is retried after a successful predecessor. Closing or navigating away
  surfaces unsaved/error state rather than silently discarding it.

## Mandatory proof

- Route integration: authentication, CSRF, secure transport, operator network,
  correct/wrong step-up, lockout, grant issuance, hashed storage, expiry,
  revocation, user mismatch, direct-peer mismatch, scope mismatch, and edit
  grant rejection for reset/delete/restore.
- Read truth: present empty file, absent file, permission/read error, malformed
  response, 401/403/429/500, redacted error, specialist inventory, specialist
  present/absent, and no filesystem creation during read/list.
- Editor journey: hosted initial hydration, explicit absent initialization,
  failed read never resets, unlock -> autosave, expired grant preserves dirty
  content, specialist existing-data hydration, create/edit/delete with their
  correct authorities, overlapping saves, stale response ordering, and retry.
- Security regression: raw Constitution IPC remains unavailable over WebSocket;
  the continuous edit grant cannot reach unrelated configuration routes; audit
  records contain action/target/result but neither password, grant, nor prose.
- Aggregate TypeScript, focused route/service/DOM tests, full Vitest,
  Bun-native corpus, scoped zero-warning lint, diff validation, and production
  build after integration. This packet remains failed until an independent
  source-tracing review reports zero unresolved HIGH findings.
