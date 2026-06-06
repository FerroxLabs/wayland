---
name: java-modern-idioms
description: |
  Teaches expert-level modern Java patterns: records, sealed classes, pattern matching, text blocks, virtual threads (Project Loom), and modern Stream API usage for Java 21+.
  Use when the user asks about Java records, sealed classes, pattern matching, text blocks, virtual threads, Java 21, modern Java.
  Do NOT use when the user asks about Java project setup (use `java-project-setup`), Java testing (use `java-testing-patterns`), Java concurrency (use `java-concurrency-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "java best-practices clean-code"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Java Modern Idioms

## When to Use

**Use this skill when:**
- The user asks how to model immutable data structures in Java 16+ and wants to avoid verbose POJO boilerplate
- The user wants to express a closed type hierarchy (e.g., a discriminated union, AST node, or result type) and asks about sealed classes or interfaces
- The user is working with Java 21 and wants to use pattern matching in `switch` expressions, `instanceof` checks, or deconstruction patterns
- The user asks about multi-line string literals, embedded SQL/JSON/HTML in Java source, or asks about text blocks introduced in Java 15
- The user wants to run thousands of concurrent tasks efficiently and asks about virtual threads, Project Loom, structured concurrency, or `Thread.ofVirtual()`
- The user asks about modernizing legacy `for`-loop or imperative code using `Stream`, `Collectors`, `flatMap`, `takeWhile`, `dropWhile`, or `Gatherers` (Java 22+)
- The user asks "what's new in Java 21" or "how do I use modern Java features"
- The user wants to write a type-safe, exhaustive `switch` expression over a sealed hierarchy
- The user asks about `SequencedCollection`, `SequencedMap`, or the new collection view APIs added in Java 21

**Do NOT use this skill when:**
- The user is asking how to scaffold a new Maven or Gradle Java project -- use `java-project-setup` instead
- The user is asking about JUnit 5, Mockito, AssertJ, or test architecture -- use `java-testing-patterns` instead
- The user needs `ExecutorService`, `CompletableFuture`, `ForkJoinPool`, lock-free algorithms, or the full `java.util.concurrent` toolkit -- use `java-concurrency-patterns` instead (virtual threads at a conceptual level are covered here; deep scheduling and synchronization belong in `java-concurrency-patterns`)
- The user is asking about Spring Boot, Quarkus, or Micronaut framework-specific configuration -- those have dedicated skills
- The user is asking about Java module system (JPMS) / `module-info.java` -- that is a separate architecture concern
- The user is targeting Java 11 or earlier and cannot upgrade -- most features here require Java 16--21; flag the version gap explicitly

---

## Process

### 1. Identify the Java Version and Feature Availability

- Confirm which Java LTS release the project targets: Java 11 (no modern features), Java 17 (records, sealed, text blocks, pattern `instanceof`), or Java 21 (pattern `switch`, virtual threads, sequenced collections, record patterns)
- Run `java --version` or inspect `pom.xml`/`build.gradle` for `<java.version>`, `sourceCompatibility`, or `toolchain { languageVersion }` to confirm
- If the project is on Java 11 or 17 and the user wants Java 21 features, clearly state what requires an upgrade and what is already available
- Enable preview features only when targeting a non-LTS version; for Java 21 all features discussed here are GA, so `--enable-preview` is not needed
- Check whether the build enforces `--release 21` (preferred over `sourceCompatibility`/`targetCompatibility` split) to guarantee no accidental use of newer APIs

### 2. Model Immutable Data with Records

- Use `record` for any class whose primary purpose is to carry immutable data: DTOs, value objects, API request/response bodies, configuration snapshots
- A record automatically generates: canonical constructor, `equals`/`hashCode` based on all components, `toString`, and component accessor methods named after the field (e.g., `point.x()` not `point.getX()`)
- Add compact canonical constructors (no parameter list) to validate or normalize input:
  ```java
  record EmailAddress(String value) {
      EmailAddress {
          Objects.requireNonNull(value);
          if (!value.contains("@")) throw new IllegalArgumentException("Invalid email: " + value);
          value = value.strip().toLowerCase();
      }
  }
  ```
- Implement custom interfaces on records freely -- records are not just data bags; they can carry behavior
- Do NOT use records when: the object is mutable, the class will be extended (records are implicitly `final`), or JPA/Hibernate requires a no-arg constructor (use a regular class or a `@Embeddable` workaround)
- For nested records, keep component count to 5 or fewer; beyond that consider a builder pattern or named sub-records
- Records can be generic: `record Pair<A, B>(A first, B second) {}` -- use this for small structural tuples in stream pipelines

### 3. Express Closed Hierarchies with Sealed Classes

- Declare a sealed class or interface when the full set of subtypes is known at compile time and exhaustiveness matters:
  ```java
  public sealed interface Shape permits Circle, Rectangle, Triangle {}
  public record Circle(double radius) implements Shape {}
  public record Rectangle(double width, double height) implements Shape {}
  public record Triangle(double base, double height) implements Shape {}
  ```
- Permitted subtypes must be in the same compilation unit (same file) or in the same package and explicitly named in `permits` -- the compiler enforces this
- Use `final` for leaf records/classes, `non-sealed` for subtypes you want to re-open for extension downstream, and `sealed` for intermediate nodes in deeper hierarchies
- Sealed interfaces pair directly with pattern matching `switch` to get compiler-checked exhaustiveness -- this is the primary payoff
- In domain modeling, use sealed interfaces to represent: `Result<T>` (Success/Failure), `Option<T>` (Some/None), event hierarchies, AST nodes, or state machine states
- Avoid using sealed classes purely to restrict inheritance without combining them with pattern matching -- `final` on a concrete class achieves the restriction with less overhead

### 4. Apply Pattern Matching

**`instanceof` pattern:**
- Replace `if (obj instanceof Foo) { Foo f = (Foo) obj; }` with `if (obj instanceof Foo f)` -- the binding variable `f` is scoped to the true-branch
- Use negated pattern matching for early-return guards: `if (!(shape instanceof Circle c)) return 0;`

**`switch` expression with patterns (Java 21 GA):**
- Use `switch` expressions (not statements) to return a value exhaustively:
  ```java
  double area = switch (shape) {
      case Circle c    -> Math.PI * c.radius() * c.radius();
      case Rectangle r -> r.width() * r.height();
      case Triangle t  -> 0.5 * t.base() * t.height();
  };
  ```
- The compiler enforces exhaustiveness over sealed hierarchies -- no `default` needed, and adding a new permitted subtype causes a compile error at every switch site
- Add guards with `when`: `case Circle c when c.radius() > 100 -> handleLargeCircle(c);`
- Use `null` case explicitly rather than relying on `NullPointerException`: `case null -> throw new IllegalArgumentException("shape must not be null");`

**Record patterns (Java 21 GA):**
- Destructure records inline in patterns:
  ```java
  if (event instanceof UserCreated(var id, var email)) {
      auditLog.record(id, email);
  }
  ```
- Nest record patterns for deep deconstruction -- keep nesting to 2 levels maximum for readability
- Record patterns also work inside `switch` case labels

### 5. Use Text Blocks for Multi-line Strings

- Text blocks use `"""` as delimiter; the opening `"""` must be followed by a newline -- no content on the opening line
- Indentation is normalized: the closing `"""` position determines the common indent strip, so align it with the content baseline:
  ```java
  String json = """
          {
              "id": 42,
              "name": "Alice"
          }
          """;
  ```
- Use `\` line continuation to suppress the embedded newline for long SQL without visual wrapping:
  ```java
  String sql = """
          SELECT u.id, u.email \
          FROM users u \
          WHERE u.active = true \
          ORDER BY u.created_at DESC
          """;
  ```
- Text blocks are `String` -- use `String.formatted()` or `formatted()` method reference for interpolation; avoid `String.format()` with long `%s` indexes
- Do NOT use text blocks for short single-line strings -- the three-quote overhead adds no value
- Be aware that text blocks are normalized to LF (`\n`) line endings -- important when generating platform-specific content; use `\r\n` explicitly if needed

### 6. Leverage Virtual Threads for I/O-Bound Concurrency

- Virtual threads are created with `Thread.ofVirtual().start(runnable)` or via `Executors.newVirtualThreadPerTaskExecutor()`
- Each virtual thread is cheap -- startup cost ~1 µs, memory ~few KB -- so creating millions is normal; contrast with platform threads (~1 MB stack, OS scheduling)
- Use virtual threads for any blocking I/O: JDBC queries, HTTP calls, file reads -- the JVM unmounts the virtual thread from the carrier thread during the blocking call
- Do NOT use virtual threads for CPU-bound work -- they still consume carrier thread time and offer no advantage over a fixed-size `ForkJoinPool`
- Avoid `synchronized` blocks around I/O with virtual threads -- pinning causes the carrier thread to block, negating the benefit; use `ReentrantLock` instead:
  ```java
  private final ReentrantLock lock = new ReentrantLock();
  // Inside virtual thread:
  lock.lock();
  try { /* I/O or critical section */ }
  finally { lock.unlock(); }
  ```
- Use `ExecutorService` with `try`-with-resources for structured lifetime management:
  ```java
  try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
      List<Future<Result>> futures = requests.stream()
          .map(req -> executor.submit(() -> fetch(req)))
          .toList();
      // futures resolved before close()
  }
  ```
- For structured concurrency (Java 21 preview, stabilizing in 23+), use `StructuredTaskScope` -- but flag it as preview API requiring `--enable-preview` in Java 21

### 7. Write Idiomatic Stream Pipelines

- Use `Stream.toList()` (Java 16+) instead of `.collect(Collectors.toList())` -- it returns an unmodifiable list and is more concise
- Use `Collectors.teeing()` to produce two independent aggregations in a single pass:
  ```java
  record Stats(long count, double sum) {}
  Stats stats = numbers.stream().collect(
      Collectors.teeing(
          Collectors.counting(),
          Collectors.summingDouble(Double::doubleValue),
          Stats::new
      )
  );
  ```
- Use `takeWhile` and `dropWhile` for ordered streams with early-termination semantics -- they are NOT filtering by predicate across the whole stream; they stop at the first non-matching element
- Use `mapMulti` (Java 16+) instead of `flatMap` when the expansion is conditional and the number of emitted elements per input is small -- it avoids creating intermediate stream objects
- Prefer `Stream.ofNullable(value)` over null checks before streaming a potentially null element
- Collect to `Map` with merge function to handle key collisions: `Collectors.toMap(k, v, (a, b) -> a)` -- omitting the merge function throws `IllegalStateException` on duplicate keys
- Do NOT chain more than 5--6 operations without breaking into named intermediate variables or helper methods -- pipelines are not inherently readable
- Use `Stream.iterate(seed, hasNext, next)` (Java 9+) for generating bounded sequences instead of `for` loops:
  ```java
  Stream.iterate(LocalDate.now(), d -> !d.isAfter(endDate), d -> d.plusDays(1))
      .forEach(this::processDate);
  ```

### 8. Compose Features Together

- Combine sealed interfaces + records + pattern switch as the primary modeling stack for domain logic -- this replaces Visitor pattern in most cases
- A `Result<T>` type built from sealed + records eliminates checked exceptions in stream pipelines:
  ```java
  sealed interface Result<T> permits Result.Ok, Result.Err {
      record Ok<T>(T value) implements Result<T> {}
      record Err<T>(String message, Throwable cause) implements Result<T> {}
  }
  ```
- Use text blocks for test fixtures, not production serialization -- prefer Jackson or Gson for production JSON
- Combine virtual threads + `Stream.toList()` + `Collectors.teeing()` for parallel I/O aggregation without `ForkJoinPool` complexity
- When adding these features to an existing codebase, apply them file-by-file during normal modification cycles -- do not undertake a wholesale rewrite

---

## Output Format

When responding to a user question about modern Java idioms, structure the response as follows:

```
## Feature Assessment

| Feature          | Java Version Required | Project Status | Recommended |
|------------------|-----------------------|----------------|-------------|
| Records          | 16 (GA)               | Available      | Yes         |
| Sealed classes   | 17 (GA)               | Available      | Yes         |
| Pattern switch   | 21 (GA)               | Available      | Yes         |
| Text blocks      | 15 (GA)               | Available      | Yes         |
| Virtual threads  | 21 (GA)               | Available      | Yes (I/O)   |
| Stream::toList   | 16 (GA)               | Available      | Yes         |
| Record patterns  | 21 (GA)               | Available      | Yes         |
| Gatherers        | 22 (preview)          | Upgrade needed | Preview     |

## Pattern: [Name of the pattern being applied]

### Problem
[One sentence: what problem this pattern solves]

### Code -- Before (Legacy Approach)
```java
[concrete before-code with realistic class/method names]
```

### Code -- After (Modern Java Idiom)
```java
[concrete after-code using the modern feature]
```

### Key Observations
- [Specific behavioral difference 1]
- [Specific behavioral difference 2]
- [Compile-time or runtime guarantee gained]
- [When NOT to apply this in this specific case]

## Trade-offs and Constraints

| Concern              | Impact | Mitigation |
|----------------------|--------|------------|
| Serialization        | ...    | ...        |
| Reflection/proxying  | ...    | ...        |
| Team familiarity     | ...    | ...        |
| Library compatibility| ...    | ...        |

## Migration Notes
[Incremental path if applying to existing code]
```

---

## Rules

1. **Never conflate records with JavaBeans.** Records use `point.x()` not `point.getX()`. If a framework (e.g., older Jackson, Hibernate) requires JavaBean naming, configure the framework or use regular classes -- do not add `getX()` methods to a record, which defeats its contract.

2. **Sealed classes require the `permits` clause when subtypes are in different files.** Omitting `permits` when subtypes are not in the same source file causes a compile error. Always name every permitted subtype explicitly; the compiler will warn when a listed subtype no longer exists.

3. **Pattern switch exhaustiveness only applies to sealed hierarchies.** Switching over a non-sealed interface or a plain `Object` requires a `default` arm. Telling the user that pattern switch is exhaustive is only true when the switched type is sealed or is a known set of enum values.

4. **Text block indentation stripping is based on the minimum indent of ALL non-empty lines INCLUDING the closing `"""`.**  Misplacing the closing `"""` is the most common bug -- if it is indented more than the content, extra whitespace is NOT stripped and tests comparing string values will fail.

5. **Virtual threads do NOT improve CPU-bound throughput.** If a user wants to speed up image processing, sorting, or numeric computation with virtual threads, redirect them to `ForkJoinPool` or parallel streams. Virtual threads only help when the bottleneck is blocking I/O wait time.

6. **`synchronized` pinning is a silent performance killer with virtual threads.** Any `synchronized` method or block that contains a blocking call will pin the virtual thread to its carrier thread, blocking it for the full I/O duration. Audit all `synchronized` usages in I/O-touching code and replace with `ReentrantLock` before enabling virtual threads.

7. **Do not use `Stream.parallel()` as a substitute for virtual threads.** Parallel streams use the common `ForkJoinPool` and are designed for CPU-bound decomposition. Mixing parallel streams with blocking I/O starves the pool. Use virtual threads for I/O; use parallel streams or explicit fork-join for CPU work.

8. **Records cannot extend classes (only implement interfaces) and are always `final`.** If a user asks how to make a record extendable, the answer is: redesign using a sealed interface with multiple record implementations, not by trying to extend the record itself.

9. **Pattern matching `when` guards are evaluated after the type check succeeds but are NOT part of exhaustiveness analysis.** A switch that covers all sealed subtypes but adds `when` guards on every arm is NOT exhaustive -- add a `default` or an unguarded fallback arm. Forgetting this causes `MatchException` at runtime.

10. **`Stream.toList()` returns an unmodifiable list; `.collect(Collectors.toList())` returns a modifiable `ArrayList`.** If downstream code calls `.add()` or `.remove()` on the collected list, replacing with `Stream.toList()` will throw `UnsupportedOperationException`. Always verify downstream mutation before making this substitution.

---

## Edge Cases

### Records and Jackson/JSON Serialization
Jackson 2.12+ supports records natively with the `jackson-module-parameter-names` module and `@JsonCreator` on the canonical constructor. For Jackson below 2.12, records are not automatically deserializable -- the workaround is to add `@JsonProperty` on each record component or switch to `@JsonDeserialize(using=...)`. With Spring Boot 2.7+, record serialization works out of the box because the auto-configured `ObjectMapper` includes parameter name discovery. Always verify Jackson version before recommending records for API DTOs.

### JPA Entities Cannot Be Records
Records are `final`, have no no-arg constructor, and have immutable state -- all of which conflict with JPA/Hibernate entity lifecycle requirements (lazy loading proxies, dirty tracking, reflection-based instantiation). The correct approach is to use records as DTOs in the service/presentation layer and map them to/from JPA entity classes. Projections in Spring Data JPA can use interface projections or `@Query` with `new com.example.MyRecord(...)` constructor expressions, which do work with records.

### Sealed Hierarchies Across Module Boundaries
If a sealed interface is in module A and a permitted subtype is in module B, the compiler rejects this -- all permitted subtypes must be in the same module as the sealed type. When designing a multi-module architecture with sealed hierarchies, either: (a) place the sealed type and all subtypes in the same module, or (b) use a non-sealed interface if cross-module extension is genuinely needed. This is a hard constraint, not a style choice.

### Virtual Threads and ThreadLocal Misuse
Code that uses `ThreadLocal` for request-scoped context (e.g., MDC logging, security context, tenant ID) may behave unexpectedly with virtual threads if the thread pool size is very large and the `ThreadLocal` holds large objects -- the per-thread storage multiplies by the number of live virtual threads. Java 21 introduces `ScopedValue` as the preferred alternative: it is immutable, inherited by child threads automatically, and more memory-efficient. When migrating to virtual threads, audit all `ThreadLocal` usages and consider replacing with `ScopedValue.runWhere(SCOPE, value, () -> ...)`.

### Pattern Matching and Null Safety
A `switch` expression with pattern arms throws `NullPointerException` when the switched expression is `null` unless an explicit `case null` arm is present. This is a breaking behavior difference from traditional `switch` on strings or enums (which also threw NPE on null -- so behavior is consistent, but users are often surprised). Always add `case null` or validate nullability before the switch. This is especially important in code migrated from if-elsif chains where null was handled by a prior guard.

### Text Blocks and Indentation in IDEs
Auto-formatters (IntelliJ IDEA, Eclipse) may re-indent text block content when the file is formatted, inadvertently changing the string value by shifting the content relative to the closing `"""`. Configure the formatter to treat text blocks as "protected regions" or use `.stripIndent()` programmatically when the exact whitespace is computed at runtime. For SQL in particular, test the exact string value in a unit test by comparing `actual.trim()` to the expected value to catch formatter-induced drift.

### Exhaustiveness with `--enable-preview` Features
Some pattern matching features that are preview in Java 21 (e.g., primitive patterns, unnamed patterns with `_`) are fully GA in Java 23. If the user's project has `--enable-preview` enabled on Java 21, they may have written code using `_` as an unnamed variable -- this becomes a reserved identifier in Java 22+. Flag this as a migration risk: unnamed variables using `_` require no changes in Java 23 where they are GA, but the syntax stabilized between preview versions.

### Performance of Pattern Switch vs. Traditional Dispatch
Pattern switch compiles to `invokedynamic` with a generated type-check cascade -- it is NOT compiled to a jump table the way integer `switch` is. For hot paths switching over large sealed hierarchies (20+ subtypes), benchmark against a virtual dispatch approach (polymorphic method calls). In practice, sealed hierarchies with fewer than 10 subtypes show negligible overhead. For hierarchies with 10--20+ subtypes, measure with JMH before choosing pattern switch over polymorphism.

---

## Example

**Input:** "I'm building a payment processing domain model in Java 21. We have three payment methods: CreditCard, BankTransfer, and CryptoCurrency. I need to calculate fees, validate each type differently, and log them for audit. How do I model this using modern Java idioms?"

**Output:**

## Feature Assessment

| Feature         | Java Version Required | Project Status | Recommended      |
|-----------------|-----------------------|----------------|------------------|
| Records         | 16 (GA)               | Java 21 -- yes  | Yes              |
| Sealed classes  | 17 (GA)               | Java 21 -- yes  | Yes              |
| Pattern switch  | 21 (GA)               | Java 21 -- yes  | Yes              |
| Text blocks     | 15 (GA)               | Java 21 -- yes  | Yes (audit logs) |
| Virtual threads | 21 (GA)               | Java 21 -- yes  | Yes (I/O calls)  |

---

## Pattern: Sealed Interface + Records for Payment Domain Modeling

### Problem
Payment methods have different fields and validation rules. Traditional approaches use inheritance with abstract classes or a single fat class with nullable fields and `instanceof` chains -- both are error-prone and non-exhaustive.

### Code -- Before (Legacy Approach)
```java
public class Payment {
    private String type; // "CREDIT_CARD", "BANK_TRANSFER", "CRYPTO"
    private String cardNumber;    // null for non-credit-card
    private String iban;          // null for non-bank-transfer
    private String walletAddress; // null for non-crypto
    private BigDecimal amount;

    public double calculateFee() {
        if ("CREDIT_CARD".equals(type)) {
            return amount.doubleValue() * 0.029 + 0.30;
        } else if ("BANK_TRANSFER".equals(type)) {
            return 0.25;
        } else if ("CRYPTO".equals(type)) {
            return amount.doubleValue() * 0.01;
        }
        throw new IllegalStateException("Unknown type: " + type);
    }
}
```
Problems: no compile-time exhaustiveness, nullable fields for all possible sub-types, adding a new type requires hunting through every `if`-chain.

### Code -- After (Modern Java Idiom)
```java
// domain/payment/PaymentMethod.java
public sealed interface PaymentMethod permits CreditCardPayment, BankTransferPayment, CryptoPayment {}

// Each record validates its own invariants in the compact constructor
public record CreditCardPayment(
    String maskedPan,       // e.g. "****-****-****-4242"
    String holderName,
    YearMonth expiry,
    BigDecimal amount
) implements PaymentMethod {
    public CreditCardPayment {
        Objects.requireNonNull(maskedPan, "maskedPan");
        Objects.requireNonNull(holderName, "holderName");
        Objects.requireNonNull(expiry, "expiry");
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("amount must be positive");
        if (!maskedPan.matches("\\*{4}-\\*{4}-\\*{4}-\\d{4}"))
            throw new IllegalArgumentException("maskedPan must be in format ****-****-****-NNNN");
        if (expiry.isBefore(YearMonth.now()))
            throw new IllegalArgumentException("Card is expired: " + expiry);
    }
}

public record BankTransferPayment(
    String iban,
    String bic,
    BigDecimal amount
) implements PaymentMethod {
    public BankTransferPayment {
        Objects.requireNonNull(iban, "iban");
        Objects.requireNonNull(bic, "bic");
        if (amount == null || amount.compareTo(new BigDecimal("0.01")) < 0)
            throw new IllegalArgumentException("Minimum bank transfer is 0.01");
        // IBAN basic format check (full Luhn validation would be a utility call)
        if (iban.length() < 15 || iban.length() > 34)
            throw new IllegalArgumentException("Invalid IBAN length: " + iban.length());
    }
}

public record CryptoPayment(
    String walletAddress,
    String networkSymbol,  // e.g., "ETH", "BTC"
    BigDecimal amount
) implements PaymentMethod {
    public CryptoPayment {
        Objects.requireNonNull(walletAddress, "walletAddress");
        Objects.requireNonNull(networkSymbol, "networkSymbol");
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("amount must be positive");
        if (!Set.of("BTC", "ETH", "USDC", "SOL").contains(networkSymbol))
            throw new IllegalArgumentException("Unsupported network: " + networkSymbol);
    }
}
```

```java
// service/FeeCalculator.java
public class FeeCalculator {

    private static final BigDecimal CREDIT_CARD_RATE = new BigDecimal("0.029");
    private static final BigDecimal CREDIT_CARD_FIXED = new BigDecimal("0.30");
    private static final BigDecimal BANK_TRANSFER_FLAT = new BigDecimal("0.25");
    private static final BigDecimal CRYPTO_RATE = new BigDecimal("0.01");

    // Compiler enforces exhaustiveness -- adding a new PaymentMethod subtype
    // causes a compile error HERE, forcing the developer to handle the new case.
    public BigDecimal calculateFee(PaymentMethod payment) {
        return switch (payment) {
            case CreditCardPayment cc ->
                cc.amount().multiply(CREDIT_CARD_RATE).add(CREDIT_CARD_FIXED)
                    .setScale(2, RoundingMode.HALF_UP);
            case BankTransferPayment bt ->
                bt.amount().compareTo(new BigDecimal("1000")) >= 0
                    ? BigDecimal.ZERO   // fee waived for large transfers
                    : BANK_TRANSFER_FLAT;
            case CryptoPayment cp ->
                cp.amount().multiply(CRYPTO_RATE).setScale(8, RoundingMode.HALF_UP);
        };
    }
}
```

```java
// service/AuditLogger.java
public class AuditLogger {

    // Text block for structured audit entry -- indentation stripped to content baseline
    private static final String AUDIT_TEMPLATE = """
            {
                "timestamp": "%s",
                "type": "%s",
                "identifier": "%s",
                "amount": %s,
                "fee": %s
            }
            """;

    public String buildAuditEntry(PaymentMethod payment, BigDecimal fee, Instant timestamp) {
        // Record pattern deconstruction in switch -- extracts fields inline
        return switch (payment) {
            case CreditCardPayment(var pan, var holder, var expiry, var amount) ->
                AUDIT_TEMPLATE.formatted(timestamp, "CREDIT_CARD", pan, amount, fee);
            case BankTransferPayment(var iban, var bic, var amount) ->
                AUDIT_TEMPLATE.formatted(timestamp, "BANK_TRANSFER",
                    iban.substring(0, 6) + "****", amount, fee);
            case CryptoPayment(var wallet, var network, var amount) ->
                AUDIT_TEMPLATE.formatted(timestamp, "CRYPTO_" + network,
                    wallet.substring(0, 8) + "...", amount, fee);
        };
    }
}
```

```java
// service/PaymentProcessor.java -- virtual threads for I/O-bound processing
public class PaymentProcessor {

    private final FeeCalculator feeCalculator = new FeeCalculator();
    private final AuditLogger auditLogger = new AuditLogger();
    private final PaymentGatewayClient gatewayClient; // hypothetical blocking HTTP client

    public PaymentProcessor(PaymentGatewayClient gatewayClient) {
        this.gatewayClient = gatewayClient;
    }

    public List<PaymentResult> processAll(List<PaymentMethod> payments) {
        // Virtual thread per task -- safe because gatewayClient.submit() is blocking I/O
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            return payments.stream()
                .map(payment -> executor.submit(() -> processSingle(payment)))
                .toList()                          // Stream.toList() -- unmodifiable, Java 16+
                .stream()
                .map(future -> {
                    try { return future.get(); }
                    catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException(e);
                    } catch (ExecutionException e) {
                        throw new RuntimeException(e.getCause());
                    }
                })
                .toList();
        }
    }

    private PaymentResult processSingle(PaymentMethod payment) {
        BigDecimal fee = feeCalculator.calculateFee(payment);
        // This blocking HTTP call unmounts the virtual thread from carrier thread
        GatewayResponse response = gatewayClient.submit(payment);
        String auditEntry = auditLogger.buildAuditEntry(payment, fee, Instant.now());
        return new PaymentResult(response.transactionId(), fee, auditEntry);
    }
}

// Simple result record
record PaymentResult(String transactionId, BigDecimal fee, String auditJson) {}
```

### Key Observations
- Adding a fourth payment method (e.g., `WalletPayment`) causes compile errors in `FeeCalculator.calculateFee()` and `AuditLogger.buildAuditEntry()` -- exhaustiveness is compiler-enforced, not convention-enforced
- Each record validates its own domain constraints in the compact constructor, so a `CreditCardPayment` with an expired card cannot be constructed -- invalid state is impossible, not just checked
- The text block in `AuditLogger` has its closing `"""` at 12 spaces of indentation, matching the content indentation -- this strips exactly those 12 characters from each line
- `Stream.toList()` is used instead of `.collect(Collectors.toList())` -- the result list is unmodifiable, which is correct here since no downstream mutation is needed
- Virtual threads handle the `gatewayClient.submit()` blocking call; the carrier thread is freed during I/O wait, allowing thousands of simultaneous payment submissions without a large platform thread pool

## Trade-offs and Constraints

| Concern                  | Impact                                     | Mitigation                                                      |
|--------------------------|--------------------------------------------|-----------------------------------------------------------------|
| Jackson deserialization  | Records need Jackson 2.12+ or `@JsonCreator` | Verify Jackson version; add `jackson-module-parameter-names`    |
| JPA / Hibernate          | Records cannot be JPA entities             | Use records as DTOs only; map to/from JPA entity classes        |
| Mocking in tests         | Records are final; Mockito cannot subclass | Use real instances (records are cheap to construct) or interfaces |
| Team familiarity         | Pattern switch may be unfamiliar           | Code review with inline comments; link to JEP 441 in team wiki  |
| Serialization (Java)     | `record` serialization is serial-version sensitive | Define `serialVersionUID` if using Java serialization; prefer JSON |

## Migration Notes
- If starting from the legacy `Payment` class: introduce the `sealed interface PaymentMethod` first, then migrate one subtype at a time (starting with `CreditCardPayment`), running the existing test suite after each record extraction
- Replace the fee `if`-chain with the pattern `switch` only after all three records are in place -- the compiler will signal any missing cases
- Enable virtual threads in `processAll()` only after confirming that `gatewayClient` does not use `synchronized` blocks around its socket I/O; if it does, update it to use `ReentrantLock` first
- `AuditLogger` text block can be introduced independently of the sealed hierarchy changes -- it is purely a string formatting improvement and carries no behavior change
