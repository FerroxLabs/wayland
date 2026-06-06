---
guideVersion: 1.1.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Doist hosts the MCP server at `https://mcp.todoist.com` - nothing to
      install. Wayland connects via streamable HTTP on first use.
  - id: authorize
    title: Sign in with Todoist
    estSeconds: 30
    primaryAction: { label: "Sign in with Todoist", action: "oauth-flow" }
    body: |
      Click **Sign in with Todoist** below. A browser tab opens at Todoist's
      OAuth consent screen.

      1. Sign in to Todoist if you aren't already.
      2. Approve the **data:read_write** scope - this lets Wayland read and
         modify your tasks, projects, labels, and filters.
      3. The tab redirects back to Wayland and the server status flips
         to Running.

      **Prefer a personal API token instead?** You can grab one at
      **Avatar → Settings → Integrations → Developer → Copy API token**,
      but the hosted MCP flow above is the recommended path for Wayland.
---

# Todoist setup

Doist runs the MCP server - one click and you're connected. Wayland reads
and writes your tasks, projects, labels, and filters using the standard
Todoist OAuth scopes.
