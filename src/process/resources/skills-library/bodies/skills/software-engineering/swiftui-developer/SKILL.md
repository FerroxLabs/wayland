---
name: swiftui-developer
description: |
  Expert SwiftUI development covering declarative UI composition, state management with Observable, NavigationStack routing, custom animations, async/await data loading, accessibility, platform-adaptive layouts, and production architecture patterns for iOS, iPadOS, macOS, watchOS, and visionOS.
  Use when the user asks about swiftui developer, swiftui developer best practices, or needs guidance on swiftui developer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile best-practices swift design"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# SwiftUI Developer

You are an expert SwiftUI developer who builds modern, production-ready Apple platform applications. You guide developers through declarative UI composition, state management, navigation architecture, animations, and platform-adaptive design using current Swift and SwiftUI best practices.

## State Management

### Observation Framework (Swift 5.9+)

```swift
import SwiftUI
import Observation

@Observable
class TaskStore {
    var tasks: [TaskItem] = []
    var isLoading = false
    var errorMessage: String?

    var pendingTasks: [TaskItem] { tasks.filter { !$0.isCompleted } }
    var completedCount: Int { tasks.filter(\.isCompleted).count }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            tasks = try await TaskService.fetchAll()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func toggle(_ task: TaskItem) {
        guard let index = tasks.firstIndex(where: { $0.id == task.id }) else { return }
        tasks[index].isCompleted.toggle()
    }
}
```

### When to Use Each Property Wrapper

| Wrapper | Purpose | Scope |
|---------|---------|-------|
| `@State` | View-local value types | Single view |
| `@Binding` | Two-way reference to parent state | Parent-child |
| `@Observable` class | Shared reference-type model | App-wide |
| `@Environment` | Dependency injection via view tree | Subtree |
| `@AppStorage` | UserDefaults-backed persistence | App-wide |
| `@SceneStorage` | Scene-level state restoration | Per scene |
| `@FocusState` | Keyboard and focus management | View subtree |

### Environment-Based Dependency Injection

```swift
struct TaskStoreKey: EnvironmentKey {
    static let defaultValue = TaskStore()
}

extension EnvironmentValues {
    var taskStore: TaskStore {
        get { self[TaskStoreKey.self] }
        set { self[TaskStoreKey.self] = newValue }
    }
}

@main
struct TaskApp: App {
    @State private var store = TaskStore()
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.taskStore, store)
        }
    }
}

struct TaskListView: View {
    @Environment(\.taskStore) private var store
    var body: some View {
        List(store.tasks) { task in TaskRow(task: task) }
    }
}
```

## Navigation

### NavigationStack with Type-Safe Routing

```swift
enum Route: Hashable {
    case taskDetail(TaskItem)
    case settings
    case profile(userId: String)
    case category(CategoryItem)
}

struct ContentView: View {
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            TaskListView(path: $path)
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .taskDetail(let task): TaskDetailView(task: task)
                    case .settings: SettingsView()
                    case .profile(let userId): ProfileView(userId: userId)
                    case .category(let category): CategoryView(category: category)
                    }
                }
        }
    }

    func navigateToTask(_ task: TaskItem) { path.append(Route.taskDetail(task)) }
    func popToRoot() { path.removeLast(path.count) }
}
```

### Tab-Based Navigation with Per-Tab Stacks

```swift
struct MainTabView: View {
    @State private var selectedTab: Tab = .tasks

    enum Tab: String, CaseIterable {
        case tasks, search, profile
        var title: String { rawValue.capitalized }
        var icon: String {
            switch self {
            case .tasks: return "checklist"
            case .search: return "magnifyingglass"
            case .profile: return "person.circle"
            }
        }
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            ForEach(Tab.allCases, id: \.self) { tab in
                NavigationStack { tabContent(for: tab) }
                    .tabItem { Label(tab.title, systemImage: tab.icon) }
                    .tag(tab)
            }
        }
    }

    @ViewBuilder
    private func tabContent(for tab: Tab) -> some View {
        switch tab {
        case .tasks: TaskListView()
        case .search: SearchView()
        case .profile: ProfileView()
        }
    }
}
```

## View Composition

### Reusable Component Pattern

```swift
struct MetricCard: View {
    let title: String
    let value: String
    let trend: Trend
    let icon: String

    enum Trend {
        case up, down, flat
        var color: Color {
            switch self { case .up: .green; case .down: .red; case .flat: .secondary }
        }
        var arrow: String {
            switch self { case .up: "arrow.up.right"; case .down: "arrow.down.right"; case .flat: "arrow.right" }
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon).foregroundStyle(.secondary)
                Spacer()
                Image(systemName: trend.arrow).foregroundStyle(trend.color).font(.caption)
            }
            Text(value).font(.title.bold())
            Text(title).font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}
```

### Adaptive Layouts

```swift
struct DashboardView: View {
    @Environment(\.horizontalSizeClass) private var sizeClass
    let metrics: [Metric]

    var body: some View {
        let columns = sizeClass == .compact
            ? [GridItem(.flexible()), GridItem(.flexible())]
            : Array(repeating: GridItem(.flexible()), count: 4)

        ScrollView {
            LazyVGrid(columns: columns, spacing: 16) {
                ForEach(metrics) { metric in
                    MetricCard(title: metric.title, value: metric.formattedValue,
                               trend: metric.trend, icon: metric.icon)
                }
            }
            .padding()
        }
    }
}
```

## Animations

### Matched Geometry Transitions

```swift
struct AnimatedListView: View {
    @Namespace private var animation
    @State private var selectedTask: TaskItem?
    let tasks: [TaskItem]

    var body: some View {
        ZStack {
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(tasks) { task in
                        if selectedTask?.id != task.id {
                            TaskCardView(task: task)
                                .matchedGeometryEffect(id: task.id, in: animation)
                                .onTapGesture {
                                    withAnimation(.spring(duration: 0.4, bounce: 0.2)) {
                                        selectedTask = task
                                    }
                                }
                        }
                    }
                }.padding()
            }
            if let task = selectedTask {
                TaskExpandedView(task: task) {
                    withAnimation(.spring(duration: 0.4, bounce: 0.2)) { selectedTask = nil }
                }
                .matchedGeometryEffect(id: task.id, in: animation)
                .transition(.opacity)
            }
        }
    }
}
```

### Custom Animated Modifiers

```swift
struct ShakeEffect: GeometryEffect {
    var amount: CGFloat = 8
    var shakesPerUnit: CGFloat = 3
    var animatableData: CGFloat

    func effectValue(size: CGSize) -> ProjectionTransform {
        ProjectionTransform(CGAffineTransform(
            translationX: amount * sin(animatableData * .pi * shakesPerUnit), y: 0))
    }
}

extension View {
    func shake(trigger: Bool) -> some View {
        modifier(ShakeEffect(animatableData: trigger ? 1 : 0))
    }
}
```

## Async Data Loading

### Structured Concurrency Pattern

```swift
struct TaskListView: View {
    @Environment(\.taskStore) private var store

    var body: some View {
        List {
            ForEach(store.tasks) { task in
                TaskRow(task: task)
                    .swipeActions(edge: .trailing) {
                        Button(role: .destructive) {
                            Task { await store.delete(task) }
                        } label: { Label("Delete", systemImage: "trash") }
                    }
            }
        }
        .overlay {
            if store.isLoading && store.tasks.isEmpty {
                ProgressView("Loading tasks...")
            }
            if store.tasks.isEmpty && !store.isLoading {
                ContentUnavailableView("No Tasks", systemImage: "checklist",
                                       description: Text("Add a task to get started."))
            }
        }
        .refreshable { await store.load() }
        .task { await store.load() }
        .alert("Error", isPresented: .constant(store.errorMessage != nil)) {
            Button("Retry") { Task { await store.load() } }
            Button("Dismiss", role: .cancel) { store.errorMessage = nil }
        } message: { Text(store.errorMessage ?? "") }
    }
}
```

### Pagination with Infinite Scroll

```swift
@Observable
class PaginatedStore<Item: Identifiable & Decodable> {
    var items: [Item] = []
    var isLoading = false
    var hasMore = true
    private var currentPage = 0
    private let pageSize = 20
    private let endpoint: String

    init(endpoint: String) { self.endpoint = endpoint }

    func loadNextPage() async {
        guard !isLoading, hasMore else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let page: [Item] = try await APIClient.get(
                "\(endpoint)?page=\(currentPage + 1)&limit=\(pageSize)")
            items.append(contentsOf: page)
            currentPage += 1
            hasMore = page.count == pageSize
        } catch { }
    }

    func itemAppeared(_ item: Item) async {
        guard let index = items.firstIndex(where: { $0.id == item.id }),
              index >= items.count - 5 else { return }
        await loadNextPage()
    }
}
```

## Accessibility

```swift
struct AccessibleTaskRow: View {
    let task: TaskItem
    let onToggle: () -> Void

    var body: some View {
        HStack {
            Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                .foregroundStyle(task.isCompleted ? .green : .secondary)
                .imageScale(.large)
            VStack(alignment: .leading) {
                Text(task.title).strikethrough(task.isCompleted)
                if let dueDate = task.dueDate {
                    Text(dueDate, style: .relative)
                        .font(.caption)
                        .foregroundStyle(task.isOverdue ? .red : .secondary)
                }
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(task.title), \(task.isCompleted ? "completed" : "pending")")
        .accessibilityHint("Double tap to toggle completion")
        .accessibilityAddTraits(task.isCompleted ? .isSelected : [])
        .accessibilityAction { onToggle() }
        .contentShape(Rectangle())
        .onTapGesture { onToggle() }
    }
}
```

## Architecture: Repository Pattern

```swift
protocol TaskRepository: Sendable {
    func fetchAll() async throws -> [TaskItem]
    func save(_ task: TaskItem) async throws
    func delete(_ task: TaskItem) async throws
}

struct RemoteTaskRepository: TaskRepository {
    let client: APIClient
    func fetchAll() async throws -> [TaskItem] { try await client.get("/tasks") }
    func save(_ task: TaskItem) async throws { try await client.put("/tasks/\(task.id)", body: task) }
    func delete(_ task: TaskItem) async throws { try await client.delete("/tasks/\(task.id)") }
}

struct CachedTaskRepository: TaskRepository {
    let remote: TaskRepository
    let cache: TaskCache

    func fetchAll() async throws -> [TaskItem] {
        if let cached = try? await cache.loadAll(), !cached.isEmpty {
            Task { try? await refreshCache() }
            return cached
        }
        return try await refreshCache()
    }

    @discardableResult
    private func refreshCache() async throws -> [TaskItem] {
        let tasks = try await remote.fetchAll()
        try? await cache.saveAll(tasks)
        return tasks
    }

    func save(_ task: TaskItem) async throws {
        try await remote.save(task)
        try? await cache.save(task)
    }

    func delete(_ task: TaskItem) async throws {
        try await remote.delete(task)
        try? await cache.remove(task)
    }
}
```

## Testing SwiftUI Views

```swift
import Testing
@testable import TaskApp

@Suite("TaskStore Tests")
struct TaskStoreTests {
    @Test("Loading tasks populates the list")
    func loadTasks() async {
        let mockRepo = MockTaskRepository(tasks: [
            TaskItem(id: "1", title: "Buy groceries", isCompleted: false),
            TaskItem(id: "2", title: "Walk the dog", isCompleted: true),
        ])
        let store = TaskStore(repository: mockRepo)
        await store.load()
        #expect(store.tasks.count == 2)
        #expect(store.pendingTasks.count == 1)
        #expect(store.completedCount == 1)
    }

    @Test("Toggle updates completion state")
    func toggleTask() async {
        let task = TaskItem(id: "1", title: "Test", isCompleted: false)
        let store = TaskStore(repository: MockTaskRepository(tasks: [task]))
        await store.load()
        store.toggle(store.tasks[0])
        #expect(store.tasks[0].isCompleted == true)
    }
}
```

## Production Checklist

- [ ] Use `@Observable` for shared state, `@State` for view-local values
- [ ] Implement NavigationStack with typed routes for deep linking
- [ ] Extract reusable views into components with clear data contracts
- [ ] Add `.accessibilityLabel`, `.accessibilityHint`, and traits to interactive elements
- [ ] Use `.task` and `.refreshable` for async data loading
- [ ] Implement proper error states with `ContentUnavailableView`
- [ ] Use `LazyVStack`/`LazyVGrid` for long scrollable content
- [ ] Test state logic independently from views using Swift Testing
- [ ] Support Dynamic Type and both light/dark color schemes
- [ ] Handle size class changes for iPad and multitasking layouts
- [ ] Use `@Environment` for dependency injection, not singletons

## When to Use

**Use this skill when:**
- Designing or implementing swiftui developer solutions
- Reviewing or improving existing swiftui developer approaches
- Making architectural or implementation decisions about swiftui developer
- Learning swiftui developer patterns and best practices
- Troubleshooting swiftui developer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Swiftui Developer Analysis

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

**Input:** "Help me implement swiftui developer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended swiftui developer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When swiftui developer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
