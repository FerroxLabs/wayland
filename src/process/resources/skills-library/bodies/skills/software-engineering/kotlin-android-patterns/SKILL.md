---
name: kotlin-android-patterns
description: |
  Guides expert-level kotlin android patterns implementation: kotlin and mobile decision frameworks, production-ready patterns, and concrete templates for kotlin android patterns workflows.
  Use when the user asks about kotlin android patterns, kotlin android patterns configuration, or kotlin best practices for kotlin projects.
  Do NOT use when the user needs a different languages runtimes capability -- check sibling skills in the languages runtimes subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "kotlin mobile frameworks"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Kotlin Android Patterns

## When to Use

**Use this skill when:**
- User asks how to structure a Kotlin Android app using MVVM, MVI, or Clean Architecture and needs guidance on which fits their project size and team
- User wants to implement coroutines and Flow for async operations in an Android ViewModel or Repository layer
- User needs to design a dependency injection setup using Hilt or Koin with Kotlin-specific idioms
- User asks about Kotlin-specific Android patterns such as sealed classes for UI state, extension functions for context helpers, or delegated properties for SharedPreferences
- User wants to migrate an existing Java Android codebase to idiomatic Kotlin incrementally
- User needs production-ready patterns for error handling, offline-first data layers, or lifecycle-aware components in Kotlin
- User is designing a multi-module Android project with Kotlin and needs module boundary definitions and API surface control

**Do NOT use this skill when:**
- User asks about Kotlin Multiplatform Mobile (KMM/KMP) -- that is a distinct architecture concern with its own shared module patterns
- User needs Flutter or React Native guidance -- different technology stack entirely
- User asks about Kotlin backend (Ktor, Spring Boot with Kotlin) -- check backend-specific skills
- User is asking purely about Jetpack Compose layout and theming without architecture context -- check Compose UI skill
- User needs Android performance profiling, memory leak detection, or ANR analysis -- check Android performance skill
- User asks about Android CI/CD pipeline setup (Fastlane, Gradle configuration, signing) -- check Android DevOps skill
- User needs guidance on publishing to the Google Play Store -- check app release management skill

---

## Process

### 1. Assess Project Architecture Fit

Determine which architectural pattern is appropriate before writing any code.

- **MVVM (Model-View-ViewModel):** Default choice for 80%+ of Android projects. Aligns natively with Jetpack ViewModel, LiveData/StateFlow, and Data Binding. Use when the team has 1--5 engineers and the app has moderate complexity.
- **MVI (Model-View-Intent):** Choose when UI state must be completely deterministic and reproducible -- useful for complex multi-step forms, real-time dashboards, or apps with undo/redo requirements. Adds boilerplate; justify before adopting.
- **Clean Architecture layering:** Enforce when the project has 3+ modules, a dedicated QA team, or domain logic that must be testable in isolation. The three layers are: Domain (pure Kotlin, no Android imports), Data (repositories, Room, Retrofit), and Presentation (ViewModels, Fragments/Activities).
- Confirm whether the app is **Compose-first or View-based.** This determines whether you use `StateFlow` collected via `collectAsStateWithLifecycle()` (Compose) or observed via `repeatOnLifecycle` blocks (View system).
- Ask about team size, test coverage expectations, and feature delivery cadence before recommending MVI or full Clean Architecture -- both have meaningful ramp-up cost.

### 2. Define the UI State Model

Every screen must have an explicit, exhaustive UI state representation using Kotlin sealed classes or data classes.

- Use a **sealed class hierarchy** when the screen has mutually exclusive states (Loading, Success, Error, Empty):
  ```kotlin
  sealed class UiState<out T> {
      object Loading : UiState<Nothing>()
      data class Success<T>(val data: T) : UiState<T>()
      data class Error(val message: String, val cause: Throwable? = null) : UiState<Nothing>()
      object Empty : UiState<Nothing>()
  }
  ```
- Use a **data class with multiple fields** when the screen shows partial content alongside loading spinners (e.g., a feed that paginates while existing items are visible):
  ```kotlin
  data class FeedUiState(
      val posts: List<Post> = emptyList(),
      val isLoadingMore: Boolean = false,
      val error: String? = null,
      val isRefreshing: Boolean = false
  )
  ```
- Expose state from ViewModel as `StateFlow`, never `LiveData` in new code (LiveData requires Android framework; StateFlow is testable in pure JVM):
  ```kotlin
  private val _uiState = MutableStateFlow(FeedUiState())
  val uiState: StateFlow<FeedUiState> = _uiState.asStateFlow()
  ```
- For one-shot events (navigation, snackbars) that should not be replayed on re-subscription, use a `Channel<Event>` exposed as a `Flow` via `receiveAsFlow()` -- do NOT use `SharedFlow` with `replay = 0` for events, as it has subtle buffering edge cases.

### 3. Implement the Repository Layer with Coroutines and Flow

The repository is the single source of truth -- it coordinates between remote (Retrofit), local (Room), and in-memory cache.

- Always make repository functions `suspend` for one-shot fetches and return `Flow<T>` for observable data streams:
  ```kotlin
  interface PostRepository {
      fun observePosts(): Flow<List<Post>>
      suspend fun refreshPosts(): Result<Unit>
      suspend fun createPost(content: String): Result<Post>
  }
  ```
- Use Kotlin's `Result<T>` or a custom `sealed class NetworkResult<T>` for operations that can fail. Avoid throwing exceptions across the repository boundary -- callers should not need try/catch:
  ```kotlin
  sealed class NetworkResult<out T> {
      data class Success<T>(val data: T) : NetworkResult<T>()
      data class HttpError(val code: Int, val message: String) : NetworkResult<Nothing>()
      data class NetworkError(val cause: IOException) : NetworkResult<Nothing>()
      object Timeout : NetworkResult<Nothing>()
  }
  ```
- For offline-first: emit from Room first, trigger a network refresh, then let Room emit again when updated. Use `flow { emitAll(roomDao.observe()) }` combined with a `launch` side effect or the `@WorkerThread`-safe `networkBoundResource` pattern.
- Set explicit coroutine dispatchers: use `Dispatchers.IO` for network and disk operations inside repository implementations, not in ViewModels. ViewModels should use `viewModelScope` without specifying a dispatcher, delegating dispatch decisions to the repository.
- Apply `retry` and `catch` operators on flows where the data source can fail transiently:
  ```kotlin
  roomDao.observePosts()
      .catch { emit(emptyList()) }
      .flowOn(Dispatchers.IO)
  ```

### 4. Structure ViewModels with Coroutine Scope Best Practices

The ViewModel is the only component that survives configuration changes -- keep it thin and testable.

- **Never hold references to Activity, Fragment, View, or Context** in a ViewModel. If you need application context, inject `@ApplicationContext Context` via Hilt.
- Launch coroutines in `viewModelScope`. For operations that should survive ViewModel cancellation (e.g., persisting data), use `GlobalScope` only as a last resort and document why. Prefer injecting a `CoroutineScope` tagged with `@ApplicationScope` from Hilt.
- Use `combine` to merge multiple upstream flows into a single UI state object rather than having separate `collectLatest` calls in the Fragment:
  ```kotlin
  val uiState: StateFlow<FeedUiState> = combine(
      repository.observePosts(),
      userPrefs.observeTheme()
  ) { posts, theme ->
      FeedUiState(posts = posts, isDarkMode = theme == Theme.DARK)
  }.stateIn(
      scope = viewModelScope,
      started = SharingStarted.WhileSubscribed(5_000),
      initialValue = FeedUiState()
  )
  ```
- Use `SharingStarted.WhileSubscribed(5_000)` -- the 5-second timeout keeps the upstream flow alive through brief configuration changes without leaking it during extended backgrounding.
- For user actions, expose `fun onEvent(event: FeedEvent)` functions (MVI-style) or specific functions (`fun refresh()`, `fun deletePost(id: Long)`) (MVVM-style). Do not expose the MutableStateFlow or the Channel directly.

### 5. Apply Kotlin-Idiomatic Patterns for Android-Specific Problems

Replace Java-style boilerplate with idiomatic Kotlin constructs throughout the codebase.

- **Extension functions for View setup:** Create extension functions on `View`, `Fragment`, and `Context` in a `extensions/` package. Keep extensions focused and single-purpose:
  ```kotlin
  fun View.show() { visibility = View.VISIBLE }
  fun View.hide() { visibility = View.GONE }
  fun Context.showToast(message: String, duration: Int = Toast.LENGTH_SHORT) =
      Toast.makeText(this, message, duration).show()
  ```
- **Delegated properties for SharedPreferences/DataStore:** Use `ReadWriteProperty` delegates to remove boilerplate:
  ```kotlin
  class StringPreference(private val prefs: SharedPreferences, private val key: String, private val default: String) :
      ReadWriteProperty<Any, String> {
      override fun getValue(thisRef: Any, property: KProperty<*>) = prefs.getString(key, default) ?: default
      override fun setValue(thisRef: Any, property: KProperty<*>, value: String) = prefs.edit().putString(key, value).apply()
  }
  ```
  For new code, prefer DataStore (Proto or Preferences) over SharedPreferences -- it is coroutine-native and crash-safe.
- **Sealed classes for navigation events:** Define navigation as a sealed class and handle it in the Fragment using `repeatOnLifecycle(Lifecycle.State.STARTED)`:
  ```kotlin
  sealed class NavigationEvent {
      data class ToDetail(val postId: Long) : NavigationEvent()
      object ToLogin : NavigationEvent()
      object Back : NavigationEvent()
  }
  ```
- **Object expressions for lightweight callbacks:** Replace anonymous inner classes with SAM conversions and lambda syntax. Kotlin automatically applies SAM conversion for Java interfaces with a single abstract method.
- **Data classes for API models and DB entities:** Always implement `equals`, `hashCode`, and `copy` via data classes. Use `copy()` for state mutations in MVI reducers rather than mutating state directly.

### 6. Set Up Dependency Injection with Hilt

Hilt is the standard DI framework for Android -- it eliminates manual component wiring and integrates with Jetpack lifecycle components.

- Annotate the Application class with `@HiltAndroidApp`. Annotate Activity, Fragment, and ViewModel with `@AndroidEntryPoint` or `@HiltViewModel` respectively.
- Organize Hilt modules by feature and layer:
  - `NetworkModule` -- provides `OkHttpClient`, `Retrofit`, and API service interfaces; install in `SingletonComponent`
  - `DatabaseModule` -- provides Room `Database` and DAO instances; install in `SingletonComponent`
  - `RepositoryModule` -- binds interface to implementation using `@Binds`; install in `SingletonComponent`
  - Feature-scoped modules -- install in `ActivityRetainedComponent` when the dependency should be scoped to ViewModel lifetime
- Use `@Binds` instead of `@Provides` wherever an interface is being bound to a single implementation -- it generates less code and catches mismatches at compile time.
- For testing, replace modules with `@TestInstallIn` and `@UninstallModules` -- never use `lateinit var` injection in production code to work around Hilt wiring.
- Inject `CoroutineDispatchers` as a class (not individual dispatcher references) so tests can substitute `UnconfinedTestDispatcher`:
  ```kotlin
  class AppDispatchers @Inject constructor(
      val io: CoroutineDispatcher = Dispatchers.IO,
      val main: CoroutineDispatcher = Dispatchers.Main,
      val default: CoroutineDispatcher = Dispatchers.Default
  )
  ```

### 7. Write Testable Kotlin Android Code

Testability is an architectural property, not an afterthought. Design for it from the first commit.

- **Unit test ViewModels** with `kotlinx-coroutines-test`. Use `TestScope` and `runTest`. Use `turbine` (the Square library) for asserting on Flow emissions:
  ```kotlin
  @Test
  fun `loading state emitted before posts`() = runTest {
      val viewModel = FeedViewModel(fakeRepository)
      viewModel.uiState.test {
          assertEquals(FeedUiState(isLoading = true), awaitItem())
          assertEquals(FeedUiState(posts = fakePosts), awaitItem())
          cancelAndIgnoreRemainingEvents()
      }
  }
  ```
- Use `MainDispatcherRule` (a JUnit4 TestRule) to set `Dispatchers.Main` to `UnconfinedTestDispatcher` in ViewModel tests -- without this, `viewModelScope` launches will fail on JVM.
- **Test repositories** with fake DAO implementations (not Mockito mocks) that back a `MutableStateFlow<List<T>>`. This verifies actual Flow behavior rather than mock interactions.
- Maintain a **70/20/10 test ratio:** 70% unit tests (ViewModel, Repository, Use Case), 20% integration tests (Room with in-memory database, Retrofit with MockWebServer), 10% UI/instrumentation tests (critical flows only).
- For instrumentation tests, use `HiltAndroidRule` to inject test modules, and `ActivityScenario` with Espresso or Compose test APIs.

### 8. Enforce Code Quality and Conventions

Consistency at scale requires automated enforcement, not verbal agreements.

- Configure **detekt** with a strict ruleset: enable `complexity`, `performance`, `potential-bugs`, and `style` rule sets. Set `maxComplexity = 10` per function and `maxLineLength = 120`.
- Enable **Kotlin compiler strict mode** in `build.gradle.kts`:
  ```kotlin
  tasks.withType<KotlinCompile> {
      kotlinOptions {
          freeCompilerArgs = listOf("-Xjvm-default=all", "-Xopt-in=kotlin.RequiresOptIn")
          jvmTarget = "17"
      }
  }
  ```
- Use **ktlint** for formatting enforcement. Integrate as a Gradle task and fail CI on format violations. Teams should agree on EditorConfig settings once and automate enforcement.
- Enforce **no wildcard imports** (`import android.view.*` is prohibited). Configure in detekt and IDE `.editorconfig`.
- All public API in shared modules must have **KDoc** comments explaining parameters, return values, and thrown exceptions.

---

## Output Format

When responding to a user about Kotlin Android patterns, structure the response as follows:

```
## Architecture Recommendation

### Context Assessment
| Dimension | Project Profile | Recommendation |
|-----------|----------------|----------------|
| Team size | [N engineers] | [pattern choice] |
| App complexity | [Low/Medium/High] | [layer count] |
| Test requirements | [% coverage target] | [test strategy] |
| Offline support | [Yes/No] | [data layer choice] |
| Lifecycle stage | [Greenfield/Migration] | [adoption strategy] |

### Recommended Pattern: [MVVM / MVI / Clean Architecture]
**Rationale:** [2--3 sentences explaining why this fits the described context]

---

## UI State Design

### State Model
[Sealed class or data class definition with explanation of which fields are mutable vs. terminal]

### ViewModel Skeleton
[Complete ViewModel implementation with StateFlow, event handling, and viewModelScope usage]

---

## Repository Layer

### Interface Definition
[Repository interface with suspend functions and Flow signatures]

### Implementation Skeleton
[Concrete implementation showing dispatcher usage, error wrapping, and offline-first pattern if applicable]

---

## Dependency Injection Setup

### Module Structure
[Hilt module definitions for Network, Database, and Repository layers]

---

## Testing Strategy

| Layer | Tool | Pattern | Target Coverage |
|-------|------|---------|----------------|
| ViewModel | kotlinx-coroutines-test + turbine | TestScope + FakeRepository | >80% |
| Repository | Room in-memory + MockWebServer | Integration test | >70% |
| UI | Espresso / Compose Test | Critical path only | Top 3--5 flows |

---

## Migration Notes (if applicable)
[Step-by-step interop guidance if migrating from Java or from an older pattern]

---

## Known Trade-offs
[Explicit documentation of what this approach costs: build time, boilerplate, learning curve, etc.]
```

---

## Rules

1. **Never expose mutable state from a ViewModel.** `MutableStateFlow`, `MutableLiveData`, and `Channel` must be private. The public API is always `StateFlow`, `LiveData` (read-only), or `Flow`. Violations break encapsulation and make state changes untraceable.

2. **Never launch coroutines in Fragment or Activity.** All async operations belong in the ViewModel or Repository. Fragments should only collect from StateFlow/LiveData inside `repeatOnLifecycle(Lifecycle.State.STARTED)` blocks. Collecting in `onCreate` or `onStart` leaks subscriptions during background states.

3. **Never use `GlobalScope` for work that depends on UI or user context.** `GlobalScope` has no lifecycle awareness and will continue executing after the user leaves the screen. Reserve it only for application-level fire-and-forget operations (e.g., analytics flush on app termination) and document every usage.

4. **Always use `repeatOnLifecycle` or `collectAsStateWithLifecycle` -- never `lifecycleScope.launch { flow.collect {} }`.** The latter does not stop collection in the STOPPED state, causing memory leaks and processing work for invisible screens. This is the single most common coroutine mistake in Android Kotlin.

5. **Never use `!!` (the non-null assertion operator) in production code.** Every `!!` is a potential `NullPointerException` waiting to happen. Use `?: return`, `?: throw IllegalStateException(...)`, `let { }`, or require non-null types in the function signature instead. Configure detekt to flag `ForbiddenVoid` and `UnsafeCallOnNullableType`.

6. **Sealed class hierarchies must be exhaustive in `when` expressions.** Always use `when` as an expression (assigned to a variable or returned) rather than a statement, so the compiler enforces exhaustiveness. A `when` statement silently does nothing on unmatched branches.

7. **Repository interfaces must be defined in the domain layer with no Android imports.** The domain layer is pure Kotlin. Any import from `android.*` in a use case or domain model is an architecture violation. Enforce this with module-level dependency constraints in Gradle (`implementation` vs `api` boundaries).

8. **Never share a single Room DAO across multiple repositories.** Each repository owns its DAO. Sharing DAOs creates hidden coupling and makes it impossible to independently test or replace repositories. Define separate DAO interfaces even if they query the same table.

9. **Use `data class` for all UI state objects and enforce immutability.** Never add `var` fields to state data classes. State updates happen exclusively through `copy()` in the ViewModel. If a field seems like it needs to be mutable, it is a sign the state model needs decomposition.

10. **Always provide a `started = SharingStarted.WhileSubscribed(5_000)` parameter to `stateIn`.** Using `SharingStarted.Eagerly` keeps upstream flows (database, network) active even when no subscriber is listening, draining battery. Using `SharingStarted.Lazily` never cancels the upstream. The 5,000ms grace period handles configuration changes without restarting the upstream subscription.

---

## Edge Cases

### Migrating from Java to Kotlin Incrementally

When the codebase is 60%+ Java, do not attempt a bulk migration. Android Studio's "Convert Java File to Kotlin File" produces valid but non-idiomatic code. Use this strategy:

- Enable Kotlin in `build.gradle.kts` and set `kotlinOptions.jvmTarget = "17"` to match Java compatibility.
- Start with new files only -- write all new features in Kotlin. Existing Java files are migrated only when they are being modified for a feature anyway.
- Use `@JvmOverloads` on Kotlin functions with default parameters that are called from Java. Without it, Java callers cannot use default parameters.
- Use `@JvmField` on companion object constants to avoid the synthetic getter indirection that Java callers would otherwise experience.
- Use `@JvmStatic` on companion object functions that Java code calls as static methods.
- Null safety annotations (`@Nullable`, `@NonNull`) on Java code are picked up by Kotlin -- add them to Java APIs that Kotlin code calls to get platform type resolution rather than nullable `!` types.

### Handling ViewModel Shared Between Multiple Fragments

When two Fragments in the same Activity need to share state (e.g., a master-detail layout or a wizard flow):

- Scope the ViewModel to the Activity using `by activityViewModels()` in the Fragment.
- Define a separate `SharedViewModel` that only holds the data shared between screens -- do not bloat a single ViewModel with all screens' logic.
- Be explicit in documentation that this ViewModel is activity-scoped and will not be cleared until the Activity is destroyed.
- For Fragment-to-Fragment communication via NavGraph in Navigation Component, use `by navGraphViewModels(R.id.my_graph)` to scope the ViewModel to the NavGraph lifetime instead of the Activity lifetime. This is preferred because it clears the ViewModel when the user leaves the sub-graph.

### Room Database Schema Migrations

When the Room schema changes between app versions:

- Always increment the `version` parameter in `@Database(version = N)`.
- Write an explicit `Migration(oldVersion, newVersion)` object with the raw SQL `ALTER TABLE`, `CREATE TABLE`, or `DROP TABLE` statements.
- Never rely on `fallbackToDestructiveMigration()` in production -- it wipes user data. Use it only in debug builds via `if (BuildConfig.DEBUG)` branching.
- Test migrations using `MigrationTestHelper` from the `room-testing` artifact -- run it against the exported schema JSON files that Room generates at compile time.
- For complex migrations (splitting a column, changing a type), export the full table, create the new table, insert from the old, drop the old, and rename -- do not attempt multi-step `ALTER TABLE` which SQLite does not fully support.

### Coroutine Exception Handling in Production

Unhandled exceptions in coroutines behave differently from exceptions on the main thread:

- A `launch` coroutine that throws an uncaught exception crashes the app silently in some configurations. Always attach a `CoroutineExceptionHandler` to the scope or catch at the call site.
- In `viewModelScope`, uncaught exceptions from `launch` propagate to the CoroutineExceptionHandler installed on the scope. Install one and log or report to a crash analytics service.
- `async`/`await` does NOT propagate exceptions until `await()` is called. Always call `await()` inside a try-catch or use `runCatching { deferred.await() }`.
- `supervisorScope` vs `coroutineScope`: use `supervisorScope` when child failures should not cancel siblings (e.g., parallel independent network calls). Use `coroutineScope` when all children are part of a single atomic operation.
- In Flow, `catch` only catches exceptions upstream of the operator -- it does not catch exceptions in `onEach` or terminal operators. Place `catch` before `onEach` when you need to handle errors and still emit fallback values.

### Multi-Module Project Dependency Management

In projects with 10+ modules, dependency graphs become complex and build times suffer:

- Define a `buildSrc` or `build-logic` convention plugin module that centralizes Kotlin version, JVM target, and detekt configuration. Each module applies the convention plugin rather than duplicating configuration.
- Use `api` vs `implementation` in module dependencies deliberately. `api` exposes the dependency's types to downstream consumers; `implementation` hides them. Prefer `implementation` -- `api` dependencies increase compilation coupling.
- Create a `:core:model` module for data classes shared across features. This module must have zero Android dependencies.
- Create a `:core:testing` module for shared fakes, test rules (`MainDispatcherRule`), and test utilities. Feature modules add this as `testImplementation`.
- Use Gradle's `includeBuild` for local composite builds when developing across multiple repositories simultaneously, avoiding SNAPSHOT publish cycles.

### StateFlow vs SharedFlow: Choosing Correctly

This is a frequently misunderstood distinction with real production impact:

- Use `StateFlow` for **UI state** -- it always has a current value, replays the latest value to new subscribers, and is perfect for screen state (FeedUiState, ProfileUiState).
- Use `SharedFlow` with `replay = 0` cautiously for **events** -- but be aware that if no collector is active when the event is emitted, the event is lost. Buffer with `extraBufferCapacity = 1` and `onBufferOverflow = DROP_OLDEST` for fire-and-forget events.
- The recommended pattern for one-shot events (snackbars, navigation) is `Channel(BUFFERED)` exposed as `receiveAsFlow()` -- this guarantees delivery and queue semantics without the replay confusion of SharedFlow.
- Do not convert a `Channel` to `SharedFlow` via `shareIn` for event delivery -- this reintroduces the replay ambiguity you were trying to avoid.

### Proguard/R8 Rules for Kotlin-Specific Patterns

When minification is enabled, Kotlin-specific constructs can be stripped or renamed in ways that break runtime behavior:

- Data classes used with reflection (Gson, Moshi without codegen) need `@Keep` or Proguard rules to preserve field names. Prefer Moshi with KSP codegen or kotlinx.serialization -- both generate explicit adapters that survive minification without reflection.
- Sealed class subclasses accessed via `when` expressions are safe -- the compiler replaces them with integer comparisons. But sealed classes used with `Class.forName()` or serialization libraries' reflection mode will break without keep rules.
- `object` declarations (singletons) are referenced by their generated `INSTANCE` field. If a library accesses this via reflection, add `-keep class com.example.MyObject { public static final com.example.MyObject INSTANCE; }`.
- Always run `./gradlew bundleRelease` and test the release build against your test suite before shipping. Many minification bugs are only caught at release build time.

---

## Example

**Input:** "I'm building a news reader app in Kotlin. I have a team of 4 engineers. We need offline support, the ability to bookmark articles, and a search feature. We're greenfield, deploying to Android API 24+. What patterns should we use?"

**Output:**

## Architecture Recommendation

### Context Assessment

| Dimension | Project Profile | Recommendation |
|-----------|----------------|----------------|
| Team size | 4 engineers | MVVM -- lower boilerplate than MVI, sufficient for this scope |
| App complexity | Medium (3 core features) | 3-layer Clean Architecture with feature modules |
| Test requirements | Standard production | 70% unit, 20% integration, 10% UI |
| Offline support | Required | Room + Retrofit + offline-first Repository pattern |
| Lifecycle stage | Greenfield | Start strict -- enforce patterns from commit 1 |

### Recommended Pattern: MVVM with Clean Architecture Layers

**Rationale:** With 4 engineers and 3 well-defined features (feed, bookmarks, search), MVVM provides the right balance of structure and velocity. Clean Architecture layering enables independent testing of business logic and makes the search feature independently developable without coupling to the offline/bookmark logic. MVI would add reducer complexity that is not justified by the determinism requirements here.

---

## Module Structure

```
:app                          -- Application class, NavGraph, Hilt setup
:feature:feed                 -- FeedFragment, FeedViewModel
:feature:bookmarks            -- BookmarksFragment, BookmarksViewModel
:feature:search               -- SearchFragment, SearchViewModel
:core:model                   -- Article.kt, Bookmark.kt (pure Kotlin data classes)
:core:data                    -- Repository implementations, Room DB, Retrofit services
:core:domain                  -- Use cases: GetFeedUseCase, BookmarkArticleUseCase, SearchArticlesUseCase
:core:common                  -- Extension functions, dispatchers, Result wrappers
:core:testing                 -- FakeArticleRepository, MainDispatcherRule, factory functions
```

---

## UI State Design

### State Model for Feed Screen

```kotlin
// :core:model
data class Article(
    val id: Long,
    val title: String,
    val summary: String,
    val imageUrl: String?,
    val publishedAt: Instant,
    val sourceUrl: String,
    val isBookmarked: Boolean = false
)

// :feature:feed
data class FeedUiState(
    val articles: List<Article> = emptyList(),
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val error: String? = null
)

sealed class FeedEvent {
    object RefreshRequested : FeedEvent()
    data class ArticleTapped(val articleId: Long) : FeedEvent()
    data class BookmarkToggled(val articleId: Long, val isCurrentlyBookmarked: Boolean) : FeedEvent()
}

sealed class FeedNavigationEvent {
    data class ToArticleDetail(val articleId: Long, val sourceUrl: String) : FeedNavigationEvent()
}
```

### ViewModel Implementation

```kotlin
@HiltViewModel
class FeedViewModel @Inject constructor(
    private val getFeed: GetFeedUseCase,
    private val bookmarkArticle: BookmarkArticleUseCase,
    private val dispatchers: AppDispatchers
) : ViewModel() {

    private val _uiState = MutableStateFlow(FeedUiState(isLoading = true))
    val uiState: StateFlow<FeedUiState> = _uiState.asStateFlow()

    private val _navigationEvents = Channel<FeedNavigationEvent>(Channel.BUFFERED)
    val navigationEvents: Flow<FeedNavigationEvent> = _navigationEvents.receiveAsFlow()

    init {
        observeFeed()
    }

    private fun observeFeed() {
        getFeed()
            .onEach { articles ->
                _uiState.update { it.copy(articles = articles, isLoading = false, error = null) }
            }
            .catch { throwable ->
                _uiState.update { it.copy(isLoading = false, error = throwable.message ?: "Unknown error") }
            }
            .launchIn(viewModelScope)
    }

    fun onEvent(event: FeedEvent) {
        when (event) {
            is FeedEvent.RefreshRequested -> refresh()
            is FeedEvent.ArticleTapped -> navigateToDetail(event.articleId)
            is FeedEvent.BookmarkToggled -> toggleBookmark(event.articleId, event.isCurrentlyBookmarked)
        }
    }

    private fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isRefreshing = true) }
            getFeed.refresh().onFailure { error ->
                _uiState.update { it.copy(isRefreshing = false, error = error.message) }
            }
            _uiState.update { it.copy(isRefreshing = false) }
        }
    }

    private fun toggleBookmark(articleId: Long, isCurrentlyBookmarked: Boolean) {
        viewModelScope.launch {
            bookmarkArticle(articleId = articleId, bookmark = !isCurrentlyBookmarked)
        }
    }

    private fun navigateToDetail(articleId: Long) {
        val article = _uiState.value.articles.firstOrNull { it.id == articleId } ?: return
        viewModelScope.launch {
            _navigationEvents.send(FeedNavigationEvent.ToArticleDetail(articleId, article.sourceUrl))
        }
    }
}
```

---

## Repository Layer

### Interface (in :core:domain)

```kotlin
interface ArticleRepository {
    fun observeArticles(): Flow<List<Article>>
    suspend fun refreshArticles(): Result<Unit>
    suspend fun setBookmark(articleId: Long, bookmarked: Boolean): Result<Unit>
    fun observeBookmarkedArticles(): Flow<List<Article>>
    fun searchArticles(query: String): Flow<List<Article>>
}
```

### Implementation (in :core:data)

```kotlin
class ArticleRepositoryImpl @Inject constructor(
    private val articleDao: ArticleDao,
    private val newsApi: NewsApiService,
    private val dispatchers: AppDispatchers
) : ArticleRepository {

    override fun observeArticles(): Flow<List<Article>> =
        articleDao.observeAll()
            .map { entities -> entities.map { it.toDomainModel() } }
            .flowOn(dispatchers.io)

    override suspend fun refreshArticles(): Result<Unit> = withContext(dispatchers.io) {
        runCatching {
            val response = newsApi.getTopHeadlines()
            articleDao.upsertAll(response.articles.map { it.toEntity() })
        }
    }

    override suspend fun setBookmark(articleId: Long, bookmarked: Boolean): Result<Unit> =
        withContext(dispatchers.io) {
            runCatching {
                articleDao.setBookmark(articleId, bookmarked)
            }
        }

    override fun observeBookmarkedArticles(): Flow<List<Article>> =
        articleDao.observeBookmarked()
            .map { entities -> entities.map { it.toDomainModel() } }
            .flowOn(dispatchers.io)

    override fun searchArticles(query: String): Flow<List<Article>> =
        articleDao.search("%$query%")
            .map { entities -> entities.map { it.toDomainModel() } }
            .flowOn(dispatchers.io)
}
```

---

## Dependency Injection Setup

```kotlin
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    @Singleton
    abstract fun bindArticleRepository(impl: ArticleRepositoryImpl): ArticleRepository
}

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
                    else HttpLoggingInterceptor.Level.NONE
        })
        .build()

    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient): Retrofit = Retrofit.Builder()
        .baseUrl("https://newsapi.example.com/v2/")
        .client(client)
        .addConverterFactory(Json.asConverterFactory("application/json".toMediaType()))
        .build()

    @Provides
    @Singleton
    fun provideNewsApiService(retrofit: Retrofit): NewsApiService =
        retrofit.create(NewsApiService::class.java)
}

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(context, AppDatabase::class.java, "news_reader.db")
            .addMigrations(MIGRATION_1_2)
            .build()

    @Provides
    fun provideArticleDao(db: AppDatabase): ArticleDao = db.articleDao()
}
```

---

## Testing Strategy

| Layer | Tool | Pattern | Target |
|-------|------|---------|--------|
| FeedViewModel | kotlinx-coroutines-test 1.7+, turbine | `runTest` + `FakeArticleRepository` | >85% |
| ArticleRepositoryImpl | Room in-memory DB, MockWebServer | Full integration -- no mocks | >75% |
| GetFeedUseCase | Pure JUnit5 | Input/output assertion | 100% |
| FeedFragment | Compose Test or Espresso | Critical path: load, bookmark, navigate | Top 3 flows |

**ViewModel test example:**

```kotlin
@OptIn(ExperimentalCoroutinesApi::class)
class FeedViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var fakeRepository: FakeArticleRepository
    private lateinit var viewModel: FeedViewModel

    @Before
    fun setup() {
        fakeRepository = FakeArticleRepository()
        viewModel = FeedViewModel(
            getFeed = GetFeedUseCase(fakeRepository),
            bookmarkArticle = BookmarkArticleUseCase(fakeRepository),
            dispatchers = TestAppDispatchers()
        )
    }

    @Test
    fun `uiState emits articles when repository emits`() = runTest {
        val articles = listOf(Article(id = 1L, title = "Test Article", ...))
        fakeRepository.emitArticles(articles)

        viewModel.uiState.test {
            val initial = awaitItem()
            assertTrue(initial.isLoading)

            val loaded = awaitItem()
            assertEquals(articles, loaded.articles)
            assertFalse(loaded.isLoading)

            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `error state set when refresh fails`() = runTest {
        fakeRepository.setRefreshError(IOException("Network unavailable"))

        viewModel.onEvent(FeedEvent.RefreshRequested)

        viewModel.uiState.test {
            val errorState = expectMostRecentItem()
            assertNotNull(errorState.error)
            assertFalse(errorState.isRefreshing)
        }
    }
}
```

---

## Known Trade-offs

- **3-layer Clean Architecture with feature modules adds ~20--30% more files** than a flat MVVM structure. This is justified for a 4-engineer team because it enables parallel feature development without merge conflicts.
- **Channel-based navigation events** require the Fragment to be resumed before collecting. If a navigation event fires before the Fragment is in STARTED state (rare but possible during rapid user interaction), it will queue in the Channel buffer and deliver when collection resumes -- verify this behavior in low-end device testing.
- **Room + Retrofit offline-first** increases complexity of the data layer compared to a pure network-only approach. The tradeoff is acceptable here because offline support is a stated requirement.
- **Hilt increases build time** by approximately 15--25% compared to no DI framework on large projects due to annotation processing. This is offset by removing manual factory boilerplate and enabling proper test substitution.
