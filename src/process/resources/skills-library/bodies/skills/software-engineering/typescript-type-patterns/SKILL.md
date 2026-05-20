---
name: typescript-type-patterns
description: |
  Guides advanced TypeScript type manipulation: discriminated unions, mapped types, conditional types, template literal types, utility type composition, and type-level programming for library authors.
  Use when the user asks about typescript type patterns, discriminated unions, mapped types, conditional types, template literal types, utility types, infer keyword.
  Do NOT use when the user asks about basic TypeScript setup (use `typescript-project-setup`), runtime validation (use `typescript-runtime-safety`), JavaScript idioms (use `javascript-idioms`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "typescript best-practices clean-code"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# TypeScript Type Patterns

## When to Use

**Use this skill when:**
- The user asks how to model a domain with multiple variants that share some fields but diverge on others (classic discriminated union territory)
- The user wants to derive types from existing types rather than duplicating them -- mapped types, `Partial`, `Required`, `Pick`, `Omit`, and custom variants
- The user needs a type that changes shape based on a type parameter -- conditional types with `extends`, `infer`, and distributive behavior
- The user wants to generate string literal types from combinations or transformations of other literals -- template literal types for event names, CSS properties, route builders, etc.
- The user is authoring a library or shared package and needs strong inference for generic APIs, builder patterns, or plugin systems
- The user asks about the `infer` keyword, type-level recursion, variance, covariance, contravariance, or higher-kinded type simulations
- The user wants to compose utility types into reusable type-level functions for DRY type definitions
- The user asks about exhaustiveness checking, narrowing, type guards, assertion functions, or type predicates

**Do NOT use this skill when:**
- The user needs help configuring `tsconfig.json`, choosing a module resolution strategy, or setting up a TypeScript project (use `typescript-project-setup`)
- The user needs runtime validation -- Zod, Valibot, io-ts, or schema-to-type bridges (use `typescript-runtime-safety`)
- The question is primarily about JavaScript patterns, closures, prototypes, or async patterns with no type-system angle (use `javascript-idioms`)
- The user is asking about decorators and metadata reflection for frameworks like NestJS (use a framework-specific skill)
- The user is asking about declaration files (.d.ts authoring) for third-party library shims -- that is a distinct publishing concern

---

## Process

### 1. Identify the Type-System Problem Category

Before writing a single line of types, classify what the user is actually trying to solve. The wrong pattern category wastes effort and produces unmaintainable types.

- **Variant modeling** -- multiple shapes that share a tag or discriminant field. This calls for discriminated unions, not class hierarchies.
- **Transformation** -- taking an existing type and changing its shape (all optional, rename keys, pick fields). This calls for mapped types.
- **Branching on type parameters** -- selecting a result type based on what was passed in. This calls for conditional types.
- **String-based APIs** -- event names, CSS-in-JS properties, URL patterns, dot-notation paths. This calls for template literal types.
- **Generic API inference** -- function overloads, builder patterns, plugin registries where the return type depends on argument shapes. This calls for `infer` and conditional types together.
- Ask the user: what does the consuming code look like? Work backward from the call site. The ideal type system makes invalid states unrepresentable and requires zero casts at call sites.

### 2. Design the Discriminated Union Structure (Variant Modeling)

Discriminated unions are the single most impactful pattern for domain modeling. Apply them before considering classes.

- Use a literal string field named `kind`, `type`, or `tag` as the discriminant. Choose one convention and hold it across the codebase. `kind` avoids collision with the DOM `type` property.
- Every variant must carry the discriminant. Union members without the discriminant break exhaustiveness checking.
- Place shared fields on the union level using an intersection if needed, or accept duplication -- TypeScript does not structurally share fields across union members automatically.
- Implement an exhaustiveness helper: `function assertNever(x: never): never { throw new Error("Unhandled variant: " + JSON.stringify(x)); }`. Call it in the `default` branch of every switch on a discriminated union.
- Keep union members shallow. Deeply nested variant objects make narrowing brittle -- prefer flat discriminant fields.
- For unions with 10+ variants, split into sub-unions by domain concept and compose them: `type Event = UserEvent | PaymentEvent | SystemEvent`.
- Extract per-variant types with `Extract<MyUnion, { kind: "foo" }>` rather than re-declaring them separately.

### 3. Build Mapped Types for Structural Transformations

Mapped types let you derive new shapes from existing ones. They eliminate duplication between related types.

- The base form is `type MyMapped<T> = { [K in keyof T]: Transform<T[K]> }`. Know this signature cold.
- Use `+readonly` / `-readonly` and `+?` / `-?` modifiers to add or remove optionality and mutability. The `-?` modifier is critical for building a `Required<T>` that strips optionality from nested types.
- Use `as` clauses (key remapping) to rename keys: `{ [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] }`. This powers getter/setter derivation, event-name generation, and form-field naming.
- Filter keys with an `as` clause that conditionally returns `never`: `[K in keyof T as T[K] extends Function ? K : never]` extracts only method keys.
- Combine mapped types with template literal types in the `as` clause for API surface derivation -- e.g., deriving a `watch` method signature from a data schema.
- Never use a mapped type when a simple `Pick` or `Omit` is sufficient. Reach for a custom mapped type only when the built-in utilities cannot express the transformation.
- Homomorphic mapped types (those that iterate `keyof T`) preserve optionality and readonly modifiers from the source type automatically. Non-homomorphic mapped types (iterating an explicit union) do not -- account for this when designing.

### 4. Write Conditional Types for Branching Logic

Conditional types make type-level decisions. They are the `if` statement of the type system.

- Base syntax: `T extends U ? TrueType : FalseType`. The extends clause is a structural compatibility check, not equality.
- **Distributive conditional types**: when `T` is a naked type parameter, `T extends U ? A : B` distributes over unions automatically. `string | number extends string ? "yes" : "no"` evaluates per-member. To suppress distribution, wrap: `[T] extends [U] ? A : B`.
- Use `infer` inside the `extends` clause to capture a sub-type: `T extends Promise<infer R> ? R : T` unwraps a Promise. `T extends (arg: infer A) => infer R ? [A, R] : never` extracts argument and return types.
- Chain conditional types for multi-branch logic. Keep chains to at most 3-4 levels -- beyond that, extract named helper types with `type` aliases.
- Use `NonNullable<T>` as `T extends null | undefined ? never : T` as a model for writing custom filters.
- Recursive conditional types require `extends` in the recursive branch and must have a base case. TypeScript enforces a recursion depth limit (approximately 50 levels for most patterns, 100 for tail-recursive-style). For deeply recursive types (path accessors, deep partials), use tail-recursive conditional types where the recursive call is the entire `TrueType` branch, not nested inside other constructs.
- Always test conditional types with `type Check = Expect<Equal<YourType<Input>, ExpectedOutput>>`. Use the `type-fest` or `expect-type` testing pattern rather than guessing.

### 5. Compose Template Literal Types for String APIs

Template literal types allow type-safe string manipulation and are essential for framework APIs.

- Syntax: `` `prefix_${Literal}` `` or `` `${Literal1}_${Literal2}` ``. The interpolated positions must be string, number, bigint, boolean, null, or undefined literal types -- or unions thereof.
- Unions in interpolated positions distribute automatically: `` `on${Capitalize<"click" | "focus">}` `` produces `"onClick" | "onFocus"`.
- Use TypeScript's built-in string manipulation types -- `Uppercase<S>`, `Lowercase<S>`, `Capitalize<S>`, `Uncapitalize<S>` -- to match casing conventions.
- For dot-notation path accessors into nested objects, use recursive template literals with conditional types:
  ```ts
  type DotPath<T, K extends keyof T = keyof T> =
    K extends string
      ? T[K] extends Record<string, unknown>
        ? `${K}.${DotPath<T[K]>}` | K
        : K
      : never;
  ```
  Cap recursion at known depth (3-4 levels) for realistic object schemas. Unlimited recursion on large schemas causes TypeScript to hit instantiation limits.
- Use template literal types to derive event handler names, CSS property accessors, REST endpoint strings, or Redux action type constants from a single source-of-truth schema type.
- Combine with `infer` to parse string patterns: `` T extends `${infer Head}.${infer Tail}` ? ... `` enables path splitting at the type level.

### 6. Use `infer` and Higher-Order Type Patterns for Library APIs

The `infer` keyword enables type extraction and is the foundation of advanced generic API design.

- Use `infer` to unwrap wrappers: `Awaited<T>`, `ReturnType<F>`, `Parameters<F>`, `ConstructorParameters<C>`, `InstanceType<C>` are all built on `infer`. Understand them by re-deriving them.
- For variadic function types, use rest element inference: `T extends (...args: infer A) => infer R`. Combined with tuple types, this enables type-safe pipe/compose implementations.
- Simulate higher-kinded types using interface extension for "type constructors": define an `HKT` interface with an `Out` property, then use mapped types over known instances. This is the approach used by fp-ts and effect-ts.
- Builder pattern typing: each builder method should return a new generic type that accumulates the configuration:
  ```ts
  type Builder<Config extends Record<string, unknown>> = {
    set<K extends string, V>(key: K, val: V): Builder<Config & Record<K, V>>;
    build(): Config;
  };
  ```
  Use intersection accumulation (`Config & Record<K, V>`) to track state without losing prior fields.
- Readonly tuple inference for fixed-arity APIs: use `as const` assertions on the argument side and `readonly [...T]` constraints on the parameter side to infer tuple lengths precisely.
- When designing generic functions, prefer inference over explicit type parameters. If the user must write `fn<string, number>(...)`, the design has failed -- `fn("hello", 42)` should infer both.

### 7. Compose Utility Types and Validate with Type Tests

Good TypeScript codebases treat types as first-class citizens with their own tests.

- Compose utilities in layers: `Prettify<Omit<Partial<T>, "id">>` is readable; deeply nested one-liners without aliases are not. Break them into named intermediate types.
- The `Prettify` trick -- `type Prettify<T> = { [K in keyof T]: T[K] } & {}` -- forces TypeScript's display to expand intersections and mapped types into a flat object shape. Use it on exported API types to improve IDE hover text.
- Write type-level unit tests using the `Equal` and `Expect` pattern:
  ```ts
  type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
  type Expect<T extends true> = T;
  type _Tests = [
    Expect<Equal<MyUtility<string>, ExpectedString>>,
    Expect<Equal<MyUtility<never>, never>>,
  ];
  ```
  A compile error on `_Tests` is a failing type test. This technique requires no runtime and catches regressions.
- Run `tsc --noEmit` in CI to catch type errors. Add `isolatedModules: true` in `tsconfig` for libraries to verify each file is independently importable.
- Use `@ts-expect-error` (not `@ts-ignore`) to assert that a specific line must produce a type error. If the error disappears, `@ts-expect-error` itself becomes an error -- catching when your negative test case broke.
- Document complex types with JSDoc `@example` blocks showing the input/output transformation. IDEs render these on hover.

---

## Output Format

When delivering TypeScript type pattern guidance, structure the response as follows:

```
## Problem Classification
[One sentence naming the pattern category: discriminated union / mapped type / conditional type / template literal / infer / composition]

## Type Design

### Source Types
[The "input" types the user has or is modeling]

### Derived / Result Types
[The target types being constructed]

### Implementation
[Complete, copy-pasteable TypeScript code with inline comments]

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Discriminant field name | kind | Avoids DOM collision with `type` |
| Distribution suppression | [T] extends [U] | Needed because T is a union |
| Recursion depth cap | 4 levels | Avoids TS2589 instantiation limit |
| Prettify wrapper | Yes / No | Improves hover text for exported API |

## Usage at Call Sites
[Show 3-5 example usages demonstrating that no casts are needed]

## Type Tests
[Show Expect<Equal<...>> tests covering happy path, edge cases, and never cases]

## Gotchas and Maintenance Notes
[Specific things future maintainers must know about this type design]
```

---

## Rules

1. **Never use type assertions (`as`) to paper over type errors in application code.** If a cast is needed, the type design is wrong. The only legitimate uses of `as` are: narrowing from `unknown` after a validated check, casting DOM query results that TypeScript cannot know the shape of, and `as const`. Every other `as` is a smell.

2. **Distributive conditional types distribute over naked type parameters -- always check whether distribution is the desired behavior.** If `T = string | number` and the type should treat the union as a whole, suppress with `[T] extends [U]`. Failing to do this is the most common source of surprising type outputs from conditional types.

3. **Never use `any`. Use `unknown` for values of unknown shape and `never` for impossible types.** `any` disables type checking bidirectionally. `unknown` requires narrowing before use. `never` is the bottom type and propagates through unions correctly. When accepting arbitrary callback results, type the return as `unknown`, not `any`.

4. **A discriminated union must have an exhaustive switch with an `assertNever` default.** TypeScript narrows in switch statements but does not warn about missing cases unless `noImplicitReturns` and `strictNullChecks` are both enabled AND the function return type is explicit. Use `assertNever` defensively regardless of compiler settings.

5. **Recursive types must have an explicit depth limit or a base case that TypeScript can resolve without instantiating the recursive branch.** TypeScript throws TS2589 ("Type instantiation is excessively deep") when recursion exceeds approximately 50-100 levels. For path accessor types, limit to 4 levels of nesting. For deep partial/required utilities, document the depth limit in a JSDoc comment.

6. **Mapped types that remap keys with `as never` to filter them must be tested against empty input (`{}`) and `never` inputs.** A mapped type over `never` produces `{}` not `never` -- this surprises consumers expecting `never` to propagate.

7. **Template literal types on large string-union cross-products can crash the TypeScript language service.** A union of 50 event names crossed with 10 modifier prefixes produces 500 members. Above roughly 100,000 instantiations, tsc becomes unusably slow. Decompose large cross-products into sub-unions or switch to string with a branded newtype.

8. **Prefer interface over type alias for object shapes that will be extended or augmented.** Interfaces support declaration merging and provide better error messages at large scale. Use `type` for unions, intersections, conditional types, mapped types, and template literals -- these constructs cannot be expressed with `interface`.

9. **Never rely on implicit `any` inference in generic positions.** Configure `tsconfig.json` with `"strict": true` (which enables `noImplicitAny`). In generic functions, if a type parameter cannot be inferred from arguments, add a constraint or a default: `<T extends Record<string, unknown> = Record<string, unknown>>`. An unconstrained `T` with no default produces `unknown` in strict mode, which is correct but may surprise users.

10. **Exported types from a library must be tested for variance correctness.** A type that is covariant in T (safe to read) behaves differently than one that is contravariant (safe to write) when assignability is checked. Function parameter positions are contravariant. Return positions are covariant. Getting this wrong causes consumers to hit unexpected type errors when substituting subtypes. Use the `Expect<Equal<...>>` test pattern to lock in assignability behavior across releases.

---

## Edge Cases

### Circular / Mutually Recursive Types
TypeScript supports recursive type aliases since 4.1 (for object types) and recursive conditional types with careful tail-recursive patterns. However, two types that are mutually recursive (`type A = { b: B }; type B = { a: A }`) work for structural types but cause TS2615 in conditional types. Workaround: introduce an intermediate interface that breaks the cycle, since interfaces can be recursive without triggering the conditional-type recursion check. For JSON-like recursive types, use the canonical pattern: `type Json = string | number | boolean | null | Json[] | { [key: string]: Json }`.

### `never` Propagation Surprises in Unions and Mapped Types
`never` is the identity element for unions: `string | never` simplifies to `string`. This is correct and useful -- but it means a conditional type that produces `never` for some branches silently removes those branches from a union result. When a mapped type filters keys using `as SomeConditional extends ... ? K : never`, testing with an all-filtered input produces `{}` (empty object type) not `never`. If downstream code checks `T extends never`, it will not match `{}`. Handle this explicitly: `keyof Result extends never ? never : Result`.

### TypeScript Version Compatibility for Library Authors
Advanced patterns have version requirements. Template literal types require TS 4.1+. Recursive conditional types with the tail-recursive optimization require TS 4.5+. Variance annotations (`in`/`out` modifiers) require TS 4.7+. `satisfies` operator requires TS 4.9+. `const` type parameters require TS 5.0+. When authoring a shared library, declare the minimum TypeScript peer dependency in `package.json` (`"peerDependencies": { "typescript": ">=4.7" }`) and test against the minimum version in CI using `npm install typescript@4.7` in a separate CI matrix entry.

### Generic Constraints That Are Too Tight or Too Loose
Over-constraining a generic (`T extends { id: string; name: string; status: "active" | "inactive" }`) forces callers to have exactly those fields and breaks structural compatibility with subtypes that have additional fields. Under-constraining (`T extends object`) provides no useful narrowing inside the function. The sweet spot is constraining only the fields the function actually accesses: `T extends { id: string }`. Use `keyof` constraints to make mapped utilities work: `K extends keyof T` ensures `T[K]` is always valid.

### Conditional Types Inside Mapped Types (and Vice Versa)
Combining these two patterns is powerful but has a subtle interaction: a conditional type inside a mapped type's value position is evaluated eagerly only if `T` is fully resolved. When `T` is an unresolved generic, TypeScript defers evaluation. This means that `type X<T> = { [K in keyof T]: T[K] extends string ? "yes" : "no" }` will not simplify until `T` is known -- which is the desired behavior. But if you expect a concrete output from a generic type before it is instantiated, the type will appear as a deferred conditional in IDE hover text, which confuses users. Mitigate by providing concrete `@example` types in JSDoc or by creating named alias types for common instantiations.

### Exhaustiveness Checking Across Module Boundaries
When a discriminated union is extended in a separate module (adding a new variant), all existing `switch` statements in other modules silently break exhaustiveness. TypeScript does not re-evaluate exhaustiveness after module-level changes unless the switch is in a function with an explicit return type. Mitigate by: (1) colocating the `assertNever` call in a utility that also exports the union type, (2) using a central handler registry that maps variant `kind` strings to handler functions -- a missing handler becomes a type error at registration time, not a runtime surprise.

### Performance Impact of Large Structural Types in Monorepos
In a monorepo with 300+ files importing a complex mapped or conditional type, TypeScript's language service can degrade significantly. Symptoms: hover takes 5-10 seconds, autocomplete lags, `tsc` takes minutes. Diagnosis: run `tsc --diagnostics` and inspect `Instantiation count`. If a single type exceeds 100,000 instantiations, refactor it. Solutions: (1) break the type into smaller composable pieces, (2) use `interface` instead of `type` alias where possible (interfaces are cached by identity, type aliases by structure), (3) avoid unbounded cross-products in template literal types, (4) add a `// @ts-ignore` on a test file and compare language service speed to confirm the type is the culprit.

---

## Example

**Input from user:** "I'm building a form library. I want a type-safe `useField` hook where `useField('email')` infers the field value as `string`, `useField('age')` infers `number`, and `useField('acceptedTerms')` infers `boolean`. The schema is defined once and the hook should require no explicit type parameters."

---

**Output:**

## Problem Classification
Generic API inference using a schema-constrained record type with key-indexed return type -- conditional types and indexed access types, no explicit type parameter at call site.

## Type Design

### Source Types

```ts
// The form schema is defined once, as a plain object type.
// This becomes the single source of truth for all field types.
type FormSchema = {
  email: string;
  age: number;
  acceptedTerms: boolean;
  birthDate: Date;
};
```

### Derived / Result Types

```ts
// FieldName is the union of all valid field names.
// TypeScript infers this automatically from keyof FormSchema.
type FieldName = keyof FormSchema; // "email" | "age" | "acceptedTerms" | "birthDate"

// FieldValue<K> looks up the value type for a given key.
// This is a simple indexed access type -- no conditional type needed here.
type FieldValue<K extends FieldName> = FormSchema[K];

// FieldState<K> wraps the field value in runtime state.
// The value type is fully inferred from K.
type FieldState<K extends FieldName> = {
  value: FieldValue<K>;                          // e.g., string for "email"
  error: string | null;
  touched: boolean;
  onChange: (next: FieldValue<K>) => void;       // strongly typed setter
  onBlur: () => void;
};
```

### Implementation

```ts
// ---- schema.ts ----

// Define the schema as a type. In a real library, this would be
// parameterized so users supply their own schema. Shown here
// with a concrete schema for clarity.
export type FormSchema = {
  email: string;
  age: number;
  acceptedTerms: boolean;
  birthDate: Date;
};

export type FieldName = keyof FormSchema;
export type FieldValue<K extends FieldName> = FormSchema[K];

// ---- field-state.ts ----

export type FieldState<K extends FieldName> = {
  value: FieldValue<K>;
  error: string | null;
  touched: boolean;
  onChange: (next: FieldValue<K>) => void;
  onBlur: () => void;
};

// ---- use-field.ts ----

import { useState, useCallback } from "react";
import type { FieldName, FieldValue, FieldState, FormSchema } from "./schema";

// The internal store holds all field values.
// Typed as FormSchema so each key is strongly typed.
type FormStore = FormSchema;

// The hook signature: K is inferred from the literal string argument.
// No explicit type parameter needed at the call site.
export function useField<K extends FieldName>(
  store: FormStore,
  fieldName: K,
  validate?: (value: FieldValue<K>) => string | null
): FieldState<K> {
  // useState is typed as [FieldValue<K>, Dispatch<SetStateAction<FieldValue<K>>>]
  // because store[fieldName] is typed as FieldValue<K> via indexed access.
  const [value, setValue] = useState<FieldValue<K>>(store[fieldName]);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const onChange = useCallback(
    (next: FieldValue<K>) => {
      setValue(next);
      if (validate) {
        setError(validate(next));
      }
    },
    [validate]
  );

  const onBlur = useCallback(() => {
    setTouched(true);
  }, []);

  return { value, error, touched, onChange, onBlur };
}
```

### Making the Schema Generic (Library-Author Extension)

To let library consumers define their own schema, parameterize on `Schema`:

```ts
// Generic form hook factory -- the schema is supplied once,
// and the returned useField is closed over it with correct types.
export function createForm<Schema extends Record<string, unknown>>(
  initialValues: Schema
) {
  // FieldName and FieldValue are now relative to the user-supplied Schema.
  type K = keyof Schema & string;

  function useField<F extends K>(
    fieldName: F,
    validate?: (value: Schema[F]) => string | null
  ): FieldState<F, Schema> {
    // implementation unchanged structurally
  }

  return { useField };
}

// FieldState is now generic over both K and the full Schema.
type FieldState<K extends keyof Schema & string, Schema> = {
  value: Schema[K];
  error: string | null;
  touched: boolean;
  onChange: (next: Schema[K]) => void;
  onBlur: () => void;
};
```

Usage:

```ts
const { useField } = createForm({
  email: "",        // inferred as string
  age: 0,           // inferred as number
  acceptedTerms: false,  // inferred as boolean
  birthDate: new Date(), // inferred as Date
});

// K is inferred as "email", value is string -- no explicit type parameter.
const emailField = useField("email");
emailField.onChange("user@example.com"); // ✅ accepts string

// K is inferred as "age", value is number.
const ageField = useField("age");
ageField.onChange(25);                   // ✅ accepts number
ageField.onChange("25");                 // ❌ TS2345: Argument of type 'string' is not assignable to 'number'

// K is inferred as "acceptedTerms", value is boolean.
const termsField = useField("acceptedTerms");
termsField.onChange(true);               // ✅ accepts boolean
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Schema as a type alias | `type FormSchema = {...}` | Simple, no class overhead, works directly with `keyof` |
| Indexed access for value type | `Schema[K]` | Avoids conditional types entirely -- simpler and faster for TS to evaluate |
| Factory function pattern | `createForm(initialValues)` | Closes over the schema so `useField` never needs an explicit type parameter |
| `K extends keyof Schema & string` | Intersect with `string` | `keyof` can produce `string | number | symbol`; the `& string` narrows to string keys only for template literal and DOM safety |
| `as const` not required | Initial values use type inference | Primitive literals (`""`, `0`, `false`) infer as `string`, `number`, `boolean` -- exactly what we want. `as const` would infer `""` as the literal type `""`, making `onChange` accept only the empty string. |
| Validate callback typed | `(value: Schema[F]) => string | null` | The validator receives the correctly-typed value, preventing a string validator being passed to a number field |

## Usage at Call Sites

```ts
// All of these require zero explicit type parameters.
// TypeScript infers F from the string literal argument.

const emailField = useField("email");
// emailField.value : string
// emailField.onChange : (next: string) => void

const ageField = useField("age", (v) => v < 0 ? "Age cannot be negative" : null);
// v is inferred as number inside the validator -- no annotation needed

const termsField = useField("acceptedTerms");
// termsField.value : boolean

// Invalid field names are caught at compile time:
const bad = useField("nonexistent");
// ❌ TS2345: Argument of type '"nonexistent"' is not assignable to
//    parameter of type '"email" | "age" | "acceptedTerms" | "birthDate"'
```

## Type Tests

```ts
import type { Equal, Expect } from "@type-challenges/utils";

type Schema = { email: string; age: number; active: boolean };

// FieldValue resolves correctly for each key
type _T1 = Expect<Equal<FieldValue<"email">, string>>;      // passes
type _T2 = Expect<Equal<FieldValue<"age">, number>>;        // passes
type _T3 = Expect<Equal<FieldValue<"active">, boolean>>;    // passes

// FieldState shapes are correct
type EmailState = FieldState<"email", Schema>;
type _T4 = Expect<Equal<EmailState["value"], string>>;
type _T5 = Expect<Equal<Parameters<EmailState["onChange"]>[0], string>>;

// Invalid keys are rejected
// @ts-expect-error -- "missing" is not a valid field name
type _Bad = FieldValue<"missing">;
```

## Gotchas and Maintenance Notes

- **Do not add `| undefined` to `FieldValue<K>`.** Optional fields (`email?: string`) produce `string | undefined` from `Schema[K]` automatically. Adding `| undefined` manually would double-widen optional fields.
- **`keyof Schema` includes `number` and `symbol` keys if present.** The `& string` intersection is not optional -- omitting it causes template literal types and DOM attribute assignments that use field names to accept `symbol` keys, which causes runtime errors.
- **If the schema uses `interface` with declaration merging** (uncommon but possible), `keyof` reflects the merged shape at the call site but not at the type definition site. Prefer `type` aliases for form schemas to avoid this confusion.
- **The `createForm` factory pattern means one factory call per form.** If the same schema is used in multiple components, export the result of `createForm` from a shared module rather than calling `createForm` multiple times -- each call creates a new set of inferred types, which TypeScript treats as structurally equivalent but which can produce confusing error messages when mixed.
- **Validator return type is `string | null`, not `string | undefined`.** This is intentional: `null` is explicit absence, `undefined` is accidental absence. Downstream rendering logic uses strict equality (`error !== null`) which works correctly with `null` but would miss `undefined`. Document this contract in the JSDoc of `useField`.
