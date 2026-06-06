---
name: automate-business-workflows
description: >-
  Systematic workflow for identifying, designing, implementing, and monitoring
  business process automation. Covers auditing manual processes, selecting
  automation tools, building workflows with no-code and code-based solutions,
  and measuring the ROI of automation investments.

  Use when the user wants to automate business workflows or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  workflow-designer task-automator automation-architect requirements-analyst
  bot-builder monitoring-engineer estimation-guide agile-coach
trigger_phrases: >-
  I want to automate our business processes I need to reduce manual work How do
  I automate our workflows I want to eliminate manual repetitive tasks
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: automation step-by-step planning
  category: cross-domain
  depends: >-
    workflow-designer task-automator automation-architect requirements-analyst
    bot-builder monitoring-engineer estimation-guide agile-coach
  disclaimer: none
  difficulty: intermediate
---
# Automate Business Workflows

**Estimated time:** 3-6 weeks

Every organization has processes that someone does manually that a computer could do better: data entry between systems, approval routing, report generation, notification sending, and customer onboarding steps. This workflow provides a systematic approach to finding, prioritizing, and automating these processes. It covers both no-code tools (Zapier, Make, n8n) for simple workflows and custom code for complex ones.

The workflow emphasizes ROI discipline: not every manual process should be automated. Some are too infrequent, too variable, or too low-impact to justify the investment. By auditing first, estimating value, and starting with high-impact automations, you maximize the return on your automation investment while avoiding the trap of automating everything.

## When to Use

- User wants to automate business workflows
- User needs a structured, step-by-step process for automate business workflows
- User wants to automate our business processes
- I need to reduce manual work
- How do I automate our workflows
- Do NOT use when: the request is outside the scope of automate business workflows or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Access to the business processes and tools being used
- Cooperation from the people currently performing manual tasks
- Budget for automation tools (free tiers exist, paid plans $20-200/month)
- Authority to modify business processes
- API access or integration capabilities for connected systems

## Steps

**Step 1: Audit Manual Processes** (uses: requirements-analyst)

catalog all manual, repetitive processes. Interview team members to understand their daily, weekly, and monthly workflows. For each process, document: trigger (what starts it), steps (what happens), frequency (how often), duration (time per occurrence), error rate (how often mistakes happen), and systems involved (which tools are touched). Calculate the total time spent per month on each manual process. This audit is the foundation for prioritization.

- Input: Department or team to audit, Known pain points and time-consuming tasks, Tools and systems currently in use
- Output: Process catalog (every manual process with trigger, steps, frequency, duration), Time investment analysis (hours per month per process), Error rate and impact assessment
- Key focus: Use the Requirements Analyst skill to catalog all manual, repetitive processes

**Step 2: Prioritize and Estimate ROI** (uses: estimation-guide)

score each process for automation potential. Calculate ROI for each: (hours saved per month x hourly cost) - (automation build cost + maintenance cost). Score on four dimensions: time savings (hours reclaimed), error reduction (mistakes eliminated), complexity to automate (effort required), and business impact (value beyond time savings). Rank processes into tiers: quick wins (high value, low effort), strategic automations (high value, high effort), and nice-to-haves (low value). Select the top 3-5 processes for the first sprint.

- Input: Process catalog from Step 1, Automation complexity estimates, Team capacity for automation work
- Output: Automation priority matrix (value vs effort for each process), ROI calculation per process, Quick wins list (top 3-5 automations for first sprint)
- Key focus: Use the Estimation Guide skill to score each process for automation potential

**Step 3: Design Automation Workflows** (uses: workflow-designer)

design the automation flows. For each selected process, map the automated workflow: trigger event, each step with its inputs and outputs, decision points (branching logic), error handling, and human review points (where automation should pause for approval). Use the Automation Architect skill to select the right tool for each workflow: no-code (Zapier, Make) for simple integrations, n8n for complex flows with self-hosting needs, or custom code for complex logic. Always design with failure in mind: what happens when an API is down, data is malformed, or a step times out?

- Input: Top priority processes from Step 2, Available automation tools and APIs, Exception handling requirements
- Output: Workflow diagrams for each automation, Tool selection per workflow (with rationale), Error handling and retry strategy
- Key focus: Use the Workflow Designer skill to design the automation flows

**Step 4: Implement Quick Wins** (uses: task-automator)

build the quick-win automations first. Start with the highest-ROI, lowest-complexity workflows. For no-code tools, build the Zap/scenario/workflow following the design from Step 3. For custom code, write scripts with proper logging, error handling, and idempotency. Test each automation with real-world data in a sandbox or staging environment before activating. Document each automation: what it does, how to troubleshoot it, and who owns it.

- Input: Workflow designs from Step 3, Tool accounts and API credentials, Test data for validation
- Output: Implemented automations (3-5 quick wins), Test results with real-world data, Automation documentation (purpose, owner, troubleshooting)
- Key focus: Use the Task Automator skill to build the quick-win automations first

**Step 5: Build Complex Automations** (uses: bot-builder)

Use the Bot Builder skill for automations that involve chatbot-style interactions (Slack bots, approval workflows). Use the Workflow Designer skill for complex multi-step automations with conditional logic, parallel execution, and human-in-the-loop steps. Build with modularity: create reusable components (API connectors, data transformers, notification senders) that can be composed into different workflows. Implement proper state management for multi-step workflows that may take hours or days to complete.

- Input: Strategic automations from the roadmap, Lessons learned from quick wins, API integrations and custom logic requirements
- Output: Complex automations with multi-step workflows, Reusable automation components, Bot implementations (Slack/Teams/Discord)
- Key focus: Use the Bot Builder skill for automations that involve chatbot-style interactions (Slack bots, approval workflows)

**Step 6: Monitor and Measure Impact** (uses: monitoring-engineer)

set up automation monitoring: execution success/failure rates, processing times, error categorization, and volume metrics. Compare actual time savings against the ROI projections from Step 2. Use the Agile Coach skill to run a retrospective with the team: what worked, what did not, what should be automated next? Track the human experience: are people happier without the manual drudge work? Are they using the freed-up time for higher-value activities?

- Input: Running automations from Steps 4-5, Baseline metrics from Step 1 (pre-automation time spent), ROI projections from Step 2
- Output: Automation monitoring dashboard, ROI validation report (projected vs actual savings), Error rate and reliability metrics
- Key focus: Use the Monitoring Engineer skill to set up automation monitoring: execution success/failure rates, processing times, error categorization, and volume metrics

## Decision Points

- **After Step ?:** 
  - If **After Step 1**: Expand audit to more teams/departments
  - If **After Step 2**: Focus only on quick wins with clear payback
  - If **After Step 4**: Stabilize quick wins before adding complexity
  - If **After Step 6**: Review what went wrong and adjust approach

## Failure Handling

- **Automating broken processes:** -- If the manual process is bad, automating it just makes bad things happen faster. Fix the process before automating it.
- **No ROI calculation:** -- Automating a task done once a month for 5 minutes is not worth 2 days of development. Calculate ROI honestly.
- **Ignoring exceptions:** -- Manual processes have humans handling edge cases. Automation must explicitly handle or escalate exceptions.
- **No monitoring:** -- Silent automation failures are worse than manual processes because nobody knows the work is not getting done.
- **Single point of failure:** -- If one person built all the automations and they leave, nobody can maintain them. Document and cross-train.

## Expected Outcome

When this workflow is complete, the user will have:

1. At least 3 manual processes are fully automated with measured time savings
2. Automation error rate is below 5% across all workflows
3. Actual time savings match or exceed 70% of projected ROI
4. Team members report meaningful reduction in manual, repetitive work
5. Automations are documented with runbooks and ownership
6. Monitoring catches failures before they impact business operations

## Output Format

```
AUTOMATE BUSINESS WORKFLOWS TRACKER
===================================

[ ] Step 1: Audit Manual Processes
    Status: [pending/in-progress/complete]
[ ] Step 2: Prioritize and Estimate ROI
    Status: [pending/in-progress/complete]
[ ] Step 3: Design Automation Workflows
    Status: [pending/in-progress/complete]
[ ] Step 4: Implement Quick Wins
    Status: [pending/in-progress/complete]
[ ] Step 5: Build Complex Automations
    Status: [pending/in-progress/complete]
[ ] Step 6: Monitor and Measure Impact
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Automating broken processes:** -- If the manual process is bad, automating it just makes bad things happen faster. Fix the process before automating it.
- **No ROI calculation:** -- Automating a task done once a month for 5 minutes is not worth 2 days of development. Calculate ROI honestly.
- **Ignoring exceptions:** -- Manual processes have humans handling edge cases. Automation must explicitly handle or escalate exceptions.
- **No monitoring:** -- Silent automation failures are worse than manual processes because nobody knows the work is not getting done.

## Example

**Input:** "I want to automate business workflows and need a structured plan to follow step by step."

**Output:**

**Step 1 (requirements-analyst):** Audit Manual Processes -- produces concrete deliverables for this phase.

**Step 2 (estimation-guide):** Prioritize and Estimate ROI -- produces concrete deliverables for this phase.

**Step 3 (workflow-designer-automation-architect):** Design Automation Workflows -- produces concrete deliverables for this phase.

**Step 4 (task-automator-automation-architect):** Implement Quick Wins -- produces concrete deliverables for this phase.

**Step 5 (bot-builder-workflow-designer):** Build Complex Automations -- produces concrete deliverables for this phase.

**Step 6 (monitoring-engineer-agile-coach):** Monitor and Measure Impact -- produces concrete deliverables for this phase.

**Result:** User has a complete automate business workflows plan with all deliverables produced, validated, and ready for implementation.
