# OpenClaw Deployment Guide

## Run the Onboarding Wizard (Recommended)

This is the **recommended** approach - it walks you through all configuration steps:

```bash
openclaw onboard --install-daemon
```

The wizard guides you through:

- **Gateway mode**: local or remote
- **Model authentication**: Anthropic API key (recommended), OpenAI OAuth, or other providers
- **Workspace location**: default `~/.openclaw/workspace`
- **Gateway settings**: port (default 18789), bind address, auth token
- **Channel configuration**: WhatsApp, Telegram, Discord, Slack, etc.
- **Service installation**: background service (launchd/systemd)

## Start the Gateway Manually (Testing)

If you just want to test without installing the service:

```bash
openclaw gateway --port 18789 --verbose
```

## Check Gateway Status

```bash
openclaw gateway status
```

## Check Whether the Service Is Running

```bash
# macOS
launchctl list | grep openclaw

# Linux (systemd)
systemctl --user status openclaw-gateway

# Or check the port
ss -ltnp | grep 18789  # Linux
lsof -i :18789        # macOS
```

## Service Management

### macOS (launchd)

```bash
# Check service status
launchctl list | grep openclaw

# Start the service
launchctl load ~/Library/LaunchAgents/com.openclaw.gateway.plist

# Or use the OpenClaw command
openclaw gateway install
```

### Linux (systemd)

```bash
# Check service status
systemctl --user status openclaw-gateway

# Start the service
systemctl --user start openclaw-gateway

# Enable auto-start
systemctl --user enable openclaw-gateway
```

## View Logs

**Gateway log locations:**

- macOS: `~/Library/Logs/openclaw-gateway.log` or the system log
- Linux: `journalctl --user -u openclaw-gateway`

**View macOS logs using the script:**

```bash
./scripts/clawlog.sh
```

## Remote Gateway Deployment

1. Install and run the Gateway on the remote server
2. Configure `gateway.mode=remote` locally
3. Configure `gateway.remote.url` and authentication
4. Connect via SSH tunnel or Tailscale

Reference docs: https://docs.openclaw.ai/gateway/remote
