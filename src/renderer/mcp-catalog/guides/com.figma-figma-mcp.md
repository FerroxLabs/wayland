---
guideVersion: 1.1.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland connects to Figma's hosted MCP at `https://mcp.figma.com/mcp` —
      nothing is installed locally. The connection is added on first launch;
      authorization happens in the next step.
  - id: authorize
    title: Sign in with Figma
    estSeconds: 30
    primaryAction: { label: "Sign in with Figma", action: "oauth-flow" }
    warning: |
      The hosted Dev Mode MCP requires a **Dev seat** or **Full seat** on a
      paid Figma plan. Free / Starter accounts cannot connect — you'll see an
      "access denied" page in the OAuth tab if your seat doesn't qualify.
    body: |
      Figma's hosted MCP doesn't allow automatic client registration, so the
      first time you click **Sign in with Figma** Wayland opens a dialog for
      your own Figma app's **Client ID** and **Client Secret**. The dialog
      walks you through creating an app at **figma.com/developers/apps** and
      shows the callback URL to paste in.

      After you save the credentials, Wayland opens a browser tab to
      `figma.com` — pick the account whose files you want Wayland to read.
      Figma shows an **Allow access** consent screen listing your team /
      project access. Approve it and the tab redirects back to Wayland; the
      server status flips to Running.

      The token lives in your OS keychain. Revoke any time at
      **figma.com → Avatar → Settings → Security → Connected apps**.

      The MCP respects your existing Figma permissions: it can only see
      files, variables, components, and Dev Mode metadata that you can already
      see in the Figma editor.
---

# Figma setup

Figma hosts the MCP server. One click of **Sign in with Figma**, approve the
consent screen, and Wayland can read design files, variables, components, and
Dev Mode metadata on a paid Dev or Full seat.
