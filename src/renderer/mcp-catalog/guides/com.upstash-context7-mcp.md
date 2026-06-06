---
guideVersion: 1.1.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `@upstash/context7-mcp` from npm via `npx` on first
      launch - no manual install needed. Context7 indexes up-to-date docs
      for thousands of libraries (React, Next.js, Prisma, FastAPI, etc.) so
      agents can pull the right snippet instead of guessing from training
      data.

      The free public tier works **without an API key** - skip Step 2 if
      you only need light use.
  - id: api-key
    title: (Optional) Paste a Context7 API key for higher limits
    estSeconds: 30
    externalAction: { label: "Get a Context7 API key", url: "https://context7.com/dashboard" }
    body: |
      A free key raises the per-IP rate limit. Recommended if you run
      Wayland behind a shared egress IP (corporate VPN, office NAT) or rely
      on Context7 in a long-running agent loop.

      1. Click **Get a Context7 API key** above. Sign in with GitHub or
         Google.
      2. On the **Dashboard** page, click **Create API Key** (or copy the
         default key that's already provisioned for your account).
      3. Paste the value into MCP advanced settings as `CONTEXT7_API_KEY`.

      Restart the server from the Installed page after pasting - Wayland
      reads the env var at process start.
---

# Context7 setup

Context7 is free for low-volume use - no key required. For higher rate
limits or org accounts, sign up at `context7.com/dashboard` and add your
key when prompted.
