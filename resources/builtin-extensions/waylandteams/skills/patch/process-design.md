# Process design — SOPs from chaos

## When to load this mode

The user says "we need to document this," "I'm tired of explaining this," "the new hire keeps getting it wrong," "Maria's out and everything stopped," or "we need an SOP." Load for SOPs, playbooks, training material. If they want a 30-page ops manual, push back: build the one-page version of the broken thing first.

## What an SOP is for

An SOP exists for one reason: a thing breaks the same way more than twice, and somebody needs to do it right without the original operator.

An SOP for a process nobody runs wrong is wallpaper. A twelve-page SOP is a document; checklists get followed. Goal: the shortest written thing that prevents the next failure.

## The procedure

**1. Find the failure mode first.** Don't ask "what's the process for X?" Ask: "When was the last time X went wrong?" Get the specific failure — the wrong invoice, the missed handoff, the new hire who shipped without sign-off. Write it in one sentence. If you can't name a failure mode, the SOP is premature.

**2. Trace the actual current path.** Sit with the operator and walk through the last real instance — the one with the workarounds. Where did they pause? Check? Decide? Hand off, to whom? Write each step in present-tense imperative ("Send invoice to client@…").

**3. Find the decision points.** A process is two things: routine steps anyone can do, and decisions only some can make. Mark each step **routine** or **decision**. Decision steps need a rule: "Refund under $X — refund. Over $X — escalate to founder." Failed SOPs over-document routine and under-document decisions.

**4. Write the one-page version.** Title is the failure it prevents. Body is numbered steps with decisions called out and the handoff named. Bottom is the exception path: "If [X] happens — escalate to [name]." Doesn't fit on one page? You have two SOPs.

**5. Test it on the next operator.** Have them run it without you in the room. Every question is a missing line. Every skipped step is a line to cut. Revise once. Lock it.

**6. Stamp it in `TEAM_MEMORY.md`.** Title + one-line summary + owner + date locked. The team can find it; you can refuse to re-decide it next time.

## Decision rules

- **Two failures of the same kind = write the SOP.** One failure is a story. Two is a pattern.
- **One page per SOP. Always.** Twelve pages means twelve SOPs not yet separated, or eleven pages of theory nobody reads.
- **Owners, not committees.** Every SOP has one owner who updates it when reality changes. Shared ownership rots fastest.
- **Update the SOP the day the workaround starts.** If the operator says "I just skip step 3" — fix the SOP or kill step 3. Never leave both written and let the workaround live.
- **Date every SOP.** A six-month-old SOP describing a tool you no longer use is a trap for the next hire.

## Anti-patterns

- **Documenting the happy path only.** That's the part the operator already does fine. Capture the exception path — that's where things break.
- **Process by template.** A generic "client onboarding template" has nothing to do with your business. Start from the failure.
- **The 30-page operations manual.** Built once, never read. Replace with a folder of one-pagers.
- **Documenting before stabilizing.** If the process changes every two weeks, an SOP locks in the wrong version. Wait until it runs successfully three times.
- **"Be detail-oriented" in an SOP.** Not a step. A hope. Replace with the specific check: "Confirm invoice number matches PO; if not, pause and message ops."
- **Writing the SOP so the founder can step away.** The founder steps away only after the SOP runs three times without questions.

## Before / after

**Before:**

> User: "Our client onboarding is a mess. Write me a comprehensive onboarding SOP."

Wrong move: draft a 12-step playbook covering contract, kickoff, asset collection, emails, first deliverable, check-in. Nothing is grounded in what failed.

**After:**

> "What's the most recent onboarding that went wrong, and what was the specific moment?"
>
> User: "Last month we sent the kickoff deck to the wrong stakeholder. The decision-maker showed up confused."
>
> SOP: *"Kickoff prep — preventing wrong-stakeholder error."* Step 1: confirm decision-maker in signed proposal. Step 2: send kickoff deck to that named person (cc signing contact). Step 3: 24-hour confirm-receipt before scheduling. Decision: no response in 48h → escalate to account owner. Exception: mid-engagement decision-maker change → halt and re-run step 1.
>
> One failure, one page, one owner. Run three times. A different failure mode is a different SOP — not an addition.
