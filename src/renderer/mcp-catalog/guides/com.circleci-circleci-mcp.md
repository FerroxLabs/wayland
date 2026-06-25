---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `npx @circleci/mcp-server-circleci` on first launch - no manual install needed.
  - id: api-key
    title: "Paste your CircleCI key"
    externalAction: { label: "Get a CircleCI key", url: "https://app.circleci.com/settings/user/tokens" }
    inputs:
      - { name: CIRCLECI_TOKEN, label: "CircleCI API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a CircleCI key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# CircleCI setup

Analyze build failures, run pipelines, and detect flaky tests - CircleCI’s official MCP.
