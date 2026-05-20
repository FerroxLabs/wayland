---
name: react-native-builder
description: |
  Expert React Native development covering navigation, state management, native modules, performance optimization, platform-specific code, Expo vs bare workflow, animations, testing, debugging, and OTA updates.
  Use when the user asks about react native builder, react native builder best practices, or needs guidance on react native builder implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile best-practices javascript design"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# React Native Builder

## Overview

This skill provides comprehensive expertise in building production-grade React Native applications. It covers the full spectrum from project initialization through deployment, including architectural decisions, performance tuning, and cross-platform strategies that deliver native-quality experiences on both iOS and Android.

## Project Initialization Decision Tree

```
New React Native Project?
├── Prototyping / MVP / No native modules needed?
│   └── Use Expo Managed Workflow
│       ├── `npx create-expo-app@latest my-app`
│       ├── Benefits: OTA updates, EAS Build, managed signing
│       └── Constraint: Limited native module access (use expo-dev-client to escape)
├── Need custom native modules / full control?
│   └── Use Bare Workflow (React Native CLI)
│       ├── `npx react-native init MyApp`
│       ├── Benefits: Full native access, custom build configs
│       └── Cost: Manual signing, manual native dependency linking
└── Migrating from Expo Managed?
    └── `npx expo prebuild` (Continuous Native Generation)
        └── Generates ios/ and android/ dirs while keeping Expo config
```

## Navigation Architecture (React Navigation)

### Stack + Tab + Drawer Composition

```tsx
// navigation/RootNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Define type-safe route params
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Modal: { itemId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Search: { query?: string };
  Profile: { userId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    # ... (condensed) ...
          </Stack.Group>
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
```

### Deep Linking Configuration

```tsx
const linking = {
  prefixes: ['myapp://', '[reference URL]'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Profile: 'profile/:userId',
        },
      },
      Modal: 'item/:itemId',
    },
  },
};

// In App.tsx
<NavigationContainer linking={linking} fallback={<LoadingScreen />}>
  <RootNavigator />
</NavigationContainer>
```

## State Management Strategy

### Decision Matrix

| Criteria | Zustand | Redux Toolkit | Jotai | React Query |
|----------|---------|---------------|-------|-------------|
| Learning curve | Low | Medium | Low | Medium |
| Boilerplate | Minimal | Moderate | Minimal | Low |
| DevTools | Basic | Excellent | Basic | Excellent |
| Server state | Manual | RTK Query | Manual | Built-in |
| Bundle size | ~1KB | ~11KB | ~3KB | ~13KB |
| Best for | Simple-medium apps | Large enterprise | Atomic state | Server-heavy apps |

### Recommended Architecture: Zustand + React Query

```tsx
// stores/useAppStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  theme: 'light' | 'dark' | 'system';
  onboardingComplete: boolean;
  setTheme: (theme: AppState['theme']) => void;
  completeOnboarding: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      onboardingComplete: false,
      setTheme: (theme) => set({ theme }),
      completeOnboarding: () => set({ onboardingComplete: true }),
    }),
    {
      name: 'app-storage',
      # ... (condensed) ...
export function useProducts(categoryId: string) {
  return useQuery({
    queryKey: ['products', categoryId],
    queryFn: () => api.getProducts(categoryId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes cache
  });
}
```

## Native Modules

### Turbo Modules (New Architecture)

```tsx
// specs/NativeDeviceInfo.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  getDeviceId(): Promise<string>;
  getBatteryLevel(): Promise<number>;
  getFreeDiskSpace(): Promise<number>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('DeviceInfo');
```

### Platform-Specific Code

```tsx
// components/DatePicker/index.ios.tsx
export function DatePicker({ value, onChange }: Props) {
  return <DateTimePicker display="spinner" value={value} onChange={onChange} />;
}

// components/DatePicker/index.android.tsx
export function DatePicker({ value, onChange }: Props) {
  const [show, setShow] = useState(false);
  return (
    <>
      <Pressable onPress={() => setShow(true)}>
        <Text>{format(value, 'PP')}</Text>
      </Pressable>
      {show && (
        <DateTimePicker display="default" value={value} onChange={(e, d) => {
          setShow(false);
          if (d) onChange(d);
        }} />
      )}
    </>
  );
}

// Usage: import { DatePicker } from './components/DatePicker';
// Metro bundler auto-resolves .ios.tsx / .android.tsx
```

## Performance Optimization

### Critical Performance Rules

1. **Memoize expensive renders**: Use `React.memo`, `useMemo`, `useCallback`
2. **Flatten lists**: Use `FlatList` or `FlashList`, never `.map()` for long lists
3. **Avoid bridge serialization**: Minimize JS-to-native data transfer
4. **Use Hermes engine**: Enabled by default in RN 0.70+; verify in build logs
5. **Image optimization**: Use `expo-image` or `FastImage` with caching

### FlatList / FlashList Optimization

```tsx
import { FlashList } from '@shopify/flash-list';

function ProductList({ products }: { products: Product[] }) {
  const renderItem = useCallback(({ item }: { item: Product }) => (
    <ProductCard product={item} />
  ), []);

  const keyExtractor = useCallback((item: Product) => item.id, []);

  return (
    <FlashList
      data={products}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={120}
      // FlashList handles recycling automatically
      // For FlatList, also set:
      // windowSize={5}
      // maxToRenderPerBatch={10}
      // removeClippedSubviews={true}
      // getItemLayout for fixed-height items
    />
  );
}
```

### JS Thread Profiling

```tsx
// Enable in dev: React DevTools Profiler
// Production monitoring:
import { PerformanceObserver } from 'react-native-performance';

const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.duration > 16) { // Dropped frame threshold
      analytics.track('slow_render', {
        name: entry.name,
        duration: entry.duration,
      });
    }
  });
});
```

## Animations with Reanimated

### Shared Element Transitions

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

function SwipeableCard({ onDismiss }: { onDismiss: () => void }) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 150) {
        translateX.value = withTiming(Math.sign(e.translationX) * 500);
        opacity.value = withTiming(0, {}, () => {
          # ... (condensed) ...
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        {/* Card content */}
      </Animated.View>
    </GestureDetector>
  );
}
```

### Scroll-Driven Animations

```tsx
function CollapsibleHeader() {
  const scrollY = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, 100], [200, 60], Extrapolation.CLAMP),
    opacity: interpolate(scrollY.value, [0, 80], [1, 0], Extrapolation.CLAMP),
  }));

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <>
      <Animated.View style={[styles.header, headerStyle]} />
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
        {/* Content */}
      </Animated.ScrollView>
    </>
  );
}
```

## Testing Strategy

### Unit Tests (Jest + React Native Testing Library)

```tsx
// __tests__/ProductCard.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProductCard } from '../components/ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Widget',
    price: 29.99,
    image: '[reference URL]',
  };

  it('renders product details', () => {
    const { getByText } = render(<ProductCard product={mockProduct} />);
    expect(getByText('Widget')).toBeTruthy();
    expect(getByText('$29.99')).toBeTruthy();
  });

  it('calls onPress with product id', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ProductCard product={mockProduct} onPress={onPress} />
    );
    fireEvent.press(getByTestId('product-card'));
    expect(onPress).toHaveBeenCalledWith('1');
  });
});
```

### E2E Tests (Detox)

```tsx
// e2e/login.test.ts
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should login with valid credentials', async () => {
    await element(by.id('email-input')).typeText('user@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

## Debugging Techniques

| Tool | Purpose | When to Use |
|------|---------|-------------|
| Flipper | Network, layout, DB inspection | General debugging |
| React DevTools | Component tree, props, state | UI debugging |
| Hermes debugger | JS breakpoints, profiling | Logic debugging |
| Xcode Instruments | Memory leaks, CPU profiling | iOS performance |
| Android Profiler | Memory, CPU, network | Android performance |
| `console.warn` + LogBox | Quick debug logging | Rapid iteration |

## OTA Updates

### Expo Updates (EAS Update)

```json
// app.json
{
  "expo": {
    "updates": {
      "url": "[reference URL]",
      "fallbackToCacheTimeout": 3000
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

```tsx
// App.tsx - Manual update check
import * as Updates from 'expo-updates';

async function checkForUpdates() {
  if (__DEV__) return;
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync(); // Restarts the app with new bundle
    }
  } catch (e) {
    console.error('Update check failed:', e);
  }
}
```

### Update Strategy Decision

```
OTA Update Strategy:
├── Critical bug fix → Force update on next launch
├── Minor improvement → Background download, apply on next cold start
├── Feature behind flag → Download silently, enable via remote config
└── Native code change → Full binary release (App Store / Play Store)
```

## Expo vs Bare Workflow Comparison

| Feature | Expo Managed | Bare / Prebuild |
|---------|-------------|-----------------|
| Native module access | Via expo-dev-client | Full access |
| Build service | EAS Build (cloud) | Local or CI |
| OTA updates | EAS Update | CodePush or custom |
| Push notifications | expo-notifications | Direct APNs/FCM |
| Config management | app.json / app.config.js | Native project files |
| Upgrade path | `expo upgrade` | Manual or `rn-upgrade-helper` |

## Production Checklist

- [ ] Enable Hermes on both platforms
- [ ] Configure ProGuard rules for Android release
- [ ] Set up crash reporting (Sentry / Crashlytics)
- [ ] Configure deep linking and universal links
- [ ] Test on physical devices (not just simulators)
- [ ] Verify offline behavior and error boundaries
- [ ] Set up CI/CD with EAS Build or Fastlane
- [ ] Configure app signing for both platforms
- [ ] Test accessibility with screen readers
- [ ] Profile memory usage and fix leaks
- [ ] Set up analytics and performance monitoring
- [ ] Configure OTA update strategy
- [ ] Verify bundle size (use `react-native-bundle-visualizer`)
- [ ] Test on minimum supported OS versions

## When to Use

**Use this skill when:**
- Designing or implementing react native builder solutions
- Reviewing or improving existing react native builder approaches
- Making architectural or implementation decisions about react native builder
- Learning react native builder patterns and best practices
- Troubleshooting react native builder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# React Native Builder Analysis

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

**Input:** "Help me implement react native builder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended react native builder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When react native builder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
