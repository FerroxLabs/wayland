---
name: knowledge-base-article
description: |
  Creates support knowledge base articles with issue description, cause analysis,
  step-by-step resolution, and prevention guidance in a structured
  issue/cause/resolution/prevention format. Use when the user needs to write
  a KB article, troubleshooting guide, or support documentation. Do NOT use
  for user guides (use `user-guide`), internal wiki pages (use
  `internal-wiki-page`), or error messages (use `error-message-writing`).
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
# Knowledge Base Article

## When to Use

Use this skill when the user needs to create customer-facing support content that helps readers diagnose and resolve a specific, known problem. Specific trigger scenarios include:

- A support team lead wants to document a recurring issue that is generating more than 5 tickets per week so customers can self-serve before contacting support
- A product team has shipped a bug fix and needs to explain what affected customers should do if they are still on the old version or need to understand what changed
- A customer success manager needs to capture a complex troubleshooting sequence that support agents are currently delivering inconsistently by word of mouth
- A developer relations engineer wants to convert a long, rambling Slack thread about a known integration failure into a canonical, searchable document
- A support agent resolving a novel issue wants to document it immediately so the resolution is captured before institutional knowledge is lost
- The user has a specific symptom, a known cause (or set of causes), and a discrete resolution -- as opposed to broad procedural guidance

**Do NOT use this skill when:**

- The user wants end-to-end instructional content for a feature (use `user-guide` -- KB articles solve problems, user guides teach usage)
- The user wants internal documentation for the engineering or support team (use `internal-wiki-page` -- KB articles are customer-facing and must avoid internal jargon and team-specific context)
- The user wants to write the error message string that appears inside the product UI (use `error-message-writing` -- in-product copy follows different constraints around character limits and tone)
- The user wants release notes announcing a bug fix (use `release-notes` -- release notes are chronological announcements, not troubleshooting references)
- The user is documenting an API endpoint, SDK method, or code interface (use `api-reference` -- that format requires parameter tables, request/response examples, and authentication details)
- The symptom is not yet understood and the cause is unknown -- do not write a KB article for an open investigation; write an incident communication instead
- The user wants a general FAQ page covering many unrelated topics -- that is a different format requiring a different structure and content strategy

---

## Process

### 1. Gather complete issue intelligence before writing

Never begin drafting with incomplete information. Collect all of the following before writing a single sentence:

- **The exact symptom:** What does the customer see, hear, or experience? Get the precise error message text, UI behavior description, or system output. Vague inputs like "it doesn't work" must be clarified.
- **The trigger context:** What sequence of actions causes the issue? Is it always reproducible or intermittent? Under what conditions (browser, OS, plan type, configuration, data volume, account state)?
- **All known causes:** There is rarely just one. Distinguish between root causes (the underlying system state that creates the problem) and contributing factors (configuration or behavior that enables the root cause to surface).
- **The affected scope:** Which product versions, plan tiers, operating systems, geographic regions, or user roles are affected? Which are explicitly NOT affected?
- **Resolution paths:** Is there a permanent fix, a workaround, or both? Does the resolution require customer action, admin action, or support team action?
- **The verification signal:** What does success look like? What specific output, UI state, or behavior confirms the issue is resolved?
- **Prevention opportunity:** Is this issue preventable with a configuration change, a behavioral adjustment, or a product setting?
- **The recency of the information:** When was this last confirmed accurate? Who confirmed it?

If the user cannot answer all of these, identify the gaps explicitly and ask targeted follow-up questions. A KB article written with incomplete information creates customer confusion and increases -- not decreases -- ticket volume.

### 2. Write the title using the customer's symptom language

The title is the single most important discoverability element. Follow these precise rules:

- **Match the search query, not the engineering diagnosis.** A customer searches for the error message they saw or the action that failed -- not the internal system process that caused it. "Password reset email not received" is correct. "SMTP relay authentication failure for transactional email queue" is wrong for a customer-facing article.
- **Lead with the symptom or error text.** Put the most distinctive search term at the front of the title. "'Insufficient permissions' error when exporting reports" puts the error text first where search engines and KB search algorithms weight it most heavily.
- **Include the error code or error message in quotation marks** if one exists. This is the highest-precision search signal a customer can provide. Customers copy-paste error text directly into search boxes.
- **Keep titles under 70 characters** to avoid truncation in search results and browser tabs -- though clarity trumps brevity when necessary.
- **Use sentence case, not title case.** "File upload fails on files larger than 25 MB" reads more naturally and aligns with how customers phrase questions.
- **Never use internal project names, ticket numbers, or engineering module names** as the primary identifier in the title.

### 3. Write the issue description from inside the customer's experience

The issue section must do three things in 3-4 sentences maximum:

- **Mirror the customer's experience precisely.** Use second person ("You may see..." / "When you try to...") and describe the UI elements, error text, and behavior exactly as the customer encounters them. Include the exact error string in quotation marks.
- **State the trigger conditions specifically.** "This error occurs when you upload a CSV file containing more than 50,000 rows" is useful. "This error may occur in certain circumstances" is useless.
- **Scope the affected population immediately.** Customers who are on a different plan or using a different browser should know within the first two sentences whether this article applies to them. This prevents them from wasting time on a resolution that does not apply to their situation.

Avoid using the issue section to explain cause or mechanism -- that belongs in the Cause section. The issue section is purely phenomenological: what the customer observes.

### 4. Document the cause with enough depth to build trust, not enough to overwhelm

The cause section serves a specific psychological function: it validates that the customer encountered a real, known problem -- not user error -- and it helps them understand which resolution path applies to them. Write it with these constraints:

- **Plain language causation statements:** "This happens because..." followed by a single-sentence mechanism. You can go one level deeper if it helps the customer self-identify their situation ("If you recently changed your account's primary domain, this is likely your cause").
- **Enumerate causes explicitly.** If there are multiple causes, number them ("Cause 1," "Cause 2") and write a one-paragraph explanation for each. This numbering must correspond to the numbered resolution sections so customers can navigate directly from cause to fix.
- **Indicate relative frequency when known.** "This is the most common cause, affecting approximately 80% of users who see this error" helps customers prioritize which resolution to try first.
- **Never embed resolution instructions in the cause section.** Keep diagnostic clarity and procedural instructions separated -- customers who skim will skip the steps if they are buried in explanatory prose.
- **Use a diagnostic decision tree for three or more causes.** Present it as a series of "If X, then your cause is Y" statements so customers can identify their specific scenario before attempting any steps.

### 5. Write resolution steps with zero ambiguity

Every resolution section is a precision instrument. Each step must be independently executable by a customer with no additional context:

- **One physical action per step.** "Click Settings, then click Team Members, then click Add Member" is three steps collapsed into one. Separate them. If the customer cannot complete a step in a single gesture or input, split it.
- **Use imperative mood, present tense.** "Click **Save**." Not "The user should click on the Save button" and not "Clicking Save will..."
- **Bold all UI element names exactly as they appear in the product.** If the button reads "Save changes," bold it as **Save changes** -- not **Save** or **Save Changes**.
- **Include expected results for every step that produces visible output.** Format as "You should see: [specific description]." This is not optional -- it is the mechanism by which customers know they are on the right path. If a step produces no visible output, note that: "The page does not visually change -- this is expected."
- **End every resolution path with a verification step.** This step confirms the issue is resolved -- not just that the steps were completed. "You should now see: [success state]" or "Test by [specific action] -- the error should no longer appear."
- **Order resolution paths by frequency, then complexity.** The most common fix goes first. The most disruptive or complex fix (requiring support, requiring data migration) goes last.
- **Include a time estimate for complex resolutions.** "This process takes approximately 10-15 minutes."

### 6. Write the escalation path as a structured data-collection spec

The "If the issue persists" section is not a vague "contact support" instruction. It is a data-collection protocol that pre-qualifies the customer before they open a ticket. This directly reduces the back-and-forth cycle of support conversations:

- **Name the specific support channel:** email address, chat widget location, phone number, or portal URL. Do not write "contact support" without a destination.
- **List the exact information the customer must collect and provide.** Be specific: "Your account ID (found in Settings > Account > Account Details)," "The timestamp of when the error occurred (timezone included)," "A screenshot of the full error modal, not just the error text."
- **Specify which log files, if any, the customer should capture** and how to find them (exact file path or UI location).
- **Set expectations:** "A support agent will respond within 24 hours on Business days" or "Priority support customers can expect a response within 4 hours."

### 7. Write prevention as a behavioral protocol

Prevention sections that say "keep your software updated" are useless. Effective prevention guidance is:

- **Specific to the root cause.** If the issue was caused by a configuration drift, specify which setting to monitor and what the correct value is.
- **Actionable within the product.** Link to the specific settings page or tell the customer exactly where to find the relevant control.
- **Bounded in scope.** Maximum 4 prevention items. If there are more, the issue has systemic causes that belong in a different type of document.
- **Inclusive of monitoring recommendations** when the issue tends to recur silently. "Check your seat usage from Settings > Billing > Usage at the start of each month before adding new team members."

### 8. Complete metadata and discoverability fields

A KB article that cannot be found helps no one. Every article must include:

- **Applies to:** List every product version, plan, operating system, or configuration where the issue occurs -- and explicitly note versions or configurations where it does NOT occur if that distinction is important.
- **Last verified date:** The date the resolution was last confirmed accurate by a human who tested it. This is not the publication date -- it is the verification date. Update it whenever the product changes.
- **Related articles:** 2-4 related articles with a one-clause explanation of why each one is related. "How to manage team roles -- covers the permission structure underlying this error" is useful. "See also: Team management" is not.
- **Search tags or keywords:** Include common misspellings, alternate phrasings, and the exact error text so the KB search engine can surface the article on variant queries.

---

## Output Format

```
# "[Exact error text or symptom phrase]" [brief context]

**Applies to:** [Product name] [version range or "all versions"] | [Plan types] | [OS/browser if relevant]
**Last verified:** [YYYY-MM-DD]
**Article type:** Troubleshooting

---

## Does this article apply to you?

This article applies if ALL of the following are true:

- You are using [product] on [plan/version]
- You see the exact message: "[error text]"
- The issue occurs when you [specific trigger action]

If you see a different error or the issue occurs in a different context, see [related article].

---

## Issue

[Sentence 1: Second-person symptom description with exact error text in quotation marks.]
[Sentence 2: Specific trigger context -- when/how it occurs.]
[Sentence 3: Affected scope -- who this affects and who it does not.]

---

## Cause

> This is a known issue. [Optional: A fix is available in version X.X / A fix is planned for the next release.]

**Cause 1 (most common): [Cause name in plain language]**
[1-2 sentence plain-language explanation of why this causes the symptom.]
*How to identify this as your cause:* [Specific diagnostic indicator -- what the customer will see or know that confirms this is their cause.]

**Cause 2: [Cause name in plain language]**
[1-2 sentence explanation.]
*How to identify this as your cause:* [Specific diagnostic indicator.]

**Cause 3: [Cause name in plain language]** *(less common)*
[1-2 sentence explanation.]
*How to identify this as your cause:* [Specific diagnostic indicator.]

---

## Resolution

> **Before you begin:** [Any prerequisite -- permission level required, data backup recommendation, estimated time.]

### Cause 1: [Cause name] -- [estimated time]

1. [Imperative action with bold UI element name.]
   - You should see: [specific expected output]

2. [Next action.]
   - You should see: [expected output]
   - Note: [Any gotcha, timing issue, or non-obvious behavior to warn about.]

3. [Action.]

4. **Verify the fix:** [Specific test action.]
   - **Confirmed resolved when:** [Exact success state the customer will observe.]

---

### Cause 2: [Cause name] -- [estimated time]

1. [Step.]
   - You should see: [expected output]

2. [Step.]

3. **Verify the fix:** [Specific test action.]
   - **Confirmed resolved when:** [Exact success state.]

---

### If the issue persists after all steps above

Contact support and have the following ready before reaching out:

| Information to provide | Where to find it |
|---|---|
| Account ID | Settings > Account > Account Details |
| Error timestamp (with timezone) | The email notification you received, or your browser console |
| [Specific log or screenshot] | [Exact location] |
| [Other diagnostic data] | [Location] |

**Contact support at:** [specific channel]
**Expected response time:** [specific SLA]

---

## Prevention

- [Specific, actionable prevention step with exact location of the relevant setting.]
- [Second specific prevention action.]
- [Third prevention action -- monitoring recommendation if applicable.]

---

## Related Articles

| Article | Why it is relevant |
|---|---|
| [Article title] | [One clause explaining the relationship] |
| [Article title] | [One clause explaining the relationship] |

---

*Tags: [error text verbatim] [symptom phrase] [common misspelling] [alternate phrasing]*
```

---

## Rules

1. **Titles must contain the exact error string if one exists.** Customers copy-paste error text into search. An article titled "Team size limit behavior" will never be found by a customer searching for "Seat limit reached." Use the customer's language, not the product team's language.

2. **One action per numbered step, no exceptions.** The moment a step contains the word "and" connecting two UI actions, split it into two steps. Compound steps cause customers to miss the second action, complete steps out of order, or lose their place when interrupted.

3. **Every resolution path must end with a verification step that describes success in observable terms.** "The error no longer appears" is a verification step. "The issue should be resolved" is not -- it gives the customer no way to confirm they are done.

4. **Never write a KB article for an issue whose cause is unknown.** If the support team has not identified the root cause, the article will give incorrect or misleading guidance. Document it as a known issue under investigation in an incident communication, not as a KB article.

5. **The "Applies to" field must be exhaustive and precise.** Vague scoping like "recent versions" causes customers on unaffected versions to attempt incorrect resolutions and customers on affected versions to dismiss the article as not relevant. Specify exact version numbers or version ranges ("versions 3.2 through 4.1").

6. **Cause sections must include diagnostic identifiers.** Every cause must tell the customer how to confirm it is their cause before they attempt the corresponding resolution. Without this, customers attempt all resolution paths sequentially, compounding their frustration.

7. **"Contact support" is never a complete instruction.** Always specify the exact channel (email address, portal URL, in-app chat location), the information the customer must collect before contacting, and the expected response time. An escalation path without these three components creates a second problem on top of the original one.

8. **Never use passive voice in resolution steps.** "The file should be uploaded" leaves ambiguity about who uploads it and whether it has been done yet. "Click **Upload** to submit the file" is unambiguous. Passive voice in procedural steps is correlated with customer errors and repeat contacts.

9. **The "Last verified" date must reflect actual re-testing, not publication date.** When a product update ships that touches the affected system, the KB article must be re-verified against the new behavior and the date updated. An outdated article with a stale verified date actively harms trust in the support content library.

10. **Limit each article to a single discrete issue.** If two different symptoms can result from the same underlying cause, write two articles -- one per symptom -- and link them to each other. If customers search for the wrong symptom and land on an article about a different one, they leave without a resolution. The cost of an extra article is low; the cost of customer confusion is high.

---

## Edge Cases

### Issue has a workaround but no permanent fix yet

When engineering has identified the cause but a fix has not shipped, do not delay publishing the article -- publish immediately with a workaround. Follow this structure:

- Add a prominent notice below the title metadata: "**Workaround available -- permanent fix in progress.** A permanent fix is scheduled for version X.X, targeted for [month/year]. The steps below provide a working workaround in the meantime."
- Title the resolution section "Workaround" rather than "Resolution" to set accurate expectations.
- Do not promise a specific ship date in the article unless the date is committed and public -- use "an upcoming release" if the date is not confirmed.
- When the fix ships, update the article immediately: change "Workaround" to "Resolution," remove the notice banner, update the "Last verified" date, and add a note: "As of version X.X, this issue is permanently resolved. If you are on an earlier version, use the steps below."

### Issue affects only a specific subset of customers with non-obvious qualifying conditions

When the issue only affects customers who match multiple specific conditions simultaneously (for example: on a paid plan, using a specific browser, with a specific setting enabled, and having migrated from a legacy system), add a "Does this article apply to you?" checklist at the very top of the article, before the Issue section:

- Format it as a checklist: "This article applies if ALL of the following are true: [condition 1], [condition 2], [condition 3]."
- If a customer does not match all conditions, redirect them immediately to the most likely alternate article rather than leaving them to read an irrelevant resolution.
- This prevents false starts and the support tickets that result when customers apply a resolution that does not match their configuration.

### Resolution requires elevated permissions or administrator access

When any step requires admin-level permissions that the customer reading the article may not have:

- State the required permission level in a "Before you begin" callout before the first numbered step: "You must have Account Owner or Admin permissions to complete these steps. If you have a different role, share this article with your account owner."
- Do not bury permission requirements inside a step -- the customer will not discover they are blocked until they are already mid-resolution.
- Provide a secondary path for non-admin customers: either how to locate and contact their account admin, or a reduced self-service resolution for the parts they can complete themselves.

### Intermittent issue that cannot be reliably reproduced

For issues that occur unpredictably (race conditions, network-dependent failures, timezone-triggered events), the resolution section cannot provide a guaranteed fix sequence. Instead:

- Lead with a data-capture protocol: specific steps to enable logging, capture console output, record timestamps, and document the action sequence when the issue occurs. This turns the customer into a diagnostic partner.
- Specify exactly which log files are relevant, where to find them, and how long they are retained before being overwritten.
- Include a threshold for when to escalate: "If you experience this issue more than 3 times in a 7-day period, open a support ticket with the captured logs."
- After the data capture section, provide any known partial mitigations -- configuration changes that reduce frequency even if they do not eliminate the issue.

### Security-sensitive issue (credential exposure, permission bypass, data leakage)

Articles about security issues follow a different content priority order:

- **Lead with the immediate protective action**, before any explanation: "**Action required:** If you are affected by this issue, rotate your API keys immediately by going to Settings > API Keys > Rotate all keys."
- **Scope the affected population precisely** so customers who are not affected do not take unnecessary disruptive action (like rotating credentials they did not need to).
- **Do not publish technical details** about the vulnerability mechanism that could be exploited by bad actors who read the KB article. Describe the customer impact and the remediation steps -- not the technical vector.
- Coordinate publication timing with the security team -- KB articles about security issues typically should not publish until a fix is available or the vulnerability is already public.

### Issue was resolved by a product update and the article should guide customers to upgrade

When the canonical resolution is "upgrade to version X.X":

- State the fix version prominently in the Issue section: "This issue is resolved in version 4.2 and later."
- Make upgrading the first and primary resolution path.
- Provide a working workaround as a secondary path for customers who cannot upgrade immediately -- enterprise customers often have change control processes that delay upgrades.
- Include the steps to verify which version the customer is currently running before they attempt anything else.
- Set a review date for deprecating the workaround path after the fixed version reaches broad adoption (typically 6-12 months after release).

### Article must cover three or more causes with significantly different resolution paths

When an issue has three or more distinct causes (each requiring different resolution steps), the article risks becoming too long to be useful. Apply these constraints:

- Add a "Which cause applies to you?" diagnostic section before the resolution steps. Use a decision-tree format with specific, observable diagnostic criteria for each cause so customers can navigate directly to the relevant resolution without reading all paths.
- If any individual cause's resolution exceeds 7 steps, consider whether it is complex enough to warrant its own dedicated article linked from the main article.
- Use a summary table at the top of the resolution section: three columns -- "Cause," "How to identify," "Go to" -- with a row per cause. This allows experienced customers to navigate directly without reading all sections.

---

## Example

**Input:** "Write a KB article for our cloud storage platform. Issue: customers get a '403 Forbidden' error when trying to download files that they previously could access with no problem. We've found two causes: (1) the file was moved to a folder the user no longer has access to, and (2) a recently expired API token is being used by their integration. The first cause affects about 75% of cases."

**Output:**

---

# "403 Forbidden" error when downloading a file you previously accessed

**Applies to:** StorageCloud Pro, Business, and Enterprise plans | All versions | Web app, desktop client, and API
**Last verified:** 2024-11-10
**Article type:** Troubleshooting

---

## Does this article apply to you?

This article applies if ALL of the following are true:

- You are receiving a "403 Forbidden" error specifically when downloading a file
- The file was accessible to you previously without any error
- You have not voluntarily had your account permissions changed

If you received a 403 error when uploading a file, or when creating a new folder, see "403 Forbidden error on file upload."

---

## Issue

When you click a file to download it from the StorageCloud web app, desktop client, or API, you receive the error: "403 Forbidden -- You do not have permission to access this resource." This error occurs even though you were able to access the same file previously without any issue. This error affects users on Pro, Business, and Enterprise plans whose files may have been reorganized or whose API integrations use token-based authentication.

---

## Cause

> This is a known behavior, not a product defect. It results from a permission change or authentication state that occurred after your last successful access.

**Cause 1 (most common -- approximately 75% of cases): The file was moved to a folder you do not have permission to access.**
Files in StorageCloud inherit the permissions of the folder they are in. If a file was moved by another user from a shared folder to a private or restricted folder, your access to the file is revoked automatically -- even if you had direct access to the file before the move.

*How to identify this as your cause:* You can still see the file listed (it appears in search results or in a shared link), but clicking it produces the 403 error. You do not see the folder it currently lives in in your left-hand folder tree.

**Cause 2: Your integration is using an expired or revoked API token.**
If you are accessing the file through an API integration (such as a Zapier workflow, a custom script, or a connected third-party app), the API token your integration uses may have expired or been manually revoked. StorageCloud API tokens expire after 90 days unless configured otherwise on Enterprise plans.

*How to identify this as your cause:* The 403 error occurs only when accessing the file through your integration or API script, not when you download the file manually through the web app. You may also see an error log entry in your integration tool referencing "token expired" or "invalid_token."

---

## Resolution

> **Before you begin:** Identifying your cause before attempting either resolution path will save you time. Read the "How to identify this as your cause" descriptions above and proceed to the matching section below.

---

### Cause 1: File moved to a restricted folder -- approximately 5 minutes

1. Open the StorageCloud web app and sign in.

2. In the top navigation bar, click **Search** and enter the exact file name.
   - You should see: the file appears in search results even though you cannot access it. The path shown under the file name will indicate the folder it currently lives in.

3. Note the folder path shown under the file name in the search results. This is the folder the file was moved to.

4. Contact the person who owns or manages the destination folder and ask them to either:
   - Move the file back to a location you can access, or
   - Grant you permission to the destination folder from **Folder Settings > Share > Add user**.
   - Note: You cannot grant yourself folder permissions -- this action must be performed by an account Admin or the folder owner.

5. Once the permission has been granted or the file moved, return to the file location and attempt the download again.
   - **Confirmed resolved when:** The file downloads without displaying the 403 error. The download progress bar appears and the file saves to your device.

---

### Cause 2: Expired or revoked API token -- approximately 10-15 minutes

> **Before you begin:** You must have Developer or Admin permissions on your StorageCloud account to generate a new API token. If you do not have this permission level, share these steps with your account administrator.

1. Sign in to the StorageCloud web app and go to **Settings > Developer > API Tokens**.
   - You should see: a list of all API tokens associated with your account, including their creation date, last used date, and status (Active or Expired).

2. Identify the token your integration is using. Check your integration's configuration settings or environment variables to find the token value, then match the first 8 characters to the token listed here.
   - You should see: the token in question shows a status of **Expired** or is no longer listed (which indicates it was manually revoked).

3. Click **Generate new token**.
   - You should see: a modal window displays your new token value. This is the only time the full token is shown -- copy it immediately.

4. Copy the new token and update it in every location where your integration stores the credential:
   - Your integration platform's credentials or environment configuration
   - Any `.env` files or secrets management systems in your deployment
   - Note: If you use the same token in multiple integrations or services, update all of them. The old token will not begin working again.

5. Trigger a test download through your integration by running the same action that produced the 403 error.
   - **Confirmed resolved when:** Your integration successfully downloads the file and returns a 200 response code. The 403 error no longer appears in your integration logs.

6. To prevent expiration from causing future disruptions, set a calendar reminder to rotate your API token every 80 days (before the 90-day expiration threshold). See the Prevention section below for the recommended long-term approach.

---

### If the issue persists after all steps above

If you have completed the steps for your identified cause and the 403 error continues, open a support ticket and have the following ready before contacting us:

| Information to provide | Where to find it |
|---|---|
| Your account email address | Settings > Account > Profile |
| The full file path of the affected file | Visible in the file's detail panel -- click the file, then click **Details** |
| The folder path shown in search results | StorageCloud Search results, under the file name |
| A screenshot of the full 403 error message | Capture the complete browser window including the URL bar |
| Your API token ID (first 8 characters only -- never share the full token) | Settings > Developer > API Tokens |
| Timestamp of the most recent failed attempt (with timezone) | Your browser's developer console > Network tab, or your integration's error log |

**Contact support at:** support@storagecloud.example or via the **Help** chat widget in the bottom-right corner of the web app.
**Expected response time:** Business (2 business days) | Pro (1 business day) | Enterprise (4 hours, 24/7)

---

## Prevention

- **Remove team members through proper offboarding, not just folder restructuring.** When a team member leaves a project, revoke their access through **Settings > Team > Manage Access** rather than reorganizing files around them. Reorganizing files silently removes access for other users who had permission to the original folder location.
- **Rotate API tokens on a scheduled cycle, before expiration.** Set a recurring calendar event every 80 days to generate a new API token and update your integrations. Enterprise plan customers can extend token lifetimes to up to 365 days under **Settings > Developer > Token Settings > Expiration policy**.
- **Use folder-level permissions for shared files instead of file-level permissions.** Files inherit folder permissions and lose any file-level access grants when moved. Storing shared files in a permissions-controlled shared folder ensures access is stable even if the file is renamed or reorganized within that folder.

---

## Related Articles

| Article | Why it is relevant |
|---|---|
| Understanding StorageCloud permissions and inheritance | Explains the folder permission model that underlies Cause 1 -- read this if your team frequently reorganizes files |
| Generating and managing API tokens | Full reference for token creation, rotation, and scope configuration -- relevant to Cause 2 |
| "403 Forbidden" error on file upload | Covers the separate case where the 403 error occurs on upload rather than download -- different causes and resolutions |
| How to request access to a folder from its owner | Step-by-step guide for the permission request workflow referenced in Cause 1, Step 4 |

---

*Tags: 403 forbidden file download permission denied access denied previously accessible file API token expired revoked 403 error downloading forbidden error download*
