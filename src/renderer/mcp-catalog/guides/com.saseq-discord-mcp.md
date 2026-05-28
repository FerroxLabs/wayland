---
guideVersion: 1.0.0
estimatedMinutes: 4
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `discord-mcp` from npm via `npx` on first launch — no
      manual install needed. You'll need Node 18+ available on your PATH
      (Wayland's bundled runtime handles this on macOS and Windows).
  - id: bot-token
    title: Create a bot and paste its token
    estSeconds: 180
    externalAction: { label: "Open Discord Developer Portal", url: "https://discord.com/developers/applications" }
    inputs:
      - { name: DISCORD_BOT_TOKEN, label: "Bot token", secret: true }
    warning: |
      You must also invite the bot to your server with the right intents
      (Server Members, Message Content). The portal's OAuth2 URL generator
      builds an invite link for you.
    body: |
      Discord MCP runs as a bot account you own. Free, takes a couple of
      minutes. You need to be the owner or admin of the Discord server you
      want the bot in.

      **A. Create the application**

      1. Click **Open Discord Developer Portal** above and sign in with
         your Discord account.
      2. Click **Create App** in the top-right of the applications list.
      3. Name it (e.g. *Wayland*), accept the terms, and click **Create**.

      **B. Reset and copy the bot token**

      1. In the new app's left sidebar, click **Bot**.
      2. Click **Reset Token** to reveal a new token. Discord shows it
         exactly once — copy it now and paste it into `DISCORD_BOT_TOKEN`
         above.
      3. While on the **Bot** page, scroll to **Privileged Gateway Intents**
         and toggle on the intents you need — most setups want
         **Message Content Intent** so the bot can read message text.

      **C. Invite the bot to your server**

      1. Left sidebar → **Installation** (or **OAuth2 → URL Generator** on
         older apps).
      2. Select scopes `bot` and `applications.commands`, then pick the
         permissions the bot needs (Send Messages, Read Message History,
         etc.).
      3. Copy the generated install URL, open it in your browser, choose
         the Discord server, and click **Authorize**.
---

# Discord setup

Discord MCP runs as a bot account. Free, takes a couple of minutes.

## Step 2 — Create the bot

1. Open the Discord Developer Portal and click **New Application**.
2. Under **Bot**, click **Reset Token** to reveal it, then paste it above.
3. Enable the intents you need (most setups want **Message Content Intent**).
4. Use the **OAuth2 → URL Generator** to invite the bot to your server with
   scope `bot` and the permissions you want.
