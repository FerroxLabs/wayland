---
guideVersion: 1.1.0
estimatedMinutes: 7
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `google-workspace-mcp` from PyPI via `uvx` on first
      launch - no manual install needed. If the server fails to start later,
      reinstall from this page.
  - id: cloud-project
    title: Create a Google Cloud project
    estSeconds: 120
    externalAction: { label: "Open Google Cloud console", url: "https://console.cloud.google.com/projectcreate" }
    body: |
      A Cloud project is the container Google uses to track your OAuth app.
      Free for personal use - no billing card required for Gmail / Calendar /
      Drive scopes.

      1. Click **Open Google Cloud console** above. Sign in with the Google
         account whose Workspace data you want to access.
      2. On the **New Project** page that opens, give it a name like
         *Wayland Personal*. Leave **Organization** as *No organization* (or
         your Workspace org if you're on a paid plan).
      3. Click **Create**. Wait ~10 seconds for the project to provision -
         a banner will say "Creating project…" then switch to it automatically.
      4. Confirm the project name appears in the blue top bar before continuing.
  - id: oauth-client
    title: Enable APIs and create an OAuth client
    estSeconds: 240
    inputs:
      - { name: GOOGLE_OAUTH_CLIENT_ID, label: "Client ID" }
      - { name: GOOGLE_OAUTH_CLIENT_SECRET, label: "Client Secret", secret: true }
    warning: |
      Keep the OAuth app in **Testing** mode. Don't publish - Google requires
      verification (CASA) for production apps with sensitive scopes.
    body: |
      You need to do three things in the Google Cloud console, in this order:
      enable the APIs you'll use, configure the consent screen, then create
      desktop OAuth credentials.

      **A. Enable the APIs** (≈ 60 sec)

      1. In the console's left sidebar, navigate to
         **APIs & Services → Enabled APIs & services**
         (or paste `console.cloud.google.com/apis/dashboard` into the address bar).
      2. Click **+ ENABLE APIS AND SERVICES** at the top.
      3. Search and enable each API you'll use - at minimum:
         **Gmail API**, **Google Calendar API**, **Google Drive API**.
         Optionally: Docs, Sheets, Slides, Chat, Forms, Tasks.
      4. Each one takes ~3 seconds - click **Enable** then back-arrow and
         search the next one.

      **B. Configure the OAuth consent screen** (≈ 90 sec)

      1. Left sidebar → **APIs & Services → OAuth consent screen**.
      2. User Type: pick **External** (unless you're on Workspace with an
         internal-only org). Click **Create**.
      3. Fill the **App information**:
         - App name: anything, e.g. *Wayland Personal*
         - User support email: your own Gmail address
         - Developer contact: your own Gmail address
         - Leave logo, app domain, and authorized domains blank.
      4. Click **Save and Continue** through **Scopes** (leave blank - Wayland
         requests them at runtime) and **Test users**.
      5. On **Test users**, click **+ Add Users** and add your own Gmail
         address. Save and continue.
      6. Final summary page - click **Back to Dashboard**.

      **C. Create the OAuth client ID** (≈ 60 sec)

      1. Left sidebar → **APIs & Services → Credentials**.
      2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**.
      3. Application type: **Desktop app**. Name: anything, e.g.
         *Wayland Desktop*.
      4. Click **Create**. A modal pops with **Client ID** and
         **Client secret** - copy both and paste into the fields above.
         (You can also download the JSON later if you lose them.)
  - id: authorize
    title: Authorize and start the server
    estSeconds: 30
    primaryAction: { label: "Sign in with Google", action: "oauth-flow" }
    body: |
      Click **Sign in with Google** below. A browser tab opens to Google's
      consent screen - pick the same account you added as a test user.

      Google will warn that the app isn't verified ("Google hasn't verified
      this app"). That's expected for a personal Testing-mode app - click
      **Advanced → Go to <app name> (unsafe)** and grant the scopes you
      enabled in Step B above.

      The tab redirects back to Wayland and the server status flips to
      Running. If the auth times out, click Re-authorize on the Installed
      page.
---

# Google Workspace setup

The community edition keeps your data on your machine. You'll register a Google
Cloud OAuth app for personal use - it's free, takes about five minutes, and the
credentials never leave your computer.
