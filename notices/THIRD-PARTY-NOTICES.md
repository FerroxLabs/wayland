# Third-party notices

Wayland is built on, and includes substantial source code from, the projects below. This
notice satisfies the attribution requirement of the Apache License, Version 2.0, Section
4(c) for the Apache-2.0 upstreams, and the notice requirement of the MIT License for the
MIT upstreams.

Wayland itself is distributed under the GNU AGPL-3.0; see `LICENSE` at the repository root.
The Apache-2.0 and MIT texts included here cover the upstream code only.

## AionUi

- **Project:** AionUi (aionui.com)
- **Source:** https://github.com/iOfficeAI/AionUi
- **License:** Apache License, Version 2.0
- **Copyright:** Copyright 2025 AionUi (aionui.com)
- **Use in Wayland:** Portions of the Wayland desktop application originate from AionUi,
  including parts of the Electron main process, IPC bridge, renderer UI scaffolding,
  agent client protocol integration, and MCP services. Wayland has since diverged
  substantially into an independent product.

Per the Apache 2.0 License, Section 4(b), notice is given that Wayland has changed the
upstream files: the codebase has been substantively modified throughout, and every source
file carrying a Ferrox Labs copyright header is modified or newly authored by Ferrox Labs.
The full text of the Apache License, Version 2.0, is included as `notices/Apache-2.0.txt`
alongside this file.

## Gemini CLI

- **Project:** Gemini CLI
- **Source:** https://github.com/google-gemini/gemini-cli
- **License:** Apache License, Version 2.0
- **Copyright:** Copyright 2025 Google LLC
- **Use in Wayland:** Source under `src/process/agent/gemini/cli/` derives from Gemini CLI
  and retains the original `Copyright 2025 Google LLC` headers and Apache-2.0 SPDX
  identifiers. Reached Wayland by way of the AionUi upstream.

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

## OpenClaw

- **Project:** OpenClaw
- **Source:** https://github.com/openclaw/openclaw
- **Adapted at commit:** `aee2681a`
- **License:** MIT
- **Copyright:** Copyright (c) 2026 OpenClaw Foundation; portions Copyright (c) 2025 Peter
  Steinberger, the copyright holder recorded in the revision Wayland adapted.
- **Use in Wayland:** The channels subsystem incorporates and adapts OpenClaw source.
  Affected code lives under `src/process/channels/` (the Signal, Slack, Discord, webhook,
  iMessage, LINE, MS Teams, IRC, Mattermost, Nostr, Twitch, Bluebubbles, Nextcloud Talk,
  Synology Chat, and Google Chat integrations, plus the WhatsApp Baileys backend) and in
  `src/process/utils/backoff.ts`, `channel-errors.ts`, and `retry-policy.ts`. Individual
  files record the upstream file they were adapted from in their header.

The full MIT license text is included as `LICENSES/openclaw.txt`, the path the per-file
headers cite.

## Hermes Agent

- **Project:** Hermes Agent
- **License:** MIT
- **Copyright:** Copyright (c) 2025 Peter Steinberger / Hermes Agent contributors
- **Use in Wayland:** `src/process/channels/whatsapp-bridge/bridge.js` and `allowlist.js`
  adapt the upstream `scripts/whatsapp-bridge/` sources. Both ship as loose files under
  `Resources/whatsapp-bridge/` with their attribution headers intact.

The full MIT license text is included as `LICENSES/hermes.txt`.

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
