---
guideVersion: 1.1.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `docker-mcp` from PyPI via `uvx` on first launch - no
      manual install needed. The server talks to your local Docker daemon
      over the default Unix socket; there is no API key or login flow.

      **Prerequisites:**

      1. **Docker Desktop** (macOS / Windows) or **Docker Engine** (Linux)
         must be installed and running. Verify with:

         ```
         docker info
         ```

         If that prints daemon info, you're set. If it errors with "Cannot
         connect to the Docker daemon," start Docker Desktop (or
         `sudo systemctl start docker` on Linux) and retry.

      2. **Default socket paths** (the server uses these automatically):
         - macOS / Linux: `/var/run/docker.sock`
         - Windows: `npipe:////./pipe/docker_engine`

      3. **Non-default daemon?** If your Docker socket lives elsewhere
         (rootless install, remote host, colima, OrbStack), set `DOCKER_HOST`
         in your shell *before* launching Wayland - e.g.
         `export DOCKER_HOST=unix:///$HOME/.colima/default/docker.sock` or
         `export DOCKER_HOST=tcp://192.168.1.10:2375`.

      The server can list containers, exec commands inside them, follow logs,
      and manage compose stacks. Permissions match whatever your user already
      has on the Docker daemon.
---

# Docker setup

No configuration. The server talks to your local Docker daemon over the
default socket. You'll need **Docker Desktop** (macOS / Windows) or the
Docker Engine (Linux) installed and running before launching Wayland.
