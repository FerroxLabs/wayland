---
guideVersion: 1.1.0
estimatedMinutes: 4
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland installs `mongodb-mcp-server` from npm via `npx` on first
      launch - no manual install needed. If the server fails to start later,
      reinstall from this page.
  - id: connection-string
    title: Paste your MongoDB connection string
    estSeconds: 210
    externalAction: { label: "Open MongoDB Atlas", url: "https://cloud.mongodb.com" }
    inputs:
      - { name: MDB_MCP_CONNECTION_STRING, label: "MongoDB connection string", secret: true }
      - { name: MDB_MCP_API_CLIENT_ID, label: "Atlas API client ID (optional)" }
      - { name: MDB_MCP_API_CLIENT_SECRET, label: "Atlas API client secret (optional)", secret: true }
    warning: |
      Set `MDB_MCP_READ_ONLY=true` in the env for a safe sandbox - it allows
      only read/connect/metadata operations. The connection string includes
      the database password in plaintext, so never paste a prod admin user;
      create a dedicated `wayland-mcp` user with the minimum DB roles.
    body: |
      The official `mongodb-mcp-server` talks to a local mongod, a
      self-hosted cluster, or MongoDB Atlas. Pick **one** of the two paths
      below - connection string is the common case, API keys are only
      needed if you want Wayland to manage Atlas infra (create clusters,
      database users, etc.).

      **Path A - Atlas connection string** (recommended, ≈ 2 min)

      1. Click **Open MongoDB Atlas** above and sign in.
      2. Left sidebar → **Database** → click **Connect** on your cluster.
      3. Choose **Drivers** as the connection method.
      4. Pick driver **Node.js** (any recent version) - Atlas will display
         a `mongodb+srv://...` connection string.
      5. If you don't have a DB user yet, click **Create a database user**
         under **Database Access**. Give it a strong password and the
         **readWrite** role on the databases Wayland will touch.
      6. Copy the string, **replace `<db_password>`** with that user's
         password (URL-encode reserved characters: `@` → `%40`, `:` → `%3A`).
      7. Paste it above as `MDB_MCP_CONNECTION_STRING`.

      **Path A2 - Local / self-hosted**

      Paste `mongodb://user:pass@host:27017/dbname` instead. Same field.

      **Path B - Atlas Service Account (optional, for infra ops)**

      1. Atlas top bar → **Organization → Access Manager → Applications →
         Service Accounts → Create Service Account**.
      2. Name it `wayland-mcp`. Grant the **minimum** roles you need
         (e.g. *Project Read Only*, or *Project Cluster Manager* to spin up
         clusters). Avoid *Organization Owner*.
      3. Generate a client secret - copy the **Client ID** and
         **Client Secret** (shown once).
      4. Paste them as `MDB_MCP_API_CLIENT_ID` and
         `MDB_MCP_API_CLIENT_SECRET` above.
---

# MongoDB setup

Wayland uses the official MongoDB MCP - same server the Mongo team ships for
Cursor/Claude. Works with Atlas, self-hosted, or local mongod. For most users,
just the connection string is enough.
