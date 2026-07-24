# Phase D-03 (#885): Skill Guard blocks builtin/library skills — Research

**Researched:** 2026-07-24
**Domain:** Electron desktop app — skills security subsystem (SkillGuard scanner, SkillLibrary index, verdict enforcement)
**Confidence:** HIGH (root cause traced end-to-end against live code at HEAD `0188de8f6`; all file:line verified this session)

## Summary

Builtin/first-party skills that ship inside the app (`source: 'wayland-library'`) are run through the exact same malware/prompt-injection scanner as untrusted imported skills. The regex ruleset flags *critical* patterns like `.env`, `Bearer <token>`, `~/.ssh/`, `| bash`, `eval(` — all of which appear legitimately in first-party skills (security-review, deep-research, API/CLI docs skills). A single critical regex finding yields a `blocked` verdict, and every downstream consumer refuses to load a `blocked` skill. Result: legitimate builtin skills get quarantined and won't load. That is #885.

The root cause is **not** in the enforcement gates (`loadBody` etc.) — those are correct dumb gates. It is in the verdict **producer**: `SkillLibrary.rescanStale` / `rescanIfStale` scan `wayland-library` skills with no source-based exemption, so the boot sweep flips them to `blocked`/`review`. The surgical fix belongs **at the producer**: never assign a non-clean verdict to a trusted bundle skill. This propagates to all ~7 enforcement sites with zero changes to them.

**The change relaxes a security control, so provenance must be un-spoofable.** It is: `source: 'wayland-library'` is assigned *only* by the bundled `index.json` inside the code-signed / notarized read-only app bundle (macOS `.app`, Windows Program Files). No IPC or import vector lets a user set that source string, and vendored bodies resolve from a relative path against the read-only `resourceDir`/packed blob. The anti-spoof guard is therefore `source === 'wayland-library' && !path.isAbsolute(entry.path)` — both facts originate inside the signed bundle. **`team` is NOT safe to blanket-exempt** (its bodies live in *writable* user-data — see §2), so the exemption is scoped to `wayland-library` only.

**Primary recommendation:** Add a `wayland-library`-only, bundle-anchored exemption in `SkillLibrary.rescanStale` + `rescanIfStale` that stamps a `clean` report without invoking `SkillGuard.scan`. Leave every enforcement gate (`loadBody:432`, `getSkill:487`, `SkillRetriever:88`, `agentUtils:388/421`, `addToConversation:303`, `initAgent:59`) untouched. Update the sweep-test fixtures that encode the old behavior; keep the `loadBody` blocked-skill test green. User-override storage for genuinely-imported skills is a scoped companion (§Override) reusing `skills.preferences` in ProcessConfig.

## Project Constraints (from CONTEXT.md / AGENTS.md)

- **Desktop-only, Core-independent.** Nothing may depend on the moving `wayland-core`. This fix is entirely desktop-side — compliant.
- **LOCAL only** — no push/merge/release without Sean. Branch `worktree-agent-desktop-integration`.
- **Minimal, surgical fix.** Do not redesign the skill system. Must NOT weaken the guard for imported/cli-discovered/user skills.
- **Match existing patterns**, American spelling, no AI signatures in commits/PRs.
- **Full Factory loop** each fix: research → plan → build → independent cross-audit → full unit suite (`bun run test:vitest`) + a11y gate → live-verify → ship.
- **Always `bun run package`, never raw `npx electron-vite build`**; revert `constitutionFsAuthority.generated.ts` after packaging. Constitution tests flake under full-suite parallelism (pass isolated — not a regression).
- Stamp `github_issue: 885` in the PLAN.md frontmatter for auto-close on merge.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Skill scan / verdict production | Main process (`SkillGuard`, `SkillLibrary` sweep) | — | Trust decisions belong in main, never renderer |
| Verdict enforcement (refuse blocked) | Main process consumers (loadBody, getSkill, retriever, agentUtils) | — | Dumb gates that read `security.verdict` |
| Provenance / source assignment | Main process (index.json load, import, cli-discovery, team merge) | — | Source string must be server-assigned, never renderer-supplied |
| Builtin skill body storage | Read-only signed app bundle (`resourcesPath/skills-library`, packed `skill-bodies.bin`) | — | Tamper-evident; anchors source-based trust |
| User override persistence | Main process user-data (`ProcessConfig` → `agent.config` JSON) | — | Writable; survives restart; per-user |

---

## 1. Confirmed Root Cause — call chain (scan → verdict → refuse-load)

**Producer (where a builtin skill becomes `blocked`):**

- Boot sweep is fire-and-forget on app start: `src/process/bridge/skillsBridge.ts:404` → `runLibrarySweep()` → `SkillLibrary.getInstance().rescanStale()` (`skillsBridge.ts:44-52`). [VERIFIED: codebase]
- `SkillLibrary.rescanStale` (`src/process/services/skills/SkillLibrary.ts:549-613`) selects every entry with `scannerVersion < SKILL_SCANNER_VERSION` — **filtered by scannerVersion only, no source check** (`:555`) — and calls `SkillGuard.scan(...)` per chunk (`:580`). Vendored `wayland-library` entries ship *unscanned* (scannerVersion 0), so they are all in scope. [VERIFIED: codebase]
- `SkillGuard.scan` (`src/process/services/skills/SkillGuard.ts:26-67`) runs `SKILL_GUARD_RULES` (`:53`) and `computeVerdict(findings)` (`:57` → `:70-74`): **any `critical`-severity finding ⇒ `blocked`**. [VERIFIED: codebase]
- Critical regex rules (`src/process/services/skills/skillGuardRules.ts:58-94`): `credential-access` matches `~/.ssh/|AKIA…|Bearer\s+[A-Za-z0-9_-]{20,}|\.env\b|\bid_rsa\b` (`:65`); `network-exfiltration` matches `curl|wget … POST|--data|-T` (`:77`); `shell-execution` matches `rm -rf /|\| bash|eval(` (`:89`). These fire on the *body, description, and tags* (`scanText`, `:42`). First-party skills that document credentials/HTTP/shell trip these → `blocked`. **This is the false positive.** [VERIFIED: codebase]
- `rescanIfStale` (`SkillLibrary.ts:496-510`) has the same gap for the single-skill IPC path (`skillsBridge.ts:67`). [VERIFIED: codebase]

**Enforcement (where a `blocked` verdict refuses the skill) — all correct, all should stay unchanged:**

| Site | file:line | Behavior on `blocked` |
|------|-----------|------------------------|
| `SkillLibrary.loadBody` | `SkillLibrary.ts:432-435` | returns `null`, refuses body read |
| `AcpSkillManager.getSkill` | `AcpSkillManager.ts:487-490` | returns `null` (defense-in-depth) |
| `SkillRetriever.buildIndex` | `SkillRetriever.ts:88` | excludes from search index (`verdict !== 'blocked'`) |
| `agentUtils.retrieveSkillSuggestions` | `agentUtils.ts:388` | excludes from suggestions |
| `agentUtils.consumePendingSessionSkills` | `agentUtils.ts:421` | skips injection |
| `skillsBridge.addToConversation` | `skillsBridge.ts:303` | rejects with `error: 'blocked'` |
| `initAgent.setupAssistantWorkspace` | `initAgent.ts:59-61` | never symlinks blocked skills |
| `searchSkillsServer` (MCP) | relies on `loadBody` returning `null` | body unavailable |

[VERIFIED: codebase — grep of `verdict.*blocked` across `src`]

**Does the guard actually run on `wayland-library` skills today?** Yes — proven by the existing test `skillLibrarySweep.test.ts:56-74`, which seeds a `wayland-library` skill (`sneaky-skill`) and asserts the sweep produces a real `review` verdict. So `wayland-library` is scanned exactly like `imported`. [VERIFIED: codebase test]

**Handoff root-cause map corrections:** The handoff cited `rescanStale` at `:549-608`, guard scan at `:580`, refuse-load at `:432`, `TRUSTED_SOURCES` at `:305`. All confirmed accurate at HEAD `0188de8f6` (`rescanStale` body is `549-613`; the `:305` `TRUSTED_SOURCES` set is used only for import de-dup in `registerSource`, never to skip the guard — confirmed `SkillLibrary.ts:303-328`). No stale line numbers.

---

## 2. Provenance Integrity (the crux) — is source-based trust safe?

**How `SkillSource` is assigned** (server-side only, never renderer-supplied):

| Source | Assigned at | Path type | Storage location | Tamper-evident? |
|--------|-------------|-----------|------------------|-----------------|
| `wayland-library` | bundled `index.json` load — `SkillLibrary.ts:229-237` | **relative** (`bodies/x.md`), resolved against `resourceDir` | read-only signed app bundle (`resourcesPath/skills-library`, packed `skill-bodies.bin` #309) | **YES** |
| `team` | `teamSkillMerge.ts:130` (`source:'team'`) | **absolute** | `~/Library/Application Support/Wayland*/wayland/extensions/waylandteams/` — **writable user-data** (`teamSkillMerge.ts:61-63`) | **NO** |
| `imported` | `SkillImport._register:464` (hardcoded `'imported'`) | absolute | `~/.wayland/skills/imported/` — writable | n/a (untrusted by design) |
| `user` | `skillsBridge.ts:387` (`source:'user'`) | absolute | `~/.wayland/skills/` — writable | n/a |
| `cli-discovered` | `CliSkillDiscovery.ts:104` | absolute | `~/.claude|.codex|.gemini/skills` — writable | n/a |

[VERIFIED: codebase]

**Can a malicious skill get classified `wayland-library`?**
- **No IPC / import vector accepts a caller-supplied `source`.** `skills.save` → `'user'`; `imports.*`/`skills.import.*` → `'imported'`; CLI discovery → `'cli-discovered'`; team merge → `'team'`. The `'wayland-library'` string is produced *only* by parsing the bundled `index.json` (`SkillLibrary.ts:229`). [VERIFIED: codebase]
- **The builtin dir is inside the read-only, code-signed bundle.** `resolveSkillsLibraryDir()` (`SkillLibrary.ts:114-120`) anchors on `process.resourcesPath` → `Contents/Resources/skills-library/` (extraResources), and bodies are seek-read from the packed `skill-bodies.bin` (`SkillPack.ts`) which ships in the same read-only location. macOS: tampering breaks notarization/signature. Windows: Program Files needs admin. `registerSource` additionally forbids an `imported` entry from shadowing a `wayland-library` name (`SkillLibrary.ts:311-315`). [VERIFIED: codebase]
- **Belt-and-suspenders:** vendored `wayland-library` entries always use a **relative** path; every externally-rooted source uses an **absolute** path — this is an invariant enforced by `SkillPack.buildSkillPack:100-103` ("External (absolute) entries aren't part of the vendored library") and honored by `SkillLibrary.loadBody:446`. So `!path.isAbsolute(entry.path)` proves the body is served from the signed bundle, not a writable location.

**Verdict: source-based trust is SAFE — but only for `wayland-library`, and only when combined with the relative-path check.** The anti-spoof guard:

```ts
// src/process/services/skills/SkillLibrary.ts
function isTrustedBundleSkill(entry: SkillIndexEntry): boolean {
  // 'wayland-library' is assigned ONLY by the read-only signed bundle's
  // index.json; no IPC/import path can mint it. The relative-path check
  // guarantees the body resolves from resourceDir/packed blob (signed,
  // read-only) and never from a writable user-data location. Both facts
  // originate inside the code-signed app bundle → non-spoofable.
  return entry.source === 'wayland-library' && !path.isAbsolute(entry.path);
}
```

**`team` is deliberately EXCLUDED.** The handoff one-liner suggested exempting `wayland-library`/`team`, but team bodies live in **writable** `~/Library/Application Support/.../extensions/waylandteams/`. A local attacker who can write that dir could self-register skills as `source:'team'` and bypass the guard. #885 is specifically about builtin skills that *ship inside the app* — those are `wayland-library`. Team stays scanned (its curated skills are clean anyway; a team false positive is a separate, narrower case that the user-override path (§Override) already covers). **Do not blanket-exempt `team`.**

---

## 3. Integrity Signal — what "trust-unless-integrity-failure" can honestly hang on

**Does a per-skill hash/signature/manifest exist for builtin skills today?** **No.** There is no shipped per-skill checksum manifest, signature, or content-hash to verify a vendored body against:
- `index.json` seeds vendored entries `unscanned` with **no** `security.contentHash` (confirmed by `skillLibrarySweep.test.ts:12-32` and the fact `SkillPack.buildSkillPack` writes only `[offset, length]` ranges — no hashes, `SkillPack.ts:41-50`). [VERIFIED: codebase]
- `skillContentHash(body, description)` exists (`skillContentHash.ts:27-34`) but is computed *at scan time*, not shipped, so there is nothing pre-shipped to compare against.

**Honest minimal version of "integrity failure":** the only integrity guarantee available is *provenance by location* — the skill's body resolves from the expected read-only, code-signed bundle path (relative path against `resourceDir`, or present in the packed `skill-bodies.bin`). The signed bundle IS the integrity envelope. So:
- **Trust** = `isTrustedBundleSkill(entry)` is true (source `wayland-library` + relative path served from the bundle/pack).
- **"Integrity failure" (do NOT exempt, fall back to scanning)** = an entry *claims* `wayland-library` but has an absolute path, or its body cannot be resolved from `resourceDir`/pack. In practice this never happens for a genuine vendored skill; it is precisely the spoof/tamper case we must not exempt.

**Do NOT invent a hash check that verifies against nothing.** A shipped per-skill hash manifest would be a larger, separate hardening effort (defense against a compromised-but-signature-valid bundle — outside this bug's threat model). The location-anchored check is the honest, verifiable minimum and fully closes #885.

---

## 4. User Override Storage (companion capability)

**Existing store to reuse:** `ProcessConfig` (exported `SkillLibrary.ts`-adjacent from `src/process/utils/initStorage.ts:1623`), typed by `IConfigStorageRefer` in `src/common/config/storage.ts`. It persists to the `agent.config` JSON in user-data (writable). Skills already use it: `skills.preferences` (`storage.ts:386-393` = `{ pinned: string[]; disabled: string[]; revision: number }`) and `skills.cliDiscovery.enabled` (`storage.ts:402`), read/written via `ProcessConfig.get/set('skills.preferences', …)` (e.g. `skillsBridge.ts:283-297`). [VERIFIED: codebase]

**contentHash is already computed:** `SkillSecurityReport.contentHash` (`skillTypes.ts:57`) is set by `SkillGuard.scan` via `skillContentHash(skill.body, skill.description)` (`SkillGuard.ts:64`). `SkillImport.confirmImport` already uses it as a **replay guard** — an approval bound to exact content (`SkillImport.ts:486-513`, `:503` `if (report.contentHash !== contentHash) return 'content-changed'`). The override reuses this exact pattern. [VERIFIED: codebase]

**Recommended shape** — extend `skills.preferences` (keeps one revision counter + one migration surface):

```ts
// src/common/config/storage.ts — IConfigStorageRefer
'skills.preferences'?: {
  pinned: string[];
  disabled: string[];
  revision: number;
  /** User-approved unblocks, bound to exact content (name + contentHash).
   *  Only 'imported'/'user' skills are eligible; wayland-library is never here. */
  unblocked?: Array<{ name: string; contentHash: string }>;
};
```

**Where applied (subtle — blocked imports are quarantined, not registered):** a `blocked` import is moved to `~/.wayland/skills/.quarantine/<name>/` and **not** registered (`SkillImport._scanAndRegister:423-427`, `SkillQuarantine.ts`). So "unblock" must *re-admit* it: an `unblock` IPC mirroring `confirmImport` — re-read the quarantined `SKILL.md`, re-hash, verify the hash matches the user-approved `contentHash`, then register with an in-memory report whose verdict is downgraded (e.g. `review`) so the enforcement gates pass; persist `{name, contentHash}` to `skills.preferences.unblocked`; on boot, re-admit quarantined skills whose fresh hash matches an override.

**SECURITY NOTE (must be in the plan):** unblocking a *critical*-blocked skill (references credential stores / destructive shell) is a real risk. The override MUST be an explicit, per-skill, content-bound user action with the specific findings shown before confirm — never a blanket "disable the guard" toggle. Bind to `contentHash` so an approval can't be replayed against modified content. `wayland-library` skills are never eligible for override (they are fixed at the producer; §1).

**Scope recommendation:** Task 1 (the `wayland-library` producer exemption) fully closes the reported #885 symptom on its own. Task 2 (override store + `unblock` IPC) is a separable companion for users re-admitting their *own* imported/user skills. If Sean wants the tightest fix, Task 2 can be deferred without leaving #885 unresolved. Plan them as two tasks.

---

## 5. Blast Radius

**Readers of `SkillSource`:** `SkillLibrary.list` filter (`:342`), `registerSource` TRUSTED_SOURCES de-dup (`:305-315`), `stats.bySource` (`:392`), `skillsBridge.updateBody` read-only check (`skillsBridge.ts:264`), `SkillPack.buildSkillPack` absolute-path skip (`:103`), `CliSkillDiscovery`/`teamSkillMerge` assignment. None make a *trust/scan* decision today — safe. [VERIFIED: codebase]

**Readers of `TRUSTED_SOURCES` (`{'wayland-library','team'}`):** exactly one — `registerSource` import de-dup (`SkillLibrary.ts:305`). Not used for guard-skip. Leave as-is (it is about name-collision, not verdicts). [VERIFIED: codebase]

**Readers of `security.verdict === 'blocked'`:** the 8 enforcement sites in §1. **None change** under the producer-layer fix — they keep refusing genuinely-blocked (imported) skills. This is the surgical win.

**Verdict producers (the ONLY sites to change):**
- `SkillLibrary.rescanStale` (`:549-613`) — add exemption.
- `SkillLibrary.rescanIfStale` (`:496-510`) — add exemption.
- (`SkillGuard.scan` itself, `SkillImport`, `skillsBridge.save/updateBody` produce verdicts for *imported/user* content only — must NOT be exempted.)

**Tests that break (must update) vs. stay green:**

| Test | file:line | Under fix | Action |
|------|-----------|-----------|--------|
| sweep flips vendored to real verdicts; `sneaky-skill` (wayland-library) → `review` | `skillLibrarySweep.test.ts:56-74` | **BREAKS** — now exempted→clean | Re-source `sneaky-skill` to `'imported'` to keep testing the untrusted review path; add a `wayland-library` case asserting exemption→clean |
| "never spends a model call" — asserts `SkillGuard.scan` was called | `skillLibrarySweep.test.ts:76-88` | **BREAKS** if all fixtures are wayland-library and now skipped | Ensure fixture set includes ≥1 non-trusted source so scan is still exercised |
| chunked batching — asserts scan chunk sizes `[10,25,25]` on 60 wayland-library skills | `skillLibrarySweep.test.ts:128-144` | **BREAKS** — trusted skills skipped | Re-source bulk fixtures to `'imported'`/`'user'` so batching is still tested |
| idempotent second sweep re-scans nothing | `skillLibrarySweep.test.ts:90-98` | passes (exempt stamps scannerVersion=current) | verify |
| `loadBody('blocked-skill')` (wayland-library, seeded `blocked`, scannerVersion=current) returns null, no read | `skillLibrary.test.ts:226-238` | **STAYS GREEN** — no scan invoked; gate unchanged | none (this is the boundary proof) |
| filter by verdict `'blocked'` returns `blocked-skill` | `skillLibrary.test.ts:151-153` | STAYS GREEN — direct seed | none |
| `stats.bySource['wayland-library']` count | `skillLibrary.test.ts:190` | STAYS GREEN | none |

**Boundary insight (load-bearing):** the `blocked-skill` fixture (`skillLibrary.test.ts:33-38`) is `source:'wayland-library'` with a *directly-seeded* `security.verdict:'blocked'` at `scannerVersion:1` (= `SKILL_SCANNER_VERSION`). Because it is already at current scanner version, the sweep skips it, and the `loadBody` test invokes no scan — it tests the *gate*, not the *producer*. This is exactly why the fix must live at the producer (sweep) and must NOT touch `loadBody`: doing the exemption in `loadBody` would break this test and blur the clean gate/producer separation.

---

## 6. Test / Acceptance Floor

Framework: **vitest** (`bun run test:vitest`, `vitest run`). Unit tests under `tests/unit/**/*.test.ts` (node project). Skill tests: `tests/unit/process/services/skills/`. Style: `describe`/`it`, injected `readFile` seam, `SkillLibrary.getInstance({ resourceDir, readFile })` + `resetInstance()` in `beforeEach`.

**New/updated automated floor (extend `skillLibrarySweep.test.ts` + a new `skillGuardExemption` describe):**

1. **Builtin loads despite a critical pattern (the bug):** a `wayland-library` skill whose body contains `.env` / `Bearer <token>` / `| bash` is swept → verdict `clean` (exempted), `SkillGuard.scan` NOT invoked for it, and `loadBody` returns the body. (Proves #885 fixed.)
2. **Imported still scanned:** an `imported` skill with the same critical body → verdict `blocked`, `loadBody` returns null. (Proves the guard is not weakened.)
3. **SECURITY REGRESSION — spoof rejected:** an entry that *claims* `source:'wayland-library'` but has an **absolute** path (or a path outside `resourceDir`) is **NOT** exempted — it is scanned and a critical body yields `blocked`. (Proves `isTrustedBundleSkill` requires the bundle-anchored relative path, not just the source label.)
4. **Override persistence:** an `unblock({name, contentHash})` writes `skills.preferences.unblocked`, re-admits the skill, and the admission survives a fresh `SkillLibrary`/boot re-read keyed by `id + contentHash`; a changed body (hash mismatch) is NOT re-admitted (`content-changed`). (Task 2.)
5. **`team` still scanned:** a `team` skill with a critical body → `blocked` (team is not exempted).
6. Update the three breaking sweep tests per §5.

**Acceptance (per CONTEXT.md model — Sean + Claude live-test = acceptance):** launch the **packaged** app (`bun run package`), confirm a previously-quarantined builtin skill (e.g. a security/credential-referencing library skill) now loads and is retrievable, while a deliberately-malicious *imported* skill is still blocked. Green `bun run test:vitest` + a11y gate is the automated floor.

---

## Recommended Fix Design (for the planner)

**Task 1 — Producer-layer exemption (required; closes #885):**
- Add `isTrustedBundleSkill(entry)` = `entry.source === 'wayland-library' && !path.isAbsolute(entry.path)` in `SkillLibrary.ts`.
- In `rescanStale` (`:549`): partition the stale set — trusted-bundle entries get a synthesized clean report stamped **without** calling `SkillGuard.scan`: `{ verdict:'clean', findings:[], scannedAt: Date.now(), scannerVersion: SKILL_SCANNER_VERSION, llmScanned:false }` (contentHash optional/omitted — trust is by provenance, not content; also avoids ~2,000 body reads → a boot perf win). They still count toward `rescanned`/progress and increment the `verified` stat. Non-trusted entries scan exactly as today.
- In `rescanIfStale` (`:496`): same short-circuit for the single-skill path.
- Leave all enforcement gates untouched. Leave `loadBody` untouched.
- Update `skillLibrarySweep.test.ts` fixtures (§5) + add the §6 tests 1–3, 5.

**Task 2 — User override (companion; scoped, separable):**
- Extend `IConfigStorageRefer['skills.preferences']` with `unblocked?: Array<{name, contentHash}>` (`storage.ts`).
- Add an `unblock` IPC + `SkillImport.unblock(...)` mirroring `confirmImport`'s content-hash replay guard; re-admit from quarantine with a downgraded in-memory verdict; re-admit on boot for matching overrides.
- `wayland-library` never eligible. Surface findings + explicit per-skill confirm in UI. Add §6 test 4.

**Why not fix at `loadBody`/the gates:** would require touching 8 sites, would break the `loadBody` blocked-skill test, and blurs the gate/producer separation. The producer fix is one logical change, self-propagating, and provably the only verdict source for vendored skills (bundle `index.json` is read-only → verdicts are in-memory only, recomputed each boot; see Runtime State Inventory).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Content binding for overrides | New hashing scheme | `skillContentHash` (`skillContentHash.ts`) | Already the replay-guard primitive used by `confirmImport` |
| Override persistence | electron-store / new JSON file | `ProcessConfig` `skills.preferences` | Established skills store, typed, revision-counted |
| Bundle-path detection | `isPackaged` flags / fs probing | `!path.isAbsolute(entry.path)` invariant | Already the vendored-vs-external discriminator (`SkillPack:103`, `loadBody:446`) |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Vendored `wayland-library` verdicts are **in-memory only** — `index.json` is in the read-only bundle; the sweep mutates `entry.security` in RAM with **no writeback** (no persistence path found). Recomputed every boot. | **None** — no data migration. Once the producer exempts them, they are clean on every launch. |
| Live service config | None (desktop-local skills subsystem) | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | Packed `skill-bodies.bin` / `skill-bodies.offsets.json` (#309) ship in the read-only bundle; carry no verdicts | None |
| Quarantine / user-data | `~/.wayland/skills/.quarantine/` holds blocked *imports* on disk (not vendored). Override re-admission (Task 2) reads from here. | Task 2 boot re-admission logic |

**Verified:** no ProcessConfig key or DB table persists per-skill scan verdicts; `skills.preferences` holds only `pinned`/`disabled`/`revision`. So no stale `blocked` verdict for a builtin skill can survive the fix.

## Environment Availability

SKIPPED — no external dependencies. Code-only change using existing `node:crypto`, `node:path`, `ProcessConfig`. **No new packages.**

## Package Legitimacy Audit

**N/A — no external packages installed.** The fix uses in-repo modules and Node builtins only.

## Security Domain

`security_enforcement` is enabled (config has no `false`). This change **relaxes a security control**, so it is in scope.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control (this fix) |
|---------------|---------|-----------------------------|
| V1 Architecture / Trust Boundaries | yes | Trust anchored to code-signed read-only bundle; source string is server-assigned only |
| V4 Access Control | yes | Exemption scoped to `wayland-library` + bundle-anchored path; `team`/imported/user/cli stay gated |
| V5 Input Validation / Malicious Code | yes | Guard unchanged for all untrusted sources; overrides content-bound via `contentHash` |
| V6 Cryptography | yes (reuse) | `skillContentHash` (sha256) for override replay-binding — not hand-rolled |
| V10 Malicious Code | yes | Producer-only exemption cannot be reached by any import/IPC vector |

### Threat Patterns

| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| Malicious skill self-labels `wayland-library` to bypass guard | Spoofing | No IPC/import path accepts caller `source`; `'wayland-library'` only from signed bundle `index.json` |
| Write a skill into a writable dir and get it trusted | Tampering | Relative-path/bundle-anchor check rejects absolute (user-data) paths; `team` (writable) NOT exempted |
| Replay a user "unblock" approval against modified content | Tampering | Override bound to `contentHash`; mismatch → `content-changed` refuse |
| Compromised-but-signature-valid bundle | Tampering | **Out of threat model** — no per-skill manifest today (see §3); flagged, not papered over |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The packaged `skills-library` extraResources dir is read-only in production (macOS notarized `.app`, Windows Program Files) and tampering breaks the signature. | §2 | If a builtin dir were writable/unsigned, source-based trust would be unsafe → BLOCKER. Verify against `electron-builder.yml` extraResources + signing config during planning. |
| A2 | `index.json` ships vendored entries `unscanned` with no `security` block (no pre-shipped `blocked` verdicts). | §1, §3 | If some ship pre-`blocked` at current scannerVersion, the sweep skips them and they stay blocked — the exemption must then also normalize at index-load. Low risk (confirmed by test fixtures + pack builder). |

**A1 is the one thing to confirm before locking the design.** It is highly likely true (standard electron-builder extraResources + the app is Authenticode-signed/notarized per the milestone handoff), but the planner should add a quick `electron-builder.yml` verification task. If A1 fails, escalate as a BLOCKER (options below).

## Open Questions

1. **Should `team` ever be trusted?** Recommendation: **no** by this fix — team bodies are in writable user-data. If Sean wants team trusted, it needs its own integrity anchor (ship team inside the signed bundle, or a signed manifest) — a separate effort. Not required for #885.
2. **Ship Task 2 (override) now or defer?** Recommendation: plan it as a separate task; #885 is closed by Task 1 alone. Sean's call.

## Sources

### Primary (HIGH confidence — live code, this session)
- `src/process/services/skills/SkillLibrary.ts` (rescanStale/rescanIfStale/loadBody/registerSource/resolveSkillsLibraryDir)
- `src/process/services/skills/SkillGuard.ts`, `skillGuardRules.ts`, `skillContentHash.ts`, `SkillPack.ts`, `SkillImport.ts`, `SkillQuarantine.ts`, `CliSkillDiscovery.ts`
- `src/process/extensions/data/bundle-vendored/teamSkillMerge.ts`
- `src/process/bridge/skillsBridge.ts`, `src/process/task/AcpSkillManager.ts`, `src/process/task/agentUtils.ts`, `src/process/services/skills/SkillRetriever.ts`, `src/process/utils/initAgent.ts`
- `src/common/types/skillTypes.ts`, `src/common/config/storage.ts`, `src/common/config/skillsMigration.ts`, `src/process/utils/initStorage.ts`
- Tests: `tests/unit/process/services/skills/skillLibrarySweep.test.ts`, `skillLibrary.test.ts`

## Metadata

**Confidence breakdown:**
- Root cause & call chain: HIGH — traced producer→verdict→8 enforcement sites, all file:line verified.
- Provenance safety: HIGH — source assignment audited across all 5 vectors; pending A1 (`electron-builder.yml` read at plan time).
- Fix surgical-ness / blast radius: HIGH — single producer change, gates untouched, test deltas enumerated.
- Override design: MEDIUM — reuses proven `confirmImport`/`contentHash`/ProcessConfig patterns; re-admission-from-quarantine flow is new code (Task 2).

**Research date:** 2026-07-24 · **Valid until:** ~2026-08-23 (stable subsystem)

---

## RESEARCH COMPLETE

**Confirmed root cause:** `SkillLibrary.rescanStale`/`rescanIfStale` scan `source:'wayland-library'` builtin skills with no exemption (`SkillLibrary.ts:555,580`). The regex ruleset flags legitimate first-party content (`.env`, `Bearer`, `| bash`, `eval(`, `~/.ssh/` → critical) → `SkillGuard.computeVerdict` returns `blocked` (`SkillGuard.ts:72`) → the 8 enforcement gates (loadBody:432, getSkill:487, SkillRetriever:88, agentUtils:388/421, addToConversation:303, initAgent:59, searchSkillsServer) refuse to load it. That is #885.

**Recommended fix (surgical, at the verdict PRODUCER):** Add `isTrustedBundleSkill(entry) = entry.source === 'wayland-library' && !path.isAbsolute(entry.path)` and, in `rescanStale` + `rescanIfStale`, stamp trusted-bundle skills `clean` **without** calling `SkillGuard.scan`. Leave every enforcement gate and `loadBody` untouched (they stay dumb `blocked`-refusers for genuinely-untrusted skills). This propagates to all consumers with zero gate edits.

**Anti-spoofing guard (resolves the provenance question — SAFE):** `'wayland-library'` is assigned ONLY by the read-only, code-signed bundle's `index.json`; no IPC or import vector accepts a caller-supplied source. The `!isAbsolute(path)` check proves the body is served from the signed `resourceDir`/packed blob, not writable user-data. **`team` is NOT exempted** — its bodies live in writable `~/Library/Application Support/.../waylandteams/`, so trusting it by source would be spoofable. Scope the exemption to `wayland-library` only.

**Integrity signal (honest minimum):** No per-skill hash/signature/manifest ships today, so "integrity failure" is defined by *provenance-by-location* — trust only when the body resolves from the signed read-only bundle; a `wayland-library` claim with an absolute/out-of-bundle path is the failure case and is NOT exempted. Do not invent a hash check with nothing to verify against.

**Override-storage decision:** Reuse `ProcessConfig` → `skills.preferences` (user-data `agent.config` JSON); add `unblocked?: Array<{name, contentHash}>`. Reuse the existing `skillContentHash` + `confirmImport` replay-guard pattern. Eligible for `imported`/`user` only; content-bound; explicit per-skill consent. Scope as a separable **Task 2** — Task 1 alone closes #885.

**Test plan:** Producer exemption tests (builtin-with-critical-body loads; imported-with-critical-body still blocked); **security-regression test** (entry claiming `wayland-library` with an absolute path is NOT exempted → still scanned/blocked); `team` still scanned; override persists across restart keyed by id+contentHash and rejects on hash mismatch. Update the three `skillLibrarySweep.test.ts` fixtures that encode the old "wayland-library gets scanned" behavior; the `loadBody` blocked-skill test stays green (it seeds an artificial verdict and tests the gate, not the producer).

**One item to confirm before locking (A1, not a blocker yet):** verify in `electron-builder.yml` that `skills-library` ships as read-only extraResources inside the signed/notarized bundle. Highly likely true (app is Authenticode-signed + notarized per the milestone handoff). **If it turns out the builtin skills dir is writable or unsigned, escalate as a BLOCKER** — options then: (a) move builtin skills into the signed asar/bundle before trusting by source, or (b) ship a signed per-skill hash manifest and verify against it (the real "integrity failure" signal). Neither is needed if A1 holds.

**Ready for planning.**
