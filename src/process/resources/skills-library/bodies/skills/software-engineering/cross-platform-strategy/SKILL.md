---
name: cross-platform-strategy
description: |
  Guides expert-level cross-platform mobile strategy implementation: architecture and best-practices decision frameworks, production-ready patterns, and concrete templates for cross platform strategy workflows.
  Use when the user asks about cross-platform mobile strategy, cross platform strategy configuration, or mobile best practices for cross-platform projects.
  Do NOT use when the user needs a different mobile development capability -- check sibling skills in the mobile development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile architecture best-practices"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Cross-Platform Mobile Strategy

## When to Use

**Use this skill when:**
- A user is deciding between React Native, Flutter, Kotlin Multiplatform Mobile (KMM), Ionic/Capacitor, or native iOS/Android development for a new project
- A user needs to evaluate whether to migrate an existing native app to a cross-platform framework or vice versa
- A user wants a structured framework matrix to justify a technology recommendation to engineering leadership or stakeholders
- A user is architecting the shared business logic, navigation, state management, or data layer of a cross-platform mobile app
- A user is experiencing performance problems, platform divergence, or code-sharing failures in an existing cross-platform project and needs a remediation strategy
- A user wants to establish team conventions, monorepo structure, or CI/CD pipelines for cross-platform mobile development
- A user is designing a feature strategy that involves platform-specific native modules alongside shared cross-platform code

**Do NOT use this skill when:**
- The user needs detailed guidance on React Native-specific APIs, layout engine debugging, or Metro bundler configuration -- use the React Native skill in this subcategory
- The user needs Flutter widget lifecycle, Dart null-safety, or Flutter DevTools profiling -- use the Flutter-specific skill
- The user needs native iOS Swift/SwiftUI architecture guidance without a cross-platform component -- use the iOS native skill
- The user needs native Android Jetpack Compose or MVVM architecture guidance without a cross-platform component -- use the Android native skill
- The user is asking about Progressive Web Apps (PWAs) as the primary distribution mechanism with no native app store presence intended -- use the web-mobile skill
- The user needs backend API design, mobile BFF patterns, or GraphQL schema design -- use the API design skill
- The user is asking only about mobile CI/CD pipelines, code signing, or App Store submission -- use the mobile DevOps skill

---

## Process

### Step 1: Extract and Classify Project Requirements

Before recommending any framework, gather structured information about the project. If the user has not provided it, ask directly.

- **Platform targets:** iOS only, Android only, both simultaneously, or phased (one first, then the other within 12 months). Phased rollouts change the cost calculus significantly.
- **Feature complexity tiers:** Classify features as Tier 1 (standard UI, REST calls, auth flows -- easily cross-platform), Tier 2 (camera, biometrics, push notifications, Bluetooth, NFC -- manageable with plugins/bridges), or Tier 3 (ARKit/ARCore, CoreML/ML Kit, custom GPU rendering, real-time audio DSP -- often requires native modules or full native).
- **Performance budgets:** Target frame rate (60 fps vs 120 fps on ProMotion/high-refresh displays), startup time (<2 seconds cold start is the mobile industry benchmark), list scroll smoothness (60 fps sustained during fast scroll on mid-range Android devices is the gatekeeping test).
- **Team composition:** Count engineers with native iOS experience, native Android experience, JavaScript/TypeScript experience, Dart experience, and Kotlin experience separately. Framework learning curves are 2--4 months for React Native if the team knows React, 3--6 months for Flutter from scratch, 1--2 months for KMM if the team already knows Kotlin.
- **Offline requirements:** Define whether the app needs full offline functionality with local-first data sync (complex), read-only offline caching (moderate), or online-only (simple). Offline-first changes the entire data architecture.
- **Release velocity targets:** How many releases per month per platform? High-velocity teams (10+ releases/month) benefit more from unified CI/CD pipelines that cross-platform frameworks provide.

---

### Step 2: Apply the Framework Selection Decision Tree

Use the following ordered decision logic. Work top-to-bottom and stop at the first match.

- **If > 30% of features are Tier 3 (native-only APIs with no viable plugin):** Recommend full native development (Swift/Kotlin). A cross-platform shell with 30%+ native modules creates a maintenance burden worse than two native codebases. Document this threshold explicitly in your recommendation.
- **If the team has > 60% JavaScript/TypeScript experience and < 20% Dart/Kotlin:** Recommend React Native. The productivity gain from using familiar language tooling outweighs marginal framework differences for most business apps.
- **If the app is design-system-heavy with pixel-perfect custom UI that must look identical on both platforms:** Recommend Flutter. Flutter renders its own widgets using Skia/Impeller rather than native UI components, guaranteeing visual consistency. This is the decisive Flutter advantage.
- **If the app has a large existing native codebase that the business cannot afford to rewrite, but code-sharing of business logic is needed:** Recommend Kotlin Multiplatform Mobile (KMM). KMM integrates into existing native projects by sharing only the data/domain layers, leaving the UI layer fully native on each platform.
- **If the app is primarily content-driven with minimal animation, device hardware access is limited, and time-to-market is critical (< 3 months):** Recommend Ionic/Capacitor. The web technology baseline reduces onboarding time for web teams and permits PWA fallback.
- **If none of the above apply and the team is balanced:** Default to React Native with Expo managed workflow as the lowest-friction starting point, with a documented upgrade path to bare workflow when needed.

---

### Step 3: Design the Shared Architecture Layers

Once the framework is chosen, define which code is shared and which is platform-specific using a layered architecture model.

- **Domain/Business Logic Layer (share 90--100%):** Pure business rules, validation logic, data transformation, and use-case orchestration. In React Native or Flutter this is plain TypeScript/Dart. In KMM this is a Kotlin shared module compiled to both JVM and native via Kotlin/Native.
- **Data Layer (share 70--90%):** API clients, serialization, local database access, and repository interfaces. Use platform-agnostic HTTP clients (Ktor for KMM, Dio for Flutter, Axios for React Native). For local storage: SQLite via Expo SQLite or WatermelonDB (React Native), Drift/sqflite (Flutter), or SQLDelight (KMM).
- **State Management Layer (share 50--80%):** Centralized state with a pattern appropriate to the framework. React Native: Zustand for simple state, Redux Toolkit for complex state with > 5 interconnected data domains. Flutter: Riverpod for most projects, BLoC for teams that need strict separation and testability. KMM: StateFlow in the shared module consumed by SwiftUI (via SKIE or KMP-NativeCoroutines) on iOS and Compose on Android.
- **Presentation/UI Layer (share 30--70% depending on framework):** Navigation, screen components, and UI logic. This layer is where platform divergence is most acceptable. Platform-specific UI patterns (iOS navigation gestures, Android back-stack behavior, Material vs Cupertino widgets) should be implemented natively per platform even within a cross-platform project.
- **Platform Bridge Layer (share 0%, define interfaces):** Anything requiring native code -- camera, biometrics, Bluetooth, push notification handling, background tasks. Define abstract interfaces in the shared layer, implement natively per platform. Never let native bridge code leak into the domain layer.

---

### Step 4: Structure the Repository and Project Layout

Define the directory structure before writing a single line of application code. Inconsistent structure is the root cause of most cross-platform maintainability failures.

- **For React Native (Expo or bare):** Use a feature-based directory structure rather than a type-based one. Group `src/features/auth/`, `src/features/catalog/`, `src/features/checkout/` with each feature containing its own screens, hooks, components, and services. Shared infrastructure goes in `src/core/` (navigation, API client, storage, theme).
- **For Flutter:** Mirror the feature-based structure in Dart: `lib/features/`, `lib/core/`, `lib/l10n/`. Use `analysis_options.yaml` with `very_good_analysis` lint rules from day one. Put platform-specific code in `android/` and `ios/` directories only.
- **For KMM:** Structure as a Gradle multi-module project: `shared/` (Kotlin common code), `androidApp/` (Android UI), `iosApp/` (Xcode project). Within `shared/`, separate `commonMain/`, `androidMain/`, and `iosMain/` source sets for expect/actual declarations.
- **Monorepo consideration:** If the project includes a backend, web app, or design system alongside the mobile app, use a monorepo (Turborepo for JS projects, Gradle multi-project for KMM). Keep mobile packages in `packages/mobile/` or `apps/mobile/`. Shared TypeScript types between backend and mobile are a significant advantage of JS monorepos.
- **Asset management:** Maintain a single source-of-truth asset directory. Use vector formats (SVG via react-native-svg or Flutter SVG) over raster where possible. For raster, provide 1x, 2x, and 3x density variants. Never commit assets larger than 500 KB to source control; use a design system asset pipeline instead.

---

### Step 5: Establish Platform-Specific Handling Patterns

Cross-platform does not mean identical behavior on every platform. Define explicit strategies for where platforms must diverge.

- **Navigation patterns:** iOS expects hierarchical push/pop navigation with swipe-back gestures; Android expects a back-stack with a hardware/gesture back button that must be handled. Use React Navigation's stack navigator or Flutter's Navigator 2.0 with GoRouter. Always test back-stack behavior on Android separately from iOS -- this is the most common UX failure in cross-platform apps.
- **Typography and spacing:** iOS uses San Francisco (SF Pro); Android uses Roboto. Do not hardcode fonts assuming one platform. Use the system font stack unless the brand requires a custom font, in which case embed the font file and use it on both platforms identically.
- **Permissions flow:** iOS requires justification strings in `Info.plist` (NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, etc.). Android requires declarations in `AndroidManifest.xml` plus runtime permission requests for API level 23+. Handle permission denial gracefully -- assume 30--40% of users will deny sensitive permissions on first prompt. Design the UX to function in a degraded state.
- **Safe area handling:** iOS has Dynamic Island, notch, and home indicator safe areas. Android has variable status bar heights and gesture navigation zones. Use `SafeAreaView` (React Native) or `SafeArea` widget (Flutter) universally -- never hardcode pixel offsets for safe area.
- **Background execution:** iOS strictly limits background execution to specific registered modes (background fetch, remote notifications, location, audio). Android is more permissive but varies significantly across OEM implementations (Samsung, Xiaomi, Huawei kill background processes aggressively). Design background features for the iOS constraint as the baseline; Android will be at least as capable.

---

### Step 6: Define the Performance Testing and Validation Protocol

Performance on cross-platform is non-trivial. Establish a testing protocol before shipping to production.

- **Startup time benchmark:** Measure time-to-interactive (TTI) on a mid-range Android device (Snapdragon 665 class, 4 GB RAM) as your worst-case reference. React Native cold start is typically 1.5--3 seconds with Hermes engine; Flutter cold start is typically 0.8--2 seconds with AOT compilation. If cold start exceeds 3 seconds, investigate: lazy-load non-critical modules, defer initialization of analytics/crash reporting SDKs, reduce synchronous work on the JS thread (React Native) or main isolate (Flutter).
- **Scroll performance:** Use a FlatList (React Native) or ListView.builder (Flutter) for any list with > 20 items. Never render more than 50 items in a column without virtualization. Test scroll on the mid-range Android reference device at 60 fps using Perfetto (Android) or Instruments (iOS).
- **Bridge overhead (React Native specific):** Every call across the JS-to-native bridge has latency. Batch bridge calls where possible. With the New Architecture (JSI/Fabric), direct synchronous access replaces the async bridge -- migrate to Fabric for new projects. Measure bridge call frequency using the React Native Performance Monitor during development.
- **Memory profiling:** Mobile apps must stay within 150--200 MB resident memory on mid-range devices to avoid OS-initiated termination. Profile with Android Studio Memory Profiler and Xcode Instruments (Allocations and Leaks). Common cross-platform memory leaks: event listeners not cleaned up on component unmount, image caches without size limits, navigation stacks that retain large amounts of state.
- **Real device testing matrix:** Test on at minimum: latest iPhone, two-year-old iPhone (A-series chip from 2 years ago), latest Android flagship, mid-range Android (Snapdragon 7xx or equivalent), and a low-end Android (Snapdragon 4xx, 3 GB RAM). Simulators/emulators do not reveal real-world performance issues.

---

### Step 7: Establish CI/CD and Quality Gates

- **Lint and type checking:** Enforce ESLint + TypeScript strict mode (React Native), Dart analyzer + very_good_analysis (Flutter), or ktlint + detekt (KMM) in CI. Block merges on lint failures. Zero-tolerance from day one prevents debt accumulation.
- **Automated testing tiers:** Unit tests (Jest/Vitest for RN, flutter test for Flutter, JUnit for KMM shared) must achieve > 80% coverage of domain and data layers. Integration tests for navigation flows using Detox (RN) or integration_test (Flutter). E2E tests for the 3--5 most critical user journeys (login, core purchase flow, onboarding) using Maestro or Appium on real device farms (BrowserStack, Sauce Labs, or Firebase Test Lab).
- **Build matrix:** CI must build and test on both iOS and Android for every pull request. Use a Mac-based CI runner (GitHub Actions macOS runners, Bitrise, Codemagic) for iOS builds -- you cannot build iOS without macOS. Separate jobs for Android (Linux is faster and cheaper for Android) and iOS.
- **Versioning and release strategy:** Use semantic versioning for the app version (major.minor.patch) and keep the build number auto-incremented by CI. Never manually manage build numbers. Use fastlane for code signing, building, and submitting to App Store Connect and Google Play from CI.
- **Over-the-air (OTA) updates:** React Native supports OTA JS bundle updates via Expo Updates or Microsoft CodePush. Use OTA for hotfixes and non-native-module changes. Document clearly which changes require a native build (adding new native modules, modifying AndroidManifest/Info.plist, changing native dependencies) vs which can go OTA.

---

### Step 8: Document the Architecture Decision Record (ADR)

Every cross-platform strategy engagement should produce at minimum one ADR. This prevents the "why did we choose this?" question 18 months later.

- **ADR format:** Title, Status (Proposed/Accepted/Deprecated), Context (what problem this solves), Decision (what was chosen), Consequences (trade-offs accepted), and Alternatives Considered (what was rejected and why).
- **Framework selection ADR is mandatory.** It should record the decision matrix scores, the threshold criteria used, team experience data at the time of decision, and the conditions under which the decision should be revisited (e.g., "Revisit if Tier 3 feature requirements exceed 20% of backlog").
- **Store ADRs in the repository** at `docs/adr/` using sequentially numbered filenames (ADR-001-cross-platform-framework.md). This makes them discoverable and version-controlled alongside the code they describe.

---

## Output Format

Produce a structured Cross-Platform Strategy Report using the following template:

```markdown
# Cross-Platform Mobile Strategy Report

## Project Context Summary
- **App name / codename:** [name]
- **Target platforms:** [iOS / Android / Both]
- **Feature tier breakdown:** Tier 1: X% | Tier 2: Y% | Tier 3: Z%
- **Team composition:** [N] engineers -- [breakdown of iOS/Android/JS/Dart/Kotlin experience]
- **Performance requirements:** Cold start < Xs | Frame rate target: Xfps | Offline: [None/Cache/Full]
- **Target release timeline:** [date or duration]
- **Existing codebase:** [None / Native iOS / Native Android / Both / Web]

---

## Framework Recommendation

**Recommended framework:** [React Native / Flutter / Kotlin Multiplatform Mobile / Ionic+Capacitor / Native]
**Confidence level:** [High / Medium -- revisit if {condition}]

### Decision Matrix

| Criterion                        | React Native | Flutter | KMM  | Native |
|----------------------------------|:------------:|:-------:|:----:|:------:|
| Team familiarity                 | [H/M/L]      | [H/M/L] | [H/M/L] | [H/M/L] |
| UI consistency requirement       | [H/M/L]      | [H/M/L] | [H/M/L] | [H/M/L] |
| Tier 3 feature volume            | [H/M/L]      | [H/M/L] | [H/M/L] | [H/M/L] |
| Existing codebase integration    | [H/M/L]      | [H/M/L] | [H/M/L] | [H/M/L] |
| Startup performance              | [H/M/L]      | [H/M/L] | [H/M/L] | [H/M/L] |
| Ecosystem maturity               | [H/M/L]      | [H/M/L] | [H/M/L] | [H/M/L] |
| **Total fit score (H=3,M=2,L=1)**| [X/18]       | [X/18]  | [X/18]  | [X/18] |

H = High fit | M = Medium fit | L = Low fit

### Rationale
[2--4 sentences explaining the primary factors that drove the recommendation, 
referencing specific scores from the matrix and project constraints.]

---

## Architecture Blueprint

### Layer Map

| Layer              | Sharing %  | Technology Choice        | Rationale                        |
|--------------------|:----------:|--------------------------|----------------------------------|
| Domain/Business    | 90--100%   | [TypeScript/Dart/Kotlin] | [reason]                         |
| Data / Repository  | 70--90%    | [Ktor/Dio/Axios/SQLite]  | [reason]                         |
| State Management   | 60--80%    | [Zustand/Riverpod/BLoC]  | [reason]                         |
| Navigation         | 50--70%    | [React Nav/GoRouter]     | [reason]                         |
| UI Components      | 30--60%    | [shared + platform split]| [reason]                         |
| Native Bridges     | 0%         | [Swift/Kotlin modules]   | [platform-specific interfaces]   |

### Directory Structure
```
[project-name]/
├── src/ (or lib/)
│   ├── core/
│   │   ├── api/         # HTTP client, interceptors, base models
│   │   ├── storage/     # Local DB, secure storage wrappers
│   │   ├── navigation/  # Route definitions, navigator configuration
│   │   └── theme/       # Design tokens, colors, typography
│   ├── features/
│   │   ├── [feature-1]/
│   │   │   ├── data/    # Repository impl, DTOs, data sources
│   │   │   ├── domain/  # Use cases, entities, repository interfaces
│   │   │   └── ui/      # Screens, components, view models/hooks
│   │   └── [feature-2]/
│   └── shared/
│       ├── components/  # Reusable UI components
│       └── utils/       # Pure utility functions
├── android/             # Platform-specific Android code
├── ios/                 # Platform-specific iOS code
└── docs/
    └── adr/             # Architecture Decision Records
```

---

## Platform-Specific Handling Plan

| Concern                  | iOS Approach                       | Android Approach                   |
|--------------------------|------------------------------------|------------------------------------|
| Navigation gestures      | [specific handling]                | [specific handling]                |
| Safe area insets         | [specific handling]                | [specific handling]                |
| Permission flow          | [Info.plist strings + UX strategy] | [Manifest + runtime request UX]    |
| Push notifications       | [APNs setup]                       | [FCM setup]                        |
| Background tasks         | [BGTaskScheduler/mode]             | [WorkManager]                      |

---

## Performance Targets and Testing Protocol

| Metric                | Target          | Measurement Method              | Test Device                  |
|-----------------------|-----------------|---------------------------------|------------------------------|
| Cold start TTI        | < 2.5 seconds   | [Perfetto / Instruments]        | Snapdragon 665, 4 GB RAM     |
| Scroll frame rate     | 60 fps sustained| [Android Profiler / Instruments]| Same mid-range Android       |
| Memory (steady state) | < 180 MB RSS    | [Memory Profiler]               | All reference devices        |
| JS/UI thread blocking | < 16 ms/frame   | [Flipper / DevTools]            | Both platforms               |

---

## CI/CD Pipeline Requirements

- **Build targets:** iOS (macOS runner) + Android (Linux runner) on every PR
- **Lint gate:** [ESLint+TSC / Dart analyzer / ktlint] -- fail on any error
- **Test gate:** Unit tests > 80% domain/data layer coverage -- fail below threshold
- **E2E smoke test:** [Detox / Maestro / integration_test] on [device farm] for critical paths
- **OTA update eligibility:** JS/Dart bundle-only changes -- document native-change conditions
- **Release automation:** fastlane for signing, building, and submitting to stores

---

## Architecture Decision Record (ADR-001)

**Title:** Cross-Platform Framework Selection  
**Status:** Accepted  
**Date:** [YYYY-MM-DD]

**Context:**  
[Describe the business problem, team constraints, and feature requirements that necessitate this decision.]

**Decision:**  
[State the chosen framework and the specific conditions that determined the choice.]

**Consequences:**  
- Accepted trade-offs: [list 2--3]
- Advantages gained: [list 2--3]

**Alternatives Considered:**  
| Alternative | Rejected Because |
|-------------|-----------------|
| [Framework] | [Specific reason with data] |
| [Framework] | [Specific reason with data] |

**Revisit Condition:**  
[Specific measurable condition under which this decision should be reconsidered, e.g., "If Tier 3 features exceed 25% of the backlog or if team Dart/Flutter expertise exceeds JS expertise."]
```

---

## Rules

1. **Never recommend a framework before completing the Tier 3 feature audit.** If more than 30% of planned features require hardware APIs with no viable plugin, cross-platform adds cost rather than saving it. The Tier 3 threshold is the single most important variable in the decision.

2. **Never equate cross-platform with write-once-run-anywhere.** Budget at minimum 20--30% of development effort for platform-specific code, UX polish, and native module work even with the best cross-platform framework. Clients and stakeholders who hear "one codebase" must be corrected early.

3. **Never skip real device testing on mid-range Android.** Simulators and even flagship Android devices will pass performance tests that mid-range devices fail. The Snapdragon 665 class device is the gatekeeping benchmark. An app that scrolls at 60 fps on a Pixel 8 but drops to 45 fps on a Galaxy A32 is a failed cross-platform implementation.

4. **Never mix navigation paradigms within a single app.** Choosing React Navigation's stack then adding a custom modal navigation system for one feature creates untestable back-stack behavior. Pick one navigation library and use its modal, tab, stack, and drawer primitives exclusively.

5. **Never allow native bridge code to return raw platform types to the JS/Dart layer.** Native modules must serialize return values to JSON-compatible or Dart-compatible types at the bridge boundary. Letting NSDate or Java Date objects leak into shared code creates platform-specific handling throughout the application.

6. **Always treat font rendering as a cross-platform concern requiring explicit design approval.** The same font size in sp/pt units renders differently due to font metrics differences between San Francisco and Roboto. Get sign-off from design on both platforms, not just on one.

7. **Always enforce a maximum of one state management library per project.** Projects that mix Context API, Redux, MobX, and Zustand in the same codebase are unmaintainable within 12 months. Choose one, document why, enforce it in code review.

8. **Never implement offline-first sync as an afterthought.** If offline functionality is a requirement, the data layer must be designed offline-first from the first sprint. Retrofitting offline sync onto an online-first architecture requires rewriting the entire data layer and typically costs 3--6 weeks of effort when done late.

9. **Always define OTA update boundaries in writing before shipping the first release.** React Native and Expo OTA updates are powerful but violate App Store guidelines if used to change core functionality or bypass review. Document which types of changes are OTA-eligible (copy changes, bug fixes, style adjustments) versus which require a full store submission (new native modules, new permissions, major feature additions).

10. **Never underestimate the cost of framework version upgrades.** React Native has historically had breaking changes between major versions; Flutter SDK upgrades occasionally require Dart version migrations; KMM Kotlin version upgrades affect Kotlin/Native ABI compatibility. Budget one sprint per quarter for dependency maintenance. Teams that ignore this for 6+ months often face painful all-at-once upgrade work that disrupts feature delivery.

---

## Edge Cases

### Existing Native App Needing Cross-Platform Expansion

When an app exists as a mature native iOS app and the business wants to add Android (or vice versa) using a cross-platform framework, do not attempt to rewrite the iOS app. Instead, implement KMM to extract shared business logic (networking, persistence, domain rules) into a Kotlin shared module that the existing iOS app consumes via a Swift wrapper and the new Android app uses directly. The existing iOS UI stays in UIKit/SwiftUI. New Android UI is built in Jetpack Compose. Code sharing targets the data and domain layers (70--80%) where the highest ROI is, not the UI. This approach preserves years of iOS stability while accelerating Android delivery. Typical timeline to first Android release using this strategy is 4--6 months versus 8--12 months for a full React Native rewrite.

### High-Frequency Animation and Game-Like UI

Apps with continuous animations (60--120 fps particle effects, physics simulations, gesture-driven UI with real-time interpolation) are poor cross-platform candidates unless Flutter is chosen specifically for this use case. Flutter's Impeller rendering engine (replacing Skia as of Flutter 3.10+ on iOS and Flutter 3.16+ on Android) provides consistent 60 fps for complex animations. React Native's Animated API with useNativeDriver offloads to the native thread but still has limitations for GPU-intensive scenes. If the app is > 40% animation-driven, evaluate Flutter first. If real-time 3D rendering or game engine integration (Unity, Unreal) is required, cross-platform frameworks are inappropriate -- use Unity's native mobile targets or build a thin native shell around the game engine.

### Enterprise MDM and Security Requirements

Enterprise apps distributed via Mobile Device Management (MDM -- Jamf, Intune, VMware Workspace ONE) have additional constraints: app wrapping compatibility, certificate pinning, jailbreak/root detection, and sometimes VPN-only network access. React Native and Flutter apps are compatible with most MDM platforms but require careful handling of certificate pinning (use a network security config on Android and NSAppTransportSecurity on iOS, not a JS-layer implementation). Jailbreak detection must be implemented in native code (Swift/Kotlin), not in JS, because jailbroken devices can hook JS runtime calls. Rooted device detection native libraries (RootBeer for Android, IOSSecuritySuite for iOS) must be bridged in. Document all security controls as native-layer requirements in the Tier 2/Tier 3 feature audit.

### Team Split Across Time Zones with Diverging Platform Ownership

When iOS work and Android work are split between teams in different time zones (common in offshore/nearshore arrangements), cross-platform frameworks can paradoxically increase coordination overhead if both teams modify platform-specific bridge code concurrently. Establish clear ownership: shared code (domain, data, state) is owned by the full team with mandatory cross-review; platform-specific bridge code and UI tweaks are owned per-platform team with the opposing team as optional reviewer. Use feature flags to decouple deployment of shared logic from platform-specific UI, allowing each platform team to ship independently when the shared logic is ready. Avoid "big bang" merges of platform-diverged branches -- integrate shared code to main at least weekly.

### Low-End Android Device Support (2--3 GB RAM, API Level 23--26)

If the app must target markets where low-end Android devices dominate (South/Southeast Asia, Latin America, Sub-Saharan Africa), apply specific constraints. React Native with Hermes engine is mandatory (not JavaScriptCore) -- Hermes reduces memory by 30--40% and startup time by 10--15% on low-end devices. Flutter AOT compilation already helps, but avoid using many simultaneous opacity animations or image decode operations. Set explicit image cache size limits (React Native Fast Image: `FastImage.preload` with a maximum cache of 50 MB; Flutter cached_network_image: `maxNrOfCacheObjects: 200`). Implement aggressive lazy loading -- load screens on first navigation, not at app startup. Target a minimum SDK of API 23 (Android 6.0) which covers > 97% of active Android devices as of 2024.

### Multi-Tenant White-Label Apps

Apps that must be reskinned for multiple clients (insurance, fintech, retail platform) require a theming and configuration layer that most cross-platform boilerplates do not provide. Implement a design token system at the `core/theme/` layer with all colors, typography, spacing, and icon sets driven by a JSON configuration file loaded at runtime or at build time via environment variables. Use build flavors (Android) and schemes (iOS) to create per-client builds from a single codebase. Never hardcode color values, copy strings, or feature flags in component files. All client-specific values live in the configuration layer. Feature flags at the client level (client A has feature X, client B does not) must be implemented in the domain layer, not in the UI -- the UI reads a capability flag, it does not contain client-specific conditional logic.

### Handling a Failed Cross-Platform Migration Midway

When a team has partially migrated from native to cross-platform (or chosen the wrong framework and needs to switch), the worst outcome is abandoning the migration and reverting. Instead, apply a freeze-and-stabilize strategy: stop feature development in the old codebase, complete the migration of the 20% of code that represents 80% of the app's usage (the core user journey screens), and ship that. Leave the remaining 80% of rarely-used screens in the old native code wrapped behind a WebView or deep link handoff, if needed, until the next quarter. Never attempt a big-bang migration -- it creates a multi-month feature freeze that will be cancelled before completion by business pressure.

---

## Example

**Input:**
"We're a 7-person team (4 senior frontend engineers with strong React/TypeScript, 2 junior iOS developers, 1 Android developer) building a B2C e-commerce app from scratch targeting both iOS and Android. The app needs: product catalog browsing, search, cart and checkout, order tracking with real-time status updates via WebSocket, push notifications, and biometric login (Face ID / fingerprint). We want to ship the iOS version in 4 months and Android 2 months later. What cross-platform strategy do you recommend?"

**Output:**

# Cross-Platform Mobile Strategy Report

## Project Context Summary
- **App name / codename:** B2C E-Commerce App
- **Target platforms:** iOS first, Android 2 months later
- **Feature tier breakdown:** Tier 1: 65% (catalog, search, cart, checkout UI, order history) | Tier 2: 30% (push notifications, biometric auth, WebSocket real-time updates) | Tier 3: 5% (Face ID hardware integration -- manageable via expo-local-authentication)
- **Team composition:** 7 engineers -- 4 senior React/TypeScript, 2 junior iOS, 1 Android
- **Performance requirements:** Cold start < 2 seconds | Frame rate: 60 fps | Offline: Read cache only (product images, last-viewed catalog)
- **Target release timeline:** iOS in 4 months, Android at month 6
- **Existing codebase:** None (greenfield)

---

## Framework Recommendation

**Recommended framework:** React Native (Expo managed workflow, upgrade to bare workflow at month 3)
**Confidence level:** High

### Decision Matrix

| Criterion                        | React Native | Flutter | KMM  | Native |
|----------------------------------|:------------:|:-------:|:----:|:------:|
| Team familiarity                 | H (4 seniors)| L       | L    | L      |
| UI consistency requirement       | M            | H       | M    | H      |
| Tier 3 feature volume            | H (5%)       | H (5%)  | H    | H      |
| Existing codebase integration    | H (none)     | H       | M    | H      |
| Startup performance              | M (Hermes)   | H       | H    | H      |
| Ecosystem maturity               | H            | H       | M    | H      |
| **Total fit score (H=3,M=2,L=1)**| **16/18**   | 13/18   | 12/18| 13/18  |

H = High fit | M = Medium fit | L = Low fit

### Rationale

The team's dominant React/TypeScript skillset makes React Native the decisive choice. The 4 senior React engineers will reach full productivity within 2--3 weeks, which is essential for a 4-month iOS deadline. Tier 3 features are minimal (5%) -- biometric login is handled via `expo-local-authentication` with native backing, and push notifications via `expo-notifications` (APNs + FCM unified API). Flutter's superior rendering consistency is not a decisive factor here because the app uses standard e-commerce UI patterns rather than custom-designed interactive components. The 2 iOS junior developers will contribute to the native modules layer (Info.plist configuration, APNs certificates, Xcode build settings) and iOS-specific QA, roles well-suited to their experience level.

---

## Architecture Blueprint

### Layer Map

| Layer              | Sharing %  | Technology Choice                          | Rationale                                       |
|--------------------|:----------:|--------------------------------------------|--------------------------------------------------|
| Domain/Business    | 95%        | TypeScript, Zod for validation             | Pure business rules, no platform dependencies    |
| Data / Repository  | 85%        | Axios + React Query, MMKV, WatermelonDB    | React Query handles caching; MMKV for fast KV storage |
| State Management   | 80%        | Zustand (cart, auth, UI state)             | Lightweight, no boilerplate; fits team's React mental model |
| Navigation         | 70%        | React Navigation 6 (Stack + Bottom Tabs)  | Industry standard; robust deep-link support       |
| UI Components      | 55%        | Custom design system + platform splits    | Shared components; platform-specific safe areas, gestures |
| Native Bridges     | 0%         | expo-local-authentication, expo-notifications | Abstract interface defined in shared code |

### Directory Structure
```
ecommerce-app/
├── src/
│   ├── core/
│   │   ├── api/
│   │   │   ├── client.ts          # Axios instance, interceptors, token refresh
│   │   │   ├── websocket.ts       # WebSocket client for order tracking
│   │   │   └── endpoints.ts       # Typed API endpoint definitions
│   │   ├── storage/
│   │   │   ├── mmkv.ts            # MMKV wrapper for auth tokens, preferences
│   │   │   └── watermelon.ts      # WatermelonDB schema for catalog cache
│   │   ├── navigation/
│   │   │   ├── RootNavigator.tsx  # Stack: Auth flow + Main tab navigator
│   │   │   ├── routes.ts          # Type-safe route name constants
│   │   │   └── linking.ts         # Deep link configuration
│   │   └── theme/
│   │       ├── tokens.ts          # Colors, spacing, typography scales
│   │       └── ThemeProvider.tsx  # React context theme provider
│   ├── features/
│   │   ├── auth/
│   │   │   ├── domain/
│   │   │   │   ├── AuthRepository.ts        # Interface definition
│   │   │   │   └── useCases/LoginUseCase.ts # Orchestrates biometric + API
│   │   │   ├── data/
│   │   │   │   ├── AuthRepositoryImpl.ts
│   │   │   │   └── BiometricService.ts      # expo-local-authentication wrapper
│   │   │   └── ui/
│   │   │       ├── LoginScreen.tsx
│   │   │       └── useAuthStore.ts          # Zustand slice for auth state
│   │   ├── catalog/
│   │   │   ├── domain/
│   │   │   ├── data/
│   │   │   └── ui/                          # ProductList, ProductDetail, Search
│   │   ├── cart/
│   │   │   ├── domain/
│   │   │   ├── data/
│   │   │   └── ui/                          # CartScreen, CartItem, Checkout
│   │   └── orders/
│   │       ├── domain/
│   │       ├── data/
│   │       │   └── OrderTrackingService.ts  # WebSocket subscription management
│   │       └── ui/                          # OrderList, OrderDetail (live update)
│   └── shared/
│       ├── components/
│       │   ├── PriceDisplay.tsx             # Currency formatting, shared
│       │   ├── ProductCard.tsx              # Shared catalog card component
│       │   └── SkeletonLoader.tsx           # Loading state placeholder
│       └── utils/
│           ├── currency.ts                  # Locale-aware price formatting
│           └── validation.ts               # Zod schemas for form inputs
├── android/                                 # Managed by Expo until bare workflow
├── ios/                                     # Managed by Expo until bare workflow
└── docs/
    └── adr/
        ├── ADR-001-react-native-framework.md
        ├── ADR-002-state-management-zustand.md
        └── ADR-003-watermelondb-catalog-cache.md
```

---

## Platform-Specific Handling Plan

| Concern              | iOS Approach                                          | Android Approach                                           |
|----------------------|--------------------------------------------------------|-------------------------------------------------------------|
| Navigation gestures  | Enable swipe-back on stack screens (default in RN 6)  | Intercept hardware back button with `BackHandler` in cart/checkout |
| Safe area insets     | `SafeAreaProvider` + `useSafeAreaInsets()` universally | Same library; test on gesture-nav Android 10+ devices        |
| Biometric login      | Face ID / Touch ID via `expo-local-authentication`     | Fingerprint / Face via same API (BiometricPrompt backing)    |
| Push notifications   | APNs via `expo-notifications`; register in app launch  | FCM via same API; test FCM on physical device, not emulator  |
| WebSocket (orders)   | Background to foreground re-connect on `AppState` change | Same pattern; test app resume on aggressive OEM killers (Samsung) |
| Permissions          | NSCameraUsageDescription (not needed for this app)     | `POST_NOTIFICATIONS` permission required for API 33+ at runtime |

---

## Performance Targets and Testing Protocol

| Metric                | Target          | Measurement Method                         | Test Device                          |
|-----------------------|-----------------|--------------------------------------------|--------------------------------------|
| Cold start TTI        | < 2.0 seconds   | Flipper plugin + manual stopwatch          | Samsung Galaxy A32 (SD 720G, 4 GB)   |
| Catalog scroll        | 60 fps sustained| Android Studio CPU profiler, Instruments   | A32 + iPhone 12 (2-year-old device)  |
| Memory (steady state) | < 160 MB RSS    | Android Studio Memory Profiler             | A32 as worst-case                    |
| Order WebSocket       | < 1s reconnect  | Manual test: background app 30s, foreground| Both platforms                        |
| Checkout flow         | < 3s end-to-end | Detox E2E test with performance assertion  | Both reference devices                |

Key implementation notes for this project:
- Use `FlashList` (Shopify's virtualized list) instead of React Native's `FlatList` for the product catalog -- FlashList is 5--10x faster for large datasets and handles variable-height product cards better.
- Enable Hermes JavaScript engine (default in Expo SDK 48+). Verify it is active by checking `global.HermesInternal !== null` in startup code.
- Lazy-load all feature screens except the initial tab (catalog). Use `React.lazy` with Suspense at the navigator level.
- Set WatermelonDB's SQLite adapter to run on a separate thread to prevent catalog query blocking on the JS thread.

---

## CI/CD Pipeline Requirements

- **Build targets:** iOS (GitHub Actions macOS-13 runner) + Android (Linux runner) on every PR to main
- **Lint gate:** ESLint (react-native community config) + TypeScript strict mode -- zero errors, zero warnings allowed to merge
- **Test gate:** Jest unit tests with > 80% coverage on `src/features/*/domain/` and `src/features/*/data/` -- fail below threshold
- **E2E smoke tests (Detox):** Run on merge to main for: (1) biometric login happy path, (2) add to cart + checkout initiation, (3) order tracking screen WebSocket update
- **Device farm:** Firebase Test Lab for Android matrix (Pixel 6, Galaxy A32, Pixel 4a); BrowserStack for iOS (iPhone 14 Pro, iPhone 12)
- **OTA update policy (Expo Updates):**
  - OTA eligible: bug fixes in JS business logic, copy changes, style adjustments, non-permission API changes
  - Store submission required: adding native modules, modifying app.json permissions, changing minimum OS version, adding new expo-* plugins that modify native code
- **Release automation:** fastlane `deliver` (iOS) and `supply` (Android) for store submissions from CI; build numbers auto-incremented from CI run number

---

## Architecture Decision Record (ADR-001)

**Title:** Cross-Platform Framework Selection -- React Native (Expo)
**Status:** Accepted
**Date:** [Project kickoff date]

**Context:**
We are building a greenfield B2C e-commerce app targeting iOS and Android with a 4-month iOS deadline. The team of 7 includes 4 senior React/TypeScript engineers, 2 junior iOS developers, and 1 Android developer. Feature requirements include standard e-commerce UI, biometric auth, push notifications, and WebSocket-driven order tracking. No Tier 3 hardware features are required.

**Decision:**
React Native with Expo managed workflow (migrating to bare workflow by month 3 when the team needs more control over native configuration). This choice is driven primarily by the team's React/TypeScript expertise, which eliminates a framework learning curve and is essential for meeting the 4-month deadline.

**Consequences:**
- Accepted trade-offs: React Native's JS bridge (mitigated by Hermes and New Architecture adoption); slightly longer cold start than Flutter on low-end Android (mitigated by Hermes, lazy loading); 20--25% of effort still required for platform-specific polish and native module configuration
- Advantages gained: 4 senior engineers productive in < 3 weeks; single TypeScript codebase for domain/data layer; Expo managed workflow eliminates Xcode/Gradle configuration complexity for the first 3 months; unified push notification API (APNs + FCM) via expo-notifications

**Alternatives Considered:**

| Alternative | Rejected Because |
|-------------|-----------------|
| Flutter | Zero Dart experience on team; 3--6 month learning curve incompatible with 4-month deadline; superior rendering consistency not decisive for standard e-commerce UI |
| Native iOS + Native Android | Would require the 4 senior JS engineers to learn Swift/Kotlin; effectively doubles UI feature work; 2 junior iOS developers alone cannot deliver full iOS app in 4 months |
| KMM | Requires Kotlin expertise the team does not have; best suited for teams migrating existing native apps, not greenfield with JS-dominant team |

**Revisit Condition:**
Revisit this decision if: (1) Tier 3 feature requirements are added that exceed 20% of the backlog (e.g., AR product visualization, custom payment hardware integration), or (2) scroll performance on the catalog screen cannot be maintained at 60 fps on the Galaxy A32 reference device after optimization, or (3) team composition shifts to > 50% native iOS/Android engineers within the next 12 months.
