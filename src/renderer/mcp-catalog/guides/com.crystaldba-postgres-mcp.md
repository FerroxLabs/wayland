---
guideVersion: 1.1.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `postgres-mcp` from PyPI via `uvx` on first launch -
      no manual install needed. The server defaults to **restricted /
      read-only** mode: it opens read-only transactions and parses SQL to
      block writes at the application layer.
  - id: connection
    title: Paste your Postgres connection string
    estSeconds: 60
    inputs:
      - { name: DATABASE_URL, label: "postgres://… connection string", secret: true }
    warning: |
      For production databases, create a **read-only role** and use its
      credentials. The MCP defaults to read-only mode but enforcing it at the
      role level is safer.
    body: |
      Paste a standard Postgres URI above. Both `postgres://` and
      `postgresql://` prefixes work:

      ```
      postgresql://username:password@host:5432/database?sslmode=require
      ```

      Common `sslmode` values: `disable` (local dev only), `require`
      (recommended for managed Postgres like Neon/Supabase/RDS), `verify-full`
      (strictest - needs CA cert configured on the client).

      **Recommended: create a dedicated read-only role first.** From `psql`:

      ```
      CREATE ROLE wayland_ro LOGIN PASSWORD 'changeme';
      GRANT CONNECT ON DATABASE mydb TO wayland_ro;
      GRANT USAGE ON SCHEMA public TO wayland_ro;
      GRANT SELECT ON ALL TABLES IN SCHEMA public TO wayland_ro;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT SELECT ON TABLES TO wayland_ro;
      ```

      Then put `wayland_ro` in the connection string. Defense in depth: the
      server blocks writes *and* the role can't perform them.
---

# Postgres setup

Run read-only SQL, inspect schemas, and explain query plans against any
Postgres database. Paste a connection string and you're done - the server
defaults to read-only and refuses write statements unless you explicitly
opt in from advanced settings.
