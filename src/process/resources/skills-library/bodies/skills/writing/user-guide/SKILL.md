---
name: user-guide
description: |
  Creates task-oriented user guides with prerequisites, step-by-step procedures,
  expected outcomes, and troubleshooting sections. Use when the user needs
  documentation that teaches end users how to accomplish tasks with a product or
  system. Do NOT use for API reference docs (use `api-documentation`), developer
  tutorials (use `tutorial-writing`), or internal process docs (use `sop-writing`).
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
# User Guide Writing

## When to Use

Use this skill when the user needs task-oriented documentation written for end users -- people who use a product to accomplish real-world goals, not to understand how the product was built.

**Trigger scenarios where this skill applies:**

- A product team asks for a user guide, user manual, help documentation, or "getting started" content for a shipped product
- A SaaS company needs to document workflows for non-technical users such as marketing managers, HR coordinators, accountants, or operations staff
- A software product has shipped with no documentation and support tickets are flooding in around the same 5-10 user mistakes
- An organization is replacing a legacy tool with a new one and needs migration documentation so users can map their old habits to the new interface
- A product has grown significantly and informal onboarding ("just ask a colleague") is no longer scaling -- the team needs formalized, self-service documentation
- A company is onboarding a large client cohort and needs white-labeled or role-specific documentation for their end users
- A customer success team is building a help center and needs structured, searchable articles organized by task

**Do NOT use this skill in these situations:**

- The user wants API reference documentation with endpoint descriptions, request/response schemas, and authentication details -- use `api-documentation` instead
- The user wants a developer tutorial that teaches programming concepts with learning objectives and exercises -- use `tutorial-writing` instead
- The user wants an internal standard operating procedure for team members who know the product -- use `sop-writing` instead
- The user wants a short README for a code repository explaining setup and contribution -- use `readme-writing` instead
- The user wants a formal technical specification or architecture document -- use `technical-spec-writing` instead
- The user needs an API quickstart or SDK integration walkthrough -- use `tutorial-writing` instead
- The user wants marketing-oriented product overviews or feature announcements -- this is content marketing, not user documentation

---

## Process

### Step 1: Gather Product and Audience Context Before Writing Anything

Before producing a single line of documentation, collect enough information to make every subsequent decision correctly. Missing information here cascades into structural errors that are expensive to fix.

Ask the user to provide or confirm:

- **Product name, type, and delivery platform:** Is this a web application, desktop application, mobile app, CLI tool, or hardware device with accompanying software? Platform determines navigation language ("click" vs. "tap" vs. "type"), screenshot conventions, and whether keyboard shortcuts apply.
- **Primary user role and technical level:** Identify the job title or role of the target reader. A non-technical marketing coordinator reading at a 10th-grade reading level needs different prose than an IT administrator who configures enterprise software. Use the Flesch-Kincaid reading level as a calibration target: aim for grade 7-8 for general business users, grade 10-12 for technical administrators.
- **Top 5-10 user tasks by frequency:** These are the workflows users perform most often and are therefore most critical to document accurately. If the user does not know task frequency, ask whether support tickets or analytics data exists -- common support tickets are a reliable proxy for underdocumented tasks.
- **Scope of the guide:** Is this one focused section (e.g., "how to set up billing"), a single chapter, or a complete multi-chapter manual? Scope determines depth of cross-referencing and whether a master table of contents is needed.
- **Existing documentation or legacy documentation:** If prior docs exist, determine whether to replace, supplement, or migrate them. If migrating, the existing structure is a data source for task inventory even if the content is outdated.
- **Screenshots or access to the product:** Ideally, request access to the product or screenshots. If neither is available, write placeholder image descriptions using the format `[SCREENSHOT: Description of what the screenshot shows]` and flag them for the user to fill in.
- **Review workflow:** Determine who will validate UI label accuracy -- a product manager, QA engineer, or UX writer -- before publishing. UI label errors are the single most common reason user documentation fails users.

---

### Step 2: Build a Task Inventory and Information Architecture

Do not start writing procedures until you have a complete, prioritized list of tasks and a documented structure. This is the difference between documentation that users can navigate and documentation they abandon.

- **Create a task inventory table.** List every task the guide will cover. For each task, record: task name (action-verb phrase), user role it applies to, estimated frequency (high/medium/low), and prerequisite tasks. A high-frequency task is one users perform at least weekly; medium is monthly; low is occasional or administrative.
- **Group tasks into chapters using user mental models, not product architecture.** Users organize their thinking around goals ("manage my account", "run a report", "add a team member"), not around the product's database schema or module names. A common mistake is mirroring the product's navigation sidebar in the documentation structure -- this confuses users who do not yet know the interface.
- **Order chapters by the user journey.** The canonical order follows onboarding logic: setup and account creation first, core repeated tasks second, advanced or administrative tasks third, troubleshooting last. Within a chapter, order tasks by frequency, not alphabetically.
- **Identify task dependencies.** If Task B requires the user to have completed Task A, document this explicitly in Task B's prerequisites. Never assume users read documentation linearly.
- **Assign role scoping.** If the product has multiple user roles (admin, standard user, read-only viewer), tag each task with the role(s) that can perform it. Tasks restricted to admins must be clearly labeled -- preferably with a visual callout -- so standard users do not attempt them and hit permission errors.
- **Set a chapter and task count estimate.** A typical user guide for a medium-complexity SaaS product has 4-7 chapters and 20-40 individual tasks. A getting-started guide for one core workflow might have 1 chapter and 5-8 tasks. Scope the structure before writing to avoid mid-project scope creep.

---

### Step 3: Write the "Before You Start" Section

Every user guide requires a front-matter section that sets context and gates entry. Users who skip prerequisites and start mid-procedure cause the majority of "why isn't this working" support tickets.

- **System requirements:** List minimum hardware, OS versions, browser versions, or network conditions required. Be specific: "Chrome 110 or later, Firefox 115 or later, Safari 16 or later -- Internet Explorer is not supported." Vague language ("a modern browser") creates support burden.
- **Account and permission requirements:** State exactly what role or permission level the user needs. "You must have the Account Owner or Billing Admin role. If you are not sure what role you have, go to **Settings > Team Members** and locate your name." This phrasing gives users a self-service way to check rather than opening a support ticket.
- **Pre-installation or setup requirements:** If the product requires an installation, integration, or prior configuration before tasks in the guide apply, describe it or link to it. Do not assume the user completed onboarding.
- **Key concepts glossary:** Define 5-10 product-specific terms that appear throughout the guide. Definitions should be one sentence, written in plain language. Avoid defining a term using the term itself. Good example: "**Workspace:** A shared environment that contains all your team's projects, members, and settings. Think of it as a container for your team's work." Bad example: "**Workspace:** The workspace is where you work."
- **What this guide does not cover:** Explicitly list adjacent topics this guide omits and where users can find them. This reduces confusion when a user comes looking for something out of scope.

---

### Step 4: Write Each Task Procedure Using the Standard Structure

Every task in the guide follows the same structure without exception. Consistency is not cosmetic -- it trains users to navigate your documentation faster because they always know where to find each type of information.

**Goal statement (one sentence):** Opens the task. States what the user will have accomplished. Written as a declarative sentence, not an imperative: "This procedure walks you through creating a new workspace and inviting your first team member" -- not "Learn how to create a workspace."

**Prerequisites (bulleted list):** Lists every condition that must be true before the user begins the first step. Each prerequisite links to where the user can meet that condition if they have not yet done so. A missing prerequisite that surfaces mid-procedure is the number-one cause of user abandonment.

**Steps (numbered list):** Follow these rules for every step:
- One action per step. If a step contains "and then" or "and", split it into two steps. The threshold: can a user perform this action with a single gesture, click, or keyboard entry? If yes, one step. If no, split.
- Lead with the UI element acted upon, then the action: "Select **Export** from the **File** menu" not "From the File menu, Export is where you click."
- Bold every UI element name using the exact label that appears on screen. Capitalization and punctuation must match the interface exactly. "Save Changes" and "Save changes" are different things to a user scanning the screen.
- Include navigation paths for every action, even actions the user might consider obvious. "Click **Save**" is insufficient for a user who does not know where Save appears on this screen. "Click **Save** in the bottom-right corner of the dialog" is correct.
- After steps where the result is not visually obvious, add an indented "You should see:" sub-bullet describing exactly what changes on screen. Use this for: confirmation messages, loading states, state changes that update the UI, and success indicators.
- Conditional steps use consistent formatting: "If [condition], [action]. Otherwise, [alternative action]." Never use "you may need to" -- either the step is required or it is conditional, and the condition must be stated.
- Maximum 12 steps per task. If a procedure requires more than 12 steps, it is almost certainly two tasks that should be documented separately with a cross-reference between them.

**Result statement:** Closes the task. Describes what the completed state looks like -- what the user sees, what changed in the system, and how long any async processing takes. "The new workspace appears in your **Workspaces** list within 5 seconds. You will receive a confirmation email at your registered address within 2 minutes."

**Troubleshooting table:** Three-column table with Problem (what the user sees -- the symptom, not a label for the problem), Cause (what went wrong in plain language), and Fix (exact steps). Include 2-4 rows per task. Do not include problems that cannot occur during this specific task.

---

### Step 5: Write Callouts and Supporting Content

Inline prose alone is insufficient for complex or high-risk tasks. Use structured callouts to prevent data loss, irreversible actions, and security mistakes.

- **Note callout:** Use for information that is helpful but not required. Render as: `**Note:** [content]`. Example: "**Note:** Campaign names are visible only to you and your team -- recipients never see them."
- **Important callout:** Use for information the user must know before proceeding -- not for warnings about irreversible actions. Render as: `**Important:** [content]`.
- **Warning callout:** Use ONLY for actions that are irreversible, cause data loss, affect other users, or have billing implications. Render as: `**Warning:** [content]`. Do not overuse -- every warning devalues the others. A guide with more than 3-4 warnings per chapter has a calibration problem.
- **Tip callout:** Use for shortcuts, efficiency improvements, or optional best practices. Render as: `**Tip:** [content]`. Example: "**Tip:** Press Ctrl+S (Windows) or Cmd+S (Mac) to save without using the toolbar."
- **Screenshot placement:** Place screenshots immediately after the step they illustrate, never before. Caption every screenshot with what it shows, not what the user should do: "The Campaigns dashboard showing a draft campaign." not "Click Create Campaign."
- **Table use:** Use tables for comparison content (plan features, role permissions, field definitions), never for procedural content. Procedural content belongs in numbered steps.

---

### Step 6: Write the Troubleshooting Chapter

Beyond per-task troubleshooting, a standalone troubleshooting chapter addresses cross-task errors -- login issues, permission errors, browser compatibility problems, and account-state issues that can affect any task.

- Structure the troubleshooting chapter as a series of problem/symptom entries, not by cause. Users arrive at troubleshooting knowing what they see, not what caused it.
- For each entry: state the exact error message or symptom in bold (copy it verbatim from the interface), provide the most common cause, provide the fix with numbered steps, and provide an escalation path ("If these steps do not resolve the issue, contact support with error code [X] and your account email.").
- Include a quick-reference troubleshooting table at the start of the chapter with symptom-to-fix mappings for the 10-15 most common errors. Users scan this table first; the detailed entries below serve users whose quick fix did not work.
- Distinguish between user-resolvable issues and issues that require contacting support. Never tell a user to "contact support" for something they can resolve themselves -- this destroys trust. Never tell a user to try more steps for something that requires an administrator or support agent.

---

### Step 7: Add Navigation, Versioning, and Maintenance Infrastructure

Documentation that cannot be found, navigated, or updated is documentation that will fail users and be abandoned by the team maintaining it.

- **Table of contents:** Include a linked table of contents at the start of the guide. For online documentation, this is usually auto-generated. For static documents, build it manually. Include chapter and task names -- not page numbers in isolation.
- **Version and date stamps:** Add a "Last verified with product version [X.X]" note to each chapter or each task. For products that ship frequent updates, this is critical -- stale documentation is worse than no documentation because users follow wrong steps with confidence.
- **Cross-reference discipline:** Every task that depends on another task includes a cross-reference in its prerequisites section. Every task that leads naturally to another task includes a "Next step:" link at the end. Cross-references should be explicit ("see **Creating Your First Campaign** in the Email Campaigns chapter") not vague ("see documentation for more details").
- **Getting Help section:** Every guide ends with a clear, structured getting-help section. Include: primary support channel with response time expectations, community or forum link if available, escalation path for urgent issues, and status page URL for service availability. Never leave the user in a dead end.
- **Feedback mechanism:** If the documentation platform supports it, add a "Was this helpful? Yes / No" prompt at the end of each task. This generates the signal needed to prioritize updates. If the platform does not support it, include the support email address.

---

### Step 8: Review the Draft Against Quality Criteria

Before delivering the guide, run it through these specific checks. Do not rely on the user to catch these -- the AI should self-check.

- **Label accuracy check:** Every bolded UI element name should be verifiable against the product. If you are writing without product access, flag every bolded label with `[VERIFY LABEL]` so the user knows which items to audit against the actual interface.
- **Step count check:** Any task with more than 12 steps should be split. Flag it.
- **Prerequisite completeness check:** Every step that requires something (a permission, a prior configuration, an existing record) must have that requirement stated in the prerequisites. Walk through each task mentally and identify every hidden assumption.
- **Second-person consistency check:** Every sentence addressing the user uses "you" or imperative voice. No "the user should", no "one can", no passive constructions where the subject is omitted ("Click Save" is acceptable imperative; "Save should be clicked" is passive and unacceptable).
- **Goal and result completeness check:** Every task has a goal statement at the top and a result statement at the bottom. Neither is optional.
- **Troubleshooting coverage check:** Every task has at least 2 troubleshooting entries. Tasks involving external integrations, payment processing, email delivery, or file uploads typically need 4-5 entries because failure modes multiply.

---

## Output Format

```markdown
# [Product Name] User Guide

*Version: [Product version this guide was verified against]*
*Last verified: [Month Year]*

---

## Before You Start

### System Requirements

| Requirement | Minimum |
|-------------|---------|
| Browser | [Specific browser names and versions] |
| Operating System | [OS and version if applicable] |
| Network | [Connectivity requirements] |
| Screen resolution | [Minimum if relevant] |

### Required Permissions

To complete the tasks in this guide, you need the **[Role Name]** role or higher.

To check your role: Go to **[Navigation path]** and locate your name in the **[Field name]** column.

If you do not have the required role, contact your [Account Owner / Administrator / IT team] to request access.

### Key Concepts

- **[Term]:** [One-sentence plain-language definition. Avoid using the term in its own definition.]
- **[Term]:** [Definition]
- **[Term]:** [Definition]
- **[Term]:** [Definition]
- **[Term]:** [Definition]

### What This Guide Covers

This guide covers [high-level description of scope]. It does not cover [explicitly excluded topics].

For [excluded topic], see [where to find it].

---

## Chapter 1: [Task Group Name, written as user goal]

[One or two sentence chapter introduction describing what this group of tasks helps the user accomplish and who performs them.]

### [Task Name -- action-verb phrase, e.g., "Create a New Project"]

**Goal:** [One sentence: what the user will have accomplished after completing this task.]

**Prerequisites:**
- [Condition 1. Link to where user can meet this condition if needed.]
- [Condition 2]
- [Condition 3 if applicable]

**Applies to:** [Role name(s)] | **Platform:** [Web / Mobile / Desktop / All]

---

**Steps:**

1. Navigate to **[Section name]** by selecting **[Menu item]** from the **[Location, e.g., left sidebar / top navigation / Settings menu]**.
   - You should see: [Description of what the screen looks like at this starting point.]

2. Click **[Button or link label]** in the **[Location on page]**.
   - You should see: [Screen change or dialog that appears.]

3. Enter [what to enter] in the **[Field label]** field.
   - [Guidance note about this field: format requirements, character limits, what the value is used for.]
   - **Tip:** [Optional efficiency tip if applicable.]

4. Select **[Option name]** from the **[Dropdown / menu / list name]** dropdown.
   - If [condition applies]: Select **[Alternative option]** instead.

5. [Action step.]
   - **Important:** [Required information the user must know before performing this action.]

6. [Action step leading to a critical, non-obvious result.]
   - You should see: [Exact description of what changes on screen.]

7. Click **[Final confirmation button]**.
   - You should see: [Confirmation message, success state, or redirect.]

**Result:** [Describe the completed state. What appears in the UI. What changed in the system. How long any asynchronous processes take. How the user knows the task succeeded.]

**Next step:** To [related task], see **[Task Name]** in this chapter.

---

**Troubleshooting:**

| Problem | Cause | Fix |
|---------|-------|-----|
| [Exact error message or symptom as the user sees it] | [Plain-language cause] | [Exact fix steps] |
| [Symptom] | [Cause] | [Fix] |
| [Symptom] | [Cause] | [Fix] |

---

### [Next Task Name]

[Same structure repeats for each task]

---

## Chapter 2: [Next Task Group]

[Chapter introduction]

### [Task Name]

[Full task structure as above]

---

## Troubleshooting

### Quick Reference

| I see this... | Try this first |
|---------------|----------------|
| [Error message or symptom] | [Single-sentence first fix] |
| [Error message or symptom] | [Single-sentence first fix] |
| [Error message or symptom] | [Single-sentence first fix] |
| [Error message or symptom] | [Single-sentence first fix] |
| [Error message or symptom] | [Single-sentence first fix] |

### [Error or Symptom, bolded and copied exactly from the interface]

**What you see:** [Exact error message or symptom.]

**Why this happens:** [Plain-language cause.]

**To fix this:**

1. [Step]
2. [Step]
3. [Step]

**If this does not work:** [Escalation path with specifics -- what information to provide to support, which support channel to use.]

---

## Getting Help

| Type of help | Where to get it | Response time |
|--------------|-----------------|---------------|
| [General support] | [Channel] | [SLA or typical time] |
| [Urgent issues] | [Channel] | [SLA] |
| [Community questions] | [Forum or community] | [Varies] |
| [Service status] | [Status page] | [Real-time] |

[If contacting support, include your account email and the error code shown in the error message. This reduces resolution time.]
```

---

## Rules

1. **Never organize documentation by product feature or menu hierarchy.** Users come to documentation knowing what they want to accomplish, not knowing the product's architecture. A chapter titled "Invoice Management Module" fails users; a chapter titled "Billing and Payments" succeeds because it matches how users think about their work.

2. **Never combine two actions into a single step.** The one-action-per-step rule is absolute. If you write "Click **Save** and then click **Close**", split it immediately into two steps. This rule exists because users follow steps in real time -- a combined step breaks their rhythm and causes them to miss the second action.

3. **Never paraphrase a UI label.** If the button says "Save Changes", the documentation says **Save Changes** -- not **Save**, not **Apply**, not "the save button". Users are scanning a screen looking for the exact text you wrote. A paraphrase causes them to lose their place and lose confidence in the documentation.

4. **Never include a step without a navigation path.** "Click **Export**" is insufficient. "Click **Export** in the top-right corner of the **Reports** page" gives the user a location. Navigation paths prevent the single most common user complaint: "I couldn't find where to click."

5. **Never write "contact support" as the only resolution for a user-resolvable problem.** If a user can fix the issue by clearing their browser cache, switching browsers, waiting 5 minutes, or checking a setting, tell them to do that first. Premature escalation to support wastes the user's time and the company's resources.

6. **Always include a goal statement and result statement for every task.** These two bookends are non-negotiable. The goal statement tells the user whether they are in the right procedure before they start. The result statement tells them whether they succeeded after they finish. A procedure without these two elements fails both navigation and completion validation.

7. **Always flag UI labels you could not verify against the actual product interface.** Write `[VERIFY LABEL]` after any bolded label you are uncertain about. Inaccurate labels are more damaging than missing documentation -- they actively break the user's trust and make subsequent steps impossible to follow.

8. **Use Warning callouts sparingly and only for genuinely irreversible actions.** The threshold is: would a user be upset or harmed if they did not read this? Deleting account data: Warning. Archiving a record that can be unarchived: Note at most. Warning callout inflation desensitizes users to all warnings, including the ones that matter.

9. **Keep troubleshooting entries symptom-first, not cause-first.** Users arrive at troubleshooting tables knowing what they see, not what caused it. "Error: Sender not verified" as a problem entry is correct; "Email domain not authenticated" as a problem entry is wrong because it describes the cause, not the symptom. Users cannot match cause-based entries to their experience.

10. **Never reference specific version numbers in step-level instructions.** "In version 3.4, click **Export**" creates documentation that becomes wrong the moment the next release ships. Describe UI elements by their label and position. If behavior genuinely differs by version, add a note at the chapter level: "This chapter applies to version 3.x. For version 2.x instructions, see [location]."

11. **Write in second person, present tense, active voice throughout.** "You select **Export**" is correct. "The user should select Export" is wrong (third person). "Export can be selected" is wrong (passive). "Select **Export**" is correct imperative. Passive voice in documentation creates ambiguity about who performs the action and slows comprehension for users reading in a second language.

12. **Cap each task at 12 numbered steps.** If your step count reaches 13, treat it as a structural signal that you have two tasks, not one. Split at the natural midpoint, give each task a descriptive name, and link them with a cross-reference. This cap also serves as a usability benchmark -- research into procedural documentation shows user completion rates drop significantly when step counts exceed 10-12.

---

## Edge Cases

### Multi-role product with divergent workflows

When a product serves two or more user roles (administrator, standard user, read-only viewer) whose workflows for the same task differ significantly, do not attempt to combine them into one procedure with conditionals. The branching logic becomes impossible to follow.

Write separate procedures for each role. At the chapter level, include a role matrix table showing which tasks apply to which roles. At each task, include an "Applies to:" line immediately after the goal statement. If the workflows share more than 80% of their steps, consider writing the shared steps once, then writing role-specific sections for the divergent steps using a clear heading: "**If you are an Administrator:** [steps]. **If you are a Standard User:** [steps]."

Never bury role restrictions in step 7 of a 10-step procedure. A standard user who discovers in step 7 that they cannot complete the task is a user who will call support angry.

### Product with web and mobile interfaces

Platform differences must be handled explicitly. When the workflow is essentially the same but UI elements differ (e.g., a sidebar menu on web becomes a bottom navigation tab on mobile), use inline platform labels on the specific step that differs:

"[Web] Click **Reports** in the left sidebar. [Mobile] Tap the **Reports** icon in the bottom navigation bar."

When the workflow differs substantially -- different features available, different step sequences, different UI paradigms -- write entirely separate procedures. Label each procedure's platform scope at the task level ("Platform: Web only" or "Platform: iOS and Android"). Do not force a single procedure to serve both platforms when the user experience is meaningfully different.

### Highly configurable product with many optional settings

Document the default or most common configuration as the primary procedure. Optional settings and customization belong in a dedicated subsection at the end of the task titled "Optional: Customize [task name]" or in a separate "Advanced Configuration" chapter.

Mixing required steps with optional configuration choices creates cognitive overload for new users and causes them to abandon procedures at the configuration branches. The rule: if a step is optional, it is either in a clearly labeled optional section or it is its own separate task.

### Product with frequent release cycles (biweekly or monthly updates)

Add a "Last verified" date to every chapter header. Use this format: `*This chapter was last verified against [Product Name] version [X.X], released [Month Year].*`

Avoid describing visual appearance in steps (icon color, button shape, font size) -- these change without notice. Describe elements by their label and screen position instead. For products with changelogs, monitor the changelog for any task whose steps depend on a changed feature and flag those tasks for immediate update.

Consider adding a "Recent changes" section at the front of the guide that notes documentation-relevant changes from the last two product releases. This is especially valuable for users who learned the product on an earlier version.

### Legacy migration documentation

When users are migrating from a previous product or older version, include a "Migrating from [Previous Product/Version]" section either as a standalone chapter or as a sidebar per task. Use a two-column format:

| In [Old Product/Version], you... | In [New Product/Version], you... |
|----------------------------------|----------------------------------|
| Clicked **New Invoice** from the home screen | Click **Create** then select **Invoice** |
| Exported CSV from **Reports > Downloads** | Click **Export** on any report page |

Keep migration guidance time-limited. Once the majority of users have migrated, remove or archive migration content -- it becomes noise for users who were never on the old system.

### Offline or limited-connectivity scenarios

Identify which tasks require continuous internet connectivity and which can be completed offline or with intermittent connectivity. Document this at the task level under prerequisites: "**Network requirement:** Active internet connection required."

For tasks that can fail mid-completion due to connectivity loss, document the recovery procedure as part of that task's troubleshooting section. Be specific about what state the system is in after a connectivity failure: "If your connection drops after clicking **Submit**, your form data is saved as a draft in **Drafts**. Do not re-submit -- check **Drafts** first to avoid duplicate submissions."

### Documentation for an API-backed product where UI labels change based on user data

Some products render interface labels dynamically based on the user's data -- a button might say "Upgrade to Pro" for a free user and "Manage Subscription" for a paid user. Document the most common state (typically the paid/active state for a user who has completed setup), and call out dynamic labels explicitly: "This button displays differently depending on your subscription status. If you see **Upgrade to Pro** instead, your account is on the free plan -- see Upgrading Your Account."

### Accessibility and internationalization requirements

If the guide will be translated or used by non-native English speakers, apply plain language principles aggressively: sentences under 25 words, no idioms or metaphors ("hit the button" becomes "click the button"), no ambiguous pronouns. Use consistent terminology throughout -- pick one term for each concept and never vary it. "Workspace", "project space", and "environment" must not all refer to the same thing.

If accessibility callouts are required (for screen reader users or users with visual impairments), document keyboard shortcuts alongside mouse instructions: "Click **Save**, or press **Ctrl+S** (Windows) / **Cmd+S** (Mac)." Describe what icon-only buttons do rather than referencing the icon's appearance.

---

## Example

**Input from user:** "I need a user guide section for a project management tool called Fieldwork. The task is creating a new project and adding team members. Our users are operations managers at mid-size construction companies -- they are comfortable with software but not technical. The tool is web-based."

---

**Output:**

---

# Fieldwork User Guide

*This chapter was last verified against Fieldwork version 4.2, released March 2025.*

---

## Before You Start

### System Requirements

| Requirement | Minimum |
|-------------|---------|
| Browser | Chrome 110+, Firefox 115+, Safari 16+, Edge 110+ |
| Network | Active internet connection required for all features |
| Screen resolution | 1280 x 720 recommended |

### Required Permissions

To create projects and add team members, you need the **Project Creator** role or the **Account Owner** role.

To check your role: Go to **Settings > Team & Permissions** and find your name in the **Role** column.

If your role shows **Viewer** or **Member**, contact your Fieldwork Account Owner to request elevated permissions before proceeding.

### Key Concepts

- **Project:** A container for all work, documents, timelines, and team members associated with a single job site or contract. Each project is separate -- team members, files, and schedules do not carry over between projects automatically.
- **Team Member:** Anyone invited to a project in Fieldwork. Team members can be internal employees or external subcontractors. Each team member has a role that controls what they can see and edit within the project.
- **Project Role:** A permission level assigned to each team member within a specific project. Project roles are separate from account-level roles. A person can be an Account Owner and still have read-only access to a specific project if assigned the Viewer project role.
- **Workspace:** Your company's Fieldwork account environment. All projects, team members, and billing are managed within a single workspace.
- **Draft Project:** A project that has been created but not yet marked as Active. Draft projects are not visible to team members until you activate them.

### What This Guide Covers

This chapter covers creating projects and managing team membership in Fieldwork. It does not cover creating project schedules, uploading documents, or managing subcontractor invoices. For those topics, see **Chapter 3: Scheduling** and **Chapter 5: Billing and Invoicing**.

---

## Chapter 1: Setting Up and Managing Projects

Operations managers use projects in Fieldwork to organize all work related to a single job site, bid, or contract. This chapter covers the full project lifecycle from creation through archiving.

---

### Create a New Project

**Goal:** Create a new project in Fieldwork so your team has a shared workspace for a job site, with the correct details and settings configured before you invite members.

**Prerequisites:**
- You have the **Project Creator** or **Account Owner** role. (See Before You Start > Required Permissions to check.)
- You have the project name, job site address, and approximate start date available.
- If this project is associated with a client, the client must already exist in Fieldwork. (See **Add a Client Record** in Chapter 4: Clients if you need to create one first.)

**Applies to:** Project Creator, Account Owner | **Platform:** Web

---

**Steps:**

1. Select **Projects** from the left sidebar.
   - You should see: the Projects dashboard listing all existing projects, with a search bar at the top and a **+ New Project** button in the upper-right corner.

2. Click **+ New Project** in the upper-right corner of the Projects dashboard.
   - You should see: the New Project setup panel slides in from the right side of the screen.

3. Enter the job site or contract name in the **Project Name** field.
   - Project names must be unique within your workspace. If you manage multiple phases of the same job, include the phase in the name: "Riverside Development -- Phase 2" rather than just "Riverside Development".
   - Maximum 80 characters.

4. Enter the full job site address in the **Site Address** field.
   - Begin typing the street address. Fieldwork auto-suggests matching addresses from Google Maps -- select the correct address from the dropdown rather than typing it manually, to ensure the map view in your project is accurate.
   - If the site does not have a street address (rural sites, undeveloped land), type the nearest town or GPS coordinates and then manually adjust the map pin in the next step.

5. Click the **Start Date** field and select the projected project start date from the calendar picker.
   - **Note:** The start date is used to anchor your project schedule. You can change it later without losing any scheduled tasks -- Fieldwork will ask whether to shift all task dates proportionally.

6. Select the project type from the **Project Type** dropdown.
   - Options include: Commercial New Build, Commercial Renovation, Residential New Build, Residential Renovation, Infrastructure, and Other.
   - **Important:** The project type affects which default inspection checklists and document templates are applied to your project. Select the type that most closely matches this job -- you can add or remove individual templates after the project is created.

7. Click **Create Project** at the bottom of the setup panel.
   - You should see: a green confirmation banner at the top of the screen reading "Project created successfully." The project opens automatically in Draft status.

**Result:** Your new project appears in the Projects dashboard and opens to the project Overview page. The status badge in the upper-left of the project reads **Draft**. The project is not yet visible to team members -- you must add team members (see the next task) and then activate the project before your team can access it.

**Next step:** To invite team members to this project, see **Add Team Members to a Project** below.

---

**Troubleshooting:**

| Problem | Cause | Fix |
|---------|-------|-----|
| **+ New Project** button is grayed out and unclickable | Your account role does not have Project Creator permissions | Contact your Fieldwork Account Owner to request the Project Creator role, or ask them to create the project for you |
| "A project with this name already exists" error appears after clicking **Create Project** | Another project in your workspace uses the same name | Modify the project name to make it unique -- adding a date, phase number, or contract number is a common approach |
| The site address does not appear in the auto-suggest dropdown | The address is too new to appear in Google Maps, or the street name is misspelled | Type as much of the address as possible, select the closest match, and then manually drag the map pin to the correct location on the map that appears after project creation |
| The project does not appear in the Projects dashboard after creation | Browser cache issue | Refresh the page using Ctrl+R (Windows) or Cmd+R (Mac). If the project still does not appear, log out and log back in. |

---

### Add Team Members to a Project

**Goal:** Invite team members -- employees or subcontractors -- to your project and assign them the correct project roles so they can access the information they need.

**Prerequisites:**
- A project exists in Fieldwork and you have Owner or Manager project-level access to it. If you just created the project, you automatically have Owner access.
- You have the email addresses of the people you want to invite.
- For subcontractors being added as external members: they will receive an invitation email and must create a free Fieldwork account if they do not already have one. Inform subcontractors to expect the email before you send invitations to reduce confusion.

**Applies to:** Project Creator, Account Owner, Project Manager (project-level role) | **Platform:** Web

---

**Steps:**

1. Open the project by clicking its name in the **Projects** dashboard.
   - You should see: the project Overview page with the project name in the header and a horizontal tab bar below it showing Overview, Schedule, Files, Team, and Settings.

2. Click the **Team** tab in the project tab bar.
   - You should see: the Team page showing any team members already added. If you just created the project, only your own name appears.

3. Click **+ Add Member** in the upper-right corner of the Team page.
   - You should see: the Add Team Member dialog with an email field and a role dropdown.

4. Enter the team member's work email address in the **Email Address** field.
   - If the person already has a Fieldwork account in your workspace (they appear on other projects), their name will auto-populate as you type. Select their name from the dropdown to add them instantly without sending a new invitation email.
   - If the person is new to your workspace, enter their full email address. They will receive an invitation email.

5. Select the appropriate role from the **Project Role** dropdown.

   Use this table to select the correct role:

   | Project Role | What they can do |
   |--------------|-----------------|
   | Owner | Full access: edit all settings, add/remove members, delete project |
   | Manager | Edit schedules, upload files, manage tasks, view billing |
   | Member | View schedules, upload files assigned to them, complete tasks |
   | Viewer | Read-only access to schedule and files -- cannot edit anything |

   - Assign **Viewer** to clients or inspectors who need to see progress but should not make changes.
   - Assign **Manager** to site supervisors who need to update schedules and upload inspection documents.
   - **Warning:** The **Owner** role allows the user to delete the project and remove other owners. Assign it only to people who need administrative control of the project.

6. Click **Send Invitation** (for new Fieldwork users) or **Add to Project** (for existing users already in your workspace).
   - You should see: the team member's name or email address appears in the team list with a **Pending** badge if an invitation was sent, or an active status if they were already a workspace member.

7. Repeat steps 3 through 6 for each additional team member.

8. When you have added all team members, click the **Overview** tab to return to the project overview.

**Result:** Each invited team member receives an email invitation with a link to the project. Existing workspace members receive a notification in Fieldwork. All added members appear on the **Team** tab -- invited members show a **Pending** badge until they accept. Once you have added your team, activate the project by clicking **Activate Project** on the Overview tab so team members can begin accessing it.

**Note:** You can add or remove team members at any time after the project is activated. Removing a member immediately revokes their access -- they cannot view or edit the project after removal.

**Next step:** To make the project visible and accessible to your team, see **Activate a Project** in this chapter.

---

**Troubleshooting:**

| Problem | Cause | Fix |
|---------|-------|-----|
| The team member says they did not receive the invitation email | Email went to spam, or was blocked by their company email filter | Ask them to check their spam folder for an email from noreply@fieldworkapp.com. If not found, return to the **Team** tab, find their name with the **Pending** badge, click the three-dot menu next to their name, and select **Resend Invitation** |
| "This email is already a member of this project" error | The person was added to the project previously, possibly under a different role | Scroll the Team list to find their existing entry. To change their role, click the three-dot menu next to their name and select **Edit Role** |
| The **+ Add Member** button does not appear on the Team tab | Your project role is **Member** or **Viewer** -- only Owners and Managers can add team members | Contact the project Owner to add the team member, or ask the Owner to upgrade your project role to Manager |
| A subcontractor says they cannot access the project after accepting the invitation | Their invitation link may have expired (links expire after 7 days) | Go to **Team**, find their **Pending** entry, click the three-dot menu, and select **Resend Invitation** to generate a new link |

---

## Troubleshooting

### Quick Reference

| I see this... | Try this first |
|---------------|----------------|
| "You don't have permission to perform this action" | Check your account role in **Settings > Team & Permissions** -- you may need elevated permissions |
| Project is missing from the Projects dashboard | Use the search bar to find it by name -- it may be archived. Or confirm with the project Owner that you have been added to the project. |
| "Session expired" message | Log out and log back in. Your work auto-saves every 30 seconds in most forms -- check for a Draft before re-entering data. |
| Invitation email not received | Check spam for email from noreply@fieldworkapp.com. If not found, ask the project Owner to resend from the Team tab. |
| Page loads but content is blank or incomplete | Hard-refresh the browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac) to bypass cached content. |

---

## Getting Help

| Type of help | Where to get it | Response time |
|--------------|-----------------|---------------|
| General questions and how-to help | Fieldwork Help Center (accessible from the **?** icon in the bottom-left of any Fieldwork page) | Self-service, available 24/7 |
| Account or billing issues | Email support at the address listed in **Settings > Help & Support** | 1 business day |
| Urgent issues affecting your entire team | Phone support number listed in **Settings > Help & Support** | Same business day |
| Feature requests and peer advice | Fieldwork Community Forum (linked from the Help Center) | Varies |

When contacting support about a technical error, include: your account email address, the project name, the exact error message you saw, and the date and time the issue occurred. This information allows the support team to locate your account records and resolve the issue faster.
