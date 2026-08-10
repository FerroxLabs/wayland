# Agent installers — positioning and policy (2026-08-10)

Sean's framing, which corrects an earlier draft of this note: **Wayland is not a
rival to OpenClaw or Hermes. It is the layer above them.** One ring to rule them
all — the desktop that sits on top of everything and makes it actually work.

That distinction settles the question that prompted this note ("are we
cannibalising ourselves by installing competitors?"). **No.** OpenClaw is a thing
you run; Wayland is the thing that runs things. Every agent Wayland installs and
connects well makes the claim MORE true, not less. The cannibalisation risk is
the opposite one: trying to beat OpenClaw at being OpenClaw.

---

## 1. What we are actually up against

| | Scale | What it is |
|---|---|---|
| `openclaw/openclaw` | **385,769 stars** | "Your own personal AI assistant. Any OS. Any Platform." |
| `VoltAgent/awesome-openclaw-skills` | 51,868 stars | **5,400+ community skills** |
| `hesamsheikh/awesome-openclaw-usecases` | 31,669 stars | community use-case collection |
| `xai-org/grok-build` | 24,577 stars | xAI's coding agent harness + TUI |
| `MoonshotAI/kimi-cli` / `kimi-code` | 11,151 / 6,269 | Kimi Code (see §4) |

OpenClaw started the agentic hype cycle and has an enormous head start. That head
start is not closable by building harder, and we should stop framing anything as
if it were.

**But their ecosystem is simultaneously their moat and their liability.** 5,400+
community skills are unvetted, unsigned, executable code. We already own the
answer to that and barely say it out loud:

- `src/process/services/skills/SkillGuard.ts` + `skillGuardLlmCall.ts`
- `skillContentHash.ts` (content-addressed skill identity)
- quarantine surfaced in the skills UI (`SkillDetailDrawer`, `SkillRow`)
- the whole `constitution/` authority tree, trust roots, `bridgeAllowlist`

**The play is not 5,401 skills. It is their skills, governed.** Inheriting the
ecosystem beats rebuilding it, and governance is the thing community OSS
structurally cannot ship.

## 2. The three moats, in order

1. **The layer.** One desktop, every agent, one place where work actually
   happens. Nobody else is building this; everyone else is building an agent.
2. **Flux.** One key, everything connected. Community OSS has no billing
   relationship and therefore cannot follow us here.
3. **Governance.** Safe by default — skill guard, quarantine, constitution
   authority, per-provider consent. This is what "a secure answer to Hermes and
   OpenClaw" actually means, and it is currently under-marketed.

Wayland Clawd / Wayland Nano are **the default agent for someone with no
opinion**. They are not the moat. Treating them as the moat is what would put us
on a shelf next to seventeen alternatives.

## 3. Install policy, driven by `fluxCompat`

`acpTypes.ts` already encodes the economics on every backend:

- **`env`** — routes through Flux now: `claude`, `qwen`, `goose`
- **`setup`** — routes once the setup assistant writes config: `codex`,
  `opencode`, `hermes`, `qoder`
- **`vendor`** — locked to its own service, **earns Flux nothing**: `grok`,
  `auggie`, `droid`, `copilot`, `cursor`, `vibe`, `kiro`
- unset — no compatibility claimed: `kimi`, `codebuddy`, `snow`, `custom`

**Policy:** invest install effort in `env`/`setup` first. Be *compatible* with
`vendor` agents but build their channels last — they cost the most and return no
revenue. Breadth still matters for the pitch, so `vendor` is "later", not "never".

## 4. The six, with evidence

| # | Agent | Flux | Channel | Mechanic |
|---|---|---|---|---|
| 1 | **Claude Code** | `env` | npm, **postinstall required** | tarball + checksum |
| 2 | **Codex** | `setup` | already `npx @openai/codex` | config only, no install |
| 3 | **Kimi Code** | unset — **check it** | `@moonshot-ai/kimi-code@0.34.0`, **no postinstall** | npm, clean |
| 4 | **OpenCode** | `setup` | npm, postinstall required | tarball + checksum |
| 5 | **Goose** | `env` | GitHub / Homebrew | tarball + checksum |
| 6 | **Grok Build** | `vendor` | `curl https://x.ai/cli/install.sh \| bash` | see §5 — do LAST |

**Dropped:** Gemini (we already supply a Gemini agent), Qwen (low real-world
usage per Sean), auggie (`authMethods: []`, needs `auggie login` in a terminal —
can never satisfy "and a chat runs on it"), Copilot (`vendor`, 339 MB unpacked,
GitHub OAuth only).

### Kimi Code supersedes Kimi CLI — verified three ways
- the local binary's own help: *"Run **kimi-code** as an Agent Client Protocol
  (ACP) server over stdio"*, and it answers `kimi acp`, matching our declared
  `acpArgs: ['acp']`
- PyPI `kimi-cli` 1.49.0 describes itself as *"**Kimi Code** CLI"*
- `MoonshotAI/kimi-code` created 2026-05-22, pushed 2026-08-10; `kimi-cli`
  created 2025-10-15. Newer repo, more active. Neither archived.

**Two open defects this turned up:** `acpTypes.ts:465` still labels it
`name: 'Kimi CLI'` (stale product name, user-visible), and `kimi` has **no
`fluxCompat`** — if Kimi Code is OpenAI-compatible it should be `env`/`setup`,
which would make it earn.

### ⚠️ Package identity — three traps, all confirmed live
- npm **`kimi-cli`** = *"Quickly generate the project's front-end tools"* —
  completely unrelated package.
- npm **`kimi-code`** and npm **`grok-cli`** are both by publisher
  `whitesmith`, both *"starts anthropic-proxy with … and runs claude-code"* —
  third-party proxy wrappers, not the products. A pattern, not a coincidence.
- npm **`hermes-agent`** = ***unofficial*** bridge, and it has a `postinstall`.

**Never pin by plausible name. Resolve the vendor's own channel first.**

## 5. The Grok Build curl exception

Sean asked whether a `curl | bash` installer can be allowed on a trusted path.
Inspected without executing: 17,003 bytes, sha256
`0465d810453bbf18608ccae310fa79f4c59ae4a0538bd8a3a374ebce749be952`. It accepts a
pinned version (`bash -s 0.1.42`). It performs **no checksum verification of
anything it downloads** — TLS is the only integrity guarantee.

So "trusted path" is not a property that exists here. Make it safe by not needing
to trust it:

1. **Pin the script** by sha256; re-fetch, compare, refuse on mismatch. Now we
   execute a known artifact rather than a stream.
2. **Sandbox it** — `HOME`, `USERPROFILE`, `TMPDIR`, `PATH` into our staging
   root. The plan already does exactly this for bun (it is the executed fix for
   `.npmrc` registry redirection).
3. **Pin the result** — hash the binary it produced into our manifest. First
   install is trust-on-first-use; every install after is verified.
4. **Tell the truth in the consent step** — name that xAI ships no checksum.

Stronger than `curl | bash`, and honest about where the trust actually sits.
Still last in the queue: `vendor`, so highest cost and no Flux revenue.

## 6. Auth model — and the one hard boundary

Three modes, already modelled by `fluxCompat`:

1. **Flux key** — the default. One key, everything connected, no choice shown.
2. **User's own API key** — same env-injection mechanism, one click away.
3. **Vendor subscription** — the agent's own login, untouched by us.

**Hard boundary: never build Claude Pro/Max subscription OAuth. Anthropic ToS.**
A Max subscriber cannot be routed through Flux or anything else; they use Claude
Code's own login. ChatGPT-sub OAuth **is** allowed. Product copy must not promise
otherwise.

Emphasis matters: **Flux by default, BYO as the escape hatch — never the
reverse.** Defaulting to a menu of eighteen agents is the exact friction the
north star exists to kill.

---

## 7. What this does NOT change

K-05's plan (`.planning/K-05-INSTALLER-PLAN.md`) stays the authority for HOW to
install. T1 remains the gate on any ordering — `parseWindowsCliPath` keeps only
the first quoted token, so `C:\Program Files\Wayland` breaks every spawn until it
is fixed. The security constraints stand: pinned version, verified checksum,
explicit per-install consent, uninstall by MANIFEST never by name, Windows
first-class.

**Open decision for Sean:** four of the six need the direct-tarball mechanic that
currently sits in K-06, after the npm subset he approved. Building K-05 as
written ships an installer whose agents are qwen, gemini and auggie — none of
which are on the list above.

---

# ADDENDUM — corrections and the next-session workflow

Four things in §4 above were wrong. Corrected here by execution, not by review.

## C1 — Codex IS installable, and easily. (was: "config only, no install")

`@openai/codex@0.147.0`: **`scripts: []`** — no postinstall at all — zero
dependencies, six platform optionalDeps in the clean pattern. It is one of the
EASIEST installs on the list, not an exception to it.

The confusion was mine: what `acpTypes.ts:395` npx-es is
`@agentclientprotocol/codex-acp`, the **ACP bridge**, which is a different
package from Codex itself. And `npx` is worse than installing by our own
standards — no version pin, network required at launch, code executed without
pre-verification. **Install Codex properly.**

## C2 — OpenClaw is CHANNEL BREADTH, not skills. (Sean's correction, confirmed)

npm `openclaw@2026.7.1-2`, described by its own authors as
*"Multi-channel AI gateway with extensible messaging integrations."* Bin
`openclaw`, scripts are dev/tui/lint/test — **no postinstall**, installs clean.

The earlier "their moat is 5,400 skills" framing was wrong. Skills are an
adjacent ecosystem; the product is channel reach. We already ship ~2,100 skills
of our own, so skills were never the gap.

## C3 — Hermes is NOT channel-blocked; it is CAPABILITIES.

Official **PyPI `hermes-agent@0.19.0`** from `NousResearch/hermes-agent`
(**228,272 stars**) — "self-improving agent, creates skills from experience,
persistent memory, MCP client AND server, cron, webhooks, computer-use".

The npm `hermes-agent` I flagged as blocking is an unofficial third-party bridge
(`wyrtensi/hermes-agent-npm`). Ignore it; use PyPI. **We already have a
`hermes-setup` assistant persona** at
`src/process/resources/assistant/hermes-setup/hermes-setup.md`.

## C4 — We ALREADY have ChatGPT and Grok OAuth. (Sean's correction)

- `src/process/onboarding/chatgptOAuth.ts` — `chatgptOAuthLogin`,
  `chatgptRefreshToken`, wired in `authBridge.ts` (both remote-denied)
- `chatgpt-subscription` provider + `chatgptSubscriptionModels.ts` catalog
- `ChatGptButton.tsx` and `XGrokButton.tsx` in Models settings

**Keep the two layers distinct:**
- **Provider-level OAuth** (exists): logs *Wayland* into ChatGPT/Grok so
  Wayland's own chat uses those models on the user's subscription.
- **Agent-level login** (the better shape for installed agents): the agent runs
  its OWN `codex login` / `claude login` / `grok login` in our PTY.

They are not redundant and neither replaces the other.

## Revised install matrix — eight agents, four mechanics

| Mechanic | Agents | Note |
|---|---|---|
| **A** npm + `--ignore-scripts` | **Codex, Kimi Code, OpenClaw** | all three verified postinstall-free |
| **B** tarball + pinned checksum | Claude Code, OpenCode, Goose | postinstall required / non-npm |
| **C** PyPI + uv | Hermes | official channel |
| **D** sandboxed vendor script | Grok Build | `vendor`, earns no Flux — build LAST |

## Auth design — host it, never implement it

`node-pty` already exists (`src/process/terminal/terminalBridge.ts`,
`terminalRegistry.ts`), so interactive vendor logins can run INSIDE Wayland. The
user never drops to a shell, which is the friction the north star exists to kill.

1. **Host, don't implement.** The agent runs its own login flow in our PTY.
2. **Never intercept or store.** It writes its own config/keychain; we do not
   read, proxy, or cache it.
3. **Detect and display the mode** — Flux / own API key / vendor subscription —
   so the user always knows where their money goes.

**The ToS line that must never blur:** Wayland implementing Anthropic
subscription OAuth is a hard no. Claude Code running its own `claude login`
inside our terminal is fine. We are the window, not the broker.

**Economics are not either/or.** A user can be on Claude Max for Claude Code AND
Flux for the other seven. Every installed agent is a fresh chance for Flux to be
the default on that one, and a subscription user who STAYS is worth far more than
one who leaves.

---

# NEXT SESSION — run this as a workflow

**Do not re-research any of the above.** Channels, package identity, postinstall
status, OAuth surfaces and the Grok script hash are all established by execution
and recorded here.

**Phase 0 — gate (serial, alone).** K-05 **T1**: the structured launch command.
`parseWindowsCliPath` keeps only the first quoted token, so
`C:\Program Files\Wayland` breaks every spawn until this lands. Nothing
parallelises before it.

**Phase 1 — Mechanic A (parallel, 3 agents).** Codex, Kimi Code, OpenClaw. All
npm, all verified postinstall-free, so one code path covers three agents. This is
the cheapest real proof that install→detect→connect works end to end.

**Phase 2 — Mechanic B (serial per agent).** Claude Code first (marquee), then
OpenCode, then Goose. Direct tarball, pinned checksum, manual bin placement.

**Phase 3 — Mechanic C.** Hermes via PyPI/uv. Reuse the existing `hermes-setup`
assistant rather than writing new setup UX.

**Phase 4 — Mechanic D.** Grok Build: pin the script
(`0465d810453bbf18608ccae310fa79f4c59ae4a0538bd8a3a374ebce749be952`), sandbox
`HOME`/`TMPDIR`/`PATH` into staging, hash the resulting binary into the manifest,
and say plainly in the consent step that xAI ships no checksum.

**Phase 5 — auth surfacing.** Per-agent login through the existing PTY, plus the
mode indicator. No new OAuth is written.

**Two one-line fixes to land whenever:** `acpTypes.ts:465` still says
`name: 'Kimi CLI'` (product is now Kimi Code), and `kimi` has no `fluxCompat`
despite likely being OpenAI-compatible — currently marked as earning nothing.

**Still Sean's call:** Phase 1 as written departs from the approved K-05 order
(qwen first, then gemini, auggie). Sean has since cut gemini (we supply our own)
and qwen (low real usage), so the approved order now ships an installer for
agents he does not want.
