---
name: animation-designer
description: |
  Web animation expertise covering CSS animations and transitions, Web Animations API, Framer Motion, GSAP, scroll-driven animations, layout animations, spring physics, reduce-motion preferences, and performance budgets.
  Use when the user asks about animation designer, animation designer best practices, or needs guidance on animation designer implementation.
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

# Animation Designer

## Purpose

Design and implement performant, purposeful web animations that enhance user experience without sacrificing performance or accessibility. This skill covers animation tools, patterns, and the decision framework for choosing the right approach.

## Animation Tool Selection

### Decision Matrix

```
ANIMATION NEED                          RECOMMENDED TOOL
--------------------------------------------------------------
Simple hover/focus effects              CSS transitions
Keyframe sequences (loading, etc.)      CSS @keyframes
Entrance/exit component animations      Framer Motion (React)
                                        Vue <Transition> (Vue)
Scroll-triggered reveals                CSS scroll-driven animations
                                        (or Intersection Observer)
Complex timeline sequences              GSAP
SVG path animations                     GSAP or CSS
Spring/physics-based motion             Framer Motion (spring)
Layout animations (position/size)       Framer Motion (layoutId)
Gesture-driven (drag, pinch)            Framer Motion (drag)
Shared element transitions              View Transitions API
Data visualization animations           D3 transitions or GSAP
Micro-interactions (icons, toggles)     CSS or Lottie
```

## CSS Transitions

### Fundamentals

```css
/* Transition shorthand: property duration timing-function delay */
.button {
  background: var(--color-brand);
  transition: background 200ms ease-out, transform 150ms ease-out;
}
.button:hover {
  background: var(--color-brand-hover);
  transform: scale(1.02);
}

/* Individual properties */
.card {
  transition-property: transform, box-shadow, opacity;
  transition-duration: 200ms, 300ms, 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Named timing functions */
--ease-in:        cubic-bezier(0.4, 0, 1, 1);     /* Accelerating */
--ease-out:       cubic-bezier(0, 0, 0.2, 1);     /* Decelerating */
--ease-in-out:    cubic-bezier(0.4, 0, 0.2, 1);   /* Standard */
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1); /* Overshoot */
```

### Common Transition Patterns

```css
/* Fade in/out */
.fade-enter { opacity: 0; }
.fade-enter-active { opacity: 1; transition: opacity 300ms ease-out; }
.fade-exit { opacity: 1; }
.fade-exit-active { opacity: 0; transition: opacity 200ms ease-in; }

/* Slide up from below */
.slide-up {
  transform: translateY(20px);
  opacity: 0;
  transition: transform 300ms ease-out, opacity 200ms ease-out;
}
.slide-up.active {
  transform: translateY(0);
  opacity: 1;
}

/* Skeleton loading shimmer */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

## CSS @keyframes

```css
/* Spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.spinner {
  animation: spin 1s linear infinite;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-brand);
  border-radius: 50%;
  width: 24px; height: 24px;
}

/* Pulse (attention indicator) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.notification-dot {
  # ... (condensed) ...
.list-item:nth-child(2) { animation-delay: calc(1 * 50ms); }
.list-item:nth-child(3) { animation-delay: calc(2 * 50ms); }

/* Or with style attribute: style="--i: 3" */
.list-item {
  animation-delay: calc(var(--i) * 50ms);
}
```

## CSS Scroll-Driven Animations

```css
/* Animate based on scroll position */
@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Trigger when element enters viewport */
.reveal-on-scroll {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 50%;
}
# ... (condensed) ...
  to { transform: translateY(-50px); }
}

.parallax-element {
  animation: parallax linear;
  animation-timeline: scroll();
}
```

## Framer Motion (React)

### Basic Patterns

```tsx
import { motion, AnimatePresence } from 'framer-motion';

// Entrance animation
function Card() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <h2>Card Content</h2>
    </motion.div>
  );
}

// Exit animation (requires AnimatePresence)
function Modal({ isOpen, onClose }: ModalProps) {
  return (
    # ... (condensed) ...
        <motion.li key={item.id} variants={itemVariants}>
          {item.name}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### Spring Physics

```tsx
// Spring animation (natural, physics-based motion)
<motion.div
  animate={{ x: 100 }}
  transition={{
    type: 'spring',
    stiffness: 300,   // Higher = snappier
    damping: 20,      // Higher = less bounce
    mass: 1,          // Higher = more inertia
  }}
/> .// Presets
const springPresets = {
  snappy:  { type: 'spring', stiffness: 400, damping: 25 },
  bouncy:  { type: 'spring', stiffness: 300, damping: 10 },
  gentle:  { type: 'spring', stiffness: 120, damping: 14 },
  molasses: { type: 'spring', stiffness: 60, damping: 20 },
};

// When to use spring vs easing:
// Spring: interactive elements, drag, layout changes (feels natural)
// Easing: simple transitions, entrance/exit (feels predictable)
```

### Layout Animations

```tsx
// Automatic layout animation
function ExpandableCard({ expanded }: { expanded: boolean }) {
  return (
    <motion.div layout className={expanded ? 'card-expanded' : 'card-collapsed'}>
      <motion.h2 layout="position">Title</motion.h2>
      {expanded && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          Expanded content here.
        </motion.p>
      )}
    </motion.div>
  );
}

# ... (condensed) ...
            {item.title}
          </motion.div>
        ))}
      </div>
    </LayoutGroup>
  );
}
```

### Gesture Animations

```tsx
// Drag
<motion.div
  drag
  dragConstraints={{ top: -100, bottom: 100, left: -100, right: 100 }}
  dragElastic={0.2}
  whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
/> .// Hover and tap
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={springPresets.snappy}
>
  Click Me
</motion.button> .// Scroll-triggered (with useInView)
# ... (condensed) ...
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
```

## GSAP (Complex Timelines)

```ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Timeline sequence
const tl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.5 } });

tl.from('.hero-title', { y: 60, opacity: 0 })
  .from('.hero-subtitle', { y: 40, opacity: 0 }, '-=0.3')   // Overlap by 0.3s
  .from('.hero-cta', { scale: 0.8, opacity: 0 }, '-=0.2')
  .from('.hero-image', { x: 100, opacity: 0 }, '-=0.4');

// Scroll-triggered animation
gsap.from('.feature-card', {
  scrollTrigger: {
    trigger: '.features-section',
    start: 'top 80%',
    # ... (condensed) ...
  const ctx = gsap.context(() => {
    // All GSAP animations here
    gsap.from('.item', { opacity: 0, y: 20, stagger: 0.1 });
  }, containerRef);

  return () => ctx.revert();  // Clean up all animations
}, []);
```

## Reduce Motion Preferences

### Implementation

```css
/* CSS: Globally respect user preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
// React: useReducedMotion hook
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

// Usage
function AnimatedCard() {
  const reduced = useReducedMotion();
# ... (condensed) ...
      Content
    </motion.div>
  );
}

// Framer Motion built-in (v6+)
import { useReducedMotion } from 'framer-motion';
```

## Performance Budget for Animation

```
TARGET: Animations must maintain 60fps (16.67ms per frame)

RULES:
  1. Only animate transform and opacity (compositor-only properties)
  2. Avoid animating width, height, top, left, margin, padding
  3. Use will-change sparingly (adds memory overhead)
  4. Limit simultaneous animations to ~10-15 elements
  5. Use requestAnimationFrame for JS-driven animations
  6. Debounce scroll handlers (or use CSS scroll-driven animations)
  7. Avoid animating elements that trigger layout in other elements

MEASUREMENT:
  - Chrome DevTools > Performance > Frame chart
  - Target: No frames exceeding 16ms
  - Check for layout thrashing (forced reflow indicators)

OPTIMIZATION TECHNIQUES:
  - Use transform: translateZ(0) or will-change to promote layers
  - Use contain: layout paint for animated containers
  - Use content-visibility: auto for offscreen animated content
  - Pause animations when not visible (Intersection Observer)
```

## Animation Design Principles

```
1. PURPOSE: Every animation must serve a function
   - Guide attention
   - Show relationships (parent-child, before-after)
   - Provide feedback (click, hover, success, error)
   - Maintain spatial orientation (where content came from)
   - Reduce perceived wait time

2. DURATION GUIDELINES:
   Micro-interactions (hover, toggle):  100-200ms
   Entrance animations:                 200-400ms
   Exit animations:                     150-300ms (faster than entrance)
   Page transitions:                    300-500ms
   Complex sequences:                   500-1000ms total

3. EASING:
   Entering: ease-out (decelerating -- appears quickly, settles in)
   Exiting: ease-in (accelerating -- starts slow, leaves quickly)
   Moving: ease-in-out (natural movement)
   Continuous: linear (spinners, progress)

4. STAGGER:
   30-80ms between list items (faster for more items)
   Max total stagger duration: ~500ms (even for 20+ items)
```

## Animation Architecture Checklist

- [ ] Animation tool selected based on complexity needs
- [ ] CSS transitions used for simple hover/focus effects
- [ ] CSS @keyframes used for looping and loading animations
- [ ] Framer Motion or equivalent used for enter/exit/layout animations
- [ ] GSAP reserved for complex timeline sequences
- [ ] All animations maintain 60fps (verified in DevTools)
- [ ] Only transform and opacity are animated (no layout properties)
- [ ] prefers-reduced-motion respected globally
- [ ] Animation durations follow UX guidelines (100-500ms)
- [ ] Stagger timing capped at reasonable total duration
- [ ] Every animation has a clear purpose (not decorative)
- [ ] Spring physics used for interactive/gesture animations
- [ ] Scroll-driven animations use CSS API where supported
- [ ] GSAP animations cleaned up on component unmount
- [ ] will-change used only during active animation

## When to Use

**Use this skill when:**
- Designing or implementing animation designer solutions
- Reviewing or improving existing animation designer approaches
- Making architectural or implementation decisions about animation designer
- Learning animation designer patterns and best practices
- Troubleshooting animation designer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Animation Designer Analysis

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

**Input:** "Help me implement animation designer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended animation designer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When animation designer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
