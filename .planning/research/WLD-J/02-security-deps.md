# WLD-J Dimension 2 — Security fixes & dependency movement, AionUi v1.9.5..v2.1.44

**Researcher:** dimension 2 of 4
**Date:** 2026-07-30
**Range:** `5b2c741f9` (v1.9.5, 2026-04-01) .. `f37a6187f` (v2.1.44, 2026-07-30)
**Commits in range:** 1784
**Our tree:** `/Users/seandonahoe/dev/wayland-worktrees/packet-attribution` @ `d84a7fee4`, Wayland 0.11.18

---

## Headline

**The premise of this dimension does not survive contact with the evidence.**

The task framing was "unfixed upstream security bugs are live in our shipped product." That is
**false**. I checked every security-relevant commit in the range against our actual code, and:

- **Every genuine security fix upstream shipped in these 4 months is already present in our tree**,
  usually at the same or a stronger implementation. 8 of 8 applicable fixes verified present.
- **Zero commits in 1784 reference a CVE or GHSA.** Upstream shipped no CVE-driven remediation.
- **Upstream made zero Electron security-shell changes** in the entire range. We are far ahead of
  them on shell hardening, secret storage, and supply-chain verification.
- We are on **Electron 41.6.0**; upstream is still on **Electron 37**. We are 4 majors _ahead_.

The one place upstream is genuinely ahead of us is **electron-builder** (26.15.2 vs our 26.10.0).

The real risk in this dimension is not a missing patch. It is **structural**: we are pinned to
`@office-ai/aioncli-core@0.30.6`, a package whose last publish was 2026-04-20 and which upstream
deleted entirely — while our tree has _57_ importers of it, more than upstream had at the fork point.

---

## Method, and two corrections that changed the answer

Recording these because each one would have produced a wrong verdict.

1. **The upstream tree was a shallow clone when I started.** `.git/shallow` held 2 grafted roots
   (v1.9.5 and v2.1.44), so `git rev-list --count v1.9.5..v2.1.44` returned **1**, and
   `git log --oneline` over the range returned a single line. Reporting "1 commit" or reconstructing
   from release notes would both have been wrong. I unshallowed in place with a partial-clone filter
   (`git fetch --unshallow --filter=blob:limit=100k`), which is additive and non-destructive.
   Result: **1784**, independently confirmed against the GitHub compare API (`ahead_by: 1784`).
   Two methods, same number.

2. **Believing a zero cost me a wrong intermediate conclusion.** Counting aioncli-core importers
   across tags returned `v2.0.1: 0` and `v2.0.7: 0`, which contradicted `v2.1.0: 14`. Cause: those
   two tags **do not exist**; `git grep <missing-rev>` errored and the count collapsed to 0. Every
   zero in this report is backed by a positive control on the same command — e.g. the CVE sweep is
   trusted only because the identical `--grep` invocation found the axios commit, and the
   "no hash verification in prepareAioncore" finding is trusted only because the same grep found
   `existsSync`/`statSync` in the sibling file.

3. **Monorepo restructure accounted for.** `a677b8647` (2026-05-08, "decouple WebUI from Electron",
   1221 files) created `packages/` and deleted `src/`. v1.9.5 has 1398 files under `src/`; v2.1.44
   has **0**. All my path sweeps used suffix globs (`*extensions/sandbox*`, `*preload*`) that match
   both layouts, so they are not under-reporting. Where I addressed a specific file I queried both
   `src/...` and `packages/desktop/src/...`.

4. `rtk proxy git ...` used for all enumeration, per the standing warning.

### Blind spot I cannot close from this repo

A large share of the v2 delta left the AionUi repo entirely: agent management, MCP, persistence,
skills, team and channels moved into **`iOfficeAI/AionCore`**, a separate public Rust repo
(`aioncoreVersion` v0.1.2 → v0.1.55 across our window). **Security fixes living there are invisible
to a git analysis of AionUi.**

I partially closed this: AionCore v0.1.2..v0.1.55 is **398 commits**; the GitHub compare API returned
**250 of them (63%)**, so this scan is incomplete and I say so rather than reporting a clean zero.
In those 250, exactly one security-relevant commit appears:

| sha         | date       | what                                                        |
| ----------- | ---------- | ----------------------------------------------------------- |
| `05df6f7c2` | 2026-06-23 | `fix(deps): update quinn-proto for RustSec advisory (#508)` |

That is a Rust-side dependency advisory in _their_ engine. It does not transfer to us — our engine is
`wayland-core`, a different codebase. No advisory ID was given in the commit message and I did not
invent one. The remaining 148 unreturned AionCore commits are an acknowledged gap.

---

## 1. Every security-relevant commit in the range, and our status

Legend — **HAVE**: fix present in our tree. **EXCEED**: our implementation is stronger.
**N/A**: fixes code that does not exist in our tree. **NEVER HAD**: upstream regression we dodged.

### Confirmed security fixes

| #   | sha                                 | date  | flaw                                                                                                                                                                                                                                       | our status                                                                                                                                                                                                                                                                                                                           |
| --- | ----------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `68a6ab005` (merged as `3258a55dc`) | 04-03 | **Symlink escape in extension path confinement.** `isPathWithinDirectory` used `path.resolve` only — no canonicalization — so a symlink placed inside the extension dir resolved to a target outside it and still passed the prefix check. | **HAVE** — `src/process/extensions/sandbox/pathSafety.ts:31-61`. `resolvePathForContainment` + `splitExistingAncestor` + `fs.realpathSync.native`, logic identical to upstream (only the copyright header differs). v1.9.5 shipped the vulnerable 28-line version, so this was absorbed, not inherited.                              |
| 2   | `e52a5dbaa`                         | 04-02 | **Extension permission bypass.** The `aion.storage` API was injected into every sandboxed extension regardless of the manifest `storage` flag; declared permissions were documented as "informational only".                               | **HAVE** — `permissions.ts:81-89` (`hasSandboxStoragePermission`, `getSandboxPermissionDeniedError`), enforced host-side at `sandbox.ts:285` and worker-side at `sandboxWorker.ts:46,97`. Both sides gated, as upstream.                                                                                                             |
| 3   | `70b4f6371`                         | 04-02 | **Username enumeration via timing.** Missing-user logins called `constantTimeVerify('dummy','dummy',true)`; bcrypt rejects `'dummy'` as a malformed hash and returns fast, so a non-existent user was measurably quicker than a real one.  | **HAVE** — `AuthService.ts:85-86` (`DUMMY_BCRYPT_PASSWORD` / `DUMMY_BCRYPT_HASH`, same `$2a$12$` hash), `:813 constantTimeVerifyMissingUser`, called at `authRoutes.ts:233`.                                                                                                                                                         |
| 4   | `6f88f1df7` (dup `a8bd69711`)       | 04-01 | **Auth bypass.** `AuthService.refreshToken(token)` was async but not awaited. A Promise object is always truthy, so `if (!newToken)` never fired and _any_ string minted a fresh valid token.                                              | **HAVE** — our `refreshToken` is `async` and awaited on the route path.                                                                                                                                                                                                                                                              |
| 5   | `a2a86691b` (dup `e057d9c10`)       | 04-01 | `/api/auth/status` called async `UserRepository.hasUsers()` / `countUsers()` without awaiting, so `needsSetup` was computed from a Promise (always truthy → always `false`) and `userCount` serialized as a Promise.                       | **HAVE** — awaited in our route.                                                                                                                                                                                                                                                                                                     |
| 6   | `ba0e0df2a`                         | 04-19 | **Refresh-token replay.** Tokens were not rotated or blacklisted on refresh; an old token stayed valid indefinitely after being exchanged.                                                                                                 | **HAVE + EXCEED** — `AuthService.ts:566` blacklist check on entry, `:631 blacklistToken(token)`, `:418 tokenId: crypto.randomUUID()`. We additionally carry a **token-family id** (`:401 familyId ?? crypto.randomUUID()`) for reuse detection, which upstream does **not** have at v2.1.44.                                         |
| 7   | `612a82fbc`                         | 04-21 | **Session cookie sent in cleartext behind a TLS-terminating proxy.** `getCookieOptions()` took no request and derived `secure` from env vars only, so an nginx-TLS deployment issued non-Secure cookies.                                   | **HAVE** — `constants.ts:137 detectHttps(req)` with the same three-signal priority (env → `SERVER_BASE_URL` https → `req.secure`), `:161 getCookieOptions(req)`. We carry the same deliberate refusal to trust `X-Forwarded-Proto`.                                                                                                  |
| 8   | `0c23c8b6e`                         | 04-13 | **Path traversal via multer temp path** (flagged by CodeQL). `multer.diskStorage({})` with an unvalidated `file.path` used directly in `fsPromises.rename`.                                                                                | **HAVE + EXCEED** — `apiRoutes.ts:42,45` pin `MULTER_TEMP_DIR = os.tmpdir()` as upstream does, but our confinement at `:391-392` rebuilds the path as `path.join(path.resolve(MULTER_TEMP_DIR), path.basename(file.path))` — canonical **by construction** — rather than upstream's `startsWith` check, which is the weaker pattern. |

**8 of 8 applicable security fixes present. Zero gaps.**

### Not applicable — fixes to code we do not have

| sha                                   | date    | flaw                                                                               | why N/A                                                                                                                                                                                                                                                                       |
| ------------------------------------- | ------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `efc94e464`                           | 05-27   | Percent-encoded href bypassed the markdown local-file sandbox.                     | The markdown link-click handler **does not exist at v1.9.5** (155-line file, no `rawHref`/`resolveMessageFilePath`/`normalizedWorkspace`) and does not exist in ours (161 lines, no handler). Upstream added the feature _and_ the bug after our fork.                        |
| `5e5995b12`                           | 05-27   | `/workspace/../../../etc/passwd` passed a naive `startsWith` in the same handler.  | Same — the vulnerable handler never existed in our lineage.                                                                                                                                                                                                                   |
| `04a17d971`                           | 04-04   | `fix(security): pin axios version` — floating `^1.13.2` → exact `1.13.6`.          | Touches `mobile/package.json` only; **we have no mobile workspace**. Our root `resolutions` already force `axios: ">=1.16.0"`, materially newer than upstream's pin.                                                                                                          |
| `4819ffa93`                           | 05-29   | `fix(mcp): validate json imports` — new `mcpJsonImport.ts` doing shape validation. | Input-shape/UX validation, not a security boundary (no path, no exec, no credential). Our equivalent validation is inline in `src/renderer/pages/settings/components/JsonImportModal.tsx` (`JSON.parse` guard + `isValid`/`errorMessage` at `:42-46,182-193`). Class covered. |
| `0c3dc85b8`, `04131f8d7`, `7ec78c497` | Jun–Jul | Verify bundled aioncore resources from manifest.                                   | Specific to _their_ engine bundling. See §5 — our equivalent is strictly stronger.                                                                                                                                                                                            |

### Upstream regression we never had

| sha         | date  | what                                                                                                                                                                                                                    | our status                                                                                                                                                                                                                                                                                                                                   |
| ----------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `b455f110d` | 07-06 | `api_key` instead of `apiKey` in the OpenAI SDK config object. The SDK ignores `api_key`, so the configured key was silently dropped and the client fell back to `process.env.OPENAI_API_KEY` — wrong-credential usage. | **NEVER HAD IT.** v1.9.5 was already correct (`apiKey`). Upstream _broke_ it in `b78247098` (04-23, "rename camelCase fields to snake_case across all frontend source files") and took 2.5 months to notice. Ours: `src/common/api/OpenAIRotatingClient.ts:41` — `apiKey`. Worth noting as a cautionary tale about blanket rename refactors. |

### Non-security miss (the only genuine gap found in code)

| sha                    | date  | what                                                                                                                                        | our status                                                                                                                                                                                                 |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `b455f110d` (2nd hunk) | 07-06 | `useThrottle` never cleared its pending timer on unmount — the callback fires against an unmounted component. Memory leak / stray setState. | **MISSING.** Our `src/renderer/hooks/ui/useThrottle.ts` has no `useEffect` cleanup; the only `clearTimeout` (`:25-26`) is inside the throttled function, not an unmount handler. **Not a security issue.** |

---

## 2. Electron version movement

|                    | v1.9.5    | v2.1.44    | ours                                                     |
| ------------------ | --------- | ---------- | -------------------------------------------------------- |
| `electron`         | `^37.3.1` | `^37.10.3` | **`41.6.0`** (locked in `bun.lock`, installed confirmed) |
| `electron-builder` | `^26.6.0` | `26.15.2`  | `26.10.0`                                                |
| `electron-vite`    | `^5.0.0`  | `^5.0.0`   | `^5.0.0`                                                 |
| `electron-updater` | `^6.6.2`  | `^6.6.2`   | `^6.6.2`                                                 |

**Upstream never moved a major.** Across 1784 commits they went 37.3.1 → 37.10.3 — patch-level only,
staying on Electron 37 for the entire window.

We are on **Electron 41.6.0, four majors ahead**. Electron supports the latest three majors; Electron
37 is outside that window, meaning **upstream is the one carrying unpatched Chromium CVEs, not us**.
This inverts the dimension's stated premise.

On whether the 37.3.1 → 37.10.3 movement carries CVE fixes: Electron patch releases routinely roll up
Chromium security fixes, but **no commit in the range names a CVE**, and I did not verify any specific
advisory ID against Electron's release notes. I will not fabricate one — recorded as _not verified_.
It is moot regardless, since 41.6.0 supersedes the entire 37.x line.

**`electron-builder` is the one place upstream is ahead**: they pin exactly `26.15.2`, we are on
`26.10.0` — five minors behind. This is build-toolchain, not runtime, so it is not a shipped-product
exposure, but it is the single actionable version gap in this dimension.

---

## 3. Dependency delta (all workspaces)

Root `package.json`, v1.9.5 → v2.1.44:

**Changed — 2 (that is the entire list for 4 months):**

```
~ electron:         ^37.3.1  -> ^37.10.3
~ electron-builder: ^26.6.0  -> 26.15.2
```

**Dropped — 2:**

```
- @office-ai/aioncli-core ^0.30.2
- @office-ai/platform      ^0.3.16
```

**Added — 28:**
`@agentclientprotocol/sdk ^0.18.2`, `@aionui/web-host workspace:*`, `@codemirror/commands ^6.8.1`,
`@codemirror/lang-html ^6.4.11`, `@codemirror/language ^6.12.3`, `@codemirror/language-data ^6.5.2`,
`@codemirror/search ^6.7.0`, `@codemirror/state ^6.6.0`, `@codemirror/view ^6.38.6`,
`@iconify-json/vscode-icons ^1.2.53`, `@iconify/react ^6.0.2`, `@lezer/highlight ^1.2.3`,
`@types/express ^5.0.6`, `@types/react ^19.2.14`, `@types/yauzl ^2.10.3`,
`@wecom/aibot-node-sdk ^1.0.6`, `@xmldom/xmldom ^0.8.11`, `builder-util 26.15.0`,
`builder-util-runtime 9.5.1`, `dayjs ^1.11.18`, `electron-builder-squirrel-windows 26.15.2`,
`electron-devtools-installer ^4.0.0`, `https-proxy-agent ^7.0.6`, `mermaid ^11.13.0`,
`playwright ^1.59.1`, `smol-toml ^1.6.1`, `ts-morph ^28.0.0`, `yauzl ^3.2.1`

**Other workspaces at v2.1.44** (all new since the fork; v1.9.5 had only `mobile/` plus two skill
package.jsons):

| workspace                 | deps                                            | security-relevant                                                                                |
| ------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `packages/desktop`        | 1 (`@aionui/web-host`)                          | none                                                                                             |
| `packages/web-host`       | 4 (`serve-handler ^6.1.5`, types, vitest)       | `serve-handler` is a static file server — traversal-sensitive class, but not present in our tree |
| `packages/web-cli`        | 5 (workspace refs, typescript, vitest)          | none                                                                                             |
| `packages/shared-scripts` | 2 (types, vitest)                               | none                                                                                             |
| `mobile`                  | delta is **one line**: `axios ^1.13.2 → 1.13.6` | see §1                                                                                           |

**Security-relevant reads:**

- `@xmldom/xmldom ^0.8.11` — historically a CVE-prone parser. Our root `resolutions` already force
  `^0.8.13`, ahead of upstream's floor.
- `mermaid ^11.13.0` — we force `^11.16.0`. Ahead.
- `yauzl ^3.2.1` + `@types/yauzl` — new zip extraction surface upstream (zip-slip class). We do not
  take this dependency.
- `https-proxy-agent ^7.0.6` — new proxy surface upstream.
- Our tree carries a **34-entry `resolutions` block** (`axios >=1.16.0`, `tar ^7.5.7`, `undici ^7.28.0`,
  `form-data ^4.0.6`, `node-forge ^1.4.0`, `path-to-regexp ^8.4.0`, `shell-quote ^1.10.0`,
  `dompurify ^3.4.12`, `ws ^8.21.1`, …). **Upstream has no `resolutions`/`overrides` block at all.**
  Our transitive-dependency hygiene is a capability upstream simply does not have.

---

## 4. The `@office-ai/aioncli-core` question — one half confirmed, one half refuted

### CONFIRMED: upstream abandoned it

| sha         | date       | what                                                        |
| ----------- | ---------- | ----------------------------------------------------------- |
| `2eb86fb67` | 2026-07-15 | `chore(deps): remove aioncli-core dependency (#3594)`       |
| `ed83ab48c` | 2026-07-15 | `chore(deps): remove office-ai platform dependency (#3595)` |

Both are absent from `package.json` at v2.1.44. Confirmed.

### REFUTED: they did **not** switch to calling `@anthropic-ai/sdk` directly

This is the part of the finding that does not hold.

- `@anthropic-ai/sdk` is **`^0.71.2` at v1.9.5 and `^0.71.2` at v2.1.44** — never bumped, never moved.
- It is consumed by **exactly the same two source files at both tags**:
  `…/src/common/api/AnthropicRotatingClient.ts` and `…/src/common/api/OpenAI2AnthropicConverter.ts`.

The SDK was _already_ being used directly at the fork point, for the API-key-rotation client layer.
Nothing switched onto it. (Aside: **we** are on `@anthropic-ai/sdk ^0.96.0` — 25 minors ahead of
upstream on the Anthropic SDK.)

### What actually replaced aioncli-core: AionCore, a separate binary

Upstream extracted the engine into **`iOfficeAI/AionCore`** — a public Rust repo — pinned from the
desktop app by an `aioncoreVersion` field (`v0.1.55` at v2.1.44) and fetched at build time by
`scripts/prepareAioncore.js` / `scripts/resolveAioncoreVersion.js`.

**This is the same architecture we already have with `wayland-core`.** Upstream arrived at our design
independently, three months after we did.

The rename trail: `db5aad399` (05-19, "rename aioncli references to aioncore"), `aea815adb` (05-19,
`aionuiBackendVersion` → aioncore), first appearing as "backend v0.1.2" on 2026-05-14.

### The removal commit is a red herring — it was trivial

`2eb86fb67` looks big (843 lines of `bun.lock` churn) but the source change is **85 insertions across
17 files**, almost all `-1/+1`. It replaced exactly one thing:

```diff
-import { AuthType } from '@office-ai/aioncli-core';
+import { AuthType } from '@/common/types/provider/authType';
```

…backed by a new 16-line local `AuthType` const. By July, aioncli-core was down to a **type-only
import**. The functional migration happened earlier, during the 2.0 backend cutover.

Importer counts across real tags (v2.0.1/v2.0.7 excluded — they do not exist):

| tag     | files importing aioncli-core |
| ------- | ---------------------------- |
| v1.9.5  | 38                           |
| v1.9.19 | 41                           |
| v2.1.0  | 14                           |
| v2.1.10 | 15                           |
| v2.1.20 | 15                           |
| v2.1.35 | 14                           |
| v2.1.44 | **0**                        |

The cliff is 41 → 14 between v1.9.19 (04-21) and v2.1.0 (05-24) — the AionCore migration.

### What this implies for our patch burden

**Our tree has 57 files importing `@office-ai/aioncli-core` — 19 more than upstream had at the fork
point.** We deepened the dependency over the same four months in which upstream eliminated it.

The package is **abandoned**. npm registry, verified directly:

```
0.30.3  2026-04-12      0.30.5  2026-04-14
0.30.4  2026-04-14      0.30.6  2026-04-20   <- last publish; registry `modified` is the same timestamp
```

`0.30.6` is the final release. We are pinned to it and patch it locally for four things (the brief
said three):

1. **Anthropic sampling params** — suppress `temperature`/`top_p` leaking from gemini-cli's Gemini
   defaults, which Claude Opus 4.7+ rejects with a 400.
2. **OpenAI tool-schema bug** — `properties` treated as a schema node instead of a name→schema map,
   producing `400 Invalid schema for function`.
3. **MCP OAuth** — three sub-fixes: callback-server port collision (EADDRINUSE wedging port 57000),
   branded success/failure HTML, and a `clientId` fallback so expired hosted tokens can refresh.
4. **`package.json` floor-loosening** — `picomatch`/`simple-git`/`systeminformation` relaxed to `*`
   so our root `resolutions` can hoist patched versions. This one is itself a supply-chain control
   and is easy to overlook when reasoning about the patch set.

**There is no upstream relief available.** Upstream's exit was "adopt AionCore", which is their engine,
not a library we can consume. Our equivalent exit is migrating those 57 call sites onto `wayland-core`,
which we already ship. Until then these four patches are permanently ours, pinned against a dead
package, with no upstream security maintenance behind it.

This is the highest-value finding in the dimension — not because anything is exploitable today, but
because it is the only item here that gets worse with time.

---

## 5. Security shell, secrets, and preload surface

### Electron shell: upstream changed nothing; we hardened substantially

Upstream's main-window `webPreferences` is **byte-identical at v1.9.5 and v2.1.44**:

```js
webPreferences: {
  preload: path.join(__dirname, '../preload/index.js'),
  webviewTag: true,
},
```

No `contextIsolation`, no `nodeIntegration`, no `sandbox` — relying entirely on Electron defaults.
**Zero security-shell commits in the range.**

Two weaknesses upstream still ships unchanged at v2.1.44:

- `…/renderer/components/media/WebviewHost.tsx:478` — `webpreferences: 'contextIsolation=no, nodeIntegration=no, nativeWindowOpen=no'` (**contextIsolation explicitly disabled**)
- `…/renderer/pages/conversation/Preview/components/renderers/HTMLRenderer.tsx` — `webpreferences='allowRunningInsecureContent, javascript=yes'`

Ours, `src/index.ts:555-567`:

```js
webPreferences: {
  preload: resolveMainBundlePath('../preload/index.js'),
  sandbox: true,
  contextIsolation: true,
  nodeIntegration: false,
  nodeIntegrationInWorker: false,
  webviewTag: true,
},
```

plus a `will-attach-webview` guard at `:608-615` that **strips `preload`/`preloadURL` from attaching
webviews and force-overrides** `nodeIntegration=false`, `contextIsolation=true`, `sandbox=true`,
`params.nodeintegration=false` — which neutralizes the `contextIsolation=no` pattern upstream still
carries. A discriminating permission handler follows at `:617+`, granting only mic to the
origin-locked first-party renderer and denying every guest webview.

**We are not behind here. We are several years of hardening ahead.**

### Secrets/credential storage: upstream went backwards

`safeStorage` usage (positive control: the v1.9.5 query returns 2 files, so the v2.1.44 zero is real):

| tree             | files using `safeStorage`                                                                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| upstream v1.9.5  | 2 (`src/process/channels/utils/credentialCrypto.ts` + an ARCHITECTURE.md)                                                                                                                          |
| upstream v2.1.44 | **0**                                                                                                                                                                                              |
| ours             | a dedicated `src/process/secrets/` subsystem — `safeStorage.ts`, `fileKeyStore.ts`, `vaultPassphrase.ts`, `index.ts` — plus `ProviderRepository`, `legacyModelConfigMigration`, `modelRegistryIpc` |

Upstream **deleted** OS-keychain-backed credential encryption from the desktop app (`d91be9c42`,
`77dbc4ba8`, 2026-04-28, removing `src/process/channels/`). Credentials now live behind AionCore.
There is no upstream credential-storage hardening to adopt; the direction of travel is opposite to ours.

Note for whoever reads this next: our config store `wayland-config.txt` is base64(url-encoded JSON) —
grepping it for plaintext key material returns nothing and proves nothing. I did not use it as evidence.

### Preload surface: upstream widened it, and none of it is hardening

| sha         | date  | change                                                                     |
| ----------- | ----- | -------------------------------------------------------------------------- |
| `bbb734c31` | 04-21 | `feat(preload): expose backend port to renderer process`                   |
| `9595eabe2` | 04-11 | `feat(feedback): expose collectFeedbackLogs in preload bridge`             |
| `e743f8e6b` | 04-24 | `perf(sentry): route renderer SDK through preload IPC, not fetch fallback` |

All three **expand** the renderer-reachable surface. There is no preload allowlist or CSP work in the
range. **Nothing here to adopt; adopting any of it would enlarge our attack surface.**

### Supply chain: our verification is strictly stronger

|                                                                    | upstream                                                                                                                                              | ours                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| engine download                                                    | `packages/shared-scripts/src/prepare-aioncore.js`, 591 lines — **no `sha256`, no `createHash`, no checksum, no signature**                            | `scripts/prepareWaylandCore.js`, 723 lines — SHA-256 manifest (`bundled-wcore-shasums.json`), per-asset `archiveSha256` + `binarySha256`, `WCORE_REQUIRE_VERIFIED=1` strict path, and a hard failure ("supply-chain guard") when the manifest is missing |
| "verify bundled resources" (`04131f8d7`, `7ec78c497`, `0c3dc85b8`) | `verify-bundled-aioncore-resources.js`, 355 lines — `existsSync` / `statSync` / `isFile` / `isDirectory` only: **presence and layout, not integrity** | integrity by hash, as above                                                                                                                                                                                                                              |

(The "no hash verification upstream" claim is trusted because the same grep pattern _did_ match
`existsSync`/`statSync` in the sibling file — the zero is controlled.)

Upstream also resolves `aioncoreVersion` to **`'latest'`** as a documented fallback when the pin is
absent — an unpinned, unverified binary fetch. We do not have that failure mode.

---

## Ranked: security gaps live in our tree today

Ordered by real exposure, not by how alarming the label sounds.

**1. `@office-ai/aioncli-core@0.30.6` is abandoned, and we have 57 importers.**
Last publish 2026-04-20. Upstream removed it entirely; their replacement (AionCore) is not consumable
by us. We carry four local patches against a dead package with zero upstream security maintenance,
and any future flaw in it — in the MCP OAuth flow, the content generators, or its own transitive deps —
is ours alone to find and fix. **Not exploitable today; it is the only item that strictly worsens with
time.** The durable fix is migrating those 57 call sites onto `wayland-core`. This should drive a WLD-J
roadmap phase.

**2. `electron-builder` 26.10.0 vs upstream 26.15.2 — five minors behind.**
The only dependency in the entire range where upstream is ahead of us. Build-toolchain, not runtime,
so it is not a shipped-product exposure. I did **not** verify whether 26.11–26.15 contain a security
fix; that needs its own advisory check before anyone treats it as urgent or dismisses it.

**3. `useThrottle` missing unmount cleanup.**
`src/renderer/hooks/ui/useThrottle.ts` — no `useEffect` teardown, so a pending timer fires after
unmount. **Memory leak, not a security issue.** Only genuine code-level miss found. One-line fix,
listed for completeness rather than urgency.

**4. Unverified by construction: the 148 AionCore commits the compare API did not return.**
63% coverage of `v0.1.2..v0.1.55`. A security fix in their Rust engine would not appear in any
AionUi git analysis. Low relevance — their engine is not our engine — but it is the honest boundary of
this dimension, and I would rather flag it than present a clean sweep I cannot fully back.

**Not on this list, deliberately:** every upstream security fix in the range. All 8 applicable ones
are already in our tree, 3 of them in a stronger form than upstream shipped.

### One thing worth a second look — outside this dimension's scope

`resolveMessageFilePath` (`src/renderer/pages/conversation/Messages/components/MessageText.tsx:118-125`)
does string concatenation of workspace + user-supplied path with **no `..` collapsing and no
containment check**, and its output feeds `resolvedFiles` at `:176`. This is _not_ an upstream gap —
it is our own code, and upstream's analogous markdown path needed **two** fixes (`efc94e464`,
`5e5995b12`) for exactly this class. Whether it is reachable depends on what consumes `resolvedFiles`,
which I did not trace — that is dimension-3/4 territory or a follow-up review. Flagging, not claiming.

---

## Source inventory

- Upstream git history, `/Users/seandonahoe/dev/resources/AionUi` (unshallowed; 1784 commits verified
  two ways). All enumeration via `rtk proxy git`.
- Our tree, `/Users/seandonahoe/dev/wayland-worktrees/packet-attribution` @ `d84a7fee4`.
- GitHub API: `repos/iOfficeAI/AionUi/compare/v1.9.5...v2.1.44` (`total_commits: 1784`);
  `repos/iOfficeAI/AionCore/compare/v0.1.2...v0.1.55` (`total_commits: 398`, 250 returned).
- npm registry: `@office-ai/aioncli-core` versions + publish times.
- Scratch artifacts: `…/scratchpad/{all,sec,dep,arch,aioncore,aioncore-sec,p-*}.txt`.

**Not verified / deliberately not asserted:** any specific CVE ID for the Electron 37.3.1 → 37.10.3
movement; any advisory ID for the AionCore quinn-proto RustSec fix; whether electron-builder
26.11–26.15 carry a security fix; reachability of the `resolveMessageFilePath` concatenation.
