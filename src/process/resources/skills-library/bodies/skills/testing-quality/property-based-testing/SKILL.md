---
name: property-based-testing
description: |
  Guides expert-level property-based testing implementation: tdd and automation decision frameworks, production-ready patterns, and concrete templates for property based testing workflows.
  Use when the user asks about property-based testing, property based testing configuration, or testing best practices for property-based projects.
  Do NOT use when the user needs a different testing quality capability -- check sibling skills in the testing quality subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing tdd automation"
  category: "testing-quality"
  subcategory: "testing-quality"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Property Based Testing

## When to Use

**Use this skill when:**
- The user asks how to write property-based tests for functions involving mathematical invariants, data transformations, serialization/deserialization, or stateful systems
- The user wants to replace or supplement example-based unit tests with generative testing that explores the input space automatically
- The user is debugging a property-based test failure and needs help understanding shrinking, seed replay, or generator composition
- The user asks which property-based testing library to use (Hypothesis, fast-check, QuickCheck, ScalaCheck, PropEr, Hedgehog, jqwik, or similar) for their language or ecosystem
- The user wants to write stateful or model-based property tests for APIs, state machines, databases, or distributed systems
- The user needs to configure run counts, shrinking strategies, or deadline settings for CI/CD environments
- The user is integrating property-based testing into an existing test suite alongside pytest, Jest, JUnit, or similar frameworks
- The user wants to test parser correctness, codec round-trips, sorting algorithm stability, or algebraic laws (associativity, commutativity, idempotency)

**Do NOT use this skill when:**
- The user needs mutation testing guidance -- use the mutation-testing skill instead
- The user needs fuzzing for security vulnerability discovery (AFL, libFuzzer) -- property-based testing and security fuzzing share concepts but have different toolchains and goals
- The user is asking about snapshot testing, visual regression, or contract testing -- those are distinct practices with their own skills
- The user needs performance/load testing instrumentation
- The user wants to write standard example-based unit tests and has not mentioned generative or property-based approaches
- The user is asking about formal verification or proof assistants (Coq, Lean, Isabelle) -- mathematical proof is distinct from property-based testing even though both express invariants
- The user needs end-to-end or integration test infrastructure design without a generative component

---

## Process

### Step 1: Identify the Domain and Properties Worth Testing

Before writing a single line of test code, identify what properties actually hold for the system under test.

- **Mathematical/algebraic laws** -- commutativity (`f(a,b) == f(b,a)`), associativity (`f(f(a,b),c) == f(a,f(b,c))`), idempotency (`f(f(x)) == f(x)`), identity elements, invertibility. These apply to sorting, hashing, set operations, arithmetic wrappers, and data normalizers.
- **Round-trip properties** -- serialize then deserialize should recover the original value. This is the single highest-ROI property test in any codebase with data persistence, APIs, or message queues.
- **Metamorphic relations** -- when you cannot write an oracle that directly verifies the output, you can still assert relationships between outputs given related inputs. Example: `sort(concat(A, B))` should equal `sort(concat(B, A))`. Another: adding a duplicate element to a set should not change its cardinality.
- **Model-based (oracle) properties** -- implement a reference model (slow but obviously correct) and assert your optimized implementation agrees with it on all generated inputs.
- **Invariants under mutation** -- after any valid state transition, a set of invariants must still hold. Used in stateful testing of queues, caches, CRDT structures, and database ORMs.
- **Precondition/postcondition contracts** -- given an input satisfying preconditions P, the output must satisfy postconditions Q. The generator produces inputs satisfying P; assertions verify Q.
- Avoid testing properties that are trivially enforced by the type system or that merely restate the implementation. The question is: what behavior could be wrong that a type checker cannot catch?

### Step 2: Select the Right Library for the Ecosystem

Choose based on language ecosystem, shrinking model, and stateful testing support.

- **Python** -- Hypothesis is the dominant choice. It uses internal state (not seeds exposed to users by default), has the best automatic shrinking of any mainstream library, integrates with pytest natively, and supports stateful testing via `RuleBasedStateMachine`. Use `@given` with `st.` strategies. Pin the Hypothesis version in requirements because its database of previously-found examples persists between runs.
- **JavaScript/TypeScript** -- fast-check is the production standard. It uses a pure functional approach, supports `fc.assert(fc.property(...))`, provides `fc.record`, `fc.object`, `fc.oneof`, and stateful testing via `fc.commands`. Avoid `jsverify` (unmaintained). In Jest, wrap `fc.assert` inside `test()`.
- **Haskell** -- QuickCheck is the original (1999). Hedgehog is the modern alternative with integrated shrinking (shrinks the generator, not the value -- avoids invalid shrunk values). Use Hedgehog for new projects.
- **Scala** -- ScalaCheck integrates with ScalaTest and MUnit. Use `Gen.sized` for recursive structures to avoid stack overflow during generation.
- **Erlang/Elixir** -- PropEr or StreamData (Elixir). StreamData integrates with ExUnit via `check all`.
- **Java** -- jqwik runs on JUnit 5. Use `@Property` and `@ForAll`. Supports stateful testing via `@StatefulProperty`.
- **Rust** -- proptest is the standard. Uses value trees for shrinking. quickcheck is simpler but has weaker shrinking.
- **Go** -- rapid (uses integrated shrinking like Hedgehog) or gopter. The standard library's `testing/quick` is too limited for production use.
- **C#/.NET** -- FsCheck (F# first but usable from C#). CsCheck is a newer alternative with better performance.

### Step 3: Design Generators for Your Domain

Generator design is the hardest and most important part of property-based testing.

- **Start with library primitives** -- integers with bounds (`st.integers(min_value=0, max_value=2**31-1)`), text with alphabets, floats with `allow_nan=False` when NaN would cause spurious failures, booleans, UUIDs.
- **Compose generators for domain types** -- build `@st.composite` strategies (Hypothesis) or `fc.record` (fast-check) that produce valid domain objects. A `User` strategy should produce structurally valid users, not arbitrary dictionaries.
- **Use `.filter()` sparingly** -- filtering (`.filter(lambda x: x > 0)`) rejects generated values and can cause `Unsatisfiable` errors or slow generation if fewer than 10% of values pass. Prefer constructive generation (generate positive integers directly with `st.integers(min_value=1)`) over filtering.
- **Control size and depth for recursive structures** -- recursive generators must respect a size budget. In Hypothesis use `st.recursive(base, extend, max_leaves=50)`. In proptest use `prop::collection::vec` with size ranges. Unbounded recursion will exhaust memory.
- **Represent realistic distributions** -- if real users submit strings up to 256 characters, use `st.text(max_size=256)`. If 90% of production integers are small, use `st.integers(0, 1000) | st.integers(0, 10**9)` with weighted sampling. Uniform distributions over all integers miss the realistic distribution of your production data.
- **Mark edge case values explicitly** -- always include known-problematic values: empty string, empty list, zero, -1, `INT_MIN`, `INT_MAX`, `NaN`, `Infinity`, empty dict, single-element collections. In Hypothesis use `st.just(value)` combined with `st.one_of`. In fast-check use `fc.constantFrom`.
- **Avoid state leakage in generators** -- each generated value must be independent. Never use a global counter or shared mutable state in a generator function.

### Step 4: Write the Property Assertions

A property test has three parts: generate input, run the system under test, assert the property.

- **Write the assertion as a universally quantified statement** -- read it aloud as "For all X satisfying [generator constraints], [assertion] must hold." If you cannot complete that sentence, you do not have a property yet.
- **Avoid asserting exact output values** -- `assert result == 42` is an example test, not a property. `assert len(result) == len(input)` or `assert result == decode(encode(result))` are properties.
- **Use multiple weak assertions over one strong assertion** -- three simple invariants are easier to debug than one complex predicate. When a test fails, you want the shrunk example to pinpoint which invariant broke.
- **Test error behavior as a property** -- "For all inputs where X > 1000, the function raises ValueError" is a valid property. Generate invalid inputs intentionally and assert the contract of error handling.
- **Avoid external I/O in the property body unless testing I/O** -- network calls, file I/O, and database connections inside `@given` bodies interact badly with shrinking. Use `unittest.mock` or dependency injection to isolate.
- **For stateful tests, define valid state transitions and assertions** -- in Hypothesis `RuleBasedStateMachine`, each `@rule` method is a transition; each `@invariant` method is checked after every transition. Model the expected state alongside the system under test and compare.

### Step 5: Configure Runs, Deadlines, and Shrinking

Default settings are designed for interactive development, not CI. Tune them.

- **Hypothesis settings** -- the default is 100 examples. For CI use `@settings(max_examples=500)` on critical paths. Use `suppress_health_check=[HealthCheck.too_slow]` only when you understand why generation is slow. Set `deadline=timedelta(milliseconds=500)` explicitly -- the default deadline detects slow tests but can produce false failures under load. Set `deriving_from_module=True` to pick up module-level `@settings`.
- **Hypothesis database** -- Hypothesis saves failing examples in `.hypothesis/examples/`. Commit this directory to version control so CI replays previously-found failures. Do not add it to `.gitignore`.
- **fast-check settings** -- `fc.assert(property, { numRuns: 1000, seed: 42 })`. For CI use a fixed seed only for reproducing failures; for discovery use `Date.now()` as seed to explore different inputs each run. Use `endOnFailure: true` to stop after first failure in CI.
- **proptest (Rust)** -- configure `ProptestConfig { cases: 1000, max_shrink_iters: 10_000, .. Default::default() }`. Increase `max_shrink_iters` for complex structures where shrinking needs more iterations to find a minimal example.
- **Run count thresholds** -- 100 examples catches trivial bugs. 500-1000 catches most bugs given good generator coverage. 10,000+ is warranted for cryptographic or financial invariants. Do not use more than 10,000 in standard CI -- use a nightly job instead.
- **Parallelism** -- Hypothesis and fast-check are not designed for parallel execution within a single test. Run tests in parallel across test files (pytest-xdist with `-n auto`), not within a single `@given` call.

### Step 6: Understand and Debug Shrinking

Shrinking is what makes property-based testing actionable. A 1,000-element list that triggers a bug becomes a 2-element list after shrinking.

- **Read the shrunk example carefully** -- the library reports the minimal counterexample. This is the smallest input that still triggers the failure. Treat it as the specification of the bug, not just a test artifact.
- **Distinguish between shrinking failure and real failure** -- if the shrunk example looks nonsensical (e.g., `x = -9223372036854775808`), your property may be incorrectly written. Check whether your preconditions are actually enforced by the generator.
- **Replay a specific failing case** -- Hypothesis: `@given(st.integers()) @settings(deriving_from=...) def test_foo(x): assume(x == -1)` -- or use the `@reproduce_failure` decorator with the printed base64 payload. fast-check: pass `{ seed: N, path: "..." }` from the failure output. proptest: set `PROPTEST_REGRESSIONS=true` and the library writes a regression file.
- **Integrated shrinking vs. value shrinking** -- QuickCheck-style libraries shrink the generated value after the fact, which can produce invalid values that skip your generators' constraints. Hedgehog, proptest, and Hypothesis (since v4) use integrated shrinking that shrinks the random decisions, guaranteeing the shrunk value always satisfies the generator's constraints.
- **When shrinking is slow** -- complex generators with deep structures can take minutes to shrink. Set a `max_shrink_time` (Hypothesis: `@settings(max_shrink_time=30)` in seconds) to bound the time. Accept a non-minimal counterexample rather than blocking CI.

### Step 7: Integrate with CI/CD and the Test Suite

Property-based tests belong in CI but need special handling.

- **Separate fast and slow property tests** -- mark tests that run 100 examples as standard (run on every commit). Mark tests that run 5,000+ examples as `@pytest.mark.slow` or in a separate `property_tests_extended` suite that runs nightly.
- **Treat flaky property tests as bugs** -- a property test that sometimes passes and sometimes fails is reporting a real bug or a poorly-written property. Do not retry. Investigate the failing seed immediately.
- **Commit the Hypothesis example database** -- `.hypothesis/examples/` must be committed so CI does not re-discover bugs that were already found and fixed. Without this, fixed bugs can reappear in CI because the failure-triggering example was not preserved.
- **Set reproducible seeds for nightly runs** -- use a date-based seed (`seed = int(datetime.date.today().strftime('%Y%m%d'))`) so nightly runs are reproducible within the same day but explore new space over time.
- **Report coverage alongside properties** -- use `hypothesis.extra.cobertura` or run coverage.py over property tests. Coverage from generated inputs is typically higher than hand-written examples, but gaps in coverage reveal generator blind spots.
- **Fail fast on health check violations** -- do not suppress `HealthCheck.filter_too_much` indefinitely. It means your `.filter()` is rejecting more than 90% of inputs, which dramatically reduces test effectiveness. Fix the generator instead.

### Step 8: Apply Stateful (Model-Based) Testing for Complex Systems

Stateful testing is the most powerful and most underused form of property-based testing.

- **Define a model** -- the model is a simple, obviously-correct reference implementation. A Python dict can model a key-value store. A sorted list can model a priority queue. The model does not need to be efficient, only obviously correct.
- **Define commands (transitions)** -- each command represents one operation users can perform. For a cache: `Put(key, value)`, `Get(key)`, `Delete(key)`, `Clear()`. In Hypothesis `RuleBasedStateMachine`, each `@rule` is a command. In fast-check, implement `fc.Command`.
- **Generate command sequences** -- the library generates sequences of commands, applies them to both the system under test and the model, and asserts equivalence after each step. This tests emergent behavior from operation sequences that no hand-written test would cover.
- **Assert invariants after every transition** -- in Hypothesis use `@invariant()` to declare checks that run after every `@rule`. Example: `assert len(self.cache) <= self.capacity` after every operation on a bounded cache.
- **Use initialization rules** -- in `RuleBasedStateMachine`, use `@initialize` for rules that run exactly once to set up preconditions. This prevents invalid starting states.
- **Target specific paths** -- use `hypothesis.target(score)` to steer the search toward high-complexity states. Provide a score based on depth, operation count, or cache fill level to guide the engine toward the states most likely to expose bugs.

---

## Output Format

When responding to a property-based testing request, structure the output as follows:

```
## Property-Based Testing Plan: [System Under Test]

### Identified Properties
| Property Type        | Description                                 | Priority |
|----------------------|---------------------------------------------|----------|
| Round-trip           | encode(decode(x)) == x                      | High     |
| Algebraic invariant  | sort(sort(x)) == sort(x)  (idempotency)     | High     |
| Metamorphic          | result(A+B) relates to result(A), result(B) | Medium   |
| Model-based oracle   | optimized_fn(x) == reference_fn(x)          | High     |
| Error contract       | invalid_input raises SpecificError          | Medium   |

### Library Selection
- **Language/Ecosystem:** [e.g., Python 3.11 / pytest]
- **Chosen Library:** [e.g., Hypothesis 6.x]
- **Rationale:** [e.g., best shrinking, pytest integration, stateful support]

### Generator Design
```python
# Example generator code for the domain type
@st.composite
def valid_orders(draw):
    quantity = draw(st.integers(min_value=1, max_value=10_000))
    price = draw(st.decimals(min_value="0.01", max_value="9999.99",
                             places=2, allow_nan=False))
    side = draw(st.sampled_from(["BUY", "SELL"]))
    return Order(quantity=quantity, price=price, side=side)
```

### Property Tests
```python
# One block per identified property
@given(valid_orders())
@settings(max_examples=500, deadline=timedelta(milliseconds=200))
def test_[property_name](order):
    # Arrange
    # Act
    result = system_under_test(order)
    # Assert property
    assert [invariant holds]
```

### CI Configuration
- **Standard suite:** max_examples=500, deadline=500ms, runs on every PR
- **Extended suite:** max_examples=5000, runs nightly
- **Database:** .hypothesis/examples/ committed to version control
- **Seed strategy:** [fixed for replay / date-based for nightly]

### Stateful Test Plan (if applicable)
- **Model:** [description of reference model]
- **Commands:** [list of state transitions]
- **Invariants:** [list of always-true assertions]

### Known Limitations and Risks
- [Generator may not cover distribution X -- mitigation]
- [Shrinking may be slow for type Y -- mitigation]
```

---

## Rules

1. **Never write a property that just re-implements the function.** `assert my_sort(xs) == my_sort(xs)` always passes and tests nothing. A property must assert a relationship, not re-derive the output.

2. **Never use `.filter()` if rejection rate exceeds 10%.** Filtering more than 90% of generated values effectively reduces your 500-example test to 50 examples and triggers `HealthCheck.filter_too_much`. Use constructive generators that produce valid values directly.

3. **Always commit the Hypothesis example database (`.hypothesis/examples/`).** Without it, CI will re-discover already-fixed bugs whenever the relevant code path is touched. It is a regression test suite generated by the engine.

4. **Never call `assume()` inside a loop or deeply nested condition.** `assume(condition)` discards the current example when the condition is false. Excessive use causes `Unsatisfied` errors. Reserve `assume()` for top-level preconditions that cannot be handled constructively.

5. **Always set an explicit `deadline` in `@settings` for CI.** The default deadline in Hypothesis is 200ms (as of v6). If your function sometimes takes 300ms due to JIT warmup or GC pressure, you will get intermittent failures unrelated to correctness. Set `deadline=timedelta(milliseconds=2000)` for functions with variable latency, or `deadline=None` only after documenting why.

6. **Never test properties that depend on specific generated values without using `hypothesis.note()` to log them.** When a property fails intermittently and you cannot reproduce it, you have lost the counterexample. Use `note(f"Generated order: {order}")` so failure output includes the value even if shrinking fails.

7. **Always test both the happy path and the error contract.** Property-based testing excels at finding inputs that cause unexpected exceptions. Write separate properties for "valid inputs produce valid outputs" and "invalid inputs raise the documented exception type, not an internal implementation error."

8. **Never generate floats without specifying `allow_nan=False` and `allow_infinity=False` unless NaN/Infinity are valid domain values.** Default float generation includes NaN, which propagates through most arithmetic silently and causes properties to fail with confusing comparisons like `NaN != NaN`.

9. **Always use domain-specific generators, not raw primitives, for business logic tests.** Testing a payment processor with `st.text()` for currency codes will generate "💰", "\x00", and 10,000-character strings. This wastes test budget on inputs the system will reject at the boundary layer. Define `st.sampled_from(["USD", "EUR", "GBP", "JPY"])` for realistic coverage.

10. **Never interpret a passing property test as a correctness proof.** Property tests are probabilistic -- they check a finite sample of the infinite input space. A passing test at 1,000 examples provides confidence, not certainty. Document the limitations: what distributions were not covered, what edge cases were excluded, and where example-based tests fill the remaining gaps.

---

## Edge Cases

### Floating-Point Arithmetic Properties
Floating-point arithmetic is not associative or exactly commutative in IEEE 754. `(a + b) + c != a + (b + c)` for many double values. Do not write a commutativity property for floating-point addition and expect it to pass exactly. Instead: assert commutativity within an epsilon (`abs(f(a,b) - f(b,a)) < 1e-10`), or use `math.isclose(result, expected, rel_tol=1e-9)`. For financial calculations, use `decimal.Decimal` instead of `float` and then exact equality assertions are valid again. When generating floats for properties, use `st.floats(allow_nan=False, allow_infinity=False, min_value=-1e15, max_value=1e15)` to stay in a sane range.

### Stateful Tests with External Dependencies
When the system under test interacts with a database, message broker, or external API, stateful property tests must manage setup and teardown per command sequence. In Hypothesis `RuleBasedStateMachine`, override `teardown()` to roll back transactions or clear test tables. Use a dedicated test schema or database that is truncated before each test class run. Never share state between parallel test workers -- use per-worker database schemas (e.g., `test_db_worker_0`, `test_db_worker_1`). If teardown fails, the next run starts with corrupted state and produces misleading failures.

### Very Large or Recursive Input Structures
Generating deeply nested or very large structures (trees, graphs, nested JSON) can cause stack overflows during generation or assertion. In Hypothesis, `st.recursive` uses a `max_leaves` parameter -- set it to 50-100 for trees. In proptest, use `prop::collection::vec(any::<T>(), 0..100)` and avoid unbounded recursion in `Arbitrary` implementations. When shrinking deeply nested structures, the shrinker may take minutes. Set `max_shrink_time=60` (Hypothesis) to bound this. When the shrunk counterexample is still large, log the structure with `note()` and add a targeted example test to pin the specific regression.

### Concurrency and Race Conditions
Property-based testing can find concurrency bugs but requires specialized setup. Hypothesis does not generate interleaved thread schedules natively. For concurrency testing in Python, generate sequences of operations and apply them in threads, then assert invariants on the shared state after all threads complete. For Erlang/Elixir with PropEr, use `proper_statem` with parallel command sequences -- PropEr specifically supports interleaved execution and shrinks failing interleavings. In Java, jqwik supports parallel property execution. Do not run property tests themselves in parallel via pytest-xdist within a single test file when the tests share any mutable state.

### Schema Evolution and Backward Compatibility
When testing serialization with property-based tests, the round-trip property `decode(encode(x)) == x` verifies current-version correctness but does not test backward compatibility. Add a separate property: generate a value using the old schema generator, serialize it with the old format, and assert that the new decoder can still read it. This requires versioned generators. In Hypothesis, maintain a module of historical generators tagged by version. Run these generators against the current decoder to catch backward-compatibility regressions during schema migrations.

### Hypothesis Health Check Failures in CI
If CI reports `HealthCheck.too_slow` or `HealthCheck.large_base_example`, do not simply suppress the health check. `too_slow` means your generator takes more than 200ms per example -- profile the generator and remove expensive operations like network calls or complex computations from the generator itself. `large_base_example` means your generated data is very large (>10KB per example) -- reduce generator size bounds. `filter_too_much` means your `.filter()` rejects >90% of values -- redesign the generator to construct valid values directly. Suppressing health checks with `suppress_health_check=[HealthCheck.all()]` masks problems that reduce test effectiveness.

### Properties That Are Hard to Assert (Metamorphic Testing)
Some functions have no simple oracle. A routing algorithm, a machine learning model inference function, or a complex search query has no simple "correct answer" to compare against. Use metamorphic relations: properties about how the output changes when the input changes in a known way. For a routing algorithm: adding a road can only decrease or maintain travel time between two points, never increase it (monotonicity). For a search ranker: a document matching 3 query terms should rank above a document matching 1 term, all else equal. These relations test correctness without requiring a ground truth. Design three to five metamorphic relations before concluding that a function "cannot be property tested."

### Integration with Type Systems and Phantom Types
In Rust with proptest, implement `Arbitrary` for new types rather than generating raw primitives and constructing the type outside the `Arbitrary` impl. This ensures the generator always produces values that satisfy type invariants. In Haskell, use `newtype` wrappers with custom `Arbitrary` instances to prevent generators from leaking through the type system. In TypeScript with fast-check, use `fc.record` with explicit field generators rather than `fc.object()` which generates arbitrary key/value shapes that will not satisfy your domain type's constraints.

---

## Example

**Input:** "We have a Python service that encodes/decodes user profile objects to a compact binary format using a custom codec. We're getting occasional production bugs where decoded profiles have corrupted optional fields. We want to use property-based testing to find these bugs. We use pytest and Python 3.11."

**Output:**

## Property-Based Testing Plan: User Profile Codec

### Identified Properties

| Property Type        | Description                                                               | Priority |
|----------------------|---------------------------------------------------------------------------|----------|
| Round-trip (core)    | `decode(encode(profile)) == profile` for all valid profiles              | Critical |
| Partial round-trip   | `decode(encode(profile)).required_fields == profile.required_fields`     | High     |
| None preservation    | Optional fields that are None encode and decode back to None             | High     |
| Encode determinism   | `encode(profile) == encode(profile)` (same input, same bytes)            | Medium   |
| Decode robustness    | Truncated or bit-flipped bytes raise `CodecError`, not arbitrary exceptions | Medium |
| Size bound           | `len(encode(profile)) <= MAX_ENCODED_SIZE` for all valid profiles        | Medium   |

### Library Selection
- **Language/Ecosystem:** Python 3.11 / pytest
- **Chosen Library:** Hypothesis 6.x
- **Rationale:** Best automatic shrinking of any Python testing library, native pytest integration via `@given`, supports stateful testing if needed for future codec versioning tests, and the example database will retain any failing profiles found so CI always replays them.

### Generator Design

```python
# tests/strategies.py
from hypothesis import strategies as st
from hypothesis import assume
import string
from myapp.models import UserProfile, Address, ContactInfo

# Realistic text fields -- printable ASCII, bounded to production max lengths
printable_text = st.text(
    alphabet=string.printable,
    min_size=0,
    max_size=256
)

# Username: 3-64 chars, alphanumeric + underscore, never empty
username_strategy = st.text(
    alphabet=string.ascii_letters + string.digits + "_",
    min_size=3,
    max_size=64
)

# Age: valid range only -- the codec encodes as uint8
age_strategy = st.integers(min_value=0, max_value=150)

# Optional string: either None or a bounded printable string
optional_text = st.one_of(st.none(), printable_text)

@st.composite
def valid_addresses(draw):
    return Address(
        street=draw(printable_text),
        city=draw(printable_text),
        country_code=draw(st.sampled_from(["US", "GB", "DE", "FR", "JP", "AU"])),
        postal_code=draw(optional_text),
    )

@st.composite
def valid_contact_info(draw):
    # At least one contact method must be present -- constructive, not filtered
    has_email = draw(st.booleans())
    has_phone = draw(st.booleans())
    # Ensure at least one is set
    if not has_email and not has_phone:
        has_email = True
    return ContactInfo(
        email=draw(st.emails()) if has_email else None,
        phone=draw(optional_text) if has_phone else None,
    )

@st.composite
def valid_user_profiles(draw):
    return UserProfile(
        user_id=draw(st.uuids()),
        username=draw(username_strategy),
        age=draw(age_strategy),
        bio=draw(optional_text),           # Optional -- this is where bugs appear
        avatar_url=draw(optional_text),    # Optional
        address=draw(st.one_of(st.none(), valid_addresses())),  # Optional
        contact=draw(valid_contact_info()),
        tags=draw(st.lists(
            st.text(alphabet=string.ascii_lowercase, min_size=1, max_size=32),
            min_size=0,
            max_size=20,
            unique=True
        )),
        is_verified=draw(st.booleans()),
        score=draw(st.floats(
            min_value=0.0,
            max_value=100.0,
            allow_nan=False,
            allow_infinity=False
        )),
    )
```

### Property Tests

```python
# tests/test_codec_properties.py
from datetime import timedelta
from hypothesis import given, settings, note, HealthCheck
from hypothesis import strategies as st
import pytest

from myapp.codec import encode, decode, CodecError, MAX_ENCODED_SIZE
from tests.strategies import valid_user_profiles

# ---------------------------------------------------------------
# Property 1: Core round-trip
# This is the most critical test. ANY failure here is a production bug.
# ---------------------------------------------------------------
@given(valid_user_profiles())
@settings(
    max_examples=1000,
    deadline=timedelta(milliseconds=500),
    suppress_health_check=[HealthCheck.too_slow],  # Remove after profiling codec
)
def test_codec_round_trip(profile):
    note(f"Testing profile: user_id={profile.user_id}, "
         f"bio={'<present>' if profile.bio else None}, "
         f"avatar={'<present>' if profile.avatar_url else None}")
    encoded = encode(profile)
    decoded = decode(encoded)
    assert decoded == profile, (
        f"Round-trip failed.\n"
        f"Original bio: {profile.bio!r}\n"
        f"Decoded bio:  {decoded.bio!r}\n"
        f"Original avatar: {profile.avatar_url!r}\n"
        f"Decoded avatar:  {decoded.avatar_url!r}"
    )

# ---------------------------------------------------------------
# Property 2: Optional fields that are None must survive the round-trip
# Targeted at the known bug class: optional field corruption
# ---------------------------------------------------------------
@given(valid_user_profiles())
@settings(max_examples=500, deadline=timedelta(milliseconds=500))
def test_none_optional_fields_preserved(profile):
    encoded = encode(profile)
    decoded = decode(encoded)
    if profile.bio is None:
        assert decoded.bio is None, (
            f"bio was None before encoding but {decoded.bio!r} after decoding"
        )
    if profile.avatar_url is None:
        assert decoded.avatar_url is None, (
            f"avatar_url was None before encoding but {decoded.avatar_url!r} after decoding"
        )
    if profile.address is None:
        assert decoded.address is None, (
            f"address was None before encoding but got {decoded.address!r} after decoding"
        )

# ---------------------------------------------------------------
# Property 3: Encode is deterministic
# Failing this means encoding depends on memory address, object id, or dict ordering
# ---------------------------------------------------------------
@given(valid_user_profiles())
@settings(max_examples=200, deadline=timedelta(milliseconds=500))
def test_encode_is_deterministic(profile):
    first = encode(profile)
    second = encode(profile)
    assert first == second, "encode() produced different bytes for the same input"

# ---------------------------------------------------------------
# Property 4: Encoded size is bounded
# ---------------------------------------------------------------
@given(valid_user_profiles())
@settings(max_examples=500, deadline=timedelta(milliseconds=500))
def test_encoded_size_within_bounds(profile):
    encoded = encode(profile)
    assert len(encoded) <= MAX_ENCODED_SIZE, (
        f"Encoded size {len(encoded)} exceeds MAX_ENCODED_SIZE={MAX_ENCODED_SIZE}. "
        f"Profile has {len(profile.tags)} tags, "
        f"bio length={len(profile.bio) if profile.bio else 0}"
    )

# ---------------------------------------------------------------
# Property 5: Corrupted bytes raise CodecError, not internal exceptions
# Metamorphic: perturbation of valid encoded bytes should fail gracefully
# ---------------------------------------------------------------
@given(
    valid_user_profiles(),
    st.integers(min_value=0, max_value=99).map(lambda pct: pct / 100.0),
    st.binary(min_size=0, max_size=10),
)
@settings(max_examples=300, deadline=timedelta(milliseconds=1000))
def test_corrupted_bytes_raise_codec_error(profile, truncation_fraction, junk_suffix):
    encoded = encode(profile)
    if len(encoded) == 0:
        return  # Nothing to corrupt

    # Truncate the encoded bytes
    truncated_length = max(0, int(len(encoded) * (1 - truncation_fraction)))
    corrupted = encoded[:truncated_length] + junk_suffix

    if corrupted == encoded:
        return  # No corruption happened, skip

    try:
        decode(corrupted)
        # Decoding corrupted bytes without raising means either:
        # (a) the corruption accidentally produced valid bytes (unlikely but OK), or
        # (b) the codec is not validating inputs (a bug).
        # We accept this case but do not assert anything about the decoded value.
    except CodecError:
        pass  # Expected: corrupted bytes raise CodecError
    except Exception as e:
        raise AssertionError(
            f"Corrupted bytes raised {type(e).__name__} instead of CodecError: {e}"
        ) from e
```

### CI Configuration

```ini
# pytest.ini
[pytest]
markers =
    slow: marks tests as slow (extended property runs, run nightly)

# Standard runs (every PR): max_examples=500, ~30 seconds for codec tests
# Extended runs (nightly): max_examples=5000, full coverage sweep
```

```python
# conftest.py
from hypothesis import settings, HealthCheck
from datetime import timedelta

# Profile for standard CI -- every PR
settings.register_profile(
    "ci",
    max_examples=500,
    deadline=timedelta(milliseconds=500),
    suppress_health_check=[],
)

# Profile for nightly extended runs
settings.register_profile(
    "nightly",
    max_examples=5000,
    deadline=timedelta(milliseconds=2000),
    suppress_health_check=[],
)

# Profile for local dev -- fast feedback
settings.register_profile(
    "dev",
    max_examples=100,
    deadline=timedelta(milliseconds=1000),
)

settings.load_profile("ci")  # Default -- override with HYPOTHESIS_PROFILE=nightly
```

```
# .gitignore -- DO NOT add .hypothesis to this file
# The .hypothesis/examples/ directory must be committed to preserve
# discovered counterexamples as regression tests.
```

### Stateful Test Plan (future -- codec versioning)

When the codec introduces a v2 format, add a stateful test that:
- **Model:** Python dict mapping user_id (UUID) to UserProfile
- **Commands:** `WriteV1(profile)`, `WriteV2(profile)`, `Read(user_id)`, `Migrate(user_id)`
- **Invariant after every command:** `Read(user_id)` returns the last-written profile regardless of which version wrote it

### Expected Bug Discovery

Given the symptom of "optional fields occasionally corrupted," Hypothesis will find the minimal profile that triggers the bug within 200-500 examples. The shrunk counterexample will likely be a profile where exactly one optional field (`bio`, `avatar_url`, or `address`) is non-None and all others are None -- this is the smallest case that isolates the corruption. The `test_none_optional_fields_preserved` property is designed specifically to trigger this class of bug by generating profiles with all combinations of None/non-None optional fields.

### Known Limitations and Risks

- The `username_strategy` does not generate Unicode usernames. If the codec handles Unicode usernames and the bug is Unicode-related, extend the alphabet to `st.text(alphabet=st.characters(whitelist_categories=['L', 'N']), min_size=3, max_size=64)`.
- The `st.emails()` strategy generates RFC 5321-compliant email addresses, which may include formats your validator rejects. If `CodecError` is raised during encoding of rejected emails, add `.filter(lambda e: your_validator(e))` -- but monitor filter rejection rate.
- The corrupted-bytes test accepts cases where corrupted bytes decode successfully without raising. Add a stricter variant that computes a checksum and verifies that any corruption detectable by the checksum always raises `CodecError`.
