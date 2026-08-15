---
phase: WLD-K-core-first
plan: K-01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/process/agent/wcore/desktopProfileSplice.ts (new)
  - src/process/agent/wcore/projectConfigLease.ts
  - src/process/agent/wcore/index.ts
  - tests/unit/process/agent/wcore/desktopProfileSplice.test.ts (new)
  - tests/unit/process/agent/wcore/projectConfigLease.test.ts (extended)
  - tests/unit/process/agent/wcore/wcoreGlobalMcpProfile.test.ts (new)
  - tests/integration/wcore/globalProfileCrashRecovery.test.ts (new)
  - tests/integration/wcore/fixtures/globalProfileWriteHarness.ts (new)
  - tests/live/wcoreGlobalProfileDualVersion.live.test.ts (new)
autonomous: false
blocking: true
requirements: [PRF-01, PRF-02, PRF-03, PRF-04, PRF-05, PRF-06, PRF-07, PRF-08]
---

> **Source of truth:** `ROADMAP.md` `### Phase K-01` and `REQUIREMENTS.md` `### Phase K-01` (PRF-01
> … PRF-08), both dated 2026-08-08. The mechanism decision (option A — move the launch profile into
> `resolveActiveConfigDir()`) is LOCKED by Sean and two rounds of Codex 5.6 Sol / Kimi K3 cross-
> research; do not re-litigate it. Every identifier and line region cited below was read live at
> this worktree's HEAD before writing this plan. Where a design choice below (the lease-key scope,
> the fail-closed posture on an unparseable global file, hoisting `waylandHome` resolution, and
> rejecting `withProfileAuthorityLock` reuse) is THIS plan's own derivation rather than something
> already decided upstream, it is called out explicitly so the executor knows it is not free to
> silently pick a different shape.

<objective>
Core 0.12.26 added workspace-trust fingerprinting that strips `[profiles.*]` from **project**
config (`<workspace>/.wayland-core.toml`) when the workspace is untrusted. Desktop currently writes
its launch-local `[profiles.__wayland_desktop_session]` MCP-narrowing table into exactly that file,
so the profile silently vanishes and Core exits "Profile not found" — a ship blocker on 0.12.26 that
does not reproduce on the already-shipped 0.12.25 (global config is unaffected by the strip either
way).

**The fix (locked):** write the profile into the config root the engine is already pointed at —
`resolveActiveConfigDir()` → `WAYLAND_HOME`/`config.toml` — instead of the workspace project file.
Verified by execution on 0.12.26-rc.2: symlinks present, no trust flag, `[mcp] Connected to
'tvcontrol': 101 tools`, turn completed. Keep the workspace `.wayland-core.toml` write for anything
genuinely project-scoped (provider compat overrides via `sanitizeProjectConfig`); only the profile
block moves.

**Why the narrowing profile exists at all (do not "simplify" it away):** Core's profile filter is
purely subtractive (`retain` on `mcp_servers`). Desktop injects stdio connectors per-session at
runtime, but connectors published into the global `config.toml` load at startup for EVERY chat — the
profile allow-list is what stops a connector that is OFF for this chat from leaking into it.

**Read live at this worktree's HEAD (grounds every task below):**

- `src/process/agent/wcore/index.ts:120-155` `sanitizeProjectConfig` — the EXISTING sanitizer for
  the workspace file does a full smol-toml `parse`+`stringify` round trip. That is correct there (a
  small, Desktop-managed transient file) and explicitly FORBIDDEN for the new global-file splice
  (PRF-04) — a round trip destroys comments/formatting in the user's hand-edited real `config.toml`.
- `src/process/agent/wcore/index.ts:389-548` `startWithProjectConfigLease` — today computes
  `effectiveProjectConfig = appendDesktopMcpProfile(projectConfig, mcpServerNames)`, pushes
  `--profile __wayland_desktop_session` into `args`, and writes the merged result to the WORKSPACE
  file via `writeProjectConfig`. Immediately after (line ~535-547) it separately resolves
  `waylandHome` (`this.options.waylandHome ?? await resolveActiveConfigDir()`, fail-closed only on
  `ProfileIsolationError`) for the spawn's `WAYLAND_HOME` env var. **These two things must become the
  SAME resolution**, done ONCE, before the profile write, or the splice target and the actual spawn
  env can diverge (TOCTOU).
- `src/process/agent/wcore/index.ts:1745-1795` `writeProjectConfig`/`restoreProjectConfig` — the
  reusable shape: `recoverProjectConfigTransaction(configPath)` first (heal a stale journal before
  treating on-disk bytes as ground truth), read via `readProjectConfigNoFollow` (lstat/no-follow, no
  symlink-swap read), `ProjectConfigTransaction.begin(configPath, written)`, restore via
  `transaction.restore()` gated on `this.ready` in `start()`'s `finally`.
- `src/process/agent/wcore/projectConfigTransaction.ts` (full file) — `ProjectConfigTransaction`
  ALREADY hash-checks on **every** restore, not only crash recovery: `restore()` delegates to
  `recoverProjectConfigTransaction`, which computes `ownsCurrent = sha256(current on-disk bytes) ===
state.replacementSha256` (read fresh from the marker) before touching the target — a mismatch
  (user edited the file) is left completely alone. `tests/unit/process/agent/wcore/
projectConfigTransaction.test.ts` already proves this (`'preserves a user edit made after the
temporary file was published'`). **This means PRF-02/PRF-03's transactional/hash-ownership floor
  is REUSE, not new work** — the new work is routing a NEW target (the global `config.toml`) through
  this exact same machinery, never reimplementing a naive whole-file restore for it.
- `src/process/agent/wcore/projectConfigLease.ts` (full file) — `withWCoreProjectConfigLease` is a
  per-key (realpath-of-workspace) promise-tail map spanning write → task-body → release, already
  proven (`tests/unit/process/agent/wcore/projectConfigLease.test.ts`) to serialize same-key callers
  and NOT serialize different keys. The global config path needs the identical shape, keyed
  differently (see Task 2).
- `src/process/agent/wcore/profilePaths.ts` (full file) — `resolveActiveConfigDir`/
  `resolveActiveConfigPath` are the single source of truth Core's spawn env and
  `configMcpServers.ts`'s existing reader both already trust. `withProfileAuthorityLock` is a single,
  **global, non-reentrant** FIFO queue used by `acquireRuntimeLaunchAuthority` /
  `acquireProfileLaunchLease` for brief marker/ref-count mutations — see the explicit rejection of
  reusing it in Task 2 and `T-K01-04` below.
- `src/process/agent/wcore/envBuilder.ts:407-424` `appendDesktopMcpProfile`/
  `WCORE_DESKTOP_MCP_PROFILE` — already a pure fragment builder: called with a `null` base it returns
  ONLY the `[profiles.__wayland_desktop_session]` block. Reused UNCHANGED (zero edits to this file);
  only its call site moves.
- `src/process/agent/wcore/configMcpServers.ts` — reads `[mcp.servers]` from the SAME
  `resolveActiveConfigPath()` file for runtime-injection dedup. Reviewed: unaffected by this plan —
  we only ever touch the disjoint `[profiles.*]` key, never `[mcp.servers]`.
- `tests/unit/wcoreProjectConfig.security.test.ts` — the existing behavioral-test pattern
  (`new WCoreAgent(...) as unknown as {...}` to reach private methods without spawning a process) is
  reused for the new global-profile methods in Task 1.
- `tests/live/openclawGatewayHandshake.live.test.ts` + `vitest.live.config.ts` — the house pattern
  for an execution-only proof that needs real external state (here: real wcore binaries + a live
  provider key), excluded from the default suite, run by hand, WITH a negative control. Reused for
  Task 4's dual-version live suite.

**Design decisions this plan makes (not pre-decided upstream — do not deviate without re-reading the
reasoning below):**

1. **Do NOT extend `withProfileAuthorityLock`.** That queue is non-reentrant and shared by every
   profile (named and native). Holding it across an entire splice-write → Core-ready → restore
   window would (a) serialize every OTHER chat's unrelated `acquireProfileLaunchLease`/
   `acquireRuntimeLaunchAuthority` call behind this one native-profile write, and (b) self-deadlock
   the moment any code on that path re-enters it (e.g. a process-exit handler calling
   `retainResolvedProfile`'s `release()`, which itself acquires the same queue) — see `T-K01-04`.
   Instead, extend `projectConfigLease.ts` with a SECOND, independent keyed lease
   (`withGlobalWCoreProfileLease`), mirroring `withWCoreProjectConfigLease`'s exact shape. Keying it
   on the resolved config **path** (not a fixed constant) gives the correct scope for free: every
   `@native` launch shares one key (the "hotter" key called out in the problem statement); a named
   profile's launches key on that profile's OWN `config.toml` path, so they never contend with
   `@native` traffic — no special-casing needed at the lease layer.
2. **Hoist `waylandHome` resolution.** `start()` resolves `waylandHome` (async, via a new
   `resolveWaylandHomeForLaunch()` extracted verbatim from today's inline block) ONCE, before
   acquiring either lease, and threads that single value into both the lease key AND
   `startWithProjectConfigLease`'s spawn env — so the splice target and Core's actual `WAYLAND_HOME`
   can never diverge, and today's `ProfileIsolationError` fail-closed / other-error warn-and-continue
   contract is preserved byte-for-byte, just relocated.
3. **Fail closed on an unparseable EXISTING global file — refuse to touch it, do not discard it.**
   `sanitizeProjectConfig`'s existing posture for the small workspace file is "unparseable → discard
   user content, write only the app's known-good config." That is wrong for the global `config.toml`
   — it also holds the user's real providers, credentials handles, and memory/skills settings, so
   discarding it would be catastrophic data loss, not a benign reset. The new splice throws a named,
   classifiable error (`DesktopProfileSpliceError`) instead, and the launch fails with that message
   rather than risking any write. Rich UI surfacing of this error is K-02's job (`DIA-01`/`DIA-02`,
   NOT this phase) — here it only needs to be a real thrown `Error`, propagated through the existing
   generic reject path `start()` already has.

**Explicitly OUT of scope for this plan (do NOT touch):**

- Migrating `@native` users onto a Desktop-owned named profile (REQUIREMENTS.md "Out of scope for
  WLD-K"; carries `memory.db`/credentials/skills, a separate validated project).
- Option F (`only_for_assistant`) or Option C (ephemeral `WAYLAND_HOME`) as narrowing mechanisms —
  both rejected upstream.
- Re-opening `--trust-workspace` in any form (reverted `3ebacf41c`).
- K-02's UI-level failure surfacing (`DIA-01`/`DIA-02`) and K-03's turn-completion bug (`TRN-*`) —
  independent phases, untouched here.
- K-04's `ENG-01` ask to Core for a `--mcp-server`/`--no-mcp-servers` flag — this plan is what makes
  Desktop correct with the profile mechanism Core has TODAY; ENG-01 is the forward-looking ask that
  can retire option A later.
- Bumping `DEFAULT_WCORE_VERSION` in `scripts/prepareWaylandCore.js:213` — stays `v0.12.25`. Every
  0.12.26 proof in this plan uses `WCORE_VERSION=v0.12.26-rc.2` as an env override, never a pin edit.
- `envBuilder.ts` — zero edits. `appendDesktopMcpProfile` is reused exactly as it stands today.

Purpose: a fresh Wayland Core launch with Desktop's MCP narrowing profile succeeds on both engine
versions because the profile lives where Core's untrusted-workspace policy cannot strip it, without
weakening the transactional/hash-ownership/never-clobber guarantees the workspace file already has.
Output: one new pure splice module, one new keyed lease, the `index.ts` wiring/hoist that routes the
profile write to the global config root, a permanent automated crash-recovery regression test, and a
manual dual-version live-execution proof scaffold.
</objective>

<tasks>

**Task 1 — Wave 0: write the new tests FIRST (commit `test(K-01): add RED coverage for the global
MCP profile splice`).** Author every test below against TODAY's code, before any production edit.
All new assertions are RED (the modules/methods do not exist yet); nothing pre-existing regresses.

- **New file `tests/unit/process/agent/wcore/desktopProfileSplice.test.ts`** — pure tests for
  `spliceDesktopMcpProfile(existing: string | null, fragment: string): string` and
  `DesktopProfileSpliceError` from `@process/agent/wcore/desktopProfileSplice` (no fs, no
  `WCoreAgent`; build the `fragment` input via the real `appendDesktopMcpProfile(null, names)` from
  `envBuilder.ts` so the tests exercise the real fragment shape, not a hand-typed stand-in). Assert:
  1. `existing: null` → the result is exactly the fragment, and it parses via `smol-toml`'s `parse`
     with `profiles.__wayland_desktop_session.mcp_servers` equal to the given names.
  2. A realistic existing global `config.toml` containing an unrelated `[providers.anthropic]` table
     AND a line comment (e.g. `# my note`) → the result contains the comment text and the
     `[providers.anthropic]` table VERBATIM (byte-for-byte substring), proving the splice is textual,
     not a parse/stringify round trip (a round trip would silently drop the comment — this is the
     PRIMARY automated anti-round-trip guard, stronger than a source grep because it fails the moment
     anyone "simplifies" the implementation back to `parse`+`stringify`).
  3. An existing file that ALREADY contains a stale `[profiles.__wayland_desktop_session]` table
     (simulating a prior crash or a second sequential launch) → the result contains exactly ONE
     `profiles.__wayland_desktop_session` occurrence, carrying the NEW server names, and still parses
     (proves no duplicate-key TOML is ever produced).
  4. Splicing twice in a row (feed the Task-1-#3 output back in as `existing` with a different name
     set) is idempotent in shape: still exactly one occurrence, no growing trailing blank lines
     (compare `result.split('\n\n\n').length` stays 1, or an equivalent no-triple-newline check).
  5. `existing` that is not valid TOML at all (e.g. an unterminated string) → throws
     `DesktopProfileSpliceError` (assert `instanceof` and that `.message` names the reserved table)
     and does NOT return a string — this is the fail-closed proof for the "never discard the user's
     real config" decision above; contrast explicitly in a comment with `sanitizeProjectConfig`'s
     discard-on-fail-closed posture for the workspace file, and state why the global file must not
     take that path.
     RED: the module does not exist (import fails).
- **Extend `tests/unit/process/agent/wcore/projectConfigLease.test.ts`** — add a new
  `describe('WCore GLOBAL profile config lease', ...)` block importing
  `withGlobalWCoreProfileLease` from the same `@process/agent/wcore/projectConfigLease` specifier.
  Mirror the FOUR existing `withWCoreProjectConfigLease` cases verbatim in shape, substituting a
  config-dir path for a workspace path: (a) serializes two callers keyed on the same dir through
  write→task→release order, (b) does NOT serialize two callers on different dirs, (c) two distinct
  dirs stay independent even when resolved concurrently, (d) the exported key is the config **path**
  (dir + `config.toml`), not the bare dir, by asserting two different dirs never share a queue slot.
  RED: import fails.
- **New file `tests/unit/process/agent/wcore/wcoreGlobalMcpProfile.test.ts`** — reuse the
  `new WCoreAgent(...) as unknown as {...}` cast pattern from `tests/unit/wcoreProjectConfig.security.test.ts`
  to reach the new private `writeGlobalMcpProfile(targetDir: string, serverNames: readonly
string[]): void` and `restoreGlobalMcpProfile(): void` methods directly (no process spawn). Use a
  fresh `mkdtempSync` dir as `targetDir` standing in for a resolved `WAYLAND_HOME`. Assert:
  1. Fresh dir (no `config.toml` yet) → after write, `<targetDir>/config.toml` exists and parses with
     the given server names under `profiles.__wayland_desktop_session.mcp_servers`; restore REMOVES
     the file entirely (mirrors `ProjectConfigTransaction`'s "no original existed" branch).
  2. Pre-existing `config.toml` with real content INCLUDING a comment → after write, the comment and
     unrelated tables survive verbatim and the profile table is present; `restore()` returns the file
     to the EXACT original bytes (`toBe`, not a parsed-equality check).
  3. **PRF-07, literal (the "user edit during the launch window" proof):** write, THEN directly
     `writeFileSync` the SAME path with different "user-edited" content (simulating an external save
     mid-window), THEN call `restoreGlobalMcpProfile()` → assert the file on disk is the user's edited
     bytes, not the pre-write snapshot. This exercises the SAME hash-ownership machinery already
     proven in `projectConfigTransaction.test.ts`, now proven through the actual `WCoreAgent` methods
     this plan adds.
  4. An unparseable pre-existing `config.toml` → `writeGlobalMcpProfile` throws
     `DesktopProfileSpliceError`; the file on disk is untouched (byte-identical to before the call) —
     no transaction/marker/backup files are left behind.
  5. **PRF-08 (no unrelated behaviour change):** construct the agent, call the equivalent of the
     CURRENT flow's workspace write (`writeProjectConfig`) with `projectConfig` content that carries
     NO `[profiles.*]` fragment, and assert the workspace `.wayland-core.toml` never gains a
     `profiles.__wayland_desktop_session` key — the two writers are now fully independent.
     RED: the two new methods do not exist yet (cast still compiles against the type, calls throw
     "not a function" / TS structural mismatch depending on how the executor stages this — either way,
     red).
     Verify: `bun run test:vitest desktopProfileSplice`, `bun run test:vitest projectConfigLease`,
     `bun run test:vitest wcoreGlobalMcpProfile` — all new assertions RED, zero pre-existing regressions.
     Done: all three files committed as `test(K-01): ...` before any production file changes; every new
     assertion above is RED against today's code.

**Task 2 — GREEN: route the profile write to the global config root (commit `fix(K-01): move the
launch-local MCP profile out of project config`).** Flips every Task-1 assertion GREEN. Touch ONLY
the sites named.

- **New `src/process/agent/wcore/desktopProfileSplice.ts`** — a leaf pure module (no fs, no imports
  of `index.ts`). Export `class DesktopProfileSpliceError extends Error { readonly code =
'DESKTOP_PROFILE_SPLICE_INVALID' as const; }` (mirror `ProfileIsolationError`'s `code` pattern) and
  `spliceDesktopMcpProfile(existing: string | null, fragment: string): string`:
  - Parse `existing ?? ''` with `smol-toml`'s `parse` FIRST for validation only (never use the parsed
    object for output) — an unparseable non-empty `existing` throws `DesktopProfileSpliceError`
    naming the reserved table and stating the file must be fixed by hand before Desktop can launch
    against it.
  - Textually remove every occurrence of the reserved table: a line-anchored match on a TOML header
    whose dotted path is exactly `profiles.__wayland_desktop_session` or starts with
    `profiles.__wayland_desktop_session.` (a dotted continuation table), consuming that header line
    plus every following line up to (not including) the next line that opens a NEW `[...]` header, or
    end of file — applied as a global replace so multiple/adjacent occurrences (stale crash leftover,
    or a continuation sub-table) are ALL removed in one pass. `__wayland_desktop_session` is reserved
    and double-underscore-prefixed, so no legitimate user table or comment can collide with it.
  - Append the given `fragment` at the end using the SAME base/blank-line joining convention
    `appendDesktopMcpProfile` already uses (`trimmedExisting ? `${trimmedExisting}\n\n${fragment}` :
fragment`) so formatting stays consistent with the rest of the codebase.
  - Validate the FINAL spliced string parses via `smol-toml`'s `parse` before returning it; throw
    `DesktopProfileSpliceError` on failure (defensive — should be unreachable given a validated
    `existing` plus an app-generated `fragment`, but PRF-04 requires the explicit check).
  - Head comment: textual splice ONLY; structured round-trip (`parse`+`stringify`) is FORBIDDEN here
    because it destroys comments/formatting in a file the user hand-edits — contrast with
    `sanitizeProjectConfig`'s round trip, which is fine for the small Desktop-managed workspace file
    but not for this one.
- **`src/process/agent/wcore/projectConfigLease.ts`** — add a second exported function
  `withGlobalWCoreProfileLease<T>(configDir: string, task: () => Promise<T>): Promise<T>`, copying
  `withWCoreProjectConfigLease`'s promise-tail-map shape exactly (own `Map` — name it
  `globalProfileLeaseTails`, do NOT share `leaseTails` with the workspace lease, to keep the two
  keyspaces visibly and structurally distinct even though a collision is not realistically possible).
  Key on `join(configDir, 'config.toml')` (not the bare dir) — this is the SAME path
  `resolveActiveConfigPath()`/`configMcpServers.ts` already treat as the file identity. Comment:
  every `@native` launch shares this exact key ("hotter" than the per-workspace lease); a named
  profile's launches key on that profile's own path and never contend with `@native` traffic —
  no profile-identity branching needed here, the key IS the scope. Do NOT call, wrap, or nest this
  inside `withProfileAuthorityLock` (see the rejected-reuse rationale in `<objective>` and
  `T-K01-04`).
- **`src/process/agent/wcore/index.ts`:**
  - Import `spliceDesktopMcpProfile`, `DesktopProfileSpliceError` from `./desktopProfileSplice` and
    `withGlobalWCoreProfileLease` from `./projectConfigLease` (a distinct export from the already-
    imported `withWCoreProjectConfigLease`, same module specifier).
  - Add `private globalProfileConfigTransaction: ProjectConfigTransaction | null = null;` alongside
    the existing `projectConfigTransaction` field.
  - Extract a new `private async resolveWaylandHomeForLaunch(): Promise<string | undefined>` whose
    body is the CURRENT inline block verbatim (grep for `let waylandHome = this.options.waylandHome`
    near the spawn's `WAYLAND_HOME` resolution): return `this.options.waylandHome` unchanged when
    already set OR `this.options.rawEngineMode` is true; otherwise `await resolveActiveConfigDir()`,
    rethrowing only `ProfileIsolationError` and warn-and-continuing (returning `undefined`) on any
    other failure — byte-identical fail-closed/fail-open contract, just relocated into its own
    method. Remove the original inline block from `startWithProjectConfigLease` entirely (do not
    leave a duplicate resolution).
  - Add `private writeGlobalMcpProfile(targetDir: string, serverNames: readonly string[]): void` —
    synchronous, mirroring `writeProjectConfig`'s shape: `const configPath = join(targetDir,
'config.toml'); recoverProjectConfigTransaction(configPath);` (heal a stale journal from a prior
    crashed launch BEFORE trusting on-disk bytes as ground truth — same reasoning as the existing
    call in `writeProjectConfig`), then `readProjectConfigNoFollow(configPath)` (reuse — never a
    fresh unguarded read of the user's real config), build the fragment via
    `appendDesktopMcpProfile(null, serverNames)` (UNCHANGED import from `envBuilder.ts`), splice via
    `spliceDesktopMcpProfile`, then `this.globalProfileConfigTransaction =
ProjectConfigTransaction.begin(configPath, spliced)`. Let `DesktopProfileSpliceError` propagate
    (do not swallow it — this is the deliberate fail-closed launch failure).
  - Add `private restoreGlobalMcpProfile(): void` — byte-for-byte mirror of `restoreProjectConfig`
    (null out `this.globalProfileConfigTransaction`, call `.restore()` in a try/catch that logs and
    keeps the journal on failure for the next launch to heal — never delete the only recovery
    evidence after a failed restore).
  - **In `start()`:** resolve `waylandHome` ONCE via `const waylandHome = await
this.resolveWaylandHomeForLaunch();` before either branch. Raw-engine branch becomes
    `return this.startWithProjectConfigLease(this.options.workspace, waylandHome);` (harmless no-op
    resolution for that mode, since the method itself returns `this.options.waylandHome` unchanged
    when `rawEngineMode`). Non-raw branch nests the NEW lease INSIDE the existing workspace lease, in
    that fixed order, at this one call site only (do not add a second acquisition site with the
    opposite nesting — that is what would create an ABBA risk; a single, always-same-order call site
    cannot deadlock against itself):
    `withWCoreProjectConfigLease(workspace, canonicalWorkspace => withGlobalWCoreProfileLease(waylandHome ?? nativeConfigDir(), async () => { try { await this.startWithProjectConfigLease(canonicalWorkspace, waylandHome); } finally { const consumed = this.ready || (!this.childProcess && !this.failedShutdownChild); if (consumed) { this.restoreProjectConfig(); this.restoreGlobalMcpProfile(); } } }))`
    — note `async () =>`, not `() =>`: the callback awaits, so a plain arrow will not compile. An
    earlier draft of this line had that bug; the plan-checker caught it. Treat this snippet as
    shape-only and let `tsc --noEmit` in the Task 2 verify step be the authority.
    — restore BOTH transactions under the exact same `consumed` gate that already governs the
    workspace restore (Core's ready event is the SAME "config ingestion confirmed" signal for both
    targets, since it is the SAME process reading both files).
  - **In `startWithProjectConfigLease(workspace = this.options.workspace, resolvedWaylandHome?:
string)`:** add the second parameter. Replace the current
    `effectiveProjectConfig = appendDesktopMcpProfile(projectConfig, mcpServerNames)` /
    `writeProjectConfig(effectiveProjectConfig, workspace)` pairing with: when `!rawEngineMode &&
mcpServerNames !== undefined`, push `--profile` `WCORE_DESKTOP_MCP_PROFILE` into `args` (UNCHANGED)
    and call `this.writeGlobalMcpProfile(resolvedWaylandHome ?? nativeConfigDir(), mcpServerNames)`
    instead of folding the profile into the workspace content; separately, `if (projectConfig)
this.writeProjectConfig(projectConfig, workspace)` — now carrying ONLY genuinely project-scoped
    content, never the profile fragment (this is PRF-08). Replace the later inline `let waylandHome =
this.options.waylandHome; if (...) { waylandHome = await resolveActiveConfigDir(); ... }` block
    with `const waylandHome = resolvedWaylandHome;` — everything downstream (`resolveSpawnVaultPassphrase(waylandHome)`,
    `buildEngineSpawnEnv({ ..., waylandHome, ... })`) keeps referencing the same binding name,
    unchanged. Grep the function body first to confirm no OTHER read of the removed inline block
    exists between where it was and the spawn call before deleting it.
  - Do NOT touch `sanitizeProjectConfig`, the Desktop-contract fail-closed path, `envBuilder.ts`, or
    `configMcpServers.ts` — all byte-identical apart from the sites named above.
    Verify: `bun run test:vitest desktopProfileSplice` GREEN; `bun run test:vitest projectConfigLease`
    GREEN (both describe blocks); `bun run test:vitest wcoreGlobalMcpProfile` GREEN;
    `bun run test:vitest wcoreProjectConfig.security` GREEN, UNCHANGED (proves PRF-08 — the workspace
    sanitizer's own existing suite still passes byte-for-byte with zero edits to that file); full
    suite green; `tsc --noEmit` clean.
    Done: the MCP narrowing profile is written and hash-ownership-restored against the global config
    root via the reused `ProjectConfigTransaction`/`recoverProjectConfigTransaction` machinery, under
    a new lease keyed on that exact global config path, spanning write → `this.ready` → restore; the
    workspace file keeps carrying only project-scoped content.

**Task 3 — Real-process SIGKILL proof, permanent regression guard (commit `test(K-01): add a real
SIGKILL crash-recovery proof for the global profile splice`).** This is an EXECUTION proof, not a
simulated one: a genuinely separate OS process, running the real production modules, is actually
killed with `SIGKILL`, and recovery is proven against the same on-disk target afterward. Lands after
Task 2 so the harness has real machinery to exercise; stays green from the moment it is added and
runs forever after as part of the ordinary suite (`tests/integration/**/*.test.ts` is already in
`vitest.config.ts`'s default include).

- **New `tests/integration/wcore/fixtures/globalProfileWriteHarness.ts`** — a small standalone
  script (no test framework import) that: takes a target directory and a marker file path as CLI
  args, writes a realistic pre-existing `config.toml` is NOT its job (the parent test seeds that
  before spawning); imports `ProjectConfigTransaction` from `@process/agent/wcore/projectConfigTransaction`
  and `spliceDesktopMcpProfile`/`appendDesktopMcpProfile` (the real production code, not a
  reimplementation) to publish a spliced `config.toml` at `<targetDir>/config.toml`, then writes the
  marker file to signal "the write is durably on disk," then blocks forever (e.g. an unresolved
  `Promise` awaited at top level, or `setInterval` that never clears) so the parent test controls
  exactly when it dies.
- **New `tests/integration/wcore/globalProfileCrashRecovery.test.ts`** — `beforeEach`/`afterEach`
  around a fresh `mkdtemp` dir (mirror `projectConfigLease.test.ts`'s setup). The test: writes a
  realistic ORIGINAL `config.toml` (with a comment and an unrelated `[providers.x]` table) into that
  dir; records its exact bytes; spawns the harness via `child_process.spawn('bun', [harnessPath,
targetDir, markerPath], { stdio: ... })`; polls for the marker file to appear (the write is
  confirmed on disk); sends `child.kill('SIGKILL')`; awaits the child's `'exit'` event with `signal
=== 'SIGKILL'`; THEN calls the real `recoverProjectConfigTransaction(join(targetDir,
'config.toml'))` (the exact healing call `writeGlobalMcpProfile` already runs at the top of every
  launch) and asserts the file is now byte-identical (`toBe`) to the recorded original — no
  transaction marker or backup file left behind. This is the literal PRF-06 acceptance: "a launch
  killed mid-flight leaves the user's global config byte-identical to its pre-launch state, proven by
  a real kill test, not a simulated one."
  Verify: `bun run test:integration` (or `bun run test:vitest tests/integration/wcore`) green,
  including the new SIGKILL test; confirm it also runs under the default `bun run test:vitest` full
  suite (the glob already covers `tests/integration/**`).

  > **Disclosed coverage limit — do not overstate what this proves.** The harness reconstructs the
  > write from the same underlying primitives (`ProjectConfigTransaction`, `spliceDesktopMcpProfile`,
  > `appendDesktopMcpProfile`) rather than literally calling the private `writeGlobalMcpProfile`,
  > which cannot be invoked without standing up a whole `WCoreAgent`. The kill is real and the
  > recovery path is real, but a defect specific to `writeGlobalMcpProfile`'s **own sequencing** —
  > notably its pre-write `recoverProjectConfigTransaction` call — is exercised only by the Task 1
  > unit tests, not by this one. Raised by the plan-checker. Anyone citing this test as PRF-06
  > evidence must cite the Task 1 sequencing tests alongside it; on its own it is necessary, not
  > sufficient. If the 4-leg audit wants that gap closed, the fix is to expose a narrow internal
  > seam the harness can call directly — not to weaken the assertion.
  > Done: an actual OS-level `SIGKILL` of a real child process running real production code, followed
  > by real recovery, is part of the permanent, always-green suite — this class of regression cannot
  > silently return.

**Task 4 — Exit bar: full suite, scope proof, dual-version live execution, 4-leg cross-audit (human
checkpoint, no code commit).**

- **Automated floor:** `bun run test:vitest` (full unit + integration suite) green — record the
  before/after test count against the stated baseline (**16,231 tests, 0 failures**; this plan adds
  new tests, so the after-count should be baseline + new tests, still 0 failures). `tsc --noEmit`
  clean.
- **Grep gate (scope proof, PRF-08):** confirm `envBuilder.ts` and `configMcpServers.ts` are
  byte-identical to HEAD-before-this-plan (no diff at all); confirm the only occurrences of
  `appendDesktopMcpProfile(` outside its own definition and tests are the new call in
  `writeGlobalMcpProfile` (never re-appearing against the workspace `writeProjectConfig` path);
  confirm `sanitizeProjectConfig`'s body is unchanged (still the `parse`+`stringify` round trip, on
  purpose, for the workspace file only).
- **New `tests/live/wcoreGlobalProfileDualVersion.live.test.ts`** — author this scaffold (do not
  attempt to run it without real credentials/binaries; that is Sean's step below), matching
  `tests/live/openclawGatewayHandshake.live.test.ts`'s house shape: a head comment with the exact
  run recipe —
  `WCORE_VERSION=v0.12.25 WCORE_REQUIRE_VERIFIED=1 WCORE_FORCE_DOWNLOAD=1 node scripts/prepareWaylandCore.js`
  then `npx vitest run --config vitest.live.config.ts -t "0.12.25"`, repeated with
  `WCORE_VERSION=v0.12.26-rc.2` (adjust the exact rc tag if it has since promoted to stable — verify
  against the real GitHub release list before running, per the milestone's "any search returning
  zero is disbelieved" proof standard) and `-t "0.12.26"`. The suite drives a REAL `WCoreAgent.start()`
  with an MCP connector selected against a real provider (env-supplied API key,
  e.g. `WL_LIVE_PROVIDER_API_KEY`), sends one prompt that requires a tool call, and asserts an
  `mcp`-sourced tool result event is observed before `stream_end` — on BOTH versions. Include a
  NEGATIVE CONTROL mirroring the openclaw file's pattern: temporarily force the OLD (pre-fix)
  workspace-only write path (behind a test-only override hook, or by asserting against a
  pre-recorded 0.12.26 failure transcript if a live toggle isn't feasible) and assert it FAILS on
  0.12.26 — without this, a pass on the fixed path proves only that "some launch works," not that
  this fix is what made it work.
- **checkpoint:human-verify (Sean runs this by hand — needs real binaries + a real provider key, per
  the milestone's execution-only proof standard):**
  1. Run the dual-version live suite above on BOTH `v0.12.25` and `v0.12.26-rc.2`. Confirm the chat
     log line pattern already cited as proof in ROADMAP.md (`[mcp] Connected to '<server>': N tools`)
     appears on both, the negative control fails on 0.12.26 as expected, and the turn completes on
     both.
  2. Confirm `DEFAULT_WCORE_VERSION` in `scripts/prepareWaylandCore.js` is still `v0.12.25`
     (`git diff` on that file is empty).
  3. **4-leg cross-audit of the full diff** — Codex 5.6 Sol, Gemini 3.1 Pro, Kimi K3, internal
     `ferrox-code-reviewer`. This is the packet ROADMAP.md calls "the packet that must not be
     wrong" — every finding gets fixed or explicitly deferred with sign-off before merge, per the
     project's no-nits standard. Pay particular attention to: the lease nesting order in `start()`
     (confirm the single call site, no reversed-order acquisition anywhere else), the fail-closed
     behavior on an unparseable global `config.toml` (confirm no code path silently discards or
     partially writes it), and the splice regex's handling of adjacent/nested reserved-table headers.
     Resume-signal: "approved" (all four legs clean or findings fixed) or a description of what needs
     another pass.

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                                                                          | Description                                                                                              |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Desktop main process → the user's real global `config.toml`                       | a file the user also hand-edits, now mutated by a background transaction on every profile-bearing launch |
| concurrent chat launches (same `@native` profile) → the SAME global `config.toml` | multiple Desktop processes/chats can attempt a launch at once                                            |
| a killed/crashed Desktop process → the next launch's recovery pass                | crash recovery trusts on-disk state left by whichever process died                                       |

## STRIDE Threat Register

| Threat ID | Category               | Component                                                                                                                                                                            | Severity | Disposition | Mitigation Plan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-K01-01  | Tampering              | global `config.toml` write window (write → ready → restore)                                                                                                                          | high     | mitigate    | `ProjectConfigTransaction` + the new `withGlobalWCoreProfileLease` serialize every concurrent `@native` launch on the exact global config path; `readProjectConfigNoFollow` (lstat/no-follow, fd-identity recheck) is reused so a symlink swap of the user's real config between resolve and open cannot redirect the write; the pre-existing hash-ownership check in `recoverProjectConfigTransaction` governs the SAME restore call used for both crash recovery and the ordinary exit path.                                                 |
| T-K01-02  | Information disclosure | a leftover `[profiles.__wayland_desktop_session]` table surviving on disk after an unrecovered crash, visible if the user runs Core standalone before Desktop's next launch heals it | low      | accept      | the leaked content is only same-session MCP server NAMES already visible in Desktop's own Settings UI, never a credential; self-heals automatically on the very next Desktop launch via the pre-write `recoverProjectConfigTransaction` call — the same accepted posture the workspace `.wayland-core.toml` transaction already has today.                                                                                                                                                                                                     |
| T-K01-03  | Denial of service      | a hand-edited global `config.toml` that is not valid TOML makes any launch needing a profile refuse to spawn (deliberate fail-closed choice)                                         | medium   | mitigate    | refusing to touch an unparseable file — rather than discarding it the way the workspace sanitizer does — is the correct tradeoff for a file that also holds the user's providers/credentials/memory settings; `DesktopProfileSpliceError` carries a message naming the exact file to fix; rich in-UI surfacing of this failure is K-02's job, not reinvented here.                                                                                                                                                                             |
| T-K01-04  | Denial of service      | lock-ordering / reentrancy between the new global-config lease and the existing `withProfileAuthorityLock` FIFO queue                                                                | high     | mitigate    | the new lease is a SEPARATE keyed promise-tail map (own `Map`, mirrors `withWCoreProjectConfigLease`'s existing proven shape); it never calls into or nests inside `withProfileAuthorityLock`. `withProfileAuthorityLock`'s queue is non-reentrant — a nested call from inside a running operation would queue behind itself and hang — so reusing it for a window spanning an entire Core bootstrap was explicitly rejected (see `<objective>` design decision 1) to avoid both that self-deadlock and unrelated cross-profile serialization. |
| T-K01-SC  | Tampering              | supply chain (new dependency)                                                                                                                                                        | n/a      | accept      | `smol-toml` is already an existing dependency, used in the new splice module for `parse`-validation only (never `stringify`); no new package added. Package Legitimacy Gate N/A.                                                                                                                                                                                                                                                                                                                                                               |

</threat_model>

<verification>
- `bun run test:vitest` (full unit + integration suite) green at baseline-plus-new-tests, 0
  failures; `tsc --noEmit` clean.
- `desktopProfileSplice.test.ts`: null-existing → fragment alone; comments/unrelated tables survive
  verbatim (anti-round-trip proof); a stale duplicate is replaced, never doubled; idempotent across
  repeated splices; unparseable existing throws `DesktopProfileSpliceError` and returns nothing.
- `projectConfigLease.test.ts` (new describe block): `withGlobalWCoreProfileLease` serializes same-
  key callers and does not serialize different-key callers, mirroring the existing workspace-lease
  proof shape.
- `wcoreGlobalMcpProfile.test.ts`: fresh-dir write/remove-on-restore; real content + comments survive
  restore byte-for-byte; a user edit made DURING the lease window survives restore (PRF-07, literal);
  an unparseable existing global file throws and leaves the file untouched; the workspace write path
  never gains a `profiles.__wayland_desktop_session` key (PRF-08).
- `wcoreProjectConfig.security.test.ts`: unchanged, still fully green — proves the workspace
  sanitizer's existing behavior (provider-override stripping, non-provider preservation) is untouched
  by this plan.
- `tests/integration/wcore/globalProfileCrashRecovery.test.ts`: a REAL `SIGKILL` of a REAL separate
  process running the REAL production write path, followed by real
  `recoverProjectConfigTransaction`, leaves the global config byte-identical to its pre-launch state
  (PRF-06, literal, not simulated).
- `tests/live/wcoreGlobalProfileDualVersion.live.test.ts` (manual, both engine versions): a fresh
  profile with an MCP connector selected runs one prompt and executes a real MCP tool call on BOTH
  `v0.12.25` and `v0.12.26-rc.2`; the negative control (old workspace-only write path) fails on
  0.12.26, proving the fix — not just "some path works" — is what makes it pass.
- Grep gate: `envBuilder.ts` and `configMcpServers.ts` byte-identical to pre-plan HEAD;
  `sanitizeProjectConfig` unchanged; `appendDesktopMcpProfile` call sites limited to the fragment
  builder use inside `writeGlobalMcpProfile` and its own tests.
- 4-leg cross-audit (Codex 5.6 Sol, Gemini 3.1 Pro, Kimi K3, `ferrox-code-reviewer`) clean or every
  finding fixed/explicitly deferred with sign-off; LOCAL only, no merge/tag/release without Sean.

**Goal-backward check — each acceptance maps to "the profile lives where Core's untrusted-workspace
policy cannot strip it, without weakening the never-clobber guarantee":**

| Must be TRUE (goal)                                                                                                | Producer behavior that makes it true                                                                                                   | Proven by                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| A fresh launch with an MCP connector selected executes a real tool call on both engine versions (PRF-01)           | `writeGlobalMcpProfile` targets `resolveWaylandHomeForLaunch()`'s SAME resolved dir that `buildEngineSpawnEnv` uses for `WAYLAND_HOME` | `wcoreGlobalMcpProfile.test.ts` (write lands at the right path) + the dual-version live suite (real tool call, both versions) |
| The mutation is transactional, never leaves a partial write (PRF-02)                                               | `ProjectConfigTransaction.begin`/`recoverProjectConfigTransaction` reused unmodified for the new target                                | `globalProfileCrashRecovery.test.ts` (real SIGKILL)                                                                           |
| Hash-ownership governs EVERY restore, user's bytes win on mismatch (PRF-03/PRF-07)                                 | `restore()` always delegates to the hash-checking `recoverProjectConfigTransaction`, never a blind whole-file write                    | `wcoreGlobalMcpProfile.test.ts` test 3 (edit-during-window survives) + pre-existing `projectConfigTransaction.test.ts`        |
| Only the reserved table is spliced textually, validated before publish, no round trip (PRF-04)                     | `spliceDesktopMcpProfile` line-anchored removal + append + `parse`-only validation                                                     | `desktopProfileSplice.test.ts` (comment/table survival = anti-round-trip proof)                                               |
| Concurrent launches are serialised write → ingestion-confirmed → restore, keyed hotter than per-workspace (PRF-05) | `withGlobalWCoreProfileLease` keyed on the resolved config path, nested inside the workspace lease at one fixed call site              | `projectConfigLease.test.ts` new describe block + `T-K01-04` deadlock-avoidance rationale                                     |
| A killed launch leaves the file byte-identical (PRF-06)                                                            | transaction + lease + pre-write `recoverProjectConfigTransaction` healing                                                              | `globalProfileCrashRecovery.test.ts` (real kill)                                                                              |
| A user edit during the window survives (PRF-07)                                                                    | hash-ownership check leaves non-owned bytes untouched                                                                                  | `wcoreGlobalMcpProfile.test.ts` test 3                                                                                        |
| Project-scoped writes are retained, only the profile moved, no unrelated change (PRF-08)                           | `writeProjectConfig` now receives `projectConfig` alone, never the profile fragment; `envBuilder.ts`/`sanitizeProjectConfig` untouched | grep gate + `wcoreProjectConfig.security.test.ts` unchanged-and-green + `wcoreGlobalMcpProfile.test.ts` test 5                |

</verification>

<success_criteria>
The MCP narrowing profile Desktop injects per chat lives in the global config root
(`resolveActiveConfigDir()` → `config.toml`) instead of the workspace `.wayland-core.toml`, so Core
0.12.26's untrusted-workspace strip cannot remove it — proven by a real dual-version execution
(0.12.25 and 0.12.26-rc.2) that runs a prompt and executes an MCP tool. The write reuses the existing
`ProjectConfigTransaction`/`recoverProjectConfigTransaction` hash-ownership machinery unmodified,
under a new lease keyed on the global config path and nested inside the existing workspace lease at
one fixed call site, spanning write → Core-ready → restore. A real `SIGKILL` mid-launch leaves the
global config byte-identical to its pre-launch state; a user edit made during the launch window
survives restore. Only the reserved `[profiles.__wayland_desktop_session*]` table is ever touched
textually (validated, never round-tripped); the workspace file keeps carrying only genuinely
project-scoped writes with zero unrelated behavior change. Full suite (baseline 16,231 tests plus
this plan's additions) green, `tsc --noEmit` clean, 4-leg cross-audit clean or every finding
fixed/deferred with sign-off. `DEFAULT_WCORE_VERSION` stays `v0.12.25`.
</success_criteria>

<output>
Write `K-01-SUMMARY.md` when the packet is live-test-accepted, recording: the new
`desktopProfileSplice.ts` module (`spliceDesktopMcpProfile`/`DesktopProfileSpliceError`) and its
anti-round-trip proof; the new `withGlobalWCoreProfileLease` in `projectConfigLease.ts` and the
explicit rejection of reusing `withProfileAuthorityLock` (with the deadlock reasoning); the
`index.ts` changes (`resolveWaylandHomeForLaunch` extraction/hoist, `writeGlobalMcpProfile`/
`restoreGlobalMcpProfile`, the nested-lease wiring in `start()`, the narrowed
`startWithProjectConfigLease` signature); the new/extended test files and what each proves
(including which test is the literal PRF-06 and PRF-07 evidence); the real-SIGKILL integration test
result; the dual-version live-suite result (both engine versions, negative control outcome); the
grep-gate scope proof; the 4-leg cross-audit outcome; and explicit confirmation that
`DEFAULT_WCORE_VERSION` was not bumped.
</output>
