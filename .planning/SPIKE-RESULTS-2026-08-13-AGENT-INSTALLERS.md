# Spike results — every `[?]` in PLAN v2, settled by execution

**Run** 2026-08-13, four parallel spikes against `packet/wl-integration`.
**Read this alongside the plan; where they disagree, this file wins** — the plan reasoned from
reading, these ran the code.

**[V]** = executed or read in shipped source. Each spike ran a **known-positive control** before
believing any negative; all four controls passed, so the NOs below are properties of the subject,
not of the method.

---

## §0 — RESOLVED. And the ruling is narrower than the question implied.

**Ruling: no `curl | sh`.** Resolve the vendor's *pinned* artifact, verify its published signature
or SHA-256, then execute. Keeps the intent (official vendor channels, never third-party
repackages), satisfies INS-06, matches the shipped OfficeCLI precedent.

**But the ruling barely applies**, because the premise that non-npm meant vendor-artifact was wrong
for the two agents it was supposed to unblock:

- **Claude Code ships fine over npm** — see §1. Vendoring it would mean hosting 8 platform packages
  × ~270 MB in our release pipeline and taking on redistribution licensing, to dodge a missing path
  candidate. **Do not.**
- **Grok is the only genuine `curl | sh`-only agent** (`https://x.ai/cli/install.sh`) [V].

So §0 governs Grok and Hermes only. Everything else is an npm-channel wave.

---

## 1. Claude Code under `--ignore-scripts` — CONTEST SETTLED. Both auditors were half right. [V]

`bun install --cwd <prefix> --ignore-scripts --no-save @anthropic-ai/claude-code@2.1.223`, run with
the app's own bundled bun (1.3.14, sha `cdf91d46…`):

- The declared bin `bin/claude.exe` is **500 bytes of ASCII shell**, mode `-rw-r--r--`, whose entire
  body prints *"Error: claude native binary not installed"* and exits 1. Anthropic ships this
  placeholder deliberately. Auditor 1 is right: **the declared entry point is dead.**
- The real binary **is installed anyway** — it is an `optionalDependencies` entry, which
  `--ignore-scripts` does not touch: `@anthropic-ai/claude-code-darwin-arm64/claude`, Mach-O arm64,
  272 MB. Ran it: `2.1.223 (Claude Code)`. Auditor 2 is right: **the bits work.**
- `cli-wrapper.cjs` (the "slower wrapper" from Anthropic's docs) also works — but nothing in `bin`
  points at it.

**Our resolver throws `LaunchSpecUnresolvedError`** — it misses by exactly one path segment.
`nativeCandidates` requires `vendor/<triple>/`, copied from `@openai/codex`; Anthropic puts the
binary flat at the sibling package root.

⚠️ **`node_modules/.bin` is not a shortcut out of this**, beyond the existing rule against emitting
into it: the symlink target is **bun-version-dependent** [V] — bundled bun 1.3.14 links the working
binary, system bun 1.3.11 links the broken stub.

🔴 **The real Wave B gate is not the resolver.** `claude --help` has **no `acp` subcommand** — 0
occurrences. So `@anthropic-ai/claude-code` cannot be an `acpBackend` directly; it needs the bridge,
exactly as codex needs `codex-acp`. **Wave B is install + bridge, and the bridge is the hard part.**

---

## 2. OpenCode — Wave A is **M, not S**. Ships a stub bin by design. [V]

`opencode-ai@1.18.18`. Same shape as Claude Code, and it fails our resolver the same way — twice
over:

- `bin/opencode.exe` is a **479-byte shell stub** that prints *"postinstall script was not run"* and
  exits 1. Named `.exe` on every platform. Our `.js/.mjs/.cjs` rejection of it is **correct and must
  be preserved.**
- Platform siblings are named off the **bin** name, not the package: `opencode-darwin-arm64`, and
  Windows is `opencode-windows-x64`, **not `win32`**. We probe `opencode-ai-<platform>-<arch>`.
- No `vendor/<triple>/` segment anywhere; layout is flat `<sibling>/bin/opencode`.

**`opencode acp` works** — drove a real ACP `initialize` over stdio and got the full capability
handshake back, `agentInfo: {name: "OpenCode", version: "1.18.18"}`. The `opencode` ACP backend
**already exists** in `acpTypes.ts` with `acpArgs: ['acp']`, enabled.

A catalogue-entry-only Wave A would ship an **install button that always fails**, visibly, on every
platform.

🔴 **Latent path traversal found, proven by fixture** [V]: `bin.name` is an object KEY from a
downloaded `package.json`, joined into paths with no containment check (unlike the `bin` *entry*,
which is guarded). A package declaring
`bin: {"../../../../../../../usr/bin/whoami": "dist/index.js"}` makes the real resolver return
`{"command":"/usr/bin/whoami"}`. **Not reachable today** — the catalogue pins two trusted packages —
so it is latent, not an open defect. But the fix for OpenCode promotes `binName` from a filename to
a *directory* name, which is what makes it matter. **Fix it in the same packet.**

**Recommendation:** declare the sibling prefix in the pinned catalogue
(`nativeBinPackagePrefix?: 'opencode'`) rather than deriving it from network metadata. Matches the
existing `CODEX_NATIVE_PACKAGE` precedent and the file's own doctrine: *"`bin` comes from a
downloaded package.json; never follow it out of the package."*

---

## 3. Grok — `fluxCompat: 'vendor'` is FALSE. It is the cheapest connector we have left. [V]

Verified in xAI's own shipped Rust, not just docs:

- `config.rs:544` — `models_base_url: env_string("GROK_MODELS_BASE_URL")`, read from process env at
  startup. **Exactly our env-injection model.**
- `models.rs:33-45` — auth priority is `custom_endpoint > session > deployment > api key`. A custom
  endpoint **outranks a cached `grok login` session**, so injection beats an existing login rather
  than losing to it.
- `server.rs:324` — the **`grok agent stdio` ACP path consults the same custom-endpoint config**, so
  this applies to the spawn we actually use.
- Vendor docs, "Auth Behavior": *"You do not need `grok login` — the API key is enough."*
  **No SuperGrok, no X Premium+.** API key + base URL only, so our hard rule is satisfied.

**Official repo is `xai-org/grok-build`.** There is no `xai-org/grok-cli` — enumerated the whole org.
`@vibe-kit/grok-cli` and friends are all third-party; the earlier burn was real.

**`cliCommand: 'grok'` is correct — do not change it.** `grok-build` is the product, `xai-grok-pager`
the cargo artifact, `grok` the command.

**Change:** one entry in `BACKEND_FLUX_ENV` (`fluxRouting.ts:49`) —
`GROK_MODELS_BASE_URL: FLUX_SURFACE.openai`, `XAI_API_KEY: <fluxKey>` — flip `fluxCompat` to `'env'`,
fix the stale auth comment at `acpTypes.ts:469`.

[?] **One open wiring detail:** Grok fetches its catalog from `{base_url}/models` at startup and
picks from it — `OPENAI_MODEL=flux-auto` is not how it selects. Whether Flux's OpenAI surface serves
a usable `/models` list is unverified. `GROK_MODELS_LIST_URL` is the documented escape hatch. This is
wiring, not routability.

---

## 4. OpenClaw — the §2.4 premise was wrong. We already own the CLI path. [V]

The plan asked "is OpenClaw an ACP CLI or the gateway we already support?" — assuming we lacked the
CLI path. **We have it.** `AgentRegistry.ts:133` runs `which openclaw` on the local PATH and
`OpenClawGatewayManager.ts:221` spawns `openclaw gateway`. The "gateway" backend **is** the local
CLI.

And upstream `openclaw acp` is **not an independent agent** — read the real `src/cli/acp-cli.ts`:
*"Run an ACP bridge backed by the Gateway"*, taking the same `--url/--token/--password` and sharing
the same session keyspace. It is strictly downstream of what we already spawn.

**Adding an `openclaw` ACP backend id would break two concrete things:**
1. **Double detection of one binary** — `POTENTIAL_ACP_CLIS` is generated from `ACP_BACKENDS_ALL`, so
   every user with OpenClaw gets **two cards, two chips, one binary.**
2. **A silently dead route** — `getConversationTypeForBackend('openclaw')` already returns
   `'openclaw-gateway'`, so the new backend would dispatch to the gateway manager and *appear* to
   work while doing nothing new.

**Wave D builds on `openclaw-gateway`.** Leave the `openclaw` aliases in `agentLogo.ts` and
`buildAgentConversationParams.ts` — they are correct defensive aliases.

---

## 5. Wave 0 — two plan premises corrected, one of them load-bearing

### 🔴 The concierge guard is DEAD CODE. The plan's stated consequence does not follow.

`installAgentProposalMatchesPin` exists and reads exactly as quoted — but **the `install_agent`
proposal kind is entirely unwired** [V]: no case in `ConciergeProposeDetector`'s parse switch, no
case in `conciergeConfigBridge`'s apply switch, no branch in `ConciergeConfigCard`. Its only caller
is a unit test. (Control: `provider_connect` appears in 7 files, `add_mcp` in 12.)

So the plan's line *"non-npm agents are not concierge-installable"* is true but misleading: **no
agent of any channel is concierge-installable today.** Nothing can be weakened because nothing is
load-bearing — and "we didn't touch the guard" is **not** evidence the injection class is closed.

**Recommendation:** in Wave 0, widen `pinned` to the discriminated `AgentPackage` and hard-return
`false` for any non-npm channel. Four lines, and it makes "vendor agents are not concierge-
installable" a compile-time fact rather than an unwritten intention. It is the only place in the map
where security posture rests on prose.

### The receipt gate is worse than reported — three seams, not one.

`readInstallReceipt` requires `npmPackage` non-empty; `null` propagates to **uninstall**
(removes nothing), **status** (reports not-installed), **and launch** (never reaches the ACP seam).
A vendor install would be invisible at all three.

⚠️ **Back-compat is mandatory:** existing receipts have no `channel` field, so absence must default
to `'npm'` or every installed codex/kimi silently un-installs itself on upgrade.

### VoiceAssetManager — reusable, and the empty-hash hole is real.

Genuinely reusable (nothing voice-specific in the class; its own type doc already names binaries as
an intended payload). Confirmed: on an empty expected `sha256` it warns and **falls through to the
rename** — the unverified file is promoted to `destPath` and returned as success.

Two extra traps the plan did not have: the **cache short-circuit returns `cached: true` without
re-verifying** an existing file, and it **echoes back the expected hash rather than a computed one**
— so the returned value is not proof of the on-disk bytes. And `rename` preserves the write mode, so
**no exec bit**.

**Do not edit VoiceAssetManager** (its warn-and-proceed is deliberate for unpinned model weights).
Refuse at the call site *before* download, and **re-assert the hash after** it returns.

### FluxCompatChip — the defect is real but mis-aimed.

Not a wiring bug: the inert chip is **deliberate and test-pinned** (`agentsSettings.dom.test.tsx`
asserts the contrast using qoder as the negative case). And it is not qoder-only — **hermes renders
the same inert chip.**

The accurate finding is a **labelling** defect: a non-actionable chip whose text is identical to the
actionable one. For hermes the label is directionally true (it really does route, via scoped home).
**For qoder it is simply false** — qoder routes through its own login and is in no Flux set. The
qoder chip is the one to fix.

### Stale comment that would mislead a Wave 0 builder

`fluxRouting.ts:85-86` and `:221-222` document the hermes scoped config as using
`key_env = FLUX_API_KEY`. **False.** `hermesConfig.ts:54` writes `api_key` **inline**, and its own
header records that `key_env` is *ignored* by hermes for a custom provider and returned 401. Anyone
copying the pattern from the `fluxRouting` comment instead of from `hermesConfig` builds a broken
connector.

### Connector seam — 6 edit sites to onboard a 4th connector

`connectors/*.ts` (3 per-tool × 5 exports; the other 6 files are shared infra, **there is no
`hermes.ts` or `qoder.ts`**) · `fluxConnectorBridge` (3 PATH probes, 9 handlers, 9-line init) ·
`ipcBridge` (9 channels) · `fluxConnector.ts` (3 byte-identical type pairs) · `FluxSetupModal`
(union + if/else) · `FluxCompatChip` (hardcoded 3-name allowlist).

---

## 6. Revised wave sizing

| wave | plan v2 | now | why |
|---|---|---|---|
| **A — OpenCode** | "can start now" | **M** | stub bin + sibling naming + `win32`→`windows`; carries the traversal fix |
| **B — Claude Code** | vendor artifact | **npm + bridge** | npm works; **no `acp` subcommand** is the real gate |
| **C — Hermes** | installer + UI + assistant | unchanged | routing already built; genuinely `curl \| sh`-only, so §0 applies |
| **D — OpenClaw** | decide identity first | **decided** | build on `openclaw-gateway`; do not add a second id |
| **E — Grok** | last, may not route | **routes; cheap** | env injection only, no connector file needed |
| **0 — Foundation** | 6 items | **+2** | concierge guard signature; back-compat receipt default |

**Sequencing consequence:** Grok moves from "sequence last or cut" to a strong early candidate — it
is the only remaining agent whose Flux routing costs one table entry. Its cost is the install
channel (`curl | sh`-only), not the routing.
