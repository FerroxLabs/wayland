---
name: technical-interview-prep
description: |
  Prepares the user for technical interviews by building structured response
  frameworks for coding problems, system design questions, and technical
  knowledge assessments. Teaches problem decomposition, thinking aloud, and
  handling questions where the answer is unknown. Produces ready-to-use
  response templates per question type. Use when the user is preparing for a
  technical interview, wants to practice problem-solving approaches, or needs
  frameworks for system design or coding questions. Do NOT use for behavioral
  interview preparation (use behavioral-interview-prep), case interview
  preparation (use case-interview-prep), or predicting interview questions
  (use interview-question-anticipator).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "interview-prep career template"
  category: "career-development"
  subcategory: "interview-preparation"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Technical Interview Prep

## When to Use

Use this skill when the user presents any of these specific scenarios:

- The user is preparing for a software engineering or technical role interview involving live coding, whiteboard problems, or algorithm challenges -- they need structured approaches for thinking, communicating, and solving under time pressure
- The user wants a framework for a system design round -- they need to know how to scope, estimate, architect, and defend a distributed system design in 45-60 minutes
- The user is asking how to think aloud or communicate their reasoning during a technical problem -- they understand solutions but struggle to narrate their process in a structured way
- The user wants to handle technical knowledge questions (language internals, database concepts, networking, OS fundamentals) and needs to know how deep to go, how to structure answers, and how to recover when they hit the boundary of their knowledge
- The user is preparing for a take-home coding assignment and needs guidance on scope, code quality signals, testing strategy, and README structure
- The user has a technical screen in the next 24-72 hours and needs rapid preparation focused on the highest-leverage areas rather than exhaustive review
- The user is a self-taught engineer or bootcamp graduate preparing to compete against CS degree candidates and needs to build pattern recognition for algorithm categories quickly

**Do NOT use this skill when:**

- The user needs help crafting behavioral interview answers (stories about teamwork, conflict, leadership) -- use `behavioral-interview-prep` instead
- The user is preparing for a consulting or product case interview involving market sizing, case frameworks, or business strategy -- use `case-interview-prep` instead
- The user wants to predict or anticipate which specific questions will be asked at a particular company -- use `interview-question-anticipator` instead
- The user needs help with company research, culture fit, or understanding the business before an interview -- use `company-research-guide` instead
- The user is asking only about salary negotiation, offer evaluation, or post-offer decisions -- that is a distinct skill domain
- The user is preparing for a non-technical role interview where "technical" means business tools like Excel or Salesforce -- this skill covers software engineering interviews specifically

---

## Process

### Step 1: Intake -- Establish the Interview Profile

Before producing any framework, collect the four critical variables that determine everything about what to prepare.

- **Role level:** Junior (0-2 years), Mid (3-5 years), Senior (5-8 years), Staff/Principal (8+ years). This determines the ratio of coding problems to system design, expected depth on architecture questions, and whether leadership trade-offs are in scope.
- **Domain:** Backend, frontend, full-stack, data engineering, ML engineering, infrastructure/SRE, mobile. Each has a different distribution of question types and different depth expectations.
- **Interview format:** Ask the user exactly what rounds were communicated. The most common formats are: phone screen with a shared editor (45-60 min, 1-2 medium coding problems), onsite loop (4-6 rounds: coding + system design + technical knowledge + behavioral), virtual onsite (same as onsite, video format), take-home assignment (4-48 hours, often a small project or feature), and pair programming interview (collaborative live coding on a real or realistic problem).
- **Technology stack:** What languages does the user write in daily? What databases, queues, and infrastructure do they have hands-on experience with? This determines which language to use in coding rounds and which system components they can speak to with authority.

If the user gives vague inputs like "a big tech company," ask: Have they told you the interview format? What role level are you targeting? This information changes the prep plan significantly.

### Step 2: Build the Coding Interview Framework

Produce a five-stage framework with explicit time budgets and verbal scripts the user can practice.

- **Stage 1 -- Clarify (2-3 minutes):** This is the most under-invested stage and the most common failure point. Teach the user to ask: What is the input type and range (integers, strings, arrays -- and what size, what value range)? What is the expected output format? Are there constraints on time or space complexity? Should I optimize for readability or performance? Are there any edge cases they specifically want handled? The user should NEVER write a single line of code before answering these questions.
- **Stage 2 -- Plan (3-5 minutes):** Before coding, the user must verbalize at least two approaches. Start with the brute force (even if obvious) to anchor the conversation, then identify the inefficiency and explain the optimization. State Big-O for both time and space. Explain WHY the better approach is better. This is where interviewers assess problem-solving ability -- not the final code.
- **Stage 3 -- Code (15-20 minutes):** Write working code incrementally. Get a correct slow solution before optimizing. Use meaningful variable names. Think aloud every 30-60 seconds. If using Python, write type hints. If using Java/Go, handle errors explicitly. Avoid writing pseudocode unless the interviewer explicitly approves it -- it often signals avoidance of implementation details.
- **Stage 4 -- Test (3-5 minutes):** Trace through the code manually with a simple example, line by line. Then run a second trace with an edge case: empty array, single element, all-duplicate elements, negative numbers, integer overflow at boundaries (2^31 - 1), null inputs. Do not just say "it should work" -- actually trace the execution and call out what each variable holds.
- **Stage 5 -- Optimize (remaining time):** If the solution works, discuss: Can we reduce space complexity by using an in-place technique? Can we use a different data structure for better cache locality? Would this solution hold at 10x the stated input size? This is especially important at senior level -- optimization discussion signals engineering maturity.

### Step 3: Build the Algorithm Pattern Recognition Library

Teach the user to categorize problems, not memorize solutions. There are eight core patterns that cover approximately 80% of coding interview problems.

- **Two Pointers:** Used when the problem involves a sorted array, finding pairs/triplets that satisfy a condition, or removing duplicates in-place. Recognition signal: "Find two numbers that sum to X" or "Remove duplicates from sorted array."
- **Sliding Window:** Used for substring/subarray problems with a contiguous constraint. Recognition signal: "longest substring without repeating characters," "minimum window containing all characters," or "maximum sum subarray of size k."
- **Fast and Slow Pointers:** Used for linked list cycle detection, finding midpoints, and cycle length. Recognition signal: any linked list problem involving cycles or median-finding.
- **BFS/DFS on Trees and Graphs:** BFS for shortest path, level-order traversal, minimum steps problems. DFS for path existence, connected components, topological sort. Recognition signal: any graph connectivity question or tree traversal.
- **Binary Search:** Not just on sorted arrays -- also on the answer space. Recognition signal: "minimum/maximum value that satisfies a condition" or sorted structure with O(log n) lookup requirement.
- **Dynamic Programming:** Overlapping subproblems with optimal substructure. Recognition signal: "number of ways," "minimum cost," "longest sequence." Start with recursive + memoization (top-down) before converting to tabulation (bottom-up).
- **Heap/Priority Queue:** When the problem requires repeatedly finding the k-th largest/smallest element, merging k sorted lists, or scheduling by priority. Recognition signal: "top k elements," "k closest points," "median of data stream."
- **Hash Map/Set:** When O(1) lookup transforms an O(n^2) brute force into O(n). Recognition signal: any problem where you need to check "have I seen this before?" or "does the complement of this value exist?"

For each pattern, provide the user with the mental checklist: What keywords trigger this pattern? What data structure does it use? What is the standard initialization? What is the loop invariant?

### Step 4: Build the System Design Framework

The system design interview is evaluated on breadth (covering all components), depth (knowing how each component actually works), and judgment (knowing which trade-offs to make and why).

- **Requirements gathering (5 minutes):** Separate functional requirements (what the system does -- the API surface) from non-functional requirements (how the system performs -- availability, latency, durability, consistency). Explicitly call out scope: "I am going to focus on the write path and read path for the core feature. I am going to assume auth is handled by an existing service." Interviewers reward explicit scoping because it shows systems thinking.
- **Back-of-envelope estimation (5 minutes):** Use these standard anchors: 1 million daily active users (DAU) generates roughly 10-50 requests per second average, 50-250 peak (3-5x average). A typical database row is 100-500 bytes. A photo is 100KB-5MB. A video minute is 50-200MB. 1 TB of storage costs roughly $25/month on cloud storage. Use these to calculate: storage per day, total storage for 5 years, peak requests per second, and bandwidth. Quantification demonstrates engineering rigor.
- **High-level design (10 minutes):** Draw left-to-right: client -> load balancer -> API server cluster -> cache (Redis/Memcached) -> primary database -> replica(s) -> async workers via message queue (Kafka/RabbitMQ) -> object storage (S3-compatible) for blobs. Explain the data flow for the two most important operations: the primary write path and the primary read path. Do not skip the load balancer or explain why you are omitting it.
- **Database and storage design (10 minutes):** Choose between relational (ACID guarantees, strong consistency, complex queries) and NoSQL (horizontal scalability, flexible schema, eventual consistency). Make the choice explicit with reasons. Design the core schema: primary keys, foreign keys, indexes. For NoSQL, design the access patterns first, then the data model. Discuss: How do you handle reads at scale? Primary + read replicas, with cache in front. How do you handle writes at scale? Vertical scaling first, then sharding by a hash of the partition key.
- **Deep dive on 2-3 components (15 minutes):** The interviewer will usually steer toward one area. Common deep dives: caching strategy (cache-aside vs. write-through vs. write-behind, TTL decisions, cache invalidation), message queue design (at-least-once vs. exactly-once delivery, consumer groups, partition strategy), database sharding (shard key selection, hot shard avoidance, cross-shard queries), or API design (REST vs. GraphQL vs. gRPC for internal vs. external APIs).
- **Failure modes and reliability (5 minutes):** For every major component, ask: What happens when this fails? Mitigation patterns: circuit breakers, retry with exponential backoff, bulkhead isolation, graceful degradation (serve stale data rather than returning an error), and health checks with automatic failover. At senior level, also discuss monitoring: what metrics matter (p99 latency, error rate, saturation), what alerts to set, and how to debug production incidents using distributed tracing.

### Step 5: Build the Technical Knowledge Interview Framework

Technical knowledge questions test depth and precision. The scoring is: shallow answer = 1/5, correct surface answer = 3/5, correct answer with trade-offs and nuance = 5/5.

- **Structure every answer with the PREP format:** Point (one-sentence direct answer), Reason (mechanism -- why/how it works), Example (a concrete, specific example from experience or domain), Plus (one extension -- an edge case, trade-off, or advanced nuance).
- **Know the depth floor for your domain.** Backend engineers must be able to explain: database indexing (B-tree vs. hash index, covering indexes, index selectivity), SQL transaction isolation levels (READ COMMITTED vs. REPEATABLE READ vs. SERIALIZABLE and the anomalies each prevents), TCP connection lifecycle, HTTP/2 vs. HTTP/1.1, and how their primary language handles concurrency and memory management. These are the minimum competency baseline at senior level.
- **For language-specific questions:** Go beyond syntax to implementation. Not "a goroutine is a lightweight thread" but "goroutines are managed by the Go scheduler using an M:N threading model, with a work-stealing algorithm across P logical processors. Each goroutine starts with a 2KB stack that grows dynamically up to 1GB."
- **For database questions:** Always anchor to ACID properties, isolation levels, and the CAP theorem. Be able to draw the B-tree structure for index traversal. Know what VACUUM does in PostgreSQL, what ANALYZE does, and what EXPLAIN ANALYZE tells you.

### Step 6: Build the "I Don't Know" and Recovery Framework

This framework directly affects pass/fail decisions because interviewers are evaluating intellectual honesty and problem-solving process as much as knowledge.

- **Tier 1 -- Partial knowledge:** "I know the concept but not the implementation details." Script: "I have worked with [X] at the conceptual level. My understanding is [correct part]. I am less certain about [specific gap]. If I had to reason through it, I would expect [reasoned inference] because [first-principles reasoning]. Is that on the right track?"
- **Tier 2 -- Adjacent knowledge only:** "I have never used this technology." Script: "I have not worked with [X] directly. In [technology I know well], the equivalent is [Y], which works by [mechanism]. I would expect [X] to handle this similarly because [architectural reasoning]. The key question I would have is [intelligent question that shows you know what matters]."
- **Tier 3 -- Completely outside knowledge:** Script: "I do not have experience with [X]. Rather than guess, let me tell you how I would approach learning it: I would start with [approach], look at [type of resource], and specifically try to understand [key concept]. Is there a particular aspect you want me to reason through?"
- **Recovery from a wrong solution:** Say: "Wait -- I think there is an issue here. Let me trace through this edge case: [trace]. Yes, this fails when [condition] because [reason]. The fix is to [specific change] because [reasoning]." Self-correction is scored positively -- it demonstrates debugging skill. Interviewers deduct points for defending a wrong answer after being shown it is wrong.

### Step 7: Generate a Targeted Practice Plan

Based on the user's role level, timeline, and domain, produce a specific 5-7 day preparation schedule.

- **3 days or less:** Focus only on the three most high-leverage areas for the stated role. For backend senior: system design deep dive + 3-5 coding problems in the top two patterns for their weak areas + two technical knowledge questions in their primary domain.
- **1-2 weeks:** Daily coding practice (2 problems per day, one pattern review per day), one full mock system design per every two days, one technical knowledge review session per day covering 3-4 topics.
- **3+ weeks:** Full pattern coverage (one pattern per 2-3 days with 4-6 problems per pattern), system design weekly mock sessions with feedback, one domain deep-dive per week (databases, networking, OS, distributed systems).
- **Problem difficulty calibration:** Junior = LeetCode Easy (80%) + Medium (20%). Mid = LeetCode Medium (70%) + Hard (30%). Senior = LeetCode Medium (40%) + Hard (60%) plus system design emphasis. Staff = system design (60%) + complex algorithmic problems (40%) with architecture justification expected.

---

## Output Format

Produce the following complete structured output:

```
## Technical Interview Prep: [Role Level] [Domain] Engineer
**Company Type:** [FAANG / Mid-size tech / Startup / Non-tech company]
**Interview Rounds:** [List each round confirmed by the user]
**Primary Language:** [Language the user will code in]
**Timeline:** [Days until interview]

---

### Coding Interview Framework

#### Pre-Code Protocol (2-3 minutes)
Mandatory clarifying questions for this problem type:
- [Specific question 1 relevant to domain or typical problem category]
- [Specific question 2]
- [Specific question 3]
- Confirm: "Does the solution need to handle [specific edge case]?"
- Confirm: "Is [specific constraint -- size, character set, value range] bounded?"

Say before starting: "[Verbal restatement of the problem in one sentence confirming understanding]"

#### Planning Phase (3-5 minutes)
Brute force: [Describe approach] -- O([time]) time, O([space]) space
Optimized: [Describe approach] -- O([time]) time, O([space]) space
Decision: "I will use the [approach] because [specific reason tied to the constraints]."

Pattern recognition: This problem resembles [pattern name]. The signal is [specific element of the problem that identifies the pattern].

#### Coding Phase (15-20 minutes)
Language: [Language]
Talk-aloud checkpoints (every ~2 minutes):
- After initialization: "I am setting up [data structure] because I need [operation] in O([complexity])."
- At the loop: "The invariant here is [invariant -- what is true at each iteration]."
- After the main logic: "At this point, [variable] holds [what it represents]."
- Before returning: "I am returning [value] because the problem asked for [output format]."

#### Testing Phase (3-5 minutes)
| Test Type | Input | Expected Output | Tracing Note |
|-----------|-------|-----------------|--------------|
| Happy path | [realistic example] | [correct output] | [what to verify] |
| Empty input | [] or "" | [correct output] | [what to verify] |
| Single element | [single value] | [correct output] | [what to verify] |
| Boundary | [max/min values] | [correct output] | [what to verify] |
| Duplicates | [repeated values] | [correct output] | [what to verify] |

#### Optimization Discussion (remaining time)
Current complexity: [time], [space]
Possible improvements:
- [Specific optimization 1] -- Would reduce [space/time] from [current] to [improved] by [mechanism]
- [Specific optimization 2] -- Trade-off: [gain] vs. [cost]

---

### System Design Framework

#### Requirements Checklist (5 minutes)
Functional (say each aloud and confirm):
- [ ] [Core feature 1 -- the primary write operation]
- [ ] [Core feature 2 -- the primary read operation]
- [ ] [Secondary feature relevant to the domain]
- Out of scope: [Explicitly state at least 2 things you are not designing]

Non-functional (state targets and get confirmation):
- Availability: [Target SLA -- e.g., 99.9% = 8.7 hours downtime/year]
- Latency: [Target -- e.g., p99 < 200ms for reads]
- Consistency: [Strong / Eventual -- and which operations require which]
- Scale: [DAU target, peak QPS, geographic distribution]

#### Estimation (5 minutes)
| Metric | Calculation | Result |
|--------|-------------|--------|
| Daily active users | [Given or assumed] | [Number] |
| Requests per second (avg) | [DAU × requests/user ÷ 86,400] | [Number] |
| Requests per second (peak) | [avg × 3-5x] | [Number] |
| Storage per day | [requests × data size per request] | [Number] |
| Storage for 5 years | [daily × 365 × 5 × replication factor] | [Number] |
| Bandwidth (ingress) | [peak QPS × request payload size] | [Number] |
| Bandwidth (egress) | [peak read QPS × response payload size] | [Number] |

#### High-Level Architecture
Components (draw left to right):
Client -> [CDN if applicable] -> Load Balancer -> [API Gateway if applicable]
-> API Server Cluster -> [Cache Layer (Redis)] -> Primary Database
-> Read Replicas -> [Message Queue] -> [Async Workers]
-> [Object Storage for blobs]

Primary write path: [Describe end-to-end for the most important write operation]
Primary read path: [Describe end-to-end for the most important read operation, including cache hit and cache miss paths]

#### Database Design
Database choice: [Relational / NoSQL / Both -- with explicit justification]
Justification: [Why this choice -- ACID requirements, access patterns, scale expectations]

Core schema or data model:
[Table or document structure with primary keys, foreign keys, and index definitions]

Key indexes:
- [Index 1]: [Column(s)] -- Supports [specific query pattern]
- [Index 2]: [Column(s)] -- Supports [specific query pattern]

Scaling strategy:
- Read scaling: [Read replicas + cache with TTL of X seconds]
- Write scaling: [Vertical first, then shard by {partition key} -- shard key chosen because {reason it avoids hot shards}]

#### Deep Dive: [Component 1]
[Detailed technical explanation of design decisions, alternatives considered, and trade-offs made]

#### Deep Dive: [Component 2]
[Detailed technical explanation -- e.g., caching strategy: cache-aside vs. write-through, TTL decisions, invalidation strategy]

#### Reliability and Failure Modes
| Component | Failure Mode | Detection | Mitigation |
|-----------|-------------|-----------|------------|
| [Component] | [How it fails] | [Metric/alert] | [Circuit breaker, retry, fallback] |
| [Component] | [How it fails] | [Metric/alert] | [Failover strategy] |

---

### Handling Unknowns

| Situation | Opening | Recovery Strategy |
|-----------|---------|------------------|
| Partial knowledge | "My understanding is [X]. The part I am less certain about is [Y]." | Reason from first principles to [Y], ask for confirmation |
| Adjacent knowledge only | "I have not used [X], but in [technology I know], the equivalent works by [mechanism]." | Draw analogy, identify the key design question |
| No knowledge | "I do not have experience with [X]. Let me reason through what I would need to learn." | Describe learning approach, ask intelligent scoping question |
| Wrong answer discovered | "I see the issue -- [specific error]. This fails when [edge case] because [reason]. The fix is [specific change]." | Trace through the fix aloud, verify it works |
| Interviewer pushes back | "That is a good point. Let me reconsider [specific element]." | Do not defend reflexively -- evaluate the pushback first |

---

### Practice Problems

**Coding Problems (ordered by priority):**

| # | Problem | Pattern | Difficulty | What the Interviewer Evaluates |
|---|---------|---------|------------|-------------------------------|
| 1 | [Problem name + one-sentence description] | [Pattern] | [Easy/Medium/Hard] | [Specific skills -- e.g., "two-pointer technique, off-by-one handling, edge case awareness"] |
| 2 | [Problem name + one-sentence description] | [Pattern] | [Medium/Hard] | [Specific skills] |
| 3 | [Problem name + one-sentence description] | [Pattern] | [Medium/Hard] | [Specific skills] |

**System Design Problem:**

Problem: [Specific design question tailored to the company's domain]
Key areas to demonstrate:
- [Specific technical depth area 1]
- [Specific technical depth area 2]
- [Specific trade-off to discuss]

**Technical Knowledge Questions:**

| Question | Strong Answer Includes | Weak Answer Looks Like |
|----------|----------------------|----------------------|
| [Question 1] | [Specific concepts, mechanisms, and nuances expected] | [What an underprepared answer sounds like] |
| [Question 2] | [Specific concepts] | [What falls short] |
| [Question 3] | [Specific concepts] | [What falls short] |

---

### 5-Day Preparation Plan

| Day | Focus | Specific Tasks | Time Investment |
|-----|-------|---------------|----------------|
| 1 | [Pattern or topic] | [Specific problems or topics] | [Hours] |
| 2 | [Pattern or topic] | [Specific problems or topics] | [Hours] |
| 3 | [Pattern or topic] | [Specific problems or topics] | [Hours] |
| 4 | System design mock | [Specific design question] | [Hours] |
| 5 | Review + simulation | [Full mock with timed rounds] | [Hours] |
```

---

## Rules

1. **Never skip the clarification step.** The most common reason candidates fail coding interviews is jumping to code before fully understanding the problem. The first framework output must always include explicit scripts for what to say during clarification, including confirmation of edge cases and constraints. If the user says "I already know the problem," still provide a checklist of what to confirm.

2. **Time budgets are hard constraints, not suggestions.** Every stage must have an explicit minute allocation. If the user spends 10 minutes clarifying, they will not have time to test. Teach users to watch the clock and move forward even with uncertainty -- a partial solution with correct reasoning scores better than an incomplete attempt at a perfect solution.

3. **Complexity analysis must be stated before coding begins.** Never produce a coding framework that gets to the code phase without first discussing Big-O. Interviewers at mid-level and above expect the candidate to state "this is O(n) time and O(n) space" before writing line one. The analysis also catches wrong approaches before they waste coding time.

4. **System design estimation is not optional at senior level.** Any system design framework for a senior or above candidate must include the back-of-envelope estimation step with actual arithmetic. Skipping it signals that the candidate has never thought about scale in production. Use the standard conversion anchors: 1 DAU generating 10 requests = ~115 QPS average, 10^6 seconds per 11.6 days, 1 TB = 10^12 bytes.

5. **Practice problems must match the role level exactly.** Giving a senior engineer only easy LeetCode problems under-prepares them and gives false confidence. Giving a junior engineer only hard problems creates anxiety without building pattern recognition. The difficulty calibration rule: junior = 80% Medium / 20% Hard, senior = 50% Medium / 50% Hard with system design primary.

6. **Never recommend memorizing solutions.** The skill of coding interviews is pattern recognition and problem decomposition, not recall. Every problem in the practice set must be accompanied by its pattern category and the recognition signal -- what in the problem statement tells you which pattern to apply. The user should be able to recognize 8 patterns cold, not recall 100 solutions.

7. **Think-aloud scripts must be literal, not conceptual.** Do not say "explain your thinking." Say: here is the exact sentence to speak at each checkpoint. Interviewers hear silence as confusion. The user needs rehearsed phrases like "I am using a hash map here because I need O(1) lookup for the complement check" that they can deploy automatically without breaking their concentration.

8. **The "I don't know" framework is a pass/fail differentiator.** Produce it for every prep session, not just when the user asks. Intellectual honesty combined with structured reasoning is explicitly valued by senior engineers conducting interviews. A candidate who says "I don't know X, but here is how I would reason about it" scores higher than one who gives a plausible-sounding wrong answer.

9. **Distinguish between interview formats and adjust all guidance accordingly.** A take-home assignment is evaluated on code quality, architecture, test coverage, and documentation -- not speed or verbal communication. A pair programming interview is evaluated on collaboration (do you explain? do you ask questions? do you incorporate feedback?) -- not solo algorithmic performance. Never apply coding-round advice to a take-home without adaptation.

10. **Every technical knowledge answer must reach for the "why" and the trade-off, not just the "what."** A correct surface answer ("indexes speed up queries") scores 3/5. An answer that reaches the trade-off ("indexes speed up reads by maintaining a B-tree structure, but they add write overhead because every INSERT and UPDATE must maintain the index -- so adding an index to a write-heavy table requires careful profiling") scores 5/5. Always push the user's answers to the trade-off level.

---

## Edge Cases

**The user has a coding interview in less than 24 hours:**
Do not produce a comprehensive study plan. Focus only on the three things with highest expected value return: (1) review the two most common patterns for the domain (for backend: sliding window + hash map; for frontend: tree traversal + dynamic programming for UI state problems), (2) practice the full verbal framework once end-to-end on a single medium problem, and (3) review the "I don't know" recovery scripts. Do not attempt to cover systems they have not used before -- it will generate false confidence and surface-level knowledge that interviewers detect immediately.

**The user is a self-taught developer or bootcamp graduate with no formal CS background:**
Reframe the preparation entirely around pattern recognition and practical reasoning rather than academic terminology. Instead of "topological sort of a directed acyclic graph," say "processing tasks in dependency order using DFS." Instead of "amortized O(1) for dynamic array append," say "adding to an array is fast most of the time, occasionally it copies -- on average O(1) per operation." Teach the eight patterns using real-world analogies. Do not assign hard algorithmic problems during preparation -- build confidence with medium problems and correct verbal framework, which is often the bigger gap for self-taught engineers.

**The user is preparing for a FAANG or FAANG-adjacent company (Google, Meta, Amazon, Apple, Netflix, Microsoft):**
The bar at these companies is calibrated differently. Coding: Hard LeetCode problems are standard at senior level, and optimal solutions (not just working solutions) are expected. Interviewers look for: does the candidate consider multiple approaches, or do they jump to the first idea? System design: These companies expect deep knowledge of their specific infrastructure patterns. Amazon will probe on distributed systems consistency (eventual consistency, DynamoDB's leaderless replication). Google will probe on MapReduce-style batch processing and Bigtable-style storage. Meta will probe on social graph data models and newsfeed ranking systems. Calibrate the system design deep dives to the company's public engineering blog topics.

**The user is interviewing for a data engineering or ML engineering role:**
Replace standard algorithm problems with: SQL query optimization (window functions, CTEs, execution plan analysis), data pipeline design (batch vs. stream processing, Spark vs. Flink, backfill strategies), and statistical reasoning (sampling bias, A/B test validity, data skew). System design shifts to: data warehouse architecture (star schema vs. snowflake schema, columnar storage trade-offs, partitioning by time vs. by dimension), feature store design (online vs. offline features, point-in-time correctness), and ML pipeline design (training data versioning, model serving latency vs. throughput, shadow deployment and canary releases). The "I don't know" framework is especially important here because ML engineering spans many domains -- calibrate the user to be comfortable saying "I have worked with batch pipelines but not streaming -- here is how I would reason about the streaming case."

**The user is interviewing at a company that uses pair programming or code review as the interview format:**
The evaluation criteria shift entirely. For pair programming: the interviewer is evaluating collaboration (does the candidate explain their ideas before implementing them, do they invite input, do they respond well to suggestions without becoming defensive, do they catch their partner's errors constructively?), not just correctness. Prepare specific verbal habits: say "what do you think about this approach?" before committing to a design, narrate your debugging process rather than silently staring at the screen, and practice saying "good catch" naturally. For code review interviews: the user needs to know what to look for: security vulnerabilities (SQL injection, unvalidated user input, missing authentication checks), correctness (off-by-one errors, race conditions, unhandled null/empty cases), performance (N+1 query patterns, unnecessary full-table scans, missing indexes), and maintainability (naming clarity, single responsibility, test coverage). Provide a code review checklist specific to the user's domain.

**The user has significant experience but has not interviewed in 5+ years:**
The technical landscape has shifted but the fundamentals have not. Two areas need recalibration: (1) Coding interviews have become more standardized and LeetCode-style, even though this is not how production code is written -- the user may need to accept that the game has specific rules and practice the format, not just the underlying skill. (2) System design questions now routinely include cloud-native patterns (container orchestration, managed Kubernetes, serverless tradeoffs, event-driven architecture) that may not have been standard in their previous interview cycle. Emphasize: distributed systems fundamentals have not changed (CAP theorem, consensus protocols, consistent hashing), but the implementation vocabulary has expanded. Spend extra time on failure mode discussions -- experienced engineers are expected to proactively identify failure points, not just describe the happy path.

**The user will be coding in a language they are not strongest in (e.g., the company requires Java but the user codes primarily in Python):**
Produce a language-specific quick reference for the interview language: the equivalent of Python's `defaultdict(list)` in Java (`HashMap<String, List<String>>`), the equivalent of Python slicing in Java (`Arrays.copyOfRange`), how to iterate over a map, how to sort with a custom comparator, and the standard library imports needed for priority queues and linked lists. The user should be able to produce idiomatic (not necessarily optimal) code in the interview language. The framework is identical -- only the syntax reference changes. Practice two full problems in the interview language before the actual interview, not just the logic.

---

## Example

**Input:** "I have a senior backend engineer interview at a Series B fintech company in 5 days. They told me there will be a 1-hour coding round and a 1-hour system design round. I primarily code in Python and work with PostgreSQL and Redis. I have worked at startups for the past 4 years but have not done a formal technical interview in 3 years."

---

**Output:**

## Technical Interview Prep: Senior Backend Engineer -- Fintech

**Company Type:** Series B fintech startup
**Interview Rounds:** 1-hour coding round, 1-hour system design round
**Primary Language:** Python (with PostgreSQL and Redis experience)
**Timeline:** 5 days
**Key Context:** Strong production experience, returning to interview format after 3-year gap

---

### Coding Interview Framework

#### Pre-Code Protocol (2-3 minutes)

For a senior backend role at a fintech company, expect problems involving: data aggregation (ledger calculations, transaction summaries), interval-based problems (detecting overlapping transactions, time windows), or graph problems (dependency resolution, fraud network detection).

**Mandatory clarifying questions:**
- "What are the constraints on the input size -- are we talking hundreds of records or millions?"
- "Should I optimize for time complexity, space complexity, or readability?"
- "Can the values be negative? In financial contexts, that would represent debits."
- "Is the input sorted or unsorted?"
- "Should I handle floating-point currency values or can I assume integers (cents)?"
- "What should I return if the input is empty?"

**Say before starting:** "So to confirm -- we need to [restate problem in one sentence], the input is [type and size], and the output should be [format]. I am going to assume [specific assumption] unless you tell me otherwise."

**What NOT to do:** Do not say "I think I understand" and start coding. Do not ask generic questions like "are there any edge cases?" Ask specific, domain-relevant questions that show you have already thought about the problem space.

#### Planning Phase (3-5 minutes)

**Template for verbalization:**
"Let me think through two approaches before writing anything.

The brute force would be [describe naive approach] -- that gives us O(n²) time and O(1) space, which is probably too slow for the stated input size of [size].

A better approach uses [data structure / algorithm] to bring this to O(n) time and O(n) space. The idea is [one-sentence mechanism].

I will go with the second approach. The trade-off is extra memory, but the time improvement from O(n²) to O(n) is worth it at this scale."

**Pattern recognition for fintech-typical problems:**
- "Running balance / transaction aggregation" -- Prefix sum or hash map accumulation
- "Overlapping time windows / rate limiting detection" -- Sliding window
- "Find fraudulent transaction pairs" -- Two-pointer or hash map for complement search
- "Dependency resolution / payment ordering" -- Topological sort
- "Shortest payment path in a graph" -- BFS (unweighted) or Dijkstra (weighted)

#### Coding Phase (15-20 minutes)

**Language:** Python 3 with type hints (shows professional code quality)

```python
from collections import defaultdict
from typing import List, Dict, Optional

def process_transactions(transactions: List[Dict]) -> Dict[str, int]:
    # Talk aloud: "I am using defaultdict(int) here because every account
    # starts at 0 balance, so I do not need to handle missing keys explicitly."
    balances: Dict[str, int] = defaultdict(int)
    
    for txn in transactions:
        # Talk aloud: "I am iterating once, so this is O(n) time."
        balances[txn['from']] -= txn['amount']
        balances[txn['to']] += txn['amount']
    
    # Talk aloud: "I am returning a regular dict, not a defaultdict,
    # because the caller should not accidentally create zero-balance entries."
    return dict(balances)
```

**Talk-aloud checkpoints:**
- After the import block: "I am importing defaultdict because I need a counter that initializes to zero -- cleaner than checking if a key exists."
- Before the loop: "The invariant here is: after processing each transaction, balances correctly reflects the net position of all accounts seen so far."
- At the return: "I am converting to a plain dict on return because defaultdict's behavior would be unexpected to callers."

**Python-specific things interviewers notice positively:**
- Type hints on function signatures
- `defaultdict` and `Counter` from `collections` for their appropriate use cases
- List comprehensions where they improve readability (not always)
- Explicit error handling for production code (though not always required in interviews)

#### Testing Phase (3-5 minutes)

| Test Type | Input | Expected Output | What to Trace |
|-----------|-------|-----------------|---------------|
| Happy path | `[{from:'A', to:'B', amount:100}]` | `{A:-100, B:100}` | Both sides update correctly |
| Empty input | `[]` | `{}` | No crash, empty dict returned |
| Self-transfer | `[{from:'A', to:'A', amount:50}]` | `{A:0}` | Net zero -- common fintech edge case |
| Large amount | `[{from:'A', to:'B', amount:999999999}]` | `{A:-999999999, B:999999999}` | Integer overflow -- Python handles this natively, mention that |
| Multi-step chain | A->B->C | Correct net positions | Intermediate accounts calculated correctly |

**Say during testing:** "Let me trace through the happy path first. Transaction 1: from A to B for 100. So balances['A'] becomes -100, balances['B'] becomes 100. Final output: {A:-100, B:100}. That matches expected. Now the edge case: self-transfer. A sends 50 to A. balances['A'] decreases by 50, then increases by 50. Net zero. Good -- that is the correct financial behavior."

#### Optimization Discussion

**Current:** O(n) time, O(k) space where k = number of unique accounts
**Possible improvements:**
- If the input were sorted by account ID, we could use two pointers instead of a hash map, reducing space to O(1) -- but only if the problem guaranteed sorted input
- For a production system, we would add input validation: reject negative amounts, reject transactions where `from` and `to` are missing, sanitize account IDs. Say: "In production I would add validation, but I kept it minimal here for clarity -- happy to add it if useful."

---

### System Design Framework

#### What to Expect at a Series B Fintech

Expect one of: payment processing system, ledger service, fraud detection pipeline, notification system, or transaction history with reporting. These companies care about: correctness and consistency (money must not be lost or double-counted), auditability (every transaction must be traceable), and compliance-aware design (rate limiting, data retention, PII handling).

#### Requirements Checklist (5 minutes)

**For a payment processing system (the most likely question):**

Functional (state aloud, get confirmation):
- [ ] Users can initiate a transfer from account A to account B
- [ ] Users can check their current balance
- [ ] Users can view their transaction history
- Out of scope (state explicitly): "I am not designing the authentication system, the card network integration, or the regulatory compliance reporting -- I am going to assume those exist and focus on the core ledger and payment flow."

Non-functional (state targets and ask if they sound right):
- Availability: 99.99% (fintech cannot afford >52 minutes downtime/year)
- Latency: p99 < 500ms for payment initiation, p99 < 100ms for balance read
- Consistency: **Strong consistency required** for balance reads and writes -- eventual consistency is not acceptable for money movement
- Scale: "How many users are we targeting? Let me assume 500,000 DAU for estimation."

#### Estimation (5 minutes)

| Metric | Calculation | Result |
|--------|-------------|--------|
| Daily active users | Given/assumed | 500,000 |
| Transactions per user per day | Conservative fintech estimate | 3 |
| Total transactions per day | 500K × 3 | 1.5M |
| Transactions per second (avg) | 1.5M ÷ 86,400 | ~17 TPS |
| Transactions per second (peak) | 17 × 5x (payroll / month-end spike) | ~85 TPS |
| Balance reads per second | Reads are 10x writes in fintech | ~170 RPS |
| Transaction record size | ID + amount + accounts + timestamp + metadata | ~500 bytes |
| Storage per day | 1.5M × 500 bytes | ~750 MB |
| Storage for 5 years (7-year legal retention) | 750MB × 365 × 7 × 3 (replication) | ~5.7 TB |

"These numbers are manageable -- we are not at hyperscale. A well-designed PostgreSQL setup with read replicas can handle 170 RPS reads and 85 TPS writes comfortably. We do not need sharding on day one, but we should design for it."

#### High-Level Architecture

```
Client (Mobile/Web)
    |
    v
API Gateway (rate limiting, auth verification)
    |
    v
Load Balancer
    |
    v
Payment Service (Go/Python API servers, stateless, horizontally scalable)
    |               |
    v               v
Redis Cache      PostgreSQL Primary (payments, balances)
(balance reads)       |
                  Read Replica (transaction history queries)
                      |
                      v
               Message Queue (Kafka)
                      |
                      v
               Audit Log Service --> append-only audit store (S3 or append-only Postgres table)
               Notification Service --> email/push/SMS
               Fraud Detection Service (async, does not block payment)
```

**Primary write path (payment initiation):**
Client -> API Gateway -> Payment Service -> BEGIN TRANSACTION on PostgreSQL -> debit sender account -> credit receiver account -> INSERT transaction record -> COMMIT -> publish to Kafka -> return success to client. The entire debit+credit+record is a single ACID transaction -- this is non-negotiable for money movement.

**Primary read path (balance check):**
Client -> API Gateway -> Payment Service -> check Redis for cached balance (TTL: 30 seconds) -> cache hit: return immediately -> cache miss: query PostgreSQL read replica -> populate cache -> return. Use cache-aside pattern with write-through invalidation: on every committed transaction, invalidate the affected accounts' cache keys.

#### Deep Dive: Ledger Consistency

This is the most important deep dive for a fintech system design. Demonstrate that you understand why naive implementations fail.

**The double-spend problem:** Without proper locking, two concurrent requests could both read a balance of $100, both decide they can proceed with a $90 transfer, and both succeed -- leaving an account at -$80. Fix: use `SELECT ... FOR UPDATE` in PostgreSQL to acquire a row-level lock at the start of the transaction. This ensures serialized access to each account's balance row.

**The idempotency requirement:** Payment APIs must be idempotent. If a client submits a payment and the network drops before receiving a response, they will retry. Without idempotency keys, this results in a duplicate charge. Design: every payment request includes a client-generated idempotency key (UUID). The server stores this key with the completed transaction. On retry, the server looks up the key, finds the original result, and returns it without re-executing. Use a separate `idempotency_keys` table with a UNIQUE constraint on the key column.

**Schema design:**
```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    balance_cents BIGINT NOT NULL DEFAULT 0,
    -- Store in cents (integers) -- never use FLOAT for money
    currency CHAR(3) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key UUID UNIQUE NOT NULL,
    from_account_id UUID NOT NULL REFERENCES accounts(id),
    to_account_id UUID NOT NULL REFERENCES accounts(id),
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- 'pending', 'completed', 'failed', 'reversed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_transactions_from_account ON transactions(from_account_id, created_at DESC);
CREATE INDEX idx_transactions_to_account ON transactions(to_account_id, created_at DESC);
CREATE INDEX idx_transactions_idempotency ON transactions(idempotency_key);
```

**Why BIGINT for money:** Never use FLOAT or DECIMAL in application code for money. Floating point representation creates rounding errors (0.1 + 0.2 = 0.30000000000000004 in IEEE 754). Store everything in the smallest currency unit (cents for USD, pence for GBP, fen for CNY) as integers. Convert to display format only at the API response layer.

#### Deep Dive: Redis Caching Strategy

**Pattern: Cache-aside (lazy loading) with write-invalidation**
- On balance read: check Redis key `balance:{account_id}` -> miss: query PostgreSQL, SET in Redis with TTL 30 seconds
- On transaction commit: DEL `balance:{from_account_id}` and DEL `balance:{to_account_id}` within the same database transaction commit hook
- TTL of 30 seconds acts as a safety net: even if invalidation fails (Redis is down), the cache will self-correct within 30 seconds

**Why not write-through:** Write-through would require writing to both PostgreSQL and Redis in the same operation. If Redis is down, should the payment fail? No -- Redis is a performance optimization, not a source of truth. Cache-aside keeps the critical path (payment processing) independent of cache availability.

**Redis key structure:**
```
balance:{account_id}              -> BIGINT (balance in cents), TTL 30s
txn_history:{account_id}:page:1   -> JSON array, TTL 60s
idempotency:{idempotency_key}     -> payment result, TTL 24h
rate_limit:{user_id}:{minute}     -> counter, TTL 60s
```

#### Reliability and Failure Modes

| Component | Failure Mode | Detection | Mitigation |
|-----------|-------------|-----------|------------|
| PostgreSQL primary | Primary crashes mid-transaction | Automatic failover monitoring (pg_auto_failover or Patroni) | Read replicas promote to primary in ~30s; in-flight transactions roll back automatically |
| Redis cache | Redis becomes unavailable | Health check failure on cache miss attempts | Fall through to PostgreSQL reads; payment processing continues unaffected; monitor cache miss rate spike |
| Kafka | Queue unavailable | Producer send failures | Store events in a `pending_events` table and retry with a background job (outbox pattern) |
| Payment service instances | Pod crashes mid-request | Load balancer health check | Idempotency keys on retry ensure no double-processing; incomplete transactions roll back |
| Network partition | Client never receives response | Client timeout triggers retry | Idempotency key prevents duplicate payment; server returns original result on retry lookup |

---

### Handling Unknowns

| Situation | Opening | Recovery Strategy |
|-----------|---------|------------------|
| Asked about a payment network you have not integrated | "I have not worked directly with [X] network's API. The integrations I have built used [Y]. My expectation would be [Z] because most payment networks follow [pattern]." | Ask: "Is there a specific part of the integration you want me to reason through?" |
| Asked about distributed consensus (Raft/Paxos) | "I know the high-level concept -- leader election, log replication, majority quorums. I have not implemented it from scratch. In practice I have relied on [PostgreSQL replication / managed services] which handle consensus internally." | Demonstrate: can reason about what guarantees Raft provides without knowing the algorithm implementation detail |
| Coding problem you cannot solve | "I can see this has a [graph / dynamic programming / sliding window] structure. Let me identify what I know and where I am stuck. The setup I am confident about is [X]. The part I am not sure about is [specific element -- the state transition? the base case? the graph construction?]." | Resolve together with the interviewer -- asking for a hint gracefully is better than
