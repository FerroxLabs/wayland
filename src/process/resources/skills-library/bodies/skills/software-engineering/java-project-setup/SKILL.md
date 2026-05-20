---
name: java-project-setup
description: |
  Guides expert-level Java project initialization: Maven vs Gradle decision tree, multi-module structure, Java version management, toolchain configuration, and build optimization.
  Use when the user asks about Java project setup, Maven, Gradle, build.gradle.kts, multi-module, Java version management, toolchain.
  Do NOT use when the user asks about Java modern idioms (use `java-modern-idioms`), Java testing (use `java-testing-patterns`), Java Spring (use `java-spring-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "java best-practices template"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Java Project Setup

## When to Use

**Use this skill when the user:**
- Is initializing a new Java project and needs to choose between Maven and Gradle, configure a build file, or establish project structure from scratch
- Asks about configuring Maven (`pom.xml`, plugins, BOMs, profiles, lifecycle phases) or Gradle (`build.gradle`, `build.gradle.kts`, `settings.gradle.kts`, convention plugins)
- Needs to set up a multi-module project with a parent POM or Gradle settings hierarchy, including shared dependency management and build logic
- Wants to manage Java versions via toolchains (`java.toolchain.languageVersion`), `.java-version` files, SDKMAN, or Gradle's toolchain auto-provisioning
- Asks about build performance optimization: incremental compilation, build caching, parallel execution, Gradle configuration cache
- Is migrating from Maven to Gradle or from Ant to Maven
- Needs to configure a monorepo with independent versioning per subproject or a shared version catalog (`libs.versions.toml`)
- Asks about publishing artifacts to Maven Central, GitHub Packages, or a private Nexus/Artifactory instance

**Do NOT use this skill when:**
- The user asks about modern Java language idioms like records, sealed classes, pattern matching, or text blocks -- use `java-modern-idioms`
- The user asks about testing strategy, JUnit 5 configuration, Mockito, Testcontainers, or test lifecycle -- use `java-testing-patterns`
- The user asks about Spring Boot application structure, Spring dependency injection, or Spring auto-configuration -- use `java-spring-patterns`
- The user asks about deploying a Java application to Kubernetes, Docker, or a cloud platform -- use `container-deployment` or `cloud-deployment`
- The user asks purely about CI/CD pipeline configuration without a Java setup question -- use `cicd-pipeline-setup`
- The user is working in Kotlin and only needs Kotlin-specific guidance -- use `kotlin-project-setup`

---

## Process

### 1. Assess Project Context

Gather these facts before generating any configuration. Wrong assumptions here cascade through every subsequent decision.

- **Project type:** Determine whether this is a library (will be published as a JAR artifact), an application (produces a runnable artifact), a BOM (bill of materials that coordinates versions), or a monorepo platform
- **Module count:** Single module, 2--10 module project (use Gradle multi-project or Maven multi-module), or 10+ modules (treat build performance as a first-class concern; Gradle strongly preferred)
- **Target Java version:** Confirm the minimum JDK required at compile time AND the minimum JRE required at runtime. These can differ -- e.g., compile with Java 21 but target runtime compatibility of Java 17 using `--release 17`
- **Deployment target:** Fat JAR (Spring Boot plugin or shadow plugin), thin WAR (external servlet container), native binary (GraalVM native-image), or library JAR with no runtime packaging
- **Team tooling:** Confirm whether the team uses IntelliJ IDEA (excellent Gradle Kotlin DSL support), Eclipse (better Maven support historically), or VS Code (both supported via extensions)
- **Existing constraints:** If joining an existing organization, check for a mandated artifact repository (Nexus, Artifactory), corporate root certificates, air-gapped networks, or approved dependency whitelists
- **Release cadence:** Snapshot-only internal tools vs. semver-versioned artifacts published to Maven Central require very different publishing configuration

### 2. Select Build Tool Using Decision Tree

Apply this framework rigorously. Do not default to Maven for familiarity or Gradle for novelty without justification.

**Choose Gradle (with Kotlin DSL) when:**
- The project has 3 or more modules -- Gradle's incremental build and build caching give dramatic speedups (commonly 40--80% reduction in CI build time on large projects)
- Build logic needs to be customized: custom tasks, code generation, conditional compilation, or complex dependency resolution
- The team is comfortable with or willing to learn a programming-language-based DSL -- Kotlin DSL gives full IDE completion in IntelliJ
- You need build caching (Gradle Build Cache is far more mature than Maven's Daemon + local repo approach)
- The project uses Android modules alongside server modules (Gradle is mandatory for Android)

**Choose Maven when:**
- The organization has a mature Maven infrastructure with enforced corporate BOMs, existing Nexus mirrors, and established Maven Enforcer rules -- migration cost exceeds benefit
- The team is small (1--3 people), the project is a single module, and the build has no unusual requirements
- The project must publish to Maven Central and the team wants the simplest possible publishing setup (maven-publish via Gradle works fine but Maven's release plugin workflow is more widely documented)
- Regulated enterprise environments have mandated Maven and auditing hooks are built around it

**Prefer neither Maven nor Gradle:**
- If the project is a script, prototype, or purely academic -- a single `javac` invocation or a minimal shell script suffices

**Version selection:**
- Gradle: Use the latest stable release at time of setup. Pin it via the Gradle Wrapper (`gradle/wrapper/gradle-wrapper.properties`). Never use a system-installed Gradle; always use the wrapper
- Maven: Use 3.9.x. Use the Maven Wrapper (`mvnw`) for the same reason

### 3. Choose and Configure the Java Version

Java version management is the most common source of "works on my machine" failures. Be explicit at every layer.

**JDK version selection:**
- Java 21 is the current Long-Term Support (LTS) release and should be the default choice for new production projects as of 2024
- Java 17 remains appropriate for organizations with a slower upgrade cycle, legacy framework constraints, or where Java 21 is not yet certified by their cloud platform
- Java 11 is end-of-life on most distributions and should only be targeted if you have a hard runtime constraint you cannot change
- Never target Java 8 for new code unless integrating with a system that has a hard Java 8 runtime constraint

**Gradle toolchain configuration (strongly preferred over hard-coding JAVA_HOME):**
```kotlin
// build.gradle.kts
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
        vendor = JvmVendorSpec.ADOPTIUM // Optional: pin to specific JDK vendor
    }
}
```
This allows Gradle to auto-provision the correct JDK regardless of what the developer has installed, using Foojay Toolchain API by default.

**Maven toolchain configuration (`.mvn/jvm.config` and `toolchains.xml`):**
```xml
<!-- .mvn/toolchains.xml or ~/.m2/toolchains.xml -->
<toolchains>
  <toolchain>
    <type>jdk</type>
    <provides>
      <version>21</version>
      <vendor>adoptium</vendor>
    </provides>
    <configuration>
      <jdkHome>/path/to/jdk-21</jdkHome>
    </configuration>
  </toolchain>
</toolchains>
```

**Local version pinning for developers:**
- Add a `.java-version` file containing `21` to the repo root for use with SDKMAN (`sdk env`) and jEnv
- Add `.sdkmanrc` if the team standardizes on SDKMAN: `java=21.0.3-tem`

**Compiler flags:**
- Always use `--release N` (not `-source N -target N`) -- `--release` also restricts API usage to the target release's bootstrap classpath
- Enable all recommended warnings: `-Xlint:all -Werror` in CI, `-Xlint:all` locally

### 4. Configure Project Structure

Project layout is a social contract for the team. Follow the Maven Standard Directory Layout even in Gradle projects -- deviating from it creates unnecessary friction.

**Standard single-module layout:**
```
project-root/
├── .gitignore
├── .java-version
├── README.md
├── build.gradle.kts          # or pom.xml
├── settings.gradle.kts       # Gradle only
├── gradle/
│   ├── libs.versions.toml    # Version catalog
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/project/
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       ├── java/
│       │   └── com/example/project/
│       └── resources/
└── build/                    # Generated, in .gitignore
```

**Multi-module Gradle layout:**
```
platform-root/
├── settings.gradle.kts       # Declares all subprojects
├── build.gradle.kts          # Root build (minimal -- delegates to convention plugins)
├── buildSrc/                 # Convention plugins (preferred for < 5 plugins)
│   ├── build.gradle.kts
│   └── src/main/kotlin/
│       ├── java-library-conventions.gradle.kts
│       └── java-application-conventions.gradle.kts
├── gradle/
│   └── libs.versions.toml
├── api/                      # Subproject
│   ├── build.gradle.kts
│   └── src/
├── core/                     # Subproject
│   ├── build.gradle.kts
│   └── src/
└── app/                      # Subproject
    ├── build.gradle.kts
    └── src/
```

**Multi-module Maven layout:**
```
platform-root/
├── pom.xml                   # Parent POM with <modules> list and <dependencyManagement>
├── api/
│   └── pom.xml
├── core/
│   └── pom.xml
└── app/
    └── pom.xml
```

**Package naming:** Use reverse-DNS convention: `com.companyname.projectname.modulename`. Establish this in the root configuration and enforce it with Checkstyle or ArchUnit.

### 5. Configure Dependency Management

Uncontrolled transitive dependencies are the leading cause of classpath conflicts and security vulnerabilities in Java projects.

**Gradle version catalog (`gradle/libs.versions.toml`):**
```toml
[versions]
junit-jupiter = "5.10.2"
assertj = "3.25.3"
guava = "33.1.0-jre"
slf4j = "2.0.13"
logback = "1.5.6"

[libraries]
junit-jupiter-api = { module = "org.junit.jupiter:junit-jupiter-api", version.ref = "junit-jupiter" }
junit-jupiter-engine = { module = "org.junit.jupiter:junit-jupiter-engine", version.ref = "junit-jupiter" }
assertj-core = { module = "org.assertj:assertj-core", version.ref = "assertj" }
guava = { module = "com.google.guava:guava", version.ref = "guava" }
slf4j-api = { module = "org.slf4j:slf4j-api", version.ref = "slf4j" }
logback-classic = { module = "ch.qos.logback:logback-classic", version.ref = "logback" }

[plugins]
shadow = { id = "com.github.johnrengelman.shadow", version = "8.1.1" }
```

**Maven BOM (Bill of Materials) usage:**
```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.junit</groupId>
      <artifactId>junit-bom</artifactId>
      <version>5.10.2</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

**Dependency scope hygiene:**
- Never use `compile` scope for test libraries -- use `testImplementation` (Gradle) or `test` scope (Maven)
- Use `compileOnly` (Gradle) or `provided` scope (Maven) for APIs that the runtime container provides (servlet API, Jakarta EE APIs)
- Use `runtimeOnly` for JDBC drivers, SLF4J implementations, and other runtime-only bindings -- keeping them off the compile classpath prevents accidental coupling
- Prefer `api` over `implementation` in Gradle for published library modules only -- `implementation` prevents compile classpath leakage for consumers

**Dependency locking (Gradle):**
```kotlin
// build.gradle.kts
dependencyLocking {
    lockAllConfigurations()
}
```
Run `./gradlew dependencies --write-locks` to generate lock files. Commit them. This ensures reproducible builds.

### 6. Configure Code Quality Tooling

Quality tooling must be configured from the first commit. Retrofitting it to an existing codebase with thousands of violations is painful.

**Static analysis:**
- **SpotBugs** (successor to FindBugs): Catches null dereferences, resource leaks, incorrect `equals`/`hashCode`, and security vulnerabilities at the bytecode level. Add the `spotbugs` Gradle plugin or the `spotbugs-maven-plugin`. Configure effort level `max` and threshold `low` for new projects
- **PMD**: Source-level rules for code smells: overly complex methods, empty catch blocks, unused variables. Use the built-in `java-bestpractices`, `java-errorprone`, and `java-codestyle` rulesets
- **Checkstyle**: Enforces naming conventions, import ordering, Javadoc presence on public API, and whitespace. Use Google Java Style or Sun Coding Conventions as the base and customize minimally

**Formatting:**
- **google-java-format**: Deterministic, non-negotiable formatting. Zero configuration debates. Integrate via the Spotless Gradle plugin (`com.diffplug.spotless`):
```kotlin
spotless {
    java {
        googleJavaFormat("1.22.0")
        removeUnusedImports()
        trimTrailingWhitespace()
        endWithNewline()
    }
}
```

**Pre-commit hooks:**
- Use the `pre-commit` framework with a `.pre-commit-config.yaml`, or configure a Gradle task that runs `./gradlew spotlessCheck checkstyleMain pmdMain` as a Git hook via the `com.github.jakemarsden.git-hooks` plugin

**Null safety:**
- Add JSpecify or `org.jetbrains:annotations` for `@Nullable` / `@NonNull` annotations on public APIs
- Configure NullAway (a SpotBugs plugin) to enforce null safety at compile time: catches null dereferences that SpotBugs misses

### 7. Configure Build Performance

Build speed directly affects developer productivity. Address it proactively.

**Gradle-specific optimizations:**
```properties
# gradle.properties
org.gradle.daemon=true
org.gradle.caching=true
org.gradle.parallel=true
org.gradle.configuration-cache=true
org.gradle.jvmargs=-Xmx2g -Dfile.encoding=UTF-8
```

- **Configuration cache:** Serializes the task graph after the first build. Subsequent builds skip configuration phase entirely. Reduce configuration time from 30s to 2s on large projects
- **Build cache:** Local cache by default; connect to Gradle Build Cache Node or Develocity (formerly Gradle Enterprise) for remote shared cache in CI
- **Parallel test execution:** Set `maxParallelForks = Runtime.getRuntime().availableProcessors() / 2` in the `test` task block
- **Incremental compilation:** Enabled by default in Gradle 6+; ensure annotation processors declare their inputs/outputs correctly or they break incrementality

**Maven-specific optimizations:**
- Use `mvn -T 1C` (one thread per CPU core) for parallel module builds
- Enable the Maven Daemon (`mvnd`) for persistent JVM and warm class loading
- Use `--no-transfer-progress` in CI to reduce log noise and slightly improve throughput
- Tune Surefire for parallel test execution: `<forkCount>0.5C</forkCount>` (50% of cores)

### 8. Verify the Setup End-to-End

A setup that cannot be verified is a guess. Run these checks before declaring the project ready.

- **Clean build from scratch:** Delete the build cache and local dependencies, then build. This catches "works in warm cache" failures. For Gradle: `./gradlew clean build --no-daemon --no-build-cache`
- **All quality checks pass:** `./gradlew check` (Gradle) or `mvn verify` (Maven) must exit zero. The `check` task in Gradle runs tests, SpotBugs, Checkstyle, PMD, and Spotless verification
- **Toolchain resolution:** Confirm the correct JDK is used: `./gradlew -q javaToolchains` shows all resolved toolchains
- **Dependency tree review:** Run `./gradlew dependencies --configuration compileClasspath` and inspect for unexpected transitive dependencies. Run `mvn dependency:tree` for Maven
- **Reproducibility:** Build twice, compare outputs. Identical input should produce byte-identical JARs when `reproducibleFileOrder` and `preserveFileTimestamps = false` are set in Gradle's `jar` task

---

## Output Format

When responding to a Java project setup request, structure the output as follows:

```
## Project Context Summary

| Dimension           | Value                          | Notes                          |
|---------------------|--------------------------------|--------------------------------|
| Build tool          | Gradle 8.x (Kotlin DSL)        | Multi-module; performance need |
| Java version        | 21 (LTS)                       | Toolchain auto-provisioned     |
| Project type        | Application + shared libraries | Fat JAR deployment             |
| Module count        | 4                              | api, core, persistence, app    |
| Deployment target   | Executable JAR (shadow plugin) |                                |

## Build Tool Decision
[1--2 sentences explaining the specific reason for the chosen tool given this project's constraints]

## settings.gradle.kts
[Complete, runnable settings file]

## Root build.gradle.kts
[Complete, runnable root build file with convention plugin wiring]

## buildSrc/src/main/kotlin/java-library-conventions.gradle.kts
[Convention plugin for library subprojects]

## buildSrc/src/main/kotlin/java-application-conventions.gradle.kts
[Convention plugin for application subprojects]

## gradle/libs.versions.toml
[Complete version catalog]

## gradle.properties
[Performance and configuration flags]

## .gitignore additions
[Java and Gradle/Maven specific entries]

## Recommended Next Steps
1. [Specific action]
2. [Specific action]
3. [Specific action]
```

---

## Rules

1. **Never omit the Gradle Wrapper or Maven Wrapper.** Builds that rely on a system-installed build tool fail when the system version differs. Always generate `gradlew` / `mvnw` and commit the wrapper JAR and properties file. The wrapper JAR checksum should be verified in CI.

2. **Never use dynamic versions (`1.2.+`, `latest.release`, `SNAPSHOT` in production).** Dynamic versions produce non-reproducible builds. SNAPSHOT dependencies are acceptable only during active development of an in-house library that is under concurrent development; pin to a release before merging to main.

3. **Always use the Gradle Kotlin DSL (`build.gradle.kts`) for new Gradle projects.** The Groovy DSL (`build.gradle`) has no static typing, making refactoring error-prone and IDE completion unreliable. The Kotlin DSL provides full IDE support and compile-time validation of build scripts.

4. **Never put business logic in build files.** Complex logic in `build.gradle.kts` that is not extractable to a `buildSrc` convention plugin or a standalone plugin is untestable and unmaintainable. If you write more than 20 lines of custom task logic inline, move it to `buildSrc`.

5. **Always separate API from implementation in library modules.** Use Gradle's `api` configuration only for dependencies that appear in the library's public API signatures. Use `implementation` for everything else. This prevents compile classpath pollution for consumers and reduces their recompilation surface area.

6. **Never allow compiler warnings in CI.** Configure `-Werror` in CI builds to treat all warnings as errors. Warnings are deferred bugs. Use a `compileJava` task configuration:
   ```kotlin
   tasks.withType<JavaCompile>().configureEach {
       options.compilerArgs.addAll(listOf("-Xlint:all", "-Werror"))
   }
   ```
   If a warning cannot be fixed, suppress it with a `@SuppressWarnings` annotation with a documented reason, not by disabling the flag globally.

7. **Always configure `sourceCompatibility` and `targetCompatibility` via toolchains, not raw properties.** Setting `sourceCompatibility = JavaVersion.VERSION_21` in Gradle does not guarantee that JDK 21 is actually used to compile -- it only sets the `--source` flag. Toolchain configuration (`java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }`) actually resolves and uses the correct JDK.

8. **Never commit generated files to version control.** The `build/` directory (Gradle) and `target/` directory (Maven) must be in `.gitignore`. Generated source files from annotation processors should also be excluded unless the project has a specific policy to commit them (e.g., for IDE compatibility with teams that do not run annotation processing).

9. **Always pin plugin versions explicitly.** A Gradle plugin without a pinned version in the `plugins {}` block or version catalog, or a Maven plugin without an explicit `<version>`, will resolve to an unpredictable version when the plugin repository updates. This is a reproducibility failure and a supply-chain risk.

10. **Always verify the build produces correct output on a clean environment before merging setup PRs.** Use a Docker container with only the JDK installed (no cached Gradle home, no local Maven repository) to verify that all dependencies resolve, all toolchains provision correctly, and the build succeeds from zero state. This catches missing repository declarations and corporate proxy requirements before they affect the whole team.

---

## Edge Cases

**Air-gapped or corporate proxy environments:**
All artifact resolution must go through a corporate Nexus or Artifactory proxy. Declare the proxy repository explicitly in `settings.gradle.kts` and remove the default `mavenCentral()` and `gradlePluginPortal()` repositories. In Maven, configure `~/.m2/settings.xml` with a `<mirror>` block pointing all repositories to the corporate mirror. Add the corporate root certificate to the JDK's `cacerts` truststore with `keytool -importcert`. Document this setup step in the README because new developers will always miss it.

**Migrating an existing Maven project to Gradle:**
Use the Gradle `init` task (`gradle init --type pom`) as a starting point -- it reads `pom.xml` and generates equivalent Gradle files. However, the output is always a starting point, not a final result. Review: scope mappings (Maven's `compile` scope becomes both `api` and `implementation` -- disambiguate), plugin equivalences (maven-surefire-plugin maps to the `test` task configuration), and profile handling (Maven profiles have no direct Gradle equivalent; convert them to custom Gradle properties or build variants). Validate that the generated dependency tree matches the Maven dependency tree exactly before switching CI.

**Annotation processors (MapStruct, Lombok, Dagger, AutoValue):**
Annotation processors must be declared in the `annotationProcessor` configuration (Gradle) or in the `maven-compiler-plugin`'s `annotationProcessorPaths` (Maven). Do NOT add them to `compile` or `implementation` scope -- this adds the processor JAR to the runtime classpath unnecessarily and can cause class conflicts. With Lombok specifically, also add it to `compileOnly`. With Gradle's incremental compilation, annotation processors must explicitly declare their inputs and outputs to avoid breaking incrementality; processors that do not support this require `options.incremental = false` in the `compileJava` task.

**GraalVM Native Image targets:**
If the project produces a native binary via GraalVM, add the `org.graalvm.buildtools.native` Gradle plugin. Native compilation requires metadata (reflection configuration, resource configuration) for any dynamic class loading. Start with the GraalVM tracing agent: run tests with `-agentlib:native-image-agent=config-output-dir=src/main/resources/META-INF/native-image` to auto-generate configuration. Be aware that native compilation takes 2--5 minutes even on fast hardware and requires at least 8 GB of RAM for non-trivial projects -- do not run it in every CI build, only in a dedicated release pipeline.

**Composite builds vs. `buildSrc` vs. standalone plugin projects:**
Three approaches exist for sharing build logic in Gradle multi-project builds, each appropriate for different scales. `buildSrc` is a special Gradle directory that is automatically built before the main build -- use it for 1--5 convention plugins that are only needed in this project. Composite builds (`includeBuild("../platform-build-logic")`) allow multiple independent Gradle builds to share logic -- use this when the same convention plugins are shared across multiple independent repositories. A standalone plugin project published to a plugin repository (Gradle Plugin Portal or internal Nexus) is appropriate when the plugins have external consumers outside the organization's VCS.

**Projects targeting multiple Java versions simultaneously:**
Some libraries need to compile against Java 8 source compatibility while using Java 11 APIs via Multi-Release JARs (MRJARs). Configure the `sourceSets` in Gradle to include a `java11` source set with the correct `--release 11` flag and configure the `jar` task to include `META-INF/versions/11/` entries. The `japicmp` plugin can enforce that public API does not accidentally break binary compatibility between versions. Document the MRJAR structure in the README because it is non-obvious to contributors.

**Reproducible builds for artifact publishing:**
When publishing to Maven Central or a private repository, byte-identical artifacts across builds are important for verifiability. In Gradle, add to every `jar` task block:
```kotlin
isPreserveFileTimestamps = false
isReproducibleFileOrder = true
```
Also exclude the `META-INF/MANIFEST.MF` `Created-By` entry or normalize it. Use `./gradlew jar && ./gradlew jar && diff build/libs/project.jar build/libs/project.jar.bak` (built twice) to verify. Maven enforces this via the `artifact:compare` goal or the `reproducible-build-maven-plugin`.

---

## Example

**Input:** "I'm starting a new backend platform with 4 modules: a shared API (interfaces and DTOs), a core business logic module, a persistence module using JDBC, and an executable application. We'll be using Java 21, targeting fat JAR deployment, and want serious code quality enforcement from day one. We have 6 developers and want consistent builds. No Spring -- plain Java with minimal frameworks."

---

**Output:**

## Project Context Summary

| Dimension           | Value                              | Notes                                              |
|---------------------|------------------------------------|----------------------------------------------------|
| Build tool          | Gradle 8.8 (Kotlin DSL)            | Multi-module + performance + custom build logic     |
| Java version        | 21 (LTS)                           | Toolchain auto-provisioned via Foojay              |
| Project type        | Hybrid: libraries + application    | api, core, persistence are libs; app is executable |
| Module count        | 4                                  | Structured dependency graph enforced               |
| Deployment target   | Fat JAR (shadow plugin)            | Standalone executable, no external runtime         |
| Quality enforcement | Checkstyle + SpotBugs + PMD + Spotless | All enforced in check task, CI blocks on failure |

## Build Tool Decision
Gradle 8.8 with Kotlin DSL is the clear choice: 4 modules with distinct roles (library vs. application), a team of 6 requiring consistent builds, and fat JAR packaging all benefit from Gradle's incremental build, build caching, and convention plugin system. The Kotlin DSL gives developers full IDE completion in IntelliJ IDEA, reducing build script errors.

---

## `settings.gradle.kts`

```kotlin
rootProject.name = "platform"

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

include(":api")
include(":core")
include(":persistence")
include(":app")
```

---

## `gradle/libs.versions.toml`

```toml
[versions]
junit-jupiter     = "5.10.2"
assertj           = "3.25.3"
slf4j             = "2.0.13"
logback           = "1.5.6"
spotbugs          = "4.8.5"
checkstyle        = "10.17.0"
pmd               = "7.3.0"
spotless          = "6.25.0"
shadow            = "8.1.1"
hikaricp          = "5.1.0"

[libraries]
junit-jupiter-api     = { module = "org.junit.jupiter:junit-jupiter-api",    version.ref = "junit-jupiter" }
junit-jupiter-engine  = { module = "org.junit.jupiter:junit-jupiter-engine",  version.ref = "junit-jupiter" }
junit-jupiter-params  = { module = "org.junit.jupiter:junit-jupiter-params",  version.ref = "junit-jupiter" }
assertj-core          = { module = "org.assertj:assertj-core",               version.ref = "assertj" }
slf4j-api             = { module = "org.slf4j:slf4j-api",                    version.ref = "slf4j" }
logback-classic       = { module = "ch.qos.logback:logback-classic",         version.ref = "logback" }
hikaricp              = { module = "com.zaxxer:HikariCP",                    version.ref = "hikaricp" }

[plugins]
shadow   = { id = "com.github.johnrengelman.shadow", version.ref = "shadow" }
spotless = { id = "com.diffplug.spotless",           version.ref = "spotless" }
```

---

## `gradle.properties`

```properties
# Daemon and performance
org.gradle.daemon=true
org.gradle.caching=true
org.gradle.parallel=true
org.gradle.configuration-cache=true
org.gradle.jvmargs=-Xmx2g -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8

# Project metadata
platformVersion=0.1.0-SNAPSHOT
```

---

## `buildSrc/build.gradle.kts`

```kotlin
plugins {
    `kotlin-dsl`
}

repositories {
    gradlePluginPortal()
    mavenCentral()
}

dependencies {
    implementation("com.diffplug.spotless:spotless-plugin-gradle:6.25.0")
    implementation("com.github.spotbugs.snom:spotbugs-gradle-plugin:6.0.15")
}
```

---

## `buildSrc/src/main/kotlin/java-base-conventions.gradle.kts`

```kotlin
// Applied to ALL subprojects: compiler settings, quality tools, test configuration

plugins {
    java
    id("com.diffplug.spotless")
    id("com.github.spotbugs")
    checkstyle
    pmd
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
    withSourcesJar()
    withJavadocJar()
}

tasks.withType<JavaCompile>().configureEach {
    options.encoding = "UTF-8"
    options.compilerArgs.addAll(
        listOf(
            "-Xlint:all",
            "-Xlint:-processing",   // Suppress annotation processor warnings we don't control
            "-Werror"
        )
    )
    options.isIncremental = true
}

// ---------- Formatting ----------
spotless {
    java {
        googleJavaFormat("1.22.0")
        removeUnusedImports()
        trimTrailingWhitespace()
        endWithNewline()
    }
    kotlinGradle {
        ktlint("1.2.1")
    }
}

// ---------- SpotBugs ----------
spotbugs {
    effort = com.github.spotbugs.snom.Effort.MAX
    reportLevel = com.github.spotbugs.snom.Confidence.LOW
    excludeFilter = rootProject.file("config/spotbugs/exclude.xml")
}
tasks.withType<com.github.spotbugs.snom.SpotBugsTask>().configureEach {
    reports.create("html") { required = true }
    reports.create("xml")  { required = false }
}

// ---------- Checkstyle ----------
checkstyle {
    toolVersion = "10.17.0"
    configFile = rootProject.file("config/checkstyle/checkstyle.xml")
    isIgnoreFailures = false
    maxWarnings = 0
}

// ---------- PMD ----------
pmd {
    toolVersion = "7.3.0"
    isConsoleOutput = true
    ruleSets = emptyList() // Disable defaults; use explicit rulesets below
    ruleSetFiles = rootProject.files("config/pmd/ruleset.xml")
}

// ---------- Tests ----------
tasks.withType<Test>().configureEach {
    useJUnitPlatform()
    maxParallelForks = (Runtime.getRuntime().availableProcessors() / 2).coerceAtLeast(1)
    testLogging {
        events("passed", "skipped", "failed")
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
    }
    jvmArgs("-XX:+EnableDynamicAgentLoading") // Suppress JDK 21 agent warnings
}
```

---

## `buildSrc/src/main/kotlin/java-library-conventions.gradle.kts`

```kotlin
// Applied to :api, :core, :persistence

plugins {
    `java-library`
    id("java-base-conventions")
}

// Library modules publish sources and javadoc; no fat JAR
tasks.named<Jar>("jar") {
    isPreserveFileTimestamps = false
    isReproducibleFileOrder  = true
}
```

---

## `buildSrc/src/main/kotlin/java-application-conventions.gradle.kts`

```kotlin
// Applied to :app only

plugins {
    application
    id("java-base-conventions")
    id("com.github.johnrengelman.shadow")
}

tasks.named<com.github.johnrengelman.shadow.tasks.ShadowJar>("shadowJar") {
    archiveClassifier = ""   // Replace the plain JAR with the shadow JAR
    mergeServiceFiles()      // Required for SPI: META-INF/services merging
    isPreserveFileTimestamps = false
    isReproducibleFileOrder  = true
}

tasks.named("build") {
    dependsOn("shadowJar")
}
```

---

## `:api/build.gradle.kts`

```kotlin
plugins {
    id("java-library-conventions")
}

description = "Platform public API: interfaces, DTOs, and domain events"

// No implementation dependencies -- pure API surface.
// Other modules depend on this; keep it thin.
dependencies {
    api(libs.slf4j.api) // SLF4J is part of the public API contract (log factories in interfaces)

    testImplementation(libs.junit.jupiter.api)
    testImplementation(libs.assertj.core)
    testRuntimeOnly(libs.junit.jupiter.engine)
}
```

---

## `:core/build.gradle.kts`

```kotlin
plugins {
    id("java-library-conventions")
}

description = "Business logic: domain services, use cases, and domain model"

dependencies {
    api(project(":api"))       // api because core's return types reference api interfaces
    implementation(libs.slf4j.api)
    runtimeOnly(libs.logback.classic) // Logback is a runtime binding; not on compile classpath

    testImplementation(libs.junit.jupiter.api)
    testImplementation(libs.junit.jupiter.params)
    testImplementation(libs.assertj.core)
    testRuntimeOnly(libs.junit.jupiter.engine)
}
```

---

## `:persistence/build.gradle.kts`

```kotlin
plugins {
    id("java-library-conventions")
}

description = "Persistence layer: JDBC repositories implementing api interfaces"

dependencies {
    implementation(project(":api"))    // implementation: persistence types are not in public API
    implementation(libs.hikaricp)
    runtimeOnly(libs.logback.classic)

    testImplementation(libs.junit.jupiter.api)
    testImplementation(libs.assertj.core)
    testRuntimeOnly(libs.junit.jupiter.engine)
}
```

---

## `:app/build.gradle.kts`

```kotlin
plugins {
    id("java-application-conventions")
}

description = "Executable application: wires all modules together and owns main()"

application {
    mainClass = "com.example.platform.app.Main"
    applicationDefaultJvmArgs = listOf(
        "-XX:+UseZGC",              // ZGC: low-latency GC, available on Java 21
        "-Xms256m",
        "-Xmx512m",
        "-Dfile.encoding=UTF-8"
    )
}

dependencies {
    implementation(project(":core"))
    implementation(project(":persistence"))
    runtimeOnly(libs.logback.classic)

    testImplementation(libs.junit.jupiter.api)
    testImplementation(libs.assertj.core)
    testRuntimeOnly(libs.junit.jupiter.engine)
}
```

---

## Root `build.gradle.kts`

```kotlin
// Root build file: applies nothing directly.
// Convention plugins handle everything per subproject.
// Use this file only for cross-project tasks.

tasks.register("printVersion") {
    doLast {
        println("Platform version: ${project.properties["platformVersion"]}")
    }
}
```

---

## `.gitignore` (Java + Gradle additions)

```
# Build output
build/
.gradle/

# IntelliJ IDEA
.idea/
*.iml
*.iws
out/

# Eclipse
.project
.classpath
.settings/

# macOS
.DS_Store

# Gradle wrapper verification (keep the JAR, ignore local caches)
!gradle/wrapper/gradle-wrapper.jar

# JVM heap dumps (from -XX:+HeapDumpOnOutOfMemoryError)
*.hprof
```

---

## `.java-version`

```
21
```

---

## `.sdkmanrc`

```
java=21.0.3-tem
gradle=8.8
```

---

## Verification Checklist

Run these commands in sequence to confirm the setup is complete and correct:

```bash
# 1. Verify Gradle wrapper integrity
./gradlew --version

# 2. Show resolved toolchains (confirm JDK 21 is auto-provisioned)
./gradlew -q javaToolchains

# 3. Clean build with no cache (simulates a fresh CI agent)
./gradlew clean build --no-build-cache --rerun-tasks

# 4. Confirm all quality checks pass
./gradlew check

# 5. Inspect compile classpath of :app to verify no unexpected transitive deps
./gradlew :app:dependencies --configuration compileClasspath

# 6. Verify shadow JAR is produced and executable
java -jar app/build/libs/app.jar --help

# 7. Verify configuration cache works (second run should say "Configuration cache entry reused")
./gradlew build
./gradlew build
```

---

## Recommended Next Steps

1. Add `config/checkstyle/checkstyle.xml` using the Google Checks base and customize it for your package naming convention (`com.example.platform`)
2. Add `config/spotbugs/exclude.xml` with any false-positive patterns discovered in the first week -- keep this list small and documented
3. Configure CI (GitHub Actions or equivalent) with `./gradlew check` as the required PR check and `./gradlew build --build-cache` using a remote cache node for shared CI caching
4. Add a dependency update task (`./gradlew dependencyUpdates`) via the `com.github.ben-manes.versions` plugin so the team can run a weekly check for new releases
5. When the first class that accesses a database is written in `:persistence`, add a Testcontainers integration test to verify the JDBC connection and schema initialization -- do not leave persistence untested until end-to-end testing
