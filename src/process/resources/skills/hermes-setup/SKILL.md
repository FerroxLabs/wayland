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

## Python prerequisite (check FIRST — it decides the route)

Hermes is a Python application. It requires **Python >=3.11 and <3.14**. Both ends bite: 3.10 is too old and **3.14 is too new**, so a very new system Python fails as hard as an old one. `python3 --version` before anything else.

## Install

- **PyPI — preferred.** `pip install 'hermes-agent[acp]'` installs the CLI and the ACP extra together, skipping the most common failure mode outright. Pin the version for reproducibility: `pip install 'hermes-agent[acp]==<version>'`. If installing bare (`pip install hermes-agent`), follow with `hermes postinstall` — the bare install does NOT bootstrap node/ripgrep/ffmpeg. Update with `pip install --upgrade hermes-agent`.
- **Vendor bootstrap script.** Bootstraps uv, a private Python, Node 22, ripgrep and ffmpeg — the right answer when there is no usable system Python.
  - macOS/Linux/WSL2/Termux: `curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash`
  - Windows PowerShell: `iex (irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1)`
  - ⚠️ Be honest with the user about the trade: this script clones the project's **main branch** and installs from it, so it is not a pinned release and two people running it a week apart get different code. Convenience over reproducibility. It accepts `--commit <SHA>` to pin the checkout.
- **Homebrew.** `brew install hermes-agent` — Homebrew's formula, not a Nous-published artifact. Convenient on macOS; check the Python it pulls is inside 3.11–3.13.

🚫 **Never install the npm package named after Hermes.** It is published by an unaffiliated third party, not Nous Research. The genuine channels are PyPI `hermes-agent` (published by Nous Research through a GitHub Trusted Publisher workflow), the vendor script above, and Homebrew. If a user already has the npm one, explain what it is and move them to PyPI.

Confirm the install with `hermes --version`, then run `hermes doctor`.

**Expect PyPI to trail GitHub.** The newest tagged release is routinely not yet installable from PyPI. That is normal, not a broken install — do not chase it.

## The ACP extra (do this before connecting to Wayland)

`hermes acp` needs the optional `[acp]` dependency extra, which is NOT installed by default.

```bash
hermes acp --check
# If it reports the ACP dependencies are not installed:
pip install 'hermes-agent[acp]'
# For a pipx-managed install, inject into the hermes venv instead:
# pipx inject hermes-agent agent-client-protocol
```

The extra resolves to a single pinned dependency (`agent-client-protocol`), so this is a small, fast, reproducible install — not a large re-resolve.

⚠️ **Do not copy the command Hermes itself prints here.** Verified on a clean box: the failure message says `Install them with: pip install -e '.[acp]'`. That is the EDITABLE, repo-relative form — it only works from a git checkout of hermes-agent and fails for anyone who installed from PyPI, which is nearly everyone. Give them `pip install 'hermes-agent[acp]'` instead.

Re-run `hermes acp --check` until it passes. Without this, the Wayland backend will not start.

Hermes exposes the ACP server three equivalent ways: the `hermes acp` subcommand, a standalone `hermes-acp` binary, and `python -m acp_adapter`. Wayland spawns `hermes acp`.

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

## Routing through Flux (automatic — do not configure it by hand)

If the user has Flux connected, Wayland routes Hermes through it **with no setup step**, and you should not offer one.

The mechanism matters, because "Wayland is rewriting my agent's config" is a fair thing to worry about and it is not what happens. Wayland materializes its OWN Hermes home in app data, writes a `config.yaml` there pointing at the Flux endpoint, and sets `HERMES_HOME` to it for that spawn only. The user's `~/.hermes` — their keys, memory, model choice, tools — is never opened for writing. Hermes run from their own terminal is completely unaffected, and removing Flux strands nothing.

So: never edit the user's `~/.hermes/config.yaml` to point at Flux, and never tell them they need to. If Flux is not connected, Hermes simply uses the provider and model they configured.

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
8. Python outside 3.11–3.13 fails the install. Check the CEILING too — a brand-new 3.14 is as broken as an old 3.10, and it is the less obvious of the two.
9. The npm package named after Hermes is third-party, not Nous Research. Do not install it; move users off it.

## Docs

- Repo: https://github.com/NousResearch/hermes-agent
- Docs: https://hermes-agent.nousresearch.com/docs/
- ACP feature doc: https://hermes-agent.nousresearch.com/docs/user-guide/features/acp.md
