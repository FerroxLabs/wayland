---
name: flutter-architecture-patterns
description: |
  Guides expert-level flutter architecture patterns implementation: dart and architecture decision frameworks, production-ready patterns, and concrete templates for flutter architecture patterns workflows.
  Use when the user asks about flutter architecture patterns, flutter architecture patterns configuration, or mobile best practices for flutter projects.
  Do NOT use when the user needs a different mobile development capability -- check sibling skills in the mobile development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile dart architecture"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Flutter Architecture Patterns

## When to Use

**Use this skill when:**
- The user is starting a new Flutter project and needs to choose between BLoC, Riverpod, Provider, GetX, MobX, or Redux as their primary architecture pattern
- The user has a Flutter app with growing complexity -- typically 10+ screens or 3+ developers -- and needs to introduce a structured architecture
- The user is experiencing state management problems: UI not updating correctly, business logic scattered across widgets, or difficulty writing unit tests for app logic
- The user wants to implement a clean separation of layers (presentation, domain, data) in a Flutter project using MVVM, MVC, or Clean Architecture principles
- The user needs to design a feature module structure, navigation architecture, or dependency injection strategy for a Flutter codebase
- The user is migrating from one state management solution to another (e.g., from Provider to Riverpod) and needs a safe, incremental strategy
- The user wants production-ready patterns for offline-first data, background sync, real-time updates via WebSockets, or complex form state

**Do NOT use this skill when:**
- The user needs help with a specific Flutter widget layout or animation -- use the Flutter UI/widget skill instead
- The user is asking about Dart language fundamentals like async/await, streams, or generics in isolation -- use the Dart language skill
- The user needs native iOS or Android integration (platform channels, Kotlin/Swift code) -- use the platform integration skill
- The user is building a Flutter web or desktop app with fundamentally different UX requirements -- note overlaps but flag platform-specific concerns
- The user needs CI/CD pipeline setup, app signing, or deployment to app stores -- use the Flutter DevOps skill
- The user is asking about a non-Flutter mobile framework (React Native, Ionic, MAUI) -- use the appropriate mobile framework skill
- The user only needs to fix a specific bug with no architectural implications -- do not introduce architectural overhead for a simple debugging question

---

## Process

### 1. Diagnose the Project Context and Constraints

Before recommending any architecture, gather these specifics:

- **Team size and experience:** A solo developer or a 2-person team should use simpler patterns (Riverpod with StateNotifier or Provider with ChangeNotifier) -- BLoC's boilerplate is a liability when there is no team convention enforcement benefit. Teams of 5+ benefit from BLoC's strict event/state separation because it enforces discipline across contributors.
- **App complexity tier:** Classify the app as Tier 1 (< 10 screens, mostly read-only data, no complex business logic), Tier 2 (10--50 screens, CRUD operations, user authentication, moderate offline requirements), or Tier 3 (50+ screens, real-time data, multi-role permissions, complex offline sync, financial or healthcare domain). Architecture choice scales with tier.
- **Testability requirements:** If the team has a > 70% code coverage target or requires strict unit testing of business logic, avoid architectures that couple business logic to the widget tree (raw setState, InheritedWidget misuse). BLoC and Riverpod are most amenable to pure Dart unit tests.
- **Navigation complexity:** Determine if the app uses simple linear navigation, nested navigators (tabs with their own stacks), or deep linking with auth guards. Navigation architecture (go_router vs. auto_route vs. Navigator 2.0 manually) must be decided before feature architecture because it affects how routes are structured and how state is scoped.
- **Existing codebase:** If migrating, identify the percentage of screens using setState vs. an existing solution. Map out which features have the highest change frequency -- those are migration candidates first.

### 2. Select the Primary State Management Pattern

Apply this decision framework based on gathered context:

- **Use Riverpod (with code generation via riverpod_generator) when:** The team is comfortable with Dart, the app is Tier 1 or Tier 2, testability is important, and you want compile-time safety without excessive boilerplate. Riverpod's provider scoping (ProviderScope overrides) is superior for testing -- you can swap any provider with a fake in tests without dependency injection frameworks.
- **Use BLoC (flutter_bloc) when:** The app is Tier 2 or Tier 3, the team has 4+ developers, event-driven thinking matches the domain (user actions as discrete events), and auditability of state transitions matters (e.g., fintech, healthcare). BLoC forces a unidirectional data flow: Event -> BLoC -> State -> UI. Every state transition is an explicit, testable object.
- **Use Provider (with ChangeNotifier) when:** The team is migrating from an older codebase, the app is Tier 1, or Flutter experience is limited. Provider is the lowest learning curve entry point. Plan to migrate to Riverpod as the app grows -- Riverpod was designed as Provider's successor.
- **Avoid GetX for production team projects:** GetX conflates routing, state management, and dependency injection into a single package with non-idiomatic Dart patterns. It breaks hot reload in some scenarios, its Rx pattern bypasses Flutter's build system, and the global controller registry creates hidden dependencies that are difficult to test and reason about.
- **Use MobX when:** The team has React/MobX background and the domain has heavily reactive, observable state graphs. MobX's code generation (build_runner) and `@observable`/`@action` annotations are familiar to React developers. However, the generated code can obscure performance issues.
- **Avoid Redux in new Flutter projects:** Redux's reducer/action boilerplate is disproportionate for Dart, and its benefits (time-travel debugging, strict immutability) are better achieved with BLoC in the Flutter ecosystem. redux.dart is not actively maintained.

### 3. Design the Layer Architecture

Implement a layered architecture appropriate to the tier:

- **Tier 1 -- Simple layered (2 layers):**
  ```
  lib/
    features/
      auth/
        auth_screen.dart
        auth_notifier.dart   # StateNotifier or ChangeNotifier
        auth_repository.dart # Raw data access
    shared/
      services/
      widgets/
    main.dart
  ```
  Business logic lives in the notifier. Repository handles HTTP/local storage. No separate domain layer.

- **Tier 2 -- Feature-first with repositories (3 layers):**
  ```
  lib/
    features/
      orders/
        data/
          order_repository_impl.dart
          order_remote_data_source.dart
          order_local_data_source.dart  # Hive or Drift tables
        domain/
          order.dart              # Pure Dart entity, no Flutter imports
          order_repository.dart   # Abstract interface
          get_orders_use_case.dart
        presentation/
          bloc/                   # Or notifier/
            order_cubit.dart
            order_state.dart
          screens/
            order_list_screen.dart
          widgets/
            order_card.dart
    core/
      error/
        failure.dart
        exceptions.dart
      network/
        network_info.dart
        api_client.dart
    injection_container.dart
  ```

- **Tier 3 -- Clean Architecture with domain isolation:**
  Add a `packages/` or monorepo workspace structure. Extract the domain layer into a pure Dart package with zero Flutter dependencies. This allows the domain to be tested without a Flutter test runner and shared across Flutter, Dart CLI, or server-side Dart projects. Use get_it + injectable for dependency injection -- injectable generates the registration code from annotations, reducing the injection_container.dart maintenance burden as the project grows.

- **Domain entity rules:** Entities must be pure Dart classes. Use `equatable` (extending `Equatable` and overriding `props`) for value equality. Never import `flutter/material.dart` or any Flutter package in the domain layer -- enforce this with a lint rule or package boundary.

- **Use cases (interactors):** Each use case is a single-responsibility class with a `call` method. Return types should use `Either<Failure, T>` from the `fpdart` or `dartz` package for explicit error handling without exceptions bubbling through layers. Example: `Either<Failure, List<Order>> call(GetOrdersParams params)`.

### 4. Design the Navigation Architecture

Navigation is a cross-cutting concern that must be decided early:

- **Use go_router for Tier 1 and Tier 2 apps:** go_router provides declarative URL-based routing, deep link support, nested navigation (ShellRoute), and redirect guards for authentication. Configure routes in a single `router.dart` file. Use `GoRoute` with `builder` (not `pageBuilder`) unless you need custom page transitions.
- **Authentication guards:** Implement as a `redirect` callback on GoRouter. Check an auth state (from a Riverpod provider or BLoC state) and redirect unauthenticated users to `/login`. Use `refreshListenable` to re-evaluate the redirect when auth state changes -- pass a `GoRouterRefreshStream` wrapping your auth stream.
- **Use auto_route for Tier 3 apps with complex nested navigation:** auto_route generates type-safe route classes from annotations. The `@RoutePage()` annotation on a screen widget generates a corresponding route class. This eliminates string-based routing errors. The `AutoTabsRouter` handles tab navigation with preserved state per tab.
- **Avoid Navigator 1.0 (push/pop) for anything beyond the simplest apps:** It does not support deep linking, URL-based navigation (important even for mobile for debugging and testing), or proper back-button handling on Android. The `Navigator.of(context).push(...)` pattern scatters navigation logic across the widget tree.
- **Pass minimal data through routes:** Route parameters should be IDs, not entire objects. The destination screen fetches data using the ID. This prevents stale data in navigation arguments and makes deep links trivial -- a deep link only needs the ID, not a reconstructed object graph.

### 5. Implement Dependency Injection

- **For Riverpod projects:** Riverpod providers ARE your DI container. Define repository providers and service providers at the top level. Use `ref.watch` for reactive dependencies and `ref.read` in callbacks. Override providers in tests using `ProviderContainer` with `overrides`. No separate DI framework is needed.
- **For BLoC projects:** Use get_it with the injectable package. Annotate repositories with `@lazySingleton`, use cases with `@injectable`, and BLoCs/Cubits with `@injectable` (not singleton -- each screen creates a new instance). Run `build_runner` to generate `injection_container.g.dart`. Register the container in `main.dart` before `runApp`.
- **Service locator anti-pattern:** Never call `GetIt.instance<MyRepository>()` from inside a widget or BLoC. Inject dependencies through constructors. The service locator is only called at the composition root (the BLoC's `create` factory in a `BlocProvider`).
- **Environment-specific registration:** Use `@Environment('dev')` and `@Environment('prod')` injectable annotations to register different implementations (e.g., a mock HTTP client vs. real Dio client) based on build flavor. Select the environment in `configureDependencies(environment: Environment.prod)`.

### 6. Design the Data Layer for Offline-First and Error Resilience

- **Repository pattern as the single truth gate:** The presentation layer never knows if data comes from network or cache. The repository decides: check local cache, return it immediately (optimistic UI), then fetch from network, update the cache, and emit an updated state. Use Drift (formerly moor) for structured relational local data -- it supports full SQL, migrations, and reactive streams via `watchSingleOrThrow`. Use Hive for simpler key-value or object storage.
- **Network layer with Dio:** Configure Dio with interceptors for: auth token injection (via header interceptor), retry logic (dio_smart_retry -- 3 retries with exponential backoff, starting at 1 second, maximum 8 seconds), response logging (only in debug builds), and connectivity checking (connectivity_plus -- throw a `NetworkFailure` if no connection before making the request).
- **Failure modeling:** Define a sealed class hierarchy for failures:
  ```dart
  sealed class Failure {
    const Failure(this.message);
    final String message;
  }
  class NetworkFailure extends Failure { ... }
  class ServerFailure extends Failure { ... }
  class CacheFailure extends Failure { ... }
  class ValidationFailure extends Failure { ... }
  ```
  Map HTTP status codes to specific failures: 401 -> trigger logout flow, 403 -> show permission denied, 422 -> ValidationFailure with field errors, 5xx -> ServerFailure with retry option.
- **Background sync:** For apps that must work offline and sync later, use WorkManager (workmanager package) to schedule background tasks. Store pending mutations in a local "outbox" table in Drift. The sync worker reads the outbox, retries HTTP mutations, and marks rows as synced or failed. Conflict resolution strategy (last-write-wins, server-wins, or manual merge) must be decided in the domain layer.

### 7. Implement Testing Strategy Per Layer

- **Domain layer (pure Dart, no Flutter):** 100% unit test coverage is achievable and required. Test use cases with mock repositories (mockito or mocktail). Test entity equality, use case error propagation, and failure mapping. These tests run without the Flutter test runner -- `dart test` is sufficient.
- **Data layer:** Test repository implementations with a mock data source. Test the remote data source with a mock Dio client (using dioAdapter or mockito). Test local data sources with an in-memory SQLite database (use `inMemoryDatabaseBuilder` for Drift). Test the JSON parsing of every API response model -- one real API payload JSON file per endpoint.
- **BLoC/Cubit layer:** Use `bloc_test` (the `blocTest` function) for golden-path and error-path state transitions. Each test specifies `build`, `act` (events), and `expect` (emitted states). Test every event-to-state transition. Mock the use case with mocktail. A BLoC with 5 events should have at minimum 10 test cases (success + failure for each).
- **Widget layer:** Use `flutter_test` with `WidgetTester`. Test widgets in isolation by overriding providers (Riverpod) or wrapping with a seeded BlocProvider. Use `find.byType` and `find.text` for assertions. Use `golden_toolkit` for visual regression tests on design-critical components (cards, modals, custom painters).
- **Integration and E2E:** Use Patrol (by LeanCode) for E2E tests that interact with real platform UI, including native dialogs, permissions, and push notifications. Use `integration_test` package for in-process integration tests that can access providers and verify navigation. Run E2E tests on physical devices in CI using a device farm (Firebase Test Lab is the standard).

### 8. Enforce Architecture with Linting and Code Generation

- **Flutter lints + custom analysis options:** Start with `flutter_lints`. Add `package:lints/recommended.yaml`. Enable `avoid_dynamic_calls`, `always_use_package_imports`, `prefer_relative_imports: false` (choose one and enforce it), and `public_member_api_docs` for shared packages.
- **dart_code_metrics:** Use for architectural metrics: lines per method (max 40), cyclomatic complexity per method (max 10), number of parameters per function (max 5). Configure as an analysis plugin so violations appear in the IDE.
- **build_runner for code generation:** The following packages require build_runner: freezed (immutable state classes with copyWith, pattern matching), json_serializable (JSON parsing), riverpod_generator (provider generation), injectable (DI registration), auto_route (type-safe routes). Run `dart run build_runner build --delete-conflicting-outputs` after any annotated class changes. Add this to the CI pipeline.
- **Freezed for BLoC states and events:** Define BLoC states as `@freezed` classes. This gives you immutable value types, `copyWith`, pattern matching with `when`/`map`, and `toString` for debugging -- all generated. An `OrderState` with loading, loaded, and error variants takes 15 lines with Freezed vs. 80+ lines manually.

---

## Output Format

Deliver the following artifacts when helping a user design or evaluate Flutter architecture:

### Architecture Decision Summary

```
## Flutter Architecture Decision Summary

### Project Classification
- Tier: [1 / 2 / 3]
- Team Size: [N developers]
- Target Platforms: [iOS / Android / Web / Desktop]
- Primary Complexity Driver: [offline sync / real-time / complex state / scale]

### Selected Patterns
| Concern                | Decision                  | Rationale                          |
|------------------------|---------------------------|------------------------------------|
| State Management       | [BLoC / Riverpod / Other] | [specific reason for this project] |
| Navigation             | [go_router / auto_route]  | [specific reason for this project] |
| Dependency Injection   | [Riverpod / get_it+inj]   | [specific reason for this project] |
| Local Storage          | [Drift / Hive / Shared P] | [specific reason for this project] |
| HTTP Client            | Dio + interceptors         | [interceptor configuration]        |
| Error Handling         | Either<Failure,T> / sealed| [failure type hierarchy]           |
| Code Generation        | [freezed / json_ser / etc]| [list of packages]                 |

### Directory Structure
lib/
  core/
    error/
    network/
    utils/
  features/
    [feature_name]/
      data/
      domain/
      presentation/
  injection_container.dart
  router.dart
  main.dart

### Key Package Versions (lock to these)
- flutter_bloc / bloc: ^8.x
- riverpod / flutter_riverpod / riverpod_annotation: ^2.x
- go_router: ^13.x
- get_it: ^7.x / injectable: ^2.x
- drift: ^2.x
- freezed: ^2.x / freezed_annotation: ^2.x
- fpdart or dartz: [version]
- dio: ^5.x
- mocktail: ^1.x
- bloc_test: ^9.x
```

### State Class Template (Freezed + BLoC)

```dart
// order_state.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import '../../domain/order.dart';
import '../../../../core/error/failure.dart';

part 'order_state.freezed.dart';

@freezed
class OrderState with _$OrderState {
  const factory OrderState.initial() = _Initial;
  const factory OrderState.loading() = _Loading;
  const factory OrderState.loaded({required List<Order> orders}) = _Loaded;
  const factory OrderState.error({required Failure failure}) = _Error;
}
```

### BLoC Template

```dart
// order_cubit.dart
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/get_orders_use_case.dart';
import 'order_state.dart';

class OrderCubit extends Cubit<OrderState> {
  OrderCubit({required GetOrdersUseCase getOrders})
      : _getOrders = getOrders,
        super(const OrderState.initial());

  final GetOrdersUseCase _getOrders;

  Future<void> loadOrders(String userId) async {
    emit(const OrderState.loading());
    final result = await _getOrders(GetOrdersParams(userId: userId));
    result.fold(
      (failure) => emit(OrderState.error(failure: failure)),
      (orders) => emit(OrderState.loaded(orders: orders)),
    );
  }
}
```

### Repository Interface Template

```dart
// domain/order_repository.dart
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import 'order.dart';

abstract interface class OrderRepository {
  Future<Either<Failure, List<Order>>> getOrders(String userId);
  Future<Either<Failure, Order>> getOrderById(String orderId);
  Future<Either<Failure, Unit>> createOrder(Order order);
}
```

---

## Rules

1. **Never import Flutter packages in the domain layer.** If `import 'package:flutter/material.dart'` appears in any file under `features/*/domain/` or `packages/domain/`, it is an architectural violation. Enforce with a custom lint rule or CI script that greps for flutter imports in the domain directory.

2. **Never use BuildContext across asynchronous gaps without checking mounted.** In Flutter 3.7+, use the `mounted` check after every `await` before calling `context.read`, `Navigator.of(context)`, or `ScaffoldMessenger.of(context)`. In a Cubit/BLoC, never hold a reference to BuildContext -- emit a state instead and let the UI react.

3. **Never call setState inside a widget that receives state from a state manager.** Mixing setState with BLoC or Riverpod in the same widget creates double-rebuild bugs and unpredictable state. If a widget uses `BlocBuilder` or `Consumer`, all local state must use separate stateful widgets or Riverpod state providers scoped to the widget's lifecycle.

4. **Scope state to the smallest necessary subtree.** BlocProvider and ProviderScope should wrap only the route or subtree that needs the state. Providing all BLoCs at the MaterialApp level causes memory leaks (BLoCs that should be disposed when a route is popped remain alive) and makes the widget tree impossible to reason about.

5. **Never expose repository implementation details to the presentation layer.** The `OrderRepositoryImpl` class, Drift DAO, Hive box, or Dio response model must never appear in a Cubit, BLoC, or Riverpod notifier. The domain repository interface is the only boundary allowed.

6. **Use Cubit over BLoC when there is no complex event-to-state mapping.** Cubit is a simplified BLoC without events -- call methods directly instead of dispatching events. The rule of thumb: if a BLoC would have only one event type per state transition (LoadOrders -> OrdersLoaded, LoadOrders -> OrdersError), use Cubit. Add BLoC only when event chaining, event transformers (debounce, throttle), or event history matter.

7. **Never swallow failures silently.** Every `Either.fold` must handle the `Left` (failure) case explicitly. Every `catchError` must emit an error state, log to a crash reporter (Firebase Crashlytics or Sentry), and present user-facing feedback. A `try/catch` block with an empty `catch` clause is a critical architecture violation.

8. **Lock package versions in pubspec.yaml using exact minor constraints.** Use `^8.1.0` not `>=8.0.0`. BLoC, Riverpod, and go_router release minor versions that introduce breaking changes in generated code. Unpinned versions break code generation silently when a team member runs `flutter pub upgrade`.

9. **Never put navigation logic inside a BLoC or Cubit.** A BLoC emits states -- the UI layer (BlocListener) responds to state changes by navigating. Calling `context.go('/orders')` from inside a BLoC violates layer separation and makes the BLoC untestable in isolation. The pattern is: BLoC emits `OrderState.submitted()` -> BlocListener calls `context.go('/confirmation')`.

10. **Run build_runner in CI and fail the build if generated files are out of date.** Use `dart run build_runner build --delete-conflicting-outputs` followed by `git diff --exit-code` to detect uncommitted generated file changes. Developers who forget to regenerate files after changing annotated classes cause runtime crashes that are not caught by static analysis.

---

## Edge Cases

### Large Team with Mixed Experience Levels

When a team of 8+ engineers includes developers with varying Flutter experience, BLoC's rigid structure is an advantage, not a burden. The strict event/state separation means junior developers cannot accidentally break state by calling methods in the wrong order. Establish a feature template (a "feature shell" directory with pre-populated BLoC, repository interface, and use case stubs) that developers copy when starting a new feature. Use the `mason` CLI tool (Mason Bricks) to generate these templates from a `brick.yaml` definition. This ensures every new feature follows the agreed structure without requiring senior review of directory layout.

### Real-Time Data with WebSockets

When the app requires live updates (chat, financial tickers, live tracking), the data layer must handle stream lifecycle carefully. In a Riverpod project, use `StreamProvider` backed by a WebSocket service that wraps the `web_socket_channel` package. The provider's `onDispose` callback must close the channel. In a BLoC project, store the StreamSubscription as a field in the BLoC, subscribe in the constructor or in a dedicated `startWatching` event handler, and cancel it in the `close()` override. Never expose the raw stream directly to the widget -- always map it to typed domain events or states first. For reconnection, implement exponential backoff (initial 500ms, maximum 30 seconds, with jitter) and emit a `ConnectionLost` state that the UI uses to show a reconnecting indicator.

### Monorepo with Shared Code Across Multiple Flutter Apps

When a company has multiple Flutter apps sharing a design system and business logic, use a Dart monorepo with `melos` as the workspace manager. Structure: `packages/domain` (pure Dart, shared entities and repository interfaces), `packages/ui_kit` (Flutter widget library, no business logic), `packages/data` (repository implementations, can import both domain and HTTP/DB packages), `apps/consumer_app` and `apps/admin_app` (app-specific features only). Each package has its own `pubspec.yaml` with path dependencies. Run tests across all packages with `melos run test`. This prevents domain logic from being duplicated and ensures the design system stays consistent.

### Migrating a setState-Heavy Codebase to BLoC or Riverpod

Do not attempt a big-bang rewrite. Use the Strangler Fig pattern: identify the 3--5 screens with the most bugs or the highest change frequency, and migrate those first. For each screen, extract the business logic from the widget into a Cubit, keeping the widget's setState for purely local UI state (e.g., accordion expanded/collapsed, text field focus). The Cubit and the widget coexist temporarily. The rest of the app continues using setState. After the first batch proves stable, migrate the next batch. The migration is complete when no setState calls remain in screens (only in small local UI widgets). Track progress with a migration status doc showing each screen's current and target pattern.

### Testing with Flavors and Environment Configuration

Flutter apps commonly need dev, staging, and prod environments. Use `flutter_flavor` or a hand-rolled `AppConfig` class populated from `--dart-define` values at build time. The `AppConfig` singleton holds API base URLs, feature flags, and log levels. In the DI container, register environment-specific implementations based on `AppConfig.environment`. For tests, never rely on `--dart-define` values -- always inject configuration through the DI container's `overrides` mechanism so tests control their environment directly. Avoid `.env` files -- Flutter's compilation model does not support runtime file loading, and including secrets in assets is a security risk.

### Complex Form State with Validation

Multi-step forms with cross-field validation (e.g., password confirmation, date range where end must be after start, or a field that becomes required based on another field's value) should not be managed with a raw `Map<String, dynamic>`. Use the `formz` package: define a `FormzInput` subclass for each field that encapsulates its validation logic. The Cubit holds a `FormzStatus` and the collection of `FormzInput` instances. Each field change emits a new state with the updated field and the recomputed `FormzStatus`. The submit button's enabled state is derived directly from `state.status.isValidated`. This pattern is fully unit-testable -- test each `FormzInput` subclass independently, then test the Cubit's response to input changes.

### Performance Issues in Large Lists

When a `ListView.builder` inside a BlocBuilder causes jank during state updates, the problem is almost always that `BlocBuilder`'s `buildWhen` is not configured. Without `buildWhen`, every state emission (including loading states from an unrelated BLoC higher in the tree) triggers a rebuild of every list item. Fix: add `buildWhen: (previous, current) => previous.orders != current.orders` to rebuild only when the list data changes. For lists over 500 items, use `flutter_animate` with `const` constructors for list item widgets, enable `ListView.builder`'s `cacheExtent` (set to 1000.0 pixels), and ensure list item widgets extend `StatelessWidget` with `const` constructors so Flutter's element tree can diff them efficiently. Profile with `flutter run --profile` and the DevTools timeline -- a healthy 60fps list build should have no frames exceeding 16ms.

---

## Example

**Input:** "We're building a B2B order management app in Flutter. We have 5 developers, targeting iOS and Android. The app needs offline support for viewing recent orders, real-time status updates via WebSocket, and complex multi-step order creation forms. What architecture should we use?"

**Output:**

### Project Classification
- **Tier:** 3 -- Complex, multi-concern production app
- **Team Size:** 5 developers
- **Complexity Drivers:** Offline-first data, real-time WebSocket, complex form state

---

### Architecture Decision Summary

| Concern | Decision | Rationale |
|---|---|---|
| State Management | BLoC (flutter_bloc 8.x) + Cubit for simpler screens | Team of 5 needs enforced discipline; event-driven model matches order status domain |
| Navigation | go_router 13.x with ShellRoute | Deep links for order IDs, auth guards, tab navigation with preserved state per tab |
| Dependency Injection | get_it 7.x + injectable 2.x | BLoC pattern requires constructor injection; injectable generates DI boilerplate |
| Local Storage | Drift 2.x | Relational order data (orders, line items, statuses) requires SQL joins and reactive streams |
| Real-time | web_socket_channel + StreamSubscription in BLoC | Order status updates from WS mapped to BLoC events |
| HTTP Client | Dio 5.x with 3 interceptors | Auth, retry (3x exponential backoff), connectivity check |
| Error Handling | Either<Failure, T> via fpdart | All repository methods return Either; sealed Failure hierarchy |
| Form State | formz + OrderFormCubit | Multi-step form with per-field validation as FormzInput subclasses |
| Code Generation | freezed, json_serializable, injectable, build_runner | All states/events are Freezed classes; all JSON models are json_serializable |

---

### Directory Structure

```
lib/
  core/
    error/
      failure.dart          # sealed class Failure hierarchy
      exceptions.dart
    network/
      api_client.dart       # Dio instance with interceptors
      network_info.dart     # connectivity_plus wrapper
      websocket_service.dart
    di/
      injection_container.dart
      injection_container.g.dart  # generated
  features/
    auth/
      data/
        auth_repository_impl.dart
        auth_remote_data_source.dart
      domain/
        auth_repository.dart
        login_use_case.dart
        logout_use_case.dart
        user.dart
      presentation/
        cubit/
          auth_cubit.dart
          auth_state.dart
        screens/
          login_screen.dart
    orders/
      data/
        order_repository_impl.dart
        order_remote_data_source.dart
        order_local_data_source.dart  # Drift DAO
        models/
          order_model.dart            # json_serializable
          order_status_event_model.dart
        database/
          app_database.dart           # Drift database
          orders_dao.dart
      domain/
        order_repository.dart
        order.dart                    # Pure Dart entity, Equatable
        order_status.dart             # enum + sealed class
        get_orders_use_case.dart
        get_order_by_id_use_case.dart
        create_order_use_case.dart
      presentation/
        bloc/
          order_list_bloc.dart
          order_list_event.dart
          order_list_state.dart
        cubit/
          order_detail_cubit.dart
          order_detail_state.dart
          order_form_cubit.dart
          order_form_state.dart
        screens/
          order_list_screen.dart
          order_detail_screen.dart
          order_form_screen.dart
        widgets/
          order_card.dart
          order_status_badge.dart
          order_form_step_one.dart
          order_form_step_two.dart
  router.dart
  main.dart
```

---

### Key Implementation: Order List BLoC with Offline + Real-Time

```dart
// order_list_event.dart
import 'package:freezed_annotation/freezed_annotation.dart';
part 'order_list_event.freezed.dart';

@freezed
class OrderListEvent with _$OrderListEvent {
  const factory OrderListEvent.loadOrders({required String userId}) = _LoadOrders;
  const factory OrderListEvent.refreshOrders({required String userId}) = _RefreshOrders;
  const factory OrderListEvent.orderStatusUpdated({
    required String orderId,
    required OrderStatus newStatus,
  }) = _OrderStatusUpdated;
  const factory OrderListEvent.wsConnectionLost() = _WsConnectionLost;
  const factory OrderListEvent.wsReconnected() = _WsReconnected;
}

// order_list_state.dart
@freezed
class OrderListState with _$OrderListState {
  const factory OrderListState({
    @Default([]) List<Order> orders,
    @Default(false) bool isLoading,
    @Default(false) bool isRefreshing,
    @Default(false) bool wsDisconnected,
    Failure? failure,
  }) = _OrderListState;
}

// order_list_bloc.dart
class OrderListBloc extends Bloc<OrderListEvent, OrderListState> {
  OrderListBloc({
    required GetOrdersUseCase getOrders,
    required WebSocketService wsService,
  })  : _getOrders = getOrders,
        _wsService = wsService,
        super(const OrderListState()) {
    on<_LoadOrders>(_onLoadOrders);
    on<_OrderStatusUpdated>(_onOrderStatusUpdated);
    on<_WsConnectionLost>((_, emit) => emit(state.copyWith(wsDisconnected: true)));
    on<_WsReconnected>((_, emit) => emit(state.copyWith(wsDisconnected: false)));

    _wsSubscription = _wsService.orderStatusStream.listen(
      (event) => add(OrderListEvent.orderStatusUpdated(
        orderId: event.orderId,
        newStatus: event.status,
      )),
      onError: (_) => add(const OrderListEvent.wsConnectionLost()),
    );
  }

  final GetOrdersUseCase _getOrders;
  final WebSocketService _wsService;
  late final StreamSubscription _wsSubscription;

  Future<void> _onLoadOrders(_LoadOrders event, Emitter<OrderListState> emit) async {
    emit(state.copyWith(isLoading: true, failure: null));
    final result = await _getOrders(GetOrdersParams(userId: event.userId));
    result.fold(
      (failure) => emit(state.copyWith(isLoading: false, failure: failure)),
      (orders) => emit(state.copyWith(isLoading: false, orders: orders)),
    );
  }

  void _onOrderStatusUpdated(_OrderStatusUpdated event, Emitter<OrderListState> emit) {
    final updated = state.orders.map((order) {
      return order.id == event.orderId
          ? order.copyWith(status: event.newStatus)
          : order;
    }).toList();
    emit(state.copyWith(orders: updated));
  }

  @override
  Future<void> close() {
    _wsSubscription.cancel();
    return super.close();
  }
}
```

### Key Implementation: Multi-Step Order Form with formz

```dart
// form inputs (domain-level validation)
class CustomerName extends FormzInput<String, CustomerNameError> {
  const CustomerName.pure() : super.pure('');
  const CustomerName.dirty([super.value = '']) : super.dirty();

  @override
  CustomerNameError? validator(String value) {
    if (value.trim().isEmpty) return CustomerNameError.empty;
    if (value.trim().length < 2) return CustomerNameError.tooShort;
    return null;
  }
}

// order_form_cubit.dart
class OrderFormCubit extends Cubit<OrderFormState> {
  OrderFormCubit({required CreateOrderUseCase createOrder})
      : _createOrder = createOrder,
        super(const OrderFormState());

  final CreateOrderUseCase _createOrder;

  void customerNameChanged(String value) {
    final name = CustomerName.dirty(value);
    emit(state.copyWith(
      customerName: name,
      status: FormzStatus.validate([name, state.deliveryDate, state.lineItems]),
    ));
  }

  Future<void> submitOrder() async {
    if (!state.status.isValidated) return;
    emit(state.copyWith(submitting: true));
    final result = await _createOrder(CreateOrderParams(
      customerName: state.customerName.value,
      deliveryDate: state.deliveryDate.value,
    ));
    result.fold(
      (failure) => emit(state.copyWith(submitting: false, failure: failure)),
      (_) => emit(state.copyWith(submitting: false, submitted: true)),
    );
  }
}
```

### Navigation Configuration

```dart
// router.dart
final GoRouter appRouter = GoRouter(
  initialLocation: '/orders',
  refreshListenable: GoRouterRefreshStream(authBloc.stream),
  redirect: (context, state) {
    final authState = authBloc.state;
    final isLoggedIn = authState is AuthAuthenticated;
    final isLoggingIn = state.matchedLocation == '/login';
    if (!isLoggedIn && !isLoggingIn) return '/login';
    if (isLoggedIn && isLoggingIn) return '/orders';
    return null;
  },
  routes: [
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    ShellRoute(
      builder: (context, state, child) => AppShell(child: child),
      routes: [
        GoRoute(
          path: '/orders',
          builder: (_, __) => const OrderListScreen(),
          routes: [
            GoRoute(
              path: ':orderId',
              builder: (_, state) => OrderDetailScreen(
                orderId: state.pathParameters['orderId']!,
              ),
            ),
          ],
        ),
        GoRoute(
          path: '/orders/new',
          builder: (_, __) => const OrderFormScreen(),
        ),
      ],
    ),
  ],
);
```

### CI Enforcement (GitHub Actions excerpt)

```yaml
- name: Generate code
  run: dart run build_runner build --delete-conflicting-outputs

- name: Check for uncommitted generated files
  run: git diff --exit-code || (echo "Generated files out of date. Run build_runner." && exit 1)

- name: Run tests with coverage
  run: flutter test --coverage

- name: Enforce 80% coverage threshold
  run: lcov --summary coverage/lcov.info | grep "lines" | awk '{print $2}' |
       awk -F'%' '$1 < 80 {print "Coverage below 80%"; exit 1}'
```

### Recommended Package Versions (pubspec.yaml)

```yaml
dependencies:
  flutter_bloc: ^8.1.3
  bloc: ^8.1.2
  go_router: ^13.2.0
  get_it: ^7.6.7
  injectable: ^2.3.2
  drift: ^2.14.1
  sqlite3_flutter_libs: ^0.5.18
  dio: ^5.4.0
  dio_smart_retry: ^6.0.0
  connectivity_plus: ^5.0.2
  web_socket_channel: ^2.4.0
  fpdart: ^1.1.0
  freezed_annotation: ^2.4.1
  json_annotation: ^4.8.1
  equatable: ^2.0.5
  formz: ^0.7.0

dev_dependencies:
  build_runner: ^2.4.8
  freezed: ^2.4.5
  json_serializable: ^6.7.1
  injectable_generator: ^2.4.1
  drift_dev: ^2.14.1
  flutter_test:
    sdk: flutter
  bloc_test: ^9.1.5
  mocktail: ^1.0.2
  golden_toolkit: ^0.15.0
```

This architecture supports the full complexity of the B2B order management domain while remaining testable at every layer, maintainable by a 5-person team, and extensible as the feature set grows. Begin with the orders feature as the reference implementation -- once the team has internalized the pattern with one full-stack feature (data through presentation, with tests), subsequent features follow the same template with high consistency.
