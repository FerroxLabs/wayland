---
guideVersion: 1.1.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server (and browsers)
    estSeconds: 60
    autoCompletedByInstall: true
    body: |
      Wayland fetches `@playwright/mcp` from npm via `npx` on first launch.
      The first run downloads the Chromium build Playwright pins (~200 MB to
      `~/Library/Caches/ms-playwright` on macOS or `%LOCALAPPDATA%\\ms-playwright`
      on Windows). Subsequent launches are instant.

      To use a different engine, edit the package args on the Installed page
      and add `--browser firefox`, `--browser webkit`, `--browser chrome`, or
      `--browser msedge`. Firefox and WebKit each download separately the
      first time they're requested. If the install fails (corporate proxy,
      offline), click **Reinstall** here to retry.
---

# Playwright setup

No keys, no consent screen. Playwright drives a real browser through a stable
high-level API - useful when you need to interact with web apps that fight
Chrome DevTools Protocol scraping.

