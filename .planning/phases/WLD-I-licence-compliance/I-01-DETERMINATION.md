# I-01 — Determination on the §4(c) placement question and its five subsidiaries

**Date:** 2026-07-31 · **Standing:** reasoned analysis, NOT privileged legal advice. It cannot
function as an advice-of-counsel defence. It exists so the decisions rest on a documented,
adversarially-tested basis rather than on one model's opinion.

**Method:** the six questions were put to two independent models acting as licensing counsel, with
the measured facts supplied rather than asserted. Factual sub-questions (is this code actually
derived?) were settled by inspection here, not delegated — they are measurable.

**Supersedes:** the roadmap's I-01 framing, which was written to _size_ the milestone. The remedy
is already applied, so this is a sufficiency review. Its success criteria also cite
`AIONUI-INVENTORY.csv` (the v1.9.5 baseline, 981 files); that baseline is wrong and every figure
below resolves against `AIONUI-INVENTORY-1925.csv` instead.

---

## Q1 — In-file notices vs a central NOTICE file

**DETERMINATION: in-file was correct and is the required form.**

§4(c) and §4(d) are distinct obligations. §4(c) speaks to notices "in the Source form of the Work"
— i.e. where they were found. §4(d) governs the separate NOTICE file and is _additional_ where
upstream ships one, not a substitute. Relocating file headers into a central document strips the
file-level provenance §4(c) exists to preserve.

Both legs agreed. This also matches Codex's assertion during the earlier cross-audit, which was the
original reason to ask.

**Action: none. Already done — 812 files.**

## Q2 — §1202 exposure from substitution rather than omission

**DETERMINATION: real but low-probability; the cure removes the ongoing element.**

§1202(b) requires _scienter_: that CMI was removed or altered knowing it would "induce, enable,
facilitate, or conceal" infringement. A bulk automated rebrand inside a squashed 6245-file import
is weak evidence of that specific intent, and plaintiffs routinely fail this element
(_Stevens v. CoreLogic_ is the standard cite for the double-scienter requirement).

The honest caveat: **substitution presents far worse than omission.** Replacing their line with
ours in the same slot has the appearance of claiming authorship, and that is a bad fact in front of
a judge regardless of the doctrinal analysis. Realistic exposure is nuisance leverage inside a
broader breach claim rather than a standalone §1202 case.

**Action: none beyond the cure already applied.** Do not attempt to rewrite the history — the
squashed import is the best evidence that this was mechanical rather than intentional.

## Q3 — Sufficiency of the applied remedy

**(a) §4(b) wording — ADEQUATE.** Apache-2.0 does not prescribe wording for "prominent notices
stating that You changed the files."

**(b) Order — IRRELEVANT.** Upstream-first is conventional and is what we did; nothing turns on it.

**(c) Cure — STOPS ACCRUAL, DOES NOT EXTINGUISH.** Apache-2.0 has no reinstatement clause (unlike
GPL/AGPL §8), so the licence technically terminated on breach and past liability survives. In
practice a good-faith complete cure resolves these without litigation. **This is the one item where
a real lawyer would still add value**, because only a licensor can waive the historical period.

**Action: none.** (An earlier draft flagged a §4(b) defect via Q5; that was based on a panel error, corrected there.)

## Q4 — The de minimis line at 5 shared expression lines

**DETERMINATION: defensible, with a known qualitative edge.**

Copyright protects original expression, not boilerplate, imports, or format-dictated structure
(§102(b), merger, scènes à faire). A quantitative floor is standard audit practice.

The unsettled part is that infringement is judged on _qualitative_ substantial similarity — four
lines of genuinely novel algorithm could still infringe. Inspection of the 17 excluded files shows
nothing of that character: seven share nothing at all, and the rest share a lone type shape or hook
signature. Ratified.

**Action: none.** Rationale recorded per-file in `REVIEW-DECISIONS.csv`.

## Q5 — AGPL-3.0 outbound over Apache-2.0 inbound

**DETERMINATION: no additional obligation binds Ferrox. The panel's answer here was wrong and is
corrected.**

Gemini's leg determined that AGPL §5(a) _requires_ a date on the modification notice, that §5(d)
_requires_ Appropriate Legal Notices in the UI, and that §13 _requires_ a source offer to network
users. All three read the AGPL as binding Ferrox. **It does not.**

AGPL §5, §5(d) and §13 attach to "you" — a **licensee** who conveys or modifies the Program. Ferrox
is the **original AGPL licensor** of this work: upstream is Apache-2.0, and Ferrox relicensed the
combined work outbound under AGPL. A copyright holder is not its own licensee and is not bound by
the terms it grants to others. Those clauses bind anyone downstream who forks Wayland — not us.

The obligation that _does_ bind Ferrox is Apache-2.0, as a licensee of AionUi. **Apache-2.0 §4(b)
requires no date.** So the notice was already sufficient before the change.

**The date was therefore NOT a compliance defect, and this document originally claimed it was.**
The change is nonetheless **kept**, on three non-legal grounds: it is accurate, it costs nothing,
and it materially helps the downstream AGPL licensees who _are_ bound by §5(a) and would otherwise
have to reconstruct the date from git history.

**Genuinely open, and a business decision rather than a compliance one:**

- **§5(d) Appropriate Legal Notices — factually absent.** `AboutModalContent.tsx` carries no licence
  text, warranty disclaimer, or source offer (verified by inspection). Not required of Ferrox, but
  an AGPL product whose UI never mentions AGPL makes the copyleft offer invisible, and a downstream
  forker inherits an interface with no notices to preserve. Recommend adding it to About.
- **§13 network interaction** — same analysis: not binding on Ferrox as licensor. Relevant only if
  Ferrox ever _receives_ AGPL code from someone else and runs it as a network service.

## Q6 — The reverted GPL-family provenance (acpx, Zed)

**DETERMINATION: cleared. Not derived in any protectable sense, and acpx is not GPL-family at all.**

**The panel split here, and Codex was right to push.** Gemini called affirmative investigation
mandatory; Codex went further and returned a **release NO-GO**, declining to opine at all without a
file-level comparison against the actual upstream sources. It was correct that the comments prove
only that someone once asserted provenance. So the comparison was done rather than argued with.

**First correction — my own premise was wrong.** I told both legs that "acpx and Zed are
GPL-family". `npm pack acpx@0.13.0` shows **acpx is MIT**: _"MIT License, Copyright (c) 2025
OpenClaw Team"_. Codex's NO-GO was reasoned on a GPL premise I supplied and that does not hold.
Under MIT the entire obligation is to retain the attribution notice — which is exactly what the
revert restored. **acpx is compliant by the act of keeping the comment.**

**Second — the actual diff against `acpx@0.13.0`'s `AcpClient`:**

| measure                         | result                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| our declared members            | 24                                                                                                                          |
| acpx declared members           | 62                                                                                                                          |
| shared member names             | 14 — `cancel`, `close`, `closeSession`, `createSession`, `loadSession`, `prompt`, `pid`, `exitCode`, `running`, `signal`, … |
| **identical substantive lines** | **5**                                                                                                                       |

The five are `cancel(sessionId: string): Promise<void>;`, `closeSession(sessionId: string): Promise<void>;`
and two repeats of a `reason: AgentDisconnectReason;` field. Every shared name is either an **ACP
protocol operation** or a generic process concept (`pid`, `exitCode`, `signal`). A TypeScript
signature for an ACP `cancel` taking a session id and returning void has essentially one form —
textbook merger.

**Zed** is GPL-3.0, but it is a **Rust** codebase and our file is a **TypeScript interface
declaration** with zero implementation constructs. There is no expression that can cross that gap.

Per-file findings:

| claim                                                      | file                                       | finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Inspired by acpx's AcpClient and **Zed's** AcpConnection" | `IAcpClient.ts`                            | **Declaration-only.** 105 lines, 48 non-comment, **zero implementation constructs** — no `return`, no arrow body, no function definition. It declares a TypeScript `interface` whose types are imported from `@agentclientprotocol/sdk`, the protocol's _official_ SDK. The shape is dictated by ACP itself; the method names (`initialize`, `prompt`, `cancel`) are protocol operations. Zed's `AcpConnection` is a Rust implementation — there is no expression here that could have been copied from it. |
| "Mirrors Claude Code's `parseTaskFileContent()`"           | `cronSkillFile.ts`                         | Parses `---\n…\n---` YAML frontmatter and extracts `name:` / `description:`. That is the universal frontmatter convention and the externally-fixed SKILL.md format. Merger/scènes à faire: the format constrains the implementation. The remainder (`## Instructions` handling) is Wayland-specific.                                                                                                                                                                                                        |
| NocoBase event system / plugin lifecycle                   | `ExtensionEventBus.ts`, `types.ts`         | "Inspired by" an architectural pattern. **NocoBase is AGPL** — worth noting as a second copyleft family — but §102(b) denies protection to methods and systems of operation. An event bus is a pattern, not expression.                                                                                                                                                                                                                                                                                     |
| Figma manifest permissions / iframe sandbox                | `permissions.ts`, `sandbox.ts`, `types.ts` | Architectural concepts, explicitly "adapted for Node.js". Ideas.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Codex CLI ApprovalStore                                    | `ApprovalStore.ts`                         | "Inspired by". Codex CLI is Apache-2.0 in any case.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Cherry Studio capability resolution                        | `modelCapabilities.ts`                     | Already independently remediated — the three inherited patterns were re-derived in `afd3dd028` / `0622717d0`.                                                                                                                                                                                                                                                                                                                                                                                               |

**The decisive point:** every one of these is an _acknowledgement of influence_, and the code is
either declaration-only, format-dictated, or an implementation of an idea. Keeping the comments is
correct and costs nothing; deleting them (as `3f1c5ba10` did) was the actual error, and it is
reverted.

**Action: none. Q6 is closed** — but closed on a measured comparison, not on assertion, which is
what Codex's dissent demanded and was right to demand. Its NO-GO is treated as **satisfied**: the
one licence-version question it flagged as a hard blocker (GPLv2-only) cannot arise, because acpx
is MIT and Zed is cross-language.

---

## Net

|                    |                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Q1 placement       | correct as applied                                                                          |
| Q2 §1202           | low probability, cured, do not rewrite history                                              |
| Q3 sufficiency     | adequate; historical period survives cure                                                   |
| Q4 de minimis      | ratified                                                                                    |
| Q5 AGPL §5(a) date | panel was WRONG — not binding on Ferrox; date kept anyway, as courtesy to downstream        |
| Q6 GPL-family      | **premise was wrong — acpx is MIT.** Diffed: 5 shared lines, all protocol-dictated. Closed. |

**One open item, and it is a product decision rather than a compliance one:** the About screen
carries no licence text at all. Not required of Ferrox as the original licensor, but an AGPL
product that never says so in its UI is a strange artefact, and it leaves downstream forkers with
no notices to preserve.

**Where the panel had to be overruled.** Gemini read AGPL §5/§13 as binding Ferrox; they bind
licensees who convey, and Ferrox is the licensor. Gemini also called affirmative investigation of
the GPL-family claims mandatory before shipping — right that it could not be left open, so it was
done, and the answer is that none of it is derived in a protectable sense. Both corrections came
from checking the claim rather than accepting the output.

The one thing this cannot do is waive the historical non-compliance period between the rebrand and
the cure. Only the licensor can do that.

---

## Where the two legs disagreed

Recorded because a split verdict is more useful than a manufactured consensus.

|               | Gemini                      | Codex                                                             | Resolved                                                                             |
| ------------- | --------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Q1 placement  | in-file required            | in-file required                                                  | agree                                                                                |
| Q2 §1202      | low risk, cured             | cites _Mango v. BuzzFeed_, _Stevens v. CoreLogic_; same direction | agree                                                                                |
| Q4 de minimis | supports the 5-line floor   | wanted the 17-file exception closed before release                | resolved by inspection — 7 share nothing, rest a lone signature                      |
| Q5 AGPL       | §5(a)/§5(d)/§13 bind Ferrox | flagged an "AGPL date/SPDX issue"                                 | **both overruled** — those clauses bind licensees who convey; Ferrox is the licensor |
| Q6 GPL-family | investigate before shipping | **release NO-GO** until file-level comparison                     | Codex's demand met; its GPL premise was mine and was wrong                           |

Codex's most useful contribution was refusing to opine without evidence. Its checklist — identify
the exact upstream file, filter unprotectable material, then determine the licence _version_ — is
the right method, and running it is what surfaced that acpx is MIT.

Codex also correctly notes that AGPL §8 offers reinstatement after cure (with a 30-day first-notice
window) whereas **Apache-2.0 has no such clause**, which is why Q3(c) stands: the historical period
between the rebrand and this cure is the one thing no analysis here can clear.
