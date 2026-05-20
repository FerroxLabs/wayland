---
name: notification-system
description: |
  Notification system design expertise covering multi-channel delivery (email, SMS, push, Slack, webhook), template engines, notification preferences and user settings, delivery tracking, retry logic, batching and digest strategies, rate limiting, priority levels, and notification center UI design.
  Use when the user asks about notification system, notification system best practices, or needs guidance on notification system implementation.
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

# Notification Automation Builder

## Core Philosophy

A notification system is a communication bridge between your application and its users. The best notification systems are user-centric: they deliver the right message, through the right channel, at the right time, with the right urgency level. Over-notification erodes trust and engagement. Under-notification leaves users uninformed. The challenge is finding the balance through user preferences, smart defaults, and delivery intelligence.

## Architecture Overview

```
                    +-------------------+
   Event Source --> | Notification      | --> Channel Router --> Email Provider
   (App events,    | Service           |                    --> SMS Provider
    Webhooks,      | (Priority,        |                    --> Push Provider
    Schedules)     |  Dedup, Batch)    |                    --> Slack/Webhook
                    +-------------------+                    --> In-App Center
                           |
                    +------+------+
                    |             |
              User Prefs    Template Engine
              (Channel,     (Render per
               Quiet hrs,   channel with
               Frequency)   user locale)
```

## Multi-Channel Delivery

### Channel Selection Matrix

| Channel | Latency | Reach | Rich Content | Cost | Best For |
|---------|---------|-------|-------------|------|----------|
| Email | Minutes | High | Yes (HTML) | Low | Detailed info, receipts, reports |
| SMS | Seconds | Very High | No (text only) | High | 2FA, urgent alerts |
| Push (Mobile) | Seconds | Medium | Limited | Free | Real-time updates, reminders |
| Push (Web) | Seconds | Low | Limited | Free | Re-engagement, updates |
| Slack/Teams | Seconds | Team-only | Yes (blocks) | Free | Team notifications, alerts |
| Webhook | Seconds | Developers | JSON | Free | Integrations, automation |
| In-App | Instant | Active users | Yes | Free | Non-urgent updates, activity |

### Email Delivery

```typescript
// services/channels/email.ts
import { SES } from '@aws-sdk/client-ses';

interface EmailNotification {
    to: string;
    subject: string;
    htmlBody: string;
    textBody: string;
    replyTo?: string;
    tags?: Record<string, string>;
}

class EmailChannel {
    private ses: SES;
# ... (condensed) ...
        });

        return { messageId: result.MessageId! };
    }
}
```

### SMS Delivery

```typescript
// services/channels/sms.ts
import twilio from 'twilio';

class SMSChannel {
    private client: twilio.Twilio;

    constructor() {
        this.client = twilio(ENV_CONFIG_VALUE, ENV_CONFIG_VALUE);
    }

    async send(to: string, message: string): Promise<{ messageId: string }> {
        // SMS messages must be concise (160 chars for single segment)
        const truncated = message.length > 160
            ? message.substring(0, 157) + '...'
            # ... (condensed) ...
        });

        return { messageId: result.sid };
    }
}
```

### Push Notifications

```typescript
// services/channels/push.ts
import * as admin from 'firebase-admin';

class PushChannel {
    private messaging: admin.messaging.Messaging;

    constructor() {
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
        this.messaging = admin.messaging();
    }

    async send(deviceToken: string, notification: {
        title: string;
        body: string;
        # ... (condensed) ...
            notification,
        });
        return { messageId: result };
    }
}
```

### Webhook Delivery

```typescript
// services/channels/webhook.ts
class WebhookChannel {
    async send(url: string, payload: any, options: {
        secret?: string;
        timeout?: number;
        retries?: number;
    } = {}): Promise<{ statusCode: number; responseTime: number }> {
        const body = JSON.stringify(payload);
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'MyApp-Webhook/1.0',
        };

        // Sign payload with HMAC for verification
        # ... (condensed) ...
            statusCode: response.status,
            responseTime: Date.now() - start,
        };
    }
}
```

## Template Engine

```typescript
// services/templates/engine.ts
import Handlebars from 'handlebars';

interface NotificationTemplate {
    id: string;
    channels: {
        email?: { subject: string; html: string; text: string };
        sms?: { body: string };
        push?: { title: string; body: string };
        slack?: { blocks: any[] };
    };
}

class TemplateEngine {
    # ... (condensed) ...
            title: 'Order Confirmed',
            body: 'Your order #{{orderId}} (${{total}}) is confirmed!',
        },
    },
});
```

## Notification Preferences

```typescript
// models/notificationPreferences.ts
interface NotificationPreferences {
    userId: string;
    channels: {
        email: boolean;
        sms: boolean;
        push: boolean;
        inApp: boolean;
    };
    categories: {
        [category: string]: {
            enabled: boolean;
            channels?: string[];  // Supersede default channels
            frequency?: 'immediate' | 'hourly_digest' | 'daily_digest';
        # ... (condensed) ...
        'social': { enabled: true, frequency: 'immediate' },
    },
    quietHours: { enabled: false, start: '22:00', end: '08:00', timezone: 'America/New_York' },
    unsubscribedAll: false,
};
```

### Preference Enforcement

```typescript
class NotificationRouter {
    async route(notification: Notification, userId: string): Promise<string[]> {
        const prefs = await this.getPreferences(userId);

        // Global unsubscribe check (except mandatory categories)
        if (prefs.unsubscribedAll && !notification.mandatory) {
            return [];
        }

        // Category check
        const categoryPref = prefs.categories[notification.category];
        if (categoryPref && !categoryPref.enabled && !notification.mandatory) {
            return [];
        }
# ... (condensed) ...
            // Crosses midnight (e.g., 22:00 - 08:00)
            return now >= start || now < end;
        }
    }
}
```

## Delivery Tracking

```typescript
// models/deliveryLog.ts
interface DeliveryLog {
    id: string;
    notificationId: string;
    userId: string;
    channel: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'clicked' | 'read';
    providerMessageId?: string;
    error?: string;
    attempts: number;
    sentAt?: Date;
    deliveredAt?: Date;
    readAt?: Date;
    metadata?: Record<string, any>;
# ... (condensed) ...
            error,
            attempts: log.attempts + 1,
        });
    }
}
```

## Retry Logic

```typescript
class NotificationRetryHandler {
    private readonly maxRetries = 3;
    private readonly retryDelays = [60, 300, 900]; // 1min, 5min, 15min

    async handleFailure(delivery: DeliveryLog): Promise<void> {
        if (delivery.attempts >= this.maxRetries) {
            await this.markPermanentFailure(delivery);
            return;
        }

        const delay = this.retryDelays[delivery.attempts] || 900;

        // Determine if error is retryable
        if (this.isRetryable(delivery.error)) {
            # ... (condensed) ...
        if (fallback) {
            await this.resendViaChannel(delivery.notificationId, delivery.userId, fallback);
        }
    }
}
```

## Batching and Digest

```typescript
class DigestService {
    /**
     * Instead of sending 50 individual notifications,
     * batch them into a single digest email.
     */
    async processDigest(userId: string, frequency: 'hourly' | 'daily'): Promise<void> {
        const cutoff = frequency === 'hourly'
            ? new Date(Date.now() - 3600000)
            : new Date(Date.now() - 86400000);

        const pending = await db.notifications.findPending(userId, cutoff);

        if (pending.length === 0) return;

        # ... (condensed) ...
            (groups[n.category] = groups[n.category] || []).push(n);
            return groups;
        }, {} as Record<string, Notification[]>);
    }
}
```

## Rate Limiting

```typescript
class NotificationRateLimiter {
    // Limits per channel per user
    private limits: Record<string, { max: number; windowMs: number }> = {
        email: { max: 10, windowMs: 3600000 },     // 10 per hour
        sms: { max: 5, windowMs: 3600000 },         // 5 per hour
        push: { max: 20, windowMs: 3600000 },        // 20 per hour
        slack: { max: 30, windowMs: 3600000 },        // 30 per hour
    };

    async isAllowed(userId: string, channel: string): Promise<boolean> {
        const limit = this.limits[channel];
        if (!limit) return true;

        const key = `notif_rate:${userId}:${channel}`;
        # ... (condensed) ...
        }

        return count <= limit.max;
    }
}
```

## Priority Levels

```typescript
enum NotificationPriority {
    LOW = 'low',           // In-app only, can be batched
    NORMAL = 'normal',     // Default channels, respects quiet hours
    HIGH = 'high',         // All enabled channels, respects quiet hours
    URGENT = 'urgent',     // All channels, ignores quiet hours, no batching
    CRITICAL = 'critical', // All channels + SMS, ignores all preferences
}

function getPriorityBehavior(priority: NotificationPriority) {
    return {
        low:      { respectQuietHours: true,  batchable: true,  fallbackChannel: false },
        normal:   { respectQuietHours: true,  batchable: true,  fallbackChannel: false },
        high:     { respectQuietHours: true,  batchable: false, fallbackChannel: true  },
        urgent:   { respectQuietHours: false, batchable: false, fallbackChannel: true  },
        critical: { respectQuietHours: false, batchable: false, fallbackChannel: true  },
    }[priority];
}
```

## Notification Center (In-App)

### API Design

```typescript
// GET /api/notifications?page=1&per_page=20&unread_only=false
interface NotificationCenterResponse {
    items: NotificationItem[];
    total: number;
    unread_count: number;
    page: number;
}

interface NotificationItem {
    id: string;
    title: string;
    body: string;
    category: string;
    priority: string;
    # ... (condensed) ...
}

// PATCH /api/notifications/:id/read
// POST /api/notifications/mark-all-read
// DELETE /api/notifications/:id
```

### Real-Time Updates

```typescript
// WebSocket or Server-Sent Events for real-time notification delivery
// Server-Sent Events (simpler, one-directional)
app.get('/api/notifications/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    const userId = req.user.id;

    const handler = (notification: NotificationItem) => {
        res.write(`data: ${JSON.stringify(notification)}\n\n`);
    };

    notificationBus.subscribe(userId, handler);

    req.on('close', () => {
        notificationBus.unsubscribe(userId, handler);
    });
});
```

## Best Practices

1. **Always provide unsubscribe**: One-click unsubscribe for email, preference page for others
2. **Never send without consent**: Respect opt-in requirements (GDPR, CAN-SPAM)
3. **Use templates**: Consistent branding, easier maintenance, localization support
4. **Track deliverability**: Monitor bounce rates, complaint rates, open rates
5. **Implement quiet hours**: Respect user time zones and sleeping hours
6. **Deduplicate**: Prevent sending the same notification twice
7. **Rate limit per user**: Prevent notification fatigue
8. **Use digests for non-urgent content**: Batch low-priority notifications
9. **Provide fallback channels**: If push fails, try email
10. **Log everything**: Full audit trail for debugging and compliance

## When to Use

**Use this skill when:**
- Designing or implementing notification system solutions
- Reviewing or improving existing notification system approaches
- Making architectural or implementation decisions about notification system
- Learning notification system patterns and best practices
- Troubleshooting notification system-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Notification System Analysis

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

**Input:** "Help me implement notification system for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended notification system approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When notification system must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
