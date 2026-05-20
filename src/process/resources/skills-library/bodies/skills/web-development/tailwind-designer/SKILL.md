---
name: tailwind-designer
description: |
  Tailwind CSS design system expertise covering custom theme configuration, component extraction, responsive design patterns, dark mode, animation utilities, plugin development, integration with component libraries, and JIT optimization.
  Use when the user asks about tailwind designer, tailwind designer best practices, or needs guidance on tailwind designer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "web-development frontend html-css"
  category: "web-development"
  subcategory: "html-css-web"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Tailwind Designer

## Purpose

Build cohesive, maintainable design systems using Tailwind CSS. This skill covers theme configuration, component patterns, responsive strategies, dark mode implementation, custom plugins, and integration with component libraries.

## Theme Configuration

### tailwind.config.ts (Comprehensive)

```ts
import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',  // or 'media' for OS-level
  theme: {
    // Supersede defaults completely
    screens: {
      sm: '640px',
      md: '768px',
      # ... (condensed) ...
    require('tailwindcss-animate'),
  ],
};

export default config;
```

## Component Extraction Patterns

### When to Extract

```
EXTRACT into a component when:
  - Same utility pattern appears 3+ times
  - Pattern has 5+ utilities (readability)
  - Pattern requires conditional logic
  - Pattern needs props/variants

DO NOT extract when:
  - Pattern is used once or twice
  - Utilities are simple and readable inline
  - Extraction would reduce flexibility
```

### Component Patterns (React + Tailwind)

```tsx
// Pattern 1: Variant-based component with cva (class-variance-authority)
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles (always applied)
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100',
        ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200',
        # ... (condensed) ...
  return twMerge(clsx(inputs));
}

// Usage: cn('px-4 py-2', condition && 'bg-blue-500', className)
// twMerge handles conflicts: cn('px-2', 'px-4') -> 'px-4'
```

### Card Component Example

```tsx
const cardVariants = cva(
  'rounded-xl border transition-shadow',
  {
    variants: {
      variant: {
        default: 'border-gray-200 bg-white shadow-sm',
        elevated: 'border-gray-200 bg-white shadow-soft hover:shadow-md',
        outlined: 'border-gray-300 bg-transparent',
        filled: 'border-transparent bg-gray-50',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        # ... (condensed) ...
}

function CardFooter({ className, children }: CardSectionProps) {
  return <div className={cn('mt-6 flex items-center gap-3', className)}>{children}</div>;
}
```

## Responsive Design Patterns

```tsx
// Mobile-first responsive layout
<div className="
  grid grid-cols-1 gap-4
  sm:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4
">
  {items.map(item => <Card key={item.id} item={item} />)}
</div> .// Responsive sidebar layout
<div className="flex min-h-screen">
  <aside className="
    hidden lg:block
    # ... (condensed) ...

// Responsive spacing
<section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
  Content
</section>
```

## Dark Mode

### Class-Based Dark Mode (Recommended)

```tsx
// Theme toggle component
'use client';
import { useTheme } from 'next-themes';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

// Dark mode utility patterns
# ... (condensed) ...

// Usage: no dark: prefix needed
<div className="bg-surface-primary text-content-primary">
  Always correct for current theme
</div>
```

## Animation Utilities

```tsx
// Entrance animations
<div className="animate-fade-in">Fade in content</div>
<div className="animate-slide-up">Slide up content</div> .// Conditional animation
<div className={cn(
  'transition-all duration-300',
  isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
)}>
  Animated content
</div> .// Staggered animation with style variable
{items.map((item, i) => (
  # ... (condensed) ...

// Reduce motion
<div className="animate-slide-up motion-reduce:animate-none motion-reduce:opacity-100">
  Respects user preference
</div>
```

## Plugin Development

```ts
// tailwind.config.ts plugin
import plugin from 'tailwindcss/plugin';

const customPlugin = plugin(
  function ({ addComponents, addUtilities, addBase, theme, matchUtilities }) {
    // Add base styles
    addBase({
      'html': { scrollBehavior: 'smooth' },
      '@media (prefers-reduced-motion: reduce)': {
        'html': { scrollBehavior: 'auto' },
      },
    });

    // Add components
    # ... (condensed) ...
    },
  }
);

export default customPlugin;
```

## Integration with Component Libraries

### shadcn/ui Integration

```tsx
// shadcn/ui uses Tailwind + Radix UI + cva
// components.json configures paths and style
{
  "style": "new-york",
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
# ... (condensed) ...
        // ... other variants
      },
    },
  }
);
```

## Tailwind Performance Tips

```
1. CONTENT CONFIGURATION
   - Ensure content paths are specific (not overly broad globs)
   - Exclude node_modules, test files if not using Tailwind classes

2. AVOID DYNAMIC CLASS CONSTRUCTION
   BAD:  `bg-${color}-500`  (Tailwind can't detect this)
   GOOD: Use a mapping object with full class names
   const colorMap = {
     blue: 'bg-blue-500',
     red: 'bg-red-500',
   };

3. USE @apply SPARINGLY
   Only in global stylesheets for elements you can't add classes to
   Prefer component extraction over @apply

4. SAFELIST ONLY WHEN NECESSARY
   safelist: ['bg-blue-500', 'bg-red-500']  // For dynamic classes

5. TAILWIND MERGE FOR Supersedes
   Use cn() (clsx + tailwind-merge) to handle class conflicts
   cn('px-4', 'px-6') -> 'px-6' (not 'px-4 px-6')
```

## Tailwind Architecture Checklist

- [ ] Theme configured with brand colors, typography, spacing scale
- [ ] Dark mode strategy selected (class or media)
- [ ] Semantic color variables reduce dark: prefix repetition
- [ ] Component extraction uses cva for variant management
- [ ] cn() utility (clsx + tailwind-merge) available project-wide
- [ ] Responsive design follows mobile-first approach
- [ ] Container queries used for component-level responsiveness
- [ ] Animation utilities defined for common entrance/exit patterns
- [ ] prefers-reduced-motion respected with motion-reduce:
- [ ] Plugins used for repeated patterns (typography, forms, container queries)
- [ ] Content paths are precise (no over-scanning)
- [ ] No dynamic class construction (use mapping objects)
- [ ] Z-index scale defined in theme configuration
- [ ] Focus styles consistent across all interactive elements
- [ ] @apply usage minimal (prefer component extraction)

## When to Use

**Use this skill when:**
- Designing or implementing tailwind designer solutions
- Reviewing or improving existing tailwind designer approaches
- Making architectural or implementation decisions about tailwind designer
- Learning tailwind designer patterns and best practices
- Troubleshooting tailwind designer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Tailwind Designer Analysis

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

**Input:** "Help me implement tailwind designer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended tailwind designer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When tailwind designer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
