---
name: email-template-system
description: |
  Builds a personal email template set for the user's most common email types
  with variable placeholders and a quick-lookup guide. Use when the user sends
  similar emails repeatedly, wants to speed up email writing, or needs
  standardized responses for common situations. Do NOT use for writing a single
  specific email (use writing skills instead), cold outreach sequences (use
  `cold-email-outreach`), or enterprise email campaign templates (use business
  marketing skills instead).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "automation template email"
  category: "productivity"
  subcategory: "automation"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Email Template System

## When to Use

**Use this skill when:**
- The user explicitly mentions sending repetitive emails and wants to stop rewriting them from scratch -- the trigger phrase is usually "I send the same email over and over" or "I spend too much time on emails"
- The user asks for a template library, a personal email playbook, or a "swipe file" for common correspondence
- The user's daily email count is high enough that routine writing creates significant friction (typically 15+ emails/day where 30-50% are variations of the same types)
- The user has just started a new role and wants to establish consistent communication patterns before bad habits form
- The user manages a team and wants to provide standardized email templates for their reports to use
- The user needs to delegate email responses and wants templates that others can fill in accurately without rewriting
- The user is rebuilding their workflow after a role change and wants templates that reflect a new audience, tone, or responsibility level

**Do NOT use when:**
- The user needs a single specific email written right now -- use a professional email writing skill instead, which focuses on crafting one precise message for a real situation
- The user wants cold outreach or sales prospecting sequences -- use `cold-email-outreach`, which handles multi-touch cadences, A/B subject lines, and open rate optimization
- The user wants to build marketing newsletters or customer campaign emails -- use business marketing skills that cover segmentation, CTAs, and conversion optimization
- The user wants to automate email sending with triggers, conditions, or scheduled delivery -- use `workflow-automation-design`, which handles tool configuration and logic trees
- The user wants to improve their general writing quality or executive communication style -- this skill produces templates, not a writing coaching program
- The user wants a full team or company-wide communication standard -- that is an organizational communication design project, not a personal template set

---

## Process

### Step 1: Inventory the User's Email Patterns

Before writing a single template, gather enough information to build a system that actually fits the user's workflow. Ask the user to answer these specific questions -- or, if they have already described their situation, extract the answers from their description.

- **Volume and distribution:** How many emails do they send per day on average? What percentage are replies versus new messages? A user sending 60 emails/day needs ultra-short, friction-free templates; a user sending 10/day can use more nuanced, detailed templates.
- **Top recurring types:** Ask them to name the 5-10 email types they send most often. Push for specificity -- "follow-up emails" is too broad; "follow-up after a demo call to a prospective client" is usable. Common categories to prompt if they are stuck: meeting requests, post-meeting summaries, project status updates, feedback delivery, approval requests, introduction emails, acknowledgments, deadline reminders, thank-you notes, declination or rejection emails, escalation emails, onboarding messages.
- **Recipient relationships:** Who receives each type? Categorize as: internal peers, internal managers/executives, direct reports, external clients (existing), external clients (new), vendors/partners, or mixed. Recipient type drives tone and formality level more than anything else.
- **Pain points:** Which emails take the longest? Which do they dread writing? Which do they write poorly when rushed? Templates for dreaded emails (e.g., delivering bad news, pushing back on a request) provide disproportionate value.
- **Existing patterns:** Do they already have any informal templates, saved drafts, or canned responses? Reusing language they already trust reduces resistance and speeds adoption.

From this inventory, select the **5-8 highest-impact template candidates**. Prioritize by: (1) highest send frequency, (2) highest time cost per email, (3) highest risk if written poorly.

---

### Step 2: Classify Each Template by Purpose, Audience, and Tone Register

Assign each candidate template three attributes before writing a single word of the template body. These attributes drive every structural and language decision.

**Purpose classification (choose one):**
- **Request** -- The email asks someone to take an action (schedule, approve, provide, review, decide)
- **Response** -- The email replies to an inbound request or question
- **Update/Report** -- The email pushes information to someone who expects it (status reports, project updates, summaries)
- **Relationship** -- The email maintains or builds a connection (thank-you, introduction, congratulations, check-in)
- **Administrative** -- The email handles logistics (confirmations, scheduling, acknowledgments, document routing)
- **Difficult/Sensitive** -- The email conveys bad news, rejection, complaint, or conflict (requires extra care, separate handling -- see Edge Cases)

**Audience tier (choose one):**
- **Tier 1 -- Executive/client-facing:** C-suite, clients, senior external contacts. Maximum formality. No filler phrases. Every sentence earns its place. Under 150 words is ideal.
- **Tier 2 -- Professional peer:** Colleagues, counterparts, vendor contacts. Professional but conversational. 100-200 words is typical.
- **Tier 3 -- Internal/familiar:** Direct reports, close colleagues, team members. Warm and direct. Short is almost always better.

**Tone register (choose one):**
- **Formal:** Full sentences, no contractions, titles used (Dear Mr./Ms./Dr.), no colloquialisms
- **Professional:** Full sentences, contractions acceptable, first names used, no slang
- **Professional casual:** Conversational structure, bullet points acceptable, light warmth, mild informality acceptable
- **Friendly/direct:** Brief, warm, no ceremony -- appropriate for tight internal teams

Create a simple classification table before proceeding. This prevents scope creep and ensures every template has a defined character before writing begins.

---

### Step 3: Deconstruct the Anatomy of Each Email Type

Every email type has a predictable structure. Map the structure before writing the template. For each selected template, identify:

**Fixed elements (never change):**
- Opening line pattern (e.g., all meeting requests start with "I'd like to schedule time to discuss...")
- Standard transitional phrases that match the tone register
- The closing convention (e.g., "Best," for professional, "Thanks," for internal)
- Legal or compliance language if applicable (e.g., confidentiality footers, unsubscribe language)

**Variable elements (always change):**
- Recipient name, title, and relationship context
- Dates, times, deadlines, and durations
- Project names, document titles, and specific deliverables
- Contextual one-liner explaining why this specific email is being sent now

**Conditional elements (sometimes included):**
- Alternative options if the first preference is not accepted
- Pre-reading or preparation requests
- Escalation notes if a deadline has passed
- Apology or acknowledgment of delay if applicable

**Optimal length targets (follow these unless context demands otherwise):**
- Administrative and acknowledgment templates: 30-75 words
- Request templates: 75-150 words
- Update/report templates: 100-200 words (use bullets to increase scanability)
- Relationship templates: 50-125 words
- Difficult/sensitive templates: 100-200 words (never rush, but never ramble)

**Subject line formula:** Every template must have a subject line formula, not a generic placeholder. Strong subject lines follow one of these patterns:
- **[Action] + [Topic] + [Deadline/Date]:** "Approval Needed: Q2 Budget Proposal -- Due Friday"
- **[Type]: [Specific Topic]:** "Meeting Request: Product Roadmap Alignment"
- **[Project/Context] -- [What This Is]:** "Northbridge Campaign -- Status Update, Week of Jan 13"
- **Re: [Original Subject]** for replies (use the original thread, never write a new subject)

---

### Step 4: Write Each Template with Precision

Write each template with the following structural requirements:

**Subject line:**
- Must contain at least one `{{placeholder}}` for a specific variable (never a fully static subject line)
- Must follow one of the four subject line formulas identified in Step 3
- Must be under 60 characters when placeholders are filled in (this is the mobile inbox preview limit)

**Greeting:**
- Use `{{recipient_name}}` -- never hard-code a name
- Tier 1: "Dear {{recipient_name}},"
- Tier 2/3: "Hi {{recipient_name}}," or "Hello {{recipient_name}},"
- For groups: "Hi team," or "Hi {{team_name}} team,"

**Opening line:**
- State the purpose of the email in the first sentence -- no warm-up filler like "I hope this finds you well" in templates (it reads as robotic and insincere at scale)
- Exception: relationship emails (introductions, thank-yous, check-ins) may open with genuine warmth, but make it specific and brief

**Body:**
- Keep to the identified length target
- Use bullet points for lists of 3 or more items
- Bold key information the recipient needs to act on (deadlines, decisions required, specific asks)
- Conditional sections use `[IF {{condition}}: ... END IF]` syntax consistently

**Closing call to action:**
- Every email must end with one specific, unambiguous request or next step
- Bad: "Let me know your thoughts" -- this asks for nothing specific
- Bad: "Please advise" -- this is vague and sounds passive
- Good: "Please confirm your attendance by {{rsvp_deadline}}" -- specific action, specific timing
- Good: "If you have questions, please reply by {{question_deadline}} so I can address them before the meeting" -- specific action, specific timing, specific context

**Sign-off:**
- Use `{{sign_off}}` as a placeholder if the user has not specified preferences, but provide a recommended default in the variable table
- Common sign-off conventions: "Best," and "Thanks," for Tier 2/3; "Best regards," and "Sincerely," for Tier 1

**Placeholder format rules:**
- All variable content uses `{{snake_case_name}}` format
- Placeholder names must be self-documenting: `{{project_name}}` not `{{p}}`, `{{decision_deadline}}` not `{{date2}}`
- Placeholders that have a strong default value (e.g., sign-off is almost always "Best,") should be noted in the variable table with "Default: Best,"

---

### Step 5: Build the Variable Tables

Each template gets a variable table immediately following the template body. The table has four columns:

| Placeholder | What to Fill In | Example Value | Required? |
|------------|----------------|--------------|-----------|

- **Required = Yes:** Email cannot be sent without this -- it would be nonsensical or look unprofessional
- **Required = Contextual:** Include only if the conditional section applies
- **Required = No:** Has a sensible default that rarely changes (e.g., `{{sign_off}}` defaults to "Best,")

The variable table serves as the fill-in checklist. A user should be able to work through the table top-to-bottom and then have a complete email ready to send.

---

### Step 6: Write the Before-Sending Checklist for Each Template

Every template ends with a before-sending checklist. This is not a generic quality check -- it is template-specific. Include:

1. **Universal check:** "All `{{placeholders}}` replaced with actual values" -- include this on every template
2. **Subject line check:** A reminder specific to the subject line formula (e.g., "Subject line is under 60 characters when filled in")
3. **Template-specific content check:** The thing most likely to go wrong with this type of email (e.g., for meeting requests: "Proposed time checked against your own calendar"; for status updates: "All listed items reflect current status, not last week's")
4. **Tone check:** A reminder calibrated to the template's audience tier (e.g., "If sending to a Tier 1 executive, remove any bullet points and reformat as prose")
5. **Call-to-action check:** "The closing request is specific and includes a deadline or response timeframe"

Keep the checklist to 4-6 items. A checklist nobody uses because it is too long defeats its purpose.

---

### Step 7: Assemble the Quick-Lookup Guide

The quick-lookup guide appears at the top of the full output. It serves as the single reference point when the user is deciding which template to use. It must:

- Fit in a single screen view (no more than 8-10 rows without sub-grouping)
- Include the template name, the trigger condition (when to use it), estimated fill-in time, audience tier, and tone register
- Be sorted by frequency of use (most frequent first) or by category if there are multiple types
- Include a one-line "do not use if" note for templates that have a common misapplication risk

If the user has more than 8 templates, group them into categories (e.g., Requests, Updates, Relationship, Administrative) with a sub-index for each category.

**Fill-in time estimates by template complexity:**
- 30-75 word templates with 3-4 variables: 1 minute
- 75-150 word templates with 5-7 variables: 2-3 minutes
- 150-200 word templates with 8+ variables or conditional sections: 3-5 minutes
- Templates requiring original writing in a variable field (e.g., "one sentence context"): add 1-2 minutes

---

### Step 8: Deliver the System with Adoption Guidance

After the full template library, provide a brief adoption note (3-5 bullets) covering:

- **Where to store the templates:** Gmail canned responses (Settings > See all settings > Advanced > Canned Responses), Outlook Quick Parts (Insert > Quick Parts), or a notes app like Notion or Apple Notes with a "Templates" section
- **How to update templates over time:** Recommend a quarterly review -- identify which templates were used, which were not, and whether any frequently used ones need a tone or content update
- **What to do with templates that feel stiff:** Templates should be a starting point, not a straitjacket. Any template can be warmed up with one sentence of genuine context added at the opening
- **When to retire a template:** If a template has not been used in 3 months, it is likely not meeting a real recurring need -- replace it with one that does

---

## Output Format

```
## Personal Email Template System
[User name or "Your" if not specified]

---

### Quick-Lookup Guide

| # | Template Name | Use When | Fill-in Time | Audience | Tone |
|---|---------------|----------|-------------|----------|------|
| 1 | [Name] | [Trigger condition] | [X min] | [Tier 1/2/3] | [Formal/Professional/Casual] |
| 2 | [Name] | [Trigger condition] | [X min] | [Tier 1/2/3] | [Formal/Professional/Casual] |
...

---

### Template [N]: [Email Type Name]

**Purpose:** [Request | Response | Update | Relationship | Administrative | Difficult]
**Use when:** [Specific trigger situation in one sentence]
**Recipient:** [Specific recipient type]
**Audience tier:** [Tier 1 -- Executive/Client | Tier 2 -- Professional Peer | Tier 3 -- Internal/Familiar]
**Tone:** [Formal | Professional | Professional Casual | Friendly/Direct]
**Fill-in time:** [X] minutes

---

**Subject:** [Subject line formula with {{placeholders}}]

---

[Greeting with {{recipient_name}}]

[Opening line stating the email's purpose]

[Body with {{placeholders}} for all variable content]

[IF {{condition}}:
[Conditional section content]
END IF]

[Specific call to action with deadline variable]

[{{sign_off}}],
[{{your_name}}]

---

**Variables:**

| Placeholder | What to Fill In | Example Value | Required? |
|------------|----------------|--------------|-----------|
| {{placeholder}} | [Description] | [Example] | Yes / No / Contextual |

**Before sending:**
- [ ] All {{placeholders}} replaced with actual values
- [ ] [Subject line check specific to this template]
- [ ] [Content check specific to this template's most common error]
- [ ] [Tone/audience check]
- [ ] Call to action includes a specific deadline or response timeframe

---
[Repeat for each template]

---

### Adoption Notes

- **Where to save these:** [Specific storage recommendation based on the user's email client if mentioned]
- **Quarterly review:** Delete unused templates; update language in heavily used ones
- **When templates feel stiff:** Add one sentence of genuine personal context after the opening line
- **When to retire a template:** If unused for 3 months, replace it with a template for an actual recurring need
```

---

## Rules

1. **Never deliver a template without the actual template text.** The output must be copy-paste ready. A template description ("here is what a meeting request email should include") is not a template -- it is advice. Write the full body text.

2. **Subject lines must always contain at least one `{{placeholder}}`** and must follow one of the four defined subject line formulas. Static subject lines like "Quick question" or "Following up" are spam-folder patterns and indexing failures -- they also make it impossible to find emails in a thread archive later.

3. **Every template must end with one specific, time-bound call to action.** "Please let me know" is banned. "Please reply with your availability by {{response_deadline}}" is a call to action. The recipient should never have to infer what they are supposed to do next.

4. **Template bodies must not exceed 250 words, excluding placeholder text.** Email templates that exceed 250 words get rewritten every time they are used, which means they are not really templates -- they are outlines. If the topic genuinely requires more than 250 words, it does not belong in a template system.

5. **All placeholders use `{{descriptive_snake_case}}` format with no exceptions.** `{{x}}`, `{{thing}}`, `{{1}}`, or `INSERT_HERE` formats are prohibited. If a user accidentally sends an email with a missed placeholder in `{{}}` format, it is immediately obvious and embarrassing but recoverable. A missed "INSERT REASON HERE" placeholder is far worse.

6. **Different audience tiers of the same email type must be separate templates, not a single template with tone switching instructions.** A meeting request to a CEO and a meeting request to a peer colleague are structurally different documents -- they have different greeting conventions, different subject line formulas, different body lengths, and different closing styles. One template with a note saying "adjust for executives" creates the cognitive overhead the templates are supposed to eliminate.

7. **The quick-lookup guide must fit in a single screen view.** If there are more than 8 templates, organize them into categories. A reference guide that requires scrolling to find the right template will not be used -- the user will just write emails from scratch.

8. **Conditional sections must be clearly delimited with `[IF {{condition}}: ... END IF]` syntax** and must include the specific condition in the syntax (not just `[IF applicable:]`). "If applicable" requires the user to judge applicability every time; a specific condition like `[IF {{has_alternative_times}}: ...]` is self-documenting.

9. **Before-sending checklists must be template-specific, not generic.** A checklist that reads the same on every template will be skipped. The most important check on a meeting request template ("proposed time verified against your own calendar") is completely irrelevant to a document acknowledgment template. Generic checklists become invisible noise.

10. **Never include filler opening phrases in templates.** Phrases like "I hope this email finds you well," "I wanted to reach out because," or "As per my previous email" are anti-patterns that trained professionals learn to resent. Templates that include them will be manually edited every time, undermining the purpose of the system. The exception is relationship emails (thank-yous, introductions, congratulations), where genuine warmth in the opening is appropriate -- but it must be made specific with a `{{personal_context}}` placeholder, not left as a generic filler phrase.

11. **Placeholders that require original thinking must be labeled as such in the variable table.** When a placeholder like `{{one_sentence_context}}` requires the user to compose original content rather than fill in a data point, the variable table should note "Requires original writing -- 1-2 sentences." This prevents users from sending templates with placeholder content that is too thin or missing entirely.

12. **Every template system must include at least one acknowledgment or administrative template.** These are the highest-volume, lowest-effort templates in any professional email workflow. Users who feel they "do not need templates for simple emails" are underestimating how much time they spend on confirmations, receipt acknowledgments, and scheduling responses.

---

## Edge Cases

### The User's Email Workflow Is Highly Informal (Slack-Primary Workplace)
Some users work in environments where email is reserved for external communication or formal internal escalations -- their day-to-day communication happens in Slack or Teams. For these users:
- Focus the template library exclusively on external-facing emails (client communication, vendor correspondence, cross-company coordination)
- Do not create internal peer templates -- they will not be used and will clutter the system
- Increase formality guidance for all templates, since every email they send is inherently a higher-stakes communication
- Add a note at the top of the quick-lookup guide: "These templates are for external or formal communications. Internal messages belong in [Slack/Teams]."

### The User Sends Emails in Multiple Languages
- Create entirely separate templates for each language -- never bilingual hybrid templates with inline translation notes
- Naming convention in the quick-lookup guide: append the language code (e.g., "Meeting Request (EN)", "Meeting Request (ES)")
- Do not translate English templates word-for-word into other languages -- rewrite them using native-language conventions for that email type. Professional email register varies significantly by language and culture (e.g., German professional email typically opens with full formal address and title; French professional email has distinctive salutation and closing conventions; Japanese professional email has keigo formality levels that do not map to English at all)
- Group the quick-lookup guide by language if there are more than 3 languages, with a top-level section for each language

### The User Needs Templates for Difficult Conversations
Rejection, complaint, bad news, and pushback emails require a different templating approach than standard correspondence:
- Create a dedicated "Difficult Communications" section in the template library
- Each template in this section gets a severity variant: "direct delivery" (for situations where bluntness is appropriate) and "softened delivery" (for situations requiring more diplomatic framing) as separate templates
- Include a mandatory cool-down checkpoint in the before-sending checklist: "Wait at least 30 minutes before sending -- reread after the waiting period"
- Add a `{{written_reason}}` placeholder for any email delivering bad news -- never allow a rejection or complaint email to lack a specific stated reason, even if brief
- Do not soften these templates to the point of ambiguity. A rejection that does not clearly say "no" is a template failure. The template should make the substance undeniable while making the delivery respectful.

### The User Has Very High Email Volume (50+ Per Day)
At high volume, template friction must be near-zero:
- Prioritize templates that can be filled in under 90 seconds -- aim for 3-5 variables maximum
- The highest-value template for high-volume users is a triage acknowledgment: "Received your email -- I will respond fully by `{{response_date}}`." This single template can transform inbox management.
- Consider a batch of "one-tap" micro-templates -- emails that are 1-3 sentences with only 1-2 variables. These are not trivial; they cover 40-60% of actual email volume for high-traffic inboxes.
- For high-volume users, recommend Gmail canned responses or Outlook Quick Parts specifically, since these allow template insertion without leaving the compose window -- copy-pasting from a notes app adds enough friction to kill the habit.

### The User Manages a Team and Wants Templates for Others to Use
When templates will be used by multiple people, not just the creator:
- Add a "voice calibration" note to each template explaining what decisions team members can make independently vs. what must be escalated before sending (e.g., "Do not send this template if the project is more than 2 weeks behind schedule -- escalate to the manager first")
- Remove any first-person language that is personalized to the individual (e.g., "I have been working on this for the past three months") -- replace with neutral framing
- Add a version date to the quick-lookup guide header: "Last updated: {{date}}" -- team templates drift if they are not versioned
- Increase the specificity of all conditional sections, since team members will have less context about when to include or exclude them

### The User Wants Templates for Client-Facing External Communication
Client-facing templates have higher stakes than internal ones:
- Add a `{{relationship_stage}}` variable or create tiered variants: new client (more formal, more thorough), established client (warmer, can assume shared context), at-risk or escalating client (more attentive, faster response commitments)
- Audit every template for internal jargon -- terms that are obvious internally ("sprint review", "ticket", "standup") may confuse external clients. Use the placeholder `{{project_milestone}}` instead of assuming the client knows the terminology.
- Include a specific check in every client-facing before-sending checklist: "No internal project names, ticket numbers, or team-specific jargon visible to the client"
- Add a `{{client_company_name}}` placeholder -- personalizing to the client's company name (not just the individual's name) significantly increases professionalism for Tier 1 external communications

### The User Has Inconsistent Email Habits and Is Unlikely to Adopt a Complex System
Some users need templates precisely because their email habits are poor -- but presenting them with a 10-template library with conditional logic will overwhelm them and result in zero adoption:
- Limit the initial system to 3 templates maximum -- the three with the highest frequency and lowest fill-in time
- Use the simplest possible conditional structure: prefer writing two simple variant templates over one complex template with multiple `[IF]` sections
- Frame the quick-lookup guide as a "starter kit" with a note to add templates as they identify new recurring types
- Suggest the simplest possible storage method for their situation rather than optimizing for the theoretically best tool

---

## Example

**Input:** "I'm a project manager at a mid-size company. I send tons of emails. The most common ones are: requesting status updates from vendors who are behind, sending weekly project summaries to my executive sponsor, scheduling kickoff meetings with new project teams, and introducing two colleagues who should be working together but don't know each other yet. I also constantly send 'acknowledged, I'll look at this' replies when documents land in my inbox."

---

**Output:**

## Personal Email Template System
For: Project Manager -- General Business Use

---

### Quick-Lookup Guide

| # | Template Name | Use When | Fill-in Time | Audience | Tone |
|---|---------------|----------|-------------|----------|------|
| 1 | Vendor Status Request | Vendor deliverable is overdue or approaching deadline | 2 min | Tier 2 -- Professional Peer | Professional |
| 2 | Executive Project Summary | Weekly or milestone-triggered update to sponsor | 4 min | Tier 1 -- Executive | Formal |
| 3 | Project Kickoff Meeting Request | New project team needs its first meeting scheduled | 3 min | Tier 2 -- Professional Peer | Professional |
| 4 | Colleague Introduction | Connecting two colleagues who should collaborate | 2 min | Tier 2 -- Professional Peer | Warm Professional |
| 5 | Document Acknowledgment | Confirming receipt of any inbound document or deliverable | 1 min | Tier 2/3 | Professional |

> **Do not use Template 1** if the vendor relationship is in formal dispute or legal review -- escalate to your procurement or legal contact instead.
> **Do not use Template 2** for informal hallway-update-style emails -- use it only for structured written updates that go on record.

---

### Template 1: Vendor Status Request

**Purpose:** Request
**Use when:** A vendor deliverable is overdue, approaching its due date, or the status is unknown and you need confirmation
**Recipient:** External vendor contacts, third-party project contributors
**Audience tier:** Tier 2 -- Professional Peer (external)
**Tone:** Professional
**Fill-in time:** 2 minutes

---

**Subject:** Status Request: {{deliverable_name}} -- Due {{original_due_date}}

---

Hi {{vendor_contact_name}},

I am following up on the status of {{deliverable_name}}, which was due on {{original_due_date}} per {{contract_or_agreement_reference}}.

Could you provide a brief update on the following by {{response_deadline}}:

1. Current completion status (percentage or milestone reached)
2. Any blockers or risks to the current timeline
3. Revised delivery date, if applicable

[IF {{escalation_flag}}:
Please note that this deliverable is on the critical path for {{dependent_project_milestone}} scheduled for {{dependent_date}}. A delay will have downstream impact, and I need your update promptly to assess our options.
END IF]

Please reply with a status update by {{response_deadline}} so I can report accurate information to my project stakeholders.

Best,
{{your_name}}
{{your_title}} | {{project_name}}

---

**Variables:**

| Placeholder | What to Fill In | Example Value | Required? |
|------------|----------------|--------------|-----------|
| {{vendor_contact_name}} | Vendor contact's first name | Marcus | Yes |
| {{deliverable_name}} | Exact name of the deliverable | API integration documentation | Yes |
| {{original_due_date}} | The agreed-upon due date | January 10 | Yes |
| {{contract_or_agreement_reference}} | Reference to the agreement (SOW, PO number, email thread) | SOW #2024-117 | Yes |
| {{response_deadline}} | When you need their reply | end of day Wednesday, January 15 | Yes |
| {{escalation_flag}} | Include if this delay affects another dependent milestone | -- | Contextual |
| {{dependent_project_milestone}} | The downstream milestone affected | client UAT sign-off | Contextual |
| {{dependent_date}} | Date of the dependent milestone | January 22 | Contextual |
| {{your_title}} | Your job title | Senior Project Manager | Yes |
| {{project_name}} | Name of the project this vendor is working on | Northbridge Integration Project | Yes |

**Before sending:**
- [ ] All `{{placeholders}}` replaced with actual values
- [ ] Subject line confirms: deliverable name and due date are both accurate
- [ ] `{{original_due_date}}` is verified against the actual contract or SOW -- do not rely on memory
- [ ] `{{response_deadline}}` gives the vendor at least 24 hours to respond
- [ ] The escalation section is included only if a real downstream dependency exists -- do not include it as a pressure tactic without factual basis

---

### Template 2: Executive Project Summary

**Purpose:** Update/Report
**Use when:** Delivering the weekly (or milestone-triggered) written project update to an executive sponsor or steering committee
**Recipient:** Executive sponsor, VP-level or C-suite stakeholders
**Audience tier:** Tier 1 -- Executive
**Tone:** Formal
**Fill-in time:** 4-5 minutes (requires original content in several fields)

---

**Subject:** {{project_name}} -- Project Update, Week of {{week_date}}

---

Dear {{sponsor_name}},

Below is the weekly status update for {{project_name}} for the week of {{week_date}}.

**Overall Status:** {{status_indicator}} -- {{one_sentence_overall_summary}}

**Progress this week:**
- {{accomplishment_1}}
- {{accomplishment_2}}

[IF {{accomplishment_3}}:
- {{accomplishment_3}}
END IF]

**Upcoming milestones:**
- {{next_milestone_1}}: {{next_milestone_1_date}}
- {{next_milestone_2}}: {{next_milestone_2_date}}

**Risks and issues:**

[IF {{active_risks}}:
{{risk_description}} -- **Mitigation:** {{mitigation_action}}
END IF]

[IF {{no_active_risks}}:
No active risks or issues to report this week.
END IF]

**Decision or support needed from you:**

[IF {{decision_needed}}:
{{decision_description}} -- Requested by: {{decision_deadline}}
END IF]

[IF {{no_decision_needed}}:
No decisions required from your office this week.
END IF]

Please let me know if you would like to discuss any item above before our next scheduled touchpoint on {{next_meeting_date}}.

Best regards,
{{your_name}}
{{your_title}}

---

**Variables:**

| Placeholder | What to Fill In | Example Value | Required? |
|------------|----------------|--------------|-----------|
| {{project_name}} | Full project name | Northbridge Integration Project | Yes |
| {{week_date}} | Monday date of the week being reported | January 13, 2025 | Yes |
| {{sponsor_name}} | Executive's last name (Tier 1 convention) or first name if they have specified a preference | Chen | Yes |
| {{status_indicator}} | On Track / At Risk / Off Track | On Track | Yes |
| {{one_sentence_overall_summary}} | One sentence describing the overall project health | All workstreams are progressing on schedule with one minor risk being monitored. | Requires original writing |
| {{accomplishment_1}} | First key accomplishment this week | Completed vendor API documentation review | Yes |
| {{accomplishment_2}} | Second key accomplishment | Finalized UAT test plan with the QA team | Yes |
| {{accomplishment_3}} | Third accomplishment, if applicable | -- | Contextual |
| {{next_milestone_1}} | Name of the next upcoming milestone | Vendor integration testing begins | Yes |
| {{next_milestone_1_date}} | Date of that milestone | January 20 | Yes |
| {{next_milestone_2}} | Second upcoming milestone | UAT sign-off with client | Yes |
| {{next_milestone_2_date}} | Date of the second milestone | February 3 | Yes |
| {{risk_description}} | Brief description of the active risk | Vendor API documentation is 3 days late, which may compress testing window | Contextual |
| {{mitigation_action}} | What is being done about it | Accelerated internal test preparation to absorb potential delay | Contextual |
| {{decision_description}} | What decision you need from the executive | Approval to extend the UAT window by 5 days if vendor delay persists | Contextual |
| {{decision_deadline}} | When you need the decision | January 17 | Contextual |
| {{next_meeting_date}} | Date of the next scheduled touchpoint | January 22 | Yes |

**Before sending:**
- [ ] All `{{placeholders}}` replaced with actual values
- [ ] `{{status_indicator}}` is accurate -- do not send "On Track" if you are privately concerned about the timeline; this document goes on the official record
- [ ] The "Decision needed" section is included only if there is a genuine action required from the executive -- do not manufacture decisions to appear engaged
- [ ] All dates are confirmed against the current project plan, not recalled from memory
- [ ] Email is reviewed for internal jargon that would not be familiar to an executive outside the project team
- [ ] Total length is under 250 words -- if it exceeds this, move detailed content to an attached report and summarize here

---

### Template 3: Project Kickoff Meeting Request

**Purpose:** Request
**Use when:** A new project has been scoped and approved, and you need to schedule the first formal meeting with the project team
**Recipient:** New project team members (internal, typically cross-functional)
**Audience tier:** Tier 2/3 -- Internal, mixed seniority
**Tone:** Professional Casual
**Fill-in time:** 3 minutes

---

**Subject:** Kickoff Meeting: {{project_name}} -- {{proposed_date}}

---

Hi team,

{{project_name}} is officially underway, and I would like to bring the full team together for a kickoff meeting.

**Proposed time:** {{proposed_date}} at {{proposed_time}} ({{duration}})
**Location:** {{location_or_video_link}}

**Agenda:**
1. Project overview, objectives, and success criteria ({{agenda_time_1}} min)
2. Roles, responsibilities, and ownership ({{agenda_time_2}} min)
3. Timeline, milestones, and key dependencies ({{agenda_time_3}} min)
4. Open questions and next steps ({{agenda_time_4}} min)

[IF {{pre_reading}}:
**Before the meeting, please review:** {{pre_reading_document}} (link: {{pre_reading_link}})
This will be assumed reading -- we will not recap it in the meeting.
END IF]

Please **accept or decline by {{rsvp_deadline}}**. If the proposed time does not work, reply with your availability for {{alternative_date_range}} and I will reschedule.

Looking forward to working with everyone on this.

{{your_name}}

---

**Variables:**

| Placeholder | What to Fill In | Example Value | Required? |
|------------|----------------|--------------|-----------|
| {{project_name}} | Project name | Northbridge Integration Project | Yes |
| {{proposed_date}} | Date of the meeting | Tuesday, January 21 | Yes |
| {{proposed_time}} | Time with timezone | 10:00 AM -- 11:00 AM EST | Yes |
| {{duration}} | Meeting length | 60 minutes | Yes |
| {{location_or_video_link}} | Room or video link | Zoom -- link in calendar invite | Yes |
| {{agenda_time_1}} | Minutes for first agenda item | 15 | Yes |
| {{agenda_time_2}} | Minutes for second agenda item | 15 | Yes |
| {{agenda_time_3}} | Minutes for third agenda item | 20 | Yes |
| {{agenda_time_4}} | Minutes for open questions | 10 | Yes |
| {{pre_reading}} | Include if there is pre-reading | -- | Contextual |
| {{pre_reading_document}} | Name of the document | Project Charter v1.0 | Contextual |
| {{pre_reading_link}} | Link or location of the document | SharePoint: /Projects/Northbridge | Contextual |
| {{rsvp_deadline}} | When you need a response | end of day Thursday, January 16 | Yes |
| {{alternative_date_range}} | Backup scheduling window | the week of January 27 | Yes |

**Before sending:**
- [ ] All `{{placeholders}}` replaced with actual values
- [ ] Agenda time allocations add up to the total meeting duration
- [ ] Calendar invite sent separately with the video link or room booking confirmed
- [ ] All intended recipients are on the To: line -- this is a common error on cross-functional kickoffs
- [ ] `{{rsvp_deadline}}` is at least 3 business days before the proposed meeting date

---

### Template 4: Colleague Introduction

**Purpose:** Relationship
**Use when:** Connecting two colleagues who do not know each other and have a reason to work together or connect
**Recipient:** Two colleagues (both on the To: line)
**Audience tier:** Tier 2 -- Professional Peer
**Tone:** Warm Professional
**Fill-in time:** 2-3 minutes

---

**Subject:** Introduction: {{person_1_name}} + {{person_2_name}} -- {{shared_topic}}

---

Hi {{person_1_name}} and {{person_2_name}},

I want to introduce you to each other because {{connection_reason}} -- I think you will find this connection valuable.

**{{person_1_name}}** is {{person_1_role_description}}. {{person_1_relevant_context}}.

**{{person_2_name}}** is {{person_2_role_description}}. {{person_2_relevant_context}}.

I will step back and let you two take it from here. The obvious next step would be {{suggested_next_step}}.

Best,
{{your_name}}

---

**Variables:**

| Placeholder | What to Fill In | Example Value | Required? |
|------------|----------------|--------------|-----------|
| {{person_1_name}} | First person's first name | Priya | Yes |
| {{person_2_name}} | Second person's first name | Daniel | Yes |
| {{shared_topic}} | What connects them in 3-5 words | Northbridge data migration work | Yes |
| {{connection_reason}} | Why you are making this introduction -- one clause | Priya is leading the data migration on our side and Daniel owns the vendor data architecture | Requires original writing |
| {{person_1_role_description}} | Person 1's title and context | our Senior Data Analyst and the lead on the Northbridge migration | Yes |
| {{person_1_relevant_context}} | One sentence of relevant background for Person 2 | She has the most current picture of our data structure requirements | Requires original writing |
| {{person_2_role_description}} | Person 2's title and context | the data architect at Northbridge and Daniel's contact for technical integration questions | Yes |
| {{person_2_relevant_context}} | One sentence of relevant background for Person 1 | He's already mapped the Northbridge schema and has answers to the field-mapping questions you raised last week | Requires original writing |
| {{suggested_next_step}} | What you think they should do next | a 30-minute call to compare your schemas before the integration sprint starts January 27 | Yes |

**Before sending:**
- [ ] Both people are on the To: line, not CC -- this is an introduction, not a notification
- [ ] Both descriptions are accurate -- verify titles and roles before sending
- [ ] `{{suggested_next_step}}` is specific enough to be actionable without being prescriptive
- [ ] Neither person's description inadvertently reveals confidential organizational information to the other

---

### Template 5: Document Acknowledgment

**Purpose:** Administrative
**Use when:** Someone sends you a document and you need to confirm receipt and set a timeline expectation
**Recipient:** Anyone who has sent a document -- internal or external
**Audience tier:** Tier 2 -- Professional Peer (adjust sign-off for Tier 1)
**Tone:** Professional
**Fill-in time:** 1 minute

---

**Subject:** Re: {{original_email_subject}}

---

Hi {{sender_name}},

Received {{document_name}} -- thank you. I will review it and follow up with {{next_step}} by {{review_deadline}}.

[IF {{questions_anticipated}}:
If I have questions during my review, I will send them by {{question_deadline}} so you have time to respond before I finalize my notes.
END IF]

Thanks,
{{your_name}}

---

**Variables:**

| Placeholder | What to Fill In | Example Value | Required? |
|------------|----------------|--------------|-----------|
| {{original_email_subject}} | The subject line of the email you are replying to | Vendor SOW -- Final v2 | Yes |
| {{sender_name}} | Sender's first name | Marcus | Yes |
| {{document_name}} | Specific name of what was sent | the final SOW for Phase 2 | Yes |
| {{next_step}} | What you will produce after reviewing it | my written comments or approval confirmation | Yes |
| {{review_deadline}} | When you will complete your review | end of day Thursday | Yes |
| {{questions_anticipated}} | Include if the document is complex enough that questions are likely | -- | Contextual |
| {{question_deadline}} | If questions section is included -- when you will send any questions | Wednesday noon | Contextual |

**Before sending:**
- [ ] `{{review_deadline}}` is actually realistic given your current workload -- do not default to "end of day today" for complex documents
- [ ] `{{document_name}}` matches what was actually sent (not a generic "the document")
- [ ] `{{next_step}}` is specific -- "follow up" alone is not a next step

---

### Adoption Notes

- **Where to save these:** If you use Outlook, paste each template into a Quick Parts entry (Insert > Quick Parts > Save Selection) and name it by template number. If you use Gmail, enable Canned Responses (Settings > See all settings > Advanced > Templates) and save each one. For cross-device access or sharing with your team, save the full library as a page in Notion or Confluence titled "Email Template Library" with anchor links for each template.
- **Quarterly review:** Set a calendar reminder every 90 days to review which templates were used. Templates that were not used are candidates for replacement. Templates used heavily should be reviewed for language drift -- if you have been editing them heavily before sending, update the master version.
- **When templates feel stiff:** Add one sentence of genuine personal context after the opening line. The templates above are intentionally neutral so they work broadly -- a single line of real context ("given the Q1 deadline, I want to make sure we have clarity on this before the month closes") transforms them from form letters into real communication.
- **Template discipline:** Send templates as-is at least 10 times before editing the master template. First instincts to personalize are often correct, but premature edits to the master can introduce inconsistency across uses.
