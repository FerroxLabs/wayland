---
name: docker-compose-patterns
description: |
  Guides expert-level docker compose patterns implementation: cloud and automation decision frameworks, production-ready patterns, and concrete templates for docker compose patterns workflows.
  Use when the user asks about docker compose patterns, docker compose patterns configuration, or devops best practices for docker projects.
  Do NOT use when the user needs a different devops cloud capability -- check sibling skills in the devops cloud subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud automation"
  category: "devops-cloud"
  subcategory: "devops-cloud"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Docker Compose Patterns

## When to Use

**Use this skill when:**
- User is designing or refactoring a `docker-compose.yml` file for local development, CI/CD, or staging environments
- User asks how to structure multi-service applications with Docker Compose (e.g., app + database + cache + reverse proxy)
- User wants to manage multiple environments (dev/staging/prod) using Compose overrides or profiles
- User needs guidance on secrets management, health checks, networking, volume strategies, or dependency ordering in Compose
- User asks about service scaling, rolling restarts, or blue-green-style patterns achievable with Compose
- User wants to optimize Compose for CI pipeline speed (layer caching, build contexts, parallel startup)
- User is troubleshooting a broken Compose setup (services not starting, networking issues, volume permission errors, dependency cycles)

**Do NOT use this skill when:**
- User needs Kubernetes orchestration patterns -- use a Kubernetes-specific skill instead (Compose is not a replacement for Kubernetes in production at scale)
- User is asking about standalone `docker build` or `docker run` commands without a Compose context
- User needs infrastructure-as-code for cloud resources (Terraform, Pulumi, CDK) -- Compose only manages containers, not cloud infrastructure
- User is asking about Docker Swarm mode (Compose v3 YAML is reused but the deployment model is entirely different -- use a Swarm-specific skill)
- User needs service mesh, mTLS, or advanced traffic management -- Compose lacks sidecar proxy support; recommend a Kubernetes + Istio/Linkerd path
- User is working in a fully managed container platform like AWS ECS with Fargate -- while Compose-to-ECS adapters exist, the production patterns diverge significantly
- User needs multi-region active-active deployment -- Compose has no concept of availability zones or regional failover

---

## Process

### 1. Establish the Compose Topology

Before writing a single line of YAML, map the services and their relationships:

- **Identify all services** and categorize them: application services (stateless), data services (stateful), infrastructure services (reverse proxy, queue, cache), and tooling services (migration runners, seed scripts, test runners)
- **Draw the dependency graph** explicitly -- which services must be healthy before others start? A typical web app has: `db` → `migrations` → `api` → `frontend`. Circular dependencies are impossible; if you perceive one, a service boundary is wrong
- **Classify network exposure**: which services need to be reachable from the host (published ports), which only need to communicate service-to-service (internal networks only), and which must be completely isolated
- **Identify volume needs**: which services write persistent state (databases, uploaded files, logs), which need shared read-only assets (static files mounted into multiple services), and which should use ephemeral storage (caches that should reset on restart)
- **Count environment-specific differences**: list every value that changes between dev/staging/prod -- these become variables in `.env` files or Compose override files, never hardcoded in the base `docker-compose.yml`

### 2. Choose the File Structure Pattern

Select the right file organization strategy before writing configuration:

- **Single-file pattern** (appropriate for: ≤4 services, single environment, personal projects): one `docker-compose.yml` with all configuration. Keep it simple; resist premature abstraction
- **Base + override pattern** (appropriate for: 2+ environments, team projects): `docker-compose.yml` as the canonical service definition, `docker-compose.override.yml` automatically applied in dev (mounts source code, exposes debug ports), `docker-compose.prod.yml` applied explicitly for production-like runs. Use `docker compose -f docker-compose.yml -f docker-compose.prod.yml up`
- **Profile-based pattern** (appropriate for: optional services that vary by role): use the `profiles` key to group services. Core services have no profile (always start). Optional services like `mailhog`, `pgadmin`, or `load-testing` are in named profiles and started only with `--profile tooling`
- **Include-based pattern** (Compose v2.20+ / Docker Compose plugin): use `include:` to compose multiple separate Compose files into one logical application. Useful when sub-teams own service definitions independently. Not widely supported in older CI environments -- check the Docker Compose version available

Decide on `.env` file strategy:
- Use `.env` for non-sensitive defaults (image tags, port numbers, service names)
- Never commit secrets to `.env` -- use `.env.example` with placeholder values checked into version control
- In CI, inject secrets via environment variables or a secrets manager, not from files

### 3. Design the Network Topology

Docker Compose networking determines both security posture and service discoverability:

- **Default network**: every `docker compose up` creates one default bridge network. All services join it automatically. Service names become DNS hostnames. This is sufficient for simple projects
- **Segmented networks** (recommended for production-like environments): create explicit named networks and assign services to only the networks they need
  - `frontend_net`: reverse proxy ↔ application containers
  - `backend_net`: application containers ↔ databases, caches, queues
  - Only the reverse proxy is on both networks (it bridges them)
  - Databases must NOT be on `frontend_net`; they should never be reachable from the proxy layer
- **`internal: true` flag**: mark backend networks as internal (no internet access) for database and cache networks. This prevents a compromised application container from making outbound calls on the database network
- **Published ports**: only publish ports to the host when human or external-tool access is needed (e.g., port 5432 published for a developer's database GUI). Never publish database ports in staging/prod -- use `docker compose exec` or a bastion approach instead
- **IPv6**: Compose supports IPv6 but requires explicit `enable_ipv6: true` on network definitions and an address pool. Only configure this if your application explicitly needs it

### 4. Configure Health Checks and Dependency Ordering

The `depends_on` key alone does not wait for a service to be ready -- it only waits for the container to start. Use health checks to enforce true readiness:

- **Define `healthcheck` on every data service**: at minimum, databases, caches, and message brokers should declare health checks
  - PostgreSQL: `test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]`, `interval: 5s`, `timeout: 5s`, `retries: 10`, `start_period: 30s`
  - MySQL/MariaDB: `test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]`
  - Redis: `test: ["CMD", "redis-cli", "ping"]`, `interval: 3s`, `timeout: 3s`, `retries: 5`
  - RabbitMQ: `test: ["CMD", "rabbitmq-diagnostics", "check_port_connectivity"]`
  - Generic HTTP: `test: ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]`
- **Wire `depends_on` with `condition: service_healthy`**: this forces Compose to pause the dependent service startup until the dependency reports healthy
  ```yaml
  depends_on:
    db:
      condition: service_healthy
    redis:
      condition: service_healthy
  ```
- **Use `condition: service_completed_successfully`** for one-shot services like database migration runners -- the API service should not start until migrations have finished
- **Set `start_period`** to accommodate slow-starting services (JVM warmup, database initialization). Failures during `start_period` do not count toward `retries`. For PostgreSQL initializing a large schema, use `start_period: 60s`
- **`restart` policies**: use `restart: unless-stopped` for long-running services in development, `restart: on-failure:5` in staging to catch crash loops early without infinite restart loops

### 5. Manage Secrets and Configuration

Never put credentials in `docker-compose.yml` directly. Apply a layered configuration strategy:

- **Layer 1 -- `.env` file** (non-sensitive, environment-specific defaults): image tags (`APP_IMAGE_TAG=main-abc1234`), port mappings (`POSTGRES_EXPOSED_PORT=5433`), resource limits, feature flags
- **Layer 2 -- Environment variable passthrough**: for sensitive values in CI, define the variable in the Compose file as `ENV_VAR:` (no value) -- Docker Compose will read it from the shell environment. This is how CI secrets should flow in
- **Layer 3 -- Docker secrets (Compose v3.1+)**: use the `secrets:` top-level key to mount files into containers at `/run/secrets/<secret_name>`. Applications must be written to read from files, not environment variables. This is the most secure approach available in Compose
  ```yaml
  secrets:
    db_password:
      file: ./secrets/db_password.txt
  services:
    db:
      secrets:
        - db_password
      environment:
        POSTGRES_PASSWORD_FILE: /run/secrets/db_password
  ```
- **Never do**: `environment: DATABASE_URL: postgres://user:hardcoded_password@db/mydb` -- this leaks credentials into `docker inspect` output, process environment dumps, and version control if accidentally committed
- **Config objects** (Compose v3.3+): use `configs:` for non-sensitive configuration files (nginx configs, application config files) that should be mounted read-only into containers without being baked into the image

### 6. Set Resource Limits and Isolation

Compose files without resource limits allow a single misbehaving service to starve all others:

- **`mem_limit` and `cpus`** (Compose v2 syntax, still works with Compose plugin):
  ```yaml
  mem_limit: 512m
  cpus: "0.5"
  ```
- **`deploy.resources`** (Compose v3 syntax, preferred for compatibility with Swarm):
  ```yaml
  deploy:
    resources:
      limits:
        cpus: "0.5"
        memory: 512M
      reservations:
        cpus: "0.25"
        memory: 256M
  ```
- **Typical sizing guidelines for development stacks**:
  - PostgreSQL: 512M--1G memory, 0.5--1 CPU
  - Redis: 128M--256M memory, 0.25 CPU
  - Node.js/Python API: 256M--512M memory, 0.5 CPU
  - Java/JVM service: 512M--2G memory, 1 CPU (set `-Xmx` to 80% of container limit)
  - Nginx/Traefik reverse proxy: 64M--128M memory, 0.1 CPU
- **OOM kill behavior**: when a container exceeds `mem_limit`, it receives SIGKILL. Set `mem_swappiness: 0` to disable swap for containers that must not degrade gracefully
- **Log limits**: always configure log rotation to prevent disk exhaustion
  ```yaml
  logging:
    driver: json-file
    options:
      max-size: "10m"
      max-file: "3"
  ```

### 7. Optimize Builds for Development Speed and CI

Build performance directly impacts developer productivity and CI costs:

- **Use BuildKit**: set `DOCKER_BUILDKIT=1` or use `docker compose build` with the Compose plugin (BuildKit is enabled by default in Docker Desktop 23.0+). BuildKit enables parallel layer builds, better caching, and `--mount=type=cache` in Dockerfiles
- **Separate dev and prod Dockerfiles**: `Dockerfile` for production (minimal, multi-stage, no dev dependencies), `Dockerfile.dev` for development (includes hot-reload tools, debuggers, test runners). Reference with `build.dockerfile: Dockerfile.dev` in the override file
- **Multi-stage builds in production Dockerfiles**: builder stage (install all deps, compile, run tests) → runtime stage (copy only artifacts, minimal base image). This pattern reduces final image size by 60--80% for compiled languages
- **Layer ordering for cache efficiency**: order Dockerfile instructions from least-frequently-changed to most-frequently-changed: OS packages → language runtime → dependency manifests (package.json, requirements.txt) → dependency install → application code copy
- **Build context optimization**: always include a `.dockerignore` file. Exclude: `node_modules/`, `__pycache__/`, `.git/`, `*.log`, `.env`, test output directories. A bloated build context is one of the top causes of slow builds
- **`cache_from` in CI**: specify previously built images as cache sources to avoid rebuilding unchanged layers
  ```yaml
  build:
    context: .
    cache_from:
      - myapp:${CI_COMMIT_BRANCH:-main}
  ```
- **Bind mounts for development hot-reload**: in the dev override file, mount source code into the container so the process inside can detect file changes. Combine with `inotify`-based file watchers (nodemon, watchexec, air for Go). Use `delegated` consistency mode on macOS to improve I/O performance: `- type: bind, source: ./src, target: /app/src, consistency: delegated`

### 8. Write the Operational Runbook Inline

Production-ready Compose configurations document their own operation:

- **Add a `# Usage` comment block at the top of every Compose file** with the four most common commands: start, stop, logs, exec into a specific service
- **Document all required environment variables** in `.env.example` with descriptions and example values for every variable. A new developer should be able to run the stack in under 5 minutes using only the README and `.env.example`
- **Include a `Makefile` or `justfile`** with named targets for common workflows: `make up`, `make down`, `make logs`, `make migrate`, `make test`, `make shell SERVICE=api`. This abstracts the verbose `docker compose -f ... -f ... --env-file ...` commands
- **Version-pin base images**: use digests or specific version tags (`postgres:15.4-alpine3.18`), never `latest`. Unpinned images cause silent breakage when upstream updates land
- **Label all services** with metadata for tooling and observability:
  ```yaml
  labels:
    com.mycompany.service: "api"
    com.mycompany.version: "${APP_VERSION}"
    com.mycompany.team: "platform"
  ```

---

## Output Format

When producing a Docker Compose configuration recommendation, structure the response as follows:

### Service Topology Diagram

```
[host:80/443]
      │
[reverse-proxy] ── frontend_net ──> [api:3000]
                                        │
                          backend_net ──┼──> [postgres:5432]
                                        └──> [redis:6379]
```

### Environment File Template (`.env.example`)

```bash
# Application
APP_IMAGE_TAG=latest
APP_PORT=3000
NODE_ENV=development

# Database
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=myapp_dev
POSTGRES_USER=myapp
POSTGRES_PASSWORD=changeme_in_production

# Cache
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Reverse Proxy
NGINX_HOST_PORT=80
```

### Base Compose File (`docker-compose.yml`)

```yaml
# docker-compose.yml
# Base service definitions -- environment-agnostic configuration.
# Run with: docker compose up
# For production: docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

version: "3.9"

# ─────────────────────────────────────────────────────────────────────────────
# Named volumes for persistent data
# ─────────────────────────────────────────────────────────────────────────────
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

# ─────────────────────────────────────────────────────────────────────────────
# Networks: segmented to limit blast radius of a compromised container
# ─────────────────────────────────────────────────────────────────────────────
networks:
  frontend_net:
    driver: bridge
  backend_net:
    driver: bridge
    internal: true  # No internet access -- data services only

# ─────────────────────────────────────────────────────────────────────────────
# Reusable configuration fragments (YAML anchors)
# ─────────────────────────────────────────────────────────────────────────────
x-logging: &default-logging
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"

x-restart-policy: &default-restart
  restart: unless-stopped

services:

  # ─── Reverse Proxy ──────────────────────────────────────────────────────────
  nginx:
    image: nginx:1.25.3-alpine
    <<: *default-restart
    ports:
      - "${NGINX_HOST_PORT:-80}:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - frontend_net
    depends_on:
      api:
        condition: service_healthy
    logging: *default-logging
    deploy:
      resources:
        limits:
          cpus: "0.2"
          memory: 64M

  # ─── Application API ────────────────────────────────────────────────────────
  api:
    image: myapp-api:${APP_IMAGE_TAG:-latest}
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    <<: *default-restart
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    networks:
      - frontend_net
      - backend_net
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      migrations:
        condition: service_completed_successfully
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:3000/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    logging: *default-logging
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 256M

  # ─── Database Migration Runner (one-shot service) ───────────────────────────
  migrations:
    image: myapp-api:${APP_IMAGE_TAG:-latest}
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    command: ["npm", "run", "db:migrate"]
    environment:
      DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
    networks:
      - backend_net
    depends_on:
      db:
        condition: service_healthy
    # No restart -- this is a one-shot task. It exits 0 on success, non-zero on failure.
    restart: "no"

  # ─── PostgreSQL Database ─────────────────────────────────────────────────────
  db:
    image: postgres:15.4-alpine3.18
    <<: *default-restart
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-myapp_dev}
      POSTGRES_USER: ${POSTGRES_USER:-myapp}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      # Init scripts run only on first DB initialization
      - ./db/init:/docker-entrypoint-initdb.d:ro
    networks:
      - backend_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-myapp} -d ${POSTGRES_DB:-myapp_dev}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 30s
    logging: *default-logging
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M

  # ─── Redis Cache ─────────────────────────────────────────────────────────────
  redis:
    image: redis:7.2.3-alpine
    <<: *default-restart
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD:-}
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --save ""
    volumes:
      - redis_data:/data
    networks:
      - backend_net
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD:-}", "ping"]
      interval: 3s
      timeout: 3s
      retries: 5
    logging: *default-logging
    deploy:
      resources:
        limits:
          cpus: "0.25"
          memory: 256M
```

### Development Override File (`docker-compose.override.yml`)

```yaml
# docker-compose.override.yml
# Applied automatically by `docker compose up` in development.
# Adds hot-reload, debug ports, and developer tooling.

services:

  api:
    build:
      dockerfile: Dockerfile.dev    # Dev image includes nodemon, dev deps
      target: development
    command: ["npm", "run", "dev"]  # Hot-reload entrypoint
    environment:
      NODE_ENV: development
      LOG_LEVEL: debug
    volumes:
      # Mount source for hot-reload; exclude node_modules to use container's copy
      - ./src:/app/src:cached
      - /app/node_modules          # Anonymous volume prevents host overwriting container deps
    ports:
      - "9229:9229"                # Node.js inspector/debugger port

  db:
    ports:
      - "${POSTGRES_EXPOSED_PORT:-5432}:5432"   # Expose for local DB GUI tools

  redis:
    ports:
      - "6379:6379"               # Expose for local Redis clients

  # ─── Developer Tooling (profile-gated -- start with --profile tooling) ───────
  pgadmin:
    image: dpage/pgadmin4:7.8
    profiles:
      - tooling
    environment:
      PGADMIN_DEFAULT_EMAIL: dev@localhost
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    networks:
      - backend_net
    depends_on:
      db:
        condition: service_healthy

  mailhog:
    image: mailhog/mailhog:v1.0.1
    profiles:
      - tooling
    ports:
      - "1025:1025"   # SMTP
      - "8025:8025"   # Web UI
    networks:
      - frontend_net
```

### Decision Matrix

| Pattern | Use When | Avoid When | Complexity |
|---|---|---|---|
| Single file | ≤4 services, 1 environment | Multiple environments, team projects | Low |
| Base + override | Team project, 2+ envs | Very simple local tooling | Medium |
| Profile-based | Optional services (tools, test DBs) | All services required always | Low-Medium |
| Include-based | Sub-team service ownership, monorepo | Older CI (check Compose version) | Medium-High |
| Secrets file mount | Any credential in staging/prod | Dev secrets (overkill) | Low |
| YAML anchors | Repeated config blocks (3+ services) | 1-2 repetitions (just copy) | Low |

---

## Rules

1. **NEVER use `condition: service_started` for database dependencies.** This is the default behavior and it does not wait for the database to accept connections. Always define a `healthcheck` on the database service and use `condition: service_healthy`. Failure to do this causes race-condition startup failures that are intermittent and hard to debug.

2. **NEVER hardcode credentials in `docker-compose.yml`.** Use `${VARIABLE:?error message}` syntax for required secrets -- the `:?` syntax causes Compose to fail immediately with a clear error if the variable is unset, rather than starting with an empty password.

3. **ALWAYS set `restart: "no"` explicitly on one-shot services** (migration runners, seed scripts, test runners). If omitted, Compose defaults may cause the service to restart in a loop after it exits, consuming resources and polluting logs.

4. **NEVER mount the entire project root into a container.** `volumes: - .:/app` mounts `.git/`, `.env`, credentials, and IDE files into the container. Mount only the directories the service needs (`./src:/app/src`). Use explicit anonymous volumes to protect container-specific directories like `node_modules` from being overwritten by host mounts.

5. **ALWAYS specify image versions with a specific tag, never `latest`.** `latest` is not a version -- it is an alias that changes when the upstream maintainer decides to update it. Unpinned images cause environments to silently diverge. Pin to a version + variant combination like `postgres:15.4-alpine3.18`.

6. **NEVER put both `image:` and `build:` in the same service definition without understanding the semantics.** When both are present, `image:` specifies the name to tag the built image with. `docker compose up` will not automatically pull -- it will use the local image. In CI, explicitly run `docker compose build` before `docker compose up` to ensure the image is current.

7. **ALWAYS configure log rotation.** Without `logging.options.max-size` and `max-file`, a verbose service can fill a disk within hours. Every service that might produce high log volume (any application container) must have log limits configured.

8. **NEVER use the same Compose file for both development and production without overrides.** Development needs bind-mounted source code, exposed debug ports, and verbose logging. Production needs immutable images, no exposed ports, and structured log output. Conflating these in a single file forces compromises that make both environments worse.

9. **ALWAYS validate Compose files before committing.** Run `docker compose config` to merge and validate the full resolved configuration (including all `-f` override files). This catches YAML syntax errors, undefined variables, and merge conflicts. Add this as a CI lint step.

10. **NEVER create a data service without an explicit named volume.** Anonymous volumes (no name in the `volumes:` top-level section) are assigned a hash ID and are not pruned by standard `docker volume prune` -- they accumulate silently. Named volumes are visible in `docker volume ls`, can be backed up by name, and survive `docker compose down` without data loss.

11. **Use YAML anchors (`&anchor` / `*anchor` / `<<:`) for configuration fragments repeated 3 or more times**, but document what the anchor contains. Common candidates: logging configuration, restart policy, environment variable sets. Do NOT anchor entire service definitions -- this makes service configs hard to read independently.

12. **ALWAYS set memory limits on JVM-based services** and configure heap size to 75--80% of the container limit. A JVM without `--memory` constraints will grow to consume all available host memory because it uses the host's total RAM as its sizing reference, not the container's cgroup limit. Use `-XX:MaxRAMPercentage=75.0` (JDK 11+) to make heap sizing automatic and container-aware.

---

## Edge Cases

### 1. Volume Permission Errors on Linux Hosts

On Linux, container processes run as specific UIDs, but named volumes are created with root ownership by default. A service running as `uid=1000` (common for Node.js or Python images) cannot write to a volume owned by `uid=0`.

**Resolution approach:**
- Option A (entrypoint fix): add an entrypoint script that runs `chown -R appuser:appgroup /data` before launching the main process. This requires the entrypoint to briefly run as root (`user: root` at container start), then `exec su-exec appuser <main_command>`
- Option B (init container): add a companion one-shot service with `user: root` that runs `chown` on the volume, then use `depends_on: condition: service_completed_successfully` to gate the main service
- Option C (tmpfs for ephemeral needs): if the data is not persistent, use `tmpfs: /data` instead of a volume -- tmpfs is always writable by the container user
- **Avoid**: changing volume permissions by making the container run as root. This removes a security boundary and is a vulnerability in shared environments.

### 2. Networking Conflicts with Host or VPN

When Docker creates bridge networks, it assigns subnets from the `172.16.0.0/12` range by default. Many corporate VPNs and office networks also use this range, causing routing conflicts where Docker traffic is sent through the VPN tunnel instead of the local bridge.

**Resolution approach:**
- Explicitly configure network subnets outside the conflicting range:
  ```yaml
  networks:
    backend_net:
      driver: bridge
      ipam:
        config:
          - subnet: 192.168.200.0/24
  ```
- For a team-wide issue, configure Docker's default address pool in `/etc/docker/daemon.json`:
  ```json
  { "default-address-pools": [{"base":"10.200.0.0/16","size":24}] }
  ```
- Document the chosen subnets in the project README so future developers don't reassign conflicting ranges

### 3. Services With Slow Initialization (JVM, .NET Runtime, Large Models)

JVM services may take 30--90 seconds to start and bind their health endpoint. The default `healthcheck.start_period` of 0s means the first few health check failures count against `retries`, potentially killing the service before it has a chance to start.

**Resolution approach:**
- Set `start_period` to 110% of the measured cold-start time. For a JVM service that takes 60 seconds to start in CI: `start_period: 75s`
- Use a lightweight health endpoint (`/actuator/health` for Spring, `/health` for most frameworks) that does not do deep dependency checks on startup -- save dependency checks for readiness probes
- In development, set `interval: 10s` to reduce CPU overhead from repeated health checks during startup; in CI, use `interval: 5s` for faster feedback
- Consider adding a `JAVA_TOOL_OPTIONS: "-XX:TieredStopAtLevel=1"` environment variable in the dev override to disable JIT compilation during development, reducing startup time by 50% at the cost of throughput

### 4. Running Compose in CI/CD Pipelines

CI environments introduce constraints not present in development: no persistent layer cache between runs (unless configured), no Docker Desktop, potentially rootless Docker, and the need for deterministic teardown.

**Resolution approach:**
- Explicitly pull base images before building: `docker compose pull --ignore-pull-failures` caches image layers, then `docker compose build` uses the cached layers
- For GitHub Actions: use `actions/cache` with the Docker layer cache exporter: `type=gha,mode=max`
- Always run cleanup: `docker compose down -v --remove-orphans` as a CI teardown step, even on failure (use `if: always()` in GitHub Actions). The `-v` flag removes anonymous volumes that would otherwise accumulate and fill the CI runner disk
- Use `docker compose run --rm service_name test_command` to run tests in the Compose network, then exit without leaving a stopped container behind
- Set `COMPOSE_PROJECT_NAME` to a CI-run-specific value (e.g., the PR number) when running multiple simultaneous CI jobs on the same host to prevent project-name collisions

### 5. macOS Performance Problems with Bind Mounts

Docker Desktop on macOS runs containers in a Linux VM. Bind mounts that cross the macOS/VM boundary are notoriously slow for I/O-intensive workloads. A Node.js project with 50,000 files in `node_modules` performing module resolution on every hot-reload can be 10x slower than the same workload on native Linux.

**Resolution approach:**
- Never mount `node_modules`, `__pycache__`, `.venv`, or similar dependency directories from the host. Use anonymous volumes to let these directories live inside the container:
  ```yaml
  volumes:
    - ./src:/app/src:cached
    - /app/node_modules    # This anonymous volume shields node_modules from host I/O
  ```
- Use `VirtioFS` (enabled in Docker Desktop Settings > General) instead of the legacy `gRPC FUSE` file sharing -- VirtioFS delivers 2--3x better I/O throughput for bind mounts on macOS
- For Python projects, use `consistency: cached` on all read-only source mounts
- As a last resort, consider using `docker compose watch` (Docker Compose 2.22+), which syncs only changed files from host to container rather than mounting an entire directory

### 6. Database Schema Migrations as Compose Services

Running migrations as a Compose service is powerful but introduces failure modes if not handled carefully.

**Resolution approach:**
- The migration service must be idempotent -- running it twice must produce the same result as running it once. All major migration frameworks (Flyway, Liquibase, Alembic, Sequelize) are idempotent by default; verify your tool maintains this guarantee
- If the migration fails (exits non-zero), the dependent API service must not start. With `condition: service_completed_successfully`, Compose enforces this correctly
- During development, migrations run on every `docker compose up`. In staging/prod, trigger migrations as a separate deploy step before rolling out new application images
- Never run migrations with the same database user as the application. Create a `migrator` user with DDL privileges and a `appuser` with only DML (SELECT, INSERT, UPDATE, DELETE). This limits the blast radius of SQL injection vulnerabilities

### 7. Multi-Architecture Images (ARM64 / Apple Silicon)

Developers on Apple Silicon (M1/M2/M3) Macs run an ARM64 Linux VM. Many legacy or enterprise images are only built for `linux/amd64`, causing significant performance degradation through QEMU emulation (commonly 5--10x slower CPU performance).

**Resolution approach:**
- Always specify the platform explicitly for images that don't have ARM64 variants to make the performance tradeoff visible and intentional:
  ```yaml
  platform: linux/amd64   # Forces emulation on Apple Silicon -- known performance cost
  ```
- For in-house application images, build multi-arch images using `docker buildx build --platform linux/amd64,linux/arm64 --push`. This eliminates the emulation penalty
- Use the `DOCKER_DEFAULT_PLATFORM=linux/amd64` environment variable as a developer-machine workaround when many services lack ARM64 images, so you don't need to annotate each service
- When a service is slow in development on Apple Silicon and fast on Linux CI, suspect platform emulation before optimizing application code

---

## Example

**Input:** "I'm building a SaaS web application with a React frontend, a Node.js/Express API, PostgreSQL, and Redis. I have a team of 5 developers. We need dev, staging, and prod configurations. Some developers use macOS M2, some use Linux. We've been struggling with database race conditions on startup and slow hot-reload on macOS."

**Output:**

### Diagnosis and Pattern Selection

This project maps to the **base + override pattern** with YAML anchors for shared configuration. The two specific problems reported -- database race conditions and macOS hot-reload performance -- both have known, specific solutions.

**Root cause of race conditions**: the previous Compose file almost certainly used `depends_on` without `condition: service_healthy`. The fix is to add a proper PostgreSQL health check and wire the API's `depends_on` to `condition: service_healthy`.

**Root cause of macOS hot-reload slowness**: the `node_modules` directory was likely included in the bind mount. Shielding it with an anonymous volume will resolve this.

---

### File Layout

```
myapp/
├── docker-compose.yml          # Base: service definitions, networks, volumes
├── docker-compose.override.yml # Dev: auto-applied, hot-reload, exposed ports
├── docker-compose.prod.yml     # Prod-like: immutable images, no debug ports
├── docker-compose.ci.yml       # CI: parallel-safe, deterministic teardown
├── .env.example                # Template for all required variables
├── Makefile                    # Developer convenience commands
├── Dockerfile                  # Production multi-stage build
├── Dockerfile.dev              # Development build with nodemon
└── nginx/
    └── nginx.conf              # Reverse proxy configuration
```

---

### `.env.example`

```bash
# ─── Application ───────────────────────────────────────────────────────────────
APP_IMAGE_TAG=latest
API_PORT=3000
NODE_ENV=development

# ─── Database ──────────────────────────────────────────────────────────────────
POSTGRES_DB=myapp_dev
POSTGRES_USER=myapp
# REQUIRED: set this in your local .env -- never commit a real value
POSTGRES_PASSWORD=changeme_for_local_dev
# Dev only: exposed port for DB GUI tools (TablePlus, DataGrip)
POSTGRES_EXPOSED_PORT=5433

# ─── Cache ─────────────────────────────────────────────────────────────────────
REDIS_PASSWORD=

# ─── Proxy ─────────────────────────────────────────────────────────────────────
NGINX_HOST_PORT=80
```

---

### `docker-compose.yml` (Base)

```yaml
# docker-compose.yml
# Base configuration shared across all environments.
# Do NOT run this file directly -- use docker compose up (applies override.yml)
# or: docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

version: "3.9"

# ─────────────────────────────────────────────────────────────────────────────
# YAML Anchors -- reused configuration fragments
# ─────────────────────────────────────────────────────────────────────────────
x-logging: &logging
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"

x-api-base: &api-base
  image: myapp-api:${APP_IMAGE_TAG:-latest}
  build:
    context: .
    dockerfile: Dockerfile
  environment:
    PORT: ${API_PORT:-3000}
    DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
    REDIS_URL: redis://:${REDIS_PASSWORD:-}@redis:6379
  networks:
    - frontend_net
    - backend_net
  logging: *logging

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  frontend_net:
    driver: bridge
  backend_net:
    driver: bridge
    internal: true  # Databases have no internet access

services:

  nginx:
    image: nginx:1.25.3-alpine
    restart: unless-stopped
    ports:
      - "${NGINX_HOST_PORT:-80}:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - frontend_net
    depends_on:
      api:
        condition: service_healthy
    logging: *logging
    deploy:
      resources:
        limits: { cpus: "0.2", memory: 64M }

  api:
    <<: *api-base
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy   # FIX: replaces the previous bare depends_on
      redis:
        condition: service_healthy
      migrations:
        condition: service_completed_successfully
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:${API_PORT:-3000}/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    deploy:
      resources:
        limits: { cpus: "0.5", memory: 512M }
        reservations: { cpus: "0.25", memory: 256M }

  migrations:
    <<: *api-base
    command: ["npm", "run", "db:migrate"]
    restart: "no"    # One-shot: exits 0 on success, blocks api startup on failure
    depends_on:
      db:
        condition: service_healthy
    # Migrations only need backend_net -- override the anchor's network list
    networks:
      - backend_net

  db:
    image: postgres:15.4-alpine3.18
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-myapp_dev}
      POSTGRES_USER: ${POSTGRES_USER:-myapp}
      # :? causes immediate failure with clear error if POSTGRES_PASSWORD is unset
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in your .env file}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - backend_net
    healthcheck:
      # FIX: proper readiness check that resolves the startup race condition
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-myapp} -d ${POSTGRES_DB:-myapp_dev}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 30s
    logging: *logging
    deploy:
      resources:
        limits: { cpus: "1.0", memory: 1G }
        reservations: { cpus: "0.5", memory: 512M }

  redis:
    image: redis:7.2.3-alpine
    restart: unless-stopped
    command: >
      redis-server
      --requirepass "${REDIS_PASSWORD:-}"
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --save ""
    volumes:
      - redis_data:/data
    networks:
      - backend_net
    healthcheck:
      test: ["CMD-SHELL", "redis-cli -a '${REDIS_PASSWORD:-}' ping | grep PONG"]
      interval: 3s
      timeout: 3s
      retries: 5
    logging: *logging
    deploy:
      resources:
        limits: { cpus: "0.25", memory: 256M }
```

---

### `docker-compose.override.yml` (Development -- auto-applied)

```yaml
# docker-compose.override.yml
# Applied automatically in development.
# macOS M2 hot-reload fix: node_modules shielded by anonymous volume.

services:

  api:
    build:
      dockerfile: Dockerfile.dev
    command: ["npm", "run", "dev"]   # nodemon with --watch
    environment:
      NODE_ENV: development
      LOG_LEVEL: debug
    volumes:
      # FIX for macOS hot-reload: mount only src/, shield node_modules
      - ./src:/app/src:cached        # cached consistency = better macOS I/O
      - ./package.json:/app/package.json:ro
      - /app/node_modules            # Anonymous volume -- container's node_modules, not host's
    ports:
      - "9229:9229"                  # Node.js debugger (Chrome DevTools / VS Code)

  db:
    ports:
      # Expose DB to host so developers can connect with TablePlus, DataGrip, etc.
      - "${POSTGRES_EXPOSED_PORT:-5433}:5432"

  redis:
    ports:
      - "6379:6379"

  # ─── Optional tooling -- start with: docker compose --profile tooling up ───
  pgadmin:
    image: dpage/pgadmin4:7.8
    profiles: [tooling]
    environment:
      PGADMIN_DEFAULT_EMAIL: dev@localhost
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    networks:
      - backend_net
    depends_on:
      db:
        condition: service_healthy
```

---

### `Makefile`

```makefile
# Makefile -- developer convenience commands
# Usage: make up | make down | make logs | make migrate | make shell SERVICE=api

.PHONY: up down logs restart migrate shell test lint validate

# Start full dev stack
up:
	docker compose up --build

# Start silently in background
up-d:
	docker compose up --build -d

# Stop and remove containers (keep volumes)
down:
	docker compose down --remove-orphans

# Stop and wipe all data volumes (full reset)
reset:
	docker compose down -v --remove-orphans

# Tail logs (all services, or: make logs SERVICE=api)
logs:
	docker compose logs -f $(SERVICE)

# Run database migrations manually
migrate:
	docker compose run --rm migrations

# Open a shell in a running service
shell:
	docker compose exec $(or $(SERVICE),api) sh

# Run tests inside the container
test:
	docker compose run --rm api npm test

# Validate the merged Compose configuration (catches YAML errors and unset vars)
validate:
	docker compose config --quiet && echo "Compose config is valid"

# Lint the Compose files
lint:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml config --quiet
```

---

### Verification Checklist

After implementing these configurations, verify the following:

| Check | Command | Expected |
|---|---|---|
| Startup race condition resolved | `docker compose up` 3 times | API starts only after DB is healthy every time |
| macOS hot-reload works | Edit a `.js` file in `src/` | Service reloads in <2 seconds |
| Volumes are named | `docker volume ls` | `myapp_postgres_data`, `myapp_redis_data` visible |
| No credential leakage | `docker inspect myapp-api` | No raw passwords in `Env` array |
| Log limits active | `docker inspect myapp-api \| grep LogConfig` | `max-size: 10m` present |
| Backend network is internal | `docker network inspect myapp_backend_net` | `"Internal": true` |
| Config validates | `make validate` | No errors, no warnings |
