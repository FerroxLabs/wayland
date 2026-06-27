# Wayland live-verification suite (`test/live`)

End-to-end checks that run against a **running** Wayland app on **your real
connected profile** (real providers, real auth), driven by Playwright over CDP.
Cross-platform: same suite runs on macOS and Windows — only the launch step and
the CDP URL differ.

> THE RULE: a fix is verified only when an actual **send completes** — never when
> the picker merely shows a model. See `docs/LIVE-TEST-PLAN-0.11.4-*.md` for the
> full matrix this suite implements.

## Why it attaches instead of launching
Playwright's `_electron.launch()` starts a fresh app with an **empty profile and
no provider auth** — it cannot test ChatGPT-subscription, Grok OAuth, Ollama,
etc. So the suite **connects to your already-running app over CDP** and uses your
authenticated session. Launching the app is your job (below).

## 1. Launch the app with remote debugging

**macOS (dev app):**
```bash
cd <repo> && WAYLAND_CDP_PORT=9222 bun run start
```

**Windows (PowerShell — use `;`, not `&&`; dev app):**
```powershell
cd C:\wl-verify; $env:WAYLAND_CDP_PORT=9222; bun run start
```

**Packaged build (either OS, for the representative cut sign-off):**
build the unpacked app (`bunx electron-builder --dir`) and launch it with
`--remote-debugging-port=9222` (and `WAYLAND_MULTI_INSTANCE=1` if your dev app is
also open).

Confirm it's up: open `http://127.0.0.1:9222/json/version`.

## 2. Run the suite

```bash
# install once
bunx playwright install chromium

# default (macOS / port 9222)
bunx playwright test --config test/live/playwright.config.ts

# Windows box on a different port
WAYLAND_CDP_URL=http://127.0.0.1:9340 bunx playwright test --config test/live/playwright.config.ts   # bash
$env:WAYLAND_CDP_URL="http://127.0.0.1:9340"; bunx playwright test --config test/live/playwright.config.ts   # PowerShell

# only Windows-tagged checks
bunx playwright test --config test/live/playwright.config.ts --grep @windows
```

Report: `test/live/.report/index.html`. Failures capture screenshot + video + trace.

## 3. Notes
- **One worker** — the suite drives a single shared renderer page; parallel
  workers would fight over the one composer.
- Tests **skip** (not fail) when a provider/CLI isn't connected on the profile,
  so a partial setup still yields a green-for-what's-present run. Record skips.
- The suite never closes the app (it's yours).
- Env: `WAYLAND_CDP_URL` (default `http://127.0.0.1:9222`).

## 4. Files
- `fixtures/app.ts` — CDP attach + helpers (selectAgent, openModelPicker,
  pickModel, send, expectCompletion, expectNoError).
- `models.live.spec.ts` — P0 Models/Agents (MA-1..MA-14). **Implemented.**
- `mcp.live.spec.ts`, `doctor.live.spec.ts`, `acp.live.spec.ts`,
  `chatux.live.spec.ts`, `misc.live.spec.ts` — P0/P1/P2 scaffolds with `test.fixme`
  placeholders mapped to the plan; fill in next.

## 5. Hardening TODO (do first)
The DOM is matched by text/role today, which is brittle. Add `data-testid`s and
switch the helpers to them: agent pills already expose `data-agent-backend`; add
`data-testid="composer-model-button"`, `data-model-row` on picker rows,
`data-testid="composer-send"`, `data-testid="chat-error"` on the error banner,
and `data-message-role` on rendered turns. One small PR, then the specs stop
depending on copy.
