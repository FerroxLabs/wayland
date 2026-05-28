---
guideVersion: 1.1.0
estimatedMinutes: 1
steps:
  - id: install
    title: Connect to the hosted MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Stack Overflow runs the MCP server for you at
      `https://mcp.stackoverflow.com` — there's nothing to install
      locally. Wayland connects over streamable HTTP and signs you in via
      OAuth on the next step, so no API key is required.
  - id: oauth
    title: Sign in with Stack Overflow
    estSeconds: 30
    primaryAction: { label: "Sign in with Stack Overflow", action: "oauth-flow" }
    externalAction: { label: "Create a Stack Overflow account", url: "https://stackoverflow.com/users/signup" }
    body: |
      Click **Sign in with Stack Overflow** below. A browser tab opens to
      the OAuth consent screen at `stackoverflow.com`.

      1. Sign in with your existing Stack Overflow account, or click
         **Create a Stack Overflow account** above first if you don't
         have one (free).
      2. Review the requested permissions — typically read-only access to
         questions, answers, and tags.
      3. Click **Approve** (or **Authorize**). The tab redirects back to
         Wayland and the server status flips to Running.

      The free tier covers normal search workloads. If the auth times
      out or you revoke access from your Stack Overflow profile, click
      Re-authorize on the Installed page to repeat the flow.
---

# Stack Overflow setup

Stack Overflow's official MCP server is hosted at `https://mcp.stackoverflow.com`
and signs you in via OAuth — no API key required.
