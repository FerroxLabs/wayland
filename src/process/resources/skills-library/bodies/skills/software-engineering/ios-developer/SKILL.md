---
name: ios-developer
description: |
  Expert iOS/Swift development covering SwiftUI patterns, UIKit integration, Combine/async-await, Core Data, networking, push notifications, App Store guidelines, signing/provisioning, and performance instruments.
  Use when the user asks about ios developer, ios developer best practices, or needs guidance on ios developer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile best-practices swift"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# iOS Developer

## Overview

This skill provides comprehensive expertise in building production-quality iOS applications using Swift. It covers modern SwiftUI-first development, UIKit interoperability, structured concurrency, data persistence, networking, push notifications, App Store compliance, and performance analysis with Instruments.

## SwiftUI Architecture Patterns

### MVVM with Observable

```swift
// Model
struct Product: Identifiable, Codable {
    let id: UUID
    var name: String
    var price: Decimal
    var category: Category
    var imageURL: URL?
}

// ViewModel (iOS 17+ with @Observable)
@Observable
class ProductListViewModel {
    var products: [Product] = []
    var searchText = ""
    # ... (condensed) ...
                Alert(title: Text("Error"), message: Text(error.message))
            }
        }
    }
}
```

### Dependency Injection Pattern

```swift
// Protocol-based DI
protocol ProductRepository: Sendable {
    func fetchAll() async throws -> [Product]
    func get(id: UUID) async throws -> Product
    func save(_ product: Product) async throws
    func delete(_ id: UUID) async throws
}

// Live implementation
struct LiveProductRepository: ProductRepository {
    let apiClient: APIClient

    func fetchAll() async throws -> [Product] {
        try await apiClient.request(.get, "/products")
    # ... (condensed) ...
}

extension ProductRepository where Self == MockProductRepository {
    static var mock: MockProductRepository { MockProductRepository() }
}
```

## SwiftUI + UIKit Integration

### Wrapping UIKit in SwiftUI

```swift
// UIViewRepresentable for UIKit views
struct MapView: UIViewRepresentable {
    @Binding var region: MKCoordinateRegion
    var annotations: [MKAnnotation]

    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.delegate = context.coordinator
        return mapView
    }

    func updateUIView(_ mapView: MKMapView, context: Context) {
        mapView.setRegion(region, animated: true)
        mapView.removeAnnotations(mapView.annotations)
        # ... (condensed) ...
        func mapView(_ mapView: MKMapView, regionDidChangeAnimated animated: Bool) {
            parent.region = mapView.region
        }
    }
}
```

### Hosting SwiftUI in UIKit

```swift
class SettingsViewController: UIViewController {
    supersede func viewDidLoad() {
        super.viewDidLoad()

        let settingsView = SettingsView(viewModel: SettingsViewModel())
        let hostingController = UIHostingController(rootView: settingsView)

        addChild(hostingController)
        view.addSubview(hostingController.view)
        hostingController.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            hostingController.view.topAnchor.constraint(equalTo: view.topAnchor),
            hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])
        hostingController.didMove(toParent: self)
    }
}
```

## Structured Concurrency (async/await)

### Actor-Based Architecture

```swift
// Global actor for database operations
@globalActor actor DatabaseActor {
    static let shared = DatabaseActor()
}

// Actor-isolated repository
actor ProductStore {
    private var cache: [UUID: Product] = [:]
    private let persistence: PersistenceController

    init(persistence: PersistenceController = .shared) {
        self.persistence = persistence
    }

    # ... (condensed) ...
        products: products,
        categories: categories,
        promotions: promotions
    )
}
```

### Combine to async/await Bridge

```swift
extension Publisher {
    func firstValue() async throws -> Output {
        try await withCheckedThrowingContinuation { continuation in
            var cancellable: AnyCancellable?
            cancellable = self.first()
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            continuation.resume(throwing: error)
                        }
                        cancellable?.cancel()
                    },
                    receiveValue: { value in
                        continuation.resume(returning: value)
                        cancellable?.cancel()
                    }
                )
        }
    }
}
```

## Core Data with SwiftUI

### Modern Core Data Stack

```swift
class PersistenceController {
    static let shared = PersistenceController()
    static let preview: PersistenceController = {
        let controller = PersistenceController(inMemory: true)
        // Seed preview data
        let context = controller.container.viewContext
        for i in 0..<10 {
            let product = ProductEntity(context: context)
            product.id = UUID()
            product.name = "Product \(i)"
            product.price = Decimal(Double.random(in: 9.99...99.99))
        }
        try? context.save()
        return controller
    # ... (condensed) ...
        List(products) { product in
            Text(product.name ?? "Unknown")
        }
    }
}
```

## Networking with URLSession

### Type-Safe API Client

```swift
enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
}

struct APIClient {
    static let shared = APIClient()
    private let session: URLSession
    private let decoder: JSONDecoder
    private let baseURL: URL

    init(session: URLSession = .shared, baseURL: URL = AppConfig.apiBaseURL) {
        # ... (condensed) ...
            let errorBody = try? decoder.decode(APIErrorResponse.self, from: data)
            throw APIError.server(httpResponse.statusCode, errorBody?.message)
        }
    }
}
```

## Push Notifications (APNs)

### Registration and Handling

```swift
// AppDelegate setup
class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        registerForPushNotifications()
        return true
    }

    func registerForPushNotifications() {
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .badge, .sound, .provisional]
        # ... (condensed) ...
        if let deepLink = userInfo["deep_link"] as? String {
            DeepLinkRouter.shared.navigate(to: deepLink)
        }
    }
}
```

## Signing and Provisioning

### Signing Configuration Decision Tree

```
Signing Setup:
├── Development
│   ├── Automatic Signing: ON (let Xcode manage)
│   ├── Team: Your Apple Developer Team
│   └── Xcode creates dev provisioning profile automatically
├── CI/CD Build
│   ├── Manual Signing recommended
│   ├── Download certificates from Apple Developer portal
│   ├── Install via Fastlane Match (shared team signing)
│   └── Store in CI secrets / keychain
├── TestFlight Distribution
│   ├── Requires App Store distribution certificate
│   ├── Provisioning Profile: App Store type
│   └── Upload via Xcode, Transporter, or `xcrun altool`
└── App Store Release
    ├── Same certificate as TestFlight
    ├── Archive → Upload → App Store Connect review
    └── Typically automated via Fastlane or Xcode Cloud
```

### Fastlane Match Setup

```ruby
# Matchfile
git_url("[reference URL]")
storage_mode("git")
type("appstore")
app_identifier(["com.myapp.ios", "com.myapp.ios.widget"])
username("apple-id@company.com")
team_id("ABC123XYZ")

# Fastfile
lane :beta do
  match(type: "appstore")
  build_app(scheme: "MyApp", export_method: "app-store")
  upload_to_testflight(skip_waiting_for_build_processing: true)
end
```

## App Store Review Guidelines Summary

### Common Rejection Reasons and How to Avoid Them

| Rejection Reason | Guideline | Prevention |
|-----------------|-----------|------------|
| Crashes / Bugs | 2.1 | Test on all supported devices and OS versions |
| Broken links | 2.1 | Verify all URLs before submission |
| Placeholder content | 2.3.3 | Remove all lorem ipsum and test data |
| Incomplete metadata | 2.3 | Fill all App Store Connect fields |
| Privacy violations | 5.1.1 | Declare all data collection in privacy nutrition labels |
| Missing login credentials | 2.1 | Provide demo account in review notes |
| In-app purchase bypass | 3.1.1 | Use StoreKit for all digital goods |
| Misleading screenshots | 2.3.7 | Screenshots must reflect actual app experience |

## Performance with Instruments

### Key Instruments Profiles

| Instrument | Diagnoses | When to Use |
|-----------|-----------|-------------|
| Time Profiler | CPU bottlenecks | Slow operations, high CPU |
| Allocations | Memory usage | Growing memory footprint |
| Leaks | Retain cycles | Memory warnings, OOM crashes |
| Core Animation | Rendering perf | Choppy scrolling, dropped frames |
| Network | HTTP traffic | Slow loads, excessive requests |
| Energy Log | Battery drain | Background tasks, location use |

### Common Performance Fixes

```swift
// 1. Avoid main thread blocking
// BAD
let data = try Data(contentsOf: fileURL) // blocks main thread

// GOOD
Task.detached(priority: .userInitiated) {
    let data = try Data(contentsOf: fileURL)
    await MainActor.run { self.processData(data) }
}

// 2. Image optimization
// BAD: Loading full-res images in a list
Image(uiImage: UIImage(contentsOfFile: path)!)

# ... (condensed) ...
        ) { [weak self] _ in
            self?.onUpdate?()
        }
    }
}
```

## Production Checklist

- [ ] Set minimum deployment target (typically current - 2)
- [ ] Configure App Transport Security exceptions (if needed)
- [ ] Implement proper error handling with user-facing messages
- [ ] Add Crashlytics or equivalent crash reporting
- [ ] Set up automated UI tests via XCUITest
- [ ] Configure Xcode Cloud or Fastlane for CI/CD
- [ ] Complete App Store Connect metadata and screenshots
- [ ] Declare privacy nutrition labels accurately
- [ ] Test VoiceOver accessibility
- [ ] Profile with Instruments (Time Profiler, Leaks, Allocations)
- [ ] Verify universal link / deep link configuration
- [ ] Test push notifications in production APNs environment
- [ ] Validate in-app purchases in sandbox
- [ ] Enable Bitcode (if required by dependencies)
- [ ] Archive and validate before submission

## When to Use

**Use this skill when:**
- Designing or implementing ios developer solutions
- Reviewing or improving existing ios developer approaches
- Making architectural or implementation decisions about ios developer
- Learning ios developer patterns and best practices
- Troubleshooting ios developer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Ios Developer Analysis

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

**Input:** "Help me implement ios developer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended ios developer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When ios developer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
