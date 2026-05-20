---
name: internal-wiki-page
description: |
  Creates internal documentation pages with context, process descriptions,
  decision rationale, ownership, and cross-references for team wikis and
  knowledge management systems. Use when the user needs to write internal docs,
  team documentation, or wiki pages for onboarding and knowledge sharing. Do NOT
  use for external user guides (use `user-guide`), KB articles (use
  `knowledge-base-article`), or SOPs (use `sop-writing`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation guide"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Internal Wiki Page Writing

## When to Use

- User needs to write internal documentation for a team wiki or knowledge base
- User asks for help creating onboarding docs, process documentation, or team reference pages
- User wants to document institutional knowledge that currently exists only in people's heads
- User needs to create a wiki page explaining how something works, why it was built that way, or how to operate it
- Do NOT use when the user wants customer-facing documentation (use `user-guide` instead)
- Do NOT use when the user wants a support troubleshooting article (use `knowledge-base-article` instead)
- Do NOT use when the user wants a formal standard operating procedure (use `sop-writing` instead)
- Do NOT use when the user wants to record an architectural decision (use `adr-writing` instead)

## Process

1. **Collect page context.** Ask the user for:
   - Topic the wiki page covers
   - Target audience within the organization (new hires, all engineers, specific team, cross-functional)
   - What the reader needs to know or be able to do after reading this page
   - Current state of this knowledge (undocumented, outdated docs exist, tribal knowledge)
   - Related pages or systems that this page connects to
   - Who owns this page and how often it should be reviewed

2. **Determine the page type and structure.** Internal wiki pages serve different purposes:
   - **System overview:** How a system works, its components, and its boundaries
   - **Process guide:** How to perform a recurring team process step by step
   - **Reference page:** Lookup information (environment URLs, credentials locations, service ownership)
   - **Onboarding guide:** What a new team member needs to know in their first week
   - **Decision log:** Why things are the way they are (references ADRs, historical context)
   - Choose the type and apply its structure from the Output Format section

3. **Write for the reader who joins next month.** Every wiki page must:
   - Explain WHY, not just WHAT -- include the reasoning behind processes and configurations
   - Define acronyms and team-specific terminology on first use
   - Link to related pages rather than duplicating their content
   - Include concrete examples for abstract concepts
   - State what is current and flag what is aspirational or planned

4. **Add operational metadata.** Every wiki page needs:
   - **Owner:** The person or team responsible for keeping this page accurate
   - **Last reviewed:** Date of the most recent accuracy check
   - **Review frequency:** How often this page should be verified (quarterly, after each release, etc.)
   - **Status:** Current, Needs Update, Deprecated, Draft
   - **Related pages:** Links to connected documentation

5. **Structure for scanning.** Internal readers rarely read wiki pages end to end:
   - Lead with a one-paragraph summary (TL;DR) that states the key takeaway
   - Use descriptive headings that answer the question the reader has ("How to deploy to staging" not "Deployment")
   - Use bullet lists and tables for reference information
   - Bold key terms and important values
   - Keep paragraphs under 4 lines

6. **Include the "why" for every process or configuration.** Readers need context to:
   - Follow processes correctly when edge cases arise (they will adapt based on understanding)
   - Know when the process needs updating (if the "why" no longer applies, the process may be outdated)
   - Onboard faster (understanding reasons is more memorable than memorizing steps)

## Output Format

### System Overview Page

```
# [System Name]

**Owner:** [Team or person]
**Last reviewed:** [YYYY-MM-DD]
**Status:** Current | Needs Update | Deprecated

## Summary

[1-2 paragraph overview: what this system does, who uses it, and why it exists.
State the key thing the reader needs to know upfront.]

## Architecture

[Description of components, how they interact, data flow between them.
Name each component, its responsibility, and its dependencies.]

### Components

| Component | Responsibility | Depends On | Owned By |
|-----------|---------------|-----------|----------|
| [Name] | [What it does] | [Dependencies] | [Team] |
| [Name] | [What it does] | [Dependencies] | [Team] |

## How It Works

### [Key Flow 1]

[Step-by-step description of the most important flow through the system.
Include what triggers it, what happens at each stage, and what the output is.]

### [Key Flow 2]

[Second most important flow.]

## Configuration

| Setting | Value | Where | Why |
|---------|-------|-------|-----|
| [Setting] | [Current value] | [File or service] | [Reason for this value] |

## Runbooks

- [How to restart the service](link)
- [How to investigate alerts](link)
- [How to deploy a hotfix](link)

## History and Context

[Why this system exists, what it replaced, and key decisions that shaped it.
Link to relevant ADRs.]

## Related Pages

- [Related page 1] -- [relationship description]
- [Related page 2] -- [relationship description]
```

### Process Guide Page

```
# How to [Process Name]

**Owner:** [Team or person]
**Last reviewed:** [YYYY-MM-DD]
**Status:** Current

## Summary

[1-2 sentences: what this process accomplishes and when to use it.]

## When to Use This Process

- [Trigger condition 1]
- [Trigger condition 2]
- Do NOT use this process when: [condition] (use [other process] instead)

## Prerequisites

- [What must be true before starting]
- [Access or permissions needed]
- [Tools or systems required]

## Steps

1. **[Step title].** [Action and details]
   - Why: [Reason this step exists]
   - Expected result: [What you should see]

2. **[Step title].** [Action and details]
   - If [condition]: [alternative action]
   - Why: [Reason]

3. **[Step title].** [Action and details]

## After Completing This Process

- [What to do next or who to notify]
- [Where to record the outcome]
- [When to repeat this process]

## FAQ

**Q: [Common question about this process]**
A: [Answer with specific guidance]

**Q: [Another common question]**
A: [Answer]

## Related Pages

- [Related page] -- [relationship]
```

## Rules

1. NEVER write a wiki page without an owner and a "Last reviewed" date -- unowned pages become outdated and misleading
2. NEVER duplicate content from another wiki page -- link to it instead and state what the reader will find there
3. NEVER write a process step without explaining WHY that step exists
4. NEVER use team jargon or acronyms without defining them on first use
5. ALWAYS start with a Summary section that states the key takeaway in 1-2 paragraphs
6. ALWAYS include a Status field (Current, Needs Update, Deprecated, Draft) so readers know the page's reliability
7. ALWAYS include Related Pages linking to connected documentation
8. Use descriptive headings that answer the reader's question, not generic labels
9. Configuration values must include a "Why" column explaining the reasoning behind the current setting
10. Flag planned or aspirational content explicitly: "PLANNED: [description]" -- do not mix it with current state

## Edge Cases

- **Documenting a system no one fully understands:** Mark the page as "Draft -- Partially Documented" and list known unknowns explicitly: "The retry logic in the payment service is not fully documented. Contact [person] for details." Incomplete documentation with clear gaps is better than nothing.
- **Page for a deprecated system:** Set status to "Deprecated." Add a banner at the top: "This system is deprecated. [Replacement system] should be used for new work. This page is maintained for historical reference and to support the remaining migration." Link to the replacement page.
- **Onboarding guide that changes frequently:** Structure as a checklist with links rather than inline content. When linked pages update, the onboarding guide stays current without editing. Add a "Last verified by a new hire" date based on when someone last followed the guide end to end.
- **Cross-team process (multiple owners):** List each team's responsibilities in a RACI table (Responsible, Accountable, Consulted, Informed). Each team section has its own owner for that content. The page-level owner is responsible for the overall structure and cross-references.
- **Sensitive information (credentials, internal URLs):** Do not put credentials in wiki pages. Reference the secrets manager or vault and provide the path/key name. For internal URLs, note the VPN or access requirements.
- **Long page that covers many topics:** Split into a hub page with brief summaries and links to child pages. The hub page is the landing page; child pages have the detail. Keep the hub page under 2 screens of scrolling.

## Example

**Input:** "Write an internal wiki page documenting our deployment process for the main web application. We use GitHub Actions, deploy to AWS ECS, and use feature flags for rollout. The process involves staging, canary, and production stages."

**Output:**

# Deployment Process: Web Application

**Owner:** Platform Team
**Last reviewed:** 2024-06-15
**Status:** Current
**Review frequency:** After each deployment pipeline change

## Summary

The web application deploys through three stages: staging, canary (5% of production traffic), and full production. Deployments are automated via GitHub Actions and use feature flags for gradual rollout. A deployment from merge to full production takes approximately 45 minutes with automated checks at each stage.

## When to Deploy

- After merging a PR to the `main` branch (triggers automatically)
- Manual deployment: for hotfixes, use the "Deploy to Production" workflow dispatch in GitHub Actions
- Do NOT deploy during a declared incident (check the #incidents Slack channel first)
- Do NOT deploy on Fridays after 3 PM unless it is a critical hotfix (agreed in team retro 2024-03)

## Prerequisites

- PR merged to `main` branch
- All CI checks passing (tests, linting, security scan)
- Feature flags configured in LaunchDarkly for any new features
- Access to the #deployments Slack channel for notifications

## Deployment Stages

### 1. Staging (automatic)

**Trigger:** PR merged to `main`
**Duration:** ~10 minutes

GitHub Actions builds the Docker image, pushes to ECR, and deploys to the staging ECS cluster. Automated smoke tests run against the staging environment.

- Why staging first: catches configuration issues and integration failures before any production traffic is affected.
- Expected result: Green check on the "Deploy to Staging" GitHub Actions workflow. Staging URL: `staging.internal.example.com`
- If staging fails: The pipeline stops. Check the GitHub Actions log. Fix the issue and merge a new commit.

### 2. Canary (automatic after staging passes)

**Trigger:** Staging smoke tests pass
**Duration:** ~15 minutes

The pipeline deploys to the canary ECS task (receives 5% of production traffic). Automated monitoring checks error rates and latency for 10 minutes.

- Why canary: detects performance regressions and errors that only appear under real traffic patterns.
- Expected result: Error rate stays below 0.5% and p99 latency stays below 500ms during the 10-minute window.
- If canary fails: Automatic rollback to the previous version. Alert posted to #deployments. Investigate using the Datadog dashboard: `Dashboards > Web App > Canary Comparison`.

### 3. Production (automatic after canary passes)

**Trigger:** Canary monitoring passes
**Duration:** ~20 minutes (rolling update)

Full rolling deployment across all production ECS tasks. Each task drains connections before stopping, and the new task must pass health checks before receiving traffic.

- Expected result: All ECS tasks running the new version. Deployment complete notification in #deployments.
- If production issues appear post-deploy: Run the rollback workflow (`Actions > Rollback Production`). This reverts to the previous Docker image tag within 5 minutes.

## Rollback

| Method | When to Use | Time to Complete |
|--------|-------------|-----------------|
| Automatic (canary) | Error rate or latency exceeds thresholds during canary | Immediate (automated) |
| Manual workflow | Issues discovered after full production deploy | ~5 minutes |
| Feature flag | New feature causing issues, rest of deploy is fine | Immediate (toggle in LaunchDarkly) |

## Configuration

| Setting | Value | Where | Why |
|---------|-------|-------|-----|
| Canary traffic percentage | 5% | ALB target group weight | Low enough to limit blast radius, high enough to detect errors in 10 minutes |
| Canary monitoring window | 10 minutes | GitHub Actions workflow | Based on traffic volume: 10 minutes at 5% gives ~3,000 requests for statistical significance |
| Error rate threshold | 0.5% | Datadog monitor | Baseline error rate is 0.1%; 0.5% triggers rollback |
| Rolling update batch size | 25% | ECS service config | Balances deployment speed with availability during update |

## FAQ

**Q: Can I deploy a hotfix outside the normal pipeline?**
A: Yes. Use the "Deploy to Production" workflow dispatch in GitHub Actions. Select the branch or commit SHA. This skips staging but still runs canary.

**Q: How do I know if my deploy caused an issue?**
A: Check the Datadog dashboard `Web App > Deploy Comparison`. It shows before/after metrics aligned to the deploy timestamp.

**Q: What if I need to deploy a database migration?**
A: Database migrations run as a separate ECS task before the application deploy. See the Database Migration wiki page for the process.

## Related Pages

- Feature Flag Management -- how to create and manage flags in LaunchDarkly
- Database Migration Process -- deploying schema changes
- Incident Response Playbook -- what to do if a deployment causes an incident
- AWS ECS Service Configuration -- infrastructure details for the deployment target
