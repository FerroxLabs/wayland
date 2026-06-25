---
guideVersion: 1.0.0
estimatedMinutes: 4
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `npx @xeroapi/xero-mcp-server` on first launch - no manual install needed.
  - id: oauth-client
    title: "Create a Xero Custom Connection"
    externalAction: { label: "Open Xero developer portal", url: "https://developer.xero.com/app/manage" }
    inputs:
      - { name: XERO_CLIENT_ID, label: "Client ID" }
      - { name: XERO_CLIENT_SECRET, label: "Client secret", secret: true }
    warning: |
      A Custom Connection is a machine-to-machine app scoped to one Xero organization. It needs a paid Xero subscription.
    body: |
      1. Click **Open Xero developer portal** above and sign in.
      2. Click **New app** > **Custom Connection**, name it *Wayland*, and select the scopes you need (e.g. accounting.transactions, accounting.contacts, accounting.reports.read).
      3. Open the app's **Configuration** tab, copy the **Client id** and generate a **Client secret**.
      4. Paste both above, then click **Install** at the top of this page and toggle the connector on.
---

# Xero setup

Accounting in natural language - invoices, contacts, P&L and balance-sheet reports, bank transactions - Xero's official MCP.
