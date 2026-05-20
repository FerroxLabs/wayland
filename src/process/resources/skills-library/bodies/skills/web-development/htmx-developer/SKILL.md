---
name: htmx-developer
description: |
  HTMX development expertise covering hypermedia-driven application patterns, progressive enhancement, server-side rendering integration, HTMX attributes and extensions, partial page updates, form handling, real-time features, and migration from SPA frameworks.
  Use when the user asks about htmx developer, htmx developer best practices, or needs guidance on htmx developer implementation.
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

# HTMX Developer

You are an expert in building hypermedia-driven applications with HTMX. HTMX returns to the original architecture of the web -- the server sends HTML, not JSON -- but with modern UX expectations like partial page updates, inline editing, and real-time features. The result is dramatically simpler applications: no JavaScript framework, no build step, no client-side state management, and a fraction of the code.

## When HTMX is the Right Choice

### Decision Framework

```
HTMX is ideal when:
  ✓ Content-focused applications (dashboards, admin panels, CMS, e-commerce)
  ✓ CRUD-heavy workflows (forms, tables, lists)
  ✓ Server-rendered applications that need dynamic UX upgrades
  ✓ Small teams that want to move fast without frontend complexity
  ✓ Progressive enhancement matters (works without JS, better with JS)

HTMX is NOT ideal when:
  ✗ Rich client-side interactivity (drawing tools, spreadsheets, IDEs)
  ✗ Offline-first applications (HTMX requires server connectivity)
  ✗ Complex client-side state (drag-and-drop reordering, real-time collaboration)
  ✗ Native mobile apps (no HTML rendering)
```

### HTMX vs SPA Frameworks

| Aspect | HTMX | React/Vue/Svelte |
|--------|------|------------------|
| **Server sends** | HTML fragments | JSON data |
| **Rendering** | Server-side | Client-side |
| **State management** | Server (session/DB) | Client (Redux/Zustand) |
| **JavaScript needed** | Minimal (HTMX + extensions) | Significant (framework + deps) |
| **Build step** | None required | Required (Webpack/Vite) |
| **SEO** | Built-in (server-rendered) | Requires SSR/SSG setup |
| **Learning curve** | HTML attributes | Framework + ecosystem |
| **Bundle size** | ~14KB (HTMX) | 50-200KB+ (framework + deps) |
| **Offline support** | Limited | Good (with service worker) |
| **Rich interactivity** | Good for most apps | Excellent |

## Core HTMX Patterns

### Basic Attributes

```html
<!-- GET request, replace inner content -->
<button hx-get="/api/users" hx-target="#user-list" hx-swap="innerHTML">
  Load Users
</button>
<div id="user-list"><!-- Users will appear here --></div>

<!-- POST request with form data -->
<form hx-post="/api/users" hx-target="#user-list" hx-swap="afterbegin">
  <input name="email" type="email" required>
  <button type="submit">Add User</button>
</form>

<!-- DELETE with confirmation -->
<button hx-delete="/api/users/123"
        hx-confirm="Are you sure?"
        hx-target="closest tr"
        hx-swap="outerHTML swap:500ms">
  Delete
</button>

<!-- PUT for inline editing -->
<div hx-get="/api/users/123/edit" hx-trigger="click" hx-swap="outerHTML">
  Click to edit: John Doe
</div>
```

### Swap Strategies

| Strategy | Behavior | Use Case |
|----------|----------|----------|
| `innerHTML` | Replace children of target | Update a list, refresh a section |
| `outerHTML` | Replace the entire target | Replace an element with an edited version |
| `afterbegin` | Prepend inside target | Add item to top of list |
| `beforeend` | Append inside target | Add item to bottom of list |
| `beforebegin` | Insert before target | Add a row above |
| `afterend` | Insert after target | Add a row below |
| `delete` | Delete the target | Remove an element |
| `none` | Don't swap (still fires events) | Trigger side effects only |

### Trigger Patterns

```html
<!-- Standard triggers -->
<input hx-get="/search" hx-trigger="keyup changed delay:300ms" hx-target="#results">

<!-- Revealed trigger (lazy loading) -->
<div hx-get="/api/comments?page=2" hx-trigger="revealed" hx-swap="afterend">
  Loading more comments...
</div>

<!-- Intersection observer (more control than revealed) -->
<div hx-get="/api/feed/next" hx-trigger="intersect once threshold:0.5">
  Loading...
</div>

<!-- Polling -->
<div hx-get="/api/notifications/count" hx-trigger="every 30s">
  0 notifications
</div>

<!-- Server-sent events -->
<div hx-ext="sse" sse-connect="/api/events" sse-swap="message">
  Waiting for updates...
</div>

<!-- Load trigger (fires on page load) -->
<div hx-get="/api/dashboard/stats" hx-trigger="load">
  Loading stats...
</div>

<!-- Custom events -->
<div hx-get="/api/cart" hx-trigger="cart-updated from:body">
  Cart contents here
</div>
```

## Server-Side Integration

### Response Patterns

The server returns HTML fragments, not full pages.

```python
# Python (Flask) example
@app.route('/api/users', methods=['GET'])
def list_users():
    users = User.query.all()
    # Return ONLY the HTML fragment, not a full page
    return render_template('partials/user-list.html', users=users)

@app.route('/api/users', methods=['POST'])
def create_user():
    user = User(email=request.form['email'])
    db.session.add(user)
    db.session.commit()
    # Return the new row to be inserted
    return render_template('partials/user-row.html', user=user)

@app.route('/api/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    User.query.get_or_404(id).delete()
    db.session.commit()
    # Return empty string - htmx will remove the target element
    return ''
```

```go
// Go (net/http) example
func handleSearch(w http.ResponseWriter, r *http.Request) {
    query := r.URL.Query().Get("q")
    results := searchProducts(query)

    // Check if this is an HTMX request
    if r.Header.Get("HX-Request") == "true" {
        // Return only the results fragment
        tmpl.ExecuteTemplate(w, "search-results", results)
        return
    }
    // Full page for non-HTMX requests (progressive enhancement)
    tmpl.ExecuteTemplate(w, "search-page", results)
}
```

### Response Headers

```python
from flask import make_response

@app.route('/api/users', methods=['POST'])
def create_user():
    user = create_user_from_form(request.form)
    response = make_response(render_template('partials/user-row.html', user=user))

    # Retarget: supersede hx-target from the client
    response.headers['HX-Retarget'] = '#user-table tbody'

    # Reswap: supersede hx-swap strategy
    response.headers['HX-Reswap'] = 'afterbegin'

    # Trigger: fire a client-side event
    response.headers['HX-Trigger'] = 'showToast'
    # Or with data:
    response.headers['HX-Trigger'] = json.dumps({
        'showToast': {'message': 'User created', 'type': 'success'}
    })

    # Redirect: full page navigation
    # response.headers['HX-Redirect'] = '/users'

    # Push URL: update browser URL bar without full navigation
    response.headers['HX-Push-Url'] = f'/users/{user.id}'

    return response
```

## Common Application Patterns

### Search with Debounce

```html
<input type="search"
       name="q"
       placeholder="Search products..."
       hx-get="/search"
       hx-trigger="input changed delay:300ms, search"
       hx-target="#search-results"
       hx-indicator="#search-spinner">

<span id="search-spinner" class="htmx-indicator">Searching...</span>
<div id="search-results"></div>
```

### Infinite Scroll

```html
<!-- Server returns rows + a new sentinel at the bottom -->
<table id="users-table">
  <tbody>
    <tr><td>User 1</td></tr>
    <tr><td>User 2</td></tr>
    <!-- ... more rows ... -->

    <!-- Sentinel row: loads next page when visible -->
    <tr hx-get="/api/users?page=2"
        hx-trigger="revealed"
        hx-swap="outerHTML"
        hx-select="tbody > tr">
      <td>Loading more...</td>
    </tr>
  </tbody>
</table>
```

### Click-to-Edit Pattern

```html
<!-- View mode -->
<div id="user-123" hx-get="/api/users/123/edit" hx-trigger="click" hx-swap="outerHTML">
  <strong>John Doe</strong>
  <span>john@example.com</span>
  <small>(click to edit)</small>
</div>

<!-- Edit mode (returned by GET /api/users/123/edit) -->
<form id="user-123" hx-put="/api/users/123" hx-swap="outerHTML">
  <input name="name" value="John Doe">
  <input name="email" value="john@example.com">
  <button type="submit">Save</button>
  <button hx-get="/api/users/123" hx-swap="outerHTML" hx-target="#user-123">Cancel</button>
</form>

<!-- After save (returned by PUT /api/users/123) - back to view mode -->
<div id="user-123" hx-get="/api/users/123/edit" hx-trigger="click" hx-swap="outerHTML">
  <strong>John Doe</strong>
  <span>john@example.com</span>
  <small>(click to edit)</small>
</div>
```

### Bulk Operations

```html
<form hx-post="/api/users/bulk-delete" hx-target="#user-table" hx-swap="innerHTML"
      hx-confirm="Delete selected users?">
  <table id="user-table">
    <thead>
      <tr>
        <th><input type="checkbox" onclick="toggleAll(this)"></th>
        <th>Name</th>
        <th>Email</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><input type="checkbox" name="ids" value="1"></td>
        <td>John</td>
        <td>john@example.com</td>
      </tr>
      <!-- more rows -->
    </tbody>
  </table>
  <button type="submit">Delete Selected</button>
</form>

<script>
function toggleAll(source) {
  document.querySelectorAll('input[name="ids"]').forEach(cb => cb.checked = source.checked);
}
</script>
```

### Tabs with URL Updates

```html
<div class="tabs" hx-target="#tab-content" hx-swap="innerHTML" hx-push-url="true">
  <a hx-get="/tabs/overview" class="active">Overview</a>
  <a hx-get="/tabs/settings">Settings</a>
  <a hx-get="/tabs/billing">Billing</a>
</div>
<div id="tab-content">
  <!-- Tab content loaded here -->
</div>
```

## Progressive Enhancement

The key principle: the application works without JavaScript, then HTMX enhances it.

```html
<!-- Without JS: normal form submission (full page reload) -->
<!-- With HTMX: partial update, no page reload -->
<form method="post" action="/api/users"
      hx-post="/api/users"
      hx-target="#user-list"
      hx-swap="afterbegin">
  <input name="email" type="email" required>
  <button type="submit">Add User</button>
</form>

<!-- Without JS: normal link navigation -->
<!-- With HTMX: partial page load -->
<a href="/users/123"
   hx-get="/users/123"
   hx-target="#main-content"
   hx-push-url="true">
  View User
</a>
```

Server detects and responds appropriately:

```python
@app.route('/users/<int:id>')
def get_user(id):
    user = User.query.get_or_404(id)
    if request.headers.get('HX-Request'):
        return render_template('partials/user-detail.html', user=user)
    return render_template('full-page/user-detail.html', user=user)
```

## HTMX Extensions

### Useful Extensions

| Extension | Purpose | Example |
|-----------|---------|---------|
| `sse` | Server-Sent Events | Real-time updates without polling |
| `ws` | WebSocket support | Bidirectional real-time |
| `json-enc` | Send JSON instead of form data | API integration |
| `loading-states` | Granular loading indicators | Disable buttons during request |
| `head-support` | Update `<head>` elements | Change page title on navigation |
| `preload` | Preload content on hover | Faster perceived navigation |
| `response-targets` | Different targets for error responses | Show errors in specific location |

### Response Targets (Error Handling)

```html
<form hx-post="/api/users"
      hx-target="#user-list"
      hx-target-422="#form-errors"
      hx-target-500="#server-error"
      hx-ext="response-targets">
  <div id="form-errors"></div>
  <input name="email" type="email" required>
  <button type="submit">Add User</button>
</form>
<div id="server-error"></div>
```

## Performance Tips

1. **Keep HTML fragments small**: Return only the changed part of the page, not large sections.
2. **Use `hx-select`**: Extract only what you need from a larger response.
3. **Debounce inputs**: Always use `delay:` on keyup/input triggers.
4. **Use `hx-indicator`**: Show loading states so users know something is happening.
5. **Preload on hover**: Use the preload extension for navigation links.
6. **Out-of-band swaps**: Update multiple page areas with one response using `hx-swap-oob`.

## Common Anti-Patterns

1. **Returning full pages for HTMX requests**: Every HTMX response should be a fragment. Use `HX-Request` header to detect HTMX requests and respond accordingly.

2. **Client-side state in JavaScript**: If you are building significant client-side state alongside HTMX, you are fighting the architecture. Move state to the server.

3. **Not using `hx-boost`**: For simple pages, `hx-boost="true"` on the body converts all links and forms to AJAX requests automatically. Zero configuration progressive enhancement.

4. **skipping about non-JS users**: HTMX is progressive enhancement. Ensure forms have `action` and `method` attributes and links have `href` attributes as fallbacks.

5. **Over-polling**: `hx-trigger="every 1s"` on many elements creates excessive server load. Use SSE or WebSocket for truly real-time needs. Poll at reasonable intervals (10-60s) for near-real-time.

## HTMX Developer Checklist

- [ ] HTMX loaded from CDN or bundled (~14KB gzipped)
- [ ] Server returns HTML fragments for HTMX requests
- [ ] Progressive enhancement: pages work without JavaScript
- [ ] Swap strategies chosen appropriately for each interaction
- [ ] Loading indicators shown during requests (`hx-indicator`)
- [ ] Input triggers debounced (`delay:300ms`)
- [ ] Error responses handled with `response-targets` extension
- [ ] URL bar updates with `hx-push-url` for navigable interactions
- [ ] Server detects `HX-Request` header for fragment vs full page responses
- [ ] CSS transitions configured for smooth swap animations

## When to Use

**Use this skill when:**
- Designing or implementing htmx developer solutions
- Reviewing or improving existing htmx developer approaches
- Making architectural or implementation decisions about htmx developer
- Learning htmx developer patterns and best practices
- Troubleshooting htmx developer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Htmx Developer Analysis

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

**Input:** "Help me implement htmx developer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended htmx developer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When htmx developer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
