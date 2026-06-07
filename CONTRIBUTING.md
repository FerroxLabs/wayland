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

## Pull requests & review

Every PR passes the same gate: a signed CLA, fully green CI (lint, format, typecheck,
tests, i18n), and a maintainer merge — nothing auto-merges. Some areas are **maintainer-only**
(the project's operating standards in `AGENTS.md`, license/CLA/trademark, security and support
policy, CI/release workflows, and credential/security-boundary code). PRs that change those are
declined with thanks; if you have a good idea for one of them, open an issue to discuss and a
maintainer will carry it. Full policy: [docs/contributing/pr-governance.md](docs/contributing/pr-governance.md).

We triage on a best-effort basis with no response-time promise — this is a self-managed
open-source project. That's not unfriendly; it's honest.

## Support & security

All support runs through **GitHub** — open an issue or a discussion. **There is no support
email.** For security vulnerabilities, use GitHub's **private vulnerability reporting** (the
"Report a vulnerability" button under the repo's Security tab); please don't open a public
issue for an exploitable report. See [docs/SECURITY.md](docs/SECURITY.md).

## Trademark

"Wayland" and the Wayland marks are trademarks of Ferrox Labs. The AGPL covers
the **code**, not the **name** - forks must rebrand, though you can always say
your fork is "built on Wayland." Full policy, including the permitted nominative
uses, is in [TRADEMARK.md](./TRADEMARK.md).
