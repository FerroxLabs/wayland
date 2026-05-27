---
guideVersion: 1.0.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
  - id: authorize
    title: Sign in with Notion
    estSeconds: 30
    primaryAction: { label: "Sign in with Notion", action: "oauth-flow" }
---

# Notion setup

Notion hosts the MCP server. Click sign in, pick which pages and databases
Wayland may access, and you're done.

## Step 2 — Sign in

A browser tab opens. Notion will ask you to choose specific pages, databases,
or your whole workspace. Pick the smallest scope that makes sense — you can
always add more later.

Your token lives in your OS keychain. Revoke any time from Notion's connected
apps settings.
