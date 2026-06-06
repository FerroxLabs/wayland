# Vendored waylandteams bundle

This directory is a vendored snapshot of the `waylandteams` bundle, copied into the app repo so that meta-agents running in isolated git worktrees can read it without reaching out to an external repo.

## Source

- Upstream: `~/dev/waylandteams/` at HEAD as of 2026-05-18 evening (W0 of the team-blitz workstream); Humanizer specialist appended 2026-05-19.
- Files copied:
  - `contributes/assistants.json` → `./assistants.json` (45 entries: 24 launchers with `kind: 'team'` + 21 specialists with `kind: 'specialist'`)
  - `assistants/launchers/*.md` → `./launchers/*.md` (24 launcher prose docs)

Humanizer is a regular specialist (no `standing`/`teammates`/`rituals`), so the runtime overlay does nothing for it - adding the entry only keeps this snapshot honest with upstream. Live extension load (via the dev symlink to `~/dev/waylandteams/`) is the authoritative source for the running app's per-assistant content.

## Reason

Per `.blackboard/team-blitz/plan-audit/TRIAGE.md` C2: meta-agents in isolated worktrees (`isolation: "worktree"` per methodology-18) cannot reach `~/dev/waylandteams/` - that path resolves outside the worktree's git ancestry. Vendoring eliminates the worktree-escape problem in W1a.

## Sync policy

When `v0.6.0-wayland-teams` ships, sync upstream changes (schema additions made during the blitz: `teammates: string[]`, `rituals: [{name, cadence}]`, `standing: boolean`) back to `~/dev/waylandteams/` as a separate bundle PR. Until then the vendored copy is the source of truth for the running app.

## Do not edit by hand outside of W1a

W1a (per `DISPATCH-PACKETS.md` `#w1a`) is the only wave authorized to mutate this directory. All other waves treat it as read-only.
