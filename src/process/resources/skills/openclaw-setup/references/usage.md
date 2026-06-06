# OpenClaw Usage Guide

## Creating and Managing Agents

### List All Agents

```bash
openclaw agents list
```

### Add a New Agent

```bash
openclaw agents add <agent-name> --workspace ~/.openclaw/workspace-<name>
```

### Set Agent Identity

```bash
openclaw agents set-identity --agent main --name "My Assistant" --emoji "🦞"
```

### Load Identity from File

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

## Talking to an Agent

### Basic Conversation

```bash
openclaw agent --message "Summarize today's tasks for me"
```

### Specify an Agent

```bash
openclaw agent --agent <agent-id> --message "Execute a task"
```

### Specify Thinking Mode

```bash
openclaw agent --message "Complex task" --thinking high
```

### Send to a Channel and Reply

```bash
openclaw agent --to +1234567890 --message "Status update" --deliver
```

## Sending Messages

### Send to a Phone Number

```bash
openclaw message send --to +1234567890 --message "Hello from OpenClaw"
```

### Send to a Channel

```bash
openclaw message send --channel telegram --to @username --message "Hello"
```

## Channel Management

### Log In to a Channel

```bash
openclaw channels login
```

### Check Channel Status

```bash
openclaw channels status
```

### Deep Inspection (Probe Connection)

```bash
openclaw channels status --probe
```

## Workspace Management

### Create a Workspace

```bash
openclaw setup --workspace ~/.openclaw/workspace
```

### Workspace File Structure

Default workspace location: `~/.openclaw/workspace`

Key files:

- `AGENTS.md` - Agent instructions and skill list
- `SOUL.md` - Agent identity and boundaries
- `USER.md` - User information
- `TOOLS.md` - Tool configuration
- `memory/` - Memory system (daily logs)

### Initialize Workspace Templates

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

## Automated Tasks

### Cron Jobs

```bash
openclaw cron add "0 9 * * *" --message "Daily morning briefing"
```

### Webhooks

Configure a webhook to receive external triggers:

```bash
openclaw webhooks add <name> --url <webhook-url>
```

### Gmail Pub/Sub

Configure a Gmail trigger (requires additional setup):
Reference: https://docs.openclaw.ai/automation/gmail-pubsub

## Updates and Upgrades

### Update OpenClaw

```bash
npm install -g openclaw@latest
```

Or using pnpm:

```bash
pnpm add -g openclaw@latest
```

### Run Doctor After Updating

```bash
openclaw doctor
```

This will:

- Check for configuration migration needs
- Fix outdated configuration
- Check service status

### Switch Release Channel

```bash
openclaw update --channel stable|beta|dev
```
