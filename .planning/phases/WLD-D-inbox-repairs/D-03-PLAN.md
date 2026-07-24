---
phase: WLD-D-inbox-repairs
plan: D-03
type: execute
wave: D2
depends_on: []
files_modified:
  - src/process/services/skills/SkillLibrary.ts
  - tests/unit/process/services/skills/skillGuardExemption.test.ts (new unit)
  - tests/unit/process/services/skills/skillLibrarySweep.test.ts (fixture updates)
autonomous: false
blocking: true
github_issue: 885
---

> **Source of truth:** `D-03-RESEARCH.md` (root cause traced end-to-end at HEAD
> `0188de8f6`, all file:line verified) and the locked facts in `D-CONTEXT.md`.
> Confidence HIGH on root cause and fix boundary. A1 (skills-library ships as
> read-only extraResources inside the signed bundle) is CONFIRMED — `electron-builder.yml`
> ships `.skill-pack/skills-library → skills-library` from the packed blob. Do not
> re-derive the diagnosis; build the exemption at the verdict producer.

<objective>
#885 — builtin/first-party skills that ship inside the app (`source: 'wayland-library'`)
are run through the same malware/prompt-injection scanner as untrusted imported skills.
The regex ruleset flags legitimate first-party content (`.env`, `Bearer <token>`,
`| bash`, `eval(`, `~/.ssh/`) as *critical*, `computeVerdict` returns `blocked`
(`SkillGuard.ts:72`), and 8 downstream enforcement gates refuse to load the skill. That
is #885: legitimate builtin skills get quarantined and won't load.

Root cause is at the verdict **producer**, not the gates: `SkillLibrary.rescanStale`
(`SkillLibrary.ts:549-613`, scan at `:580`) and `rescanIfStale` (`:496-510`, scan at
`:504`) select stale entries by `scannerVersion` only (`:555`) — no source exemption — so
the boot sweep flips trusted bundle skills to `blocked`/`review`.

Deliver (LOCKED fix boundary — producer only): add a `wayland-library`-only,
bundle-anchored exemption in `rescanStale` + `rescanIfStale` that stamps a synthesized
`clean` report **without** calling `SkillGuard.scan`. Leave every enforcement gate
(`loadBody:432`, `getSkill:487`, `SkillRetriever:88`, `agentUtils:388/421`,
`addToConversation:303`, `initAgent:59`, MCP `searchSkillsServer`) UNTOUCHED — the
exemption propagates to all consumers with zero gate edits. Tests are written FIRST
(Task 1, red→green). The exit bar is a green full unit suite + clean `tsc --noEmit`, with
the packaged-app live-verify surface handed to the orchestrator.

**Anti-spoof (security-critical, LOCKED):** exempt ONLY when
`source === 'wayland-library' && !path.isAbsolute(entry.path)`. Both facts originate
inside the signed read-only bundle: `'wayland-library'` is minted only by the bundled
`index.json` (no IPC/import vector accepts a caller-supplied source), and the relative
path proves the body resolves from the packed blob, not a writable user-data location.
`team` is deliberately NOT exempted — its bodies live in writable user-data and would be
spoofable. This supersedes the older handoff line that said "exempt wayland-library/team".

Purpose: previously-quarantined builtin skills load again in the shipped app, while the
guard stays fully intact for imported / user / cli-discovered / team skills.
Output: producer-layer exemption + Wave-0 exemption/regression tests + updated sweep
fixtures, proven green on the full suite and confirmed by a packaged live-verify.

**Scope decision (explicit):** Task 1 (producer exemption) fully closes #885 and is the
entire buildable scope of this packet. Task 2 from the research (a user "unblock" override
store for genuinely-imported skills) is a SEPARABLE enhancement, is NOT required to close
#885, introduces new quarantine re-admission code + a storage-schema change + an IPC + a
UI confirm surface, and is flagged deferrable by the research itself. Per Milestone D's
minimal-surgical-fix guardrail it is **DEFERRED** here (design captured in `<deferred>`
below so the follow-up is actionable). This is the surgical call: ship the exact #885 fix,
do not widen the blast radius.
</objective>

<tasks>

**Task 1 — Wave 0: write the exemption + security-regression tests FIRST, and repair the
fixtures the fix breaks (commit `test(D-03): ...`).**
Author these before touching `SkillLibrary`. They are the automated floor that pins the
exemption behavior and the anti-spoof guard.

- **New file `tests/unit/process/services/skills/skillGuardExemption.test.ts`** — mirror the
  existing `skillLibrarySweep.test.ts` harness exactly: `describe`/`it`, an injected
  `readFile` mock keyed by path suffix, `SkillLibrary.getInstance({ resourceDir, readFile })`
  + `resetInstance()` in `beforeEach`, and `vi.spyOn(SkillGuard, 'scan')` to observe whether
  the guard ran. Seed every fixture UNSCANNED (no `security` field → `scannerVersion` 0) so it
  enters the sweep. Assert:
  1. **Builtin loads despite a critical pattern (the #885 fix).** A `wayland-library` entry
     with a **relative** path (`bodies/trusted-critical.md`) whose body contains a critical
     pattern (e.g. references a dot-env secrets file and a piped-to-shell command) → after
     `rescanStale()` the entry's `security.verdict` is `clean`, `SkillGuard.scan` was **NOT**
     invoked for that entry, and `loadBody('...')` returns the body (not `null`). RED on
     today's code (currently scanned → `blocked`); GREEN after Task 2.
  2. **Imported still scanned (guard not weakened).** An `imported` entry (seeded unscanned)
     with the same critical body → `rescanStale()` scans it → `security.verdict` is `blocked`
     and `loadBody` returns `null`. GREEN both before and after (proves the exemption does not
     leak to non-trusted sources).
  3. **SECURITY REGRESSION — spoof rejected (the anti-spoof lock).** An entry that *claims*
     `source: 'wayland-library'` but carries an **absolute** path (e.g. `/evil/spoof.md`) with
     a critical body → NOT exempted → scanned → `security.verdict` is `blocked`, `SkillGuard.scan`
     WAS invoked for it. This proves `isTrustedBundleSkill` requires the bundle-anchored
     relative path, not just the source label. (Serve its body from the injected `readFile`
     mock — `readScanBody` joins under `resourceDir`, so key the mock on the `spoof.md` suffix.)
  4. **`team` still scanned (not exempted).** A `team` entry (seeded unscanned) with a critical
     body → `blocked`, `SkillGuard.scan` invoked. Locks the decision that writable-user-data
     sources are never trusted by provenance.
- **Update `tests/unit/process/services/skills/skillLibrarySweep.test.ts`** — repair the three
  fixtures that encode the old "wayland-library gets scanned" behavior (enumerated in
  `D-03-RESEARCH.md §5`):
  - Re-source `sneaky-skill` (currently `source: 'wayland-library'`, expected `review` at
    `:70`) to `source: 'imported'` so the untrusted-review path is still exercised; its
    assertion stays `review`. Keep `safe-skill` as `wayland-library` (now clean via exemption,
    which still increments the `verified` counter, so the existing `verified` assertions hold).
  - "never spends a model call" (`:76-88`, asserts `SkillGuard.scan` was called): the
    re-sourced `imported` `sneaky-skill` guarantees ≥1 non-trusted entry, so `scan` is still
    invoked — keep the assertion.
  - Chunked-batching `BULK_INDEX` (`:107-116`, 60 `wayland-library` entries asserting chunk
    sizes `[10,25,25]` at `:139`): re-source the bulk fixtures to `source: 'imported'` (or
    `'user'`) so they are scanned and the batching/`progress`/stalled-LLM/unreadable-body tests
    keep exercising the real scan pipeline. `rescanned` totals are unchanged.
  Verify: `bun run test:vitest skillGuardExemption` — tests 1 RED (exemption not built yet),
  2/3/4 GREEN (old code scans everything). `bun run test:vitest skillLibrarySweep` — GREEN
  (fixture re-sourcing is behavior-preserving on old code: `imported` was already scanned
  identically).
  Done: both test files committed as `test(D-03): ...` before any production edit; the
  exemption assertion (test 1) is RED.

**Task 2 — Producer-layer exemption: `isTrustedBundleSkill` + short-circuit in `rescanStale`
+ `rescanIfStale` (commit `fix(D-03): ...`).**
- Add a module-level pure helper in `SkillLibrary.ts` (alongside the other pure resolvers, near
  the top), typed `(entry: SkillIndexEntry) => boolean`, returning
  `entry.source === 'wayland-library' && !path.isAbsolute(entry.path)`. `path` is already
  imported (`:16`); `SkillIndexEntry` is already imported (`:21`). Add a head-comment explaining
  the two-fact bundle anchor and why `team` is excluded (writable user-data). Do NOT reference
  the specific critical literals the guard matches in the comment text.
- Define the synthesized clean report shape once (inline const or tiny helper):
  `{ verdict: 'clean', findings: [], scannedAt: Date.now(), scannerVersion: SKILL_SCANNER_VERSION,
  llmScanned: false }`. Omit `contentHash` (optional per `skillTypes.ts:57`) — trust is by
  provenance, not content, and skipping the read avoids ~2,000 body reads on boot (a perf win).
- **`rescanStale` (`:549`)**: partition `stale` into `trusted = stale.filter(isTrustedBundleSkill)`
  and `untrusted = stale.filter(e => !isTrustedBundleSkill(e))`. For each `trusted` entry, assign
  the synthesized clean report in place and fire `opts?.onProgress?.({ done, total, currentName })`
  so trusted entries still count toward `total` and the monotonic `done` sequence. Feed ONLY
  `untrusted` into the existing chunked scan pipeline (`scanChunk` / worker pool) unchanged. Keep
  `total = stale.length` and `return { rescanned: total }` so the count still reflects every stale
  entry. Idempotency is preserved: trusted entries now sit at `scannerVersion === SKILL_SCANNER_VERSION`,
  so a second sweep skips them.
- **`rescanIfStale` (`:496`)**: after the existing `stored >= SKILL_SCANNER_VERSION` early-return
  (`:501`) and before reading the body / calling `SkillGuard.scan`, add:
  `if (isTrustedBundleSkill(entry)) { entry.security = <synthesized clean report>; return entry.security; }`.
- Do NOT touch `loadBody` or ANY enforcement gate. Do NOT touch `SkillGuard`, `SkillImport`, or
  `skillsBridge.save/updateBody` — those produce verdicts for imported/user content and must stay
  fully scanning. Do NOT alter `TRUSTED_SOURCES` (`:305`, import de-dup only, not a guard-skip).
  Verify: `bun run test:vitest skillGuardExemption` GREEN (test 1 flips to pass, 2/3/4 stay green);
  `bun run test:vitest skillLibrarySweep` GREEN; grep confirms zero edits under any enforcement
  gate; `bun run test:vitest` full suite green.
  Done: builtin `wayland-library` (relative-path) skills sweep to `clean` with no `SkillGuard.scan`
  call; imported/user/cli-discovered/team and any absolute-path spoof stay scanned and blockable;
  no gate touched.

**Task 3 — Exit bar + live-verify handoff (human checkpoint, no code commit).**
- Full automated floor: `bun run test:vitest` (full unit suite) green, and `tsc --noEmit` clean.
  Constitution tests may flake under full-suite parallelism (pass isolated) — not a regression,
  per `D-CONTEXT.md`.
- Grep gate: no changes below the producer — confirm the 8 enforcement sites in `D-03-RESEARCH.md §1`
  are byte-identical to HEAD, and that the only `SkillLibrary.ts` diff is `isTrustedBundleSkill` +
  the two producer short-circuits.
- **Live-verify surface (orchestrator runs this by hand — this is the Milestone D acceptance):**
  build the packaged app (`bun run package`; then revert
  `src/process/services/constitution/constitutionFsAuthority.generated.ts`, which the prepackage
  step regenerates). In the running app, open a builtin/library skill that previously showed
  `blocked` (a security/credential-referencing library skill, e.g. security-review or a
  CLI/API-docs skill) and confirm it now **loads and is retrievable**; separately confirm a
  deliberately-malicious *imported* skill is still blocked. Broken build = builtin still
  quarantined; fixed build = it loads.
  Verify: full suite + `tsc --noEmit` green; enforcement gates unchanged; packaged builtin skill
  loads while imported malicious skill stays blocked.
  Done: #885 symptom retired (builtin skills load), guard intact for untrusted sources, packaged
  live-verify accepted by Sean + Claude. #885 auto-closes on merge (`github_issue: 885`).

</tasks>

<threat_model>
This change relaxes a security control, so the exemption must be un-spoofable. Trust boundary:
the code-signed / notarized read-only app bundle. `source: 'wayland-library'` is assigned ONLY
by the bundled `index.json` (server-side), and vendored bodies resolve from the packed
`skill-bodies.bin` inside `extraResources` (`electron-builder.yml`: `.skill-pack/skills-library
→ skills-library`, read-only).

| Threat ID | STRIDE | Component | Severity | Disposition | Mitigation |
|-----------|--------|-----------|----------|-------------|------------|
| T-D03-01 | Spoofing | malicious skill self-labels `source:'wayland-library'` to bypass the guard | high | mitigate | No IPC/import/CLI/team vector accepts a caller-supplied source (`D-03-RESEARCH.md §2`); `'wayland-library'` is minted only by the bundled `index.json`. Test 1/`skillGuardExemption` locks it. |
| T-D03-02 | Tampering | write a skill into a writable dir and get it trusted by source | high | mitigate | `isTrustedBundleSkill` also requires `!path.isAbsolute(entry.path)` — every externally-rooted source uses an absolute path; only vendored bundle bodies are relative. Security-regression test 3 (absolute path + `wayland-library` claim → NOT exempted → blocked) locks it. |
| T-D03-03 | Tampering | trust `team` skills whose bodies live in writable user-data | high | mitigate | `team` is deliberately excluded from the exemption; it stays fully scanned. Test 4 locks it. |
| T-D03-04 | Tampering | compromised-but-signature-valid bundle | low | accept | No per-skill hash/signature manifest ships today (`D-03-RESEARCH.md §3`); provenance-by-location is the honest integrity signal. A signed per-skill manifest is a separate, larger hardening effort outside #885's threat model. Do NOT invent a hash check with nothing to verify against. |
| T-D03-SC | Tampering | supply-chain (new packages) | n/a | accept | No new packages — Node builtins + in-repo modules only (`D-03-RESEARCH.md`: Package Legitimacy Audit N/A). |
</threat_model>

<verification>
- `bun run test:vitest` (full unit suite) green; `tsc --noEmit` clean.
- `skillGuardExemption.test.ts`: (1) builtin `wayland-library` + relative path + critical body →
  `clean`, `SkillGuard.scan` NOT called, `loadBody` returns body; (2) `imported` + critical body →
  `blocked`, `loadBody` null; (3) `wayland-library` claim + absolute path + critical body → `blocked`,
  scanned; (4) `team` + critical body → `blocked`, scanned.
- `skillLibrarySweep.test.ts`: fixtures re-sourced per §5; batching/progress/idempotency/model-call
  assertions still green.
- Grep: the only `SkillLibrary.ts` diff is `isTrustedBundleSkill` + the `rescanStale`/`rescanIfStale`
  short-circuits; all 8 enforcement gates and `loadBody` byte-identical to HEAD; `TRUSTED_SOURCES`
  untouched.
- Packaged live-verify: a previously-`blocked` builtin/library skill now loads and is retrievable in
  the running app; a malicious *imported* skill is still blocked.
- Independent cross-audit of the diff before any merge; LOCAL only, no push/merge without Sean.

**Goal-backward check — each acceptance test maps to the exemption behavior:**

| Must be TRUE (goal) | Producer behavior that makes it true | Proven by |
|---------------------|--------------------------------------|-----------|
| A builtin skill with legit "scary" content loads | `rescanStale`/`rescanIfStale` stamp trusted-bundle entries `clean` without scanning | Test 1 (clean + no scan + loadBody returns body) |
| The guard is NOT weakened for untrusted skills | non-`wayland-library` entries still go through `SkillGuard.scan` | Test 2 (imported → blocked) + Test 4 (team → blocked) |
| A spoofed `wayland-library` label cannot bypass the guard | exemption also requires a bundle-anchored relative path | Test 3 (absolute path → not exempted → blocked) |
| No enforcement gate behavior changed | producer-only edit; gates untouched | grep gate + `loadBody` blocked-skill test stays green |
</verification>

<success_criteria>
Builtin/first-party (`wayland-library`, bundle-relative) skills sweep to `clean` and load in the
packaged app — #885 retired — while imported / user / cli-discovered / team skills and any
absolute-path spoof stay scanned and blockable. The fix is a single producer-layer change; all 8
enforcement gates are untouched. Full unit suite + `tsc --noEmit` green. #885 auto-closes on merge
(`github_issue: 885`).
</success_criteria>

<deferred>
**Task 2 — user "unblock" override store (DEFERRED, not built in this packet).** Tracked for a
follow-up; #885 is fully closed without it.

Design (from `D-03-RESEARCH.md §4`, ready to lift when scheduled):
- Extend `IConfigStorageRefer['skills.preferences']` (`src/common/config/storage.ts:386`) with
  `unblocked?: Array<{ name: string; contentHash: string }>` (reuse the one revision counter /
  migration surface; do not add a new store).
- Add an `unblock` IPC + `SkillImport.unblock(...)` mirroring `confirmImport`'s content-hash replay
  guard (`SkillImport.ts:486-513`): re-read the quarantined `SKILL.md` from
  `~/.wayland/skills/.quarantine/<name>/`, re-hash via `skillContentHash`, verify it matches the
  user-approved `contentHash`, then register with an in-memory report whose verdict is downgraded so
  the gates pass; persist `{name, contentHash}`; on boot, re-admit quarantined skills whose fresh hash
  matches an override.
- Eligible for `imported`/`user` only — `wayland-library` is fixed at the producer and is never
  override-eligible. Must be an explicit, per-skill, content-bound user action with the specific
  findings shown before confirm — never a blanket "disable the guard" toggle.
- Test: `unblock` persists across a fresh `SkillLibrary`/boot re-read keyed by id + `contentHash`;
  a changed body (hash mismatch) is NOT re-admitted (`content-changed`).

Why deferred: it is new quarantine re-admission code (MEDIUM confidence, new path), touches a storage
schema + IPC + UI confirm surface, and is a separable enhancement rather than the reported bug.
Milestone D mandates minimal surgical fixes; this stays out of the #885 packet.
</deferred>

<output>
Write `D-03-SUMMARY.md` when the packet is live-test-accepted, recording: the exemption implementation
(`isTrustedBundleSkill` + the two producer short-circuits); the fixture updates made to
`skillLibrarySweep.test.ts` and the new `skillGuardExemption.test.ts`; confirmation that all 8
enforcement gates are unchanged; full-suite + `tsc` results; the packaged live-verify evidence (which
builtin skill now loads, and that a malicious imported skill still blocks); cross-audit result; and the
explicit note that Task 2 (unblock override) is deferred.
</output>
