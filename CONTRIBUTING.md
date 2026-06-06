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

## Trademark

"Wayland" and the Wayland marks are trademarks of Ferrox Labs. The AGPL covers
the **code**, not the **name** - forks must rebrand, though you can always say
your fork is "built on Wayland." Full policy, including the permitted nominative
uses, is in [TRADEMARK.md](./TRADEMARK.md).
