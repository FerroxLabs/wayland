---
guideVersion: 1.1.0
estimatedMinutes: 8
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      No local install needed. Salesforce hosts the MCP at
      `https://mcp.salesforce.com` — Wayland connects over streamable
      HTTP once you've authorized.
  - id: connected-app
    title: Create a Salesforce Connected App
    estSeconds: 360
    externalAction: { label: "Open Salesforce Setup", url: "https://login.salesforce.com" }
    inputs:
      - { name: SALESFORCE_CONSUMER_KEY, label: "Consumer Key" }
      - { name: SALESFORCE_CONSUMER_SECRET, label: "Consumer Secret", secret: true }
    warning: |
      After clicking **Save**, Salesforce takes **2–10 minutes** to
      propagate the new Connected App across servers. Don't try to sign
      in below until the wait is done — early attempts return a generic
      "invalid client" error that looks like a typo.
    body: |
      Connected Apps are how external clients authenticate against a
      Salesforce org. You only need to do this once per org (production
      vs sandbox = two apps).

      1. Sign in to your Salesforce org. Click the **gear icon**
         (top-right) → **Setup**. This opens
         `setup.salesforce.com` in a new tab.
      2. In the Setup sidebar's **Quick Find** box, type
         `App Manager`, then click **App Manager**.
      3. Click **New Connected App** (top-right). When prompted, pick
         **Create a Connected App** and click **Continue**.
      4. **Basic Information**:
         - Connected App Name: *Wayland Desktop*
         - API Name: auto-fills
         - Contact Email: your address
      5. **API (Enable OAuth Settings)** section: tick **Enable OAuth
         Settings**.
      6. **Callback URL**: paste `http://localhost:3000/oauth/callback`
         (Salesforce allows `http://localhost` for desktop clients;
         every other callback must be HTTPS).
      7. **Selected OAuth Scopes**: move these into the **Selected**
         column:
         - `Manage user data via APIs (api)`
         - `Perform requests at any time (refresh_token, offline_access)`
         Add `Full access (full)` only if the agent needs metadata /
         setup APIs.
      8. Click **Save**, then **Continue** on the warning. Wait
         **2–10 minutes** for propagation (use the time to read the
         scopes carefully).
      9. Once propagated, open **App Manager**, find your app, click the
         **▼** dropdown → **View**. Under **API (Enable OAuth Settings)**
         click **Manage Consumer Details** (a verification code may be
         emailed first).
      10. Copy the **Consumer Key** and **Consumer Secret** and paste
          them into the fields above.
  - id: authorize
    title: Authorize Wayland on your org
    estSeconds: 60
    primaryAction: { label: "Sign in with Salesforce", action: "oauth-flow" }
    body: |
      Click **Sign in with Salesforce** below. A browser tab opens at
      `login.salesforce.com` (or `test.salesforce.com` for sandbox).

      1. Sign in to the org you want Wayland to act on.
      2. The consent screen lists the scopes you ticked in the Connected
         App. Click **Allow**.
      3. The tab redirects to `http://localhost:3000/oauth/callback` and
         Wayland captures the tokens. Server status flips to Running.

      All MCP calls execute as your user — record-level security, field
      permissions, and sharing rules all still apply.
  - id: verify
    title: Verify the connection
    estSeconds: 30
    body: |
      Open a new chat and ask: *"Run a SOQL query: SELECT Id, Name FROM
      Account LIMIT 5."* The MCP will return the rows.

      Revoke any time from your Salesforce **Personal Settings → My
      Personal Information → Authentication Settings for External
      Systems** — or globally, by deleting the Connected App from
      **Setup → App Manager**.
---

# Salesforce setup

Unlike most hosted MCPs in this catalog, Salesforce requires a one-time
Connected App registration on *your* org before OAuth will work — this is
standard for any third-party integration with Salesforce.

The propagation wait after **Save** is the most common gotcha. If sign-in
fails immediately, give it the full 10 minutes before troubleshooting.
