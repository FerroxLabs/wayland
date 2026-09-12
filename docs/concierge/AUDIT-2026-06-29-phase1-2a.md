# Concierge — Council Audit (Phase 1 + 2a)

**Date:** 2026-06-29 · **Branch:** `feat/concierge` · **Base:** `266d42e9e` ·
**Run:** `wf_5c747059-284` (21 agents: 6 finders + 3 business seats + 3 DevOps seats + 8 verifiers + convergence)

## Verdict: **GO-WITH-FIXES**

Architecturally sound and worth shipping as a unit + building Phase 2b on top of — but **NOT shippable
as-is**. Three independently-verified defects must be fixed before ship; two break headline features.
The wedge ("knows / diagnoses / acts, secured in-process, never lies about itself") is right, the
security model structurally beats AionUI, and the 2b plan (propose→confirm→apply mirroring cron) is sound.

- **Business council:** ship-with-changes (all 3 seats converge; blocking concern = truthfulness at the trust surface).
- **DevOps council:** no-go until the better-sqlite3 binding is fixed, then go.
- **Verification:** 18 findings raised → 8 medium+ adversarially verified against live code → **8 survived, 0 refuted**.
- **Coverage gap:** the _performance_ finder crashed (StructuredOutput retry cap); that dimension was NOT
  covered by a dedicated seat. Re-run before final sign-off. (Per-turn cost was partially covered by the
  correctness finding on `isCapabilityIntent`.)

---

## BLOCKERS (must fix before ship) — all independently re-confirmed

### B1 · CRITICAL · Bundled diag subprocess cannot load `better-sqlite3` → scheduledTasks + providers dead in every build

`conciergeDiagServer.ts:31` hard-imports native `better-sqlite3`; `scripts/build-mcp-servers.js` marks
external only `['electron','bun:sqlite']`, so esbuild inlines it and `require('bindings')('better_sqlite3.node')`
can't resolve from `out/main`. `openReadonlyDb` catches → `{available:false}` → the two SQLite-backed sections
(`scheduledTasks`, `providers`) are dead. Unit test uses the unbundled node_modules copy, so CI stays green.
**Fix:** mark `better-sqlite3` (+ native transitive deps `bindings`/`node-gyp-build`/`file-uri-to-path`)
external for the diag esbuild target so `require` resolves the asarUnpacked `node_modules` at runtime (mirror
the main process); confirm asarUnpack covers hoisted deps; add a **packaged-spawn smoke test** that opens a
real `wayland.db` and asserts `available:true`.

### B2 · HIGH · `concierge` i18n namespace registered in 0/12 locales → panel renders raw keys in every language

All 12 `locales/*/index.ts` omit `import concierge` + the export entry (verified 12/12 missing; 12/12
`concierge.json` present). i18next bundles only from those static exports, so `WaylandCapabilitiesPanel`'s
13 `t('concierge.*')` call sites render literal keys. Typecheck/i18n-key checks pass (keys are in the `.d.ts`).
**Fix:** add `import concierge from './concierge.json';` + `concierge,` to all 12 locale `index.ts` (mirror
`projects`); run `node scripts/check-i18n.js`. Add a cold-start render test asserting the namespace resolves.

### B3 · HIGH · Capabilities manifest skill count inflated + internally inconsistent (trust anchor lies)

`readSkillTotal()`/`buildSkillsLine` call `stats()` with NO type filter → "Skills: N available" includes
~107 workflows + ~25 agent-profiles, disagreeing with its own `{type:'skill'}` category breakdown by ~130,
and double-counting workflows against the separate Workflows line. The unfiltered total also seeds the cache key.
**Fix:** source from `stats({type:'skill'}).total` (or `list({type:'skill'}).length`); add a test asserting the
headline equals the summed skill-only categories and excludes workflows.

---

## RECOMMENDED BEFORE 2b (land with the ship)

- **HIGH · redact() DSN/short-token bypass** — `redact()` only masks values preceded by a known key NAME;
  connection-string creds (`postgres://admin:s3cr3t@…`) and bare 12–16-char tokens pass through into
  model-visible diagnostics output. Add a URI-userinfo redactor + a generic-token rule adjacent to `:/@/=`;
  fixtures for postgres/redis/mongodb/amqp DSNs + a bare token. On the critical path before any 2b/2c remote exposure.
- **HIGH · failure mode is unobservable** — canary only stats the `.js` file; readers swallow errors. Add a
  first-turn spawn-and-register smoke check + log the caught `openReadonlyDb`/`readConfigJson` error (redacted)
  to stderr so "driver failed to load" ≠ "DB legitimately missing". Pairs with B1.
- **HIGH · no kill-switch for the cross-cutting manifest injection** — injection touches ALL assistants/backends
  with zero in-field reversibility. Add `ProcessConfig` flag `concierge.capabilityInjection` (default true)
  checked at the top of `resolveTurnCapabilityAdvert()` + `resolveCapabilitiesManifest()`. Land WITH the ship;
  `concierge.defaultPersona` does NOT cover injection.
- **MEDIUM · panel can render "out of 0"** — don't render the count until it resolves positive; non-numeric
  label until `skillCount > 0`. Never show 0/placeholder on the highest-trust surface.
- **MEDIUM · "Tailored to your setup" oversold** — gate `whyDidntRun` behind `scheduledCount > 0`; make
  `exploreFeatures` state-aware or soften the subtitle.
- **MEDIUM · `isCapabilityIntent` false-positives** — 7/11 generic phrases match ("build a model airplane",
  "team roster", …). Drop bare `model/team/skill/automation` (or require a Wayland qualifier) + drop broad
  verbs `build/create/add`; add the false-positive corpus as regression tests.
- **MEDIUM · "connected" vs "configured"** — manifest says providers are "connected" when merely configured;
  cross-reference `model_registry_providers.state` or reword to "N added/configured".
- **MEDIUM · ACP native-skills + Fuigo/Gemini wiring untested** — the spec-named acceptance-critical native ACP
  branch hand-assembles the manifest inline with zero coverage; add manager-level presence/absence assertions.
- **MEDIUM · 2a diag seed path/env + `sanitizeToken` untested** — add initStorage seed test (env keys → real
  paths, idempotent re-point, concierge in enabledByDefault) + `sanitizeToken` injection cases.

## OPEN QUESTIONS FOR SEAN (genuine product calls)

1. **concierge-diag scope** — global (current, mirrors search-skills; any-agent exfiltration surface + BM25 budget)
   vs gated to the Concierge persona. _Council rec: gate to Concierge before 2c._
2. **Release sequencing** — confirm ship 1+2a+2b as one PR; never cut a knows+diagnoses-only build with
   action-shaped "set it up for you" copy (would break "never lies about itself"). _Council rec: enforce combined unit._
3. **Reversibility** — `concierge.defaultPersona` has no settings toggle and the panel has no dismiss. Add a real
   user-facing toggle + panel auto-retire, or stop calling it a user setting? _Council rec: add the toggle._

## NICE-TO-HAVE (post-ship)

agentKey dead-plumbing removal · orphaned `isBuiltinConciergeDiag*` exports · workflow signal in manifest cache key

- wire `invalidateCapabilitiesManifestCache()` · home-dir/username scrub in diag `source` fields · state-agnostic
  phrasing in `concierge.md` · listing regex include workflows/assistants/teams · derive asarUnpack/REQUIRED_MCP from
  `MCP_STDIO_SCRIPT_NAMES` to kill 4-list drift · guard the diag seed block from dropping same-run mcp.config updates.

---

## REMEDIATION OUTCOME (same day)

All blockers + highs + applicable mediums fixed. Re-audited against live code (run `wf_97cb388f-d8f`,
9 agents): **GO — 0 blocking issues.** All 3 prior blockers verified genuinely closed; all 9 fixes
hold. Only **3 low survivors** (verified), all diag-redaction refinements, folded into the diag
persona-gating fast-follow (#9) — diag is not persona-exposed until then, so they are not urgent:

- **SEC-1 (low):** `scrubHome()` covers `source` labels but not data-bearing fields (log lines, cron
  `last_error`, provider `error`) — OS username can leak there. Fix: apply `scrubHome` in `sanitize()`'s
  string branch.
- **SEC-2 (low):** URL-userinfo masker misses the colon-less `scheme://TOKEN@host` form for 12–23-char
  tokens (≥24 already caught by the shape rule). Fix: sibling regex masking the pre-`@` userinfo run.
- **NR-1 (low):** the new redact() rules over-mask some non-secret identifiers (≥24-char slugs, task
  names). Diagnosis still survives. Fix: exempt `name`/`id`/`state` keys from shape-level redaction.

Two low UX findings fixed in this pass: **CORR-01** (suppress the "Connect a model" first-paint flash
until providers resolve) and **NR-3** (Concierge launch tile given a distinct `research` palette, not
aliased to Cowork). **NR-2** (a few bare-generic Wayland intents now under-fire for non-Concierge
assistants) left as-is — acceptable: Concierge always carries the manifest and the kill-switch backstops.

### Final gate (remediated unit)

| Gate           | Result                                    |
| -------------- | ----------------------------------------- |
| Typecheck      | **exit 0**                                |
| Full suite     | **11,544 passed / 0 failed** (24 skipped) |
| Lint (changed) | **0 errors**                              |
| i18n           | **passed**                                |
| AI signatures  | **none**                                  |

**Phase 1 + 2a is sound and ready to build Phase 2b on.**
