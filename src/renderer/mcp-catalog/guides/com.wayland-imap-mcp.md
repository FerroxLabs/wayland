---
guideVersion: 1.0.0
estimatedMinutes: 3
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
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
---

# Generic IMAP / SMTP setup

This MCP works with any IMAP/SMTP host — iCloud Mail, Fastmail, Proton Bridge,
Zoho, Migadu, or self-hosted servers.

## Step 2 — Enter credentials

1. Find your provider's IMAP and SMTP settings (their help docs always list
   these).
2. Generate an **app-specific password** if your provider requires it (iCloud,
   Gmail, Fastmail two-factor).
3. Paste host, port, username, and password above.

Connection security is TLS by default. Plaintext IMAP is not supported.
