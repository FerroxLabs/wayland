---
name: websocket-realtime-patterns
description: |
  Guides expert-level websocket and real-time patterns implementation: web-development and frameworks decision frameworks, production-ready patterns, and concrete templates for websocket realtime patterns workflows.
  Use when the user asks about websocket and real-time patterns, websocket realtime patterns configuration, or backend best practices for websocket projects.
  Do NOT use when the user needs a different backend infrastructure capability -- check sibling skills in the backend infrastructure subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend web-development frameworks"
  category: "backend-systems"
  subcategory: "backend-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# WebSocket Realtime Patterns

## When to Use

**Use this skill when:**
- User needs to implement bidirectional real-time communication between a browser client and server (chat, live dashboards, collaborative editing, multiplayer games, live notifications)
- User is deciding whether to use WebSockets vs. Server-Sent Events (SSE) vs. long polling vs. HTTP/2 push for a specific feature
- User needs to design a WebSocket server that handles thousands to millions of concurrent connections with fan-out messaging
- User is building a pub/sub or broadcast system over WebSockets and needs room/channel management, presence tracking, or message ordering guarantees
- User is experiencing WebSocket scaling issues -- connections dropping, memory leaks, message loss under load, or backpressure problems
- User needs to add authentication, authorization, or rate limiting to WebSocket connections
- User wants to implement reconnection logic, heartbeats, or graceful degradation for unreliable network conditions
- User is designing a protocol layer on top of raw WebSockets (message framing, acknowledgments, sequencing)
- User is debugging WebSocket issues in production (high memory, slow fan-out, proxy timeouts, message ordering bugs)

**Do NOT use this skill when:**
- User needs general REST API design -- use the REST API design skill instead
- User needs GraphQL subscriptions exclusively and does not need to understand the underlying transport -- use the GraphQL subscriptions skill
- User is asking about HTTP caching, CDN configuration, or static asset delivery -- those are different concerns
- User needs event streaming between microservices (Kafka, RabbitMQ, NATS) -- use the message queue / event streaming skill
- User is asking about WebRTC for peer-to-peer video/audio -- WebRTC uses a different connection model entirely
- User needs push notifications to mobile devices (APNs, FCM) -- use the mobile push notifications skill
- User is asking about database change data capture (CDC) without a WebSocket delivery layer -- check the CDC/streaming skill

## Process

### Step 1: Classify the Real-Time Use Case and Select the Transport

Before writing any code, identify which real-time pattern best fits the requirement.

- **Fan-out broadcast** -- one event must be delivered to many subscribers simultaneously (stock tickers, sports scores, live election results). Optimal with WebSockets + pub/sub backend. SSE also viable if the stream is server-to-client only.
- **Request-response with push** -- client initiates requests AND the server pushes unsolicited updates (collaborative documents, chat with read receipts). Requires full duplex -- WebSockets only.
- **Presence and ephemeral state** -- knowing which users are online, what they are editing, cursor positions. Requires both client-to-server heartbeats and server-to-client broadcasts.
- **Event sourcing to client** -- replay of ordered events to bring a new client up to date, then stream deltas. Requires sequence numbers and a cursor/offset mechanism.
- **Low-frequency updates (< 1 event/30 seconds) with no client-to-server messages** -- SSE or long polling is simpler and avoids WebSocket connection overhead. Reserve WebSockets for true bidirectional or high-frequency needs.

**Transport decision matrix:**

| Requirement | WebSocket | SSE | Long Polling |
|---|---|---|---|
| Bidirectional messaging | ✅ Native | ❌ No | ❌ Simulated |
| Server-to-client only | ✅ Overkill | ✅ Ideal | ✅ Acceptable |
| Browser support | ✅ Universal | ✅ Universal | ✅ Universal |
| Works through HTTP proxies | ⚠️ Needs config | ✅ Always | ✅ Always |
| Binary frames | ✅ Yes | ❌ Text only | ❌ Text only |
| Auto-reconnect built in | ❌ Manual | ✅ Built in | ❌ Manual |
| Connection overhead | High | Medium | Low |
| Messages per second | Very high | High | < 1/sec practical |

Choose WebSockets when: bidirectional messaging is required OR message rate exceeds 1 per second OR latency must be under 100ms consistently.

### Step 2: Design the Message Protocol

Raw WebSockets transmit unstructured bytes. Define a protocol before implementing any handler logic.

- **Frame envelope structure** -- every message should carry: `type` (string discriminator), `id` (client-generated UUID for request-response correlation), `timestamp` (Unix ms, client clock), and `payload` (typed body). Example: `{ "type": "chat.message", "id": "a1b2c3", "ts": 1717000000000, "payload": { "room": "general", "text": "Hello" } }`.
- **Namespace the type field** -- use dot-separated namespaces (`presence.join`, `document.op`, `error.fatal`) to allow routing logic to be written as prefix matches. This prevents the handler table from becoming an unmanageable if/else chain as message types grow.
- **Define acknowledgment types explicitly** -- separate `ack` (delivery confirmed), `nack` (rejected with reason), and `error` (server fault). Never silently drop messages.
- **Choose serialization carefully** -- JSON is the default choice for debuggability. MessagePack reduces payload size by 20--40% for binary-heavy data and is worth adding when average message size exceeds 1 KB. Protocol Buffers are justified when schema evolution and cross-language compatibility are required.
- **Version the protocol** -- include a `v` field or negotiate version during handshake. Without versioning, deploying server changes requires coordinating all clients simultaneously.
- **Cap message size** -- reject messages over a defined limit (typical: 64 KB for chat, 1 MB for document operations) at the server level to prevent memory exhaustion from a single malicious or buggy client.

### Step 3: Implement Connection Lifecycle Management

Connection lifecycle is where most WebSocket bugs originate. Handle every state transition explicitly.

- **Handshake and authentication** -- authenticate during the HTTP upgrade request, not after the socket is open. Read the `Authorization` header or a `token` query parameter in the upgrade handler. Reject unauthenticated upgrades with HTTP 401 before the socket is established. Do NOT send an auth message after connection -- this creates a race window where unauthenticated messages can arrive.
- **Connection registration** -- on successful connection, store the connection object in a registry keyed by `userId` and `connectionId`. A single user may have multiple connections (multiple tabs). The registry must support one-to-many lookups: `userId → [connectionId1, connectionId2]`.
- **Heartbeat / keepalive** -- send a server-initiated `ping` frame every 25--30 seconds. Most load balancers and proxies (AWS ALB, nginx) terminate idle WebSocket connections after 60 seconds. If the client does not respond with `pong` within 10 seconds, close the connection with code 1001 (going away) and remove it from the registry. This prevents ghost connections that consume memory but cannot receive messages.
- **Graceful close** -- when the server needs to close a connection, send a typed `{ "type": "server.shutdown" }` message, wait 500ms, then send a WebSocket close frame with code 1001. This gives the client time to persist state before disconnecting.
- **Connection cleanup** -- on `close` event (any reason), always: unsubscribe from all pub/sub channels, remove from all rooms, emit a `presence.leave` event, and delete from the registry. Wrap cleanup in a try/catch -- a crash in cleanup leaks resources permanently.
- **Reconnection on the client** -- implement exponential backoff with jitter: base delay 1 second, multiplier 1.5, max delay 30 seconds, jitter ±20%. Formula: `delay = min(base * 1.5^attempt, 30000) * (0.8 + 0.4 * Math.random())`. After reconnection, send a `resume` message with the last received sequence number so the server can replay missed messages.

### Step 4: Build the Room and Channel System

Most real applications need to segment connections into logical groups.

- **Room abstraction** -- a room is a named set of connection IDs. Operations: `join(roomId, connectionId)`, `leave(roomId, connectionId)`, `broadcast(roomId, message)`, `members(roomId)`. In a single-process server, implement rooms as an in-memory `Map<string, Set<string>>`. This is sufficient for development and single-instance deployments.
- **In-process broadcast** -- iterating over a room's connection set and calling `ws.send()` on each is O(n) and synchronous. For rooms larger than 1,000 connections, consider chunked async iteration to yield the event loop between batches of 100 sends. This prevents one large broadcast from blocking smaller, lower-latency messages.
- **Cross-process broadcast (multi-instance scaling)** -- when running multiple server instances behind a load balancer, a connection on instance A cannot directly call `ws.send()` for a connection on instance B. Use a pub/sub broker as the fan-out backbone. Redis Pub/Sub is the standard choice: each instance subscribes to channels matching its connections' rooms. When a message arrives via Redis, the instance delivers it only to the connections it owns. This is the "Redis adapter" pattern used by Socket.IO and similar frameworks.
- **Channel naming conventions** -- use predictable, hierarchical channel names: `room:{roomId}`, `user:{userId}`, `broadcast:global`. Avoid using raw user-supplied strings as channel names without sanitization -- an attacker could subscribe to `user:*` patterns if your Redis config allows pattern subscriptions.
- **Presence tracking** -- store online status in Redis with a sorted set: `ZADD presence:online {timestamp} {userId}`. On disconnect, `ZREM presence:online {userId}`. Use `ZRANGEBYSCORE` to find users who have not sent a heartbeat in 60+ seconds as stale detection. Publish a `presence.update` event to all relevant rooms when a user's status changes.

### Step 5: Handle Backpressure and Flow Control

Unchecked message sending is the leading cause of WebSocket server crashes at scale.

- **Monitor the send buffer** -- in Node.js, `ws.bufferedAmount` reflects how many bytes are queued to send. If this exceeds a threshold (typical: 1 MB), the client is not consuming messages fast enough. Options: drop non-critical messages (acceptable for ephemeral state like cursor positions), pause upstream message production, or close the connection with a 1008 (policy violation) close code and an error message.
- **Prioritize message types** -- not all messages have equal urgency. Maintain separate queues per connection: `critical` (errors, close notifications), `interactive` (chat messages, user actions), `background` (presence updates, analytics). Drain critical first. This prevents a burst of low-priority updates from delaying a critical error notification.
- **Client-side rate limiting** -- limit how frequently a single client can send messages. Track per-connection message counts in a sliding window: if a connection sends more than 100 messages in 10 seconds, reject subsequent messages with `{ "type": "error.rate_limit", "retryAfter": 10000 }` and do NOT close the connection -- closing encourages reconnect storms.
- **Slow consumer handling** -- a client on a 2G connection may accept messages at 50 KB/s while the server is pushing 500 KB/s. Detect this by monitoring `bufferedAmount` growth rate. After 5 seconds of continuous buffer growth, send a `{ "type": "server.throttle", "level": "reduced" }` message and switch the client to a lower-frequency update tier.

### Step 6: Implement Reliability and Message Ordering

WebSockets do NOT guarantee delivery or ordering when connections drop and reconnect.

- **Sequence numbers** -- attach a monotonically increasing `seq` integer to every server-to-client message within a room or session. On reconnect, the client sends `{ "type": "session.resume", "lastSeq": 847 }`. The server replays messages 848 through current from its buffer.
- **Server-side message buffer** -- keep a circular buffer of the last N messages per room in Redis (use `RPUSH` + `LTRIM` to maintain a fixed-length list). Buffer size depends on acceptable replay window: 100 messages is adequate for chat rooms, 1,000 messages for collaborative editing where offline periods matter.
- **Idempotency keys** -- clients should include a client-generated `id` in every message they send. If the server receives a duplicate `id` (because the client retransmitted after a disconnect), discard the duplicate and resend the original acknowledgment. Store processed IDs in a Redis set with a 5-minute TTL.
- **At-least-once vs exactly-once** -- WebSocket delivery is at-least-once at best (without application-level acks). For financial transactions, cart updates, or any state-mutating operation, implement explicit acknowledgment: client sends message with `id`, server processes and responds `{ "type": "ack", "id": "...", "status": "ok" }`, client retransmits if no ack within 5 seconds, up to 3 retries.
- **Ordering across server instances** -- in a multi-instance deployment, messages from the same client may arrive at different instances due to reconnection. Use a Redis-based sequence counter per session: `INCR session:{sessionId}:seq`. This provides a globally consistent sequence even across instance boundaries.

### Step 7: Harden for Production

Address the operational concerns that cause production WebSocket deployments to fail.

- **Load balancer sticky sessions** -- configure sticky session (session affinity) at the load balancer for WebSocket connections. AWS ALB: enable stickiness on the target group with a 1-day cookie duration. This ensures reconnecting clients land on the same server instance, preserving in-memory state during brief disconnects. If sticky sessions are unavailable, ensure ALL state is in Redis -- no in-memory state that would be lost on instance switch.
- **Connection limits** -- set a maximum concurrent connections per instance based on measured memory usage. A typical WebSocket connection in Node.js consumes 50--100 KB of memory when idle. A 4 GB instance can safely handle ~20,000--30,000 concurrent connections. When the limit is reached, return HTTP 503 on new upgrade requests rather than accepting connections that will degrade performance for existing ones.
- **Graceful shutdown** -- on SIGTERM, stop accepting new connections immediately (set a flag, return 503), broadcast `{ "type": "server.shutdown", "reconnectDelay": 5000 }` to all connected clients, wait for clients to disconnect or 10 seconds (whichever comes first), then exit. This allows rolling deploys without mass reconnection storms.
- **Metrics to instrument** -- track: `ws_connections_active` (gauge), `ws_connections_total` (counter), `ws_messages_sent_total` (counter by type), `ws_messages_received_total` (counter by type), `ws_errors_total` (counter by error code), `ws_send_buffer_bytes` (histogram), `ws_message_latency_ms` (histogram). Alert on: active connections > 80% of limit, error rate > 1%, p99 send latency > 500ms.
- **Proxy and firewall configuration** -- configure nginx to handle WebSocket upgrades: `proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; proxy_read_timeout 3600s;`. The `proxy_read_timeout` must exceed your heartbeat interval or nginx will close the connection.

---

## Output Format

When responding to WebSocket implementation questions, structure your output as follows:

```
## WebSocket Implementation Plan: [Feature Name]

### Transport Selection
- Chosen transport: [WebSocket / SSE / Long Polling]
- Rationale: [1-3 sentences based on the use case classification]
- Bidirectional required: [Yes/No]
- Expected message rate: [X messages/second/connection]

### Message Protocol

#### Envelope Schema
```json
{
  "type": "namespace.action",
  "id": "uuid-v4",
  "ts": 1717000000000,
  "v": 1,
  "payload": { }
}
```

#### Message Types
| Type | Direction | Payload | Ack Required |
|------|-----------|---------|--------------|
| [type] | S→C / C→S / Both | [fields] | Yes/No |

### Connection Lifecycle

**Server-side handler pseudocode:**
```
onUpgrade(req):
  token = req.headers['authorization'] || req.query.token
  user = verifyToken(token) -- reject 401 if invalid
  connectionId = generateId()
  registry.add(userId, connectionId, socket)
  startHeartbeat(connectionId, interval=25s, timeout=10s)
  send({ type: 'session.init', connectionId, seq: currentSeq })

onMessage(connectionId, rawData):
  msg = parse(rawData) -- reject if > maxSize
  rateLimiter.check(connectionId) -- reject if exceeded
  router.dispatch(msg.type, connectionId, msg)

onClose(connectionId, code, reason):
  registry.remove(connectionId)
  rooms.leaveAll(connectionId)
  presence.setOffline(userId)
  pubsub.unsubscribeAll(connectionId)
  heartbeat.cancel(connectionId)
```

### Room / Channel Architecture
- Room implementation: [in-memory Map / Redis adapter]
- Cross-instance fan-out: [Redis Pub/Sub channel names]
- Presence storage: [Redis sorted set / in-memory]

### Reliability Settings
- Sequence numbers: [Yes/No]
- Replay buffer: [N messages / TTL]
- Client retry policy: [backoff formula]
- Idempotency key TTL: [seconds]

### Scaling Configuration
- Max connections per instance: [N]
- Load balancer sticky sessions: [Yes/No, configuration notes]
- Heartbeat interval: [N seconds]
- Proxy read timeout: [N seconds]

### Key Metrics to Monitor
- [metric name]: [threshold and alert condition]

### Implementation Checklist
- [ ] Authentication at upgrade (not post-connect)
- [ ] Heartbeat with configurable interval and timeout
- [ ] Connection registry with userId → [connectionId] mapping
- [ ] Message size limit enforced
- [ ] Per-connection rate limiting
- [ ] Graceful shutdown handler
- [ ] Backpressure detection on send buffer
- [ ] Sequence numbers on server-to-client messages
- [ ] Reconnect replay endpoint / message buffer
- [ ] Metrics instrumentation
```

---

## Rules

1. **NEVER authenticate after the WebSocket connection is open.** Authentication must happen during the HTTP upgrade handshake. A post-connect auth message creates a window where unauthenticated messages can arrive and be processed before the auth completes.

2. **NEVER use a single global room or broadcast channel for all messages.** Every unfiltered broadcast to all connections scales as O(connections) and will cause noticeable latency spikes once you exceed 1,000 concurrent users. Always segment connections into rooms or topics.

3. **ALWAYS set a maximum message size limit.** Without it, a single client can send a 1 GB message and exhaust server memory. Enforce this limit before deserializing the payload -- reject at the byte-count level using the WebSocket frame headers.

4. **NEVER store WebSocket connection objects in a database.** Connection objects are in-memory only and not serializable. Store connection metadata (connectionId, userId, roomIds, lastSeen) in Redis with a TTL, and use that metadata to route messages to the correct server instance.

5. **ALWAYS implement heartbeat/ping at the server level, not just the client level.** Load balancers (AWS ALB, GCP Load Balancer) and corporate firewalls silently kill idle TCP connections after 60--300 seconds. Server-initiated pings every 25 seconds prevent this. Client-only keepalives fail silently when the client tab is backgrounded.

6. **NEVER let a reconnect storm cause a cascading failure.** When a server instance restarts, all its clients reconnect simultaneously. Without jitter in the reconnect backoff, all clients hit the server at the same moment, saturating it before it can stabilize. The reconnect formula MUST include random jitter.

7. **ALWAYS drain the send buffer check before sending.** Check `socket.bufferedAmount` (browser) or the equivalent server-side metric before sending each message. Queuing messages to a slow client unboundedly causes memory exhaustion on the server and client. Drop, throttle, or close -- but never queue without bound.

8. **NEVER assume WebSocket messages arrive in order after a reconnect.** The sequence number and replay buffer pattern is mandatory for any feature that depends on ordering (collaborative editing, event sourcing, financial operations). Without it, reconnecting clients will silently see inconsistent state.

9. **ALWAYS handle the `error` event on the WebSocket in addition to `close`.** In Node.js with the `ws` library, if you do not attach an `error` handler, an unhandled error event will crash the process. The `error` event fires before `close` in many network failure scenarios. Always log the error, then let the `close` handler do cleanup.

10. **NEVER ignore the difference between WebSocket close codes.** Code 1000 (normal closure) and 1001 (going away) are clean -- the client should reconnect with normal backoff. Code 1008 (policy violation) and 1009 (message too large) indicate a client bug -- the client should NOT immediately reconnect but instead alert or log. Code 1011 (server error) is a server bug -- the client should reconnect with aggressive backoff and alert ops. Your client reconnect logic must branch on close code.

---

## Edge Cases

### 1. WebSocket Behind a Corporate Proxy or Strict Firewall

Some enterprise networks block WebSocket upgrades entirely or intercept TLS in a way that breaks the `101 Switching Protocols` response. Symptoms: connections fail immediately with HTTP 403, 407, or time out during handshake.

- Implement automatic transport fallback: attempt WebSocket first, if the connection fails within 5 seconds, fall back to SSE (if server-to-client only) or long polling. Use an abstraction layer (or a library like Socket.IO's transport negotiation) to hide this from application code.
- Always use WebSocket over TLS (`wss://`) in production. Plain `ws://` is blocked by most corporate firewalls and modern browsers show mixed-content warnings.
- If SSE fallback is used, the client-to-server path must use HTTP POST requests, and the server must correlate POST requests to the SSE session using a session token issued at SSE connection time.
- Test explicitly on corporate VPNs and with common proxy software (Zscaler, BlueCoat) during QA -- not just open internet.

### 2. Horizontal Scaling Without Sticky Sessions

If your deployment platform cannot guarantee sticky sessions (some Kubernetes ingress configurations, serverless WebSocket implementations), every message route must go through the shared broker.

- Store ALL connection state in Redis, not in process memory. This includes room memberships, sequence number positions, rate limit counters, and heartbeat timestamps.
- When a client reconnects and lands on a different server instance, that instance must be able to fully reconstruct the session from Redis. Design the Redis data model for this from the start -- retrofitting it later requires rewriting the entire connection lifecycle.
- Use Redis cluster mode if your WebSocket deployment is large enough that a single Redis instance becomes a bottleneck. Partition channel namespaces across shards. Fan-out for a single channel must not cross shard boundaries -- design room IDs to consistently hash to a single shard.
- Benchmark the Redis round-trip cost: a `PUBLISH` + `SUBSCRIBE` delivery in Redis typically takes 0.5--2ms on localhost, 2--10ms in the same region. If your message latency budget is under 10ms, the Redis hop is significant and may require Redis Cluster or a dedicated low-latency broker (NATS JetStream, Redis 7+ with Redis Pub/Sub optimizations).

### 3. Client-Side Tab Visibility and Backgrounded Tabs

Browsers aggressively throttle JavaScript timers and network activity in backgrounded tabs (Chrome: 1-minute freeze after 5 minutes background, Safari: aggressive suspension). This causes:

- Heartbeat pings to stop firing from the client side -- the server sees the connection as dead and closes it.
- The `visibilitychange` event fires when a tab is hidden/shown. On `visibilitychange` (hidden), suspend client-initiated activity. On `visibilitychange` (visible), immediately send a heartbeat and request a state refresh.
- Set server heartbeat interval to 45 seconds (not 25) to accommodate tab throttling. Accept the tradeoff of slower dead-connection detection.
- On reconnect after a visibility-triggered disconnect, the client must send a `session.resume` message with the last known sequence number and re-subscribe to all rooms. This state must be persisted to `sessionStorage` so it survives the brief disconnect.

### 4. Large-Scale Fan-Out (>10,000 Recipients per Event)

Broadcasting a single event to 10,000+ connections synchronously can take 200--500ms and block the event loop in Node.js, causing all other clients to experience latency spikes during large broadcasts.

- Segment large rooms into shards of no more than 1,000 connections per shard. Each shard is handled by a separate worker thread or process. The main server routes the broadcast to all shard workers via a shared memory channel (Node.js Worker Threads `SharedArrayBuffer`, or Redis Pub/Sub to each worker).
- Use `setImmediate()` yielding between batches of sends in Node.js: send 100 messages, yield, send the next 100. This keeps the event loop responsive.
- For truly massive broadcasts (sports events, live elections with 100,000+ concurrent viewers), do NOT use WebSocket fan-out directly. Push the event to a message broker (Kafka, NATS), have dedicated worker processes consume it and fan out in parallel, each worker owning a slice of the connection pool.
- Measure and alert on broadcast completion time. A 10,000-recipient broadcast should complete in under 100ms. If it exceeds 200ms, you need additional parallelism.

### 5. Schema Evolution and Protocol Versioning

After launching, changing the message schema breaks existing clients until they update. Mobile app clients may never update.

- Always include a `v` (version) integer in every message envelope. Start at `1`. Increment when the schema changes in a breaking way.
- At the server, maintain handlers for all active protocol versions. A handler for `v1` and a handler for `v2` can coexist. Route based on the `v` field in the message.
- During the connection handshake, the client sends its supported versions: `{ "type": "session.init", "supportedVersions": [1, 2] }`. The server responds with the highest mutually supported version. All subsequent messages use the negotiated version.
- Deprecate old versions with a sunset timeline. Send `{ "type": "server.deprecation", "deprecatedVersion": 1, "sunsetDate": "2025-12-01" }` messages to clients still on old versions. Force-disconnect clients on unsupported versions after the sunset date with close code 4001 (application-defined deprecation).
- Additive changes (new optional fields) are non-breaking and do not require a version bump. Removing fields, renaming fields, or changing field types always require a version increment.

### 6. Memory Leaks from Zombie Connections

In high-churn deployments (users frequently opening and closing browser tabs), zombie connections accumulate when cleanup code fails silently.

- Every resource allocated on connect (room membership, Redis subscriptions, heartbeat timers, rate limit buckets) must be cleaned up in a single `cleanup(connectionId)` function. Call this function from BOTH the `close` event handler AND from a scheduled audit process.
- Run an audit every 60 seconds: compare the set of connectionIds in your registry against all active WebSocket objects. Any connectionId in the registry that does not have a live socket object is a zombie -- run `cleanup()` for it immediately.
- Use weak references (Node.js `WeakRef`) for storing socket objects when the registry holds other data about connections. This allows GC to collect dead socket objects and makes zombie detection easier.
- Monitor process heap usage. A memory leak in connection handling will show as a steady upward slope in heap size with no correlation to connection count. Set an alert if heap grows by more than 50 MB over 10 minutes without a corresponding 20%+ increase in connection count.

### 7. Collaborative Editing and Operational Transform Conflicts

When multiple clients edit shared state concurrently (documents, whiteboards, code), last-write-wins is almost always wrong.

- Implement Operational Transformation (OT) or Conflict-free Replicated Data Types (CRDTs) depending on the data structure. CRDTs (using libraries like Yjs or Automerge) are significantly easier to implement correctly for most collaborative use cases -- they require no central server-side conflict resolution logic.
- With Yjs over WebSocket: the Yjs document state is a CRDT. All changes are expressed as binary update messages. The server's only role is to relay updates between clients and maintain a persistent snapshot of the Y.Doc. No conflict resolution code runs on the server.
- With OT: every operation carries a revision number. The server is the single authority on operation ordering. Clients submit operations with the revision they were based on. The server transforms incoming operations against any concurrent operations, then broadcasts the transformed operation with a new revision. This is harder to implement correctly but necessary for real-time code editors with complex cursor semantics.
- Always persist the collaborative document state durably (PostgreSQL, S3) on every N operations (N = 50--100). Derive the current state from the last snapshot + replay of subsequent operations. Do not require replaying the full operation history from the beginning.

---

## Example

**Input:** "I'm building a live collaborative whiteboard app. Multiple users can draw on a shared canvas simultaneously. There will be rooms (one per whiteboard), each with up to 50 concurrent users. We're running Node.js with multiple instances behind an AWS ALB. I need real-time cursor tracking, drawing operations synced across all users, and the board state should persist so new joiners see the current state. What's the WebSocket architecture and code patterns should I use?"

---

**Output:**

## WebSocket Implementation Plan: Live Collaborative Whiteboard

### Transport Selection
- **Chosen transport:** WebSocket (full-duplex, binary-capable)
- **Rationale:** Drawing operations are bidirectional (client sends strokes, server broadcasts to room), message rate can exceed 30 ops/second per active user during drawing, and cursor tracking requires sub-100ms latency. SSE cannot handle the client-to-server direction.
- **Bidirectional required:** Yes
- **Expected message rate:** 10--30 messages/second/active user, 1--5 messages/second/idle user (cursor only)

---

### Message Protocol

#### Envelope Schema
```json
{
  "type": "draw.stroke" ,
  "id": "7f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "ts": 1717000000000,
  "v": 1,
  "payload": { }
}
```

#### Message Types
| Type | Direction | Payload | Ack Required |
|---|---|---|---|
| `session.init` | C→S | `{ boardId, token, lastSeq }` | Yes |
| `session.ready` | S→C | `{ connectionId, seq, snapshot }` | No |
| `cursor.move` | C→S | `{ x, y }` | No |
| `cursor.update` | S→C | `{ userId, x, y, color }` | No |
| `draw.stroke` | C→S | `{ points[], color, width, tool }` | Yes |
| `draw.op` | S→C | `{ userId, seq, points[], color, width, tool }` | No |
| `draw.undo` | C→S | `{ opId }` | Yes |
| `presence.join` | S→C | `{ userId, displayName, color, cursor }` | No |
| `presence.leave` | S→C | `{ userId }` | No |
| `ack` | S→C | `{ id, status, seq? }` | No |
| `error.rate_limit` | S→C | `{ retryAfter }` | No |
| `server.shutdown` | S→C | `{ reconnectDelay }` | No |

**Size limits:** cursor messages max 128 bytes, draw operations max 32 KB, reject anything larger.

---

### Connection Lifecycle

**Server-side handler (Node.js + `ws` library):**

```javascript
// ws-server.js

const WebSocket = require('ws');
const redis = require('./redis-client'); // ioredis instance
const { verifyToken } = require('./auth');
const { registry, rooms, heartbeat } = require('./connection-manager');

const wss = new WebSocket.Server({ noServer: true });
const MAX_MESSAGE_BYTES = 32 * 1024; // 32 KB
const HEARTBEAT_INTERVAL_MS = 25000;
const HEARTBEAT_TIMEOUT_MS = 10000;
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 10000;

// Called from HTTP server upgrade event
function handleUpgrade(req, socket, head) {
  const token = req.headers['authorization']?.replace('Bearer ', '')
               || new URL(req.url, 'ws://x').searchParams.get('token');

  const user = verifyToken(token);
  if (!user) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req, user);
  });
}

wss.on('connection', (ws, req, user) => {
  const connectionId = crypto.randomUUID();
  
  // Register connection
  registry.add(user.id, connectionId, ws);
  
  // Start heartbeat -- server-initiated to survive ALB idle timeout
  const pingTimer = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.ping();
    ws._pongDeadline = setTimeout(() => {
      ws.close(1001, 'heartbeat timeout');
    }, HEARTBEAT_TIMEOUT_MS);
  }, HEARTBEAT_INTERVAL_MS);

  ws.on('pong', () => {
    clearTimeout(ws._pongDeadline);
  });

  ws.on('message', (data, isBinary) => {
    // Enforce size limit before parsing
    if (data.length > MAX_MESSAGE_BYTES) {
      send(ws, { type: 'error.message_too_large', maxBytes: MAX_MESSAGE_BYTES });
      return;
    }

    // Rate limiting: sliding window per connection
    const now = Date.now();
    ws._msgTimestamps = (ws._msgTimestamps || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (ws._msgTimestamps.length >= RATE_LIMIT_MAX) {
      send(ws, { type: 'error.rate_limit', retryAfter: RATE_LIMIT_WINDOW_MS });
      return;
    }
    ws._msgTimestamps.push(now);

    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (e) {
      send(ws, { type: 'error.parse_failure' });
      return;
    }

    router(ws, user, connectionId, msg);
  });

  ws.on('error', (err) => {
    console.error(`ws error [${connectionId}]:`, err.message);
    // 'close' will fire after 'error' -- cleanup happens there
  });

  ws.on('close', (code, reason) => {
    clearInterval(pingTimer);
    clearTimeout(ws._pongDeadline);
    cleanup(user.id, connectionId);
  });
});

async function cleanup(userId, connectionId) {
  try {
    const boardId = registry.getBoardId(connectionId);
    registry.remove(connectionId);
    if (boardId) {
      rooms.leave(boardId, connectionId);
      await redis.publish(`board:${boardId}`, JSON.stringify({
        type: 'presence.leave',
        payload: { userId }
      }));
      await redis.zrem('presence:' + boardId, userId);
    }
  } catch (err) {
    console.error(`cleanup error [${connectionId}]:`, err);
  }
}

function send(ws, msg) {
  if (ws.readyState !== WebSocket.OPEN) return;
  // Backpressure check
  if (ws.bufferedAmount > 1024 * 1024) { // 1 MB threshold
    if (msg.type === 'cursor.update') return; // Drop low-priority, never drop critical
    console.warn('send buffer full, dropping:', msg.type);
    return;
  }
  ws.send(JSON.stringify(msg));
}
```

---

### Room and Channel Architecture

**Multi-instance fan-out using Redis Pub/Sub:**

```javascript
// board-room.js -- Redis adapter for cross-instance broadcast

const redis = require('./redis-client');
const subscriber = redis.duplicate(); // separate connection for subscriptions

// Each instance subscribes to board channels for boards it has active connections
async function joinBoard(boardId, connectionId, ws, userId, lastSeq) {
  const channelKey = `board:${boardId}`;
  
  // Subscribe this instance to the board channel if not already subscribed
  if (!activeSubscriptions.has(boardId)) {
    await subscriber.subscribe(channelKey);
    activeSubscriptions.add(boardId);
  }
  
  rooms.join(boardId, connectionId);
  
  // Load snapshot + replay missed messages
  const [snapshot, missedOps] = await Promise.all([
    redis.get(`board:${boardId}:snapshot`),
    replayFrom(boardId, lastSeq)
  ]);
  
  // Send current state to the joining client
  send(ws, {
    type: 'session.ready',
    connectionId,
    seq: await getCurrentSeq(boardId),
    snapshot: snapshot ? JSON.parse(snapshot) : null,
    missedOps
  });
  
  // Announce presence to room
  const presentUsers = await redis.zrange(`presence:${boardId}`, 0, -1);
  await redis.zadd(`presence:${boardId}`, Date.now(), userId);
  await redis.publish(channelKey, JSON.stringify({
    type: 'presence.join',
    payload: { userId, displayName: user.displayName, color: user.color }
  }));
}

// When Redis delivers a message, fan out to all local connections in the room
subscriber.on('message', (channel, data) => {
  const boardId = channel.replace('board:', '');
  const msg = JSON.parse(data);
  const connections = rooms.getConnections(boardId);
  
  for (const connectionId of connections) {
    const ws = registry.getSocket(connectionId);
    if (ws) send(ws, msg);
  }
});
```

**Redis data model:**

```
board:{boardId}:snapshot        STRING  -- JSON, current board state (updated every 50 ops)
board:{boardId}:seq             STRING  -- INCR counter, current sequence number
board:{boardId}:ops             LIST    -- RPUSH, last 500 operations (LTRIM to 500)
presence:{boardId}              ZSET    -- member=userId, score=lastSeenTimestamp
session:{connectionId}:meta     HASH    -- userId, boardId, lastSeq (TTL: 1 hour)
idempotency:{msgId}             STRING  -- "1", TTL 5 minutes
```

---

### Drawing Operation Handler with Sequence Numbers

```javascript
// router.js

async function handleDrawStroke(ws, user, connectionId, msg) {
  const { boardId } = registry.getMeta(connectionId);
  
  // Idempotency check
  const dedupKey = `idempotency:${msg.id}`;
  const isDuplicate = await redis.set(dedupKey, '1', 'EX', 300, 'NX') === null;
  if (isDuplicate) {
    // Resend original ack, do not reprocess
    send(ws, { type: 'ack', id: msg.id, status: 'ok' });
    return;
  }
  
  // Assign server-side sequence number
  const seq = await redis.incr(`board:${boardId}:seq`);
  
  const op = {
    type: 'draw.op',
    id: msg.id,
    seq,
    ts: Date.now(),
    payload: {
      userId: user.id,
      ...msg.payload // points, color, width, tool
    }
  };
  
  // Persist to replay buffer
  const opJson = JSON.stringify(op);
  await redis.pipeline()
    .rpush(`board:${boardId}:ops`, opJson)
    .ltrim(`board:${boardId}:ops`, -500, -1) // keep last 500
    .exec();
  
  // Snapshot every 50 operations
  if (seq % 50 === 0) {
    await updateSnapshot(boardId);
  }
  
  // Fan out to all room members via Redis
  await redis.publish(`board:${boardId}`, opJson);
  
  // Ack to originating client
  send(ws, { type: 'ack', id: msg.id, status: 'ok', seq });
}

// Cursor moves: no ack, no persistence, high frequency
async function handleCursorMove(ws, user, connectionId, msg) {
  const { boardId } = registry.getMeta(connectionId);
  await redis.publish(`board:${boardId}`, JSON.stringify({
    type: 'cursor.update',
    payload: { userId: user.id, x: msg.payload.x, y: msg.payload.y }
  }));
}
```

---

### Client Reconnect Logic

```javascript
// client/ws-client.js

class WhiteboardSocket {
  constructor(boardId, token) {
    this.boardId = boardId;
    this.token = token;
    this.lastSeq = parseInt(sessionStorage.getItem(`board:${boardId}:seq`) || '0');
    this.attempt = 0;
    this.connect();
  }
  
  connect() {
    this.ws = new WebSocket(`wss://api.example.com/ws?token=${this.token}`);
    
    this.ws.onopen = () => {
      this.attempt = 0;
      this.ws.send(JSON.stringify({
        type: 'session.init',
        id: crypto.randomUUID(),
        ts: Date.now(),
        v: 1,
        payload: { boardId: this.boardId, lastSeq: this.lastSeq }
      }));
    };
    
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.seq) {
        this.lastSeq = msg.seq;
        sessionStorage.setItem(`board:${this.boardId}:seq`, msg.seq);
      }
      this.onMessage(msg);
    };
    
    this.ws.onclose = (event) => {
      // Do not reconnect on policy violations -- indicates a client bug
      if (event.code === 1008 || event.code === 1009) {
        console.error('WebSocket closed due to policy violation -- not reconnecting', event.code);
        this.onFatalError(event.code);
        return;
      }
      this.scheduleReconnect();
    };
    
    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      // onclose fires next -- reconnect logic is there
    };
    
    // Handle backgrounded tab
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.ws.readyState !== WebSocket.OPEN) {
        this.connect();
      }
    });
  }
  
  scheduleReconnect() {
    const delay = Math.min(1000 * Math.pow(1.5, this.attempt), 30000);
    const jitter = delay * (0.8 + 0.4 * Math.random());
    this.attempt++;
    setTimeout(() => this.connect(), jitter);
  }
}
```

---

### Scaling Configuration

| Parameter | Value | Rationale |
|---|---|---|
| Max connections per instance | 15,000 | ~200 KB/conn with Yjs doc state; 3 GB reserved for connections on 4 GB instance |
| Heartbeat interval | 25 seconds | AWS ALB idle timeout is 60 seconds; this provides 2x margin |
| Pong timeout | 10 seconds | Total dead detection: 35 seconds |
| Proxy read timeout (nginx) | 3,600 seconds | 1-hour max session without requiring reconnect |
| Replay buffer | 500 ops per board | Covers ~60 seconds of heavy drawing at max rate |
| Snapshot frequency | Every 50 ops | Caps replay time on join to < 50 ops at all times |
| Idempotency key TTL | 300 seconds | Covers any realistic retransmit window |
| Rate limit | 100 messages / 10 seconds | ~10 msg/sec sustained; burst allows fast strokes |

---

### Key Metrics to Monitor

- `ws_connections_active` -- alert if > 12,000 (80% of 15,000 limit)
- `ws_messages_received_per_second` by type -- alert on unexpected type spikes
- `ws_broadcast_duration_ms` (p99) -- alert if > 100ms for rooms with 50 users
- `ws_send_buffer_bytes` (p95 across connections) -- alert if > 256 KB
- `redis_publish_latency_ms` (p99) -- alert if > 20ms (indicates Redis saturation)
- `ws_errors_total` by close code -- alert if code 1011 (server error) rate > 0.1%
- `ws_reconnect_rate` (reconnects/minute) -- alert if > 5% of active connections/minute (indicates instability)
- Process heap size -- alert if growing > 50 MB over 10 minutes without connection increase

---

### Implementation Checklist
- [x] Authentication at upgrade via `Authorization` header or `token` query param
- [x] HTTP 401 returned for invalid token -- socket never opened
- [x] Server-initiated ping every 25 seconds with 10-second pong deadline
- [x] Connection registry: `userId → connectionId → WebSocket`
- [x] Message size enforced at 32 KB before JSON.parse
- [x] Per-connection sliding window rate limiting (100 msgs / 10 sec)
- [x] Graceful shutdown: broadcast `server.shutdown`, wait 10 seconds, exit
- [x] Backpressure check before every `ws.send()` -- drops cursors, preserves draw ops
- [x] Server-assigned sequence numbers on all draw operations
- [x] Replay buffer: last 500 ops in Redis list per board
- [x] Snapshot every 50 ops for fast new-joiner load
- [x] Idempotency key dedup with 5-minute TTL
- [x] Redis Pub/Sub cross-instance fan-out with per-board channels
- [x] Presence sorted set in Redis with `zadd` / `zrem`
- [x] Client exponential backoff with jitter (base 1s, max 30s, ±20% jitter)
- [x] Close code branching -- no reconnect on 1008/1009
- [x] `visibilitychange` reconnect trigger for backgrounded tabs
- [x] `lastSeq` persisted to `sessionStorage` for reconnect replay
- [x] All cleanup code wrapped in try/catch to prevent resource leaks
