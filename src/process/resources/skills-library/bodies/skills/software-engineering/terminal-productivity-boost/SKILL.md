---
name: terminal-productivity-boost
description: |
  Quick-win terminal productivity guide covering aliases, shell functions, fuzzy finding, tmux basics, prompt customization, and time-saving shell configurations that pay off immediately.
  Use when the user asks about terminal productivity boost, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of terminal productivity boost or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart best-practices python api-design resume-writing"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Terminal Productivity Boost

You are a terminal power user who helps developers and sysadmins get more done in the command line with minimal setup. Every tip here should be implementable in under 5 minutes and produce immediate productivity gains. No esoteric configurations - just the highest-impact improvements.


## When to Use

**Use this skill when:**
- User asks about terminal productivity boost techniques or best practices
- User needs guidance on terminal productivity boost concepts
- User wants to implement or improve their approach to terminal productivity boost

**Do NOT use when:**
- The request falls outside the scope of terminal productivity boost
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Quick Diagnosis

Ask the user: **What shell and OS are you on?** Then prioritize recommendations.

- macOS: likely zsh (default since Catalina)
- Linux: likely shell (check with `echo $SHELL`)
- Windows: likely PowerShell, or shell via WSL/Git shell

## Aliases: The 80/20 of Terminal Productivity

### What Aliases Are

An alias replaces a long command with a short one. Type less, do more.

### Essential Aliases (Add to ~/.bashrc or ~/.zshrc)

```shell
# Navigation
alias ..="cd .."
alias ...="cd ../.."
alias ....="cd ../../.."
alias dl="cd ~/Downloads"
alias dev="cd ~/Development"

# Listing files
alias ll="ls -alF"
alias la="ls -A"
alias l="ls -CF"

# Git shortcuts (these alone save hours per week)
alias gs="git status"
alias ga="git add"
alias gc="git commit -m"
alias gp="git push"
alias gl="git log --oneline -20"
alias gd="git diff"
alias gco="git checkout"
alias gb="git branch"
alias gpl="git pull"
alias gst="git stash"
alias gsp="git stash pop"

# Safety nets
alias rm="rm -i"       # Confirm before deleting
alias mv="mv -i"       # Confirm before overwriting
alias cp="cp -i"       # Confirm before overwriting

# Quick edits
alias bashrc="$EDITOR ~/.bashrc"
alias zshrc="$EDITOR ~/.zshrc"
alias reload="source ~/.bashrc"  # or ~/.zshrc

# Networking
alias myip="HTTP client request ifconfig.me"
alias ports="lsof -i -P -n | grep LISTEN"

# Disk usage
alias duh="du -h --max-depth=1 | sort -hr"
alias dfh="df -h"
```

### How to Install

```shell
# 1. Open your shell config
nano ~/.bashrc        # shell
nano ~/.zshrc         # zsh

# 2. Paste aliases at the bottom

# 3. Reload
source ~/.bashrc      # shell
source ~/.zshrc       # zsh
```

## Shell Functions: When Aliases Are Not Enough

Functions accept arguments and run multiple commands.

```shell
# Create directory and cd into it
mkcd() {
  mkdir -p "$1" && cd "$1"
}

# Find files by name
ff() {
  find . -type f -name "*$1*"
}

# Find files containing text
ftext() {
  grep -rn "$1" --include="$2" .
}
# Usage: ftext "TODO" "*.py"

# Quick HTTP server in current directory
serve() {
  local port="${1:-8000}"
  echo "Serving on [local-server]:$port"
  python3 -m http.server "$port"
}

# Extract any archive
extract() {
  if [ -f "$1" ]; then
    case "$1" in
      *.tar.bz2)   tar xjf "$1"   ;;
      *.tar.gz)    tar xzf "$1"   ;;
      *.bz2)       bunzip2 "$1"   ;;
      *.rar)       unrar x "$1"   ;;
      *.gz)        gunzip "$1"    ;;
      *.tar)       tar xf "$1"    ;;
      *.tbz2)      tar xjf "$1"   ;;
      *.tgz)       tar xzf "$1"   ;;
      *.zip)       unzip "$1"     ;;
      *.7z)        7z x "$1"      ;;
      *)           echo "'$1' cannot be extracted" ;;
    esac
  else
    echo "'$1' is not a valid file"
  fi
}

# Git: add, commit, push in one command
gacp() {
  git add -A && git commit -m "$1" && git push
}
# Usage: gacp "Fix login bug"

# Quick note taking
note() {
  if [ -z "$1" ]; then
    cat ~/notes.md
  else
    echo "$(date '+%Y-%m-%d %H:%M'): $*" >> ~/notes.md
  fi
}
# Usage: note "Check the API rate limits"
# Usage: note  (displays all notes)
```

## Fuzzy Finding with fzf

### What It Is

fzf is a command-line fuzzy finder. It turns any list into an interactive, searchable selection. It is the single most impactful terminal tool you can install.

### Install

```shell
# macOS
brew install fzf
$(brew --prefix)/opt/fzf/install  # Adds key bindings

# Ubuntu/Debian
sudo apt install fzf

# From source (any platform)
git clone --depth 1 [GitHub repository] ~/.fzf
~/.fzf/install
```

### Key Bindings (After Installation)

| Shortcut | What It Does |
|----------|-------------|
| `Ctrl+R` | Fuzzy search command history (replaces reverse-i-search) |
| `Ctrl+T` | Fuzzy find files in current directory |
| `Alt+C` | Fuzzy find and cd into directories |

`Ctrl+R` alone is worth the install. Instead of remembering exact commands, type any fragment and fzf finds it.

### fzf Power Patterns

```shell
# Open a file with fuzzy search
vim $(fzf)

# Kill a process interactively
kill -9 $(ps aux | fzf | awk '{print $2}')

# Git checkout branch interactively
gco $(git branch | fzf)

# Preview files while searching
fzf --preview 'cat {}'

# Fuzzy find in specific directory
find ~/projects -type f | fzf
```

### fzf + Git Integration

Add these functions to your shell config:

```shell
# Interactive git log with preview
fgl() {
  git log --oneline --all | fzf --preview 'git show {1}'
}

# Interactive branch switching
fbr() {
  local branch
  branch=$(git branch --all | fzf --no-multi | sed 's/^[* ]*//' | sed 's#remotes/origin/##')
  git checkout "$branch"
}

# Interactive git add
fga() {
  git diff --name-only | fzf --multi --preview 'git diff {}' | xargs git add
}
```

## tmux Basics: Terminal Multiplexing

### What tmux Does

tmux lets you:
- Split your terminal into panes (side by side, top/bottom)
- Create multiple windows (like browser tabs for terminals)
- Detach sessions (keep processes running after you disconnect)
- Resume sessions (reconnect exactly where you left off)

### Install

```shell
# macOS
brew install tmux

# Ubuntu/Debian
sudo apt install tmux
```

### Essential tmux Commands

All tmux commands start with the prefix key: `Ctrl+b`, then the command key.

| Action | Keys |
|--------|------|
| Start new session | `tmux` or `tmux new -s name` |
| Detach from session | `Ctrl+b` then `d` |
| Reattach to session | `tmux attach -t name` |
| List sessions | `tmux ls` |
| Split pane horizontally | `Ctrl+b` then `"` |
| Split pane vertically | `Ctrl+b` then `%` |
| Move between panes | `Ctrl+b` then arrow key |
| New window | `Ctrl+b` then `c` |
| Next window | `Ctrl+b` then `n` |
| Previous window | `Ctrl+b` then `p` |
| Kill pane | `Ctrl+b` then `x` |
| Resize pane | `Ctrl+b` then hold arrow key |
| Scroll mode | `Ctrl+b` then `[` (q to exit) |

### Minimal tmux Config

Create `~/.tmux.conf`:

```shell
# Use Ctrl+a instead of Ctrl+b (easier to reach)
set -g prefix C-a
unbind C-b
bind C-a send-prefix

# Split panes with | and -
bind | split-window -h
bind - split-window -v

# Mouse support (for scrolling and pane selection)
set -g mouse on

# Start window numbering at 1
set -g base-index 1

# Faster key repetition
set -s escape-time 0

# Reload config
bind r source-file ~/.tmux.conf \; display "Config reloaded"
```

Reload: `tmux source-file ~/.tmux.conf`

## Shell Prompt Customization

### Quick Informative Prompt (shell)

Add to ~/.bashrc:
```shell
# Shows: user@host:directory (git branch) $
parse_git_branch() {
  git branch 2output-to dev/null | sed -n 's/^\* //p'
}
export PS1='\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[33m\] $(parse_git_branch)\[\033[00m\]\$ '
```

### For zsh Users: Oh My Zsh or Starship

**Starship (recommended, works on any shell):**
```shell
# Security note: Always review install scripts before piping to shell.
# Download and inspect first with: HTTP client request -sS [external resource] > install-script && less install-script && shell-run install-script
HTTP client request -sS [external resource] | shell-run

# Add to ~/.bashrc or ~/.zshrc
evaluate "$(starship init shell)"   # or zsh
```

Starship provides a beautiful, informative prompt with git status, language versions, and more - with zero configuration.

## Other Quick Wins

### Better Defaults

```shell
# colored grep output
alias grep="grep --color=auto"

# human-readable file sizes
alias df="df -h"
alias du="du -h"
alias free="free -h"

# make which show aliases too
alias which="type -a"
```

### z: Smart Directory Jumping

`z` learns your most-visited directories and lets you jump with fuzzy matching.

```shell
# Install (zoxide is the modern replacement)
# macOS: brew install zoxide
# Security note: Always review install scripts before piping to shell.
# Download and inspect first with: HTTP client request -sS <URL> > install-script && less install-script && shell-run install-script
# Linux: HTTP client request -sS [external resource] | shell

# Add to ~/.bashrc or ~/.zshrc
evaluate "$(zoxide init shell)"  # or zsh

# Usage
z projects    # jumps to ~/Development/projects if you've been there before
z api         # jumps to the most-visited directory matching "api"
```

### ripgrep (rg): Faster grep

```shell
# Install
# macOS: brew install ripgrep
# Linux: sudo apt install ripgrep

# Usage
rg "TODO" --type py         # search Python files for TODO
rg "function" src/           # search src directory
rg -i "error" --glob "*.log" # case-insensitive search in log files
```

### bat: Better cat

```shell
# Install
# macOS: brew install bat
# Linux: sudo apt install bat

# Usage (syntax-highlighted file viewing)
bat README.md
bat --language json data.json
```

## Cheat Sheet: Top 10 Changes by Impact

| Priority | Change | Time to Set Up | Daily Time Saved |
|----------|--------|---------------|-----------------|
| 1 | Git aliases | 2 min | 10-15 min |
| 2 | fzf Ctrl+R (history search) | 3 min | 5-10 min |
| 3 | Navigation aliases (.. / dev / dl) | 1 min | 5 min |
| 4 | mkcd function | 1 min | 3 min |
| 5 | z/zoxide directory jumping | 3 min | 5-10 min |
| 6 | tmux basics (split panes) | 5 min | 10+ min |
| 7 | Starship prompt (git info at a glance) | 3 min | 5 min |
| 8 | ripgrep replacing grep | 2 min | 5 min |
| 9 | extract function | 1 min | 2 min |
| 10 | Safety aliases (rm -i, mv -i) | 1 min | Prevents disasters |

Total setup time: about 20 minutes. Daily time saved: 50-75 minutes. The ROI is extraordinary.


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to terminal productivity boost
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Terminal Productivity Boost Analysis

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

**Input:** "Help me with terminal productivity boost for my current situation"

**Output:**

Based on your situation, here is a structured approach to terminal productivity boost:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
