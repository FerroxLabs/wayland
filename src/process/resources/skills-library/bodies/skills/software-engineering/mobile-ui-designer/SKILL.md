---
name: mobile-ui-designer
description: |
  Expert mobile UI/UX patterns covering platform design guidelines (Material Design, Human Interface), responsive layouts, gesture handling, offline-first UI, skeleton screens, pull-to-refresh, infinite scroll, bottom sheets, and haptic feedback.
  Use when the user asks about mobile ui designer, mobile ui designer best practices, or needs guidance on mobile ui designer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile best-practices design"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Mobile UI Designer

## Overview

This skill provides deep expertise in mobile UI/UX design and implementation. It covers adherence to platform design guidelines, building responsive layouts that adapt across device sizes, implementing intuitive gesture interactions, designing for offline scenarios, and applying established mobile UI patterns that users expect from high-quality applications.

## Platform Design Guidelines

### Material Design 3 (Android) vs Human Interface Guidelines (iOS)

| Aspect | Material Design 3 | Human Interface Guidelines |
|--------|-------------------|--------------------------|
| Navigation | Navigation bar (bottom), Navigation drawer, Navigation rail | Tab bar (bottom), Navigation bar (top) |
| Primary action | FAB (Floating Action Button) | Navigation bar button or prominent button |
| Typography | Roboto / system, type scale (display, headline, title, body, label) | SF Pro / system, Dynamic Type sizes |
| Color | Dynamic color from wallpaper, tonal palettes | System colors, vibrancy, materials |
| Shape | Rounded corners with shape scale | Rounded rectangles, consistent radius |
| Motion | Emphasized easing, shared axis transitions | Spring animations, interruptible gestures |
| Elevation | Tonal elevation (color shift, not shadow) | Materials and blur (vibrancy) |
| Icons | Material Symbols (outlined, rounded, sharp) | SF Symbols (multicolor, hierarchical) |

### Platform-Specific Behavior Rules

```
Navigation Patterns:
├── Android
│   ├── System back button / gesture MUST work correctly
│   ├── Bottom nav bar hides on scroll (optional)
│   ├── Swipe to go back: edge gesture (system)
│   └── Top app bar: collapsing toolbar pattern
├── iOS
│   ├── Swipe from left edge to go back (NavigationController)
│   ├── Tab bar stays visible always (Apple recommendation)
│   ├── Large title collapses on scroll
│   └── Pull-down to dismiss modal sheets
└── Cross-Platform
    ├── Respect platform conventions for each OS
    ├── Do not replicate iOS patterns on Android (or vice versa)
    └── Use platform-adaptive components when available
```

## Responsive Layout Strategies

### Breakpoint System

```dart
// Flutter responsive layout
enum DeviceType { phone, tablet, desktop }

DeviceType getDeviceType(BuildContext context) {
  final width = MediaQuery.sizeOf(context).width;
  if (width < 600) return DeviceType.phone;
  if (width < 1200) return DeviceType.tablet;
  return DeviceType.desktop;
}

class ResponsiveLayout extends StatelessWidget {
  final Widget phone;
  final Widget? tablet;
  final Widget? desktop;

  const ResponsiveLayout({
    required this.phone,
    this.tablet,
    # ... (condensed) ...

// Usage
ResponsiveLayout(
  phone: ProductList(columns: 1),
  tablet: ProductGrid(columns: 3),
  desktop: ProductGrid(columns: 5, showSidebar: true),
)
```

### Adaptive Grid Patterns

```tsx
// React Native responsive grid
import { useWindowDimensions } from 'react-native';

function useColumns(): number {
  const { width } = useWindowDimensions();
  if (width < 375) return 1;   // Small phones
  if (width < 768) return 2;   // Phones
  if (width < 1024) return 3;  // Tablets portrait
  return 4;                     // Tablets landscape
}

function ProductGrid({ products }: Props) {
  const columns = useColumns();
  return (
    <FlatList
      data={products}
      numColumns={columns}
      key={`grid-${columns}`} // Force re-render on column change
      renderItem={({ item }) => (
        <View style={{ flex: 1 / columns, padding: 8 }}>
          <ProductCard product={item} />
        </View>
      )}
      keyExtractor={(item) => item.id}
    />
  );
}
```

## Gesture Handling

### Gesture Priority and Conflict Resolution

```
Gesture Conflict Resolution:
├── Vertical scroll vs. horizontal swipe
│   └── Use gesture velocity threshold:
│       if |velocityX| > |velocityY| * 1.5 → horizontal
│       else → vertical
├── Pull-to-refresh vs. scroll up
│   └── Only activate when scrollPosition == 0 AND pulling down
├── Long press vs. drag
│   └── Long press delay (500ms), then transition to drag
├── Pinch-to-zoom vs. scroll
│   └── Two-finger → zoom; one-finger → scroll
└── Swipe-to-dismiss vs. button tap
    └── Minimum swipe distance threshold (50dp / 30% of width)
```

### Swipe Actions Implementation

```swift
// iOS SwiftUI swipe actions
List {
    ForEach(items) { item in
        ItemRow(item: item)
            .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                Button(role: .destructive) {
                    deleteItem(item)
                } label: {
                    Label("Delete", systemImage: "trash")
                }
                Button {
                    archiveItem(item)
                } label: {
                    Label("Archive", systemImage: "archivebox")
                }
                .tint(.blue)
            }
            .swipeActions(edge: .leading) {
                Button {
                    pinItem(item)
                } label: {
                    Label("Pin", systemImage: "pin")
                }
                .tint(.orange)
            }
    }
}
```

## Offline-First UI Design

### State Communication Matrix

| State | UI Pattern | User Communication |
|-------|-----------|-------------------|
| Online, fresh data | Normal display | No indicator needed |
| Online, loading | Skeleton / shimmer | Subtle loading animation |
| Online, error | Error with retry | Clear error message + retry button |
| Offline, cached data | Normal + banner | "Offline - showing cached data" banner |
| Offline, no data | Empty state | "Connect to the internet to load" |
| Reconnecting | Loading + banner | "Reconnecting..." |
| Sync pending | Badge / indicator | "Changes will sync when online" |

### Offline Banner Component

```tsx
// React Native offline indicator
function OfflineBanner() {
  const netInfo = useNetInfo();
  const [show, setShow] = useState(false);
  const translateY = useSharedValue(-50);

  useEffect(() => {
    if (!netInfo.isConnected) {
      setShow(true);
      translateY.value = withSpring(0);
    } else if (show) {
      // Show "Back online" briefly
      scheduleDelayed(() => {
        translateY.value = withTiming(-50, { duration: 300 }, () => {
          runOnJS(setShow)(false);
        });
      }, 2000);
    }
  # ... (condensed) ...
    >
      <Text style={styles.bannerText}>
        {netInfo.isConnected ? 'Back online' : 'No internet connection'}
      </Text>
    </Animated.View>
  );
}
```

## Skeleton Screens

### Design Principles

1. **Match layout structure**: Skeleton should mirror the real content layout
2. **Use animation**: Shimmer effect (left-to-right gradient sweep) signals loading
3. **Avoid spinners for content**: Skeletons feel faster than spinners
4. **Show immediately**: No delay before showing skeletons
5. **Transition smoothly**: Fade from skeleton to real content

```dart
// Flutter skeleton screen
class ProductCardSkeleton extends StatelessWidget {
  const ProductCardSkeleton();

  @supersede
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Image placeholder
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(
                  # ... (condensed) ...
    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 8, // Show 8 skeleton cards
      itemBuilder: (_, __) => const ProductCardSkeleton(),
    );
  }
}
```

## Pull-to-Refresh

### Implementation Guidelines

- Pull threshold: 60-80 points before triggering
- Show progress indicator at top
- Maintain scroll position after refresh
- Prevent multiple simultaneous refreshes
- Show completion state briefly (checkmark)
- Add haptic feedback at trigger point

```kotlin
// Jetpack Compose pull-to-refresh
@Composable
fun ProductListWithRefresh(viewModel: ProductViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val pullRefreshState = rememberPullToRefreshState()

    PullToRefreshBox(
        isRefreshing = uiState.isRefreshing,
        onRefresh = viewModel::refresh,
        state = pullRefreshState,
    ) {
        LazyColumn {
            items(uiState.products) { product ->
                ProductCard(product = product)
            }
        }
    }
}
```

## Infinite Scroll / Pagination

### Pagination State Machine

```
Pagination States:
├── Initial → Loading first page
├── FirstPageLoading → Show skeleton
├── FirstPageError → Show full-screen error with retry
├── Loaded(items, hasMore: true) → Show items + load more trigger
├── LoadingMore → Show items + bottom spinner
├── LoadMoreError → Show items + "Tap to retry" at bottom
├── Loaded(items, hasMore: false) → Show items + "End of list"
└── Empty → Show empty state illustration
```

```tsx
// React Native infinite scroll
function useInfiniteProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const response = await api.getProducts({ page, limit: 20 });
      setProducts(prev => [...prev, ...response.data]);
      setHasMore(response.data.length === 20);
      setPage(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  # ... (condensed) ...
      ListFooterComponent={
        loading ? <ActivityIndicator /> :
        !hasMore ? <Text>You have seen it all</Text> : null
      }
    />
  );
}
```

## Bottom Sheets

### Bottom Sheet Design Rules

| Guideline | Details |
|-----------|---------|
| Content types | Actions, filters, details, forms |
| Height | Default 50% screen; expandable to 90%; never 100% |
| Dismiss | Swipe down, tap outside, or explicit close button |
| Background | Dim the background content (scrim) |
| Handle | Show drag handle indicator at top |
| Snap points | Define 2-3 detent positions (e.g., 25%, 50%, 90%) |
| Accessibility | Must be navigable by screen readers |
| Keyboard | Sheet must move above keyboard when input focused |

```swift
// iOS SwiftUI bottom sheet
struct ProductFilterSheet: View {
    @Binding var isPresented: Bool
    @State private var selectedCategory: Category?
    @State private var priceRange: ClosedRange<Double> = 0...1000

    var body: some View {
        NavigationStack {
            Form {
                Section("Category") {
                    Picker("Category", selection: $selectedCategory) {
                        Text("All").tag(nil as Category?)
                        ForEach(Category.allCases) { cat in
                            Text(cat.name).tag(cat as Category?)
                        }
                    }
                }
                Section("Price Range") {
                    # ... (condensed) ...
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}
```

## Haptic Feedback

### When to Use Haptics

| Event | Haptic Type | Platform API |
|-------|-------------|-------------|
| Button tap | Light impact | UIImpactFeedbackGenerator(.light) / HapticFeedback.CONFIRM |
| Toggle switch | Medium impact | UIImpactFeedbackGenerator(.medium) |
| Destructive action | Heavy impact + notification warning | UINotificationFeedbackGenerator(.warning) |
| Pull-to-refresh trigger | Selection changed | UISelectionFeedbackGenerator |
| Success completion | Notification success | UINotificationFeedbackGenerator(.success) |
| Error | Notification error | UINotificationFeedbackGenerator(.error) |
| Long press activated | Rigid impact | UIImpactFeedbackGenerator(.rigid) |
| Slider snap | Soft impact at each step | UIImpactFeedbackGenerator(.soft) |

### Implementation

```swift
// iOS haptics helper
enum HapticManager {
    static func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.prepare()
        generator.impactOccurred()
    }

    static func notification(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        generator.notificationOccurred(type)
    }

    static func selection() {
        let generator = UISelectionFeedbackGenerator()
        generator.prepare()
        generator.selectionChanged()
    }
}

// Usage in SwiftUI
Button("Delete") { deleteItem() }
    .sensoryFeedback(.warning, trigger: showDeleteConfirmation)
```

```kotlin
// Android haptics
fun View.performHapticFeedback(type: Int = HapticFeedbackConstants.CONFIRM) {
    this.performHapticFeedback(type)
}

// Jetpack Compose
val haptic = LocalHapticFeedback.current
Button(onClick = {
    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
    onConfirm()
}) {
    Text("Confirm")
}
```

## UI Pattern Decision Guide

```
Choosing the Right Pattern:
├── Displaying a list of items?
│   ├── < 20 items → Simple Column/ScrollView
│   ├── 20-1000 items → LazyColumn/FlatList with pagination
│   └── 1000+ items → Virtualized list with prefetch
├── Collecting user input?
│   ├── 1-3 fields → Inline form
│   ├── 4-8 fields → Single-page form with sections
│   └── 8+ fields → Multi-step wizard
├── Showing details?
│   ├── Brief info → Bottom sheet
│   ├── Full content → Push new screen
│   └── Quick preview → Long press popover / context menu
├── Confirming actions?
│   ├── Non-destructive → Snackbar/Toast
│   ├── Reversible destructive → Snackbar with undo
│   └── Irreversible destructive → Alert dialog with confirmation
└── Loading content?
    ├── Initial load → Skeleton screen
    ├── Subsequent loads → Pull-to-refresh / pagination spinner
    └── Action result → Inline progress indicator
```

## Production Checklist

- [ ] Test on smallest supported screen size (320pt width)
- [ ] Test on largest screen (tablet / foldable)
- [ ] Verify Dynamic Type / font scaling at all sizes
- [ ] Test with system dark mode
- [ ] Test with high contrast / bold text accessibility settings
- [ ] Verify all touch targets are at least 44x44pt (iOS) / 48x48dp (Android)
- [ ] Test with screen reader (VoiceOver / TalkBack)
- [ ] Verify keyboard navigation and focus order
- [ ] Test offline scenarios with airplane mode
- [ ] Verify haptic feedback is appropriate and not excessive
- [ ] Test landscape orientation (or lock to portrait intentionally)
- [ ] Verify safe area insets (notch, home indicator, status bar)
- [ ] Test with slow network conditions (3G simulation)
- [ ] Verify RTL layout support if targeting RTL languages

## When to Use

**Use this skill when:**
- Designing or implementing mobile ui designer solutions
- Reviewing or improving existing mobile ui designer approaches
- Making architectural or implementation decisions about mobile ui designer
- Learning mobile ui designer patterns and best practices
- Troubleshooting mobile ui designer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Mobile Ui Designer Analysis

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

**Input:** "Help me implement mobile ui designer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended mobile ui designer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When mobile ui designer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
