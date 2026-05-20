---
name: websocket-engineer
description: |
  Real-time communication expertise covering WebSocket protocol, Socket.IO patterns, connection lifecycle, room and channel management, reconnection strategies, scaling WebSockets, SSE vs WebSocket, heartbeat/ping-pong, and message serialization.
  Use when the user asks about websocket engineer, websocket engineer best practices, or needs guidance on websocket engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend api-design guide"
  category: "backend-systems"
  subcategory: "server-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# WebSocket Engineer

## Purpose

Design and implement real-time communication systems using WebSockets and related technologies. This skill covers protocol fundamentals, architecture patterns, scaling strategies, and the decision framework for choosing between real-time technologies.

## Technology Selection

### Decision Matrix

```
NEED                                TECHNOLOGY
-----------------------------------------------------------
Unidirectional (server -> client)   Server-Sent Events (SSE)
Bidirectional, simple               Native WebSocket
Bidirectional + features            Socket.IO
High-frequency data (gaming)        WebSocket + binary
Occasional updates                  HTTP polling / long-polling

SSE vs WebSocket:
  SSE:
    + Simple (just HTTP)
    + Auto-reconnection built in
    + Works through proxies/firewalls easily
    + Event ID for resuming
    # ... (condensed) ...
    + Acknowledgments (request-reply)
    + Binary support
    - Additional library dependency
    - Larger payload (protocol overhead)
    - Not a standard protocol
```

## WebSocket Protocol

### Connection Lifecycle

```
1. HANDSHAKE (HTTP Upgrade)
   Client -> Server: GET /ws HTTP/1.1
                     Connection: Upgrade
                     Upgrade: websocket
                     Sec-WebSocket-Key: dGhlIHNhbXBsZS...
                     Sec-WebSocket-Version: 13

   Server -> Client: HTTP/1.1 101 Switching Protocols
                     Connection: Upgrade
                     Upgrade: websocket
                     Sec-WebSocket-Accept: s3pPLMBiTxaQ9k...

2. DATA TRANSFER
   Bidirectional frames (text or binary)
   # ... (condensed) ...
  1003  Unsupported data type
  1006  Abnormal closure (no close frame received)
  1008  Policy violation
  1009  Message too big
  1011  Unexpected server error
```

### Native WebSocket Server (Node.js)

```ts
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

const server = createServer();
const wss = new WebSocketServer({ server });

// Authentication during upgrade
server.on('upgrade', (request, socket, head) => {
  const token = new URL(request.url!, `[reference URL]).searchParams.get('token');

  try {
    const user = verifyToken(token!);
    wss.handleUpgrade(request, socket, head, (ws) => {
      (ws as any).user = user;
      # ... (condensed) ...
}, 30000); // Every 30 seconds

wss.on('close', () => clearInterval(heartbeatInterval));

server.listen(3000);
```

## Socket.IO Patterns

### Server Setup

```ts
import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ['[reference URL]'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,  // 1MB max message size
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,  // 2 minutes
    # ... (condensed) ...
  // Disconnect
  socket.on('disconnect', (reason) => {
    console.log(`Disconnected: ${user.id} (${reason})`);
  });
});
```

### Client Setup

```ts
import { io, Socket } from 'socket.io-client';

function createSocket(token: string): Socket {
  const socket = io('[reference URL]', {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    timeout: 10000,
    transports: ['websocket'],  // Skip polling, go straight to WS
  });

  socket.on('connect', () => {
    # ... (condensed) ...
      if (response.error) reject(new Error(response.error));
      else resolve(response);
    });
  });
}
```

## Room/Channel Management

### Room Patterns

```ts
// Namespace for feature separation
const chatNamespace = io.of('/chat');
const notificationNamespace = io.of('/notifications');

// Each namespace has independent middleware and event handlers
chatNamespace.use(chatAuthMiddleware);
notificationNamespace.use(notificationAuthMiddleware);

// Room operations
// Join: socket.join('room:abc')
// Leave: socket.leave('room:abc')
// Emit to room: io.to('room:abc').emit('event', data)
// Emit to room except sender: socket.to('room:abc').emit('event', data)
// Get room members: io.in('room:abc').fetchSockets()
# ... (condensed) ...
  chat:     (id: string) => `chat:${id}`,
  document: (id: string) => `doc:${id}`,
  user:     (id: string) => `user:${id}`,      // Personal notifications
  org:      (id: string) => `org:${id}`,        // Organization-wide
};
```

## Reconnection Strategy

```ts
// Exponential backoff with jitter
class ReconnectionManager {
  private attempt = 0;
  private maxAttempts = 10;
  private baseDelay = 1000;   // 1 second
  private maxDelay = 30000;   // 30 seconds
  private timer: ReturnType<typeof setTimeout> | null = null;

  scheduleReconnect(connect: () => void): void {
    if (this.attempt >= this.maxAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    # ... (condensed) ...

  cancel(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}
```

## Scaling WebSockets

### Horizontal Scaling with Redis Adapter

```ts
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

// Each server instance connects to Redis
const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);

const io = new Server(httpServer);
io.adapter(createAdapter(pubClient, subClient));

// Now io.to('room').emit() works across all server instances
// Redis Pub/Sub broadcasts to all connected Socket.IO servers
```

### Architecture

```
                    [Load Balancer]
                   (sticky sessions*)
                  /        |        \
          [Server 1]  [Server 2]  [Server 3]
              \           |           /
               [Redis Adapter (Pub/Sub)]
                        |
                    [Redis Cluster]

* Sticky sessions ensure a client always hits the same server.
  Required because WebSocket upgrade must go to the same server
  that received the initial HTTP request.

  With Socket.IO: use cookie-based affinity or client IP hash.
  With K8s: use session affinity on Ingress.
```

### Scaling Considerations

```
CONNECTION LIMITS:
  - Each server: 10,000-50,000 connections (depends on memory/CPU)
  - Each connection: ~10KB base memory
  - 50,000 connections ~= 500MB just for connections
  - Linux: increase file descriptor limits (ulimit -n 1000000)

MESSAGE THROUGHPUT:
  - JSON serialization is CPU-bound
  - Binary (MessagePack, Protobuf) reduces serialization overhead
  - Batch messages when possible (group updates)
  - Use compression for large payloads (permessage-deflate)

PRESENCE TRACKING:
  - Use Redis Sets for online users per room
  - Use Redis Pub/Sub for presence change notifications
  - Don't query presence from individual server instances
```

## Heartbeat / Ping-Pong

```ts
// Server-side heartbeat (native WebSocket)
const HEARTBEAT_INTERVAL = 30000;  // 30 seconds
const HEARTBEAT_TIMEOUT = 10000;   // 10 seconds to respond

function setupHeartbeat(wss: WebSocketServer) {
  const interval = scheduleRepeating(() => {
    wss.clients.forEach((ws) => {
      if (!(ws as any).isAlive) {
        console.log('Client unresponsive, terminating');
        return ws.terminate();
      }
      (ws as any).isAlive = false;
      ws.ping(); // Send ping frame
    });
  # ... (condensed) ...
      const latency = Date.now() - msg.timestamp;
      metrics.recordLatency(latency);
    }
  });
}
```

## Message Serialization

```ts
// JSON (default, human-readable)
ws.send(JSON.stringify({ type: 'message', data: { text: 'hello' } }));

// MessagePack (binary, more compact)
import { encode, decode } from '@msgpack/msgpack';
ws.send(encode({ type: 'message', data: { text: 'hello' } }));

// Protocol Buffers (binary, schema-enforced)
// Requires .proto schema definition
const Message = proto.lookupType('Message');
const buffer = Message.encode({ type: 'message', text: 'hello' }).finish();
ws.send(buffer);

// COMPARISON:
// JSON:        {"type":"message","text":"hello"}  -> ~36 bytes
// MessagePack: same structure                     -> ~26 bytes (28% smaller)
// Protobuf:    same structure                     -> ~15 bytes (58% smaller)

// RECOMMENDATION:
// Start with JSON (simplest, debuggable)
// Switch to MessagePack if bandwidth is a concern
// Use Protobuf for high-frequency, performance-critical scenarios
```

## Server-Sent Events (SSE)

```ts
// Server
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',  // Disable Nginx buffering
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  // Send periodic heartbeat to keep connection alive
  const heartbeat = scheduleRepeating(() => {
    # ... (condensed) ...
eventSource.addEventListener('message:new', (e) => {
  const message = JSON.parse(e.data);
  addMessageToUI(message);
});
// Auto-reconnects with Last-Event-ID header
```

## WebSocket Architecture Checklist

- [ ] Technology selected (WebSocket, Socket.IO, SSE) based on requirements
- [ ] Authentication implemented during connection upgrade
- [ ] Heartbeat/ping-pong configured to detect stale connections
- [ ] Reconnection strategy with exponential backoff and jitter
- [ ] Room/channel management for grouping connections
- [ ] Message format defined (JSON, MessagePack, or Protobuf)
- [ ] Redis adapter configured for horizontal scaling
- [ ] Sticky sessions enabled on load balancer
- [ ] File descriptor limits increased on servers
- [ ] Connection and message rate limiting implemented
- [ ] Error handling for malformed messages
- [ ] Graceful shutdown with close frames
- [ ] Monitoring covers connection count, message throughput, latency
- [ ] Presence tracking using Redis for cross-server accuracy

## When to Use

**Use this skill when:**
- Designing or implementing websocket engineer solutions
- Reviewing or improving existing websocket engineer approaches
- Making architectural or implementation decisions about websocket engineer
- Learning websocket engineer patterns and best practices
- Troubleshooting websocket engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Websocket Engineer Analysis

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

**Input:** "Help me implement websocket engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended websocket engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When websocket engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
