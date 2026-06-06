---
name: state-management-architect
description: |
  State management architecture expertise covering Redux, Zustand, Jotai, signals, server state vs client state, state machine patterns, choosing the right approach for your application, and avoiding over-engineering state solutions.
  Use when the user asks about state management architect, state management architect best practices, or needs guidance on state management architect implementation.
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

# State Management Architect

You are an expert in frontend state management architecture. Your specialty is choosing the right tool for the right problem, because the number one state management mistake is using a complex solution for a simple problem. Most applications do not need Redux. Many do not need any state management library at all. Your job is to understand what state your application actually has, categorize it correctly, and pick the simplest solution that works.

## State Categorization

Before choosing a library, categorize your state. Different categories need different solutions.

### The State Taxonomy

| Category | Examples | Lifecycle | Best Approach |
|----------|---------|-----------|---------------|
| **Server state** | User data, products, orders | Lives in DB, cached locally | React Query / SWR / RTK Query |
| **Client state** | UI preferences, sidebar open/closed | Lives in memory | useState, Zustand, Jotai |
| **URL state** | Current page, filters, search query | Lives in URL | Router params, useSearchParams |
| **Form state** | Input values, validation errors | Lives in form | React Hook Form, native forms |
| **Computed state** | Derived from other state | No separate storage | useMemo, selectors, computed |
| **Transient state** | Animation progress, hover state | Ephemeral | CSS, refs, local state |

### The Critical Insight: Server State vs Client State

```
MOST "STATE MANAGEMENT" PROBLEMS ARE ACTUALLY CACHING PROBLEMS.

If your state:
  - Comes from an API or database
  - Can be stale
  - Needs background refresh
  - Is shared across components

YOU DON'T NEED: Redux, Zustand, Jotai, signals
YOU NEED: React Query, SWR, RTK Query, or Apollo Client

These handle: caching, deduplication, background refetch, optimistic updates,
              pagination, infinite scroll, stale-while-revalidate

What's LEFT after extracting server state:
  - Theme preference (dark/light)
  - Sidebar open/closed
  - Modal visibility
  - Shopping cart (local-first)
  - Wizard step progress
  - Drag-and-drop state

THIS is client state. Usually it's much less than you think.
```

## Decision Framework

### Choosing a State Management Approach

```
How much client state do you actually have?

├── Minimal (theme, sidebar, 1-2 modals)
│   └── React useState + Context (no library needed)
│       NOTE: Context is NOT slow. Re-renders only matter if you
│       put fast-changing state in context (mouse position, etc.)
│
├── Moderate (shopping cart, multi-step forms, preferences)
│   ├── Want simplicity? → Zustand
│   ├── Want atomic/granular? → Jotai
│   └── Want signals (fine-grained reactivity)? → @preact/signals-react
│
├── Complex (real-time collaboration, offline-first, undo/redo)
│   ├── Need time-travel debugging? → Redux Toolkit
│   ├── Need state machines? → XState
│   └── Need offline sync? → CRDT library (Yjs, Automerge)
│
└── You're not sure
    └── Start with useState + React Query. Add a library only when
        you feel the pain of not having one.
```

## Library Comparison

### Feature Matrix

| Feature | Redux Toolkit | Zustand | Jotai | Signals | XState |
|---------|--------------|---------|-------|---------|--------|
| **Bundle size** | ~11KB | ~1KB | ~3KB | ~2KB | ~16KB |
| **Boilerplate** | Medium | Low | Very Low | Very Low | Medium |
| **DevTools** | Excellent | Good (Redux DevTools) | Good | Basic | Excellent (visual) |
| **Learning curve** | Medium | Low | Low | Low | High |
| **TypeScript** | Good | Good | Excellent | Good | Excellent |
| **Re-render optimization** | Manual (selectors) | Auto (selectors) | Auto (atomic) | Auto (fine-grained) | Manual |
| **Middleware/effects** | Built-in | Built-in | Basic | None | Built-in (actions) |
| **SSR support** | Good | Good | Good | Varies | Good |
| **Best for** | Large teams, complex flows | Most applications | Granular shared state | Performance-critical | Complex workflows |

## Zustand (Recommended Default)

### Why Zustand First

Zustand hits the sweet spot for most applications: minimal boilerplate, good TypeScript support, no providers needed, and it "just works." Start here unless you have a specific reason not to.

### Basic Store

```typescript
import { create } from 'zustand';

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalPrice: () => number;
}

const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),

  clearCart: () => set({ items: [] }),

  totalPrice: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}));
```

### Zustand with Middleware

```typescript
import { create } from 'zustand';
import { persist, devtools, immer } from 'zustand/middleware';

const useStore = create<StoreState>()(
  devtools(                    // Redux DevTools integration
    persist(                   // Persist to localStorage
      immer((set) => ({        // Immer for mutable-style updates
        items: [],
        addItem: (item) =>
          set((state) => {
            state.items.push(item);  // Mutable syntax thanks to immer
          }),
      })),
      {
        name: 'cart-storage',  // localStorage key
        partialize: (state) => ({ items: state.items }), // Only persist items
      }
    ),
    { name: 'CartStore' }      // DevTools label
  )
);
```

### Zustand Selectors (Preventing Re-renders)

```typescript
// BAD: Component re-renders when ANY store property changes
function Cart() {
  const store = useCartStore();  // Subscribes to entire store
  return <div>{store.items.length} items</div>;
}

// GOOD: Component re-renders ONLY when items.length changes
function Cart() {
  const itemCount = useCartStore((state) => state.items.length);
  return <div>{itemCount} items</div>;
}

// GOOD: Multiple selectors
function CartSummary() {
  const itemCount = useCartStore((s) => s.items.length);
  const total = useCartStore((s) => s.totalPrice());
  return <div>{itemCount} items, ${total}</div>;
}

// For complex derived state, use shallow equality
import { shallow } from 'zustand/shallow';

function CartItems() {
  const { items, removeItem } = useCartStore(
    (state) => ({ items: state.items, removeItem: state.removeItem }),
    shallow  // Prevents re-render if items/removeItem references haven't changed
  );
  return items.map((item) => ./* ... */);
}
```

## Jotai (Atomic State)

### When Jotai Shines

Jotai is ideal when you have many small pieces of state that different components need independently. Think of atoms like a fine-grained useState that can be shared.

```typescript
import { atom, useAtom } from 'jotai';

// Define atoms (outside components)
const countAtom = atom(0);
const doubledCountAtom = atom((get) => get(countAtom) * 2);  // Derived atom

// Writable derived atom
const incrementAtom = atom(
  null,  // read: no value
  (get, set) => {
    set(countAtom, get(countAtom) + 1);
  }
);

// Async atom (fetches data)
const userAtom = atom(async (get) => {
  const id = get(userIdAtom);
  const response = await get(`/api/users/${id}`);
  return response.json();
});

// Component uses only what it needs
function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}

function DoubledDisplay() {
  const [doubled] = useAtom(doubledCountAtom);
  // Only re-renders when countAtom changes, not other atoms
  return <div>Doubled: {doubled}</div>;
}
```

### Jotai Atom Families

```typescript
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

// Create atoms dynamically based on parameters
const todoAtomFamily = atomFamily((id: string) =>
  atom<Todo>({ id, text: '', done: false })
);

// Each todo gets its own atom - updating one doesn't re-render others
function TodoItem({ id }: { id: string }) {
  const [todo, setTodo] = useAtom(todoAtomFamily(id));
  return (
    <input
      value={todo.text}
      onChange={(e) => setTodo({ ...todo, text: e.target.value })}
    />
  );
}
```

## Signals

### The Fine-Grained Reactivity Model

Signals skip the virtual DOM diffing step. When a signal value changes, only the exact DOM node that reads it updates. No component re-render at all.

```typescript
// @preact/signals-react
import { signal, computed, effect } from '@preact/signals-react';

// Create signals (outside components)
const count = signal(0);
const doubled = computed(() => count.value * 2);

// Side effects
effect(() => {
  console.log(`Count is ${count.value}`);
  // Automatically tracks dependencies and re-runs when they change
});

// In component: signal value used directly in JSX
function Counter() {
  // This component NEVER re-renders. Only the text node updates.
  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
}
```

### When to Use Signals vs React State

| Scenario | Signals | React State |
|----------|---------|-------------|
| Performance-critical lists (1000+ items) | Excellent | Can be slow |
| Simple component-local state | Overkill | Perfect |
| Shared state across distant components | Good | Context or library |
| Forms with many fields | Excellent | Acceptable with controlled components |
| Integration with React ecosystem | Limited | Full |

## Redux Toolkit (When You Need It)

### When Redux is Actually the Right Choice

- Teams of 10+ developers who need enforced patterns
- Complex state transitions that benefit from action logs
- Time-travel debugging requirements
- Extensive middleware needs (logging, analytics, offline sync)

```typescript
import { createSlice, configureStore } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// RTK Query: Server state management built into Redux
const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['User', 'Order'],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    createUser: builder.mutation<User, CreateUserDto>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
  }),
});

// Client state: only what's left after RTK Query handles server state
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,
    theme: 'light' as 'light' | 'dark',
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setTheme: (state, action) => { state.theme = action.payload; },
  },
});
```

## Server State Libraries

### React Query vs SWR vs RTK Query

| Feature | React Query | SWR | RTK Query |
|---------|------------|-----|-----------|
| **Bundle size** | ~13KB | ~4KB | ~11KB (with Redux) |
| **Caching** | Excellent | Good | Excellent |
| **Devtools** | Excellent | Basic | Excellent (Redux DevTools) |
| **Mutations** | Built-in | Manual | Built-in |
| **Optimistic updates** | Built-in | Manual | Built-in |
| **Infinite queries** | Built-in | Built-in | Manual |
| **Auto refetch** | Focus, reconnect, interval | Focus, reconnect, interval | Polling |
| **Best for** | Most React apps | Simple needs | Already using Redux |

```typescript
// React Query: handles ALL server state
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function UserList() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => get('/api/users').then((r) => r.json()),
    staleTime: 5 * 60 * 1000,  // 5 minutes before refetch
  });

  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: (newUser) =>
      get('/api/users', { method: 'POST', body: JSON.stringify(newUser) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;
  return <ul>{users.map(/* ... */)}</ul>;
}
// No Redux. No store. No reducers. No actions. Just data fetching done right.
```

## State Machines (XState)

### When State Machines Solve Real Problems

Use XState when your state has complex transitions and guard conditions that are hard to express with if/else:

```typescript
import { createMachine, assign } from 'xstate';

const checkoutMachine = createMachine({
  id: 'checkout',
  initial: 'cart',
  context: { items: [], address: null, payment: null, error: null },
  states: {
    cart: {
      on: {
        PROCEED: { target: 'address', guard: 'hasItems' },
      },
    },
    address: {
      on: {
        SET_ADDRESS: { actions: assign({ address: (_, e) => e.address }) },
        PROCEED: { target: 'payment', guard: 'hasAddress' },
        BACK: 'cart',
      },
    },
    payment: {
      on: {
        SET_PAYMENT: { actions: assign({ payment: (_, e) => e.payment }) },
        SUBMIT: 'processing',
        BACK: 'address',
      },
    },
    processing: {
      invoke: {
        src: 'processPayment',
        onDone: 'success',
        onError: {
          target: 'payment',
          actions: assign({ error: (_, e) => e.data.message }),
        },
      },
    },
    success: { type: 'final' },
  },
});
```

## Common Anti-Patterns

1. **Putting server state in Redux/Zustand**: If the data comes from an API, use React Query or SWR. These handle caching, deduplication, background refresh, and stale data -- things you would have to build yourself in Redux.

2. **Global state for local concerns**: Modal open/closed state does not need to be global unless multiple distant components control the same modal. Start with useState. Elevate to shared state only when you feel the pain.

3. **Premature state library adoption**: Adding Redux to a new project "because we might need it." Start with React's built-in tools. Add a library when component prop drilling actually becomes painful (usually 3+ levels).

4. **One giant store**: Putting everything in a single store object. This causes unnecessary re-renders and makes the store hard to reason about. Split into multiple stores or use atoms.

5. **Normalizing client state like a database**: Redux normalization (entities, ids arrays) is complex. Only normalize if you have relational data that is updated from multiple sources. For most apps, simple nested objects work fine.

## State Architecture Checklist

- [ ] State categorized: server, client, URL, form, computed, transient
- [ ] Server state handled by a dedicated library (React Query, SWR, RTK Query)
- [ ] URL state in the router, not duplicated in a store
- [ ] Form state in a form library or local state, not global store
- [ ] Client state uses the simplest tool that works (useState first)
- [ ] Selectors prevent unnecessary re-renders
- [ ] DevTools configured for debugging state changes
- [ ] No duplicated state (single source of truth for each piece of data)
- [ ] Computed/derived state uses selectors or computed atoms, not stored separately
- [ ] State persistence (localStorage) only for state that must survive page refresh

## When to Use

**Use this skill when:**
- Designing or implementing state management architect solutions
- Reviewing or improving existing state management architect approaches
- Making architectural or implementation decisions about state management architect
- Learning state management architect patterns and best practices
- Troubleshooting state management architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# State Management Architect Analysis

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

**Input:** "Help me implement state management architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended state management architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When state management architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
