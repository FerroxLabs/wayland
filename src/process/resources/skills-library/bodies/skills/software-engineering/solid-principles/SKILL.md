---
name: solid-principles
description: |
  Guides expert-level solid principles implementation: design-patterns and clean-code decision frameworks, production-ready patterns, and concrete templates for solid principles workflows.
  Use when the user asks about solid principles, solid principles configuration, or design-patterns best practices for solid projects.
  Do NOT use when the user needs a different architecture design capability -- check sibling skills in the architecture design subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design-patterns clean-code best-practices"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# SOLID Principles

## When to Use

**Use this skill when:**
- The user asks how to apply one or more of the five SOLID principles (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion) to a specific class, module, or system
- The user has a code smell -- a God Class, a switch statement dispatching on type tags, a test that breaks when an unrelated feature changes -- and wants to understand which SOLID violation is causing it
- The user is designing a new feature and wants to set up the class hierarchy, interface boundaries, or dependency graph before writing any code
- The user is refactoring legacy code and needs a systematic approach to reduce coupling and increase cohesion without breaking existing behavior
- The user is doing a code review and wants precise vocabulary and criteria to identify architectural problems
- The user wants to understand the relationship between SOLID principles and specific design patterns (Strategy, Decorator, Factory, Adapter, Repository)
- The user is onboarding a team to clean architecture and needs worked examples in a specific language (Java, C#, Python, TypeScript, Kotlin, Go)

**Do NOT use this skill when:**
- The user needs guidance on broader architectural styles like microservices decomposition, event sourcing, or hexagonal architecture -- use the system architecture or clean architecture skill instead
- The user is asking about database normalization, which has its own design theory (1NF--5NF)
- The user wants package-level or service-level cohesion metrics (use the component coupling skill)
- The user asks about functional programming principles, which use composition and immutability rather than OOP class hierarchies
- The user needs a design pattern catalog overview without a SOLID context -- use the design patterns skill instead
- The user is asking about API design contracts or REST semantics -- use the API design skill
- The user is working in a procedural language or a codebase where OOP is intentionally not the paradigm

---

## Process

### 1. Identify Which Principle(s) Are at Stake

Before prescribing a solution, diagnose the problem precisely. SOLID violations produce recognizable symptoms.

- **Single Responsibility (SRP):** A class or module has more than one reason to change. Symptoms include methods that mix business logic with persistence, formatting, or networking; test files that need updating when an unrelated feature changes; and classes exceeding 200--300 lines in a typical business domain.
- **Open/Closed (OCP):** Adding a new variant (new payment method, new export format) requires editing existing, tested code rather than adding new code. Symptoms include long if/else or switch chains that dispatch on a type string or enum, and frequent regression bugs after feature additions.
- **Liskov Substitution (LSP):** A subclass cannot be used wherever its superclass is expected without changing program behavior. Symptoms include `instanceof` checks before calling a method, `NotImplementedException` in subclass overrides, subclasses that throw exceptions for inherited methods that the parent never threw, and precondition strengthening in overrides.
- **Interface Segregation (ISP):** Clients implement methods they do not use, or depend on interfaces that bundle unrelated operations. Symptoms include empty method bodies (`public void Save() {}`), `throw new UnsupportedOperationException()`, and fat interfaces with 10+ methods where no single client uses all of them.
- **Dependency Inversion (DIP):** High-level policy modules directly instantiate or import concrete low-level modules. Symptoms include `new` keyword in business logic constructors, direct imports of database libraries in domain classes, and test code that requires real database connections or HTTP calls.

When a user presents a code snippet or description, map each symptom to its root principle before proceeding. It is common for two or three violations to co-occur -- rank them by severity of impact.

### 2. Establish the Change Axis for SRP

SRP is the most frequently misapplied principle. "One reason to change" requires identifying stakeholders and the forces that drive change, not just counting methods.

- Ask: who requests changes to this class? A `UserService` that handles authentication AND sends welcome emails AND formats user profiles has three different stakeholders: the security team, the marketing team, and the UI team.
- Use Robert Martin's formulation: a class should be responsible to one and only one actor -- a person or group whose requirements drive change.
- Separate concerns by extracting cohesive clusters of methods into dedicated classes. A class with 20 methods grouped into three distinct behavioral clusters should become three classes.
- Apply the newspaper reporter test: you should be able to describe the class's purpose in a single sentence without using "and" or "or."
- Target class size: in most OOP business domains, 50--150 lines of implementation code (excluding comments and blank lines) is a healthy range. Beyond 300 lines, demand justification.
- Do NOT apply SRP mechanically by moving every private method to its own class. SRP is about cohesion at the level of stakeholder-driven change, not granularity for its own sake.

### 3. Identify Variation Points for OCP

OCP instructs you to close modules against modification but open them for extension. The mechanism for extension varies by context.

- **Inheritance-based OCP (classical):** Define an abstract base class with a Template Method. Subclasses extend behavior by overriding hook methods. Use when the algorithm skeleton is stable and only steps vary (e.g., different report generators sharing common header/footer logic).
- **Composition-based OCP (preferred in modern practice):** Use the Strategy pattern -- inject a behavior object that implements an interface. The containing class is closed; new behaviors are new classes. Prefer this over inheritance because it avoids fragile base class problems.
- **Plugin/registration-based OCP:** Use a registry or factory that maps string keys or enum values to implementations. New variants register themselves; the core loop never changes. Common in plugin architectures and rule engines.
- Identify the axis of variation first. A `TaxCalculator` varies by jurisdiction. A `ReportFormatter` varies by output format. The variation axis determines the interface boundary.
- Do not preemptively open every class for extension. OCP adds indirection and complexity. Apply it to points where change has already occurred twice, following the Rule of Three: refactor to OCP after the second concrete variant appears.

### 4. Validate Behavioral Compatibility for LSP

LSP is a semantic contract, not a syntactic one. Verify all four Bertrand Meyer contract conditions:

- **Preconditions:** The subclass must accept at least what the parent accepts -- it cannot require stronger input constraints. If the parent's `Withdraw(amount)` allows any positive amount, the subclass cannot restrict to amounts below the account balance inside the method signature logic.
- **Postconditions:** The subclass must deliver at least what the parent promises -- it can do more but not less. If the parent guarantees the returned list is non-null, the subclass cannot return null.
- **Invariants:** Class invariants established by the parent must hold in the subclass after every method call.
- **History constraint (contravariance of history):** The subclass cannot allow state transitions the parent type does not permit. A `ReadOnlyList` subclass of `List` violates LSP if `List` guarantees mutability.
- Test LSP with the substitution test: replace every instantiation of the parent with the subclass in the test suite. All tests must still pass without modification.
- When LSP is violated through inheritance, the fix is usually to break the inheritance and instead use composition. A `Square` should not extend `Rectangle` -- they should both implement a `Shape` interface.
- Use the `is-a` vs. `behaves-as` distinction. `Square` is-a `Rectangle` geometrically but does NOT behave-as a `Rectangle` under mutation.

### 5. Define Narrow Interfaces for ISP

Fat interfaces force clients into unnecessary coupling and make mocking in tests expensive.

- Use the role interface pattern: define one interface per role a client needs to play. A `Printer` interface should not bundle `Scan`, `Fax`, and `Staple` operations if those are used by different clients.
- Target interface size: 1--5 methods is healthy. 6--10 methods warrants review. More than 10 methods on a single interface almost always violates ISP.
- Apply interface segregation at the client boundary, not the implementation boundary. The implementation class may implement five narrow interfaces; each client only depends on the one interface it uses.
- When using languages with structural typing (Go, TypeScript, Python with Protocols), interfaces are implicit -- define them at the point of use in the consuming module, not in the providing module.
- ISP often co-occurs with DIP: narrowing interfaces makes it easier to inject only what a class needs.

### 6. Invert Dependencies with Abstractions

DIP requires that both high-level and low-level modules depend on abstractions, and that abstractions do not depend on details.

- The dependency direction in source code must oppose the runtime call direction for the principle to apply. The `OrderService` (high-level) calls `EmailSender` (low-level) at runtime. In source code, `OrderService` depends on `INotificationService` (abstraction), and `EmailSender` implements `INotificationService`. The flow of control crosses the abstraction boundary.
- Place interface definitions in the module that owns the abstraction -- typically the high-level policy layer. Do not place them in the infrastructure layer.
- Use constructor injection as the default mechanism. Field injection (via reflection frameworks) hides dependencies and makes them non-obvious. Method injection is valid for optional or per-call dependencies.
- In statically typed languages, wire dependencies in a composition root -- a single location at the application entry point (e.g., `Program.cs`, `main.py`, `Application.java`) that constructs the full dependency graph.
- Use a DI container (Spring, Dagger, Guice, Microsoft.Extensions.DependencyInjection, InversifyJS) for applications with more than 10--15 collaborating classes. For smaller scopes, manual wiring in a factory is preferable to avoid container magic.
- Every `new ConcreteClass()` inside a non-factory class in the domain or application layer is a DIP violation candidate. The `new` keyword is a dependency on a concrete type.

### 7. Apply the Refactoring Sequence

When applying SOLID to existing code, use this order to minimize risk:

1. Extract interfaces and add tests covering the current behavior (do not change behavior yet).
2. Apply SRP -- split the class using the Extract Class refactoring. Each extracted class gets the existing tests that cover its responsibilities.
3. Apply ISP -- split the interfaces extracted in step 1 to match client needs.
4. Apply DIP -- inject the extracted collaborators rather than instantiating them.
5. Apply OCP -- identify variation points in the now-decomposed code and introduce a Strategy or Template Method if a second concrete variant already exists.
6. Validate LSP last -- with the hierarchy now explicit, verify all substitution contracts.

Run the full test suite after each step. SOLID refactoring is not a big bang rewrite.

### 8. Communicate and Document Decisions

SOLID decisions are architectural. They need to be communicated at the right level of abstraction.

- For each major interface boundary, write a brief contract statement: what the interface guarantees (postconditions), what it requires (preconditions), and what invariants it maintains.
- Use an Architecture Decision Record (ADR) for any SOLID-driven structural decision that affects more than one team member. Keep it short: Context (2--3 sentences), Decision (1 sentence), Consequences (bullet list).
- Name classes and interfaces to communicate intent precisely. Prefer `IOrderRepository` over `IData`, `PdfReportFormatter` over `Formatter2`, `TaxCalculationStrategy` over `Calculator`.
- In code reviews, cite the specific principle being violated, not just "this is bad design." "This violates LSP because `VipCustomer.GetDiscount()` throws when the base class guarantees a return value" is actionable. "This is messy" is not.

---

## Output Format

When responding to a SOLID question, structure the output as follows:

```
## SOLID Analysis: [Class/Module Name]

### Diagnosis
| Principle | Violated? | Evidence | Severity |
|-----------|-----------|----------|----------|
| SRP       | Yes/No    | [specific evidence from code] | High/Medium/Low |
| OCP       | Yes/No    | [specific evidence from code] | High/Medium/Low |
| LSP       | Yes/No    | [specific evidence from code] | High/Medium/Low |
| ISP       | Yes/No    | [specific evidence from code] | High/Medium/Low |
| DIP       | Yes/No    | [specific evidence from code] | High/Medium/Low |

### Root Cause
[1--2 sentences identifying the primary violation and how it cascades to the others]

### Recommended Refactoring

**Step 1 -- [Refactoring Name]:** [What to do and why]
**Step 2 -- [Refactoring Name]:** [What to do and why]
...

### Before Code
```[language]
// Original code with violation
```

### After Code
```[language]
// Refactored code demonstrating the SOLID-compliant version
```

### Interface Contract
- Preconditions: [what callers must guarantee]
- Postconditions: [what the class guarantees on return]
- Invariants: [conditions always true between public method calls]

### Trade-offs
- [What complexity was added by the refactoring]
- [What flexibility was gained]
- [When this level of abstraction would be premature]

### Pattern Connection
[Which design pattern(s) the refactoring introduces and why they apply here]
```

---

## Rules

1. **Never conflate SRP with the one-method-per-class fallacy.** SRP applies at the level of stakeholder-driven change axes, not method count. A class with 15 closely related methods serving one business actor is SRP-compliant.

2. **Never apply OCP speculatively.** Do not add Strategy interfaces, abstract factories, or plugin hooks "for future flexibility" unless a second concrete variant already exists or is contractually committed. Premature OCP adds indirection with zero current benefit -- this is the primary cause of over-engineered codebases.

3. **Always check LSP violations in the direction of Liskov's original theorem.** The violation is in the subclass's contract, not its implementation. A subclass that internally uses a different algorithm is fine. A subclass that narrows the input contract or widens the output contract violates LSP.

4. **Never define interfaces in the infrastructure layer.** DIP requires that abstractions belong to the high-level policy layer. If `IEmailSender` lives in the `Infrastructure.Email` namespace, high-level modules still depend on the infrastructure layer to import it.

5. **Always use constructor injection as the default for mandatory dependencies.** Setter injection and field injection are acceptable only for optional dependencies or framework-imposed constraints (e.g., some serialization libraries requiring a no-arg constructor).

6. **Never treat SOLID as a checklist to maximize abstraction.** The goal is software that is easy to change in the ways it actually changes. A data transfer object (DTO), a value object, or a simple configuration class may legitimately have no abstractions and still be well-designed.

7. **Always validate substitutability with tests, not reasoning alone.** Create a parameterized test suite for abstract types that runs all concrete implementations against the same behavioral contracts. In JUnit 5 this uses `@ParameterizedTest`; in xUnit it uses `[Theory]`; in pytest it uses `@pytest.mark.parametrize`.

8. **Never violate ISP by adding convenience methods to a shared interface.** When you add a method to an interface for one client's convenience, every other implementer must update. Instead, extend the interface through a separate role interface or use a default implementation (with caution in Java 8+/C# 8+).

9. **Always name the actor when applying SRP.** The actor is the human role or external system whose requirements drive change. If you cannot name the actor, you cannot evaluate whether SRP applies.

10. **Never use DIP containers to inject concrete classes directly.** If your DI registration is `services.AddTransient<SqlOrderRepository, SqlOrderRepository>()` and consumers depend on `SqlOrderRepository`, DIP is not satisfied even though a container is involved. The consumer must depend on `IOrderRepository`.

---

## Edge Cases

### Legacy God Class Refactoring

A `CustomerManager` class with 800 lines, 40 methods, and dependencies on the database, email system, and PDF renderer is common in legacy codebases. Do not attempt a single large refactoring.

- Use the Strangler Fig pattern: identify the next feature request that touches this class, and implement that feature in a new SRP-compliant class. Route the new code path to the new class.
- Extract the most volatile responsibility first -- the one that changes most frequently -- using the Extract Class refactoring with IDE support (IntelliJ, Visual Studio, VS Code with language extensions all support this safely).
- Add characterization tests (also called golden master tests) before any extraction. These tests capture the existing behavior by recording actual output, not by understanding the logic. They prevent regressions during refactoring even without understanding the full code.
- After each extraction, the God Class delegates to the new class. Leave the delegation in place rather than updating all callers immediately -- update callers incrementally as they are touched for other reasons.

### Deep Inheritance Hierarchies and LSP

Inheritance hierarchies deeper than 2--3 levels almost always produce LSP violations because base class contracts become harder to honor as specialization increases.

- When encountering a hierarchy like `Animal -> Mammal -> Pet -> Dog -> GoldenRetriever`, flatten it. Identify what behavior the leaf class actually needs and implement it through composition with behavior objects rather than through inherited overrides.
- For hierarchies that exist in third-party libraries (which you cannot change), use the Adapter pattern to wrap the third-party type behind your own interface. Your code depends on your interface; the adapter isolates the LSP-violating inheritance.
- When a `NotImplementedException` or `NotSupportedException` appears in an override, this is a definitive LSP violation. The fix is to remove the method from the base interface entirely and create a separate capability interface that only the capable subclasses implement.

### Circular Dependencies Between Modules

Applying DIP incorrectly can create circular dependency cycles: `Module A` depends on `IB` (defined in B), and `Module B` depends on `IA` (defined in A).

- Move shared interfaces to a dedicated `Contracts`, `Abstractions`, or `Domain` module that neither A nor B owns. Both modules depend on the contracts module; neither depends on the other.
- In Maven/Gradle projects this is a separate JAR. In .NET it is a separate project. In TypeScript monorepos it is a separate package. This is the standard Dependency Rule from Clean Architecture.
- Use a dependency graph tool to detect cycles before they become entrenched: `deptrac` (PHP/general), `dependency-cruiser` (JavaScript/TypeScript), `ArchUnit` (Java/Kotlin), `NDepend` (C#).

### Interface Segregation in Dynamic Languages

Python, Ruby, and JavaScript do not have formal interface declarations. ISP still applies but the mechanism differs.

- In Python 3.8+, use `typing.Protocol` for structural subtyping. Define a `Protocol` class with only the methods a specific client needs. This is enforced by `mypy` at static analysis time without inheritance.
- In JavaScript/TypeScript, define narrow interface types at the point of consumption. A function that only needs `{ save(order: Order): Promise<void> }` should declare exactly that type, not `import OrderRepository from './OrderRepository'` which brings in 12 other methods.
- Duck typing does not eliminate ISP responsibility -- it just moves the violation's discovery from compile time to runtime. A function receiving an object with 15 methods when it uses 2 is still coupled to the full interface implicitly.

### SOLID in Functional Programming Hybrids

Modern codebases (Kotlin, Scala, TypeScript, Swift) mix OOP and functional styles. SOLID principles apply asymmetrically.

- SRP and ISP translate directly: pure functions have one responsibility and accept only the data they need.
- OCP translates to higher-order functions and function composition: pass a function as a parameter instead of subclassing.
- DIP translates to passing functions as arguments (functions are the abstraction). A `processOrder(notifyFn: (Order) -> Unit)` parameter is DIP-compliant.
- LSP has no direct equivalent for standalone functions but applies to function types: a function that accepts a `(Animal) -> String` parameter can receive any `(Cat) -> String` function because function types are contravariant in their parameter types and covariant in their return types.

### Performance-Sensitive Code and DIP Overhead

DIP through interface dispatch adds virtual call overhead. In hot paths (tight loops, real-time rendering, game physics, financial tick processing), this can be measurable.

- Profile first. In JVM languages, the JIT compiler's inline cache effectively eliminates virtual dispatch overhead when a call site has only one or two concrete implementations at runtime -- which is almost always the case with DIP-injected dependencies. Measure before assuming a problem.
- If profiling confirms overhead above 5% of hot path time, consider marking hot-path implementations as `final`/`sealed` so the JIT can devirtualize, or use value types (C# structs, Rust generics with monomorphization) instead of reference-type interfaces.
- Apply SOLID fully at the boundary (service layer, application layer) and relax it at the leaf-level performance-critical computation layer. Document this deviation explicitly.

### Multiple Teams and Interface Ownership

When two teams share an interface definition and both are allowed to modify it, ISP violations accumulate because each team adds methods for its own convenience.

- Establish a clear interface owner: the consuming team owns the interface, not the providing team. Only the consumer can add methods to the interface they own.
- For cross-team contracts, use API versioning semantics even for internal interfaces. Adding a method to `v1.IOrderService` is a breaking change for all providers. Add `v2.IOrderService` with the new method and migrate providers on their own schedule.
- Apply the Consumer-Driven Contract testing pattern (implemented with tools like Pact) to validate that provider implementations satisfy the specific interface methods each consumer actually calls.

---

## Example

**Input:** "I have a Python class that handles user registration. It validates the input, saves the user to the database, sends a welcome email, and logs the event. It's 250 lines and hard to test. How do I fix it?"

**Output:**

## SOLID Analysis: UserRegistrationService

### Diagnosis

| Principle | Violated? | Evidence | Severity |
|-----------|-----------|----------|----------|
| SRP       | Yes       | Class handles validation, persistence, email, and logging -- four distinct actors drive changes | High |
| OCP       | No        | No evidence of type-dispatched variation points yet | Low |
| LSP       | No        | No inheritance hierarchy described | Low |
| ISP       | Yes       | Any caller importing this class gets all four concerns even if it only needs one | Medium |
| DIP       | Yes       | Business logic directly instantiates database connections, email client, and logger | High |

### Root Cause

The class violates SRP by serving four distinct actors (the product team owning validation rules, the DBA team owning persistence, the marketing team owning email content, and the ops team owning logging format). Because all four concerns are in one concrete class, DIP is also violated -- there is no way to test any concern in isolation without triggering all four.

### Recommended Refactoring

**Step 1 -- Add Characterization Tests:** Before changing anything, write tests that capture the current end-to-end behavior. Use a test database and a mock SMTP server (e.g., `mailhog` locally or Python's `smtpd` module) to record what the class actually does.

**Step 2 -- Extract Interfaces (DIP):** Define narrow protocols in the domain module for each collaborator. Place these in `domain/ports.py`, not in the infrastructure layer.

**Step 3 -- Extract Classes (SRP):** Split the class into `UserValidator`, `UserRepository`, `WelcomeEmailSender`, and `RegistrationEventLogger`. Each has one reason to change.

**Step 4 -- Inject Dependencies (DIP):** Wire all four collaborators into `UserRegistrationService` via constructor injection.

**Step 5 -- Wire in Composition Root:** In `main.py` or `app.py`, build the real implementations and inject them.

### Before Code

```python
# user_registration_service.py -- 250 lines of mixed concerns
import psycopg2
import smtplib
import logging
import re

class UserRegistrationService:
    def __init__(self):
        # DIP violation: directly instantiates concrete infrastructure
        self.db = psycopg2.connect("host=localhost dbname=prod user=admin password=secret")
        self.smtp = smtplib.SMTP("smtp.company.com", 587)
        self.logger = logging.getLogger("registration")

    def register(self, username: str, email: str, password: str) -> dict:
        # Validation -- SRP violation: validation logic mixed with orchestration
        if not re.match(r'^[a-zA-Z0-9_]{3,30}$', username):
            raise ValueError("Username must be 3-30 alphanumeric characters")
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            raise ValueError("Invalid email format")
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters")

        # Persistence -- SRP violation: DB logic in service class
        cursor = self.db.cursor()
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, crypt(%s, gen_salt('bf')))",
            (username, email, password)
        )
        user_id = cursor.fetchone()[0]
        self.db.commit()

        # Email -- SRP violation: email content owned by marketing, not dev team
        message = f"Subject: Welcome!\n\nHello {username}, your account is ready."
        self.smtp.sendmail("noreply@company.com", email, message)

        # Logging -- SRP violation: log format owned by ops team
        self.logger.info(f"USER_REGISTERED user_id={user_id} username={username} email={email}")

        return {"user_id": user_id, "username": username}
```

### After Code

```python
# domain/ports.py -- abstractions owned by the domain layer (DIP compliant)
from typing import Protocol
from dataclasses import dataclass

@dataclass
class UserRecord:
    username: str
    email: str
    password_plaintext: str

@dataclass
class RegisteredUser:
    user_id: int
    username: str
    email: str

class UserValidatorPort(Protocol):
    def validate(self, record: UserRecord) -> None:
        """Raises ValueError with a descriptive message if validation fails."""
        ...

class UserRepositoryPort(Protocol):
    def save(self, record: UserRecord) -> RegisteredUser:
        """Persists the user and returns the stored record with assigned ID."""
        ...

class WelcomeNotifierPort(Protocol):
    def notify(self, user: RegisteredUser) -> None:
        """Sends a welcome notification. Raises NotificationError on failure."""
        ...

class RegistrationAuditPort(Protocol):
    def record_registration(self, user: RegisteredUser) -> None:
        """Records the registration event for audit and operational purposes."""
        ...


# domain/user_validator.py -- SRP: only validation logic, owned by product team
import re
from domain.ports import UserRecord

class UserValidator:
    USERNAME_PATTERN = re.compile(r'^[a-zA-Z0-9_]{3,30}$')
    EMAIL_PATTERN = re.compile(r'^[^@]+@[^@]+\.[^@]+$')
    MIN_PASSWORD_LENGTH = 8

    def validate(self, record: UserRecord) -> None:
        if not self.USERNAME_PATTERN.match(record.username):
            raise ValueError("Username must be 3-30 alphanumeric characters or underscores")
        if not self.EMAIL_PATTERN.match(record.email):
            raise ValueError(f"'{record.email}' is not a valid email address")
        if len(record.password_plaintext) < self.MIN_PASSWORD_LENGTH:
            raise ValueError(f"Password must be at least {self.MIN_PASSWORD_LENGTH} characters")


# domain/user_registration_service.py -- orchestration only, no concrete dependencies
from domain.ports import UserRecord, RegisteredUser, UserValidatorPort, UserRepositoryPort
from domain.ports import WelcomeNotifierPort, RegistrationAuditPort

class UserRegistrationService:
    def __init__(
        self,
        validator: UserValidatorPort,
        repository: UserRepositoryPort,
        notifier: WelcomeNotifierPort,
        auditor: RegistrationAuditPort,
    ) -> None:
        # DIP compliant: depends on abstractions, not concretions
        self._validator = validator
        self._repository = repository
        self._notifier = notifier
        self._auditor = auditor

    def register(self, username: str, email: str, password: str) -> RegisteredUser:
        record = UserRecord(username=username, email=email, password_plaintext=password)
        self._validator.validate(record)          # raises ValueError on invalid input
        user = self._repository.save(record)      # raises RepositoryError on DB failure
        self._notifier.notify(user)               # raises NotificationError on email failure
        self._auditor.record_registration(user)   # fire-and-forget, logged internally
        return user


# infrastructure/postgres_user_repository.py -- infrastructure detail
import psycopg2
from domain.ports import UserRecord, RegisteredUser

class PostgresUserRepository:
    def __init__(self, connection_string: str) -> None:
        self._conn_str = connection_string

    def save(self, record: UserRecord) -> RegisteredUser:
        with psycopg2.connect(self._conn_str) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO users (username, email, password_hash)
                    VALUES (%s, %s, crypt(%s, gen_salt('bf')))
                    RETURNING id
                    """,
                    (record.username, record.email, record.password_plaintext),
                )
                user_id = cur.fetchone()[0]
        return RegisteredUser(user_id=user_id, username=record.username, email=record.email)


# main.py -- composition root: the only place that knows about concrete types
import os
from domain.user_validator import UserValidator
from domain.user_registration_service import UserRegistrationService
from infrastructure.postgres_user_repository import PostgresUserRepository
from infrastructure.smtp_welcome_notifier import SmtpWelcomeNotifier
from infrastructure.structured_audit_logger import StructuredAuditLogger

def build_registration_service() -> UserRegistrationService:
    return UserRegistrationService(
        validator=UserValidator(),
        repository=PostgresUserRepository(os.environ["DATABASE_URL"]),
        notifier=SmtpWelcomeNotifier(
            host=os.environ["SMTP_HOST"],
            port=int(os.environ["SMTP_PORT"]),
        ),
        auditor=StructuredAuditLogger(),
    )
```

### Testing the Refactored Design

```python
# tests/test_user_registration_service.py
# Tests run with zero real infrastructure -- pure domain logic only
import pytest
from unittest.mock import MagicMock, call
from domain.user_validator import UserValidator
from domain.user_registration_service import UserRegistrationService
from domain.ports import UserRecord, RegisteredUser

@pytest.fixture
def mock_repository():
    repo = MagicMock()
    repo.save.return_value = RegisteredUser(user_id=42, username="alice", email="alice@example.com")
    return repo

@pytest.fixture
def service(mock_repository):
    return UserRegistrationService(
        validator=UserValidator(),
        repository=mock_repository,
        notifier=MagicMock(),
        auditor=MagicMock(),
    )

def test_register_valid_user_returns_registered_user(service, mock_repository):
    result = service.register("alice", "alice@example.com", "securepass123")
    assert result.user_id == 42
    assert result.username == "alice"

def test_register_invalid_username_raises_before_touching_repository(service, mock_repository):
    with pytest.raises(ValueError, match="Username must be"):
        service.register("a", "alice@example.com", "securepass123")
    mock_repository.save.assert_not_called()

def test_register_short_password_raises_value_error(service):
    with pytest.raises(ValueError, match="at least 8 characters"):
        service.register("alice", "alice@example.com", "short")
```

### Interface Contract

- **Preconditions:** `register()` requires non-empty strings for all three parameters. Password entropy validation is the validator's responsibility, not the caller's.
- **Postconditions:** On success, `register()` returns a `RegisteredUser` with a positive integer `user_id`. The user record is durably persisted before the method returns. The welcome notification may be eventually consistent.
- **Invariants:** `UserRegistrationService` is stateless between calls. It holds no mutable state -- all dependencies are injected at construction and treated as read-only collaborators.

### Trade-offs

- **Added complexity:** Five files instead of one. A developer unfamiliar with this architecture needs to trace through the port definitions to understand the full flow. Mitigate with clear naming and a short ADR explaining the structure.
- **Flexibility gained:** Each of the four collaborators can be replaced independently without touching `UserRegistrationService`. Switching from PostgreSQL to DynamoDB requires only a new `DynamoUserRepository` implementing `UserRepositoryPort`. Switching the welcome email to an SMS notification requires only a new `SmsWelcomeNotifier`.
- **Test isolation:** The service's core logic is now testable with zero infrastructure. The test above runs in under 10 milliseconds with no database, no SMTP server, and no file system.
- **When this is premature:** A proof-of-concept script, a one-off data migration, or a service with fewer than 3 collaborators does not justify this level of decomposition. Apply this structure when the service is expected to live beyond 6 months and be maintained by more than one developer.

### Pattern Connection

This refactoring introduces three design patterns:

1. **Strategy** -- each injected collaborator (`UserValidatorPort`, `UserRepositoryPort`) is a strategy that can be swapped without changing the orchestrating service. This is the compositional form of OCP.
2. **Repository** -- `UserRepositoryPort` follows the Repository pattern, hiding persistence mechanics behind a domain-oriented interface (`save`, `find_by_email`) rather than exposing SQL or ORM concepts.
3. **Ports and Adapters (Hexagonal Architecture)** -- the `domain/ports.py` module defines the hexagon's boundary. Infrastructure adapters (`PostgresUserRepository`, `SmtpWelcomeNotifier`) plug in from outside. This is DIP applied at architectural scale.
