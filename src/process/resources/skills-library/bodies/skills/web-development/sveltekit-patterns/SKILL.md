---
name: sveltekit-patterns
description: |
  Guides expert-level sveltekit patterns implementation: javascript and frameworks decision frameworks, production-ready patterns, and concrete templates for sveltekit patterns workflows.
  Use when the user asks about sveltekit patterns, sveltekit patterns configuration, or javascript best practices for sveltekit projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "javascript frameworks web-development backend"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# SvelteKit Patterns

## When to Use

**Use this skill when:**
- The user asks how to structure data loading in SvelteKit using `+page.server.ts`, `+page.ts`, or `+layout.server.ts` and needs to understand the difference between server-only and universal loaders
- The user wants to implement form actions, progressive enhancement, or server-side mutations without building a separate REST API layer
- The user needs guidance on SvelteKit's file-based routing system -- including route groups, optional parameters, rest parameters, and parallel route loading
- The user asks about authentication and session management patterns in SvelteKit, including hooks, locals, and middleware-style request handling
- The user wants to optimize a SvelteKit application for production -- including streaming, prerendering strategies, edge deployment, or adapter selection
- The user is confused about when to use a `load` function vs a form action vs an API route (`+server.ts`)
- The user needs to implement real-time features, optimistic UI updates, or complex client-side state that interacts with SvelteKit's store system

**Do NOT use this skill when:**
- The user is asking about general Svelte component patterns unrelated to routing, loading, or the SvelteKit framework -- check the Svelte component patterns skill instead
- The user needs help with a different meta-framework (Next.js, Nuxt, Remix, Astro) -- those have different mental models and distinct skills
- The user wants to set up a REST or GraphQL API without any UI layer -- that is a backend API design problem, not a SvelteKit routing concern
- The user is asking about deployment infrastructure (Docker, Kubernetes, CDN configuration) beyond selecting a SvelteKit adapter
- The user needs database ORM patterns (Drizzle, Prisma schema design) -- SvelteKit is the transport layer, not the data layer; use database-specific skills for schema design
- The user is asking about general TypeScript configuration or tooling not specific to SvelteKit
- The user wants CSS or design system guidance -- check the styling or component library skills

---

## Process

### 1. Identify the Architectural Layer Being Asked About

Before recommending any pattern, classify the user's problem into one of SvelteKit's distinct layers:

- **Routing layer** -- file-system conventions (`+page.svelte`, `+layout.svelte`, `+error.svelte`, route groups with `(groupname)`, optional params `[[param]]`, rest params `[...rest]`)
- **Data loading layer** -- `load` functions in `+page.ts` (universal), `+page.server.ts` (server-only), `+layout.server.ts` (shared across child routes)
- **Mutation layer** -- form actions in `+page.server.ts` using the `actions` export, progressive enhancement via `use:enhance`
- **API layer** -- `+server.ts` files exposing HTTP endpoints (GET, POST, PUT, DELETE, PATCH) for third-party consumers or client-side fetch calls
- **Middleware layer** -- `src/hooks.server.ts` for `handle`, `handleFetch`, `handleError`; `src/hooks.client.ts` for client-side error handling
- **State layer** -- Svelte stores, `$page` store, `invalidate()`, `invalidateAll()`, `applyAction()` patterns

Ask the user which layer their problem falls in before recommending a solution. A confused question often means conflating two layers -- for example, trying to do session management inside a `load` function instead of in `hooks.server.ts`.

---

### 2. Clarify the Rendering Strategy

SvelteKit supports four rendering strategies and the correct pattern depends entirely on which strategy is in use:

- **SSR (Server-Side Rendering)** -- default; `load` runs on the server, HTML is sent to the client, then hydrated
- **CSR (Client-Side Rendering)** -- set `export const ssr = false` in the page; `load` runs in the browser only
- **SSG (Static Site Generation)** -- set `export const prerender = true`; `load` runs at build time; no server needed at runtime
- **Edge rendering** -- deploy with an edge adapter (Cloudflare Workers, Vercel Edge); code runs in V8 isolates without Node.js APIs

Ask or infer the rendering strategy from context:
- Marketing or documentation sites → SSG with prerendering
- Authenticated dashboards → SSR with server-only load functions
- High-throughput read APIs with user-specific data → SSR + edge adapter + aggressive caching
- SPAs with complex client state → hybrid (prerender shell, CSR for dynamic sections)

The pattern recommendation changes significantly based on this choice.

---

### 3. Diagnose the Data Loading Pattern Needed

Apply this decision tree for data loading:

```
Does the data require credentials, secrets, or database access?
  YES → use +page.server.ts load function (server-only, never sent to client)
  NO → Does the data need to work during SSR AND on client-side navigations without
       re-fetching from server?
         YES → use +page.ts universal load (runs server-side on first load,
                client-side on subsequent navigations using fetch)
         NO → Is this data shared across many child routes?
                YES → use +layout.server.ts or +layout.ts
                NO → use +page.ts or +page.server.ts depending on secret access
```

Key rules for load functions:
- Server `load` functions receive `{ params, url, locals, cookies, fetch, setHeaders, parent }` -- never `request` (that is for actions and `+server.ts`)
- The `fetch` provided to `load` functions is special -- it forwards cookies, deduplicates requests, and works correctly with relative URLs
- `parent()` retrieves the return value of the nearest parent layout's `load` function -- use it to access session data without re-fetching
- Use `error(404, 'Not found')` from `@sveltejs/kit` -- not `throw new Error()` -- to trigger the error page with correct HTTP status codes
- Use `redirect(302, '/login')` from `@sveltejs/kit` for authentication redirects inside load functions

---

### 4. Design the Mutation Strategy

SvelteKit provides two approaches for mutations -- form actions and API routes. Apply this decision tree:

```
Is the mutation triggered by a form submission (or can it be modeled as one)?
  YES → Is the mutation initiated from this page's server context?
          YES → Use form actions (actions export in +page.server.ts)
          NO, from another component → Still use form actions if on the same page;
                                       use +server.ts if it is a shared API
  NO → Use +server.ts with the appropriate HTTP method
```

Form action patterns:
- Default action: `export const actions = { default: async ({ request, locals, cookies }) => {} }`
- Named actions: `export const actions = { create: async (...) => {}, update: async (...) => {}, delete: async (...) => {} }`
- Access form data with `const data = await request.formData(); const value = data.get('fieldname') as string`
- Return `fail(400, { field: 'value', error: 'message' })` for validation errors -- the page re-renders with the `form` prop populated
- Return `redirect(303, '/new-path')` after successful POST (Post/Redirect/Get pattern)
- Use `use:enhance` from `$app/forms` to progressively enhance forms -- the callback receives `{ formElement, formData, action, cancel, submitter }` before submission and returns an async function that receives `{ result, update }` after

Progressive enhancement with custom behavior:
```typescript
import { enhance } from '$app/forms';
import { applyAction } from '$app/forms';

// In the script block
function submitHandler() {
  return async ({ result }) => {
    if (result.type === 'redirect') {
      await applyAction(result);
    } else if (result.type === 'success') {
      // handle optimistic UI update
      await applyAction(result);
    }
  };
}
```

---

### 5. Implement Authentication and Session Patterns

Authentication in SvelteKit belongs in `hooks.server.ts`, not in individual load functions. The correct pattern:

**Step 1 -- Validate session in the handle hook:**
```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const auth: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get('session');
  if (sessionToken) {
    const user = await validateSessionToken(sessionToken);
    if (user) {
      event.locals.user = user;
      event.locals.session = { token: sessionToken };
    }
  }
  return resolve(event);
};

export const handle = sequence(auth);
```

**Step 2 -- Declare locals type in `app.d.ts`:**
```typescript
declare global {
  namespace App {
    interface Locals {
      user: { id: string; email: string; role: 'admin' | 'user' } | null;
      session: { token: string } | null;
    }
    interface PageData {
      user?: App.Locals['user'];
    }
  }
}
```

**Step 3 -- Access locals in layout load function to populate PageData:**
```typescript
// src/routes/+layout.server.ts
export async function load({ locals }) {
  return { user: locals.user };
}
```

**Step 4 -- Protect routes in load functions:**
```typescript
// src/routes/(protected)/+layout.server.ts
import { redirect } from '@sveltejs/kit';
export async function load({ locals }) {
  if (!locals.user) {
    redirect(302, '/login');
  }
  return { user: locals.user };
}
```

Use route groups `(protected)` and `(public)` to separate layouts without affecting the URL structure. Never check authentication in individual `+page.server.ts` files when a layout can handle it for the entire group.

---

### 6. Apply Performance and Caching Patterns

SvelteKit's performance model has several distinct optimization levers:

**Streaming with `defer`-style patterns:**
```typescript
// +page.server.ts
export async function load({ fetch }) {
  // Critical data -- awaited immediately
  const user = await getUser();
  
  // Deferred data -- returned as a Promise, streamed to client
  const recommendations = getRecommendations(user.id); // NOT awaited
  
  return {
    user,
    streamed: { recommendations }
  };
}
```
In the template, use `{#await data.streamed.recommendations}` blocks to show loading states while the promise resolves.

**HTTP cache headers via `setHeaders`:**
```typescript
export async function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'max-age=60, stale-while-revalidate=3600'
  });
  // ...
}
```
Only available in server load functions; ignored in universal load functions during client-side navigation.

**Invalidation patterns:**
- `invalidate('app:user')` -- invalidate any load functions that called `depends('app:user')`
- `invalidateAll()` -- re-run all load functions for the current page (expensive, use sparingly)
- `goto(url, { invalidateAll: true })` -- navigate and invalidate
- Prefer targeted `depends` + `invalidate` over `invalidateAll`

**Preloading:**
- Add `data-sveltekit-preload-data="hover"` to links for hover-triggered prefetching
- Use `preloadData(url)` programmatically from `$app/navigation` for complex prefetch scenarios
- Set `preload` in `svelte.config.js` under `kit.preload` to control which asset types are preloaded

---

### 7. Structure the Project for Scale

For projects beyond a handful of routes, apply these organizational patterns:

**Route groups for layout isolation:**
```
src/routes/
  (marketing)/          # Public marketing pages with minimal layout
    +layout.svelte
    /                   # Home page
    about/
  (app)/                # Authenticated app with sidebar layout
    +layout.server.ts   # Auth check for entire group
    +layout.svelte
    dashboard/
    settings/
  (api)/                # API routes returning JSON
    users/
      +server.ts
```

**Shared load utilities:**
```typescript
// src/lib/server/data.ts -- server-only, never imported in client code
export async function requireUser(locals: App.Locals) {
  if (!locals.user) throw redirect(302, '/login');
  return locals.user;
}
```

**Type-safe `$lib` imports:**
- `$lib` maps to `src/lib` -- use it for all shared code
- `$lib/server/` -- server-only modules; SvelteKit enforces this; importing from client code throws a build error
- `$lib/components/` -- shared Svelte components
- `$lib/utils/` -- shared pure utilities safe for both environments

**Configuration in `svelte.config.js`:**
```javascript
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      '$components': 'src/components',
      '$server': 'src/lib/server'
    },
    csrf: { checkOrigin: true },
    env: { publicPrefix: 'PUBLIC_' }
  }
};
```

---

### 8. Validate and Test the Implementation

SvelteKit-specific testing patterns:

**Unit testing load functions with Vitest:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { load } from './+page.server';

describe('page load', () => {
  it('redirects unauthenticated users', async () => {
    const event = {
      locals: { user: null },
      params: {},
      url: new URL('http://localhost/dashboard'),
      cookies: { get: vi.fn() }
    };
    await expect(load(event as any)).rejects.toMatchObject({ status: 302 });
  });
});
```

**Integration testing with Playwright:**
- Use `@playwright/test` with SvelteKit's dev server; `npm create playwright` scaffolds the setup
- Test form submissions end-to-end including validation errors and redirect behavior
- Test with JavaScript disabled to verify progressive enhancement works correctly

**Type safety:**
- Use the generated `PageData`, `PageServerLoad`, `LayoutServerLoad`, `Actions` types from `./$types` -- these are auto-generated by the SvelteKit compiler per route
- Never manually type load function return values; rely on inference from the generated types

---

## Output Format

When answering a SvelteKit patterns question, structure the response as follows:

```
## SvelteKit Pattern Recommendation: [Problem Description]

### Context Assessment
- Rendering strategy: [SSR / SSG / CSR / Edge]
- Architectural layer: [Routing / Loading / Mutation / API / Middleware / State]
- Authentication required: [Yes / No]

### Pattern Decision
[One-paragraph explanation of why this specific pattern applies, referencing SvelteKit's
constraints and the trade-offs of alternatives]

### File Structure
[Show only the relevant files, not the entire project]
src/
  routes/
    [relevant files with their role noted in comments]

### Implementation
[Complete, copy-pasteable code for each relevant file]

// filename: src/routes/[path]/+page.server.ts
[code block]

// filename: src/routes/[path]/+page.svelte
[code block]

### Type Declarations (if needed)
// filename: src/app.d.ts
[code block]

### Trade-offs
| Concern          | This Approach          | Alternative              |
|------------------|------------------------|--------------------------|
| [concern]        | [how this handles it]  | [what alternative does]  |

### Common Pitfalls for This Pattern
- [specific pitfall 1 with fix]
- [specific pitfall 2 with fix]
```

---

## Rules

1. **Never put secrets or database connections in universal `+page.ts` load functions.** Universal load functions run in the browser during client-side navigation. Database credentials, API keys, and server-only modules (`$lib/server/`) must only appear in `+page.server.ts` or `+layout.server.ts`. Violating this leaks secrets to the client bundle.

2. **Never use `fetch` from the global scope inside server load functions.** Always use the `fetch` argument provided to the load function. The kit-provided `fetch` handles cookie forwarding, relative URL resolution, and request deduplication that the native `fetch` does not.

3. **Always use `error()` and `redirect()` from `@sveltejs/kit` inside load functions.** These are specially recognized thrown values, not errors. Using plain `throw new Error()` will not set the correct HTTP status code and will not trigger the `+error.svelte` boundary correctly.

4. **Always use status 303 for post-redirect-get after form actions, not 302.** The HTTP spec defines 303 as "See Other" specifically for redirecting after a POST. Using 302 can cause browser re-submission warnings and violates REST semantics. SvelteKit's `redirect()` accepts 301, 302, 303, 307, or 308 -- use 303 for form submissions.

5. **Never share mutable state at the module level in server-side code.** SvelteKit server modules are not re-instantiated per request. A variable like `let currentUser = null` at module scope is shared across all concurrent requests. All request-scoped state must be stored in `event.locals` or returned from load functions.

6. **Always declare `$lib/server/` imports only in server-side files.** SvelteKit enforces this at build time, but the error message can be confusing. If a component or universal load function imports from `$lib/server/`, the build fails. Keep the boundary explicit: server utilities in `$lib/server/`, shared safe utilities in `$lib/utils/`.

7. **Never use `invalidateAll()` as a default after mutations.** It re-runs every load function on the page including layout loads. Prefer `invalidate('dependency-key')` combined with `depends('dependency-key')` in the specific load function that needs updating. This reduces redundant network requests significantly in nested layouts.

8. **Always handle the `fail()` return from form actions in the Svelte template.** If a form action returns `fail(400, data)`, the `form` prop on the page is populated. If the template does not render `form?.errors?.fieldname`, users get silent failures. Always bind form state to the `form` prop and display field-level errors.

9. **Never prerender pages that contain user-specific or frequently changing data.** Setting `export const prerender = true` bakes the output at build time. Dynamic data (user profiles, live prices, personalized content) must use SSR. Mixing `prerender = true` with authenticated load functions will either fail at build time or serve stale data.

10. **Always use the `sequence()` helper from `@sveltejs/kit/hooks` when composing multiple `handle` functions.** Manually chaining handle functions with nested calls produces brittle, hard-to-test code. `sequence(auth, logging, rateLimit)` composes them correctly with proper call order and makes each concern independently testable and removable.

---

## Edge Cases

### 1. Load Function Depends on Parent Data That May Fail

When a child `load` function calls `parent()` and the parent layout's load throws an `error()`, the child never runs -- the error boundary catches it. However, if the parent returns `null` for optional data (like a user that may not be logged in), the child must handle the `null` case:

```typescript
// +page.server.ts
export async function load({ parent }) {
  const { user } = await parent(); // may be null for public routes
  const publicData = await getPublicData();
  const personalizedData = user ? await getPersonalizedData(user.id) : null;
  return { publicData, personalizedData };
}
```

Never assume parent data is populated. Layout files in the `(marketing)` group may not set user at all, making `locals.user` undefined rather than null. Use nullish coalescing consistently.

---

### 2. Form Actions With File Uploads

SvelteKit's `request.formData()` supports file uploads, but the file object is a Web API `File`, not a Node.js `Buffer`. The handling differs by adapter:

```typescript
export const actions = {
  upload: async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    if (!(file instanceof File) || file.size === 0) {
      return fail(400, { error: 'No file provided' });
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return fail(400, { error: 'File too large' });
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    await saveFile(buffer, file.name, file.type);
  }
};
```

The `file.arrayBuffer()` approach works across Node, Edge, and Cloudflare Workers adapters. Avoid Node-specific `Readable.from()` patterns if cross-adapter compatibility is needed.

---

### 3. Race Conditions With Navigation and Invalidation

When a user navigates rapidly or submits a form while a previous load is still in flight, SvelteKit cancels previous navigation promises automatically for page loads, but `invalidate()` calls issued programmatically can stack. If a component calls `invalidate()` inside a reactive `$:` block or a `onMount` timer, it can trigger cascading re-loads:

```typescript
// DANGEROUS -- can cause infinite invalidation loop
$: if (someCondition) {
  invalidate('app:data');
}

// SAFE -- gate on a flag
let hasInvalidated = false;
$: if (someCondition && !hasInvalidated) {
  hasInvalidated = true;
  invalidate('app:data');
}
```

For polling patterns, use `setInterval` with `invalidate` but clear the interval in `onDestroy` to prevent memory leaks and stale invalidations after navigation.

---

### 4. SSR + Client State Hydration Mismatch

When a `+page.svelte` uses browser-only APIs (localStorage, window, document) in a way that produces different output during SSR vs. client render, SvelteKit will log a hydration mismatch warning and the page may flicker:

```svelte
<script>
  import { browser } from '$app/environment';
  
  // WRONG -- runs during SSR, window is undefined
  let theme = window?.localStorage.getItem('theme') ?? 'light';
  
  // CORRECT -- deferred to browser only
  let theme = 'light'; // safe default for SSR
  onMount(() => {
    theme = localStorage.getItem('theme') ?? 'light';
  });
</script>
```

Use `browser` from `$app/environment` for conditional execution. For initial render of user preferences (theme, locale), pass them via cookies read in the server load function so SSR and client render agree from the start. Cookies are available in `load` via `event.cookies.get()` and can be set in actions or the `handle` hook.

---

### 5. API Routes vs Form Actions for SPA-Style Interactions

When a Svelte component that is not a page (e.g., a modal dialog or a sidebar component) needs to submit data, it cannot use a page's form actions directly because form actions are scoped to the route that contains them. The options are:

**Option 1 -- Fetch to a `+server.ts` API route:**
```typescript
// src/routes/api/comments/+server.ts
export async function POST({ request, locals }) {
  if (!locals.user) return new Response(null, { status: 401 });
  const body = await request.json();
  const comment = await createComment(body, locals.user.id);
  return Response.json(comment, { status: 201 });
}
```

**Option 2 -- Relocate the form action to a parent layout:**
If the component appears on multiple pages, put the action in a shared layout's `+layout.server.ts` and post to `?/actionName` from anywhere under that layout.

**Option 3 -- Use a dedicated form route as a POST target:**
Create a route at `/actions/[entity]` that only handles POST and immediately redirects. This is the "action routes" pattern and avoids polluting layout files.

Never put authentication logic in `+server.ts` routes redundantly when `hooks.server.ts` already validates the session into `locals`. Just check `locals.user` -- the hook has already done the work.

---

### 6. Adapter Selection for Edge Cases

| Deployment Target | Adapter | Key Constraints |
|---|---|---|
| Vercel (serverless) | `@sveltejs/adapter-vercel` | 10s default timeout; use `export const config = { runtime: 'edge' }` per route for V8 isolates |
| Cloudflare Workers | `@sveltejs/adapter-cloudflare` | No Node.js APIs; use `platform.env` for KV/D1; 128MB memory limit |
| Static hosting (Netlify CDN, S3) | `@sveltejs/adapter-static` | All routes must be prerenderable; no server load functions at runtime |
| Self-hosted Node.js | `@sveltejs/adapter-node` | Full Node.js access; must configure reverse proxy for HTTPS |
| Auto-detect | `@sveltejs/adapter-auto` | Detects Vercel/Netlify/Cloudflare at build time; falls back to Node |

When targeting Cloudflare Workers, the `platform` object is injected into `event.platform` -- access Cloudflare-specific bindings like `event.platform.env.MY_KV` only in server load functions and `+server.ts` files. Declare the type in `app.d.ts` under `App.Platform`.

---

### 7. Handling Cookies Across Subdomains and OAuth Flows

SvelteKit's `cookies.set()` API defaults to `path: '/'` and `httpOnly: true`, but several OAuth scenarios require specific cookie settings:

```typescript
// In hooks.server.ts or a server action
event.cookies.set('session', token, {
  path: '/',
  httpOnly: true,
  secure: !dev,          // HTTPS only in production
  sameSite: 'lax',       // 'strict' breaks OAuth redirects from other domains
  maxAge: 60 * 60 * 24 * 30  // 30 days in seconds
});
```

For multi-subdomain auth (e.g., `app.example.com` and `admin.example.com` sharing a session):
- Set `domain: '.example.com'` on the cookie
- Ensure the session validation in `hooks.server.ts` works across subdomains
- Note that `sameSite: 'strict'` will block the cookie when redirecting back from an OAuth provider -- always use `'lax'` for authentication cookies

---

## Example

**Input:** "I'm building a SvelteKit app where users can manage their projects. I need a dashboard page that shows a list of the user's projects, a form to create a new project, and I want the list to update immediately after creation without a full page reload. The user must be authenticated to see this page."

---

**Output:**

### Context Assessment
- Rendering strategy: SSR (authenticated dashboard with user-specific data)
- Architectural layer: Loading (server load for project list) + Mutation (form action for creation) + Progressive Enhancement (optimistic list update)
- Authentication required: Yes -- session validated in `hooks.server.ts`, enforced in layout

---

### Pattern Decision

This uses a server-only load function to fetch projects (requires database access), a named form action to create projects, and `use:enhance` with a custom callback to append the new project to the list immediately without waiting for the full page re-load. The authentication gate lives in the route group layout, not the page itself, keeping the page load function focused on data.

---

### File Structure

```
src/
  hooks.server.ts          -- session validation → event.locals.user
  app.d.ts                 -- App.Locals and App.PageData types
  lib/
    server/
      db.ts                -- database access (server-only)
      projects.ts          -- project query/mutation functions
  routes/
    (app)/
      +layout.server.ts    -- auth guard for all (app) routes
      +layout.svelte       -- app shell with nav
      dashboard/
        +page.server.ts    -- load projects + form actions
        +page.svelte       -- project list + create form
```

---

### Implementation

```typescript
// filename: src/app.d.ts
declare global {
  namespace App {
    interface Locals {
      user: { id: string; email: string; name: string } | null;
    }
    interface PageData {
      user?: App.Locals['user'];
    }
  }
}
export {};
```

```typescript
// filename: src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { validateSession } from '$lib/server/auth';

const auth: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('session');
  if (token) {
    const user = await validateSession(token);
    event.locals.user = user ?? null;
  } else {
    event.locals.user = null;
  }
  return resolve(event);
};

export const handle = sequence(auth);
```

```typescript
// filename: src/routes/(app)/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, '/login');
  }
  return { user: locals.user };
};
```

```typescript
// filename: src/routes/(app)/dashboard/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { getProjectsByUser, createProject } from '$lib/server/projects';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // locals.user is guaranteed non-null here -- layout guard ran first
  const projects = await getProjectsByUser(locals.user!.id);
  return { projects };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() ?? '';

    if (!name || name.length < 2) {
      return fail(400, {
        name,
        description,
        error: 'Project name must be at least 2 characters.'
      });
    }

    if (name.length > 100) {
      return fail(400, {
        name,
        description,
        error: 'Project name must be 100 characters or fewer.'
      });
    }

    const existing = await getProjectsByUser(locals.user!.id);
    if (existing.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      return fail(409, {
        name,
        description,
        error: 'A project with that name already exists.'
      });
    }

    const project = await createProject({
      name,
      description,
      ownerId: locals.user!.id
    });

    // Return the new project data so the client can append it optimistically
    return { success: true, project };
  }
};
```

```svelte
<!-- filename: src/routes/(app)/dashboard/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  // Local copy of projects so we can append optimistically
  let projects = data.projects;
  let submitting = false;
  let formEl: HTMLFormElement;

  function handleCreate() {
    submitting = true;
    return async ({ result, update }) => {
      submitting = false;
      if (result.type === 'success' && result.data?.project) {
        // Optimistically append without re-running load
        projects = [...projects, result.data.project];
        formEl.reset();
      } else {
        // Let SvelteKit apply the failure result (populates `form` prop)
        await update();
      }
    };
  }
</script>

<h1>Dashboard</h1>
<p>Welcome, {data.user?.name}</p>

<section aria-label="Your projects">
  <h2>Projects ({projects.length})</h2>
  {#if projects.length === 0}
    <p>No projects yet. Create your first one below.</p>
  {:else}
    <ul>
      {#each projects as project (project.id)}
        <li>
          <a href="/dashboard/{project.id}">{project.name}</a>
          {#if project.description}
            <p>{project.description}</p>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

<section aria-label="Create a new project">
  <h2>New Project</h2>

  {#if form?.error}
    <p role="alert" style="color: red">{form.error}</p>
  {/if}

  <form
    method="POST"
    action="?/create"
    use:enhance={handleCreate}
    bind:this={formEl}
  >
    <label>
      Project Name
      <input
        type="text"
        name="name"
        value={form?.name ?? ''}
        required
        minlength="2"
        maxlength="100"
        disabled={submitting}
        aria-invalid={form?.error ? 'true' : undefined}
      />
    </label>

    <label>
      Description (optional)
      <textarea
        name="description"
        disabled={submitting}
      >{form?.description ?? ''}</textarea>
    </label>

    <button type="submit" disabled={submitting}>
      {submitting ? 'Creating…' : 'Create Project'}
    </button>
  </form>
</section>
```

---

### Trade-offs

| Concern | This Approach | Alternative |
|---|---|---|
| Optimistic update | Append to local `projects` array on success | Call `invalidateAll()` -- simpler but causes full re-load |
| Auth enforcement | Route group layout load function | Per-page auth check -- duplicates logic, easy to forget |
| Form errors | `fail()` return + `form` prop binding | Separate API route + client fetch -- more complex, loses progressive enhancement |
| Type safety | `PageServerLoad`, `Actions`, `PageData` from `./$types` | Manual types -- diverge from actual return shapes silently |

---

### Common Pitfalls for This Pattern

- **Not resetting the form after success:** Calling `formEl.reset()` is required after optimistic append; without it the inputs retain their values even though the form data was submitted.
- **Using `invalidateAll()` inside `use:enhance` callback by default:** This re-runs the layout's load function too, causing a database round-trip for the user object that was already loaded. Use targeted invalidation or the optimistic pattern shown above.
- **Returning the new project from the action but not declaring the return type:** The auto-generated `ActionData` type from `./$types` infers `result.data` correctly only if TypeScript can see the return value. Avoid `as any` casts in the action return.
- **Forgetting `aria-invalid` on fields:** Server-side validation errors that re-render the form without ARIA attributes fail accessibility audits. Bind `aria-invalid` to the presence of a field-specific error.
- **Route group folder naming affecting URL:** `(app)` is a route group and does NOT appear in the URL. `/dashboard` routes to `src/routes/(app)/dashboard/+page.svelte` correctly. Do not add visible segment folders expecting them to be invisible.
