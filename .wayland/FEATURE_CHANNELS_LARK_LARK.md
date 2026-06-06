# Lark Integration Plan

> This document describes the complete development plan for Lark platform integration, extending the existing Telegram plugin architecture.

---

## 1. Feature Overview

### 1.1 Basic Information

- **Feature Name**: Lark Bot Integration
- **Module**: Channel Plugin layer
- **Process**: Main process
- **Runtime Environment**: GUI mode (Wayland running)
- **Dependencies**: Existing Channel architecture, PairingService, SessionManager

### 1.2 Feature Description

1. Reuse the existing Channel plugin architecture to add Lark platform support
2. Users can converse with Wayland via a Lark bot
3. Supports switching between multiple agents: Gemini, Claude, Codex, etc.
4. Full feature parity with the Telegram integration

### 1.3 User Scenario

```
Trigger: User @mentions WaylandBot in Lark or sends a direct message
Flow: Lark bot receives message → forwards to Aion Agent → LLM processes it
Result: After processing, the result is pushed back to the user via a Lark message card
```

### 1.4 Reference Resources

- **Lark Open Platform**: https://open.feishu.cn/
- **Node SDK**: https://github.com/larksuite/node-sdk
- **Existing Implementation**: `src/channels/plugins/telegram/`

---

## 2. Technology Choices

### 2.1 Platform Comparison

| Item             | Telegram                         | Lark                               |
| ---------------- | -------------------------------- | ---------------------------------- |
| **Bot Library**  | grammY                           | @larksuiteoapi/node-sdk            |
| **Run Mode**     | Polling / Webhook                | WebSocket long connection / Webhook |
| **Auth Method**  | Bot Token                        | App ID + App Secret                |
| **UI Components**| Inline Keyboard + Reply Keyboard | Message Cards                      |
| **Message Format**| Markdown / HTML                 | Rich text / Message Card JSON      |
| **Streaming Update**| editMessageText               | PATCH /im/v1/messages/:id          |

### 2.2 Technology Selection

| Item        | Choice                  | Notes                                          |
| ----------- | ----------------------- | ---------------------------------------------- |
| SDK         | @larksuiteoapi/node-sdk | Official Node.js SDK                           |
| Run Mode    | WebSocket (preferred)   | No public IP required; suitable for desktop apps |
| Message Format | Message Cards        | Supports rich text and interactive buttons     |

---

## 3. Configuration Flow

### 3.1 Lark App Creation

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Create the app                                      │
│   Lark Open Platform → Create internal enterprise app       │
│   → Obtain App ID / App Secret                              │
├─────────────────────────────────────────────────────────────┤
│ Step 2: Enable bot capability                               │
│   App Features → Bot → Enable                               │
├─────────────────────────────────────────────────────────────┤
│ Step 3: Configure permissions                               │
│   Permission Management → Add the following permissions:    │
│   • im:message (send and receive DM and group messages)     │
│   • im:message.group_at_msg (receive @bot messages in groups)│
│   • im:chat (read group information)                        │
│   • contact:user.id:readonly (read user IDs)                │
├─────────────────────────────────────────────────────────────┤
│ Step 4: Publish the app                                     │
│   Version Management & Release → Create Version → Submit   │
├─────────────────────────────────────────────────────────────┤
│ Step 5: Configure Wayland                                   │
│   Settings → Channels → Lark → Paste App ID/Secret → Start │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Configuration Fields

| Field       | Type                 | Description                         | Required |
| ----------- | -------------------- | ----------------------------------- | :------: |
| App ID      | string               | Lark App ID                         |  ✅  |
| App Secret  | string               | Lark App Secret                     |  ✅  |
| Run Mode    | websocket / webhook  | Event reception mode                |  ✅  |
| Webhook URL | string               | Required only in webhook mode       |  ❌  |
| Pairing Mode| boolean              | Whether pairing code auth is needed |  ✅  |
| Rate Limit  | number               | Max messages per minute             |  ❌  |
| Default Agent| gemini / acp / codex| Default agent to use               |  ✅  |

---

## 4. Pairing Security Mechanism

### 4.1 Flow Design (same as Telegram)

```
┌─────────────────────────────────────────────────────────────┐
│ ① User initiates from Lark                                  │
│    User → @WaylandBot: any message                          │
├─────────────────────────────────────────────────────────────┤
│ ② Bot returns a pairing request (message card)              │
│    ┌────────────────────────────────────────┐              │
│    │ 👋 Welcome to Aion Assistant!          │              │
│    │                                        │              │
│    │ 🔑 Pairing Code: ABC123               │              │
│    │ Please approve this pairing in Wayland │              │
│    │                                        │              │
│    │ [📖 User Guide]  [🔄 Refresh Status]  │              │
│    └────────────────────────────────────────┘              │
├─────────────────────────────────────────────────────────────┤
│ ③ Wayland displays the pending approval request             │
│    Settings page shows: username, pairing code, request     │
│    time, [Approve] / [Reject]                               │
├─────────────────────────────────────────────────────────────┤
│ ④ User clicks [Approve] in Wayland                          │
├─────────────────────────────────────────────────────────────┤
│ ⑤ Bot pushes pairing success message                        │
│    Bot → User: "✅ Pairing successful! You can now chat."   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Security Measures

| Mechanism              | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| Pairing code auth      | 6-character random code, valid for 10 minutes        |
| Local approval         | Must be approved in Wayland, not in Lark             |
| User whitelist         | Only authorized users can use the bot                |
| Rate limiting          | Prevents abuse                                       |
| Encrypted credential storage | App Secret stored using encrypted storage    |

---

## 5. Message Conversion Rules

### 5.1 Inbound Conversion (Lark → Unified Format)

| Lark Event Type                 | Unified message content.type |
| ------------------------------- | ---------------------------- |
| `im.message.receive_v1` (text)  | `text`                       |
| `im.message.receive_v1` (image) | `image`                      |
| `im.message.receive_v1` (file)  | `file`                       |
| `im.message.receive_v1` (audio) | `audio`                      |
| `card.action.trigger`           | `action`                     |

### 5.2 Outbound Conversion (Unified Format → Lark)

| Unified message type | Lark API                  | content_type |
| -------------------- | ------------------------- | ------------ |
| `text`               | POST /im/v1/messages      | text         |
| `image`              | POST /im/v1/messages      | image        |
| `buttons`            | POST /im/v1/messages      | interactive  |
| Streaming update     | PATCH /im/v1/messages/:id | -            |

### 5.3 Message Card Structure

```json
{
  "config": {
    "wide_screen_mode": true
  },
  "header": {
    "title": {
      "tag": "plain_text",
      "content": "Aion Assistant"
    }
  },
  "elements": [
    {
      "tag": "markdown",
      "content": "Message content..."
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": { "tag": "plain_text", "content": "🆕 New Chat" },
          "type": "primary",
          "value": { "action": "session.new" }
        }
      ]
    }
  ]
}
```

---

## 6. Interaction Design

### 6.1 Component Mapping

| Scenario                  | Telegram              | Lark                        |
| ------------------------- | --------------------- | --------------------------- |
| **Persistent quick actions** | Reply Keyboard     | Message card bottom button group |
| **Message action buttons**| Inline Keyboard       | Message card interactive buttons |
| **Pairing request**       | Text + buttons        | Message card                |
| **AI reply**              | Markdown + buttons    | Rich text/card + buttons    |
| **Settings menu**         | Multi-level Inline Keyboard | Message card          |

### 6.2 Interaction Scenarios

**Scenario 1: Main menu after successful pairing**

```
┌─────────────────────────────────────────────────────────────┐
│                    Message Card                              │
├─────────────────────────────────────────────────────────────┤
│  ✅ Pairing successful! You can now start chatting.         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [🆕 New Chat]  [🔄 Agent]  [📊 Status]  [❓ Help]   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Scenario 2: AI reply with action buttons**

````
┌─────────────────────────────────────────────────────────────┐
│                    Message Card                              │
├─────────────────────────────────────────────────────────────┤
│  Here is a quicksort implementation:                        │
│                                                             │
│  ```python                                                  │
│  def quicksort(arr):                                        │
│      if len(arr) <= 1:                                      │
│          return arr                                         │
│      ...                                                    │
│  ```                                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [📋 Copy]  [🔄 Regenerate]  [💬 Continue]           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
````

**Scenario 3: Agent switching**

```
┌─────────────────────────────────────────────────────────────┐
│                    Message Card                              │
├─────────────────────────────────────────────────────────────┤
│  🔄 Switch Agent                                            │
│                                                             │
│  Select an AI Agent:                                        │
│  Current: 🤖 Gemini                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [✓ 🤖 Gemini]  [🧠 Claude]  [⚡ Codex]              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. File Structure

```
src/channels/
├── plugins/
│   ├── telegram/              # Existing Telegram plugin
│   │   ├── TelegramPlugin.ts
│   │   ├── TelegramAdapter.ts
│   │   ├── TelegramKeyboards.ts
│   │   └── index.ts
│   │
│   └── lark/                  # New Lark plugin
│       ├── LarkPlugin.ts      # Lark plugin main class
│       ├── LarkAdapter.ts     # Message format conversion
│       ├── LarkCards.ts       # Message card templates
│       └── index.ts
│
├── types.ts                   # Add 'lark' to PluginType
└── ...
```

---

## 8. Interface Design

### 8.1 LarkPlugin Class

```typescript
class LarkPlugin extends BasePlugin {
  // Lifecycle
  async initialize(config: LarkPluginConfig): Promise<void>;
  async start(): Promise<void>;
  async stop(): Promise<void>;

  // Message handling
  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string>;
  async editMessage(chatId: string, messageId: string, message: IUnifiedOutgoingMessage): Promise<void>;

  // Event handling
  private handleMessageEvent(event: LarkMessageEvent): void;
  private handleCardAction(action: LarkCardAction): void;

  // Token management
  private async refreshAccessToken(): Promise<void>;
}
```

### 8.2 Configuration Interface

```typescript
interface LarkPluginConfig {
  appId: string;
  appSecret: string;
  mode: 'websocket' | 'webhook';
  webhookUrl?: string;
  encryptKey?: string; // Event encryption key
  verificationToken?: string; // Event verification token
}
```

---

## 9. Lark-Specific Notes

| Item                    | Description                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| **App Type**            | Internal enterprise apps are recommended; personal developer accounts have feature restrictions |
| **Permission Review**   | Some permissions require admin approval                                  |
| **Message Card Limit**  | Card JSON max 30KB; long messages must be split into chunks              |
| **Token Refresh**       | Access Token is valid for 2 hours and must be refreshed automatically    |
| **Event Subscription**  | WebSocket mode requires no public IP; more suitable for desktop apps     |
| **@ Mentions**          | In group chats, the bot must be @mentioned to receive the message        |

---

## 10. Development Plan

### Phase 1: Basic Connection (estimated 2–3 days)

- [ ] Create LarkPlugin base class
- [ ] Implement WebSocket event reception
- [ ] Implement automatic Access Token refresh
- [ ] Basic send/receive message functionality

### Phase 2: Security Authentication (estimated 1–2 days)

- [ ] Reuse PairingService
- [ ] Pairing flow message cards
- [ ] Settings page UI adaptation

### Phase 3: Interaction Polish (estimated 2–3 days)

- [ ] Message card template system
- [ ] Button callback handling
- [ ] Agent switching functionality
- [ ] Streaming response support

### Phase 4: Optimization (estimated 1–2 days)

- [ ] Long message chunking
- [ ] Improved error handling
- [ ] Multi-language support
- [ ] Logging and monitoring

---

## 11. Feature Parity Checklist

| Feature               | Telegram | Lark | Reused Component      |
| --------------------- | :------: | :--: | --------------------- |
| Bot config validation |    ✅    |  🔲  | -                     |
| Bot start/stop        |    ✅    |  🔲  | ChannelManager        |
| Pairing code auth     |    ✅    |  🔲  | PairingService        |
| Local approval flow   |    ✅    |  🔲  | Existing UI           |
| User whitelist        |    ✅    |  🔲  | Database              |
| Button interactions   |    ✅    |  🔲  | SystemActions         |
| Streaming response    |    ✅    |  🔲  | ChannelMessageService |
| Agent switching       |    ✅    |  🔲  | SystemActions         |
| New conversation      |    ✅    |  🔲  | SessionManager        |
| Rate limiting         |    ✅    |  🔲  | RateLimiter           |

---

## 12. Acceptance Criteria

### 12.1 Functional Acceptance

- [ ] Lark app credential configuration and validation
- [ ] Bot start/stop control
- [ ] Pairing code generation and local approval flow
- [ ] Authorized user management
- [ ] Message card interactions
- [ ] Conversation with Gemini/Claude agents
- [ ] Agent switching functionality
- [ ] New conversation functionality
- [ ] Streaming message response

### 12.2 Security Acceptance

- [ ] Pairing code expires after 10 minutes
- [ ] Approval must happen locally in Wayland
- [ ] Unauthorized users cannot access the bot
- [ ] App Secret stored encrypted
- [ ] Rate limiting is enforced

### 12.3 Compatibility

- [ ] Runs correctly on macOS
- [ ] Runs correctly on Windows
- [ ] Multi-language support

---

## Template Metadata

- **Created**: 2026-01-30
- **Last Updated**: 2026-01-30
- **Applicable Version**: Wayland v0.x+
- **Maintainer**: Project team
