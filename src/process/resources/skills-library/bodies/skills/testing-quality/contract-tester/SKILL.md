---
name: contract-tester
description: |
  Contract testing expertise covering the Pact framework, consumer-driven contract design, provider verification, Pact Broker setup, can-i-deploy workflow, contract versioning strategies, webhook integration for CI, API evolution testing, and GraphQL contract patterns.
  Use when the user asks about contract tester, contract tester best practices, or needs guidance on contract tester implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing best-practices api-design"
  category: "testing-quality"
  subcategory: "test-methodology"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Contract Tester

## Core Philosophy

Contract testing ensures that services can communicate with each other without running full integration tests across every service simultaneously. Instead of testing the integration directly, each side (consumer and provider) tests against a shared contract. If both sides satisfy the contract, they can communicate successfully. This enables independent deployment and testing of microservices.

## Consumer-Driven Contracts (CDC)

### The Flow

```
1. CONSUMER defines what it needs from the provider (the contract)
2. Consumer tests are run, generating a contract (Pact file)
3. Contract is shared via Pact Broker
4. PROVIDER verifies it can fulfill the contract
5. If both pass -> safe to deploy independently
```

### Why Consumer-Driven?

```
Provider-driven: "Here's my API, figure out what you need"
  Problem: Provider changes can break consumers without knowing

Consumer-driven: "Here's what I need from you"
  Benefit: Provider knows exactly what consumers depend on
  Benefit: Provider can safely change anything NOT in a contract
  Benefit: Breaking changes are caught before deployment
```

## Pact Framework

### Consumer Side (JavaScript)

```typescript
// consumer/tests/userApi.pact.test.ts
import { PactV4, MatchersV3 } from '@pact-foundation/pact';
const { like, eachLike, string, integer, iso8601DateTime } = MatchersV3;

const provider = new PactV4({
    consumer: 'OrderService',
    provider: 'UserService',
    logLevel: 'warn',
});

describe('User API Contract', () => {
    test('get user by ID', async () => {
        // Define the expected interaction
        await provider
            .addInteraction()
            .given('user 42 exists')        // Provider state
            .uponReceiving('a request for user 42')
            .withRequest('GET', '/api/users/42', (builder) => {
                builder.headers({ 'Accept': 'application/json' });
            })
            .willRespondWith(200, (builder) => {
                builder
                    .headers({ 'Content-Type': 'application/json' })
                    .jsonBody({
                        id: integer(42),
                        name: string('Alice Smith'),
                        email: string('alice@example.com'),
                        tier: string('premium'),
                        createdAt: iso8601DateTime('2025-01-15T10:30:00Z'),
                    });
            })
            .executeTest(async (mockServer) => {
                // Run your actual consumer code against the mock
                const client = new UserApiClient(mockServer.url);
                const user = await client.getUser(42);

                expect(user.id).toBe(42);
                expect(user.name).toBeDefined();
                expect(user.email).toContain('@');
            });
    });

    test('get user that does not exist', async () => {
        await provider
            .addInteraction()
            .given('user 999 does not exist')
            .uponReceiving('a request for non-existent user')
            .withRequest('GET', '/api/users/999')
            .willRespondWith(404, (builder) => {
                builder.jsonBody({
                    error: string('User not found'),
                    code: string('USER_NOT_FOUND'),
                });
            })
            .executeTest(async (mockServer) => {
                const client = new UserApiClient(mockServer.url);

                await expect(client.getUser(999)).rejects.toThrow('User not found');
            });
    });

    test('list users with pagination', async () => {
        await provider
            .addInteraction()
            .given('multiple users exist')
            .uponReceiving('a request for paginated users')
            .withRequest('GET', '/api/users', (builder) => {
                builder.query({ page: '1', per_page: '10' });
            })
            .willRespondWith(200, (builder) => {
                builder.jsonBody({
                    items: eachLike({
                        id: integer(1),
                        name: string('User Name'),
                        email: string('user@example.com'),
                    }),
                    total: integer(25),
                    page: integer(1),
                    per_page: integer(10),
                });
            })
            .executeTest(async (mockServer) => {
                const client = new UserApiClient(mockServer.url);
                const result = await client.listUsers({ page: 1, perPage: 10 });

                expect(result.items.length).toBeGreaterThan(0);
                expect(result.total).toBeGreaterThan(0);
            });
    });
});
```

### Provider Side (JavaScript)

```typescript
// provider/tests/pactVerification.test.ts
import { Verifier } from '@pact-foundation/pact';
import { app } from '../src/app';

describe('Pact Verification', () => {
    let server: any;

    beforeAll(async () => {
        server = app.listen(0);
    });

    afterAll(() => server.close());

    test('validates the expectations of OrderService', async () => {
        const port = server.address().port;

        const verifier = new Verifier({
            providerBaseUrl: `[reference URL]
            provider: 'UserService',
            pactBrokerUrl: ENV_CONFIG_VALUE,
            pactBrokerToken: ENV_CONFIG_VALUE,

            // Provider states: set up data for each interaction
            stateHandlers: {
                'user 42 exists': async () => {
                    await seedDatabase({
                        users: [{ id: 42, name: 'Alice Smith', email: 'alice@example.com', tier: 'premium' }]
                    });
                },
                'user 999 does not exist': async () => {
                    await clearDatabase();
                },
                'multiple users exist': async () => {
                    await seedDatabase({
                        users: Array.from({ length: 25 }, (_, i) => ({
                            id: i + 1,
                            name: `User ${i + 1}`,
                            email: `user${i + 1}@example.com`,
                        }))
                    });
                },
            },

            // Publish verification results
            publishVerificationResult: ENV_CONFIG_VALUE === 'true',
            providerVersion: ENV_CONFIG_VALUE,
            providerVersionBranch: ENV_CONFIG_VALUE,

            // Enable pending pacts (don't fail on new consumers)
            enablePending: true,

            // Consumer version selectors
            consumerVersionSelectors: [
                { mainBranch: true },                    // Main branch of all consumers
                { deployedOrReleased: true },            // Currently deployed consumers
                { matchingBranch: true },                // Same branch name as provider
            ],
        });

        await verifier.verifyProvider();
    });
});
```

### Provider Side (Python)

```python
# provider/tests/test_pact_verification.py
import pytest
from pact_python.verifier import Verifier

def test_provider_honors_pact_with_order_service():
    verifier = Verifier(
        provider="UserService",
        provider_base_url="[reference URL]",
    )

    output, logs = verifier.verify_pacts(
        broker_url=environment-variables["PACT_BROKER_URL"],
        broker_token=environment-variables["PACT_BROKER_TOKEN"],
        publish_version=environment-variables.get("GIT_SHA", "local"),
        publish_verification_results=environment-variables.get("CI") == "true",
        provider_states_setup_url="[reference URL]",
        consumer_version_selectors=[
            {"mainBranch": True},
            {"deployedOrReleased": True},
        ],
        enable_pending=True,
    )

    assert output == 0, f"Pact verification failed:\n{logs}"
```

## Pact Broker

### Setup with Docker

```yaml
# docker-compose.yml
version: '3'
services:
  pact-broker:
    image: pactfoundation/pact-broker:latest
    ports:
      - "9292:9292"
    environment:
      PACT_BROKER_DATABASE_URL: postgres://pact:pact@postgres/pact
      PACT_BROKER_BASIC_AUTH_USERNAME: admin
      PACT_BROKER_BASIC_AUTH_PASSWORD: admin
      PACT_BROKER_ALLOW_PUBLIC_READ: "true"
    depends_on:
      - postgres
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: pact
      POSTGRES_PASSWORD: pact
      POSTGRES_DB: pact
    volumes:
      - pact-data:/var/lib/postgresql/data

volumes:
  pact-data:
```

### Publishing Pacts

```shell
# Publish consumer pact to broker
npx pact-broker publish ./pacts \
  --consumer-app-version=$(git rev-parse HEAD) \
  --branch=$(git branch --show-current) \
  --broker-base-url=$PACT_BROKER_URL \
  --broker-token=$PACT_BROKER_TOKEN

# Tag with environment after deployment
npx pact-broker create-version-tag \
  --pacticipant=OrderService \
  --version=$(git rev-parse HEAD) \
  --tag=production
```

## Can-I-Deploy Workflow

The `can-i-deploy` command checks whether it is safe to deploy a particular version of a service.

```shell
# Check if OrderService can be deployed to production
npx pact-broker can-i-deploy \
  --pacticipant=OrderService \
  --version=$(git rev-parse HEAD) \
  --to-environment=production \
  --broker-base-url=$PACT_BROKER_URL

# Output:
# COMPUTER SAYS YES
# All required verification results are published and successful

# Or:
# COMPUTER SAYS NO
# UserService (v1.2.3) has not verified the pact published by OrderService (v2.0.0)
```

### CI Pipeline Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy Pipeline

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test  # Runs Pact consumer tests
      - name: Publish pacts
        run: |
          npx pact-broker publish ./pacts \
            --consumer-app-version=${{ github.sha }} \
            --branch=${{ github.ref_name }} \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }} \
            --broker-token=${{ secrets.PACT_BROKER_TOKEN }}

  can-i-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Check deployment safety
        run: |
          npx pact-broker can-i-deploy \
            --pacticipant=OrderService \
            --version=${{ github.sha }} \
            --to-environment=production \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }} \
            --broker-token=${{ secrets.PACT_BROKER_TOKEN }}

  deploy:
    needs: can-i-deploy
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: ./deploy.shell-cmd
      - name: Record deployment
        run: |
          npx pact-broker record-deployment \
            --pacticipant=OrderService \
            --version=${{ github.sha }} \
            --environment=production \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }}
```

## Contract Versioning

### Handling Breaking Changes

```
1. Consumer adds a new field to its expectation
   -> Provider must now return this field
   -> Provider verification will fail until updated

2. Provider wants to remove a field
   -> Check Broker: is any consumer using this field?
   -> If yes: coordinate removal (add new version, migrate consumers)
   -> If no: safe to remove

3. Provider wants to change a field type
   -> This is a breaking change
   -> Use API versioning (v1 -> v2) or additive changes
```

### Pending Pacts

```
Enable pending pacts so new consumers don't break provider CI:

1. OrderService (new consumer) publishes pact
2. UserService provider verification runs
3. Since OrderService pact is "pending" (not yet verified successfully):
   - Provider can see the new expectations
   - But failure doesn't break the provider build
4. Provider makes changes to satisfy the new pact
5. Provider verification succeeds
6. Pact is no longer "pending" - future failures WILL break the build
```

## Webhook Integration

```shell
# Configure webhook: trigger provider verification when consumer pact changes
npx pact-broker create-webhook \
  "[reference URL]" \
  --request=POST \
  --header="Authorization: Bearer ${GITHUB_TOKEN}" \
  --header="Content-Type: application/json" \
  --data='{"event_type":"pact_changed","client_payload":{"pact_url":"${pactbroker.pactUrl}"}}' \
  --consumer=OrderService \
  --provider=UserService \
  --contract-content-changed \
  --broker-base-url=$PACT_BROKER_URL
```

## API Evolution Testing

### Additive Changes (Non-Breaking)

```typescript
// Provider adds a new optional field
// Existing consumers are NOT affected (they ignore unknown fields)
// New consumers can start depending on the new field

// Original response
{ "id": 42, "name": "Alice", "email": "alice@example.com" }

// Enhanced response (non-breaking)
{ "id": 42, "name": "Alice", "email": "alice@example.com", "avatar_url": "[reference URL]" }
```

### Deprecation Workflow

```
1. Provider marks field as deprecated in documentation
2. Check Pact Broker: which consumers depend on this field?
3. Notify consumer teams
4. Consumer teams update their code and remove field from contracts
5. Once no consumer contract references the field -> safe to remove
```

## GraphQL Contracts

```typescript
// Consumer Pact for GraphQL
await provider
    .addInteraction()
    .given('user 42 exists')
    .uponReceiving('a GraphQL query for user 42')
    .withRequest('POST', '/graphql', (builder) => {
        builder
            .headers({ 'Content-Type': 'application/json' })
            .jsonBody({
                query: `query GetUser($id: ID!) {
                    user(id: $id) {
                        id
                        name
                        email
                        orders {
                            id
                            total
                        }
                    }
                }`,
                variables: { id: '42' }
            });
    })
    .willRespondWith(200, (builder) => {
        builder.jsonBody({
            data: {
                user: {
                    id: string('42'),
                    name: string('Alice Smith'),
                    email: string('alice@example.com'),
                    orders: eachLike({
                        id: string('ord_1'),
                        total: like(99.99),
                    }),
                },
            },
        });
    })
    .executeTest(async (mockServer) => {
        const client = new GraphQLClient(mockServer.url + '/graphql');
        const result = await client.getUser('42');
        expect(result.user.name).toBeDefined();
        expect(result.user.orders.length).toBeGreaterThan(0);
    });
```

## Best Practices

1. **Test consumer expectations, not full API surface**: Only include fields your consumer actually uses
2. **Use matchers, not exact values**: `like(42)` not `42` -- the shape matters, not specific values
3. **Name interactions descriptively**: "a request for user 42 when the user exists"
4. **Set up provider states properly**: Each interaction should be reproducible
5. **Run can-i-deploy before every deployment**: Make it a mandatory CI gate
6. **Use pending pacts**: Let new consumers be added without breaking provider CI
7. **Tag deployments in the broker**: Track which versions are in each environment
8. **Consumer owns the contract**: Providers serve consumers, not the other way around

## When to Use

**Use this skill when:**
- Designing or implementing contract tester solutions
- Reviewing or improving existing contract tester approaches
- Making architectural or implementation decisions about contract tester
- Learning contract tester patterns and best practices
- Troubleshooting contract tester-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Contract Tester Analysis

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

**Input:** "Help me implement contract tester for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended contract tester approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When contract tester must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
