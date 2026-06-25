# Contributing to Wayland

Thanks for helping build Wayland.

## License & contributor agreement (read before your first PR)

Wayland is licensed under **AGPL-3.0-or-later** (see `LICENSE`). To keep a
sustainable open-core project - a freely self-hostable core plus a commercial
hosted/Pro tier - we ask every contributor to agree to a lightweight CLA:

> By submitting a contribution, you certify that you wrote it (or have the right
> to submit it), and you grant **Ferrox Labs** a perpetual, worldwide,
> royalty-free license to use, modify, sublicense, and **relicense** your
> contribution - including under the AGPL and under a separate commercial
> license - while you retain copyright to your own work.

This is what lets us offer the hosted Pro version without forcing every
contributor's work into a proprietary fork. It's the same model GitLab,
Grafana, and Sentry use. We'll wire up a CLA-assistant bot on the repo so this
is a one-click acknowledgement on your first PR.

## Ground rules

- One logical change per PR; keep diffs surgical.
- Match the existing code style and conventions (see `AGENTS.md`).
- Tests/typecheck must pass before review.
- Don't add features beyond the issue/scope you're addressing.

## How PRs are reviewed and accepted

We welcome fixes, but we do not merge changes blindly - not even good-looking
ones. Every PR is tiered by **what it touches**, not by how polished it is.

**Tier 1 - Scoped bug fix, references a real issue, no policy surface.**
Fast-track. We verify it fixes the issue, passes all gates, and adds nothing
extra. Merged.

**Tier 2 - Bug fix that touches shared/load-bearing code, or exceeds its
stated scope.** We ask you to split or justify the extra surface first. Merged
only after the blast radius is understood. ("While I was in there" changes get
sent back.)

**Tier 3 - New functionality (`feat:`).** Open an issue first and get a
maintainer's sign-off **before** building. Unsolicited feature PRs - even
useful ones - may be declined if they do not fit the product direction. This
keeps scope and the codebase coherent.

**Tier 4 - Anything that touches policy, ethos, or methodology.** These are
owner-only and are **not accepted from external PRs regardless of technical
quality**:

- `AGENTS.md` / `CONTRIBUTING.md` standards and process
- Support channels (support is via GitHub only - we do not add an email or
  other channel)
- Licensing, telemetry, analytics, phone-home, or any new external network call
- Flows that could violate a third party's terms of service
- Branding and front-facing wording
- Security posture (remote allow/deny lists, credential handling, safeStorage)

### The checklist every PR runs before merge

1. Does it reference a real, open issue? (Unsolicited features need an issue and
   a maintainer's sign-off.)
2. Is it scoped to the stated change? Every file and function touched beyond the
   fix gets flagged.
3. Policy/ethos scan (the Tier 4 list above).
4. Does it fix the root cause, or mask a symptom?
5. Gates pass locally: `bun run typecheck`, `bun run lint`, `bun run test`,
   `node scripts/check-i18n.js`, and the `prek` CI replication.
6. Is the fix already shipped or in flight? (Check before duplicating work.)
7. Author/provenance is sane and the CLA is acknowledged.

A PR that fixes a genuine issue cleanly and passes this list will be merged
quickly. A PR that expands functionality, or touches anything in Tier 4, will be
held or declined no matter how well written it is. That is by design.

## Trademark

"Wayland" and the Wayland marks are trademarks of Ferrox Labs. The AGPL covers
the **code**, not the **name** - forks must rebrand, though you can always say
your fork is "built on Wayland." Full policy, including the permitted nominative
uses, is in [TRADEMARK.md](./TRADEMARK.md).
