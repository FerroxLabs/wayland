---
guideVersion: 1.1.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Readwise hosts the MCP server at `https://mcp.readwise.io` - nothing
      to install. Wayland connects via streamable HTTP on first use.
  - id: authorize
    title: Sign in with Readwise
    estSeconds: 30
    primaryAction: { label: "Sign in with Readwise", action: "oauth-flow" }
    body: |
      Click **Sign in with Readwise** below. A browser tab opens at
      Readwise's OAuth consent screen.

      1. Sign in to Readwise if you aren't already.
      2. Approve the **read** and **write** scopes. One sign-in covers
         both Readwise classic (highlights, books) and the Reader inbox -
         the same token works for both APIs.
      3. The tab redirects back to Wayland and the server status flips
         to Running.

      **Rate limits:** Readwise's API allows 240 requests/minute on standard
      endpoints, with list endpoints (Highlight LIST, Book LIST) capped at
      20/minute. The MCP server respects these limits automatically.

      **Prefer a raw token?** Visit `readwise.io/access_token` - the token
      is displayed directly on the page, no menu to dig through.
---

# Readwise + Reader setup

Readwise runs the MCP server. One sign-in covers both Readwise highlights
and the Reader inbox - they share a single access token.
