---
guideVersion: 1.1.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Cloudflare hosts a **suite of 16 product-specific MCP servers** - one
      each for Workers Bindings, Workers Builds, Observability, Radar,
      Containers, Browser Rendering, Logpush, AI Gateway, AI Search
      (AutoRAG), Audit Logs, DNS Analytics, Digital Experience Monitoring,
      Cloudflare One CASB, GraphQL, Docs, and the Agents SDK Docs. All live
      at `*.mcp.cloudflare.com/mcp`.

      Nothing to install locally - Wayland connects to each endpoint over
      Streamable HTTP. Authorize once and Wayland reuses the OAuth grant
      across every server in the suite.
  - id: authorize
    title: Sign in with Cloudflare
    estSeconds: 60
    primaryAction: { label: "Sign in with Cloudflare", action: "oauth-flow" }
    warning: |
      On the consent screen, **uncheck any product you don't want Wayland
      to touch**. Granting Workers Bindings means Wayland can deploy and
      modify Workers; Audit Logs is read-only; AI Gateway can rack up spend.
      For CI/CD use a scoped Cloudflare **API token** (Profile → API Tokens
      → Create Token) and pass it as a bearer token instead of OAuth.
    body: |
      Click **Sign in with Cloudflare** below. A browser tab opens to
      `dash.cloudflare.com`. Pick the Cloudflare account whose resources
      you want Wayland to manage, then on the OAuth consent screen
      **explicitly select the permissions** for each MCP server you want
      enabled - the consent UI lists every endpoint in the suite.

      The tab redirects back to Wayland and the server status flips to
      Running. Wayland reuses the same OAuth token for all 16 endpoints.

      **Revoke any time:** `dash.cloudflare.com` → top-right profile →
      **My Profile → API Tokens** lists OAuth grants alongside API tokens.
      Delete the Wayland entry to cut access for every endpoint at once.

      **Full endpoint list and capabilities:**
      `developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/`
---

# Cloudflare Suite setup

Cloudflare runs the MCP servers. Sign in once to grant Wayland access to the
accounts, zones, and products you choose - the suite covers Workers, AI,
storage, networking, and security from a single OAuth grant.
