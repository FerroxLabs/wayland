---
name: web-animation-master
description: |
  Web animation expertise covering CSS animations and transitions, GSAP, Framer Motion, scroll-triggered animations, performance optimization, animation choreography, easing functions, reduced motion accessibility, and animation design patterns.
  Use when the user asks about web animation master, web animation master best practices, or needs guidance on web animation master implementation.
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

# Web Animation Master

You are an expert web animation developer who creates performant, accessible, and visually polished animations. Good animation is invisible -- it guides the user's attention, communicates state changes, and makes interfaces feel responsive. Bad animation is distracting, janky, and nauseating. The difference is understanding performance constraints, timing, and restraint.

## Animation Decision Framework

### When to Animate

| Purpose | Animate | Example |
|---------|---------|---------|
| **State change feedback** | Yes | Button press, toggle switch, form submission |
| **Spatial continuity** | Yes | Page transitions, expanding panels, modal open/close |
| **Drawing attention** | Sparingly | New notification badge, important call-to-action |
| **Loading indication** | Yes | Skeleton screens, progress bars, spinners |
| **Delight/brand** | Sparingly | Logo animation, onboarding sequence |
| **Decoration only** | No | Gratuitous background animations, parallax abuse |

### Technology Selection

```
What are you building?

├── Simple hover/focus/state effects
│   └── CSS Transitions (no JS needed)
│
├── Looping/keyframe animations
│   └── CSS @keyframes (no JS needed)
│
├── React component animations
│   ├── Layout animations, gestures, exit animations
│   │   └── Framer Motion (React-specific, declarative)
│   └── Complex timelines, scroll-driven, FLIP
│       └── GSAP (framework-agnostic, most powerful)
│
├── Scroll-triggered animations
│   ├── Simple reveal-on-scroll
│   │   └── CSS scroll-driven animations (modern browsers)
│   └── Complex scroll-linked timelines
│       └── GSAP ScrollTrigger
│
└── SVG / canvas / WebGL animations
    ├── SVG path drawing, morphing
    │   └── GSAP + MotionPathPlugin
    └── 3D, particles, shaders
        └── Three.js / PixiJS / WebGL directly
```

## CSS Animations

### Transitions (State A to State B)

```css
/* RULE: Only transition properties that are cheap to animate */
.button {
  /* Cheap: transform, opacity (GPU-composited, no layout/paint) */
  transform: scale(1);
  opacity: 1;
  transition: transform 200ms ease-out, opacity 200ms ease-out;
}

.button:hover {
  transform: scale(1.05);
}

.button:active {
  transform: scale(0.97);
}

/* ANTI-PATTERN: Animating layout properties */
.card-bad {
  width: 200px;
  /* This triggers layout recalculation every frame = jank */
  transition: width 300ms ease;
}
.card-bad:hover {
  width: 250px;  /* AVOID: causes layout thrashing */
}

/* BETTER: Use transform: scale() instead */
.card-good {
  transition: transform 300ms ease;
}
.card-good:hover {
  transform: scaleX(1.25);  /* GPU-composited, smooth */
}
```

### Keyframe Animations

```css
/* Skeleton loading pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.skeleton {
  background: #e0e0e0;
  animation: pulse 1.5s ease-in-out infinite;
}

/* Slide-in from right */
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification {
  animation: slide-in 300ms ease-out forwards;
}

/* Staggered list items (using custom properties) */
.list-item {
  animation: fade-up 400ms ease-out backwards;
  animation-delay: calc(var(--index) * 60ms);
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
}
```

```html
<ul>
  <li class="list-item" style="--index: 0">Item 1</li>
  <li class="list-item" style="--index: 1">Item 2</li>
  <li class="list-item" style="--index: 2">Item 3</li>
</ul>
```

## Easing Functions

### Common Easings and When to Use Them

| Easing | CSS Value | Use For |
|--------|-----------|---------|
| **ease-out** | `cubic-bezier(0, 0, 0.2, 1)` | Entrances (element appearing) |
| **ease-in** | `cubic-bezier(0.4, 0, 1, 1)` | Exits (element disappearing) |
| **ease-in-out** | `cubic-bezier(0.4, 0, 0.2, 1)` | Moving between positions |
| **linear** | `linear` | Opacity changes, color changes, progress bars |
| **spring** | Custom or GSAP | Interactive/physical-feeling animations |
| **bounce** | Custom keyframes | Playful UI, notifications |

### Custom Easing Reference

```css
--ease-standard: cubic-bezier(0.2, 0, 0, 1);          /* General purpose */
--ease-decelerate: cubic-bezier(0, 0, 0, 1);           /* Entering elements */
--ease-accelerate: cubic-bezier(0.3, 0, 1, 1);         /* Exiting elements */
--ease-overshoot: cubic-bezier(0.34, 1.56, 0.64, 1);   /* Playful bounce */
```

## GSAP (GreenSock Animation Platform)

### Basic GSAP Usage

```javascript
import gsap from 'gsap';

// Animate TO target values
gsap.to('.box', {
  x: 200,
  y: 100,
  rotation: 360,
  scale: 1.5,
  opacity: 0.8,
  duration: 1,
  ease: 'power2.out',
});

// Animate FROM values to current state
gsap.from('.hero-title', {
  y: 60,
  opacity: 0,
  duration: 0.8,
  ease: 'power3.out',
});

// Stagger multiple elements
gsap.from('.card', {
  y: 40,
  opacity: 0,
  duration: 0.6,
  stagger: 0.1,         // 100ms between each card
  ease: 'power2.out',
});
```

### GSAP Timeline (Choreography)

```javascript
const tl = gsap.timeline({
  defaults: { duration: 0.5, ease: 'power2.out' },
});

tl.from('.hero-bg', { scale: 1.1, opacity: 0, duration: 1 })
  .from('.hero-title', { y: 40, opacity: 0 }, '-=0.3')      // Start 0.3s before previous ends
  .from('.hero-subtitle', { y: 30, opacity: 0 }, '-=0.2')
  .from('.hero-cta', { scale: 0.8, opacity: 0 }, '-=0.1')
  .from('.hero-image', { x: 60, opacity: 0, duration: 0.8 }, '-=0.4');

// Control the timeline
tl.play();
tl.pause();
tl.reverse();
tl.seek(0.5);   // Jump to 0.5 seconds
tl.timeScale(2); // 2x speed
```

### GSAP ScrollTrigger

```javascript
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// Simple: animate when element enters viewport
gsap.from('.feature-card', {
  scrollTrigger: {
    trigger: '.feature-card',
    start: 'top 80%',        // When top of element hits 80% of viewport
    end: 'bottom 20%',
    toggleActions: 'play none none reverse',
    // onEnter  onLeave  onEnterBack  onLeaveBack
  },
  y: 60,
  opacity: 0,
  duration: 0.8,
  stagger: 0.15,
});

// Pinned section with scrub (scroll-linked)
gsap.to('.horizontal-section', {
  scrollTrigger: {
    trigger: '.horizontal-wrapper',
    pin: true,                // Pin the wrapper while scrolling
    scrub: 1,                 // Smooth 1-second lag behind scroll
    start: 'top top',
    end: '+=3000',            // Scroll 3000px to complete animation
  },
  x: '-300%',                 // Slide 4 panels left
  ease: 'none',
});
```

## Framer Motion (React)

### Basic Animations

```tsx
import { motion } from 'framer-motion';

// Animate on mount
function FadeIn({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// Animate on hover and tap
function AnimatedButton() {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      Click me
    </motion.button>
  );
}
```

### Layout Animations (FLIP)

```tsx
import { motion, AnimatePresence } from 'framer-motion';

function TodoList({ items, onRemove }) {
  return (
    <ul>
      <AnimatePresence>
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout                           // Auto-animate position changes
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0 }}  // Animate on removal
            transition={{
              layout: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            {item.text}
            <button onClick={() => onRemove(item.id)}>Remove</button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
```

### Variants (Orchestrated Children)

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function StaggeredList({ items }) {
  return (
    <motion.ul variants={container} initial="hidden" animate="show">
      {items.map((i) => (
        <motion.li key={i.id} variants={item}>
          {i.text}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

## Performance Optimization

### The Compositing Checklist

```
CHEAP TO ANIMATE (GPU-composited, no layout or paint):
  ✓ transform (translate, scale, rotate)
  ✓ opacity
  ✓ filter (blur, brightness, etc.)
  ✓ clip-path (in most browsers)

EXPENSIVE TO ANIMATE (triggers layout or paint):
  ✗ width, height, top, left, right, bottom
  ✗ margin, padding
  ✗ border-width, border-radius
  ✗ font-size
  ✗ box-shadow (triggers paint)

TECHNIQUE: Replace expensive properties with transform equivalents
  width change    -> transform: scaleX()
  height change   -> transform: scaleY()
  top/left change -> transform: translate()
  visibility      -> opacity: 0/1
```

### Debugging Performance

```javascript
// Chrome DevTools: Performance panel
// 1. Record while animation plays
// 2. Look for long frames (>16.6ms for 60fps)
// 3. Check "Rendering" tab: enable "Paint flashing" to see repaints

// Force GPU compositing (use sparingly)
.animated-element {
  will-change: transform, opacity;  /* Hint to browser: promote to own layer */
  /* Remove will-change after animation completes to free GPU memory */
}

// Measure frame rate in code
let frames = 0;
let lastTime = performance.now();
function countFrames() {
  frames++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    console.log(`FPS: ${frames}`);
    frames = 0;
    lastTime = now;
  }
  requestAnimationFrame(countFrames);
}
countFrames();
```

### Content Visibility for Off-Screen Elements

```css
/* Don't render off-screen sections until needed */
.section {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px;
}
```

## Accessibility

### Respecting Reduced Motion

```css
/* Always provide reduced motion alternatives */
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

/* Or selectively disable only non-essential animations */
@media (prefers-reduced-motion: reduce) {
  .decorative-animation { animation: none; }
  .page-transition { transition: opacity 0.1ms; } /* Instant but still triggers events */
  /* Keep functional animations like loading spinners */
}
```

```javascript
// GSAP: Check user preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(20); // Near-instant animations
}

// Framer Motion: Built-in support
import { useReducedMotion } from 'framer-motion';

function Component() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      animate={{ x: 100 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}
    />
  );
}
```

### Animation Accessibility Rules

1. **Never animate content that conveys information only through motion** (some users will not see it)
2. **Provide pause/stop controls** for animations lasting more than 5 seconds
3. **Avoid flashing more than 3 times per second** (seizure risk, WCAG 2.3.1)
4. **Do not use animation as the only way to convey meaning** (e.g., a shaking form field should also show an error message)

## Common Anti-Patterns

1. **Animating layout properties**: `width`, `height`, `top`, `left` cause layout thrashing. Use `transform` instead.

2. **Too many `will-change` layers**: Every `will-change` element gets its own GPU layer. Too many layers consume memory and actually hurt performance.

3. **Animation for animation's sake**: If removing the animation does not hurt usability, it probably should not be there. Every animation should have a purpose.

4. **Ignoring reduced motion**: 15-20% of users have vestibular disorders or motion sensitivity. Always provide `prefers-reduced-motion` alternatives.

5. **Synchronous JavaScript animations**: Using `setInterval` or `setTimeout` for animations. Use `requestAnimationFrame`, CSS animations, or animation libraries that use rAF internally.

## Animation Checklist

- [ ] Animation purpose defined (feedback, continuity, attention, loading)
- [ ] Technology chosen appropriate to complexity
- [ ] Only compositable properties animated (transform, opacity)
- [ ] Easing functions match the animation intent (ease-out for entrances, ease-in for exits)
- [ ] `prefers-reduced-motion` media query implemented
- [ ] Duration is appropriate (100-300ms for micro-interactions, 300-500ms for transitions)
- [ ] No content flashing more than 3 times per second
- [ ] Performance tested in DevTools (consistent 60fps)
- [ ] Animations do not block user interaction
- [ ] Loading states use skeleton screens or subtle animations, not spinners everywhere

## When to Use

**Use this skill when:**
- Designing or implementing web animation master solutions
- Reviewing or improving existing web animation master approaches
- Making architectural or implementation decisions about web animation master
- Learning web animation master patterns and best practices
- Troubleshooting web animation master-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Web Animation Master Analysis

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

**Input:** "Help me implement web animation master for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended web animation master approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When web animation master must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
