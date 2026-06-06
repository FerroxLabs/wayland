---
name: template-library-builder
description: |
  Builds a personal template library by identifying recurring document types,
  defining reusable structures, and creating fill-in-ready templates with
  variable placeholders. Use when the user wants to create templates for
  documents they write repeatedly, build a personal template collection, or
  standardize recurring written outputs. Do NOT use for enterprise template
  management systems, email template sequences (use `email-template-system`),
  or business process documentation (use business operations skills instead).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "automation template planning"
  category: "productivity"
  subcategory: "automation"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Template Library Builder

## When to Use

Use this skill when the user describes any of the following situations:

- The user explicitly says they rewrite the same document type from scratch repeatedly -- common triggers include phrases like "I write the same thing every week," "I copy an old version and replace things," or "it takes me an hour but it should take 10 minutes"
- The user wants to audit all their recurring written outputs and systematize them into a single, organized, maintained library
- The user is starting a new role, freelance practice, or project-based workflow and wants to build good documentation habits before patterns calcify into inefficiency
- The user has informal "templates" scattered across email drafts, local folders, or documents titled "COPY THIS v3 FINAL" and wants to replace that chaos with a real library
- The user produces documents for multiple audiences (clients, managers, direct reports, vendors) and finds themselves translating the same underlying information into different formats for each
- The user has just gone through a major role, process, or tool change and needs to rebuild their document library from scratch with fresh conventions
- The user tracks their time and has noticed that document creation is consuming a disproportionate share of their week -- often 20% or more of administrative output time

**Do NOT use this skill when:**

- The user needs email marketing sequences, drip campaigns, or nurture flows -- use `email-template-system` instead, which handles dynamic personalization tokens, send logic, and deliverability considerations that this skill does not cover
- The user needs enterprise content management, version control across teams, or permission-based document governance -- those scenarios require dedicated tools (SharePoint, Confluence, Notion for Teams) and a systems design approach beyond the scope of a personal library
- The user is asking specifically about code boilerplate, scaffolding, or code generation templates -- use software development and code scaffolding skills instead, which handle syntax, language conventions, and project structure
- The user wants standard operating procedures (SOPs), process maps, or workflow documentation -- use business process documentation skills instead, which handle flowcharts, decision trees, and cross-functional hand-offs
- The user needs legal document templates with jurisdiction-specific clauses -- this requires a lawyer and a legal drafting tool; do not produce legal templates through this skill
- The user wants to automate template population programmatically (mail merge, API-driven document generation) -- that is a software automation problem, not a personal library problem
- The user only creates a single document type occasionally (fewer than once per month) -- the overhead of building and maintaining a formal template is not justified; help them create a single well-structured document instead

---

## Process

### Step 1: Conduct a Document Inventory Interview

Before building anything, map the user's actual output landscape. Ask targeted questions to surface documents they may not think to mention:

- "Walk me through a typical work week -- which documents do you produce, touch, or send?"
- "Which reports or updates do you send on a fixed schedule -- daily, weekly, monthly, quarterly?"
- "What documents do you create at the start of a new project, client engagement, or relationship?"
- "What do you produce at the end of a project, sprint, or period?"
- "Are there documents you always send in response to a specific trigger? A new inquiry, a complaint, an approval?"
- Prompt for categories users forget: meeting summaries, status updates, proposals, invoices, onboarding materials, reference documents, performance reviews, vendor evaluations, briefs, agendas

For each document surfaced, capture five attributes:
  - **Name and purpose:** What is this document called, and what decision or action does it enable?
  - **Frequency:** Exact count per month (not "often" -- press for a number)
  - **Time to create from scratch:** Minutes, estimated honestly -- most people underestimate by 30-40%
  - **Audience and delivery method:** Who receives it, and how (email, shared drive, Slack, printed)
  - **Structure consistency:** On a scale of 1-5, how similar is the structure between instances? (1 = starts fresh every time, 5 = identical structure, content is the only thing that changes)

### Step 2: Score and Prioritize Template Candidates

Not every recurring document justifies a template. Apply the Template Value Score (TVS) formula to each candidate:

**TVS = (Structure Consistency × Frequency_per_month × Minutes_per_creation) ÷ 100**

Interpretation thresholds:
- TVS ≥ 10: High-priority -- build this template first
- TVS 4-9: Medium priority -- build after high-priority templates
- TVS 1-3: Low priority -- consider a skeleton outline rather than a full template
- TVS < 1: Not worth templating -- help the user write a strong single version instead

Example scoring: A weekly status update with consistency 4, frequency 4, and 30 minutes per creation scores (4 × 4 × 30) ÷ 100 = 4.8 -- medium-high priority.

After scoring:
- Select the top 5-8 documents for full template development (building more than 8 in one session leads to superficial templates and library abandonment)
- Flag any documents below TVS 1 and explain the reasoning to the user -- don't build templates for them
- If two documents share 70% or more of their structure, flag them as merge candidates -- one master template with conditional sections is better than two near-identical templates

### Step 3: Analyze Document Anatomy for Each Candidate

For each selected document, ask the user to walk you through 2-3 real recent instances or describe what the document contains. If they can paste a recent version, that is ideal. Systematically classify every element:

**Fixed content** -- Stays verbatim or near-verbatim every time:
  - Section headers and subheaders
  - Standard opening and closing language ("I hope this finds you well" or "Please review and advise")
  - Legal disclaimers, confidentiality notices, or required regulatory language
  - Structural formatting (table layouts, numbered sections, signature blocks)

**Variable fields** -- Changes every instance and must be filled in fresh:
  - Names, dates, amounts, durations, locations, versions
  - Project-specific details, metrics, results, findings
  - Classify each variable as: **simple** (one value, easy lookup), **calculated** (requires arithmetic or data pull), or **narrative** (requires thinking and writing, not just retrieval)

**Conditional sections** -- Present in some instances, absent in others:
  - Identify the exact condition that triggers each section ("include this if the budget is over $10,000")
  - Note the default state: is this section more often included or excluded?
  - Conditional sections represent the highest-value template element -- they prevent the user from either always including irrelevant content or forgetting to include relevant content

**Boilerplate text with minor variation** -- A paragraph that is always included but with 2-3 words that change:
  - These become the richest template elements -- fixed prose with 1-3 embedded placeholders
  - Example: "The project is currently tracking {{on_schedule | behind_schedule | ahead_of_schedule}} against the original baseline of {{original_completion_date}}."

Cap variable fields at 15 per template. If analysis reveals more than 15, the document has two distinct logical sections -- split it into a parent template and a sub-template, or use a reference block approach where one section calls out to a separate reference card.

### Step 4: Write the Template

Build each template in this order to ensure quality:

1. **Write all fixed content first** -- full sentences, proper formatting, real language. Do not use brackets as placeholders for fixed content.
2. **Insert variable placeholders** using `{{snake_case_name}}` syntax. Names must be self-explanatory without context: `{{project_name}}` not `{{pn}}`, `{{budget_approved_usd}}` not `{{budget}}`.
3. **Add conditional section delimiters** using this exact syntax:
   ```
   [IF condition_name:
   ... section content with any embedded {{variables}} ...
   END IF]
   ```
4. **For narrative variables** -- variables that require actual writing, not lookup -- add a brief prompt inside the placeholder using a pipe: `{{executive_summary | 2-3 sentences summarizing the key outcome and what it means for the client}}`
5. **Review the completed template** against the last 3 real instances: does it produce those documents when filled in? If a recent instance has content the template cannot accommodate, you have missed a structural element -- revise.
6. **Write a one-paragraph usage note** explaining the exact trigger for using this template, any pre-work required (gather last week's task tracker data, pull the budget variance report), and what "done" looks like before sending.

### Step 5: Build the Fill-in Guide for Each Template

The fill-in guide transforms a template from a document into a repeatable workflow. For every variable:

| Column | What to Include |
|--------|----------------|
| Variable name | The exact `{{placeholder}}` as it appears in the template |
| Description | One sentence explaining what information belongs here |
| Example value | A realistic, non-sensitive example that shows format and level of detail |
| Source | Exactly where the user finds this information (specific tool, report, person, calculation) |
| Type | Simple / Calculated / Narrative |
| Validation | Any check the user should perform before filling in (e.g., "Confirm with PM before inserting") |

For **calculated variables**, write the full calculation in the Source column -- for example: "Divide actual spend (from Expense Tracker > Monthly Summary) by approved budget (from Project Charter, line 4). Multiply by 100 for percentage."

For **narrative variables**, provide a sentence-starter or structural guide -- for example: "Two to three sentences. Lead with the most significant accomplishment. Follow with its impact. End with the implication for next steps."

### Step 6: Organize and Name the Library

Structure determines whether a library actually gets used or becomes another neglected folder:

**Naming convention:** `[Audience]_[DocumentType]_[Cadence or Trigger]`
- Good: `Client_StatusUpdate_Weekly`, `Internal_BudgetVarianceReport_Monthly`, `Vendor_PurchaseOrderRequest_AsNeeded`
- Bad: `Weekly Update`, `Report Template`, `New Doc`

**Category structure** (use only what the user's document set actually requires):
- **Client-facing:** Anything that leaves the building toward paying clients or customers
- **Internal:** Reports, updates, memos intended for colleagues, managers, or leadership
- **Vendor and partner:** Outbound communications to suppliers, contractors, or partners
- **Administrative:** Forms, requests, approvals, scheduling, logistics
- **Personal:** Career documents, professional development, self-tracking

**Library index rules:**
- Sort primarily by frequency (most-used templates at the top)
- Include a "Last Used" column the user updates manually -- this is the early-warning system for templates drifting out of date
- Include a "Version" field using simple date versioning: `2026-01` means the template was last revised in January 2026
- Limit the library to 15 templates maximum for a personal collection -- beyond 15, the maintenance burden overtakes the time savings

### Step 7: Define the Maintenance Protocol

A template library without maintenance degrades within 6 months. Build a minimal, realistic maintenance system:

**Quarterly review (30 minutes per quarter):**
  - Open every template and compare against the most recent actual document produced using it
  - Check for: new standard content that has crept in, old boilerplate that is no longer accurate, changed audience or distribution, variables that are always the same value (these should become fixed content)
  - Flag templates not used in the past quarter for potential retirement

**Triggered updates (immediate, within 48 hours of trigger):**
  - Role or job title change
  - New client, project, or engagement type
  - Process or tool change (the CRM changed, the report now pulls from a different system)
  - Feedback that a document was unclear, incomplete, or formatted incorrectly
  - Regulatory or compliance change affecting standard language

**Retirement criteria:**
  - Template not used in 6 months with no planned future use
  - The document type has been eliminated from the user's workflow
  - A better template supersedes this one (archive, don't delete -- patterns may recur)

**Retirement process:** Move retired templates to an `_Archive` section at the bottom of the library index with a retirement date and reason. Never delete -- archived templates often serve as the starting point when a similar need re-emerges.

---

## Output Format

````
## Personal Template Library - [User Name or Role]

**Built:** [Date]
**Last Reviewed:** [Date]
**Total Templates:** [X]
**Estimated Monthly Time Savings:** [Y hours, calculated as sum of (time_saved_per_use × uses_per_month) for all templates]

---

### Library Index

| # | Template Name | Category | Frequency | TVS Score | Time Saved/Use | Version | Last Used |
|---|--------------|----------|-----------|-----------|----------------|---------|-----------|
| 1 | [Name] | [Category] | [X/month] | [score] | [X min] | [YYYY-MM] | [date] |
| 2 | [Name] | [Category] | [X/month] | [score] | [X min] | [YYYY-MM] | [date] |
| 3 | [Name] | [Category] | [X/month] | [score] | [X min] | [YYYY-MM] | [date] |

**Retirement Watch** (not used in 3+ months): [list any, or "None currently"]

---

### Template [N]: [Full Descriptive Template Name]

**Category:** [Client-facing | Internal | Vendor and partner | Administrative | Personal]
**TVS Score:** [score] ([High | Medium | Low] priority)
**Use when:** [Specific trigger -- what event, day, or condition causes you to open this template?]
**Do NOT use when:** [Specific exclusions -- when should the user write fresh instead?]
**Pre-work required:** [What to gather, pull, or confirm BEFORE opening the template]
**Estimated fill-in time:** [X] minutes (vs. [Y] minutes from scratch -- saves [Z] minutes per use)

#### Template Body

```
[Complete, copy-paste-ready template with full fixed content in place]
[Variable fields as {{descriptive_snake_case_name}}]
[Narrative variables as {{variable_name | guidance for what to write here}}]
[Conditional sections as:]
[IF condition_name:
... content including any {{embedded_variables}} ...
END IF]
```

#### Fill-in Guide

| Variable | Description | Example | Source | Type | Validation |
|----------|-------------|---------|--------|------|------------|
| `{{variable_1}}` | [What goes here] | [Realistic example] | [Exact source] | [Simple/Calculated/Narrative] | [Check before filling] |
| `{{variable_2}}` | [What goes here] | [Realistic example] | [Exact source] | [Simple/Calculated/Narrative] | [Check before filling] |

**Calculated variables -- full formulas:**
- `{{variable_name}}`: [Full step-by-step calculation with exact data sources]

#### Conditional Sections

| Condition Name | Trigger -- When to Include | Default State | Section Summary |
|---------------|---------------------------|---------------|----------------|
| [condition_name] | [Exact condition that triggers this section] | [Included by default / Excluded by default] | [What this section communicates] |

#### Post-Fill Checklist

Before sending or submitting this document, verify:
- [ ] All `{{placeholders}}` have been replaced -- search for `{{` to catch any missed fields
- [ ] Conditional sections: correct sections included, irrelevant ones removed
- [ ] [Any document-specific check, e.g., "Budget figure matches the approved PO"]
- [ ] [Audience check, e.g., "Client name on document matches the client in the email To: field"]
- [ ] Reviewed by: [self / manager / legal] before sending

---

### Maintenance Schedule

| Action | Cadence | Next Due Date | Trigger Event |
|--------|---------|---------------|---------------|
| Full library review | Quarterly | [date 3 months out] | Calendar reminder |
| Retire unused templates | Every 6 months | [date 6 months out] | Calendar reminder |
| Update after role change | Immediate | -- | Role or title change |
| Update after process/tool change | Within 48 hours | -- | New tool, system, or process |
| Update after negative feedback | Within 48 hours | -- | Document was unclear or wrong |

### Archived Templates

| Template Name | Archived Date | Reason | Restore If |
|--------------|---------------|--------|-----------|
| [Name] | [Date] | [Why retired] | [Condition under which it becomes relevant again] |
````

---

## Rules

1. **Every template must be copy-paste ready in its final form** -- no partial templates, no "fill in your own content here" instructions where actual template content belongs. If you cannot write the full fixed content because you lack context, ask the user for a real example before proceeding.

2. **Variable names must be self-documenting using `{{snake_case}}`** -- a person unfamiliar with the template must understand what belongs in each field from the name alone. `{{client_contact_first_name}}` is correct; `{{name}}`, `{{var3}}`, or `{{x}}` are not acceptable under any circumstances.

3. **Narrative variables must include inline writing guidance using the pipe syntax** -- `{{executive_summary | 2-3 sentences: lead with the key outcome, follow with its business impact}}`. Never leave a narrative variable as a bare placeholder; the guidance turns a blank into a writing prompt.

4. **The TVS formula must be applied to every candidate** -- never build a template based on user enthusiasm alone. If the TVS score is below 1, explain the math to the user and help them write a strong single document instead of a template. Overbuilding a library is as harmful as underbuilding one.

5. **Cap templates at 15 variables per template without exception** -- if analysis reveals more than 15 variable fields, the document is structurally compound. Split it: create a primary template plus a sub-template for the complex section, and reference the sub-template in the primary template's fill-in guide.

6. **Conditional sections must specify both the inclusion trigger and the default state** -- never leave conditions ambiguous. "Include this section if..." and "By default, this section is [included/excluded]" must both appear in the Conditional Sections table. Ambiguous conditions get ignored or misapplied.

7. **Every template must have a Post-Fill Checklist** -- the `{{placeholder}}` search instruction is mandatory in every checklist. Users routinely miss placeholders; an unfilled `{{client_name}}` in a client-facing document is a professional error that a two-second search prevents.

8. **Time savings estimates must be grounded in the user's stated numbers** -- never invent creation times. If the user says "maybe 45 minutes?" accept that estimate and use it. If they say they don't know, ask them to time themselves on the next instance and update the library afterward.

9. **Do not merge two documents into one template to save effort** -- if a weekly update and a monthly report have similar structures, they remain two separate templates. Different cadences, audiences, or purposes justify separate templates even when the structural overlap is high. The merge threshold is 70% structural overlap AND identical audience AND identical trigger.

10. **The library index sort order is by TVS score descending, not alphabetical** -- the user should see their highest-value templates first. An alphabetically sorted library buries the most-used templates and signals that the library is organized for filing, not for use.

11. **Archive, never delete** -- retired templates go to the Archive section with a date and reason. The pattern of a retired template almost always recurs in a modified form; starting from an archived template takes 10 minutes; starting from scratch takes 45.

12. **Sensitive fields must be explicitly marked in the fill-in guide** -- use [SENSITIVE] in the Validation column for any field containing personal data, financial figures, compensation, health information, or confidential business information. The post-fill checklist for any template with [SENSITIVE] fields must include an explicit verification step for those fields.

---

## Edge Cases

### The User Has Only One or Two Document Types

Do not treat this as a failure of inventory -- some roles genuinely produce one dominant document type. Respond by building that template with exceptional depth rather than breadth:

- Create two versions: a **Quick version** with only the 5-7 most critical variable fields for time-pressured situations, and a **Full version** with all sections and conditional blocks for standard use
- Add a more granular conditional section structure -- identify every variation that has occurred in the last 6 months and model each as a named conditional
- Include a "future templates radar" section at the bottom of the library: a running list of document types the user might eventually produce as their role evolves, with a note to revisit templating when frequency exceeds once per month

### Documents Vary Too Much to Template

When structure consistency scores 1-2 (nearly no structural similarity between instances), a content template will not help -- it will feel like a cage. Instead:

- Build a **Section Skeleton template**: a hierarchical outline with section names and one-sentence descriptions of what each section must accomplish, without any fixed prose
- Add **Decision Prompts** at the top: a brief set of questions the user answers before writing, whose answers determine which sections to include (e.g., "Is this a new client or an existing one? Is budget approved or TBD? Is this a competitive situation?")
- Include a **Checklist of Required Elements** rather than a template body -- every good instance of this document has these components, even if their order and form varies
- This approach captures the structural intelligence without over-constraining variable creative or analytical documents

### The User Already Has Templates That Are Outdated or Broken

Do not replace existing templates wholesale -- that destroys institutional knowledge embedded in them. Instead, conduct a template audit:

- Ask the user to share their current template alongside a recent actual document produced with it
- Diff the two: every element in the recent document that does not exist in the template is a gap; every template element not present in recent documents is potentially outdated boilerplate
- Classify each gap as: **New standard content** (add to fixed content), **New variable field** (add to variable section), **Structural change** (revise template structure)
- Classify each obsolete element as: **Retired** (remove), **Conditional** (keep but wrap in a conditional), **Clarification needed** (ask user before removing)
- Update the version date and add a change log entry at the bottom of the template: `[Version 2026-03: Added {{risk_register_link}} field; retired standard procurement disclaimer per new policy]`

### Templates Contain Sensitive, Confidential, or Regulated Information

Standard templates must never contain real sensitive data, even in example values:

- Mark every sensitive variable with [SENSITIVE] in the Validation column
- Example values for sensitive fields must be clearly synthetic: use `Acme Corp (example)` not a real company name, `$125,000 (example)` not a real figure, `Jane Smith (example)` not a real person
- Add a mandatory pre-send review step to the Post-Fill Checklist for templates with [SENSITIVE] fields: "Verify all [SENSITIVE] fields reflect actual, current, authorized values for this specific recipient"
- If the document type is subject to regulatory requirements (HIPAA, GDPR, SOX, PCI-DSS), add a compliance note to the template header and flag the template in the Library Index with a [REGULATED] tag -- these templates need legal or compliance review before any structural change
- Never include actual passwords, access credentials, encryption keys, social security numbers, account numbers, or health data in template examples under any circumstances

### The User Works Across Multiple Tools and Formats

When the user creates the same template type in Word, Google Docs, Notion, and email, design for portability:

- Write all templates in plain markdown first -- this is the canonical source
- Add a **Formatting Notes** section to each template's fill-in guide specifying what markdown elements map to what formatting in each tool: `## Header` becomes Heading 2 in Docs, H2 in Notion, bold + font size 14 in Word
- Add a **Post-Paste Checklist** specific to each tool the user uses, noting: table formatting (markdown tables paste as plain text in most word processors and need manual reformatting), bold/italic (usually preserved via clipboard), hyperlinks (test after pasting)
- If one tool is used for 80% or more of instances, produce the template in that tool's native format with markdown as a secondary reference

### The Library Has Grown Beyond 15 Templates

When a user comes with an existing library of 20-30 informal templates, the problem is not building new ones -- it is pruning and consolidating what already exists:

- Apply the TVS formula to all existing templates using current frequency and time data
- Any template with TVS below 1 is a retirement candidate -- surface this to the user with the math
- Look for consolidation opportunities: templates with 70%+ structural overlap and the same audience should be merged into one template with conditional sections
- Impose a hard cap at 15 active templates -- if more than 15 pass the TVS threshold, help the user identify which 15 deliver the highest total monthly time savings (TVS Score × uses per month is the ranking metric)
- Move the rest to the Archive with notes on when they would be promoted back to active status

### The User Wants to Share Templates With a Small Team

Personal template libraries are designed for a single user's workflow. When 2-5 people need to share templates, the design must account for variation across users:

- Add a **User-Specific Variables** section to the fill-in guide listing fields each individual user must customize for themselves (their own name, title, contact information, signature block)
- Add a **Shared Variables Register** -- a separate reference card listing the values for variables that are the same for all team members (company name, standard disclaimers, brand language) so the team maintains one source of truth
- Version control becomes critical: designate one owner per template who controls updates, and add a version date to every template header
- For teams larger than 5, this skill is no longer appropriate -- recommend a shared wiki tool (Notion, Confluence) with proper permission management

---

## Example

**Input:** "I'm a freelance project manager. I write weekly status updates to clients, send project proposals when I'm pitching new work, write a budget variance report every month, and send meeting recap emails after every client call. I also do a quarterly review document for ongoing retainers. I start from scratch every time and it's eating my afternoons."

**Inventory scoring:**

| Document | Consistency | Freq/mo | Min/creation | TVS |
|----------|------------|---------|-------------|-----|
| Weekly Client Status Update | 5 | 8 | 35 | 14.0 |
| Client Meeting Recap | 4 | 12 | 20 | 9.6 |
| Budget Variance Report | 5 | 2 | 45 | 4.5 |
| Project Proposal | 3 | 3 | 90 | 8.1 |
| Quarterly Retainer Review | 4 | 1 | 60 | 2.4 |

All five score above TVS 2 -- build all five, starting with the Weekly Status Update.

---

**Output:**

## Personal Template Library -- Freelance Project Manager

**Built:** 2026-06-15
**Last Reviewed:** 2026-06-15
**Total Templates:** 5
**Estimated Monthly Time Savings:** 19.7 hours

---

### Library Index

| # | Template Name | Category | Frequency | TVS Score | Time Saved/Use | Version | Last Used |
|---|--------------|----------|-----------|-----------|----------------|---------|-----------|
| 1 | Client_StatusUpdate_Weekly | Client-facing | 8/month | 14.0 | 25 min | 2026-06 | -- |
| 2 | Client_MeetingRecap_PostCall | Client-facing | 12/month | 9.6 | 15 min | 2026-06 | -- |
| 3 | Client_ProjectProposal_New | Client-facing | 3/month | 8.1 | 65 min | 2026-06 | -- |
| 4 | Internal_BudgetVariance_Monthly | Internal | 2/month | 4.5 | 30 min | 2026-06 | -- |
| 5 | Client_RetainerReview_Quarterly | Client-facing | 1/month | 2.4 | 45 min | 2026-06 | -- |

**Retirement Watch:** None currently

---

### Template 1: Client_StatusUpdate_Weekly

**Category:** Client-facing
**TVS Score:** 14.0 (High priority)
**Use when:** End of each work week -- every Friday before 4:00 PM for each active client project
**Do NOT use when:** The project is in active crisis (missed deadline, budget breach, client escalation) -- write a custom incident communication instead; also do not use for project closeout (use the Retainer Review template)
**Pre-work required:** Open task tracker and pull this week's completed items, current in-progress items, and any items that slipped. Pull the project schedule to confirm target dates. Note any items awaiting client response.
**Estimated fill-in time:** 10 minutes (vs. 35 minutes from scratch -- saves 25 minutes per update, 200 minutes per month per client)

#### Template Body

```
Subject: {{client_short_name}} Project Update -- Week of {{week_ending_date}}

Hi {{client_contact_first_name}},

Here is your project update for the week ending {{week_ending_date}}.

---

**Overall Status: {{status_indicator | Choose one: ON TRACK / AT RISK / NEEDS ATTENTION}}**

{{status_summary | 2-3 sentences. Lead with the most significant development this week. 
State what it means for the project trajectory. Flag anything the client needs to 
know before next week.}}

---

**Completed This Week**

- {{completed_1}}
- {{completed_2}}
- {{completed_3}}
[IF more_than_three_completions:
- {{completed_4}}
- {{completed_5}}
END IF]

---

**In Progress**

| Task | Owner | % Complete | On Track By |
|------|-------|------------|-------------|
| {{task_1_name}} | {{task_1_owner}} | {{task_1_pct}}% | {{task_1_target_date}} |
| {{task_2_name}} | {{task_2_owner}} | {{task_2_pct}}% | {{task_2_target_date}} |
| {{task_3_name}} | {{task_3_owner}} | {{task_3_pct}}% | {{task_3_target_date}} |

---

**Blockers and Risks**

[IF blockers_exist:
| Issue | Impact | Proposed Resolution | Resolution Owner | Target Date |
|-------|--------|---------------------|-----------------|-------------|
| {{blocker_1_description}} | {{blocker_1_impact | Low/Medium/High}} | {{blocker_1_resolution}} | {{blocker_1_owner}} | {{blocker_1_target}} |
END IF]
[IF no_blockers:
No blockers or risks to report this week.
END IF]

---

**Planned for Next Week**

- {{next_week_1}}
- {{next_week_2}}
- {{next_week_3}}

---

**Action Items Required from You**

[IF client_actions_needed:
The following items require your input or decision before work can proceed:

| Action | Details | Needed By |
|--------|---------|-----------|
| {{client_action_1}} | {{client_action_1_detail}} | {{client_action_1_deadline}} |
END IF]
[IF no_client_actions:
No action items from your side this week. I will be in touch if anything arises.
END IF]

---

Best regards,
{{your_name}}
{{your_title}}
{{your_email}} | {{your_phone}}
```

#### Fill-in Guide

| Variable | Description | Example | Source | Type | Validation |
|----------|-------------|---------|--------|------|------------|
| `{{client_short_name}}` | Client company name as they refer to themselves | Meridian Logistics | Contract header | Simple | Match exactly -- clients notice misspellings of their own name |
| `{{week_ending_date}}` | This Friday's date, written out | June 20, 2026 | Calendar | Simple | Confirm it is Friday's date, not today's if writing on Thursday |
| `{{client_contact_first_name}}` | First name of primary client contact | Rachel | Email thread or CRM | Simple | Confirm you are addressing the right person if the contact changed |
| `{{status_indicator}}` | Project health: ON TRACK, AT RISK, or NEEDS ATTENTION | ON TRACK | Your professional judgment | Simple | If AT RISK or NEEDS ATTENTION, the blocker section must be populated |
| `{{status_summary}}` | 2-3 sentence narrative summary | "This week we completed the discovery interviews and synthesized key findings into the requirements brief. The project remains on track for the July 11 milestone. Next week's user testing sessions are confirmed and materials are ready." | Your notes + task tracker | Narrative | Must address the status indicator -- if AT RISK, the summary must explain why |
| `{{completed_N}}` | Specific deliverable or milestone finished this week | Requirements brief v1 delivered and acknowledged | Task tracker | Simple | Use deliverable names, not task names -- "brief delivered" not "wrote brief" |
| `{{task_N_name}}` | Name of in-progress work item | User testing session design | Task tracker | Simple | -- |
| `{{task_N_owner}}` | Who is responsible for this task | You / Rachel (client) / Dev team | Task tracker | Simple | If owner is client-side, this is a soft reminder to them |
| `{{task_N_pct}}` | Honest percent complete estimate | 60 | Your estimate | Calculated | Round to nearest 10; never say 99% -- say 90% until it is done |
| `{{task_N_target_date}}` | When this task will be complete | June 27, 2026 | Project schedule | Simple | If target date has slipped, note the original date in the blocker section |
| `{{blocker_1_description}}` | Clear description of what is blocked | API documentation not yet provided by client's IT team | Your notes | Narrative | Be specific -- "waiting on client" is not an actionable blocker description |
| `{{blocker_1_impact}}` | How serious: Low, Medium, or High | High | Your judgment | Simple | High impact blockers must appear in the subject line addition: add "(Action Required)" to email subject |
| `{{client_action_N}}` | Specific action the client must take | Approve revised project schedule | Notes from last meeting | Simple | Every client action needs a deadline -- never leave the deadline blank |

**Calculated variables -- full formulas:**
- `{{task_N_pct}}`: Count completed sub-tasks for this item ÷ total sub-tasks × 100. If not using sub-tasks, estimate based on time elapsed vs. total estimated time for this task.

#### Conditional Sections

| Condition Name | Trigger -- When to Include | Default State | Section Summary |
|---------------|---------------------------|---------------|----------------|
| `more_than_three_completions` | More than 3 items were completed this week | Excluded | Additional completed items 4 and 5 |
| `blockers_exist` | Any task is blocked, slipped, or at risk | Excluded | Blocker table with impact, resolution, owner, and deadline |
| `no_blockers` | No tasks are blocked or at risk | Included | Single line confirming clean status |
| `client_actions_needed` | Client must do something before work can continue | Excluded | Table of required client actions with deadlines |
| `no_client_actions` | No client input required this week | Included | Single line releasing client from obligation this week |

#### Post-Fill Checklist

Before sending this update:
- [ ] Search the document for `{{` -- any remaining placeholder means a field was missed
- [ ] Status indicator matches the blocker section: AT RISK or NEEDS ATTENTION always has a populated blocker table
- [ ] All target dates are in the future (or explicitly flagged as slipped if past)
- [ ] Client contact name matches the person in the email To: field
- [ ] If any blocker has High impact, add "(Action Required)" to the email subject line
- [ ] Task percentages are honest -- do not adjust upward to appear more positive

---

### Template 2: Client_MeetingRecap_PostCall

**Category:** Client-facing
**TVS Score:** 9.6 (High priority)
**Use when:** Within 2 hours of ending any client call -- send while notes are fresh and client context is active
**Do NOT use when:** The meeting was an internal-only planning session (no client present); do not use for formal project closeout meetings (adapt the Retainer Review template instead)
**Pre-work required:** Your meeting notes open. Any documents shared during the call accessible. The client's calendar invite for the next meeting, if already scheduled.
**Estimated fill-in time:** 8 minutes (vs. 20 minutes from scratch -- saves 12 minutes per recap, 144 minutes per month)

#### Template Body

```
Subject: Recap -- {{meeting_title}} ({{meeting_date}})

Hi {{client_contact_first_name}},

Thank you for the time today. Here is a summary of what we covered and what happens next.

---

**Meeting:** {{meeting_title}}
**Date:** {{meeting_date}}
**Attendees:** {{attendee_list | Comma-separated list of all attendees with company affiliation in parentheses}}
**Duration:** {{meeting_duration_minutes}} minutes

---

**What We Discussed**

{{discussion_summary | 3-5 bullet points. One bullet per major topic. State what was discussed 
and what conclusion or decision was reached -- not just that the topic came up.}}

---

**Decisions Made**

[IF decisions_were_made:
| Decision | Made By | Effective |
|----------|---------|-----------|
| {{decision_1}} | {{decision_1_owner}} | {{decision_1_effective_date}} |
END IF]
[IF no_decisions:
No formal decisions were made. Items discussed are still in consideration -- see open questions below.
END IF]

---

**Action Items**

| # | Action | Owner | Due Date |
|---|--------|-------|----------|
| 1 | {{action_1}} | {{action_1_owner}} | {{action_1_due}} |
| 2 | {{action_2}} | {{action_2_owner}} | {{action_2_due}} |
[IF additional_actions:
| 3 | {{action_3}} | {{action_3_owner}} | {{action_3_due}} |
END IF]

---

**Open Questions**

[IF open_questions_exist:
The following questions were raised but not resolved during the call:

- {{open_question_1}} -- Following up by: {{followup_owner_1}} before {{followup_date_1}}
END IF]
[IF no_open_questions:
All questions raised during the call were resolved.
END IF]

---

**Next Meeting**

[IF next_meeting_scheduled:
{{next_meeting_date}} at {{next_meeting_time}} -- {{next_meeting_purpose | One sentence: what will we accomplish in this meeting?}}
END IF]
[IF next_meeting_not_scheduled:
Our next meeting is TBD. I will reach out with options by {{scheduling_followup_date}}.
END IF]

Best regards,
{{your_name}}
{{your_title}}
{{your_email}} | {{your_phone}}
```

#### Fill-in Guide

| Variable | Description | Example | Source | Type | Validation |
|----------|-------------|---------|--------|------|------------|
| `{{meeting_title}}` | Descriptive name for this meeting | Discovery Workshop -- Phase 2 Scope | Calendar invite title | Simple | Use a title that describes the meeting's purpose, not just "Call" |
| `{{meeting_date}}` | Full date of the meeting | June 18, 2026 | Calendar invite | Simple | -- |
| `{{attendee_list}}` | All participants with company | Rachel Voss (Meridian), Tom Keller (Meridian), You | Meeting attendees | Simple | Include every person present -- omissions cause awkward corrections |
| `{{meeting_duration_minutes}}` | Actual meeting length in minutes | 55 | Calendar invite or your timer | Simple | Use actual duration, not scheduled duration |
| `{{discussion_summary}}` | Key topics with outcomes | "Reviewed Phase 2 scope -- agreed to include mobile responsive design. Discussed timeline risks around API dependency." | Your meeting notes | Narrative | Each bullet must state the conclusion, not just the topic |
| `{{decision_N}}` | Specific, irreversible choice made | Approved expanded scope to include mobile responsive design | Meeting notes | Simple | Decisions are irreversible choices -- tentative agreements are open questions |
| `{{action_N}}` | Specific task with a deliverable | Share revised project schedule reflecting Phase 2 scope | Meeting notes | Simple | Every action must be specific enough that completion is unambiguous |
| `{{action_N_owner}}` | Person responsible for this action | Rachel (client) / You | Meeting notes | Simple | If owner is the client, the recap serves as their written commitment |
| `{{action_N_due}}` | Hard deadline for this action | June 25, 2026 | Agreed in meeting or your judgment | Simple | Never leave a due date blank -- if not discussed, propose one |
| `{{scheduling_followup_date}}` | When you will send next meeting options | June 20, 2026 | Your calendar | Simple | Should be within 48 hours of this email |

#### Conditional Sections

| Condition Name | Trigger -- When to Include | Default State | Section Summary |
|---------------|---------------------------|---------------|----------------|
| `decisions_were_made` | At least one formal decision was reached and agreed to by all parties | Excluded | Decision table with owner and effective date |
| `no_decisions` | Meeting was exploratory or advisory -- no commitments made | Included | Statement acknowledging items are still in consideration |
| `additional_actions` | More than 2 action items resulted from the meeting | Excluded | Third action item row |
| `open_questions_exist` | Questions were raised but not resolved | Excluded | List of open questions with follow-up owner and date |
| `no_open_questions` | All questions were resolved in the meeting | Included | Single line confirming clean resolution |
| `next_meeting_scheduled` | Next meeting is already on the calendar | Excluded | Date, time, and stated purpose of next meeting |
| `next_meeting_not_scheduled` | No next meeting is yet scheduled | Included | Commitment to send scheduling options by a specific date |

#### Post-Fill Checklist

Before sending:
- [ ] Search for `{{` -- no unfilled placeholders remain
- [ ] Every action item has a named owner and a specific due date (not "TBD" or "ASAP")
- [ ] Attendee list is complete -- count against the calendar invite attendees
- [ ] If any action item's owner is the client, verify the wording is professional and non-accusatory
- [ ] Next meeting section is populated with one of the two conditional options -- never leave both visible

---

### Template 3: Client_ProjectProposal_New

**Category:** Client-facing
**TVS Score:** 8.1 (High priority)
**Use when:** A prospective or existing client has expressed interest in a new project and has given you enough information to scope it meaningfully -- do not send a proposal before a discovery conversation
**Do NOT use when:** The client has not had a discovery conversation with you; the project is a change order to an existing engagement (write a scope change memo instead); the project requires subcontractors whose costs you have not confirmed
**Pre-work required:** Discovery call notes. Rough scope definition. Rate card. Any relevant past project actuals for estimating. Client's preferred format if they have specified one.
**Estimated fill-in time:** 25 minutes (vs. 90 minutes from scratch -- saves 65 minutes per proposal, 195 minutes per month)

#### Template Body

```
PROJECT PROPOSAL

Prepared for: {{client_company_name}}
Attention: {{client_contact_name}}, {{client_contact_title}}
Prepared by: {{your_name}}, {{your_title}}
Date: {{proposal_date}}
Proposal Reference: {{proposal_reference_id | Format: PROP-YYYY-MM-ClientInitials, e.g., PROP-2026-06-ML}}
Valid Through: {{proposal_valid_through_date | Typically 30 days from proposal_date}}

---

EXECUTIVE SUMMARY

{{executive_summary | 3-4 sentences. State: (1) the problem or opportunity this project 
addresses, (2) your proposed approach in plain language, (3) the key outcome the client 
will have when the project is complete, (4) one sentence on why you are the right person 
for this work.}}

---

PROJECT SCOPE

**Objective**
{{project_objective | One sentence. Starts with "To [verb]..." -- e.g., "To design and 
implement a vendor onboarding process that reduces onboarding time from 6 weeks to 2 weeks."}}

**Deliverables**

| # | Deliverable | Description | Delivery Date |
|---|-------------|-------------|---------------|
| 1 | {{deliverable_1_name}} | {{deliverable_1_description}} | {{deliverable_1_date}} |
| 2 | {{deliverable_2_name}} | {{deliverable_2_description}} | {{deliverable_2_date}} |
| 3 | {{deliverable_3_name}} | {{deliverable_3_description}} | {{deliverable_3_date}} |

**Out of Scope**
The following are explicitly excluded from this engagement:
- {{out_of_scope_1}}
- {{out_of_scope_2}}
[IF additional_exclusions:
- {{out_of_scope_3}}
END IF]

---

TIMELINE

**Project Duration:** {{project_duration | e.g., 6 weeks, from kickoff to final delivery}}
**Proposed Start Date:** {{proposed_start_date}}
**Proposed Completion Date:** {{proposed_completion_date}}

| Phase | Description | Duration | Dates |
|-------|-------------|----------|-------|
| {{phase_1_name}} | {{phase_1_description}} | {{phase_1_duration}} | {{phase_1_dates}} |
| {{phase_2_name}} | {{phase_2_description}} | {{phase_2_duration}} | {{phase_2_dates}} |
| {{phase_3_name}} | {{phase_3_description}} | {{phase_3_duration}} | {{phase_3_dates}} |

**Key Assumptions**
This timeline assumes:
- Client feedback provided within {{client_feedback_turnaround_days}} business days of each deliverable submission
- {{assumption_2 | State any other critical timing assumption}}

---

INVESTMENT

[IF fixed_fee:
**Fee Structure:** Fixed Fee

| Item | Description | Fee |
|------|-------------|-----|
| {{fee_item_1}} | {{fee_item_1_description}} | ${{fee_item_1_amount}} |
| {{fee_item_2}} | {{fee_item_2_description}} | ${{fee_item_2_amount}} |
| **Total Project Fee** | | **${{total_project_fee}}** |

Payment Schedule:
- {{deposit_percent}}% deposit (${{deposit_amount}}) due upon agreement signing
- {{midpoint_percent}}% (${{midpoint_amount}}) due upon delivery of {{midpoint_milestone}}
- {{final_percent}}% (${{final_amount}}) due upon final delivery and acceptance
END IF]

[IF time_and_materials:
**Fee Structure:** Time and Materials

**Rate:** ${{hourly_rate}} per hour
**Estimated Hours:** {{estimated_hours_low}} -- {{estimated_hours_high}} hours
**Estimated Investment:** ${{estimated_fee_low}} -- ${{estimated_fee_high}}

Invoices will be submitted {{invoice_cadence | e.g., bi-weekly}} and are due within {{payment_terms_days}} days.
END IF]

**Expenses:** {{expenses_policy | e.g., "Reasonable pre-approved expenses billed at cost with receipt" or "All expenses included in fixed fee above"}}

---

WHAT YOU CAN EXPECT FROM ME

- Weekly written status updates every {{update_day_of_week}}
- Response to all messages within {{response_sla_hours}} business hours
- All deliverables submitted on or before the agreed date, or advance notice if timelines shift
- A single point of contact for all project communication

---

NEXT STEPS

To move forward:
1. Review this proposal and contact me with any questions by {{question_deadline}}
2. Sign and return the attached agreement by {{signing_deadline}}
3. Submit the deposit payment to initiate the engagement
4. I will schedule our kickoff call within {{kickoff_scheduling_days}} business days of agreement receipt

I look forward to working with you on this project. Please do not hesitate to reach out with any questions.

{{your_name}}
{{your_email}} | {{your_phone}}
```

#### Fill-in Guide

| Variable | Description | Example | Source | Type | Validation |
|----------|-------------|---------|--------|------|------------|
| `{{proposal_reference_id}}` | Unique ID for tracking this proposal | PROP-2026-06-ML | Your own numbering system | Calculated | Keep a
