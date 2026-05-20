---
name: webhook-design
description: |
  Guides expert-level webhook design implementation: api-design and automation decision frameworks, production-ready patterns, and concrete templates for webhook design workflows.
  Use when the user asks about webhook design, webhook design configuration, or api-design best practices for webhook projects.
  Do NOT use when the user needs a different backend infrastructure capability -- check sibling skills in the backend infrastructure subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "api-design backend automation"
  category: "backend-systems"
  subcategory: "backend-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Webhook Design

## When to Use

**Use this skill when:**
- User is designing a new webhook system for event-driven integrations (e.g., payment notifications, CI/CD triggers, CRM sync, IoT event streams)
- User needs to implement webhook delivery with retry logic, signature verification, or delivery guarantees
- User asks about webhook security patterns -- HMAC signing, payload validation, replay attack prevention
- User is troubleshooting webhook reliability issues such as missed events, duplicate delivery, ordering failures, or consumer timeouts
- User wants to evolve an existing webhook API -- versioning strategy, backward compatibility, schema changes
- User is choosing between webhooks and an alternative event delivery mechanism (polling, Server-Sent Events, WebSockets, message queues) for a specific use case
- User needs to design a multi-tenant webhook system where multiple customers register their own endpoints
- User is building a webhook consumer (receiver) and needs guidance on idempotency, async processing, and fast acknowledgment patterns
- User needs operational tooling design -- dead letter queues, webhook dashboards, delivery logs, alerting on failure rates

**Do NOT use this skill when:**
- User needs general REST API design guidance -- use the api-design skill in the same subcategory
- User is asking about message queue design (RabbitMQ, Kafka, SQS) as the primary transport -- webhooks are HTTP push; if the primary concern is internal service-to-service messaging, use the event-driven-architecture skill
- User needs WebSocket design for bidirectional real-time communication -- webhooks are one-way push over HTTP
- User is asking about OAuth or general API authentication -- use the api-security skill
- User needs gRPC streaming or GraphQL subscriptions -- those are distinct real-time protocols with their own design patterns
- User is asking about CI/CD pipeline design where webhooks are just a trigger mechanism, not the system being designed
- User's event volume exceeds ~50,000 events/second sustained -- at that scale, direct webhook delivery becomes operationally untenable and an event streaming platform (Kafka, Kinesis) is the correct primary transport

---

## Process

### 1. Establish Delivery Requirements and Constraints

Before writing any code, characterize the delivery requirements precisely. These drive every major design decision.

- Determine the required delivery guarantee: **at-most-once** (fire and forget, acceptable for metrics/analytics), **at-least-once** (retry on failure, requires idempotent consumers -- correct for most business events), or **exactly-once** (requires idempotency plus deduplication at the consumer -- rarely achievable end-to-end with webhooks alone)
- Quantify expected event volume: events/second at p50 and p99, daily total, and burst multiplier. A system doing 100 events/day versus 100,000 events/day requires fundamentally different queue infrastructure
- Identify acceptable latency from event occurrence to consumer receipt: sub-second (requires persistent queue with immediate dispatch workers), under 30 seconds (standard retry loop), or best-effort minutes (simple cron-based retry is sufficient)
- Determine consumer timeout expectations: most HTTP servers default to 30 seconds; your delivery system must respect this. Target consumers that respond in under 5 seconds; anything over 30 seconds is a delivery failure by convention
- Identify whether event ordering matters within a logical entity (e.g., all events for order ID 12345 must arrive in order). True ordering requires per-entity delivery queues and is expensive -- challenge this requirement before building for it
- Clarify multi-tenancy: are all webhooks internal (your system calling a fixed set of your own services), or can external customers register arbitrary HTTPS endpoints? Multi-tenant significantly increases operational complexity

### 2. Design the Event Schema and Versioning Contract

The payload schema is the public API contract. Design it with evolution in mind from day one.

- Use a consistent **envelope structure** for every event type. Include: `id` (UUID v4 or ULID), `type` (namespaced string like `payment.completed`), `version` (schema version, e.g., `"2024-01-01"`), `created_at` (ISO 8601 UTC), `api_version` (the API version that emitted this event), `data` (event-specific payload object), and optionally `previous_attributes` for mutation events
- Namespace event types with dot notation: `{resource}.{action}` or `{resource}.{sub_resource}.{action}`. Examples: `invoice.payment.succeeded`, `user.subscription.cancelled`, `repository.push`. Avoid flat names like `payment_success` -- they do not compose
- Never remove fields from a published schema -- this is a breaking change. Add new optional fields freely. Use a `metadata` object for extensible key-value pairs consumers can ignore
- Adopt **date-based versioning** for the API version field (Stripe's model: `2023-10-16`) rather than semantic versioning. It communicates exactly when the change occurred and avoids version inflation debates
- Include both `object` (current full snapshot of the resource) and `previous_attributes` (only changed fields) for mutation events. This lets consumers avoid an API call-back to fetch current state -- critical for reducing latency and coupling
- Design `id` as a globally unique, stable identifier for the event itself -- not the resource. The same logical event must always produce the same ID for deduplication. If you generate IDs at emission time, ensure the ID is stored before dispatch so retries use the same ID
- Document the event catalog in a machine-readable format (AsyncAPI or a simple JSON Schema registry). This is the contract your consumers depend on

### 3. Design the Delivery Infrastructure

The delivery system is what separates production-grade webhooks from brittle point-to-point HTTP calls.

- **Never deliver synchronously in the request path.** When your application generates an event, write it to a durable queue (PostgreSQL table, Redis Stream, SQS, or a dedicated outbox table) and return immediately. A separate worker process handles HTTP dispatch. This decouples event generation from delivery reliability
- Use the **Transactional Outbox Pattern** for events that must be consistent with a database write: insert the event into an `outbox` table in the same transaction as the business operation. A background process polls the outbox and dispatches -- this prevents the "write succeeded but event lost" failure mode
- Implement **exponential backoff with jitter** for retries. A solid default schedule: attempt 1 immediately, then retry at 5s, 30s, 2m, 10m, 30m, 2h, 8h, 24h -- giving roughly 48 hours of retry window. Add jitter (±20% of interval) to prevent thundering herd when many endpoints fail simultaneously (e.g., during a downstream outage)
- Set a **maximum retry count** (10--15 retries is standard) and a **maximum age** (48--72 hours). Events exceeding both thresholds move to a dead letter queue, never silently dropped
- Enforce **per-endpoint concurrency limits**: deliver at most N events in parallel to a single endpoint (N=10--20 is a reasonable default). This prevents overwhelming slow consumers and respects their capacity
- Implement **circuit breaker per endpoint**: if an endpoint returns 5xx or times out on more than 50% of attempts in a 5-minute window, pause delivery for that endpoint for 15--30 minutes. This prevents hammering an endpoint that is known to be down
- Use HTTP/1.1 with `Connection: keep-alive` for delivery workers that hit the same endpoint repeatedly -- TLS handshake overhead is significant at volume. Consider HTTP/2 for high-throughput delivery to the same host

### 4. Implement Security: Signing and Verification

Security is non-negotiable for production webhooks. Every payload must be signed.

- Use **HMAC-SHA256** as the standard signing algorithm. Generate a unique 32-byte (256-bit) cryptographically random secret per endpoint registration. Never share secrets across endpoints or tenants
- Compute the signature over the **raw request body bytes** (not a parsed/re-serialized version). Signature format: `HMAC-SHA256(secret, timestamp + "." + raw_body)`. Include the timestamp in the signed content to enable replay attack prevention
- Include both the timestamp and signature in a custom header. Common conventions: `X-Webhook-Signature: t=1699999999,v1=abc123def456` (Stripe's format) or separate `X-Webhook-Timestamp` and `X-Webhook-Signature` headers. The `v1=` prefix allows adding future signature algorithms without breaking existing consumers
- **Replay attack prevention**: include `X-Webhook-Timestamp` in the request. Consumers must reject events where the timestamp is more than 5 minutes old. This window balances replay protection against clock skew tolerance
- Consumers must compare signatures using **constant-time comparison** (`hmac.compare_digest` in Python, `crypto.timingSafeEqual` in Node.js, `hash_equals` in PHP). String equality (`==`) is vulnerable to timing attacks that reveal signature bytes
- Provide consumers with clear verification code samples in 3--4 common languages in your documentation. Verification is where most consumer implementation errors occur -- reduce friction
- For multi-tenant systems, rotate secrets on a schedule or on demand without requiring endpoint re-registration. Support a **dual-secret grace period** during rotation: accept signatures from either the old or new secret for a 24-hour overlap window
- Require HTTPS for all consumer endpoints. Reject registration of plaintext `http://` URLs except for localhost/development endpoints (which should be gated by environment). Validate that the TLS certificate is valid at registration time and periodically thereafter

### 5. Design Idempotency and Consumer Contracts

Reliable webhook consumers are as important as reliable delivery systems. Design both sides of the contract.

- **Fast acknowledgment, async processing**: the consumer must respond with HTTP 200 within the delivery timeout (target under 2 seconds, hard limit 30 seconds). The response body is ignored -- only status code matters. All actual processing happens asynchronously after the 200 is returned. Write the raw payload to a local queue or database before acknowledging
- **Idempotency by event ID**: every consumer must track processed event IDs. Before processing, check if `event.id` has already been processed. If yes, return 200 immediately without side effects. Store processed IDs for at least the retry window duration (48--72 hours) plus a safety margin. Redis with TTL or a database index on `event_id` works well
- Define the **acknowledgment contract** clearly: HTTP 200 or 201 means "received and will process" -- not "processing complete." HTTP 4xx (except 429) means the event is permanently undeliverable and should not be retried. HTTP 5xx or network errors mean "retry later." HTTP 429 means "back off" -- honor `Retry-After` if present
- Never use HTTP 200 with an error body (e.g., `{"error": "invalid payload"}`) -- this is ambiguous and breaks retry logic. Use proper HTTP status codes
- Document the consumer contract in your webhook documentation: what status codes mean, expected response time, idempotency requirements. Your consumers are building their systems around this contract

### 6. Implement Observability and Operational Tooling

Webhooks without observability are impossible to operate at production scale.

- Store a **delivery log** for every attempt: `event_id`, `endpoint_id`, `attempt_number`, `attempted_at`, `response_status`, `response_time_ms`, `response_body_snippet` (first 500 chars), `next_retry_at`, and `final_status` (pending/delivered/failed/dead_lettered). This log is essential for debugging and for building a customer-facing delivery dashboard
- Expose a **webhook delivery dashboard** to customers in multi-tenant systems: show recent events, delivery status, response codes, and a "resend" button for failed events. Stripe and GitHub both provide this -- it dramatically reduces support burden
- Track and alert on these key metrics: delivery success rate per endpoint (alert below 95%), p99 delivery latency, dead letter queue depth (alert when nonzero), retry queue depth (alert above 1,000 outstanding), circuit breaker trip count per hour
- Implement **manual resend** capability via API and admin UI: allow resending any event by ID to its original endpoint or a different endpoint. This is critical for debugging consumer issues and recovering from missed events
- Log consumer response bodies (truncated) -- they often contain error messages that explain delivery failures and are invaluable for debugging
- Set up alerting on endpoint health: if an endpoint has a circuit breaker tripped or a failure rate above 20% in the last hour, notify the endpoint owner (if multi-tenant) and your operations team

### 7. Handle Registration, Management, and Filtering

The management plane for webhooks is often more complex than the delivery engine.

- **Endpoint registration** must capture: `url` (validated HTTPS), `secret` (generated server-side, shown once at creation), `event_types` (list of subscribed event type patterns), `active` (boolean), `description`, `created_at`, `headers` (optional custom headers to include in every delivery -- useful for routing). Support wildcard subscriptions like `payment.*` for consumers that want all payment events
- Validate the endpoint URL at registration with an **HTTP ping**: send a test event with type `webhook.test` (or `ping`) and require a 200 response within 10 seconds. This catches typos and unreachable endpoints before any real events are sent
- Support **event type filtering** at the subscription level. Sending every event to every registered endpoint wastes bandwidth and consumer processing capacity. Filtering at dispatch time (before HTTP call) keeps delivery clean and cheap
- Implement **endpoint deactivation** after sustained failure: after N consecutive failures or M hours in circuit-open state, auto-deactivate the endpoint and notify the owner. Provide a re-activation path that includes a verification ping
- Provide a **test delivery endpoint** in your API: `POST /webhooks/{endpoint_id}/test` sends a synthetic event of a specified type. Essential for consumer development and debugging without needing to trigger real business events

### 8. Document and Version the Webhook API

The webhook contract is a public API. Treat it with the same rigor as REST endpoints.

- Publish a **webhook event catalog** listing every event type, its schema (JSON Schema format), example payloads, and which business actions trigger it. Keep this in sync with implementation -- consider generating it from schema definitions
- Communicate **deprecation** with at minimum 6 months notice for breaking changes. Send deprecation warnings in a `X-Webhook-Deprecation-Notice` header on affected events. Maintain old event schema versions for the deprecation period
- Use **canary delivery** when introducing new event types or schema changes: deliver the new version to a small percentage of endpoints first, monitor for errors, then roll out fully. This catches consumer bugs before they affect all customers
- Document the **ordering guarantee** explicitly: do not guarantee global ordering unless you have built for it. The standard guarantee is per-entity best-effort ordering with no global guarantee -- say this clearly so consumers do not build systems that assume more

---

## Output Format

When helping a user design or evaluate a webhook system, structure the output as follows:

```
## Webhook Design Assessment

### Delivery Requirements Summary
| Requirement | Value | Implication |
|-------------|-------|-------------|
| Delivery guarantee | at-least-once / at-most-once | Idempotency required at consumer |
| Expected volume | X events/day, Y peak/sec | Queue infrastructure sizing |
| Acceptable latency | < N seconds p99 | Worker count, queue type |
| Consumer timeout | 30 seconds | Hard limit on delivery attempt |
| Ordering requirement | Per-entity / None | Queue partitioning strategy |
| Multi-tenant | Yes / No | Secret management, isolation |

### Event Schema Template
{
  "id": "evt_01HQZ7K3M4N5P6Q7R8S9T0U1V2",       // ULID or UUID v4
  "type": "{resource}.{action}",                   // e.g., payment.completed
  "version": "2024-01-15",                         // Schema version date
  "api_version": "2024-01-15",                     // Emitting API version
  "created_at": "2024-01-15T10:30:00.000Z",        // ISO 8601 UTC
  "data": {
    // Full current snapshot of the resource
  },
  "previous_attributes": {
    // Only changed fields (for update events), null for creates/deletes
  },
  "metadata": {}                                   // Extensible key-value store
}

### Infrastructure Decision Matrix
| Component | Choice | Rationale |
|-----------|--------|-----------|
| Event queue | PostgreSQL outbox / Redis Streams / SQS | Based on existing stack + volume |
| Retry schedule | Exponential backoff with jitter | 9 attempts over 48 hours |
| Signing algorithm | HMAC-SHA256 | Industry standard, widely supported |
| Circuit breaker | Per-endpoint, 50% error rate threshold | Protects unhealthy consumers |
| Delivery concurrency | N workers per endpoint | Based on consumer capacity |

### Retry Schedule
| Attempt | Delay After Previous | Cumulative Time |
|---------|---------------------|-----------------|
| 1 | Immediate | 0s |
| 2 | 5 seconds | 5s |
| 3 | 30 seconds | 35s |
| 4 | 2 minutes | ~2m |
| 5 | 10 minutes | ~12m |
| 6 | 30 minutes | ~42m |
| 7 | 2 hours | ~2h 42m |
| 8 | 8 hours | ~10h 42m |
| 9 | 24 hours | ~34h 42m |
| Dead letter | -- | After 48h or 10 failures |

### Signature Verification Implementation
// Pseudocode -- adapt to target language
function verifySignature(secret, rawBody, timestamp, receivedSignature):
  if abs(now() - timestamp) > 300:          // 5-minute replay window
    reject("timestamp too old")
  
  expectedSig = HMAC-SHA256(secret, timestamp + "." + rawBody)
  
  if not constantTimeEqual(expectedSig, receivedSignature):
    reject("signature mismatch")
  
  return valid

### Operational Checklist
- [ ] Transactional outbox or durable queue for event persistence
- [ ] Exponential backoff retry with jitter
- [ ] Dead letter queue with alerting on nonzero depth
- [ ] HMAC-SHA256 signing with per-endpoint secrets
- [ ] Replay attack prevention (timestamp validation)
- [ ] Circuit breaker per endpoint
- [ ] Delivery log with full attempt history
- [ ] Idempotency key tracking at consumer
- [ ] Manual resend capability
- [ ] Endpoint health dashboard
- [ ] Event catalog documentation

### Recommended Architecture
{Narrative description of the recommended approach specific to user's context,
explaining queue choice, worker topology, and trade-offs for their specific
volume, latency, and team constraints}
```

---

## Rules

1. **NEVER deliver webhooks synchronously in the application request path.** Synchronous delivery means a slow or unreachable consumer blocks your application's response time and couples consumer availability to your system's availability. Always write to a durable queue first and dispatch asynchronously.

2. **NEVER use shared secrets across endpoints or tenants.** Each registered endpoint must have its own cryptographically random 32-byte secret. Shared secrets mean a compromised consumer can forge events for other consumers and make secret rotation catastrophic.

3. **ALWAYS sign with the raw request body bytes, not a re-serialized version.** JSON serialization is not deterministic across libraries and versions. Re-serializing a parsed payload can change field order or numeric formatting, causing valid payloads to fail signature verification. Capture the raw bytes at send time and sign those.

4. **NEVER silently drop events.** Every event that fails delivery after exhausting retries must go to a dead letter queue and trigger an alert. Silent drops make the system unreliable in ways that are invisible to operators until a customer reports missing data -- often hours or days later.

5. **ALWAYS use constant-time comparison for signature verification.** Standard string equality returns early on the first non-matching byte, leaking information about how many bytes of the signature are correct. This timing oracle can allow an attacker to forge signatures byte-by-byte. Use `hmac.compare_digest`, `crypto.timingSafeEqual`, or equivalent.

6. **NEVER guarantee exactly-once delivery over plain HTTP.** Network conditions mean you cannot know if a 200 response was lost in transit after processing. Design for at-least-once delivery and require consumers to implement idempotency. Claiming exactly-once semantics without acknowledgment infrastructure misleads consumers into building brittle systems.

7. **ALWAYS include the full resource snapshot in event payloads, not just the delta or a notification.** "Notification-style" webhooks that say "something changed, go fetch it" require consumers to make an API call for every event, creating N+1 latency, coupling consumer processing to your API availability, and doubling infrastructure load during high-event periods.

8. **NEVER retry on HTTP 4xx responses (except 429).** A 400, 401, or 404 response means the consumer has explicitly rejected the event -- retrying will never succeed and wastes resources. Only 5xx responses and network errors warrant retry. Honor 429 with the `Retry-After` header value.

9. **ALWAYS implement per-endpoint circuit breakers before deploying at scale.** Without circuit breakers, a single failing consumer endpoint can exhaust your retry queue workers, delaying delivery to all other healthy endpoints. Circuit breakers isolate unhealthy endpoints and preserve delivery capacity for the healthy ones.

10. **NEVER use sequential integer IDs for webhook event IDs.** Sequential IDs leak information about your event volume to consumers (an attacker can compute your throughput by comparing IDs over time). Use UUID v4 or ULID. ULID has the advantage of being lexicographically sortable by time, which simplifies delivery log queries without exposing monotonic counters.

11. **ALWAYS document the ordering guarantee -- or lack thereof -- explicitly.** Most webhook systems provide no global ordering guarantee. If you do not document this, consumers will build systems that assume ordering and fail in subtle, hard-to-diagnose ways when events arrive out of order during a retry scenario.

12. **NEVER log the full webhook secret in application logs.** Logging secrets exposes them to anyone with log access and makes secret rotation mandatory after any log breach. Log the first 4 characters followed by `****` (e.g., `sk_ab****`) for correlation purposes if needed, nothing more.

---

## Edge Cases

### Consumer Endpoint Consistently Times Out at 25--30 Seconds
Some consumers perform synchronous database writes or third-party API calls in the webhook handler path, causing them to consistently respond near the timeout boundary. This is dangerous because network variance can push them over the limit, causing your system to treat delivered events as failures and retry them -- creating duplicate processing at the consumer.

**Handling:** Document the 5-second target response time prominently. For known slow consumers, implement an **acknowledgment-then-process** pattern: the consumer endpoint writes the raw payload to a local queue (Redis, SQS, database) and immediately returns 200. A separate worker processes from that local queue. Include this pattern with code samples in your integration documentation. If you observe a specific endpoint consistently responding in 20--30s, proactively alert the endpoint owner.

### Webhook Event Storm After Downstream Outage Recovery
If a consumer endpoint is down for 2 hours, your retry queue accumulates hundreds or thousands of pending events. When the endpoint recovers, naive delivery immediately dispatches all queued events simultaneously, potentially overwhelming the freshly recovered consumer and causing a second failure.

**Handling:** Implement **throttled recovery dispatch**: when a circuit breaker transitions from open to half-open, limit dispatch to 10% of normal concurrency for the first 5 minutes. If success rate exceeds 95% in that window, increase to 50%, then to 100% after another 5 minutes. Never dump the full accumulated queue immediately. Also implement **max burst rate per endpoint** (e.g., no more than 100 events/minute to a single endpoint) independent of circuit breaker state.

### Multi-Tenant Secret Rotation Without Breaking Active Consumers
A customer requests a secret rotation -- or rotation is required after a suspected compromise. The consumer has the old secret embedded in their code and cannot rotate instantly (their deployment pipeline takes 30--60 minutes).

**Handling:** Implement a **dual-secret grace period**: when a new secret is generated, mark the endpoint as having both `secret_v1` and `secret_v2`. For every delivery, compute both signatures and include both in the header: `X-Webhook-Signature: t=1699999999,v1=oldSigHex,v2=newSigHex`. The consumer can verify against either. After 24 hours (or an explicit "rotation complete" confirmation from the customer), invalidate the old secret. Never extend the grace period beyond 72 hours.

### Event Schema Breaking Change Required
A business requirement forces a field rename, type change, or field removal in an event payload that existing consumers depend on.

**Handling:** Never make breaking changes in-place. Instead: (1) introduce a new event type version with a date suffix (e.g., `payment.completed` becomes `payment.completed.2024-06`) -- serve both versions simultaneously, (2) add a `X-Webhook-Deprecation-Notice: payment.completed is deprecated, migrate to payment.completed.2024-06 by 2025-01-01` header on the old version, (3) provide a migration guide with a diff of the schema change, (4) maintain both versions for a minimum of 6 months, (5) suppress delivery of the deprecated version only after confirming the endpoint has successfully received the new version. If your volume is high enough, offer consumers a "schema migration dry run" endpoint that shows them what their events will look like under the new schema.

### Webhook Replay Attacks via Captured Requests
An attacker intercepts a valid webhook delivery (e.g., via a compromised network segment or a confused consumer that logs raw requests to an accessible location) and replays the identical request to the consumer endpoint.

**Handling:** The timestamp-in-signature approach (described in step 4) limits the replay window to 5 minutes. Enforce this rigorously at the consumer. Additionally, consumer-side idempotency (checking `event.id` against a processed-IDs store with a 48--72 hour TTL) provides a second layer: even a request replayed within the 5-minute window that somehow passes timestamp validation will be caught by the idempotency check. Document both layers as required in your consumer integration guide, not optional.

### Fan-Out to Large Numbers of Registered Endpoints for a Single Event Type
A popular event type (e.g., `payment.completed`) has 5,000 registered endpoints across all tenants. A single high-volume event source generates 500 events/minute, resulting in 2.5 million delivery attempts/minute for that event type alone.

**Handling:** Fan-out must be parallelized at the infrastructure level, not a sequential loop. Publish the event once to a topic queue, then use a fan-out worker pool that reads from the topic and enqueues a per-endpoint delivery task for each registered endpoint -- do not deliver directly from the fan-out worker. Use separate worker pools for fan-out and for actual delivery. This means a burst of 500 events does not block delivery of earlier events while fan-out is computed. For the very highest volumes (>1M deliveries/minute), consider a two-tier architecture: aggregate fan-out decisions in a batch job that runs every 1--5 seconds and writes bulk delivery tasks.

### Consumer Returns 200 But Logs Show It Did Not Process the Event
This happens when consumers swallow exceptions and always return 200 to avoid retries, even when processing failed internally. This is a consumer implementation bug, but it is common enough to design for.

**Handling:** You cannot detect this from the delivery side -- a 200 is a 200. Address it through: (1) documentation that explicitly warns against swallowing errors -- consumers should return 5xx if processing fails so delivery is retried, (2) providing a **manual resend API** (`POST /webhooks/events/{event_id}/resend`) that the consumer can trigger after they fix their processing bug, (3) suggesting consumers implement a **consumer-side dead letter queue** for events that fail local processing after acknowledgment. The resend API is essential here -- it is the recovery mechanism when the consumer acknowledges correctly but fails to process.

---

## Example

**Input:** "We're building a SaaS payment platform. When a payment is processed, we need to notify our merchant customers' systems. We have about 200 merchants, expect up to 5,000 payment events per day, and some merchants are on legacy PHP systems that can take up to 20 seconds to respond. We're using PostgreSQL and Node.js. What webhook system design do you recommend?"

**Output:**

## Webhook Design Assessment

### Delivery Requirements Summary
| Requirement | Value | Implication |
|-------------|-------|-------------|
| Delivery guarantee | at-least-once | Idempotency required at merchant consumer |
| Expected volume | 5,000 events/day (~3.5/min average, ~50/min peak) | Single PostgreSQL-backed queue is sufficient |
| Acceptable latency | Under 5 minutes p99 for normal delivery | Standard retry schedule, no real-time constraint |
| Consumer timeout | 30 seconds (with 20s observed for slow consumers) | Publish consumer async-processing pattern prominently |
| Ordering requirement | Per-payment best-effort, no global ordering | Standard queue, no partitioning needed |
| Multi-tenant | Yes -- 200 merchant endpoints | Per-merchant secrets, isolation, circuit breakers |

At 5,000 events/day and 200 merchants, this is well within what a PostgreSQL-backed outbox table and a small Node.js worker pool can handle without specialized queue infrastructure. You do not need Redis Streams or SQS at this scale -- PostgreSQL is the right choice given your existing stack.

---

### Event Schema

Every payment event must use this envelope:

```json
{
  "id": "evt_01HQZ7K3M4N5P6Q7R8S9T0U1V2",
  "type": "payment.completed",
  "version": "2024-01-15",
  "api_version": "2024-01-15",
  "created_at": "2024-01-15T10:30:00.123Z",
  "data": {
    "payment_id": "pay_9XKL2MN3",
    "merchant_id": "merch_ABC123",
    "amount": 4999,
    "currency": "USD",
    "status": "completed",
    "customer_email": "buyer@example.com",
    "metadata": {
      "order_ref": "ORD-2024-8821"
    },
    "completed_at": "2024-01-15T10:29:58.000Z"
  },
  "previous_attributes": null,
  "metadata": {}
}
```

Key decisions:
- `amount` is in the smallest currency unit (cents) -- never floats for money
- `data` contains the full payment snapshot -- merchants do not need to call back to your API
- `previous_attributes` is null for terminal-state events like `payment.completed`; it would contain `{"status": "pending"}` for a `payment.status_changed` event
- `id` is a ULID: sortable by creation time without exposing a sequential counter

Publish these event types initially: `payment.completed`, `payment.failed`, `payment.refunded`, `payment.chargeback.initiated`. Resist adding more until merchants request them -- a smaller catalog is easier to maintain.

---

### Infrastructure Design

**Transactional Outbox Table (PostgreSQL):**

```sql
CREATE TABLE webhook_outbox (
  id            TEXT PRIMARY KEY,          -- ULID of the event
  merchant_id   TEXT NOT NULL,
  endpoint_id   TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  payload       JSONB NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending, delivered, failed, dead_lettered
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_attempted_at TIMESTAMPTZ,
  last_response_status INTEGER,
  last_response_body TEXT,
  delivered_at  TIMESTAMPTZ
);

CREATE INDEX idx_outbox_next_retry ON webhook_outbox (next_retry_at)
  WHERE status = 'pending';

CREATE INDEX idx_outbox_endpoint_status ON webhook_outbox (endpoint_id, status);
```

Insert into this table within the same database transaction as recording the payment. This is the outbox pattern -- if the payment write succeeds, the event will eventually be delivered. If the transaction rolls back, no event is emitted.

**Worker process (Node.js):**

Run a background worker on a 5-second poll interval:

```javascript
async function dispatchPendingEvents() {
  // Claim a batch of due events with a row-level lock
  const events = await db.query(`
    SELECT * FROM webhook_outbox
    WHERE status = 'pending' AND next_retry_at <= NOW()
    ORDER BY next_retry_at
    LIMIT 50
    FOR UPDATE SKIP LOCKED
  `);
  
  // Process up to 10 events per endpoint concurrently, all endpoints in parallel
  await Promise.all(events.map(event => deliverEvent(event)));
}
```

`FOR UPDATE SKIP LOCKED` allows multiple worker processes to run safely without double-delivering -- this is PostgreSQL's built-in advisory lock for queue patterns.

**Delivery function with retry logic:**

```javascript
const RETRY_DELAYS_MS = [0, 5000, 30000, 120000, 600000, 1800000, 7200000, 28800000, 86400000];

async function deliverEvent(event) {
  const endpoint = await getEndpoint(event.endpoint_id);
  
  if (endpoint.circuit_open && endpoint.circuit_open_until > new Date()) {
    // Skip -- circuit is open, reschedule for after circuit-open period
    await rescheduleAfterCircuit(event, endpoint.circuit_open_until);
    return;
  }
  
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const rawBody = JSON.stringify(event.payload);
  const signature = computeHmacSha256(endpoint.secret, `${timestamp}.${rawBody}`);
  
  let responseStatus, responseBody;
  
  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-ID': event.id,
        'X-Webhook-Timestamp': timestamp,
        'X-Webhook-Signature': `t=${timestamp},v1=${signature}`,
        'User-Agent': 'YourPlatform-Webhooks/1.0'
      },
      body: rawBody,
      signal: AbortSignal.timeout(30000)  // 30-second hard timeout
    });
    
    responseStatus = response.status;
    responseBody = (await response.text()).substring(0, 500);
  } catch (networkError) {
    responseStatus = 0;  // Network error
    responseBody = networkError.message;
  }
  
  const succeeded = responseStatus >= 200 && responseStatus < 300;
  const permanentFailure = responseStatus >= 400 && responseStatus < 500 && responseStatus !== 429;
  const nextAttempt = event.attempt_count + 1;
  
  if (succeeded) {
    await markDelivered(event.id, responseStatus, responseBody);
    await recordEndpointSuccess(endpoint.id);
  } else if (permanentFailure || nextAttempt > RETRY_DELAYS_MS.length) {
    await markDeadLettered(event.id, responseStatus, responseBody);
    await alertOpsTeam(event, endpoint, responseStatus);
  } else {
    const delayMs = RETRY_DELAYS_MS[nextAttempt] * (0.8 + Math.random() * 0.4);  // ±20% jitter
    await scheduleRetry(event.id, nextAttempt, delayMs, responseStatus, responseBody);
    await recordEndpointFailure(endpoint.id, responseStatus);
  }
}
```

---

### Retry Schedule
| Attempt | Delay After Previous | Cumulative Time |
|---------|---------------------|-----------------|
| 1 | Immediate | 0s |
| 2 | ~5 seconds | ~5s |
| 3 | ~30 seconds | ~35s |
| 4 | ~2 minutes | ~2.5m |
| 5 | ~10 minutes | ~12.5m |
| 6 | ~30 minutes | ~42.5m |
| 7 | ~2 hours | ~2h 43m |
| 8 | ~8 hours | ~10h 43m |
| 9 | ~24 hours | ~34h 43m |
| Dead letter | -- | After 9 failures or >48h |

---

### HMAC Signature Verification (PHP -- for your legacy merchants)

```php
function verifyWebhookSignature(string $secret, string $rawBody, string $signatureHeader): bool {
    // Parse header: "t=1699999999,v1=abc123..."
    preg_match('/t=(\d+)/', $signatureHeader, $timestampMatch);
    preg_match('/v1=([a-f0-9]+)/', $signatureHeader, $sigMatch);
    
    if (!$timestampMatch || !$sigMatch) {
        return false;
    }
    
    $timestamp = (int) $timestampMatch[1];
    $receivedSig = $sigMatch[1];
    
    // Reject events older than 5 minutes
    if (abs(time() - $timestamp) > 300) {
        return false;  // Replay attack or clock skew beyond tolerance
    }
    
    $expectedSig = hash_hmac('sha256', $timestamp . '.' . $rawBody, $secret);
    
    // Constant-time comparison -- never use === for signature comparison
    return hash_equals($expectedSig, $receivedSig);
}

// Usage in webhook handler:
$rawBody = file_get_contents('php://input');
$signatureHeader = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';

if (!verifyWebhookSignature(WEBHOOK_SECRET, $rawBody, $signatureHeader)) {
    http_response_code(401);
    exit;
}

// Idempotency check
$event = json_decode($rawBody, true);
if (hasProcessedEvent($event['id'])) {
    http_response_code(200);  // Already processed -- acknowledge without reprocessing
    exit;
}

// Write to local processing queue BEFORE doing any real work
enqueueForProcessing($event);
markEventReceived($event['id']);

http_response_code(200);  // Respond immediately -- processing is async
```

Provide this exact code in your merchant documentation. Do not make merchants figure out PHP HMAC from scratch -- every merchant integration bug you prevent is a support ticket you avoid.

---

### Handling the 20-Second Response Time Problem

For your legacy PHP merchants, the 20-second response time is a red flag. Document and enforce this pattern in your integration guide:

```php
// CORRECT: Write to queue immediately, return 200, process asynchronously
register_shutdown_function(function() use ($event) {
    // This runs AFTER the response is sent
    processPaymentEvent($event);
});
// Or better: use a proper job queue (Beanstalkd, database-backed queue)
enqueueJob('process_payment_webhook', $event);
http_response_code(200);
exit;  // Returns 200 immediately

// WRONG: Do not do this
processPaymentEventSynchronously($event);  // 15-20 second operation
http_response_code(200);  // Too late -- our system may have already timed out
```

Set your delivery timeout to 30 seconds (the standard), not 20 seconds. The 20-second response time from legacy merchants is within the window -- they will not time out consistently. But flag any endpoint with p99 response time above 10 seconds in your monitoring and proactively contact those merchants to fix their handlers.

---

### Circuit Breaker Configuration

```sql
CREATE TABLE endpoint_health (
  endpoint_id       TEXT PRIMARY KEY,
  consecutive_failures INTEGER DEFAULT 0,
  circuit_state     TEXT DEFAULT 'closed',  -- closed, open, half-open
  circuit_open_until TIMESTAMPTZ,
  last_success_at   TIMESTAMPTZ,
  failure_rate_1h   NUMERIC(5,2) DEFAULT 0
);
```

Circuit breaker rules for your 200-merchant scale:
- Trip to **open** after 5 consecutive failures or failure rate >50% in last 30 minutes
- Hold open for **30 minutes**
- Transition to **half-open**: attempt 1 delivery; if successful, close; if failed, re-open for another 30 minutes
- When a circuit trips, send an email to the merchant's registered technical contact with the last error and a link to their webhook delivery log in your dashboard

---

### Operational Checklist
- [x] PostgreSQL outbox table with `FOR UPDATE SKIP LOCKED` worker pattern
- [x] 9-attempt exponential backoff with ±20% jitter
- [x] Dead letter queue rows with ops alerting on new entries
- [x] HMAC-SHA256 per-merchant secrets, generated server-side, shown once at creation
- [x] 5-minute timestamp replay window in signature verification
- [x] Per-endpoint circuit breaker (5 failures or >50% error rate in 30 min)
- [x] Delivery log table with full attempt history
- [x] PHP verification code sample in merchant documentation
- [x] Consumer idempotency guidance and code sample
- [x] Manual resend API: `POST /api/webhooks/events/{event_id}/resend`
- [x] Merchant webhook dashboard: delivery status, response codes, resend button
- [x] Endpoint registration ping test with synthetic `webhook.test` event
- [x] Auto-deactivation after 48h circuit-open with merchant notification

### What to Build First vs. Later

**Week 1 -- Minimum viable (ship this):**
- Outbox table + worker + HMAC signing + basic retry (5 attempts)
- Event types: `payment.completed` and `payment.failed` only
- Delivery log

**Week 2--3 -- Production hardening:**
- Full retry schedule (9 attempts)
- Circuit breakers
- Dead letter queue with alerting
- Merchant dashboard showing last 100 deliveries per endpoint

**Month 2 -- Full feature set:**
- Manual resend API
- Additional event types
- Dual-secret rotation support
- Event catalog documentation page
- Endpoint health email notifications

At 5,000 events/day across 200 merchants, this system will handle your current scale with headroom to grow 10x without architectural changes. When you reach 50,000 events/day, revisit whether the PostgreSQL outbox needs to be replaced with a dedicated queue -- at that point you will have the operational data to make that decision with real numbers rather than speculation.
