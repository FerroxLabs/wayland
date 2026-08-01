# F-04 + F-05 — issue hygiene, and the external cleanup plan reconciled

Produced 2026-07-25 against branch `worktree-agent-desktop-integration`.

---

## F-04 · Issue and decision hygiene — DONE

### Nothing is marked fixed while unreleased

The risk worth checking was not label spelling, it was an issue closed as fixed when the fix exists
only on this unmerged branch. Checked directly: 22 issue numbers are referenced by commits that are on
this branch and not on `main`. Three of those are CLOSED:

| issue                               | closed     | fix commit on `main` | verdict          |
| ----------------------------------- | ---------- | -------------------- | ---------------- |
| #484 agent failed to start          | 2026-07-03 | `f9e334b8b`          | correctly closed |
| #706 IJFW Memory runtime Degraded   | 2026-07-12 | `9924b4e5b`          | correctly closed |
| #746 agent hangs on read-only trace | 2026-07-11 | `e41615065`          | correctly closed |

Each has a real fix commit on `main`, so each shipped. The branch-only commits merely mention them in
passing (a test, a related Wave-0 lock, a planning note) — #706 in particular is referenced because
F-07 explicitly **ruled it out** as the cause of the Memory dead end, not because it was refixed.

`state:fixed-pending-release` exists with the right description ("Fixed in code, closes when next build
ships") and #537 correctly carries it while still OPEN. Closed issues also carrying it are the expected
end state — the label goes on at fix time and the auto-close sweep closes them once a build ships.

### #910b "Chats" ratification — recorded

`8f713ea04` "fix(D-06): #910b rename the aggregation label to Chats" is on this branch only and was
marked _GATED: pending Sean's ratify at live-verify_. **Ratified — keep the commit.** It renames the
two English-only aggregation defaults (sider nav entry, Conversations page H1) from "Conversations" to
"Chats"; the `/conversations` route and unrelated Conversation strings are untouched, and it is
independently revertible.

#910 itself stays OPEN: the report is broader than the label rename. The reporter pinned a chat,
expected it under Recents, and eventually found it in Conversations labelled "Starred" — a
pin/star/Recents vocabulary and placement problem. `8f713ea04` addresses only the aggregation label.
No code change for F-04.

---

## F-05 · `~/Downloads/wayland-desktop-cleanup-plan.md` reconciled

**Read this before starting any packet from that plan.** The audit was taken at commit `1b1c1e9`,
which is exactly this branch's merge-base, so it describes shipped v0.11.18 and not this branch.

**Two of its own reference points are already stale:**

- Its global acceptance bar is "`bun run test` (968 unit) + `bun run test:e2e` (129)". This branch runs
  **15,907 unit tests**. Any packet quoting 968 as done-ness is quoting a number that no longer exists.
- P1-2 cites `wcoreUpdater.ts`. There is no such file; the updater lives in
  `src/process/services/autoUpdaterService.ts` and the engine pinning in
  `scripts/prepareWaylandCore.js`. The plan's own guardrail 3 anticipated this ("symbol references, not
  line numbers") — it applies to the plan itself.

### Status per packet

| packet                                                | status                                        | evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0-1** pin ACP bridges                              | **STILL OPEN**                                | no `resources/acp-bridges.json`; `acpConnectors.ts:248` still branches on a `npx `-prefixed CLI path                                                                                                                                                                                                                                                                                                                                                             |
| **P0-2** stale "not signed / not notarized" readme    | **STILL OPEN — and the text is false**        | `readme.md:89` "not notarized by Apple yet"; `readme.md:96` "not code-signed yet … land once the certificate is in place". Both untrue: `electron-builder.yml:307` `afterSign: scripts/afterSign.js`, `:310` `afterAllArtifactBuild: scripts/notarizeDmg.js`, and `azureSignOptions.publisherName: 'Ferrox Labs, LLC'` with a release-tag guard that fails the build when `AZURE_CLIENT_SECRET` is empty                                                         |
| **P0-3** license misstatement about Core              | **STILL OPEN — confirmed a real error**       | `readme.md:322` claims AGPL-3.0 "app and engine both"; `readme.md` contains no mention of Apache at all. Core's own `LICENSE` is **Apache License 2.0** (read from the file, not taken from the plan)                                                                                                                                                                                                                                                            |
| **P0-4** ship SHA256SUMS                              | **PARTLY SUPERSEDED, literal ask still open** | no `SHA256SUMS` step in `build-and-release.yml`, so the website claim is still unbacked. But the plan's _optional_ stronger control already exists: `actions/attest-build-provenance` runs in `release-acceptance-trust-root.yml` (v3, two places) and `protected-platform-package-observer.yml` (v2). Do the checksum step for the website claim; do not re-add provenance as though it were missing                                                            |
| **P1-1** sandbox the extension hook `eval('require')` | **STILL OPEN**                                | `lifecycleRunner.ts:89` `const nativeRequire = eval('require')`, with the full-privilege residual risk documented at `:15-28`                                                                                                                                                                                                                                                                                                                                    |
| **P1-2** engine updater trust model                   | **PARTLY ADDRESSED**                          | build-time pinning exists: `prepareWaylandCore.js` verifies against the checked-in `bundled-wcore-shasums.json` and refuses to build without per-platform checksums "from the signed release" (`:157`), and `:560` notes the publisher attestation covers the release archive. The runtime update path still wants review, at the real filename                                                                                                                  |
| **P1-3** Linux deb/rpm notify-only                    | **STILL OPEN**                                | `autoUpdaterService.ts:460` still carries `TODO(v0.1.3): verify GPG-signed .deb.sig artifact before applying`                                                                                                                                                                                                                                                                                                                                                    |
| **P1-4** Windows per-user install                     | **SUPERSEDED — DO NOT DO AS WRITTEN**         | the plan proposes moving NSIS to per-user (`perMachine: false`). `electron-builder.yml:216-222` deliberately installs **per-machine** under UPD-04, so the bundled engine binary cannot be swapped by an unprivileged process between launches (tamper-then-spawn), with the UAC tradeoff recorded. Following P1-4 would reverse a deliberate security decision. The verification half (does an old→new update actually succeed under UAC?) is still worth doing |
| **P2-1** TypeScript strict mode                       | **STILL OPEN**                                | `tsconfig.json` has `noImplicitAny: true` only; no `strict: true`                                                                                                                                                                                                                                                                                                                                                                                                |
| **P2-2** dependency diet                              | **STILL OPEN, moved the wrong way**           | plan counted 136 prod deps; `package.json` now declares **144** (plus 52 dev)                                                                                                                                                                                                                                                                                                                                                                                    |
| **P2-3** dead code + TODO burn-down                   | **NOT ASSESSED**                              | needs a pass of its own; not blocking F                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **P2-4** issue triage sweep                           | **STILL OPEN, moved the wrong way**           | plan counted 132 open; **134** open now                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **P2-5** Homebrew tap consolidation                   | **STILL OPEN**                                | both `FerroxLabs/homebrew-tap` and `FerroxLabs/homebrew-wayland` still exist                                                                                                                                                                                                                                                                                                                                                                                     |
| **P3** site + docs sync                               | **OUT OF SCOPE HERE**                         | belongs to whoever owns getwayland.com; blocked on P0-2/P0-3/P0-4 landing first                                                                                                                                                                                                                                                                                                                                                                                  |

### Recommended order, and why it differs from the plan's

1. **P0-2 and P0-3 first.** They are pure documentation truth fixes, they are the cheapest work in the
   whole plan, and both currently tell users something false about trust and licensing. P0-3 is the more
   serious of the two because an embedder reading "engine is AGPL" makes a legal decision on it.
   **Land P0-2 quietly** — no release-note line about Windows code signing.
2. **P0-1 next.** It is the same supply-chain class this branch already fixed once for the WhatsApp
   bridge (unpinned dependency resolved at spawn time), so the pattern and the reviewer context exist
   right now.
3. **P0-4** to make the website claim true, reusing the provenance wiring that already exists.
4. **P1-1** is the largest genuinely-open security item and wants its own milestone, not a packet.
5. **P1-4** must be re-scoped to "verify the UAC update path", never "move to per-user".

None of this is Milestone F work. F closes on CI truth; these are the next milestone's input.
