---
guideVersion: 1.1.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `brave-search-mcp` from npm via `npx` on first launch -
      no manual install needed. If the server fails to start later, reinstall
      from this page.
  - id: api-key
    title: Paste your Brave Search API key
    estSeconds: 90
    externalAction: { label: "Get a free API key", url: "https://api-dashboard.search.brave.com/register" }
    inputs:
      - { name: BRAVE_API_KEY, label: "Brave API key", secret: true }
    body: |
      Brave's **Data for Search - Free** plan gives you 2,000 queries/month at
      1 query/second. No credit card required for the Free tier.

      1. Click **Get a free API key** above. The dashboard opens at
         `api-dashboard.search.brave.com`.
      2. Sign in (or create a Brave account - Brave Search login works too).
      3. Left sidebar → **Subscriptions**. Find **Data for Search - Free**
         and click **Subscribe**. The page confirms the Free plan is active.
      4. Left sidebar → **API Keys**.
      5. Click **+ Add a key**. Name it anything (e.g. *Wayland*) and pick
         your Free subscription from the dropdown.
      6. Click **Add**. Copy the key shown - it's displayed only once.
      7. Paste it into the `BRAVE_API_KEY` field above.
---

# Brave Search setup

Brave Search has a generous free tier (2,000 queries/month, 1 qps) and doesn't
require a credit card. The index is independent from Google and Bing - useful
when you want a second opinion or a cleaner result set.
