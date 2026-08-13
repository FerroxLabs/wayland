# PLAN v2 — Agent installers + Flux fan-out (K-05 completion, K-06, K-07)

**Written** 2026-08-13. **Base** `packet/wl-integration` @ `9fa2198de`.
**v2 supersedes v1 after a 4-leg cross-audit** (Codex · Gemini 3.1 Pro · Kimi K3 ·
internal reviewer). v1 verdicts: **NO-GO** (Gemini), **FIX-FIRST** (Kimi), **FIX-FIRST**
(internal). Every fix below traces to a finding; §9 records what was rejected and why.

**Strategy (Sean):** install every agent we can and **auto-configure each to route through
Flux**. Their reach is our distribution; the router is the moat.

**[V]** = verified by execution or by reading shipped source. **[?]** = a wave must answer it
before building.

---

## 0. ⛔ BLOCKING DECISION FOR SEAN — read before dispatching anything

**This codebase already ruled the opposite way on vendor install scripts, with reasons.**
`src/process/bridge/officecliInstaller.ts:7-19` [V]:

> *"We intentionally do not run the upstream install scripts as a fallback: the tagged scripts
> currently resolve a moving `latest` binary, so **checksum-pinning the script would not pin what
> ultimately executes**." … "A missing or altered packaged binary is a release defect, **never
> permission to download and execute mutable code at runtime**."*

`REQUIREMENTS.md:585` (INS-06) requires every non-npm channel to extend the same *"manifest,
consent, **checksum**, and uninstall contract… No channel weakens it."*

Your ruling this session was that `curl | sh` is acceptable for a vendor's own official script.
That is in direct tension with the above, and the technical objection is not ideology: **piping a
script to a shell cannot verify what it will download and run**, and the script resolves a moving
`latest`.

**Recommended resolution — adopt for every non-npm agent:** do not run the vendor script. Instead
**resolve the vendor's pinned release artifact, verify its published signature or SHA-256, then
execute**. This keeps your intent (use official vendor channels, not third-party repackages),
satisfies INS-06, and matches the OfficeCLI precedent rather than contradicting it.

- **Claude Code** — Anthropic publishes exactly this: signed `manifest.json` + `.sig`, SHA-256 per
  platform binary, GPG `31DD DE24 DDFA B679 F42D 7BD2 BAA9 29FF 1A7E CACE` [V]. Also
  `winget Anthropic.ClaudeCode` and a Homebrew cask, which are themselves verified channels.
- **Grok / Hermes / OpenClaw** — [?] **a wave must first establish whether each publishes a pinned,
  hash-verifiable artifact.** If a vendor offers *only* `curl | sh` with a moving target, that agent
  **does not ship in this milestone** — per INS-02's own words: *"A tool offering only a shell
  installer does not ship in this phase."*

**Do not dispatch Waves B–E until this is answered.** Wave A is unaffected.

---

## 1. Why this shape

We do not out-compete OpenClaw on channel breadth (~20 platforms, thousands of contributors) and
should not try. We compete as **router + desktop**, which neither can copy — both are deliberately
provider-agnostic and neither owns routing. So installing them converts a community we did not
build into routed revenue.

**Governing rule:** an installer without its Flux connector is generosity, not strategy. Ship
installer + connector + live proof together, per agent, or do not ship that agent.

---

## 2. Verified starting state

### 2.1 npm install machinery — PROVEN on a clean box [V]
Fresh Ubuntu 24.04 droplet, **no node, no npm, no agents** (created, tested, destroyed):
bundled bun **1.3.14** (checksum matched `scripts/bundled-bun-shasums.json`, `951ee2ae…`);
`bun install --cwd <prefix> --ignore-scripts --no-save <pkg>@<ver>` installed
`@agentclientprotocol/codex-acp@1.1.2` and `@moonshot-ai/kimi-code@0.34.0`; both launched.

⚠️ **kimi's blocked postinstall is NOT proven harmless.** `installAgent.ts:13-14` [V]: *"kimi-code
drags in node-pty"* — a native module **not built** under `--ignore-scripts`. `kimi --version`
printing `0.34.0` does not exercise PTY. **A wave must run a real shell-tool turn through kimi, or
we state it as a known limitation.**

### 2.2 Flux fan-out is PARTLY built [V]
`fluxCompat`: `'env'` (routes via env injection now) · `'setup'` (needs a config-writing connector)
· `'vendor'` (locked to its own service). Connectors live in `src/process/connectors/`.

| agent | fluxCompat | routing implementation |
|---|---|---|
| claude | `'env'` (`ANTHROPIC_BASE_URL`) | works today |
| codex · kimi · opencode | `'setup'` | ✅ `connectors/{codex,kimi,opencode}.ts` |
| **hermes** | `'setup'` | ✅ **ALREADY BUILT AND PROVEN — see below** |
| **qoder** | `'setup'` | ❌ none |
| grok | `'vendor'` | ⚠️ **contested — see §4.2** |
| wcore · gemini | `'env'` via `NON_ACP_FLUX_COMPAT` | n/a |

🟢 **Hermes routing EXISTS. Do NOT rebuild it.** `task/hermesConfig.ts`
`materializeFluxHermesHome()` writes a scoped `HERMES_HOME` (`flux-hermes-home/config.yaml`) and
**never touches the user's real `~/.hermes`**; `fluxRouting.ts:92`
`SCOPED_HOME_FLUX_BACKENDS = ['hermes']`, `:90` *"Proven end-to-end against hermes v0.14.0
(2026-06-12)"* [V]. Three of four audit legs missed this by looking only in
`src/process/connectors/` — **a connector file is not the only routing mechanism.**

⭐ **ADOPT THE SCOPED-HOME PATTERN AS THE DEFAULT for every connector.** It routes through Flux
without rewriting a file we do not own, which is how FAN-03 (show every file modified, allow undo)
and FAN-04 (restore, do not strand) become nearly free instead of hard. It is also the direct
answer to the "config hijacking" objection: we do not hijack, we scope.

🔴 **Shipped defect:** `FluxCompatChip.tsx` renders an inert "Flux setup" chip for **hermes and
qoder**, advertising routing that cannot happen. Fix or hide it.

**Fan-out surface is 9 backends, not 7** — `NON_ACP_FLUX_COMPAT` adds wcore and gemini.

### 2.3 Installable catalogue [V]
`AGENT_PACKAGES` has exactly **2** entries: `codex` → `@agentclientprotocol/codex-acp@1.1.2`
(`cliCommand: 'codex-acp'`, **not** `codex`), `kimi` → `@moonshot-ai/kimi-code@0.34.0`.
Detection covers 18 agents. **Installation is the gap.**

### 2.4 OpenClaw already exists as a backend — v1 was WRONG [V]
Not "no entry at all". `AgentBackend` includes `'openclaw-gateway'`; `DetectedAgentKind`,
`OpenClawDetectedAgent`, a full `renderer/pages/conversation/platforms/openclaw/`, draft store,
logo and agent scope all exist, plus a remote-agent path (`RemoteAgentProtocol = 'openclaw' | …`).

⚠️ **Adding an `openclaw` ACP entry would create a second identity for one product** — two backend
ids, two detection paths, two chips. `agentLogo.ts:39` already anticipates the collision.
**Wave D must first decide: is OpenClaw an ACP CLI, or the gateway we already support?**

### 2.5 Assistants that already exist [V]
`openclaw-setup.md` **19.5K** (thorough) · `hermes-setup.md` **3.1K** (thin) · `cli-setup/`.

---

## 3. Provenance — researched against official sources [V]

**This section exists because v1 proposed shipping `@vibe-kit/grok-cli` — one personal gmail
maintainer, no repository field — to users as "Grok Build". A name match is not provenance.**

| Agent | Vendor | Official npm? | ACP |
|---|---|---|---|
| Claude Code | Anthropic | ✅ `@anthropic-ai/claude-code` (all `@anthropic.com`) | via `claude-agent-acp` (already npx'd) |
| Codex | OpenAI | ✅ `@openai/codex` (all `@openai.com`) | via `codex-acp` — shipping |
| Kimi | Moonshot | ✅ `@moonshot-ai/kimi-code` (MoonshotAI org) | native `kimi acp` |
| OpenCode | SST | ✅ **`opencode-ai` is official** (`thdxr` = Dax Raad) | native `opencode acp` |
| Grok Build | xAI | ❌ none | native ACP |
| Hermes | Nous Research | ❌ **npm pkg is a third-party wrapper** (`wyrtensi`) | native `hermes acp` |
| OpenClaw | openclaw/openclaw | [?] **unverified** | [?] see §2.4 |

**REJECTED — never pin:** `@vibe-kit/grok-cli`, `hermes-agent` (npm).

---

## 4. Known blockers

### 4.1 Claude Code under `--ignore-scripts` — ⚠️ CONTESTED, settle by execution [?]
Anthropic's npm package uses a **postinstall** to link its platform binary. **Two audit legs
disagree on the consequence:** one says the install is left non-functional; Codex cites Anthropic's
troubleshooting docs saying Claude falls back to a slower wrapper and still works, making the real
question whether **our** `launchSpecResolver` can locate that wrapper.

**Do not decide this from documentation.** Install `@anthropic-ai/claude-code` into a scratch prefix
with `--ignore-scripts` on a clean box, then call `resolveLaunchSpecWith` and launch it. Cheap, and
it settles whether Wave B is an npm entry or a vendor-artifact wave.

**Regardless of outcome: do NOT drop `--ignore-scripts`** — it is a security control
(`installAgent.ts:15`: *"`bun install` would execute arbitrary vendor code inside the user's
profile"*).

### 4.2 Grok routing — ⚠️ CONTESTED, spike before concluding [?]
Our config says `fluxCompat: 'vendor'` — *"Talks to xAI's own gateway (grok.com); not
Flux-routable"* [V]. **Codex challenges this**, citing an official `GROK_MODELS_BASE_URL` custom
OpenAI-compatible endpoint in xAI's own repo. If that holds, Grok **is** routable and the `'vendor'`
classification is stale.

**Run the compatibility spike BEFORE the Grok installer wave** — if Grok cannot route, it is the one
agent where install ≠ revenue and it should be sequenced last (or cut) under the plan's own
"everything feeds Flux" goal. Auth still requires SuperGrok ($30/mo) or X Premium+.

### 4.3 Grok's binary name [?→ likely resolved]
Our config says `cliCommand: 'grok'`; earlier web reading suggested `grok-build`. Codex reports the
installed binary is **definitively `grok`**, matching our config. Confirm on the clean box during
the §4.2 spike; **do not change detection on documentation alone.**

### 4.4 The npm→vendor gap is structural, not per-wave [V]
- `AgentPackage` has four fields (`npmPackage`, `version`, `cliCommand`, `acpBackend`) — **no
  channel discriminant, no URL, no checksum field**.
- `AgentInstallReceipt` **requires** `npmPackage` as a non-empty string; validation rejects a
  receipt without it, so a vendor install reads as *"no receipt"* and **uninstall removes nothing**.
- Uninstall is exactly `rmSync(receipt.prefix)` — *"the only thing uninstall is allowed to remove"*.
  A vendor script scatters into `~/.local/bin`, `~/.hermes`, and may edit shell rc.
- `launchSpecResolver` resolves **only** from `<prefix>/node_modules/<pkg>`.
- `ManagedAgentStatus.npmPackage` / `.pinnedVersion` are required; `bundledBunAvailable` is a single
  global boolean → on win32-arm64 and non-AVX2 win32-x64 a **vendor-installed agent needing no bun
  would still render "unavailable"**.
- `conciergeConfig.ts` `installAgentProposalMatchesPin` refuses any agent not in the npm-pinned
  catalogue, explicitly to stop *"a prompt-injected block install an arbitrary npm package"*.

**⇒ This is Wave 0, not a Wave F cleanup.** Run as v1 ordered it, Waves B–E each invent an ad-hoc
receipt and F reconciles four of them.

**Consequence to state up front: non-npm agents are NOT concierge-installable.** Widening that
guard to accept a channel or URL reopens the injection hole it exists to close.

---

## 5. Waves

### Wave 0 — Foundation (serialized, blocks B–E)
1. **Channel abstraction** on the catalogue: `npm` | `vendor-artifact`, with URL + pinned
   version + expected signature/hash.
2. **Download-verify-execute** — ⚠️ **reuse `services/voice/VoiceAssetManager.ts`**, which already
   does cancellable, progress-streaming, atomic-rename download with SHA-256
   (`VOICE_ASSET_HASH_MISMATCH`). **Tighten first:** it *warns and proceeds* on an empty `sha256` —
   acceptable for a voice model, **unacceptable for an executable**. Refuse at the call site.
3. **Generalised receipt**: `npmPackage` optional; record an explicit file/dir list, PATH entries
   and shell-rc deltas. Uninstall removes what the receipt lists.
4. **Wire widening**: `ManagedAgentStatus`, `agentInstallerBridge`, `installableAgents`, and the
   card — `bundledBunAvailable` must stop gating vendor-channel agents.
5. **Launch-spec resolution outside `node_modules`.**
6. **Connector registry** — the seam is hand-duplicated across `connectors/<tool>.ts`,
   `fluxConnectorBridge` (9 hardcoded IPC providers), `ipcBridge`, `fluxConnector.ts` (three
   near-identical type pairs), `FluxCompatChip.tsx` (hardcoded backend list), `FluxSetupModal.tsx`.
   **Generalise before C and D run in parallel, or serialize them.**

### Wave A — OpenCode (can start now, in parallel with Wave 0)
Official npm, native ACP, connector exists.
🔴 **PRE-FLIGHT FIRST, ~5 minutes, before dispatch:** `launchSpecResolver` accepts only a native
binary under `<pkg>-<platform>-<arch>/vendor/<triple>/…` or a `bin` ending `.js`/`.mjs`/`.cjs`.
**`opencode-ai` publishes `opencode-<platform>-<arch>` siblings (not `opencode-ai-…`) and an
extensionless bin** → likely `LaunchSpecUnresolvedError`. Install into a scratch prefix and call
`resolveLaunchSpecWith` before assuming this wave is small.

### Wave B — Claude Code (needs Wave 0 + §0 ruling)
Pinned verified artifact via Anthropic's signed manifest; or winget/brew per platform.
Flux is already `'env'` — **verify end to end, do not rebuild**.
**Never** Claude Pro/Max subscription OAuth (standing hard NO, ToS). API key / Bedrock / Vertex.

### Wave C — Hermes (needs Wave 0 + §0 ruling) — **much smaller than v1 assumed**
Official vendor artifact — **not** the npm wrapper.
🟢 **Do NOT build a Flux connector — routing already exists and is proven** (§2.2). This wave is
**installer + UI + live proof + assistant**, not routing.
**Bring `hermes-setup.md` to parity with `openclaw-setup.md`** (3.1K → ~19.5K) — read the OpenClaw
one and match its shape rather than inventing. [?] Does the assistant run before install (guided) or
after (configure what landed)? OpenClaw's is the proven model.

### Wave D — OpenClaw (needs Wave 0 + §0 ruling + §2.4 decision)
Verify npm provenance. **Resolve the two-identity problem first.** Build its connector.
`openclaw-setup.md` exists at 19.5K — audit against current OpenClaw, do not rewrite.

### Wave E — Grok (last; needs Wave 0 + §0 ruling)
Resolve §4.3 on a clean box. **No Flux connector** — UI must state it does not route.

### Wave F — Cross-cutting
Windows first-class (INS-04): PATH, `.cmd` shims, the `shell:false` spawn trap in
`mcpStdioSpawn.ts`. Provenance disclosure in the UI wherever we install a **bridge** rather than the
vendor's own tool (`codex-acp`, `claude-agent-acp` — we ship two already).

---

## 6. Acceptance — per agent, non-negotiable

**Phase mapping corrected:** K-05 = npm subset (INS-01…05) · **K-06 = non-npm channels (INS-06)** ·
**K-07 = Flux fan-out (FAN-01…05)**. v1 mislabelled fan-out as K-06 throughout.

1. **INS-01** — installs from the panel, detected by `AgentRegistry`, **and a chat runs on it**, on
   a **clean VM per OS**. Not a unit test. Not the developer's machine.
2. **INS-02** — pinned version + verified checksum. **INS-06** — non-npm channels extend the same
   manifest, consent, checksum and uninstall contract; no channel weakens it.
3. **INS-03** — explicit per-install consent.
4. **INS-04** — Windows first-class, proven on the Windows box.
5. **INS-05** — uninstall **by manifest, not by name**, restores the prior state.
6. **FAN-01** — after install the agent's config points at Flux and a real turn routes through it,
   per agent, on all three OSes.
7. **FAN-02** — API key + base URL only. **Never Claude subscription OAuth.**
8. **FAN-03** — the user **sees every config file we modified and can undo it**. No key written into
   a file we do not own without saying so. *(Dropped from v1 — restored.)*
9. **FAN-04** — an agent whose config we rewrote **keeps working if Flux is later removed** —
   restore, do not strand. *(Dropped from v1 — restored.)*
10. **FAN-05** — pinned models **filtered per agent capability**; a model offered must work.
    *(Dropped from v1 — restored. A connector that writes the full Flux catalog into an agent that
    cannot serve those models ships a broken model picker.)*

**Routing consent is separate from install consent.** A user installing Claude Code expects traffic
to reach Anthropic; pointing it at our router is its own decision and must be its own explicit,
reversible step. FAN-03/04 are how that is honoured.

**Clean-machine rule:** the developer's Mac cannot test this — detection reads the **login shell's**
PATH, so on Sean's box it finds 18 agents and the install path never runs. Use a fresh DO droplet
(Ubuntu 24.04, ~$0.036/hr, **destroy after**; never touch the four `flux-pool-r2` k8s workers) and
the Windows `wlclean` account.

---

## 7. Traps carried in

⚠️ Verify the publisher before pinning — a name match is not provenance.
⚠️ **Read our own source before searching the web** — Claude Code's ACP bridge was already wired
here; a guessed npm name returned 404 and produced a wrong conclusion.
⚠️ **`bun run test` does NOT run Playwright.** A change can be 17,523-green in vitest and still
break e2e. It did this session.
⚠️ **Never leave a background e2e run unattended** — it opens real Electron windows and looks like a
live app misbehaving.
⚠️ `Page.captureScreenshot` hangs behind an Arco modal mask; `Runtime.evaluate` still works.
⚠️ The message list is virtualized — `innerText` sees only the viewport; the DB is the oracle.
⚠️ Pick the chat scroller by geometry (`x > 290`), not "first scrollable element" — that's the sidebar.
⚠️ `rtk` grep reported 0 matches for a string that was present; cross-check with `python3`.
⚠️ Identify engine binaries by sha256, never `--version`.

---

## 8. Out of scope, still open

- **Default-model resolution**: an unconfigured profile resolves to `gemma3:4b` (Ollama) on the
  `gemini` backend, which then demands an OpenAI key. Seen in e2e temp profiles. Whether
  `078514ef9` / `3b9bf0ac5` covered this path is **unverified**.
- **`[CRON_PROPOSE]` half-fixed** (`d75822bf6`): stored row cleaned, but `updateMessage` does not
  broadcast, so the raw block is still visible during the streaming window.
- **`stream_end` before `stream_start`**: not seen on mcpfold; trigger is the last MCP server
  connecting during turn startup.
- **Full 135-spec Playwright e2e has never completed green** — killed mid-run; pre-kill failures in
  `features/conversations/acp/` are **unclassified**.

---

## 9. Audit dispositions

**⚠️ Method lesson from this audit — three legs agreed and were wrong.** Gemini, Kimi and the
internal reviewer all reported "Hermes has no Flux connector" because all three looked only in
`src/process/connectors/`. Codex looked in `src/process/task/` and found a built, proven
implementation. **Convergence between auditors is not evidence; shared method produces shared blind
spots.** Verify a claim by execution or by reading the code, not by counting votes.

**Also from Codex, carried but not yet actioned:**
- **The npm path is not INS-02 compliant either.** It pins only the top-level package, performs no
  Wayland-owned integrity verification, and writes the receipt immediately after resolving the
  executable. Codex and Kimi must get their own hardening/acceptance work — "already present" does
  not satisfy checksum, rollback and clean-OS requirements.
- **Spawning a moving `latest` bridge is itself an unaddressed supply-chain risk.**
  `bridgeVersionResolver` fetches npm `latest` at connect time, so we execute whatever the registry
  serves. That is the *opposite* trade-off from the pinned-artifact rule in §0 and deserves a
  deliberate decision, not a default.
- **Transactional rollback**: if install succeeds but Flux configuration fails, the machine must not
  be left half-configured.

**Accepted:** the phase-numbering fix and restoration of FAN-03/04/05 (Gemini + internal, converged);
Wave 0 as a prerequisite (Kimi + internal, converged); download-verify-execute instead of piping to
a shell (Gemini); the OfficeCLI precedent needing Sean's explicit ruling (internal); the OpenCode
launch-spec pre-flight (internal); the OpenClaw two-identity problem (internal); reuse of
`VoiceAssetManager` (internal); the kimi `node-pty` question reopened (internal); the inert
hermes/qoder Flux chip (internal); non-npm agents excluded from concierge install (internal).

**Corrected:** v1 §4.4 claimed the `claude-agent-acp@0.44.0` pin was 22 versions stale and needed a
bump. **Wrong** — `bridgeVersionResolver` resolves the latest at runtime and the pin is only an
offline fallback; that staleness class was deliberately eliminated. **Section deleted.** v1 also
claimed OpenClaw had no backend entry — it has `openclaw-gateway` and a full platform (§2.4).

**Rejected — Gemini's strategic NO-GO** ("installing Hermes/OpenClaw pays your competitors'
acquisition cost"). Sean has weighed and decided this. The counter-argument assumes a user who
reverts the base URL *and* uninstalls Wayland, and ignores that declining to install them does not
cost those projects a single user. **Recorded as dissent, not actioned.**
