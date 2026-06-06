---
guideVersion: 1.0.0
estimatedMinutes: 5
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `telegram-mcp` from npm via `npx` on first launch - no
      manual install needed. The MCP uses *your* Telegram user account
      (not a bot) so it can read private chats and channels you've joined.
  - id: credentials
    title: Paste api_id, api_hash, and phone number
    estSeconds: 240
    externalAction: { label: "Open my.telegram.org", url: "https://my.telegram.org" }
    inputs:
      - { name: TELEGRAM_API_ID, label: "api_id" }
      - { name: TELEGRAM_API_HASH, label: "api_hash", secret: true }
      - { name: TELEGRAM_PHONE, label: "Phone number (E.164)" }
    warning: |
      Telegram will send a login code to your account. Enter it when prompted
      in the Wayland UI on first connect. Your session file is stored locally.
    body: |
      Telegram requires `api_id` and `api_hash` for any user-account client.
      Free and one-time. Per Telegram, do not share these credentials with
      others.

      **A. Sign in to my.telegram.org**

      1. Click **Open my.telegram.org** above. Enter your Telegram phone
         number in international format (e.g. `+15555550123`) and request
         the code.
      2. Telegram sends a login code to your active Telegram app (Desktop
         or mobile). Enter it on the website to sign in.

      **B. Register an application**

      1. From the signed-in landing page, open **API development tools**
         (or paste `my.telegram.org/apps` into the address bar).
      2. Fill out the create-application form. App title and short name can
         be anything (e.g. *Wayland Personal* / *wayland*). Platform: pick
         **Desktop**. URL and Description can be left blank.
      3. Submit the form. The next page shows your `api_id` (a number) and
         `api_hash` (a 32-char hex string).

      **C. Paste credentials into Wayland**

      1. Paste the number into `TELEGRAM_API_ID` above.
      2. Paste the hash into `TELEGRAM_API_HASH`.
      3. Paste the same phone number you used to sign in into
         `TELEGRAM_PHONE` (E.164 format with the leading `+`).

      On first connect, Telegram will send a login code to your Telegram
      app - Wayland will prompt you for it. The resulting session file is
      stored locally and re-used on every restart.
---

# Telegram setup

Telegram uses *your* account (not a bot) so it works in private chats and
channels you read. About five minutes the first time.

## Step 2 - Paste credentials

1. Open **my.telegram.org** and sign in with your Telegram phone number.
2. Click **API development tools** and create an app. Name and description
   can be anything.
3. Copy `api_id` and `api_hash` and paste them above, along with your phone
   number in E.164 format (e.g. `+15555550123`).
4. On first connect, Telegram will text/in-app a login code. Wayland will
   prompt you to enter it.
