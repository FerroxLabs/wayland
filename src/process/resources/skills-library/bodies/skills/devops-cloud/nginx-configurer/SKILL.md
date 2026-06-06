---
name: nginx-configurer
description: |
  Nginx configuration. Reverse proxy setup, load balancing, SSL termination, caching headers, gzip compression, rate limiting, security headers, location block patterns, upstream configuration, performance tuning.
  Use when the user asks about nginx configurer, nginx configurer best practices, or needs guidance on nginx configurer implementation.
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
  difficulty: "intermediate"
---

# Nginx Configurer

You are an Nginx configuration expert with deep knowledge of reverse proxy patterns, load balancing, SSL/TLS termination, security hardening, caching, and performance optimization.

## Core Principles

1. **Minimal configuration** - Start simple, add complexity only when needed.
2. **Security by default** - Restrictive headers, rate limiting, no information disclosure.
3. **Performance first** - Connection reuse, compression, caching, buffer tuning.
4. **Test before reload** - Always `nginx -t` before `nginx -s reload`.
5. **Log everything** - Structured access logs with upstream timing.

## Configuration Structure

```
[system-path]
  nginx.conf                    # Main config (worker processes, events, http block)
  conf.d/                       # Auto-included server blocks
    default.conf
    app.conf
    api.conf
  snippets/                     # Reusable configuration fragments
    ssl-params.conf
    security-headers.conf
    proxy-params.conf
    gzip.conf
  sites-available/              # Available site configs (Debian/Ubuntu)
  sites-enabled/                # Symlinks to enabled configs
  ssl/                          # SSL certificates
    example.com.crt
    example.com.key
    dhparam.pem
```

## Main Configuration (nginx.conf)

```nginx
user nginx;
worker_processes auto;
worker_rlimit_nofile 65535;
pid /run/nginx.pid;

error_log [system-path] warn;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
# ... (condensed) ...
    # Includes
    include [system-path]
    include [system-path]
}
```

## Reverse Proxy Setup

### Basic Reverse Proxy

```nginx
upstream app_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name app.example.com;
    return 301 [reference URL]
}

# ... (condensed) ...
        include snippets/proxy-params.conf;
        proxy_pass [reference URL]
    }
}
```

### Proxy Parameters Snippet

```nginx
# snippets/proxy-params.conf
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Request-ID $request_id;
proxy_set_header Connection "";

proxy_connect_timeout 10s;
proxy_send_timeout 30s;
# ... (condensed) ...

proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
proxy_next_upstream_timeout 10s;
proxy_next_upstream_tries 3;
```

### WebSocket Proxy

```nginx
location /ws {
    proxy_pass [reference URL]
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 86400s;     # Keep WebSocket alive
    proxy_send_timeout 86400s;
}
```

## Load Balancing

### Upstream Configuration

```nginx
# Round-robin (default)
upstream backend {
    server 10.0.1.10:8080;
    server 10.0.1.11:8080;
    server 10.0.1.12:8080;
    keepalive 32;
}

# Weighted round-robin
upstream backend_weighted {
    server 10.0.1.10:8080 weight=5;     # 5x more traffic
    # ... (condensed) ...
    server 10.0.1.12:8080 backup;       # Only used when others are down
    server 10.0.1.13:8080 down;         # Marked as permanently offline
    keepalive 32;
}
```

## SSL/TLS Termination

### SSL Parameters Snippet

```nginx
# snippets/ssl-params.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;

# OCSP stapling
ssl_stapling on;
# ... (condensed) ...
resolver_timeout 5s;

# DH parameters (generate: openssl dhparam -out [system-path] 2048)
ssl_dhparam [system-path]
```

### Let's Encrypt with Certbot

```nginx
# Initial setup for ACME challenge
server {
    listen 80;
    server_name example.com www.example.com;

    location /.well-known/acme-challenge/ {
        root [system-path]
    }

    location / {
        return 301 [reference URL]
    }
}
```

```shell
# Obtain certificate
certbot certonly --webroot -w [system-path] \
  -d example.com -d www.example.com \
  --email admin@example.com --agree-tos

# Auto-renewal (crontab)
0 3 * * * certbot renew --quiet --post-hook "nginx -s reload"
```

## Caching

### Proxy Cache Configuration

```nginx
http {
    # Define cache zone
    proxy_cache_path [system-path]
        levels=1:2
        keys_zone=app_cache:10m       # 10MB for keys (enough for ~80,000 keys)
        max_size=1g                    # 1GB disk cache
        inactive=60m                   # Remove after 60 min of no access
        use_temp_path=off;

    server {
        location /api/ {
            # ... (condensed) ...
            add_header X-Cache-Status $upstream_cache_status;
        }
    }
}
```

### Static File Caching Headers

```nginx
# Immutable assets (hashed filenames)
location /static/ {
    alias [system-path]
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
    access_log off;
}

# HTML pages (check for updates)
location ~* \.html$ {
    # ... (condensed) ...
location /api/ {
    add_header Cache-Control "no-store, no-cache, must-revalidate";
    proxy_pass [reference URL]
}
```

## Gzip Compression

```nginx
# snippets/gzip.conf
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 4;              # 4 is good balance of CPU vs compression
gzip_min_length 256;
gzip_types
    application/atom+xml
    application/geo+json
    application/javascript
    application/json
    # ... (condensed) ...
    text/markdown
    text/plain
    text/vcard
    text/xml;
```

## Rate Limiting

```nginx
http {
    # Define rate limit zones
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    limit_req_zone $server_name zone=server_total:10m rate=1000r/s;

    # Custom error page for rate-limited requests
    limit_req_status 429;

    server {
        # ... (condensed) ...
            proxy_pass [reference URL]
        }
    }
}
```

### Connection Limiting

```nginx
http {
    limit_conn_zone $binary_remote_addr zone=per_ip:10m;
    limit_conn_zone $server_name zone=per_server:10m;

    server {
        limit_conn per_ip 100;              # Max 100 connections per IP
        limit_conn per_server 10000;        # Max 10,000 total connections
        limit_conn_status 503;
    }
}
```

## Security Headers

```nginx
# snippets/security-headers.conf
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "0" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'self';" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# Hide server information
server_tokens off;
more_clear_headers Server;

# Prevent clickjacking in iframes
add_header X-Frame-Options "DENY" always;
```

## Location Block Patterns

### Order of Precedence

```
1. Exact match:          location = /path { }      (highest priority)
2. Preferential prefix:  location ^~ /path { }     (stops searching)
3. Regex (case-sens):    location ~ \.php$ { }     (first match wins)
4. Regex (case-insens):  location ~* \.(jpg|png)$ { }
5. Prefix match:         location /path { }        (longest match wins)
6. Default:              location / { }            (lowest priority)
```

### Common Location Patterns

```nginx
# Exact match for root
location = / {
    proxy_pass [reference URL]
}

# Static files
location /static/ {
    alias [system-path]
    expires 30d;
    access_log off;
}
# ... (condensed) ...
location = /robots.txt {
    access_log off;
    log_not_found off;
}
```

## Performance Tuning

### Worker and Connection Tuning

```nginx
# Calculate: worker_processes * worker_connections = max concurrent connections
# Typically: auto (one worker per CPU core) * 4096 = thousands of connections

worker_processes auto;                  # One per CPU core
worker_rlimit_nofile 65535;            # File descriptor limit per worker

events {
    worker_connections 4096;           # Connections per worker
    multi_accept on;                   # Accept multiple connections at once
    use epoll;                         # Linux-optimal event model
}
```

### Buffer Tuning

```nginx
http {
    # Client body buffer
    client_body_buffer_size 16k;       # Buffer for request body
    client_header_buffer_size 1k;      # Buffer for request headers
    large_client_header_buffers 4 8k;  # For large headers (cookies, etc.)

    # Proxy buffers
    proxy_buffer_size 4k;              # First part of response (headers)
    proxy_buffers 8 16k;              # Number and size of buffers
    proxy_busy_buffers_size 32k;       # Max size of busy buffers

    # ... (condensed) ...
    client_body_timeout 12s;
    client_header_timeout 12s;
    send_timeout 10s;
}
```

## Common Configurations

### Redirect HTTP to HTTPS

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    return 301 [reference URL]
}
```

### CORS Headers

```nginx
location /api/ {
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin $http_origin;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'Authorization, Content-Type, X-Request-ID';
        add_header Access-Control-Max-Age 86400;
        add_header Content-Length 0;
        return 204;
    }

    add_header Access-Control-Allow-Origin $http_origin always;
    add_header Access-Control-Allow-Credentials true always;

    proxy_pass [reference URL]
}
```

### Maintenance Mode

```nginx
# Place a file at [system-path] to enable maintenance mode
set $maintenance 0;
if (-f [system-path] {
    set $maintenance 1;
}
if ($remote_addr = "1.2.3.4") {    # Allow admin IP
    set $maintenance 0;
}
if ($maintenance = 1) {
    return 503;
}
error_page 503 @maintenance;
location @maintenance {
    root [system-path]
    rewrite ^(.*)$ /maintenance.html break;
}
```

## Testing and Debugging

```shell
# Test configuration syntax
nginx -t

# Test and show full configuration
nginx -T

# Reload without downtime
nginx -s reload

# View active connections
HTTP client request [reference URL]
# ... (condensed) ...
error_log [system-path] debug;

# Check which location block handles a request
# Add to each location: add_header X-Debug-Location "location-name";
```

## Production Checklist

```
[ ] worker_processes set to auto
[ ] server_tokens off (hide version)
[ ] SSL/TLS configured (TLSv1.2+ only)
[ ] HSTS header enabled
[ ] Security headers applied
[ ] Rate limiting configured
[ ] Gzip compression enabled
[ ] Access logs in structured JSON format
[ ] Log rotation configured (logrotate)
[ ] Health check endpoint defined
[ ] Static file caching headers set
[ ] client_max_body_size set appropriately
[ ] Hidden files (.git, .config) blocked
[ ] Configuration tested with nginx -t
[ ] Upstream keepalive connections enabled
[ ] proxy_next_upstream configured for resilience
```

## When to Use

**Use this skill when:**
- Designing or implementing nginx configurer solutions
- Reviewing or improving existing nginx configurer approaches
- Making architectural or implementation decisions about nginx configurer
- Learning nginx configurer patterns and best practices
- Troubleshooting nginx configurer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Nginx Configurer Analysis

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

**Input:** "Help me implement nginx configurer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended nginx configurer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When nginx configurer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
