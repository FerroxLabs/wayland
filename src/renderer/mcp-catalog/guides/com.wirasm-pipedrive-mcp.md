---
guideVersion: 1.1.0
estimatedMinutes: 3
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland runs `pipedrive-mcp` from npm via `npx` on first launch —
      no manual install. It starts as a stdio child process whenever you
      invoke a Pipedrive tool.
  - id: api-key
    title: Paste your Pipedrive API token + domain
    estSeconds: 120
    externalAction: { label: "Open Pipedrive API settings", url: "https://app.pipedrive.com/settings/api" }
    inputs:
      - { name: PIPEDRIVE_API_TOKEN, label: "API token", secret: true }
      - { name: PIPEDRIVE_COMPANY_DOMAIN, label: "Company subdomain" }
    warning: |
      The API token inherits **your full Pipedrive permissions** in that
      company. If the **API** tab is missing, your admin disabled it under
      **Settings → Manage users → Permission sets → use API** — ask them
      to enable it for your set.
    body: |
      1. Click **Open Pipedrive API settings** above. The menu path is
         **Account name (top-right) → Company settings → Personal preferences
         → API**.
      2. Copy your **personal API token** from the top of the page (only one
         active token per user per company).
      3. Paste it into the **API token** field above.
      4. Find your **company subdomain**: it's the part before
         `.pipedrive.com` in your browser address bar (e.g. for
         `acme.pipedrive.com`, the subdomain is `acme`). Paste that into
         **Company subdomain**.

      If you belong to more than one Pipedrive company, each has its own
      token — make sure the token and subdomain match.
---

# Pipedrive setup

The community Pipedrive MCP authenticates with a personal API token plus
your company subdomain.
