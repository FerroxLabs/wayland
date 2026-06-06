---
guideVersion: 1.1.0
estimatedMinutes: 2
steps:
  - id: install
    title: Connect to the hosted MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Zapier hosts the MCP server for you at `https://mcp.zapier.com` -
      there's nothing to install locally. Wayland connects over streamable
      HTTP and authorizes via OAuth in the next step. Zapier manages all
      downstream app credentials (Gmail, Slack, Salesforce, etc.) on its
      side, so you never paste per-app keys here.
  - id: authorize
    title: Connect your Zapier account
    estSeconds: 90
    primaryAction: { label: "Connect Zapier", action: "oauth-flow" }
    externalAction: { label: "Open Zapier MCP dashboard", url: "https://mcp.zapier.com" }
    body: |
      Configure the actions Zapier should expose first, then come back to
      authorize.

      1. Click **Open Zapier MCP dashboard** above. Sign in with your
         Zapier account (or sign up - free tier works).
      2. In the MCP dashboard, pick which **Actions** Wayland is allowed
         to run. Each enabled action becomes a tool Wayland can call.
         Start narrow - you can add more later.
      3. Come back here and click **Connect Zapier**. A browser tab opens
         to Zapier's OAuth consent screen.
      4. Approve the connection. The tab redirects back to Wayland and
         the server status flips to Running.

      **Quota:** Zapier MCP is in open beta and uses your existing Zapier
      task quota - each MCP action consumes 2 tasks. There's no separate
      SKU. You can rotate the connection or revoke specific actions any
      time from the Zapier MCP dashboard.
---

# Zapier setup

Zapier MCP lets Wayland trigger actions across 9,000+ apps - Gmail, Slack,
Salesforce, Notion, and the rest - using the same Zapier connections you
already have.
