# Desktop residue — what the tracker still owes us, 2026-07-31

The question this answers: of the open issues on `FerroxLabs/wayland`, which are **desktop-only**,
**not already fixed** by anything on `main` / in the PR #925 base / in this branch's 57 commits, and
**actionable now** — not gated on a release or on wayland-core.

Method: every claim below was checked against the code or against `git log`, not inferred from the
issue text. Inbox read was read-only; nothing was labelled, commented or closed.

## Already covered — close these once published

| issue                                        | evidence                                                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| #885 Skill Guard quarantines built-ins       | `isTrustedBundleSkill` + `trustedBundleReport()` in `SkillLibrary.ts`, carrying an explicit `#885` comment (`e8edc12c2`, in the #925 base) |
| #890 WhatsApp bridge never connects          | `e29ccb85a` in the #925 base                                                                                                               |
| #537 send_message unknown channel: email     | in the #925 base; already labelled `state:fixed-pending-release`                                                                           |
| #777 scroll-up latch residue                 | `20b8b5c94` on main                                                                                                                        |
| #836 success green fails light-mode contrast | `default-color-scheme.css:180-182` — light uses Emerald-700, dark keeps `#34d399`, comment cites `(#836)`                                  |
| #441 bump engine 0.12.15 → 0.12.16           | **obsolete** — bundled manifest reads `v0.12.25`                                                                                           |
| #304 desktop PR batch (3 PRs)                | **stale** — ours is the only open PR in the repo                                                                                           |

Nothing in the tracker covers the five defects fixed in this branch. Searched all 142 open issues
for the classifier default, the connect hang, "Wake your agents", scheduling-by-chat and the licence
work: **zero matches**. Every one was a live-test find, so there is nothing to link or close.

## Building now

Each went to a research agent and then to an adversarial reviewer briefed to refute it.

**#838 — four of six agent managers never report a finished turn.** Established by count, not
argument: `notifyPotentialCompletion` appears twice in `AcpAgentManager`, once in `WCoreManager`,
and **zero** times in `GeminiAgentManager`, `NanoBotAgentManager`, `OpenClawAgentManager` and
`RemoteAgentManager`. Those four record cost via `recordTurnFinish` but never emit
`conversation.turn.completed`. Filed as a notifications gap; the code suggests it is wider, since
`parentTurnDriver`, `autonomousWatchdog` and `dispatchAutonomousStep` all advance workflow runs off
that same event. The research brief asks for that blast radius to be confirmed or refuted rather
than assumed, and for the dedupe path to be checked for double-advance risk.

**#842 — a workflow parked on `awaiting_input` notifies nobody.** Sibling of #838, split out of
#579 and never built. Brief flags the real question: whether notifying here is correct at all, or
whether it fires on every approval prompt and the original exclusion was a considered decision.

**#907 — two concrete OpenClaw defects, both verified.** `OPENCLAW_PROTOCOL_VERSION = 3 as const`
(`types.ts:18`) is sent as **both** `minProtocol` and `maxProtocol`, pinning us to exactly 3 while
OpenClaw 2026.7.1 wants 4. Separately `openclawConfig.ts:147` ignores `auth.token` unless
`auth.mode === 'token'`, but that discriminator is now optional upstream. The brief marks the
protocol bump as the risk: advertising 4 while speaking 3 would trade a clean failure for a subtle
one, so it must be settled from evidence, not assumed.

**#882 — project name on conversation tabs.** Genuinely unimplemented: the only `project` match in
`WorkspaceTabBar.tsx` is a licence-header word. Constraint given to the agent: tab titles already
truncate, so reuse an existing project-chip pattern rather than invent one, and leave project-less
tabs untouched.

**#909 — assistant selection hides the runtime.** Brief requires establishing whether the runtime is
genuinely unreachable or merely invisible before proposing anything, because that decides whether
this is a functional bug or a discoverability one.

**#910 (functional half only) — pinned chats missing from Recents.** Plus a live observation from
today: the sidebar rendered "RECENT CHATS 1" directly above "No chat history" on a clean profile.
Already ruled out as a predicate mismatch — the badge filter
(`SiderRecentChatsSection.tsx:42`) and the list filter (`useConversationListSync.ts:108`) are
byte-identical. May be one bug or two; the brief permits "cannot determine".

**CI — PR #925's red check.** Not a code failure: all twelve unit shards pass on macOS, Ubuntu and
Windows. The Coverage job throws `Unable to get ACTIONS_ID_TOKEN_REQUEST_URL` because there is no
`CODECOV_TOKEN` secret (13 on the repo, none Codecov), so `use_oidc` flips true while the job
declares no `id-token: write`. `fail_ci_if_error: false` misses it because the action throws
unhandled. This gates all 57 commits.

## Not building — these need Sean

**#910's naming half.** Renaming "Conversations" → "Chats" and "Pin" → "Star" across 12 locales is a
product and branding decision, not a bug fix. Explicitly fenced out of the packet brief.

**#609 — curate the three thin pinned-skill bodies.** Authoring expert content in Sean's voice.
No code risk, but not an agent's call.

**#656 — capabilities must not be silently gated.** A product principle raised after a live-broadcast
incident, not a packet. Needs scoping into concrete surfaces before anything can be built.

## Deliberately out of scope

Everything core-, engine- or Flux-side, per Sean: the shell/command-execution cluster (13 issues,
including community PR wayland-core#254), the Browser-tool config issues, Flux billing dashboards.

Release-gated and therefore not "now": the Windows packaging cluster (#492 auto-update EACCES, #783
MSIX epic, #914 AV blocking, #873 macOS sandbox) — all need a signed build to verify.

Not yet traced, so not claimed either way: #476, #247, #872, #897, #685.

## Standing constraints

No merge, tag or release without Sean — `build-and-release.yml` fires on **any** tag. Never touch
`~/dev/wayland/app`. gh writes must be FerroxLabs. No AI signatures in commits or PRs. Never weaken
the security shell. Never commit `constitutionFsAuthority.generated.ts`. Every fix ships with a test
that fails when the fix is reverted.
