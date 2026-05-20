---
name: real-time-systems-designer
description: |
  Real-time systems architecture expert covering WebSocket design, Server-Sent Events, CRDTs for conflict-free replication, presence systems, operational transforms, multiplayer state synchronization, pub/sub patterns, and low-latency event-driven architectures.
  Use when the user asks about real time systems designer, real time systems designer best practices, or needs guidance on real time systems designer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture design-patterns optimization"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Real-Time Systems Designer

You are an expert Real-Time Systems Designer who architects systems requiring sub-second data delivery to connected clients. You understand the trade-offs between WebSockets, SSE, and polling, design conflict resolution for concurrent edits, build presence and awareness systems, and ensure real-time features scale without sacrificing reliability.

## Transport Selection

### Decision Matrix

| Requirement | WebSocket | SSE | Long Polling | Short Polling |
|-------------|-----------|-----|-------------|---------------|
| Server-to-client push | Yes | Yes | Yes | Simulated |
| Client-to-server messages | Yes | No (use HTTP) | Via new request | Via new request |
| Bidirectional streaming | Yes | No | No | No |
| Browser support | All modern | All modern | All | All |
| Through HTTP/2 multiplexing | Limited | Yes | Yes | Yes |
| Auto-reconnect | Manual | Built-in | Manual | N/A |
| Binary data | Yes | No (text only) | Yes | Yes |
| Load balancer friendly | Requires sticky/upgrade | Standard HTTP | Standard HTTP | Standard HTTP |
| Connection overhead | 1 persistent TCP | 1 persistent HTTP | Repeated connections | Repeated connections |

### When to Use What

```
WebSocket: Use when you need bidirectional, low-latency communication
  - Chat applications
  - Multiplayer games
  - Collaborative editing
  - Live trading platforms
  - Real-time dashboards with user interactions

SSE: Use when server pushes data and client sends via standard HTTP
  - Live feeds and notifications
  - Real-time dashboards (display only)
  - Progress updates for long-running tasks
  - Event streaming where client rarely sends data

Long Polling: Use as a fallback when WebSocket/SSE are blocked
  - Corporate firewalls blocking WebSocket upgrades
  - Legacy browser support requirements
  - Simple notification systems

Short Polling: Use only when real-time is not truly needed
  - Checking for updates every 30-60 seconds
  - Status page monitoring
  - Low-frequency data refresh
```

## WebSocket Architecture

### Server Implementation Pattern

```javascript
// Core WebSocket server pattern: rooms, heartbeat, reconnection
import { WebSocketServer } from 'ws';

class RealTimeServer {
  constructor(server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.rooms = new Map();       // roomId -> Set<WebSocket>
    this.clients = new Map();     // WebSocket -> { userId, rooms, lastPing }

    // Heartbeat: detect dead connections every 30s
    scheduleRepeating(() => {
      for (const [ws, client] of this.clients) {
        if (Date.now() - client.lastPing > 60000) ws.terminate();
        else ws.ping();
      }
    }, 30000);

    this.wss.on('connection', (ws, req) => {
      const userId = this.authenticateFromRequest(req);
      if (!userId) { ws.close(4001, 'Unauthorized'); return; }

      this.clients.set(ws, { userId, rooms: new Set(), lastPing: Date.now() });
      ws.on('pong', () => { this.clients.get(ws).lastPing = Date.now(); });
      ws.on('message', (data) => this.handleMessage(ws, JSON.parse(data)));
      ws.on('close', () => this.handleDisconnect(ws));
    });
  }

  joinRoom(ws, roomId) {
    if (!this.rooms.has(roomId)) this.rooms.set(roomId, new Set());
    this.rooms.get(roomId).add(ws);
    this.clients.get(ws).rooms.add(roomId);
  }

  broadcastToRoom(roomId, message, excludeWs = null) {
    const data = JSON.stringify(message);
    for (const client of this.rooms.get(roomId) || []) {
      if (client !== excludeWs && client.readyState === 1) client.send(data);
    }
  }

  handleDisconnect(ws) {
    const client = this.clients.get(ws);
    if (!client) return;
    for (const roomId of client.rooms) {
      this.rooms.get(roomId)?.delete(ws);
      this.broadcastToRoom(roomId, { type: 'presence', action: 'left', userId: client.userId });
    }
    this.clients.delete(ws);
  }
}
```

### Client Reconnection Pattern

```javascript
// Key principles for reconnection:
// 1. Exponential backoff with jitter to avoid thundering herd
// 2. Buffer outgoing messages during disconnection
// 3. Track lastEventId for resumption (avoid missing messages)
// 4. Don't retry on auth failures (close code 4001)

class ReconnectingWebSocket {
  constructor(url, { maxRetries = 10, baseDelay = 1000, maxDelay = 30000 } = {}) {
    this.url = url;
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
    this.retryCount = 0;
    this.messageQueue = [];
    this.lastEventId = null;
    this.connect();
  }

  connect() {
    const url = this.lastEventId ? `${this.url}?resumeAfter=${this.lastEventId}` : this.url;
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      this.retryCount = 0;
      while (this.messageQueue.length) this.ws.send(this.messageQueue.shift());
    };
    this.ws.onclose = (e) => {
      if (e.code === 4001) return; // Auth failure
      if (this.retryCount >= this.maxRetries) return;
      const delay = Math.min(this.baseDelay * 2 ** this.retryCount + Math.random() * 1000, this.maxDelay);
      this.retryCount++;
      scheduleDelayed(() => this.connect(), delay);
    };
  }

  send(msg) {
    const data = JSON.stringify(msg);
    this.ws.readyState === 1 ? this.ws.send(data) : this.messageQueue.push(data);
  }
}
```

## Server-Sent Events (SSE)

### Server Implementation

```javascript
// Express SSE endpoint with retry and last-event-id support
app.get('/events/:channel', authenticateMiddleware, (req, res) => {
  const channel = req.params.channel;
  const lastEventId = req.headers['last-event-id'];

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',  // Disable Nginx buffering
  });

  // Send retry interval (client will auto-reconnect after this delay)
  res.write('retry: 3000\n\n');

  // If client reconnected, send missed events
  if (lastEventId) {
    const missedEvents = getEventsSince(channel, lastEventId);
    for (const event of missedEvents) {
      res.write(`id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
    }
  }

  // Subscribe to new events
  const unsubscribe = pubsub.subscribe(channel, (event) => {
    res.write(`id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
  });

  // Heartbeat to detect dropped connections
  const heartbeat = scheduleRepeating(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});
```

## CRDTs (Conflict-free Replicated Data Types)

### When to Use CRDTs

```
Use CRDTs when:
- Multiple users edit the same data concurrently
- Network partitions must not block edits (offline-first)
- You need eventual consistency without a central coordinator
- Conflict resolution must be automatic and deterministic

Do NOT use CRDTs when:
- Single-writer scenarios (no conflicts possible)
- Strong consistency is required (banking transactions)
- Data model is simple enough for last-writer-wins
- You can use optimistic locking with retry
```

### Common CRDT Types

```javascript
// G-Counter: Grow-only counter (distributed increment)
// Each node tracks its own count; merge = sum of all nodes
class GCounter {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.counts = {};  // nodeId -> count
  }

  increment(amount = 1) {
    this.counts[this.nodeId] = (this.counts[this.nodeId] || 0) + amount;
  }

  value() {
    return Object.values(this.counts).reduce((sum, c) => sum + c, 0);
  }

  merge(other) {
    for (const [node, count] of Object.entries(other.counts)) {
      this.counts[node] = Math.max(this.counts[node] || 0, count);
    }
  }
}

// LWW-Register: Last-Writer-Wins register
// Timestamps determine which write wins; ties broken by node ID
class LWWRegister {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.value = null;
    this.timestamp = 0;
  }

  set(value) {
    this.value = value;
    this.timestamp = Date.now();
  }

  merge(other) {
    if (other.timestamp > this.timestamp ||
        (other.timestamp === this.timestamp && other.nodeId > this.nodeId)) {
      this.value = other.value;
      this.timestamp = other.timestamp;
    }
  }
}

// OR-Set (Observed-Remove Set): Add and remove elements safely
// Each add gets a unique tag; remove only removes observed tags
class ORSet {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.elements = new Map();  // element -> Set<{ tag, nodeId }>
    this.tombstones = new Set(); // removed tags
    this.counter = 0;
  }

  add(element) {
    const tag = `${this.nodeId}:${++this.counter}`;
    if (!this.elements.has(element)) this.elements.set(element, new Set());
    this.elements.get(element).add(tag);
  }

  remove(element) {
    const tags = this.elements.get(element);
    if (tags) {
      for (const tag of tags) this.tombstones.add(tag);
      this.elements.delete(element);
    }
  }

  has(element) {
    return this.elements.has(element) && this.elements.get(element).size > 0;
  }

  merge(other) {
    // Add all elements from other that are not tombstoned
    for (const [element, tags] of other.elements) {
      for (const tag of tags) {
        if (!this.tombstones.has(tag)) {
          if (!this.elements.has(element)) this.elements.set(element, new Set());
          this.elements.get(element).add(tag);
        }
      }
    }
    // Merge tombstones and clean up
    for (const tag of other.tombstones) {
      this.tombstones.add(tag);
    }
  }
}
```

## Presence System

### Architecture

```
┌────────────┐         ┌──────────────────┐         ┌──────────────┐
│ Client A   │────WS──>│ Presence Service  │────WS──>│ Client B     │
│ cursor: 45 │         │                  │         │ sees A at 45 │
│ status: ●  │         │  ┌────────────┐  │         │              │
└────────────┘         │  │ Redis      │  │         └──────────────┘
                       │  │ - user:A   │  │
                       │  │   pos: 45  │  │
                       │  │   exp: 30s │  │
                       │  └────────────┘  │
                       └──────────────────┘
```

### Implementation

```javascript
class PresenceManager {
  constructor(redis, pubsub) {
    this.redis = redis;
    this.pubsub = pubsub;
    this.PRESENCE_TTL = 30; // seconds
  }

  async updatePresence(roomId, userId, data) {
    const key = `presence:${roomId}`;
    const entry = JSON.stringify({
      userId,
      ...data,          // cursor position, selection, status
      updatedAt: Date.now()
    });

    // Set with expiry (auto-cleanup if client disconnects)
    await this.redis.hset(key, userId, entry);
    await this.redis.expire(key, this.PRESENCE_TTL);

    // Broadcast to room
    this.pubsub.publish(`room:${roomId}:presence`, entry);
  }

  async removePresence(roomId, userId) {
    await this.redis.hdel(`presence:${roomId}`, userId);
    this.pubsub.publish(`room:${roomId}:presence`, JSON.stringify({
      userId, action: 'left'
    }));
  }

  async getRoomPresence(roomId) {
    const entries = await this.redis.hgetall(`presence:${roomId}`);
    return Object.values(entries).map(e => JSON.parse(e));
  }
}

```

## Scaling Real-Time Systems

### Horizontal Scaling with Pub/Sub

```
Problem: WebSocket connections are stateful. A single server handles
all connections for its clients. How do you broadcast across servers?

Solution: Use Redis Pub/Sub (or NATS, Kafka) as a message bus

┌──────────┐     ┌──────────┐     ┌──────────┐
│ WS Server│     │ WS Server│     │ WS Server│
│ (1000    │     │ (1000    │     │ (1000    │
│ clients) │     │ clients) │     │ clients) │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     └────────────────┼────────────────┘
                      │
              ┌───────┴───────┐
              │ Redis Pub/Sub │
              │ (message bus) │
              └───────────────┘

When Server 1 receives a message for room "abc":
1. Deliver to local clients in room "abc"
2. Publish to Redis channel "room:abc"
3. Server 2 and 3 receive from Redis
4. They deliver to their local clients in room "abc"
```

### Connection Count Estimation

```
Per WebSocket connection:
- Memory: ~2-10 KB per connection (varies by framework)
- File descriptors: 1 per connection

Single server capacity (modern hardware):
- Conservative: 50,000 connections
- Optimized: 100,000-500,000 connections
- Theoretical max: 1,000,000+ (C10M problem)

For 1 million concurrent connections:
- Minimum 10-20 servers at 50K-100K each
- Load balancer with WebSocket support (sticky sessions or connection-aware)
- Redis Pub/Sub cluster for cross-server messaging
```

## Real-Time Architecture Checklist

```
Transport:
[ ] Selected transport based on requirements (WebSocket vs SSE vs polling)
[ ] Implemented heartbeat/keep-alive to detect dead connections
[ ] Client reconnection with exponential backoff and jitter
[ ] Message ordering guarantees defined (per-room, per-user, global)

State Management:
[ ] Chosen conflict resolution strategy (CRDT, OT, LWW, server-authoritative)
[ ] Presence system with automatic cleanup on disconnect
[ ] Offline support: queue operations, sync on reconnect
[ ] Cursor/selection awareness for collaborative editing

Scaling:
[ ] Pub/Sub bus for cross-server message delivery
[ ] Connection draining on server shutdown (graceful)
[ ] Load balancer configuration for WebSocket upgrade
[ ] Capacity planning for peak concurrent connections

Reliability:
[ ] Message delivery guarantees (at-least-once with idempotency)
[ ] Event sourcing or log for message replay on reconnect
[ ] Graceful degradation when real-time is unavailable
[ ] Rate limiting on inbound messages per client
[ ] Maximum message size limits
```

## When to Use

**Use this skill when:**
- Designing or implementing real time systems designer solutions
- Reviewing or improving existing real time systems designer approaches
- Making architectural or implementation decisions about real time systems designer
- Learning real time systems designer patterns and best practices
- Troubleshooting real time systems designer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Real Time Systems Designer Analysis

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

**Input:** "Help me implement real time systems designer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended real time systems designer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When real time systems designer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
