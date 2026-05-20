---
name: flutter-state-management
description: |
  Guides expert-level flutter state management implementation: dart and design-patterns decision frameworks, production-ready patterns, and concrete templates for flutter state management workflows.
  Use when the user asks about flutter state management, flutter state management configuration, or mobile best practices for flutter projects.
  Do NOT use when the user needs a different mobile development capability -- check sibling skills in the mobile development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile dart design-patterns"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Flutter State Management

## When to Use

**Use this skill when:**
- The user asks which state management solution to choose for a Flutter app (Provider, Riverpod, Bloc/Cubit, GetX, MobX, Redux, or setState)
- The user needs to implement a specific state management pattern and wants production-ready code, file structure, and architectural guidance
- The user is experiencing performance problems -- excessive widget rebuilds, UI jank, or memory leaks -- that originate from poorly scoped state
- The user wants to refactor an existing Flutter app from one state management approach to another (e.g., migrating from Provider to Riverpod, or from setState to Bloc)
- The user is designing a new Flutter feature involving async data fetching, caching, optimistic updates, or complex UI state coordination
- The user asks about reactive state, stream-based state, or event-driven architecture in the context of Flutter
- The user wants to test state management logic in isolation from the widget tree
- The user needs to handle cross-feature state sharing, dependency injection, or service locators in Flutter

**Do NOT use this skill when:**
- The user needs Flutter navigation architecture -- use the flutter-navigation skill, which covers go_router, AutoRoute, and deep linking patterns
- The user is asking about Flutter animation state (AnimationController, Tween, physics simulations) -- that is the flutter-animations skill
- The user needs Flutter platform channel integration or native plugin development
- The user is asking about Dart language fundamentals without a Flutter-specific state concern
- The user needs backend or API design for a Flutter app -- that belongs in the API design or backend skills
- The user is asking about React Native, SwiftUI, or Jetpack Compose state -- those are separate mobile platform skills
- The user needs Flutter widget layout, theming, or design system work -- check the flutter-ui skill

---

## Process

### 1. Assess Application Complexity and Team Context

Before recommending any solution, gather the following information:

- **App scale:** Categorize the app as small (fewer than 10 screens, mostly CRUD, 1--3 developers), medium (10--50 screens, multiple data domains, real-time features, 3--8 developers), or large (50+ screens, offline-first, multiple teams, strict separation of concerns required)
- **Async requirements:** Identify whether state originates from REST calls (single Future), WebSocket or Firebase streams (continuous Stream), local database (SQLite/Isar/Hive subscriptions), or computed derivations across multiple sources
- **Team familiarity:** A team experienced with reactive programming (RxDart, RxJava, RxSwift) will adopt Bloc naturally. Teams from a React/Vue background often find Riverpod's provider model intuitive. Teams new to Flutter should start with Provider or Riverpod rather than Bloc
- **Test coverage requirements:** If the project mandates 70%+ unit test coverage, prefer Bloc or Riverpod -- both make state logic independently testable without a widget tree
- **Offline-first requirements:** Apps that cache aggressively (Isar, Drift, Hive) need state management that bridges async database streams to UI, favoring StreamProvider in Riverpod or BlocBuilder with repository streams
- **Cross-feature state:** Ask whether distinct features share state (shopping cart accessible from product list AND checkout) -- shared state demands a scoping solution beyond local StatefulWidget

### 2. Apply the Decision Framework

Use the following structured decision tree to select the appropriate solution:

**Step 2a -- Eliminate options based on hard constraints:**
- If the team has fewer than 6 months of Flutter experience and no reactive programming background: eliminate Bloc, MobX, and Redux immediately. These require understanding of streams, observables, or reducers that take weeks to learn correctly
- If the codebase must avoid code generation at build time (strict CI constraints, slow build pipelines): eliminate MobX (requires `build_runner`) and Riverpod's code-generated variant (riverpod_generator). Use non-generated Riverpod or Provider instead
- If the app is a prototype or MVP with a 4-week delivery window: setState + Provider is sufficient and appropriate. Do not over-engineer

**Step 2b -- Match pattern to feature complexity:**

| Feature Type | Recommended Pattern | Why |
|---|---|---|
| Local ephemeral UI state (dropdown open, tab index) | setState inside StatefulWidget | No need to share, lifecycle is screen-scoped |
| Single async data fetch (user profile, config) | FutureProvider (Riverpod) or FutureBuilder | Simple, composable, handles loading/error |
| Paginated or infinite-scroll lists | StateNotifierProvider (Riverpod) | Mutable list state with append semantics |
| Real-time data (chat, live prices) | StreamProvider (Riverpod) or BlocBuilder + Stream | Reactive, auto-disposes on widget unmount |
| Complex multi-step forms | Cubit (Bloc) | Clear state transitions, testable |
| Complex event-driven flows (authentication, checkout) | Bloc with explicit Events | Audit trail of events, easy replay for tests |
| Global app-wide state (auth, theme, user session) | Riverpod global providers or InheritedWidget root | Persistent scope above MaterialApp |
| Cross-feature derived state (cart total from line items) | Riverpod Provider with watch() | Reactive derivation, auto-caches |

**Step 2c -- Final selection rationale:**
- **setState:** Use only for state that does not leave the widget. If you call setState in a parent to pass data to a child, you have outgrown it
- **Provider (package:provider):** Appropriate for small-to-medium apps. Simpler mental model than Riverpod but lacks auto-dispose, ref.watch composition, and code generation. Avoid for new greenfield projects in 2024+
- **Riverpod (package:flutter_riverpod):** The default recommendation for most new Flutter apps. Compile-time safety, auto-dispose, family modifiers for parameterized providers, and first-class async support. Use riverpod_generator only if code generation is acceptable
- **Bloc/Cubit (package:flutter_bloc):** Best for large teams with strict event-sourcing or audit requirements, or where separation between UI events and state transitions is a non-negotiable architectural rule. Cubit is Bloc without explicit event classes -- prefer Cubit when events are trivial
- **GetX:** Avoid in production team environments. Mixes routing, DI, and state into a single opinionated framework with poor testability and unpredictable rebuild behavior. Only acceptable for solo rapid prototyping
- **MobX:** Viable for teams from an Angular/Mobx-React background. Requires code generation. The observable/computed/action model maps well to derived state, but adds build complexity
- **Redux (package:flutter_redux):** Only justifiable if migrating a Redux-JS team to Flutter and preserving mental model consistency. The boilerplate-to-benefit ratio is poor for most Flutter apps

### 3. Design the Provider/State Architecture

Once the solution is chosen, define the state topology before writing code:

- **Identify state domains:** Group state by business concern, not by screen. Authentication state, cart state, catalog state, and user preferences are domains -- ProductListScreen state is a view concern
- **Define scope boundaries:** Use ProviderScope overrides in Riverpod (or MultiProvider scoping in Provider) to restrict state to the subtree that needs it. Avoid making everything global
- **Enumerate state shapes:** For each domain, define the state class using sealed classes (Dart 3+) or a freezed union. A typical async state has four variants: initial, loading, data(T value), and error(Object error, StackTrace stack)
- **Map dependencies:** Draw (or enumerate) the dependency graph between providers. A CartNotifier depends on AuthProvider (to get userId) and ProductRepository (to fetch prices). Circular dependencies signal a design flaw
- **Define the repository boundary:** State management should never talk to HTTP directly. All network and storage calls go through a Repository class injected via the DI mechanism (Riverpod provider, get_it, or Provider)

### 4. Implement State Classes with Proper Patterns

Apply the following concrete implementation patterns:

**Riverpod StateNotifier pattern (for mutable async state):**
```dart
// State class using freezed for union types
@freezed
class ProductListState with _$ProductListState {
  const factory ProductListState.initial() = _Initial;
  const factory ProductListState.loading() = _Loading;
  const factory ProductListState.data(List<Product> products) = _Data;
  const factory ProductListState.error(String message) = _Error;
}

// Notifier
class ProductListNotifier extends StateNotifier<ProductListState> {
  ProductListNotifier(this._repository) : super(const ProductListState.initial());

  final ProductRepository _repository;

  Future<void> fetchProducts({required String categoryId}) async {
    state = const ProductListState.loading();
    try {
      final products = await _repository.getProducts(categoryId: categoryId);
      state = ProductListState.data(products);
    } on NetworkException catch (e) {
      state = ProductListState.error(e.userFacingMessage);
    } catch (e, st) {
      // Log st to crash reporter (Sentry, Firebase Crashlytics)
      state = ProductListState.error('Unexpected error. Please retry.');
    }
  }
}

// Provider
final productListProvider = StateNotifierProvider.autoDispose
    .family<ProductListNotifier, ProductListState, String>(
  (ref, categoryId) {
    final repo = ref.watch(productRepositoryProvider);
    final notifier = ProductListNotifier(repo);
    notifier.fetchProducts(categoryId: categoryId);
    return notifier;
  },
);
```

**Bloc pattern (for event-driven flows):**
```dart
// Events
abstract class AuthEvent {}
class AuthLoginRequested extends AuthEvent {
  final String email;
  final String password;
  AuthLoginRequested({required this.email, required this.password});
}
class AuthLogoutRequested extends AuthEvent {}

// States -- use Equatable for value equality in tests
abstract class AuthState extends Equatable {}
class AuthInitial extends AuthState {
  @override List<Object> get props => [];
}
class AuthLoading extends AuthState {
  @override List<Object> get props => [];
}
class AuthAuthenticated extends AuthState {
  final User user;
  const AuthAuthenticated(this.user);
  @override List<Object> get props => [user];
}
class AuthUnauthenticated extends AuthState {
  @override List<Object> get props => [];
}
class AuthFailure extends AuthState {
  final String message;
  const AuthFailure(this.message);
  @override List<Object> get props => [message];
}

// Bloc
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc(this._authRepository) : super(AuthInitial()) {
    on<AuthLoginRequested>(_onLoginRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
  }

  final AuthRepository _authRepository;

  Future<void> _onLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final user = await _authRepository.login(
        email: event.email,
        password: event.password,
      );
      emit(AuthAuthenticated(user));
    } on AuthException catch (e) {
      emit(AuthFailure(e.message));
    }
  }
}
```

### 5. Optimize Widget Rebuilds

Poor rebuild management is the most common Flutter performance problem. Apply these patterns:

- **Use Consumer (Riverpod) or BlocBuilder (Bloc) as deep in the tree as possible.** Wrapping an entire screen in a Consumer causes the entire subtree to rebuild on every state change. Instead, wrap only the Text or Icon widget that displays the changing value
- **Use select() in Riverpod to subscribe to a slice of state:** `ref.watch(userProvider.select((u) => u.displayName))` only rebuilds when displayName changes, not when other User fields change
- **Use buildWhen in BlocBuilder:** `buildWhen: (prev, curr) => prev.count != curr.count` prevents rebuilds for unrelated state transitions
- **Avoid computing derived state inside build():** Computations like `items.where((i) => i.isActive).toList()` inside build() run on every rebuild. Move derivations into providers or use `ref.watch` on a derived provider
- **Use const constructors aggressively:** Any widget whose constructor is const will be skipped during rebuilds if its inputs have not changed. Mark leaf widgets const wherever possible
- **Use RepaintBoundary for isolated expensive widgets:** Charts, maps, or complex custom painters should be wrapped in RepaintBoundary to isolate their repaints from the rest of the tree

### 6. Implement Proper Async and Error Handling

- **Model all async state explicitly:** Never use `isLoading = true` booleans alongside nullable data fields. This creates 2^n possible states (isLoading AND data both non-null is invalid). Use sealed union types instead
- **Handle the three async conditions every time:** Every FutureProvider or StreamProvider must handle loading, error, and data states in the UI -- no exceptions. A missing error state means users see a blank screen on failure
- **Use ref.listen for side effects, not ref.watch:** Navigation, snackbars, and dialogs triggered by state changes belong in `ref.listen`, not inside build(). Using `ref.watch` for side effects causes them to fire on every rebuild
- **Implement retry logic at the notifier level:** Expose a `retry()` method on StateNotifier that re-runs the last failed operation. This keeps retry logic out of the widget tree
- **Cancel async operations on dispose:** In StateNotifier, use a CancelToken (dio), `_mounted` guard, or Completer to prevent setState calls after the notifier is disposed. The `.autoDispose` modifier in Riverpod handles cleanup automatically when the provider leaves scope

### 7. Establish Dependency Injection

State management and dependency injection are inseparable in Flutter:

- **Riverpod as DI:** Use `Provider<T>` at the top of the provider graph to expose repositories and services. `final httpClientProvider = Provider((ref) => HttpClient())`. All other providers watch this rather than constructing their own dependencies
- **Override providers in tests:** Riverpod's ProviderScope accepts overrides -- `ProviderScope(overrides: [repositoryProvider.overrideWithValue(MockRepository())])`. This enables pure unit testing of notifiers and integration testing of widgets without a real backend
- **Avoid get_it alongside Riverpod:** Using both get_it and Riverpod for DI creates two competing service locators. Pick one. Riverpod is sufficient for most Flutter apps. Reserve get_it for packages that must be independent of Flutter (pure Dart libraries)
- **Inject repositories, not HTTP clients, into notifiers:** Notifiers depend on `ProductRepository`, not on `Dio` or `http.Client`. The repository abstracts the transport layer, making the notifier testable

### 8. Write Tests for State Logic

- **Test StateNotifier in pure Dart:** No widget tree needed. Create the notifier with a mock repository, call methods, and assert on `notifier.state`
- **Test Bloc with bloc_test package:** `blocTest<AuthBloc, AuthState>` provides `act`, `expect`, and `verify` DSL that makes event-to-state assertions readable
- **Test widget integration with ProviderScope overrides:** Wrap the widget under test in `ProviderScope(overrides: [...])` and pump the widget. Assert on what the user sees, not on internal state
- **Use fake_async for time-dependent state:** Debounced search, polling intervals, and timeouts should be tested with `fake_async` to avoid slow tests
- **Achieve 80%+ branch coverage on state classes:** State machines (Bloc, StateNotifier) should cover every branch of every state transition. Missing branches in tests mean untested failure modes in production

---

## Output Format

When responding to a user's state management question, structure your output as follows:

```
## State Management Assessment

**App Profile:**
- Scale: [small / medium / large]
- Async complexity: [simple futures / streams / mixed]
- Team experience: [novice / intermediate / experienced]
- Test requirements: [low / medium / high]

## Recommended Solution: [Package Name + Reasoning in 2 sentences]

## Decision Rationale

| Criterion | Chosen Approach | Eliminated Alternative | Reason |
|---|---|---|---|
| Team familiarity | [chosen] | [eliminated] | [specific reason] |
| Async pattern | [chosen] | [eliminated] | [specific reason] |
| Testability | [chosen] | [eliminated] | [specific reason] |
| Boilerplate tolerance | [chosen] | [eliminated] | [specific reason] |

## Provider Architecture

### State Domains
- [Domain 1]: [description, scope, lifetime]
- [Domain 2]: [description, scope, lifetime]

### Dependency Graph
[Domain 1] --> [Repository 1] --> [HttpClient]
[Domain 2] --> [Repository 1], [Domain 1]

## Implementation

### State Class
[Complete Dart code for the state type]

### Provider / Notifier / Bloc
[Complete Dart code -- no placeholders]

### Widget Integration
[Complete widget code showing Consumer / BlocBuilder usage]

### Test Example
[Complete test file showing state assertion pattern]

## File Structure

lib/
  features/
    [feature_name]/
      data/
        [feature]_repository.dart
        [feature]_repository_impl.dart
      domain/
        [feature]_model.dart
      presentation/
        [feature]_screen.dart
        [feature]_notifier.dart   (or _bloc.dart / _cubit.dart)
        [feature]_state.dart
      [feature]_providers.dart    (Riverpod) or [feature]_module.dart

## Performance Checklist

- [ ] Consumer/BlocBuilder scoped to smallest possible subtree
- [ ] select() used to subscribe to state slices where applicable
- [ ] No derived state computed inside build()
- [ ] const constructors applied to all eligible leaf widgets
- [ ] autoDispose used on providers that should not persist globally
- [ ] Error states handled for all async providers
- [ ] Retry mechanism exposed on failing async operations
```

---

## Rules

1. **NEVER recommend GetX for a team project.** GetX conflates routing, DI, and state into a single object without compile-time safety, produces untestable controllers, and creates severe coupling. It is only acceptable for solo prototypes that will be discarded.

2. **NEVER model async state with parallel booleans.** A pattern like `bool isLoading; T? data; String? error` allows 2^3 = 8 states, most of which are impossible and all of which must be guarded manually. Always use sealed classes or freezed unions with exactly the valid states enumerated.

3. **NEVER place side effects (navigation, snackbars, dialogs) inside build() methods.** Side effects belong in `ref.listen`, `BlocListener`, or lifecycle hooks. Placing them in build() causes them to fire repeatedly as the widget rebuilds.

4. **ALWAYS scope providers to the narrowest required lifetime.** Using `.autoDispose` by default and opting out explicitly prevents memory accumulation from stale providers. A product detail provider should not persist after the user navigates away.

5. **NEVER pass BuildContext across async gaps without checking mounted.** After any `await`, verify `if (!context.mounted) return;` before calling `Navigator`, `showDialog`, or `ScaffoldMessenger`. Failing to do this causes use-after-dispose crashes in release builds.

6. **ALWAYS inject repositories into notifiers -- never HTTP clients or database handles directly.** The repository abstraction is what makes state logic independently testable. A notifier that holds a `Dio` instance cannot be unit tested without a running server.

7. **NEVER use global mutable singletons (static fields) as a substitute for state management.** Static state bypasses widget lifecycle, cannot be overridden in tests, and causes unpredictable behavior in hot reload and test isolation. Use Riverpod global providers instead, which are lifecycle-aware.

8. **ALWAYS use Equatable or implement == and hashCode on state classes used with Bloc.** Without value equality, BlocBuilder will always consider consecutive identical states as different and trigger unnecessary rebuilds. This is a silent performance defect.

9. **NEVER allow a loading spinner to be the only feedback for an operation that can fail.** Every async operation that emits a loading state MUST also model a failure state. A user stuck on an infinite spinner with no error message or retry option is a UX defect that state architecture can prevent.

10. **ALWAYS collocate provider definitions with the feature they serve.** A `productListProvider` belongs in `features/catalog/catalog_providers.dart`, not in a single global `providers.dart` file. Global provider files become dependency sinks that couple unrelated features and make code navigation impossible in large apps.

11. **NEVER mutate state objects directly in StateNotifier.** Dart does not enforce immutability. Always emit a new state object. `state.items.add(item)` mutates the existing state and StateNotifier will not detect the change, leaving the UI stale. Use `state = state.copyWith(items: [...state.items, item])` instead.

12. **ALWAYS handle stream errors in StreamProvider.** An unhandled stream error terminates the stream and leaves the provider in a permanent error state. Wrap stream transformations in `.handleError()` or use `.onErrorReturn()` from RxDart to recover gracefully.

---

## Edge Cases

### Migrating a Large setState Codebase to Riverpod

When a codebase has hundreds of StatefulWidgets using setState for shared state, a complete rewrite is impractical. Apply the strangler fig pattern:

- Identify the 3--5 state domains with the highest cross-widget sharing (typically auth, user profile, and cart/basket). Extract these first
- Wrap the app in ProviderScope at main.dart. This requires no changes to existing widgets
- Create a new Riverpod provider for each extracted domain. Use `ref.watch` in new widgets only
- Existing StatefulWidgets continue to use setState locally. They can selectively adopt `ConsumerStatefulWidget` one widget at a time when they need to read the new providers
- Add a `MIGRATED_TO_RIVERPOD` comment at the top of each migrated file. After 3--6 months, grep for files without this comment to track migration progress
- Never attempt to run both Provider (package:provider) and Riverpod simultaneously for the same state domain. They are incompatible as coexisting DI mechanisms for the same concern

### Authentication State Race Conditions

Authentication state is consumed by routing, API interceptors, and UI simultaneously, creating race conditions if not handled carefully:

- The auth provider must be initialized before the router evaluates the first route. In Riverpod, use `ProviderScope` with an overrideWithValue for a synchronously available initial auth state (loaded from secure storage at startup)
- The API interceptor (Dio interceptor, http client wrapper) must watch the auth token reactively. Use a `ProviderContainer` outside the widget tree to read auth state in the interceptor. Never store the token in a static variable
- When a 401 response triggers logout, the auth state change must propagate to the router atomically. Use `ref.listen` on the auth provider at the router level to redirect to login immediately
- Token refresh races: if two API calls fire simultaneously and both get 401s, both should not attempt token refresh concurrently. Use a Mutex (package:synchronized) or a `Completer` that both requests await while one performs the refresh

### Offline-First State Synchronization

Apps with offline capability must reconcile local state (Isar, Drift, Hive) with remote state after reconnection:

- The repository layer should always read from local cache and write to both local and remote. The state notifier only talks to the repository and never knows whether data came from cache or network
- Use a `StreamProvider` backed by a database stream (Isar.watch, Drift's watchSingleOrNull). The stream emits whenever the local database changes, whether from user action or background sync
- Conflict resolution must be defined at the data model level (last-write-wins by updatedAt timestamp, or server-authoritative, or CRDT). State management code should not contain conflict resolution logic -- that belongs in the repository or sync service
- Show explicit sync status in the UI using a separate `SyncStatusProvider` -- never silently fail a sync. Users must know their data is pending upload

### State Management Across Isolates

Flutter apps that use compute() or Isolate.spawn for heavy computation must communicate with the main isolate's state:

- State notifiers live on the main isolate. Compute results must be sent back to the main isolate and then applied to state via the notifier's method calls
- Never pass a StateNotifier or WidgetsBinding reference to a background isolate. Isolate memory is not shared in Dart
- Use `ReceivePort` and `SendPort` for bidirectional isolate communication, or use the `worker_manager` package for a pool-based approach
- After receiving a compute result, call `ref.read(myNotifierProvider.notifier).applyResult(result)` from the main isolate. Do not attempt to set state from a secondary isolate

### Testing State That Depends on Time

Polling intervals, debounced search, token expiry, and retry backoff all involve time-dependent state:

- Use `fake_async` from the `quiver` or `fake_async` package to control the clock in tests. Wrap the test body in `fakeAsync((async) { ... async.elapse(Duration(seconds: 30)); })` to fast-forward time
- Use `StreamController` with a manually controlled stream to simulate time-based stream emissions without real delays
- Mock `DateTime.now()` by injecting a clock function into the notifier: `final DateTime Function() clock;` -- replace with `() => fixedTime` in tests. Never call `DateTime.now()` directly inside a notifier
- Keep test timeouts under 2 seconds. Any test that sleeps for real wall-clock time is a sign that time control is missing

### Multiple Flavors and Environment-Specific State

Production, staging, and development flavors often need different API endpoints, feature flags, and service configurations in state:

- Define an `AppConfig` data class with endpoint URLs, feature flags, and environment name. Expose it via a Riverpod `Provider<AppConfig>` overridden at ProviderScope initialization based on the compile-time flavor constant (`const String.fromEnvironment('FLAVOR')`)
- All providers that depend on environment (API base URL, analytics, feature toggles) watch `appConfigProvider`. This makes it impossible to accidentally use the production endpoint in staging
- Never hardcode environment differences inside notifiers. The notifier receives the config through its provider dependency and never queries the environment directly

### Provider Initialization Order and Startup Dependencies

Some providers depend on async initialization (reading from secure storage, loading remote config) before the app can render:

- Use `FutureProvider` for providers that require async initialization: `final authInitProvider = FutureProvider<AuthState>((ref) async { ... })`
- In main.dart, use `ProviderContainer` to await critical providers before calling `runApp`. This ensures the app never renders in an indeterminate state:
  ```dart
  final container = ProviderContainer();
  await container.read(authInitProvider.future);
  runApp(UncontrolledProviderScope(container: container, child: MyApp()));
  ```
- For non-critical initialization (analytics, remote config), initialize in the background and expose a loading state in the UI -- do not block `runApp` for optional features
- Define a startup sequence (auth first, then user preferences, then feature flags) and model it as a dedicated `AppStartupNotifier` rather than relying on implicit provider initialization order

---

## Example

**Input:** "I'm building a Flutter e-commerce app. It has a product catalog, shopping cart, user authentication, and order history. The team is 5 engineers with moderate Flutter experience (1--2 years), and we need solid test coverage. What state management approach should we use, and how do we structure it?"

---

**Output:**

## State Management Assessment

**App Profile:**
- Scale: Medium (4 domains, ~20--35 screens, real user-facing production app)
- Async complexity: Mixed -- REST calls for catalog/orders, possible cart persistence via local storage, auth token management
- Team experience: Intermediate -- 1--2 years Flutter, likely familiar with basic setState and Provider
- Test requirements: High -- solid test coverage implies unit-testable state logic

## Recommended Solution: Riverpod (flutter_riverpod 2.x with StateNotifierProvider and FutureProvider)

Riverpod provides compile-time provider safety, auto-dispose, family parameterization, and first-class async state -- all without requiring code generation (skip riverpod_generator initially). At 1--2 years experience, the team will find the `ref.watch / ref.listen` mental model approachable, and Riverpod's ProviderScope overrides make mocking trivial for test coverage goals.

## Decision Rationale

| Criterion | Chosen: Riverpod | Eliminated: Bloc | Eliminated: Provider |
|---|---|---|---|
| Team familiarity | Moderate learning curve, watch/listen model intuitive | High ceremony -- separate Event/State/Bloc classes for every feature adds ~3 files per domain | Simpler but lacks auto-dispose and select(), leads to over-rebuild |
| Async pattern | FutureProvider and StreamProvider handle REST and streams natively | Requires manual stream subscription and event dispatch | ChangeNotifier requires manual notifyListeners(), no built-in async state |
| Testability | ProviderScope overrides enable pure widget + notifier tests | bloc_test is excellent but adds another dependency | Hard to test ChangeNotifier isolation |
| Boilerplate tolerance | Moderate -- one provider file, one state file, one notifier per feature | High -- Event + State + Bloc + mapper per feature | Low but paid for in rebuild management pain |

## Provider Architecture

### State Domains

- **Auth Domain:** Global lifetime (above MaterialApp). Manages User object, token, login/logout. Persists token to FlutterSecureStorage. All other providers that need userId watch this provider
- **Catalog Domain:** Auto-disposed per category. Fetches paginated product lists. Parameterized by categoryId using `.family`. Disposed when the catalog screen exits
- **Cart Domain:** Global lifetime. User's active cart lives as long as the session. Backed by Isar for local persistence so cart survives app restart before checkout
- **Orders Domain:** Auto-disposed per screen. Fetches order history lazily. No local persistence required -- orders are server-authoritative

### Dependency Graph

```
authProvider (global)
  └── authRepositoryProvider
        └── httpClientProvider (with auth interceptor)

productListProvider.family(categoryId) [autoDispose]
  └── productRepositoryProvider
        └── httpClientProvider

cartNotifierProvider (global)
  └── cartRepositoryProvider
        ├── httpClientProvider
        └── isarProvider (local DB)

orderListProvider (autoDispose)
  └── orderRepositoryProvider
        └── httpClientProvider
```

## Implementation

### Auth State Class

```dart
// lib/features/auth/presentation/auth_state.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import '../domain/user.dart';

part 'auth_state.freezed.dart';

@freezed
class AuthState with _$AuthState {
  const factory AuthState.initial() = AuthInitial;
  const factory AuthState.loading() = AuthLoading;
  const factory AuthState.authenticated(User user) = AuthAuthenticated;
  const factory AuthState.unauthenticated() = AuthUnauthenticated;
  const factory AuthState.error(String message) = AuthError;
}
```

### Auth Notifier and Provider

```dart
// lib/features/auth/presentation/auth_notifier.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repository.dart';
import 'auth_state.dart';

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._repository) : super(const AuthState.initial()) {
    _initialize();
  }

  final AuthRepository _repository;

  Future<void> _initialize() async {
    state = const AuthState.loading();
    final user = await _repository.getStoredUser();
    if (user != null) {
      state = AuthState.authenticated(user);
    } else {
      state = const AuthState.unauthenticated();
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = const AuthState.loading();
    try {
      final user = await _repository.login(email: email, password: password);
      state = AuthState.authenticated(user);
    } on AuthException catch (e) {
      state = AuthState.error(e.userFacingMessage);
    } catch (_) {
      state = const AuthState.error('Login failed. Please try again.');
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const AuthState.unauthenticated();
  }
}

// lib/features/auth/auth_providers.dart
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    httpClient: ref.watch(httpClientProvider),
    secureStorage: ref.watch(secureStorageProvider),
  );
});

final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authRepositoryProvider));
});
```

### Cart State and Notifier

```dart
// lib/features/cart/presentation/cart_state.dart
@freezed
class CartState with _$CartState {
  const factory CartState({
    @Default([]) List<CartItem> items,
    @Default(false) bool isUpdating,
    String? errorMessage,
  }) = _CartState;

  const CartState._();

  double get total => items.fold(0, (sum, item) => sum + item.subtotal);
  int get itemCount => items.fold(0, (sum, item) => sum + item.quantity);
}

// lib/features/cart/presentation/cart_notifier.dart
class CartNotifier extends StateNotifier<CartState> {
  CartNotifier(this._repository) : super(const CartState()) {
    _loadCart();
  }

  final CartRepository _repository;

  Future<void> _loadCart() async {
    final items = await _repository.getLocalCart();
    state = state.copyWith(items: items);
  }

  Future<void> addItem(Product product, {int quantity = 1}) async {
    final existing = state.items.indexWhere((i) => i.productId == product.id);
    final updated = [...state.items];

    if (existing >= 0) {
      updated[existing] = updated[existing].copyWith(
        quantity: updated[existing].quantity + quantity,
      );
    } else {
      updated.add(CartItem.fromProduct(product, quantity: quantity));
    }

    // Optimistic update
    state = state.copyWith(items: updated, errorMessage: null);

    try {
      await _repository.persistCart(updated);
    } catch (e) {
      // Rollback on persistence failure
      state = state.copyWith(
        items: state.items, // revert
        errorMessage: 'Failed to save cart. Check connection.',
      );
    }
  }

  Future<void> removeItem(String productId) async {
    final updated = state.items.where((i) => i.productId != productId).toList();
    state = state.copyWith(items: updated);
    await _repository.persistCart(updated);
  }
}

final cartNotifierProvider =
    StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier(ref.watch(cartRepositoryProvider));
});
```

### Widget Integration

```dart
// lib/features/cart/presentation/cart_icon_badge.dart
// Scoped Consumer -- only rebuilds when itemCount changes
class CartIconBadge extends ConsumerWidget {
  const CartIconBadge({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // select() prevents rebuild when total or items list changes
    // -- only rebuilds when itemCount changes
    final count = ref.watch(
      cartNotifierProvider.select((state) => state.itemCount),
    );

    return Badge(
      label: Text('$count'),
      isLabelVisible: count > 0,
      child: const Icon(Icons.shopping_cart),
    );
  }
}

// lib/features/catalog/presentation/product_list_screen.dart
class ProductListScreen extends ConsumerWidget {
  const ProductListScreen({super.key, required this.categoryId});

  final String categoryId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncProducts = ref.watch(productListProvider(categoryId));

    // ref.listen for side effects (snackbar on error)
    ref.listen<AsyncValue<List<Product>>>(
      productListProvider(categoryId),
      (_, next) {
        next.whenOrNull(
          error: (e, _) => ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to load products: $e')),
          ),
        );
      },
    );

    return asyncProducts.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Could not load products'),
            TextButton(
              onPressed: () => ref.refresh(productListProvider(categoryId)),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
      data: (products) => ListView.builder(
        itemCount: products.length,
        itemBuilder: (context, index) => ProductCard(product: products[index]),
      ),
    );
  }
}
```

### Test Example

```dart
// test/features/auth/auth_notifier_test.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late MockAuthRepository mockRepo;
  late ProviderContainer container;

  setUp(() {
    mockRepo = MockAuthRepository();
    container = ProviderContainer(overrides: [
      authRepositoryProvider.overrideWithValue(mockRepo),
    ]);
    addTearDown(container.dispose);
  });

  test('emits authenticated state after successful login', () async {
    final fakeUser = User(id: 'u1', email: 'test@example.com', displayName: 'Test');

    when(() => mockRepo.getStoredUser()).thenAnswer((_) async => null);
    when(() => mockRepo.login(email: 'test@example.com', password: 'secret'))
        .thenAnswer((_) async => fakeUser);

    // Wait for initialization
    await Future.microtask(() {});

    expect(container.read(authNotifierProvider), isA<AuthUnauthenticated>());

    await container
        .read(authNotifierProvider.notifier)
        .login(email: 'test@example.com', password: 'secret');

    expect(
      container.read(authNotifierProvider),
      equals(AuthState.authenticated(fakeUser)),
    );
  });

  test('emits error state on AuthException', () async {
    when(() => mockRepo.getStoredUser()).thenAnswer((_) async => null);
    when(() => mockRepo.login(email: any(named: 'email'), password: any(named: 'password')))
        .thenThrow(AuthException('Invalid credentials'));

    await Future.microtask(() {});

    await container
        .read(authNotifierProvider.notifier)
        .login(email: 'x@x.com', password: 'wrong');

    expect(
      container.read(authNotifierProvider),
      equals(const AuthState.error('Invalid credentials')),
    );
  });
}
```

## File Structure

```
lib/
  core/
    providers/
      http_client_provider.dart    (Dio with auth interceptor)
      secure_storage_provider.dart
      isar_provider.dart
    models/
      app_config.dart
  features/
    auth/
      data/
        auth_repository.dart       (abstract)
        auth_repository_impl.dart
      domain/
        user.dart
      presentation/
        auth_state.dart
        auth_state.freezed.dart    (generated)
        auth_notifier.dart
        login_screen.dart
      auth_providers.dart
    catalog/
      data/
        product_repository.dart
        product_repository_impl.dart
      domain/
        product.dart
        category.dart
      presentation/
        product_list_state.dart
        product_list_notifier.dart
        product_list_screen.dart
        product_card.dart
      catalog_providers.dart
    cart/
      data/
        cart_repository.dart
        cart_repository_impl.dart
      domain/
        cart_item.dart
      presentation/
        cart_state.dart
        cart_notifier.dart
        cart_screen.dart
        cart_icon_badge.dart
      cart_providers.dart
    orders/
      data/
        order_repository.dart
        order_repository_impl.dart
      domain/
        order.dart
      presentation/
        order_list_screen.dart
        order_detail_screen.dart
      orders_providers.dart
  main.dart
test/
  features/
    auth/
      auth_notifier_test.dart
    cart/
      cart_notifier_test.dart
    catalog/
      product_list_notifier_test.dart
  widget_test/
    cart_icon_badge_test.dart
    product_list_screen_test.dart
```

## Performance Checklist

- [ ] `cartNotifierProvider.select()` used in CartIconBadge so badge-only rebuilds don't cascade to scaffold
- [ ] `productListProvider.family(categoryId).autoDispose` applied -- products not cached after screen exit
- [ ] `authNotifierProvider` is global (no autoDispose) -- auth state persists across navigation
- [ ] `buildWhen` or `select()` applied in any widget reading both `isUpdating` and `items` from CartState
- [ ] `ref.listen` used for snackbar/dialog side effects in ProductListScreen -- not inside build()
- [ ] Error states handled with retry button for all FutureProvider-backed screens
- [ ] `if (!context.mounted) return;` guard added after every async gap that references context
- [ ] All state classes use freezed or manually implement == and hashCode for value equality
