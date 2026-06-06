---
name: workflow-designer
description: |
  Workflow automation expertise covering n8n, Zapier, and Temporal patterns, workflow state machines, compensation and saga patterns, human-in-the-loop workflows, parallel execution, conditional branching, retry policies, workflow versioning, and monitoring strategies.
  Use when the user asks about workflow designer, workflow designer best practices, or needs guidance on workflow designer implementation.
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

# Workflow Designer

## Core Philosophy

A workflow is a sequence of steps that transforms an input into a desired outcome, potentially involving multiple systems, human decisions, and error recovery. Good workflow design separates the "what" (business logic) from the "how" (execution mechanics). Each step should be independently testable, retryable, and observable.

## Workflow Design Patterns

### Sequential Workflow

```
[Receive Order] -> [Validate] -> [Process Payment] -> [Reserve Inventory] -> [Send Confirmation]
```

### Parallel Workflow

```
[Receive Order] -> [Validate]
                      |
               +------+------+
               |              |
        [Check Fraud]   [Verify Address]
               |              |
               +------+------+
                      |
              [Process Payment]
```

### Saga Pattern (Compensating Transactions)

When a multi-step workflow fails partway through, compensation undoes completed steps.

```
Step 1: Reserve Inventory     -> Compensate: Release Inventory
Step 2: Charge Payment        -> Compensate: Refund Payment
Step 3: Create Shipment       -> Compensate: Cancel Shipment
Step 4: Send Notification     -> (no compensation needed)

If Step 3 fails:
  Compensate Step 2 (refund)
  Compensate Step 1 (release inventory)
```

## Temporal (Durable Workflow Engine)

### Workflow Definition

```typescript
// workflows/orderWorkflow.ts
import { proxyActivities, sleep, condition, defineSignal, setHandler } from '@temporalio/workflow';
import type * as activities from '../activities';

const {
    validateOrder,
    processPayment,
    reserveInventory,
    createShipment,
    sendConfirmation,
    refundPayment,
    releaseInventory,
} = proxyActivities<typeof activities>({
    startToCloseTimeout: '30s',
    retry: {
        initialInterval: '1s',
        backoffCoefficient: 2,
        maximumAttempts: 3,
        maximumInterval: '30s',
        nonRetryableErrorTypes: ['ValidationError', 'InsufficientFundsError'],
    },
});

// Signals for human-in-the-loop
const approvalSignal = defineSignal<[boolean]>('approval');

export async function orderWorkflow(order: Order): Promise<OrderResult> {
    // Step 1: Validate
    const validationResult = await validateOrder(order);
    if (!validationResult.valid) {
        return { status: 'rejected', reason: validationResult.errors };
    }

    // Step 2: Human approval for high-value orders
    if (order.total > 10000) {
        let approved: boolean | undefined;
        setHandler(approvalSignal, (isApproved) => { approved = isApproved; });

        // Wait up to 24 hours for approval
        const gotApproval = await condition(() => approved !== undefined, '24h');
        if (!gotApproval || !approved) {
            return { status: 'rejected', reason: 'Approval timeout or denied' };
        }
    }

    // Step 3: Process payment (with compensation)
    const paymentResult = await processPayment(order);

    try {
        // Step 4: Reserve inventory
        const reservation = await reserveInventory(order);

        try {
            // Step 5: Create shipment
            const shipment = await createShipment(order, reservation);

            // Step 6: Send confirmation
            await sendConfirmation(order, shipment);

            return { status: 'completed', shipmentId: shipment.id };

        } catch (shipmentError) {
            // Compensate: release inventory
            await releaseInventory(reservation.id);
            throw shipmentError;
        }
    } catch (error) {
        // Compensate: refund payment
        await refundPayment(paymentResult.transactionId);
        return { status: 'failed', reason: String(error) };
    }
}
```

### Activity Definitions

```typescript
// activities/index.ts
import { ApplicationFailure } from '@temporalio/activity';

export async function validateOrder(order: Order): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!order.items?.length) errors.push('Order must have at least one item');
    if (order.total <= 0) errors.push('Order total must be positive');
    if (!order.shippingAddress) errors.push('Shipping address is required');

    return { valid: errors.length === 0, errors };
}

export async function processPayment(order: Order): Promise<PaymentResult> {
    try {
        const result = await paymentGateway.charge({
            amount: order.total,
            currency: order.currency,
            customerId: order.customerId,
        });
        return { transactionId: result.id, status: 'charged' };
    } catch (error) {
        if (error.code === 'INSUFFICIENT_FUNDS') {
            // Non-retryable error
            throw ApplicationFailure.nonRetryable('Insufficient funds', 'InsufficientFundsError');
        }
        throw error; // Retryable
    }
}

export async function reserveInventory(order: Order): Promise<Reservation> {
    // Idempotent: use order ID as reservation key
    return await inventoryService.reserve({
        reservationId: `res-${order.id}`,
        items: order.items,
        expiresIn: '30m',
    });
}
```

### Starting and Managing Workflows

```typescript
// client.ts
import { Client, Connection } from '@temporalio/client';

const connection = await Connection.connect({ address: 'temporal-server:7233' });
const client = new Client({ connection });

// Start a workflow
const handle = await client.workflow.start(orderWorkflow, {
    taskQueue: 'order-processing',
    workflowId: `order-${orderId}`,  // Idempotency key
    args: [orderData],
    workflowExecutionTimeout: '24h',
});

// Query workflow status
const status = await handle.query('getStatus');

// Send signal (human approval)
await handle.signal(approvalSignal, true);

// Wait for result
const result = await handle.result();

// Cancel workflow
await handle.cancel();
```

## n8n (Visual Workflow Automation)

### Workflow Concepts

```json
// n8n workflow structure
{
    "name": "Customer Onboarding",
    "nodes": [
        {
            "name": "Webhook Trigger",
            "type": "n8n-nodes-base.webhook",
            "parameters": {
                "path": "new-customer",
                "method": "POST"
            }
        },
        {
            "name": "Validate Data",
            "type": "n8n-nodes-base.function",
            "parameters": {
                "functionCode": "const { name, email } = $input.all()[0].json;\nif (!name || !email) throw new Error('Missing fields');\nreturn $input.all();"
            }
        },
        {
            "name": "Create CRM Contact",
            "type": "n8n-nodes-base.hubspot",
            "parameters": {
                "operation": "create",
                "email": "={{ $json.email }}",
                "firstname": "={{ $json.name.split(' ')[0] }}",
                "lastname": "={{ $json.name.split(' ').slice(1).join(' ') }}"
            }
        },
        {
            "name": "Send Welcome Email",
            "type": "n8n-nodes-base.sendGrid",
            "parameters": {
                "to": "={{ $json.email }}",
                "templateId": "d-abc123",
                "dynamicTemplateData": "={{ JSON.stringify({name: $json.name}) }}"
            }
        },
        {
            "name": "Add to Slack Channel",
            "type": "n8n-nodes-base.slack",
            "parameters": {
                "channel": "#new-customers",
                "text": "New customer: {{ $json.name }} ({{ $json.email }})"
            }
        }
    ]
}
```

### n8n Error Handling

```json
{
    "name": "Error Handler",
    "type": "n8n-nodes-base.errorTrigger",
    "parameters": {},
    "continueOnFail": false
},
{
    "name": "Retry Node",
    "type": "n8n-nodes-base.function",
    "parameters": {
        "functionCode": "// Retry logic with backoff\nconst maxRetries = 3;\nconst attempt = $input.all()[0].json.attempt || 0;\nif (attempt < maxRetries) {\n  return [{json: {...$input.all()[0].json, attempt: attempt + 1}}];\n}\nthrow new Error('Max retries exceeded');"
    },
    "retryOnFail": true,
    "maxTries": 3,
    "waitBetweenTries": 5000
}
```

## Workflow State Machines

### State Machine Design

```typescript
// State machine for order processing
type OrderState =
    | 'created'
    | 'validated'
    | 'payment_pending'
    | 'payment_confirmed'
    | 'fulfilling'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded';

type OrderEvent =
    | { type: 'VALIDATE'; data: ValidationData }
    | { type: 'PAYMENT_RECEIVED'; transactionId: string }
    | { type: 'PAYMENT_FAILED'; reason: string }
    | { type: 'START_FULFILLMENT' }
    | { type: 'SHIP'; trackingNumber: string }
    | { type: 'DELIVER' }
    | { type: 'CANCEL'; reason: string }
    | { type: 'REFUND' };

const orderStateMachine = {
    created: {
        VALIDATE: (ctx, event) => ({
            state: event.data.valid ? 'validated' : 'cancelled',
            actions: event.data.valid ? [] : [{ type: 'NOTIFY_INVALID' }],
        }),
        CANCEL: () => ({ state: 'cancelled' }),
    },
    validated: {
        PAYMENT_RECEIVED: (ctx, event) => ({
            state: 'payment_confirmed',
            actions: [{ type: 'RECORD_PAYMENT', transactionId: event.transactionId }],
        }),
        PAYMENT_FAILED: () => ({
            state: 'cancelled',
            actions: [{ type: 'NOTIFY_PAYMENT_FAILED' }],
        }),
        CANCEL: () => ({ state: 'cancelled' }),
    },
    payment_confirmed: {
        START_FULFILLMENT: () => ({
            state: 'fulfilling',
            actions: [{ type: 'RESERVE_INVENTORY' }],
        }),
        CANCEL: () => ({
            state: 'refunded',
            actions: [{ type: 'PROCESS_REFUND' }],
        }),
    },
    fulfilling: {
        SHIP: (ctx, event) => ({
            state: 'shipped',
            actions: [{ type: 'SEND_SHIPPING_NOTIFICATION', trackingNumber: event.trackingNumber }],
        }),
        CANCEL: () => ({
            state: 'refunded',
            actions: [{ type: 'RELEASE_INVENTORY' }, { type: 'PROCESS_REFUND' }],
        }),
    },
    shipped: {
        DELIVER: () => ({
            state: 'delivered',
            actions: [{ type: 'SEND_DELIVERY_CONFIRMATION' }],
        }),
    },
};

function transition(currentState: OrderState, event: OrderEvent, context: any) {
    const handler = orderStateMachine[currentState]?.[event.type];
    if (!handler) {
        throw new Error(`Invalid transition: ${currentState} + ${event.type}`);
    }
    return handler(context, event);
}
```

## Human-in-the-Loop

```typescript
// Temporal: Wait for human decision with timeout
export async function approvalWorkflow(request: ApprovalRequest): Promise<string> {
    // Send notification to approver
    await sendApprovalRequest(request);

    // Wait for signal
    let decision: 'approved' | 'rejected' | undefined;
    const approveSignal = defineSignal<['approved' | 'rejected', string]>('decide');
    let comment = '';

    setHandler(approveSignal, (d, c) => {
        decision = d;
        comment = c;
    });

    // Escalation: if no response in 4 hours, notify manager
    const timer = sleep('4h').then(() => {
        if (!decision) {
            sendEscalation(request, request.managerEmail);
        }
    });

    // Wait for decision or timeout
    const responded = await condition(() => decision !== undefined, '24h');

    if (!responded) {
        return 'auto-rejected: no response within 24 hours';
    }

    await recordDecision(request.id, decision, comment);
    return `${decision}: ${comment}`;
}
```

## Retry Policies

```typescript
// Temporal retry configuration
const activities = proxyActivities({
    startToCloseTimeout: '30s',
    retry: {
        initialInterval: '1s',          // First retry after 1s
        backoffCoefficient: 2,           // Double delay each retry
        maximumInterval: '1m',           // Cap delay at 1 minute
        maximumAttempts: 5,              // Give up after 5 attempts
        nonRetryableErrorTypes: [        // Don't retry these
            'ValidationError',
            'AuthenticationError',
            'NotFoundError',
        ],
    },
});
```

## Workflow Versioning

```typescript
// Temporal: Version workflows safely
import { patched } from '@temporalio/workflow';

export async function orderWorkflow(order: Order): Promise<OrderResult> {
    await validateOrder(order);
    await processPayment(order);

    // Version gate: add new step without breaking running workflows
    if (patched('add-fraud-check')) {
        await checkFraud(order);
    }

    await reserveInventory(order);
    await createShipment(order);

    // Another version: change notification method
    if (patched('use-new-notification-system')) {
        await sendNotificationV2(order);
    } else {
        await sendConfirmation(order);
    }

    return { status: 'completed' };
}
```

## Monitoring Workflows

```
Key Metrics to Track:
1. Workflow completion rate (success vs failure)
2. Workflow duration (p50, p95, p99)
3. Activity failure rate by type
4. Retry rate (indicates flaky dependencies)
5. Human approval wait time
6. Queue depth (backlog of pending workflows)

Alerting Rules:
- Workflow failure rate > 5% -> Page on-call
- Workflow duration p95 > 2x normal -> Warning
- Queue depth growing for > 30 min -> Warning
- Human approval waiting > 4 hours -> Escalation
```

## Best Practices

1. **Make activities idempotent**: Use idempotency keys so retries are safe
2. **Design for failure**: Every step should have a compensation strategy
3. **Keep workflows deterministic**: No random values, no current time in workflow code
4. **Use signals for external events**: Human approvals, webhooks, callbacks
5. **Version workflows carefully**: Running instances must continue to work
6. **Set appropriate timeouts**: Both per-activity and per-workflow
7. **Monitor queue depth**: Growing queues indicate capacity problems
8. **Test with chaos**: Randomly fail activities to verify recovery

## When to Use

**Use this skill when:**
- Designing or implementing workflow designer solutions
- Reviewing or improving existing workflow designer approaches
- Making architectural or implementation decisions about workflow designer
- Learning workflow designer patterns and best practices
- Troubleshooting workflow designer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Workflow Designer Analysis

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

**Input:** "Help me implement workflow designer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended workflow designer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When workflow designer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
