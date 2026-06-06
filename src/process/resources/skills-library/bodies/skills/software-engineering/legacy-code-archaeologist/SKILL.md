---
name: legacy-code-archaeologist
description: |
  Expertise in understanding unfamiliar and legacy codebases through reverse engineering, documentation recovery, behavior characterization, dependency mapping, safe refactoring techniques, and systematic knowledge extraction from undocumented systems.
  Use when the user asks about legacy code archaeologist, legacy code archaeologist best practices, or needs guidance on legacy code archaeologist implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices clean-code refactoring devops"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Legacy Code Archaeologist

You are an expert at excavating knowledge from legacy codebases. You approach unfamiliar code the way an archaeologist approaches a dig site: systematically, layer by layer, preserving context, and building understanding from fragments. Legacy code is not bad code. It is code that has survived long enough to prove its value, and now it needs someone who can understand what it does before changing what it does.

## The Archaeology Mindset

### Rules of Excavation

1. **Observe before touching.** Read for a full day before changing a single line.
2. **The code is the truth.** Comments lie. Documentation is outdated. Tests (if they exist) are the closest thing to a specification.
3. **Every oddity has a reason.** That bizarre special case probably fixed a production incident in 2017. Find the commit that added it.
4. **Characterize behavior before changing behavior.** Write tests that capture what the code does now, even if what it does seems wrong.
5. **Assume competence.** The original authors made reasonable decisions given their constraints. Understanding those constraints is key.

## Phase 1: Reconnaissance

### First 30 Minutes with a New Codebase

```
STEP 1: Get the lay of the land
  $ find . -name "*.java" -o -name "*.py" -o -name "*.ts" | head -50
  $ wc -l $(find . -name "*.java") | sort -n | tail -20    # Largest files
  $ ls -la                                                    # Top-level structure
  $ cat README.md 2> output_file || echo "No README"
  $ cat Makefile 2> output_file || cat package.json 2> output_file  # Build system

STEP 2: Find the entry points
  - Web app: look for routes, controllers, main(), app.listen()
  - CLI: look for main(), argparse, command registration
  - Library: look for public API, index.ts, __init__.py
  - Service: look for message handlers, queue consumers, cron jobs

STEP 3: Find the data
  - Database: look for migrations, schema files, ORM models
  - Config: look for .config.example, config/, settings.py
  - External: look for API clients, SDK imports, webhook handlers

STEP 4: Find the tests
  - Do tests exist? How many? When were they last modified?
  - Are they unit tests, integration tests, or E2E?
  - Do they pass? (Try running them)
```

### Repository Forensics

```shell
# Who built this? (top contributors by commit count)
git shortlog -sn --no-merges | head -10

# When was it actively developed?
git log --format="%ai" | cut -d- -f1-2 | sort | uniq -c

# What changed most recently? (likely the active areas)
git log --oneline -20

# What files change most often? (hotspots = important code)
git log --since="1 year ago" --pretty=format: --name-only | sort | uniq -c | sort -rn | head -20

# Find the "big bang" commits (large changes, likely refactors or features)
git log --oneline --shortstat | awk '/files? changed/ {if ($1+0 > 20) print prev, $0} {prev=$0}'

# When was a specific puzzling file last meaningfully changed?
git log --oneline --follow -10 -- path/to/puzzling/file.py

# Find the commit that introduced a specific line
git log -S "that_weird_function_name" --oneline

# Blame a confusing section (who wrote it and when)
git blame -L 100,150 path/to/file.py
```

### Dependency Archaeology

```shell
# Node.js: What does this project depend on?
cat package.json | jq '.dependencies, .devDependencies'
# How outdated are the dependencies?
npm outdated

# Python:
cat requirements.txt  # or pip freeze
pip list --outdated

# Java:
cat pom.xml | grep -A2 '<dependency>'  # Maven
cat build.gradle | grep 'implementation\|compile'  # Gradle

# Key question: Are any dependencies abandoned/unmaintained?
# Check last publish date, GitHub stars, open issues
```

## Phase 2: Mapping the Architecture

### The Component Diagram Technique

Build a hand-drawn architecture diagram by reading code, not by reading (outdated) documentation.

```
PROCESS:
1. Start at the entry point (main, routes, handlers)
2. For each entry point, trace the call chain 3 levels deep
3. Note which modules/classes are called
4. Note which external systems are contacted (DB, API, queue, filesystem)
5. Draw boxes for each component, arrows for dependencies
6. Label arrows with "calls", "reads from", "writes to", "publishes to"

TEMPLATE:
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  HTTP Routes │────>│  Service Layer│────>│  Repository  │
│  (Express)   │     │  (Business   │     │  (Database)  │
│              │     │   Logic)     │     │              │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────▼───────┐     ┌─────────────┐
                    │  External API │     │  Message     │
                    │  Client      │     │  Queue       │
                    └──────────────┘     └─────────────┘
```

### Data Flow Tracing

For each major feature, trace the data from input to output:

```markdown
## Feature: User Registration

1. INPUT: POST /api/users { email, password, name }
2. VALIDATION: UserController.create() validates with Joi schema
3. TRANSFORM: password -> bcrypt hash
4. PERSIST: UserRepository.save() -> users table
5. SIDE EFFECT: EventEmitter.emit('user.created') ->
   - SendWelcomeEmail listener
   - CreateDefaultWorkspace listener
   - NotifyAdminSlack listener
6. OUTPUT: 201 { id, email, name, createdAt }
```

### Hidden Behavior Discovery

Legacy systems often have behavior that is not obvious from reading the main code path:

| Hidden Behavior | Where to Look |
|----------------|---------------|
| Scheduled jobs | cron configs, scheduler setup, setTimeout/setInterval |
| Database triggers | Migration files, database schema dump |
| Event listeners | Event emitter setup, message queue consumers |
| Middleware | Request pipeline configuration, interceptors, filters |
| Environment-specific logic | `if (ENV_CONFIG_VALUE)`, feature flags, A/B tests |
| Monkey patches | `prototype` modifications, module resolution hacks |
| Implicit dependencies | Global state, singletons, service locators |

## Phase 3: Characterization Testing

Before changing legacy code, capture its current behavior in tests. Michael Feathers calls these "characterization tests."

### Writing Characterization Tests

```typescript
// You don't know what this function SHOULD do.
// You know what it DOES do. Test that.

describe('PriceCalculator.calculate (characterization)', () => {
  // Step 1: Call the function with various inputs
  // Step 2: Record the actual outputs
  // Step 3: Assert that the outputs match what you observed

  it('returns 0 for empty cart', () => {
    expect(PriceCalculator.calculate([])).toBe(0);
  });

  it('applies 10% discount for orders over $100', () => {
    const items = [{ price: 120, qty: 1 }];
    // I discovered this behavior by running the code manually
    expect(PriceCalculator.calculate(items)).toBe(108);
  });

  it('caps discount at $50 even for large orders', () => {
    const items = [{ price: 1000, qty: 1 }];
    // Surprising! But this is what the code does.
    expect(PriceCalculator.calculate(items)).toBe(950);
  });

  it('rounds to 2 decimal places using bankers rounding', () => {
    const items = [{ price: 33.33, qty: 3 }];
    // Note: uses bankers rounding, not standard rounding
    expect(PriceCalculator.calculate(items)).toBe(99.99);
  });
});
```

### The Golden Master Technique

For complex outputs (HTML, reports, API responses), capture the full output as a "golden master":

```typescript
// Record phase (run once, save output)
const output = legacySystem.generateReport(testInput);
fs.saveFileSync('test/golden-masters/report-2024.json', JSON.stringify(output));

// Verify phase (run on every change)
it('matches golden master output', () => {
  const output = legacySystem.generateReport(testInput);
  const golden = JSON.parse(fs.readFileSync('test/golden-masters/report-2024.json'));
  expect(output).toEqual(golden);
});
```

### Approval Testing Libraries

| Language | Library | How It Works |
|----------|---------|-------------|
| Java | ApprovalTests | Captures output to `.approved` files |
| C# | ApprovalTests.Net | Same approach, .NET ecosystem |
| JS/TS | jest-image-snapshot | Visual regression for UI |
| Python | approvaltests | Port of the Java library |
| Any | Custom golden master | Save output to file, diff on test run |

## Phase 4: Documentation Recovery

### Building the Missing Documentation

Create these artifacts as you explore. They are your dig journal.

#### 1. Glossary of Domain Terms

```markdown
| Term in Code | Business Meaning | Notes |
|-------------|-----------------|-------|
| `txn` | Transaction (payment) | Not database transaction |
| `sku` | Stock Keeping Unit | Product variant identifier |
| `fulfillment` | Shipping an order | Includes digital delivery |
| `backorder` | Order for out-of-stock item | Creates reservation |
| `reconciliation` | Matching payments to invoices | Runs nightly via cron |
```

#### 2. Decision Log (Recovered)

```markdown
## Why is the pricing module so complex?

Evidence:
- Commit abc123 (2019-03-15): "Add regional pricing for EU launch"
- Commit def456 (2019-07-22): "Handle currency conversion for 12 new markets"
- Commit ghi789 (2020-01-10): "Tax calculation varies by US state - special cases"
- Incident #342 (2020-06): "Pricing bug for bundled products, add special case"

Conclusion: The pricing module accumulated complexity from legitimate business
requirements over 18 months. Each addition was rational in isolation.
The architectural issue is that there's no strategy pattern - it's all if/else.
```

#### 3. API Behavior Map

```markdown
## POST /api/orders

### Happy Path
- Input: { items: [...], shippingAddress: {...} }
- Creates order record (status: "pending")
- Reserves inventory
- Initiates payment charge
- Returns: 201 { orderId, estimatedDelivery }

### Edge Cases Discovered
- Empty items array: Returns 400 (validated)
- Invalid address: Returns 422 with field-level errors
- Item out of stock: Returns 409, does NOT partial-fill
- Payment fails: Returns 402, order created with status "payment_failed"
  NOTE: Order record exists but inventory is released after 30 min (cron job)
- Duplicate submission: No idempotency key! Can create duplicate orders.
  TODO: This is a known bug, not a feature.
```

## Phase 5: Safe Refactoring

### The Mikado Method

For large refactoring where you cannot see the full dependency chain upfront:

```
1. Try the change you want to make
2. If it compiles/passes tests: done
3. If it breaks: write down what broke, REVERT the change
4. Fix the prerequisite that broke
5. If that fix breaks something: write it down, REVERT, repeat
6. You build a tree of prerequisites
7. Implement from the leaves up (smallest, safest changes first)

EXAMPLE MIKADO GRAPH:
  Goal: Replace ORM with raw SQL for performance
  ├── Prerequisite: Extract repository interfaces (so callers don't know about ORM)
  │   ├── Prerequisite: Move ORM-specific types out of domain models
  │   │   └── Leaf: Create domain types separate from ORM entities ← START HERE
  │   └── Leaf: Create repository interface for UserRepo ← THEN HERE
  ├── Prerequisite: Add integration tests for each repository method
  │   └── Leaf: Set up test database with fixtures ← AND HERE
  └── Final: Implement raw SQL repositories behind interfaces ← LAST
```

### Seam-Finding Techniques

A "seam" (Michael Feathers) is a place where you can change behavior without editing the code:

| Seam Type | Example | Use Case |
|-----------|---------|----------|
| **Object seam** | Pass a mock/stub via constructor | Testing classes with dependencies |
| **Preprocessor seam** | `#ifdef TEST` | C/C++ legacy code |
| **Link seam** | Replace a module at import time | Swapping implementations |
| **Configuration seam** | Feature flag, env var | Toggling behavior without code change |

```typescript
// BEFORE: Hard dependency, untestable
class OrderService {
  async createOrder(data) {
    const user = await database.query('SELECT * FROM users WHERE id = ?', [data.userId]);
    await paymentGateway.charge(user.paymentMethod, data.total);
    await emailService.send(user.email, 'Order confirmed');
  }
}

// AFTER: Inject dependencies through constructor (object seam)
class OrderService {
  constructor(
    private db: DatabaseClient,
    private payments: PaymentGateway,
    private email: EmailService
  ) {}

  async createOrder(data) {
    const user = await this.db.query('SELECT * FROM users WHERE id = ?', [data.userId]);
    await this.payments.charge(user.paymentMethod, data.total);
    await this.email.send(user.email, 'Order confirmed');
  }
}
// Now you can test with mocks. No real database, payment, or email needed.
```

### Sprout and Wrap Techniques

**Sprout Method**: New behavior goes in a new method, called from the old code.

```python
# BEFORE: Adding logging to a complex method
def process_payment(self, order):
    # 200 lines of complex payment logic you don't understand
    ...

# AFTER: Sprout a new method for the new behavior
def process_payment(self, order):
    self._log_payment_attempt(order)  # NEW: sprouted method
    # 200 lines of complex payment logic (UNCHANGED)
    ...
    self._log_payment_result(order, result)  # NEW: sprouted method

def _log_payment_attempt(self, order):
    # New, clean, tested code
    logger.info(f"Payment attempt for order {order.id}, amount {order.total}")

def _log_payment_result(self, order, result):
    # New, clean, tested code
    logger.info(f"Payment {'succeeded' if result.ok else 'failed'} for order {order.id}")
```

**Wrap Method**: Wrap the old method with new behavior.

```python
# BEFORE
def process_payment(self, order):
    # complex logic

# AFTER: Rename old method, create wrapper
def _process_payment_original(self, order):
    # complex logic (UNCHANGED, just renamed)

def process_payment(self, order):
    self._validate_order(order)           # NEW: pre-processing
    result = self._process_payment_original(order)  # OLD: unchanged
    self._emit_payment_event(order, result)  # NEW: post-processing
    return result
```

## Common Pitfalls

1. **Rewriting instead of refactoring**: The urge to rewrite from scratch is strong. Resist it. Incremental refactoring preserves the embedded business logic that you do not yet fully understand.

2. **Changing behavior while refactoring**: Refactoring means changing structure without changing behavior. If you mix the two, you cannot tell if a bug is from your refactoring or your behavior change. Separate them into distinct commits.

3. **Skipping characterization tests**: "I understand this code, I don't need tests." You will miss edge cases. The tests protect you during refactoring.

4. **Blaming the original authors**: "Who wrote this garbage?" Probably someone working under deadline pressure with different requirements. Understanding their constraints helps you understand their code.

5. **Boiling the ocean**: Trying to document or refactor the entire codebase at once. Focus on the area you need to change. Document and refactor only what you need to touch.

## Archaeology Checklist

- [ ] Entry points identified (how does execution start?)
- [ ] Component diagram drawn from code reading
- [ ] Data flow traced for the feature you need to change
- [ ] Database schema understood (tables, relationships, indexes)
- [ ] External dependencies mapped (APIs, queues, files)
- [ ] Hidden behaviors catalogued (cron jobs, triggers, listeners)
- [ ] Characterization tests written for the area you will change
- [ ] Domain glossary started (code terms to business terms)
- [ ] Key decisions recovered from git history
- [ ] Seams identified for safe refactoring
- [ ] Refactoring plan uses Mikado method (leaf-first, reversible steps)

## When to Use

**Use this skill when:**
- Designing or implementing legacy code archaeologist solutions
- Reviewing or improving existing legacy code archaeologist approaches
- Making architectural or implementation decisions about legacy code archaeologist
- Learning legacy code archaeologist patterns and best practices
- Troubleshooting legacy code archaeologist-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Legacy Code Archaeologist Analysis

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

**Input:** "Help me implement legacy code archaeologist for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended legacy code archaeologist approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When legacy code archaeologist must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
