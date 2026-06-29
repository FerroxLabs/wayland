---
guideVersion: 1.1.0
estimatedMinutes: 5
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `@chaindead/telegram-mcp` from npm via `npx` on first
      launch - no manual install needed. The MCP uses *your* Telegram user
      account (not a bot) so it can read private chats and channels you've
      joined.
  - id: credentials
    title: Sign in once in a terminal, then paste api_id + api_hash
    estSeconds: 300
    externalAction: { label: 'Open my.telegram.org', url: 'https://my.telegram.org' }
    inputs:
      - { name: TG_APP_ID, label: 'api_id' }
      - { name: TG_API_HASH, label: 'api_hash', secret: true }
    warning: |
      This server signs in to your Telegram USER account. It cannot prompt for
      the login code over MCP, so you run a ONE-TIME `auth` command in your
      terminal (step B below) to create the local session BEFORE connecting.
      Skipping it makes the connection fail with "Connection closed".
    body: |
      Telegram requires `api_id` and `api_hash` for any user-account client.
      Free and one-time. Per Telegram, do not share these credentials.

      **A. Get your api_id + api_hash**

      1. Click **Open my.telegram.org** above and sign in with your Telegram
         phone number (Telegram sends a code to your active app; enter it on
         the site).
      2. Open **API development tools** (or `my.telegram.org/apps`) and create
         an app. Title/short name can be anything; Platform **Desktop**; URL
         and Description can be blank.
      3. The next page shows your `api_id` (a number) and `api_hash` (a 32-char
         hex string).

      **B. Create the session (one-time, in a terminal)**

      The Telegram login code can't be entered through Wayland, so authenticate
      once in your terminal. Substitute your values and your phone in E.164
      format (leading `+`):

      ```
      TG_APP_ID=<api_id> TG_API_HASH=<api_hash> \
        npx -y @chaindead/telegram-mcp@0.2.0 auth --phone <+15555550123>
      ```

      Enter the login code Telegram sends (and your 2FA password if you have
      one). This writes a session file to `~/.telegram-mcp/session.json`, which
      the server reuses on every connect. Re-run with `--new` to reset it.

      **C. Paste credentials into Wayland**

      1. Paste the number into `TG_APP_ID` above.
      2. Paste the hash into `TG_API_HASH`.
      3. Click **Save & connect**. The server starts in MCP mode against the
         session you just created - no phone or code needed here.
---

# Telegram setup

Telegram uses _your_ account (not a bot) so it works in private chats and
channels you read. About five minutes the first time.

## Step A - Get api_id + api_hash

1. Open **my.telegram.org** and sign in with your Telegram phone number.
2. Click **API development tools** and create an app. Name and description
   can be anything.
3. Copy `api_id` and `api_hash`.

## Step B - Sign in once in a terminal

The Telegram login code can't be entered through Wayland, so create the
session out-of-band (substitute your values + phone in E.164 format):

```
TG_APP_ID=<api_id> TG_API_HASH=<api_hash> \
  npx -y @chaindead/telegram-mcp@0.2.0 auth --phone <+15555550123>
```

Enter the code Telegram sends (and your 2FA password if set). This writes
`~/.telegram-mcp/session.json`, reused on every connect.

## Step C - Paste credentials, then connect

Paste `api_id` into **TG_APP_ID** and `api_hash` into **TG_API_HASH** above,
then **Save & connect**.
