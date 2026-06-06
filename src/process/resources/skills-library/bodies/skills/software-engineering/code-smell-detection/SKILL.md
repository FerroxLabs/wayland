---
name: code-smell-detection
description: |
  Guides expert-level code smell detection implementation: clean-code and refactoring decision frameworks, production-ready patterns, and concrete templates for code smell detection workflows.
  Use when the user asks about code smell detection, code smell detection configuration, or clean-code best practices for code projects.
  Do NOT use when the user needs a different developer tools capability -- check sibling skills in the developer tools subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "clean-code refactoring debugging"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Code Smell Detection

## When to Use

**Use this skill when:**
- A user wants to audit an existing codebase for structural problems -- long methods, deep inheritance hierarchies, data clumping, shotgun surgery candidates, or feature envy symptoms
- A user is setting up automated lint and static analysis pipelines and wants to know which rules to enable, what thresholds to configure, and how to triage violations
- A user is preparing for a refactoring sprint and needs a prioritized list of what to fix first based on impact and risk
- A user has received code review feedback mentioning smells like "this class is doing too much" or "this looks like a God Object" and wants to understand the pattern and the fix
- A user wants to define team-wide code quality standards -- cyclomatic complexity ceilings, method length limits, coupling metrics -- and encode them in tooling
- A user is onboarding to a legacy codebase and wants a systematic approach to understanding its worst structural problems before touching it
- A user wants to build a custom static analysis rule for a smell their team keeps introducing that existing tools do not catch

**Do NOT use this skill when:**
- The user needs help with runtime performance profiling or bottleneck analysis -- use a performance profiling skill instead; smells address structural quality, not execution speed
- The user is asking about security vulnerability scanning (SAST for injection, XSS, CVE matching) -- those scanners have different rule taxonomies and threat models
- The user needs dependency management or version conflict resolution -- that is a separate concern from code structure quality
- The user wants test coverage metrics or test quality review -- test smells (e.g., "mystery guest", "sensitive equality") are a distinct subdomain with different detection patterns
- The user is asking about architecture-level concerns like service boundary design, data consistency across microservices, or API design -- those are above the code smell granularity level
- The user needs general debugging help to find a specific bug -- code smell detection is structural analysis, not defect localization
- The user wants IDE setup or editor configuration that is not related to quality gates -- check tooling configuration skills in the developer-tools subcategory

---

## Process

### Step 1: Establish the Audit Scope and Smell Taxonomy

Before running any tool or reviewing any code, define the scope and the set of smells you are looking for. This prevents wasted effort and unfocused output.

- **Select the smell taxonomy.** The canonical reference is Fowler's 22 smells from "Refactoring" (2nd ed.), but for practical detection divide them into four operational categories:
  - **Bloaters:** Long Method (>20 lines is a warning, >40 is critical), Large Class (>300 lines or >20 public methods), Long Parameter List (>4 parameters), Data Clumps, Primitive Obsession
  - **Object-Orientation Abusers:** Switch Statements / type-checking chains, Temporary Field, Refused Bequest (subclass ignores most of parent's interface), Alternative Classes with Different Interfaces
  - **Change Preventers:** Divergent Change (one class changes for multiple unrelated reasons), Shotgun Surgery (one logical change requires edits to many classes), Parallel Inheritance Hierarchies
  - **Dispensables:** Dead Code (unreachable methods, unused parameters), Speculative Generality (YAGNI violations -- abstractions with no current users), Lazy Class (class with almost no behavior), Duplicate Code (copy-paste replication)
  - **Couplers:** Feature Envy (method more interested in another class's data), Inappropriate Intimacy (classes with bidirectional private dependencies), Message Chains (a.b().c().d()), Middle Man (>50% of methods just delegate)
- **Define the audit boundary.** Specify whether you are auditing the entire repository, a single module/package, or files modified in the last N days (the "change radius" approach is most effective for legacy codebases with decades of debt).
- **Record the language and framework.** Smell detection tooling and thresholds differ significantly between Python, Java, JavaScript/TypeScript, Go, C#, and Ruby. A 20-line method limit is appropriate for Java but too strict for Go where verbose error handling inflates line counts.
- **Identify priority smells.** Ask the user what category of problem they are experiencing: slow feature delivery (focus on Change Preventers), onboarding difficulty (focus on Bloaters and Couplers), frequent regressions (focus on Dispensables and Bloaters).

### Step 2: Select and Configure Static Analysis Tooling

Map the confirmed language and smell categories to concrete tools. Configure thresholds, not just enable defaults.

- **Java / Kotlin:**
  - PMD with ruleset `design`, `naming`, `codesize` -- configure `CyclomaticComplexity` maximum to 10 (warning at 7), `NPathComplexity` maximum to 200, `ExcessiveClassLength` at 300 lines, `ExcessiveMethodLength` at 30 lines, `TooManyMethods` at 20
  - Checkstyle for naming, import control, and structural rules
  - SpotBugs (successor to FindBugs) for deeper data flow and null analysis that catches feature envy patterns missed by PMD
  - SonarQube / SonarCloud for cross-file coupling analysis -- Afferent Coupling (Ca), Efferent Coupling (Ce), and Instability (I = Ce / (Ca + Ce)) metrics identify change-prevention smells
- **Python:**
  - Pylint with `design` checks: `max-args=5`, `max-attributes=7`, `max-bool-expr=5`, `max-branches=12`, `max-locals=15`, `max-statements=50`, `min-public-methods=2`, `max-public-methods=20`
  - Radon for cyclomatic complexity (rank A=1-5, B=6-10, C=11-15; flag anything C or above for review) and maintainability index (flag MI below 20)
  - Flake8 with `flake8-cognitive-complexity` plugin; set cognitive complexity ceiling at 15
  - Vulture for dead code detection with a confidence threshold of 80%
- **JavaScript / TypeScript:**
  - ESLint with `complexity` rule set to max 10, `max-depth` at 4, `max-lines` at 300, `max-lines-per-function` at 50, `max-params` at 4
  - `eslint-plugin-sonarjs` adds smell-specific rules: `no-identical-functions`, `no-collapsible-if`, `cognitive-complexity` (ceiling 15), `no-duplicate-string` (threshold 3 duplicates)
  - `ts-morph` or `typescript-eslint` for structural analysis in TypeScript projects
  - Dependency-cruiser for coupling analysis -- detect circular dependencies and unexpected cross-layer imports
- **C# / .NET:**
  - Roslyn Analyzers with `Microsoft.CodeAnalysis.NetAnalyzers` enabled at warning level
  - NDepend (commercial) or free equivalents: `dotnet-sonarscanner` with SonarQube for coupling and complexity
  - StyleCop.Analyzers for structural rules
- **Go:**
  - `golangci-lint` with `gocyclo` (threshold 15, not 10, due to verbose error handling patterns), `gocritic` (smells like "appendAssign", "typeAssert", "paramTypeCombine"), `dupl` for duplicate code detection (threshold 150 tokens)
  - `godot` and `revive` for additional structural rules
- **Universal approach for multi-language repos:** Use SonarQube Community Edition self-hosted or SonarCloud. It covers 27+ languages with a unified rule taxonomy and stores historical metrics so you can track smell density over time.

### Step 3: Run Baseline Analysis and Collect Metrics

Execute the selected tools against the scoped codebase and record raw output without any filtering. You need the unfiltered baseline before triage.

- **Capture four key aggregate metrics:**
  - Total smell count by category (Bloaters, OO Abusers, Change Preventers, Dispensables, Couplers)
  - Smell density: violations per 1,000 lines of code (KLOC). Industry baseline is roughly 20-40 violations/KLOC in maintained codebases; >100/KLOC indicates systemic neglect
  - Files by violation count -- the top 10 files by violation density are almost always the highest-value refactoring targets
  - Cyclomatic complexity distribution: what percentage of methods are A (1-5), B (6-10), C (11-15), D/E/F (16+)
- **Generate a Churn-Complexity matrix.** Cross-reference static analysis output with git log to find files that are both high-complexity AND frequently changed. These are the highest-risk files:
  - Run: `git log --format=format: --name-only | sort | uniq -c | sort -rg | head -20` to get top 20 churned files
  - Overlay complexity scores from your tool output
  - Files in the top quartile of both churn AND complexity are "hot spots" -- fix these first
- **Do not attempt to fix everything in the baseline.** The baseline is diagnostic. Flag it as technical debt inventory, not a sprint backlog.
- **Save tool output as a structured artifact** -- JSON or SARIF format where available. SARIF (Static Analysis Results Interchange Format) is the standard for tool interoperability and GitHub Advanced Security integration.

### Step 4: Triage and Prioritize Violations

Raw tool output is noisy. Triage reduces hundreds of violations to a manageable, prioritized list by combining severity, fixability, and risk.

- **Apply the three-tier severity model:**
  - **P1 -- Fix immediately:** Smells that actively impede correctness or create security surface area -- feature envy accessing private state through reflection, dead code containing deprecated security logic that still executes, data clumps that model the same concept inconsistently across the codebase
  - **P2 -- Fix in next sprint:** Bloaters above the critical threshold (methods >40 lines, classes >500 lines), cyclomatic complexity >15 in frequently-changed files, shotgun surgery confirmed by churn analysis
  - **P3 -- Fix opportunistically:** Smells in stable code that is rarely changed -- lazy classes, speculative generality, minor naming inconsistencies. Do not disturb stable code for cosmetic fixes
- **Apply the Boy Scout Rule selectively.** Add a policy: any file touched in a PR must not leave with a higher smell count than it entered with. This stops smell accumulation without requiring a dedicated refactoring sprint.
- **Suppress false positives explicitly.** Every suppression must include a comment with (1) the smell name, (2) why it is a false positive, and (3) the reviewer who approved the suppression. Never use blanket disable comments that silence an entire file.
- **Group smells by refactoring type.** Violations that share a refactoring move -- Extract Method, Extract Class, Move Method, Introduce Parameter Object -- can often be fixed together efficiently. Group them before scheduling work.

### Step 5: Implement Targeted Refactorings

For each prioritized smell, apply the canonical refactoring. Document the mapping between smell and fix.

- **Long Method (>40 lines):** Apply Extract Method. Each extracted method should be nameable with a verb phrase that describes its intent at one level of abstraction. If you cannot name it, you have not found the right extraction boundary. Target: no method longer than 20 lines after refactoring, each method operates at a single level of abstraction.
- **Large Class / God Object (>300 lines, >20 methods):** Apply Extract Class. Start by identifying which fields and methods are used together -- cohesion clustering. Use the Single Responsibility Principle to name the extracted classes. A class should have exactly one reason to change.
- **Long Parameter List (>4 parameters):** Apply Introduce Parameter Object (group related parameters into a value object) or Preserve Whole Object (pass the originating object instead of extracting its fields). If parameters belong to no cohesive object, apply Replace Parameter with Query.
- **Duplicate Code:** Distinguish between textual duplication and conceptual duplication. Textual: apply Extract Method, pull to a shared utility, or use a template method pattern. Conceptual (same logic, different types): use generics/templates. Do NOT eliminate duplication across bounded contexts in a microservices architecture -- some duplication is preferable to coupling.
- **Feature Envy (method more interested in another class's data than its own):** Apply Move Method. The method belongs in the class whose data it uses most. Measure "envy" by counting field accesses per class in the method body.
- **Switch / Type Checking chains:** Apply Replace Conditional with Polymorphism. Create a subclass or strategy implementation for each case branch. Exception: simple switch on an enum for display/serialization purposes is acceptable -- polymorphism is overkill there.
- **Data Clumps (same 3+ fields always appear together):** Apply Extract Class to create a value object. The test: if you remove one parameter from the clump, do the others lose meaning? If yes, they are a clump.
- **Message Chains (a.getB().getC().getD()):** Apply Hide Delegate or Extract Method at the chain head. Follow the Law of Demeter: a method should only call methods on (1) itself, (2) its parameters, (3) objects it creates, (4) its direct component objects.

### Step 6: Integrate Smell Detection into CI/CD

Detection without enforcement creates a broken window effect. Quality gates must be automated.

- **Add tool execution to CI pipeline as a required check.** The build fails on new violations above the configured thresholds. Never fail on pre-existing violations from the baseline -- use a ratchet approach where the tool compares the current branch against the main branch's violation count.
- **Configure threshold ratchets specifically:**
  - New method introduced with cyclomatic complexity >10: CI fails
  - New file introduced with >300 lines: CI fails (warning at 200)
  - PR increases smell count in modified files: CI fails
  - PR introduces dead code (unreachable methods, unused exports): CI fails
- **Use pre-commit hooks for fast feedback.** Install pre-commit with hooks for your linter (e.g., `pylint --score=no`, `eslint --max-warnings 0 on changed files only`). Pre-commit checks run in under 5 seconds on a changed file -- they must be fast or developers bypass them.
- **Publish smell metrics to a dashboard.** Integrate SonarQube or Codecov into your PR workflow so the smell trend (increasing/decreasing over time) is visible to the team. Trend matters more than absolute count.
- **Set a smell debt ceiling.** Define: "We will not merge PRs that increase our SonarQube technical debt estimate above X hours." Start permissive (e.g., +30 minutes per PR) and tighten the ceiling over 6 months.

### Step 7: Establish Team Conventions and Living Documentation

Automated tools cannot catch every smell. Human pattern recognition in code review must be calibrated.

- **Create a team smell catalog.** Document the 5-10 smells most common in your codebase with (1) an example from your actual code (anonymized), (2) the smell name, (3) the canonical refactoring, and (4) the "after" state. This is more effective than pointing developers to Fowler's book.
- **Add smell detection to PR review checklists.** Include explicit checklist items: "Does any new method exceed 20 lines?", "Does this class have a single clear responsibility?", "Are there any parameter lists longer than 4?", "Is there any copy-paste from elsewhere in the codebase?"
- **Run monthly smell audits.** Monthly: rerun the full analysis, compare violation counts by category to the previous month, review the top 10 hotspot files. Schedule 15-minute smell review as part of engineering sync.
- **Rotate the "smell warden" role.** Each sprint, one engineer is responsible for reviewing new violations in CI and ensuring suppressions are justified. Rotating the role builds team-wide familiarity.

---

## Output Format

When delivering smell analysis results, use the following structure:

```markdown
## Code Smell Audit Report

**Project / Scope:** [module name, file range, or "full repository"]
**Language:** [language + runtime version]
**Analysis Date:** [date]
**Tools Used:** [list of tools + versions]
**Lines of Code Analyzed:** [LOC]

---

### Executive Summary

| Metric                          | Value          | Status     |
|---------------------------------|----------------|------------|
| Total Violations Found          | [N]            | [🔴/🟡/🟢] |
| Smell Density (violations/KLOC) | [N]            | [🔴/🟡/🟢] |
| Files Above Complexity Ceiling  | [N] of [total] | [🔴/🟡/🟢] |
| Dead Code Instances             | [N]            | [🔴/🟡/🟢] |
| Duplicate Code Blocks           | [N]            | [🔴/🟡/🟢] |

Status thresholds: 🟢 = within target, 🟡 = approaching limit, 🔴 = exceeds limit

---

### Smell Distribution by Category

| Category            | Count | % of Total | Trend vs. Last Audit |
|---------------------|-------|------------|----------------------|
| Bloaters            | [N]   | [%]        | [↑ / ↓ / →]         |
| OO Abusers          | [N]   | [%]        | [↑ / ↓ / →]         |
| Change Preventers   | [N]   | [%]        | [↑ / ↓ / →]         |
| Dispensables        | [N]   | [%]        | [↑ / ↓ / →]         |
| Couplers            | [N]   | [%]        | [↑ / ↓ / →]         |

---

### Hotspot Files (Churn × Complexity Matrix)

| File Path               | Complexity Score | Commits (90d) | Primary Smells              | Priority |
|-------------------------|------------------|---------------|-----------------------------|----------|
| [path/to/file.ext]      | [CC score]       | [N]           | [smell names]               | P1       |
| [path/to/file.ext]      | [CC score]       | [N]           | [smell names]               | P2       |

---

### Prioritized Violation List

#### P1 -- Fix Immediately

**[Smell Name] in [File:LineRange]**
- **Pattern Detected:** [Brief description of the specific instance]
- **Why It Matters:** [Specific risk -- regression likelihood, onboarding friction, etc.]
- **Recommended Refactoring:** [Specific move -- Extract Method, Extract Class, etc.]
- **Estimated Effort:** [S / M / L] ([hours estimate])
- **Before Sketch:**
  ```[language]
  [illustrative before code snippet]
  ```
- **After Sketch:**
  ```[language]
  [illustrative after code snippet]
  ```

#### P2 -- Fix in Next Sprint

[Same structure as P1, repeated per violation group]

#### P3 -- Fix Opportunistically

[List format acceptable here: file, smell, refactoring, effort]

---

### CI Configuration Recommendations

```yaml
# Recommended threshold configuration for [tool name]
[tool-specific YAML or config block with actual values filled in]
```

---

### Refactoring Roadmap

| Sprint | Target Files        | Smells Addressed              | Expected Debt Reduction |
|--------|---------------------|-------------------------------|------------------------|
| 1      | [file list]         | [smell names]                 | [hours]                |
| 2      | [file list]         | [smell names]                 | [hours]                |
| 3      | [file list]         | [smell names]                 | [hours]                |

---

### Suppression Register

| File | Line | Smell | Justification | Approved By | Expires |
|------|------|-------|---------------|-------------|---------|
| [path] | [N] | [name] | [reason] | [name] | [date or "never"] |
```

---

## Rules

1. **Never equate line count alone with quality.** A 50-line method composed of a single, well-named level of abstraction may be cleaner than a 10-line method with 4 nested conditionals and 3 levels of abstraction mixing. Always evaluate cyclomatic complexity and cognitive complexity alongside raw line count. Cognitive complexity (as defined by SonarSource) is a better proxy for human readability than cyclomatic complexity.

2. **Treat duplicate code across service boundaries differently than within a service.** Within a single bounded context, duplicate code is a clear smell requiring extraction. Across microservices or independently deployable modules, shared libraries create coupling that may be worse than the duplication. The rule: tolerate duplication across deployment boundaries; eliminate it ruthlessly within them.

3. **Never suppress a smell without a dated justification comment.** Suppressions that outlive their justification are worse than the original smell because they actively hide a known problem. Add an expiration date to every suppression -- six months is a reasonable default. Review suppressions in the monthly audit.

4. **Do not apply Extract Method purely to hit line-count thresholds.** Methods extracted only to satisfy a linter with no semantic meaning (names like `doPartOne`, `helperMethod2`) are worse than the long method they replaced. Each extracted method must have a name that communicates a complete intent to a reader who has never seen the code.

5. **A class with high Afferent Coupling (many classes depend on it) requires more caution than a class with high Efferent Coupling when refactoring.** High Ca means changes propagate outward to many dependents -- any refactoring requires a broader test suite validation. High Ce (class depends on many others) indicates Feature Envy or inappropriate intimacy but is safer to refactor because the blast radius is contained.

6. **Never run smell detection only once.** A single audit produces a snapshot. The critical data is the trend: is smell density increasing, plateauing, or decreasing quarter over quarter? Configure tooling so every CI run produces a comparable metric that feeds a time-series view.

7. **Distinguish between smells in production code, test code, and generated code.** Test code has different smell tolerances -- long test methods that set up complex scenarios may be acceptable if they maximize readability. Generated code (ORM models, protobuf stubs, GraphQL types) should be excluded entirely from smell analysis because developers cannot directly fix violations there.

8. **The Refused Bequest smell is frequently a sign that the inheritance hierarchy is wrong, not that the subclass needs more methods.** Before adding behavior to the subclass to "satisfy" the smell detector, evaluate whether composition should replace inheritance entirely. Inheritance should model strict IS-A relationships; if a subclass only uses 30% of its parent's interface, the relationship is almost certainly not IS-A.

9. **Do not mistake high cyclomatic complexity for inherently bad code in all domains.** Parsing logic, state machines, business rule engines, and configuration interpreters legitimately have high branching. For these modules, raise the threshold (e.g., 20 instead of 10), document the exception in the suppression register, and ensure the high-complexity code has exhaustive unit test coverage instead.

10. **Never use smell detection output as a performance review metric for individual developers.** Violation counts assigned to authors by git blame create perverse incentives -- developers will suppress violations instead of fixing them, or avoid touching high-debt areas to keep their numbers clean. Smells are an aggregate team quality metric, never an individual accountability tool.

---

## Edge Cases

### Legacy Codebases with Thousands of Pre-existing Violations

When a codebase returns 10,000+ violations on the first analysis run, do not attempt to configure a CI gate that blocks on any existing violation -- it will block every PR indefinitely. Instead, apply the ratchet pattern:
- Configure your tool (SonarQube quality gate, or a custom script using the tool's JSON output) to baseline the current violation count per file.
- The gate fails only if a PR increases the violation count in any file it touches above its baselined count.
- This means new code is held to the standard immediately, and existing debt is addressed opportunistically under the Boy Scout Rule.
- Track the baseline count monthly and celebrate its decline -- this gives the team a visible win metric.

### Smells in Performance-Critical Inner Loops

A method that is called millions of times per second may legitimately inline logic that would normally be extracted. For example, avoiding virtual dispatch (Replace Conditional with Polymorphism) in a hot path is sometimes justified. The rule:
- The exception must be validated with profiler output (wall-clock regression, not intuition).
- The inlined code must have an Extract Method refactoring written alongside it and commented out (or kept in a non-production test module), so the intent remains clear.
- The suppression must include the profiler data as a code comment reference.
- Revisit the exception every major version -- hardware and compiler/runtime improvements often eliminate the performance delta over time.

### Monorepo with Inconsistent Smell Standards Across Teams

In a monorepo where 6 teams share a repository but have autonomy over their modules, smell standards will naturally diverge. Handle this by:
- Defining a floor standard applied universally (e.g., no method over 60 lines, no cyclomatic complexity over 20, no dead code).
- Allowing each team to define stricter standards within their module directories via configuration inheritance (most tools support directory-scoped configuration).
- Using a shared SonarQube project with per-team quality gates rather than a single gate, so one team's debt does not block another team's deployment.
- Auditing the floor standards quarterly to progressively tighten them as the codebase improves.

### Dynamically Generated or Metaprogramming-Heavy Code

Languages like Ruby, Python, and JavaScript allow metaprogramming patterns (dynamic method definition, `__getattr__`, `method_missing`, decorators that wrap behavior) that generate apparent dead code or feature envy that is not real. Static analysis tools will flag these patterns incorrectly.
- Identify the specific metaprogramming patterns in use (decorator factories, mixin injection, ORM magic methods).
- Add those patterns to the tool's configuration as exceptions -- most tools support custom ignore patterns by regex or by annotation.
- Write a comment at each metaprogramming site explaining the pattern so human reviewers understand why the smell detector is suppressed.
- Consider adding an integration test that exercises the dynamically defined methods, which also serves as living documentation.

### Smell Detection in a Polyglot Microservices Architecture

When each service uses a different language, a unified smell standard is difficult to enforce because thresholds are language-specific. Avoid the mistake of applying Java's 10-method complexity ceiling to Go or Ruby. Instead:
- Define smell standards per language in a shared document (the team smell catalog).
- Use a tool that supports multiple languages under one roof (SonarQube is the most practical choice here) with per-language rule profiles.
- Apply complexity thresholds appropriate to each language's idiomatic verbosity level: Go at 15, Java at 10, Python at 12, Ruby at 8.
- Enforce the same smell categories across all languages, even if the specific thresholds differ.

### Smells Introduced by Framework Conventions

Some frameworks require patterns that look like code smells but are idiomatic. Django views can be long because they handle form validation, authentication, and response rendering in one place. Spring Boot configuration classes often have high Efferent Coupling by design. React components can have many props (parameter list smell). Address this by:
- Creating framework-specific exclusion profiles in your linter configuration (e.g., exclude files matching `views.py` from the Long Method check above 40 lines, but still enforce it above 80).
- Documenting the framework convention in the team smell catalog so reviewers do not flag it in PRs.
- Being aware that framework-imposed smells often indicate the framework is being misused -- if a Django view is 200 lines, the framework convention explains some of it but not all of it.

### Refactoring Creates New Smells

A common failure mode: a developer extracts a large class into four smaller classes but introduces a Message Chain or Middle Man in the process. Each new class just delegates to the next.
- After every refactoring, re-run the smell detector on the affected files immediately, not just at CI time.
- Pay particular attention to the Couplers category after any Extract Class or Move Method operation.
- A class that is 80%+ delegation (Middle Man smell) should be collapsed -- either remove the delegation layer or have it provide real value beyond forwarding.
- Use the "Parallel Change" pattern (also called "expand and contract") when refactoring to avoid introducing temporary smells: add the new structure alongside the old, migrate callers incrementally, then delete the old structure.

---

## Example

**Input:** "We have a Python 3.11 Django/REST API monolith with about 45,000 lines of code. Our team of 5 backend engineers is shipping features slowly because every change seems to break something unrelated. We don't have any automated smell detection set up yet. What should we do?"

---

**Output:**

## Code Smell Audit Report

**Project / Scope:** Django REST API Monolith -- full repository
**Language:** Python 3.11
**Analysis Date:** [current date]
**Tools Recommended:** Pylint 3.x, Radon 6.x, Vulture 2.x, flake8 + flake8-cognitive-complexity, SonarCloud (free tier for open source or $10/dev/month)
**Lines of Code:** ~45,000

---

### Diagnosis

The symptom -- "every change breaks something unrelated" -- is a textbook signature of two specific smell categories:

1. **Shotgun Surgery (Change Preventer):** A single logical change requires edits in many unrelated files. This happens when a concept is represented in too many places simultaneously.
2. **Inappropriate Intimacy / Feature Envy (Couplers):** Classes are excessively entangled with each other's internals, so changing one class's internal state propagates breakage to classes that should not care.

These smells often co-occur in Django codebases that started as simple CRUD apps and grew without refactoring the model layer. The Django ORM encourages models to become God Objects -- the User model, for example, accumulates authentication logic, profile logic, preference storage, billing relationships, and audit trail management over time because each developer adds their feature to the closest model.

---

### Immediate Setup: Install and Configure Detection Tools

**Step 1 -- Install tools:**

```bash
pip install pylint radon vulture flake8 flake8-cognitive-complexity
pip install pylint-django  # critical for Django-aware Pylint
```

**Step 2 -- Create `.pylintrc` with Django-appropriate thresholds:**

```ini
[MASTER]
load-plugins=pylint_django
django-settings-module=myproject.settings

[DESIGN]
max-args=5
max-attributes=8
max-bool-expr=5
max-branches=12
max-locals=15
max-parents=5
max-public-methods=20
max-returns=6
max-statements=50
min-public-methods=2

[FORMAT]
max-line-length=119
max-module-lines=400

[SIMILARITIES]
min-similarity-lines=6
ignore-comments=yes
ignore-docstrings=yes
```

**Step 3 -- Run the baseline audit:**

```bash
# Cyclomatic complexity per function -- flag anything C rank (11-15) or above
radon cc ./myproject -s -a -n C

# Maintainability index -- flag anything below MI 20
radon mi ./myproject -s -n B

# Dead code detection
vulture ./myproject --min-confidence 80 --exclude "*/migrations/*,*/settings*"

# Pylint design violations only
pylint myproject --disable=all --enable=design -r y

# Cognitive complexity -- flag above 15
flake8 myproject --max-cognitive-complexity=15 --select=CCR001
```

---

### Executive Summary (Projected from symptoms described)

In a 45,000-line Django monolith of this age without automated detection, expect the following on first run:

| Metric                          | Likely Finding     | Target State       |
|---------------------------------|--------------------|--------------------|
| Total Pylint Design Violations  | 300--800           | <200               |
| Smell Density (violations/KLOC) | 7--18/KLOC         | <8/KLOC            |
| Methods with Cyclomatic CC > 10 | 40--100 methods    | <15 methods        |
| Dead Code Instances             | 50--150            | 0 in active modules |
| Radon MI below 20 (unreadable)  | 5--20 files        | 0 files            |

---

### Hotspot Identification: The Churn × Complexity Matrix

Run this immediately -- it will identify your top 5 files responsible for most of your breakage:

```bash
# Get top 20 most-changed files in last 90 days
git log --since="90 days ago" --format=format: --name-only \
  | grep "\.py$" | sort | uniq -c | sort -rg | head -20
```

Cross-reference with Radon output. Files appearing in both lists are your P1 targets. In a Django monolith, these will almost certainly be:
- `models.py` in your largest app (God Object -- models that have grown to absorb all domain logic)
- `views.py` or `serializers.py` in your most active feature area (Long Method, Feature Envy)
- `utils.py` anywhere it exists (Lazy Class or its inverse -- a junk drawer Large Class)

---

### The Primary Smell to Fix: God Object in Django Models

Django's `models.py` convention encourages developers to add business logic directly to model classes. Over 2--3 years of active development, a User or Order model becomes a 600-line class with 35+ methods spanning authentication, billing, notifications, and reporting. This is the most common source of "every change breaks something unrelated" in Django codebases.

**Detection:**

```bash
# Find model classes with more than 20 methods
radon raw ./myproject/*/models.py -s
pylint myproject --disable=all --enable=R0904  # too-many-public-methods
```

**Illustrative Before (God Object -- `models.py`):**

```python
class User(AbstractUser):
    # ... 40+ fields ...

    def get_full_name(self): ...
    def update_profile(self, data): ...
    def send_welcome_email(self): ...  # should not be here
    def charge_subscription(self, plan): ...  # should not be here
    def calculate_invoice_total(self): ...  # should not be here
    def generate_pdf_invoice(self): ...  # should not be here
    def log_login_event(self, ip_address): ...  # should not be here
    def check_feature_flag(self, flag_name): ...  # should not be here
    # ... 20 more methods ...
```

**Refactoring: Extract Service Classes (Domain Services pattern)**

Apply Extract Class repeatedly, grouping by Single Responsibility:

```python
# models.py -- User model retains ONLY persistence concerns
class User(AbstractUser):
    # Fields only -- no business logic beyond property accessors
    subscription_plan = models.CharField(...)
    profile_completed_at = models.DateTimeField(null=True)

    @property
    def is_subscribed(self):
        return self.subscription_plan is not None


# services/billing.py -- billing responsibility extracted
class BillingService:
    def __init__(self, user: User):
        self.user = user

    def charge_subscription(self, plan: str) -> PaymentResult:
        ...

    def calculate_invoice_total(self) -> Decimal:
        ...


# services/notifications.py -- notification responsibility extracted
class UserNotificationService:
    def __init__(self, user: User):
        self.user = user

    def send_welcome_email(self) -> None:
        ...


# services/audit.py -- audit responsibility extracted
class UserAuditService:
    def record_login(self, user: User, ip_address: str) -> None:
        ...
```

This extraction eliminates the God Object, reduces coupling (billing tests no longer require a full User object with all fields populated), and makes Shotgun Surgery visible -- when billing logic changes, only `BillingService` needs to change.

---

### CI Quality Gate Configuration

Add to your CI pipeline (GitHub Actions example):

```yaml
# .github/workflows/quality.yml
name: Code Quality Gate

on: [pull_request]

jobs:
  smell-detection:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # needed for git log churn analysis

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install analysis tools
        run: pip install pylint pylint-django radon vulture flake8 flake8-cognitive-complexity

      - name: Cyclomatic complexity gate (fail on new CC > 15)
        run: |
          radon cc ./myproject -s -n D --json > cc_report.json
          python scripts/check_new_violations.py cc_report.json  # compare vs baseline

      - name: Dead code gate (fail on any new dead code)
        run: |
          vulture ./myproject --min-confidence 80 \
            --exclude "*/migrations/*" \
            --make-whitelist > vulture_whitelist.py || true
          vulture ./myproject --min-confidence 80 \
            --exclude "*/migrations/*"

      - name: Cognitive complexity gate (fail on new violations > 15)
        run: |
          flake8 myproject \
            --max-cognitive-complexity=15 \
            --select=CCR001 \
            --count
```

---

### 90-Day Refactoring Roadmap

| Sprint (2 weeks) | Focus                                           | Primary Smells Addressed              | Expected Improvement                              |
|------------------|-------------------------------------------------|---------------------------------------|---------------------------------------------------|
| Sprint 1         | Top 3 hotspot files from churn/complexity matrix | God Object, Long Method               | Reduces most common breakage source               |
| Sprint 2         | Extract service layer for top 2 domain areas    | Shotgun Surgery, Feature Envy         | Changes to billing stop touching auth code        |
| Sprint 3         | Dead code removal + duplicate code elimination  | Dispensables, Duplicate Code          | Reduces cognitive load and test surface area      |
| Sprint 4         | CI gate implementation + team catalog creation  | Process (prevention)                  | Prevents new debt accumulation                    |
| Sprint 5--6      | Remaining P2 violations from initial audit      | Bloaters, remaining Couplers          | Smell density drops below 8/KLOC target           |

---

### Suppression Register (initial entries for known Django framework smells)

| File                 | Line  | Smell                 | Justification                                              | Approved By | Expires     |
|----------------------|-------|-----------------------|------------------------------------------------------------|-------------|-------------|
| `*/views.py`         | n/a   | too-many-public-methods (>20) | Django class-based views use method-per-HTTP-verb convention | Team lead   | Review Q3   |
| `*/admin.py`         | n/a   | Long Method           | Django admin `get_queryset` and `save_model` are framework entry points | Team lead | Review Q3 |
| `*/migrations/*.py`  | n/a   | All smells            | Auto-generated -- not maintained by hand                   | Team lead   | Never       |

---

### Key Insight for This Codebase

The "every change breaks something unrelated" symptom will not be fully resolved by smell detection alone -- but addressing God Objects and Shotgun Surgery in the top 5 hotspot files will likely reduce your cross-feature regression rate by 50--70% within 6 weeks, based on the pattern this symptom typically represents. The most important action is the Churn × Complexity matrix: identify those files today, in the next 30 minutes, before writing a single line of refactoring code. Every other improvement follows from fixing what you find there.
