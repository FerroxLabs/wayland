---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `uvx mcp-grafana` on first launch - no manual install needed.
  - id: api-key
    title: "Paste your Grafana key"
    externalAction: { label: "Get a Grafana key", url: "https://grafana.com" }
    inputs:
      - { name: GRAFANA_SERVICE_ACCOUNT_TOKEN, label: "Grafana API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a Grafana key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# Grafana setup

Query dashboards, datasources, and alerting across Prometheus, Loki, and Tempo - Grafana’s official MCP.
