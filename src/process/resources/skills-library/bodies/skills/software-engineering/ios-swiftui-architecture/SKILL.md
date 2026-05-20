---
name: ios-swiftui-architecture
description: |
  Guides expert-level ios swiftui architecture implementation: swift and architecture decision frameworks, production-ready patterns, and concrete templates for ios swiftui architecture workflows.
  Use when the user asks about ios swiftui architecture, ios swiftui architecture configuration, or mobile best practices for ios projects.
  Do NOT use when the user needs a different mobile development capability -- check sibling skills in the mobile development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile swift architecture"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# iOS SwiftUI Architecture

## When to Use

**Use this skill when:**
- A user is starting a new iOS app and needs to choose between MVVM, TCA (The Composable Architecture), VIPER, MV, or Clean Architecture for a SwiftUI project
- A user has a growing SwiftUI codebase with state management problems -- views re-rendering too aggressively, state scattered across multiple sources of truth, or business logic leaking into views
- A user needs to design a navigation system in SwiftUI using NavigationStack, NavigationSplitView, or a coordinator pattern and is unsure which approach scales to their use case
- A user is migrating from UIKit with a UIKit-based architecture (MVC, MVVM+RxSwift, VIPER) and wants to understand how to adapt that architecture to SwiftUI idioms
- A user is building a feature module for an iOS app and needs to structure the folder layout, dependency graph, and data flow contracts
- A user needs to integrate Combine, Swift Concurrency (async/await, actors), or both into their SwiftUI data layer and wants to understand the tradeoffs
- A user asks how to architect offline-first capabilities, deep link handling, or background task orchestration in a SwiftUI app
- A user needs to set up a multi-module Swift Package Manager workspace or Xcode project with clear dependency boundaries

**Do NOT use this skill when:**
- The user needs UIKit-specific architecture guidance without any SwiftUI integration -- use a UIKit MVC/MVVM skill instead
- The user is working on React Native, Flutter, or other cross-platform frameworks -- use the appropriate cross-platform skill
- The user needs Xcode build system configuration, CI/CD pipelines, or App Store submission guidance -- use the iOS DevOps skill
- The user is asking about watchOS, tvOS, or macOS Catalyst architecture specifically -- the patterns overlap but the constraints differ meaningfully
- The user needs performance profiling with Instruments -- use the iOS performance profiling skill
- The user is asking about Swift language features in isolation (actors, structured concurrency) not tied to app architecture
- The user needs backend API design that their iOS app will consume -- use a backend API design skill

---

## Process

### 1. Assess Project Context and Constraints

Before recommending any architecture, gather specific information about the project. The wrong architecture choice costs 3--6 months of refactoring at production scale.

- **Team size and SwiftUI experience:** A team of 2 junior engineers maintaining TCA will struggle. A team of 8 experienced engineers with no shared state conventions will produce a mess. Ask directly: how many engineers, what is their SwiftUI/Combine/async-await proficiency level (beginner/intermediate/expert), and how long has the project existed?
- **App complexity tier:** Classify the app -- Tier 1 (single-flow utility apps: calculators, timers, simple forms), Tier 2 (multi-feature consumer apps: e-commerce, social, content), Tier 3 (platform apps: developer tools, professional creative apps, enterprise dashboards). Architecture complexity should match the tier.
- **iOS deployment target:** SwiftUI APIs changed dramatically between iOS 14, 15, 16, and 17. NavigationStack requires iOS 16+. Observable macro requires iOS 17+. Confirm the minimum deployment target before recommending anything that requires a specific API.
- **Existing codebase and UIKit surface area:** Determine whether UIKit ViewControllers exist that must be wrapped with UIViewControllerRepresentable, whether the app uses UIKit-based navigation, and whether storyboards are still in use.
- **Data dependencies:** Does the app use Core Data, SwiftData (iOS 17+), or a custom persistence layer? Does it require Combine publishers from existing SDKs (MapKit, CoreLocation, HealthKit)? These constrain the reactive layer choice.
- **Testing requirements:** If the team requires 80%+ unit test coverage on business logic, architectures that make ViewModels testable without launching SwiftUI views (MVVM, TCA) are strongly preferred over the MV pattern.

### 2. Select the Primary Architecture Pattern

Apply this decision framework based on the gathered context:

- **MV (Model-View) with @Observable:** Best for Tier 1 apps and rapid prototyping. Use when iOS 17+ is the minimum target, the team is small (1--3 engineers), and testability of view-layer logic is not a hard requirement. Place business logic in `@Observable` model classes accessed directly from views. There is no ViewModel layer -- views bind directly to models.
- **MVVM with ObservableObject/Combine or @Observable:** The default choice for Tier 2 apps. ViewModels conform to `ObservableObject` (iOS 14--16) or use `@Observable` macro (iOS 17+). Each screen or major feature has one ViewModel. Business logic lives in domain services injected into ViewModels. ViewModels expose `@Published` or `@Observable` state and input methods only -- no UIKit types, no SwiftUI types.
- **MVVM + Coordinator for navigation:** Add a coordinator layer when NavigationStack path management becomes complex across 5+ destination types or when deep link handling must be centralized. The coordinator owns a `NavigationPath` or an enum-based route stack, and ViewModels call coordinator methods rather than triggering navigation directly.
- **TCA (The Composable Architecture):** Best for Tier 2--3 apps where the team has prior TCA experience, exhaustive testability is required (every side effect must be testable), and the app has complex state sharing across feature boundaries. TCA's Reducer/Store/Action pattern has a steep learning curve (budget 2--4 weeks for a team new to it) but pays dividends in large codebases with many contributors. Use TCA when you need time-travel debugging, deterministic state mutation, and structured handling of effects.
- **Clean Architecture (UseCase/Repository pattern):** Use when the app has significant business logic that must be independent of both the UI framework and data source. Structure: `Domain` layer (entities, use case protocols), `Data` layer (repository implementations, network/persistence adapters), `Presentation` layer (ViewModels or TCA Stores). This pattern is essential for apps that might migrate UI frameworks (SwiftUI to Compose? Unlikely but possible) or share domain logic with a Swift server.
- **Never mix patterns randomly:** Picking MVVM for some features and TCA for others within the same app creates an architectural no-man's-land. If migrating from one to another, establish a clear boundary and migrate by feature module.

### 3. Design the Module and Folder Structure

Structure communicates intent. A poorly structured project forces engineers to open 5 folders to understand one feature.

- **Feature-first organization over layer-first:** Group files by feature (`Features/Authentication/`, `Features/Feed/`, `Features/Profile/`) not by type (`ViewModels/`, `Views/`, `Models/`). Layer-first organization scales poorly beyond 20 files.
- **Standard folder layout for a feature module:**
  ```
  Features/
    Feed/
      FeedView.swift
      FeedViewModel.swift        (or FeedStore.swift for TCA)
      FeedReducer.swift          (TCA only)
      FeedModel.swift            (domain model, if feature-specific)
      Subviews/
        FeedItemRowView.swift
        FeedItemRowViewModel.swift
  Domain/
    Entities/
      Post.swift
      User.swift
    UseCases/
      FetchFeedUseCase.swift
      SubmitPostUseCase.swift
    Repositories/
      PostRepositoryProtocol.swift
  Data/
    Repositories/
      PostRepository.swift
    Network/
      APIClient.swift
      PostsEndpoint.swift
    Persistence/
      CoreDataStack.swift
  Core/
    DI/
      DependencyContainer.swift
    Navigation/
      AppRouter.swift
      AppRoute.swift
    Extensions/
      View+Extensions.swift
  ```
- **Separate shared UI components** into a `DesignSystem/` or `Components/` folder at the root, not inside feature folders. Components in `Components/` must have zero feature dependencies.
- **Swift Package Manager for module isolation:** For teams of 6+, extract the `Domain` and `Data` layers into separate Swift packages within the workspace. This enforces dependency direction at the compiler level -- `Domain` cannot import `Data`, `Presentation` cannot import `Data` directly without going through `Domain` protocols.

### 4. Implement State Management

State management is the most common source of SwiftUI bugs. Apply these rules precisely.

- **Classify state by scope before writing any code:**
  - *Ephemeral UI state* (is a button loading, is a sheet presented, currently focused field): `@State` in the owning view. Never lift this into a ViewModel.
  - *Shared feature state* (the list of items shown in a screen, whether a user is authenticated): ViewModel or Store, injected via `@StateObject` at the root, passed down with `@ObservedObject` or `@EnvironmentObject`.
  - *Global app state* (authentication status, theme, feature flags): `@EnvironmentObject` injected at the App root or a TCA Store accessed via `@Bindable`.
  - *Navigation state* (current route stack, presented sheet): Owned by the coordinator or router, never by individual views.
- **With ObservableObject (iOS 14--16):** Annotate only properties that need to trigger re-renders with `@Published`. Non-published mutable properties do not cause re-renders. Mark computed properties carefully -- they do not trigger re-renders on their own unless a `@Published` dependency changes.
- **With @Observable macro (iOS 17+):** All stored properties are tracked by default. Use `@ObservationIgnored` for properties that should not trigger re-renders (caches, loggers, internal flags). Inject models with `@State` at the owning layer and pass by reference to children -- no `@ObservedObject` or `@StateObject` needed.
- **Avoid @EnvironmentObject overuse:** Passing everything through environment creates invisible dependencies. Use it for genuinely global concerns (auth state, theme). For feature-scoped state, pass ViewModels explicitly through initializers.
- **Combine vs async/await in ViewModels:** Prefer async/await for point-in-time operations (fetch on appear, submit form). Prefer Combine when consuming a stream of values over time (real-time location updates, WebSocket messages, CoreData `NSFetchedResultsController` publishers). Do not mix both in the same ViewModel unless necessary -- pick the dominant paradigm and use the other only for bridging.

### 5. Implement Navigation Architecture

Navigation is where SwiftUI architecture most commonly breaks down at scale.

- **NavigationStack with enum-based routing (iOS 16+):** Define a `Route` enum with associated values for all destinations in a feature or the whole app. The stack is driven by a `NavigationPath` or a typed `[Route]` array owned by the router.
  ```swift
  enum AppRoute: Hashable {
      case postDetail(postID: String)
      case userProfile(userID: String)
      case settings
      case composerSheet
  }
  ```
- **Coordinator pattern for complex flows:** Create an `AppRouter` class (or actor) annotated with `@Observable` or `ObservableObject` that owns the `NavigationPath`. Views call `router.push(.postDetail(postID: id))` -- they never manipulate the path directly. This makes deep link handling a single-point change in the router.
- **Deep link handling:** Register URL schemes and Universal Links in the App struct. Parse incoming URLs into `AppRoute` cases and pass them to the router. All deep link logic flows through the router -- never scattered across individual views.
- **Sheet and fullScreenCover management:** Use a separate `@State var presentedSheet: AppSheet?` at the appropriate level (App root for global sheets, Feature root for feature-scoped sheets). Avoid nested `.sheet(isPresented:)` modifiers -- they cause presentation conflicts in iOS 16 and below.
- **NavigationSplitView for iPad/macOS:** Use `NavigationSplitView` for apps targeting iPad as a primary platform. The sidebar column drives a `selection: Binding<Route?>` that updates the detail column. Do not attempt to retrofit NavigationStack for iPad -- the UX breaks on large screens.
- **Avoid using sheet presentation inside NavigationStack destination views** when a push transition is appropriate. Mix-and-match transitions (push then modal then push) confuse users and create back-button state bugs.

### 6. Design the Data and Dependency Layer

- **Repository pattern for all external data:** Define protocols in the `Domain` layer: `PostRepositoryProtocol`, `AuthRepositoryProtocol`. Concrete implementations live in `Data`. ViewModels depend only on protocols, never on concrete types. This enables trivial swapping of implementations (real vs mock) in tests and previews.
- **Dependency injection approach by team size:**
  - *Small teams (1--3):* Constructor injection everywhere. A `DependencyContainer` singleton initialized at app startup provides dependencies. Simple and explicit.
  - *Medium teams (4--8):* `@Environment` key-based injection using custom `EnvironmentKey` types. Testable and avoids singletons while remaining discoverable.
  - *Large teams (8+) or TCA users:* TCA's built-in `DependencyValues` system or a dedicated DI container (Swift-native, not third-party). TCA's dependency system enforces that every effect is declared and swappable.
- **SwiftData (iOS 17+) integration:** Define `@Model` classes in the `Data` layer. Expose them to ViewModels through repository protocols that return domain entities, not `@Model` instances directly. This prevents SwiftUI views from depending on `ModelContext` directly, which complicates testing.
- **Core Data integration (iOS 14--16):** Use `NSFetchedResultsController` wrapped in a Combine publisher for reactive updates. The persistence stack lives in `Data`; ViewModels observe a repository's publisher, not the `NSManagedObjectContext` directly.
- **Network layer:** Use `URLSession` with async/await. Define a typed `APIClient` with an `Endpoint` protocol. Never call `URLSession.shared.data(from:)` directly from a ViewModel -- always go through the repository.
- **Error handling contract:** Define a domain-level `AppError` enum (not a generic `Error`) that all repositories throw. ViewModels catch errors and translate them to user-facing strings. Views display the localized string -- never a raw `error.localizedDescription` from Foundation.

### 7. Establish Testing Architecture

- **ViewModel unit tests:** All business logic in ViewModels must be unit testable without SwiftUI. Inject mock repositories via protocols. Test state transitions: given initial state, when action is taken, assert resulting state. Use `XCTestExpectation` or Swift Concurrency `await` for async ViewModel methods.
- **TCA Reducer tests:** Use TCA's `TestStore` for exhaustive assertion. Every action dispatched must account for every state change and every effect emitted. The `TestStore` fails if any unaccounted effect runs -- this is intentional and makes tests highly reliable.
- **SwiftUI Preview as a design-time test:** Provide `PreviewProvider` or `#Preview` macros for every view. Inject mock data through preview-specific repository implementations. A broken preview is a signal of broken dependency injection.
- **UI tests with XCUITest:** Reserve XCUITest for critical user journeys: sign-in, checkout, core creation flows. Do not attempt to XCUITest every screen -- maintenance cost is too high. Aim for 5--10 critical path tests, not exhaustive coverage.
- **Snapshot tests:** Use Point-Free's swift-snapshot-testing or XCTest's `XCTAttachment` for visual regression on critical UI components. Run snapshot tests only against a fixed simulator configuration (iPhone 15 Pro, iOS 17.x) to avoid false positives from rendering differences.

### 8. Document and Enforce Architecture Decisions

- **Architecture Decision Records (ADRs):** Create a `docs/adr/` directory at the project root. Every major architecture decision gets an ADR: why MVVM over TCA, why async/await over Combine, why SPM over CocoaPods. Format: Context, Decision, Consequences (positive and negative).
- **SwiftLint rules to enforce patterns:** Configure `.swiftlint.yml` with custom rules that prevent architectural violations. Examples: ban `import Combine` in the `Domain` layer, ban `URLSession` calls outside the `Data` layer, enforce that files in `Features/` import only `Domain` and `Core`, not `Data`.
- **Xcode project groups vs folder references:** Use folder references (blue folders in Xcode) for all source directories. This prevents the Xcode project file merge conflicts that plague teams using traditional group references.
- **Code review checklist items specific to architecture:** Does the PR add new state to a View that belongs in a ViewModel? Does the PR introduce a concrete dependency where a protocol should be used? Does the ViewModel import SwiftUI? (It must not -- a pure ViewModel has zero SwiftUI imports.) Does the View contain more than 150 lines? (Signal that it needs decomposition.)

---

## Output Format

Deliver architecture guidance using this structure. Adapt sections based on what the user is asking -- a navigation question does not need the full Data Layer section.

```
## iOS SwiftUI Architecture Recommendation

### Project Profile
- **App Tier:** [Tier 1 / Tier 2 / Tier 3]
- **Team Size:** [n engineers]
- **iOS Minimum Deployment Target:** [iOS XX]
- **Existing Codebase:** [Greenfield / UIKit migration / Expanding existing SwiftUI]
- **State Framework:** [@Observable (iOS 17+) / ObservableObject+Combine / TCA]

---

### Architecture Pattern Decision

| Factor | Chosen Pattern | Rationale |
|---|---|---|
| Overall pattern | [MVVM / TCA / MV / Clean] | [1-sentence justification] |
| Navigation | [NavigationStack+Router / NavigationSplitView / Coordinator] | [1-sentence justification] |
| State management | [@Observable / ObservableObject / TCA Store] | [1-sentence justification] |
| Reactive layer | [async/await / Combine / Both] | [1-sentence justification] |
| Dependency injection | [Constructor / Environment keys / TCA DependencyValues] | [1-sentence justification] |
| Persistence | [SwiftData / Core Data / UserDefaults+Keychain / None] | [1-sentence justification] |

---

### Recommended Folder Structure
[Annotated directory tree for this specific project]

---

### State Classification Table

| State Type | Example | Storage | Who Owns It |
|---|---|---|---|
| Ephemeral UI | Button loading indicator | @State in View | The View |
| Feature state | List of feed items | @Observable ViewModel | ViewModel via @StateObject |
| Global state | Auth session | @EnvironmentObject | App root |
| Navigation state | Current route stack | Router @Observable | AppRouter |

---

### Core Implementation Templates

#### [Pattern Name] -- ViewModel Template
```swift
// Concrete, compilable code for the chosen architecture
```

#### Navigation Router Template
```swift
// Concrete, compilable router code
```

#### Repository Protocol Template
```swift
// Concrete, compilable protocol and mock for testing
```

---

### Testing Strategy

| Layer | Test Type | Tool | Coverage Target |
|---|---|---|---|
| Domain use cases | Unit | XCTest + async/await | 90%+ |
| ViewModel | Unit | XCTest + mock repos | 80%+ |
| Navigation flows | Integration | XCTest | Critical paths |
| UI components | Snapshot | swift-snapshot-testing | Key components |
| End-to-end journeys | UI | XCUITest | 5--10 critical flows |

---

### ADR Summary
**Decision:** [What was decided]
**Alternatives considered:** [What was not chosen and why]
**Consequences:** [What this choice requires of the team]
```

---

## Rules

1. **Never recommend TCA to a team new to SwiftUI.** TCA requires fluency in SwiftUI, Combine or async/await, and functional programming concepts simultaneously. A team building their first SwiftUI app with TCA will spend 60%+ of their time fighting the framework rather than building product. Recommend MVVM first, document TCA as a future migration path.

2. **Never let a ViewModel import SwiftUI.** A ViewModel that imports SwiftUI cannot be tested without the SwiftUI runtime. The only types a ViewModel may reference from SwiftUI are `Color` and `Image` -- and only when the design system mandates it. All other SwiftUI types must stay in Views.

3. **Never use @EnvironmentObject as a general dependency injection mechanism.** Every `@EnvironmentObject` dependency is invisible in the type system at the call site. Limit `@EnvironmentObject` to 2--3 genuinely global concerns per app: authentication state, theme/appearance, and app-wide router. Everything else uses constructor injection.

4. **Never scatter NavigationPath or sheet state across multiple views.** Navigation state owned at multiple levels creates race conditions, back-button inconsistencies, and untestable flows. All navigation state for a feature must have exactly one owner -- the router or the feature's root view.

5. **Always match the reactive layer to the operation type.** Use async/await for operations that produce a single result (network fetch, database write, biometric auth). Use Combine or AsyncSequence for operations that produce a stream of values over time (location updates, WebSocket events, timer ticks). Wrapping a Combine publisher in `async/await` just to be consistent is acceptable only at a single bridging site, not as a general policy.

6. **Never place more than 150 lines of code in a SwiftUI View body.** A View that exceeds this threshold is doing too much. Extract subviews as separate named structs (not computed properties), and extract conditional logic into the ViewModel. Computed properties in View body are fine for truly local formatting, not for business logic.

7. **Always use protocols for all external dependencies in ViewModels and use cases.** Concrete types (URLSession, ModelContext, UserDefaults) must never appear in a ViewModel. Every dependency that touches I/O must be protocol-abstracted. This enables preview mocks, unit test mocks, and future implementation swaps without ViewModel changes.

8. **Never use ObservableObject for ephemeral, view-local state.** Creating an `ObservableObject` class for state that is only ever used by one view and resets on disappear wastes memory and creates unnecessary object allocations. Use `@State` for booleans, strings, and simple value types local to a view.

9. **Always handle the loading, success, and error states explicitly in ViewModel output.** Define a `ViewState<T>` enum with cases `idle`, `loading`, `loaded(T)`, and `failed(AppError)`. Never use a combination of `isLoading: Bool` + `data: T?` + `errorMessage: String?` -- this combination allows 8 possible states (2³) when only 4 are valid.

10. **Never introduce SwiftData or Core Data into a feature's ViewModel directly.** Both `@Model` (SwiftData) and `NSManagedObject` (Core Data) carry managed object context lifecycles that are incompatible with clean unit testing. ViewModel dependencies on persistence must always flow through a repository protocol that returns plain Swift value types (structs or enums).

---

## Edge Cases

### iOS 16 and iOS 17 API Divergence in the Same Codebase

When the minimum deployment target is iOS 16 but the team wants to use `@Observable` (iOS 17+), they must maintain two code paths. The correct approach is to define a `FeatureViewModel` as an `ObservableObject` for iOS 16 compatibility and annotate it with `@available(iOS 17, *)` for an `@Observable` variant only when the complexity savings justify it. Do not use `#if canImport` for this -- use `@available` annotations and `if #available(iOS 17, *)` at the injection site. This adds maintenance burden; document in an ADR whether the team will maintain dual implementations or standardize on the lower target API until they drop iOS 16 support.

### UIKit Integration Points (UIViewControllerRepresentable)

When wrapping UIKit components (UIImagePickerController, MFMailComposeViewController, PDFView, MapKit's MKMapView for complex annotations) with `UIViewControllerRepresentable` or `UIViewRepresentable`, the SwiftUI view layer remains clean but the represented controller has its own lifecycle. Coordinate state updates through the `Coordinator` class nested inside the Representable -- not through a shared ViewModel. The Coordinator is the delegate and reports back to SwiftUI via bindings. If the UIKit component owns significant state (a PDF annotation session, a complex camera state), consider creating a dedicated `UIKitBridgeViewModel` that is exclusively owned by the representable, separate from the feature's main ViewModel.

### Multi-Window and Scene Support on iPad

SwiftUI's `@SceneStorage` is scoped per window scene. For iPad apps supporting multiple windows (`UISceneConfiguration`), any state stored in `@EnvironmentObject` at the App level is shared across all scenes by default when using a shared singleton. If per-scene state is required (each window shows a different document), the state object must be instantiated per scene in the `WindowGroup` or `DocumentGroup` body, not at the App struct level. This is a common source of data bleed bugs when adding iPad multi-window support to an existing phone-first app.

### Migrating a Feature Module from UIKit MVC to SwiftUI MVVM

Do not rewrite the entire UIKit screen -- wrap it first. Create a `UIViewControllerRepresentable` that wraps the existing UIKit ViewController. Then extract business logic from the ViewController into a new ViewModel. The ViewModel feeds both the UIKit ViewController (via delegation) and, when ready, a new SwiftUI View. Once the SwiftUI View is stable and tested, remove the Representable wrapper. This three-phase migration (wrap → extract → replace) reduces risk by keeping a working UIKit fallback until the SwiftUI implementation is validated in production.

### Deep Link Handling in Complex Navigation Stacks

When a deep link must navigate 3+ levels deep (e.g., app open → Home → Feed → Post → Comment thread), the router must be capable of setting the full navigation stack at once, not pushing one level at a time. With `NavigationStack`, set the entire `[AppRoute]` path in one assignment: `router.path = [.feed, .postDetail(id: postID), .commentThread(id: threadID)]`. Pushing incrementally with delays between each push causes visual animation artifacts and timing-dependent state bugs. If the navigation stack must be set before the root view has finished rendering (cold launch deep link), defer the path assignment to the next run loop cycle using `Task { @MainActor in router.path = [...] }`.

### TCA Performance with Large Lists

TCA's exhaustive state comparison runs a full equality check on the entire state tree on every action. For list-based features with 500+ items where each item has its own reducer (`ForEachStore` or `forEach` on `IdentifiedArray`), this comparison becomes measurably slow (30ms+ per action on older devices). Mitigate by splitting the list feature into a shell store (owns navigation, filter state) and child stores (own individual item state), and using `.scope` to minimize the state surface area each child reducer touches. Profile with the TCA `_printChanges()` reducer to identify which actions are triggering expensive diffing. An `IdentifiedArray` of 500 elements where each element carries 20 properties is a warning sign -- flatten the state or paginate.

### Concurrent State Mutations with async/await

When multiple async operations can mutate the same ViewModel state concurrently (two network calls racing to update the same `@Published` array), annotate the ViewModel class with `@MainActor` to serialize all state mutations on the main actor. Never call `DispatchQueue.main.async` from within an `@MainActor`-annotated class -- it is redundant and signals the engineer does not understand Swift's actor model. If background computation is needed, isolate it in a `nonisolated func` or a separate `actor` and `await` the result before assigning to state. The ViewModel's stored properties must only be mutated on the main actor.

---

## Example

**Input:** "I'm building a news reader app for iOS 16+. The app has a home feed, article detail, bookmarks, and a settings screen. There's a team of 4 engineers with solid Swift experience but limited SwiftUI experience (all coming from UIKit/MVVM). We need offline reading support and the app needs to handle deep links into article detail. What architecture do you recommend and how should I structure the project?"

**Output:**

## iOS SwiftUI Architecture Recommendation

### Project Profile
- **App Tier:** Tier 2 (multi-feature consumer app)
- **Team Size:** 4 engineers
- **iOS Minimum Deployment Target:** iOS 16
- **Existing Codebase:** Greenfield SwiftUI
- **State Framework:** ObservableObject + Combine (iOS 16 compatible; @Observable available on iOS 17+ only)

---

### Architecture Pattern Decision

| Factor | Chosen Pattern | Rationale |
|---|---|---|
| Overall pattern | MVVM + Clean Architecture | Familiar to UIKit MVVM engineers; domain layer enables offline-first; testable without SwiftUI runtime |
| Navigation | NavigationStack + AppRouter (Coordinator) | Deep link requirement demands centralized navigation state; 4-tab structure needs coordinated root |
| State management | ObservableObject + @Published | iOS 16 minimum rules out @Observable macro; engineers already know @Published from UIKit/RxSwift analogs |
| Reactive layer | async/await primary, Combine for streams | Combine for Core Data change notifications; async/await for network and user actions |
| Dependency injection | Constructor injection + DependencyContainer | Team size doesn't justify Environment key complexity; explicit injection is readable for UIKit engineers learning SwiftUI |
| Persistence | Core Data (offline article cache + bookmarks) | iOS 16 minimum rules out SwiftData; Core Data NSFetchedResultsController integrates well with Combine |

---

### Recommended Folder Structure

```
NewsReader/
├── App/
│   ├── NewsReaderApp.swift          # App struct, DI container init, scene setup
│   └── DependencyContainer.swift   # Assembles all dependencies at launch
├── Core/
│   ├── Navigation/
│   │   ├── AppRouter.swift          # Owns NavigationPath, handles deep links
│   │   └── AppRoute.swift           # Route enum for all app destinations
│   ├── Persistence/
│   │   └── CoreDataStack.swift      # NSPersistentContainer setup
│   └── Network/
│       └── APIClient.swift          # URLSession wrapper, typed endpoint execution
├── Domain/
│   ├── Entities/
│   │   ├── Article.swift            # Pure Swift struct, no framework dependencies
│   │   └── Bookmark.swift
│   ├── Repositories/
│   │   ├── ArticleRepositoryProtocol.swift
│   │   └── BookmarkRepositoryProtocol.swift
│   └── UseCases/
│       ├── FetchFeedUseCase.swift
│       ├── FetchArticleUseCase.swift
│       └── ToggleBookmarkUseCase.swift
├── Data/
│   ├── Repositories/
│   │   ├── ArticleRepository.swift  # Implements protocol; network + Core Data
│   │   └── BookmarkRepository.swift
│   ├── Network/
│   │   ├── ArticlesEndpoint.swift
│   │   └── DTOs/
│   │       └── ArticleDTO.swift     # Decodable DTO, mapped to domain Article
│   └── Persistence/
│       ├── ArticleManagedObject.swift
│       └── CoreDataArticleMapper.swift
├── Features/
│   ├── Feed/
│   │   ├── FeedView.swift
│   │   ├── FeedViewModel.swift
│   │   └── Subviews/
│   │       ├── ArticleRowView.swift
│   │       └── FeedErrorView.swift
│   ├── ArticleDetail/
│   │   ├── ArticleDetailView.swift
│   │   └── ArticleDetailViewModel.swift
│   ├── Bookmarks/
│   │   ├── BookmarksView.swift
│   │   └── BookmarksViewModel.swift
│   └── Settings/
│       ├── SettingsView.swift
│       └── SettingsViewModel.swift
├── Components/               # Shared, feature-agnostic UI components
│   ├── ArticleThumbnailView.swift
│   ├── LoadingStateView.swift
│   └── ErrorBannerView.swift
└── docs/
    └── adr/
        ├── 001-mvvm-over-tca.md
        └── 002-core-data-over-swiftdata.md
```

---

### State Classification Table

| State Type | Example | Storage | Who Owns It |
|---|---|---|---|
| Ephemeral UI | Pull-to-refresh spinner | @State in FeedView | FeedView |
| Ephemeral UI | Article share sheet presented | @State in ArticleDetailView | ArticleDetailView |
| Feature state | List of articles in feed | @Published in FeedViewModel | FeedViewModel via @StateObject |
| Feature state | Article body content loaded | @Published in ArticleDetailViewModel | ArticleDetailViewModel |
| Global state | Authentication session | @EnvironmentObject AppSession | NewsReaderApp root |
| Navigation state | Current NavigationPath | @Published in AppRouter | AppRouter via @StateObject |
| Persistent state | Bookmarked articles | Core Data + BookmarkRepository | BookmarksViewModel reads via use case |

---

### Core Implementation Templates

#### ViewState Enum -- Use in Every ViewModel

```swift
// Domain/ViewState.swift
enum ViewState<T> {
    case idle
    case loading
    case loaded(T)
    case failed(AppError)
}

enum AppError: LocalizedError {
    case networkUnavailable
    case serverError(statusCode: Int)
    case decodingFailed
    case persistenceFailed(String)

    var errorDescription: String? {
        switch self {
        case .networkUnavailable:
            return "No internet connection. Showing cached content."
        case .serverError(let code):
            return "Server error (\(code)). Please try again."
        case .decodingFailed:
            return "Could not load content. Please update the app."
        case .persistenceFailed(let detail):
            return "Could not save data: \(detail)"
        }
    }
}
```

#### FeedViewModel -- MVVM with ObservableObject

```swift
// Features/Feed/FeedViewModel.swift
// NOTE: Zero SwiftUI imports. Testable with XCTest alone.
import Foundation
import Combine

@MainActor
final class FeedViewModel: ObservableObject {
    @Published private(set) var state: ViewState<[Article]> = .idle
    @Published private(set) var isRefreshing: Bool = false

    private let fetchFeedUseCase: FetchFeedUseCaseProtocol
    private let router: AppRouter
    private var cancellables = Set<AnyCancellable>()

    init(fetchFeedUseCase: FetchFeedUseCaseProtocol, router: AppRouter) {
        self.fetchFeedUseCase = fetchFeedUseCase
        self.router = router
    }

    func onAppear() async {
        guard case .idle = state else { return }
        await loadFeed()
    }

    func refresh() async {
        isRefreshing = true
        await loadFeed()
        isRefreshing = false
    }

    func selectArticle(_ article: Article) {
        router.push(.articleDetail(articleID: article.id))
    }

    private func loadFeed() async {
        state = .loading
        do {
            let articles = try await fetchFeedUseCase.execute()
            state = .loaded(articles)
        } catch let error as AppError {
            state = .failed(error)
        } catch {
            state = .failed(.networkUnavailable)
        }
    }
}
```

#### Navigation Router

```swift
// Core/Navigation/AppRoute.swift
enum AppRoute: Hashable {
    case articleDetail(articleID: String)
    case bookmarks
    case settings
}

// Core/Navigation/AppRouter.swift
import Foundation

@MainActor
final class AppRouter: ObservableObject {
    @Published var path: [AppRoute] = []

    func push(_ route: AppRoute) {
        path.append(route)
    }

    func pop() {
        guard !path.isEmpty else { return }
        path.removeLast()
    }

    func popToRoot() {
        path = []
    }

    // Deep link handler -- sets full stack in one assignment
    func handle(deepLink url: URL) {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let host = components.host else { return }

        switch host {
        case "article":
            if let id = components.queryItems?.first(where: { $0.name == "id" })?.value {
                // Set entire path at once -- no incremental pushing
                path = [.articleDetail(articleID: id)]
            }
        default:
            popToRoot()
        }
    }
}
```

#### Repository Protocol and Mock

```swift
// Domain/Repositories/ArticleRepositoryProtocol.swift
protocol ArticleRepositoryProtocol {
    func fetchFeed() async throws -> [Article]
    func fetchArticle(id: String) async throws -> Article
    func cacheArticles(_ articles: [Article]) async throws
}

// For use in unit tests and SwiftUI Previews:
final class MockArticleRepository: ArticleRepositoryProtocol {
    var stubbedFeed: [Article] = Article.previews
    var shouldThrow: Bool = false

    func fetchFeed() async throws -> [Article] {
        if shouldThrow { throw AppError.networkUnavailable }
        return stubbedFeed
    }

    func fetchArticle(id: String) async throws -> Article {
        guard let article = stubbedFeed.first(where: { $0.id == id }) else {
            throw AppError.networkUnavailable
        }
        return article
    }

    func cacheArticles(_ articles: [Article]) async throws {
        // no-op in mock
    }
}
```

#### FeedView -- SwiftUI View (ObservableObject pattern)

```swift
// Features/Feed/FeedView.swift
import SwiftUI

struct FeedView: View {
    @StateObject private var viewModel: FeedViewModel

    init(viewModel: FeedViewModel) {
        // Use _viewModel to assign to @StateObject without triggering init
        self._viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        Group {
            switch viewModel.state {
            case .idle, .loading:
                LoadingStateView()
            case .loaded(let articles):
                articleList(articles)
            case .failed(let error):
                FeedErrorView(error: error, onRetry: {
                    Task { await viewModel.refresh() }
                })
            }
        }
        .navigationTitle("Top Stories")
        .refreshable {
            await viewModel.refresh()
        }
        .task {
            await viewModel.onAppear()
        }
    }

    private func articleList(_ articles: [Article]) -> some View {
        List(articles) { article in
            ArticleRowView(article: article)
                .onTapGesture {
                    viewModel.selectArticle(article)
                }
        }
        .listStyle(.plain)
    }
}
```

---

### Testing Strategy

| Layer | Test Type | Tool | Coverage Target |
|---|---|---|---|
| Domain use cases | Unit | XCTest + async/await | 90%+ |
| FeedViewModel | Unit | XCTest + MockArticleRepository | 85%+ |
| BookmarkViewModel | Unit | XCTest + MockBookmarkRepository | 85%+ |
| ArticleRepository | Integration | XCTest + URLSession mock | Network + cache paths |
| Navigation deep links | Unit | XCTest + AppRouter | All registered URL patterns |
| Feed + Article Detail flow | UI | XCUITest | Happy path + error state |
| ArticleRowView, LoadingStateView | Snapshot | swift-snapshot-testing | All variants (light/dark/dynamic type) |

---

### ADR Summary

**ADR 001 -- MVVM over TCA**
- *Decision:* Use MVVM with ObservableObject and Clean Architecture layers.
- *Alternatives considered:* TCA offers superior testability and time-travel debugging but requires the team to learn a new paradigm while simultaneously learning SwiftUI. The learning cost (estimated 3--4 weeks) is not justified for a 4-person team on a standard content app.
- *Consequences:* The team must self-enforce ViewModel purity (no SwiftUI imports, no concrete dependencies). Add a SwiftLint rule banning `import SwiftUI` in files matching `*ViewModel.swift`. Revisit TCA adoption when the team has 6+ months of SwiftUI experience.

**ADR 002 -- Core Data over SwiftData**
- *Decision:* Use Core Data for offline article caching and bookmarks.
- *Alternatives considered:* SwiftData has cleaner syntax and direct SwiftUI integration but requires iOS 17+. The project targets iOS 16. SQLite via GRDB is a valid alternative with better testability but introduces a third-party dependency.
- *Consequences:* Engineers must learn NSFetchedResultsController + Combine bridging. Core Data stack setup requires boilerplate. The repository abstraction ensures this implementation detail never leaks into ViewModels -- a swap to SwiftData when iOS 17 becomes the minimum target requires only repository implementation changes.
