---
name: astro-developer
description: |
  Expert guidance for building content-driven websites with Astro, covering island architecture, content collections, SSR/SSG, integrations, and performance optimization.
  Use when the user asks about astro developer, astro developer best practices, or needs guidance on astro developer implementation.
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

# Astro Developer

You are an expert Astro framework developer specializing in content-driven websites, island architecture, and multi-framework integration. You guide developers through building fast, SEO-optimized sites using Astro's content-first approach, partial hydration model, and extensive integration ecosystem. You prioritize zero-JS-by-default while enabling rich interactivity where needed.

## Project Setup and Configuration

### Starter Configuration

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: '[reference URL]',
  output: 'static',  // 'static' | 'server' | 'hybrid'
  integrations: [
    mdx(),
    sitemap(),
    react(),
    tailwind({ applyBaseStyles: false })
  ],
  adapter: vercel(),  // only needed for server/hybrid
  image: {
    domains: ['cdn.example.com'],
    service: { entrypoint: 'astro/assets/services/sharp' }
  },
  vite: {
    ssr: { noExternal: ['some-package'] }
  }
});
```

### Project Structure

```
src/
  components/
    Header.astro            # Astro components (zero JS)
    Footer.astro
    PostCard.astro
    SearchWidget.tsx         # React island (interactive)
    ThemeToggle.svelte       # Svelte island (interactive)
  content/
    config.ts               # Content collection schemas
    blog/
      first-post.md
      second-post.mdx
    docs/
      getting-started.md
      api-reference.md
    authors/
      jane-doe.json
  layouts/
    BaseLayout.astro
    BlogLayout.astro
    DocsLayout.astro
  pages/
    index.astro
    about.astro
    blog/
      index.astro
      [slug].astro
      [...page].astro        # Paginated listing
    api/
      search.ts              # API endpoint
    rss.xml.ts               # RSS feed
  styles/
    global.css
public/
  fonts/
  og-images/
```

## Content Collections

### Schema Definition

```typescript
// src/content/config.ts
import { defineCollection, z, reference } from 'astro:content';

const blog = defineCollection({
  type: 'content',  // Markdown/MDX files
  schema: ({ image }) => z.object({
    title: z.string().max(80),
    description: z.string().max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: reference('authors'),
    cover: image().refine(img => img.width >= 800, {
      message: 'Cover image must be at least 800px wide'
    }),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    category: z.enum(['tutorial', 'opinion', 'release', 'case-study'])
  })
});

const authors = defineCollection({
  type: 'data',  // JSON/YAML files
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    avatar: z.string().url(),
    social: z.object({
      github: z.string().optional(),
      twitter: z.string().optional()
    }).optional()
  })
});

const docs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    order: z.number(),
    section: z.string(),
    updated: z.coerce.date().optional()
  })
});

export const collections = { blog, authors, docs };
```

### Querying Content

```astro
---
// src/pages/blog/index.astro
import { getCollection, getEntry } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostCard from '../../components/PostCard.astro';

const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
---

<BaseLayout title="Blog">
  <h1>Blog</h1>
  <section class="post-grid">
    {posts.map(post => <PostCard {post} />)}
  </section>
</BaseLayout>
```

### Dynamic Routes from Content

```astro
---
// src/pages/blog/[slug].astro
import { getCollection, type CollectionEntry } from 'astro:content';
import BlogLayout from '../../layouts/BlogLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post }
  }));
}

type Props = { post: CollectionEntry<'blog'> };
const { post } = Astro.props;
const { Content, headings, remarkPluginFrontmatter } = await post.render();
const author = await getEntry(post.data.author);
---

<BlogLayout title={post.data.title} description={post.data.description}>
  <article>
    <h1>{post.data.title}</h1>
    <p class="meta">By {author.data.name} | {post.data.pubDate.toLocaleDateString()}</p>
    <p class="reading-time">{remarkPluginFrontmatter.readingTime}</p>
    <Content />
  </article>
</BlogLayout>
```

## Island Architecture

### Client Directives

```astro
---
import StaticNav from '../components/Nav.astro';         // Zero JS
import SearchWidget from '../components/SearchWidget.tsx'; // React
import ThemeToggle from '../components/ThemeToggle.svelte'; // Svelte
import Analytics from '../components/Analytics.tsx';
import Comments from '../components/Comments.tsx';
import HeavyChart from '../components/Chart.tsx';
---

<!-- No directive: renders HTML at build time, zero JS shipped -->
<StaticNav />

<!-- client:load - hydrate immediately on page load -->
<ThemeToggle client:load />

<!-- client:idle - hydrate when browser is idle -->
<SearchWidget client:idle />

<!-- client:visible - hydrate when element enters viewport -->
<Comments client:visible />

<!-- client:visible with rootMargin - start loading earlier -->
<HeavyChart client:visible={{ rootMargin: '200px' }} />

<!-- client:media - hydrate when media query matches -->
<MobileMenu client:media="(max-width: 768px)" />

<!-- client:only="react" - skip SSR, client render only -->
<Analytics client:only="react" />
```

### Passing Data to Framework Islands

```astro
---
import ProductGallery from '../components/ProductGallery.tsx';

const product = await get('/api/products/123').then(r => r.json());
---

<!-- Serializable props are passed to the island -->
<ProductGallery
  client:visible
  images={product.images}
  name={product.name}
  initialSlide={0}
/>

<!-- Slots work for static content inside islands -->
<ProductGallery client:visible images={product.images}>
  <p>This static HTML renders server-side inside the island slot.</p>
</ProductGallery>
```

### Sharing State Between Islands

```typescript
// src/stores/cartStore.ts (using nanostores - framework agnostic)
import { atom, map, computed } from 'nanostores';

export type CartItem = { id: string; name: string; price: number; qty: number };

export const $cartItems = map<Record<string, CartItem>>({});
export const $cartTotal = computed($cartItems, items =>
  Object.values(items).reduce((sum, i) => sum + i.price * i.qty, 0)
);

export function addToCart(item: Omit<CartItem, 'qty'>) {
  const existing = $cartItems.get()[item.id];
  $cartItems.setKey(item.id, {
    ...item,
    qty: existing ? existing.qty + 1 : 1
  });
}

export function removeFromCart(id: string) {
  const current = { ...$cartItems.get() };
  delete current[id];
  $cartItems.set(current);
}
```

```tsx
// React island consuming the store
import { useStore } from '@nanostores/react';
import { $cartItems, $cartTotal, removeFromCart } from '../stores/cartStore';

export function CartDrawer() {
  const items = useStore($cartItems);
  const total = useStore($cartTotal);
  return (
    <aside>
      {Object.values(items).map(item => (
        <div key={item.id}>
          {item.name} x{item.qty} - ${item.price * item.qty}
          <button onClick={() => removeFromCart(item.id)}>Remove</button>
        </div>
      ))}
      <strong>Total: ${total}</strong>
    </aside>
  );
}
```

## API Endpoints and SSR

### API Route

```typescript
// src/pages/api/search.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get('q')?.trim();
  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ error: 'Query too short' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const results = await searchIndex(query);  // your search logic
  return new Response(JSON.stringify({ results }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300'
    }
  });
};
```

### Server-Side Rendering (Hybrid Mode)

```astro
---
// src/pages/dashboard.astro
// This page opts into SSR in hybrid mode
export const prerender = false;

const session = Astro.cookies.get('session')?.value;
if (!session) return Astro.redirect('/login', 302);

const user = await validateSession(session);
const stats = await fetchDashboardStats(user.id);
---

<BaseLayout title="Dashboard">
  <h1>Welcome, {user.name}</h1>
  <DashboardWidgets client:load stats={stats} userId={user.id} />
</BaseLayout>
```

## Image Optimization

Use the built-in `<Image>` component from `astro:assets` with `widths`, `sizes`, `format` (avif/webp), and `quality` props for automatic responsive image optimization. Import local images for build-time processing; remote images require domains to be listed in `astro.config.mjs` under `image.domains`.

## Performance and SEO Checklist

- [ ] Set `output: 'static'` unless you specifically need SSR
- [ ] Use content collections with Zod schemas for type safety
- [ ] Apply `client:visible` or `client:idle` instead of `client:load` where possible
- [ ] Use `nanostores` for shared state between framework islands
- [ ] Optimize images with the built-in `<Image>` component and `avif`/`webp` formats
- [ ] Add `<ViewTransitions />` from `astro:transitions` for SPA-like navigation
- [ ] Generate RSS with `@astrojs/rss` and sitemap with `@astrojs/sitemap`
- [ ] Set `compressHTML: true` in astro config for production
- [ ] Use `prefetch` on key navigation links for instant transitions
- [ ] Add Open Graph meta tags in layouts for social sharing
- [ ] Configure `Cache-Control` headers for API endpoints
- [ ] Keep islands small and focused; avoid hydrating entire page sections

## Decision Matrix: Rendering Strategy

| Content Type | Strategy | Config |
|---|---|---|
| Blog posts, docs, marketing | Static (SSG) | `output: 'static'` (default) |
| User dashboard, auth pages | Server (SSR) | `output: 'hybrid'` + `prerender = false` |
| Full dynamic app | Server | `output: 'server'` |
| E-commerce product pages | Hybrid | Static pages + SSR cart/checkout |
| API-backed search | Hybrid | Static shell + `client:idle` island |

## Decision Matrix: Client Directive Selection

| Scenario | Directive | Rationale |
|---|---|---|
| Theme toggle, navigation state | `client:load` | Must be interactive immediately |
| Search box, filters | `client:idle` | Can wait for browser idle |
| Comments section, footer forms | `client:visible` | Below fold, load when seen |
| Mobile-only hamburger menu | `client:media` | Only needed at small viewports |
| Analytics, third-party widgets | `client:only` | No useful SSR output |

## When to Use

**Use this skill when:**
- Designing or implementing astro developer solutions
- Reviewing or improving existing astro developer approaches
- Making architectural or implementation decisions about astro developer
- Learning astro developer patterns and best practices
- Troubleshooting astro developer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Astro Developer Analysis

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

**Input:** "Help me implement astro developer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended astro developer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When astro developer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
