---
guideVersion: 1.1.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `pagerduty-mcp` from PyPI via `uvx` on first launch -
      no manual install needed. The server runs locally in stdio mode and
      talks to PagerDuty's REST API using the user token you paste in the
      next step. If the server fails to start later, reinstall from this
      page.
  - id: api-key
    title: Paste your PagerDuty user API token
    estSeconds: 90
    externalAction: { label: "Open PagerDuty", url: "https://app.pagerduty.com" }
    inputs:
      - { name: PAGERDUTY_USER_API_KEY, label: "PagerDuty user API token", secret: true }
    body: |
      User tokens scope to your own account permissions - incidents you
      can't see in the PagerDuty UI won't appear here either. Use a user
      token (not a general access REST API key) so actions are attributed
      to you in audit logs.

      1. Click **Open PagerDuty** above and sign in.
      2. Click your **avatar** (top-right) → **My Profile**.
      3. Open the **User Settings** tab.
      4. Scroll to the **API Access** section and click
         **Create API User Token**.
      5. Give it a description like *Wayland*, click **Create Token**, and
         copy the value - PagerDuty only shows it once.
      6. Paste the token into `PAGERDUTY_USER_API_KEY` above.

      You can revoke or rotate this token any time from the same
      **API Access** section.
---

# PagerDuty setup

PagerDuty's official MCP server is published to PyPI as `pagerduty-mcp` and
runs locally via `uvx`.
