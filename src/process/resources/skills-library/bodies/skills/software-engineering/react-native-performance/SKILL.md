---
name: react-native-performance
description: |
  Guides expert-level react native performance implementation: javascript and optimization decision frameworks, production-ready patterns, and concrete templates for react native performance workflows.
  Use when the user asks about react native performance, react native performance configuration, or mobile best practices for react projects.
  Do NOT use when the user needs a different mobile development capability -- check sibling skills in the mobile development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile javascript optimization"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# React Native Performance

## When to Use

**Use this skill when:**
- User asks about diagnosing slow frame rates, janky animations, or dropped frames in a React Native app
- User wants to optimize JavaScript thread or UI thread performance in production or staging builds
- User is profiling a React Native app and needs to interpret Hermes profiler, Systrace, or Flipper flame graphs
- User wants to implement virtualized lists, memoization strategies, or concurrent rendering patterns in React Native
- User asks about bridgeless architecture (the New Architecture) and JSI migration for performance gains
- User needs to reduce Time to Interactive (TTI), minimize JavaScript bundle size, or improve cold/warm startup time
- User wants to implement Reanimated 2/3 worklets, Gesture Handler, or native-driven animations to hit 60/120 fps
- User is experiencing memory pressure, OOM crashes, or excessive garbage collection pauses on Android or iOS

**Do NOT use this skill when:**
- User needs general React performance optimization for web -- JavaScript bundle splitting and SSR are covered in a web-specific skill
- User is building a new React Native app from scratch and asking about project setup, navigation library selection, or folder structure -- use the react-native-architecture skill instead
- User is asking about Expo-managed workflow limitations that require ejecting -- use the expo-ejection skill
- User wants to write native modules from scratch in Swift/Kotlin -- use the native-modules skill
- User is asking about CI/CD pipeline configuration for React Native -- use the mobile-ci-cd skill
- User is debugging crashes unrelated to performance (network errors, permission flows, authentication) -- use the react-native-debugging skill

---

## Process

### 1. Establish a Performance Baseline Before Touching Any Code

Before any optimization, capture ground-truth metrics on a real device (never a simulator for performance work):

- **Measure frame rate:** Use the React Native Performance Monitor overlay (shake device → "Show Perf Monitor") to capture JS FPS and UI FPS in steady state. Target is 60 fps on standard devices, 120 fps on ProMotion/high-refresh Android where supported.
- **Measure TTI (Time to Interactive):** Record startup time from app launch to the first interactive screen. For a cold start, anything above 3 seconds on a mid-range Android device (e.g., Pixel 4a, Samsung A53) is a red flag. Warm start should be under 1 second.
- **Capture JS bundle parse time:** Use the Hermes Bytecode format (`.hbc`) and verify it is enabled. Hermes can reduce parse time by 60-80% versus V8 because it parses at build time, not runtime.
- **Establish memory baseline:** Open Flipper → Hermes Debugger → Memory tab. Capture a heap snapshot during idle state. For a typical content app, resident memory should stay under 150MB on iOS and 200MB on Android before triggering system pressure.
- **Document the baseline in a spreadsheet** with columns: metric name, device model, OS version, build type (debug/release), value, and date. Every optimization iteration must be compared against this baseline.
- **Always profile release builds, not debug builds.** Debug builds include extra validation, source maps, and the remote debugger bridge, which can make JS thread performance appear 5-10x worse than it is in production.

### 2. Identify the Bottleneck Using the Right Profiler for the Right Thread

React Native has two threads that can cause frame drops. Misdiagnosing which thread is the problem leads to wasted effort:

- **Dropped JS thread frames** show the JS FPS dipping below 60 while UI FPS stays high. Root causes: heavy computation in render, expensive state updates, synchronous bridge calls, large JSON serialization, or poorly configured FlatList.
- **Dropped UI thread frames** show UI FPS dropping while JS FPS stays high. Root causes: heavy view hierarchies, CSS-like shadow calculations, native animation driver not being used, overdraw, or excessive `measureInWindow`/`setNativeProps` calls.
- **Use the Hermes Profiler for JS thread analysis:** In Flipper → Hermes Debugger → Profiler, record a profile while reproducing the jank. Look for functions consuming more than 16ms (one frame budget) in the flame graph. Common culprits: `renderItem` functions with inline object creation, `useEffect` chains triggering re-renders, and unoptimized selectors in Redux or Zustand.
- **Use Systrace for UI thread analysis on Android:** Run `npx react-native profile-hermes` or capture a Systrace via `adb shell atrace` with the `view` tag. Look for `Choreographer#doFrame` taking more than 16ms, `RenderThread` overdraw, or `measureChild` calls in deeply nested layouts.
- **Use Instruments (Time Profiler) on iOS for UI thread analysis:** Attach to a running app in Xcode → Product → Profile → Time Profiler. Sort by self-time. Any `CATransaction`, `UICollectionView`, or custom `drawRect` calls exceeding 16ms are candidates.
- **Use Flipper's React DevTools plugin** to inspect component re-render frequency. Enable "Highlight updates" in React DevTools. Components flashing on every interaction are re-rendering unnecessarily.

### 3. Fix JavaScript Thread Bottlenecks

Address JS thread performance problems in priority order:

- **Prevent unnecessary re-renders with memoization:**
  - Wrap expensive functional components in `React.memo(Component, arePropsEqual)`. Provide a custom `arePropsEqual` when props contain object references that structurally identical but referentially different (common with Redux `mapStateToProps` returning new objects).
  - Use `useMemo` for expensive derived values. Threshold: if a computation takes more than 1ms, it is a candidate. Examples: filtering large arrays, computing aggregate statistics, building lookup maps.
  - Use `useCallback` for functions passed as props to memoized children. Without it, `React.memo` is bypassed because the function reference changes every render.
  - Avoid creating objects or arrays as default prop values or inside render: `style={{ flex: 1 }}` creates a new object reference every render. Extract to a `StyleSheet.create` constant instead.

- **Optimize state management access patterns:**
  - In Redux with react-redux, use granular selectors that return primitive values, not objects. `useSelector(state => state.user.name)` is better than `useSelector(state => state.user)` because the latter triggers re-renders whenever any user field changes.
  - Use `reselect` or `re-reselect` for memoized selectors that compute derived data. Selectors should be pure functions with stable output references when inputs have not changed.
  - In Zustand, use slice subscriptions: `useStore(state => state.count)` instead of `useStore()` to avoid subscribing to the entire store.
  - In MobX, use `observer()` from `mobx-react-lite` at the leaf component level rather than at container components. Fine-grained observation reduces re-render scope.

- **Defer and batch expensive work:**
  - Use `InteractionManager.runAfterInteractions(() => { /* heavy work */ })` for operations that should not compete with ongoing animations or gestures.
  - Use `requestAnimationFrame` to schedule visual updates that must sync with the UI thread.
  - Batch multiple `setState` calls in event handlers -- React 18's automatic batching applies to async contexts too, but in React Native you can wrap synchronous batches in `unstable_batchedUpdates` from `react-native`.

- **Move heavy computation off the main thread:**
  - Use `react-native-workers` or the experimental `react-native-reanimated` worklet system to offload computation.
  - For CPU-intensive tasks (image processing, encryption, large data parsing), implement a native module in Swift/Kotlin or use a WebAssembly approach via JSI.
  - Large JSON parsing (> 1MB payloads) should be done in a background thread via a native module and the result handed back to JS, not parsed synchronously on the JS thread.

### 4. Optimize List Rendering -- The Most Common Performance Problem

Lists are the single most frequent source of React Native performance problems. Most apps spend 40-60% of their interactive time rendering list content:

- **Always use `FlatList` or `SectionList` over `ScrollView` for dynamic content.** `ScrollView` renders all children simultaneously. `FlatList` virtualizes -- only items near the viewport are mounted. For fewer than 20 static items, `ScrollView` is acceptable.
- **Configure `FlatList` render window carefully:**
  - `windowSize`: default is 21 (10 screen heights above and below viewport). Reduce to 5 for memory-constrained devices. Increase to 21+ for scroll-heavy apps where predictive prefetch matters.
  - `initialNumToRender`: set to the exact number of items visible on screen without scrolling (typically 8-12 for a standard card list). Setting too high delays TTI; too low causes a blank flash on mount.
  - `maxToRenderPerBatch`: default is 10. For expensive `renderItem` functions, reduce to 3-5 to keep the JS thread responsive during fast scrolling.
  - `updateCellsBatchingPeriod`: default is 50ms. Increase to 100ms on low-end devices to reduce batching frequency.
  - `removeClippedSubviews`: set `true` on Android to detach off-screen views from the rendering tree. Use with caution on iOS -- it can cause visual glitches with certain animations.
- **Memoize `renderItem` and `keyExtractor`:**
  ```javascript
  const renderItem = useCallback(({ item }) => <ItemCard item={item} />, []);
  const keyExtractor = useCallback((item) => item.id.toString(), []);
  ```
- **Use `getItemLayout` when item heights are fixed or calculable.** This eliminates layout measurement overhead for every item and enables `scrollToIndex` without the async measurement pass:
  ```javascript
  const ITEM_HEIGHT = 80;
  const SEPARATOR_HEIGHT = 1;
  const getItemLayout = (data, index) => ({
    length: ITEM_HEIGHT,
    offset: (ITEM_HEIGHT + SEPARATOR_HEIGHT) * index,
    index,
  });
  ```
- **Memoize list items with `React.memo`.** The `renderItem` callback should receive stable props. If item data is derived from a selector, ensure the selector returns the same reference when data has not changed.
- **Implement pull-to-refresh with `onRefresh` and `refreshing` props** rather than unmounting/remounting the list, which forces full re-initialization of the virtual window.
- **For infinite lists,** implement `onEndReached` with `onEndReachedThreshold={0.5}` (trigger when 50% of the list remains). Debounce the handler to prevent multiple rapid triggers during fast scroll deceleration.

### 5. Achieve 60/120 fps Animations with the Right Driver

React Native animations fall into three categories, each with different performance characteristics:

- **Animated API with `useNativeDriver: true` (JS-controlled, UI-thread execution):**
  - Native driver moves animation execution to the UI thread, bypassing the JS bridge for each frame update. Always set `useNativeDriver: true` for `opacity`, `transform` (translate, scale, rotate), and `shadowOpacity`. These properties can be driven natively.
  - `useNativeDriver` does NOT support `width`, `height`, `backgroundColor`, `flex`, `margin`, or `padding` properties. Attempting these causes a runtime error or silent fallback to JS-driven animation.
  - Interpolate aggressively: `inputRange: [0, 1]`, `outputRange: ['0deg', '360deg']` -- interpolation runs on the UI thread at no JS cost.

- **React Native Reanimated 3 (worklet-based, runs entirely on the UI thread):**
  - Reanimated 3 worklets are functions decorated with `'worklet'` directive that compile to bytecode running on a dedicated C++ thread. They do not touch the JS thread at all during animation execution.
  - Use `useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSpring`, `withDecay` for declarative animations.
  - `withSpring` parameters: `damping: 10, stiffness: 100` gives a natural bounce. `damping: 20, stiffness: 200` gives a snappy, less bouncy feel. Tune based on interaction type.
  - Combine with `react-native-gesture-handler` for gesture-driven animations that compute gesture velocity and position entirely on the UI thread with no bridge round trips.
  - Layout animations via `LayoutAnimation` (built-in) or Reanimated's `Layout` prop handle mount/unmount transitions. Reanimated's `FadeIn`, `SlideInRight`, etc., run as native entering/exiting animations.

- **Lottie animations:**
  - Lottie animations run on the UI thread via the native Lottie library (Airbnb's lottie-react-native). They are rendered as vector graphics and are efficient for icon-level animations.
  - For large Lottie files (> 500KB), pre-cache the animation JSON at app startup. Parsing large JSON on demand causes visible jank.
  - Do not drive more than 3-5 simultaneous Lottie animations. Each has its own render loop.

### 6. Optimize App Startup Time

Cold start optimization is often the highest-impact, most visible performance work:

- **Enable Hermes:** Hermes uses pre-compiled bytecode (`.hbc`) that eliminates JS parse time at startup. For a 2MB bundle, this saves 300-800ms on mid-range Android. Enable in `android/app/build.gradle`: `enableHermes: true`.
- **Enable RAM Bundles on iOS (legacy architecture) or inline requires:**
  - RAM Bundles split the JS bundle into modules loaded on demand. `require()` calls become lazy -- only the entry point executes at startup.
  - Inline requires (configured in `metro.config.js` with `inlineRequires: true`) defer module initialization to first use. This reduces startup module evaluation time by 20-40% in large apps.
- **Reduce root component initialization work:**
  - Move non-critical initialization (analytics setup, non-essential SDK initialization, feature flag fetching) to `InteractionManager.runAfterInteractions` or a deferred `useEffect` with a timeout.
  - The root component's initial render should only mount the navigation container and the first screen. Do not fetch data, initialize background services, or run heavy computation synchronously in the root.
- **Pre-load critical assets:**
  - Use `Image.prefetch(url)` for above-the-fold images.
  - Use `Font.loadAsync` (Expo) or direct native font loading to pre-load custom fonts before the splash screen dismisses. Font loading on first render causes a flash of unstyled text.
- **Defer splash screen dismissal:** Use `expo-splash-screen` or `react-native-splash-screen` to hold the native splash until React has mounted the first screen. This eliminates the blank white flash between native launch and React rendering.
- **Use `AppRegistry.registerComponent` with a wrapper that implements `SuspenseList`** to control the order in which deferred content loads, preventing layout thrash on the first interactive frame.

### 7. Manage Memory and Prevent Leaks

Memory pressure is the silent killer of React Native app stability, especially on low-end Android devices (1-2GB RAM):

- **Image memory management:**
  - Images are the largest single source of memory pressure. A 3000x3000 PNG decoded to a bitmap consumes ~34MB (3000 × 3000 × 4 bytes) regardless of the file size on disk.
  - Use `FastImage` (react-native-fast-image) instead of the built-in `Image` component. FastImage uses SDWebImage (iOS) and Glide (Android), which implement memory caches with LRU eviction, disk caches, and downsampling to display size.
  - Always specify `width` and `height` on `FastImage` or `Image`. Without explicit dimensions, the image is decoded at its full resolution and then scaled, wasting memory.
  - Implement `onMemoryWarning` listener (`AppState` + iOS memory warning notification) to trigger `FastImage.clearMemoryCache()` on memory pressure.

- **Subscription and listener cleanup:**
  - Every `addEventListener`, `setInterval`, `setTimeout`, EventEmitter subscription, and native event listener must have a corresponding cleanup in `useEffect`'s return function. Missing cleanups cause memory leaks that compound over time.
  - Use Flipper's Leak Canary plugin (Android) or Xcode's Memory Graph Debugger (iOS) to confirm that screen unmounts actually free memory.

- **Navigation and component lifecycle:**
  - In React Navigation, screens off the stack are unmounted by default (stack navigator). Use `detachInactiveScreens={true}` (default) to ensure UI thread resources are released.
  - Avoid storing large data structures in component state or context that persists across the navigation lifetime. Prefer fetching on demand and discarding on unmount.

- **Heap monitoring thresholds:**
  - JavaScript heap: alert if sustained usage exceeds 100MB. Investigate if it grows more than 20MB between identical app states (a sign of a leak accumulating over navigation cycles).
  - Native heap (Android): visible in Android Profiler. Spikes during image loading are expected but should return to baseline within 2-3 seconds of the image leaving the viewport.

### 8. Adopt the New Architecture (Fabric + JSI + TurboModules) for Maximum Performance

The New Architecture eliminates the asynchronous JSON bridge, the single largest structural performance bottleneck in the Old Architecture:

- **JSI (JavaScript Interface):** Replaces the bridge with a C++ layer that allows JavaScript to hold references to native objects and call native functions synchronously. This eliminates serialization overhead for native module calls.
- **Fabric:** The new UI renderer that executes layout synchronously on the JS thread (when needed for measurement) and renders on the UI thread with finer synchronization control. Enables concurrent React features (Suspense, `startTransition`) in React Native.
- **TurboModules:** Native modules loaded lazily on first use rather than all registered at startup. Reduces startup module initialization time. Each TurboModule uses JSI for synchronous communication.
- **Bridgeless mode:** Available in React Native 0.73+. Eliminates the old bridge entirely. Requires all third-party native modules to be TurboModule-compatible. Audit dependencies with the React Native New Architecture compatibility tracker before migrating.
- **Migration approach:** Enable the New Architecture in `android/gradle.properties` (`newArchEnabled=true`) and iOS Podfile (`RCT_NEW_ARCH_ENABLED=1`). Run your test suite. Fix incompatible native modules one at a time. Run both architectures in parallel in staging for 2-4 weeks before full rollout.
- **Performance gains from New Architecture:** Synchronous layout measurement (eliminates async `measure()` callback roundtrip), reduced animation latency, and faster native module calls -- typically 2-5x faster for high-frequency operations like gesture position tracking.

---

## Output Format

For each performance investigation and optimization engagement, produce a structured report in the following format:

```
## React Native Performance Report

### Baseline Metrics
| Metric                  | Value          | Device             | Build Type | Target   | Status  |
|-------------------------|----------------|--------------------|------------|----------|---------|
| Cold Start TTI          | 4.2s           | Samsung A53        | Release    | < 3.0s   | ❌ FAIL |
| JS FPS (idle scroll)    | 48 fps         | Pixel 6            | Release    | 60 fps   | ❌ FAIL |
| UI FPS (scroll)         | 60 fps         | Pixel 6            | Release    | 60 fps   | ✅ PASS |
| JS Heap (steady state)  | 87MB           | iPhone 13          | Release    | < 100MB  | ✅ PASS |
| Bundle Size (gzipped)   | 3.1MB          | N/A                | Release    | < 2.5MB  | ❌ FAIL |

### Bottleneck Diagnosis
| Thread       | Bottleneck Identified        | Evidence                            | Priority |
|--------------|------------------------------|-------------------------------------|----------|
| JS Thread    | FlatList renderItem cost     | Hermes profiler: 28ms/frame         | P0       |
| JS Thread    | Inline style object creation | React DevTools: 800 re-renders/min  | P1       |
| Startup      | Synchronous SDK init in root | Trace: 1.8s blocked before render   | P0       |

### Optimization Plan
| Priority | Optimization                         | Technique                        | Estimated Gain    | Complexity |
|----------|--------------------------------------|----------------------------------|-------------------|------------|
| P0       | Memoize FlatList renderItem          | React.memo + useCallback         | +12 JS fps        | Low        |
| P0       | Defer analytics SDK init             | InteractionManager               | -1.5s TTI         | Low        |
| P1       | Extract inline styles to StyleSheet  | StyleSheet.create                | +3 JS fps         | Low        |
| P1       | Enable getItemLayout on ProductList  | Fixed-height row calculation     | -40ms scroll lag  | Low        |
| P2       | Migrate animations to Reanimated 3   | useSharedValue + useAnimatedStyle| Eliminate UI jank | Medium     |
| P2       | Enable Hermes + inline requires      | metro.config.js inlineRequires   | -600ms startup    | Medium     |

### Code Snippets for Each Fix

#### [Fix Name]
```javascript
// Before:
// After:
// Rationale:
```

### Post-Optimization Metrics
| Metric                  | Before | After  | Delta    | Target Met |
|-------------------------|--------|--------|----------|------------|
| Cold Start TTI          | 4.2s   | 2.1s   | -2.1s    | ✅         |
| JS FPS (idle scroll)    | 48 fps | 59 fps | +11 fps  | ✅         |

### Architecture Recommendation
[One of: Old Architecture (maintain), New Architecture migration (plan), New Architecture migration (urgent)]
Rationale: [specific reason based on bottleneck profile and RN version]

### Next Review Checkpoint
Metric to watch: [specific metric]
Threshold for escalation: [specific value]
Review date: [timeline]
```

---

## Rules

1. **Never profile in debug mode and report it as a production concern.** Debug builds run the JS bundle through a hosted packager with full source maps and the Metro development server, which can make frame rates appear 5-10x worse than release. All performance data must be captured from release builds or at minimum release-mode debug builds (`--mode=Release` on Android).

2. **Never apply `useCallback` and `useMemo` universally as a performance strategy.** These hooks have a cost: they allocate closure memory and run the dependency comparison on every render. Memoization is a net win only when the memoized function or value is passed to a child component that is wrapped in `React.memo`, or when the computation cost exceeds ~1ms. Premature memoization adds cognitive overhead with no performance benefit.

3. **Never use `ScrollView` for dynamic lists with more than 20 items.** `ScrollView` renders all children synchronously on mount. At 50 items, this typically causes 300-500ms of blocking JS thread work. Use `FlatList` with proper virtualization configuration instead.

4. **Never set `useNativeDriver: true` for layout properties (width, height, backgroundColor, margin, padding, flex).** The native driver cannot animate layout properties because layout requires Yoga (the JS-driven layout engine) to run. This causes a silent failure or a runtime error depending on the RN version. Use Reanimated 3's `useAnimatedStyle` with `withTiming` for layout properties, or restructure the animation to use transform instead.

5. **Always measure on a mid-range Android device as the performance benchmark, not an iPhone or flagship Android.** Mid-range Android devices (Snapdragon 680, Exynos 850, MediaTek Helio G88) represent the median device in most global app markets and have 4-6x slower JavaScript execution than an iPhone 15 Pro. Passing on an iPhone does not mean passing on the actual user population.

6. **Never add `removeClippedSubviews={true}` on iOS without testing all interaction paths.** On iOS, `removeClippedSubviews` can cause views to appear invisible when they scroll back into the viewport if the cell has a nested `overflow: 'hidden'` or uses certain animation patterns. It is safe and recommended on Android but requires explicit QA verification on iOS.

7. **Always use `StyleSheet.create()` for static styles and never create style objects inline.** `StyleSheet.create()` validates styles in development, transforms them into integer IDs sent over the bridge (Old Architecture), and prevents the new object reference creation that defeats `React.memo` comparisons. Inline style objects `style={{ marginTop: 10 }}` create a new reference on every render.

8. **Never access `AsyncStorage` synchronously or on the main code path during startup.** `AsyncStorage` is asynchronous but still has I/O latency (5-50ms per read on Android). Reading user preferences, tokens, or feature flags during synchronous root component initialization blocks first render. Initialize from a synchronous cache (MMKV or react-native-mmkv) for startup-critical values, and use AsyncStorage only for non-startup data.

9. **Never import entire icon libraries at the top level.** Libraries like react-native-vector-icons or @expo/vector-icons load hundreds of font glyphs into memory at module evaluation time. Import only the specific icon family needed: `import MaterialIcons from 'react-native-vector-icons/MaterialIcons'` rather than the barrel export. Enable inline requires in Metro to defer even these imports until first render.

10. **Always test list performance by simulating 1000+ item datasets, not the 10-20 items used in development.** FlatList virtualization bugs, `keyExtractor` collisions, and `getItemLayout` miscalculations are invisible with small datasets. Use `Array.from({ length: 1000 }, (_, i) => generateMockItem(i))` in your development data seeder to expose these issues before production.

---

## Edge Cases

**Hermes not enabled on an older project using RN < 0.70:**
Hermes became the default engine in RN 0.70. On older projects, it must be explicitly enabled. Before enabling Hermes on a legacy project, audit all third-party native modules for Hermes compatibility -- modules that use non-standard JS engine APIs (Proxy, certain Reflect methods, custom iterators) may crash or behave incorrectly. Run the full test suite on Hermes with `HERMES_ENABLED=true` in a separate branch before merging. After enabling Hermes, regenerate the JS bundle and verify with `hermes -version` in the build output that `.hbc` files are being produced.

**Animations targeting 120 fps on ProMotion/high-refresh displays:**
On iOS ProMotion displays (120Hz) and Android high-refresh devices, the system target is 120 fps, meaning the frame budget drops from 16.6ms to 8.3ms. Animations implemented with the built-in `Animated` API with `useNativeDriver: true` will attempt to run at 120 fps on ProMotion but JS-driven parts of the animation pipeline may miss the tighter budget. Reanimated 3 worklets automatically run at the display's native refresh rate because they execute on the C++ thread synchronized with the CADisplayLink/Choreographer. To explicitly target 120 fps on Android: set `<application android:highRefreshRate="true">` in the manifest and verify the device's display settings allow the app to run at full refresh rate.

**Large FlatList with heterogeneous item heights and no getItemLayout:**
When item heights vary and `getItemLayout` cannot be provided, `scrollToIndex` becomes unreliable (React Native warns it cannot guarantee scroll accuracy). The solution is to implement a layout cache: use `onLayout` on each item to record its measured height and offset in a `useRef` map, then implement a custom `getItemLayout` that consults this cache. This pattern has a first-pass cost (items must render once before the cache is populated) but eliminates the async measurement round trips on subsequent interactions. For very long lists (5000+ items) with variable heights, consider using `react-native-recyclerlistview`, which has lower memory overhead than FlatList through true view recycling.

**New Architecture compatibility with common third-party libraries:**
Not all popular libraries support the New Architecture (Fabric + JSI) as of 2024. Libraries that wrap UIKit/Android Views with the old `ViewManager` API require rewriting as Fabric Components. Before enabling `newArchEnabled=true`, audit all native dependencies using the community-maintained compatibility list. Specific problematic patterns include: libraries that call `UIManager.dispatchViewManagerCommand` directly (deprecated), libraries using `NativeEventEmitter` with the old module registration, and any library that registers ViewManagers without implementing the Fabric spec. Maintain an `interopEnabled: true` setting during migration to allow old-architecture modules to run in compatibility mode, then migrate them one at a time.

**Low-end Android devices with < 2GB RAM and aggressive process killing:**
On devices with 1-2GB RAM running Android 10 and earlier, the OS aggressively kills background processes and may kill the React Native JS context while the app is backgrounded. On resume, the JS bundle must re-initialize (equivalent to a warm start). Symptoms: users report "app resets to home screen" when returning from a background task. Handle this with `AppState` change listeners to persist critical navigation state to MMKV on background and restore it on foreground. Additionally, avoid holding large in-memory caches (image caches, Redux stores with megabytes of data) because these increase the app's memory footprint and make it a higher priority target for the system's OOM killer.

**Memory leaks from circular references between JS and native objects (Old Architecture):**
In the Old Architecture, JS objects holding references to native views through the shadow tree can create circular reference cycles that prevent garbage collection. This is most common in components that use `findNodeHandle` or `ref` callbacks that store handles in module-level variables. The Hermes GC (a generational, mark-and-sweep collector) will eventually collect these, but the cycle delay can cause apparent memory growth over time. Audit with Flipper's Memory Profiler: take snapshots before and after repeated mount/unmount cycles of suspected components. If heap size does not return to the pre-mount baseline after five cycles, there is a leak. Null out refs in `useEffect` cleanup: `return () => { refToNativeView.current = null; }`.

**Bundle size growth in large apps causing startup regression:**
As apps grow, JavaScript bundle size grows, which increases both download size for OTA updates and parse/evaluation time even with Hermes bytecode. Monitor bundle size in CI with `react-native bundle --minify true` and fail the build if the gzipped output exceeds a threshold (e.g., 4MB for a large app). Use `react-native-bundle-visualizer` to generate a treemap of module sizes. Common high-impact reductions: replacing `moment.js` (330KB) with `date-fns` (tree-shakeable, ~10-80KB), replacing `lodash` (full import, 72KB) with individual method imports, and removing duplicate transitive dependencies using `yarn why` or `npm ls`.

---

## Example

**Input:** "Our React Native app's product list screen is janky when scrolling -- users are reporting it feels choppy. The list has product cards with images, a title, price, and an 'Add to Cart' button. We're using Redux for state and FlatList. JS FPS drops to around 40 during scroll. How do we fix this?"

**Output:**

### Diagnosis

A JS FPS drop to 40 fps during FlatList scrolling with image-heavy cards is a classic pattern. The root cause is almost always one or more of: expensive `renderItem` execution, unnecessary re-renders due to unstable props, or image decode overhead. Before touching code, confirm the diagnosis:

1. Attach Flipper and open the Hermes Profiler. Scroll the list for 5 seconds while recording. Stop the profile and look for the `renderItem` call -- if it takes more than 8ms per invocation, it is the primary bottleneck. Also look for Redux `useSelector` calls firing repeatedly during scroll.
2. Enable React DevTools "Highlight updates." If the entire list or large portions of it flash yellow on every scroll tick, you have a re-render problem unrelated to the item content itself.

Based on the described symptoms (Redux + FlatList + image cards + 40 fps), here is the complete fix:

### Baseline Metrics

| Metric               | Value   | Device        | Build Type | Target | Status  |
|----------------------|---------|---------------|------------|--------|---------|
| JS FPS (scroll)      | 40 fps  | Pixel 6       | Release    | 60 fps | ❌ FAIL |
| UI FPS (scroll)      | 60 fps  | Pixel 6       | Release    | 60 fps | ✅ PASS |
| renderItem cost      | ~26ms   | Pixel 6       | Release    | < 8ms  | ❌ FAIL |

(UI FPS is healthy, confirming the bottleneck is the JS thread, not native layout or the GPU.)

### Bottleneck Diagnosis

| Thread    | Bottleneck                               | Evidence                              | Priority |
|-----------|------------------------------------------|---------------------------------------|----------|
| JS Thread | renderItem not memoized                  | 26ms per renderItem call in profiler  | P0       |
| JS Thread | ProductCard re-renders on every scroll   | React DevTools: full-list flashing    | P0       |
| JS Thread | Inline style objects in renderItem       | New object refs defeat React.memo     | P1       |
| JS Thread | Redux selector returns new object ref    | useSelector re-triggers every action  | P1       |
| Images    | Full-resolution decode in FlatList cells | Memory spikes, decode on scroll thread| P1       |

### Fix 1: Memoize renderItem and ProductCard (P0)

**Before:**
```javascript
// ProductListScreen.js
const ProductListScreen = () => {
  const products = useSelector(state => state.products.items); // ← returns new array ref

  return (
    <FlatList
      data={products}
      renderItem={({ item }) => (           // ← new function ref every render
        <ProductCard                         // ← never memoized
          product={item}
          onAddToCart={(id) => dispatch(addToCart(id))}  // ← new function every render
        />
      )}
      keyExtractor={(item) => item.id}      // ← new function every render
    />
  );
};
```

**After:**
```javascript
// selectors/productSelectors.js
import { createSelector } from 'reselect';

// Memoized selector -- returns same array reference if products haven't changed
export const selectProductIds = createSelector(
  (state) => state.products.items,
  (items) => items.map((item) => item.id)  // return IDs only -- primitives, not objects
);

export const selectProductById = (state, id) => state.products.itemsById[id];
```

```javascript
// components/ProductCard.js
import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';

const ProductCard = memo(({ productId, onAddToCart }) => {
  // Each card subscribes only to its own product -- not the whole list
  const product = useSelector((state) => selectProductById(state, productId));

  const handleAddToCart = useCallback(() => {
    onAddToCart(productId);
  }, [productId, onAddToCart]);

  return (
    <View style={styles.card}>
      <FastImage
        style={styles.image}
        source={{
          uri: product.imageUrl,
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        }}
        resizeMode={FastImage.resizeMode.cover}
      />
      <Text style={styles.title}>{product.title}</Text>
      <Text style={styles.price}>${product.price.toFixed(2)}</Text>
      <Pressable style={styles.button} onPress={handleAddToCart}>
        <Text style={styles.buttonText}>Add to Cart</Text>
      </Pressable>
    </View>
  );
});

// StyleSheet.create ensures styles are registered once and referenced by integer ID
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 16,
  },
  image: {
    width: '100%',
    height: 200,           // ← explicit height for getItemLayout and memory management
    borderRadius: 6,
  },
  title: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  price: { fontSize: 14, color: '#666', marginTop: 4 },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});

export default ProductCard;
```

```javascript
// ProductListScreen.js (after)
import React, { useCallback } from 'react';
import { FlatList } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { selectProductIds } from '../selectors/productSelectors';
import ProductCard from '../components/ProductCard';

const ITEM_HEIGHT = 320; // card padding (24) + image (200) + text (~64) + button (44) - measured
const SEPARATOR_HEIGHT = 0; // no separator in this design

const ProductListScreen = () => {
  const dispatch = useDispatch();
  // Selector returns array of IDs (primitives) -- same reference if store hasn't changed
  const productIds = useSelector(selectProductIds);

  const handleAddToCart = useCallback(
    (id) => dispatch(addToCart(id)),
    [dispatch]
  );

  const renderItem = useCallback(
    ({ item: productId }) => (
      <ProductCard productId={productId} onAddToCart={handleAddToCart} />
    ),
    [handleAddToCart]
  );

  const keyExtractor = useCallback((id) => id.toString(), []);

  const getItemLayout = useCallback(
    (_, index) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      data={productIds}                    // array of IDs, not objects
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}        // eliminates measurement overhead
      initialNumToRender={5}              // visible items without scroll
      maxToRenderPerBatch={5}             // render 5 items per JS batch
      windowSize={7}                      // 3 screens above + 3 below
      updateCellsBatchingPeriod={80}      // slightly longer batch period on mid-range
      removeClippedSubviews={true}        // safe here -- no nested overflow:hidden
    />
  );
};

export default ProductListScreen;
```

### Fix 2: Replace built-in Image with FastImage (P1)

```bash
npm install react-native-fast-image
cd ios && pod install
```

FastImage's Glide (Android) and SDWebImage (iOS) backends handle:
- Disk and memory LRU caching with configurable size limits
- Automatic image downsampling to the rendered display size (critical for 4K product images displayed at 200px height)
- Priority queuing so visible items load before off-screen prefetch items

Set the cache control to `immutable` for CDN-hosted product images with versioned URLs. Use `web` cache control for mutable URLs.

### Post-Optimization Metrics

| Metric               | Before  | After   | Delta    | Target Met |
|----------------------|---------|---------|----------|------------|
| JS FPS (scroll)      | 40 fps  | 59 fps  | +19 fps  | ✅         |
| renderItem cost      | 26ms    | 3ms     | -23ms    | ✅         |
| Memory (100 items)   | 210MB   | 145MB   | -65MB    | ✅         |

### Architecture Recommendation

**Old Architecture (maintain) -- short term.** The fixes above eliminate the immediate performance problem without requiring a New Architecture migration. Plan a New Architecture migration in the next major release cycle to gain access to Fabric's synchronous layout and Reanimated 3's full worklet performance. Prerequisite: audit all current native dependencies for Fabric/TurboModule compatibility before committing to a migration timeline.

### Next Review Checkpoint

**Metric to watch:** JS FPS during scroll on a Pixel 4a (slower CPU, represents 60th percentile Android user)
**Threshold for escalation:** If JS FPS drops below 55 fps after adding new ProductCard features (ratings, badges, variant selectors), revisit the `renderItem` implementation
**Review date:** 4 weeks after deployment, once real-device analytics from a performance monitoring tool (Sentry Performance, Firebase Performance, or Datadog RUM) confirm production results match the profiler findings
