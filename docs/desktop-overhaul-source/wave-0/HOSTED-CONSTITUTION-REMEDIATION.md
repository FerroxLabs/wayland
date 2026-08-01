# Hosted Constitution remediation packet

Status: **authorized Wave 0 corrective packet; implementation waits for the
hostile-filesystem Constitution correction to integrate and re-audit**

This packet closes three source-traced HIGH gaps without weakening Desktop's
destructive authority:

1. hosted canonical autosave cannot satisfy the route's destructive step-up;
2. hosted specialist list/read/hydration are absent and create/edit/delete do
   not carry valid authority; and
3. hosted read collapses every failure to an empty document, permitting mount
   initialization to reset existing work.

It does not authorize a global auth redesign, persistent grants, Electron IPC
changes, Core/Flux changes, release promotion, or reuse of continuous edit
authority for reset, delete, or restore.

## Dependency and ownership

The hostile Constitution filesystem correction lands first because it owns the
same bridge/archive paths and must establish the sole main-process specialist
ID resolver, strict discriminated readers, symlink/race confinement, and atomic
create primitives. This packet must branch from that accepted root commit so it
cannot reintroduce rejected pathname or stale-snapshot behavior.

## Authority contract

- Keep `requireDestructive` and its password/lockout semantics unchanged for
  issuing edit authority and for each reset, delete, and restore action.
- Add a Constitution-only in-memory edit-grant store. Grants have 256-bit
  entropy, a fixed five-minute non-sliding TTL, and are retained only as a
  SHA-256 digest.
- Bind every grant to the authenticated user, hash of the current session
  token, exact scope, and—when specialist-scoped—the exact validated specialist
  ID.
- The only continuous scopes are `canonical-edit` and `specialist-edit`.
  Neither scope authorizes reset, delete, restore, another specialist, or grant
  issuance.
- Revoke on logout and best-effort page teardown. Session refresh/password
  change naturally invalidates token-hash-bound grants. Expiry remains
  authoritative if teardown delivery fails.
- Passwords, raw session tokens, raw grants, and Constitution prose never enter
  local/session storage, logs, audit metadata, or persisted server state.
- Every hosted mutation retains authenticated session, operator-network, and
  CSRF enforcement. CSRF uses the existing signed cookie plus `_csrf` body
  contract; a custom header alone is not CSRF authority.

## Hosted HTTP contract

- `GET /api/constitution` returns only `{state:'present',content}` or
  `{state:'absent'}`. Only ENOENT is absent. Other I/O returns a stable generic
  error code with no path, prose, or raw parser message.
- `POST /api/constitution/initialize` atomically creates the shipped default
  only when absent and returns `{state:'created'|'existing'}`. It never
  overwrites a race winner or existing authored file.
- `POST /api/constitution/edit-grant` performs one unchanged destructive
  password step-up and returns the bounded opaque grant.
- `POST /api/constitution/edit-grant/revoke` is session-bound and idempotent.
- Canonical and specialist autosave require the matching edit-grant header plus
  the normal authenticated CSRF-valid request.
- Add authenticated specialist list and exact-ID read endpoints.
- Specialist creation is exact-ID and exclusive-create; a race/existing file is
  returned as `existing`, never overwritten.
- Reset, delete, and future restore each require their own fresh destructive
  confirmation/password. Edit grants are explicitly ignored as authority.

## Renderer journey

- Replace empty-string/boolean failure collapse with typed result and typed
  authorization errors.
- On hosted mount, initialize only after a strict `absent` result. A timeout,
  malformed response, 401, 403, 429, or server/filesystem failure preserves
  existing data, blocks the editor, and never calls initialize/reset/write.
- Prompt once when hosted editing begins, wipe password state immediately after
  grant issuance, and keep only the opaque grant in component memory.
- Debounced saves use the grant until fixed expiry. On authorization failure,
  preserve the unsaved draft, stop autosave, and visibly request step-up again.
- Hosted specialist list/open/create/edit/delete must use real HTTP routes;
  existing content is hydrated before editing. A create collision opens the
  existing specialist rather than replacing it.
- Page hide, unmount, and logout attempt grant revocation; no browser storage is
  used.

## File map

New:

- `src/process/webserver/routes/constitutionEditGrantStore.ts`
- `src/renderer/pages/settings/ConstitutionSettings/ConstitutionStepUpDialog.tsx`
- `tests/unit/webserver/constitutionEditGrantStore.test.ts`
- `tests/unit/renderer/constitutionSettings.dom.test.tsx`
- `tests/e2e/specs/constitution-webui.e2e.ts`

Modify after Safety integration:

- `src/process/services/constitution/constitutionArchive.ts`
- `src/process/bridge/constitutionBridge.ts`
- `src/process/webserver/routes/constitutionRoutes.ts`
- `src/process/webserver/routes/authRoutes.ts`
- `src/renderer/services/ConstitutionService.ts`
- `src/renderer/pages/settings/ConstitutionSettings/index.tsx`
- `src/renderer/pages/settings/ConstitutionSettings/SpecialistOverlays.tsx`
- `src/renderer/pages/settings/ConstitutionSettings/SpecialistOverlayEditor.tsx`
- focused bridge, route, service, DOM, guard, archive, and WebUI tests.

Electron preload/types remain byte-contract compatible through native wrapper
methods. No DB schema, Core, Flux, WS, or CLI contract changes are required.

## Required proof

- Grant-store hostile unit matrix: entropy/hash-only retention, TTL equality,
  wrong session/user/scope/target, revoke grant/session, lazy expiry sweep.
- Filesystem matrix: ENOENT-only absence, unreadable failure, exclusive create,
  race winner preservation, invalid/traversal ID, and fail-closed list/stat.
- Real route/guard matrix: issuance performs destructive step-up once; edit
  grant permits only its exact target; edit grant cannot reset/delete/restore;
  401/403/429/expiry and CSRF failures preserve data; no raw error/prose leak.
- Renderer/service matrix: discriminants survive, no `''` fallback, absent-only
  initialization, unsaved draft survives reauthorization, password is wiped,
  hosted specialists hydrate and round-trip, teardown revokes.
- Non-skipped WebUI E2E using actual login and CSRF: canonical autosave across
  one short-lived grant, expiry and wrong-session denial, specialist
  create/list/read/edit/delete, separate reset/delete step-up, logout
  invalidation, and hostile CSRF omission/replay.
- Native Constitution wiring remains green.
- TypeScript, scoped zero-error lint, diff validation, aggregate Vitest plus all
  Bun-native suites, and independent source-tracing re-audit report zero HIGH.

```gate-result
{"gate":"hosted-constitution-corrective-packet","status":"hold","verdict":"AUTHORIZED_AFTER_HOSTILE_FILESYSTEM_DEPENDENCY","unresolved_critical":0,"unresolved_high":3,"next_action":"integrate and re-audit Constitution filesystem safety, then execute this packet in a new isolated worktree; do not weaken destructive authority or claim hosted parity before real guard/CSRF E2E"}
```
