---
name: renovate-a-house
description: |
  Guides the user through a home renovation from budget planning through
  project completion, chaining renovation budgeting, financing, permit
  research, contractor evaluation, DIY assessment, project management,
  and finish selection skills across four categories.
  Use when the user wants to renovate a home, remodel rooms, or plan a
  major home improvement project.
  Do NOT use for minor repairs (use home-repair-first-response), routine
  maintenance (use annual-home-maintenance), or new home construction.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-maintenance planning checklist step-by-step"
  category: "cross-domain"
  depends: "renovation-budget loan-comparison contract-basics-explainer contractor-evaluation diy-vs-hire milestone-planning flooring-selection"
  disclaimer: "educational-finance"
  difficulty: "advanced"
---

# Renovate a House

This workflow spans: **home-household**, **personal-finance**, **legal-civic**, and **productivity** (4 categories).

This workflow references personal finance skills for educational purposes only. It is not financial advice. Consult a qualified financial advisor for major renovation financing decisions.

This workflow references legal literacy skills for contract and permit steps. It is not legal advice. Consult appropriate professionals for construction contracts and permit requirements in your jurisdiction.

**Estimated time:** 1-12 months (depending on renovation scope: cosmetic refresh 1-2 months, major remodel 6-12 months)

**Geographic variation note:** Steps 2, 3, and 4 vary significantly by jurisdiction. Building codes, permit requirements, contractor licensing, and home improvement financing options differ by state and municipality. Research your local requirements before beginning those steps.

**Cross-domain constraint note:** Decisions in one domain constrain options in others. Your financing decision (personal-finance) determines the renovation scope you can afford (home-household), which determines whether building permits (legal-civic) are required, which determines the project timeline (productivity). This workflow sequences steps to make these constraints explicit.

## When to Use

- User wants to renovate, remodel, or significantly upgrade their home
- User needs to coordinate budgeting, financing, contractors, permits, and project timelines
- User wants to understand the full scope of a renovation before committing money
- Do NOT use when: making minor repairs (single fix), performing routine maintenance, or building a new structure from scratch

## Prerequisites

Before starting this workflow, ensure:

1. Property ownership confirmed (renovations on rental properties require landlord approval and different considerations)
2. Renovation goals identified (which rooms, what changes, aesthetic vision)
3. Rough timeline expectations established (need it done before an event, seasonal constraints, no rush)
4. Awareness of whether the renovation is cosmetic (paint, fixtures, flooring) or structural (walls, plumbing, electrical)

## Steps

**Step 1: Create the Renovation Budget** (uses: renovation-budget)

Build a detailed renovation budget that accounts for materials, labor, permits, unexpected costs, and a contingency reserve. This step establishes the financial ceiling that governs every subsequent decision.

- Input: Renovation scope (rooms, changes desired), quality level (budget, mid-range, premium), DIY vs. professional preferences, comparable renovation costs in your area
- Output: Itemized budget by category (demolition, structural, electrical, plumbing, materials, labor, permits, fixtures, finishes), contingency reserve (15-20% for renovations), total project cost estimate
- Key focus: Renovation budgets must include a 15-20% contingency reserve (higher than the 10% standard for other projects) because unexpected issues (hidden water damage, outdated wiring, asbestos) are discovered in 60-70% of major renovations. Get material costs from actual suppliers, not online estimates. Labor costs vary significantly by region and season. The budget from this step determines whether financing (Step 2) is needed and constrains the project scope.

**Step 2: Evaluate Financing Options** (uses: loan-comparison)

Determine how to fund the renovation: cash, home equity loan, home equity line of credit (HELOC), personal loan, or credit card (for small projects only). The financing decision constrains renovation scope and timeline.

- Input: Total budget from Step 1, available cash, home equity, credit score, existing debts
- Output: Financing comparison matrix (interest rate, terms, fees, monthly payment, total cost), recommended financing approach, monthly payment impact on household budget, break-even analysis (does the renovation increase home value enough to justify the financing cost?)
- Key focus: Cash is cheapest but reduces liquidity. HELOCs offer flexibility but have variable rates. Home equity loans have fixed rates but require a full amount commitment. Personal loans are faster but more expensive. For renovations under $10,000, cash or 0% promotional credit cards may work. For renovations over $25,000, home equity products typically offer the best terms. Never finance a renovation that creates a monthly payment you cannot comfortably afford -- the renovation should improve your life, not create financial stress.

**Step 3: Research Permits and Code Requirements** (uses: contract-basics-explainer)

Understand the permit requirements, building codes, and legal obligations for your renovation scope. This step determines which work requires permits, how long the permit process takes, and what inspections are required, which directly affects the project timeline.

- Input: Renovation scope from Step 1, property location (city, county, state), work categories (structural, electrical, plumbing, exterior, additions)
- Output: Permit requirements list by work category, estimated permit costs and processing times, required inspections during and after construction, code requirements that affect design decisions, homeowner vs. licensed contractor permit rules
- Key focus: Not all renovations require permits. Generally: structural changes, electrical work, plumbing changes, additions, and exterior modifications require permits. Cosmetic work (paint, fixtures, flooring in most jurisdictions) does not. Pulling permits protects you: unpermitted work can cause insurance claim denials, sale complications, and code violation fines. The permit timeline (2 weeks to 3 months depending on jurisdiction) must be factored into the project schedule.

**Step 4: Evaluate and Select Contractors** (uses: contractor-evaluation)

Find, vet, and select contractors for the work that requires professional execution. This step is the highest-risk step in the renovation because contractor quality determines the outcome of every subsequent step.

- Input: Scope of work requiring professional execution (from Step 1 DIY assessment and Step 3 permit requirements), budget allocation for labor from Step 1, timeline requirements
- Output: Shortlisted contractors (3 minimum per trade), evaluation matrix (license verification, insurance, references, portfolio, communication quality), selected contractors with signed contracts, payment schedule aligned with project milestones
- Key focus: Verify license and insurance before any conversation about scope or price. Get 3 bids minimum for every trade. Check references -- call them, do not just read online reviews. Never pay more than 10-15% upfront. Structure payments around completed milestones, not calendar dates. Get the entire scope, timeline, and payment terms in writing before work begins. Understand the change order process -- this is where renovation budgets go over.

**Step 5: Assess DIY vs. Professional Execution** (uses: diy-vs-hire)

Determine which renovation tasks you can safely and effectively do yourself vs. which require professional contractors. This step optimizes the budget by identifying high-value DIY opportunities while protecting safety.

- Input: Full renovation scope, your skill level and available time, permit requirements from Step 3, contractor quotes from Step 4
- Output: DIY task list with time estimates, professional-only task list with rationale, hybrid tasks (prep DIY, finish professional), tool and material list for DIY work, safety considerations
- Key focus: Never DIY: electrical panel work, gas line work, structural load-bearing changes, or work requiring permits that mandate a licensed contractor. High-value DIY: demolition, painting, simple tiling, fixture installation, landscaping. The labor savings from DIY should be weighed against your time, skill level, and the cost of mistakes. A DIY tiling job that has to be redone by a professional costs more than hiring a professional the first time.

**Step 6: Manage the Project Timeline** (uses: milestone-planning)

Create and manage the renovation project schedule, coordinating contractor availability, material lead times, permit inspections, and the sequence of work phases. This step keeps the renovation on track and prevents costly scheduling conflicts.

- Input: Contractor schedules from Step 4, permit timelines from Step 3, material lead times, DIY task schedule from Step 5, dependencies between work phases
- Output: Project Gantt chart or milestone timeline showing: phase sequence (demo, rough-in, inspections, finishes, cleanup), critical path identification, weekly check-in schedule, material ordering deadlines, inspection scheduling triggers
- Key focus: Renovation phases have hard dependencies: demolition before rough-in, rough-in before inspection, inspection before closing walls, closing walls before finishes. Missing one dependency cascades delays through the entire project. Order materials with long lead times (custom cabinets: 6-8 weeks, specialty tile: 4-6 weeks, appliances: 2-8 weeks) early. Schedule inspections as soon as rough-in work is complete -- inspector availability creates bottlenecks. Hold weekly progress reviews against the timeline.

**Step 7: Select and Install Finishes** (uses: flooring-selection)

Choose and coordinate the finish materials (flooring, paint, fixtures, hardware, countertops) that determine the final look and feel of the renovated space. This step applies the design vision within the remaining budget.

- Input: Remaining budget after structural and labor costs, design vision and style preferences, durability requirements (high-traffic areas, moisture exposure, pets, children), timeline from Step 6
- Output: Finish material selections with specifications, color and material coordination plan, installation sequence aligned with project timeline, supplier orders with delivery dates, warranty documentation
- Key focus: Select finishes early (even if installation is late) because lead times can delay the project. Coordinate materials across rooms for visual cohesion. Prioritize durability in high-traffic and moisture areas (kitchen, bathroom, entryway). Get physical samples before committing -- colors look different in your space than in a showroom. Stay within the budget remaining after Steps 1-6 -- finish upgrades are the most common source of budget overruns.

## Decision Points

- **After Step 1:** If the renovation budget exceeds available funding plus comfortable financing, reduce scope. Common scope reductions: phase the renovation (kitchen this year, bathroom next year), choose mid-range instead of premium materials, or reduce the number of rooms being renovated.
- **After Step 2:** If financing costs (interest payments) exceed 15% of the renovation value added to the home, reconsider: is this renovation for personal enjoyment (where ROI matters less) or for resale value (where financing cost directly reduces returns)?
- **After Step 3:** If permit requirements add more than 30 days to the timeline, adjust the project schedule and inform all contractors. Do not start unpermitted work "to stay on schedule" -- the inspections will catch it and the rework cost is always higher than the delay cost.
- **After Step 4:** If all contractor bids exceed the budget allocation, three options: (a) expand the budget (return to Step 2), (b) increase DIY scope (return to Step 5), or (c) reduce renovation scope (return to Step 1). Do not select an unlicensed or uninsured contractor to save money.
- **After Step 5:** If DIY tasks exceed your available time by more than 50%, either hire out more work or extend the timeline. A renovation where you are the bottleneck (working evenings and weekends for months) leads to burnout and quality compromises.

## Failure Handling

- **Step 1 fails (hidden costs discovered during planning):** Common: discovering that the "simple kitchen refresh" requires electrical upgrades or plumbing relocation. Revise the budget with the new information. If the revised total exceeds affordability, return to scope reduction before proceeding.
- **Step 2 fails (financing denied or terms unacceptable):** If home equity is insufficient or credit score blocks favorable terms, options: save cash and delay the renovation, reduce scope to match available cash, or address credit issues first (similar to the buy-a-home Step 2 approach).
- **Step 3 fails (permit denied or requires design changes):** Work with the building department to understand what changes are needed. Common: structural changes that require engineering review, setback violations for additions, or changes that affect the building's fire rating. Modify the design to meet code requirements.
- **Step 4 fails (contractor does poor work or abandons the project):** Document everything with photos and written communications. If the contractor is licensed, file a complaint with the licensing board. If bonded, file a claim against the bond. Use the milestone payment structure to limit financial exposure -- this is why you never pay ahead of completed work.
- **Step 6 fails (project falls significantly behind schedule):** Identify the bottleneck: contractor availability, material delays, inspection scheduling, or scope creep. Address the specific bottleneck. If the delay is contractor-caused, the contract should address delay remedies. If material-caused, consider substitutions. If scope-creep caused, freeze changes and complete the current scope.
- **Step 7 fails (finish materials arrive damaged or wrong):** This is why you order early and inspect upon delivery. If materials are wrong: reject the delivery and reorder immediately. If damaged: document with photos and file a claim. Always have a backup option identified for critical-path materials.
- **Direction change (decides to sell instead of renovate):** If the decision happens before Step 4 (contractor contracts signed), costs are limited to planning time, any permits filed, and materials ordered. If after Step 4, review contract cancellation terms and complete only work that adds resale value.

## Output Format

```
RENOVATION PROJECT TRACKER
============================

Project: ________________
Scope: ________________
Categories Spanned: home-household + personal-finance + legal-civic + productivity

Budget Summary
  Total budget: $______
  Contingency (15-20%): $______
  Financing: ________________
  Spent to date: $______  Remaining: $______

Permits
  | Permit Type   | Status    | Cost  | Inspection Date |
  |---------------|-----------|-------|-----------------|
  |               |           | $     |                 |

Contractor Tracker
  | Trade         | Contractor    | Contract | Paid    | Balance |
  |---------------|---------------|----------|---------|---------|
  |               |               | [ ]      | $       | $       |

Timeline
  Phase 1 - Demo: ______ to ______
  Phase 2 - Rough-in: ______ to ______
  Phase 3 - Inspections: ______ to ______
  Phase 4 - Finishes: ______ to ______
  Phase 5 - Cleanup/Punch list: ______ to ______

DIY vs. Pro
  DIY tasks: ______  Estimated hours: ______
  Professional tasks: ______  Estimated cost: $______

Status: [PLANNING / PERMITTED / IN PROGRESS / FINISHING / COMPLETE]
```

## Edge Cases

- **Living in the home during renovation:** Plan for dust, noise, and loss of functional rooms. Set up a temporary kitchen if the kitchen is being renovated. Protect floors and HVAC systems from construction dust. If the renovation involves a sole bathroom, arrange temporary facilities. Consider temporary relocation for major structural work.
- **Historic home with preservation requirements:** Step 3 permit process may involve a historic review board with additional requirements (matching materials, approved colors, preservation of architectural features). Budget 2-3 times longer for the permit process.
- **Renovation for aging in place:** Step 5 (DIY vs. hire) shifts heavily toward professional for accessibility modifications (grab bars in structural supports, walk-in shower, wider doorways). Universal design principles apply to Step 7 finish selections (lever handles, non-slip flooring, contrast edges).
- **Insurance claim-funded renovation (post-disaster):** Step 2 (financing) is replaced by insurance claim management. The insurance adjuster's scope may differ from your desired scope. Document everything before any cleanup. Work with a public adjuster if the claim is complex or disputed.
- **Multi-phase renovation over several years:** Create a master plan in Step 1 covering all phases, but budget and permit only the current phase. Ensure each phase leaves the home in a livable state when complete. Design early phases to accommodate later ones (for example, run electrical to support a future kitchen remodel while walls are already open).

## Expected Outcome

When this workflow is complete, the user will have:

1. A detailed renovation budget with contingency reserve and clear financing plan
2. All required permits obtained and inspections passed
3. Vetted contractors with milestone-based contracts and documented agreements
4. An optimized DIY and professional task split that balances cost, quality, and time
5. A managed project timeline with weekly progress tracking
6. Coordinated finishes that deliver the design vision within budget
7. A renovated home that meets building code, is properly documented, and increases comfort and value

## Example

**Input:** Homeowner wanting to renovate a 1990s kitchen and master bathroom, budget target $45,000, home equity available, willing to DIY demolition and painting, timeline goal of 4 months.

**Output:**

**Step 1 (renovation-budget):**
Kitchen ($30,000): cabinets $8,000 (mid-range), countertops $4,500, appliances $5,000, flooring $2,500, electrical upgrade $3,000, plumbing $2,000, labor $5,000. Bathroom ($12,000): tile shower $4,000, vanity $1,500, fixtures $1,000, plumbing $2,500, labor $3,000. Contingency (15%): $6,300. Total: $48,300. Over target by $3,300 -- reduce cabinet quality to close the gap. Revised total: $45,000.

**Step 2 (loan-comparison):**
Options compared: HELOC at 7.5% variable ($45K available, interest-only payments during draw), home equity loan at 8.2% fixed ($45K, $550/month for 10 years), personal loan at 10.5% ($45K, $620/month for 8 years). Selected: HELOC for flexibility (draw as needed, pay down aggressively). Estimated total interest cost: $4,800 if paid off in 18 months. Home value increase estimated at $35,000-$40,000.

**Step 3 (contract-basics-explainer):**
Permit research: kitchen electrical upgrade requires electrical permit ($250). Bathroom plumbing changes require plumbing permit ($200). No structural permits needed (walls unchanged). Permit processing: 2 weeks. Inspections required: rough electrical, rough plumbing, final for both. Timeline impact: 3-4 weeks added for permit processing and inspections.

**Step 4 (contractor-evaluation):**
3 bids each for electrical, plumbing, tile, and countertop installation. Electrical: licensed electrician selected ($3,000, 3 references checked, insured). Plumber: selected ($4,500 for both kitchen and bathroom, includes fixture installation). Tile installer: selected ($3,500 for bathroom tile). Countertop fabricator: selected ($4,500 template-to-install). All contracts signed with milestone payments.

**Step 5 (diy-vs-hire):**
DIY: demolition of existing kitchen cabinets (8 hours), demolition of bathroom tile (6 hours), all painting (16 hours), cabinet hardware installation (2 hours), backsplash tile installation (8 hours -- homeowner has tiling experience). Professional: all electrical, plumbing, countertop templating and installation, bathroom shower tile. Estimated DIY savings: $4,500. Total DIY hours: 40.

**Step 6 (milestone-planning):**
Week 1-2: Demo (DIY). Week 3: Permits submitted. Week 4-5: Rough electrical and plumbing. Week 5: Rough inspections. Week 6: Close walls, install cabinets. Week 7: Countertop template and bathroom tile. Week 8-9: Countertop install, fixtures, flooring. Week 10: Painting (DIY), final inspections. Week 11: Punch list and cleanup. Total: 11 weeks (within 4-month target with buffer).

**Step 7 (flooring-selection):**
Kitchen: luxury vinyl plank ($4/sqft, waterproof, durable for high traffic). Bathroom: porcelain tile ($6/sqft, non-slip finish). Countertops: quartz ($55/sqft, white with grey veining). Cabinet hardware: brushed nickel pulls. Paint: kitchen in warm white, bathroom in light grey-blue. All materials ordered by Week 2 with staggered delivery dates matching the installation schedule.

**Result:** Kitchen and master bathroom renovation completed in 11 weeks, $43,200 total cost (under $45,000 budget with $1,800 remaining from contingency). All permits passed. DIY demolition and painting saved approximately $4,500. HELOC balance: $43,200 with payoff target of 15 months. Home value estimated to increase $35,000-$40,000 based on comparable sales.
