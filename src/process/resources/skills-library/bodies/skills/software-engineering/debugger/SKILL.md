---
name: debugger
description: |
  Systematic debugging methodology using scientific method, binary search isolation, log analysis, stack trace interpretation, and root cause analysis across languages and ecosystems.
  Use when the user asks about debugger, debugger best practices, or needs guidance on debugger implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices debugging guide"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Debugger

You are an expert debugging specialist. Apply systematic, scientific debugging methodology to isolate and fix defects efficiently. Never guess randomly. Every debugging session follows a structured hypothesis-test cycle.

## The Scientific Debugging Method

### Step 1: Reproduce the Bug

A bug you cannot reproduce is a bug you cannot fix with confidence.

1. Get the exact reproduction steps from the reporter.
2. Identify the minimal reproduction case (strip away unrelated steps).
3. Verify the environment: OS, runtime version, configuration, data state.
4. Confirm the expected vs actual behavior in your own words.

**Reproduction Template**:
```
Environment: [OS, runtime, version, config]
Steps:
  1. [action]
  2. [action]
  3. [action]
Expected: [what should happen]
Actual: [what actually happens]
Frequency: [always / intermittent / first-time-only]
```

### Step 2: Formulate a Hypothesis

Based on the symptoms, form a specific, falsifiable hypothesis:

- BAD: "Something is wrong with the database."
- GOOD: "The query in `getUserById` returns null because the ID column is case-sensitive and the input is lowercase."

### Step 3: Design an Experiment

Create a test that will confirm or refute your hypothesis:

- Add a log statement at the suspected failure point.
- Write a unit test that exercises the suspected code path.
- Use a debugger breakpoint to inspect state at the critical moment.
- Modify one variable to see if behavior changes.

### Step 4: Observe Results

Run the experiment. Record the actual outcome. Do not interpret prematurely.

### Step 5: Conclude

- If the hypothesis is confirmed, you have found the root cause. Fix it.
- If the hypothesis is refuted, update your mental model and return to Step 2.
- Record what you learned even from failed hypotheses.

## Binary Search Debugging

When the bug is somewhere in a large codebase or a long sequence of operations, use binary search to narrow it down.

### In Code
1. Identify the start (known-good state) and end (known-bad state).
2. Insert a check/log at the midpoint.
3. If the midpoint is good, the bug is in the second half.
4. If the midpoint is bad, the bug is in the first half.
5. Repeat until you isolate the exact line.

### In Time (git bisect)
```shell
git bisect start
git bisect bad              # current commit is broken
git bisect good abc1234     # this older commit was working
# Git checks out the midpoint. Test it.
git bisect good             # or git bisect bad
# Repeat until the first bad commit is identified.
git bisect reset            # return to original HEAD
```

### In Data
1. Take the input that causes the bug.
2. Split it in half.
3. Test each half independently.
4. The half that triggers the bug contains the problematic data.
5. Repeat until you find the minimal failing input.

## Stack Trace Reading

### Anatomy of a Stack Trace

Read from bottom to top (most languages). The bottom frame is where the exception originated. The top frame is the entry point.

```
Exception in thread "main" java.lang.NullPointerException
    at com.app.service.OrderService.calculateTotal(OrderService.java:45)    <-- CAUSE
    at com.app.controller.OrderController.submit(OrderController.java:112)
    at com.app.filter.AuthFilter.doFilter(AuthFilter.java:30)
    at org.springframework.web.servlet.DispatcherServlet.service(...)       <-- FRAMEWORK
```

**Rules**:
1. Start at the first frame that is YOUR code (skip framework frames).
2. Read the exception message carefully; it often tells you the exact variable that is null/missing.
3. Note the line number and open that exact line.
4. Check what is on that line that could produce the stated exception.

### Multi-Cause Stack Traces (Caused by)
```
Exception: Failed to process order
    at OrderService.process(OrderService.java:50)
Caused by: java.sql.SQLException: Connection refused
    at com.mysql.jdbc.Driver.connect(Driver.java:200)        <-- ROOT CAUSE
```
Always read the deepest "Caused by" first. That is the root cause.

### Async/Promise Stack Traces

Async stack traces are often incomplete. Use these strategies:
- Enable long stack traces in Node.js: `--async-stack-traces`
- In Python, use `traceback` module with `__cause__`
- In JavaScript, use `Error.captureStackTrace` or named async functions

## Common Bug Patterns by Language

### JavaScript/TypeScript
| Pattern | Symptom | Fix |
|---------|---------|-----|
| Implicit type coercion | `"5" + 3 === "53"` | Use `===`, explicit parsing |
| Stale closure | Variable has old value in callback | Use `let` in loops, capture correctly |
| Missing `await` | Function returns Promise instead of value | Add `await` or `.then()` |
| `this` binding lost | `TypeError: Cannot read property of undefined` | Arrow function or `.bind()` |
| Floating point | `0.1 + 0.2 !== 0.3` | Use integer math (cents) or epsilon comparison |

### Python
| Pattern | Symptom | Fix |
|---------|---------|-----|
| Mutable default arg | List grows across calls | Use `None` default, create inside function |
| Late binding closure | All lambdas return same value | Use default argument `lambda x=x: x` |
| Silent exception | Error swallowed, wrong behavior | Remove bare `except:`, use specific types |
| Import cycle | `ImportError` or `AttributeError` | Restructure imports, use late import |
| GIL bottleneck | CPU-bound threads do not speed up | Use `multiprocessing` or `asyncio` |

### Java
| Pattern | Symptom | Fix |
|---------|---------|-----|
| NullPointerException | Most common exception | Use Optional, null checks, `@NonNull` |
| ConcurrentModification | Modifying collection during iteration | Use iterator.remove() or copy |
| Resource leak | Connection/file not closed | try-with-resources |
| Equals/HashCode contract | HashMap lookup fails | Supersede both methods consistently |
| ClassCastException | Wrong generic type at runtime | Check type erasure implications |

### Go
| Pattern | Symptom | Fix |
|---------|---------|-----|
| Nil pointer dereference | `panic: runtime error` | Check nil before dereferencing |
| Goroutine leak | Memory grows indefinitely | Use context cancellation, select with done |
| Data race | Inconsistent state, `-race` flag detects | Use mutex, channels, or atomic operations |
| Error ignored | Silent failure | Always check `if err != nil` |
| Slice aliasing | Modifying a slice modifies original | Use `copy()` for independent slices |

## Debugging Tools by Ecosystem

### JavaScript/Node.js
- `console.log` / `console.table` / `console.trace` for quick inspection
- Chrome DevTools: breakpoints, network tab, performance profiler
- `node --inspect` + Chrome DevTools for server-side
- `ndb` for improved Node.js debugging experience

### Python
- `pdb` / `ipdb`: `import pdb; pdb.set_trace()` or `breakpoint()`
- `python -m pdb script.py` for post-mortem debugging
- `logging` module with DEBUG level for tracing
- `traceback.print_exc()` for exception details

### Java
- IDE debuggers (IntelliJ, Eclipse): conditional breakpoints, watches
- `jstack <pid>` for thread dumps
- `jmap -heap <pid>` for heap analysis
- Remote debugging: `-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005`

### Go
- `dlv` (Delve) debugger: `dlv debug`, `dlv attach <pid>`
- `go run -race` for race condition detection
- `pprof` for CPU/memory profiling
- `GOTRACEBACK=all` for full goroutine dumps

### Rust
- `rust-gdb` or `rust-lldb`
- `dbg!()` macro for quick value inspection
- `RUST_BACKTRACE=1` for stack traces on panic
- `cargo test -- --nocapture` to see test output

## Log Analysis

### Structured Log Querying

When analyzing logs, filter systematically:

```shell
# Find errors in a time window
grep "ERROR" app.log | grep "2024-01-15T14:0[0-5]"

# Extract correlation IDs for a failed request
grep "request_id=abc123" app.log

# Count error types
grep "ERROR" app.log | grep -oP 'type=\K\w+' | sort | uniq -c | sort -rn
```

### Log-Based Debugging Strategy
1. Find the error log entry.
2. Extract the correlation/request ID.
3. Filter all logs for that ID to get the full request timeline.
4. Identify the last successful step before the failure.
5. Focus debugging between the last success and the failure.

## Root Cause Analysis Template

After fixing a bug, document it:

```markdown
## Incident: [Brief description]

### Symptom
What the user/system experienced.

### Root Cause
The actual defect and why it existed.

### Contributing Factors
- What made the bug hard to find?
- What allowed it to reach production?

### Fix
What was changed and why.

### Prevention
- What test was added?
- What process change prevents recurrence?
- What monitoring was added?
```

## Rubber Duck Debugging

When stuck, explain the problem out loud (or in writing) step by step:

1. State the expected behavior clearly.
2. State the actual behavior clearly.
3. Walk through the code path line by line, explaining what each line does.
4. At each step, state what the values of key variables are.
5. The moment you find a discrepancy between your explanation and the code, you have found the bug.

This works because the act of articulating forces you to examine assumptions you otherwise skip.

## Intermittent Bug Strategies

For bugs that do not reproduce consistently:

1. **Increase logging** at the suspected failure point.
2. **Add assertions** that crash loudly if invariants are violated.
3. **Stress test** with high concurrency / volume to increase reproduction rate.
4. **Check for timing dependencies**: race conditions, timeouts, cache expiry.
5. **Check for state dependencies**: order of operations, prior requests, accumulated data.
6. **Check for environment dependencies**: timezone, locale, disk space, DNS resolution.
7. **Use chaos engineering tools** to inject failures systematically.

## Debugging Decision Tree

```
Can you reproduce the bug?
  |
  Yes -> Formulate hypothesis -> Test -> Fix
  |
  No -> Is it intermittent?
         |
         Yes -> Increase logging and monitoring
              -> Add assertions at suspected points
              -> Run stress tests
              -> Wait for next occurrence with better observability
         |
         No (cannot reproduce at all)
              -> Verify environment match with reporter
              -> Check for data-dependent behavior
              -> Review recent deployments
              -> Check for client-specific issues (browser, OS)
```

## When to Use

**Use this skill when:**
- Designing or implementing debugger solutions
- Reviewing or improving existing debugger approaches
- Making architectural or implementation decisions about debugger
- Learning debugger patterns and best practices
- Troubleshooting debugger-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Debugger Analysis

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

**Input:** "Help me implement debugger for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended debugger approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When debugger must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
