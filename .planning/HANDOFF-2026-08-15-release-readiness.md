# Handoff — 2026-08-15. START HERE.

**`packet/wl-integration` @ `9308ead78`. ALL PUSHED to `ferrox`. 0 unpushed. Nothing tagged.**

Goal for the next session: **get a release ready.** One real blocker, one unknown, three
decisions that are Sean's. Details in §2.

**[V]** = established by executing it. Everything else says plainly what it is.

Supersedes `HANDOFF-2026-08-14-NIGHT-resume.md` (still worth reading for the earlier arc).

---

## 0. Verified state right now

| Thing | State |
|---|---|
| `tsc --noEmit` | **clean, exit 0** [V] |
| Unit suite | **17,620+ passing, 0 real failures** [V] — see the trap in §1 |
| Packaged build | succeeds; `out/` rebuilt 00:53 and matches HEAD [V] |
| Core engine pin | `DEFAULT_WCORE_VERSION = 'v0.13.0'`, and **v0.13.0 IS now tagged** on wayland-core [V] — the blocker carried in memory is CLEARED |
| Desktop version | `0.11.18` — not yet bumped for a release |
| vs `ferrox/main` | **420 commits ahead, 0 behind, NO PR open** [V] |
| Working tree | clean except the two by-design files (§7) |

---

## 1. ⚠️ THE TRAP THAT WILL FOOL YOU FIRST

**A full `vitest run` on a loaded machine reports ~9 failures that are NOT real.**

Observed: load average **43.6** (Chrome + leftover node), suite took **863s** vs **256s**
normally, and 9 tests "failed" with 30s/36s/47s/63s durations — i.e. timeouts. **Every one
of those files passes individually** [V, all 5 re-run one at a time].

Before believing ANY unit failure: check `uptime` and re-run the file alone. Do not
"fix" a timeout that is really CPU starvation.

Affected files when starved: `ChannelModelSelectionRestore`, `conversationBridge.tray`,
`constitutionFsService`, `recoveryCapture`, `missionControlActivity`,
`constitutionRecoveryConsumerJourney`, `constitutionRouteClient.native.contract`,
`skillLibrary`.

---

## 2. Release gates, in priority order

### 2.1 🔴 BLOCKER — a real user-visible crash

**Roughly 1 run in 3, the app sits in its React error boundary:**

> "Something went wrong | An unexpected error occurred | Reload this view"

Reproduce: run `tests/e2e/specs/team-navigation-chaos.e2e.ts` as a FILE (not `-g`). The
`junk hash routes` case fails ~1 in 3 because the app is ALREADY broken when it starts —
left that way by the preceding case, `refresh during BuildMyOwn flow`, which calls
`page.reload()` while a BuildMyOwn suggest is in flight.

Captured by probe at the failure point [V]:
```
PROBE_STUCK={"hash":"#/teams","bodyLen":2207,
  "head":"Something went wrong | An unexpected error occurred. | Reload this view",
  "root":191} pageErrors=0
```

**`pageErrors` is 0** — the error boundary swallows it, which is exactly why this reads as
flakiness rather than a crash. That is also why no test caught it: the suite watches
`pageerror`, and the boundary never emits one.

**Not yet root-caused.** Next step is to find what throws during a reload mid-suggest —
start at the workflow/BuildMyOwn suggest path and the component the boundary wraps. A note
documenting this is committed in the spec (`8bc5f83f8`).

I would not ship with this open.

### 2.2 🟡 UNKNOWN — no honest e2e number

Last full run: **85 failed / 535 passed / 180 skipped / 32 did not run**, against the 18:41
build, BEFORE the 9 commits below. A large share of those 85 are now fixed, but **the total
has not been re-measured**. Do not quote a number you have not run.

A full run is ~1.4h: `nohup ./node_modules/.bin/playwright test > <log> 2>&1 &`.
**Run it on an idle machine** or §1 will bite here too.

Note "32 did not run": Playwright discards the worker after each failure, so a
failure-heavy run stops short. 85 was never a clean floor.

### 2.3 Decisions that are Sean's, not the agent's

1. **420 commits ahead of main with no PR.** This is the actual release gate.
2. **`hub-backend-install.e2e.ts` (10 failures)** tests an "Install from Market" modal that
   **no route can reach**. Its components (`LocalAgents`, `AgentHubModal`,
   `SettingsModal/index.tsx`, `AgentModalContent`) are dead code, kept green by unit tests
   that render them directly. Delete the spec, or retarget it at the replacement surface
   `AvailableToInstall` (testids `available-to-install`, `installable-tile-<id>`,
   `install-button-<id>`, `install-consent-sheet`) which has **zero e2e coverage** today?
   Deleting tests is not something I'll do unilaterally.
3. **Version bump** from `0.11.18`.

---

## 3. Still open (technical, not decisions)

- **guid pill interception — 3 failures**, `guid-agent-selection.e2e.ts:88` and
  `guid-mode-to-conversation.e2e.ts` ×2. Real in-file: Playwright reports
  `<div class="_guidContainer_…"> intercepts pointer events` for a pill that is "visible,
  enabled and stable" [V]. **Passes in isolation.** A probe showed the pill IS hittable
  alone (`topIsPillOrChild: true`, 22 pills, no overflow) [V], so the "AgentPillBar
  overflow-x: hidden clips it" theory is **WRONG** — I built that fix, it did not work, and
  I reverted it rather than ship a speculative UI change. Cause still unknown; suspect a
  leftover overlay/mask from a preceding test.
- **`redteam-extension.e2e.ts`** — the probe's inline `<script>` in a `srcdoc` iframe is
  refused by the renderer CSP (srcdoc inherits the embedder's CSP), so the spec proves
  NOTHING in either direction right now. Fix needs the fixture moved under an allowlisted
  asset root and loaded via `iframe.src`. Needs a small decision.
- **`cowork-packaged-replay.e2e.ts`** — ENVIRONMENT-REQUIRED. Needs four `WAYLAND_M8_*`
  vars plus a receipt that does not exist here. It is picked up by plain `playwright test`
  via `testMatch`, so it can only ever fail there. Add `testIgnore` or a skip guard.
- **cron (3 failures)** — agent-emitted `[CRON_CREATE]` is deliberately REFUSED
  (`MessageMiddleware.ts:371-383`); only `[CRON_PROPOSE]` + a user click creates a job, and
  the specs have no awareness of that card. Also `cron/SKILL.md:75-80` still advertises
  `[CRON_CREATE]` — the skill contract and the middleware disagree. Worth fixing.
- **`assistant-settings-skills` (1)**, **`ambient-mode/bubble` (1)** — diagnosed, not fixed.
  Bubble's fixture page exposes only `ambientAPI`, never `electronAPI`, so `invokeBridge`
  can never work there; read the bridge from the ambient MAIN window instead.
- **Nano npm RC** — NOT ours. `waylandnano@0.1.0-rc.0` ships its binary `-rw-r--r--` and
  relies on a postinstall chmod bun does not run [V]. Their fix is one line (ship 0755);
  `latest` also still points at the older alpha. Our side works the moment they republish.

---

## 4. What landed this session — 9 commits

`b96c3f3a1` agent-settings selectors + 403→401 · `f0ae057b4` extension specs retargeted ·
`c2f60bf6d` **waitForAiReply reads the reply, not the stylesheet** ·
`78d5f7afc` **Teams accordion + stale team selectors** · `8bc5f83f8` team cluster finish +
crash documented · `9308ead78` constitution envelope, channels field, workflow resume
(plus `bfc6f2ad9`, `96c866e92`, `5f25dfdf2` from the prior stretch).

### The two findings that matter more than the fixes

**1. `waitForAiReply` was reading the stylesheet.** It returned `shadowRoot.textContent`,
which concatenates the injected `<style>` block, so the poll was satisfied the instant the
shadow root mounted and **never waited for a reply at all**. One failure printed the whole
CSS variable block as the "received reply". Fixed to read `.markdown-shadow-body`.

**This turned 6 green ACP tests red** — they had been passing on that false positive. The
session-active gate was effectively a no-op across the suite. Those describes now carry a
real 180s budget. **If ACP tests look worse than you remember, this is why, and it is
correct.**

**2. Four layers of drift stacked in the team specs**, each invisible until the one above
was fixed: accordion collapsed by default → row is `h-26px` not `h-40px` → a bare
`contains(@class,"group")` also matches `group-hover:text-1` on an inner div → the sider
create button moved to `sider-team-create-inline`. Result: **34 passed / 2** across seven
team specs, from ~20 failing.

---

## 5. Method rules that repeatedly paid off

- **Verify every agent claim by execution before applying it.** Refuted this session: a
  diff that would not compile (`t` out of scope), a "shared root cause" that was five
  separate ones, a "user can never type again" product defect that was an over-broad
  locator matching the sider button **"Remote (stopped)"** (`[aria-label*="stop" i]` matches
  "stopped"), and the guid overflow theory in §3.
- **Before attributing a failure to your own change, run the OLD version.** Twice this
  session a failure that looked like my regression was pre-existing.
- **`-g` vs whole-file matters.** Several tests pass in isolation and fail in-file. That is
  state leakage, and it is a real finding, not noise.
- **Confirm a method finds a KNOWN POSITIVE before believing a zero.**

---

## 6. Harness traps (carried forward, all still true)

- **The Playwright fixture launches the COMPILED `out/` bundle** — no build step [V].
  `tests/` edits are live; **`src/` edits are invisible until `bun run package`**. Check
  `out/main/index.js` mtime before believing any e2e result about a `src/` change.
- **`locator('textarea').first()` matches Arco's HIDDEN autosize measurement textarea.**
- **`isVisible({ timeout })` is a NO-OP** in this Playwright version — the option is
  ignored and it samples immediately.
- **`test.setTimeout()` inside `beforeAll` only raises the HOOK's budget**, not the test's.
  Use `test.describe.configure({ timeout })`. Six existing calls were no-ops.
- **Inbound `session/update` frames are NOT logged.** Working and broken runs both show 0.
- **Long runs need `nohup … &`**, not the tracked-background wrapper — it SIGTERM'd the e2e
  suite twice.
- **`rtk` mangles output** — broke `wc -l`, ate the mode column from `ls -l`, choked on a
  `grep -E` alternation. Use `/usr/bin/…`.
- **`rtk` also leaks into a spawned agent's shell inside the e2e app** — a team leader
  proposed `pwd; rtk ls -la`. Same class as the known `npx vitest` hijack.
- **Run the FULL unit suite before committing, not after** — and see §1 about load.

---

## 7. Standing constraints (unchanged)

No merge, tag, release or PR without Sean — `build-and-release.yml` fires on **any** tag.
Branch pushes to `ferrox` are fine and are being done. Never touch `~/dev/wayland/app`.
gh writes must be **FerroxLabs** (it drifts to TradeCanyon). No AI signatures in commits or
PRs. No backticks in gh/wl comment bodies. **Never commit
`constitutionFsAuthority.generated.ts`** — and never `git add -A src` / `git add -u src`.
Never weaken the security shell. **Never relax, skip or delete an existing test to make
something pass** — updating a mock to match a module's real API is fidelity, not
relaxation; changing an assertion to a corrected value is fine when the change is the
deliberate product decision, and asserting the guard that IS implemented (rather than one
that never was) is not a relaxation. Never run against Sean's real profile.
Read-only agents may run in parallel; **all WRITES stay serial and by hand**.

**A test that catches a real bug SHOULD fail — say so rather than forcing it green.**

**Uncommitted by design:** `AGENTS.md` (hook-modified) and
`constitutionFsAuthority.generated.ts`.

---

## 8. Recommended order for the next session

1. **Root-cause the error-boundary crash** (§2.1). It is the only genuine ship-stopper.
2. **Kick off a full e2e run early** (§2.2) on an idle machine so it measures while you
   work on 1.
3. Take Sean's calls on the three items in §2.3.
4. Mop up §3 (guid interception, cron, redteam, cowork, bubble) as time allows.
5. Longer-term, and the reason this whole class exists: **`tests/**` is never typechecked**
   (`tsconfig.json` `include` is `src/**`) and **CI runs exactly ONE e2e spec**
   (`pr-checks.yml:845`). That is how a testid that exists nowhere, counts of 24/5/19
   against a live 60/7/53, and four stacked layers of selector drift all survived. Fixing
   individual specs treats symptoms.
