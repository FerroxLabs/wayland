# Obligation Research — Licence Compliance (Milestone WLD-I)

**Domain:** Third-party licence attribution obligations (Apache-2.0 inbound, MIT inbound, AGPL-3.0-or-later outbound)
**Researched:** 2026-07-30
**Confidence:** MEDIUM-HIGH on the obligations; MEDIUM on the remedy; LOW on quantified litigation risk (see §7)

> **Framing note.** This file uses the standard FEATURES template, read as obligations:
> **Table Stakes = mandatory** (do these or you are in breach) · **Differentiators = best
> practice** (not owed, but they are what a defensible posture looks like) ·
> **Anti-Features = things that do NOT discharge the duty** (including things this repo
> currently does).

---

## ⇒ THE HEADLINE ANSWER (the one the roadmapper needs)

**This milestone edits ~2,615 files, not one. Per-file work is unavoidable.**

Not because Apache-2.0 §4(c) unambiguously mandates per-file retention — it does not, and the
authorities genuinely split on that (§1 below). It is unavoidable because **four independent
obligation streams all converge on the file header**, and only one of them is §4(c):

| #   | Stream                                      | Where the text puts the duty                                                                                                                                                             | Files affected |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 1   | Apache-2.0 §4(c) retain notices             | "in the **Source form** of any Derivative Works" — medium specified, location not                                                                                                        | ~310 derived   |
| 2   | Apache-2.0 §4(b) modified-file notices      | "cause any **modified files** to carry prominent notices stating that You changed the files" — **per-file by its own words**                                                             | ~310 derived   |
| 3   | AGPL-3.0 §7 final ¶ (additional terms)      | "you must place, **in the relevant source files**, a statement of the additional terms that apply to those files, **or a notice indicating where to find the applicable terms**"         | ~310 derived   |
| 4   | AGPL-3.0 §5(b) outbound licence declaration | "The work must carry **prominent notices** stating that it is released under this License" — and **2,615 files currently declare `SPDX-License-Identifier: Apache-2.0`, 0 declare AGPL** | **2,615**      |

Stream 2 is the strongest and least arguable: **§4(b) is textually per-file** ("modified
**files**"), it is not satisfied by any central document, and there is no serious contrary reading.
The current tree satisfies §4(b) for **zero** of the ~310 derived files — a Ferrox copyright line
is not a statement that you changed someone else's file.

Stream 4 is the largest and is a _different kind of problem_: it is Wayland **granting away**
rights, not withholding attribution. 2,615 machine-readable `SPDX-License-Identifier: Apache-2.0`
declarations against an AGPL-3.0-or-later `LICENSE` is a contradiction every SCA scanner
downstream will resolve in favour of the header. This is arguably higher business exposure than
the inbound §4(c) gap and it is not in the milestone's current target list.

**And the specific thing this repo did is worse than the thing §4(c) forbids.** Verified on disk,
2026-07-30:

```
AionUi   packages/desktop/src/common/electronSafe.ts     Wayland  src/common/electronSafe.ts
/**                                                      /**
 * @license                          ← retained           * @license
 * Copyright 2025 AionUi (aionui.com) ← REPLACED          * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0 ← retained         * SPDX-License-Identifier: Apache-2.0
 */                                                       */
```

The `@license` tag survived. The SPDX line survived. **Only the ownership line changed.** That is
not omission or drift; it is a surgical substitution of one party's copyright notice for another's,
inside an otherwise byte-identical file. That fact pattern moves this out of pure licence-condition
territory and into **17 U.S.C. § 1202** (copyright management information) — see §6/§7. It is also
the single hardest fact to explain benignly, and it is the reason "a central file already names
AionUi, so we are covered" is not a survivable position.

**Confidence: HIGH** that per-file work is required. **MEDIUM** that §4(c) alone would require it.
**HIGH** that §4(b) and the SPDX contradiction require it independently of how §4(c) resolves.

**Is Codex right that a central file CANNOT substitute for source-form retention?**
**Directionally right, but overstated as to §4(c) specifically.** The best authority against
Codex is SFLC's, and it is squarely on point (§1). Codex is right about the _outcome_ here for
different and better reasons than the one he gave.

---

## Obligation Landscape

### Table Stakes (Mandatory — omission = breach)

| Obligation                                                                 | Source text                                                                                                                                                                                                                                                                                                                                                                                                                            | Complexity        | Notes                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A1. §4(b) per-file modification notice on every derived file**           | "You must cause any modified files to carry prominent notices stating that You changed the files"                                                                                                                                                                                                                                                                                                                                      | MEDIUM            | ~310 files. Textually per-file; **no central-file reading available**. Currently satisfied on 0 files. This is the strongest single finding in this document.                                                                                                                                                                                                                                                 |
| **A2. §4(c) retain AionUi's copyright notice on the derived set**          | "You must retain, in the Source form of any Derivative Works that You distribute, all copyright, patent, trademark, and attribution notices from the Source form of the Work, excluding those notices that do not pertain to any part of the Derivative Works"                                                                                                                                                                         | MEDIUM            | ~310 files. Restore `Copyright 2025 AionUi (aionui.com)` _alongside_ the Ferrox line. Do not delete the Ferrox line — §4 ¶ after (d) expressly permits it: "You may add Your own copyright statement to Your modifications".                                                                                                                                                                                  |
| **A3. §4(c) restore the Google LLC notice on `tools/web-fetch.ts`**        | same as A2                                                                                                                                                                                                                                                                                                                                                                                                                             | LOW               | 1 file. Already in the milestone list. 18.4% literal overlap measured; sibling `web-search.ts` retains the header.                                                                                                                                                                                                                                                                                            |
| **A4. §4(a) ship an _unmodified_ copy of the Apache-2.0 licence**          | "You must give any other recipients of the Work or Derivative Works a copy of this License"                                                                                                                                                                                                                                                                                                                                            | LOW               | ⚠️ **NEW DEFECT FOUND.** `notices/Apache-2.0.txt` has had its APPENDIX boilerplate placeholder `Copyright [yyyy] [name of copyright owner]` overwritten with `Copyright 2026 Ferrox Labs`. That is not "a copy of this License". Restore verbatim from apache.org.                                                                                                                                            |
| **A5. §4(d) reproduce OfficeCLI's NOTICE verbatim**                        | "If the Work includes a \"NOTICE\" text file as part of its distribution, then any Derivative Works that You distribute must include a readable copy of the attribution notices contained within such NOTICE file … in at least one of the following places: within a NOTICE text file distributed as part of the Derivative Works; within the Source form or documentation …; or, within a display generated by the Derivative Works" | LOW               | **4(d) binds only where the upstream ships a NOTICE — your reading is CORRECT and verified.** Probed 2026-07-30: OfficeCLI `NOTICE` → **200**; AionUi `NOTICE` → **404**; aionrs → 404; gemini-cli → 404. So 4(d) binds for OfficeCLI only.                                                                                                                                                                   |
| **A6. MIT notice on the OpenClaw tunnel trio + `channels/types.ts`**       | "The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software."                                                                                                                                                                                                                                                                                                       | LOW               | Already in the milestone list. Must be in `@license` form so Rollup retains it.                                                                                                                                                                                                                                                                                                                               |
| **A7. Remove the four false claims from `notices/THIRD-PARTY-NOTICES.md`** | Not a licence duty — a truthfulness duty                                                                                                                                                                                                                                                                                                                                                                                               | LOW               | Already in the milestone list. §1202(a) ("provide copyright management information that is false") makes a _shipped_ false authorship claim materially worse than a merely incomplete one. See A8.                                                                                                                                                                                                            |
| **A8. Delete or rewrite the affirmatively-false authorship sentence**      | —                                                                                                                                                                                                                                                                                                                                                                                                                                      | LOW               | `THIRD-PARTY-NOTICES.md:22-23`: "Source files carrying a Ferrox Labs copyright header are modified or newly authored by Ferrox Labs." Applied to a 100%-identical copy of `electronSafe.ts`, that is a shipped false statement of authorship. **This one sentence is the worst single line in the tree** — it converts an omission into an assertion. Highest priority in the whole milestone.                |
| **A9. Resolve the SPDX contradiction (2,615 files)**                       | AGPL §5(b) "The work must carry prominent notices stating that it is released under this License"; §5(c) "You must license the entire work, as a whole, under this License"                                                                                                                                                                                                                                                            | HIGH              | 2,615 files declare `SPDX-License-Identifier: Apache-2.0`; 0 declare AGPL. **Counsel question** — see "What to ask counsel". Do not guess the target expression.                                                                                                                                                                                                                                              |
| **A10. AGPL §7 per-file pointer to the inherited Apache terms**            | "you must place, in the relevant source files, a statement of the additional terms that apply to those files, or a notice indicating where to find the applicable terms"                                                                                                                                                                                                                                                               | LOW (rides A1/A2) | The §4(c) preservation duty is a §7(b)-shaped additional term ("Requiring preservation of specified reasonable legal notices or author attributions"). §7 permits a **pointer** rather than full text — so a one-line `See notices/THIRD-PARTY-NOTICES.md` in the header discharges this. **Inference, not settled** — §7's final ¶ speaks of terms "you add", and whether inherited terms count is untested. |

### Differentiators (Best practice — not owed, but this is what defensible looks like)

| Practice                                                                               | Value                                                                                                                                                                                                                                                                                             | Complexity | Notes                                                                                                             |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| **Adopt the OpenSearch header convention**                                             | It is the closest widely-adopted precedent for exactly this situation (large Apache-2.0 fork of an Apache-2.0 upstream). OpenSearch uses `Copyright OpenSearch Contributors` + `SPDX-License-Identifier: Apache-2.0` and **retains the Elastic copyright where any Elastic copyright is needed**. | LOW        | Reduces "we invented a scheme" risk. See opensearch-project/.github#21.                                           |
| **A `Modifications:` line with a date on each derived file**                           | Satisfies §4(b) _and_ AGPL §5(a) ("must carry prominent notices stating that you modified it, **and giving a relevant date**") in one stroke. AGPL §5(a) is an obligation you currently miss on every file and it is not in the milestone list.                                                   | LOW        | Two birds. Use the milestone date, not a fabricated fork date.                                                    |
| **A machine-checkable header lint in CI**                                              | Turns this from a one-time sweep into a maintained invariant. The WLD-H audit's own lesson was that six header dialects drifted un-noticed.                                                                                                                                                       | MEDIUM     | Also catches the Rollup `@license` stripping class the audit found (`485b212ff`).                                 |
| **A per-file provenance manifest (path → upstream path → measured overlap → verdict)** | This is the artefact that answers a demand letter in one email instead of three months. Hellwig v. VMware was dismissed because the _plaintiff_ could not localise the code; the mirror-image is that a defendant who can localise everything is a cheap, uninteresting target.                   | MEDIUM     | Also the deliverable counsel will want. Keep it in-repo.                                                          |
| **npm dependency licence report (144 prod deps)**                                      | Table stakes for any commercial desktop app; currently zero. Not an Apache/MIT §4 duty for those deps unless one of them is Apache-2.0 with a NOTICE.                                                                                                                                             | MEDIUM     | Already in the milestone list. Check each Apache-2.0 dep for a NOTICE file — each 200 creates a fresh §4(d) duty. |
| **Publish the fork lineage in the README**                                             | Costs nothing, removes the "they hid it" narrative that drives escalation.                                                                                                                                                                                                                        | LOW        | The current `THIRD-PARTY-NOTICES.md` already says it; surfacing it is cheap goodwill.                             |

### Anti-Features (Do NOT discharge the duty — including things this repo does today)

| Approach                                                                         | Why it looks sufficient                                                                                                                                                                                     | Why it is not                                                                                                                                                                                                                                                                                                      | Do instead                                                                                                         |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **A central `THIRD-PARTY-NOTICES.md` alone**                                     | It names AionUi and reproduces `Copyright 2025 AionUi (aionui.com)`, so the notice _is_ reproduced somewhere in the Source form. Under SFLC's reading that arguably satisfies §4(c).                        | It does nothing for §4(b) (per-file, no central option), nothing for AGPL §5(a)/(b), and it does not identify _which_ files are derived — so a reader cannot tell that `electronSafe.ts` is not Ferrox's work. Worse, line 22-23 affirmatively denies it.                                                          | Central file **plus** per-file restoration. The central file is necessary and not sufficient.                      |
| **"We only ship a binary, so §4(c) never triggers"**                             | §4(c) is expressly scoped "in the **Source form** of any Derivative Works **that You distribute**". Ship only Object form → no Source form → nothing to retain. This reading is textually sound (§3 below). | **AGPL forecloses it.** AGPL §6 permits conveying object code "provided that you also convey the machine-readable Corresponding Source", and §13 requires offering Corresponding Source to network users. Wayland _must_ distribute the Source form. The GitHub repo is not incidental — it is the AGPL discharge. | Treat §4(c) as triggered. The escape hatch is closed by your own outbound licence.                                 |
| **"Bundled `app.asar` JS is readable, so the binary is Source form"**            | The JS in `app.asar` is human-readable.                                                                                                                                                                     | "Source form" is defined as "the **preferred form for making modifications**"; bundled/transpiled JS is "any form resulting from mechanical transformation or translation of a Source form" = Object form. Readability is not the test.                                                                            | Don't rely on this either way — AGPL §6 already forces source distribution.                                        |
| **Replacing the upstream copyright with yours**                                  | It is what a fork "feels like" — new owner, new header.                                                                                                                                                     | Directly contrary to ASF's own policy for third-party works: **"Do not modify or remove any copyright notices or licenses within third-party works."** And it is the §1202(b) fact pattern: "intentionally remove or alter any copyright management information".                                                  | Add yours _alongside_. §4 expressly allows this: "You may add Your own copyright statement to Your modifications". |
| **Stripping the Ferrox copyright to "fix" the header**                           | Symmetrical-looking fix.                                                                                                                                                                                    | Over-corrects, loses Ferrox's own claim, and misstates authorship in the other direction.                                                                                                                                                                                                                          | Dual notice. Both lines.                                                                                           |
| **Bulk-applying the AionUi notice to all 445 same-path files without measuring** | Cheap and "safe".                                                                                                                                                                                           | Puts a false copyright claim on ~135 Ferrox originals — that is §1202(a) "provide copyright management information that is false" pointing the other way, and it clouds Ferrox's own title to its own code. Over-attribution is _lower_ risk than under-attribution but it is not zero.                            | Measure first. The milestone already decided this (Sean, 2026-07-30) and it is correct.                            |
| **Deleting a provenance comment because nobody proved derivation**               | "No evidence of copying" reads like a clean bill of health.                                                                                                                                                 | This is what `3f1c5ba10` did to the acpx / Zed / Codex CLI / Claude Code clauses. Deleting the _pointer_ destroys the only record of what to check, and for the closed-source ones (Claude Code) makes the question permanently unanswerable. Absence of proof ≠ proof of absence.                                 | Restore the clause pending adjudication, or adjudicate it. Already in the milestone list.                          |
| **Waiting for the git fork point to be recoverable**                             | It is genuinely unrecoverable (squashed root `2b3b60e11`).                                                                                                                                                  | Irrelevant. Provenance is established by _measurement against the upstream tree_, not by git history — the WLD-H audit already proved that in three commands. The "unrecoverable, therefore unfixable" claim was withdrawn as wrong.                                                                               | Measure.                                                                                                           |
| **Relying on Apache-2.0's "cure period"**                                        | Multiple secondary sources (incl. FOSSA-adjacent blogs and search-engine summaries) state Apache-2.0 terminates on material breach unless cured.                                                            | **FALSE. Verified against primary text**: the word "terminate" appears exactly **once** in Apache-2.0, in §3, and only for patent-defensive termination. There is **no** general termination clause and **no** cure provision.                                                                                     | Do not plan around a cure clause that does not exist. See §6.                                                      |

---

## The Seven Questions, Answered

### §1 — Apache-2.0 §4(c): what it requires, and per-file vs central

**Verbatim (§4(c)):**

> "(c) You must retain, in the Source form of any Derivative Works that You distribute, all
> copyright, patent, trademark, and attribution notices from the Source form of the Work,
> excluding those notices that do not pertain to any part of the Derivative Works; and"

**Verbatim (§1 definitions):**

> "\"Source\" form shall mean the preferred form for making modifications, including but not
> limited to software source code, documentation source, and configuration files."

> "\"Derivative Works\" shall mean any work, whether in Source or Object form, that is based on
> (or derived from) the Work and for which the editorial revisions, annotations, elaborations, or
> other modifications represent, as a whole, an original work of authorship."

**Does replacing an upstream per-file header with your own violate §4(c)?**
**Yes. This is the one part of the question with no real dispute.** "Retain … all copyright …
notices from the Source form of the Work" cannot be satisfied by an act that deletes the upstream
copyright notice and puts a different party's in its place. The `excluding those notices that do
not pertain to any part of the Derivative Works` carve-out does not help: for a file that is 100%
identical to upstream, AionUi's notice pertains to essentially all of it.
**Status: SETTLED as a matter of plain text.** Reinforced by ASF's own third-party policy —
**"Do not modify or remove any copyright notices or licenses within third-party works."**

**Is per-file retention required, or can a central file discharge it? — THE AUTHORITIES SPLIT.**

_Position A — central relocation is acceptable (SFLC, the strongest single authority on point):_

> "a requirement to 'preserve' or 'reproduce' a developer's copyright notice does not necessarily
> require that the notice be kept in exactly the same place it started; it's usually acceptable to
> move notices from individual source files to a central attribution file."
> — SFLC, _Managing Copyright Information within a Free Software Project_ (2012)

Supporting: §4(c)'s only locational constraint is the _medium_ ("in the Source form"), and a
central notices file committed to the repo is unambiguously part of the Source form. The ASF
itself relocates copyright notices from headers into `NOTICE`.

_Position B — §4(c) is not satisfied by a central file (Codex's position):_

Supporting: (i) the verb is **"retain"**, not "include" or "reproduce" — retention connotes
leaving in place; §4(d), drafted in the same sentence-family, deliberately uses "**include** a
readable copy … in at least one of the following places" and then enumerates locations. §4(c)
enumerates none. _Expressio unius_: the drafters gave location flexibility where they intended it.
(ii) §4(c) and §4(d) are joined by "**and**" — conjunctive conditions. Discharging (d) cannot
discharge (c) or (c) would be surplusage. (iii) ASF's relocation practice is expressly conditioned
on **the copyright owner's permission** — its policy for _third-party_ works (works "not submitted
directly … by the copyright owner or owner's agent", i.e. exactly Wayland/AionUi) is the flat
prohibition quoted above.

**Verdict for the roadmapper:** the split is real and I will not pretend it isn't. But it does not
matter, because **§4(b) is per-file by its own words and has no central-file reading at all**, and
because the specific act here was replacement, which both positions condemn. Plan per-file.

**Confidence:** HIGH on "replacement violates §4(c)". MEDIUM on "§4(c) alone requires per-file".
HIGH on "the milestone must do per-file work regardless".

---

### §2 — §4(a), §4(b), §4(d)

**§4(a) verbatim:** "You must give any other recipients of the Work or Derivative Works a copy of
this License; and"
→ Satisfied _in kind_ by `notices/Apache-2.0.txt` shipping. **But defective in fact** — the
APPENDIX placeholder has been overwritten with `Copyright 2026 Ferrox Labs`. A modified licence
text is not "a copy of this License". LOW effort to fix, and it is embarrassing if found by
someone else first. **Confidence: HIGH** (read from disk).

**§4(b) verbatim:** "You must cause any modified files to carry prominent notices stating that You
changed the files; and"
→ **The strongest finding in this document.** Three features: (i) the unit is the **file**;
(ii) the notice must be **prominent**; (iii) it must **state that you changed the file** — a bare
`Copyright 2026 Ferrox Labs` does not say "Ferrox changed this file", it says "Ferrox owns this
file", which is a different and (for derived files) false proposition. Currently satisfied on
**zero** of ~310 derived files. There is **no** central-document option in the text.
**Confidence: HIGH.**

**§4(c):** see §1.

**§4(d) verbatim:** "If the Work includes a \"NOTICE\" text file as part of its distribution, then
any Derivative Works that You distribute must include a readable copy of the attribution notices
contained within such NOTICE file … in at least one of the following places: within a NOTICE text
file distributed as part of the Derivative Works; within the Source form or documentation, if
provided along with the Derivative Works; or, within a display generated by the Derivative Works,
if and wherever such third-party notices normally appear."

→ **Your reading is CORRECT: 4(d) binds only if the upstream distributes a NOTICE file.** The
condition is explicit ("**If** the Work includes a \"NOTICE\" text file"). Verified 2026-07-30 via
the GitHub contents API:

| upstream                 | `NOTICE`               | §4(d) binds? |
| ------------------------ | ---------------------- | ------------ |
| iOfficeAI/OfficeCLI      | **200**                | **YES**      |
| iOfficeAI/AionUi         | 404                    | no           |
| iOfficeAI/aionrs         | 404 (per H-CROSSAUDIT) | no           |
| google-gemini/gemini-cli | 404 (per H-CROSSAUDIT) | no           |

Note §4(d)'s closing sentence, which is the licence's own answer to over-attribution anxiety:
"You may add Your own attribution notices within Derivative Works that You distribute, alongside
or as an addendum to the NOTICE text from the Work, provided that such additional attribution
notices cannot be construed as modifying the License." **Confidence: HIGH.**

---

### §3 — Does §4(c) apply to a binary-only distribution?

**Textually: no.** §4(c)'s obligation is scoped "in the **Source form** of any Derivative Works
that You distribute". If you distribute only Object form, there is no Source form of the
Derivative Work in that distribution for the notices to be retained _in_. By contrast §4(a) ("give
any other recipients … a copy of this License") and §4(d) ("any Derivative Works that You
distribute must include a readable copy of the attribution notices") are **not** form-scoped and
bind for binary-only distribution. §4(b) ("modified **files**") is naturally read as source files.
This form-asymmetry is the standard reading and is why almost every shipped app has a
LICENSE/NOTICE bundle but no source headers.
**Confidence: HIGH** on the textual reading; **MEDIUM** that no court has tested it (no authority
found either way).

**Does the readable JS in `app.asar` change it? No.** "Source form" = "the **preferred** form for
making modifications". Transpiled/bundled JS is "any form resulting from mechanical transformation
or translation of a Source form" = Object form by definition. Readability is not the statutory
test. (Different for the _loose_ files — `Resources/whatsapp-bridge/*.js` ship as unbundled,
hand-maintained JS, which is much closer to Source form. Those already carry headers; keep them.)

**But the escape hatch is closed, and this is the point that matters.** Wayland's outbound licence
is AGPL-3.0-or-later. AGPL §6: "You may convey a covered work in object code form under the terms
of sections 4 and 5, **provided that you also convey the machine-readable Corresponding Source**
under the terms of this License". AGPL §13: a modified version must "prominently offer all users
interacting with it remotely through a computer network … an opportunity to receive the
Corresponding Source". **Wayland is obliged to distribute the Source form.** The GitHub repository
is not a courtesy — it is the AGPL discharge mechanism. Therefore Wayland distributes the Source
form of the Derivative Work and **§4(c) is triggered.**

**Roadmapper implication:** "we could just fix the notices in the packaged app" is not on the
table. **Confidence: HIGH.**

---

### §4 — AGPL-outbound over Apache-2.0-inbound

**Compatible? Yes, one-way.** The FSF and the ASF agree Apache-2.0 is compatible with GPLv3 (and
therefore AGPLv3), in the direction Apache-in → GPL-out only. The ASF's own
`GPL-compatibility.html` and the FSF licence list both say so. **Confidence: HIGH** (both
licensors' own published positions).

**Does relicensing outbound to AGPL extinguish, preserve, or complicate the inbound §4(c) duty?**
**It PRESERVES it, and it COMPLICATES it — it extinguishes nothing.** Three mechanisms:

1. **AGPL §7(b) is the compatibility hinge, and it works by preserving the notice duty, not by
   erasing it.** Verbatim: "for material you add to a covered work, you may (if authorized by the
   copyright holders of that material) supplement the terms of this License with terms: … (b)
   **Requiring preservation of specified reasonable legal notices or author attributions** in that
   material or in the Appropriate Legal Notices displayed by works containing it". Apache-2.0
   §4(b)/(c) are exactly this kind of term. That is _why_ they survive relicensing rather than
   being struck as "further restrictions" under §7's penultimate ¶. **The Apache notice duty rides
   through into the AGPL work as a §7 additional term.**
   _Confidence: MEDIUM-HIGH. This is the standard FSF/practitioner analysis of how Apache→GPLv3
   compatibility actually operates; I found no source contradicting it, but I also found no source
   stating it in exactly these words. Flagging as strong inference._

2. **AGPL §7's final ¶ then imposes its own per-file duty:** "If you add terms to a covered work
   in accord with this section, you must place, **in the relevant source files**, a statement of
   the additional terms that apply to those files, **or a notice indicating where to find the
   applicable terms**." Note the concession: a **pointer** suffices. So one line per derived file
   —`See notices/THIRD-PARTY-NOTICES.md`— discharges this. But the location is per-file.
   _Confidence: MEDIUM. §7 says "terms **you add**"; whether inherited upstream terms count is
   untested. Widely-held practice (GPL-with-exception headers, kernel SPDX headers) is per-file._

3. **AGPL's own notice duties add obligations Wayland currently misses entirely:**
   - §4: "keep intact all notices stating that this License and any non-permissive terms added in
     accord with section 7 apply to the code; keep intact all notices of the absence of any
     warranty". _Wayland's headers state Apache-2.0, not AGPL, on 2,615 files — the AGPL notice is
     not intact anywhere in `src/`._
   - §5(a): "The work must carry prominent notices stating that you modified it, **and giving a
     relevant date**." Not satisfied on any derived file. (Redundant with §4(b); fix once.)
   - §5(b): "The work must carry prominent notices stating that it is released under this License
     and any conditions added under section 7. **This requirement modifies the requirement in
     section 4 to \"keep intact all notices\"**." — i.e. AGPL _expects_ you to overlay the AGPL
     notice, but §5(b) modifies only the §4 keep-intact duty, **not** the third-party §7(b) duties.
     It is not a licence to overwrite AionUi's copyright.
   - §5(c): "You must license the entire work, as a whole, under this License to anyone who comes
     into possession of a copy." This is the clause the 2,615 Apache-2.0 SPDX headers contradict.

**Net:** AGPL-over-Apache is legal, but it makes Wayland owe _both_ sets of notice duties
simultaneously, at file granularity, and the current tree satisfies neither. **The AGPL layer
strengthens the case for per-file work; it does not offer any relief.**

---

### §5 — MIT: "substantial portion", and rewritten ports

**Verbatim:** "The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software."

**What counts as a substantial portion?** **No authority found defining it for MIT.** OSI publishes
the text without gloss; I found no case construing "substantial portions" in an MIT licence, and
no FSF/SFC/OpenChain definition. What _is_ clear:

- The threshold is **not** the copyright-law originality threshold. Below the copyrightability
  floor there is no licence to breach at all — copying uncopyrightable boilerplate creates no
  obligation. (This is the WLD-H audit's own correct reasoning about "generic identifiers" and
  "boilerplate lines".)
- Practitioner consensus treats it as coextensive-ish with copyrightable-expression-copied: if
  what you took is protected expression, include the notice. **This is widely-held practice, not
  settled law.**

**Does a rewritten port carry the obligation?** **Almost certainly yes — and this is the trap the
WLD-H audit already fell into and corrected.** MIT's grant covers "modify, merge, publish" — a
port is a modification/translation, and a translation is a **derivative work** under 17 U.S.C.
§ 101 regardless of literal line overlap. The audit's own correction says it best:

> "literal-line overlap detects copy-paste but not a port. A rewritten port shares no lines and is
> still a derivative work."

The audit's discriminator — **shared hand-authored helper names** (`getTailscaleDnsName`,
`resolveSignalCliPath`), discounting third-party API names, discounting import-only call sites of
helpers defined in an already-attributed sibling — is sound methodology and I would not change it.
Two refinements:

- **Identical magic constants are strong evidence**, stronger than the audit credited. The
  `WhatsAppPlugin.ts` finding (2000 / 30000 / 1.8 / 12 identical to upstream's
  `DEFAULT_RECONNECT_POLICY`) is a four-parameter coincidence. Selection of arbitrary numeric
  values is classic protectable expression. **My read: that one earns a header.**
- **The risk asymmetry the audit identified is correct and should govern every UNVERIFIED call.**
  Wrongly stripping a notice = live MIT breach. Wrongly keeping one = credit you didn't owe, with
  essentially no liability. **Keep, when unsure.** (Caveat: "essentially no" is not "none" —
  see the over-attribution anti-feature.)

**Confidence: MEDIUM** (the derivative-work-includes-translation point is settled; the "substantial
portion" threshold is genuinely undefined).

---

### §6 — Remedy standard and what cure looks like

**Is there a cure provision in Apache-2.0? NO. Verified against the primary text.**
`grep -i "terminat\|cure\|breach"` over the licence returns **exactly one hit**: §3's
patent-defensive termination ("any patent licenses granted to You under this License for that Work
shall terminate as of the date such litigation is filed"). There is **no general termination
clause** and **no cure provision** in Apache-2.0.

⚠️ **Multiple secondary sources state the opposite** — that Apache-2.0 "terminates all rights on
material breach unless cured" or has "a built-in cure period". **Those claims are false**; they
appear to conflate Apache-2.0 with CDDL/EPL/MPL, which do have such clauses. **Do not plan around
a cure period that does not exist.** _(This is the single most important correction in this
document, because a planner reading the popular blogs would reach the opposite conclusion.)_

**What that means, both ways:**

- _Bad:_ there is no contractual safe harbour. A restoration sweep is not a licence-defined cure
  that extinguishes the claim.
- _Good:_ there is no automatic forfeiture either. Wayland's Apache-2.0 grant does **not**
  self-terminate on breach the way GPLv2's §4 did. So the doomsday framing ("we lost the licence,
  every copy since 2026-07-06 is bare infringement") **does not follow from the licence text**.
  Whether a court would nonetheless find the grant conditional such that out-of-scope use is
  infringement is the _Jacobsen_ question (§7) — and _Jacobsen_ says yes, conditions are conditions.
  So: no automatic termination, but out-of-condition distribution is plausibly infringing use.
  **This precise interaction is a counsel question.**

**Contrast — AGPL/GPLv3 §8 _does_ have cure**, verbatim from Wayland's own LICENSE:

> "However, if you cease all violation of this License, then your license from a particular
> copyright holder is reinstated (a) provisionally, unless and until the copyright holder
> explicitly and finally terminates your license, and (b) permanently, if the copyright holder
> fails to notify you of the violation by some reasonable means prior to 60 days after the
> cessation."
> "Moreover, your license from a particular copyright holder is reinstated permanently if the
> copyright holder notifies you of the violation …, this is the first time you have received
> notice of violation of this License (for any work) from that copyright holder, and you cure the
> violation prior to 30 days after your receipt of the notice."

This governs _Wayland's downstream licensees_, not Wayland's inbound Apache duty. It is
asymmetric and worth understanding: Wayland's own users get a 30/60-day cure regime that Wayland
does not get from AionUi.

**What a good-faith cure looks like in practice** (SFLC Guide to GPL Compliance, and SFC's
_Principles of Community-Oriented GPL Enforcement_):

1. Cease the violating distribution behaviour (here: stop shipping the swapped headers).
2. Restore what was removed, in the place it was removed from where practical.
3. Produce a written account of scope — which files, measured how.
4. Put a process in place so it does not recur (CI header lint).
5. Notify the upstream proactively rather than waiting to be found.

SFC's enforcement principles emphasise private negotiation first and escalation only on
"repeated failures to achieve voluntary adherence". A proactive, documented, complete restoration
is precisely the posture that keeps a matter in step 1 forever.

**Does restoring notices now fully cure? NO — and be honest about why.** Restoration stops the
_ongoing_ breach prospectively. It does not retroactively license the copies already distributed
(every release since 2026-07-06). Residual exposure:

- **Past distribution of the altered copies.** Damages theory would be actual damages/profits or,
  if AionUi registers a US copyright, statutory damages. AionUi is a Chinese-origin project; US
  statutory damages require timely registration — **unverified, and a counsel question.**
- **17 U.S.C. § 1202 exposure, which restoration does not erase.** §1202(b)(1): "No person shall,
  without the authority of the copyright owner or the law … intentionally remove or alter any
  copyright management information". §1202(b)(3) covers distributing works "knowing that copyright
  management information has been removed or altered". §1202(a)(1) covers "provide copyright
  management information that is false". Statutory damages under §1203(c)(3)(B) are
  **"not less than $2,500 or more than $25,000" per violation**, plus discretionary attorney's fees
  under §1203(b). If "per violation" were read per-file at ~310 files, the arithmetic is
  $775k–$7.75M. **I am flagging that number as the reason counsel is needed, not as a prediction** —
  per-violation counting for §1202 is contested, and the scienter element ("knowing, or … having
  reasonable grounds to know, that it will induce, enable, facilitate, or conceal an infringement")
  is a real hurdle.
- **The `THIRD-PARTY-NOTICES.md:22-23` sentence is the §1202(a) hook** and it is _shipped_. Fix it
  first, independently of everything else.

**Confidence: HIGH** on the licence-text facts. **MEDIUM** on the §1202 framing. **LOW** on any
quantification.

---

### §7 — Actual risk profile of an unremedied §4(c) breach at this scale

**Apache-2.0-specific attribution enforcement history: NO AUTHORITY FOUND.** I searched for
litigated or settled Apache-2.0 attribution/notice cases and found none. That is itself the
finding: **Apache-2.0 attribution breaches are, empirically, not litigated.** The ASF does not run
an enforcement programme comparable to SFC's copyleft compliance work, and individual Apache-2.0
licensors rarely have the appetite.

**Nearest controlling authority — and it cuts against Wayland:**

> **Jacobsen v. Katzer**, 535 F.3d 1373 (Fed. Cir. 2008). Defendant used JMRI code under the
> Artistic License; "Decoder Commander did not include attribution notices". The Federal Circuit
> held the licence's attribution and modification-tracking terms were **conditions**, not mere
> covenants: "it is outside the scope of the Artistic License to modify and distribute the
> copyrighted materials without copyright notices and a tracking of modifications from the
> original computer files." Consequence: breach → **copyright infringement**, not just contract
> damages → **injunctive relief and the copyright damages ladder become available**.

_Jacobsen_ is Artistic License, not Apache-2.0, and Federal Circuit, not binding everywhere. But
its reasoning is licence-agnostic and it is the case everyone cites for "attribution conditions
are enforceable". **Apache-2.0 §4's "provided that You meet the following conditions" is even more
explicitly conditional than the Artistic License text at issue.** Treat "this is only a contract
breach worth nominal damages" as unavailable. **Confidence: HIGH** that _Jacobsen_ is the governing
frame in the US; **MEDIUM** on how a non-Federal-Circuit court would apply it to Apache-2.0.

**The other side of the ledger — why the practical risk is lower than the legal risk:**

| Factor                                                                                                                                                                                                                                      | Effect                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Enforcement burden is high.** _Hellwig v. VMware_ (Hamburg, 2016) was dismissed because the plaintiff "failed to identify in the VMware product the specific lines of code for which he owned copyright" — the merits were never reached. | An AionUi claimant faces the same problem across ~310 diverged files. Costly.                                                                                                                                                                                                                          |
| **SFLC's own observation:** "All the litigated cases of community complaint against commercial redistributors involved failure to provide complete and corresponding source."                                                               | Notice-only breaches historically resolve cooperatively. Wayland _does_ provide source (AGPL).                                                                                                                                                                                                         |
| **No ASF enforcement arm; AionUi is a small commercial project.**                                                                                                                                                                           | Most likely realistic outcome is a GitHub issue or a blog post, not a complaint.                                                                                                                                                                                                                       |
| **Reputational channel is the live one.**                                                                                                                                                                                                   | The _actual_ documented harm pattern for Apache-2.0 fork-attribution disputes is public shaming and the upstream reacting by hardening its licence — the Open WebUI / Cherry Studio pattern of adding branding/commercial clauses because forks stripped attribution. That costs Wayland its upstream. |

**But three factors make Wayland's fact pattern materially worse than the typical case:**

1. **The notice was replaced, not omitted.** Intent is far easier to infer from a surgical
   one-line substitution inside an otherwise byte-identical file than from a missing header.
2. **The shipped notices file affirmatively asserts Ferrox authorship** of files that are 100%
   copies. That is an affirmative false statement, not a gap.
3. **§1202's identicality question is live right now.** The district court in _Doe v. GitHub_ held
   §1202(b) has an **identicality requirement** and dismissed the CMI claims because Copilot's
   output was "more often a modification than a verbatim copy". The Ninth Circuit heard argument on
   that certified question on **2026-02-11** and, as of this research, **has not ruled**.
   ⚠️ **Wayland's proof case would satisfy identicality even under the strict rule** —
   `electronSafe.ts` is a verbatim copy with CMI altered. So the identicality defence that saved
   GitHub does not obviously save Wayland for the identical subset (~3 files at 100%, 6 at ≥88% in
   the 23-file sample; extrapolated the identical-or-near subset is nontrivial). If the Ninth
   Circuit _removes_ the identicality requirement, exposure extends across the whole derived set.
   **This is a moving target and a reason to remediate now rather than after the ruling.**

**Bottom line for the roadmapper:** low probability of litigation, non-trivial probability of a
public dispute, and an exposure tail (§1202 statutory damages × ~310 files) that is
disproportionate to the cost of the fix. **The fix is a scripted header sweep. Do it.**
**Confidence: MEDIUM** overall; **LOW** on any probability estimate — I am not going to invent one.

---

## Obligation Dependencies

```
A8 (delete the false authorship sentence)     ← DO THIS FIRST, standalone, 1 line
    └──unblocks──> honest framing for everything below

MEASUREMENT (all 445 same-path files, per H-CROSSAUDIT method)
    └──gates──> A1 (§4(b) modification notices, ~310 files)
    └──gates──> A2 (§4(c) AionUi copyright restoration, ~310 files)
                    └──rides-along──> A10 (AGPL §7 per-file pointer)
                    └──rides-along──> AGPL §5(a) date-stamped modification notice
    └──gates──> re-adjudication of 3f1c5ba10 (acpx / Zed / Codex CLI / Claude Code)

A9 (2,615-file SPDX contradiction) ──requires──> COUNSEL DECISION on target expression
    └──must-batch-with──> A1/A2  (same files, same sweep — do not touch headers twice)

A4 (restore verbatim Apache-2.0.txt)      independent, LOW
A3 (web-fetch.ts Google notice)           independent, LOW
A5 (OfficeCLI NOTICE verbatim)            independent, LOW
A6 (OpenClaw tunnel trio + types.ts)      independent, LOW
A7 (notices truth pass)                   independent, LOW
npm licence report (144 deps)             independent, MEDIUM
    └──may-discover──> new §4(d) duties (any Apache-2.0 dep that ships a NOTICE)

CI header lint ──must-come-after──> A1/A2/A9 sweep (else it fails on 2,615 files)
```

### Dependency notes

- **A8 before everything.** One sentence, shipped, affirmatively false, and it is the §1202(a)
  hook. Zero reason to sequence it behind a 445-file measurement.
- **A9 must batch with A1/A2.** All three rewrite the same header blocks in the same ~310–2,615
  files. Touching those headers twice doubles the diff, doubles the review, and risks the Rollup
  `@license` stripping regression the audit already found once (`485b212ff`). **One sweep.**
- **Counsel gates A9, not A1/A2.** A1 and A2 are "restore what was there plus say we changed it" —
  that is unambiguously the right direction under every reading, and does not need a legal opinion
  to start. A9 asks "what should our outbound per-file SPDX expression _be_", which is a genuine
  legal-drafting question. **Do not let A9's counsel dependency block A1/A2.**
- **The measurement gates the derived/original split, and the split determines who gets which
  header.** Do not bulk-apply. Anti-feature above.
- **CI lint last**, or it blocks its own remediation.

---

## Scope: what this milestone must do

### Must ship (WLD-I)

- [ ] **A8** — delete/rewrite `THIRD-PARTY-NOTICES.md:22-23`. _Shipped false authorship claim._
- [ ] **A4** — restore `notices/Apache-2.0.txt` verbatim from apache.org. _§4(a) is currently defective._
- [ ] **Measurement** — all 445 same-path files, H-CROSSAUDIT method, results in a checked-in
      provenance manifest. _Everything else depends on it; and it is the artefact that answers a
      demand letter._
- [ ] **A1 + A2 (+ AGPL §5(a) date) in one sweep** — dual copyright + "Modified by Ferrox Labs,
      <date>" on the derived set. _§4(b) is per-file with no alternative._
- [ ] **A3, A5, A6, A7** — the small, independent, already-scoped items.
- [ ] **Re-adjudicate `3f1c5ba10`** — restore the clauses or evidence the deletions. _Two
      evidentiary standards in one branch is the finding that will be quoted back at you._
- [ ] **`notices/README.md` rewrite** — it ships and it states a falsehood.

### Ship if counsel lands in time, else next milestone

- [ ] **A9 — the 2,615-file SPDX resolution.** Biggest, needs a legal decision on the target
      expression, and must batch with A1/A2 if it happens at all. **If counsel is not back before
      the A1/A2 sweep, decide explicitly: either wait and do one sweep, or accept a second sweep.
      Do not discover this mid-flight.**

### Defer

- [ ] **npm dependency licence report (144 deps).** Real gap, independent, no interaction with the
      AionUi work. Its own packet.
- [ ] **CI header lint.** Must follow the sweep.
- [ ] **`WhatsAppPlugin.ts` reconnect-constants call** — my read is it earns a header (§5), but it
      is one file and it rides the A6 pass.

---

## Obligation Prioritisation Matrix

| Obligation                             | Legal exposure if unfixed                                | Cost   | Priority               |
| -------------------------------------- | -------------------------------------------------------- | ------ | ---------------------- |
| A8 false authorship sentence           | HIGH (§1202(a), shipped, affirmative)                    | LOW    | **P1**                 |
| A1 §4(b) per-file modification notices | HIGH (per-file text, zero compliance)                    | MEDIUM | **P1**                 |
| A2 §4(c) AionUi copyright restoration  | HIGH (§1202(b) + Jacobsen conditions)                    | MEDIUM | **P1**                 |
| Measurement / provenance manifest      | HIGH (gates everything; defence artefact)                | MEDIUM | **P1**                 |
| A4 verbatim Apache-2.0.txt             | MEDIUM (§4(a) defective; cheap to fix)                   | LOW    | **P1**                 |
| A7 notices truth pass                  | MEDIUM (shipped false claims)                            | LOW    | **P1**                 |
| A3 web-fetch.ts Google notice          | MEDIUM (Google is a licensor with capacity)              | LOW    | **P1**                 |
| A5 OfficeCLI NOTICE verbatim           | MEDIUM (§4(d) genuinely binds — only upstream that does) | LOW    | **P1**                 |
| A6 OpenClaw tunnel trio + types.ts     | MEDIUM (live MIT gap; Rollup strips it today)            | LOW    | **P1**                 |
| Re-adjudicate `3f1c5ba10`              | MEDIUM (one clause names GPL-family acpx/Zed)            | MEDIUM | **P2**                 |
| A9 SPDX contradiction (2,615)          | MEDIUM-HIGH (grants away rights; scanner-visible)        | HIGH   | **P2** (counsel-gated) |
| `notices/README.md` rewrite            | LOW (ships, stale, false)                                | LOW    | **P2**                 |
| npm dep licence report                 | LOW-MEDIUM                                               | MEDIUM | **P3**                 |
| CI header lint                         | none (prevention)                                        | MEDIUM | **P3**                 |

---

## Precedent: how comparable forks handle this

| Project                                                            | Situation                                                                                            | Convention adopted                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OpenSearch** (fork of Elasticsearch 7.10.2, Apache-2.0)          | Closest structural analogue: large Apache-2.0 fork of an Apache-2.0 upstream, commercially motivated | `Copyright OpenSearch Contributors` + `SPDX-License-Identifier: Apache-2.0`, **retaining the Elastic copyright where an Elastic copyright is needed**, with upstream NOTICE content rolled into the project NOTICE. Explicitly _additive_, never substitutive. |
| **Apache Software Foundation** (as a consumer of third-party code) | Its own policy for code it did not receive from the owner                                            | "Do not modify or remove any copyright notices or licenses within third-party works." Relocation to NOTICE permitted **only** with the owner's submission or written permission.                                                                               |
| **Linux kernel** (SPDX conversion)                                 | Mass per-file licence-header normalisation across ~60k files                                         | Per-file `SPDX-License-Identifier`, machine-checkable, reviewed in tranches. Precedent that a mass header sweep is a normal, tractable engineering task — not a reason to avoid one.                                                                           |
| **Open WebUI / Cherry Studio**                                     | Upstreams that got forked-and-stripped                                                               | Reacted by _hardening their licences_ (branding/commercial clauses). This is the realistic downside channel for Wayland: not a lawsuit, but AionUi changing terms and Wayland losing its upstream.                                                             |

**Wayland's approach:** adopt the OpenSearch convention (additive dual notice), add the §4(b)/§5(a)
modification statement OpenSearch does not need, and put the AGPL §7 pointer in the same block.

---

## What to ask counsel (Sean has already agreed to counsel on remedy)

**Do not ask counsel to do the fact-finding.** The measurement is engineering and it is already
scoped. Ask these, in this order:

1. **Retroactive exposure for past releases.** Restoration is prospective. What is the exposure for
   copies already distributed since root commit `2b3b60e11` (2026-07-06)? Does AionUi hold a
   registered US copyright (gating statutory damages)? Chinese-origin work — what is the practical
   forum?
2. **17 U.S.C. § 1202 — the real question.** The upstream notice was _replaced_, not omitted, in
   otherwise byte-identical files. (a) Does that support §1202(b)(1) "alter" and §1202(b)(3)
   distribution claims? (b) Does `THIRD-PARTY-NOTICES.md:22-23` support a §1202(a) false-CMI claim?
   (c) How is "per violation" counted under §1203(c)(3)(B) — per file, per work, per release? (d)
   How does the pending Ninth Circuit ruling in _Doe v. GitHub_ on the identicality requirement
   (argued 2026-02-11) change the analysis, and does that argue for remediating before it lands?
3. **A9 — the outbound SPDX expression. This is the decision we cannot make without you.** 2,615
   files declare `SPDX-License-Identifier: Apache-2.0`; the project `LICENSE` is AGPL-3.0-or-later;
   0 files declare AGPL. (a) Have we been granting Apache-2.0 rights in Ferrox-authored code for
   the life of the project, and is that grant revocable? (b) What should the per-file expression be
   for a derived file (`Apache-2.0 AND AGPL-3.0-or-later`? `AGPL-3.0-or-later` with an origin
   comment? something else)? (c) For a Ferrox-original file? (d) Does correcting 2,615 headers
   downward create any estoppel problem with anyone who relied on the Apache declaration?
4. **Does Apache-2.0's lack of a termination clause help or hurt us?** Apache-2.0 has no general
   termination and no cure provision (verified: "terminate" appears once, §3, patent-defensive
   only). So the grant did not self-terminate. But under _Jacobsen v. Katzer_ §4 is a set of
   _conditions_, so out-of-condition distribution may be infringing use. How do those interact?
5. **Sufficiency review of the proposed remedy**, not design of it. We will hand you: the
   provenance manifest, the proposed header template, and the notices diff. Question: does this
   discharge, and is there anything we should _also_ do (proactive notice to AionUi? a public
   statement? nothing?).
6. **Should we proactively notify AionUi / Google?** SFC's enforcement principles favour private
   engagement; proactive disclosure is the cheapest goodwill available but it also creates a dated
   record of knowledge. Judgement call we want yours on.

**Do NOT ask counsel:** whether files are derived (measured), whether AionUi ships a NOTICE
(probed: 404), whether Apache-2.0 is AGPL-compatible (settled: yes, one-way), or whether §4(d)
binds absent an upstream NOTICE (settled by the text: it does not).

---

## Confidence Summary

| Claim                                                                            | Confidence                                                          | Basis                                                                                    |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Replacing an upstream copyright header violates §4(c)                            | **HIGH**                                                            | Plain licence text + ASF third-party policy                                              |
| §4(b) is per-file with no central-file option                                    | **HIGH**                                                            | Plain licence text ("modified files")                                                    |
| §4(d) binds only where upstream ships a NOTICE                                   | **HIGH**                                                            | Plain text ("If the Work includes…") + probed all four upstreams                         |
| Apache-2.0 has no cure and no general termination clause                         | **HIGH**                                                            | Grepped the primary text; contradicts popular secondary sources                          |
| §4(c) alone requires _per-file_ retention                                        | **MEDIUM** — authorities split                                      | SFLC says relocation usually OK; text/structure and ASF third-party policy say otherwise |
| Apache→AGPL relicensing preserves the notice duty via AGPL §7(b)                 | **MEDIUM-HIGH** — strong inference                                  | §7(b) text is an exact fit; no source states it in these words                           |
| AGPL §7 final ¶ imposes a per-file statement-or-pointer duty for inherited terms | **MEDIUM** — inference                                              | Text says "terms you add"; inherited-terms application untested                          |
| §4(c) does not reach binary-only distribution                                    | **HIGH** on text, **MEDIUM** on untested                            | Form-scoped by definition; no authority found                                            |
| …but AGPL §6/§13 force source distribution, so §4(c) is triggered                | **HIGH**                                                            | Wayland's own LICENSE text                                                               |
| MIT "substantial portion" threshold                                              | **LOW** — no authority found                                        | No case, no OSI/FSF/SFC definition located                                               |
| A rewritten port of MIT code carries the obligation                              | **MEDIUM-HIGH**                                                     | Translation = derivative work (17 U.S.C. §101); settled copyright principle              |
| Jacobsen v. Katzer governs (attribution terms = conditions → infringement)       | **HIGH** as to the holding, **MEDIUM** as to Apache-2.0 application | Fed. Cir. 2008; Artistic License not Apache                                              |
| §1202 exposure is real for the identical subset                                  | **MEDIUM**                                                          | Doe v. GitHub district holding + pending 9th Cir. ruling; identicality satisfied here    |
| Any probability estimate of actual enforcement                                   | **LOW — refusing to quantify**                                      | No Apache-2.0 attribution enforcement history found                                      |
| Apache-2.0 attribution enforcement history exists                                | **NO AUTHORITY FOUND**                                              | Searched; none located. Nearest is Artistic (Jacobsen) and GPL (Hellwig, Artifex).       |

---

## Sources

**Primary (read verbatim — highest confidence):**

- `notices/Apache-2.0.txt` in-tree — Apache-2.0 §1 definitions, §3, §4(a)–(d), APPENDIX. _Note: the APPENDIX is locally modified; see A4._
- `LICENSE` in-tree — AGPL-3.0 §0 (Appropriate Legal Notices), §4, §5(a)–(d), §6, §7 (incl. §7(b) and final ¶), §8, §13.
- [Apache License 2.0 canonical text](https://www.apache.org/licenses/LICENSE-2.0.txt)
- [17 U.S.C. § 1202](https://www.law.cornell.edu/uscode/text/17/1202) — §1202(a) false CMI, §1202(b) removal/alteration, §1202(c) definition.
- [17 U.S.C. § 1203](https://www.law.cornell.edu/uscode/text/17/1203) — §1203(b) fees, §1203(c)(3)(B) statutory damages $2,500–$25,000 per violation.
- [The MIT License — OSI](https://opensource.org/license/mit)
- GitHub contents API probes, 2026-07-30: `iOfficeAI/OfficeCLI/contents/NOTICE` → 200; `iOfficeAI/AionUi/contents/NOTICE` → 404; `iOfficeAI/AionUi/contents/LICENSE` → 200 (Apache-2.0, not a GitHub fork).
- `raw.githubusercontent.com/iOfficeAI/AionUi/main/packages/desktop/src/common/electronSafe.ts` — upstream header captured verbatim.
- In-tree counts, 2026-07-30: 2,615 files with `SPDX-License-Identifier: Apache-2.0` under `src/`; 0 with AGPL; 0 with an AionUi copyright; 3,966 `.ts`/`.tsx` total.

**Authoritative secondary:**

- [ASF Source Header and Copyright Notice Policy](https://www.apache.org/legal/src-headers.html) — "Treatment of Third-Party Works": _"Do not modify or remove any copyright notices or licenses within third-party works."_
- [ASF: Assembling LICENSE and NOTICE files](https://infra.apache.org/licensing-howto.html) — NOTICE is "reserved for a certain subset of legally required notifications"; _"Do not add anything to NOTICE which is not legally required."_
- [Apache License v2.0 and GPL Compatibility](https://www.apache.org/licenses/GPL-compatibility.html) — ASF's own position on one-way Apache→GPLv3 compatibility.
- [SFLC — Managing Copyright Information within a Free Software Project (2012)](https://softwarefreedom.org/resources/2012/ManagingCopyrightInformation.html) — the strongest authority _for_ central relocation: _"it's usually acceptable to move notices from individual source files to a central attribution file"_; and _"wrongfully removing one is a violation of the license from that contributor and may be copyright infringement."_
- [SFLC — Guide to GPL Compliance, 2nd ed.](https://softwarefreedom.org/resources/2014/SFLC-Guide_to_GPL_Compliance_2d_ed.html) — _"All the litigated cases of community complaint against commercial redistributors involved failure to provide complete and corresponding source."_
- [SFC — Principles of Community-Oriented GPL Enforcement](https://sfconservancy.org/copyleft-compliance/principles.html)
- [FSF — License Compatibility and Relicensing](https://www.gnu.org/licenses/license-compatibility.en.html) and [FSF licence list](https://www.gnu.org/licenses/license-list.en.html)
- [Apache Whisker — All About Copyright Notices](https://creadur.apache.org/whisker/examples/copyright-notices.html) — distinguishes a _copyright notice_ from the _NOTICE_ file. Does **not** address per-file headers.

**Case law:**

- [Jacobsen v. Katzer, 535 F.3d 1373 (Fed. Cir. 2008)](https://www.cafc.uscourts.gov/opinions-orders/08-1001.pdf) — attribution terms are enforceable conditions; breach → copyright infringement.
- [Doe v. GitHub, Inc. (N.D. Cal.)](https://caselaw.findlaw.com/court/us-dis-crt-n-d-cal/2200493.html) — §1202(b) identicality requirement; CMI claims dismissed. Certified question argued in the Ninth Circuit 2026-02-11, **no ruling as of this research** ([Venable](https://www.venable.com/insights/publications/2024/10/dmca-question-certified-for-appellate-court), [Skadden](https://www.skadden.com/insights/publications/2024/02/motion-to-dismiss-ruling-provides-further-insight-into-how-courts-view-ai-training-data-cases)).
- [Hellwig v. VMware — dismissed on evidentiary specificity](https://lwn.net/Articles/696936/) ([SFC FAQ](https://sfconservancy.org/copyleft-compliance/vmware-lawsuit-faq.html)) — plaintiff could not localise the code he owned.
- Artifex Software v. Hancom (N.D. Cal. 2017) — GPL, $1.5M settlement after three years of ignored compliance requests. Cited for the _pattern_ (ignoring requests is what escalates), not as attribution authority.

**Precedent practice:**

- [opensearch-project/.github#21 — "Correct copyright notices to reflect Copyright OpenSearch Contributors"](https://github.com/opensearch-project/.github/issues/21)

**In-tree inputs:**

- `.planning/phases/WLD-H-attribution/H-CROSSAUDIT.md` — the measurement method, its calibration controls, and the eight traps. **Its methodology is sound; adopt it, with the two refinements in §5.**
- `notices/THIRD-PARTY-NOTICES.md` — the shipped artefact under repair.

**Explicitly not found (valid findings):**

- No litigated or settled **Apache-2.0-specific** attribution/notice case.
- No authority defining MIT's **"substantial portion"** threshold.
- No authority testing whether **§4(c) reaches Object-form-only** distribution.
- No source stating in terms that **Apache-2.0 §4(b)/(c) survive GPLv3 relicensing as §7(b) additional terms** — the analysis is mine, and it is the standard practitioner reading, but I could not source the sentence.

---

_Obligation research for: third-party licence attribution, Milestone WLD-I_
_Researched: 2026-07-30_
_⚠️ Not legal advice. Prepared to scope a counsel engagement, not to substitute for one._
