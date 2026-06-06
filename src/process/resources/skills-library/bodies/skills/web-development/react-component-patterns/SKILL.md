---
name: react-component-patterns
description: |
  Guides expert-level react component patterns implementation: javascript and typescript decision frameworks, production-ready patterns, and concrete templates for react component patterns workflows.
  Use when the user asks about react component patterns, react component patterns configuration, or javascript best practices for react projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "javascript typescript frontend design-patterns"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# React Component Patterns

## When to Use

**Use this skill when:**
- A user asks how to structure React components -- choosing between presentational vs. container, compound components, render props, hooks-based composition, or higher-order components
- A user is refactoring a component that has grown beyond ~200 lines and needs to be decomposed into a maintainable pattern
- A user wants to share logic across components without duplicating state management or side-effect code
- A user is building a design system or component library and needs patterns that scale across a team of 2 to 50+ engineers
- A user has a specific React problem such as prop drilling deeper than 2-3 levels, a component with more than 5 props that are conditionally used, or a component that needs to support multiple UI variants
- A user is migrating class components to functional components and needs to understand the equivalent patterns
- A user asks about TypeScript generics in React components, discriminated union props, or typed context
- A user is implementing features like modals, forms, data tables, or wizard flows that have well-established component pattern solutions

**Do NOT use this skill when:**
- The user needs state management architecture beyond component scope -- refer to a Redux, Zustand, or Jotai skill instead
- The user's question is about React performance optimization at the rendering level (memoization strategies, profiling, virtualization) -- those are distinct concerns
- The user needs Next.js or Remix routing patterns, server components, or SSR architecture -- refer to the framework-specific skill
- The user is asking about CSS-in-JS, styling architecture, or Tailwind integration -- refer to the styling skill
- The user needs testing patterns for React components -- refer to the React Testing Library or Jest skill
- The user is building in a non-React framework (Vue, Svelte, Angular) -- the patterns have analogs but the implementation differs enough to require separate guidance
- The user only needs a single simple component with no composition requirements -- skip the pattern discussion and just write the component

---

## Process

### 1. Diagnose the composition problem

Before recommending any pattern, identify the specific structural problem:

- **Props explosion:** Does the component accept more than 5 props, with some props only relevant under certain conditions? This signals a need for compound components or discriminated union props.
- **Logic duplication:** Is the same stateful logic (e.g., toggle, pagination, async fetch) copy-pasted across 2 or more components? This signals a custom hook extraction.
- **Render flexibility:** Does the parent need control over what gets rendered inside a child? This signals render props or the `children` composition pattern.
- **Behavior without UI:** Does the logic need to be reusable without being tied to specific markup? This signals a headless component or custom hook.
- **Cross-cutting concerns:** Does authentication, logging, error boundary, or feature-flag logic need to wrap many unrelated components? This signals a higher-order component (HOC) or a context-aware wrapper.
- **Sibling communication:** Are sibling components fighting over shared state via a common ancestor? This signals context with a provider, or a colocation refactor.
- Count real prop usage -- if 3 of 8 props are only used for one variant, the component is doing too much and needs splitting.

### 2. Select the right pattern using the decision tree

Apply this decision logic in order:

- **Is the component purely presentational with no internal state or effects?** -- Use a simple functional component with typed props. No pattern overhead needed.
- **Is there stateful logic that multiple components need?** -- Extract a **custom hook**. This is almost always the right first move before reaching for any other pattern.
- **Does the parent need to control the internal rendering structure** (e.g., a Tab component where the parent composes Tab.Panel, Tab.Header)? -- Use the **compound component pattern** with context.
- **Does the consumer need full control over what gets rendered for a specific slot** while you control behavior? -- Use **render props** or **function-as-child**. This is most appropriate for headless utilities like drag-and-drop, virtualized lists, or animation wrappers.
- **Do you need to inject behavior into a component you cannot modify** (third-party or legacy)? -- Use a **higher-order component (HOC)**. Keep HOCs thin; they should inject at most 1-3 props.
- **Do you need a flexible layout with named regions** (header, sidebar, content, footer)? -- Use the **slot pattern** via explicitly named `children` props (e.g., `headerSlot`, `footerSlot`) or React's `Children.toArray` with element type checking.
- **Are you building a controlled form field or complex input?** -- Use the **controlled component pattern** with explicit `value` and `onChange` props, and expose a `defaultValue` for uncontrolled usage.
- **Does a deeply nested component need access to configuration or theme?** -- Use **React Context** with a typed provider. Never use context for high-frequency updates (more than a few times per second) -- reach for Zustand or Jotai instead.

### 3. Define the component's contract with TypeScript

A well-typed component API prevents misuse better than documentation:

- Use **discriminated union props** for variant behavior: `type ButtonProps = { variant: 'primary'; onClick: () => void } | { variant: 'link'; href: string }`. This eliminates impossible prop combinations at compile time.
- Use `React.ComponentPropsWithoutRef<'button'>` or `React.HTMLAttributes<HTMLDivElement>` to extend native element props and pass through `className`, `style`, `aria-*`, and event handlers automatically.
- Use **generic components** for data-driven patterns: `function List<T extends { id: string }>({ items, renderItem }: ListProps<T>)`. This gives consumers type inference without casting.
- Mark props as `readonly` arrays to prevent mutation bugs.
- Use `React.ReactNode` for `children`, not `JSX.Element` -- `ReactNode` accepts strings, arrays, null, and fragments.
- Export both the component and its props type: `export type { ButtonProps }`. Library consumers need this.
- Use `forwardRef` with the correct generic signature when building input components or any component that wraps a DOM element: `React.forwardRef<HTMLButtonElement, ButtonProps>`.

### 4. Implement the pattern with production conventions

Follow these conventions for each major pattern:

**Custom Hook:**
- Name starts with `use`, returns a stable object (wrap with `useMemo` if the object identity matters to consumers).
- Accept an optional `options` parameter for configuration rather than multiple positional arguments.
- Handle cleanup in `useEffect` return -- never leave subscriptions, timers, or event listeners open.
- Example structure: `const { data, isLoading, error, refetch } = useAsyncData(fetchFn, options)`.

**Compound Component:**
- Create a private Context to pass internal state between parent and children.
- Attach child components as static properties: `Tabs.Panel`, `Tabs.Header`, `Tabs.Trigger`.
- Add `displayName` to all sub-components for React DevTools readability.
- Guard against consumer misuse: throw a descriptive error if a child component is used outside its parent context.

**Render Props / Function as Child:**
- The render function receives a typed bag of state and handlers: `children: (state: { isOpen: boolean; toggle: () => void }) => ReactNode`.
- Memoize the state bag or individual functions to avoid unnecessary re-renders in consumers.
- Document the shape of the state bag in the TypeScript interface, not in comments.

**Higher-Order Component:**
- Name the HOC `withX` (e.g., `withAuth`, `withErrorBoundary`).
- Always forward refs using `React.forwardRef` inside the HOC.
- Copy static properties from the wrapped component using `hoistNonReactStatics` from the `hoist-non-react-statics` package.
- Set `WrappedComponent.displayName` to `withX(ComponentName)`.
- Prefer HOCs only for cross-cutting concerns; prefer hooks for logic reuse.

**Controlled / Uncontrolled Input:**
- Support both modes: check `if (value !== undefined)` to detect controlled mode.
- In controlled mode, call `onChange` synchronously on every user interaction.
- In uncontrolled mode, use `useRef` to expose a `getValue()` imperative API via `forwardRef` and `useImperativeHandle`.

### 5. Handle state colocation and context boundaries

- Colocate state as close to where it is used as possible. Avoid lifting state to the top of a component tree before profiling shows it is necessary.
- A Context provider should own exactly one concern (e.g., `ThemeContext`, `AuthContext`, `ToastContext`). Never put unrelated state into a single context object.
- Memoize context values: `const value = useMemo(() => ({ user, logout }), [user])`. Without this, every consumer re-renders on every parent render.
- For components that read context but render frequently, split the context into a state context and a dispatch context to minimize re-renders. Pattern: `UserStateContext` and `UserDispatchContext` as two separate providers.
- Avoid context for ephemeral, high-frequency values like scroll position, mouse coordinates, or animation frame data -- use refs or event listeners instead.

### 6. Structure the file and module layout

- One component per file for anything beyond trivial sub-components. The file name matches the component name: `UserCard.tsx`, not `components.tsx`.
- Folder structure for a component with multiple pieces:
  ```
  UserCard/
    index.ts          -- re-exports the public API
    UserCard.tsx      -- main component
    UserCard.types.ts -- exported TypeScript interfaces
    UserCard.test.tsx -- co-located tests
    useUserCard.ts    -- extracted hook (if stateful logic is substantial)
  ```
- Export the component as a named export, not default export. Named exports are refactor-safe and tree-shakeable.
- The `index.ts` barrel file should only re-export what is public API: `export { UserCard } from './UserCard'` and `export type { UserCardProps } from './UserCard.types'`.

### 7. Validate the pattern choice with these checkpoints

Before finalizing, verify:

- Can a new team member understand the component's responsibility in under 60 seconds? If not, it is still too complex.
- Does the component have a single reason to change? If changing the data source AND changing the visual layout both require edits to the same component, it needs further decomposition.
- Are there more than 2 levels of nesting in the JSX returned by the component? Flatten using sub-components.
- Does every prop on the component's interface have a consumer that actually uses it? Unused prop surface is dead weight.
- Is the component testable in isolation without mocking the entire application? If not, the dependencies are too tightly coupled.

### 8. Document the pattern decision

For each non-obvious pattern choice, add a brief comment block at the top of the file:

```tsx
/**
 * Pattern: Compound Component
 * Reason: Consumers need to control the order and presence of Tab panels
 *         without forking this component. The compound pattern gives layout
 *         flexibility while keeping tab state internal.
 * Trade-off: More verbose consumer API than a prop-driven tab component,
 *            but eliminates the need for index-based panel management.
 */
```

---

## Output Format

When responding to a user about React component patterns, structure the output as follows:

```
## Pattern Diagnosis

**Problem identified:** [One sentence describing the structural issue]
**Pattern selected:** [Pattern name]
**Rationale:** [2-3 sentences explaining why this pattern fits better than alternatives]

## Decision Matrix

| Criteria                  | Compound Component | Render Props | Custom Hook | HOC   |
|---------------------------|-------------------|--------------|-------------|-------|
| Logic reuse               | Partial           | No           | Yes         | Yes   |
| Render flexibility        | Yes               | Yes          | No          | No    |
| TypeScript ergonomics     | Good              | Moderate     | Excellent   | Poor  |
| Debuggability             | Good              | Moderate     | Excellent   | Poor  |
| Boilerplate overhead      | High              | Low          | Low         | High  |
| Best for                  | UI composition    | Headless UI  | Logic reuse | X-cutting |

**Recommended for this case:** [Selected pattern with one-line justification]

## Implementation

### Types (UserCard.types.ts)
[Complete TypeScript interface definitions]

### Hook (useX.ts -- if applicable)
[Complete custom hook implementation]

### Component (ComponentName.tsx)
[Complete component implementation]

### Usage Example
[How a consumer would use this component in practice]

## Trade-offs and Limitations

- **What this pattern does well:** [Specific strengths in this context]
- **What to watch for:** [Specific failure modes or complexity traps]
- **When to change patterns:** [Concrete signals that this pattern has been outgrown]
```

---

## Rules

1. **NEVER recommend HOCs as the first solution for logic reuse.** Custom hooks replaced HOCs for logic extraction in React 16.8+. HOCs should only be recommended when wrapping a component you cannot modify, or when you need to intercept the render lifecycle (e.g., error boundaries, which cannot be hooks).

2. **NEVER use `React.FC` (or `React.FunctionComponent`) as the component type annotation.** `React.FC` implicitly includes `children` in props (pre-React 18 behavior), is incompatible with `forwardRef` signatures, and adds no value over plain function declarations. Always type the function directly: `function Button(props: ButtonProps): JSX.Element`.

3. **NEVER put multiple unrelated stateful concerns into one custom hook.** A hook named `useUserDashboard` that manages authentication, pagination, and modal state is a monolith in hook form. Each hook should own exactly one concern.

4. **NEVER use `Children.map` or `Children.toArray` to enumerate children for logic purposes.** This pattern breaks with React fragments, portals, and arrays. Use Context to share state between a parent and its compound children instead.

5. **ALWAYS memoize context values** that are objects or arrays: `useMemo(() => ({ theme, setTheme }), [theme])`. Failing to do this causes all context consumers to re-render on every provider parent render, regardless of whether the consumed values changed.

6. **NEVER use index as the `key` prop for lists that can be reordered, filtered, or paginated.** Keys must be stable, unique identifiers tied to the data item (`item.id`). Index keys cause incorrect reconciliation behavior and subtle UI bugs with controlled inputs inside list items.

7. **ALWAYS use `forwardRef` when building any component that wraps a DOM input, button, or other focusable element.** Library consumers and accessibility tools (screen reader management, focus trapping) depend on the ability to imperatively focus these elements.

8. **NEVER lift state above the lowest common ancestor that actually needs it.** Premature state lifting creates unnecessary re-render surfaces. Profile first with React DevTools Profiler before deciding to lift state.

9. **ALWAYS discriminate between controlled and uncontrolled usage** for any component that holds user input state. A component that accepts a `value` prop must not also maintain internal state -- it must be fully controlled. Mixing modes creates the React "uncontrolled to controlled" warning and unpredictable behavior.

10. **NEVER export components as default exports in a library or design system.** Default exports lose their name during tree-shaking analysis, break automated refactoring tools, and create inconsistency when re-exported from barrel files. Named exports are the correct convention for shared component libraries.

---

## Edge Cases

### Legacy class component coexistence

When introducing functional component patterns into a codebase that still has class components, render props created with class components remain compatible with functional component consumers. Custom hooks, however, cannot be called inside class components. If a hook-based pattern needs to be consumed by an existing class component, create a thin adapter HOC: wrap the functional hook component in a class-compatible HOC that passes hook results as props. Mark the adapter as `@deprecated` so the team knows it is a migration shim, not a permanent pattern.

### Compound component with deeply nested consumers

The standard compound component pattern passes context from the immediate parent to direct children. If a consumer places a non-compound component several levels deep inside the compound root (e.g., `<Tabs><CustomWrapper><Tabs.Panel /></CustomWrapper></Tabs>`), the context still flows correctly because React Context is not limited to direct children. However, if a consumer forgets to render children inside the compound root entirely and uses `Tabs.Panel` standalone, it will receive undefined context. Guard against this by checking context value in each sub-component: `if (!context) throw new Error('Tabs.Panel must be used inside a Tabs component')`.

### Generic components and TypeScript inference failures

Generic components (`function List<T>`) lose their type parameter when used with `React.memo` or `forwardRef` because these wrappers do not propagate generics. Work around this with one of two approaches: (1) cast the result with an explicit generic signature after wrapping -- `const MemoList = React.memo(List) as typeof List` -- or (2) use a non-generic overload signature on the export. The `as typeof List` cast is the most pragmatic approach and preserves the generic call signature for all consumers.

### Render prop performance with frequent re-renders

Render props defined inline in JSX recreate a new function reference on every parent render: `<Toggle>{({ isOn }) => <Button active={isOn} />}</Toggle>`. If the Toggle component uses `React.PureComponent` or `React.memo`, the inline function will defeat memoization because the function reference always changes. Solutions: (1) define the render prop function outside the render method or use `useCallback`, (2) avoid memoizing the Toggle component itself since it is always expected to re-render with its parent, or (3) switch to the compound component pattern if the consumer structure allows it.

### Context performance with high consumer count

A single Context with 50+ consumers and a state that changes frequently (e.g., a real-time data feed) will cause severe performance problems because every consumer re-renders on every update, even if the specific slice they consume did not change. Solutions in order of preference: (1) split the context into multiple fine-grained contexts, (2) use context selectors via `use-context-selector` library which enables subscribing to derived slices, (3) move the high-frequency state out of React context entirely and into a pub/sub system (Zustand, Jotai, or a plain EventEmitter with refs).

### Component with polymorphic `as` prop

A polymorphic component (e.g., `<Button as="a" href="/home">`) must be typed so that TypeScript infers the correct prop set for the underlying element. This requires a generic constraint: `type PolymorphicProps<E extends React.ElementType> = { as?: E } & React.ComponentPropsWithoutRef<E>`. Without this, passing `href` to a `<Button as="a">` will produce a TypeScript error, and passing invalid props for the rendered element will not be caught. The complexity of this typing is significant -- if the team is not comfortable with the generic constraints, prefer explicit variant props (`variant="link"` renders an anchor internally) over the polymorphic pattern.

### Islands of interactivity in server-rendered applications

In Next.js App Router or Remix, React Server Components cannot use hooks, context, or event handlers. When a component pattern relies on hooks (custom hook pattern, compound components with context), the component must be marked `'use client'`. Compound component parents that establish context must be client components even if the children contain server-renderable content. The correct split: mark the context provider as `'use client'`, and let children that need no interactivity remain server components -- React will hydrate only the client boundary, not the children.

### Stale closure bugs in custom hooks

A custom hook that captures a callback in a `useEffect` without including it in the dependency array will produce stale closures -- the callback sees the variable values from when the effect was created, not the current values. Always use `useCallback` to stabilize callback props before including them in effect dependencies, or use the `useEffectEvent` pattern (React 19+, or the userland equivalent via a ref: store the latest callback in a ref and call the ref inside the effect).

---

## Example

**Input:** "I'm building a multi-step form wizard in React with TypeScript. The wizard has 5 steps. Different parts of the UI need to know the current step, and I need to be able to navigate forward, backward, and jump to a specific step. I also need to validate each step before allowing progression. I have this all tangled up in one 400-line component and need to break it out properly."

---

**Output:**

## Pattern Diagnosis

**Problem identified:** A monolithic form wizard component with mixed concerns -- step state management, navigation logic, per-step validation, and rendering of multiple step views -- crammed into a single component.

**Pattern selected:** Compound Component (for the wizard shell and step layout) + Custom Hook (for step state and navigation logic) + Discriminated Union Props (for per-step data typing).

**Rationale:** The compound component pattern gives consumers control over which steps appear and in what order without requiring index-based configuration. The custom hook extracts all navigation and validation logic into a testable, reusable unit. The discriminated union ensures each step receives exactly the props it needs with no impossible combinations.

---

## Decision Matrix

| Criteria                  | Compound Component | Render Props | Custom Hook | HOC   |
|---------------------------|-------------------|--------------|-------------|-------|
| Logic reuse               | Partial           | No           | Yes         | Yes   |
| Render flexibility        | Yes               | Yes          | No          | No    |
| TypeScript ergonomics     | Good              | Moderate     | Excellent   | Poor  |
| Debuggability             | Good              | Moderate     | Excellent   | Poor  |
| Boilerplate overhead      | High              | Low          | Low         | High  |
| Best for                  | UI composition    | Headless UI  | Logic reuse | X-cutting |

**Recommended for this case:** Compound Component + Custom Hook -- the wizard needs both render flexibility (consumers compose steps) and shared state (current step, validation) accessible to navigation controls and step indicators simultaneously.

---

## Implementation

### Types -- `Wizard.types.ts`

```typescript
export type StepStatus = 'incomplete' | 'active' | 'complete' | 'error';

export interface StepConfig {
  id: string;
  label: string;
  validate?: (data: unknown) => Promise<string[]> | string[];
}

export interface WizardContextValue {
  currentStepIndex: number;
  steps: StepConfig[];
  stepStatuses: Record<string, StepStatus>;
  validationErrors: Record<string, string[]>;
  goToNext: () => Promise<boolean>;
  goToPrev: () => void;
  goToStep: (index: number) => void;
  registerStep: (config: StepConfig) => void;
}

export interface WizardProps {
  children: React.ReactNode;
  onComplete: (data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown>;
}

export interface WizardStepProps {
  stepId: string;
  children: React.ReactNode;
  validate?: StepConfig['validate'];
}

export interface WizardNavigationProps {
  nextLabel?: string;
  prevLabel?: string;
  completeLabel?: string;
}
```

---

### Custom Hook -- `useWizard.ts`

```typescript
import { useCallback, useMemo, useRef, useState } from 'react';
import type { StepConfig, StepStatus, WizardContextValue } from './Wizard.types';

export function useWizard(): WizardContextValue {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const stepsRef = useRef<StepConfig[]>([]);

  const registerStep = useCallback((config: StepConfig) => {
    // Prevent duplicate registration on re-renders
    if (stepsRef.current.some((s) => s.id === config.id)) return;
    stepsRef.current = [...stepsRef.current, config];
    setStepStatuses((prev) => ({ ...prev, [config.id]: 'incomplete' }));
  }, []);

  const goToNext = useCallback(async (): Promise<boolean> => {
    const currentStep = stepsRef.current[currentStepIndex];
    if (!currentStep) return false;

    if (currentStep.validate) {
      const errors = await currentStep.validate({});
      if (errors.length > 0) {
        setValidationErrors((prev) => ({ ...prev, [currentStep.id]: errors }));
        setStepStatuses((prev) => ({ ...prev, [currentStep.id]: 'error' }));
        return false;
      }
    }

    setValidationErrors((prev) => ({ ...prev, [currentStep.id]: [] }));
    setStepStatuses((prev) => ({ ...prev, [currentStep.id]: 'complete' }));

    setCurrentStepIndex((i) => {
      const nextIndex = Math.min(i + 1, stepsRef.current.length - 1);
      const nextStep = stepsRef.current[nextIndex];
      if (nextStep && nextIndex !== i) {
        setStepStatuses((s) => ({ ...s, [nextStep.id]: 'active' }));
      }
      return nextIndex;
    });

    return true;
  }, [currentStepIndex]);

  const goToPrev = useCallback(() => {
    setCurrentStepIndex((i) => {
      const prevIndex = Math.max(i - 1, 0);
      const prevStep = stepsRef.current[prevIndex];
      if (prevStep) {
        setStepStatuses((s) => ({ ...s, [prevStep.id]: 'active' }));
      }
      return prevIndex;
    });
  }, []);

  const goToStep = useCallback((index: number) => {
    if (index < 0 || index >= stepsRef.current.length) return;
    setCurrentStepIndex(index);
    const step = stepsRef.current[index];
    if (step) {
      setStepStatuses((s) => ({ ...s, [step.id]: 'active' }));
    }
  }, []);

  const value = useMemo(
    () => ({
      currentStepIndex,
      steps: stepsRef.current,
      stepStatuses,
      validationErrors,
      goToNext,
      goToPrev,
      goToStep,
      registerStep,
    }),
    [currentStepIndex, stepStatuses, validationErrors, goToNext, goToPrev, goToStep, registerStep]
  );

  return value;
}
```

---

### Context -- `WizardContext.ts`

```typescript
import { createContext, useContext } from 'react';
import type { WizardContextValue } from './Wizard.types';

export const WizardContext = createContext<WizardContextValue | null>(null);
WizardContext.displayName = 'WizardContext';

export function useWizardContext(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    throw new Error(
      'useWizardContext must be used inside a <Wizard> component. ' +
      'Ensure Wizard.Step and Wizard.Navigation are rendered as children of Wizard.'
    );
  }
  return ctx;
}
```

---

### Compound Component -- `Wizard.tsx`

```typescript
/**
 * Pattern: Compound Component + Custom Hook
 * Reason: The wizard needs to share navigation state (current step, validation errors)
 *         between a progress indicator, step content panels, and navigation buttons
 *         without threading props through multiple layers.
 * Trade-off: Consumers must render Wizard.Step and Wizard.Navigation inside Wizard.
 *            Standalone usage of sub-components outside Wizard throws a descriptive error.
 */
import React, { useEffect } from 'react';
import { WizardContext, useWizardContext } from './WizardContext';
import { useWizard } from './useWizard';
import type { WizardNavigationProps, WizardProps, WizardStepProps } from './Wizard.types';

function WizardRoot({ children, onComplete }: WizardProps): JSX.Element {
  const wizard = useWizard();

  return (
    <WizardContext.Provider value={wizard}>
      <div role="group" aria-label="Multi-step form wizard">
        {children}
      </div>
    </WizardContext.Provider>
  );
}

WizardRoot.displayName = 'Wizard';

function WizardStep({ stepId, children, validate }: WizardStepProps): JSX.Element | null {
  const { currentStepIndex, steps, registerStep, validationErrors } = useWizardContext();

  useEffect(() => {
    registerStep({ id: stepId, label: stepId, validate });
    // registerStep is stable (useCallback with no deps that change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);

  const stepIndex = steps.findIndex((s) => s.id === stepId);
  const isActive = stepIndex === currentStepIndex;

  if (!isActive) return null;

  const errors = validationErrors[stepId] ?? [];

  return (
    <div
      role="tabpanel"
      aria-labelledby={`wizard-step-${stepId}`}
      id={`wizard-panel-${stepId}`}
    >
      {errors.length > 0 && (
        <ul role="alert" aria-live="polite">
          {errors.map((error) => (
            <li key={error} style={{ color: 'red' }}>
              {error}
            </li>
          ))}
        </ul>
      )}
      {children}
    </div>
  );
}

WizardStep.displayName = 'Wizard.Step';

function WizardNavigation({
  nextLabel = 'Next',
  prevLabel = 'Back',
  completeLabel = 'Submit',
}: WizardNavigationProps): JSX.Element {
  const { currentStepIndex, steps, goToNext, goToPrev } = useWizardContext();

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <nav aria-label="Wizard navigation">
      <button
        type="button"
        onClick={goToPrev}
        disabled={isFirstStep}
        aria-disabled={isFirstStep}
      >
        {prevLabel}
      </button>
      <button
        type="button"
        onClick={() => void goToNext()}
      >
        {isLastStep ? completeLabel : nextLabel}
      </button>
    </nav>
  );
}

WizardNavigation.displayName = 'Wizard.Navigation';

function WizardProgress(): JSX.Element {
  const { steps, currentStepIndex, stepStatuses, goToStep } = useWizardContext();

  return (
    <ol aria-label="Form progress" role="list">
      {steps.map((step, index) => (
        <li key={step.id} aria-current={index === currentStepIndex ? 'step' : undefined}>
          <button
            type="button"
            onClick={() => goToStep(index)}
            aria-label={`Go to step ${index + 1}: ${step.label}`}
            data-status={stepStatuses[step.id] ?? 'incomplete'}
          >
            {index + 1}. {step.label}
          </button>
        </li>
      ))}
    </ol>
  );
}

WizardProgress.displayName = 'Wizard.Progress';

export const Wizard = Object.assign(WizardRoot, {
  Step: WizardStep,
  Navigation: WizardNavigation,
  Progress: WizardProgress,
});
```

---

### Public API -- `index.ts`

```typescript
export { Wizard } from './Wizard';
export { useWizardContext } from './WizardContext';
export type {
  WizardProps,
  WizardStepProps,
  WizardNavigationProps,
  StepConfig,
  StepStatus,
} from './Wizard.types';
```

---

### Consumer Usage Example

```tsx
import { Wizard } from '@/components/Wizard';

async function validatePersonalInfo(data: unknown): Promise<string[]> {
  const errors: string[] = [];
  // Real validation logic here
  return errors;
}

export function OnboardingWizard(): JSX.Element {
  function handleComplete(data: Record<string, unknown>) {
    console.log('Wizard complete', data);
  }

  return (
    <Wizard onComplete={handleComplete}>
      <Wizard.Progress />

      <Wizard.Step stepId="personal-info" validate={validatePersonalInfo}>
        <h2>Personal Information</h2>
        <input type="text" placeholder="First name" aria-label="First name" />
        <input type="text" placeholder="Last name" aria-label="Last name" />
      </Wizard.Step>

      <Wizard.Step stepId="contact-details">
        <h2>Contact Details</h2>
        <input type="email" placeholder="Email address" aria-label="Email address" />
      </Wizard.Step>

      <Wizard.Step stepId="preferences">
        <h2>Preferences</h2>
        <label>
          <input type="checkbox" />
          Receive email notifications
        </label>
      </Wizard.Step>

      <Wizard.Navigation
        nextLabel="Continue"
        prevLabel="Go Back"
        completeLabel="Create Account"
      />
    </Wizard>
  );
}
```

---

## Trade-offs and Limitations

- **What this pattern does well:** Navigation state is centralized in one hook and shared via context -- no prop drilling through 5 step components. The compound API gives consumers complete control over step content and order. Validation is co-located with step configuration. Adding a 6th step requires zero changes to the Wizard component itself.

- **What to watch for:** The `registerStep` pattern using a ref and effect can have ordering issues if steps are conditionally rendered -- a step that mounts late will append to the steps array in registration order, not DOM order. If conditional steps are a requirement, switch to a declarative steps array passed directly to the Wizard root prop instead of relying on registration side effects.

- **When to change patterns:** If the wizard needs to persist state across browser sessions (resumable forms), extract the state from `useWizard` into a `useReducer` + `localStorage` synchronization layer. If more than 3 components outside the Wizard tree need to read the current step (e.g., a page-level breadcrumb), promote the context to a higher level or move to a global state manager like Zustand.
