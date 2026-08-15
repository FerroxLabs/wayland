# Handoff, 2026-08-12 evening

Start here. **[X]** means proven by executing something, not by reading code.

---

## 0. The live pass ran. Read this first.

**`packet/wl-integration` @ `b2d770d45`**, pushed to `ferrox`. Four commits on top
of the state §1 describes.

**The suite is fully green for the first time: 17,452 passed, 0 failed [X].**
The `constitutionReclaimNotice` red is gone — see below, it was never a flake.

Everything §3 listed as "never been seen running" that could be run WITHOUT the
GUI has now been run. What it found:

**The concierge diag subprocess works, and it discriminates [X].** Driven as a
real stdio subprocess with only env vars set — the exact contract the app uses.
Three cases: a healthy fixture (the real bundled whisper-tiny, an intact install
receipt, TVControl on) reports clean; a damaged one names the exact missing model
files and the interrupted install; unset env says "not set" rather than "fine".
All three new sections appear in the live tool enum. The written-but-not-wired
risk on the env wiring is closed by execution, not by a test.

**The morning report runs end-to-end [X]** — 74 names, zero NO DATA, real bar
2026-08-11, exit 0, and a 77 KB HTML brief.

**And running it found a real defect.** The nine scripts were ES modules named
`.js` under a package.json that declares no module type. Node 20.19+ rescues them
by sniffing for import syntax; anything older throws a SyntaxError at the first
import, so the report never starts. Proven by running it with detection off.
Renamed to `.mjs` (`35367bc49`) — the extension travels with the file, which a
copied `scripts/` directory that lost its package.json would not. The JSON payload
is byte-identical by sha256 before and after [X].

**Three guards added where nothing was watching**, each mutation-checked against
real source and data rather than its own fake:

- The skill had **no test at all**, so three separate documents could name a
  script that does not exist and stay green.
- The routine seeder had no test, and both its failure modes are silent. Now
  confirmed: all 13 routines seed, every workflow name resolves, every job ends
  up **disabled**, and a second run adds nothing. Writing it corrected an
  assumption of mine — the routine id is `weekday-morning-report`, the workflow
  it fires is `wayland-morning-report`.
- Only 2 of 22 skill-pinning presets were guarded. All 22 resolve today; the
  guard locks that in. Smart Trader's two skills are proper bundled dirs.

**The Constitution test was never flaky.** It runs the real service against a
real corrupted key ring — real key derivation, a real native binary per test,
~8s for four tests against a 10s budget. The cargo build it shells out to is
0.087s warm and there are no sleeps, so crossing 10s under load was arithmetic.
Budget raised to 30s; no assertion touched.

**A trap that cost real time: `rtk` wraps `diff` and it LIED.** It reported
"Files are identical" for two files that differ on line 78. `cmp` disagreed.
Use `/usr/bin/diff` and `shasum` — never the bare command — when a comparison is
load-bearing.

**Still not verified — needs the GUI, and that is now the whole remaining gap:**
Smart Trader has never met a chart, no Concierge turn has read the new
diagnostics, the routine has never fired, and the doctor's new checks have never
been seen in the UI. Everything reachable without a window has been run.

Companion doc: `.planning/PLAN-2026-08-12-smart-trader-and-doctors.md` (the plan these
commits execute, including decisions already made — do not relitigate them).
Prior handoff: `.planning/HANDOFF-2026-08-12.md` on `packet/attribution-audit`.

---

## 1. Where the code is

**`packet/wl-integration` @ `1558afbba`**, pushed to `ferrox`. Twelve commits on top of
`b301e1c91`.

**Full suite: 17,427 passed / 12 failed [X].** Eleven of the twelve were mine (locale parity,
fixed in `1558afbba`). The twelfth is the known `constitutionReclaimNotice` timing flake —
**4/4 in isolation at 8.18 s against a 10 s budget [X]**. It will keep failing under load
until that timeout is raised.

⚠️ **The background runner reported exit 0 with 12 failures.** Do not trust the exit code of a
backgrounded vitest run; read the counts.

| commit      | what it fixes                                                         |
| ----------- | --------------------------------------------------------------------- |
| `fe0753fc3` | wcore preset assistants silently lost their whole persona             |
| `2259fa41f` | engine contract pin check (first version — wrong, see below)          |
| `5e83189a7` | MCP checks count tools, not just servers                              |
| `dc97a0b3c` | contract pin **compares** instead of testing for presence             |
| `c6c401a22` | morning report ported to Node                                         |
| `53bd06d58` | recovers personas stranded on the ACP key                             |
| `e79f5a115` | concierge diag: voice, agent installs, TVControl **+ the env wiring** |
| `0771c7b7f` | Smart Trader assistant + TVControl setup skill                        |
| `20ae83947` | morning-report routine, seeded disabled                               |
| `e267ba059` | Concierge persona brought current + two proposal-kind contracts       |
| `1558afbba` | any Lucide icon usable; locale parity repaired                        |

---

## 2. The defects that were real, and how they were found

**The persona bug (`fe0753fc3`) was the session's biggest find.** For a preset assistant,
rules were written to `extra.presetContext` for every backend except gemini. wcore reads
`presetRules` and only that. It failed **invisibly**: `presetAssistantId` IS persisted, so the
Constitution, the capabilities manifest and the assistant's NAME all still loaded — Concierge
introduced itself as Concierge and answered like the bare coding agent underneath. Affected the
conversation `+` menu and every wcore team specialist. The home page hand-builds its own call
and was already correct, which is why nobody caught it.

`53bd06d58` is its other half and is **load-bearing for any persona work**: `presetContext` was
never dropped at creation (an earlier commit message of mine said so and was wrong) —
`ConversationServiceImpl` copies unconsumed `extra` keys onto the row. So every affected
conversation still holds its persona on a key nothing read. Without the fallback, rewriting an
assistant's markdown reaches only chats created after the fix.

**The contract pin check was wrong when first shipped.** Its first version failed on _absence_
of the pinned digest. But a Core advertising no `ready.contract` is a SUPPORTED configuration —
`DesktopCoreV1Consumer.negotiate` sets mode `legacy` and carries on. It would have told users of
a working install to reinstall, and an engine from an accepted in-app update lives in userData
where reinstalling does not reach. An adversarial audit broke it; `dc97a0b3c` extracts the
digest and fails only on a genuine mismatch. Absent = legacy = pass.

**The morning-report port is byte-identical to the Python [X]** — 52 KB JSON payload and the
report text both diff clean against a pinned reference, and the port is deterministic across
runs. But two real bugs were found by running it against a **deliberately malformed cache**,
which the byte diff could never have caught: Python's empty dict is falsy, JS's `{}` is truthy,
so a corrupt cache file crashed the whole report where Python degrades to zero rows. The same
hole in the scan loop would have taken all 74 symbols down instead of marking one "no data".

**The concierge diag sections were written, 34/34 green, and DEAD.** Every test injected the
deps directly while nothing in the app set them. An independent verifier caught it. Wired in
`e79f5a115`, with a contract test pinning each dep to the env var the reader falls back to —
because the failure was a NAME going out of step between two files, which injecting values can
never detect.

---

## 3. Verified vs not

**Verified by execution [X]:** the byte-identical port; the port's fail-loud path (exit 1 on an
unresolvable symbol, where Python exits 0); the pin digest probe discriminating on the real
binary with a known-positive control; all 48 Lucide names converting cleanly; Smart Trader's
`defaultEnabledSkills` resolving to real directories; the routine's workflow name resolving in
`index.json` (all 13 routines resolve); locale parity 83/83; the full suite.

**NOT verified — nothing here has been seen running:**

- Smart Trader has never met a real chart.
- The routine has never fired.
- No Concierge turn has ever read the new diagnostics.
- The morning report has never run end-to-end through the routine.
- The new diag sections have never run in the actual subprocess (only in-process tests).

Every defect that mattered today came from running something. **A live pass is the next real
gate**, and it should happen before the Core bump adds a variable.

---

## 4. Open, in the order I would do them

1. **Wire the two proposal handlers.** `install_agent` and `enable_routine` are contracts with
   nothing behind them — no detector arm, no card arm, no apply handler, and the persona
   documents no format, so the model cannot emit them. Inert by construction, deliberately:
   these are write paths into a user's machine and half a write path is worse than none.
   `enable_routine` is the cheap one and pairs with the routine that just landed.
2. **The new Wayland Core.** When it lands, `DESKTOP_CORE_V1_PIN` (`desktopContractV1.ts:37`)
   needs updating, and `engine.contractPin` will say in one line whether binary and pin agree.
   Run `/doctor` immediately after the bump. This is the failure that silently killed every turn
   last time.
3. **Live pass** — see §3.
4. **Voice conversationality.** Still unbuilt; overtaken this session. Design is settled and two
   of its four parts already ship (streaming first sentence, barge-in). What remains: a
   dedicated **visible** "Voice" conversation pinned to a conversational persona and a fast
   model, so tapping the orb stops inheriting the coding agent. Sean chose visible, not hidden —
   "hidden" does not exist here (six leak paths, four with no filter), and `isHealthCheck`
   conversations are **DELETED on startup**, not hidden.
5. Raise the `constitutionReclaimNotice` timeout.
6. Sean-only: Nano attested release with a **namespaced** tag; the second Constitution damage
   mode (mid-payload corruption → raw `_INVALID`); 95 renderer-side shadowed i18n keys.

---

## 5. Traps this session paid for

- **`rtk` truncates and misroutes.** Use `/usr/bin/git`, run vitest as
  `node ./node_modules/vitest/vitest.mjs run --root <abs>`, and never trust a backgrounded
  vitest exit code.
- **`/usr/bin/cat` does not exist on this machine.** Use the Read tool.
- **The fabricated-fixture trap hit a seventh time**: a test asserted `success: true` with no
  `tools`, a shape `validateProbeTools` throws on, so production can never produce it.
- **Written-but-not-wired is the dominant failure mode of parallel agents.** Three separate
  instances: dead env vars, dead proposal kinds, and a `defaultEnabledSkills` name that would
  have contributed nothing. Two silent-failure wiring traps are worth checking by hand every
  time: a skill name that does not match a directory only logs a warning, and a routine whose
  workflow is not in `index.json` is silently skipped and never seeds.
- **Locale parity is gated.** Adding an en-US key alone breaks eleven tests. Doctor check names
  are untranslated placeholders — match that, do not half-translate.
- **Python/JS divergences that produce plausible wrong answers**: `//` floors vs `Math.trunc`
  truncates; `%` takes the divisor's sign vs the dividend's; `round()` is half-to-even vs
  half-up; empty dict/list falsy vs `{}`/`[]` truthy. CPython 3.12+ `sum()` also uses Neumaier
  compensated summation, which a naive `+=` does not reproduce.

---

## 6. Claims withdrawn — do not re-assert

- "Concierge can diagnose but not act." **Wrong.** It has propose → confirm → apply over five
  kinds including `add_mcp` (`conciergeConfig.ts:39-44`), with an inline consent card.
- "There is no agent-callable way to install an MCP server." Misleading — it is not a tool call,
  it is a `[CONCIERGE_PROPOSE]` block the user confirms.
- "`presetContext` is dropped at creation." Wrong — it is persisted as an unconsumed key.
- "The morning report cannot be scheduled." Overstated. A cron turn is an LLM turn with Bash
  under `yoloMode`; a skill can run a script. The real problem was **deployment**, now solved.
- "`~/dev/resources/` holds the upstream archives." It does not exist. No AionUi archive is on
  disk anywhere.
- An audit claimed a live false FAIL from an override engine on this machine. **Not
  reproducible** — the real profile has no override dir; all others are `.DISABLED` bar a
  scratch `Dev-ISO`. The conclusion stood; the repro was overstated.
