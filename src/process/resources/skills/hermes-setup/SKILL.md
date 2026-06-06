---
name: hermes-setup
description: 'Install, authenticate, configure, and connect the Hermes Agent CLI (Nous Research) as a Wayland backend. Covers install, the ACP dependency extra, portal and model auth, memory/tools/MCP setup, and doctor diagnostics. Use when a user wants to set up Hermes or fix why its acp backend will not start.'
---

# Hermes Setup Expert

You install, authenticate, configure, and connect the Hermes Agent CLI so Wayland can drive it as a backend over ACP.

## Documentation freshness

Hermes is actively developed and the PyPI build can lag the main branch, so a few command names drift over time (for example, `hermes login` is described as removed in the docs but is still present in recent binaries). The commands here were verified against a real install, but when anything is uncertain, check `hermes --help`, the subcommand `--help`, and the official docs (https://hermes-agent.nousresearch.com/docs/ and the repo https://github.com/NousResearch/hermes-agent). Prefer the latest official source over memory. A version nag at startup is informational, not an error.

## Step 1: Environment diagnostics (run before responding)

Detect state before changing anything. Prefer a login shell (`zsh -i -l -c "..."`) since Wayland may launch with a trimmed PATH.

```bash
which hermes 2>/dev/null || echo "hermes NOT found in PATH"
hermes --version 2>/dev/null
hermes doctor 2>/dev/null || echo "run after install"
hermes acp --check 2>/dev/null || echo "ACP extra likely missing"
python3 --version 2>/dev/null; uv --version 2>/dev/null
```

Interpret: not on PATH means install first. On PATH but `hermes acp --check` fails means the `[acp]` extra is missing (fix before connecting). `hermes doctor` reports health, auth, and dependency problems in one place.

## Install

- **One-liner (recommended).** Bootstraps uv, Python, Node 22, ripgrep, and ffmpeg:
  - macOS/Linux/WSL2/Termux: `curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash`
  - Windows PowerShell: `iex (irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1)`
- **PyPI.** `pip install hermes-agent` then `hermes postinstall` (the bare pip install does NOT bootstrap node/ripgrep/ffmpeg; `postinstall` does). Python 3.11+. Update with `pip install --upgrade hermes-agent`.

Confirm the install with `hermes --version`, then run `hermes doctor`.

## The ACP extra (do this before connecting to Wayland)

`hermes acp` needs the optional `[acp]` dependency extra, which is NOT installed by default.

```bash
hermes acp --check
# If it reports the ACP dependencies are not installed:
pip install 'hermes-agent[acp]'
# For a pipx-managed install, inject into the hermes venv instead:
# pipx inject hermes-agent '<acp extra deps>'   # verify exact form against current docs
```

Re-run `hermes acp --check` until it passes. Without this, the Wayland backend will not start.

## Authenticate

Hermes is OAuth-token based; there is no single API-key environment variable. Pick one path:

- **Fastest:** `hermes setup --portal` (Nous Portal OAuth, also enables the Tool Gateway).
- **Interactive provider/model picker:** `hermes model` (runs OAuth or prompts for a key, then sets the active model).
- **Device-code OAuth:** `hermes login --provider {nous|openai-codex|xai-oauth}` (default `nous`). Present in recent binaries even though the docs call it removed; prefer `hermes setup`/`hermes auth`/`hermes model` in guidance and use `hermes login` as a fallback.
- **Pooled credentials:** `hermes auth add <provider> --api-key <key>` (or `hermes auth add anthropic --type oauth`); manage with `hermes auth list|status|remove|logout`.
- **Env keys** in `~/.hermes/.env`: `OPENROUTER_API_KEY`, `DEEPSEEK_API_KEY`, `XAI_API_KEY`, `GOOGLE_API_KEY`, `KIMI_API_KEY`, `GLM_API_KEY`, `DASHSCOPE_API_KEY`, and others. Have the user paste these into `~/.hermes/.env` themselves; do not echo them.

Auth must be set up before `hermes acp` produces output. Confirm with `hermes auth status` and `hermes doctor`.

## Configure (the bespoke depth)

- **File locations:** secrets in `~/.hermes/.env` (`hermes config env-path`); config in `~/.hermes/config.yaml` (`hermes config path`). Inspect and edit with `hermes config show|edit|set|check|migrate`.
- **Model and fallbacks:** `hermes model` to set the active model; `hermes fallback add|list|remove` to build a fallback chain so the agent degrades gracefully when a provider is down.
- **Memory:** `hermes memory setup` chooses one external provider at a time (honcho, openviking, mem0, hindsight, holographic, retaindb, byterover, supermemory). `hermes memory status|off|reset`. The built-in MEMORY.md and USER.md are always on; external memory is additive and one-at-a-time.
- **Tools:** `hermes tools [list|enable|disable]` to control the 90+ built-in tools.
- **MCP:** `hermes mcp add|list|test|serve` to connect MCP servers (client) or expose Hermes as one (server).
- **Other surfaces (optional):** `hermes cron`, `hermes webhook`, `hermes whatsapp`, `hermes slack`, `hermes gateway install`, `hermes computer-use`, `hermes dashboard` (web UI on port 9119).

Only set up what the user needs. For a Wayland backend, a working provider/model plus the ACP extra is enough; memory/tools/MCP are enhancements.

## Connect to Wayland (ACP)

`hermes acp` is the ACP stdio server Wayland spawns (also exposed as `hermes-acp` or `python -m acp_adapter`). Preconditions: auth configured, and the `[acp]` extra installed (`hermes acp --check` passes).

Useful flags:
- `--accept-hooks` (or `HERMES_ACCEPT_HOOKS=1`): auto-accept hook prompts for headless/embedded use, so a prompt does not hang the spawn.
- `--setup`: run provider/model setup for ACP specifically.
- `--setup-browser`: install the computer-use browser (~400MB), only if the user wants computer-use.

Smoke it by hand: confirm `hermes acp` starts cleanly and waits on stdio without erroring out.

## Verify

- `hermes --version`
- `hermes doctor` (health, auth, dependencies; `hermes doctor --fix` to auto-repair)
- `hermes status`
- `hermes -z "say hello"` (one-shot smoke that the model answers)
- `hermes acp --check` (ACP readiness)

## Top gotchas (in failure-frequency order)

1. `hermes acp` dies without the `[acp]` extra. Pre-flight `hermes acp --check`; install the extra.
2. Auth must be configured before `hermes acp` produces output. Run `hermes setup --portal` (or `hermes model`) first.
3. `hermes login` is described as removed in the docs but is present in the binary. Prefer `hermes setup`/`hermes auth`/`hermes model`; use `login` as a fallback.
4. Headless hook prompts can hang the spawn. Use `--accept-hooks` or `HERMES_ACCEPT_HOOKS=1`.
5. A bare `pip install` skips node/ripgrep/ffmpeg. Run `hermes postinstall`.
6. External memory is one provider at a time, not several.
7. PyPI lags main; a version nag is informational, not a failure.

## Docs

- Repo: https://github.com/NousResearch/hermes-agent
- Docs: https://hermes-agent.nousresearch.com/docs/
- ACP feature doc: https://hermes-agent.nousresearch.com/docs/user-guide/features/acp.md
