---
name: docker-production-patterns
description: |
  Guides expert-level docker production patterns implementation: cloud and security decision frameworks, production-ready patterns, and concrete templates for docker production patterns workflows.
  Use when the user asks about docker production patterns, docker production patterns configuration, or devops best practices for docker projects.
  Do NOT use when the user needs a different devops cloud capability -- check sibling skills in the devops cloud subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud security"
  category: "devops-cloud"
  subcategory: "devops-cloud"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Docker Production Patterns

## When to Use

**Use this skill when:**
- User asks how to structure Dockerfiles, Compose files, or container configurations for production workloads
- User wants to harden a container setup that currently runs in development and needs to be production-ready
- User needs guidance on multi-stage builds, image size reduction, non-root execution, or layer caching strategy
- User asks about secrets management, health checks, resource constraints, or logging patterns specific to Docker
- User wants a production-ready `docker-compose.yml` or needs to move from Compose to a more robust orchestration pattern
- User is debugging container startup failures, OOM kills, permission errors, or network isolation issues in production
- User wants to implement a container scanning, signing, or supply chain security workflow

**Do NOT use this skill when:**
- User needs Kubernetes-specific orchestration patterns (pod specs, Deployments, StatefulSets, HPA) -- use a Kubernetes skill instead
- User is asking about CI/CD pipeline configuration in isolation (GitHub Actions, GitLab CI) -- use a CI/CD pipeline skill
- User needs infrastructure-as-code for provisioning the container host (Terraform, Pulumi, CloudFormation) -- use an IaC skill
- User is asking about serverless container platforms (AWS Fargate task definition tuning, Cloud Run cold starts) as the primary concern -- use a serverless containers skill
- User needs application-level performance profiling unrelated to the container runtime
- User wants general Linux system administration advice that does not involve containers
- User is asking about Docker Desktop configuration for local development only, with no production intent

---

## Process

### 1. Audit the Current Dockerfile and Image Chain

Before writing a single line of new configuration, understand what you are working with.

- Identify the base image and its provenance: is it an official image, a vendor image, or a custom base? Official images from Docker Hub (e.g., `python:3.12-slim-bookworm`, `node:20-alpine3.19`) are preferred over generic OS images because they include curated defaults.
- Check the image tag discipline -- floating tags like `node:latest` or `python:3` are production anti-patterns. Pin to a specific digest (`FROM node:20.11.1-alpine3.19@sha256:...`) or at minimum a patch version tag.
- Run `docker history <image>` to inspect layer sizes. Layers over 50 MB are candidates for optimization. A complete production Node.js or Python application image should target under 200 MB for Alpine-based builds.
- Run `dive <image>` (the open-source tool) to identify files added and then removed within separate RUN layers -- this wastes space because the files persist in the lower layer.
- Check if the current image runs as root by default. This is the most common production security gap.
- Identify if a `.dockerignore` file exists and whether it excludes `.git`, `node_modules`, `*.log`, test directories, and local `.env` files.

### 2. Design Multi-Stage Build Architecture

Multi-stage builds are the foundational pattern for production images. They separate concerns and keep final images minimal.

- Use a named `builder` stage for dependency installation and compilation. This stage can be large and contain build tools.
- Use a minimal `runtime` stage based on `distroless`, `alpine`, or `slim` variants for the final image. The `gcr.io/distroless/nodejs20-debian12` images contain only the runtime and no shell, dramatically reducing attack surface.
- Copy only the compiled artifacts or installed production dependencies from `builder` to `runtime`. For Node.js: copy `node_modules` from a `npm ci --omit=dev` install. For Python: copy the virtualenv. For Go: copy the single statically compiled binary.
- Add a dedicated `test` stage between `builder` and `runtime` that runs unit tests. This makes `docker build --target test` a testable artifact in CI.
- For interpreted languages (Python, Ruby), consider using `--mount=type=cache` in the build stage to cache pip/gem/npm package manager downloads across builds on the same host, reducing build time by 40-80%.
- Name every stage clearly: `FROM node:20-alpine AS deps`, `FROM node:20-alpine AS builder`, `FROM node:20-alpine AS runner`.

**Canonical multi-stage pattern (Node.js):**
```dockerfile
FROM node:20.11.1-alpine3.19 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
USER nextjs
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 3. Implement Security Hardening

Security is not a phase -- it is embedded in every layer of the Dockerfile and runtime configuration.

- **Non-root user:** Create a system user and group in the image and switch to it with `USER`. Use consistent UIDs (1001 is a common convention to avoid collisions with host UIDs under 1000). Never run application processes as UID 0.
- **Read-only root filesystem:** In Docker Compose and runtime flags, set `read_only: true` on the container. Mount specific writable paths as `tmpfs` (e.g., `/tmp`, `/var/run`) with size limits. This prevents container escape via filesystem writes.
- **Capability dropping:** Drop all Linux capabilities and add back only what is needed. Most application containers need zero capabilities. Add `cap_drop: [ALL]` and only re-add specific capabilities like `NET_BIND_SERVICE` if the app must bind to ports below 1024 (better solution: use a port above 1024 in the container and map it externally).
- **No new privileges:** Set `security_opt: ["no-new-privileges:true"]` in Compose or `--security-opt=no-new-privileges` at runtime. This prevents privilege escalation via setuid binaries.
- **Secrets management:** Never bake secrets into images or pass them as `ENV` instructions in Dockerfiles. Use Docker Secrets (Swarm), BuildKit secret mounts (`--mount=type=secret`), or runtime secret injection via a secrets manager (HashiCorp Vault agent, AWS Secrets Manager sidecar, Doppler). For build-time secrets: `RUN --mount=type=secret,id=npm_token npm config set //registry.npmjs.org/:_authToken=$(cat /run/secrets/npm_token) && npm ci`.
- **Image scanning:** Integrate Trivy or Grype into the build pipeline. Gate on CRITICAL vulnerabilities: `trivy image --exit-code 1 --severity CRITICAL myimage:tag`. Run scans on every merge to main and on a weekly schedule against deployed images (vulnerabilities emerge after build time).
- **Image signing:** Use Docker Content Trust (Notary v1) or Sigstore/cosign (Notary v2) to sign images. Enforce signature verification at the registry or admission controller level.

### 4. Configure Resource Limits, Health Checks, and Restart Policies

Production containers without resource limits are a reliability risk. A single runaway process can OOM the entire host.

- **Memory limits:** Set both `mem_limit` and `mem_reservation` in Compose, or `--memory` and `--memory-reservation` at runtime. The reservation is the soft limit the scheduler uses; the hard limit triggers an OOM kill. For a typical Node.js microservice, start with `memory: 512m` hard limit and `memory-reservation: 256m`. For Java services, account for JVM overhead -- set `-Xmx` to ~75% of the container memory limit (e.g., `Xmx384m` with a 512 MB container limit).
- **CPU limits:** Use `cpus: "0.5"` (half a core) as a starting point for lightweight services. CPU throttling is preferable to OOM kills -- an OOM kill crashes the process, while CPU throttling just slows it.
- **Health checks:** Every production container must have a `HEALTHCHECK`. Define it in the Dockerfile or Compose. Use a lightweight probe -- for HTTP services, `curl -f http://localhost:3000/health || exit 1`. Set `interval=30s`, `timeout=5s`, `start_period=15s` (or longer for slow-starting JVM services), `retries=3`. The `start_period` prevents flapping during startup without disabling health checks entirely.
- **Restart policies:** Use `restart: unless-stopped` for long-running services in Docker Compose. For ephemeral workers or batch jobs, use `restart: on-failure` with a `restart_retries: 3` cap to prevent infinite restart loops masking a configuration error.
- **PID limits:** Set `pids_limit: 100` (or an appropriate value) to prevent fork bombs and runaway process spawning within the container.

**Example health check in Dockerfile:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/healthz || exit 1
```

### 5. Structure Logging and Observability

Containers are ephemeral -- application state must be externalized and logs must flow to centralized systems.

- **Log to stdout/stderr only.** Never write application logs to files inside the container. Configure all logging frameworks to write to stdout (INFO, DEBUG) and stderr (WARN, ERROR). This is the 12-factor app logging principle. Docker captures these streams and routes them to the configured log driver.
- **Log driver selection:** The default `json-file` driver is fine for development. In production, use `fluentd`, `awslogs`, `gelf` (for Graylog), or `splunk` depending on your stack. Configure at the daemon level in `/etc/docker/daemon.json` or per-container. Set `max-size: "10m"` and `max-file: "3"` on `json-file` to prevent disk exhaustion on hosts that aggregate logs locally.
- **Structured logging:** Configure application code to emit JSON-structured logs with consistent fields: `timestamp`, `level`, `message`, `service`, `traceId`, `requestId`. This makes logs queryable in Elasticsearch, CloudWatch Logs Insights, or Loki.
- **Metrics:** Expose a `/metrics` endpoint in Prometheus exposition format. Run a Prometheus or OpenTelemetry collector as a sidecar or scrape from the host. Standard metrics for web services: request rate, error rate, latency percentiles (p50, p95, p99), active connections.
- **Distributed tracing:** Inject OpenTelemetry instrumentation and export to Jaeger or Zipkin (or an OTLP-compatible backend). Propagate `traceId` in HTTP headers (`traceparent` per W3C Trace Context spec) and include it in every log line.
- **Container metadata:** Include container-level labels in log outputs: `com.example.service`, `com.example.version`, `com.example.environment`. These labels flow through to the log driver and enable filtering by service and version in centralized log systems.

### 6. Design Networking and Service Discovery

Container networking in production requires deliberate isolation and naming.

- **Use user-defined bridge networks, never the default bridge.** The default bridge network does not provide DNS-based service discovery. Create explicit networks with `docker network create` or define them in Compose. Services on the same user-defined network can reach each other by service name as the DNS hostname.
- **Network segmentation:** Separate frontend (DMZ), backend (application tier), and data (database tier) networks. A web frontend service should be on both the `frontend` and `backend` networks. The database should only be on the `data` network. This is not merely cosmetic -- it limits lateral movement if a container is compromised.
- **Expose vs publish:** Use `EXPOSE` in Dockerfile for documentation and inter-container communication. Only publish ports to the host (`ports: "8080:80"` in Compose) for services that need external access. Databases should never have published ports in production.
- **Internal DNS and service discovery:** In Swarm mode or Compose with named networks, Docker's embedded DNS resolves service names. For cross-host service discovery, use Consul, or rely on the orchestration layer (Swarm VIPs, Kubernetes Services).
- **TLS termination:** Terminate TLS at a reverse proxy container (Nginx, Caddy, Traefik) rather than in application containers. Configure the proxy to enforce TLS 1.2+ and disable cipher suites below AES-128. Use Caddy for automatic certificate management via Let's Encrypt with minimal configuration overhead.

### 7. Manage Data Persistence and Volume Strategy

Stateless application containers with externalized persistence are the production target. When state must live on the host, it requires careful management.

- **Named volumes over bind mounts for data:** Named volumes (`docker volume create pgdata`) are managed by Docker, survive container removal, and can be backed by volume plugins (REX-Ray, Portworx, AWS EFS driver). Bind mounts (`-v /host/path:/container/path`) create implicit host dependencies and permission headaches.
- **Bind mounts are acceptable for configuration:** Read-only bind mounts of config files (`-v ./nginx.conf:/etc/nginx/nginx.conf:ro`) are a clean pattern for injecting environment-specific configuration without rebuilding images.
- **Backup strategy for named volumes:** Use a sidecar backup container that runs `docker run --rm --volumes-from <container> -v /backup:/backup alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz /data`. Schedule this in cron on the host or as a service.
- **tmpfs for ephemeral scratch space:** Mount `/tmp` and session stores as `tmpfs` -- they are fast (RAM-backed), automatically cleaned on container restart, and do not write sensitive data to disk. Set a size limit: `tmpfs: /tmp:size=100m`.
- **Database containers in production:** Only run database containers in production if you have strong operational expertise and a resilience plan (replication, automated backup, failover). For most teams, a managed database service (RDS, Cloud SQL, PlanetScale) is lower risk. If running Postgres in a container, use `postgres:16.2-alpine`, mount a named volume to `/var/lib/postgresql/data`, and configure WAL archiving.

### 8. Operationalize with Compose Profiles, Overrides, and Deploy Configuration

Structure Compose files to support multiple environments without duplication.

- **Base + override pattern:** Maintain a `docker-compose.yml` (base, production defaults), `docker-compose.override.yml` (local development overrides -- auto-loaded by `docker compose up`), and `docker-compose.prod.yml` (production-specific settings). Apply production settings with `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`.
- **Compose profiles:** Use profiles to define optional services. Tag observability tools (`prometheus`, `grafana`) and test utilities (`mailhog`, `pgadmin`) with `profiles: ["observability"]` or `profiles: ["tools"]`. Run `docker compose --profile observability up` to include them. Default `docker compose up` only starts core services.
- **Deploy key for Swarm/production resource constraints:** Use the `deploy:` block to specify replicas, resource limits, update config, and restart policy -- even if you are not using Swarm, this self-documents intended resource constraints.
- **Environment variable management:** Use a `.env` file for local development (exclude from version control with `.gitignore`). For production, inject variables through your secrets manager or CI/CD system. Define every expected variable with a default or comment in `docker-compose.yml` using `${VAR_NAME:-default_value}` syntax. Use `env_file:` only for non-secret config.
- **Image tagging strategy:** In Compose for production, always pin to a specific image tag that corresponds to a Git commit SHA or semantic version: `image: myapp:1.4.2-abc1234`. Never use `build: .` in production Compose files -- images should be pre-built and pushed to a registry by CI.

---

## Output Format

When producing Docker production pattern artifacts, deliver the following structure:

### Dockerfile (Multi-Stage Production Template)
```dockerfile
# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------
# Stage 1: Install production dependencies only
# ---------------------------------------------------------------
FROM node:20.11.1-alpine3.19 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Use ci for reproducible installs; omit devDependencies
RUN npm ci --omit=dev

# ---------------------------------------------------------------
# Stage 2: Build application artifacts
# ---------------------------------------------------------------
FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------------------------------------------------------------
# Stage 3: Minimal production runtime
# ---------------------------------------------------------------
FROM node:20.11.1-alpine3.19 AS runner
LABEL org.opencontainers.image.source="https://github.com/org/repo" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# Copy artifacts from previous stages
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/healthz || exit 1

CMD ["node", "dist/server.js"]
```

### docker-compose.yml (Production Base)
```yaml
version: "3.9"

services:
  app:
    image: ${REGISTRY:-ghcr.io}/org/myapp:${IMAGE_TAG:-latest}
    restart: unless-stopped
    networks:
      - frontend
      - backend
    ports:
      - "127.0.0.1:3000:3000"   # Bind to loopback; proxy handles external traffic
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}   # Injected at runtime, not stored in compose file
      LOG_LEVEL: ${LOG_LEVEL:-info}
    secrets:
      - api_key
    volumes:
      - type: tmpfs
        target: /tmp
        tmpfs:
          size: 104857600   # 100 MB
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: "0.75"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 256M
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
        order: start-first
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    read_only: true
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/healthz"]
      interval: 30s
      timeout: 5s
      start_period: 15s
      retries: 3

  proxy:
    image: caddy:2.8.4-alpine
    restart: unless-stopped
    networks:
      - frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true   # No external connectivity; only for service-to-service

volumes:
  caddy_data:
  caddy_config:

secrets:
  api_key:
    external: true   # Managed outside compose, injected by secrets manager
```

### Decision Matrix

| Factor | Alpine Base | Slim (Debian) | Distroless | UBI Minimal |
|---|---|---|---|---|
| Image size | 5-15 MB overhead | 70-100 MB overhead | Minimal | ~70 MB overhead |
| Shell available | Yes (ash) | Yes (bash/sh) | No | Yes (bash) |
| Package manager | apk | apt | None | dnf/microdnf |
| Attack surface | Low | Medium | Very low | Medium |
| Debug ease | Medium | High | Very hard | High |
| RHEL compliance | No | No | No | Yes |
| Recommended for | Most services | Services needing glibc | Security-critical services | Enterprise RHEL environments |

| Security Control | Implementation | Priority |
|---|---|---|
| Non-root user | `adduser --system` + `USER` directive | Critical |
| Read-only filesystem | `read_only: true` + tmpfs mounts | High |
| Capability drop | `cap_drop: [ALL]` | Critical |
| No new privileges | `security_opt: no-new-privileges:true` | Critical |
| Image pinning | Digest or patch version tag | High |
| Vulnerability scanning | Trivy in CI, weekly scheduled scans | High |
| Secret management | Docker Secrets or external vault | Critical |

---

## Rules

1. **NEVER use `latest` or floating tags in production.** Tag images with the Git commit SHA and semantic version: `myapp:1.4.2-abc1234`. Floating tags make rollback ambiguous and deployments non-deterministic. The image digest (`@sha256:...`) is the only truly immutable reference.

2. **NEVER run containers as root (UID 0) in production.** Create a dedicated system user in the Dockerfile. If an application refuses to run as non-root without code changes, fix the application -- do not accept root execution as a permanent state.

3. **NEVER store secrets in ENV instructions in the Dockerfile.** The `ENV` instruction bakes the value into the image layer history, which is visible via `docker history --no-trunc`. Use BuildKit secret mounts at build time and runtime secret injection (Docker Secrets, vault agent, environment injection from CI) at runtime.

4. **ALWAYS set memory limits on every production container.** An unlimited container can consume all host memory, causing the OOM killer to terminate other containers or the Docker daemon itself. For JVM applications, also set `-Xmx` to approximately 75% of the container memory limit to prevent heap expansion beyond the cgroup limit.

5. **ALWAYS define a HEALTHCHECK.** Without a health check, Docker and Compose report a container as "Up" as long as the process is alive, even if it is deadlocked or serving 500 errors. Health checks enable automatic restart of unhealthy containers and safe rolling updates.

6. **NEVER publish database or cache ports to the host network (0.0.0.0) in production.** Postgres (5432), Redis (6379), and Elasticsearch (9200) should only be accessible on internal Docker networks. If external access is needed for debugging, bind to `127.0.0.1` and use an SSH tunnel.

7. **ALWAYS use `docker compose -f base.yml -f override.yml` pattern for multi-environment management** rather than duplicating compose files. Duplication leads to configuration drift between environments -- the most common cause of "works in staging, fails in production" bugs.

8. **NEVER use bind mounts for application code in production.** Bind mounts couple the container to the host filesystem layout, break portability, and bypass the immutability contract of container images. Bind mounts are appropriate only for config files and local development hot-reloading.

9. **ALWAYS clean up in the same RUN layer as installation.** Package manager caches, temporary downloads, and apt lists must be removed in the same `RUN` instruction: `RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*`. Cleaning in a subsequent layer does not reduce image size.

10. **ALWAYS implement graceful shutdown handling.** Configure your application to handle `SIGTERM` and complete in-flight requests before exiting. Set `stop_grace_period: 30s` in Compose (or `--stop-timeout=30` at runtime) to give the application time to drain. Without this, rolling updates drop active requests.

---

## Edge Cases

**Java/JVM applications with container memory limits:**
JVM applications have historically been unaware of cgroup memory limits, causing heap sizing based on host RAM rather than container limits. This leads to OOM kills even when the container appears to have memory available. Use JDK 11+ (which has cgroup v2 awareness via `+UseContainerSupport`, enabled by default). Explicitly set `-XX:MaxRAMPercentage=75.0` instead of `-Xmx` to make heap size proportional to the container limit. Monitor actual heap usage with JVM metrics exposed via JMX exporter to Prometheus and tune the container limit based on observed p99 heap usage plus 25% headroom.

**Slow-starting applications (JVM, .NET, Python ML models):**
The default `start_period` of 0 seconds causes health check failures during legitimate startup, triggering restart loops before the application is ready. For JVM services, set `start_period: 60s`. For Python services loading large ML models (multi-GB), set `start_period: 120s` or more. Add a dedicated `/readiness` endpoint (distinct from `/healthiness`) that returns 200 only when the application is fully initialized -- use the readiness endpoint in Compose health checks and liveness checks separately in orchestration layers.

**Containers that need to access the Docker socket:**
Some containers (CI agents, monitoring tools like Portainer, security scanners) legitimately need access to `/var/run/docker.sock`. Mounting the Docker socket gives the container root-equivalent access to the host -- treat it as a full host compromise vector. Mitigations: use a Docker socket proxy (Tecnativa's Docker Socket Proxy) that limits which API endpoints are accessible; run the socket-accessing container on a dedicated host not running workloads; use rootless Docker mode where the socket is owned by a non-root user.

**Application writing to its own filesystem:**
Many legacy applications write logs, PID files, or session data to their own filesystem. When enabling `read_only: true`, these writes fail silently or crash the application. Audit with `strace -e trace=openat,open -p <pid>` on a running container to identify all write paths. Mount each write path as either a named volume (for persistence) or tmpfs (for ephemeral data). Common paths: `/tmp`, `/var/run`, `/var/log`, `/app/logs`, `/app/tmp`. Document every tmpfs mount with a size limit based on observed usage plus a 3x safety factor.

**Multi-architecture images (amd64 and arm64):**
Development on Apple Silicon (arm64) and deployment to x86_64 cloud instances requires multi-architecture image builds. Use Docker Buildx with `docker buildx build --platform linux/amd64,linux/arm64 --push`. Enable QEMU emulation on the CI host (`docker run --privileged --rm tonistiigi/binfmt --install all`) for cross-compilation. Note that some base images (older or vendor-specific) do not have arm64 variants -- verify with `docker manifest inspect <image>` before building. For Python ML images with native extensions (NumPy, PyTorch), cross-compilation is extremely slow -- use native arm64 runners (GitHub Actions M1 runners) for arm64 builds.

**Image layer caching in CI systems:**
Without cache configuration, CI builds pull all layers on every run, making Docker builds 3-10 minutes instead of 30 seconds. Implement BuildKit inline cache: `docker buildx build --cache-from type=registry,ref=ghcr.io/org/myapp:cache --cache-to type=registry,ref=ghcr.io/org/myapp:cache,mode=max`. Alternatively, use GitHub Actions cache with `type=gha` for cache-to/cache-from. Order Dockerfile instructions from least to most frequently changed: system packages first, dependency files and lock files second, application source code last. A `COPY package.json package-lock.json ./` followed by `RUN npm ci` should be a cache hit on 90%+ of builds.

**Filesystem permission conflicts between build and runtime users:**
When using multi-stage builds with a non-root runtime user, files copied from the builder stage retain the builder's ownership (typically root). Use `--chown=uid:gid` in every `COPY` instruction in the runtime stage: `COPY --from=builder --chown=1001:1001 /app/dist ./dist`. Alternatively, use `RUN chown -R appuser:appgroup /app` after all copies -- but this creates an extra layer. The `--chown` flag on COPY avoids the extra layer and is the preferred approach. For complex permission scenarios, validate with `docker run --rm myimage ls -la /app` during development.

**Resource limit tuning for containerized databases:**
Running Postgres or Redis in containers requires additional resource considerations beyond typical application containers. For Postgres: set `--shm-size=256m` (or a `tmpfs` mount at `/dev/shm` with the appropriate size) because Postgres uses shared memory for buffer management, and the default 64 MB Docker limit causes errors under write load. Set memory limits at 4x the `shared_buffers` Postgres configuration value (a common recommendation is `shared_buffers` = 25% of available RAM). For Redis: set `maxmemory` in `redis.conf` to 90% of the container memory limit and configure `maxmemory-policy allkeys-lru` to prevent Redis from exceeding the cgroup limit and being OOM-killed.

---

## Example

**Input:** "I have a Python FastAPI application currently running in development with a simple Dockerfile based on `python:3.11`. I need to move it to production. The app connects to a Postgres database, uses Redis for caching, reads an API key from an environment variable, and needs to handle about 500 requests per second. We have 2 engineers. Give me a production-ready setup."

**Output:**

Here is a complete production-ready Docker setup for your FastAPI application. I will address each concern: multi-stage build, secrets handling, resource limits, networking, health checks, and observability.

---

### Analysis of Current State

The `python:3.11` base image is approximately 900 MB -- far too large for production. It runs as root, contains the full Debian OS, pip cache, compilers, and test utilities. The API key in an environment variable is visible in `docker inspect` output and process listings.

For 500 RPS with FastAPI, you need at minimum 4 async workers (or 2 containers with 2 workers each for redundancy). A single Uvicorn process handles ~100-200 RPS depending on I/O wait.

---

### Dockerfile (Production Multi-Stage)

```dockerfile
# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------
# Stage 1: Build dependencies with build tools available
# ---------------------------------------------------------------
FROM python:3.12.3-slim-bookworm AS builder

# Install build dependencies for packages with C extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./

# Create virtualenv in /app/venv for easy copying to runtime stage
RUN python -m venv /app/venv && \
    /app/venv/bin/pip install --upgrade pip==24.0 && \
    /app/venv/bin/pip install --no-cache-dir -r requirements.txt

# ---------------------------------------------------------------
# Stage 2: Minimal production runtime
# ---------------------------------------------------------------
FROM python:3.12.3-slim-bookworm AS runner

LABEL org.opencontainers.image.source="https://github.com/org/myapi" \
      org.opencontainers.image.version="${BUILD_VERSION:-dev}"

# Install only runtime system dependencies (libpq for psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup --no-create-home appuser

WORKDIR /app

# Copy the virtualenv from builder -- no pip, no compiler in final image
COPY --from=builder --chown=appuser:appgroup /app/venv ./venv
COPY --chown=appuser:appgroup ./src ./src

# Activate virtualenv by prepending it to PATH
ENV PATH="/app/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONPATH=/app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:8000/healthz || exit 1

# 4 workers: (2 * CPU_cores) + 1 formula; pin at 4 for predictability
CMD ["uvicorn", "src.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4", \
     "--loop", "uvloop", \
     "--log-level", "warning", \
     "--no-access-log"]
```

**Why `python:3.12.3-slim-bookworm` instead of alpine?** Python on Alpine uses musl libc, which causes compatibility issues with many scientific and database packages (psycopg2, NumPy). `slim-bookworm` uses glibc, is ~70 MB (vs 900 MB full image), and avoids musl quirks. The final image will be approximately 120-150 MB.

---

### docker-compose.yml (Base -- version controlled)

```yaml
version: "3.9"

services:
  api:
    image: ${REGISTRY:-ghcr.io}/org/myapi:${IMAGE_TAG:?IMAGE_TAG must be set}
    restart: unless-stopped
    networks:
      - frontend
      - backend
    ports:
      - "127.0.0.1:8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://appuser:${DB_PASSWORD}@postgres:5432/myapp
      REDIS_URL: redis://redis:6379/0
      LOG_LEVEL: ${LOG_LEVEL:-warning}
      ENVIRONMENT: production
    secrets:
      - external_api_key
    read_only: true
    volumes:
      - type: tmpfs
        target: /tmp
        tmpfs:
          size: 52428800    # 50 MB
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
        reservations:
          cpus: "0.5"
          memory: 256M
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
        order: start-first
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    stop_grace_period: 30s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:16.2-alpine3.19
    restart: unless-stopped
    networks:
      - backend
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - pgdata:/var/lib/postgresql/data
    shm_size: "256m"   # Required for Postgres shared memory buffers
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser -d myapp"]
      interval: 10s
      timeout: 5s
      start_period: 30s
      retries: 5
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    image: redis:7.2.4-alpine3.19
    restart: unless-stopped
    networks:
      - backend
    command: >
      redis-server
      --maxmemory 200mb
      --maxmemory-policy allkeys-lru
      --save ""
      --appendonly no
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 256M
        reservations:
          cpus: "0.1"
          memory: 128M
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      start_period: 5s
      retries: 3
    logging:
      driver: json-file
      options:
        max-size: "5m"
        max-file: "2"

  proxy:
    image: caddy:2.8.4-alpine
    restart: unless-stopped
    networks:
      - frontend
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"   # HTTP/3 QUIC
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 128M
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true   # Postgres and Redis unreachable from outside

volumes:
  pgdata:
  caddy_data:
  caddy_config:

secrets:
  external_api_key:
    external: true   # Created via: docker secret create external_api_key ./api_key.txt
  db_password:
    external: true
```

---

### Caddyfile (TLS + Rate Limiting + Reverse Proxy)

```
myapp.example.com {
    reverse_proxy api:8000 {
        lb_policy round_robin
        health_uri /healthz
        health_interval 10s
    }

    rate_limit {
        zone dynamic {
            key {remote_host}
            events 100
            window 1s
        }
    }

    encode zstd gzip

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Frame-Options DENY
        X-Content-Type-Options nosniff
        -Server
    }

    log {
        output stdout
        format json
    }
}
```

---

### FastAPI Health Check Endpoint

Your application needs a `/healthz` endpoint that the HEALTHCHECK and Caddy probe. Here is a minimal implementation that checks real dependencies:

```python
# src/routes/health.py
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
import time

router = APIRouter()

@router.get("/healthz", include_in_schema=False)
async def healthcheck(db: AsyncSession, cache: Redis):
    checks = {}
    overall = "healthy"

    try:
        await db.execute("SELECT 1")
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {e}"
        overall = "degraded"

    try:
        await cache.ping()
        checks["cache"] = "ok"
    except Exception as e:
        checks["cache"] = f"error: {e}"
        overall = "degraded"

    http_status = status.HTTP_200_OK if overall == "healthy" \
        else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=http_status,
        content={"status": overall, "checks": checks, "timestamp": time.time()}
    )
```

---

### Secrets Setup (Pre-deployment)

Create Docker Secrets before deploying:

```bash
# Generate and store the external API key
echo "sk-live-abc123yourapikey" | docker secret create external_api_key -

# Generate a strong database password
openssl rand -base64 32 | docker secret create db_password -

# Verify secrets exist
docker secret ls
```

In your FastAPI application, read the secret from the Docker Secrets filesystem path:

```python
# src/config.py
from pathlib import Path

def _read_secret(name: str) -> str:
    """Read a Docker Secret from /run/secrets/<name>."""
    secret_path = Path(f"/run/secrets/{name}")
    if secret_path.exists():
        return secret_path.read_text().strip()
    # Fallback to environment variable for non-Swarm deployments
    import os
    return os.environ[name.upper()]

EXTERNAL_API_KEY = _read_secret("external_api_key")
```

---

### Deployment and Capacity Check

For 500 RPS with FastAPI + Uvicorn (4 async workers per container, 2 containers = 8 workers total):

| Configuration | Estimated RPS capacity | Notes |
|---|---|---|
| 1 container, 4 workers | 200-400 RPS | No redundancy |
| 2 containers, 4 workers each | 400-800 RPS | Meets 500 RPS with headroom |
| 2 containers, 4 workers + Redis cache | 800-1500 RPS | Cache hit reduces DB load |

With Redis caching frequently-accessed data and async database connections via `asyncpg`, 500 RPS is well within capacity for this stack. Monitor actual latency under load -- if p99 exceeds 100ms, add a third container replica before increasing worker count (more workers per process increases memory consumption without improving I/O-bound throughput).

---

### CI Image Build Pipeline (GitHub Actions snippet)

```yaml
- name: Build and push production image
  uses: docker/build-push-action@v5
  with:
    context: .
    platforms: linux/amd64
    push: true
    tags: |
      ghcr.io/org/myapi:${{ github.sha }}
      ghcr.io/org/myapi:${{ steps.semver.outputs.version }}
    cache-from: type=registry,ref=ghcr.io/org/myapi:cache
    cache-to: type=registry,ref=ghcr.io/org/myapi:cache,mode=max
    build-args: |
      BUILD_VERSION=${{ steps.semver.outputs.version }}

- name: Scan image for vulnerabilities
  run: |
    trivy image \
      --exit-code 1 \
      --severity CRITICAL \
      --ignore-unfixed \
      ghcr.io/org/myapi:${{ github.sha }}
```

This setup gives your two-engineer team a fully production-ready container configuration that addresses security (non-root, read-only filesystem, secrets management, no exposed database ports), reliability (health checks, restart policies, graceful shutdown), and capacity (2 replicas with 4 workers each, Redis caching, Caddy as TLS proxy and load balancer).
