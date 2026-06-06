---
name: mobile-testing
description: |
  Expert mobile app testing covering unit testing (XCTest, JUnit), UI testing (Espresso, XCUITest, Detox), screenshot testing, device farm testing, performance testing, network condition simulation, accessibility testing, and crash reporting.
  Use when the user asks about mobile testing, mobile testing best practices, or needs guidance on mobile testing implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile best-practices testing"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Mobile Testing Expert

## Overview

This skill covers testing mobile applications across the entire test pyramid: unit testing, integration testing, UI testing, visual regression, cross-device testing, performance benchmarking, network simulation, accessibility validation, and crash monitoring.

## Mobile Test Pyramid

```
                    ┌──────────┐
                    │  Manual  │  5% of test effort
                   ┌┴──────────┴┐
                   │   E2E /    │  15% of test effort
                   │   UI Tests │
                  ┌┴────────────┴┐
                  │  Integration  │  25% of test effort
                 ┌┴──────────────┴┐
                 │   Unit Tests    │  55% of test effort
                 └─────────────────┘

- Unit tests: Every commit, <2 min
- Integration: Every PR, <5 min
- UI tests: Nightly or per-release, <30 min
```

## Unit Testing

### iOS with XCTest

```swift
import XCTest
@testable import MyApp

final class ProductViewModelTests: XCTestCase {
    private var sut: ProductListViewModel!
    private var mockRepository: MockProductRepository!

    supersede func setUp() {
        super.setUp()
        mockRepository = MockProductRepository()
        sut = ProductListViewModel(repository: mockRepository)
    }

    func testLoadProducts_success_updatesProducts() async {
        mockRepository.stubbedProducts = [
            Product(id: UUID(), name: "Widget", price: 29.99),
        ]
        await sut.loadProducts()
        XCTAssertEqual(sut.products.count, 1)
        XCTAssertFalse(sut.isLoading)
        XCTAssertNil(sut.error)
    }

    func testLoadProducts_failure_setsError() async {
        mockRepository.shouldFail = true
        await sut.loadProducts()
        XCTAssertTrue(sut.products.isEmpty)
        XCTAssertNotNil(sut.error)
    }
}

class MockProductRepository: ProductRepository {
    var stubbedProducts: [Product] = []
    var shouldFail = false
    func fetchAll() async throws -> [Product] {
        if shouldFail { throw TestError.networkFailure }
        return stubbedProducts
    }
}
```

### Android with JUnit + MockK

```kotlin
@OptIn(ExperimentalCoroutinesApi::class)
class ProductListViewModelTest {
    @get:Rule val mainDispatcherRule = MainDispatcherRule()
    private lateinit var viewModel: ProductListViewModel
    private val getProductsUseCase: GetProductsUseCase = mockk()

    @Before
    fun setup() {
        every { getProductsUseCase(any()) } returns flowOf(testProducts)
        viewModel = ProductListViewModel(getProductsUseCase, SavedStateHandle(mapOf("categoryId" to "all")))
    }

    @Test
    fun `initial state is loading then success`() = runTest {
        advanceUntilIdle()
        val state = viewModel.uiState.value
        assertTrue(state is ProductUiState.Success)
        assertEquals(2, (state as ProductUiState.Success).products.size)
    }

    @Test
    fun `error state when use case throws`() = runTest {
        every { getProductsUseCase(any()) } returns flow { throw IOException("Network error") }
        viewModel = ProductListViewModel(getProductsUseCase, SavedStateHandle())
        advanceUntilIdle()
        assertTrue(viewModel.uiState.value is ProductUiState.Error)
    }
}
```

## UI Testing

### iOS with XCUITest

```swift
final class LoginUITests: XCTestCase {
    let app = XCUIApplication()

    supersede func setUpWithError() throws {
        continueAfterFailure = false
        app.launchArguments = ["--uitesting"]
        app.launch()
    }

    func testSuccessfulLogin() throws {
        let emailField = app.textFields["email-field"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 5))
        emailField.tap()
        emailField.typeText("test@example.com")
        app.secureTextFields["password-field"].tap()
        app.secureTextFields["password-field"].typeText("password123")
        app.buttons["login-button"].tap()
        XCTAssertTrue(app.staticTexts["Welcome"].waitForExistence(timeout: 10))
    }
}
```

### Cross-Platform with Detox

```typescript
describe('Checkout Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should complete a purchase', async () => {
    await element(by.id('product-card-123')).tap();
    await element(by.id('add-to-cart-button')).tap();
    await expect(element(by.id('cart-badge'))).toHaveText('1');
    await element(by.id('cart-tab')).tap();
    await element(by.id('checkout-button')).tap();
    await element(by.id('address-line1')).typeText('123 Main St');
    await element(by.id('place-order-button')).tap();
    await waitFor(element(by.id('order-confirmation'))).toBeVisible().withTimeout(10000);
  });
});
```

## Screenshot Testing

### iOS Snapshot Testing

```swift
import SnapshotTesting

final class ProductCardSnapshotTests: XCTestCase {
    func testProductCard_default() {
        let view = ProductCardView(product: .sample)
        let vc = UIHostingController(rootView: view)
        assertSnapshot(of: vc, as: .image(on: .iPhone13))
    }

    func testProductCard_darkMode() {
        let view = ProductCardView(product: .sample).environment(\.colorScheme, .dark)
        let vc = UIHostingController(rootView: view)
        assertSnapshot(of: vc, as: .image(on: .iPhone13))
    }
}
```

### Android with Paparazzi

```kotlin
class ProductCardScreenshotTest {
    @get:Rule val paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test fun productCard_default() {
        paparazzi.snapshot { MyAppTheme { ProductCard(product = Product.sample, onClick = {}) } }
    }

    @Test fun productCard_darkMode() {
        paparazzi.snapshot { MyAppTheme(darkTheme = true) { ProductCard(product = Product.sample, onClick = {}) } }
    }
}
```

## Device Farm Testing

### Device Selection Strategy

```
Minimum Test Matrix:
├── iOS (4-6 devices): Latest iPhone, oldest supported, iPhone SE, iPad
├── Android (6-8 devices): Latest Pixel, Samsung Galaxy S, Galaxy A (mid-range),
│   budget device, oldest supported Android, tablet
└── Selection criteria: Cover 80% of user base, top crash devices,
    one per screen size bucket, one per chipset family
```

| Service | Strengths | Pricing |
|---------|-----------|---------|
| AWS Device Farm | Large catalog, CI integration | Per minute |
| Firebase Test Lab | Free tier, Robo test | Free basic, pay per device-min |
| BrowserStack | Real devices, manual + auto | Monthly subscription |

## Performance Testing

| Metric | Target | Tool |
|--------|--------|------|
| Cold start | <2s | Instruments / Android Profiler |
| Frame rate | 60fps | Core Animation / GPU Profiler |
| Memory | <150MB typical | Allocations / Memory Profiler |
| APK/IPA size | <50MB ideal | App Thinning / `--analyze-size` |

```swift
// iOS performance test
func testScrollPerformance() throws {
    measure(metrics: [XCTOSSignpostMetric.scrollDecelerationMetric, XCTCPUMetric()]) {
        let list = XCUIApplication().collectionViews.firstMatch
        list.swipeUp(velocity: .fast)
        list.swipeDown(velocity: .fast)
    }
}

func testLaunchPerformance() throws {
    measure(metrics: [XCTApplicationLaunchMetric()]) { XCUIApplication().launch() }
}
```

## Network Condition Simulation

```
Scenarios to Test:
├── No network: Verify offline mode, cached data, error messages
├── Slow 3G (400kbps): Verify timeouts, loading states
├── Lossy network (30% packet loss): Verify retry logic
├── Network switching (WiFi → cellular): Verify recovery
└── Server errors (500, 503): Verify error handling, backoff

Tools: iOS Network Link Conditioner, Android adb emu commands,
       Charles Proxy throttling, Detox URL blacklisting
```

## Accessibility Testing

```swift
// iOS accessibility audit (Xcode 15+)
func testAccessibility() throws {
    let app = XCUIApplication()
    app.launch()
    try app.performAccessibilityAudit()
}
```

| Check | iOS | Android |
|-------|-----|---------|
| Screen reader | VoiceOver | TalkBack |
| Touch targets >= 44pt/48dp | Accessibility Inspector | Layout Inspector |
| Color contrast >= 4.5:1 | Accessibility Inspector | Accessibility Scanner |
| Dynamic type | Test with largest size | Test with largest font scale |

## Crash Reporting

```
Crash Triage Decision Tree:
├── Crash-free rate < 99%    → CRITICAL: Fix immediately
├── 99-99.5%                 → HIGH: Fix in next release
├── 99.5-99.9%               → MEDIUM: Schedule within 2 sprints
└── > 99.9%                  → LOW: Fix when convenient

Investigation: Group by exception → check OS/devices → check if regression →
reproduce locally → fix → regression test → verify after release
```

## CI/CD Configuration

```yaml
name: Mobile Tests
on: [pull_request]
jobs:
  android-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '17' }
      - run: ./gradlew testDebugUnitTest
      - run: ./gradlew verifyPaparazziDebug

  ios-tests:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - run: xcodebuild test -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 15'
```

## Production Checklist

- [ ] Unit test coverage >70% for business logic
- [ ] UI tests cover critical user flows
- [ ] Screenshot tests for key components in light/dark mode
- [ ] Performance benchmarks for startup and scroll
- [ ] Accessibility audit passes on main screens
- [ ] Network failure scenarios tested
- [ ] Crash reporting configured with user context
- [ ] Device farm testing on minimum 4 iOS + 6 Android devices
- [ ] CI runs unit tests on every PR, UI tests nightly
- [ ] Crash-free rate target >99.5%

## When to Use

**Use this skill when:**
- Designing or implementing mobile testing solutions
- Reviewing or improving existing mobile testing approaches
- Making architectural or implementation decisions about mobile testing
- Learning mobile testing patterns and best practices
- Troubleshooting mobile testing-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Mobile Testing Analysis

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

**Input:** "Help me implement mobile testing for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended mobile testing approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When mobile testing must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
