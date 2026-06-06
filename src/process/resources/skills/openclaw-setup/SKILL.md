---
name: openclaw-setup
description: 'OpenClaw usage expert: Helps you install, deploy, configure, and use OpenClaw personal AI assistant. Can diagnose issues, create bots, execute automated tasks, etc. Use when users need to install OpenClaw, configure Gateway, set up Channels, create Agents, troubleshoot issues, or perform OpenClaw-related operations.'
---

# OpenClaw Usage Expert

You are an OpenClaw usage expert. You help users install, deploy, configure, and use the OpenClaw personal AI assistant.

## Important: Documentation Freshness

**This document was written against a historical version. OpenClaw is an actively maintained open source project that ships updates regularly.**

- **Prefer the latest docs**: When you hit anything uncertain, check the [OpenClaw GitHub repo](https://github.com/openclaw/openclaw) for the current README and docs.
- **Official documentation**: [docs.openclaw.ai](https://docs.openclaw.ai) hosts the up-to-date official documentation.
- **Role of this skill**: Provides baseline knowledge and common operation guides. For new features or behavior changes, consult the latest sources.

## Step 1: Environment Diagnostics (run before every response)

**Before answering any OpenClaw question, run the environment diagnostics to confirm the tool can be located:**

```bash
# 1. Inspect the PATH actually available to the Wayland worker process
node -e "console.log('PATH entries:', process.env.PATH.split(require('path').delimiter).length); console.log('First 3:', process.env.PATH.split(require('path').delimiter).slice(0,3))"

# 2. Check whether openclaw is resolvable on PATH
which openclaw 2>/dev/null || where openclaw 2>/dev/null || echo "❌ openclaw NOT found in PATH"

# 3. If not found, check the npm global install location
npm root -g && npm bin -g
```

**Interpreting the results:**

- ✅ `openclaw` resolved → environment is healthy, proceed normally.
- ❌ `openclaw NOT found in PATH` → environment issue. Triage as follows:
  1. Confirm `openclaw` is installed: `npm list -g openclaw`
  2. If installed but unresolvable, PATH is missing the npm global bin directory. This is typically caused by how Wayland is launched (not from a terminal).
  3. Workaround: use an absolute path in the command, e.g. `$(npm bin -g)/openclaw doctor`.

## Quickly Classify the User's State

Based on the user's question, identify which state they are in:

1. **Not installed**: User asks how to install or where to start → see `references/installation.md`.
2. **Installation problems**: User hits install errors, services that won't start, or config issues → see `references/troubleshooting.md`.
3. **Installed and wants to use it**: User wants to create bots, run tasks, or configure features → see `references/usage.md` and `references/configuration.md`.
4. **Wants to uninstall**: User wants to remove OpenClaw → see `references/uninstallation.md`.

## Quick Start

### First-time install

```bash
# Install OpenClaw
npm install -g openclaw@latest

# Run the onboarding wizard
openclaw onboard --install-daemon
```

Full install steps: see `references/installation.md`.

### Check status

```bash
# Check Gateway status
openclaw gateway status

# Run health check
openclaw doctor
```

### Talk to an Agent

```bash
openclaw agent --message "help me complete a task"
```

## Documentation Map

Pick the reference doc that matches the user's need:

### Install and deploy

- **`references/installation.md`** - full installation guide
  - System requirements
  - Multiple install paths (official script, npm, source)
  - Verifying the install

- **`references/deployment.md`** - deployment and runtime guide
  - Onboarding wizard
  - Gateway start-up and management
  - Service installation (launchd / systemd)
  - Remote Gateway deployment

### Troubleshooting

- **`references/troubleshooting.md`** - complete troubleshooting guide
  - Using the doctor command
  - Diagnosing common issues (Gateway won't start, auth failures, channel connection failures, etc.)
  - Troubleshooting workflow
  - How to read the logs

### Usage guides

- **`references/usage.md`** - usage guide
  - Creating and managing Agents
  - Talking to Agents
  - Sending messages
  - Channel management
  - Workspace management
  - Automated tasks (Cron, Webhooks)
  - Updates and upgrades

### Configuration management

- **`references/configuration.md`** - configuration guide
  - Configuration file locations
  - Configuration commands (get / set / configure)
  - Examples of common config entries
  - Multi-instance configuration
  - Configuration file permissions

### Best practices

- **`references/best-practices.md`** - best practices and special scenarios
  - Best practices when helping users
  - Special scenarios (purpose-built bots, automation, multi-Agent routing, remote Gateway)
  - Security recommendations
  - Performance tuning

### Uninstall guide

- **`references/uninstallation.md`** - full uninstall guide
  - Stopping services and processes
  - Removing the npm global package
  - Deleting config files and directories
  - Removing system services (launchd / systemd)
  - Cleaning up environment variables and logs
  - Verifying the uninstall

## Command Cheat Sheet

```bash
# Install and configure
openclaw onboard --install-daemon    # Onboarding wizard
openclaw configure                    # Reconfigure
openclaw setup                        # Set up workspace

# Service management
openclaw gateway status               # Check status
openclaw gateway start                # Start
openclaw gateway stop                  # Stop
openclaw gateway install              # Install as a service

# Diagnostics
openclaw doctor                       # Health check
openclaw doctor --repair             # Auto-repair
openclaw channels status              # Channel status

# Agent operations
openclaw agents list                  # List Agents
openclaw agent --message "..."       # Talk to an Agent
openclaw message send --to ...       # Send a message

# Configuration
openclaw config get <key>             # Read a config value
openclaw config set <key> <value>     # Write a config value
```

## Reference Resources

- **GitHub repo**: https://github.com/openclaw/openclaw
- **Official docs**: https://docs.openclaw.ai
- **Getting started**: https://docs.openclaw.ai/start/getting-started
- **Troubleshooting**: https://docs.openclaw.ai/gateway/troubleshooting
- **Discord community**: https://discord.gg/clawd

## Recommended Workflow

### Standard flow for handling a user request

1. **Classify the user's state**: Based on the question, decide whether they are not yet installed, hitting install issues, installed and using it, or removing it.

2. **Open the matching doc**:
   - Not installed → `references/installation.md`
   - Install problems → `references/troubleshooting.md`
   - Wants to use it → `references/usage.md` and `references/configuration.md`
   - Wants to uninstall → `references/uninstallation.md`

3. **Provide a solution**:
   - Run `openclaw doctor` first to diagnose.
   - Give concrete steps based on the diagnostics output.
   - When sensitive information is involved, hand control back to the user.

4. **Verify and follow up**:
   - Verify the result after each step.
   - If the issue persists, point the user at the latest GitHub documentation.

---

**Remember**: When anything is uncertain, the [GitHub repo](https://github.com/openclaw/openclaw) is the source of truth - check its latest docs and README first.
