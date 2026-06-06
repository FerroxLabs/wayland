---
guideVersion: 1.0.0
estimatedMinutes: 3
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland bundles the IMAP/SMTP server as `builtin-mcp-imap.mjs` - no
      external download. The server starts the first time you complete
      Step 2 below. If it fails to start later, reinstall from this page.
  - id: credentials
    title: Enter your IMAP credentials
    estSeconds: 120
    inputs:
      - { name: IMAP_HOST, label: "IMAP host (e.g. imap.fastmail.com)" }
      - { name: IMAP_PORT, label: "IMAP port", default: "993" }
      - { name: IMAP_USER, label: "Username (usually your email)" }
      - { name: IMAP_PASSWORD, label: "Password or app password", secret: true }
      - { name: SMTP_HOST, label: "SMTP host (optional)" }
      - { name: SMTP_PORT, label: "SMTP port", default: "587" }
    warning: |
      For iCloud, Gmail, and most providers you'll need an **app-specific
      password**, not your normal login. Generate one in your provider's
      account settings.
    body: |
      You need two things from your email provider: their **IMAP/SMTP server
      settings** (host + port) and an **app-specific password**. Two-factor
      accounts cannot use your normal login password with IMAP.

      **A. Find your provider's IMAP/SMTP settings**

      1. Search your provider's help docs for "IMAP settings". Common values:
         - **iCloud**: `imap.mail.me.com:993` / `smtp.mail.me.com:587`
         - **Fastmail**: `imap.fastmail.com:993` / `smtp.fastmail.com:465`
         - **Gmail**: `imap.gmail.com:993` / `smtp.gmail.com:587`
         - **Proton Bridge**: `127.0.0.1:1143` / `127.0.0.1:1025` (Bridge running)
         - **Zoho**: `imap.zoho.com:993` / `smtp.zoho.com:587`
      2. Paste host into `IMAP_HOST` and port into `IMAP_PORT` above.
         Same for `SMTP_HOST` / `SMTP_PORT` if you want to send mail.

      **B. Generate an app-specific password**

      1. Open your provider's account/security settings page.
      2. Look for a section named **App passwords**, **App-specific
         passwords**, or **Generate password for app**.
      3. Create a new one labelled `Wayland` (or anything you'll recognize)
         and copy the generated string.
      4. Paste it into `IMAP_PASSWORD` above. The username (`IMAP_USER`) is
         almost always your full email address.

      Connection security is TLS by default - plaintext IMAP is not supported.
---

# Generic IMAP / SMTP setup

This MCP works with any IMAP/SMTP host - iCloud Mail, Fastmail, Proton Bridge,
Zoho, Migadu, or self-hosted servers.

## Step 2 - Enter credentials

1. Find your provider's IMAP and SMTP settings (their help docs always list
   these).
2. Generate an **app-specific password** if your provider requires it (iCloud,
   Gmail, Fastmail two-factor).
3. Paste host, port, username, and password above.

Connection security is TLS by default. Plaintext IMAP is not supported.
