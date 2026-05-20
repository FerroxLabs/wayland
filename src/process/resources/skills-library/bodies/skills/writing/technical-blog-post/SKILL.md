---
name: technical-blog-post
description: |
  Creates technical deep-dive blog posts with code examples, architectural
  explanations, diagram descriptions, benchmarks, and lessons learned for
  developer audiences. Use when the user wants to write a technical blog post,
  engineering blog entry, or code walkthrough article. Do NOT use for general
  blog posts (use `blog-post-writing`), tutorials (use `tutorial-writing`), or
  API documentation (use `api-documentation`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing blog-post planning"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Technical Blog Post

## When to Use

Use this skill when:

- The user wants to write an engineering blog post about a system they built, debugged, optimized, or migrated -- where the primary audience is other software engineers or technical practitioners
- The user wants to publish a deep-dive article explaining an architectural decision, a performance investigation, or a non-obvious implementation technique
- The user has a technical war story -- an incident, a failed approach, a benchmark surprise -- and wants to turn it into a structured, publishable narrative
- The user wants to share a novel application of a known technology (e.g., using a message queue for a use case it was not designed for) with enough code and evidence to convince skeptical readers
- The user has completed a significant refactoring, migration, or infrastructure change and wants to document the reasoning, the process, and the outcome for the broader technical community
- The user wants to write a "how we built X" post for a company engineering blog, personal blog, or conference submission where technical depth and evidence are expected
- The user wants to establish technical credibility on a specific topic by publishing a well-reasoned, evidence-backed exploration of a problem space

Do NOT use this skill when:

- The user wants a step-by-step tutorial for someone learning a technology from scratch -- use `tutorial-writing` instead. The distinction: a tutorial teaches; a technical blog post argues a point or tells a story. If the reader is expected to follow along and build something, that is a tutorial.
- The user wants a general-audience blog post without code, architecture, or technical evidence -- use `blog-post-writing` instead
- The user wants API reference documentation, endpoint descriptions, or SDK guides -- use `api-documentation` instead
- The user wants a changelog, release announcement, or "what's new in version X" post -- use `release-notes` instead
- The user wants a conference talk abstract or speaker proposal -- even though the content overlaps, the format and persuasion mechanics are completely different
- The user wants internal runbook documentation or operational playbooks -- use `runbook-writing` instead
- The user wants a product announcement targeting non-technical buyers -- technical blog posts assume familiarity with the underlying concepts and do not sell products

---

## Process

### Step 1: Extract the Post's Core Argument

Before writing a single sentence, establish the post's thesis -- the one specific claim the post will prove. Technical blog posts that fail usually fail because they describe what happened without arguing why it matters.

- Ask the user: "What is the one thing you want a reader to believe or know after reading this that they did not know before?"
- Push back on answers that are too broad ("Redis is useful for caching") -- insist on a specific, provable claim ("A 5-minute TTL on per-team dashboard caches reduces database query volume by 87% without user-visible data quality degradation")
- Identify the evidence the user has available: benchmark numbers, production metrics, code before and after, incident timelines, user complaints resolved
- Classify the post type to select the narrative structure -- the six types are Problem-Solution, Before-After, Deep Dive, Lessons Learned, How We Built X, and Concept Exploration (see Step 2)
- Establish the target audience: junior engineers benefit from more context and simpler code; senior engineers and architects want trade-offs, edge cases, and system-level thinking; specialists in a specific stack want version-accurate code and known limitations
- Establish reading time target: 5 minutes is roughly 800-1,000 words plus code. 10 minutes is 1,600-2,000 words plus code. 15+ minutes requires a table of contents and usually splits well as a two-part series
- If the user does not have quantified evidence (benchmarks, metrics, incident timeline), ask explicitly what they have. A technical blog post without evidence is an opinion piece -- still publishable, but structurally different

### Step 2: Select the Narrative Structure

Each structure has a specific opening cadence, a required evidence type, and a common failure mode. Choose based on what the user actually has, not what sounds impressive.

- **Problem-Solution:** Opens with the symptom ("Our p99 latency hit 4.2 seconds on peak traffic"). Requires: a clear before state with metrics, an investigation narrative, a solution, and a quantified after state. Failure mode: burying the insight in technical exposition so the reader cannot tell what changed.
- **Before-After:** Opens with the old approach and its specific cost ("We maintained three separate config files across environments, and the drift caused two production incidents in Q3"). Requires: the old code, the new code, and a comparison on named dimensions. Failure mode: presenting the new approach as obviously correct without acknowledging why the old approach existed.
- **Deep Dive:** Opens with a question the reader already has ("Why does Go's garbage collector pause for microseconds while Java's pauses for milliseconds?"). Requires: layered explanation starting at observable behavior and drilling into implementation details. Failure mode: getting lost in detail and never connecting back to practical implications.
- **Lessons Learned / Postmortem:** Opens with the incident or mistake ("At 14:23 UTC on March 8th, we lost write access to our primary database for 11 minutes"). Requires: a timeline, a root cause chain (not a single cause), and specific preventive actions taken. Failure mode: hedging the root cause to protect feelings, making the lessons vague.
- **How We Built X:** Opens with the design goal and the interesting constraints ("We needed a job scheduler that could handle 50,000 scheduled tasks per minute without a dedicated scheduling database"). Requires: decision points where alternatives were rejected (with reasons), architecture description, and honest assessment of what worked and what did not. Failure mode: omitting the failed approaches, making the design look inevitable.
- **Concept Exploration:** Opens with a concrete, surprising behavior ("A Go defer inside a loop does not execute at the end of each iteration -- it executes when the enclosing function returns"). Requires: a precise definition, a common misconception, a worked example, and explicit guidance on when to use and when to avoid the concept. Failure mode: defining the concept abstractly without grounding it in code the reader can run.

### Step 3: Write the Opening (The "Why I Should Keep Reading" Paragraph)

The opening must accomplish three things in 2-4 sentences: state the specific technical situation, quantify why it mattered, and signal the resolution or insight that is coming. Everything else -- company background, author biography, definitions of obvious terms -- is cut.

- Lead with a specific, concrete situation: name the system, the scale, the symptom. "Our Kafka consumer lag grew to 8 million messages during peak hours" is a good lead. "Performance is a critical concern for modern applications" will lose the reader in 5 seconds.
- Include at least one number in the opening. Numbers signal that the author has measured, not just opined. "400ms" beats "slow." "Three engineers spent two weeks" beats "significant effort."
- Signal the technical depth in the first paragraph by naming the technologies involved. This tells the reader immediately whether this post is for them.
- Do NOT preview the post structure ("First, we will cover X. Then, we will explore Y"). Readers of technical posts are not reading sequentially -- they are scanning for the parts relevant to their situation. A preview wastes their time.
- Do NOT start with rhetorical questions ("Have you ever wondered why...?") -- this is a pattern from content marketing that signals low-depth content to technical readers.
- The opening for a Lessons Learned post must name the failure, not hint at it. "We lost 4 hours of writes because of a misconfigured Patroni failover trigger" is far more compelling than "We learned a lot about database reliability."

### Step 4: Structure Code Examples for Maximum Clarity

Code is the primary evidence in a technical blog post. Prose explains; code proves. Structure code blocks to maximize the transfer of understanding, not just to show that the author can write code.

- Show real code, not pseudo-code. Exception: when the concept applies across many languages and the pseudo-code makes the structure clearer than any single-language implementation. Even then, follow with a real implementation in the reader's likely language.
- Sequence code blocks in reading order: show the code first, then explain the non-obvious decisions in the prose that follows. Developers scan code blocks before reading prose -- write accordingly.
- Keep each code block focused on one concept: 10-40 lines. If a complete implementation is longer, split it into named segments with explanation between them ("The first half sets up the connection pool; the second half shows the query execution with retry logic").
- Comment code sparingly inside the block -- use inline comments only for non-obvious values or decisions. Move explanation to the prose. Over-commented code blocks are harder to read than under-commented ones.
- For before/after comparisons, show both blocks with identical formatting so the diff is visually obvious. Label them explicitly: `// Before: N+1 query pattern` and `// After: batched query`.
- Name every code variable as if it will be read in isolation -- avoid `x`, `temp`, `data`, `result`. Readers copy and adapt examples, and they inherit the variable names.
- Specify language identifiers on every code block for syntax highlighting: ```python, ```go, ```sql, ```yaml, ```bash. Never use plain ``` for a code block that has a language.
- If the code requires setup context (imports, config, a specific schema), either include it in the block or say explicitly "assuming the standard library imports from the previous section." Do not silently omit dependencies.

### Step 5: Build the Evidence Section

Technical claims without evidence are assertions. Evidence transforms assertions into arguments. The quality of evidence determines whether skeptical senior engineers will trust the post.

- **Benchmarks:** Always state the methodology -- hardware, OS, software versions, load profile, measurement tool, number of runs, whether outliers were dropped. A number without methodology is marketing copy. Use tools like `wrk`, `k6`, `ab`, `pyperf`, `criterion`, or `jmh` and name them explicitly.
- **Production metrics:** Specify the collection period, the traffic profile (requests/second, percentile of load), and whether the comparison is before and after a single change or between two concurrent systems. Use a table for multi-metric comparisons.
- **A/B comparisons:** Describe the test population, the duration, and the statistical significance if available. "We ran both implementations for 48 hours under equal traffic" is a minimum.
- **Profiling output:** If performance investigation involved profiling, show the flame graph description or hotspot table. "The profiler showed 73% of CPU time in JSON serialization" is concrete evidence; "we found a performance bottleneck" is not.
- Present the results table with exactly four columns: Metric, Before, After, Change (absolute or percentage). Add a row for the most important metric first.
- Below the table, explain the measurement context in 2-3 sentences: what load was applied, what environment (production, staging, local), how long the test ran, and any confounding factors.
- If the user does not have quantitative data (e.g., the post is about a refactoring where "better" means maintainability), explicitly label the evidence as qualitative and define the dimensions: "In code review, the new structure required 40% fewer questions from new team members over 3 months."

### Step 6: Write Architecture and Data Flow Descriptions

Diagrams are often unavailable or hard to include in published posts. Textual architecture descriptions, written well, convey structure as effectively as simple box-and-arrow diagrams.

- Describe components in the order a request encounters them: "An incoming HTTPS request hits the Nginx reverse proxy, which terminates TLS and forwards to the upstream FastAPI application on port 8000. FastAPI authenticates the request using the JWT middleware, then dispatches to the appropriate router."
- Name every component. Do not write "the database" when you mean "the PostgreSQL 15 primary replica." Specificity lets readers map your architecture onto their own.
- For asynchronous systems, describe the message flow explicitly: what publishes to what topic, what consumes it, what the consumer does with it, and what happens on failure (retry, dead-letter, discard).
- State the deployment topology when it affects the technical point: "both services run in the same Kubernetes namespace, so the gRPC call is an in-cluster round-trip under 1ms, not a cross-AZ call."
- When describing a before-state architecture, name the specific failure mode or bottleneck that prompted the change. "The single synchronous worker processed jobs serially, creating a queue backup whenever a job took more than 5 seconds" is better than "the old system was slow."
- For distributed systems posts, describe failure modes explicitly: what happens if component X is unavailable, what the system's behavior degrades to, and how it recovers.

### Step 7: Write Trade-offs, Limitations, and the Conclusion

The trade-offs section is where technical credibility is established or destroyed. Omitting trade-offs signals that the author either does not understand the system deeply or is writing marketing copy. Every technical approach has costs.

- For each trade-off, name the dimension that was sacrificed (consistency, simplicity, cost, latency, throughput, debuggability, operational overhead) and quantify the cost where possible
- Separate trade-offs (things that were consciously accepted) from limitations (things the approach does not address) -- these are not the same
- Include at least one trade-off the reader might not expect. This signals honest analysis rather than a victory lap.
- The conclusion is NOT a summary. Do not restate what was covered. State the transferable insight in one sentence -- the thing a reader should take to their next system, even if it is completely different from the one described.
- Follow the insight with explicit "when this applies / when it does not" guidance: "This caching pattern works when reads heavily outnumber writes and data freshness tolerance is above 30 seconds. Below that, the invalidation complexity outweighs the benefit."
- End with a specific next action: a measurement the reader should make in their own system, a tool to try, a question to ask their team. "Measure your cache hit rate before assuming TTL-based invalidation is sufficient" is actionable. "We hope this was useful" is not.

---

## Output Format

```markdown
# [Technical Title: Specific Problem, Discovery, or Claim]

[Opening: 2-4 sentences. Name the system, the scale, the specific symptom or question,
and a quantified preview of the outcome. No preamble.]

## The Problem

[2-3 sentences describing the technical context: what system, what constraints, what
the symptom was before any investigation. Include the measurement that first made the
problem visible.]

```[language]
[Code showing the problematic approach or the initial state. Real code, 10-40 lines.
Label with a comment if this is a "before" example.]
```

[Explanation of WHY this code or approach is insufficient. Name the failure mode,
not just the symptom. "This executes one query per item in the list (N+1 pattern).
At 200 items, this is 200 queries per request."]

## Investigation / Root Cause

[Optional: include when the solution was not obvious and the debugging process itself
is instructive. Describe the tools used to diagnose: profiler output, query explain plans,
distributed traces, log analysis.]

```[language]
[Code or output that revealed the root cause: a slow query log, a profiler output,
a trace visualization description]
```

[What the investigation revealed, stated as a specific cause: "The explain plan showed
a sequential scan on the `events` table because the composite index on (team_id, created_at)
was not being used -- the query planner chose a different index due to high cardinality
on team_id with low cardinality on status."]

## The Solution / Architecture

[Overview of the approach in 2-3 sentences. State WHY this approach was chosen over
the alternatives that were considered.]

### [Key Component or Subsystem Name]

[Role of this component in the solution. 2-3 sentences on design rationale.]

```[language]
[Code example: 10-40 lines, real code, focused on the concept being explained.
Variable names must be meaningful. Include language identifier.]
```

[Explanation of the code: what it does, and especially WHY the non-obvious decisions
were made. "The 300-second TTL was not arbitrary -- it comes from the 92nd percentile
re-read interval in our request logs."]

### [Key Component or Subsystem Name 2]

[Architecture description for the data flow or component interaction.
"The event processor reads from the `orders` Kafka topic on partition 0-7,
deserializes with Avro using the schema registry, and writes to the
`order_fulfillment` PostgreSQL table in batches of 500 within a single transaction.
Failed batches are retried up to 3 times with exponential backoff before being sent
to the `orders-dlq` dead letter topic."]

```[language]
[Code example]
```

## Results

[2-3 sentences describing the test environment: production or staging, load profile,
measurement duration, tool used.]

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| [Primary metric] | [Value with unit] | [Value with unit] | [Absolute and %] |
| [Secondary metric] | [Value with unit] | [Value with unit] | [Absolute and %] |
| [Operational metric] | [Value with unit] | [Value with unit] | [Absolute and %] |

[Interpretation: what the numbers mean, any surprising results, and confidence level.
"The p99 improvement was larger than expected because the slowest requests were all
cache misses on cold-start; this effect will diminish as the cache warms."]

## Trade-offs and Limitations

- **[Dimension sacrificed]:** [Specific cost, quantified if possible. "Redis is now a
  hard dependency. Dashboard requests fail completely if Redis is unreachable, rather than
  degrading to slow database queries. We mitigate this with a circuit breaker that
  falls back to direct database queries when Redis error rate exceeds 10% over 30 seconds."]
- **[Another trade-off]:** [What was given up and why it was acceptable given the context]
- **[Limitation -- what this does not solve]:** [The class of problem this approach
  does not address, and what would be needed to address it]
- **[Scale boundary]:** [At what point this approach breaks down and what the next
  approach would be]

## Key Takeaway

[One sentence stating the transferable insight -- not specific to the author's system,
but applicable to the reader's.]

[2-3 sentences: when this insight applies (the preconditions that must be true),
when it does not (the conditions that invalidate it), and the single most important
measurement or question the reader should take back to their own system.]

---

*Technologies: [language vX.Y, framework vX.Y, database vX.Y, tool vX.Y]*
*Measured in: [environment description, date range if production data]*
```

---

## Rules

1. **Never open with a preamble.** Phrases like "In this blog post," "Today we're going to explore," or "At [Company], we care deeply about performance" are filters that tell technical readers this post will waste their time. The first sentence must contain a specific technical situation, a number, or a question the reader is already asking.

2. **Never use pseudo-code when real code exists.** Pseudo-code signals that the author either did not implement the idea or does not trust the reader to handle real syntax. Exception: if the concept applies identically across 5+ languages and a language-specific implementation would distract from the structural point -- but even then, follow the pseudo-code block with one real implementation.

3. **Never make a performance claim without stating the benchmark methodology.** "3x faster" without hardware specs, test duration, load profile, and measurement tool is advertising copy. State at minimum: the tool used (wrk, k6, criterion, jmh, pyperf), the number of iterations or duration, the hardware class (not the specific machine), and the software versions.

4. **Code explanation always follows the code block, never precedes it.** Developers scan for code blocks first. If prose comes before the code, the developer will scroll past it to find the code, then scroll back to read the explanation -- creating a bad reading experience. Show the code. Immediately explain the non-obvious decisions.

5. **Every code block must specify a language identifier.** Syntax highlighting is table stakes for technical blog posts. A plain ``` block signals a lazily prepared post. Use the correct identifier: ```python, ```go, ```rust, ```typescript, ```sql, ```yaml, ```bash, ```dockerfile.

6. **The trade-offs section is not optional.** Any technical post without trade-offs is incomplete. A post that presents an approach as purely beneficial will be dismissed by senior engineers who know that every choice involves trade-offs. If the user cannot name a trade-off, ask: "What would you have to monitor more carefully because of this change? What problem does this not solve? What would cause you to reverse this decision?"

7. **Never conflate trade-offs with limitations.** A trade-off is something consciously sacrificed to gain a benefit (e.g., cache staleness accepted to gain latency improvement). A limitation is something the approach does not address at all (e.g., a caching layer does not help with write-heavy workloads). They belong in the same section but must be labeled differently.

8. **Keep individual code blocks to 10-40 lines.** Blocks longer than 40 lines lose readers who are scanning. If the complete implementation is longer, split at logical boundaries with 2-4 sentences of explanation between each block. Each block should demonstrate one concept.

9. **The conclusion states the transferable insight, not a summary.** "In conclusion, we have seen that caching reduces database load" summarizes what the reader just read. "Measure your actual request re-read interval before choosing a TTL -- the optimal TTL is a data question, not a best-practices question" gives the reader something to take back to their own system.

10. **Diagram descriptions must name every component and the direction of every interaction.** "The request goes through our infrastructure to the backend" teaches nothing. "A POST request to /api/v2/orders passes through the AWS ALB, reaches the FastAPI application on port 8000, is validated by the Pydantic schema layer, written to the PostgreSQL orders table, and an OrderCreated event is published to the orders Kafka topic partition determined by order_id modulo 12" is specific enough to be useful.

11. **Variable names in code examples must be meaningful.** Readers copy and adapt code examples. If the example uses `x`, `data`, `result`, or `temp`, those names will propagate into production codebases. Use names that communicate intent: `user_dashboard_ttl_seconds`, `cache_miss_count`, `primary_replica_pool`.

12. **For posts about failure or incidents, name the specific cause without assigning personal blame.** "The on-call engineer ran the wrong command" is a blame assignment. "The runbook step 4 did not specify which cluster to target, and the command was run against production instead of staging" is a system failure that can be fixed. Personal blame reduces the post's credibility and its usefulness.

---

## Edge Cases

### Postmortem / Incident Narrative

When the post is about a system failure, outage, or serious bug in production, restructure as a formal postmortem with narrative context. Open with the impact statement (users affected, duration, data loss if any) before explaining anything technical. Follow with a timeline using real or approximated timestamps: "14:23 -- alert fires on p99 latency exceeding 5s; 14:31 -- engineer identifies elevated error rate on order-service; 14:45 -- root cause identified as exhausted connection pool." The root cause section must describe a chain of contributing factors, not a single villain: "The connection pool was exhausted because: (1) the slow query timeout was not set, allowing queries to hold connections for up to 60 seconds; (2) a traffic spike doubled the query rate; (3) the pool size had not been updated when the team increased the number of application instances." The prevention section must describe specific actions taken (not planned), with the engineer or team responsible for each. End with the transferable lesson -- the pattern that caused this incident that other teams should check for in their own systems.

### Technology Comparison Post

When the post compares two or more technologies (frameworks, databases, languages, queue systems), the structure must be explicitly fair and criterion-driven. Define the comparison dimensions at the start -- do not let them emerge organically, because that usually means the author chose dimensions that favor their preference. Required dimensions for most comparisons: performance at defined load, operational complexity, learning curve, community/support maturity, and the failure modes specific to each. Show the same task implemented in each technology with identical scope -- if you show Redis with connection pooling, show Memcached with connection pooling too. Use a summary comparison table at the end with the dimensions as rows and the technologies as columns. End with an explicit "When to choose each" section: "Choose Redis when you need pub/sub, sorted sets, or Lua scripting. Choose Memcached when you need the simplest possible cache with maximum multi-threaded throughput and do not need persistence." Never declare a winner without naming the context that makes one superior.

### Post Without Quantitative Data

Some technically valid posts do not have benchmark numbers -- a refactoring for maintainability, an architectural change for future flexibility, a debugging technique that cannot be easily quantified. In these cases, explicitly acknowledge the evidence type: "The improvement here is qualitative -- we measure it in reduced cognitive load and faster onboarding, not milliseconds." Then provide the best available evidence: number of lines removed, number of components eliminated, time for a new engineer to make their first change (if measurable), reduction in support questions or incidents. If the evidence is purely experiential, say so, and compensate with more thorough trade-off analysis -- the reader needs to trust the author's judgment more because they cannot verify the numbers.

### Code Security Sensitivity

When the post describes authentication, authorization, cryptography, secret management, or known vulnerabilities, apply these rules strictly: use clearly synthetic credentials in all code examples (`api_key = "sk-test-REPLACE-WITH-YOUR-KEY"`, `password = "REPLACE-WITH-STRONG-PASSWORD"`). Never use real internal hostnames, IP ranges, or database names. For vulnerability disclosures, confirm the fix has been deployed and the disclosure timeline (if involving a third-party library or vendor) has been followed before publishing. When showing encryption or hashing code, use current recommended algorithms only (AES-256-GCM, Argon2id, bcrypt with cost >= 12, SHA-256 or higher) -- do not show deprecated algorithms even in "bad example" blocks without an explicit "NEVER USE" label, because readers copy examples without reading the surrounding text.

### Very Long Post (2,000+ Words)

Posts over 2,000 words require explicit navigability. Add a table of contents after the opening paragraph but before the first section. The TOC must use anchor links if the platform supports them. Consider splitting the post into a two-part or three-part series, but only at natural argument boundaries -- never mid-investigation or mid-code example. Each part must have its own complete argument and conclusion. Part 2 should link to Part 1 but must be useful to a reader who has not read Part 1. If the post is a single long argument that cannot be split, use progressive disclosure: start with the high-level answer in the first 300 words (for the reader who will skim), then go deep for the reader who needs the full implementation.

### Post About Proprietary or Confidential Systems

When the user's architecture or code cannot be published directly (internal systems, NDA-covered technology, competitive-sensitive implementations), generalize the structure while preserving the technical depth. Replace proprietary service names with generic descriptors ("our internal feature flag service" instead of the actual product name). Replace specific business metrics with relative improvements ("response time improved 68%" rather than absolute values that reveal traffic volume). The code examples must still be real -- synthesize equivalent code using open-source libraries that implement the same pattern. The architecture description should describe the pattern, not the specific implementation: "a read-through cache with write-invalidation and a 5-minute TTL" conveys the full technical insight without revealing which specific cache service was used. Check with the user whether the post needs legal or security review before publishing -- engineering blog posts at companies with competitive products often do.

### Post Targeting a Specialist Audience

When the audience is specialists in a specific technology stack (e.g., Rust engineers, Kubernetes operators, CUDA developers), adjust the baseline knowledge assumptions sharply. Do not define borrow checking to a Rust audience. Do not explain what a Pod is to a Kubernetes audience. Start the explanations at the frontier of what most specialists know, not at the basics. Use the community's established vocabulary precisely -- "futures" means something specific in Rust and something different in Java; "operator" means something specific in Kubernetes. Reference the relevant specification, RFC, or upstream source when discussing non-obvious behavior ("this is defined in the Kubernetes API spec under the controller reconciliation loop section, not in the user-facing documentation"). Name known limitations or open issues by their GitHub issue number or KEP number if relevant -- this signals that the author is tracking the upstream project, not just using the tool.

---

## Example

**Input:** "Write a technical blog post about how we sped up our Python data pipeline by switching from row-by-row database inserts to bulk inserts using PostgreSQL's COPY protocol."

**Output:**

---

# From 4,200 Rows/Second to 380,000 Rows/Second: Replacing INSERT Loops with PostgreSQL COPY

We were ingesting 200 million sensor readings per day into PostgreSQL, and our Python pipeline was falling 6 hours behind by end of day. The cause was not network bandwidth, not disk I/O, not even query planning -- it was the overhead of 200 million individual INSERT statements, each requiring a full round-trip, a transaction commit, and a constraint check in isolation. Switching to PostgreSQL's native COPY protocol eliminated 98% of that overhead and brought the pipeline back to real-time within 45 minutes of deploy.

## The Problem

The ingestion pipeline received batches of sensor readings from a Kafka consumer and wrote them to a `sensor_readings` table using SQLAlchemy's standard ORM session:

```python
# Before: one INSERT per row, executed in a loop
async def persist_readings(session: AsyncSession, readings: list[SensorReading]) -> None:
    for reading in readings:
        session.add(
            SensorReadingRow(
                sensor_id=reading.sensor_id,
                recorded_at=reading.recorded_at,
                value=reading.value,
                unit=reading.unit,
            )
        )
    await session.commit()
```

At 200 million rows per day, this loop executes 200 million separate INSERT statements. Each INSERT in PostgreSQL requires: parsing the SQL, acquiring a row-level lock, performing constraint checks (NOT NULL, foreign key on `sensor_id`), writing to the WAL, and releasing the lock. Even at 1ms per insert -- optimistic for a network-connected database -- that is 55 hours of serial work.

Profiling with `py-spy` confirmed the bottleneck: 81% of pipeline CPU time was spent in `asyncpg`'s `execute()` call, waiting on PostgreSQL acknowledgment.

## Investigation

We ran an `EXPLAIN ANALYZE` on the INSERT to confirm there was no missing index causing table scans:

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
INSERT INTO sensor_readings (sensor_id, recorded_at, value, unit)
VALUES ('sensor-001', '2024-03-15 14:23:00', 22.4, 'celsius');
```

The plan showed an index scan on the foreign key constraint (`sensor_id` references `sensors.id`) on every insert. With 50,000 distinct sensors in the database, each foreign key check hit the index cleanly -- this was not the problem. The problem was the per-row overhead: 200 million round-trips each carrying 1 row of payload.

`pg_stat_statements` confirmed the diagnosis:

```sql
SELECT calls, mean_exec_time, total_exec_time, query
FROM pg_stat_statements
WHERE query LIKE '%INSERT INTO sensor_readings%'
ORDER BY total_exec_time DESC
LIMIT 1;
```

Output: `calls: 12,400,000`, `mean_exec_time: 1.8ms`, `total_exec_time: 22,320,000ms` -- 6.2 hours of query execution time in a single measurement window.

## The Solution

PostgreSQL's COPY protocol streams rows as a delimited text or binary stream in a single connection operation, bypassing SQL parsing, statement planning, and individual transaction overhead for every row. The database processes the entire batch as one operation.

Python's `asyncpg` library exposes COPY directly via `copy_records_to_table()`, which accepts an iterable of tuples and streams them using the binary COPY format.

### Bulk Writer Implementation

```python
import asyncpg
from datetime import datetime
from typing import Sequence

async def persist_readings_bulk(
    conn: asyncpg.Connection,
    readings: Sequence[SensorReading],
) -> int:
    """
    Inserts sensor readings using PostgreSQL COPY protocol.
    Returns the number of rows inserted.
    Raises asyncpg.PostgresError on constraint violation.
    """
    records = [
        (r.sensor_id, r.recorded_at, r.value, r.unit)
        for r in readings
    ]

    row_count = await conn.copy_records_to_table(
        table_name="sensor_readings",
        records=records,
        columns=["sensor_id", "recorded_at", "value", "unit"],
        schema_name="public",
    )
    return row_count
```

`copy_records_to_table()` sends all records in a single binary stream. The connection does not issue individual INSERT statements -- PostgreSQL receives the data through its internal COPY pathway, which skips the SQL parser entirely and writes directly to the storage manager.

The columns list is explicit rather than positional. When the table schema changes, an explicit column list prevents silent data misalignment.

### Handling Constraint Violations in Bulk Operations

The tradeoff with COPY is that a single invalid row fails the entire batch -- PostgreSQL does not support partial batch commits for COPY. We handle this with a two-stage strategy:

```python
async def persist_with_fallback(
    conn: asyncpg.Connection,
    readings: Sequence[SensorReading],
) -> tuple[int, int]:
    """
    Attempts bulk COPY insert. On failure, falls back to row-by-row
    INSERT with ON CONFLICT DO NOTHING to isolate invalid rows.
    Returns (inserted_count, rejected_count).
    """
    try:
        inserted = await persist_readings_bulk(conn, readings)
        return inserted, 0
    except asyncpg.ForeignKeyViolationError:
        # Unknown sensor_ids in this batch -- fall back to per-row insert
        inserted = 0
        rejected = 0
        for reading in readings:
            try:
                await conn.execute(
                    """
                    INSERT INTO sensor_readings (sensor_id, recorded_at, value, unit)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT DO NOTHING
                    """,
                    reading.sensor_id, reading.recorded_at,
                    reading.value, reading.unit,
                )
                inserted += 1
            except asyncpg.ForeignKeyViolationError:
                rejected += 1
        return inserted, rejected
```

In practice, foreign key violations are rare (less than 0.01% of readings reference an unknown sensor) because sensor registration precedes data ingestion by at least 30 seconds. The fallback path is exercised only when a sensor is deregistered mid-batch, which occurs during maintenance windows.

### Batch Size Tuning

The optimal batch size depends on row size, available memory, and the frequency of constraint violations:

```python
BATCH_SIZE_ROWS = 25_000  # Tuned empirically for ~4MB per batch

async def process_kafka_partition(consumer: KafkaConsumer) -> None:
    batch: list[SensorReading] = []

    async for message in consumer:
        reading = SensorReading.from_bytes(message.value)
        batch.append(reading)

        if len(batch) >= BATCH_SIZE_ROWS:
            await persist_with_fallback(conn, batch)
            batch.clear()

    if batch:  # Flush remaining rows at end of partition
        await persist_with_fallback(conn, batch)
```

We tested batch sizes from 1,000 to 100,000 rows. Below 5,000 rows, the per-batch TCP round-trip overhead becomes significant. Above 50,000 rows, PostgreSQL's temporary memory allocation for the COPY operation spikes and we observed occasional OOM kills on the database server. 25,000 rows at ~160 bytes each is ~4MB per batch, which fits comfortably within PostgreSQL's `work_mem = 16MB` setting.

## Results

Measured in production over 7 days, same Kafka partition, same server hardware (8-core, 32GB RAM application server; PostgreSQL 15 on 16-core, 64GB RAM with NVMe SSD).

| Metric | Before (INSERT loop) | After (COPY bulk) | Change |
|--------|----------------------|-------------------|--------|
| Ingestion throughput | 4,200 rows/sec | 382,000 rows/sec | +9,000% |
| Pipeline lag at peak | 6.2 hours | < 3 minutes | -99.2% |
| DB CPU at peak | 71% | 22% | -49 percentage points |
| Application CPU at peak | 83% | 31% | -52 percentage points |
| p99 batch latency | 4,200ms | 68ms | -98.4% |

The application CPU drop was unexpected. The SQLAlchemy ORM layer was generating Python objects for each row on insertion (for dirty tracking). Removing the ORM from the write path eliminated that overhead.

## Trade-offs and Limitations

- **No partial batch success:** If a COPY batch contains one row with a null value in a NOT NULL column, the entire batch rolls back. Our two-stage fallback handles foreign key violations but not all constraint types. We pre-validate NOT NULL fields in Python before building the records list, adding ~2ms of overhead per batch.
- **No ON CONFLICT handling in COPY:** COPY does not support `ON CONFLICT DO NOTHING` or upsert semantics. For idempotent pipelines that may re-process Kafka partitions, duplicate rows must be handled either by deduplication before ingestion or by a post-ingest deduplification step. We run a nightly deduplication job on the `(sensor_id, recorded_at)` unique index.
- **Bypasses SQLAlchemy ORM events:** Any `after_insert` event listeners registered on the ORM model will not fire for COPY-inserted rows. We had one audit log listener that silently stopped working after this change -- caught in staging because we verified audit records before deploying.
- **Binary COPY format is PostgreSQL-specific:** This implementation is not portable to MySQL, SQLite, or other databases. The pattern applies broadly (bulk load APIs exist in most databases), but the code does not.
- **Memory footprint:** 25,000 rows held in a Python list consume approximately 30-50MB of application memory depending on value distribution. For pipelines running on memory-constrained instances (under 1GB), reduce BATCH_SIZE_ROWS to 5,000-10,000.

## Key Takeaway

The unit of optimization for write-heavy PostgreSQL workloads is the number of round-trips, not the number of rows -- reducing from 200 million INSERT statements to 8,000 COPY operations eliminated more overhead than any query optimization could have.

Before tuning a slow ingestion pipeline, measure `mean_exec_time` and `calls` in `pg_stat_statements`. If `calls` is within an order of magnitude of your row count, you are paying per-row overhead, and bulk protocols will deliver larger improvements than any index or schema change.

---

*Technologies: Python 3.12, asyncpg 0.29, PostgreSQL 15.4, aiokafka 0.10*
*Measured in: AWS us-east-1 production, 7-day window, March 2024, peak 12,000 Kafka messages/second*
