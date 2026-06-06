---
guideVersion: 1.1.0
estimatedMinutes: 3
steps:
  - id: install
    title: Connect to the hosted MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland connects to Hugging Face's hosted MCP at
      `https://huggingface.co/mcp` - nothing runs locally. Authentication is
      a Bearer token in the `Authorization` header, set up in the next step.
  - id: api-key
    title: Paste your Hugging Face access token
    estSeconds: 120
    externalAction: { label: "Open Access Tokens", url: "https://huggingface.co/settings/tokens" }
    inputs:
      - { name: HF_TOKEN, label: "Hugging Face access token", secret: true }
    warning: |
      For production use HF recommends **fine-grained** tokens, not `read` or
      `write` - scope each token to only the resources that one app needs so
      a leak doesn't expose your whole account.
    body: |
      1. Click **Open Access Tokens** above. The path is **huggingface.co →
         Avatar (top-right) → Settings → Access Tokens**.
      2. Click **New token** (or **Create new token**).
      3. Pick a role:
         - **read** - list and download models, datasets, Spaces, and call
           Inference Providers. Good default for browsing and inference.
         - **fine-grained** - recommended for production. Pick specific
           repos / orgs and per-resource permissions.
         - **write** - only if your agent will push to repos or modify
           model cards.
      4. Name it (e.g. *Wayland Desktop*), click **Generate token**, and
         copy the `hf_...` value into the field above (you can't view it
         again after closing the dialog).

      Manage which built-in tools and Spaces are exposed at
      `https://huggingface.co/settings/mcp`.
---

# Hugging Face setup

The Hugging Face MCP server is hosted at `https://huggingface.co/mcp` and
uses a personal access token sent as a Bearer header.
