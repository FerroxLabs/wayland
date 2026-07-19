# C0 native OfficeCLI distribution receipt

Date: 2026-07-15  
Baseline: Wayland Desktop `v0.11.18`  
Lane: Desktop (`area:desktop-ui`)

## Contract proved

- Desktop pins the local authoring contract to `iOfficeAI/OfficeCLI` `v1.0.136`.
- All macOS, Linux, Alpine Linux, and Windows x64/ARM64 native release assets have pinned SHA-256 values.
- The exact release binary is verified before it is copied, executed, or packaged.
- The upstream install script is never used because its tagged bytes still resolve a moving `latest` artifact.
- The native bundle is a mandatory `extraResources` payload with a fail-hard post-package binary+manifest gate.
- Native OfficeCLI takes PATH precedence over the separately exact-pinned hosted npm `0.2.79` fallback.
- A missing native runtime fails closed with a reinstall/update repair message; Desktop performs no mutable runtime download.
- Every bundled Office/knowledge-work skill now uses the managed-runtime contract and never instructs the agent to curl, download, or bootstrap mutable OfficeCLI code; a recursive skill-library regression gate enforces it.
- The readiness probe uses top-level `--help`, because `help xlsx` lists schema elements rather than authoring commands.
- Runtime readiness requires exact `1.0.136` and the eight resident authoring commands, including `close`; version drift fails closed even when a different `1.x` release exposes similarly named commands. `watch` remains separately classified as preview.
- `contracts/officecli/v1/contract.json` pins the required command surface and the DOCX/XLSX/PPTX elements referenced across the bundled base and specialist skill packs; compatible build-host binaries must execute and pass it before packaging.
- Compatible build-host binaries must also complete real DOCX, XLSX, and PPTX create/mutate/query/validate/view journeys before packaging; the manifest records the smoke proof.
- The same executable proof covers the financial-model, data-dashboard, Word-form, and pitch-deck packs: formula evaluation, named ranges, validation, conditional formatting, workbook charts, structured content controls, legacy form fields, document protection, connected shapes, speaker notes, and embedded presentation charts.
- Post-package verification recomputes the binary hash and checks release, filename, contract proof, three-format smoke metadata, and specialist pack/primitives proof, so a present-but-tampered or semantically unproven bundle fails the release.

## Exact macOS ARM64 artifact proof

- Reported version: `1.0.136`.
- Asset: `officecli-mac-arm64`.
- SHA-256: `b8582853cc464fa0bdb2fabc2803821472c9449c38b365a7be79fcb53d6356e7`.
- Live capability result: `ready`, `local-binary`, zero missing required commands.
- Live DOCX journey passed: create, add paragraph, query content, validate with no errors, and render text view.
- Live XLSX journey passed: create, set `/Sheet1/A1`, query cell, validate with no errors, and render text view.
- Live PPTX journey passed: create, add slide and text shape, query content, validate with no errors, and render text view.
- Live preview journey passed: `officecli watch` announced `http://localhost:26319` and the HTTP endpoint returned the workbook viewer.

## Verification

- Focused Office/Cowork matrix: 11 files, 125 tests passed.
- `bun run typecheck` passed.
- Full authoritative Vitest suite: 1,272 files passed, 19 skipped; 13,237 tests passed, 137 skipped.
- `bunx electron-vite build` passed for production main, preload, and renderer bundles; existing chunk/import warnings remain.
- Targeted new-code oxlint: 0 warnings, 0 errors.
- `git diff --check` passed.
- Post-acceptance runtime/skill lockstep hardening: exact `1.0.136`, resident `close`, and versioned-contract drift coverage passed 5 focused files / 26 tests; the full exact-current corpus passed 1,272 files / 13,241 tests with 19 files / 137 tests skipped, followed by typecheck and production build.

## Remaining release gates

- Run the packaged binary+manifest proof on macOS, Windows, and Linux release jobs for every shipped architecture.
- Expand executable behavior fixtures beyond the four initial specialist packs, including academic-paper and advanced presentation/3D preservation paths whose prose includes behaviours last verified against `v1.0.63`.
- Prove visual output quality, preservation constraints, and artifact receipts beyond the mandatory three-format executable smoke journeys.
