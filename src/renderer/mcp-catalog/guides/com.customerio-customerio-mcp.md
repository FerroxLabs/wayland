---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.customer.io/mcp` - nothing runs locally.
  - id: oauth
    title: "Sign in with Customer.io"
    primaryAction: { label: "Sign in with Customer.io", action: "oauth-flow" }
    body: |
      Click **Sign in with Customer.io** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Customer.io setup

Build segments from real customer data, inspect profiles and journeys, and search campaigns - Customer.io’s official hosted MCP.
