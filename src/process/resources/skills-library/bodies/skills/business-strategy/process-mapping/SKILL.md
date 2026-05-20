---
name: process-mapping
description: |
  Produces a SIPOC process map with suppliers, inputs, process steps,
  outputs, and customers for a defined business process. Use when the
  user asks to map a business process, create a SIPOC diagram, document
  a workflow from start to finish, visualize a process flow, or identify
  process inputs and outputs for improvement.
  Do NOT use for writing step-by-step SOPs (use sop-creation), risk
  analysis of a process (use risk-assessment or failure-mode-analysis),
  or customer journey mapping (use customer-journey-map).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "planning analysis template strategy"
  category: "business-strategy"
  subcategory: "operations"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Process Mapping

## When to Use

- User asks to map a business process or create a process flow
- User wants to build a SIPOC diagram for a workflow
- User needs to document a process from start to finish with inputs and outputs
- User asks to visualize a process for improvement, training, or standardization
- User wants to identify suppliers, inputs, outputs, and customers for a process
- Do NOT use when: user needs a detailed step-by-step SOP (use `sop-creation`), a risk analysis of a process (use `risk-assessment`), or a customer-facing journey map (use `customer-journey-map`)

## Process

1. **Collect process context.** Before producing the map, gather:
   - Process name and purpose
   - Process owner (role responsible for the process)
   - Start trigger (what initiates the process)
   - End state (what constitutes process completion)
   - Departments or roles involved
   - Known pain points or bottlenecks
   - Whether the map is for documentation, improvement, or training

2. **Identify Suppliers.** List every entity that provides inputs to the process:
   - Internal departments (who provides work, data, or approvals)
   - External parties (vendors, customers, partners)
   - Systems or tools that feed data into the process
   - For each supplier: what they provide and when

3. **Define Inputs.** List everything the process needs to start and continue:
   - Information or data required (forms, requests, specifications)
   - Materials or resources consumed
   - Approvals or authorizations needed
   - System access or tool requirements
   - Classify each input as required or optional

4. **Map the Process steps.** Document the end-to-end flow:
   - Number each step sequentially
   - Identify the role performing each step
   - Mark decision points (where the process branches)
   - Mark handoff points (where work passes between roles or departments)
   - Mark wait states (where the process pauses for external input)
   - Estimate time per step and total cycle time
   - Highlight known bottlenecks or failure points

5. **Define Outputs.** List everything the process produces:
   - Primary output (the main deliverable or result)
   - Secondary outputs (reports, records, notifications)
   - Data or information created or updated
   - Decisions or approvals generated
   - For each output: format, destination, and quality criteria

6. **Identify Customers.** List every entity that receives process outputs:
   - Internal customers (next department, management, teams)
   - External customers (clients, regulators, partners)
   - For each customer: what they need and their quality expectations

7. **Analyze the process.** Assess the current state:
   - Total cycle time (sum of step times + wait times)
   - Value-added vs. non-value-added steps
   - Bottleneck identification (longest step or most frequent delay)
   - Handoff count (each handoff is a potential failure point)
   - Improvement opportunities

## Output Format

```
## Process Map: [Process Name]

**Process Owner:** [Role]
**Department:** [Department]
**Start Trigger:** [What initiates the process]
**End State:** [What constitutes completion]
**Date:** [Date]
**Version:** [X.X]

---

### SIPOC Overview

| Suppliers | Inputs | Process | Outputs | Customers |
|-----------|--------|---------|---------|-----------|
| [Supplier 1] | [Input 1] | [Step 1: Action] | [Output 1] | [Customer 1] |
| [Supplier 2] | [Input 2] | [Step 2: Action] | [Output 2] | [Customer 2] |
| [Supplier 3] | [Input 3] | [Step 3: Action] | [Output 3] | [Customer 3] |
| | [Input 4] | [Step 4: Action] | | |
| | | [Step 5: Action] | | |

---

### Detailed Process Flow

**Step 1: [Action Title]**
- **Performed by:** [Role]
- **Input:** [What is needed]
- **Action:** [What happens]
- **Output:** [What is produced]
- **Time:** [Duration]
- **Notes:** [Decisions, exceptions, or quality checks]

---

**Step 2: [Action Title]**
- **Performed by:** [Role]
- **Input:** [From step 1 or external]
- **Action:** [What happens]
- **Output:** [What is produced]
- **Time:** [Duration]

> **DECISION POINT:** If [condition A] → proceed to Step 3. If [condition B] → go to Step 2a.

---

**Step 2a: [Exception Path]**
- **Performed by:** [Role]
- **Action:** [Exception handling]
- **Returns to:** Step 3

---

**Step 3: [Action Title]**
- **Performed by:** [Role]
- **Input:** [From step 2]
- **Action:** [What happens]
- **Output:** [What is produced]
- **Time:** [Duration]

> **HANDOFF:** [Role A] passes [deliverable] to [Role B] via [method]

---

[Continue for all steps]

---

### Process Metrics

| Metric | Current | Target | Notes |
|--------|---------|--------|-------|
| Total cycle time | [X hours/days] | [Target] | [End-to-end including wait times] |
| Active processing time | [X hours] | [Target] | [Time spent working, excluding waits] |
| Number of steps | [X] | [Reduce to Y] | [Total steps in standard flow] |
| Number of handoffs | [X] | [Reduce to Y] | [Each handoff is a failure point] |
| Number of decision points | [X] | | [Branching complexity] |
| Wait time percentage | [X%] | [Under Y%] | [Wait / total cycle time] |

---

### Suppliers Detail

| Supplier | What They Provide | When | Quality Requirement |
|----------|------------------|------|-------------------|
| [Supplier 1] | [Input description] | [Timing] | [What makes it acceptable] |
| [Supplier 2] | [Input] | [Timing] | [Quality requirement] |

### Customers Detail

| Customer | What They Receive | Format | Quality Expectation |
|----------|------------------|--------|-------------------|
| [Customer 1] | [Output description] | [Format] | [Their standard] |
| [Customer 2] | [Output] | [Format] | [Standard] |

---

### Analysis and Improvement Opportunities

**Bottleneck:** [Step X] -- [Why it is the bottleneck and estimated impact]

**Non-Value-Added Steps:**
- Step [X]: [Why it adds no value and recommendation to eliminate or reduce]
- Step [X]: [Analysis]

**Improvement Recommendations:**

| Priority | Recommendation | Current State | Proposed State | Expected Impact |
|----------|---------------|---------------|----------------|-----------------|
| 1 | [Change] | [How it works now] | [How it would work] | [Time/cost saved] |
| 2 | [Change] | [Current] | [Proposed] | [Impact] |
```

## Rules

1. NEVER produce a process map without first identifying the start trigger, end state, and process owner
2. ALWAYS include all 5 SIPOC elements: Suppliers, Inputs, Process, Outputs, Customers
3. Every process step must identify who performs it (role, not person name)
4. Decision points must use explicit if/then branching, not vague "as appropriate"
5. Handoff points between roles or departments must be explicitly marked -- handoffs are the most common failure points
6. Include time estimates for each step and calculate total cycle time
7. Distinguish between active processing time and wait time -- most process inefficiency is in waiting, not working
8. NEVER map a process with only the "happy path" -- include at least one exception or error path
9. Every input must have a supplier and every output must have a customer -- orphaned inputs or outputs indicate an incomplete map
10. Include an analysis section with at least one bottleneck identification and one improvement recommendation

## Edge Cases

- **Process spans multiple departments:** Use a swim lane approach within the detailed flow (mark each step with the department). Track handoffs carefully -- cross-departmental handoffs are the highest-risk failure points. Include a RACI overlay if more than 3 departments are involved.
- **Highly variable process (different every time):** Map the core standard flow and document the most common 2-3 variants as separate paths. Identify which variables determine which path is taken. If the process is truly ad hoc, the process map should focus on decision criteria rather than fixed steps.
- **Process involves external parties (vendors, customers):** Include external parties as both suppliers and customers in the SIPOC. Mark steps performed by external parties differently from internal steps. Note that external steps are outside your control -- track expected vs. actual timing.
- **Process being mapped for the first time (no documentation exists):** Conduct a walk-through with the people who actually perform the process. Map what they actually do, not what management thinks they do. The gap between the two is often where improvement opportunities hide.
- **Very long process (50+ steps):** Break into sub-processes, each with its own SIPOC. Create a master process map showing the sub-processes as single blocks, then detail each sub-process separately. No single process map should exceed 15-20 steps for readability.

## Example

**Input:** "Map our customer order fulfillment process. An order comes in through our website, gets picked from the warehouse, packed, and shipped. The warehouse team does the picking and packing. Shipping is handled by a third-party carrier. Customer service handles any issues. Average order takes 2 days from order to delivery."

**Output:**

## Process Map: Customer Order Fulfillment

**Process Owner:** Warehouse Manager
**Department:** Operations
**Start Trigger:** Customer places an order on the website
**End State:** Customer receives the order and no issues reported within 48 hours
**Date:** [Current date]

---

### SIPOC Overview

| Suppliers | Inputs | Process | Outputs | Customers |
|-----------|--------|---------|---------|-----------|
| Customer | Order (items, address, payment) | 1. Receive order | Picking list | Warehouse Team |
| Inventory system | Stock availability | 2. Verify inventory | Confirmation email | Customer |
| Warehouse | Picked items | 3. Pick items | Packed shipment | Shipping Carrier |
| Packaging supplies | Boxes, labels, packing material | 4. Pack order | Tracking number | Customer |
| Shipping carrier | Pickup schedule, tracking | 5. Ship order | Delivery confirmation | Customer |
| | | 6. Confirm delivery | Fulfilled order record | Finance, CS |

---

### Detailed Process Flow

**Step 1: Receive and Validate Order**
- **Performed by:** Order Management System (automated)
- **Input:** Customer order from website (items, quantity, shipping address, payment)
- **Action:** System validates payment, checks for fraud flags, confirms shipping address format
- **Output:** Validated order queued for fulfillment
- **Time:** 1-5 minutes (automated)

> **DECISION POINT:** If payment fails → notify customer, hold order. If fraud flag → route to Customer Service for manual review.

---

**Step 2: Check Inventory and Generate Picking List**
- **Performed by:** Order Management System (automated)
- **Input:** Validated order
- **Action:** Check stock levels for each item. If all items in stock, generate picking list with warehouse locations. If partial stock, determine backorder vs. split shipment.
- **Output:** Picking list with item locations, quantities, and bin numbers
- **Time:** 1-2 minutes (automated)

> **DECISION POINT:** If item out of stock → notify Customer Service for backorder communication to customer.

---

**Step 3: Pick Items from Warehouse**
- **Performed by:** Warehouse Associate
- **Input:** Picking list
- **Action:** Retrieve items from designated locations. Scan each item barcode to confirm correct pick. Place items in staging area for packing.
- **Output:** Picked items in staging area, picking list confirmed complete
- **Time:** 10-20 minutes

**Verification:** All item barcodes scanned and matched to picking list.

---

### Process Metrics

| Metric | Current | Target | Notes |
|--------|---------|--------|-------|
| Total cycle time (order to delivery) | 48 hours | 36 hours | Including carrier transit |
| Active processing time | 45 minutes | 30 minutes | Steps 1-5 internal processing |
| Number of handoffs | 4 | 3 | System → Warehouse → Packing → Carrier |
| Pick error rate | 2% | Under 0.5% | Wrong item or quantity picked |

---

### Analysis and Improvement Opportunities

**Bottleneck:** Step 3 (Pick Items) -- manual picking takes 10-20 minutes per order and varies based on warehouse layout efficiency.

**Improvement Recommendations:**

| Priority | Recommendation | Current State | Proposed State | Expected Impact |
|----------|---------------|---------------|----------------|-----------------|
| 1 | Optimize warehouse layout by order frequency | Items stored by category | High-frequency items near packing station | Reduce pick time by 30% |
| 2 | Implement batch picking for concurrent orders | One order picked at a time | Pick 5-10 orders simultaneously on a route | Reduce total pick time per order by 40% |
