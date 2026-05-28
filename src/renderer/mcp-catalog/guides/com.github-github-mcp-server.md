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
      Click **Sign in with GitHub** below. A browser tab opens at
      `github.com/login/oauth/authorize` showing the scopes Wayland is asking
      for (typically `repo`, `read:org`, `read:packages` for full tool
      coverage).

      1. Pick the GitHub account you want Wayland to act on behalf of.
      2. On the **Authorize** screen, review the scope list. If you're on a
         GitHub org with SSO, click **Configure SSO** and authorize each org
         you need to reach.
      3. To restrict access to a single repo, use **Resource Owner → Only
         select repositories** before approving.
      4. Click **Authorize**. The tab redirects back to Wayland and the server
         status flips to Running. Tokens live in your OS keychain.

      Re-run from the Installed page if the token ever expires or you need to
      add new repo access later.
---

# GitHub setup

GitHub runs the MCP server. One click and you're connected — no PAT, no
local container. The hosted endpoint speaks the full GitHub REST + GraphQL
surface and respects every permission your GitHub account already has.
