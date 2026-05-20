---
name: android-compose-patterns
description: |
  Guides expert-level android compose patterns implementation: kotlin and frameworks decision frameworks, production-ready patterns, and concrete templates for android compose patterns workflows.
  Use when the user asks about android compose patterns, android compose patterns configuration, or mobile best practices for android projects.
  Do NOT use when the user needs a different mobile development capability -- check sibling skills in the mobile development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile kotlin design-patterns"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Android Compose Patterns

## When to Use

**Use this skill when:**
- User is building a new Android screen or feature using Jetpack Compose and needs guidance on structuring composables, state management, or data flow
- User asks how to handle side effects, recomposition control, or state hoisting in Compose
- User wants to implement a specific UI pattern (bottom sheets, lazy lists, navigation, theming) using Compose best practices
- User is migrating an existing View-based Android screen to Compose and needs an incremental interop strategy
- User asks about performance optimization in Compose -- understanding when recomposition happens, how to use `remember`, `derivedStateOf`, or `stable` annotations
- User wants to implement a production-grade MVVM or MVI architecture layered with Compose
- User asks about testing Compose UI, including semantics trees, `ComposeTestRule`, or screenshot testing

**Do NOT use this skill when:**
- User is building a Flutter or React Native application -- check the cross-platform mobile skills
- User is asking about Android View system (XML layouts, RecyclerView, ViewBinding) without Compose involvement
- User needs Kotlin coroutines or Flow fundamentals that are not Compose-specific -- use the Kotlin concurrency skill
- User is asking about app distribution, signing, or Play Store submission -- use the Android deployment skill
- User needs general Kotlin language patterns not tied to Compose -- use the Kotlin patterns skill
- User is working on an iOS application -- check the SwiftUI or UIKit skills
- User is asking about backend API design that the Compose app will consume -- use the appropriate API design skill
- User needs Android-specific non-UI topics (WorkManager, notifications, sensors) not involving Compose UI -- check the Android platform skill

---

## Process

### 1. Establish the Compose Architecture Tier

Before writing a single composable, identify which architectural pattern fits the project:

- **MVVM with StateFlow:** Best default for most teams. `ViewModel` exposes `StateFlow<UiState>` or multiple `StateFlow` properties. Composables collect state using `collectAsStateWithLifecycle()` from `androidx.lifecycle:lifecycle-runtime-compose`. Use this when the team is already familiar with Android ViewModel and wants minimal conceptual overhead.
- **MVI (Model-View-Intent):** Use when screens have high interaction complexity -- multiple concurrent user actions that can conflict, complex optimistic UI, or undo/redo flows. The ViewModel exposes a single `StateFlow<UiState>` and accepts `UiIntent` sealed classes via a `processIntent(intent: UiIntent)` function.
- **Unidirectional Data Flow (UDF) without ViewModel:** Suitable for small, isolated, self-contained composable components (color pickers, animated counters) that are embedded in a larger screen. State is owned by the parent and passed down -- pure state hoisting.
- Reject "ViewModel per composable" anti-pattern. ViewModels should correspond to screens or logical feature units, not individual UI widgets.
- Confirm early whether `Hilt` is the DI framework (standard for new Android projects). `hiltViewModel()` provides scope-correct ViewModel injection directly in composable functions.

### 2. Define the UiState Contract

The `UiState` data class is the central contract between ViewModel and UI:

- Model `UiState` as a sealed class or a flat data class with nullable/optional fields depending on complexity. For simple screens, a flat data class is preferable. For screens with fundamentally different modes (loading, content, error), use a sealed class.
- Include a `isLoading: Boolean` field for loading overlays rather than a separate state variant when the screen can show content and loading simultaneously (e.g., pull-to-refresh over existing content).
- Separate `UiState` (rendered snapshot of the screen) from `UiEffect` (one-shot events like navigation, snackbars, toasts). Effects are delivered via `Channel<UiEffect>` consumed as `Flow` with `consumeAsFlow()`, never via `StateFlow` (which would replay the event on recomposition).
- Use `@Immutable` or `@Stable` annotations on `UiState` data classes to inform the Compose compiler that the class is safe to skip recomposition if reference equality holds. Only apply `@Stable` when you can guarantee the contract -- mutable classes annotated `@Stable` cause silent recomposition bugs.
- Include `errorMessage: String?` as a nullable field. Map domain exceptions to user-readable strings in the ViewModel, never in composables.

### 3. Design the Composable Hierarchy

Structure composables in three tiers to maximize reusability and testability:

- **Screen composable** (e.g., `ProfileScreen`): Connects to the ViewModel. Calls `hiltViewModel()` or receives an injected ViewModel. Collects `uiState` and `uiEffects`. Passes data and callbacks down. This composable is NOT unit-testable in isolation -- it requires a full Hilt test component.
- **Content composable** (e.g., `ProfileContent`): Stateless, receives `uiState: ProfileUiState` and lambdas for all actions. This IS unit-testable with `ComposeTestRule` because it has no ViewModel dependency. The screen composable delegates to this composable.
- **Atomic/reusable composables** (e.g., `AvatarWithBadge`, `EditableTextField`): Pure UI components with no business logic. Accept primitive types or simple data classes. Live in a shared `designsystem` or `ui-components` module.

Key design rules for the hierarchy:
- Never call `hiltViewModel()` or any DI accessor inside a non-screen composable.
- Prefer passing lambdas typed as `() -> Unit` or `(T) -> Unit` over passing the full ViewModel reference down the tree.
- Limit composable function parameters to 7 or fewer. If a composable needs more, introduce a state class or split the composable.
- Use `@Preview` annotations on the Content composable (not the Screen composable) with `@PreviewParameter` for multiple state variations.

### 4. Apply State Hoisting and `remember` Correctly

State hoisting and memoization are the two most commonly misused Compose concepts:

- **State hoisting rule:** Lift state to the lowest common ancestor that needs it. If only one composable reads and writes a piece of state, keep it local. If two sibling composables need the same state, hoist to their parent. If the ViewModel needs to act on it, hoist all the way to the ViewModel.
- Use `remember { mutableStateOf(...) }` for purely transient UI state: text field focus, dropdown expanded, animation trigger. This state should NOT survive process death and does NOT belong in the ViewModel.
- Use `rememberSaveable { mutableStateOf(...) }` for UI state that should survive configuration changes but not business-level persistence. Examples: scroll position in a tab that the user might rotate the device on, whether a filter panel is expanded.
- Use `derivedStateOf { }` only when a computed value depends on another observable state and the computation is relatively expensive or the derived state changes less frequently than the source state. A canonical example: `val showScrollToTop by remember { derivedStateOf { listState.firstVisibleItemIndex > 5 } }`. Do NOT wrap every computation in `derivedStateOf` -- it adds overhead for simple transformations.
- Use `remember(key1, key2) { ... }` with explicit keys when cached objects must be invalidated on key change. Omitting keys when they are relevant is a subtle bug that produces stale data.
- Never store `Context`, `View`, or `Lifecycle` references inside `remember` blocks -- these create memory leaks. Use `LocalContext.current` and `LocalLifecycleOwner.current` as CompositionLocals instead.

### 5. Handle Side Effects with the Correct Effect API

Compose provides four primary side-effect APIs -- choosing the wrong one causes bugs ranging from infinite loops to missed events:

- **`LaunchedEffect(key)`:** Launch a coroutine tied to composition. Relaunches when `key` changes. Use for: triggering one-shot async work when entering a screen (`LaunchedEffect(Unit)`), responding to state changes that require async work, starting animations keyed to data.
- **`SideEffect`:** Runs on every successful recomposition. Use only for synchronizing Compose state to non-Compose objects (e.g., updating an analytics tracker with the current screen name, updating a `SupportActionBar` title). Almost always overused -- most use cases belong in `LaunchedEffect`.
- **`DisposableEffect(key)`:** Use when you need a cleanup callback on key change or departure from composition. Canonical use case: registering and unregistering a `BroadcastReceiver`, a `LifecycleObserver`, or a sensor listener within a composable.
- **`rememberCoroutineScope()`:** Obtain a scope tied to the composable's lifetime for launching coroutines in response to user events (button clicks). Do NOT use `GlobalScope` or `lifecycleScope` directly inside composables.
- Effect key selection: Use `Unit` as the key only when you want the effect to run exactly once per composition entry. Use state variables as keys when the effect should restart when that variable changes. Never use rapidly-changing values (millisecond timestamps, incrementing counters) as keys -- this causes continuous restart loops.

### 6. Optimize Recomposition

Uncontrolled recomposition is the most common Compose performance problem in production:

- Enable the Layout Inspector's recomposition counter in Android Studio (Flamingo or later) to identify hot composables that recompose unexpectedly.
- Identify recomposition scope boundaries. Compose restarts recomposition at the nearest enclosing composable that reads the changed state. Design composables to minimize the scope that reads frequently-changing state. Extract the frequently-updating part into its own composable.
- Use `key(id) { ItemComposable(...) }` in `LazyColumn` and `LazyRow` to give Compose stable identity for list items. Without keys, Compose reuses item slots by position, causing incorrect animation and focus behavior when items are inserted or removed.
- Mark lambdas passed to child composables with `remember` when they capture frequently-changing state: `val onItemClick = remember(viewModel) { { id: Int -> viewModel.selectItem(id) } }`. Inline lambdas create new instances on every recomposition of the parent, causing all children to recompose even if their data is unchanged.
- Apply `@Stable` to domain model classes that flow through the UI layer only when they genuinely satisfy the stability contract: equals returns true when no public property has changed. Kotlin data classes with all-val primitive or `@Immutable` properties are automatically inferred as stable by the Compose compiler.
- Use the Compose Compiler Metrics (enable via Gradle flag `freeCompilerArgs += ["-P", "plugin:androidx.compose.compiler.plugins.kotlin:reportsDestination=..."]`) to identify unstable classes and skippable vs. non-skippable composables. Address the top 5 offenders before shipping.
- Avoid reading `State` objects in the composition phase when they are only needed in layout or draw phases. Use `Modifier.graphicsLayer { ... }` or `Modifier.drawWithContent { ... }` with lambda-based state reads to confine state reads to the draw phase, bypassing recomposition entirely for animation-driven properties.

### 7. Implement Navigation with Type Safety

Compose Navigation requires deliberate structure to remain maintainable at scale:

- Use `androidx.navigation:navigation-compose` as the primary navigation library. For type-safe routes, use `androidx.navigation:navigation-compose` version 2.8.0+ which supports Kotlin Serializable objects as route types, replacing the fragile string-based route approach.
- Define a sealed class or object hierarchy for routes in a dedicated `navigation` package. Each route object is annotated with `@Serializable`. Route objects carry only primitive, serializable arguments -- never pass complex objects through navigation arguments.
- Structure the `NavGraph` using nested graphs for feature isolation. Each feature module owns its own `NavGraphBuilder` extension function (e.g., `fun NavGraphBuilder.profileGraph(navController: NavController)`). The app module assembles these in the root `NavHost`.
- Pass `NavController` only to screen-level composables. Never pass `NavController` into reusable UI components. Instead, pass a `() -> Unit` lambda named after the navigation action (e.g., `onNavigateToProfile: () -> Unit`).
- Handle deep links by registering `deepLinks = listOf(navDeepLink { uriPattern = "..." })` at the route level. Test deep links with `adb shell am start -a android.intent.action.VIEW -d "yourscheme://..."`.
- Use `SavedStateHandle` in the ViewModel to retrieve navigation arguments -- this makes the ViewModel independently testable without a NavController dependency.

### 8. Apply Theming and Design System Patterns

- Use `MaterialTheme` as the foundation. Extend it using `CompositionLocalProvider` with custom `CompositionLocal` values for brand-specific tokens not covered by Material (e.g., custom spacing scales, elevation ramps, motion tokens).
- Define a `AppTheme` composable wrapping `MaterialTheme` that maps your brand's color palette to `ColorScheme`. Use `dynamicColorScheme()` on Android 12+ with a fallback to the static brand scheme for earlier API levels.
- Create a `Spacing` object with named properties (`xs = 4.dp`, `sm = 8.dp`, `md = 16.dp`, `lg = 24.dp`, `xl = 32.dp`, `xxl = 48.dp`) and expose it via `val LocalSpacing = staticCompositionLocalOf { Spacing() }`. Access via `MaterialTheme.spacing.md` by adding an extension property on `MaterialTheme`.
- Never hardcode `dp`, `sp`, or `Color` values in individual composables. Every visual value must trace to a design token.
- Use `TextStyle` from `MaterialTheme.typography` for all text rendering. Define a full `Typography` object using the M3 type scale (Display, Headline, Title, Body, Label at Large/Medium/Small variants).

---

## Output Format

When responding to a user request about Compose patterns, structure output as follows:

```
## Compose Pattern: [Pattern Name]

### Context & Applicability
- Applies when: [specific scenario]
- Avoid when: [specific counter-scenario]
- Complexity: [Low / Medium / High]

### UiState Definition
```kotlin
// Annotate for Compose compiler stability inference
@Immutable
data class [Screen]UiState(
    val isLoading: Boolean = false,
    val [dataField]: [Type] = [default],
    val errorMessage: String? = null
)

sealed class [Screen]UiEffect {
    data class NavigateTo(val route: [RouteType]) : [Screen]UiEffect()
    data class ShowSnackbar(val message: String) : [Screen]UiEffect()
}
```

### ViewModel Structure
```kotlin
@HiltViewModel
class [Screen]ViewModel @Inject constructor(
    private val [dependency]: [DependencyType],
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow([Screen]UiState())
    val uiState: StateFlow<[Screen]UiState> = _uiState.asStateFlow()

    private val _uiEffect = Channel<[Screen]UiEffect>(Channel.BUFFERED)
    val uiEffect: Flow<[Screen]UiEffect> = _uiEffect.receiveAsFlow()

    fun onEvent(event: [Screen]Event) { /* ... */ }
}
```

### Screen Composable
```kotlin
@Composable
fun [Screen]Screen(
    viewModel: [Screen]ViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        viewModel.uiEffect.collect { effect ->
            when (effect) {
                is [Screen]UiEffect.NavigateTo -> { /* handle */ }
                is [Screen]UiEffect.ShowSnackbar -> { /* handle */ }
            }
        }
    }

    [Screen]Content(
        uiState = uiState,
        onEvent = viewModel::onEvent
    )
}
```

### Content Composable (Testable)
```kotlin
@Composable
fun [Screen]Content(
    uiState: [Screen]UiState,
    onEvent: ([Screen]Event) -> Unit,
    modifier: Modifier = Modifier
) {
    // Pure UI -- no ViewModel, no DI
}
```

### Recomposition Risk Assessment
| Composable | State Read Frequency | Optimization Applied |
|------------|---------------------|----------------------|
| [Name] | [High/Medium/Low] | [technique] |

### Test Coverage Targets
| Layer | Test Type | Tool |
|-------|-----------|------|
| ViewModel | Unit | JUnit5 + Turbine |
| Content composable | Compose UI test | ComposeTestRule |
| Screen composable | Integration | Hilt test + ComposeTestRule |
| Navigation flow | E2E | UiAutomator / Espresso |

### Known Trade-offs
- [trade-off description and mitigation]
```

---

## Rules

1. **Never hoist state higher than necessary.** Hoisting `TextField` value into the ViewModel when only one composable uses it adds unnecessary ViewModel complexity and causes every ViewModel state observer to recompose on each keystroke. Keep transient UI state local.

2. **Never pass lambdas to deeply nested composables without `remember` stabilization.** A non-remembered lambda captured from a recomposing scope creates a new instance on every parent recomposition. Use `remember(viewModel) { { param -> viewModel.action(param) } }` or reference bound method references directly.

3. **Never use `@Stable` or `@Immutable` on classes you do not control.** Annotating third-party or domain model classes from outside your module lies to the Compose compiler and produces hard-to-diagnose stale UI bugs. Instead, create dedicated UI model classes in the `ui` layer.

4. **Always use `collectAsStateWithLifecycle()` instead of `collectAsState()` for StateFlow in screen composables.** `collectAsState()` continues collecting when the app is backgrounded, wasting CPU and battery. `collectAsStateWithLifecycle()` from `lifecycle-runtime-compose` automatically pauses collection when the lifecycle drops below `STARTED`.

5. **Never deliver one-shot events (navigation, toasts, dialogs) via `StateFlow`.** `StateFlow` replays the last value on new collectors, causing navigation events to re-fire after configuration changes. Use `Channel(Channel.BUFFERED).receiveAsFlow()` for events that should be consumed exactly once.

6. **Never call `remember` without keys when the remembered object depends on a parameter.** `remember { expensiveComputation(userId) }` will return a stale result when `userId` changes because the key is omitted. Always write `remember(userId) { expensiveComputation(userId) }`.

7. **Never read `State` inside `Modifier.padding()`, `Modifier.size()`, or layout modifiers when the value changes at high frequency (e.g., driven by animation or gesture).** Layout-phase state reads trigger relayout on every change. Move such reads to `Modifier.graphicsLayer { }` or `Modifier.offset { }` (the lambda variant) which execute in the draw phase without triggering recomposition or relayout.

8. **Always provide `contentDescription` for interactive composable elements.** Any `Image`, `Icon`, `Button`, or custom clickable composable must have a non-null `contentDescription` for accessibility. Use `contentDescription = null` only for purely decorative elements -- document the reason in a comment.

9. **Never use `GlobalScope`, `lifecycleScope`, or `MainScope` inside composable functions.** Use `rememberCoroutineScope()` for event-driven coroutines inside composables, or launch from the ViewModel using `viewModelScope`. External scopes leak the composable or attach to the wrong lifecycle.

10. **Always run Compose Compiler Metrics on CI before releasing a new screen.** The metrics report identifies which composables are skippable, which parameters are unstable, and which classes trigger unnecessary recomposition. Set a threshold: no screen composable tree should have more than 20% non-skippable composables without documented justification.

---

## Edge Cases

### Migrating an Existing Fragment to Compose Incrementally
When adding Compose to a screen backed by a `Fragment`, use `ComposeView` inside the Fragment's `onCreateView`. Set the `ViewCompositionStrategy` to `ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed` to align the Compose lifecycle with the Fragment view lifecycle (not the Fragment lifecycle itself -- using the wrong strategy causes double-subscription bugs with `collectAsStateWithLifecycle`). The Fragment ViewModel is shared using `viewModels()` and passed into the `ComposeView` content lambda. Do not create a second ViewModel for the Compose content -- maintain a single source of truth.

### LazyColumn with Heterogeneous Item Types
When `LazyColumn` renders multiple item types (headers, regular items, ads, loading indicators), define a sealed class for list item types and use `LazyListScope.items(items, key = { it.stableId }, contentType = { it.contentType })`. The `contentType` parameter allows Compose to recycle composition nodes across items of the same type, significantly improving scroll performance. Without `contentType`, Compose treats every item slot as potentially different and performs full recomposition on scroll. Expected performance improvement: 20-40% reduction in frame time for heterogeneous lists longer than 50 items.

### State Restoration After Process Death
`rememberSaveable` using default `Saver` handles primitive types and `Parcelable` classes automatically. For non-`Parcelable` state (e.g., a complex filter configuration represented as a Kotlin data class), implement a custom `Saver` using `mapSaver` or `listSaver`. If the state object is too large for the Bundle (limit is approximately 500KB -- exceeding this causes `TransactionTooLargeException`), store the state in the ViewModel's `SavedStateHandle` instead, which uses the same Bundle mechanism but with automatic key namespacing. Never store bitmaps, large lists, or network responses in `rememberSaveable`.

### Shared Element Transitions Between Screens
Compose 1.7+ (in `androidx.compose.animation`) introduces the `SharedTransitionLayout` and `SharedTransitionScope` API. Wrap the `NavHost` in `SharedTransitionLayout`. Each composable that participates in the transition receives `AnimatedVisibilityScope` from the navigation lambda and `SharedTransitionScope` from the layout. Apply `Modifier.sharedElement(rememberSharedContentState(key = "hero-image-${item.id}"), animatedVisibilityScope)` to matching elements in both source and destination screens. Ensure the shared element `key` is deterministic and unique -- use item IDs, not positional indices. For the transition to be smooth, the shared element must have identical `Modifier.size()` or `fillMaxSize` behavior on both screens, or use `Modifier.sharedBounds` for elements that change size.

### Handling Keyboard and IME Interactions
Soft keyboard appearance causes window resizing or panning that composables must handle explicitly. Use `WindowCompat.setDecorFitsSystemWindows(window, false)` in the Activity and apply `Modifier.imePadding()` to the root scrollable container. For screens with a `TextField` near the bottom of the screen, wrap content in a `Column` with `Modifier.verticalScroll(rememberScrollState()).imePadding()`. For `LazyColumn`, use `Modifier.imeNestedScroll()` to allow the list to scroll in response to IME changes. Test keyboard handling on API 30+ (where the new WindowInsets IME animation API is available) and API 29 and below separately -- behavior differs significantly.

### Compose in Multi-Module Projects
In a multi-module project, place shared design system composables (`AppTheme`, spacing tokens, typography, reusable components) in a dedicated `:designsystem` or `:ui-components` module. Feature modules depend on `:designsystem` but NOT on each other. The `:app` module assembles the navigation graph by depending on all feature modules. Avoid placing composables in the `:domain` or `:data` layers -- these layers must remain platform-agnostic and free of Compose dependencies to preserve testability and enable potential multiplatform sharing. The Compose compiler plugin must be applied in every module that contains `@Composable` functions -- a missing plugin in a module produces cryptic errors about "composable functions called from non-composable context".

### Testing Composables with Asynchronous State
When testing a composable that displays data loaded asynchronously, use `composeTestRule.waitUntilAtLeastOneExists(hasText("Expected Content"), timeoutMillis = 5000)` from `compose-test` 1.5.0+ rather than adding arbitrary `delay()` calls or using `composeTestRule.mainClock.advanceTimeBy()`. For ViewModel-backed tests using real coroutines, inject a `TestCoroutineDispatcher` and use `runTest` with `advanceUntilIdle()` to ensure all pending coroutines complete before asserting UI state. Use the `Turbine` library for asserting `StateFlow` and `Channel` emissions in sequence -- it provides `awaitItem()`, `expectNoEvents()`, and timeout controls that are far more reliable than manual `collect` + `job.cancel()` patterns.

---

## Example

**Input:** "I'm building a product detail screen in Jetpack Compose. The screen loads product data from a repository, shows a loading spinner, allows the user to add the item to a cart, and navigates back on success. My team uses Hilt and follows MVVM. What's the complete pattern?"

**Output:**

### Compose Pattern: Product Detail Screen (MVVM + Hilt + UDF)

**Context & Applicability:**
This pattern applies to any screen that loads remote data, handles user actions with side effects, and triggers navigation. It uses a flat `UiState` data class (not sealed) because the screen can show loading and content simultaneously (loading overlay during "Add to Cart"), and uses a `Channel`-based effect for one-shot navigation and snackbar events.

---

#### Step 1: Define the UiState and UiEffect contracts

```kotlin
@Immutable
data class ProductDetailUiState(
    val isLoading: Boolean = true,
    val product: ProductUiModel? = null,
    val isAddingToCart: Boolean = false,
    val errorMessage: String? = null
)

// UI model -- separate from domain model, lives in :feature-product module
@Immutable
data class ProductUiModel(
    val id: String,
    val name: String,
    val description: String,
    val priceFormatted: String,    // pre-formatted in ViewModel, not composable
    val imageUrl: String,
    val isInStock: Boolean
)

sealed class ProductDetailUiEffect {
    object NavigateBack : ProductDetailUiEffect()
    data class ShowSnackbar(val message: String) : ProductDetailUiEffect()
}

sealed class ProductDetailEvent {
    object AddToCart : ProductDetailEvent()
    object RetryLoad : ProductDetailEvent()
    object NavigateBack : ProductDetailEvent()
}
```

---

#### Step 2: Implement the ViewModel

```kotlin
@HiltViewModel
class ProductDetailViewModel @Inject constructor(
    private val getProductUseCase: GetProductUseCase,
    private val addToCartUseCase: AddToCartUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    // Route argument -- type-safe via SavedStateHandle with navigation-compose 2.8+
    private val productId: String = checkNotNull(savedStateHandle["productId"])

    private val _uiState = MutableStateFlow(ProductDetailUiState())
    val uiState: StateFlow<ProductDetailUiState> = _uiState.asStateFlow()

    // Buffered channel -- survives brief UI absence without dropping events
    private val _uiEffect = Channel<ProductDetailUiEffect>(Channel.BUFFERED)
    val uiEffect: Flow<ProductDetailUiEffect> = _uiEffect.receiveAsFlow()

    init {
        loadProduct()
    }

    fun onEvent(event: ProductDetailEvent) {
        when (event) {
            is ProductDetailEvent.AddToCart -> addToCart()
            is ProductDetailEvent.RetryLoad -> loadProduct()
            is ProductDetailEvent.NavigateBack -> {
                viewModelScope.launch {
                    _uiEffect.send(ProductDetailUiEffect.NavigateBack)
                }
            }
        }
    }

    private fun loadProduct() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            getProductUseCase(productId)
                .onSuccess { product ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            product = product.toUiModel()  // mapping in ViewModel
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = error.toUserMessage()  // extension fun maps exceptions
                        )
                    }
                }
        }
    }

    private fun addToCart() {
        val product = _uiState.value.product ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isAddingToCart = true) }
            addToCartUseCase(product.id)
                .onSuccess {
                    _uiEffect.send(
                        ProductDetailUiEffect.ShowSnackbar("${product.name} added to cart")
                    )
                    _uiEffect.send(ProductDetailUiEffect.NavigateBack)
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isAddingToCart = false,
                            errorMessage = error.toUserMessage()
                        )
                    }
                }
        }
    }
}
```

---

#### Step 3: Implement the Screen Composable (ViewModel boundary)

```kotlin
@Composable
fun ProductDetailScreen(
    onNavigateBack: () -> Unit,
    viewModel: ProductDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    // Effect handling -- one-shot events consumed here, never in Content
    LaunchedEffect(Unit) {
        viewModel.uiEffect.collect { effect ->
            when (effect) {
                is ProductDetailUiEffect.NavigateBack -> onNavigateBack()
                is ProductDetailUiEffect.ShowSnackbar -> {
                    snackbarHostState.showSnackbar(
                        message = effect.message,
                        duration = SnackbarDuration.Short
                    )
                }
            }
        }
    }

    ProductDetailContent(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        onEvent = viewModel::onEvent
    )
}
```

---

#### Step 4: Implement the Content Composable (fully testable)

```kotlin
@Composable
fun ProductDetailContent(
    uiState: ProductDetailUiState,
    snackbarHostState: SnackbarHostState,
    onEvent: (ProductDetailEvent) -> Unit,
    modifier: Modifier = Modifier
) {
    Scaffold(
        modifier = modifier,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text(uiState.product?.name ?: "") },
                navigationIcon = {
                    IconButton(
                        onClick = { onEvent(ProductDetailEvent.NavigateBack) }
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Navigate back"
                        )
                    }
                }
            )
        },
        bottomBar = {
            uiState.product?.let { product ->
                AddToCartBar(
                    price = product.priceFormatted,
                    isInStock = product.isInStock,
                    isLoading = uiState.isAddingToCart,
                    onAddToCart = { onEvent(ProductDetailEvent.AddToCart) }
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when {
                uiState.isLoading && uiState.product == null -> {
                    // Initial loading -- full screen spinner
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                uiState.errorMessage != null && uiState.product == null -> {
                    // Full screen error with retry
                    ErrorContent(
                        message = uiState.errorMessage,
                        onRetry = { onEvent(ProductDetailEvent.RetryLoad) },
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                uiState.product != null -> {
                    ProductBody(
                        product = uiState.product,
                        modifier = Modifier.fillMaxSize()
                    )
                    // Inline error -- product is visible but an action failed
                    uiState.errorMessage?.let { error ->
                        Text(
                            text = error,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .padding(MaterialTheme.spacing.md)
                        )
                    }
                }
            }
        }
    }
}
```

---

#### Step 5: Recomposition Risk Assessment

| Composable | State Read Frequency | Optimization Applied |
|---|---|---|
| `ProductDetailScreen` | Low -- only effect collection | `collectAsStateWithLifecycle` stops collection when backgrounded |
| `ProductDetailContent` | Medium -- state snapshot | `@Immutable` on UiState enables skipping when reference is equal |
| `AddToCartBar` | Low -- isLoading toggle | Receives primitive + lambda; lambda uses `::onEvent` method ref, stable across recompositions |
| `ProductBody` | Very Low -- static after load | Receives `@Immutable` `ProductUiModel`; skipped entirely after first composition |
| `TopAppBar title` | Low -- product name only | Isolated read; only this composable recomposes when name changes |

---

#### Step 6: Test Coverage

```kotlin
// ViewModel unit test with Turbine
@OptIn(ExperimentalCoroutinesApi::class)
class ProductDetailViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()  // replaces Main dispatcher with TestDispatcher

    private val getProductUseCase: GetProductUseCase = mockk()
    private val addToCartUseCase: AddToCartUseCase = mockk()
    private val savedStateHandle = SavedStateHandle(mapOf("productId" to "prod-123"))

    private lateinit var viewModel: ProductDetailViewModel

    @Test
    fun `loading product updates state to content on success`() = runTest {
        coEvery { getProductUseCase("prod-123") } returns Result.success(fakeProduct)
        viewModel = ProductDetailViewModel(getProductUseCase, addToCartUseCase, savedStateHandle)

        viewModel.uiState.test {
            val loading = awaitItem()
            assertThat(loading.isLoading).isTrue()
            val loaded = awaitItem()
            assertThat(loaded.isLoading).isFalse()
            assertThat(loaded.product?.id).isEqualTo("prod-123")
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `add to cart success sends NavigateBack effect`() = runTest {
        coEvery { getProductUseCase("prod-123") } returns Result.success(fakeProduct)
        coEvery { addToCartUseCase("prod-123") } returns Result.success(Unit)
        viewModel = ProductDetailViewModel(getProductUseCase, addToCartUseCase, savedStateHandle)
        advanceUntilIdle()

        viewModel.uiEffect.test {
            viewModel.onEvent(ProductDetailEvent.AddToCart)
            assertThat(awaitItem()).isInstanceOf(ProductDetailUiEffect.ShowSnackbar::class.java)
            assertThat(awaitItem()).isEqualTo(ProductDetailUiEffect.NavigateBack)
            cancelAndIgnoreRemainingEvents()
        }
    }
}

// Content composable UI test
class ProductDetailContentTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun `add to cart button disabled when not in stock`() {
        composeTestRule.setContent {
            AppTheme {
                ProductDetailContent(
                    uiState = ProductDetailUiState(
                        isLoading = false,
                        product = fakeProductUiModel.copy(isInStock = false)
                    ),
                    snackbarHostState = remember { SnackbarHostState() },
                    onEvent = {}
                )
            }
        }
        composeTestRule
            .onNodeWithContentDescription("Add to cart")
            .assertIsNotEnabled()
    }

    @Test
    fun `retry button shown on full screen error`() {
        composeTestRule.setContent {
            AppTheme {
                ProductDetailContent(
                    uiState = ProductDetailUiState(
                        isLoading = false,
                        product = null,
                        errorMessage = "Failed to load product"
                    ),
                    snackbarHostState = remember { SnackbarHostState() },
                    onEvent = {}
                )
            }
        }
        composeTestRule
            .onNodeWithText("Retry")
            .assertIsDisplayed()
    }
}
```

---

#### Step 7: Navigation graph wiring

```kotlin
// In feature module's NavGraph extension
fun NavGraphBuilder.productGraph(
    navController: NavController
) {
    composable<ProductDetailRoute> {
        ProductDetailScreen(
            onNavigateBack = { navController.popBackStack() }
        )
    }
}

@Serializable
data class ProductDetailRoute(val productId: String)

// Navigating to the screen
navController.navigate(ProductDetailRoute(productId = item.id))
```

**Key decisions made in this pattern and why:**
- `Channel.BUFFERED` on effects: prevents event loss if the composable is briefly off-screen during configuration change.
- `isAddingToCart` as a separate boolean rather than a loading state variant: the screen can show product content AND a button loading state simultaneously without switching to a full-screen loading mode.
- Price formatting in ViewModel, not composable: formatting logic is testable in unit tests without a Compose test environment.
- `onEvent` using a sealed class rather than individual lambda parameters: adding a new user action requires adding a case to the sealed class, not changing the composable function signature, which would break all call sites and preview configurations.
