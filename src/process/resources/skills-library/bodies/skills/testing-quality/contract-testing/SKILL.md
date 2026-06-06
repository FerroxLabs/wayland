---
name: contract-testing
description: |
  Guides expert-level contract testing implementation: api-design and automation decision frameworks, production-ready patterns, and concrete templates for contract testing workflows.
  Use when the user asks about contract testing, contract testing configuration, or testing best practices for contract projects.
  Do NOT use when the user needs a different testing quality capability -- check sibling skills in the testing quality subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing api-design automation"
  category: "testing-quality"
  subcategory: "testing-quality"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Contract Testing

## When to Use

**Use this skill when:**
- A user is building or maintaining a microservices architecture and wants to verify that service-to-service API compatibility is enforced without full end-to-end integration tests
- A user asks how to implement consumer-driven contract tests using Pact, Spring Cloud Contract, or similar frameworks
- A user wants to know the difference between provider-driven and consumer-driven contracts and which model fits their architecture
- A user needs to integrate contract testing into a CI/CD pipeline and wants guidance on broker configuration, version tagging, and can-i-deploy checks
- A user is experiencing broken integrations in production caused by undocumented API changes and wants a testing strategy to prevent that
- A user wants to understand contract test anatomy -- interactions, states, matchers, verification -- and write their first contracts
- A user is migrating from integration tests to contract tests and needs help deciding what to keep, replace, or supplement
- A user is working on a multi-team, multi-repo environment and needs a shared contract compatibility workflow

**Do NOT use this skill when:**
- The user needs guidance on unit testing individual functions or classes -- use the unit testing skill instead
- The user is asking about API design or OpenAPI/JSON Schema specification authoring -- use the API design skill
- The user needs end-to-end test automation (Playwright, Cypress, Selenium) -- use the E2E testing skill
- The user is asking about load or performance testing -- use the performance testing skill
- The user is asking about service mesh or runtime traffic management (Istio, Envoy) -- that is an infrastructure concern, not a testing concern
- The user wants schema validation in production (e.g., request/response validation middleware) -- that is a runtime concern separate from contract testing
- The user is working on a monolith with no interservice API boundaries -- contract testing adds no value without service boundaries
- The user needs general REST API mocking for local development only (WireMock standalone, msw) -- use the API mocking skill

---

## Process

### 1. Identify Service Boundaries and Relationship Direction

Before writing any test code, map the interaction graph:
- Identify every consumer-provider pair where a runtime HTTP, gRPC, or messaging dependency exists
- Determine the integration style: synchronous REST, synchronous gRPC, asynchronous messaging (Kafka, RabbitMQ, SNS/SQS), or GraphQL
- Determine who owns each side of the contract -- consumer team, provider team, or a shared platform team
- Decide the contract ownership model: consumer-driven (consumer defines what they need), provider-driven (provider publishes a spec), or bi-directional (both sides independently publish OpenAPI specs and a broker reconciles them)
- Consumer-driven contracts are the industry default for internal microservices. Bi-directional contracts work best when a provider has many external consumers or when you cannot instrument the provider directly (third-party APIs)
- Draw a dependency matrix with rows as consumers and columns as providers. Every cell with a dependency becomes a contract

### 2. Select the Right Tooling for Your Stack

Match tool to stack -- do not force an ecosystem mismatch:

**Pact** (best for REST/JSON and async messaging):
- Pact JS / Pact JVM / Pact Python / Pact Go / Pact .NET are the primary implementations
- The Pact Broker (open source) or PactFlow (SaaS) stores published contracts and verification results
- Pact uses a DSL to define interactions: a request shape and an expected response, bound to a consumer state
- Matchers allow flexible verification: `like()` for type matching, `eachLike()` for arrays, `term()` for regex, `datetime()` for ISO timestamps
- Pact supports message contracts (Kafka/SQS/SNS) through the Pact Message DSL -- the consumer defines the message body it expects; the provider verifies it can produce that body

**Spring Cloud Contract** (best for JVM monorepo or Spring Boot ecosystems):
- Contracts are written in Groovy DSL, YAML, or Kotlin DSL and live in the provider repo
- The framework auto-generates WireMock stubs for consumers and JUnit/Spock tests for the provider
- Best when the provider team controls the contract -- less suited to cross-team consumer-driven workflows
- Works natively with Spring Boot Test, eliminating custom wiring

**Bi-directional contracts via PactFlow**:
- Consumer publishes an OpenAPI spec or a Pact contract; provider publishes its OpenAPI spec
- PactFlow performs automated compatibility checking (cross-contract verification) without running any tests against the provider
- Use this when the provider cannot run Pact verification (third-party, legacy, or very slow service)

**gRPC contract testing**:
- Use proto file diffing tools like `buf breaking` to catch breaking changes in Protobuf schemas
- Pact supports gRPC via the Pact protobuf plugin (pact-protobuf-plugin) for interaction-level testing
- For pure compatibility checking (no interaction semantics), `buf breaking --against` is faster and sufficient

Choose based on three factors: team language/framework, whether the consumer or provider owns the contract, and whether you need interaction-level semantics or schema-level compatibility.

### 3. Design the Contract Structure

Write contracts that are narrow, focused, and stable:

**For Pact REST contracts:**
- Each contract file represents one consumer-provider pair and contains one or more interactions
- Each interaction has: a description (human-readable), a provider state (the server-side precondition), a request (method, path, headers, body), and a response (status, headers, body)
- Use type matchers (`like`, `eachLike`) instead of exact value matchers for IDs, timestamps, and generated strings. Exact matching creates brittle contracts that break on data changes
- Match only the fields the consumer actually uses. If the consumer only reads `id` and `email` from a user object, do not include `phone`, `createdAt`, or `address` in the contract body
- Provider states must be implementable -- name them as past-tense facts: `"a user with id 42 exists"`, not `"user setup"`. The provider implements each state in a state handler
- Avoid testing business logic in contracts. A contract verifies that the provider can produce a structurally valid response the consumer can parse -- it does not test that billing logic is correct

**For Pact message contracts:**
- The consumer defines the message body shape it can handle
- Provider state maps to the event/condition that causes the message to be produced
- Use `eachLike` for repeated elements, `like` for scalar fields the consumer does not care about exactly

**Naming and versioning conventions:**
- Consumer name and provider name must be consistent across all environments. Use service registry names or Kubernetes service names
- Tag contracts with the consumer branch name and environment (`main`, `staging`, `production`) to enable can-i-deploy checks

### 4. Implement Consumer-Side Tests

The consumer test generates the contract artifact:

```javascript
// Pact JS example -- consumer side (Jest)
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
const { like, eachLike, regex } = MatchersV3;

const provider = new PactV3({
  consumer: 'order-service',
  provider: 'inventory-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'warn',
});

describe('Order Service -- Inventory Service contract', () => {
  it('returns stock level for a valid product ID', async () => {
    await provider
      .given('product with id SKU-100 exists with stock 50')
      .uponReceiving('a request for stock level of SKU-100')
      .withRequest({
        method: 'GET',
        path: '/products/SKU-100/stock',
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          productId: like('SKU-100'),
          availableStock: like(50),
          warehouseId: like('WH-NYC-01'),
        },
      })
      .executeTest(async (mockServer) => {
        const client = new InventoryClient(mockServer.url);
        const result = await client.getStock('SKU-100');
        expect(result.availableStock).toBeGreaterThanOrEqual(0);
      });
  });
});
```

Key implementation rules:
- The consumer test runs against a mock provider (Pact mock server spun up locally at a random port)
- The test must call the real consumer client code -- do not write the HTTP call inside the test itself
- After the test suite runs, Pact writes a `.json` contract file to the `pacts/` output directory
- One consumer test file per consumer-provider pair is the recommended structure
- The contract file must be published to the Pact Broker as part of CI

### 5. Implement Provider-Side Verification

The provider test reads the published contract and verifies it against the real provider:

```java
// Pact JVM example -- provider side (JUnit 5, Spring Boot)
@Provider("inventory-service")
@PactBroker(
  url = "${PACT_BROKER_URL}",
  authentication = @PactBrokerAuth(token = "${PACT_BROKER_TOKEN}"),
  consumerVersionSelectors = {
    @VersionSelector(mainBranch = true),
    @VersionSelector(deployedOrReleased = true)
  }
)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class InventoryServiceContractVerificationTest {

  @LocalServerPort
  private int port;

  @BeforeEach
  void setUp(PactVerificationContext context) {
    context.setTarget(new HttpTestTarget("localhost", port));
  }

  @TestTemplate
  @ExtendWith(PactVerificationInvocationContextProvider.class)
  void verifyPact(PactVerificationContext context) {
    context.verifyInteraction();
  }

  @State("product with id SKU-100 exists with stock 50")
  void setupProductSKU100() {
    // Seed the database or configure a mock repository
    productRepository.save(new Product("SKU-100", 50, "WH-NYC-01"));
  }

  @State("product with id SKU-999 does not exist")
  void setupMissingProduct() {
    productRepository.deleteById("SKU-999");
  }
}
```

Key implementation rules:
- Fetch contracts from the broker using `consumerVersionSelectors` -- always include `mainBranch = true` and `deployedOrReleased = true`. This ensures you verify against what is currently in production and what is about to be deployed
- Each `@State` method is responsible for setting up exactly the precondition described -- use an in-memory or test database, never a shared staging database
- After verification, publish results to the broker with `PACT_PUBLISH_VERIFICATION_RESULTS=true` and tag with the provider branch
- Provider verification must run on every PR to the provider repo

### 6. Configure the Pact Broker and Publish Pipeline

The broker is the backbone of the contract testing workflow:

**Self-hosted Pact Broker setup (Docker Compose minimum):**
```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: pact
      POSTGRES_PASSWORD: pact
      POSTGRES_DB: pact
    volumes:
      - pact-db:/var/lib/postgresql/data

  pact-broker:
    image: pact-foundation/pact-broker:2
    depends_on: [postgres]
    ports:
      - "9292:9292"
    environment:
      PACT_BROKER_DATABASE_URL: "postgres://pact:pact@postgres/pact"
      PACT_BROKER_BASIC_AUTH_USERNAME: admin
      PACT_BROKER_BASIC_AUTH_PASSWORD: changeme
      PACT_BROKER_PUBLIC_HEARTBEAT: "true"
```

**CI pipeline steps -- consumer service:**
```
1. Run consumer contract tests (generates pacts/*.json)
2. Publish contracts: pact-broker publish ./pacts --consumer-app-version=$GIT_SHA --branch=$BRANCH_NAME
3. Run can-i-deploy check: pact-broker can-i-deploy --pacticipant order-service --version $GIT_SHA --to-environment production
4. If check passes, deploy
5. After deploy: pact-broker record-deployment --pacticipant order-service --version $GIT_SHA --environment production
```

**CI pipeline steps -- provider service:**
```
1. Run provider contract verification tests (fetches contracts from broker, verifies, publishes results)
2. Run can-i-deploy check: pact-broker can-i-deploy --pacticipant inventory-service --version $GIT_SHA --to-environment production
3. If check passes, deploy
4. After deploy: pact-broker record-deployment --pacticipant inventory-service --version $GIT_SHA --environment production
```

The `record-deployment` step is critical -- it is what enables `deployedOrReleased` selectors to work correctly.

### 7. Establish Team Workflows and Maintenance Practices

Contract testing requires cross-team coordination:

- Establish a contract change protocol: if a consumer wants to add a new field requirement, they update the contract test, publish, and notify the provider team. The provider then implements the feature and verifies. This is the "consumer-driven" workflow in practice
- If a provider wants to remove or rename a field, they must first verify no consumer contracts depend on it. The `pact-broker can-i-deploy` check enforces this automatically
- Run weekly contract matrix reviews in multi-team environments -- review the broker UI to confirm all consumer-provider pairs have green verification results for all deployed versions
- Create a shared contract testing style guide covering: naming conventions for provider states, which matchers to use for which field types, how to handle optional vs required fields, and how to handle pagination
- Treat contract files as source code -- they live in the consumer repo, are version-controlled, and go through code review
- Set a target: 100% of interservice API calls covered by at least one contract interaction. Track coverage by counting consumer-provider pairs with published contracts against the total pairs in your dependency matrix

---

## Output Format

When helping a user with contract testing, structure your response around the following template. Adapt sections based on what the user actually asked -- do not output all sections if only one or two are relevant.

```
## Contract Testing Assessment

### Service Dependency Map
| Consumer         | Provider           | Protocol   | Contract Tool      | Status         |
|------------------|--------------------|------------|--------------------|----------------|
| order-service    | inventory-service  | REST/HTTP  | Pact JS            | Not started    |
| order-service    | payment-service    | REST/HTTP  | Pact JS            | In progress    |
| notification-svc | order-service      | Kafka msg  | Pact (Message DSL) | Not started    |

### Recommended Tool Selection
- **Tool:** [e.g., Pact JS v12 with Pact Broker]
- **Rationale:** [specific reasons based on stack, team, and ownership model]
- **Contract ownership model:** [consumer-driven / provider-driven / bi-directional]

### Contract Anatomy for This Pair
**Consumer:** [service name]
**Provider:** [service name]
**Interaction count:** [number]

| Interaction                        | Provider State                            | Matchers Used         |
|------------------------------------|-------------------------------------------|-----------------------|
| GET /products/:id/stock (200)      | product with id SKU-100 exists            | like(), like()        |
| GET /products/:id/stock (404)      | product with id SKU-999 does not exist    | none                  |
| GET /products?category=electronics | at least 2 electronics products exist    | eachLike()            |

### Consumer Test Skeleton
[language-appropriate Pact consumer test code]

### Provider Verification Skeleton
[language-appropriate Pact provider verification code]

### CI/CD Integration Checklist
- [ ] Consumer test generates pacts/*.json on each run
- [ ] Consumer CI publishes contract with --consumer-app-version=$GIT_SHA --branch=$BRANCH
- [ ] Provider CI fetches and verifies contracts using consumerVersionSelectors
- [ ] Provider verification results published to broker
- [ ] can-i-deploy check gating deployment for both consumer and provider
- [ ] record-deployment called after each successful deploy
- [ ] Pact Broker / PactFlow accessible to all service pipelines

### Provider State Handlers
| State Description                                    | Setup Action                                      |
|------------------------------------------------------|---------------------------------------------------|
| product with id SKU-100 exists with stock 50         | Insert product row into test DB                   |
| product with id SKU-999 does not exist               | Ensure no row with id SKU-999                     |
| inventory service is unavailable                     | Configure mock to return 503                      |

### Known Risks and Mitigations
| Risk                                      | Mitigation                                        |
|-------------------------------------------|---------------------------------------------------|
| Provider state is shared/mutable          | Use isolated test DB per verification run         |
| Consumer adds fields provider ignores     | Acceptable -- Pact only verifies consumer fields  |
| Breaking change deployed without notice   | can-i-deploy blocks deployment automatically      |
```

---

## Rules

1. **Never match exact values for IDs, timestamps, or generated strings.** Use `like()` for type matching or `term()` with a regex. Exact value matching causes contracts to break on data refresh and creates false negatives that erode trust in the test suite.

2. **Never test provider business logic in contract tests.** A contract test verifies that the provider can produce a response the consumer can parse. If you are asserting that a discount was applied correctly, you are writing an integration test disguised as a contract test. Move that assertion to the provider's own unit or integration test suite.

3. **Always implement provider state handlers using isolated, deterministic data.** Never run provider verification against a shared staging or QA database. State handlers must set up and tear down their own data. Shared mutable state causes intermittent failures that are nearly impossible to debug across teams.

4. **Always use `deployedOrReleased` and `mainBranch` consumer version selectors together.** Using only `mainBranch` means you verify against what is about to be deployed but not what is already running in production. Using only `deployedOrReleased` means you miss upcoming consumer changes. Both selectors together prevent both classes of failure.

5. **Never allow a provider change to be deployed without running can-i-deploy.** This is the core safety guarantee of contract testing. A can-i-deploy check that does not block the pipeline is decoration, not protection. Wire it as a required pipeline gate, not an informational step.

6. **Always call record-deployment after every successful deployment.** The `deployedOrReleased` selector only works if the broker knows what is in each environment. Missing a `record-deployment` call causes the broker to serve stale version selectors and can allow incompatible versions to coexist in production undetected.

7. **Match only fields the consumer actually uses.** If the consumer response parsing code does not read a field, that field must not appear in the contract body. Adding unreferenced fields makes the contract more brittle and couples the consumer to provider internals it does not depend on.

8. **Never share a Pact broker between production contract testing and experimental or local development.** Experimental contracts published to the production broker pollute the can-i-deploy calculation and can produce false failures for the deployment pipeline. Use separate broker instances or use branch-scoped publishing with clear naming conventions.

9. **Consumer version labels (branches and environments) must be consistent with the deployment pipeline's actual branch names.** If your CI publishes with `--branch=feature/add-tax` but the can-i-deploy check queries `--to-environment production` with a version selector for `main`, the check will not find the contract. Standardize branch naming between the VCS and the Pact CLI invocations.

10. **Treat a failed provider verification as a build-breaking event, equivalent to a failing unit test.** Teams that allow verification failures to accumulate without fixing them quickly develop contract debt -- a backlog of unverified interactions that no one understands. Set the verification test to fail the CI build with a non-zero exit code and require fixes before merging.

---

## Edge Cases

### Legacy Provider With No Test Harness
When the provider is a legacy service with no automated test suite, running Pact verification directly against it is impractical. Use the bi-directional contract approach: have the provider team publish an OpenAPI 3.x spec describing their current API (generate it from code with Swagger annotations or write it manually), then configure PactFlow to perform cross-contract verification between the consumer's Pact contract and the provider's OpenAPI spec. This does not require any changes to the provider codebase and still catches structural incompatibilities. The trade-off is that you lose provider state semantics -- you cannot verify that the provider behaves correctly in different states, only that the schema is compatible.

### Multiple Consumers of the Same Provider Endpoint
When five consumer services all depend on `GET /orders/{id}`, each consumer publishes a separate contract. The provider must verify all five contracts. This is correct behavior -- it means the provider cannot remove any field that any consumer depends on. The practical risk is that one consumer's contract is overly broad and blocks a legitimate provider simplification. Handle this by auditing each consumer contract: if a consumer lists fields in the contract body that it does not actually use in its parsing code, remove those fields from the contract. Run `pact-broker list-latest-pact-versions` to see all consumer-provider pairs and audit each one for over-specification.

### Asynchronous Messaging Contracts (Kafka/SQS)
Message contracts have no HTTP request/response cycle. The consumer defines the message body shape it expects to receive from a topic. The provider test must verify it can produce a message matching that shape. A common mistake is testing the Kafka producer client itself rather than the message payload. Use Pact's message DSL to define only the message body and relevant metadata (event type header). The provider test calls the internal method that creates the message object, passes the resulting object to Pact's message producer verifier, and Pact checks it against the consumer contract. Do not spin up a real Kafka broker for this test -- the Pact message verifier operates entirely in-memory.

### GraphQL APIs
GraphQL's single-endpoint, query-driven model does not map cleanly to Pact's request/response interaction model. Two pragmatic options exist. Option one: use Pact with POST body matching against specific query strings -- works but brittle since query reformatting breaks the match. Option two: use schema-level contract testing -- publish the GraphQL schema as the provider contract, and write consumer tests that validate the queries the consumer sends against the published schema using a tool like `graphql-inspector`. Schema-level checking catches field removals and type changes. For most teams, option two is the right trade-off unless interaction-level semantics are essential.

### Schema Evolution and Backwards Compatibility
When a provider wants to evolve a response (add a field, deprecate a field, change a type), the contract testing workflow governs what is safe. Adding a new optional field to the response is always safe -- no consumer contract will break because consumers only match fields they listed. Renaming a field is never safe without a migration period -- publish both old and new field names simultaneously, update consumers to use the new name (each consumer re-publishes its contract after the update), then remove the old field once `can-i-deploy` confirms no deployed consumer depends on the old name. Changing a field's type (string to integer) is a breaking change. The migration path is: add a new field with the new type, migrate consumers, deprecate and remove the old field following the same pattern as a rename.

### Pact Broker Unavailability During CI
If the Pact Broker is down during a CI run, the consumer cannot publish contracts and the provider cannot fetch them. Configure a fallback behavior explicitly rather than silently skipping verification. For consumer CI, allow the publish step to fail without blocking the build (contracts will be published on the next run), but never skip verification on the provider side. For provider CI, configure the verification step to fail the build if the broker is unreachable -- a missing verification is a safety gap. Use the Pact CLI's `--broker-base-url` health check before the verification step and gate accordingly. Consider running the Pact Broker as a high-availability service (multiple replicas behind a load balancer with a managed PostgreSQL instance) if your deployment velocity is high.

### Microservices With Shared Client Libraries
When a company maintains a shared internal SDK that wraps HTTP calls to a provider (e.g., `inventory-sdk`), consumer-side Pact tests should be written in the SDK repo, not in every consumer service repo. The SDK publishes one contract on behalf of all its consumers. The trade-off is that all consumers of the SDK are coupled to one contract -- a consumer that needs a slightly different field cannot express that need independently. If consumers have diverging needs, consider using the SDK contract as a base and having individual consumers publish additive contracts for their specific interactions.

### Contract Testing Across Organization Boundaries (External APIs)
When consuming a third-party API (payment gateway, shipping provider), you cannot run Pact provider verification against the external service. Use bi-directional contracts: write consumer Pact tests against a WireMock stub that represents your understanding of the external API. Separately, maintain a manually curated OpenAPI spec for the external API. Register both in PactFlow. The compatibility check runs against the spec, not the live API. Add a separate integration smoke test that runs against the live API in a sandbox environment once per day to detect spec drift. Do not rely solely on contract tests for third-party API compatibility.

---

## Example

**Input:** "We have two Node.js microservices -- `checkout-service` (consumer) and `pricing-service` (provider). The checkout service calls `GET /pricing/cart` with a cart payload and gets back a price breakdown. We're using Jest and want to implement Pact contract testing. We have a self-hosted Pact Broker running at `https://pact-broker.internal`. Walk me through the full implementation."

**Output:**

### Contract Testing Implementation: checkout-service → pricing-service

#### Step 1 -- Assess the Interaction

**Consumer:** `checkout-service` -- calls `GET /pricing/cart?cartId=abc123` and reads `totalAmount`, `lineItems[].unitPrice`, and `discountApplied` from the response. It does not use `taxBreakdown` or `currencyCode` even though the provider returns them.

**Provider:** `pricing-service` -- Node.js/Express service. Has Jest tests already. Can be started in test mode against an in-memory SQLite database.

**Contract ownership:** Consumer-driven (checkout team defines what they need; pricing team verifies they can supply it).

**Recommended tool:** Pact JS v12 (`@pact-foundation/pact`) with PactV3 API (supports Pact Specification v4 with enhanced matchers).

---

#### Step 2 -- Install Dependencies

```bash
# checkout-service (consumer)
npm install --save-dev @pact-foundation/pact

# pricing-service (provider)
npm install --save-dev @pact-foundation/pact
```

---

#### Step 3 -- Write the Consumer Contract Test

Create `src/__tests__/pact/pricing-service.pact.test.js` in the `checkout-service` repo:

```javascript
const path = require('path');
const { PactV3, MatchersV3 } = require('@pact-foundation/pact');
const { like, eachLike, decimal } = MatchersV3;

// Import the actual client code -- never write fetch() calls directly in the test
const PricingClient = require('../../clients/PricingClient');

const provider = new PactV3({
  consumer: 'checkout-service',
  provider: 'pricing-service',
  dir: path.resolve(__dirname, '../../../pacts'),
  logLevel: 'warn',
});

describe('checkout-service → pricing-service contract', () => {

  describe('cart pricing interactions', () => {

    it('returns a price breakdown for a valid cart with one item', async () => {
      await provider
        .given('cart with id cart-001 exists with one item at price 29.99')
        .uponReceiving('a request for pricing of cart cart-001')
        .withRequest({
          method: 'GET',
          path: '/pricing/cart',
          query: { cartId: 'cart-001' },
          headers: {
            Accept: 'application/json',
            Authorization: like('Bearer eyJhbGciOiJIUzI1NiJ9'),
          },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            cartId: like('cart-001'),
            totalAmount: like(29.99),
            discountApplied: like(0.0),
            lineItems: eachLike({
              productId: like('PROD-42'),
              quantity: like(1),
              unitPrice: like(29.99),
              lineTotal: like(29.99),
            }),
          },
        })
        .executeTest(async (mockServer) => {
          const client = new PricingClient({ baseUrl: mockServer.url });
          const result = await client.getCartPricing('cart-001', 'Bearer test-token');

          // Assert only what checkout-service actually uses
          expect(result.totalAmount).toBeGreaterThan(0);
          expect(result.discountApplied).toBeGreaterThanOrEqual(0);
          expect(result.lineItems).toHaveLength(1);
          expect(result.lineItems[0].unitPrice).toBeDefined();
        });
    });

    it('returns a 404 for a cart that does not exist', async () => {
      await provider
        .given('cart with id cart-999 does not exist')
        .uponReceiving('a request for pricing of a non-existent cart')
        .withRequest({
          method: 'GET',
          path: '/pricing/cart',
          query: { cartId: 'cart-999' },
          headers: {
            Accept: 'application/json',
            Authorization: like('Bearer eyJhbGciOiJIUzI1NiJ9'),
          },
        })
        .willRespondWith({
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: like('Cart not found'),
          },
        })
        .executeTest(async (mockServer) => {
          const client = new PricingClient({ baseUrl: mockServer.url });
          await expect(
            client.getCartPricing('cart-999', 'Bearer test-token')
          ).rejects.toThrow('Cart not found');
        });
    });

    it('returns a price breakdown with discount applied for a cart with a promo code', async () => {
      await provider
        .given('cart with id cart-002 has promo code SAVE10 applied')
        .uponReceiving('a request for pricing of cart cart-002 with promo discount')
        .withRequest({
          method: 'GET',
          path: '/pricing/cart',
          query: { cartId: 'cart-002' },
          headers: {
            Accept: 'application/json',
            Authorization: like('Bearer eyJhbGciOiJIUzI1NiJ9'),
          },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            cartId: like('cart-002'),
            totalAmount: like(44.99),
            discountApplied: like(5.00),
            lineItems: eachLike({
              productId: like('PROD-55'),
              quantity: like(2),
              unitPrice: like(24.99),
              lineTotal: like(49.98),
            }),
          },
        })
        .executeTest(async (mockServer) => {
          const client = new PricingClient({ baseUrl: mockServer.url });
          const result = await client.getCartPricing('cart-002', 'Bearer test-token');

          expect(result.discountApplied).toBeGreaterThan(0);
          expect(result.totalAmount).toBeLessThan(
            result.lineItems.reduce((sum, item) => sum + item.lineTotal, 0)
          );
        });
    });

  });
});
```

**What this test does:**
- Uses `like()` for all value fields because exact values are irrelevant to the consumer -- only types and structure matter
- Uses `eachLike()` for `lineItems` to assert the array contains at least one element matching the given shape
- Only includes `totalAmount`, `discountApplied`, and `lineItems[].unitPrice` in the response body -- `taxBreakdown` and `currencyCode` are intentionally omitted because `checkout-service` does not use them
- Calls `PricingClient` directly, which contains the real `fetch()` call and response parsing logic

---

#### Step 4 -- Publish the Contract from Consumer CI

Add to the consumer's CI pipeline (GitHub Actions example):

```yaml
# .github/workflows/ci.yml (checkout-service)
- name: Run contract tests
  run: npx jest --testPathPattern=pact

- name: Publish contracts to Pact Broker
  env:
    PACT_BROKER_BASE_URL: https://pact-broker.internal
    PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
  run: |
    npx pact-broker publish ./pacts \
      --consumer-app-version=${{ github.sha }} \
      --branch=${{ github.ref_name }}

- name: Can I deploy to production?
  env:
    PACT_BROKER_BASE_URL: https://pact-broker.internal
    PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
  run: |
    npx pact-broker can-i-deploy \
      --pacticipant checkout-service \
      --version ${{ github.sha }} \
      --to-environment production \
      --retry-while-unknown=30 \
      --retry-interval=10

- name: Deploy checkout-service
  run: ./deploy.sh production

- name: Record deployment
  env:
    PACT_BROKER_BASE_URL: https://pact-broker.internal
    PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
  run: |
    npx pact-broker record-deployment \
      --pacticipant checkout-service \
      --version ${{ github.sha }} \
      --environment production
```

---

#### Step 5 -- Write the Provider Verification Test

Create `src/__tests__/pact/consumer-contracts.verification.test.js` in the `pricing-service` repo:

```javascript
const { Verifier } = require('@pact-foundation/pact');
const { startApp, stopApp, seedDatabase, clearDatabase } = require('../helpers/testApp');

describe('pricing-service Pact provider verification', () => {
  let app;
  let port;

  beforeAll(async () => {
    ({ app, port } = await startApp({ port: 0, dbMode: 'sqlite-memory' }));
  });

  afterAll(async () => {
    await stopApp(app);
  });

  it('verifies all consumer contracts', async () => {
    const opts = {
      provider: 'pricing-service',
      providerBaseUrl: `http://localhost:${port}`,

      // Fetch contracts from broker
      pactBrokerUrl: process.env.PACT_BROKER_BASE_URL,
      pactBrokerToken: process.env.PACT_BROKER_TOKEN,
      consumerVersionSelectors: [
        { mainBranch: true },
        { deployedOrReleased: true },
      ],

      // Publish results back to broker
      publishVerificationResult: true,
      providerVersion: process.env.GIT_SHA,
      providerVersionBranch: process.env.BRANCH_NAME,

      // State handlers -- one per provider state in the consumer contracts
      stateHandlers: {
        'cart with id cart-001 exists with one item at price 29.99': async () => {
          await clearDatabase();
          await seedDatabase({
            carts: [{ id: 'cart-001', items: [{ productId: 'PROD-42', quantity: 1, unitPrice: 29.99 }] }],
          });
        },
        'cart with id cart-999 does not exist': async () => {
          await clearDatabase();
          // No seeding -- cart-999 must not exist
        },
        'cart with id cart-002 has promo code SAVE10 applied': async () => {
          await clearDatabase();
          await seedDatabase({
            carts: [{
              id: 'cart-002',
              promoCode: 'SAVE10',
              items: [{ productId: 'PROD-55', quantity: 2, unitPrice: 24.99 }],
            }],
            promoCodes: [{ code: 'SAVE10', discountPercent: 10 }],
          });
        },
      },

      // Handle the Authorization header -- extract and validate in middleware, or bypass in test mode
      requestFilter: (req, res, next) => {
        // In test mode, accept any bearer token
        req.headers['x-test-mode'] = 'true';
        next();
      },

      logLevel: 'warn',
    };

    await new Verifier(opts).verifyProvider();
  });
});
```

---

#### Step 6 -- Add Provider CI Pipeline

```yaml
# .github/workflows/ci.yml (pricing-service)
- name: Run provider contract verification
  env:
    PACT_BROKER_BASE_URL: https://pact-broker.internal
    PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
    GIT_SHA: ${{ github.sha }}
    BRANCH_NAME: ${{ github.ref_name }}
    PUBLISH_VERIFICATION_RESULTS: true
  run: npx jest --testPathPattern=consumer-contracts.verification

- name: Can I deploy pricing-service to production?
  env:
    PACT_BROKER_BASE_URL: https://pact-broker.internal
    PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
  run: |
    npx pact-broker can-i-deploy \
      --pacticipant pricing-service \
      --version ${{ github.sha }} \
      --to-environment production \
      --retry-while-unknown=30 \
      --retry-interval=10

- name: Deploy pricing-service
  run: ./deploy.sh production

- name: Record deployment
  env:
    PACT_BROKER_BASE_URL: https://pact-broker.internal
    PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
  run: |
    npx pact-broker record-deployment \
      --pacticipant pricing-service \
      --version ${{ github.sha }} \
      --environment production
```

---

#### Step 7 -- Resulting Contract File

After the consumer tests run, Pact writes `pacts/checkout-service-pricing-service.json`. A simplified excerpt:

```json
{
  "consumer": { "name": "checkout-service" },
  "provider": { "name": "pricing-service" },
  "interactions": [
    {
      "description": "a request for pricing of cart cart-001",
      "providerStates": [
        { "name": "cart with id cart-001 exists with one item at price 29.99" }
      ],
      "request": {
        "method": "GET",
        "path": "/pricing/cart",
        "query": { "cartId": ["cart-001"] },
        "headers": { "Accept": "application/json" }
      },
      "response": {
        "status": 200,
        "headers": { "Content-Type": "application/json" },
        "body": {
          "cartId": "cart-001",
          "totalAmount": 29.99,
          "discountApplied": 0.0,
          "lineItems": [
            {
              "productId": "PROD-42",
              "quantity": 1,
              "unitPrice": 29.99,
              "lineTotal": 29.99
            }
          ]
        },
        "matchingRules": {
          "body": {
            "$.cartId": { "matchers": [{ "match": "type" }] },
            "$.totalAmount": { "matchers": [{ "match": "type" }] },
            "$.discountApplied": { "matchers": [{ "match": "type" }] },
            "$.lineItems": { "matchers": [{ "match": "type", "min": 1 }] },
            "$.lineItems[*].productId": { "matchers": [{ "match": "type" }] },
            "$.lineItems[*].quantity": { "matchers": [{ "match": "type" }] },
            "$.lineItems[*].unitPrice": { "matchers": [{ "match": "type" }] },
            "$.lineItems[*].lineTotal": { "matchers": [{ "match": "type" }] }
          }
        }
      }
    }
  ],
  "metadata": {
    "pactSpecification": { "version": "4.0" }
  }
}
```

---

#### Summary: What Was Built

| Component | Location | Purpose |
|---|---|---|
| Consumer Pact tests | `checkout-service/src/__tests__/pact/` | Generate contract JSON, run against mock server |
| Contract JSON files | `checkout-service/pacts/` | Machine-readable contract artifacts, version controlled |
| Pact Broker | `https://pact-broker.internal` | Stores contracts and verification results |
| Provider verification tests | `pricing-service/src/__tests__/pact/` | Verify contracts against real provider |
| Consumer CI publish step | GitHub Actions | Publishes contract on every push |
| Provider CI verification step | GitHub Actions | Verifies all consumer contracts on every push |
| can-i-deploy gate | Both CI pipelines | Blocks deployment if compatibility is not confirmed |
| record-deployment step | Both CI pipelines | Tracks what version is in each environment |

**What this workflow prevents:** If the `pricing-service` team removes `discountApplied` from the response body, the provider verification test fails immediately on their PR. The PR is blocked. The `checkout-service` team is notified. No incompatible code reaches production. This is the core value proposition of contract testing -- compatibility guarantees that scale across teams without requiring coordinated end-to-end test environments.
