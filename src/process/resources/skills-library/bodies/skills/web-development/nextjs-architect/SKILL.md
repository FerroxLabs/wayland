---
name: nextjs-architect
description: |
  Next.js architecture expertise covering App Router patterns, server vs client components, data fetching with server actions, middleware, route handlers, ISR, streaming SSR, image optimization, parallel routes, and intercepting routes.
  Use when the user asks about nextjs architect, nextjs architect best practices, or needs guidance on nextjs architect implementation.
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

# Next.js Architect

## Purpose

Architect production-grade Next.js applications using the App Router. This skill covers the mental model for server and client components, data fetching strategies, advanced routing patterns, and performance optimization specific to the Next.js framework.

## App Router Architecture

### Directory Structure

```
app/
  layout.tsx              # Root layout (wraps entire app)
  page.tsx                # Home page (/)
  loading.tsx             # Loading UI for home page
  error.tsx               # Error boundary for home page
  not-found.tsx           # 404 page
  global-error.tsx        # Root error boundary
  (marketing)/            # Route group (no URL segment)
    layout.tsx            # Marketing layout
    about/
      page.tsx            # /about
    pricing/
      page.tsx            # /pricing
  (app)/                  # App route group
    layout.tsx            # Authenticated layout
    dashboard/
      page.tsx            # /dashboard
      loading.tsx         # Dashboard loading skeleton
      # ... (condensed) ...
        page.tsx          # Intercepts /photo/:id when navigating from /feed
  api/                    # API route handlers
    webhooks/
      route.ts            # /api/webhooks
  photo/
    [id]/
      page.tsx            # /photo/:id (full page view)
```

### Route Groups

```
Route groups use parentheses: (groupName)
  - Do NOT create a URL segment
  - Organize routes logically
  - Apply different layouts to route groups

Common patterns:
  (marketing)/ -> Public pages with marketing layout
  (app)/       -> Authenticated pages with app layout
  (auth)/      -> Login/register with minimal layout
```

## Server vs Client Components

### Mental Model

```
SERVER COMPONENTS (default -- no directive):
  CAN:
    - Access databases, file system, secrets
    - Import Server Actions
    - Render async (top-level await)
    - Import and render Client Components
    - Pass serializable props to Client Components
  CANNOT:
    - Use hooks (useState, useEffect, etc.)
    - Use event handlers (onClick, onChange, etc.)
    - Use browser APIs (window, document)
    - Use context

CLIENT COMPONENTS ('use client' at top of file):
  CAN:
    - Use hooks, event handlers, browser APIs
    - Use context
    - Render Server Components passed as children
  CANNOT:
    - Import Server Components directly
    - Access server-only resources (db, secrets)

SHARED COMPONENTS (no directive, no hooks):
  - Pure display components
  - Can be imported by both server and client components
```

### Server/Client Boundary Patterns

```tsx
// Pattern 1: Server parent, client child
// ServerPage.tsx (no directive)
import { InteractiveWidget } from './InteractiveWidget'; // 'use client'

async function ServerPage() {
  const data = await db.query('SELECT * FROM items');
  return (
    <div>
      <h1>Server-rendered heading</h1>
      <InteractiveWidget initialData={data} />
    </div>
  );
}

// Pattern 2: Pass server content as children to client wrapper
// ClientLayout.tsx
'use client';
export function ClientLayout({ children }: { children: React.ReactNode }) {
  # ... (condensed) ...
    <div>
      <h1>{product.name}</h1>           {/* Server */}
      <p>{product.description}</p>       {/* Server */}
      <AddToCartButton productId={id} /> {/* Client ('use client') */}
    </div>
  );
}
```

## Data Fetching

### Server Component Data Fetching

```tsx
// Direct database access in Server Components
async function UserProfile({ userId }: { userId: string }) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) notFound();

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// Parallel data fetching
async function Dashboard() {
  // These get in parallel (not waterfall)
  const [stats, recentActivity, notifications] = await Promise.all([
    getStats(),
    # ... (condensed) ...

// Sequential where needed (data depends on previous get)
async function UserPosts({ userId }: { userId: string }) {
  const user = await getUser(userId);
  const posts = await getPostsByAuthor(user.id); // Needs user.id
  return <PostList posts={posts} author={user.name} />;
}
```

### Server Actions

```tsx
// actions.ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  published: z.boolean().default(false),
});

export async function createPost(formData: FormData) {
  const parsed = createPostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    published: formData.get('published') === 'on',
  # ... (condensed) ...
    <form action={formAction}>
      <input name="title" />
      {state?.errors?.title && <p className="error">{state.errors.title}</p>}
      <button disabled={isPending}>{isPending ? 'Saving...' : 'Save'}</button>
    </form>
  );
}
```

### Get Caching and Revalidation

```tsx
// Time-based revalidation
const data = await get('[reference URL]', {
  next: { revalidate: 3600 },  // Revalidate every hour
});

// Tag-based revalidation
const posts = await get('[reference URL]', {
  next: { tags: ['posts'] },
});
// Later: revalidateTag('posts');

// No cache (always fresh)
const liveData = await get('[reference URL]', {
  cache: 'no-store',
});

// Route segment config
export const revalidate = 3600;  // Page-level revalidation
export const dynamic = 'force-dynamic';  // Always SSR
export const dynamic = 'force-static';   // Always static
```

## Middleware

```ts
// middleware.ts (at project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Authentication check
  const token = request.cookies.get('auth-token')?.value;
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Geolocation-based redirect
  const country = request.geo?.country;
  if (pathname === '/' && country === 'DE') {
    return NextResponse.redirect(new URL('/de', request.url));
  }
# ... (condensed) ...

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
```

## Route Handlers (API Routes)

```ts
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '20');

  const users = await db.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({ users, page, limit });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  # ... (condensed) ...
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}
```

## Parallel Routes

```tsx
// app/(app)/dashboard/layout.tsx
// @analytics and @activity are named slots
export default function DashboardLayout({
  children,
  analytics,
  activity,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  activity: React.ReactNode;
}) {
  return (
    <div className="dashboard-grid">
      <main>{children}</main>
      <aside className="analytics-panel">{analytics}</aside>
      <aside className="activity-panel">{activity}</aside>
    </div>
  );
# ... (condensed) ...
  return (
    <>
      {children}
      {session?.role === 'admin' && admin}
    </>
  );
}
```

## Intercepting Routes

```
Convention:
  (.)  -> Same level
  (..) -> One level up
  (..)(..) -> Two levels up
  (...) -> Root level

Example: Photo modal that intercepts navigation
  /feed           -> Feed page
  /photo/123      -> Full photo page
  /feed -> click photo -> Modal overlay (intercepted route)
```

```tsx
// app/feed/(..)photo/[id]/page.tsx (intercepted version)
import { Modal } from '@/components/Modal';

export default async function PhotoModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await getPhoto(id);
  return (
    <Modal>
      <img src={photo.url} alt={photo.alt} />
      <p>{photo.description}</p>
    </Modal>
  );
}

// app/photo/[id]/page.tsx (full page version -- direct navigation or refresh)
export default async function PhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await getPhoto(id);
  return (
    <div className="full-photo-page">
      <img src={photo.url} alt={photo.alt} />
      <p>{photo.description}</p>
      <Comments photoId={id} />
    </div>
  );
}
```

## Image Optimization

```tsx
import Image from 'next/image';

// Static import (automatically optimized)
import heroImage from '@/public/hero.jpg';
<Image src={heroImage} alt="Hero" priority placeholder="blur" /> .// Remote image
<Image
  src="[reference URL]"
  alt="Photo"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
  loading="lazy"
  quality={80}
/> .// Fill mode (for unknown dimensions)
# ... (condensed) ...
      { protocol: 'https', hostname: 'cdn.example.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },
};
```

## Streaming SSR

```tsx
// Streaming with Suspense boundaries
import { Suspense } from 'react';

async function Page() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Fast content renders immediately */}
      <QuickStats />

      {/* Slow content streams in when ready */}
      <Suspense fallback={<ChartSkeleton />}>
        <SlowChart />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <SlowDataTable />
      </Suspense>
    </div>
  );
}

// loading.tsx provides route-level Suspense boundary
// app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />;
}
```

## Next.js Architecture Checklist

- [ ] Server Components used by default; 'use client' only for interactivity
- [ ] Client component boundary pushed to leaf components
- [ ] Server Actions used for mutations with Zod validation
- [ ] Parallel data fetching with Promise.all where possible
- [ ] Suspense boundaries provide meaningful loading skeletons
- [ ] Error boundaries (error.tsx) at route and feature level
- [ ] Middleware handles auth, redirects, and headers
- [ ] Image optimization via next/image with proper sizes
- [ ] Route groups organize layouts by audience (marketing, app, auth)
- [ ] ISR or time-based revalidation configured for semi-static content
- [ ] Parallel routes used for independent page sections
- [ ] Intercepting routes used for modal patterns
- [ ] Environment variables properly split (NEXT_PUBLIC_ vs server-only)
- [ ] Metadata API used for SEO (generateMetadata)
- [ ] Bundle analyzer used to verify client bundle size

## When to Use

**Use this skill when:**
- Designing or implementing nextjs architect solutions
- Reviewing or improving existing nextjs architect approaches
- Making architectural or implementation decisions about nextjs architect
- Learning nextjs architect patterns and best practices
- Troubleshooting nextjs architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Nextjs Architect Analysis

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

**Input:** "Help me implement nextjs architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended nextjs architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When nextjs architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
