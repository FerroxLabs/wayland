---
guideVersion: 1.1.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland connects to GitHub's hosted MCP endpoint at
      `https://api.githubcopilot.com/mcp/` — nothing runs locally and there's
      no Docker image to pull. The connection is created automatically when
      you complete sign-in in the next step.

      If you'd rather run the server locally (air-gapped, custom scopes), you
      can swap to the `ghcr.io/github/github-mcp-server` image and a
      `GITHUB_PERSONAL_ACCESS_TOKEN` from MCP advanced settings — but the
      hosted flow is recommended for everyone else.
  - id: authorize
    title: Sign in with GitHub
    estSeconds: 30
    primaryAction: { label: "Sign in with GitHub", action: "oauth-flow" }
    body: |
      GitHub doesn't let apps auto-register, so the first time you click
      **Sign in with GitHub** Wayland opens a dialog for your own OAuth app's
      **Client ID** and **Client Secret**. The dialog walks you through
      creating an OAuth App at **github.com/settings/developers** and shows the
      callback URL to paste in.

      After you save the credentials, Wayland opens a browser tab at
      `github.com/login/oauth/authorize` with the scopes it's requesting
      (typically `repo`, `read:org`, `workflow`):

      1. Pick the GitHub account you want Wayland to act on behalf of.
      2. On the **Authorize** screen, review the scope list. If you're on a
         GitHub org with SSO, click **Configure SSO** and authorize each org
         you need to reach.
      3. Click **Authorize**. The tab redirects back to Wayland and the server
         status flips to Running. Tokens live in your OS keychain.

      Re-run from the Installed page if the token ever expires or you need to
      add new access later.
---

# GitHub setup

GitHub runs the MCP server. One click and you're connected — no PAT, no
local container. The hosted endpoint speaks the full GitHub REST + GraphQL
surface and respects every permission your GitHub account already has.
