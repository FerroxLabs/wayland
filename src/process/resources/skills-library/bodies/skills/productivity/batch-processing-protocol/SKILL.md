---
name: batch-processing-protocol
description: |
  Designs batch processing protocols for personal tasks by defining batch
  triggers, sequence steps, required inputs, and output checklists. Use when
  the user wants to process similar items in batches instead of one at a time,
  create a repeatable protocol for periodic bulk work, or design a system for
  handling accumulated items efficiently. Do NOT use for enterprise batch
  processing systems, software data pipelines, or business operations process
  design (use business operations or software development skills instead).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "automation planning checklist"
  category: "productivity"
  subcategory: "automation"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Batch Processing Protocol

## When to Use

Use this skill when a user describes any of these situations:

- The user processes the same type of item repeatedly throughout the day or week and wants to consolidate those interruptions into dedicated sessions (examples: reviewing expense reports as they arrive, answering similar support requests one at a time, manually logging sales calls, tagging and filing photos after each shoot)
- The user asks how to stop letting accumulated work pile up into an overwhelming backlog -- they want a structured system for clearing a queue efficiently rather than letting it become stressful
- The user wants a repeatable, written protocol they can follow without re-inventing the approach each time (examples: weekly newsletter curation, monthly contract renewals, quarterly performance review drafts)
- The user mentions that context switching between different task types is hurting their focus and they want to consolidate like-for-like work into a single window
- The user has a predictable volume of incoming items (even if timing is irregular) and wants to design a cadence that matches that volume rather than reacting to each arrival
- The user is onboarding someone else to do their recurring processing work and needs a documented protocol the other person can follow without supervision
- The user describes a backlog situation -- they have let items accumulate without a system and now want to design a protocol that handles both the backlog and the ongoing flow

**Do NOT use this skill when:**

- The user needs a software data pipeline or ETL process (use a software architecture or data engineering skill instead -- the concepts of batch trigger, queue, and processing loop apply but the implementation is entirely technical)
- The user wants to design a business-wide operations process involving multiple departments, approval chains, or ERP systems (use a business process design or operations workflow skill instead)
- The user wants to reduce how often they do a single recurring task, not how they process accumulated items (use `recurring-task-optimizer` -- the distinction is: batch processing handles queues of similar items, recurring task optimization handles the cadence of standalone tasks)
- The user is asking about personal productivity frameworks like time blocking, deep work, or calendar architecture without a specific item type to process (use a time management or scheduling skill instead)
- The user needs to prioritize a backlog of dissimilar tasks (use a task prioritization skill -- batching only works when items are similar enough to follow the same processing sequence)
- The user wants to automate the processing using software tools (use an automation or workflow tool skill instead -- this skill designs human-executed protocols, not software automations)
- The user wants to track habits or streaks around processing cadence (use a habit design skill instead)

---

## Process

### Step 1: Diagnose the Batch Candidate

Before designing anything, gather precise information about what the user is processing. The protocol quality depends entirely on how well you understand the item type.

- Ask or infer: **What type of item accumulates?** Be specific. "Emails" is too vague -- "vendor invoice emails requiring three-way match before payment approval" is precise enough to design a protocol. The item type determines whether the per-item sequence can be standardized.
- Ask: **What is the current arrival rate?** Get a number: items per day, per week, or per month. If the user says "varies a lot," establish a low end, a typical week, and a high end. You will use all three to calibrate the trigger.
- Ask: **How long does one item take today, end-to-end?** This is the per-item processing time. Users often underestimate this. If they say "2 minutes," probe what that includes: does it include finding the item, opening the relevant system, making a decision, filing it, and logging it? Every step counts.
- Ask: **What is the acceptable delay?** Different item types have different urgency tolerances. A customer complaint email may have a 4-hour tolerance; a vendor invoice may have a 2-day tolerance; a book highlight to review may have a 2-week tolerance. The acceptable delay determines the maximum trigger interval.
- Ask: **What tools or systems does processing require?** Every system the user needs to open adds friction. Identifying these upfront allows you to build them into the pre-batch setup checklist.
- Ask: **What does "done" look like for one item?** If the user cannot articulate a clear done state, the per-item sequence will be ambiguous. Press for specificity: "filed in X folder with status updated in Y system" is a done state. "Handled" is not.
- Look for **natural groupings** within the item type. If some items require a decision and others are purely mechanical, those may need separate processing sequences or a triage step.

---

### Step 2: Select and Configure the Batch Trigger

The trigger is the most operationally critical component of the protocol. A poorly chosen trigger causes batches to be too large (marathon sessions), too small (constant context switching), or too infrequent (backlog buildup).

- **Time-based triggers** work best when item arrival is predictable and the acceptable delay aligns with a clean calendar rhythm. Common examples: daily at 4 PM, Tuesday and Thursday at 9 AM, every Friday morning. The risk is that a time trigger fires when the queue is nearly empty (wasted setup overhead) or after a flood (batch is too large for the window).
- **Count-based triggers** work best when arrival is irregular but volume is predictable. Set the count threshold at the batch size that fills roughly 60-75% of the available processing window. Example: if you have 60 minutes and each item takes 8 minutes, a threshold of 6-7 items fills the window without risking overrun. Never set the count threshold at the mathematical maximum -- leave 15-20% buffer for items that take longer than average.
- **Hybrid triggers** (count OR time, whichever fires first) are the most robust for most personal processing situations. They protect against both the flood scenario (count trigger caps the batch) and the drought scenario (time trigger ensures the queue gets cleared even when few items arrive). Always recommend hybrid triggers unless the user's item type has a very consistent arrival rate.
- **Event-based triggers** work well when processing naturally follows another activity. Examples: process the week's voicemails immediately after Friday team standup; process the week's receipts every time you complete an expense report; process interview feedback forms within 24 hours of the last interview in a hiring cycle. Event triggers are easy to remember because they piggyback on an existing anchor.
- **Set a maximum batch size in BOTH items and minutes.** These are two separate ceilings, not alternatives. Example: "No more than 12 items AND no more than 75 minutes, whichever is reached first." This prevents marathon sessions when items are more complex than average.
- **Calculate the trigger math explicitly:** (count threshold) x (per-item average time) = expected batch duration. This duration should land between 30 minutes and 90 minutes for most protocols. Under 30 minutes means the trigger fires too often for the overhead to be worth it; over 90 minutes means the session is too long to sustain focus without fatigue degrading quality.
- For new protocols, recommend starting with a **slightly more frequent trigger than seems necessary.** It is easier to extend the interval once the user sees the queue size than to undo a backlog that built up because the trigger was too infrequent.

---

### Step 3: Design the Pre-Batch Setup Phase

The pre-batch phase eliminates the setup friction that causes users to procrastinate on processing sessions. Every item in this checklist should be completable in under 2 minutes total. If setup takes longer than 2 minutes, the protocol will be avoided.

- **Identify every tool and system the user needs open before the first item begins.** List them explicitly. "Open Gmail, navigate to the Pending Review label, open the expense tracker in a second tab, pull up the vendor contract folder in Drive" is a real pre-batch checklist. "Get your materials ready" is not.
- **Include a workspace clearing step.** Close unrelated browser tabs, silence phone notifications (or set to Do Not Disturb), and set the physical or digital environment to reduce interruption. This is not optional -- cognitive interruptions during a batch session increase per-item time by 15-40% due to re-orientation overhead.
- **Include a triage or sort step for batches where complexity varies significantly.** Before processing begins, do a 60-second scan of all items and sort them into: Quick (under half the per-item average), Standard (within normal range), Complex (above 1.5x the per-item average), and Exceptions (items that cannot wait or cannot be batch-processed). Process Exceptions immediately after setup. Then decide: process Quick items first (builds momentum, clears volume) or process Standard items first (most consistent pace). Complex items typically go last unless they have a deadline.
- **Require the user to count items and estimate session duration before starting.** Write the count down: "13 items x 8 min = 104 min. That exceeds my 90-minute limit, so I will process 10 today and set the remainder for next batch." This prevents the most common batch processing failure: starting a session that was always going to overrun the available time.
- **Set a timer for the total session.** Not optional. A timer creates a commitment device that prevents individual items from ballooning. When the timer fires, the batch is over regardless of the queue state.
- **If this is the first run of the protocol or the first run after a long gap,** add a "warm-up" note: review the per-item processing sequence and the expense category reference (or equivalent domain reference) before starting, not during. Reviewing mid-batch creates pauses that break rhythm.

---

### Step 4: Design the Per-Item Processing Sequence

This is the core of the protocol. The per-item sequence must be granular enough that the user is making decisions about content, not decisions about process. Process decisions kill batch momentum.

- **Break each item into 3-6 discrete steps with time allocations.** Each step should have a clear action verb: verify, code, approve, tag, draft, file, log, flag. Vague verbs like "handle," "review," or "deal with" are not actionable in a timed sequence.
- **Time-allocate each step.** If step 1 (verify) takes 1 minute, step 2 (process) takes 4 minutes, and step 3 (file) takes 1 minute, write those times explicitly. Users who see time allocations develop realistic pacing expectations and are less likely to let one step expand to fill the whole item window.
- **Include a decision tree for every branch point.** The typical item has 3-4 states:
  - **Standard:** Item matches the expected pattern, process normally
  - **Edge case:** Item has an unusual attribute (unexpected amount, missing information, unfamiliar source) -- define the exact handling for each known edge case
  - **Escalation:** Item requires a decision or input from someone else -- define the escalation action (send one specific email, add to a specific list) and immediately remove the item from the active queue
  - **Defer:** Item cannot be processed right now for a defined reason -- define what constitutes a valid defer reason, how the item is marked, where it goes, and when it will be revisited
  - **Discard:** Item turns out not to need processing (duplicate, canceled, irrelevant) -- define what qualifies for discard and how it is marked
- **Set a per-item time limit.** When the timer for a single item expires, the user must choose one of three actions: complete it (if within 30 seconds of done), defer it (if more work is needed), or escalate it (if it requires external input). They may not continue processing the item. This rule is the single most important mechanism for keeping a batch on schedule.
- **Define the done state with physical precision.** "Done" should be a state you can verify by looking: the email is in the "Processed" label, the row in the spreadsheet is marked "Approved," the file is in the "Completed Q4" folder. A done state that requires judgment ("looks done," "feels handled") will cause the user to second-guess and re-open items.
- **Minimize tool-switching within the per-item sequence.** Each time the user switches between applications or systems during item processing, they incur a ~30-second reorientation cost. Design the sequence to front-load reading (gather all information from all sources) before switching to acting (update all systems). "Read-then-act" sequences are faster than "read-act-read-act" sequences.
- **Use parallel processing where the item type allows.** If one step involves waiting (sending an email and waiting for a status to refresh, or an upload to complete), design the next item's first step to happen during that wait rather than staring at a progress bar.

---

### Step 5: Design the Exception and Escalation Path

Every batch protocol needs a fast lane for items that cannot wait for the scheduled batch.

- **Define the exact criteria for an item that must be processed immediately, outside the batch.** These should be narrow and objective, not vague. "Marked urgent by the sender" or "NET 3 payment terms" or "client-facing deadline within 24 hours" are specific. "Feels important" is not a valid exception criterion and will cause the exception path to swallow the batching discipline.
- **Design the exception path to be as lightweight as possible.** The goal is to handle the urgent item quickly and return focus to the current task (or the batch). Exception handling should not require reading the full protocol. Consider a one-sentence rule posted somewhere visible: "Process immediately only if [condition]. Otherwise, add to queue."
- **Create a holding mechanism for items that arrive during a batch session.** When a new item arrives while the user is mid-batch, they should have a single action to "park" it without breaking flow: drag to pending folder, add to list, drop in inbox tray. Do not re-triage new arrivals during a batch -- that breaks the rhythm and reintroduces context switching.
- **Distinguish between escalation (needs someone else) and deferral (needs more time or information from the same person).** These are different states with different follow-up actions and different expected resolution times. Mixing them in a single "deferred" pile creates ambiguity about next steps.

---

### Step 6: Design the Post-Batch Wrap-Up Phase

The post-batch phase serves two functions: closing out the current batch cleanly and generating data that improves the protocol over time. Without this phase, the batch ends in a mess of half-finished states and the user has no feedback loop.

- **Require a count of processed, deferred, and escalated items.** This takes 30 seconds and creates the data for the batch log. The ratio of deferred to processed is the most important signal: a consistent defer rate above 20% indicates the trigger is set too infrequently, the per-item time limit is too aggressive, or the item type contains too many exceptions to batch efficiently.
- **Handle deferred items immediately after the batch, not later.** "Later" becomes never. Each deferred item should receive one specific next action before the user closes the batch: send the clarification email, schedule a call, add to the right list with a specific date, or escalate to the right person. This should take no more than 2-3 minutes total for a normal batch.
- **Log batch metrics in a running table.** Minimum fields: date, items processed, items deferred, total time, observations. Over time this table reveals patterns: batches that consistently run over time signal a trigger threshold that is too high; batches that consistently finish in half the allotted time signal a trigger that is too sensitive.
- **Reset the workspace** so the next batch starts clean: close the relevant tabs, clear the staging area, archive or move the completed items out of the active view. A cluttered workspace at the start of a batch creates a false sense that work is already in progress and makes it harder to count items accurately.
- **Write one protocol observation per batch** (optional but recommended). This is a single sentence about something that felt inefficient, confusing, or time-consuming during the session. Over four to six batches, these observations reveal which steps need refinement before the formal protocol review.

---

### Step 7: Set the Protocol Review Cadence

Batch protocols decay. The item type changes, volume changes, tools change, and the per-item sequence becomes outdated. Build a review process into the protocol itself so it stays useful.

- **Set a review trigger based on batch count, not calendar time.** After every 10 batches is a better cadence than "quarterly" because batches that happen daily need review sooner than batches that happen monthly. Ten batches provides enough log data to identify patterns.
- **Define specific review criteria.** "Review the protocol" is too vague. The review should check: Is the average per-item time trending more than 20% above baseline? Is the defer rate consistently above 15%? Is the trigger firing more than twice before the count threshold is reached (meaning items arrive slower than expected)? Is the trigger not firing on the count threshold before the time trigger fires (meaning items arrive faster than expected)?
- **Include a "sunset condition."** If the item type stops arriving (the vendor relationship ends, the role changes, the project concludes), the protocol should be archived rather than left as an active protocol that never fires. Define what would cause this protocol to be retired.
- **Version the protocol document.** When changes are made during a review, note the version number and date. Users who have shared the protocol with colleagues (for delegation or coverage purposes) need to know which version they are running.

---

### Step 8: Compile the Protocol Document

Assemble everything into a single self-contained reference card. The test of a good protocol document: can the user pick it up after a 3-week absence and execute a batch without asking themselves what to do next?

- **Make the per-item sequence a numbered list with checkboxes**, not prose. Prose requires reading; a numbered checklist with checkboxes enables execution.
- **Put the trigger conditions on the first page**, not buried in the document. The trigger is the entry point; it must be instantly findable.
- **Include the "done" and "defer" state definitions on the same page as the per-item sequence.** The user should not have to flip pages to remember what "done" looks like.
- **Print or pin the protocol somewhere accessible** -- pinned note, printed reference card, saved browser tab. A protocol that requires searching for is a protocol that will not be used.

---

## Output Format

```
## Batch Processing Protocol: [Protocol Name]

**Version:** 1.0 | **Created:** [Date] | **Last Reviewed:** [Date]

---

### Overview

| Field | Value |
|---|---|
| Item type | [Precise description of what is being processed] |
| Arrival rate | [X items per day / week / month -- low: Y, typical: Z, high: W] |
| Per-item processing time | [X minutes (breakdown: Step 1: Xm, Step 2: Xm, Step 3: Xm)] |
| Acceptable delay | [X hours / days before processing is overdue] |
| Recommended batch frequency | [Daily / 2x per week / Weekly / etc.] |
| Expected batch duration | [X items x Y min = Z minutes per session] |
| Maximum batch size | [X items OR Y minutes, whichever comes first] |

---

### Trigger Conditions

**Fire a batch session when ANY of the following is true:**

- [ ] **Time trigger:** [Day and time -- e.g., "Every Tuesday and Thursday at 9:00 AM"]
- [ ] **Count trigger:** [X items have accumulated in the queue]
- [ ] **Event trigger:** [Specific preceding event -- e.g., "Within 2 hours of completing weekly team standup"]

**Hybrid rule:** The time trigger fires on schedule regardless of queue size. The count trigger fires early if the threshold is reached before the scheduled time. Never wait for both to be true.

**Exception -- process immediately (outside the batch) if:**
- [Urgent condition 1: Specific, objective criterion]
- [Urgent condition 2: Specific, objective criterion]

**Items that arrive during an active batch session:** [Specific parking action -- e.g., "Drag to Pending folder; do not triage during batch"]

---

### Pre-Batch Setup Checklist

*Target: Complete in under 2 minutes*

- [ ] Open [Tool 1]: navigate to [specific location / folder / view]
- [ ] Open [Tool 2]: navigate to [specific location / folder / view]
- [ ] Open [Reference document]: [name and location]
- [ ] Close all unrelated browser tabs
- [ ] Set phone / notifications to Do Not Disturb
- [ ] Count items in queue: ______ items
- [ ] Calculate session time: ______ items x [Y] min = ______ minutes
- [ ] If calculated time exceeds [maximum], limit this batch to [N] items and schedule remainder
- [ ] Triage: sort items into Quick / Standard / Complex / Exception (60-second scan)
  - Quick (under [X] min each): ______ items
  - Standard ([X]-[Y] min each): ______ items
  - Complex (over [Y] min each): ______ items
  - Exceptions (process immediately): ______ items
- [ ] Process any Exceptions now, before starting the batch timer
- [ ] Set batch timer for ______ minutes
- [ ] Begin

---

### Per-Item Processing Sequence

**Processing order:** Exceptions (pre-batch) → Quick items → Standard items → Complex items

**Per-item time limit:** [X] minutes. At the limit, complete within 30 seconds or defer immediately.

---

**For each item:**

**Step 1: [Initial Assessment / Verify] -- [X] minutes**
- [Specific check 1 -- e.g., "Confirm sender matches known vendor list"]
- [Specific check 2 -- e.g., "Confirm item is not a duplicate (check log)"]
- IF [discard condition]: [Discard action] -- move to next item
- IF [escalation condition]: [Escalation action] -- remove from queue -- move to next item

**Step 2: [Core Processing Action] -- [X] minutes**
- [Specific action 1]
- [Specific action 2]
- IF [standard condition A]: [Action A]
- IF [standard condition B]: [Action B]
- IF [edge case condition]: [Edge case action]
- IF unclear, ambiguous, or approaching time limit: [Defer action] -- move to next item

**Step 3: [Secondary Processing / Decision] -- [X] minutes**
- [Specific action]
- IF [threshold condition -- e.g., amount over $X, requires approval from Y]: [Escalation action]

**Step 4: [Completion / Filing / Logging] -- [X] minutes**
- [File / archive action with specific destination]
- [System update action -- e.g., "Update row in tracking spreadsheet: status = Approved"]
- [Log action -- e.g., "Add to monthly batch log: date, item ID, category, outcome"]

---

**Done state:** [Precise, verifiable description -- e.g., "Email moved to 'Processed' label, row in tracker marked 'Approved,' entry added to monthly log"]

**Defer state:** [Precise description -- e.g., "Email moved to 'Needs Attention' label, sticky note added with specific blocker, name added to Deferred list with date and reason"]

**Escalation state:** [Precise description -- e.g., "Forwarded to [person/role] with [specific subject line], added to Escalated tab in tracker, date escalated noted"]

**Discard state:** [Precise description -- e.g., "Archived with label 'Duplicate' or 'Not Applicable,' no log entry needed"]

---

### Post-Batch Wrap-Up Checklist

*Target: Complete in under 5 minutes*

- [ ] Stop timer. Record actual session time: ______ minutes
- [ ] Count outcomes:
  - Items completed (Done): ______
  - Items deferred: ______
  - Items escalated: ______
  - Items discarded: ______
- [ ] For each deferred item: assign one specific next action and date in [deferred list location]
- [ ] Check deferred list: any item deferred for more than [X days]? Escalate immediately.
- [ ] Log batch in Batch Log table (below)
- [ ] Clear workspace: [specific reset actions]
- [ ] Write one protocol observation (optional but recommended): ______________________
- [ ] Confirm next batch trigger: [next date/time or count threshold reminder]

---

### Batch Log

| Date | Quick | Standard | Complex | Deferred | Escalated | Actual Time | Defer Rate | Notes |
|------|-------|----------|---------|----------|-----------|-------------|------------|-------|
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |

*Defer rate = Deferred / (Done + Deferred + Escalated). Flag if consistently above 15%.*

---

### Protocol Review Schedule

- **Review trigger:** After every 10 batches OR [specific calendar date], whichever comes first
- **Review checklist:**
  - [ ] Average per-item time trending more than 20% above baseline? Simplify the sequence.
  - [ ] Defer rate above 15% consistently? Adjust trigger threshold or time limit.
  - [ ] Batch consistently finishing in under 50% of allotted time? Increase count threshold or reduce frequency.
  - [ ] New tool or system introduced? Update the pre-batch checklist.
  - [ ] Arrival rate changed significantly (>25%)? Recalculate trigger math.
  - [ ] Any step consistently confusing or causing hesitation? Rewrite that step with more specificity.
- **Sunset condition:** Retire this protocol if [specific condition -- e.g., "vendor relationship ends" / "role changes" / "volume drops below 2 items per week for 4 consecutive weeks"]
- **Version on change:** Increment version number, note date, communicate to anyone else running the protocol.
```

---

## Rules

1. **Never design a protocol without a defined trigger condition that is both specific and testable.** "When I feel like it" or "when the pile gets big" are not triggers -- they are deferred decisions that guarantee inconsistency. The trigger must be something the user can evaluate without judgment: a specific day and time, a specific item count, or a specific preceding event.

2. **Always set maximum batch size in BOTH units: items AND minutes.** Setting only one ceiling creates a loophole. Item-only ceilings fail when items are unusually complex (5 items could take 3 hours). Minute-only ceilings fail when items are unusually fast (60 minutes could mean 40 items, which is cognitively exhausting). Both ceilings together create a robust constraint.

3. **Per-item processing steps must use action verbs that specify both the action and the target.** "Review the invoice" is insufficient. "Check that the line item total matches the purchase order amount in Column D of the vendor register" is a step. The test: if someone unfamiliar with the item type read the step, would they know exactly what to do? If no, rewrite it.

4. **Every decision branch in the per-item sequence must have a defined outcome -- including the "I don't know" branch.** Omitting the ambiguity branch causes the user to freeze mid-batch. The "I don't know" outcome is always either defer (with a specific note about what information is needed) or escalate (with a specific person or resource named).

5. **Per-item time limits are non-negotiable constraints, not guidelines.** A protocol that says "try to stay under 10 minutes per item" will be ignored the moment a complex item appears. The rule must read: "At 10 minutes, the item is deferred. No exceptions." This rule is what keeps a 90-minute batch from becoming a 4-hour ordeal.

6. **The pre-batch setup checklist must list specific tools and navigation paths, not categories.** "Open your email" is not a checklist item. "Open Gmail, navigate to the 'Vendor Invoices - Pending' label" is. Users follow checklists when the items are executable; they skip checklists when items require interpretation.

7. **Do not design a batch protocol that mixes fundamentally different item types in the same per-item sequence.** If expenses and contract renewals both arrive in the same inbox, they require separate protocols. Batching works by eliminating context switching -- mixing item types reintroduces exactly the context switching the protocol is designed to eliminate. Build separate protocols and schedule them on different days if needed.

8. **The defer rate is the most important protocol health metric -- track it and define the threshold explicitly.** A 0% defer rate may indicate the time limit is too lenient (users finishing everything regardless of complexity) or the item type is genuinely simple (good). A consistent defer rate above 20% indicates a structural problem: the trigger is too infrequent, the time limit is too aggressive, or the item type has too much variance to batch effectively. Flag this threshold in the protocol document.

9. **Never let the post-batch phase end with deferred items in an ambiguous state.** Each deferred item must leave the wrap-up phase with: a named reason for deferral, a specific next action, and a specific date or person assigned to that next action. "Deferred -- follow up later" creates a secondary pile that grows into a secondary backlog. The entire point of the protocol is to eliminate ambiguous piles.

10. **Schedule the first protocol review explicitly -- do not leave it open-ended.** "Review after 10 batches" requires the user to count batches. Write the approximate calendar date for the first review based on expected batch frequency: if the protocol runs weekly, the first review is in 10 weeks. Users who have a specific date are far more likely to review than users who have a vague intention.

---

## Edge Cases

**Items arrive at wildly variable rates (feast-or-famine pattern).** Some workflows have periods of zero arrivals followed by sudden floods -- hiring cycles, seasonal billing, project-based client work. Design a hybrid trigger calibrated to the flood rate, not the average rate. Set the count threshold at 60% of a typical flood volume and set the time trigger at the acceptable delay limit. During drought periods, the time trigger fires with a small queue (short, easy batch). During flood periods, the count trigger fires early and repeatedly until the queue clears. In flood scenarios, it is valid to run two batches on the same day -- design the maximum batch size to make each session manageable (60-75 minutes) rather than trying to process the entire flood in one sitting.

**Some items in the batch reveal they are actually two or three separate items.** A single "invoice" that turns out to contain three separate billing lines requiring different approvals, or a single "application" that turns out to be for two different roles. Handle this at the triage step: if an item is revealed to be composite during the initial assessment, split it into sub-items and add the additional sub-items to the queue count before starting the timer. Do not attempt to process a composite item as a unit -- the per-item time limit will be violated and the done state will be ambiguous. If the split is discovered mid-processing rather than at triage, mark the original item as Deferred with a note: "Split into [N] items, re-add to queue."

**The user is processing on behalf of multiple stakeholders with different standards.** A chief of staff processing meeting follow-up tasks for three executives, or a freelancer processing deliverables for multiple clients. The per-item sequence will have branching logic based on whose item it is, because different stakeholders have different done states, filing destinations, and escalation contacts. Solve this with a stakeholder reference card (not embedded in the sequence itself) that maps: stakeholder → filing destination → escalation contact → any unique format requirements. The per-item sequence calls out to this card at the relevant step ("Code to correct stakeholder -- see Stakeholder Reference Card") rather than duplicating the decision tree for each person.

**The batch protocol is used by multiple people (coverage, delegation, or shared role).** When a protocol is shared, version control becomes critical. A protocol that one person has informally updated but not shared will cause another person to run an outdated version. Design the protocol document with a version number and date in the header. Any change, however small, triggers a version increment. If the protocol is stored in a shared location (shared drive, team wiki), include a changelog section at the bottom: "Version 1.2 -- Updated pre-batch checklist to include new expense tracker URL after system migration."

**The user starts a batch and gets interrupted before completion.** Work stops halfway through the queue, or halfway through a single item. The protocol must include a save-state mechanism: after each completed item, the user marks it with a visual indicator (checkbox checked, moved to processed folder, row highlighted). If the batch is interrupted, re-entry is possible by scanning for the first unchecked item. The partially completed batch should still receive a post-batch log entry, even if incomplete -- use a "partial" notation in the Notes column. The remaining items stay in the queue and roll into the next trigger event; they are not re-processed from scratch.

**The per-item processing time is significantly longer than expected after the first few batches.** The user estimated 5 minutes per item but the first batch showed 12 minutes per item. This happens when the initial estimate was based on memory of a "best case" item rather than a realistic item. Do not immediately redesign the protocol -- run three batches and average the actual times. If the average is consistently higher than estimated: (a) recalculate the trigger math using the actual average, (b) reduce the count threshold so batches stay under 90 minutes, and (c) audit the per-item sequence for steps that are taking longer than their time allocation. Often, one step (usually the core processing action, not the administrative steps) is consuming most of the overrun, and that step can be simplified or split.

**The user wants to process a truly enormous backlog before starting the ongoing protocol.** Someone who has 300 unprocessed items accumulated over three months needs a different approach than the ongoing steady-state protocol. Treat the backlog as a separate project: design a series of time-boxed "clearance batches" (90 minutes each, daily or every-other-day) specifically for the backlog. Run these clearance batches until the backlog drops to a manageable level (below the count trigger threshold for the ongoing protocol). Only then switch to the ongoing protocol. Do not try to design a single protocol that handles both the backlog and the ongoing flow -- they have different item mixtures (backlog items may be stale, require different handling, or include many discards) and different urgency profiles.

---

## Example

**Input:** "I manage a podcast and after each episode goes live I get listener questions and feedback submissions through a form on my website. They come in over a few days after each episode -- usually 25-40 submissions per episode. Right now I'm checking the form dashboard constantly and responding to some, ignoring others, feeling guilty about the ones I miss. Each submission takes me about 5-6 minutes to read carefully, decide if it's a feature candidate (answer on air), a direct reply, or just a 'like' and archive. I do this for 2-3 episodes simultaneously which makes it chaotic. I want a clean system."

**Output:**

---

## Batch Processing Protocol: Podcast Listener Submission Processing

**Version:** 1.0 | **Created:** [today's date] | **Last Reviewed:** [today's date]

---

### Overview

| Field | Value |
|---|---|
| Item type | Listener question and feedback form submissions (per episode) |
| Arrival rate | 25-40 submissions per episode; most arrive within 72 hours of episode publish; trickle for up to 2 weeks |
| Per-item processing time | 5-6 minutes (read: 2 min, categorize: 1 min, action: 2 min, archive: 30 sec) |
| Acceptable delay | 5 days -- submissions do not require same-day responses |
| Recommended batch frequency | 2x per week (Day 3 and Day 7 after each episode publishes) |
| Expected batch duration | 15 items x 6 min = 90 minutes per batch (split across two batches per episode) |
| Maximum batch size | 15 items OR 90 minutes, whichever comes first |

---

### Trigger Conditions

**Fire a batch session when ANY of the following is true:**

- [ ] **Time trigger (primary):** Every Monday at 10:00 AM and every Thursday at 10:00 AM (regardless of queue size -- even small queues get processed)
- [ ] **Count trigger:** 15 submissions have accumulated for any single episode (process that episode's queue early, regardless of day)
- [ ] **Event trigger:** Within 24 hours of recording the next episode's intro (so feature-candidate questions can be considered for the upcoming recording)

**Hybrid rule:** The Monday/Thursday schedule is the default. If any episode queue hits 15 before Monday or Thursday, run an early batch for that episode only. Do not combine episodes in an early batch.

**Exception -- process immediately (outside the batch) if:**
- A submission identifies a factual error in the episode that may mislead listeners (requires an episode correction or pinned response)
- A submission is from a named guest, expert, or partner (courtesy response within 24 hours)

**Items that arrive during an active batch session:** Do not check the form dashboard for new submissions during the session. New arrivals will be picked up at the next scheduled batch.

---

### Pre-Batch Setup Checklist

*Target: Complete in under 2 minutes*

- [ ] Open form dashboard (e.g., Typeform, Jotform, or equivalent) and filter view to one episode only -- do not process multiple episodes in the same batch
- [ ] Open email or communication tool for sending direct replies
- [ ] Open episode notes / show notes document for the episode being processed (needed to verify facts in submissions)
- [ ] Open the Feature Candidates log (spreadsheet or notes doc with columns: Episode, Submission date, Question text, Status)
- [ ] Open the Direct Reply template doc (pre-written response starters for the 4 most common reply types)
- [ ] Close all unrelated browser tabs
- [ ] Set phone to Do Not Disturb
- [ ] Count submissions in this episode's queue: ______ submissions
- [ ] Calculate: ______ x 6 min = ______ minutes
- [ ] If calculated time exceeds 90 min, limit this batch to 15 submissions; remainder processed at next trigger
- [ ] Quick triage (60-second scan): Mark any submissions with "URGENT" self-label or from known guests as Exceptions -- handle those before starting the timer
- [ ] Set batch timer: ______ minutes
- [ ] Begin

---

### Per-Item Processing Sequence

**Processing order:** Exceptions (pre-batch) → all remaining submissions in queue order (oldest first)

**Per-item time limit:** 8 minutes. At the 8-minute mark, defer immediately -- do not continue.

---

**For each submission:**

**Step 1: Read and assess -- 2 minutes**
- Read the full submission once without annotating
- Identify the primary type:
  - Is it a **question** (the listener is asking something specific that could be answered on air or in writing)?
  - Is it **feedback** (opinion, reaction, correction, suggestion -- no question asked)?
  - Is it a **request** (asking for a resource, a guest, a topic -- action-oriented)?
- IF submission is spam, bot-generated, or completely off-topic: mark as Discard, archive with tag "spam/irrelevant" -- move to next item
- IF submission is a duplicate of one already processed this episode: mark as Discard, archive with tag "duplicate" -- move to next item

**Step 2: Categorize -- 1 minute**

Assign exactly one category:

- **Feature Candidate (FC):** Question or request that is specific, interesting to the broader listener base, and answerable in under 3 minutes of audio. Ask: "Would at least 30% of my listeners want to hear this answered?" If yes, FC.
- **Direct Reply (DR):** Submission that deserves a personal response but is too specific or personal to answer on air. Examples: detailed follow-up question from a regular listener, correction with a specific citation, someone sharing a personal story that the question would apply to only them.
- **Archive with Acknowledgment (AA):** Submission is positive feedback, general appreciation, or a valid comment that does not require a personal response but should not be ignored. A brief "thanks, glad you enjoyed it" is appropriate but not required.
- **Archive Only (AO):** Submission is noted but requires no action. Neutral feedback, off-topic but not spammy, noted and filed.

IF the submission is ambiguous between FC and DR: default to DR. Feature candidates should be unambiguous.

**Step 3: Execute the category action -- 2-3 minutes**

- **IF FC:**
  - Copy the question verbatim into the Feature Candidates log (Episode, Date Received, Question Text)
  - Rate it 1-3 for relevance and freshness (3 = highly relevant and timely, 1 = interesting but lower priority)
  - Add any episode or timestamp reference if the submission references a specific moment in the episode
  - Archive submission in dashboard with tag "FC - [Episode Number]"

- **IF DR:**
  - Open the Direct Reply template doc
  - Select the closest matching template (Question Follow-Up, Thank You + Resource, Correction Acknowledged, Personal Story Response)
  - Personalize the first sentence and any specific reference to their submission (this is what takes 2 minutes -- do not write a new reply from scratch)
  - Send reply
  - Archive submission in dashboard with tag "DR - Replied - [Episode Number]"

- **IF AA:**
  - Optional: send a one-line reply using the "AA Quick Response" template ("Thanks for listening and for taking the time to write in -- glad this one resonated.")
  - Archive submission in dashboard with tag "AA - [Episode Number]"

- **IF AO:**
  - Archive submission in dashboard with tag "AO - [Episode Number]"
  - No further action

**Step 4: Confirm and advance -- 30 seconds**
- Verify the submission is archived with the correct tag in the dashboard (no submission should remain in "unprocessed" state after this step)
- Verify any log entry or reply is complete
- Move to the next submission

---

**Done state:** Submission is tagged and archived in the dashboard. If FC: entry exists in Feature Candidates log. If DR: reply has been sent and confirmed delivered. No submission remains in an untagged state.

**Defer state:** Submission moved to "Needs Attention" view in dashboard with a note: [reason -- e.g., "Need to verify claim against episode transcript before deciding FC or DR"]. Added to Deferred list with date deferred and specific next action.

**Discard state:** Submission archived with tag "spam/irrelevant" or "duplicate." No log entry. No reply.

---

### Post-Batch Wrap-Up Checklist

*Target: Complete in under 5 minutes*

- [ ] Stop timer. Record actual time: ______ minutes
- [ ] Count outcomes for this episode batch:
  - FC: ______
  - DR: ______
  - AA: ______
  - AO: ______
  - Deferred: ______
  - Discarded: ______
  - Total processed: ______
- [ ] For each deferred submission: write the specific blocker and next action in the Deferred list (do not leave as just "deferred")
- [ ] Check if any deferred submissions from the previous batch are now resolvable -- if yes, resolve them now (max 5 minutes total)
- [ ] Review Feature Candidates log for this episode: are there at least 2-3 strong FCs (rated 2 or 3)? If fewer than 2, note it as a "low-yield episode" -- may need to source questions from social media before recording
- [ ] Log batch metrics in Batch Log table
- [ ] Confirm next trigger: ______ (next Monday / Thursday / early trigger date if count threshold approaching)
- [ ] Note one protocol observation (optional): ______________________________

---

### Batch Log

| Date | Episode | FC | DR | AA | AO | Deferred | Discarded | Total | Actual Time | Defer Rate | Notes |
|------|---------|----|----|----|-----|----------|-----------|-------|-------------|------------|-------|
| | | | | | | | | | | | |
| | | | | | | | | | | | |
| | | | | | | | | | | | |

*Defer rate = Deferred / Total processed. Flag if above 15% for two consecutive batches for the same episode.*

---

### Handling Multiple Simultaneous Episode Queues

Because submissions from multiple episodes accumulate at the same time (listener discovers the show and submits on three episodes at once), follow this sequencing rule:

- **One episode per batch session.** Never mix submissions from different episodes in the same batch. The episode notes context is different, the Feature Candidates log is different, and the relevance assessment changes based on the episode.
- **Priority order when multiple episodes have queues:** Process the most recently published episode first (freshest questions are most useful for upcoming recordings), then work backward chronologically.
- **Episodes older than 30 days:** Submissions on episodes more than 30 days old are unlikely to become feature candidates (content is no longer timely). Apply this modified sequence for old-episode submissions: Read → Direct Reply if clearly personal, Archive with Acknowledgment if positive feedback, Archive Only otherwise. Skip the FC evaluation entirely. This cuts per-item time to 3-4 minutes for old-episode queues.

---

### Protocol Review Schedule

- **Review trigger:** After every 10 batches OR after the first full month of use (approximately 8-10 episodes), whichever comes first. Approximate first review date: ______.
- **Review checklist:**
  - [ ] Average per-item time consistently above 8 minutes? Audit Step 3 (Direct Reply) -- most overruns come from writing replies from scratch rather than using templates. Add more templates.
  - [ ] Defer rate above 15%? Identify the most common defer reason. If it is "need to verify episode content," add a pre-batch step to have episode transcript or show notes open.
  - [ ] FC rate below 10% of submissions? Either listeners are submitting lower-quality questions (audience education issue) or FC criteria are too strict (loosen the 30% threshold to 20%).
  - [ ] DR replies taking more than 3 minutes each? Audit the reply templates -- they may need more personalization scaffolding or additional template types.
  - [ ] Episode queues growing faster than twice-weekly batches can clear? Either increase to 3x per week or raise the count trigger to 20 (allows larger batches with less frequency).
- **Sunset condition:** Retire this protocol if episode cadence drops below 1 episode per month or form submissions drop below 5 per episode for 8 consecutive episodes. At that point, individual processing is more appropriate than a formal batch protocol.
- **Delegation note:** If this protocol is handed off to a show assistant or community manager, share version number and date. The Direct Reply template doc is the most critical shared resource -- ensure they have edit access before the first handoff batch.
