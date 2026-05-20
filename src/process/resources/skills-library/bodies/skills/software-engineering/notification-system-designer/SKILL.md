---
name: notification-system-designer
description: |
  Notification system architecture expert covering multi-channel delivery (email, SMS, push, in-app, Slack), user preference management, throttling and rate limiting, template engines, delivery tracking and analytics, batching/digest strategies, priority routing, and notification center design.
  Use when the user asks about notification system designer, notification system designer best practices, or needs guidance on notification system designer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture design-patterns backend"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Notification System Designer

You are an expert Notification System Designer who architects scalable, user-centric notification systems. You understand that notifications are a privilege, not a right -- every notification should deliver value to the recipient. You design systems that are reliable, configurable, and respectful of user attention while meeting business communication needs.

## System Architecture

```
                          ┌─────────────────────┐
  Event Sources ─────────>│  Notification        │
  (App events,            │  Service             │
   Webhooks,              │  ┌───────────────┐   │
   Schedules,             │  │ Dedup Engine   │   │
   External triggers)     │  │ Priority Queue │   │
                          │  │ Rate Limiter   │   │
                          │  │ User Prefs     │   │
                          │  │ Template Engine│   │
                          │  └───────────────┘   │
                          └──────────┬──────────┘
                                     │
                          ┌──────────┼──────────┐
                          ▼          ▼          ▼
                      ┌───────┐ ┌───────┐ ┌───────┐
                      │ Email │ │  SMS  │ │ Push  │
                      │Provider│ │Provider│ │Provider│
                      └───────┘ └───────┘ └───────┘
                          │          │          │
                          ▼          ▼          ▼
                      ┌─────────────────────────┐
                      │   Delivery Tracker       │
                      │   (sent, delivered,      │
                      │    opened, clicked,      │
                      │    bounced, failed)      │
                      └─────────────────────────┘
```

### Core Components

```typescript
// Notification event structure
interface NotificationEvent {
  id: string;                    // Idempotency key
  type: string;                  // "order.shipped", "comment.reply"
  recipientId: string;           // User ID
  data: Record<string, any>;     // Template variables
  priority: 'critical' | 'high' | 'medium' | 'low';
  channels?: string[];           // Supersede default channels
  scheduledAt?: Date;            // Deferred delivery
  groupKey?: string;             // For batching/digest
  metadata?: Record<string, any>;// Tracking context
}

// Processing pipeline
async function processNotification(event: NotificationEvent) {
  // 1. Deduplication
  if (await isDuplicate(event.id)) return;

  // 2. User preferences check
  const prefs = await getUserPreferences(event.recipientId);
  if (prefs.isUnsubscribed(event.type)) return;

  // 3. Rate limiting
  if (await isRateLimited(event.recipientId, event.type)) {
    await queueForDigest(event);
    return;
  }

  // 4. Channel selection
  const channels = resolveChannels(event, prefs);

  // 5. Template rendering
  const rendered = await renderTemplates(event, channels);

  // 6. Dispatch to channel providers
  for (const channel of channels) {
    await dispatch(channel, rendered[channel], event);
  }
}
```

## Channel Strategy

### Channel Selection Matrix

```
| Notification Type     | Email | Push | SMS  | In-App | Slack |
|----------------------|-------|------|------|--------|-------|
| Security alerts      | Yes   | Yes  | Yes  | Yes    | No    |
| Order confirmation   | Yes   | No   | No   | Yes    | No    |
| Comment reply        | No    | Yes  | No   | Yes    | No    |
| Weekly digest        | Yes   | No   | No   | No     | No    |
| System downtime      | Yes   | Yes  | No   | Yes    | Yes   |
| Marketing promo      | Yes   | No   | No   | No     | No    |
| Password reset       | Yes   | No   | SMS* | No     | No    |
| Payment failed       | Yes   | Yes  | Yes  | Yes    | No    |

* SMS for 2FA code, not for the reset link itself
```

### Channel Characteristics

```
EMAIL:
  Latency: Minutes (acceptable)
  Cost: $0.0001 - $0.001 per message
  Best for: Rich content, receipts, digests, marketing
  Providers: SendGrid, AWS SES, Postmark, Mailgun
  Watch out for: Deliverability, spam filters, bounce handling

PUSH NOTIFICATIONS:
  Latency: Seconds
  Cost: Free (FCM/APNs infrastructure cost only)
  Best for: Time-sensitive alerts, engagement nudges
  Providers: Firebase Cloud Messaging, Apple APNs
  Watch out for: Permission opt-in rates, notification fatigue

SMS:
  Latency: Seconds
  Cost: $0.01 - $0.05 per message
  Best for: Critical alerts, 2FA, time-sensitive confirmations
  Providers: Twilio, AWS SNS, MessageBird
  Watch out for: Cost, regulatory compliance (TCPA, GDPR), opt-out

IN-APP:
  Latency: Real-time (WebSocket) or next page load
  Cost: Infrastructure only
  Best for: Feature updates, social interactions, activity feeds
  Implementation: WebSocket + notification center UI
  Watch out for: Users must be in the app to see them

SLACK/TEAMS:
  Latency: Seconds
  Cost: Free (API limits apply)
  Best for: Team notifications, CI/CD alerts, monitoring
  Providers: Slack API, Microsoft Teams webhooks
  Watch out for: Channel noise, threading, rate limits
```

## Preference Management

### User Preference Schema

```typescript
interface NotificationPreferences {
  userId: string;

  // Global controls
  globalEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;    // "22:00"
    end: string;      // "08:00"
    timezone: string;  // "America/New_York"
  };

  // Per-category preferences
  categories: {
    [categoryKey: string]: {
      enabled: boolean;
      channels: {
        email: boolean;
        push: boolean;
        sms: boolean;
        inApp: boolean;
      };
      frequency: 'instant' | 'hourly_digest' | 'daily_digest' | 'weekly_digest';
    };
  };
}

// Example preferences
const userPrefs: NotificationPreferences = {
  userId: "user_123",
  globalEnabled: true,
  quietHours: {
    enabled: true,
    start: "22:00",
    end: "08:00",
    timezone: "America/New_York"
  },
  categories: {
    "comments": {
      enabled: true,
      channels: { email: false, push: true, sms: false, inApp: true },
      frequency: "instant"
    },
    "marketing": {
      enabled: true,
      channels: { email: true, push: false, sms: false, inApp: false },
      frequency: "weekly_digest"
    },
    "security": {
      enabled: true, // Cannot be disabled
      channels: { email: true, push: true, sms: true, inApp: true },
      frequency: "instant"
    }
  }
};
```

### Preference UI Design Principles

```
1. SENSIBLE DEFAULTS: New users get reasonable settings out of the box
2. PROGRESSIVE DISCLOSURE: Show common settings first, advanced in expandable
3. CATEGORY-BASED: Group by notification type, not by channel
4. MANDATORY NOTIFICATIONS: Security and billing cannot be fully disabled
5. EASY UNSUBSCRIBE: One-click unsubscribe in every email
6. PREVIEW: Show an example of what each notification looks like
7. FREQUENCY CONTROL: Allow digest options (instant, daily, weekly)
```

## Throttling and Rate Limiting

### Rate Limiting Strategy

```typescript
// Multi-level rate limiting
const rateLimits = {
  // Per-user limits
  user: {
    push: { max: 10, window: '1h' },      // Max 10 push per hour
    email: { max: 5, window: '1h' },       // Max 5 emails per hour
    sms: { max: 3, window: '1h' },         // Max 3 SMS per hour
    total: { max: 20, window: '1h' },      // Max 20 across all channels
  },

  // Per-notification-type limits
  type: {
    'comment.reply': { max: 5, window: '1h' },  // Max 5 comment notifications/hr
    'marketing': { max: 1, window: '24h' },       // Max 1 marketing per day
  },

  // System-wide limits (protect providers)
  system: {
    email: { max: 10000, window: '1m' },   // 10K emails per minute
    sms: { max: 1000, window: '1m' },      // 1K SMS per minute
    push: { max: 50000, window: '1m' },    // 50K push per minute
  }
};

// When rate limited, options:
// 1. DROP: Silently discard (for low-priority)
// 2. QUEUE: Delay and send later
// 3. DIGEST: Batch into a summary notification
// 4. ESCALATE: Send via alternative channel
```

### Batching and Digest

```typescript
// Digest aggregation
interface DigestConfig {
  groupKey: string;          // Group by this key (e.g., "thread_id")
  window: string;            // "1h", "24h", "7d"
  minItems: number;          // Minimum items before sending digest
  maxItems: number;          // Cap items in a single digest
  template: string;          // Digest-specific template
}

// Example: Comment notifications batched into hourly digest
// Instead of 15 individual emails:
//   "Alice commented on your post"
//   "Bob commented on your post"
//   ...

// Send one digest:
//   "15 new comments on your post"
//   - Alice: "Great article..."
//   - Bob: "I disagree with..."
//   - Carol: "Have you considered..."
//   + 12 more comments
```

## Template Engine

### Template Architecture

```
TEMPLATE STRUCTURE:
  /templates
    /email
      order-confirmation.html      (channel-specific)
      order-confirmation.txt       (plain text fallback)
    /push
      order-confirmation.json      (title + body + action)
    /sms
      order-confirmation.txt       (160 char limit awareness)
    /in-app
      order-confirmation.json      (structured data)
    /shared
      _header.html                 (partials)
      _footer.html
```

```handlebars
<!-- Email template: order-confirmation.html -->
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>
          Hi {{user.firstName}},
        </mj-text>
        <mj-text>
          Your order #{{order.number}} has been confirmed!
        </mj-text>
        <mj-table>
          {{#each order.items}}
          <tr>
            <td>{{this.name}}</td>
            <td>{{this.quantity}}</td>
            <td>{{formatCurrency this.price order.currency}}</td>
          </tr>
          {{/each}}
        </mj-table>
        <mj-button href="{{trackingUrl order.id}}">
          Track Your Order
        </mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

```json
// Push template: order-confirmation.json
{
  "title": "Order Confirmed!",
  "body": "Your order #{{order.number}} ({{order.itemCount}} items) is on its way.",
  "icon": "order_confirmed",
  "action": {
    "type": "deep_link",
    "url": "/orders/{{order.id}}"
  },
  "data": {
    "orderId": "{{order.id}}",
    "notificationType": "order_confirmation"
  }
}
```

## Delivery Tracking

### Tracking Pipeline

```
NOTIFICATION LIFECYCLE:

  CREATED → QUEUED → SENT → DELIVERED → OPENED → CLICKED
                       │         │
                       ▼         ▼
                    BOUNCED   UNSUBSCRIBED
                       │
                       ▼
                    FAILED (retry → SENT or DEAD_LETTER)
```

```sql
-- Delivery tracking table
CREATE TABLE notification_delivery (
    id UUID PRIMARY KEY,
    notification_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'created',
    provider VARCHAR(50),
    provider_message_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,
    retry_count INT DEFAULT 0,
    metadata JSONB
);

-- Indexes for common queries
CREATE INDEX idx_delivery_recipient ON notification_delivery(recipient_id, created_at);
CREATE INDEX idx_delivery_status ON notification_delivery(status, channel);
CREATE INDEX idx_delivery_notification ON notification_delivery(notification_id);
```

### Retry Strategy

```typescript
const retryConfig = {
  email: {
    maxRetries: 3,
    backoff: 'exponential',     // 1min, 5min, 25min
    retryableErrors: ['timeout', 'rate_limited', 'server_error'],
    nonRetryable: ['invalid_email', 'hard_bounce', 'unsubscribed'],
  },
  push: {
    maxRetries: 2,
    backoff: 'exponential',
    retryableErrors: ['timeout', 'server_error'],
    nonRetryable: ['invalid_token', 'unregistered'],
  },
  sms: {
    maxRetries: 2,
    backoff: 'linear',          // 5min, 10min
    retryableErrors: ['timeout', 'carrier_error'],
    nonRetryable: ['invalid_number', 'opted_out', 'landline'],
  }
};

// Dead letter queue for exhausted retries
// Review daily, fix systemic issues, do not retry manually
```

## Analytics Dashboard

```
KEY METRICS TO TRACK:

VOLUME:
  - Notifications sent per channel per hour
  - Notifications per user per day (watch for spamming)
  - Queue depth and processing latency

DELIVERY:
  - Delivery rate by channel (target: email >95%, push >90%)
  - Bounce rate (hard bounces indicate list hygiene issues)
  - Failure rate by error type

ENGAGEMENT:
  - Open rate by notification type (email: 20-40% is good)
  - Click-through rate (email: 2-5% is typical)
  - Unsubscribe rate (< 0.5% per email send)

USER HEALTH:
  - % of users with push permissions enabled
  - % of users who have customized preferences
  - Notification fatigue signal: declining open rates per user
```

## Priority System

```typescript
enum NotificationPriority {
  CRITICAL = 1,  // Security alerts, payment failures, 2FA
  HIGH = 2,      // Direct messages, mentions, order updates
  MEDIUM = 3,    // Comments, social interactions
  LOW = 4,       // Marketing, digests, feature announcements
}

// Priority affects:
// 1. Queue ordering: Critical processed first
// 2. Rate limiting: Critical bypasses user rate limits
// 3. Quiet hours: Critical ignores quiet hours
// 4. Channel fallback: Critical sends on ALL enabled channels
// 5. Retry behavior: Critical gets more retries
```

## Common Anti-Patterns

```
1. NOTIFICATION SPAM: Aggregate, digest, rate limit. Ask "Would I want this interruption?"
2. NO UNSUBSCRIBE: Every notification must have an opt-out path (also legally required).
3. FIRE AND SKIP: Track full lifecycle. Alert on delivery rate drops.
4. SAME MESSAGE ON ALL CHANNELS: Pick primary channel, use others as fallback.
5. NO QUIET HOURS: Implement timezone-aware quiet hours. Queue for morning delivery.
6. HARDCODED TEMPLATES: Store in database/CMS. Support preview and testing.
```

## Quick Reference Card

```
ARCHITECTURE: Event source → Notification service → Channel router → Providers → Tracking
CHANNELS: Email (rich), Push (urgent), SMS (critical), In-app (contextual), Slack (team)
PREFERENCES: Category-based, frequency control, quiet hours, mandatory security notifications
THROTTLING: Per-user + per-type + system-wide rate limits, digest fallback
TEMPLATES: Per-channel templates, shared partials, variable substitution, preview capability
TRACKING: Created → Queued → Sent → Delivered → Opened → Clicked (+ Bounced/Failed)
PRIORITY: Critical bypasses rate limits and quiet hours, Low goes to digest
METRICS: Delivery rate >95%, open rate 20-40%, unsubscribe <0.5%, zero notification spam
```

## When to Use

**Use this skill when:**
- Designing or implementing notification system designer solutions
- Reviewing or improving existing notification system designer approaches
- Making architectural or implementation decisions about notification system designer
- Learning notification system designer patterns and best practices
- Troubleshooting notification system designer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Notification System Designer Analysis

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

**Input:** "Help me implement notification system designer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended notification system designer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When notification system designer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
