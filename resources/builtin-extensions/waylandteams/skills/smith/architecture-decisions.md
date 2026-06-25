# Architecture decisions

## When to use

Use this skill when a build requires a technical call that will be expensive to reverse later. Storage choice. Sync vs. async. Library swap. Monolith vs. service split. Schema shape for a domain object the rest of the system will lean on. Auth boundary. The test: if you'd be embarrassed to discover six months from now that nobody wrote down *why*, write the ADR now.

You are not implementing the decision here. You are writing it down so the coding agent (and the team's future self) can act on it without re-litigating.

## Procedure

1. **Name the decision in one sentence.** Start with the verb. *"Store notification state in Postgres rather than Redis."* Not *"Notifications architecture v2."* A decision has a subject and an object.

2. **State the forces.** Two to four bullets on what's pushing on this call. Volume expected. Read/write ratio. Durability requirement. Team skill. Existing infra. Budget. The forces are the reason the decision is non-obvious; no forces, no ADR.

3. **List the options considered.** At least two, ideally three. Each gets a name, a one-line description, and one line on what the system would look like if picked. Do not skip options "we'd never pick" — recording the rejected option is half the value.

4. **Build the tradeoff table.** Three or four columns max — pick dimensions that actually matter for this decision, not a generic checklist. Common dimensions: operational cost, latency, durability, team familiarity, reversibility, blast radius on failure. Rate each option on each dimension in plain words (`fast`, `slow`; `cheap`, `pricey`; `reversible in a day`). Numbers are fine if you have them; do not invent them.

5. **State the decision and the reason.** One sentence for the decision. Two to four sentences for the reason, written as *"We picked X because of forces A and B; we rejected Y because it failed dimension Z."* The reason ties back to the forces and the tradeoff table. If the reason is "it felt right," the ADR isn't ready.

6. **Run the regret check.** Ask: *"What would we regret in six months if this is wrong?"* Write the failure mode, the early warning sign, and the rough cost of reversing. Small regret cost plus obvious warning sign means you can commit fast. Large regret cost and no warning sign means slow down and prototype before deciding.

7. **Record consequences and follow-ups.** Bullet list of work this decision creates: schemas to migrate, libraries to add, tests to write, docs to update. The coding agent reads this list directly.

## Decision rules

- If you can't list two options, you don't have a decision — you have a preference. Find a real alternative or drop the ADR.
- If every dimension favours one option, the decision is obvious and doesn't need an ADR. Save the format for real tradeoffs.
- If the regret cost is "we'd rewrite the system," spike before committing. ADRs are for decisions you intend to keep.
- If the team has shipped behaviour that depends on a choice, the ADR documents the *de facto* call. Date it back and note it was retroactive.

## Anti-patterns

- Writing the decision first, tradeoffs second. The tradeoff table is meant to constrain the decision; if it comes after, it's rationalization.
- Vendor-marketing dimensions ("scalability," "future-proof") you cannot actually rate. Replace with concrete dimensions you can answer in plain words.
- Skipping rejected options to "save space." The rejected options are why the chosen one is defensible.
- Treating the ADR as a one-way door. ADRs can be superseded — note it: *"Superseded by ADR-014 on 2026-09-01."*

## Before-and-after

**Before:** *"We're going with Postgres for notification state. It's what we use already."*

**After (ADR):**
- **Decision:** Store notification state in Postgres rather than Redis or a managed queue.
- **Forces:** <10k notifications/day. Must survive a restart. Team operates one Postgres cluster. No ops capacity for a new datastore.
- **Options:** (a) Postgres table. (b) Redis with persistence on. (c) Managed queue.
- **Tradeoffs:** Postgres — slow at very high write rates, trivial to operate, durable. Redis — fast, durability needs ops we don't have. Managed queue — durable, but access pattern is "read-by-user" not "drain-the-queue."
- **Decision and reason:** Postgres, because volume sits inside its envelope and we avoid a new operational surface.
- **Regret check:** If volume jumps 100x, write contention. Warning sign: p95 insert latency above 50ms. Reversal: ~1 week to add a Redis-backed cache, Postgres as system-of-record.
- **Follow-ups:** Migration `2026-05-18-notifications`. Index on `(user_id, created_at)`. Drop `redis-notifications` config in env files.

The "after" is something the coding agent and the on-call engineer can act on; the "before" is a hallway conversation re-litigated in three months.
