---
name: python-type-system
description: |
  Guides advanced Python type system usage: generic types with TypeVar, Protocol for structural subtyping, ParamSpec for decorator typing, TypeVarTuple for variadic generics, runtime vs static type checking tradeoffs, and py.typed marker for library distribution.
  Use when the user asks about Python generics, TypeVar, Protocol, ParamSpec, overload decorators, type narrowing, or distributing typed Python libraries.
  Do NOT use when the user asks about basic type annotations (use `python-idioms`), data validation (use `python-data-modeling`), or project setup (use `python-project-setup`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "python best-practices clean-code"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Python Type System

## When to Use

**Use this skill when:**
- The user asks about TypeVar, Generic, Protocol, ParamSpec, TypeVarTuple, or Concatenate and needs to understand how to apply them correctly in their codebase
- The user is designing a reusable library component (container class, decorator, utility function) and needs type-safe generic abstractions that work correctly in mypy, pyright, and pyright-based IDEs like VS Code
- The user is creating a structural interface for a plugin system, strategy pattern, or callback-based API where nominal inheritance is not desirable or practical
- The user needs to type a decorator that wraps arbitrary functions while preserving full parameter and return type signatures for callers
- The user asks about type narrowing -- TypeGuard, isinstance branches, assert_never, Literal types in match/case -- and needs to eliminate type errors without resorting to cast()
- The user has multiple overloaded function signatures (e.g., a function that returns str when given str, bytes when given bytes) and needs @overload to express this precisely
- The user is preparing a Python package for distribution on PyPI and needs to understand py.typed markers, inline types vs stub files, and PEP 561 compliance
- The user is migrating a large untyped codebase and needs a strategy for incremental adoption without breaking existing code
- The user is hitting mypy or pyright errors related to variance (invariant containers, covariant return types, contravariant function parameters) and cannot understand why

**Do NOT use this skill when:**
- The user wants basic variable, parameter, or return type annotations like `def greet(name: str) -> str` -- use `python-idioms` instead
- The user wants to validate untrusted external data (API responses, config files, user input) at runtime -- use `python-data-modeling` for Pydantic or dataclasses-based validation
- The user is setting up a Python project, configuring pyproject.toml, or choosing between mypy and pyright for a new project -- use `python-project-setup`
- The user wants to write tests, including tests that verify type behavior -- use `python-testing-patterns`
- The user is asking about error handling patterns, custom exception hierarchies, or exception chaining -- use `python-error-handling`
- The user asks about data classes specifically for modeling domain entities -- use `python-data-modeling`
- The user is asking about performance optimization of Python code rather than type safety

---

## Process

### 1. Diagnose the Typing Need Precisely

Before writing any type annotation code, identify which problem the user is actually solving. The wrong tool produces annotations that are technically valid but mislead callers or cause downstream type errors.

- **Generic container or function with one flexible element type:** Use `TypeVar`. If the type must support comparison, sorting, or arithmetic, add a bound. If the function can only accept `int` or `float` specifically, use constraints (not a bound).
- **Structural interface where you cannot require inheritance:** Use `Protocol`. This is the right choice for third-party extensibility, callback types with multiple parameters, and any time you want duck typing with static verification.
- **Decorator that wraps arbitrary callables:** Use `ParamSpec`. Without it, the wrapper loses all knowledge of the wrapped function's parameters, breaking autocomplete and mypy validation for callers.
- **Function with overloaded signatures that differ in input/output type relationship:** Use `@overload`. The classic cases are: input `str` → output `str`, input `bytes` → output `bytes`; or optional parameter presence controlling return type; or `Literal` values selecting return types.
- **Narrowing from a broad type (like `object` or a union) inside a guard function:** Use `TypeGuard[T]`. If the narrowing is only valid for the `True` branch, use `TypeGuard`. If it is bidirectional (False branch narrows the other way), Python 3.13 added `TypeIs[T]`.
- **Variadic generic (functions that preserve the types of arbitrary-length argument tuples):** Use `TypeVarTuple` with `Unpack`. The canonical use case is a typed `zip` or a function that transforms a heterogeneous tuple while preserving element types.
- **Exhaustive match/case with sum types:** Use `Never` with `assert_never()` from `typing_extensions` or Python 3.11+.

### 2. Set Up the Typing Environment Correctly

Type annotations interact with Python version, import style, and checker configuration. Get this right before writing type code.

- **Python version targeting matters:** `TypeVar`, `Generic`, `Protocol` are in `typing` since Python 3.5. `ParamSpec` and `Concatenate` require Python 3.10+ from `typing` or `typing_extensions` for 3.8+. `TypeVarTuple` and `Unpack` require Python 3.11+ or `typing_extensions >= 4.0`. `TypeIs` requires Python 3.13+ or `typing_extensions >= 4.10`. Always import from `typing_extensions` for backwards compatibility in libraries.
- **Use `from __future__ import annotations` (PEP 563) when:** your file contains forward references (a class referencing itself, or two classes referencing each other), or you want to avoid importing expensive runtime objects just for annotations. Be aware: this makes ALL annotations strings at runtime, which breaks `get_type_hints()` behavior in some frameworks (FastAPI, Pydantic v1). Test your framework compatibility before enabling it globally.
- **Avoid mixing old-style typing imports with built-in generics.** In Python 3.9+, use `list[int]`, `dict[str, int]`, `tuple[int, ...]`, and `type[MyClass]` directly. Do not mix `typing.List[int]` with `list[int]` in the same codebase. Pick one and enforce it with a linter rule (`UP006`, `UP007` in ruff).
- **Configure your type checker strictly for new code:** For mypy, use `strict = true` in `mypy.ini` or `pyproject.toml`. For pyright, use `typeCheckingMode = "strict"`. Understand what these flags enable: `--disallow-untyped-defs`, `--disallow-any-generics`, `--warn-return-any`, `--check-untyped-defs`. Apply strict mode file-by-file using `# mypy: strict` if full-project strict is not yet feasible.

### 3. Design TypeVar and Generic Class Hierarchies

TypeVar is the foundation of generic Python code. Most typing bugs come from misusing it.

- **Define TypeVars at module scope, never inside functions.** A TypeVar defined inside a function is a new object on every call, breaking the identity check that type checkers use to correlate variables.
- **Name TypeVars by convention:** single uppercase `T`, `K`, `V` for simple cases; descriptive names with `_T` suffix for domain-specific vars: `ReturnType_T`, `ElementType_T`. Covariant vars suffix `_co`, contravariant suffix `_contra`.
- **Bound vs. constraints:** `T = TypeVar("T", bound=Comparable)` means "T must be a subtype of Comparable or Comparable itself" -- the generic can receive any conforming type and still return that exact type. `T = TypeVar("T", int, float)` means "T must be exactly int or exactly float" -- the checker picks one per call site. Use bound for protocol-constrained generics; use constraints only when you genuinely need to enumerate the exact allowed types.
- **Variance rules:** A `list[Dog]` is NOT a `list[Animal]` because lists are mutable (invariant). A `Callable[[Animal], None]` IS a `Callable[[Dog], None]` (contravariant in parameters). A `Supplier[Dog]` IS a `Supplier[Animal]` if `Supplier` only produces values (covariant in output). Get variance wrong and mypy will correctly reject assignments that seem intuitive.
- **Covariant containers:** Use `T_co = TypeVar("T_co", covariant=True)` for read-only containers like `Sequence`, `Iterable`, `Iterator`, `Mapping` (keys are invariant, values are covariant). Define `class ImmutableStack(Generic[T_co])` to allow `ImmutableStack[Dog]` to satisfy `ImmutableStack[Animal]`.
- **Self type for fluent APIs and class methods:** In Python 3.11+, use `from typing import Self`. In earlier versions, use `T = TypeVar("T", bound="MyClass")` and annotate `def clone(self: T) -> T`. This ensures subclass methods return the subclass type, not the base class.
- **In Python 3.12+:** use the PEP 695 syntax `def first[T](items: list[T]) -> T` and `class Stack[T]:` instead of the explicit `TypeVar` declaration. This is cleaner and avoids the module-scope naming requirement.

### 4. Design Protocol Interfaces for Structural Subtyping

Protocol is the correct tool for any interface that external or third-party code will implement.

- **Define the minimum viable protocol.** Every method and attribute on a Protocol is a requirement for conformance. Add only what the consumer of the protocol actually uses. A protocol with 12 methods that only uses 2 of them in the consuming function is a design smell.
- **Use Protocol instead of ABC for externally-consumed interfaces.** ABCs require explicit inheritance (`class MyPlugin(PluginBase)`), creating a tight coupling. Protocols require only structural compatibility -- any class with matching methods qualifies. This is more Pythonic and more compatible with code you do not control.
- **Attribute protocols:** Include attributes in protocols with explicit type annotations. The conforming class can implement them as instance variables, properties, or class variables -- the protocol does not care which, only that the attribute is accessible.
- **`runtime_checkable` Protocol is NOT a full runtime type check.** It only checks for method and attribute names via `isinstance()`, not for their signatures or return types. `isinstance(obj, Plugin)` will return `True` for any object with a `name` attribute and `initialize`, `execute`, `shutdown` methods -- even if their signatures are completely wrong. Use it only for duck-typing dispatch, not for validation of untrusted input.
- **Generic Protocols:** Combine Protocol with Generic for parameterized structural interfaces. `class Repository(Protocol[T]):` defines a protocol that is generic in its entity type. Conforming classes must be generic too, or must specialize the TypeVar concretely.
- **Callback protocols:** Use Protocol to type callable objects with specific signatures that cannot be expressed with `Callable`. `class Transformer(Protocol[T, R]):` with `def __call__(self, value: T, *, timeout: float) -> R: ...` expresses a keyword-argument-carrying callable precisely.
- **Protocol inheritance:** Protocols can inherit from other Protocols, creating interface hierarchies without runtime coupling. `class ReadableStream(Protocol):` and `class ReadWriteStream(ReadableStream, Protocol):` composes the interfaces structurally.

### 5. Type Decorators with ParamSpec and Concatenate

Decorators are the most commonly mistyped Python construct. Most decorator typing bugs result in the wrapper being typed as `(*args: Any, **kwargs: Any) -> Any`, losing all IDE support for the wrapped function.

- **The correct ParamSpec pattern:** `P = ParamSpec("P")` and `R = TypeVar("R")`. The decorator receives `Callable[P, R]` and returns `Callable[P, R]`. The wrapper function uses `*args: P.args, **kwargs: P.kwargs` exactly -- these are special forms that only work as `P.args` and `P.kwargs` together.
- **Do NOT add regular parameters between `P.args` in the wrapper signature.** `def wrapper(extra: str, *args: P.args, **kwargs: P.kwargs)` is invalid. If you need to add parameters to the wrapped function's interface, use `Concatenate[ExtraParam, P]` in the outer decorator type.
- **Concatenate pattern:** `def with_auth(func: Callable[Concatenate[AuthToken, P], R]) -> Callable[P, R]` expresses a decorator that consumes the first `AuthToken` argument and exposes the remaining `P` parameters to callers. This correctly types decorators that inject dependencies as the first argument.
- **Class-based decorators with ParamSpec:** When implementing a decorator as a class with `__call__`, annotate `def __call__(self, *args: P.args, **kwargs: P.kwargs) -> R`. The class itself is generic in `P` and `R`.
- **Stacked decorators:** When multiple decorators are applied, each one's `Callable[P, R]` input and output must chain correctly. If a middle decorator changes the signature, its output type must match the next decorator's input type precisely.

### 6. Apply Type Narrowing Correctly

Type narrowing is how the type checker tracks type information through conditional branches. Misusing narrowing tools produces silently incorrect type information.

- **`isinstance` narrowing is the safest and most reliable form.** `if isinstance(x, str):` causes mypy and pyright to narrow `x` to `str` inside the branch. For union types `str | int`, both branches are narrowed correctly. For `object`, narrowing to a concrete type inside the branch is reliable.
- **`TypeGuard[T]` for custom guard functions:** The function must return `bool`. When it returns `True`, the type checker narrows the first parameter to `T`. The narrowing is ONLY applied in the `True` branch -- the `False` branch still has the original type. This is intentional and asymmetric.
- **`TypeIs[T]` (Python 3.13+ or typing_extensions):** Unlike TypeGuard, `TypeIs` narrows in both branches. If `is_str(x)` returns `True`, `x` is `str`. If it returns `False`, `x` is narrowed to "the original type minus str". Prefer `TypeIs` over `TypeGuard` when you have symmetric narrowing.
- **`cast()` is a promise to the type checker that you cannot enforce.** It tells the checker "trust me, this is type T" with zero runtime enforcement. Use it only as an absolute last resort when interacting with dynamically typed code you cannot annotate (e.g., plugin loading via `importlib`, metaclass magic). Document why the cast is safe every time you use it.
- **`assert_never(x)` for exhaustive match:** Import from `typing` (3.11+) or `typing_extensions`. Place it in the default branch of a match statement or if/elif chain over a union. If any case is unhandled, mypy will report an error because `x` will not be narrowed to `Never`. This is the correct pattern for sum types:

```python
def handle(event: LoginEvent | LogoutEvent | ErrorEvent) -> str:
    match event:
        case LoginEvent():
            return "logged in"
        case LogoutEvent():
            return "logged out"
        case ErrorEvent():
            return "error"
        case _ as unreachable:
            assert_never(unreachable)  # mypy error if a new event type is added to the union
```

- **Literal types for value-based narrowing:** `def process(mode: Literal["read", "write"]) -> None` enables callers to pass only exact string values. Combined with overload, Literal types enable return-type selection based on exact values.
- **`reveal_type(x)`** is a development-only tool (no import needed in mypy; import from `typing` in Python 3.11+ to silence the NameError at runtime). Use it to debug what the type checker currently believes about a variable. Remove before committing.

### 7. Distribute a Typed Library Correctly (PEP 561)

A Python library distributed on PyPI must follow PEP 561 to be recognized as typed by mypy, pyright, and other consumers.

- **Include a `py.typed` marker file.** It is an empty file placed at the root of the package (alongside `__init__.py`). Its presence signals to type checkers that the package has inline type annotations. Without it, mypy defaults to treating the package as untyped (unless the user enables `ignore_missing_imports = false`).
- **Declare the marker in `pyproject.toml`:** Under `[tool.setuptools.packages.find]` or manually under `[tool.setuptools.package-data]`, include `"your_package" = ["py.typed"]`. For flit and hatch, include it in the package data manifest.
- **Inline types vs. stub files:** Inline types (annotations in `.py` source files) are the default and preferred approach for most libraries. Stub files (`.pyi` files alongside `.py` files, or in a separate stubs package) are appropriate when: the source is C extension code, you are providing types for a third-party package you do not own, or you want to decouple the type interface from the implementation.
- **Separate stub packages:** Name them `{package-name}-stubs` (e.g., `requests-stubs`). They are separate PyPI distributions. Include a `py.typed` marker in the stubs package too. Do not include `.py` source files, only `.pyi` stubs.
- **Stub file completeness:** mypy ignores a `.pyi` stub if it exists for a module and treats it as the complete interface. If a stub exists and omits a function, callers will see an "attribute not found" error even if the function exists in the `.py` file. Keep stubs complete or use partial stubs with explicit `...` overrides.
- **Version your type annotations separately from behavior.** Adding type annotations to a library is NOT a breaking change and does not require a major version bump. Changing existing annotations IS a breaking change if you are following semantic versioning for a typed library.

### 8. Validate and Test the Type System

Type annotations that pass mypy but produce incorrect behavior are worse than no annotations -- they create false confidence.

- **Run both mypy and pyright.** They have different inference algorithms and catch different classes of errors. A common pattern: use mypy as the CI gate (`mypy --strict src/`) and pyright locally via Pylance. Resolve errors in both.
- **Use `mypy --strict` flag breakdown:** `--disallow-untyped-defs` catches functions missing annotations; `--disallow-any-generics` catches `list` without `list[int]`; `--warn-return-any` catches functions that return `Any`; `--strict-equality` catches comparisons that are always `True` or `False` due to types.
- **Type-check tests too.** Tests are the largest source of untyped Python in most projects. Add `[mypy-tests.*]` with `disallow_untyped_defs = false` to mypy config if you must carve out tests, but ideally type them fully.
- **Write `reveal_type` based regression tests.** Some projects run a test that captures mypy's `reveal_type` output for key public API functions and asserts it matches expected output. This prevents accidental regression of type information in refactors.
- **For library authors:** Validate that the annotations you ship are correct using `pyright --verifytypes your_package`. This tool gives a percentage of the public API that is fully typed and reports which functions have incomplete annotations.

---

## Output Format

When answering a user question about the Python type system, provide:

### 1. Problem Diagnosis Block

```
Typing need: [TypeVar / Protocol / ParamSpec / TypeGuard / overload / TypeVarTuple / assert_never]
Root issue: [What the user is trying to express and why naive annotation fails]
Python version target: [3.8 / 3.9 / 3.10 / 3.11 / 3.12+ -- affects which typing features are available]
Checker implications: [Any specific mypy/pyright behavior or flag to note]
```

### 2. Annotated Solution Code

Provide complete, runnable Python code that:
- Has a file-level comment indicating minimum Python version
- Imports from `typing_extensions` when supporting Python < 3.10
- Defines TypeVars at module scope with descriptive names and comments explaining bounds/variance
- Includes docstrings on Protocol classes explaining the structural contract
- Uses inline comments to explain non-obvious typing choices
- Compiles without errors under `mypy --strict` and `pyright --strict`

### 3. Caller Usage Examples

Show how correctly-annotated callsites look, including:
- What IDE autocomplete would infer for return types
- What error messages a caller would see if they pass the wrong type
- At least one negative example (code that correctly fails type checking)

### 4. Trade-off Notes Table

| Approach | Type Safety | Runtime Cost | Complexity | Best For |
|---|---|---|---|---|
| [approach 1] | [high/med/low] | [ns/μs/ms] | [low/med/high] | [use case] |
| [approach 2] | ... | ... | ... | ... |

### 5. Distribution Checklist (when relevant)

```
[ ] py.typed marker file present at package root
[ ] py.typed listed in package_data in pyproject.toml
[ ] mypy --strict passes with zero errors
[ ] pyright --verifytypes shows > 95% typed public API
[ ] typing_extensions used for features below minimum Python version
[ ] No typing.List / typing.Dict -- use built-in generics
[ ] TypeVars defined at module scope
[ ] @runtime_checkable Protocols have documented isinstance limitations
```

---

## Rules

1. **NEVER use bare `Any` when a more specific type exists.** `Any` is an escape hatch that disables type checking in both directions -- the checker will not validate what you pass in OR what you do with the result. When you find yourself reaching for `Any`, consider whether `object` (the safe read-only alternative), a TypeVar with a bound, or a Protocol solves the problem.

2. **NEVER define a TypeVar inside a function body.** `def f(): T = TypeVar("T")` creates a new TypeVar object on every call. Type checkers do not honor function-scoped TypeVars -- they treat them as `Any`. Define all TypeVars at module scope.

3. **NEVER use `cast()` to silence a type error.** A cast that hides an actual type mismatch introduces a runtime bug that the type system can no longer detect. If you need cast, it signals either a missing Protocol, an incorrectly typed third-party API (fix with a stub or type: ignore with a comment), or a design that needs reconsidering.

4. **ALWAYS use `@overload` for functions with input-type-dependent return types.** Without overload, a function like `def parse(data: str | bytes) -> str | bytes` forces callers to narrow the return type themselves. With overload, passing `str` guarantees `str` return, passing `bytes` guarantees `bytes` return. The actual implementation function is NOT type-checked by callers -- only the overload signatures are.

5. **NEVER add arbitrary attributes to a `runtime_checkable` Protocol and expect isinstance to check them.** `isinstance(obj, MyProtocol)` only checks for the presence of methods and attributes by name, not their types or signatures. A class with `def execute(self) -> None` satisfies a protocol that declares `def execute(self, timeout: int) -> bool` from isinstance's perspective. Document this limitation explicitly in code.

6. **ALWAYS use `Concatenate` when a decorator consumes or injects a leading argument.** A decorator that takes `request: HttpRequest` as the first arg before `P` must use `Callable[Concatenate[HttpRequest, P], R]` as its input type to correctly express what it requires and what it exposes.

7. **NEVER mix `typing.List`, `typing.Dict`, `typing.Tuple`, `typing.Optional` with their built-in equivalents in the same file.** Pick the built-in generic syntax (`list`, `dict`, `tuple`, `X | None`) for Python 3.10+ codebases. Pick the `typing` imports for Python 3.8/3.9 codebases. Ruff rules `UP006` and `UP007` enforce this automatically.

8. **ALWAYS verify that covariance and contravariance decisions are semantically correct, not just technically required to satisfy mypy.** Declaring a TypeVar covariant when the container actually allows mutation will compile but produce incorrect type behavior for callers -- for example, allowing a `MutableStack[Dog]` to be assigned to `MutableStack[Animal]`, then inserting a `Cat` through the `Animal` reference.

9. **ALWAYS ship `py.typed` in the package data when distributing a typed library.** If `py.typed` is missing from the wheel, consumers running mypy will treat your library as untyped, ignoring all your inline annotations. Verify with `python -c "import importlib.resources; print(list(importlib.resources.files('your_package').iterdir()))"` that the file is present after installation.

10. **NEVER use `Protocol` with `@runtime_checkable` as a substitute for Pydantic or dataclass validation of external data.** Protocol isinstance checks do not validate types of attributes, only their names. Using Protocol for input validation creates a security and correctness hole -- use `python-data-modeling` patterns for that purpose.

11. **ALWAYS add `# type: ignore[import-untyped]` (not bare `# type: ignore`) when suppressing missing stubs.** The specific error code documents why the ignore was added and prevents the ignore from silently suppressing other future errors on the same line. Bare `# type: ignore` suppresses ALL errors on the line including ones you have not seen yet.

12. **When using `from __future__ import annotations`, audit framework compatibility before enabling.** FastAPI, Pydantic v1, and SQLAlchemy rely on `get_type_hints()` at runtime to process annotations. With PEP 563 active, `get_type_hints()` must resolve string annotations in the correct namespace, and this fails in some module configurations. Pydantic v2 and FastAPI handle this correctly -- Pydantic v1 does not in all cases.

---

## Edge Cases

### TypeVar Escaping Its Generic Scope

**Situation:** A method inside a generic class uses a TypeVar that shadows the class-level TypeVar, creating two different type variables with the same name. This compiles but produces unexpected behavior.

**Handling:** Never reuse a TypeVar name inside a class that already binds it at the class level. If `class Stack(Generic[T]):` already uses `T`, define a NEW TypeVar (e.g., `U = TypeVar("U")`) for independent method-level generics. mypy will catch most cases where a class TypeVar is reused incorrectly in a method, but give it a different name to be explicit.

### Third-Party Library with No Type Stubs

**Situation:** A dependency like an internal company library or an older OSS package has no type annotations and no stubs in typeshed. mypy reports `error: Skipping analyzing "somelib": module is installed, but missing library stubs or py.typed marker`.

**Handling:** Three options in increasing order of effort:
1. Add `[[tool.mypy.overrides]] module = "somelib.*"` and `ignore_missing_imports = true` to suppress the error for that package only. This restores the module to `Any` but at least localizes the suppression.
2. Create a local `stubs/` directory (or `typeshed-fallback/`) and write minimal stub files (`.pyi`) for only the functions you use. Point mypy to it with `mypy_path = "stubs"` in config.
3. Contribute stubs to the `typeshed` project (for popular libraries) or publish a `{package}-stubs` package on PyPI. This benefits the entire Python community.

### Generic Protocol with Covariant TypeVar That Cannot Be Verified at Runtime

**Situation:** You define `class Repository(Protocol[T_co]):` with `T_co = TypeVar("T_co", covariant=True)` and want to use isinstance for dispatch. The runtime_checkable check cannot verify the generic parameter -- `isinstance(repo, Repository)` is `True` for ALL Repositories regardless of their type parameter.

**Handling:** Do not use generic Protocols with runtime_checkable for type-differentiated dispatch. Instead, use a non-generic runtime_checkable Protocol for the isinstance check, then narrow the generic parameter separately through a `.entity_type` class attribute or by checking specific method return types with callable inspection.

### Overload Signatures That Cover All Cases But mypy Still Complains

**Situation:** You have written @overload signatures for every possible input, but mypy reports "Overloaded function implementation does not accept all possible arguments."

**Handling:** The implementation signature must be a supertype of all overload signatures combined. If overloads accept `str` and `bytes`, the implementation must accept `str | bytes`. If overloads use `Literal["a"]` and `Literal["b"]`, the implementation must accept `str`. The implementation is NOT visible to external callers -- it only needs to be broad enough to accept all overload input combinations. Add `# type: ignore[override]` ONLY if you are certain the logic is correct but the checker cannot verify it due to a known limitation.

### ParamSpec with Methods on a Generic Class

**Situation:** You want to use ParamSpec to wrap an instance method, but the `self` parameter creates complications -- `P` would capture `self` as part of the parameters.

**Handling:** ParamSpec is designed for module-level or standalone function decorators. For method decoration, ParamSpec works but requires careful use of `Concatenate` to exclude `self` from the captured parameter set. `Callable[Concatenate[MyClass, P], R]` captures the method expecting `self` as the first argument. Alternatively, define the decorator outside the class and apply it to the method -- this is simpler and avoids the Concatenate complexity.

### Exhaustive Union Types Growing Over Time

**Situation:** You have a union `Event = LoginEvent | LogoutEvent | ErrorEvent` used in many match/case statements across the codebase. A new `TimeoutEvent` is added to the union. Without tooling, the new case silently falls through to default branches everywhere.

**Handling:** Use `assert_never()` in the default branch of every match/case and if/elif chain that handles this union. When `TimeoutEvent` is added to the union type alias, mypy will immediately report an error at every `assert_never()` call site because `x` is narrowed to `TimeoutEvent` at that point (not `Never`). This turns a silent runtime bug into a compile-time error. Keep the union alias in one canonical location (e.g., `events.py`) and use `TYPE_CHECKING` guards to avoid circular imports when event types are defined across modules.

### Gradual Typing in a 50,000+ Line Legacy Codebase

**Situation:** A large existing Python codebase has no type annotations. Adding `mypy --strict` produces thousands of errors. The team wants to adopt typing without a multi-month freeze.

**Handling:** Use a phased approach:
- Phase 1 (weeks 1-4): Add `mypy` with zero flags, only `ignore_missing_imports = true`. Fix all errors that appear without `--strict`. Establish CI gate at zero mypy errors in default mode.
- Phase 2 (weeks 5-12): Enable `--disallow-untyped-defs` for specific high-value modules (public API, core domain logic). Use `[[tool.mypy.overrides]]` with `disallow_untyped_defs = true` per-module.
- Phase 3 (ongoing): Add `--strict-equality` and `--warn-return-any` globally. Enable `--disallow-any-generics` module by module as annotations are added.
- Use `monkeytype` (a runtime type inference tool) to generate draft annotations from production traces. Review and refine -- do not use them verbatim. This can reduce the annotation effort by 60-70% for covered code paths.
- Never annotate a module partially. Either annotate all public functions or none -- a partially typed module is worse than an untyped module because it creates false confidence about the unannotated portions.

### `Self` Type for Builder and Fluent Interfaces

**Situation:** A base class with fluent methods (returning `self`) causes subclasses to lose their specific type -- `MySubclass().set_name("x")` returns `Base`, not `MySubclass`, breaking the fluent chain.

**Handling:** In Python 3.11+, import `Self` from `typing` and annotate `def set_name(self, name: str) -> Self`. In Python 3.8-3.10, use `typing_extensions.Self` (available since `typing_extensions 4.0`). Do NOT use the old `T = TypeVar("T", bound="Base")` pattern for this -- it requires the method signature to be `def set_name(self: T, name: str) -> T` and is more verbose. The `Self` approach also works correctly with `__init_subclass__` and metaclass patterns where the old TypeVar approach breaks.

---

## Example

**Input:** "I'm building a caching decorator library. I want a `@cached` decorator that wraps any function, preserves its full type signature for callers, supports an optional `ttl: float` parameter on the decorator itself, and returns a `CachedCallable` object that has the same signature as the original function PLUS a `.cache_clear()` method. How do I type this properly?"

**Output:**

```python
# Minimum Python version: 3.10
# For Python 3.8/3.9: replace ParamSpec, Concatenate imports with typing_extensions
from __future__ import annotations

import functools
import time
from collections.abc import Callable
from typing import ParamSpec, TypeVar, overload

# Define TypeVars at module scope -- never inside functions
P = ParamSpec("P")  # Captures the parameter specification of the wrapped function
R = TypeVar("R")    # Captures the return type of the wrapped function


class CachedCallable(Callable[P, R]):  # type: ignore[misc]
    """
    A callable that wraps an original function with caching behavior.

    Has the same signature as the wrapped function (via P and R),
    plus a .cache_clear() method and .cache_info() method.

    NOTE: Callable cannot be directly subclassed at runtime. This class
    is used only as a structural typing target -- we use Protocol below
    for the actual type contract.
    """
    ...


# The correct approach: use Protocol to express the structural contract
# of a callable-plus-methods object. Callable subclassing is not supported
# at runtime in CPython.
from typing import Protocol


class CachedCallable(Protocol[P, R]):
    """
    Structural type for a cached callable.

    Any object conforming to this protocol:
    - Is callable with the same signature as the wrapped function (P -> R)
    - Exposes .cache_clear() to invalidate the cache
    - Exposes .cache_info() returning hit/miss statistics
    """

    def __call__(self, *args: P.args, **kwargs: P.kwargs) -> R:
        """Call the underlying function, returning cached result if available."""
        ...

    def cache_clear(self) -> None:
        """Invalidate all cached results for this callable."""
        ...

    def cache_info(self) -> CacheStats:
        """Return cache hit/miss statistics since last cache_clear()."""
        ...


from dataclasses import dataclass


@dataclass(frozen=True)
class CacheStats:
    """Immutable snapshot of cache performance statistics."""
    hits: int
    misses: int
    maxsize: int | None
    currsize: int


# --- Implementation ---

class _CachedCallableImpl:
    """
    Concrete implementation of CachedCallable[P, R].

    This class is not directly typed as CachedCallable[P, R] because
    Python's runtime generic class machinery does not support ParamSpec
    in __class_getitem__. The structural Protocol match is verified by
    the type checker without runtime enforcement.
    """

    def __init__(
        self,
        func: Callable[..., R],
        ttl: float | None,
    ) -> None:
        self._func = func
        self._ttl = ttl
        self._cache: dict[tuple[object, ...], tuple[R, float]] = {}
        self._hits = 0
        self._misses = 0
        functools.update_wrapper(self, func)

    def __call__(self, *args: object, **kwargs: object) -> R:
        # Build a hashable cache key from positional and keyword args.
        # kwargs are sorted to normalize key="a", other="b" == other="b", key="a"
        cache_key = args + tuple(sorted(kwargs.items()))

        now = time.monotonic()
        if cache_key in self._cache:
            cached_value, cached_at = self._cache[cache_key]
            if self._ttl is None or (now - cached_at) < self._ttl:
                self._hits += 1
                return cached_value
            # TTL expired -- fall through to recompute
            del self._cache[cache_key]

        self._misses += 1
        result = self._func(*args, **kwargs)
        self._cache[cache_key] = (result, now)
        return result

    def cache_clear(self) -> None:
        self._cache.clear()
        self._hits = 0
        self._misses = 0

    def cache_info(self) -> CacheStats:
        return CacheStats(
            hits=self._hits,
            misses=self._misses,
            maxsize=None,  # This implementation is unbounded
            currsize=len(self._cache),
        )


# --- The decorator itself, with two call signatures via @overload ---
#
# The decorator supports two usage patterns:
#   @cached                     -- no arguments, uses default TTL (None = indefinite)
#   @cached(ttl=60.0)          -- with explicit TTL in seconds
#
# Without @overload, the return type would be ambiguous because
# `cached` returns either a CachedCallable (direct use) or a
# Callable[[Callable[P, R]], CachedCallable[P, R]] (factory use).


@overload
def cached(func: Callable[P, R]) -> CachedCallable[P, R]:
    """Direct decorator usage: @cached"""
    ...


@overload
def cached(
    func: None = None,
    *,
    ttl: float | None = None,
) -> Callable[[Callable[P, R]], CachedCallable[P, R]]:
    """Factory usage: @cached(ttl=60.0)"""
    ...


def cached(
    func: Callable[P, R] | None = None,
    *,
    ttl: float | None = None,
) -> CachedCallable[P, R] | Callable[[Callable[P, R]], CachedCallable[P, R]]:
    """
    Cache decorator with optional TTL.

    Usage:
        @cached
        def expensive(x: int) -> str: ...

        @cached(ttl=30.0)
        def time_sensitive(x: int) -> str: ...
    """
    def decorator(f: Callable[P, R]) -> CachedCallable[P, R]:
        impl = _CachedCallableImpl(f, ttl=ttl)
        # The cast here is safe: _CachedCallableImpl structurally satisfies
        # CachedCallable[P, R] -- all three methods are present with correct signatures.
        # We cannot express this directly because Python's runtime cannot parameterize
        # _CachedCallableImpl with P and R.
        return impl  # type: ignore[return-value]  # structural match verified by Protocol

    if func is not None:
        # Called as @cached directly (no parentheses)
        return decorator(func)

    # Called as @cached(ttl=...) -- return the decorator factory
    return decorator


# --- Usage examples showing what callers see ---

def fetch_user(user_id: int) -> str:
    """Simulated expensive database call."""
    return f"User #{user_id}"


# Direct decoration -- mypy infers: CachedCallable[(user_id: int), str]
@cached
def get_user(user_id: int) -> str:
    return fetch_user(user_id)


# Factory decoration with TTL
@cached(ttl=30.0)
def get_user_cached(user_id: int) -> str:
    return fetch_user(user_id)


# Callers retain full type safety:
result: str = get_user(42)          # OK -- user_id: int, returns str
get_user("not_an_int")              # mypy error: Argument 1 has incompatible type "str"; expected "int"
get_user.cache_clear()              # OK -- method preserved on CachedCallable
stats: CacheStats = get_user.cache_info()  # OK -- returns CacheStats


# --- TypeGuard for cache-aware type narrowing ---
# Demonstrates TypeGuard in a realistic context alongside the above

from typing import TypeGuard


def is_cache_stats(value: object) -> TypeGuard[CacheStats]:
    """
    Runtime check that value is a CacheStats instance.

    TypeGuard means: if this returns True, the type checker narrows
    the type of `value` to CacheStats in the True branch ONLY.
    The False branch still has type `object`.

    Do NOT use this for external data validation -- use Pydantic for that.
    This is for internal dispatch where you know the type but the checker does not.
    """
    return (
        isinstance(value, CacheStats)
        and isinstance(value.hits, int)
        and isinstance(value.misses, int)
    )


def log_if_stats(value: object) -> None:
    if is_cache_stats(value):
        # In this branch: value is CacheStats -- full attribute access is safe
        print(f"Cache: {value.hits} hits, {value.misses} misses, {value.currsize} entries")
    else:
        # In this branch: value is still `object` -- no narrowing
        print(f"Not a CacheStats: {value!r}")
```

**Explanation of key decisions:**

**Protocol for `CachedCallable`:** A function object with extra attributes (`cache_clear`, `cache_info`) cannot be expressed as a subclass of `Callable` at runtime. Protocol is the correct tool -- it expresses the structural requirement (callable with matching signature, plus two extra methods) without requiring inheritance. The implementation (`_CachedCallableImpl`) satisfies the Protocol structurally.

**Two `@overload` signatures:** The `cached` decorator supports both `@cached` and `@cached(ttl=60.0)` call patterns. Without overload, the return type would be `CachedCallable | Callable[[Callable], CachedCallable]`, forcing callers to narrow it themselves. The overloads give the type checker exact return type information for each call pattern.

**The `type: ignore[return-value]` comment:** `_CachedCallableImpl` structurally satisfies `CachedCallable[P, R]` but cannot be annotated as such at runtime (Python's generic system does not parameterize concrete class instances with ParamSpec). The targeted ignore suppresses only the specific error code, with a comment explaining why the cast is safe. A bare `# type: ignore` is not used.

**`ParamSpec` placement:** `P` and `R` are defined at module scope, not inside the decorator function. This is mandatory -- TypeVars and ParamSpecs defined at function scope are not honored by type checkers.

**Trade-off Summary:**

| Approach | Type Safety | Runtime Cost | Complexity | Best For |
|---|---|---|---|---|
| Protocol for CachedCallable | High -- full signature preserved | Zero -- structural only | Medium -- requires Protocol understanding | Library APIs, plugin systems |
| ABC for CachedCallable | High -- inheritance enforced | Low -- isinstance fast | Low -- familiar pattern | Internal codebases with controlled implementations |
| `functools.wraps` only, no Protocol | None -- loses cache methods | Zero | None | Scripts, throwaway code |
| `Callable[P, R]` return, ignore cache methods | Medium -- call signature OK, methods untyped | Zero | Low | Quick internal use |
