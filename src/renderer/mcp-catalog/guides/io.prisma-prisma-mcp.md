---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.prisma.io/mcp` - nothing runs locally.
  - id: oauth
    title: "Sign in with Prisma"
    primaryAction: { label: "Sign in with Prisma", action: "oauth-flow" }
    body: |
      Click **Sign in with Prisma** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Prisma setup

Run migrations and manage Prisma Postgres databases - create, list, query, and back up - Prisma’s official hosted MCP.
