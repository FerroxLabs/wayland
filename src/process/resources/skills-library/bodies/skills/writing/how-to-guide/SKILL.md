---
name: how-to-guide
description: |
  Writes step-by-step instructional guides with prerequisites, numbered
  procedures, tips, and troubleshooting sections. Use when the user wants to
  create a tutorial, how-to article, instructional post, or step-by-step guide
  for completing a task. Do NOT use for general blog posts (use `blog-post-writing`),
  listicles (use `listicle-writing`), or technical API documentation (use
  `api-documentation`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "blog-post writing step-by-step"
  category: "writing"
  subcategory: "content-marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# How To Guide

## When to Use

Use this skill when the user's primary need is enabling a reader to successfully complete a specific task by following a documented sequence of actions.

**Trigger scenarios where this skill applies:**
- The user wants to teach a process with a clear start state and end state ("How do I write a guide for setting up SSL certificates on Nginx?")
- The user needs instructional content where the reader must perform actions in sequence -- skipping or reordering steps causes failure
- The user wants a tutorial-style article for a blog, documentation site, or knowledge base where the reader follows along and produces a tangible result
- The user has an existing draft guide and wants it audited, restructured, or completed with missing steps
- The user needs to convert an internal SOP, runbook, or checklist into reader-facing instructional content consumable by someone outside their organization
- The user wants to document a recurring process for onboarding purposes -- new employees, new users, new customers -- where consistency and completeness are critical
- The user wants a guide that teaches a skill, not just describes it: the reader should be able to do the thing after reading, not just understand that it exists

**Do NOT use this skill in these situations:**
- The user wants to argue a position or explore an idea without teaching a procedure -- use `blog-post-writing` instead. The tell is that no concrete steps exist.
- The user wants a "Top 10 tips for X" or "5 ways to improve Y" format -- use `listicle-writing` instead. Lists of recommendations without sequential dependencies are not how-to guides.
- The user wants to document an API, SDK, or codebase for developers who need reference material -- use `api-documentation` instead. Reference docs are looked up, not followed.
- The user wants a process document for internal team use with roles, responsibilities, escalation paths, and compliance controls -- use `sop-writing` instead. SOPs govern who does what; how-to guides teach an individual to do something.
- The user wants to explain what something is, how it works conceptually, or why something matters without requiring the reader to take action -- use `explainer-writing` instead.
- The user wants a detailed technical specification describing how a system should be built or behave -- use `technical-specification` instead.
- The user needs a comparison between multiple options to help a reader choose one -- use `comparison-guide` instead.

---

## Process

### Step 1: Extract Task Definition and Reader Profile

Before writing a single sentence, establish precise boundaries for both the task and the audience. Vague inputs produce guides with fatal gaps.

- **Define the exact task outcome in one sentence.** Push back on fuzzy requests: "make my website faster" is not a task outcome. "Reduce Nginx web server response time below 200ms by enabling gzip compression and HTTP/2" is. The outcome must be observable and testable by the reader when they finish.
- **Identify the reader's entry state.** What does the reader already know? What tools do they already have? Distinguish between assumed knowledge (not explained in the guide) and prerequisite tasks (must be completed before step 1). Ask the user: "What can a reader be expected to know before they start this guide?"
- **Establish the reader's exit state.** What will the reader have -- literally, concretely -- when they complete the final step? A configured server? A published document? A trained model? A signed contract? Name the artifact or state, not the feeling of accomplishment.
- **Estimate real time requirements.** Ask the user for time to complete each major phase, not just the whole guide. A guide that takes 45 minutes total but has one step that takes 20 minutes unattended needs a "this runs in the background" callout so the reader does not abandon the process.
- **Identify the top 3 failure modes.** Ask the user: "What are the most common mistakes people make when doing this for the first time?" These become your troubleshooting entries and your in-step warnings.
- **Determine if branching paths exist.** Ask whether the procedure differs based on operating system, account tier, tool version, or reader situation. If yes, plan for labeled branches before you write a single step (see Edge Cases section).

### Step 2: Calibrate Voice, Register, and Technical Depth

A guide written at the wrong technical level fails regardless of structural quality.

- **Register choices:**
  - *Casual tutorial*: Conversational but precise. Uses "you'll" contractions. Explains why alongside what. Suited for consumer products, hobbies, lifestyle topics, and onboarding new users. Example: a guide to using Notion for personal task management.
  - *Professional reference*: Formal and efficient. Omits "why" commentary unless critical. Uses full terms on first reference. Suited for professional software, technical workflows, and intermediate users. Example: a guide to configuring AWS IAM policies.
  - *Technical walkthrough*: Assumes domain fluency. Uses exact technical terminology without apology. Includes configuration values, file paths, and command syntax. Suited for developers, engineers, and advanced practitioners. Example: a guide to deploying a Kubernetes cluster with Helm charts.
- **Vocabulary calibration**: If the guide targets beginners, define every acronym on first use (e.g., "DNS -- the system that maps domain names to IP addresses"). If targeting intermediates, use standard terminology but define domain-specific exceptions. If targeting advanced readers, never define standard terminology -- it signals mismatched audience level and damages credibility.
- **Active vs. passive voice**: Always imperative second-person active ("Click the Settings tab," "Run the following command"). Never passive construction ("The tab should be clicked," "The command should be run"). Never third-person description ("Users can click the Settings tab").
- **Match the user's style sample if provided.** If the user shares an existing guide or brand voice example, extract three stylistic signatures (sentence length, formality level, use of humor or personality) and apply them consistently.

### Step 3: Architect the Step Sequence Before Writing Any Steps

Architecture decisions made before writing prevent restructuring after the guide is complete.

- **Map every action the reader must perform in order.** Write a raw action list before formatting anything. Do not worry about grouping or headings yet. Just list every discrete action from "open your browser" to "confirm the result." This raw list will have 15-40 items for most guides.
- **Apply the one-action-per-step rule.** Each step must contain exactly one atomic action and one verification. If the reader must do two things before they can verify success, those are two steps. The exception: sub-actions that are obviously part of the same gesture (e.g., "Click File, then Save As" is one action, not two).
- **Group steps into phases when total step count exceeds 8.** Name phases with outcome-oriented labels: "Phase 1: Install and Configure (Steps 1-4)," "Phase 2: Connect Your Data Source (Steps 5-7)," "Phase 3: Test and Launch (Steps 8-10)." Phases give readers orientation and let them take breaks at logical boundaries.
- **Front-load dependencies.** Any step where the reader must have completed an earlier step to continue is a dependency. Make these explicit in the step text: "You must complete Step 3 before proceeding -- Step 4 requires the file path you saved in Step 3."
- **Identify wait states.** Steps where the reader must wait for a process to complete (a build running, a download finishing, an email arriving) need explicit wait time estimates and a clear instruction about what to do during the wait: either proceed with something else or wait and do nothing.
- **Plan the troubleshooting section in parallel with step architecture.** For each step with a known failure mode, note it now. You will write full troubleshooting entries later, but noting them during architecture ensures no failure mode gets dropped.

### Step 4: Write the Introduction (Last, Not First)

Counter-intuitive but essential: write the introduction after you know exactly what the guide covers.

- **Lead sentence:** State the outcome the reader will accomplish in one sentence. Use the format "By the end of this guide, you will have [specific, concrete result]." Do not write "In this guide, we will cover..." or "This guide is for anyone who wants to learn..."
- **Prerequisites block:** List every prerequisite as a separate bullet. Distinguish three types of prerequisites: (a) knowledge the reader must already have, (b) tools or accounts the reader must already have, (c) tasks the reader must have already completed. Label each type explicitly if the list is longer than 5 items.
- **Time and difficulty estimate:** Provide both. Time estimate should be a range: "30-45 minutes." Difficulty should be calibrated to the specific audience, not a universal scale. "Beginner" means different things for a cooking guide versus a cloud infrastructure guide -- add a one-sentence clarification: "Beginner (no command line experience required)" or "Intermediate (comfortable running terminal commands)."
- **What this guide does not cover:** One or two sentences explicitly stating what falls outside scope. This prevents reader frustration when they reach the end and discover the guide did not cover what they thought it would. Example: "This guide covers installation only. Configuration for production environments is covered in [X guide]."
- **Keep the introduction under 120 words.** Every word before Step 1 is a word that delays the reader from starting. Readers of how-to guides are action-oriented -- they came to do, not to read.

### Step 5: Write Each Step Using the Four-Part Structure

Every step must contain four components. Omit any component and the step fails a reader somewhere.

- **Part 1 -- The action title:** An imperative verb phrase as a heading. The verb must describe the primary action: "Configure," "Install," "Create," "Connect," "Verify," "Export." Never use nouns alone ("Database Configuration") or passive constructions ("Configuring the Database"). The title should be specific enough that a reader scanning headings can locate the step they need: "Create a PostgreSQL Database User" beats "Set Up Database."
- **Part 2 -- The action body:** 2-5 sentences. Open with the primary action in imperative form. Add the exact values, settings, file names, or commands required. Then add the "why" if it is non-obvious and will help the reader recover from future errors (not every step needs a "why"). Include any warnings about irreversible actions before the action, not after.
- **Part 3 -- The verification check:** A single, concrete, observable indicator that the step succeeded. Not "You should see something happen" but "The terminal displays 'Build succeeded' with exit code 0" or "The dashboard shows your account status as 'Active' in green." If verification is only possible after multiple steps, say so and point forward: "You will verify this in Step 6."
- **Part 4 -- The failure callout (when relevant):** Not every step needs one. Include a failure callout when there is a known common error for that specific step. Format it as a callout block: "**If this happens:** [specific symptom] -- [specific fix]." Keep it to 1-3 sentences. Longer failure handling belongs in the Troubleshooting section.
- **Step length ceiling:** If a step body exceeds 6 sentences, it contains more than one action. Split it. Steps that require visual orientation (e.g., navigating a complex UI) may include a one-line description of the current view before the action: "You are now in the Network Settings panel, which shows your current firewall rules."

### Step 6: Write the Tips and What's Next Sections

Tips are not padding -- they should contain genuinely useful knowledge that does not fit in the step sequence.

- **Tips section criteria:** Include a tip only if it does one of the following: saves significant time, prevents a common mistake not covered in troubleshooting, offers a useful variation for a specific sub-audience, or reveals non-obvious advanced functionality. Aim for 3-5 tips. More than 5 tips signals that the guide itself is incomplete.
- **Distinguish tips from warnings.** Warnings (things that cause data loss, security issues, or irreversible errors) belong in the step body as callouts, not in the Tips section. Tips are for optimization and variation, not danger prevention.
- **What to Do Next section:** Point the reader to the logical continuation: the next guide in a series, the next skill to learn, or the next task to accomplish. Be specific. "Learn more about networking" is not actionable. "Configure HTTPS by installing Let's Encrypt SSL certificates -- follow [guide name]" is.

### Step 7: Write the Troubleshooting Section

The troubleshooting section is where most guides are weakest. Treat it as a mini-diagnostic framework, not a list of afterthoughts.

- **Use the three-field format strictly:** Problem (symptom the reader observes), Cause (why it happens -- mechanical, not vague), Fix (exact resolution steps). Every entry needs all three fields. "Make sure everything is configured correctly" is not a fix.
- **Write symptoms from the reader's perspective.** The reader does not know what caused the problem -- they only know what they see or experience. Write the Problem field as the reader would describe it: "The command returns 'Permission denied' even though you are logged in as admin" not "Permissions error."
- **Minimum 3 entries, maximum 8.** Fewer than 3 suggests the guide author has not thought through failure modes. More than 8 suggests the guide is too complex and should be split, or the procedure itself is too error-prone and needs redesign.
- **Order entries by likelihood of occurrence.** The most common problem first, rarest last. Readers scan troubleshooting sections -- they stop reading when they find their problem.
- **Include a "nothing is working" entry for complex guides.** When a guide covers a technical process with many interdependencies, add a final entry: "Problem: You have tried all fixes above and nothing is working. Fix: [specific reset procedure, or specific person/resource to contact]."

### Step 8: Review the Complete Guide Against the Reader's Journey

Final review before delivering the guide. This is not a grammar check -- it is a completeness check.

- **The cold-reader test:** Mentally become a reader who has never performed this task. Start at the prerequisites. Is everything required actually listed? Walk through step 1. Does it assume anything not in prerequisites? Walk through every step in sequence. Does any step require knowledge introduced after it?
- **Verify every verification check.** Read each "Verification" line and ask: is this observable? Is it specific? Could a reader mistake a different state for success? Fix any verification check that is vague or ambiguous.
- **Check step count against pacing.** A guide with 12 steps where steps 7-10 are trivial (one sentence each) and step 11 requires 20 minutes of complex work has a pacing problem. Merge trivial steps. Expand complex steps. Add phase breaks where cognitive load spikes.
- **Confirm troubleshooting coverage.** Every in-step failure callout you added should have a corresponding troubleshooting entry for readers who find the troubleshooting section first (from a search engine, from a colleague's referral).
- **Check consistency of formatting.** Every step heading must start with a verb. Every verification must be labeled "Verification:". Every prerequisite must be a bullet. Inconsistent formatting creates cognitive friction and signals sloppy execution.

---

## Output Format

```markdown
# How to [Accomplish Specific, Observable Outcome]

By the end of this guide, you will have [concrete result the reader can
confirm -- not "learned how to" but "a working X configured to do Y"].

**Time required:** [X-Y minutes / hours]
**Difficulty:** [Beginner / Intermediate / Advanced] ([one-line clarification
of what that means for this specific audience])
**What you will need:**
- [Tool or account] -- [one-line note if non-obvious to obtain]
- [Tool or account]
- [Prior knowledge required]
- [Prior task that must be completed first]

**What this guide does not cover:** [One sentence on explicit scope
boundary and where to find the out-of-scope information.]

---

## Phase 1: [Phase Name] (Steps 1-N)
*(Omit phase headers if total steps are 8 or fewer)*

## Step 1: [Imperative Verb Phrase Describing the Action]

[Primary action in imperative voice. Include exact values, file paths,
commands, or settings required. If the action is irreversible or
consequential, warn the reader before the action line, not after. Keep to
2-5 sentences.]

**Verification:** [One specific, observable indicator of success. Name the
exact output, state, or confirmation the reader should see.]

> **If this happens:** [Specific symptom of the most likely failure for
> this step] -- [1-2 sentence fix. Longer troubleshooting in the
> Troubleshooting section.]

---

## Step 2: [Imperative Verb Phrase]

[Action body. If a wait state is involved, state the expected wait time
and what the reader should or should not do during the wait.]

**Verification:** [Specific observable indicator.]

---

## Step 3: [Imperative Verb Phrase]

[Action body. If this step has a branch, use this format:]

**If you are using [Condition A]:** [Instruction specific to Condition A.]
**If you are using [Condition B]:** [Instruction specific to Condition B.]
Skip to Step 4.

**Verification:** [Specific observable indicator.]

---

## Step N: [Final Action Verb Phrase]

[Action body completing the task. The final step should produce or confirm
the result stated in the introduction.]

**Verification:** [Observable confirmation that the complete task is done --
this should directly match the outcome stated in the introduction.]

---

## Tips

- [Tip that saves time or prevents a common mistake not covered in
  troubleshooting. Do not include warnings -- those belong in step bodies.]
- [Tip for a useful variation or advanced option relevant to a sub-audience.]
- [Tip for maintenance, repetition, or extending the result beyond this guide.]

---

## Troubleshooting

**Problem:** [Symptom written from the reader's perspective -- what they
see or experience, not the technical root cause.]
**Cause:** [Specific mechanical reason this happens.]
**Fix:** [Exact steps to resolve. Use numbered sub-steps if more than two
actions are required.]

---

**Problem:** [Symptom 2]
**Cause:** [Specific cause]
**Fix:** [Resolution steps]

---

**Problem:** [Symptom 3]
**Cause:** [Specific cause]
**Fix:** [Resolution steps]

---

## What to Do Next

[One specific recommendation for the reader's logical next step. Name the
exact task or guide, and state why it is the right next move now that
this guide is complete.]
```

---

## Rules

1. **Never write a step title as a noun phrase.** "Database Configuration" is a section heading in a manual. "Configure the Database Connection String" is a step in a how-to guide. Every step title must begin with an imperative verb. Violation signals the writer is describing a system, not instructing a reader.

2. **Never place a prerequisite inside a step.** If the reader needs an AWS account, a specific file, or a configured dependency to complete step 5, that item belongs in the prerequisites block before step 1 -- not discovered mid-guide. Revealing requirements late destroys trust and wastes the reader's time.

3. **Never combine two atomic actions into one step.** The test: does the reader perform one action and then check for a result? If they must perform two actions before knowing if either worked, those are two steps. The exception: a strictly sequential pair of sub-actions where intermediate state is not visible (e.g., keyboard shortcut combinations).

4. **Never use "simply," "just," "easily," "obviously," or "of course" anywhere in the guide.** These words are condescending to readers who find the step difficult. They provide zero instructional value and actively harm readers who struggle. They are the single most reliable signal of a guide written by someone who has forgotten what it is like to not know something.

5. **Never write a verification check that requires interpretation.** "The page should look correct" is not a verification. "The status badge in the upper right corner displays 'Connected' in green" is. Every verification must name an exact location, label, value, color, message, or output. Ambiguous verifications cause readers to proceed on false success.

6. **Always front-load warnings before the action they modify.** If a step involves an irreversible action (deleting data, overwriting a file, making a payment, sending a message to external parties), the warning must appear on the line before the action instruction, never after. The reader reads top to bottom. A warning after the action is an after-action report, not a caution.

7. **Always include a wait-time estimate for any step involving processing, downloading, building, or deploying.** Do not leave the reader staring at a progress bar with no sense of whether 3 minutes is normal or whether the process has hung. Provide a range: "This typically takes 3-8 minutes depending on your internet connection speed." If the wait exceeds 5 minutes, tell the reader whether they can do something else or should watch the process.

8. **Always write troubleshooting symptoms from the reader's experiential perspective.** The reader does not know the root cause -- that is in the Cause field. The Problem field must describe what the reader sees, hears, reads on screen, or experiences. Wrong: "SSL handshake failure." Right: "The browser displays 'Your connection is not private' and refuses to load the page even after installing the certificate."

9. **Never exceed 6 sentences in a step body.** If a step requires more than 6 sentences to explain, it contains more than one atomic action. Split it. The 6-sentence ceiling also enforces pacing -- readers of how-to guides move quickly and lose confidence when steps sprawl. The only exception is a step involving a complex configuration block where the text is mostly code or structured data, not prose.

10. **Always test the guide's scope boundary against the introduction.** If the introduction promises "a working HTTPS server," every step necessary to achieve a working HTTPS server must be in the guide. Any step that is necessary but missing breaks the implicit contract with the reader. Any step that is included but not necessary for the stated outcome adds noise. The introduction and the final step's verification check must describe the same result.

11. **Scale troubleshooting entries to guide complexity.** A 3-step beginner guide warrants 3 troubleshooting entries. A 12-step technical guide warrants 6-8 entries. Providing 3 troubleshooting entries for a 15-step infrastructure guide signals the author did not think through failure modes. Providing 10 entries for a 4-step beginner guide signals the procedure is too fragile and needs to be simplified.

12. **Never end the guide at the final step.** Always include a "What to Do Next" section. Readers who complete a how-to guide have just acquired a skill or configuration -- they are primed to act further. Abandoning them at the final step is a missed opportunity to guide them toward productive next actions. The next step should be specific and immediately actionable, not vague encouragement.

---

## Edge Cases

**The guide has branching paths based on reader environment.**
When the procedure differs by operating system, account tier, software version, or installation type, do not attempt to write one set of instructions that covers all branches simultaneously. Instead: identify the fork point, introduce the branch with a labeled decision prompt ("Which operating system are you using?"), create clearly labeled sub-paths ("**macOS users:** follow Steps 3a-3c then skip to Step 5. **Windows users:** follow Steps 3d-3f."), and re-merge paths at the point where the procedure becomes identical again. For guides with more than two branches or branches that last longer than 4 steps, consider producing separate guides for each path and linking them from a decision page.

**A prerequisite is itself a multi-step process.**
When a prerequisite requires more than 3 steps to complete (e.g., "Install Docker Desktop," "Create an AWS account and configure CLI credentials"), do not embed the sub-tutorial inside the prerequisites block. Reference the separate guide by name, state what the completed state looks like ("You should have Docker Desktop running with `docker --version` returning a version number"), and add a time estimate for completing the prerequisite. The how-to guide's prerequisites block should describe the completed state of the prerequisite, not the steps to complete it.

**The task has no single observable completion state.**
Some tasks have subjective or multi-dimensional completion criteria. A guide for "writing a professional bio" or "designing a landing page" cannot end with a binary pass/fail verification. For these guides: define measurable completion criteria in the introduction ("You will have a bio between 75 and 100 words that includes your current role, one career achievement, and one personal detail"), write the final verification against those criteria ("Verify: Your bio is between 75-100 words, contains your current role title, one quantified achievement, and one personal detail"), and add a self-review checklist as a final step rather than a binary verification check.

**The user provides an existing draft guide with missing or broken steps.**
When reviewing a draft, perform a sequential trace: start at the stated prerequisites, follow every step, and flag any step that assumes knowledge or a state not established by the prerequisites or previous steps. Mark insertions with a visible flag ("[ADDED]") so the user can review them. Also flag steps that are out of order, steps that have no verification, and steps that contain multiple atomic actions bundled together. Provide a brief audit summary at the top listing: total steps added, total steps split, total verifications added, and total troubleshooting entries added.

**The task requires significant elapsed time (multiple days or sessions).**
When a guide's total execution time spans more than one session (e.g., a guide for launching a product over 2 weeks, or a guide for training a machine learning model that runs overnight), add a checkpoint summary at the end of each logical session block. The checkpoint lists: what state everything should be in, what the reader should save or record before closing, and how to verify before starting the next session that the previous session's state is intact. For overnight or multi-hour automated processes, include a "how to tell if the process failed" section with specific failure indicators.

**The guide covers a task with genuine safety, legal, or data-loss risk.**
When the task involves deleting data, modifying production systems, handling personally identifiable information, executing financial transactions, or performing physical procedures with injury risk: add a prominent warning block immediately after the introduction -- before the prerequisites -- using a visually distinct callout format. The warning must specify the exact nature of the risk, the conditions under which the risk is triggered, and what the reader should do before starting (back up data, get approval, work in a staging environment). In-step warnings for specific dangerous actions must appear on the line immediately preceding the dangerous instruction. Never bury safety warnings inside step body paragraphs.

**The procedure changes based on tool version.**
When a guide covers software, APIs, or platforms that release updates frequently (browser extensions, cloud consoles, SaaS platforms), include the specific version or date the guide was validated against in the introduction: "Guide validated against [Tool] version 3.4.1 as of [Month Year]." For steps where the UI or command syntax is known to change between versions, note the specific version where the behavior described applies: "In version 3.x and earlier, this option appears in the Settings panel. In version 4.0 and later, it has moved to the Integrations tab." When in doubt about currency, add a note directing the reader to the tool's official changelog.

**The guide is part of a series.**
When the how-to guide is one installment in a sequential series (e.g., a multi-part tutorial), add two navigation elements: a "Before You Start" note in the introduction naming the immediately preceding guide and confirming what state the reader should be in, and a "What to Do Next" section at the end naming the immediately following guide. If the series is longer than 4 parts, include a series overview table in the introduction showing all guide titles, their sequence numbers, and their individual outcomes, so the reader knows where they are in the full learning journey.

---

## Example

**Input:** "Write a how-to guide for setting up automated nightly database backups on a PostgreSQL 15 server running on Ubuntu 22.04. Target audience: developers who are comfortable with the Linux command line but have not set up PostgreSQL backups before."

**Output:**

---

# How to Automate Nightly PostgreSQL 15 Backups on Ubuntu 22.04

By the end of this guide, you will have a shell script that performs a compressed, timestamped dump of your PostgreSQL 15 database every night at 2:00 AM, stores backups in a dedicated directory, automatically deletes backups older than 14 days, and logs each backup result to a file you can monitor.

**Time required:** 25-40 minutes
**Difficulty:** Intermediate (comfortable running commands in a Linux terminal and editing files with a text editor like nano or vim)

**What you will need:**
- Ubuntu 22.04 server with PostgreSQL 15 installed and running
- A PostgreSQL user with at least `pg_dump` privileges on the database you want to back up
- `sudo` access on the server
- Approximately 2x your current database size in free disk space on the target drive (backups compress to roughly 20-40% of raw size for typical relational data)

**What this guide does not cover:** Offsite backup transfer (e.g., copying backups to S3 or a remote server) or point-in-time recovery with WAL archiving. Those topics are covered in the PostgreSQL Offsite Backup guide.

---

## Step 1: Create a Dedicated Backup Directory

Create a directory to store backup files and set ownership so PostgreSQL's system user can write to it:

```bash
sudo mkdir -p /var/backups/postgresql
sudo chown postgres:postgres /var/backups/postgresql
sudo chmod 750 /var/backups/postgresql
```

The `chmod 750` setting restricts read access to the `postgres` user and group only -- do not use `777`, which would expose backup files (and the data they contain) to all system users.

**Verification:** Run `ls -ld /var/backups/postgresql`. The output should show `drwxr-x---` as the permission string and `postgres postgres` as the owner and group.

---

## Step 2: Verify Your PostgreSQL User Can Dump the Target Database

Before automating anything, confirm manually that your PostgreSQL user has dump access:

```bash
sudo -u postgres pg_dump --dbname=your_database_name --format=custom --file=/tmp/test_backup.dump
```

Replace `your_database_name` with the name of the database you want to back up. The `--format=custom` flag produces a compressed, non-human-readable file optimized for `pg_restore` -- this format is preferred over plain SQL for databases larger than 100 MB.

**Verification:** The command returns to the prompt with no error output, and `ls -lh /tmp/test_backup.dump` shows a file greater than 0 bytes. Clean up the test file: `rm /tmp/test_backup.dump`.

> **If this happens:** The command returns `pg_dump: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL: role "postgres" does not exist` -- your PostgreSQL installation uses a different superuser name. Run `sudo -u postgres psql -c '\du'` to list available roles, then substitute the correct role name in all commands in this guide.

---

## Step 3: Create the Backup Script

Create a new shell script file at `/usr/local/bin/pg_nightly_backup.sh`:

```bash
sudo nano /usr/local/bin/pg_nightly_backup.sh
```

Paste the following content exactly:

```bash
#!/bin/bash

# Configuration
DB_NAME="your_database_name"
BACKUP_DIR="/var/backups/postgresql"
LOG_FILE="/var/log/pg_backup.log"
RETENTION_DAYS=14

# Generate timestamped filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.dump"

# Run backup and log result
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup of ${DB_NAME}" >> "$LOG_FILE"

pg_dump --dbname="$DB_NAME" --format=custom --file="$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup succeeded: ${BACKUP_FILE} ($(du -sh "$BACKUP_FILE" | cut -f1))" >> "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] BACKUP FAILED for ${DB_NAME}" >> "$LOG_FILE"
    exit 1
fi

# Delete backups older than RETENTION_DAYS
find "$BACKUP_DIR" -name "${DB_NAME}_*.dump" -mtime +$RETENTION_DAYS -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleanup: removed backups older than ${RETENTION_DAYS} days" >> "$LOG_FILE"
```

Replace `your_database_name` on the `DB_NAME=` line with your actual database name. Save and close the file (in nano: `Ctrl+O`, then `Enter`, then `Ctrl+X`).

**Verification:** Run `cat /usr/local/bin/pg_nightly_backup.sh`. The file content displays correctly with your database name on the `DB_NAME=` line.

---

## Step 4: Set Script Permissions and Test It Manually

Make the script executable and run it once as the `postgres` user to confirm it works before scheduling it:

```bash
sudo chmod 750 /usr/local/bin/pg_nightly_backup.sh
sudo chown postgres:postgres /usr/local/bin/pg_nightly_backup.sh
sudo -u postgres /usr/local/bin/pg_nightly_backup.sh
```

**Verification:** Run `cat /var/log/pg_backup.log`. The log file shows a "Backup succeeded" entry with a file path and size. Run `ls -lh /var/backups/postgresql/` to confirm the `.dump` file exists and has a non-zero size.

> **If this happens:** The log shows "BACKUP FAILED" -- check the PostgreSQL server logs at `/var/log/postgresql/` for the corresponding error. The most common cause is that the `postgres` OS user does not have `pg_dump` access because the PostgreSQL authentication configuration (`pg_hba.conf`) requires a password for local connections. See the Troubleshooting section below.

---

## Step 5: Create a Log File With Correct Ownership

The script writes to `/var/log/pg_backup.log`. Create this file now with correct ownership so the script does not fail on first run due to a missing log file:

```bash
sudo touch /var/log/pg_backup.log
sudo chown postgres:postgres /var/log/pg_backup.log
sudo chmod 640 /var/log/pg_backup.log
```

**Verification:** Run `ls -l /var/log/pg_backup.log`. The output shows `postgres postgres` as owner and group, with permission string `-rw-r-----`.

---

## Step 6: Schedule the Script With Cron

Open the crontab for the `postgres` user:

```bash
sudo crontab -u postgres -e
```

If prompted to choose an editor, select `nano` (option 1). Add the following line at the bottom of the file:

```
0 2 * * * /usr/local/bin/pg_nightly_backup.sh
```

This schedules the script to run at 2:00 AM every day. Choose a time when your database has low activity. Avoid midnight exactly -- many shared systems run maintenance jobs at midnight, which can cause resource contention. Save and close the file.

**Verification:** Run `sudo crontab -u postgres -l`. The output includes the line `0 2 * * * /usr/local/bin/pg_nightly_backup.sh` with no leading `#` character (which would comment it out).

---

## Step 7: Verify the Backup Runs Overnight

This step requires waiting until after 2:00 AM on the day you set up the cron job.

After 2:00 AM, check the log file for a new backup entry:

```bash
cat /var/log/pg_backup.log
```

Also verify the backup directory contains a new `.dump` file timestamped after 2:00 AM:

```bash
ls -lht /var/backups/postgresql/ | head -5
```

**Verification:** The log file shows a "Backup succeeded" entry from today's date at approximately 2:00 AM. The backup directory contains a `.dump` file dated today. Your automated nightly backup system is operational.

---

## Tips

- If you have multiple databases on the same server, duplicate the `DB_NAME` line in the script and add a second `pg_dump` block -- do not create separate scripts. This keeps all backups under a single cron job and a single log file.
- For databases larger than 10 GB, add the `--jobs=4` flag to `pg_dump` (requires `--format=directory` instead of `--format=custom`). Parallel dumping uses multiple CPU cores and can cut backup time by 50-70% on multi-core servers.
- Test your backups monthly by restoring a dump to a staging database: `pg_restore --dbname=test_restore --clean /var/backups/postgresql/your_latest.dump`. A backup you have never restored is a backup you cannot trust.

---

## Troubleshooting

**Problem:** The manual test in Step 4 produces a "BACKUP FAILED" log entry and no `.dump` file is created.
**Cause:** The `postgres` OS user is being prompted for a password by `pg_hba.conf` peer or md5 authentication, and the non-interactive script cannot provide one.
**Fix:** Add a `.pgpass` file for the `postgres` OS user. Run `sudo -u postgres bash -c 'echo "localhost:5432:your_database_name:postgres:your_password" > ~/.pgpass && chmod 600 ~/.pgpass'`. Replace the hostname, database name, username, and password with your actual values. Re-run the script to confirm it succeeds.

---

**Problem:** The cron job does not appear to run -- no new log entries appear after 2:00 AM.
**Cause:** Either the cron daemon is not running, or the cron job was saved to the wrong user's crontab.
**Fix:** First confirm cron is running: `systemctl status cron`. If it shows "inactive," start it: `sudo systemctl start cron && sudo systemctl enable cron`. Then confirm the job is in the correct crontab: `sudo crontab -u postgres -l`. If the job is missing, repeat Step 6.

---

**Problem:** Backup files are not being deleted after 14 days -- the backup directory keeps growing.
**Cause:** The `find` command's `-mtime` flag compares modification time against the file's actual last-modified timestamp, not the filename timestamp. If files were copied or restored from another location, their modification times reset.
**Fix:** This is expected behavior for files copied with standard tools. Use `touch` to preserve original timestamps when copying backup files: `cp --preserve=timestamps source dest`. For existing files with wrong timestamps, manually delete backups older than 14 days: `find /var/backups/postgresql/ -name "*.dump" -mtime +14 -delete`.

---

**Problem:** The log file grows indefinitely and will eventually fill the disk.
**Cause:** The script appends to the log file without any rotation or size limit.
**Fix:** Add log rotation using logrotate. Create a new file at `/etc/logrotate.d/pg_backup` with this content: `rotate 30`, `daily`, `compress`, `missingok`, `notifempty`. This rotates the log daily, keeps 30 days of history, and compresses old logs. Run `sudo logrotate --debug /etc/logrotate.d/pg_backup` to confirm the configuration is valid.

---

**Problem:** You ran the script manually and it succeeded, but the cron-scheduled run fails silently.
**Cause:** Cron runs with a minimal environment -- the `PATH` variable does not include `/usr/bin` or `/usr/local/bin` by default, so `pg_dump` cannot be found.
**Fix:** Add an explicit `PATH` line at the top of the script, immediately after the `#!/bin/bash` line: `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`. Save the file and re-run the cron job manually to confirm.

---

## What to Do Next

Now that nightly backups are running locally, configure offsite backup transfer to protect against server failure or disk loss. The PostgreSQL Offsite Backup guide covers syncing your `/var/backups/postgresql/` directory to an S3-compatible object store using `rclone`, with encrypted transfer and a separate 90-day retention policy for offsite copies.
