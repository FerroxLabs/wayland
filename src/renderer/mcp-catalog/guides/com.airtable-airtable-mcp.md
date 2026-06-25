---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.airtable.com/mcp` - nothing runs locally.
  - id: oauth
    title: "Sign in with Airtable"
    primaryAction: { label: "Sign in with Airtable", action: "oauth-flow" }
    body: |
      Click **Sign in with Airtable** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Airtable setup

Read and write bases, tables, fields, and records, and discover schema - Airtable’s official hosted MCP.
