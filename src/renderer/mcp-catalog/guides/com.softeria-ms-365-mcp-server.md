---
guideVersion: 1.1.0
estimatedMinutes: 8
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `@softeria/ms-365-mcp-server` from npm via `npx` on first
      launch - no manual install. The server uses MSAL device-code flow
      against Microsoft Graph and covers Outlook, Calendar, OneDrive, Excel,
      Teams, To Do, and OneNote in a single server. If the server fails to
      start, click **Reinstall** here to retry the fetch.
  - id: azure-app
    title: Register an Azure AD application
    estSeconds: 180
    externalAction: { label: "Open Azure portal", url: "https://portal.azure.com" }
    body: |
      You need your own Azure AD app registration so Microsoft Graph knows
      which client the MCP is. Free for personal Microsoft accounts; no Azure
      subscription required.

      1. Click **Open Azure portal** above. Sign in with the Microsoft account
         whose Microsoft 365 data you want to access.
      2. In the global search bar, type **Microsoft Entra ID** and open it.
         In the left sidebar of Entra, pick **App registrations**, then click
         **+ New registration** at the top.
      3. **Name:** anything memorable, e.g. *Wayland Personal*.
      4. **Supported account types:** pick
         **Accounts in any organizational directory (Any Microsoft Entra ID
         tenant - Multitenant) and personal Microsoft accounts (e.g. Skype,
         Xbox)**.
      5. **Redirect URI:** leave the dropdown set to **Public client/native
         (mobile & desktop)** and enter `http://localhost:8765`.
      6. Click **Register**. The app's **Overview** page opens - keep it open
         for the next step.
  - id: configure-permissions
    title: Configure permissions and paste IDs
    estSeconds: 180
    inputs:
      - { name: MS365_CLIENT_ID, label: "Application (client) ID" }
      - { name: MS365_TENANT_ID, label: "Directory (tenant) ID", default: "common" }
      - { name: MS365_CLIENT_SECRET, label: "Client secret (optional)", secret: true }
    warning: |
      Use **common** as the tenant for personal Microsoft accounts. For work
      accounts, use your organization's tenant ID.
    body: |
      Add the Graph delegated permissions the MCP needs, copy the IDs into
      Wayland, then (optionally) mint a client secret for background refresh.

      **A. Add API permissions**

      1. In the left sidebar of your app registration, click **API
         permissions**.
      2. Click **+ Add a permission**, pick **Microsoft Graph**, then
         **Delegated permissions**.
      3. Search and tick each of: `Mail.ReadWrite`, `Calendars.ReadWrite`,
         `Files.ReadWrite`, `Chat.ReadWrite`, `Tasks.ReadWrite`,
         `Notes.ReadWrite`, `User.Read`, `offline_access`.
      4. Click **Add permissions**. Personal accounts consent at sign-in;
         work/school tenants need an admin to click **Grant admin consent
         for &lt;tenant&gt;**.

      **B. Copy the IDs**

      1. Click **Overview** in the left sidebar of your app registration.
      2. Copy **Application (client) ID** → paste into **Application (client)
         ID** above.
      3. Copy **Directory (tenant) ID** → paste into **Directory (tenant)
         ID** above. For personal Microsoft accounts only, leave the default
         `common` instead of pasting.

      **C. Client secret (optional)**

      Skip unless you need long-lived background refresh in HTTP mode.

      1. Left sidebar → **Certificates & secrets** → **Client secrets** tab →
         **+ New client secret**.
      2. Description: *Wayland*. Expires: pick a value (Azure caps at 24
         months). Click **Add**.
      3. Copy the **Value** column **immediately** - Azure hides it after you
         leave the page. Paste into **Client secret (optional)** above.
  - id: authorize
    title: Sign in with Microsoft
    estSeconds: 30
    primaryAction: { label: "Sign in with Microsoft", action: "oauth-flow" }
    body: |
      Click **Sign in with Microsoft** below. A browser tab opens to
      Microsoft's consent screen - sign in with the same Microsoft 365
      account you intend to act as.

      You'll see the list of scopes you granted in the previous step. Click
      **Accept**. The tab redirects back to Wayland and the server flips to
      Running. Tokens are cached locally; the MCP refreshes them silently via
      `offline_access`. If auth ever times out, click **Re-authorize** on the
      Installed page.
---

# Microsoft 365 setup

The Softeria community MCP talks to Microsoft Graph using an Azure AD app you
own. Free for personal accounts. About five to seven minutes end-to-end.

