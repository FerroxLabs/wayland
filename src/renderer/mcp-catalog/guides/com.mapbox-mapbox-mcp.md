---
guideVersion: 1.1.0
estimatedMinutes: 3
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland runs `@mapbox/mcp-server` from npm via `npx` on first launch -
      no manual install. The package starts as a stdio child process whenever
      you invoke a Mapbox tool.
  - id: api-key
    title: Paste your Mapbox access token
    estSeconds: 90
    externalAction: { label: "Open Mapbox tokens dashboard", url: "https://console.mapbox.com/account/access-tokens/" }
    inputs:
      - { name: MAPBOX_ACCESS_TOKEN, label: "Mapbox access token", secret: true }
    warning: |
      Don't use a **secret** token with URL restrictions for desktop use -
      restrictions block non-browser origins. A **public** token (or a secret
      token with no URL restriction) is correct for Wayland.
    body: |
      1. Click **Open Mapbox tokens dashboard** above. Sign in if prompted -
         the URL is `console.mapbox.com → Account → Access tokens`.
      2. Either copy your **Default public token** (top of the list, prefix
         `pk.`) or click **Create a token**:
         - Name: *Wayland Desktop*
         - **Public scopes** are enough for most agent use:
           `styles:read`, `styles:tiles`, `fonts:read`, `datasets:read`.
         - Add secret scopes (`uploads:write`, `tilesets:write`, etc.) only
           if you specifically need those Mapbox APIs.
         - Leave **URL restrictions** empty (see warning).
      3. Click **Create token**, copy it, and paste into the field above.

      Free tier: 50,000 monthly map loads + 100,000 geocoding requests.
      Offline tools (distance, bearing, area, buffer) run without quota.
---

# Mapbox setup

Mapbox runs locally via `npx @mapbox/mcp-server` and authenticates with one
access token from your Mapbox account. Default public scopes cover geocoding,
routing, and tiles for typical agent use.
