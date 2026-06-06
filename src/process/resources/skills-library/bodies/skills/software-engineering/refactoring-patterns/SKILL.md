---
name: refactoring-patterns
description: |
  Guides expert-level refactoring patterns implementation: refactoring and clean-code decision frameworks, production-ready patterns, and concrete templates for refactoring patterns workflows.
  Use when the user asks about refactoring patterns, refactoring patterns configuration, or refactoring best practices for refactoring projects.
  Do NOT use when the user needs a different developer tools capability -- check sibling skills in the developer tools subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "refactoring clean-code design-patterns"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Refactoring Patterns

## When to Use

**Use this skill when:**
- The user has a specific method, class, module, or system component they want to restructure without changing its observable behavior
- The user describes code smells -- long methods (>20 lines), god classes (>500 lines), deeply nested conditionals (>3 levels), duplicated logic across 3+ locations, or primitive obsession
- The user asks how to break apart a tightly coupled system to improve testability, extensibility, or readability
- The user is preparing a codebase for a feature addition and wants to "make the change easy" first before making the change
- The user has inherited legacy code and wants a systematic approach to improving it without introducing regressions
- The user is conducting a code review and identifies structural problems they want to fix safely
- The user wants to eliminate technical debt in a specific area of the codebase with a concrete plan

**Do NOT use this skill when:**
- The user is asking about architectural restructuring at the system or service boundary level -- use a system design or architecture skill instead
- The user is asking about general clean code principles without a specific target to refactor -- use a code review or style guide skill
- The user needs help writing new code from scratch -- refactoring applies only to existing working code
- The user is asking about performance optimization -- profiling and optimization is a separate concern, and refactoring for performance often conflicts with refactoring for clarity
- The user needs help with database schema migration or data refactoring -- that is a distinct domain with its own safety concerns
- The user is asking about dependency upgrades or library replacements -- use a migration skill
- The user is in a regulated environment where behavioral equivalence must be formally verified -- escalate to domain-specific verification methods

---

## Process

### 1. Diagnose the Code Smells Precisely

Before prescribing a refactoring pattern, identify what specific structural problem exists. Do not guess -- read the code or the description carefully.

- **Long Method:** Any method exceeding 15-20 lines is a candidate; anything over 40 lines is a strong signal. Look for comment blocks that partition logic inside the method -- each comment is a candidate Extract Method site.
- **Large Class (God Object):** Classes with more than 200-300 lines of logic (not counting getters/setters), more than 10 public methods, or more than 5 unrelated responsibilities.
- **Feature Envy:** A method that calls methods or accesses data from another class more than its own -- signals the method belongs on the other class (Move Method).
- **Duplicated Code:** Identical or near-identical blocks appearing in 2+ places. Use the Rule of Three: tolerate one copy, notice two, eliminate three.
- **Long Parameter List:** Functions with more than 4 parameters signal missing abstraction -- introduce a Parameter Object or Builder.
- **Divergent Change:** One class changes for multiple reasons (violates SRP). When adding a feature requires touching unrelated parts of one class, this is the symptom.
- **Shotgun Surgery:** One logical change requires editing many different classes -- signals a concept that is scattered and should be consolidated.
- **Primitive Obsession:** Using raw strings, ints, or booleans where a domain type (ValueObject, enum, class) would give semantic clarity and validation.
- **Conditional Complexity:** Chains of `if/else if` or `switch` statements that check type or state -- candidates for Replace Conditional with Polymorphism or Strategy Pattern.
- **Data Clumps:** Groups of 3+ variables that always appear together (e.g., `street, city, zip`) -- introduce a dedicated class.

### 2. Establish a Safety Net Before Touching Anything

Refactoring without tests is not refactoring -- it is gambling. Establish safety before changing a single line.

- Check existing test coverage using a coverage tool (Istanbul/c8 for JavaScript, JaCoCo for Java, coverage.py for Python). Aim for line coverage ≥ 80% on the code being refactored before starting.
- If coverage is insufficient, write characterization tests (also called "golden master" tests): capture the existing behavior of the code by running it with realistic inputs and asserting the current output. These tests do not need to be beautiful -- they need to be accurate.
- For UI or integration-heavy code without unit tests, add contract or snapshot tests that capture inputs and outputs at the boundary.
- Set up a regression test suite that runs in under 60 seconds locally. Slow feedback loops kill discipline.
- Commit the current working state to version control before the first refactoring move. Create a branch specifically for this work.
- Use mutation testing tools (Stryker for JS/TS, PIT for Java) on critical sections to verify your tests would actually catch a regression.

### 3. Select the Correct Refactoring Pattern

Match the diagnosed code smell to the appropriate catalog pattern. Use this decision framework:

**For structural decomposition (too big, too complex):**
- Long method with partitioned logic → **Extract Method** (Martin Fowler Catalog #106)
- Method logic belongs on another class → **Move Method**
- Large class with multiple responsibilities → **Extract Class** then optionally **Extract Interface**
- Nested conditionals that guard state → **Replace Nested Conditional with Guard Clauses**
- Complex conditional logic → **Decompose Conditional** (extract condition and branches into named methods)

**For abstraction and encapsulation (exposing too much, expressing too little):**
- Primitive fields with business rules → **Replace Primitive with Object** (Value Object)
- Data bags without behavior → **Replace Record with Data Class**, then incrementally add methods
- Long parameter lists → **Introduce Parameter Object** or **Preserve Whole Object**
- Constructor complexity → **Replace Constructor with Factory Method** or **Builder Pattern**

**For coupling reduction (too entangled):**
- Direct instantiation of dependencies → **Extract Interface** + dependency injection
- Feature envy → **Move Method** to the envied class
- Bidirectional dependencies → introduce an intermediary (Mediator) or invert one dependency
- Concrete class references → **Replace Concrete Class with Interface**

**For conditional dispatch (type-based or state-based switching):**
- Switch/if-else on type → **Replace Conditional with Polymorphism** (Strategy or Visitor)
- Switch on state → **Replace State-Altering Conditionals with State Object**
- Null checks everywhere → **Introduce Null Object** or use an Option/Maybe monad

**For duplication elimination:**
- Identical logic in sibling classes → **Pull Up Method** to superclass or extract shared utility
- Nearly-identical algorithms → **Extract Method** the identical parts, leave the variant parts as parameters (Template Method Pattern)
- Duplicated data transformations → **Extract Function** and centralize

### 4. Apply the Pattern in the Smallest Safe Steps

Each refactoring move must leave the code in a passing state. Never accumulate multiple moves in one uncommitted change.

- Apply one atomic refactoring operation at a time. Commit or at minimum verify tests after each step.
- Use your IDE's automated refactoring tools where available -- they are safer than manual text editing:
  - IntelliJ IDEA / WebStorm: Extract Method (Ctrl+Alt+M), Extract Variable (Ctrl+Alt+V), Move (F6), Rename (Shift+F6), Change Signature
  - VS Code + language extensions: Extract to function, Extract to constant, Rename Symbol (F2)
  - Eclipse: Refactor menu provides all Fowler operations
  - PyCharm: Extract Method, Extract Variable, Pull Up, Push Down
- For Extract Method: select the code, invoke the automated extraction, then rename the extracted method to express its intent. The name should say *what* not *how*.
- For Move Method: first copy the method, verify tests still pass on the original, then delete the original and update call sites.
- After each step, run the full test suite. A red test at this stage means you changed behavior -- stop and revert.
- Keep refactoring commits separate from behavioral changes. A commit that says "Refactor: Extract UserValidator from UserService" should contain zero functional changes.

### 5. Handle Dependencies and Call Sites

Refactoring often requires updating the code that calls the code you changed. Do this systematically.

- Before renaming or moving, use your IDE's "Find Usages" or "Find References" (not text search) to locate all call sites. Text search misses dynamic dispatch and mismatches casing.
- When extracting a class from an existing class, update the original class to delegate to the new one. Keep the original class's public API stable during the transition. Remove the delegation only after all call sites are updated.
- When introducing an interface over a concrete class, use the **Parallel Change** (expand-contract) technique: add the interface, implement it on the existing class, migrate call sites one at a time, then remove the concrete type reference from public APIs.
- Document deprecated paths with deprecation annotations (`@deprecated` in Java/TS, `warnings.warn` in Python) rather than immediately deleting them, especially in shared libraries or public APIs.
- Track all changed files in the PR. A refactoring that touches more than 15-20 files simultaneously is a high-risk operation that should be broken into phases.

### 6. Validate Behavioral Equivalence

After completing a refactoring session, confirm you have not changed observable behavior.

- Run the full test suite including integration tests. Zero tolerance for new test failures.
- If available, run the application with a production traffic sample (replay logs, shadow traffic, or a feature flag) and compare outputs before and after.
- For stateful refactorings (moving logic between classes, changing data flow), add explicit assertions or logging around boundary conditions: empty input, null/nil input, maximum values, concurrent access if applicable.
- Review the diff with a focus on: are there any changed return values? Any changed exception types? Any changed side effects (writes, logs, events)?
- If you introduced a new abstraction layer (new interface, new class), confirm the abstraction is not leaky -- no implementation details should escape through public APIs.
- Get a second pair of eyes on the diff. A developer who did not write the refactoring is better at spotting unintended changes.

### 7. Update Documentation and Team Conventions

Refactoring is not complete until the surrounding context is updated.

- Update method-level and class-level documentation (docstrings, JSDoc, Javadoc) to reflect the new structure. Outdated docs are worse than no docs.
- If the refactoring significantly changes how a module works, update the relevant README or architecture doc.
- If you introduced a new pattern the team has not used before (e.g., Strategy, Null Object, Value Object), write a brief internal guide or add it to the project's CONTRIBUTING.md with a concrete example from this codebase.
- Record significant structural decisions (e.g., "We extracted OrderPricer from Order to isolate pricing logic for testability") in an Architecture Decision Record (ADR) if your project maintains them.
- In the pull request description, explicitly state: what smell was fixed, what pattern was applied, what tests validate the equivalence, and what follow-up refactorings are now unblocked.

### 8. Plan Incremental Follow-On Refactoring

Large-scale structural improvement is a series of small safe moves, not a single big rewrite.

- After completing a refactoring, identify what is now possible that was not before. Good refactoring is enabling -- it opens doors.
- Maintain a refactoring backlog (in your issue tracker, not just in someone's head) with specific items: class name, smell type, pattern to apply, estimated scope.
- Apply the Boy Scout Rule: every time you modify a file for a functional reason, perform one small refactoring on code you touch. This distributes the debt payment.
- Reserve 10-20% of sprint capacity for refactoring in codebases with significant technical debt. This is the minimum viable investment to prevent debt accumulation outpacing repayment.
- Set measurable targets: reduce average method length below 15 lines, reduce max class line count below 300, reduce cyclomatic complexity below 10 per method in the module under refactoring.

---

## Output Format

When helping a user with refactoring, produce a structured response in the following format:

```
## Refactoring Plan: [Module / Class / Function Name]

### Diagnosed Code Smells
| Smell | Location | Severity | Evidence |
|-------|----------|----------|----------|
| Long Method | UserService.processOrder() | High | 87 lines, 4 distinct logical sections |
| Feature Envy | UserService.calculateDiscount() | Medium | 6 calls to PricingModel, 0 to UserService data |
| Primitive Obsession | User.email stored as String | Medium | No format validation, duplicated regex in 3 places |

### Safety Net Status
- Existing coverage: [X]% line coverage on affected code
- Tests to add before refactoring: [list specific characterization tests needed]
- Commit checkpoint: [confirm clean working state]

### Refactoring Sequence
Apply in this order (each step must pass tests before proceeding to next):

**Step 1: [Pattern Name] -- [Smell Being Fixed]**
- Target: [exact method/class/line range]
- Move: [specific operation]
- Result: [what the code looks like after]
- Validation: [specific test or assertion to confirm equivalence]

**Step 2: [Pattern Name] -- [Smell Being Fixed]**
[same structure]

### Before / After Code Comparison

**Before:**
```[language]
[concrete before code]
```

**After:**
```[language]
[concrete after code]
```

### Metrics Impact
| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Method length (max) | 87 lines | 12 lines | ≤ 20 lines |
| Cyclomatic complexity | 14 | 3 | ≤ 10 |
| Test coverage | 42% | 91% | ≥ 80% |
| Number of responsibilities | 5 | 1 | 1 |

### Follow-On Opportunities
- [Next refactoring now made possible by this one]
- [Next refactoring now made possible by this one]
```

---

## Rules

1. **NEVER refactor and add features in the same commit.** These are two different categories of change. Mixed commits make code review impossible and rollbacks dangerous. If you discover a bug while refactoring, file it and continue -- do not fix it during the refactoring pass.

2. **NEVER recommend Extract Method on a block shorter than 3-4 lines** unless the extraction is purely for naming a complex condition. Over-extraction creates indirection without value and makes tracing execution harder.

3. **ALWAYS recommend the smallest safe step first.** If the user wants to break apart a god class, start by extracting one cohesive cluster of methods and fields -- not by redesigning the whole class in one pass. The first extraction makes the second easier.

4. **NEVER recommend Replace Conditional with Polymorphism unless the conditional dispatches on type or has 3+ branches.** For simple two-branch conditionals, polymorphism adds more indirection than it removes complexity.

5. **ALWAYS match the refactoring to the actual smell.** Extracting a method when the problem is feature envy misses the point -- the method needs to move, not just be renamed or isolated. Correct diagnosis is prerequisite to correct prescription.

6. **NEVER advise renaming a public API method in a shared library without a deprecation period.** Renaming breaks downstream consumers. Use the **Parallel Change** pattern: add the new name, mark the old as deprecated, migrate consumers over one release cycle, then remove.

7. **ALWAYS establish characterization tests before refactoring untested code.** Do not let the user proceed with structural changes on code with less than 60-70% coverage of the paths being changed. The risk of silent regression is too high.

8. **NEVER allow the refactoring to change error handling behavior.** Which exceptions are thrown, which error codes are returned, and which errors are silently swallowed are all observable behaviors. Changing these breaks callers.

9. **ALWAYS validate that extracted classes and methods do not expose implementation details.** When you extract a private helper into a new class, the new class's fields and collaborators must not be public unless there is a specific reason. Favor package-private or internal visibility.

10. **NEVER refactor code you do not understand.** If the code's purpose is not clear, first write documentation or exploratory tests to understand it. Refactoring misunderstood code produces clean, well-structured code that is wrong. Understanding comes before restructuring.

11. **ALWAYS prefer automated IDE refactoring operations over manual text edits** for rename, extract, and move operations. IDEs track all references including through interfaces, generics, and reflection registrations that grep and text-replace miss.

12. **NEVER introduce a new abstraction during refactoring that does not yet have two concrete implementations** (the Rule of Three for abstraction). Premature interfaces and abstract base classes add complexity without benefit.

---

## Edge Cases

### Untested Legacy Code with Side Effects
When the code to be refactored has no tests and involves side effects (database writes, file I/O, network calls, email sending), you cannot safely write characterization tests against the real implementations. Use the **Seams** technique from Michael Feathers' "Working Effectively with Legacy Code": find points in the code where you can substitute behavior without editing production code (subclassing and overriding, providing a test double via constructor, using preprocessor conditions). Write characterization tests through these seams, capturing what the code currently does -- including any bugs. The goal is to make the refactoring safe, not to fix bugs simultaneously.

### Recursion and Mutual Recursion
Refactoring recursive methods requires special care. Extract Method within a recursive function can accidentally break the recursion if the recursive call is in the extracted section and the parameter passing changes. Always trace the recursion manually before and after. Test with both base cases (n=0, n=1, empty list) and recursive cases (n=2, n=10, list of 100 items). When applying Tail Call Optimization as a refactoring, confirm the language runtime actually optimizes tail calls -- many do not (Java, Python do not; Scala, Haskell, Kotlin with `tailrec` do).

### Concurrency and Shared Mutable State
Refactoring code that runs concurrently (threads, goroutines, async event loops, actors) carries unique risks. Moving a method from one class to another can change which monitor/lock protects a field. Extracting a method can inadvertently release and reacquire locks mid-operation, creating race conditions. Before refactoring concurrent code: document which fields are accessed by which threads, document which locks protect which fields, and run the existing tests under a concurrency stress tool (JCStress for Java, ThreadSanitizer for Go/C++, `asyncio` stress runners for Python). After refactoring, run the same stress tests. Never refactor concurrent code without this baseline.

### Framework-Generated Code and Annotations
In codebases heavy with framework magic (Spring, Hibernate, Django ORM, Rails ActiveRecord), refactoring class structure can silently break framework behavior. Renaming a field breaks ORM column mappings if the mapping is inferred by name. Moving a method annotated with `@Transactional`, `@Cacheable`, or `@RequestMapping` to a new class loses the framework interception. Extracting a class that a dependency injection container manages by class name breaks the container's wiring. Before refactoring annotated code, identify all annotations on the target and trace what each annotation does at runtime. Test by exercising the framework path, not just the unit logic.

### Parallel Change (Expand-Contract) for Breaking API Changes
When refactoring a public API that has external consumers (other teams, services, published library), you cannot change the signature and update all call sites atomically. Apply the expand-contract pattern in three phases:
- **Expand:** Add the new API (new method name, new parameter type, new class structure) alongside the old one. Both exist simultaneously. The old API delegates to the new one.
- **Migrate:** Update all consumers to use the new API. This can happen over multiple sprints or releases. Mark the old API deprecated.
- **Contract:** Once all consumers are migrated, remove the old API.
Each phase is its own safe, deployable step. Never skip directly from expand to contract.

### Refactoring in Dynamically Typed Languages
In Python, JavaScript, and Ruby, the IDE's automated refactoring tools are less reliable because type information is not always available. Rename operations may miss call sites where the method is invoked by string name (getattr, dynamic dispatch, eval). Before refactoring in dynamic languages:
- Add type annotations (Python type hints, TypeScript, JSDoc) to the code being refactored -- this both documents behavior and enables better IDE analysis.
- Use coverage-guided testing rather than relying on the IDE to find all references.
- Search for string-based invocation patterns: `getattr(obj, method_name)`, `send(:method_name)`, `obj[key]()`.
- Consider adding a runtime deprecation warning on the old path that logs whenever it is invoked during a testing period.

### Circular Dependencies Revealed During Extraction
When you attempt to Extract Class from a god class, you may discover that the extracted class needs to call back into the original class, creating a circular dependency. This signals that the decomposition boundary is wrong, not that extraction should be abandoned. Resolve circular dependencies by:
- Finding the dependency that goes in the wrong direction and asking what it really represents
- Introducing an interface that both classes depend on (Dependency Inversion Principle)
- Moving the shared logic into a third class that both depend on
- Using an event or callback to break the cycle without creating a direct reference

### Test Code Refactoring
Test code is production code and accumulates the same smells. However, the refactoring rules are different: test code must remain maximally readable and explicit even at the cost of duplication. Do NOT apply DRY aggressively to test code -- a test that is hard to read because logic is extracted into shared helpers is worse than a test with some duplication. The acceptable patterns for test refactoring are: extracting test fixtures/builders (Object Mother pattern), extracting assertion helpers with clear names, grouping related tests into describe/context blocks, and removing obsolete tests. Never extract the core assertion or action of a test into a helper -- it must remain visible in the test body.

---

## Example

**Input:** "I have a `UserService` class that has grown to 340 lines. It handles user registration, authentication, profile updates, and email notification. The `registerUser` method is 78 lines long. It validates the email and password, checks if the user exists, creates the user record, assigns a default role, sends a welcome email, and logs the registration event. My team is having trouble testing it and it keeps breaking when we change email templates. How do I fix this?"

---

**Output:**

## Refactoring Plan: UserService.registerUser()

### Diagnosed Code Smells

| Smell | Location | Severity | Evidence |
|-------|----------|----------|----------|
| Long Method | `UserService.registerUser()` | Critical | 78 lines, 6 distinct logical sections |
| Large Class | `UserService` (340 lines) | High | 4 unrelated responsibilities in one class |
| Shotgun Surgery | Email template changes break UserService tests | High | Email concern entangled with registration logic |
| Divergent Change | UserService changes for auth, profile, email, and registration reasons | High | Violates Single Responsibility Principle |
| Feature Envy | Email-sending logic inside UserService | Medium | Logic belongs in an email/notification subsystem |

### Safety Net Status

- **Establish before starting:** Write characterization tests that call `registerUser()` with the following inputs and assert the observable outputs (user created in DB, welcome email sent, event logged):
  - Valid new user (happy path)
  - Email already exists (should reject)
  - Invalid email format (should reject)
  - Password too short (should reject)
  - Valid user with special characters in name
- **Target coverage:** Achieve ≥ 80% line coverage on `UserService.registerUser()` before any structural change
- **Commit checkpoint:** `git commit -m "test: Add characterization tests for UserService.registerUser before refactoring"`

### Refactoring Sequence

Apply strictly in this order. Run the full test suite after each step. Do not proceed if any test fails.

---

**Step 1: Extract Method -- Decompose Conditional (Validation)**
- **Target:** Lines inside `registerUser()` that validate email format and password rules
- **Operation:** Extract to private method `validateRegistrationInput(email, password)` returning a `ValidationResult` object (not throwing exceptions yet -- keep behavior identical)
- **Result:** `registerUser()` now calls `validateRegistrationInput()` at the top and checks its result
- **Validation:** The same bad-input characterization tests must still return the same error responses

```python
# Before (inline in registerUser):
import re
if not email or '@' not in email:
    raise ValueError("Invalid email format")
if len(password) < 8:
    raise ValueError("Password must be at least 8 characters")
if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
    raise ValueError("Invalid email format")

# After (extracted method, behavior identical):
def _validate_registration_input(self, email: str, password: str) -> None:
    """Validates email format and password strength. Raises ValueError on failure."""
    import re
    if not email:
        raise ValueError("Email is required")
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        raise ValueError("Invalid email format")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
```

---

**Step 2: Extract Method -- Welcome Email Logic**
- **Target:** All lines in `registerUser()` that construct and send the welcome email
- **Operation:** Extract to private method `_send_welcome_email(user)` -- keep it on UserService for now, behavior is unchanged
- **Result:** `registerUser()` calls `_send_welcome_email(user)` as one line
- **Validation:** The happy-path characterization test confirms the welcome email is still sent

---

**Step 3: Extract Method -- Role Assignment**
- **Target:** Lines that assign the default "member" role to the new user
- **Operation:** Extract to `_assign_default_role(user)`
- **Result:** `registerUser()` is now 15-20 lines with clear named steps

After Steps 1-3, `registerUser()` reads like a high-level algorithm:

```python
def register_user(self, email: str, password: str, name: str) -> User:
    self._validate_registration_input(email, password)
    self._assert_user_does_not_exist(email)
    user = self._create_user_record(email, password, name)
    self._assign_default_role(user)
    self._send_welcome_email(user)
    self._log_registration_event(user)
    return user
```

---

**Step 4: Extract Class -- Move Email Logic to NotificationService**
- **Target:** `_send_welcome_email()` and any other email-related private methods on UserService
- **Operation:**
  1. Create a new class `NotificationService` in `services/notification_service.py`
  2. Move `_send_welcome_email(user)` to `NotificationService.send_welcome_email(user)` as a public method
  3. Inject `NotificationService` into `UserService` via constructor (dependency injection)
  4. Update `UserService.register_user()` to call `self._notification_service.send_welcome_email(user)`
  5. Delete the old private method from `UserService`
- **Result:** Email template changes no longer require touching `UserService` or its tests
- **Validation:** All characterization tests still pass. Add one new unit test for `NotificationService.send_welcome_email()` independently.

```python
# New NotificationService
class NotificationService:
    def __init__(self, email_client: EmailClient, template_renderer: TemplateRenderer):
        self._email_client = email_client
        self._template_renderer = template_renderer

    def send_welcome_email(self, user: User) -> None:
        """Sends welcome email to newly registered user."""
        body = self._template_renderer.render("welcome", {"user_name": user.name})
        self._email_client.send(
            to=user.email,
            subject="Welcome to the platform",
            body=body
        )

# Updated UserService constructor
class UserService:
    def __init__(
        self,
        user_repository: UserRepository,
        notification_service: NotificationService,
        event_logger: EventLogger
    ):
        self._user_repository = user_repository
        self._notification_service = notification_service
        self._event_logger = event_logger
```

---

**Step 5: Extract Class -- Move Validation to UserRegistrationValidator**
- **Target:** `_validate_registration_input()` and any password complexity logic
- **Operation:** Create `UserRegistrationValidator` with a `validate(email, password)` method. This class can later be enhanced with configurable rules without touching UserService.
- **Result:** Validation rules change independently of registration flow
- **Validation:** Bad-input characterization tests still pass. Add isolated unit tests for the validator.

---

**Step 6: Extract Class -- Authentication Separation (Follow-On)**
- **Note:** After completing Steps 1-5, `UserService` should be approximately 80-120 lines handling only registration and basic user lifecycle. Authentication logic (login, token generation, session management) should be extracted to `AuthenticationService` in a subsequent refactoring pass, following the same sequence.

---

### Metrics Impact

| Metric | Before | After (Steps 1-5) | Target |
|--------|--------|-------------------|--------|
| `registerUser` method length | 78 lines | 12 lines | ≤ 20 lines |
| `UserService` total lines | 340 lines | ~120 lines | ≤ 200 lines |
| Cyclomatic complexity of `registerUser` | 11 | 2 | ≤ 5 |
| Number of responsibilities in `UserService` | 4 | 2 (registration + profile) | 1-2 |
| Email test isolation | Impossible | Full mock | Mockable boundary |
| Test coverage (estimated) | ~35% | ~88% | ≥ 80% |

---

### Why Email Template Changes Were Breaking UserService Tests

Before this refactoring, `UserService.registerUser()` directly instantiated (or directly called) the email client, making it impossible to test registration without triggering real email sends. Any change to the template path, variable names, or email library cascaded into `UserService` tests. After extracting `NotificationService` as a dependency injected via constructor, the test for `UserService.register_user()` passes a mock `NotificationService` and asserts only that `send_welcome_email(user)` was called -- it does not care how emails are composed or sent. The `NotificationService` is tested independently with its own template-focused tests.

---

### Follow-On Opportunities Unlocked by This Refactoring

1. **UserRegistrationValidator** can now support pluggable validation rules (e.g., enterprise password policy, disposable email detection) without touching `UserService`
2. **NotificationService** can now support multiple notification channels (SMS, in-app) with a Strategy Pattern without touching registration logic
3. **AuthenticationService** extraction is now straightforward -- the methods to move are clearly identifiable in the smaller `UserService`
4. **User domain events** (`UserRegistered`, `UserLoggedIn`) can be added by having `EventLogger` publish to an event bus -- the seam already exists in `_log_registration_event()`
5. **Integration test speed:** By mocking `NotificationService` and `EventLogger` at the boundary, the registration unit tests no longer need database or email server -- estimated test suite speedup of 3-5x for this module
