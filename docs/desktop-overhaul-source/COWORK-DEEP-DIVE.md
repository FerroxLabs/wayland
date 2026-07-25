# Cowork deep dive and build program

Status: **C0 CODE-PRESENT / RELEASE-UNVERIFIED, AUDIT-REOPENED, NOT RELEASE-CLOSED; C1+ LOCKED**  
Baseline: Wayland Desktop `v0.11.18`  
Date: 2026-07-15  
Owner: Desktop (`area:desktop-ui`)

Implementation note: five C0 guardrails are now in the working tree, but C0's former closure claim is superseded by the post-audit release gates below. The active Cowork rule requires capability/version, provenance, validation, authority, network, and cost checks; the obsolete parallel `skillFiles` binding and source manual have been removed. Desktop now prepares the native `iOfficeAI/OfficeCLI` `v1.0.136` binary from an exact GitHub release asset, verifies a per-platform pinned SHA-256 before copying or executing it, and packages it as a mandatory resource. The hosted-credit npm `officecli@0.2.79` dependency, trust entry, packaging rule, and runtime PATH fallback have been removed. Wayland-managed processes force `OFFICECLI_SKIP_UPDATE=1` so upstream background updates cannot mutate the verified executable. A bounded runtime probe classifies the actual top-level native authoring contract separately from preview, and Cowork always receives that live readiness line. The old moving-latest runtime installer is disabled fail-closed, every bundled Office/knowledge-work skill now requires Wayland's managed runtime instead of bootstrapping mutable code, and the executable contract covers every concrete DOCX/XLSX/PPTX help element referenced by the bundled base and specialist packs. Live macOS ARM64 proof covers version/hash, capability classification, real create/mutate/query/validate/view journeys for all three formats, and a reachable watch preview. It also behavior-proves the financial-model, data-dashboard, Word-form, and pitch-deck packs through formulas, named ranges, validation/formatting, charts, content controls, fields, protection, connected shapes, notes, and embedded charts. Workspace authority now uses the explicit canonical vocabulary `ask` / `trusted-edits`; legacy `chat` / `cowork` values migrate without changing effective approvals, the disconnected authority toggle has been removed, and regression proof prevents assistant selection from silently arming access. Cowork is now a provider-neutral persona with provider-neutral creation/default selection across launch, conversation, workflow, editor, and team surfaces; existing saved provider choices remain unchanged. The OfficeCLI ledger now records the unsigned upstream tag/commit, official release digests, macOS publisher identity, notice duties, auto-update containment, and the still-open Windows/Linux/six-target proof. Signed rollback proof, shared readiness authority, deeper task-level capability negotiation, remaining specialist fidelity and visual/preservation proof, and the complete benchmark journey remain open.

Evidence classification: unless an item cites an immutable candidate identity and the Master Plan §9.3 receipt, every working-tree, current-host, ad-hoc package, hash, probe, and full-suite statement in this document means **code-present/unverified for release**. Those statements may guide engineering, but no Cowork card, readiness treatment, package gate, release note, or marketing claim may consume them as capability proof. M2 is the sole readiness-schema authority; the Cowork Office probe is only a producer adapter and cannot close C0 by itself.

## 1. Executive verdict

Wayland has more of the machinery required for excellent knowledge work than the current Cowork experience reveals. Projects already group chats, instructions, reference files, memory, and history. The skill system can discover and load specialist capabilities. The preview workbench already handles multiple artifact types, dirty state, versions, restore, and Office-file discovery. Automations, channels, external agents, Core, and Flux create an unusually broad execution substrate.

Cowork is not yet a cohesive knowledge-work journey over that machinery. In `v0.11.18` it is primarily a Gemini-backed preset with a short prompt and four document-oriented skills. It does not expose a visible knowledge-work lifecycle, a source/citation ledger, an artifact contract, format-specific validation, delivery controls, or provider-independent capability negotiation. Several underlying contracts contradict one another.

The most serious defect at the `v0.11.18` audit baseline was the OfficeCLI contract: Desktop bundled npm OfficeCLI `0.2.79` while enabled skills described the separately versioned GitHub binary API. That contradiction is now removed from the working tree. Desktop packages checksum-pinned native `v1.0.136`, removes the hosted-credit npm dependency and PATH fallback, disables background mutation, and fails closed on an incompatible executable. The current release blockers are narrower and evidence-based: only macOS ARM64 has real packaged publisher/hash/entitlement proof; Windows, Linux, the second macOS architecture, and signed release packaging remain unproven; shared-manifest readiness ownership and the complete source-to-native-artifact journey remain open. Historical baseline text below is retained only where explicitly labeled as audit history.

The second serious defect was semantic. “Cowork” named both an assistant preset and an elevated workspace trust level, while its trust toggle was disconnected from the current UI. The working-tree correction separates those axes and preserves legacy persisted behaviour. A future explicit authority control still needs a deliberate product design; selecting a knowledge-work assistant must never imply wider filesystem, execution, or network authority.

The correct overhaul is not “add more skills to the card.” It is to make Cowork a first-class, provider-agnostic knowledge-work capability that turns sources into validated, editable, traceable outcomes inside a Project or ordinary chat. It uses Wayland's universal work kernel and existing services; it does not introduce a mode switch, planner, workflow engine, workbench host, or store. The user starts in the ordinary composer while the system progressively reveals plan, sources, agents, tools, approvals, versions, and receipts when they become relevant.

## 2. Product definition

> Cowork is Wayland's provider-neutral knowledge-work capability for turning a goal and source material into editable, traceable work with honest validation.

Cowork is not:

- a new name for Projects;
- a privileged security mode;
- a Gemini-only assistant;
- a document-generation wrapper;
- a required mode switch or alternate starting surface;
- a second workflow engine, memory store, or scheduler;
- the universal name for coding, automation, or external-action work;
- a promise that every installed skill or connector is trustworthy and compatible.

The user-facing mental model remains deliberately conventional:

1. **Project** — the durable home for a body of work.
2. **Chat** — state the outcome, steer the work, and review it.
3. **Sources** — files, pages, messages, databases, and connected systems the knowledge work may rely on.
4. **Output** — a response, decision, document, spreadsheet, presentation, dashboard, or approved action.

Task/run identity, working set, plans, citations, validations, approvals, versions, and receipts are internal or contextual Workbench state. They are not additional navigation or configuration homework.

“Start working” remains one obvious action. The complexity appears in context, not as configuration homework.

## 3. Current implementation map

| Concern                    | Current source of truth                                                                                  | Evidence state                                    | Finding                                                                                                                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cowork identity            | `src/common/config/presets/assistantPresets.ts`                                                          | Present and wired                                 | Provider-neutral preset persona in the general category; the shared typeless-preset contract selects bundled Core for first use while preserving saved user choices.                                                                 |
| Cowork prompt              | `src/process/resources/assistant/cowork/cowork.md`                                                       | Present and wired                                 | Basic workspace/document rules; no complete knowledge-work contract.                                                                                                                                                                 |
| Default Cowork tools       | Cowork `enabledSkills`                                                                                   | Present and wired                                 | `skill-creator`, `officecli-pptx`, `officecli-docx`, `pdf`, `officecli-xlsx`.                                                                                                                                                        |
| Legacy Cowork manual       | `src/process/resources/assistant/cowork/cowork-skills.md`                                                | Removed                                           | Obsolete `skillFiles` binding and source manual removed; startup resource sync removes stale user-cache copies and modern enabled skills remain authoritative.                                                                       |
| Office executable          | `scripts/prepareOfficeCli.js`, `scripts/bundled-officecli-shasums.json`, `src/process/utils/shellEnv.ts` | Native v1 packaged and live-proven on macOS ARM64 | Exact `v1.0.136` assets are checksum-gated for macOS/Linux/Windows x64+ARM64 and mandatory after packaging. No hosted npm fallback is bundled; moving installs and background auto-update are disabled in Wayland-managed processes. |
| Document extraction        | `src/process/services/conversionService.ts`                                                              | Registered infrastructure                         | Retains only Word-to-Markdown, Excel-to-JSON, and PowerPoint-to-JSON extraction. Dead writer/export methods were removed; no native round-trip fidelity is implied.                                                                  |
| Document conversion bridge | `src/process/bridge/documentBridge.ts`                                                                   | Registered, no renderer caller                    | Format-gated extraction provider has contract tests. No current renderer invocation was found, so this is not represented as journey-wired.                                                                                          |
| Duplicate converter        | `src/common/chat/document/DocumentConverter.ts`                                                          | Removed after reachability proof                  | Disconnected Markdown-flattening duplicate had zero callers, exports, tests, or production references.                                                                                                                               |
| Artifact preview           | `src/renderer/pages/conversation/Preview/`                                                               | Wired                                             | Strong base: multi-tab preview, editors/viewers, dirty state, split view, keyboard support.                                                                                                                                          |
| Version history            | `previewHistoryService`, `usePreviewHistory`                                                             | Wired                                             | Version, restore, and comparison foundation exists.                                                                                                                                                                                  |
| Office discovery           | `useAutoPreviewOfficeFiles.ts`                                                                           | Wired                                             | New Office outputs can be discovered after tool activity/turn completion.                                                                                                                                                            |
| Project context            | `ProjectWorkspacePage.tsx` and panels                                                                    | Wired                                             | Chats, files, reference material, instructions/rules, memory, history. Correct durable container.                                                                                                                                    |
| Skills                     | `AcpSkillManager`, `wayland_search_skills`                                                               | Wired                                             | Broad on-demand library, but Cowork has no curated capability/readiness contract.                                                                                                                                                    |
| Workspace authority        | `src/common/security/workspaceTrust.ts`                                                                  | Wired, canonicalized below UI                     | Explicit `ask` / `trusted-edits` vocabulary; legacy values migrate and the four backend safe sets are unchanged. This is independent of Cowork.                                                                                      |
| Access control             | `workspaceTrust.*` process bridge                                                                        | Local-only, no renderer writer                    | Disconnected Cowork-labelled toggle removed. Remote arming remains denied; a future explicit access UI must be designed and tested deliberately.                                                                                     |
| End-to-end Cowork proof    | E2E corpus                                                                                               | Missing                                           | Tests select the Cowork card/leader, but do not prove source-to-native-artifact outcomes.                                                                                                                                            |

Evidence states follow the parent audit vocabulary: Present does not imply journey-proven, and a unit test does not establish a packaged user outcome.

## 4. What Wayland can lead on

### Provider and agent neutrality

Cowork can use Core, a local model, an external CLI agent, or a hosted provider through one work surface. Claude and OpenAI offer polished knowledge-work paths, but those paths naturally centre their own models and clouds. Wayland can make the provider an implementation choice rather than the product identity.

The UI should state capability and availability, not expose a provider configuration maze. A task may say “Ready locally,” “Best with vision,” “Needs spreadsheet capability,” or “Remote continuation available,” with the selected agent/model inspectable and replaceable.

### Projects as a real work container

Projects already hold the right nouns. Cowork should enrich Projects rather than invent “workspaces” as a competing hierarchy. A book, client account, research programme, product launch, or financial model remains a Project containing conversations, sources, outputs, instructions, memory, and history.

### Verifiability

Core receipts plus a Cowork source ledger can create a stronger trust model than a generic “done” message. The differentiator is not showing raw logs by default; it is making claims, sources, transformations, approvals, and checks inspectable when trust matters.

### Local-first and portable work

Local folders, own-provider credentials, local models, skills, MCP servers, and exportable artifacts belong in the free Desktop product. A Project should remain useful offline wherever its selected capabilities are local. Hosted convenience must not become an undeclared prerequisite for basic document work.

### Many ways to enter and continue work

The same Cowork task can eventually begin in Desktop, a Project, a schedule, a channel, the web surface, or an API. This becomes coherent only when each entry point resolves to the same task, working set, authority policy, artifacts, and receipts.

## 5. Critical gaps and defects

### C-01 — OfficeCLI executable and skill contracts contradict each other

Severity: Critical for any claim of reliable native Office creation. Distribution/API alignment implemented in the working tree; cross-platform packaged proof and exact skill-schema drift tests remain release gates.

Observed contract:

- Desktop dependency and installer pin the npm OfficeCLI `0.2.79`.
- The npm distribution is currently `0.2.106`; the official GitHub binary is a separate `1.x` line, currently `v1.0.136`.
- The installed executable exposes `new <pptx|docx|xlsx|report|img>` plus account/configuration commands.
- Its README and live diagnostic surface identify `https://platform.officecli.io` and anonymous hosted credits as the default path.
- Cowork's enabled `officecli-*` skills describe a materially different low-level authoring API, with sections verified against `v1.0.63`.

Working-tree correction:

1. Native OfficeCLI `v1.0.136` is the supported local authoring contract and every release asset SHA-256 is pinned.
2. Build preparation downloads the exact asset directly, verifies it before use, and fails closed; it never delegates to a tagged installer that still resolves `latest`.
3. The native bundle is a mandatory `extraResources` payload and post-package validation requires both binary and manifest.
4. Runtime PATH selects the checksum-pinned native bundle; incompatible or user-global binaries fail the exact contract, no hosted-credit fallback is bundled, and the live readiness manifest never upgrades a probe into a broader availability claim.
5. Missing native resources produce a reinstall/update repair message and never trigger mutable runtime code download.
6. `contracts/officecli/v1/contract.json` pins the command and core DOCX/XLSX/PPTX element surface used by Cowork. Build-host-compatible binaries must pass that executable contract before packaging; the manifest records the proof.
7. Compatible build-host binaries must complete real DOCX, XLSX, and PPTX create/mutate/query/validate/view journeys before packaging; the manifest records that smoke proof.
8. Post-package verification recomputes the binary SHA-256 and validates its release, filename, contract proof, and three-format smoke metadata rather than checking presence alone.
9. Live macOS ARM64 proof passes the native authoring contract, all three format journeys, and watch-server reachability.

Still required: execute the same packaged proof on Windows/Linux and both architectures in release CI, and expand executable schema/behaviour fixtures from the core Cowork elements to the specialist Office skill packs whose prose records behaviours last verified against `v1.0.63`.

### C-02 — Cowork provider binding

Severity: High. Working-tree default and cross-surface consistency correction implemented; task-level capability negotiation remains open.

Cowork is now a typeless preset persona rather than a Gemini-bound product. All audited preset launch paths resolve an absent provider through one shared bundled-Core default, while persisted Gemini, Codex, Claude, or other user choices remain unchanged. The provider switcher remains explicit and replaceable. This removes the third-party first-use dependency without pretending that every engine has identical document capabilities. The next layer is capability-driven task readiness: Core or any alternate provider should be selected for a task only when its live capability contract proves the required semantics.

### C-03 — Work mode and authority share the same name

Severity: High, security-sensitive. Working-tree semantic correction implemented; explicit future access UI and journey proof remain open.

"Cowork" describes an intent shortcut, not an authority level. The persisted authority primitives remain only `ask` and `trusted-edits`. Product copy may explain effective behavior with ordinary verbs such as read, draft, edit, execute, send, or publish, but those descriptions are derived and non-persisted; they must not become a second mode or policy vocabulary.

The effective policy is the conservative intersection of user intent, Project policy, agent capability, execution surface, and runtime enforcement. Selecting Cowork never widens it.

### C-04 — No source or citation ledger

Severity: High for research, legal, financial, sales, policy, and executive work.

Chat attachments and Project references are context, but Cowork does not maintain an inspectable mapping from claims to page, sheet, slide, cell range, URL, message, or database record. A polished report without recoverable provenance is not a trusted outcome.

### C-05 — No artifact acceptance contract

Severity: High.

The current flow can produce or preview files, but it does not define what makes an output complete. Examples:

- a workbook should preserve formulas, types, named ranges, intended styles, charts, and recalculation behaviour;
- a presentation should respect the supplied template, master/layout constraints, overflow, contrast, and speaker-note requirements;
- a document should preserve headings, lists, tables, links, references, tracked decisions, and page-level rendering quality;
- a PDF should pass structural and visual checks, not merely exist;
- every output should record sources, generator/adapter, validation results, and limitations.

### C-06 — Conversion paths are fragmented and lossy

Severity: High. Dead duplication and false writer surfaces removed; versioned native adapters and journey proof remain open.

The disconnected Markdown-centric converter and four uncalled writer/export methods have now been removed. The remaining service is honestly extraction-only and its bridge exposes Word-to-Markdown, Excel-to-JSON, and PowerPoint-to-JSON. No renderer caller currently uses that bridge, so it remains registered infrastructure rather than a proven Cowork flow. Cowork still needs one versioned native adapter interface with declared fidelity and round-trip guarantees. Unsupported preservation must be visible before an edit.

### C-07 — The skill library is breadth without a Cowork readiness model

Severity: Medium-high.

Searchable skills are a powerful advantage, but “find something that might work” is not an acceptable foundation for the core journey. Cowork needs a small, tested standard capability pack and optional role packs. Each pack declares dependencies, permissions, supported formats, provider constraints, network/cost behaviour, tests, and compatibility.

### C-08 — Existing workbench strengths are not assembled into a journey

Severity: Medium-high.

Preview, editing, Office viewing, file discovery, history, and restore exist, yet no Cowork E2E proves that a user can bring messy sources, receive a plan, steer work, review a cited native output, refine a selected region, validate it, and export it. The product currently demonstrates components rather than the outcome.

### C-09 — No clear local/free versus hosted/paid boundary

Severity: High for trust and commercial design.

Free Desktop must clearly support local Projects, local files, own providers, compatible local skills/MCPs, local-capable artifact adapters, preview, versioning, and export. Pro may add managed compute, remote continuation, hosted schedules, managed Composio connections, team administration, managed storage, and paid third-party services. Capability and cost are disclosed before use.

## 6. Current parity benchmark

This benchmark is outcome-based and intentionally excludes raw feature counts.

| User outcome                               | Claude Cowork                              | ChatGPT Work / Codex                  | Wayland `v0.11.18`                                           | Target                                                 |
| ------------------------------------------ | ------------------------------------------ | ------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| Start a knowledge task without agent setup | Strong                                     | Strong                                | Cowork card exists; backend assumptions leak                 | One prompt, readiness preflight, provider replaceable. |
| Work from a durable Project                | Strong                                     | Strong                                | Strong substrate, weak Cowork composition                    | Project is the shared work container.                  |
| Create editable DOCX/XLSX/PPTX/PDF         | Strong product claim and flow              | Strong product claim and flow         | Tooling exists; contract is contradictory and unproven E2E   | Native, validated, fidelity-declared adapters.         |
| Edit a selected region iteratively         | Strong                                     | Strong in Work/Canvas-style surfaces  | Preview editors/history exist, journey incomplete            | Select, instruct, preview diff, accept/restore.        |
| Show plan, progress, and allow steering    | Strong                                     | Strong across agent surfaces          | Agent-specific and fragmented                                | One compact execution spine across compatible agents.  |
| Cite source material precisely             | Product-dependent but integrated into work | Strong in research/data flows         | No Cowork source ledger                                      | Claim-to-source ledger across artifact types.          |
| Use connectors and plugins                 | Strong curated ecosystem                   | Strong expanding plugin/app ecosystem | Broad MCP/skill base, fragmented trust/readiness             | Tested packs plus open portable ecosystem.             |
| Continue remotely/on schedule              | Strong                                     | Strong                                | Schedules/web concepts exist; unified Cowork task not proven | Same task identity, policy, artifacts, and receipt.    |
| Change provider or run locally             | Weak by design                             | Weak by design                        | Structural Wayland advantage                                 | Capability-driven provider neutrality.                 |
| Inspect why an outcome is trustworthy      | Task history and approvals                 | Logs/diffs/task evidence              | Core receipts are a potential advantage                      | Human-readable proof with drill-down.                  |

Competitor references are current first-party product documentation, not reverse-engineered implementation claims: Anthropic's [Cowork guide](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork), [Projects](https://support.claude.com/en/articles/14116274-organize-your-tasks-with-projects-in-claude-cowork), [file creation](https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude), [connectors](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities), [recurring tasks](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork), [computer use](https://support.claude.com/en/articles/14128542-let-claude-use-your-computer-in-cowork), [remote assignment](https://support.claude.com/en/articles/13947068-assign-tasks-from-anywhere-in-claude-cowork), [plugins](https://support.claude.com/en/articles/13837440-use-plugins-in-claude), [live artifacts](https://support.claude.com/en/articles/14729249-use-live-artifacts-in-claude-cowork), and [architecture](https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview); OpenAI's [Work file creation](https://help.openai.com/en/articles/20001278-creating-and-editing-documents-spreadsheets-and-presentations-with-chatgpt-work), [Codex app](https://openai.com/index/introducing-the-codex-app/), [Codex plugins](https://help.openai.com/en/articles/20001256-plugins-in-codex/), [ChatGPT Projects](https://help.openai.com/en/articles/10169521-using-projects-in-chatgpt-496), [data analysis](https://help.openai.com/en/articles/8437071-data-analysis-with-chatgpt/), and [Canvas](https://help.openai.com/en/articles/9930697-what-is-the-canvas-featue-in-chatgpt-and-how-do-i-use-it).

## 7. Target user experience

### Home: immediate start, intelligent setup

Cowork remains an optional knowledge-work starter on the main composer. A user can also state the same outcome directly without selecting it. Selecting the card changes supporting language and recommended intents, not navigation, authority, or the execution architecture. The composer accepts a goal, folder/files, Project, or connected source. Healthy readiness collapses to one effective state; details appear only for exceptions:

- missing or degraded context/capability;
- network, hosted, credential, or metered execution;
- increased authority or consequential delivery;
- advisory-only readiness that the selected backend cannot enforce.

If something is missing, the primary action becomes a precise remedy such as “Choose a spreadsheet-capable agent” or “Install local document adapter.” An enforceable backend must not fail after a long run because a speculative skill command was unavailable. An advisory backend receives an explicit warning rather than a guaranteed-ready treatment.

### In a Project: a workbench, not a control panel

The familiar conversation remains central. Cowork configures the one shared contextual Workbench host; it does not own a second workbench. Its knowledge-work projection exposes only active objects:

- **Plan** — steps, status, blockers, and steering;
- **Sources** — working set, citation coverage, freshness, conflicts;
- **Outputs** — artifacts, versions, validations, destinations;
- **Activity** — agents/tools/approvals/receipts when inspection is needed.

This projection is an adaptive mission rail, not a permanent Cowork dashboard. Ordinary answers keep the conversation full-width. The rail appears in-place when the work has durable steps, sources, outputs, approvals, or background execution; shows only active sections; and can be pinned, dismissed, or reopened. A producer-owned plan must be correlated to the current run and labeled by producer. A Desktop-local checklist is explicitly local and cannot claim backend progress. Replanning preserves completed-step evidence and explains what changed, while steering, reordering, pause/stop, approval, and checkpointed agent/model replacement remain available without leaving the conversation.

The conversation renders the same normalized events as a sparse chronological activity spine: plan revisions, meaningful task boundaries, source acquisition, artifact creation/update, approvals, validation, completion, retry, and failure. It does not echo every tool invocation. The mission rail summarizes present state and deliverables; the thread preserves the story and rationale. A step/output selected in either surface resolves to the same run, artifact, validation, and receipt identity.

The reference interaction is captured in `mockups/mission-run/index.html`. It demonstrates the intended balance rather than a separate product mode: chat remains primary; a substantial outcome grows a rail in place; a justified replan preserves history; the current operation and elapsed time appear once; outputs carry real lifecycle/validation state; connectors are described as usable in this session; cost and authority are visible because they are decision-relevant; and external publication stops at an explicit checkpoint.

Power users can pin the workbench, use commands/keyboard shortcuts, replace the agent/model at a declared checkpoint, inspect raw evidence, and keep multiple outputs open. New users can complete the same work from the conversation and artifact preview without learning Wayland's internal architecture. Desktop-owned Project, source, artifact, and version state survives a supported handoff; backend-owned session, plan, tool, ephemeral-resource, or side-effect state is disclosed as lost unless an adapter proves continuity.

### Review and refinement

Selecting a paragraph, table, chart, slide, cell range, or visual region should create a scoped instruction. Cowork shows the proposed change, affected sources, and validation result. The user can accept, reject, compare, comment, or restore. The system never silently flattens a native artifact into Markdown and calls that preservation.

### Completion

“Done” means:

- required outputs exist in the requested native formats;
- cited claims resolve to accessible source locations;
- format-specific checks pass or limitations are explicit;
- consequential delivery/publish actions were approved;
- the Project records versions and a portable manifest;
- the user gets a concise outcome summary and the next useful actions.

## 8. Target architecture

### 8.1 Universal-kernel integration

Desktop owns the conservative scope, capability, authority, and outcome envelope through the universal work kernel. It does not replace Core or external agents and does not create a competing Cowork planner. The selected backend plans and executes within a common run/outcome contract:

- goal and acceptance criteria;
- Project and working-set references;
- requested output types and destinations;
- authority policy;
- required capabilities;
- execution correlation;
- artifact and evidence obligations.

Core may provide the richest plan/execution/receipt implementation. Compatible external agents use adapters and may expose reduced capabilities honestly. Flux selects or explains model routes; Desktop owns the user-facing Project, run projection, artifact, and approval state. External backends whose tool choice cannot be confined are `advisory`, never guaranteed-ready.

### 8.2 Capability and readiness manifest

Cowork extends the master plan's single machine-readable capability manifest. Every agent, skill pack, artifact adapter, connector, and execution surface declares:

- stable ID and version;
- input/output formats;
- operations;
- dependency and version constraints;
- local/network/hosted execution mode;
- permission scopes;
- cost/credential requirements;
- validation level;
- platform support;
- deterministic test/fixture digest.
- enforceability: `enforced`, `brokered`, or `advisory`.

Cowork resolves this before execution and records selected capability references and correlation IDs without creating a private workflow graph. A mismatch produces a degraded explanation, not invented capability.

### 8.3 Work context

Projects remain authoritative for instructions, sources, memory, history, chats, and outputs. Cowork adds a derived per-run working-set view referencing those objects. It does not copy content into a hidden second store. Ad-hoc work remains an ordinary chat and may be promoted into a named Project; Cowork never auto-creates a surprising temporary Project.

### 8.4 Source ledger

The Cowork source ledger is a knowledge-work domain projection over existing Project references and artifact metadata, not a universal source database. It assigns stable identities and locators to supported inputs:

- file hash, path, page/paragraph/table;
- workbook, sheet, cell/range, named range;
- presentation, slide, shape, notes;
- URL, retrieval timestamp, content hash;
- message, channel, thread, timestamp;
- connector record, query, permission context, freshness.

Claims and artifact regions reference ledger entries. If a source changes, Cowork marks derived claims/artifacts `dependency stale` and offers an explicit controlled refresh. It does not background-watch network sources or re-fetch without the current authority policy. Code continues to use repository/Git identities and tests; external actions use effect receipts rather than being forced into the source-ledger ontology.

### 8.5 Artifact graph and manifest

Every knowledge-work artifact has an inspectable domain manifest referenced by the universal outcome model:

- stable artifact and version IDs;
- native format and MIME type;
- source ledger references;
- generating agent/model, skill/adapter versions, and operation history;
- validation results and limitations;
- hashes and storage location;
- approval/publish state;
- parent/derived artifact relationships.

This builds on preview history rather than replacing it. Not every universal outcome is an artifact: a code change may reference a diff/commit and an external action may reference an effect receipt.

### 8.6 Versioned artifact adapters

One adapter interface replaces fragmented conversion assumptions. Each adapter declares read, extract, create, edit, validate, render, compare, and export capabilities separately. Fidelity is explicit. The initial supported set is DOCX, XLSX, PPTX, PDF, HTML, and Markdown; unsupported operations degrade without pretending to preserve native structure.

### 8.7 Validation pipeline

Validation is format-specific and layered:

1. structural parse/open;
2. schema/package integrity;
3. formula/reference/link validation;
4. semantic acceptance criteria;
5. visual render checks for overflow, clipping, contrast, blank pages, and broken layout;
6. source/citation coverage;
7. requested destination/export smoke;
8. explicit limitations and human review points.

Tests use deterministic fixtures. Visual QA produces inspectable images or diffs where relevant and names the renderer plus its fidelity limits. “File exists” is not sufficient. Adapter validation is never displayed as trusted `verified`; it is capped at `integrity checked` unless the master receipt-origin contract is independently satisfied.

### 8.8 Iterative workbench

The renderer maps preview selections to native artifact locators, sends scoped edit operations, renders a comparison, and commits a new version only on acceptance. Comments, decisions, and restore operations belong to the artifact history. Raw XML/JSON stays an expert diagnostic, not the normal editing model.

### 8.9 Delivery and publishing

Saving locally is distinct from sending, publishing, overwriting a shared destination, deleting, or changing an external system. Consequential actions always show destination, scope, identity, and effect. Connector permissions and credentials remain brokered and revocable.

## 9. Authority and commercial boundary

| Layer                  | Authority                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Desktop                | Cowork UX, Projects, working set, artifact/source state, approvals, connections, preview and local export.                                 |
| Core                   | Agent planning/execution, evidence/receipts, resumable work, sub-agent semantics when Core is selected.                                    |
| External agent adapter | Declared subset of planning/execution capabilities; never impersonates missing Core evidence.                                              |
| Flux                   | Model/provider routing evidence, fallback, availability, quality/cost/latency decisions.                                                   |
| Free Desktop           | Local Projects/files, own providers, local models, compatible local skills/MCP, local-capable adapters, preview/versioning/export.         |
| Community cloud        | Self-hostable web/cloud composition with explicit capability matrix.                                                                       |
| Hosted Pro             | Managed compute/storage, remote continuation, hosted schedules, team controls, managed Composio connections, metered third-party services. |

Composio belongs in hosted Pro when Wayland carries real managed-connection cost. The protocol boundary should remain portable enough that free/self-hosted users can bring compatible MCP/connectors and credentials. No Pro feature may cause free Desktop to misrepresent a missing local capability.

## 10. Build packets

These packets compose with the Cockpit program; they do not run as a parallel product. While the Master Plan audit has unresolved HIGH findings, C0 may change only inside the §14 non-promoting correction boundary; existing changes remain code-present/unverified. M2 alone owns the shared capability/readiness schema. C0 owns the Office producer adapter, supply-chain evidence, and consumer conformance against that schema. C0 emits **C0-A** producer/supply-chain truth in Wave 0, then **C0-B** consumer/schema/rollback and target-exact component conformance after M2. C1 is the thin knowledge-work projection over M2/M5/M6 and may start only after `C0-A → M2 readiness-schema → C0-B conformance/entry`, plus M0A, M1, M5, and M6. M8 replays C0-B and C1 through the fully signed application and emits final C0 release closure; that final M8 output cannot be a C1 entry dependency. C2 and later broaden the minimum source-ledger and adapter slices established in C1. Packets may overlap only when interfaces and fixtures are pinned.

### C0 — Contract truth and contradiction removal

Receipt staging:

- **C0-A (Wave 0):** non-promoting contradiction removal, Office producer
  adapter, immutable supply-chain ledger, executable/skill lockstep, hosted-cost
  removal/consent truth, authority isolation, and current-host deterministic
  proof. C0-A cannot render shared readiness or unlock C1.
- **C0-B (Wave 1 after M2):** exact M2 readiness-schema consumer conformance,
  signed M0A authority downgrade/re-upgrade proof, and target-exact Office
  target/architecture-declared component/integration proof sufficient to enter
  the first C1 vertical. This is not a signed/notarized application package.
- **Final C0 release closure (inside M8):** the fully signed six-target app
  replays C0-B plus C1's target-exact component/integration vertical. This is a
  release output, not a C1 prerequisite.

Deliverables:

- pin one supported Office authoring contract or capability-gate Office creation;
- add executable-versus-skill compatibility tests;
- produce local/network/hosted, credential, and cost evidence for the M2-owned readiness schema; the local probe cannot independently render ready;
- remove the effectively dead legacy `skillFiles` Cowork instruction path after regression proof;
- rename authority semantics independently from the Cowork product mode;
- remove Gemini as an implicit product requirement through capability-driven selection;
- inventory and consolidate duplicate conversion code;
- replace generic claims with evidence-state language;
- remove the hosted-credit fallback from the production execution path or keep it unreachable by default behind explicit pre-call network, credential, price-basis, and spending-boundary consent;
- record OfficeCLI redistribution terms, publisher/signature availability, independently obtained pinned hashes, update ownership, and compromise/revocation behavior in the third-party executable ledger, failing closed on unresolved release-critical fields;
- conform the Cowork consumer to the M2-owned shared capability schema with `enforced`, `brokered`, and `advisory` backend semantics; the current probe is a producer adapter, not a second readiness authority;
- pass the signed `v0.11.8` conservative-read, rollback, and re-upgrade journey for `ask` / `trusted-edits` without widening effective authority.

Entry/exit gates: C0-A must pass before C0-B. M2's readiness-schema receipt then
exists before C0-B proves consumer conformance. C0-B unlocks C1; final C0
release closure occurs only when M8 replays C0-B and C1 through the signed
six-target application. Cowork cannot propose an unavailable command, imply or
silently enter a hosted/metered operation, widen authority by selection or
downgrade, rely on an unclassified third-party executable, or derive readiness
from a second Cowork-only state model. Every item has a named immutable-candidate
receipt; unknown supply-chain or consent state fails closed.

### C1 — Coherent knowledge-work projection and first vertical

Deliverables:

- derived Cowork requirements over the universal run/outcome contract; no canonical Task store;
- exception-first composer readiness using the shared manifest and enforceability state;
- Project-backed or ordinary-chat working-set projection;
- Plan/Sources/Outputs/Activity configuration of the shared contextual Workbench host;
- checkpointed agent/model handoff and honest degraded modes;
- deterministic fake-agent E2E for start, steer, block, resume, cancel, complete.
- the minimum source ledger and citation locators required by the first vertical; C2 expands format and connector coverage;
- the minimum DOCX/PDF adapter, validation, preview, and preservation contract required by the first vertical; C3 expands the native artifact matrix;
- first target-exact component/integration vertical on one declared supported
  target and architecture: mixed sources to cited DOCX/PDF, scoped revision,
  validation, and export from the ordinary composer. Its receipt uses the
  native executable and artifact stack but is not a signed/notarized release
  application; M8 must replay it through the exact signed candidate;
- equivalence proof that a plain-language prompt and the Cowork starter use the same route, composer, kernel, stores, and authority, and can continue into coding, research, or follow-up work without a mode boundary.
- J20 provider-replacement proof through the M2 contract and M5 live adapter: at an explicit checkpoint the user sees preserved Desktop-owned state, lost backend-owned session/plan/tool state, capability changes, and unresolved external side effects before the replacement starts fresh or resumes under a proven contract.

Exit gate: a clean-install user can begin the supported vertical without Settings archaeology or a mode switch; a power user can inspect and replace every selected capability; J20 passes for the first vertical without implying unsupported continuity; false-ready is zero in the deterministic corpus; adapter validation is never promoted to verified. This gate controls an unlabeled Cowork card in Cockpit preview.

### C2 — Sources and citation ledger

Deliverables:

- stable source IDs/locators for initial file/web formats;
- extraction provenance and freshness;
- claim/region-to-source mapping;
- citation UI, broken-source and stale-source states;
- Project reference integration without a second source store;
- exportable citation manifest.

Exit gate: every factual claim in the benchmark report resolves to an accessible source locator or is explicitly marked unsupported/inferred.

### C3 — Native artifact adapters and validation

Deliverables:

- versioned adapter interface;
- DOCX, XLSX, PPTX, PDF, HTML, and Markdown capability manifests;
- deterministic structural and render fixtures;
- validation pipeline and limitation reporting;
- one supported local-first path per flagship artifact or an explicit unavailable state;
- artifact graph/manifest and portable export bundle.

Exit gate: benchmark artifacts open in native applications, preserve declared fidelity, pass format-specific validation, and carry provenance.

### C4 — Iterative artifact workbench

Deliverables:

- paragraph/table/slide/cell/visual-region selection model;
- scoped instructions and proposed native edits;
- compare, accept, reject, comment, version, and restore;
- keyboard and screen-reader complete review flow;
- large-artifact performance budgets.

Exit gate: a user can refine a selected region without regenerating or silently flattening the entire artifact.

### C5 — Connectors, plugins, and role packs

Deliverables:

- tested standard Cowork capability pack;
- signed/declared role packs for research, finance, sales, marketing, operations, legal review, and executive work;
- dependency/permission/cost disclosure and compatibility checks;
- connector source/destination semantics;
- open marketplace/export format and trust signals;
- managed Composio adapter boundary for Pro.

Exit gate: installing a pack changes a visible, inspectable capability set and every flagship journey is deterministic under its declared dependencies.

### C6 — Schedules, remote continuation, and Pro

Deliverables:

- durable Desktop-owned work identity across Desktop, schedule, web, channel, and remote worker, introduced only by a separately owned persistence packet after M0 rollback and Classic preserve-unknown proof;
- brokered credentials and revocation;
- non-interactive approval/Needs-you policy;
- hosted compute/storage/connection metering and limits;
- resumability, conflict, offline, and device-handoff semantics;
- tenant isolation and portable export/deletion.

Exit gate: remote/recurring work cannot silently gain authority and returns the same Desktop-owned artifacts, sources, versions, and receipts to the Project. Backend session/plan/tool continuity is claimed only for explicitly proven adapter pairs.

### C7 — Release hardening and adoption

Deliverables:

- packaged cross-platform benchmark suite;
- accessibility, localization, performance, security, recovery, upgrade/rollback proof;
- sample Projects/templates that demonstrate real work without feeling like a catalogue;
- shareable portable outcome bundle with provenance and remix path;
- opt-in diagnostics and task-success cohort measures;
- support runbook and honest capability matrix.

Exit gate: claims are release-gated, rollback works, and successful users can share/remix a useful outcome without exposing private Project data.

## 11. Mandatory benchmark journeys

1. **Messy research to cited report:** import mixed PDFs, DOCX, web pages, and notes; identify contradictions; produce a cited DOCX and PDF; edit one section; validate; export.
2. **Workbook preservation:** open a styled workbook with formulas/charts; update source data and one formula; recalculate; compare; prove unchanged protected regions; open in Excel/LibreOffice.
3. **Template-constrained deck:** use an existing PPTX theme/master and source report; create slides with citations/notes; detect overflow; revise one slide; export and reopen.
4. **Executive recurring brief:** gather approved connected/local sources on a schedule; block on expired credentials; produce a new version; show changes and sources; never auto-send without policy.
5. **Checkpointed provider handoff:** begin with one compatible agent/model, stop at a safe checkpoint, preserve Desktop-owned Project/source/artifact/version state, enumerate lost backend session/plan/tool state and unresolved side effects, then continue fresh or through a proven adapter handoff.
6. **Offline local work:** disconnect network; analyse local sources and create a locally supported artifact; explain unavailable remote/hosted capabilities without corrupting state.
7. **Approval boundary:** attempt deletion, network retrieval, external send, overwrite, and publish; each follows the displayed policy and cannot be widened by selecting Cowork.
8. **Source change:** mutate an input after generation; mark derived claims/artifacts stale; refresh selectively; preserve the prior version and provenance.
9. **Pack failure:** remove or version-mismatch an adapter/skill; preflight blocks the dependent action before work begins on an enforceable backend, while an advisory backend receives a visible non-guarantee and honest remedy.
10. **Cross-platform package:** repeat flagship creation/review/export on every supported packaged OS/architecture, distinguishing native-app availability from adapter correctness.

## 12. Evidence and release rules

Cowork capabilities use the same audit ladder as the desktop overhaul:

- **Claimed** — copy or docs say it exists.
- **Present** — implementation is in the pinned source.
- **Wired** — a production path invokes it.
- **Journey-proven** — a representative deterministic outcome passed.
- **Release-gated** — CI/release blocks on regression.
- **Operable** — diagnostics, cost/credential disclosure, recovery, support, and rollback exist.

Every packet receipt records source commit, Core/Flux/provider/adapter versions, capability manifests, fixture hashes, exact commands, platforms, outputs, validations, screenshots/renders, failures/skips, and rollback. No generated artifact is called “professional” solely because it opens, and no hosted path is called “local” because Desktop initiated it.

## 13. Immediate order of operations

1. Treat the OfficeCLI mismatch as a release-level contract bug and stop strengthening Cowork file-creation claims until C0 closes it.
2. Add compatibility/readiness tests before changing the default orchestrator or document dependency.
3. Remove or quarantine dead/duplicate Cowork instruction and conversion paths with focused regression proof.
4. Extend the universal run/outcome and single capability-manifest contracts; specify Cowork source-ledger and artifact-manifest domain extensions as versioned fixtures.
5. Compose C1 from ordinary Chat, Projects, the M2 kernel, the M6 Workbench host, preview/history, skill discovery, and approvals; do not build parallel replacements.
6. Ship one narrow vertical benchmark—ordinary composer to messy sources to a cited, integrity-checked report—before expanding role packs or the artifact matrix.
7. Prove the sibling developer vertical against the same kernel so the architecture cannot become document-centric.
8. Add workbook and presentation fidelity journeys, then iterative selection editing.
9. Add connectors/schedules/remote only after the local authority, handoff, and outcome models are coherent.

The fastest credible route is contract truth followed by one complete vertical outcome. Adding dozens of unverified plugins first would increase apparent breadth while making Cowork less predictable.

### C0 readiness receipt — 2026-07-15

- Production path: `resolveCapabilitiesManifest` treats `builtin-cowork` as a persistent capability assistant and requests `includeOfficeAuthoring`; duplicate per-turn capability adverts are suppressed.
- Runtime contract: a two-command, two-second-per-command probe reads `officecli --version` and top-level `officecli --help` through Desktop's enhanced environment, never throws, and caches the default result for five minutes.
- Fail-closed rule: `ready` requires exact version `1.0.136` and command rows for all eight resident native operations, including `close`; `watch` remains a separate preview capability. Version drift, descriptive prose, hosted-credit markers, ENOENT, and probe failures have explicit regression coverage.
- Initial pre-distribution result: the fallback-only `0.2.79` executable classified `incompatible` / `hosted-credits` and lacked all eight resident operations: `create`, `open`, `close`, `add`, `set`, `query`, `validate`, and `view`. The later native-distribution receipt below supersedes this build-host state.
- Verification: focused 4 files / 72 tests; full 1,266 passed files / 13,187 passed tests with 19 files and 137 tests skipped; typecheck green; Electron production build green with existing warnings; `git diff --check` green.
- Boundary at this checkpoint: this closed misleading runtime self-knowledge but not yet the Office dependency mismatch. The later native-distribution and provider-neutrality receipts close those C0 implementation items; adapter consolidation and complete journey proof remain later packets.

### C0 authority-isolation receipt — 2026-07-15

- Canonical contract: workspace access serializes as `ask` or `trusted-edits`; the legacy `workspace.trustLevel` key and `workspaceTrust.*` wire namespace remain stable for upgrade and remote-denial compatibility.
- Migration: stored `chat` maps to `ask`; stored `cowork` maps to `trusted-edits`; the next local access write rewrites the complete map canonically, including a semantically unchanged choice.
- Effective policy unchanged: ACP/OpenClaw auto-approve only raw `read`, `search`, and `edit`; Gemini/Core auto-approve only concrete `edit`; execution, fetch/network, delete, move, MCP, catch-all, and unknown operations still prompt.
- Product isolation: the disconnected `CoworkToggle.tsx` authority control is removed. The Cowork preset encodes no trust/access grant and no renderer production source calls `workspaceTrust.set`.
- Remote boundary: the complete legacy `workspaceTrust.*` namespace remains denied to paired WebSocket callers, and generic config writes deny both canonical `trusted-edits` and legacy `cowork` arming payloads.
- Verification: focused 11 files / 100 tests; full 1,267 passed files / 13,193 passed tests with 19 files and 137 tests skipped; typecheck green; Electron production build green with existing warnings; `git diff --check` green.
- Boundary: authority terminology and silent-selection coupling are corrected. This does not claim an explicit access-control UI, Office authoring compatibility, provider-neutral orchestration, or a journey-proven Cowork outcome; C0 therefore remains open.

### C0 conversion-reachability and remote-read receipt — 2026-07-15

- Reachability: `DocumentConverter.ts` had zero imports, exports through barrels, tests, or production callers and was removed. Its Markdown-flattening Word/Excel write path is no longer a competing abstraction.
- Honest surface: uncalled Markdown-to-Word, JSON-to-Excel, HTML-to-PDF, and Markdown-to-PDF methods plus their unused API type and Electron/Docx machinery were removed from `conversionService`. Only the three registered extraction routes remain.
- Bridge contract: Word `.doc`/`.docx` routes only to Markdown extraction, Excel `.xls`/`.xlsx` only to JSON extraction, and PowerPoint `.ppt`/`.pptx` only to JSON extraction. Mismatched extensions and unknown targets fail before a file read.
- Security fix: `document.convert` accepts a local file path and returns extracted contents. The default-allow remote WebSocket policy previously exposed it; the entire `document.*` namespace is now denied to paired remote callers, including future converters.
- Evidence state: the bridge is process-registered but has no renderer invocation. It is not represented as a Cowork journey, native editing, format preservation, or round-trip support.
- Verification: focused 5 files / 26 tests; full 1,268 passed files / 13,201 passed tests with 19 files and 137 tests skipped; typecheck green; Electron production build green with existing warnings; `git diff --check` green.
- Boundary: dead duplication and the remote read primitive are closed. C0 remains open on a versioned native adapter contract, artifact fixtures, fidelity validation, and journey proof.

### C0 native Office distribution receipt — 2026-07-15

- Distribution contract: Desktop pins `iOfficeAI/OfficeCLI` `v1.0.136` and SHA-256 values for every declared macOS, Windows, Linux, and Alpine Linux x64/ARM64 asset. The selected binary is verified before copy or execution, then packaged with a proof manifest as a mandatory resource.
- Runtime boundary at the time of this 2026-07-15 receipt: the native local binary took PATH precedence while npm `0.2.79` still remained as a separately classified hosted-credit fallback. **Superseded 2026-07-16:** that npm dependency, trusted-dependency entry, ASAR rule, and runtime PATH fallback were removed; `bun.lock` was regenerated and the managed runtime now fails closed to reinstall/update guidance. Final packaged lock/resource proof remains open in C0/M8.
- Skill truth: every bundled Office and knowledge-work skill requires Wayland's managed runtime. A recursive test rejects mutable curl, moving-latest, npm-global, and install-on-demand bootstrap instructions across the entire skill library.
- Executable truth: the versioned contract covers all required top-level operations and every concrete DOCX/XLSX/PPTX help element referenced by the base and specialist packs. Build-host-compatible binaries must pass the contract, real create/mutate/query/validate/view journeys for all three formats, and the financial-model/data-dashboard/Word-form/pitch-deck behavior matrix before packaging.
- Exact local proof: macOS ARM64 `officecli-mac-arm64` reported `1.0.136`, matched SHA-256 `b8582853cc464fa0bdb2fabc2803821472c9449c38b365a7be79fcb53d6356e7`, classified `ready` / `local-binary`, completed DOCX/XLSX/PPTX journeys, and served the workbook preview endpoint.
- Verification: focused 11 files / 125 tests; full 1,272 passed files / 13,237 passed tests with 19 files and 137 tests skipped; typecheck green; Electron production build green with existing warnings; targeted new-code lint and `git diff --check` green.
- Boundary: this closes the executable/version/schema/bootstrap contradiction and four high-value specialist behavior paths on the current build host. Cross-platform packaged proof, remaining specialist fidelity, visual quality, preservation constraints, and the complete Cowork benchmark journey remain release gates.

### C0 implementation receipt — 2026-07-15 (closure superseded)

- Delivered: truthful capability injection, exact OfficeCLI runtime/skill lockstep, checksum-pinned native distribution, provider-neutral Cowork defaults with saved-choice preservation, workspace-authority isolation, dead conversion-path removal, and remote denial for the remaining local-file extraction bridge.
- Current-host proof: exact native `1.0.136` on macOS ARM64 plus DOCX/XLSX/PPTX executable journeys and four specialist behavior packs; the exact-current full suite, typecheck, targeted lint, production build, and diff check are green.
- C0 status: the named local implementation slice is complete, but C0 is audit-reopened and not release-closed. Resolved historical findings stay recorded; they are not repeated as current blockers.
- Current package proof: a real macOS ARM64 app package preserves the exact pinned OfficeCLI SHA-256 and upstream Aion Developer ID signature, retains hardened runtime plus only `allow-jit`, passes deep app-signature validation, and passes the mandatory packaged-resource gate. The package is locally ad-hoc at the Wayland app boundary, so this is not signed-release evidence.
- Still gated: packaged native proof on macOS x64, Windows arm64/x64, and Linux arm64/x64; signed release packaging; the `ask` / `trusted-edits` downgrade/re-upgrade journey; shared-manifest readiness ownership; task-level capability negotiation (C1); one coherent versioned document adapter with declared preservation limits (C1/C3); source/citation and artifact acceptance receipts (C1/C3); visual/preservation benchmarks and the complete source-to-native-artifact Cowork journey (C3).

### Post-cross-audit correction — 2026-07-16

The implementation receipt above remains valid for the code and tests it names, but its closure status is superseded. C0 is **locally implemented, audit-reopened, and not release-closed** until the remaining boundaries pass:

- the candidate-written `ask` / `trusted-edits` values pass the signed `v0.11.8` conservative-read, rollback, and re-upgrade journey without authority widening;
- the exact native OfficeCLI package and notice/publisher/digest contract passes every supported target and a signed candidate; macOS ARM64 local package proof is partial evidence only;
- the shared capability schema owns Cowork readiness and declares each backend `enforced`, `brokered`, or `advisory`.

The hosted-credit npm path is removed and the executable ledger is populated; those historical findings are closed and may not be restated as current work. No prior unit, full-suite, current-host binary result, or ad-hoc app package proves the remaining release boundaries. C1 remains locked until M0A/M2 own them and the corrected documents pass adversarial re-audit.
