---
name: angular-testing-patterns
description: |
  Guides expert-level angular testing patterns implementation: typescript and testing decision frameworks, production-ready patterns, and concrete templates for angular testing patterns workflows.
  Use when the user asks about angular testing patterns, angular testing patterns configuration, or typescript best practices for angular projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "typescript testing frameworks automation"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Angular Testing Patterns

## When to Use

**Use this skill when:**
- User is writing unit tests for Angular components, services, directives, pipes, or guards using TestBed and Jasmine/Jest
- User needs to test Angular components with complex template bindings, `@Input`/`@Output` properties, or child component interactions
- User is setting up a testing strategy for an Angular project and needs to decide between shallow rendering, isolated tests, and integration tests
- User wants to test Angular services that use HttpClient, RxJS observables, signals, or complex dependency injection hierarchies
- User needs to configure Jest as a replacement for the default Karma/Jasmine setup in an Angular project
- User is testing NgRx store interactions, effects, selectors, or reducers in an Angular application
- User needs to debug flaky tests, slow test suites, or tests that fail only in CI but pass locally
- User is testing Angular Router navigation, route guards, or resolver logic
- User wants to implement component harnesses using Angular CDK Testing infrastructure

**Do NOT use this skill when:**
- User needs help with React Testing Library or Vue Test Utils -- check the react-testing or vue-testing skills
- User asks about end-to-end testing with Cypress or Playwright for Angular apps -- check the e2e-testing skill
- User needs help with Angular application architecture or state management design outside of testability concerns
- User is asking about testing Node.js backends, REST APIs, or non-Angular TypeScript code -- check the node-testing skill
- User needs help with CI/CD pipeline configuration beyond test runner execution -- check the ci-cd-pipelines skill
- User is asking about general TypeScript type system usage not related to tests -- check the typescript-patterns skill
- User needs help with Angular performance profiling or bundle analysis -- check the angular-performance skill

---

## Process

### 1. Classify the Code Under Test and Choose the Right Test Type

Before writing a single line of test code, identify exactly what you are testing and which test strategy applies. Angular has four distinct testing contexts that require fundamentally different setups.

- **Isolated unit tests** -- for pure logic: services with no HTTP, pipes, utility functions, pure reducers. Use no Angular testing module at all. Instantiate directly with `new MyService(dep1, dep2)` and pass mocked dependencies manually.
- **Shallow component tests** -- for components where only this component's behavior matters. Use `NO_ERRORS_SCHEMA` or `CUSTOM_ELEMENTS_SCHEMA` to suppress child component errors, or declare stub components. This is the most common pattern.
- **Deep integration tests** -- for testing parent/child component interaction, content projection, or template-driven forms. Declare all child components explicitly. Reserve this for true integration concerns -- it is expensive.
- **TestBed service tests** -- for services with Angular DI dependencies like `HttpClient`, `Router`, or store providers. Use `TestBed.configureTestingModule` with real or stubbed providers.

Identify the classification before writing the `describe` block. Wrong classification is the #1 source of brittle, slow, or falsely-passing tests in Angular projects.

### 2. Configure TestBed with Minimal, Targeted Declarations

TestBed configuration directly controls test speed and isolation. Every unnecessary declaration adds compilation overhead.

- Import only the modules your component actually needs. Replace `BrowserModule` imports with `CommonModule` in tests. Never import `AppModule` or `CoreModule` -- these pull in the entire application.
- Use `TestBed.configureTestingModule` with `declarations`, `imports`, `providers`, and optionally `schemas`.
- For components using Angular Material, import individual component modules (e.g., `MatButtonModule`, `MatInputModule`) rather than `MaterialModule` barrel imports.
- Prefer `ComponentFixture<T>` over manually constructing components. Let TestBed handle change detection lifecycle.
- Use `compileComponents()` only when your component has external template URLs or style URLs. Inline templates skip this requirement and speed up the test suite.
- When using Jest instead of Karma, configure `jest-preset-angular` in `jest.config.ts`. Set `testEnvironment: 'jsdom'`, enable `inlineStylesTransformer`, and set `tsconfig` to your `tsconfig.spec.json`.
- Set `teardown: { destroyAfterEach: true }` in `TestBed.configureTestingModule` for Angular 14+ projects to prevent state leaking between tests.

### 3. Mock Dependencies at the Right Fidelity Level

Overmocking produces tests that pass but do not catch real regressions. Undermocking produces slow, brittle tests that couple to implementation.

- **For services injected into components**, use `jasmine.createSpyObj` or Jest's `jest.fn()` to create typed spies: `const serviceSpy = jasmine.createSpyObj<MyService>('MyService', ['getData', 'saveItem'])`.
- **For HttpClient**, use `HttpClientTestingModule` and `HttpTestingController` rather than mocking HttpClient directly. This lets you assert on request URLs, methods, headers, and bodies.
- **For Router**, provide `RouterTestingModule` for most navigation tests. For guard tests, mock `ActivatedRouteSnapshot` and `RouterStateSnapshot` directly with object literals.
- **For RxJS observables in services**, return controlled `Subject`, `BehaviorSubject`, or `of(value)` from spy return values. Never use `interval` or `timer` in tests without fake async.
- **For NgRx**, use `provideMockStore` from `@ngrx/store/testing` with `initialState`. Do not configure a real store reducer in unit tests.
- **For Angular Signals**, signals are synchronous and do not need special treatment, but you must call `fixture.detectChanges()` after mutating signal values to trigger template re-rendering.
- Typed mocks using `Partial<T>` cast as `T` are acceptable for simple cases: `{ getData: () => of(mockData) } as MyService`.

### 4. Control Change Detection Deliberately

Uncontrolled change detection is the second leading cause of flaky Angular tests. Understanding when Angular's CD runs in tests versus production is critical.

- `fixture.detectChanges()` manually triggers Angular's change detection cycle. Call it once after setup to render the initial state, then again after each interaction that should update the view.
- Never rely on automatic change detection in `ComponentFixture` unless you explicitly set `{ detectChanges: false }` in `createComponent` options to understand when you are overriding defaults.
- Use `fixture.autoDetectChanges(true)` only in integration tests where you want CD to fire on every async completion. It adds overhead and obscures the exact trigger of a view update.
- For `async` operations (promises, observables, HTTP), wrap the test body in `fakeAsync` and use `tick(ms)` to advance the virtual clock. Use `flushMicrotasks()` for resolved promises.
- Use `waitForAsync` (formerly `async`) when you have actual `async/await` patterns or need the real zone. Prefer `fakeAsync` because it gives you deterministic time control.
- After calling `tick()` or advancing time, always call `fixture.detectChanges()` to flush the view.
- For `debounceTime(300)` in a component, the test must call `tick(300)` inside `fakeAsync` to simulate the debounce, then `detectChanges()`.

### 5. Query the DOM Accurately and Resiliently

How you query the DOM determines whether your tests survive template refactors. Fragile selectors are a maintenance tax.

- Prefer `By.css('[data-testid="submit-button"]')` over `By.css('.btn-primary')` or `By.css('button:nth-child(2)')`. Add `data-testid` attributes in templates specifically for testing. This decouples tests from CSS styling decisions.
- Use `fixture.debugElement.query(By.css(...))` to return a `DebugElement`. Call `.nativeElement` to get the DOM node and `.componentInstance` to get the component instance.
- Use `fixture.debugElement.queryAll(By.css(...))` when asserting on lists of items (e.g., `*ngFor` rendered items).
- Use `By.directive(MyDirective)` to find elements that have a specific directive applied.
- For Angular CDK-based components (Material), use `HarnessLoader` from `@angular/cdk/testing/testbed` and component harnesses. Example: `await loader.getHarness(MatInputHarness)` returns a high-level interface that survives internal Material DOM changes.
- Text content assertions: use `nativeElement.textContent.trim()` rather than `innerHTML` to avoid whitespace and comment node noise.
- Trigger DOM events with `nativeElement.dispatchEvent(new Event('click'))` or `triggerEventHandler('click', null)` on the `DebugElement`. Use `nativeElement.click()` for simple click triggers.

### 6. Test Asynchronous Code Patterns Correctly

Async testing is where most Angular test failures and flakiness originate. Each async pattern has a specific correct handling strategy.

- **HTTP requests with HttpTestingController:**
  ```typescript
  const req = httpMock.expectOne('/api/users');
  expect(req.request.method).toBe('GET');
  req.flush(mockUsers);
  httpMock.verify(); // in afterEach
  ```
- **RxJS observables with fakeAsync:**
  ```typescript
  fakeAsync(() => {
    let result: User[];
    service.getUsers().subscribe(data => result = data);
    tick();
    expect(result).toEqual(mockUsers);
  })
  ```
- **Debounce/throttle operators:** Use `tick(debounceMs + 1)` to advance past the debounce threshold. Always add 1ms buffer.
- **Intervals and polling:** Use `discardPeriodicTasks()` at the end of `fakeAsync` blocks that start intervals, or the test will throw "1 periodic timer(s) still in the queue".
- **Angular animations:** Import `NoopAnimationsModule` instead of `BrowserAnimationsModule` in all test modules. This disables animation timers that would require `fakeAsync` tick management.
- **Resolvers and lazy-loaded routes:** Test these with `RouterTestingModule.withRoutes([])` and `router.navigate()` calls inside `fakeAsync/tick` blocks, then assert on `router.url`.
- **Signals-based async (Angular 17+):** Computed signals and effects are synchronous, but `effect()` runs after change detection. Use `TestBed.flushEffects()` to force pending effects to execute.

### 7. Structure Tests for Readability and Maintainability

Test structure governs how quickly a developer can diagnose a failing test six months after writing it.

- Follow the **Arrange-Act-Assert (AAA)** pattern explicitly within each `it` block. Consider adding a blank line between each phase for visual clarity.
- Use nested `describe` blocks to group tests by behavior or state: `describe('when user is not authenticated', ...)` and `describe('when form is valid', ...)`. Limit nesting to 3 levels maximum.
- Use `beforeEach` for common setup shared across an entire `describe` group. Never use `beforeAll` for Angular TestBed setup -- it causes component state to leak between tests.
- Name `it` blocks as full behavioral sentences: `it('should display error message when email is invalid')` not `it('email test')`.
- Keep each `it` block focused on one assertion concern. Use `expect` for one logical outcome per test. Multiple `expect` calls are acceptable when they describe one compound fact (e.g., asserting both `length` and `content` of an array).
- Extract repeated setup into factory functions: `function createComponent(inputOverrides = {})` that returns `{ fixture, component, service }`. This avoids massive `beforeEach` blocks.
- Target a test file line count below 400 lines. If you exceed this, split into `component-name.component.spec.ts` (template tests) and `component-name.service.spec.ts` pattern, or group by feature area.

### 8. Measure, Enforce, and Optimize Coverage

Coverage is a metric that can mislead if not used carefully, but it is essential for production Angular projects.

- Configure Istanbul (built into Angular's karma setup, or via `@jest/coverage` for Jest) in `angular.json` or `jest.config.ts`. Set thresholds: `statements: 80, branches: 75, functions: 80, lines: 80` as a production baseline.
- Coverage thresholds in `jest.config.ts`: use `coverageThreshold.global` object. CI should fail if thresholds are not met.
- Focus on **branch coverage** more than line coverage. An 80% line coverage can hide 50% branch coverage if `ngIf` conditions are never tested in their false state.
- Use `ng test --code-coverage` and inspect the HTML report in `coverage/` folder. Red lines indicate uncovered branches, not just uncovered lines.
- Do NOT add `/* istanbul ignore next */` comments without a team code review. Overuse of ignore comments corrupts coverage metrics.
- Profile test suite speed with `--verbose` flag. Identify the 10 slowest tests. Tests taking over 2 seconds individually are misconfigured -- likely importing too many modules or using real timers.
- Target a full test suite execution time under 60 seconds for projects up to 200 components. Above 60 seconds, investigate parallelization via Jest's `--runInBand` removal or Karma's parallel execution config.

---

## Output Format

When helping a user implement or review Angular testing patterns, provide output in this structure:

```
## Angular Test Implementation Plan

### Test Classification
- Component/Service/Directive under test: [name]
- Test type: [Isolated Unit | Shallow Component | Deep Integration | TestBed Service]
- Async complexity: [None | Observable | HTTP | fakeAsync required | Signals]
- Dependencies to mock: [list with mock strategy for each]

### TestBed Configuration
\`\`\`typescript
TestBed.configureTestingModule({
  declarations: [],   // Only this component + any needed stubs
  imports: [],        // Targeted modules only
  providers: [],      // Typed spy objects or MockProvider
  schemas: []         // NO_ERRORS_SCHEMA if shallow
});
\`\`\`

### Dependency Mock Strategy

| Dependency | Mock Type | Rationale |
|------------|-----------|-----------|
| HttpClient | HttpClientTestingModule + HttpTestingController | Verifies request URL/method/body |
| UserService | jasmine.createSpyObj / jest.fn() | Returns controlled observables |
| Router | RouterTestingModule or plain stub | Depends on navigation assertion needs |
| NgRx Store | provideMockStore({ initialState }) | Avoids real reducer execution |

### Test Structure Template
\`\`\`typescript
describe('ComponentName', () => {
  let fixture: ComponentFixture<ComponentName>;
  let component: ComponentName;
  let dependencySpy: jasmine.SpyObj<DependencyService>;

  beforeEach(async () => {
    // Setup
  });

  describe('when [initial state / precondition]', () => {
    it('should [expected behavior]', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
\`\`\`

### Coverage Targets
- Statement coverage: [80%+ recommended]
- Branch coverage: [75%+ recommended, focus on ngIf/ternary/switch]
- Critical paths requiring 100%: [auth guards, form validation, error states]

### Known Edge Cases to Test
- [List 3-5 specific edge cases relevant to this component/service]
```

---

## Rules

1. **NEVER import `AppModule`, `SharedModule`, or any barrel module into a TestBed configuration.** These pull in the entire application dependency graph, inflate test compilation time by 10-50x, and create hidden coupling. Always import only the exact Angular modules your template actually uses.

2. **NEVER use `NO_ERRORS_SCHEMA` in deep integration tests.** This schema silently suppresses errors for unknown elements AND unknown attribute bindings. Use it only for deliberately shallow tests where you want to ignore child components. For integration tests, declare stub components explicitly.

3. **ALWAYS call `httpMock.verify()` in `afterEach` when using `HttpClientTestingModule`.** Omitting this call means unexpected or extra HTTP requests silently pass, hiding bugs where components make too many requests or request wrong endpoints.

4. **NEVER use `setTimeout` or real `Promise` chains in Angular tests without `waitForAsync` or `fakeAsync`.** Real timers create race conditions in test execution and cause intermittent failures in CI environments with different CPU scheduling. Always use `fakeAsync` + `tick()` for deterministic time control.

5. **ALWAYS use `NoopAnimationsModule` instead of `BrowserAnimationsModule` in test modules.** Real animation modules start timer-based animation callbacks that require `fakeAsync` tick management throughout unrelated tests and cause phantom failures when animations complete during teardown.

6. **NEVER assert on component internals (private properties, internal state) when you can assert on the rendered output instead.** Testing `component.isLoading === true` is less valuable than testing that the loading spinner is in the DOM. Internal state can change while behavior remains correct -- only behavior assertions protect against real regressions.

7. **ALWAYS use `TestBed.inject()` instead of `TestBed.get()` for Angular 9+ projects.** `TestBed.get()` is deprecated, untyped, and returns `any`. `TestBed.inject(Token)` is type-safe and provides compile-time verification that the token exists in the test module.

8. **NEVER share fixture or component instances across `describe` blocks using outer-scope variables that are only assigned in one `beforeEach`.** This causes test order dependency. Each `describe` block must have its own `beforeEach` that creates a fresh fixture.

9. **ALWAYS tear down TestBed with `{ teardown: { destroyAfterEach: true } }` in Angular 14+ projects.** Without this, leaked component instances persist subscriptions, timers, and DOM mutations that corrupt subsequent tests. This is especially critical for components with `ngOnDestroy` lifecycle hooks.

10. **NEVER mock more than one layer deep from the unit under test.** If your component uses `UserService` which internally calls `HttpClient`, mock `UserService` in the component test -- do not configure `HttpClientTestingModule` to mock the HTTP layer. Test the HTTP behavior in `UserService`'s own spec file. Mocking too deep creates tests that are coupled to implementation details two levels removed.

---

## Edge Cases

### Testing Components with `OnPush` Change Detection

Components using `ChangeDetectionStrategy.OnPush` do not re-render on every `detectChanges()` call -- they only re-render when `@Input` references change, events fire, or the async pipe emits. This breaks naive tests that set `component.someProperty = newValue` and then call `detectChanges()`.

**Handling:**
- Use `fixture.componentRef.setInput('inputName', value)` (Angular 14+) to trigger `OnPush` re-renders for `@Input` changes. This correctly marks the component dirty.
- For service observables bound via `async` pipe, ensure the observable emits (e.g., call `subject.next(newValue)`) before calling `detectChanges()`. The async pipe handles the subscription internally.
- Alternatively, inject `ChangeDetectorRef` via `fixture.debugElement.injector.get(ChangeDetectorRef)` and call `cdr.markForCheck()` then `fixture.detectChanges()` to force a check cycle.
- Use `ComponentRef.setInput` not `component.inputName = value` as the primary mechanism. The latter bypasses the Angular input setter pipeline in OnPush components.

### Testing Angular Router Guards

Route guards (`CanActivate`, `CanDeactivate`, `CanLoad`, `CanMatch`) are often tested incorrectly by instantiating them as isolated classes and passing raw objects as `ActivatedRouteSnapshot`. This misses DI-dependent guard logic.

**Handling:**
- For guards with no complex template interaction, use isolated unit tests: `new MyGuard(authServiceSpy, routerSpy)`. Create minimal mock route snapshots: `{ paramMap: convertToParamMap({ id: '1' }) } as ActivatedRouteSnapshot`.
- For guards that interact with the router navigation pipeline, use `RouterTestingModule.withRoutes(testRoutes)` in an integration test. Navigate with `router.navigate(['/protected'])` inside `fakeAsync/tick`, then assert on `router.url`.
- Assert the boolean return value for simple guards. For guards returning `UrlTree`, assert with `router.createUrlTree(['/login'])` equality using `expect(result.toString()).toBe('/login')`.
- For `CanDeactivate` guards, directly call `guard.canDeactivate(componentInstance, route, state)` with a spy on the component's `canLeave` method.

### Testing Components with Complex RxJS Chains and `switchMap`/`combineLatest`

Components that combine multiple observables or use higher-order operators like `switchMap`, `mergeMap`, or `combineLatest` create intricate timing dependencies in tests.

**Handling:**
- Use `BehaviorSubject` for simulating multiple observable inputs: create one `BehaviorSubject` per input stream, inject them through service spies, and control emissions manually.
- For `switchMap` cancelation behavior, test that starting a second emission cancels the first. Emit twice from the source subject before the inner observable completes. Verify only the second result appears.
- For `combineLatest`, remember it does not emit until ALL source observables have emitted at least once. Initialize `BehaviorSubject` instances with initial values to avoid tests that never emit.
- Use `cold` and `hot` observables from `rxjs/testing`'s `TestScheduler` when timing relationships between operators are the primary thing being tested. This is more explicit than `fakeAsync` for pure RxJS logic.
- Avoid `take(1)` workarounds in tests -- they mask subscription completion issues. Let subscriptions run for the expected number of emissions and verify counts.

### Testing NgRx Effects

Effects are the most complex testing surface in NgRx applications because they involve action streams, service calls, and dispatched output actions.

**Handling:**
- Use `provideMockActions` from `@ngrx/effects/testing` to create a controllable `Observable<Action>` input stream.
- Structure the test: push an action into the `actions$` subject, then subscribe to the effect observable, and assert on the emitted action.
- For effects with `switchMap` to services, return `of(result)` from service spies for synchronous testing. For effects with error handling (`catchError`), make the service spy throw: `serviceSpy.getData.and.returnValue(throwError(() => new Error('500')))`.
- Verify both the success action type and payload: `expect(dispatchedAction).toEqual(loadUsersSuccess({ users: mockUsers }))`.
- For effects that dispatch no action (`{ dispatch: false }`), use `toBeObservable(cold('-'))` from jasmine-marbles or simply subscribe and verify the side effect occurred.
- Do NOT test the entire NgRx chain (action -> reducer -> selector -> effect) in a unit test. That belongs in an integration test or e2e test.

### Migrating from Karma/Jasmine to Jest

Teams migrating an existing Angular project from Karma to Jest encounter several sharp edges that are not covered in basic migration guides.

**Handling:**
- Install `jest`, `jest-environment-jsdom`, `@jest/globals`, `ts-jest`, and `jest-preset-angular`. Remove `karma`, `karma-jasmine`, `karma-chrome-launcher`, and `@types/jasmine`.
- Add `"types": ["jest"]` to `tsconfig.spec.json` to prevent TypeScript from complaining about missing Jasmine globals.
- Replace `jasmine.createSpyObj` with `jest.fn()` typed mocks. Replace `spy.and.returnValue(x)` with `mockSpy.mockReturnValue(x)` and `spy.and.callFake(fn)` with `mockSpy.mockImplementation(fn)`.
- Replace `spyOn(obj, 'method').and.returnValue(x)` with `jest.spyOn(obj, 'method').mockReturnValue(x)`.
- `jasmine.objectContaining` becomes `expect.objectContaining`. `jasmine.arrayContaining` becomes `expect.arrayContaining`.
- Watch for `zone.js` import issues. Add `import 'zone.js'` and `import 'zone.js/testing'` to `setup-jest.ts` entry file.
- Run `jest --runInBand` during migration to surface issues in serial execution before enabling parallelism.

### Testing Standalone Components (Angular 14+)

Standalone components do not use `NgModule`, which changes how TestBed is configured and how dependencies are resolved.

**Handling:**
- Use `TestBed.configureTestingModule({ imports: [StandaloneComponent, MockChildComponent] })`. Standalone components go in `imports`, not `declarations`.
- Override providers using `TestBed.overrideComponent(StandaloneComponent, { set: { providers: [{ provide: MyService, useValue: mockService }] } })` for component-level providers defined in the component's own `providers` array.
- Use `importProvidersFrom(HttpClientTestingModule)` or `provideHttpClientTesting()` in the `providers` array for standalone components that use `HttpClient`.
- Standalone pipes and directives used in the component's template must appear in the component's `imports` -- ensure your test either imports the real artifact or provides a stub with the same selector.
- Angular 17+ functional guards and resolvers are pure functions -- test them as isolated functions with no TestBed required. Pass mock arguments directly.

### Diagnosing and Fixing Flaky Tests in CI

Tests that pass locally but fail in CI, or fail on every 5th run, indicate one of a small set of root causes in Angular.

**Handling:**
- **Timer leakage:** Add `discardPeriodicTasks()` and `flush()` at the end of all `fakeAsync` blocks. Unreleased timers carry into subsequent tests in Jest's same worker process.
- **Subscription leakage:** Ensure components under test call `ngOnDestroy`. Manually trigger it: `fixture.destroy()` in `afterEach` -- Angular's `destroyAfterEach` option handles this automatically.
- **Test order dependency:** Run Jest with `--randomize` flag to shuffle test order and surface order-dependent failures. Identify the test that "prepares" state for the failing test.
- **Zone.js scheduling differences:** CI machines are single-core -- microtask queue ordering can differ. Replace all `Promise.resolve().then(...)` chains in source code with `scheduled(observable, asyncScheduler)` from RxJS for consistent ordering.
- **DOM state from previous test:** `document.body` is shared across all tests in the same jsdom instance. Components that append to `document.body` (overlays, dialogs) must clean up in `ngOnDestroy`. Test by running the test that appends in isolation versus in sequence.

---

## Example

**Input:** "I have an Angular 16 component called `UserProfileComponent` that loads user data via `UserService.getUser(id)` which returns an `Observable<User>`. It displays the user's name, shows a loading spinner while fetching, and shows an error message if the request fails. It uses `OnPush` change detection. How do I write comprehensive tests for this?"

**Output:**

### Test Classification

- **Component under test:** `UserProfileComponent`
- **Test type:** Shallow Component (mock `UserService`, no real HTTP)
- **Async complexity:** Observable + fakeAsync required for error scenarios
- **Change detection:** `OnPush` -- requires `setInput()` for `@Input` changes, observable emissions for async pipe re-renders
- **Dependencies to mock:** `UserService` via `jasmine.createSpyObj`, `ActivatedRoute` via `{ params: of({ id: '42' }) }`

### Complete Test File

```typescript
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';

import { UserProfileComponent } from './user-profile.component';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';

const mockUser: User = {
  id: '42',
  name: 'Jane Smith',
  email: 'jane@example.com',
  role: 'admin'
};

describe('UserProfileComponent', () => {
  let fixture: ComponentFixture<UserProfileComponent>;
  let component: UserProfileComponent;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj<UserService>('UserService', ['getUser']);

    await TestBed.configureTestingModule({
      declarations: [UserProfileComponent],
      // NO_ERRORS_SCHEMA suppresses child component errors for shallow test
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ id: '42' }) }
        }
      ]
    }, { teardown: { destroyAfterEach: true } }).compileComponents();

    // Do NOT call detectChanges here -- control it per test
  });

  // Factory helper to avoid duplicating setup logic
  function createComponent(): void {
    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
  }

  describe('initial render and loading state', () => {
    it('should show loading spinner before data arrives', () => {
      // Arrange: service returns a subject that has not emitted yet
      const userSubject = new Subject<User>();
      userServiceSpy.getUser.and.returnValue(userSubject.asObservable());
      createComponent();

      // Act: trigger ngOnInit via first detectChanges
      fixture.detectChanges();

      // Assert: loading spinner is in DOM
      const spinner = fixture.debugElement.query(By.css('[data-testid="loading-spinner"]'));
      expect(spinner).not.toBeNull();

      // Assert: user name is NOT rendered yet
      const nameEl = fixture.debugElement.query(By.css('[data-testid="user-name"]'));
      expect(nameEl).toBeNull();
    });

    it('should call getUser with the route param id on init', () => {
      // Arrange
      userServiceSpy.getUser.and.returnValue(of(mockUser));
      createComponent();

      // Act
      fixture.detectChanges();

      // Assert
      expect(userServiceSpy.getUser).toHaveBeenCalledOnceWith('42');
    });
  });

  describe('when user data loads successfully', () => {
    beforeEach(() => {
      userServiceSpy.getUser.and.returnValue(of(mockUser));
      createComponent();
      fixture.detectChanges(); // triggers ngOnInit, observable emits synchronously
    });

    it('should display the user name', () => {
      const nameEl = fixture.debugElement.query(By.css('[data-testid="user-name"]'));
      expect(nameEl.nativeElement.textContent.trim()).toBe('Jane Smith');
    });

    it('should display the user email', () => {
      const emailEl = fixture.debugElement.query(By.css('[data-testid="user-email"]'));
      expect(emailEl.nativeElement.textContent.trim()).toBe('jane@example.com');
    });

    it('should hide the loading spinner after data arrives', () => {
      const spinner = fixture.debugElement.query(By.css('[data-testid="loading-spinner"]'));
      expect(spinner).toBeNull();
    });

    it('should not display the error message', () => {
      const errorEl = fixture.debugElement.query(By.css('[data-testid="error-message"]'));
      expect(errorEl).toBeNull();
    });

    it('should display admin badge when user role is admin', () => {
      const badge = fixture.debugElement.query(By.css('[data-testid="admin-badge"]'));
      expect(badge).not.toBeNull();
    });
  });

  describe('when user data fails to load', () => {
    beforeEach(() => {
      userServiceSpy.getUser.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      createComponent();
      fixture.detectChanges();
    });

    it('should display the error message', () => {
      const errorEl = fixture.debugElement.query(By.css('[data-testid="error-message"]'));
      expect(errorEl).not.toBeNull();
      expect(errorEl.nativeElement.textContent.trim()).toContain('Unable to load profile');
    });

    it('should hide the loading spinner on error', () => {
      const spinner = fixture.debugElement.query(By.css('[data-testid="loading-spinner"]'));
      expect(spinner).toBeNull();
    });

    it('should not display user data on error', () => {
      const nameEl = fixture.debugElement.query(By.css('[data-testid="user-name"]'));
      expect(nameEl).toBeNull();
    });
  });

  describe('OnPush change detection -- re-render on input change', () => {
    it('should reload user when userId input changes', fakeAsync(() => {
      // Arrange: initial load
      userServiceSpy.getUser.and.returnValue(of(mockUser));
      createComponent();
      fixture.detectChanges();

      // Arrange: new user for second call
      const updatedUser: User = { ...mockUser, id: '99', name: 'Bob Jones' };
      userServiceSpy.getUser.and.returnValue(of(updatedUser));

      // Act: use setInput to trigger OnPush re-evaluation
      fixture.componentRef.setInput('userId', '99');
      tick(); // allow observable to resolve
      fixture.detectChanges();

      // Assert
      const nameEl = fixture.debugElement.query(By.css('[data-testid="user-name"]'));
      expect(nameEl.nativeElement.textContent.trim()).toBe('Bob Jones');
      expect(userServiceSpy.getUser).toHaveBeenCalledWith('99');
    }));
  });

  describe('retry behavior', () => {
    it('should retry loading when retry button is clicked after error', fakeAsync(() => {
      // Arrange: first call fails, second call succeeds
      userServiceSpy.getUser.and.returnValues(
        throwError(() => new Error('timeout')),
        of(mockUser)
      );
      createComponent();
      fixture.detectChanges();

      // Assert error state
      const errorEl = fixture.debugElement.query(By.css('[data-testid="error-message"]'));
      expect(errorEl).not.toBeNull();

      // Act: click retry button
      const retryBtn = fixture.debugElement.query(By.css('[data-testid="retry-button"]'));
      retryBtn.nativeElement.click();
      tick();
      fixture.detectChanges();

      // Assert: user is now displayed
      const nameEl = fixture.debugElement.query(By.css('[data-testid="user-name"]'));
      expect(nameEl.nativeElement.textContent.trim()).toBe('Jane Smith');
      expect(userServiceSpy.getUser).toHaveBeenCalledTimes(2);
    }));
  });
});
```

### Coverage Assessment for This Component

| Coverage Area | Tests Covering It | Branch Status |
|---|---|---|
| Loading state (true) | `should show loading spinner before data arrives` | Covered |
| Loading state (false -- success) | `should hide the loading spinner after data arrives` | Covered |
| Loading state (false -- error) | `should hide the loading spinner on error` | Covered |
| Success render (name, email) | `should display the user name/email` | Covered |
| Error render | `should display the error message` | Covered |
| Role-based badge (admin) | `should display admin badge` | Partially -- need non-admin test |
| Role-based badge (non-admin) | Not yet written -- add `it('should not display admin badge for non-admin')` | Missing branch |
| Retry logic | `should retry loading when retry button is clicked` | Covered |
| Route param extraction | `should call getUser with the route param id` | Covered |
| Input change re-fetch | `should reload user when userId input changes` | Covered |

### What to Add Next

The non-admin role branch is the only missing branch coverage item. Add:

```typescript
it('should not display admin badge when user role is viewer', () => {
  const viewerUser: User = { ...mockUser, role: 'viewer' };
  userServiceSpy.getUser.and.returnValue(of(viewerUser));
  createComponent();
  fixture.detectChanges();

  const badge = fixture.debugElement.query(By.css('[data-testid="admin-badge"]'));
  expect(badge).toBeNull();
});
```

This brings branch coverage to 100% for the role display conditional, which is a user-facing behavior difference warranting full branch coverage.
