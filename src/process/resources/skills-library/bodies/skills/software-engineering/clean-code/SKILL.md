---
name: clean-code
description: |
  Clean code principles covering naming conventions, function design, SOLID principles, DRY vs WET tradeoffs, code organization, complexity metrics, and code review through a clean code lens.
  Use when the user asks about clean code, clean code best practices, or needs guidance on clean code implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices clean-code guide"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Clean Code

You are an expert in clean code principles. Write code that is readable, maintainable, and intentional. Clean code reads like well-written prose. Every name, function, and module should reveal its purpose without requiring comments to explain it.

## Naming Conventions

### The Rules of Good Names

1. **Names reveal intent.** A reader should understand what a variable holds, what a function does, or what a class represents without reading the implementation.

```python
# Bad
d = 7         # elapsed time in days
lst = []      # list of flagged accounts
temp = get()  # temporary result

# Good
elapsed_days = 7
flagged_accounts = []
active_user = get_authenticated_user()
```

2. **Names are pronounceable.** If you cannot say it in conversation, rename it.

```java
// Bad
Date genymdhms;  // generation date, year-month-day-hour-minute-second
int pdcnt;       // past due count

// Good
Date generationTimestamp;
int pastDueCount;
```

3. **Names are searchable.** Single-letter names and magic numbers are invisible to search.

```javascript
// Bad: searching for "7" finds thousands of results
if (days > 7) { ... }

// Good: searching for "MAX_INACTIVE_DAYS" finds exactly what you need
const MAX_INACTIVE_DAYS = 7;
if (days > MAX_INACTIVE_DAYS) { ... }
```

4. **Avoid abbreviations** unless universally understood (HTTP, URL, ID, DB).

5. **Use consistent vocabulary.** Pick one word per concept and stick with it. Do not use `get`, `get`, `get`, and `load` interchangeably in the same codebase.

### Naming by Type

| Type | Convention | Examples |
|------|-----------|---------|
| Boolean | Phrase as question | `isActive`, `hasPermission`, `canEdit`, `shouldRetry` |
| Function | Verb + noun | `calculateTotal`, `sendEmail`, `validateInput` |
| Predicate function | `is`/`has`/`can` | `isExpired()`, `hasAccess()`, `canProceed()` |
| Collection | Plural noun | `users`, `orderItems`, `activeConnections` |
| Count | `_count` or `num_` | `retryCount`, `numAttempts` |
| Class | Noun | `UserRepository`, `PaymentProcessor`, `OrderValidator` |
| Interface | Adjective or noun | `Serializable`, `Repository`, `EventHandler` |
| Constant | UPPER_SNAKE_CASE | `MAX_RETRIES`, `DEFAULT_TIMEOUT_MS` |

### Naming Anti-Patterns
- **Meaningless prefixes**: `IUserService`, `AbstractBaseFactory`. Let the language features speak.
- **Type in name**: `userList`, `nameString`. The type system handles this.
- **Noise words**: `data`, `info`, `manager`, `handler`, `processor`. These add length without meaning.
- **Negative booleans**: `isNotReady`, `disableFeature`. Use positive names: `isReady`, `featureEnabled`.

## Function Design

### Functions Should Be Small

A function should do one thing, do it completely, and do it only. Target 5-15 lines. If a function has sections (separated by blank lines or comments), each section is a candidate for extraction.

### Functions Should Have One Level of Abstraction

```python
# Bad: mixed levels of abstraction
def process_order(order):
    # High-level
    validate_order(order)

    # Suddenly low-level
    conn = psycopg2.connect(host="db", port=5432, dbname="orders")
    cursor = conn.cursor()
    cursor.execute("INSERT INTO orders (id, total) VALUES (%s, %s)", (order.id, order.total))
    conn.commit()

    # Back to high-level
    send_confirmation(order)

# Good: consistent level of abstraction
def process_order(order):
    validate_order(order)
    save_order(order)
    send_confirmation(order)
```

### Function Arguments

- **0 arguments (niladic)**: Best.
- **1 argument (monadic)**: Good. Common forms: transformation (`parse(input)`), query (`isValid(email)`), event (`onUserCreated(user)`).
- **2 arguments (dyadic)**: Acceptable. Ensure the order is intuitive (`assertEquals(expected, actual)`).
- **3 arguments (triadic)**: Should be rare. Consider introducing a parameter object.
- **4+ arguments**: Refactor. Use a configuration object or builder.

### Pure Functions

Prefer pure functions: same input always produces same output, no side effects.

```python
# Pure: predictable, testable, parallelizable
def calculate_discount(price: float, discount_percent: float) -> float:
    return price * (1 - discount_percent / 100)

# Impure: depends on external state, has side effects
def apply_discount(order):
    discount = get_global_discount()  # external dependency
    order.total -= order.total * discount  # mutation
    log(f"Applied discount to {order.id}")  # side effect
```

### Command-Query Separation

Functions should either **do something** (command) or **answer something** (query), not both.

```java
// Bad: does it check or set?
boolean set(String attribute, String value);
if (set("username", "john")) { ... }

// Good: separate command and query
boolean attributeExists(String attribute);
void setAttribute(String attribute, String value);

if (attributeExists("username")) {
    setAttribute("username", "john");
}
```

## SOLID Principles

### S - Single Responsibility Principle

A class should have one, and only one, reason to change.

```typescript
// Bad: UserService handles auth, validation, persistence, and notifications
class UserService {
  authenticate(credentials) { ... }
  validateEmail(email) { ... }
  saveToDatabase(user) { ... }
  sendWelcomeEmail(user) { ... }
}

// Good: each class has one responsibility
class AuthenticationService { authenticate(credentials) { ... } }
class UserValidator { validateEmail(email) { ... } }
class UserRepository { save(user) { ... } }
class NotificationService { sendWelcomeEmail(user) { ... } }
```

### O - Open/Closed Principle

Software entities should be open for extension, closed for modification.

```python
# Bad: adding a new shape requires modifying AreaCalculator
class AreaCalculator:
    def calculate(self, shape):
        if isinstance(shape, Circle):
            return math.pi * shape.radius ** 2
        elif isinstance(shape, Rectangle):
            return shape.width * shape.height
        # Must modify this class for every new shape

# Good: extend without modifying
class Shape(Protocol):
    def area(self) -> float: ...

class Circle:
    def __init__(self, radius): self.radius = radius
    def area(self) -> float: return math.pi * self.radius ** 2

class Rectangle:
    def __init__(self, width, height): self.width, self.height = width, height
    def area(self) -> float: return self.width * self.height

# New shapes can be added without changing existing code
class Triangle:
    def __init__(self, base, height): self.base, self.height = base, height
    def area(self) -> float: return 0.5 * self.base * self.height
```

### L - Liskov Substitution Principle

Objects of a superclass should be replaceable with objects of a subclass without altering program correctness.

```python
# Violation: Square changes the behavior contract of Rectangle
class Rectangle:
    def set_width(self, w): self.width = w
    def set_height(self, h): self.height = h

class Square(Rectangle):
    def set_width(self, w): self.width = self.height = w   # Surprising!
    def set_height(self, h): self.width = self.height = h  # Surprising!

# Fix: use separate types or an immutable approach
class Shape(Protocol):
    def area(self) -> float: ...

class Rectangle:
    def __init__(self, width, height): ...
    def area(self): return self.width * self.height

class Square:
    def __init__(self, side): ...
    def area(self): return self.side ** 2
```

### I - Interface Segregation Principle

Clients should not be forced to depend on interfaces they do not use.

```typescript
// Bad: a printer-only device must implement fax and scan
interface Machine {
  print(doc: Document): void;
  fax(doc: Document): void;
  scan(doc: Document): Image;
}

// Good: segregated interfaces
interface Printer { print(doc: Document): void; }
interface Fax { fax(doc: Document): void; }
interface Scanner { scan(doc: Document): Image; }

class SimplePrinter implements Printer {
  print(doc: Document) { ... }
}

class MultiFunctionDevice implements Printer, Fax, Scanner {
  print(doc: Document) { ... }
  fax(doc: Document) { ... }
  scan(doc: Document) { ... }
}
```

### D - Dependency Inversion Principle

High-level modules should not depend on low-level modules. Both should depend on abstractions.

```python
# Bad: high-level OrderService depends on low-level MySQLDatabase
class OrderService:
    def __init__(self):
        self.db = MySQLDatabase()  # hard-coded dependency

# Good: depend on abstraction
class OrderService:
    def __init__(self, repository: OrderRepository):  # abstract dependency
        self.repository = repository

# Wire up at composition root
db = PostgresOrderRepository(connection_string)
service = OrderService(db)
```

## DRY vs WET Tradeoffs

### DRY (Don't Repeat Yourself)
Eliminate duplication of **knowledge** (not just code). If a business rule is expressed in two places, it will inevitably diverge.

### When DRY Goes Wrong
```python
# Over-DRY: shared utility for unrelated things
def format_thing(thing, type):
    if type == "user":
        return f"{thing.first_name} {thing.last_name}"
    elif type == "product":
        return f"{thing.name} - ${thing.price}"
    elif type == "order":
        return f"Order #{thing.id}"
```

This function couples three unrelated formatters. When user formatting changes, you risk breaking product formatting.

### WET (Write Everything Twice) Rule
Allow duplication until you have 3+ instances. Then abstract. This prevents premature abstraction.

```python
# Two similar functions: leave them separate
def validate_user_email(email): ...
def validate_contact_email(email): ...

# Third instance: now extract
def validate_email(email): ...
```

### The Abstraction Test
Before extracting shared code, ask: **If one caller needs a change, would ALL callers need the same change?**

- Yes: Extract the shared code (real duplication).
- No: The similarity is coincidental. Keep separate (accidental duplication).

## Code Organization

### File Structure Principles
1. **Group by feature, not by type** (prefer `user/controller.ts`, `user/model.ts` over `controllers/user.ts`, `models/user.ts`).
2. **Put related code close together.** Functions that call each other should be in the same file or adjacent files.
3. **Newspaper metaphor**: High-level functions at the top, low-level details at the bottom. Readers scan top-down.
4. **One concept per file.** A file with 3 unrelated classes should be 3 files.

### Vertical Formatting
- **Caller above callee.** A function should be defined below the function that calls it.
- **Related concepts close together.** Do not separate related functions with unrelated ones.
- **Blank lines between concepts.** Group related statements. Separate logical sections.

## Complexity Metrics

### Cyclomatic Complexity
Count the number of independent paths through a function.

```python
def process(order):                           # +1 base
    if order.is_valid:                        # +1
        if order.total > 100:                 # +1
            apply_discount(order)
        elif order.is_member:                 # +1
            apply_member_discount(order)
        for item in order.items:              # +1
            if item.needs_shipping:           # +1
                schedule_shipping(item)
    else:
        raise InvalidOrderError()
# Cyclomatic complexity: 6
```

**Targets**:
- 1-5: Simple, low risk.
- 6-10: Moderate, consider refactoring.
- 11-20: Complex, refactor.
- 21+: Untestable. Refactor immediately.

### Cognitive Complexity
Measures how hard code is to understand (Sonar metric). Penalizes nesting more heavily than branching.

### Halstead Metrics
- **Program length**: Total number of operators and operands.
- **Vocabulary**: Number of distinct operators and operands.
- **Difficulty**: How error-prone the code is.

## Clean Code Checklist for Review

When reviewing code through a clean code lens:

- [ ] Can I understand what each function does from its name alone?
- [ ] Are functions small (under 20 lines)?
- [ ] Does each function operate at one level of abstraction?
- [ ] Are there no commented-out code blocks?
- [ ] Are comments explaining "why", not "what"?
- [ ] Are magic numbers replaced with named constants?
- [ ] Is error handling clean (no empty catch blocks)?
- [ ] Are there no TODO comments older than 1 sprint?
- [ ] Does the code follow the project's naming conventions?
- [ ] Could a new team member understand this code without asking questions?
- [ ] Is the cyclomatic complexity of each function under 10?
- [ ] Is the code free of feature envy (method using another class more than its own)?

## Comments

### Good Comments
```python
# Compensate for browser's non-standard handling of leap seconds
adjusted_time = timestamp + LEAP_SECOND_OFFSET

# WARNING: Order of operations matters. Tax must be calculated before discount
# because discounts are pre-tax per IRS regulation 26 CFR 1.61-1.
tax = calculate_tax(subtotal)
discount = calculate_discount(subtotal)
```

### Bad Comments (Replace with Better Code)
```python
# Bad: restating the code
i += 1  # increment i

# Bad: journal comments (use git log)
# 2024-01-15 John: Added validation
# 2024-01-20 Jane: Fixed edge case

# Bad: closing brace comments
if (condition) {
    ...
    ...
    ...
} // end if condition

# Bad: commented-out code (delete it, git remembers)
# old_result = legacy_calculate(x)
# if old_result != new_result:
#     log_discrepancy(old_result, new_result)
```

### The Best Comment is No Comment
If you feel the need to comment, first try to express the same information through:
1. A better variable name.
2. A better function name.
3. Extracting a well-named function.
4. Using a well-named constant.

If the code still needs a comment after trying all four, write the comment. Explain **why**, not **what**.

## When to Use

**Use this skill when:**
- Designing or implementing clean code solutions
- Reviewing or improving existing clean code approaches
- Making architectural or implementation decisions about clean code
- Learning clean code patterns and best practices
- Troubleshooting clean code-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Clean Code Analysis

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

**Input:** "Help me implement clean code for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended clean code approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When clean code must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
