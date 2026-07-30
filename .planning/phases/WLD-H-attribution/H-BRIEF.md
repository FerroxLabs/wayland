# WLD-H — Attribution and provenance audit: scoping brief

**Status: SCOPED, not started.** Written 2026-07-30 for a fresh session (the scoping session was at 59%
context and deliberately stopped before doing the work).

Branch `packet/attribution-audit` off `15d6740aa`. Nothing has been changed yet.

---

## 0. The ask, and where it does not survive contact

Sean's ask: remove the comments and references that read like "we forked/stole this from X", specifically
naming **OpenClaw**, **fork**, and **Hermes claw**. Remove attribution only where we authentically can.

**Two of those three are not attribution at all, and the third is the one item we legally must keep.**
Do not start deleting on the original framing. Findings below were each verified in the code.

---

## 1. `openclaw` and `hermes` are FUNCTIONAL. Do not touch them.

Grep counts look alarming — **235 files** contain `openclaw`, **77** contain `hermes` — but they are
integration code for tools Wayland deliberately supports:

| Evidence                                                                                           | Meaning                                                                                                    |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/common/types/detectedAgent.ts:21` — `RemoteAgentProtocol = 'openclaw' \| 'zeroclaw' \| 'acp'` | a **wire protocol identifier**                                                                             |
| `src/common/types/migration.ts:20` — `MigrationToolId = 'hermes' \| 'openclaw'`                    | Wayland **imports user data FROM** those tools                                                             |
| `src/process/task/OpenClawAgentManager.ts`                                                         | a supported **agent backend**, sibling to `GeminiAgentManager` / `AcpAgentManager` / `NanoBotAgentManager` |

These are string values that get **persisted** (config, DB rows, saved agent setups) and drive a shipped
migration feature. Renaming or removing them breaks existing users, silently. They also say nothing about
our provenance — supporting and migrating people off a competitor is a selling point.

**Verdict: OUT OF SCOPE. Hard do-not-touch list.**

Distribution, for reference: `src/process` 111, `tests/unit` 47, `src/renderer` 46, `out` 36 (build output),
`docs` 10, `src/common` 9, `.smoke` 9.

---

## 2. The single genuine fork statement is license-required. Do NOT remove it.

Exactly one real "fork of" claim exists in the tree:

- `THIRD-PARTY-NOTICES.md:22,24` — "**Wayland-Core (fork of aionrs)** … a Ferrox Labs-maintained fork of aionrs"
- duplicated at `notices/THIRD-PARTY-NOTICES.md:22,24`

**The project LICENSE is GNU AGPL-3.0.** That makes this a compliance artifact, not an oversight:

- **AGPL §4** — you must "keep intact all notices stating that this License … applies to the code" and all
  warranty-disclaimer notices.
- **AGPL §5(a)** — a modified work must "carry prominent notices stating that you modified it".

Removing that line is the one edit in this whole exercise that creates real legal exposure, on a signed,
notarized, publicly distributed app. AGPL is also among the most aggressively enforced licenses.

**Verdict: MUST STAY.** If anything, it may need to be made _more_ complete (see §4).

Every other `fork` / `forked from` hit is noise: a DeFi skill in the shipped skills-library
(`emerging-tech/defi-navigator/SKILL.md`), a launcher prompt using "fork" as a verb about clip specs, and
matches inside `.skill-pack/skills-library/skill-bodies.bin` (a packed product artifact).

---

## 3. The REAL work: ~89 files of `ported from` / `adapted from` / `inspired by`

This is the actual cleanup surface, and it is the only bucket that needs judgment. **89 files** under `src/`
once shipped product content (`skills-library`, `builtin-catalog`, `builtin-extensions`) is excluded.

Named upstreams observed so far: **Cherry Studio, Foundry, Flow, opencode**. Samples:

```
src/renderer/utils/model/modelCapabilities.ts:66      "three-layer resolution inspired by Cherry Studio"
src/renderer/components/chat/StatusFooter.module.css:1 "Ported from Foundry ThinkingFooter.module.css"
src/renderer/components/onboarding/Onboarding.module.css:10 "Ported from the approved walkable…"
src/renderer/pages/settings/VoiceSettings/MicrophoneCheck.tsx:6 "Ported from Flow's MicCheckSettings.svelte pattern"
src/renderer/pages/conversation/Messages/components/MessageActivity.module.css:1 "Adapted from Foundry ForgeRenderers.module.css"
src/process/connectors/opencode.ts:10                 "…are ported from the…"
```

### The triage rule — this is the whole method

The same sentence means two different things, and getting it wrong is the failure mode:

- **The file actually contains their code** (copied, then modified). The line IS a license notice.
  **It must stay**, and the upstream probably needs adding to `THIRD-PARTY-NOTICES.md` if absent. Removing it
  converts a compliance artifact into an infringement.
- **We only studied their approach and wrote our own.** Then it is an unnecessary tell with no legal weight.
  **Safe to delete or reword** to describe the technique rather than the source (e.g. "three-layer capability
  resolution" instead of "inspired by Cherry Studio").

**Every one of the 89 needs the file read, not the comment.** Judge by whether the code is theirs, never by
how the comment is phrased. When it cannot be determined, LEAVE IT and list it — a wrong deletion here is
unrecoverable in a way a wrong retention is not.

---

## 4. Compliance defect found while scoping

**There are TWO third-party notices files and they DIVERGE:**

- `THIRD-PARTY-NOTICES.md` — 50 lines
- `notices/THIRD-PARTY-NOTICES.md` — 80 lines

At least one is incomplete or stale, and it is unknown which one the packaged app ships. Under AGPL this is a
live compliance gap independent of Sean's request, and arguably more urgent than the cleanup. **Determine
which is authoritative, which gets packaged (check `electron-builder.yml` / `extraResources` /
`prepackage`), reconcile them, and keep exactly one source of truth.**

---

## 5. Do NOT grep for `"based on"`

**1869 files.** It is ordinary English ("based on the user's selection", "based on the current model").
Grepping it will bury the real findings. Use the specific phrases in §3 only.

Other counts for sizing: `upstream` 262 files (mostly git/CI vocabulary, not attribution), `ported from` 40,
`adapted from` 65, `inspired by` 31, `borrowed from` 12, `taken from` 13.

---

## 6. Recommended plan for the fresh session

1. **Resolve §4 first.** The duplicate notices files are a real compliance gap and cheap to fix. Establish
   which file ships before touching any comment.
2. **Build the 89-file inventory** with, per row: file, the phrase, the named upstream, and a verdict of
   `their-code` (keep, and check it is in NOTICES) / `our-code` (safe to remove or reword) / `unclear`
   (leave, list it).
3. **Only then edit**, and only the `our-code` rows. Prefer rewording to deletion where the comment explains
   a non-obvious technique — the goal is removing the provenance tell, not destroying the explanation.
4. **Cross-audit the diff** before it lands. This class of change is easy to get quietly wrong, and the
   consequence is legal rather than a failing test.
5. Anything in `out/`, `.skill-pack/*.bin`, `skills-library`, `builtin-catalog` or `builtin-extensions` is
   build output or shipped product content — not our source comments. Exclude it.

## 7. What this brief deliberately does not do

No files were changed and no inventory was built. The scoping session stopped here on purpose so the
90-odd judgment calls get a full context window rather than the tail of one.
