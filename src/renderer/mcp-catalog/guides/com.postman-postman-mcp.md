---
guideVersion: 1.1.0
estimatedMinutes: 3
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland runs `@postman/postman-mcp-server` from npm via `npx` on first
      launch - no manual install. The server starts in `--minimal` profile
      (37 essential tools) by default; switch profiles by editing
      `args` on the Installed page.
  - id: api-key
    title: Paste your Postman API key
    estSeconds: 120
    externalAction: { label: "Open Postman API keys", url: "https://go.postman.co/settings/me/api-keys" }
    inputs:
      - { name: POSTMAN_API_KEY, label: "Postman API key", secret: true }
    warning: |
      Postman API keys inherit **your full account permissions** - they
      cannot be scoped to specific workspaces. Create a separate key per
      tool and rotate immediately if leaked.
    body: |
      1. Click **Open Postman API keys** above. The path is **postman.co →
         Avatar (bottom-left) → Settings → API keys**.
      2. Click **Generate API Key**.
      3. Name it (e.g. *Wayland Desktop*), pick an **expiration** window
         (60 / 90 days recommended), and click **Generate**.
      4. Copy the `PMAK-...` value and paste it above. The key is shown
         once - you can't view it again after closing the modal.

      Default profile is `--minimal` (37 tools across Workspaces,
      Collections, Environments, APIs). To change:

      - `--full` - 100+ tools including Mock servers, Monitors, SCIM.
      - `--code` - code-generation focus (snippets, SDK gen).
      - Add `--region eu` if your team is on Postman EU.
---

# Postman setup

Postman ships an official MCP server on npm as `@postman/postman-mcp-server`.
Wayland runs it via `npx` with stdio transport and authenticates with a
personal API key.
