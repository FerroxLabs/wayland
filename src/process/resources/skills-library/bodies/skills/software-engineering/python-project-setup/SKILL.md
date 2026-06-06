---
name: python-project-setup
description: |
  Guides expert-level Python project initialization with modern tooling: pyproject.toml configuration, uv for dependency management, src layout decisions, mypy strict mode, and ruff for linting/formatting.
  Use when the user asks about starting a new Python project, structuring a Python package, configuring pyproject.toml, choosing between src layout and flat layout, setting up Python dependency management, or configuring Python linting and type checking from scratch.
  Do NOT use when the user asks about Python language features or syntax (use `python-idioms`), Python testing setup (use `python-testing-patterns`), Python async programming (use `python-async-patterns`), or Python data modeling with Pydantic (use `python-data-modeling`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "python best-practices template"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Python Project Setup

## When to Use

**Use this skill when:**
- User asks to set up a new Python project from scratch
- User wants to know Python project structure conventions
- User asks about pyproject.toml, setup.py, or Python packaging
- User mentions virtual environments, dependency management, or lock files
- User asks about configuring mypy, ruff, or Python tooling for a new project
- User wants to create a distributable Python package or library
- User asks about src layout vs flat layout for Python

**Do NOT use this skill when:**
- The user is asking about Python language features or syntax → use `python-idioms`
- The user already has a project and wants to add testing → use `python-testing-patterns`
- The user wants to set up async patterns → use `python-async-patterns`
- The user is asking about data validation and modeling → use `python-data-modeling`
- The user wants to improve performance of existing code → use `python-performance`
- The user is asking about type annotations and generics → use `python-type-system`
- The user wants to handle errors and exceptions → use `python-error-handling`

## Process

1. **Assess the project context.** Before generating any files, determine:
   - Is this a library/package (distributed via PyPI) or an application (deployed directly)?
     - If library: src layout is mandatory. Editable installs and packaging are critical.
     - If application: flat layout is acceptable. Focus on reproducibility and deployment.
   - Is this a solo project or team project?
     - If team: enforce pre-commit hooks, stricter linting, and type checking from day one.
     - If solo: still configure tooling but relax some rules for velocity.
   - What is the minimum Python version?
     - If 3.12+: use the new `type` statement syntax awareness. Enable latest mypy features.
     - If 3.10-3.11: structural pattern matching is available. Standard generics from `__future__`.
     - If 3.9 or below: avoid unless legacy constraint. Document why in pyproject.toml.

2. **Choose the dependency management tool.** Apply this decision tree:
   - If the team values fast installs and modern standards: use **uv** (Rust-based, 10-100x faster than pip, resolves dependencies deterministically, lockfile built-in).
   - If the project needs compatibility with existing CI/CD that only supports the standard Python installer: use **pip-tools** with `requirements.in` compiled to `requirements.txt`.
   - If the project is a library that needs flexible dependency ranges: still use uv or pip-tools, but define loose ranges in `pyproject.toml [project.dependencies]` and pin exact versions in lock files.
   - NEVER use `requirements.txt` alone without a lock mechanism. Version drift between developers is the number one Python project reliability problem.

3. **Choose the project layout.** Apply this decision tree:
   - If building a redistributable package: use **src layout** (`src/package_name/`). This prevents accidental imports from the working directory during testing.
   - If building a deployed application with no distribution: **flat layout** (`package_name/` at root) is acceptable and simpler.
   - If building a monorepo with multiple packages: use src layout per package with a workspace definition.

4. **Generate the project structure.** Create the directory tree and all configuration files per the Output Format below. Every file must be generated - do not leave any configuration for the user to fill in manually.

5. **Configure the type checker (mypy).** Apply this decision tree:
   - Default: `strict = true` in `[tool.mypy]`. This enables all strict flags.
   - If integrating with third-party packages that lack type stubs: add per-module overrides with `ignore_missing_imports = true` for those specific packages only.
   - If the project uses Pydantic: add `plugins = ["pydantic.mypy"]` for model validation support.
   - ALWAYS include a `py.typed` marker file in the package directory for PEP 561 compliance.

6. **Configure the linter and formatter (ruff).** Apply this decision tree:
   - Use ruff for both linting AND formatting (replaces flake8, black, isort, pyflakes, and more).
   - Default rule set: `select = ["E", "F", "W", "I", "N", "UP", "S", "B", "A", "C4", "DTZ", "T10", "ISC", "ICN", "PIE", "PT", "RSE", "RET", "SLF", "SIM", "TID", "TCH", "ARG", "PLC", "PLE", "PLW", "TRY", "FLY", "PERF", "RUF"]`
   - If team is migrating from flake8/black: start with `select = ["E", "F", "W", "I"]` and expand incrementally.
   - Line length: 88 (ruff default, matches black) or 120 (if team prefers wider lines on modern monitors).

7. **Configure pre-commit hooks** (team projects only). Set up:
   - ruff check (lint)
   - ruff format (format)
   - mypy (type check)
   - pytest (optional, for fast test suites only - do not gate on slow integration tests)

8. **Verify the setup.** Confirm the following checks pass:
   - `uv sync` (or editable dev install) succeeds without errors
   - `ruff check .` passes with no violations
   - `ruff format --check .` reports no formatting changes needed
   - `mypy .` passes with zero errors
   - `pytest` executes successfully (even with minimal tests)

## Output Format

```
{project-name}/
├── src/                          # Only for src layout
│   └── {package_name}/
│       ├── __init__.py
│       ├── py.typed              # PEP 561 marker
│       └── main.py               # Entry point (applications only)
├── tests/
│   ├── __init__.py
│   ├── conftest.py               # Shared fixtures
│   └── test_placeholder.py       # Initial test to verify setup
├── pyproject.toml                # Complete project configuration
├── .python-version               # Pin Python version (e.g., 3.12)
├── .gitignore                    # Python-specific gitignore
├── README.md                     # Project documentation
└── .pre-commit-config.yaml       # Pre-commit hooks (team projects)
```

**pyproject.toml template:**

```toml
[project]
name = "{project-name}"
version = "0.1.0"
description = "{Project description}"
requires-python = ">={min-python-version}"
license = "MIT"
authors = [
    { name = "{Author Name}", email = "{email}" },
]
dependencies = []

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=5.0",
    "mypy>=1.10",
    "ruff>=0.5",
    "pre-commit>=3.7",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/{package_name}"]

[tool.ruff]
target-version = "py{min-version-digits}"
line-length = 88

[tool.ruff.lint]
select = [
    "E", "F", "W", "I", "N", "UP", "S", "B", "A", "C4",
    "DTZ", "T10", "ISC", "ICN", "PIE", "PT", "RSE", "RET",
    "SLF", "SIM", "TID", "TCH", "ARG", "PLC", "PLE", "PLW",
    "TRY", "FLY", "PERF", "RUF",
]

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["S101"]  # Allow assert in tests

[tool.mypy]
strict = true
warn_return_any = true
warn_unused_configs = true
plugins = []

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-ra -q --strict-markers"
```

**conftest.py template:**

```python
"""Shared test fixtures for {project-name}."""

import pytest


@pytest.fixture
def sample_data() -> dict[str, str]:
    """Provide sample data for tests. Customize per project."""
    return {"key": "value"}
```

**.pre-commit-config.yaml template:**

```yaml
repos:
  - repo: local
    hooks:
      - id: ruff-check
        name: ruff-check
        entry: ruff check --fix
        language: system
        types: [python]
      - id: ruff-format
        name: ruff-format
        entry: ruff format
        language: system
        types: [python]
      - id: mypy
        name: mypy
        entry: mypy
        language: system
        types: [python]
        pass_filenames: false
```

## Rules

1. NEVER use `setup.py` or `setup.cfg` for new projects. `pyproject.toml` is the standard since PEP 621.
2. NEVER use `requirements.txt` as the sole dependency specification. Always use `pyproject.toml` for dependency declaration with a lockfile mechanism for reproducibility.
3. ALWAYS include a `py.typed` marker file in the package directory for PEP 561 compliance.
4. ALWAYS configure mypy in strict mode by default. Relax per-module only with documented justification.
5. ALWAYS use ruff for both linting and formatting. Do not configure flake8, black, and isort separately - ruff replaces all three.
6. NEVER hardcode Python version requirements below 3.10 without explicit legacy justification from the user.
7. ALWAYS include a `.gitignore` with Python-specific entries (`.venv/`, `__pycache__/`, `*.pyc`, `.mypy_cache/`, `.ruff_cache/`, `dist/`, `*.egg-info/`).
8. ALWAYS create an initial test file that imports the package to verify the project structure works end-to-end.
9. For library projects: ALWAYS use src layout. For application projects: document the choice between src and flat layout with rationale.
10. NEVER leave placeholder or TODO comments in generated configuration files. Every value must be filled in based on the project context.

## Edge Cases

- **Legacy codebase migration:** When the user has an existing project with `setup.py` and `requirements.txt`, do not rewrite from scratch. Create a `pyproject.toml` that preserves all existing dependencies, add a migration note, and configure ruff with a minimal rule set that the existing code passes. Expand rules incrementally. Keep `setup.py` as a shim if the build system requires it during transition.

- **Monorepo with multiple Python packages:** Each package gets its own `pyproject.toml` with src layout. Use uv workspaces (if available) or a top-level `Makefile` that orchestrates builds. Shared dependencies go in a `constraints.txt` or workspace-level configuration. Each package must be independently installable.

- **CI environment without uv:** If the CI system only supports the standard Python package installer, generate a `requirements-lock.txt` from uv and reference it in CI. Document the two-step workflow: developers use uv locally, CI uses the lock file for deterministic installs.

- **Corporate proxy or air-gapped environment:** Configure uv or pip to use a private index with `--index-url` or `--extra-index-url` in `pyproject.toml` under `[tool.uv]` or in a `pip.conf`. Document the configuration so new developers do not default to public PyPI.

- **Data science projects with heavy native dependencies:** When the project depends on NumPy, SciPy, pandas, or similar packages with C extensions, verify the build toolchain is available. Consider using conda/mamba for native dependency management alongside pyproject.toml for Python-level dependencies. Document the dual dependency management strategy.

## Example

**Input:** "I need to set up a new Python web API project. It will be a FastAPI service deployed to AWS Lambda via container. Team of 4 developers, Python 3.12. We use GitHub Actions for CI."

**Output:**

```
order-service/
├── src/
│   └── order_service/
│       ├── __init__.py
│       ├── py.typed
│       ├── main.py
│       ├── config.py
│       ├── models/
│       │   └── __init__.py
│       ├── routes/
│       │   └── __init__.py
│       └── services/
│           └── __init__.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_main.py
│   └── test_health.py
├── pyproject.toml
├── .python-version
├── Dockerfile
├── .gitignore
├── .pre-commit-config.yaml
└── README.md
```

**pyproject.toml:**

```toml
[project]
name = "order-service"
version = "0.1.0"
description = "Order management API service"
requires-python = ">=3.12"
license = "MIT"
authors = [
    { name = "Order Team", email = "team@company.com" },
]
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.30",
    "pydantic>=2.8",
    "mangum>=0.19",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=5.0",
    "pytest-asyncio>=0.24",
    "httpx>=0.27",
    "mypy>=1.10",
    "ruff>=0.5",
    "pre-commit>=3.7",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/order_service"]

[tool.ruff]
target-version = "py312"
line-length = 88

[tool.ruff.lint]
select = [
    "E", "F", "W", "I", "N", "UP", "S", "B", "A", "C4",
    "DTZ", "T10", "ISC", "ICN", "PIE", "PT", "RSE", "RET",
    "SLF", "SIM", "TID", "TCH", "ARG", "PLC", "PLE", "PLW",
    "TRY", "FLY", "PERF", "RUF",
]

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["S101"]

[tool.mypy]
strict = true
warn_return_any = true
warn_unused_configs = true
plugins = ["pydantic.mypy"]

[[tool.mypy.overrides]]
module = ["mangum.*"]
ignore_missing_imports = true

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-ra -q --strict-markers"
asyncio_mode = "auto"
```

**tests/conftest.py:**

```python
"""Shared test fixtures for order-service."""

import pytest
from fastapi.testclient import TestClient

from order_service.main import app


@pytest.fixture
def client() -> TestClient:
    """Provide a test client for the FastAPI application."""
    return TestClient(app)
```

**tests/test_health.py:**

```python
"""Health check endpoint tests."""

from fastapi.testclient import TestClient


def test_health_returns_ok(client: TestClient) -> None:
    """Verify the health check endpoint returns 200 with status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

This setup provides: src layout for packaging integrity, mypy strict mode with Pydantic plugin, ruff with comprehensive rule set, pytest-asyncio for async endpoint testing, httpx for async client testing, mangum for AWS Lambda adapter, and pre-commit hooks for the 4-person team. The Dockerfile would use multi-stage builds targeting the Lambda Python 3.12 base image.
