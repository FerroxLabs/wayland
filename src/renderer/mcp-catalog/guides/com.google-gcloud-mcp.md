---
guideVersion: 1.1.0
estimatedMinutes: 5
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `@google-cloud/gcloud-mcp` from npm via `npx` on first
      launch - no manual install needed. The server wraps Google's official
      Cloud SDK client libraries and authenticates via Application Default
      Credentials (ADC). If the server fails to start later, click
      **Reinstall** here to re-fetch.
  - id: pick-project
    title: Pick a Google Cloud project
    estSeconds: 60
    externalAction: { label: "Open Google Cloud console", url: "https://console.cloud.google.com" }
    inputs:
      - { name: GCLOUD_PROJECT, label: "Project ID" }
    body: |
      Wayland needs a default project so commands like *"list my Cloud Run
      services"* know which project to target. You can change it per-call
      later by saying *"in project foo-bar"* in chat.

      1. Click **Open Google Cloud console** above. Sign in with the Google
         account that owns the project.
      2. The project picker is the blue dropdown in the top bar (next to the
         **Google Cloud** logo). Click it to see all projects you can access.
      3. Each row shows a **Name** and an **ID**. Copy the **ID** - not the
         name, not the number. Project IDs are globally unique short strings
         like `my-startup-prod-2026`; project numbers are all-digit IDs that
         don't work here.
      4. Paste the ID into **Project ID** above.
  - id: service-account
    title: (Optional) Use a service account key
    estSeconds: 120
    inputs:
      - { name: GOOGLE_APPLICATION_CREDENTIALS, label: "Path to service account JSON" }
    warning: |
      Prefer **gcloud auth application-default login** over service account
      keys when possible. Service account keys are long-lived secrets.
    body: |
      Skip this step unless you specifically need a service account - the
      OAuth flow in the next step covers most use cases and is safer.

      Use a service account key when you need to act as a non-human identity
      (CI, automation), when your org policy forbids end-user OAuth for a
      project, or when you need scoped IAM roles narrower than your own
      account.

      1. In the Cloud console, navigate to **IAM & Admin → Service Accounts**,
         create or pick a service account, then open its **Keys** tab.
      2. Click **Add Key → Create new key → JSON** and save the file
         somewhere private (e.g. `~/.config/wayland/gcloud-sa.json`).
         Chmod `0600`.
      3. Paste the absolute path above. Wayland sets
         `GOOGLE_APPLICATION_CREDENTIALS` for the server and ADC picks it up
         automatically.
  - id: authorize
    title: Sign in with Google Cloud
    estSeconds: 30
    primaryAction: { label: "Sign in with Google", action: "oauth-flow" }
    body: |
      Click **Sign in with Google** below. A browser tab opens to Google's
      OAuth consent screen - the same `gcloud auth application-default login`
      flow used by the `gcloud` CLI. Pick the Google account that has access
      to the project ID you pasted in step 2.

      You'll be asked to grant the `cloud-platform` scope - that's
      cloud-wide access scoped to the projects your account already has
      permissions on. The credential is stored locally and used by ADC; no
      tokens leave your machine. Wayland flips the server to Running when the
      browser redirects back.
---

# Google Cloud setup

The MCP uses Google's Application Default Credentials. Easiest path: sign in
through the Wayland OAuth flow. Power users can drop a service account key
file and point the env var at it.

