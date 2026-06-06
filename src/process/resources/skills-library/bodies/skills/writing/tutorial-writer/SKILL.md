---
name: tutorial-writer
description: |
  Expert technical tutorial creation covering tutorial structure (goal, prerequisites, steps, verification), progressive complexity, code sample design, screenshot guidelines, common mistakes section, prerequisite validation, and hands-on exercises.
  Use when the user asks about tutorial writer, tutorial writer best practices, or needs guidance on tutorial writer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation teaching"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Tutorial Writer

## Overview

This skill provides comprehensive expertise in creating technical tutorials that effectively teach developers new skills and concepts. Great tutorials respect the reader's time, build confidence through incremental success, and leave learners with both understanding and working code. This skill covers tutorial structure, progressive complexity design, code sample best practices, visual aids, error anticipation, and exercise design.

## Tutorial Structure Framework

### The Four-Part Structure

```
Every tutorial must have these four parts:

1. ORIENTATION (10% of tutorial)
   ├── What will the reader build or learn?
   ├── Why does this matter? (motivation)
   ├── What will they have at the end? (outcome preview)
   └── Estimated time to complete

2. PREREQUISITES (5% of tutorial)
   ├── Required knowledge (with links to learn)
   ├── Required software/tools (with versions)
   ├── Required accounts/API keys
   └── Verification commands to confirm readiness

# ... (condensed) ...
4. WRAP-UP (10% of tutorial)
   ├── Summary of what was built
   ├── Key concepts learned
   ├── Next steps / further reading
   └── Link to complete source code
```

### Tutorial Header Template

```markdown
# Build a Real-Time Chat App with WebSockets

Learn how to build a full-featured chat application with typing indicators,
message history, and user presence. By the end of this tutorial, you will have
a working chat app that multiple users can connect to simultaneously.

**What you will build:**

[Screenshot or GIF of the finished product]

**Time:** 45 minutes
**Difficulty:** Intermediate
**Prerequisites:** Basic JavaScript, familiarity with Node.js
**Source code:** [github.com/org/tutorial-chat-app]([reference URL])
# ... (condensed) ...
- Using the command line for basic operations
- Understanding HTTP request/response basics

If you are new to Node.js, complete the
[Introduction to Node.js]([reference URL]) first.
```

## Progressive Complexity Design

### Complexity Ladder

```
Progressive Complexity Pattern:

Step 1: Minimal working example (instant gratification)
  └── "Hello World" equivalent that proves the setup works

Step 2: Add the core feature (the reason for the tutorial)
  └── The single most important capability

Step 3: Handle the real world (data, errors, edge cases)
  └── Connect to real data, add error handling

Step 4: Polish (UX, performance, production concerns)
  └── Make it production-worthy

# ... (condensed) ...
  Step 1: Express server that returns "Hello World" on GET /
  Step 2: CRUD endpoints for a single resource (products)
  Step 3: Connect to PostgreSQL, add validation, error handling
  Step 4: Add authentication, pagination, rate limiting
  Step 5: Add WebSocket notifications, caching, testing
```

### Step Writing Template

```markdown
## Step 3: Connect to the Database

In this step, you will connect the API to a PostgreSQL database so that
products are persisted between server restarts.

### 3.1 Install the database client

\```shell
install via npm: pg drizzle-orm
install via npm: -D drizzle-kit
\```

### 3.2 Configure the database connection

# ... (condensed) ...
server restarts because it is stored in PostgreSQL.

> **Troubleshooting:** If you get a connection error, make sure your
> PostgreSQL server is running and the `DATABASE_URL` environment variable
> is set. See [Common Mistakes](#common-mistakes) at the end of this tutorial.
```

## Code Sample Design

### Code Sample Rules

```
Code Sample Best Practices:
├── Every code block must be complete and runnable
│   ├── GOOD: Full file with imports, shown in context
│   ├── BAD: Isolated snippet that cannot run standalone
│   └── If showing a diff, clearly mark added/removed lines
├── Show the file path above each code block
│   └── // src/routes/products.ts
├── Use syntax highlighting (specify language after backticks)
├── Include comments for non-obvious lines
│   ├── Comment the "why", not the "what"
│   ├── GOOD: // Pool reuses connections for better performance
│   ├── BAD: // Create a new pool
│   └── Limit to 1-2 comments per code block
├── Keep blocks under 40 lines (split longer blocks)
├── Use realistic variable names (not foo, bar, baz)
├── Use realistic data ("Wireless Headphones", not "Test Product 1")
├── Show expected output after every command
└── Provide copy button (most doc tools support this)
```

### Diff-Style Code Updates

```markdown
When modifying existing code, show what changed clearly:

Update `src/routes/products.ts` to add validation:

\```typescript
// src/routes/products.ts
import { z } from 'zod';  // Add this import

// Add this validation schema
const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.string().regex(/^\d+\.\d{2}$/, 'Price must have 2 decimal places'),
});

# ... (condensed) ...

  const product = await db.insert(products).values(result.data).returning();
  res.status(201).json(product[0]);
});
\```
```

## Screenshot Guidelines

### When to Include Screenshots

```
Include a screenshot when:
├── The reader needs to interact with a GUI (IDE, dashboard, browser)
├── The output is visual (a rendered web page, a chart, a diagram)
├── Configuration involves a multi-step UI workflow
├── The result is hard to describe in text alone
└── You want to show "you should see this" for verification

Do NOT screenshot:
├── Terminal output (use a code block instead)
├── Code (use a code block instead)
├── Simple text that can be described in one sentence
└── Anything that changes frequently (version numbers, UI details)
```

### Screenshot Best Practices

| Guideline | Details |
|-----------|---------|
| Annotation | Use numbered callouts or arrows to highlight key areas |
| Cropping | Show only the relevant portion, not the entire screen |
| Size | Readable at 100% zoom without scrolling horizontally |
| Alt text | Describe what the screenshot shows for accessibility |
| Format | PNG for UI, GIF/video for multi-step interactions |
| Freshness | Date screenshots; update when UI changes |
| Consistency | Same browser, theme, and window size across all screenshots |

```markdown
<!-- Screenshot with alt text and caption -->
![The project dashboard showing three running services with green status indicators](./images/step-3-dashboard.png)

*Figure 3: After deployment, all three services should show green status.*
```

## Common Mistakes Section

### Writing Effective Troubleshooting Content

```markdown
## Common Mistakes

### "Connection refused" when starting the server

**Symptom:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Cause:** PostgreSQL is not running or is listening on a different port.

**Fix:**
\```shell
# Check if PostgreSQL is running
pg_isready

# If not running, start it:
# ... (condensed) ...
netstat -ano | findstr :3000  # Windows

# Kill the process, or use a different port
PORT=3001 npm run dev
\```
```

### Error Anticipation Strategy

```
For each step in the tutorial, ask:
├── What if a required tool is not installed?
├── What if the user is on a different OS?
├── What if a previous step was done incorrectly?
├── What if versions differ from what we tested?
├── What if there is a network/firewall issue?
├── What if permissions are wrong?
└── What if the user copied the code incorrectly?

For each anticipated error:
├── Describe the exact error message they will see
├── Explain what caused it in plain language
├── Provide a specific fix (commands, not just advice)
└── Link to more detailed help if the fix is complex
```

## Prerequisite Validation

### Automated Prerequisite Check Script

```markdown
## Verify Your Environment

Run this script to check that all prerequisites are installed:

\```shell
#!shell-interpreter
# check-prerequisites.shell-cmd

echo "Checking prerequisites..."

check() {
  local name=$1
  local cmd=$2
  local min_version=$3
# ... (condensed) ...
  [PASS] Git: git version 2.43.0
  [PASS] Docker: Docker version 25.0.2

All prerequisites met. You are ready to start the tutorial.
\```
```

## Hands-On Exercises

### Exercise Design Principles

```
Exercise Design Rules:
├── Place exercises AFTER the concept is taught (not before)
├── Start with "modify the code you just wrote" (not "start from scratch")
├── Provide the expected result so learners can self-verify
├── Include hints for common stumbling points
├── Offer a complete solution (collapsed/linked) for self-unblocking
├── Graduate difficulty:
│   ├── Exercise 1: Apply what you just learned (repetition)
│   ├── Exercise 2: Combine two concepts (synthesis)
│   └── Exercise 3: Solve a new problem (transfer)
└── Time each exercise (include time estimates)
```

### Exercise Template

```markdown
## Exercises

### Exercise 1: Add a "categories" resource (10 minutes)

Using what you learned about creating CRUD endpoints for products,
add a new resource for product categories.

**Requirements:**
- `GET /categories` - List all categories
- `POST /categories` - Create a category (name is required)
- `GET /categories/:id` - Get a single category
- Categories should have: `id`, `name`, `description` (optional)

**Hints:**
# ... (condensed) ...

**Requirements:**
- Support `?limit=10&cursor=xxx` query parameters
- Return a `next_cursor` field when more results are available
- Default limit is 20, maximum is 100
```

## Tutorial Testing Protocol

### Before Publishing Checklist

```
Tutorial Testing Protocol:
├── Fresh Environment Test
│   ├── Start from a clean machine (or fresh Docker container)
│   ├── Follow every step exactly as written
│   ├── Copy-paste every command (do not type from memory)
│   └── Verify every expected output matches actual output
├── Second Person Test
│   ├── Have someone from target audience follow the tutorial
│   ├── Observe without helping (note where they get stuck)
│   ├── Ask them to think aloud (identify confusing sections)
│   └── Time how long each step takes (update estimates)
├── Platform Test
│   ├── Test on macOS, Linux, and Windows (if applicable)
│   ├── Test on minimum supported versions of tools
# ... (condensed) ...
└── Code Repository
    ├── Final code matches what the tutorial produces
    ├── Repository has a working CI build
    ├── Each major step is a tagged commit or branch
    └── README in the repo links back to the tutorial
```

## Tutorial Quality Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Completion rate | >70% | Analytics (reached final step) |
| Time to complete | Within 1.5x estimate | User testing observation |
| Error rate | <10% need troubleshooting | Support tickets / forum posts |
| Satisfaction | >4.0 / 5.0 | End-of-tutorial survey |
| Freshness | Updated within 3 months | Last-modified date check |

## Production Checklist

- [ ] Tutorial has clear goal statement and outcome preview
- [ ] Prerequisites listed with version numbers and check commands
- [ ] Every step has a verification point ("you should see...")
- [ ] Code samples are complete, runnable, and syntax-highlighted
- [ ] File paths shown above every code block
- [ ] Common mistakes section covers top 3-5 failure points
- [ ] Screenshots have alt text and annotations where needed
- [ ] Exercises included with hints and solutions
- [ ] Tutorial tested on fresh environment by someone other than the author
- [ ] Source code repository is available and matches tutorial output
- [ ] Estimated time is accurate (tested with real users)
- [ ] All links are valid and will remain stable

## When to Use

**Use this skill when:**
- Designing or implementing tutorial writer solutions
- Reviewing or improving existing tutorial writer approaches
- Making architectural or implementation decisions about tutorial writer
- Learning tutorial writer patterns and best practices
- Troubleshooting tutorial writer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Tutorial Writer Analysis

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

**Input:** "Help me implement tutorial writer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended tutorial writer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When tutorial writer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
