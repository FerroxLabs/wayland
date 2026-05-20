---
name: developer-tutorial-creator
description: |
  Expert tutorial creation covering step-by-step structure design, code-along format with checkpoints, progressive complexity sequencing, prerequisite validation, learning path architecture, code sample best practices, troubleshooting sections, visual aids, hands-on exercises, and measuring tutorial effectiveness.
  Use when the user asks about developer tutorial creator, developer tutorial creator best practices, or needs guidance on developer tutorial creator implementation.
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

# Developer Tutorial Creator

## Overview

Developer tutorials teach new skills through guided, hands-on experiences. A great tutorial respects the reader's time, builds confidence through incremental success, anticipates confusion, and leaves the learner with both working code and conceptual understanding. This skill covers the art and science of creating tutorials that developers actually complete and learn from.

## Tutorial Structure

### The Five-Part Framework

```
1. HOOK (30 seconds)
   - What will they build/learn?
   - Screenshot or demo of the final result
   - Why should they care? (practical value)

2. PREREQUISITES (1 minute)
   - What they need installed
   - What they need to know
   - Verification commands to confirm readiness

3. STEPS (bulk of tutorial)
   - Numbered, sequential instructions
   - Each step: action -> code -> verify
   - Checkpoints after every 3-5 steps

4. RECAP (1 minute)
   - What they built and why it matters
   - Key concepts reinforced
   - What to try changing/breaking

5. NEXT STEPS (30 seconds)
   - Related tutorials (learning path)
   - Documentation links for going deeper
   - Community resources for help
```

### Step Design Pattern

```markdown
## Step 3: Add Authentication Middleware

Every API endpoint needs authentication. We'll create a middleware
that validates JWT tokens before the request reaches your route handler.

Create a new file `middleware/auth.js`:

    const jwt = require('jsonwebtoken');

    function authenticate(req, res, next) {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Token required' });
      }

      try {
        const decoded = jwt.verify(token, ENV_CONFIG_VALUE);
        req.user = decoded;
        next();
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    module.exports = { authenticate };

Now apply the middleware to your routes in `server.js`:

    const { authenticate } = require('./middleware/auth');

    // Protected routes
    app.use('/api/orders', authenticate);

**Verify it works:** Try accessing the orders endpoint without a token:

    HTTP client request [reference URL]

You should see:

    {"error": "Token required"}

If you see a different error, check that:
- The server is running (`npm start`)
- You saved both files
- The require path matches your file location
```

## Progressive Complexity

### Complexity Sequencing

```
Level 1: Copy and Run (Minutes 0-5)
  - Provide complete working code
  - Reader copies, runs, sees result
  - Zero decisions required
  - Goal: "I can make this work"

Level 2: Guided Modification (Minutes 5-15)
  - Explain what each part does
  - Ask reader to make small changes
  - "Change the port to 4000 and restart"
  - Goal: "I understand what this does"

Level 3: Guided Extension (Minutes 15-30)
  - Add a new feature with guidance
  - Provide partial code, reader fills gaps
  - "Add a new endpoint that does X"
  - Goal: "I can extend this"

Level 4: Independent Challenge (Minutes 30+)
  - Describe what to build, not how
  - Provide hints but not full code
  - "Build a middleware that logs all requests"
  - Goal: "I can build new things"
```

### Example: Progressive Tutorial Outline

```
Title: "Build a REST API with Express and PostgreSQL"

Step 1: Hello World server (Level 1 - copy and run)
  -> Copy server code, see "Hello World" at localhost:3000

Step 2: Add a route (Level 1 - copy and run)
  -> Add GET /api/status, verify with HTTP client request Step 3: Connect to PostgreSQL (Level 2 - guided modification)
  -> Install pg, create connection, explain connection string
  -> Reader changes database name to their own

Step 4: Create a model (Level 2 - guided modification)
  -> Build users table, insert seed data
  -> Reader modifies schema to add a field

Step 5: Build CRUD endpoints (Level 3 - guided extension)
  -> Provide GET /users, reader builds POST /users
  -> Provide pattern, reader implements UPDATE and DELETE

Step 6: Add validation (Level 3 - guided extension)
  -> Show Joi validation for one endpoint
  -> Reader adds validation to remaining endpoints

Step 7: Challenge: Add authentication (Level 4 - independent)
  -> Describe requirements, link to JWT docs
  -> Provide hints: "use jsonwebtoken package"
  -> Show solution behind expandable section
```

## Prerequisite Validation

### Verifiable Prerequisites

```markdown
## Prerequisites

Before starting, make sure you have:

### Node.js 18 or later
Verify: `node --version`
Expected: `v18.x.x` or higher
[Install Node.js]([reference URL])

### PostgreSQL 15+
Verify: `psql --version`
Expected: `psql (PostgreSQL) 15.x`
[Install PostgreSQL]([reference URL])

### A running PostgreSQL instance
Verify: `psql -U postgres -c "SELECT version();"`
Expected: A version string (no connection error)

### Git
Verify: `git --version`
Expected: `git version 2.x.x`

### Knowledge prerequisites
This tutorial assumes you:
- Can write basic JavaScript (variables, functions, async/await)
- Have used the command line before
- Understand HTTP methods (GET, POST, PUT, DELETE)

**New to any of these?** Start with:
- JavaScript basics: [our JavaScript primer](/tutorials/js-primer)
- Command line: [terminal basics](/tutorials/terminal)
```

## Code-Along Best Practices

### Code Block Formatting Rules

```
Rule 1: Show complete files, not fragments
  BAD:  "Add this line to your file"
  GOOD: Show the full file with the new line highlighted

Rule 2: Number your files
  "Create `1-server.js`" then "Update to `2-server-with-routes.js`"
  Readers can compare their code at each step

Rule 3: Highlight changes
  When updating existing code, show what changed:
  // Add these lines after line 10:
  [new code here]

Rule 4: Make code copy-friendly
  - Include imports at the top
  - Use consistent variable names throughout
  - Avoid line numbers in code blocks (break copy-paste)

Rule 5: Show both input and output
  // Run this command:
  npm test

  // Expected output:
  // PASS tests/auth.test.js
  //   Authentication
  //     ✓ rejects requests without token (12ms)
  //     ✓ rejects invalid tokens (8ms)
  //     ✓ accepts valid tokens (15ms)
```

### Checkpoint Pattern

```markdown
## Checkpoint: Your API should now look like this

At this point, your project structure should be:

    my-api/
    +-- package.json
    +-- server.js
    +-- routes/
    |   +-- users.js
    |   +-- orders.js
    +-- middleware/
    |   +-- auth.js
    +-- models/
        +-- user.js

**Quick test:** Run these three commands and verify the responses:

1. Health check:
   `HTTP client request [reference URL]
   Expected: `{"status": "ok"}`

2. List users (no auth):
   `HTTP client request [reference URL]
   Expected: `{"error": "Token required"}`

3. List users (with auth):
   `HTTP client request -H "Authorization: Bearer [your-test-token]" [reference URL]
   Expected: An array of user objects

**Stuck?** [Download the code up to this point]([reference URL])
```

## Learning Path Architecture

### Multi-Tutorial Path Design

```yaml
learning_path:
  name: "Backend Development with Node.js"
  description: "Go from zero to production-ready APIs"
  estimated_time: "20 hours"

  modules:
    - name: "Foundations"
      tutorials:
        - title: "Your First API Endpoint"
          duration: 30min
          level: beginner
          teaches: [express, routing, JSON]

        - title: "Working with Databases"
          duration: 45min
          level: beginner
          teaches: [postgresql, queries, migrations]
          requires: ["Your First API Endpoint"]

    - name: "Building Real Features"
      tutorials:
        - title: "Authentication with JWT"
          duration: 60min
          level: intermediate
          teaches: [jwt, middleware, bcrypt]
          requires: ["Working with Databases"]

        - title: "File Uploads and Storage"
          duration: 45min
          level: intermediate
          teaches: [multer, s3, streaming]
          requires: ["Authentication with JWT"]

    - name: "Production Ready"
      tutorials:
        - title: "Error Handling and Logging"
          duration: 45min
          level: intermediate
          teaches: [error-middleware, winston, structured-logs]

        - title: "Testing Your API"
          duration: 60min
          level: intermediate
          teaches: [jest, supertest, fixtures]

        - title: "Deploy to Production"
          duration: 60min
          level: intermediate
          teaches: [docker, ci-cd, monitoring]

  path_visualization: |
    [Foundations] ---> [Building Features] ---> [Production Ready]
       |                    |                        |
    Endpoint -> DB -> Auth -> Uploads -> Errors -> Tests -> Deploy
```

## Troubleshooting Sections

### Common Issues Pattern

```markdown
## Troubleshooting

### "ECONNREFUSED" when connecting to database

**Symptom:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Cause:** PostgreSQL is not running.

**Fix:**
- macOS: `brew services start postgresql@15`
- Linux: `sudo systemctl start postgresql`
- Windows: Start "PostgreSQL" in Services

---

### "Cannot find module" errors

**Symptom:** `Error: Cannot find module 'express'`

**Cause:** Dependencies not installed.

**Fix:** Run `add the package dependency` in your project directory.

---

### Port already in use

**Symptom:** `Error: listen EADDRINUSE: address already in use :::3000`

**Cause:** Another process is using port 3000.

**Fix:**
- Find the process: `lsof -i :3000` (macOS/Linux)
- Kill it: `kill -9 [PID]`
- Or use a different port: `PORT=3001 npm start`

---

### API returns HTML instead of JSON

**Symptom:** Getting HTML error page instead of JSON response.

**Cause:** Missing `Content-Type: application/json` header.

**Fix:** Add this middleware before your routes:
    app.use(express.json());
```

## Visual Aids

### When to Use Diagrams

```
Diagram Type          Use For                     Tool
--------------------------------------------------------------
Architecture diagram  System overview, components  Mermaid, Excalidraw
Sequence diagram      API flows, auth flows        Mermaid
Flowchart             Decision logic, workflows    Mermaid
Screenshot            UI steps, dashboard config   Annotated screenshots
Terminal recording     Complex CLI workflows        asciinema
GIF/video            UI interactions, animations   Screen recording

Rule of thumb: If explaining it takes more than 3 sentences,
use a diagram instead.
```

### Annotated Screenshot Guidelines

```
DO:
  - Number annotations sequentially (1, 2, 3)
  - Use arrows pointing to specific elements
  - Keep text outside the screenshot (in callouts)
  - Crop to show only relevant portion
  - Use consistent annotation style throughout tutorial
  - Include alt text for accessibility

DON'T:
  - Show full screen with tiny relevant area
  - Use red circles everywhere (annotation fatigue)
  - Include personal information in screenshots
  - Use screenshots for text-only content (use code blocks)
  - Let screenshots become the only instruction
```

## Measuring Tutorial Effectiveness

### Metrics to Track

```yaml
engagement:
  - completion_rate: "% of readers who reach the final step"
    target: "> 60%"
  - drop_off_points: "Which steps have highest abandonment"
    action: "Simplify or add more explanation at those steps"
  - time_per_step: "How long readers spend on each step"
    insight: "Steps taking 2x expected time need improvement"

quality:
  - feedback_score: "Thumbs up/down on each tutorial"
    target: "> 80% positive"
  - support_tickets: "Questions generated per 1000 readers"
    target: "< 5 tickets per 1000 readers"
  - github_issues: "Bug reports on tutorial code"
    action: "Fix within 24 hours"

impact:
  - api_activations: "New developers making first API call within 24h of reading"
  - sdk_installs: "Package downloads after tutorial publish"
  - retention: "% of tutorial completers who make >10 API calls in 30 days"
```

## Tutorial Writing Checklist

```
Planning:
  [ ] Defined target audience and their existing knowledge
  [ ] Identified the one thing the reader will be able to do after
  [ ] Outlined steps with estimated time per step
  [ ] Verified all tools/versions are current

Writing:
  [ ] Hook explains what and why in first 30 seconds
  [ ] Prerequisites are verifiable (commands to run)
  [ ] Each step follows action -> code -> verify pattern
  [ ] Checkpoints every 3-5 steps with downloadable code
  [ ] Troubleshooting section covers top 5 issues
  [ ] Next steps link to related learning

Code Quality:
  [ ] All code tested on clean machine
  [ ] Code works on macOS, Linux, and Windows
  [ ] Imports and setup code included (not assumed)
  [ ] Variable names consistent throughout
  [ ] Error handling shown (not just happy path)

Review:
  [ ] Fresh eyes walkthrough (someone unfamiliar follows along)
  [ ] Code samples run without modification
  [ ] Screenshots and outputs match current versions
  [ ] Links all work and point to correct resources
  [ ] Reading time estimate is accurate
```

## When to Use

**Use this skill when:**
- Designing or implementing developer tutorial creator solutions
- Reviewing or improving existing developer tutorial creator approaches
- Making architectural or implementation decisions about developer tutorial creator
- Learning developer tutorial creator patterns and best practices
- Troubleshooting developer tutorial creator-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Developer Tutorial Creator Analysis

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

**Input:** "Help me implement developer tutorial creator for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended developer tutorial creator approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When developer tutorial creator must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
