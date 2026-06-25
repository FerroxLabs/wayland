---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.squareup.com/sse` - nothing runs locally.
  - id: oauth
    title: "Sign in with Square"
    primaryAction: { label: "Sign in with Square", action: "oauth-flow" }
    body: |
      Click **Sign in with Square** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Square setup

Payments, customers, inventory, bookings, and catalog across the full Square API - Square’s official hosted MCP.
