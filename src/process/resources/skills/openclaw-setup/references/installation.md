# OpenClaw Installation Guide

## System Requirements

- **Node.js**: version ≥ 22 (required)
- **Operating System**: macOS, Linux, Windows (WSL2 strongly recommended)
- **Package Manager**: npm, pnpm, or bun (npm or pnpm recommended)

## Check Node.js Version

```bash
node --version
```

If the version is below 22, upgrade Node.js first.

## Installation Methods

### Method 1: Official Install Script (Recommended)

**macOS/Linux:**

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

**Windows (PowerShell):**

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

### Method 2: Global npm Install

```bash
npm install -g openclaw@latest
```

Or using pnpm:

```bash
pnpm add -g openclaw@latest
```

### Method 3: Build from Source (Development)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build  # UI dependencies are installed automatically on first run
pnpm build
```

## Verify Installation

```bash
openclaw --version
```

## Next Steps After Installation

Once installed, run the onboarding wizard:

```bash
openclaw onboard --install-daemon
```

This guides you through Gateway configuration, model authentication, channel setup, and more.
