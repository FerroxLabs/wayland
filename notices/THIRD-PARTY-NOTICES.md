# Third-party notices

Wayland incorporates source code from the projects below. This file records the attributions
Wayland is obliged to carry, and is kept to that.

Wayland itself is distributed under the GNU AGPL-3.0; see `LICENSE` at the repository root.
The Apache-2.0 and MIT texts shipped alongside this file cover the upstream code only.

None of the Apache-2.0 upstreams below distributes a NOTICE file, so Apache-2.0 Section 4(d)
imposes no further attribution obligation. Section 4(a) is met by the included licence text
(`notices/Apache-2.0.txt`) and Section 4(b) by the modification notices in each entry.

## AionUi

- **Project:** AionUi (aionui.com)
- **Source:** https://github.com/iOfficeAI/AionUi
- **License:** Apache License, Version 2.0
- **Copyright:** Copyright 2025 AionUi (aionui.com)
- **Use in Wayland:** The Wayland desktop application originated as a derivative of AionUi and
  has since diverged substantially into an independent product.
- **Modifications:** Per Apache-2.0 Section 4(b): the codebase has been substantively modified
  throughout. A per-file record of which files derive from AionUi is being established; until
  it is complete, the presence of a Ferrox Labs copyright header in a source file should not be
  read as a claim that Ferrox Labs authored that file.

## Gemini CLI

- **Project:** Gemini CLI
- **Source:** https://github.com/google-gemini/gemini-cli
- **License:** Apache License, Version 2.0
- **Copyright:** Copyright 2025 Google LLC
- **Use in Wayland:** Source under `src/process/agent/gemini/cli/` derives from Gemini CLI and
  retains the original `Copyright 2025 Google LLC` headers and Apache-2.0 SPDX identifiers.

## Wayland-Core (fork of aionrs)

- **Project:** Wayland-Core, a Ferrox Labs maintained fork of aionrs
- **Upstream source:** https://github.com/iOfficeAI/aionrs
- **License:** Apache License, Version 2.0
- **Copyright:** Copyright 2025 aionrs contributors (upstream); modifications and all
  subsequently added crates Copyright 2026 Ferrox Labs
- **Use in Wayland:** Wayland bundles Wayland-Core as its Rust engine. Wayland-Core began as a
  fork of aionrs and the workspace has since grown well beyond it; most of its crates are
  Ferrox Labs originals with no upstream counterpart.
- **Modifications:** Per Apache-2.0 Section 4(b), changes to the upstream aionrs source
  include:
  - Workspace crates renamed (`aion-*` to `wcore-*`).
  - Compiled binary renamed (`aionrs` to `wayland-core`).
  - Default config file renamed (`.aionrs.toml` to `.wcore.toml`).
  - User config directory renamed (`~/.aionrs` to `~/.wcore`).
  - New `WCORE_*` env vars and template tokens added as primary names; legacy
    `AIONRS_*` forms retained as backward-compat aliases.

## OpenClaw

- **Project:** OpenClaw
- **Source:** https://github.com/openclaw/openclaw
- **Adapted at commit:** `aee2681a`
- **License:** MIT
- **Copyright:** Copyright (c) 2026 OpenClaw Foundation; portions Copyright (c) 2025 Peter
  Steinberger, the copyright holder recorded in the revision Wayland adapted.
- **Use in Wayland:** Parts of the channels subsystem adapt OpenClaw source. Every file
  containing adapted code carries its own attribution header; the affected set is the Signal,
  Slack, Discord, iMessage, LINE, MS Teams, IRC, Mattermost, Nostr, Twitch, Bluebubbles,
  Synology Chat and Google Chat integrations, the WhatsApp Baileys backend, the shared
  reaction and typing helpers under `src/process/channels/core/`, and
  `src/process/utils/backoff.ts`, `channel-errors.ts` and `retry-policy.ts`. Where a file was
  adapted from a specific upstream file, its header names that file. Files with no adapted
  code carry no such header.

The full MIT license text is included as `LICENSES/openclaw.txt`, the path the per-file
headers cite.

## pptx2json

- **Project:** pptx2json
- **Source:** https://github.com/x1-/pptx2json
- **Vendored release:** `0.0.10`
- **License:** MIT
- **Copyright:** Copyright (c) 2020 x1-
- **Use in Wayland:** Vendored verbatim at `src/vendor/pptx2json/` and used by
  `ConversionService.pptToJson`, replacing a runtime dependency on the abandoned npm
  package.

The full MIT license text is included as `LICENSES/pptx2json.txt`.

## Hermes Agent

- **Project:** Hermes Agent, by Nous Research
- **Source:** https://github.com/NousResearch/hermes-agent
- **License:** MIT
- **Copyright:** Copyright (c) 2025 Nous Research
- **Use in Wayland:** `src/process/channels/whatsapp-bridge/bridge.js` and `allowlist.js` adapt
  the upstream `scripts/whatsapp-bridge/` sources of the same names. Both ship as loose files
  under `Resources/whatsapp-bridge/` with their attribution headers intact.

The full MIT license text is included as `LICENSES/hermes-agent.txt`.

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
