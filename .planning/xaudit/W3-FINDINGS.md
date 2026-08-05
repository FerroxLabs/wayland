# W-3 cross-audit — findings

Packet: `.planning/xaudit/W3-PACKET.md`
Commits: `2353f2a72`, `1267b2496`
Date: 2026-08-05

## VERDICT: NO-GO

W-3 must not merge as committed. The connector it adds **cannot work on any
platform**, and no change to the Wayland side alone can fix it - the fix is an
upstream TVControl release.

---

## F-1 (BLOCKER, proven) - `npx @ferroxlabs/tvcontrol` does not start an MCP server

**File:** `src/renderer/mcp-catalog/entries/com.ferroxlabs-tvcontrol.json`, `packages[0]`

The entry declares `runtimeHint: "npx"` + `identifier: "@ferroxlabs/tvcontrol"`.
`entryToServerData.ts:118-124` turns that into `command: "npx", args: ["@ferroxlabs/tvcontrol"]`,
and `resolveMcpStdioSpawn` rewrites it to `bun x --bun @ferroxlabs/tvcontrol`.

But the published package's `bin` map is:

```json
"bin": { "tv": "src/cli/index.js", "tvcontrol": "src/cli/index.js" },
"main": "src/server.js"
```

npx/bun resolve the bin whose name matches the package - `tvcontrol` - which is
**`src/cli/index.js`, the human CLI**. The MCP server is `src/server.js`, and it is
reachable only via `main`, which npx never executes. `src/cli/index.js` is 35 lines,
imports 19 command modules and calls `run(process.argv)`; it contains **zero**
references to `mcp`, `McpServer` or `StdioServerTransport`.

**Proven empirically, twice**, against the live public registry:

```
$ printf '{"jsonrpc":"2.0","id":1,"method":"initialize",...}' | npx --yes @ferroxlabs/tvcontrol
Usage: tv <command> [options]
...
EXIT: 0

$ ... | resources/bundled-bun/darwin-arm64/bun x --bun @ferroxlabs/tvcontrol
Usage: tv <command> [options]
...
EXIT 0
```

The second command is the **exact spawn path Wayland's probe uses**
(`McpProtocol.ts:334` -> `mcpStdioSpawn.ts:40`). It answers an MCP `initialize` with
CLI usage text on stdout and exits 0.

**Failure scenario:** user opens the MCP Library, clicks Install on TVControl. The
package downloads fine. The probe spawns it, reads `Usage: tv <command>...` where it
expects JSON-RPC, and the handshake fails. The user gets a red "Server unreachable"
badge and a connector that can never work. Every platform, every agent backend.

Mitigating: this is a **visible** failure, not a false green. Nothing is corrupted and
no security boundary is touched.

**The server itself is fine.** Against the same extracted 2.2.1 tarball, with deps
installed:

```
$ ...initialize + notifications/initialized + tools/list... | node src/server.js
initialize  -> {"name":"tvcontrol","version":"2.2.1", ...}
tools/list  -> 101 tools | error: None
```

So the zod fix shipped in 2.2.1 is genuinely good and the MCP server is healthy. The
defect is **purely the entry point**: npx reaches `bin.tvcontrol` (the CLI), never `main`
(the server).

There is no argument that fixes it from the Wayland side. The full CLI command list
(`tv --help`, 40 commands) has **no `mcp` command**, so `runtimeArguments` cannot reach
the server either. `src/server.js` also has no shebang, so it cannot simply be added to
`bin` as-is.

**Fix (upstream, TVControl 2.2.2):** add an `mcp` subcommand to the CLI router that
boots the stdio server, then set `"runtimeArguments": ["mcp"]` on the catalog package.
This is backward compatible and matches how `entryToServerData` already builds args.
The alternative - adding a shebang to `src/server.js` and a third bin entry - works too
but cannot be selected by `npx <pkg>`, so it would still need the catalog to change.

**Why the tests did not catch it:** they assert `command === 'npx'` and that the args
mention the package name. That is the wiring, not the behaviour. They would pass
unchanged against a package that does not exist at all.

**Why the packet did not catch it:** the packet asserted the mechanism as a verified
fact ("fact 2/3") without ever executing it. Three of the four audit legs were given
that assertion as ground truth and could not have found this. Found only by pulling
the published tarball and speaking MCP to it.

---

## F-1b (HIGH, from Codex) - `version: "latest"` voids the verification claim

**File:** `com.ferroxlabs-tvcontrol.json`, `packages[0].version`

**I originally cleared this, and Gemini concurred. Codex overturned both of us, and
Codex is right.**

My reasoning was "first-party publisher, so no third-party supply-chain surface, and 17
peers do it". Codex's counter: this connector has an unusually sensitive capability
boundary. TVControl ships `ui_evaluate`, which runs **arbitrary JavaScript in the
TradingView page**, and the only thing keeping it off is that upstream does not register
it unless `TV_MCP_ADVANCED=1`. That is an upstream decision, re-made on every release.

**Failure scenario:** the entry displays `version: 2.2.1` and
`verifiedAt: 2026-08-04 / verifiedBy: Wayland`. npm's `latest` tag later moves. The next
launch silently executes an unreviewed release. Every static test still passes. A future
release could register `ui_evaluate` by default and **no Wayland file would ever contain
the string `TV_MCP_ADVANCED`** - so F-5's tripwire would not fire either.

The decisive point is not supply-chain risk in the abstract (first-party publishing does
reduce that, though it does not eliminate compromised credentials or an accidental
release). It is that **`verifiedAt` + `verifiedBy` are only meaningful against a pinned
artifact.** With a mutable dist-tag, the verified artifact is not the executed artifact,
and the badge asserts something untrue.

Pinning also costs nothing here: F-1 already forces a TVControl 2.2.2 release, so the
entry has to change anyway. Pin it to the release that gets verified.

*(The 17 peers using `latest` are a separate, pre-existing question. None of them, as far
as this audit went, ship a dormant arbitrary-JS tool.)*

## F-1c (MEDIUM, from Codex) - external agents receive literal `npx`, which the probe never tested

**Files:** `ClaudeMcpAgent.ts`, `CodexMcpAgent.ts`, `GeminiMcpAgent.ts`

Packet fact 3 recorded this as neutral background. Codex correctly reads it as a defect:
the probe proves `bun x --bun <pkg>` works, then Wayland writes literal `npx <pkg>` into
`~/.claude.json` / `~/.codex/config.toml` / `~/.gemini/settings.json`. The badge goes
green on the strength of a command the chat agent will never run. If the external CLI's
environment lacks a usable `npx` - Windows `npx.cmd` under a `shell:false` spawn, or a
GUI-launched app with no nvm/fnm PATH - the agent fails while the Library says connected.

This is **pre-existing and affects every npx catalog entry**, not just TVControl, so it
should not gate W-3 on its own. But it is the same false-green class F-1 sits in, and the
`mcpStdioSpawn.ts:9-26` docstring shows the team already reasoned about exactly this
split and fixed it for the session paths while leaving the per-CLI config writers out.

Recommend: track as its own packet. Do not fold into W-3.

## F-1d (MEDIUM, from Codex) - "green" means process-reachable, not TradingView-controllable

Even after F-1 is fixed, the probe only proves the MCP process answered. If the user
skipped the guide and TradingView is running *without* the debugging port, the server
still starts, the Library still goes green, and the first chart request fails.

This is inherent to the schema - there is no readiness-check field - so it is a
**conscious deferral**, not a fix. But it should be stated plainly rather than left
implicit, because it means the "one-click install" claim is true of installation and
false of usable setup.

---

## F-2 (MEDIUM) - the test parses the guide with a looser YAML schema than production

**File:** `tests/unit/renderer/mcp-library/tvcontrolConnector.test.ts`

Production parses guide frontmatter at `useMcpLibrary.ts:127` with
`yaml.load(text, { schema: yaml.FAILSAFE_SCHEMA })`. FAILSAFE resolves every scalar to a
**string** - `estimatedMinutes: 3` becomes `"3"`, not `3`. The test uses a bare
`yaml.load()` (DEFAULT_SCHEMA), which coerces types.

The test therefore reads the file through a parser the app never uses, and cannot detect
a frontmatter change that production would type differently.

*(Raised independently by Gemini. Note the security hook that fired on `yaml.load()` is a
false positive here - js-yaml is 4.1.1, where `load` IS the safe parser and `safeLoad` no
longer exists. The real issue is schema fidelity, not safety.)*

**Fix:** pass `{ schema: yaml.FAILSAFE_SCHEMA }` in the test.

---

## F-3 (LOW) - `popularityRank: 140` collides with Jam.dev

**File:** `com.ferroxlabs-tvcontrol.json`, `x-wayland.popularityRank`

Measured across all 108 ranked entries: ranks run 1..203 and **140 is the catalog's only
duplicate value** - TVControl and Jam.dev now share it, giving those two an undefined
relative order in the Library list.

*(Gemini flagged this field but its reasoning was wrong - it assumed ranks were a dense
1..108 ordinal and concluded 140 was fabricated and would bury the entry at the bottom.
Ranks reach 203, so 140 is mid-table and the placement is fine. The real defect is the
collision, which Gemini did not identify.)*

**Fix:** pick an unused rank.

---

## F-4 (LOW) - the guide points Windows Store users at a file they cannot find

**File:** `guides/com.ferroxlabs-tvcontrol.md`, step `enable-control`

The guide tells Microsoft Store users to "use the `launch_tv_debug.bat` script shipped in
the package". The script **does** ship - confirmed present in the 2.2.1 tarball at
`package/scripts/launch_tv_debug.bat`, alongside `launch_tv_debug_linux.sh`,
`launch_tv_debug_mac.sh` and `launch_tv_debug.vbs`. But when Wayland installs the
connector via npx/bun, the package lands in a hidden cache
(`~/.npm/_npx/<hash>/`, `~/.bun/install/cache/`) that a non-technical user has no way to
locate.

*(Raised by Gemini.)*

**Fix:** inline the actual PowerShell one-liner for Store installs, or drop the sentence.

---

## F-6 (HIGH, from internal) - the safety disclosure sits in dead content

**Files:** `guides/com.ferroxlabs-tvcontrol.md:45-61`, `SetupGuide.tsx:58-60`

`SetupGuide` renders `step.body` for each frontmatter step. It **never renders the
top-level `guide.body`** - the markdown below the frontmatter. Verified: the only `.body`
consumer in `McpLibrary/` is `step.body`.

So everything in the prose section is invisible in the product: *"It can change your
chart"*, *"it does not place orders"*, and the entire `ui_evaluate` paragraph.

That matters more here than for peer guides, because step 2 instructs the user to
**permanently run TradingView with an unauthenticated CDP port on 9222**. Any local
process on that machine can then drive their authenticated TradingView session. The
rendered guide never says so, and the sentence that gestures at it is in the dead half.

**Fix:** `SetupStep` already supports a `warning:` field (`useMcpLibrary.ts:75`, rendered
at `SetupGuide.tsx:86`). Move the chart-mutation and open-port notes into a `warning:` on
the `enable-control` step. (That `guide.body` renders nowhere for any of the 108 guides
is a separate pre-existing platform gap - own ticket.)

## F-7 (HIGH, from internal) - `ui_evaluate` can be re-enabled through a guide edit, and F-5's test would not fire

**Files:** `entryToServerData.ts:64-66`, `useMcpLibrary.ts:65`

`transport.env` is built from `envValues` - **user-entered values keyed by the setup
guide's `inputs`** - not from the entry JSON. Guide input names are validated against
`/^[A-Z][A-Z0-9_]*$/`, which `TV_MCP_ADVANCED` satisfies.

So a future edit adding a `TV_MCP_ADVANCED` input to the guide would put it straight into
the spawned server's environment and register the arbitrary-page-JS tool - while
`expect(JSON.stringify(entry)).not.toContain('TV_MCP_ADVANCED')` stayed green, because
the string never enters the entry JSON.

This is materially worse than Gemini's "security theatre" framing. The test does not just
under-assert; it guards the wrong file.

**Fix:** assert against the **guide** file and against
`entryToServerData(entry, {...}).transport.env`.

## F-8 (MEDIUM, from internal) - the Windows path contradicts the package's own launcher

**File:** `guides/com.ferroxlabs-tvcontrol.md:27`

The guide says `$env:LOCALAPPDATA\Programs\TradingView\TradingView.exe`. The upstream
`launch_tv_debug.bat` probes `%LOCALAPPDATA%\TradingView\`, `%PROGRAMFILES%\TradingView\`,
`%PROGRAMFILES(x86)%\TradingView\`, then MSIX - **never** `\Programs\`. One of the two is
wrong, and the guide's path appears in neither the launcher nor its error text.

**Better fix than correcting the path:** the MCP server registers a **`tv_launch`** tool -
*"Launch TradingView Desktop with CDP enabled. Auto-detects install location on Mac,
Windows, and Linux"* (`src/tools/health.js:82`; present in the live 101-tool listing).
The .bat's own failure text points at it. Make step 2 *"ask the assistant to launch
TradingView with control enabled"* and keep the manual commands as fallback. That also
dissolves F-4 - no more pointing at a file in an npx cache.

## F-9 (LOW, from internal) - `x-wayland.platforms` is dead metadata, so commit `1267b2496` is a no-op

`platforms` appears **only** at `types.ts:123` as a type declaration. Nothing reads it -
not `useMcpLibrary`, not `BrowsePage`, not `build-catalog-index`. Verified by grep across
the renderer.

So the second W-3 commit, "TVControl supports Linux too", changes nothing on the entry
side; only its guide addition (the Linux command) has any effect. **My handoff and the
session memory both overstate this as "declares Linux platform support".** `minWaylandVersion`
is dead the same way - which also disposes of Codex's finding #6 on that field.

Related pre-existing wrongness: `com.wayland-apple-mcp.md` tells users *"the entry is
hidden on Windows and Linux"*. It is not.

## F-5 (LOW) - the `TV_MCP_ADVANCED` test is weaker than it looks

**File:** `tvcontrolConnector.test.ts`, last case

`expect(JSON.stringify(entry)).not.toContain('TV_MCP_ADVANCED')` is a substring scan over
the whole entry. It fails on a harmless mention in a description, and would miss the
variable arriving through any path other than this one JSON file.

It is a tripwire, not a guard - which is acceptable as long as nobody reads it as proof
that `ui_evaluate` cannot be enabled. The genuine protection is upstream: TVControl does
not register `ui_evaluate` unless the env var is set, and the entry declares no
`environmentVariables` at all.

*(Raised by Gemini as "security theater". Downgraded: keeping a cheap tripwire is fine,
provided the structural assertion `environmentVariables` is empty stays alongside it -
which it does.)*

---

## F-10 (from Kimi) - four things only this leg found

- **`packages[].environmentVariables` is inert.** Nothing in `src/` reads it beyond a type
  declaration. So the test's `expect(entry.packages[0].environmentVariables ?? []).toEqual([])`
  is doubly worthless: vacuously true (the field is absent, `?? []` supplies the pass) **and**
  guarding a field with no runtime effect. Compounds F-7 - both env assertions point away
  from the only real vector, `steps[].inputs[].name`. There is no env-name blocklist
  anywhere in the catalog->spawn pipeline; `validateMcpEnvEntry` (`validateMcpServer.ts:112-126`)
  checks key shape only.
- **`codexConfig.ts:69` writes raw `npx` too** - a fourth raw path packet fact 3 omitted,
  on top of the three per-CLI agents. 28 of 108 entries use `runtimeHint: "npx"`, so
  F-1c is systemic. On Windows a bare `npx` under a shell-less spawn ENOENTs outright.
- **`validate-catalog.ts` is wired into nothing** - no npm script, no husky hook, no CI
  workflow. I ran it by hand and reported "All catalog files valid" as though it were a
  gate. It is not. Nothing stops the next entry from skipping it.
- **Commit `2353f2a72`'s message claims "no churn to the other 107". That is false** - the
  regenerated index also changed Raindrop's `shortDescription`. Packet fact 8 is honest
  about it; the commit message is not.

## F-1d PARTIALLY MITIGATED (Kimi)

Kimi checked what Codex and I only assumed. `DetailPage.tsx:527` defaults the detail page
to the **Setup tab until the probe passes**, so a pre-install user sees the guide first
and must navigate away from it to install. That is better than Codex and I both claimed.

The residual is confirmed exactly as feared, though, and Kimi nailed the mechanism: the
probe is an MCP handshake + `listTools`, and TVControl returns its 101 tools **whether or
not TradingView has the port open**. My own "clean install: 101 tools" verification is
itself the proof. So post-install the chip reads "Server reachable", the tab flips to
Overview, and the precondition may be entirely unmet. Only a schema-level readiness flag
closes it. Conscious deferral stands.

## Raised by a leg and REFUTED

- **Codex: "`license: MIT` is not established from authoritative metadata."** Refuted.
  The published 2.2.1 tarball declares `"license": "MIT"` in `package.json` **and** ships
  `package/LICENSE`.
- **Codex: "`minWaylandVersion: 0.9.0` compatibility is unverified."** Technically true
  but not a W-3 defect. Measured across the catalog, the field takes exactly two values -
  `0.9.0` (52 entries) and `0.8.0` (56). It is a coarse convention marker, not a
  per-connector compatibility measurement. TVControl matches the newer cohort.
- **Gemini: "`popularityRank: 140` is fabricated - only 108 entries exist, so this buries
  it at the bottom."** Refuted as reasoned; see F-3. Ranks are sparse and run to 203, so
  140 is mid-table. The actual defect is the collision with Jam.dev.
- **The `yaml.load()` security-hook warning** that fired twice while writing this audit.
  False positive - it is written for PyYAML. js-yaml here is 4.1.1, where `safeLoad` was
  removed and `load` is the safe parser. The real issue is schema fidelity (F-2).

## Checked and found clean

- **Schema validity** - `validate-catalog.ts` prints "All catalog files valid."
- **Icon** - inline `currentColor` SVG, `viewBox="0 0 24 24"`, no external refs, no
  script, no `<image>`/`<foreignObject>`. Matches the other 107.
- **`auth.method: "none"`** - correct. TVControl has no account, no token; it talks to a
  local desktop app. A non-`none` value would wrongly route Install through the OAuth
  branch.
- **`setupGuide.path`** - present, which is what makes the guide render at all.
- **`version: "latest"`** - matches 17 peer entries. TVControl is first-party
  (FerroxLabs publishes it), so an unpinned fetch adds no third-party supply-chain
  surface, and a hard pin would need a Wayland release to move. *Gemini concurred.*
- **`license: MIT`** - matches the published package.
- **Linux support** - the shipped `launch_tv_debug_linux.sh` probes 8 install locations
  (`/opt/TradingView/...`, snap, flatpak, PATH), so the `linux` platform claim is
  substantiated. The guide's `/opt/TradingView/tradingview` is the script's own first
  candidate.
- **Nothing committed by accident** in the two commits.

## Pre-existing, out of scope

- `build-catalog-index.ts:32` stamps `publishedAt: new Date().toISOString()` on every
  run, so `catalog.json` is non-deterministic by construction and always shows a diff.
- The same regeneration folded in an unrelated one-word change to Raindrop's
  `shortDescription` that had been sitting unregenerated in its entry file.
- `~/dev/tvcontrol` has uncommitted working-tree changes to `src/core/batch.js`,
  `src/tools/batch.js`, `tests/batch.test.js` from a different session. Not touched.

## Panel

| Leg | Verdict | Found F-1? | Notes |
|---|---|---|---|
| **Internal** (live repo + tarball) | **NO-GO** | **YES, independently** | Richest leg by far. Own MCP-client probe; traced the user-visible error; found the #376 precedent, F-6, F-7, F-9, the `tv_launch` fix, and the 19-day 2.2.0 outage. |
| Codex 5.6 Sol | FIX-FIRST | no | Overturned me on `latest` (F-1b) and promoted F-1c to a defect. 2 findings refuted. |
| Kimi K3 | FIX-FIRST | no | Four unique findings (F-10); correctly mitigated F-1d where Codex and I both guessed wrong. |
| Gemini 3.1 Pro | FIX-FIRST | no | 2 upheld (F-2, F-4), 1 downgraded (F-5), 1 corrected (F-3). |
| Author (empirical) | **NO-GO** | yes | F-1, F-3 |

**Method note - the important one.**

Three of the four legs returned FIX-FIRST on a connector that **cannot connect at all**.
Not because they reasoned badly - Kimi's closing line was *"the packet's facts held up
unusually well under checking, including the ones I tried hardest to refute"* - but
because I wrote the broken mechanism into the packet's "verified surrounding facts"
section as established truth. Facts 2 and 3 described what the code *would* produce; I
never executed it. Everything downstream inherited the error.

The only leg that found it was the one with live repo access **and** an explicit
instruction to distrust the packet because its author had been confidently wrong before.

Two rules out of this:
1. **A packet may only assert as verified what was actually executed.** Anything derived
   by reading code is a hypothesis and must be labelled one.
2. **At least one leg must be able to reach past the packet** - live tree, published
   artifact, real network - or the panel can only ever confirm the author's premises.

This is the second time in this arc the author's confident mechanism was wrong (W-1's
root cause was the first). The difference is that W-1's panel caught it and W-3's very
nearly did not.
