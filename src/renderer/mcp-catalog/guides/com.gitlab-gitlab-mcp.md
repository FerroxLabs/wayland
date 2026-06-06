---
guideVersion: 1.1.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland connects to GitLab's hosted MCP endpoint at
      `https://mcp.gitlab.com` - nothing runs locally. Works against
      gitlab.com out of the box.

      For self-hosted GitLab, override the remote URL from the MCP advanced
      settings page (`Settings → MCP → com.gitlab/gitlab-mcp → Edit
      endpoint`) and point it at `https://<your-gitlab>/api/v4/mcp`.
  - id: authorize
    title: Sign in with GitLab
    estSeconds: 30
    primaryAction: { label: "Sign in with GitLab", action: "oauth-flow" }
    body: |
      Click **Sign in with GitLab** below. A browser tab opens to GitLab's
      OAuth consent screen requesting `api`, `read_user`, and
      `read_repository` scopes.

      1. Sign in if you aren't already, then pick the account whose projects
         you want Wayland to reach.
      2. Review the scope list on the **Authorize Wayland** screen - `api`
         is required for issue and merge-request operations, `read_repository`
         for browsing code.
      3. Click **Authorize**. The tab redirects back to Wayland and the
         server status flips to Running. Tokens live in your OS keychain.

      Prefer a Personal Access Token instead? Open `gitlab.com` → avatar →
      **Edit profile** → left sidebar **Access → Personal access tokens** →
      **Generate token**, tick the same three scopes, and paste the value
      into MCP advanced settings as `GITLAB_TOKEN`.
---

# GitLab setup

GitLab runs the MCP server for gitlab.com. One click and you're connected -
no PAT needed by default. Self-hosted GitLab is supported via the endpoint
override described above.
