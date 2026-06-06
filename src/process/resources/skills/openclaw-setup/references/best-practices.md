# OpenClaw Best Practices and Special Scenarios

## Best Practices When Helping Users

1. **Diagnose before acting**: Run `openclaw doctor` when you encounter a problem
2. **Check the latest docs**: Consult the GitHub README or official documentation when unsure
3. **Protect privacy**: When sensitive information such as API keys or tokens is involved, guide the user to handle it themselves
4. **Step-by-step guidance**: Break complex operations into steps, confirming each step succeeds before continuing
5. **Offer alternatives**: If one approach doesn't work, provide alternative solutions
6. **Log issues**: If you find a new problem or outdated documentation, remind the user to check the latest resources

## Handling Special Scenarios

### Scenario 1: User wants to create a bot with a specific function

1. Confirm Gateway is running
2. Create a workspace or use an existing one
3. Configure `AGENTS.md` to define Agent behavior
4. Configure `TOOLS.md` to enable the required tools
5. Test the Agent's responses

**Example: Creating a code review bot**

```bash
# 1. Create a new Agent
openclaw agents add code-review --workspace ~/.openclaw/workspace-code-review

# 2. Edit the workspace's AGENTS.md to define code review logic
# 3. Configure TOOLS.md to enable GitHub-related tools
# 4. Test
openclaw agent --agent code-review --message "Review this PR: https://github.com/..."
```

### Scenario 2: User wants to run automated tasks

1. Use `openclaw cron` to set up scheduled tasks
2. Or use `openclaw webhooks` to receive external triggers
3. Configure the Agent's `AGENTS.md` to define task logic

**Example: Daily report task**

```bash
# Schedule execution at 9am every day
openclaw cron add "0 9 * * *" --message "Generate daily report" --agent main

# Define the report generation logic in the Agent's AGENTS.md
```

### Scenario 3: Multi-Agent routing

1. Create multiple Agents: `openclaw agents add <name>`
2. Configure routing rules in `openclaw.json`
3. Reference docs: https://docs.openclaw.ai/concepts/multi-agent

**Example configuration:**

```json5
{
  agents: {
    list: [
      { id: 'work', workspace: '~/.openclaw/workspace-work' },
      { id: 'personal', workspace: '~/.openclaw/workspace-personal' },
    ],
  },
  bindings: [
    {
      match: { channel: 'slack', accountId: 'work-account' },
      agent: 'work',
    },
    {
      match: { channel: 'telegram' },
      agent: 'personal',
    },
  ],
}
```

### Scenario 4: Remote Gateway

1. Install and run Gateway on a remote server
2. Configure `gateway.mode=remote` locally
3. Configure `gateway.remote.url` and authentication
4. Connect using an SSH tunnel or Tailscale

**Example: Connecting via SSH tunnel**

```bash
# On the local machine
ssh -N -L 18789:127.0.0.1:18789 user@remote-server

# In another terminal
openclaw gateway status  # Should be able to connect to the remote Gateway
```

### Scenario 5: Workspace backup

Workspaces contain the Agent's memory and configuration. Regular backups are recommended:

```bash
# Backup using git (recommended)
cd ~/.openclaw/workspace
git init
git add .
git commit -m "Backup workspace"

# Push to a private repository
git remote add origin git@github.com:username/openclaw-workspace.git
git push -u origin main
```

### Scenario 6: Migrating to a new machine

1. Back up the config file: `~/.openclaw/openclaw.json`
2. Back up the workspace: `~/.openclaw/workspace`
3. Back up credentials (if needed): `~/.openclaw/credentials/`
4. Install OpenClaw on the new machine
5. Restore the config and workspace
6. Run `openclaw doctor` to verify the configuration

## Security Recommendations

1. **Config file permissions**: Ensure `~/.openclaw/openclaw.json` has permissions set to 600
2. **API keys**: Use environment variables or a secure secrets management tool
3. **DM policy**: Use the `pairing` strategy by default to avoid open DMs
4. **Gateway authentication**: Even when running locally, setting a Gateway token is recommended
5. **Keep updated**: Keep OpenClaw and its dependencies up to date

## Performance Optimization

1. **Session cleanup**: Regularly clean up old sessions to free up space
2. **Model selection**: Choose the appropriate model based on task complexity
3. **Workspace size**: Keep workspace files lean and avoid large memory files
4. **Log management**: Regularly clean up log files
