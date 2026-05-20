---
name: conduct-code-review-round
description: >-
  Orchestrates a thorough code review process by chaining four engineering
  skills into a structured review pipeline. Covers code quality assessment,
  security review, performance analysis, and documentation of review
  findings with actionable feedback.
  Use when conducting a formal code review of a pull request or a batch
  review of recent changes.
  Do NOT use for automated-only code scanning, pair programming sessions,
  or architecture reviews that do not examine specific code changes.
license: Apache-2.0
type: workflow
skills: code-review-patterns devsecops-engineer performance-profiling technical-documentation
trigger_phrases: conduct code review review pull request thorough code review structured review process
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: testing security optimization step-by-step
  category: software-project
  depends: code-review-patterns devsecops-engineer performance-profiling technical-documentation
  disclaimer: none
  difficulty: intermediate
---

# Conduct Code Review Round

**Estimated time:** 1-4 hours per review round (depending on change size and complexity)

This workflow chains four atomic skills into a structured code review process that covers code quality, security, performance, and documentation completeness. It ensures reviews are thorough, actionable, and consistent rather than superficial approvals or nitpick-heavy criticism. The workflow produces specific, prioritized feedback that the author can act on immediately.

**Critical note:** Code review is a collaboration, not a gatekeeping exercise. The goal is to improve the code and share knowledge, not to prove the reviewer's superiority. Feedback should be specific, actionable, and tied to observable impact (correctness, security, performance, or maintainability).

## When to Use

- User is reviewing a pull request and wants a structured approach beyond ad-hoc reading
- Team wants to establish a consistent, thorough review process
- User is reviewing a large or complex pull request (over 300 lines changed)
- User wants to catch security and performance issues in addition to code quality
- Do NOT use when: the review is a rubber-stamp approval for a trivial change, the user is pair programming (review happens in real time), or the user needs an architectural review that examines design decisions rather than code changes

## Prerequisites

Before starting this workflow, ensure:

1. **Pull request is ready for review:** The author has marked the PR as ready, all CI checks pass, and the PR description explains the context and changes
2. **Review context is available:** You can access the code diff, linked ticket or issue, related documentation, and any design decisions that informed the implementation
3. **Review guidelines exist:** The team has documented review expectations (response time, required checks, feedback format) or you will follow this workflow's structure
4. **Testing is complete:** The author's tests pass and the reviewer can run the code locally if needed for complex changes

## Steps

**Step 1: Review Code Quality and Correctness** (uses: code-review-patterns)

Examine the code changes for correctness, readability, maintainability, and adherence to team conventions. This step covers the core review: does the code do what it should, and will the team be able to understand and maintain it.

- Input: Pull request diff, linked ticket or issue with acceptance criteria, team coding conventions, existing codebase patterns
- Output: Code quality feedback with: correctness issues (logic errors, edge cases, race conditions), readability concerns (naming, complexity, unclear intent), convention violations (formatting, patterns, architecture), and positive callouts (well-designed solutions worth highlighting)
- Key focus: Review for correctness first, style second. A logically correct function with non-ideal naming is better than a beautifully named function with a bug. Check: does the code handle the expected inputs correctly? What about null, empty, boundary, and error inputs? Are there race conditions in concurrent code? Does the code match the acceptance criteria in the linked ticket?

**Step 2: Check Security Implications** (uses: devsecops-engineer)

Examine the changes specifically for security implications. This step catches vulnerabilities that general code review misses because they require security-specific knowledge.

- Input: Code diff from Step 1, authentication and authorization context, data handling patterns in the changes, dependency changes (new packages)
- Output: Security review findings with: input validation gaps (user input reaching database queries or system calls without sanitization), authentication and authorization issues (endpoints missing auth checks, privilege escalation opportunities), sensitive data handling (PII logged, secrets in code, excessive data in API responses), and dependency risks (new dependencies with known vulnerabilities or excessive permissions)
- Key focus: Check every point where user input enters the system. Verify that authentication is enforced on new endpoints. Look for sensitive data in log statements, error messages, and API responses. Review new dependency additions for known vulnerabilities and evaluate whether the dependency is necessary or if a simpler solution exists.

**Step 3: Assess Performance Impact** (uses: performance-profiling)

Evaluate the performance implications of the code changes. This step catches performance regressions before they reach production.

- Input: Code diff, database query changes, algorithm complexity, existing performance benchmarks or SLA targets
- Output: Performance assessment with: database query analysis (new queries, N+1 patterns, missing indexes, large result sets), algorithm complexity (time and space complexity of new code paths), resource usage concerns (memory allocations in loops, unbounded data structures, missing pagination), and recommendations for performance-sensitive changes
- Key focus: Look for N+1 query patterns (querying inside a loop), unbounded result sets (SELECT without LIMIT in contexts where data could grow), missing database indexes on new query predicates, and synchronous operations that block the event loop or thread pool. Not every change has performance implications; skip this step for changes that do not affect data access or algorithmic complexity.

**Step 4: Document Review Findings** (uses: technical-documentation)

Compile all findings into structured, actionable review feedback. This step ensures feedback is clear, prioritized, and easy for the author to address.

- Input: Findings from Steps 1-3, PR discussion context, team feedback conventions
- Output: Structured review feedback with: categorized comments (must-fix, should-fix, suggestion, praise), specific line references for each finding, proposed solutions or alternatives (not just problem descriptions), and an overall recommendation (approve, request changes, or needs discussion)
- Key focus: Every "request changes" comment must include a suggested fix or clear direction. "This is wrong" is not actionable feedback; "This query runs inside a loop causing N+1. Consider using a single query with an IN clause to load all related records upfront" is actionable. Separate blocking issues (must-fix) from suggestions (nice-to-have) so the author knows what to prioritize.

## Decision Points

- **Before Step 1:** If the PR is over 500 lines, ask the author to split it into smaller PRs. Large PRs receive superficial reviews because reviewer attention degrades after 200-400 lines. If splitting is not possible, allocate extra time and review in multiple sessions.

- **At Step 2:** If the changes involve authentication, authorization, payment processing, or PII handling, invest more time in the security review even if the code quality review found no issues. These areas have high-impact security risks.

- **At Step 3:** Skip this step if the changes are purely cosmetic (renaming, formatting) or documentation-only. Performance assessment adds value only when the changes affect code execution paths.

- **At Step 4:** Choose the recommendation based on findings: approve (no blocking issues, suggestions only), request changes (at least one must-fix issue), or needs discussion (architectural concern that requires team input before the author can resolve).

## Failure Handling

- **Step 1 reveals the PR solves the wrong problem:** If the implementation does not match the ticket requirements, stop the detailed review. Leave a single comment explaining the mismatch and discuss with the author before reviewing the implementation details.

- **Step 2 reveals a critical vulnerability:** If the security review finds a critical issue (SQL injection, authentication bypass, exposed secrets), mark it as must-fix and notify the author immediately rather than waiting for the full review to complete. Critical security issues take precedence over thorough review.

- **Review feedback is disputed by the author:** If the author disagrees with feedback, engage in discussion rather than insisting. If agreement cannot be reached, involve a third team member for a tiebreaker. Document the decision for future reference.

- **Reviewer lacks context for the changes:** If the PR description is insufficient to understand the changes, request additional context from the author before proceeding. Reviewing code without understanding its purpose produces superficial or incorrect feedback.

- **Review cycle takes too long (over 3 rounds of changes):** If the PR requires extensive rework after multiple review rounds, the issue is likely that the change was not well-scoped or designed before implementation. Suggest the author close the current PR, align on the approach with the team, and submit a fresh PR.

## Expected Outcome

When this workflow is complete, the user will have:

1. A thorough code quality assessment covering correctness, readability, and team convention adherence
2. A security review identifying input validation gaps, authentication issues, and sensitive data handling concerns
3. A performance assessment flagging database query issues, algorithm complexity concerns, and resource usage risks
4. Structured, prioritized review feedback with specific line references and actionable suggestions for every finding
5. A clear recommendation (approve, request changes, or needs discussion) with rationale

## Output Format

```
CODE REVIEW REPORT
===================

PR: #[number] [title]
Author: [name]
Reviewer: [name]
Review Date: [date]

Summary:
  Must-fix: [count]
  Should-fix: [count]
  Suggestions: [count]
  Praise: [count]

[ ] Step 1: Code Quality
    Correctness issues: [count]
    Convention violations: [count]
    Readability concerns: [count]

[ ] Step 2: Security
    Vulnerabilities found: [count]
    Data handling issues: [count]
    Dependency risks: [count]

[ ] Step 3: Performance
    Query issues: [count]
    Complexity concerns: [count]
    Resource risks: [count]

[ ] Step 4: Feedback
    Recommendation: [approve/request-changes/needs-discussion]
    Blocking issues: [list]
    Non-blocking suggestions: [list]

Overall Status: [APPROVED / CHANGES REQUESTED / NEEDS DISCUSSION]
```

**Adaptation notes:**
- For small PRs (under 50 lines), combine Steps 1-3 into a single pass
- For security-critical code, invest more time in Step 2
- For database-heavy changes, invest more time in Step 3

## Edge Cases

- **Reviewer is unfamiliar with the technology:** Focus on logic and architecture in Step 1 rather than language-specific idioms. Ask the author to explain technology-specific patterns you do not recognize before providing feedback.
- **PR includes generated code:** Skip reviewing auto-generated files (migrations, type definitions, lock files) unless they show unexpected changes. Focus review time on hand-written code.
- **Urgent hotfix needs fast review:** Abbreviate to Step 1 only (correctness check). Approve if the fix is correct, even if code quality could be improved. Create a follow-up ticket for quality improvements.
- **PR touches test code only:** Focus Step 1 on test quality (clear assertions, proper setup/teardown, meaningful test names). Skip Steps 2-3 unless the tests interact with production data or services.
- **Multiple reviewers assigned:** Divide responsibilities: one reviewer focuses on Steps 1-2 (quality and security), another on Steps 3-4 (performance and documentation). Consolidate findings before submitting the combined review.

## Example

**Scenario:** "Review a pull request that adds a user search endpoint to a Node.js API. The PR changes 187 lines across 4 files: route handler, service layer, database query, and test file."

**Input:** PR #342: "Add user search endpoint with full-text search." Changes: new GET /v1/users/search endpoint with query parameter, service layer with Elasticsearch integration, database fallback for Elasticsearch downtime, 6 new tests. Team: TypeScript, Express, Elasticsearch, PostgreSQL.

**Output:** Structured review with 2 must-fix, 3 should-fix, 4 suggestions, and 2 praise items.

**Step 1 (code-review-patterns):** Correctness: search handler does not validate query parameter length (must-fix: empty string causes full-table scan, extremely long strings waste resources). Edge case: search with special characters (quotes, backslash) is not escaped before passing to Elasticsearch (must-fix: potential query injection). Readability: search service mixes Elasticsearch and PostgreSQL logic in the same method (should-fix: extract into separate strategies for clarity). Positive: fallback pattern from Elasticsearch to PostgreSQL is well-implemented with proper timeout handling.

**Step 2 (devsecops-engineer):** Input validation: query parameter is not sanitized for Elasticsearch special characters (already caught in Step 1, confirmed as security issue). Authentication: endpoint correctly requires authentication middleware. Data exposure: search results return full user objects including email addresses and internal IDs (should-fix: create a search-specific response schema that excludes sensitive fields). No new dependencies added.

**Step 3 (performance-profiling):** Database: PostgreSQL fallback query uses LIKE with leading wildcard (should-fix: leading wildcards prevent index usage, consider full-text search with tsvector for the fallback). No pagination on search results (suggestion: add LIMIT and offset/cursor to prevent returning thousands of results). Elasticsearch query uses match_all as fallback for empty query (suggestion: return empty results instead of all users when query is empty).

**Step 4 (technical-documentation):** Compiled 11 findings into structured review. Must-fix (2): input validation for query length and special characters. Should-fix (3): separate Elasticsearch/PostgreSQL strategies, reduce search response fields, add GIN index for PostgreSQL full-text fallback. Suggestions (4): add pagination, handle empty query gracefully, add search latency logging, document Elasticsearch configuration requirements. Praise (2): Elasticsearch-to-PostgreSQL fallback pattern, comprehensive test coverage for the happy path. Recommendation: request changes (must-fix items are blocking).

**Result:** Author addressed both must-fix items and 2 of 3 should-fix items in a follow-up commit. Created tickets for remaining should-fix (PostgreSQL index) and suggestions (pagination, logging). PR approved and merged on second review round.
