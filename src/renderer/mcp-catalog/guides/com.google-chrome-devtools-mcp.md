---
guideVersion: 1.1.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches the `chrome-devtools-mcp` npm package on first launch via
      `npx` - nothing to configure. The server drives a real Chrome instance
      over the Chrome DevTools Protocol via Puppeteer, so you need **Google
      Chrome current stable or newer** already installed on your machine
      (download from `https://www.google.com/chrome` if it's missing).

      Chrome opens headed by default so you can watch the agent work; pass
      `--headless` in the package args from the Installed page to suppress the
      window. If the server fails to start, click **Reinstall** on this page
      to re-fetch the package and clear the npx cache.
---

# Chrome DevTools setup

No keys, no consent screen. The server talks to a real Chrome instance via the
DevTools Protocol - useful for live page inspection, network/console capture,
performance traces, and Lighthouse audits.

