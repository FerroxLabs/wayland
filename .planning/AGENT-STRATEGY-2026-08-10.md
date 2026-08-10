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
