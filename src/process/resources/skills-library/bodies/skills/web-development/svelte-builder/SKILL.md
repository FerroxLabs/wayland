---
name: svelte-builder
description: |
  Expert guidance for building applications with Svelte 5 and SvelteKit, covering runes reactivity, component patterns, stores, SSR/SSG, and production deployment.
  Use when the user asks about svelte builder, svelte builder best practices, or needs guidance on svelte builder implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "web-development frontend javascript"
  category: "web-development"
  subcategory: "frontend-frameworks"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Svelte Builder

You are an expert Svelte and SvelteKit developer who builds performant, accessible web applications. You guide developers through Svelte's compiler-first approach, the runes reactivity system, component architecture, server-side rendering, and production deployment patterns. You prioritize Svelte 5 conventions while noting migration paths from Svelte 4.

## Svelte 5 Runes Reactivity

### Core Runes

```svelte
<script> .// $state - reactive state declaration
  let count = $state(0);
  let items = $state([]);
  let user = $state({ name: '', email: '' });

  // $derived - computed values (replaces $: reactive statements)
  let doubled = $derived(count * 2);
  let total = $derived(items.reduce((sum, i) => sum + i.price, 0));

  // $derived.by - complex derivations
  let filtered = $derived.by(() => {
    return items.filter(i => i.active).sort((a, b) => a.name.localeCompare(b.name));
  });

  // $effect - side effects (replaces $: side-effect statements)
  $effect(() => {
    document.title = `Count: ${count}`;
    // cleanup function (optional)
    return () => console.log('cleanup');
  });

  // $effect.pre - runs before DOM updates
  $effect.pre(() => {
    // scroll preservation, measurement, etc.
  });
</script>
```

### Props with $props and $bindable

```svelte
<script> .// Destructured props with defaults
  let { title, variant = 'primary', children, ...rest } = $props();

  // Bindable props (two-way binding)
  let { value = $bindable(''), open = $bindable(false) } = $props();
</script>

<div class="card card--{variant}" {...rest}>
  <h2>{title}</h2>
  {@render children()}
</div>
```

## Component Patterns

### Snippet-Based Composition (Svelte 5)

```svelte
<!-- Parent.svelte -->
<script>
  import DataTable from './DataTable.svelte';
  let users = $state([]);
</script>

{#snippet headerCell(column)}
  <th class="sortable">{column.label}</th>
{/snippet}

{#snippet bodyCell(row, column)}
  {#if column.key === 'avatar'}
    <img src={row.avatar} alt={row.name} width="32" />
  {:else}
    {row[column.key]}
  {/if}
{/snippet}

<DataTable data={users} {headerCell} {bodyCell} />
```

```svelte
<!-- DataTable.svelte -->
<script>
  let { data, columns, headerCell, bodyCell } = $props();
</script>

<table>
  <thead>
    <tr>{#each columns as col}{@render headerCell(col)}{/each}</tr>
  </thead>
  <tbody>
    {#each data as row (row.id)}
      <tr>{#each columns as col}{@render bodyCell(row, col)}{/each}</tr>
    {/each}
  </tbody>
</table>
```

### Reusable Action Pattern

```svelte
<script> ./** Click outside detection action */
  function clickOutside(node, callback) {
    function handleClick(event) {
      if (!node.contains(event.target)) callback();
    }
    document.addEventListener('click', handleClick, true);
    return {
      destroy() {
        document.removeEventListener('click', handleClick, true);
      }
    };
  }

  /** Intersection observer action */
  function inView(node, params = {}) {
    const { threshold = 0.5, once = true } = params;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        node.dispatchEvent(new CustomEvent('inview'));
        if (once) observer.unobserve(node);
      }
    }, { threshold });
    observer.observe(node);
    return { destroy() { observer.disconnect(); } };
  }
</script>

<div use:clickOutside={() => open = false}>
  <!-- dropdown content -->
</div>

<div use:inView={{ threshold: 0.3 }} oninview={loadMore}>
  <!-- lazy loaded section -->
</div>
```

## SvelteKit Application Architecture

### Route Structure

```
src/
  routes/
    +layout.svelte          # Root layout
    +layout.server.ts       # Root layout data (auth, theme)
    +page.svelte            # Home page
    +error.svelte           # Error boundary
    (marketing)/            # Route group (no URL segment)
      +layout.svelte
      about/+page.svelte
      pricing/+page.svelte
    (app)/                  # Authenticated route group
      +layout.server.ts     # Auth guard
      dashboard/
        +page.svelte
        +page.server.ts     # Dashboard data loader
      settings/
        +page.svelte
        +page.server.ts
    api/
      users/
        +server.ts          # API endpoint: GET, POST
        [id]/
          +server.ts        # API endpoint: GET, PUT, DELETE
```

### Data Loading Patterns

```typescript
// +page.server.ts - Server-only data loading
import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals, get, depends }) => {
  if (!locals.user) throw redirect(303, '/login');

  depends('app:posts');  // invalidation key

  const [posts, categories] = await Promise.all([
    get(`/api/posts?author=${locals.user.id}`).then(r => r.json()),
    get('/api/categories').then(r => r.json())
  ]);

  if (!posts) throw error(404, 'No posts found');

  return { posts, categories, user: locals.user };
};
```

```svelte
<!-- +page.svelte -->
<script>
  let { data } = $props();
  // data.posts, data.categories, data.user are typed automatically
</script>
```

### Form Actions

```typescript
// +page.server.ts
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const title = formData.get('title')?.toString().trim();
    const body = formData.get('body')?.toString().trim();

    if (!title || title.length < 3) {
      return fail(400, { title, body, error: 'Title must be at least 3 characters' });
    }

    const post = await locals.db.post.create({ data: { title, body, authorId: locals.user.id } });
    return { success: true, id: post.id };
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = formData.get('id')?.toString();
    await locals.db.post.delete({ where: { id, authorId: locals.user.id } });
    return { success: true };
  }
};
```

```svelte
<!-- +page.svelte -->
<script>
  import { enhance } from '$app/forms';
  let { form } = $props();
</script>

<form method="POST" action="?/create" use:enhance={() => {
  return async ({ update }) => {
    await update({ reset: false });
  };
}}>
  <input name="title" value={form?.title ?? ''} />
  {#if form?.error}<span class="error">{form.error}</span>{/if}
  <textarea name="body">{form?.body ?? ''}</textarea>
  <button type="submit">Create Post</button>
</form>
```

## Stores and Shared State

### Svelte 5 Shared State with Classes

```typescript
// lib/stores/cart.svelte.ts
class CartStore {
  items = $state<CartItem[]>([]);

  get count() { return this.items.length; }
  get total() { return this.items.reduce((sum, i) => sum + i.price * i.qty, 0); }

  add(product: Product, qty = 1) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      this.items.push({ ...product, qty });
    }
  }

  remove(id: string) {
    this.items = this.items.filter(i => i.id !== id);
  }

  clear() { this.items = []; }
}

export const cart = new CartStore();
```

### Context API for Component Trees

```svelte
<!-- ThemeProvider.svelte -->
<script>
  import { setContext } from 'svelte';

  let { theme = 'light', children } = $props();
  let current = $state(theme);

  setContext('theme', {
    get current() { return current; },
    toggle() { current = current === 'light' ? 'dark' : 'light'; }
  });
</script>

{@render children()}
```

```svelte
<!-- ThemedButton.svelte -->
<script>
  import { getContext } from 'svelte';
  const theme = getContext('theme');
</script>

<button class="btn btn--{theme.current}" onclick={theme.toggle}>
  Toggle Theme
</button>
```

## SSR, SSG, and Rendering Strategies

### Per-Route Rendering Control

```typescript
// +page.ts - Client-side rendering
export const ssr = false;
export const csr = true;

// +page.ts - Static pre-rendering
export const prerender = true;

// +page.server.ts - Dynamic with streaming
export const load = async ({ get }) => {
  return {
    quickData: await get('/api/quick').then(r => r.json()),
    // Streamed (resolves after initial HTML)
    slowData: get('/api/slow').then(r => r.json())
  };
};
```

### Adapter Configuration

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-node';      // Node server
// import adapter from '@sveltejs/adapter-static';  // Static site
// import adapter from '@sveltejs/adapter-vercel';  // Vercel
// import adapter from '@sveltejs/adapter-cloudflare'; // Cloudflare

export default {
  kit: {
    adapter: adapter({ out: 'build', precompress: true }),
    alias: {
      $components: 'src/lib/components',
      $stores: 'src/lib/stores',
      $utils: 'src/lib/utils'
    },
    prerender: {
      handleHttpError: 'warn',
      entries: ['*', '/sitemap.xml']
    }
  }
};
```

## Performance Checklist

- [ ] Use `{#key}` blocks only when necessary to force re-creation
- [ ] Apply `{#each items as item (item.id)}` keyed each blocks for list stability
- [ ] Prefer `$derived` over `$effect` for computed values (avoids extra render cycles)
- [ ] Use `$effect.pre` for DOM measurements before paint
- [ ] Lazy load routes with dynamic imports in hooks
- [ ] Stream slow data promises from server load functions
- [ ] Set `prerender = true` on static pages
- [ ] Use `precompress: true` in adapter config for gzip/brotli
- [ ] Inline critical CSS with `vitePreprocess` configuration
- [ ] Add `loading="lazy"` and explicit dimensions to images
- [ ] Use the `{@html}` tag sparingly and sanitize content
- [ ] Profile with Svelte DevTools browser extension

## Migration from Svelte 4 to Svelte 5

| Svelte 4 | Svelte 5 |
|-----------|----------|
| `export let prop` | `let { prop } = $props()` |
| `$: derived = x * 2` | `let derived = $derived(x * 2)` |
| `$: { sideEffect() }` | `$effect(() => { sideEffect() })` |
| `<slot />` | `{@render children()}` |
| `<slot name="header" />` | `{@render header()}` |
| `$$restProps` | `let { ...rest } = $props()` |
| `createEventDispatcher` | callback props |
| Writable stores | Class with `$state` fields |

## When to Use

**Use this skill when:**
- Designing or implementing svelte builder solutions
- Reviewing or improving existing svelte builder approaches
- Making architectural or implementation decisions about svelte builder
- Learning svelte builder patterns and best practices
- Troubleshooting svelte builder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Svelte Builder Analysis

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

**Input:** "Help me implement svelte builder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended svelte builder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When svelte builder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
