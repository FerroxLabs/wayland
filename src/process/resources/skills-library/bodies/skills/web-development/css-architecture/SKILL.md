---
name: css-architecture
description: |
  Guides expert-level css architecture implementation: html-css and web-development decision frameworks, production-ready patterns, and concrete templates for css architecture workflows.
  Use when the user asks about css architecture, css architecture configuration, or html-css best practices for css projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "html-css web-development design-patterns"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# CSS Architecture

## When to Use

**Use this skill when:**
- A user is starting a new frontend project and needs to choose a CSS methodology (BEM, SMACSS, ITCSS, Atomic CSS, CSS Modules, CSS-in-JS)
- A user has a growing stylesheet that is becoming difficult to maintain -- specificity conflicts, unintended overrides, or dead code accumulating
- A user wants to establish a design token system, component library, or style guide from scratch
- A user is migrating from a legacy approach (plain global CSS, Bootstrap overrides, inline styles) to a scalable architecture
- A user needs to configure CSS tooling: PostCSS, Sass/SCSS, CSS Modules, Stylelint, PurgeCSS, or critical CSS extraction
- A user asks how to structure a large-scale CSS codebase across multiple teams or micro-frontends
- A user is experiencing performance issues caused by render-blocking CSS, excessive specificity, or very large bundle sizes
- A user needs to implement a dark mode, theming system, or multi-brand design system using CSS custom properties

**Do NOT use this skill when:**
- The user needs help writing animations or transitions -- use a dedicated animation skill for keyframe, Web Animations API, or GSAP patterns
- The user is asking about CSS Grid or Flexbox layout mechanics without an architectural question -- use the layout skill for those specifics
- The user needs help with responsive design breakpoints exclusively -- that is a layout concern, not an architecture concern
- The user is asking about a JavaScript framework's styling system exclusively (e.g., Tailwind configuration in Next.js, Styled Components API) -- check the framework-specific skill first, then combine with this skill if architecture decisions are involved
- The user wants help debugging a single CSS rule that is not working -- use browser devtools guidance instead
- The user is working with email HTML/CSS, which follows entirely different constraints (inline styles only, no external sheets)
- The user needs SVG styling or canvas rendering -- those follow different paradigms
- The user is asking about server-side CSS generation in an unfamiliar runtime (Deno, Bun) without a clear architectural question

---

## Process

### 1. Assess Project Context and Scale

Before recommending any methodology, gather four critical dimensions:

- **Team size and CSS experience:** A solo developer or small team (1--3 people) can sustain utility-first (Tailwind-style) or CSS Modules with minimal convention overhead. A team of 6+ needs an enforced naming system (BEM or scoped modules) to prevent naming collisions and style drift.
- **Application type:** Server-rendered (Next.js, Remix, Rails) prioritizes critical CSS extraction and minimal render-blocking payload. SPA (React, Vue, Angular) can tolerate slightly larger upfront bundles but benefits from code-splitting stylesheets per route.
- **Component model:** If the codebase uses a component framework (React, Vue, Svelte), CSS Modules or CSS-in-JS (Emotion, Stitches, Vanilla Extract) align naturally with component boundaries. If the project is HTML-first (static sites, Eleventy, WordPress), BEM or ITCSS scales better.
- **Design system maturity:** A project with an existing Figma token set should map directly to CSS custom properties. A project without a design system should establish a token layer before adding components.

### 2. Choose an Architecture Methodology

Apply the following decision framework based on context:

- **ITCSS (Inverted Triangle CSS):** Best for large, multi-team projects with shared global styles. Structures CSS into seven ordered layers: Settings (variables/tokens), Tools (mixins/functions), Generic (normalize/reset), Elements (bare HTML elements), Objects (layout patterns), Components (UI components), Utilities (overrides). The specificity increases down the triangle, preventing override conflicts by convention.
- **BEM (Block Element Modifier):** Best for component-centric projects that do not use a scoping mechanism. Name selectors as `.block__element--modifier`. Eliminates specificity wars by keeping all selectors at a single class level. Combine with ITCSS for large projects.
- **CSS Modules:** Best for React, Vue, and Svelte projects where tooling handles scoping. Each `.module.css` file generates locally scoped class names at build time. Eliminates naming collision risk entirely. Use `:global()` escape hatch sparingly and document every usage.
- **Utility-First (Atomic CSS):** Best for projects using Tailwind CSS or a custom atomic system, rapid prototyping, and teams comfortable with HTML-centric styling. Works poorly for shared component libraries consumed by teams without the utility layer.
- **CSS-in-JS (Emotion, Stitches, Vanilla Extract):** Best for JS-first teams that need dynamic theming, runtime style injection, or strong TypeScript integration. Vanilla Extract compiles to static CSS at build time (zero runtime cost). Emotion and Styled Components have a JS bundle runtime cost (~7--15KB gzipped) and may cause FOUC without SSR setup.
- **Zero-runtime CSS-in-JS (Vanilla Extract, Linaria, Panda CSS):** Emerging best practice for performance-sensitive projects. Generates static CSS files during build while keeping the authoring experience of CSS-in-JS.

Avoid mixing methodologies within a single codebase. A project can layer ITCSS + BEM (common) or Tailwind + CSS Modules for component internals, but should not mix BEM globals with CSS-in-JS component files arbitrarily.

### 3. Design the Token and Variable System

CSS custom properties are the foundation of any scalable architecture. Structure them in three tiers:

- **Tier 1 -- Primitive Tokens:** Raw values. Never used directly in component code. Examples: `--color-blue-500: #3b82f6`, `--space-4: 1rem`, `--font-size-base: 16px`.
- **Tier 2 -- Semantic Tokens:** Mapped from primitives, convey intent. Examples: `--color-action-primary: var(--color-blue-500)`, `--space-component-gap: var(--space-4)`, `--text-body: var(--font-size-base)`.
- **Tier 3 -- Component Tokens:** Scoped to a specific component. Examples: `--button-bg: var(--color-action-primary)`, `--button-padding: var(--space-component-gap)`.

Define Tier 1 and Tier 2 tokens in `:root`. Define Tier 3 tokens in the component selector scope. This structure enables theming at any level: override `:root` variables for dark mode, override component variables for variants.

### 4. Establish the File and Folder Structure

For ITCSS-based projects using Sass/PostCSS, use this canonical folder structure:

```
styles/
├── settings/
│   ├── _tokens.scss        # Design tokens (colors, spacing, type scale)
│   └── _breakpoints.scss   # Breakpoint values only
├── tools/
│   ├── _mixins.scss        # Reusable mixins
│   └── _functions.scss     # Sass functions (e.g., px-to-rem)
├── generic/
│   ├── _reset.scss         # box-sizing, margin/padding reset
│   └── _normalize.scss     # Browser normalization
├── elements/
│   ├── _typography.scss    # h1–h6, p, a, ul, ol bare styles
│   └── _forms.scss         # input, button, select bare styles
├── objects/
│   ├── _container.scss     # Max-width wrapper
│   ├── _grid.scss          # Layout grid object
│   └── _media.scss         # Media object (image + text pattern)
├── components/
│   ├── _button.scss
│   ├── _card.scss
│   └── _nav.scss
├── utilities/
│   ├── _spacing.scss       # Margin/padding utility classes
│   └── _visibility.scss    # Screen-reader-only, hidden
└── main.scss               # Imports in ITCSS order
```

For CSS Modules projects, co-locate module files with components:

```
components/
├── Button/
│   ├── Button.tsx
│   ├── Button.module.css
│   └── Button.test.tsx
├── Card/
│   ├── Card.tsx
│   └── Card.module.css
styles/
├── tokens.css              # :root custom properties (global)
├── reset.css               # Global reset
└── typography.css          # Base type styles
```

### 5. Configure Tooling and Linting

CSS architecture enforcement requires tooling. Configure these tools:

- **Stylelint:** Install `stylelint`, `stylelint-config-standard`, and `stylelint-order`. Add `stylelint-config-property-order` or `stylelint-config-idiomatic-order` to enforce consistent property declaration order. For BEM projects, add `stylelint-selector-bem-pattern` and configure the BEM pattern regex. Run Stylelint in CI -- do not rely on developer discipline alone.
- **PostCSS:** Use as a build tool even if writing plain CSS. Essential plugins: `postcss-preset-env` (use modern CSS syntax with browser fallbacks), `postcss-custom-media` (define breakpoints as `@custom-media --tablet (width >= 768px)`), `autoprefixer` (handle vendor prefixes automatically).
- **PurgeCSS / Tailwind's JIT purging:** For utility-first projects, configure content paths precisely. Missing a path means used classes get purged. A misconfigured purge is the most common cause of missing styles in production.
- **Critical CSS:** For above-the-fold performance, use `critters` (inline critical CSS automatically in Next.js/Webpack), or `critical` npm package for static sites. Target under 14KB for inlined critical CSS to fit within the first TCP congestion window.
- **Bundle size budgets:** Set CSS bundle size budgets in your build config. A page-level CSS bundle over 100KB (parsed, not compressed) is a signal of poor architecture. Individual component CSS files should rarely exceed 5--10KB uncompressed.

### 6. Implement Specificity Management

Specificity is the most common source of CSS maintenance pain. Apply these rules:

- **Keep specificity flat:** In BEM and utility systems, every selector should have a specificity of exactly (0,1,0) -- one class. Avoid ID selectors in stylesheets entirely. Avoid chaining class selectors (`.nav .nav__link` becomes `.nav__link` with BEM).
- **Use the cascade intentionally:** Global resets and element styles establish a low-specificity baseline. Components override that baseline with a single class. Utilities sit at the top of the specificity chain and may use `!important` sparingly (Tailwind's `!` prefix variant generates `!important` declarations -- acceptable only for utility overrides, never in component code).
- **Specificity visualization:** Use a specificity visualizer (specificity.keegan.st pattern) to audit selectors during code review. Flag any selector exceeding (0,2,0) for review.
- **Layer with `@layer`:** CSS Cascade Layers (supported in all modern browsers since 2022) allow explicit specificity ordering without hacks. Declare layers at the top of your main entry file: `@layer reset, tokens, base, components, utilities;`. Styles in `utilities` always override `components`, regardless of specificity.

### 7. Define Naming Conventions and Documentation

Conventions must be written down, not assumed:

- **BEM naming rules:** Block names use lowercase kebab-case (`.search-form`). Elements use double underscore (`.search-form__input`). Modifiers use double hyphen (`.search-form__input--disabled`). Never nest BEM elements (`.search-form__list__item` is wrong -- use `.search-form__item`).
- **CSS custom property naming:** Use kebab-case with a namespace prefix for component tokens: `--button-primary-bg`, `--card-border-radius`, `--nav-link-color`. Global tokens do not need a component prefix.
- **Utility class naming:** If building a custom utility system (not Tailwind), use single-purpose, abbreviated names: `.mt-4` (margin-top: 1rem), `.flex` (display: flex), `.text-center`. Document every utility class in a living style guide.
- **File naming:** SCSS partials use underscore prefix (`_button.scss`) to prevent direct compilation. CSS Modules use PascalCase matching the component (`Button.module.css`). Global CSS files use kebab-case without underscore (`reset.css`).
- **Architecture Decision Records:** Create an `ARCHITECTURE.md` in the styles root. Record: chosen methodology, token structure, naming convention, browser support targets, tooling decisions, and any exceptions to standard patterns with their justification.

### 8. Establish a Review and Refactoring Process

CSS architecture degrades without active maintenance:

- **CSS review checklist in PRs:** Check for selector specificity creep, new magic numbers (hardcoded values that should use tokens), unused variables, duplicate property declarations, and missed responsive handling.
- **Dead CSS detection:** Run `PurgeCSS` in report-only mode quarterly, or use `uncss` on static sites. Remove unused selectors aggressively -- unused CSS is technical debt that slows parse time.
- **Refactoring triggers:** Schedule an architecture review when: the main stylesheet exceeds 50KB uncompressed, more than 3 developers report confusion about where to add styles, or when specificity conflicts require `!important` more than once per quarter.
- **Performance monitoring:** Track CSS parse time and render-blocking duration using Lighthouse CI. A Core Web Vitals regression in LCP caused by render-blocking CSS is a hard stop for a release.

---

## Output Format

When responding to a CSS architecture request, structure the output as follows:

```
## CSS Architecture Assessment

### Project Profile
- **Team size:** [number]
- **Application type:** [SPA / SSR / static / hybrid]
- **Component framework:** [React / Vue / Svelte / none]
- **Existing CSS approach:** [describe current state]
- **Key constraints:** [browser support, performance budget, team experience]

### Recommended Architecture

| Dimension            | Recommendation         | Rationale                              |
|----------------------|------------------------|----------------------------------------|
| Methodology          | [BEM / ITCSS / Modules | Why this fits the project profile      |
| Token system         | [CSS custom properties | Structure: primitive > semantic > comp |
| Tooling              | [PostCSS / Sass / etc] | Why this tooling fits the stack        |
| Specificity strategy | [@layer / flat BEM]    | How specificity will be managed        |
| File structure       | [ITCSS / co-located]   | How files will be organized            |

### Implementation Plan

#### Phase 1: Foundation (Week 1)
[Concrete steps for establishing tokens, reset, and file structure]

#### Phase 2: Component Migration (Weeks 2–4)
[Strategy for writing or migrating components under the new system]

#### Phase 3: Tooling and Enforcement (Week 2 alongside Phase 2)
[Stylelint config, CI integration, bundle budgets]

### File Structure

[Annotated folder tree for this specific project]

### Token Structure

[CSS custom property declarations for Tier 1, 2, and 3 tokens]

### Stylelint Configuration

[stylelint.config.js with rules specific to the chosen methodology]

### Critical Decisions and Trade-offs

[Numbered list of key choices made and what was rejected and why]

### Maintenance Guidelines

[Rules the team should follow, written as enforced conventions]
```

---

## Rules

1. **Never mix BEM global selectors with unscoped CSS Modules in the same component.** If a component uses a `.module.css` file, all its styles must live in that file. Placing additional BEM classes for the same component in a global stylesheet creates two sources of truth and guarantees drift.

2. **Never use ID selectors (`#id`) in stylesheets.** IDs have a specificity of (1,0,0), which defeats any flat-specificity strategy. IDs belong in HTML for accessibility (aria targets, fragment links) but never as CSS selectors.

3. **Never hardcode color, spacing, or typography values in component files.** Every non-zero value for these properties must reference a CSS custom property or Sass variable. A raw hex code or pixel value in a component file is a design token system violation and creates future inconsistency.

4. **Always define browser support targets before choosing a CSS feature.** `@layer`, `container queries`, `CSS nesting`, and `:has()` have varying support thresholds. Check the project's browser support matrix (usually defined in `.browserslistrc`) before using any feature. Use `postcss-preset-env` to polyfill or transpile where support is insufficient.

5. **Never nest selectors more than 2 levels deep in Sass/PostCSS, even when the language allows it.** Deep nesting generates high-specificity selectors and makes the generated CSS unreadable. BEM eliminates the need for nesting by encoding hierarchy in class names.

6. **Always configure Stylelint in CI with zero-tolerance for errors.** A Stylelint warning that does not block a PR will be ignored. CSS architecture only holds at team scale when violations are caught automatically. Warnings can be used during migration; they must be resolved before they can stay as permanent configuration.

7. **Never use `!important` in component or object CSS.** The only acceptable uses of `!important` are: in utility classes (where it is the mechanism for override), in accessibility-driven overrides (forced-colors media query), or in third-party override stylesheets that cannot change the third-party source. All three must be documented with a comment explaining why.

8. **Always extract critical CSS for server-rendered or statically generated pages.** For any page where Largest Contentful Paint (LCP) is a priority, the CSS required to render above-the-fold content must be inlined in the `<head>`. Failing to do this forces the browser to block rendering while fetching an external stylesheet.

9. **Never delete a CSS class without searching for its usage across HTML templates, JavaScript, and test files.** Tools like `grep`, `ripgrep`, or IDE project-wide search must confirm zero references. Automated dead-code detection (PurgeCSS, UnCSS) provides confidence but can miss dynamically constructed class names in JavaScript.

10. **Always write CSS custom property fallback values during migration periods.** When replacing a hardcoded value with a token (`color: var(--color-action-primary, #3b82f6)`), include the fallback during the transition. Remove fallbacks only after confirming the token is defined in all environments (including production builds and Storybook).

---

## Edge Cases

### Legacy Codebase with Accumulated Specificity Debt

When a codebase has thousands of lines of unstructured global CSS with chained selectors (`.page .content .widget h2 a`), a full rewrite is rarely feasible. Use the strangler fig pattern:

- Introduce `@layer legacy` as the first layer declaration. Place all existing styles inside it: `@layer legacy { @import 'legacy.css'; }`. New styles declared outside any layer will automatically have higher priority than layered styles, regardless of specificity.
- Write all new component styles in a `components` layer. This allows new work to override legacy CSS without specificity battles.
- Track legacy selector removal in a dedicated Jira/Linear backlog. Target removing 10--15 legacy selectors per sprint as components are refactored, not as a separate rewrite initiative.
- Never attempt to add a new CSS architecture on top of existing inline styles without first auditing how many inline styles exist (grep for `style=` in HTML templates). Inline styles have specificity (1,0,0,0) -- above everything except `!important`. They must be removed from HTML before a token system can govern those elements.

### Micro-Frontend or Multi-Team CSS

When multiple teams contribute CSS to a single rendered page, CSS architecture becomes a coordination problem:

- Enforce a namespace prefix per team or domain. Team A uses `.ta-` prefix, Team B uses `.tb-` prefix. This prevents accidental class name collisions without requiring a build-time scoping mechanism.
- If the micro-frontend framework supports Shadow DOM (web components), CSS is automatically scoped. Custom properties still pierce the shadow boundary -- use this for theming but document it explicitly so teams know token overrides are intentional.
- Establish a shared tokens package (npm package or monorepo package) that all teams import. The token package should be versioned semantically. Breaking changes to a token (renaming `--color-brand` to `--color-primary`) require a major version bump and a deprecation period.
- Run a bundle overlap analysis using `webpack-bundle-analyzer` or `source-map-explorer` to detect duplicate CSS libraries (e.g., two teams bundling different versions of normalize.css). Duplicate reset or base styles cause unpredictable cascade interactions.

### Dark Mode and Theming System Implementation

Dark mode implemented with CSS architecture requires deliberate token design, not ad hoc overrides:

- Never create a parallel `.dark-button`, `.dark-card` class structure. This doubles the CSS codebase and creates a maintenance nightmare.
- Correct approach: Semantic tokens change their values based on a theme class or media query. `--color-surface` is `#ffffff` in light mode and `#1a1a1a` in dark mode. Component code references `--color-surface` and automatically updates.
- Implementation: Define both themes in `:root`. Use `@media (prefers-color-scheme: dark)` for system-level theming and `[data-theme="dark"]` selector for user-controlled override. The `[data-theme]` selector has higher specificity than the media query, so user preference wins.
- Test color contrast ratios (WCAG AA requires 4.5:1 for normal text) in both themes programmatically. Use `axe-core` or `pa11y` in CI to catch contrast failures introduced during token changes.
- Be aware that CSS custom properties do not work in SVG `fill` and `stroke` attributes in all contexts -- use `currentColor` or inline SVG with `class` attributes for themed icons.

### Performance-Critical Applications (Core Web Vitals Focus)

In applications where CSS is on the LCP critical path:

- Audit the initial CSS payload with Chrome DevTools Coverage tab. Any CSS file with more than 30% unused rules at page load is a candidate for code-splitting or deferred loading.
- Use `<link rel="preload" as="style">` for CSS files that are needed soon but not immediately render-blocking. Combine with `onload` attribute to apply the stylesheet asynchronously, then use `<noscript>` fallback.
- Media-query-based stylesheet splitting: `<link rel="stylesheet" href="print.css" media="print">` is fetched with low priority and does not block rendering. Apply the same technique for non-critical breakpoint styles where possible.
- For CSS Modules and CSS-in-JS projects, configure your bundler to generate per-route CSS chunks. In Next.js, this happens automatically. In Webpack, use `MiniCssExtractPlugin` with multiple entry points.
- Avoid CSS animations that trigger layout (avoid animating `width`, `height`, `margin`, `padding`, `top`, `left`). Animate `transform` and `opacity` only -- these run on the compositor thread and do not cause layout reflow.

### Design Token Migration from Sass Variables to CSS Custom Properties

When migrating from `$sass-variables` to `--css-custom-properties`:

- Custom properties cannot be used inside `@media` queries directly (`@media (max-width: var(--breakpoint-md))` does not work). Sass variables or PostCSS `@custom-media` must still be used for breakpoints. Document this exception explicitly to prevent confusion.
- Custom properties are inherited by default. This is usually desired for tokens but can cause unexpected behavior if a component defines a custom property intending local scope -- the property leaks to all child components. Use the `@property` at-rule to define non-inheriting custom properties where encapsulation is required.
- During migration, maintain both `$sass-variable` and `--custom-property` versions of the same value temporarily. Use a Sass variable that references the custom property as its value: `$color-primary: var(--color-primary)`. This lets Sass-dependent tooling (like some Stylelint rules) continue working while the migration progresses.

### Third-Party CSS Integration (Component Libraries, Bootstrap, MUI)

When integrating a third-party CSS framework into an existing architecture:

- Import third-party CSS inside a dedicated `@layer` to control its priority: `@layer reset, third-party, base, components, utilities;` then `@layer third-party { @import 'bootstrap/dist/css/bootstrap.min.css'; }`. This ensures your components always override Bootstrap without `!important`.
- Audit third-party stylesheet size before importing. Bootstrap 5 full CSS is ~160KB uncompressed. If using only a subset, configure the SCSS import to include only what is needed: import individual Bootstrap modules, not the full bundle.
- Never override third-party styles by targeting their internal class names from your component files. Use the library's provided customization API (CSS custom properties, Sass variable overrides, `sx` prop in MUI) to stay on the supported upgrade path. Direct class overrides break silently on library upgrades.
- CSS-in-JS libraries that inject styles via `<style>` tags at runtime can conflict with SSR-inlined critical CSS. Use the library's SSR support utilities (Emotion's `ServerStyleSheet`, MUI's `createCache` with `prepend: true`) to ensure injected styles do not reorder and override critical styles.

---

## Example

**Input:** "We're building a SaaS dashboard product with a team of 8 frontend engineers. We're using React with TypeScript and Next.js (App Router). We have a Figma design system with defined color, spacing, and typography tokens. Currently our CSS is a mess -- a mix of Bootstrap 4 overrides, some CSS Modules, and inline styles scattered everywhere. We need to get this under control. What architecture do you recommend?"

---

**Output:**

## CSS Architecture Assessment

### Project Profile
- **Team size:** 8 frontend engineers
- **Application type:** SSR + SPA hybrid (Next.js App Router)
- **Component framework:** React with TypeScript
- **Existing CSS approach:** Bootstrap 4 overrides + scattered CSS Modules + inline styles -- no coherent system
- **Key constraints:** Existing Figma token library, SSR performance requirements, 8-person team requiring enforced conventions

---

### Recommended Architecture

| Dimension            | Recommendation                        | Rationale                                                                 |
|----------------------|---------------------------------------|---------------------------------------------------------------------------|
| Methodology          | CSS Modules + ITCSS for globals       | React component model maps naturally to Modules; global styles need ITCSS layers |
| Token system         | CSS custom properties (3-tier)        | Maps directly from Figma tokens; enables dark mode and theming natively   |
| Tooling              | PostCSS + Stylelint + CSS Modules     | Next.js has native PostCSS and CSS Modules support -- zero additional config |
| Specificity strategy | `@layer` for Bootstrap isolation      | Traps Bootstrap 4 CSS inside a low-priority layer; new code always wins   |
| File structure       | Co-located modules + global styles/   | Components own their styles; global tokens/reset live in styles/          |
| Bootstrap exit plan  | Phased removal over 6--8 weeks        | Remove component-by-component as each is replaced; never rewrite all at once |

---

### Implementation Plan

#### Phase 1: Foundation (Week 1)

**Step 1: Establish the token file from Figma.**

Create `styles/tokens.css` and map the Figma token library to three tiers:

```css
/* styles/tokens.css */

/* ─── Tier 1: Primitive Tokens ─────────────────────── */
:root {
  /* Color palette */
  --color-blue-50:  #eff6ff;
  --color-blue-500: #3b82f6;
  --color-blue-600: #2563eb;
  --color-blue-700: #1d4ed8;
  --color-gray-50:  #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-700: #374151;
  --color-gray-900: #111827;
  --color-white:    #ffffff;
  --color-red-500:  #ef4444;
  --color-green-500: #22c55e;

  /* Spacing scale (4px base) */
  --space-1: 0.25rem;  /* 4px  */
  --space-2: 0.5rem;   /* 8px  */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */

  /* Typography */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-size-xs:   0.75rem;   /* 12px */
  --font-size-sm:   0.875rem;  /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg:   1.125rem;  /* 18px */
  --font-size-xl:   1.25rem;   /* 20px */
  --font-size-2xl:  1.5rem;    /* 24px */
  --font-size-3xl:  1.875rem;  /* 30px */
  --font-weight-normal:   400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;
  --line-height-tight:  1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;

  /* Border radius */
  --radius-sm:   0.25rem;
  --radius-md:   0.375rem;
  --radius-lg:   0.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  /* Transitions */
  --transition-fast:   150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow:   350ms ease;
}

/* ─── Tier 2: Semantic Tokens ───────────────────────── */
:root {
  /* Brand */
  --color-brand-primary:   var(--color-blue-500);
  --color-brand-hover:     var(--color-blue-600);
  --color-brand-active:    var(--color-blue-700);

  /* Surfaces */
  --color-surface-page:      var(--color-gray-50);
  --color-surface-card:      var(--color-white);
  --color-surface-overlay:   var(--color-white);

  /* Text */
  --color-text-primary:   var(--color-gray-900);
  --color-text-secondary: var(--color-gray-700);
  --color-text-on-brand:  var(--color-white);
  --color-text-disabled:  var(--color-gray-200);

  /* Borders */
  --color-border-default: var(--color-gray-200);
  --color-border-focus:   var(--color-blue-500);

  /* Status */
  --color-status-error:   var(--color-red-500);
  --color-status-success: var(--color-green-500);

  /* Component spacing */
  --space-section-gap:    var(--space-12);
  --space-component-gap:  var(--space-6);
  --space-element-gap:    var(--space-4);
}

/* ─── Dark Mode: Semantic Token Overrides ───────────── */
@media (prefers-color-scheme: dark) {
  :root {
    --color-surface-page:      #0f172a;
    --color-surface-card:      #1e293b;
    --color-text-primary:      #f8fafc;
    --color-text-secondary:    #94a3b8;
    --color-border-default:    #334155;
  }
}

/* User-controlled theme override (higher priority than media query) */
[data-theme="dark"] {
  --color-surface-page:   #0f172a;
  --color-surface-card:   #1e293b;
  --color-text-primary:   #f8fafc;
  --color-text-secondary: #94a3b8;
  --color-border-default: #334155;
}
```

**Step 2: Set up global layer declarations and Bootstrap isolation.**

Create `styles/layers.css` as the first import in your global entry:

```css
/* styles/layers.css -- declare all layers here, in priority order */
@layer reset, bootstrap, base, components, utilities;
```

Create `styles/bootstrap-isolated.css`:

```css
@layer bootstrap {
  @import 'bootstrap/dist/css/bootstrap.min.css';
}
```

Now all Bootstrap styles have the lowest priority. Any style outside a layer, or in a higher-declared layer, will override Bootstrap without `!important`.

**Step 3: Write the global reset.**

```css
/* styles/reset.css */
@layer reset {
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 100%; /* Respect user browser font size preferences */
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  body {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-base);
    line-height: var(--line-height-normal);
    color: var(--color-text-primary);
    background-color: var(--color-surface-page);
  }

  img, video, svg {
    display: block;
    max-width: 100%;
  }

  button, input, select, textarea {
    font: inherit;
  }
}
```

**Step 4: Configure the global `styles/` directory.**

```
styles/
├── layers.css          # @layer declarations (import first)
├── tokens.css          # CSS custom properties (all three tiers)
├── reset.css           # box-sizing, margin/padding reset
├── typography.css      # h1–h6 base styles using tokens
└── globals.css         # Master import file
```

```css
/* styles/globals.css -- imported once in app/layout.tsx */
@import './layers.css';
@import './tokens.css';
@import './reset.css';
@import './typography.css';
@import './bootstrap-isolated.css'; /* Bootstrap inside @layer bootstrap */
```

In `app/layout.tsx`:
```tsx
import '@/styles/globals.css';
```

---

#### Phase 2: Component Migration (Weeks 2--4)

**Step 5: Establish the CSS Modules pattern for components.**

Every new or refactored component gets a `.module.css` file. Component tokens are defined as local custom properties on the component's root selector:

```css
/* components/Button/Button.module.css */

/* ─── Component Tokens (Tier 3) ────────────────────── */
.button {
  /* Override these to create variants */
  --button-bg:            var(--color-brand-primary);
  --button-bg-hover:      var(--color-brand-hover);
  --button-bg-active:     var(--color-brand-active);
  --button-color:         var(--color-text-on-brand);
  --button-border:        transparent;
  --button-padding-y:     var(--space-2);
  --button-padding-x:     var(--space-4);
  --button-font-size:     var(--font-size-sm);
  --button-font-weight:   var(--font-weight-medium);
  --button-radius:        var(--radius-md);
  --button-shadow:        var(--shadow-sm);
  --button-transition:    var(--transition-fast);

  /* ─── Composition ─── */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--button-padding-y) var(--button-padding-x);
  background-color: var(--button-bg);
  color: var(--button-color);
  border: 1px solid var(--button-border);
  border-radius: var(--button-radius);
  font-size: var(--button-font-size);
  font-weight: var(--button-font-weight);
  line-height: var(--line-height-tight);
  box-shadow: var(--button-shadow);
  cursor: pointer;
  transition:
    background-color var(--button-transition),
    box-shadow var(--button-transition),
    opacity var(--button-transition);
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
}

.button:hover:not(:disabled) {
  --button-bg: var(--button-bg-hover);
}

.button:active:not(:disabled) {
  --button-bg: var(--button-bg-active);
  --button-shadow: none;
}

.button:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── Variants via Component Token Override ─────────── */
.secondary {
  --button-bg:        transparent;
  --button-bg-hover:  var(--color-gray-100);
  --button-bg-active: var(--color-gray-200);
  --button-color:     var(--color-text-primary);
  --button-border:    var(--color-border-default);
  --button-shadow:    none;
}

.ghost {
  --button-bg:        transparent;
  --button-bg-hover:  var(--color-gray-100);
  --button-bg-active: var(--color-gray-200);
  --button-color:     var(--color-brand-primary);
  --button-border:    transparent;
  --button-shadow:    none;
}

.destructive {
  --button-bg:       var(--color-status-error);
  --button-bg-hover: #dc2626;
}

/* ─── Sizes ─────────────────────────────────────────── */
.sm {
  --button-padding-y:  var(--space-1);
  --button-padding-x:  var(--space-3);
  --button-font-size:  var(--font-size-xs);
  --button-radius:     var(--radius-sm);
}

.lg {
  --button-padding-y:  var(--space-3);
  --button-padding-x:  var(--space-6);
  --button-font-size:  var(--font-size-base);
  --button-radius:     var(--radius-lg);
}
```

```tsx
// components/Button/Button.tsx
import styles from './Button.module.css';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        styles.button,
        variant !== 'primary' && styles[variant],
        size !== 'md' && styles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

**Note on the variant pattern:** Using CSS custom property overrides within the module (rather than separate rule blocks per variant) keeps all color logic in one place and makes theming trivial. The dark mode override in `:root` automatically propagates through the token chain without any variant-level changes.

---

#### Phase 3: Tooling and Enforcement (Week 2, run alongside Phase 2)

**Step 6: Configure Stylelint.**

```js
// .stylelintrc.js
module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-css-modules',
  ],
  plugins: [
    'stylelint-order',
  ],
  rules: {
    // Property declaration order
    'order/properties-order': [
      'content',
      // Positioning
      'position', 'top', 'right', 'bottom', 'left', 'z-index',
      // Display and box model
      'display', 'flex', 'flex-direction', 'flex-wrap',
      'align-items', 'justify-content', 'gap',
      'grid-template-columns', 'grid-template-rows',
      'width', 'min-width', 'max-width',
      'height', 'min-height', 'max-height',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'overflow',
      // Visual
      'background', 'background-color', 'background-image',
      'border', 'border-radius',
      'box-shadow',
      'opacity',
      // Typography
      'font-family', 'font-size', 'font-weight', 'line-height',
      'color', 'text-align', 'text-decoration', 'white-space',
      // Interaction
      'cursor', 'pointer-events', 'user-select',
      // Animation
      'transition', 'animation',
    ],

    // Enforce custom property usage
    'color-no-invalid-hex': true,
    'declaration-no-important': [true, {
      severity: 'warning', // Error in component files; warning for utilities
    }],
    'selector-max-id': 0,              // No ID selectors in stylesheets
    'selector-max-specificity': '0,2,0', // Flag anything exceeding 2 classes
    'selector-max-type': [2, {         // Allow element selectors only in reset/base layers
      ignoreTypes: ['html', 'body'],
    }],
    'max-nesting-depth': 1,            // Only 1 level of nesting allowed
    'custom-property-no-missing-var-function': true,
    'color-named': 'never',            // Never use color names like 'red', 'blue'
    'number-max-precision': 4,
    'unit-allowed-list': [             // Prevent arbitrary unit usage
      'rem', 'em', 'px', '%', 'vw', 'vh', 'svh', 'fr', 'deg', 'ms', 's', 'ch',
    ],
  },
  overrides: [
    {
      files: ['**/styles/reset.css', '**/styles/typography.css'],
      rules: {
        'selector-max-type': null, // Element selectors allowed in base files
      },
    },
    {
      files: ['**/styles/utilities.css'],
      rules: {
        'declaration-no-important': null, // !important is permitted in utilities
      },
    },
  ],
};
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "lint:css": "stylelint '**/*.{css,module.css}' --allow-empty-input",
    "lint:css:fix": "stylelint '**/*.{css,module.css}' --fix"
  }
}
```

Add to CI pipeline (GitHub Actions example):

```yaml
- name: Lint CSS
  run: npm run lint:css
```

---

### Critical Decisions and Trade-offs

1. **CSS Modules over CSS-in-JS:** Vanilla Extract or Emotion would also work for this React/TypeScript stack. CSS Modules was chosen because it has zero runtime cost, native Next.js support without configuration, and lower cognitive overhead for a team that already uses it inconsistently. Emotion was rejected because its SSR setup adds complexity and it has a ~7KB runtime bundle cost. Vanilla Extract was considered but the team's CSS-in-TypeScript learning curve was deemed higher risk given the timeline.

2. **`@layer` for Bootstrap isolation over a complete removal:** Removing Bootstrap 4 immediately would require rewriting all 40+ components that use its grid, form, and utility classes. The `@layer` approach allows the team to remove Bootstrap incrementally over 6--8 weeks as components are replaced, while the new architecture takes effect immediately for all new code.

3. **CSS custom properties over Sass variables for tokens:** Sass variables are compile-time constants and do not work for runtime theming (dark mode, user preference). CSS custom properties are runtime values, enabling dark mode via a single `[data-theme]` attribute change. The trade-off: custom properties cannot be used inside `@media` queries (breakpoints still require Sass variables or `@custom-media`).

4. **3-tier token structure over flat tokens:** A flat token structure (`--blue-button-background: #3b82f6`) is simpler initially but requires duplicating values across components and makes global changes (brand color update) require touching every component. The 3-tier structure requires more upfront design but makes global changes single-touch.

---

### Maintenance Guidelines

These are enforced conventions. Violations must be caught in code review or by Stylelint:

1. All new components must have a `.module.css` file. No new styles may be added to `globals.css` except tokens and base element styles.
2. Every color, spacing, and font value in a `.module.css` file must reference a CSS custom property. No raw hex codes, pixel values for spacing, or hardcoded font families.
3. Bootstrap classes must not be added to any new component. If a Bootstrap utility is needed, use the equivalent semantic token or add a utility class to `styles/utilities.css`.
4. The `styles/tokens.css` file is the single source of truth for design values. If Figma updates a token, update `tokens.css` first, then verify all components that use that token render correctly.
5. PR checklist item: "Does this component introduce any magic number values?" is required on every CSS-related PR.
6. Run `npm run lint:css` before every PR. The CI check is non-negotiable and will block merges.
7. Component tokens (Tier 3) defined in `.module.css` files must not be referenced by other component files. They are local to that component. Cross-component token dependencies must be elevated to Tier 2 in `tokens.css`.
