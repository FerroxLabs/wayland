---
name: port-conflict-resolver
description: |
  Quickly find and resolve port conflicts - identify processes, kill stuck ports, configure alternatives, and prevent future conflicts across all operating systems.
  Use when the user asks about port conflict resolver, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of port conflict resolver or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart devops python javascript"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Port Conflict Resolver

You are a network troubleshooting specialist. When the user hits "port already in use" errors, help them diagnose and fix it immediately. Provide OS-specific commands. Be direct.


## When to Use

**Use this skill when:**
- User asks about port conflict resolver techniques or best practices
- User needs guidance on port conflict resolver concepts
- User wants to implement or improve their approach to port conflict resolver

**Do NOT use when:**
- The request falls outside the scope of port conflict resolver
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Quick Diagnosis

### Find What Is Using a Port

**Linux / macOS:**
```shell
# Find process on a specific port
lsof -i :3000
lsof -i :3000 -t                     # just the PID

# Alternative using ss (Linux)
ss -tlnp | grep :3000

# Alternative using netstat
netstat -tlnp | grep :3000           # Linux
netstat -anp tcp | grep 3000         # macOS
```

**Windows (PowerShell):**
```powershell
# Find process on a specific port
netstat -ano | findstr :3000

# Get process details from PID
Get-Process -Id <PID>

# One-liner: find process name using port
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess | ForEach-Object { Get-Process -Id $_.OwningProcess }
```

**Windows (CMD):**
```cmd
netstat -ano | findstr :3000
tasklist /fi "PID eq <PID>"
```

### Scan All Listening Ports

```shell
# Linux
ss -tlnp

# macOS
lsof -iTCP -sTCP:LISTEN -n -P

# Windows PowerShell
Get-NetTCPConnection -State Listen | Sort-Object LocalPort | Format-Table LocalPort, OwningProcess, @{N='Process';E={(Get-Process -Id $_.OwningProcess).Name}}
```

## Kill the Process

### By PID

```shell
# Linux / macOS
kill <PID>                            # graceful (SIGTERM)
kill -9 <PID>                         # force (SIGKILL)

# Kill everything on a port
kill -9 $(lsof -i :3000 -t)
```

```powershell
# Windows PowerShell
Stop-Process -Id <PID>
Stop-Process -Id <PID> -Force         # force kill

# Kill by port (one-liner)
Get-NetTCPConnection -LocalPort 3000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### By Process Name

```shell
# Linux / macOS
pkill -f "node server.js"
killall node

# Windows
taskkill /IM node.exe /F
Stop-Process -Name node -Force
```

## Common Conflict Scenarios

### Scenario 1: "EADDRINUSE" / "Address already in use"

```shell
# 1. Find the offending process
lsof -i :3000     # or Windows equivalent above

# 2. Decide: kill it or use a different port
# Kill it:
kill -9 $(lsof -i :3000 -t)

# Or use a different port:
PORT=3001 npm start
```

### Scenario 2: Port Stuck in TIME_WAIT

The OS keeps the port reserved briefly after a process exits.

```shell
# Check TIME_WAIT connections
ss -tn state time-wait | grep :3000
netstat -an | grep TIME_WAIT | grep 3000

# Option A: Wait 30-60 seconds
# Option B: Enable SO_REUSEADDR in your app

# Option C: Reduce TIME_WAIT timeout (Linux, temporary)
sudo sysctl -w net.ipv4.tcp_fin_timeout=15

# Node.js fix: enable address reuse
const server = app.listen(3000);
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log('Port 3000 in use, retrying...');
    setTimeout(() => { server.close(); server.listen(3001); }, 1000);
  }
});
```

### Scenario 3: Docker Container Holding Ports

```shell
# Find Docker containers using ports
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Stop specific container
docker stop <container-name>

# Stop all containers
docker stop $(docker ps -q)

# Remove port mapping conflicts
docker compose down
```

### Scenario 4: Service Running on Boot

```shell
# Linux: find and stop system services on port 80
sudo systemctl list-units --type=service --state=running | grep -i "apache\|nginx\|httpd"
sudo systemctl stop apache2
sudo systemctl disable apache2         # prevent restart on boot

# macOS: find launch daemons
sudo lsof -i :80
sudo launchctl unload /Library/LaunchDaemons/<service>.plist

# Windows: stop a service
Get-Service | Where-Object { $_.Status -eq 'Running' } | Format-Table Name, DisplayName
Stop-Service -Name "W3SVC"             # IIS example
Set-Service -Name "W3SVC" -StartupType Disabled
```

## Configure Alternative Ports

### Common Defaults and Alternatives

| Service | Default | Alternatives |
|---------|---------|-------------|
| HTTP | 80 | 8080, 8000, 3000 |
| HTTPS | 443 | 8443, 4443 |
| Node.js | 3000 | 3001, 4000, 5000 |
| React Dev | 3000 | 3001 (auto-prompts) |
| Vite | 5173 | 5174, 5175 |
| Django | 8000 | 8001, 8080 |
| Flask | 5000 | 5001, 5050 |
| PostgreSQL | 5432 | 5433, 5434 |
| MySQL | 3306 | 3307, 3308 |
| Redis | 6379 | 6380, 6381 |
| MongoDB | 27017 | 27018, 27019 |

### Auto-Select Available Port

```javascript
// Node.js: find available port
const net = require('net');
function getAvailablePort(start = 3000) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(start, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => resolve(getAvailablePort(start + 1)));
  });
}
```

```python
# Python: find available port
import socket

def find_free_port(start=8000):
    for port in range(start, start + 100):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.bind(('', port))
            s.close()
            return port
        except OSError:
            continue
    raise RuntimeError("No free port found")
```

## Prevention

### Package.json Scripts with Port Kill

```json
{
  "scripts": {
    "prestart": "npx kill-port 3000",
    "start": "node server.js"
  }
}
```

### Shell Alias for Quick Kill

```shell
# Add to ~/.bashrc or ~/.zshrc
killport() { kill -9 $(lsof -i :"$1" -t) 2output-to dev/null && echo "Killed port $1" || echo "Port $1 not in use"; }
# Usage: killport 3000
```

```powershell
# Add to PowerShell profile
function Kill-Port($port) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) { Stop-Process -Id $conn.OwningProcess -Force; "Killed port $port" }
    else { "Port $port not in use" }
}
# Usage: Kill-Port 3000
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to port conflict resolver
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Port Conflict Resolver Analysis

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

**Input:** "Help me with port conflict resolver for my current situation"

**Output:**

Based on your situation, here is a structured approach to port conflict resolver:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
