---
guideVersion: 1.1.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `@modelcontextprotocol/server-filesystem` from npm via
      `npx` on first launch - no manual install needed.

      The server accepts allowed directories as **positional arguments**
      passed at startup, e.g.
      `npx -y @modelcontextprotocol/server-filesystem /Users/me/docs /Users/me/projects`.
      Wayland fills these in for you from the directory picker on the
      Installed page - you don't need to edit the command yourself.

      **After install, Wayland prompts you to pick the directories this MCP
      can read and write.** The default is your home folder; tighten the
      scope from MCP settings any time. The server only sees files inside
      the directories you authorize, and all paths must be **absolute**.

      **Never** add `/` (macOS / Linux) or `C:\` (Windows) to the allowed
      list - that would give the model full disk access, including SSH keys,
      browser cookies, and OS files. Pick the narrowest set of directories
      that does the job (e.g. one project folder, your `~/Documents`
      subtree). You can change the allow-list any time without reinstalling.
---

# Filesystem setup

No setup required. After install, Wayland will prompt you to pick the
directories this MCP is allowed to read and write. The default is your
home folder; you can tighten the scope from the MCP settings.

You can change the allowed directories any time. The server only sees
files inside the directories you authorize.
