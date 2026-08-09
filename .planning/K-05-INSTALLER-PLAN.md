# K-05 agent installer - build plan (workflow output, 2026-08-09)

Produced by the `wld-agent-installer-spec` workflow: 6 agents, channel survey +
existing-machinery survey -> design -> security and Windows critiques -> plan.
Preserved here because the workflow output lived in a session temp dir that is
wiped on compact. Not yet executed, not yet audited by a human.

---

I have enough verified ground. Everything below is either quoted from files I opened or produced by a command I ran.

---

# K-05 BUILD PLAN — Agent installer, npm subset

## 0. Corrections to the inputs (these change the plan, not footnotes)

I ran the experiments the design and both critiques left as "not established". Five inputs were wrong.

| Claim | Source | Verdict |
|---|---|---|
| "auggie is the ideal first ship: zero deps, no postinstall" | DESIGN §6 | **False, twice over.** `@augmentcode/auggie@0.35.0` has `optionalDependencies: {"node-pty":"1.2.0-beta.14"}`, and node-pty declares `"install": "node scripts/prebuild.js \|\| node-gyp rebuild"` **and** `"postinstall": "node scripts/post-install.js"`. Worse — see below, auggie cannot satisfy INS-01 at all. |
| "bun lockfile integrity enforcement — not established" | DESIGN §3, SEC F4 | **Established. It works.** I tampered one `sha512` in a real `bun.lock`, cold cache: `error: Integrity check failed for tarball: @augmentcode/auggie`, **real exit code 1**, `node_modules/@augmentcode/auggie` absent. Clean run: exit 0. |
| Fix for registry redirect = "write a bunfig.toml pinning `registry`" | SEC F5(a) | **Disproven by execution.** With `$HOME/.npmrc` containing `@augmentcode:registry=https://registry.invalid.example.com/`, a cwd `bunfig.toml` with `[install] registry=…` **and** `[install.scopes]` both still failed (`FailedToOpenSocket`). The scoped `.npmrc` wins. **The fix that works is `HOME`→staging dir** — retested, install succeeded. |
| "`grep -rn mergeCredentials src` → one hit, the definition" | WIN critique | **False.** Two real call sites: `SessionLifecycle.ts:69` and `:219`, fed by `loadAuthCredentials()` (`typeBridge.ts:275`) via `AcpAgentV2.ts:216`. |
| "INS-01 is not achievable in K-05" | WIN critique | **False, but its instinct was right.** I proved INS-01 achievable — on qwen, not auggie. See §0.2. |

The design's `src/process/agent/acp/mcpStdioSpawn.ts` does not exist. Real path: **`src/process/services/mcpServices/mcpStdioSpawn.ts`**.

### 0.1 auggie cannot prove INS-01. Executed.

```
$ printf '…initialize…\n…session/new…' | env -i PATH=/usr/bin:/bin HOME=$CLEAN bun augment.mjs --acp
{"id":1,"result":{…"agentInfo":{"name":"auggie",…},"authMethods":[]}}
{"id":2,"error":{"code":-32000,"message":"Authentication required: Auggie does not currently
  support authenticating over ACP. Please run `auggie login` from your terminal then try again."}}
```

`authMethods: []` — there is nothing for `AuthNegotiator` to select, and the agent says so in prose. auggie is OAuth-terminal-only. Shipping it first would have burned the whole packet on an agent that structurally cannot reach "a chat runs on it".

### 0.2 qwen CAN prove INS-01, with no write outside our root. Executed.

```
id=1 OK keys=['protocolVersion','agentInfo','authMethods','agentCapabilities']
id=9 OK keys=[]            ← authenticate {methodId:"openai"}
id=2 OK keys=['sessionId','models','modes','configOptions']   ← session/new SUCCEEDED
$ find $HOME -maxdepth 2 -newermt '-3 minutes'   → (empty)
```

with `OPENAI_API_KEY` in the child env. Without the `authenticate` call: `-32000 Authentication required: Use Qwen Code CLI to authenticate first.` — **even with the key set.** Both halves are required, and nothing lands in `~/.qwen`. That is a clean FAN-03-compatible path.

Three code facts block it today:

1. `AuthNegotiator.selectAuthMethod` (`AuthNegotiator.ts:64-71`) requires `method.type === 'env_var'`. qwen's method is `{"id":"openai","name":"Use OpenAI API key",…,"_meta":{"type":"terminal","args":["--auth-type=openai"]}}` — **no top-level `type` at all**, so it is skipped and `authenticate` is never sent.
2. `BACKEND_AUTH_KEYS.qwen = ['DASHSCOPE_API_KEY']` (`typeBridge.ts`) — the wrong variable. The ACP path wants `OPENAI_API_KEY`.
3. `resolveBuiltinBackendConfig` returns `{ cliPath, customArgs, yoloMode }` (`AcpAgentManager.ts:1156`) — **no `customEnv`**. There is no UI or config path that puts a key into a builtin backend's spawn env. `acp.config[backend].authMethodId` / `.authToken` exist in `storage.ts:114-120` and have **zero consumers** (control: the same grep found 6 real `authToken` consumers in `remoteAgentBridge.ts` / `channelBridge.ts`).

---

## 1. Numbered task list

Every task states files, behaviour, the proving test, and the negative control (what must **fail** if the change is reverted).

---

### T1 — Structured spawn command. **Hard prerequisite for Windows.**

The design's Windows `cliPath` form is unparseable. I ran the real `parseWindowsCliPath` (`acpConnectors.ts:63-83`) on the exact string §4 prescribes:

```
in : "…\bundled-bun\win32-x64\bun.exe" "C:\Users\John Smith\…\cli-entry.js"
out: command    = …\bun.exe                                    ✓
     inlineArgs = ["\"C:\\Users\\John", "Smith\\…\\cli-entry.js\""]   ✗
```

Only the first quoted token is unquoted; the rest goes through `.split(/\s+/)` at `acpConnectors.ts:74` **with quotes retained**. `electron-builder.yml:233` sets `perMachine: true`, so `bun.exe` always lives under `C:\Program Files\Wayland` — the space is guaranteed, not an edge case. And `shell: false` (`acpConnectors.ts:281`) sends those bytes to `CreateProcess` verbatim.

The `.cmd` route is closed by the same `shell: false`, exactly as `src/process/services/mcpServices/mcpStdioSpawn.ts:19-22` records. Putting the entry in `acpArgs` is also closed: `resolveBuiltinBackendConfig` reads `acpArgs` from the static table, never from the detected agent —

```ts
const backendConfig = ACP_BACKENDS_ALL[data.backend];
if (backendConfig?.acpArgs) customArgs = backendConfig.acpArgs;
```
`AcpAgentManager.ts:1133-1136`

**Files** — `src/process/agent/acp/acpConnectors.ts` (add a `launch?: { command: string; args: string[] }` parameter to `createGenericSpawnConfig`, consumed verbatim ahead of the `isWindows` / Unix branches); `src/process/acp/types.ts`, `src/process/acp/compat/typeBridge.ts`, `src/process/task/AcpAgentManager.ts` (thread it through); `src/process/agent/acp/index.ts:1804` (`ensureBackendAuth` uses `this.extra.cliPath` raw — same fix or it re-breaks for claude/qwen login).

**Behaviour** — an installed agent carries `{command, args}`, never a command string. Both quote parsers are bypassed. `shell:false` untouched.

**Test** — `tests/unit/acpConnectors.test.ts`: assert a `launch` with a spaced absolute path yields exactly `command === '<abs bun.exe>'` and `args === ['<abs entry>', '--acp']`. Plus a guard test: `parseWindowsCliPath(<any manifest cliPath we generate>).inlineArgs.length === 0`.

**Negative control** — revert `launch` and the spaced-path test must fail with `args[0] === '"C:\\Users\\John'`. The existing suite only covers a single quoted token (`tests/unit/acpConnectors.test.ts:230-240`), which is why this was never caught; the new case must be red on the old code.

**Do not touch** the POSIX `cliPath.split(/\s+/)` at `acpConnectors.ts:270`. It is a real pre-existing defect (macOS userData contains a space) but it is a shared spawn path. File separately.

**Size: 1.5 d.**

---

### T2 — Install root, manifest, reconcile

**Files (new)** — `src/process/agent/install/installRoot.ts`, `installManifest.ts`.

**Root.** `<userData>/agent-installs/` on macOS/Linux. **On Windows use `%LOCALAPPDATA%`**, not `userData`: `ElectronPlatformServices.ts:52` resolves userData to `%APPDATA%` = roaming, and a 116 MB `node_modules` in a roaming profile causes logon sync storms and, under Folder Redirection, lands on an SMB share where `rename` is not atomic and AppLocker often blocks execution. Keep only `manifest.json` in `userData`. Shorten the Windows prefix to `%LOCALAPPDATA%\Wayland\ag\<id>\<ver>` — `MAX_PATH` is real and there is no `longPathAware` manifest in this repo (control: same grep style found `perMachine` at `electron-builder.yml:233`, so the zero is a real absence).

**Manifest.** Broadly the design's shape, with three changes:

- `cliPath: string` → `launch: { command: string; args: string[] }` (T1).
- `launch.command` must point at `agent-installs/<id>/current/…`, a **version-stable** junction (`fs.symlinkSync(target, link, 'junction')` on Windows, no elevation). Reason: `cliPath` is persisted into each conversation's `extra` (`storage.ts:529`) and read back as `data.cliPath`, which **outranks** the config override at `AcpAgentManager.ts:1101-1103`. A version-scoped absolute path strands every existing conversation on upgrade. The containment check must then carve out that one junction — junctions report `lstat().isSymbolicLink() === true`.
- `ownedPaths` is **display/audit only**, never an instruction (T7).

**`mkdir(..., { mode: 0o700 })`** for the root and `bin/`; assert `(stat.mode & 0o022) === 0` before contributing `bin/` to PATH. POSIX only — `__isAcceptableNpmStat` (`safeSpawn.ts:96-113`) records why NTFS mode bits are meaningless.

Manifest written with `writeAtomic` (`src/process/services/ijfw/atomicFile.ts:18`, temp at `0o600`).

**Reconcile** — the design's table is right and I am keeping it, including "an untracked dir with no manifest entry is GC'd; the manifest is the only authority". One change: **Repair regenerates the shim from `agentId` + `version` + the shipped pin file only**, never from manifest strings, and re-verifies `entryPointSha256` first. Otherwise no-dialog Repair is a no-consent write of an attacker-chosen exec line into a PATH directory.

**Test** — table-driven reconcile: each of the 5 disk states → expected `state`. Manifest round-trip through `writeAtomic`. Mode assertion.

**Negative control** — hand-write a manifest whose shim bytes differ from the recorded sha256; reconcile must return `foreign` and the agent must be absent from the registry. Revert the hash check and the test must go green-when-it-should-be-red (agent appears).

**Size: 2 d.**

---

### T3 — Pins, lockfiles, bump script, staleness gate

**Files (new)** — `scripts/agent-pins.json`; `resources/agent-installs/<agentId>/{package.json,bun.lock}`; `scripts/stage-agent-pin.mjs`; `scripts/check-agent-pins.mjs`. **Edit** `electron-builder.yml` (one `extraResources` entry beside `resources/bundled-bun` at `:129-130`).

Approach B from the design stands, and the lockfile mechanism is now **proven**, not assumed. `bun.lock` records per-package `sha512` — verified shape:

```
"@augmentcode/auggie": ["@augmentcode/auggie@0.35.0", "", {…}, "sha512-LM8yzgoj…"],
"node-pty":            ["node-pty@1.2.0-beta.14", "", {…}, "sha512-XORU9BQg…"],
```

`stage-agent-pin.mjs` copies `scripts/stage-wcore-bump.mjs`. `check-agent-pins.mjs` runs in the release gate and asserts:
1. pin file, shipped lockfiles and manifest contract version agree (the lockstep check whose absence let the engine pin drift 2 minors, #451);
2. no lockfile entry contains an `npm:` alias spec — an alias moves the trust anchor to a name the pin never states, which is exactly the live codex case (`"@openai/codex-darwin-arm64": "npm:@openai/codex@0.147.0-darwin-arm64"`);
3. pin age / distance from `latest`, fail past a threshold.

**Correction to the security critique's typosquat control:** "assert registry `repository.url` matches an expected owner" **cannot be universal** — `@augmentcode/auggie`, `@anthropic-ai/claude-code` and `opencode-ai` all publish with **no `repository` field**. Use it where present (qwen → `git+https://github.com/QwenLM/qwen-code.git`, gemini, copilot) and fall back to a pinned `_expectedMaintainers` list checked against the packument for the rest.

Surface the pinned version and its age on the Settings card.

**Test** — `check-agent-pins.mjs` unit tests over fixtures: alias spec → fail; lockstep mismatch → fail; stale pin → fail.

**Negative control** — a fixture lockfile containing `npm:` must make the checker exit non-zero; delete the alias rule and that fixture must pass.

**Size: 2 d.**

---

### T4 — Installer core

**Files (new)** — `src/process/agent/install/agentInstaller.ts`, `installLock.ts`, `installEnv.ts`.

**Lock.** `installLock.ts` **must be copied and parameterised** — `lockPath()` is hardcoded to `~/.ijfw/.install-lock` with no argument (`installLock.ts:25-27`). Two corrections to the design while copying: `acquireLock` **does steal stale locks** and **recurses unbounded** (`installLock.ts:83-90`) — the design's "the lock is not stolen" is wrong about the code it proposes to copy. Bound the recursion. And **take the lock *after* consent**, not before: `requireConfirmation` blocks indefinitely, so a tray-minimised app would hold the lock behind a modal nobody sees.

**Consent.** `requireConfirmation` (`webuiDirectAuth.ts:71-99`) — correct primitive, `defaultId: 1, cancelId: 1` so Enter and Esc both cancel. Add:
- `enforceRateLimit('agentInstall.install')` (`webuiDirectAuth.ts:33-57`, 5/60s) **before** the dialog, plus a process-wide single-flight. The per-agent lock does not help: loop nine agent IDs, get nine modals.
- Refuse when `BrowserWindow.getAllWindows().length === 0` — the parentless fallback at `webuiDirectAuth.ts:88-97` degrades consent to a dialog nobody sees.
- Build the entire `detail` from the pin record only; first statement of the handler is exact set membership of `agentId` in `Object.keys(ACP_BACKENDS_ALL)`.
- Cancel returns `{ ok: false, reason: 'cancelled' }` — do **not** copy `HubInstaller.ts:133-137`, which throws and logs cancel as `install_failed`.

Add `agentInstall.install` / `.uninstall` / `.repair` to `REMOTE_DENIED_KEYS` at `bridgeAllowlist.ts:283`, beside `wcoreUpdate.install`, whose comment transfers verbatim.

**Install env — do NOT reuse `buildChildEnv`.** `ALLOW_EXACT` is 16 keys (`envAllowlist.ts:10-27`) and omits `HTTP_PROXY`/`HTTPS_PROXY`/`NO_PROXY`, `NODE_EXTRA_CA_CERTS`/`SSL_CERT_FILE`, and every Windows-critical var. Two hard traps:

- `EXTRA_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/` (`envAllowlist.ts:29`) **throws** on `SystemRoot`, `ComSpec`, `ProgramFiles` — you cannot pass them via `extra`.
- On Windows `Object.entries(process.env)` enumerates **`Path`**, not `PATH`, so `ALLOW_EXACT.has(k)` misses it. **Not established on this machine — prove on the Windows box before relying on any allowlist copy.**

Write a dedicated `buildInstallEnv()` adding the proxy set, the CA set, and `SystemRoot`/`ComSpec`/`USERPROFILE`/`APPDATA`/`LOCALAPPDATA`/`PATHEXT`, case-insensitively.

**And set `HOME` (plus `USERPROFILE` on Windows) to the staging dir.** This is the executed fix for registry redirection — a planted `@scope:registry` in `$HOME/.npmrc` defeats a cwd `bunfig.toml` (both `[install] registry` and `[install.scopes]` failed), while `HOME`→staging neutralised it and the install succeeded. Set `BUN_INSTALL_CACHE_DIR` and `BUN_TMPDIR` inside staging too, or bun writes to `~/.bun/install/cache` and the "nothing outside our root" claim is false; `prepareCleanEnv` already does exactly this and says why (`acpConnectors.ts:129-144`: Defender scanning `%TEMP%` → `EPERM` on bun's renames).

**Trap to write into the packet:** never swap this for `getEnhancedEnv()` or `prepareCleanEnv()` for PATH convenience — `prepareCleanEnv` "merges the full user shell environment (including custom env vars like API keys exported in .zshrc)" (`acpConnectors.ts:101-107`), handing every exported credential to a freshly downloaded package.

**Fetch.** Bundled bun (`getBundledBunDir()`, `shellEnv.ts:214`; `PINNED_BUN_VERSION = '1.3.14'`), `bun install --frozen-lockfile --ignore-scripts` in the staging dir. `--ignore-scripts` is **unconditional in K-05, no exceptions**; `trustedPostinstall` is `[]` by contract. Any agent needing a lifecycle script leaves the subset — otherwise code runs at step 5 and the independent hash check at step 6 is not a pre-execution gate. (This is also why `--ignore-scripts` and `trustedDependencies` cannot be combined: `--ignore-scripts` wins, so a "reviewed allowlist" would silently do nothing.)

**Explicit spawn `timeout` + `killSignal` + tree-kill.** The design cites "safeSpawn's contract (`safeSpawn.ts:147-183`)" — no such contract exists; the spawn passes only `stdio`, `cwd`, `env`. A hung `bun install` wedges the agent's lock permanently (liveness only reclaims on a dead PID). Release the lock in a `finally` on every path.

Bun over npm is correct and load-bearing: `defaultResolveTrustedNpm()` throws when no `npm-cli.js` exists (`safeSpawn.ts:115-137`) — precisely the machine INS-01 targets.

**Verify then install.** Hash the resolved entry point against `pin.entryPointSha256`; then `moveWithExdevFallback` (`atomicFile.ts:54-64`) rather than assuming same-volume; staging dir `rm -rf` in a `finally` (mirrors `wcoreUpdater.ts:339-345`).

**Test** — integration against the real registry, network-gated: clean install of the qwen pin succeeds; tampered lockfile fails with exit 1 and leaves `node_modules` absent; planted `$HOME/.npmrc` scope redirect does **not** affect the install; timeout kills and releases the lock; cancel writes nothing.

**Negative control** — remove `--frozen-lockfile` and the tamper test must go green (bun re-resolves). Remove the `HOME` override and the redirect test must fail with `FailedToOpenSocket`. Both were observed on this machine.

**Size: 3 d.**

---

### T5 — Shims, PATH, registry integration

**Files** — `src/process/agent/install/agentShims.ts` (new); `src/process/utils/shellEnv.ts`; `src/process/agent/AgentRegistry.ts`.

**Spawn authority is `launch` (absolute), not PATH.** The design's step 9(b) put the bin dir in `getPosixExtraToolPaths()` (`shellEnv.ts:552-571`), which `getEnhancedEnv` **appends** (`shellEnv.ts:659-662`) while bundled dirs are **prepended** (`shellEnv.ts:674-687`) — so the verified install would be the lowest-priority resolution, and the step-0 "refuse if already resolvable" preflight is a TOCTOU that expires the moment the user brew-installs the tool. Absolute `launch` deletes the ordering question instead of trying to win it. It also makes the design's dedup argument moot on POSIX, where `AcpDetector.ts:272` sets `cliPath: cli.cmd` (bare name) and our record would have carried the same.

Still add the bin dir to **both** extra-tool-path arrays — but only so `where`/`command -v` **detection display** succeeds. Do not lean on `!currentPath.includes(p)` (`shellEnv.ts:542`, `:571`) for correctness: it is a substring test against `process.env.PATH` only.

**Verify before every spawn, not only at install.** The manifest is a mutable JSON file in `userData` that feeds a spawn command; recording a hash and checking it twice (install, uninstall) makes the whole pin chain an install-time property. The repo already does better — `resolveManagedOfficeCliShimDir` re-verifies on **every** resolution:

```ts
digestOfficeCliEvidence(readFileSync(shimPath)) !== expectedSha256
```
`shellEnv.ts:172`

Re-verify `entryPointSha256`, and that `launch.command` is the bundled-bun path, inside `refreshInstalledAgents()` **and** immediately before spawn. Mismatch → `state: 'foreign'`, drop from registry, never spawn.

**Registry.** Add `installedAgents`, splice into `merge()` (`AgentRegistry.ts:187-197`) between `createGeminiAgent()` and `...this.builtinAgents` — `deduplicate()` is first-occurrence-wins on `backend` (`AgentRegistry.ts:172-183`). Precedent is `createWCoreAgent()` (`AgentRegistry.ts:92`), which synthesises an agent with a resolver-supplied absolute path. Add `refreshInstalledAgents()` modelled on `refreshBuiltinAgents()` (`AgentRegistry.ts:289-305`) — **and it must call `acpDetector.clearEnvCache()`** (`AcpDetector.ts:41-44`), because `enhancedEnv` is memoised per instance (`AcpDetector.ts:99-101`, `:202-204`) and `refreshBuiltinAgents` does this at `:291`.

**Post-install verification must not be self-fulfilling.** `HubInstaller`'s `contributeVerifiers.acpAdapters` asserts against `agentRegistry.getDetectedAgents()`, which by then contains the record we just inserted — it always passes. Replace with a real spawn test: launch `launch`, complete the ACP `initialize` handshake, tear down. That is the only check that catches T1-class breakage.

**Test** — spawn-test verifier against a stub ACP binary; hash-mismatch → agent absent from `getDetectedAgents()`; dedup order test.

**Negative control** — corrupt the installed entry point after install; `refreshInstalledAgents()` must drop the agent. Revert the pre-spawn check and it must reappear and spawn.

**Size: 2.5 d.**

---

### T6 — Credential path. **This is the INS-01 enabler.**

**Files** — `src/process/acp/session/AuthNegotiator.ts`; `src/process/acp/compat/typeBridge.ts` (`BACKEND_AUTH_KEYS`); `src/process/task/AcpAgentManager.ts` (`resolveBuiltinBackendConfig` return); `src/common/config/storage.ts` (`acp.config[backend].apiKey`); one Settings field.

1. **`resolveBuiltinBackendConfig` must return `customEnv`** — today it returns `{ cliPath, customArgs, yoloMode }` (`AcpAgentManager.ts:1156`), so no builtin backend can ever receive a key. Source it from `acp.config[backend]`, encrypted at rest — `apiKey` is already in `SENSITIVE_FIELD_NAMES` (`fieldClassification.ts:19-34`), so the existing secrets path covers it with no new crypto.
2. **`BACKEND_AUTH_KEYS.qwen`** → add `OPENAI_API_KEY` (proven: it is the var qwen's ACP method names).
3. **`selectAuthMethod`** — accept a method when the **pin file** declares `auth: { methodId, envVars }` for that agent and all those vars are present in credentials. Additive; leaves the existing `type === 'env_var'` branch untouched. Without this, qwen's `{"id":"openai",…,"_meta":{"type":"terminal"}}` is skipped and `session/new` returns `-32000`.
4. Skip `ensureMinNodeVersion` for bun-runtime agents. `spawnGenericBackend` calls it unconditionally (`acpConnectors.ts:615`). No Node → harmless (`execFileSync` throws, caught, `acpConnectors.ts:186-188`). **Old Node (16.x, common on locked-down corporate Windows) → it throws** `Node.js v16.x is too old for qwen ACP` (`acpConnectors.ts:209-214`) for an agent running on bundled Bun that needs no Node at all. One flag.

Scope discipline: this is the minimum to make INS-01 honest. **No Flux, no base-URL rewriting, no writes to files we do not own** — `externalWrites` stays `[]`. The proven qwen flow writes nothing into `~/.qwen`.

**Test** — unit: `selectAuthMethod` returns the pin-declared method when its env vars are present, null when absent. Integration against real qwen: key set + authenticate → `session/new` returns a `sessionId`; key absent → `-32000` surfaced as a clean "Sign in required", not a crash.

**Negative control** — revert (3) and the integration test must fail with exactly `Authentication required: Use Qwen Code CLI to authenticate first.` (observed verbatim on this machine). Revert (4) and a stubbed `node --version` → `v16.20.0` must throw.

**Size: 2 d.**

---

### T7 — Uninstall and repair

**Files** — `src/process/agent/install/agentUninstaller.ts`.

**Never iterate `ownedPaths` as an instruction.** The design applies the containment check to `prefixDir` only and re-hashing to `shims` only, so an entry that is neither — `"../../../../Documents"` — is deleted unchecked, and step 2 renders `ownedPaths` **verbatim** into the confirmation dialog, so the user's own consent screen faithfully lists the attacker's target. INS-05 says "by manifest, not by name"; the manifest is *evidence*, not authority.

Reconstruct every deletable path at runtime from `agentId` + `version` + the shipped shim naming rule. Apply to **each** reconstructed path: `realpathSync(p).startsWith(realpathSync(root) + path.sep)` and `lstatSync().isSymbolicLink()` rejection — the `shellEnv.ts:123-131` pattern — with the one carve-out for our own `current` junction. Diff the reconstruction against `ownedPaths` and surface a divergence as a tamper signal.

Keep the design's shim-hash-before-delete: it genuinely exceeds INS-05. Never `bun remove`, never `npm uninstall -g`, never anything keyed on the command name.

**Test** — a manifest with `ownedPaths: ["../../evil"]` must delete nothing and report tamper. Shim with mismatched bytes is left in place and named in the result. Orphaned entry → no filesystem writes.

**Negative control** — revert to iterating `ownedPaths` and the traversal fixture must delete the sentinel file outside the root.

**Size: 1.5 d.**

---

### T8 — Windows pending swap and delete

**Files** — `src/process/agent/install/pendingSwap.ts` (new); `src/index.ts:927-934`.

**Do not reuse `applyPendingSwap`.** It is a single-file primitive:

```ts
rmSync(finalPath, { force: true });   // wcoreUpdater.ts:394 — no `recursive: true`
```

which throws `ERR_FS_EISDIR` on a directory. Write a directory-aware `applyPendingAgentInstalls()`: `rmSync(..., { recursive: true, force: true })`, bounded retry-with-backoff on `EPERM`/`EBUSY`/`ENOTEMPTY` (Defender and Search Indexer hold transient handles on freshly written trees), plus a `.pending-delete` sweep. Bound the retry and surface a real message — a silent `{ applied: false }` loop is how you get a permanently half-installed agent. Two side corrections: "Windows `rename` will not overwrite" is true for **directories**, not files (libuv passes `MOVEFILE_REPLACE_EXISTING`) — build on the directory case; and use `moveWithExdevFallback`, do not assume same-volume.

**Security gate the pending apply.** `applyPendingSwap` verifies nothing, and this hook runs "before anything spawns" and `chmod 0o755`s the result (`wcoreUpdater.ts:397-402`). For wcore that is a file staged seconds earlier in the same checksummed process. Here it is a whole tree sitting on disk indefinitely between consent and swap. Record a sorted per-file digest in the `pending_swap` entry and re-verify before the rename; expire pending installs older than N days and discard; never chmod anything not re-hashed in the same function.

Hook it into `src/index.ts` alongside the existing `applyPendingWCoreUpdate()` at `:927-934`, before `initializeProcess()`.

**Test** — `tests/unit/` fixture directory tree with a locked descendant → retries then stages; digest mismatch → discards and does not apply; expired pending → discarded.

**Negative control** — call the wcore `applyPendingSwap` on a directory fixture; it must throw `ERR_FS_EISDIR`. Remove the digest check and the tampered-tree fixture must get installed.

**Size: 1.5 d.**

---

### T9 — UI

**Files** — `src/renderer/pages/settings/AgentSettings/LocalAgents.tsx`, `AgentCard.tsx`.

`AgentCardProps` is already a discriminated union on `type` (`AgentCard.tsx:26-41`), so add a third `'installable'` variant — not a rewrite. Card states: Available (pinned version + pin age) · Installing (reuse the `{phase, percent, message}` progress shape from `WCoreUpdateProgress`) · Installed · **Sign-in required** · Installed but not detected (diagnostics action printing the enhanced PATH; `AcpDetector.ts:259` already logs it) · Removed outside Wayland · Foreign shim (names the path, states Wayland will not remove it).

Move the writability probe into preflight so the dialog is never shown for an install that cannot happen (read-only or locked-down profile).

**Test** — component tests per state. **Negative control** — remove the `installable` variant and the story must fail to typecheck.

**Size: 1.5 d.**

---

### T10 — Acceptance (§3)

**Size: 1 d** plus Windows-box time.

---

## 2. Agent shortlist

All facts below fetched live from `registry.npmjs.org` today.

### Ships in K-05

| Agent | Package @ version | Why it ships |
|---|---|---|
| **qwen** *(first)* | `@qwen-code/qwen-code@0.21.8` | 0 direct deps, **no lifecycle scripts**, installs clean under `--ignore-scripts` (47 lock entries, 116 MB, exit 0). The **only** candidate whose full install→detect→authenticate→`session/new` chain I proved end-to-end, writing nothing outside our root. Already `authRequired: true`, `acpArgs: ['--acp']` in `ACP_BACKENDS_ALL`. |
| **gemini** | `@google/gemini-cli@0.54.4` | 0 direct deps, no scripts, 120 MB. `BACKEND_AUTH_KEYS.gemini` already lists `GOOGLE_API_KEY`/`GEMINI_API_KEY`. **Gated:** gemini is a *builtin* (`createGeminiAgent`, `AgentRegistry.ts:82`), not an AcpDetector backend — prove the registry splice works for it before committing. |
| **auggie** | `@augmentcode/auggie@0.35.0` | Installs and speaks ACP under bundled bun (verified: `initialize` → `agentInfo.name: "auggie"`). Ships **install-only**, card reads "Sign in required — run `auggie login`". **Not** an INS-01 proof agent. Install with optional deps omitted: its `node-pty@1.2.0-beta.14` optional dep declares `install: node scripts/prebuild.js \|\| node-gyp rebuild`, which `--ignore-scripts` leaves unbuilt. Entry `augment.mjs`, sha256 `4d56d6f5bd07d48d41c87f15065906f6b395457465a97c31398cd110206621a9`. |

### Deferred, with the reason

| Agent | Reason |
|---|---|
| **claude** `@anthropic-ai/claude-code@2.1.226` | `postinstall: node install.cjs` is **required** — `bin` is `bin/claude.exe`, delivered by one of 8 platform optionalDeps and placed by that script. Cannot ship under unconditional `--ignore-scripts`, so verification cannot precede execution. → K-06 via direct-tarball Mechanic B. |
| **opencode** `opencode-ai@1.18.15` | Same: `postinstall: node ./postinstall.mjs`, `bin: bin/opencode.exe`. → K-06. |
| **copilot** `@github/copilot@1.0.78` | Genuinely clean (no scripts, proper platform-package pattern, one pure-JS dep `detect-libc`) — but `@github/copilot-darwin-arm64` unpacks to **339 MB**, and auth is GitHub OAuth. Defer on size + no env-var auth path. |
| **codex** | The design's reasoning stands: `"@openai/codex-darwin-arm64": "npm:@openai/codex@0.147.0-darwin-arm64"` alias where the named package 404s. And it needs no PATH install — `acpTypes.ts:355` sets `defaultCliPath: npx <pkg>`. Optimisation, not a fix. |
| **kimi, goose, droid** | Non-npm channels (PyPI/`uv`, GitHub releases/Homebrew) or unresolved package identity. INS-02's shell-installer exclusion applies as written. → K-06. |

---

## 3. INS-01 acceptance run

**Agent: qwen. Not auggie** — auggie structurally cannot pass, proven above.

Fresh VM per OS, no Node, no npm, no agent CLI, no `~/.qwen`, packaged signed build (never dev mode).

**Pre-flight, all OSes**
1. `node --version` → not found. Screenshot.
2. Settings → Agents. qwen appears under "Available to install" with pinned version and pin age. No other agent claims to be installed.

**Install**
3. Click Install. **A native dialog appears** naming package, exact version, target directory, "no postinstall scripts will run", and that sign-in is separate. Screenshot.
4. Cancel → nothing on disk, no manifest entry, card unchanged. *(INS-03)*
5. Install again, confirm. Progress reaches 100%.
6. Filesystem: only `<root>/qwen/0.21.8/`, `<root>/bin/`, `<root>/current` junction, `manifest.json`. **Nothing under `~/.bun`, `~/.npm`, `%TEMP%`.** *(INS-02)*

**Detect**
7. Card reads `Installed · 0.21.8`. `getDetectedAgents()` includes qwen with the absolute `launch`.
8. Post-install spawn test passed — the log shows a real ACP `initialize` response, not a registry-lookup tautology.

**Chat**
9. Settings → qwen → paste an OpenAI-compatible API key. Restart not required.
10. New conversation on qwen. Send "What is 2+2?". **A correct answer streams back.** Screenshot. *(INS-01)*
11. Confirm `~/.qwen` was **not** created: `find ~ -maxdepth 2 -name '.qwen'` → empty. *(FAN-03 posture held early)*

**Uninstall**
12. Uninstall. Dialog lists every path. Confirm.
13. Root is empty except `manifest.json` with no qwen entry. The user's own files untouched. Machine back to step 1 state. *(INS-05)*

**Per-OS additions**

*macOS (arm64 + x64):* run under a user whose home contains a space if one can be created. Confirm the app is notarized and Gatekeeper does not prompt on the installed agent.

*Linux (x64 glibc):* confirm no `sudo`, nothing under `/usr/local`.

*Windows 11 (x64), on the Windows box `seandesktop` (`ssh -i ~/.ssh/wayland_win seand@100.109.207.54`, PowerShell `;` not `&&`)* — this is where the packet fails if it fails:
- W1. Install to `C:\Program Files\Wayland` (default `perMachine`). Assert `parseWindowsCliPath(manifest.launch.command).inlineArgs.length === 0`. *(T1)*
- W2. Run as a user whose profile is `C:\Users\John Smith`. Install + chat must both work. *(T1)*
- W3. Install tree is under `%LOCALAPPDATA%`, **not** `%APPDATA%`. *(T2)*
- W4. `where qwen` resolves the `.cmd` shim from the enhanced env. **Currently not established** — `AcpDetector.ts:120` passes `env: this.enhancedEnv` to `safeExecFile('where', [cmd])`. Detection display only; spawning does not depend on it.
- W5. Install with an agent process running → `.pending`; restart → applied; chat works. *(T8)*
- W6. Install `node@16` on PATH first. Chat must still work. *(T6.4)*
- W7. Behind a proxy (`HTTP_PROXY` set): install succeeds, or fails with a proxy-specific message — never "Couldn't reach the package registry". *(T4)*
- W8. **Prove or disprove the `Path` vs `PATH` enumeration trap** before trusting any allowlist copy. *(T4)*
- W9. Full path length of the deepest installed file < 260 chars. *(T2)*

---

## 4. Decisions needed from Sean before implementation starts

Three. All are genuine blockers.

**Q1 — K-05 ships qwen first and auggie install-only. Confirm?**
**Recommendation: yes.** The milestone named auggie-style simplicity, but I ran it: auggie returns `authMethods: []` and *"Auggie does not currently support authenticating over ACP. Please run `auggie login` from your terminal"*. It can never satisfy "a chat runs on it". qwen I proved end-to-end — `session/new` returned a `sessionId`, and nothing was written outside our root. Cost: qwen is a 116 MB install versus auggie's 13 MB.

**Q2 — T6 adds a per-agent API-key field and one `AuthNegotiator` change. In scope for K-05, or does INS-01 split?**
**Recommendation: in scope, build it.** INS-01 says "and a chat runs on it". Today `resolveBuiltinBackendConfig` returns no `customEnv` (`AcpAgentManager.ts:1156`), `acp.config[backend].authToken` has zero consumers, and `selectAuthMethod` requires a `type` field qwen does not emit — so without T6 the requirement is unprovable and we would be signing off a half-truth. It is ~2 days, it writes to no file we do not own, and it gives K-07's Flux fan-out a working socket instead of greenfield. The alternative — formally splitting INS-01 and moving "chat runs" to K-07 — is honest but leaves K-05 shipping an installer nobody can use.

**Q3 — Windows install root moves to `%LOCALAPPDATA%`, diverging from every other Wayland path.**
**Recommendation: yes, move it.** `ElectronPlatformServices.ts:52` puts userData in `%APPDATA%` (roaming). A 116 MB `node_modules` there causes logon/logoff sync storms, and under Folder Redirection it lands on an SMB share where `rename` is not atomic and AppLocker commonly blocks execution. `manifest.json` stays in `userData` so the authority record still roams. This is a real inconsistency in the codebase's path story and worth your explicit sign-off.

---

## 5. Size and critical path

| Task | Days |
|---|---|
| T1 structured spawn command | 1.5 |
| T2 install root + manifest + reconcile | 2.0 |
| T3 pins + bump + staleness gate | 2.0 |
| T4 installer core | 3.0 |
| T5 shims + PATH + registry + pre-spawn verify | 2.5 |
| T6 credential path | 2.0 |
| T7 uninstall + repair | 1.5 |
| T8 Windows pending swap/delete | 1.5 |
| T9 UI | 1.5 |
| T10 acceptance (+ Windows box) | 1.0 |
| **Total** | **18.5 d** |

Add ~3 d for the cross-audit panel and fixes (Codex 5.6 Sol · Gemini 3.1 Pro · Kimi K3 · `ferrox-code-reviewer`), per the standing rule that green CI is not enough. **~21–22 d realistic.**

**Critical path: T1 → T4 → T5 → T6 → T10 = 10 days.**

T1 is the true gate — until the structured launch command exists, nothing spawns correctly on Windows and T5's pre-spawn verification has nothing to verify. Start it first, alone.

**Parallelisable off the critical path:** T2 and T3 can start immediately alongside T1 (different files entirely). T7, T8 and T9 can run concurrently once T2 lands. T8 needs Windows-box access, so book it early.

**Highest-risk unknown:** W8, the Windows `Path` vs `PATH` env-enumeration trap. If it bites, every env-allowlist assumption in T4 needs rework, and it may indicate `buildChildEnv` is already broken for IJFW on Windows. Test it on day 1 on the Windows box — it is a 10-minute check that can move a 3-day task.