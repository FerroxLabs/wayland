---
name: notion-master
description: |
  Advanced Notion workspace design covering database architecture, relations and rollups, templates, dashboard creation, team workspaces, formulas, API integrations, and using Notion as a CRM, project manager, and knowledge wiki.
  Use when the user asks about notion master, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of notion master or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml journaling template advanced api-design testing automation research"
  category: "ai-machine-learning"
  subcategory: "llm-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Notion Master


## When to Use

**Use this skill when:**
- User asks about notion master techniques or best practices
- User needs guidance on notion master concepts
- User wants to implement or improve their approach to notion master

**Do NOT use when:**
- The request falls outside the scope of notion master
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

Before building any Notion system, clarify the use case:

1. What problem are you trying to solve with Notion? (Project management, knowledge base, CRM, personal productivity, team collaboration)
2. Are you building for yourself, a small team, or an organization?
3. What tools would Notion replace or integrate with?
4. How many people will use this workspace? What are their technical comfort levels?
5. What data do you need to track? (Tasks, contacts, content, finances, notes)
6. How do different types of information relate to each other?
7. What views do you need? (Calendar, kanban, table, gallery, timeline)
8. Do you need external integrations? (API, Zapier, email, calendar sync)
9. What is your Notion experience level? (New, basic user, intermediate, power user)
10. What has failed in previous productivity systems you've tried?

## Database Design Principles

### The Foundation: Everything is a Database

**When to use a page**: Freeform content, documentation, meeting notes, journals
**When to use a database**: Anything you want to filter, sort, view in multiple ways, or relate to other data

### Database Architecture Patterns

**Flat Database** (Simplest): One database, one view, no relations. Use for simple to-do lists, bookmarks, reading lists.

**Hub and Spoke** (Moderate): One central database linked to several supporting databases. Use for project management, CRM. Example: Projects (hub) linked to Tasks, Notes, Files (spokes).

**Relational Network** (Complex): Multiple databases with many-to-many relations. Use for full business operating systems. Example: Clients <-> Projects <-> Tasks <-> Team Members <-> Invoices.

### Database Design Process

```
Step 1: List all things you need to track
Step 2: Define properties for each database
Step 3: Define relationships between databases
Step 4: Create views for each use case

Example for a freelance business:
  Databases: Clients, Projects, Tasks, Invoices, Meeting Notes

  Clients -> Properties: Name, Company, Email, Status (Lead/Active/Past),
    Source, Projects (Relation), Total Revenue (Rollup), Last Contact

  Relationships:
    Clients  <-->> Projects     (one client has many projects)
    Projects <-->> Tasks        (one project has many tasks)
    Projects <-->> Invoices     (one project has many invoices)

  Views for Tasks:
    "My Tasks Today" (filtered: assigned to me, due today)
    "Project Kanban" (grouped by project, kanban by status)
    "Calendar" (calendar view by due date)
    "Overdue" (filtered: due before today, not complete)
```

## Relations and Rollups

### Understanding Relations

Relations link items across databases -- the most powerful feature in Notion.

**One-to-many** (most common): Each Client has many Projects. In Projects database, add Relation property pointing to Clients.

**Many-to-many**: Each Project can have many Team Members and vice versa. Add Relation and enable "Show on Team Members."

### Understanding Rollups

Rollups aggregate data from related database items:

| Property in Related DB | Rollup Function | Use Case |
|----------------------|-----------------|----------|
| Number (hours) | Sum | Total hours on a project |
| Number (amount) | Sum | Total revenue per client |
| Checkbox (complete) | Percent checked | Project completion % |
| Date (due date) | Latest date | Project deadline |
| Any property | Count all | Number of related items |

### Advanced Relation Patterns

**Self-Relation:** Tasks database with "Blocked By" relation pointing to itself -- for task dependencies.

**Junction Table:** Instead of Team Members <-> Projects directly, use Team Members <-> Assignments <-> Projects. The Assignments database adds Role, Hours allocated, Start/End dates -- metadata about the relationship itself.

## Templates

### Database Templates

Database templates pre-fill properties and content when creating new items.

**Meeting Notes Template:**
```
Properties: Date: Today, Status: Draft, Type: Meeting Notes

## Attendees
-
## Agenda
1.
## Discussion Notes

## Action Items
- [ ]
## Next Steps
```

### Recurring Templates

Use Notion's "Repeat" feature on database templates for weekly reviews, daily standups, etc. Set a template to repeat every Monday with pre-filled sections for wins, challenges, metrics, and next week's priorities.

## Dashboard Creation

### Dashboard Design Principles

1. **Single pane of glass**: Most important information without clicking away
2. **Progressive disclosure**: Summary first, details on click
3. **Actionable**: Each widget should inform a decision or action
4. **Updated automatically**: Use linked databases that reflect real-time data

### Building a Dashboard

Use linked database views as dashboard widgets:

1. Type `/linked` and select "Linked view of database"
2. Choose the source database
3. Apply filters specific to this context
4. Choose the appropriate view (table, board, calendar, gallery, list)
5. Show only relevant properties
6. Set appropriate sort order

**Typical personal dashboard widgets:** Quick Capture box, Today's Schedule (calendar filtered to today), Active Tasks (filtered not complete), Projects Overview (board by status), Recent Notes (sorted by last edited, limit 5), Goals with progress bars.

**Typical team dashboard widgets:** Sprint Board (tasks kanban filtered to current sprint), Project Status table with rollup progress, Upcoming Deadlines (next 14 days), Key Metrics, Announcements.

## Formulas

### Essential Formula Patterns

**Days Until Deadline:**
```
dateBetween(prop("Due Date"), now(), "days")
```

**Status Color Coding:**
```
if(prop("Status") == "Complete", "Done",
  if(dateBetween(prop("Due Date"), now(), "days") < 0, "OVERDUE",
    if(dateBetween(prop("Due Date"), now(), "days") < 3, "Urgent",
      "On Track")))
```

**Progress Percentage:**
```
round(prop("Tasks Complete") / prop("Total Tasks") * 100)
```

**Time Tracking:**
```
dateBetween(prop("End Time"), prop("Start Time"), "hours")
```

### Formula Tips

- Use `prop("Property Name")` to reference properties
- Nested if statements handle multiple conditions
- `dateBetween()` is the most useful date function
- Test formulas with known data before applying to full database
- Notion 2.0 formulas support variables with `let()` for cleaner logic

## API Integrations

### Common API Use Cases

- Sync data from other tools into Notion databases
- Create Notion pages from external triggers (forms, emails)
- Read Notion data for reporting or dashboards
- Automate database updates based on external events

### No-Code Integration Examples

```
Gmail -> Notion: New email -> Create page in Inbox database
Notion -> Slack: Item status changed to "Blocked" -> Notify channel
Typeform -> Notion: Form submission -> Create CRM entry
Notion -> Google Calendar: New Events item -> Create calendar event
```

## Notion as CRM / Project Manager / Wiki

### CRM Setup

```
CONTACTS: Name, Company, Email, Status (Lead/Prospect/Customer/Churned),
  Source, Last Contact, Next Follow-Up, Deal Value, Interactions (Relation)
  Views: Pipeline Board, Follow-Up Calendar, High-Value Table, Needs Contact

INTERACTIONS: Title, Contact (Relation), Date, Type (Call/Email/Meeting),
  Outcome, Follow-Up Action, Follow-Up Date
```

### Project Manager Setup

```
PROJECTS: Name, Status, Owner, Dates, Priority, Client (Relation),
  Tasks (Relation), Completion % (Rollup)
  Views: Active Board, Timeline, My Projects, Client View

TASKS: Name, Project (Relation), Assignee, Status, Priority, Due Date,
  Effort (S/M/L), Complete (Checkbox), Blocked By (Self-relation)
  Views: Sprint Board, My Tasks, Calendar, Backlog
```

### Knowledge Wiki Structure

```
/Wiki -> ./Engineering (Architecture, Onboarding, Standards)
      -> ./Product (Specs, Research, Roadmap)
      -> ./Operations (Processes, Policies, Templates)
      -> ./Team (Directory, Meeting Notes, Norms)

Tips: Consistent heading structure, tags as properties,
cross-link related pages, add "Last Reviewed" dates.
```

## Team Workspace Design

### Workspace Organization

```
Teamspace: [Team Name]
  Dashboard, Projects, Tasks, Meeting Notes, Knowledge Base, Templates

Teamspace: Personal
  My Dashboard, Personal Notes, Journal, Learning
```

### Access and Permissions

| Level | Can See | Can Edit | Best For |
|-------|---------|----------|----------|
| Full Access | Everything | Everything | Team members, admins |
| Can Edit | Shared pages | Shared pages | Collaborators |
| Can Comment | Shared pages | Comments only | Stakeholders |
| Can View | Shared pages | Nothing | External viewers |

## Advanced Tips

### Performance Optimization

- Keep databases under 10,000 items when possible
- Use filtered views instead of separate databases for subsets
- Avoid deeply nested pages (3-4 levels max)
- Archive completed items periodically
- Use synced blocks sparingly

### Common Mistakes

1. **Over-engineering**: Start simple, add complexity only when needed
2. **Too many databases**: If two databases always relate 1:1, merge them
3. **No naming convention**: Use consistent prefixes or patterns
4. **Ignoring templates**: If you create the same structure twice, make it a template
5. **Not using filtered views**: One database with 10 views beats 10 separate databases
6. **No archive strategy**: Old data clutters views and slows performance


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to notion master
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Notion Master Analysis

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

**Input:** "Help me with notion master for my current situation"

**Output:**

Based on your situation, here is a structured approach to notion master:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
