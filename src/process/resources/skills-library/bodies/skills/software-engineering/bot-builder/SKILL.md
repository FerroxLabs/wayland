---
name: bot-builder
description: |
  Bot development expertise covering Slack, Discord, and Telegram bot architecture, command handling patterns, event-driven design, conversation state management, rate limiting, user permission systems, webhook handling, deployment strategies, monitoring, and bot testing approaches.
  Use when the user asks about bot builder, bot builder best practices, or needs guidance on bot builder implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "automation shell-scripting guide"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Bot Builder

## Core Philosophy

A bot is a software agent that interacts with users through a messaging platform. Great bots are responsive, predictable, helpful, and unobtrusive. They should handle errors gracefully, respect rate limits, and provide clear feedback about what they can and cannot do. Design for the messaging platform's idioms -- what works on Slack may not work on Discord.

## Platform Comparison

| Feature | Slack | Discord | Telegram |
|---------|-------|---------|----------|
| Primary audience | Enterprise/Work | Gaming/Community | General |
| Message format | Blocks, mrkdwn | Embeds, Markdown | HTML, Markdown |
| Commands | Slash commands | Slash + prefix | Commands (/) |
| Interactions | Buttons, modals, menus | Buttons, select menus, modals | Inline keyboards, reply keyboards |
| Rate limits | Varies by method | 50 req/s per bot | 30 msg/s, 20 msg/min per chat |
| Webhook support | Yes (Events API) | Yes (Interactions) | Yes (Webhook mode) |
| Threading | Thread replies | Thread replies | Reply-to-message |
| Auth model | OAuth 2.0 + Bot tokens | Bot token | Bot token from BotFather |

## Slack Bot Architecture

### Bolt Framework (Recommended)

```typescript
// src/app.ts
import { App, LogLevel } from '@slack/bolt';

const app = new App({
    token: ENV_CONFIG_VALUE,
    signingSecret: ENV_CONFIG_VALUE,
    socketMode: true,
    appToken: ENV_CONFIG_VALUE,
    logLevel: LogLevel.INFO,
});

// ──────────────────────────────────────────
// Slash Commands
// ──────────────────────────────────────────

app.command('/deploy', async ({ command, ack, respond, client }) => {
    await ack();  // Acknowledge within 3 seconds

    # ... (condensed) ...
});

// Start
(async () => {
    await app.start(3000);
    console.log('Bot is running on port 3000');
})();
```

## Discord Bot Architecture

### Discord.js Framework

```typescript
// src/bot.ts
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder,
         EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
         PermissionFlagsBits } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// ──────────────────────────────────────────
// Register Slash Commands
// ──────────────────────────────────────────

const commands = [
    # ... (condensed) ...

function numberEmoji(n: number): string {
    const emojis = ['1\u20e3', '2\u20e3', '3\u20e3', '4\u20e3', '5\u20e3', '6\u20e3', '7\u20e3', '8\u20e3', '9\u20e3'];
    return emojis[n - 1] || String(n);
}

client.login(ENV_CONFIG_VALUE);
```

## Telegram Bot Architecture

### python-telegram-bot

```python
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler,
    MessageHandler, ConversationHandler, filters
)

# ──────────────────────────────────────────
# Command Handlers
# ──────────────────────────────────────────

async def start(update: Update, context):
    keyboard = [
        [InlineKeyboardButton("Check Status", callback_data='status')],
        [InlineKeyboardButton("Help", callback_data='help')],
    ]
    await update.message.reply_text(
        "Welcome! I'm your DevOps bot. What would you like to do?",
        reply_markup=InlineKeyboardMarkup(keyboard)
    # ... (condensed) ...
        CHOOSING_ENV: [CallbackQueryHandler(env_chosen, pattern='^env_')],
        CONFIRMING: [CallbackQueryHandler(confirm_deploy, pattern='^confirm_')],
    },
    fallbacks=[CommandHandler('cancel', lambda u, c: ConversationHandler.END)],
))

app.run_polling()
```

## Command Handling Patterns

### Command Registry Pattern

```typescript
// commands/registry.ts
interface Command {
    name: string;
    description: string;
    permissions?: string[];
    execute: (context: CommandContext) => Promise<void>;
}

class CommandRegistry {
    private commands = new Map<string, Command>();

    register(command: Command) {
        this.commands.set(command.name, command);
    }

    async handle(name: string, context: CommandContext): Promise<void> {
        const command = this.commands.get(name);
        if (!command) {
            # ... (condensed) ...
});

registry.register({
    name: 'status',
    description: 'Check service status',
    execute: async (ctx) => { /* ... */ },
});
```

## Rate Limiting

```typescript
class BotRateLimiter {
    private userCounts = new Map<string, { count: number; resetAt: number }>();

    constructor(
        private maxRequests: number = 10,
        private windowMs: number = 60000
    ) {}

    isAllowed(userId: string): boolean {
        const now = Date.now();
        const entry = this.userCounts.get(userId);

        if (!entry || now > entry.resetAt) {
            this.userCounts.set(userId, { count: 1, resetAt: now + this.windowMs });
            return true;
        }

        if (entry.count >= this.maxRequests) {
            # ... (condensed) ...
app.use(async ({ next, context }) => {
    if (!limiter.isAllowed(context.userId)) {
        await context.respond('You are sending commands too quickly. Please wait.');
        return;
    }
    await next();
});
```

## Deployment

### Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
USER node
CMD ["node", "dist/bot.js"]
```

```yaml
# docker-compose.yml
services:
  bot:
    build: .
    restart: always
    env_file: .config
    logging:
      driver: json-file
      options: { max-size: "10m", max-file: "3" }
    healthcheck:
      test: ["CMD", "node", "dist/healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Testing Bots

```typescript
// Mock the Slack client
describe('Deploy Command', () => {
    test('rejects invalid environment', async () => {
        const ack = jest.fn();
        const respond = jest.fn();

        await handleDeployCommand({
            command: { text: 'invalid-env', user_id: 'U123' },
            ack,
            respond,
        });

        expect(ack).toHaveBeenCalled();
        expect(respond).toHaveBeenCalledWith(
            expect.objectContaining({
                text: expect.stringContaining('Invalid environment'),
            })
        );
    # ... (condensed) ...
                blocks: expect.arrayContaining([
                    expect.objectContaining({ type: 'actions' }),
                ]),
            })
        );
    });
});
```

## Best Practices

1. **Acknowledge immediately**: Respond within platform timeout (3s for Slack)
2. **Use ephemeral messages for errors**: Only show errors to the user who triggered them
3. **Provide help commands**: Users should be able to discover capabilities
4. **Log all interactions**: For debugging and audit trails
5. **Handle graceful shutdown**: Finish processing current messages before exit
6. **Use thread replies**: Keep channels clean, reply in threads
7. **Rate limit per user**: Prevent abuse
8. **Test command handlers in isolation**: Mock platform APIs

## When to Use

**Use this skill when:**
- Designing or implementing bot builder solutions
- Reviewing or improving existing bot builder approaches
- Making architectural or implementation decisions about bot builder
- Learning bot builder patterns and best practices
- Troubleshooting bot builder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Bot Builder Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement bot builder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended bot builder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When bot builder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
