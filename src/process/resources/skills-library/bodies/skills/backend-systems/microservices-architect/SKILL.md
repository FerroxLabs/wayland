---
name: microservices-architect
description: |
  Microservices architecture expertise covering service decomposition, inter-service communication, saga pattern, API gateway, service mesh, distributed tracing, data ownership, and monolith decomposition strategies.
  Use when the user asks about microservices architect, microservices architect best practices, or needs guidance on microservices architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend api-design microservices"
  category: "backend-systems"
  subcategory: "server-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Microservices Architect

## Purpose

Design and decompose systems into well-bounded microservices that are independently deployable, scalable, and maintainable. This skill covers decomposition strategies, communication patterns, data management, and the operational tooling required for microservices at scale.

## When to Use Microservices

### Decision Framework

```
USE MICROSERVICES WHEN:
  [x] Team is large enough (>15 engineers)
  [x] Different components have different scaling needs
  [x] Independent deployment cycles are critical
  [x] Different technology stacks benefit different services
  [x] Organization structure maps to service boundaries (Conway's Law)
  [x] Domain is well-understood (not early-stage exploration)

STAY WITH MONOLITH WHEN:
  [x] Small team (<10 engineers)
  [x] Domain is still being discovered
  [x] Uniform scaling needs
  [x] Limited operational maturity (no CI/CD, no monitoring)
  [x] Latency sensitivity (every network hop adds latency)
  [x] Distributed transactions are core to the business

MIDDLE GROUND: Modular Monolith
  - Monolith deployment unit
  - Well-defined module boundaries
  - Module interfaces (no cross-module database access)
  - Can extract to microservices later if needed
```

## Service Decomposition

### Bounded Context (DDD)

```
STEP 1: Identify bounded contexts from the domain
  Use Event Storming or Domain Modeling sessions.

  E-Commerce Domain:
    [Identity]     - Users, authentication, roles
    [Catalog]      - Products, categories, search
    [Ordering]     - Orders, checkout, cart
    [Payment]      - Transactions, refunds, billing
    [Inventory]    - Stock levels, warehouses
    [Shipping]     - Tracking, carriers, labels
    [Notification] - Email, SMS, push
    [Analytics]    - Events, reports, dashboards

STEP 2: Define the context map
  Which contexts interact, and how?

  [Ordering] --calls--> [Payment]     (synchronous)
  [Payment]  --emits--> [Ordering]    (payment.completed event)
  [Ordering] --emits--> [Inventory]   (order.placed event)
  [Ordering] --emits--> [Notification] (order.confirmed event)
  [Ordering] --emits--> [Shipping]    (order.ready-to-ship event)

STEP 3: Each bounded context becomes a service (or module)
  Some contexts may be combined if too small or tightly coupled.
```

### Decomposition Heuristics

```
DECOMPOSE BY:
  1. Business capability (Catalog, Ordering, Payment)
  2. Subdomain (core, supporting, generic)
  3. Data ownership (each service owns its data)
  4. Team structure (one team, one or few services)
  5. Change frequency (isolate frequently changing parts)
  6. Scaling requirements (isolate high-load components)

DO NOT DECOMPOSE BY:
  - Technical layer (frontend service, backend service, DB service)
  - CRUD operations (user-read-service, user-write-service)
  - Individual entities (one service per database table)

SIZE HEURISTIC:
  A service should be:
  - Owned by one team (2-pizza team, 5-8 people)
  - Deployable in under 15 minutes
  - Understandable by a new team member in 2 weeks
  - Rewritable in 2-4 weeks if needed
```

## Inter-Service Communication

### Synchronous (Request-Response)

```
HTTP/REST:
  + Simple, well-understood, debuggable
  + Works with any language
  - Tight coupling (caller blocks until response)
  - Cascading failures possible
  - Must handle timeouts and retries

gRPC:
  + Strongly typed contracts (Protobuf)
  + Efficient binary serialization
  + Streaming support
  + Auto-generated client libraries
  - More complex setup than REST
  - Binary format harder to debug
  - Browser support requires gRPC-Web

USE SYNC WHEN:
  - Response needed immediately for next step
  - Simple request-response pattern
  - Low latency required
  - Query/read operations
```

### Asynchronous (Event-Driven)

```
EVENTS (publish-subscribe):
  + Loose coupling (producer doesn't know consumers)
  + Temporal decoupling (consumer processes when ready)
  + Easy to add new consumers
  + Natural scalability
  - Eventual consistency
  - Harder to debug and trace
  - Message ordering challenges

COMMANDS (point-to-point):
  + Specific intent (do X)
  + One handler per command
  - Still couples sender to receiver semantics

USE ASYNC WHEN:
  - Response not needed immediately
  - Multiple consumers need the information
  - Long-running processing
  - Write/command operations that don't need immediate confirmation
  - Fire-and-skip notifications
```

### Communication Decision Matrix

```
PATTERN                 COUPLING    LATENCY    RELIABILITY
-----------------------------------------------------------
Sync REST               High        Low        Medium
Sync gRPC               High        Very Low   Medium
Async Events            Low         High       High
Async Commands          Medium      High       High
Request-Reply (async)   Medium      Medium     High

DEFAULT RECOMMENDATION:
  - Queries: Sync (REST or gRPC)
  - Commands that need confirmation: Sync with async fallback
  - Events: Always async
  - Cross-domain communication: Async events
```

## Saga Pattern (Distributed Transactions)

### Choreography Saga

```
Each service listens for events and emits its own events.
No central coordinator.

Order Placement Flow:
  1. Order Service:     Creates order (PENDING)
                        Emits: order.created
  2. Payment Service:   Listens for order.created
                        Processes payment
                        Emits: payment.completed (or payment.failed)
  3. Inventory Service: Listens for payment.completed
                        Reserves stock
                        Emits: inventory.reserved (or inventory.insufficient)
  4. Order Service:     Listens for inventory.reserved
                        Updates order to CONFIRMED
                        Emits: order.confirmed

Compensation (rollback):
  If inventory.insufficient:
    Payment Service listens -> refund payment -> Emits: payment.refunded
    Order Service listens   -> cancel order

PROS: No single point of failure, simple services
CONS: Hard to understand full flow, distributed debugging
```

### Orchestration Saga

```
Central orchestrator manages the saga steps.

Order Saga Orchestrator:
  Step 1: Call Payment Service -> processPayment()
    Success -> Step 2
    Failure -> Compensate: Cancel order

  Step 2: Call Inventory Service -> reserveStock()
    Success -> Step 3
    Failure -> Compensate: Refund payment, Cancel order

  Step 3: Call Shipping Service -> scheduleShipment()
    Success -> Complete saga
    Failure -> Compensate: Release stock, Refund payment, Cancel order
```

```ts
// Orchestration saga implementation
class OrderSaga {
  private steps: SagaStep[] = [];
  private compensations: SagaStep[] = [];

  async execute(orderId: string): Promise<SagaResult> {
    for (let i = 0; i < this.steps.length; i++) {
      try {
        await this.steps[i].execute(orderId);
        this.compensations.push(this.steps[i]);
      } catch (error) {
        console.error(`Saga step ${i} failed:`, error);
        await this.compensate(orderId);
        return { success: false, failedStep: i, error };
      }
    }
    return { success: true };
  }

  private async compensate(orderId: string): Promise<void> {
    // Execute compensations in reverse order
    for (const step of this.compensations.reverse()) {
      try {
        await step.compensate(orderId);
      } catch (error) {
        console.error('Compensation failed:', error);
        // Alert for manual intervention
        await alerting.critical('Saga compensation failed', { orderId, error });
      }
    }
  }
}
```

```
CHOREOGRAPHY vs ORCHESTRATION:

Choreography:
  + No single point of failure
  + Services are more autonomous
  - Hard to understand full flow
  - Difficult to add new steps

Orchestration:
  + Clear flow definition
  + Easy to add/modify steps
  + Centralized error handling
  - Orchestrator is a single point of failure
  - Risk of becoming "god service"

RECOMMENDATION:
  Simple flows (2-3 steps): Choreography
  Complex flows (4+ steps): Orchestration
```

## API Gateway

### Responsibilities

```
ROUTING:          Map external URLs to internal services
AUTHENTICATION:   Validate tokens, API keys
RATE LIMITING:    Per-user, per-API-key throttling
LOAD BALANCING:   Distribute traffic across service instances
CIRCUIT BREAKING: Stop calling failed services
CACHING:          Cache responses at gateway level
TRANSFORMATION:   Request/response manipulation
AGGREGATION:      Combine multiple service responses (BFF pattern)
MONITORING:       Request logging, metrics, tracing headers
TLS TERMINATION:  Handle HTTPS at the edge
```

### Backend for Frontend (BFF) Pattern

```
Problem: Mobile, web, and third-party clients need different data shapes.

Solution: One API gateway (or aggregation layer) per client type.

  Mobile App   -> [Mobile BFF]   -> Services
  Web App      -> [Web BFF]      -> Services
  Third-party  -> [Public API]   -> Services

Each BFF:
  - Tailored response shape for its client
  - Aggregates data from multiple services
  - Handles client-specific auth flows
  - Owned by the frontend team for that client
```

## Service Mesh

```
WHAT: Infrastructure layer that handles service-to-service communication.
HOW:  Sidecar proxy (Envoy, Linkerd-proxy) next to each service instance.

CAPABILITIES:
  - mTLS (mutual TLS) between services
  - Automatic retries with backoff
  - Circuit breaking
  - Load balancing (least connections, round-robin, etc.)
  - Traffic splitting (canary, blue-green)
  - Observability (metrics, traces, logs)
  - Rate limiting

WHEN TO USE:
  - Many services (>10) with complex communication
  - Need mTLS without changing application code
  - Need traffic management (canary deployments)
  - Polyglot environment (mesh handles cross-cutting concerns)

WHEN NOT TO USE:
  - Few services (<5) -- overhead not justified
  - Simple communication patterns
  - Team lacks Kubernetes operational expertise

TOOLS:
  Istio        -> Feature-rich, complex
  Linkerd      -> Simple, lightweight, Rust-based
  Consul Connect -> HashiCorp ecosystem
```

## Distributed Tracing

```
CONCEPT: Track a request as it flows through multiple services.
Each service adds a span to the trace.

IMPLEMENTATION:
  1. Propagate trace context headers between services
     (traceparent, tracestate -- W3C Trace Context standard)
  2. Each service creates spans for its operations
  3. Spans are sent to a collector (Jaeger, Zipkin, Tempo)
  4. Trace UI shows the full request flow with timing

HEADERS:
  traceparent: 00-<trace-id>-<span-id>-<flags>
  Example: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

```ts
// OpenTelemetry setup (language-agnostic standard)
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service');

async function processOrder(orderId: string) {
  return tracer.startActiveSpan('processOrder', async (span) => {
    try {
      span.setAttribute('order.id', orderId);

      // Child span for database query
      const order = await tracer.startActiveSpan('db.getOrder', async (dbSpan) => {
        const result = await db.orders.findById(orderId);
        dbSpan.end();
        return result;
      });

      // Child span for external service call
      await tracer.startActiveSpan('payment.process', async (paymentSpan) => {
        await paymentService.charge(order.total);
        paymentSpan.end();
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return order;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## Data Ownership

### Database per Service

```
RULE: Each service owns its data store. No service directly accesses
another service's database.

IMPLICATIONS:
  - No cross-service JOINs
  - Data duplication is acceptable (eventual consistency)
  - Services expose data through APIs or events
  - Each service can choose its own database technology

CROSS-SERVICE DATA NEEDS:
  1. API Call: Service A calls Service B's API
  2. Event Propagation: Service B emits events, Service A stores local copy
  3. CQRS: Separate read model built from events

EXAMPLE:
  Order Service needs user email for confirmation.
  Option A: Call User Service API synchronously
  Option B: Listen to user.updated events, store email locally
  Recommendation: Option B (more resilient, no runtime dependency)
```

## Breaking the Monolith

### Strangler Fig Pattern

```
STRATEGY: Gradually replace monolith functionality with microservices.

Step 1: Add API gateway/proxy in front of monolith
  All traffic -> [Gateway] -> [Monolith]

Step 2: Extract one feature to a new service
  Traffic for feature X -> [Gateway] -> [New Service X]
  Everything else       -> [Gateway] -> [Monolith]

Step 3: Repeat for each feature
  Over time, more traffic goes to new services, less to monolith.

Step 4: Decommission monolith when empty
  All traffic -> [Gateway] -> [Microservices]

KEY RULES:
  - Extract the highest-value or most-changing feature first
  - Keep monolith and service in sync during transition
  - Use feature flags to switch traffic gradually
  - Never rewrite from scratch -- extract incrementally
```

### Extraction Sequence

```
1. Identify bounded context to extract
2. Define the service interface (API contract)
3. Create the new service with its own database
4. Add data synchronization (events or dual-write)
5. Route traffic through gateway
6. Validate with shadow traffic or canary
7. Cut over fully
8. Remove extracted code from monolith
9. Clean up data synchronization
```

## Microservices Architecture Checklist

- [ ] Services decomposed by business capability (bounded contexts)
- [ ] Each service has its own database (no shared databases)
- [ ] Synchronous communication used for queries
- [ ] Asynchronous events used for cross-domain communication
- [ ] Saga pattern implemented for distributed transactions
- [ ] API gateway handles routing, auth, rate limiting
- [ ] Circuit breakers protect against cascading failures
- [ ] Distributed tracing implemented (OpenTelemetry)
- [ ] Health checks and readiness probes configured
- [ ] Service-level objectives (SLOs) defined per service
- [ ] CI/CD pipeline enables independent deployment
- [ ] Monitoring covers latency, error rate, throughput per service
- [ ] Data ownership clearly defined (no cross-service DB access)
- [ ] Schema registry manages event contract compatibility
- [ ] Runbooks documented for common operational scenarios

## Output Format

```markdown
# Microservices Architect Analysis

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

**Input:** "Help me implement microservices architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended microservices architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When microservices architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
