---
guideVersion: 1.1.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `firecrawl-mcp` from npm via `npx` on first launch -
      no manual install needed. If the server fails to start later,
      reinstall from this page.
  - id: api-key
    title: Paste your Firecrawl API key
    estSeconds: 60
    externalAction: { label: "Open Firecrawl dashboard", url: "https://www.firecrawl.dev/app/api-keys" }
    inputs:
      - { name: FIRECRAWL_API_KEY, label: "Firecrawl API key", secret: true }
    body: |
      The free plan includes **1,000 credits/month** (one credit per scraped
      page) with **2 concurrent requests** and low rate limits - no credit
      card required.

      1. Click **Open Firecrawl dashboard** above. Sign in or create an
         account at `firecrawl.dev`.
      2. The link drops you on **Dashboard → API Keys**. (If you land on
         the home dashboard, click **API Keys** in the left sidebar.)
      3. Click **Create API Key**. Name it anything (e.g. *Wayland*).
      4. Copy the key - it starts with `fc-` and is shown in full only once.
      5. Paste it into the `FIRECRAWL_API_KEY` field above.

      Credit usage is visible on the dashboard. Bumping past 1,000/month
      requires the $16/month Hobby plan or higher.
---

# Firecrawl setup

Firecrawl turns any URL into clean Markdown - single-page scrape, full-site
crawl, or schema-driven extraction. Free tier (1,000 credits/month) is
enough for light research; the Hobby plan unlocks higher concurrency.
