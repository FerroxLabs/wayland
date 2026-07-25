# Sandbox and developer-journey contract

Status: **SOURCE-TRACED — CROSS-LAYER REMEDIATION REQUIRED; NO BLANKET BYPASS AUTHORIZED**  
Prepared: 2026-07-16  
Community journey: Mike Caffrey — localhost browser access, temporary-chat configuration, and macOS/Xcode execution  
Desktop baseline: Wayland Desktop `v0.11.18`; bundled Core `v0.12.25`  
Released Core baseline: `v0.12.25` at `61b79c4f90f71fe2cf243affa7620b3c9b607f14`

## 1. Executive finding

Mike's report is valid and spans both products.

1. **Core has no configurable Browser exception for localhost in `v0.12.25`.** `BrowserPolicyConfig` exposes only `default_action`, `allowed_origins`, and `denied_origins`. The Browser evaluator rejects `localhost`, `*.localhost`, loopback IPs, private networks, and metadata targets before it evaluates the ordinary allowed-origin list. Adding `localhost` to `allowed_origins` therefore cannot work.
2. **Desktop presents security controls that do not match the released Core schema.** The Security pane writes `approval_mode`, `env_passthrough`, and `block_private_urls` into `[security]`. Core expects approval mode under `[default]`, environment passthrough under `[tools]`, and defines no `block_private_urls` key. Core warns and ignores unknown or mis-sectioned keys, but Desktop's bridge reports a successful file write. The UI can therefore look configured while the engine is unchanged.
3. **Desktop's egress-off switch is incomplete.** `[security] enabled = false` is a real Core field, but Core honors it only when the same invocation includes `--i-accept-exfil-risk`. Desktop does not pass that flag. In addition, the general egress firewall and the Browser tool's hardcoded SSRF policy are separate gates; disabling general egress would not establish a supported Browser localhost exception.
4. **Temporary chats do not discard the active global/profile config, but they do change project scope.** Desktop creates ordinary no-folder Core chats under `wcore-temp-<timestamp>`. It still points Core at the active profile with `WAYLAND_HOME`, but a project-local `.wcore.toml` from another folder is naturally absent. Named Desktop Core profiles are created empty unless explicitly cloned, so activating a fresh profile also stops inheriting the default profile's config. Both behaviors can honestly feel like “the main config is ignored” because the UI does not explain the effective source chain.
5. **The macOS/Xcode complaint is a Core sandbox-root gap.** `trusted_local` allows the workspace, scratch paths, the user's home for reads, and a small set of writable caches. The macOS sandbox also permits system roots such as `/usr`, `/System`, and `/Library`, but not `/Applications`. A full Xcode installation under `/Applications/Xcode.app/Contents/Developer` is therefore outside the read set, and ordinary Xcode DerivedData locations are outside the write set. Desktop provides no purpose-scoped toolchain grant or diagnostic that explains this.
6. **Mike's two displayed Desktop config paths are normally aliases, not proof of two Desktop stores.** On macOS `getConfigPath()` resolves the real `Application Support/Wayland/config` directory and creates `~/.wayland-config` as a CLI-safe symlink to it. The distinct configuration boundary is Desktop app config versus Core's native/active-profile `config.toml`. Desktop does not show canonical target, symlink identity, active profile, or which settings Raw Engine Mode will use; if the alias is broken or points elsewhere, that is a diagnosable Desktop failure.
7. **Raw Engine Mode is a high-blast-radius authority switch with insufficient disclosure.** `WCoreManager` deliberately unsets Desktop's active `WAYLAND_HOME` override and skips Desktop model override, Constitution/skills/specialist overlay, and Desktop MCP publication. Core then uses only its standalone config and `[mcp.servers]`. The current label mentions model and skills but does not disclose lost Desktop connector selection, active-profile source, or the exact config path. Enabling it is not a Browser-policy fix and can make Mike's MCP/skill symptoms worse.
8. **Managed temporary workspaces currently have no conversation-linked retention lifecycle.** A no-folder Core chat creates `<workDir>/wcore-temp-<timestamp>`, while `ConversationServiceImpl.deleteConversation()` deletes only the database record. The codebase has warnings for temporary/default workspaces and cleanup for transient snapshot gitdirs, but no reference-aware prune or recovery path for these chat workspaces. Mike's report that they accumulate is consistent with the implementation.
9. **“Install and restart” has working-tree safeguards but not packaged proof.** The updater now writes a pending-install marker, uses `quitAndInstall(true, true)`, and has force/quit-quiescence paths. That does not prove the signed packaged app actually relaunches on Mike's system or advances the installed version. The report remains an M8 packaged updater failure until an immutable-candidate relaunch receipt passes.
10. **The diagnostic tool is output-bounded, but the troubleshooting journey is not proven context-safe.** Concierge diagnostics cap strings, arrays, log files, tail bytes, and lines; Mike's dead chat therefore is not evidence of an unbounded single tool response. It is evidence that repeated troubleshooting can consume the conversation context without a compact support handoff, context-budget warning, or clean continuation path.

This is not evidence that sandboxing should be removed. It is evidence that the current policy contract is incomplete and the Desktop configuration surface is not truthful.

## 2. Reproduction statements

| ID      | Expected                                                                                              | Observed/current result                                                                                                                                     | Classification                                  |
| ------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| SBX-R1  | A local Project can deliberately allow its own `http://localhost:3100` Browser target.                | Browser rejects the hostname before the allowlist and exposes no loopback exception.                                                                        | Core contract gap                               |
| SBX-R2  | Turning off “Block private & loopback fetches” changes the effective Browser policy.                  | Desktop writes `[security].block_private_urls`; Core defines no such field and ignores it.                                                                  | Desktop false control + Core missing capability |
| SBX-R3  | Changing approval mode in Desktop changes Core's persisted default.                                   | Desktop writes `[security].approval_mode` using `ask`/`auto-edit`/`yolo`; Core expects `[default].approval_mode` using `default`/`auto-edit`/`force`.       | Desktop schema mismatch                         |
| SBX-R4  | Adding an environment name exposes it to sandboxed tools.                                             | Desktop writes `[security].env_passthrough`; Core expects `[tools].env_passthrough`.                                                                        | Desktop schema mismatch                         |
| SBX-R5  | Turning the Desktop egress switch off disables the Core egress gate.                                  | Desktop writes the field but does not add Core's required risk-acceptance CLI flag.                                                                         | Desktop spawn-contract mismatch                 |
| SBX-R6  | A fresh chat explains which global profile, Project policy, workspace, and tool policy are effective. | The chat is placed in `wcore-temp-*`; global profile still applies, project-local policy does not, and the UI does not show the source chain.               | Desktop explainability gap                      |
| SBX-R7  | A local developer chat can use an installed full Xcode toolchain and its normal build outputs.        | `/Applications/Xcode.app` is outside the macOS read roots and normal DerivedData is outside writable roots.                                                 | Core macOS policy gap                           |
| SBX-R8  | Desktop shows one canonical app-config location and the exact active Core profile/config source.      | UI/support output exposes multiple path spellings without proving whether they are symlink aliases, distinct app/engine stores, or stale migration residue. | Desktop explainability/diagnostic gap           |
| SBX-R9  | Raw Engine Mode states every overlay and connector behavior it changes before activation.             | Current copy mentions model/skills only; runtime also drops Desktop MCP publication and active Desktop profile override.                                    | Desktop unsafe disclosure gap                   |
| SBX-R10 | Deleting chats has an explicit, recoverable relationship to managed workspace files.                  | Conversation deletion removes the DB record only; generated `wcore-temp-*` directories can remain indefinitely.                                             | Desktop storage-lifecycle gap                   |
| SBX-R11 | “Install and restart” installs the selected version and relaunches the signed app.                    | Mike observed no restart and required manual installation; current code has guards but no immutable packaged relaunch receipt.                              | Desktop updater packaged-proof gap              |
| SBX-R12 | Troubleshooting remains useful without exhausting the active chat.                                    | Individual diagnostic output is bounded, but the end-to-end support flow has no proven context budget, compaction receipt, or continuation handoff.         | Desktop conversation/support journey gap        |

## 3. Source-of-truth map

### Released Core `v0.12.25`

| Contract                 | Source                                                                | What it proves                                                                                 |
| ------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Browser config schema    | `crates/wcore-config/src/browser.rs` (`BrowserPolicyConfig`)          | No `allowLoopbackHostnames` or `block_private_urls` field exists.                              |
| Browser evaluation order | `crates/wcore-browser/src/policy.rs` (`BrowserPolicy::evaluate`)      | Hard host checks run before denied/allowed origins.                                            |
| Loopback block           | `crates/wcore-browser/src/policy.rs` (`blocked_host_reason`)          | `localhost`, `*.localhost`, loopback/private IPs, and metadata classes are hard denied.        |
| General egress schema    | `crates/wcore-config/src/config.rs` (`SecurityConfig`)                | Only `enabled` and `egress_allow`; disabling requires `--i-accept-exfil-risk`.                 |
| Approval schema          | `crates/wcore-config/src/config.rs` (`DefaultConfig`, `ApprovalMode`) | Correct path is `[default].approval_mode`; wire values are `default`, `auto-edit`, `force`.    |
| Environment schema       | `crates/wcore-config/src/config.rs` (`ToolsConfig`)                   | Correct path is `[tools].env_passthrough`.                                                     |
| Mis-section behavior     | `crates/wcore-config/src/config.rs` (`warn_unknown_config_keys`)      | Mis-sectioned fields warn and have no effect rather than failing config load.                  |
| Local filesystem roots   | `crates/wcore-tools/src/workspace_policy.rs` (`trusted_local`)        | Home is readable; only workspace/scratch and selected caches are writable extras.              |
| macOS enforcement        | `crates/wcore-sandbox/src/backends/sandbox_exec.rs` (`build_profile`) | System roots are allowed, manifest roots are added, `/Applications` is not implicitly allowed. |

### Desktop `v0.11.18` overhaul worktree

| Contract                    | Source                                                                                                          | What it proves                                                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Security UI                 | `src/renderer/pages/settings/WCoreConfig/panes/SecurityPane.tsx`                                                | Three mis-sectioned/unknown settings plus the incomplete egress-off switch are user-visible.                                                    |
| Config persistence          | `src/process/agent/wcore/configBridge.ts`                                                                       | The bridge preserves unknown keys and reports file-write success without Core-schema/effective-policy validation.                               |
| Core spawn arguments        | `src/process/agent/wcore/envBuilder.ts`                                                                         | Desktop emits no `--i-accept-exfil-risk` argument.                                                                                              |
| Active profile spawn        | `src/process/agent/wcore/index.ts` and `profilePaths.ts`                                                        | Core is spawned with the active profile directory through `WAYLAND_HOME`.                                                                       |
| Profile creation            | `src/process/agent/wcore/profileStore.ts`                                                                       | Create produces an empty directory; inheritance requires Clone.                                                                                 |
| Temporary chat workspace    | `src/process/utils/initAgent.ts`                                                                                | A no-folder Core chat receives `wcore-temp-<timestamp>` and `customWorkspace=false`.                                                            |
| Browser denial projection   | `src/process/agent/wcore/index.ts`                                                                              | Desktop renders the denial as a generic error string, without effective-policy source or recovery actions.                                      |
| Desktop config alias        | `src/process/utils/utils.ts` (`getConfigPath`)                                                                  | macOS uses the real app config directory plus a CLI-safe `~/.wayland-config` symlink; two spellings should normally resolve to the same target. |
| App/engine diagnostic roots | `src/process/utils/initStorage.ts` (`resolveConciergeDiagDeps`) and `src/process/doctor/checks/configChecks.ts` | Desktop and Core config directories are intentionally distinct, but the diagnostic surface must show canonical identity and authority.          |
| Raw Engine Mode runtime     | `src/process/task/WCoreManager.ts`                                                                              | Raw mode skips Desktop profile, model, specialist/skills, and MCP publication overlays.                                                         |
| Raw Engine Mode copy        | `src/renderer/pages/settings/WCoreConfig/panes/RuntimePane.tsx`                                                 | The current description omits connector/profile consequences and exact source paths.                                                            |
| Temp-workspace creation     | `src/process/utils/initAgent.ts` (`buildWorkspaceWidthFiles`, `createWCoreAgent`)                               | No-folder chats create `wcore-temp-<timestamp>` under the managed work directory.                                                               |
| Conversation deletion       | `src/process/services/ConversationServiceImpl.ts` (`deleteConversation`)                                        | Deletion removes the repository record and performs no managed-workspace inventory, archive, or prune.                                          |
| Diagnostic bounds           | `src/process/resources/builtinMcp/conciergeDiagServer.ts` (`sanitize`, `recentErrors`)                          | Individual diagnostic results cap strings/items/log tails; the remaining risk is cumulative conversation context.                               |
| Updater restart path        | `src/process/services/autoUpdaterService.ts` and `src/process/bridge/updateBridge.ts`                           | Pending-install and restart safeguards are code-present, but signed-package relaunch/version advancement remains unproven.                      |

## 4. Ownership and sequencing

### SBX-0 — truth correction (Desktop, Wave 0 corrective scope)

- Remove or disable every control whose field/path/value is not accepted by the pinned Core schema.
- Move approval mode and environment passthrough to their correct sections and values only after schema-contract tests exist.
- Do not claim the egress firewall is off unless the effective Core posture confirms it. Until an explicit safe spawn contract exists, the off action must not be offered as functional.
- Render Browser denial with the effective profile, workspace/Project scope, policy source, and an honest statement when Core exposes no safe exception.
- Add a Desktop/Core config compatibility map keyed by bundled/override Core version. Writes unsupported by the active version fail before persistence.
- Add read-after-apply/effective-policy evidence; “TOML written” is not “setting active.”
- Explain Desktop app config, its CLI-safe symlink, Core default/active-profile config, and the currently authoritative source without implying that two path spellings are necessarily two stores.
- Expand Raw Engine Mode disclosure to name every bypassed Desktop overlay and the exact Core config source; enabling it must never be suggested as recovery for Browser, MCP, or skills unless the standalone profile independently proves those capabilities.

### SBX-1 — producer contract (Core lane; coordinated, not implemented by Desktop)

- Define a versioned, purpose-scoped local-target policy for Browser use. At minimum it binds scheme, canonical host, port, Project/workspace, tool, session/expiry, and approval provenance.
- Preserve unconditional blocks for cloud metadata/link-local targets, DNS rebinding, alternative loopback encodings, redirect-to-private, and remote/channel sessions unless separately authorized.
- Emit typed effective-policy and denial events with source/inheritance, supported recovery actions, and correlation IDs.
- Expose user-approved extra read/write roots for genuinely local tool execution, with canonicalization, symlink escape protection, revocation, and receipts.
- Provide a macOS toolchain profile/detector for the selected `xcode-select -p` developer directory and a bounded DerivedData/cache location.
- Version the config schema or publish a machine-readable settings/capabilities contract so Desktop cannot invent fields.

### SBX-2 — cohesive Desktop journey (M5/M6 integration)

- Replace the remote settings maze with inline recovery: “Allow localhost:3100 for this Project” when the pinned Core capability supports it.
- Show an Effective Access card: actor, local/remote origin, Project, workspace, profile, network policy, filesystem roots, expiry, and overrides.
- Make temporary-chat scope explicit before consequential file/browser work and offer “Use a Project/folder” without losing the conversation.
- Make profile creation choices explicit: Empty or Clone from…, with a preview of inherited policy/tools/credentials/memory.
- Add Doctor checks for config keys Core ignores, selected Xcode path, sandbox backend, readable/writable roots, network posture, and the exact corrective action.
- Preserve fast power-user access through the composer policy chip/command palette; progressive disclosure must not remove direct control.

### SBX-3 — packaged proof (M8)

No release claim for local development/browser capability passes without signed packaged macOS arm64/x64 evidence and equivalent supported-platform behavior.

### State-safety addendum — managed temporary workspaces (M0A owner)

- Inventory every generated workspace and its live references: conversation, Project, schedule, Team/workflow, artifact/output, snapshot, external effect/receipt, and user promotion.
- Classify content with a fail-closed vocabulary: `referenced`, `scheduled`, `artifact-bearing`, `modified`, `user-promoted`, `empty-abandoned`, or `unknown`. Unknown is preserved.
- Deleting a chat removes no workspace content by implication. The user sees whether files remain, can reveal/promote/archive them, and receives a recoverable record of any later prune.
- Automatic pruning is eligible only for provably empty abandoned shells after a visible retention window. It is dry-run first, excludes active processes and scheduled work, uses a recoverable quarantine/trash stage, and emits a bounded receipt.
- Content-bearing workspaces may be archived or promoted with explicit user action; they are never silently deleted because their originating chat disappeared.

### Support/updater addendum — M5/M8 owners

- Troubleshooting produces a compact, redacted support artifact and continuation summary rather than repeatedly dumping diagnostics into the active conversation. The UI warns before support work consumes the remaining context budget and offers a clean continuation linked to the same Project/evidence.
- Signed-package updater proof must demonstrate quit, apply, relaunch, version advance, pending-marker reconciliation, and manual-download/rollback recovery while preserving running work.

## 5. Mike acceptance journey

1. Create or open a Project whose folder contains an app served at `http://localhost:3100`.
2. Ask Wayland to inspect the local app.
3. If no grant exists, Wayland explains the exact Browser denial and offers a bounded Project-only host+port grant. It never recommends a nonexistent setting.
4. Approve the grant; the receipt identifies the Project, canonical target, tool, session/expiry, and approving user.
5. Browser reaches that target. Redirects, DNS resolution, and every subsequent request remain inside the same policy.
6. `169.254.169.254`, alternative loopback encodings not covered by the grant, unrelated RFC1918 hosts, and another Project remain blocked.
7. Restart and reopen the same Project: the UI shows whether the grant persisted or expired and why. A temporary chat does not silently inherit it.
8. In the same Project, run `xcode-select -p`, `xcrun --find clang`, compile a minimal C/Swift fixture, and run a minimal `xcodebuild` with a declared DerivedData destination.
9. The UI shows any file-root approval before execution and produces a revocable receipt. It never disables the entire sandbox as the easy path.
10. Doctor exports a redacted support bundle containing effective config sources, ignored keys, workspace/profile identity, sandbox backend, policy capabilities, and failed rule—never credentials.
11. Runtime settings show the canonical Desktop config target, CLI-safe alias status, active Core profile/config, and Raw Engine Mode consequences before activation.
12. Deleting the chat reports that its content-bearing workspace is preserved; the user can promote/archive it. A separate empty abandoned fixture becomes prune-eligible only after the declared retention window and remains recoverable.
13. “Install and restart” relaunches the signed candidate at the intended newer version; an injected silent-apply failure leads to the independent manual-download/rollback path without losing the conversation or workspace.
14. Repeated troubleshooting produces one bounded support artifact plus continuation summary and does not strand the user in an exhausted chat.

## 6. Mandatory adversarial tests

- localhost name, `127.0.0.1`, `[::1]`, IPv4-mapped IPv6, octal/hex/decimal encodings, `*.localhost`, mixed case, trailing dot, userinfo, and punycode variants;
- redirect from an allowed public origin to loopback/private/metadata;
- DNS rebinding and resolution-time private-address change;
- grant for one port cannot reach another port, scheme, Project, tool, channel, remote host, or profile;
- symlink from an allowed workspace/root into an unapproved path;
- Xcode selected under `/Applications`, Command Line Tools under `/Library`, custom `DEVELOPER_DIR`, and missing/broken `xcode-select`;
- DerivedData write, package-manager caches, simulator/device services, subprocess trees, cancellation, and cleanup;
- config written under the wrong section/value is rejected by Desktop and surfaced by Doctor;
- app-config symlink intact/broken/repointed, default/named/raw profile selection, and stale migration candidates; the UI proves canonical identity instead of comparing strings;
- Raw Engine Mode fixtures prove Desktop model, skill, specialist, MCP, and profile overlays are all disclosed and absent only when the user knowingly activates raw mode;
- generated workspace empty/non-empty/modified/artifact-bearing/scheduled/unknown, chat deletion, active process, retention expiry, quarantine, restore, promotion, and archive;
- updater no-relaunch, stale marker, wrong version/signature, quiescence deferral, manual download, rollback, and preserved work;
- repeated diagnostic calls and long support sessions stay within declared context/output budgets and produce a resumable handoff;
- bundled Core, oldest supported override, and next candidate each project the correct controls and recovery actions;
- Classic and Cockpit show the same effective policy and never disagree on whether a grant is active.

## 7. Immediate coordination fact

Wayland issue `#826` is open and currently carries an earlier Desktop comment claiming that `[security].block_private_urls = false` is the working control and that no Desktop change is needed. The released `v0.12.25` source disproves that comment. Because the issue is owned by the Core lane, Desktop must not take it over or close it; the next cross-lane handoff should explicitly correct the record with this source map and request the SBX-1 producer contract.

## 8. Non-goals

- no global “disable all security” default;
- no blanket `/Applications` or home-directory write access;
- no inheritance of local grants into channels, schedules, Teams, Web/Cloud, or remote sessions;
- no Desktop-only emulation of a Core policy the engine cannot enforce;
- no claim that a saved config value is effective without producer evidence;
- no runtime promotion of Voice/Cockpit lifecycle, interruption, approvals, persistence, or shared selectors while M2/M5 are locked; presentation-only prototype work may continue on disposable state.
