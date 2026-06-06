---
guideVersion: 1.1.0
estimatedMinutes: 3
steps:
  - id: install
    title: Install the MCP server (Docker)
    estSeconds: 60
    autoCompletedByInstall: true
    body: |
      Wayland pulls the official `hashicorp/terraform-mcp-server` Docker
      image on first launch. Make sure **Docker Desktop** (macOS / Windows)
      or **Docker Engine** (Linux) is installed and running - verify with
      `docker info`.

      Without a token the server runs in **registry-only mode**: you can
      search public providers, browse modules in the Terraform Registry, and
      look up policies. That's already useful for code exploration; add a
      token in Step 2 to unlock workspace operations.
  - id: token
    title: Paste your HCP Terraform token
    estSeconds: 120
    externalAction: { label: "Create an HCP Terraform token", url: "https://app.terraform.io/app/settings/tokens" }
    inputs:
      - { name: TFE_TOKEN, label: "HCP Terraform / TFE token", secret: true }
    body: |
      Adding a token unlocks workspace management, organization / project
      listing, and access to the private module registry.

      1. Click **Create an HCP Terraform token** above, or open
         `app.terraform.io` and click your **avatar** (top right) →
         **Account settings** → left sidebar **Tokens**.
      2. Click **Create an API token**, give it a description like
         *Wayland MCP*, and pick an expiration. User tokens carry your full
         account permissions; for tighter scope, generate a **Team token**
         from your team's settings instead.
      3. Click **Generate token**. HCP Terraform shows the token **once** -
         copy it now and paste it above as `TFE_TOKEN`.

      Self-hosted **Terraform Enterprise**? Also override `TFE_ADDRESS` in
      MCP advanced settings with your TFE URL (defaults to
      `https://app.terraform.io`).
---

# Terraform setup

HashiCorp ships the Terraform MCP server as the
`hashicorp/terraform-mcp-server` Docker image. Wayland pulls the image on
install - make sure Docker is running. A token is optional but unlocks
workspace operations on top of registry browsing.
