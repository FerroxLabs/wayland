---
guideVersion: 1.1.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `@bitbonsai/mcpvault` from npm via `npx` on first
      launch - no manual install needed. The server reads and writes your
      vault directly as Markdown, with no Obsidian plugin and no running
      Obsidian app required. Requires Node 18+.
  - id: vault-path
    title: Point Wayland at your vault folder
    estSeconds: 30
    inputs:
      - { name: OBSIDIAN_VAULT_PATH, label: "Absolute path to your vault" }
    body: |
      mcpvault needs an absolute path to the folder that holds your
      `.md` notes. It only touches files inside that path.

      1. In Obsidian, right-click your vault in the file sidebar →
         **Reveal in Finder** (macOS) / **Show in Explorer** (Windows) /
         **Open in file manager** (Linux).
      2. Copy the full absolute path of the folder. Examples:
         - macOS: `/Users/you/Documents/MyVault`
         - Windows: `C:\Users\you\Documents\MyVault`
         - Linux: `/home/you/Documents/MyVault`
      3. Paste it into the `OBSIDIAN_VAULT_PATH` field above.

      **Heads up:** mcpvault runs in read/write mode by default - it can
      create, edit, and delete notes (14 tools across notes, search, tags,
      and backlinks). Back up your vault, or point it at a copy first if
      you want to try it safely. The server only touches files inside the
      path you supplied.
---

# Obsidian Vault setup

mcpvault is a community MCP server that exposes any local Obsidian vault
as Markdown - no Obsidian plugin or running Obsidian app required. 14
tools cover note CRUD, multi-word search with relevance ranking,
frontmatter, tags, and backlinks.
