---
name: meeting-notes
description: |
  Structures meeting notes with decisions made, action items with owners and due
  dates, and key discussion summaries in a scannable format. Use when the user
  needs to write up meeting notes, capture action items, or document meeting
  outcomes. Do NOT use for meeting agendas (use `meeting-agenda`), status updates
  (use `status-update`), or business memos (use `business-memo`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "writing business-writing template"
  category: "writing"
  subcategory: "business-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Meeting Notes

## When to Use

Use this skill when the user needs to transform raw meeting content -- spoken discussion, rough notes, transcripts, or recalled conversation -- into a structured, shareable document that captures decisions, accountability, and context.

**Trigger scenarios:**

- User attended a meeting and needs to write it up before distributing to attendees and stakeholders
- User has a transcript, recording summary, or bullet-point dump from a meeting and needs it structured
- User was asked to take minutes and needs a professional format for their organization
- User needs to document that a specific decision was made, by whom, and on what basis -- for audit or legal reasons
- User wants to send a follow-up to a client, vendor, or cross-functional team with clear action item ownership
- User needs to create a record for team members who were absent, in different time zones, or joining a project mid-stream
- User is building a recurring meeting record system and needs consistent format across multiple sessions

**Do NOT use when:**

- The user wants to plan a future meeting -- use `meeting-agenda` instead
- The user wants a weekly or sprint status rollup -- use `status-update` instead; meeting notes capture one specific session, not ongoing project health
- The user wants a formal internal communication -- use `business-memo` instead; memos are authored and distributed, not transcribed from discussion
- The user wants a formal project or research report -- use `business-report` instead
- The user needs a decision log covering multiple meetings over time -- that is a project artifact, not meeting notes
- The user is describing a 1:1 performance conversation -- those follow different confidentiality and HR documentation standards
- The user wants a legal deposition or formal regulatory record -- those require verbatim transcription, not summary, and involve legal protocols beyond this skill

---

## Process

### Step 1: Gather All Raw Inputs Before Writing Anything

Before structuring a single word, collect everything available about the meeting. Missing context produces notes that contradict what participants remember, which destroys trust in the document.

- Ask for the meeting title, date, exact time, and time zone -- ambiguous timestamps cause confusion for distributed teams and time-stamped records
- Ask for the full attendee list with names, roles, and department or company affiliation (external guests must be clearly labeled)
- Ask who was absent but should have been present -- absences affect accountability and signal when a decision had incomplete stakeholder input
- Ask for the facilitator's name and the note-taker's name -- these are different people and both matter for accountability
- Collect the raw source material: rough bullets, full transcript, voice memo summary, or the user's recalled points
- Ask whether there is a prior action item list to reconcile -- recurring meetings always require a status check on previous commitments
- Confirm whether any content is confidential or off-the-record, so those items are handled correctly or excluded

### Step 2: Triage the Raw Content Into Four Categories

Before writing, sort every piece of raw content into one of four buckets. This triage is the core intellectual work of meeting notes -- it is not transcription, it is synthesis.

- **Decisions**: A conclusion that closes a question and commits the organization to a course of action. Test: "Could someone cite this to justify spending money, changing direction, or holding a person accountable?" If yes, it is a decision.
- **Action items**: A specific task assigned to a specific person with a deadline. Distinguish from vague intentions ("we should think about pricing") -- intentions are discussion points, not action items.
- **Discussion summaries**: The reasoning, evidence, and debate that led to decisions or that surfaced issues for future resolution. This is context, not commitment.
- **Deferred items**: Topics that were raised but not resolved, explicitly postponed, or abandoned mid-meeting. Capture these so they are not permanently lost.

When the user provides ambiguous content, ask: "Was a conclusion reached, or was this just discussed?" That single question resolves 80% of triage uncertainty.

### Step 3: Write Decisions as Closed, Declarative Statements

Every decision entry must be self-contained -- a reader who was not in the room must understand what was decided, why, and who is accountable for it.

- Use past tense declarative structure: "The team approved...", "Leadership decided...", "Budget was set at..."
- State the specific outcome, not the process: "Launch moved to March 15" not "Launch date was discussed and a new date was considered"
- Include the decision authority: who approved it, what level of sign-off was present, and whether the decision is final or provisional
- Include a one-sentence rationale if the reasoning is not obvious from context -- this prevents the decision from being relitigated in the next meeting
- If a decision was made by vote, note the vote count: "Approved 4-1, with James dissenting on timeline" -- this prevents later revision of what "consensus" meant
- Flag provisional decisions explicitly: "Tentatively approved pending legal review" is a different category than "Approved"
- Never write a decision as a question or a recommendation -- if the meeting did not close the question, it belongs in Deferred Items, not Decisions

### Step 4: Write Action Items With Full Accountability Architecture

Action items are the most time-sensitive part of meeting notes and the most commonly written incorrectly. Vague action items are not followed through -- they create the illusion of accountability without the substance.

- Assign every action item to exactly one named person -- never a team, a role in the abstract, or "TBD". If ownership is genuinely unclear, note it as "Owner needed: [topic]" and assign someone to resolve ownership by a specific date
- Write the task as a specific deliverable, not a vague activity: "Deliver 3 pricing tier models with revenue projections at $19, $29, and $39" not "Work on pricing"
- Include a hard due date, not a relative one: "March 5" not "next week" or "soon" -- relative dates expire as soon as the notes are shared
- Note dependencies: if one action cannot start until another is complete, say so explicitly
- Note the output type: is the owner writing a document, making a phone call, running an analysis, scheduling a meeting, getting an approval? Specificity reduces misunderstanding
- If a ticket number, Jira card, or tracking system reference exists, include it -- this connects meeting notes to the system of record
- Assign a default status of "Open" to every new item -- this supports the recurring meeting check-in at the next session

### Step 5: Write Discussion Summaries That Serve the Absent Reader

The discussion summary section is written for people who were not in the room. It is not for the attendees, who lived the conversation -- it is for the executive who delegated attendance, the team member on leave, or the future reader reviewing why a decision was made.

- Limit each topic summary to 3-5 sentences maximum. If a topic needs more than that, it either has multiple sub-decisions that should each be documented separately, or it needs a separate document entirely.
- Capture the key arguments made, not who made them (unless attribution matters for accountability or record-keeping)
- Note dissenting views without turning the notes into a transcript: "A minority view held that Q2 launch was premature given sales team readiness" is useful. Quoting the argument verbatim is not.
- Capture data points that shaped the discussion: if a 12% bug rate drove a launch delay decision, that number belongs in the notes -- it is the evidence that makes the decision legible
- Do not editorialize or insert the note-taker's own opinion -- meeting notes are a shared organizational record, not commentary
- Note when a topic was cut short due to time constraints -- this is important for the Deferred Items section

### Step 6: Compile Deferred Items and Next Steps With the Same Rigor as Action Items

Deferred items are the most commonly dropped section, and their absence causes topics to disappear permanently from organizational memory.

- List every topic that was raised but not resolved, with a brief note explaining why it was deferred: "not enough data", "waiting on legal input", "decision authority not in the room"
- Assign a "return date" or "return condition" to each deferred item: "Return to pricing discussion when competitive analysis is complete (target: March 3 meeting)"
- If a deferred item was explicitly killed -- "we will not pursue this further" -- note that too. It prevents the topic from recurring unnecessarily.
- Record the next meeting date, time, time zone, and primary agenda focus if known
- If the next meeting is not yet scheduled, note "Next meeting: TBD -- Sarah to schedule by March 1" as an action item

### Step 7: Review for Completeness, Accuracy, and Tone

Before finalizing, run the notes through a structured review pass -- this is where errors get caught before distribution.

- Check that every person mentioned in the attendee list appears in at least one action item or that their non-ownership is explained -- attendee lists should connect to accountability
- Verify that every decision has a rationale and an authority attribution -- decisions without these two elements will be questioned or ignored
- Check that no action item lacks an owner, a due date, and a specific deliverable
- Confirm that the tone is neutral and professional -- meeting notes are organizational records that may be read by people outside the meeting, including senior leadership, auditors, or legal counsel
- Confirm that deferred items are listed and that at least one action item exists to bring them forward
- Keep the length proportional to meeting length: 30-minute meetings produce one page; 60-minute meetings produce two pages; 90-minute meetings should rarely exceed three pages. If notes run longer, the meeting lacked focus and the notes should be edited, not padded.
- Aim to distribute within two hours of meeting end for same-day retention -- the longer notes wait, the more attendees will mentally revise what they remember

### Step 8: Apply Meeting-Type Specific Adjustments

Different meeting types follow different documentation conventions. Identify the meeting type and apply the relevant adjustments before finalizing.

- **Executive briefings**: Lead with decisions and recommendations; omit granular discussion detail; include financial or resource implications for every decision
- **Client or vendor meetings**: Add a "Shared by [Company]" and "Shared by [Client]" distinction in discussion summaries; flag any commitments made to the external party in bold; include a section for "Open Questions from Client"
- **Sprint retrospectives or team reviews**: Replace "Decisions" with "What We're Keeping", "What We're Stopping", and "What We're Trying" -- standard retrospective categories
- **Board or governance meetings**: Use formal minutes conventions -- record motions, seconders, and vote tallies; note quorum status; flag any items requiring legal documentation
- **Brainstorming sessions**: Replace "Decisions" with "Ideas Captured" and mark each with a rough feasibility signal (Quick Win / Longer Term / Needs Research) without implying commitment
- **Incident post-mortems**: Add a "Timeline of Events" section and a "Root Cause" section before action items; every action item must map to a specific failure mode

---

## Output Format

The standard format below applies to most business meetings. Meeting-type specific adjustments are described in Step 8 above.

```
## Meeting Notes: [Meeting Title]

**Date:** [Weekday, Month Day, Year] | [Start Time] -- [End Time] | [Time Zone]
**Location / Platform:** [Room name, city, or video platform]
**Facilitator:** [Name, Role]
**Notes by:** [Name, Role]

**Attendees:**
- [Name], [Role / Department / Company]
- [Name], [Role / Department / Company]

**Absent (invited):**
- [Name], [Role] -- [reason if known]

---

### Decisions

1. **[Specific, declarative decision statement.]**
   Rationale: [One sentence.] Approved by: [Name / Group / Vote tally].

2. **[Specific, declarative decision statement.]**
   Rationale: [One sentence.] Approved by: [Name / Group / Vote tally].

*(If no decisions were made, write: "No decisions reached -- meeting was discussion only.")*

---

### Action Items

| # | Action | Owner | Due Date | Dependencies | Status |
|---|--------|-------|----------|--------------|--------|
| 1 | [Specific deliverable with output type] | [Full Name] | [Date] | [None / Item #] | Open |
| 2 | [Specific deliverable with output type] | [Full Name] | [Date] | [None / Item #] | Open |
| 3 | [Specific deliverable with output type] | [Full Name] | [Date] | [None / Item #] | Open |

---

### Discussion Summary

**[Topic 1 -- e.g., Q3 Roadmap Scope]:**
[3-5 sentences capturing key arguments, data points referenced, and any dissenting views.
Do not transcribe dialogue. Focus on substance.]

**[Topic 2]:**
[3-5 sentences.]

**[Topic 3]:**
[3-5 sentences.]

---

### Deferred Items

| Topic | Reason Deferred | Return Date / Condition |
|-------|----------------|------------------------|
| [Topic] | [Data not available / Decision authority absent / Time] | [Date or trigger event] |
| [Topic] | [Reason] | [Date or trigger event] |

---

### Previous Action Item Status *(recurring meetings only)*

| # | Action | Owner | Original Due | Status |
|---|--------|-------|-------------|--------|
| 1 | [Task from prior meeting] | [Name] | [Date] | Complete / In Progress / Overdue |
| 2 | [Task from prior meeting] | [Name] | [Date] | Complete / In Progress / Overdue |

---

### Next Meeting

**Date:** [Weekday, Month Day, Year] | **Time:** [Time + Zone] | **Platform / Location:** [Location]
**Primary Focus:** [One sentence describing the main agenda objective]
**Scheduling Owner:** [Name, if next meeting is not yet confirmed]
```

---

## Rules

1. **Every action item must have exactly one named human owner.** Teams, departments, roles, and initials are not valid owners. If ownership is genuinely disputed, write "Owner TBD -- [Name] to resolve by [Date]" and make resolving ownership its own action item.

2. **Never write a decision in past progressive or conditional tense.** "We were thinking about launching" and "We might move to March 15" are not decisions -- they are discussion fragments. A decision uses past declarative: "Launch date set to March 15."

3. **Never omit a rationale for a non-obvious decision.** Decisions without rationale get relitigated in the next meeting. A single sentence prevents this: "Rationale: checkout bug affects 12% of mobile completions and must be resolved before launch."

4. **Due dates must be calendar dates, not relative references.** "Next week", "by EOD", and "soon" expire the moment the notes leave the note-taker's hands. Use "March 5, 2026" every time.

5. **Discussion summaries are capped at 5 sentences per topic.** If more is needed, the topic either produced a decision (document it as such), produced an action item (document it as such), or needs a separate dedicated document. Long discussion summaries signal that synthesis was not done.

6. **Deferred items must include a return condition.** A deferred item without a return date or trigger event will never return. Every deferral must name either a date or a specific condition that brings it back: "Return when legal review is complete."

7. **Do not attribute opinions or arguments to specific individuals in discussion summaries unless attribution is necessary for accountability.** Meeting notes are a shared organizational record. Attributing positions can create interpersonal friction and discourage candid discussion in future meetings.

8. **External attendees must be explicitly labeled.** Any person from outside the organization -- client, vendor, partner, contractor -- must have their company affiliation noted in the attendee list. This matters for confidentiality, client billing, and relationship management.

9. **Provisional decisions must be labeled as provisional.** "Launch approved pending legal review" is fundamentally different from "Launch approved." If a decision requires a future sign-off, ratification, or condition to become final, that condition must appear in the decision entry.

10. **Notes must be distributed within 24 hours of meeting end -- ideally within two hours.** After 24 hours, participants begin revising their memory of what was decided. Late notes arrive into a landscape of competing recollections and become a source of conflict rather than resolution.

11. **Do not include every word spoken.** If a statement does not contribute to a decision, an action item, or necessary context for either, omit it. Meeting notes are a synthesis document, not a transcript. The test for every sentence is: "Does a reader who was not in the room need this to understand what was decided and what happens next?"

12. **Never write "we" in meeting notes.** Notes are a third-person organizational record: "The team decided", "Engineering committed to", "Sarah will". The first person erodes the document's function as a neutral record.

---

## Edge Cases

### No Decisions Were Made

Some meetings -- working sessions, brainstorms, information briefings -- produce no formal decisions. Do not force decisions where none exist.

Label the Decisions section: "No decisions reached -- meeting was discussion and planning only." This is not a failure state; it is accurate documentation. However, if a meeting that was supposed to produce decisions ended without them, add a deferred item: "Decision pending on [topic] -- [Name] to call for decision by [Date]." This signals to readers that the meeting's stated purpose was not met and flags what needs to happen next.

### Attendees Disagree on What Was Decided

This is one of the highest-risk situations in meeting documentation. When participants leave with different understandings of a decision, the notes are the only document that can prevent that conflict from escalating.

Document the disagreement explicitly and neutrally: "Decision status: contested. Sarah's interpretation: launch proceeds March 15 regardless of QA results. Mike's interpretation: launch proceeds March 15 only if QA passes. Resolution needed from VP of Product by March 3." Assign the resolution as an action item. Never pick a side by writing one interpretation as the decision -- that is not the note-taker's role.

### User Provides a Raw Transcript or Voice Memo Summary

Transcripts and voice memo summaries are the messiest input type. They contain filler language, repeated discussion, tangents, and social content that belongs nowhere in meeting notes.

Process in three passes. First pass: identify every statement that contains a decision, a task, or a data point. Mark these. Second pass: discard everything else -- greetings, tangents, social content, off-topic remarks. Third pass: organize the marked content into the four categories (decisions, action items, discussion, deferred). The output should be 20-30% of the transcript's length. If the user asks why so much was cut, explain that notes capture substance, not dialogue.

### The Meeting Ran Over Time and Topics Were Cut

When meetings run over, the final agenda items typically receive rushed or incomplete treatment. Document this accurately.

For any topic where discussion was cut short, note in the discussion summary: "Topic raised but not fully addressed due to time. Key points: [1-2 sentences on what was covered]." Move the topic to Deferred Items with return condition "Full agenda time at next meeting." Do not summarize a partial discussion as if it were complete -- that misrepresents what happened and may mislead people who were not present.

### Recurring Meeting With Overdue Action Items

In a recurring meeting format, the previous action item table often reveals that items are overdue. This must be handled carefully -- meeting notes document facts, but the note-taker is not a project manager.

Mark overdue items clearly in the Previous Action Items table with status "Overdue" and the original due date. Do not editorialize about why items are late. If the meeting discussed the overdue item and a new plan was made, document that plan as a new action item with a revised due date and note the original due date. Never silently roll over an overdue item with a new date -- the overdue status is part of the historical record.

### Confidential or Sensitive Content Was Discussed

Some meetings include content that should not appear in broadly distributed notes -- HR matters, unreleased financials, legal advice, acquisition discussions, or personnel decisions.

When the user flags sensitive content, create two versions: a full version with restricted distribution (named recipients only, labeled "Confidential") and a summary version for broader distribution that acknowledges the topic was discussed without revealing the content: "Legal risk discussion -- details in restricted notes." Ask the user to confirm the distribution list for each version before sending. Never include legal advice, HR decisions about named individuals, or M&A information in standard widely-distributed meeting notes.

### Meeting Had No Agenda and Discussion Was Scattered

Some meetings -- particularly informal team check-ins or crisis response calls -- have no agenda and produce a non-linear discussion that jumps between topics.

Do not try to reconstruct a linear narrative. Instead, sort all content by the four categories (decisions, actions, discussion, deferred) regardless of the order in which they were discussed. The structure of the notes is independent of the structure of the conversation. If topics overlapped significantly, use a single discussion summary labeled "General discussion" and summarize the major threads. The structure of the output format imposes clarity on an unstructured meeting -- that is exactly what it is designed to do.

### Board or Governance Minutes Requirements

Formal board minutes follow legal conventions that differ significantly from standard business meeting notes.

Board minutes must record: the date, time, and location; confirmation of quorum; names of all directors present and absent; any conflicts of interest declared; the exact wording of every motion; who moved and who seconded each motion; the vote tally for each motion (not just "approved"); any abstentions and the reason if stated; and the time of adjournment. Discussion summaries in board minutes are typically much briefer than in standard notes because the legal record focuses on what was formally decided, not why. Always ask whether board minutes will be reviewed by legal counsel before finalizing.

---

## Example

**Input from user:** "Can you write up notes from our product launch meeting? It was yesterday, Feb 21, 2026, 10 to 11 AM Pacific. Attendees were me (Sarah Chen, PM), Mike Torres from Engineering, Lisa Park from Marketing, James Wright from Design, and we had David Kim from our legal team join for part of it. Rachel Nguyen (CTO) was invited but couldn't make it. We decided to push the launch from March 1 to March 15 because Mike found a critical bug in the checkout flow that affects about 12% of mobile sessions. Mike will fix it by March 5 and QA will test it March 6-8. James needs to finalize the landing page designs by March 8 so we have time to implement before launch. Lisa will update the marketing calendar and notify the PR agency by February 28. We also talked about pricing -- Lisa brought competitive data showing our closest competitor is at $29/month. We floated $19, $29, and $39 tiers but didn't decide. I'll put together a full pricing analysis with revenue projections by March 3. David flagged that our terms of service need updating before launch -- something about auto-renewal language. He'll send me a redline by March 7. We ran out of time before getting to the international rollout discussion. Next meeting is March 3, same time."

---

**Output:**

## Meeting Notes: Product Launch Review

**Date:** Friday, February 21, 2026 | 10:00 AM -- 11:00 AM | Pacific Time
**Location / Platform:** Video call
**Facilitator:** Sarah Chen
**Notes by:** Sarah Chen

**Attendees:**
- Sarah Chen, Product Manager
- Mike Torres, Engineering
- Lisa Park, Marketing
- James Wright, Design
- David Kim, Legal *(partial attendance -- joined for legal review portion)*

**Absent (invited):**
- Rachel Nguyen, CTO -- scheduling conflict

---

### Decisions

1. **Launch date moved from March 1 to March 15, 2026.**
   Rationale: A critical bug in the checkout payment flow affects approximately 12% of mobile sessions and must be resolved and QA-verified before launch. The two-week extension provides time for the fix, testing, and asset delivery. Approved by: Product and Engineering leadership present.

2. **Pricing decision deferred to March 3 meeting.**
   Rationale: Competitive analysis is incomplete. Three price points ($19, $29, $39/month) are under consideration. No tier was approved. Decision requires full revenue projection analysis before commitment.

3. **Terms of service must be updated before launch.**
   Rationale: Auto-renewal language in current ToS does not meet regulatory standards. Legal team will provide redlined language by March 7. Launch cannot proceed without this update. Approved by: David Kim (Legal).

---

### Action Items

| # | Action | Owner | Due Date | Dependencies | Status |
|---|--------|-------|----------|--------------|--------|
| 1 | Fix checkout payment flow bug affecting 12% of mobile sessions | Mike Torres | March 5 | None | Open |
| 2 | QA testing of checkout fix -- full mobile regression pass | QA Lead (owner needed) | March 8 | Item #1 complete | Open |
| 3 | Update marketing calendar for March 15 launch date and notify PR agency | Lisa Park | Feb 28 | None | Open |
| 4 | Finalize landing page designs and deliver all assets to Engineering | James Wright | March 8 | None | Open |
| 5 | Prepare pricing analysis: 3 tiers ($19 / $29 / $39/month) with revenue projections and competitive comparison | Sarah Chen | March 3 | None | Open |
| 6 | Send redlined ToS with corrected auto-renewal language | David Kim | March 7 | None | Open |
| 7 | Review ToS redline and confirm launch approval from Legal | Sarah Chen | March 10 | Item #6 complete | Open |

**Note -- Item #2:** QA owner was not named in the meeting. Sarah Chen to confirm QA lead and update this item by February 24.

---

### Discussion Summary

**Checkout bug and launch delay:**
Mike identified a critical failure in the payment processor callback handling that causes checkout to fail for approximately 12% of mobile users. Root cause is confirmed and the fix is scoped at three engineering days plus two days of QA regression testing. The team agreed the bug must be resolved and verified before any launch, making a March 1 date untenable. March 15 was selected as the revised date based on the fix-plus-QA timeline plus a buffer for landing page asset delivery.

**Pricing:**
Lisa presented competitive research showing the nearest competitor is priced at $29/month with a single-tier model. The team discussed three potential price points -- $19 as a market penetration play, $29 to match the market, and $39 positioned as a premium tier. No consensus was reached. The group agreed that a full revenue projection at each price point, plus churn rate assumptions, is needed before a defensible decision can be made. Sarah will lead that analysis for the March 3 meeting.

**Terms of service -- auto-renewal language:**
David Kim flagged that the current ToS auto-renewal clause does not comply with updated consumer protection regulations in key markets. This is a launch blocker. David will deliver a redline by March 7, giving the team five days before launch to implement the change and get final legal sign-off.

---

### Deferred Items

| Topic | Reason Deferred | Return Date / Condition |
|-------|----------------|------------------------|
| International rollout plan | Meeting ran over time; discussion not started | March 3 meeting -- allocate 15 minutes on agenda |
| Pricing tier decision | Revenue analysis not yet complete | March 3 meeting -- decision required at that session |

---

### Next Meeting

**Date:** Monday, March 3, 2026 | **Time:** 10:00 AM -- 11:00 AM PT | **Platform:** Video call
**Primary Focus:** Pricing tier decision (requires final decision); launch readiness check against March 15 date; international rollout initial discussion
**Scheduling owner:** N/A -- confirmed

---

*Notes distributed by Sarah Chen | February 21, 2026 | Reply with corrections by February 23*
