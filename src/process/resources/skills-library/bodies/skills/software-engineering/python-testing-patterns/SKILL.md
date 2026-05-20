---
name: python-testing-patterns
description: |
  Guides expert-level Python testing with pytest: fixture design, parametrize patterns, mocking strategies with unittest.mock, async test patterns, and test organization. Covers the testing pyramid for Python projects with emphasis on fast, reliable, maintainable tests.
  Use when the user asks about Python testing, pytest fixtures, test mocking, parametrized tests, async testing in Python, or organizing Python test suites.
  Do NOT use when the user asks about project setup (use `python-project-setup`), language-agnostic testing concepts (use `unit-testing-patterns`), or Python performance profiling (use `python-performance`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "python testing tdd"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Python Testing Patterns

## When to Use

**Use this skill when:**
- User asks how to write tests in Python using pytest, including test discovery, fixture wiring, or assertion patterns
- User wants to design pytest fixtures for complex scenarios involving shared state, teardown, parameterization, or scoping
- User asks about `@pytest.mark.parametrize` for table-driven testing, including matrix combinations and conditional skipping
- User needs to mock dependencies using `unittest.mock`, including `patch`, `MagicMock`, `AsyncMock`, `patch.dict`, or `patch.object`
- User wants to test async Python code with `pytest-asyncio`, including async fixtures, async generators, and timeout behavior
- User asks about organizing test suites with `conftest.py` hierarchy, test markers, or coverage configuration
- User wants to apply the testing pyramid to a Python project: balancing unit, integration, and contract tests by speed and scope
- User asks about test doubles -- stubs, spies, fakes, and mocks -- and when to use each in a Python context
- User needs guidance on testing patterns specific to Python frameworks such as FastAPI, SQLAlchemy, Celery, or Pydantic

**Do NOT use this skill when:**
- User wants to set up a new Python project from scratch -- use `python-project-setup` instead
- User is asking about general testing philosophy or the testing pyramid as a concept -- use `unit-testing-patterns` instead
- User wants structured TDD workflow coaching (red-green-refactor cycles) -- use `tdd-workflow` instead
- User is asking about browser-based or end-to-end testing with Playwright or Selenium -- use `e2e-testing-patterns` instead
- User wants performance benchmarking or profiling of Python code -- use `python-performance` instead
- User is making high-level decisions about what to test and at what layer -- use `test-strategy-design` instead
- User is asking about CI/CD pipeline configuration for running tests -- use `ci-pipeline-design` instead

---

## Process

### 1. Assess the Testing Context and Test Type

Before writing any code, classify what is being tested and choose the right test category. This determines every decision downstream.

- **Pure functions with no I/O or side effects:** Write direct unit tests with `assert`. No mocking needed. These are the fastest, most reliable tests in the suite. Push as many behaviors as possible into pure functions specifically to make them this easy to test.
- **Classes with injected dependencies:** Write unit tests using `MagicMock` or `AsyncMock` for collaborators. Verify behavior via return values and call assertions. Prefer constructor injection -- it makes the dependency boundary explicit and avoids `patch` entirely.
- **Database interaction layers (repositories, DAOs):** Write integration tests that talk to a real database (PostgreSQL in a Docker container or SQLite in-memory). Use transaction rollback per test to maintain isolation without schema recreation. These belong in a separate pytest mark (`@pytest.mark.integration`) and run in CI, not in pre-commit hooks.
- **HTTP endpoints (FastAPI, Flask):** Use framework-provided test clients (`httpx.AsyncClient` for FastAPI, `flask.testing.FlaskClient` for Flask). These are integration tests that exercise routing, serialization, and middleware, but mock outbound external calls.
- **Async code:** Check the event loop policy early. Confirm `pytest-asyncio` is installed and `asyncio_mode = "auto"` is set. All async test functions and async fixtures work without `@pytest.mark.asyncio` decoration in auto mode.
- **Determine test speed targets:** Unit tests should run in under 1ms each. A suite of 1000 unit tests should finish in under 2 seconds. Any test taking longer than 100ms is a candidate for mock replacement or integration test reclassification.

### 2. Design the Fixture Hierarchy

Fixtures are the backbone of a pytest suite. Bad fixture design causes slow, brittle, or non-isolated tests. Apply this decision framework precisely:

- **Use `scope="function"` (default) for:** any fixture that mutates state, any fixture wrapping a mock, any database transaction that rolls back, or anything that has side effects. This is the safe default -- prefer it unless you have a measured performance reason not to.
- **Use `scope="module"` for:** expensive read-only setup that is identical for every test in the file, such as parsing a large static test data file or compiling a regex that is expensive to build.
- **Use `scope="session"` for:** database engine creation, HTTP test client initialization, external service connections, and other one-time-per-run operations. Never store mutable test state in session-scoped fixtures.
- **Use `yield` fixtures for all teardown:** put setup before the `yield` and teardown after it. This ensures cleanup runs even when a test fails. Never use `pytest.fixture` with a `return` if the fixture allocates resources that need cleanup.
- **Use `autouse=True` sparingly:** Only for behavior that genuinely applies to every test in scope, such as resetting a global configuration registry or clearing a singleton cache. Always document why `autouse` is justified.
- **Use `params` on fixtures to fan out test variants:** `@pytest.fixture(params=["sqlite", "postgres"], ids=["sqlite", "postgres"])` creates one test per parameter value for every test that uses that fixture. This is different from `parametrize` and is appropriate when the fixture itself is the variant (e.g., testing against multiple database backends).
- **Stack conftest.py files hierarchically:** `tests/conftest.py` provides project-wide fixtures. `tests/unit/conftest.py` provides unit-test-specific fixtures. `tests/integration/conftest.py` provides integration-test-specific fixtures. Never import fixtures across test files manually -- let pytest discover them.
- **Avoid fixture overuse:** A fixture that sets up 15 attributes and is used by 3 tests is a smell. Extract targeted fixtures that set up only what each test needs. Over-specified fixtures make tests fragile to unrelated changes.

### 3. Choose the Right Test Double Strategy

Python's `unittest.mock` offers multiple double types. Choosing the wrong one causes brittle tests or misses real bugs.

- **`MagicMock`:** Use for synchronous dependencies where you want automatic attribute access and call tracking. By default, every attribute access returns another `MagicMock`, which can mask typos -- always use `spec=SomeClass` to constrain the mock to the real interface: `MagicMock(spec=UserRepository)`.
- **`AsyncMock`:** Use for any dependency whose methods are `async def`. Python 3.8+ provides this in `unittest.mock`. If you patch an async method with a regular `MagicMock`, the test will not await it correctly and will return a coroutine object instead of a value.
- **`patch` as a decorator vs. context manager:** Use `@patch("myapp.services.user_service.EmailSender")` when the mock scope is the entire test function. Use `with patch(...) as mock:` when the mock applies to only part of the test. Always patch at the point of use (where the name is imported into the module under test), not at the point of definition.
- **`patch.object`:** Use when you need to patch a method on an already-instantiated object or a class attribute without replacing the entire class. Prefer this over `patch` when the dependency is accessed via `self.something`.
- **`patch.dict`:** Use for patching `os.environ`, `sys.modules`, or any dictionary-like configuration store. Always `clear=False` (the default) to avoid wiping unrelated keys that other code depends on.
- **Manual fakes:** When a third-party interface is complex (e.g., S3 client with 40 methods), write a minimal in-memory fake class that implements only the methods your code uses. This is more maintainable than a `MagicMock` with 40 `return_value` assignments and is easier to reuse across tests.
- **Spy pattern with `wraps`:** Use `MagicMock(wraps=real_function)` to call through to the real implementation while still tracking calls. Useful for verifying that a real function is called with specific arguments without replacing its behavior.
- **Dependency injection over patching:** If you find yourself patching the same thing in 10 tests, refactor the source code to accept the dependency as a constructor argument. The test suite cost of excessive patching reveals a design problem.

### 4. Write Parametrized Tests with Intention

`@pytest.mark.parametrize` is the most underused and most misused pytest feature. Apply it with discipline:

- **Use `pytest.param(..., id="name")` for every parameter:** Test IDs like `test_validate_email[email0]` are useless in CI logs. Always name your cases: `pytest.param("", id="empty-string")`. This makes failure messages immediately diagnostic.
- **Separate happy-path, edge-case, and error-case parameter lists:** Don't mix valid and invalid inputs into one parametrize block. The behavior being tested is different, and the assertion is different. Use three parametrize blocks with three test functions.
- **Use indirect parametrize for fixture-based variants:** `@pytest.mark.parametrize("user_fixture", ["admin_user", "guest_user"], indirect=True)` passes the parameter to a fixture named `user_fixture` rather than directly to the test. This allows fixture setup logic to depend on the parameter.
- **Stack decorators for a cartesian product:** Two `@pytest.mark.parametrize` decorators create a cartesian product of cases. Use this only when you genuinely need all combinations. If you have 3 email types and 4 locale settings and need all 12 combinations tested, stacking is correct. If you only need 4 specific combinations, write them explicitly to avoid testing meaningless combinations.
- **Use `pytest.mark.skip` and `pytest.mark.xfail` within parametrize:** `pytest.param("edge-input", id="known-bug", marks=pytest.mark.xfail(reason="GH-1234"))` marks a single parametrize case as expected-to-fail without skipping the rest of the cases.
- **Limit parametrize breadth to 10-15 cases per block:** Beyond 15 cases, consider whether you are testing the same function boundary or whether you should add a fuzz testing tool like `hypothesis` for property-based testing of the same domain.

### 5. Configure and Write Async Tests Correctly

Async testing has specific pitfalls that cause tests to silently pass when they should fail, or to deadlock in CI.

- **Install and configure `pytest-asyncio`:** Add `asyncio_mode = "auto"` under `[tool.pytest.ini_options]` in `pyproject.toml`. This mode detects `async def test_*` functions automatically and runs them under an event loop. Without this, calling `async def test_something()` without `@pytest.mark.asyncio` silently skips the coroutine body.
- **Event loop scope for fixtures:** As of `pytest-asyncio` 0.21+, the event loop is scoped at the `function` level by default. If a session-scoped async fixture (e.g., a database connection pool) needs to share an event loop with tests, set `asyncio_mode = "auto"` and use `@pytest_asyncio.fixture(scope="session")` -- not `@pytest.fixture`. Mixing scopes incorrectly causes `Event loop is closed` errors in the second test.
- **Mock async context managers:** Code like `async with session.begin(): ...` requires a mock that supports `__aenter__` and `__aexit__`. Use `AsyncMock` -- it automatically supports async context manager protocol. For `AsyncMock` instances, `mock.__aenter__.return_value` sets the value yielded by the `async with` block.
- **Test timeout behavior:** Use `asyncio.wait_for(coroutine, timeout=5.0)` inside the test to assert that an operation completes within a time budget. Never use `time.sleep()` in async tests -- it blocks the event loop and makes tests fragile. For code that uses `asyncio.sleep()` internally, patch it: `patch("asyncio.sleep", new_callable=AsyncMock)`.
- **Testing async generators:** Use `async for item in async_generator_function():` directly in the test body and collect results into a list for assertion. Do not try to use `list()` on an async generator -- it does not work synchronously.
- **Mixing sync and async in one suite:** pytest runs sync and async tests in the same suite without issue under `asyncio_mode = "auto"`. The event loop is set up only for async tests. Do not convert sync tests to async unless the code under test is actually async.

### 6. Organize Test Files and Apply Markers

Test organization determines how useful the suite is at scale. A 500-test suite with no organization is nearly as bad as no tests.

- **Mirror the source layout exactly:** If your package is `src/myapp/services/user_service.py`, the test file is `tests/unit/services/test_user_service.py`. This makes it trivial to find tests for any module and is required by some coverage tools for accurate missing-line reporting.
- **Apply custom markers strategically:** Define markers in `pyproject.toml` under `[tool.pytest.ini_options] markers = [...]`. Standard markers to define: `integration` (requires external services), `slow` (runs longer than 1 second), `smoke` (critical path, run first), `contract` (pact or schema validation tests). Run subsets with `pytest -m "not integration"` in pre-commit and `pytest -m "integration"` in CI.
- **Always run with `--strict-markers`:** This flag causes pytest to fail with an error if a test uses a marker that is not registered. Add it permanently: `addopts = "--strict-markers"` in `pyproject.toml`.
- **Use classes for grouping, not for sharing state:** A `class TestUserCreation:` groups related tests under a descriptive namespace. Never use class-level attributes as shared mutable state between tests. If tests in a class share a fixture, pass it through method parameters -- do not assign it to `self` in a `setup_method`.
- **Use `conftest.py` scoping to limit fixture visibility:** A fixture defined in `tests/unit/conftest.py` is invisible to `tests/integration/`. This prevents integration fixtures (like database connections) from accidentally being used in unit tests, which would make them slow and require external services.
- **Name test functions as declarative sentences:** `test_create_user_raises_duplicate_email_error_when_email_already_registered` is better than `test_duplicate_email`. The verbose name is the documentation. When this test fails in CI at 2am, the name tells you exactly what broke without opening the file.

### 7. Configure Coverage and Quality Gates

Coverage without a quality gate is a vanity metric. Coverage with the wrong threshold is a false sense of security.

- **Target 80-90% line coverage for business logic modules:** 100% line coverage is often counterproductive -- it forces testing of trivial getters and `if TYPE_CHECKING:` blocks. Exclude those patterns via `[tool.coverage.report] omit` and `exclude_lines` in `pyproject.toml`.
- **Use branch coverage, not just line coverage:** `coverage run --branch` detects untested `if/else` branches that line coverage misses. Add `branch = true` under `[tool.coverage.run]`.
- **Configure `fail_under`:** Set `fail_under = 85` under `[tool.coverage.report]`. This makes `pytest --cov` exit with code 2 if coverage drops below 85%, blocking CI merges.
- **Always exclude from coverage:** `if __name__ == "__main__":` blocks, `@overload` decorated functions, abstract methods, and `TYPE_CHECKING` imports. Add these to `exclude_lines` as regex patterns.
- **Use `pytest-cov` integration, not separate `coverage run`:** `pytest --cov=myapp --cov-report=term-missing --cov-report=xml` runs coverage alongside tests and generates both terminal and XML reports in one step. The XML report feeds into SonarQube, Codecov, or similar tools.
- **Review the coverage report for missing branches, not just lines:** A line covered by a parametrize case that only tests the happy path will show as covered even though the error branch is never executed. Always read the branch miss report.

### 8. Enforce Test Quality with Static Analysis and Linting

Tests are production code. They deserve the same quality bar.

- **Run `mypy` over test files:** If source code is fully typed, test files should be too. `MagicMock` return values default to `Any`, which can hide type errors. Use `spec=` parameters to get typed mocks, and cast where necessary.
- **Use `ruff` with pytest-specific rules enabled:** Enable the `PT` rule set in `ruff` (the flake8-pytest-style rules). These catch common mistakes: using `assert` in fixtures, using `pytest.raises` outside a context manager, missing `pytest.mark` registration, and others.
- **Lint for `assert` in fixture bodies:** Fixtures that `assert` instead of `raise` hide setup failures as test failures. The `PT` ruff rules catch this.
- **Use `pytest --tb=short` as the default traceback style:** Add `addopts = "--tb=short"` to `pyproject.toml`. Full tracebacks in CI logs make failures harder to scan. Short tracebacks show the failing assertion line and the immediate call context -- enough to diagnose most failures.

---

## Output Format

When helping a user design or review a test suite, produce output in this structure:

### Test File Structure

```
tests/
├── conftest.py                        # project-wide fixtures
├── unit/
│   ├── conftest.py                    # unit-test-specific fixtures
│   ├── services/
│   │   └── test_{module_name}.py
│   └── models/
│       └── test_{model_name}.py
├── integration/
│   ├── conftest.py                    # DB connections, test clients
│   └── test_{integration_scenario}.py
└── contract/
    └── test_{service_name}_contract.py
```

### pyproject.toml Configuration Block

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
addopts = "--strict-markers --tb=short"
testpaths = ["tests"]
markers = [
    "integration: marks tests that require external services (deselect with '-m not integration')",
    "slow: marks tests that take longer than 1 second",
    "smoke: marks critical-path tests that should run first",
    "contract: marks schema or pact contract validation tests",
]

[tool.coverage.run]
source = ["src"]
branch = true
omit = ["*/__init__.py", "*/conftest.py"]

[tool.coverage.report]
fail_under = 85
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "if __name__ == .__main__.:",
    "@overload",
    "raise NotImplementedError",
]
```

### Conftest.py Template

```python
# tests/conftest.py
"""Project-wide test fixtures."""

import pytest
from unittest.mock import AsyncMock, MagicMock


# -- Dependency mocks (function-scoped -- fresh per test)

@pytest.fixture
def {dependency_name}_mock() -> MagicMock:
    """Isolated mock for {DependencyClass} with spec enforcement."""
    mock = MagicMock(spec={DependencyClass})
    mock.{primary_method}.return_value = {sensible_default}
    return mock


@pytest.fixture
def {async_dependency}_mock() -> AsyncMock:
    """Isolated async mock for {AsyncDependencyClass}."""
    mock = AsyncMock(spec={AsyncDependencyClass})
    mock.{async_method}.return_value = {sensible_default}
    return mock


# -- Subject under test

@pytest.fixture
def {subject}(
    {dependency_name}_mock: MagicMock,
    {async_dependency}_mock: AsyncMock,
) -> {SubjectClass}:
    """Fully wired {SubjectClass} with all dependencies mocked."""
    return {SubjectClass}(
        {dependency_arg}={dependency_name}_mock,
        {async_dependency_arg}={async_dependency}_mock,
    )
```

### Test File Template

```python
# tests/unit/services/test_{module}.py
"""Tests for {SubjectClass}: {one-sentence description of what is verified}."""

import pytest
from unittest.mock import MagicMock, call

from myapp.services.{module} import {SubjectClass}, {RelevantError}


class Test{PrimaryBehavior}:
    """Tests for the {specific behavior group} workflow."""

    def test_{behavior}_succeeds_when_{precondition}(
        self,
        {subject}: {SubjectClass},
        {dependency}_mock: MagicMock,
    ) -> None:
        """Verify {what the test proves in plain language}."""
        # Arrange
        {dependency}_mock.{method}.return_value = {specific_value}

        # Act
        result = {subject}.{method_under_test}({input})

        # Assert
        assert result.{field} == {expected_value}
        {dependency}_mock.{method}.assert_called_once_with({expected_args})

    def test_{behavior}_raises_{error}_when_{violation}(
        self,
        {subject}: {SubjectClass},
        {dependency}_mock: MagicMock,
    ) -> None:
        """Verify {ErrorClass} is raised when {condition}."""
        {dependency}_mock.{method}.return_value = {value_triggering_error}

        with pytest.raises({RelevantError}, match="{expected_message_substring}"):
            {subject}.{method_under_test}({triggering_input})

    @pytest.mark.parametrize(
        "{input_param},{expected_param}",
        [
            pytest.param({input_1}, {expected_1}, id="{case_name_1}"),
            pytest.param({input_2}, {expected_2}, id="{case_name_2}"),
            pytest.param({input_3}, {expected_3}, id="{case_name_3}"),
            pytest.param({input_4}, {expected_4}, id="{case_name_4}"),
        ],
    )
    def test_{behavior}_handles_various_{input_type}(
        self,
        {subject}: {SubjectClass},
        {input_param}: {InputType},
        {expected_param}: {ExpectedType},
    ) -> None:
        """Verify {behavior} is correct across all valid {input_type} variants."""
        result = {subject}.{method_under_test}({input_param})
        assert result == {expected_param}


class Test{SecondaryBehavior}:
    """Tests for {second behavior group}."""

    async def test_{async_behavior}_awaits_{dependency}(
        self,
        {subject}: {SubjectClass},
        {async_dependency}_mock: AsyncMock,
    ) -> None:
        """Verify {async_behavior} correctly awaits {async_dependency}."""
        await {subject}.{async_method}({input})

        {async_dependency}_mock.{async_method}.assert_awaited_once_with(
            {expected_kwarg}={expected_value}
        )
```

---

## Rules

1. **Always use `spec=` when creating `MagicMock` instances.** `MagicMock(spec=UserRepository)` raises `AttributeError` if test code accesses an attribute that does not exist on the real class. Without `spec=`, typos in mock attribute access silently return new `MagicMock` objects, letting tests pass while the production code has a bug.

2. **Never patch at the definition site -- always patch at the import site.** If `user_service.py` contains `from myapp.email import EmailSender`, patch `myapp.user_service.EmailSender`, not `myapp.email.EmailSender`. Patching the wrong location leaves the production reference unchanged and makes the patch invisible to the code under test.

3. **Never use `unittest.TestCase` in new pytest tests.** `TestCase` disables pytest features including fixtures, `pytest.raises`, and parametrize. It forces `setUp`/`tearDown` over composable fixtures. Always write plain functions or plain classes (no inheritance) for new test code. Existing `TestCase` classes can coexist -- do not rewrite them, just stop adding to that pattern.

4. **Always use `pytest.raises` as a context manager with a `match=` argument.** `with pytest.raises(ValueError, match="invalid email"):` verifies both the exception type and that the message contains the expected substring (matched as a regex). Without `match=`, a `ValueError` raised for a completely different reason will make the test pass.

5. **Never allow test functions to exceed 30 lines.** A test longer than 30 lines is either testing multiple behaviors (split it) or has setup that belongs in a fixture (extract it). Long tests are a reliable smell for poor fixture design and poor separation of concerns.

6. **Always use `assert_called_once_with` over `assert_called_with`.** `assert_called_with` only checks the most recent call, not the number of calls. A function called twice with different arguments passes `assert_called_with` on the second call. Use `assert_called_once_with` to verify both that the call happened and that it happened exactly once.

7. **Never share mutable default state between parametrize cases.** `pytest.param({"key": "value"})` passes the same dictionary object to each test iteration if the list is defined once at module level. This causes test pollution when one test mutates the input. Always use a factory fixture or define immutable inputs (tuples, strings, ints) in parametrize blocks. For mutable inputs, use `copy.deepcopy` in the test body or a fixture.

8. **Never use `time.sleep()`, `datetime.now()` without mocking, or `random` without seeding in tests.** These make tests non-deterministic. Mock `datetime.now` using `freezegun` or `unittest.mock.patch("module.datetime")`. Mock `random` by seeding: `random.seed(42)` in a fixture or by injecting a `Random` instance. Replace `time.sleep` calls in async code with a patched `asyncio.sleep`.

9. **Always register custom markers in `pyproject.toml` and run with `--strict-markers`.** Unregistered markers silently do nothing -- `@pytest.mark.integartion` (typo) will not deselect the test when you run `pytest -m "not integration"`. This causes integration tests to run in environments without database access, producing misleading failures.

10. **Never assert on mock call counts using `mock.call_count == N` directly.** Use `assert_called_once()`, `assert_called_once_with()`, `assert_any_call()`, or `assert_has_calls([call(...), call(...)])` for readable failure messages. A bare `mock.call_count == 2` assertion produces `assert 1 == 2` in CI with no context about which mock or what the calls were.

11. **Always isolate filesystem access using `tmp_path`.** pytest provides the `tmp_path` fixture (type `pathlib.Path`) that gives each test a unique temporary directory cleaned up after the test. Never write test files to the current working directory or `/tmp` directly, as this causes test pollution and CI failures on parallel execution.

12. **Always scope mock patches to the narrowest possible context.** A `@patch` decorator applied to a test function patches for the entire function body. If the mock is only needed for one assertion, use the `with patch(...) as mock:` context manager scoped to that block. Overly broad patches hide real calls that happen outside the intended scope.

---

## Edge Cases

### Legacy unittest.TestCase Coexistence

When a codebase has hundreds of existing `TestCase` classes, do not rewrite them. pytest discovers and runs `TestCase` subclasses natively. Write all new tests as plain pytest functions in separate files. Gradually migrate `TestCase` methods only when you are already modifying that test class for another reason. To use pytest fixtures inside `TestCase` methods, use `pytest.mark` and `self.` attribute assignment in `setUp` -- but be aware this is a transitional pattern, not a final destination. The goal is to stop the proliferation of `TestCase` usage and let the pattern die naturally.

### Async Event Loop Conflicts with Session-Scoped Fixtures

When a session-scoped async fixture (e.g., a database connection pool) is combined with function-scoped async tests, pytest-asyncio must share the event loop across the session. As of `pytest-asyncio` 0.21, the correct approach is to define a session-scoped event loop fixture explicitly:

```python
import asyncio
import pytest

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()
```

Without this, a session-scoped async fixture creates its event loop, completes setup, and the loop is closed before any test runs -- causing `RuntimeError: Event loop is closed` on the first test. This fixture override tells pytest-asyncio to use one loop for the session. Note: this approach is deprecated in pytest-asyncio 0.23+ in favor of `loop_scope` fixture parameters -- check the installed version before applying.

### Patching Properties and Cached Properties

`@property` and `@functools.cached_property` cannot be patched using `patch` directly because `MagicMock` does not implement the descriptor protocol. Use `patch.object` with `new_callable=PropertyMock`:

```python
from unittest.mock import patch, PropertyMock

with patch.object(MyClass, "my_property", new_callable=PropertyMock) as mock_prop:
    mock_prop.return_value = 42
    result = obj.my_property
    assert result == 42
```

For `cached_property`, additionally clear the instance cache after patching: `del obj.__dict__["my_property"]` resets the cached value so the mock takes effect on the next access.

### Testing Code That Uses `os.environ` or Config at Import Time

Code that reads `os.environ` at import time (at module scope) cannot be patched after import -- the value is already captured. This is a design problem in production code, but the test-side workaround is to force module reimport under the patched environment:

```python
import importlib
from unittest.mock import patch

def test_config_with_custom_env():
    with patch.dict("os.environ", {"DATABASE_URL": "sqlite:///:memory:"}):
        import myapp.config
        importlib.reload(myapp.config)
        assert myapp.config.DATABASE_URL == "sqlite:///:memory:"
```

The correct long-term fix is to move environment reads into a function or class that is called at runtime, not at import time. Document this in the test with a comment pointing to the design smell.

### Flaky Tests from Non-Deterministic Ordering

pytest does not guarantee test execution order within a file unless you use `pytest-ordering`. If tests appear to be order-dependent, it indicates shared mutable state. Common causes:
- A class-level list or dictionary being mutated by one test and read by another
- A module-level singleton being modified
- A database not being rolled back between tests

Diagnose with `pytest --randomly-seed=12345` (requires `pytest-randomly`) to run in a consistent but non-alphabetical order. Use `pytest -p no:randomly` to run in collection order for comparison. Never add retry logic (via `pytest-retry` or `pytest-rerunfailures`) to hide a flaky test -- fix the isolation. The only legitimate use of `pytest-rerunfailures` is for tests that exercise genuinely non-deterministic external services (network calls in integration tests), and those should be marked `@pytest.mark.flaky(reruns=3)` with a comment explaining why.

### Testing Pydantic Models and Validators

Pydantic v2 models validate on construction, not on assignment by default. When testing Pydantic models, test the model's behavior -- validation, computed fields, and serialization -- not its internal structure:

```python
import pytest
from pydantic import ValidationError
from myapp.schemas import CreateUserRequest

def test_rejects_invalid_email():
    with pytest.raises(ValidationError) as exc_info:
        CreateUserRequest(email="not-an-email", name="Alice")
    errors = exc_info.value.errors()
    assert len(errors) == 1
    assert errors[0]["loc"] == ("email",)
    assert errors[0]["type"] == "value_error"

def test_normalizes_email_to_lowercase():
    request = CreateUserRequest(email="Alice@COMPANY.COM", name="Alice")
    assert request.email == "alice@company.com"
```

Never access `model.__fields__` or `model.model_fields` in tests -- those are implementation details. Test what the model does, not how it is defined.

### Parallel Test Execution with pytest-xdist

Running tests with `pytest -n auto` (requires `pytest-xdist`) distributes tests across CPU cores. This breaks any test that uses a shared resource without locking:
- **Database:** Each worker needs its own database schema or isolated schema prefix. Use `worker_id` from the `xdist` fixture to generate unique schema names: `f"test_{worker_id}"`.
- **Port binding:** Integration tests that start a server on a fixed port will conflict. Use `port=0` (OS-assigned) and read the assigned port after binding.
- **File system:** Tests writing to overlapping file paths will race. Use `tmp_path` -- each test gets a unique path even under `xdist`.
- **Session-scoped fixtures:** `scope="session"` fixtures run once per worker, not once per session when using `xdist`. Use `scope="session"` with `pytest-xdist`'s `xdist_group` marker to pin related tests to the same worker if they must share session state.

---

## Example

**Input:** "I have a `PaymentProcessor` class that depends on a `PaymentGateway` (async external API client) and a `TransactionRepository` (database layer). It has a `process_payment` method that validates the amount, calls the gateway, and saves the transaction. How do I write comprehensive tests for this?"

**Assumed source code structure:**

```python
# src/myapp/services/payment_processor.py
from decimal import Decimal
from myapp.gateways.payment_gateway import PaymentGateway, GatewayError
from myapp.repositories.transaction_repo import TransactionRepository
from myapp.models import Transaction, TransactionStatus

class PaymentAmountError(ValueError):
    pass

class PaymentProcessor:
    def __init__(
        self,
        gateway: PaymentGateway,
        repo: TransactionRepository,
    ) -> None:
        self._gateway = gateway
        self._repo = repo

    async def process_payment(
        self, user_id: str, amount: Decimal, currency: str
    ) -> Transaction:
        if amount <= Decimal("0"):
            raise PaymentAmountError(f"Amount must be positive, got {amount}")
        if amount > Decimal("10000"):
            raise PaymentAmountError(f"Amount exceeds maximum of 10000, got {amount}")

        gateway_ref = await self._gateway.charge(
            user_id=user_id, amount=amount, currency=currency
        )
        transaction = await self._repo.create(
            user_id=user_id,
            amount=amount,
            currency=currency,
            gateway_ref=gateway_ref,
            status=TransactionStatus.COMPLETED,
        )
        return transaction
```

**Output:**

```toml
# pyproject.toml (relevant sections)
[tool.pytest.ini_options]
asyncio_mode = "auto"
addopts = "--strict-markers --tb=short --cov=src --cov-report=term-missing"
testpaths = ["tests"]
markers = [
    "integration: requires external services or database",
    "slow: runs longer than 1 second",
]

[tool.coverage.run]
branch = true
source = ["src"]

[tool.coverage.report]
fail_under = 85
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "raise NotImplementedError",
]
```

```python
# tests/unit/services/conftest.py
"""Fixtures for PaymentProcessor unit tests."""

from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from myapp.gateways.payment_gateway import PaymentGateway
from myapp.models import Transaction, TransactionStatus
from myapp.repositories.transaction_repo import TransactionRepository
from myapp.services.payment_processor import PaymentProcessor


@pytest.fixture
def gateway_mock() -> AsyncMock:
    """Async mock for PaymentGateway with spec enforcement.

    Default: charge succeeds and returns a gateway reference string.
    Override return_value or side_effect per-test for error scenarios.
    """
    mock = AsyncMock(spec=PaymentGateway)
    mock.charge.return_value = "gw_ref_abc123"
    return mock


@pytest.fixture
def repo_mock() -> AsyncMock:
    """Async mock for TransactionRepository with spec enforcement.

    Default: create returns a completed Transaction with predictable IDs.
    """
    mock = AsyncMock(spec=TransactionRepository)
    mock.create.return_value = Transaction(
        id="txn_001",
        user_id="usr_42",
        amount=Decimal("99.99"),
        currency="USD",
        gateway_ref="gw_ref_abc123",
        status=TransactionStatus.COMPLETED,
    )
    return mock


@pytest.fixture
def processor(gateway_mock: AsyncMock, repo_mock: AsyncMock) -> PaymentProcessor:
    """PaymentProcessor wired with all dependencies mocked."""
    return PaymentProcessor(gateway=gateway_mock, repo=repo_mock)
```

```python
# tests/unit/services/test_payment_processor.py
"""Tests for PaymentProcessor.process_payment behavior.

Coverage targets:
- Happy path: valid amount triggers gateway charge and repo create
- Amount validation: zero, negative, above maximum, boundary values
- Gateway errors: GatewayError propagation behavior
- Call ordering: gateway charged before repo saved (no orphaned saves)
"""

from decimal import Decimal
from unittest.mock import AsyncMock, call

import pytest

from myapp.gateways.payment_gateway import GatewayError
from myapp.models import TransactionStatus
from myapp.services.payment_processor import PaymentAmountError, PaymentProcessor


class TestProcessPaymentHappyPath:
    """Tests for the successful payment processing workflow."""

    async def test_returns_completed_transaction_for_valid_payment(
        self,
        processor: PaymentProcessor,
        repo_mock: AsyncMock,
    ) -> None:
        """Verify process_payment returns the repository-created transaction."""
        result = await processor.process_payment(
            user_id="usr_42",
            amount=Decimal("99.99"),
            currency="USD",
        )

        assert result.id == "txn_001"
        assert result.status == TransactionStatus.COMPLETED
        assert result.gateway_ref == "gw_ref_abc123"

    async def test_charges_gateway_with_correct_arguments(
        self,
        processor: PaymentProcessor,
        gateway_mock: AsyncMock,
    ) -> None:
        """Verify gateway.charge is called with exact user_id, amount, currency."""
        await processor.process_payment(
            user_id="usr_42",
            amount=Decimal("250.00"),
            currency="EUR",
        )

        gateway_mock.charge.assert_awaited_once_with(
            user_id="usr_42",
            amount=Decimal("250.00"),
            currency="EUR",
        )

    async def test_saves_transaction_with_gateway_reference(
        self,
        processor: PaymentProcessor,
        gateway_mock: AsyncMock,
        repo_mock: AsyncMock,
    ) -> None:
        """Verify repo.create receives the gateway_ref returned by gateway.charge."""
        gateway_mock.charge.return_value = "gw_ref_xyz999"

        await processor.process_payment(
            user_id="usr_42",
            amount=Decimal("50.00"),
            currency="GBP",
        )

        repo_mock.create.assert_awaited_once_with(
            user_id="usr_42",
            amount=Decimal("50.00"),
            currency="GBP",
            gateway_ref="gw_ref_xyz999",   # the ref from the gateway, not a hardcoded value
            status=TransactionStatus.COMPLETED,
        )

    async def test_gateway_is_charged_before_repo_is_saved(
        self,
        processor: PaymentProcessor,
        gateway_mock: AsyncMock,
        repo_mock: AsyncMock,
    ) -> None:
        """Verify call ordering: charge before create (prevent orphaned DB records)."""
        call_order = []
        gateway_mock.charge.side_effect = lambda **_: call_order.append("charge") or "gw_ref"
        repo_mock.create.side_effect = lambda **_: call_order.append("create")

        # Side effects that append to a list and return None will cause the fixture
        # return_value to be ignored -- adjust to return a Transaction for this test
        from myapp.models import Transaction
        repo_mock.create.side_effect = None  # reset; configure inline below

        async def _charge(**kwargs):
            call_order.append("charge")
            return "gw_ref_ordered"

        async def _create(**kwargs):
            call_order.append("create")
            return repo_mock.create.return_value

        gateway_mock.charge.side_effect = _charge
        repo_mock.create.side_effect = _create

        await processor.process_payment(
            user_id="usr_42", amount=Decimal("10.00"), currency="USD"
        )

        assert call_order == ["charge", "create"], (
            "Gateway must be charged before the transaction is persisted"
        )


class TestProcessPaymentAmountValidation:
    """Tests for amount boundary validation before any external calls."""

    @pytest.mark.parametrize(
        "amount,expected_error_fragment",
        [
            pytest.param(Decimal("0"), "must be positive", id="zero-amount"),
            pytest.param(Decimal("-1.00"), "must be positive", id="negative-one-dollar"),
            pytest.param(Decimal("-0.01"), "must be positive", id="negative-one-cent"),
            pytest.param(Decimal("10001.00"), "exceeds maximum", id="one-dollar-over-max"),
            pytest.param(Decimal("99999.99"), "exceeds maximum", id="far-over-max"),
        ],
    )
    async def test_rejects_invalid_amounts(
        self,
        processor: PaymentProcessor,
        amount: Decimal,
        expected_error_fragment: str,
    ) -> None:
        """Verify PaymentAmountError is raised for out-of-range amounts."""
        with pytest.raises(PaymentAmountError, match=expected_error_fragment):
            await processor.process_payment(
                user_id="usr_42", amount=amount, currency="USD"
            )

    @pytest.mark.parametrize(
        "amount",
        [
            pytest.param(Decimal("0.01"), id="minimum-one-cent"),
            pytest.param(Decimal("1.00"), id="one-dollar"),
            pytest.param(Decimal("9999.99"), id="one-cent-under-max"),
            pytest.param(Decimal("10000.00"), id="exactly-at-maximum"),
        ],
    )
    async def test_accepts_valid_boundary_amounts(
        self,
        processor: PaymentProcessor,
        amount: Decimal,
    ) -> None:
        """Verify amounts at and within boundaries do not raise validation errors."""
        # Does not raise -- the fixture mocks handle the external calls
        result = await processor.process_payment(
            user_id="usr_42", amount=amount, currency="USD"
        )
        assert result is not None

    async def test_does_not_call_gateway_when_amount_invalid(
        self,
        processor: PaymentProcessor,
        gateway_mock: AsyncMock,
    ) -> None:
        """Verify gateway is never contacted for invalid amounts (no wasted API calls)."""
        with pytest.raises(PaymentAmountError):
            await processor.process_payment(
                user_id="usr_42", amount=Decimal("0"), currency="USD"
            )

        gateway_mock.charge.assert_not_awaited()


class TestProcessPaymentGatewayErrors:
    """Tests for error propagation when the payment gateway fails."""

    async def test_propagates_gateway_error_without_saving_transaction(
        self,
        processor: PaymentProcessor,
        gateway_mock: AsyncMock,
        repo_mock: AsyncMock,
    ) -> None:
        """Verify GatewayError bubbles up and no transaction is saved."""
        gateway_mock.charge.side_effect = GatewayError("Card declined")

        with pytest.raises(GatewayError, match="Card declined"):
            await processor.process_payment(
                user_id="usr_42", amount=Decimal("50.00"), currency="USD"
            )

        repo_mock.create.assert_not_awaited()

    async def test_propagates_gateway_timeout_as_gateway_error(
        self,
        processor: PaymentProcessor,
        gateway_mock: AsyncMock,
    ) -> None:
        """Verify gateway timeout surfaces as GatewayError, not TimeoutError."""
        import asyncio
        gateway_mock.charge.side_effect = GatewayError("Request timeout after 30s")

        with pytest.raises(GatewayError, match="timeout"):
            await processor.process_payment(
                user_id="usr_42", amount=Decimal("100.00"), currency="USD"
            )
```

```python
# tests/integration/test_payment_processor_integration.py
"""Integration tests for PaymentProcessor with real repository.

These tests require a running PostgreSQL instance and are excluded from
pre-commit hooks via: pytest -m "not integration"
"""

import pytest
from decimal import Decimal

pytestmark = pytest.mark.integration


@pytest.fixture(scope="module")
async def db_engine():
    """Create a real database engine for the integration test module."""
    from sqlalchemy.ext.asyncio import create_async_engine
    engine = create_async_engine("postgresql+asyncpg://test:test@localhost/test_db")
    yield engine
    await engine.dispose()


@pytest.fixture
async def db_session(db_engine):
    """Provide a rolled-back transaction per test for isolation."""
    from sqlalchemy.ext.asyncio import AsyncSession
    async with AsyncSession(db_engine) as session:
        async with session.begin():
            yield session
            await session.rollback()


@pytest.mark.integration
async def test_payment_creates_persisted_transaction(db_session, gateway_mock):
    """Verify the full creation workflow persists a transaction retrievable from DB."""
    from myapp.repositories.transaction_repo import SqlAlchemyTransactionRepository
    from myapp.services.payment_processor import PaymentProcessor

    repo = SqlAlchemyTransactionRepository(session=db_session)
    processor = PaymentProcessor(gateway=gateway_mock, repo=repo)

    result = await processor.process_payment(
        user_id="usr_integration_test",
        amount=Decimal("75.00"),
        currency="USD",
    )

    # Verify via direct DB query -- not via the return value
    from myapp.models import Transaction
    saved = await db_session.get(Transaction, result.id)
    assert saved is not None
    assert saved.amount == Decimal("75.00")
    assert saved.currency == "USD"
```

This test suite demonstrates the complete pattern:

- `conftest.py` provides spec-constrained `AsyncMock` fixtures, eliminating repeated mock setup across 10 test functions
- Happy-path tests each verify exactly one observable behavior (return value, call arguments, call ordering) -- not all three in one test
- Amount validation uses two separate parametrize blocks -- one for rejections, one for acceptances -- with explicit `id=` names on every case
- Gateway error tests verify the absence of calls (`assert_not_awaited`) as much as the presence, preventing silent data corruption from partially completed workflows
- Integration tests are in a separate file, marked with `pytestmark = pytest.mark.integration`, use a transaction-rollback pattern for isolation, and verify behavior through the database rather than the return value alone
- The `pyproject.toml` configuration enforces branch coverage at 85%, strict markers, and auto
