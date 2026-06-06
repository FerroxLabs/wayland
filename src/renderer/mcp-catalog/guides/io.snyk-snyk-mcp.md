---
guideVersion: 1.1.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the Snyk CLI
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches the Snyk CLI on first launch via `npx snyk mcp -t stdio`
      and runs the bundled MCP server in stdio mode - no manual install
      needed. Requires Snyk CLI v1.1298.0 or later. If the server fails to
      start later, reinstall from this page.
  - id: api-key
    title: Paste your Snyk API token
    estSeconds: 90
    externalAction: { label: "Get an API token", url: "https://app.snyk.io/account" }
    inputs:
      - { name: SNYK_TOKEN, label: "Snyk API token", secret: true }
      - { name: SNYK_CFG_ORG, label: "Snyk organization ID (optional)", secret: false }
    body: |
      You can use either the legacy account API token or a newer Personal
      Access Token (PAT). Either works for the MCP server.

      **Option A - Legacy account token (fastest):**

      1. Click **Get an API token** above to open `https://app.snyk.io/account`.
      2. Sign in. Scroll to **General Account Settings → API Token** and
         click **Click to show**.
      3. Copy the token and paste it into `SNYK_TOKEN` above.

      **Option B - Personal Access Token (recommended for shared accounts):**

      1. Open `https://app.snyk.io/account/personal-access-tokens`.
      2. Click **Create token**, give it a name like *Wayland*, set an
         expiry, and copy the value into `SNYK_TOKEN`.

      **Multi-org accounts:** if your Snyk account spans organizations,
      paste the target org slug (visible in the URL when you switch orgs,
      e.g. `app.snyk.io/org/<slug>`) into `SNYK_CFG_ORG` so scans run
      against the right workspace.

      The server exposes `snyk_sca_scan`, `snyk_code_scan`, `snyk_iac_scan`,
      and `snyk_container_scan` for open-source, code, infrastructure, and
      container vulnerability checks.
---

# Snyk setup

The Snyk MCP server ships inside the Snyk CLI (v1.1298.0 or later). Wayland
runs it via `npx snyk mcp -t stdio`.
