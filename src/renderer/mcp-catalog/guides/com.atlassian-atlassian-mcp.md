---
guideVersion: 1.1.0
estimatedMinutes: 4
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      No local install needed. Atlassian hosts the MCP server (Atlassian
      Remote MCP / Rovo MCP) at `https://mcp.atlassian.com/v1/mcp/authv2`.
      Wayland connects over streamable HTTP the moment you finish sign-in.
  - id: admin-check
    title: Confirm your site admin has authorized Rovo MCP
    estSeconds: 90
    externalAction: { label: "Open Atlassian Admin", url: "https://admin.atlassian.com" }
    warning: |
      If you see *"Your site admin must authorize this app"* during
      sign-in, the org hasn't approved the connector yet. The very first
      user to consent on a site **must** be someone who already has access
      to the requested Jira / Confluence products.
    body: |
      Atlassian uses "just-in-time" installation - the connector isn't
      installed via Marketplace, it's authorized lazily through the
      OAuth 2.1 (3LO) consent flow. If you're a site admin, you can
      pre-approve it here so other users skip the prompt:

      1. Open `admin.atlassian.com` and pick your organization.
      2. Go to **Settings → Rovo MCP server** in the left nav.
      3. Review the connector and **Authorize** it for the sites and
         products (Jira, Confluence) you want it to reach.

      If you're a normal user on a site that hasn't been pre-approved,
      skip ahead - sign-in below will surface the admin-authorization
      error and your admin can complete this step from the error link.
  - id: authorize
    title: Sign in with Atlassian
    estSeconds: 60
    primaryAction: { label: "Sign in with Atlassian", action: "oauth-flow" }
    body: |
      Click **Sign in with Atlassian** below. A browser tab opens at
      `id.atlassian.com`.

      1. Sign in with the Atlassian account that has access to the Jira /
         Confluence sites you want Wayland to act on.
      2. Pick the site (e.g. *acme.atlassian.net*) from the **Accessible
         resources** list. You can re-run sign-in later to add more sites.
      3. Review the scopes - Wayland requests **read:jira-work**,
         **write:jira-work**, **read:confluence-content.all**, and
         **write:confluence-content**. The MCP enforces your existing
         per-project / per-space permissions on every call.
      4. Click **Accept**. The tab redirects back to Wayland and the
         server status flips to Running.

      Tokens live in your OS keychain.
  - id: verify
    title: Verify the connection
    estSeconds: 30
    body: |
      Open a new chat and ask: *"List open Jira issues assigned to me in
      <project key>."* Wayland will call the MCP and stream the results.

      Revoke any time from
      `id.atlassian.com/manage-profile/apps`.
---

# Atlassian (Jira + Confluence) setup

Atlassian runs one hosted MCP for both products. After sign-in, the same
connection serves Jira tools (issues, sprints, JQL search) and Confluence tools
(pages, spaces, CQL search).

If your org has SSO + admin-managed connectors, the **admin-check** step is
load-bearing - without it, sign-in will fail with the *"site admin must
authorize this app"* error.
