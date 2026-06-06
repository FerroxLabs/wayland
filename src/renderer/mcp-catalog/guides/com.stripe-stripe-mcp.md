---
guideVersion: 1.1.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland connects to Stripe's hosted MCP at `https://mcp.stripe.com` -
      no local install. Stripe runs the OAuth flow and gates access per
      account and environment (test vs live).
  - id: authorize
    title: Sign in with Stripe
    estSeconds: 30
    primaryAction: { label: "Sign in with Stripe", action: "oauth-flow" }
    warning: |
      **Test mode vs Live mode are separate authorizations.** Approving the
      test-mode session does NOT grant access to live data, and vice versa.
      Start with **test mode** and verify the tools work before connecting
      live.
    body: |
      Click **Sign in with Stripe** below. A browser tab opens to
      `dashboard.stripe.com`.

      1. Pick the **account** to connect (top-left account switcher).
      2. Confirm the **environment** - the orange "Test mode" toggle in the
         top bar must match the data set you want Wayland to read.
      3. Choose a scope on the consent screen:
         - **read_only** - list and read customers, payments, invoices,
           subscriptions. Safe for analytics agents.
         - **read_write** - additionally create, update, refund. Required
           if your agent issues refunds or creates checkout sessions.
      4. Click **Authorize**. The tab redirects back to Wayland.

      Revoke any time at **dashboard.stripe.com → Settings → Your user →
      OAuth sessions → Revoke access** (not under Connected apps).
---

# Stripe setup

Stripe runs the MCP server. Sign in once to pick which account, environment
(test vs live), and permission level (read-only vs read-write) Wayland can
use.
