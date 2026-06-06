---
name: risk-assessment
description: |
  Produces a project risk register by identifying risks from the project description, scoring each by likelihood and impact, assigning mitigation strategies, and setting monitoring triggers. Builds a complete risk management artifact for personal or small-team projects.
  Use when the user asks about identifying project risks, building a risk register, assessing what could go wrong, or creating mitigation plans for a project.
  Do NOT use for business strategic risk analysis (use business strategy skills), financial risk assessment (use personal-finance skills), or decision-making between options (use premortem-analysis or weighted-decision-matrix).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "project-management analysis planning"
  category: "productivity"
  subcategory: "project-management"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Risk Assessment

## When to Use

**Use this skill when:**
- User is planning a project and wants to identify what could go wrong
- User asks about building a risk register or risk management plan
- User wants to assess and prioritize project risks
- User needs mitigation strategies for identified risks
- User wants to set up early warning triggers for project risks

**Do NOT use when:**
- User needs business or organizational strategic risk analysis (use business strategy skills)
- User wants financial or investment risk assessment (use personal-finance skills)
- User is making a decision and wants to imagine failure scenarios (use `premortem-analysis`)
- User wants to compare options with a scoring matrix (use `weighted-decision-matrix`)
- User needs a full project kickoff document (use `project-kickoff` which includes a basic risk section)

## Process

1. **Gather project context for risk identification.** Ask for:
   - Project description and key deliverables
   - Timeline and key milestones
   - Resources available (people, tools, budget)
   - Technology or methods being used (especially unfamiliar ones)
   - External dependencies (vendors, approvals, other people's timelines)
   - User's past project experience (what has gone wrong before)

2. **Identify risks systematically.** Use five risk categories:
   - **Scope risks:** Requirements unclear, scope creep, changing goals
   - **Schedule risks:** Underestimated tasks, dependencies delayed, insufficient time
   - **Resource risks:** Skills gaps, tool availability, budget shortfalls, competing priorities
   - **Technical risks:** Unfamiliar technology, integration issues, quality problems
   - **External risks:** Dependencies on others, market changes, regulatory requirements
   - Generate at least 2 risks per category, then filter to the most relevant

3. **Score each risk.** Use a 3x3 matrix:
   - **Likelihood:** Low (under 25% chance), Medium (25-60%), High (over 60%)
   - **Impact:** Low (minor delay or inconvenience), Medium (significant delay or rework), High (project failure or major scope cut)
   - **Risk score:** Likelihood x Impact gives priority:
     - High x High = Critical (address immediately)
     - High x Medium or Medium x High = High (plan mitigation now)
     - Medium x Medium = Medium (monitor actively)
     - Low x anything or anything x Low = Low (accept and monitor)

4. **Assign mitigation strategies.** For each risk above Low:
   - **Avoid:** Change the plan to eliminate the risk entirely
   - **Mitigate:** Take action to reduce likelihood or impact
   - **Transfer:** Shift the risk to someone else (outsource, insure)
   - **Accept:** Acknowledge the risk and prepare a contingency response
   - Each strategy must include a specific action, not just a category label

5. **Set monitoring triggers.** For each risk:
   - Define a leading indicator that signals the risk is materializing
   - Set a checkpoint date to review the risk status
   - Define the contingency action if the trigger fires

6. **Produce the complete risk register.**

## Output Format

```
## Risk Register: [Project Name]

### Project Context
- **Project:** [name and description]
- **Timeline:** [start to end]
- **Key dependencies:** [external factors]
- **Risk assessment date:** [date]

### Risk Scoring Matrix
|              | Low Impact | Medium Impact | High Impact |
|-------------|-----------|--------------|------------|
| High Likelihood | Medium | High | Critical |
| Medium Likelihood | Low | Medium | High |
| Low Likelihood | Low | Low | Medium |

### Risk Register
| # | Risk | Category | Likelihood | Impact | Score | Mitigation Strategy | Trigger | Checkpoint |
|---|------|----------|-----------|--------|-------|-------------------|---------|-----------|
| R1 | [risk description] | [category] | [L/M/H] | [L/M/H] | [score] | [specific action] | [early warning sign] | [review date] |
| R2 | [risk description] | [category] | [L/M/H] | [L/M/H] | [score] | [specific action] | [early warning sign] | [review date] |

### Risk Heat Map
- **Critical (act now):** [R#, R#]
- **High (plan mitigation):** [R#, R#]
- **Medium (monitor):** [R#, R#]
- **Low (accept):** [R#, R#]

### Contingency Plans (for Critical and High risks)
**R[#]: [risk name]**
- **If trigger fires:** [specific contingency action]
- **Decision point:** [when to escalate or change course]
- **Fallback plan:** [what to do if mitigation fails entirely]

### Risk Review Schedule
| Review Date | Focus | Action |
|------------|-------|--------|
| [date] | All Critical and High risks | Re-score, check triggers |
| [date] | Full register review | Add new risks, close resolved ones |
| [date] | Pre-milestone risk check | Review risks relevant to next milestone |

### Risk Summary
- **Total risks identified:** [n]
- **Critical:** [n] | **High:** [n] | **Medium:** [n] | **Low:** [n]
- **Top risk:** [highest scored risk and why it matters most]
- **Biggest uncertainty:** [area where more information would change risk scores]
```

## Rules

1. Never output risk management advice without producing the complete risk register with scores and mitigations
2. Use exactly five risk categories (scope, schedule, resource, technical, external) to ensure comprehensive coverage
3. Every risk must be scored on both likelihood and impact using the 3x3 matrix
4. Critical and High risks must have specific mitigation strategies with concrete actions
5. Every risk above Low must have a monitoring trigger (an observable early warning sign)
6. Include at least 6 risks in the register (minimum 2 per category that are relevant)
7. Mitigation strategies must be specific actions, not generic labels like "mitigate the risk"
8. Include contingency plans for all Critical and High risks -- the plan B if mitigation fails
9. Set a risk review schedule with specific dates tied to project milestones
10. The risk summary must identify the single highest-risk item and the biggest uncertainty

## Edge Cases

- **User has a very simple project with few risks:** Scale down to 4-5 risks minimum. Focus on schedule and scope risks, which apply to every project. Acknowledge the low-risk nature but note that even simple projects benefit from identifying the top 3 things that could go wrong.

- **User identifies only technical risks (tunnel vision):** Prompt for non-technical risks: "What if your available time is cut in half? What if the requirements change? What if a key person becomes unavailable?" Ensure all five categories are represented.

- **User wants to assess risks for a decision, not a project:** Redirect to `premortem-analysis` which is designed for decision-level risk assessment. Risk registers are project-management tools for ongoing risk tracking.

- **All risks score as Critical:** Re-calibrate the scoring by asking: "If all of these happened, which one would cause the most damage?" Force-rank the critical risks. Also reconsider whether the user is being overly pessimistic on likelihood estimates.

- **User's project depends heavily on one external factor:** Elevate that dependency to a standalone risk with enhanced monitoring: weekly trigger checks instead of milestone-based. Build the contingency plan around the dependency failing entirely.

## Example

**Input:** "I'm renovating my home office. The project involves removing a wall, adding built-in shelving, new flooring, and setting up better lighting. I'm hiring a contractor but doing some work myself. Budget is $8,000 and I want it done in 4 weeks."

**Output:**

## Risk Register: Home Office Renovation

### Project Context
- **Project:** Home office renovation -- wall removal, built-in shelving, new flooring, lighting upgrade
- **Timeline:** 4 weeks
- **Key dependencies:** Contractor availability, material delivery, permits (if needed for wall removal)
- **Risk assessment date:** [today]

### Risk Register
| # | Risk | Category | Likelihood | Impact | Score | Mitigation Strategy | Trigger | Checkpoint |
|---|------|----------|-----------|--------|-------|-------------------|---------|-----------|
| R1 | Wall removal reveals wiring or plumbing requiring rerouting | Technical | Medium | High | High | Get contractor to inspect wall before demolition day; budget $500 contingency for rerouting | Contractor finds utilities during pre-inspection | Week 0 (before work starts) |
| R2 | Material delivery delayed (shelving, flooring) | External | Medium | Medium | Medium | Order all materials in week 0, 2 weeks before installation; have backup supplier identified | Materials not confirmed shipped by day 3 | Week 1 |
| R3 | Budget overrun from unexpected issues | Resource | High | Medium | High | Set $1,000 contingency (12.5% of budget); get fixed-price quotes not estimates; approve change orders over $200 only | Actual spend exceeds 60% of budget before 50% of work is done | Week 2 |
| R4 | Contractor schedule slips (other jobs, delays) | Schedule | Medium | High | High | Get written commitment with start/end dates and daily schedule; agree on penalty for delays beyond 1 week | Contractor misses first scheduled day | Week 1, Day 1 |
| R5 | DIY portions take longer than expected | Schedule | High | Low | Medium | Budget 1.5x time for DIY tasks; identify which DIY tasks can be handed to contractor if behind | DIY work falls more than 2 days behind plan | Week 2 |
| R6 | Permit required for wall removal (not anticipated) | External | Low | High | Medium | Call building department before starting; determine if permit is needed for load-bearing vs. non-load-bearing wall | Building department confirms permit needed | Week 0 |
| R7 | Scope creep from discovering other issues (old wiring, subfloor damage) | Scope | Medium | Medium | Medium | Define scope boundary: only renovation items in original plan; defer discoveries to future projects unless they block current work | New issue found during demolition that was not in original scope | Week 1 |

### Risk Heat Map
- **Critical (act now):** None
- **High (plan mitigation):** R1 (hidden utilities), R3 (budget overrun), R4 (contractor schedule)
- **Medium (monitor):** R2 (material delivery), R5 (DIY timing), R6 (permits), R7 (scope creep)
- **Low (accept):** None

### Contingency Plans
**R1: Hidden utilities in wall**
- **If trigger fires:** Contractor handles rerouting; add up to $500 from contingency budget; delay shelving install by 2-3 days
- **Decision point:** If rerouting cost exceeds $1,000, re-evaluate whether wall removal is worth it
- **Fallback plan:** Keep wall, add a large pass-through opening instead of full removal

**R3: Budget overrun**
- **If trigger fires:** Pause non-critical work, review remaining scope, identify items to defer
- **Decision point:** At $7,000 spent, stop all work except committed contracts and assess
- **Fallback plan:** Defer lighting upgrade to a future project (saves ~$1,500)

**R4: Contractor schedule slips**
- **If trigger fires:** Contact contractor immediately for revised schedule; if more than 3 days late, begin sourcing backup contractor
- **Decision point:** If contractor is 1 week late with no clear end date, terminate and find replacement
- **Fallback plan:** Hire a different contractor; accept 2-week project extension

### Risk Review Schedule
| Review Date | Focus | Action |
|------------|-------|--------|
| Week 0 (before start) | R1, R6 -- pre-inspection and permits | Confirm wall is safe, confirm no permit needed |
| Week 1 end | R2, R4, R7 -- materials and contractor | Verify materials arrived, contractor on schedule |
| Week 2 end | R3, R5 -- budget and DIY progress | Check spend against budget, assess DIY timeline |
| Week 4 (project end) | Full register close-out | Document actual vs. estimated for future projects |

### Risk Summary
- **Total risks identified:** 7
- **Critical:** 0 | **High:** 3 | **Medium:** 4 | **Low:** 0
- **Top risk:** R4 (contractor schedule) -- contractor delays are the most common cause of home renovation overruns and the hardest to recover from
- **Biggest uncertainty:** R1 (hidden utilities) -- cannot be fully assessed until demolition begins; pre-inspection reduces but does not eliminate this risk
