---
name: typescript-runtime-safety
description: |
  Guides runtime type validation in TypeScript with Zod: schema design, branded types, type guards, runtime validation at application boundaries, and parse-not-validate patterns.
  Use when the user asks about Zod schemas, runtime validation, branded types, type guards, parse-not-validate, API boundary validation.
  Do NOT use when the user asks about TypeScript type system features (use `typescript-type-patterns`), project setup (use `typescript-project-setup`), testing (use `javascript-testing-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "typescript best-practices debugging"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# TypeScript Runtime Safety

## When to Use

**Use this skill when the user asks about:**
- Designing Zod schemas for API request/response validation, including nested objects, discriminated unions, and recursive schemas
- Runtime validation at application boundaries -- HTTP handlers, WebSocket messages, environment variable parsing, localStorage reads, third-party API responses
- Branded types (nominal types) to distinguish values that share a primitive representation, such as `UserId` vs `OrderId` both being `string`
- Type guards -- both hand-written `is` predicate functions and Zod-derived `.safeParse()` guards -- to narrow unknown or wide types
- The parse-not-validate pattern: transforming untrustworthy input into a strongly-typed value rather than asserting existing values are valid
- Stripping unknown keys, coercing input types (string-to-number from query parameters), and setting defaults at schema boundaries
- Composing and reusing schemas across a codebase without duplication (`.extend()`, `.merge()`, `.pick()`, `.omit()`, `.partial()`)
- Error formatting -- flattening Zod's `ZodError` into user-facing messages or structured API error responses
- Runtime safety patterns for environment configuration (`process.env` validation with Zod)

**Do NOT use this skill when:**
- The user is asking about TypeScript's compile-time type system features -- conditional types, mapped types, template literal types, infer keyword -- use `typescript-type-patterns` instead
- The user needs TypeScript project configuration -- `tsconfig.json`, module resolution, path aliases, build tooling -- use `typescript-project-setup` instead
- The user is asking about testing strategies -- unit tests, integration tests, mocking, test coverage -- use `javascript-testing-patterns` instead
- The user needs general input sanitization for security (XSS, SQL injection) -- this skill covers type safety, not security sanitization; cross-reference security skills
- The user is asking about database query validation or ORM schema definition (Prisma, Drizzle) -- those have their own schema languages and this skill addresses the TypeScript application layer above them
- The user asks about form validation in a UI framework context -- most frameworks (React Hook Form, Formik) have specific integration patterns that go beyond schema design alone

---

## Process

### 1. Identify the Validation Boundary and Data Source

Before writing a single schema, determine exactly where untrustworthy data enters the system. Every schema serves a specific boundary.

- **HTTP request bodies** -- data arrives as `unknown` after JSON.parse; validate before any business logic touches it
- **HTTP response bodies from external APIs** -- even typed SDKs can lie; treat all external responses as `unknown`
- **Environment variables** -- `process.env.PORT` is always `string | undefined`; parse once at startup, export typed config
- **URL query parameters and path segments** -- always strings; must coerce to numbers, booleans, enums explicitly
- **localStorage / sessionStorage / IndexedDB** -- serialized and deserialized across sessions; schema may have evolved
- **WebSocket messages and Server-Sent Events** -- unstructured streams; must validate every message type
- **Inter-process communication** -- worker threads, child processes, and IPC channels pass JSON that must be validated
- Assign each boundary a dedicated schema file. A single monolithic `schemas.ts` file becomes unmanageable past 10 schemas.

### 2. Design Schemas from the Domain Model Outward

Write schemas that reflect the domain, not the wire format. The wire format is an implementation detail; the domain model is the contract.

- Start with the innermost data types -- primitives with constraints -- before composing them into objects:
  ```typescript
  const EmailSchema = z.string().email().max(254).toLowerCase();
  const PositiveIntSchema = z.number().int().positive().max(2_147_483_647);
  const ISODateStringSchema = z.string().datetime({ offset: true });
  ```
- Compose primitives into entities, not the reverse:
  ```typescript
  const UserSchema = z.object({
    id: UuidSchema,
    email: EmailSchema,
    createdAt: ISODateStringSchema,
  });
  ```
- Use `.strict()` on object schemas at external boundaries to reject unknown keys. Use `.passthrough()` only when you intentionally forward unknown properties. Omit the modifier for internal schemas where you control both ends.
- Use `z.discriminatedUnion()` instead of `z.union()` when a shared literal field identifies the variant -- it is faster (O(1) vs O(n) checks) and produces better error messages:
  ```typescript
  const EventSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("created"), userId: UuidSchema }),
    z.object({ type: z.literal("deleted"), userId: UuidSchema, reason: z.string() }),
  ]);
  ```
- Use `.transform()` inside schemas to normalize data at parse time -- lowercase emails, trim strings, parse ISO dates to `Date` objects -- rather than post-processing after validation
- Use `.default()` for optional fields that have well-defined defaults rather than handling them in business logic
- Name all schemas with a `Schema` suffix and export the inferred type alongside it:
  ```typescript
  export const UserSchema = z.object({ ... });
  export type User = z.infer<typeof UserSchema>;
  ```

### 3. Apply the Parse-Not-Validate Pattern at Every Boundary

The parse-not-validate pattern means: call `schema.parse(unknown)` or `schema.safeParse(unknown)` and work with the returned typed value. Never accept an already-typed value and call a boolean `isValid(value)` check that does not produce a new typed output.

- **Use `.parse()` when failure is a programming error or should crash fast** -- startup config, test fixtures:
  ```typescript
  // Crashes on startup if env is misconfigured -- desirable behavior
  const config = ConfigSchema.parse(process.env);
  ```
- **Use `.safeParse()` at runtime boundaries where failure is a user error or external issue**:
  ```typescript
  const result = UserCreateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(formatZodError(result.error));
  }
  const user = result.data; // Fully typed, guaranteed valid
  ```
- Never use `schema.safeParse(x)` and then access `result.data` without first checking `result.success` -- TypeScript will allow it with a type assertion but you lose the safety guarantee
- Never cast input with `as SomeType` to bypass validation. If you cannot schema-validate at a boundary, document explicitly why and use a `// UNSAFE:` comment that is reviewable
- Avoid `schema.parse()` inside hot loops (e.g., validating every item in a 50,000-row dataset). Use `z.array(ItemSchema).parse(rows)` in a single call -- Zod validates the whole array and short-circuits on first error by default, or use `.safeParseAsync()` for async refinements
- After parsing, treat the typed value as immutable through the layer. Do not re-assign fields that bypass the schema.

### 4. Implement Branded Types for Domain Primitives

TypeScript's structural type system cannot distinguish `UserId` from `ProductId` if both are `string`. Branded types add a phantom compile-time tag to enforce correct usage without any runtime overhead.

- Define brands using Zod's `.brand()` method, which integrates with Zod's parsing and produces a branded type automatically:
  ```typescript
  const UserIdSchema = z.string().uuid().brand<"UserId">();
  export type UserId = z.infer<typeof UserIdSchema>; // string & { __brand: "UserId" }

  const ProductIdSchema = z.string().uuid().brand<"ProductId">();
  export type ProductId = z.infer<typeof ProductIdSchema>;
  ```
- Brand every domain ID. Functions that accept `UserId` cannot accidentally receive a raw `string` or a `ProductId`:
  ```typescript
  function getUser(id: UserId): Promise<User> { ... }

  getUser("some-string"); // TS error: Argument of type 'string' is not assignable
  getUser(productId);     // TS error: brand mismatch
  getUser(UserIdSchema.parse(rawId)); // Correct -- parse produces branded type
  ```
- Use brands for other semantically distinct primitives: `PositiveDollars` (cents as number), `SafeHtml` (sanitized string), `HashedPassword` (never a plaintext string), `AbsoluteUrl`
- When creating branded values without Zod (e.g., for values created inside the domain, not parsed from external input), use a module-level factory:
  ```typescript
  export type Branded<T, Brand> = T & { readonly __brand: Brand };
  export type UserId = Branded<string, "UserId">;
  export const UserId = (id: string): UserId => id as UserId; // Internal use only
  ```
- Do not over-brand. Brand identifiers and semantically critical primitives. Do not brand every string in the system -- `FirstName` and `LastName` as separate brands adds noise without safety benefit unless your domain truly requires them to be non-interchangeable.

### 5. Write and Compose Type Guards Correctly

Type guards narrow the type of a value within a conditional block. Zod's `.safeParse()` is the most reliable source of type guards, but hand-written guards are necessary for runtime checks that have no schema.

- A hand-written type guard must actually check the property it claims:
  ```typescript
  // WRONG -- always returns true, dangerous
  function isUser(value: unknown): value is User {
    return true;
  }

  // CORRECT -- checks every discriminating property
  function isUser(value: unknown): value is User {
    return (
      typeof value === "object" &&
      value !== null &&
      "id" in value &&
      typeof (value as any).id === "string" &&
      "email" in value &&
      typeof (value as any).email === "string"
    );
  }
  ```
- Prefer Zod-backed guards over hand-written guards for complex types -- Zod's validation is tested and handles edge cases:
  ```typescript
  function isUser(value: unknown): value is User {
    return UserSchema.safeParse(value).success;
  }
  ```
- Use assertion functions (`asserts` keyword) in contexts where you want to throw rather than return false -- useful in middleware and test setup:
  ```typescript
  function assertIsUser(value: unknown): asserts value is User {
    const result = UserSchema.safeParse(value);
    if (!result.success) throw new ValidationError(result.error);
  }
  ```
- Use `z.ZodTypeAny` and `schema.safeParse` to build generic guard factories to avoid repeating the pattern:
  ```typescript
  function makeGuard<T>(schema: z.ZodSchema<T>) {
    return (value: unknown): value is T => schema.safeParse(value).success;
  }
  const isUser = makeGuard(UserSchema);
  const isProduct = makeGuard(ProductSchema);
  ```

### 6. Validate Environment Configuration at Startup

`process.env` is the most commonly under-validated application boundary. Failures here cause runtime crashes with cryptic messages hours after deployment.

- Create a dedicated `src/config.ts` (or `src/env.ts`) file. Import this in the application entry point before anything else:
  ```typescript
  import { z } from "zod";

  const EnvSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]),
    PORT: z.coerce.number().int().min(1024).max(65535).default(3000),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    REDIS_URL: z.string().url().optional(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  });

  export const env = EnvSchema.parse(process.env);
  export type Env = z.infer<typeof EnvSchema>;
  ```
- Note `z.coerce.number()` -- this is critical for environment variables, which are always strings. Without coerce, `PORT: z.number()` will always fail because `process.env.PORT` is `"3000"`, not `3000`.
- Export the validated `env` object. Never access `process.env` directly anywhere else in the codebase. Enforce this with an ESLint rule: `no-process-env`.
- Include a `.env.example` file listing all required variables. Validate it in CI by running the config parse against the example file -- this catches schema drift early.
- Do not validate secrets' values (only their presence and minimum length) -- `JWT_SECRET: z.string().min(32)` is sufficient. Avoid logging config values in startup output.

### 7. Format and Surface Validation Errors Correctly

Zod's raw `ZodError` is a deeply nested structure. Users and API consumers need flat, actionable messages. Internal logging needs the full structure.

- Use `.flatten()` for simple field-level errors in forms and REST APIs:
  ```typescript
  const result = UserCreateSchema.safeParse(body);
  if (!result.success) {
    const { fieldErrors, formErrors } = result.error.flatten();
    // fieldErrors: { email: ["Invalid email"], age: ["Expected number, received string"] }
    // formErrors: [] -- top-level errors not tied to a field
    return res.status(422).json({ errors: fieldErrors });
  }
  ```
- Use `.format()` for nested structures where path hierarchy matters:
  ```typescript
  const formatted = result.error.format();
  // { address: { street: { _errors: ["Required"] } } }
  ```
- Create a shared `formatZodError` utility used consistently across all error-handling middleware:
  ```typescript
  export function formatZodError(error: z.ZodError): ApiErrorBody {
    return {
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      })),
    };
  }
  ```
- For `z.ZodError.issues`, key codes to handle distinctly: `invalid_type`, `too_small`, `too_big`, `invalid_string`, `invalid_enum_value`, `custom`. Map these to HTTP status codes -- most are `422 Unprocessable Entity`, not `400 Bad Request`.
- Never expose raw Zod error objects to API consumers in production. The `z.ZodError` structure is an implementation detail.

### 8. Integrate Validation Into Framework Middleware

Validation should be infrastructure-level, not scattered through route handlers. Set it up once, use everywhere.

- For Express, create a `validateBody`, `validateQuery`, and `validateParams` middleware factory:
  ```typescript
  import { RequestHandler } from "express";
  import { z, ZodSchema } from "zod";

  export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
    return (req, res, next) => {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(422).json(formatZodError(result.error));
      }
      req.body = result.data; // Replace with parsed, typed data
      next();
    };
  }
  ```
- For Next.js App Router, validate in route handlers with an async wrapper that catches parse failures
- For tRPC, use Zod schemas directly as the `input` validator -- tRPC has native Zod integration and will surface errors to the client automatically
- For Fastify, use `fastify-zod` or the native schema plugin to define Zod schemas as route schemas -- Fastify will validate before the handler runs
- Validate outgoing responses in development and staging environments using a response schema on the same middleware. Do not validate outgoing responses in production on every request -- the overhead is acceptable in non-production environments but 2--5ms per response is significant at scale. Use spot-checking or monitoring instead.

---

## Output Format

When helping a user implement TypeScript runtime safety, structure the response as follows:

```
## Runtime Validation Plan

### Boundary Inventory
| Boundary | Data Source | Schema Strategy | Error Handling |
|----------|-------------|-----------------|----------------|
| POST /users | req.body (JSON) | UserCreateSchema.strict() | 422 + fieldErrors |
| GET /users/:id | req.params | UuidParamSchema | 400 + message |
| process.env | system environment | EnvSchema.parse() | crash on startup |
| GitHub API response | external HTTP | GitHubUserSchema.safeParse() | log + fallback |

### Schema Definitions
[Zod schema code for each identified boundary, with exported inferred types]

### Branded Types
[Brand definitions for domain identifiers and semantically distinct primitives]

### Type Guards / Assertion Functions
[Guard factories or individual guards for non-schema narrowing needs]

### Error Formatting
[formatZodError utility and HTTP error response shape]

### Integration Points
[Middleware wiring, entry point config parsing, framework-specific integration]

### Trade-off Notes
[Any deviations from defaults, performance considerations, team constraints]
```

---

## Rules

1. **Never use `schema.parse()` at runtime boundaries where the caller is a user or external system.** `parse()` throws a `ZodError`, which if not caught will crash the process or return a 500. Use `safeParse()` at all untrusted boundaries and reserve `parse()` for startup configuration and test fixtures.

2. **Never cast with `as` to satisfy Zod's type system.** If you find yourself writing `value as User`, the correct solution is to run the value through `UserSchema.parse()` or `UserSchema.safeParse()`, not to assert. A cast silences the compiler and defeats the entire purpose of runtime validation.

3. **Always strip unknown keys at external input boundaries using `.strict()` or `.strip()`.** The default Zod behavior is `.strip()` (silently drops unknown keys), which is safe. Explicitly call `.strict()` when unknown keys should be an error (e.g., internal RPC calls where an unknown key means a schema mismatch). Never use `.passthrough()` at external boundaries unless the unknown data is explicitly forwarded to another system.

4. **Never define schemas inline inside route handlers or components.** Every schema must be a named, exported constant in a schemas file. Inline schemas cannot be reused, tested, or documented. The schema definition is a contract -- it belongs with the type definitions.

5. **Always use `z.coerce` for environment variables and URL query parameters.** These sources always produce strings. `z.number()` on `process.env.PORT` always fails at runtime even when the value looks correct. `z.coerce.number()` calls `Number()` on the input before validation.

6. **Never validate the same boundary twice with different schemas.** If the HTTP middleware validates `req.body` against `UserCreateSchema`, the service layer must not re-validate. Double validation means the schemas can drift, and it doubles the validation overhead. Parse once at the boundary; trust the type downstream.

7. **Always export both the schema and the inferred type together.** `export const UserSchema = ...` and `export type User = z.infer<typeof UserSchema>` must appear in the same file. Type-only imports from schema files should never need to import from a separate types file for the same entity.

8. **Treat Zod's `.refine()` and `.superRefine()` as domain logic, not validation logic.** Cross-field validation (`passwordConfirmation` must equal `password`), database uniqueness checks (async refinements), and business rules (`endDate` must be after `startDate`) belong in `.refine()` or `.superRefine()`. Pure format checks (`email`, `url`, `uuid`, `min`, `max`) belong in the schema chain. Do not blur this boundary.

9. **Never use `z.any()` or `z.unknown()` as a permanent schema.** These are placeholders for incremental migration. Any schema using `z.any()` must have a `// TODO(JIRA-123): replace with typed schema` comment. Track these as technical debt. A codebase with unchecked `z.any()` schemas has the same safety guarantees as no validation at all.

10. **Validate schema coverage in code review.** For every new application boundary (new route, new external API call, new env var, new IPC message type), a corresponding Zod schema must exist or be explicitly justified as unnecessary. "It comes from our own database" is not a justification -- database reads can return null, have missing columns, or return stale shapes during migrations.

---

## Edge Cases

### Recursive and Self-Referential Schemas
Zod cannot infer the type of recursive schemas automatically -- TypeScript's type inference bottoms out. Use `z.lazy()` and provide an explicit type annotation:
```typescript
interface Category {
  id: string;
  name: string;
  children: Category[];
}
const CategorySchema: z.ZodType<Category> = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  children: z.lazy(() => CategorySchema.array()),
});
```
Performance note: `z.lazy()` schemas re-evaluate on every call. For deeply recursive structures with many levels, benchmark the parse time. A 10-level deep tree with 100 nodes per level may take 50--200ms to validate -- consider validating only the first 2--3 levels and treating deeper nodes as `unknown` if performance demands it.

### Schema Evolution and Backward Compatibility During Deployment
When deploying schema changes, a rolling deployment means old and new instances run simultaneously. A field added as required (`z.string()`) on the new instance will fail requests from the old instance that don't include the field. Strategies:
- Add new required fields as `.optional()` first, deploy, then make them required in a subsequent deployment
- Use feature flags to control which schema version a request is validated against
- Version your API routes (`/v1/`, `/v2/`) rather than making breaking changes in place
- Use `.passthrough()` temporarily during migration to avoid rejecting valid legacy payloads

### Large Payload Validation Performance
Zod validation is synchronous and has measurable overhead on large payloads. Benchmarks show approximately 1--3ms per 100 fields on a modern server. For endpoints receiving arrays with thousands of items:
- Move bulk upload endpoints behind a queue -- validate items asynchronously in workers
- Use `z.array(ItemSchema)` on the whole array, not `ItemSchema.parse()` in a loop -- Zod optimizes the array case
- Consider validating a statistical sample (1%) of internal high-volume streams where you control both ends
- For CSV imports exceeding 10,000 rows, validate the header row and first 10 data rows synchronously, then stream-validate the rest asynchronously with `safeParseAsync`

### Third-Party API Response Schemas That Change Without Notice
External APIs (payment providers, social auth, data vendors) change response shapes without versioning. Your `z.object({ ... }).strict()` will start rejecting responses when the vendor adds a new field.
- Use `.strip()` (the default) not `.strict()` for external API response schemas
- Use `.partial()` on optional fields from external APIs -- vendors often make fields optional without notice
- Add an integration test that fetches a real response from the staging API and runs it through the schema weekly. Failing tests catch schema drift before production does.
- Log `result.error.issues` when `safeParse` fails on an external response, even if you have a fallback. Schema failures on external APIs are signals that require investigation.

### Discriminated Unions with Shared Optional Fields
`z.discriminatedUnion()` requires the discriminant field to be a literal in every member. If some variants share large amounts of structure, avoid repeating them -- use `.extend()` on a base schema:
```typescript
const BaseEventSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  userId: UserIdSchema,
});
const EventSchema = z.discriminatedUnion("type", [
  BaseEventSchema.extend({ type: z.literal("login"), ipAddress: z.string().ip() }),
  BaseEventSchema.extend({ type: z.literal("logout") }),
  BaseEventSchema.extend({ type: z.literal("purchase"), orderId: OrderIdSchema }),
]);
```
Do not use `.merge()` here -- `.merge()` creates a new object type and loses the base type's inference context. Use `.extend()` which preserves the prototype chain.

### Async Validation and Database Refinements
When validation requires an async check (does this email already exist in the database?), use `z.superRefine()` with an async refinement and `schema.parseAsync()`:
```typescript
const UserCreateSchema = z.object({
  email: EmailSchema,
  username: z.string().min(3).max(20),
}).superRefine(async (data, ctx) => {
  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["email"],
      message: "An account with this email already exists",
    });
  }
});

// In handler:
const result = await UserCreateSchema.safeParseAsync(req.body);
```
Caution: async refinements run N database queries for N refinements. If you have 3 async refinements and 100 concurrent requests, that is up to 300 extra database queries per second. Use `Promise.all()` inside a single `superRefine` to parallelize checks. Do not add async refinements to schemas used in high-throughput paths without load testing.

### Testing Zod Schemas Independently
Schemas are logic and should be tested independently of the routes that use them:
- Test that valid inputs parse correctly -- use `expect(() => Schema.parse(validInput)).not.toThrow()`
- Test that invalid inputs fail with the expected issue codes and paths -- check `result.error.issues[0].path` and `result.error.issues[0].code`
- Test transform behavior -- coercion, defaulting, normalization -- by asserting on `result.data`
- Maintain a schema test file parallel to every schema file: `user.schema.ts` → `user.schema.test.ts`
- Use `z.ZodError.flatten()` assertions in tests rather than matching raw error shapes, which are implementation details

---

## Example

**Input:** "I'm building a REST API in Express + TypeScript for a multi-tenant SaaS application. We have a `POST /organizations/:orgId/members` endpoint that accepts a user invite. The body includes email, role, and an optional expiry date. The orgId comes from the URL. We're getting runtime crashes and type errors when bad data comes in. How do I fix this properly?"

---

**Output:**

## Runtime Validation Plan for `POST /organizations/:orgId/members`

### Boundary Inventory

| Boundary | Data Source | Schema Strategy | Error Handling |
|----------|-------------|-----------------|----------------|
| `req.params.orgId` | URL path segment | `OrgIdSchema` (branded UUID) | 400 Bad Request |
| `req.body` | JSON body | `InviteMemberSchema.strict()` | 422 Unprocessable Entity |
| Auth token (assumed upstream) | JWT middleware | Handled by auth middleware | 401 Unauthorized |

---

### Schema Definitions

```typescript
// src/schemas/common.ts
import { z } from "zod";

// Reusable branded UUID for all entity IDs
const UuidSchema = z.string().uuid("Must be a valid UUID v4");

export const OrgIdSchema = UuidSchema.brand<"OrgId">();
export type OrgId = z.infer<typeof OrgIdSchema>;

export const UserIdSchema = UuidSchema.brand<"UserId">();
export type UserId = z.infer<typeof UserIdSchema>;

// URL params schema for this route
export const OrgMemberParamsSchema = z.object({
  orgId: OrgIdSchema,
});
export type OrgMemberParams = z.infer<typeof OrgMemberParamsSchema>;
```

```typescript
// src/schemas/member.ts
import { z } from "zod";

const MemberRoleSchema = z.enum(["admin", "member", "viewer"], {
  errorMap: () => ({ message: "Role must be one of: admin, member, viewer" }),
});

// Invite expiry must be in the future, max 90 days out
const FutureISODateSchema = z
  .string()
  .datetime({ offset: true, message: "Must be a valid ISO 8601 datetime with timezone offset" })
  .refine(
    (val) => new Date(val) > new Date(),
    { message: "Expiry date must be in the future" }
  )
  .refine(
    (val) => {
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
      return new Date(val) <= ninetyDaysFromNow;
    },
    { message: "Expiry date cannot be more than 90 days in the future" }
  );

export const InviteMemberSchema = z
  .object({
    email: z.string().email("Must be a valid email address").max(254).toLowerCase(),
    role: MemberRoleSchema,
    expiresAt: FutureISODateSchema.optional(),
  })
  .strict(); // Reject unknown keys -- this is a client-controlled input

export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;

// The shape returned after business logic processes the invite
export const MemberInviteResponseSchema = z.object({
  inviteId: z.string().uuid(),
  email: z.string().email(),
  role: MemberRoleSchema,
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type MemberInviteResponse = z.infer<typeof MemberInviteResponseSchema>;
```

---

### Branded Types in Action

```typescript
// OrgId and UserId are now distinct branded types.
// The service layer cannot accidentally swap them.

import { OrgId, UserId } from "../schemas/common";

// This function signature is now protected from id mix-ups
async function inviteMember(
  orgId: OrgId,        // branded -- cannot pass a raw string or UserId
  invitedBy: UserId,   // branded -- cannot pass an OrgId
  input: InviteMemberInput
): Promise<MemberInviteResponse> {
  // ...
}
```

---

### Error Formatting Utility

```typescript
// src/lib/validation.ts
import { z } from "zod";

export interface ApiValidationError {
  code: "VALIDATION_ERROR";
  message: string;
  details: Array<{
    path: string;
    message: string;
    code: string;
  }>;
}

export function formatZodError(error: z.ZodError): ApiValidationError {
  return {
    code: "VALIDATION_ERROR",
    message: "Request validation failed",
    details: error.issues.map((issue) => ({
      path: issue.path.join(".") || "(root)",
      message: issue.message,
      code: issue.code,
    })),
  };
}
```

---

### Middleware Integration (Express)

```typescript
// src/middleware/validate.ts
import { RequestHandler } from "express";
import { ZodSchema } from "zod";
import { formatZodError } from "../lib/validation";

export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json(formatZodError(result.error));
    }
    req.body = result.data; // Stripped of unknown keys, normalized
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      // Param errors are typically programmer errors (bad route config)
      // or malformed URL attacks -- 400 is appropriate
      return res.status(400).json(formatZodError(result.error));
    }
    req.params = result.data as any; // Typed and validated
    next();
  };
}
```

---

### Route Definition

```typescript
// src/routes/members.ts
import { Router } from "express";
import { validateBody, validateParams } from "../middleware/validate";
import { InviteMemberSchema } from "../schemas/member";
import { OrgMemberParamsSchema, OrgIdSchema } from "../schemas/common";
import { inviteMember } from "../services/member.service";

const router = Router();

router.post(
  "/organizations/:orgId/members",
  validateParams(OrgMemberParamsSchema),
  validateBody(InviteMemberSchema),
  async (req, res, next) => {
    try {
      // req.params.orgId is OrgId (branded) -- no cast needed
      // req.body is InviteMemberInput -- fully typed, validated
      const orgId = OrgIdSchema.parse(req.params.orgId); // Produces branded OrgId
      const invitedBy = req.user.id as UserId; // From auth middleware (assumed branded there)

      const result = await inviteMember(orgId, invitedBy, req.body);
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

export { router as memberRouter };
```

---

### What This Fixes and Why

| Problem | Root Cause | Fix Applied |
|---------|-----------|-------------|
| Runtime crash on bad `orgId` | No param validation | `OrgMemberParamsSchema` with `validateParams` middleware |
| Crash on missing `email` | `req.body` typed as `any`, no validation | `InviteMemberSchema.strict()` with `validateBody` middleware |
| Role accepted as any string | No enum enforcement | `z.enum(["admin", "member", "viewer"])` |
| Past dates accepted as expiry | No temporal validation | `.refine()` checking `new Date(val) > new Date()` |
| OrgId/UserId mix-up in service | Both were raw `string` | Branded types via `.brand<"OrgId">()` and `.brand<"UserId">()` |
| Raw ZodError leaking to client | No error formatter | `formatZodError()` utility, consistently applied |

### Trade-off Notes

- `InviteMemberSchema` uses `.strict()` because this is a client-controlled input where unknown fields indicate a misuse of the API. If this endpoint were an internal service-to-service call on a versioned schema, `.strip()` would be preferable to survive additive schema changes during rolling deploys.
- The `FutureISODateSchema` uses two chained `.refine()` calls instead of one combined check. This produces two distinct error messages (past date vs. too far in future) rather than a single ambiguous message -- better UX at the cost of two date constructions per validation call. Acceptable here because invites are low-frequency operations.
- `req.params` is overwritten with `result.data` after validation. Express types `req.params` as `Record<string, string>`, so the branded `OrgId` type is lost at the Express type level. The downstream service must re-parse `req.params.orgId` through `OrgIdSchema.parse()` to recover the branded type. This is a known limitation of Express's type system and not a Zod limitation.
