---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
  - id: api-key
    title: (Optional) Paste a NewsAPI key
    estSeconds: 90
    externalAction: { label: "Get a free NewsAPI key", url: "https://newsapi.org/register" }
    inputs:
      - { name: NEWSAPI_KEY, label: "NewsAPI key (optional)", secret: true }
---

# News & RSS setup

Hacker News and arbitrary RSS/Atom feeds work out of the box — no credentials.

## Step 2 — (Optional) NewsAPI

For mainstream-press search across thousands of outlets, get a free NewsAPI
key (100 queries/day, no card required). Paste it above. If you skip this
step, Hacker News and RSS feeds still work normally.
