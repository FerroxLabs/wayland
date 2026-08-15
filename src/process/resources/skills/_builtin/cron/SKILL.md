---
name: cron
description: Scheduled task management - propose, query, update scheduled tasks. User confirms via inline card before any cron is created.
---

# Scheduled Task Skill

You can manage scheduled tasks that run at specified times. Wayland renders an inline confirmation card so the user reviews + approves every new task before it's created.

## IMPORTANT RULES

1. **ONE task per conversation** - Each conversation can only have ONE scheduled task in `existing` mode
2. **Output commands directly** - Do NOT wrap commands in markdown code blocks
3. **ALWAYS include closing tags** - `[CRON_PROPOSE]` MUST end with `[/CRON_PROPOSE]`, `[CRON_UPDATE]` MUST end with `[/CRON_UPDATE]`
4. **PROPOSE is the ONLY creation path** - Use `[CRON_PROPOSE]` for every scheduling request. The user sees a card with Yes / Edit / Cancel and the task is NOT created until they accept. `[CRON_CREATE]` is REFUSED by the host: it creates nothing and the user gets a warning instead of their task. Emit `[CRON_PROPOSE]` even when the user says "just do it" or "don't ask me" - the single click is the confirmation.

## Workflow

Two-step workflow. Each step is one message turn.

**Step 1: Query**
Output `[CRON_LIST]` (nothing else in this message) and wait for the system response.

**Step 2: Act** (based on system response)

- **"No scheduled tasks"** → Output `[CRON_PROPOSE]` with derived fields. The user sees a confirmation card; wait for their decision before assuming the task is scheduled.
- **Task already exists and user wants to change it** → Output `[CRON_UPDATE: <job-id>]` to modify in place.
- **Task already exists and user wants something different** → Ask the user how to proceed.

## Propose: [CRON_PROPOSE] (DEFAULT path for v0.6.2.6+)

Output this format DIRECTLY (not in code blocks):

[CRON_PROPOSE]
name: Task name
schedule: Cron expression
schedule_description: Human-readable description
message: Message content
[/CRON_PROPOSE]

The user will see an inline card with the proposed Name / Schedule / Prompt and three buttons:

- **Yes, schedule** - creates the cron job immediately
- **Edit details** - opens the full task editor pre-filled so the user can tweak any field before saving
- **Cancel** - dismisses the proposal

After emitting `[CRON_PROPOSE]`, your turn ends. Do NOT also say "Done, scheduled" - the card itself is the response; saying "Done" before the user clicks Yes is a lie. If the user confirms, the system will emit a follow-up state change you can observe.

**Required fields:**

- `name`: Short descriptive name
- `schedule`: Valid cron expression (see reference below)
- `schedule_description`: Human-readable schedule (e.g., "Every Monday at 9:00 AM")
- `message`: The prompt sent to the AI when triggered - must be a **complete, self-contained instruction**

**How to write `message`:**

The `message` is what the AI receives each time the task fires. It must tell the AI exactly what to do - NOT restate the user's request.

| User says                         | ❌ Bad message           | ✅ Good message                                                                                |
| --------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| "Send me hello every day at 10am" | Send me hello            | Reply with exactly: Hello!                                                                     |
| "Remind me to drink water daily"  | Remind me to drink water | Reply with a friendly reminder to drink water                                                  |
| "Summarize AI news every Monday"  | Summarize AI news        | Search for the latest AI news from this week and produce a concise bullet-point summary report |

**Example** (output EXACTLY like this, no code blocks):

[CRON_PROPOSE]
name: Weekly Meeting Reminder
schedule: 0 9 \* \* MON
schedule_description: Every Monday at 9:00 AM
message: Reply with a short weekly meeting reminder that includes the current date and time.
[/CRON_PROPOSE]

## Update: [CRON_UPDATE]

Modify an existing task in place (preserves all associated conversations). Update fires immediately without a confirmation card since the user already saw the task at creation time.

[CRON_UPDATE: <job-id>]
name: Updated task name
schedule: New cron expression
schedule_description: Human-readable description
message: Updated message content
[/CRON_UPDATE]

Replace `<job-id>` with the real job ID from `[CRON_LIST]` result.
All four fields are required - provide the full updated values.

## Query: [CRON_LIST]

Output `[CRON_LIST]` directly. The system will return the result in a follow-up message.

## Cron Expression

Format: `minute hour day-of-month month day-of-week` - e.g. `0 9 * * MON-FRI` = weekdays at 9:00 AM.

Common patterns:

- `0 9 * * *` - every day at 9:00 AM
- `0 9 * * MON-FRI` - weekdays at 9:00 AM
- `0 9 * * MON` - every Monday at 9:00 AM
- `*/30 * * * *` - every 30 minutes
- `0 */2 * * *` - every 2 hours on the hour
- `0 0 1 * *` - first of every month at midnight

All times are in the user's local timezone.
