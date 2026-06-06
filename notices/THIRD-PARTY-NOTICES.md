# Third-party notices

Wayland is built on, and includes substantial source code from, the following Apache-2.0
licensed projects. This notice satisfies the attribution requirement of the Apache License,
Version 2.0, Section 4(c).

## AionUi

- **Project:** AionUi (aionui.com)
- **Source:** https://github.com/iOfficeAI/AionUi
- **License:** Apache License, Version 2.0
- **Copyright:** Copyright 2025 AionUi (aionui.com)
- **Use in Wayland:** Portions of the Wayland desktop application originate from AionUi,
  including parts of the Electron main process, IPC bridge, renderer UI scaffolding,
  agent client protocol integration, and MCP services. Wayland has since diverged
  substantially into an independent product.

Per the Apache 2.0 License, Section 4(b), files derived from AionUi retain the original
copyright notices. The full text of the Apache License, Version 2.0, is included as
`notices/Apache-2.0.txt` alongside this file.

## Wayland-Core (fork of aionrs)

- **Project:** Wayland-Core, a Ferrox Labs maintained fork of aionrs
- **Upstream source:** https://github.com/iOfficeAI/aionrs
- **License:** Apache License, Version 2.0
- **Copyright:** Copyright 2025 aionrs contributors (upstream); modifications Copyright
  2026 Ferrox Labs
- **Use in Wayland:** Wayland integrates Wayland-Core as its Rust engine.
- **Modifications:** Per Apache-2.0 Section 4(b), the following changes have been made
  to the upstream aionrs source:
  - All workspace crates renamed (`aion-*` to `wcore-*`).
  - Compiled binary renamed (`aionrs` to `wayland-core`).
  - Default config file renamed (`.aionrs.toml` to `.wcore.toml`).
  - User config directory renamed (`~/.aionrs` to `~/.wcore`).
  - New `WCORE_*` env vars and template tokens added as primary names; legacy
    `AIONRS_*` forms retained as backward-compat aliases.
  - Original aionrs Apache-2.0 copyright headers are preserved in all forked source
    files.

---

### How to update this file

When Wayland adds, removes, or substantially modifies its dependency on an Apache-2.0
or similarly attribution-required upstream, edit this file. Do not edit `LICENSE` -
that is the canonical license text and must remain unchanged.
