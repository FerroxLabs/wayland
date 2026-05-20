---
name: error-message-writing
description: |
  Creates user-facing error messages that explain what happened, why it
  happened, and how to fix it, with error codes for support reference. Use
  when the user needs to write error messages, validation messages, warning
  text, or failure notifications for software. Do NOT use for API error
  documentation (use `api-documentation`), knowledge base articles (use
  `knowledge-base-article`), or bug reports.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing writing documentation"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Error Message Writing

## When to Use

Use this skill when the user needs to create, revise, or audit user-facing error messages in any software interface. Specific triggers include:

- The user is writing error messages for a web application, mobile app, desktop software, or CLI tool and wants the messages to be clear, actionable, and appropriately toned
- The user has received complaints that their error messages are confusing, unhelpful, or causing users to contact support unnecessarily, and wants to improve them
- The user is building a new feature (file upload, checkout flow, authentication, form submission) and needs to cover all the error states before launch
- The user wants to establish or document error message standards and patterns for a design system, content style guide, or engineering team
- The user needs to write validation messages, inline form errors, toast notifications, modal alerts, full-page error states, or CLI error output
- The user wants to audit an existing set of error messages against anti-patterns (blame language, jargon, vague instructions, exposed internals)
- The user is localizing error messages and needs to restructure them for safe translation

**Do NOT use this skill when:**

- The user wants to document API error codes and HTTP status semantics for developer consumption -- use `api-documentation` instead, which covers response schema, error payload structure, and error code registries for technical audiences
- The user wants to write a help center or troubleshooting article that walks users through diagnosing a problem -- use `knowledge-base-article` instead, which handles long-form instructional content
- The user needs to write log messages, debug output, or structured event logs -- these serve engineering teams, not end users, and follow entirely different conventions (structured fields, severity levels, correlation IDs)
- The user wants to write success messages, confirmation dialogs, or empty state copy -- these follow different rhetorical patterns and do not share the same three-part structure
- The user wants to write copy for planned maintenance notices or status page incidents -- these are communications, not error messages, and follow incident communication frameworks
- The user is documenting internal error codes in a bug tracker or for a QA team -- this is defect documentation, not user-facing writing

---

## Process

### Step 1: Gather the Error Context

Before writing a single word, collect everything needed to produce a precise, accurate error message. Vague inputs produce vague messages. Ask the user to provide:

- **The system and feature:** Which product, module, or screen does this error appear in? (e.g., "file upload in the document editor," "checkout flow step 2 -- payment")
- **The triggering condition:** What action did the user take, or what system condition occurred, that caused this error? Be specific. "File too large" is not a trigger -- "User selects a file exceeding the 25MB upload limit" is.
- **The technical cause:** What actually failed at the system level? (e.g., HTTP 413 from the server, quota exhaustion in the storage backend, regex mismatch on the email field). The AI needs this to write an accurate cause statement -- even though the technical detail itself never appears in the user-facing message.
- **The user-facing impact:** What can the user not do as a result? Can they recover immediately, or is a workflow blocked?
- **The resolution path:** What is the exact next step the user can take? Is there a retry? A setting to change? An upgrade to purchase? An admin to contact? If there is no actionable fix, that changes the message structure significantly.
- **The display context:** Where does this message appear? Inline field validation, toast/snackbar, modal dialog, full-page error, CLI stderr, push notification, email notification? Each has different length constraints and structural conventions.
- **The error code system:** Does the product use error codes? Are they alphanumeric (ERR_PAYMENT_DECLINED), numeric (4012), or hierarchical (UPLOAD.SIZE.EXCEEDED)? If there is no system, recommend creating one.
- **The user's technical sophistication:** Is this a consumer product (low technical literacy assumed), a developer tool (technical vocabulary acceptable), or an enterprise B2B product (professional but not necessarily technical)?

If the user cannot provide the resolution path, this is a design problem, not a writing problem. Flag it: "This error state has no actionable fix. Before writing the message, we should determine what the user can do. Can they contact support? Retry? Change a setting?" A well-written message cannot compensate for a dead-end error state.

### Step 2: Classify the Error by Type and Severity

Not all errors are the same. Classify the error before writing anything, because type and severity determine structure, length, tone, and persistence.

**By type:**

- **Validation error:** The user's input does not meet a known requirement. These are preventable. The user has the information and ability to fix this immediately. Examples: email format wrong, password too short, required field empty, file type unsupported.
- **Action failure:** The user performed a valid action, but the system could not complete it. The cause may be transient (network timeout) or permanent (storage quota full). Examples: upload failed, payment declined, save interrupted.
- **Permission error:** The user attempted something they are not authorized to do. The cause is an authorization boundary, not a user input error.
- **System error:** The product itself is broken in a way that is not the user's fault and not immediately fixable by the user. Examples: server 500, database unavailable, third-party service outage.
- **Data loss risk:** The system is about to lose or has already lost user data. This is a special category requiring immediate, clear, urgent communication regardless of the other classifications.

**By severity (determines persistence and prominence):**

| Severity | Definition | Persistence | Example |
|---|---|---|---|
| Informational | The user should know this, but it does not block them | Auto-dismisses in 4-5 seconds | "You are using 90% of your storage" |
| Warning | The user is about to do something risky | Persists until acknowledged | "Leaving this page will discard unsaved changes" |
| Low (Validation) | Input is wrong; user can fix right now | Persists next to the field until corrected | "Enter a valid email address" |
| Medium (Action Failure) | Something failed; user can probably retry or change approach | Persists until dismissed or resolved | "Your changes could not be saved" |
| High (System Error) | System is broken; user cannot proceed | Persists; may escalate to status banner | "We are experiencing a service disruption" |
| Critical (Data Loss) | Data has been or may be lost | Blocks interaction until acknowledged | "Your session expired -- unsaved changes may be lost" |

### Step 3: Apply the Three-Part Message Structure

Every user-facing error message must answer three questions in order. This is non-negotiable -- messages that skip a part leave users confused, angry, or helpless.

**Part 1 -- What happened (the event):**
State what failed in terms of the user's goal or action, not the system's internal state. The subject of the sentence should be the thing that failed, not a generic placeholder.

- Correct: "Your payment could not be processed."
- Correct: "This file could not be uploaded."
- Incorrect: "An error occurred." (No information about what failed)
- Incorrect: "Operation failed." (Jargon; does not name the operation)
- Incorrect: "HTTP 500: Internal Server Error." (Technical; does not name the user's goal)

**Part 2 -- Why it happened (the cause):**
Give the specific reason. One of the most common writing failures is the generic cause statement. The cause statement transforms an opaque failure into something the user can understand and act on.

- Correct: "because the card number is not valid"
- Correct: "because your session expired after 30 minutes of inactivity"
- Incorrect: "due to an unexpected error" (no information)
- Incorrect: "because of a system issue" (too vague)
- Incorrect: "because the server returned a 500 status code" (internal detail)

For transient failures where the cause is genuinely unknown to the user (network hiccup, race condition), it is acceptable to say "This is usually caused by a brief network interruption." Do not invent a specific cause if you do not know it -- but do not omit the cause entirely either.

**Part 3 -- How to fix it (the action):**
Provide the single most effective next action. Use imperative sentences. Name the specific action, not a vague instruction.

- Correct: "Check your card details and try again, or use a different payment method."
- Correct: "Reduce the file to under 25 MB or choose a different file."
- Incorrect: "Please try again." (What should they try? When? How?)
- Incorrect: "Contact your administrator." (Why? What should they say?)
- Incorrect: "Try again later." (When is later? What will be different?)

**Structure by display context:**

| Display Type | Part 1 | Part 2 | Part 3 | Max length |
|---|---|---|---|---|
| Inline field validation | Required (1 sentence) | Optional (append to Part 1) | Required (1 sentence) | 2 sentences |
| Toast / Snackbar | Required (1 sentence) | Brief (phrase) | Required (1 sentence) | 2 sentences + button |
| Modal dialog | Required | Required | Required + button label | 3-4 sentences |
| Full-page error | Required | Required | Required + multiple options | Paragraph + actions |
| CLI stderr | Required (1 line) | Optional (second line) | Required (suggested command) | 3-4 lines |
| Push notification | Required (1 sentence) | Omit or brief phrase | Required (1 sentence) | 2 sentences |

### Step 4: Write Supporting Content

The primary message is the minimum viable content. Depending on severity and context, add:

**Error code:**
Every error that a user might describe to a support agent needs a code. Codes let support teams locate logs, reproduce issues, and avoid asking users to describe technical details. Format options:
- Alphanumeric with semantic segments: `ERR_UPLOAD_SIZE` -- readable and debuggable
- Hierarchical dot notation: `UPLOAD.FILE.SIZE_EXCEEDED` -- good for products with deep feature trees
- Numeric: `4012` -- compact but opaque without a lookup table

Always include the code in the message text for high-severity errors: "Contact support with code ERR_UPLOAD_500." For low-severity validation errors, the code can be hidden in the DOM or console rather than shown to users.

**Expandable technical details:**
For medium and high severity errors in products used by technical or power users, provide a "Show details" expansion panel. The expanded content can include:
- What the system attempted
- What response or state was encountered
- Whether any data was written before the failure
- A request ID or trace ID for server errors (never a stack trace)

**Help link:**
Link to a knowledge base article when one exists. Use descriptive link text that matches the article title: "How to reduce file size" not "Click here" or "Learn more."

**Action buttons:**
Every error that has a recoverable path needs a labeled action button. Button labels should describe the action, not confirm the error: "Try again" or "Choose a different file" or "Upgrade storage" -- not "OK" or "Close" (which convey no information about what happens next).

**Escalation path:**
For errors that cannot be resolved by the user alone, tell them who to contact and what to say: "Contact support with error code ERR_UPLOAD_500 and the time of the error." The specificity prevents the user from arriving at support empty-handed.

### Step 5: Write the Button Labels and Action Microcopy

Action labels inside error states are part of the error message system and require the same rigor. Rules for error-adjacent buttons:

- Use verb-noun format for primary actions: "Retry upload," "Choose a different file," "Upgrade storage," "Contact support"
- "OK" and "Close" are acceptable only for purely informational messages with no action available
- If there are two buttons, the primary action (the recommended fix) goes on the right or in the primary button style; the secondary action (cancel or dismiss) goes on the left
- Destructive actions (delete data to free space, discard unsaved changes) must be labeled explicitly with the consequence: "Delete files to free space" not just "Continue"
- Do not use "Try again" as the sole label if the retry is likely to fail without user action -- it gives false hope. Use "Try again" only when a transient failure (network blip) is the most likely cause and the retry has a reasonable chance of success

### Step 6: Calibrate Tone by Severity and Context

Tone is not decoration -- it signals to the user how serious the situation is and how to respond. Miscalibrated tone (too casual for a critical error, too alarming for a validation error) damages trust.

**Validation errors (low severity):** Direct, factual, neutral. No apology. The user made a correctable input mistake.
- Template register: "[Field] must be [requirement]. [Specific instruction]."
- Example: "Password must be at least 8 characters. Include at least one number."
- Do NOT say: "Oops!" or "Sorry, there was an issue with your password."

**Action failures (medium severity):** Professional and solution-oriented. Brief empathy is acceptable but not required. Never over-apologize.
- Template register: "Your [thing] could not be [action]. [Cause]. [Fix]."
- Example: "Your draft could not be saved. The connection was interrupted. Check your internet connection and try again."
- Do NOT say: "We're so sorry this happened to you!" -- it sounds performative.

**System errors (high severity):** Honest, calm, and reassuring about data safety. Never minimize. Never blame the user. Acknowledge the disruption directly.
- Template register: "We are experiencing [issue]. Your [data/progress] is [safe/status]. [What the team is doing / what the user can do]."
- Example: "We are experiencing a service disruption that is preventing logins. Your account data is safe. We are working to restore access. Check our status page for updates."
- Do NOT say: "We're having a little hiccup!" -- minimization erodes trust in a high-stakes moment.

**Data loss risk (critical):** Urgent, specific, action-first. No hedging. Name exactly what is at risk.
- Template register: "Your [specific data] may be lost. [Immediate action] before [consequence]."
- Example: "Your unsaved report will be lost if you navigate away. Copy your work before leaving this page."
- Do NOT bury the data loss risk in the middle of a paragraph. Lead with it.

**Tone word choices to avoid in all contexts:**

| Avoid | Because | Use instead |
|---|---|---|
| "Oops" | Minimizes frustration | Omit the opener entirely |
| "Uh oh" | Infantilizing | Omit the opener entirely |
| "Unfortunately" | Filler with no information | Omit or state the failure directly |
| "Please" | Slightly patronizing in error context | Use imperative directly |
| "Simply" | Implies the fix is easy (it wasn't, or they wouldn't have the error) | Omit |
| "Invalid" | Jargon | "not valid," "incorrect," "must be" |
| "Exception" | Developer jargon | Describe what failed |
| "Null" | Developer jargon | "empty," "missing," "not found" |

### Step 7: Audit Against the Anti-Pattern Checklist

Before delivering any error message, run it through this checklist. Each check should produce a definitive pass or flag -- not a judgment call.

**Blame audit:** Does any sentence imply the user did something wrong? Words like "you entered," "you selected," "you attempted" can shift blame. Rewrite to focus on the object or the system: "The email address is not valid" not "You entered an invalid email address."

**Specificity audit:** Does the message contain any of these phrases? Flag and rewrite each:
- "something went wrong" -- replace with the specific failure
- "an error occurred" -- replace with what specifically failed
- "try again later" -- replace with a specific action or timeframe
- "please try again" -- replace with a specific retry instruction
- "unexpected error" -- replace with the actual cause or "a brief technical issue"
- "error processing your request" -- replace with the name of the action that failed

**Jargon audit:** Does the message contain any of the following? Remove or replace:
- HTTP status codes (404, 500, 413) -- describe the outcome in plain language
- SQL terms (null, constraint, foreign key, timeout) -- describe the data or action
- Server names, internal URLs, file paths, stack traces -- remove entirely
- Developer abbreviations (API, SDK, env, config, repo unless this is a developer tool) -- spell out or replace

**Completeness audit:** Does the message answer all three parts?
- What happened: Yes / No
- Why it happened: Yes / No (acceptable to omit only for transient unknown causes)
- What to do: Yes / No (never acceptable to omit)

**Length audit by context:**
- Inline / toast: over 2 sentences? Tighten.
- Modal: over 4 sentences in the main message? Move details to an expandable section.
- CLI: over 4 lines? Offer a --verbose flag for additional detail.

---

## Output Format

Deliver error messages in the following structured format. Each error scenario gets its own block. Group related scenarios under a feature header.

```
## Error Messages for [System/Feature Name]

---

### [Error Scenario Name]

**Trigger:** [Exact condition that produces this error -- be specific]
**Type:** [Validation | Action Failure | Permission | System Error | Data Loss Risk]
**Severity:** [Low | Medium | High | Critical]
**Display:** [Inline | Toast | Modal | Full Page | CLI | Push Notification]
**Audience:** [Consumer / Technical / Developer]

**Primary Message:**
> [Part 1: What happened]. [Part 2: Why it happened]. [Part 3: What to do].

**Error code:** [ERR_CODE or code format appropriate to the system]

**Button label(s):** [Primary action label] | [Secondary action label, if applicable]

**Help link text:** [Descriptive link text] -- [destination: article title or section]

**Details (expandable, optional):**
> [Additional technical context appropriate to the audience. Request ID, what was attempted, 
> whether data was written, what to include when contacting support.]

**Escalation path (if unresolvable by user):**
> [Who to contact, what to say, what information to include]

**Localization notes (if applicable):**
> [Placeholder tokens used, variable fields, length expansion considerations]

---

### [Next Error Scenario]

[Repeat structure above]
```

**When delivering multiple errors:**
- Group them by feature or user flow (e.g., "File Upload Errors," "Authentication Errors")
- Order them within a group from most common to least common where known, or from validation to action failure to system error
- After all scenarios, optionally include a summary table:

```
## Error Code Reference

| Error Code | Scenario | Severity | Display |
|---|---|---|---|
| ERR_FILE_SIZE | File exceeds 25MB limit | Low | Inline |
| ERR_FILE_FORMAT | Unsupported file type | Low | Inline |
| ERR_UPLOAD_NET | Upload interrupted by network | Medium | Toast |
| ERR_UPLOAD_500 | Server error during upload | High | Toast |
| ERR_STORAGE_FULL | User quota exhausted | Medium | Modal |
```

---

## Rules

1. **Never use "something went wrong" or "an error occurred" as the primary message** -- these phrases contain zero information. Every error has a specific thing that failed; name it. "Your file could not be uploaded" is always more helpful than "Something went wrong."

2. **Never blame the user** -- the sentence subject should be the thing that failed, not the person. "The email address is not valid" not "You entered an invalid email." "The card number could not be verified" not "You entered an incorrect card number." This is not just a style preference -- blame language in error messages measurably increases user support contacts and decreases trust scores.

3. **Never say "try again later" without a timeframe or condition** -- "later" is meaningless. If a retry window is known (rate limit: 45 seconds; maintenance: 2 hours), state it exactly. If unknown, say "Try again in a few minutes" and provide a retry button that enables itself after 60 seconds.

4. **Never expose technical internals** -- no stack traces, SQL error messages, server hostnames, internal file paths, HTTP status code numbers (only their meaning), exception class names, or database constraint names should appear in any user-facing message. These are security risks and usability failures simultaneously.

5. **Every unresolvable error must include an escalation path with a specific error code** -- "Contact support" is incomplete. "Contact support with error code ERR_UPLOAD_500" is complete. Users should never arrive at a support agent without the information the agent needs to find their logs.

6. **Validation errors must appear adjacent to the field they describe** -- not in a banner at the top of the form, not in a toast, not in a modal. The spatial relationship between the error and the field is the fastest way to communicate which input needs correction. A summary at the top ("3 fields need your attention") is acceptable as a supplement, not a replacement.

7. **Error messages in products that support localization must use placeholder tokens, not string concatenation** -- "Your file is " + fileSize + " MB, which exceeds the limit" cannot be translated safely. The correct approach is a token string: "Your file is {file_size_mb} MB, which exceeds the {max_size_mb} MB limit." German and Finnish translations expand 30-40% in character count; Japanese and Chinese compress. Plan for both.

8. **The button label must describe the action, not acknowledge the error** -- "OK," "Got it," and "Dismiss" are acceptable only when there is genuinely no action to take. In all other cases: "Try again," "Choose a different file," "Upgrade storage," "Contact support" -- verb + object, specific to the recovery path.

9. **Do not use humor in error messages** -- a user encountering an error is experiencing friction, potential data loss, or blocked work. An error message is not a brand personality moment. "Oops! Looks like something went sideways 🙃" is appropriate for no error state. Wit in error messages consistently scores lower in user trust research and increases support volume.

10. **Data loss risk errors must lead with the risk, not the cause** -- when data may be lost, the first sentence must name the data at risk. Not: "Your session has expired due to 30 minutes of inactivity, which means your unsaved changes may be lost." Correct: "Your unsaved changes may be lost. Copy your work before refreshing the page." The risk must be salient and immediate -- burying it in a subordinate clause ensures users miss it.

11. **Retry buttons should only appear when a retry has a reasonable chance of succeeding without user action** -- offering a retry button for a full-quota error, a permission error, or a format validation error is misleading. Reserve automatic retry options for transient failures (network timeouts, temporary server errors) where the condition may have resolved on its own.

12. **Every error code must be unique, stable, and documented internally** -- error codes must not be recycled across different error conditions. Once assigned, a code should not change (users and support teams bookmark them). Maintain an internal error code registry that maps each code to: technical cause, affected service, recommended support procedure, and historical incident rate.

---

## Edge Cases

### Intermittent and Transient Errors (Network Timeouts, Server Blips)

Implement exponential backoff retry logic before surfacing an error to the user. The standard pattern: attempt 1 immediately, attempt 2 after 2 seconds, attempt 3 after 4 seconds, attempt 4 after 8 seconds. If all four attempts fail, then show the error. If any attempt succeeds, show nothing. When writing the message for the failure state, do not describe the retry attempts to the user -- just present the final state. The message should acknowledge the likely cause ("a brief network interruption") without blaming the network definitively, since the cause may be the server. Include a manual retry button. If the product has a connection status indicator (a signal bar or dot), that indicator should reflect the state independently of the error message.

### Multiple Simultaneous Validation Errors on a Single Form

Never aggregate multiple validation errors into one message ("Please correct the errors below"). Show an individual error message adjacent to each field that failed. Additionally, show a non-intrusive summary at the top of the form that serves as navigation assistance: "3 fields need correction" with anchor links that jump the user to each field. This serves users who submit long forms and cannot see all errors simultaneously. Do not auto-focus on the first error field on submission -- this disrupts screen readers and users on mobile. Instead, let the user scroll to errors using the summary links. The count in the summary updates in real time as the user corrects fields.

### Errors in Background Processes (File Import, Data Sync, Batch Operations)

Background process errors cannot use toasts (they dismiss too quickly) or modals (the user has moved on). Use a persistent notification panel or a dedicated "Jobs" or "Activity" section of the UI. The notification text should follow the pattern: "[Process name] completed with [N] errors. View details." The "View details" link opens a log that shows each failed item with: the item identifier, the specific error for that item, and an individual retry button for that item (not a "retry all" which may overwrite successes). Critical: never tell the user a batch "completed" if all items failed. "Completed with errors" is appropriate for partial failure; "Failed" is appropriate for total failure.

### Permission and Authorization Errors

This category requires deliberate information hiding for security reasons. Do not reveal the name, path, or existence of the resource the user cannot access -- a user who guesses resource paths to probe permissions gets confirmation from a "403: You don't have access to /admin/users" message. The correct message: "You don't have access to this page. Contact your administrator to request access." Do not show the HTTP 403 code or the word "Forbidden." Do not link to a help article that names the restricted resource. For products with role-based access control, include the role required only if that information is not sensitive: "This feature requires an Admin role. Contact your workspace administrator to request access."

### Rate Limiting Errors

Rate limiting errors are uniquely time-bound and require precision. The message must tell the user exactly when they can try again, not approximately. If the system resets rate limits on a per-minute window, calculate and display the seconds remaining: "You've reached the request limit. Try again in 47 seconds." If the UI supports it, include a countdown timer that enables the retry button automatically when the window resets -- this prevents users from manually refreshing and guessing. If the rate limit is per day or per billing period (API quota), tell the user the reset time in their local timezone and provide a path to increase the limit: "You've used your daily request limit. Your limit resets at midnight (Eastern Time). Upgrade your plan for a higher limit."

### Errors in Right-to-Left Languages and Localized Deployments

Error messages for products supporting Arabic, Hebrew, Persian, or Urdu must support full bidirectional text. Validation errors that appear to the right of a field in left-to-right layouts must appear to the left of the field in right-to-left layouts. Error icons (typically ❌ or ⚠️) should remain at the start of the text flow, which changes sides with the layout direction. Beyond directionality: every variable value embedded in an error message must use a named token -- `{field_name}`, `{max_size_mb}`, `{retry_seconds}`, `{error_code}` -- because different languages place these values at different positions in the sentence. A translator cannot safely move a concatenated value in a string like "File must be under " + max + " MB." German error messages will be 30-40% longer than their English source strings; ensure error containers do not truncate at fixed widths. Finnish and Hungarian can expand even further.

### CLI and Terminal Error Messages

CLI error messages follow a different convention than GUI messages because the context is different: the user is a developer or operator, stderr is the standard channel, and the output may be parsed by scripts or piped to log aggregators.

Structure for CLI errors:
- Line 1 (stderr): `error: [what failed] -- [concise cause]`
- Line 2 (stderr, optional): `  [additional context or state information]`
- Line 3 (stderr): `  Try: [suggested corrective command with flags]`
- Line 4 (stderr, optional): `  See: [error code] for more information`

Exit with a non-zero exit code that is consistent and documented (exit 1 for general failure, exit 2 for misuse, exit 3 for environment issues -- document your scheme). The error code should appear in the output so it can be captured in scripts. Do not mix errors into stdout -- all error output goes to stderr so that stdout can be piped cleanly. For verbose mode (`--verbose` or `-v`), add the full technical context that would be in an expandable details panel in a GUI.

### Errors During Authentication and Session Expiry

Authentication errors require special care because of the dual concern of security (do not reveal whether an account exists) and usability (help legitimate users recover). For login failures, never distinguish between "email not found" and "password incorrect" -- both should show: "The email or password is not correct. Check your credentials and try again." After 5 failed attempts, the message should change to acknowledge the lockout: "Your account has been temporarily locked after multiple failed sign-in attempts. Check your email for instructions to unlock it, or try again in 15 minutes."

For session expiry, the message behavior depends on whether data is at risk:
- If the user was in a read-only view: redirect to login with a non-modal banner: "Your session expired. Sign in to continue."
- If the user was actively editing: block navigation with a modal: "Your session expired. Any unsaved changes may be lost. Copy your work before signing in again." Provide a "Copy my work" button that triggers clipboard copy of a text representation of the current editor state, if technically feasible.

---

## Example

**Input:** "Write error messages for a SaaS project management tool. Cover: file upload errors (file too large at 50MB max, unsupported format -- only PDF/PNG/JPG/DOCX, and upload failed due to network), storage quota full, and a permission error when a viewer tries to edit a task."

---

## Error Messages for Project Management Tool -- File Attachments and Task Editing

---

### File exceeds attachment size limit

**Trigger:** User selects or drags a file larger than 50MB into the task attachment area
**Type:** Validation
**Severity:** Low
**Display:** Inline (below the upload dropzone, replaces the progress bar that appeared on selection)
**Audience:** Consumer / business professional

**Primary Message:**
> This file is {file_size_mb} MB, which exceeds the 50 MB attachment limit. Reduce the file size or choose a smaller file.

**Error code:** `ERR_ATTACH_SIZE`

**Button label(s):** Choose a different file

**Help link text:** How to compress files before uploading -- "Reducing file sizes" (knowledge base article)

**Details (expandable):** Not needed at this severity level.

**Escalation path:** Not applicable -- user can resolve independently.

**Localization notes:** Use `{file_size_mb}` and `{max_size_mb}` tokens. Do not concatenate. If the product displays the limit in KB for files under 1MB, add a `{max_size_unit}` token rather than hardcoding "MB."

---

### Unsupported file format

**Trigger:** User selects a file whose MIME type or extension is not PDF, PNG, JPG, or DOCX
**Type:** Validation
**Severity:** Low
**Display:** Inline (below the upload dropzone)
**Audience:** Consumer / business professional

**Primary Message:**
> "{file_name}" is a {detected_format} file, which is not supported. Attach a PDF, PNG, JPG, or DOCX file instead.

**Error code:** `ERR_ATTACH_FORMAT`

**Button label(s):** Choose a different file

**Help link text:** Supported file types in [Product Name] -- "Attachment file types" (knowledge base article)

**Details (expandable):** Not needed at this severity level.

**Escalation path:** Not applicable -- user can resolve independently.

**Localization notes:** `{file_name}` and `{detected_format}` are tokens. The list of supported formats (PDF, PNG, JPG, DOCX) should be a separate localizable string -- format names may differ in some regional conventions.

---

### Attachment upload failed -- network interruption

**Trigger:** The HTTP upload request fails, times out, or is interrupted after the user initiates an upload (passes validation but fails in transit)
**Type:** Action Failure
**Severity:** Medium
**Display:** Toast notification, persistent (does not auto-dismiss); appears in the lower-right corner. The upload progress bar in the task pane also collapses and shows a red error state inline.
**Audience:** Consumer / business professional

**Primary Message:**
> "{file_name}" could not be attached. The upload was interrupted, usually by a brief network issue. Check your connection and try again.

**Error code:** `ERR_ATTACH_NET`

**Button label(s):** Retry upload | Cancel

**Help link text:** Troubleshooting upload errors -- "Upload failures" (knowledge base article)

**Details (expandable):**
> The upload stopped at {transfer_percent}% complete. No file was saved to this task. If retrying does not work and your connection is stable, contact support with code ERR_ATTACH_NET and the task ID: {task_id}.

**Escalation path:**
> Contact support with error code ERR_ATTACH_NET, your task ID ({task_id}), and the time of the error. Support can check upload logs to confirm whether a partial file was received.

**Localization notes:** `{file_name}`, `{transfer_percent}`, and `{task_id}` are tokens. `{transfer_percent}` should be omitted from the primary message if the product does not track transfer progress -- only include in expandable details when the data is available.

---

### Storage quota exhausted

**Trigger:** User attempts to upload any file but the workspace's storage quota is at 100% of its plan limit
**Type:** Action Failure
**Severity:** Medium
**Display:** Modal dialog (blocks the upload attempt; appears instead of the upload progress bar)
**Audience:** Consumer / business professional

**Primary Message:**
> Your workspace storage is full. You have used all {used_storage_gb} GB included in your {plan_name} plan. Delete existing attachments to free space, or upgrade your plan for more storage.

**Error code:** `ERR_STORAGE_QUOTA`

**Button label(s):** Manage storage | Upgrade plan | Cancel

**Help link text:** How storage is calculated in [Product Name] -- "Workspace storage" (knowledge base article)

**Details (expandable):**
> Storage is shared across all projects and members in your workspace. Files deleted by any workspace member free space for everyone. Deleted files are permanently removed after 30 days in the Trash; storage is reclaimed immediately upon deletion.

**Escalation path:**
> If you have recently deleted files and storage still shows as full, contact support with error code ERR_STORAGE_QUOTA. Allow 5 minutes after deletion before retrying.

**Localization notes:** `{used_storage_gb}` and `{plan_name}` are tokens. Storage units (GB) may need to display as TB for enterprise plans -- use `{used_storage}` and `{used_storage_unit}` as separate tokens rather than combining them.

---

### Permission error -- viewer attempts to edit a task

**Trigger:** A workspace member with the Viewer role clicks an editable field in a task (task title, description, status, assignee, due date) or attempts to attach a file
**Type:** Permission
**Severity:** Low (the user's data is safe; they simply cannot take this action)
**Display:** Toast notification (auto-dismisses after 5 seconds; low severity, no action required in most cases)
**Audience:** Consumer / business professional

**Primary Message:**
> You can view this task but cannot make changes. Ask your workspace admin to update your role if you need edit access.

**Error code:** `ERR_PERM_VIEWER` (used internally; do not surface to user unless they contact support)

**Button label(s):** (None -- this error is informational; the toast dismisses automatically. Do not offer a contact-admin button unless the product has an in-app admin contact feature.)

**Help link text:** Workspace roles and permissions -- "Managing member roles" (knowledge base article)

**Details (expandable):** Not applicable -- do not reveal the internal permission model or role name in detail. Naming the role ("Viewer") in the message is acceptable because it helps the user understand their own access level, but do not list what Viewer-role members cannot do -- it is not helpful and increases message length unnecessarily.

**Escalation path:**
> Ask the workspace administrator to change your role. Admins can adjust roles from Workspace Settings > Members. If you do not know who your admin is, contact [Product Name] support.

**Localization notes:** Role name "Viewer" should be a localized string, not hardcoded -- the role names may differ in localized versions of the product.

---

## Error Code Reference

| Error Code | Scenario | Type | Severity | Display |
|---|---|---|---|---|
| `ERR_ATTACH_SIZE` | File exceeds 50 MB attachment limit | Validation | Low | Inline |
| `ERR_ATTACH_FORMAT` | Unsupported file type attached | Validation | Low | Inline |
| `ERR_ATTACH_NET` | Upload interrupted by network failure | Action Failure | Medium | Toast (persistent) |
| `ERR_STORAGE_QUOTA` | Workspace storage quota at 100% | Action Failure | Medium | Modal |
| `ERR_PERM_VIEWER` | Viewer role attempts to edit | Permission | Low | Toast (auto-dismiss) |
