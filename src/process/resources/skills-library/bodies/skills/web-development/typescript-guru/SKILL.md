---
name: typescript-guru
description: |
  Advanced TypeScript expertise covering type-level programming, generics patterns, discriminated unions, template literal types, conditional types, mapped types, declaration merging, module augmentation, and strict mode mastery.
  Use when the user asks about typescript guru, typescript guru best practices, or needs guidance on typescript guru implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "web-development frontend typescript"
  category: "web-development"
  subcategory: "frontend-frameworks"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# TypeScript Guru

## Purpose

Master advanced TypeScript patterns for building type-safe, maintainable applications. This skill covers type-level programming techniques that eliminate entire categories of runtime bugs while improving developer experience through precise autocompletion and documentation.

## Generics Patterns

### Constrained Generics

```ts
// Basic constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Multiple constraints
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}

// Default generic parameter
function createState<T = string>(initial: T): [T, (v: T) => void] {
  let value = initial;
  return [value, (v: T) => { value = v; }];
}

// Generic constraint using another generic
function cloneSubset<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => { result[key] = obj[key]; });
  return result;
}
```

### Generic Inference Patterns

```ts
// Infer return type from callback
function createQuery<TData>(
  queryFn: () => Promise<TData>
): { data: TData | undefined; refetch: () => Promise<TData> } {
  // Implementation
}
// Usage: type is inferred as { data: User[] | undefined; ... }
const query = createQuery(() => fetchUsers());

// Infer from const assertion
function defineRoutes<const T extends readonly RouteConfig[]>(routes: T): T {
  return routes;
}
// Preserves literal types
const routes = defineRoutes([
  { path: '/home', component: Home },     // path is '/home', not string
  { path: '/about', component: About },
] as const);

// Builder pattern with inference chain
class QueryBuilder<T extends Record<string, unknown>> {
  private filters: Partial<T> = {};

  where<K extends keyof T>(key: K, value: T[K]): this {
    this.filters[key] = value;
    return this;
  }

  select<K extends keyof T>(...keys: K[]): Pick<T, K>[] {
    // Implementation
    return [] as Pick<T, K>[];
  }
}
```

## Discriminated Unions

### Pattern: Exhaustive State Handling

```ts
// Define states as discriminated union
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error; retryCount: number };

// Exhaustive switch with never check
function renderState<T>(state: RequestState<T>): string {
  switch (state.status) {
    case 'idle':    return 'Ready';
    case 'loading': return 'Loading...';
    case 'success': return `Data: ${JSON.stringify(state.data)}`;
    case 'error':   return `Error: ${state.error.message}`;
    default:
      const _exhaustive: never = state;
      throw new Error(`Unhandled state: ${_exhaustive}`);
  }
}

// Pattern: Event system with discriminated union
type AppEvent =
  | { type: 'USER_LOGIN'; payload: { userId: string; timestamp: Date } }
  | { type: 'USER_LOGOUT'; payload: { userId: string } }
  | { type: 'ITEM_ADDED'; payload: { itemId: string; quantity: number } }
  | { type: 'ITEM_REMOVED'; payload: { itemId: string } };

// Type-safe event handler
type EventHandler<T extends AppEvent['type']> = (
  payload: Extract<AppEvent, { type: T }>['payload']
) => void;

function on<T extends AppEvent['type']>(type: T, handler: EventHandler<T>) {
  // Register handler
}

// Usage: payload is correctly typed as { userId: string; timestamp: Date }
on('USER_LOGIN', (payload) => {
  console.log(payload.userId, payload.timestamp);
});
```

### Pattern: Result Type (Error Handling Without Exceptions)

```ts
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Usage
function parseJSON<T>(text: string): Result<T, SyntaxError> {
  try {
    return ok(JSON.parse(text));
  } catch (e) {
    return err(e as SyntaxError);
  }
}

const result = parseJSON<User>(input);
if (result.ok) {
  console.log(result.value.name);  // Type-safe access
} else {
  console.error(result.error.message);  // Error properly typed
}
```

## Template Literal Types

```ts
// Route parameter extraction
type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractParams<Rest>]: string }
    : T extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : {};

// Usage
type Params = ExtractParams<'/users/:userId/posts/:postId'>;
// Result: { userId: string; postId: string }

// Event name patterns
type EventName = `${'click' | 'focus' | 'blur'}${'' | `.${string}`}`;
// Allows: 'click', 'focus', 'blur', 'click.stop', 'focus.once', etc.

// CSS unit types
type CSSUnit = `${number}${'px' | 'rem' | 'em' | '%' | 'vh' | 'vw'}`;
function setWidth(value: CSSUnit | 'auto') { /* ... */ }
setWidth('100px');  // OK
setWidth('2rem');   // OK
setWidth('50');     // Error

// String manipulation types
type SnakeToCamel<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Head}${Capitalize<SnakeToCamel<Tail>>}`
    : S;

type Result = SnakeToCamel<'created_at_date'>; // 'createdAtDate'

// Object key transformation
type CamelCaseKeys<T> = {
  [K in keyof T as K extends string ? SnakeToCamel<K> : K]: T[K];
};

type APIResponse = { user_name: string; created_at: string; is_active: boolean };
type ClientModel = CamelCaseKeys<APIResponse>;
// { userName: string; createdAt: string; isActive: boolean }
```

## Conditional Types

```ts
// Basic conditional type
type IsString<T> = T extends string ? true : false;

// Distributive conditional types (distributes over unions)
type NonNullable<T> = T extends null | undefined ? never : T;
type Result = NonNullable<string | null | undefined>; // string

// infer keyword for extraction
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type Data = UnwrapPromise<Promise<User[]>>; // User[]

// Recursive unwrap
type DeepUnwrapPromise<T> = T extends Promise<infer U> ? DeepUnwrapPromise<U> : T;

// Extract function return type
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;

// Extract array element type
type ElementOf<T> = T extends readonly (infer E)[] ? E : never;

// Complex conditional: different behavior based on type
type Serializable<T> =
  T extends string | number | boolean ? T :
  T extends Date ? string :
  T extends Array<infer U> ? Serializable<U>[] :
  T extends object ? { [K in keyof T]: Serializable<T[K]> } :
  never;
```

## Mapped Types

```ts
// Make all properties optional recursively
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// Make all properties required recursively
type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K];
};

// Readonly recursively
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// Mutable (remove readonly)
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

// Pick by value type
type PickByType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? K : never]: T[K];
};
type StringFields = PickByType<User, string>;  // Only string properties

// Key remapping with `as`
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
type UserGetters = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }

// Create event handler types from state
type StateHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}Change`]: (value: T[K]) => void;
};
```

## Type Narrowing

```ts
// typeof narrowing
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase(); // string
  }
  return value.toFixed(2); // number
}

// instanceof narrowing
function handleError(error: unknown) {
  if (error instanceof TypeError) {
    console.log(error.message); // TypeError
  } else if (error instanceof SyntaxError) {
    console.log(error.message); // SyntaxError
  }
}

// Custom type guard
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    typeof (value as User).id === 'string' &&
    typeof (value as User).email === 'string'
  );
}

// Assertion function (throws if invalid)
function assertDefined<T>(value: T | null | undefined, name: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${name} to be defined`);
  }
}

// Discriminated union narrowing
function handleEvent(event: AppEvent) {
  if (event.type === 'USER_LOGIN') {
    // TypeScript knows: event.payload is { userId: string; timestamp: Date }
    console.log(event.payload.timestamp);
  }
}

// `in` operator narrowing
function isCircle(shape: Circle | Rectangle): shape is Circle {
  return 'radius' in shape;
}

// Satisfies operator (validate type without widening)
const config = {
  apiUrl: '[reference URL]',
  timeout: 5000,
  retries: 3,
} satisfies Record<string, string | number>;
// config.apiUrl is still '[reference URL]' (literal type), not string
```

## Declaration Merging and Module Augmentation

```ts
// Augment third-party library types
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      role: 'admin' | 'user';
    };
  }
}

// Augment Window
declare global {
  interface Window {
    analytics: AnalyticsSDK;
    __APP_CONFIG__: AppConfig;
  }
}

// Augment environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      DATABASE_URL: string;
      API_SECRET: string;
    }
  }
}

// Augment existing interface (merging)
interface User {
  id: string;
  name: string;
}

// Later in code or another file:
interface User {
  email: string; // Merges with original
}
// User is now { id: string; name: string; email: string }
```

## Strict Mode Patterns

### tsconfig.json Strict Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Handling Strict Patterns

```ts
// noUncheckedIndexedAccess: array access returns T | undefined
const items = ['a', 'b', 'c'];
const first = items[0]; // string | undefined
// Must narrow before use:
if (first !== undefined) {
  console.log(first.toUpperCase());
}

// exactOptionalPropertyTypes: undefined is not the same as missing
interface Config {
  name: string;
  description?: string;  // Can be missing, but NOT explicitly undefined
}
const config: Config = { name: 'test', description: undefined }; // Error!
const config2: Config = { name: 'test' }; // OK

// noImplicitOverride: explicit supersede keyword
class Animal {
  move() { console.log('moving'); }
}
class Dog extends Animal {
  supersede move() { console.log('running'); } // Must use supersede
}
```

## Utility Type Recipes

```ts
// Make specific properties required
type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
type UserWithEmail = RequireKeys<Partial<User>, 'email'>;

// Make specific properties optional
type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type CreateUserDTO = OptionalKeys<User, 'id' | 'createdAt'>;

// Merge two types with second taking precedence
type Merge<A, B> = Omit<A, keyof B> & B;

// Brand types for type-safe IDs
type Brand<T, B> = T & { __brand: B };
type UserId = Brand<string, 'UserId'>;
type PostId = Brand<string, 'PostId'>;

function getUser(id: UserId): User { /* ... */ }
const userId = 'abc' as UserId;
const postId = 'def' as PostId;
getUser(userId);  // OK
getUser(postId);  // Error: PostId is not assignable to UserId

// Immutable type for function parameters
type Immutable<T> =
  T extends Map<infer K, infer V> ? ReadonlyMap<Immutable<K>, Immutable<V>> :
  T extends Set<infer V> ? ReadonlySet<Immutable<V>> :
  T extends Array<infer V> ? ReadonlyArray<Immutable<V>> :
  T extends object ? { readonly [K in keyof T]: Immutable<T[K]> } :
  T;
```

## TypeScript Architecture Checklist

- [ ] `strict: true` in tsconfig with no escape hatches
- [ ] `noUncheckedIndexedAccess` enabled
- [ ] Zero `any` usage (use `unknown` + type guards instead)
- [ ] Discriminated unions for state and events
- [ ] Brand types for domain IDs (UserId, OrderId, etc.)
- [ ] Generic functions constrained with `extends`
- [ ] Type guards used for runtime validation at boundaries
- [ ] Module augmentation for third-party type extensions
- [ ] `satisfies` operator used for config validation
- [ ] `as const` used for literal type preservation
- [ ] Mapped types for DRY type transformations
- [ ] Error handling uses Result type or discriminated unions
- [ ] No type assertions (`as`) except for branded types
- [ ] API response types validated at runtime (zod, valibot)

## When to Use

**Use this skill when:**
- Designing or implementing typescript guru solutions
- Reviewing or improving existing typescript guru approaches
- Making architectural or implementation decisions about typescript guru
- Learning typescript guru patterns and best practices
- Troubleshooting typescript guru-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Typescript Guru Analysis

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

**Input:** "Help me implement typescript guru for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended typescript guru approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When typescript guru must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
