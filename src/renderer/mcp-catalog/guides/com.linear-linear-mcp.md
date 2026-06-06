---
guideVersion: 1.1.0
estimatedMinutes: 3
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      No local install needed. Linear hosts the MCP server at
      `https://mcp.linear.app/mcp` - Wayland connects over streamable HTTP
      the moment you finish the sign-in step below.
  - id: authorize
    title: Sign in with Linear
    estSeconds: 60
    primaryAction: { label: "Sign in with Linear", action: "oauth-flow" }
    warning: |
      Linear had a bug where MCP OAuth sessions could disconnect after about
      24 hours. It's resolved in current builds, but if Wayland stops
      returning issues a day after first auth, click **Re-authorize** on the
      Installed page.
    body: |
      Click **Sign in with Linear** below. A browser tab opens at
      `linear.app` - Linear uses **OAuth 2.1 with dynamic client
      registration**, so there's nothing to pre-configure on their side.

      1. Pick the workspace you want Wayland to act on. If you belong to
         several, the dropdown is at the top-right of the consent screen.
      2. Review the scopes - by default Wayland requests **read** (issues,
         projects, cycles), **write** (update issues), and
         **issues:create**. Anything you can't see in Linear, the MCP can't
         see either.
      3. Click **Authorize**. The tab redirects back to Wayland and the
         server status flips to Running.

      Tokens are stored in your OS keychain and never leave your machine.
  - id: verify
    title: Verify the connection
    estSeconds: 30
    body: |
      Open a new chat and ask: *"List my assigned Linear issues this
      cycle."* Wayland will call the MCP and stream the results back.

      If you'd rather use a long-lived Personal API key (e.g. for headless
      / CI use), open `linear.app/settings/api` → **Personal API keys** →
      **Create new key**, copy the `lin_api_…` token, and paste it into
      `LINEAR_API_KEY` on the Configure tab. The OAuth path above is
      simpler for desktop use and is what we recommend.
---

# Linear setup

Linear runs the MCP server. One sign-in, no app registration, no API key paste -
Linear handles the OAuth dance behind the scenes via dynamic client registration.

Your token lives in your OS keychain and revokes any time from
`linear.app/settings/api` → **Authorized applications**.
