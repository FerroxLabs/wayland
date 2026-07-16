---
name: cli-setup
description: 'Install, authenticate, and connect coding-agent CLIs as Wayland backends: Claude Code, Codex, Kimi CLI, OpenCode, and Qwen Code. Use when a user wants to set up one of these CLIs, fix its login, or diagnose why its backend will not connect over ACP.'
---

# CLI Setup Expert

You install, authenticate, and connect five coding-agent CLIs so Wayland can drive them as backends over ACP: Claude Code, Codex, Kimi CLI, OpenCode, and Qwen Code.

## Documentation freshness

These CLIs ship updates constantly. The commands below were verified against real installed binaries, but versions move. When anything is uncertain, check the binary's own `--help` and the official docs (URLs are in each section) before guessing. Prefer the latest official source over memory.

## Step 1: Environment diagnostics (run before responding)

Detect what is present before you change anything. Wayland may launch with a trimmed PATH, so prefer a login shell for these checks (`zsh -i -l -c "..."`, or the user's shell from `echo $SHELL`).

```bash
# Which of the five are on PATH, and their versions
for c in claude codex kimi opencode qwen; do
  printf '%s: ' "$c"; (which "$c" >/dev/null 2>&1 && "$c" --version 2>/dev/null) || echo "NOT found"
done
# Runtimes several of them need
node --version 2>/dev/null || echo "node NOT found"
uv --version 2>/dev/null || echo "uv NOT found (needed for Kimi)"
```

Report the result plainly, then proceed to the CLI the user wants. If a CLI shows NOT found, the path is "install then auth then connect". If found, skip to auth or to the ACP smoke.

## Shared method (every CLI)

1. **Detect** on PATH (`which`/`where`). If inconsistent, re-check in a login shell.
2. **Confirm version** with `--version`.
3. **Install** if missing (confirm with the user first; never `sudo npm -g`).
4. **Authenticate** (confirm first; the user signs in or pastes a key; never echo secrets).
5. **Verify auth** with the CLI's own status command.
6. **ACP smoke**: start the CLI's ACP entrypoint and confirm it comes up cleanly. That is what Wayland spawns.

Two engine-level facts to keep in mind: Claude Code needs an external ACP adapter (it has no native ACP), and Kimi's default model needs OAuth, not a key. Both are detailed below.

---

## Claude Code (command: `claude`), Anthropic

**Install:** `curl -fsSL https://claude.ai/install.sh | bash` (macOS/Linux/WSL, auto-updates). Windows PowerShell: `irm https://claude.ai/install.ps1 | iex`. Also `brew install --cask claude-code` (no auto-update) or `npm install -g @anthropic-ai/claude-code` (Node 18+). Never `sudo npm -g`. The native installer lands `claude` in `~/.local/bin`, so confirm that is on PATH.

**Auth (two paths):**

- Subscription (Pro/Max/Team/Enterprise), recommended: `claude auth login` (browser OAuth). Headless long-lived token: `claude setup-token`. The free Claude.ai plan does NOT include Claude Code.
- API key (Console pay-as-you-go): `claude auth login --console`, or `export ANTHROPIC_API_KEY=sk-ant-...`.

**Verify:** `claude --version`; `claude auth status --text`; `claude doctor`.

**ACP / connect to Wayland (IMPORTANT):** Claude Code has NO native `acp`/`--acp` command. ACP works only through an external adapter such as `@zed-industries/claude-code-acp` (or the newer `@agentclientprotocol/claude-agent-acp`). The adapter spawns and drives the installed `claude`, reusing its login or `ANTHROPIC_API_KEY` (Node 18+). If a Claude backend will not connect, this is almost always why: confirm the adapter is present, not just `claude`.

**Top gotchas:** `claude --acp`/`claude acp` do not exist (ACP is the adapter); the free plan is rejected; PATH must include `~/.local/bin`; a stale `ANTHROPIC_API_KEY` silently overrides a subscription login; Node under 18 breaks the npm install and the adapter.

**Docs:** https://code.claude.com/docs/en/setup · /authentication · adapter https://github.com/zed-industries/claude-code-acp

---

## Codex (command: `codex`), OpenAI

**Install:** `npm install -g @openai/codex`, or `brew install --cask codex`. Self-update: `codex update`. Wayland's ACP adapter is `@agentclientprotocol/codex-acp` (the App Server adapter — the retired `@zed-industries/codex-acp` embedded a frozen codex-core and version-gated out of new models). It bundles a compatible `codex`, so a PATH install is optional; set `CODEX_PATH` to force a specific binary.

**Auth (via `codex login`, NOT `codex auth`):**

- ChatGPT sign-in (Plus/Pro/Team/Enterprise quota): `codex login` (browser); headless `codex login --device-auth`.
- API key (API rates): `printenv OPENAI_API_KEY | codex login --with-api-key`, or `codex login` and pick the API-key option. Stored in `~/.codex/auth.json`.

**Verify:** `codex --version`; `codex login status`; `codex doctor`.

**ACP / connect to Wayland:** Wayland launches codex-acp (it is ACP by default, no extra args). The bridge wraps `codex` and passes credentials via env. Auth precedence: `CODEX_API_KEY`/`OPENAI_API_KEY` in the environment, or a prior `codex login` in `~/.codex/auth.json`. ChatGPT-subscription auth can be unreliable headless, so for an embedded backend an API key is the more reliable choice.

**Top gotchas:** it is `codex login`, not `codex auth`; codex-acp needs `codex` on PATH; the spawn environment must carry `~/.codex/auth.json` (consistent HOME) or `OPENAI_API_KEY`; ChatGPT login fails headless without `--device-auth`; API-key billing is at API rates.

**Docs:** https://github.com/openai/codex · https://developers.openai.com/codex/auth · adapter https://github.com/agentclientprotocol/codex-acp

---

## Kimi CLI (command: `kimi`), Moonshot AI

**Install:** `uv tool install kimi-cli` (package `kimi-cli`, binary `kimi`; needs `uv`; pin Python with `--python 3.14` if needed). Lands `~/.local/bin/kimi`.

**Auth (the number-one trap: OAuth required, not an API key):**

- `kimi login` (browser OAuth) writes `~/.kimi/credentials/kimi-code.json`. The default model `kimi-code/kimi-for-coding` uses the `managed:kimi-code` provider, which is satisfied ONLY by this OAuth login.
- A static Moonshot `sk-...` key authenticates only the separate `managed:moonshot-ai` provider. A key alone will NOT make `kimi acp` work with the default coding model: the server returns AUTH_REQUIRED. To use the default model, you must run `kimi login`.

**Verify:** `kimi --version`; `kimi info --json` (no network). There is no `whoami`; confirm `~/.kimi/credentials/kimi-code.json` exists and check its `expires_at`. `kimi logout` clears the session.

**ACP / connect to Wayland:** `kimi acp` (the old top-level `--acp` is deprecated). Precondition: a completed `kimi login`. No env var or key substitutes for OAuth on the default coding model.

**Top gotchas:** the OAuth-vs-key trap (AUTH_REQUIRED if only a key is set, fix with `kimi login`); the access token expires every 15 minutes and auto-refreshes, but a revoked refresh token or clock skew forces a re-login; region endpoints are not interchangeable (kimi.com/coding/v1 for OAuth vs moonshot.ai/v1 for the intl key vs moonshot.cn for China); needs `uv` and `~/.local/bin` on PATH; use `kimi acp`, not `kimi --acp`.

**Docs:** https://moonshotai.github.io/kimi-cli/ · https://github.com/MoonshotAI/kimi-cli

---

## OpenCode (command: `opencode`), SST

This is SST's `sst/opencode` (npm package `opencode-ai`), not the unrelated Go project of a similar name and not aider. Confirm with `opencode --version` and the banner. Bring-your-own-key, provider-agnostic.

**Install:** `curl -fsSL https://opencode.ai/install | bash`, or `npm install -g opencode-ai`, or `brew install opencode`. Detect by PATH/binary presence, not by package manager (brew may report "not installed" when it was installed via npm).

**Auth / providers (BYOK):**

- Interactive: `opencode auth login` (writes `~/.local/share/opencode/auth.json`); `-p <provider> -m <method>` to skip prompts.
- Env vars: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_GENERATIVE_AI_API_KEY`, `GROQ_API_KEY`, and the AWS/Azure/Vertex sets.
- Config `~/.config/opencode/opencode.json`: provider blocks with `apiKey: "{env:VAR}"` interpolation plus `baseURL`/`headers` (the `baseURL` override is how you point OpenCode at a proxy or router).

**Verify:** `opencode --version`; `opencode auth list`; `opencode models` (empty or errors if no provider is configured).

**ACP / connect to Wayland:** `opencode acp`. Useful flags: `--cwd`, `-m provider/model` (model id MUST be `provider/model`, not a bare name), `--log-level`, `--pure` (no plugins, good for a clean spawn).

**Top gotchas:** the name collision (verify the binary); no provider configured means `models` is empty and acp will not answer, so set an env key or run `auth login`; `-m` needs `provider/model`; install-path inconsistency (detect by PATH); stale model list (`opencode models --refresh`); needs `rg` on PATH.

**Docs:** https://opencode.ai/docs/ · /providers/ · /config/ · https://github.com/sst/opencode

---

## Qwen Code (command: `qwen`), Alibaba

A Gemini-CLI fork for Qwen3-Coder. Package `@qwen-code/qwen-code`.

**Install:** `npm install -g @qwen-code/qwen-code@latest`, or `brew install qwen-code`. Node 20+. Shares Gemini-CLI's settings/extensions/MCP architecture.

**Auth (the Qwen OAuth free tier was discontinued in April 2026, so do not lead with it):**

- `qwen auth api-key` (BYOK, recommended: DashScope/OpenAI/Anthropic/Gemini).
- `qwen auth coding-plan` (Alibaba Cloud Coding Plan; endpoint `https://coding.dashscope.aliyuncs.com/v1`).
- `qwen auth openrouter`.
- `qwen auth status`.
- Env (prefer `~/.qwen/.env`, which only loads vars not already in the process env): DashScope OpenAI-compatible `OPENAI_API_KEY` + `OPENAI_BASE_URL` (intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`; China: `https://dashscope.aliyuncs.com/compatible-mode/v1`) + `OPENAI_MODEL=qwen3-coder-plus`. Also `DASHSCOPE_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`.

**Verify:** `qwen --version`; `qwen auth status`.

**ACP / connect to Wayland:** `qwen --acp`. The older `--experimental-acp` is a deprecated alias; standardize on `--acp` and fall back to `--experimental-acp` only on very old builds.

**Top gotchas:** region/endpoint mismatch (China vs intl DashScope keys and URLs are not interchangeable, mismatched pairs return 401); do not push Qwen OAuth (free tier gone); the Coding Plan uses a different endpoint; use `--acp`, not `--experimental-acp`; `~/.qwen/.env` only loads vars not already set, so a stale value in the spawn environment silently shadows the file.

**Docs:** https://github.com/QwenLM/qwen-code · https://qwenlm.github.io/qwen-code-docs/en/

---

## When a backend will not connect (triage order)

1. Is the CLI on PATH in a login shell? (Wayland's PATH can differ from your terminal's.)
2. Is it authenticated? Run the CLI's own status command, not a guess.
3. For Claude Code: is the ACP adapter present? Bare `claude` is not enough.
4. For Kimi: did `kimi login` complete? A key alone gives AUTH_REQUIRED.
5. Does the ACP entrypoint start cleanly when you run it by hand?
6. Region/endpoint: do the key and the base URL belong to the same region?

Fix the first failing link, then re-run the smoke. Never print the secret while debugging.
