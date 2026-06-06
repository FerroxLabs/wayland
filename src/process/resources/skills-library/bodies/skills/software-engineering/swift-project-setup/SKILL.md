---
name: swift-project-setup
description: |
  Guides expert-level swift project setup implementation: swift and best-practices decision frameworks, production-ready patterns, and concrete templates for swift project setup workflows.
  Use when the user asks about swift project setup, swift project setup configuration, or swift best practices for swift projects.
  Do NOT use when the user needs a different languages runtimes capability -- check sibling skills in the languages runtimes subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "swift best-practices template"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Swift Project Setup

## When to Use

**Use this skill when:**
- User is initializing a new Swift package, iOS app, macOS app, or server-side Swift service and needs a production-ready project structure
- User wants to configure Swift Package Manager (SPM) with multiple targets, products, and dependencies
- User is migrating from CocoaPods or Carthage to SPM and needs guidance on the Package.swift manifest
- User needs to set up a multi-module Swift project with clean separation between feature modules, domain layers, and infrastructure layers
- User wants to establish linting (SwiftLint), formatting (SwiftFormat), code generation (Sourcery), and documentation (DocC) tooling for a Swift project
- User needs to configure Swift concurrency settings (strict concurrency checking, actor isolation) for a new codebase
- User is setting up a Swift project with mixed targets -- for example, a library with both iOS and macOS deployment targets, plus a command-line test harness

**Do NOT use this skill when:**
- User is asking about Objective-C project setup -- this skill is Swift-only; defer to language-migration guidance if bridging is involved
- User needs Xcode workspace or scheme configuration for a complex multi-app monorepo -- that is a separate CI/CD and workspace management concern
- User is asking about SwiftUI architecture patterns (MVVM, TCA, MV) -- check the swift-architecture-patterns skill
- User needs help writing Swift tests or test plans -- check the swift-testing skill
- User is asking about Swift performance profiling with Instruments -- check the swift-performance-optimization skill
- User needs help configuring App Store Connect, provisioning profiles, or code signing -- check the ios-code-signing skill
- User wants general Swift language syntax help -- this skill is specifically about project structure and setup

---

## Process

### 1. Gather Project Context and Target Platforms

Before recommending any structure, collect the following information:

- **Target platform(s):** iOS (minimum deployment target -- typically 16.0+ for Swift concurrency without continuations), macOS (13.0+), watchOS, tvOS, visionOS, Linux (for server-side Swift or CLI tools)
- **Project type:** Application (executable), library (static or dynamic), framework, Swift macro, command-line tool, or server-side service
- **Distribution channel:** App Store, SPM package registry, internal enterprise, or self-hosted
- **Team size and tooling maturity:** Solo developer vs. team of 5+ engineers determines how much linting automation and module enforcement to impose from day one
- **Existing codebase:** New greenfield project vs. migration from CocoaPods/Carthage vs. Xcode project without SPM
- **Concurrency model:** Determine whether the project will use async/await throughout, or must support iOS 14/15 compatibility requiring `@available` guards or Combine bridging

Produce a checklist before proceeding:
- [ ] Platform targets and minimum deployment versions confirmed
- [ ] Project type (app, library, CLI, server) confirmed
- [ ] SPM vs. Xcode project vs. hybrid approach decided
- [ ] Swift version confirmed (minimum Swift 5.9 for macros, 5.10 for `~Copyable`, 6.0 for full strict concurrency)
- [ ] Monorepo vs. single-package structure decided

---

### 2. Choose the Project Layout Strategy

Select one of three layouts based on project type and scale:

**Layout A -- Single-Package Library or CLI Tool:**
Use when building a reusable library or CLI with no UI. The entire project lives in one Package.swift with clearly named targets.

```
MyPackage/
├── Package.swift
├── Sources/
│   ├── MyPackage/          # Main library target
│   └── MyPackageCLI/       # Optional CLI executable target
├── Tests/
│   └── MyPackageTests/
└── Plugins/                # Optional build tool or command plugins
```

**Layout B -- iOS/macOS App with Feature Modules:**
Use when building an application that will grow beyond 50K lines of code or when multiple developers work on distinct features simultaneously. Use a local package to house feature modules, keeping the Xcode project thin.

```
MyApp/
├── MyApp.xcodeproj (or .xcworkspace)
├── MyApp/                  # App target sources (entry point, AppDelegate/App)
├── MyAppPackage/           # Local SPM package containing all modules
│   ├── Package.swift
│   └── Sources/
│       ├── FeatureHome/
│       ├── FeatureProfile/
│       ├── DomainModels/
│       ├── NetworkingKit/
│       └── DesignSystem/
└── Tests/
```

**Layout C -- Multi-Package Monorepo:**
Use when multiple Swift packages share code and are developed together (e.g., a shared domain model used by an iOS app and a server-side Swift backend). Requires a workspace-level Package.swift or local path dependencies.

```
monorepo/
├── packages/
│   ├── SharedDomain/
│   ├── iOSApp/
│   └── ServerApp/
├── Makefile
└── scripts/
```

Decision rule: If the project is a pure library with no app target, use Layout A. If it is an app with more than 3 logical feature areas or a team of 3+ developers, use Layout B from day one -- retrofitting modularization later is expensive. Use Layout C only when two separate deployables (app + server) genuinely share domain types.

---

### 3. Write the Package.swift Manifest

A well-formed Package.swift is the foundation of a Swift project. Apply these patterns:

**Swift Tools Version:**
Always set `swift-tools-version` to the minimum version your team's Xcode or Swift toolchain supports. As of 2024, `5.9` is the safe minimum for most projects; use `5.10` for `~Copyable` support; use `6.0` only if the entire team uses Xcode 16+ and the project targets Swift 6.

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MyApp",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(name: "DomainModels", targets: ["DomainModels"]),
        .library(name: "NetworkingKit", targets: ["NetworkingKit"]),
        .executable(name: "MyAppCLI", targets: ["MyAppCLI"])
    ],
    dependencies: [
        // Pin to exact minor versions in apps, use version ranges in libraries
        .package(url: "https://github.com/apple/swift-algorithms", from: "1.2.0"),
        .package(url: "https://github.com/apple/swift-log", from: "1.5.0"),
    ],
    targets: [
        .target(
            name: "DomainModels",
            dependencies: [],
            path: "Sources/DomainModels",
            swiftSettings: sharedSwiftSettings
        ),
        .target(
            name: "NetworkingKit",
            dependencies: [
                "DomainModels",
                .product(name: "Logging", package: "swift-log")
            ],
            path: "Sources/NetworkingKit",
            swiftSettings: sharedSwiftSettings
        ),
        .testTarget(
            name: "NetworkingKitTests",
            dependencies: ["NetworkingKit"],
            path: "Tests/NetworkingKitTests"
        )
    ]
)

// Define shared Swift settings as a constant to avoid repetition
let sharedSwiftSettings: [SwiftSetting] = [
    .enableUpcomingFeature("BareSlashRegexLiterals"),
    .enableUpcomingFeature("ConciseMagicFile"),
    .enableExperimentalFeature("StrictConcurrency"),
    // Remove the above and use the below when targeting Swift 6:
    // .swiftLanguageVersion(.v6)
]
```

Key rules for the manifest:
- Use `let sharedSwiftSettings` at the top of the file to apply consistent compiler flags across all targets -- do not copy-paste settings per target
- Separate `products` (public-facing API surface) from `targets` (build graph nodes) -- a target is an implementation detail; a product is a contract
- Use `.package(path: "../SharedDomain")` for local package dependencies within a monorepo -- never use file URLs pointing outside the repository root
- Define `.plugin` targets for build tool integrations (SwiftLint as a build plugin, Sourcery code generation) rather than running them as pre-build scripts in Xcode
- Avoid `.unsafeFlags` in any target destined for the App Store or package registry -- it prevents downstream consumers from using the package

---

### 4. Configure Code Quality Tooling

Set up the following tools in this order: formatting first, linting second, code generation third.

**SwiftFormat:**
Create `.swiftformat` in the project root. Key settings for a consistent codebase:

```
--swiftversion 5.9
--indent 4
--maxwidth 120
--wraparguments before-first
--wrapparameters before-first
--wrapcollections before-first
--commas always
--semicolons never
--importgrouping testable-bottom
--patternlet inline
--redundanttype inferred
--unusedarguments closure-only
--disable trailingCommas    # only if team prefers no trailing commas
```

Run SwiftFormat as a pre-commit hook via `.git/hooks/pre-commit` or through a Makefile target:
```
make format  # runs: swiftformat . --config .swiftformat
```

**SwiftLint:**
Create `.swiftlint.yml` in the project root. Do not enable all rules by default -- start with `opt_in_rules` for the highest-value additions:

```yaml
included:
  - Sources
  - Tests

excluded:
  - .build
  - DerivedData

disabled_rules:
  - trailing_whitespace  # handled by SwiftFormat

opt_in_rules:
  - array_init
  - closure_end_indentation
  - conditional_returns_on_newline
  - contains_over_filter_count
  - contains_over_filter_is_empty
  - discouraged_optional_boolean
  - empty_collection_literal
  - empty_string
  - explicit_init
  - fallthrough
  - file_name_no_space
  - first_where
  - force_unwrapping
  - ibinspectable_in_extension
  - implicit_return
  - last_where
  - literal_expression_end_indentation
  - lower_acl_than_parent
  - modifier_order
  - multiline_function_chains
  - operator_usage_whitespace
  - prefer_self_in_static_references
  - redundant_nil_coalescing
  - sorted_imports
  - strict_fileprivate
  - toggle_bool
  - unneeded_parentheses_in_closure_argument
  - vertical_parameter_alignment_on_call

line_length:
  warning: 120
  error: 160
  ignores_comments: true
  ignores_urls: true

type_body_length:
  warning: 250
  error: 400

file_length:
  warning: 400
  error: 600

function_body_length:
  warning: 40
  error: 80

cyclomatic_complexity:
  warning: 10
  error: 20

force_cast: error
force_try:
  severity: error
```

Integrate SwiftLint as an SPM plugin target for library projects. For Xcode app projects, add a Run Script phase that invokes `swiftlint lint --strict` and fails the build on errors (not warnings) during CI.

**Sourcery (if code generation is needed):**
Create a `sourcery.yml` configuration file. Use Sourcery selectively -- AutoMockable protocol stubs for testing and Encodable/Decodable boilerplate are the highest-value use cases:

```yaml
sources:
  - Sources/DomainModels
templates:
  - Templates/AutoMockable.stencil
output:
  - Tests/Mocks
args:
  imports:
    - Foundation
```

---

### 5. Set Up the Module Dependency Graph

Establish a strict dependency rule before writing any code -- once violated, it becomes expensive to fix.

**Layered Architecture for Apps:**
```
App Target (entry point, no business logic)
    └── FeatureModules (UI + feature-specific state)
            └── DomainModels (pure Swift types, no UIKit/SwiftUI import)
                    └── CoreUtilities (extensions, logging, error types)
```

Rules for the dependency graph:
- `DomainModels` must have zero external dependencies and zero Apple framework imports except Foundation. This keeps it testable without any simulator and compilable on Linux for server-side use.
- `NetworkingKit` depends on `DomainModels` for request/response types but never on any feature module -- this prevents circular dependencies
- Feature modules may depend on sibling feature modules only if the dependency is downward in the feature hierarchy -- never upward or lateral. If two feature modules need to share something, extract it to `DomainModels` or a shared `SharedFeatureKit` module
- Use `@testable import` only in test targets. Production targets must only use `public` and `internal` APIs

Enforce the dependency graph via SPM -- since SPM only builds what is declared, undeclared dependencies will not compile. This is the primary enforcement mechanism.

---

### 6. Configure Swift Concurrency and Type Safety Settings

Apply per-target Swift settings to incrementally adopt Swift 6 strict concurrency:

**For new Swift 5.9/5.10 projects (pre-Swift 6):**
```swift
swiftSettings: [
    .enableExperimentalFeature("StrictConcurrency"),
    // Treat Sendable warnings as errors in new code
    .unsafeFlags(["-warnings-as-errors"], .when(configuration: .release))
]
```

**For Swift 6 projects:**
```swift
swiftSettings: [
    .swiftLanguageVersion(.v6)
]
```

Actor isolation decisions:
- Use `@MainActor` on all View Models (ObservableObject subclasses or `@Observable` types) that own UI state -- this eliminates the most common data race in iOS apps
- Mark networking and persistence types as `actor` when they maintain mutable state accessed from multiple concurrency domains
- Use `nonisolated` explicitly on computed properties and methods of actors that do not access actor-isolated state -- this avoids unnecessary hop to the actor's executor
- Prefer `AsyncSequence` (using `AsyncStream` or custom implementations) over Combine publishers for new code in Swift 5.9+ -- Combine still has a place in bridging to existing UIKit code
- Set `SWIFT_STRICT_CONCURRENCY = complete` in Xcode build settings for new targets from day one; do not wait until Swift 6

---

### 7. Set Up CI Configuration

A production Swift project must build and test in CI from day one. Provide a minimal but complete CI setup:

**GitHub Actions (`.github/workflows/swift.yml`):**
```yaml
name: Swift CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-and-test:
    runs-on: macos-14  # Xcode 15.x
    steps:
      - uses: actions/checkout@v4
      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode_15.4.app
      - name: Resolve dependencies
        run: swift package resolve
      - name: Build
        run: swift build -c release
      - name: Test
        run: swift test --parallel --enable-code-coverage
      - name: Lint
        run: swiftlint lint --strict --reporter github-actions-logging
      - name: Format check
        run: swiftformat --lint . --config .swiftformat

  build-linux:
    runs-on: ubuntu-latest
    container: swift:5.9
    steps:
      - uses: actions/checkout@v4
      - name: Build on Linux
        run: swift build
      - name: Test on Linux
        run: swift test --parallel
```

Key CI decisions:
- Run `--parallel` on `swift test` to exercise concurrency code and reduce build time -- this typically cuts test time by 40-60% on multi-core CI machines
- The Linux build job catches accidental Apple-framework imports in `DomainModels` and other platform-agnostic modules
- Use `cancel-in-progress: true` to avoid wasting CI minutes on outdated PR pushes
- Cache the `.build` directory using `actions/cache` keyed on `Package.resolved` hash to avoid re-resolving dependencies on every run

---

### 8. Document Architecture Decisions

Create an `ADR/` directory at the project root. Write an ADR for each significant setup decision using the MADR (Markdown Architecture Decision Records) format:

```
ADR/
├── 0001-use-spm-over-cocoapods.md
├── 0002-module-dependency-direction.md
├── 0003-swift-concurrency-migration-plan.md
└── 0004-swiftlint-rule-configuration.md
```

Minimum ADR content:
1. **Status:** Accepted / Superseded by / Deprecated
2. **Context:** What forced this decision
3. **Decision:** What was decided
4. **Consequences:** What this makes easier, what it makes harder, what technical debt is incurred

---

## Output Format

When responding to a Swift project setup request, structure the output as follows:

```
## Swift Project Setup Plan

### Project Profile
| Dimension          | Value                                      |
|--------------------|--------------------------------------------|
| Project Type       | [Library / iOS App / macOS App / CLI / Server] |
| Swift Version      | [5.9 / 5.10 / 6.0]                         |
| Minimum Deployment | [iOS 16.0, macOS 13.0, etc.]               |
| Module Count       | [Single / 2-5 modules / 5+ modules]        |
| Layout Strategy    | [A: Single Package / B: App + Local Package / C: Monorepo] |
| Concurrency Mode   | [Strict / Warnings-only / Legacy Async]    |

---

### Package.swift
[Complete, runnable Package.swift with all targets and settings]

---

### Directory Structure
[ASCII tree of the complete project layout]

---

### Tooling Configuration
[.swiftformat config, .swiftlint.yml config, any Makefile targets]

---

### Dependency Graph
[ASCII diagram of module dependency directions]

---

### CI Configuration
[Complete GitHub Actions or Xcode Cloud workflow YAML]

---

### Key Decisions and Rationale
| Decision                        | Chosen Approach          | Rationale                              |
|---------------------------------|--------------------------|----------------------------------------|
| Package manager                 | SPM                      | [reason]                               |
| Module separation               | [approach]               | [reason]                               |
| Concurrency strictness          | [level]                  | [reason]                               |
| Minimum deployment target       | [version]                | [reason]                               |

---

### Setup Checklist
- [ ] Package.swift created and resolves without errors
- [ ] All targets compile on release configuration
- [ ] Tests run with `swift test --parallel`
- [ ] SwiftLint passes with zero errors
- [ ] SwiftFormat passes `--lint` check
- [ ] CI pipeline passes on first commit
- [ ] ADR directory initialized with at least one decision record
- [ ] Linux build (if applicable) passes
```

---

## Rules

1. **NEVER set a minimum deployment target lower than necessary.** Every version below iOS 16.0 or macOS 13.0 forces `withCheckedContinuation` bridges for async/await and prevents use of `@Observable` (iOS 17+). Explicitly ask the user what their minimum supported version is -- do not default to iOS 14 or lower without a strong business reason.

2. **NEVER use `.unsafeFlags` in any library target that will be published to the SPM package registry or consumed by external packages.** Swift will refuse to build packages that depend on a target with `.unsafeFlags`. Use `.enableUpcomingFeature`, `.enableExperimentalFeature`, and legitimate `SwiftSetting` values instead.

3. **ALWAYS pin exact versions in `Package.resolved` for application targets by committing the file to version control.** For library packages, commit `Package.resolved` as well but expect to update it frequently. The resolved file prevents "it worked on my machine" dependency drift.

4. **NEVER put UI code (SwiftUI, UIKit, AppKit imports) in a module that is supposed to be platform-agnostic.** The moment `import SwiftUI` appears in `DomainModels`, the module becomes untestable without a simulator and uncompilable on Linux. Use `#if canImport(SwiftUI)` guards only when a single module must serve both contexts with explicit justification.

5. **ALWAYS use `access control` deliberately from day one.** Default to `internal`. Use `public` only on APIs intentionally exposed to other modules. Use `private` and `fileprivate` to scope implementation details. Never leave types as implicitly `internal` without thinking -- the discipline prevents accidental API surface expansion.

6. **NEVER create circular dependencies between SPM targets.** SPM will fail to build with a clear error, but fixing circular dependencies in an established codebase is extremely costly. If two targets need to share a type, extract it to a third "shared types" target that both depend on.

7. **ALWAYS enable `SWIFT_STRICT_CONCURRENCY = complete` for all new targets in Xcode 15+ projects.** Waiting until Swift 6 to discover data race warnings is a migration nightmare. Address each `Sendable` violation when the code is fresh -- retroactive conformance to `Sendable` on hundreds of types is a multi-day task.

8. **NEVER add a third-party dependency without evaluating it against these four criteria:** (a) active maintenance within the last 6 months, (b) fewer than 10 unresolved critical issues, (c) compile-time overhead acceptable on a clean build (benchmark with `swift build --jobs 1` before and after), (d) license compatible with distribution channel. For App Store apps, GPL licenses are incompatible.

9. **ALWAYS create a `Makefile` or `scripts/` directory with standardized build targets.** New team members should be able to run `make setup`, `make build`, `make test`, and `make lint` without reading any documentation. This is especially important for onboarding and CI consistency.

10. **NEVER rely on Xcode's "automatically manage signing" for library packages.** Library packages have no code signing requirement -- only executable targets do. Mixing library and app targets in a single Xcode project without understanding this distinction causes spurious signing errors in CI. Keep library packages in pure SPM projects with no Xcode project file unless there is a concrete need for one.

---

## Edge Cases

### Migrating from CocoaPods to SPM
CocoaPods and SPM can coexist during migration, but they conflict when both manage the same dependency. Use this approach:
1. Identify all Pods that have official SPM support (check the repository for a `Package.swift` file at the root)
2. Migrate one pod at a time, starting with leaf dependencies (those with no other pod dependencies)
3. Remove the pod from `Podfile`, add the SPM equivalent to `Package.swift`, then run `pod install` followed by `swift package resolve`
4. Test the build before moving to the next pod
5. For pods without SPM support, evaluate whether to fork and add SPM support, write a wrapper package, or continue using CocoaPods for that specific dependency until an alternative exists
6. Some pods use Objective-C and require bridging headers -- these cannot be migrated to SPM modules cleanly without wrapping the Objective-C in a `clang` module map inside a `.xcframework`

### Swift Macros (Swift 5.9+)
Macro targets require a special setup that many developers overlook:
- Macro implementation targets must use `import SwiftSyntax` and `import SwiftSyntaxMacros` -- add `swift-syntax` as a package dependency (version `509.0.0` for Swift 5.9, `510.0.0` for Swift 5.10, `600.0.0` for Swift 6.0)
- Macro implementation targets must have `compilerPluginTarget` or be declared as `.macro` target type
- Macros must be in a separate target from their clients -- you cannot define and use a macro in the same target
- Macro testing requires `SwiftSyntaxMacrosTestSupport` -- add a dedicated `MacroTests` test target
- Macro compilation is slow on first build -- `swift build` times increase by 30-120 seconds depending on the macro complexity. Add `#warning("Macros slow first build -- this is expected")` in the macro target for new team members

### Xcode Cloud vs. GitHub Actions
When a project uses Xcode Cloud (Apple's CI):
- The `ci_scripts/` directory must be at the Xcode project root (not the SPM package root if they differ)
- `ci_pre_xcodebuild.sh` is the right place for SwiftLint and SwiftFormat checks -- not a build phase, which would re-run on every incremental build
- Xcode Cloud does not support custom Docker containers -- all tools (SwiftLint, SwiftFormat) must be installed via Homebrew in `ci_post_clone.sh`
- Test plans (`.xctestplan` files) must be committed to version control for Xcode Cloud to pick them up; ad-hoc scheme test configurations are not picked up automatically

### Sharing Code Between iOS App and Server-Side Swift
When a `DomainModels` target must compile on both Darwin and Linux:
- Audit every import -- `Foundation` is available on Linux but many of its APIs behave differently (e.g., `DateFormatter` locale handling, `JSONDecoder` key decoding behavior on Linux vs. Darwin)
- `Codable` works cross-platform but `NSCoding` does not -- avoid `NSCoding` in shared modules
- `UUID`, `Date`, and `Decimal` are all available cross-platform via Foundation
- `FileManager` works on Linux but path separators differ -- use `URL`-based APIs exclusively
- Use the Linux CI job (see Process Step 7) as the enforcing mechanism -- it will fail to compile if you accidentally import an Apple-only framework

### Large Teams (10+ Engineers) and Module Explosion
Projects with 10+ engineers often over-modularize, creating 30-50 modules where 10 would suffice. This causes:
- Incremental build times that are worse than a single-module project because SPM module rebuild tracking overhead exceeds the compilation savings
- Complex `Package.swift` files that are difficult to reason about
- Excessive `public` API surface scattered across many modules

Counter this with the "pizza rule": each module should be maintainable by a team that can be fed with two pizzas (5-8 engineers). If a module has one primary owner and fewer than 3000 lines of code, it may be too granular -- consider merging it with its closest sibling.

### Offline and Air-Gapped Development Environments
In environments with no internet access (government, banking):
- Mirror all SPM dependencies to an internal Git server and update all `Package.swift` files to point to internal URLs
- Use `--disable-automatic-resolution` flag with `swift package resolve` to prevent unexpected network calls during builds
- Consider using `.package(path:)` with vendored source copies instead of URL-based dependencies for the most sensitive environments
- Never use SPM's `revision:` pinning in production -- it bypasses semantic versioning guarantees and makes auditing dependency versions difficult

### Transitioning from Swift 5.x to Swift 6 Strict Concurrency
This is the single most disruptive change in Swift's history for existing codebases:
1. Start by adding `.enableExperimentalFeature("StrictConcurrency")` per target in Swift 5.9 and fixing all warnings before moving to Swift 6
2. The biggest sources of warnings are: delegate patterns (use `@MainActor` on delegate protocol methods), global mutable state (convert to actors or `nonisolated(unsafe)` with explicit documentation), and Objective-C interop types not marked `@Sendable`
3. Use `SWIFT_STRICT_CONCURRENCY = targeted` as an intermediate setting that catches the most common issues without requiring full actor isolation of the entire module
4. `nonisolated(unsafe)` is the escape hatch for genuinely unsafe but pragmatically necessary code -- mark every usage with `// CONCURRENCY-UNSAFE: [reason]` comment for future reference
5. Plan 1-3 months for a 100K LOC codebase migration to Swift 6 strict concurrency -- this estimate assumes dedicated engineering time, not spare capacity

---

## Example

**Input:** "I'm starting a new iOS app called 'Meridian' -- a journaling app. The team is 4 engineers. We'll target iOS 16+. We want a modular structure from day one, with separate modules for the journal entry feature, local persistence, and design system. We're using SPM only, no CocoaPods. What's the full setup?"

**Output:**

## Swift Project Setup Plan: Meridian

### Project Profile
| Dimension          | Value                                          |
|--------------------|------------------------------------------------|
| Project Type       | iOS Application with Local Package modules     |
| Swift Version      | 5.9                                            |
| Minimum Deployment | iOS 16.0                                       |
| Module Count       | 5 modules (see dependency graph below)         |
| Layout Strategy    | B: iOS App Target + Local SPM Package          |
| Concurrency Mode   | StrictConcurrency experimental (Swift 5.9)     |

---

### Directory Structure

```
Meridian/
├── Meridian.xcodeproj
├── App/                          # Xcode app target -- entry point only
│   ├── MeridianApp.swift
│   ├── ContentView.swift
│   └── Assets.xcassets
├── MeridianPackage/              # Local SPM package containing all modules
│   ├── Package.swift
│   └── Sources/
│       ├── JournalFeature/       # SwiftUI views + ViewModels for journal
│       ├── PersistenceKit/       # SwiftData/CoreData stack, no UI
│       ├── DomainModels/         # JournalEntry, Tag, Mood -- pure Swift
│       ├── DesignSystem/         # Colors, Typography, Reusable components
│       └── CoreUtilities/        # Logging, Error types, Extensions
├── Tests/
│   ├── JournalFeatureTests/
│   ├── PersistenceKitTests/
│   └── DomainModelsTests/
├── ADR/
│   ├── 0001-spm-only-no-cocoapods.md
│   ├── 0002-local-package-modularization.md
│   └── 0003-swiftdata-for-persistence.md
├── .swiftlint.yml
├── .swiftformat
├── Makefile
└── .github/
    └── workflows/
        └── swift.yml
```

---

### Package.swift (MeridianPackage/Package.swift)

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MeridianPackage",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(name: "JournalFeature", targets: ["JournalFeature"]),
        .library(name: "PersistenceKit", targets: ["PersistenceKit"]),
        .library(name: "DomainModels", targets: ["DomainModels"]),
        .library(name: "DesignSystem", targets: ["DesignSystem"]),
        .library(name: "CoreUtilities", targets: ["CoreUtilities"])
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-log", from: "1.5.3"),
    ],
    targets: [
        // MARK: - Feature Modules

        .target(
            name: "JournalFeature",
            dependencies: [
                "DomainModels",
                "PersistenceKit",
                "DesignSystem",
            ],
            path: "Sources/JournalFeature",
            swiftSettings: sharedSettings
        ),

        // MARK: - Infrastructure Modules

        .target(
            name: "PersistenceKit",
            dependencies: [
                "DomainModels",
                "CoreUtilities",
            ],
            path: "Sources/PersistenceKit",
            swiftSettings: sharedSettings
        ),

        // MARK: - Core / Domain Modules

        .target(
            name: "DomainModels",
            dependencies: [],   // zero external dependencies -- intentional
            path: "Sources/DomainModels",
            swiftSettings: sharedSettings
        ),

        .target(
            name: "DesignSystem",
            dependencies: ["CoreUtilities"],
            path: "Sources/DesignSystem",
            swiftSettings: sharedSettings
        ),

        .target(
            name: "CoreUtilities",
            dependencies: [
                .product(name: "Logging", package: "swift-log")
            ],
            path: "Sources/CoreUtilities",
            swiftSettings: sharedSettings
        ),

        // MARK: - Test Targets

        .testTarget(
            name: "JournalFeatureTests",
            dependencies: ["JournalFeature", "DomainModels"],
            path: "Tests/JournalFeatureTests"
        ),
        .testTarget(
            name: "PersistenceKitTests",
            dependencies: ["PersistenceKit", "DomainModels"],
            path: "Tests/PersistenceKitTests"
        ),
        .testTarget(
            name: "DomainModelsTests",
            dependencies: ["DomainModels"],
            path: "Tests/DomainModelsTests"
        )
    ]
)

// Shared Swift settings applied to all production targets
let sharedSettings: [SwiftSetting] = [
    .enableUpcomingFeature("BareSlashRegexLiterals"),
    .enableUpcomingFeature("ConciseMagicFile"),
    .enableExperimentalFeature("StrictConcurrency"),
]
```

---

### Module Dependency Graph

```
App (Xcode target)
    └── JournalFeature
            ├── DomainModels      (zero deps -- pure Swift structs/enums)
            ├── PersistenceKit
            │       ├── DomainModels
            │       └── CoreUtilities
            │               └── swift-log (external)
            └── DesignSystem
                    └── CoreUtilities
                            └── swift-log (external)
```

**Key constraint:** `DomainModels` has zero dependencies. `JournalFeature` is the only target allowed to import SwiftUI -- `DesignSystem` imports SwiftUI for reusable components, which is intentional and documented. `PersistenceKit` imports SwiftData but not SwiftUI.

---

### .swiftformat Configuration

```
--swiftversion 5.9
--indent 4
--maxwidth 120
--wraparguments before-first
--wrapparameters before-first
--wrapcollections before-first
--commas always
--semicolons never
--importgrouping testable-bottom
--patternlet inline
--redundanttype inferred
--unusedarguments closure-only
--header \n  Meridian\n  Copyright © 2024 Meridian Team. All rights reserved.\n
```

---

### .swiftlint.yml Configuration

```yaml
included:
  - Sources
  - Tests

excluded:
  - .build

disabled_rules:
  - trailing_whitespace

opt_in_rules:
  - array_init
  - contains_over_filter_is_empty
  - discouraged_optional_boolean
  - empty_string
  - first_where
  - force_unwrapping
  - implicit_return
  - last_where
  - modifier_order
  - sorted_imports
  - toggle_bool

line_length:
  warning: 120
  error: 160
  ignores_comments: true
  ignores_urls: true

force_cast: error
force_try:
  severity: error
```

---

### Makefile

```makefile
.PHONY: setup build test lint format clean

setup:
	brew install swiftlint swiftformat
	swift package resolve

build:
	swift build -c release

test:
	swift test --parallel --enable-code-coverage

lint:
	swiftlint lint --strict

format:
	swiftformat . --config .swiftformat

format-check:
	swiftformat --lint . --config .swiftformat

clean:
	swift package clean
	rm -rf .build
```

---

### CI Configuration (.github/workflows/swift.yml)

```yaml
name: Meridian CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-and-test:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4

      - name: Select Xcode 15.4
        run: sudo xcode-select -s /Applications/Xcode_15.4.app

      - name: Cache SPM dependencies
        uses: actions/cache@v4
        with:
          path: .build
          key: ${{ runner.os }}-spm-${{ hashFiles('**/Package.resolved') }}
          restore-keys: |
            ${{ runner.os }}-spm-

      - name: Resolve dependencies
        run: swift package resolve

      - name: Build (release)
        run: swift build -c release

      - name: Run tests
        run: swift test --parallel --enable-code-coverage

      - name: Check formatting
        run: swiftformat --lint . --config .swiftformat

      - name: Run SwiftLint
        run: swiftlint lint --strict --reporter github-actions-logging
```

---

### Key Decisions and Rationale

| Decision                        | Chosen Approach                        | Rationale                                                                 |
|---------------------------------|----------------------------------------|---------------------------------------------------------------------------|
| Package manager                 | SPM only                               | No legacy Objective-C pods; SPM has first-class Xcode 15 integration      |
| Modularization                  | 5-module local package inside Xcode project | 4-engineer team benefits from compile-time module boundaries; too few to justify monorepo |
| Persistence                     | SwiftData (iOS 16+)                    | Targets iOS 16+ so SwiftData is available; avoids CoreData boilerplate |
| Swift version                   | 5.9 with StrictConcurrency experimental | Team not yet on Xcode 16; builds foundation for Swift 6 migration          |
| Design system as module         | Yes, separate DesignSystem target      | Enables consistent UI tokens; enforces no business logic in design layer   |
| Logging                         | swift-log (structured logging)         | Abstracts log backend; can swap to OSLog or custom handler without source changes |

---

### Setup Checklist

- [ ] Run `make setup` to install SwiftLint and SwiftFormat and resolve dependencies
- [ ] Run `make build` -- confirm zero errors and zero warnings
- [ ] Run `make test --parallel` -- confirm all test targets build and pass
- [ ] Run `make lint` -- confirm zero SwiftLint errors
- [ ] Run `make format-check` -- confirm SwiftFormat reports no changes needed
- [ ] Push a commit and verify GitHub Actions CI passes all jobs
- [ ] Verify `DomainModels` target has no Apple framework imports beyond Foundation
- [ ] Create `ADR/0001-spm-only-no-cocoapods.md` documenting the decision to use SPM exclusively
- [ ] Add `Package.resolved` to version control (`git add MeridianPackage/Package.resolved`)
