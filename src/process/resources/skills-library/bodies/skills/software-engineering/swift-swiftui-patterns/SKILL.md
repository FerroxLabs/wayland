---
name: swift-swiftui-patterns
description: |
  Guides expert-level swift swiftui patterns implementation: swift and mobile decision frameworks, production-ready patterns, and concrete templates for swift swiftui patterns workflows.
  Use when the user asks about swift swiftui patterns, swift swiftui patterns configuration, or swift best practices for swift projects.
  Do NOT use when the user needs a different languages runtimes capability -- check sibling skills in the languages runtimes subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "swift mobile frameworks"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Swift SwiftUI Patterns

## When to Use

**Use this skill when:**
- User is building a new iOS, macOS, watchOS, or visionOS app with SwiftUI and needs architectural guidance (MVVM, TCA, MV pattern)
- User wants to implement reactive data flow in SwiftUI using Combine, async/await, or the Observation framework
- User is designing reusable SwiftUI components and needs guidance on view composition, environment propagation, or custom layout
- User asks about state management strategies -- @State, @StateObject, @ObservableObject, @Observable, @Environment, or @Binding -- and when to use each
- User needs help integrating SwiftUI into an existing UIKit codebase using UIHostingController or representable wrappers
- User wants to implement advanced SwiftUI patterns: custom PreferenceKey propagation, matched geometry effects, custom transitions, or geometry readers
- User is troubleshooting SwiftUI performance problems: excessive view redraws, slow list rendering, or memory leaks from closures capturing ObservableObject instances
- User needs a production-ready navigation architecture using NavigationStack, NavigationSplitView, or a coordinator pattern

**Do NOT use this skill when:**
- User needs UIKit-specific patterns (UIViewController lifecycle, Auto Layout, UITableView delegate patterns) -- use a UIKit skill instead
- User is asking about Swift language fundamentals (generics, protocols, actors) without a SwiftUI context -- use a Swift language skill
- User needs React Native, Flutter, or Kotlin Multiplatform cross-platform patterns -- use the relevant cross-platform skill
- User is asking about server-side Swift (Vapor, Hummingbird) -- architectural concerns differ substantially from client-side SwiftUI
- User needs App Store submission, provisioning, or CI/CD pipeline guidance -- this is a deployment skill, not an architecture skill
- User is asking about SwiftData or Core Data modeling exclusively without SwiftUI integration -- use a persistence skill

---

## Process

### 1. Identify the Architectural Context

Before recommending any pattern, establish the project's shape:

- **App scale:** Solo side project, startup MVP, or enterprise app with 10+ engineers? Solo and small team projects should default to simpler patterns (vanilla MVVM with @Observable) rather than The Composable Architecture (TCA), which has a steep learning curve and significant boilerplate overhead.
- **Target platforms:** iPhone-only, Universal (iPad + iPhone), or multi-platform (iOS + macOS)? Multi-platform apps require NavigationSplitView and sidebar-aware layouts rather than single-column NavigationStack patterns.
- **Minimum deployment target:** iOS 17+ unlocks the Observation framework (@Observable macro) which replaces ObservableObject entirely. iOS 16 and below require Combine-based ObservableObject. iOS 14 minimum still requires .onAppear workarounds for NavigationLink eagerness bugs.
- **Existing codebase:** Greenfield SwiftUI vs. SwiftUI embedded in UIKit? Embedding requires UIHostingController wrappers and careful management of the UIKit--SwiftUI boundary.
- **Team familiarity:** Has the team shipped SwiftUI before? First-time SwiftUI teams consistently over-apply @EnvironmentObject and create implicit dependency webs. Guide them toward explicit @Binding and dependency injection first.

### 2. Select the State Management Strategy

SwiftUI state is a hierarchy, not a flat system. Choose the right tool for each layer:

- **@State** -- use for view-local, value-type data that does not need to outlive the view: toggle flags, text field content, scroll position. Never use @State for business logic or network results.
- **@Binding** -- use to pass a mutable reference downward to a child view. The child can modify the parent's state without owning it. Two-level binding (grandparent -> parent -> child) is acceptable; three or more levels signals you need @Environment or a shared model.
- **@Observable (iOS 17+) / @ObservableObject (iOS 16-)** -- use for view models that hold fetched data, user session state, or any state that multiple views need to observe. With @Observable, only the specific properties accessed in a view body trigger re-renders, dramatically reducing unnecessary redraws compared to ObservableObject.
- **@StateObject vs @ObservedObject** -- @StateObject creates and owns the object (use in the view that initializes it). @ObservedObject observes an object created elsewhere (use in child views receiving an injected dependency). Mixing these up is the single most common source of SwiftUI lifecycle bugs.
- **@EnvironmentObject / @Environment** -- use for truly global, cross-cutting concerns: authentication state, theme/appearance settings, feature flags, analytics service. Do not inject every model into the environment -- it creates invisible dependencies that break previews and tests.
- **@AppStorage / @SceneStorage** -- use for lightweight persistence of user preferences and scene-restoration state. @AppStorage wraps UserDefaults. Do not use it for large data structures; limit to primitive types and small strings.

### 3. Design the View Hierarchy and Composition

SwiftUI views are cheap structs -- design for composition, not inheritance:

- **Decompose views at the right granularity.** A view body exceeding 60--80 lines is too large. Extract subviews using `private var` computed properties for simple static subviews, or dedicated `struct` types for subviews that accept parameters or have their own state.
- **Prefer value-type subviews over AnyView erasure.** Wrapping views in AnyView defeats the diffing engine and forces full re-renders. Use `@ViewBuilder` functions, `Group`, or generics (`some View`) to maintain type identity.
- **Use ViewModifiers for reusable style and behavior.** A custom `ViewModifier` bundles multiple modifiers, applies them consistently, and provides a named abstraction (`.cardStyle()`, `.primaryButton()`). This is superior to copy-pasting modifier chains.
- **Leverage PreferenceKey for bottom-up communication.** When a child view needs to communicate a value upward (e.g., its measured size, a scroll offset), define a custom `PreferenceKey` conformance, set the value with `.preference(key:value:)`, and read it in the ancestor with `.onPreferenceChange`.
- **Container views should not know about business logic.** A `PostListView` renders a list; a `PostListViewModel` fetches and filters posts. Keep view structs free of URLSession calls, formatters, and conditional business logic.

### 4. Implement Navigation Architecture

Navigation is the most error-prone area in SwiftUI. Choose the right tool:

- **NavigationStack + path binding (iOS 16+):** Use a `NavigationPath` or typed `[Route]` array as the single source of truth for the navigation stack. This enables deep linking, state restoration, and programmatic navigation from outside the view hierarchy.
- **NavigationSplitView (iOS 16+, universal apps):** Required for iPad and macOS sidebar+content+detail layouts. Use `columnVisibility` to control which columns appear on compact size classes.
- **Avoid NavigationView on iOS 16+.** It is deprecated and has known bugs around double-push and state retention.
- **Coordinator pattern for complex flows:** For multi-step flows (onboarding, checkout, auth), define a `Coordinator` class that owns the `NavigationPath` and exposes navigation methods (`func goToPayment()`, `func dismissToRoot()`). Inject the coordinator as an @EnvironmentObject or via initializer.
- **Deep link handling:** Register URL schemes and Universal Links in the app's `onOpenURL` modifier. Map incoming URLs to `NavigationPath` mutations in the coordinator. Test every registered deep link route with XCUITest.
- **Sheet and fullScreenCover management:** Use an enum of `Destination` cases bound to an optional `@State var activeSheet: Destination?` rather than multiple Bool flags. One enum cleanly replaces three or four separate `@State var showXSheet: Bool` properties.

### 5. Optimize Performance

SwiftUI's declarative diffing is efficient but has known bottlenecks:

- **Identify excessive redraws using Instruments.** Use the SwiftUI instrument in Xcode's Instruments.app to visualize view body invocations. A view body executing more than once per user interaction is a candidate for optimization.
- **Equatable views:** Conform views to `Equatable` and use `.equatable()` modifier to skip re-rendering when inputs haven't changed. Apply this to expensive subviews that receive stable data.
- **Lazy containers for large data sets.** Use `LazyVStack`, `LazyHStack`, and `List` for collections with 50+ items. `VStack` eagerly renders all children. `List` uses UITableView under the hood and provides cell reuse; prefer it over `LazyVStack` + `ForEach` for data-driven lists with 200+ items.
- **Avoid capturing ObservableObject in closures.** A closure in a view body that captures `self` (the view) or an observable model creates retain cycles. Use `[weak viewModel]` in Task closures. With the @Observable macro, the capture behavior is safer, but async Task closures still require attention.
- **Image loading and caching.** Never load images synchronously in a view body. Use `AsyncImage` with a `.phase`-based placeholder for simple cases. For production apps with large image sets, a dedicated image cache (wrapping URLSession with `URLCache` configured to 50 MB memory / 200 MB disk) prevents redundant network requests and memory pressure.
- **Diffing ForEach with stable IDs.** Always provide stable, unique `id` values to `ForEach`. Using `\.self` on mutable structs causes O(n) diffing and animation glitches. Prefer UUID-based identifiers stored in the model.

### 6. Handle Async Operations and Side Effects

SwiftUI's structured concurrency integration changed best practices significantly in iOS 15+:

- **Use `.task { }` modifier for view-lifecycle-bound async work.** It automatically cancels the Task when the view disappears. This is superior to `.onAppear { Task { } }` which does not cancel automatically.
- **Use `@MainActor` on ViewModels.** Annotate ViewModel classes with `@MainActor` to ensure all property mutations happen on the main thread. This eliminates the need for `DispatchQueue.main.async` calls when updating @Published or @Observable properties.
- **Separate concerns with AsyncSequence.** For streaming data (WebSocket, Core Location updates, NotificationCenter), bridge to AsyncSequence using `AsyncStream` or the `.values` property on Combine Publishers. Consume in a `.task` modifier with `for await` syntax.
- **Error handling in views.** Model async results as `enum LoadState<T> { case idle, loading, success(T), failure(Error) }`. Bind view rendering to this enum via a `switch` or custom `ViewBuilder` function. Never show a blank screen on error -- always provide a retry action.
- **Avoid Combine in new iOS 17+ code.** The Observation framework and Swift Concurrency together cover 95% of what Combine previously handled in UI code. New code on iOS 17+ should prefer async/await and AsyncSequence over Combine publishers. Retain Combine only for complex operator chains (debounce, merge, combineLatest) that lack async/await equivalents.

### 7. Write Testable SwiftUI Code

SwiftUI views are difficult to unit test directly -- design for testability at the ViewModel layer:

- **Extract all logic from view bodies.** The view body should be a pure function of its state inputs. Business logic, formatting, filtering, and sorting belong in the ViewModel or a dedicated service type.
- **Protocol-abstract dependencies.** ViewModels should depend on protocols, not concrete types. `protocol NetworkService { func fetchPosts() async throws -> [Post] }` enables mock injection in tests.
- **Unit test ViewModels with XCTest.** Test state transitions: given an initial state, when an action occurs, assert the resulting state. Use `XCTestExpectation` or `async/await` test methods for async operations.
- **SwiftUI preview-driven development.** Write `#Preview` macros for every non-trivial view with multiple state configurations: loading, error, empty, and populated states. Previews surface layout bugs faster than running on a simulator.
- **UI testing with XCUITest for navigation flows.** Test critical user journeys (login, purchase, onboarding) end-to-end. Use accessibility identifiers (`.accessibilityIdentifier("loginButton")`) as stable XCUITest selectors -- never rely on display strings which break on localization.

### 8. Apply Platform-Specific Adaptations

SwiftUI is cross-platform but not uniform across Apple platforms:

- **Size class adaptation:** Use `@Environment(\.horizontalSizeClass)` to adapt layouts for iPhone (compact) vs. iPad (regular). Apply `.adaptiveSheet` patterns for iPad where sheets become popovers.
- **Focus management (tvOS, macOS):** Use `@FocusState` to manage keyboard and remote-control focus explicitly. On tvOS, every interactive element must be focusable.
- **Safe area handling:** Never hardcode inset values. Use `.safeAreaInset(edge:)` to add persistent bottom toolbars or banners. Use `GeometryReader` sparingly -- prefer layout primitives and `safeAreaPadding` environment values.
- **Dynamic Type compliance:** All text must respect `@Environment(\.dynamicTypeSize)`. Use semantic font styles (`.title`, `.body`, `.caption`) rather than fixed point sizes. Test at the xxxLarge accessibility size before shipping.
- **Dark mode and color scheme:** Define all colors in the asset catalog with dark/light variants, or use `Color(.systemBackground)` and semantic system colors. Never hardcode `Color.white` or `Color.black` for backgrounds.

---

## Output Format

When responding to a user's SwiftUI pattern question, structure the output as follows:

```
## SwiftUI Pattern Recommendation: [Pattern Name]

### Context Assessment
- Deployment target: [iOS version]
- App scale: [solo / startup / enterprise]
- Key constraint: [what drives the decision]

### Architecture Decision

| Concern | Recommended Pattern | Alternative | Avoid |
|---|---|---|---|
| State (local) | @State | @StateObject | @EnvironmentObject |
| State (shared) | @Observable + @StateObject | ObservableObject | Singleton |
| Navigation | NavigationStack + [Route] | NavigationSplitView | NavigationView |
| Async operations | .task { } + @MainActor | Combine | onAppear + DispatchQueue |
| Dependency injection | Protocol + init injection | @EnvironmentObject | Static globals |

### Implementation

#### [Component Name] -- ViewModel
```swift
// Full, runnable Swift code here
```

#### [Component Name] -- View
```swift
// Full, runnable Swift code here
```

#### [Component Name] -- Supporting Types
```swift
// Route enum, LoadState enum, custom modifiers, etc.
```

### Trade-off Notes
- [Specific trade-off 1 with reasoning]
- [Specific trade-off 2 with reasoning]

### Testing Approach
- [Unit test targets in the ViewModel]
- [Preview configurations to validate]
- [XCUITest scenarios if applicable]
```

---

## Rules

1. **NEVER use @ObservedObject where @StateObject is correct.** If a view creates and owns a ViewModel, always use @StateObject. Using @ObservedObject for an object the view owns means the object is recreated on every parent re-render, losing all state. This is the most common SwiftUI bug in production apps.

2. **NEVER put business logic inside a view body.** View bodies execute on the main thread during rendering. Network calls, Core Data fetches, and heavy computations in a view body stall the main thread and cause dropped frames. All such work belongs in a ViewModel or service layer called from `.task { }` or `.onAppear`.

3. **ALWAYS specify a stable `id` parameter in `ForEach`.** Using `ForEach(items, id: \.self)` on value types that lack a stable hash causes O(n) list diffing, broken animations, and accessibility bugs. Models in ForEach must conform to Identifiable with a stable UUID or database ID.

4. **NEVER use `AnyView` as a general-purpose view wrapper.** AnyView erases type information, disabling SwiftUI's structural diffing engine and forcing full subtree re-renders. Use `@ViewBuilder`, `Group`, generic `some View` return types, or conditional `if/else` blocks that preserve type identity.

5. **ALWAYS annotate ViewModel classes with `@MainActor`.** Property mutations on an @Observable or @ObservableObject from a background thread cause undefined behavior and data races. @MainActor annotation ensures all mutations happen on the main thread without manual dispatch calls.

6. **NEVER hardcode layout values where system metrics exist.** Do not write `.padding(16)` when `.padding()` (which applies the system default of 16 pts on most platforms) suffices. Do not hardcode safe area sizes, navigation bar heights, or keyboard heights -- use environment values and geometry proxies instead.

7. **ALWAYS handle all three states of async data: loading, success, and error.** A view that only handles the success state ships with invisible failure modes. Define a `LoadState<T>` enum and drive view rendering from it. Provide a retry button in the error state.

8. **NEVER use `NavigationView` in new code targeting iOS 16+.** NavigationView has documented double-push bugs on iPhone, broken state restoration, and does not support programmatic navigation paths. Use NavigationStack (single column) or NavigationSplitView (multi-column) instead.

9. **NEVER use `GeometryReader` to achieve alignment or spacing.** GeometryReader is for cases where exact parent dimensions are unavoidable (custom drawing, proportional layouts). Using it to center views, add padding, or manage spacing adds layout overhead and creates fragile, size-dependent code. Use alignment guides, `frame(maxWidth: .infinity)`, and layout primitives.

10. **ALWAYS write #Preview macros with multiple states.** A preview showing only the happy-path populated state misses layout bugs at zero items (empty state), single item, truncated text, and error states. Each significant view should have at minimum: empty state, loading state, and populated state previews.

---

## Edge Cases

### Legacy UIKit Integration
When embedding SwiftUI into an existing UIKit app:
- Wrap SwiftUI views with `UIHostingController`. Subclass it only when you need to override `viewDidLoad` for UIKit-specific setup (push notification permission prompts, navigation bar configuration).
- Pass data from UIKit to SwiftUI through the hosting controller's `rootView` property. Do not use NotificationCenter as the bridge -- it creates implicit, untestable coupling.
- For UIKit components embedded in SwiftUI (custom camera views, complex maps, rich text editors), implement `UIViewRepresentable` or `UIViewControllerRepresentable`. The `Coordinator` class in these representables handles delegate callbacks. Keep the Coordinator small -- bridge delegate events into a closure or Combine subject owned by the ViewModel.
- Memory management at the UIKit--SwiftUI boundary requires care. `UIHostingController` retains the SwiftUI environment. If you inject an @EnvironmentObject that holds a strong reference back to a UIKit object, you create a retain cycle. Use `weak` references in EnvironmentObject types that reference UIKit objects.

### SwiftUI on iOS 15 / iOS 16 Mixed Deployment Targets
When supporting iOS 15 and iOS 16 while also using iOS 17 APIs:
- Gate @Observable macro usage behind `#if swift(>=5.9)` or `@available(iOS 17, *)` checks. Provide an ObservableObject conformance for the lower deployment target path.
- `NavigationStack` is iOS 16+. Provide a `NavigationView` fallback wrapped in `#if swift(>=5.7)` availability checks. Use a shared `Router` abstraction that hides the underlying stack behind a protocol so view code is identical at both targets.
- Some modifiers are unavailable on earlier OS versions (`.scrollBounceBehavior`, `.contentMarginsDisabled`, `safeAreaPadding`). Always check the API availability badge in Xcode documentation and wrap with `if #available(iOS 16, *)` guards. Mark the wrapping view with `@available` when the entire view requires a version.

### Large List Performance with SwiftData or Core Data
When rendering thousands of records from a persistence layer:
- Use `@FetchRequest` (Core Data) or `@Query` (SwiftData) with a `sortDescriptor` and `predicate` directly on the fetch request rather than fetching all records and filtering in Swift. The persistence framework can optimize the query at the database level; Swift-level filtering operates on already-materialized objects.
- Enable batch fetching. Core Data's `NSFetchRequest.fetchBatchSize = 50` prevents loading all objects into memory. SwiftData's @Query handles batching automatically.
- For lists exceeding 500 visible items with complex cells, profile whether `List` (UITableView backed) outperforms `LazyVStack` (no cell reuse). In testing, `List` typically wins above 200 items. If cells require custom swipe actions and context menus, `List` is the only viable option with reasonable implementation cost.
- Faulting with Core Data: accessing faulted relationships inside a `List` cell triggers synchronous fetches on the main thread per-cell. Prefetch relationships using `NSFetchRequest.relationshipKeyPathsForPrefetching` to batch-load related objects.

### Custom Animations and Matched Geometry Effects
When implementing sophisticated animations:
- `matchedGeometryEffect` requires a `@Namespace` property in the common ancestor view of both the source and destination views. If the views are in separate NavigationStack levels, matched geometry will not work across the navigation boundary -- use `.navigationTransition(.zoom(sourceID:namespace:))` on iOS 17+ instead.
- Never drive animations from `@MainActor`-isolated async functions using `withAnimation` directly. The animation block must execute synchronously on the main thread; triggering it after an `await` point places it outside the animation context. Instead, set a state flag after the await and trigger `withAnimation` in a separate state-change handler.
- For spring animations, use `.spring(duration:bounce:)` (iOS 17+) instead of the deprecated `.spring(response:dampingFraction:)`. The `bounce` parameter (0.0 = no bounce, 1.0 = infinite) is more intuitive than damping fraction calculations.
- Custom `Transition` conformances (implementing `body(content:phase:)`) must be deterministic -- the same phase value must always produce the same visual state. Non-deterministic transitions (depending on time or external state) produce janky animations during interruption.

### SwiftUI Previews Failing in Large Projects
When `#Preview` macros fail or produce incorrect output:
- Previews run in a separate process with a mock environment. They do not have access to the app's `@main` entry point setup, registered dependencies, or singleton initialization. Any ViewModel or service that requires app-startup initialization will crash in preview.
- Solve with a dedicated `PreviewHelper` type that creates pre-populated mock data conforming to the same protocols your production services implement. This doubles as test fixture infrastructure.
- Network-dependent views must use a mock service in previews. Use conditional compilation or a `PreviewNetworkService` mock that returns static fixture data.
- For views that use `@Environment(\.managedObjectContext)` or `@Query`, inject an in-memory store in the preview: `.modelContainer(for: Post.self, inMemory: true)` as a view modifier on the preview.

### Thread Safety with Observation Framework
The @Observable macro (iOS 17+) uses access tracking on the main actor, but has subtle thread-safety edge cases:
- Properties mutated from a background Task without @MainActor isolation are data races even with @Observable. The observation system tracks access on whatever thread the read occurs. Always annotate the ViewModel `@MainActor` as a class-level annotation rather than marking individual properties.
- `Observable` types used across actor boundaries (e.g., passed to a background actor for processing) require `Sendable` conformance. If the type has mutable state, it cannot be Sendable unless it is actor-isolated. Do not pass ViewModels to background actors -- pass value types (structs) instead, update the ViewModel with results.
- When an @Observable type is used inside a `List` with `.refreshable`, the `async` refresh closure captures the ViewModel. Ensure the ViewModel is @MainActor so the mutation after the refresh network call runs on the correct actor.

---

## Example

**Input:** "I'm building a news reader app for iOS 16+. I need a list of articles fetched from an API, a detail view, bookmarking, and I want the architecture to be testable. Team is 3 engineers who know UIKit but are new to SwiftUI."

**Output:**

## SwiftUI Pattern Recommendation: MVVM with NavigationStack + ObservableObject (iOS 16+)

### Context Assessment
- Deployment target: iOS 16 (excludes @Observable macro, requires ObservableObject + Combine)
- App scale: Small team, startup-scale app
- Key constraint: Team is UIKit-experienced but SwiftUI-new -- minimize SwiftUI-specific concepts to one layer at a time
- Navigation: NavigationStack with typed Route enum for deep link support

### Architecture Decision

| Concern | Recommended Pattern | Alternative | Avoid |
|---|---|---|---|
| State (local) | @State | -- | @EnvironmentObject |
| State (shared ViewModel) | @StateObject (owner) / @ObservedObject (child) | -- | @ObservedObject in root view |
| Navigation | NavigationStack + [ArticleRoute] | NavigationSplitView (iPad) | NavigationView |
| Async data | async/await + @MainActor | Combine | DispatchQueue.main.async |
| Dependency injection | Protocol + init injection | -- | Singletons, static globals |
| Bookmarks persistence | @AppStorage (simple) / SwiftData | UserDefaults direct | Core Data (over-engineered here) |

---

### Implementation

#### Supporting Types -- Route Enum and LoadState

```swift
// ArticleRoute.swift
enum ArticleRoute: Hashable {
    case detail(Article)
    case bookmarks
}

// LoadState.swift
enum LoadState<T> {
    case idle
    case loading
    case success(T)
    case failure(Error)

    var value: T? {
        if case .success(let value) = self { return value }
        return nil
    }

    var isLoading: Bool {
        if case .loading = self { return true }
        return false
    }
}
```

#### Service Protocol -- Enables Mock Injection for Tests and Previews

```swift
// ArticleService.swift
protocol ArticleService: Sendable {
    func fetchArticles() async throws -> [Article]
}

struct LiveArticleService: ArticleService {
    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    func fetchArticles() async throws -> [Article] {
        let url = URL(string: "https://api.example.com/articles")!
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse,
              (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode([Article].self, from: data)
    }
}

// MockArticleService.swift (lives in test and preview targets)
struct MockArticleService: ArticleService {
    var articles: [Article] = Article.previewData
    var shouldFail: Bool = false

    func fetchArticles() async throws -> [Article] {
        try await Task.sleep(nanoseconds: 500_000_000) // simulate 0.5s latency
        if shouldFail { throw URLError(.notConnectedToInternet) }
        return articles
    }
}
```

#### Model -- Article

```swift
// Article.swift
struct Article: Identifiable, Hashable, Codable {
    let id: UUID
    let title: String
    let author: String
    let publishedAt: Date
    let summary: String
    let imageURL: URL?
    let sourceURL: URL
}

extension Article {
    static let previewData: [Article] = [
        Article(
            id: UUID(),
            title: "SwiftUI Performance Tips for Production Apps",
            author: "Jane Smith",
            publishedAt: .now.addingTimeInterval(-3600),
            summary: "Learn how to reduce view redraws and improve scroll performance.",
            imageURL: URL(string: "https://example.com/image1.jpg"),
            sourceURL: URL(string: "https://example.com/article1")!
        ),
        Article(
            id: UUID(),
            title: "Structured Concurrency in Swift 5.9",
            author: "Tom Liu",
            publishedAt: .now.addingTimeInterval(-7200),
            summary: "A deep dive into async sequences and actor isolation.",
            imageURL: nil,
            sourceURL: URL(string: "https://example.com/article2")!
        )
    ]
}
```

#### ViewModel -- ArticleListViewModel

```swift
// ArticleListViewModel.swift
@MainActor
final class ArticleListViewModel: ObservableObject {
    @Published private(set) var loadState: LoadState<[Article]> = .idle
    @Published private(set) var bookmarkedIDs: Set<UUID> = []

    private let service: any ArticleService
    private let bookmarkKey = "bookmarked_article_ids"

    init(service: any ArticleService = LiveArticleService()) {
        self.service = service
        loadBookmarks()
    }

    func loadArticles() async {
        loadState = .loading
        do {
            let articles = try await service.fetchArticles()
            loadState = .success(articles)
        } catch {
            loadState = .failure(error)
        }
    }

    func toggleBookmark(for article: Article) {
        if bookmarkedIDs.contains(article.id) {
            bookmarkedIDs.remove(article.id)
        } else {
            bookmarkedIDs.insert(article.id)
        }
        saveBookmarks()
    }

    func isBookmarked(_ article: Article) -> Bool {
        bookmarkedIDs.contains(article.id)
    }

    var bookmarkedArticles: [Article] {
        guard let articles = loadState.value else { return [] }
        return articles.filter { bookmarkedIDs.contains($0.id) }
    }

    private func loadBookmarks() {
        guard let data = UserDefaults.standard.data(forKey: bookmarkKey),
              let ids = try? JSONDecoder().decode(Set<UUID>.self, from: data) else { return }
        bookmarkedIDs = ids
    }

    private func saveBookmarks() {
        guard let data = try? JSONEncoder().encode(bookmarkedIDs) else { return }
        UserDefaults.standard.set(data, forKey: bookmarkKey)
    }
}
```

#### Root App Entry -- NavigationStack with Coordinator Ownership

```swift
// NewsReaderApp.swift
@main
struct NewsReaderApp: App {
    var body: some Scene {
        WindowGroup {
            ArticleCoordinatorView()
        }
    }
}

// ArticleCoordinatorView.swift
struct ArticleCoordinatorView: View {
    @StateObject private var viewModel = ArticleListViewModel()
    @State private var navigationPath: [ArticleRoute] = []

    var body: some View {
        NavigationStack(path: $navigationPath) {
            ArticleListView(viewModel: viewModel, navigationPath: $navigationPath)
                .navigationDestination(for: ArticleRoute.self) { route in
                    switch route {
                    case .detail(let article):
                        ArticleDetailView(
                            article: article,
                            isBookmarked: viewModel.isBookmarked(article),
                            onBookmarkToggle: { viewModel.toggleBookmark(for: article) }
                        )
                    case .bookmarks:
                        BookmarksView(
                            articles: viewModel.bookmarkedArticles,
                            navigationPath: $navigationPath
                        )
                    }
                }
        }
    }
}
```

#### ArticleListView

```swift
// ArticleListView.swift
struct ArticleListView: View {
    @ObservedObject var viewModel: ArticleListViewModel
    @Binding var navigationPath: [ArticleRoute]

    var body: some View {
        Group {
            switch viewModel.loadState {
            case .idle, .loading:
                ProgressView("Loading articles...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

            case .success(let articles):
                articleList(articles)

            case .failure(let error):
                ContentUnavailableView(
                    "Failed to Load",
                    systemImage: "wifi.exclamationmark",
                    description: Text(error.localizedDescription)
                )
                .overlay(alignment: .bottom) {
                    Button("Try Again") {
                        Task { await viewModel.loadArticles() }
                    }
                    .buttonStyle(.borderedProminent)
                    .padding()
                }
            }
        }
        .navigationTitle("News")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    navigationPath.append(.bookmarks)
                } label: {
                    Label("Bookmarks", systemImage: "bookmark")
                }
                .accessibilityIdentifier("bookmarksButton")
            }
        }
        .task {
            // .task cancels automatically when view disappears
            await viewModel.loadArticles()
        }
        .refreshable {
            await viewModel.loadArticles()
        }
    }

    @ViewBuilder
    private func articleList(_ articles: [Article]) -> some View {
        List(articles) { article in
            ArticleRowView(
                article: article,
                isBookmarked: viewModel.isBookmarked(article)
            )
            .contentShape(Rectangle())
            .onTapGesture {
                navigationPath.append(.detail(article))
            }
            .swipeActions(edge: .trailing) {
                Button {
                    viewModel.toggleBookmark(for: article)
                } label: {
                    Label(
                        viewModel.isBookmarked(article) ? "Remove" : "Bookmark",
                        systemImage: viewModel.isBookmarked(article) ? "bookmark.slash" : "bookmark"
                    )
                }
                .tint(viewModel.isBookmarked(article) ? .gray : .orange)
            }
            .accessibilityIdentifier("articleRow_\(article.id)")
        }
        .listStyle(.plain)
        .animation(.default, value: articles)
    }
}
```

#### ArticleRowView -- Reusable Component with ViewModifier

```swift
// ArticleRowView.swift
struct ArticleRowView: View {
    let article: Article
    let isBookmarked: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            articleThumbnail
            VStack(alignment: .leading, spacing: 4) {
                Text(article.title)
                    .font(.headline)
                    .lineLimit(2)
                Text(article.summary)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(3)
                HStack {
                    Text(article.author)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Spacer()
                    if isBookmarked {
                        Image(systemName: "bookmark.fill")
                            .foregroundStyle(.orange)
                            .font(.caption)
                    }
                    Text(article.publishedAt.formatted(.relative(presentation: .named)))
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }
        }
        .padding(.vertical, 4)
    }

    @ViewBuilder
    private var articleThumbnail: some View {
        if let imageURL = article.imageURL {
            AsyncImage(url: imageURL) { phase in
                switch phase {
                case .success(let image):
                    image.resizable()
                         .scaledToFill()
                case .failure:
                    placeholderThumbnail
                case .empty:
                    ProgressView()
                @unknown default:
                    placeholderThumbnail
                }
            }
            .frame(width: 80, height: 80)
            .clipShape(RoundedRectangle(cornerRadius: 8))
        } else {
            placeholderThumbnail
        }
    }

    private var placeholderThumbnail: some View {
        RoundedRectangle(cornerRadius: 8)
            .fill(Color(.secondarySystemBackground))
            .frame(width: 80, height: 80)
            .overlay {
                Image(systemName: "newspaper")
                    .foregroundStyle(.tertiary)
            }
    }
}
```

#### Unit Tests -- ArticleListViewModel

```swift
// ArticleListViewModelTests.swift
import XCTest
@testable import NewsReader

@MainActor
final class ArticleListViewModelTests: XCTestCase {

    func testFetchArticles_success_populatesLoadState() async throws {
        let mockService = MockArticleService(articles: Article.previewData, shouldFail: false)
        let sut = ArticleListViewModel(service: mockService)

        await sut.loadArticles()

        guard case .success(let articles) = sut.loadState else {
            XCTFail("Expected success state, got \(sut.loadState)")
            return
        }
        XCTAssertEqual(articles.count, Article.previewData.count)
    }

    func testFetchArticles_failure_setsErrorState() async {
        let mockService = MockArticleService(shouldFail: true)
        let sut = ArticleListViewModel(service: mockService)

        await sut.loadArticles()

        guard case .failure = sut.loadState else {
            XCTFail("Expected failure state, got \(sut.loadState)")
            return
        }
    }

    func testToggleBookmark_addsAndRemovesID() async {
        let mockService = MockArticleService(articles: Article.previewData)
        let sut = ArticleListViewModel(service: mockService)
        let article = Article.previewData[0]

        sut.toggleBookmark(for: article)
        XCTAssertTrue(sut.isBookmarked(article))

        sut.toggleBookmark(for: article)
        XCTAssertFalse(sut.isBookmarked(article))
    }

    func testBookmarkedArticles_returnsOnlyBookmarkedSubset() async {
        let mockService = MockArticleService(articles: Article.previewData)
        let sut = ArticleListViewModel(service: mockService)
        await sut.loadArticles()

        let target = Article.previewData[0]
        sut.toggleBookmark(for: target)

        XCTAssertEqual(sut.bookmarkedArticles.count, 1)
        XCTAssertEqual(sut.bookmarkedArticles[0].id, target.id)
    }
}
```

#### Previews -- Multiple States

```swift
// ArticleListView+Previews.swift
#Preview("Loaded") {
    ArticleCoordinatorView()
}

#Preview("Loading") {
    let vm = ArticleListViewModel(service: MockArticleService())
    return NavigationStack {
        ArticleListView(
            viewModel: {
                // Force loading state for preview
                let vm = ArticleListViewModel(service: MockArticleService())
                return vm
            }(),
            navigationPath: .constant([])
        )
    }
}

#Preview("Error State") {
    let vm = ArticleListViewModel(service: MockArticleService(shouldFail: true))
    return NavigationStack {
        ArticleListView(viewModel: vm, navigationPath: .constant([]))
    }
    .task { await vm.loadArticles() }
}

#Preview("Empty Bookmarks") {
    NavigationStack {
        BookmarksView(articles: [], navigationPath: .constant([]))
    }
}
```

---

### Trade-off Notes
- **ObservableObject vs @Observable:** This app targets iOS 16, so @Observable is unavailable. When you raise the minimum to iOS 17, migrate ViewModels to the @Observable macro -- it eliminates the need for explicit @Published and reduces unnecessary re-renders because SwiftUI only re-renders views that access specific changed properties, not the entire view tree whenever any @Published property changes.
- **UserDefaults for bookmarks vs SwiftData:** For a small set of UUIDs (typically < 1,000), UserDefaults with JSON encoding is appropriate and adds no dependency. If bookmarks need to store full article content for offline reading, migrate to SwiftData with a `ModelContainer` and `@Query` in the list view.
- **Coordinator in the view tree vs external class:** This implementation keeps the coordinator logic inside `ArticleCoordinatorView` to minimize complexity for a UIKit-background team. For flows with 5+ destinations or complex programmatic navigation needs (push notification navigation, universal links), extract the `navigationPath` and navigation methods into a dedicated `@MainActor` `NavigationCoordinator` class injected as @StateObject.

### Testing Approach
- Unit test all state transitions in `ArticleListViewModel` (load success, load failure, bookmark toggle, bookmark persistence)
- Write `#Preview` configurations for: loading state, error state, empty list, populated list, row with and without bookmark indicator, row with missing image
- XCUITest the critical path: launch -> see article list -> tap article -> bookmark -> navigate to bookmarks -> verify article appears. Use `.accessibilityIdentifier` values as stable selectors.
