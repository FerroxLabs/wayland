---
name: python-data-modeling
description: |
  Guides expert-level Python data modeling: Pydantic v2 model design, dataclass vs Pydantic decision tree, TypedDict for API contracts, validation patterns, serialization strategies, and schema evolution. Covers designing data structures that enforce correctness at runtime.
  Use when the user asks about Pydantic models, data validation in Python, dataclass vs Pydantic decisions, TypedDict, or serialization and deserialization patterns.
  Do NOT use when the user asks about Python project setup (use `python-project-setup`), type system features like generics (use `python-type-system`), or general idioms (use `python-idioms`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "python best-practices database"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Python Data Modeling

## When to Use

**Use this skill when:**
- The user asks how to define or redesign Pydantic models, including field constraints, validators, model configuration, or schema customization in Pydantic v2
- The user is deciding between `@dataclass`, `Pydantic BaseModel`, `TypedDict`, `NamedTuple`, or plain dicts for a specific use case and needs a principled recommendation
- The user wants to validate data arriving from an external source -- API requests, webhooks, CSV uploads, config files, environment variables, or third-party API responses
- The user needs to design serialization and deserialization strategies: controlling how models emit JSON, handling aliases, excluding fields, or mapping between snake_case and camelCase
- The user wants to evolve a data schema -- adding fields to an existing model, handling deprecated fields, or versioning API contracts without breaking existing consumers
- The user asks about Pydantic BaseSettings or similar patterns for loading and validating application configuration from environment variables and `.env` files
- The user needs to model complex domain hierarchies: polymorphic types using discriminated unions, nested models, recursive structures, or models with inter-field constraints
- The user wants to define reusable validation types using `Annotated` and share them across multiple models in a codebase

**Do NOT use this skill when:**
- The user wants to set up a Python project from scratch, configure `pyproject.toml`, or install dependencies → use `python-project-setup`
- The user is asking about Python's type system at the generic/parametric level: `TypeVar`, `Generic[T]`, `Protocol`, covariance, or type narrowing → use `python-type-system`
- The user wants general Python idioms and code style: comprehensions, context managers, decorators as language features → use `python-idioms`
- The user is writing tests for data models (mocking, hypothesis property-based testing of validators) → use `python-testing-patterns`
- The user wants structured error handling patterns beyond what validators raise → use `python-error-handling`
- The user is asking specifically about ORM models -- SQLAlchemy `DeclarativeBase`, Django ORM field definitions -- as those are persistence-layer patterns with their own mapping concerns, not data modeling in the Pydantic/dataclass sense
- The user is asking about async data streaming or message queue schema definitions (Avro, Protobuf, JSON Schema as file formats) as primary artifacts -- these have dedicated schema registry patterns

## Process

### Step 1: Classify the Data Modeling Need

Apply this decision tree precisely. Getting this wrong leads to over-engineering or missing validation at the wrong boundary.

- **External data with validation required** (API requests, webhook payloads, config files, user form submissions, CSV rows): use `Pydantic BaseModel`. Pydantic v2 uses Rust-backed validation, benchmarks at ~100x faster than pure-Python alternatives, and fails fast with structured `ValidationError` containing all field errors at once.
- **Internal domain objects with no external validation** (objects constructed only within your own code, passed between internal services): use `@dataclass`. A frozen dataclass is hashable and usable as a dict key or set element -- critical for domain value objects like `Money`, `UserId`, or `Coordinate`.
- **Typed dict-like data for type-checker contracts only** (API response shapes that are already validated, data passed to functions that accept dict-like args, TypedDict interop with JSON libraries): use `TypedDict`. Zero runtime overhead; purely a type annotation tool. Use `Required` and `NotRequired` to model optional keys.
- **Immutable record types used as tuple-like values** (lightweight coordinate pairs, 2--3 field named records that benefit from tuple unpacking): use `NamedTuple`. These are actual tuples at runtime, so they serialize natively with `json.dumps` and are interoperable with code expecting sequences.
- **Application configuration loaded from environment variables**: use `pydantic-settings` (`BaseSettings`). It supports `.env` files, environment variable prefix namespacing, type coercion from string env vars (e.g., `"true"` → `bool`), and nested settings via JSON-encoded env vars.
- **High-throughput internal pipeline records** (processing millions of records in a tight loop where even Pydantic v2 overhead is measurable at scale): validate once at the inbound boundary with Pydantic, convert to a `dataclass(slots=True)` internal representation for efficient in-memory processing.

### Step 2: Design the Pydantic Model Architecture

When you have determined Pydantic is the right tool, design the model structure before writing any code.

- **Separate models by concern.** Define at minimum: an inbound model (`OrderCreate`, `UserRequest`) that validates external input, a domain model (`Order`, `User`) that represents the internal state, and optionally a response model (`OrderResponse`, `UserResponse`) that controls what serializes to API clients. Never let the persistence or domain model leak directly into API output -- it creates accidental coupling where adding an internal field changes the API contract.
- **Define reusable annotated types first.** Before writing any model, identify fields that share the same validation semantics across models. `NonEmptyStr = Annotated[str, Field(min_length=1, max_length=255)]`, `PositiveDecimal = Annotated[Decimal, Field(gt=0, decimal_places=2)]`, `HttpsUrl` (Pydantic's built-in). Place these in a `types.py` module. Reuse -- do not duplicate Field constraints inline.
- **Choose `model_config` settings explicitly.** Never leave `model_config` unset. At minimum configure: `str_strip_whitespace=True` (prevents whitespace-only strings from passing `min_length=1` constraints), `validate_default=True` (ensures default values are also validated -- catches bugs at class definition time, not at runtime), `populate_by_name=True` if using alias generators.
- **Use `alias_generator` for API boundary translation.** If the external API uses camelCase and your Python code uses snake_case (the standard case), set `alias_generator=to_camel` (from `pydantic.alias_generators`) and `populate_by_name=True`. This means both `createdAt` and `created_at` are accepted for input, and you control which name is used for output via `model_dump(by_alias=True)`.
- **Layer validators in the correct order.** Pydantic v2 validation order: (1) field-level type coercion, (2) `field_validator` with `mode="before"` (raw input, before type coercion), (3) type annotation validation, (4) `field_validator` with `mode="after"` (already typed value, most common), (5) `model_validator(mode="after")` (all fields validated, cross-field checks). Putting a cross-field check in a `field_validator` is a code smell -- use `model_validator`.
- **Use `model_validator(mode="wrap")` for complex transformation.** When you need to preprocess the raw dict before any field validation (e.g., remapping a legacy `first_name`/`last_name` split into a `full_name` field), use `mode="wrap"` with a `handler` argument. This is more powerful than `mode="before"` for structural transformations.
- **Prefer `Literal` types over string enums for protocol-level fields.** For discriminator fields in discriminated unions, use `Literal["order_created"]` rather than `StrEnum`. Pydantic generates tighter JSON Schema with `const` values for `Literal`, which is more useful for documentation and client code generation.

### Step 3: Define Field-Level Validation with Precision

Field-level validation is where most correctness guarantees live. Apply these patterns:

- **Use `Field()` constraints for numeric bounds.** `ge` (≥), `gt` (>), `le` (≤), `lt` (<) correspond to JSON Schema `minimum`/`exclusiveMinimum`. For financial data, always use `Decimal` with `decimal_places=2` rather than `float` -- floating-point rounding at the field level causes silent accounting errors. Example: `amount: Annotated[Decimal, Field(ge=Decimal("0.00"), decimal_places=2)]`.
- **Use `pattern=` for string format validation.** For fields where regex is the source of truth (postal codes, phone numbers, ISBNs, slug identifiers), specify `pattern=r"^[a-z0-9-]{3,64}$"` in `Field()`. This also exports correctly to JSON Schema for API documentation. Do not validate regex in a `field_validator` when `pattern=` suffices -- it duplicates logic and doesn't appear in the schema.
- **Use `field_validator` only for logic that cannot be expressed as a constraint.** Correct uses: normalizing a value (e.g., uppercasing a country code, stripping internal whitespace from a name), business-logic checks that require computation (e.g., verifying a Luhn checksum on a card number), or cross-referencing a small static lookup (e.g., validating a currency code against an ISO 4217 set). Incorrect uses: range checks, length checks, regex -- use `Field()` constraints instead.
- **Return the (possibly transformed) value from `field_validator`.** In Pydantic v2, `field_validator` must always return the value. Returning `None` implicitly sets the field to `None`, which is almost never intended. Raise `ValueError` (never `TypeError` or custom exceptions) for invalid data -- Pydantic wraps `ValueError` into `ValidationError` automatically.
- **Use `BeforeValidator` and `AfterValidator` via `Annotated` for reusable normalization.** Instead of a `field_validator` that only normalizes, define `UpperCaseStr = Annotated[str, AfterValidator(str.upper)]` and apply it to all fields that need it. This composes cleanly and avoids validator boilerplate on each model.

### Step 4: Design Dataclass Models Correctly

When dataclasses are appropriate, apply these patterns to avoid common pitfalls:

- **Use `slots=True` for any dataclass instantiated at high frequency.** `@dataclass(slots=True)` generates `__slots__` automatically (Python 3.10+), reducing per-instance memory from approximately 264 bytes to approximately 56 bytes for a simple 3-field object. This matters when processing millions of records. The trade-off: slotted dataclasses cannot have instance `__dict__`, so dynamic attribute assignment is prohibited -- which is desirable for value objects anyway.
- **Use `frozen=True` for value objects.** A frozen dataclass generates `__hash__` and makes all fields immutable. This enables use as dict keys, set members, and LRU cache keys. Combine with `slots=True` for maximum efficiency: `@dataclass(frozen=True, slots=True)`.
- **Never use mutable defaults.** `items: list[str] = []` in a dataclass is a `TypeError` in Python 3.7+ (the interpreter will raise it at class definition time). Use `field(default_factory=list)`. For nested dataclasses as defaults, use `field(default_factory=YourDataclass)`.
- **Use `__post_init__` for derived fields and invariant enforcement.** Compute derived fields (e.g., `self.full_name = f"{self.first_name} {self.last_name}"`) and enforce business invariants (raise `ValueError` if `end_date < start_date`) here. In a frozen dataclass, use `object.__setattr__(self, "full_name", ...)` since direct assignment is blocked.
- **Use `kw_only=True` (Python 3.10+) to prevent positional argument ambiguity.** For dataclasses with more than 3 fields, `kw_only=True` forces all fields to be specified by name. This makes construction sites self-documenting and prevents argument-order bugs that type checkers don't always catch.
- **Use `field(compare=False)` for implementation-detail fields.** Fields like `_cache`, `created_at` timestamps, or internal state flags that should not affect equality comparison should use `compare=False`. This is critical for domain value objects where equality should reflect identity, not incidental metadata.

### Step 5: Design Serialization Strategies

Serialization is where data models cross process boundaries. Design it explicitly.

- **Pydantic `model_dump()` options you must know.** `model_dump(mode="json")` performs the same type coercion as JSON serialization but returns a dict (useful when you need a dict but with JSON-safe values like strings instead of `datetime` objects). `model_dump(exclude_none=True)` removes fields whose value is `None` -- use for sparse API payloads. `model_dump(include={"field1", "field2"})` for projection to a subset. `model_dump(by_alias=True)` uses alias names rather than Python attribute names.
- **Use `model_dump_json()` for performance-critical serialization.** `model_dump_json()` uses Pydantic's Rust backend and is 2--4x faster than `json.dumps(model.model_dump())`. Always prefer it when emitting JSON directly to a response body or file.
- **Define `model_serializer` for custom output shapes.** When the serialized form structurally differs from the model (e.g., flattening a nested object, renaming fields conditionally), use `@model_serializer(mode="wrap")`. This is cleaner than post-processing `model_dump()` output in the calling code.
- **Never use `dataclasses.asdict()` when performance matters.** `dataclasses.asdict()` recursively copies all nested structures and is implemented in pure Python. For hot serialization paths, write an explicit `to_dict()` method or use a `__slots__` aware serializer. For JSON, `dataclasses.asdict()` still requires a second `json.dumps()` pass, making it two full traversals.
- **Use separate response models to enforce API output stability.** Define `UserResponse(BaseModel)` with only the fields you intend to expose. Compute it from `User` domain objects with a class method: `UserResponse.from_domain(user)`. This prevents accidentally exposing internal fields (hashed passwords, audit timestamps, internal IDs) when the domain model grows.
- **Handle `datetime` serialization explicitly.** Pydantic v2 serializes `datetime` to ISO 8601 strings by default. If your API contract requires Unix timestamps, use `field_serializer`: `@field_serializer("created_at") def serialize_dt(self, v: datetime) -> int: return int(v.timestamp())`. Always store `datetime` objects as timezone-aware UTC internally, regardless of what format you serialize to.

### Step 6: Handle Schema Evolution and Backward Compatibility

Data models change over time. Design for it from the start.

- **Additive changes are safe when fields have defaults.** Adding `new_field: str = ""` or `new_field: str | None = None` to a Pydantic model is backward compatible -- old payloads without the field will use the default. Adding a required field (no default) is a breaking change. Track required vs. optional changes in your changelog.
- **Use `model_validator(mode="before")` for field renaming migration.** When renaming `phone` to `phone_number`, add a `mode="before"` validator that copies `data["phone"]` to `data["phone_number"]` if `"phone"` is present. This allows a gradual migration window where both old and new field names are accepted. Remove the migration validator after all producers have migrated.
- **Use discriminated unions for polymorphic event schemas.** When a field can be one of several model shapes (e.g., `event: OrderCreated | OrderShipped | OrderCancelled`), define a `type` field as `Literal["order_created"]` etc. on each model, then use `Annotated[Union[OrderCreated, OrderShipped, OrderCancelled], Field(discriminator="type")]`. Pydantic selects the correct model in O(1) by the discriminator value rather than trying all models in sequence. This is 10--50x faster than non-discriminated unions for large union types.
- **Version models explicitly for breaking changes.** For API contracts where you cannot break consumers, create `v1/models.py` and `v2/models.py`. Use an adapter layer (`v2.Order.from_v1(v1_order)`) to translate between versions internally. Do not try to handle version differences with optional fields beyond one generation.
- **Use `model_rebuild()` after defining mutually recursive models.** Models like `Category` that contain a list of `Category` children require a forward reference: `children: list["Category"] = []`. After the class is defined, call `Category.model_rebuild()` to resolve the forward reference. In complex module structures, call `model_rebuild()` in a module-level initialization function that runs after all models are imported.

### Step 7: Validate at the Right Boundary

Knowing where to validate is as important as knowing how.

- **Validate at the process entry point, not deep in business logic.** Parse external data into a validated model at the first point it enters your system: the request handler, the Celery task entry, the file reader function. Once data is in a typed model, treat it as trusted throughout the call stack. Re-validating at every layer adds overhead without safety benefit.
- **Use `model_validate_json()` instead of `json.loads()` + `model_validate()`.** `YourModel.model_validate_json(raw_bytes)` is a single-pass operation using Pydantic's Rust JSON parser. It is 20--30% faster than parsing JSON separately and then validating the resulting dict. Use it whenever you receive raw JSON bytes or strings.
- **Catch `ValidationError` at the boundary and translate to domain errors.** Do not let `pydantic.ValidationError` propagate to callers who don't know or care about Pydantic. At the API layer, translate it to a structured HTTP 422 response. In a service layer, translate it to a domain exception (`InvalidOrderData(errors=e.errors())`). Use `error.errors()` to get a list of dicts with `loc` (field path), `msg` (human-readable message), `type` (error code), and `input` (the failing value).
- **Use `TypeAdapter` for validating non-model types.** To validate a raw `list[int]` or `dict[str, float]` without defining a full model, use `TypeAdapter`: `ta = TypeAdapter(list[int]); ta.validate_python([1, 2, "3"])`. This applies the same Pydantic validation pipeline to any type annotation. Also useful for validating `Union` types without a wrapper model.

### Step 8: Optimize for Performance in High-Throughput Contexts

When data modeling is on a hot path (>10,000 validations/second), apply targeted optimizations.

- **Profile before optimizing.** Use `cProfile` or `pyinstrument` to confirm Pydantic validation is the bottleneck before making architectural changes. Premature optimization here (switching to raw dicts) destroys type safety for negligible gain.
- **Use `model_construct()` to skip validation for trusted internal data.** `MyModel.model_construct(field1=val1, field2=val2)` bypasses all validation and creates the model directly. Use only for data you have already validated or generated internally -- never for external input. This is 5--10x faster than `model_validate()` and appropriate for database read paths where the DB schema enforces constraints.
- **Batch validate with `TypeAdapter` for list inputs.** `TypeAdapter(list[MyModel]).validate_python(raw_list)` is faster than `[MyModel.model_validate(item) for item in raw_list]` because Pydantic can process the entire list in a single Rust call. The speedup is approximately 15--25% for lists of 100+ items.
- **Reuse `TypeAdapter` instances as module-level singletons.** Constructing `TypeAdapter(MyType)` has non-trivial overhead for building the validator. Create it once at module level and reuse: `_adapter = TypeAdapter(list[MyModel])`. Constructing it inside a function called in a hot loop is a common performance mistake.

## Output Format

When responding to a user's data modeling question, structure your answer as follows:

---

### Decision

State which modeling approach is appropriate and why, citing the specific factors from the user's context that drove the decision (external data, performance constraints, API boundary, etc.).

### Model Architecture

Describe the model layer structure before showing code:
- Inbound/request models and their validation purpose
- Domain models and what invariants they enforce
- Response/output models and what they expose
- Shared annotated types to define centrally

### Implementation

```python
from __future__ import annotations

# Standard library imports
from datetime import datetime, timezone
from decimal import Decimal
from enum import StrEnum
from typing import Annotated, Literal

# Third-party imports
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    TypeAdapter,
    field_serializer,
    field_validator,
    model_validator,
)
from pydantic.alias_generators import to_camel

# ── Reusable annotated types (define in types.py for sharing) ──────────────────
NonEmptyStr = Annotated[str, Field(min_length=1, max_length=255)]
PositiveDecimal = Annotated[Decimal, Field(gt=Decimal("0"), decimal_places=2)]
SlugStr = Annotated[str, Field(pattern=r"^[a-z0-9-]{3,64}$")]

# ── Enums ─────────────────────────────────────────────────────────────────────
class StatusEnum(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"

# ── Inbound model (validates external data) ───────────────────────────────────
class EntityCreate(BaseModel):
    """
    Validates incoming [entity] creation requests from [source].
    Enforces: [list of key invariants].
    """
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_default=True,
        populate_by_name=True,
        alias_generator=to_camel,  # remove if API is snake_case
    )

    field_name: NonEmptyStr = Field(
        ...,
        description="Human-readable description of what this field represents.",
        examples=["example_value"],
    )
    optional_field: str | None = Field(
        default=None,
        description="Present only when [condition].",
    )
    numeric_field: PositiveDecimal
    status: StatusEnum = StatusEnum.ACTIVE

    @field_validator("field_name", mode="after")
    @classmethod
    def normalize_field_name(cls, v: str) -> str:
        # Only use field_validator for logic Field() constraints cannot express.
        return v.lower()

    @model_validator(mode="after")
    def validate_cross_field_invariant(self) -> "EntityCreate":
        # Cross-field validation: check relationships between fields.
        if self.status == StatusEnum.INACTIVE and self.optional_field is None:
            raise ValueError("optional_field is required when status is inactive")
        return self

# ── Response model (controls API output) ──────────────────────────────────────
class EntityResponse(BaseModel):
    """API response shape. Constructed from domain objects, never mutated."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    id: str
    field_name: str
    status: StatusEnum
    created_at: datetime

    @field_serializer("created_at")
    def serialize_created_at(self, v: datetime) -> str:
        return v.isoformat()

    @classmethod
    def from_domain(cls, domain_obj: object) -> "EntityResponse":
        # Adapter pattern: translate domain model to response shape.
        return cls(
            id=str(domain_obj.id),  # type: ignore[attr-defined]
            field_name=domain_obj.field_name,  # type: ignore[attr-defined]
            status=domain_obj.status,  # type: ignore[attr-defined]
            created_at=domain_obj.created_at,  # type: ignore[attr-defined]
        )
```

### Validation and Error Handling at the Boundary

```python
from pydantic import ValidationError

def handle_create_request(raw_payload: dict) -> EntityResponse:
    try:
        request = EntityCreate.model_validate(raw_payload)
    except ValidationError as e:
        # Translate Pydantic errors to domain/API errors.
        # e.errors() returns list of dicts with loc, msg, type, input.
        raise InvalidRequestError(errors=e.errors()) from e

    domain_obj = create_entity(request)
    return EntityResponse.from_domain(domain_obj)
```

### Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Model type | Pydantic BaseModel | External data with validation |
| Alias strategy | `to_camel` alias generator | API uses camelCase |
| Serialization | `model_dump_json()` | Performance, single Rust pass |
| Cross-field validation | `model_validator(mode="after")` | Needs all fields validated first |

---

## Rules

1. **NEVER validate external data without Pydantic (or equivalent) at the entry point.** Using `if "field" in data and isinstance(data["field"], str)` scattered through business logic is unmaintainable and misses coercion, normalization, and schema documentation. Validate once, cleanly, at the boundary.

2. **ALWAYS use Pydantic v2 API.** The v2 API (`field_validator`, `model_validator`, `model_dump`, `model_config = ConfigDict(...)`) is not backward compatible with v1. Mixing `@validator` (v1) with `@field_validator` (v2) in the same model causes `PydanticUserError` at class definition time. Use `pip show pydantic | grep Version` to confirm the installed version is ≥ 2.0.0.

3. **NEVER use `float` for monetary or financial values.** `0.1 + 0.2 == 0.30000000000000004` in Python. Use `Decimal` with explicit `decimal_places` constraints. Financial APIs that send amounts as floats require conversion at the boundary: `Decimal(str(float_value))` -- never `Decimal(float_value)` which preserves the floating-point imprecision.

4. **ALWAYS store `datetime` objects as timezone-aware UTC.** Store `datetime` objects created with `datetime.now(tz=timezone.utc)` or parsed with `datetime.fromisoformat()`. Pydantic v2 accepts naive datetimes by default but this is a trap -- configure `model_config = ConfigDict(... )` alongside a validator that raises for naive datetimes in any model that handles timestamps crossing timezone boundaries.

5. **NEVER expose internal domain models or ORM models directly in API responses.** SQLAlchemy model attributes, internal audit fields, hashed passwords, internal state machines, and foreign key IDs are all accidental leaks if you `model_dump()` a domain object directly into an API response. Define `*Response` models with only the fields you explicitly intend to expose.

6. **ALWAYS use `field(default_factory=...)` for mutable defaults in dataclasses.** `@dataclass class Foo: items: list = []` raises `ValueError` in Python 3.7+ at class definition time. The correct form is `items: list[str] = field(default_factory=list)`. For Pydantic, mutable defaults work differently -- Pydantic deep-copies them automatically -- but still use `default_factory` for clarity and consistency.

7. **NEVER use `model_construct()` on untrusted input.** `model_construct()` bypasses all validation, all validators, and all type coercion. It is for internal use only -- when you have data that was already validated or that you generated programmatically. Calling it on user input is equivalent to disabling your safety net.

8. **ALWAYS define discriminator fields on all members of a discriminated union.** A union without a discriminator causes Pydantic to attempt validation against each member in order, failing and retrying until one succeeds (O(n) in the number of union members). For a union of 5 models, a discriminated union is 5x faster. For a union of 20 event types (common in event-driven systems), it is 20x faster.

9. **NEVER use `Optional[X]` as a shortcut when you mean "this field has a default".** `Optional[str]` means the value can be `None` -- it does not mean the field has a default. `field: Optional[str]` with no default is still required at construction and will raise `ValidationError` if absent. Use `field: str | None = None` when you mean "absent becomes None" and `field: str = "default"` when you mean "absent becomes a default string".

10. **ALWAYS run `mypy` or `pyright` with strict settings on models.** Pydantic v2 ships a mypy plugin (`pydantic.mypy`) that understands model field types. Add `[mypy] plugins = pydantic.mypy` and `[pydantic-mypy] init_forbid_extra = true` to `mypy.ini`. Without the plugin, mypy treats model constructors as accepting `**kwargs: Any`, defeating the entire point of typed models.

## Edge Cases

### Circular References Between Models

Two models that reference each other (e.g., `User` has a `list[Post]` and `Post` has an `author: User`) cause `NameError` at class definition time if you import both at module level.

**Resolution:** Use `from __future__ import annotations` at the top of the file (defers all annotation evaluation to strings), then call `User.model_rebuild()` and `Post.model_rebuild()` after both classes are defined. Place model rebuild calls in a `_rebuild_models()` function at the bottom of the module and call it once. For cross-module circular references, use `TYPE_CHECKING` guard imports: `if TYPE_CHECKING: from .post import Post` -- the string annotation handles the runtime reference, and the `TYPE_CHECKING` import satisfies mypy without creating a runtime circular import.

### Migrating a Live Codebase from Pydantic v1 to v2

The `bump-pydantic` CLI tool automates ~70% of v1-to-v2 migrations: it handles `@validator` → `@field_validator`, `@root_validator` → `@model_validator`, `Config` inner class → `model_config = ConfigDict(...)`, `.dict()` → `.model_dump()`, `.json()` → `.model_dump_json()`, and `.parse_raw()` → `.model_validate_json()`. Run it with `bump-pydantic --target-version v2 src/`. After the automated pass, manually audit: `validator` calls that used `always=True` (now `validate_default=True` in `ConfigDict`), `validator` calls with `each_item=True` (now handle by applying the validator to `list[T]` typed fields), and `__fields__` access (now `model_fields`).

### Models with Dynamic or Unknown Fields

When a third-party API returns fields you don't control and you must preserve them:

```python
class FlexibleModel(BaseModel):
    model_config = ConfigDict(extra="allow")  # "ignore" drops extras, "forbid" raises
    known_field: str

# Access extra fields:
obj = FlexibleModel(known_field="x", surprise="y")
obj.model_extra  # {"surprise": "y"}
obj.model_dump()  # includes extras
```

Use `extra="allow"` for pass-through proxy models. Use `extra="forbid"` for internal configuration models where unknown keys indicate a misconfiguration. Use `extra="ignore"` (the default) for public API inbound models where you want to silently discard fields -- this is the safest default for public-facing endpoints.

### Very Large Payloads (Thousands of Nested Items)

Pydantic v2 validation of a list of 10,000 complex nested models takes approximately 50--200ms depending on model complexity. For batch API endpoints that accept large arrays:

1. Validate structure (item count, top-level shape) before running full item validation.
2. Use `TypeAdapter(list[ItemModel]).validate_python(raw_list)` rather than a model with a list field -- this avoids one extra wrapper model traversal.
3. Consider streaming validation: process items in chunks of 500--1000, catching `ValidationError` per chunk to provide partial success responses.
4. For truly hot paths (>100,000 items/second), validate only a structural sample and rely on database constraints for the rest -- but document this trade-off explicitly.

### Schema Evolution with Deprecated Fields

When a field is being removed, do not remove it immediately. Apply a two-phase deprecation:

**Phase 1 (deprecation period):** Mark the field as deprecated with `Field(deprecated=True)` (Pydantic v2.4+). This causes Pydantic to emit a `PydanticDeprecatedSince20` warning when the field is used. Keep the field as `Optional` so existing producers still work.

**Phase 2 (removal):** Remove the field entirely. If old payloads still arrive, add a `model_validator(mode="before")` that silently drops the old field: `data.pop("old_field_name", None); return data`. This prevents validation errors from old producers during the transition window.

### TypedDict vs Pydantic for Internal API Response Typing

TypedDict has zero runtime overhead (it is erased at runtime) and is the right choice for typing the return shape of functions that already return plain dicts (e.g., Django REST Framework serializers, third-party library responses). Pydantic response models carry runtime overhead but offer `model_dump(by_alias=True)` and `model_dump_json()`.

Use TypedDict when:
- You're adding types to an existing codebase that already returns dicts and you cannot change the return type
- You're typing function parameters that accept dict-like data from a library with its own serialization
- You need to interop with `json.dumps` without any conversion step

Use Pydantic response models when:
- You control the serialization path and want a single `model_dump_json()` call
- You need field-level serialization customization (`field_serializer`, alias generation)
- The response model benefits from computed properties or from-domain factory methods

### Pydantic BaseSettings with Complex Configuration

`pydantic-settings` `BaseSettings` loads values from environment variables, `.env` files, AWS Secrets Manager, and other sources in a configurable priority order. Common pitfalls:

- **Nested settings with JSON env vars:** A nested model field like `database: DatabaseSettings` requires the environment variable to be JSON-encoded: `DATABASE='{"host":"localhost","port":5432}'`. Use this for staging/production configuration. For local development, use a `.env` file with `DatabaseSettings`-prefixed variables by setting `model_config = SettingsConfigDict(env_nested_delimiter="__")` which maps `DATABASE__HOST=localhost` to `database.host`.
- **Secret files:** `BaseSettings` supports `secrets_dir` for reading secrets from mounted Kubernetes secret files. Set `model_config = SettingsConfigDict(secrets_dir="/run/secrets")` and create files named after the field (e.g., `/run/secrets/database_password`). This is the correct pattern for container orchestration environments.
- **Validator execution order:** `BaseSettings` runs field validators after loading from the environment, so `@field_validator("database_url", mode="after")` will see the already-coerced string. Use this to normalize URLs, validate connection string format, or raise at startup if a required secret is missing -- failing fast at startup rather than at first database call.

## Example

**Input:** "I'm building a webhook processor that receives Stripe-style payment events. Events can be `payment.succeeded`, `payment.failed`, or `refund.created`. Each event type has different fields. The payload comes as raw JSON bytes. I need to validate, route, and serialize these to our internal event store. What's the right data modeling approach?"

**Output:**

### Decision

This is a classic discriminated union problem with a JSON entry boundary. Three model shapes share a common envelope (`id`, `type`, `created`, `livemode`) but carry different payload structures. Pydantic v2's discriminated unions with `Literal` discriminators handle this in O(1) without trying each model in sequence. We validate at the entry point with `model_validate_json()`, then dispatch to handlers by type. Internal storage uses a separate persistence shape to avoid coupling the storage schema to the inbound API schema.

### Model Architecture

- **Inbound envelope models**: One per event type, sharing a `BaseEvent` with the common fields. Discriminator field `type` selects the correct model.
- **Payload models**: Nested models for `PaymentSucceededData`, `PaymentFailedData`, `RefundCreatedData` carrying event-specific fields.
- **Internal event model**: A storage-oriented model that flattens what we need and adds internal metadata (received_at, processing_id).
- **Shared types**: `MoneyAmount` (Decimal with currency), `StripeId` (prefixed string pattern).

### Implementation

```python
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Annotated, Literal, Union

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    TypeAdapter,
    field_validator,
    model_validator,
)


# ── Shared annotated types ────────────────────────────────────────────────────

# Stripe amounts are always integers in the smallest currency unit (cents).
# We convert to Decimal at the boundary to prevent float arithmetic errors.
CentsAmount = Annotated[int, Field(ge=0, le=99_999_999)]  # max ~$1M in cents

StripeObjectId = Annotated[
    str,
    Field(pattern=r"^[a-zA-Z0-9_]{8,255}$", description="Stripe object identifier"),
]


# ── Payload models (event-specific data) ─────────────────────────────────────

class PaymentMethodDetails(BaseModel):
    """Nested payment method info. Only fields we care about."""
    model_config = ConfigDict(extra="ignore")  # Stripe adds fields over time

    brand: str | None = None  # "visa", "mastercard", etc.
    last4: str | None = Field(default=None, pattern=r"^\d{4}$")
    funding: str | None = None  # "credit", "debit", "prepaid"


class PaymentSucceededData(BaseModel):
    """Fields present only in payment.succeeded events."""
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    payment_intent_id: StripeObjectId = Field(alias="id")
    amount: CentsAmount
    amount_received: CentsAmount
    currency: str = Field(min_length=3, max_length=3, description="ISO 4217 currency code")
    customer_id: StripeObjectId | None = Field(default=None, alias="customer")
    payment_method_details: PaymentMethodDetails | None = None
    receipt_email: str | None = None

    @field_validator("currency", mode="after")
    @classmethod
    def normalize_currency(cls, v: str) -> str:
        return v.upper()

    @model_validator(mode="after")
    def validate_received_le_charged(self) -> "PaymentSucceededData":
        # amount_received can be less than amount for partial captures.
        # It cannot exceed the original charged amount.
        if self.amount_received > self.amount:
            raise ValueError(
                f"amount_received ({self.amount_received}) exceeds "
                f"amount ({self.amount}) -- invalid Stripe payload"
            )
        return self

    @property
    def amount_decimal(self) -> Decimal:
        """Convert cents to decimal currency units."""
        return Decimal(self.amount) / Decimal("100")


class PaymentFailedData(BaseModel):
    """Fields present only in payment.failed events."""
    model_config = ConfigDict(extra="ignore")

    payment_intent_id: StripeObjectId = Field(alias="id")
    amount: CentsAmount
    currency: str = Field(min_length=3, max_length=3)
    failure_code: str | None = None   # e.g., "card_declined", "insufficient_funds"
    failure_message: str | None = Field(default=None, max_length=500)
    customer_id: StripeObjectId | None = Field(default=None, alias="customer")

    @field_validator("currency", mode="after")
    @classmethod
    def normalize_currency(cls, v: str) -> str:
        return v.upper()


class RefundCreatedData(BaseModel):
    """Fields present only in refund.created events."""
    model_config = ConfigDict(extra="ignore")

    refund_id: StripeObjectId = Field(alias="id")
    payment_intent_id: StripeObjectId | None = Field(
        default=None, alias="payment_intent"
    )
    amount: CentsAmount
    currency: str = Field(min_length=3, max_length=3)
    reason: str | None = None  # "duplicate", "fraudulent", "requested_by_customer"
    status: Literal["pending", "succeeded", "failed", "canceled"]

    @field_validator("currency", mode="after")
    @classmethod
    def normalize_currency(cls, v: str) -> str:
        return v.upper()

    @property
    def amount_decimal(self) -> Decimal:
        return Decimal(self.amount) / Decimal("100")


# ── Discriminated union event envelope models ─────────────────────────────────

class _BaseEvent(BaseModel):
    """
    Common Stripe webhook envelope fields.
    All events share these regardless of type.
    """
    model_config = ConfigDict(
        extra="ignore",           # Stripe adds envelope fields over time
        str_strip_whitespace=True,
        populate_by_name=True,
    )

    event_id: str = Field(alias="id", description="Stripe event ID (evt_...)")
    created: int = Field(description="Unix timestamp of event creation")
    livemode: bool = Field(description="False for test mode events")
    api_version: str | None = None

    @property
    def created_at(self) -> datetime:
        return datetime.fromtimestamp(self.created, tz=timezone.utc)


class PaymentSucceededEvent(_BaseEvent):
    """Stripe payment.succeeded webhook event."""
    type: Literal["payment_intent.succeeded"]
    data: PaymentSucceededData

    @model_validator(mode="before")
    @classmethod
    def extract_data_object(cls, v: dict) -> dict:
        # Stripe wraps the object in data.object -- unwrap it.
        if isinstance(v.get("data"), dict) and "object" in v["data"]:
            v = {**v, "data": v["data"]["object"]}
        return v


class PaymentFailedEvent(_BaseEvent):
    """Stripe payment.failed webhook event."""
    type: Literal["payment_intent.payment_failed"]
    data: PaymentFailedData

    @model_validator(mode="before")
    @classmethod
    def extract_data_object(cls, v: dict) -> dict:
        if isinstance(v.get("data"), dict) and "object" in v["data"]:
            v = {**v, "data": v["data"]["object"]}
        return v


class RefundCreatedEvent(_BaseEvent):
    """Stripe refund.created webhook event."""
    type: Literal["refund.created"]
    data: RefundCreatedData

    @model_validator(mode="before")
    @classmethod
    def extract_data_object(cls, v: dict) -> dict:
        if isinstance(v.get("data"), dict) and "object" in v["data"]:
            v = {**v, "data": v["data"]["object"]}
        return v


# ── Discriminated union (O(1) dispatch by "type" field) ───────────────────────

StripeEvent = Annotated[
    Union[PaymentSucceededEvent, PaymentFailedEvent, RefundCreatedEvent],
    Field(discriminator="type"),
]

# TypeAdapter enables direct validation without a wrapper model.
# Reuse this singleton -- construction is non-trivial cost.
_stripe_event_adapter: TypeAdapter[StripeEvent] = TypeAdapter(StripeEvent)


# ── Internal storage model ────────────────────────────────────────────────────

class StoredEvent(BaseModel):
    """
    Internal event store record. Decoupled from Stripe's schema.
    Constructed from validated inbound events; never directly from raw input.
    """
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_default=True,
    )

    processing_id: str = Field(description="Our internal idempotency key")
    stripe_event_id: str
    event_type: str
    amount_cents: int | None
    currency: str | None
    customer_id: str | None
    failure_code: str | None
    is_livemode: bool
    event_occurred_at: datetime
    received_at: datetime = Field(
        default_factory=lambda: datetime.now(tz=timezone.utc)
    )
    raw_type: str  # Original Stripe type string, preserved for debugging

    @classmethod
    def from_payment_succeeded(
        cls, event: PaymentSucceededEvent, processing_id: str
    ) -> "StoredEvent":
        return cls(
            processing_id=processing_id,
            stripe_event_id=event.event_id,
            event_type="payment_succeeded",
            amount_cents=event.data.amount_received,
            currency=event.data.currency,
            customer_id=event.data.customer_id,
            failure_code=None,
            is_livemode=event.livemode,
            event_occurred_at=event.created_at,
            raw_type=event.type,
        )

    @classmethod
    def from_payment_failed(
        cls, event: PaymentFailedEvent, processing_id: str
    ) -> "StoredEvent":
        return cls(
            processing_id=processing_id,
            stripe_event_id=event.event_id,
            event_type="payment_failed",
            amount_cents=event.data.amount,
            currency=event.data.currency,
            customer_id=event.data.customer_id,
            failure_code=event.data.failure_code,
            is_livemode=event.livemode,
            event_occurred_at=event.created_at,
            raw_type=event.type,
        )

    @classmethod
    def from_refund_created(
        cls, event: RefundCreatedEvent, processing_id: str
    ) -> "StoredEvent":
        return cls(
            processing_id=processing_id,
            stripe_event_id=event.event_id,
            event_type="refund_created",
            amount_cents=event.data.amount,
            currency=event.data.currency,
            customer_id=None,  # Refunds don't carry customer_id directly
            failure_code=None,
            is_livemode=event.livemode,
            event_occurred_at=event.created_at,
            raw_type=event.type,
        )


# ── Entry point: parse raw bytes, route, store ────────────────────────────────

import uuid
from pydantic import ValidationError


def process_webhook_payload(raw_bytes: bytes) -> StoredEvent:
    """
    Validate raw Stripe webhook JSON, route by event type, store internally.
    Raises InvalidWebhookPayloadError on validation failure.
    Raises UnknownEventTypeError for event types we don't handle.
    """
    try:
        # Single-pass JSON parse + Pydantic validation via Rust backend.
        # ~20-30% faster than json.loads() + model_validate().
        event = _stripe_event_adapter.validate_json(raw_bytes)
    except ValidationError as e:
        # Translate Pydantic error to domain exception.
        # e.errors() gives structured list with loc, msg, type, input.
        raise InvalidWebhookPayloadError(
            f"Webhook validation failed: {len(e.errors())} error(s)",
            errors=e.errors(),
        ) from e

    processing_id = str(uuid.uuid4())

    if isinstance(event, PaymentSucceededEvent):
        return StoredEvent.from_payment_succeeded(
