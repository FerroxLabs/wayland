---
name: digital-life-cleanup
description: >-
  Comprehensive digital decluttering workflow covering account auditing, privacy
  hardening, data backup, file organization, and automation setup for a secure,
  organized, and low-maintenance digital life.

  Use when the user wants to digital life cleanup or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "privacy-analyzer organization-coach cleaning-system habit-tracker"
trigger_phrases: >-
  I need to clean up my digital life help me organize my digital accounts
  digital declutter clean up my online presence organize my digital files secure
  my online accounts
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: security decluttering automation step-by-step planning
  category: life-event
  depends: "privacy-analyzer organization-coach cleaning-system habit-tracker"
---
# Digital Life Cleanup

**Estimated time:** 2-4 weeks

Your digital life has probably accumulated years of unused accounts, weak
passwords, scattered files, unmanaged subscriptions, and privacy vulnerabilities.
This workflow systematically cleans, secures, and organizes your digital
presence across five phases: account auditing, privacy hardening, data backup,
file organization, and automation.

The result is a digital life that is secure, organized, and largely
self-maintaining -- freeing you from the low-grade anxiety of digital disorder.

By the end of this workflow you will have: an audited and cleaned account
inventory, hardened privacy and security, comprehensive data backups,
organized files and photos, and automated systems that maintain order going
forward.

## When to Use

- User wants to digital life cleanup
- User needs a structured, step-by-step process for digital life cleanup
- I need to clean up my digital life
- User wants to organize my digital accounts
- digital declutter
- Do NOT use when: the request is outside the scope of digital life cleanup or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Access to your primary email accounts (this is the hub of your digital identity)
- A few hours spread across several days (not a single marathon session)
- Willingness to close unused accounts and unsubscribe aggressively
- A password manager (or willingness to adopt one -- this is non-negotiable)
- Basic comfort with technology settings and account management

## Steps

**Step 1: Audit Your Accounts** (uses: privacy-analyzer)

conduct a comprehensive audit of all online
accounts. Most people have 100-300+ online accounts.

- Input: primary email addresses, Known social media, financial, and shopping accounts, Current password management approach (memory, browser, sticky notes, manager)
- Output: Complete list of all discovered accounts by category, Accounts found in data breaches with action items, All paid subscriptions with monthly/annual costs
- Key focus: Account discovery: search email for "welcome," "verify," "account created" messages

**Step 2: Harden Your Privacy and Security** (uses: privacy-analyzer)

lock down your digital security. This is
the most important step -- one breach can cascade into identity theft,
financial loss, and months of recovery.

- Input: `account-inventory` from Step 1 (accounts to secure), `breach-report` from Step 1 (compromised credentials to change), Current password management approach
- Output: Password manager, 2FA, and recovery options configured, Platform-by-platform privacy settings applied, All devices secured with current standards
- Key focus: Password manager adoption: set up and populate with all accounts

**Step 3: Back Up Everything Important** (uses: organization-coach)

implement a comprehensive backup strategy.
Data loss is permanent. Hardware fails, phones break, and accounts get hacked.
Follow the 3-2-1 rule: 3 copies, 2 different media types, 1 offsite.

- Input: Device inventory (computers, phones, tablets), Current backup situation (none, partial, cloud-only, local-only), Important data categories: photos, documents, financial records, creative work
- Output: 3-2-1 backup strategy with all data categories covered, Automatic and manual backup frequencies, Map of where important data lives across devices and cloud
- Key focus: Data inventory: identify all important data across all devices

**Step 4: Organize Your Digital Files** (uses: cleaning-system)

organize digital files and photos into a
system that is easy to maintain.

- Input: `data-inventory` from Step 3 (where files live), Current file organization (or lack thereof), Cloud storage services and their current state
- Output: Folder structure and naming convention documentation, Rules for where new files go (prevent future clutter), What was deleted, moved, or consolidated
- Key focus: File naming convention: establish a consistent naming system

**Step 5: Automate Ongoing Maintenance** (uses: habit-tracker)

set up automation and habits that maintain
digital order without constant manual effort.

- Input: `security-setup` from Step 2 (systems to maintain), `backup-schedule` from Step 3 (backups to verify), `file-system` from Step 4 (organization to maintain)
- Output: All automated systems configured with verification schedule, Quarterly and annual maintenance tasks, Daily and weekly micro-habits for ongoing digital hygiene
- Key focus: Automated backups: verify they run on schedule (monthly check)

## Decision Points

- **After Step 1:** How urgent is your security situation?
  - If **Breached accounts found**: Prioritize changing passwords on breached accounts immediately. Then proceed with full security hardening.
  - If **No breaches, but weak security**: Standard security hardening. Password manager first, then 2FA, then privacy.
  - If **Already using password manager and 2FA**: Review and strengthen existing setup. Focus on privacy settings and closing old accounts.
- **After Step 3:** How much digital organization do you need?
  - If **Complete chaos (files everywhere)**: Full organization overhaul. Budget a full weekend for this step.
  - If **Somewhat organized (could be better)**: Focus on consolidation and naming conventions. Less time required.
  - If **Mostly organized (just need maintenance)**: Skip reorganization. Focus on automation and maintenance habits.

## Failure Handling

- **Skipping the password manager:** This is the single most important security tool. Every other improvement depends on it. Adopt one before anything else.
- **Not enabling 2FA:** Passwords alone are not enough. Two-factor authentication on email and banking is mandatory.
- **Single point of backup failure:** One backup is not enough. The 3-2-1 rule exists because hardware fails and accounts get compromised.
- **Perfect organization syndrome:** A simple filing system you maintain beats a complex one you abandon. Keep it simple.
- **Overlooking old email addresses:** Accounts tied to old email addresses are security vulnerabilities. Find them and close them.

## Expected Outcome

When this workflow is complete, the user will have:

1. All accounts are inventoried and categorized
2. Every account has a unique, strong password managed by a password manager
3. Two-factor authentication is enabled on all critical accounts
4. Unused accounts are closed and subscriptions are cancelled
5. All important data is backed up following the 3-2-1 rule
6. Digital files are organized with a consistent, maintainable system
7. Automated maintenance keeps the system clean without manual effort
8. The user feels in control of their digital life rather than overwhelmed by it

## Output Format

```
DIGITAL LIFE CLEANUP TRACKER
============================

[ ] Step 1: Audit Your Accounts
    Status: [pending/in-progress/complete]
[ ] Step 2: Harden Your Privacy and Security
    Status: [pending/in-progress/complete]
[ ] Step 3: Back Up Everything Important
    Status: [pending/in-progress/complete]
[ ] Step 4: Organize Your Digital Files
    Status: [pending/in-progress/complete]
[ ] Step 5: Automate Ongoing Maintenance
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Skipping the password manager:** This is the single most important security tool. Every other improvement depends on it. Adopt one before anything else.
- **Not enabling 2FA:** Passwords alone are not enough. Two-factor authentication on email and banking is mandatory.
- **Single point of backup failure:** One backup is not enough. The 3-2-1 rule exists because hardware fails and accounts get compromised.
- **Perfect organization syndrome:** A simple filing system you maintain beats a complex one you abandon. Keep it simple.

## Example

**Input:** "I want to digital life cleanup and need a structured plan to follow step by step."

**Output:**

**Step 1 (privacy-analyzer):** Audit Your Accounts -- produces concrete deliverables for this phase.

**Step 2 (privacy-analyzer):** Harden Your Privacy and Security -- produces concrete deliverables for this phase.

**Step 3 (organization-coach):** Back Up Everything Important -- produces concrete deliverables for this phase.

**Step 4 (cleaning-system):** Organize Your Digital Files -- produces concrete deliverables for this phase.

**Step 5 (habit-tracker):** Automate Ongoing Maintenance -- produces concrete deliverables for this phase.

**Result:** User has a complete digital life cleanup plan with all deliverables produced, validated, and ready for implementation.
