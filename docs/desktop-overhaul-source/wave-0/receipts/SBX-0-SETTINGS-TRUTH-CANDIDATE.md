# SBX-0 settings-truth candidate receipt

Date: 2026-07-16
Scope: bounded, non-promoting Desktop truth correction only
Status: focused implementation proof; not M1S, packaged, or release proof

## Customer-correlated defect

The Desktop Security pane rendered switches for policy keys that bundled Core
`v0.12.25` does not consume at those locations. A user could therefore change
an apparent approval, environment, egress, or private-URL control without
changing the effective Browser/runtime policy. Raw Engine Mode copy also
omitted that it switches away from the active Desktop-managed Core profile and
stops Desktop MCP publication.

## Exact correction

- `src/renderer/pages/settings/WCoreConfig/panes/SecurityPane.tsx`
  replaces the ineffective switches with read-only, source-accurate status and
  routes approval policy to the existing Tools surface. It makes the bundled
  Core localhost/private-target limitation explicit and does not advertise an
  unsupported recovery key.
- `src/renderer/pages/settings/WCoreConfig/panes/RuntimePane.tsx`
  discloses that Raw Engine Mode uses Core's standalone config and does not
  inject the Desktop model, skills, specialists, or selected MCP connectors.
- `src/renderer/pages/settings/WCoreConfig/panes/OverviewPane.tsx` and
  `ProfilesPane.tsx` render the producer-resolved active profile name/path and
  fail closed to `Path unavailable`; they no longer fabricate
  `~/.wayland/profiles/default` or claim `~/.wayland-core/config.toml` is the
  active path.
- `tests/unit/renderer/settings/WCoreConfig.dom.test.tsx`
  proves the Security pane performs no config mutation and that Raw Engine Mode
  renders the complete authority/capability disclosure.

## Current proof

| Command                                                                                                       | Result                      |
| ------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `bun run test -- tests/unit/workspaceRetention.test.ts tests/unit/renderer/settings/WCoreConfig.dom.test.tsx` | PASS — 2 files, 36 tests    |
| targeted ESLint over the retention and settings correction files                                              | PASS — 0 warnings, 0 errors |
| `bun run typecheck`                                                                                           | PASS                        |
| `git diff --check` over the correction and planning files                                                     | PASS                        |

## Explicitly not proved or fixed

- No Core localhost/private-network grant was implemented.
- No active-profile migration, raw-config mutation, or automatic outside-
  Wayland routing was introduced.
- Xcode/toolchain roots, reference-aware temporary-workspace lifecycle,
  signed updater apply/relaunch, and context-budget continuation remain owned
  by their later packets.
- This receipt does not authorize M1S closure, packaging, cohort enrollment, or
  any sandbox/developer parity claim.
