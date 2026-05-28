---
guideVersion: 1.1.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland connects to Sourcegraph's hosted MCP endpoint — nothing runs
      locally. Defaults to `sourcegraph.com`; for an enterprise instance,
      override the endpoint URL from MCP advanced settings before signing in.
  - id: authorize
    title: Sign in with Sourcegraph
    estSeconds: 30
    primaryAction: { label: "Sign in with Sourcegraph", action: "oauth-flow" }
    body: |
      Click **Sign in with Sourcegraph** below. A browser tab opens to
      Sourcegraph's OAuth consent screen.

      1. Sign in with the account that has access to the repos you want to
         search. (For private code, this must be an account that's been
         granted repo permissions on your Sourcegraph instance.)
      2. Approve the access request. The default `user:all` scope is
         sufficient for all MCP tools (search, file read, repo metadata).
      3. The tab redirects back to Wayland and the server status flips to
         Running. Tokens live in your OS keychain.

      Prefer a token instead? Open Sourcegraph → click your **avatar** (top
      right) → **Settings** → left sidebar **Access tokens** → **Generate
      new token**, give it a description, leave the default `user:all`
      scope, and paste the value into MCP advanced settings as
      `SRC_ACCESS_TOKEN`.
---

# Sourcegraph setup

Sourcegraph runs the MCP server. Sign in once to authorize access to your
indexed repositories — the server can then run code-search, fetch files,
and resolve symbol definitions across every repo your account can see.
