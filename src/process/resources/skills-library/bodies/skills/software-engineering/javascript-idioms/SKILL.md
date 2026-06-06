---
name: javascript-idioms
description: |
  Teaches expert-level modern JavaScript idiomatic patterns: optional chaining, nullish coalescing, destructuring, iterators and generators, Proxy and Reflect, WeakRef, and structured clone. Focuses on patterns that leverage ES2022+ features.
  Use when the user asks about modern JavaScript patterns, optional chaining, nullish coalescing, destructuring, iterators, generators, Proxy, or idiomatic JS code.
  Do NOT use when the user asks about TypeScript types (use `typescript-type-patterns`), Node.js setup (use `nodejs-project-setup`), or testing (use `javascript-testing-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "javascript best-practices clean-code"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# JavaScript Idioms

## When to Use

**Use this skill when:**
- The user wants to modernize legacy JavaScript code with null/undefined guards using optional chaining (?.) or nullish coalescing (??)
- The user asks how to write idiomatic ES2020+ or ES2022+ JavaScript -- shorthand syntax, newer built-ins, pattern improvements
- The user wants to use destructuring beyond basic extraction -- renaming, defaults, nested patterns, function parameter shapes
- The user wants to build lazy sequences, custom iterables, or data pipelines using iterators and generators
- The user asks about metaprogramming -- using Proxy to intercept property access, validate schemas, create reactive objects, or implement virtual properties
- The user wants to understand WeakRef and FinalizationRegistry for managing object lifecycles without preventing garbage collection
- The user has code using JSON.parse/JSON.stringify for cloning, manual arr[arr.length - 1], or hasOwnProperty.call() and wants idiomatic replacements
- The user asks about Object.groupBy, Map.groupBy, Array.fromAsync, or other ES2024 additions
- The user wants to understand the difference between nullish (??) and falsy (||) coalescing semantics

**Do NOT use this skill when:**
- The user asks about TypeScript-specific type features -- use `typescript-type-patterns` (discriminated unions, conditional types, mapped types, template literal types)
- The user wants Node.js project scaffolding, package.json setup, or module system configuration -- use `nodejs-project-setup`
- The user is writing tests or asking about testing patterns -- use `javascript-testing-patterns`
- The user wants async/await orchestration patterns, Promise.all, concurrency limiting -- use `nodejs-async-patterns`
- The user is asking about error handling strategy, custom error classes, or error propagation chains -- use `nodejs-error-handling`
- The user wants V8 profiling, memory optimization, or benchmark-driven performance work -- use `nodejs-performance`
- The user asks about JavaScript module systems (ESM vs CJS interop, dynamic import) -- use `nodejs-module-system`
- The user wants React-specific patterns even if they involve modern JS syntax -- that is a UI framework skill, not a language idiom skill

---

## Process

### Step 1 -- Identify the Idiom Category

Classify the user's problem into one or more of these categories before writing any code:

- **Null-safety**: accessing deeply nested properties or providing defaults -- optional chaining and nullish coalescing
- **Extraction**: pulling values out of objects or arrays into named bindings -- destructuring
- **Object construction**: building objects from dynamic data -- shorthand, computed keys, Object.fromEntries, Object.groupBy
- **Sequence generation**: producing values lazily or on-demand -- iterators and generators
- **Metaprogramming**: intercepting, validating, or virtualizing object operations -- Proxy and Reflect
- **Object lifecycle**: holding references without blocking GC -- WeakRef and FinalizationRegistry
- **Structural cloning**: copying objects that contain non-JSON-serializable types -- structuredClone
- **Modern built-ins**: replacing manual workarounds with purpose-built API methods -- Array.at, Object.hasOwn, Array.from, Array.fromAsync

Apply multiple categories when the user's code spans several areas. Do not force a single pattern when a combination is clearest.

---

### Step 2 -- Apply Optional Chaining and Nullish Coalescing Correctly

Optional chaining (?.) short-circuits at the first null or undefined and returns undefined for the entire chain. Nullish coalescing (??) triggers the right side only when the left side is null or undefined -- not for 0, "", false, or NaN.

**Decision framework:**

- Accessing a property that may not exist on a potentially null/undefined object: `obj?.prop`
- Calling a method that may not exist on the object: `obj.method?.(args)` -- note the placement before the parentheses, not after
- Accessing a dynamic/computed key on a potentially null object: `obj?.[key]`
- Accessing an array element where the array may be null/undefined: `arr?.[0]`
- Providing a default only when the value is null or undefined (preserving 0, false, ""): use `value ?? default`
- Providing a default when the value is any falsy (treating 0, "", false as missing): use `value || default` -- document why
- Combining: `obj?.prop?.nested ?? 'fallback'` -- the ?? receives undefined from the short-circuit

**Thresholds and constraints:**
- Limit chains to 3 levels of ?. before extracting an intermediate variable. Beyond 3 levels, the chain is harder to debug because the point of failure is invisible.
- Do not use ?. when you expect the value to always be present -- use plain dot access so that a programming error throws immediately rather than silently returning undefined
- The logical nullish assignment `??=` operator conditionally assigns only when the left side is null/undefined: `obj.cache ??= computeExpensiveValue()` -- use this for lazy initialization
- The optional chaining delete is valid: `delete obj?.prop` -- useful when obj may not exist
- Short-circuit means method side effects do not execute: `obj?.sideEffect()` -- if obj is null, sideEffect never runs, which is usually the desired behavior but can hide bugs if misapplied

---

### Step 3 -- Apply Destructuring Patterns

Destructuring is a binding pattern, not a value extraction expression. It creates new bindings in the current scope.

**Object destructuring decision tree:**

- Basic extraction: `const { a, b } = obj`
- Rename during extraction (the colon separates source from target binding): `const { sourceKey: localName } = obj`
- Default values trigger when the property is undefined (not null): `const { timeout = 5000 } = options`
- Rename with default: `const { retries: maxRetries = 3 } = config`
- Rest into a new object (collects all own enumerable properties not already destructured): `const { id, ...rest } = record`
- Computed property key destructuring: `const { [dynamicKey]: value } = obj`

**Array destructuring decision tree:**

- Positional extraction: `const [first, second] = arr`
- Skip positions: `const [,, third] = arr` -- limit skips to 1-2; beyond that, use explicit indexing or Array.at()
- Rest into new array: `const [head, ...tail] = arr`
- Swap without temp variable: `[a, b] = [b, a]`
- Default for missing positions: `const [x = 0, y = 0] = point`

**Function parameter destructuring:**

- Named parameters with defaults: `function connect({ host = 'localhost', port = 5432, ssl = false } = {}) {}`
- The `= {}` at the end makes the entire options argument optional -- always include it
- Do not destructure more than 2 levels in a parameter list; extract the inner level to a const inside the function body
- Preserve the original object when it may be needed later: the destructured bindings are copies of primitive values but references for objects

**Common mistakes to prevent:**

- Destructuring null throws a TypeError -- always use `const { prop } = obj ?? {}` when obj might be null
- Destructuring undefined also throws -- same solution
- Default values in destructuring only trigger on undefined, not null: `const { x = 0 } = { x: null }` gives x === null, not 0

---

### Step 4 -- Apply Modern Object and Array Built-ins

These are direct replacements for common verbose patterns. Apply them whenever you see the legacy pattern:

**Object construction:**
- `Object.fromEntries(pairs)` -- converts an array of [key, value] pairs or a Map into a plain object. Replaces reduce-based object assembly.
- `Object.fromEntries(map)` -- converts a Map directly to an object
- `Object.fromEntries(Object.entries(obj).filter(...))` -- filter/transform object properties without manual reduce
- `Object.hasOwn(obj, key)` -- safe own-property check that works even when the object has a null prototype (e.g., Object.create(null)). Replaces Object.prototype.hasOwnProperty.call(obj, key).
- `Object.groupBy(iterable, keyFn)` -- ES2024. Groups items into an object keyed by the return value of keyFn. The value is always an array. Replaces reduce-based grouping. Note: keys are coerced to strings.
- `Map.groupBy(iterable, keyFn)` -- ES2024. Like Object.groupBy but returns a Map, preserving non-string key identity (useful when grouping by object references or symbols).

**Array built-ins:**
- `arr.at(-1)` -- last element. `arr.at(-2)` -- second to last. Works on strings and TypedArrays too.
- `arr.at(0)` -- first element with the same API consistency (prefer arr[0] only when index is definitely non-negative)
- `Array.from({ length: n }, (_, i) => i)` -- generate a sequence [0..n-1] without new Array(n).fill()
- `Array.fromAsync(asyncIterable)` -- ES2024. Collects an async iterable into an array without a manual for-await loop.
- `arr.findLast(fn)` / `arr.findLastIndex(fn)` -- ES2023. Searches from the end. Replaces [...arr].reverse().find(fn) which is destructive and allocates.
- `arr.toSorted()`, `arr.toReversed()`, `arr.toSpliced()`, `arr.with(index, value)` -- ES2023 non-mutating array methods. Return new arrays. Use instead of sort/reverse/splice when you need to preserve the original.

**Deep cloning:**
- `structuredClone(value)` -- handles Date (preserved as Date, not string), RegExp, Map, Set, ArrayBuffer, TypedArray, Error, URL, and circular references (throws for circular by default in some engines -- test this). Does NOT clone functions, DOM nodes, or WeakMap/WeakRef. Replaces JSON.parse(JSON.stringify(x)) which corrupts Date to string, drops undefined properties, drops functions, and throws on BigInt.
- For objects containing functions or class instances, structuredClone is insufficient -- write a custom clone or use a library like structuredClone-polyfill with extensions, or reconsider your data model.

---

### Step 5 -- Apply Iterator and Generator Patterns

Iterators and generators enable lazy computation -- values are produced on demand rather than all at once, making them memory-efficient for large or infinite sequences.

**Iterator protocol fundamentals:**
- An object is iterable if it has a `[Symbol.iterator]()` method returning an iterator
- An iterator is an object with a `next()` method returning `{ value, done }`
- Built-in iterables: Array, String, Map, Set, arguments, NodeList, generator objects
- Make a class iterable by defining `[Symbol.iterator]()` on its prototype

**Generator function patterns:**

```javascript
// Lazy range -- avoids materializing a full array
function* range(start, end, step = 1) {
  for (let i = start; i < end; i += step) yield i;
}

// Infinite sequence with take
function* naturals() {
  let n = 0;
  while (true) yield n++;
}

function take(n, iterable) {
  let count = 0;
  for (const item of iterable) {
    if (count++ >= n) break;
    yield item;  // this needs to be in a generator -- see composed pattern below
  }
}

// Generator delegation with yield*
function* concat(...iterables) {
  for (const iterable of iterables) yield* iterable;
}

// Two-way communication: passing values back via next(value)
function* accumulator() {
  let total = 0;
  while (true) {
    const n = yield total;  // yield sends total out, receives n in
    if (n == null) break;
    total += n;
  }
}
```

**Async generator patterns:**
- Use `async function*` for sequences that require awaiting each item (paginated API responses, chunked streams, database cursors)
- Consume with `for await (const item of asyncGen())`
- Always handle cleanup: `try { ... } finally { closeConnection(); }` inside the generator -- the finally block runs when the iterator is abandoned (return() is called)
- `Array.fromAsync(asyncGen())` collects the full sequence when you need it all at once

**When to choose generators over arrays:**
- Sequence is large (> 10,000 items) or unbounded
- Each item is expensive to compute and you may not need all of them
- You want to pipeline transformations without intermediate arrays
- You are wrapping a cursor, stream, or paginated resource

---

### Step 6 -- Apply Proxy and Reflect for Metaprogramming

Proxy intercepts fundamental object operations via "traps." Reflect provides the default behavior for each trap, making it easy to intercept and then forward.

**Key traps and their use cases:**

| Trap | Intercepts | Common Use |
|------|------------|------------|
| get | Property read: obj.prop | Virtual properties, negative array indices, logging |
| set | Property write: obj.prop = val | Validation, change notification, immutability enforcement |
| has | in operator: 'prop' in obj | Hiding implementation details |
| deleteProperty | delete obj.prop | Preventing deletion of protected keys |
| apply | Function call: fn() | Timing, logging, argument transformation |
| construct | new Fn() | Singleton enforcement, argument validation |
| ownKeys | Object.keys, for...in | Filtering enumerable properties |
| getOwnPropertyDescriptor | Object.getOwnPropertyDescriptor | Virtualizing property metadata |

**Always forward to Reflect in your traps:**

```javascript
const handler = {
  set(target, prop, value, receiver) {
    if (typeof value !== 'number') throw new TypeError(`${prop} must be a number`);
    return Reflect.set(target, prop, value, receiver);  // forward, return boolean
  }
};
```

Forgetting the Reflect.set forward silently drops the write. The return value of set must be a boolean -- return false in strict mode causes a TypeError at the call site.

**Performance constraint -- measure before using:**
- A Proxy get trap adds approximately 2-5x overhead per property access on V8 compared to direct property access
- On a hot loop running 1 million iterations, this can mean ~50ms vs ~10ms
- Only use Proxy on configuration objects, user-facing APIs, or low-frequency paths
- Never wrap performance-critical objects (tight loops, render paths, numeric computation) in Proxy

**Revocable Proxy:**
- `const { proxy, revoke } = Proxy.revocable(target, handler)` -- creates a proxy that can be permanently disabled by calling revoke()
- After revocation, any trap on the proxy throws a TypeError
- Useful for scoped access tokens: grant access via proxy, revoke when session ends

---

### Step 7 -- Apply WeakRef and FinalizationRegistry

WeakRef holds a reference to an object without preventing garbage collection. The reference may become undefined at any point after the GC runs.

**WeakRef pattern:**

```javascript
class Cache {
  #entries = new Map();

  set(key, value) {
    this.#entries.set(key, new WeakRef(value));
  }

  get(key) {
    const ref = this.#entries.get(key);
    if (!ref) return undefined;
    const value = ref.deref();
    if (value === undefined) {
      this.#entries.delete(key);  // clean up stale entry
      return undefined;
    }
    return value;
  }
}
```

**FinalizationRegistry:**

```javascript
const registry = new FinalizationRegistry((heldValue) => {
  // heldValue is a primitive token registered with the object
  // The object itself is NOT accessible here -- it has been collected
  console.log(`Object with token ${heldValue} was collected`);
  cleanupResources(heldValue);
});

const obj = { data: 'large dataset' };
registry.register(obj, 'dataset-token');
```

**Critical constraints:**
- The GC callback is called asynchronously and non-deterministically -- never rely on it for correctness, only for best-effort cleanup
- Do not pass the object itself as the held value -- it defeats the purpose (the registry would hold a strong reference through the held value)
- WeakRef.deref() may return undefined at any time between GC cycles -- always check before using
- These APIs are for advanced use cases: large object caches, observer cleanup, external resource tracking. Do not use them as a general memory management tool.

---

### Step 8 -- Deliver Code with Context and Comparison

When writing the final output:
- Show the before (legacy pattern) and after (idiomatic) side by side unless the user only shows modern code
- Add a one-line comment explaining WHY each idiom is better, not just what it does
- Include edge cases inline when they affect correctness (e.g., "this default won't trigger for null -- use ?? not ||")
- Confirm the minimum Node.js or browser version if the feature is ES2023+ (structuredClone: Node 17+, Object.groupBy: Node 21+, Array.fromAsync: Node 22+)
- When multiple idioms apply, order them by impact: correctness fixes first, readability improvements second, performance improvements third

---

## Output Format

Structure responses to include a pattern summary table, then the modernized code with inline commentary.

### Pattern Selection Table

```
## Pattern Applied

| Problem | Legacy Pattern | Modern Idiom | Note |
|---------|---------------|--------------|------|
| Null-safe property access | obj && obj.prop | obj?.prop | Short-circuits at null/undefined |
| Null-only default | value \|\| 'default' | value ?? 'default' | Preserves 0, false, "" |
| Lazy init | if (!x) x = compute() | x ??= compute() | Only runs when x is null/undefined |
| Last element | arr[arr.length - 1] | arr.at(-1) | Works on strings and TypedArrays too |
| Own property check | obj.hasOwnProperty(k) | Object.hasOwn(obj, k) | Safe on null-prototype objects |
| Deep clone | JSON.parse(JSON.stringify(x)) | structuredClone(x) | Handles Date, Map, Set, RegExp |
| Group array by key | arr.reduce(...) | Object.groupBy(arr, fn) | ES2024, Node 21+ |
| Build object from entries | arr.reduce((o,{k,v}) => ...) | Object.fromEntries(pairs) | Cleaner, pairs can be a Map |
| Non-mutating sort | [...arr].sort() | arr.toSorted() | ES2023, Node 20+ |
| Search from end | [...arr].reverse().find(fn) | arr.findLast(fn) | ES2023, no allocation |
```

### Code Response Template

```javascript
// ─── CONTEXT ─────────────────────────────────────────────────────────────────
// Pattern: [Pattern name(s)]
// Replaces: [What legacy code this modernizes]
// Requires: [Minimum Node.js version or browser baseline, if ES2023+]
// ─────────────────────────────────────────────────────────────────────────────

// Before: [brief description of the problem with legacy code]
function legacyExample(arg) {
  // legacy code with concrete problems noted inline
}

// After: [brief description of the improvement]
function modernExample(arg) {
  // modern idiomatic code
  // each non-obvious line has a comment explaining the semantic difference
}

// Edge case: [any important behavioral difference to be aware of]
// const result = modernExample({ x: null }); // → [what happens and why]
```

For generator/iterator patterns, additionally show consumption:

```javascript
// Producer
function* patternName(params) { /* ... */ }

// Consumer
for (const item of patternName(args)) {
  // processing
}

// Or collected when needed in full
const all = [...patternName(args)];
```

---

## Rules

1. **NEVER use var.** Use const by default. Use let only when the binding must be reassigned. A variable that starts assigned and is never reassigned should always be const -- this communicates intent and enables optimization.

2. **NEVER chain more than 3 levels of optional chaining.** `a?.b?.c?.d` is the maximum readable chain. Extract to `const c = a?.b?.c; const d = c?.d;` when going deeper. Long chains hide the exact point of failure during debugging.

3. **ALWAYS use ?? over || for defaults when the guarded value could legitimately be 0, false, or an empty string.** This is the single most common source of subtle bugs when migrating from || to ??. Document with a comment when you intentionally use || to catch falsy values.

4. **NEVER destructure a value that could be null or undefined without guarding first.** `const { x } = maybeNull` throws TypeError. Always use `const { x } = maybeNull ?? {}` or check before destructuring. Same applies to array destructuring of potentially-null iterables.

5. **NEVER use JSON.parse(JSON.stringify(obj)) for deep cloning in new code.** It silently corrupts Date objects (converts to ISO string), drops properties with undefined values, drops functions, and throws on BigInt. Use structuredClone(). If you must support Node < 17, use a dedicated deep-clone utility.

6. **NEVER use Proxy on objects accessed in hot loops.** The trap overhead is 2-5x per property access on V8. Profile first. Proxy is appropriate for configuration objects, developer tooling, reactive state, and API boundary validation -- not for inner loops processing thousands of items per frame.

7. **ALWAYS return the Reflect equivalent in Proxy traps.** Every trap has a Reflect counterpart: Reflect.get, Reflect.set, Reflect.has, Reflect.deleteProperty, etc. Failing to return Reflect.set's return value in the set trap silently swallows the write in non-strict mode. In strict mode it throws.

8. **ALWAYS check WeakRef.deref() return value before use.** The returned value may become undefined between any two JavaScript turns. Store deref() result in a const and check it once per usage block -- do not call deref() twice assuming it returns the same value both times.

9. **NEVER use for...in to iterate arrays.** for...in iterates enumerable string-keyed properties including inherited ones from the prototype chain. Use for...of for iterables, Array.prototype.forEach for index-aware iteration, or a standard for loop when you need the index.

10. **ALWAYS use rest parameters (...args) instead of the arguments object.** arguments is not a real array, has no arrow function binding, and cannot be spread directly. Rest parameters produce an actual Array and work in all function types.

11. **APPLY Object.hasOwn() instead of hasOwnProperty.call() everywhere.** hasOwnProperty can be overridden by user objects and throws when called on null-prototype objects (Object.create(null)). Object.hasOwn is a static method that always works correctly.

12. **LIMIT generator function complexity.** A generator function that also handles errors, performs I/O, and maintains complex state is hard to test and reason about. Keep generators focused on sequence production. Handle side effects in the consumer.

---

## Edge Cases

### 1 -- Nullish Coalescing with null vs undefined Semantics

Some APIs distinguish null (explicitly absent) from undefined (not set). The ?? operator treats both identically. If your domain requires distinguishing them:

```javascript
// This treats null and undefined the same -- may be wrong for your API
const value = data.field ?? 'default';

// When null means "explicitly cleared" and undefined means "not provided":
const value = data.field !== undefined ? data.field : 'default';
// Or if only undefined should fall back:
const value = data.field === undefined ? 'default' : data.field;
```

Document this distinction in the code comment. APIs that follow JSON semantics (where undefined disappears on serialization) typically treat both as absent.

---

### 2 -- structuredClone Limitations With Class Instances

structuredClone uses the Structured Clone Algorithm, which produces plain objects from class instances -- the prototype chain is NOT preserved:

```javascript
class Point {
  constructor(x, y) { this.x = x; this.y = y; }
  distanceTo(other) { return Math.hypot(this.x - other.x, this.y - other.y); }
}

const p = new Point(1, 2);
const clone = structuredClone(p);
clone instanceof Point; // false -- clone is a plain object
clone.distanceTo;       // undefined -- method not on plain object
```

When you need to clone class instances, implement a `clone()` method or a static `from()` factory, or use a serialization strategy. Do not rely on structuredClone for class-aware cloning.

---

### 3 -- Generator Cleanup With Early Return

When a consumer breaks out of a for...of loop or the iterator is abandoned, the runtime calls `return()` on the generator, which triggers the finally block:

```javascript
function* withConnection() {
  const conn = await openConnection();  // in async generator
  try {
    yield* readRows(conn);
  } finally {
    conn.close();  // runs on break, return, or throw from consumer
  }
}

// This correctly closes the connection even if the consumer breaks early
for await (const row of withConnection()) {
  if (row.id === targetId) break;  // finally still runs
}
```

Forgetting the try/finally in generators that hold resources (database connections, file handles, network sockets) causes resource leaks on early termination.

---

### 4 -- Proxy and Class Private Fields (#fields)

Proxy traps cannot intercept access to private class fields (# syntax). Private fields are stored in an internal slot on the original target object, not through property lookup, so traps never fire for them:

```javascript
class Counter {
  #count = 0;
  increment() { this.#count++; }
  get value() { return this.#count; }
}

const proxy = new Proxy(new Counter(), {
  get(target, prop, receiver) {
    console.log('get:', prop);
    return Reflect.get(target, prop, receiver);
  }
});

proxy.increment();  // get trap fires for 'increment', but #count access inside is direct
proxy.value;        // get trap fires for 'value', then #count is accessed directly
```

This is a spec-level restriction. If you need to intercept private state, use WeakMap-based private storage instead of # fields, so that access goes through Proxy-visible property lookups.

---

### 5 -- Object.groupBy Key Coercion and Ordering

Object.groupBy coerces all keys to strings via toString(). This means grouping by non-string values can produce unexpected collisions:

```javascript
// These produce the same key "1":
Object.groupBy([{ type: 1 }, { type: '1' }], item => item.type);
// Result: { '1': [{ type: 1 }, { type: '1' }] }

// When key identity matters, use Map.groupBy instead:
Map.groupBy([{ type: 1 }, { type: '1' }], item => item.type);
// Result: Map { 1 => [{ type: 1 }], '1' => [{ type: '1' }] }
```

Also note that Object.groupBy requires Node.js 21+ and Chrome 117+. Verify your runtime version before using it in production, or provide a polyfill using Array.prototype.reduce for older environments.

---

### 6 -- Destructuring Default Values vs Null

Destructuring defaults trigger only on undefined, not on null. This bites when an API returns null for "no value":

```javascript
const config = { timeout: null };

// This gives timeout === null, NOT 5000
const { timeout = 5000 } = config;

// Fix: use nullish coalescing after destructuring
const { timeout: rawTimeout = undefined } = config;
const timeout = rawTimeout ?? 5000;

// Or inline with a rename:
const { timeout: _t } = config;
const timeout = _t ?? 5000;

// Or simplest -- just don't use destructuring default for nullable APIs:
const timeout = config.timeout ?? 5000;
```

This is especially common with APIs that return explicit null for cleared/unset states (databases, GraphQL, JSON payloads).

---

### 7 -- Optional Chaining on the Left Side of Assignment

Optional chaining is NOT valid on the left side of an assignment. This is a syntax error:

```javascript
obj?.prop = value;  // SyntaxError: Invalid left-hand side in assignment
```

If obj might be null and you want to conditionally set a property:

```javascript
// Correct approach:
if (obj != null) obj.prop = value;

// Or with nullish assignment (right side only assigns when left is null/undefined):
obj ??= {};
obj.prop = value;
```

This restriction exists because optional chaining is a read operation; assignment requires a definite l-value.

---

### 8 -- WeakRef in Environments With Aggressive GC

In some JavaScript environments (particularly embedded or resource-constrained ones, or during testing with forced GC), a WeakRef target may be collected almost immediately, causing derefs to return undefined more often than in a desktop browser. Do not write code that assumes a WeakRef will remain valid for any duration -- even across synchronous operations in theory (though in practice V8 and SpiderMonkey won't collect mid-synchronous-turn). Always code defensively:

```javascript
function useRef(weakRef) {
  const value = weakRef.deref();
  if (value === undefined) {
    return handleMissing();
  }
  // Use value throughout this function -- it won't be collected mid-turn
  return processValue(value);
}
```

---

## Example

**Input:**

"I have a data pipeline that processes paginated user records from an API. The code manually guards every null, clones objects with JSON, groups results with reduce, and uses old array patterns. Can you modernize the whole thing?"

```javascript
// Legacy version
var processRecords = function(records, options) {
  var limit = options && options.limit || 100;
  var filter = options && options.filter || null;
  var grouped = {};
  var results = [];

  for (var i = 0; i < records.length; i++) {
    var record = records[i];
    var name = record && record.user && record.user.profile && record.user.profile.displayName || 'Anonymous';
    var dept = record && record.org && record.org.department || 'Unknown';
    var lastLogin = record && record.sessions && record.sessions[record.sessions.length - 1];
    var settings = JSON.parse(JSON.stringify(record && record.settings || {}));

    if (filter && !filter(record)) continue;

    var entry = { name: name, dept: dept, lastLogin: lastLogin, settings: settings };
    results.push(entry);

    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(entry);
  }

  return { results: results, grouped: grouped, total: results.length };
};
```

---

**Output:**

```
## Pattern Applied

| Problem                    | Legacy Pattern                          | Modern Idiom                         | Note                                   |
|----------------------------|-----------------------------------------|--------------------------------------|----------------------------------------|
| Null-safe nested access    | record && record.user && ...            | record?.user?.profile?.displayName   | Short-circuits at first null/undefined |
| Falsy-trap default         | options.limit \|\| 100                  | options.limit ?? 100                 | Preserves explicit 0 limit             |
| Last array element         | sessions[sessions.length - 1]          | sessions?.at(-1)                     | Also handles null sessions             |
| Deep clone                 | JSON.parse(JSON.stringify(...))         | structuredClone(...)                 | Preserves Date, Map, Set, RegExp       |
| Group by key               | manual if(!grouped[k]) grouped[k]=[]   | Object.groupBy(results, fn)          | ES2024, Node 21+                       |
| Object shorthand           | { name: name, dept: dept }             | { name, dept }                       | Shorthand when key === variable name   |
| Named parameters with opt. | options && options.limit                | { limit = 100, filter = null } = {}  | Destructure with defaults              |
```

```javascript
// ─── CONTEXT ─────────────────────────────────────────────────────────────────
// Patterns: Optional Chaining, Nullish Coalescing, Destructuring, structuredClone,
//           Array.at(), Object.groupBy, Generator (bonus: paginated async variant)
// Requires: Node.js 21+ for Object.groupBy; Node 17+ for structuredClone;
//           Node 20+ for Array.at() (available since Node 16 but stable in 20+)
// ─────────────────────────────────────────────────────────────────────────────

// ─── MODERNIZED SYNCHRONOUS VERSION ──────────────────────────────────────────

function processRecords(records, { limit = 100, filter = null } = {}) {
  // Destructure options with defaults in the parameter list.
  // The `= {}` makes the entire second argument optional.
  // limit ?? 100 would also work here, but the default in destructuring is cleaner.
  // IMPORTANT: using ?? not || so an explicit limit of 0 (no results) is respected.

  const results = records
    .filter(record => filter == null || filter(record))
    // filter == null catches both null and undefined,
    // allowing filter: null to mean "no filter applied"
    .slice(0, limit)
    .map(record => {
      // Optional chaining: short-circuits at the first null/undefined.
      // We stop at 3 levels (record?.user?.profile?.displayName) -- within the limit.
      const name = record?.user?.profile?.displayName ?? 'Anonymous';
      // ?? not || because displayName could legitimately be "0" or "" (unlikely for a
      // display name, but the pattern should be applied consistently for correctness).

      const dept = record?.org?.department ?? 'Unknown';

      // Array.at(-1) handles: sessions is undefined (returns undefined), sessions is
      // empty (returns undefined), sessions has items (returns last).
      // The ?. before .at() handles the case where sessions is null/undefined.
      const lastLogin = record?.sessions?.at(-1);

      // structuredClone instead of JSON round-trip.
      // Handles Date objects in settings without corrupting them to strings.
      // The ?? {} ensures we clone an empty object if settings is null/undefined.
      const settings = structuredClone(record?.settings ?? {});

      return { name, dept, lastLogin, settings };
      // Shorthand property syntax: { name, dept } is { name: name, dept: dept }
    });

  // Object.groupBy groups the results array into an object keyed by dept.
  // Each value is an array of entries with that dept.
  // Requires Node 21+ / Chrome 117+. See edge case note on key coercion.
  const grouped = Object.groupBy(results, entry => entry.dept);

  return { results, grouped, total: results.length };
}

// ─── USAGE ───────────────────────────────────────────────────────────────────

const { results, grouped, total } = processRecords(rawRecords, {
  limit: 50,
  filter: record => record?.status === 'active',
});

console.log(`Processed ${total} active records`);
console.log('Engineering dept:', grouped['Engineering']?.length ?? 0);


// ─── BONUS: ASYNC GENERATOR VERSION FOR PAGINATED API ────────────────────────
// When records come from a paginated API rather than an in-memory array,
// use an async generator to process lazily without loading all pages into memory.

async function* paginatedRecords(fetchPage, { pageSize = 100 } = {}) {
  let cursor = null;

  do {
    // fetchPage returns { data: [...], nextCursor: string | null }
    const { data, nextCursor } = await fetchPage({ cursor, pageSize });

    for (const record of data) {
      yield record;
      // Each record is yielded one at a time -- consumer controls the pace
    }

    cursor = nextCursor;
  } while (cursor != null);
  // != null catches both null and undefined nextCursor,
  // treating both as "no more pages"
}

async function processAllPages(fetchPage, options = {}) {
  const { limit = Infinity, filter = null } = options;
  const results = [];

  for await (const record of paginatedRecords(fetchPage, options)) {
    if (filter != null && !filter(record)) continue;
    if (results.length >= limit) break;
    // Breaking here triggers the generator's finally block if present,
    // allowing it to clean up any open connections.

    const name = record?.user?.profile?.displayName ?? 'Anonymous';
    const dept = record?.org?.department ?? 'Unknown';
    const lastLogin = record?.sessions?.at(-1);
    const settings = structuredClone(record?.settings ?? {});

    results.push({ name, dept, lastLogin, settings });
  }

  const grouped = Object.groupBy(results, entry => entry.dept);
  return { results, grouped, total: results.length };
}

// ─── EDGE CASE NOTES ─────────────────────────────────────────────────────────
// 1. Object.groupBy keys are always strings. If dept could be a number,
//    all numeric dept keys will be coerced to strings in the grouped object.
//    Use Map.groupBy if you need non-string key identity.
//
// 2. structuredClone does not preserve class instances in settings.
//    If settings contains class instances (e.g., a custom Date subclass),
//    implement a toJSON/fromJSON round-trip or a clone() method instead.
//
// 3. The filter function receives the raw record before transformation.
//    If the filter needs to access transformed values, apply it after mapping
//    or pass a two-phase filter.
//
// 4. lastLogin is the raw session object (or undefined). If sessions contain
//    Date objects, they are passed by reference here -- not cloned.
//    Clone lastLogin separately if you need to mutate it downstream.
```

The modernized synchronous version reduces 28 lines of legacy code to a focused 10-line pipeline using method chaining. The destructured parameter signature makes the options contract explicit and self-documenting. Optional chaining eliminates all six manual && guards. Nullish coalescing correctly preserves falsy-but-valid values (an explicit limit of 0 now works -- the legacy || 100 would have replaced 0 with 100). structuredClone handles Date objects in settings without corruption. Object.groupBy replaces the manual grouped[dept] pattern with a single declarative call. The async generator variant shows how the same idioms scale to streaming paginated data without loading all records into memory at once.
