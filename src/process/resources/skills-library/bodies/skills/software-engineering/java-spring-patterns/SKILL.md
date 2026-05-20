---
name: java-spring-patterns
description: |
  Guides expert-level Spring Boot 3.x development: dependency injection patterns, auto-configuration, actuator, configuration properties, and idiomatic Spring architecture.
  Use when the user asks about Spring Boot, dependency injection, Spring configuration, actuator, Spring Boot 3.x, Spring patterns.
  Do NOT use when the user asks about Java project setup (use `java-project-setup`), Java testing (use `java-testing-patterns`), Java concurrency (use `java-concurrency-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "java backend frameworks"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Java Spring Patterns

## When to Use

**Use this skill when:**
- The user asks how to wire dependencies in a Spring Boot 3.x application -- choosing between constructor injection, field injection, or `@Autowired` setter injection
- The user is designing or refactoring a Spring Boot service layer and needs guidance on `@Service`, `@Component`, `@Repository`, `@Controller`, or `@RestController` semantics
- The user needs to create or understand custom auto-configuration, condition annotations (`@ConditionalOnProperty`, `@ConditionalOnMissingBean`, `@ConditionalOnClass`), or Spring Boot starters
- The user is configuring `@ConfigurationProperties` classes, environment-specific profiles, or externalized configuration with validation
- The user wants to expose or customize Spring Boot Actuator endpoints, health indicators, or metrics via Micrometer
- The user asks about `ApplicationContext` lifecycle, `BeanDefinition` scopes, or how to hook into startup/shutdown phases
- The user is working with `@SpringBootApplication` structure, component scanning boundaries, or modular Spring architecture
- The user needs to debug auto-configuration conflicts, bean definition overriding, or circular dependency issues
- The user asks about Spring Boot 3.x migration from 2.x -- namespace changes, Jakarta EE migration, or AOT compilation

**Do NOT use this skill when:**
- The user is setting up a new Java project from scratch, selecting build tools, or configuring Maven/Gradle (use `java-project-setup`)
- The user is writing Spring Boot tests with `@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest`, or MockMvc (use `java-testing-patterns`)
- The user is asking about virtual threads, `CompletableFuture`, `synchronized`, or reactive programming concurrency patterns (use `java-concurrency-patterns`)
- The user's question is primarily about Spring Data JPA entity modeling, query derivation, or transaction management beyond basic `@Transactional` boundaries
- The user is asking about Spring Security filter chains, OAuth2 resource servers, or authentication configuration specifically

---

## Process

### 1. Identify the Specific Spring Pattern Problem

Before writing any code, determine exactly which Spring subsystem the user is working in:

- **Dependency Injection:** Is this about wiring (constructor vs. field vs. setter), bean lifecycle, scope, or qualifiers?
- **Configuration:** Is this about `application.properties` / `application.yml` binding, profile activation, or custom property sources?
- **Auto-configuration:** Is this about Spring Boot's auto-configuration mechanism, creating a starter, or debugging `ConditionEvaluationReport`?
- **Actuator:** Is this about health endpoints, custom metrics, custom endpoints, or securing the actuator?
- **Architecture:** Is this about layering, component boundary design, or the fat-service anti-pattern?

Ask the user for: the Spring Boot version (3.0, 3.1, 3.2, 3.3+), the build tool (Maven or Gradle), whether this is a new project or a migration, and any relevant error messages or stack traces.

---

### 2. Assess Dependency Injection Design

Evaluate how beans are being wired and recommend the canonical Spring approach:

- **Constructor injection is mandatory for required dependencies.** It makes dependencies explicit, enables immutability (`final` fields), and allows unit testing without a Spring context. Use Lombok's `@RequiredArgsConstructor` to eliminate boilerplate while keeping fields `final`.
- **`@Autowired` on constructors is redundant in Spring 4.3+** when there is exactly one constructor -- omit it. With multiple constructors, annotate the one to use.
- **Field injection (`@Autowired` on fields) is a code smell** in production code. It hides dependencies, breaks immutability, and makes unit testing require reflection. Flag it and refactor it.
- **Setter injection** is appropriate only for optional dependencies where a sensible default exists without the dependency. Use `@Autowired(required = false)` with a null-safe guard.
- **Qualifier disambiguation:** When multiple beans satisfy an injection point, use `@Qualifier("beanName")` or create a custom qualifier annotation. Avoid relying solely on bean name matching in large codebases.
- **`@Primary`** marks a default implementation when multiple beans of the same type exist -- use it on the production implementation when a test double will override it with `@MockBean`.

---

### 3. Design the Configuration Properties Layer

Map externalized configuration correctly using `@ConfigurationProperties`:

- **Create a dedicated `@ConfigurationProperties` class** (not `@Value` scattered in service classes) for any group of 3+ related properties. Annotate with `@ConfigurationProperties(prefix = "app.myfeature")`.
- **Enable validation** by adding `@Validated` to the properties class and JSR-303 annotations (`@NotBlank`, `@NotNull`, `@Min`, `@Max`, `@Pattern`) on fields. Spring Boot will fail fast at startup if configuration is invalid.
- **Register the class** either with `@EnableConfigurationProperties(MyFeatureProperties.class)` on a `@Configuration` class, or annotate it with `@Component` directly. Prefer `@EnableConfigurationProperties` in library/starter code to avoid unwanted component scanning.
- **Use records** (Java 16+, idiomatic in Spring Boot 3.x) for immutable configuration: `public record MyFeatureProperties(@NotBlank String apiUrl, @Min(1) int maxRetries) {}` with the `@ConfigurationProperties` annotation.
- **Profile-specific overrides:** Use `application-{profile}.yml` files. Activate profiles via `spring.profiles.active` environment variable in production -- never in `application.yml` itself. Use `spring.config.activate.on-profile` within a YAML document for document-specific activation.
- **Never put secrets in properties files.** Use environment variable binding (`${MY_SECRET}` syntax) or integrate with a secrets manager (Vault, AWS Secrets Manager) via Spring Cloud Config.

---

### 4. Apply Correct Bean Scopes and Lifecycle Hooks

Choose the right bean scope for each component:

- **`@Singleton` (default):** 99% of Spring beans. Stateless services, repositories, configuration holders. Never store mutable per-request state in a singleton bean.
- **`@RequestScoped`:** Components that need per-HTTP-request state. Requires a web context. Use proxy mode: `@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)`.
- **`@SessionScoped`:** Per-user session state in stateful web apps. Rarely appropriate in modern REST APIs.
- **`@Prototype`:** A new instance every time the bean is requested. Use for stateful processors, builders, or objects that maintain mutable computation state. Note: Spring does **not** manage the lifecycle of prototype beans after creation -- `@PreDestroy` is never called.
- **Lifecycle hooks:**
  - `@PostConstruct`: Runs after dependency injection. Use for initialization logic (cache warming, connection validation). Annotate a `void` method with no arguments.
  - `@PreDestroy`: Runs before the bean is destroyed. Use for resource cleanup (closing connections, flushing buffers).
  - `SmartLifecycle` / `ApplicationListener<ContextRefreshedEvent>`: Use when ordering of startup initialization across beans matters. `SmartLifecycle.getPhase()` returns an int; lower numbers start first.
  - `CommandLineRunner` and `ApplicationRunner`: Execute code after the `ApplicationContext` is fully started. Use for CLI tasks or startup validation checks. `ApplicationRunner` receives `ApplicationArguments` (richer); `CommandLineRunner` receives `String[]`.

---

### 5. Structure Auto-Configuration and Starters

When building reusable library code or internal platform starters:

- **Create an auto-configuration class** annotated with `@AutoConfiguration` (Spring Boot 3.x) -- never `@Configuration` alone for auto-config. Place it in a separate `autoconfigure` module.
- **Register it in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`** (Spring Boot 3.x replaces the `spring.factories` approach from 2.x). Each line is a fully qualified auto-configuration class name.
- **Guard with conditions:**
  - `@ConditionalOnClass(SomeClass.class)` -- only activate if a class is on the classpath
  - `@ConditionalOnMissingBean(SomeService.class)` -- back off if the user has provided their own implementation
  - `@ConditionalOnProperty(prefix = "app.feature", name = "enabled", havingValue = "true", matchIfMissing = false)` -- opt-in features
  - `@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)` -- servlet vs. reactive environments
- **Ordering:** Use `@AutoConfigureAfter(DataSourceAutoConfiguration.class)` and `@AutoConfigureBefore` to express dependencies between auto-configurations.
- **Debug auto-configuration decisions** by running with `--debug` flag or setting `logging.level.org.springframework.boot.autoconfigure=DEBUG`. The `ConditionEvaluationReport` shows exactly why each auto-configuration was matched or excluded.
- **Exclude auto-configurations** at the application level via `@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})` or via `spring.autoconfigure.exclude` property.

---

### 6. Expose and Customize Spring Boot Actuator

Actuator provides production-readiness out of the box -- configure it correctly:

- **Add dependency:** `spring-boot-starter-actuator`. In Spring Boot 3.x, all endpoints except `health` and `info` are disabled by default over HTTP. Enable explicitly: `management.endpoints.web.exposure.include=health,info,metrics,prometheus`.
- **Health indicators:**
  - Built-in: `DiskSpaceHealthIndicator`, `DataSourceHealthIndicator`, `RedisHealthIndicator` -- auto-configured when dependencies are present.
  - Custom: Implement `HealthIndicator` interface, return `Health.up()`, `Health.down()`, or `Health.unknown()` with detail map entries. Annotate with `@Component`. The bean name (minus "HealthIndicator" suffix) becomes the health group key.
  - **Never expose internal system details in health responses publicly.** Use `management.endpoint.health.show-details=when-authorized`.
- **Separate management port:** Set `management.server.port=8081` to expose actuator on a different port -- prevents actuator traffic from consuming application thread pool and allows firewall rules to isolate management traffic.
- **Custom Actuator endpoints:** Annotate a class with `@Endpoint(id = "myendpoint")`. Use `@ReadOperation` (maps to GET), `@WriteOperation` (POST), `@DeleteOperation` (DELETE). Parameters are automatically bound. Register as a `@Component`.
- **Micrometer metrics:** Spring Boot auto-configures a `MeterRegistry`. Inject it and use `Counter`, `Timer`, `Gauge`, `DistributionSummary`. Name metrics with dot-separated lowercase words following Micrometer conventions: `app.orders.processed`, `app.payment.duration.seconds`. Add tags for dimensions: `registry.counter("app.orders.processed", "status", "success")`.
- **Liveness vs. Readiness probes:** In Kubernetes environments, enable `management.health.livenessState.enabled=true` and `management.health.readinessState.enabled=true`. Liveness failure restarts the pod; readiness failure removes it from load balancer rotation. Use `ApplicationAvailability` bean to programmatically change readiness state during graceful shutdown.

---

### 7. Apply Idiomatic Spring Architecture Patterns

Structure the application in layers with clear responsibilities:

- **Layered architecture:**
  - `@RestController` -- HTTP boundary. Only handles request/response mapping, input validation (`@Valid`), and exception translation. No business logic.
  - `@Service` -- Business logic, orchestration, transaction boundaries. A service method is a unit of business work.
  - `@Repository` -- Data access. Spring Data repositories or custom DAO implementations. `@Repository` triggers exception translation (converts JPA/JDBC exceptions to Spring's `DataAccessException` hierarchy).
  - Do not skip layers to call `@Repository` directly from `@RestController`. The bypassed service layer means no transaction boundary and no business rule enforcement.
- **`@Transactional` placement:** Put `@Transactional` on the service method that defines the business unit of work, not on repositories (already transactional in Spring Data) and not on controllers. Default propagation is `REQUIRED`. Use `readOnly = true` for query-only methods -- it hints the JPA provider to skip dirty checking and can use a read replica.
- **Event-driven decoupling within the application:** Use `ApplicationEventPublisher` to publish domain events from the service layer and `@EventListener` (or `@TransactionalEventListener` for post-commit events) in other components. This decouples cross-cutting concerns (auditing, notifications) from business logic without adding a message broker.
- **Avoid circular dependencies** by reviewing component responsibilities. If A depends on B and B depends on A, extract a third component C that holds the shared logic both need, or use `ApplicationEventPublisher` to invert one direction.
- **`@SpringBootApplication` placement:** Put it in the root package of your application (e.g., `com.example.myapp`). Component scanning covers all sub-packages automatically. Avoid placing it in `com.example` alone (too broad) or a sub-package (leaves sibling packages unscanned).

---

### 8. Validate and Debug the Spring Context

Before declaring the implementation complete, verify correctness:

- **Check startup logs** for `WARN` level messages about bean overriding, deprecated configuration keys, or failed condition evaluations.
- **Run with `--debug`** once to review the `ConditionEvaluationReport` and confirm expected auto-configurations are active.
- **Validate `@ConfigurationProperties`** by intentionally setting an invalid value and confirming startup fails with a descriptive `BindException`.
- **Check Actuator `/actuator/beans`** endpoint (enable it temporarily) to verify the complete bean graph and confirm expected beans are registered with correct scope.
- **Test injection without Spring context:** Constructor-injected beans can be unit-tested by passing mock objects directly without `@SpringBootTest`, reducing test time from seconds to milliseconds.
- **Use `@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)`** for integration tests that only need the application context without an embedded server -- faster than `RANDOM_PORT`.
- **Detect circular dependencies early:** Spring Boot 2.6+ sets `spring.main.allow-circular-references=false` by default. Fix circular dependencies rather than enabling this property.

---

## Output Format

When responding to a Spring patterns question, structure the output as follows:

```
## Spring Pattern Analysis

### Context
- Spring Boot version: [3.x.x]
- Pattern category: [DI / Configuration / Auto-configuration / Actuator / Architecture]
- Problem being solved: [one sentence]

### Recommendation

[Pattern name and rationale -- 2-3 sentences explaining WHY this approach]

### Implementation

#### Configuration / Properties
```yaml
# application.yml
app:
  my-feature:
    enabled: true
    max-retries: 3
    api-url: https://api.example.com
```

#### Java Code
```java
// Annotated, production-ready code with explanatory comments
```

### Trade-off Matrix

| Approach | Pros | Cons | Use When |
|---|---|---|---|
| [approach 1] | [specific pros] | [specific cons] | [context] |
| [approach 2] | [specific pros] | [specific cons] | [context] |

### Common Mistakes to Avoid
- [mistake 1 specific to this pattern]
- [mistake 2 specific to this pattern]

### Related Patterns
- [pattern name]: relevant when [condition]
```

---

## Rules

1. **ALWAYS use constructor injection for required dependencies.** Field injection produces hidden coupling, breaks immutability, and requires Spring reflection to test. If you see `@Autowired` on a field in production code, refactor it.

2. **NEVER place business logic in `@RestController` classes.** Controllers are HTTP adapters. Anything beyond deserializing input, calling a service, and serializing output belongs in a `@Service`. Violating this makes logic untestable without an HTTP stack.

3. **ALWAYS prefer `@ConfigurationProperties` over scattered `@Value` annotations** for any group of related properties. `@Value` is acceptable for a single, isolated property but becomes unmaintainable at scale. `@ConfigurationProperties` classes are self-documenting and support IDE autocompletion via `spring-boot-configuration-processor`.

4. **NEVER use `@SpringBootTest` when a narrower slice test will work.** `@SpringBootTest` loads the full application context (10+ seconds). `@WebMvcTest`, `@DataJpaTest`, and `@JsonTest` load only the relevant slice (under 2 seconds). Reserve `@SpringBootTest` for true end-to-end integration tests.

5. **ALWAYS annotate auto-configuration classes with `@AutoConfiguration`, not `@Configuration`.** In Spring Boot 3.x, `@AutoConfiguration` is a distinct meta-annotation that properly marks the class for the new `AutoConfiguration.imports` registration mechanism and handles ordering correctly.

6. **NEVER allow `spring.main.allow-circular-references=true` in production code.** Circular dependencies signal design problems -- two components that need each other indicate a missing abstraction or a misassigned responsibility. Fix the design.

7. **ALWAYS separate the Actuator management port from the application port in production** using `management.server.port`. Exposing `/actuator` on the same port as the application API means external clients could reach internal management endpoints if firewall rules are misconfigured.

8. **NEVER use `@Profile` annotations on beans as the primary mechanism for feature toggling.** Profile-based bean swapping requires application restart. Use `@ConditionalOnProperty` for auto-configurations and feature flags backed by configuration values that can be overridden at startup.

9. **ALWAYS add `@Validated` to `@ConfigurationProperties` classes and JSR-303 constraints on fields.** Without validation, invalid configuration (wrong types, missing required values, out-of-range numbers) causes `NullPointerException` or `IllegalArgumentException` deep in business logic, far from the configuration source. Fail at startup with a clear message instead.

10. **NEVER mix the Jakarta EE and Java EE namespaces in Spring Boot 3.x projects.** Spring Boot 3.x requires Jakarta EE 9+ (`jakarta.*` packages). Any dependency still using `javax.persistence`, `javax.servlet`, or `javax.validation` will cause runtime failures. Use the Spring Boot 3.x migration guide and the OpenRewrite `UpgradeSpringBoot_3_0` recipe to detect and fix these systematically.

---

## Edge Cases

### Circular Dependency Between Two Services

**Scenario:** `OrderService` depends on `PaymentService`, and `PaymentService` depends on `OrderService` for order lookup.

**Handling:**
- Do not enable `spring.main.allow-circular-references=true`. This masks the design problem and increases the risk of subtle initialization-order bugs.
- Extract the shared data access concern into a dedicated `OrderQueryService` (or use the `@Repository` directly in `PaymentService` for read operations, since repositories are not business services).
- Alternatively, introduce an `ApplicationEventPublisher`: `OrderService` publishes `PaymentRequestedEvent`, and `PaymentService` handles it via `@EventListener`. This inverts one dependency direction and eliminates the cycle while decoupling the components.
- Use `@Lazy` on one injection point only as a last resort in legacy migration, never in greenfield code. Document why with a TODO for the actual refactor.

---

### Multiple Implementations of the Same Interface

**Scenario:** An application has `NotificationService` interface with `EmailNotificationService`, `SmsNotificationService`, and `PushNotificationService` implementations. A `UserService` needs to send notifications.

**Handling:**
- Inject `List<NotificationService>` in `UserService` -- Spring automatically collects all beans implementing the interface into an ordered list. Control order with `@Order(1)` annotations or `Ordered` interface.
- Use `Map<String, NotificationService>` injection to get a map keyed by bean name -- useful for strategy-pattern dispatch: `notificationServices.get("emailNotificationService").send(...)`.
- If only one implementation should be active, use `@ConditionalOnProperty(prefix = "app.notifications", name = "channel", havingValue = "email")` on each implementation.
- Use `@Primary` to designate the default when injecting a single `NotificationService` -- but always document why one is primary.

---

### Custom Auto-Configuration Not Being Picked Up

**Scenario:** A Spring Boot starter's auto-configuration class is present on the classpath but not applying.

**Handling:**
- In Spring Boot 3.x, verify the file `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` exists in the starter JAR and contains the fully qualified class name. The old `META-INF/spring.factories` file under `EnableAutoConfiguration` key is no longer used for auto-configuration.
- Run the application with `--debug` and search the `ConditionEvaluationReport` output for the auto-configuration class name. It will appear under "negative matches" with the reason for exclusion.
- Common causes: a `@ConditionalOnClass` reference to a class that is not on the classpath, a `@ConditionalOnMissingBean` that found a user-defined bean, or a `@ConditionalOnProperty` where the property was not set.
- Check for `@SpringBootApplication(exclude = ...)` or `spring.autoconfigure.exclude` property accidentally including the class.

---

### ConfigurationProperties Binding Failures

**Scenario:** Application fails to start with `BindException` or properties are silently null despite being set in `application.yml`.

**Handling:**
- **`BindException` at startup:** This is the correct behavior when `@Validated` is present. Read the exception message -- it specifies the exact property path and constraint violated. Fix the configuration value, not the constraint.
- **Silent null values:** Check YAML indentation. YAML is indentation-sensitive; a misaligned property becomes a sibling rather than a child, so the prefix path does not match. Use a YAML linter.
- **Camelcase vs. kebab-case:** Spring Boot's relaxed binding maps `app.myFeature.apiUrl`, `app.my-feature.api-url`, and `APP_MY_FEATURE_API_URL` to the same field. Prefer `kebab-case` in YAML and `SCREAMING_SNAKE_CASE` for environment variables.
- **`@ConfigurationProperties` not registered:** If neither `@EnableConfigurationProperties` nor `@Component` is present on the class, it will not be bound. Verify registration.
- **Records:** When using Java records for `@ConfigurationProperties`, ensure the constructor parameters exactly match the property names (after relaxed binding normalization).

---

### Spring Boot 2.x to 3.x Migration Issues

**Scenario:** Existing Spring Boot 2.x application is being upgraded to 3.x and encountering `ClassNotFoundException` or unexpected auto-configuration behavior.

**Handling:**
- **Jakarta namespace migration:** Replace all `javax.persistence.*` imports with `jakarta.persistence.*`, `javax.servlet.*` with `jakarta.servlet.*`, `javax.validation.*` with `jakarta.validation.*`. Use the OpenRewrite `UpgradeSpringBoot_3_0` recipe to automate this across the codebase.
- **`spring.factories` for auto-configuration is no longer scanned** for `EnableAutoConfiguration`. Migrate to `AutoConfiguration.imports` immediately.
- **`@ConstructorBinding` is no longer required** on `@ConfigurationProperties` record types or classes with a single constructor -- remove it to avoid confusion.
- **Management endpoint defaults changed:** In 3.x, only `health` is exposed over HTTP by default. Explicitly re-enable any endpoints your monitoring depends on.
- **`HttpMethod` changed from `String`-backed enum to a class in Spring 6 (Spring Boot 3.x).** Any `switch` statements on `HttpMethod` must be updated.
- Run the complete test suite after each incremental upgrade step (2.7 -> 3.0 -> 3.1 -> ...) rather than jumping multiple major versions.

---

### AOT Compilation and GraalVM Native Image

**Scenario:** Application is being compiled to a GraalVM native image using Spring Boot 3.x's AOT (ahead-of-time) processing.

**Handling:**
- Spring Boot 3.x's AOT engine generates source code, bytecode, and resource hints at build time. Run `mvn spring-boot:process-aot` (Maven) or `./gradlew processAot` (Gradle) to see generated code before attempting native compilation.
- **Reflection-based code breaks native images.** Any use of `Class.forName()`, `Method.invoke()`, or framework features relying on runtime reflection (e.g., some `@ConfigurationProperties` binders, JAXB, certain serializers) requires explicit `RuntimeHintsRegistrar` beans or `@RegisterReflectionForBinding` annotations.
- **Dynamic bean registration** (e.g., `BeanDefinitionRegistryPostProcessor` adding beans programmatically at runtime) may not be supported in AOT mode. Move to `@Bean` methods where possible.
- **`spring.aot.enabled=true`** in tests verifies AOT compatibility without a full native build, catching issues faster.
- Prototype-scoped beans and `@Scope("request")` beans require special AOT hints -- verify these work correctly in the AOT test run before committing to a native image build.

---

### Actuator Health Check Failures Under Load

**Scenario:** Kubernetes liveness probe is hitting `/actuator/health/liveness` and timing out or returning DOWN during high traffic, causing unnecessary pod restarts.

**Handling:**
- Liveness and readiness are separate concerns. Liveness (`/actuator/health/liveness`) should only reflect whether the application process is alive and not deadlocked -- it should almost never return DOWN unless the JVM is truly broken. Do not add database connectivity checks to the liveness group.
- Readiness (`/actuator/health/readiness`) reflects whether the application can serve traffic. Include dependency checks (database, cache, downstream services) here. A DOWN readiness removes the pod from load balancing without restarting it.
- Configure health groups explicitly:
  ```yaml
  management:
    endpoint:
      health:
        group:
          readiness:
            include: db,redis,diskSpace
          liveness:
            include: livenessState
  ```
- Set a dedicated management thread pool or use a separate management port to prevent health check timeouts during high application load.
- Set Kubernetes probe timeouts (`timeoutSeconds: 5`, `periodSeconds: 10`, `failureThreshold: 3`) to be tolerant of transient slowness rather than marking pods unhealthy on a single slow response.

---

## Example

**Input:** "I'm building a Spring Boot 3.2 REST API that needs to call a third-party payment gateway. I need to configure the gateway's base URL, API key, connection timeout, and max retries from configuration, and I want a service that uses these settings. How should I structure this properly?"

---

## Spring Pattern Analysis

### Context
- Spring Boot version: 3.2
- Pattern category: Configuration Properties + Dependency Injection + Service Layer
- Problem being solved: Externalize payment gateway configuration and build a correctly layered service that consumes it

### Recommendation

Use a `@ConfigurationProperties` record with `@Validated` constraints to bind all gateway settings under a single prefix, then inject it into a constructor-injected `@Service`. This keeps configuration validated at startup, makes the service unit-testable without a Spring context, and keeps secrets out of the codebase via environment variable binding.

### Implementation

#### Configuration / Properties

```yaml
# application.yml
app:
  payment:
    gateway:
      base-url: https://api.paymentgateway.example.com
      api-key: ${PAYMENT_GATEWAY_API_KEY}   # injected from environment variable
      connection-timeout-ms: 3000
      read-timeout-ms: 10000
      max-retries: 3
```

```yaml
# application-dev.yml  (overrides for local development)
app:
  payment:
    gateway:
      base-url: http://localhost:8099
      api-key: dev-test-key-not-secret
      connection-timeout-ms: 5000
      max-retries: 1
```

#### Java Code

```java
package com.example.myapp.payment.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Externalized configuration for the third-party payment gateway.
 *
 * All fields are validated at startup. Missing or invalid values cause a
 * BindException with a descriptive message before the application accepts traffic.
 *
 * The api-key field is intentionally bound from an environment variable
 * (PAYMENT_GATEWAY_API_KEY) and must never be committed to version control.
 */
@ConfigurationProperties(prefix = "app.payment.gateway")
@Validated
public record PaymentGatewayProperties(

        @NotBlank(message = "Payment gateway base URL must not be blank")
        String baseUrl,

        @NotBlank(message = "Payment gateway API key must not be blank")
        String apiKey,

        @Positive
        @Max(30_000)
        int connectionTimeoutMs,

        @Positive
        @Max(60_000)
        int readTimeoutMs,

        @Min(0)
        @Max(10)
        int maxRetries
) {}
```

```java
package com.example.myapp.payment.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * Spring configuration for payment gateway infrastructure beans.
 *
 * RestClient (Spring 6.1 / Boot 3.2) is preferred over RestTemplate for new code.
 * The client is a singleton -- it is thread-safe and should not be instantiated per request.
 */
@Configuration
@EnableConfigurationProperties(PaymentGatewayProperties.class)
public class PaymentGatewayConfiguration {

    @Bean
    public RestClient paymentGatewayRestClient(PaymentGatewayProperties props) {
        return RestClient.builder()
                .baseUrl(props.baseUrl())
                .defaultHeader("Authorization", "Bearer " + props.apiKey())
                .defaultHeader("Content-Type", "application/json")
                .build();
        // Note: connection/read timeouts are set at the ClientHttpRequestFactory level.
        // Wire a JdkClientHttpRequestFactory or SimpleClientHttpRequestFactory with
        // Duration.ofMillis(props.connectionTimeoutMs()) if timeout enforcement is required.
    }
}
```

```java
package com.example.myapp.payment;

import com.example.myapp.payment.config.PaymentGatewayProperties;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;

/**
 * Service responsible for processing payments via the third-party gateway.
 *
 * All dependencies are constructor-injected (final fields), enabling unit testing
 * without a Spring context by passing mock objects directly to the constructor.
 *
 * Retry logic is intentionally simple here -- for production use, integrate
 * Spring Retry (@Retryable) or Resilience4j with a proper backoff strategy.
 */
@Service
public class PaymentGatewayService {

    private static final Logger log = LoggerFactory.getLogger(PaymentGatewayService.class);

    private final RestClient restClient;
    private final PaymentGatewayProperties props;
    private final Counter successCounter;
    private final Counter failureCounter;
    private final Timer paymentTimer;

    public PaymentGatewayService(
            RestClient paymentGatewayRestClient,
            PaymentGatewayProperties props,
            MeterRegistry meterRegistry
    ) {
        this.restClient = paymentGatewayRestClient;
        this.props = props;
        // Metrics registered once at bean construction time -- not per request
        this.successCounter = meterRegistry.counter("app.payment.requests", "status", "success");
        this.failureCounter = meterRegistry.counter("app.payment.requests", "status", "failure");
        this.paymentTimer = meterRegistry.timer("app.payment.duration");
    }

    /**
     * Initiates a payment charge against the gateway.
     *
     * @param orderId  the internal order identifier, used for idempotency key
     * @param amount   the charge amount in the currency's minor unit (e.g., cents)
     * @param currency ISO 4217 currency code (e.g., "USD", "EUR")
     * @return gateway transaction ID on success
     * @throws PaymentGatewayException if all retries are exhausted
     */
    public String chargeOrder(String orderId, BigDecimal amount, String currency) {
        return paymentTimer.recordCallable(() -> chargeWithRetry(orderId, amount, currency));
    }

    private String chargeWithRetry(String orderId, BigDecimal amount, String currency) {
        int attempts = 0;
        RestClientException lastException = null;

        while (attempts <= props.maxRetries()) {
            try {
                if (attempts > 0) {
                    log.warn("Retrying payment for orderId={} attempt={}", orderId, attempts);
                }
                String transactionId = callGateway(orderId, amount, currency);
                successCounter.increment();
                log.info("Payment succeeded orderId={} transactionId={}", orderId, transactionId);
                return transactionId;
            } catch (RestClientException ex) {
                lastException = ex;
                attempts++;
            }
        }

        failureCounter.increment();
        log.error("Payment failed after {} attempts for orderId={}", attempts, orderId);
        throw new PaymentGatewayException(
                "Payment gateway unavailable after " + attempts + " attempts for order " + orderId,
                lastException
        );
    }

    private String callGateway(String orderId, BigDecimal amount, String currency) {
        var request = new PaymentRequest(orderId, amount, currency);
        var response = restClient.post()
                .uri("/v1/charges")
                .header("Idempotency-Key", orderId)  // prevents duplicate charges on retry
                .body(request)
                .retrieve()
                .body(PaymentResponse.class);

        if (response == null || response.transactionId() == null) {
            throw new PaymentGatewayException("Gateway returned empty response for order " + orderId);
        }
        return response.transactionId();
    }

    // Internal record types for request/response mapping
    private record PaymentRequest(String orderId, BigDecimal amount, String currency) {}
    private record PaymentResponse(String transactionId, String status) {}
}
```

```java
package com.example.myapp.payment;

/**
 * Unchecked exception representing a failure to process a payment via the gateway.
 * Callers (controller layer) should catch this and translate it to an appropriate
 * HTTP 502 Bad Gateway or 503 Service Unavailable response, NOT a 500 Internal Server Error.
 */
public class PaymentGatewayException extends RuntimeException {

    public PaymentGatewayException(String message) {
        super(message);
    }

    public PaymentGatewayException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

```java
package com.example.myapp.payment;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Translates domain exceptions to RFC 9457 Problem Detail responses.
 * Spring Boot 3.x natively supports ProblemDetail -- no additional library needed.
 */
@RestControllerAdvice
public class PaymentExceptionHandler {

    @ExceptionHandler(PaymentGatewayException.class)
    public ProblemDetail handleGatewayUnavailable(PaymentGatewayException ex) {
        var problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_GATEWAY,
                "The payment gateway is temporarily unavailable. Please retry."
        );
        problem.setTitle("Payment Gateway Unavailable");
        // Do NOT include ex.getMessage() in the response -- it may contain internal details.
        return problem;
    }
}
```

#### Custom Health Indicator for the Payment Gateway

```java
package com.example.myapp.payment;

import com.example.myapp.payment.config.PaymentGatewayProperties;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Reports payment gateway reachability as part of the readiness health group.
 *
 * Exposed at /actuator/health/readiness when the readiness group includes "paymentGateway".
 * The health check key is "paymentGateway" (class name minus "HealthIndicator" suffix).
 *
 * This must NOT be added to the liveness group -- a gateway being slow
 * should not cause the pod to restart.
 */
@Component
public class PaymentGatewayHealthIndicator implements HealthIndicator {

    private final RestClient restClient;
    private final PaymentGatewayProperties props;

    public PaymentGatewayHealthIndicator(
            RestClient paymentGatewayRestClient,
            PaymentGatewayProperties props
    ) {
        this.restClient = paymentGatewayRestClient;
        this.props = props;
    }

    @Override
    public Health health() {
        try {
            restClient.get()
                    .uri("/health")
                    .retrieve()
                    .toBodilessEntity();
            return Health.up()
                    .withDetail("gateway", props.baseUrl())
                    .build();
        } catch (RestClientException ex) {
            return Health.down()
                    .withDetail("gateway", props.baseUrl())
                    .withDetail("error", ex.getClass().getSimpleName())
                    .build();
        }
    }
}
```

#### Actuator Configuration

```yaml
# application.yml (management section)
management:
  server:
    port: 8081  # isolate management traffic from application traffic
  endpoints:
    web:
      exposure:
        include: health, info, metrics, prometheus
  endpoint:
    health:
      show-details: when-authorized
      group:
        liveness:
          include: livenessState
        readiness:
          include: readinessState, db, paymentGateway
  health:
    livenessState:
      enabled: true
    readinessState:
      enabled: true
```

### Trade-off Matrix

| Approach | Pros | Cons | Use When |
|---|---|---|---|
| `@ConfigurationProperties` record | Immutable, validated at startup, IDE autocompletion, grouped | Requires `@EnableConfigurationProperties` registration | Any group of 3+ related properties |
| Scattered `@Value` annotations | Simple for single properties | No grouping, no startup validation, hard to test | Exactly one isolated property |
| Environment-only config (no YAML) | Secrets never near code | No defaults, harder to document | Secrets only (API keys, passwords) |
| `RestClient` (Spring 6.1+) | Fluent API, non-blocking compatible, replaces RestTemplate | Newer API, less StackOverflow coverage | New Spring Boot 3.2+ projects |
| `RestTemplate` | Mature, well-documented | Deprecated for new code in Spring 6, synchronous only | Maintaining legacy 2.x code |

### Common Mistakes to Avoid
- Injecting `PaymentGatewayProperties` into `PaymentGatewayHealthIndicator` separately from `PaymentGatewayService` -- both share the same singleton bean, no duplication occurs
- Storing the API key directly in `application.yml` under version control -- always use `${ENV_VAR}` syntax and document the required environment variable in the project README
- Adding complex retry logic inline instead of using Spring Retry (`@Retryable`) or Resilience4j `RetryRegistry` with exponential backoff and jitter for production retry behavior
- Catching `Exception` broadly in `chargeWithRetry` instead of `RestClientException` -- broad catches hide programming errors and make debugging harder
- Registering `Counter` and `Timer` metrics inside request-handling methods (`new Counter(...)` per call) -- always register metrics once at bean creation time and reuse the `Counter`/`Timer` instance

### Related Patterns
- `java-testing-patterns`: Writing `@WebMvcTest` for `PaymentController` and unit tests for `PaymentGatewayService` using a constructor-injected mock `RestClient`
- `java-concurrency-patterns`: If payment calls need to be made in parallel or with a timeout using `CompletableFuture` or virtual threads
