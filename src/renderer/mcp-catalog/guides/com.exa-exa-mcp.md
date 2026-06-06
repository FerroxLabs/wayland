---
guideVersion: 1.1.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `exa-mcp-server` from npm via `npx` on first launch -
      no manual install needed. If the server fails to start later,
      reinstall from this page.
  - id: api-key
    title: Paste your Exa API key
    estSeconds: 60
    externalAction: { label: "Open Exa dashboard", url: "https://dashboard.exa.ai" }
    inputs:
      - { name: EXA_API_KEY, label: "Exa API key", secret: true }
    body: |
      Exa gives every new account free trial credits on signup - enough to
      try the server before you commit. Pay-as-you-go after that, no
      subscription required.

      1. Click **Open Exa dashboard** above. Sign in or create an account
         at `dashboard.exa.ai`.
      2. Left sidebar → **API Keys**.
      3. Click **Create new key**. Name it anything (e.g. *Wayland*).
      4. Copy the key shown - it's displayed in full only once.
      5. Paste it into the `EXA_API_KEY` field above.

      Usage and remaining credits live under **Dashboard → Usage**.
---

# Exa setup

Exa is a neural search engine optimized for AI agents - semantic search,
similar-page lookup, and full content retrieval in one API. Free trial
credits on signup; pay-as-you-go after that.
