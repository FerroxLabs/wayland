---
name: design-patterns
description: |
  Software design patterns including GoF patterns with modern implementations, when to use each pattern, anti-patterns to avoid, and language-specific idioms across creational, structural, and behavioral categories.
  Use when the user asks about design patterns, design patterns best practices, or needs guidance on design patterns implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices design-patterns guide"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Design Patterns

You are an expert in software design patterns. Apply patterns to solve recurring design problems, not to demonstrate knowledge. Every pattern introduces complexity; use one only when the problem it solves is present. Prefer the simplest solution that works.

## Pattern Selection Framework

Before applying a pattern, answer:

1. **What problem am I solving?** Name the specific design tension.
2. **Is a pattern needed?** Often, a simple function or class suffices.
3. **Which pattern fits?** Match the problem to the pattern's intent.
4. **What is the cost?** Every pattern adds indirection. Is the tradeoff worth it?

## Creational Patterns

### Factory Method

**Intent**: Define an interface for creating objects, but let subclasses decide which class to instantiate.

**Use when**: You need to create objects without specifying the exact class. Object creation logic varies by context.

```typescript
// Modern TypeScript implementation
interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string) { console.log(message); }
}

class FileLogger implements Logger {
  log(message: string) { fs.addToFileSync("app.log", message + "\n"); }
}

class CloudLogger implements Logger {
  log(message: string) { cloudService.send(message); }
}

function createLogger(env: string): Logger {
  switch (env) {
    case "development": return new ConsoleLogger();
    case "production": return new CloudLogger();
    case "test": return new FileLogger();
    default: throw new Error(`Unknown environment: ${env}`);
  }
}
```

**When NOT to use**: If there is only one type of object to create, a factory adds unnecessary indirection.

### Builder

**Intent**: Separate construction of a complex object from its representation.

**Use when**: Object has many optional parameters, multiple valid configurations, or step-by-step construction.

```python
class QueryBuilder:
    def __init__(self, table: str):
        self._table = table
        self._conditions = []
        self._order_by = None
        self._limit = None
        self._offset = None
        self._columns = ["*"]

    def select(self, *columns):
        self._columns = list(columns)
        return self

    def where(self, condition: str, value):
        self._conditions.append((condition, value))
        return self

    def order_by(self, column: str, direction: str = "ASC"):
        self._order_by = (column, direction)
        return self

    def limit(self, n: int):
        # ... (condensed) ...
# Usage
query, params = (QueryBuilder("users")
    .select("id", "name", "email")
    .where("age > ?", 18)
    .where("active = ?", True)
    .order_by("name")
    .limit(50)
    .build())
```

### Singleton

**Intent**: Ensure a class has only one instance and provide a global point of access.

**Use when**: Exactly one instance is needed (database connection pool, configuration, logger).

**Modern approach**: Use dependency injection instead. Singletons create hidden coupling and make testing difficult.

```typescript
// Prefer: dependency injection
class App {
  constructor(private db: Database, private logger: Logger) {}
}

// If you must: module-level instance (JavaScript/TypeScript)
// The module system ensures single instantiation
const db = new Database(config);
export { db };
```

**When NOT to use**: Almost always. Singletons are a code smell. Use DI containers or module-level instances instead.

### Abstract Factory

**Intent**: Create families of related objects without specifying concrete classes.

**Use when**: System needs to work with multiple families of products (e.g., UI themes, database backends, OS-specific components).

## Structural Patterns

### Adapter

**Intent**: Convert the interface of a class into another interface clients expect.

**Use when**: Integrating with a third-party library, legacy system, or any component whose interface does not match yours.

```typescript
// Third-party payment SDK with inconvenient interface
class StripeSDK {
  createCharge(amountCents: number, currency: string, token: string): Promise<StripeCharge> { ... }
}

// Your application's payment interface
interface PaymentGateway {
  charge(amount: Money, paymentMethod: PaymentMethod): Promise<PaymentResult>;
}

// Adapter
class StripeAdapter implements PaymentGateway {
  constructor(private stripe: StripeSDK) {}

  async charge(amount: Money, method: PaymentMethod): Promise<PaymentResult> {
    const result = await this.stripe.createCharge(
      amount.toCents(),
      amount.currency,
      method.token
    );
    return { id: result.id, status: result.status === "succeeded" ? "success" : "failed" };
  }
}
```

### Decorator

**Intent**: Attach additional responsibilities to an object dynamically.

**Use when**: You need to add behavior to objects without modifying their class. Useful for cross-cutting concerns.

```python
# Function decorator (Pythonic approach)
def retry(max_attempts=3, delay=1.0):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    time.sleep(delay * (2 ** attempt))
        return wrapper
    return decorator

def cache(ttl_seconds=300):
    def decorator(func):
        _cache = {}
        @functools.wraps(func)
        def wrapper(*args):
            if args in _cache and time.time() - _cache[args][1] < ttl_seconds:
                return _cache[args][0]
            result = func(*args)
            _cache[args] = (result, time.time())
            return result
        return wrapper
    return decorator

@retry(max_attempts=3)
@cache(ttl_seconds=60)
def fetch_user(user_id: str) -> User:
    return api.get(f"/users/{user_id}")
```

### Facade

**Intent**: Provide a simplified interface to a complex subsystem.

**Use when**: A subsystem has many components with complex interactions. Clients need a simpler API.

```typescript
// Complex subsystem
class VideoEncoder { encode(file: File, format: string): EncodedVideo { ... } }
class ThumbnailGenerator { generate(video: EncodedVideo): Image { ... } }
class MetadataExtractor { extract(file: File): VideoMetadata { ... } }
class CDNUploader { upload(file: File, path: string): URL { ... } }
class NotificationService { notify(userId: string, message: string): void { ... } }

// Facade
class VideoPublisher {
  constructor(
    private encoder: VideoEncoder,
    private thumbnails: ThumbnailGenerator,
    private metadata: MetadataExtractor,
    private cdn: CDNUploader,
    private notifications: NotificationService,
  ) {}

  async publish(file: File, userId: string): Promise<PublishedVideo> {
    const meta = this.metadata.extract(file);
    const encoded = this.encoder.encode(file, "h264");
    const thumbnail = this.thumbnails.generate(encoded);
    const videoUrl = await this.cdn.upload(encoded, `videos/${meta.id}`);
    const thumbUrl = await this.cdn.upload(thumbnail, `thumbs/${meta.id}`);
    this.notifications.notify(userId, "Your video is ready!");
    return { videoUrl, thumbUrl, metadata: meta };
  }
}
```

### Proxy

**Intent**: Provide a surrogate or placeholder for another object to control access.

**Use when**: Lazy loading, access control, logging, caching.

## Behavioral Patterns

### Strategy

**Intent**: Define a family of algorithms, encapsulate each one, and make them interchangeable.

**Use when**: Multiple algorithms exist for a task, and the choice is made at runtime.

```typescript
// Pricing strategies
interface PricingStrategy {
  calculate(basePrice: number, customer: Customer): number;
}

class RegularPricing implements PricingStrategy {
  calculate(basePrice: number): number { return basePrice; }
}

class PremiumPricing implements PricingStrategy {
  calculate(basePrice: number): number { return basePrice * 0.9; } // 10% off
}

class BulkPricing implements PricingStrategy {
  calculate(basePrice: number, customer: Customer): number {
    return customer.orderCount > 100 ? basePrice * 0.8 : basePrice;
  }
}

// In functional languages, strategies are just functions:
const strategies = {
  regular: (price: number) => price,
  premium: (price: number) => price * 0.9,
  bulk: (price: number, customer: Customer) => customer.orderCount > 100 ? price * 0.8 : price,
};
```

### Observer / Event Emitter

**Intent**: Define a one-to-many dependency so that when one object changes state, all dependents are notified.

**Use when**: Decoupling producers from consumers. Event-driven architectures.

```typescript
// Modern: TypeScript EventEmitter
class OrderEvents {
  private handlers = new Map<string, Set<Function>>();

  on(event: string, handler: Function): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)!.delete(handler); // unsubscribe
  }

  emit(event: string, data: unknown): void {
    this.handlers.get(event)?.forEach(handler => handler(data));
  }
}

// Usage
const events = new OrderEvents();
const unsub = events.on("order.created", (order) => sendConfirmationEmail(order));
events.on("order.created", (order) => updateInventory(order));
events.on("order.created", (order) => notifyWarehouse(order));
events.emit("order.created", order);
unsub(); // remove email listener
```

### Command

**Intent**: Encapsulate a request as an object, enabling parameterization, queuing, logging, and undo.

**Use when**: You need undo/redo, command queuing, transaction logging, or macro recording.

```python
class Command(Protocol):
    def execute(self) -> None: ...
    def undo(self) -> None: ...

class InsertTextCommand:
    def __init__(self, document, position, text):
        self.document = document
        self.position = position
        self.text = text

    def execute(self):
        self.document.insert(self.position, self.text)

    def undo(self):
        self.document.delete(self.position, len(self.text))

class CommandHistory:
    def __init__(self):
        self._history = []
        self._redo_stack = []

    def execute(self, command):
        # ... (condensed) ...
            command.undo()
            self._redo_stack.append(command)

    def redo(self):
        if self._redo_stack:
            command = self._redo_stack.pop()
            command.execute()
            self._history.append(command)
```

### Chain of Responsibility

**Intent**: Pass a request along a chain of handlers. Each handler either processes it or passes it along.

**Use when**: Multiple objects can handle a request, and the handler is determined at runtime. Middleware pipelines.

## Anti-Patterns to Avoid

### Pattern Overuse
- **Symptom**: Every class has an interface, factory, and strategy even when there is only one implementation.
- **Fix**: Apply YAGNI. Add patterns when a second use case appears, not before.

### God Object
- **Symptom**: One class that knows and does everything.
- **Fix**: Extract responsibilities into focused classes.

### Spaghetti Code
- **Symptom**: No discernible structure. Control flow jumps everywhere.
- **Fix**: Apply Extract Method, then organize into modules.

### Golden Hammer
- **Symptom**: Using the same pattern/tool for every problem.
- **Fix**: Learn multiple patterns and choose based on the problem.

### Premature Abstraction
- **Symptom**: Creating complex hierarchies before understanding the domain.
- **Fix**: Wait until you have 3+ concrete cases before abstracting. Rule of Three.

### Lava Flow
- **Symptom**: Dead code and obsolete patterns left in because nobody understands them.
- **Fix**: Delete dead code. Version control remembers.

## Pattern Selection by Problem

| Problem | Pattern |
|---------|---------|
| Need to create objects without specifying class | Factory Method |
| Object has many optional configuration options | Builder |
| Need families of related objects | Abstract Factory |
| Integrate incompatible interfaces | Adapter |
| Add behavior without modifying class | Decorator |
| Simplify complex subsystem | Facade |
| Control access to an object | Proxy |
| Choose algorithm at runtime | Strategy |
| Decouple event producers from consumers | Observer |
| Need undo/redo | Command |
| Multiple handlers for a request | Chain of Responsibility |
| Traverse a collection without exposing internals | Iterator |
| Define a skeleton algorithm with customizable steps | Template Method |
| Manage complex state transitions | State |

## Modern Alternatives

Many GoF patterns exist because of language limitations in 1994. Modern languages offer simpler alternatives:

| Pattern | Modern Alternative |
|---------|-------------------|
| Strategy | First-class functions, lambdas |
| Observer | Reactive streams (RxJS), event emitters |
| Command | Closures, first-class functions |
| Template Method | Higher-order functions |
| Iterator | Language-native iterators, generators |
| Singleton | Module-scoped instances, DI containers |
| Factory | Constructor functions, DI containers |
| Visitor | Pattern matching (Rust, Kotlin, Scala) |

Prefer the modern alternative when available in your language. Use the classic pattern when the language lacks the feature or when the pattern provides additional structure needed at scale.

## When to Use

**Use this skill when:**
- Designing or implementing design patterns solutions
- Reviewing or improving existing design patterns approaches
- Making architectural or implementation decisions about design patterns
- Learning design patterns patterns and best practices
- Troubleshooting design patterns-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Design Patterns Analysis

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

**Input:** "Help me implement design patterns for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended design patterns approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When design patterns must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
