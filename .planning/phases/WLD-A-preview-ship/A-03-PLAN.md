---
phase: WLD-A-preview-ship
plan: A-03
type: execute
wave: A
depends_on: [A-02]
files_modified: []
autonomous: false
blocking: true
---

> **STATUS 2026-07-22 — DECLARATION DONE; live-test pending packaged candidate.**
> `scripts/capability-seal/candidate-capabilities.json` declares all five capabilities **IN**:
> cowork-office, voice, mcp, sandbox, flux. Honest (classification proved the code ships). Local
> capability-acceptance receipts generated — **all 5 caps' canonical suites (30 total) pass** (voice
> incl. `voiceSynthBridge`/VOC-03). Final IN-with-live-test-evidence closes when the CI sealed
> candidate is live-tested (see A-02). No capability is silently half-present.

<objective>
Declare each capability-conditional feature — Voice, MCP, sandbox — as either IN the preview
candidate (and live-tested) or PHYSICALLY ABSENT. Honest absence satisfies the conditional criteria.
</objective>

<tasks>
- Voice: is hosted/local Voice shipping in the candidate? If IN, live-test the VOC-03 consent gate + a synth/STT round-trip. If out, confirm it is absent from the candidate + claims.
- MCP: connectors present? If IN, live-test declaration→session receipt→ToolSearch withholding. If out, absent.
- Sandbox: SBX read-only truth projection present (SBX-01)? Confirm requested-vs-effective is truthful; SBX-02 project-scoped grant is a Milestone B decision (descope vs build).
</tasks>

<verification>
For each of Voice/MCP/sandbox: a one-line IN (with live-test evidence) or ABSENT (with proof of absence) determination.
</verification>

<success_criteria>
No capability is silently half-present; each is IN-and-tested or absent-and-declared.
</success_criteria>

<output>Write A-03-SUMMARY.md with the three determinations + evidence.</output>
