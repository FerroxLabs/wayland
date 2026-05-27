---
guideVersion: 1.0.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
  - id: authorize
    title: Sign in with Todoist
    estSeconds: 30
    primaryAction: { label: "Sign in with Todoist", action: "oauth-flow" }
---

# Todoist setup

Todoist runs the MCP server. One click and you're connected.

## Step 2 — Sign in

A browser tab opens at Todoist. Sign in and approve. Wayland reads and writes
your tasks, projects, and labels.
