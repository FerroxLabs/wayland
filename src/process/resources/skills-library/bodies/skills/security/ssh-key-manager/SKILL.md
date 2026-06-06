---
name: ssh-key-manager
description: |
  Complete guide to SSH key generation, configuration, agent setup, multi-account management, and troubleshooting for GitHub, GitLab, and server access.
  Use when the user asks about ssh key manager, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of ssh key manager or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart security testing automation email"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# SSH Key Manager

You are an SSH configuration specialist. Help the user generate, configure, and manage SSH keys for secure access. Provide exact commands and config file contents. Cover common platforms.


## When to Use

**Use this skill when:**
- User asks about ssh key manager techniques or best practices
- User needs guidance on ssh key manager concepts
- User wants to implement or improve their approach to ssh key manager

**Do NOT use when:**
- The request falls outside the scope of ssh key manager
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Generate a New SSH Key

```shell
# Recommended: Ed25519 (modern, fast, secure)
ssh-keygen -t ed25519 -C "your.email@example.com"

# If Ed25519 not supported: RSA 4096
ssh-keygen -t rsa -b 4096 -C "your.email@example.com"

# With custom filename (for multiple keys)
ssh-keygen -t ed25519 -C "work@company.com" -f ~/.ssh/id_ed25519_work

# Non-interactive (for scripts)
ssh-keygen -t ed25519 -C "ci@example.com" -f ~/.ssh/id_ci -N ""
```

**When prompted:**
- File location: press Enter for default, or specify a custom path
- Passphrase: **always set one** for personal keys (skip for CI/CD keys)

## SSH Agent Setup

### macOS

```shell
# Start agent
evaluate "$(ssh-agent -s)"

# Add key with Keychain integration (persists across reboots)
ssh-add --apple-use-keychain ~/.ssh/id_ed25519

# Configure automatic loading in ~/.ssh/config
Host *
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519
```

### Linux

```shell
# Start agent
evaluate "$(ssh-agent -s)"

# Add key
ssh-add ~/.ssh/id_ed25519

# Auto-start agent in ~/.bashrc
if [ -z "$SSH_AUTH_SOCK" ]; then
  evaluate "$(ssh-agent -s)" output-to dev/null
  ssh-add ~/.ssh/id_ed25519 2output-to dev/null
fi
```

### Windows

```powershell
# Enable SSH Agent service (run as Admin)
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent

# Add key
ssh-add "$env:USERPROFILE\.ssh\id_ed25519"

# Verify
ssh-add -l
```

### Git shell on Windows

```shell
evaluate "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

## Platform Setup

### GitHub

```shell
# Copy public key to clipboard
# macOS:
pbcopy < ~/.ssh/id_ed25519.pub
# Linux:
xclip -sel clip < ~/.ssh/id_ed25519.pub
# Windows:
clip < ~/.ssh/id_ed25519.pub
# Or just display it:
cat ~/.ssh/id_ed25519.pub
```

1. Go to GitHub > Settings > SSH and GPG keys > New SSH key
2. Paste the public key
3. Test: `ssh -T git@github.com`

Expected success message: `Hi username! You've successfully authenticated`

### GitLab

1. Go to GitLab > Preferences > SSH Keys
2. Paste the public key
3. Test: `ssh -T git@gitlab.com`

### Bitbucket

1. Go to Bitbucket > Personal settings > SSH keys
2. Paste the public key
3. Test: `ssh -T git@bitbucket.org`

## Multi-Account SSH Config

### ~/.ssh/config for Multiple GitHub Accounts

```
# Personal GitHub
Host github.com-personal
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_personal
  IdentitiesOnly yes

# Work GitHub
Host github.com-work
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_work
  IdentitiesOnly yes

# Self-hosted GitLab
Host gitlab.company.com
  HostName gitlab.company.com
  User git
  IdentityFile ~/.ssh/id_ed25519_work
  Port 22
```

**Update remotes to use the alias:**
```shell
# Personal repos
git remote set-url origin git@github.com-personal:username/repo.git

# Work repos
git remote set-url origin git@github.com-work:orgname/repo.git
```

### Server Access Config

```
# Production server
Host prod
  HostName 203.0.113.10
  User deploy
  IdentityFile ~/.ssh/id_ed25519_prod
  Port 22

# Jump host / bastion
Host bastion
  HostName bastion.company.com
  User admin
  IdentityFile ~/.ssh/id_ed25519_work

# Server behind bastion
Host internal-server
  HostName 10.0.1.50
  User admin
  ProxyJump bastion

# Wildcard for all company servers
Host *.company.com
  User admin
  IdentityFile ~/.ssh/id_ed25519_work
  ServerAliveInterval 60
```

## Key Management

### List Current Keys

```shell
# List keys loaded in agent
ssh-add -l

# List all key files
ls -la ~/.ssh/

# Check key fingerprint
ssh-keygen -lf ~/.ssh/id_ed25519.pub
```

### Change Passphrase

```shell
ssh-keygen -p -f ~/.ssh/id_ed25519
```

### Remove a Key from Agent

```shell
ssh-add -d ~/.ssh/id_ed25519      # remove specific key
ssh-add -D                         # remove all keys
```

### Set Correct Permissions

```shell
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519        # private key
chmod 644 ~/.ssh/id_ed25519.pub    # public key
chmod 600 ~/.ssh/config
chmod 600 ~/.ssh/authorized_keys
```

## Troubleshooting

### "Permission denied (publickey)"

```shell
# Step 1: Verify your key is loaded
ssh-add -l

# Step 2: Test with verbose output
ssh -vT git@github.com

# Step 3: Check which key is being offered
# Look for "Offering public key" lines in verbose output

# Step 4: Verify the right key is on the remote
# Compare fingerprints:
ssh-keygen -lf ~/.ssh/id_ed25519.pub
# with what's registered on GitHub/GitLab
```

### Common Fixes

| Problem | Fix |
|---------|-----|
| Key not loaded | `ssh-add ~/.ssh/id_ed25519` |
| Wrong key offered | Add `IdentitiesOnly yes` to config |
| Permissions too open | `chmod 600 ~/.ssh/id_ed25519` |
| Agent not running | `evaluate "$(ssh-agent -s)"` |
| Wrong remote URL | `git remote -v` then fix with `set-url` |
| Firewall blocking port 22 | Use HTTPS URL or SSH over port 443 |

### SSH Over HTTPS Port (GitHub Firewall Workaround)

```
# ~/.ssh/config
Host github.com
  HostName ssh.github.com
  Port 443
  User git
```

Test: `ssh -T -p 443 git@ssh.github.com`

### Debug Connection

```shell
# Increasing verbosity levels
ssh -v git@github.com              # basic debug
ssh -vv git@github.com             # more detail
ssh -vvv git@github.com            # maximum detail
```

## Security Best Practices

- Always use Ed25519 over RSA when possible
- Always set a passphrase on personal keys
- Use separate keys for separate services/accounts
- Rotate keys annually
- Remove keys from platforms when no longer needed
- Never share private keys; never commit them to repos
- Use `IdentitiesOnly yes` to prevent key leaking across hosts
- Keep `~/.ssh` permissions locked down (700/600)


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to ssh key manager
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Ssh Key Manager Analysis

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

**Input:** "Help me with ssh key manager for my current situation"

**Output:**

Based on your situation, here is a structured approach to ssh key manager:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
