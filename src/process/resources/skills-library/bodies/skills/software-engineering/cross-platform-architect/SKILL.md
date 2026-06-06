---
name: cross-platform-architect
description: |
  Cross-platform mobile architecture covering React Native vs Flutter vs Kotlin Multiplatform comparison, shared business logic patterns, native bridge design, platform-specific UI strategies, performance optimization, navigation architecture, state management, testing strategies, and migration paths between frameworks.
  Use when the user asks about cross platform architect, cross platform architect best practices, or needs guidance on cross platform architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile best-practices architecture"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Cross-Platform Architect

## Overview

Cross-platform architecture enables building mobile applications for iOS and Android from a shared codebase, balancing development velocity against native performance and UX fidelity. This skill covers the major frameworks (React Native, Flutter, Kotlin Multiplatform), architectural patterns for maximizing code sharing while maintaining native quality, and the engineering decisions that determine project success.

## Framework Comparison

### Decision Matrix

| Factor | React Native | Flutter | Kotlin Multiplatform |
|--------|-------------|---------|---------------------|
| Language | TypeScript/JavaScript | Dart | Kotlin |
| UI Approach | Native components | Custom rendering (Skia) | Native UI per platform |
| Code Sharing | UI + logic | UI + logic | Logic only (UI is native) |
| Typical Sharing % | 80-95% | 90-98% | 50-70% (logic layer) |
| Performance | Good (JSI bridge) | Excellent (compiled) | Excellent (native) |
| Hot Reload | Yes (Fast Refresh) | Yes (sub-second) | Partial (logic only) |
| Bundle Size | ~15-25MB | ~10-20MB | Native baseline |
| Native Integration | Bridge/TurboModules | Platform channels | Direct interop |
| Learning Curve | Low (web devs) | Medium (new lang) | Medium (Kotlin devs) |
| Maturity | 2015, Meta | 2018, Google | 2020, JetBrains |

### When to Choose What

```
Choose React Native when:
  - Team has strong JavaScript/TypeScript skills
  - App is content-heavy (feeds, forms, lists)
  - Web app already exists in React
  - Fast iteration speed is priority
  - Community packages cover your native needs

Choose Flutter when:
  - Custom UI/animations are central to the experience
  - Pixel-perfect consistency across platforms needed
  - Team is willing to learn Dart
  - Targeting beyond mobile (web, desktop)
  - High performance graphics/animations required

Choose Kotlin Multiplatform when:
  - Native UI fidelity is non-negotiable
  - Complex business logic needs sharing (not UI)
  - Team has strong native development skills
  - Existing native apps need logic consolidation
  - Platform-specific UX patterns must be followed exactly
```

## Shared Logic Architecture

### Clean Architecture for Cross-Platform

```
Platform Layer (per-platform)
  +-- UI/Views (SwiftUI / Jetpack Compose / React Native JSX / Flutter Widgets)
  +-- Platform Services (Camera, GPS, Push, Biometrics)
  +-- Dependency Injection (platform-specific implementations)

Shared Layer (cross-platform)
  +-- Presentation (ViewModels / BLoC / Hooks)
  +-- Domain (Use Cases, Entities, Repository Interfaces)
  +-- Data (Repository Implementations, API Client, Local DB)

The key insight: Share everything BELOW the UI layer.
UI should be platform-native for best UX.
```

### React Native Architecture

```typescript
// Shared business logic layer
// src/domain/usecases/GetUserProfile.ts
export class GetUserProfile {
  constructor(private userRepo: UserRepository) {}

  async run(userId: string): Promise<UserProfile> {
    const user = await this.userRepo.getUser(userId);
    const preferences = await this.userRepo.getPreferences(userId);

    return {
      ...user,
      displayName: `${user.firstName} ${user.lastName}`,
      memberSince: formatDate(user.createdAt),
      tier: calculateMembershipTier(user.totalPurchases),
      preferences,
    };
  }
}

// src/domain/repositories/UserRepository.ts
export interface UserRepository {
  getUser(userId: string): Promise<User>;
  getPreferences(userId: string): Promise<UserPreferences>;
  updateProfile(userId: string, updates: Partial<User>): Promise<User>;
}

// src/data/repositories/UserRepositoryImpl.ts
export class UserRepositoryImpl implements UserRepository {
  constructor(
    private apiClient: ApiClient,
    private localDb: LocalDatabase,
    private cache: CacheManager,
  ) {}

  async getUser(userId: string): Promise<User> {
    // Cache-first strategy
    const cached = await this.cache.get<User>(`user:${userId}`);
    if (cached && !cached.isExpired) return cached.data;

    try {
      const user = await this.apiClient.get<User>(`/users/${userId}`);
      await this.cache.set(`user:${userId}`, user, { ttl: 300 });
      await this.localDb.upsert('users', user);
      return user;
    } catch (error) {
      // Fallback to local DB if offline
      const local = await this.localDb.get<User>('users', userId);
      if (local) return local;
      throw error;
    }
  }
}
```

### Flutter Architecture (BLoC Pattern)

```dart
// Shared BLoC for user profile
// lib/features/profile/bloc/profile_bloc.dart

class ProfileBloc extends Bloc<ProfileEvent, ProfileState> {
  final GetUserProfile getUserProfile;
  final UpdateUserProfile updateUserProfile;

  ProfileBloc({
    required this.getUserProfile,
    required this.updateUserProfile,
  }) : super(ProfileInitial()) {
    on<LoadProfile>(_onLoadProfile);
    on<UpdateProfile>(_onUpdateProfile);
  }

  Future<void> _onLoadProfile(
    LoadProfile event,
    Emitter<ProfileState> emit,
  ) async {
    emit(ProfileLoading());
    try {
      final profile = await getUserProfile(event.userId);
      emit(ProfileLoaded(profile));
    } catch (e) {
      emit(ProfileError(e.toString()));
    }
  }

  Future<void> _onUpdateProfile(
    UpdateProfile event,
    Emitter<ProfileState> emit,
  ) async {
    emit(ProfileUpdating());
    try {
      final updated = await updateUserProfile(event.userId, event.updates);
      emit(ProfileLoaded(updated));
    } catch (e) {
      emit(ProfileError(e.toString()));
    }
  }
}
```

### Kotlin Multiplatform Shared Module

```kotlin
// shared/src/commonMain/kotlin/com/myapp/domain/usecase/GetUserProfile.kt
class GetUserProfile(private val userRepository: UserRepository) {

    suspend operator fun invoke(userId: String): Result<UserProfile> {
        return try {
            val user = userRepository.getUser(userId)
            val preferences = userRepository.getPreferences(userId)

            Result.success(UserProfile(
                user = user,
                displayName = "${user.firstName} ${user.lastName}",
                memberTier = calculateTier(user.totalPurchases),
                preferences = preferences,
            ))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun calculateTier(totalPurchases: Int): MemberTier {
        return when {
            totalPurchases >= 100 -> MemberTier.PLATINUM
            totalPurchases >= 50 -> MemberTier.GOLD
            totalPurchases >= 10 -> MemberTier.SILVER
            else -> MemberTier.BRONZE
        }
    }
}

// Platform-specific expect/actual for platform services
// shared/src/commonMain/kotlin/com/myapp/platform/SecureStorage.kt
expect class SecureStorage {
    fun store(key: String, value: String)
    fun get(key: String): String?
    fun delete(key: String)
}

// shared/src/androidMain/kotlin/.../SecureStorage.kt
actual class SecureStorage(context: Context) {
    private val prefs = EncryptedSharedPreferences.create(...)
    actual fun store(key: String, value: String) = prefs.edit().putString(key, value).apply()
    actual fun get(key: String): String? = prefs.getString(key, null)
    actual fun delete(key: String) = prefs.edit().remove(key).apply()
}

// shared/src/iosMain/kotlin/.../SecureStorage.kt
actual class SecureStorage {
    actual fun store(key: String, value: String) {
        KeychainWrapper.standard.set(value, forKey: key)
    }
    actual fun get(key: String): String? {
        return KeychainWrapper.standard.string(forKey: key)
    }
    actual fun delete(key: String) {
        KeychainWrapper.standard.removeObject(forKey: key)
    }
}
```

## Native Bridge Design

### React Native TurboModules (New Architecture)

```typescript
// specs/NativeCameraModule.ts (Codegen spec)
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  takePhoto(options: {
    quality: number;
    facing: string;
  }): Promise<{
    uri: string;
    width: number;
    height: number;
  }>;

  requestPermission(): Promise<boolean>;
  hasPermission(): boolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>('CameraModule');
```

### Flutter Platform Channels

```dart
// Dart side
class NativeBiometrics {
  static const _channel = MethodChannel('com.myapp/biometrics');

  static Future<bool> authenticate(String reason) async {
    try {
      final result = await _channel.invokeMethod<bool>('authenticate', {
        'reason': reason,
        'useFallback': true,
      });
      return result ?? false;
    } on PlatformException catch (e) {
      throw BiometricException(e.code, e.message ?? 'Unknown error');
    }
  }

  static Future<BiometricType> availableBiometrics() async {
    final String type = await _channel.invokeMethod('getAvailableType');
    return BiometricType.values.firstWhere(
      (t) => t.name == type,
      orElse: () => BiometricType.none,
    );
  }
}

// Bridge design principles:
// 1. Keep bridge calls async (don't block UI thread)
// 2. Serialize data as simple types (no complex objects across bridge)
// 3. Handle errors on both sides (native exception -> Dart exception)
// 4. Batch bridge calls when possible (reduce crossing overhead)
// 5. Use EventChannel for streams (not repeated method calls)
```

## Performance Optimization

### Cross-Platform Performance Patterns

```
Issue                    React Native Fix             Flutter Fix
------------------------------------------------------------------------
List scrolling jank      Use FlashList instead of     Use ListView.builder
                         FlatList; memo components    with const widgets

Image loading            Use FastImage; resize on     Use cached_network_image
                         native side                  with resize parameters

Heavy computation        Move to native module or     Use compute() for
                         use Worklets (Reanimated)    isolate-based processing

Animation stutter        Use Reanimated (runs on      Keep animations in
                         UI thread, not JS)           composition phase

Startup time             Enable Hermes; lazy load     Tree shaking; deferred
                         screens; reduce bundle       components; AOT compile

Memory leaks             Profile with Flipper;        Profile with DevTools;
                         clean up listeners           dispose controllers

Bridge overhead          Batch native calls;          Minimize platform
(RN specific)            use TurboModules (JSI)       channel calls; batch data
```

### React Native Performance Checklist

```typescript
// 1. Memoize expensive components
const ProductCard = React.memo(({ product }: Props) => {
  return (
    <View>
      <FastImage source={{ uri: product.imageUrl }} style={styles.image} />
      <Text>{product.name}</Text>
    </View>
  );
});

// 2. Use FlashList for large lists
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={products}
  renderItem={({ item }) => <ProductCard product={item} />}
  estimatedItemSize={120}
  keyExtractor={(item) => item.id}
/> .// 3. Reanimated for 60fps animations
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const translateY = useSharedValue(0);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: withSpring(translateY.value) }],
}));
```

## Navigation Architecture

### Navigation Pattern Comparison

```
Pattern              React Native          Flutter              KMP
----------------------------------------------------------------------
Stack navigation     React Navigation      Navigator 2.0 /     Native per platform
                     Stack.Navigator       GoRouter

Tab navigation       Bottom Tabs           BottomNavigationBar  Native TabBar/
                     navigator                                  BottomNav

Deep linking         Linking config in     GoRouter path        Native URL handling
                     React Navigation      patterns             per platform

Modal presentation   Modal stack           showModalBottomSheet Native modal
                     navigator                                  presentation
```

## State Management

### State Management Comparison

| Approach | React Native | Flutter | When to Use |
|----------|-------------|---------|-------------|
| Local state | useState/useReducer | setState/ValueNotifier | Component-level UI state |
| App state | Redux/Zustand | Riverpod/Provider/BLoC | App-wide shared state |
| Server state | TanStack Query | flutter_query/dio_cache | API data with caching |
| Navigation state | React Navigation state | GoRouter state | URL/screen state |

## Testing Strategy

### Cross-Platform Testing Pyramid

```
                    /\
                   /  \
                  / E2E \          Platform-specific
                 / Tests  \        (Detox / Patrol / XCTest)
                /----------\
               /             \
              / Integration    \    Shared + Platform
             /    Tests         \   (Widget / Component tests)
            /--------------------\
           /                      \
          /      Unit Tests        \  Shared logic
         /        (Shared)          \ (Jest / flutter_test / kotlin.test)
        /----------------------------\

Testing shared logic:
  - Unit test domain layer (pure functions, no platform deps)
  - Mock repository interfaces for use case tests
  - Test state management (Redux reducers, BLoC transitions)

Testing platform integration:
  - Widget/Component tests for UI behavior
  - Integration tests for native bridge calls
  - Screenshot tests for visual regression

Testing end-to-end:
  - Detox (React Native) or Patrol (Flutter) for full flows
  - Test critical user journeys: login, purchase, onboarding
  - Run on real devices in CI (BrowserStack, Firebase Test Lab)
```

## Migration Strategies

### Gradual Migration Approach

```
Scenario: Migrating from separate iOS/Android to cross-platform

Phase 1: Shared Logic Library
  - Extract business logic into shared module (KMP or JS package)
  - Keep native UI on both platforms
  - Validate shared logic with tests
  - Duration: 2-4 months

Phase 2: Feature-by-Feature UI Migration
  - New features built cross-platform
  - Existing features migrated by priority
  - "Brownfield" integration (cross-platform inside native shell)
  - Duration: 6-12 months

Phase 3: Full Migration
  - Replace native shell with cross-platform navigation
  - Migrate remaining native screens
  - Decommission old native codebases
  - Duration: 3-6 months

Key rule: Never big-bang rewrite. Always incremental.
```

## Architecture Decision Checklist

```
Before Choosing Framework:
  [ ] Defined target platforms (iOS, Android, web, desktop?)
  [ ] Assessed team skills and hiring market
  [ ] Identified performance-critical features
  [ ] Cataloged required native integrations
  [ ] Checked framework maturity for your use cases
  [ ] Built proof-of-concept for riskiest feature

Architecture Design:
  [ ] Clean separation between UI and business logic
  [ ] Repository pattern for data access abstraction
  [ ] Dependency injection for testability
  [ ] Offline-first data strategy defined
  [ ] Navigation architecture chosen
  [ ] State management approach selected
  [ ] Error handling strategy (global + per-feature)

Quality:
  [ ] Testing strategy defined (unit/integration/E2E split)
  [ ] CI/CD pipeline for both platforms
  [ ] Performance benchmarks established
  [ ] Accessibility requirements met on both platforms
  [ ] Platform-specific UX patterns respected
```

## When to Use

**Use this skill when:**
- Designing or implementing cross platform architect solutions
- Reviewing or improving existing cross platform architect approaches
- Making architectural or implementation decisions about cross platform architect
- Learning cross platform architect patterns and best practices
- Troubleshooting cross platform architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Cross Platform Architect Analysis

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

**Input:** "Help me implement cross platform architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended cross platform architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When cross platform architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
