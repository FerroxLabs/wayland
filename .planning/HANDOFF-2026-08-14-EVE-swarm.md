# Handoff — 2026-08-14 evening, swarm session

**Start here.** `packet/wl-integration` @ `50d9adb27`. **9 commits on top of `c54393e3a`.**
Nothing pushed (no upstream set), nothing tagged.

**[V]** = established by executing it. Everything else says plainly what it is.

Supersedes `HANDOFF-2026-08-14-PM-ship-state.md`. Its §3 list is now mostly closed;
what remains is below with the guesswork taken out.

---

## 1. THE DECISION WAITING ON YOU — an auth status code

`TokenMiddleware.ts:71` returns **403** for missing / invalid / expired credentials.
Four auth e2e specs assert **401**, which is what RFC 9110 §15.5.2 says (403 means
re-authenticating will not help). Proven live, with both 403 flavours separated by a
control [V]:

```
anonymous POST /logout   403 {"error":"Access denied. Please login first."}   <- TokenMiddleware
garbage _csrf token      403 {"error":"Invalid or missing CSRF token"}        <- tiny-csrf (control)
```

**Recommendation: change it to 401, and fix `StorageService.ts:96-97` in the same
commit.** The red-team spec already pre-authorises it (`redteam-jwt.e2e.ts:84-87`
accepts `[401, 403]` and calls 401 "valid for a future migration"), no unit test
asserts the 403, and the only status-coupled consumers either treat both identically
or are login-only. **But it is a behaviour change on the auth surface, so it is your
call, not mine** — I did not make it.

The collateral is real and must ride along: `StorageService.ts` maps 403 →
`RESTORE_NOT_OPERATOR` and 401 → `RESTORE_BAD_PASSWORD`, so an unauthenticated
restore is mislabelled either way, and flipping the middleware alone just swaps one
wrong label for another.

**Second, smaller call:** the settings id `tools` is ambiguous _in the product_ —
`SettingsSider` LEGACY_ANCHOR_REMAP says `mcp-library`, `Router.tsx:183` says
`capabilities?tab=tools`. I took `mcp-library` (the live IA) for the smoke sweeps.
Someone should pick, because the product currently contradicts itself.

---

## 2. Wayland Nano — the RC cannot launch through Desktop

Written up in full for the Nano side: `.planning/HANDOFF-TO-NANO-2026-08-14-npm-rc-blockers.md`.

**`waylandnano@0.1.0-rc.0` ships its binary as `-rw-r--r--`** [V] and depends on a
`postinstall` chmod. Desktop routes every `npx` launcher through bundled bun, and
**bun does not run postinstall scripts** — `bun x` has no flag to opt in [V]. So:

```
wayland-nano [WAYLAND_NANO_SPAWN_FAILED]: EACCES: permission denied, posix_spawn
```

Control: plain `npx -y waylandnano@0.1.0-rc.0 --version` → `wayland-nano 0.1.0`,
exit 0 [V]. The package is fine under npm and npm-only by accident. Their fix is one
line: ship the binary 0755 inside the tarball, so no lifecycle script is needed.
Also still outstanding: npm's `latest` tag points at the older alpha.

**Nano itself is healthy.** Driving `wayland-nano 0.1.0` over stdio on a real Flux
turn [V]: initialize → session/new → prompt → `agent_message_chunk` →
`stopReason: end_turn`, and the budget migration is live —
`_wayland/session/budget {"priced":false,"session_tokens":4143,...}` with **zero**
remaining `sessionUpdate:'budget'` frames.

---

## 3. What landed — 9 commits

**`29099ca48`** — builtin agents now launch from their npm pin when PATH cannot.
`defaultCliPath` was read for extension and custom-agent rows only, so the Nano pin
declared a distribution nothing launched from. A user's own binary still wins; npm is
reached only in the case that was otherwise a guaranteed ENOENT. Only `wnano` and
`qwen` reach this path — claude/codex/codebuddy take dedicated npx connectors.

**`0267ca86b`** — pins that the REAL ACP SDK dispatches `_wayland/*` to
`extNotification`. Every other budget test calls our parser directly and would pass
even if the SDK dropped the frame — which is exactly how the original
`sessionUpdate:'budget'` route died. Two controls carry it: an unknown session/update
kind must still be refused, a well-formed one must still arrive.

**`5cb7b1a0d`** — OpenClaw stops claiming a fact about a config it never read. Four
states collapsed into one message telling users their config "has no gateway.mode"
even when the file was unreadable. Zero i18n cost (main-process strings).

**`7f9a8d07b`** — Remove now finishes when a connector config is unparseable. The
throw skipped `deleteReceipt`, so status stayed `drifted` forever and the modal's
only two actions both parse — both dead ends, no way to un-configure Flux at all.
Also: a throwing remove never settled the renderer promise, so the button span
forever with no error. All four handlers now resolve with `action: 'failed'`.

**`f98b36979`** — two e2e helper bugs that failed 30 specs before they ran.
`deleteConversation` waited for the batch-delete button status while performing a
single delete (15 specs, all in _cleanup_, after their real assertions passed).
`fetchCsrfTicket` matched the CSRF **body field** name against the Set-Cookie header
(15 specs, threw before issuing any request).

**`4a9c8531a`** — auto-read no longer speaks agent control markup. Voice consumes the
LIVE stream, so both existing strips run too late; asking for a schedule had the
synthesiser read the cron expression out field by field. `<think>` was worse than
untouched — the emphasis rule deleted `>` but not `<`, leaving pronounceable rubble.

**`b4f41c257`** — last stale settings-tab ids retired; zero remain, checked
programmatically against `SETTINGS_ROUTE_PATHS` with the checker validated on a
known-positive first.

**`791f63d5e`** — HIGH: drain the write queue before rewriting a stripped turn.
`persistStrippedTurnText` read the row directly while deltas sat behind a 2000 ms
debounce. On every cron branch the row was still queued, so the strip silently
no-opped and the queue then wrote the RAW text — markup left on screen and in the
database permanently. The other direction duplicated the tail and resurrected the
closing marker.

**`50d9adb27`** — team e2e specs use the ids the app actually renders.

---

## 4. e2e — 137 failures now fully classified, not guessed

Log: `/private/tmp/sv-e2e-final.log`. All 137 reconcile [V].

- **~95 were stale test code.** This session fixed the two helper bugs (30), the
  settings ids (15), and the team ids (13).
- **Auth measured after the fix: 16 failures → 5** [V], and 4 of those 5 are the
  single 401/403 decision in §1. The fifth is `auth-login.e2e.ts:125`, a rate-limiter
  artifact — it is the 6th negative login in a file against `max: 5 / 15 min`.
  A per-test `X-Forwarded-For` re-keys the limiter (`trust proxy` is on).
- **~14 are genuine product-defect candidates, untouched**, headed by: the team-import
  capability CTAs rendering `disabled` even where the spec says no cool-off applies; a
  cron task deleted from its detail page surviving in `#/scheduled`; an a11y
  `button-name` regression on chat home; `webui.start` returning port 0.
- **~10 need real backends** and will stay red on a machine without them.
- Two files need a rewrite, not a rename: `teams-library-load` (asserts
  `teams-action-bar`, which exists nowhere in src, and counts 24/5/19 against a live
  60/7/53 with a 48-item page window) and `quiet-money-smoke` (missing the
  `usr.launchAssistant` history seed; its `ext-` ids are fine — `stripIdPrefix`
  strips both prefixes [V]).

**Systemic cause, worth one fix rather than forty:** `tsconfig.json` `include` is
`src/**`, so the whole `tests/` tree is never typechecked, and CI runs exactly one
e2e spec (`pr-checks.yml:845`). Typechecking `tests/**` reports **2069** errors, but
~1500 are mock-shape drift in `tests/unit`; the `tests/e2e` slice is small and real
(7 × TS2459 bad `Page` import, an `isOpaque` assertion against an Electron API that
does not exist, 5 × `.msg` read off types that lack it).

---

## 5. Still open

1. **The 401/403 decision** (§1) — 4 e2e failures ride on it.
2. **Ollama capability filtering.** Fully scoped [V]: `capabilities` is already on
   `/api/tags` (no second request needed) — real response on this machine:
   `"capabilities":["completion","tools"]`. Desktop reads only `.name`, at
   `detect.ts:115-124` and `modelRegistryIpc.ts:1925-1944`. The model picker's tool
   gate is a NAME REGEX (`/gpt-4|claude-3|gemini|qwen|deepseek/i`) that is right about
   `qwen2.5` by luck. Fix as a tri-state `toolCall?: boolean` on `CatalogModel`, filter
   only on `=== false`. **Do not implement it as `!tags.includes('tools')`** — `tags`
   has no negative vocabulary, so that wipes the whole Ollama list on any daemon that
   omits the field. Fail CLOSED on evidence, OPEN on ignorance.
3. **`model_auth` is auto-retried.** The Nano table marks it `retryable: false`, but it
   arrives as `-32603` → `retryable: true` at `errorNormalize.ts:37`, so
   `PromptExecutor.ts:342` retries hard auth failures unless a substring heuristic
   happens to match. Cheap, real, independent of everything else.
4. **The ~14 product-defect candidates** in §4.
5. **Nano error-table i18n — the answer is DO NOTHING.** Scoped [V]: the parity gate
   only compares the 12 renderer locale bundles, and the table is a generated const in
   `src/common/types/`, so `localeKeyParity` **cannot fire on it**. Repo precedent for
   English-only catalog data is enormous (2,106 skill names, 108 MCP guides, all raw
   English). More importantly the table has **zero consumers**, 48 of its 59 kinds
   collapse to the same `-32603` wire code, and nothing verifies Nano even emits a
   `kind` field. Confirm that first; the language question is a non-question.

---

## 6. ⚠️ METHOD — what the swarm re-proved today

Investigators corrected me **three** times, each time by observing instead of reading:

- I was about to mass-rename 18 team ids on inference. There was no
  `team-card-builtin-*` string anywhere in the repo to serve as a known positive, so
  the rename was a guess. Driving the real app produced the ids — **and showed two of
  the files did not have an id problem at all.**
- I reported the CSRF fix as incomplete because 403s remained. The fix was complete;
  the 403 came from a different middleware. Two controls separated the flavours.
- A tsc-over-tests measurement fabricated 97 phantom `src` errors purely from
  `typeRoots` discovery until `node_modules` was symlinked — caught only because the
  original run was re-verified against a known-zero baseline.

Carried and still true: **drive the tab, never `location.hash`** — the conversation
view is tabbed. **Inbound `session/update` frames are not logged**, so their absence
proves nothing; the DB is the honest instrument. **Long runs use `nohup … &`**, not
the tracked-background wrapper, which SIGTERMs them. **`rtk` mangles output** — it
swallowed the mode column from `ls -l` today, which is exactly the column that
mattered; use `rtk proxy git …` and `/usr/bin/stat`.

**Every fix in this session was mutation-verified**: the change was reverted, the new
test confirmed RED, the change restored, GREEN re-confirmed.

---

## 7. Standing constraints (unchanged)

No merge, tag, release or PR without Sean — `build-and-release.yml` fires on **any**
tag. Never touch `~/dev/wayland/app`. gh writes must be **FerroxLabs**. No AI
signatures in commits or PRs. No backticks in gh/wl comment bodies. **Never commit
`constitutionFsAuthority.generated.ts`** — and never `git add -A src` / `git add -u src`.
Never weaken the security shell. **Never relax, skip or delete an existing test to make
something pass.** Never run against Sean's real profile — `WAYLAND_DEV_PROFILE` is
IGNORED when packaged and a `HOME` override does not isolate Electron on macOS. Never
run multiple agents in one worktree **for writes** (this session ran read-only
investigators in parallel and did every edit serially, by hand).

**Uncommitted by design:** `AGENTS.md` (hook-modified) and
`constitutionFsAuthority.generated.ts`.
