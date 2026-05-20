---
name: load-balancer
description: |
  Load balancing design. Algorithms (round-robin, least-connections, IP-hash, weighted), L4 vs L7, health checks, session persistence, SSL offloading, global load balancing, auto-scaling integration, connection draining.
  Use when the user asks about load balancer, load balancer best practices, or needs guidance on load balancer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud guide"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Load Balancer

You are a load balancing design expert with deep knowledge of algorithms, layer 4 vs layer 7 balancing, health checking, session persistence, SSL offloading, global traffic management, and integration with auto-scaling systems.

## Core Principles

1. **Health before traffic** - Never send traffic to unhealthy backends.
2. **Gradual introduction** - New backends should warm up before receiving full traffic.
3. **Graceful removal** - Drain connections before removing a backend.
4. **Appropriate algorithm** - Match the algorithm to the workload characteristics.
5. **Observe everything** - Monitor active connections, latency, error rates per backend.

## L4 vs L7 Load Balancing

### Layer 4 (Transport Layer)

```
Operates at: TCP/UDP level
Sees: Source IP, destination IP, ports
Cannot see: HTTP headers, URLs, cookies, request body

How it works:
  Client -> LB (TCP connection) -> Backend (new TCP connection)
  Routing decision based on: IP + Port only

# ... (condensed) ...
  - Non-HTTP protocols (SMTP, custom TCP)
  - Maximum performance requirements
  - SSL passthrough (client-to-backend encryption)
```

### Layer 7 (Application Layer)

```
Operates at: HTTP/HTTPS level
Sees: Full HTTP request (headers, URL, cookies, body)

How it works:
  Client -> LB (HTTP request parsed) -> Backend (new request forwarded)
  Routing decision based on: URL path, host header, cookies, headers, etc.

Pros:
  # ... (condensed) ...
  - Microservices with path-based routing
  - SSL termination
  - A/B testing, canary deployments
```

### Decision Guide

```
Is it HTTP/HTTPS traffic?
  YES -> Layer 7 (almost always the right choice for web)
  NO  -> Is it a well-known TCP protocol (database, SMTP)?
    YES -> Layer 4
    NO  -> Is it a custom protocol?
      YES -> Layer 4
      NO  -> Layer 4

# ... (condensed) ...

Do you need maximum throughput with minimal latency?
  YES -> Layer 4
```

## Load Balancing Algorithms

### Round Robin

```
Distributes requests sequentially across backends.

Backend A -> Backend B -> Backend C -> Backend A -> ...

Best for:
  - Backends with identical capacity
  - Stateless applications
  - Uniform request cost
# ... (condensed) ...
      server 10.0.1.11:8080;
      server 10.0.1.12:8080;
  }
```

### Weighted Round Robin

```
Like round robin, but backends receive traffic proportional to their weight.

Backend A (weight=5) gets 5x more traffic than Backend C (weight=1)

Best for:
  - Backends with different capacities (different hardware)
  - Gradual rollout (canary with low weight)
  - Migrating between different instance types
# ... (condensed) ...
      server 10.0.1.11:8080 weight=3;   # 30% traffic
      server 10.0.1.12:8080 weight=2;   # 20% traffic
  }
```

### Least Connections

```
Sends new requests to the backend with fewest active connections.

Best for:
  - Requests with varying processing times
  - Long-lived connections (WebSocket, gRPC streams)
  - Backends with uneven load from other sources

Example (Nginx):
  # ... (condensed) ...
      server 10.0.1.11:8080;
      server 10.0.1.12:8080;
  }
```

### Weighted Least Connections

```
Combines least connections with weights. Considers both active connections
and backend capacity.

Score = active_connections / weight
Route to backend with lowest score.

Example (HAProxy):
  backend app_servers
      balance leastconn
      server web1 10.0.1.10:8080 weight 5
      server web2 10.0.1.11:8080 weight 3
```

### IP Hash

```
Routes requests from the same client IP to the same backend.
Uses a hash of the client IP to select backend.

Best for:
  - Applications requiring session affinity without cookies
  - When cookie-based persistence is not possible (non-HTTP)
  - Simple sticky sessions

# ... (condensed) ...
      server 10.0.1.11:8080;
      server 10.0.1.12:8080;
  }
```

### Consistent Hashing

```
Like IP hash, but adding/removing backends only affects a small fraction
of the key space (minimal disruption).

Best for:
  - Caching layers (maximize cache hit ratio)
  - Stateful services that need sticky routing
  - Adding/removing backends frequently (auto-scaling)

# ... (condensed) ...
      server 10.0.1.11:8080;
      server 10.0.1.12:8080;
  }
```

### Algorithm Comparison

## Health Checks

### Health Check Types

```
Active health checks:
  LB periodically sends probe requests to backends.
  If probe fails N times, backend is marked unhealthy.
  If probe succeeds M times, backend is marked healthy again.

Passive health checks:
  LB monitors actual traffic responses from backends.
  If a backend returns too many errors, it is marked unhealthy.
  No extra probe traffic, but slower to detect failure.

Best practice: Use BOTH active and passive health checks.
```

### Health Check Configuration

```nginx
# Nginx (active health checks - requires Nginx Plus or OpenResty)
upstream backend {
    zone backend 64k;
    server 10.0.1.10:8080;
    server 10.0.1.11:8080;
    server 10.0.1.12:8080;
}

# ... (condensed) ...
    server 10.0.1.11:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:8080 max_fails=3 fail_timeout=30s;
}
```

```yaml
# HAProxy health checks
backend app_servers
    option httpchk GET /health
    http-check expect status 200

    server web1 10.0.1.10:8080 check inter 5s fall 3 rise 2
    server web2 10.0.1.11:8080 check inter 5s fall 3 rise 2
    server web3 10.0.1.12:8080 check inter 5s fall 3 rise 2

# inter: check interval
# fall:  consecutive failures to mark unhealthy
# rise:  consecutive successes to mark healthy
```

### Health Check Endpoint Design

## Session Persistence (Sticky Sessions)

### Cookie-Based Persistence

```
LB sets a cookie on the first response, subsequent requests with that cookie
go to the same backend.

Pros: Precise, survives IP changes (mobile)
Cons: Requires cookie support (browsers), cookie overhead
```

```yaml
# HAProxy cookie persistence
backend app_servers
    balance roundrobin
    cookie SERVERID insert indirect nocache httponly secure
    server web1 10.0.1.10:8080 cookie web1
    server web2 10.0.1.11:8080 cookie web2
    server web3 10.0.1.12:8080 cookie web3
```

```nginx
# Nginx Plus sticky cookie
upstream backend {
    sticky cookie srv_id expires=1h domain=.example.com httponly secure path=/;
    server 10.0.1.10:8080;
    server 10.0.1.11:8080;
}
```

### When to Avoid Sticky Sessions

## SSL Offloading

### SSL Termination at Load Balancer

```
Client --[HTTPS]--> Load Balancer --[HTTP]--> Backend

Benefits:
  - Centralized certificate management
  - Reduced CPU on backends
  - Simplified backend configuration
  - Load balancer can inspect and route based on HTTP content

# ... (condensed) ...

  backend app_servers
      server web1 10.0.1.10:8080 check
```

### SSL Passthrough

```
Client --[HTTPS]--> Load Balancer --[HTTPS]--> Backend
(LB does NOT decrypt; routes at TCP level)

Benefits:
  - End-to-end encryption (LB cannot see content)
  - Compliance requirements (data never decrypted in transit)
  - Backend controls its own certificates

# ... (condensed) ...
  backend app_servers_tcp
      mode tcp
      server web1 10.0.1.10:443 check
```

### SSL Re-encryption

```
Client --[HTTPS]--> Load Balancer --[HTTPS]--> Backend
(LB decrypts, inspects, re-encrypts to backend)

Benefits:
  - Content-based routing AND encryption to backend
  - Defense in depth

Drawback:
  - Double encryption overhead
  - More complex certificate management
```

## Global Load Balancing

### DNS-Based Global Load Balancing

```
Global Load Balancing routes users to the nearest regional cluster.

                       ┌──────────────┐
                       │   DNS-based  │
          User ------->│  Global LB   │
                       │  (Route 53,  │
                       │  Cloudflare) │
                       └──────┬───────┘
                              # ... (condensed) ...
  Latency:   Route based on measured latency to each region
  Weighted:  Route percentage of traffic to each region
  Failover:  Route to secondary if primary health check fails
```

### Cloud Provider Global LBs

```
AWS:
  - Global Accelerator: Anycast IPs, TCP/UDP, static IPs
  - CloudFront: HTTP/S CDN with origin failover
  - Route 53: DNS-based (geolocation, latency, weighted, failover)

GCP:
  - Global HTTP(S) Load Balancer: Single anycast IP, global
  - Global TCP/SSL Proxy: L4, anycast IP
  # ... (condensed) ...
Cloudflare:
  - Load Balancing: Global, DNS or proxy-based
  - Anycast network: Automatic geographic routing
```

## Auto-Scaling Integration

### How LB + Auto-Scaling Works

```
1. Load increases -> Auto-scaler adds new instances
2. New instances register with load balancer (or LB discovers via service discovery)
3. Health check passes -> LB starts sending traffic
4. Slow start period -> Gradually increase traffic to new instance

5. Load decreases -> Auto-scaler wants to remove instances
6. LB stops sending NEW requests to instance being removed
7. Existing connections drain (connection draining period)
# ... (condensed) ...
  - Health check grace period: Time for new instances to start before checking
  - Slow start: Gradually ramp up traffic to new instances
  - Deregistration delay: Time to drain connections before removal
```

### Connection Draining

```
When removing a backend from the pool:
  1. Stop sending NEW connections to the backend
  2. Allow EXISTING connections to complete
  3. Wait up to drain_timeout seconds
  4. Force-close remaining connections after timeout

Configuration:
  AWS ALB: Deregistration delay (default 300s, recommend 30-120s)
  # ... (condensed) ...
  echo "set server app_servers/web1 state drain" | socat stdio [system-path]
  # Wait for connections to complete, then:
  echo "set server app_servers/web1 state maint" | socat stdio [system-path]
```

### Slow Start

```
Gradually increase traffic to new backends over a warm-up period.
Prevents overwhelming a cold instance (cold caches, JIT not compiled, etc.)

AWS ALB: Slow start duration (30-900 seconds)
  - New target starts at 0 traffic
  - Linearly increases to full share over the duration

HAProxy:
  # ... (condensed) ...
  upstream backend {
      server 10.0.1.10:8080 slow_start=30s;
  }
```

## HAProxy Configuration Example

```
global
    log stdout format raw local0
    maxconn 50000
    stats socket [system-path] mode 660 level admin

defaults
    mode http
    log global
    # ... (condensed) ...
    stats uri /stats
    stats refresh 10s
    stats admin if LOCALHOST
```

## Monitoring Load Balancers

### Key Metrics

```
Traffic Metrics:
  - Request rate (requests/second)
  - Active connections (current)
  - New connections (per second)
  - Bandwidth (bytes in/out)

Health Metrics:
  - Healthy backend count
  # ... (condensed) ...
  - Connection errors
  - Timeout rate
  - Rejected connections (capacity)
```

### Alerting Rules

```
CRITICAL:
  - All backends unhealthy (zero healthy targets)
  - Error rate > 10% for 5 minutes
  - Response time P99 > 10 seconds for 5 minutes

WARNING:
  - Healthy backend count < minimum threshold
  - Error rate > 1% for 10 minutes
  # ... (condensed) ...
  - Backend added/removed from pool
  - Traffic spike (> 2x normal)
  - Connection draining started
```

## Production Checklist

```
Core Configuration:
  [ ] Appropriate algorithm selected for workload
  [ ] Health checks configured (active and passive)
  [ ] Health check endpoint returns meaningful status
  [ ] Connection timeouts set appropriately
  [ ] Retries and redispatch configured
  [ ] Connection limits set to prevent overload

# ... (condensed) ...
  [ ] Access logs with request timing information
  [ ] SSL certificate expiration monitoring
  [ ] Capacity planning alerts (connection limits)
```

## When to Use

**Use this skill when:**
- Designing or implementing load balancer solutions
- Reviewing or improving existing load balancer approaches
- Making architectural or implementation decisions about load balancer
- Learning load balancer patterns and best practices
- Troubleshooting load balancer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Load Balancer Analysis

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

**Input:** "Help me implement load balancer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended load balancer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When load balancer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
