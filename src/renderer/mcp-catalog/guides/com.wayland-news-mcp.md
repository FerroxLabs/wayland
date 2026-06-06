---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland bundles the News server as `builtin-mcp-news.mjs` - no external
      download. Hacker News and RSS/Atom feeds work immediately with no
      credentials. The optional step below adds mainstream-press search.
  - id: api-key
    title: (Optional) Paste a NewsAPI key
    estSeconds: 90
    externalAction: { label: "Get a free NewsAPI key", url: "https://newsapi.org/register" }
    inputs:
      - { name: NEWSAPI_KEY, label: "NewsAPI key (optional)", secret: true }
    body: |
      Skip this step entirely if you only need Hacker News and RSS. NewsAPI
      adds search across ~80,000 mainstream news sources.

      1. Click **Get a free NewsAPI key** above. NewsAPI's signup form asks
         for first name, last name, email, and a password. No credit card.
      2. After registering, your API key appears on the account dashboard -
         it's a 32-character hex string. Copy it.
      3. Paste it into `NEWSAPI_KEY` above and save. The Developer plan is
         free with a 100 requests/day cap and is rate-limited to localhost
         in development; it works fine for personal Wayland use.

      Leave the field blank to skip - Hacker News and arbitrary RSS/Atom
      feeds still work without any key.
---

# News & RSS setup

Hacker News and arbitrary RSS/Atom feeds work out of the box - no credentials.

## Step 2 - (Optional) NewsAPI

For mainstream-press search across thousands of outlets, get a free NewsAPI
key (100 queries/day, no card required). Paste it above. If you skip this
step, Hacker News and RSS feeds still work normally.
