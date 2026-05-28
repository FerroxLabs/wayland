---
guideVersion: 1.1.0
estimatedMinutes: 5
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `spotify-mcp-server` from npm via `npx` on first
      launch — no manual install needed. The server runs locally in stdio
      mode and talks to the Spotify Web API using OAuth credentials from
      a Spotify Developer app you'll create in the next step. If the
      server fails to start later, reinstall from this page.
  - id: create-app
    title: Create a Spotify Developer app
    estSeconds: 120
    externalAction: { label: "Open Spotify Developer dashboard", url: "https://developer.spotify.com/dashboard" }
    body: |
      Spotify requires a free Developer app for OAuth — about two minutes
      once. A Spotify Premium account is needed for playback control; the
      Free tier still works for search and library browsing.

      1. Click **Open Spotify Developer dashboard** above. Sign in with
         your Spotify account.
      2. Click **Create app**.
      3. Fill the form:
         - **App name**: anything memorable, e.g. *Wayland Personal*
         - **App description**: e.g. *Local assistant integration*
         - **Website**: optional, leave blank
         - **Redirect URI**: paste `http://localhost:8765/callback`
           exactly — Spotify rejects the OAuth flow if it doesn't match.
         - **Which API/SDKs are you planning to use**: check **Web API**.
      4. Accept the Developer Terms of Service and click **Save**.
      5. You'll land on the app's overview page — leave this tab open
         for the next step.
  - id: paste-credentials
    title: Paste your client ID and secret
    estSeconds: 90
    inputs:
      - { name: SPOTIFY_CLIENT_ID, label: "Client ID" }
      - { name: SPOTIFY_CLIENT_SECRET, label: "Client Secret", secret: true }
    warning: |
      Your Redirect URI in the Spotify dashboard must exactly match
      `http://localhost:8765/callback` (default) or whatever
      `SPOTIFY_REDIRECT_URI` is set to in Wayland's environment. Mismatches
      fail with `INVALID_CLIENT: Invalid redirect URI`.
    body: |
      Still on your app's overview page in the Spotify dashboard:

      1. The **Client ID** is shown directly on the overview. Copy it
         into `SPOTIFY_CLIENT_ID` above.
      2. Click **View client secret** (or **Settings → View client
         secret**). Copy the value into `SPOTIFY_CLIENT_SECRET`.
      3. Double-check **Settings → Redirect URIs** lists
         `http://localhost:8765/callback`. If you typed it wrong, add the
         correct one and click **Save**.

      Both values are stored in your OS keychain.
  - id: authorize
    title: Sign in with Spotify
    estSeconds: 30
    primaryAction: { label: "Sign in with Spotify", action: "oauth-flow" }
    body: |
      Click **Sign in with Spotify** below. A browser tab opens to
      Spotify's OAuth consent screen.

      1. Sign in if prompted.
      2. Review the scopes Wayland is requesting — playback control,
         playlist read/write, and library access.
      3. Click **Agree**.

      The tab redirects to `http://localhost:8765/callback`, Wayland
      catches the code, exchanges it for tokens, and the server status
      flips to Running. Tokens refresh automatically as long as the
      Developer app stays active.
---

# Spotify setup

Spotify requires a free Developer app for OAuth — about five minutes once. A
Spotify Premium account is needed for playback control; the Free tier still
works for search and library browsing.
