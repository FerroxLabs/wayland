# WLD-H — Attribution audit: verified findings

**Status: investigation in progress, 2026-07-30.** Branch `packet/attribution-audit`.
Everything below was verified in the tree, with file:line. Nothing has been edited yet.

Supersedes parts of `H-BRIEF.md` — see §0 for the corrections.

---

## 0. Corrections to H-BRIEF.md

The brief was right that the ask does not survive contact, but it was wrong about two things and
missed a third file. Corrected here.

| H-BRIEF claim                                                              | Reality                                                                                                                                                              |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "`openclaw`/`hermes` are FUNCTIONAL. Do not touch them." (§1)              | **Half right.** The protocol/migration identifiers are functional. But there is also a large body of genuinely **MIT-licensed OpenClaw source** in the tree. See §3. |
| "There are TWO third-party notices files" (§4)                             | **There are THREE.** The brief missed `docs/legal/THIRD-PARTY-NOTICES.md`.                                                                                           |
| "The single genuine fork statement is `THIRD-PARTY-NOTICES.md:22,24`" (§2) | The real provenance statement is about **AionUi**, not aionrs, and the strongest wording sits in a file that **does not ship**. See §2.                              |

---

## 1. The actual provenance, established

Wayland desktop is a derivative work of **AionUi** (`github.com/iOfficeAI/AionUi`), Apache-2.0.
The Rust engine `wayland-core` is a separate fork of **aionrs** (same org), Apache-2.0.
The channels subsystem incorporates substantial **OpenClaw** source (MIT, © 2025 Peter Steinberger).

Outbound licensing is **AGPL-3.0** and is stated consistently in the two places that matter:

- `LICENSE` — 661 lines, `GNU AFFERO GENERAL PUBLIC LICENSE Version 3`. Zero occurrences of
  "Apache License".
- `package.json:6` — `"license": "AGPL-3.0-or-later"`.
- `readme.md:322` states the split correctly: app AGPL-3.0, engine Apache-2.0, "third-party
  attributions live in notices/".

**`readme.md` is clean.** It contains no fork/derivative confession, does not mention AionUi, and
lists OpenClaw and Hermes at `readme.md:216-217` as _supported integrations_ alongside their logos.
That is a feature list, not an attribution. Nothing to clean on the user-facing surface.

---

## 2. §4 RESOLVED — which notices file ships, and the defects in the other two

**Only `notices/` ships.** `electron-builder.yml:110-116`:

```yaml
extraResources:
  # Redistribution notices for bundled Apache/MIT components, including the
  - from: notices
    to: notices
```

`LICENSES/`, root `THIRD-PARTY-NOTICES.md`, and `docs/legal/` are **not** in `extraResources` and
never reach a user.

All three notices files were introduced in the same squashed commit `2b3b60e11` (v0.9.6-rc.1,
2026-06-07). Only `notices/THIRD-PARTY-NOTICES.md` has been touched since (`f6f7a8195`, 2026-07-16,
which added OfficeCLI and 7zip-bin). **`notices/` is authoritative de facto.**

### The three files, and what is wrong with each

| File                                | Ships? | Referenced? | Covers                                     | Defect                                                                                                                                                                                                                                                    |
| ----------------------------------- | ------ | ----------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notices/THIRD-PARTY-NOTICES.md`    | YES    | yes         | AionUi, Wayland-Core, OfficeCLI, 7zip-bin  | **Omits OpenClaw entirely** — see §3. Otherwise accurate.                                                                                                                                                                                                 |
| `THIRD-PARTY-NOTICES.md` (root)     | no     | no          | AionUi, Wayland-Core                       | Line 19-20 claims "The full Apache License is included as `LICENSE` at the root". **False** — `LICENSE` is AGPL-3.0. Also carries the harshest wording. Stale since 2026-06-07.                                                                           |
| `docs/legal/THIRD-PARTY-NOTICES.md` | no     | no          | AionUi, Wayland-Core (aside), **OpenClaw** | Line 8-10: "this repository ... **is distributed under the Apache License, Version 2.0**". **False, and it misstates our own outbound licence.** Also cites `src/process/services/channels/` which does not exist (real path is `src/process/channels/`). |

`notices/README.md` states the situation correctly and is the only prose in the tree that gets it
right: project is AGPL-3.0, `Apache-2.0.txt` "preserved solely to satisfy the attribution terms of
the AionUi and aionrs upstreams."

### Why `docs/legal/THIRD-PARTY-NOTICES.md` is the most serious item in this audit

It asserts the repository is distributed under Apache-2.0. That is not a missing attribution, it is
an **inaccurate grant of our own code under a permissive licence**. A third party who found that
file and relied on it would believe they could take Wayland source without AGPL's network-copyleft
obligation. It cuts against us, not against an upstream. It is also unshipped, unreferenced, and has
not been maintained in seven weeks.

### The wording difference on AionUi

- Root (unshipped): "**Wayland is a derivative work of AionUi.** The original AionUi source **forms
  the foundation** of the Wayland application ... all originate from AionUi."
- `notices/` (shipped): "**Portions** of the Wayland desktop application originate from AionUi ...
  **Wayland has since diverged substantially into an independent product.**"

The shipped wording is the accurate and proportionate one, and it is already what users see. The
"forms the foundation" framing that reads like a confession exists only in a file nobody receives.

---

## 3. The real compliance gap: shipped OpenClaw code with no shipped notice

This is the inverse of the original premise. We are not over-attributing in the artifact; we are
**under**-attributing.

Measured:

- **41 files** under `src/` carry a Peter Steinberger copyright header.
- **31 files** carry `* Licensed under the MIT License - see LICENSES/openclaw.txt`, including
  `scripts/install-signal-cli.mjs:8`.
- Concentrated in `src/process/channels/**` (Signal, Slack, IRC, Mattermost, Twitch, Nostr,
  Bluebubbles, Nextcloud Talk, Google Chat, Synology Chat, MS Teams, LINE, iMessage, webhook
  verifiers, WhatsApp bridge) plus `src/process/utils/{retry-policy,channel-errors,backoff}.ts`.

MIT requires: "The above copyright notice and this permission notice shall be included in all copies
or substantial portions of the Software."

The shipped `notices/` directory contains **no OpenClaw entry and no copy of the MIT text for it**.
`LICENSES/openclaw.txt` — the file 31 source files point at — **does not ship**. So the packaged app
distributes substantial MIT-licensed code while omitting the required notice.

**`LICENSES/openclaw.txt` is load-bearing and must not be deleted.** 31 source headers reference it
by path.

### Hermes

`LICENSES/hermes.txt` exists (MIT, © 2026 Eric (outsourc-e)) but **zero files reference it** and no
source file carries an outsourc-e copyright header. Note also that `readme.md:217` attributes Hermes
to **Nous Research**, which does not match the copyright holder in `LICENSES/hermes.txt`. Under
investigation — if there is no Hermes-derived code, this is a leftover to remove, not an attribution
to preserve.

---

## 4. Open item: SPDX tags claiming Apache-2.0

`src/renderer/components/settings/SettingsModal/contents/AboutModalContent.tsx:4` carries
`SPDX-License-Identifier: Apache-2.0`.

On an AionUi-derived file that is correct and required by Apache-2.0 §4(a)/(b). On a file we wrote,
it is an accidental permissive grant on our own code. The repo-wide count and the per-file split has
not yet been established. **This gates any conclusion about the SPDX surface.**

Separately: `AboutModalContent.tsx` (292 lines) contains **no** user-facing licence, notices, or
acknowledgements section. Users cannot reach attribution from inside the app; `notices/` ships as a
resource file on disk only. Defensible, but weak for both AGPL §5 and MIT.

---

## 5. What is safe to do, and what is not

**Safe, and it serves the ask:**

1. Add an OpenClaw entry to `notices/THIRD-PARTY-NOTICES.md` and ship the MIT text as
   `notices/OpenClaw-MIT.txt`. Closes a live MIT gap.
2. Delete root `THIRD-PARTY-NOTICES.md` and `docs/legal/THIRD-PARTY-NOTICES.md`. Both are unshipped,
   unreferenced, stale, and each contains a false statement about our own licence. Deleting them
   removes the "derivative work / forms the foundation" framing from the repo **and** removes the
   incorrect Apache-2.0 self-licence claim, while the shipped notice stays complete and gets
   _stronger_. No test or workflow references either path (verified across `tests/`, `scripts/`,
   `.github/workflows/`).
3. Resolve `LICENSES/hermes.txt` once the Hermes question is settled.

**Not safe:**

- Removing the AionUi entry from `notices/`, or the Wayland-Core/aionrs entry. Apache-2.0 §4(c)
  requires the NOTICE; §4(b) requires stating modifications. Both are compliance working correctly.
- Removing the 41 OpenClaw per-file MIT headers or `LICENSES/openclaw.txt`. MIT §requires the
  notice; 31 files cite the path.
- Renaming the `openclaw` / `hermes` / `zeroclaw` protocol and migration identifiers. They are
  persisted values driving a shipped migration feature (`src/common/types/migration.ts:20`,
  `src/common/types/detectedAgent.ts:21`) and appear in `readme.md:216-217` as supported
  integrations.

---

## 6. Still open

- The `ported from` / `adapted from` / `inspired by` inventory (~89 files, naming Cherry Studio,
  Foundry, Flow, opencode) and the their-code vs our-code verdict per file.
- Whether the production bundler strips comments, i.e. whether the 41 per-file MIT headers survive
  into the shipped artifact at all.
- Repo-wide SPDX-License-Identifier count and split (§4).
- Hermes: derived code or leftover.
