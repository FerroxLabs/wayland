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

## OfficeCLI

- **Project:** OfficeCLI
- **Source:** https://github.com/iOfficeAI/OfficeCLI
- **Bundled release:** `v1.0.136`
- **License:** Apache License, Version 2.0
- **Copyright/NOTICE:** OfficeCLI Copyright 2026 OfficeCLI
  (https://OfficeCLI.AI), created and maintained by goworm.
- **Use in Wayland:** Wayland redistributes unmodified, platform-specific native
  release binaries for local DOCX, XLSX, and PPTX authoring and rendering.
- **Upstream bundled components:** DocumentFormat.OpenXml 3.4.1,
  System.CommandLine 3.0.0-preview.2.26159.112, and the self-contained .NET
  Runtime, each under the MIT License. The upstream notice and MIT terms are
  reproduced in `notices/OfficeCLI-THIRD-PARTY-NOTICES.txt`.

Wayland verifies the selected release asset against the SHA-256 digest published
by GitHub before it is copied, executed, or packaged. Wayland-managed processes
disable OfficeCLI background updates so the verified release identity cannot
change after packaging.

## 7zip-bin

- **Project:** 7zip-bin
- **Source:** https://github.com/develar/7zip-bin
- **Bundled release:** `5.2.0`
- **License:** MIT
- **Use in Wayland:** Wayland bundles the unmodified Windows ARM64 and x64
  `7za.exe` binaries solely to extract the exact checksum-pinned Classic
  v0.11.8 NSIS recovery artifact into an isolated directory. The extractor is
  itself size/SHA-256 verified immediately before use.

The full MIT license text is included as `notices/7zip-bin-MIT.txt`.

---

### How to update this file

When Wayland adds, removes, or substantially modifies its dependency on an Apache-2.0
or similarly attribution-required upstream, edit this file. Do not edit `LICENSE` -
that is the canonical license text and must remain unchanged.
