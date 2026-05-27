---
guideVersion: 1.0.0
estimatedMinutes: 5
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
  - id: create-app
    title: Create a Spotify Developer app
    estSeconds: 120
    externalAction: { label: "Open Spotify Developer dashboard", url: "https://developer.spotify.com/dashboard" }
  - id: paste-credentials
    title: Paste your client ID and secret
    estSeconds: 90
    inputs:
      - { name: SPOTIFY_CLIENT_ID, label: "Client ID" }
      - { name: SPOTIFY_CLIENT_SECRET, label: "Client Secret", secret: true }
    warning: |
      Add `http://localhost:8765/callback` as a Redirect URI in your Spotify
      app settings — Spotify rejects the OAuth flow without it.
  - id: authorize
    title: Sign in with Spotify
    estSeconds: 30
    primaryAction: { label: "Sign in with Spotify", action: "oauth-flow" }
---

# Spotify setup

Spotify requires a free Developer app for OAuth — about five minutes once. A
Spotify Premium account is needed for playback control; the Free tier still
works for search and library browsing.

## Step 2 — Create a Spotify Developer app

1. Open the Spotify Developer dashboard and sign in with your Spotify account.
2. Click **Create app**. Name it *Wayland Personal* (or anything memorable).
3. For **Redirect URI**, add `http://localhost:8765/callback` exactly.
4. Accept the developer terms and save.

## Step 3 — Paste credentials

1. On your app's dashboard, copy **Client ID** and **Client Secret**.
2. Paste them above.

## Step 4 — Sign in

Click **Sign in with Spotify**. A browser tab opens for OAuth. Approve the
scopes Wayland requests and you're connected.
