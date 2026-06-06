# Third-party notices

Wayland is built on, and includes substantial source code from, the following Apache-2.0
licensed project. This notice satisfies the attribution requirement of the Apache License,
Version 2.0, Section 4(c).

## AionUi

- **Project:** AionUi (aionui.com)
- **Source:** https://github.com/iOfficeAI/AionUi
- **License:** Apache License, Version 2.0
- **Copyright:** Copyright 2025 AionUi (aionui.com)
- **Use in Wayland:** Wayland is a derivative work of AionUi. The original AionUi source
  forms the foundation of the Wayland application: the Electron main process, IPC bridge,
  renderer UI scaffolding, agent client protocol integration, MCP services, and the
  multi-CLI cowork architecture all originate from AionUi.

Per the Apache 2.0 License, Section 4(b), files modified by Wayland carry no removal of
the original copyright notices. The full Apache License is included as `LICENSE` at the
root of this repository.

## Wayland-Core (fork of aionrs)

- **Project:** Wayland-Core, a Ferrox Labs-maintained fork of aionrs
- **Upstream source:** https://github.com/iOfficeAI/aionrs
- **License:** Apache License, Version 2.0
- **Copyright:** Copyright 2025 aionrs contributors (upstream); modifications Copyright
  2026 Ferrox Labs
- **Use in Wayland:** Wayland integrates Wayland-Core as its Rust engine. Source code
  under `src/process/agent/wcore/`, `scripts/prepareWaylandCore.js`, and related
  integration points references the engine as `wayland-core`.
- **Modifications:** Per Apache-2.0 Section 4(b), the following changes have been made
  to the upstream aionrs source. See `engine/CHANGELOG.md` (Unreleased section) for the
  authoritative divergence summary:
  - All 11 workspace crates renamed (`aion-*` → `wcore-*`).
  - Compiled binary renamed (`aionrs` → `wayland-core`).
  - Default config file renamed (`.aionrs.toml` → `.wcore.toml`).
  - User config directory renamed (`~/.aionrs` → `~/.wcore`).
  - New `WCORE_*` env vars and template tokens added as primary names; legacy
    `AIONRS_*` forms retained as backward-compat aliases.
  - Original aionrs Apache-2.0 copyright headers are preserved in all forked source
    files.

---

### How to update this file

When Wayland adds, removes, or substantially modifies its dependency on an Apache-2.0
or similarly attribution-required upstream, edit this file. Do not edit `LICENSE` -
that is the canonical license text and must remain unchanged.
