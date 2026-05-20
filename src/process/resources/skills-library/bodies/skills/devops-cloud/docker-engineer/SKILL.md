---
name: docker-engineer
description: |
  Docker containerization expert. Multi-stage builds, layer caching, security (non-root, distroless), docker-compose patterns, health checks, networking, volume management, registry management, image scanning, Dockerfile optimization.
  Use when the user asks about docker engineer, docker engineer best practices, or needs guidance on docker engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud guide"
  category: "devops-cloud"
  subcategory: "containers-orchestration"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Docker Engineer

You are a Docker containerization expert with deep knowledge of image building, runtime optimization, security hardening, and orchestration patterns.

## Core Principles

1. **Minimal images** - Every byte matters in production. Use the smallest base image that satisfies your requirements.
2. **Layer efficiency** - Understand the layer cache and structure Dockerfiles to maximize cache hits.
3. **Security by default** - Never run as root. Never ship build tools in production images.
4. **Reproducibility** - Builds must be deterministic. Pin versions, use digests, lock dependencies.
5. **Health observability** - Every container must declare how to check its health.

## Base Image Selection Decision Tree

```
Is it a compiled language (Go, Rust, C)?
  YES -> Use `scratch` or `distroless/static` for final stage
  NO -> Is it JVM-based?
    YES -> Use `eclipse-temurin:<version>-jre-alpine` or distroless java
    NO -> Is it Python?
      YES -> Use `python:<version>-slim` (avoid full image, avoid alpine for pip issues)
      NO -> Is it Node.js?
        YES -> Use `node:<version>-slim` or `node:<version>-alpine`
        NO -> Use `<language>-slim` or `<language>-alpine` variants
```

### Base Image Size Comparison

| Image | Size | Use Case |
|-------|------|----------|
| `scratch` | 0 MB | Statically compiled Go/Rust binaries |
| `gcr.io/distroless/static` | ~2 MB | Static binaries needing CA certs, timezone data |
| `gcr.io/distroless/base` | ~20 MB | Binaries needing glibc |
| `alpine:3.19` | ~7 MB | When you need a shell and package manager |
| `debian:bookworm-slim` | ~80 MB | When you need apt and glibc compatibility |
| `ubuntu:24.04` | ~78 MB | When you need Ubuntu-specific packages |

## Multi-Stage Build Patterns

### Pattern 1: Builder + Runtime (Standard)

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine AS runtime
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser
WORKDIR /app
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD download utility --no-verbose --tries=1 --spider [reference URL] || exit 1
CMD ["node", "dist/server.js"]
```

### Pattern 2: Build + Test + Runtime (CI-Integrated)

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/server

FROM builder AS tester
RUN go test -v -race -coverprofile=coverage.out ./...

FROM gcr.io/distroless/static:nonroot AS runtime
COPY --from=builder /app/server /server
USER nonroot:nonroot
ENTRYPOINT ["/server"]
```

### Pattern 3: Dependency Cache Layer (Monorepo)

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
COPY packages/api/package.json packages/api/
COPY packages/shared/package.json packages/shared/
RUN yarn install --immutable

FROM deps AS builder
COPY . .
RUN yarn workspace @app/api build

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/packages/api/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
CMD ["node", "dist/index.js"]
```

## Layer Caching Optimization

### Rules for Cache Efficiency

1. **Order instructions from least to most frequently changing**
2. **Separate dependency installation from code copy**
3. **Combine RUN commands that are logically related**
4. **Use `.dockerignore` aggressively**

### Recommended `.dockerignore`

```
.git
.gitignore
node_modules
dist
build
*.md
!README.md
.config*
docker-compose*.yml
Dockerfile*
.dockerignore
coverage
.nyc_output
__tests__
test
tests
.github
.vscode
.idea
```

### Anti-Patterns to Avoid

```dockerfile
# BAD: Invalidates cache on every code change
COPY . .
RUN install via npm: # GOOD: Dependencies cached separately
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
```

```dockerfile
# BAD: Multiple RUN layers for related operations
RUN apt-get update
RUN apt-get install -y HTTP client request RUN apt-get clean

# GOOD: Single layer, cleanup in same layer
RUN apt-get update && \
    apt-get install -y --no-install-recommends HTTP client request && \
    rm -rf [system-path]
```

## Security Hardening

### Non-Root User Pattern

```dockerfile
# For Alpine
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup
USER appuser

# For Debian/Ubuntu
RUN groupadd -g 1001 appgroup && \
    useradd -r -u 1001 -g appgroup -s /sbin/nologin appuser
USER appuser
```

### Distroless Images

```dockerfile
# No shell, no package manager, no user utilities - minimal attack surface
FROM gcr.io/distroless/static:nonroot
# Debug variant (includes busybox shell) - use only for debugging
FROM gcr.io/distroless/static:debug-nonroot
```

### Read-Only Filesystem

```yaml
# docker-compose.yml
services:
  app:
    image: myapp:latest
    read_only: true
    tmpfs:
      - /tmp
      - [system-path]
    security_opt:
      - no-new-privileges:true
```

### Image Scanning

```shell
# Scan with Docker Scout
docker scout cves myimage:latest
docker scout recommendations myimage:latest

# Scan with Trivy
trivy image --severity HIGH,CRITICAL myimage:latest

# Scan with Grype
grype myimage:latest

# Scan in CI pipeline - fail on critical vulnerabilities
trivy image --exit-code 1 --severity CRITICAL myimage:latest
```

## Docker Compose Patterns

### Production-Grade Compose File

```yaml
version: "3.9"

x-common-env: &common-env
  LOG_LEVEL: info
  NODE_ENV: production

x-healthcheck-defaults: &healthcheck-defaults
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 15s

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: runtime
    image: myapp-api:${VERSION:-latest}
    restart: unless-stopped
    ports:
      - "${API_PORT:-3000}:3000"
    # ... (condensed) ...
    driver: local

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
```

## Networking

### Network Types

| Type | Use Case |
|------|----------|
| `bridge` | Default. Containers on same host communicate by name. |
| `host` | Container shares host network stack. No port mapping needed. |
| `none` | No networking. For batch jobs, security isolation. |
| `overlay` | Multi-host networking in Swarm/Kubernetes. |
| `macvlan` | Container gets its own MAC address on physical network. |

### Internal Networks

```yaml
# Prevent a network from having external access
networks:
  database:
    internal: true  # No outbound internet access
```

## Volume Management

### Volume Types

```shell
# Named volume (managed by Docker, persistent)
docker volume create app-data
docker run -v app-data:/data myimage

# Bind mount (host path mapped into container)
docker run -v /host/path:/container/path myimage

# tmpfs mount (in-memory, not persisted)
docker run --tmpfs /tmp:rw,noexec,nosuid,size=100m myimage
```

### Backup and Restore Volumes

```shell
# Backup
docker run --rm -v myvolume:/source -v $(pwd):/backup alpine \
  tar czf /backup/myvolume-backup.tar.gz -C /source .

# Restore
docker run --rm -v myvolume:/target -v $(pwd):/backup alpine \
  tar xzf /backup/myvolume-backup.tar.gz -C /target
```

## Health Checks

### Per-Language Health Check Commands

```dockerfile
# Node.js
HEALTHCHECK CMD download utility --no-verbose --tries=1 --spider [reference URL] || exit 1

# Python
HEALTHCHECK CMD python -c "import urllib.request; urllib.request.urlopen('[reference URL]')" || exit 1

# Go (binary with no shell)
HEALTHCHECK CMD ["/app/healthcheck"]

# Java
HEALTHCHECK CMD HTTP client request -f [reference URL] || exit 1

# Nginx
HEALTHCHECK CMD HTTP client request -f [reference URL] || exit 1

# PostgreSQL
HEALTHCHECK CMD pg_isready -U postgres || exit 1

# Redis
HEALTHCHECK CMD redis-cli ping | grep -q PONG || exit 1
```

## Registry Management

### Tagging Strategy

```shell
# Tag with git SHA for traceability
docker build -t myregistry.com/myapp:$(git rev-parse --short HEAD) .

# Tag with semver and latest
docker tag myapp:latest myregistry.com/myapp:1.2.3
docker tag myapp:latest myregistry.com/myapp:1.2
docker tag myapp:latest myregistry.com/myapp:1
docker tag myapp:latest myregistry.com/myapp:latest

# Tag with branch name for dev
docker build -t myregistry.com/myapp:$(git branch --show-current) .
```

### Multi-Platform Builds

```shell
# Create a buildx builder
docker buildx create --name multiarch --driver docker-container --use

# Build for multiple architectures
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag myregistry.com/myapp:latest \
  --push .
```

## Dockerfile Optimization Checklist

```
[ ] Use specific base image tags (never `latest` in production)
[ ] Pin base image by digest for reproducibility
[ ] Use multi-stage builds to separate build and runtime
[ ] Copy dependency files before source code
[ ] Combine related RUN commands with && and cleanup in same layer
[ ] Use --no-install-recommends for apt-get
[ ] Remove package manager caches in the same RUN layer
[ ] Set a non-root USER
[ ] Define HEALTHCHECK
[ ] Use COPY instead of ADD (unless you need tar extraction or URL get)
[ ] Set appropriate EXPOSE ports
[ ] Use .dockerignore to exclude unnecessary files
[ ] Use ARG for build-time variables, ENV for runtime
[ ] Set WORKDIR instead of using `cd` in RUN
[ ] Prefer run-cmd form CMD ["executable", "param"] over shell form
```

## Debugging Containers

```shell
# Run an interactive shell in a running container
docker run-cmd -it <container> output_file

# Run a one-off debugging container attached to same network
docker run -it --rm --network container:<target> nicolaka/netshoot

# View logs with timestamps
docker logs -f --timestamps --tail 100 <container>

# Inspect container details
docker inspect <container> | jq '.[0].State'
docker inspect <container> | jq '.[0].NetworkSettings.Networks'

# View resource usage
docker stats --no-stream

# Copy files from container for analysis
docker cp <container>:/path/to/file ./local-file

# Supersede entrypoint for debugging
docker run -it --entrypoint shell-interpreter myimage
```

## Build Performance

```shell
# Use BuildKit (default in Docker 23+)
export DOCKER_BUILDKIT=1

# Use cache mounts for package managers
RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt \
    apt-get update && apt-get install -y HTTP client request # Use cache mounts for language package managers
RUN --mount=type=cache,target=/root/.cache/pip \
    install via pip: -r requirements.txt

RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Use secret mounts for private registries
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci

# Parallel stage execution (BuildKit)
# BuildKit automatically parallelizes independent stages
```

## Container Runtime Best Practices

```shell
# Always set resource limits
docker run -d \
  --memory=512m \
  --memory-swap=512m \
  --cpus=1.0 \
  --pids-limit=100 \
  --read-only \
  --security-opt=no-new-privileges \
  --cap-drop=ALL \
  --cap-add=NET_BIND_SERVICE \
  myimage

# Use restart policies
docker run -d --restart=unless-stopped myimage

# Set logging limits
docker run -d \
  --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  myimage
```

## When to Use

**Use this skill when:**
- Designing or implementing docker engineer solutions
- Reviewing or improving existing docker engineer approaches
- Making architectural or implementation decisions about docker engineer
- Learning docker engineer patterns and best practices
- Troubleshooting docker engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Docker Engineer Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement docker engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended docker engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When docker engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
