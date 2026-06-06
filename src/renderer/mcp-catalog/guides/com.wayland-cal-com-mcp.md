---
guideVersion: 1.1.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      The Cal.com MCP is bundled with Wayland - nothing to download. It speaks
      to Cal.com's REST API v2 (`https://api.cal.com/v2`). Works against the
      hosted cal.com service out of the box; self-hosted deployments only need
      to override the base URL in the next step.

      If the server crashes on launch, click **Reinstall** to rebundle the
      native binary.
  - id: api-key
    title: Paste your Cal.com API key
    estSeconds: 90
    externalAction: { label: "Open Cal.com API keys", url: "https://app.cal.com/settings/developer/api-keys" }
    inputs:
      - { name: CALCOM_API_KEY, label: "Cal.com API key", secret: true }
      - { name: CALCOM_BASE_URL, label: "Base URL (self-hosted only)", default: "https://api.cal.com/v2" }
    body: |
      Cal.com authenticates the MCP with a personal API key minted from your
      account settings.

      1. Click **Open Cal.com API keys** above. Sign in if prompted. You land
         on the developer settings page that lists your existing keys.
      2. Click the create-key button (labeled **Add** in the current UI) and
         give the key a recognizable name like *Wayland*. Pick an expiration
         that matches your risk tolerance - the longest available option is
         fine for personal use; pick **Never expires** only if you'll rotate
         manually.
      3. Cal.com shows the key **exactly once**. Copy it now (hosted keys
         start with `cal_live_`; test-mode keys with `cal_`) and paste into
         **Cal.com API key** above. If you lose it, you'll need to generate a
         new one.
      4. **Self-hosted Cal.com only:** override **Base URL** with your
         instance, e.g. `https://cal.yourcompany.com/api/v2`. Leave the
         default for hosted cal.com.

      The key inherits your account's permissions - it can read and write
      bookings, event types, and availability for anything you can see in the
      web UI. Team-scoped keys require a paid Cal.com Teams plan.
---

# Cal.com Scheduling setup

Cal.com is open-source and self-hostable. The MCP works against the hosted
cal.com service by default; point `CALCOM_BASE_URL` at your own instance for
self-hosted deployments.

