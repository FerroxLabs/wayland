---
name: coverage-analysis
description: |
  Guides expert-level coverage analysis implementation: clean-code and best-practices decision frameworks, production-ready patterns, and concrete templates for coverage analysis workflows.
  Use when the user asks about coverage analysis, coverage analysis configuration, or testing best practices for coverage projects.
  Do NOT use when the user needs a different testing quality capability -- check sibling skills in the testing quality subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing clean-code best-practices"
  category: "testing-quality"
  subcategory: "testing-quality"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Coverage Analysis

## When to Use

**Use this skill when:**
- User wants to establish or tune code coverage thresholds for a CI/CD pipeline (e.g., "what percentage should we require?")
- User is analyzing a coverage report and needs help interpreting gaps -- uncovered branches, untested error paths, or dead code
- User wants to differentiate between line coverage, branch coverage, function coverage, and statement coverage, and understand when each matters
- User needs to configure a coverage tool (Istanbul/nyc, Jest, JaCoCo, coverage.py, SimpleCov, llvm-cov, gcov) for their specific stack
- User is building a coverage enforcement strategy -- ratcheting, gate requirements, per-module thresholds, or exclusion policies
- User wants to integrate coverage reporting into CI systems (GitHub Actions, GitLab CI, Jenkins, CircleCI) with pass/fail gates
- User needs to distinguish between meaningful coverage and coverage theater -- high percentages that do not reflect real test quality
- User is dealing with a legacy codebase and needs a phased coverage improvement strategy

**Do NOT use this skill when:**
- User is asking how to write unit tests from scratch -- use the unit-testing skill
- User needs mutation testing guidance (coverage is a prerequisite topic but mutation analysis is a separate discipline)
- User is asking about integration or end-to-end test strategy at a system architecture level -- use the test-strategy skill
- User wants performance profiling or code execution tracing (different use of instrumentation)
- User is asking about static analysis, linting, or cyclomatic complexity metrics specifically -- use the static-analysis skill
- User needs help with test doubles (mocks, stubs, fakes) -- use the test-doubles skill
- User is asking purely about CI/CD pipeline configuration unrelated to test quality gates

---

## Process

### 1. Establish the Current Coverage Baseline

Before making any recommendations, understand where the codebase currently stands.

- Run the coverage tool in report-only mode (no thresholds enforced) to get a baseline snapshot: `jest --coverage --coverageThreshold='{}'` or `pytest --cov=src --cov-report=term-missing` or `mvn jacoco:report`
- Record four numbers: line coverage %, branch coverage %, function coverage %, statement coverage % -- these are not the same and conflating them leads to false confidence
- Identify the **coverage distribution**: is the codebase uniformly at 40%, or is it 90% in utilities and 5% in business logic? Distribution matters more than the average
- Flag files or modules with zero coverage -- these represent complete blind spots, not just gaps
- Identify files excluded from measurement and verify each exclusion is intentional: generated code, vendor dependencies, migration files, and configuration bootstraps are legitimate exclusions; business logic is not
- Calculate branch coverage specifically -- a file at 95% line coverage can have 40% branch coverage if `if/else`, `switch`, and ternary expressions are untested on their false paths
- Save the baseline report as an artifact; all future comparisons must reference this starting point

### 2. Select the Right Coverage Metric for the Context

Different metrics reveal different risks. Choose the primary metric based on what the code does.

- **Statement coverage** is the weakest signal -- it fires on every executable statement but cannot distinguish between paths through conditional logic. Useful only as a floor check.
- **Line coverage** is the most commonly reported metric and the most commonly misunderstood. A line with a ternary `x = a ? b : c` shows as covered if either branch executes. Always pair with branch coverage.
- **Branch coverage** (also called decision coverage) is the standard for production business logic. It requires both the true and false path of every conditional to execute. Target this as the primary gate in most systems.
- **Function/method coverage** is a fast proxy for dead code detection -- any function at 0% is either dead code, a code path that is never triggered, or a gap in the test suite. Investigate all of these.
- **MC/DC (Modified Condition/Decision Coverage)** is required in safety-critical systems (aviation: DO-178C Level A/B, automotive: ISO 26262 ASIL C/D, medical: IEC 62304 Class C). Do not apply this to general web applications -- the overhead is prohibitive and the value does not justify the cost outside regulated domains.
- For most production systems: **branch coverage is the correct primary metric**. For safety-critical code: MC/DC. For rapid prototyping: line coverage as a minimum floor only.

### 3. Define Threshold Strategy by Module Risk Tier

A single global threshold is almost always wrong. Define thresholds by risk tier.

- **Tier 1 -- Core business logic** (payment processing, authentication, authorization, data integrity, compliance rules): minimum 90% branch coverage, 95% line coverage. Zero tolerance for uncovered error handling paths.
- **Tier 2 -- Application logic** (request handling, data transformation, service orchestration): minimum 80% branch coverage, 85% line coverage.
- **Tier 3 -- Infrastructure and glue code** (dependency injection setup, config loading, CLI entrypoints, logging configuration): minimum 60% line coverage. Branch coverage is often not meaningful here.
- **Tier 4 -- Generated code, vendor code, migration files, type declaration files**: explicitly exclude from coverage measurement via tool configuration -- do not try to cover generated output.
- Configure per-directory thresholds wherever the tool supports it: Jest `coverageThreshold` supports per-glob patterns; JaCoCo supports per-package rules; SimpleCov supports group-based thresholds.
- Document the tier assignment for each module in a `coverage.config` file or equivalent so the rationale is explicit and reviewable.

### 4. Configure the Coverage Tool Correctly

Misconfigured tools produce misleading numbers. Each tool has critical configuration decisions.

**Jest (JavaScript/TypeScript):**
- Set `collectCoverageFrom` explicitly -- without it, Jest only measures files that were `require()`d during tests, missing untested files entirely and inflating percentages
- Use `"coverageProvider": "v8"` for accurate branch coverage in modern Node.js; use `"babel"` only if you need support for older transform pipelines
- Configure `coverageThreshold` with both global and per-pattern overrides
- Set `coverageReporters: ["text", "lcov", "json-summary"]` -- `lcov` feeds into GitHub/GitLab coverage widgets; `json-summary` enables automated threshold scripting

**pytest-cov (Python):**
- Always specify `--cov=src` (or your package name) -- never `--cov=.` which includes test files themselves and inflates numbers
- Use `--cov-branch` to enable branch coverage; without this flag, you are measuring statement coverage only
- Configure `[coverage:run]` in `pyproject.toml` or `.coveragerc` with `omit` patterns for migrations, settings files, and `__init__.py` files that only contain imports
- Use `--cov-fail-under=N` for CI gates; combine with `--cov-report=xml` to feed SonarQube or Codecov

**JaCoCo (Java/Kotlin):**
- Configure the `prepare-agent` goal in Maven or the `jacoco` task in Gradle to instrument bytecode at compile time, not just at test execution
- Set `excludes` patterns for Lombok-generated methods, Spring Boot auto-configuration classes, and MapStruct-generated mappers -- these will otherwise show as uncovered and obscure real gaps
- Use the `check` goal/task to enforce thresholds; configure it to fail the build with `haltOnFailure: true`
- Branch coverage in JaCoCo counts every conditional expression, including null checks in generated code -- tune exclusions carefully

**Istanbul/nyc (JavaScript legacy):**
- Use `--all` flag to include files not imported during tests
- Configure `include` and `exclude` in `.nycrc` rather than relying on command-line flags for reproducibility

### 5. Implement Coverage Ratcheting to Prevent Regression

Ratcheting prevents coverage regression without requiring perfection immediately.

- The **ratchet pattern**: after establishing the baseline, set the CI threshold to the current coverage percentage minus 1-2 points (a tolerance buffer). Any PR that drops coverage below this threshold fails.
- After each sprint or release cycle, update the threshold upward to lock in improvements -- this is the "ratchet" -- you can only go forward.
- Implement **diff coverage** as a complement to aggregate coverage: require that new code introduced in a PR has a minimum coverage percentage (typically 80-90%) regardless of overall project coverage. This prevents new debt from accumulating even when the overall number looks acceptable.
- Tools that support diff coverage natively: Codecov (via `--patch` threshold), Coveralls (via diff analysis), GitHub Actions with `codecov/codecov-action` and threshold configuration.
- For projects using SonarQube: configure the Quality Gate to enforce both `Coverage on New Code >= 80%` and `Overall Coverage >= current_baseline%` -- this combines ratcheting with new-code requirements.
- Store the ratchet threshold value in source control (in `jest.config.js`, `pyproject.toml`, `.jacoco.xml`, etc.) -- never in CI environment variables, as this bypasses code review.

### 6. Interpret Coverage Reports to Find Meaningful Gaps

Raw percentages are not actionable. Teach users to read the report critically.

- Sort uncovered lines by **risk impact, not file alphabetical order**. A 2-line uncovered error handler in the payment module is more important than a 50-line uncovered utility in a logging helper.
- **Uncovered catch blocks** are the highest-priority finding. Code that handles `IOException`, database connection failures, or network timeouts is exactly the code that will execute in production incidents. If it is not tested, its behavior under failure is unknown.
- **Uncovered else branches** on security checks are critical: `if (user.hasPermission(...))` where the `else` path is never tested means the authorization rejection path is untested.
- **Uncovered early returns** (guard clauses) often represent input validation that is never exercised with invalid inputs.
- **100% covered but trivially tested**: a `get`/`set` accessor covered by a single assertion that only checks the happy path does not provide meaningful safety. High coverage does not mean good tests -- it means the lines were executed.
- Use the **branch coverage column** in HTML reports (Istanbul, SimpleCov, JaCoCo all produce HTML output) to see specifically which branch of each conditional is uncovered -- the tool will show `if (condition)` as `1/2 branches covered`.
- Distinguish between **structurally untestable code** (e.g., `default` cases in exhaustive `switch` statements on enums, defensive `null` checks on values that can never be null by construction) and **legitimately untested code**. The former should be explicitly suppressed with a comment annotation; the latter must be tested.

### 7. Configure Coverage Exclusions Correctly

Bad exclusion policies create false confidence. Good ones reduce noise.

- Use tool-specific suppression annotations for structurally untestable lines:
  - Istanbul/Jest: `/* istanbul ignore next */` or `/* c8 ignore next */`
  - Python coverage.py: `# pragma: no cover`
  - JaCoCo: `@Generated` annotation on the class, or configure `excludes` in the plugin
  - SimpleCov: `.not_covered!` or `# :nocov:` block markers
- **Every suppression annotation must have a comment explaining why**: `/* istanbul ignore next -- defensive null check, value guaranteed non-null by constructor */`
- Never suppress coverage on catch blocks without a comment -- this is where bugs hide
- Legitimate global exclusions: `node_modules/`, `dist/`, `build/`, generated GraphQL types, database migration files, Storybook stories, test files themselves, `index.ts` barrel files that only re-export
- Review suppression annotations in code review -- they should require the same scrutiny as `TODO` comments

### 8. Integrate Coverage into the Development Workflow

Coverage must be part of the regular development loop, not just a CI artifact.

- Configure local pre-commit or pre-push hooks to run coverage checks on changed files: `jest --coverage --changedSince=main` or `pytest --cov=src --cov-fail-under=80`
- Set up IDE coverage visualization: VS Code with the Coverage Gutters extension, IntelliJ IDEA's built-in coverage runner, or PyCharm's coverage runner all display line-by-line coverage in the editor gutter -- this makes uncovered lines visible during development, not after the fact
- In PR workflows, use a coverage bot (Codecov, Coveralls, or a custom GitHub Actions step that comments on PRs) to surface coverage delta directly in the PR comment thread
- Schedule a **coverage audit** in the team calendar quarterly: review exclusions, re-examine tier classifications, check whether coverage trends match code risk changes
- When onboarding new engineers, walk through reading a branch coverage HTML report as part of the engineering onboarding checklist -- most engineers have never seen one and do not know how to interpret `1/2 branches covered`

---

## Output Format

When responding to a coverage analysis request, structure the output as follows:

```
## Coverage Analysis: [Project/Module Name]

### Current State Assessment
| Metric           | Current % | Target % | Gap   | Priority |
|------------------|-----------|----------|-------|----------|
| Line Coverage    |           |          |       |          |
| Branch Coverage  |           |          |       |          |
| Function Coverage|           |          |       |          |
| Statement Coverage|          |          |       |          |

### Module Risk Tier Classification
| Module/Directory | Risk Tier | Line Target | Branch Target | Rationale          |
|-----------------|-----------|-------------|---------------|--------------------|
|                 | Tier 1    | 95%         | 90%           |                    |
|                 | Tier 2    | 85%         | 80%           |                    |
|                 | Tier 3    | 60%         | N/A           |                    |
|                 | Excluded  | --          | --            |                    |

### Top Coverage Gaps (Priority Order)
1. [File/Module] -- [Metric]: [Current%] -- [Risk]: [Why this matters] -- [Action]: [Specific tests needed]
2. ...

### Tool Configuration
[Language/framework-specific configuration snippet]

### Threshold Configuration (CI Gate)
[Exact configuration for the project's CI tool]

### Ratchet Plan
- Current enforced threshold: [N%]
- Proposed immediate threshold: [current - 2%] (no regression gate)
- 30-day target: [N%]
- 90-day target: [N%]
- Milestone to lock in: [condition for ratcheting up]

### Exclusion Policy
| Pattern | Reason | Review Date |
|---------|--------|-------------|
|         |        |             |

### Recommended Next Actions (Ordered by Impact)
1. ...
2. ...
3. ...
```

---

## Rules

1. **Never cite an aggregate coverage percentage without specifying the metric type.** "80% coverage" is meaningless -- it must be "80% branch coverage" or "80% line coverage". These can differ by 20-30 percentage points on the same codebase and imply completely different levels of test completeness.

2. **Never recommend a single global threshold for a heterogeneous codebase.** Authentication code and configuration bootstrap code do not have the same risk profile. A global 70% requirement under-protects the former and over-burdens the latter. Always tier thresholds by module risk.

3. **100% coverage is not the goal and should not be stated as such.** Chasing 100% line coverage leads to trivial tests written to execute lines rather than verify behavior. The goal is meaningful coverage of risk-bearing code paths. State this clearly when a user asks "how do I get to 100%."

4. **Never recommend coverage in isolation without acknowledging its limits.** Coverage tells you which lines ran, not whether they were tested correctly. Always note that coverage is a floor metric -- it identifies untested code but cannot identify poorly tested code. Pair with mutation testing recommendations for higher assurance needs.

5. **Always configure `collectCoverageFrom` (or equivalent) explicitly.** The default behavior of Jest (and similar tools) only measures files imported during the test run, which gives artificially inflated percentages by ignoring completely untested files. This is the single most common source of false confidence in coverage reports.

6. **Never suppress coverage annotations without requiring an explanatory comment.** `/* istanbul ignore next */` without explanation is a code smell. Treat unannotated suppressions like unannotated `@SuppressWarnings` or `# type: ignore` -- they must be justified.

7. **Branch coverage thresholds must be lower than line coverage thresholds by at least 5-10 points** when configuring CI gates. Branch coverage is structurally harder to achieve and a branch threshold equal to line threshold will produce constant false failures. Typical calibration: line 85%, branch 75% for Tier 2 code.

8. **Ratcheting thresholds must be stored in source control, not in CI environment variables or CI GUI settings.** Coverage thresholds that live outside the repository can be silently changed without code review. They must be committed alongside the code they govern.

9. **Uncovered catch blocks, error handlers, and authorization rejection paths must be explicitly called out** as higher priority than uncovered utility code. When reviewing a coverage report, do not present gaps alphabetically -- present them by risk tier.

10. **When introducing coverage tooling to an existing codebase for the first time, set the initial CI threshold at current coverage minus 2%**, not at a desired future target. Failing a build on day one because coverage is at 34% when the target is 80% provides no useful signal and destroys team trust in the tool. The ratchet starts from reality, not aspiration.

---

## Edge Cases

### Legacy Codebase with Near-Zero Coverage

When a codebase has 5-20% coverage and has never had gates enforced:
- Do not set a target threshold above the current level on the first day. Set the CI gate at `current - 2%` to establish the ratchet without blocking the team.
- Identify the 10 highest-risk files (payment flows, authentication, data mutation endpoints) and create a focused "coverage sprint" targeting only those files in the first cycle.
- Use `jest --coverage --changedSince=main` (or `pytest-cov --cov=src` scoped to modified files) to enforce that new code introduced in PRs meets an 80% branch threshold even when the overall project is far below that. This stops new debt accumulation immediately while the team pays down old debt.
- Add coverage to the definition of done for all new features going forward. This is a policy decision that must be explicitly agreed upon by the team lead and communicated -- the tool alone cannot enforce culture.

### Generated Code Inflating or Deflating Coverage

Generated code (GraphQL resolvers, Protobuf classes, ORM models, OpenAPI client stubs, Lombok-annotated classes) creates two problems:
- If included in measurement: the generated getters, setters, and boilerplate inflate your total line count and make your percentage look better than it is. The generated code is not your risk surface.
- If measured but not excluded: every generated class that has no tests will drop your percentage, causing phantom failures in CI.
- Resolution: maintain an explicit exclusion list in your coverage config. For JaCoCo, use `excludes` with patterns like `**/*Generated.class`. For coverage.py, add `omit` patterns in `.coveragerc`. For Jest, use `coveragePathIgnorePatterns`. Commit this exclusion list to source control and require justification for every addition.

### Microservices or Monorepo with Per-Service Coverage Requirements

In a monorepo with multiple services, a single global threshold hides per-service gaps:
- Configure per-package or per-directory thresholds. Jest supports `coverageThreshold` with glob keys. JaCoCo supports per-bundle rules in Gradle multi-project builds.
- Each service or bounded context should have its own threshold configuration, committed in its own configuration file, not inherited from a root config.
- In CI, fail the build at the service level, not the monorepo level -- a coverage failure in `payments-service` should not be masked by high coverage in `notifications-service`.
- Track coverage trends per service in your reporting tool (Codecov, SonarQube) so you can see if a specific service is regressing even when the global number holds steady.

### Test Suite Runs Slowly with Coverage Enabled

Coverage instrumentation adds 20-50% overhead to test execution time in most environments. This is not a tool bug -- it is the cost of instrumenting every line.
- Never run coverage on every local test invocation. Configure a separate npm/Makefile/tox target: `npm test` runs tests without coverage; `npm run test:coverage` runs with coverage. Coverage runs belong in CI, not in the inner development loop.
- For Jest: use `--testPathPattern` to run coverage only on the changed files during development. Run full coverage only in CI.
- For Python: use `pytest-xdist` with `-n auto` for parallel test execution -- coverage.py is compatible with parallel runs when configured with `--concurrency=multiprocessing`.
- For JaCoCo: the instrumentation overhead is typically 10-15% in offline mode vs. 20-30% in on-the-fly mode. Prefer offline instrumentation for large Java projects.
- If the CI coverage run is a bottleneck, partition test runs by module across parallel CI jobs and merge coverage reports at the end: `coverage combine` (Python), `nyc merge` (JavaScript), or the JaCoCo merge task (Java).

### Coverage Paradox: High Percentage, Low Confidence

This is the most dangerous edge case -- a codebase reporting 85% coverage but with poor tests that only execute code without asserting behavior:
- Coverage alone cannot detect this. Signal this limitation explicitly when the user asks "our coverage is 85%, why are we still getting production bugs?"
- Recommend mutation testing as the next level of analysis: Stryker (JavaScript/TypeScript), PITest (Java), mutmut or Cosmic Ray (Python). Mutation testing injects deliberate bugs and checks whether the test suite catches them. A "mutation score" of 40% on an 85%-covered codebase means most tests are not actually verifying the code's behavior.
- Look for test anti-patterns: tests without assertions, tests that only call a function without checking its return value or side effects, tests that use `expect(true).toBe(true)` style assertions that always pass. These inflate coverage without providing safety.
- Recommend assertion density reviews as a proxy: each test case should have at least one meaningful assertion specific to the behavior under test.

### Coverage Tools and TypeScript/Transpiled Code

TypeScript, Babel-transpiled JavaScript, and source-mapped languages create a coverage accuracy problem:
- Coverage is measured on the compiled output, then mapped back to source via source maps. If source maps are inaccurate or missing, the coverage report will show wrong lines as uncovered.
- For Jest with TypeScript: use `ts-jest` with `coverageProvider: "v8"` for the most accurate source-mapped coverage. The `"babel"` provider uses instrumentation before transpilation, which is more accurate in some edge cases but less accurate for modern TypeScript features.
- For `esbuild` or `swc`-based pipelines: verify that coverage source map integration is explicitly configured -- these fast transpilers sometimes disable source map generation for performance reasons.
- Abstract classes and interfaces in TypeScript will show as 0% covered because they compile to no executable JavaScript. Exclude `.d.ts` files and configure `coveragePathIgnorePatterns` to exclude files that are purely type definitions.

### CI Coverage Reporting Flakiness

Coverage percentages sometimes fluctuate 1-3% between identical test runs due to test execution order, async timing, or conditional code paths that depend on timing:
- Set coverage thresholds with a 2-3% buffer below the actual measured coverage to absorb natural fluctuation without false failures.
- Investigate any fluctuation larger than 3% -- this usually indicates non-deterministic test setup (shared state, time-dependent code, network-dependent tests) rather than a coverage tool issue.
- Use `--forceExit` (Jest) or equivalent only as a last resort -- it can cause coverage data to not flush to disk, producing incorrect reports.

---

## Example

**Input:** "We have a Node.js/TypeScript Express API with Jest. The coverage report says 72% but our senior engineer thinks the number is misleading. We keep getting production bugs in our payment processing module. How should we approach coverage analysis?"

**Output:**

## Coverage Analysis: Node.js/TypeScript Express API

### Diagnosing Why the 72% Number Is Misleading

Your senior engineer is likely correct. The most common sources of false confidence in Jest coverage reports are:

1. **Missing `collectCoverageFrom`** -- Without this setting, Jest only measures files that were imported during tests. Completely untested files are invisible to the report, inflating the percentage. Verify by checking your `jest.config.ts`:

```typescript
// jest.config.ts
export default {
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/generated/**",
    "!src/migrations/**",
    "!src/index.ts",       // Express bootstrap -- exclude
  ],
  coverageProvider: "v8",  // More accurate branch coverage for modern TS
  coverageReporters: ["text", "text-summary", "lcov", "json-summary"],
};
```

If you were not using `collectCoverageFrom`, re-run with this config. Your actual coverage number will likely drop -- this is revealing reality, not regression.

2. **Line vs. branch coverage** -- "72% coverage" almost certainly means line coverage. Check whether you have branch coverage configured and what that number is. A file can have 95% line coverage and 40% branch coverage if error paths and conditional branches are untested.

---

### Current State Assessment (After Correcting Configuration)

Run `jest --coverage` with the corrected config and fill in this table:

| Metric            | Current % | Target % | Gap  | Priority |
|-------------------|-----------|----------|------|----------|
| Line Coverage     | ~72% (reported) | TBD after config fix | -- | Medium |
| Branch Coverage   | Unknown -- check report | 80% (Tier 2), 90% (Tier 1) | -- | **High** |
| Function Coverage | Unknown   | 90%      | --   | High     |
| Statement Coverage| ~72%      | (use branch instead) | -- | Low |

---

### Module Risk Tier Classification

| Module/Directory             | Risk Tier | Line Target | Branch Target | Rationale                              |
|-----------------------------|-----------|-------------|---------------|----------------------------------------|
| `src/payments/`             | Tier 1    | 95%         | 90%           | Financial transactions, data integrity |
| `src/auth/`                 | Tier 1    | 95%         | 90%           | Authentication, authorization          |
| `src/orders/`               | Tier 2    | 85%         | 80%           | Core business logic                    |
| `src/users/`                | Tier 2    | 85%         | 80%           | User data management                   |
| `src/routes/`               | Tier 2    | 80%         | 75%           | Request handling, validation           |
| `src/middleware/`           | Tier 3    | 65%         | 60%           | Logging, error formatting              |
| `src/config/`               | Tier 3    | 50%         | N/A           | Env-var loading, DI setup              |
| `src/generated/`            | Excluded  | --          | --            | Auto-generated GraphQL/OpenAPI types   |
| `src/migrations/`           | Excluded  | --          | --            | Database migrations                    |

---

### Immediate Action: Inspect the Payments Module

Open the HTML coverage report in `coverage/lcov-report/index.html`. Navigate to `src/payments/`. Look for the following specific patterns:

**High-priority uncovered scenarios to find:**

- **Uncovered catch blocks** -- Any `try/catch` where the `catch` branch shows as uncovered means the error handling path for payment failures has never executed in tests. This is almost certainly causing your production bugs: when the payment gateway returns a network error or a malformed response, the untested catch block runs and does something unknown (swallows the error, returns wrong status, throws uncaught, etc.).

- **Uncovered else branches on payment validation** -- If you have code like:
  ```typescript
  if (amount > 0 && amount <= MAX_TRANSACTION_LIMIT) {
    // process payment
  } else {
    // reject -- is this branch tested?
  }
  ```
  The else path rejecting invalid amounts is a critical security and correctness path.

- **Uncovered response-code handling** -- Payment gateway responses for declined cards, insufficient funds, fraud flags, and timeouts are distinct code paths. Each must be an explicit test case.

---

### Corrected Jest Configuration

```typescript
// jest.config.ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/*.{test,spec}.ts",
    "!src/generated/**",
    "!src/migrations/**",
    "!src/index.ts",
  ],
  coverageProvider: "v8",
  coverageReporters: ["text", "lcov", "json-summary"],
  coverageThreshold: {
    // Global minimum -- ratchet, not aspirational target
    global: {
      lines: 70,         // Set to current - 2%
      branches: 60,      // Branch coverage will be lower than line -- this is normal
      functions: 75,
    },
    // Tier 1: payments -- strict
    "./src/payments/**/*.ts": {
      lines: 90,
      branches: 85,
      functions: 90,
    },
    // Tier 1: auth -- strict
    "./src/auth/**/*.ts": {
      lines: 90,
      branches: 85,
      functions: 90,
    },
    // Tier 2: orders
    "./src/orders/**/*.ts": {
      lines: 80,
      branches: 75,
      functions: 85,
    },
  },
};

export default config;
```

---

### Top Coverage Gaps (Priority Order)

1. `src/payments/PaymentProcessor.ts` -- **Branch Coverage: likely < 50%** -- Risk: payment gateway error paths completely untested -- Action: Add test cases for network timeout, declined card (response code 402), fraud block (response code 403), malformed gateway response, and idempotency key collision.

2. `src/payments/RefundService.ts` -- **Catch blocks uncovered** -- Risk: partial refund failures may be silently swallowed -- Action: Inject a mock gateway that throws `GatewayTimeoutError` and `InsufficientFundsError` and assert correct HTTP response codes and error logging.

3. `src/auth/TokenValidator.ts` -- **Else branch on permission check** -- Risk: authorization bypass if the rejection path has a bug -- Action: Test expired tokens, malformed JWTs, insufficient-scope tokens, and revoked tokens as explicit test cases.

4. `src/orders/PricingEngine.ts` -- **Ternary expressions uncovered on false path** -- Risk: promotional pricing or discount logic errors -- Action: Test with no active promotions, expired promotions, stacked discounts, and zero-value orders.

---

### Ratchet Plan

- **Today (no-regression gate):** Set global thresholds to `current - 2%`. Payments and auth modules set to current payment/auth coverage - 2%.
- **Week 2-3:** Close the catch-block gaps in `PaymentProcessor.ts` and `RefundService.ts`. Payment module branch coverage should reach 80%.
- **Week 4-6:** Add negative test cases for auth module. Auth branch coverage target: 85%.
- **30-day checkpoint:** Ratchet global branch threshold up to 65%, payment/auth to 85%.
- **90-day target:** Global branch 75%, Tier 1 modules at 90% branch coverage.
- **Lock-in rule:** After each sprint that improves a module above its target, commit a config change raising that module's threshold to lock in the gain.

---

### Exclusion Policy

| Pattern                   | Reason                              | Review Date |
|--------------------------|-------------------------------------|-------------|
| `src/generated/**`       | Auto-generated from OpenAPI spec    | Each spec update |
| `src/migrations/**`      | Knex migration files, not runtime   | Quarterly |
| `src/index.ts`           | Express bootstrap, no logic         | Quarterly |
| `src/config/env.ts`      | Reads process.env, no branching logic | 90 days |

All suppression annotations in source code (`/* c8 ignore next */`) must include an inline comment explaining why:
```typescript
/* c8 ignore next -- exhaustive switch on PaymentStatus enum, default is unreachable by type construction */
default:
  throw new UnreachableError(status);
```

---

### Recommended Next Actions (Ordered by Impact)

1. **Add `collectCoverageFrom` to Jest config immediately** and re-run coverage. Establish the real baseline number before doing anything else.
2. **Open the branch coverage HTML report** for `src/payments/` and catalog every uncovered catch block and else branch. This is the direct cause of production bugs.
3. **Write payment gateway error scenario tests** this sprint -- network failure, declined card, timeout, partial charge. Each is a test case, not a category.
4. **Set the no-regression CI gate** at `current branch coverage - 2%` to stop the hole from getting bigger while the team fills it.
5. **Configure diff coverage enforcement** in CI so all new code in PRs must have 80% branch coverage -- prevent new debt accumulation in parallel with paying down old debt.
6. **Install Coverage Gutters extension** in VS Code (or equivalent IDE coverage runner) so engineers see uncovered lines while writing code, not after pushing.
7. **Schedule a 30-day coverage review** to ratchet thresholds upward based on actual progress, not on aspirational targets set today.
