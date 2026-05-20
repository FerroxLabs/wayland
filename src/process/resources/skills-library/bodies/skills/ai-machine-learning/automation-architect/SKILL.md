---
name: automation-architect
description: |
  Workflow automation design using Zapier, Make, and n8n covering trigger-action architecture, multi-step automation workflows, error handling strategies, personal versus business automation patterns, ROI calculation, and a library of common automation recipes.
  Use when the user asks about automation architect, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of automation architect or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml budgeting checklist template advanced python api-design cloud"
  category: "ai-machine-learning"
  subcategory: "llm-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Automation Architect

## When to Use

**Use this skill when:**
- A user wants to design, build, or improve a workflow automation using Zapier, Make (formerly Integromat), n8n, or similar no-code/low-code orchestration platforms
- A user has a repetitive manual process -- data entry, notifications, file handling, CRM updates, report generation -- and wants to replace it with automated logic
- A user needs to choose between automation platforms and evaluate trade-offs between cost, complexity, integration depth, and hosting model
- A user wants to calculate the ROI of an automation investment, including setup time, subscription cost, error reduction, and amortized maintenance
- A user has an existing automation that is failing silently, producing duplicate records, or has no error handling and needs a reliability review
- A user wants to build a multi-step automation with branching logic, data transformations, conditional paths, or human-in-the-loop approval steps
- A user is migrating from one automation platform to another and needs to translate their existing workflow architecture
- A user wants to implement a standard business automation pattern -- lead capture, invoice processing, customer onboarding, meeting follow-up -- and needs a complete recipe
- A user is hitting API rate limits, timeout errors, or data format mismatches in their existing automations and needs debugging guidance

**Do NOT use when:**
- The user needs full custom software development -- if the workflow requires complex state machines, persistent queues, or transactional database operations, redirect to the Software Architecture or Backend API Design skill
- The user is asking about Robotic Process Automation (RPA) tools like UiPath or Automation Anywhere that interact with desktop UIs -- those follow screen-scraping and bot architecture patterns outside this skill's scope
- The user needs to orchestrate machine learning pipelines (Airflow, Prefect, Kubeflow) -- redirect to the ML Pipeline Engineering skill
- The user is asking about CI/CD pipeline automation (GitHub Actions, Jenkins, CircleCI) -- redirect to the DevOps Pipeline skill
- The user needs a data engineering ETL pipeline with large-scale transformations (dbt, Spark, Fivetran) -- redirect to the Data Pipeline Architecture skill
- The user is asking about marketing automation platforms (HubSpot Workflows, Klaviyo, Marketo) exclusively -- those have their own logic editors and this skill's patterns apply only partially
- The user needs infrastructure automation (Terraform, Ansible, Pulumi) -- redirect to the Infrastructure as Code skill

---

## Questions to Ask First

Before designing any automation, gather the following information. Missing even one of these leads to a fundamentally wrong architecture.

1. **What is the triggering event?** Is it an incoming email, a form submission, a new row in a spreadsheet, a webhook from an API, a scheduled time, or a manual human action?
2. **What tools and apps are involved?** List every system that must read from or write to -- CRM, email provider, spreadsheet, database, payment processor, calendar, Slack, etc.
3. **How often does this trigger fire?** Per minute, per hour, per day, per month? Volume determines platform tier and rate limit strategy.
4. **What data must flow between steps?** What fields, what formats (JSON, CSV, plain text), what transformations (date parsing, currency conversion, string extraction)?
5. **What are the branching conditions?** Is there an if/then decision? Does the path differ for new vs. existing customers, paid vs. free users, amounts above or below a threshold?
6. **What is the acceptable failure mode?** Should the automation retry silently, send an alert, queue for manual review, or stop immediately on error?
7. **What is the technical comfort level?** No-code (drag-and-drop only), low-code (comfortable with JSON and basic expressions), or developer (can write JavaScript or Python, comfortable with APIs)?
8. **What is the budget?** Free tier only, sub-$50/month, or enterprise-level spend?
9. **Is there a compliance or data residency requirement?** GDPR, HIPAA, SOC 2, or specific data-not-leaving-EU constraints rule out certain SaaS platforms and require self-hosted n8n.
10. **How many people depend on this automation?** A solo personal automation tolerates more downtime than one serving a 50-person sales team.

---

## Process

### Step 1: Map the Manual Process Before Touching Any Tool

- Write down every single action a human currently takes, in order. Do not skip "obvious" steps -- they often contain the critical edge case.
- Identify the data that exists at the start (inputs) and the data or state that must exist at the end (outputs).
- Mark each step as: fully automatable, needs human decision, needs human approval, or not automatable.
- Count the total time per occurrence and multiply by monthly frequency to establish the baseline cost. Use fully-loaded hourly rate (salary + benefits + overhead), not just salary -- typically 1.25x to 1.5x the base hourly wage.
- Flag any steps where errors currently happen in the manual process. Automating a broken process makes errors faster and harder to trace. Fix the underlying process logic first.

### Step 2: Select the Right Platform

- Apply the following decision tree: If the user is non-technical and primarily connecting popular SaaS tools (Gmail, Slack, Salesforce, Google Sheets, Typeform), start with **Zapier** -- the integration library of 7,000+ connectors and one-click OAuth setup minimizes time-to-first-automation.
- If the automation has complex branching (routers), data aggregation (merging multiple API responses), array iteration (processing each row of a spreadsheet), or requires visual debugging of data flow, choose **Make (Integromat)** -- its canvas-based scenario builder handles these patterns natively and the $9/month Starter plan includes 10,000 operations, significantly more than Zapier's equivalent tier.
- If the user is a developer, has data privacy requirements, needs to run custom Python or JavaScript nodes, or wants to self-host for unlimited executions at near-zero marginal cost, choose **n8n** -- it runs on Docker with a single command (`docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n`) and has 400+ native integrations plus the HTTP Request node for anything else.
- If the user is on AWS and already has Lambda and EventBridge in their stack, consider whether a lightweight native AWS automation (EventBridge rule -> Lambda function) is more appropriate than adding a third-party platform.
- Never mix platforms for a single automation workflow. Running half the logic in Zapier and half in Make creates debugging nightmares and doubles the failure surface.

### Step 3: Design the Flow Architecture Before Building

- Use a simple notation: `TRIGGER -> STEP -> BRANCH -> STEP -> OUTPUT`. Draw this on paper, in Miro, or in a text file before opening any automation tool.
- Define every branch explicitly. For a binary condition (new vs. existing customer), define what happens in both the YES and NO paths all the way to completion. Never leave a branch path ending in nothing -- it must resolve to an action or an explicit "do nothing and log."
- Identify data dependencies: which step produces data that a later step consumes? These are your critical path nodes -- if they fail, everything downstream fails.
- For any step that calls an external API, note the rate limit. Common limits: Salesforce API -- 100,000 calls/day on Enterprise; Slack messaging -- 1 message/second per channel; Google Sheets -- 100 write requests/100 seconds per user; Stripe -- 100 read/100 write requests/second. Design batching or delays accordingly.
- Assign a unique automation ID (e.g., `AUTO-042`) and store it in your documentation before you build a single step. This ID goes into every log entry and error notification.

### Step 4: Build Incrementally with Test-First Discipline

- Build the trigger and first action only. Run a live test with real data. Inspect every field returned by the trigger -- the actual payload often differs from documentation.
- Add the second action. Test again. Never chain more than one untested step at a time.
- Add branching logic. Test every path explicitly -- including the path that should not fire. A filter that should block item X must be verified to actually block it.
- Use static test data (a hardcoded example payload) for initial builds, then switch to real-world data for 5-10 test runs before enabling live mode.
- In Make, use the "Run once" button and inspect every bubble in the execution visualization. In Zapier, use "Test step" on each action individually. In n8n, use the "Execute Node" button in the canvas editor.
- Never enable a new automation live on a Friday afternoon. Schedule go-live for Tuesday or Wednesday morning when you can monitor the first 24 hours of real execution.

### Step 5: Implement Comprehensive Error Handling

- Every automation needs at minimum three error-handling layers: **retry logic**, **error notification**, and **dead letter queue**.
- Retry logic: on transient failures (connection timeout, 429 rate limit, 503 service unavailable), retry with exponential backoff -- wait 1 minute, retry; wait 5 minutes, retry; wait 30 minutes, retry; then escalate. In Make, configure this in the scenario's error handler module. In Zapier, use the built-in "auto-replay" for failed tasks and add an error path using the Zapier built-in "Delay" + "Email" action. In n8n, use the "On Error" workflow trigger or wrap critical nodes in a try/catch using the Function node.
- Error notifications must include: automation name and ID, the specific step that failed, the error message verbatim, the input data that caused the failure (sanitized of PII if required), a timestamp with timezone, and the estimated business impact (e.g., "1 invoice not sent").
- Dead letter queue: create a dedicated "Automation Errors" sheet or database table with columns: automation_id, timestamp, step_name, error_type, raw_input, error_message, status (pending/resolved), resolved_by, resolved_at. Every unrecoverable failure writes a row here. Review this queue daily until the automation is stable, then weekly.
- Implement idempotency keys for any automation that creates records. Before creating a new CRM contact, search for existing contact by email. Before creating an invoice, check if invoice for this project/period already exists. Without idempotency, retries create duplicates.

### Step 6: Document, Monitor, and Maintain

- Complete the Documentation Template (see Output Format) before considering the automation "done." Future maintainers -- including future-you -- need this.
- Set up monitoring: in Zapier, enable "Zap History" alerts for failed tasks. In Make, configure the "Incomplete Executions" notification email. In n8n, use the execution log and set up a cron job that checks for failed executions and sends a daily summary.
- Define a success metric. For a lead-to-CRM automation: "100% of form submissions should create a CRM record within 2 minutes." Check this weekly for the first month.
- Schedule a monthly maintenance review: check for expired OAuth tokens (they typically expire every 60-90 days for OAuth 2.0 flows), review API changelog for any breaking changes, audit the dead letter queue for recurring error patterns, and verify the automation is still running at expected frequency.
- When a dependency app updates its API or changes its data schema, your automation will break silently. Subscribe to the changelog or status page of every critical app your automation depends on.

---

## Output Format

When delivering an automation design recommendation, use this complete template:

```
## Automation Architecture Document

### Metadata
- Automation ID: [AUTO-XXX]
- Name: [Category] - [Trigger] - [Primary Outcome]
  Example: "Sales - New Typeform Lead - CRM Contact + Slack Alert"
- Platform: [Zapier | Make | n8n | Other]
- Owner: [name or team]
- Created: [date]
- Last Updated: [date]
- Status: [Draft | Testing | Active | Deprecated]

---

### Business Case
- Problem solved: [one sentence describing the manual process being replaced]
- Trigger frequency: [e.g., ~40 times/month]
- Manual time per occurrence: [e.g., 8 minutes]
- Monthly manual time: [frequency × time = total hours]
- Fully-loaded hourly rate: [$X/hour]
- Monthly manual cost: [$X]
- Automation platform cost: [$X/month]
- Amortized setup cost: [setup hours × rate / 12 months = $/month]
- Net monthly savings: [$X]
- Payback period: [X weeks/months]

---

### Trigger Definition
- Trigger type: [Event-based | Schedule | Webhook | Manual | Polling]
- Source app: [app name]
- Trigger event: [specific event, e.g., "New form submission on 'Contact Us' form"]
- Polling interval (if applicable): [e.g., every 5 minutes]
- Test payload: [paste a sample trigger payload here]

---

### Flow Architecture

```
[TRIGGER: event description]
  |
  +--> [STEP 1: action description] -- Output: {field1, field2}
  |
  +--> [STEP 2: lookup/search] -- Input: {field1} -- Output: {record_id}
  |
  +--> [BRANCH: condition description]
       |
       +--> [YES PATH]
       |      +--> [STEP 3a: action]
       |      +--> [STEP 4a: action]
       |
       +--> [NO PATH]
              +--> [STEP 3b: action]
              +--> [STEP 4b: action]
  |
  +--> [FINAL STEP: logging/notification]
  |
  +--> [ERROR PATH: dead letter queue entry + alert]
```

---

### Step-by-Step Specification

| Step # | App | Action | Key Input Fields | Key Output Fields | Error Handling |
|--------|-----|--------|-----------------|-------------------|----------------|
| 1 | [App] | [Action type] | [field: source] | [field: value] | [retry/alert/skip] |
| 2 | [App] | [Action type] | [field: source] | [field: value] | [retry/alert/skip] |
| ... | | | | | |

---

### Data Mapping

| Source Field | Source Step | Transformation | Destination Field | Destination Step |
|-------------|-------------|---------------|-------------------|-----------------|
| email | Trigger | lowercase + trim | contact_email | Step 2 |
| amount | Trigger | multiply × 100 (cents) | amount_cents | Step 4 |
| created_at | Trigger | reformat to ISO 8601 | date_field | Step 5 |

---

### Error Handling Plan
- Retry strategy: [e.g., retry 3 times with 1/5/30 min backoff]
- Error notification: [who receives it, via what channel, within how long]
- Dead letter queue location: [specific sheet, table, or Slack channel]
- Manual fallback: [the manual steps a human takes when automation fails]
- Idempotency check: [describe the deduplication logic]

---

### Testing Checklist
- [ ] Happy path: normal data flows end-to-end
- [ ] Empty required field: handled gracefully
- [ ] Duplicate trigger: deduplication prevents double-processing
- [ ] Branch path A: YES condition fires correctly
- [ ] Branch path B: NO condition fires correctly
- [ ] Rate limit scenario: throttling/batching works
- [ ] API failure simulation: retry and error notification fire
- [ ] Volume test: 50+ items processed in sequence without errors
- [ ] Timezone test: schedule triggers at expected time in correct timezone
- [ ] Error notification: alert reaches intended recipient with correct content

---

### Monitoring
- Expected execution frequency: [e.g., 40 times/month, ~10/week]
- Success metric: [e.g., "100% of triggers create CRM record within 3 minutes"]
- Log location: [platform execution history URL or custom log sheet]
- Alert threshold: [e.g., "Notify if 0 executions in any 48-hour window"]
- Review schedule: [weekly for first month, then monthly]

---

### Dependencies
- Connected accounts/OAuth: [list each app and when the token was last refreshed]
- API keys: [list where each is stored -- never in the doc itself]
- Other automations this depends on: [upstream automations]
- Other automations that depend on this: [downstream automations]
```

---

## Rules

1. **Never automate a broken process.** If the manual process produces incorrect results, the automation will produce incorrect results at higher speed and lower visibility. Diagnose and fix the underlying process logic before writing a single automation step.

2. **Every automation must have an error path.** A workflow with no error handling is not an automation -- it is a time bomb. The default behavior of all three major platforms (Zapier, Make, n8n) on failure is to stop silently. You must explicitly add error paths.

3. **Use idempotency checks on all record-creation steps.** Before creating any CRM contact, invoice, ticket, or database row, always search first. Use a unique business key (email address, order ID, external reference number) as the deduplication field. Never rely on the triggering system to guarantee exactly-once delivery.

4. **Map data transformations explicitly before building.** Date formats, number formats (integer vs. decimal vs. cents), string encoding, and timezone offsets cause more automation failures than any other source. Document every transformation in the Data Mapping table and test each one independently.

5. **Respect API rate limits with explicit throttling.** Do not process arrays or bulk records in tight loops. In Make, use the iterator + aggregator pattern with a "Sleep" module to insert deliberate delays. In n8n, use the "Split In Batches" node with a batch size of 10-50 and a "Wait" node between batches. In Zapier, use the built-in "Delay by Zapier" step.

6. **Never hardcode credentials, API keys, or passwords in automation steps.** Use the platform's credential store (Zapier Connections, Make Connections, n8n Credentials). For n8n self-hosted, store secrets in environment variables referenced by `{{ $env.MY_SECRET_KEY }}`, never in the workflow JSON.

7. **Test every branch path, not just the happy path.** A filter that passes valid records must also be verified to block invalid ones. A branch that routes high-value leads to one path and standard leads to another must be tested with data that hits both paths. Untested branches are bugs waiting to happen.

8. **Assign every automation a unique ID and document it before building.** When three automations all touch the same CRM and one starts creating duplicate records, you need to know which automation is responsible. The automation ID in every log entry and error notification is what makes debugging tractable.

9. **Schedule go-live and monitor the first 48 hours actively.** The first real-world executions always surface data edge cases that testing missed. Plan to be available for the first two business days after enabling any automation that touches customer data or financial records.

10. **Audit OAuth tokens every 90 days.** Google, Salesforce, and most enterprise OAuth 2.0 providers issue refresh tokens that expire after 60-90 days of inactivity or after a password change. Set a calendar reminder to re-authenticate each connected account before the token expires, or your automation will fail silently until someone notices a missing email or CRM record.

---

## Edge Cases

### 1. The Trigger Fires Multiple Times for the Same Event
**Scenario:** A webhook fires twice for the same Stripe payment, or a form submission triggers Zapier twice because the form app retried its webhook delivery after a timeout.
**Handling:** Implement an idempotency check as the first step after the trigger. Extract the unique event ID (Stripe event ID, form submission ID, order number) and check it against a "Processed Events" log (a simple Google Sheet or Airtable table with the event_id column and a UNIQUE constraint). If the event_id already exists, terminate the automation with a "Already processed -- skipping" log entry. Only proceed if the event_id is new, then immediately write it to the log before taking any downstream actions.

### 2. A Downstream API is Temporarily Unavailable
**Scenario:** The CRM API returns a 503 during a Stripe -> CRM automation that processes new customer signups. Retries exhaust and the item is dropped.
**Handling:** Never let retries simply drop the item. After exhausting retries (3 attempts over 36 minutes total with 1/5/30-minute backoff), write the full trigger payload to a "Retry Queue" sheet with a timestamp and status "pending." Build a separate scheduled automation (runs every 4 hours) that reads the Retry Queue, attempts to reprocess each pending item, and marks it "resolved" or increments a "retry_count." After 3 daily retry attempts from the queue, escalate to "manual_required" and notify the operations team.

### 3. Required Data Field is Empty or Null
**Scenario:** A lead form has an optional "Company" field. A downstream step tries to create a CRM account with that company name and fails because the field is null.
**Handling:** Add a data validation step immediately after the trigger. For each field required by downstream actions, check if it is empty/null. Apply defaults where appropriate: missing company name -> "Individual"; missing phone -> "Not provided"; missing country -> "US" (if your data suggests a reasonable default). For fields where a default would cause downstream data integrity issues (like a primary email address), branch to a "data incomplete" path that sends a follow-up email to the lead asking for the missing information and queues the record for manual review.

### 4. High-Volume Burst Events Exceed Platform Operation Limits
**Scenario:** A marketing campaign sends 5,000 leads through a Typeform in a single hour. Your Make scenario processes each submission, hitting the monthly 10,000-operation limit after 2 days.
**Handling:** Re-architect for batch processing. Instead of trigger-per-row, use a schedule-based trigger (every 15 minutes) that reads new rows added since the last run, processes them as a batch, and records the last-processed row ID. In Make, use the Google Sheets "Watch Rows" with a limit of 100 rows per execution to control operation consumption. In n8n, the "Split In Batches" node with size 50 and a rate limit delay handles this natively. Calculate your expected monthly operation count (frequency × avg items per trigger × steps per item) and verify it fits within your plan tier before launching any campaign-driven automation.

### 5. Automation Must Handle Multiple Timezones
**Scenario:** A meeting follow-up automation sends emails "2 hours after the meeting ends" but the calendar app stores event times in UTC and the user's team spans EST, CST, and PST.
**Handling:** Never use the automation platform's system timezone or assume UTC equals local time. Store the attendee's timezone in the CRM or calendar record explicitly. Use the platform's date/time transformation functions to convert all datetimes to a single canonical timezone (UTC) for storage and comparison, then convert to the recipient's local timezone for display. In Make, use the `parseDate` and `formatDate` functions with explicit timezone parameters. In n8n, use the Moment.js expressions available in the Function node: `moment(dateString).tz('America/New_York').format('YYYY-MM-DD HH:mm')`. Test your scheduling automations by creating test events in at least three timezones and verifying the delay calculation is correct for each.

### 6. The Automation Must Pause for Human Approval
**Scenario:** An expense approval automation should automatically approve expenses under $500 but route expenses over $500 to a manager for manual approval before processing payment.
**Handling:** For the human-in-the-loop approval step, generate a unique approval token (a UUID or a hash of the record ID + timestamp) and store it in a lookup table. Send the manager an email containing an "Approve" link and a "Reject" link, each containing the token as a URL parameter (pointing to a simple webhook receiver). The automation then waits using a delay step (check every 4 hours for up to 72 hours). When the manager clicks a link, the webhook fires, the automation resumes, looks up the token to retrieve the record context, and routes to the approve or reject path. In n8n, use the "Wait" node with a webhook resume URL -- this is natively supported. In Make, use an HTTP module polling a status endpoint or a Google Sheet flag checked on a schedule.

### 7. Migrating an Existing Automation Between Platforms
**Scenario:** A company built 30 Zaps on Zapier and wants to migrate to n8n for cost savings and self-hosting control.
**Handling:** Do not attempt a bulk migration. Catalog all existing automations by business criticality: Tier 1 (revenue-critical, customer-facing), Tier 2 (operational, internal), Tier 3 (convenience, personal productivity). Migrate Tier 3 first -- lowest risk, builds team familiarity with n8n. For each migration, run the n8n version in parallel with the Zapier version for 2 weeks, comparing outputs. When the n8n version matches output quality, disable the Zapier version. Never migrate Tier 1 automations during high-traffic periods (end of quarter, product launches). Maintain a rollback plan: keep the Zapier automation disabled-but-intact for 30 days after each migration so you can re-enable immediately if the n8n version has an undiscovered failure mode.

### 8. Automation Breaks After a Third-Party App Updates Its API
**Scenario:** A core automation stops working because a connected app changed its API response structure -- a field was renamed from `customer_email` to `email_address`, or a date field changed format from `MM/DD/YYYY` to ISO 8601.
**Handling:** This is the most common silent failure mode for mature automations. Prevention: subscribe to the API changelog of every critical connected app. Detection: your monitoring automation (runs every 4 hours, checks execution log for recent successful runs) will catch this within hours. Recovery: review the most recent successful execution's data payload against the current failing payload to identify the changed fields. Update all references to the renamed/reformatted field. Going forward, add a data validation node early in the automation that asserts expected fields are present and logs a descriptive error if they are not -- "Expected field 'customer_email' not found in trigger payload" is far more debuggable than "Cannot read properties of undefined."

---

## Example

**User Input:** "I run a small consulting firm. Every time a new client signs a contract in DocuSign, I have to manually: create a project in Asana, create a client record in HubSpot, send a welcome email, create a Slack channel for the client, and set up a Google Drive folder. This takes me about 45 minutes per new client and I onboard 4-6 clients per month. I'm comfortable with JSON and basic expressions but not heavy coding. What's my budget? Probably $50/month maximum."

**Output:**

---

## Automation Architecture Document

### Metadata
- **Automation ID:** AUTO-031
- **Name:** Operations -- DocuSign Contract Signed -- Client Onboarding Suite
- **Platform:** Make (Integromat) -- Recommended (see rationale below)
- **Owner:** [Consulting firm owner]
- **Created:** [current date]
- **Status:** Draft

**Platform rationale:** This automation has 5 parallel and sequential actions, branching potential (new vs. returning client), and requires robust data mapping between apps with different field schemas. Make's visual canvas, native router module, and $16/month Core plan (10,000 operations/month) fits within the $50 budget and handles this complexity without custom code. Zapier would require the $49/month Professional plan for multi-step zaps with paths. n8n self-hosted is viable if the user is comfortable with Docker, but the setup overhead is higher for this level of technical comfort.

---

### Business Case

| Metric | Value |
|--------|-------|
| Trigger frequency | 5 clients/month (midpoint of 4-6) |
| Manual time per occurrence | 45 minutes |
| Monthly manual time | 3.75 hours |
| Fully-loaded hourly rate | $150/hour (consulting firm principal) |
| Monthly manual cost | $562.50 |
| Make Core plan | $16/month |
| Estimated setup time | 6 hours × $150/hour = $900 |
| Amortized setup cost (12 months) | $75/month |
| **Net monthly savings (Year 1)** | **$562.50 - $16 - $75 = $471.50** |
| **Net monthly savings (Year 2+)** | **$562.50 - $16 = $546.50** |
| **Payback period** | ~2 months |

**Hidden ROI:** Welcome email goes out in under 2 minutes vs. same-day-if-remembered. Every client gets the same onboarding quality. Zero missed Slack channel creations. Owner recovers 45 hours/year for billable or strategic work.

---

### Trigger Definition
- **Trigger type:** Event-based (webhook)
- **Source app:** DocuSign
- **Trigger event:** Envelope status changes to "completed" (all parties have signed)
- **Platform module:** Make -> DocuSign -> Watch Envelope Status Changes -> Filter: status = "completed"
- **Key trigger payload fields:**
  - `envelope_id` -- unique ID for deduplication
  - `signer_email` -- client's email address
  - `signer_name` -- client's full name
  - `completed_date_time` -- ISO 8601 timestamp
  - Custom fields embedded in the DocuSign template: `client_company`, `project_name`, `contract_value`, `engagement_type` (retainer/project)

**Note:** Configure DocuSign envelope templates to include custom fields (`client_company`, `project_name`, `contract_value`, `engagement_type`) using DocuSign's Template Editor -> Text Tabs. These are retrievable via the API and eliminate manual data entry as the source of truth for what the contract covers.

---

### Flow Architecture

```
[TRIGGER: DocuSign -- Envelope Completed]
  |
  +--> [STEP 1: DEDUP CHECK]
         Search "Processed Envelopes" Google Sheet for envelope_id
         |
         +--> [ALREADY EXISTS: terminate + log "duplicate skipped"]
         |
         +--> [NEW: write envelope_id to sheet, continue]
  |
  +--> [STEP 2: HUBSPOT LOOKUP]
         Search HubSpot Contacts by signer_email
         |
         +--> [BRANCH A: Contact exists]
         |      Update contact: last_contract_date, contract_value, project_name
         |
         +--> [BRANCH B: New contact]
                Create HubSpot Contact: name, email, company, contract_value
                Create HubSpot Company (if not exists): client_company
                Associate contact with company
  |
  +--> [STEP 3: ASANA PROJECT CREATE]
         Create project in Asana under "Active Clients" portfolio
         Name: "[client_company] -- [project_name]"
         Due date: completed_date_time + 90 days (configurable)
         Assign to: owner's Asana user ID
         Add default task list: Kickoff call, Discovery session, First deliverable, Final review
  |
  +--> [STEP 4: GOOGLE DRIVE FOLDER CREATE]
         In "Clients" parent folder, create subfolder: "[client_company] -- [project_name]"
         Create subfolders: /Contracts, /Deliverables, /Correspondence, /Internal
         Move the completed DocuSign PDF to /Contracts subfolder
         (Retrieve PDF via DocuSign API: GET /envelopes/{envelope_id}/documents/combined)
  |
  +--> [STEP 5: SLACK CHANNEL CREATE]
         Create private Slack channel: client-[slugified client_company]
         (e.g., "acme-corp" from "Acme Corp" -- lowercase, spaces to hyphens, strip special chars)
         Invite owner's Slack user ID
         Post pinned welcome message with: Asana project link, Drive folder link, client contact info
  |
  +--> [STEP 6: WELCOME EMAIL SEND]
         Via Gmail (or SendGrid for better deliverability):
         To: signer_email
         Subject: "Welcome to [Your Firm Name] -- Next Steps for [project_name]"
         Body: personalized template with client_name, project_name, kickoff scheduling link,
               Google Drive shared folder link (share folder with client_email first),
               owner's direct contact info
         BCC: owner's email address
  |
  +--> [STEP 7: LOG COMPLETION]
         Append row to "Client Onboarding Log" Google Sheet:
         envelope_id, client_company, signer_email, project_name, contract_value,
         completed_date_time, asana_project_id, hubspot_contact_id, drive_folder_id,
         slack_channel_id, welcome_email_sent (TRUE/FALSE), processing_time_seconds,
         timestamp_completed
  |
  +--> [ERROR PATH (any step fails)]
         Log to "AUTO-031 Error Queue" sheet: step_number, error_message, raw_payload, timestamp
         Send Slack DM to owner:
         "AUTO-031 FAILED on Step [N] for [client_company].
          Error: [error_message]. Check error queue: [sheet link]"
```

---

### Step-by-Step Specification

| Step # | App | Action | Key Input Fields | Key Output Fields | Error Handling |
|--------|-----|--------|-----------------|-------------------|----------------|
| 1 | Google Sheets | Search Row | envelope_id | match (yes/no) | Retry 3x; terminate if sheet unreachable |
| 2 | HubSpot | Search Contact | signer_email | contact_id (or null) | Retry 3x with backoff; alert on persistent fail |
| 2a | HubSpot | Create Contact | name, email, company, contract_value | contact_id | Retry 3x; write to error queue |
| 2b | HubSpot | Update Contact | contact_id, last_contract_date | updated_at | Retry 3x; write to error queue |
| 3 | Asana | Create Project | name, portfolio_id, due_date, owner_id | project_id, project_url | Retry 3x; alert on fail (project can be created manually) |
| 4 | Google Drive | Create Folder | parent_folder_id, folder_name | folder_id, folder_url | Retry 3x; alert on fail |
| 4b | DocuSign | Get Document | envelope_id, document_type=combined | PDF binary | Retry 3x; log "PDF retrieval failed, upload manually" |
| 5 | Slack | Create Channel | channel_name (slugified) | channel_id | Handle 409 "name taken" -- append -2, -3 suffix; retry |
| 6 | Gmail | Send Email | to, subject, body (HTML), bcc | message_id | Retry 3x; fallback to Slack DM to owner with email content |
| 7 | Google Sheets | Append Row | all output fields | row_number | Retry 5x; this is critical for audit trail |

---

### Data Mapping

| Source Field | Source Step | Transformation | Destination Field | Destination Step |
|-------------|-------------|---------------|-------------------|-----------------|
| `signer_name` | Trigger | Split on first space: first = first_name, remainder = last_name | `firstname`, `lastname` | HubSpot Create Contact |
| `signer_email` | Trigger | `toLowerCase().trim()` | `email` | HubSpot Search + Create |
| `client_company` | Trigger | `trim()` | `company`, `name` | HubSpot, Asana, Slack, Drive |
| `client_company` | Trigger | `toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')` | `channel_name` prefix | Slack Create Channel |
| `completed_date_time` | Trigger | Parse ISO 8601, add 90 days | `due_on` (YYYY-MM-DD) | Asana Project |
| `contract_value` | Trigger | Parse to float, store as number | `contract_value__c` | HubSpot Contact property |
| Asana `project_url` | Step 3 | Direct passthrough | In Slack pinned message + Drive folder | Steps 5, 7 |
| Drive `folder_url` | Step 4 | Share with `signer_email` first, then pass URL | In welcome email + Slack | Steps 6, 5 |

---

### Error Handling Plan
- **Retry strategy:** Steps 1-7 each retry 3 times with 1-minute, 5-minute, and 30-minute backoff before failing to error path. Step 7 (logging) retries 5 times -- audit trail integrity is highest priority.
- **Error notification:** Slack DM to owner within 35 minutes of first failure (after all retries exhaust). Message includes step number, error text, client name, and direct link to error queue sheet.
- **Dead letter queue:** Google Sheet "AUTO-031 Error Queue" with columns: timestamp, envelope_id, client_company, step_failed, error_message, raw_payload, status, resolved_by, resolved_at.
- **Manual fallback:** The error notification includes a checklist: "Manually complete: [ ] HubSpot contact [ ] Asana project [ ] Drive folder [ ] Slack channel [ ] Welcome email." Each item links to the relevant app.
- **Idempotency:** Step 1 checks envelope_id against the Processed Envelopes log before any action. If DocuSign fires the webhook twice for the same signed envelope (this happens approximately 5% of the time due to DocuSign's at-least-once delivery guarantee), the second execution terminates after step 1 with no side effects.

---

### Slack Channel Naming Edge Cases
The Slack channel name transformation deserves explicit attention because Slack has strict naming rules (lowercase, max 80 chars, only letters/numbers/hyphens/underscores, no spaces):

- "Acme Corp" -> `client-acme-corp` ✓
- "O'Brien & Associates LLC" -> `client-obrien-associates-llc` ✓ (strip apostrophes and ampersands)
- "123 Main Street Consulting" -> `client-123-main-street-consulting` ✓
- "Müller GmbH" -> Normalize Unicode to ASCII first: `client-muller-gmbh` ✓

If the generated channel name already exists (a second engagement with the same client), append the year: `client-acme-corp-2025`. Catch the Slack API error code `name_taken` (HTTP 400) in the error handler and retry with the year suffix.

---

### Testing Checklist
- [ ] Happy path: new client, all DocuSign custom fields populated, all 7 steps complete successfully
- [ ] Returning client: signer_email already in HubSpot -- Step 2 routes to UPDATE, not CREATE
- [ ] Duplicate webhook: same envelope_id fires twice -- second execution terminates at Step 1 with "already processed" log
- [ ] Missing `client_company` field: DocuSign template missing custom field -- Step 1 catches null, routes to error path with specific message "client_company field empty in DocuSign envelope"
- [ ] Slack channel name collision: client with same company name has prior engagement -- year suffix applied, channel created successfully
- [ ] HubSpot API down: retries exhaust, error notification fires, manual fallback checklist delivered to owner
- [ ] Contract value as text ("$15,000" instead of "15000"): transformation strips "$" and "," and parses to float correctly
- [ ] Long company name: "International Business Technology Consulting Partners LLC" -- Slack channel truncated to 80 chars, Asana project name preserved in full
- [ ] Drive PDF retrieval: DocuSign document download tested with real completed envelope before go-live
- [ ] Welcome email rendering: test on Gmail, Outlook, and mobile -- HTML template verified

---

### Monitoring
- **Expected frequency:** 5 executions/month (~1.25/week)
- **Success metric:** 100% of DocuSign "completed" envelopes result in all 7 steps completing within 10 minutes
- **Alert threshold:** If zero executions occur in any 10-day window during an active month, send owner a Slack reminder to check automation health (a separate 10-day cron automation in Make that checks the "Client Onboarding Log" sheet for recent entries)
- **Log location:** "Client Onboarding Log" Google Sheet + Make execution history (kept for 30 days on Core plan)
- **Review schedule:** Weekly for first month (check error queue, verify all fields mapping correctly), then monthly

---

### Dependencies
- DocuSign account with API access enabled (requires at least Business Pro plan)
- Make Core plan ($16/month) -- verify 10,000 operations/month is sufficient: 5 clients × ~25 operations per execution = 125 operations/month. Well within limit.
- HubSpot CRM (free tier sufficient for contact/company create and search)
- Asana (Premium or Business required for portfolios; use a regular project list if on free tier)
- Google Workspace (Drive + Gmail)
- Slack (any paid plan for private channel creation via API; free Slack does not support channel creation via API)
- **OAuth tokens to refresh every 90 days:** Google, HubSpot, Slack, DocuSign, Asana

---

### Go-Live Plan
1. Run in Make's "test mode" with a real but non-critical DocuSign test envelope (use a sandbox DocuSign account)
2. Verify all 7 steps complete and all output fields are correct
3. Enable live mode on a Tuesday morning
4. Monitor Make execution log actively for the first 5 live executions
5. After 30 days, review error queue (expect zero unresolved items), review Client Onboarding Log (expect 5 ± 2 rows), confirm HubSpot, Asana, Drive, and Slack all have correct records for each new client
