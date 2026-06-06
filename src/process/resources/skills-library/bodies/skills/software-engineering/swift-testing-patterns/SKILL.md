---
name: swift-testing-patterns
description: |
  Guides expert-level swift testing patterns implementation: swift and mobile decision frameworks, production-ready patterns, and concrete templates for swift testing patterns workflows.
  Use when the user asks about swift testing patterns, swift testing patterns configuration, or swift best practices for swift projects.
  Do NOT use when the user needs a different languages runtimes capability -- check sibling skills in the languages runtimes subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "swift mobile testing"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Swift Testing Patterns

## When to Use

**Use this skill when:**
- User is writing unit tests, integration tests, or UI tests for a Swift application and wants to apply idiomatic patterns beyond the basics
- User is migrating from XCTest to the new Swift Testing framework (introduced in Xcode 15 / Swift 5.9) and needs to understand the differences and migration path
- User wants to implement testable architecture patterns in Swift -- dependency injection, protocol-based mocking, or actor-isolated testing
- User is dealing with async/await testing challenges, including actors, async sequences, and structured concurrency in tests
- User wants to reduce test fragility, improve test isolation, or speed up a slow test suite in a Swift or SwiftUI project
- User is building a test pyramid strategy for an iOS, macOS, watchOS, or visionOS project and needs guidance on unit vs integration vs UI test boundaries
- User asks about property-based testing, snapshot testing, or contract testing in a Swift context

**Do NOT use this skill when:**
- User needs Objective-C testing patterns -- the runtime model, OCMock usage, and method swizzling patterns differ substantially; use a dedicated Objective-C skill
- User is asking about Xcode configuration, test targets setup, or CI/CD pipeline configuration for test runners -- those are infrastructure concerns, not code patterns
- User needs XCUITest or Accessibility Inspector workflows for UI automation scripting -- that is a dedicated test automation skill
- User is asking about performance testing with XCTMetrics or the Instruments profiling tool -- that crosses into performance profiling territory
- User wants general iOS architecture advice (MVVM, TCA, VIPER) not specifically tied to testability -- use an architecture skill and cross-reference testability concerns
- User is testing a server-side Swift application on Vapor or Hummingbird -- those frameworks have distinct testing idioms around request/response lifecycle
- User is asking about test coverage reporting tooling (slather, Codecov integration) -- that is a CI tooling concern

---

## Process

### 1. Assess the Swift Version and Testing Framework Landscape

Before recommending patterns, establish which testing framework the project uses:

- Determine if the project targets Swift 5.9+ with Xcode 15+, which unlocks the native `Swift Testing` framework (`import Testing`). If so, prefer Swift Testing patterns for new tests. XCTest remains valid for UI tests and legacy code.
- If the project is on Swift 5.8 or earlier, all patterns must use XCTest exclusively. Do not recommend `@Test`, `#expect`, or `@Suite` macros -- they will not compile.
- Identify the deployment target. Async/await in tests requires iOS 13+/macOS 10.15+ for the runtime, but test code itself can use `async throws` with `XCTestExpectation` workarounds on earlier targets.
- Check whether the project uses a third-party assertion library (Quick/Nimble, PointFree's swift-custom-dump) and factor that into pattern recommendations. Do not recommend replacing established libraries mid-project unless there is a clear problem.
- Confirm whether the project has a modular architecture with Swift Package Manager modules. Tests for SPM modules must live in the `Tests/` target within the package manifest and cannot reference UIKit by default.

### 2. Classify the Test Categories and Define the Test Pyramid

Establish clear boundaries between test layers before writing a single test:

- **Unit tests** in Swift test a single type in complete isolation. The type under test should have all dependencies replaced by test doubles. Target execution time under 0.1 seconds per test. A suite of 500 unit tests should complete in under 10 seconds.
- **Integration tests** test the interaction between 2-4 real collaborators (e.g., a real `URLSession` against a local mock server using `URLProtocol` stubbing). These are acceptable at 0.5-2 seconds per test.
- **Snapshot tests** (using swift-snapshot-testing from Point-Free) verify rendered output of SwiftUI views or UIKit views. Treat these as integration tests; they depend on simulator resolution and OS version. Always parameterize by device type.
- **UI tests** (XCUITest) are end-to-end and should number no more than 20-30 critical path tests. Target under 3 minutes total suite time. Use `XCUIApplication().launch()` with launch arguments to pre-seed state.
- A healthy iOS project typically has a ratio of 70% unit / 20% integration / 10% UI tests by count. Invert this ratio only when the codebase is predominantly glue code with little business logic.

### 3. Design for Testability -- Dependency Injection Patterns

This is the highest-leverage step. Untestable code is almost always caused by uncontrolled dependencies:

- **Protocol-based injection** is the most common Swift pattern. Define a protocol that abstracts the dependency, provide the real implementation in production, and inject a test double in tests. Keep protocols narrow -- a `UserFetching` protocol with one method is better than a fat `NetworkService` protocol with 20 methods.
- **Closure injection** is lighter-weight than protocols for single-function dependencies. Instead of a `DateProviding` protocol, inject a `() -> Date` closure and default it to `{ Date() }`. In tests, pass `{ Date(timeIntervalSince1970: 1_700_000_000) }` for deterministic time.
- **`@Environment` injection in SwiftUI** -- never read from a global environment in view models or reducers. Pass environment values through initializers or use SwiftUI's `.environment()` modifier with custom `EnvironmentKey` types to inject fakes in `PreviewProvider` and test hosts.
- **Actor-isolated dependencies** -- when a dependency is an `actor`, inject it via a protocol that the actor conforms to. Do not access actor state directly in tests; send messages through the actor interface to avoid data races in concurrent test execution.
- Avoid `@Singleton` and `static var shared` patterns entirely in tested code. If a singleton exists in a third-party SDK, wrap it behind a protocol at the boundary.

### 4. Implement Test Doubles Correctly

Swift's strong type system creates specific constraints on how doubles are built:

- **Manual mocks** are preferred in Swift over generated mocks (unlike Java/Kotlin where Mockito is standard). Generate manual mocks using a consistent template: one `Bool` property per method to track calls, one stored property per method to configure return values or thrown errors.
- **`@MockActor` pattern for actors** -- when mocking an actor-isolated type, make the mock a `final class` that conforms to the protocol. You do not need to make the mock itself an actor unless the protocol has `nonisolated` requirements that conflict.
- **`Result`-based stubs** -- configure test doubles to return `Result<T, Error>` values rather than optionals. This forces test authors to handle both success and failure paths: `var stubbedResult: Result<User, Error> = .success(.fixture())`.
- **Spy pattern for side effects** -- track call counts and arguments: `var capturedRequests: [URLRequest] = []`. Assert on these arrays in tests to verify behavior without overspecifying internal implementation.
- **Never use `@discardableResult` on protocol methods you intend to spy on** -- you will miss call verification.
- For `Combine` publishers, use `PassthroughSubject` or `CurrentValueSubject` as injectable stubs: `var userSubject = PassthroughSubject<User, Never>()` and call `userSubject.send(.fixture())` in tests.

### 5. Write Tests Using Swift Testing Framework Idioms (Swift 5.9+)

When the project supports Swift Testing, apply these patterns:

- **`@Test` functions** replace `func testXxx()` naming conventions. Test functions can be named naturally: `@Test func fetchingUserSucceedsWhenNetworkResponds()`.
- **`#expect` macro** replaces `XCTAssert*`. It captures the full expression in failure output: `#expect(user.name == "Ada Lovelace")` prints both sides on failure without additional message scaffolding.
- **`#require` macro** is the Swift Testing equivalent of `XCTUnwrap` -- it throws on failure rather than continuing: `let user = try #require(response.user)`. Use this to gate subsequent assertions on non-nil values.
- **`@Suite` struct organization** replaces `XCTestCase` subclasses. Group related tests in a struct: `@Suite("UserRepository") struct UserRepositoryTests`. Each `@Suite` gets its own instance per test, providing automatic isolation without `setUp`/`tearDown`.
- **Parameterized tests** with `@Test(arguments:)` eliminate copy-paste test variations: `@Test(arguments: [("ada@example.com", true), ("not-an-email", false)]) func emailValidation(input: String, expected: Bool)`.
- **Test tags** with `@Tag` enable selective test execution in CI: `@Test(.tags(.networking)) func ...`. Define tags as static extensions on `Tag` to ensure compile-time safety.
- **`withKnownIssue`** replaces `XCTExpectFailure` for tests that are expected to fail temporarily during a migration or while a bug is tracked.

### 6. Handle Async/Concurrency Testing

Async testing is one of the most error-prone areas in modern Swift:

- In XCTest, `async throws` test methods are supported directly since Xcode 13. Mark the test `func testFetch() async throws` and `await` directly. Do not use `XCTestExpectation` for async/await -- it is a legacy pattern for callback-based APIs only.
- For callback-based APIs being tested, use `withCheckedThrowingContinuation` inside a test helper to bridge to async/await rather than managing raw `XCTestExpectation` fulfillment counts.
- **Testing actors** -- access actor-isolated state from the test using `await`: `let state = await viewModel.state`. Assert on the returned value. Never access actor properties from the main thread without `await`.
- **`MainActor`-isolated ViewModels** -- mark the test function `@MainActor` when testing types annotated with `@MainActor`. This prevents `Expression is 'async' but is not marked with 'await'` warnings and ensures correct thread context.
- **Testing `AsyncSequence`** -- collect values into an array using `var values: [Int] = []; for await v in sequence { values.append(v) }`. Add a cancellation timeout using `Task` and `Task.sleep` to prevent test hangs when a sequence never completes.
- **Clock injection for deterministic timing** -- use Swift's `Clock` protocol (available from Swift 5.7) to inject a `TestClock` or `ManualClock` instead of `Task.sleep(nanoseconds:)`. The swift-clocks library from Point-Free provides `TestClock` with `advance(by:)` for deterministic control.
- For Combine pipelines, use the `XCTestExpectation` + `sink` pattern or convert to `AsyncStream` using `values` property and test with async/await.

### 7. Structure Test Files and Fixtures

Test organization directly impacts maintainability:

- Mirror the source directory structure in the test target. If source has `Sources/Features/User/UserRepository.swift`, tests live in `Tests/Features/User/UserRepositoryTests.swift`.
- **Test fixtures using static factory methods** -- create a `UserFixtures.swift` file in a `TestSupport` module (or test target helper group): `extension User { static func fixture(name: String = "Ada Lovelace", email: String = "ada@example.com") -> User }`. This makes tests readable and isolates fixture evolution from test logic.
- **Builder pattern for complex fixtures** -- when a model has 10+ properties, use a builder: `User.Builder().withName("Ada").withRole(.admin).build()`. This avoids positional argument errors in fixture factory calls.
- **`@discardableResult` on builder methods** -- always include so chained calls do not generate warnings.
- Keep test helper types in a separate `TestSupport` Swift package target that is listed as a `.testTarget` dependency. This prevents test helpers from leaking into the production binary.
- Use `#file`, `#line` forwarding in custom assertion helpers: `func assertUser(_ user: User, file: StaticString = #file, line: UInt = #line)`. This ensures Xcode highlights the correct call site when an assertion fails, not the line inside the helper function.

### 8. Validate, Tune, and Maintain the Test Suite

A test suite is production code and requires the same discipline:

- Run tests with `--parallel` in Xcode (Product > Test > Enabled Parallelization). Swift Testing runs parallel by default; XCTest requires explicit opt-in. Ensure tests pass under parallelization before enabling.
- Identify flaky tests by running the suite 10 times in CI using `xcodebuild test -maximum-concurrent-test-device-destinations 4`. Any test that fails in fewer than 10/10 runs is flaky and must be fixed or quarantined.
- Track test execution time per test. Any unit test exceeding 0.5 seconds is likely doing real I/O or waiting on a real timer. Replace with injected fakes.
- Use `swift test --filter` (SPM) or `xcodebuild -only-testing:` to run specific test subsets during development. Do not run the full suite on every local save -- reserve that for CI.
- Add `XCTSkip` (XCTest) or `@Test(.disabled(...))` (Swift Testing) with a ticket number for tests that are temporarily broken: `@Test(.disabled("Blocked on JIRA-1234: UserRepository migration"))`. Never delete a failing test -- quarantine it with documentation.
- Review test coverage with `xcodebuild test -enableCodeCoverage YES`. Target 80% line coverage on business logic modules. Do not chase 100% -- testing `deinit` and `description` overrides provides no safety signal.

---

## Output Format

When advising on Swift testing patterns, structure your response as follows:

```
## Swift Testing Assessment

### Project Context
- Swift version: [version]
- Testing framework: [XCTest | Swift Testing | Mixed]
- Test pyramid status: [current ratio and target ratio]
- Primary gap identified: [isolation | async | organization | coverage]

### Dependency Injection Strategy

| Dependency Type        | Injection Pattern     | Test Double Type | Notes                        |
|------------------------|-----------------------|------------------|------------------------------|
| [e.g., NetworkService] | Protocol injection    | Manual mock      | Stub Result<T,Error> return  |
| [e.g., Current date]   | Closure injection     | Closure literal  | () -> Date                   |
| [e.g., UserDefaults]   | Protocol injection    | In-memory stub   | Implement with Dictionary    |
| [e.g., Async stream]   | AsyncStream injection | AsyncStream.init | Use continuation for control |

### Pattern Recommendations

#### Unit Test Pattern
[Specific XCTest or Swift Testing code example for this project's context]

#### Integration Test Pattern
[Specific URLProtocol stubbing or service integration code example]

#### Async Test Pattern
[Specific async/await or Clock injection code example]

### Test Fixture Strategy
[Factory method or builder pattern code for this domain]

### Migration Path (if applicable)
Step 1: [First concrete action]
Step 2: [Second concrete action]
Step 3: [Third concrete action]

### Metrics Targets
- Unit test execution time: < [X] seconds for [N] tests
- Flaky test threshold: 0 flaky tests in CI
- Coverage target: [X]% on business logic, [Y]% overall
```

---

## Rules

1. **NEVER test implementation details -- test observable behavior.** A test that calls a private method via `@testable import` to verify an intermediate calculation is testing the wrong thing. Test the public interface's output for a given input. Refactoring internal code must not break tests unless behavior changes.

2. **ALWAYS use `@testable import` only for accessing internal types, not for bypassing encapsulation.** If you find yourself needing `@testable import` to call a private function directly, the code has a testability design problem. Redesign the public interface to expose the behavior under test.

3. **NEVER use `sleep()` or `Task.sleep` in tests for synchronization.** This is the number one cause of flaky tests and slow suites. Inject a `Clock` or use a `ManualClock` to advance time deterministically. Use `XCTestExpectation` with explicit `waitForExpectations(timeout: 2.0)` only for callback-based code that cannot be refactored.

4. **ALWAYS isolate filesystem, UserDefaults, and Keychain access in tests.** Tests that write to real `UserDefaults.standard` or the real Keychain will pollute state between test runs. Inject a `UserDefaultsProtocol` backed by an in-memory dictionary. For filesystem tests, use `FileManager.default.temporaryDirectory` and clean up in `tearDown` or `deinit`.

5. **NEVER share mutable state between test methods in the same `XCTestCase` subclass.** Declare all mutable test state as `private var` and re-initialize it in `setUp()`. If using Swift Testing, the `@Suite` struct instantiation per test handles this automatically -- do not add `mutating setUp()` equivalents.

6. **ALWAYS parameterize tests that share the same logical structure with different inputs.** Three tests that differ only in input values must become one parameterized test using `@Test(arguments:)` in Swift Testing or a data-driven loop with `XCTContext.runActivity` in XCTest. Duplicate test bodies are maintenance debt.

7. **NEVER mock types you do not own.** Do not create a mock conformance for `URLSession`, `CLLocationManager`, or `AVAudioPlayer` directly. Wrap them in your own protocol first, then mock your protocol. This protects you from breaking changes in Apple SDKs and keeps the mock surface minimal.

8. **ALWAYS name tests using the Given-When-Then or "subject_condition_expectedResult" naming pattern.** Examples: `fetchUser_whenNetworkFails_throwsNetworkError` or `emailValidator_withMissingAtSign_returnsFalse`. This makes test failure output immediately diagnostic without opening the test file.

9. **NEVER let a test suite run time exceed 3 minutes on CI for the unit + integration tiers.** If it does, identify the slowest 10 tests using `xcodebuild` result bundles and profile them. Slow tests are almost always caused by real I/O, real timers, or test setup that instantiates the full app dependency graph.

10. **ALWAYS write tests before marking a bug as fixed.** A regression test that reproduces the original bug must be added in the same commit as the fix. Reference the bug report number in the test name: `@Test func userRepository_regressionBUG1234_duplicateInsertDoesNotCrash()`. This creates a permanent guard against recurrence.

---

## Edge Cases

### Testing `@MainActor`-isolated SwiftUI ViewModels
When a ViewModel is annotated with `@MainActor`, test functions must also be `@MainActor` or the compiler will require `await` on every property access. Annotate the entire `XCTestCase` subclass with `@MainActor` rather than individual test methods. In Swift Testing, annotate the `@Suite` struct. Be aware that `@MainActor` on an `XCTestCase` subclass runs `setUp` and `tearDown` on the main thread -- this is usually correct but can deadlock if `setUp` calls `async` code that itself dispatches to `MainActor` from within a `Task`. Use `await MainActor.run {}` to safely dispatch when needed.

### Testing Code That Uses `@Observable` (Swift 5.9 Observation Framework)
`@Observable` types do not expose a publisher or combine stream by default. To test reactive behavior, observe property changes by reading the property after triggering the action: `await viewModel.triggerFetch(); #expect(viewModel.users.count == 3)`. If you need to assert that a property change fires at least once, use `withObservationTracking` in a test helper that records observed changes. Do not attempt to use `Combine` sink patterns on `@Observable` types unless you have manually bridged to a publisher.

### Testing Error Propagation Through `throws` and `async throws`
When verifying that a function throws a specific error type, use `#expect(throws: NetworkError.self)` in Swift Testing or `XCTAssertThrowsError` with type-casting in XCTest. Never use a bare `try?` in a test that is supposed to verify error throwing -- silent failure converts a thrown error into nil and the test passes incorrectly. For async throwing functions in XCTest, use `await XCTAssertThrowsError(try await sut.fetch())` -- note that this requires Xcode 13.2+ where the async overload of `XCTAssertThrowsError` is available. In earlier Xcode versions, use a `do/catch` with `XCTFail` in the `catch` block.

### Testing Code Using `Sendable` and Structured Concurrency
Strict concurrency checking (`-strict-concurrency=complete`) can cause test helpers to generate warnings or errors when they capture values in closures across actor boundaries. When writing test helpers that use `Task {}` internally, annotate them with `@Sendable` where necessary and use `@unchecked Sendable` sparingly only on types that you have verified are thread-safe through locks or serial queues. Test targets should compile with the same concurrency checking level as the production target to catch real issues.

### Snapshot Tests Across Device Configurations
Point-Free's swift-snapshot-testing library stores reference images in the repository. These images are resolution- and OS-version-dependent. Establish a strict policy: snapshot tests run only on a single designated simulator configuration (e.g., iPhone 15 Pro, iOS 17.2) on CI. Use `XCTSkip` guarded by a runtime check when not on the designated device: `try XCTSkipUnless(UIDevice.current.name.contains("iPhone 15 Pro"), "Snapshot tests require iPhone 15 Pro simulator")`. Record mode (`record: true`) must be disabled before committing -- use an environment variable `SNAPSHOT_RECORD` to gate this, never hardcode `true`.

### Testing Combine Pipelines with Backpressure and Buffering
When testing `Combine` pipelines that use `.buffer(size:prefetch:whenFull:)` or `.debounce(for:scheduler:)`, you must inject a fake `Scheduler`. Use `ImmediateScheduler.shared` for synchronous pipelines or `TestScheduler` from the CombineSchedulers library (Point-Free) for time-sensitive pipelines. A test that uses `RunLoop.main` or `DispatchQueue.main` as the scheduler will behave differently in a headless CI test runner versus an interactive session. Never rely on `RunLoop.main` advancing automatically in a test -- it may not.

### Modular SPM Projects with Cross-Module Dependency Injection
In a multi-module Swift package, test targets cannot import types marked `internal` from sibling modules. Structure the codebase so that protocols defining injection points are `public` and live in a dedicated `Interfaces` module. The concrete implementations live in a `Implementations` module. The test target imports `Interfaces` and provides its own test double conformances. This avoids the circular dependency that arises when the test target tries to import the real `Implementations` module just to access a protocol.

### Legacy `XCTestCase` Migration to Swift Testing
Do not migrate `XCTestCase` subclasses that contain `setUp`, `tearDown`, and more than 30 test methods all at once. Migrate one logical group at a time. Critical difference: Swift Testing `@Suite` structs do not run `XCTest` assertions -- `XCTAssertEqual` compiles but does not integrate with the Swift Testing runner. Audit the test file for `XCTAssert*` calls and replace them with `#expect` during migration. Mixed files (some `@Test` functions in a class that also inherits `XCTestCase`) are not supported -- a type must be one or the other.

---

## Example

**Input:** "I have a Swift 5.9 iOS app with a `UserRepository` that fetches users from a REST API using `async/await`. The repository is hard-coded to use `URLSession.shared`. Tests currently don't exist. I'm on Xcode 15. How do I add tests?"

**Output:**

### Swift Testing Assessment

**Project Context**
- Swift version: 5.9 with Xcode 15
- Testing framework: Swift Testing available (use for new tests)
- Test pyramid status: 0% coverage -- starting from scratch
- Primary gaps: No dependency injection, direct `URLSession.shared` usage

---

### Step 1 -- Refactor `UserRepository` for Testability

The core problem is that `URLSession.shared` is a global singleton. Introduce a protocol:

```swift
// Sources/Networking/HTTPClient.swift
public protocol HTTPClient: Sendable {
    func data(for request: URLRequest) async throws -> (Data, URLResponse)
}

// Make URLSession conform to the protocol
extension URLSession: HTTPClient {}

// Sources/Features/User/UserRepository.swift
public final class UserRepository: Sendable {
    private let client: any HTTPClient
    private let baseURL: URL
    private let decoder: JSONDecoder

    public init(
        client: any HTTPClient = URLSession.shared,
        baseURL: URL = URL(string: "https://api.example.com")!,
        decoder: JSONDecoder = .init()
    ) {
        self.client = client
        self.baseURL = baseURL
        self.decoder = decoder
    }

    public func fetchUser(id: String) async throws -> User {
        let request = URLRequest(url: baseURL.appendingPathComponent("users/\(id)"))
        let (data, response) = try await client.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              (200..<300).contains(httpResponse.statusCode) else {
            throw UserRepositoryError.invalidResponse
        }
        return try decoder.decode(User.self, from: data)
    }
}

public enum UserRepositoryError: Error, Equatable {
    case invalidResponse
    case decodingFailed
}
```

**Why this works:** Production code uses the default `URLSession.shared` with zero behavioral change. Tests inject a fake `HTTPClient` with no network I/O.

---

### Step 2 -- Create the Test Double

```swift
// Tests/TestSupport/MockHTTPClient.swift
import Foundation
@testable import YourModule

final class MockHTTPClient: HTTPClient, @unchecked Sendable {
    // Configuration
    var stubbedResult: Result<(Data, URLResponse), Error> =
        .failure(MockHTTPClientError.notConfigured)

    // Spy
    private(set) var capturedRequests: [URLRequest] = []

    func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        capturedRequests.append(request)
        return try stubbedResult.get()
    }
}

enum MockHTTPClientError: Error {
    case notConfigured
}
```

---

### Step 3 -- Create Test Fixtures

```swift
// Tests/TestSupport/User+Fixtures.swift
import Foundation
@testable import YourModule

extension User {
    static func fixture(
        id: String = "usr_001",
        name: String = "Ada Lovelace",
        email: String = "ada@example.com",
        role: User.Role = .standard
    ) -> User {
        User(id: id, name: name, email: email, role: role)
    }
}

extension HTTPURLResponse {
    static func fixture(
        url: URL = URL(string: "https://api.example.com")!,
        statusCode: Int = 200
    ) -> HTTPURLResponse {
        HTTPURLResponse(url: url, statusCode: statusCode, httpVersion: nil, headerFields: nil)!
    }
}
```

---

### Step 4 -- Write Tests Using Swift Testing

```swift
// Tests/Features/User/UserRepositoryTests.swift
import Testing
import Foundation
@testable import YourModule

@Suite("UserRepository")
struct UserRepositoryTests {

    // MARK: - Dependencies

    let client = MockHTTPClient()
    let baseURL = URL(string: "https://api.example.com")!
    var sut: UserRepository {
        UserRepository(client: client, baseURL: baseURL)
    }

    // MARK: - fetchUser(id:)

    @Test("returns decoded user when API responds with 200")
    func fetchUser_with200Response_returnsDecodedUser() async throws {
        // Given
        let expectedUser = User.fixture()
        let userData = try JSONEncoder().encode(expectedUser)
        client.stubbedResult = .success((userData, HTTPURLResponse.fixture(statusCode: 200)))

        // When
        let user = try await sut.fetchUser(id: "usr_001")

        // Then
        #expect(user.name == "Ada Lovelace")
        #expect(user.id == "usr_001")
    }

    @Test("sends request to correct URL")
    func fetchUser_sendsRequestToCorrectEndpoint() async throws {
        // Given
        let expectedUser = User.fixture()
        let userData = try JSONEncoder().encode(expectedUser)
        client.stubbedResult = .success((userData, HTTPURLResponse.fixture()))

        // When
        _ = try await sut.fetchUser(id: "usr_001")

        // Then
        let request = try #require(client.capturedRequests.first)
        #expect(request.url?.absoluteString == "https://api.example.com/users/usr_001")
    }

    @Test("throws invalidResponse when status code is 404")
    func fetchUser_with404Response_throwsInvalidResponse() async throws {
        // Given
        client.stubbedResult = .success((Data(), HTTPURLResponse.fixture(statusCode: 404)))

        // When / Then
        await #expect(throws: UserRepositoryError.invalidResponse) {
            try await sut.fetchUser(id: "usr_001")
        }
    }

    @Test("throws when network layer throws")
    func fetchUser_whenClientThrows_propagatesError() async throws {
        // Given
        struct NetworkDown: Error {}
        client.stubbedResult = .failure(NetworkDown())

        // When / Then
        await #expect(throws: NetworkDown.self) {
            try await sut.fetchUser(id: "usr_001")
        }
    }

    @Test(
        "throws invalidResponse for any non-2xx status code",
        arguments: [400, 401, 403, 500, 503]
    )
    func fetchUser_withNon2xxStatus_throwsInvalidResponse(statusCode: Int) async throws {
        // Given
        client.stubbedResult = .success((Data(), HTTPURLResponse.fixture(statusCode: statusCode)))

        // When / Then
        await #expect(throws: UserRepositoryError.invalidResponse) {
            try await sut.fetchUser(id: "usr_001")
        }
    }
}
```

---

### Step 5 -- Verify Suite Performance

After running the suite:

```
Test Suite 'UserRepositoryTests' passed
  Executed 8 tests in 0.031 seconds
```

Eight tests in 31 milliseconds -- well under the 0.1-second-per-test target. The suite has zero network I/O, zero filesystem access, and zero global state mutation.

---

### Dependency Injection Strategy Summary

| Dependency | Injection Pattern | Test Double | Notes |
|---|---|---|---|
| `URLSession` / `HTTPClient` | Protocol injection | `MockHTTPClient` (manual) | Conforms via `extension URLSession: HTTPClient` |
| `JSONDecoder` | Initializer injection | Default value in production | Override in tests with misconfigured decoder to test decoding errors |
| `URL` (baseURL) | Initializer injection | Hardcoded `localhost` URL | Prevents accidental real network calls in tests |
| Current date (if needed) | Closure `() -> Date` | `{ Date(timeIntervalSince1970: 0) }` | Deterministic timestamp assertions |

---

### Metrics Targets

| Metric | Target | Current |
|---|---|---|
| Unit test execution time | < 2 seconds for full suite | 0.031 seconds for 8 tests |
| Flaky test count | 0 | 0 (no async timers, no real I/O) |
| Business logic coverage | > 80% | ~95% for `UserRepository` |
| Tests per public method | 3-5 (happy path + 2-4 failure modes) | 4 for `fetchUser(id:)` |
