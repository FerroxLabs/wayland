---
name: html-semantics
description: |
  Guides expert-level html semantics implementation: html-css and web-development decision frameworks, production-ready patterns, and concrete templates for html semantics workflows.
  Use when the user asks about html semantics, html semantics configuration, or html-css best practices for html projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "html-css web-development accessibility"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# HTML Semantics

## When to Use

**Use this skill when:**
- User asks which HTML element to use for a specific piece of content (e.g., "should I use `<div>` or `<article>` for my blog post?")
- User wants to audit an existing page for semantic correctness and accessibility compliance
- User is building a document outline and needs guidance on heading hierarchy, landmark regions, and sectioning content
- User asks how to mark up interactive UI components (navigation menus, tabs, accordions, modals) correctly with HTML and ARIA
- User needs to improve screen reader compatibility or pass WCAG 2.1 AA compliance audits
- User is implementing structured data or wants search engines to better understand page content
- User asks about the difference between presentational and semantic HTML, or wants to migrate away from div/span soup
- User is building a design system and needs to establish semantic HTML conventions for components

**Do NOT use this skill when:**
- User needs CSS layout help (use a CSS layout skill -- semantic HTML and visual layout are separate concerns)
- User is asking about JavaScript DOM manipulation, event handling, or dynamic content updates
- User needs help with HTML form validation logic or form submission handling
- User is asking about HTTP, server-side rendering frameworks, or templating engines -- semantics is the output, not the generation
- User needs structured data (JSON-LD, microdata) guidance beyond HTML element selection -- that is a separate SEO/schema skill
- User is asking about Web Components, Shadow DOM, or custom elements -- those have their own scope
- User needs help with HTML email markup -- email clients have entirely different semantic rules

---

## Process

### 1. Identify the Content Model

Before selecting any element, classify the content by asking: what IS this content, not what should it LOOK like.

- **Document content types:** prose, navigation, supplementary, figure, time-sensitive, tabular, interactive, form, media
- Map user-provided HTML or a description of content onto the four HTML5 content categories that control element nesting validity: **flow content**, **phrasing content**, **sectioning content**, and **interactive content**
- Ask whether the content has meaning independent of its surrounding context (use a sectioning element) or only derives meaning from context (use a grouping or text-level element)
- Identify whether the content is the main subject of the page, a related aside, or structural chrome -- this determines the landmark region
- Do NOT start with layout needs. A sidebar that is visually on the right is not automatically an `<aside>` -- it is an `<aside>` only if the content is tangentially related to the main content

### 2. Map Landmark Regions

Every page must have a clear, non-overlapping set of landmark regions. These are the top-level semantic scaffold.

- Use exactly ONE `<main>` per page -- it wraps the primary content, never navigation or footers
- Use `<header>` for the site-wide banner at the top; it can also appear inside `<article>`, `<section>`, `<aside>`, or `<nav>` as a section-level header
- Use `<footer>` for copyright, contact links, legal notices -- also nestable inside sectioning elements
- Use `<nav>` for ALL primary and secondary navigation -- label multiple `<nav>` elements with `aria-label` (e.g., `aria-label="Primary"`, `aria-label="Breadcrumb"`)
- Use `<aside>` for complementary content: related links sidebars, pull quotes, author bio boxes, advertisements -- content that makes sense even when separated from the main flow
- If a page has more than one `<header>`, `<footer>`, or `<nav>`, every instance except the main site-level one must have a unique `aria-label` or `aria-labelledby`
- Validate landmark coverage with the axe DevTools browser extension or Deque's accessibility checker -- all content should be reachable from a landmark

### 3. Build the Document Outline with Heading Hierarchy

The heading structure must function as a table of contents that makes sense read in sequence.

- `<h1>` represents the page title -- use exactly ONE per page (two in single-page applications where a modal has its own `<h1>` is acceptable but must be managed with `aria-modal`)
- Never skip heading levels: do not jump from `<h2>` to `<h4>`. If a heading looks too large, change the CSS, not the heading level
- Each sectioning element (`<article>`, `<section>`, `<aside>`, `<nav>`) should begin with a heading that labels it -- if you do not want a visible heading, use `.visually-hidden` CSS class (position: absolute; clip: rect(0,0,0,0); not display:none which removes it from the accessibility tree)
- `<section>` requires an accessible name to be meaningful -- apply `aria-labelledby` pointing to its heading `id`, or `aria-label` if no heading is present
- Use a heading map tool (HeadingMap browser extension, or `document.querySelectorAll('h1,h2,h3,h4,h5,h6')` in console) to audit the outline before shipping
- Decorative headings used purely for visual chunking that have no document outline meaning should be styled `<div>` or `<p>` elements, not headings

### 4. Select Sectioning and Grouping Elements

Match each content block to its correct semantic container using these decision rules:

- **`<article>`**: Self-contained, independently distributable content. Blog posts, news articles, product cards, comments, social media posts, forum threads. Ask: "Could this be syndicated via RSS and make sense on its own?" If yes -- `<article>`.
- **`<section>`**: A thematic grouping within a larger document. A chapter, a major tab panel content area, a homepage zone (hero, features, testimonials). `<section>` implies the content is part of the surrounding whole. If you cannot name it, it should probably be a `<div>`.
- **`<div>`**: A non-semantic grouping element for styling and scripting hooks. Use it when no semantic element fits. Prefer a semantic element every time one exists. A `<div>` with a role attribute is almost always inferior to using the correct semantic element.
- **`<p>`**: A paragraph -- prose content. Do NOT wrap block-level elements inside `<p>` (this is a parse error). Do NOT use `<p>` as a spacing tool.
- **`<figure>` + `<figcaption>`**: Any content that is referenced from the main text and could be moved to an appendix -- images with captions, code examples, charts, diagrams, embedded videos. `<figcaption>` must be the first or last child of `<figure>`.
- **`<details>` + `<summary>`**: Native disclosure widget. Use for FAQs, expandable sections. No JavaScript required for show/hide. The `<summary>` is the visible label when collapsed.
- **`<blockquote>` + `<cite>`**: Extended quotations from external sources. `cite` attribute on `<blockquote>` takes a URL; `<cite>` element wraps the title of the work. Do NOT use `<blockquote>` for visual indentation.

### 5. Apply Text-Level Semantics Correctly

Text-level elements carry meaning that screen readers and search engines interpret:

- **`<strong>`**: Strong importance, seriousness, or urgency. Screen readers may announce with emphasis. Do NOT use for general bold styling -- use CSS `font-weight` on a `<span>` instead.
- **`<em>`**: Stress emphasis that changes meaning ("I *never* said that"). Different from `<strong>`. Do NOT use for italic styling -- use CSS `font-style` on a `<span>`.
- **`<b>`**: Stylistically offset text without extra importance -- keywords in a document, product names in a review. A semantic compromise when neither `<strong>` nor a descriptive element fits.
- **`<i>`**: Alternative voice or mood -- technical terms, foreign phrases, thoughts in narrative. Not just "italic text".
- **`<mark>`**: Highlighted text for reference purposes -- search result matches, code annotations. Adds `role="mark"` accessibility semantics in most browsers.
- **`<abbr title="...">`: Abbreviations and acronyms. The `title` attribute provides the expansion. Use on first occurrence in a document.
- **`<time datetime="YYYY-MM-DD">`**: Machine-readable dates and times. The `datetime` attribute must use ISO 8601 format. Enables calendar integration and search engine temporal understanding.
- **`<code>`**: Inline code. Wrap with `<pre>` for block code. `<kbd>` for user keyboard input. `<samp>` for sample output. `<var>` for variables.
- **`<del>` and `<ins>`**: Content that has been removed or added. Use `datetime` and `cite` attributes. Screen readers announce these as deleted/inserted.
- NEVER use `<br>` for spacing between paragraphs -- use CSS margin. `<br>` is valid only for line breaks that are part of content (poetry, addresses).

### 6. Mark Up Interactive Components with ARIA Patterns

When native HTML elements cannot express the required widget semantics, augment with WAI-ARIA:

- Follow the **ARIA Authoring Practices Guide (APG)** pattern for each widget type. The APG defines keyboard interaction, required roles, states, and properties.
- **Tabs**: `role="tablist"` on container, `role="tab"` on each tab, `role="tabpanel"` on each panel. Selected tab has `aria-selected="true"`. Panels have `aria-labelledby` pointing to their tab.
- **Accordions**: Use `<button>` for the trigger (not `<div>` or `<a>`). `aria-expanded="true|false"` on the button. `aria-controls` pointing to the panel `id`.
- **Modals/Dialogs**: `role="dialog"` with `aria-modal="true"` and `aria-labelledby` pointing to the dialog title. Focus must be trapped within the dialog while open. Return focus to the trigger on close.
- **Alerts/Status messages**: `role="alert"` for urgent messages (announces immediately). `role="status"` for non-urgent updates (polite announcement). Both are live regions.
- The ARIA hierarchy rule: **1st -- use native HTML element; 2nd -- use native HTML with modified semantics; 3rd -- use ARIA role**. Never add ARIA that conflicts with native semantics (e.g., `<button role="link">` is incorrect).
- Always test ARIA patterns with at least two screen readers: NVDA + Firefox on Windows, and VoiceOver + Safari on macOS/iOS.

### 7. Validate and Audit

Semantic HTML must be verified against multiple quality signals:

- **HTML validity**: Run through the W3C Nu Html Checker (validator.w3.org/nu). Zero errors is the standard. Warnings about lacking charset or lang are blocking issues.
- **Accessibility tree audit**: In Chrome DevTools, open the Accessibility panel and inspect each element's computed role, name, and state. Every interactive element must have a computed accessible name.
- **Automated accessibility**: Run axe-core (via browser extension or `axe.run()` in test suite). Aim for zero violations. axe catches ~57% of WCAG 2.1 issues automatically.
- **Manual keyboard test**: Tab through the entire page without a mouse. Every interactive element must be reachable. Focus order must match visual reading order. No focus traps except intentional modal traps.
- **Screen reader test**: Use NVDA on Firefox (free) and VoiceOver on Safari. Navigate by headings (H key in NVDA), by landmarks (D key), and by form elements (F key). All content must be announced correctly.
- **Contrast and zoom**: Text must meet 4.5:1 contrast ratio for normal text (3:1 for large text at 18px/14px bold). Page must be usable at 200% browser zoom without horizontal scrolling.

---

## Output Format

When helping a user implement HTML semantics, produce output in this structure:

```
## Semantic HTML Analysis

### Page/Component: [Name]

#### Landmark Structure
| Role          | Element     | Accessible Name Source     | Notes                          |
|---------------|-------------|----------------------------|--------------------------------|
| banner        | <header>    | (implicit -- no label needed) | Site-wide header              |
| navigation    | <nav>       | aria-label="Primary"       | Main nav with skip link target |
| main          | <main>      | (implicit)                 | One per page                   |
| complementary | <aside>     | aria-labelledby="sidebar-h"| Related posts sidebar          |
| contentinfo   | <footer>    | (implicit)                 | Site-wide footer               |

#### Heading Outline
h1: [Page Title]
  h2: [Section One]
    h3: [Subsection A]
    h3: [Subsection B]
  h2: [Section Two]
    h3: [Subsection C]

#### Element Selection Rationale
| Content Block        | Chosen Element         | Rejected Alternative  | Reason                              |
|----------------------|------------------------|-----------------------|-------------------------------------|
| Blog post container  | <article>              | <section>             | Independently distributable         |
| Author bio           | <aside>                | <div>                 | Tangentially related to post        |
| Published date       | <time datetime="...">  | <span>                | Machine-readable temporal data      |
| Expandable FAQ item  | <details>/<summary>    | <div> + JavaScript    | Native disclosure semantics         |

#### Corrected HTML
```html
[Full corrected markup here]
```

#### Accessibility Checklist
- [ ] Single <h1> present and descriptive
- [ ] No heading levels skipped
- [ ] All <nav> elements have unique accessible names
- [ ] <main> landmark present
- [ ] All images have meaningful alt text or alt="" if decorative
- [ ] All interactive elements reachable by keyboard
- [ ] Focus order matches visual order
- [ ] No content relies on color alone to convey meaning
- [ ] ARIA roles do not conflict with native element semantics
- [ ] Page language declared: <html lang="en">

#### Validation Commands
```bash
# Run axe-core in browser console
const axe = await import('https://cdn.jsdelivr.net/npm/axe-core/axe.min.js');
axe.run().then(r => console.table(r.violations));

# W3C validator via CLI (vnu.jar)
java -jar vnu.jar --format json index.html
```
```

---

## Rules

1. **Never use `<div>` or `<span>` when a semantic element exists that fits.** `<div>` is the element of last resort for grouping. Before placing a `<div>`, cycle through `<article>`, `<section>`, `<aside>`, `<figure>`, `<details>`, `<header>`, `<footer>`, `<main>`, `<nav>`. Only if none fit, use `<div>`.

2. **Never choose an element based on its default visual appearance.** `<h3>` is not "medium bold text". `<blockquote>` is not "indented text". `<table>` is not "a grid layout tool". The choice is always based on meaning. CSS handles appearance.

3. **Never use heading elements (`<h1>` -- `<h6>`) for non-heading text.** Section headings only. Taglines, captions, labels, and descriptions that are not the heading of a section must use `<p>`, `<span>`, `<label>`, `<legend>`, or `<caption>` as appropriate.

4. **Never skip heading levels.** An `<h4>` must always appear inside a section that contains an `<h3>`. If you need a visually smaller heading, use CSS `font-size` on the semantically correct heading level. Heading level = document hierarchy position, not font size.

5. **Never add `role="presentation"` or `role="none"` to interactive elements.** This removes the element from the accessibility tree entirely. Only apply these roles to purely decorative elements with zero interactive function and no content value.

6. **Never label landmarks or elements with redundant role names.** `aria-label="Navigation navigation"` or `aria-label="Main navigation navigation bar"` is noise. The label should be the unique name, not a description including the role. Screen readers already announce the role. Use `aria-label="Primary"` not `aria-label="Primary navigation"`.

7. **Never use `<table>` for visual layout.** HTML tables are for tabular data -- rows and columns with headers that describe the relationship between data cells. Layout must use CSS Grid or Flexbox. A layout table breaks screen reader navigation and announces spurious table semantics.

8. **Always declare the page language.** `<html lang="en">` (or appropriate BCP 47 language tag) is mandatory. Screen readers use this to select the correct text-to-speech voice engine. Missing or wrong language tag causes garbled pronunciation. For multilingual pages, use `lang` attribute on individual elements where the language changes.

9. **Always include a skip navigation link as the first focusable element on the page.** `<a href="#main-content" class="skip-link">Skip to main content</a>`. This is the minimum WCAG 2.4.1 bypass blocks requirement and critically improves keyboard-only UX.

10. **Never put block-level elements inside phrasing content containers.** Putting `<div>`, `<p>`, `<ul>`, `<table>`, or any block element inside `<p>`, `<span>`, `<a>`, `<button>`, or other phrasing containers is a parse error. Browsers silently fix these in inconsistent ways that break the DOM and accessibility tree.

11. **Always give images a meaningful `alt` attribute -- never omit it.** An image with no `alt` attribute causes screen readers to read the file path. Decorative images get `alt=""` (empty string, not omitted). Images that convey information get a description of that information. Images that are links get `alt` text describing the destination, not the image.

12. **Never rely on placeholder text as a form label.** `placeholder` is not a `<label>`. Placeholders disappear on input, have poor contrast, and are not consistently announced. Every input must have an associated `<label>` (via `for`/`id` pairing or wrapping) or `aria-label` or `aria-labelledby`.

---

## Edge Cases

### Complex Navigation with Multiple Nav Elements
A page may have a primary site nav, a breadcrumb trail, a table of contents, and pagination controls. All are `<nav>` elements and all are valid. The problem: NVDA and VoiceOver list all landmarks in a panel, and four unlabeled `<nav>` entries are unusable. Solution: apply unique `aria-label` to every `<nav>`: `aria-label="Primary"`, `aria-label="Breadcrumb"`, `aria-label="Table of contents"`, `aria-label="Pagination"`. For the breadcrumb, also add `aria-current="page"` to the last `<li>` item representing the current page. The breadcrumb `<ol>` (ordered list) communicates hierarchy more accurately than `<ul>` (unordered list).

### Interactive Cards with Multiple Clickable Elements
A product card has an image, a title, a description, a price, and two buttons ("Add to cart" and "View details"). The entire card is also visually clickable. Solutions ranked by correctness: **(1)** Make the card title an `<a>` link, style the entire card to appear clickable via CSS `:focus-within`, do NOT wrap the whole card in `<a>` because nested interactive elements are invalid. **(2)** If the card must be one interaction unit, use a single `<a>` on the heading, add `aria-label="View details for [product name]"` to secondary button, and suppress the description from the tab order using a carefully placed visually-hidden span to extend the link's accessible name. **(3)** Never use `onclick` on a `<div>` to make the entire card "clickable" -- this is keyboard-inaccessible without `tabindex` and a `role`, and even then inferior to native elements.

### `<section>` vs. `<article>` for Repeated Components
In a news feed, each item could be `<article>` (independently publishable news items -- correct) or `<section>` (grouped items -- wrong). Comments on a blog post: each comment is `<article>` (user-generated, self-contained content). In a page with feature blocks (icon + heading + paragraph repeated three times): these are NOT `<article>` (not independently distributable) and technically borderline `<section>`. If each feature block cannot be labeled with a meaningful heading, prefer `<div>` -- a `<section>` without an accessible name is a WCAG advisory failure. If they do have headings, `<section>` with `aria-labelledby` pointing to the heading is appropriate.

### Resolving Ambiguous Use of `<aside>`
An `<aside>` is frequently misused as "right column" regardless of content relationship. Correct uses: author bio box in an article, related articles list, advertising, pull quotes, glossary sidebar. Incorrect uses: a secondary navigation sidebar (use `<nav>` inside a `<div>`), a content column in a two-column layout (use CSS Grid with semantic containers), a list of page subsections that is the primary content navigation for that page. Test: "If I removed this `<aside>` from the page, does the main content still make complete sense?" If yes -- `<aside>` is appropriate. If removing it breaks the page flow -- it is not `<aside>`.

### Screen Reader Announcement of Dynamic Content
Content injected via JavaScript after page load (search results, form error messages, loading spinners) does not trigger a re-read automatically. Use ARIA live regions to announce changes: `aria-live="polite"` for non-urgent updates (search results loading -- announce when complete), `aria-live="assertive"` for urgent messages (form submission error -- announce immediately). Add the live region container to the DOM on page load with empty content -- do NOT inject the live region dynamically, as some screen readers miss dynamically added live regions. Update the text content of the pre-existing live region to trigger announcement. `role="alert"` is equivalent to `aria-live="assertive" aria-atomic="true"` and appropriate for error messages.

### Table Markup for Complex Data Grids
Simple tables: `<table>` with `<thead>`, `<tbody>`, `<tfoot>`, `<th scope="col">` for column headers, `<th scope="row">` for row headers. Complex tables with merged cells or multi-level headers require `id` on each header cell and `headers="id1 id2"` attribute on each data cell referencing all applicable headers. Tables must have a `<caption>` as the first child of `<table>` -- this is the table's accessible name and appears above it visually. Do NOT use `aria-label` instead of `<caption>`. For large data tables with sortable columns, add `aria-sort="ascending|descending|none"` to the active sort header. If a table has more than 5 columns, provide a summary in `<caption>` or via `aria-describedby` pointing to a paragraph that describes the table structure.

### SVG and Icon Semantics
Inline SVG used as meaningful images: add `role="img"` and `aria-label="[description]"` to the `<svg>` element. Add `<title>` as first child of `<svg>` and link it with `aria-labelledby`: `<svg aria-labelledby="icon-title" role="img"><title id="icon-title">Search</title>...</svg>`. SVG used as decorative icon: add `aria-hidden="true"` to the `<svg>` element to prevent screen readers from traversing it. Icon fonts (Font Awesome, etc.): add `aria-hidden="true"` to the icon element; if the icon is inside a `<button>` or `<a>` with no text, the button/link must have its own `aria-label`. Never rely on the Unicode character name or CSS pseudo-element content to provide accessible text.

---

## Example

**Input:** "I have this HTML for a blog article page and I need to fix the semantics. Here's the structure:"

```html
<div class="header">
  <div class="logo">TechBlog</div>
  <div class="nav">
    <a href="/">Home</a>
    <a href="/articles">Articles</a>
    <a href="/about">About</a>
  </div>
</div>
<div class="content">
  <div class="main-article">
    <div class="title">
      <h3>Understanding Async/Await in JavaScript</h3>
    </div>
    <div class="meta">
      <span>By Jane Smith</span>
      <span>Published: December 15, 2024</span>
    </div>
    <div class="article-body">
      <p>Async/await is syntactic sugar over Promises...</p>
      <div class="note"><b>Important:</b> Always handle errors in async functions.</div>
      <div class="code-block">
        async function fetchData(url) {
          const response = await fetch(url);
          return response.json();
        }
      </div>
    </div>
    <div class="author-box">
      <img src="jane.jpg">
      <div class="author-bio">Jane Smith is a senior engineer at...</div>
    </div>
  </div>
  <div class="sidebar">
    <div class="related">
      <div class="related-title">Related Articles</div>
      <div><a href="/promises">Understanding Promises</a></div>
      <div><a href="/generators">JavaScript Generators</a></div>
    </div>
  </div>
</div>
<div class="footer">
  <span>© 2024 TechBlog. All rights reserved.</span>
</div>
```

---

**Output:**

## Semantic HTML Analysis

### Page/Component: Blog Article -- "Understanding Async/Await in JavaScript"

#### Issues Found

| Issue | Severity | WCAG Criterion |
|---|---|---|
| `<h3>` used as only/first heading -- h1 missing | Critical | 1.3.1 Info and Relationships |
| All landmark regions using `<div>` | Critical | 1.3.6 Identify Purpose |
| `<img>` missing `alt` attribute | Critical | 1.1.1 Non-text Content |
| Navigation not wrapped in `<nav>` | Serious | 1.3.1 |
| Published date not machine-readable | Moderate | 1.3.1 |
| Code block not in `<pre><code>` | Moderate | 1.3.1 |
| Related articles is a list, not bare divs | Moderate | 1.3.1 |
| `<b>Important:</b>` should be `<strong>` | Minor | 1.3.1 |
| Author box semantically disconnected from article | Minor | 1.3.1 |
| No skip navigation link | Serious | 2.4.1 Bypass Blocks |
| `<html lang>` not shown -- must be present | Critical | 3.1.1 Language of Page |

#### Landmark Structure (Corrected)
| Role | Element | Accessible Name | Notes |
|---|---|---|---|
| banner | `<header>` | (implicit) | Site-wide -- wraps logo + nav |
| navigation | `<nav>` | aria-label="Primary" | Inside `<header>` |
| main | `<main>` | (implicit) | Wraps article + sidebar |
| contentinfo | `<footer>` | (implicit) | Site-wide footer |

Note: the sidebar `<aside>` is nested inside `<main>` -- this is valid and expected. The `<aside>` in this case contains "Related Articles" which is tangentially related content.

#### Heading Outline (Corrected)
```
h1: Understanding Async/Await in JavaScript  (article title)
  h2: Related Articles  (sidebar section label -- visually hidden acceptable)
```

#### Element Selection Rationale
| Content Block | Chosen Element | Rejected | Reason |
|---|---|---|---|
| Page wrapper for post | `<article>` | `<div class="main-article">` | Self-contained, syndicatable blog post |
| Article title | `<h1>` | `<h3>` | First and only heading -- must be h1 |
| Published date | `<time datetime="2024-12-15">` | `<span>` | Machine-readable ISO date for SEO + AT |
| Author bio box | `<aside>` inside `<article>` | `<div class="author-box">` | Supplementary to the article content |
| Author photo | `<img alt="Jane Smith">` | `<img>` with no alt | Meaningful image -- person identity |
| Important note | `<p>` with `<strong>` | `<div>` with `<b>` | `<strong>` = importance; `<div>` invalid inside flow as anonymous wrapper |
| Code sample | `<pre><code>` | `<div class="code-block">` | `<pre>` preserves whitespace; `<code>` = code semantics |
| Related articles | `<ul>` with `<li>` | bare `<div>` per link | List semantics -- AT announces item count |
| Nav links | `<nav>` with `<ul>` | `<div class="nav">` | Landmark + list semantics for navigation |

#### Corrected HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Understanding Async/Await in JavaScript -- TechBlog</title>
</head>
<body>

  <!-- Skip navigation: first focusable element on the page -->
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <header>
    <a href="/" aria-label="TechBlog -- home">
      <span aria-hidden="true">TechBlog</span>
    </a>
    <nav aria-label="Primary">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/articles">Articles</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  </header>

  <main id="main-content">

    <article>
      <header>
        <h1>Understanding Async/Await in JavaScript</h1>
        <p>
          By <span rel="author">Jane Smith</span> --
          Published: <time datetime="2024-12-15">December 15, 2024</time>
        </p>
      </header>

      <p>Async/await is syntactic sugar over Promises...</p>

      <p>
        <strong>Important:</strong> Always handle errors in async functions.
      </p>

      <figure>
        <figcaption>Example: basic async function using fetch</figcaption>
        <pre><code>async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}</code></pre>
      </figure>

      <aside aria-labelledby="author-heading">
        <h2 id="author-heading">About the Author</h2>
        <img src="jane.jpg" alt="Jane Smith" width="80" height="80">
        <p>Jane Smith is a senior engineer at...</p>
      </aside>

    </article>

    <aside aria-labelledby="related-heading">
      <h2 id="related-heading">Related Articles</h2>
      <ul>
        <li><a href="/promises">Understanding Promises</a></li>
        <li><a href="/generators">JavaScript Generators</a></li>
      </ul>
    </aside>

  </main>

  <footer>
    <p><small>© 2024 TechBlog. All rights reserved.</small></p>
  </footer>

</body>
</html>
```

#### Key Changes Explained

**`<h3>` → `<h1>`**: The article title is the primary heading of the page. Using `<h3>` means screen reader users navigating by headings hear "heading level 3" with no h1 or h2 above it -- implying they are deep in a document hierarchy that does not exist.

**`<div class="nav">` → `<nav aria-label="Primary"><ul>...</ul></nav>`**: Screen readers provide shortcut keys to jump to navigation landmarks. Without `<nav>`, keyboard users cannot skip to or past the navigation. The `<ul>` inside communicates that these are list items -- NVDA announces "list of 3 items" which helps users gauge the nav size.

**`<span>Published: December 15, 2024</span>` → `<time datetime="2024-12-15">`**: Google Search uses `<time>` to extract publication dates for article rich results. The `datetime` attribute provides an unambiguous ISO 8601 date regardless of how it is displayed (localized, relative, etc.).

**`<div class="code-block">` → `<figure><figcaption>...<pre><code>`**: `<pre>` preserves the indentation and whitespace that is semantically meaningful in code. `<code>` marks the content as computer code. `<figure>` with `<figcaption>` gives the sample an accessible description and places it as a referenceable content block.

**`<img src="jane.jpg">` → `<img src="jane.jpg" alt="Jane Smith">`**: The missing `alt` attribute causes NVDA to read the full file path "jane dot jpg" which conveys no useful information. Alt text "Jane Smith" identifies the person depicted.

#### Accessibility Checklist
- [x] Single `<h1>` present and descriptive
- [x] No heading levels skipped (h1 → h2 only)
- [x] All `<nav>` elements have unique accessible names
- [x] `<main>` landmark present with `id` for skip link target
- [x] All images have meaningful `alt` text
- [x] All interactive elements reachable by keyboard (native elements used throughout)
- [x] Skip navigation link is first focusable element
- [x] `<html lang="en">` declared
- [x] ARIA roles not needed -- native elements carry all required semantics
- [x] `<article>` heading restarts at `<h1>` for the article, `<h2>` for nested sections

#### Validation Commands
```bash
# axe-core in browser console (paste after loading the page)
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/axe-core/axe.min.js';
document.head.appendChild(script);
script.onload = () => axe.run().then(r => {
  console.log('Violations:', r.violations.length);
  r.violations.forEach(v => console.warn(v.id, v.description, v.nodes));
});

# W3C Nu validator (requires vnu.jar download)
java -jar vnu.jar --format text --also-check-css article.html

# Heading map audit in browser console
[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
  .map(h => `${'  '.repeat(parseInt(h.tagName[1])-1)}${h.tagName}: ${h.textContent.trim()}`)
  .join('\n');
```
