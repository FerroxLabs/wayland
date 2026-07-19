# Capability ledger

## Ledger rule

Every meaningful capability should have one machine-readable row with owners, surfaces, protocol version, test evidence, release gate, and support state. The table below is the audit seed; it should become generated product documentation.

| Capability | Present | Wired | Journey-proven at v0.11.18 | Release-gated | Notes |
|---|:---:|:---:|:---:|:---:|---|
| Multi-provider model registry | Yes | Yes | Partial | Partial | Provider settings render and persistence passes; end-to-end provider outcomes are credential-dependent. |
| Flux Router | Yes | Yes | Partial | No | First-class model/provider entry and connector writers exist; routing value/cost/fallback receipts are not unified. |
| External agent backends | Yes | Yes | Partial | No | 18 agents detected in the audit environment; availability is not equivalent to a proven task. |
| Wayland Core | Yes | Yes | Failed focused journey | No | Runtime/config UI exists; AskUserQuestion could not select `wcore` in focused E2E. |
| Conversations | Yes | Yes | Partial | Partial | Core interaction surface; comprehensive provider-neutral golden path is absent. |
| Projects/workspaces | Yes | Yes | Yes | No | Real non-temp workspace and chat resolution passed. |
| Assistants | Yes | Yes | Surface captured | No | 97 shown; catalogue density and lifecycle proof need work. |
| Workflows | Yes | Yes | Surface captured | No | 176 shown; outcome completion and artifact verification are not release gates. |
| Teams | Yes | Yes | Failed golden path | No | 60 shown; golden Cold Outbound fixture was missing. |
| Scheduled tasks | Yes | Yes | Persistence/surface only | No | Real-AI CRUD timed out; readiness gating is incorrect. |
| Mission Control | Yes | Yes | Surface captured | No | Strong operational surface, but no release-gated task lifecycle proof. |
| Memory/archive | Yes | Yes | Surface captured | No | Rich UI; cross-host semantics and evidence boundaries need a contract. |
| Wiki | Yes | Yes | Surface captured | No | Present but not proven as an outcome/artifact lifecycle. |
| MCP library | Yes | Yes | Surface captured | No | 107 entries shown; install/auth/use/revoke journey is not release-gated. |
| Channels | Yes | Yes | Settings persistence only | No | Many channels; delivery/retry/identity/permission receipts need a common contract. |
| Extensions | Yes | Yes | Partial | No | Eleven loaded in audit; sandboxing remains a TODO. |
| Voice | Yes | Partial | Audited 2026-07-16 | No | STT/configuration and disconnected local TTS infrastructure exist; no coherent voice-session state machine, production response playback, barge-in, provider-neutral hosted TTS, or packaged conversation journey. See `VOICE-CONVERSATION-MODE.md`. |
| Image generation | Yes | Yes | Not audited end-to-end | No | Surface exists; provider and artifact lifecycle proof needed. |
| Terminal | Yes | Partial | Not proven | No | Feature/issue state indicates incomplete productization. |
| Computer use / CUA | Yes | Partial | Not proven | No | Protocol events exist; user-facing trust and journey proof need consolidation. |
| Web UI inside Desktop | Yes | Yes | Failed focused journey | No | `webui.start` returned a port of `0`; subsequent security tests skipped. |
| Standalone Web server | Yes | Yes | Booted locally | No | Served HTTP 200 with strong headers; missing built-in MCP artifacts and version metadata. |
| Docker deployment | Yes | Build recipe present | No | No | Default image build OOMs after module transform. |
| Automatic updates | Yes | Yes | Release logs prove signing | Partial | Updater reports one live audit error when service is not initialized; open platform issues remain. |
| Localization | Yes | Yes | Unit coverage | Partial | Twelve locales. |
| Accessibility | Partial | Partial | No WCAG journey | No | Many ARIA/keyboard affordances, no axe gate, some screens with unlabeled controls. |
| Import/migration | Yes | Yes | Not proven | No | Multiple legacy paths and migration surfaces raise support risk. |
| Doctor/diagnostics | Yes | Yes | Not proven | No | Good foundation for making partial subsystem startup visible and recoverable. |

## Required row schema

```yaml
id: task.scheduled.create
owner: desktop
depends_on:
  - core.protocol@'>=0.13 <0.14'
  - capability.scheduler@1
surfaces: [desktop, web, channel]
hosts: [local, self_hosted, wayland_cloud]
trust_class: consequential
artifact_types: [task, conversation, receipt]
evidence:
  unit: ...
  contract: ...
  packaged_journey: ...
release_gate: required
support_state: supported
degradation: explain-and-recover
```

## Release rule

A capability may be marketed as generally available only when it is wired, journey-proven on its supported surfaces, release-gated, diagnosable, and documented from the same manifest. Experimental rows must say so in-product.
