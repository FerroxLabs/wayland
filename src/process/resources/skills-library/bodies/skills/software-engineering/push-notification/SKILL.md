---
name: push-notification
description: |
  Expert push notification systems covering APNs/FCM integration, notification channels, rich notifications, silent notifications, notification grouping, deep linking, scheduling, analytics, opt-in strategies, and delivery optimization.
  Use when the user asks about push notification, push notification best practices, or needs guidance on push notification implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile best-practices guide"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Push Notification Expert

## Overview

This skill provides comprehensive expertise in designing, implementing, and optimizing push notification systems for mobile applications. It covers both Apple Push Notification service (APNs) and Firebase Cloud Messaging (FCM), from initial integration through advanced patterns like rich notifications, silent data sync, intelligent grouping, deep linking, scheduling strategies, analytics measurement, and user opt-in optimization.

## Architecture Overview

### Push Notification Flow

```
Notification Delivery Pipeline:

1. Device Registration
   App Launch → Request Permission → Register with OS → Receive Token
   → Send Token to Your Server → Store Token + User Association

2. Sending a Notification
   Business Event → Your Server → Provider (APNs / FCM) → OS → Device
   → Foreground: App handles display
   → Background: System displays notification
   → Not Running: System displays, app launched on tap

3. User Interaction
   Notification Displayed → User Taps → App Opens → Deep Link Route
   → Analytics: Delivery confirmed, Tap tracked, Conversion measured
```

### Server-Side Architecture

```
Recommended Server Architecture:

┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Business    │────▶│ Notification │────▶│  Provider    │
│  Logic       │     │  Service     │     │  Gateway     │
│  (triggers)  │     │  (queue +    │     │  (APNs/FCM)  │
└─────────────┘     │  templates)  │     └─────────────┘
                     └──────────────┘            │
                           │                     ▼
                     ┌──────────────┐     ┌─────────────┐
                     │  Token Store │     │  Device      │
                     # ... (condensed) ...
- Queue: RabbitMQ/SQS for reliable, ordered delivery
- Template Engine: Handlebars/Mustache for notification content
- Provider Gateway: Abstraction over APNs + FCM APIs
- Analytics Sink: Track delivery, opens, conversions
```

## APNs Integration (iOS)

### Server-Side APNs (HTTP/2 API)

```python
# Python example using httpx for APNs HTTP/2
import httpx
import jwt
import time

class APNsClient:
    def __init__(self, key_id: str, team_id: str, private_key: str, sandbox: bool = False):
        self.key_id = key_id
        self.team_id = team_id
        self.private_key = private_key
        self.base_url = (
            # ... (condensed) ...
                headers=headers,
                json=payload,
            )
            return response.status_code, response.json() if response.status_code != 200 else None
```

### APNs Payload Structure

```json
{
  "aps": {
    "alert": {
      "title": "New Message",
      "subtitle": "From John",
      "body": "Hey, are you free for lunch today?"
    },
    "badge": 3,
    "sound": "default",
    "category": "MESSAGE_CATEGORY",
    "thread-id": "conversation-123",
    # ... (condensed) ...
  "conversation_id": "123",
  "sender_id": "user-456",
  "deep_link": "myapp://chat/123"
}
```

### APNs Interruption Levels (iOS 15+)

| Level | Behavior | Use Case |
|-------|----------|----------|
| `passive` | No sound, no screen wake | Low-priority updates |
| `active` (default) | Sound, appears normally | Standard notifications |
| `time-sensitive` | Breaks through Focus modes | Delivery updates, time-limited events |
| `critical` | Supersedes mute, plays sound | Requires Apple entitlement, emergency only |

## FCM Integration (Android)

### Server-Side FCM (HTTP v1 API)

```python
import google.auth.transport.requests
from google.oauth2 import service_account
import httpx

class FCMClient:
    def __init__(self, service_account_file: str, project_id: str):
        self.project_id = project_id
        self.credentials = service_account.Credentials.from_service_account_file(
            service_account_file,
            scopes=["[reference URL]"]
        )
# ... (condensed) ...
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json={"message": message})
            return response.json()
```

### FCM Message Structure

```json
{
  "message": {
    "token": "device_token_here",
    "notification": {
      "title": "New Order",
      "body": "Your order #1234 has been shipped!"
    },
    "android": {
      "priority": "high",
      "notification": {
        "channel_id": "orders",
        # ... (condensed) ...
      "type": "order_shipped"
    }
  }
}
```

## Notification Channels (Android 8+)

### Channel Strategy

```kotlin
// Define channels at app startup
class NotificationChannelManager(private val context: Context) {

    fun createChannels() {
        val manager = context.getSystemService(NotificationManager::class.java)

        val channels = listOf(
            NotificationChannel(
                "messages", "Messages",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                # ... (condensed) ...

        manager.createNotificationChannels(channels)
    }
}
```

### Channel Importance Mapping

| Importance | Behavior | Use Case |
|-----------|----------|----------|
| IMPORTANCE_MAX | Sound + heads-up + screen wake | Incoming calls |
| IMPORTANCE_HIGH | Sound + heads-up | Direct messages |
| IMPORTANCE_DEFAULT | Sound + status bar | Order updates |
| IMPORTANCE_LOW | No sound, status bar only | Promotions |
| IMPORTANCE_MIN | No sound, no status bar | Silent sync |

## Rich Notifications

### iOS Notification Service Extension

```swift
// NotificationServiceExtension/NotificationService.swift
class NotificationService: UNNotificationServiceExtension {
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    supersede func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler
        bestAttemptContent = request.content.mutableCopy() as? UNMutableNotificationContent
# ... (condensed) ...
            completion(tmpURL)
        }.resume()
    }
}
```

### Android Rich Notification Styles

```kotlin
// Big picture notification
fun showImageNotification(context: Context, title: String, body: String, bitmap: Bitmap) {
    val notification = NotificationCompat.Builder(context, "orders")
        .setSmallIcon(R.drawable.ic_notification)
        .setContentTitle(title)
        .setContentText(body)
        .setStyle(
            NotificationCompat.BigPictureStyle()
                .bigPicture(bitmap)
                .bigLargeIcon(null as Bitmap?) // Hide large icon when expanded
        )
        # ... (condensed) ...
        .build()

    NotificationManagerCompat.from(context).notify(conversationId, notification)
}
```

## Silent Notifications

### Use Cases and Implementation

```
Silent Notification Use Cases:
├── Background data sync
├── Cache invalidation
├── Configuration updates
├── Location tracking updates
├── Badge count updates
├── Content pre-fetching
└── Token refresh triggers

Implementation Rules:
├── iOS: content-available: 1, no alert/sound/badge
# ... (condensed) ...
│   ├── Handled by FirebaseMessagingService
│   ├── App gets ~20 seconds in onMessageReceived
│   ├── High priority: wakes dozing device
│   └── Normal priority: may be deferred by Doze mode
```

```swift
// iOS silent notification handling
func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
) {
    guard let type = userInfo["type"] as? String else {
        completionHandler(.noData)
        return
    }

    # ... (condensed) ...
    default:
        completionHandler(.noData)
    }
}
```

## Notification Grouping

### Grouping Strategy

```
Notification Grouping Rules:
├── Group by conversation (messaging apps)
│   └── thread-id (iOS) / group key (Android) = conversation ID
├── Group by category (e-commerce)
│   └── Orders, promotions, and account grouped separately
├── Group by sender (email/social)
│   └── All notifications from same person/account
├── Summary notification
│   ├── iOS: automatic summary with category
│   └── Android: setGroup() + summary notification with setGroupSummary(true)
└── Maximum visible: Show up to 4 individual, then collapse to summary
```

```kotlin
// Android notification grouping
private val GROUP_KEY = "com.myapp.ORDERS"

fun showOrderNotification(order: Order) {
    // Individual notification
    val notification = NotificationCompat.Builder(context, "orders")
        .setSmallIcon(R.drawable.ic_order)
        .setContentTitle("Order ${order.id}")
        .setContentText(order.statusMessage)
        .setGroup(GROUP_KEY)
        .build()
# ... (condensed) ...
    val manager = NotificationManagerCompat.from(context)
    manager.notify(order.id.hashCode(), notification)
    manager.notify(0, summary) // Summary ID should be constant
}
```

## Deep Linking from Notifications

### Deep Link Architecture

```
Deep Link Flow:
Notification Tap → OS Opens App → App Reads Notification Data
→ Parse deep_link field → Route to correct screen

Deep Link Formats:
├── Custom scheme: myapp://orders/1234
├── Universal Links (iOS): [reference URL]
├── App Links (Android): [reference URL]
└── Deferred deep links: Store link + route after install

Implementation Checklist:
├── Parse deep link in notification tap handler
├── Handle cold start (app not running) deep links
├── Handle warm start (app in background) deep links
├── Handle foreground notification tap deep links
├── Queue deep link if auth required, execute after login
└── Track deep link attribution in analytics
```

## Scheduling and Delivery Optimization

### Send Time Optimization

```
Optimal Send Time Strategy:
├── Per-user timezone delivery
│   └── Send at 10 AM local time, not 10 AM server time
├── Per-user engagement window
│   ├── Track when each user opens the app
│   ├── Track when each user opens notifications
│   └── Send during their peak engagement window
├── Frequency capping
│   ├── Maximum 1 promotional notification per day
│   ├── Maximum 3 transactional notifications per hour
│   └── Maximum 5 total notifications per day (unless real-time messaging)
# ... (condensed) ...
└── Quiet hours
    ├── Default: No notifications 10 PM - 8 AM local time
    ├── Exception: Time-sensitive and transactional
    └── Let users configure their quiet hours
```

## Opt-In Strategies

### Permission Request Flow

```
Opt-In Strategy (maximize permission grant rate):

1. Pre-permission screen (before iOS system prompt)
   ├── Explain VALUE the user gets from notifications
   ├── Show example notifications visually
   ├── Use specific benefit: "Get notified when your order ships"
   ├── NOT generic: "We'd like to send you notifications"
   └── If user says "Not now" → Ask again after value delivery

2. Contextual permission request (at the right moment)
   ├── After placing first order → "Want delivery updates?"
   # ... (condensed) ...
   ├── Check notification permission status regularly
   ├── Show in-app banner: "Turn on notifications for [benefit]"
   ├── Provide deep link to Settings app
   └── Do NOT nag repeatedly
```

### Measuring Notification Effectiveness

| Metric | Formula | Target |
|--------|---------|--------|
| Opt-in rate | Users with permission / Total users | >60% |
| Delivery rate | Delivered / Sent | >95% |
| Open rate | Opened / Delivered | >5% (varies by type) |
| Conversion rate | Conversions / Opened | Varies by goal |
| Opt-out rate | Disabled permissions / Total with permission | <2% per month |
| Uninstall attribution | Uninstalls within 24h of notification / Total | <0.1% |

## Analytics Implementation

```python
# Server-side notification analytics tracking
class NotificationAnalytics:
    def track_sent(self, notification_id: str, user_id: str, channel: str):
        self.emit("notification.sent", {
            "notification_id": notification_id,
            "user_id": user_id,
            "channel": channel,  # "push", "email", "sms"
            "timestamp": utcnow(),
        })

    def track_delivered(self, notification_id: str, user_id: str):
        # ... (condensed) ...
            "notification_id": notification_id,
            "user_id": user_id,
            "action": action,  # "purchase", "signup", "view"
        })
```

## Production Checklist

- [ ] Implement APNs token registration and server sync
- [ ] Implement FCM token registration and server sync
- [ ] Handle token refresh (both platforms)
- [ ] Create notification channels with appropriate importance (Android)
- [ ] Implement rich notifications with images (both platforms)
- [ ] Set up deep linking from notification taps
- [ ] Handle cold start, warm start, and foreground notification scenarios
- [ ] Implement notification grouping / threading
- [ ] Set up delivery and open rate analytics
- [ ] Design pre-permission screen for iOS
- [ ] Implement frequency capping on the server
- [ ] Configure timezone-aware delivery scheduling
- [ ] Test notification display on various OS versions
- [ ] Handle notification permission denied gracefully
- [ ] Set up token cleanup for uninstalled apps
- [ ] Test with Do Not Disturb / Focus modes enabled

## When to Use

**Use this skill when:**
- Designing or implementing push notification solutions
- Reviewing or improving existing push notification approaches
- Making architectural or implementation decisions about push notification
- Learning push notification patterns and best practices
- Troubleshooting push notification-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Push Notification Analysis

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

**Input:** "Help me implement push notification for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended push notification approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When push notification must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
