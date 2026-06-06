---
name: mutation-tester
description: |
  Mutation testing expertise covering mutation operators, tool usage (Stryker for JS/TS, PITest for Java, mutmut for Python), mutation score interpretation, surviving mutant analysis, equivalent mutant handling, test suite improvement strategies, CI integration, and cost-effectiveness analysis.
  Use when the user asks about mutation tester, mutation tester best practices, or needs guidance on mutation tester implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing best-practices guide"
  category: "testing-quality"
  subcategory: "quality-metrics"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Mutation Tester

## Core Philosophy

Code coverage answers "which lines did my tests execute?" but not "would my tests catch bugs in those lines?" Mutation testing answers the harder question. It introduces small, systematic changes (mutations) to your code and checks whether your tests detect them. If a test suite has 95% code coverage but only a 60% mutation score, it means 40% of potential bugs would go undetected. Mutation testing is the gold standard for measuring test suite effectiveness.

## How Mutation Testing Works

```
1. Parse your source code
2. Apply a mutation operator (e.g., change + to -)
3. Run your test suite against the mutated code
4. If any test FAILS -> mutant is KILLED (good)
   If all tests PASS -> mutant SURVIVED (bad -- tests are weak)
5. Repeat for every possible mutation
6. Calculate mutation score = killed / (total - equivalent)
```

## Mutation Operators

### Arithmetic Operators

```
Original          Mutated
a + b      ->     a - b
a - b      ->     a + b
a * b      ->     a / b
a / b      ->     a * b
a % b      ->     a * b
```

### Comparison Operators

```
Original          Mutated
a < b      ->     a <= b,  a >= b,  a == b
a <= b     ->     a < b,   a > b
a > b      ->     a >= b,  a <= b,  a == b
a >= b     ->     a > b,   a < b
a == b     ->     a != b
a != b     ->     a == b
```

### Logical Operators

```
Original          Mutated
a && b     ->     a || b
a || b     ->     a && b
!a         ->     a
```

### Conditional Mutations

```
Original          Mutated
if (cond)  ->     if (true),  if (false)
```

### Return Value Mutations

```
Original              Mutated
return true    ->     return false
return 0       ->     return 1
return x       ->     return x + 1
return ""      ->     return "mutated"
return obj     ->     return null
return list    ->     return []
```

### Removal Mutations

```
Original              Mutated
func_call(x)   ->     (removed entirely)
x += 1         ->     (removed entirely)
```

## Tool: Stryker (JavaScript/TypeScript)

### Setup

```shell
install via npm: --save-dev @stryker-mutator/core @stryker-mutator/jest-runner
npx stryker init
```

### Configuration

```json
// stryker.config.mjs
export default {
  packageManager: "npm",
  testRunner: "jest",
  reporters: ["html", "clear-text", "progress", "dashboard"],
  coverageAnalysis: "perTest",
  timeoutMS: 60000,

  // Target specific files
  mutate: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/index.ts"
  ],

  // Mutation operators to apply
  mutator: {
    excludedMutations: [
      "StringLiteral"  // Skip string mutations (noisy)
    ]
  },

  // Thresholds for CI
  thresholds: {
    high: 80,
    low: 60,
    break: 50  // Fail CI if mutation score drops below 50%
  },

  // Incremental mode (only test changed files)
  incremental: true,
  incrementalFile: ".stryker-cache/incremental.json",

  // Ignore specific patterns
  ignorers: ["string-literal"],
}
```

### Running Stryker

```shell
# Full run
npx stryker run

# Run on specific files
npx stryker run --mutate "src/services/discount.ts"

# Incremental (only re-test changed mutations)
npx stryker run --incremental
```

### Reading Stryker Results

```
Mutation testing complete. Results:
  Killed:    245  (mutant was detected by tests)
  Survived:   32  (mutant was NOT detected - WEAKNESS)
  Timeout:    12  (mutant caused infinite loop - counts as killed)
  No Coverage: 8  (mutant in code not covered by any test)
  Compile Error: 3  (mutant produced invalid code - ignored)

Mutation Score: 87.23% (245 killed / 281 valid mutants)
```

## Tool: PITest (Java)

### Maven Configuration

```xml
<plugin>
    <groupId>org.pitest</groupId>
    <artifactId>pitest-maven</artifactId>
    <version>1.15.0</version>
    <dependencies>
        <dependency>
            <groupId>org.pitest</groupId>
            <artifactId>pitest-junit5-plugin</artifactId>
            <version>1.2.0</version>
        </dependency>
    </dependencies>
    <configuration>
        <targetClasses>
            <param>com.myapp.services.*</param>
            <param>com.myapp.domain.*</param>
        </targetClasses>
        <targetTests>
            <param>com.myapp.*Test</param>
        </targetTests>
        <mutators>
            <mutator>STRONGER</mutator>
        </mutators>
        <timestampedReports>false</timestampedReports>
        <outputFormats>
            <format>HTML</format>
            <format>XML</format>
        </outputFormats>
        <!-- Fail build if mutation score is too low -->
        <mutationThreshold>70</mutationThreshold>
        <!-- Performance: limit mutations per class -->
        <maxMutationsPerClass>50</maxMutationsPerClass>
    </configuration>
</plugin>
```

```shell
# Run PITest
mvn pitest:mutationCoverage

# Run with history (incremental)
mvn pitest:mutationCoverage -DwithHistory
```

### PITest Mutator Groups

| Group | Operators | Use Case |
|-------|-----------|----------|
| `OLD_DEFAULTS` | Basic arithmetic, conditionals | Quick check |
| `DEFAULTS` | OLD_DEFAULTS + negation, return values | Standard |
| `STRONGER` | DEFAULTS + more comparison mutations | Thorough |
| `ALL` | Every mutator | Most thorough (slow) |

## Tool: mutmut (Python)

### Setup and Configuration

```shell
install via pip: mutmut

# Configuration in setup.cfg or pyproject.toml
```

```toml
# pyproject.toml
[tool.mutmut]
paths_to_mutate = "src/"
tests_dir = "tests/"
runner = "python -m pytest -x --timeout=10"
dict_synonyms = "Struct, NamedStruct"
```

### Running mutmut

```shell
# Run all mutations
mutmut run

# Run on specific file
mutmut run --paths-to-mutate src/services/calculator.py

# View results
mutmut results

# Show specific surviving mutant
mutmut show 42

# Show all surviving mutants
mutmut results --surviving

# Generate HTML report
mutmut html
```

### mutmut Output

```
--- src/services/calculator.py
+++ src/services/calculator.py (mutant 42)
@@ -15,7 +15,7 @@
 def calculate_discount(order, member):
     if member.tier == 'premium':
-        discount_rate = 0.15
+        discount_rate = 0.16  # <-- This mutant SURVIVED
         return order.total * discount_rate
     return 0

# This means: no test verifies the exact discount rate value
# Fix: add assertion on the specific discount amount
```

## Surviving Mutant Analysis

### Triage Process

When a mutant survives, categorize it:

```
1. MISSING TEST: No test covers this scenario
   -> Write a new test targeting this specific behavior

2. WEAK ASSERTION: Test executes the code but doesn't assert precisely
   -> Strengthen assertions (exact values, not just truthy)

3. EQUIVALENT MUTANT: Mutation produces identical behavior
   -> Document and exclude (cannot be killed)

4. TRIVIAL MUTANT: In logging, comments, or non-critical code
   -> Decide if testing is worth the effort
```

### Example: Analyzing a Surviving Mutant

```python
# Original code
def calculate_shipping(weight, distance):
    if weight <= 0:
        raise ValueError("Weight must be positive")
    base_rate = 5.00
    per_km = 0.10
    per_kg = 0.50
    return base_rate + (distance * per_km) + (weight * per_kg)

# Surviving mutant: changed per_km from 0.10 to 0.11
# This survived because the test only checked:
def test_shipping_basic():
    result = calculate_shipping(2, 100)
    assert result > 0  # Too weak! Just checks it's positive

# Fix: Add precise assertion
def test_shipping_calculation():
    result = calculate_shipping(2, 100)
    # base_rate(5.00) + distance(100 * 0.10) + weight(2 * 0.50) = 16.00
    assert result == pytest.approx(16.00)

# Also add boundary tests
def test_shipping_zero_distance():
    result = calculate_shipping(1, 0)
    assert result == pytest.approx(5.50)  # base + weight only

def test_shipping_heavy_item():
    result = calculate_shipping(50, 10)
    assert result == pytest.approx(31.00)  # 5 + 1 + 25
```

## Equivalent Mutants

Equivalent mutants produce the same behavior as the original code. They cannot be killed by any test because they are functionally identical.

```python
# Example 1: Loop boundary
# Original
for i in range(len(items)):
# Mutant: change < to <=
# But range() already handles this, so behavior is identical

# Example 2: Dead code path
# Original
if x > 0:
    return x
elif x == 0:
    return 0
else:
    return -x
# Mutant in the elif: changing == to >= does nothing because
# if x > 0 is false and x >= 0, then x must be 0

# Strategy: Document equivalent mutants and exclude them
# Stryker: add // Stryker disable next-line all: equivalent mutant
// Stryker disable next-line all: equivalent mutant
const result = items.length > 0 ? items[0] : null;
```

## Test Suite Improvement Workflow

```
1. Run mutation testing on critical modules first
2. Sort surviving mutants by importance:
   - Business logic (high priority)
   - Security/validation (high priority)
   - Data transformation (medium priority)
   - Logging/formatting (low priority)
3. For each important surviving mutant:
   a. Understand what the mutation changed
   b. Determine if it's equivalent (skip if yes)
   c. Write a test that would fail with the mutation
   d. Verify the new test kills the mutant
4. Re-run mutation testing to confirm improvement
5. Set a mutation score threshold for CI
```

## CI Integration

### GitHub Actions

```yaml
name: Mutation Testing
on:
  pull_request:
    paths:
      - 'src/**'
      - 'tests/**'

jobs:
  mutation-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx stryker run --incremental
      - name: Check mutation score
        run: |
          SCORE=$(cat reports/mutation/mutation-report.json | jq '.schemaVersion' -r)
          # Parse and check score from the HTML report or JSON output
      - uses: actions/upload-artifact@v4
        with:
          name: mutation-report
          path: reports/mutation/
```

### Incremental Mutation Testing

For large codebases, only test mutations in changed files:

```shell
# Get changed files from git
CHANGED_FILES=$(git diff --name-only origin/main...HEAD -- 'src/**/*.ts')

# Run Stryker only on changed files
npx stryker run --mutate "$CHANGED_FILES"
```

## Cost-Effectiveness Analysis

### When Mutation Testing is Worth It

```
HIGH VALUE:
- Financial calculation code (pricing, billing, taxes)
- Security-critical code (authentication, authorization)
- Data validation and sanitization
- Core business rules and domain logic
- State machine transitions

MEDIUM VALUE:
- Data transformation and mapping
- API request/response handling
- Configuration parsing

LOW VALUE (often skip):
- UI rendering code
- Logging and monitoring
- Configuration constants
- Generated code
- Simple CRUD operations
```

### Performance Optimization

```
Full mutation run too slow? Use these strategies:

1. Incremental mode: Only test mutations in changed code
2. Limit mutations per class: --maxMutationsPerClass 30
3. Target critical modules: Don't mutate everything
4. Use faster test runners: Parallel test execution
5. Filter mutation operators: Skip noisy operators like StringLiteral
6. Coverage-based filtering: Only mutate code with existing coverage
7. Run as nightly job: Full run overnight, incremental on PRs
```

### Interpreting Mutation Scores

| Score | Interpretation | Action |
|-------|---------------|--------|
| > 80% | Excellent test suite | Maintain, focus on new code |
| 60-80% | Good but gaps exist | Target surviving mutants in critical paths |
| 40-60% | Significant gaps | Major test improvement needed |
| < 40% | Tests provide little bug detection | Fundamental test strategy overhaul |

## When to Use

**Use this skill when:**
- Designing or implementing mutation tester solutions
- Reviewing or improving existing mutation tester approaches
- Making architectural or implementation decisions about mutation tester
- Learning mutation tester patterns and best practices
- Troubleshooting mutation tester-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Mutation Tester Analysis

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

**Input:** "Help me implement mutation tester for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended mutation tester approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When mutation tester must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
