---
guideVersion: 1.1.0
estimatedMinutes: 3
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      The MCP server is built into Home Assistant 2025.5+ — there's
      nothing to install on your machine. Wayland connects to your HA
      instance over streamable HTTP using the URL and token you paste
      in the next step.

      **Reachability matters.** Wayland must be able to reach your HA
      from the machine it's running on. If HA is on your home LAN
      (`http://homeassistant.local:8123`), Wayland needs to be on the
      same network or use a VPN / Nabu Casa Cloud / reverse proxy.
      Remote access over the public internet requires a real domain name
      (not an IP) — HA rejects OAuth-style redirects to bare IPs.
  - id: token
    title: Paste your Home Assistant URL and token
    estSeconds: 120
    externalAction: { label: "HA token docs", url: "https://www.home-assistant.io/docs/authentication/" }
    inputs:
      - { name: HASS_URL, label: "Home Assistant URL (e.g. http://homeassistant.local:8123)" }
      - { name: HASS_TOKEN, label: "Long-lived access token", secret: true }
    body: |
      **A. Confirm your HA URL** (≈ 30 sec)

      Open Home Assistant in your browser the way you normally do and
      copy the address from the URL bar. Common values:
      - LAN: `http://homeassistant.local:8123` or `http://<lan-ip>:8123`
      - Nabu Casa Cloud: `https://<your-id>.ui.nabu.casa`
      - Self-hosted via proxy: `https://ha.example.com`

      Paste it into `HASS_URL` above — no trailing slash.

      **B. Create a long-lived access token** (≈ 60 sec)

      1. In Home Assistant, click your **profile icon** in the bottom-left
         of the sidebar.
      2. Open the **Security** tab.
      3. Scroll to **Long-Lived Access Tokens** and click **Create Token**.
      4. Name it *Wayland*. Click **OK**.
      5. Copy the token immediately — Home Assistant only shows it once.
      6. Paste it into `HASS_TOKEN` above.

      The token is stored in your OS keychain. Revoke it any time from the
      same Security page.
---

# Home Assistant setup

The Model Context Protocol server is bundled with Home Assistant 2025.5+.
Wayland talks to your local HA instance over streamable HTTP.
