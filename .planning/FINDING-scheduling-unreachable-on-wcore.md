# Scheduling by chat is unreachable on the Wayland Core backend

**Status: static analysis complete, NOT yet live-confirmed.** Every hop below is cited at
file:line and was read, not inferred. The end-to-end claim still needs the live test in the final
sweep — see "How to confirm" at the bottom. Treat the mechanism as established and the
user-visible symptom as expected-but-unproven.

## Why this was investigated

The unbuilt "set this up by chat" packet carried one blocking precondition: *does the
`[Scheduling (CRITICAL)]` block reach Concierge's system prompt?* The plan verified only
`prepareFirstMessageWithSkillsIndex`, but `WCoreManager` calls a different builder.

**The precondition resolves NO.** The packet must not ship as planned — the button would render a
CTA whose whole purpose is to make the model emit `[CRON_PROPOSE]`, on the one backend that is
never told to do that. But the investigation found the underlying feature is already broken
independently of the button, which matters far more than the button did.

## The three prompt paths diverge

| backend | builder | `[Scheduling (CRITICAL)]` | `[Skills Location]` paths | `[LOAD_SKILL:]` intercepted |
|---|---|---|---|---|
| ACP (Claude / Codex / OpenCode) | `prepareFirstMessageWithSkillsIndex` (`agentUtils.ts:615`) | **yes** (`:664-672`) | yes (`:651-662`) | n/a — reads files directly |
| Gemini | `buildSystemInstructionsWithSkillsIndex` (`agentUtils.ts:728`) | **no** | no | yes (`GeminiAgentManager.ts:1301`) |
| **WCore (Concierge default)** | `buildSystemInstructionsWithSkillsIndex` (`agentUtils.ts:728`) | **no** | no | **no** |

`WCoreManager.ts:555` calls `buildSystemInstructionsWithSkillsIndex`. That function pushes only
`indexText`, the team guide, the capabilities manifest, connector guidance and the workflow
protocol. The scheduling directive exists **only** in the sibling builder.

## Why the model cannot recover on its own

The parse side is wired — `WCoreManager.ts:66` imports `processCronInMessage`, and
`CronCommandDetector.ts:82` matches `[CRON_PROPOSE]...[/CRON_PROPOSE]`. So if the model emitted a
correct block it would work. It has no way to learn the format:

1. **The always-on index gives it one line.** `buildSkillsIndexText`
   (`AcpSkillManager.ts:566-577`) emits `- cron: Scheduled task management - propose, query,
   update scheduled tasks...`. The `[CRON_PROPOSE]` block format — required fields, mandatory
   closing tag (`_builtin/cron/SKILL.md:14`) — is nowhere in that line.
2. **The advertised retrieval mechanism is dead on this path.** That same index text tells the
   model to output `[LOAD_SKILL: skill-name]`. `detectSkillLoadRequest` is imported and called
   **only** in `GeminiAgentManager.ts:1301`. On WCore nothing consumes it, so the model emits the
   marker and gets silence.
3. **The per-turn retriever deliberately skips it.** `buildTurnSkillContext`
   (`agentUtils.ts:318`) auto-loads a clear winner only `if (!alwaysOn.has(top.name))`. `cron` is
   a builtin and therefore always-on, so its body is never auto-injected — "already in context"
   is true of its *name*, not its *body*.
4. **The search tool surfaces the WRONG cron skill.** `wayland_search_skills` /
   `wayland_read_skill` read `SkillLibrary` (`searchSkillsServer.ts:120,210`), which is the
   2112-skill library — a different store from `resources/skills/_builtin/`. The library's only
   cron entry is `software-engineering/cron-scheduler`, described as *"crontab syntax, systemd
   timers, overlap prevention with flock…"*. That is generic OS crontab expertise.

Point 4 is the sharp end. The `[Scheduling (CRITICAL)]` block exists precisely to stop the model
using "cron daemons, external schedulers" that "create disconnected schedules the user can't see
or manage from the Wayland UI" (`agentUtils.ts:670`). On WCore that warning is absent **and** the
only reachable cron skill is the one teaching exactly the forbidden approach.

## Expected user-visible symptom

"Schedule this every day at 9am" on the default backend produces no confirmation card. Best case
the model says it cannot schedule; worst case it writes a crontab entry or claims success for a
schedule that does not exist in the task list. The `_builtin/cron/SKILL.md:47` rule — never say
"Done, scheduled" before the user clicks Yes — is itself only in the body the model cannot read.

## Fix direction (NOT yet built, needs Sean's call)

The directive cannot be copy-pasted: it references `${builtinSkillsDir}/cron/SKILL.md`
filesystem paths that mean nothing to a backend with no `[Skills Location]` block. Two options:

- **Narrow:** add a path-free scheduling directive to `buildSystemInstructionsWithSkillsIndex`
  that inlines the `[CRON_PROPOSE]` format instead of pointing at a file. Fixes Gemini too.
- **Structural:** wire `detectSkillLoadRequest` into `WCoreManager` so the advertised
  `[LOAD_SKILL:]` contract is honoured on every backend that advertises it. Larger blast radius;
  fixes the general case rather than just cron.

Recommend the narrow fix first — it is the one that restores the user-facing feature, and it can
be verified by the live test directly. The structural gap should be filed separately.

## How to confirm (live, before any fix ships)

1. Launch with a WCore-backed conversation (not raw-engine mode — `WCoreManager.ts:553` skips
   injection entirely when `rawEngineMode` is set).
2. Send "remind me to check the build every day at 9am".
3. **Expected today:** no `[CRON_PROPOSE]` card. Confirm against the ACP backend, where the same
   prompt should render the card — that is the positive control that proves the test itself works.
