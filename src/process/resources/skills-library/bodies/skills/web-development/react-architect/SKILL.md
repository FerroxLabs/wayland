---
name: react-architect
description: |
  Expert-level React application architecture covering component patterns, hooks design, state management selection, performance optimization, server components, and scalable folder structures.
  Use when the user asks about react architect, react architect best practices, or needs guidance on react architect implementation.
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

# React Architect

## Purpose

Guide the design and implementation of production-grade React applications with emphasis on maintainability, performance, and developer experience. This skill covers architectural decisions from project inception through scaling.

## Component Pattern Selection

### Decision Tree

```
Need shared state between parent and children?
  YES -> Compound Components
Need to customize rendering behavior?
  YES -> Is the consumer advanced?
    YES -> Render Props
    NO  -> Slots via children
Need cross-cutting behavior (logging, auth, analytics)?
  YES -> Higher-Order Components or Custom Hooks
Need polymorphic rendering?
  YES -> Polymorphic Component with `as` prop
Default -> Simple function component with props
```

### Compound Components

Use when a group of components share implicit state and must work together.

```tsx
// Context-based compound component
const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tab components must be used within <Tabs>');
  return ctx;
}

function Tabs({ defaultValue, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div role="tablist">{children}</div>
    </TabsContext.Provider>
  );
}

function TabTrigger({ value, children }: TabTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  return (
    <button
      role="tab"
      aria-selected={activeTab === value}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

function TabContent({ value, children }: TabContentProps) {
  const { activeTab } = useTabsContext();
  if (activeTab !== value) return null;
  return <div role="tabpanel">{children}</div>;
}

Tabs.Trigger = TabTrigger;
Tabs.Content = TabContent;
```

### Render Props (Advanced Customization)

```tsx
interface DataTableProps<T> {
  data: T[];
  renderRow: (item: T, index: number) => ReactNode;
  renderEmpty?: () => ReactNode;
  renderHeader?: () => ReactNode;
}

function DataTable<T>({ data, renderRow, renderEmpty, renderHeader }: DataTableProps<T>) {
  if (data.length === 0 && renderEmpty) return <>{renderEmpty()}</>;
  return (
    <table>
      {renderHeader && <thead>{renderHeader()}</thead>}
      <tbody>{data.map((item, i) => renderRow(item, i))}</tbody>
    </table>
  );
}
```

### Higher-Order Components (Cross-Cutting Concerns)

```tsx
function withAuth<P extends object>(Component: ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading } = useAuth();
    if (isLoading) return <Skeleton />;
    if (!user) return <Navigate to="/login" />;
    return <Component {...props} />;
  };
}
```

## Hooks Architecture

### Custom Hook Design Principles

1. **Single responsibility** -- one hook, one concern
2. **Return tuples for simple state** -- `[value, setter]`
3. **Return objects for complex state** -- `{ data, error, isLoading, refetch }`
4. **Accept configuration objects** -- not positional parameters
5. **Provide escape hatches** -- expose underlying refs or callbacks

### Hook Composition Pattern

```tsx
// Layer 1: Low-level data hook
function useApi<T>(url: string, options?: RequestInit) {
  const [state, setState] = useState<ApiState<T>>({ status: 'idle' });

  const get = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const res = await fetchApi<T>(url, options);
      setState({ status: 'success', data: res });
    } catch (error) {
      setState({ status: 'error', error: error as Error });
    }
  }, [url, options]);

  return { ...state, get };
}

// Layer 2: Domain-specific hook
function useUsers(filters?: UserFilters) {
  const queryString = useMemo(() => buildQuery(filters), [filters]);
  const { data, status, get } = useApi<User[]>(`/api/users?${queryString}`);

  useEffect(() => { get(); }, [get]);

  return {
    users: data ?? [],
    isLoading: status === 'loading',
    isEmpty: status === 'success' && (data?.length ?? 0) === 0,
    refetch: get,
  };
}

// Layer 3: UI-specific hook
function useUserTable() {
  const [filters, setFilters] = useState<UserFilters>({});
  const { users, isLoading, isEmpty } = useUsers(filters);
  const [sortConfig, setSortConfig] = useSortConfig();
  const sortedUsers = useSorted(users, sortConfig);
  const { page, pageSize, paginated, totalPages } = usePagination(sortedUsers);

  return { users: paginated, isLoading, isEmpty, filters, setFilters, sortConfig, setSortConfig, page, totalPages };
}
```

### Rules for useEffect

```
WHEN TO USE useEffect:
  - Synchronizing with external systems (DOM APIs, third-party libs)
  - Setting up subscriptions (WebSocket, event listeners)
  - Fetching data on mount or dependency change (prefer TanStack Query)
  - Logging / analytics side effects

WHEN NOT TO USE useEffect:
  - Transforming data for rendering -> use useMemo
  - Handling user events -> use event handlers directly
  - Resetting state when props change -> use key prop instead
  - Derived state -> compute during render
```

## State Management Selection

### Decision Matrix

| Requirement | Solution |
|---|---|
| Component-local UI state | useState / useReducer |
| Shared between sibling components | Lift state up |
| Deep prop drilling (theme, auth, locale) | Context + useContext |
| Complex client state with devtools | Zustand or Redux Toolkit |
| Server state (cache, sync, refetch) | TanStack Query / SWR |
| URL-driven state | URL search params (nuqs) |
| Form state | React Hook Form / Formik |
| Complex workflows / state machines | XState |
| Fine-grained reactivity (perf-critical) | Jotai / Signals |

### Context Performance Trap -- and Solution

```tsx
// BAD: Any update to AuthContext re-renders all consumers
const AuthContext = createContext({ user: null, theme: 'light', setTheme: () => {} });

// GOOD: Split contexts by update frequency
const UserContext = createContext<User | null>(null);
const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', setTheme: () => {} });
```

## Folder Structure

### Feature-Based Architecture (Recommended for Scale)

```
src/
  app/                    # App-wide setup
    providers.tsx         # Composed providers
    router.tsx            # Route definitions
    layout.tsx            # Root layout
  features/               # Feature modules (core organizational unit)
    auth/
      api/                # API calls for this feature
      components/         # Feature-specific components
      hooks/              # Feature-specific hooks
      types/              # Feature-specific types
      utils/              # Feature-specific utilities
      index.ts            # Public API (barrel file)
    dashboard/
      ...
  shared/                 # Shared across features
    components/           # Reusable UI components
      ui/                 # Primitive UI (Button, Input, Modal)
      layout/             # Layout components (Sidebar, Header)
    hooks/                # Shared hooks
    lib/                  # Third-party wrappers
    types/                # Global types
    utils/                # Pure utility functions
  assets/                 # Static assets
```

### Barrel File Rules

- Export ONLY the public API from each feature
- Never re-export internal implementation details
- Use explicit named exports, not `export *`

```tsx
// features/auth/index.ts
export { LoginForm } from './components/LoginForm';
export { useAuth } from './hooks/useAuth';
export type { User, AuthState } from './types';
// Internal components like PasswordStrengthMeter are NOT exported
```

## Performance Optimization

### Memoization Decision Framework

```
Should I use React.memo()?
  Is the component re-rendering with the same props frequently?
    YES -> Is the render expensive (large tree, complex calculations)?
      YES -> Use React.memo()
      NO  -> Probably not worth it
    NO  -> Do not use React.memo()

Should I use useMemo()?
  Is the computation expensive (O(n^2), large dataset)?
    YES -> useMemo()
  Is the result used as a dependency in useEffect or passed as prop to memoized child?
    YES -> useMemo()
  Otherwise -> Do not use useMemo()

Should I use useCallback()?
  Is the function passed to a memoized child component?
    YES -> useCallback()
  Is the function used as a dependency in useEffect?
    YES -> useCallback()
  Otherwise -> Do not use useCallback()
```

### Code Splitting Strategy

```tsx
// Route-level splitting (always do this)
const Dashboard = lazy(() => import('./features/dashboard'));
const Settings = lazy(() => import('./features/settings'));

// Component-level splitting (for heavy components)
const Chart = lazy(() => import('./shared/components/Chart'));
const MarkdownEditor = lazy(() =>
  import('./shared/components/MarkdownEditor').then(m => ({ default: m.MarkdownEditor }))
);

// Preloading on hover/focus
function NavLink({ to, children }: NavLinkProps) {
  const preload = () => {
    const route = routeMap[to];
    if (route?.loader) route.loader();
  };
  return <Link to={to} onMouseEnter={preload} onFocus={preload}>{children}</Link>;
}
```

### Suspense Architecture

```tsx
function App() {
  return (
    <Suspense fallback={<AppSkeleton />}>
      <ErrorBoundary fallback={<AppError />}>
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
        <main>
          <Suspense fallback={<ContentSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </ErrorBoundary>
    </Suspense>
  );
}
```

## Server Components (RSC)

### Mental Model

```
Server Components (default in App Router):
  - Run ONLY on the server
  - Can access databases, file system, secrets directly
  - Cannot use hooks, event handlers, browser APIs
  - Zero JavaScript sent to client
  - Can import Client Components

Client Components ('use client' directive):
  - Run on both server (SSR) and client (hydration)
  - CAN use hooks, event handlers, browser APIs
  - Ship JavaScript to the client
  - CANNOT import Server Components (but can accept them as children)
```

### Composition Pattern

```tsx
// ServerWrapper.tsx (Server Component -- no directive needed)
import { ClientInteractive } from './ClientInteractive';

async function ServerWrapper() {
  const data = await db.query('SELECT ...');   // Direct DB access
  return (
    <ClientInteractive initialData={data}>
      <ServerChildContent />   {/* Server component passed as children */}
    </ClientInteractive>
  );
}

// ClientInteractive.tsx
'use client';
export function ClientInteractive({ initialData, children }: Props) {
  const [state, setState] = useState(initialData);
  return (
    <div onClick={() => setState(transform(state))}>
      {children}  {/* Server-rendered content stays as-is */}
    </div>
  );
}
```

## Error Boundaries

### Production Error Boundary

```tsx
interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    reportError({ error, errorInfo, context: this.props.context });
  }

  handleReset = () => {
    this.setState({ error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      return this.props.fallback
        ? this.props.fallback({ error: this.state.error, reset: this.handleReset })
        : <DefaultErrorUI error={this.state.error} onRetry={this.handleReset} />;
    }
    return this.props.children;
  }
}
```

### Granular Error Boundaries

Place error boundaries at meaningful UI seams:
- Around each independent feature section
- Around third-party component integrations
- Around data-fetching Suspense boundaries
- At route level (catch navigation errors)

## Testing Strategy

### Testing Trophy (Recommended Approach)

```
              /  E2E  \           Few, critical user paths
            / Integration \       Feature-level component tests
          /   Component Tests  \  Rendered component behavior
        /     Hook Unit Tests    \ Custom hook logic
      /       Utility Unit Tests   \ Pure functions
```

### Component Test Example

```tsx
import { render, screen, userEvent } from '@testing-library/react';

test('shows validation error when submitting empty form', async () => {
  const user = userEvent.setup();
  render(<LoginForm onSubmit={vi.fn()} />);

  await user.click(screen.getByRole('button', { name: /sign in/i }));

  expect(screen.getByRole('alert')).toHaveTextContent(/email is required/i);
});
```

## Architecture Checklist

Before shipping a React application to production, verify:

- [ ] Feature-based folder structure with clear public APIs
- [ ] State management matches complexity (not over-engineered)
- [ ] Error boundaries at route and feature boundaries
- [ ] Code splitting at route level minimum
- [ ] Memoization applied only where measured benefit exists
- [ ] Server/client component boundary is intentional
- [ ] Custom hooks follow single-responsibility principle
- [ ] Context is split by update frequency
- [ ] Suspense boundaries with meaningful fallbacks
- [ ] TypeScript strict mode enabled with no `any` escape hatches
- [ ] Bundle size monitored with size-limit or bundlephobia
- [ ] Lighthouse score above 90 for performance

## When to Use

**Use this skill when:**
- Designing or implementing react architect solutions
- Reviewing or improving existing react architect approaches
- Making architectural or implementation decisions about react architect
- Learning react architect patterns and best practices
- Troubleshooting react architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# React Architect Analysis

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

**Input:** "Help me implement react architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended react architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When react architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
