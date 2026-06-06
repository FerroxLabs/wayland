# Wayland Personal Assistant Feature Development Plan

> This document describes the complete development plan for the personal assistant feature, including architecture design, plugin system, and interaction design.

---

## 1. Feature Overview

### 1.1 Basic Information

- **Feature Name**: Personal Assistant Feature
- **Module**: Agent layer, conversation system
- **Processes Involved**: Main process, Worker
- **Runtime Environment**: GUI mode (Wayland running)

### 1.2 Feature Description

1. Similar to the WebUI feature, users can directly access Aion functionality through their personal terminal
2. Primarily targets personal-user IM communication tools (Telegram, Lark/Feishu, etc.)
3. Provides a 24/7 personal terminal assistant
4. **Implemented Platforms**: Telegram (grammY), Lark/Feishu (official SDK)
5. **Supported Agents**: Gemini, ACP, Codex

### 1.3 User Scenarios

```
Trigger: User sends a message via a mobile IM tool (e.g., Telegram)
Flow: Platform bot receives message → forwards to Aion Agent → LLM processes it
Result: After processing, the result is pushed back to the user via the same platform
```

### 1.4 Reference Projects

- **Clawdbot**: https://github.com/clawdbot/clawdbot
- Adopted its plugin-based design, pairing security model, and Channel abstraction concepts

---

## 2. Overall Architecture

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  ChannelManager (singleton)                   │
│                  (manages all components uniformly)           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │PluginManager│ │SessionManager│ │PairingService│           │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│  ┌─────────────┐ ┌─────────────────────────────┐            │
│  │ActionExecutor│ │ChannelMessageService         │            │
│  └─────────────┘ └─────────────────────────────┘            │
└────────────────────┼────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Layer 1: Plugin                          │
│                     (platform adapter layer)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐                                   │
│  │ Telegram │ │  Lark    │  ... (Slack, Discord - not yet)  │
│  │  Plugin  │ │  Plugin  │                                   │
│  └────┬─────┘ └────┬─────┘                                   │
│       └────────────┴────────────┘                           │
│                    │                                         │
│  Responsibility: receive platform messages/callbacks →       │
│    convert to unified format → send responses                │
│  Does not care about: agent type, business logic            │
└────────────────────┼────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Layer 2: Gateway                         │
│                     (business logic layer)                   │
├─────────────────────────────────────────────────────────────┤
│  ActionExecutor: system action handling, conversation routing │
│  SessionManager: session management, user authorization      │
│  PairingService: pairing code generation and validation      │
│  ChannelMessageService: streaming message processing         │
│                                                              │
│  Responsibility: system action handling, conversation routing,│
│    session management, permission control                    │
│  Does not care about: platform details, agent internals      │
└────────────────────┼────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Layer 3: Agent                           │
│                     (AI processing layer)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │
│  │ Gemini  │  │   ACP   │  │  Codex  │                      │
│  │  Agent  │  │  Agent  │  │  Agent  │                      │
│  └─────────┘  └─────────┘  └─────────┘                      │
│                                                              │
│  Responsibility: communicate with AI services, manage        │
│    conversation context, return unified responses            │
│  Does not care about: source platform, system-level ops     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
Inbound flow:
  Platform message → Plugin (convert) → ActionExecutor (route) → Agent (process)

  Detailed flow:
  1. Plugin receives platform message → toUnifiedIncomingMessage()
  2. PluginManager calls messageHandler → ActionExecutor.handleMessage()
  3. ActionExecutor routes by action type:
     - Platform Action → handled internally by Plugin
     - System Action → handled by SystemActions
     - Chat Action → ChannelMessageService → Agent

Outbound flow:
  Agent response → ChannelEventBus → ChannelMessageService → ActionExecutor → Plugin (convert) → platform send

  Detailed flow:
  1. Agent Worker sends message → ChannelEventBus.emitAgentMessage()
  2. ChannelMessageService listens for event → handleAgentMessage()
  3. transformMessage + composeMessage → StreamCallback
  4. ActionExecutor calls context.sendMessage/editMessage()
  5. Plugin converts message format → sendMessage/editMessage()
```

---

## 3. Plugin System Design

### 3.1 Plugin Responsibility Boundary

| Plugin is responsible for              | Plugin is NOT responsible for        |
| -------------------------------------- | ------------------------------------ |
| Connecting to platform API             | Agent scheduling and execution       |
| Receiving messages → converting to unified format | Session management and persistence |
| Unified format → converting to platform messages | User authentication and permission control |
| Handling platform-specific commands    | Message routing decisions            |
| Streaming message updates (edit sent messages) |                               |

### 3.2 Plugin Lifecycle

```
created → initializing → ready → starting → running → stopping → stopped
                ↓                    ↓           ↓
              error ←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

| State          | Description                              |
| -------------- | ---------------------------------------- |
| `created`      | Plugin instance created                  |
| `initializing` | Validating config and initializing       |
| `ready`        | Initialization complete, waiting to start |
| `starting`     | Connecting to platform                   |
| `running`      | Running normally                         |
| `stopping`     | Disconnecting                            |
| `stopped`      | Stopped                                  |
| `error`        | An error occurred                        |

### 3.3 Plugin Interface (BasePlugin abstract class)

| Interface Method       | Direction               | Description                              |
| ---------------------- | ----------------------- | ---------------------------------------- |
| `initialize(config)`   | PluginManager → Plugin  | Initialize plugin config                 |
| `start()`              | PluginManager → Plugin  | Start platform connection                |
| `stop()`               | PluginManager → Plugin  | Stop platform connection                 |
| `sendMessage(...)`     | ActionExecutor → Plugin | Send message to platform                 |
| `editMessage(...)`     | ActionExecutor → Plugin | Edit sent message (streaming update)     |
| `getStatus()`          | PluginManager → Plugin  | Get plugin status                        |
| `getActiveUserCount()` | PluginManager → Plugin  | Get active user count                    |
| `getBotInfo()`         | PluginManager → Plugin  | Get bot info                             |
| `onInitialize()`       | Subclass implements     | Platform-specific initialization logic   |
| `onStart()`            | Subclass implements     | Platform-specific start logic            |
| `onStop()`             | Subclass implements     | Platform-specific stop logic             |

### 3.4 Unified Message Format

**Inbound message (platform → system)** - `IUnifiedIncomingMessage`

| Field              | Description                                     |
| ------------------ | ----------------------------------------------- |
| `id`               | System-generated unique ID                      |
| `platform`         | Source platform (telegram/lark/slack/discord)   |
| `chatId`           | Chat ID                                         |
| `user`             | User info (id, username, displayName)           |
| `content`          | Message content (type, text, attachments)       |
| `timestamp`        | Timestamp                                       |
| `replyToMessageId` | ID of the message being replied to (optional)   |
| `action`           | Action info (when triggered by button callback) |
| `raw`              | Raw platform message (optional)                 |

**Outbound message (system → platform)** - `IUnifiedOutgoingMessage`

| Field              | Description                                       |
| ------------------ | ------------------------------------------------- |
| `type`             | Message type (text/image/file/buttons)            |
| `text`             | Text content                                      |
| `parseMode`        | Parse mode (HTML/Markdown/MarkdownV2)             |
| `buttons`          | Inline button groups (optional)                   |
| `keyboard`         | Reply Keyboard (optional)                         |
| `replyMarkup`      | Platform-specific markup (optional, e.g. Lark Card) |
| `replyToMessageId` | ID of the message being replied to (optional)     |
| `imageUrl`         | Image URL (image type)                            |
| `fileUrl`          | File URL (file type)                              |
| `fileName`         | File name (file type)                             |
| `silent`           | Send silently (optional)                          |

### 3.5 Steps to Add a New Platform

1. Create `src/channels/plugins/[platform]/` directory
2. Implement `[Platform]Plugin` extending `BasePlugin`
3. Implement `[Platform]Adapter` for message conversion (`toUnifiedIncomingMessage`, `to[Platform]SendParams`)
4. Register the plugin in the `ChannelManager` constructor: `registerPlugin('platform', PlatformPlugin)`
5. Add the platform type to `PluginType` in `types.ts`
6. Add settings page UI
7. Add i18n translations
8. Implement platform-specific interaction components (e.g. Keyboard, Card, etc.)

---

## 4. Implemented Platforms

### 4.1 Telegram Integration

#### Technology Choices

| Item         | Choice            | Notes                        |
| ------------ | ----------------- | ---------------------------- |
| Bot library  | grammY            | Used by Clawdbot, elegant API |
| Running mode | Polling (long poll) | Auto-reconnect mechanism   |

### 4.1 Technology Choices

| Item         | Choice                             | Notes                        |
| ------------ | ---------------------------------- | ---------------------------- |
| Bot library  | grammY                             | Used by Clawdbot, elegant API |
| Running mode | Polling (dev) / Webhook (prod)     | Configurable                 |

#### Bot Configuration Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Create Bot                                          │
│   User goes to @BotFather in Telegram → /newbot → get Token │
├─────────────────────────────────────────────────────────────┤
│ Step 2: Configure Token                                     │
│   Wayland settings page → paste Token → verify → save       │
├─────────────────────────────────────────────────────────────┤
│ Step 3: Start Bot                                           │
│   Enable toggle → Bot starts listening                      │
├─────────────────────────────────────────────────────────────┤
│ Step 4: User Pairing (see security mechanism below)         │
└─────────────────────────────────────────────────────────────┘
```

#### Configuration Options

| Option       | Type              | Description                            |
| ------------ | ----------------- | -------------------------------------- |
| Bot Token    | string            | Obtained from @BotFather               |
| Running mode | polling / webhook | Polling is suitable for development    |
| Webhook URL  | string            | Only needed in webhook mode            |
| Pairing mode | boolean           | Whether pairing code auth is required  |
| Rate limit   | number            | Max messages per minute                |
| Group @mention | boolean         | Whether @bot mention is required in groups |
| Default Agent | gemini           | Fixed to Gemini for MVP phase          |

#### Pairing Security Mechanism (Clawdbot pattern)

**Core principle**: Approval happens on the user's local device, not in Telegram

```
┌─────────────────────────────────────────────────────────────┐
│ ① User initiates in Telegram                               │
│    User → @YourBot: /start or any message                  │
├─────────────────────────────────────────────────────────────┤
│ ② Bot returns pairing request                              │
│    Bot → User:                                             │
│    "👋 Welcome to the Aion Assistant!                      │
│     Your pairing code: ABC123                              │
│     Please approve this pairing in Wayland:                │
│     Settings → Telegram → Pending Requests → [Approve]"   │
├─────────────────────────────────────────────────────────────┤
│ ③ Wayland shows pending approval request                    │
│    Settings page shows: username, pairing code, request     │
│    time, [Approve]/[Reject]                                 │
├─────────────────────────────────────────────────────────────┤
│ ④ User clicks [Approve] in Wayland                          │
├─────────────────────────────────────────────────────────────┤
│ ⑤ Bot notifies pairing success                             │
│    Bot → User: "✅ Pairing successful! You can now chat"   │
└─────────────────────────────────────────────────────────────┘
```

**Security Measures**

| Mechanism          | Description                                       |
| ------------------ | ------------------------------------------------- |
| Pairing code auth  | 6-character random code, valid for 10 minutes     |
| Local approval     | Must be approved in Wayland, not in Telegram      |
| User whitelist     | Only authorized users can use the bot             |
| Rate limiting      | Prevents abuse                                    |
| Token encrypted storage | Encrypted with bcrypt                        |

#### Message Conversion Rules

**Inbound conversion (Telegram → unified format)**

| Telegram message type | Unified message content.type             |
| --------------------- | ---------------------------------------- |
| `message:text`        | `text` or `command` (starts with /)     |
| `message:photo`       | `image`                                  |
| `message:document`    | `file`                                   |
| `message:voice`       | `audio`                                  |

**Outbound conversion (unified format → Telegram)**

| Unified message type | Telegram API                       |
| -------------------- | ---------------------------------- |
| `text`               | `sendMessage`                      |
| `image`              | `sendPhoto`                        |
| `file`               | `sendDocument`                     |
| `buttons`            | `sendMessage` + `inline_keyboard`  |

**Special handling**

| Scenario          | Handling                                          |
| ----------------- | ------------------------------------------------- |
| Streaming response | Use `editMessageText` to update message, add ▌ cursor |
| Markdown          | Escape special characters, use `parse_mode: Markdown` |
| Remove @mention   | Strip `@bot_username` from message                |
| Group filter      | Check for @mention presence (configurable)        |

### 4.2 Lark/Feishu Integration

#### Technology Choices

| Item         | Choice                         | Notes                          |
| ------------ | ------------------------------ | ------------------------------ |
| SDK          | @larksuiteoapi/node-sdk        | Official SDK                   |
| Running mode | WebSocket long connection      | No public URL required         |
| Domain       | Feishu (configurable for Lark international) | Uses Feishu domain by default |

#### Bot Configuration Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Create Application                                  │
│   Create an in-house app on the Feishu open platform →      │
│   obtain App ID and App Secret                              │
├─────────────────────────────────────────────────────────────┤
│ Step 2: Configure Permissions                               │
│   App permissions → enable "send and receive DM and         │
│   group messages" permission                                │
├─────────────────────────────────────────────────────────────┤
│ Step 3: Configure Event Subscription                        │
│   Event subscription → subscribe to "receive message" event │
│   → configure encryption key (optional)                     │
├─────────────────────────────────────────────────────────────┤
│ Step 4: Configure Credentials                               │
│   Wayland settings page → paste App ID, App Secret →        │
│   verify → save                                             │
├─────────────────────────────────────────────────────────────┤
│ Step 5: Start Bot                                           │
│   Enable toggle → Bot connects via WebSocket and listens    │
├─────────────────────────────────────────────────────────────┤
│ Step 6: User Pairing (see security mechanism below)         │
└─────────────────────────────────────────────────────────────┘
```

#### Configuration Options

| Option             | Type    | Description                          |
| ------------------ | ------- | ------------------------------------ |
| App ID             | string  | Obtained from Feishu open platform   |
| App Secret         | string  | Obtained from Feishu open platform   |
| Encrypt Key        | string  | Event encryption key (optional)      |
| Verification Token | string  | Event verification token (optional)  |
| Pairing mode       | boolean | Whether pairing code auth is required |
| Rate limit         | number  | Max messages per minute              |
| Default Agent      | gemini  | Fixed to Gemini for MVP phase        |

#### Pairing Security Mechanism

Same as Telegram - uses local approval mode. The pairing code is sent to the user via a Lark message; the user approves in Wayland.

#### Message Conversion Rules

**Inbound conversion (Lark → unified format)**

| Lark message type | Unified message content.type               |
| ----------------- | ------------------------------------------ |
| `message:text`    | `text` or `command` (starts with /)       |
| `message:image`   | `photo`                                    |
| `message:file`    | `document`                                 |
| `message:audio`   | `audio`                                    |
| Card Action       | `action` (via extractCardAction)           |

**Outbound conversion (unified format → Lark)**

| Unified message type | Lark API                   |
| -------------------- | -------------------------- |
| `text`               | `im.message.create`        |
| `buttons`            | `im.message.create` + Card |
| Interactive Card     | Uses Lark Card format      |

**Special handling**

| Scenario             | Handling                                                   |
| -------------------- | ---------------------------------------------------------- |
| Streaming response   | Use `im.message.update` to update message                  |
| HTML to Markdown     | convertHtmlToLarkMarkdown() converts HTML to Lark Markdown |
| Card interaction     | Uses Lark Card format, supports buttons, confirmations, etc. |
| Event deduplication  | 5-minute event cache to prevent duplicate processing       |

---

## 5. Interaction Design

### 5.1 Design Principles

**Buttons first, commands preserved**: Regular users interact via buttons; power users can use commands

### 5.2 Telegram Interaction Components

| Type                | Description                     | Use Case                          |
| ------------------- | ------------------------------- | --------------------------------- |
| **Inline Keyboard** | Buttons below messages          | Action confirmation, option selection |
| **Reply Keyboard**  | Replaces the keyboard input bar | Shortcut entry for common actions |
| **Menu Button**     | Left of the chat input box      | Fixed feature entry point         |

### 5.3 Interaction Scenario Design

**Scenario 1: First use / pairing**

```
Bot message:
┌─────────────────────────────────────────┐
│ 👋 Welcome to the Aion Assistant!       │
│                                          │
│ 🔑 Pairing code: ABC123                 │
│ Please approve this pairing in Wayland  │
│ Settings                                 │
│                                          │
│ [📖 User Guide]  [❓ Get Help]           │
└─────────────────────────────────────────┘
```

**Scenario 2: After successful pairing (Reply Keyboard always visible)**

```
┌─────────────────────────────────────────┐
│ ... conversation content ...            │
├─────────────────────────────────────────┤
│ Reply Keyboard (persistent shortcuts)   │
│ [🆕 New Chat] [📊 Status] [❓ Help]     │
├─────────────────────────────────────────┤
│ [Type message...]              [Send]   │
└─────────────────────────────────────────┘
```

**Scenario 3: AI reply with action buttons**

````
Bot message:
┌─────────────────────────────────────────┐
│ Here is a quicksort implementation:     │
│                                          │
│ ```python                                │
│ def quicksort(arr):                      │
│     ...                                  │
│ ```                                      │
│                                          │
│ [📋 Copy] [🔄 Regenerate] [💬 Continue] │
└─────────────────────────────────────────┘
````

**Scenario 4: Settings page (card-style selection)**

```
Bot message:
┌─────────────────────────────────────────┐
│ ⚙️ Settings                             │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ 🤖 AI Model                         │ │
│ │ Current: Gemini 1.5 Pro             │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ 💬 Conversation Style               │ │
│ │ Current: Professional               │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ [← Back]                                │
└─────────────────────────────────────────┘
```

### 5.4 Buttons and Commands Reference

| Command (hidden, retained) | Button (user-visible) |
| -------------------------- | --------------------- |
| `/start`                   | Triggered automatically |
| `/new`                     | 🆕 New Chat           |
| `/status`                  | 📊 Status             |
| `/help`                    | ❓ Help               |

---

## 6. Unified Action Handling Mechanism

### 6.1 Design Goal

Commands and button callbacks use unified handling to avoid duplicated logic and to simplify multi-platform extension

### 6.2 Action Categories

| Type                | Description                                 | Handler                 |
| ------------------- | ------------------------------------------- | ----------------------- |
| **Platform Action** | Platform-specific operations (auth, pairing) | Handled internally by Plugin |
| **System Action**   | Platform-agnostic system-level operations   | Gateway ActionHandler   |
| **Chat Action**     | Messages that require Agent processing      | AgentRouter → Agent     |

```
User input
    │
    ├─→ Platform Action → Plugin handles internally (does not enter Gateway)
    │       e.g.: Telegram pairing, Slack OAuth, Discord invite
    │
    ├─→ System Action → Gateway ActionHandler → unified handling
    │       e.g.: session management, settings, help
    │
    └─→ Chat Action → AgentRouter → Gemini/ACP/Codex
```

### 6.3 System Action List (platform-agnostic)

| Category           | Action                  | Description                    |
| ------------------ | ----------------------- | ------------------------------ |
| **Session Mgmt**   | `session.new`           | Create new session             |
|                    | `session.status`        | View current status            |
|                    | `session.list`          | Session list (extended)        |
|                    | `session.switch`        | Switch session (extended)      |
| **Settings**       | `settings.show`         | Show settings menu             |
|                    | `settings.model.list`   | Show model list                |
|                    | `settings.model.select` | Select model                   |
|                    | `settings.agent.select` | Switch Agent (extended)        |
| **Help**           | `help.show`             | Show help                      |
| **Navigation**     | `nav.back`              | Go back                        |
|                    | `nav.cancel`            | Cancel current operation       |

### 6.4 Platform Action Examples (each Plugin implements its own)

| Platform     | Action            | Description             |
| ------------ | ----------------- | ----------------------- |
| **Telegram** | `pairing.show`    | Show pairing code       |
|              | `pairing.refresh` | Refresh pairing code    |
| **Slack**    | `oauth.start`     | Start OAuth flow        |
|              | `oauth.callback`  | Handle OAuth callback   |
| **Discord**  | `invite.generate` | Generate invite link    |

> **Note**: Platform Actions are handled internally by each Plugin and do not pass through the Gateway ActionHandler

### 6.5 Chat Action List

| Category         | Action            | Description             | Routes to             |
| ---------------- | ----------------- | ----------------------- | --------------------- |
| **Send Message** | `chat.send`       | User sends new message  | Current session Agent |
| **Message Ops**  | `chat.regenerate` | Regenerate response     | Current session Agent |
|                  | `chat.continue`   | Continue generating     | Current session Agent |
|                  | `chat.stop`       | Stop generation         | Current session Agent |

### 6.6 Action Data Structure

```
UnifiedAction {
  action: string          // Action type
  params?: object         // Optional parameters
  context: {
    platform: string      // Source platform
    userId: string        // User ID
    chatId: string        // Chat ID
    messageId?: string    // Triggering message ID
    sessionId?: string    // Current session ID
  }
}
```

### 6.7 Button Callback Data Format

```
Format: action:param1=value1,param2=value2

Examples:
• "session.new"
• "settings.model.select:id=gemini-pro"
• "chat.regenerate:msg=abc123"
```

### 6.8 Unified Response Format

```
ActionResponse {
  text?: string                    // Text content
  parseMode?: 'plain' | 'markdown' // Parse mode
  buttons?: ActionButton[][]       // Inline buttons
  keyboard?: ActionButton[][]      // Reply Keyboard
  behavior: 'send' | 'edit' | 'answer'  // Response behavior
  toast?: string                   // Toast notification
}
```

---

## 7. Session Management

### 7.1 Session and Agent Relationship

```
Session {
  id: string              // Session ID
  platform: string        // Source platform
  userId: string          // User ID
  chatId: string          // Chat ID

  // Agent config
  agentType: string       // gemini / acp / codex
  agentConfig: {
    modelId?: string      // Model ID
  }

  // Session state
  status: string          // active / idle / error
  context: object         // Agent session context

  // Metadata
  createdAt: number
  lastActiveAt: number
}
```

### 7.2 MVP Phase Session Strategy

| Item           | MVP Implementation              |
| -------------- | ------------------------------- |
| Session mode   | Single active session           |
| New session    | Click 🆕 button to clear context |
| Session storage | Independent of Wayland GUI session |
| Agent          | Fixed to Gemini                 |
| Model          | Uses Wayland default config     |

### 7.3 Future Extensions

| Item             | Extension                                    |
| ---------------- | -------------------------------------------- |
| Multi-session    | Support `session.list` / `session.switch`    |
| Agent switching  | Support `settings.agent.select`              |
| Model switching  | Support dynamic model selection              |
| Session sync     | Link Telegram session with Wayland session   |

---

## 8. Streaming Message Architecture

### 8.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Worker (Gemini/ACP/Codex)              │
│                    (Agent Worker process)                        │
├─────────────────────────────────────────────────────────────────┤
│  Sends message events to the IPC Bridge                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ChannelEventBus                               │
│                    (global event bus - singleton)                │
├─────────────────────────────────────────────────────────────────┤
│  emitAgentMessage(conversationId, data)                          │
│  onAgentMessage(handler) → () => void (cleanup)                  │
│                                                                  │
│  Event type: 'channel.agent.message'                             │
│  Data structure: IAgentMessageEvent { ...IResponseMessage, conv_id } │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ChannelMessageService                         │
│                    (message service - singleton)                 │
├─────────────────────────────────────────────────────────────────┤
│  initialize() {                                                  │
│    // Register global event listener at service init            │
│    channelEventBus.onAgentMessage(this.handleAgentMessage);    │
│  }                                                               │
│                                                                  │
│  handleAgentMessage(event) {                                     │
│    // Handle special events: start, finish, error               │
│    // Merge messages using transformMessage + composeMessage     │
│    // Notify via callback: callback(TMessage, isInsert)          │
│  }                                                               │
│                                                                  │
│  sendMessage(sessionId, conversationId, text, callback) {        │
│    // Only sends message, does not set up listeners             │
│    // Calls Agent Task via WorkerManage                          │
│  }                                                               │
│                                                                  │
│  Internal state:                                                 │
│    activeStreams: Map<conversationId, IStreamState>              │
│    messageListMap: Map<conversationId, TMessage[]>               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ActionExecutor                                │
│                    (business executor)                           │
├─────────────────────────────────────────────────────────────────┤
│  handleChatMessage(context, text) {                              │
│    messageService.sendMessage(                                   │
│      sessionId, conversationId, text,                             │
│      (message: TMessage, isInsert: boolean) => {                 │
│        const outgoing = convertTMessageToOutgoing(message, platform); │
│        if (isInsert) context.sendMessage(outgoing);              │
│        else context.editMessage(msgId, outgoing);                │
│      }                                                           │
│    );                                                            │
│  }                                                               │
│                                                                  │
│  convertTMessageToOutgoing(message, platform) {                  │
│    // TMessage → IUnifiedOutgoingMessage                         │
│    // Format text for platform (HTML/Markdown)                   │
│    // text → display content                                     │
│    // tips → icon with hint                                      │
│    // tool_group → tool status list                              │
│  }                                                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Plugin (Telegram/Lark)                       │
│                    (platform plugin)                             │
├─────────────────────────────────────────────────────────────────┤
│  sendMessage(chatId, message: IUnifiedOutgoingMessage)           │
│  editMessage(chatId, messageId, message: IUnifiedOutgoingMessage)│
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Event Type Handling

| Event type          | Source                  | Handling                                     |
| ------------------- | ----------------------- | -------------------------------------------- |
| `start`             | Agent starts responding | Reset message list                           |
| `content`           | Streaming text chunk    | transformMessage → composeMessage → callback |
| `tool_group`        | Tool call status        | Merge into existing tool_group or add new    |
| `finish`/`finished` | Response complete       | Resolve promise, clean up state              |
| `error`             | Error occurred          | Reject promise, clean up state               |
| `thought`           | Thinking process        | Ignored (transformMessage returns undefined) |

### 8.3 Message Merge Strategy (composeMessage)

| Message type | Merge rule                                               |
| ------------ | -------------------------------------------------------- |
| `text`       | Same msg_id: accumulate content; different msg_id: add new |
| `tool_group` | Merge tool status updates by callId                      |
| `tool_call`  | Merge by callId                                          |
| `tips`       | Always add as new                                        |

### 8.4 Stream Callback Parameters

```typescript
type StreamCallback = (chunk: TMessage, isInsert: boolean) => void;

// isInsert = true:  new message, call sendMessage to send a new message
// isInsert = false: update message, call editMessage to edit existing message
```

### 8.5 Throttle Control

| Parameter          | Value  | Description                              |
| ------------------ | ------ | ---------------------------------------- |
| UPDATE_THROTTLE_MS | 500ms  | Minimum interval between message edits  |
| Send new message   | No limit | Sent immediately when isInsert=true    |
| Edit message       | Throttled | Throttle applied when isInsert=false  |

- [ ] Use existing Context: **\*\*\*\***\_\_\_\_**\*\*\*\***
- [ ] Need new Context: **\*\*\*\***\_\_\_\_**\*\*\*\***
- [ ] Component-local state only (useState/useReducer)
- [ ] Requires persistent storage

### 8.6 Key Design Principles

1. **Decouple event listening from message sending**
   - Event listening is set up at service initialization (`initialize()`)
   - `sendMessage()` is only responsible for sending the message, not for listening

2. **Decouple via global event bus**
   - `ChannelMessageService` does not interact with Agent Task directly
   - Decoupled via the `ChannelEventBus` global event bus

3. **Unified message format**
   - `TMessage` is used as the internal unified message format
   - Converted to `IUnifiedOutgoingMessage` on output

---

## 9. Agent Interface Specification

### 8.1 Capabilities Each Agent Must Implement

| Capability      | Description                          |
| --------------- | ------------------------------------ |
| `sendMessage`   | Send message and receive response    |
| `streamMessage` | Send message with streaming          |
| `regenerate`    | Regenerate the last response         |
| `continue`      | Continue generating                  |
| `stop`          | Stop current generation              |
| `getContext`    | Get conversation context             |
| `clearContext`  | Clear conversation context           |

### 8.2 Agent Response Format

```
AgentResponse {
  type: 'text' | 'stream_start' | 'stream_chunk' | 'stream_end' | 'error'
  text?: string
  chunk?: string
  error?: { code: string, message: string }
  metadata?: {
    model?: string
    tokensUsed?: number
    duration?: number
  }
  suggestedActions?: ActionButton[]
}
```

---

## 9. File Structure (actual implementation)

```
src/channels/
├── core/                          # Core modules
│   ├── ChannelManager.ts          # Unified manager (singleton)
│   └── SessionManager.ts          # Session management
│
├── gateway/                       # Gateway layer
│   ├── PluginManager.ts           # Plugin lifecycle management
│   └── ActionExecutor.ts          # Action executor (routing, message handling)
│
├── actions/                       # Action handling (platform-agnostic)
│   ├── types.ts                   # Action/Response type definitions
│   ├── SystemActions.ts          # System actions (session, settings, help)
│   ├── ChatActions.ts            # Chat actions (send, regenerate, etc.)
│   └── PlatformActions.ts        # Platform actions (pairing, etc.)
│
├── agent/                         # Agent integration
│   ├── ChannelEventBus.ts        # Global event bus
│   └── ChannelMessageService.ts  # Streaming message processing service
│
├── pairing/                       # Pairing service
│   └── PairingService.ts         # Pairing code generation and validation (platform-agnostic)
│
├── plugins/                       # Plugin directory
│   ├── BasePlugin.ts              # Plugin abstract base class
│   ├── telegram/
│   │   ├── TelegramPlugin.ts      # Telegram plugin
│   │   ├── TelegramAdapter.ts     # Message adapter
│   │   └── TelegramKeyboards.ts   # Keyboard components
│   └── lark/
│       ├── LarkPlugin.ts          # Lark plugin
│       ├── LarkAdapter.ts         # Message adapter
│       └── LarkCards.ts           # Card components
│
├── utils/                         # Utility functions
│   └── credentialCrypto.ts        # Credential encryption
│
└── types.ts                       # Type definitions
```

---

## 10. Database Design

| Table name                | Purpose                               |
| ------------------------- | ------------------------------------- |
| `assistant_plugins`       | Plugin config (token, mode, etc.)     |
| `assistant_users`         | List of authorized users              |
| `assistant_sessions`      | User session associations             |
| `assistant_pairing_codes` | Pending pairing requests for approval |

---

## 11. External Dependencies

| Package                   | Purpose               | Notes                        |
| ------------------------- | --------------------- | ---------------------------- |
| `grammy`                  | Telegram Bot          | Used by Clawdbot, elegant API |
| `@larksuiteoapi/node-sdk` | Lark/Feishu Bot       | Official SDK                 |
| `@slack/bolt`             | Slack Bot (not yet)   | Official SDK                 |
| `discord.js`              | Discord Bot (not yet) | Official SDK                 |

---

## 12. Implementation Status

### 12.1 Implemented Features

#### Telegram

- [x] Bot Token configuration and validation
- [x] Bot start/stop control (Polling mode, auto-reconnect)
- [x] Pairing code generation and local approval flow
- [x] Authorized user management
- [x] Button interaction (Reply Keyboard + Inline Keyboard)
- [x] Conversation with Gemini/ACP/Codex Agent
- [x] New session feature
- [x] Streaming message response (editMessage updates)
- [x] Tool confirmation interaction
- [x] Error recovery mechanism

#### Lark/Feishu

- [x] App ID/Secret configuration and validation
- [x] Bot start/stop control (WebSocket long connection)
- [x] Pairing code generation and local approval flow
- [x] Authorized user management
- [x] Card interaction (buttons, confirmations, etc.)
- [x] Conversation with Gemini/ACP/Codex Agent
- [x] New session feature
- [x] Streaming message response (updateMessage updates)
- [x] Tool confirmation interaction (Card format)
- [x] Event deduplication (5-minute cache)
- [x] HTML to Lark Markdown conversion

#### Core Features

- [x] ChannelManager unified management
- [x] PluginManager plugin lifecycle management
- [x] SessionManager session management
- [x] PairingService pairing service
- [x] ActionExecutor action routing and execution
- [x] ChannelMessageService streaming message processing
- [x] ChannelEventBus global event bus
- [x] Encrypted credential storage
- [x] Unified multi-platform message format

### 12.2 Security Acceptance Criteria

- [x] Pairing code expires after 10 minutes
- [x] Must be approved locally in Wayland
- [x] Unauthorized users cannot access the bot
- [x] Token/credential encrypted storage
- [ ] Rate limiting (not yet implemented)

### 12.3 Compatibility

- [x] macOS running correctly
- [x] Windows running correctly
- [x] Multi-language support (i18n)

---

## 13. Future Extension Roadmap

| Phase       | Content                              | Status           |
| ----------- | ------------------------------------ | ---------------- |
| **Phase 1** | Telegram + Lark integration          | ✅ Complete      |
| **Phase 2** | Multi-session management, switching  | 🔄 Pending       |
| **Phase 3** | Agent switching (supported, needs UI) | 🔄 Partial      |
| **Phase 4** | Dynamic model switching              | 🔄 Pending       |
| **Phase 5** | Slack platform integration           | 🔄 Pending       |
| **Phase 6** | Discord platform integration         | 🔄 Pending       |
| **Phase 7** | Rate limiting                        | 🔄 Pending       |
| **Phase 8** | Session sync with Wayland            | 🔄 Pending       |
| **Phase 9** | Headless standalone service mode     | 🔄 Pending       |

---

## Template Maintenance

- **Created**: 2025-01-27
- **Last updated**: 2026-02-03
- **Applicable version**: Wayland v1.7.8+
- **Maintainer**: Project team

---

## Appendix: Key Implementation Details

### A.1 ChannelManager Initialization Flow

```typescript
1. ChannelManager.getInstance().initialize()
   ├─ Initialize PluginManager
   ├─ Initialize SessionManager
   ├─ Initialize PairingService
   ├─ Initialize ActionExecutor
   └─ Initialize ChannelMessageService

2. Load plugin config from database
3. For each enabled plugin, call initialize() and start()
```

### A.2 Message Handling Flow

```typescript
1. Plugin receives platform message
   └─ toUnifiedIncomingMessage() conversion

2. PluginManager calls messageHandler
   └─ ActionExecutor.handleMessage()

3. ActionExecutor routes action
   ├─ Platform Action → PlatformActions
   ├─ System Action → SystemActions
   └─ Chat Action → ChannelMessageService

4. ChannelMessageService.sendMessage()
   └─ Calls Agent Task via WorkerManage

5. Agent responds → ChannelEventBus
   └─ ChannelMessageService.handleAgentMessage()
      └─ StreamCallback → ActionExecutor
         └─ Plugin.sendMessage/editMessage()
```

### A.3 Platform-Specific Implementation Notes

**Telegram**

- Uses grammY library
- Polling mode with auto-reconnect support
- Inline Keyboard + Reply Keyboard
- HTML format messages

**Lark/Feishu**

- Uses official Node SDK
- WebSocket long connection mode
- Card format interaction
- Lark Markdown format messages
- Event deduplication (5-minute cache)
