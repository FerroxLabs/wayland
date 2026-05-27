---
guideVersion: 1.0.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
  - id: authorize
    title: Sign in with Slack
    estSeconds: 30
    primaryAction: { label: "Sign in with Slack", action: "oauth-flow" }
---

# Slack setup

Slack runs a hosted MCP. You only need to authorize once — there's no app to
install or configuration to fill out.

## Step 2 — Sign in

Click **Sign in with Slack**. A browser tab opens for OAuth. Pick the workspace
you want Wayland to access, review the requested scopes, and approve.

The token is stored in your local OS keychain. You can revoke access at any
time from your Slack workspace's connected apps page.
