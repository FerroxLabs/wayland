---
name: code-review-patterns
description: |
  Guides expert-level code review patterns implementation: clean-code and best-practices decision frameworks, production-ready patterns, and concrete templates for code review patterns workflows.
  Use when the user asks about code review patterns, code review patterns configuration, or clean-code best practices for code projects.
  Do NOT use when the user needs a different developer tools capability -- check sibling skills in the developer tools subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "clean-code best-practices code-review"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Code Review Patterns

## When to Use

**Use this skill when:**
- A developer or team lead asks how to structure code reviews, what to look for, or how to give feedback that improves code quality without damaging team morale
- A team wants to formalize their review process -- establishing checklists, severity tiers, or review SLAs for pull requests
- An engineer asks why their PRs are getting rejected for inconsistent reasons, or why review feedback varies wildly between reviewers
- A team is experiencing slow PR cycle times (more than 24 hours for first review, more than 3 rounds of back-and-forth) and wants to diagnose root causes
- A developer asks about specific anti-patterns in code review -- rubber stamping, nitpick overload, drive-by reviews, or blocking PRs on style preferences
- A team lead wants to implement automated pre-review checks (linters, static analysis, test coverage gates) to reduce reviewer cognitive load
- An engineering organization is scaling from 3-5 engineers to 10+ and the informal review culture is breaking down
- A developer wants to understand the difference between blocking and non-blocking feedback, and how to communicate severity clearly

**Do NOT use this skill when:**
- The user needs help with a specific language's style guide conventions -- check language-specific linting or style guide skills
- The user is asking how to set up a CI/CD pipeline or GitHub Actions workflows -- check the CI/CD pipeline skill
- The user wants to learn about architecture decision records (ADRs) as a standalone documentation practice -- check the technical documentation skill
- The user needs help with pair programming or mob programming practices -- these are distinct collaboration patterns
- The user is asking about performance profiling or code optimization -- the performance engineering skill applies
- The user wants a code review of their actual code -- this skill covers the process and patterns, not the review itself

---

## Process

### 1. Diagnose the Current Review Culture and Pain Points

Before prescribing patterns, understand where the team's reviews are breaking down.

- Ask: What is the average time from PR open to first review comment? Healthy target is under 4 business hours for a team of 5+.
- Ask: What is the average number of review rounds before merge? One round is ideal, two is acceptable, three or more signals unclear author preparation or unclear reviewer expectations.
- Identify which failure mode is dominant -- see the taxonomy below:
  - **Rubber stamp reviews**: PRs merged with zero substantive comments. High throughput, low quality signal. Often caused by large PRs that reviewers feel unable to fully assess.
  - **Nitpick gridlock**: PRs blocked on formatting, naming, or style preferences that automated tools should enforce. Causes reviewer fatigue and author frustration.
  - **Drive-by reviews**: Reviewers leaving comments without context, then disappearing without following up. Creates unresolved threads and stalled PRs.
  - **Blocking on opinion**: Reviewers blocking merge on architectural preferences without clear quality criteria. Causes power struggles and inconsistency.
- Ask whether PRs have an agreed-upon size limit. Research from Google's engineering productivity group shows that PRs over 400 lines of diff see dramatically lower defect detection rates. Aim for 200-400 lines as a soft limit.
- Ask whether the team has a written definition of what constitutes a merge-ready PR.

### 2. Establish a Severity Classification System

Without explicit severity labels, every review comment carries equal implied weight, which leads to blocking PRs on trivial issues and missing critical ones.

- Define exactly four severity levels and train all reviewers to use them consistently:
  - **Blocker**: Must be resolved before merge. Reserved for correctness bugs, security vulnerabilities, data loss risks, or violations of agreed architectural constraints. Example: "This function does not handle the case where the input list is empty -- it will throw a NullPointerException in production."
  - **Major**: Should be resolved before merge, but the author and reviewer can agree to defer with a tracked follow-up issue. Example: "This logic is duplicated in three places. Extracting it would reduce future bug surface area."
  - **Minor**: Non-blocking suggestion. The author should acknowledge and decide. Example: "Consider extracting this condition into a named boolean variable for readability."
  - **Nit**: Purely stylistic, no action required if the author disagrees. Prefix with `nit:` in the comment. Example: "nit: `getUserData` might be clearer as `fetchUserProfile` to align with our naming convention."
- Instruct reviewers to state their severity explicitly at the start of every substantive comment. This eliminates ambiguity about whether a comment is blocking.
- Establish a rule: a PR can only be blocked by Blocker-level comments. Major comments generate a follow-up ticket if deferred. Minor and Nit comments never block.

### 3. Structure the Author's Responsibilities Before Review Begins

The highest-leverage place to improve review quality is before the reviewer ever looks at the code.

- Author must write a PR description that includes: what the change does, why it is being made, how to test it, and any known trade-offs or open questions. A PR with no description gets returned to the author, not reviewed.
- Author must self-review the diff before requesting review. Reading your own diff catches roughly 30-40% of the issues a peer reviewer would catch, at zero reviewer cost.
- Author must run the full local test suite and linting pipeline before opening the PR. A PR that fails CI on open indicates a process breakdown.
- Author must break PRs into logical units. A feature that requires a database migration, an API change, and a UI change should be three sequenced PRs, not one. Stack them with dependencies if necessary.
- Author should tag comments in their own PR for issues they are aware of and plan to address separately -- using a `TODO(author-name): ` convention with a linked ticket. This signals awareness and prevents reviewers from raising issues the author already knows about.
- For complex changes, authors should provide a walkthrough -- either a written tour of the key files in the PR description, or a recorded Loom/async video for teams that use them. This dramatically reduces reviewer cognitive load on large PRs.

### 4. Define the Reviewer's Responsibilities and Review Scope

Reviewers need an explicit contract about what they are and are not responsible for checking.

- Establish the three-layer review model -- reviewers check each layer in order:
  - **Layer 1 -- Correctness**: Does the code do what it claims to do? Are edge cases handled? Are error paths explicit? Are there race conditions or concurrency hazards? This layer is always required.
  - **Layer 2 -- Design**: Is the abstraction level appropriate? Are responsibilities separated cleanly? Does this change fit the existing architecture, or does it introduce a new pattern that conflicts with established ones? Does the interface make correct use easy and incorrect use hard?
  - **Layer 3 -- Polish**: Naming, readability, comment quality, test quality and coverage. This layer is optional when the team is under time pressure -- instruct reviewers to explicitly say "skipping polish review due to deadline" rather than silently skipping.
- Reviewers must respond to review requests within a defined SLA. Typical healthy SLAs: 4 hours for urgent (explicitly flagged by author), 1 business day for normal, 3 business days for low-priority or large architectural PRs.
- Reviewers must not silently abandon a review. If a reviewer starts reviewing and cannot finish, they must leave a comment saying so and un-assign themselves so another reviewer can pick it up.
- A reviewer who leaves a blocking comment owns responsibility for a timely follow-up review after the author addresses it. The reviewer, not the author, should re-request their own attention after addressing a blocker.
- Use the "yes-and" technique for design disagreements: instead of blocking on a preference, a reviewer should implement their preferred alternative on a branch and link it in the comment, allowing the author to evaluate the concrete trade-off rather than arguing abstractly.

### 5. Implement Automated Pre-Review Gates

Every issue caught by automation before human review is reviewer time saved and bias removed.

- Configure linting and formatting as hard CI gates that fail the PR before any human reviewer is notified. Tools by language: ESLint + Prettier for JavaScript/TypeScript, Black + Flake8 or Ruff for Python, Checkstyle or Spotless for Java, golangci-lint for Go, Clippy for Rust. These tools must run on every commit to the PR branch.
- Configure static analysis for security and correctness: Semgrep for cross-language pattern matching, Bandit for Python security, gosec for Go. These catch a class of defect (SQL injection, hardcoded secrets, unsafe deserialization) that human reviewers frequently miss under time pressure.
- Enforce a test coverage threshold via CI. A threshold of 80% line coverage for new code (not total coverage) is a reasonable starting point. Use diff coverage tools (diff-cover for Python, jest --coverage with a threshold configuration) to avoid penalizing adding tests to a legacy codebase.
- Run dependency vulnerability scanning (OWASP Dependency-Check, Snyk, or GitHub Dependabot) as a CI gate. New dependencies with known critical CVEs must not be merged without an explicit override and documented rationale.
- Use a PR size linter to warn (but not block) when a PR exceeds 400 changed lines. Danger.js and Reviewdog support this pattern and can leave automated comments directly in the PR.
- Commit all linting, formatting, and CI configuration to version control. Never rely on local developer setup for enforcing standards.

### 6. Design the Review Feedback Communication Standard

How feedback is written is as important as what is in it. Poor communication patterns cause rework loops and damage team relationships.

- Every substantive comment must include: the severity label, the observation (what the code currently does or fails to do), the impact (why it matters), and a suggestion (what to do instead or what to investigate). Avoid comments that are only observations without suggestions.
- Use the "author not code" principle: "This function is confusing" is a personal judgment. "The multiple return paths in this function make it difficult to trace execution flow -- consider early returns to reduce nesting" is actionable and non-personal.
- Distinguish questions from directives. "Is there a reason this uses a linear search instead of a hash lookup for this data size?" is a genuine question. "Change this to a hash map" is a directive. Both are valid; mixing them creates confusion about whether the author has autonomy.
- Avoid using the word "just" in review comments. "Just add a null check here" implies the change is trivial and the author should have known better, which is condescending. "Adding a null check here would prevent a panic on unexpected input" is neutral.
- Do not leave trailing unresolved threads. Every thread must reach a terminal state: resolved (change made), deferred (ticket created, agreed to defer), or acknowledged (author explains why the suggestion was not taken, reviewer accepts).
- Teams should agree on an async-first communication standard: review comments in the PR thread, not in Slack. Slack discussions about PR decisions are invisible to future readers of the PR.

### 7. Establish Review Metrics and a Continuous Improvement Loop

Without measurement, review process improvements are invisible and hard to justify.

- Track four core PR metrics on a weekly or biweekly basis:
  - **PR cycle time**: Time from first commit to merge. Target: under 2 business days for a team of 5-10.
  - **Time to first review**: Time from PR open to first human comment. Target: under 4 business hours.
  - **Review round count**: Number of review/revision cycles. Target: median of 1-2.
  - **PR size distribution**: Percentage of PRs over 400 lines. Target: under 20%.
- Use GitHub's built-in insights, LinearB, Swarmia, or DX (DevEx) platforms to gather these metrics without manual tracking. These tools aggregate across all PRs automatically.
- Run a monthly or quarterly retrospective specifically on code review process -- separate from sprint retrospectives. Ask: Which review patterns are working? What types of issues are reviewers catching vs. missing? Are automated gates reducing reviewer burden?
- Track the defect escape rate -- bugs found in production that were introduced through reviewed code -- and correlate it with PR size, review round count, and reviewer experience level. This surfaces which process failures lead to actual user impact.
- Publish metrics to the team. Transparency drives accountability and surfaces outliers (reviewers who never review, authors who always have 4+ round PRs) without requiring management intervention.

### 8. Tailor the Pattern to Team Size and PR Volume

The appropriate code review pattern varies significantly based on team composition and throughput.

- **2-4 engineers**: Lightweight process. One approver required, no formal checklists, automated gates are critical because the team is too small to catch everything manually. PR descriptions required, severity labels optional but encouraged.
- **5-10 engineers**: Formal process recommended. Two approvers for production-path changes, one for internal tooling. Formal severity classification required. SLAs defined. Weekly PR metrics review. Rotating review assignments to ensure cross-team knowledge sharing.
- **10+ engineers or multiple teams**: Codeowner model required. CODEOWNERS file in the repository assigns required reviewers by directory. Separate review SLAs per team. Architectural review board or RFC process for cross-cutting changes. Automated assignment via tooling (Pulltron, PullAssigner, or GitHub's built-in auto-assign).
- **Open source projects**: All the above plus contributor guidelines document, DCO (Developer Certificate of Origin) or CLA bot enforcement, and a clear policy on what kinds of contributions are in scope. Public PR etiquette is different -- assume good faith from strangers and be explicit about project constraints that might not be obvious.

---

## Output Format

When helping a user with code review patterns, produce the following structured output:

```
## Code Review Pattern Recommendation

### Diagnosis Summary
| Pain Point               | Severity  | Root Cause Hypothesis        |
|--------------------------|-----------|------------------------------|
| [observed problem]       | High/Med  | [process or tooling gap]     |

### Recommended Pattern Configuration

**Team Profile:** [size, experience mix, velocity]
**PR Volume:** [approx PRs/week]
**Primary Failure Mode:** [from taxonomy: rubber stamp / nitpick gridlock / drive-by / opinion blocking]

---

### Severity Classification Scheme
| Level   | Definition                              | Blocks Merge? | Example                                      |
|---------|-----------------------------------------|---------------|----------------------------------------------|
| Blocker | Correctness, security, data loss risk   | Yes           | Missing null check causes NPE on empty input |
| Major   | Design issue worth tracking             | Soft (deferrable with ticket) | Duplicated logic across 3 files |
| Minor   | Readability or maintainability suggestion | No          | Extract magic number to named constant        |
| Nit     | Style or preference, no action required | No           | nit: rename `getData` to `fetchUserProfile`  |

---

### Pre-Review Automation Checklist
- [ ] Linter: [specific tool + config file location]
- [ ] Formatter: [specific tool]
- [ ] Static analysis: [specific tool]
- [ ] Test coverage gate: [threshold]% diff coverage
- [ ] Dependency vulnerability scan: [tool]
- [ ] PR size warning: [line threshold]

---

### PR Description Template (Author Requirement)

**What**: [1-2 sentences: what does this change do?]
**Why**: [1-2 sentences: what problem does this solve or requirement does it fulfill?]
**How to test**: [steps a reviewer can take to validate correctness]
**Trade-offs / known limitations**: [anything deferred, any alternative approaches considered]
**Linked issues**: [ticket number(s)]

---

### Review SLA
| Priority     | Time to First Review | Time to Follow-up After Author Response |
|--------------|----------------------|-----------------------------------------|
| Urgent       | 2 business hours     | 2 business hours                        |
| Normal       | 1 business day       | 1 business day                          |
| Low / Large  | 3 business days      | 2 business days                         |

---

### Reviewer Checklist (Layer Model)

**Layer 1 -- Correctness (always required)**
- [ ] Does the code correctly implement the described behavior?
- [ ] Are all error paths explicitly handled or documented?
- [ ] Are there any race conditions, concurrency hazards, or TOCTOU issues?
- [ ] Are inputs validated at trust boundaries?
- [ ] Are resource allocations (connections, file handles, memory) properly released?

**Layer 2 -- Design (required for production-path changes)**
- [ ] Does the abstraction level match the surrounding code?
- [ ] Is this change consistent with the existing architectural patterns?
- [ ] Is the interface designed so correct use is easy and incorrect use is hard?
- [ ] Are responsibilities separated appropriately?

**Layer 3 -- Polish (optional under time pressure)**
- [ ] Are names self-explanatory without needing a comment to decode them?
- [ ] Are comments explaining "why", not "what"?
- [ ] Do tests cover happy path, edge cases, and error paths?
- [ ] Are test names descriptive enough to serve as documentation?

---

### Metrics Targets
| Metric                         | Current Baseline | Target         |
|--------------------------------|------------------|----------------|
| Time to first review           | [measure]        | < 4 hours      |
| PR cycle time                  | [measure]        | < 2 biz days   |
| Median review round count      | [measure]        | 1-2 rounds     |
| PRs over 400 lines             | [measure]        | < 20%          |
```

---

## Rules

1. **Never let style be a blocking issue.** If a style preference is not encoded in an automated linter or formatter, it is not a legitimate reason to block a PR merge. Style debates in PR threads are a tax on the whole team's velocity. The correct response to a style disagreement is to open a discussion about updating the linter configuration -- not to block the PR.

2. **Never review more than 400 lines of diff in a single sitting without breaking it up.** Cognitive load research in software engineering (Bacchelli & Bird, Microsoft Research; Google's code review study) consistently shows defect detection drops sharply after 200-400 lines and after 60-90 minutes of continuous review. Instruct reviewers to take breaks or request that large PRs be split.

3. **Always respond to a review request within the agreed SLA, even if only to acknowledge and set an expectation.** Silence is the worst possible review response. A comment that says "I'll get to this tomorrow morning" is infinitely more valuable than nothing, because it prevents the author from wondering whether to follow up, re-assign, or merge without review.

4. **Never use approval as a social gesture.** Approving a PR signals that the reviewer has completed a substantive review and is confident the code is safe to merge. Approving immediately after a PR is opened, or with a comment of "LGTM" on a 300-line change with no other comments, is a process failure and should be flagged by the team lead.

5. **Always distinguish between "this is wrong" and "I would have done it differently."** Reviewers who block PRs on personal style or architectural preference create a culture where the highest-seniority opinion always wins, regardless of correctness. The test is: "Is there a concrete, demonstrable reason the author's approach is worse?" If not, the reviewer's preference is a Minor or Nit, not a Blocker.

6. **Never leave a review thread unresolved at merge.** Unresolved threads create ambiguity about whether the underlying issue was addressed. Either resolve threads explicitly or leave a final comment explaining why it was not resolved before merging. GitHub's "require resolved conversations before merge" branch protection setting enforces this automatically.

7. **Always configure CODEOWNERS for high-risk paths.** Authentication code, payment processing logic, data migration scripts, and security configuration files must have mandatory reviewers assigned via CODEOWNERS. These files are too high-risk to rely on whoever happens to be available for review.

8. **Never allow secrets, credentials, or PII to be merged, even temporarily.** Scanning for secrets in PR diffs using tools like Gitleaks, detect-secrets, or GitHub's built-in secret scanning must be a blocking CI gate. "We'll rotate it" is not an acceptable response -- secrets committed to a repository should be treated as compromised immediately, regardless of whether the commit is later reverted.

9. **Always provide a positive signal when work is genuinely good.** Review culture fails in two directions -- too much criticism with no positive reinforcement, and empty praise that provides no signal. When code demonstrates a clever approach, excellent test coverage, or a well-named abstraction, say so specifically. "The way you inverted the dependency here makes the unit test considerably simpler -- good call" is a useful comment.

10. **Never allow the review process to become a gatekeeping mechanism.** A review process that takes 5+ days per round, has no defined SLAs, or allows single individuals to indefinitely block work is a delivery risk, not a quality mechanism. If a reviewer is consistently blocking PRs without clear justification, that is a team health issue to address directly -- not a signal that the review process is working correctly.

---

## Edge Cases

### Hotfix PRs Under Production Incident Conditions

When a production incident requires an immediate fix, the standard review process creates unacceptable delay. Handle this with a defined hotfix protocol -- not by abandoning review entirely.

- Define a "break glass" hotfix lane in advance: one required approver (not zero), the on-call engineer and the author's immediate lead are the designated approvers.
- Hotfix PRs must be scoped to the minimum change required to resolve the incident. Refactoring during a hotfix is prohibited.
- After the hotfix is merged and the incident is resolved, a mandatory follow-up PR is required within 48 hours that adds tests, cleans up any shortcuts taken, and documents what happened. The post-incident review should reference both PRs.
- Tag all hotfix PRs with a specific label (e.g., `hotfix` or `incident-response`). This allows the team to track how often the break-glass lane is used and whether it is being abused for non-emergency situations.

### Legacy Codebase With No Existing Review Culture

Introducing code review to a team that has never practiced it formally requires careful change management, not just process documentation.

- Do not start with a comprehensive checklist and strict SLAs. Start with two rules only: every PR needs at least one human approver, and no PR merges within 30 minutes of opening (forcing at least a brief review window).
- Introduce severity classification in week 2-3, after the team has developed a baseline habit of reviewing.
- Do not retroactively apply the new process to legacy code not being touched. Only new code and code being modified for other reasons falls under the new review standard.
- Expect resistance from engineers who have worked autonomously for a long time. Frame review as "catching each other's blind spots" rather than "checking your work," which carries an evaluative connotation.
- Run the first several reviews as co-review sessions where the whole team participates in reviewing one PR together. This builds shared vocabulary and calibrates expectations before everyone starts reviewing independently.

### Disagreement Between Reviewer and Author That Cannot Be Resolved

When a reviewer and author are stuck on a design disagreement after two rounds of back-and-forth, the thread is no longer productive.

- Apply the "escalate, don't stall" rule: the PR should not sit blocked for more than 2 business days on an unresolved disagreement. After 2 days, a third party (tech lead, staff engineer, or relevant domain owner) must be tagged to break the tie.
- The third party's role is to make a final decision, not to adjudicate who is "right." They choose the option that is acceptable (not optimal) and document the rationale in the PR thread.
- After the decision, neither the reviewer nor the author should re-litigate it in that PR. If they feel strongly, they open a follow-up architectural discussion in a separate forum (RFC, design doc, or team meeting) -- not in the PR where the code is already merged.
- Track these escalations. More than two escalations per month in a team of 10 signals either unclear architectural ownership or a personality conflict that needs management attention.

### High-Volume Teams With Hundreds of PRs Per Week

At 50+ PRs per week (common for teams of 20+ engineers), manual reviewer assignment and unstructured review SLAs create bottlenecks.

- Implement auto-assignment using CODEOWNERS combined with load-balancing tools like PullAssigner or GitHub's auto-assign action. Ensure no single engineer is assigned more than 3-4 reviews per day.
- Implement a review rotation schedule where engineers have designated "review days" (e.g., every Tuesday and Thursday) so authors know when to expect reviews without individual follow-up.
- Introduce RFC or design review process for changes that touch more than 3 subsystems, have API surface changes, or introduce new dependencies. These should be reviewed as design documents before any code is written, reducing the volume of large, controversial PRs.
- Use merge queues (GitHub Merge Queue, GitLab's merge trains) to handle the CI race condition problem at scale, where multiple PRs have conflicting changes and each passes CI individually but not in combination.

### Junior Engineers Receiving Harsh or Demoralizing Reviews

Code review is a high-stakes feedback environment for engineers early in their careers. A single harsh review from a senior engineer can set back an engineer's confidence for months.

- When a junior engineer's PR receives more than 5 substantive comments, the reviewer should proactively schedule a 15-minute sync to walk through the feedback verbally before the engineer starts addressing it. Written comments without context can feel overwhelming.
- Senior reviewers should model the behavior they want to see: leave explicit "good catch" and "nice approach" comments when warranted, not just correction. Positive signal calibration is as important as defect detection for junior engineers.
- Tag comments with educational context when appropriate. Instead of "don't do this," add "don't do this -- this pattern is called [name] and causes [specific problem]. Here's an article/pattern that covers the better approach." This turns reviews into learning moments without requiring the engineer to feel ashamed.
- If a junior engineer's PR reveals a gap in onboarding documentation or team knowledge-sharing, the response should be to improve the documentation -- not to make the engineer feel they should have known.

### Open Source or External Contributor PRs

External contributors do not have the same context as internal team members and require different review handling.

- The first response to any external contributor PR must come within 72 hours, even if that response is only "Thank you for contributing -- we will review this fully by [date]." Silence on external contributions destroys contributor motivation and damages project reputation.
- Maintainers must never assume malicious intent from external contributors. Style differences, unfamiliar patterns, and incomplete implementations are almost always good-faith contributions from engineers with a different background.
- If an external PR is out of scope, too large, or not aligned with the project roadmap, communicate this explicitly and early -- before asking for revisions. Asking a contributor to rewrite a PR that will ultimately be rejected is disrespectful of their time.
- All contribution guidelines (PR template, coding standards, test requirements, DCO/CLA) must be documented in a CONTRIBUTING.md file and referenced in the PR template. Never hold external contributors to standards that are not written down somewhere they could have found.

---

## Example

**Input:** "Our team of 8 engineers is getting really frustrated with code review. PRs are sitting open for 3+ days, reviewers are leaving huge comment threads that feel like personal attacks, and a couple senior engineers are blocking everything on their architectural preferences. Half the team doesn't bother leaving real feedback -- they just click approve to avoid conflict. What should we do?"

**Output:**

## Code Review Pattern Recommendation

### Diagnosis Summary

| Pain Point                        | Severity | Root Cause Hypothesis                                                  |
|-----------------------------------|----------|------------------------------------------------------------------------|
| PRs sitting open 3+ days          | High     | No defined SLA; reviewer assignment is informal or voluntary           |
| Comments that feel like attacks   | High     | No severity classification; feedback is unstructured and non-specific  |
| Senior engineers blocking on preference | High | No distinction between blocking correctness issues and design opinions |
| Rubber stamp approvals            | High     | Social pressure to avoid conflict; no accountability for review quality |

This team is exhibiting three simultaneous failure modes: **nitpick/opinion gridlock** (senior engineers blocking on preference), **rubber stamping** (junior engineers approving to avoid conflict), and **SLA breakdown** (no defined time expectations). These three problems reinforce each other -- rubber stamping happens because the alternative (leaving real feedback) leads to conflict.

The solution requires three parallel interventions: process structure (SLAs and severity classification), communication standards (how to write feedback), and automation (remove style debates from human review entirely).

---

### Recommended Pattern Configuration

**Team Profile:** 8 engineers, mixed seniority (presence of "a couple senior engineers" who dominate reviews), likely 15-30 PRs/week based on team size  
**PR Volume:** Estimated 15-25 PRs/week  
**Primary Failure Mode:** Opinion blocking from senior engineers + rubber stamping from junior engineers as a defensive response

---

### Immediate Actions (Week 1-2)

**Step 1: Establish automated style enforcement to defuse the nitpick problem**

The senior engineers blocking on style and architectural preferences almost certainly includes legitimate style concerns mixed in with personal opinions. The fastest way to remove style from human review is to make it automatic.

Deploy the following in your CI pipeline this week:

- Pick one formatter and lock it in. For JavaScript/TypeScript: Prettier with a `.prettierrc` committed to the repo. For Python: Black with `pyproject.toml`. For Java: Spotless with a Google Java Format configuration. The formatter's output is correct by definition -- no reviewer can override it.
- Add an ESLint, Flake8, or equivalent linter with rules your team agrees on. Start with the recommended ruleset for your ecosystem and only customize rules that your team has explicitly discussed.
- Add a pre-commit hook using `husky` (JavaScript) or `pre-commit` (Python) so that formatting failures never reach CI in the first place.
- Set CI to fail on linter/formatter violations before any reviewer is notified. This means the first thing a reviewer sees is code that already passes automated style checks.

This single change will eliminate a significant fraction of the comment volume that is causing the "personal attack" feeling. When a style issue is caught by a bot, it's not personal.

**Step 2: Implement the four-level severity classification**

At your next team meeting (this week), agree on and document the following:

| Level   | Definition                              | Blocks Merge? | Example for your codebase                                         |
|---------|-----------------------------------------|---------------|--------------------------------------------------------------------|
| Blocker | Correctness, security, data loss risk   | Yes           | "This endpoint is missing authentication -- any user can call it" |
| Major   | Real design issue, worth a ticket       | Soft (deferrable) | "This service now owns 4 distinct responsibilities -- worth splitting" |
| Minor   | Readability or maintainability suggestion | No          | "Extracting this 40-line block into a named function would clarify intent" |
| Nit     | Style preference, no action required    | No           | "nit: I'd name this `userRepository` rather than `userRepo`"      |

**The most important rule to add immediately**: Only Blocker comments prevent merge. Senior engineers who are currently blocking PRs on design preferences must reclassify those comments as Major or Minor. If they have a genuine Blocker, they must articulate specifically why the code is incorrect, insecure, or will cause data loss.

Announce this at a team meeting. Do not implement it silently. Senior engineers need to buy in, or they will work around it.

**Step 3: Define SLAs and assign review responsibility**

Starting immediately, implement:

| Priority | Time to First Review | Follow-up After Author Responds |
|----------|----------------------|---------------------------------|
| Urgent   | 2 business hours     | 2 business hours                |
| Normal   | 1 business day       | 1 business day                  |

Assign reviewers explicitly at PR open using GitHub's review request feature. Don't let "available to anyone" mean "invisible to everyone." With 8 engineers, a simple rotation works: maintain a list, and the next two engineers on the rotation are assigned to each PR. One can be the author's immediate collaborator on the feature, one should be a fresh set of eyes.

Use GitHub's branch protection settings to require at least two approvals before merge and to require all conversations to be resolved. This creates accountability on both sides -- reviewers must follow up and authors must respond.

---

### PR Description Template (Make This a GitHub PR Template)

Create `.github/pull_request_template.md` in your repository:

```markdown
## What does this change do?
<!-- 1-2 sentences describing the behavior change -->

## Why is this change being made?
<!-- The business or technical problem this solves. Link to ticket: -->
Resolves #

## How to test this
<!-- Steps a reviewer can take to validate correctness manually, or what automated tests cover it -->

## Trade-offs and known limitations
<!-- Anything deferred to a follow-up, or approaches considered and rejected -->

## Checklist (author)
- [ ] I have self-reviewed this diff
- [ ] CI passes locally
- [ ] Tests cover the happy path and at least one error case
- [ ] PR is under 400 lines of diff (or I have explained why it cannot be smaller)
```

A PR that arrives without a completed description gets one comment from the first reviewer: "Please complete the PR template before requesting review." No other review happens until then. This is not a punishment -- it is a quality gate that protects reviewer time.

---

### Reviewer Checklist (Three-Layer Model)

**Layer 1 -- Correctness (always required)**
- [ ] Does the code correctly implement what the description says it does?
- [ ] Are all error paths handled or explicitly documented as out of scope?
- [ ] Are there race conditions or TOCTOU hazards in any concurrent operations?
- [ ] Are inputs validated at trust boundaries (API endpoints, user input, external data)?
- [ ] Are resources (DB connections, file handles, network sockets) properly released in all paths?

**Layer 2 -- Design (required for production-path changes)**
- [ ] Does this change fit the existing architectural patterns, or introduce a conflicting one?
- [ ] Is the interface designed so the correct usage is obvious and the incorrect usage is difficult?
- [ ] Are responsibilities appropriately separated?

**Layer 3 -- Polish (optional; skip under time pressure -- say so explicitly)**
- [ ] Are names self-explanatory without requiring comments to decode them?
- [ ] Do comments explain "why" rather than restating "what" the code does?
- [ ] Do tests cover edge cases and error paths, not just the happy path?

---

### Addressing the Senior Engineer Problem Directly

The blocking behavior from senior engineers is the hardest problem to solve because it involves seniority dynamics, not just process.

Recommend the following conversation with the senior engineers directly (or through their manager):

- Share the diagnostic: "Our PR cycle time is 3+ days and half the team is rubber-stamping to avoid conflict. The current review dynamic is causing both quality and delivery problems."
- Introduce the severity model and explicitly ask them to reclassify their blocking comments. If they insist something is a Blocker, they must articulate the specific correctness, security, or data integrity risk.
- Offer them a higher-leverage channel for architectural opinions: a weekly 30-minute "architecture office hours" or a lightweight RFC process for cross-cutting changes. This gives them a forum for their opinions that doesn't slow down every individual PR.
- If a senior engineer continues to block PRs on preference after the process is established, that is a management conversation -- not a process fix. The process provides the evidence (a Blocker comment with no concrete correctness justification) that makes the conversation factual rather than subjective.

---

### Metrics to Track (Starting Now)

| Metric                     | Your Likely Current State | 90-Day Target       |
|----------------------------|---------------------------|---------------------|
| Time to first review       | 24-72+ hours              | Under 4 hours       |
| PR cycle time              | 3-5+ days                 | Under 2 business days |
| Median review round count  | 3-4+                      | 1-2                 |
| PRs over 400 lines         | Unknown                   | Under 20%           |
| Rubber stamp approval rate | High (estimate 40-60%)    | Under 10%           |

Track these manually in a shared spreadsheet for the first month, then invest in a tool like LinearB or Swarmia to automate the measurement. Review the numbers at your monthly team retrospective. If cycle time is not dropping after 4 weeks, the process changes have not been adopted -- find out which step is being skipped.

---

### What to Expect in the First 30 Days

- **Week 1-2**: Expect resistance from the senior engineers. Expect junior engineers to feel relieved but skeptical. The automated style gates will initially catch a lot of issues -- this is normal and will taper off as developers adjust their habits.
- **Week 2-4**: The severity classification will force some uncomfortable conversations when senior engineers realize their Blocker-level comments need to be justified. This is the moment of highest risk for process abandonment. Team leads must actively reinforce the system.
- **Week 4-6**: If the process is held, PR cycle times should start dropping. The junior engineers who were rubber-stamping will begin leaving Minor and Nit comments as they see it is safe to do so.
- **Month 2**: Review the metrics. Identify the one or two remaining pain points (there will always be some) and address them specifically. Do not try to fix everything simultaneously.

The goal is not a perfect review process -- it is a review process the team trusts, that catches real problems, and that does not create enough friction to make engineers avoid it.
