# Live-verify: what was done, what is left

Head `bb8e5387f`, pushed. Full suite **16,411 / 16,260 passed / 0 failed**, typecheck clean.

## DONE live, in a running app

Launched packaged-dev on a scratch home (Sean's real config never touched):

```
node scripts/prepareConstitutionFs.js        # else ConstitutionFsBinaryError
node scripts/build-mcp-servers.js            # else MCP crash-loop in a fresh worktree
WAYLAND_HOME=<scratch> WAYLAND_MULTI_INSTANCE=1 WAYLAND_DEV_PROFILE=LV-K05 \
  WAYLAND_DISABLE_AUTO_UPDATE=1 WAYLAND_CDP_PORT=9240 bun run start
```

CDP helper: `scratchpad/cdp.mjs` (import `ws` by ABSOLUTE path — a bare `ws` specifier
does not resolve from the scratchpad).

- **App boots clean on a fresh profile.** Every surface renders with a visible
  background; the 150-class sweep blanked nothing. Screenshot `01-boot.png`.
- **W-D verified by COMPUTED STYLE, not class name** — the standard this milestone
  demands: `bg-1` -> `rgb(34,34,34)`, `bg-2` -> `rgb(42,42,42)`. Those same elements
  carried `bg-bg-1`/`bg-bg-2` before and computed to nothing.

## NOT DONE — needs a configured model

A fresh scratch profile has no API key, and there is **no localStorage seam** to inject
one (checked). The remaining checks all require a real turn, so they need the Settings UI
driven over CDP, or a pre-seeded profile.

Burner key: `~/.config/wayland-smoke/flux-test-key`. **Never print, echo or log it.**
Flux base URL is `https://api.fluxrouter.ai` **without** `/v1` — Core appends it.

Re-check these six, each of which came from a screenshot Sean sent:

1. **Progress + Observability appear for Claude Code and Codex**, not only WCore.
2. **Observability renders ACP content**, not an empty tab.
3. **`Did 1 things` is gone** — a single-step group shows its own label.
4. **No `completed` badge beside "Working through the current task"** on a finished run.
5. **Knowledge no longer lists ToolSearch calls as Sources.**
6. **Numbered Progress steps + the faded empty state** render as intended.

Plus: **the workbench Build/Terminal/Changes lanes populate for an ACP turn.** Proven in
tests against the real adapter chain and measured by probe, never seen in the app.

## Also unproven

**Windows.** K-05 T1 is established against `parseWindowsCliPath` and the `spawn` call
under mocks. Nothing has touched real `CreateProcess`. The bug it fixes is Windows-only.
Box: `ssh -i ~/.ssh/wayland_win seand@100.109.207.54`, PowerShell uses `;` not `&&`,
repo `C:\wl-verify`. Book it before T8.

## Two decisions still Sean's

- **B1 trade:** an installed claude loses `readClaudeProviderEnvFromCcSwitch()` and an
  installed codebuddy loses `--mcp-config ~/.codebuddy/mcp.json`, because the installed
  descriptor now beats the npx bridge. Flux routing is unaffected. Recommendation: keep
  it, port those two onto the generic path in T5.
- **Observability is now gated on having content**, so WCore loses its always-present tab.
