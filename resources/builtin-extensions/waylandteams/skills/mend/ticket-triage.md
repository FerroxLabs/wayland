# Ticket triage

## When to load this mode

You're staring at an inbox or single message and someone asks "how should we handle this," "what's the priority," or "draft a reply." Load when the question is classifying, prioritizing, and routing a ticket — not the onboarding path (`onboarding-flow.md`), not the 30-day-quiet customer (`churn-prevention.md`).

## What triage is for

Triage sorts tickets fast enough that important ones get attention while easy ones get answered. The trap: spending equal care on every ticket — the churning customer waits behind the keyboard-shortcut question. Sort first, respond second.

The other trap: triaging by tone. The loudest customer isn't always the worst-off. A polite "is your service down again?" can be P1; an angry rant about a missing feature can be P3.

## The priority sort — P0 to P3

Sort by impact on the customer's Desired Outcome, not by volume in the email.

- **P0 — Outage / data loss / billing breach.** Product broken for many, customer locked out, charged in error. Target: minutes. Acknowledge before you have an answer. Route defect to `smith` and billing error to `coin` within the hour.
- **P1 — Blocked from Desired Outcome.** One customer can't do the thing they bought the product to do. Activation broken, core workflow failing, integration dropping data. Target: hours. Reply names what's broken, what you're doing, and a workaround if one exists.
- **P2 — Friction, not block.** Customer reaches the outcome but the path is awkward. Target: same business day. Solve the immediate question; flag friction upstream if seen twice.
- **P3 — Question, request, opinion.** How-to, feature request, "have you considered." Answer or route honestly. "Not on the roadmap" beats "we'll consider it" when the latter is a lie.

## Response framework — not a script

You write the framework; the human (or tuned AI) fills it in their voice. Four moves:

1. **Name what happened** in the customer's words. "You ran the export and got an empty file" — not "we received your inquiry regarding output."
2. **Tell them what you know** about cause. If unknown, say so with a time you'll know. "We're looking into it" with no timeline trains escalation.
3. **Tell them what to do now** — workaround, what not to do, or "nothing on your end."
4. **One next-step commitment** with a name and date. Vague "we'll follow up" is continuation, not advancement.

Generic templates ("Hi [Name], thanks for reaching out") are worse than silence — they signal no human read it.

## Escalation matrix

- **Product defect:** route to `smith` with repro steps, frequency, customer-impact estimate.
- **Pricing complaint or non-policy refund:** loop in `forge` for pricing, `coin` for refund finance. No custom refunds without sign-off.
- **Legal threat, ToS challenge, chargeback:** route to `sentry`. Stop responding substantively until they're in the thread.
- **Pattern across 3+ tickets:** flag in `TEAM_MEMORY.md` under `## Support`. Three of the same ticket is a product signal.
- **Expansion-ready customer:** route to `sales`. That's an expansion talk, not a support reply.

## Decision rules

- **Acknowledge within the band's target,** even if the answer takes longer. Silence reads as not-caring.
- **Don't promise fixes you don't control.** "I'll get an answer by Friday" — not "we'll have it fixed by Friday."
- **Don't over-apologize.** "Sorry that broke — here's what we're doing" beats "we're so sorry for any inconvenience."
- **Close the loop after the fix.** A P1 customer who waited a week hears from you when it ships. Otherwise they assume you forgot.

## Anti-patterns

- **Triaging by tone.** Loud ≠ important. Sort by impact on Desired Outcome.
- **Canned auto-pilot.** "Thanks for reaching out, your ticket is important to us" — every customer recognizes it.
- **Apologizing without acting.** Three "so sorry" emails with no fix is worse than one "this is broken, here's the workaround, fix Thursday."
- **Promising the roadmap.** "We'll consider that" when nobody has compounds.
- **Letting P3 starve out P1.** Easy tickets clear fast and feel productive. Discipline pulls back to the hard ones.

## Before / after

**Before (canned, no Desired Outcome lens):**

> Hi there, thanks for reaching out. We appreciate your feedback and have logged your concern. Our team will review and get back to you as soon as possible.

The customer has no idea anyone read it. They escalate.

**After (framework, customer voice, named next step):**

> You tried to export the invoice batch and got an empty file. Known defect in the v3.2 export — we shipped a regression last Tuesday, fix is in QA. Workaround: per-invoice download from the detail page; slower but the file is correct. I'll write back when the fix ships, which engineering estimates Friday.

Specific, honest, one dated next step. The customer waits without escalating.
