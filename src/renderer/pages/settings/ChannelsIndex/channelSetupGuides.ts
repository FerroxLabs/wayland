/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Structured, per-channel "How to set up" content rendered by
 * {@link ChannelSetupGuide}. Each guide is an ordered list of numbered steps.
 * A step is a line of instruction plus optional external links (developer
 * consoles, token pages) that open in the user's browser.
 *
 * Content here is verified against each provider's real setup flow. Keep the
 * steps accurate: users follow them verbatim to obtain tokens / app passwords
 * / scopes. All copy is surfaced through i18n with inline fallbacks so the
 * English defaults live next to the data.
 */

/** An external link inside a setup step. Opens via the app's external-link bridge. */
export type ChannelGuideLink = {
  /** i18n key for the link label. */
  labelKey: string;
  /** English fallback for the link label. */
  labelDefault: string;
  /** Absolute https URL opened in the user's browser. */
  url: string;
};

/** One numbered step in a channel setup guide. */
export type ChannelGuideStep = {
  /** i18n key for the step text. */
  textKey: string;
  /** English fallback for the step text. */
  textDefault: string;
  /** Optional external links shown beneath the step text. */
  links?: ChannelGuideLink[];
};

/** A complete, ordered setup guide for a single channel. */
export type ChannelSetupGuideContent = {
  /** i18n key for the guide title shown on the collapsed accordion header. */
  titleKey: string;
  /** English fallback for the guide title. */
  titleDefault: string;
  /** Ordered steps. Rendered as a numbered list. */
  steps: ChannelGuideStep[];
};

const HOW_TO_SET_UP_TITLE = {
  titleKey: 'settings.channelGuide.title',
  titleDefault: 'How to set up',
} as const;

/**
 * Channel guides keyed by the same `channelId` passed to ChannelDetailLayout.
 * Channels without an entry simply render no guide.
 */
export const CHANNEL_SETUP_GUIDES: Readonly<Record<string, ChannelSetupGuideContent>> = {
  slack: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.slack.step1',
        textDefault: 'Click "Create New App" then "From scratch". Name it and pick your workspace.',
        links: [
          {
            labelKey: 'settings.channelGuide.slack.step1.link',
            labelDefault: 'Open api.slack.com/apps',
            url: 'https://api.slack.com/apps',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.slack.step2',
        textDefault:
          'In the left nav open "OAuth & Permissions". Under Bot Token Scopes add chat:write, app_mentions:read, channels:history, channels:read, im:history, im:read, users:read. Then click "Install to Workspace" and copy the Bot User OAuth Token (starts with xoxb-).',
      },
      {
        textKey: 'settings.channelGuide.slack.step3',
        textDefault:
          'Open "Basic Information" then App-Level Tokens then "Generate Token and Scopes". Add the connections:write scope and Generate. Copy the token (starts with xapp-).',
      },
      {
        textKey: 'settings.channelGuide.slack.step4',
        textDefault: 'In the left nav open "Socket Mode" and toggle Enable Socket Mode on.',
      },
      {
        textKey: 'settings.channelGuide.slack.step5',
        textDefault:
          'Open "Event Subscriptions" and toggle it on. Under "Subscribe to bot events" add message.channels, message.im, app_mention, then Save. IMPORTANT: reinstall the app to the workspace after adding events, or events will not arrive.',
      },
      {
        textKey: 'settings.channelGuide.slack.step6',
        textDefault:
          'Paste the Bot token (xoxb-) and App token (xapp-) here, choose transport Socket Mode, then Test & Enable.',
      },
      {
        textKey: 'settings.channelGuide.slack.step7',
        textDefault: 'Invite the bot to a channel with /invite @YourBot, or DM it.',
      },
    ],
  },

  telegram: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.telegram.step1',
        textDefault: 'In Telegram, open a chat with @BotFather.',
        links: [
          {
            labelKey: 'settings.channelGuide.telegram.step1.link',
            labelDefault: 'Open @BotFather in Telegram',
            url: 'https://t.me/BotFather',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.telegram.step2',
        textDefault: 'Send /newbot, then choose a name and a username ending in "bot".',
      },
      {
        textKey: 'settings.channelGuide.telegram.step3',
        textDefault: 'BotFather replies with an HTTP API token (looks like 123456:ABC-DEF...). Copy it.',
      },
      {
        textKey: 'settings.channelGuide.telegram.step4',
        textDefault: 'Paste the token here and Test & Enable. Then message your bot.',
      },
    ],
  },

  discord: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.discord.step1',
        textDefault: 'Open the Discord developer portal and create a New Application. Name it.',
        links: [
          {
            labelKey: 'settings.channelGuide.discord.step1.link',
            labelDefault: 'Open discord.com/developers/applications',
            url: 'https://discord.com/developers/applications',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.discord.step2',
        textDefault: 'In the left nav open "Bot", then Reset/Copy Token. Copy the bot token.',
      },
      {
        textKey: 'settings.channelGuide.discord.step3',
        textDefault:
          'On the same Bot page, enable BOTH privileged intents: "Message Content Intent" and "Server Members Intent". Save.',
      },
      {
        textKey: 'settings.channelGuide.discord.step4',
        textDefault:
          'In the left nav open "OAuth2" then URL Generator. Scopes: bot. Bot permissions: Send Messages, Read Message History. Open the generated URL to invite the bot to your server.',
      },
      {
        textKey: 'settings.channelGuide.discord.step5',
        textDefault: 'Paste the bot token here and Test & Enable.',
      },
    ],
  },

  'email-imap': {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.emailImap.step1',
        textDefault:
          'Type your email address in IMAP User. Common providers (Gmail, Outlook, iCloud, Yahoo, Proton, Fastmail) auto-fill the host and ports.',
      },
      {
        textKey: 'settings.channelGuide.emailImap.step2',
        textDefault:
          'You need an APP PASSWORD, not your normal login. It requires 2-Step Verification / 2FA enabled on the account first.',
        links: [
          {
            labelKey: 'settings.channelGuide.emailImap.step2.gmail',
            labelDefault: 'Gmail app passwords (enable 2-Step Verification first)',
            url: 'https://myaccount.google.com/apppasswords',
          },
          {
            labelKey: 'settings.channelGuide.emailImap.step2.outlook',
            labelDefault: 'Outlook / Microsoft Advanced security options',
            url: 'https://account.microsoft.com/security',
          },
          {
            labelKey: 'settings.channelGuide.emailImap.step2.icloud',
            labelDefault: 'iCloud App-Specific Passwords',
            url: 'https://appleid.apple.com',
          },
          {
            labelKey: 'settings.channelGuide.emailImap.step2.workspace',
            labelDefault: 'Google Workspace admin: enable IMAP org-wide',
            url: 'https://admin.google.com',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.emailImap.step3',
        textDefault:
          'Also enable IMAP in your mailbox if your provider has a toggle (Gmail: Settings then Forwarding and POP/IMAP then Enable IMAP).',
      },
      {
        textKey: 'settings.channelGuide.emailImap.step4',
        textDefault:
          'Paste the app password into IMAP Password and Test & Enable. Replies go back to whoever emails the inbox.',
      },
    ],
  },

  signal: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.signal.step1',
        textDefault: 'Install signal-cli: on macOS run `brew install signal-cli` (it pulls Java automatically).',
      },
      {
        textKey: 'settings.channelGuide.signal.step2',
        textDefault:
          'Connect a number. Easiest is to LINK as a secondary device to your existing Signal: run `signal-cli link -n "Wayland"`, it prints a sgnl:// URI / QR; on your phone go to Signal then Settings then Linked Devices then + and scan it. (Alternatively register a fresh number with `signal-cli -a +1XXXXXXXXXX register` then `verify`.)',
      },
      {
        textKey: 'settings.channelGuide.signal.step3',
        textDefault:
          'Enter your phone number in E.164 format (+1...) here, set cliPath only if signal-cli is not on PATH, then Test & Enable.',
      },
    ],
  },

  whatsapp: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.whatsapp.step1',
        textDefault:
          'Pick a Backend. Easiest is Baileys (or WhatsApp Web.js): choose it, then scan the QR code with WhatsApp on your phone (Settings then Linked Devices then Link a Device). No tokens needed. Meta Business is for verified business accounts and templated messaging.',
      },
      {
        textKey: 'settings.channelGuide.whatsapp.step2',
        textDefault:
          "For the Meta Business backend (official WhatsApp Cloud API): in the Meta for Developers console create an app, add the WhatsApp product, then under WhatsApp then API Setup copy the temporary Access Token and the Phone Number ID. The form requires only Access Token and Phone Number ID; Business Account ID, Verify Token, and App Secret are optional (needed only if you wire Meta's webhook back).",
        links: [
          {
            labelKey: 'settings.channelGuide.whatsapp.step2.link',
            labelDefault: 'Open Meta for Developers',
            url: 'https://developers.facebook.com/apps',
          },
        ],
      },
    ],
  },

  'sms-twilio': {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.smsTwilio.step1',
        textDefault: 'In the Twilio Console, copy your Account SID and Auth Token from the dashboard.',
        links: [
          {
            labelKey: 'settings.channelGuide.smsTwilio.step1.link',
            labelDefault: 'Open console.twilio.com',
            url: 'https://console.twilio.com',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.smsTwilio.step2',
        textDefault:
          'Get a Twilio phone number (Phone Numbers then Manage then Buy a number) with SMS capability, in E.164 format (+1...). Or create a Messaging Service and use its SID.',
      },
      {
        textKey: 'settings.channelGuide.smsTwilio.step3',
        textDefault: 'Paste Account SID, Auth Token, and the From number (or Messaging Service SID) here.',
      },
      {
        textKey: 'settings.channelGuide.smsTwilio.step4',
        textDefault:
          'Inbound SMS needs a public URL for Twilio\'s webhook. Enable the tunnel option (or paste your own https URL) and set that URL as the "A Message Comes In" webhook on your Twilio number.',
      },
    ],
  },

  'google-chat': {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.googleChat.step1',
        textDefault:
          'In Google Cloud Console, pick or create a project and enable the Google Chat API and Cloud Pub/Sub API.',
        links: [
          {
            labelKey: 'settings.channelGuide.googleChat.step1.link',
            labelDefault: 'Open Google Cloud Console',
            url: 'https://console.cloud.google.com',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.googleChat.step2',
        textDefault: 'Create a service account, download its JSON key, and paste the JSON here.',
      },
      {
        textKey: 'settings.channelGuide.googleChat.step3',
        textDefault:
          'For inbound with NO public URL, use Pub/Sub: create a Pub/Sub topic, grant chat-api-push@system.gserviceaccount.com the Pub/Sub Publisher role on it, create a pull subscription, and grant your service account the Pub/Sub Subscriber role on the subscription. In the Chat API Configuration then Connection settings, choose Cloud Pub/Sub and enter your topic. Set Inbound transport to "Pub/Sub pull" here and enter the subscription path.',
      },
      {
        textKey: 'settings.channelGuide.googleChat.step4',
        textDefault: 'Add the bot to a space or DM it.',
      },
    ],
  },

  matrix: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.matrix.step1',
        textDefault:
          'Decide which homeserver hosts the bot. Use https://matrix.org for the public flagship server, or your own homeserver URL. The form pre-fills https://matrix.org.',
      },
      {
        textKey: 'settings.channelGuide.matrix.step2',
        textDefault:
          'Create a dedicated account for the bot on that homeserver (register a new user, e.g. @mybot). Its full Matrix ID, including the server suffix (e.g. @mybot:matrix.org), goes in the User ID (mxid) field.',
        links: [
          {
            labelKey: 'settings.channelGuide.matrix.step2.link',
            labelDefault: 'Open app.element.io to register an account',
            url: 'https://app.element.io',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.matrix.step3',
        textDefault:
          'Get an access token for that account. In Element: click the account name (top-left) then All settings then Help & About, scroll to Advanced and reveal Access Token. Copy it (starts with syt_).',
      },
      {
        textKey: 'settings.channelGuide.matrix.step4',
        textDefault:
          'Paste the Homeserver URL, User ID (mxid) and Access Token here, then Test & Enable. Invite the bot account to a room to talk to it.',
      },
    ],
  },

  'ms-teams': {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.msTeams.step1',
        textDefault:
          'In the Azure Portal, create an Azure Bot resource (Create a resource then Azure Bot). Choose "Multi Tenant" or "Single Tenant" and let it create a Microsoft App ID.',
        links: [
          {
            labelKey: 'settings.channelGuide.msTeams.step1.link',
            labelDefault: 'Open the Azure Portal',
            url: 'https://portal.azure.com',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.msTeams.step2',
        textDefault:
          'Open the bot then Configuration to find the Microsoft App ID (a GUID). This is the App ID (MicrosoftAppId) field.',
      },
      {
        textKey: 'settings.channelGuide.msTeams.step3',
        textDefault:
          'Open the app registration (Configuration then "Manage Password", or App Registrations then your app then Certificates & secrets) and create a New client secret. Copy the secret VALUE immediately. This is the App Password (Client Secret) field.',
      },
      {
        textKey: 'settings.channelGuide.msTeams.step4',
        textDefault:
          'In the bot resource open Channels and add the "Microsoft Teams" channel. Copy the Inbound Webhook URL shown here and paste it as the bot Messaging endpoint in Azure (Configuration), so Teams delivers messages to Wayland.',
      },
      {
        textKey: 'settings.channelGuide.msTeams.step5',
        textDefault: 'Paste the App ID and Client Secret here and Test & Enable.',
      },
    ],
  },

  line: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.line.step1',
        textDefault:
          'In the LINE Developers Console, create a provider, then create a channel with type "Messaging API".',
        links: [
          {
            labelKey: 'settings.channelGuide.line.step1.link',
            labelDefault: 'Open the LINE Developers Console',
            url: 'https://developers.line.biz/console/',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.line.step2',
        textDefault:
          'Open the channel then Basic settings and copy the Channel secret. This is the Channel Secret field.',
      },
      {
        textKey: 'settings.channelGuide.line.step3',
        textDefault:
          'Open the Messaging API tab, scroll to "Channel access token (long-lived)" and click Issue. Copy it. This is the Channel Access Token field.',
      },
      {
        textKey: 'settings.channelGuide.line.step4',
        textDefault:
          'Paste both values here and Test & Enable. Then copy the Inbound Webhook URL shown here, paste it into the Messaging API tab\'s Webhook URL field, and turn "Use webhook" on (set the URL first, then enable). Add the bot as a friend via its QR code to chat.',
      },
    ],
  },

  imessage: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.imessage.step1',
        textDefault:
          'This channel runs locally on this Mac and reads the Messages app database directly. It needs no tokens, but it does need macOS Full Disk Access. Sign in to iMessage in the Messages app first.',
      },
      {
        textKey: 'settings.channelGuide.imessage.step2',
        textDefault:
          'Grant Full Disk Access: open System Settings then Privacy & Security then Full Disk Access, and enable Wayland (toggle it on, restart the app if prompted).',
        links: [
          {
            labelKey: 'settings.channelGuide.imessage.step2.link',
            labelDefault: 'Open Full Disk Access settings',
            url: 'x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.imessage.step3',
        textDefault:
          'Optionally set a Poll interval and an Allowed handles allowlist (phone numbers / emails to accept from; blank allows all). Then Test & Enable. Note: text only, attachments are dropped.',
      },
    ],
  },

  lark: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.lark.step1',
        textDefault:
          'Choose your Domain here: Feishu for mainland China (feishu.cn) or Lark for international (larksuite.com). Then open the matching developer console and create a "Custom App" (Enterprise self-built app).',
        links: [
          {
            labelKey: 'settings.channelGuide.lark.step1.feishu',
            labelDefault: 'Open Feishu Open Platform (China)',
            url: 'https://open.feishu.cn/app',
          },
          {
            labelKey: 'settings.channelGuide.lark.step1.lark',
            labelDefault: 'Open Lark Developer (International)',
            url: 'https://open.larksuite.com/app',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.lark.step2',
        textDefault:
          'Open the app then Credentials & Basic Info and copy the App ID (starts with cli_) and App Secret into the matching fields here.',
      },
      {
        textKey: 'settings.channelGuide.lark.step3',
        textDefault:
          'Under Permissions & Scopes add the bot/messaging scopes (im:message, im:message.group_at_msg, im:chat), enable the Bot feature, then create and publish a version so the credentials become active.',
      },
      {
        textKey: 'settings.channelGuide.lark.step4',
        textDefault:
          'Optional: if you enabled event encryption, copy the Encrypt Key and Verification Token from Event Subscriptions into the optional fields here. Then Test & Enable.',
      },
    ],
  },

  dingtalk: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.dingtalk.step1',
        textDefault:
          'In the DingTalk Open Platform, go to Application Development then create an internal Enterprise app (DingTalk app).',
        links: [
          {
            labelKey: 'settings.channelGuide.dingtalk.step1.link',
            labelDefault: 'Open DingTalk Open Platform',
            url: 'https://open-dev.dingtalk.com',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.dingtalk.step2',
        textDefault:
          'Open the app then Credentials & Basic Info and copy the Client ID (formerly AppKey) and Client Secret (formerly AppSecret) into the matching fields here.',
      },
      {
        textKey: 'settings.channelGuide.dingtalk.step3',
        textDefault:
          'Add a Bot to the app and select Stream Mode for receiving messages (no public URL needed). Under Version Management, create and publish a version to activate the credentials.',
      },
      {
        textKey: 'settings.channelGuide.dingtalk.step4',
        textDefault: 'Paste Client ID and Client Secret here (Webhook Secret is optional) and Test & Enable.',
      },
    ],
  },

  wechat: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.wechat.step1',
        textDefault:
          'This channel connects to personal WeChat by scanning a QR code. No developer app, AppID, or tokens are required.',
      },
      {
        textKey: 'settings.channelGuide.wechat.step2',
        textDefault:
          'Click "Scan to Login" here to show a QR code, then in WeChat on your phone tap the + (top-right) then Scan, and scan it to link this session.',
      },
      {
        textKey: 'settings.channelGuide.wechat.step3',
        textDefault:
          'Once connected, pick the Agent and Default Model for WeChat conversations. Keep this Mac online for the session to stay linked.',
      },
    ],
  },

  wecom: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.wecom.step1',
        textDefault:
          'In the WeCom (WeChat Work) app, go to Workspace then Smart Robot then Create Robot then Manual Creation, and choose API Mode.',
        links: [
          {
            labelKey: 'settings.channelGuide.wecom.step1.link',
            labelDefault: 'Open the WeCom admin console',
            url: 'https://work.weixin.qq.com',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.wecom.step2',
        textDefault:
          'Recommended: pick the "Long Connection (WS)" connection mode here. In the robot setup choose "Use Long Connection (WebSocket)", then copy its Bot ID and Secret into the Bot ID and Secret fields. No public URL is required.',
      },
      {
        textKey: 'settings.channelGuide.wecom.step3',
        textDefault:
          'Alternatively pick "Encrypted Callback (Webhook)" mode: set a Callback Token and a 43-character EncodingAESKey in the robot\'s callback config, copy the Callback URL shown here into that config, and enter your CorpID (Admin Console then My Company shows the CorpID at the bottom). Paste Token, EncodingAESKey, and CorpID here.',
      },
      {
        textKey: 'settings.channelGuide.wecom.step4',
        textDefault: 'Test & Enable, then message the robot in WeCom.',
      },
    ],
  },

  mattermost: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.mattermost.step1',
        textDefault:
          'Enter your Mattermost Server URL (e.g. https://mattermost.example.com). For self-hosted servers, ensure Bot Accounts and Personal Access Tokens are enabled in the System Console (Integrations).',
      },
      {
        textKey: 'settings.channelGuide.mattermost.step2',
        textDefault:
          'Create a bot account: System Console then Integrations then Bot Accounts then Add Bot Account. Give it a username and create it, then copy the Access Token it shows once (you cannot view it again).',
        links: [
          {
            labelKey: 'settings.channelGuide.mattermost.step2.link',
            labelDefault: 'Mattermost bot accounts documentation',
            url: 'https://docs.mattermost.com/integrate/admin-guide/admin-bot-accounts.html',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.mattermost.step3',
        textDefault:
          'Paste the Server URL and Access Token here. Team ID is optional (set it to scope the bot to one team). Then Test & Enable and add the bot to a channel.',
      },
    ],
  },

  'nextcloud-talk': {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.nextcloudTalk.step1',
        textDefault:
          'Enter the base URL of your Nextcloud instance (e.g. https://cloud.example.com). The Talk app must be installed on that Nextcloud.',
      },
      {
        textKey: 'settings.channelGuide.nextcloudTalk.step2',
        textDefault:
          'Use a Nextcloud account for the bot (a dedicated user is recommended). Enter that account login name in the Username field.',
      },
      {
        textKey: 'settings.channelGuide.nextcloudTalk.step3',
        textDefault:
          'Sign in to Nextcloud as that account and create an App Password: Settings then Personal then Security then Devices & sessions then "Create new app password". Copy it into the App Password field. Do not use the normal login password.',
        links: [
          {
            labelKey: 'settings.channelGuide.nextcloudTalk.step3.link',
            labelDefault: 'Nextcloud session/app-password management docs',
            url: 'https://docs.nextcloud.com/server/latest/user_manual/en/session_management.html',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.nextcloudTalk.step4',
        textDefault: 'Test & Enable, then add that account to a Talk conversation to chat with it.',
      },
    ],
  },

  irc: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.irc.step1',
        textDefault:
          'Enter the IRC Server (default irc.libera.chat) and Port (default 6697, with TLS on). Choose a Bot Nick.',
      },
      {
        textKey: 'settings.channelGuide.irc.step2',
        textDefault:
          'Optional but recommended on Libera.Chat: register your nick so it is reserved. Connect once with that nick, then message NickServ: /msg NickServ REGISTER yourpassword your@email. Put that password in the optional Password field to log in via SASL/NickServ on connect.',
        links: [
          {
            labelKey: 'settings.channelGuide.irc.step2.link',
            labelDefault: 'Libera.Chat nick registration guide',
            url: 'https://libera.chat/guides/registration',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.irc.step3',
        textDefault:
          'Enter the Channels to join (comma-separated, e.g. #wayland-bots). Username and Real name are optional (they default to the nick). Then Test & Enable.',
      },
    ],
  },

  nostr: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.nostr.step1',
        textDefault:
          'You need a Nostr private key (nsec) for the bot identity. Generate a fresh keypair in any Nostr client (Damus, Amethyst, Primal) or a key generator, and back up the nsec safely. Anyone with the nsec can post as the bot.',
        links: [
          {
            labelKey: 'settings.channelGuide.nostr.step1.link',
            labelDefault: 'About Nostr keys (nsec / npub)',
            url: 'https://nostr.com/',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.nostr.step2',
        textDefault: 'Paste the Private Key (nsec1... or 64-char hex) into the Private Key field.',
      },
      {
        textKey: 'settings.channelGuide.nostr.step3',
        textDefault:
          'Enter one or more Relays as comma-separated wss:// URLs (e.g. wss://relay.damus.io, wss://nos.lol). Optionally restrict who can message the bot via Allowed Senders (npub or hex). Then Test & Enable.',
      },
    ],
  },

  twitch: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.twitch.step1',
        textDefault:
          'Decide which Twitch account the bot posts as (a dedicated bot account is recommended). Its Twitch username is the Bot Username field.',
      },
      {
        textKey: 'settings.channelGuide.twitch.step2',
        textDefault:
          'Generate a chat OAuth token for that account with the chat:read and chat:edit scopes (e.g. via twitchtokengenerator.com while logged in as the bot account). Copy the token into the OAuth Token field (an oauth: prefix or a bare token both work).',
        links: [
          {
            labelKey: 'settings.channelGuide.twitch.step2.link',
            labelDefault: 'Open twitchtokengenerator.com',
            url: 'https://twitchtokengenerator.com',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.twitch.step3',
        textDefault: 'Enter the Channels to join (your channel names, comma-separated). Then Test & Enable.',
      },
      {
        textKey: 'settings.channelGuide.twitch.step4',
        textDefault:
          'Optional: to auto-refresh the chat token, register an app at the Twitch Developer Console and fill the advanced Client ID, Client Secret, and Refresh Token fields.',
        links: [
          {
            labelKey: 'settings.channelGuide.twitch.step4.link',
            labelDefault: 'Open the Twitch Developer Console',
            url: 'https://dev.twitch.tv/console/apps',
          },
        ],
      },
    ],
  },

  'synology-chat': {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.synologyChat.step1',
        textDefault:
          'In the Synology Chat client (web or desktop), open the user-profile menu then Integration. You will create one Incoming webhook (replies go out) and one Outgoing webhook (messages come in).',
        links: [
          {
            labelKey: 'settings.channelGuide.synologyChat.step1.link',
            labelDefault: 'Synology Chat integration docs',
            url: 'https://kb.synology.com/en-global/DSM/help/Chat/chat_integration',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.synologyChat.step2',
        textDefault:
          'Create an Incoming Webhook, pick a channel, and copy its webhook URL into the Incoming Webhook URL field here (Wayland POSTs replies there).',
      },
      {
        textKey: 'settings.channelGuide.synologyChat.step3',
        textDefault:
          'Create an Outgoing Webhook. Copy the Inbound Webhook URL shown here into its "URL" field, then copy the Outgoing webhook\'s Token into the Webhook Token field here (used to verify inbound deliveries).',
      },
      {
        textKey: 'settings.channelGuide.synologyChat.step4',
        textDefault:
          'For a LAN NAS with a self-signed certificate, enable "Allow self-signed certificate". Then Test & Enable.',
      },
    ],
  },

  bluebubbles: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.bluebubbles.step1',
        textDefault:
          'On a Mac that is signed in to iMessage, install and run the BlueBubbles Server app. Complete its setup wizard.',
        links: [
          {
            labelKey: 'settings.channelGuide.bluebubbles.step1.link',
            labelDefault: 'BlueBubbles server setup guide',
            url: 'https://bluebubbles.app/install/',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.bluebubbles.step2',
        textDefault:
          'In the BlueBubbles Server app, set a Server Password (save it with the disk icon) and note the server address under Connection settings. For LAN use http://<mac-ip>:1234. For remote access, enable a proxy (Cloudflare Tunnel or ngrok) and use the URL it gives you.',
      },
      {
        textKey: 'settings.channelGuide.bluebubbles.step3',
        textDefault: 'Paste the Server URL and Server Password here and Test & Enable.',
      },
    ],
  },

  webhook: {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.webhook.step1',
        textDefault:
          "This is a generic HTTP channel. Enter the Outbound URL: the https endpoint of your own service that should receive the agent's replies (Wayland POSTs each reply there as JSON).",
      },
      {
        textKey: 'settings.channelGuide.webhook.step2',
        textDefault:
          'Optional: set an Outbound Secret. Wayland sends it so your service can verify the request is genuinely from Wayland.',
      },
      {
        textKey: 'settings.channelGuide.webhook.step3',
        textDefault:
          'Test & Enable. Then copy the Inbound Webhook URL shown here and have your service POST inbound messages to it (use Rotate to mint a new URL if it leaks).',
      },
    ],
  },

  'email-agentmail': {
    ...HOW_TO_SET_UP_TITLE,
    steps: [
      {
        textKey: 'settings.channelGuide.emailAgentMail.step1',
        textDefault:
          'AgentMail provides hosted email inboxes built for AI agents. Create an account and an inbox in the AgentMail dashboard.',
        links: [
          {
            labelKey: 'settings.channelGuide.emailAgentMail.step1.link',
            labelDefault: 'Open the AgentMail dashboard',
            url: 'https://app.agentmail.to',
          },
        ],
      },
      {
        textKey: 'settings.channelGuide.emailAgentMail.step2',
        textDefault:
          'In the dashboard open API Keys then Create New API Key and copy it (starts with am_) into the API Key field. Enter the provisioned inbox address (e.g. agent@workspace.agentmail.to) in the Inbox Address field.',
      },
      {
        textKey: 'settings.channelGuide.emailAgentMail.step3',
        textDefault:
          "Test & Enable. Then copy the Inbound Webhook URL shown here into the AgentMail dashboard's Webhook URL field so new mail reaches Wayland. Optionally paste AgentMail's signing secret (whsec_...) into Webhook Secret to verify deliveries.",
      },
    ],
  },
};

/** Returns the setup guide for a channel id, or undefined when none exists. */
export const getChannelSetupGuide = (channelId: string): ChannelSetupGuideContent | undefined =>
  CHANNEL_SETUP_GUIDES[channelId];
