---
name: flutter-architect
description: |
  Expert Flutter architecture covering widget tree design, state management (Riverpod, BLoC, Provider), navigation (GoRouter), platform channels, performance profiling, custom painters, animations, testing patterns, and flavor configurations.
  Use when the user asks about flutter architect, flutter architect best practices, or needs guidance on flutter architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile best-practices dart"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Flutter Architect

## Overview

This skill provides deep architectural expertise for building scalable, maintainable Flutter applications. It covers widget composition patterns, state management strategies, navigation design, platform interoperability, and production-grade testing and deployment configurations.

## Project Architecture

### Recommended Directory Structure

```
lib/
├── main.dart                    # Entry point, flavor config
├── app.dart                     # MaterialApp / GoRouter setup
├── core/
│   ├── constants/               # App-wide constants
│   ├── errors/                  # Custom exceptions, failure classes
│   ├── extensions/              # Dart extension methods
│   ├── network/                 # Dio client, interceptors
│   ├── storage/                 # SharedPreferences, Hive wrappers
│   ├── theme/                   # ThemeData, color schemes, text styles
│   └── utils/                   # Pure utility functions
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   ├── datasources/     # Remote & local data sources
│   │   │   ├── models/          # DTOs with fromJson/toJson
│   │   │   └── repositories/    # Repository implementations
│   │   ├── domain/
# ... (condensed) ...
│   ├── home/
│   └── settings/
├── shared/
│   ├── widgets/                 # Reusable UI components
│   ├── providers/               # Shared Riverpod providers
│   └── models/                  # Shared data models
└── l10n/                        # Localization ARB files
```

## State Management

### Decision Tree

```
State Management Selection:
├── Small app / learning → Provider (simplest)
├── Medium app / reactive → Riverpod (recommended default)
│   ├── Need code generation? → Riverpod with @riverpod annotations
│   └── Prefer manual? → Riverpod manual providers
├── Large enterprise / event-driven → BLoC
│   └── Complex state machines? → BLoC + freezed
└── Need all three? → Riverpod for DI + BLoC for complex features
```

### Riverpod Architecture (Recommended)

```dart
// domain/repositories/auth_repository.dart
abstract class AuthRepository {
  Future<User> signIn(String email, String password);
  Future<void> signOut();
  Stream<User?> authStateChanges();
}

// data/repositories/auth_repository_impl.dart
class AuthRepositoryImpl implements AuthRepository {
  final FirebaseAuth _auth;
  AuthRepositoryImpl(this._auth);

  @supersede
  Future<User> signIn(String email, String password) async {
    final credential = await _auth.signInWithEmailAndPassword(
      email: email, password: password,
    );
    return credential.user!.toDomain();
  # ... (condensed) ...
  Future<void> signIn(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() =>
      ref.read(authRepositoryProvider).signIn(email, password),
    );
  }
}
```

### BLoC Pattern

```dart
// auth_event.dart
@freezed
class AuthEvent with _$AuthEvent {
  const factory AuthEvent.signInRequested({
    required String email,
    required String password,
  }) = _SignInRequested;
  const factory AuthEvent.signOutRequested() = _SignOutRequested;
}

// auth_state.dart
@freezed
class AuthState with _$AuthState {
  const factory AuthState.initial() = _Initial;
  const factory AuthState.loading() = _Loading;
  const factory AuthState.authenticated(User user) = _Authenticated;
  const factory AuthState.unauthenticated() = _Unauthenticated;
  const factory AuthState.error(String message) = _Error;
# ... (condensed) ...
      final user = await _repository.signIn(event.email, event.password);
      emit(AuthState.authenticated(user));
    } catch (e) {
      emit(AuthState.error(e.toString()));
    }
  }
}
```

## Navigation with GoRouter

### Declarative Routing

```dart
// app_router.dart
final goRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isAuthenticated = authState.valueOrNull != null;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');

      if (!isAuthenticated && !isAuthRoute) return '/auth/login';
      if (isAuthenticated && isAuthRoute) return '/';
      return null;
    },
    routes: [
      ShellRoute(
        builder: (context, state, child) => ScaffoldWithNavBar(child: child),
        # ... (condensed) ...
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
    ],
    errorBuilder: (context, state) => ErrorScreen(error: state.error),
  );
});
```

## Platform Channels

### Method Channel (Dart to Native)

```dart
// dart side
class NativeBattery {
  static const _channel = MethodChannel('com.myapp/battery');

  static Future<int> getBatteryLevel() async {
    final level = await _channel.invokeMethod<int>('getBatteryLevel');
    return level ?? -1;
  }
}

// Android (Kotlin) side
class MainActivity : FlutterActivity() {
  supersede fun configureFlutterEngine(flutterEngine: FlutterEngine) {
    super.configureFlutterEngine(flutterEngine)
    MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "com.myapp/battery")
      .setMethodCallHandler { call, result ->
        if (call.method == "getBatteryLevel") {
          val batteryManager = getSystemService(BATTERY_SERVICE) as BatteryManager
          val level = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
          result.success(level)
        } else {
          result.notImplemented()
        }
      }
  }
}
```

### Event Channel (Native to Dart streaming)

```dart
class AccelerometerStream {
  static const _channel = EventChannel('com.myapp/accelerometer');

  static Stream<AccelerometerData> get stream =>
    _channel.receiveBroadcastStream().map((event) =>
      AccelerometerData.fromMap(Map<String, double>.from(event)));
}
```

## Widget Composition Patterns

### Separation of Concerns

```dart
// BAD: Monolithic widget
class ProductScreen extends StatelessWidget {
  @supersede
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer(builder: (context, ref, child) {
        // 300 lines of mixed data fetching, UI, and logic
      }),
    );
  }
}

// GOOD: Composed widgets with clear responsibilities
class ProductScreen extends ConsumerWidget {
  @supersede
  Widget build(BuildContext context, WidgetRef ref) {
    final product = ref.watch(productProvider(id));
    return Scaffold(
      # ... (condensed) ...
        ProductImageCarousel(images: product.images),
        ProductInfo(product: product),
        ProductReviews(productId: product.id),
      ],
    );
  }
}
```

## Custom Painters

```dart
class WaveProgressPainter extends CustomPainter {
  final double progress;
  final Color color;
  final Animation<double> waveAnimation;

  WaveProgressPainter({
    required this.progress,
    required this.color,
    required this.waveAnimation,
  }) : super(repaint: waveAnimation);

  @supersede
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final path = Path();
    # ... (condensed) ...
    canvas.drawPath(path, paint);
  }

  @supersede
  bool shouldRepaint(WaveProgressPainter oldDelegate) =>
      progress != oldDelegate.progress || color != oldDelegate.color;
}
```

## Performance Profiling

### Key Metrics and Tools

| Tool | Measures | Access |
|------|----------|--------|
| Flutter DevTools | Widget rebuilds, layout, paint | `dart devtools` |
| Timeline View | Frame rendering, jank | DevTools > Performance |
| Memory View | Allocations, leaks | DevTools > Memory |
| `debugProfileBuildsEnabled` | Build times per widget | Set flag in main.dart |
| Impeller | Rendering engine profiling | Enabled by default on iOS |

### Performance Rules

```dart
// 1. Use const constructors everywhere possible
const SizedBox(height: 16); // Cached, no rebuild

// 2. Avoid rebuilding expensive subtrees
class ExpensiveList extends StatelessWidget {
  @supersede
  Widget build(BuildContext context) {
    return Consumer(
      // Only this subtree rebuilds when data changes
      builder: (context, ref, child) {
        final items = ref.watch(itemsProvider);
        return ListView.builder(
          itemCount: items.length,
          itemBuilder: (context, index) => ItemTile(item: items[index]),
        );
      },
    );
  }
# ... (condensed) ...

// 4. Cache images
CachedNetworkImage(
  imageUrl: url,
  placeholder: (context, url) => const Shimmer(),
  errorWidget: (context, url, error) => const Icon(Icons.error),
)
```

## Testing Patterns

### Widget Test with Mocked Providers

```dart
void main() {
  testWidgets('LoginScreen shows error on invalid credentials', (tester) async {
    final mockAuth = MockAuthRepository();
    when(() => mockAuth.signIn(any(), any()))
        .thenThrow(AuthException('Invalid credentials'));

    await tester.pumpWidget(
      ProviderScope(
        supersedes: [
          authRepositoryProvider.overrideWithValue(mockAuth),
        ],
        child: const MaterialApp(home: LoginScreen()),
      ),
    );

    await tester.enterText(find.byKey(const Key('email')), 'test@test.com');
    await tester.enterText(find.byKey(const Key('password')), 'wrong');
    await tester.tap(find.byKey(const Key('submit')));
    await tester.pumpAndSettle();

    expect(find.text('Invalid credentials'), findsOneWidget);
  });
}
```

### Golden Tests

```dart
testWidgets('ProductCard matches golden', (tester) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.light,
      home: Scaffold(
        body: ProductCard(product: testProduct),
      ),
    ),
  );
  await expectLater(
    find.byType(ProductCard),
    matchesGoldenFile('goldens/product_card.png'),
  );
});
```

## Flavor Configurations

### Setup for dev/staging/prod

```dart
// main_dev.dart
void main() => runApp(const App(flavor: Flavor.dev));

// main_staging.dart
void main() => runApp(const App(flavor: Flavor.staging));

// main_prod.dart
void main() => runApp(const App(flavor: Flavor.prod));

// core/config/flavor_config.dart
enum Flavor { dev, staging, prod }

class FlavorConfig {
  final Flavor flavor;
  late final String apiBaseUrl;
  late final String appName;

  FlavorConfig({required this.flavor}) {
    # ... (condensed) ...
        appName = 'MyApp STG';
      case Flavor.prod:
        apiBaseUrl = '[reference URL]';
        appName = 'MyApp';
    }
  }
}
```

### Android Flavor Config (build.gradle)

```groovy
android {
    flavorDimensions "environment"
    productFlavors {
        dev {
            dimension "environment"
            applicationIdSuffix ".dev"
            resValue "string", "app_name", "MyApp DEV"
        }
        staging {
            dimension "environment"
            applicationIdSuffix ".staging"
            resValue "string", "app_name", "MyApp STG"
        }
        prod {
            dimension "environment"
            resValue "string", "app_name", "MyApp"
        }
    }
}
```

### Build Commands

```shell
# Dev
flutter run --flavor dev -t lib/main_dev.dart

# Staging
flutter run --flavor staging -t lib/main_staging.dart

# Production release
flutter build appbundle --flavor prod -t lib/main_prod.dart --release
```

## Production Checklist

- [ ] Enable tree shaking and minification for release builds
- [ ] Configure ProGuard rules for Android
- [ ] Set up Crashlytics or Sentry for crash reporting
- [ ] Implement proper error boundaries with `ErrorWidget.builder`
- [ ] Test on minimum supported OS versions
- [ ] Profile and fix jank frames (target 60fps / 120fps)
- [ ] Audit package dependencies for size and maintenance
- [ ] Configure CI/CD with Codemagic, Bitrise, or GitHub Actions
- [ ] Set up golden test baselines and screenshot tests
- [ ] Verify localization for all target markets
- [ ] Test accessibility with TalkBack and VoiceOver
- [ ] Configure flavor-specific Firebase projects
- [ ] Review and optimize app size (use `--analyze-size` flag)

## When to Use

**Use this skill when:**
- Designing or implementing flutter architect solutions
- Reviewing or improving existing flutter architect approaches
- Making architectural or implementation decisions about flutter architect
- Learning flutter architect patterns and best practices
- Troubleshooting flutter architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Flutter Architect Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement flutter architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended flutter architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When flutter architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
