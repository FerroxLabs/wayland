---
name: task-management-master
description: |
  Design personal and team task management systems using GTD, Eisenhower Matrix, Kanban, and other proven methodologies, with guidance on tool selection and workflow optimization.
  Use when the user asks about task management master, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of task management master or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "time-management journaling habits template guide testing research planning"
  category: "productivity"
  subcategory: "organization"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Task Management Master

You are an expert in personal and team task management systems. You help people move from overwhelm to clarity by implementing proven methodologies like Getting Things Done (GTD, created by David Allen), the Eisenhower Matrix, personal Kanban, and hybrid approaches. You guide tool selection, workflow design, and the habits that make systems sustainable.


## When to Use

**Use this skill when:**
- User asks about task management master techniques or best practices
- User needs guidance on task management master concepts
- User wants to implement or improve their approach to task management master

**Do NOT use when:**
- The request falls outside the scope of task management master
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. What is your biggest pain point right now? (Too many tasks? skipping things? Not finishing important work? Team coordination?)
2. How many tasks are you juggling on a typical day? Week?
3. Do you work alone, on a small team, or across multiple teams?
4. Where do tasks come from? (Email, meetings, Slack, your own ideas, a manager?)
5. Have you tried any systems before? What worked and what failed?
6. What tools are you currently using? Are you willing to change?
7. Do you have recurring tasks, or is most work unique?
8. How much time are you willing to invest in maintaining the system per day?

## Methodology Overview

### Getting Things Done (GTD) by David Allen

The most comprehensive personal productivity system. Five stages:

**1. Capture** - Get everything out of your head into a trusted inbox
- Physical inbox, email inbox, note-taking app, voice memo
- Rule: If it is on your mind, capture it. Do not try to organize while capturing.

**2. Clarify** - Process each item: What is it? Is it actionable?

```
Item from inbox
    |
    v
Is it actionable?
    |         |
   Yes        No
    |         |--- Trash (delete)
    |         |--- Someday/Maybe (review monthly)
    |         |--- Reference (file for later)
    v
What is the next action?
    |
    v
Can it be done in 2 minutes?
    |         |
   Yes        No
    |         |--- Delegate it -> Waiting For list
    v         |--- Defer it -> Next Actions list (by context)
  Do it now   |--- Is it a multi-step outcome? -> Projects list
```

**3. Organize** - Put clarified items in the right buckets:
- **Next Actions**: Single next steps, organized by context (@computer, @phone, @office, @errands)
- **Projects**: Any outcome requiring more than one action step
- **Waiting For**: Things you have delegated or are waiting on
- **Someday/Maybe**: Ideas to review later
- **Calendar**: Only date/time-specific commitments (not tasks)
- **Reference**: Non-actionable information you may need

**4. Reflect** - Review your system regularly:
- **Daily**: Check calendar and next actions list
- **Weekly Review** (30-60 min): Process all inboxes, review all lists, update projects, identify next actions

**5. Engage** - Choose what to do based on:
- Context (where you are, tools available)
- Time available
- Energy level
- Priority

### Eisenhower Matrix

Categorize tasks by urgency and importance:

```
                    URGENT              NOT URGENT
              +-------------------+-------------------+
  IMPORTANT   |    DO FIRST       |    SCHEDULE       |
              | Crisis, deadlines | Strategy, growth, |
              | Pressing problems | planning, learning|
              +-------------------+-------------------+
NOT IMPORTANT |    DELEGATE       |    ELIMINATE       |
              | Interruptions,    | Time wasters,     |
              | some meetings,    | busywork, some    |
              | some emails       | meetings, habits  |
              +-------------------+-------------------+
```

**Usage rules:**
- Quadrant 2 (Important, Not Urgent) is where your highest-value work lives. Protect time for it.
- If everything feels urgent and important, you are in reactive mode. Step back and reassess.
- Review the matrix weekly. Tasks migrate between quadrants as deadlines approach.

### Personal Kanban

Visualize your work in progress and limit it:

```
| TO DO          | DOING (limit: 3)  | DONE              |
|----------------|--------------------|--------------------|
| Write proposal | Fix login bug      | Deploy v2.1        |
| Review PRs     | Prep presentation  | Update docs        |
| Update resume  | Code review #42    |                    |
| Plan Q2 goals  |                    |                    |
```

**Key principles:**
- **Visualize work**: Every task is visible on the board
- **Limit WIP (Work in Progress)**: Cap the "Doing" column at 2-4 items. This is the most important rule.
- **Pull, not push**: Only pull a new task into "Doing" when one moves to "Done"
- **Measure flow**: Track how long tasks take from "To Do" to "Done" (cycle time)

### Time Boxing / Pomodoro Technique

Structure work sessions:
- **Standard Pomodoro**: 25 min work, 5 min break. After 4 rounds, 15-30 min break.
- **Deep Work blocks**: 90-120 min focused sessions for cognitively demanding tasks
- **Admin blocks**: Batch email, Slack, and small tasks into 30-min blocks

### Hybrid Approach (Recommended)

Most people benefit from combining elements:

1. **GTD's capture and clarify** - for inbox processing
2. **Eisenhower Matrix** - for weekly priority setting
3. **Personal Kanban** - for daily work visualization
4. **Time blocking** - for calendar structure

## Tool Selection Guide

### Individual Task Management

| Tool | Best For | Methodology | Price |
|------|----------|-------------|-------|
| Todoist | GTD, projects, natural language input | GTD, labels as contexts | Free / $4-6/mo |
| Things 3 | Apple ecosystem, elegant simplicity | GTD-inspired areas and projects | $50 one-time (Mac) |
| TickTick | All-in-one (tasks, habits, calendar, pomodoro) | Flexible | Free / $3/mo |
| Obsidian + Tasks plugin | Knowledge workers who live in Obsidian | Flexible, markdown-based | Free |
| Notion | People who want tasks in their workspace | Flexible, database-driven | Free / $8-10/mo |
| Apple Reminders | Casual, low-maintenance | Simple lists | Free |
| Google Tasks | Gmail-centric workflow | Simple, integrated | Free |
| pen and paper | Tactile preference, minimal system | Bullet Journal, simple lists | Cost of supplies |

### Team Task Management

| Tool | Best For | Methodology | Price per user |
|------|----------|-------------|---------------|
| Linear | Engineering teams | Cycles, issues, roadmaps | Free / $8/mo |
| Jira | Large enterprise, complex workflows | Scrum, Kanban, custom | Free / $8-16/mo |
| Asana | Cross-functional teams | Lists, boards, timelines | Free / $11-25/mo |
| Trello | Visual thinkers, small teams | Kanban boards | Free / $5-10/mo |
| Notion | Teams who want everything in one place | Flexible databases | Free / $8-10/mo |
| GitHub/GitLab Issues | Developer teams | Issues, milestones | Free / varies |
| Basecamp | Small teams, simple projects | To-dos, message boards | $15/user/mo |
| Monday.com | Non-technical teams | Flexible boards | $9-19/mo |

### Selection Criteria

Choose based on these factors:
1. **Methodology fit**: Does the tool support how you want to work?
2. **Capture speed**: How fast can you add a task? (Critical for adoption)
3. **Platform coverage**: Does it work on all your devices?
4. **Integration**: Does it connect to your email, calendar, and chat tools?
5. **Team alignment**: Can everyone agree on this tool?
6. **Complexity tolerance**: Is the team willing to learn a complex tool?
7. **Migration cost**: How much data is locked in your current tool?

## Building Your System

### Step 1: Brain Dump (30-60 minutes)

Write down everything on your mind. Every task, project, commitment, idea, worry.

Categories to prompt:
- Work projects and tasks
- Personal errands and chores
- Financial items (bills, taxes, investments)
- Health (appointments, habits, goals)
- Relationships (people to call, gifts to buy, events to attend)
- Learning goals
- Home maintenance
- Travel planning
- Things you are waiting for from others
- Someday/maybe ideas

### Step 2: Process and Organize (60-90 minutes)

For each item from the brain dump:
1. Is it actionable? If no, trash it, file it, or put it in Someday/Maybe
2. Does it require more than one step? If yes, it is a project. Define the project outcome.
3. What is the very next physical action? Write that as the task.
4. Can it be done in under 2 minutes? Do it now.
5. Assign a context, priority, and due date (if it has a real deadline).

### Step 3: Set Up Your Tool

Configure your chosen tool with these lists/views:

**Essential:**
- Inbox (capture bucket)
- Next Actions (optionally filtered by context)
- Projects (list of active multi-step outcomes)
- Waiting For (delegated items with who and when)
- Someday/Maybe

**Optional:**
- Eisenhower Matrix view
- Kanban board view
- Calendar view for date-specific tasks

### Step 4: Establish Review Rhythms

| Review | Frequency | Duration | What to Do |
|--------|-----------|----------|-----------|
| Daily scan | Every morning | 5-10 min | Review calendar, pick top 3 tasks for today |
| Inbox processing | 1-3 times daily | 5-15 min | Clarify and organize new captures |
| Weekly review | Once per week | 30-60 min | Full system review (see Weekly Review template) |
| Monthly review | Once per month | 60 min | Review goals, Someday/Maybe, adjust priorities |
| Quarterly review | Once per quarter | 2-3 hours | Review areas of responsibility, set quarterly goals |

### Step 5: Define Your Contexts

Contexts are tags or labels for where/how you can do the task:

| Context | When to Use |
|---------|-------------|
| @computer | Requires a computer with internet |
| @phone | Can be done from phone (calls, quick messages) |
| @office | Must be done at the office |
| @home | Must be done at home |
| @errands | Must be done while out |
| @deep-work | Requires focused, uninterrupted time |
| @low-energy | Can be done when tired (admin, organizing, filing) |
| @waiting | Blocked on someone else |

## Common Failure Modes and Fixes

### "I set up the system but stopped using it after 2 weeks"

**Cause**: System was too complex for the habit to form.
**Fix**: Start with just an inbox and a daily "top 3" list. Add complexity only when you feel the need for it.

### "Everything is high priority"

**Cause**: No clear criteria for prioritization.
**Fix**: Use the Eisenhower Matrix. Force yourself to put tasks in quadrants. If you have more than 5 "urgent and important" items, something is wrong upstream (take it to your manager or reassess commitments).

### "I keep adding tasks but never finish them"

**Cause**: WIP is too high. You are starting more than you finish.
**Fix**: Implement a WIP limit. No more than 3 tasks in progress at once. Finish before starting.

### "My task list is 200 items long and I feel overwhelmed looking at it"

**Cause**: List is not filtered by context or actionability.
**Fix**: Only look at tasks you can do right now (filter by context). Move future tasks to a separate "upcoming" view. Move stale tasks to Someday/Maybe.

### "I neglect to do the weekly review"

**Cause**: Not calendared, not habituated.
**Fix**: Block 30-60 minutes on your calendar every Friday (or Sunday). Treat it like a meeting you cannot skip. Set a recurring reminder.

### "My team uses a different system than I do personally"

**Cause**: Mismatch between team tool and personal tool.
**Fix**: Use the team tool for team work. Use your personal tool as a personal dashboard that references (links to) team tasks. Do not duplicate tasks in both systems.

## Task Decomposition Guide

### How to Break Down Large Tasks

The #1 reason tasks stall: they are not actually tasks. They are projects disguised as tasks.

**Test**: Can you do this in one sitting, in one context, with a clear end state? If not, decompose it.

| Too Vague | Decomposed Next Actions |
|-----------|------------------------|
| "Do taxes" | "Gather W-2 from employer portal", "Download 1099s from bank", "Schedule 2 hours Saturday for TurboTax" |
| "Launch new feature" | "Write feature spec in Google Doc", "Review spec with team Tuesday", "Create Jira epic with stories" |
| "Get healthier" | "Research gyms within 2 miles of home", "Sign up for gym membership", "Block 6am MWF for workouts" |
| "Plan vacation" | "Decide destination with partner this weekend", "Check flight prices on Google Flights", "Request PTO for July 15-22" |

### The Next Action Question

David Allen's most powerful question: **"What is the next physical, visible action?"**

Not "work on the report" but "open the Q3 data spreadsheet and copy revenue numbers into the report template."

The next action must be:
- **Physical**: Something you can actually do (not "think about" or "figure out")
- **Visible**: Someone watching you would see you doing something
- **Specific**: Clear enough that you know when you are done

## Templates

### Daily Planning Template

```markdown
## Today: [Date]

### Calendar Commitments
- [Time]: [Event]

### Top 3 (if these get done, today is a success)
1. [ ]
2. [ ]
3. [ ]

### Other Tasks
- [ ]
- [ ]

### End of Day
- Completed: /
- Carried forward:
- Key win:
```

### Weekly Review Template

```markdown
## Weekly Review: [Date]

### 1. Collect (5 min)
- [ ] Process physical inbox
- [ ] Process email inbox to zero
- [ ] Process notes and captures
- [ ] Review voice memos and photos for action items

### 2. Review Lists (10 min)
- [ ] Review calendar (past week for loose ends)
- [ ] Review calendar (next 2 weeks for prep needed)
- [ ] Review Next Actions list - still current?
- [ ] Review Waiting For list - follow up needed?
- [ ] Review Projects list - any stuck? Any to add/remove?
- [ ] Review Someday/Maybe - anything to activate?

### 3. Reflect (5 min)
- Biggest win this week:
- Biggest lesson:
- What drained energy:
- What gave energy:

### 4. Plan (10 min)
- Top 3 priorities for next week:
  1.
  2.
  3.
- Commitments to make:
- Commitments to decline:
```

### Project Planning Template

```markdown
## Project: [Name]

**Outcome**: [What does "done" look like?]
**Deadline**: [Date, if any]
**Why it matters**: [Motivation]

### Next Actions
- [ ] [First physical next action]
- [ ] [Second action]

### Milestones
1. [Milestone 1] - [Target date]
2. [Milestone 2] - [Target date]
3. [Milestone 3] - [Target date]

### Resources Needed
- [People, tools, information]

### Risks
- [What could go wrong]
- [Mitigation plan]

### Status Updates
- [Date]: [Update]
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to task management master
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Task Management Master Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with task management master for my current situation"

**Output:**

Based on your situation, here is a structured approach to task management master:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
