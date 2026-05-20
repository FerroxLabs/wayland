---
name: state-management
description: |
  Comprehensive state management patterns covering local vs global state, Redux Toolkit, Zustand, Jotai, signals, server state with TanStack Query, URL state, form state, optimistic updates, and state machines with XState.
  Use when the user asks about state management, state management best practices, or needs guidance on state management implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "web-development frontend design-patterns"
  category: "web-development"
  subcategory: "frontend-frameworks"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# State Management

## Purpose

Select and implement the right state management approach for each use case in a web application. This skill provides decision frameworks, implementation patterns, and best practices for every category of application state.

## State Category Classification

```
CATEGORY          EXAMPLES                        RECOMMENDED SOLUTION
---------------------------------------------------------------------------
UI State          Modal open/close, accordion,    useState / useReducer
(ephemeral)       tooltip visible, active tab      (component-local)

Shared UI State   Sidebar collapsed, theme,       Context / Zustand / Jotai
                  notification queue

Server State      API data, user profile,         TanStack Query / SWR
(cached)          list of items

URL State         Current page, filters,          URL search params (nuqs)
                  sort order, pagination

Form State        Input values, validation,       React Hook Form / Formik
                  dirty/touched tracking

Auth State        Current user, tokens,           Zustand / Context
                  permissions

Complex Workflows Multi-step forms, checkout,     XState (state machines)
                  onboarding flows
```

### Decision Tree

```
Is the state only used by one component?
  YES -> useState or useReducer
  NO  -> Is it server/API data?
    YES -> TanStack Query (cache, sync, refetch)
    NO  -> Is it URL-representable (shareable/bookmarkable)?
      YES -> URL search params
      NO  -> Is it form data?
        YES -> React Hook Form
        NO  -> Is it used by many components?
          YES -> How many updates per second?
            HIGH (>10) -> Zustand or Jotai (avoid Context)
            LOW        -> Context or Zustand
          NO  -> Lift state up to nearest common ancestor
```

## Redux Toolkit Patterns

### When to Use Redux

```
USE Redux Toolkit when:
  - Large team needs predictable, traceable state changes
  - Complex state with many interdependent slices
  - Time-travel debugging is valuable
  - Middleware is needed (logging, persistence, sync)
  - Already using Redux in existing codebase

DO NOT use Redux when:
  - Small app with simple state
  - Mostly server state (use TanStack Query instead)
  - Team is small and doesn't need enforced patterns
```

### Slice Pattern

```ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Async thunk
export const fetchTodos = createAsyncThunk(
  'todos/fetchAll',
  async (filters: TodoFilters, { rejectWithValue }) => {
    try {
      const response = await api.getTodos(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const todosSlice = createSlice({
  name: 'todos',
  # ... (condensed) ...

// Selectors (colocated with slice)
export const selectAllTodos = (state: RootState) => state.todos.items;
export const selectActiveTodos = createSelector(
  selectAllTodos,
  (todos) => todos.filter(t => !t.completed)
);
```

## Zustand

### When to Use Zustand

```
USE Zustand when:
  - Need global state without boilerplate
  - Want React-external state access (outside components)
  - Need fine-grained subscriptions (no unnecessary re-renders)
  - Simpler alternative to Redux for medium-complexity state
  - Need middleware (persist, devtools, immer)
```

### Store Pattern

```ts
import { create } from 'zustand';
import { devtools, persist, immer } from 'zustand/middleware';

interface CartState {
  items: CartItem[];
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      immer((set, get) => ({
        items: [],
        total: 0,
# ... (condensed) ...
function CartCount() {
  const count = useCartStore((state) => state.items.length);
  return <span>{count}</span>;
}

// Usage outside React
const { addItem, items } = useCartStore.getState();
```

## Jotai (Atomic State)

### When to Use Jotai

```
USE Jotai when:
  - Need fine-grained reactivity (individual atoms)
  - Want bottom-up state composition
  - Complex derived state relationships
  - Avoiding unnecessary re-renders is critical
  - State shape is dynamic or unknown at build time
```

### Atom Patterns

```ts
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage, atomFamily } from 'jotai/utils';

// Primitive atom
const countAtom = atom(0);

// Derived (read-only) atom
const doubleCountAtom = atom((get) => get(countAtom) * 2);

// Writable derived atom
const countWithMinAtom = atom(
  (get) => get(countAtom),
  (get, set, newValue: number) => {
    set(countAtom, Math.max(0, newValue));  // Enforce minimum of 0
  }
);

// Async atom (fetches data)
# ... (condensed) ...
);

// Usage
function TodoItem({ id }: { id: string }) {
  const [todo] = useAtom(todoAtomFamily(id));
  return <div>{todo.title}</div>;
}
```

## Server State (TanStack Query)

### Core Patterns

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query with all options
function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],   // Cache key (auto-invalidation on change)
    queryFn: () => api.getUsers(filters),
    staleTime: 5 * 60 * 1000,      // Consider fresh for 5 minutes
    gcTime: 30 * 60 * 1000,        // Keep in cache for 30 minutes
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    placeholderData: (previousData) => previousData,  // Keep previous while loading
    select: (data) => data.filter(u => u.isActive),   // Transform
  });
}

// Mutation with optimistic update
function useToggleTodo() {
  # ... (condensed) ...
    queryKey: ['users', 'infinite'],
    queryFn: ({ pageParam = 0 }) => api.getUsers({ offset: pageParam, limit: 20 }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length * 20 : undefined,
    initialPageParam: 0,
  });
}
```

## URL State

```ts
// Using nuqs (type-safe URL search params for Next.js / React)
import { useQueryState, parseAsInteger, parseAsStringEnum } from 'nuqs';

function ProductList() {
  const [search, setSearch] = useQueryState('q', { defaultValue: '' });
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [sort, setSort] = useQueryState('sort',
    parseAsStringEnum(['price', 'name', 'rating']).withDefault('name')
  );
  const [category, setCategory] = useQueryState('cat');

  // URL automatically reflects: /products?q=shoe&page=2&sort=price&cat=footwear
  // Shareable, bookmarkable, back-button compatible
}

// Manual approach with URLSearchParams
function useURLState<T>(key: string, defaultValue: T, parse: (v: string) => T) {
  const [searchParams, setSearchParams] = useSearchParams();
  # ... (condensed) ...
      }
      return next;
    });
  }, [key, defaultValue, setSearchParams]);

  return [value, setValue] as const;
}
```

## Form State

```ts
// React Hook Form with Zod validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  role: z.enum(['admin', 'user', 'editor']),
  preferences: z.object({
    newsletter: z.boolean(),
    notifications: z.boolean(),
  }),
});

type FormData = z.infer<typeof schema>;

function RegistrationForm() {
  # ... (condensed) ...
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span role="alert">{errors.email.message}</span>}
      {/* ... */}
    </form>
  );
}
```

## State Machines (XState)

### When to Use State Machines

```
USE XState when:
  - Complex UI flows with many states and transitions
  - Impossible states must be prevented (not just handled)
  - Business logic that must be visualized and validated
  - Multi-step processes (checkout, onboarding, wizards)
  - Authentication flows
  - Real-time features with connection states

Examples of good fits:
  - Checkout: idle -> cart -> shipping -> payment -> confirmation
  - Auth: loggedOut -> loggingIn -> loggedIn -> loggingOut
  - Upload: idle -> selecting -> uploading -> processing -> complete | error
  - Connection: disconnected -> connecting -> connected -> reconnecting
```

### Machine Pattern

```ts
import { createMachine, assign } from 'xstate';
import { useMachine } from '@xstate/react';

const uploadMachine = createMachine({
  id: 'upload',
  initial: 'idle',
  context: {
    file: null as File | null,
    progress: 0,
    error: null as string | null,
    url: null as string | null,
  },
  states: {
    idle: {
      on: {
        SELECT_FILE: {
          target: 'selected',
          actions: assign({ file: (_, event) => event.file }),
        # ... (condensed) ...
      {state.matches('selected') && <button onClick={() => send('UPLOAD')}>Upload</button>}
      {state.matches('uploading') && <ProgressBar value={state.context.progress} />}
      {state.matches('complete') && <a href={state.context.url!}>Download</a>}
      {state.matches('error') && <ErrorMessage message={state.context.error!} onRetry={() => send('RETRY')} />}
    </div>
  );
}
```

## State Management Checklist

- [ ] Each piece of state categorized (UI, server, URL, form, auth)
- [ ] Server state managed with TanStack Query (not Redux)
- [ ] URL state used for shareable/bookmarkable filters and pagination
- [ ] Form state managed with React Hook Form + Zod
- [ ] Global client state uses Zustand or Jotai (not over-engineered)
- [ ] Context not used for frequently-updating state
- [ ] Optimistic updates implemented for critical mutations
- [ ] State machines used for complex multi-step flows
- [ ] No prop drilling beyond 2-3 levels
- [ ] State colocation principle followed (state near where it is used)
- [ ] DevTools configured for state inspection in development
- [ ] State persistence strategy defined (localStorage, sessionStorage, URL)

## When to Use

**Use this skill when:**
- Designing or implementing state management solutions
- Reviewing or improving existing state management approaches
- Making architectural or implementation decisions about state management
- Learning state management patterns and best practices
- Troubleshooting state management-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# State Management Analysis

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

**Input:** "Help me implement state management for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended state management approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When state management must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
