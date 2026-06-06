---
name: tutorial-writing
description: |
  Creates learning-oriented tutorials with clear objectives, prerequisite
  knowledge, step-by-step instructions, explanations of why each step matters,
  and exercises for reinforcement. Use when the user needs to teach someone how
  to learn a skill or technology through guided practice. Do NOT use for task
  documentation (use `user-guide`), how-to articles (use `how-to-guide`), or
  API references (use `api-documentation`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation step-by-step"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Tutorial Writing

## When to Use

- User wants to create a tutorial that teaches a skill or technology step by step
- User asks for learning-oriented documentation with exercises and explanations
- User needs to write a guided walkthrough that builds understanding progressively
- User wants to create onboarding material for new developers or users
- Do NOT use when the user wants task-completion documentation without learning goals (use `user-guide` instead)
- Do NOT use when the user wants a quick how-to article (use `how-to-guide` instead)
- Do NOT use when the user wants API reference documentation (use `api-documentation` instead)
- Do NOT use when the user wants a README for a project (use `readme-writing` instead)

## Process

1. **Collect tutorial context.** Ask the user for:
   - Topic or skill the tutorial teaches
   - Target learner profile (beginner developer, experienced in X but new to Y, etc.)
   - What the learner will be able to do after completing the tutorial
   - Prerequisite knowledge or tools the learner must already have
   - Estimated completion time
   - Whether the tutorial builds a project or teaches a concept

2. **Define learning objectives.** Before writing any steps:
   - State 2-4 specific, measurable outcomes ("By the end of this tutorial, you will be able to...")
   - Each objective uses an action verb: create, configure, deploy, debug, analyze -- not "understand" or "learn about"
   - Objectives determine scope -- anything not serving an objective is cut
   - Order objectives from foundational to advanced

3. **Design the progression arc.** Structure learning in stages:
   - Start with the simplest working version of the thing being taught
   - Each section adds one concept or capability to the previous section
   - Never introduce two new concepts in the same section
   - End each section with a working state -- the learner should never be in a broken state between sections
   - The final section produces the complete result described in the objectives

4. **Write each tutorial section.** For every section:
   - State what this section teaches and why it matters (1-2 sentences)
   - Show the code or action first, then explain it
   - Explain WHY, not just HOW -- "We use a connection pool here because creating a new database connection for every request adds 50-100ms of latency"
   - Highlight common mistakes at the point where learners make them, not in a separate section
   - Include a checkpoint: a command the learner runs or a result they see to confirm the section worked

5. **Add exercises.** After the main tutorial:
   - 2-3 exercises that extend what was taught (not repeat it)
   - Each exercise states the goal, gives a hint, and provides the solution in a collapsible section
   - Exercises progress in difficulty: the first reinforces the tutorial, the last challenges the learner to apply the concept in a new context

6. **Write the introduction.** Draft this last, after the tutorial is complete:
   - What the learner will build or accomplish (show the end result upfront)
   - Who this tutorial is for (and who should look elsewhere)
   - Prerequisites with specific versions and install links
   - Estimated time to complete
   - No history lessons, no "why X is important" essays -- go straight to the learning objectives

## Output Format

```
# Tutorial: [What the Learner Will Build or Accomplish]

## Overview

**What you will build:** [One-sentence description of the end result]

**Learning objectives:**
- [Action verb] + [specific outcome 1]
- [Action verb] + [specific outcome 2]
- [Action verb] + [specific outcome 3]

**Prerequisites:**
- [Tool/knowledge 1] ([version if applicable])
- [Tool/knowledge 2]

**Time:** [Estimated minutes]

---

## Step 1: [First Concept or Action]

[1-2 sentence explanation of what this step teaches and why.]

```[language]
[code or commands for this step]
```

[Explanation of what the code does and WHY this approach is used.]

**Common mistake:** [What learners often get wrong here and how to fix it.]

**Checkpoint:** [Command to run or result to verify. What success looks like.]

---

## Step 2: [Next Concept -- Builds on Step 1]

[1-2 sentence explanation.]

```[language]
[code or commands]
```

[Explanation with WHY reasoning.]

**Checkpoint:** [Verification]

---

## Step [N]: [Final Step]

[Explanation.]

```[language]
[final code]
```

**Checkpoint:** [Final verification -- the learner should see the complete result described in the overview.]

---

## Exercises

### Exercise 1: [Reinforcement -- Apply What You Learned]

**Goal:** [What the learner should accomplish]

**Hint:** [Direction without giving the answer]

<details>
<summary>Solution</summary>

```[language]
[solution code]
```

[Brief explanation of the solution.]

</details>

### Exercise 2: [Extension -- Take It Further]

**Goal:** [A harder challenge that requires applying the concepts in a new way]

**Hint:** [Direction]

<details>
<summary>Solution</summary>

```[language]
[solution code]
```

</details>

---

## Summary

**What you learned:**
- [Objective 1 restated as completed]
- [Objective 2 restated as completed]

**Next steps:**
- [Related tutorial or documentation to continue learning]
- [More advanced topic to explore]
```

## Rules

1. NEVER introduce two new concepts in the same section -- one concept per section maximum
2. NEVER leave the learner in a broken state between sections -- every section ends with working code or a verified result
3. NEVER say "understand" or "learn about" as a learning objective -- use measurable action verbs (create, configure, deploy, debug)
4. NEVER skip the "why" explanation -- every code block must have an explanation of why this approach is used, not just what it does
5. ALWAYS show the end result upfront in the overview so learners know what they are building toward
6. ALWAYS include checkpoints after each section so learners can verify they are on track
7. ALWAYS include at least 2 exercises that extend the tutorial content
8. Show code first, then explain -- learners scan for code blocks and read explanations after
9. Highlight common mistakes at the point in the tutorial where learners make them
10. Prerequisites must include specific version numbers and verification commands

## Edge Cases

- **Tutorial for a concept, not a project:** Replace the "What you will build" with "What you will learn to do." Provide a sandbox environment or REPL instructions so the learner can practice without project setup. Each section demonstrates the concept with a minimal, runnable example.
- **Long tutorial (more than 30 minutes):** Split into parts with clear break points. Each part has its own learning objectives and can stand alone. Provide a starter repo or checkpoint files so learners can start at any part.
- **Tutorial with external service dependencies:** Provide mock or test endpoints for learners who cannot create accounts. Include a "Using a real account" section as an optional extension. Never require payment or credit card entry in a tutorial.
- **Tutorial where the technology changes frequently:** Pin specific versions in prerequisites. Date the tutorial in the overview. Note which steps are version-sensitive and which are conceptually stable across versions.
- **Audience with mixed skill levels:** State the assumed level explicitly in prerequisites. Provide a "Skip ahead" link for experienced learners who do not need the foundational sections. Never compromise the beginner path to serve advanced readers.
- **Tutorial with irreversible actions (database migrations, deployments):** Use a test/sandbox environment exclusively. State this requirement prominently in prerequisites. Provide rollback instructions for each irreversible step.

## Example

**Input:** "Write a tutorial teaching JavaScript developers how to build a basic REST API with Express.js. Assume they know JavaScript but have never used Express."

**Output:**

# Tutorial: Build a REST API with Express.js

## Overview

**What you will build:** A REST API for managing a to-do list with endpoints to create, read, update, and delete items.

**Learning objectives:**
- Create an Express.js server that listens on a specified port
- Define route handlers for GET, POST, PUT, and DELETE requests
- Parse JSON request bodies and return JSON responses
- Handle errors with status codes and descriptive messages

**Prerequisites:**
- Node.js >= 18.0.0 (run `node --version` to check)
- npm >= 9.0.0 (run `npm --version` to check)
- Familiarity with JavaScript functions, objects, and arrays
- A code editor and terminal

**Time:** 25 minutes

---

## Step 1: Create the Project and Install Express

Every Express app starts with a Node.js project. This step sets up the project structure and installs the framework.

```text
mkdir todo-api && cd todo-api
npm init -y
[package-manager] add express
```

The `npm init -y` command creates a `package.json` with default values. Express is the only dependency for this tutorial.

Create `server.js`:

```javascript
const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

`express.json()` is middleware that parses incoming JSON request bodies. Without it, `req.body` is `undefined` for POST and PUT requests.

**Common mistake:** skipping `app.use(express.json())` and getting `undefined` when reading `req.body`. Add it before any route definitions.

**Checkpoint:** Run `node server.js`. You should see: `Server running on port 3000`. Press Ctrl+C to stop the server.

---

## Step 2: Add a GET Endpoint to List Items

Route handlers connect HTTP methods and URL paths to functions. Start with the simplest operation: returning data.

Add this above `app.listen()` in `server.js`:

```javascript
let todos = [
  { id: 1, title: 'Learn Express', completed: false },
  { id: 2, title: 'Build an API', completed: false }
];

app.get('/todos', (req, res) => {
  res.json(todos);
});
```

`res.json()` converts the JavaScript array to JSON and sets the `Content-Type` header to `application/json` automatically. Using `res.json()` instead of `res.send()` ensures consistent JSON formatting.

**Checkpoint:** Start the server with `node server.js`. Open a new terminal and run:

```text
[test-client] GET localhost:3000/todos
```

You should see the two default to-do items as a JSON array.

---

## Step 3: Add a POST Endpoint to Create Items

POST endpoints receive data in the request body and create new resources.

Add below the GET route:

```javascript
app.post('/todos', (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newTodo = {
    id: todos.length + 1,
    title,
    completed: false
  };

  todos.push(newTodo);
  res.status(201).json(newTodo);
});
```

Status 201 means "Created" -- it tells the client that a new resource was successfully created, not just that the request was OK. The `if (!title)` guard returns a 400 error immediately, preventing an item with no title from being created.

**Common mistake:** Using `res.json()` without `return` before it in an error branch. Without `return`, execution continues past the error response and the route handler tries to send a second response, crashing with "Cannot set headers after they are sent."

**Checkpoint:** With the server running:

```text
[test-client] POST localhost:3000/todos -H "Content-Type: application/json" -d '{"title": "Test item"}'
```

You should see: `{"id":3,"title":"Test item","completed":false}`

---

## Exercises

### Exercise 1: Add a PUT Endpoint

**Goal:** Create a `PUT /todos/:id` endpoint that updates an existing to-do item's title and completed status.

**Hint:** Use `req.params.id` to get the ID from the URL path. Find the item in the array with `.find()`. Return 404 if not found.

<details>
<summary>Solution</summary>

```javascript
app.put('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find(t => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todo.title = req.body.title || todo.title;
  todo.completed = req.body.completed !== undefined ? req.body.completed : todo.completed;

  res.json(todo);
});
```

`parseInt()` converts the string URL parameter to a number for comparison with the stored IDs.

</details>

### Exercise 2: Add Error Handling Middleware

**Goal:** Add a global error handler that catches unhandled errors and returns a consistent JSON error response instead of Express's default HTML error page.

**Hint:** Express error-handling middleware has four parameters: `(err, req, res, next)`. Place it after all route definitions.

<details>
<summary>Solution</summary>

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'An unexpected error occurred' });
});
```

Express identifies error-handling middleware by its four-parameter signature. This must be defined after all routes so it catches errors from any handler.

</details>

---

## Summary

**What you learned:**
- Created an Express.js server listening on a configured port
- Defined route handlers for GET and POST with JSON request/response handling
- Validated input and returned descriptive error responses with correct status codes

**Next steps:**
- Add a database (SQLite or PostgreSQL) instead of the in-memory array
- Add middleware for request logging and authentication
- Deploy the API to a cloud platform
