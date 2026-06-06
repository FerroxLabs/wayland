---
name: kotlin-project-setup
description: |
  Guides expert-level kotlin project setup implementation: kotlin and best-practices decision frameworks, production-ready patterns, and concrete templates for kotlin project setup workflows.
  Use when the user asks about kotlin project setup, kotlin project setup configuration, or kotlin best practices for kotlin projects.
  Do NOT use when the user needs a different languages runtimes capability -- check sibling skills in the languages runtimes subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "kotlin best-practices template"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Kotlin Project Setup

## When to Use

**Use this skill when:**
- The user is initializing a new Kotlin project and needs to choose between Gradle (Kotlin DSL), Maven, or other build tooling with proper Kotlin compiler plugin configuration
- The user wants to set up a production-ready Kotlin project with proper multimodule structure, code quality gates, coroutines support, and serialization
- The user is migrating a Java project to Kotlin and needs guidance on coexistence configuration, `@JvmStatic`, `@JvmOverloads`, and incremental migration strategy
- The user needs to configure Kotlin for a specific runtime target -- JVM backend (Spring Boot, Ktor, Quarkus), Android, Kotlin/JS, or Kotlin Multiplatform Mobile (KMM)
- The user wants to establish team-wide conventions including opt-in API configuration, explicit API mode, compiler flags, and lint rules using detekt or ktlint
- The user is setting up CI/CD pipelines that compile Kotlin correctly with incremental compilation, build caching, and parallel execution
- The user wants to configure the Kotlin compiler for strict null safety, progressive mode, or specific JVM target bytecode version

**Do NOT use this skill when:**
- The user needs help with Kotlin syntax, language features, or algorithms -- those are language learning questions, not project setup
- The user is configuring Android-specific concerns like Gradle AGP versioning, ProGuard/R8 rules, or Android SDK targets -- check the android-project-setup skill
- The user needs Kotlin Multiplatform project scaffolding with shared modules for iOS/Android -- check the kotlin-multiplatform skill if available
- The user is asking about deploying a Kotlin application (Docker, Kubernetes, cloud) -- check the deployment skills in the infrastructure subcategory
- The user needs help with specific Kotlin frameworks like Spring Boot or Ktor in depth -- check framework-specific skills
- The user wants general JVM tuning (heap sizing, GC selection, JFR) -- check the jvm-performance skill

---

## Process

### 1. Determine the Kotlin Target Platform and Runtime

Before writing a single line of configuration, establish the deployment target because it determines the entire dependency graph, compiler options, and plugin set.

- **JVM backend:** Standard Kotlin JVM target. Confirm the JDK version (LTS: 17 or 21 preferred in 2024+). Set `jvmTarget` in `compileKotlin` to match -- mismatches between the JDK version and `jvmTarget` cause subtle bytecode issues.
- **Kotlin/JVM with framework:** Identify Spring Boot (Spring plugin + `kotlin-spring` plugin required for open classes), Ktor (no special compiler plugins but needs coroutines), or Quarkus (Quarkus Kotlin extension + `all-open` plugin for CDI).
- **Kotlin Multiplatform:** Identify shared vs. platform-specific source sets (`commonMain`, `jvmMain`, `iosMain`). This requires `kotlin-multiplatform` plugin and cannot coexist simply with `kotlin("jvm")`.
- **Kotlin/JS or Kotlin/Wasm:** Confirm browser vs. Node.js target and IR backend requirement (legacy backend is deprecated as of Kotlin 1.9).
- Confirm the Kotlin version to use. As of 2024, Kotlin 2.0.x is stable with K2 compiler. Kotlin 1.9.x is the LTS-stable fallback. K2 brings 2x faster compilation but has different plugin compatibility requirements.

### 2. Choose and Configure the Build System

The build system is the backbone of the project. Kotlin DSL for Gradle is the strongly preferred choice for new Kotlin projects.

- **Gradle with Kotlin DSL (`build.gradle.kts`):** Use this for all new JVM/KMP projects. It provides IDE completion, type safety, and is the canonical Kotlin tooling path. Use Gradle 8.5+ for Kotlin 2.x support.
- **Maven:** Use only if your organization mandates Maven or you are integrating into an existing Maven monorepo. Maven Kotlin compilation is slower and has less community momentum. Use `kotlin-maven-plugin` version matching the Kotlin version exactly.
- **Convention plugins (Gradle):** For multimodule projects, extract shared build logic into `buildSrc` or `gradle/libs.versions.toml` + precompiled script plugins in an included build. Never duplicate `build.gradle.kts` logic across modules.
- Configure `gradle/libs.versions.toml` (Gradle version catalog) for all dependency versions. This is mandatory for teams of 3+ to prevent version drift:
  ```toml
  [versions]
  kotlin = "2.0.21"
  coroutines = "1.8.1"
  serialization = "1.7.3"
  ktor = "2.3.12"
  [libraries]
  kotlin-stdlib = { module = "org.jetbrains.kotlin:kotlin-stdlib", version.ref = "kotlin" }
  kotlinx-coroutines-core = { module = "org.jetbrains.coroutines:kotlinx-coroutines-core", version.ref = "coroutines" }
  ```
- Set the Gradle wrapper version precisely: `./gradlew wrapper --gradle-version=8.10.2 --distribution-type=bin`. Commit the wrapper JAR.
- Enable Gradle build cache in `gradle.properties`: `org.gradle.caching=true`. Enable configuration cache: `org.gradle.configuration-cache=true` (verify plugin compatibility first).

### 3. Configure the Kotlin Compiler Plugin and Core Options

Compiler configuration is where most teams make critical mistakes. Get this right at day one.

- In `build.gradle.kts`, configure `compileKotlin` and `compileTestKotlin` tasks:
  ```kotlin
  tasks.withType<KotlinCompile>().configureEach {
      compilerOptions {
          jvmTarget.set(JvmTarget.JVM_21)
          freeCompilerArgs.addAll(
              "-Xjsr305=strict",            // Treat Spring/JSR-305 nullability annotations as strict
              "-Xemit-jvm-type-annotations", // Preserve type annotations in bytecode
              "-opt-in=kotlin.RequiresOptIn" // Enable opt-in API mechanism globally
          )
          allWarningsAsErrors.set(true)     // In new projects -- enforce from day one
          progressiveMode.set(true)         // Get deprecation warnings for upcoming Kotlin changes
      }
  }
  ```
- **`-Xjsr305=strict`:** Critical for Spring Boot interop. Without it, Spring's `@Nullable` and `@NonNull` annotations are ignored by the Kotlin compiler, defeating null safety.
- **Explicit API mode:** For library projects or shared modules, add `explicitApi()` to the `kotlin {}` block. This forces visibility modifiers on all public declarations and prevents accidental API surface exposure.
- **`jvmTarget` alignment:** If using JDK 21 but setting `jvmTarget = JVM_17`, ensure the Gradle `java` plugin also targets 17 via `java { sourceCompatibility = JavaVersion.VERSION_17 }`. Mismatch causes `IncompatibleClassChangeError` at runtime.
- **K2 compiler (Kotlin 2.0+):** The K2 compiler is default. Ensure all annotation processors (kapt) or KSP processors are K2-compatible. Prefer KSP over kapt for new projects -- kapt requires a separate Kotlin compilation round and is significantly slower.

### 4. Set Up Essential Kotlin Dependencies

Define a canonical dependency baseline for the project type.

- **All JVM projects:**
  ```kotlin
  dependencies {
      implementation(kotlin("stdlib"))
      // Do NOT add kotlin-stdlib-jdk8 or kotlin-stdlib-jdk7 separately for Kotlin 1.8+
      // they are merged into kotlin-stdlib
  }
  ```
- **Coroutines (any project doing async I/O or concurrent work):**
  ```kotlin
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-jdk8:1.8.1") // For JDK8 integration
  testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
  ```
- **Serialization:** For JSON/Protobuf without reflection overhead. Add the plugin in `plugins {}` block AND the runtime dependency:
  ```kotlin
  // plugins block
  kotlin("plugin.serialization") version libs.versions.kotlin.get()
  // dependencies block
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
  ```
- **Testing baseline:** Use JUnit 5 (Jupiter) with Kotest assertions or MockK for idiomatic Kotlin testing:
  ```kotlin
  testImplementation("org.junit.jupiter:junit-jupiter:5.11.3")
  testImplementation("io.mockk:mockk:1.13.13")
  testImplementation("io.kotest:kotest-assertions-core:5.9.1")
  testRuntimeOnly("org.junit.platform:junit-platform-launcher")
  tasks.test { useJUnitPlatform() }
  ```
- Never mix `kotlin-test` and JUnit 5 test annotations in the same module -- pick one assertion style and be consistent.

### 5. Configure Code Quality Tooling

Quality tooling must be configured before the first commit reaches `main`, not retrofitted later.

- **ktlint (formatting):** Use the `jlleitschuh/ktlint-gradle` plugin or the official `ktlint` Gradle plugin. Configure `.editorconfig` at the project root:
  ```ini
  [*.{kt,kts}]
  ktlint_code_style = ktlint_official
  ktlint_standard_no-wildcard-imports = enabled
  max_line_length = 120
  indent_size = 4
  ```
  Run `./gradlew ktlintFormat` as a pre-commit hook. Run `./gradlew ktlintCheck` in CI (fail the build on violations).
- **detekt (static analysis):** Add `io.gitlab.arturbosch.detekt` plugin. Generate a baseline config: `./gradlew detektGenerateConfig`. The default `detekt.yml` is a starting point -- tune it per team. Enable type resolution for stronger checks:
  ```kotlin
  detekt {
      config.setFrom("$projectDir/config/detekt/detekt.yml")
      buildUponDefaultConfig = true
      allRules = false // Only enable rules you enforce
  }
  ```
  Key detekt rules to enable from day one: `MagicNumber`, `ComplexCondition`, `LongParameterList` (threshold: 6), `TooManyFunctions` (threshold: 11 per class), `MaxLineLength`.
- **Binary compatibility validator:** For library/shared module projects, add `org.jetbrains.kotlinx.binary-compatibility-validator`. This generates a `.api` file tracking public API surface and fails CI when the API changes unexpectedly.
- Configure all quality checks to run in the `check` Gradle lifecycle task so `./gradlew check` is the single CI quality gate command.

### 6. Establish Project Structure and Module Boundaries

Project structure communicates architectural intent and prevents coupling.

- **Single-module small projects (1-5 engineers, bounded domain):**
  ```
  project-root/
  ├── build.gradle.kts
  ├── settings.gradle.kts
  ├── gradle/
  │   ├── libs.versions.toml
  │   └── wrapper/
  ├── src/
  │   ├── main/kotlin/com/example/
  │   │   ├── Application.kt       # Entry point
  │   │   ├── domain/              # Business logic -- no framework deps
  │   │   ├── application/         # Use cases / services
  │   │   ├── infrastructure/      # DB, HTTP, messaging adapters
  │   │   └── api/                 # Controllers / handlers
  │   └── test/kotlin/com/example/
  └── src/integrationTest/kotlin/  # Separate source set for integration tests
  ```
- **Multimodule projects (5+ engineers, multiple bounded contexts):** Use Gradle multi-project builds with a `settings.gradle.kts` including all subprojects. Place shared build logic in `build-logic/` as an included Gradle build with convention plugins (e.g., `kotlin-library-conventions.gradle.kts`, `kotlin-service-conventions.gradle.kts`).
- Define integration test source sets explicitly -- do not put integration tests in `src/test`. Create a dedicated `integrationTest` source set that runs against a real database or external service, separated from unit tests in CI:
  ```kotlin
  val integrationTestSourceSet = sourceSets.create("integrationTest") {
      compileClasspath += sourceSets.main.get().output + configurations.testRuntimeClasspath.get()
      runtimeClasspath += output + compileClasspath
  }
  ```
- Enforce module boundaries using detekt's `ForbiddenImport` or ArchUnit tests. Domain modules must not import infrastructure modules.

### 7. Configure CI/CD Integration

Kotlin's compilation speed and incremental compilation behavior require specific CI configuration.

- **Gradle remote build cache:** Configure Gradle Enterprise or Develocity for build cache sharing across CI agents. Without this, Kotlin compilation time on CI is 3-5x local times for large projects.
- **Parallel compilation:** In `gradle.properties`:
  ```properties
  org.gradle.parallel=true
  org.gradle.workers.max=4          # Set to CPU count - 1 on CI agents
  kotlin.incremental=true
  kotlin.incremental.multiplatform=true
  kotlin.daemon.jvm.options=-Xmx2g # Kotlin daemon heap -- 2GB for medium projects, 4GB for large
  org.gradle.jvmargs=-Xmx4g -XX:+UseParallelGC
  ```
- **GitHub Actions / GitLab CI caching:** Cache both the Gradle user home (`~/.gradle/caches`) and the project `.gradle` directory. Cache key must include the hash of all `*.gradle.kts` files and `libs.versions.toml`.
- **Kotlin daemon on CI:** Set `GRADLE_OPTS=-Dkotlin.compiler.execution.strategy=in-process` on CI to avoid daemon startup overhead in ephemeral build containers.
- **Quality gate order in CI pipeline:**
  1. `./gradlew ktlintCheck` -- fast, fail early
  2. `./gradlew detekt` -- static analysis
  3. `./gradlew test` -- unit tests
  4. `./gradlew integrationTest` -- integration tests (parallelizable)
  5. `./gradlew check` -- all remaining checks including binary compatibility

### 8. Document Conventions and Finalize

Set the team up for long-term consistency.

- Create a `CONTRIBUTING.md` documenting: Kotlin version, JDK version, required Gradle wrapper version, how to run quality checks locally, branch naming, and commit message conventions.
- Create an `ADR/` directory with the first Architecture Decision Record: why Kotlin was chosen, what version, and any deviations from defaults (e.g., "We disabled `allWarningsAsErrors` in test source sets because MockK generates some deprecation warnings we cannot control").
- Add a `.kotlin-version` file in the project root for tooling that reads it (some IDE plugins use it).
- Configure `.gitignore` with JVM/Kotlin specifics:
  ```
  .gradle/
  build/
  *.class
  *.jar
  !gradle/wrapper/gradle-wrapper.jar
  .idea/
  *.iml
  out/
  ```
- Pin the JDK version using a `.java-version` or `.tool-versions` (asdf) file so all developers and CI use the same JDK.

---

## Output Format

When helping a user set up a Kotlin project, provide output in this structure:

```
## Kotlin Project Setup Plan

### Target Context
- Platform: [JVM / KMP / JS / Wasm]
- Runtime/Framework: [Spring Boot 3.x / Ktor / Quarkus / None]
- Kotlin Version: [2.0.x / 1.9.x]
- JDK Version: [21 / 17 / 11]
- Build System: [Gradle Kotlin DSL / Maven]
- Team Size: [number]
- Module Structure: [Single-module / Multi-module]

### Decision Matrix

| Concern                   | Choice                        | Rationale                                      |
|---------------------------|-------------------------------|------------------------------------------------|
| Build system              | Gradle 8.x with Kotlin DSL   | Type-safe, IDE completion, KMP-ready           |
| Dependency management     | Version catalog (libs.versions.toml) | Single source of truth for all versions  |
| Formatting                | ktlint (official style)       | Zero-config, integrates with pre-commit        |
| Static analysis           | detekt with type resolution   | Catches architecture and complexity violations |
| Async                     | kotlinx.coroutines            | Structured concurrency, cancellation support   |
| Serialization             | kotlinx.serialization         | Reflection-free, KMP-compatible                |
| Testing                   | JUnit 5 + MockK + Kotest      | Idiomatic Kotlin, coroutines test support      |
| Java interop              | -Xjsr305=strict               | Enforces nullability from Java annotations     |

### File Listing
[List every file to be created with its purpose]

### settings.gradle.kts
[Complete file content]

### build.gradle.kts (root or module)
[Complete file content]

### gradle/libs.versions.toml
[Complete file content]

### gradle.properties
[Complete file content]

### config/detekt/detekt.yml (key sections)
[Relevant configuration sections]

### .editorconfig
[Complete file content]

### src/main/kotlin/[package]/Application.kt
[Minimal entry point appropriate to the framework]

### CI Configuration (.github/workflows/ci.yml or equivalent)
[Complete CI workflow file]

### Next Steps
1. [Concrete action with command]
2. [Concrete action with command]
3. [Concrete action with command]
```

---

## Rules

1. **NEVER mix `kotlin-stdlib-jdk7` or `kotlin-stdlib-jdk8` as explicit dependencies for Kotlin 1.8+.** These artifacts were merged into `kotlin-stdlib` in Kotlin 1.8. Adding them explicitly causes duplicate class warnings and can cause subtle class loading issues at runtime.

2. **ALWAYS align `jvmTarget` in `KotlinCompile` tasks with the `sourceCompatibility` and `targetCompatibility` in the `java` plugin.** If they differ by even one version, Gradle may compile Java sources to a higher bytecode version than Kotlin sources, causing `UnsupportedClassVersionError` in production.

3. **NEVER use `kapt` for new projects that can use KSP.** kapt runs a separate compilation round, doubling compile time for annotation-heavy projects. Dagger, Room, Moshi, and most modern processors have KSP support. The annotation processor support for kapt is being formally deprecated.

4. **ALWAYS pin the Kotlin Gradle Plugin version identical to the `kotlin-stdlib` version.** Mismatching plugin and stdlib versions is a top-3 cause of cryptic `NoClassDefFoundError` and `AbstractMethodError` at compile time.

5. **NEVER enable `allWarningsAsErrors = true` on test source sets without accounting for third-party generated code.** MockK and similar libraries generate code with deprecation warnings in recent Kotlin versions. Apply the compiler options selectively: `tasks.withType<KotlinCompile>().matching { it.name.startsWith("compileMain") }`.

6. **ALWAYS use `configureEach` instead of `withType<Task>.configure {}` for Kotlin compile task configuration in Gradle.** `configureEach` is lazy and avoids realizing tasks eagerly, which degrades configuration time for large multimodule builds (100+ modules can see 30-60 second overhead from eager task realization).

7. **NEVER commit `gradle-wrapper.jar` to `.gitignore`.** The wrapper JAR is intentionally committed to the repository. Its SHA is verified by Gradle's built-in wrapper validation. Excluding it forces every developer to run `gradle wrapper` before building.

8. **ALWAYS configure the Kotlin daemon heap separately from the Gradle daemon heap.** `org.gradle.jvmargs` controls the Gradle daemon. `kotlin.daemon.jvm.options` controls the Kotlin compiler daemon. For projects with more than 100K lines of Kotlin, the Kotlin daemon needs at least 2GB (`-Xmx2g`) to avoid GC-induced compilation slowdowns.

9. **NEVER use wildcard imports in Kotlin source files in a team setting.** Configure ktlint's `no-wildcard-imports` rule and detekt's `NoWildcardImports` rule together. Wildcard imports cause merge conflicts when multiple engineers add imports in the same file and make it impossible to grep for specific class usage.

10. **ALWAYS create a dedicated `integrationTest` Gradle source set rather than placing integration tests in `src/test`.** Integration tests that start Docker containers (via Testcontainers), make real HTTP calls, or write to real databases must not run with unit tests. Mixing them causes flakey unit test suites and makes fast local feedback loops impossible.

---

## Edge Cases

### Kotlin 2.0 K2 Compiler Plugin Incompatibility
If any annotation processor or compiler plugin in the dependency list does not support K2 (check the plugin's changelog for "K2 support" or "Kotlin 2.0 compatible"), the build will fail with `This version of the kotlin-plugin requires the K2 compiler` or produce incorrect output silently. **Handling:** Add `kotlin.experimental.tryK2=true` to `gradle.properties` first and run `./gradlew build --info` to check plugin compatibility before fully committing to Kotlin 2.0. If a plugin is incompatible, either: (a) find the K2-compatible version, (b) temporarily disable that specific plugin's compilation integration, or (c) stay on Kotlin 1.9.x until the plugin is updated. For kapt specifically, K2 kapt is available as `kotlin.kapt.use.k2=true` but is still experimental -- prefer migrating to KSP instead.

### Java/Kotlin Mixed Source Project Migration
When converting an existing Java project to Kotlin incrementally, the `java` and `kotlin` source directories must coexist. **Handling:** Add `kotlin("jvm")` plugin alongside any existing `java` plugin. Configure `sourceSets.main.kotlin.srcDirs` to include both `src/main/kotlin` and `src/main/java` if you want Kotlin to process Java sources for type resolution. Use `@JvmStatic` on companion object methods called from Java, `@JvmOverloads` for Kotlin default parameter functions called from Java, and `@JvmField` for constants. Critical: Kotlin sees Java nullability through `@Nullable`/`@NonNull` annotations (hence the importance of `-Xjsr305=strict`). Platform types (types from Java without annotations) are `T!` in Kotlin -- treat every platform type as potentially null until the Java code is annotated.

### Gradle Configuration Cache Incompatibility with Specific Plugins
Configuration cache (`org.gradle.configuration-cache=true`) breaks plugins that use `Project` instance at execution time, access task outputs during configuration, or use deprecated APIs. When enabling it, run `./gradlew --configuration-cache build` and check for `configuration cache problems` in the output. **Handling:** Common offenders are older versions of the Docker plugin, some code generation plugins, and custom `buildSrc` code that holds task references. Fix by: upgrading the plugin to a CC-compatible version, using `@Internal` task property annotations correctly, or adding the plugin to a configuration cache exclusion list as a temporary measure. Do not disable configuration cache globally for one non-compliant plugin -- isolate the non-compliant task and run it separately.

### Multimodule Build with Shared Kotlin Version
In a multimodule project where some modules are libraries used by other modules, the Kotlin stdlib version must be consistent across all modules. **Handling:** Define the Kotlin version exclusively in the root `libs.versions.toml` and apply the Kotlin plugin via a convention plugin in `build-logic`. Never hardcode the Kotlin version string in a module's `build.gradle.kts`. Use `kotlin("stdlib")` without a version when the BOM or version catalog manages the version. Apply `platform(kotlin("bom"))` in projects where the Kotlin version must be enforced transitively:
```kotlin
implementation(platform("org.jetbrains.kotlin:kotlin-bom:${libs.versions.kotlin.get()}"))
```

### Coroutines and `suspend` Functions in Spring Boot or JPA Context
When using coroutines with Spring Boot, Spring's transaction management and security context propagation do not work with `suspend` functions by default. **Handling:** Use `kotlinx-coroutines-reactor` for Spring WebFlux integration. For Spring MVC (blocking), use `runBlocking {}` only at the outermost controller layer, never inside service or repository layers. For Spring Security context in coroutines, use `SecurityContext` with `ReactorContextWebFilter`. For Spring Data JPA with coroutines, repositories must use `@Transactional` with a coroutine-aware transaction manager -- do not call `suspend` JPA operations from a coroutine that doesn't have a `Dispatchers.IO` context, as JPA blocks threads.

### Deterministic Snapshot/Version Handling in CI
Kotlin snapshot versions (`2.1.0-SNAPSHOT`) are sometimes referenced in tutorials and documentation. **Handling:** Never use snapshot versions in production projects. Snapshots are published to the Kotlin bootstrap Maven repository, not Maven Central, and can change without notice, causing irreproducible builds. If you need a pre-release, use the RC or beta releases from Maven Central (e.g., `2.1.0-RC`). If a team member's `~/.gradle/caches` has a snapshot cached, it may differ from a fresh CI environment, causing "works on my machine" failures. Enforce `--refresh-dependencies` in CI for any snapshot dependency if one accidentally slips through.

### `OptIn` and Experimental API Management
Kotlin's experimental/opt-in API system (formerly `@Experimental`) is commonly misunderstood. Using any kotlinx.coroutines experimental API, Flow operators marked `@FlowPreview`, or custom `@RequiresOptIn` annotations without proper opt-in causes compile errors. **Handling:** Use `@OptIn(ExperimentalCoroutinesApi::class)` at the call site for specific functions. For project-wide opt-in (e.g., you're using many coroutines experimental APIs), add to compiler args: `-opt-in=kotlinx.coroutines.ExperimentalCoroutinesApi`. For your own library code, mark experimental APIs with `@RequiresOptIn(level = RequiresOptIn.Level.ERROR)` to force callers to explicitly acknowledge the instability. Never add a blanket `-opt-in=kotlin.RequiresOptIn` that suppresses all opt-in requirements without per-API review.

### Windows Build Environment
Kotlin/Gradle builds on Windows have known friction points. **Handling:** Use WSL2 for development whenever possible -- Gradle's file system watching and incremental compilation work significantly better on Linux (EXT4) than Windows NTFS. If native Windows is required: set `GRADLE_USER_HOME` to a short path (e.g., `C:\gradle`) to avoid Windows MAX_PATH (260 characters) issues with deeply nested Gradle cache directories. Enable long path support via Group Policy or `git config core.longpaths true`. Configure antivirus exclusions for the Gradle cache and build directories -- real-time AV scanning of `.class` files during compilation is a major performance killer (can increase build times by 40-100%).

---

## Example

**Input:** "I need to set up a new Kotlin project for a REST API service using Ktor. It's a team of 4 engineers. We're targeting JDK 21, want production-ready quality gates, and will deploy to Kubernetes. This is a greenfield project."

**Output:**

## Kotlin Project Setup Plan

### Target Context
- Platform: JVM
- Runtime/Framework: Ktor 2.3.x (coroutines-native, no Spring)
- Kotlin Version: 2.0.21
- JDK Version: 21
- Build System: Gradle 8.10.x with Kotlin DSL
- Team Size: 4
- Module Structure: Single-module (with dedicated integrationTest source set)

### Decision Matrix

| Concern | Choice | Rationale |
|---|---|---|
| Build system | Gradle 8.10 with Kotlin DSL | Type-safe config, Kotlin 2.0 support, KSP-ready |
| Dependency versions | `libs.versions.toml` version catalog | Single source of truth, IDE completion |
| Formatting | ktlint 1.3.x (official style) | Automated, pre-commit enforced |
| Static analysis | detekt 1.23.x with type resolution | Complexity/coupling detection |
| HTTP framework | Ktor 2.3.x | Lightweight, coroutines-native, minimal reflection |
| Async | kotlinx.coroutines 1.8.1 | Structured concurrency, Ktor native |
| Serialization | kotlinx.serialization JSON | Reflection-free, Ktor Content Negotiation |
| Testing | JUnit 5 + MockK + Kotest + Ktor testApplication | Idiomatic Kotlin, suspend-function testing |
| Java nullability | -Xjsr305=strict | Future-proofs any Java interop |
| Containerization | Ktor `shadowJar` plugin + multi-stage Dockerfile | Minimal image, fat JAR for K8s |

### File Listing
- `settings.gradle.kts` -- project name and plugin management
- `build.gradle.kts` -- all build configuration
- `gradle/libs.versions.toml` -- all version pinning
- `gradle.properties` -- JVM args, feature flags
- `config/detekt/detekt.yml` -- static analysis rules
- `.editorconfig` -- formatting rules
- `src/main/kotlin/com/example/api/Application.kt` -- Ktor entry point
- `src/main/kotlin/com/example/api/plugins/Routing.kt` -- route configuration
- `src/main/kotlin/com/example/api/plugins/Serialization.kt` -- content negotiation
- `src/test/kotlin/com/example/api/ApplicationTest.kt` -- unit test example
- `.github/workflows/ci.yml` -- GitHub Actions CI pipeline
- `Dockerfile` -- multi-stage Ktor container
- `.gitignore` -- JVM/Gradle/Kotlin specific ignores
- `CONTRIBUTING.md` -- team conventions

---

### `settings.gradle.kts`

```kotlin
rootProject.name = "ktor-api-service"

pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        mavenCentral()
    }
    versionCatalogs {
        create("libs") {
            from(files("gradle/libs.versions.toml"))
        }
    }
}
```

---

### `gradle/libs.versions.toml`

```toml
[versions]
kotlin = "2.0.21"
ktor = "2.3.12"
coroutines = "1.8.1"
serialization = "1.7.3"
logback = "1.5.8"
junit5 = "5.11.3"
mockk = "1.13.13"
kotest = "5.9.1"
detekt = "1.23.7"
ktlint-plugin = "12.1.1"
shadow = "8.1.1"

[libraries]
ktor-server-core = { module = "io.ktor:ktor-server-core-jvm", version.ref = "ktor" }
ktor-server-netty = { module = "io.ktor:ktor-server-netty-jvm", version.ref = "ktor" }
ktor-server-content-negotiation = { module = "io.ktor:ktor-server-content-negotiation-jvm", version.ref = "ktor" }
ktor-server-status-pages = { module = "io.ktor:ktor-server-status-pages-jvm", version.ref = "ktor" }
ktor-server-call-logging = { module = "io.ktor:ktor-server-call-logging-jvm", version.ref = "ktor" }
ktor-server-metrics-micrometer = { module = "io.ktor:ktor-server-metrics-micrometer-jvm", version.ref = "ktor" }
ktor-serialization-kotlinx-json = { module = "io.ktor:ktor-serialization-kotlinx-json-jvm", version.ref = "ktor" }
kotlinx-coroutines-core = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version.ref = "coroutines" }
kotlinx-serialization-json = { module = "org.jetbrains.kotlinx:kotlinx-serialization-json", version.ref = "serialization" }
logback-classic = { module = "ch.qos.logback:logback-classic", version.ref = "logback" }
junit5-api = { module = "org.junit.jupiter:junit-jupiter-api", version.ref = "junit5" }
junit5-engine = { module = "org.junit.jupiter:junit-jupiter-engine", version.ref = "junit5" }
junit5-launcher = { module = "org.junit.platform:junit-platform-launcher" }
mockk = { module = "io.mockk:mockk", version.ref = "mockk" }
kotest-assertions = { module = "io.kotest:kotest-assertions-core", version.ref = "kotest" }
ktor-server-tests = { module = "io.ktor:ktor-server-tests-jvm", version.ref = "ktor" }
kotlinx-coroutines-test = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-test", version.ref = "coroutines" }

[plugins]
kotlin-jvm = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }
kotlin-serialization = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlin" }
detekt = { id = "io.gitlab.arturbosch.detekt", version.ref = "detekt" }
ktlint = { id = "org.jlleitschuh.gradle.ktlint", version.ref = "ktlint-plugin" }
shadow = { id = "com.github.johnrengelman.shadow", version.ref = "shadow" }
```

---

### `build.gradle.kts`

```kotlin
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.detekt)
    alias(libs.plugins.ktlint)
    alias(libs.plugins.shadow)
    application
}

group = "com.example.api"
version = "0.1.0-SNAPSHOT"

application {
    mainClass.set("com.example.api.ApplicationKt")
    // Required for Netty + JDK 21 virtual threads if enabled
    applicationDefaultJvmArgs = listOf("-Dio.ktor.development=${extra["development"] ?: "false"}")
}

// ──────────────────────────────────────────────
// Integration test source set
// ──────────────────────────────────────────────
val integrationTestSourceSet = sourceSets.create("integrationTest") {
    compileClasspath += sourceSets.main.get().output + configurations.testRuntimeClasspath.get()
    runtimeClasspath += output + compileClasspath
}

val integrationTestImplementation: Configuration by configurations.getting {
    extendsFrom(configurations.testImplementation.get())
}

val integrationTest by tasks.registering(Test::class) {
    testClassesDirs = integrationTestSourceSet.output.classesDirs
    classpath = integrationTestSourceSet.runtimeClasspath
    shouldRunAfter(tasks.test)
    useJUnitPlatform()
}

tasks.check { dependsOn(integrationTest) }

// ──────────────────────────────────────────────
// Kotlin compiler configuration
// ──────────────────────────────────────────────
tasks.withType<KotlinCompile>().configureEach {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_21)
        freeCompilerArgs.addAll(
            "-Xjsr305=strict",
            "-opt-in=kotlin.RequiresOptIn",
            "-opt-in=kotlinx.coroutines.ExperimentalCoroutinesApi"
        )
        progressiveMode.set(true)
    }
}

// Apply allWarningsAsErrors only to main sources, not test sources
// (MockK and Ktor test APIs have some deprecation warnings in Kotlin 2.x)
tasks.named<KotlinCompile>("compileKotlin") {
    compilerOptions {
        allWarningsAsErrors.set(true)
    }
}

// ──────────────────────────────────────────────
// Java version alignment
// ──────────────────────────────────────────────
java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

// ──────────────────────────────────────────────
// Dependencies
// ──────────────────────────────────────────────
dependencies {
    implementation(libs.ktor.server.core)
    implementation(libs.ktor.server.netty)
    implementation(libs.ktor.server.content.negotiation)
    implementation(libs.ktor.server.status.pages)
    implementation(libs.ktor.server.call.logging)
    implementation(libs.ktor.server.metrics.micrometer)
    implementation(libs.ktor.serialization.kotlinx.json)
    implementation(libs.kotlinx.coroutines.core)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.logback.classic)

    testImplementation(libs.junit5.api)
    testRuntimeOnly(libs.junit5.engine)
    testRuntimeOnly(libs.junit5.launcher)
    testImplementation(libs.mockk)
    testImplementation(libs.kotest.assertions)
    testImplementation(libs.ktor.server.tests)
    testImplementation(libs.kotlinx.coroutines.test)
}

// ──────────────────────────────────────────────
// Test configuration
// ──────────────────────────────────────────────
tasks.test {
    useJUnitPlatform()
    maxHeapSize = "512m"
    jvmArgs("-XX:+UseZGC") // ZGC for low-latency test execution on JDK 21
    testLogging {
        events("passed", "skipped", "failed")
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
    }
}

// ──────────────────────────────────────────────
// detekt configuration
// ──────────────────────────────────────────────
detekt {
    config.setFrom("$projectDir/config/detekt/detekt.yml")
    buildUponDefaultConfig = true
    source.setFrom(
        "src/main/kotlin",
        "src/test/kotlin",
        "src/integrationTest/kotlin"
    )
}

// ──────────────────────────────────────────────
// ktlint configuration
// ──────────────────────────────────────────────
ktlint {
    version.set("1.3.1")
    android.set(false)
    reporters {
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.SARIF)
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.PLAIN)
    }
}

// ──────────────────────────────────────────────
// Shadow JAR (fat JAR for Kubernetes deployment)
// ──────────────────────────────────────────────
tasks.shadowJar {
    archiveClassifier.set("")
    manifest {
        attributes(mapOf("Main-Class" to application.mainClass.get()))
    }
    mergeServiceFiles() // Required for Netty SPI files
}
```

---

### `gradle.properties`

```properties
# Kotlin/Gradle daemon memory
org.gradle.jvmargs=-Xmx2g -XX:+UseParallelGC -XX:MaxMetaspaceSize=512m
kotlin.daemon.jvm.options=-Xmx2g

# Performance
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configuration-cache=true
org.gradle.configuration-cache.problems=warn

# Kotlin
kotlin.incremental=true
kotlin.incremental.multiplatform=false
kotlin.stdlib.default.dependency=true

# Ktor development mode (override with -Pdevelopment=true locally)
development=false

# Suppress Gradle version warnings
org.gradle.warning.mode=all
```

---

### `src/main/kotlin/com/example/api/Application.kt`

```kotlin
package com.example.api

import com.example.api.plugins.configureRouting
import com.example.api.plugins.configureSerialization
import com.example.api.plugins.configureStatusPages
import io.ktor.server.application.Application
import io.ktor.server.netty.EngineMain

fun main(args: Array<String>): Unit = EngineMain.main(args)

// Public for testApplication {} to use
fun Application.module() {
    configureSerialization()
    configureStatusPages()
    configureRouting()
}
```

---

### `src/main/kotlin/com/example/api/plugins/Serialization.kt`

```kotlin
package com.example.api.plugins

import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import kotlinx.serialization.json.Json

fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = false       // Never pretty-print in production -- wastes bytes
            isLenient = false         // Strict parsing -- reject malformed JSON
            ignoreUnknownKeys = true  // Forward compatibility for API evolution
            encodeDefaults = true     // Include default values in serialized output
        })
    }
}
```

---

### `src/test/kotlin/com/example/api/ApplicationTest.kt`

```kotlin
package com.example.api

import io.kotest.matchers.shouldBe
import io.ktor.client.request.get
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.testApplication
import org.junit.jupiter.api.Test

class ApplicationTest {

    @Test
    fun `health endpoint returns 200 OK`() = testApplication {
        application { module() }
        val response = client.get("/health")
        response.status shouldBe HttpStatusCode.OK
    }
}
```

---

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
          cache: gradle

      - name: Cache Gradle dependencies
        uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle.kts', '**/libs.versions.toml') }}
          restore-keys: |
            ${{ runner.os }}-gradle-

      - name: Validate Gradle wrapper
        uses: gradle/actions/wrapper-validation@v3

      - name: Check formatting (ktlint)
        run: ./gradlew ktlintCheck --no-daemon

      - name: Static analysis (detekt)
        run: ./gradlew detekt --no-daemon

      - name: Unit tests
        run: ./gradlew test --no-daemon
        env:
          GRADLE_OPTS: -Dkotlin.compiler.execution.strategy=in-process

      - name: Integration tests
        run: ./gradlew integrationTest --no-daemon

      - name: Build shadow JAR
        run: ./gradlew shadowJar --no-daemon

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: build/reports/tests/
```

---

### `Dockerfile`

```dockerfile
# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build
COPY gradle/ gradle/
COPY gradlew settings.gradle.kts build.gradle.kts gradle.properties ./
# Cache dependency download layer separately from source compilation
RUN ./gradlew dependencies --no-daemon --quiet
COPY src/ src/
RUN ./gradlew shadowJar --no-daemon --no-build-cache

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine AS runtime
# Run as non-root for Kubernetes security policies
RUN addgroup -S ktor && adduser -S ktor -G ktor
WORKDIR /app
COPY --from=builder /build/build/libs/*.jar app.jar
USER ktor
EXPOSE 8080
ENTRYPOINT ["java", \
  "-XX:+UseZGC", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
```

---

### Next Steps

1. **Initialize the Gradle wrapper:**
   ```bash
   gradle wrapper --gradle-version=8.10.2 --distribution-type=bin
   ```

2. **Generate the detekt baseline config:**
   ```bash
   ./gradlew detektGenerateConfig
   # Then review and tune config/detekt/detekt.yml
   ```

3. **Install the pre-commit hook for ktlint:**
   ```bash
   ./gradlew addKtlintCheckGitPreCommitHook
   ```

4. **Verify the full quality gate passes before the first feature commit:**
   ```bash
   ./gradlew check
   ```

5. **Create the first ADR** in `docs/adr/0001-kotlin-ktor-project-setup.md` documenting why Ktor was chosen over Spring Boot, the Kotlin version decision, and any non-default compiler flags with their rationale.

6. **Configure branch protection** on `main` to require all CI checks passing before merge, and set the CI workflow as a required status check.
