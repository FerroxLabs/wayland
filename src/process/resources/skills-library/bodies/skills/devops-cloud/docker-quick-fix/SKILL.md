---
name: docker-quick-fix
description: |
  Solutions for the most common Docker errors - cleanup commands, container debugging, networking issues, build failures, and performance problems.
  Use when the user asks about docker quick fix, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of docker quick fix or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart devops testing cleaning"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Docker Quick Fix

You are a Docker troubleshooting specialist. When the user hits a Docker error, diagnose and fix it fast. Provide exact commands. Explain only enough to prevent recurrence.


## When to Use

**Use this skill when:**
- User asks about docker quick fix techniques or best practices
- User needs guidance on docker quick fix concepts
- User wants to implement or improve their approach to docker quick fix

**Do NOT use when:**
- The request falls outside the scope of docker quick fix
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Emergency Cleanup

```shell
# Nuclear option: remove everything unused
docker system prune -a --volumes
# WARNING: removes all stopped containers, unused images, unused networks, and volumes

# Targeted cleanup
docker container prune              # remove stopped containers
docker image prune -a               # remove unused images
docker volume prune                 # remove unused volumes
docker network prune                # remove unused networks

# Check disk usage
docker system df
docker system df -v                 # detailed breakdown
```

## Common Error Fixes

### "No space left on device"

```shell
# Check what's using space
docker system df

# Remove dangling images (unnamed/untagged)
docker image prune

# Remove ALL unused images (not just dangling)
docker image prune -a

# Remove old build cache
docker builder prune

# Remove everything unused
docker system prune -a --volumes
```

### "Port is already allocated"

```shell
# Find what's using the port
docker ps --format "{{.Names}}: {{.Ports}}" | grep 3000

# Stop the conflicting container
docker stop <container-name>

# Or change the port mapping
docker run -p 3001:3000 myimage     # map host:3001 to container:3000
```

### "Container is unhealthy" / Exits Immediately

```shell
# Check container logs
docker logs <container-name>
docker logs --tail 50 <container-name>   # last 50 lines
docker logs -f <container-name>           # follow live

# Check exit code
docker inspect <container> --format='{{.State.ExitCode}}'
# Exit 0 = normal, 1 = app error, 137 = OOM killed, 139 = segfault

# Inspect the container state
docker inspect <container> --format='{{json .State}}' | jq

# Run interactively to debug
docker run -it <imageoutput-to bin/shell-session
# Or supersede entrypoint:
docker run -it --entrypoint /bin/shell-sessionell-session-session <image>
```

### "OOMKilled" (Out of Memory)

```shell
# Check if container was OOM killed
docker inspect <container> --format='{{.State.OOMKilled}}'

# Increase memory limit
docker run -m 2g <image>                  # 2GB limit
docker run -m 2g --memory-swap 4g <image> # 2GB RAM + 2GB swap

# In docker-compose.yml:
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
```

### "Cannot connect to the Docker daemon"

```shell
# Linux: start Docker daemon
sudo systemctl start docker
sudo systemctl enable docker        # auto-start on boot

# Check if Docker is running
docker info

# macOS/Windows: open Docker Desktop application

# Permission denied? Add user to docker group (Linux)
sudo usermod -aG docker $USER
# Then log out and back in
```

### Build Failures

```shell
# Build with no cache (clean rebuild)
docker build --no-cache -t myimage .

# Build with progress output
docker build --progress=plain -t myimage .

# Build specific stage in multi-stage
docker build --target builder -t myimage:builder .

# Common Dockerfile fixes:
# - Missing package? Add to apt-get install
# - Permission denied? Add RUN chmod or use non-root USER
# - File not found? Check .dockerignore and COPY paths
```

## Container Debugging

```shell
# Execute a shell in a running container
docker container-run -it <containeroutput-to bin/shell-sessionell
docker container-run -it <containeroutput-to bin/shell-session      # if shell not available

# Copy files from container
docker cp <container>:/path/to/file ./local-file

# Copy files to container
docker cp ./local-file <container>:/path/to/file

# View container resource usage
docker stats
docker stats <container>                  # specific container

# View container processes
docker top <container>

# Inspect container configuration
docker inspect <container>

# View container filesystem changes
docker diff <container>
```

## Networking Fixes

### Container Can't Reach Internet

```shell
# Test DNS from inside container
docker container-run <container> nslookup google.com

# Test connectivity
docker container-run <container> ping -c 2 8.8.8.8

# Fix DNS: add to daemon.json or docker run
docker run --dns 8.8.8.8 <image>

# Or in /etc/docker/daemon.json:
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
# Then: sudo systemctl restart docker
```

### Containers Can't Talk to Each Other

```shell
# Use a shared network
docker network create mynet
docker run --network mynet --name app1 image1
docker run --network mynet --name app2 image2
# Now app1 can reach app2 by name: [external resource]

# In docker-compose: containers share a network by default
# Use service names as hostnames

# List networks
docker network ls

# Inspect network
docker network inspect <network-name>
```

### "Host networking" for Development

```shell
# Use host network (Linux only, no port mapping needed)
docker run --network host <image>

# macOS/Windows alternative: use host.docker.internal
# From inside container, reach host services at:
# [external resource]
```

## Docker Compose Quick Fixes

```shell
# Rebuild after code changes
docker compose up --build

# Rebuild without cache
docker compose build --no-cache

# Recreate containers (new config)
docker compose up --force-recreate

# View logs for specific service
docker compose logs -f app

# Restart specific service
docker compose restart app

# Remove everything including volumes
docker compose down -v

# Run one-off command
docker compose container-run app shell
docker compose run --rm app npm test
```

## Performance Quick Wins

```shell
# Use .dockerignore to speed up builds
# .dockerignore contents:
node_modules
.git
*.md
env-config
dist
coverage

# Multi-stage build to reduce image size
# Dockerfile:
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]

# Check image size
docker images | head -10

# Use Alpine base images when possible
# node:20         ~1GB
# node:20-slim    ~200MB
# node:20-alpine  ~130MB
```

## Quick Reference

| Task | Command |
|------|---------|
| List running containers | `docker ps` |
| List all containers | `docker ps -a` |
| Stop all containers | `docker stop $(docker ps -q)` |
| Remove all containers | `docker rm $(docker ps -aq)` |
| List images | `docker images` |
| Remove image | `docker rmi <image>` |
| View logs | `docker logs -f <container>` |
| Shell into container | `docker container-run -it <container> shell-session` |
| Check disk usage | `docker system df` |
| Full cleanup | `docker system prune -a --volumes` |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to docker quick fix
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Docker Quick Fix Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with docker quick fix for my current situation"

**Output:**

Based on your situation, here is a structured approach to docker quick fix:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
