# Release state — 2026-08-15. Everything but the tag.

Sean's instruction: take it all the way to published WITHOUT hitting publish.
This is where it stopped, and why.

**[V]** = established by executing it.

---

## 0. THE ONE THING TO DO BEFORE YOU TAG

`WNANO_NPM_VERSION` in `src/common/types/acpTypes.ts` still pins
**`waylandnano@0.1.0-rc.0`**.

- npm currently publishes only `0.1.0-alpha.0` and `0.1.0-rc.0`; the `latest`
  dist-tag still points at the OLDER alpha [V, `npm view waylandnano dist-tags`].
- That RC ships `package/bin/wayland-nano.js` mode `-rw-r--r--`, i.e. NOT
  executable [V, unpacked the tarball].

This release makes Nano a first-class built-in agent. If it ships pinned to that
RC, it advertises an agent whose binary is not executable. **When Nano stable
publishes, bump that one constant, rebuild, re-run the agent specs, then tag.**

---

## 1. Why tagging is the only dangerous step

`.github/workflows/build-and-release.yml` fires on **any tag** and on pushes to
**`dev`** [V, read the `on:` block]. It does NOT fire on merges to `main`.

So: merging is safe, pushing the branch is safe, tagging is the release.

---

## 2. What was broken and is now fixed

### 2.1 The ship-stopper — the app died after a reload

Roughly one launch in three the app sat in its React error boundary
("Something went wrong / Reload this view") and stayed dead until a manual
reload.

**Root cause:** a single inline `data: rawAgents = []` default in
`useDetectedAgents`. While SWR was unresolved it built a NEW array every render.
That identity churn propagated `rawAgents` -> `availableBackends` -> `detected`
-> `recommend()` -> `TeamLauncherPage`'s `initialState` memo, and the launcher
re-hydrates through `useEffect(() => setState(initialState), [initialState])`.
A fresh `initialState` every render meant a `setState` every render, until React
tripped its nested-update guard.

**The error was React #185, "Maximum update depth exceeded"** — confirmed by
reading the guard in the built bundle (`if (50 < fe) throw Error(o(185))`), not
from recall [V].

**Why no test ever caught it:** an error boundary swallows the throw, so
`pageerror` never fires. The suite watches `pageerror`. It read as flakiness.

Fixed by hoisting a stable module-level empty array. It was the ONLY instance of
that anti-pattern in the renderer [V, grepped]. Pinned by
`tests/unit/renderer/hooks/useDetectedAgents.dom.test.tsx`, which is genuinely
red before / green after [V].

Verified: reproduced on iteration 0 of a probe before; **8/8 clean after** [V].
`team-navigation-chaos.e2e.ts` now **7/7** [V].

### 2.2 The first agent pills were unclickable

Not a test artifact. The pill row is `justify-content: center` with clipped
overflow. Selecting an agent widens that pill ~85px to reveal its label, which
pushes the row past its box, and centred overflow is clipped at BOTH edges.

Measured on a 22-agent profile [V]:

- unselected: 715px row in a 715px box, `elementFromPoint` at pill 0 returns the
  pill, click works.
- after selecting ANY pill: 799px row in a 766px box, pill 0 shifts from x=395
  to x=337, `elementFromPoint` returns `_guidLayout`, click times out.

Fixed with `justify-content: safe center` (centred while it fits, degrades to
flex-start on overflow) plus `overflow-x: auto` and the existing `scrollbar-hide`.
Chromium is 146 [V], well past the 93 that `safe center` needs.

An earlier session removed `overflow-x: hidden` alone; that could not work,
because the pill still sat outside the centred row. It was correctly reverted.

### 2.3 "Schedule this, don't ask me" produced nothing

`MessageMiddleware` has refused agent-emitted `[CRON_CREATE]` since the G-S-01
fix. The shipped cron skill still documented it as a supported override and told
the agent to use it whenever the user said "create it without asking me" — so
the exact phrasing a hurried user reaches for was the one guaranteed to produce
no task and a warning. Skill rewritten to match the host.

---

## 3. What the audit caught in MY work

An independent adversarial audit of the fix series found three real defects,
all fixed in `dc502704e`:

1. **BLOCKER** — the new install-surface spec asserted `install-version-*`,
   which only renders when a Wayland-MANAGED install receipt exists. It would
   have failed on every clean machine. The commit whose point was "stop testing
   dead UI" was itself shipping an always-failing test.
2. `overflow-x: auto` would have shown a clipped grey scrollbar thumb inside the
   9999px pill bar at the exact moment a pill is selected (base.css paints the
   thumb by default, deliberately, #523).
3. The "no cron row before the click" assertion ran before anything waited for
   the proposal card, so it passed by racing the agent rather than by the
   guarantee holding.

**Do not skip this step on the next series.** Two of the three were invisible to
me and would have shipped.

---

## 4. Known, deliberately NOT fixed

**Six bundle-vendored launcher prompts still emit `[CRON_CREATE]`** at Step 7 and
then tell the user "The Company is now standing", while the host refuses and
creates nothing. Files: `src/process/extensions/data/bundle-vendored/launchers/`
{book-publishing-house, customer-success-org, dev-shop, editorial-newsroom,
marketing-agency, sales-org}.md, plus `resources/assistant/moltbook/moltbook.md`
and 20 embedded occurrences in `resources/builtin-catalog/assistants.json`.

Left alone ON PURPOSE: rituals ALSO have a real programmatic path
(`ritualScheduler.ts` -> `cronService.addJob`), so flipping those prompts to
PROPOSE could create DUPLICATE jobs. That needs verification, not a release-day
text swap. Release notes do not claim the cron contract is fully consistent.

---

## 4b. This branch's CI had NEVER RUN — and three required checks were red

427 commits with no PR means `pr-checks.yml` never executed on this branch.
Opening PR #956 ran it for the first time and three REQUIRED checks failed
immediately. None of it was caused by the release work; all of it had been
sitting there.

1. **I18n Check** — `i18n-keys.d.ts` was missing 11 keys that earlier commits
   added to the locales without re-running the generator (voice turn-failed /
   draft-ready / notice titles from `0ba9edd50`, and `onboarding.flow.layout.*`).
   Regenerated.

2. **Code Quality** — six oxlint errors in five pre-existing test files. Four
   mechanical. TWO were suppressed with a written reason rather than "fixed",
   because the code is correct and changing it would change behaviour:
   `voiceModeSeparation` iterates a SNAPSHOT of `responseListeners` because a
   listener that unsubscribes while responding splices itself out of that same
   array; and `VoiceConversationMode`'s mock Audio must assign `this` in its
   constructor because production calls `new Audio()` itself.

3. **Unit Tests shards 1/4 and 3/4, every platform** — failed on
   `git rev-parse 991c502e...^{tree}: unknown revision`. This looked like the
   depth-1 problem the workflow comment says was already fixed with
   `fetch-depth: 0`. IT IS NOT THE SAME PROBLEM.

   🔑 **That producer commit is not an ancestor of main, of this branch, or of
   any PR ref.** It survives only under the tags `pre-secretfix-backup` and
   `strike/baseline-2026-07-17`. `actions/checkout` fetches with `--no-tags`
   unless told otherwise, so full depth still gave no path to the object. It
   passed locally ONLY because this long-lived clone still had the loose object
   in its store — which is exactly why no one saw it before a PR existed.

   Fixed with `fetch-tags: true` on the two jobs that run the assertion
   (`unit-tests`, `coverage-tests`). This would have blocked ANY PR to main.

⚠️ **Required checks for merging to `main`** (branch protection, `strict: true`):
`Code Quality`, `Unit Tests (macos-14)`, `Unit Tests (ubuntu-latest)`,
`Unit Tests (windows-2022)`. The per-shard jobs are not required; the three
aggregators are.

## 5. Standing traps (still true)

- The Playwright fixture launches the COMPILED `out/` bundle. `src/` edits are
  invisible until `bun run package` (~6 min). Check `out/` mtime before
  believing any e2e result about a `src/` change.
- A full `vitest run` under load reports timeouts that are CPU starvation, not
  regressions. Check `uptime`, re-run the file alone. This machine sat at load
  30-46 throughout (Chrome + tvcontrol).
- `rtk` silently truncates: `git log` returned 50 rows for a 422-commit range
  here [V]. Use `rtk proxy git ...` for enumeration and `/usr/bin/wc`.
- `pgrep -f "<pattern>"` in a wait loop MATCHES THE WAITING SHELL ITSELF and
  deadlocks. Use a bracket class: `pgrep -f "[e]lectron-vite build"`. This cost
  ~20 minutes here.
- `tests/**` is never typechecked (`tsconfig.json` include is `src/**`), and CI
  runs exactly ONE e2e spec (`pr-checks.yml:845`). That is the structural reason
  defects like these survive.
