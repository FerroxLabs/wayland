---
guideVersion: 1.1.0
estimatedMinutes: 5
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      No local install needed. HubSpot hosts the MCP at
      `https://mcp.hubspot.com` - Wayland connects over streamable HTTP
      once you've authorized.
  - id: private-app
    title: Create a HubSpot Private App
    estSeconds: 240
    externalAction: { label: "Open HubSpot", url: "https://app.hubspot.com" }
    inputs:
      - { name: HUBSPOT_ACCESS_TOKEN, label: "Access token", secret: true }
    warning: |
      Private apps are scoped to the **HubSpot account they're created
      in** - if you have multiple portals (e.g. sandbox + production),
      create one app per portal and switch tokens in Configure.
      You can have up to 20 private apps per account.
    body: |
      Private apps are the cleanest way to give a desktop client a
      long-lived token. The OAuth path requires a published HubSpot app
      registration - overkill for personal use.

      1. Open `app.hubspot.com` and pick the account you want Wayland to
         act on (top-right account switcher).
      2. Click the **gear icon** (top-right) to open **Settings**.
      3. In the left sidebar, navigate to
         **Integrations → Private Apps**.
      4. Click **Create a private app**.
      5. **Basic Info** tab: give it a name like *Wayland Desktop* and a
         short description.
      6. **Scopes** tab: click **Add new scope** and tick the scopes
         Wayland needs - at minimum:
         - `crm.objects.contacts.read`
         - `crm.objects.contacts.write`
         - `crm.objects.deals.read`
         - `crm.objects.deals.write`
         Add `crm.objects.companies.*` and `tickets` if you want those
         tool groups to work.
      7. Click **Create app** (top-right). A modal warns you about the
         scopes - click **Continue creating**.
      8. On the app's **Auth** tab, click **Show token** under **Access
         token**, copy the `pat-…` value, and paste it into the field
         above.
  - id: verify
    title: Verify the connection
    estSeconds: 30
    body: |
      Wayland will use the token as a Bearer header on every MCP call.
      Open a new chat and ask: *"Show my five most recently created
      HubSpot contacts."* The MCP will return them.

      Revoke any time from the same **Settings → Integrations → Private
      Apps** page → click the app → **Delete app** at the bottom.
---

# HubSpot setup

The hosted HubSpot MCP authenticates via a **Private App** access token -
it's the standard pattern for desktop / scripted clients and avoids the
overhead of registering a public OAuth app.

The token is account-scoped, never expires, and respects the scopes you
ticked at creation. If you need to widen permissions later, edit the
Private App's **Scopes** tab and re-copy the token.
