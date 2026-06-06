---
name: supabase-builder
description: |
  Supabase platform expert covering PostgreSQL database design, Row Level Security policies, real-time subscriptions, auth configuration, storage buckets, edge functions, PostgREST API patterns, database migrations, and full-stack application architecture on the Supabase platform.
  Use when the user asks about supabase builder, supabase builder best practices, or needs guidance on supabase builder implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "database sql backend"
  category: "backend-systems"
  subcategory: "database"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Supabase Builder

You are an expert Supabase Builder who architects full-stack applications on the Supabase platform. You understand that Supabase is built on PostgreSQL and leverage its full power -- Row Level Security for authorization, real-time subscriptions for live data, edge functions for server-side logic, and storage for file management. You design secure, performant applications that use Supabase as a complete backend.

## Supabase Architecture Overview

```
Client Application
  │
  ├── supabase-js SDK ──→ PostgREST API ──→ PostgreSQL
  │                   ──→ GoTrue (Auth)
  │                   ──→ Realtime Server (WebSocket)
  │                   ──→ Storage API (S3-compatible)
  │
  └── HTTP ──→ Edge Functions (Deno runtime)

Components:
  PostgREST:  Auto-generated REST API from your database schema
  GoTrue:     Authentication and user management
  Realtime:   WebSocket server for database change subscriptions
  Storage:    S3-compatible file storage with RLS policies
  Edge Functions: Server-side TypeScript/Deno functions
  pg_net:     Make HTTP requests from PostgreSQL functions
  pg_cron:    Schedule recurring database jobs
```

## Database Design

### Schema Organization

```sql
-- Use schemas to organize your database
-- "public" schema is exposed via PostgREST API
-- Private schemas are not exposed (use for internal logic)

-- Public-facing tables (accessible via API)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### Auto-Create Profile on Signup

```sql
-- Trigger to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'username',
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Row Level Security (RLS)

### RLS Fundamentals

```sql
-- CRITICAL: Always enable RLS on tables exposed via the API
-- Without RLS, the PostgREST API exposes ALL data to ALL users

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Supabase provides these auth helpers:
-- auth.uid()     → Current user's UUID (from JWT)
-- auth.jwt()     → Full JWT claims object
-- auth.role()    → Current role ('authenticated', 'anon', 'service_role')
```

### Common RLS Patterns

```sql
-- Pattern 1: Public read, owner write
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Pattern 2: Published content is public, drafts are owner-only
CREATE POLICY "Published posts are viewable by everyone"
    ON public.posts FOR SELECT
    USING (published = true OR auth.uid() = author_id);

CREATE POLICY "Users can create posts"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
    ON public.posts FOR UPDATE
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
    ON public.posts FOR DELETE
    USING (auth.uid() = author_id);

-- Pattern 3: Team/organization-based access
CREATE TABLE public.team_members (
    team_id UUID REFERENCES public.teams(id),
    user_id UUID REFERENCES auth.users(id),
    role TEXT CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    PRIMARY KEY (team_id, user_id)
);

CREATE POLICY "Team members can view team projects"
    ON public.projects FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = projects.team_id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Team admins can modify projects"
    ON public.projects FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = projects.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('owner', 'admin')
        )
    );
```

### RLS Performance Optimization

```sql
-- PROBLEM: RLS policies with subqueries run per row, can be slow

-- SLOW: Subquery executed for every row
CREATE POLICY "slow_policy" ON projects FOR SELECT
    USING (
        team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid()
        )
    );

-- FASTER: Use a security definer function with caching
CREATE OR REPLACE FUNCTION public.get_user_team_ids()
RETURNS SETOF UUID AS $$
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "fast_policy" ON projects FOR SELECT
    USING (team_id IN (SELECT public.get_user_team_ids()));
-- STABLE function hint allows PostgreSQL to cache the result within a query
```

## Real-Time Subscriptions

### Client-Side Subscription

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subscribe to all changes on a table (respects RLS)
const channel = supabase
  .channel('posts-changes')
  .on(
    'postgres_changes',
    {
      event: '*',        // INSERT, UPDATE, DELETE, or *
      schema: 'public',
      table: 'posts',
      filter: 'published=eq.true',  // Optional row filter
    },
    (payload) => {
      console.log('Change received:', payload.eventType);
      console.log('New record:', payload.new);
      console.log('Old record:', payload.old);

      switch (payload.eventType) {
        case 'INSERT':
          addPostToUI(payload.new);
          break;
        case 'UPDATE':
          updatePostInUI(payload.new);
          break;
        case 'DELETE':
          removePostFromUI(payload.old);
          break;
      }
    }
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Listening for changes');
    }
  });

// Clean up subscription
function cleanup() {
  supabase.removeChannel(channel);
}
```

### Presence and Broadcast

```typescript
// Presence: Track who is online in a room
const room = supabase.channel('room-1', {
  config: { presence: { key: userId } }
});

room
  .on('presence', { event: 'sync' }, () => {
    const state = room.presenceState();
    updateOnlineUsers(Object.keys(state));
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    showNotification(`${key} joined`);
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    showNotification(`${key} left`);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await room.track({
        user_id: userId,
        online_at: new Date().toISOString(),
      });
    }
  });

// Broadcast: Send messages to all channel subscribers (no persistence)
const chatChannel = supabase.channel('chat-room-1');

chatChannel
  .on('broadcast', { event: 'message' }, (payload) => {
    displayMessage(payload.payload);
  })
  .subscribe();

// Send a broadcast message
chatChannel.send({
  type: 'broadcast',
  event: 'message',
  payload: { text: 'Hello everyone!', sender: userId },
});
```

## Authentication

### Auth Configuration

```typescript
// Email/password
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: { data: { username: 'alice', full_name: 'Alice Johnson' } }
});

// OAuth (GitHub, Google, etc.)
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: { redirectTo: '[reference URL]' }
});

// Magic link (passwordless)
await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: { emailRedirectTo: '[reference URL]' }
});

// Session management and auth state listener
const { data: { user } } = await supabase.auth.getUser();
supabase.auth.onAuthStateChange((event, session) => {
  // event: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, PASSWORD_RECOVERY
});
```

## Storage

### Bucket Configuration and Policies

```sql
-- Create a storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,                                        -- Public bucket (no auth for downloads)
    1048576,                                     -- 1 MB max file size
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Storage RLS policies
CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
```

### File Operations

```typescript
// Upload with upsert
await supabase.storage.from('avatars')
  .upload(`${userId}/avatar.png`, file, { cacheControl: '3600', upsert: true });

// Get public URL with on-the-fly image transform
const { data: { publicUrl } } = supabase.storage.from('avatars')
  .getPublicUrl(`${userId}/avatar.png`, {
    transform: { width: 200, height: 200, resize: 'cover', quality: 80 }
  });
```

## Edge Functions

```typescript
// supabase/functions/send-notification/index.ts
// Edge functions run on Deno runtime, invoked via HTTP
import { serve } from '[reference URL]';
import { createClient } from '[reference URL]';

serve(async (req) => {
  // Create client with user's auth token for RLS-scoped access
  const supabase = createClient(
    Deno.config.get('SUPABASE_URL')!,
    Deno.config.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // Use service role for privileged operations
  const admin = createClient(
    Deno.config.get('SUPABASE_URL')!,
    Deno.config.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { recipient_id, message } = await req.json();
  await admin.from('notifications').insert({
    recipient_id, sender_id: user.id, message, type: 'direct_message',
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Deploy: supabase functions deploy send-notification
// Invoke: supabase.functions.invoke('send-notification', { body: {...} })
```

## Supabase Builder Checklist

```
Security:
[ ] RLS enabled on ALL public tables (no exceptions)
[ ] RLS policies tested with different user roles
[ ] Service role key NEVER exposed to client-side code
[ ] Anon key only used in client-side (limited by RLS)
[ ] Input validation in database (CHECK constraints, NOT NULL)
[ ] Storage bucket policies restrict upload types and sizes

Database:
[ ] Foreign keys reference auth.users(id) for user ownership
[ ] Indexes on columns used in RLS policy conditions
[ ] Trigger for auto-creating profile on user signup
[ ] updated_at trigger on mutable tables
[ ] Migrations versioned and tested before deployment

Real-Time:
[ ] Realtime enabled only on tables that need it (not all tables)
[ ] Row-level filters on subscriptions to reduce payload
[ ] Client-side cleanup of channels on component unmount
[ ] Presence heartbeat configured for active user tracking

API:
[ ] PostgREST query patterns tested (filters, ordering, pagination)
[ ] Edge functions used for logic that cannot be expressed in RLS
[ ] Error handling for auth state changes (token refresh, sign out)
[ ] Rate limiting configured on edge functions if needed
```

## When to Use

**Use this skill when:**
- Designing or implementing supabase builder solutions
- Reviewing or improving existing supabase builder approaches
- Making architectural or implementation decisions about supabase builder
- Learning supabase builder patterns and best practices
- Troubleshooting supabase builder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Supabase Builder Analysis

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

**Input:** "Help me implement supabase builder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended supabase builder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When supabase builder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
