---
guideVersion: 1.1.0
estimatedMinutes: 7
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `@floriscornel/teams-mcp` from npm via `npx` on first
      launch - no manual install. The server uses Microsoft's MSAL library and
      OAuth 2.0 device-code flow against Microsoft Graph. Works with personal,
      work, and school accounts. If the server fails to start, click
      **Reinstall** here to retry the fetch.
  - id: azure-app
    title: Register an Azure AD application
    estSeconds: 180
    externalAction: { label: "Open Azure portal", url: "https://portal.azure.com" }
    body: |
      You need your own Azure AD app registration so Graph knows which client
      the MCP is. Free for personal Microsoft accounts; no Azure subscription
      required.

      1. Click **Open Azure portal** above. Sign in with the account whose
         Teams data you want to access. (You can use the
         [Microsoft Entra admin center](https://entra.microsoft.com) directly
         if you prefer the dedicated Entra UI.)
      2. In the global search bar, type **Microsoft Entra ID** and open it.
         In the left sidebar of Entra, pick **App registrations**, then click
         **+ New registration** at the top.
      3. **Name:** anything memorable, e.g. *Wayland Teams*.
      4. **Supported account types:** pick
         **Accounts in any organizational directory (Any Microsoft Entra ID
         tenant - Multitenant) and personal Microsoft accounts (e.g. Skype,
         Xbox)** so both work and personal accounts work.
      5. **Redirect URI:** leave the dropdown set to **Public client/native
         (mobile & desktop)** and enter `http://localhost:8765`.
      6. Click **Register**. The app's **Overview** page opens - leave it
         open, you'll copy IDs from it in the next step.
  - id: configure
    title: Configure permissions and paste IDs
    estSeconds: 180
    inputs:
      - { name: TEAMS_CLIENT_ID, label: "Application (client) ID" }
      - { name: TEAMS_TENANT_ID, label: "Directory (tenant) ID", default: "common" }
    body: |
      Add the Graph delegated permissions the MCP needs, then copy the two
      IDs into Wayland.

      **A. Add API permissions**

      1. In the left sidebar of your app registration, click **API
         permissions**.
      2. Click **+ Add a permission**, pick **Microsoft Graph**, then
         **Delegated permissions**.
      3. Search and tick each of: `Chat.ReadWrite`, `ChannelMessage.Send`,
         `Team.ReadBasic.All`, `OnlineMeetings.ReadWrite`, `Presence.Read`,
         `User.Read`, `offline_access`.
      4. Click **Add permissions**. Personal accounts consent at sign-in;
         work/school tenants may need an admin to click **Grant admin consent
         for &lt;tenant&gt;**.

      **B. Copy the IDs**

      1. Click **Overview** in the left sidebar of your app registration.
      2. Copy **Application (client) ID** → paste into **Application (client)
         ID** above.
      3. Copy **Directory (tenant) ID** → paste into **Directory (tenant)
         ID** above. For personal Microsoft accounts only, leave the default
         `common` instead.
  - id: authorize
    title: Sign in with Microsoft
    estSeconds: 30
    primaryAction: { label: "Sign in with Microsoft", action: "oauth-flow" }
    body: |
      Click **Sign in with Microsoft** below. A browser tab opens to
      Microsoft's consent screen - sign in with the same account you intend
      to act as in Teams.

      You'll see the list of scopes you granted in the previous step. Click
      **Accept**. The tab redirects back to Wayland and the server flips to
      Running. Tokens are cached locally; the MCP refreshes them silently
      using `offline_access`. If auth ever times out, click **Re-authorize**
      on the Installed page.
---

# Microsoft Teams setup

Teams talks to Microsoft Graph via an Azure AD app you register. Personal and
work accounts both work - about five minutes end-to-end.

