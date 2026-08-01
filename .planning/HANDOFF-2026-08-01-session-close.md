# Handoff — session close, 2026-08-01

Branch `packet/attribution-audit` · worktree `~/dev/wayland-worktrees/packet-attribution` · base
`15d6740aa` (stacked on PR #925).

**66 commits. NOTHING PUSHED. Nothing tagged. Nothing merged.** Tree clean except `AGENTS.md`, which
IJFW rewrites and which has stayed uncommitted deliberately across this whole arc. Zero commits touch
`constitutionFsAuthority.generated.ts` — verified.

---

## Start here

1. **PR #925 lands before any of this merges.** Hard gate, unchanged.
2. **The one live-verification owed:** #907 needs a real OpenClaw 2026.7 gateway. Everything else
   that could be verified, was.
3. **Two decisions are waiting on Sean** — #838's park-or-advance question, and a read of the three
   rewritten skill bodies. Both detailed below.

---

## What this session did

### WLD-I licence compliance — closed

812 files carry the joint notice. Evidence-led, never blanket: 742 AUTO + 70 REVIEW restored, 553
owed nothing (upstream had no notice), 17 de minimis, 13 already Google LLC. The rebrand had
*substituted* upstream's line rather than supplementing it, which is the §1202 fact pattern.

**Method lesson worth keeping: percentage is the wrong instrument.** `fileTypes.ts` scored 20% off
*one* shared line; identifier overlap is noise below ~55% because a Ferrox-**original** shares ~45%
with an *unrelated* upstream file. The measure that works is **shared expression lines** (substantive
minus imports, re-exports, bare type openers), cut at 5.

I-01 determined without counsel — `I-01-DETERMINATION.md`. **acpx is MIT, not GPL** (my premise was
wrong; correcting it closed the question). **AGPL §5/§13 do not bind Ferrox** — they bind a licensee
who conveys, and Ferrox is the original licensor. Both panel legs got that wrong and were overruled.

The one thing no analysis clears: the historical non-compliance window between the rebrand and the
cure. Apache-2.0 has no reinstatement clause. Only AionUi can waive it.

### Defects found by live testing, not by the tracker

Nothing in the 142 open issues covered any of these. All were found by driving clean profiles.

| commit | defect |
|---|---|
| `fd28d33d7` | marker spoof was a **NO-OP on 11 of 24 channels** incl. Matrix — denylist → allowlist |
| `9b39e0e16` | ACP live attachments restored, gated so a model reply cannot smuggle a `files` field |
| `fe732f350` | Flux "Connecting…" hang — bounded; affected **every** provider on desktop |
| `1f06b48fb` | a healthy 4-provider install was told its agents were asleep |
| `ff202c275` | a safety classifier was still the first-run default model |
| `f17b90c6b` | Recent Chats badge counted chats the list excludes |

**`1f06b48fb` is the one worth understanding.** Every WCore conversation rendered "Wake your agents /
connect a model provider" with four providers connected and 170 models enabled, pushing the
transcript off-screen. `projectModelRegistryReadiness` sequenced provider evidence by providerId
while stamping each row's real `observedAt`; those orders agree only if providers connect
alphabetically. Auto-discovery wired `groq` 413ms before `google-gemini`, the reducer read that as
time running backwards, raised `conflicting_claims`, and invalidated the **whole** projection —
`providers: []`, which surfaces as `registry-error`. Fixed by ordering on `observedAt` with identity
as tiebreak. The capability mapping digest correctly caught the behaviour change, so the ordering
constant, contract version and pinned digest moved with it.

**`ff202c275`** — the earlier Curator fix was a no-op: `isNonChatClassifier` keys on sub-1K context
with no tools, and `gpt-oss-safeguard-20b` declares 131072 and tools. The Curator *did* mark it
`recommended: false`, but `selectMirrorModelIds` returned Curator order and nothing read the flag.
Stable recommended-first partition. Live-verified: default is now `openai/gpt-oss-120b`.

### Live-verified working

**Scheduling by chat on Wayland Core, end to end.** "remind me to check the build every day at 9am"
→ `[CRON_PROPOSE]` card → "Yes, schedule" → a live Active task in Scheduled Tasks (`0 9 * * *`, next
run 8/1). The "set this up by chat" packet needs **no further build**. About screen carries the AGPL
notices and "Contact Us".

### Overnight batch

- `ce43ed0f7` — coverage job stops requesting an OIDC token it can never be given.
- `fc516fd8d` — **#907** OpenClaw: protocol window widened to [3,4]; auth reader honours an omitted
  `mode`; `SecretInput` narrowed so a SecretRef reads as absent instead of shipping an object.
- `faeb03636` — storage page said "Conversations" after D-06 renamed everything else to Chats.
- `61e75bc38` + `bb1635738` — **#609** the three thin Ignition skill bodies.
- `e0b2b7012` — **#838** design and deferral.

### #609 — the answer was better than the plan

I was going to have Sean dictate. Then I found **he had already written it**: The Donahoe Method
ships in the product as `business-conversion` — 32 skills, 11 named frameworks, lineage through
Schwartz, Halbert, Caples, Ogilvy, Sugarman, Hormozi, Cialdini. The pinned `copywriter` slot had
never referenced it. So the fix was connecting the slot to Sean's own system and routing heavy assets
to the 16 `convert-*` skills (all verified to exist).

**The highest-leverage line was the frontmatter `description`** — only name and description stay
resident in the prompt, bodies load on demand, so `"use when the user asks about copywriter"` was the
circular text the model used to decide relevance at all.

**`startup-advisor` was a different problem: aim, not thinness.** Its frameworks are real but
calibrated to a venture-backed path. Ignition serves someone building an income asset this week with
their own money, where funding-shaped advice actively harms them. Re-aimed at shortest-path-to-first-
revenue with kill criteria written down before the build; venture sections kept, now explicitly
scoped.

Guard test: 25 assertions over all six pinned skills — no generator fingerprints, non-empty
When-to-Use, explicit "Do NOT use" routing, non-circular description. Verified by reverting two
bodies (3 fail, 22 pass).

### #656 — closed

Closed on GitHub with evidence. #628 (the on-broadcast "node isn't installed" incident) was fixed in
`4faa14596` and has shipped since **v0.11.14**, so the closure does not rest on unreleased work.
#618 is core, not desktop.

---

## Open, and who owns it

**Sean's calls:**
1. **#838** — should a failed / aborted / disconnected turn park or advance an AUTO workflow? And is
   a new OS notification stream on four backends acceptable? (The issue asks for it, but it is new
   user-visible behaviour.)
2. **Read the three rewritten skill bodies** — a test cannot judge whether the content is right.
   Particularly whether the copywriter Method summary matches how Sean would teach it, and whether
   re-aiming startup-advisor at income-assets is the right call.
3. **#931** — a customer billed $60.74 who cannot find a Billing section in Wayland. Money-touching,
   unanswered, was 1 day old at triage.
4. **#910 naming half** was already done by D-06; whether a *scheduled* chat belongs in Recents is
   still an open product question.

**Blocked on the new Core:**
5. **#907 live-verify** — connect from Wayland to a real OpenClaw 2026.7 gateway and confirm a
   session rather than a protocol error. Static evidence only so far.

**Unclaimed:**
6. **#909** — reviewer returned BUILD-WITH-CHANGES and refuted the plan's scoping. Not attempted.
7. **~24 desktop issues carry no `area:` label**, so nothing surfaces them as desktop. That is the
   real reason things go unaddressed.
8. Whether a tokenless Codecov upload is accepted — unknown. The failing run died inside the OIDC
   step before Codecov was contacted. The next CI run answers it.
9. Library duplicates of the three skills (`skills-library/bodies/skills/…`) are still the old
   filler. Ignition loads the pinned copies, so Ignition is fixed, but skills-search still surfaces
   the thin versions.
10. Historical non-compliance window — only AionUi can waive.

---

## ⚠️ Traps and method rules — do not relearn these

**METHOD RULE, cost a wrong report:** cross-check **`ferrox/main..15d6740aa`** (the stacked PR-925
base), not just `ferrox/main`. I told Sean seven packets were open; **four were already built** —
D-06 covers #909/#910/#508/#882 and `730230eaf` fixed #842. Stacked work is invisible to a main-only
search. The base touches 14 open issues: #457 #508 #537 #723 #836 #842 #853 #882 #885 #890 #891 #896
#909 #910.

- **NEVER commit `constitutionFsAuthority.generated.ts`** — regenerated with a LOCAL trust-root
  sha256 by any `bun run package`. Caught 5× this session.
- **A sealed package cannot be built locally, by design** (`WAYLAND_CAPABILITY_RECEIPTS_DIR`).
  Manufacturing receipts is forging attestations. `bun run package` (the vite half) is fine.
- **`rtk` summarises `npx tsc`** — use `rtk proxy npx tsc` for raw errors and negative controls.
- **Mocking `node:fs` by named exports only is not enough** when a module does `import fs from
  'node:fs'`. The first run of the OpenClaw auth test read the REAL `~/.openclaw` config and asserted
  against a live token. Mock `default` too.
- **Do not mock `ws`** to test the OpenClaw handshake — the code compares the static `OPEN` on the
  default import, and a half-right mock fails on fixed AND unfixed code, proving nothing.
- **`git checkout` will not restore an UNTRACKED file** after a negative control. Restore by hand.
- **Suite failures under contention are not regressions.** 8 failed together; all 8 passed alone.
  Clean run: **14,911 passing**.
- **Skill-body house style is `--`, never an em-dash.** All three strong siblings follow it.
- **ALWAYS run a negative control.** Every fix this session was only meaningful because its test
  failed with the fix reverted. Two of them caught errors in my own first attempt.
- **Live-test recipe:** `bun run package` THEN `node scripts/build-mcp-servers.js` (vite wipes
  `out/main`), then `WAYLAND_MULTI_INSTANCE=1 WAYLAND_DEV_PROFILE=<n> ./node_modules/.bin/electron
  out/main/index.js`. The app picks its OWN CDP port (9230/9231) — read it from the log. Config store
  decodes as `json.loads(urllib.parse.unquote(base64.b64decode(...)))` from
  `<profile>/config/wayland-config.txt`; provider registry is sqlite at `<profile>/wayland/wayland.db`.

---

## Corrections I made to my own earlier claims

Recorded because each was reported to Sean before being checked.

- The red Coverage check was **never a merge gate** — branch protection requires only Code Quality
  and the three Unit Tests jobs. PR #925 reads MERGEABLE.
- `pr-checks.yml` **does** declare a top-level `permissions:` block (`:60-64`).
- Adding `id-token: write` would have been a **security regression** — that job runs PR-authored
  code, and `trustRootJobSeparation.test.ts` already pins the invariant. A job-level `permissions:`
  block REPLACES the workflow block rather than merging.
- **#885 is fixed** (`isTrustedBundleSkill`); my first grep looked at `TRUSTED_SOURCES`, a different
  mechanism.
- **#882 is fixed** in `ConversationTabs.tsx`; I had grepped `WorkspaceTabBar.tsx`, a different
  component.

---

## Constraints that never relax

No merge, tag or release without Sean — `build-and-release.yml` fires on **any** tag. Never touch
`~/dev/wayland/app`. gh writes must be **FerroxLabs** (drifts to TradeCanyon). No backticks in gh/wl
comment bodies. **No AI signatures in commits or PRs.** Never weaken the security shell (`sandbox`,
`contextIsolation`, `nodeIntegration`, CSP, `bridgeAllowlist.ts`, `urlValidation.ts`, DOMPurify,
`safeStorage`). Never touch the signing pipeline. No history rewriting. The `aionrs` SQL literals in
`migrations.ts` must never change. `FoundrySkills`/`foundry-skills` must not be renamed.
`~/dev/waylandcore/actions-runner/` is a LIVE self-hosted runner — never delete anything under
`_work`. Never mark a GH issue fixed if it is not in a released version.
