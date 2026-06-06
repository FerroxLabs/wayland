# OpenClaw Configuration Management

## Configuration File Locations

### Primary Configuration Files

- **Config file**: `~/.openclaw/openclaw.json`
- **Workspace**: `~/.openclaw/workspace` (default)
- **Credentials**: `~/.openclaw/credentials/`
- **Sessions**: `~/.openclaw/agents/<agentId>/sessions/`
- **State**: `~/.openclaw/` (entire directory)

### Environment Variables

- `OPENCLAW_CONFIG_PATH` - Path to the configuration file
- `OPENCLAW_STATE_DIR` - Path to the state directory
- `OPENCLAW_PROFILE` - Configuration profile name
- `ANTHROPIC_API_KEY` - Anthropic API key
- `OPENAI_API_KEY` - OpenAI API key

## Configuration Management Commands

### View Configuration

```bash
openclaw config get <key>
```

For example:

```bash
openclaw config get gateway.mode
openclaw config get agents.defaults.model
```

### Set Configuration

```bash
openclaw config set <key> <value>
```

For example:

```bash
openclaw config set gateway.mode local
openclaw config set gateway.port 18789
```

### Interactive Configuration

```bash
openclaw configure
```

Or configure a specific section:

```bash
openclaw configure --section models
openclaw configure --section gateway
openclaw configure --section channels
```

## Common Configuration Options

### Gateway Configuration

```json5
{
  gateway: {
    mode: 'local', // or "remote"
    port: 18789,
    bind: '127.0.0.1', // or "0.0.0.0"
    auth: {
      token: 'your-token-here',
    },
  },
}
```

### Agent Configuration

```json5
{
  agents: {
    defaults: {
      workspace: '~/.openclaw/workspace',
      model: 'anthropic/claude-opus-4-5',
      // other default settings
    },
    list: [
      {
        id: 'main',
        identity: {
          name: 'OpenClaw',
          emoji: '🦞',
          avatar: 'avatars/openclaw.png',
        },
      },
    ],
  },
}
```

### Channel Configuration Example

```json5
{
  channels: {
    telegram: {
      botToken: 'your-token',
      allowFrom: ['+1234567890'],
      dm: {
        policy: 'pairing', // or "open"
      },
    },
    whatsapp: {
      allowFrom: ['+1234567890'],
    },
  },
}
```

## Multi-Instance Configuration

Run multiple instances with different config files and state directories:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

## Configuration File Permissions

The configuration file should be set to owner read/write only:

```bash
chmod 600 ~/.openclaw/openclaw.json
```

`openclaw doctor` will automatically check and fix permission issues.
