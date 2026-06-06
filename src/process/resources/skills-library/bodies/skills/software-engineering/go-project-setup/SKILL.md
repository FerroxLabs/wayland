---
name: go-project-setup
description: |
  Guides expert-level Go project initialization: module structure with go.mod, workspace mode for multi-module development, Makefile conventions, golangci-lint configuration, and standard project layout.
  Use when the user asks about Go project setup, go.mod, Go workspace, Go modules, golangci-lint, Go project structure, Makefile.
  Do NOT use when the user asks about Go language idioms (use `go-idioms`), Go testing (use `go-testing-patterns`), Go concurrency (use `go-concurrency-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "go best-practices template"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Go Project Setup

## When to Use

**Use this skill when the user asks about:**
- Initializing a new Go project from scratch, including module naming, directory layout, and initial tooling
- Configuring `go.mod` and `go.sum` -- module paths, minimum version selection (MVS), `require`, `replace`, and `exclude` directives
- Go workspace mode (`go.work`, `go.work.sum`) for multi-module development in a single repository
- Structuring Go projects as CLI applications, HTTP services, libraries, or monorepos
- Configuring `golangci-lint` with `.golangci.yml` -- enabling, disabling, or tuning specific linters
- Writing a `Makefile` with standard Go targets: `build`, `test`, `lint`, `generate`, `tidy`, `vet`
- Understanding the `internal/` and `pkg/` directory conventions and when each applies
- Managing Go toolchain versions, including `go` directive in `go.mod` and `GOTOOLCHAIN` environment variable

**Do NOT use this skill when:**
- The user asks about Go language idioms, error handling patterns, interface design, or idiomatic Go code style -- use `go-idioms`
- The user asks about writing Go tests, table-driven tests, testify, mocks, or benchmarks -- use `go-testing-patterns`
- The user asks about goroutines, channels, `sync` primitives, or concurrent data structures -- use `go-concurrency-patterns`
- The user is asking about deploying Go applications to Kubernetes, Docker, or cloud providers -- use the appropriate deployment skill
- The user is asking about specific Go standard library packages in depth (e.g., `net/http`, `encoding/json`) -- use `go-stdlib`
- The user is debugging a build failure caused by a language-level issue, not a configuration issue

---

## Process

### Step 1 -- Assess Project Type and Constraints

Before writing a single file, determine the project's fundamental shape. The answers drive every structural decision.

- **Determine the artifact type:** Is this a CLI binary (`main` package in `cmd/`), an HTTP/gRPC service (single `cmd/` entry point with `internal/` domain logic), a shared library (no `cmd/`, exported API at package root or under a named package), or a monorepo containing multiple modules?
- **Determine the module path:** For open-source libraries, the module path must match the repository URL (e.g., `github.com/org/repo`). For private services, use a vanity domain or internal registry path (e.g., `company.internal/platform/payments`). Never use a path that you cannot publish to or that collides with a real module.
- **Determine the minimum Go version:** Check the deployment environment. As of 2024, Go 1.21+ is recommended for new projects -- it introduced toolchain management, `log/slog`, and improved generics support. Go 1.22+ added range-over-integers. Set the `go` directive in `go.mod` to the minimum version the team can use in all environments.
- **Identify multi-module needs:** If the project contains reusable packages that need independent versioning (e.g., a CLI that embeds an SDK that others also import), plan for workspace mode from the start. If everything is tightly coupled and versioned together, a single module is correct.
- **Check for organizational standards:** Ask whether the organization has a module path prefix, a standard Makefile template, a required linter configuration, or an internal fork of common dependencies.

### Step 2 -- Initialize the Module

Run `go mod init` with the correct module path. This is the only command that is irreversible in practice -- changing a module path after others depend on it is a major breaking change.

- **Single module:** Run `go mod init github.com/org/projectname`. The resulting `go.mod` will contain only the `module` and `go` directives initially.
- **Set the Go version explicitly:** Edit `go.mod` to set the `go` directive to your target minimum (e.g., `go 1.22.0`). In Go 1.21+, this directive enforces a minimum toolchain, not just a minimum language version. The patch version matters.
- **Toolchain directive (Go 1.21+):** Optionally add a `toolchain go1.22.3` line to pin the exact toolchain version used for development, while `go 1.22.0` sets the minimum supported version. This separates "what this module requires" from "what developers use to build it."
- **Workspace mode (multi-module):** After initializing each module, run `go work init ./module-a ./module-b` at the repository root. The `go.work` file coordinates local module resolution without requiring `replace` directives in individual `go.mod` files. Commit `go.work` for development, but **do not** commit `go.work` if it breaks published modules -- add it to `.gitignore` for libraries, keep it for services.
- **Add the first dependency correctly:** Run `go get github.com/pkg/dependency@v1.2.3` to add a versioned dependency. Never manually edit `go.sum`. Run `go mod tidy` after any dependency addition or removal to synchronize `go.sum` and remove unused entries.

### Step 3 -- Establish the Directory Layout

Go has informal but widely adopted layout conventions. Deviating from them increases cognitive load for incoming contributors.

- **`cmd/`:** Each subdirectory under `cmd/` is a separate binary. The directory name becomes the binary name by convention. Each contains exactly one `main.go` (or a small set of `.go` files all in `package main`). Keep `cmd/` thin -- 50-100 lines at most. All logic belongs in `internal/` or `pkg/`.
- **`internal/`:** Code that must not be imported by external modules. Go enforces this at compile time -- any package outside the module that attempts to import a path containing `/internal/` will get a build error. Use `internal/` for domain logic, service implementations, configuration structs, and anything not intended as a public API.
- **`pkg/`:** Publicly importable packages intended for external consumers. This convention signals "this is a stable public API." For strictly private services (never imported externally), skip `pkg/` entirely and put everything in `internal/`. For libraries, the public API often lives at the module root or in named subdirectories.
- **`api/`:** Protocol Buffer definitions (`.proto` files), OpenAPI specs (`.yaml`), or GraphQL schemas. Keep generated code out of `api/` -- put it in `internal/gen/` or a similar location, and commit generated code only after careful team discussion.
- **`configs/`:** Configuration file templates (`.yaml`, `.toml`, `.env.example`). Never commit secrets -- only templates with placeholder values.
- **`scripts/`:** Shell scripts and helper scripts called by the `Makefile`. Keep scripts short and POSIX-compatible unless the team has standardized on Bash.
- **`build/`:** Dockerfiles, CI configuration templates, package build scripts. Separate from `scripts/` to distinguish build-system artifacts from development utilities.
- **Do not create `src/`:** In Go, `src/` is a GOPATH-era artifact with no modern meaning. Its presence confuses new contributors and breaks standard tooling assumptions.

### Step 4 -- Write the Makefile

The `Makefile` is the team's shared interface to the project's development workflow. Every contributor should be able to run `make build`, `make test`, and `make lint` without reading documentation.

- **Use `.PHONY` for all non-file targets:** `build`, `test`, `lint`, `fmt`, `vet`, `generate`, `tidy`, `clean` are all phony. Missing `.PHONY` causes confusing failures when files with those names accidentally exist.
- **Use `go build -v -o bin/$(APP_NAME) ./cmd/appname/`** for the build target. Capture the binary name in a variable at the top of the Makefile. Add `-ldflags "-X main.version=$(VERSION) -X main.commit=$(COMMIT) -X main.date=$(DATE)"` to embed build metadata.
- **Separate `test` and `test-integration` targets:** `make test` runs `go test -race -count=1 ./...` (unit tests only, with race detector). `make test-integration` adds a build tag: `go test -race -count=1 -tags=integration ./...`. This prevents long-running integration tests from blocking fast feedback.
- **The `lint` target runs `golangci-lint run ./...`.** Pin the golangci-lint version in the Makefile or install script to prevent "works on my machine" linting discrepancies. The `GOLANGCI_LINT_VERSION` variable at the top of the Makefile should match the version in CI.
- **The `generate` target runs `go generate ./...`.** Document in comments which tools `go:generate` directives invoke (e.g., `mockgen`, `stringer`, `protoc-gen-go`). Add a `tools.go` file to `tools/` or the module root to pin generator tool versions.
- **The `tidy` target runs `go mod tidy -v` and, in workspace mode, `go work sync`.** Include a `tidy-check` variant that fails if `go mod tidy` produces a diff -- use this in CI.
- **Use `$(MAKE)` not `make` for recursive invocations** to inherit the parent `make`'s flags and environment variables.

### Step 5 -- Configure golangci-lint

`golangci-lint` aggregates dozens of linters into a single tool with a unified configuration file. The default linter set is intentionally conservative -- you must opt into stricter checks.

- **Version-pin the config:** The `.golangci.yml` `version` key (or the `--version` flag) must match the installed binary. Breaking changes between golangci-lint versions are common. Pin to a minor version (e.g., `1.59.x`) in CI.
- **Enable linters beyond the default set.** At minimum for a new project, enable: `govet` (enabled by default), `errcheck` (enabled by default), `staticcheck`, `gosimple`, `unused`, `gocyclo` (cyclomatic complexity, warn at >15, error at >25), `gocritic`, `misspell`, `godot` (comment formatting), `revive` (modern replacement for `golint`), `noctx` (HTTP requests should carry a context), `bodyclose` (HTTP response bodies must be closed), `exhaustive` (switch statements on enum-like types must be exhaustive), `wrapcheck` (errors from external packages must be wrapped).
- **Configure per-linter settings:** `gocyclo` threshold at 15 for warnings is a good starting point. `revive` should have `confidence: 0.8` to reduce noise. `gocritic` should enable the `diagnostic` and `performance` tag groups.
- **Use `issues.exclude-rules` selectively:** Exclude test files from `errcheck` for `t.Log`, `t.Error` calls. Exclude generated files from all linters using `issues.exclude-files: [".*\\.pb\\.go", ".*_gen\\.go"]`. Never use blanket excludes on non-generated code.
- **Set `run.timeout: 5m`** to prevent CI hangs on large codebases. Set `run.concurrency` to `0` (auto-detect CPU count) for local runs, but pin it to a fixed number (e.g., `4`) in CI for reproducible timing.
- **The `linters-settings.govet.enable-all: true` flag** is aggressive but recommended for new projects -- it catches shadow variables, composite literals missing field names, and other subtle bugs.

### Step 6 -- Configure Version Control Hygiene

A correct `.gitignore` and commit conventions are part of project setup, not afterthoughts.

- **Go-specific `.gitignore` entries:** `/bin/` (built binaries), `*.test` (compiled test binaries), `*.out` (profiling output), `/vendor/` (vendored dependencies, if not using vendoring), `*.prof`, `coverage.out`, `coverage.html`.
- **Workspace file policy:** Add `go.work` and `go.work.sum` to `.gitignore` for library modules. Commit them for application monorepos where the workspace is the canonical development environment.
- **`tools.go` pattern:** Create a file at `tools/tools.go` (or the module root) with `//go:build tools` build tag and blank imports of tool binaries (e.g., `_ "github.com/golangci/golangci-lint/cmd/golangci-lint"`). This pins generator and tool versions in `go.mod` without pulling them into the build output.
- **Set up `pre-commit` hooks** (via `pre-commit` framework or `git hooks`) to run `gofmt -l .` and fail if any files are not formatted. A one-liner `Makefile` target `make hooks` should install these.

### Step 7 -- Verify the Setup End-to-End

Do not hand off a setup without running all tooling against it. A project that builds but doesn't lint, or lints but doesn't test, has a broken feedback loop.

- Run `go build ./...` -- zero errors, zero unresolved imports.
- Run `go vet ./...` -- zero warnings. This is the baseline correctness check built into the toolchain.
- Run `golangci-lint run ./...` -- zero lint violations on a freshly initialized project. If there are violations, fix them before declaring setup complete.
- Run `go test -race -count=1 ./...` -- even with no tests, this should produce `? github.com/org/project [no test files]` for each package, not a build error.
- Run `go mod tidy` and confirm `go.mod` and `go.sum` are unchanged -- they should not change on a clean project.
- In workspace mode, run `go work sync` and confirm no errors.

---

## Output Format

Provide the following artifacts, each in its own labeled code block.

### Project Directory Tree

```
projectname/
├── cmd/
│   └── projectname/
│       └── main.go
├── internal/
│   ├── config/
│   │   └── config.go
│   └── server/
│       └── server.go
├── pkg/                     # omit if purely internal service
│   └── clientlib/
│       └── client.go
├── api/                     # omit if no API specs
│   └── openapi.yaml
├── configs/
│   └── config.example.yaml
├── scripts/
│   └── install-tools.sh
├── build/
│   └── Dockerfile
├── tools/
│   └── tools.go
├── .gitignore
├── .golangci.yml
├── go.mod
├── go.work                  # multi-module only
├── Makefile
└── README.md
```

### go.mod Template

```
module github.com/org/projectname

go 1.22.0

toolchain go1.22.3

require (
    // direct dependencies added via go get
)
```

### go.work Template (multi-module only)

```
go 1.22.0

toolchain go1.22.3

use (
    .
    ./sdk
    ./tools
)
```

### Makefile Template

```makefile
APP_NAME    := projectname
CMD_PATH    := ./cmd/$(APP_NAME)
BIN_DIR     := bin
VERSION     := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
COMMIT      := $(shell git rev-parse --short HEAD 2>/dev/null || echo "none")
DATE        := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS     := -ldflags "-X main.version=$(VERSION) -X main.commit=$(COMMIT) -X main.date=$(DATE)"
GOLANGCI_LINT_VERSION := v1.59.1

.PHONY: all build test test-integration lint fmt vet generate tidy tidy-check clean hooks

all: lint test build

build:
	@mkdir -p $(BIN_DIR)
	go build $(LDFLAGS) -o $(BIN_DIR)/$(APP_NAME) $(CMD_PATH)

test:
	go test -race -count=1 -timeout=120s ./...

test-integration:
	go test -race -count=1 -timeout=300s -tags=integration ./...

test-coverage:
	go test -race -count=1 -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

lint:
	golangci-lint run ./...

fmt:
	gofmt -l -w .
	goimports -l -w .

vet:
	go vet ./...

generate:
	go generate ./...

tidy:
	go mod tidy -v

tidy-check:
	go mod tidy
	git diff --exit-code go.mod go.sum

clean:
	rm -rf $(BIN_DIR) coverage.out coverage.html

hooks:
	@echo "Installing git pre-commit hook..."
	@echo '#!/bin/sh\nmake fmt-check vet lint' > .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
```

### .golangci.yml Template

```yaml
version: "2"

run:
  timeout: 5m
  concurrency: 0

linters:
  enable:
    - bodyclose
    - errcheck
    - exhaustive
    - gocritic
    - gocyclo
    - godot
    - govet
    - misspell
    - noctx
    - revive
    - staticcheck
    - unused
    - wrapcheck

linters-settings:
  gocyclo:
    min-complexity: 15
  gocritic:
    enabled-tags:
      - diagnostic
      - performance
      - style
  revive:
    confidence: 0.8
    rules:
      - name: exported
      - name: var-naming
      - name: error-strings
      - name: error-return
      - name: if-return
  govet:
    enable-all: true
  exhaustive:
    default-signifies-exhaustive: true

issues:
  exclude-files:
    - ".*\\.pb\\.go"
    - ".*_gen\\.go"
    - ".*_mock\\.go"
  exclude-rules:
    - path: "_test\\.go"
      linters:
        - wrapcheck
        - errcheck
    - path: "cmd/"
      linters:
        - wrapcheck
```

### tools/tools.go Template

```go
//go:build tools

package tools

import (
    _ "golang.org/x/tools/cmd/goimports"
    _ "github.com/golangci/golangci-lint/cmd/golangci-lint"
    // add mockgen, stringer, protoc-gen-go as needed
)
```

---

## Rules

1. **Never change a module path after it has been published.** The module path is embedded in every `go.sum` entry of every downstream consumer. A module path change requires a major version suffix (`/v2`) under Go's import compatibility rule, or a full break-and-replace for private modules.

2. **Never manually edit `go.sum`.** This file is a cryptographic hash registry maintained by the `go` toolchain. Manual edits corrupt the integrity database. Always use `go get`, `go mod tidy`, or `go mod download` to update it.

3. **The `replace` directive in `go.mod` is a local-development escape hatch, not a long-term solution.** `replace` directives in a published library break consumers who cannot replicate your local path. Use `replace` only during active development, and remove it before tagging a release. For persistent forks, publish the fork under a new module path.

4. **Do not put test helpers in a non-test file just to share them across packages.** Go allows `_test.go` files in a package to export symbols -- use `export_test.go` to expose internal symbols for testing without polluting the non-test API. This pattern keeps internal/ truly internal while still enabling thorough testing.

5. **`internal/` enforces package boundaries at the compiler level -- use it aggressively for new projects.** Everything that is not explicitly a stable public API should live under `internal/`. This prevents accidental surface area growth and makes refactoring dramatically cheaper. A common mistake is putting everything in `pkg/` "just in case" someone needs it -- resist this.

6. **The `go` directive in `go.mod` is not merely advisory in Go 1.21+.** In Go 1.21 and later, if the `go` directive specifies a version higher than the installed toolchain, the toolchain will attempt to download the required version (if `GOTOOLCHAIN=auto`) or fail with a clear error (if `GOTOOLCHAIN=local`). Set `GOTOOLCHAIN=local` in CI to prevent silent toolchain downloads that change build behavior.

7. **`golangci-lint` must be version-pinned in CI and in the Makefile.** Running different versions across developer machines and CI causes "lint passes locally but fails in CI" failures that erode trust in the tooling. Pin to a specific minor version (e.g., `v1.59.1`) and update intentionally with a dedicated PR.

8. **Do not enable every golangci-lint linter.** Some linters are mutually exclusive, some have very high false-positive rates for idiomatic Go (e.g., `funlen` without careful tuning, `lll` for long string literals, `gomnd` for magic numbers in tests). Start with a curated set, measure the signal-to-noise ratio over 2 weeks, and add or remove linters based on actual usefulness, not theoretical coverage.

9. **`cmd/` directories must contain only `main` packages, and `main.go` must do almost nothing.** The entry point should parse flags, build the dependency graph (wire up `internal/` components), and call a `run()` function that returns an error. All business logic belongs in `internal/`. This makes the binary testable at the integration level by importing the non-main packages.

10. **`go mod tidy` must be a required CI check, not just a developer convenience.** If `go.mod` or `go.sum` drift from the actual dependency graph, builds become non-reproducible. Add a `make tidy-check` target that runs `go mod tidy` and then `git diff --exit-code go.mod go.sum`. A non-zero exit code fails the CI pipeline.

---

## Edge Cases

### Monorepo with Multiple Services Sharing a Domain Package

When multiple services in a monorepo need to import the same shared library (e.g., `internal/events`), you face a choice: single module with all services, or multiple modules with workspace mode. Use workspace mode when different services need to release independently or have different dependency trees. Use a single module when all services are deployed together and version coordination is not needed. In workspace mode, the shared package is a third module (e.g., `./lib`) listed in `go.work`. Each service module has a `require` pointing to it, and `go work sync` keeps versions aligned. In CI, you must build each service module independently (without `go.work`), using the versions declared in each module's `go.mod`, to verify that published versions are correct.

### Vendoring vs. Module Proxy

For air-gapped or highly regulated environments, run `go mod vendor` to create a `vendor/` directory and commit it. Then build with `go build -mod=vendor ./...`. This eliminates the build-time network dependency but increases repository size significantly. The tradeoff: `vendor/` bloat vs. dependency on a module proxy (`GOPROXY=https://proxy.golang.org`). For most teams, a private module proxy (Athens or Artifactory's Go proxy) is the better answer -- it caches dependencies on first use, requires no vendor directory, and provides an audit trail. Never mix vendoring and module proxy -- pick one strategy per module and document it in the `README`.

### Library Module Versioning and Major Versions

When a library breaks backward compatibility, Go's module system requires a new module path with a `/v2` suffix (e.g., `module github.com/org/lib/v2`). This is not optional -- consumers that import `github.com/org/lib` and `github.com/org/lib/v2` will get two independent copies of the code, which is intentional. Failing to follow this convention corrupts the minimum version selection algorithm for all downstream consumers. Set up a `v2/` subdirectory or a separate `v2` branch, update all import paths inside the module (using `sed` or `gomajor` tool), and tag the new release with `v2.0.0`.

### `replace` Directives with Forks

When you fork a dependency (e.g., to patch a security vulnerability before upstream merges), use `replace github.com/upstream/pkg => github.com/yourorg/pkg v0.0.0-fork` in `go.mod`. This is safe for services that are never imported externally. For libraries, you cannot ship a `replace` directive -- upstream consumers will not have the fork on their `GOPATH`. The correct path for libraries is: publish your fork to a real module path, depend on that published fork, and contribute the fix upstream. Never publish a library with `replace` directives pointing to local paths or uncommitted forks.

### CGo and Cross-Compilation

If the project uses CGo (e.g., SQLite via `mattn/go-sqlite3`, C extensions), cross-compilation becomes significantly harder. Set `CGO_ENABLED=0` in the Makefile for any target that does not require CGo. For targets that do require CGo, install the appropriate cross-compilation toolchain (`gcc-aarch64-linux-gnu`) and set `CC=aarch64-linux-gnu-gcc GOOS=linux GOARCH=arm64`. Document CGo dependencies explicitly in the `README` because they break `go install` for external users who do not have the C toolchain. Consider replacing CGo dependencies with pure-Go alternatives (`modernc.org/sqlite`) when cross-compilation or static linking is a requirement.

### golangci-lint False Positives and Nolint Directives

When a linter produces a false positive that cannot be resolved by restructuring the code, use `//nolint:lintername // reason: explanation` on the specific line. Never use bare `//nolint` without specifying which linter and why -- this suppresses all linters and hides real issues. Configure `nolint-lead-space: false` in golangci-lint to require a comment after every nolint directive. Audit `nolint` usage in code review -- a pattern of frequent nolints for the same linter is a signal that the linter is misconfigured, not that the code is wrong.

### Transitioning an Existing GOPATH-era Project

Older projects may use `GOPATH` layout (`src/github.com/org/project/`) without a `go.mod`. Migration steps: (1) move all code to the intended repository structure, (2) run `go mod init github.com/org/project` in the project root, (3) run `go mod tidy` to discover and pin all transitive dependencies, (4) fix import paths that still reference `vendor/` or `GOPATH`-relative paths, (5) delete the `vendor/` directory and rebuild using the module cache. Do this in a dedicated migration branch. The most common failure point is indirect dependencies that were pinned via `vendor/` at a specific commit -- `go mod tidy` will fetch the latest compatible version, which may introduce breaking changes. Test thoroughly before merging.

---

## Example

**Input:** "I'm starting a new Go HTTP API service that will be deployed as a Docker container. It's a single binary, team of 4 engineers, targeting Go 1.22. We want golangci-lint enforced in CI. What should the full project setup look like?"

---

**Output:**

This is a standard single-module HTTP service setup. Here is the full recommended structure and configuration.

### Module Initialization

```bash
mkdir paymentservice && cd paymentservice
go mod init github.com/acmecorp/paymentservice
# Edit go.mod to set version explicitly
```

### go.mod

```
module github.com/acmecorp/paymentservice

go 1.22.0

toolchain go1.22.3

require (
    golang.org/x/net v0.26.0
)
```

The `toolchain` line pins the exact toolchain used for development to `1.22.3` while `go 1.22.0` declares the minimum compatibility requirement. Consumers on Go 1.22.x can still build this module.

### Directory Layout

```
paymentservice/
├── cmd/
│   └── paymentservice/
│       └── main.go
├── internal/
│   ├── config/
│   │   └── config.go
│   ├── handler/
│   │   ├── payment.go
│   │   └── health.go
│   ├── middleware/
│   │   └── logging.go
│   └── store/
│       └── postgres.go
├── configs/
│   └── config.example.yaml
├── build/
│   └── Dockerfile
├── scripts/
│   └── install-tools.sh
├── tools/
│   └── tools.go
├── .gitignore
├── .golangci.yml
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

No `pkg/` directory because this is a private service -- nothing will be imported externally. No `api/` directory yet -- add it when OpenAPI specs are introduced. Everything lives under `internal/`.

### cmd/paymentservice/main.go

```go
package main

import (
    "context"
    "fmt"
    "log/slog"
    "os"
    "os/signal"
    "syscall"

    "github.com/acmecorp/paymentservice/internal/config"
    "github.com/acmecorp/paymentservice/internal/server"
)

// Injected at build time via -ldflags.
var (
    version = "dev"
    commit  = "none"
    date    = "unknown"
)

func main() {
    slog.Info("starting paymentservice",
        "version", version,
        "commit", commit,
        "date", date,
    )

    if err := run(); err != nil {
        slog.Error("fatal error", "error", err)
        os.Exit(1)
    }
}

func run() error {
    cfg, err := config.Load()
    if err != nil {
        return fmt.Errorf("loading config: %w", err)
    }

    ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
    defer cancel()

    return server.Run(ctx, cfg)
}
```

Note the pattern: `main()` never returns an error. `run()` returns an error and all logic is delegated to `internal/`. Build metadata variables are exported for injection via `-ldflags`.

### Makefile

```makefile
APP_NAME    := paymentservice
CMD_PATH    := ./cmd/$(APP_NAME)
BIN_DIR     := bin
VERSION     := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
COMMIT      := $(shell git rev-parse --short HEAD 2>/dev/null || echo "none")
DATE        := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS     := -ldflags "-X main.version=$(VERSION) -X main.commit=$(COMMIT) -X main.date=$(DATE)"
GOLANGCI_LINT_VERSION := v1.59.1

.PHONY: all build test test-integration lint fmt vet generate tidy tidy-check clean

all: lint test build

build:
	@mkdir -p $(BIN_DIR)
	go build $(LDFLAGS) -o $(BIN_DIR)/$(APP_NAME) $(CMD_PATH)

test:
	go test -race -count=1 -timeout=120s ./...

test-integration:
	go test -race -count=1 -timeout=300s -tags=integration ./...

test-coverage:
	go test -race -count=1 -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

lint:
	golangci-lint run ./...

fmt:
	gofmt -l -w .

vet:
	go vet ./...

tidy:
	go mod tidy -v

tidy-check:
	go mod tidy
	git diff --exit-code go.mod go.sum

clean:
	rm -rf $(BIN_DIR) coverage.out coverage.html
```

### .golangci.yml

```yaml
version: "2"

run:
  timeout: 5m
  concurrency: 0

linters:
  enable:
    - bodyclose
    - errcheck
    - exhaustive
    - gocritic
    - gocyclo
    - govet
    - misspell
    - noctx
    - revive
    - staticcheck
    - unused
    - wrapcheck

linters-settings:
  gocyclo:
    min-complexity: 15
  gocritic:
    enabled-tags:
      - diagnostic
      - performance
  revive:
    confidence: 0.8
    rules:
      - name: exported
      - name: error-strings
      - name: error-return
  govet:
    enable-all: true
  exhaustive:
    default-signifies-exhaustive: true
  wrapcheck:
    ignore-sigs:
      - .Errorf(
      - errors.New(
      - errors.Unwrap(
      - fmt.Errorf(

issues:
  exclude-files:
    - ".*\\.pb\\.go"
    - ".*_gen\\.go"
  exclude-rules:
    - path: "_test\\.go"
      linters:
        - wrapcheck
        - errcheck
    - path: "cmd/"
      linters:
        - wrapcheck
```

The `wrapcheck` linter is configured with `ignore-sigs` to allow direct use of `fmt.Errorf` and `errors.New` without wrapping -- these are not external package errors. The `cmd/` exclusion prevents false positives in the entry point where wrapping adds no value.

### .gitignore

```
/bin/
coverage.out
coverage.html
*.test
*.out
*.prof
.env
configs/config.yaml
```

Note: `configs/config.example.yaml` is committed (it is a template). `configs/config.yaml` is gitignored (it contains real values). The `.env` file pattern is blocked to prevent accidental secret commits.

### tools/tools.go

```go
//go:build tools

package tools

import (
    _ "golang.org/x/tools/cmd/goimports"
)
```

Run `go mod tidy` after adding this file to pin `goimports` version in `go.mod`. The `//go:build tools` tag prevents this file from being compiled into the production binary.

### Verification Sequence

```bash
go build ./...          # must produce zero errors
go vet ./...            # must produce zero warnings
golangci-lint run ./... # must produce zero violations
go test -race ./...     # must produce zero failures (no tests = zero failures)
go mod tidy && git diff --exit-code go.mod go.sum  # must produce zero diff
```

All five checks pass on this freshly initialized project. The team can begin writing application code against a setup that will catch errors, enforce style, and produce reproducible builds from day one.
