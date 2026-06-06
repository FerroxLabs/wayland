---
name: component-library
description: |
  Component library design expertise covering design system tokens, component API design, compound components, polymorphic components, accessibility by default, Storybook documentation, testing, versioning, and tree-shaking.
  Use when the user asks about component library, component library best practices, or needs guidance on component library implementation.
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

# Component Library

## Purpose

Design and build production-grade component libraries that serve as the foundation of a design system. This skill covers API design principles, accessibility integration, documentation, testing strategy, packaging, and long-term maintenance.

## Design System Token Architecture

### Token Layers

```
Layer 1: Global Tokens (Primitives)
  Raw design values with no semantic meaning.
  --color-blue-500: #3b82f6
  --space-4: 1rem
  --font-size-16: 1rem

Layer 2: Alias Tokens (Semantic)
  Intent-based mapping to primitives.
  --color-brand-primary: var(--color-blue-500)
  --color-text-primary: var(--color-gray-900)
  --spacing-component-gap: var(--space-4)

Layer 3: Component Tokens
  Scoped to specific components.
  --button-bg: var(--color-brand-primary)
  --button-text: var(--color-white)
  --button-radius: var(--radius-md)
  --button-padding-x: var(--space-4)
  --button-padding-y: var(--space-2)
```

### Token File Organization

```
tokens/
  colors.ts       # Color primitives and semantic mappings
  spacing.ts      # Spacing scale
  typography.ts   # Font families, sizes, weights, line-heights
  borders.ts      # Border widths, radii
  shadows.ts      # Elevation system
  motion.ts       # Duration, easing curves
  breakpoints.ts  # Responsive breakpoints
  z-index.ts      # Z-index scale
  index.ts        # Combined export
```

### Token Implementation

```ts
// tokens/colors.ts
export const colors = {
  primitives: {
    blue: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 700: '#1d4ed8', 900: '#1e3a5c' },
    gray: { 50: '#f9fafb', 100: '#f3f4f6', 500: '#6b7280', 700: '#374151', 900: '#111827' },
    red:  { 50: '#fef2f2', 500: '#ef4444', 700: '#b91c1c' },
    green: { 50: '#f0fdf4', 500: '#22c55e', 700: '#15803d' },
  },
  semantic: {
    brand: { primary: '{blue.500}', hover: '{blue.700}' },
    text: { primary: '{gray.900}', secondary: '{gray.500}', inverse: '{gray.50}' },
    bg: { primary: '#ffffff', secondary: '{gray.50}', surface: '{gray.100}' },
    border: { default: '{gray.200}', focus: '{blue.500}' },
    status: {
      success: { text: '{green.700}', bg: '{green.50}' },
      error: { text: '{red.700}', bg: '{red.50}' },
    },
  },
} as const;
```

## Component API Design

### Principles

```
1. SIMPLE THINGS SHOULD BE SIMPLE
   <Button>Save</Button>               -- 90% of usage
   <Button variant="danger" size="lg">  -- customization when needed

2. PROGRESSIVE DISCLOSURE
   Common props are top-level.
   Advanced props are grouped or use compound pattern.

3. CONSISTENT PROP NAMING
   variant (not type, kind, style)
   size (not sz, sizing)
   disabled (boolean, not isDisabled)
   onValueChange (not onChange, onUpdate, handleChange)

4. SENSIBLE DEFAULTS
   Every prop should have a default that covers the most common case.
   <Input type="text" />   -- type defaults to "text"
   <Button variant="primary" size="md" />  -- variant and size have defaults

5. COMPOSITION OVER CONFIGURATION
   Prefer compound components over mega-props.
   BAD:  <Select options={[]} renderOption={} renderGroup={} />
   GOOD: <Select><Select.Option /><Select.Group /></Select>
```

### Button API Example (Comprehensive)

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Show loading spinner and disable interaction */
  loading?: boolean;
  /** Content before the button label */
  leftIcon?: React.ReactNode;
  /** Content after the button label */
  rightIcon?: React.ReactNode;
  /** Full width of parent container */
  fullWidth?: boolean;
  /** Render as a different element (e.g., anchor) */
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon,
     fullWidth, disabled, children, className, asChild, ...props }, ref) => {
    const isDisabled = disabled || loading;

    const classes = cn(
      'button',
      `button--${variant}`,
      `button--${size}`,
      fullWidth && 'button--full',
      isDisabled && 'button--disabled',
      className,
    );

    return (
      <button ref={ref} className={classes} disabled={isDisabled}
              aria-busy={loading || undefined} {...props}>
        {loading && <Spinner size={size} aria-hidden="true" />}
        {!loading && leftIcon && <span className="button__icon">{leftIcon}</span>}
        <span className="button__label">{children}</span>
        {rightIcon && <span className="button__icon">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

## Compound Components

```tsx
// Dialog compound component
const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('Dialog components must be used within <Dialog>');
  return ctx;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({ children, asChild }: DialogTriggerProps) {
  const { onOpenChange } = useDialogContext();
  return <button onClick={() => onOpenChange(true)}>{children}</button>;
}

function DialogContent({ children, title, description }: DialogContentProps) {
  const { open, onOpenChange } = useDialogContext();
  if (!open) return null;

  return createPortal(
    <div className="dialog-overlay" onClick={() => onOpenChange(false)}>
      <div className="dialog-content" role="dialog" aria-modal="true"
           aria-labelledby={title ? 'dialog-title' : undefined}
           onClick={(e) => e.stopPropagation()}>
        {title && <h2 id="dialog-title">{title}</h2>}
        {description && <p id="dialog-desc">{description}</p>}
        {children}
      </div>
    </div>,
    document.body
  );
}

function DialogClose({ children }: { children: React.ReactNode }) {
  const { onOpenChange } = useDialogContext();
  return <button onClick={() => onOpenChange(false)}>{children}</button>;
}

Dialog.Trigger = DialogTrigger;
Dialog.Content = DialogContent;
Dialog.Close = DialogClose;

// Usage
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <Dialog.Trigger>Open Settings</Dialog.Trigger>
  <Dialog.Content title="Settings">
    <p>Configure your preferences.</p>
    <Dialog.Close>Done</Dialog.Close>
  </Dialog.Content>
</Dialog>
```

## Polymorphic Components

```tsx
// Type-safe polymorphic `as` prop
type PolymorphicRef<C extends React.ElementType> = React.ComponentPropsWithRef<C>['ref'];

type PolymorphicProps<C extends React.ElementType, Props = {}> = Props & {
  as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, keyof Props | 'as'>;

type PolymorphicPropsWithRef<C extends React.ElementType, Props = {}> =
  PolymorphicProps<C, Props> & { ref?: PolymorphicRef<C> };

// Usage in component
type TextProps<C extends React.ElementType = 'span'> = PolymorphicPropsWithRef<C, {
  variant?: 'body' | 'heading' | 'caption' | 'code';
  size?: 'sm' | 'md' | 'lg';
  weight?: 'regular' | 'medium' | 'bold';
}>;

function Text<C extends React.ElementType = 'span'>({
  as, variant = 'body', size = 'md', weight = 'regular',
  className, children, ...props
}: TextProps<C>) {
  const Component = as || 'span';
  return (
    <Component className={cn('text', `text--${variant}`, `text--${size}`, className)} {...props}>
      {children}
    </Component>
  );
}

// Usage
<Text>Default span</Text>
<Text as="h1" variant="heading" size="lg">Page Title</Text>
<Text as="a" href="/about">Link text</Text>
<Text as="label" htmlFor="email">Email</Text>
```

## Accessibility by Default

### Built-in A11y Patterns

```tsx
// All interactive components must include:
// 1. Keyboard support
// 2. ARIA attributes
// 3. Focus management
// 4. Screen reader announcements

// Example: Switch component with built-in a11y
function Switch({ checked, onCheckedChange, label, id }: SwitchProps) {
  const switchId = id || useId();

  return (
    <div className="switch-wrapper">
      <label htmlFor={switchId} className="switch-label">{label}</label>
      <button
        id={switchId}
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onCheckedChange(!checked);
          }
        }}
        className={cn('switch', checked && 'switch--checked')}
      >
        <span className="switch-thumb" />
      </button>
    </div>
  );
}

// A11y testing in every component test
test('Switch is accessible', async () => {
  const { container } = render(<Switch label="Dark mode" checked={false} onCheckedChange={() => {}} />);
  expect(await axe(container)).toHaveNoViolations();
});
```

### A11y Checklist for Every Component

```
[ ] Has visible label or aria-label
[ ] Keyboard operable (Tab, Enter, Space, Escape, Arrow keys as appropriate)
[ ] Focus indicator visible
[ ] Color contrast meets WCAG AA
[ ] Works with screen readers (test with NVDA/VoiceOver)
[ ] Supports prefers-reduced-motion
[ ] Error states have aria-invalid and aria-describedby
[ ] Loading states have aria-busy
[ ] Dynamic content uses aria-live
[ ] Touch target at least 24x24px
```

## Storybook Documentation

### Story Structure

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
      description: 'Visual style of the button',
      table: { defaultValue: { summary: 'primary' } },
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
  parameters: {
    docs: {
      description: {
        component: 'Primary UI component for user interaction.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: 'Button', variant: 'primary' },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};

export const Loading: Story = {
  args: { children: 'Saving...', loading: true },
};
```

## Testing Components

```tsx
// Unit test with Testing Library
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Click me</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows spinner when loading', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('passes axe accessibility checks', async () => {
    const { container } = render(<Button>Accessible</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});

// Visual regression with Chromatic or Playwright
// Snapshot each story automatically
```

## Versioning and Release Strategy

### Semantic Versioning Rules

```
MAJOR (X.0.0): Breaking changes
  - Removing a prop
  - Changing default behavior
  - Renaming a component
  - Changing TypeScript types in breaking way

MINOR (0.X.0): New features (backwards compatible)
  - Adding a new component
  - Adding a new prop (with default value)
  - Adding a new variant

PATCH (0.0.X): Bug fixes
  - Fixing a visual bug
  - Fixing a11y issue
  - Fixing TypeScript type accuracy
```

### Changelog Convention

```markdown
## [2.1.0] - 2025-03-15
### Added
- `Tooltip` component with hover and focus triggers
- `fullWidth` prop to `Button` component

### Fixed
- `Select` dropdown now correctly positions in scroll containers
- `Dialog` focus trap includes dynamically added elements

### Deprecated
- `Modal` component: use `Dialog` instead (will be removed in 3.0)
```

## Tree-Shaking and Package Build

```json
// package.json
{
  "name": "@myorg/ui",
  "version": "2.1.0",
  "sideEffects": ["*.css"],
  "main": "dist/cjs/index.js",
  "module": "dist/esm/index.js",
  "types": "dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"
    },
    "./Button": {
      "import": "./dist/esm/Button.js",
      "require": "./dist/cjs/Button.js",
      "types": "./dist/types/Button.d.ts"
    },
    "./styles.css": "./dist/styles.css"
  },
  "files": ["dist"]
}
```

## Component Library Checklist

- [ ] Token system defined (primitives -> semantic -> component tokens)
- [ ] Component API follows consistent naming conventions
- [ ] Every component has TypeScript types with JSDoc descriptions
- [ ] Compound components used for complex composite UIs
- [ ] Polymorphic `as` prop available on layout/text components
- [ ] Every interactive component is keyboard accessible
- [ ] Every component has Storybook stories with controls
- [ ] Every component has unit tests + a11y tests
- [ ] Visual regression tests configured (Chromatic or Playwright)
- [ ] Package exports enable tree-shaking
- [ ] sideEffects field correctly configured
- [ ] Semantic versioning enforced via changesets
- [ ] CHANGELOG maintained with each release
- [ ] forwardRef used on all components that wrap native elements

## When to Use

**Use this skill when:**
- Designing or implementing component library solutions
- Reviewing or improving existing component library approaches
- Making architectural or implementation decisions about component library
- Learning component library patterns and best practices
- Troubleshooting component library-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Component Library Analysis

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

**Input:** "Help me implement component library for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended component library approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When component library must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
