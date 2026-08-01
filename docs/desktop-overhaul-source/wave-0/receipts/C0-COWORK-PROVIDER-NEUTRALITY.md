# C0 Cowork provider-neutrality receipt

Date: 2026-07-15
Baseline: Wayland Desktop `v0.11.18`
Lane: Desktop (`area:desktop-ui`)

## Contract proved

- Cowork is a provider-neutral persona: the source preset has no provider binding.
- A typeless preset resolves through one shared default, bundled Wayland Core (`wcore`).
- Existing saved provider choices remain authoritative; Gemini, Codex, Claude, or another explicit value is preserved.
- The shared default is used by initial storage, Guid selection, command-palette launch, Assistant Library launch, conversation creation, workflow launch, assistant editing, and team spawning/description.
- Selecting Cowork remains independent of workspace authority.
- The obsolete Cowork skill manual and its production binding are removed; enabled skills plus the live capability packet are authoritative.

## Verification

- `bunx vitest run tests/unit/coworkContract.test.ts tests/unit/guidAgentHooks.dom.test.ts tests/unit/guidAgentSelection.dom.test.ts tests/unit/renderer/assistants/launchAssistant.dom.test.tsx` — 4 files, 40 tests passed.
- Conversation/provider surface matrix — 13 files, 225 tests passed after updating the two assertions that encoded the former Gemini fallback.
- `bun run typecheck` — passed.
- `bunx vitest run` — authoritative full Vitest suite passed (exit 0).
- `bunx electron-vite build` — production main, preload, and renderer bundles passed; existing Vite dynamic/static import warnings remain.
- `git diff --check` — passed.

## Transition behavior

This is intentionally not a forced migration. New or typeless Cowork records start on Core. An existing user whose stored Cowork provider is Gemini or another engine stays on that engine until they use the existing provider switcher. This protects early adopters while removing Gemini as the product identity and first-use dependency.

## Remaining Cowork gates

- Add task-level capability negotiation rather than assuming feature parity between engines.
- Consolidate document adapters and prove complete source-to-native-artifact benchmark journeys.
- Add visible source/citation ledger, artifact acceptance, and delivery receipts.
- Run the checksum-pinned native OfficeCLI package proof on every shipped platform and architecture; current executable journey proof is macOS ARM64.
