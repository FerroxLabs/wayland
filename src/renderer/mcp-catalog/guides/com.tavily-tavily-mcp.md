---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.tavily.com/mcp/` - nothing runs locally.
  - id: oauth
    title: "Sign in with Tavily"
    primaryAction: { label: "Sign in with Tavily", action: "oauth-flow" }
    body: |
      Click **Sign in with Tavily** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Tavily setup

AI-native web search plus page extraction, mapping, and crawling - Tavily’s official hosted MCP.
