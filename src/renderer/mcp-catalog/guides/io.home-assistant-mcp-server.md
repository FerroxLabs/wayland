---
guideVersion: 1.0.0
estimatedMinutes: 3
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
  - id: token
    title: Paste your Home Assistant URL and token
    estSeconds: 120
    externalAction: { label: "Open your HA profile", url: "https://www.home-assistant.io/docs/authentication/" }
    inputs:
      - { name: HASS_URL, label: "Home Assistant URL (e.g. http://homeassistant.local:8123)" }
      - { name: HASS_TOKEN, label: "Long-lived access token", secret: true }
---

# Home Assistant setup

## Step 2 — Create a long-lived token

1. Open Home Assistant in your browser.
2. Click your profile (bottom-left), scroll to **Security → Long-lived access
   tokens**, and click **Create Token**.
3. Name it *Wayland*. Copy the token — Home Assistant only shows it once.
4. Paste your HA URL and token above.

Wayland talks to your local Home Assistant instance directly. The token is
stored in your OS keychain.
