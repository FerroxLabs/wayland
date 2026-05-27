---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
  - id: api-key
    title: Paste your Brave Search API key
    estSeconds: 90
    externalAction: { label: "Get a free API key", url: "https://brave.com/search/api/" }
    inputs:
      - { name: BRAVE_API_KEY, label: "Brave API key", secret: true }
---

# Brave Search setup

Brave Search has a generous free tier (2,000 queries/month) and doesn't require
a credit card.

## Step 2 — Get an API key

1. Open the Brave Search API dashboard.
2. Sign in with your Brave account (free).
3. Create a key on the **Subscriptions → Free** plan.
4. Paste the key above.

Brave Search is independent from Google and Bing — useful when you want a
second opinion or a cleaner index.
