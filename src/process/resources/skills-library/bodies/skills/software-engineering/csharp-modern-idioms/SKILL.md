---
name: csharp-modern-idioms
description: |
  Teaches expert-level modern C# patterns: records, pattern matching, nullable reference types, primary constructors, file-scoped namespaces, and global usings for C# 12+.
  Use when the user asks about C# records, pattern matching, nullable reference types, primary constructors, C# 12, modern C#.
  Do NOT use when the user asks about C# project setup (use `csharp-project-setup`), C# async (use `csharp-async-patterns`), C# testing (use `csharp-testing-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "csharp best-practices clean-code"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Csharp Modern Idioms

## When to Use

**Use this skill when:**
- The user asks how to model immutable data in C# and wants to understand records vs classes vs structs
- The user has a `switch` statement explosion or a chain of `if/else if` blocks and wants to refactor using pattern matching
- The user asks how to enable nullable reference types in an existing codebase and manage the migration incrementally
- The user is on C# 10+ and asks about file-scoped namespaces, global usings, or reducing ceremony in source files
- The user asks about primary constructors (C# 12) and how they differ from record positional syntax
- The user wants to know when to use `record`, `record struct`, `readonly record struct`, or `class` for a data-transfer or domain object
- The user is reviewing a PR and wants to modernize C# 8--12 idioms in existing code
- The user asks about `required` members, `init`-only setters, or `with` expressions in C# 9+

**Do NOT use this skill when:**
- The user needs help structuring a new C# project, setting up `.csproj` properties, or choosing SDK versions -- use `csharp-project-setup`
- The user's question is primarily about `async`/`await`, `Task`, `ValueTask`, `IAsyncEnumerable`, or cancellation tokens -- use `csharp-async-patterns`
- The user is writing or fixing unit tests in xUnit, NUnit, or MSTest -- use `csharp-testing-patterns`
- The user asks about LINQ query syntax or method chains as a standalone topic -- that is a separate optimization concern
- The user is asking about dependency injection container setup or middleware pipelines -- those are framework-level concerns, not language idioms

---

## Process

### 1. Identify the C# Version and Enable Modern Features

Before applying any idiom, confirm what language version is active and what features are available.

- Check the `.csproj` for `<LangVersion>` -- if absent, the SDK default is used (net8.0 defaults to C# 12, net7.0 to C# 11, net6.0 to C# 10)
- Set `<LangVersion>latest</LangVersion>` or a pinned version like `<LangVersion>12.0</LangVersion>` to be explicit
- Enable nullable reference types project-wide: `<Nullable>enable</Nullable>` in the `<PropertyGroup>`
- Enable implicit usings if on .NET 6+: `<ImplicitUsings>enable</ImplicitUsings>` to remove boilerplate `using System;` lines
- Treat nullable warnings as errors in new greenfield code: `<WarningsAsErrors>Nullable</WarningsAsErrors>` -- add this carefully to legacy code only after null migration
- Verify the active language version by checking `dotnet --version` and cross-referencing the SDK/TFM table: .NET 8 SDK supports C# 12 by default

---

### 2. Choose the Right Type Declaration for Data

Apply a consistent decision framework for every new data-holding type:

- **`record class`** -- Use for immutable reference-type data that needs value-equality semantics, `ToString()` generation, and `with` expression support. Ideal for DTOs, domain events, query results, API response models. Example trigger: "I have a `PersonDto` with 5 properties and I keep overriding `Equals` and `GetHashCode`."
- **`record struct`** -- Use when the data is small (guideline: 3 or fewer fields, total size under 16 bytes), lives on the stack, and allocation matters. A `Point3D`, `Color`, `DateRange` are good candidates. Without `readonly`, `record struct` still allows mutation -- add `readonly` unless mutation is intentional.
- **`readonly record struct`** -- The preferred form of `record struct` for fully immutable value types. Prevents accidental mutation and enables defensive copying guarantees.
- **`class` with `required` + `init`** -- Use when you need reference semantics, inheritance hierarchy, or the type must be deserialized by a framework that calls the parameterless constructor (System.Text.Json, EF Core entities). Pair `required` members with `init`-only setters to enforce completeness without a constructor.
- **`struct`** -- Retain plain structs for interop scenarios, `fixed` buffers, or when implementing `IEquatable<T>` manually for performance-critical code where record overhead is measurable.
- Avoid converting existing classes to records mid-project without checking serialization compatibility -- the generated `EqualityContract` property can break JSON round-trips if the discriminator is not suppressed.

---

### 3. Apply Pattern Matching Systematically

Pattern matching in C# 8--12 covers 11+ pattern forms. Apply them in this priority order:

- **Type patterns** (`is MyType t`) -- Replace `as` casts followed by null checks. Always prefer `is MyType t { Property: value }` property patterns over multi-step casts.
- **Switch expressions** -- Replace `switch` statements that return a value. Every arm is `pattern => expression`. A missing arm that can be reached causes a compile-time warning with exhaustiveness analysis on discriminated unions (sealed hierarchies).
- **Property patterns** (`{ Status: OrderStatus.Shipped, Carrier: not null }`) -- Flatten nested null checks and conditional property reads into a single readable expression.
- **List patterns** (C# 11) -- Match arrays and spans: `[first, .., last]` extracts head and tail. Use `[_]` for single-element, `[]` for empty.
- **Positional patterns** -- Deconstruct records and types with `Deconstruct` methods: `case (0, 0): origin`.
- **Guard clauses with `when`** -- Add inline predicate refinement to a pattern arm: `case Order o when o.Total > 1000:`.
- **Logical patterns** (`and`, `or`, `not`) -- Compose patterns: `> 0 and <= 100` for range validation, `not null` as the idiomatic null check replacement for `!= null`.
- Keep switch expressions under 10 arms before considering a strategy/dictionary dispatch. Beyond 10 arms, pattern complexity exceeds cognitive load.

---

### 4. Migrate Nullable Reference Types Incrementally

Enabling `<Nullable>enable</Nullable>` on a large existing codebase without a plan causes hundreds of warnings simultaneously. Follow this phased approach:

- **Phase 1 -- Annotation-only mode:** Set `#nullable enable` at the top of individual files you are actively modifying. Never annotate a file and fix every warning in the same commit -- separate annotation from logic changes.
- **Phase 2 -- File-by-file cleanup:** For each file, address warnings in this order: (a) add `?` to reference types that are legitimately nullable, (b) add null-guard checks or null-coalescing operators for unexpected nulls, (c) use `!` (null-forgiving operator) only when you have external proof of non-null (e.g., a framework guarantees it), never as a shortcut.
- **Phase 3 -- Project-wide enable:** Once 80%+ of files are annotated, set project-level `<Nullable>enable</Nullable>` and add `#nullable disable` at the top of the remaining legacy files. Track these as tech debt.
- **Phase 4 -- Remove suppressions:** Treat every `!` operator as a code smell to revisit. Replace with `ArgumentNullException.ThrowIfNull()` guards, the null-conditional operator `?.`, or pattern `is not null` checks.
- Never use `string?` for a string that is conceptually always present but might be empty -- that is an empty-string concern, not a nullability concern. Use `string.IsNullOrEmpty` or `string.IsNullOrWhiteSpace` for those cases.

---

### 5. Use Primary Constructors Correctly (C# 12)

Primary constructors change where and how constructor parameters live. The rules are subtle:

- Primary constructors on `class` and `struct` (not just records) were introduced in C# 12. The parameters are **captured into the class scope** -- they are not auto-properties. If you need them as properties, declare them explicitly.
- Use primary constructors for **dependency injection**: `public class OrderService(IOrderRepository repository, ILogger<OrderService> logger)` -- the parameters are captured as fields implicitly if referenced in the body. Avoid assigning them to additional fields to prevent dual storage.
- Do NOT use primary constructors when the constructor body needs to do complex validation, transformation, or throw exceptions based on argument values -- that logic has no clean home in a primary constructor. Use a traditional constructor with a body for those cases.
- Primary constructor parameters are in scope for the **entire class body**, including field initializers and all methods. This is a source of confusion: they look like method parameters but behave like fields. Name them with `_camelCase` or `camelCase` consistently to signal this lifetime difference.
- For records, the positional syntax (`record Person(string Name, int Age)`) already generates primary constructors plus init-only auto-properties, `Deconstruct`, and equality. Do not add a separate primary constructor to a positional record -- you will shadow the generated members.

---

### 6. Apply File-Scoped Namespaces and Global Usings

These features reduce indentation and boilerplate with zero semantic change:

- **File-scoped namespaces** (`namespace MyApp.Services;`) remove one level of indentation from every class in the file. Use them for all new files unconditionally in C# 10+ projects. Configure the IDE enforcement rule: in `.editorconfig`, set `csharp_style_namespace_declarations = file_scoped:warning`.
- **Global usings** -- Place all global usings in a dedicated file named `GlobalUsings.cs` at the project root. Put only namespaces that are used in 5+ files. Do not globalize namespaces with common type name conflicts (`System.Threading` vs `System.Threading.Tasks` both export some names that can collide).
- Keep `GlobalUsings.cs` under 20 entries. More than 20 global usings signals the project scope is too broad or namespaces are too coarse.
- Never mix global usings and regular usings for the same namespace -- it causes a warning and reader confusion.
- `ImplicitUsings` adds a framework-specific set automatically (for ASP.NET Core: `Microsoft.AspNetCore.Builder`, `Microsoft.Extensions.DependencyInjection`, etc.). Check what is already implicit before adding redundant global usings.

---

### 7. Compose and Validate with `required` Members and `init` Setters

Enforce object completeness without verbose constructor overloads:

- Mark every non-nullable property that must be set at construction time as `required`: `public required string Name { get; init; }`. The compiler enforces that all `required` members are set in every object initializer.
- Combine `required` with `init` (not `set`) so the property cannot be mutated after construction. This gives you immutability enforcement without a full constructor signature.
- Use `[SetsRequiredMembers]` on a constructor that sets all required members programmatically -- this suppresses the compiler's requirement for callers to set them again via initializer. Useful for factory methods and deserialization constructors.
- Do not use `required` on properties that have meaningful defaults -- provide the default in the property initializer instead: `public string Region { get; init; } = "US";`.
- `required` members interact with inheritance: a derived class inherits the `required` constraint. Override with `new required` in the derived class only when the derived class genuinely changes the semantics of the property.

---

### 8. Enforce and Review Through Tooling

Modern C# idioms drift without automated enforcement:

- Add Roslyn analyzers via NuGet: `Microsoft.CodeAnalysis.NetAnalyzers` (included with SDK), `StyleCop.Analyzers` for style rules, and `Roslynator.Analyzers` for idiomatic rewrites (it suggests converting `if`-chains to switch expressions automatically).
- Configure `.editorconfig` for C#-specific rules: `dotnet_style_prefer_auto_properties`, `csharp_prefer_pattern_matching`, `csharp_style_prefer_switch_expression`, `csharp_style_prefer_null_check_over_type_check`.
- Run `dotnet format` in CI with `--verify-no-changes` to fail the build on style drift.
- Use `dotnet analyzer` or Rider/ReSharper code inspections to audit nullable annotation coverage as a metric over sprints.
- In code review, flag these anti-patterns: `== null` where `is null` is available, `as T` without a null check, unguarded `!` operators, and multi-level nested `if` blocks that pattern matching would flatten.

---

## Output Format

When helping a user modernize or write C# code, structure your response as follows:

```
## Diagnosis

What C# version / .NET TFM is active:
What the current code pattern is and what problem it causes:
Which modern idiom(s) address the problem:

## Modernized Code

### Before
```csharp
// original code with annotation of what is problematic
```

### After
```csharp
// modernized code with inline comments explaining the idiom
```

## Key Idioms Applied

| Idiom | C# Version | Benefit | Trade-off |
|-------|-----------|---------|-----------|
| record class | 9+ | Value equality, with-expressions, ToString | Reference type; cannot inherit from non-record class |
| switch expression | 8+ | Exhaustiveness checking, no fall-through | Can become dense beyond 8-10 arms |
| property pattern | 8+ | Flattens nested null/property checks | Requires familiarity to read at speed |
| nullable reference types | 8+ | Compile-time null safety | Migration cost on legacy codebases |
| primary constructors | 12 | Reduces DI boilerplate | Parameters are not auto-properties |
| required + init | 11 + 9 | Enforces completeness without overloads | Does not work with some ORMs that need setters |
| file-scoped namespace | 10+ | Removes indentation level | File can only have one namespace |
| list patterns | 11+ | Concise array/span matching | Only works on indexable types |

## Migration Guidance (if applicable)

Step-by-step migration plan with file ordering and nullable phase:
1. [specific action]
2. [specific action]

## Tooling Configuration

Relevant .editorconfig or .csproj settings to enforce the applied idioms:
```
```

---

## Rules

1. **Never recommend `record` for EF Core entities.** EF Core's change tracker relies on reference equality and mutable properties. Records override `Equals`/`GetHashCode` by value, causing the tracker to misidentify entities. Use `class` with `required init` properties for DTO projection targets, not the entity itself.

2. **Never use the null-forgiving operator (`!`) more than once per method.** Each `!` is a contract violation with the compiler. More than one per method indicates the nullable model was not properly designed. Surface the real cause: a missing null check, a wrong API return type annotation, or a `required` member that should prevent null.

3. **Always prefer `is null` over `== null` for nullable reference type checks.** `== null` can be overloaded; `is null` always means reference equality to null and is pattern-matching-consistent. Consistency also enables the compiler to suggest further pattern rewrites.

4. **Never apply `record struct` to types larger than 16 bytes without benchmarking.** `record struct` is copied by value on every assignment and method argument. A struct with 5+ fields frequently outweighs its allocation savings. Measure with BenchmarkDotNet before committing to the shape.

5. **Never globalize a namespace used in fewer than 5 files.** Global usings are project-wide implicit imports. Globalizing rarely-used namespaces hides intent and causes confusion about where types come from. The 5-file threshold is a practical heuristic.

6. **Always seal records that are not meant to be inherited.** Records support inheritance, but unsealed records cause structural equality to include an `EqualityContract` property check that breaks equality between base and derived instances. Use `sealed record` unless the hierarchy is intentional and equality semantics across levels are designed explicitly.

7. **Never use positional record syntax when order is not meaningful.** `record Person(string FirstName, string LastName)` creates a constructor where argument order is the only differentiator for two `string` parameters. If the type has more than 2 parameters of the same type, use named `required init` properties instead to prevent argument transposition bugs.

8. **Always exhaustively handle switch expressions on discriminated unions.** When switching over a sealed hierarchy or enum, the compiler's exhaustiveness checker only works if all cases are covered. Add a discard arm (`_ => throw new UnreachableException()`) rather than silently returning a default -- the exception surfaces logic errors immediately.

9. **Never mix mutable state into a `record class` unless the mutable properties are explicitly excluded from equality.** Any mutable property participates in value equality by default. A record with a mutable collection property (`List<T>`) will produce incorrect equality results because `List<T>` uses reference equality. Override `PrintMembers` or use a custom `EqualityContract` to handle these cases, or avoid mutable collections in records entirely.

10. **Always use `ArgumentNullException.ThrowIfNull()` (.NET 6+) at method entry points instead of manual null checks.** It is shorter, throw-annotated for nullable flow analysis, and consistent. Replace `if (param == null) throw new ArgumentNullException(nameof(param));` everywhere. For range checks, use `ArgumentOutOfRangeException.ThrowIfNegative()` and related overloads (.NET 8).

---

## Edge Cases

### Legacy Codebase with Nullable Disabled Project-Wide

When `<Nullable>disable</Nullable>` or no nullable setting is present and the codebase is large (100+ files), do not enable it project-wide immediately.

- Add `<Nullable>enable</Nullable>` only to the `.csproj` of a new class library or feature area that is being extracted
- For files within the existing project, use `#nullable enable` at the top of only the files you are actively modifying in the current sprint
- Audit total nullable warnings with `dotnet build 2>&1 | grep "warning CS8"` before enabling project-wide -- if the count exceeds 200, treat each 20-warning batch as a separate story
- Never silence warnings with `#pragma warning disable CS8600` as a blanket fix -- it defeats the purpose and accumulates hidden debt

### Records and JSON Serialization (System.Text.Json)

Records with positional constructors serialize correctly with `System.Text.Json` in .NET 6+ because the deserializer supports parameterized constructors. However, edge cases exist:

- If a record has both a positional constructor and a custom additional constructor, `System.Text.Json` may pick the wrong one -- annotate the intended constructor with `[JsonConstructor]`
- `EqualityContract` (an internal property used by records) is not serialized, but if you use `JsonSerializer.SerializeToNode` and then deserialize into a base type, the derived type information is lost -- use `[JsonDerivedType]` attribute (introduced in .NET 7) for polymorphic serialization
- `record struct` with `System.Text.Json` requires the struct to have a parameterless constructor (auto-generated by the compiler) -- this works by default but breaks if you add a `[JsonConstructor]` annotation on the positional constructor on older SDK versions

### Pattern Matching Over External / Third-Party Types

When you do not control the type hierarchy (e.g., matching against `HttpStatusCode`, `Exception` subclasses, or cloud SDK result types):

- Use `when` guard clauses generously since you cannot add `Deconstruct` methods without extension methods or wrapper types
- Prefer wrapping uncontrolled types in a thin domain record before pattern matching: `record ApiResult(bool IsSuccess, int StatusCode, string? ErrorMessage)` -- this converts the external type to a shape you control
- Do not use type patterns on `Exception` subclasses in a switch expression that catches all `Exception` -- it will suppress exceptions that should propagate. Always include a re-throw arm: `_ => throw new UnreachableException("Unhandled exception type", ex)`

### Primary Constructors and Serialization Frameworks

Primary constructors on non-record classes introduce an implicit captured scope, not a named parameter set:

- `System.Text.Json` does not see primary constructor parameters as constructor parameters for deserialization -- the generated IL does not emit them as a named constructor in the way positional record constructors do. Use a traditional constructor with `[JsonConstructor]` if deserialization from JSON is required.
- EF Core 8 supports primary constructors on entity types, but only when the parameter names exactly match the property names (case-insensitive). If using primary constructors for EF Core entities, ensure the parameter name matches the property it initializes: `public class Product(int id, string name)` with `public int Id { get; } = id; public string Name { get; } = name;`.

### Mixed Record and Class Hierarchies

C# enforces that records can only inherit from other records and classes can only inherit from classes. This becomes a constraint when:

- You have a base domain class that you want to convert to a record but derived classes are plain classes -- you must convert the entire hierarchy at once or not at all
- You try to use a record as a base for an EF Core entity (not supported)
- A third-party library defines a base class you must inherit from -- you cannot make the derived type a record. Use `required init` properties with manual `Equals`/`GetHashCode` override as a substitute

### List Patterns on Non-Array Enumerables

List patterns (`[first, .., last]`) only work on types that implement `IReadOnlyList<T>` (for `Count` and indexer) or arrays. They do not work directly on `IEnumerable<T>`:

- `IEnumerable<T>` requires `.ToArray()` or `.ToList()` before applying list patterns -- add a comment explaining why the materialization is intentional
- `Span<T>` and `ReadOnlySpan<T>` support list patterns in C# 11+ without heap allocation
- For streaming/lazy sequences, use `foreach` with early break rather than list patterns -- materializing a lazy sequence to apply a list pattern defeats the purpose of the lazy evaluation

### `with` Expressions and Deep Object Graphs

`with` expressions perform a shallow copy of a record:

- If a record contains a reference-type property (`List<OrderItem> Items`), the `with` copy shares the same `List<T>` instance. Mutating the list in one record affects the other.
- For deep immutability, either use `ImmutableArray<T>` or `ImmutableList<T>` as property types, or wrap the `with` expression in a factory method that performs the deep copy explicitly.
- Document the shallow-copy behavior in XML doc comments on any record that holds reference-type collection properties: `/// <remarks>The Items collection is not deep-copied by with expressions.</remarks>`

---

## Example

**Input:** "I have a C# 12 project. Here is my order processing code -- it has a big if/else chain for order status, a DTO class with 8 properties and hand-written Equals, and I'm getting nullable warnings everywhere. How do I modernize it?"

**Diagnosis:**

The code has three separate modernization targets:
1. A `class OrderDto` with 8 properties, hand-written `Equals`/`GetHashCode`, and `ToString` -- a direct candidate for `record class`
2. An `if`/`else if` chain over `OrderStatus` enum values -- a direct candidate for a switch expression with exhaustiveness checking
3. Uncontrolled nullable reference type warnings from not having `<Nullable>enable</Nullable>` configured

---

**Before:**

```csharp
// OrderDto.cs -- old style
using System;
using System.Collections.Generic;

namespace MyApp.Orders
{
    public class OrderDto
    {
        public Guid Id { get; set; }
        public string CustomerName { get; set; }
        public string CustomerEmail { get; set; }
        public DateTime PlacedAt { get; set; }
        public decimal Total { get; set; }
        public string Status { get; set; }
        public string ShippingAddress { get; set; }
        public List<string> ItemSkus { get; set; }

        public override bool Equals(object obj)
        {
            if (obj is OrderDto other)
                return Id == other.Id && CustomerName == other.CustomerName;
            return false;
        }

        public override int GetHashCode() => HashCode.Combine(Id, CustomerName);

        public override string ToString() =>
            $"Order {Id} for {CustomerName} ({Status})";
    }
}
```

```csharp
// OrderProcessor.cs -- old style
using System;

namespace MyApp.Orders
{
    public class OrderProcessor
    {
        private readonly IOrderRepository _repository;
        private readonly IEmailService _emailService;

        public OrderProcessor(IOrderRepository repository, IEmailService emailService)
        {
            _repository = repository;
            _emailService = emailService;
        }

        public string GetStatusMessage(string status)
        {
            if (status == "Pending")
                return "Your order is being reviewed.";
            else if (status == "Processing")
                return "Your order is being prepared.";
            else if (status == "Shipped")
                return "Your order is on its way.";
            else if (status == "Delivered")
                return "Your order has been delivered.";
            else if (status == "Cancelled")
                return "Your order was cancelled.";
            else
                return "Unknown status.";
        }
    }
}
```

---

**After:**

```csharp
// GlobalUsings.cs -- project root, used in 10+ files
global using System;
global using System.Collections.Generic;
global using System.Collections.Immutable;
```

```csharp
// OrderStatus.cs
namespace MyApp.Orders;  // file-scoped namespace -- removes one indentation level

public enum OrderStatus
{
    Pending,
    Processing,
    Shipped,
    Delivered,
    Cancelled
}
```

```csharp
// OrderDto.cs -- modernized as a sealed record class
namespace MyApp.Orders;

/// <summary>
/// Immutable data transfer object representing a placed order.
/// Value equality is by all properties (record default).
/// </summary>
/// <remarks>
/// ItemSkus uses ImmutableArray to ensure with-expression copies
/// do not share a mutable list reference.
/// </remarks>
public sealed record OrderDto
{
    // required + init enforces completeness at the call site without
    // a constructor with 8 positional parameters (which would be
    // a transposition bug waiting to happen).
    public required Guid Id { get; init; }
    public required string CustomerName { get; init; }
    public required string CustomerEmail { get; init; }
    public required DateTime PlacedAt { get; init; }
    public required decimal Total { get; init; }
    public required OrderStatus Status { get; init; }
    public required string ShippingAddress { get; init; }

    // ImmutableArray<T> -- deep-copy safe with with-expressions,
    // stack-allocated wrapper, zero extra heap allocation.
    public ImmutableArray<string> ItemSkus { get; init; } = ImmutableArray<string>.Empty;

    // No need to override Equals, GetHashCode, or ToString --
    // the record generates all three correctly.
    // Generated ToString: OrderDto { Id = ..., CustomerName = ..., ... }
}
```

```csharp
// OrderProcessor.cs -- modernized with primary constructor and switch expression
namespace MyApp.Orders;

public sealed class OrderProcessor(
    IOrderRepository repository,       // primary constructor -- captured in class scope
    IEmailService emailService,        // no need for separate _field = field assignments
    ILogger<OrderProcessor> logger)    // DI parameters read naturally top-to-bottom
{
    // Primary constructor parameters (repository, emailService, logger) are
    // accessible throughout the class body -- they are implicitly captured.

    // Typed enum instead of raw string -- callers cannot pass arbitrary strings.
    public string GetStatusMessage(OrderStatus status) =>
        status switch                         // switch expression -- no fall-through
        {
            OrderStatus.Pending     => "Your order is being reviewed.",
            OrderStatus.Processing  => "Your order is being prepared.",
            OrderStatus.Shipped     => "Your order is on its way.",
            OrderStatus.Delivered   => "Your order has been delivered.",
            OrderStatus.Cancelled   => "Your order was cancelled.",
            // Exhaustiveness: if a new enum value is added, this arm catches it
            // at runtime and throws immediately -- never silently returns a wrong string.
            _ => throw new UnreachableException($"Unhandled OrderStatus: {status}")
        };

    public async Task ProcessAsync(OrderDto order, CancellationToken ct = default)
    {
        // ArgumentNullException.ThrowIfNull is the .NET 6+ idiomatic null guard.
        // Nullable reference types mean the compiler already warns if order could
        // be null -- this guard is for runtime contract enforcement.
        ArgumentNullException.ThrowIfNull(order);

        // Property pattern matching -- reads as English, no temp variable needed.
        if (order is { Status: OrderStatus.Pending, Total: > 0m })
        {
            await repository.SaveAsync(order, ct);

            // Immutable update via with-expression -- order is unchanged,
            // updatedOrder is a new record with only Status modified.
            var updatedOrder = order with { Status = OrderStatus.Processing };

            logger.LogInformation(
                "Order {OrderId} transitioned to {Status}", 
                updatedOrder.Id, 
                updatedOrder.Status);

            await emailService.SendAsync(updatedOrder.CustomerEmail, ct);
        }
    }
}
```

---

**Key Idioms Applied:**

| Idiom | C# Version | Benefit | Trade-off |
|-------|-----------|---------|-----------|
| `sealed record` with `required init` | 9 + 11 | Eliminates hand-written Equals/GetHashCode/ToString, enforces completeness | Slightly more syntax than positional records; safe for types with many same-type parameters |
| `ImmutableArray<T>` as collection property | Any | `with` expressions are deep-copy safe; no shared mutable reference | `ImmutableArray` is a struct -- use `.IsDefaultOrEmpty` not `== null` |
| File-scoped namespace | 10+ | Removes one indentation level across every file in project | Only one namespace per file allowed |
| Global usings | 10+ | Removes 3 boilerplate `using` lines from every file | Namespace conflicts can hide ambiguity |
| Switch expression over typed enum | 8+ | Compiler exhaustiveness warning when enum is extended | `UnreachableException` arm is required for true exhaustiveness enforcement |
| Property pattern (`{ Status: ..., Total: > 0m }`) | 8+ | Replaces multi-line null + property checks | Requires team familiarity to read confidently |
| Primary constructor for DI | 12 | Cleaner DI registration, no field boilerplate | Parameters are not properties; no validation body |
| `with` expression for immutable update | 9+ | Produces a new instance with one field changed | Shallow copy -- requires `ImmutableArray<T>` for collection safety |
| `ArgumentNullException.ThrowIfNull` | .NET 6+ | Short, throw-annotated, nullable-flow aware | Not available below .NET 6; use manual check there |

---

**Migration Guidance:**

1. Add `<Nullable>enable</Nullable>` and `<LangVersion>12.0</LangVersion>` to `.csproj`
2. Add `<ImplicitUsings>enable</ImplicitUsings>` and create `GlobalUsings.cs` with namespaces used in 5+ files
3. Run `dotnet build` and capture nullable warning count: `dotnet build 2>&1 | grep -c "warning CS8"`
4. For each file modified in the current PR: convert namespace to file-scoped, address nullable warnings
5. Convert `OrderDto` from class to `sealed record` -- run serialization tests immediately after
6. Replace `string status` parameter with `OrderStatus status` enum across all call sites
7. Convert `if`/`else if` chains to switch expressions one method at a time -- verify with existing unit tests after each conversion
8. Convert `OrderProcessor` constructor to primary constructor -- confirm DI container registration still resolves correctly

---

**Tooling Configuration:**

```xml
<!-- In .csproj -->
<PropertyGroup>
  <LangVersion>12.0</LangVersion>
  <Nullable>enable</Nullable>
  <ImplicitUsings>enable</ImplicitUsings>
  <!-- Uncomment for greenfield projects only: -->
  <!-- <WarningsAsErrors>Nullable</WarningsAsErrors> -->
</PropertyGroup>
```

```ini
# In .editorconfig
[*.cs]
csharp_style_namespace_declarations                    = file_scoped:warning
csharp_style_prefer_switch_expression                 = true:suggestion
csharp_prefer_pattern_matching                        = true:suggestion
csharp_style_prefer_null_check_over_type_check        = true:warning
dotnet_style_prefer_auto_properties                   = true:suggestion
csharp_style_prefer_primary_constructors              = true:suggestion
dotnet_diagnostic.CS8600.severity                     = warning  # nullable assignment
dotnet_diagnostic.CS8602.severity                     = warning  # nullable dereference
dotnet_diagnostic.CS8618.severity                     = warning  # non-nullable uninitialized
```
