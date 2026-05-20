---
name: python-idioms
description: |
  Teaches expert-level Python idiomatic patterns: comprehensions, generators, dataclasses, protocols, structural pattern matching, and context managers. Focuses on writing Pythonic code that leverages the language strengths rather than translating patterns from other languages.
  Use when the user asks about Pythonic patterns, list comprehensions, generators, dataclasses vs named tuples, protocols, pattern matching, context managers, or idiomatic Python code style.
  Do NOT use when the user asks about project setup (use `python-project-setup`), testing (use `python-testing-patterns`), async programming (use `python-async-patterns`), or type system features (use `python-type-system`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "python best-practices clean-code"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Python Idioms

## When to Use

**Use this skill when:**
- User asks how to write more "Pythonic" code or wants a code review focused on idiomatic style
- User is translating patterns from Java, C++, or JavaScript and the result feels wrong in Python (e.g., explicit index loops, abstract base class hierarchies for everything, factory class patterns)
- User asks specifically about comprehensions, generator expressions, or lazy evaluation
- User is choosing between `@dataclass`, `NamedTuple`, `TypedDict`, or plain dicts for a data container
- User wants to define a structural interface using `Protocol` instead of inheritance
- User asks about `match`/`case` structural pattern matching (Python 3.10+)
- User wants to write or understand context managers, `contextlib` utilities, or the `with` statement
- User asks about EAFP vs LBYL, `collections.defaultdict`, `itertools`, or `functools` patterns
- User asks about the walrus operator (`:=`), starred assignment, or other syntactic features
- User wants to understand when to use `__slots__`, `__repr__`, `__eq__`, or other dunder methods idiomatically

**Do NOT use this skill when:**
- User wants to create a new Python project with packaging, virtual environments, or pyproject.toml -- use `python-project-setup`
- User is asking about pytest fixtures, test doubles, or test organization -- use `python-testing-patterns`
- User wants `asyncio`, `async`/`await`, `TaskGroup`, or concurrent programming -- use `python-async-patterns`
- User is asking about Pydantic, marshmallow, attrs, or runtime data validation with serialization -- use `python-data-modeling`
- User wants advanced type system features like `TypeVar`, `ParamSpec`, `Concatenate`, `TypeGuard`, or variance -- use `python-type-system`
- User wants error handling architecture (custom exception hierarchies, error domains, retry patterns) -- use `python-error-handling`
- User wants profiling, caching, or algorithmic performance optimization -- use `python-performance`
- User is asking about Python packaging, distributions, or dependency management -- use `python-project-setup`

---

## Process

### 1. Identify the Pattern Category

Classify the user's request into one or more of these pattern domains. Each has a distinct decision framework:

- **Collection transformation:** comprehensions, generator expressions, `itertools`, `functools.reduce`
- **Data containers:** `@dataclass`, `NamedTuple`, `TypedDict`, `enum`, and when to use each
- **Structural interfaces:** `Protocol`, duck typing, structural subtyping vs. inheritance
- **Complex branching:** `match`/`case` structural pattern matching
- **Resource management:** context managers, `contextlib`, `__enter__`/`__exit__`
- **Attribute and key access:** EAFP, `dict.get`, `getattr`, `collections.defaultdict`, `operator.attrgetter`
- **Iteration control:** `itertools`, `enumerate`, `zip`, `zip_strict`, `chain`, `islice`
- **Callable patterns:** `functools.partial`, `functools.cache`, `functools.wraps`, closures

Ask yourself: is the user trying to produce data, shape data, define contracts, branch on structure, manage a lifecycle, or consume data? The answer determines which section of this skill to apply.

### 2. Apply the Right Comprehension or Generator Pattern

Comprehensions are for pure transformations without side effects. The moment a loop body has a side effect (logging, mutating external state, I/O), use a `for` loop instead.

- **List comprehension** -- use when the full result is needed immediately and fits in memory. Rule of thumb: < 10,000 elements or the result is indexed multiple times.
  ```python
  squares = [x * x for x in range(100)]
  ```
- **Generator expression** -- use when the result is consumed once, may be large, or feeds another iterator. Generators have O(1) memory regardless of input size.
  ```python
  total = sum(x * x for x in range(10_000_000))  # no intermediate list
  ```
- **Dict comprehension** -- when constructing a mapping from an iterable. Prefer over `dict(zip(...))` when transformation logic is involved.
  ```python
  word_lengths = {word: len(word) for word in corpus}
  ```
- **Set comprehension** -- when deduplication and membership testing are needed. Not order-preserving.
  ```python
  unique_domains = {email.split("@")[1] for email in emails}
  ```
- **Nested comprehensions** -- only one level of nesting is acceptable in idiomatic Python. Two-level nesting is the hard limit.
  ```python
  # Acceptable: one-level nesting
  flat = [cell for row in matrix for cell in row]

  # NOT acceptable: extract to a named generator
  # result = [f(x) for outer in data for inner in outer for x in inner]
  ```
- **Generator function with `yield`** -- when the generation logic is too complex for an expression, involves try/except inside the loop, or needs to maintain state across yields.
  ```python
  def read_chunks(file_path: Path, size: int = 4096) -> Generator[bytes, None, None]:
      with file_path.open("rb") as f:
          while chunk := f.read(size):
              yield chunk
  ```
- **Walrus operator in comprehensions** -- use `:=` to avoid calling an expensive function twice when filtering and transforming on the same result.
  ```python
  results = [parsed for raw in data if (parsed := parse(raw)) is not None]
  ```

### 3. Select the Right Data Container

Apply this decision tree precisely -- the wrong container choice is one of the most common sources of non-Pythonic Python.

**Step A -- Is the data mutable or immutable?**
- Immutable with no behavior: consider `NamedTuple` (tuple semantics, zero-overhead slots) or `@dataclass(frozen=True)` (hashable, usable as dict key or set member)
- Mutable with behavior: use `@dataclass`

**Step B -- Does the data need runtime validation?**
- If yes, refer to `python-data-modeling` for Pydantic -- do not add validation inside `__post_init__` beyond simple invariant checks

**Step C -- Will this be used as a dict (JSON-compatible) or typed positionally?**
- If typed dict structure for JSON interop: `TypedDict` -- allows optional keys via `total=False` or `Required`/`NotRequired` annotations
- If positional tuple access matters: `NamedTuple`

**Step D -- Is this an enumerated constant set?**
- Integers with no string meaning: `enum.IntEnum`
- String values for serialization: `enum.StrEnum` (Python 3.11+) or `str, enum.Enum` mixin
- Auto-generated values: `enum.auto()`

**Full selection table:**

| Requirement | Container | Key Feature |
|---|---|---|
| Mutable fields, type hints, defaults | `@dataclass` | Generated `__init__`, `__repr__`, `__eq__` |
| Immutable, hashable value object | `@dataclass(frozen=True)` | Usable as dict key, set member |
| Lightweight tuple with named fields | `NamedTuple` | Tuple unpacking, indexing, zero overhead |
| JSON-like data, optional keys | `TypedDict` | `total=False`, structural dict typing |
| String constants for serialization | `enum.StrEnum` | `str` subclass, `auto()` gives lowercased name |
| Ordered integer constants | `enum.IntEnum` | Comparable to int literals |
| Namespace of related functions | `types.SimpleNamespace` or module | Rarely a class, avoid over-engineering |

**Dataclass field patterns to know:**
```python
from dataclasses import dataclass, field
from typing import ClassVar

@dataclass
class OrderBatch:
    orders: list["Order"] = field(default_factory=list)  # never use [] as default
    max_size: ClassVar[int] = 500  # class-level, excluded from __init__
    _cache: dict = field(default_factory=dict, repr=False, compare=False)  # internal
```

### 4. Define Structural Interfaces with Protocol

Protocol is the idiomatic way to express "any object that supports these methods" without requiring inheritance. Use it when:
- You cannot modify the third-party class to inherit from your ABC
- You want structural (duck) typing rather than nominal typing
- You want a minimal interface -- define only what the consumer actually calls

```python
from typing import Protocol, runtime_checkable

class Closeable(Protocol):
    def close(self) -> None: ...

class Readable(Protocol):
    def read(self, n: int = -1) -> bytes: ...
```

Key decisions:
- Use `@runtime_checkable` only when you need `isinstance(obj, MyProtocol)` at runtime -- it only checks method existence, not signatures, so it is a partial check
- Compose Protocols with inheritance: `class ReadableCloseable(Readable, Closeable): ...`
- For callable interfaces, use `Protocol` with `__call__` rather than `Callable[..., T]` when the signature matters:
  ```python
  class Transformer(Protocol):
      def __call__(self, value: str, *, strip: bool = True) -> str: ...
  ```
- Do NOT define a Protocol with more than 5--7 methods -- that is an indication the abstraction is too broad; split it

Protocols vs ABCs:
- Use `Protocol` for behavior-based contracts (what it can do)
- Use `ABC` only when you want shared implementation via `super()` in subclasses, or when nominal inheritance is intentional (e.g., a plugin system where `issubclass` checks matter)

### 5. Apply Structural Pattern Matching

`match`/`case` (Python 3.10+) is not a switch statement -- it matches against the structure, type, and values of objects simultaneously. Use it when you have 3 or more branches that discriminate on type, shape, or a combination.

**When to use match:**
- Dispatching on command/event type with attribute destructuring
- Processing AST nodes or recursive data structures
- Implementing state machines where transitions depend on both state and event shape
- Handling API response variants (success/error with different payloads)

**When NOT to use match:**
- Simple if/elif on a single boolean or integer flag -- match adds syntax overhead without clarity gain
- When all cases do the same thing to different values -- use a dict dispatch instead
- Python 3.9 or earlier target environments

**Pattern types:**
```python
match event:
    # Value pattern -- equality check
    case {"type": "login", "user_id": int(uid)}:
        handle_login(uid)

    # Class pattern -- type check + destructure
    case Order(status="pending", total=t) if t > 1000:
        flag_for_review(event)

    # Sequence pattern -- list/tuple destructure
    case [first, *rest] if len(rest) > 5:
        batch_process(first, rest)

    # OR pattern
    case {"status": "cancelled" | "refunded"}:
        handle_terminal(event)

    # Capture + guard
    case Order(order_type=ot) if ot not in ALLOWED_TYPES:
        raise ValueError(f"Unsupported order type: {ot}")

    # Wildcard -- always last
    case _:
        log_unhandled(event)
```

Class patterns require that the class declares `__match_args__` (dataclasses do this automatically) or uses keyword patterns. Do NOT rely on positional class patterns for classes that do not define `__match_args__`.

### 6. Write Idiomatic Context Managers

Every resource with an explicit lifecycle (file handles, locks, network connections, database transactions, temporary directories) should be managed with a context manager. Never leave cleanup to the garbage collector.

**`contextlib.contextmanager` -- the 90% solution:**
```python
from contextlib import contextmanager
from typing import Generator

@contextmanager
def managed_cursor(conn: Connection) -> Generator[Cursor, None, None]:
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
```

Rules for `contextmanager`:
- Code before `yield` is `__enter__` -- do NOT yield inside a bare `try` without `finally`
- Code after `yield` in `finally` always runs -- this is your cleanup
- Re-raise exceptions after rollback -- do not swallow them silently
- Yield exactly one value (the resource) or `None`

**`contextlib.suppress` -- replace empty except blocks:**
```python
# Non-idiomatic
try:
    os.remove(tmp_path)
except FileNotFoundError:
    pass

# Idiomatic
from contextlib import suppress
with suppress(FileNotFoundError):
    os.remove(tmp_path)
```

**`contextlib.ExitStack` -- dynamic resource composition:**
```python
from contextlib import ExitStack

def process_files(paths: list[Path]) -> None:
    with ExitStack() as stack:
        handles = [stack.enter_context(p.open()) for p in paths]
        # all handles closed on exit, even if one open() fails midway
        process(handles)
```

**Custom `__enter__`/`__exit__` class** -- use only when the context manager needs its own state, supports multiple entry, or has complex teardown that does not map cleanly to the linear `try/yield/finally` model:
```python
class Timer:
    def __enter__(self) -> "Timer":
        self._start = time.perf_counter()
        return self

    def __exit__(self, *exc_info: object) -> bool:
        self.elapsed = time.perf_counter() - self._start
        return False  # never suppress exceptions
```

### 7. Apply EAFP and Idiomatic Attribute/Key Access

Python's EAFP (Easier to Ask Forgiveness than Permission) is idiomatic because exceptions in CPython are fast when not raised -- the `try` block has near-zero overhead in the happy path.

**Key patterns:**
```python
# LBYL (non-idiomatic for attribute access)
if hasattr(obj, "process") and callable(obj.process):
    obj.process(data)

# EAFP (idiomatic)
try:
    obj.process(data)
except AttributeError:
    fallback(data)
```

```python
# Non-idiomatic dict access
if "key" in config and config["key"] is not None:
    value = config["key"]
else:
    value = default

# Idiomatic
value = config.get("key") or default  # careful: "or" skips falsy values, not just None
value = config.get("key", default)    # preferred when default is the literal fallback
```

```python
# Accumulation pattern -- defaultdict over pre-checking
from collections import defaultdict

groups: defaultdict[str, list[str]] = defaultdict(list)
for item in items:
    groups[item.category].append(item.name)
# Never: if item.category not in groups: groups[item.category] = []
```

```python
# Chained attribute access -- use getattr with default
host = getattr(config, "database", None) and getattr(config.database, "host", "localhost")
# Or: use a dataclass with proper defaults to avoid this pattern entirely
```

**When LBYL IS appropriate:**
- When the exception path would be extremely common (> ~10% of calls) and performance is measured to matter
- When the check is semantically meaningful ("does this file exist before I tell the user?")
- When the side effect of attempting the operation is irreversible

### 8. Apply `itertools` and `functools` Idioms

These are the standard library's idiomatic building blocks for iteration and callable manipulation. Do not reinvent them.

**`itertools` patterns to know:**
```python
import itertools

# Flatten one level of nesting
flat = list(itertools.chain.from_iterable(nested))

# Sliding windows (Python 3.12+: itertools.pairwise for pairs)
def windows(seq, n):
    iterators = itertools.tee(seq, n)
    for i, it in enumerate(iterators):
        next(itertools.islice(it, i, i), None)
    return zip(*iterators)

# Grouping consecutive identical elements
for key, group in itertools.groupby(sorted_data, key=lambda x: x.category):
    process_group(key, list(group))
# IMPORTANT: groupby only groups consecutive elements -- sort first

# Cycle through choices
roundrobin = itertools.cycle(["a", "b", "c"])

# Take first N from any iterable without slicing
first_10 = list(itertools.islice(expensive_generator(), 10))

# Cartesian product -- avoid nested loops
pairs = list(itertools.product(colors, sizes))
```

**`functools` patterns:**
```python
import functools

# Cache pure functions with no size limit (use carefully for memory)
@functools.cache  # Python 3.9+ alias for lru_cache(maxsize=None)
def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)

# LRU cache with bounded size -- for functions with many distinct inputs
@functools.lru_cache(maxsize=256)
def fetch_config(env: str) -> Config: ...

# Partial application -- fix known arguments
log_error = functools.partial(log, level="ERROR", service="api")

# Preserve metadata through decorators -- always use this in custom decorators
def my_decorator(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

# reduce for fold operations -- rare but idiomatic for combining structures
combined = functools.reduce(lambda acc, x: acc | x, list_of_dicts, {})
```

---

## Output Format

When delivering idiomatic refactoring, always present code in this structure:

```python
# ── Before: [describe the non-idiomatic pattern] ─────────────────────────
# [non-idiomatic code block]

# ── After: [describe the idiomatic pattern] ──────────────────────────────
# [idiomatic code block]

# ── Why ──────────────────────────────────────────────────────────────────
# 1. [specific reason tied to Python semantics]
# 2. [second reason]
# 3. [third reason if applicable]
```

For pattern selection decisions, use this decision table:

```
## Pattern Decision: [Category]

| Situation | Pattern | Why |
|-----------|---------|-----|
| [specific situation] | [specific pattern] | [specific reason] |
```

For multi-pattern refactors (the common case), group by layer:

```
## Refactoring Plan

### Layer 1 -- Data Modeling
[data container selection + code]

### Layer 2 -- Business Logic
[comprehensions, generators, pattern matching + code]

### Layer 3 -- Resource Management
[context managers + code]

### Layer 4 -- Interface Definition
[Protocol definitions + code]
```

Always include a "What Changed and Why" summary after the code block, with numbered points that reference specific Python semantics -- not just style preferences.

---

## Rules

1. **Never use a mutable default argument.** `def f(items=[])` shares the same list object across all calls. Use `None` with an explicit `if items is None: items = []` body, or `field(default_factory=list)` in a dataclass. This is the most common Python bug in new code.

2. **Never nest comprehensions more than two levels deep.** Two-level nesting (`[x for row in matrix for x in row]`) is the absolute maximum. Three-level nesting is always unreadable and must be extracted to a named generator function.

3. **Never use `type(x) == SomeType` for type checking.** Use `isinstance(x, SomeType)` to respect subclasses, or structural Protocol checks. `type()` equality breaks with subclasses and is almost never what the author intended.

4. **Never use a bare `except:` or `except Exception:` that swallows the exception silently.** Empty except blocks hide bugs. Either re-raise, log and re-raise, or use `contextlib.suppress` with a specific exception type for intentional suppression.

5. **Never use `@dataclass` when `NamedTuple` is sufficient.** If the data is immutable, positionally meaningful, and needs no behavior beyond field access, `NamedTuple` provides tuple unpacking, is faster to construct, uses less memory, and requires no import from `dataclasses`. Only use `@dataclass(frozen=True)` when you need inheritance or non-positional defaults.

6. **Never put business logic or I/O in `__init__` or `__post_init__`.** These methods are for field initialization and lightweight invariant checks only. Use a `@classmethod` factory (e.g., `from_dict`, `from_file`) for construction with side effects or complex parsing.

7. **Always use `str.join()` for building strings from iterables.** `"".join([...])` is O(n). String concatenation in a loop is O(n^2) due to repeated allocation. This is one of the few Python idioms with a hard performance reason, not just style.

8. **Always use `pathlib.Path` for all filesystem operations.** `os.path.join`, `os.path.exists`, and string-based path manipulation are legacy. `Path` objects compose with `/`, expose `.stem`, `.suffix`, `.parent`, `.glob()`, `.read_text()`, and `.write_bytes()` cleanly. New code should never import `os.path`.

9. **Never use `global` when a closure, class attribute, or function parameter achieves the same goal.** `global` creates action-at-a-distance bugs, prevents reuse, and breaks under concurrency. Closures (returning a function that captures a variable) are the idiomatic alternative for encapsulated mutable state.

10. **Always use `enumerate()` instead of `range(len(seq))`.** `for i in range(len(items)): items[i]` is the most recognizable sign of translating from C or Java. `for i, item in enumerate(items)` is idiomatic, handles any iterable (not just indexable sequences), and is faster.

11. **Never use `or` for default values when `False`, `0`, `""`, or `[]` are valid inputs.** `value = config.get("timeout") or 30` silently ignores a configured timeout of `0`. Use `config.get("timeout", 30)` or an explicit `if value is None` check when None specifically means "not set".

12. **Always use `zip(..., strict=True)` (Python 3.10+) when zipping same-length sequences.** Silent truncation to the shorter iterable is a common bug. `strict=True` raises `ValueError` if lengths differ, turning a silent data corruption into a loud error.

---

## Edge Cases

### Legacy Codebase Without Type Hints or Tests

Do not introduce dataclasses, Protocol, or pattern matching until the changed code has test coverage. The safest migration order is:
1. Add type hints to existing functions first (zero behavior change)
2. Replace raw dict returns with `TypedDict` (structural change only, fully backward compatible)
3. Replace `dict`-based objects with `NamedTuple` for read-only data (tuple indexing still works)
4. Introduce `@dataclass` only for new code or when a class is being rewritten anyway

Never rewrite an entire module of dict-based data structures to dataclasses in a single PR -- the diff is unreviable and the risk is high.

### Python 3.9 or 3.10 Target Environment

Several idioms in this skill require specific Python versions:
- `match`/`case`: Python 3.10+ only. For 3.9, use `if`/`elif` with `isinstance` chains
- `enum.StrEnum`: Python 3.11+. For 3.10, use `class Color(str, enum.Enum)`
- `functools.cache`: Python 3.9+. For 3.8, use `functools.lru_cache(maxsize=None)`
- `zip(..., strict=True)`: Python 3.10+
- `X | Y` type union syntax in annotations: Python 3.10+. For 3.9, use `from __future__ import annotations` at the top of the file to defer evaluation, which makes the syntax valid even on 3.9

Always confirm the target Python version before recommending 3.10+ features. Check `python_requires` in `pyproject.toml` if the project has one.

### Team Unfamiliar with These Patterns

When the user is introducing idioms to a team that primarily knows procedural Python:
- Introduce one pattern category per sprint, not all at once
- The order of easiest adoption: comprehensions → `enumerate`/`zip` → `pathlib` → dataclasses → `contextlib` → Protocol → pattern matching
- Write a one-page team ADR (Architectural Decision Record) for each adopted pattern explaining why it was chosen
- Avoid walrus operator (`:=`), starred assignment in complex positions, and chained itertools calls in shared code until the team is comfortable -- these have high cognitive load and fail code review silently when misread
- `match`/`case` is often the most controversial -- demonstrate it on a known-complex `if`/`elif` chain before proposing it for new code

### Interoperability with C Extensions and Cython

Certain idiomatic Python patterns prevent Cython optimization and native extension interop:
- Generators and generator expressions cannot be typed with Cython's `cdef` -- use explicit typed loops in Cython source files
- `@dataclass` with `__eq__` and `__hash__` prevents Cython's struct-like memory layout; prefer C structs via `ctypes.Structure` for performance-critical data exchange
- `Protocol` isinstance checks work at Python level but have no meaning to C extensions -- use explicit type tags or discriminated unions for C FFI boundaries
- If a Python class will be subclassed in Cython, use `__slots__` to prevent arbitrary attribute addition, which breaks Cython's static analysis

### `__slots__` and Dataclass Interactions

`__slots__` dramatically reduces memory per-instance (from ~200 bytes per dict to ~50 bytes per fixed slot) and is worth adding when creating millions of small objects. With dataclasses:
```python
@dataclass
class Point:
    __slots__ = ("x", "y")  # Python 3.10+: slots=True parameter
    x: float
    y: float

# Python 3.10+: preferred
@dataclass(slots=True)
class Point:
    x: float
    y: float
```
Slots interact badly with multiple inheritance -- two classes with disjoint `__slots__` cannot be easily combined. Do not add slots to classes intended for mixin-heavy inheritance.

### Generator Exhaustion Bugs

Generators are one-time iterators. The most common mistake is iterating a generator twice:
```python
def even_numbers(n):
    return (x for x in range(n) if x % 2 == 0)

evens = even_numbers(100)
print(list(evens))   # works
print(list(evens))   # returns [] -- generator is exhausted

# Fix: either use a list, or make the source a function
# If callers iterate it multiple times, return a list or provide a method
```
Diagnose generator exhaustion bugs by checking if `list(gen)` on second call returns `[]`. When a generator must be reusable, wrap it in a class with `__iter__` returning a fresh generator, or document clearly that it is single-use.

### Overuse of Pattern Matching

`match`/`case` is sometimes applied where a dict dispatch table is cleaner and faster:
```python
# Pattern matching -- good when structure varies
match command:
    case {"action": "create", "payload": dict(payload)}:
        create(payload)
    case {"action": "delete", "id": int(record_id)}:
        delete(record_id)

# Dict dispatch -- better when behavior is uniform and type doesn't vary
HANDLERS = {
    "create": handle_create,
    "delete": handle_delete,
    "update": handle_update,
}
handler = HANDLERS.get(command["action"])
if handler is None:
    raise ValueError(f"Unknown action: {command['action']}")
handler(command)
```
Use pattern matching for structural discrimination (different shapes require different destructuring). Use dict dispatch for behavioral dispatch (same shape, different function to call).

---

## Example

**Input:** "I have a function that reads transaction records from multiple CSV files, filters for transactions over $100, groups them by merchant category, and computes the total per category. The code uses nested for loops, lots of `if key not in dict` checks, and builds everything into plain dicts. How do I make it Pythonic?"

**Full Worked Output:**

```python
# ── Before: Non-idiomatic dict-and-loop approach ─────────────────────────

import csv
import os

def process_transactions(file_paths):
    all_transactions = []
    for file_path in file_paths:
        f = open(file_path, "r")
        reader = csv.DictReader(f)
        for row in reader:
            all_transactions.append(row)
        f.close()

    filtered = []
    for t in all_transactions:
        if float(t["amount"]) > 100:
            filtered.append(t)

    grouped = {}
    for t in filtered:
        category = t["merchant_category"]
        if category not in grouped:
            grouped[category] = []
        grouped[category].append(float(t["amount"]))

    totals = {}
    for category, amounts in grouped.items():
        total = 0
        for amount in amounts:
            total = total + amount
        totals[category] = total

    return totals


# ── After: Idiomatic Python ───────────────────────────────────────────────

from __future__ import annotations

import csv
import itertools
from collections import defaultdict
from contextlib import ExitStack
from dataclasses import dataclass
from pathlib import Path
from typing import Generator


@dataclass(frozen=True)
class Transaction:
    """Immutable value object representing one transaction record."""
    merchant_category: str
    amount: float

    @classmethod
    def from_row(cls, row: dict[str, str]) -> Transaction:
        """Factory: parse a raw CSV row into a typed Transaction.

        Raises ValueError if 'amount' is not a valid float.
        """
        return cls(
            merchant_category=row["merchant_category"].strip(),
            amount=float(row["amount"]),
        )


def _read_transactions(
    paths: list[Path],
) -> Generator[Transaction, None, None]:
    """Lazily yield Transaction objects from multiple CSV files.

    Uses ExitStack so all file handles are guaranteed to close even if
    parsing raises midway through any file.
    """
    with ExitStack() as stack:
        handles = [
            stack.enter_context(path.open(newline="", encoding="utf-8"))
            for path in paths
        ]
        rows = itertools.chain.from_iterable(
            csv.DictReader(handle) for handle in handles
        )
        for row in rows:
            try:
                yield Transaction.from_row(row)
            except (KeyError, ValueError):
                # Skip malformed rows; in production, log here
                continue


def compute_category_totals(
    file_paths: list[str | Path],
    min_amount: float = 100.0,
) -> dict[str, float]:
    """Return total transaction amount per merchant category.

    Only transactions with amount > min_amount are included.

    Args:
        file_paths: Paths to CSV files. Each must have columns
                    'merchant_category' and 'amount'.
        min_amount: Minimum transaction amount to include (exclusive).

    Returns:
        Mapping of merchant_category -> total amount.
    """
    paths = [Path(p) for p in file_paths]

    transactions = _read_transactions(paths)

    # Generator expression: filter without materializing full dataset
    qualifying = (t for t in transactions if t.amount > min_amount)

    # defaultdict: no pre-check needed before accumulation
    totals: defaultdict[str, float] = defaultdict(float)
    for t in qualifying:
        totals[t.merchant_category] += t.amount

    # Return a plain dict -- callers should not need defaultdict behavior
    return dict(totals)
```

**What Changed and Why:**

1. **`@dataclass(frozen=True)` replaces plain `dict` for transaction data.** The fields `merchant_category` and `amount` are now typed, named, and immutable. `frozen=True` makes `Transaction` hashable, so it could be used in sets or as dict keys if needed. The `from_row` classmethod separates parsing from construction -- `__init__` never reads I/O or raises `ValueError` directly.

2. **`ExitStack` + list comprehension replaces `open`/`close` pairs.** Every file handle opened in the list comprehension is registered with the stack, guaranteeing cleanup even if `csv.DictReader` construction raises on one file. The original code leaked the file handle if an exception occurred between `open` and `close`.

3. **`itertools.chain.from_iterable` flattens the per-file row streams lazily.** No intermediate list of all rows is built. For 50 files with 100,000 rows each, the original code held 5 million dicts in memory; this approach holds at most one row at a time.

4. **Generator expression for filtering (`qualifying`)** avoids a second pass and a second list. The pipeline is `read → filter → accumulate` in a single linear traversal.

5. **`defaultdict(float)` eliminates the `if key not in grouped` pattern.** `defaultdict(float)` initializes any missing key to `0.0` on first access, so `totals[category] += amount` works unconditionally. This replaces four lines with one.

6. **`sum()` was implicit in `defaultdict` accumulation** -- `+= amount` is clearer than an inner loop and more efficient than calling `sum(amounts)` on a pre-built list.

7. **`pathlib.Path` replaces bare string paths.** `path.open()` is equivalent to `open(str(path))` but integrates with the type system and avoids string manipulation for any path operations that might be added later (e.g., `path.stem`, `path.parent`).

8. **`min_amount` parameter with a default** makes the filter threshold explicit and testable without mocking or patching a constant. Callers can write `compute_category_totals(files, min_amount=0)` to include all transactions in tests.
