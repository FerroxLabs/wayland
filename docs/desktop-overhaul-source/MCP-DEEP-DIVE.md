# MCP deep dive: one connection truth across every Wayland agent

Status: **AUDIT CONFIRMED — RELEASE BLOCKING FALSE-READINESS; REMEDIATION IN PROGRESS**  
Owner: Desktop (`area:desktop-ui`) with explicit Core/agent contract handoffs  
Primary coordination: Wayland #476 and Wave 0 #886; do not close coordination issues from an agent session.

## 1. Executive verdict

Wayland has more MCP breadth than Claude Desktop, Codex, OpenClaw, or Hermes when measured by catalog size, supported backends, transports, per-chat scoping, and provider neutrality. It does **not** currently have parity on the one property that matters most: when Wayland says a connector is connected, the active assistant must actually be able to discover and call it.

The current product has several different facts that are rendered as one green state:

1. a connector declaration was saved;
2. a standalone Desktop probe reached `initialize` and `tools/list`;
3. a matching name exists in an agent's static config;
4. an active session was launched with the server;
5. the session registered a particular set of tools;
6. the model/tool-search layer can discover those tools;
7. a real tool call completed.

Only states 4–7 prove that a chat can use the connector. Today the Library can say **Connected**, **Running**, **Available to agents**, and **Ask any chat to use it** after states 1–3. This is the false-positive path reported by a student for Tavily, Firecrawl, n8n, and Beeper.

The repair is not “add four integrations.” It is one brokered lifecycle contract, one per-session evidence model, honest progressive state labels, and a transport/auth/backend acceptance corpus.

## 2. Observed symptom and reproduction statement

### User-observed failure

Expected: an enabled connector shown as connected in the MCP Library is visible to ToolSearch and callable in a new chat.  
Observed: Tavily and Firecrawl appear connected, but chat reports that no Tavily/Firecrawl tools exist; n8n and Beeper show the same behavior.

The exact chat evidence is stronger than a generic connection complaint: the assistant reports that ToolSearch returns nothing for vendor names or representative operations such as `scrape` and `extract`, even though the same declarations render as connected and enabled in the Library. That establishes a user-visible contradiction between saved/probed state and active-session tool authority. It does not expose or prove any vendor credential failure.

The report is anonymized. User identifiers and credentials are not part of this artifact or its fixtures.

### Smallest deterministic reproductions found in the pre-fix code

1. **Custom URL false ready**
   - `UrlAddModal` performs a standalone probe.
   - On success it submits a record with `enabled: true` and `status: connected`.
   - `BrowsePage` calls `handleAddMcpServer`, which persists the record but does not call `syncMcpToAgents`.
   - Result: the Library can render green while zero backend configs or sessions contain the connector.

2. **Catalog keyless false ready**
   - `entryToServerData` creates a disabled declaration.
   - `DetailPage.install()` only persists it.
   - `DetailPage.isReady` treats auth method `none` as ready merely because it is installed.
   - Result: “connected and ready; ask any chat” can appear without a connection probe or session publication.

3. **Core multi-server false ready**
   - Desktop injects user stdio servers with `add_mcp_server` after Core emits `ready`.
   - current Core rejects wire-added stdio servers because they launch local processes and must be trusted/configured before startup.
   - Desktop holds one `mcpReadyPromise`, resolves it on the first `mcp_ready`, and discards the event's `name` and `tools`.
   - Result: one unrelated server can satisfy the wait while requested servers are rejected or missing.

4. **Local HTTP excluded from the happy path**
   - Beeper's official MCP is Streamable HTTP at `http://localhost:23373/v0/mcp`.
   - main-process validation intentionally permits localhost/LAN MCP servers and blocks metadata/link-local targets.
   - `UrlAddModal` separately rejects localhost, loopback, and all RFC1918 ranges before probing.
   - Result: a legitimate local connector supported by the backend cannot be added through the primary URL journey.

5. **End-to-end proof is explicitly skipped**
   - `tests/e2e/specs/mcp.e2e.ts` proves a standalone stdio `tools/list` call.
   - The agent-layer `tools/call` journey is an unconditional `test.skip` because it requires a real backend CLI.
   - `ext-mcp.e2e.ts` proves page/toggle presence, not connector use.
   - Result: CI can stay green while the exact user journey is broken.

6. **Local URL imports collide by display name**
   - `UrlAddModal` derived identity from hostname only.
   - Beeper at `localhost:23373`, n8n at `localhost:5678`, and any other local MCP were all persisted as `Localhost`.
   - add/update deduplicates by name, so adding a second local MCP could silently replace the first declaration.
   - Result: the Library can appear healthy while the intended local connector definition has been overwritten.

7. **CLI adapter subprocess failures return success**
   - Claude, Codex, Gemini, Qwen, and CodeBuddy catch a failed CLI add per server, log it, continue, and then return `{ success: true }` for the batch.
   - Codex also silently omits arbitrary HTTP auth headers from global CLI registration; Gemini omits HTTP headers and stdio environment credentials.
   - Result: Desktop records a publication receipt for a connector the target CLI either rejected or received without usable credentials.

8. **A healthy long-lived chat retains a stale connector set**
   - MCP authority is fixed when an ACP/Gemini/Core/Codex agent session is created.
   - Adding, enabling, editing, revoking, or per-chat-scoping a connector changes storage but does not universally hot-reload that running session.
   - Result: standalone probe and Library state can be current while ToolSearch correctly reports that the older session has no such tools.

9. **Reconnect can repaint a publication failure green**
   - enable failure reverts the declaration but was swallowed by the toggle handler;
   - Reconnect then ran a standalone probe anyway, and a reachable server could be marked connected despite zero publication.
   - Result: the repair action reproduced the same false-green state it was meant to fix.

10. **Desktop and engine update state is hidden as two products**

- The in-app Core updater exists, but its check and action are buried in the Core overview and occur only after that settings pane mounts.
- Direct customer evidence shows a user on the then-current Desktop release did not know Core had a separate update lifecycle.
- Result: support can recommend an engine update that the normal Desktop update journey never made visible. A newer Core may improve behavior, but version drift cannot explain or excuse Desktop's false publication/readiness claims.

## 3. Ranked hypotheses

| Rank | Hypothesis                                                                             | Status                        | Evidence                                                                                                                                                   |
| ---- | -------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1   | The UI equates standalone reachability with active-session availability.               | **Confirmed**                 | `useMcpConnection`, `status.ts`, `DetailPage`, `UrlAddModal`, and `useConnectedMcps` derive green without a session receipt.                               |
| H2   | Connector publication diverges by backend and install path.                            | **Confirmed**                 | add/import paths persist without sync; static config writers differ; Wayland #476 reports Claude success while Codex/Core miss the same server.            |
| H3   | Core's Desktop consumer mishandles per-server readiness and current stdio trust rules. | **Confirmed**                 | one generic promise; discarded server/tool identity; current Core rejects wire-added stdio.                                                                |
| H4   | The named vendors are all individually incompatible.                                   | **Rejected as primary cause** | The failures cover hosted OAuth, local stdio/API-key, custom remote, and local HTTP. The common Desktop lifecycle fails before vendor-specific invocation. |
| H5   | Updating Core alone fixes the report.                                                  | **Rejected**                  | A newer Core can improve engine behavior but cannot make an unsynchronized Desktop record enter a session, correct false UI labels, or unskip Desktop E2E. |

## 4. Current architecture and authority map

```text
Catalog / URL / JSON / Extension
               |
               v
      mcp.config declaration  <---- OAuth/token store
               |
       +-------+--------+
       |                |
       v                v
standalone probe    static backend writers
tools/list only     Claude / Codex / Gemini / Core / others
       |                |
       +------ UI ------+   (currently rendered as "connected")
                        |
                        v
                 session construction
                        |
                        v
                runtime registration
                        |
                        v
               ToolSearch / model tools
                        |
                        v
                    tools/call
```

### Authority boundaries

| Fact                        | Authoritative producer                          | Desktop responsibility                                            |
| --------------------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| declaration saved/enabled   | Desktop configuration store                     | persist versioned intent and scope                                |
| credentials present/current | Desktop credential broker or backend-owned auth | never infer from a config string; redact and refresh safely       |
| standalone reachability     | Desktop MCP probe client                        | report probe time, transport, capabilities, and exact failure     |
| backend publication         | backend config/session adapter                  | emit per-backend publication receipt, not name-presence inference |
| active-session registration | active runtime (Core/ACP/native agent)          | consume a per-server receipt with tool identities                 |
| ToolSearch visibility       | active runtime/tool broker                      | prove the registered tools enter discovery under the active scope |
| invocation result           | active runtime + MCP server                     | correlate server, tool, call, permission, result, and cost        |

Desktop owns orchestration and truth labels. Core/ACP/native agents own what their live process actually registered. A settings probe cannot manufacture runtime authority.

## 5. Required lifecycle model

Replace the overloaded boolean/status with a monotonic, evidenced state machine:

| State                  | Meaning                                                               |                May UI say “connected”? |
| ---------------------- | --------------------------------------------------------------------- | -------------------------------------: |
| `declared`             | definition saved                                                      |                                     No |
| `credentials_required` | auth input or OAuth consent missing                                   |                                     No |
| `authenticated`        | usable credential is held for this resource                           |                                     No |
| `probe_reachable`      | standalone initialization and capability listing succeeded            |                “Server reachable” only |
| `published`            | selected backend accepted the declaration/config                      |                “Added to <agent>” only |
| `restart_required`     | backend cannot apply to an existing session/process                   |    No; give one-click restart/new chat |
| `session_connecting`   | active session is attempting connection                               |                                     No |
| `session_ready`        | active session emitted server identity and registered tool identities | **Yes, for this session/backend only** |
| `invocation_verified`  | a canary or user call completed through the active session            |              “Verified” with timestamp |
| `degraded`             | some selected backends/transports failed                              |   No global green; show partial matrix |
| `revoked`              | disabled, logged out, scope removed, or credential invalidated        |                                     No |

Every receipt is keyed by at least:

```text
connector_id + canonical_name + definition_digest + credential_generation
+ backend_id + backend_version + session_id + scope_digest + observed_at
```

Tool receipts additionally carry the registered tool-name digest/count. Secrets, bearer values, URL query credentials, and raw environment values never enter receipts, logs, telemetry, or bug reports.

## 6. Target user journey: “it just works” without hiding power

### Default journey

1. User chooses a catalog entry or pastes a URL.
2. Wayland identifies local/remote transport and auth requirements.
3. It shows the exact local command or remote host, requested scope, and risk before execution/consent.
4. Wayland authenticates and performs a bounded standalone probe.
5. User chooses **Every chat** or the current Project/chat; the default is explained, not implicit.
6. Wayland publishes to the selected agent(s), starts or restarts the session when required, and waits for per-server runtime receipts.
7. Success reads: “Tavily is ready in this chat — 5 tools.” Partial failure reads: “Ready in Claude; Core rejected local-process injection. Start a fresh Core chat after configuration.”
8. The user can run a safe read-only canary or ask normally. The activity view records which connector/tool was used and any third-party/Flux cost.

### Power-user affordances

- JSON import/export remains available.
- exact transport, command, args, headers-by-name, scopes, tool filters, and backend projections remain inspectable;
- per-chat and per-Project scope stays available;
- `/doctor`, copyable diagnostics, and raw receipts are one click away;
- no power setting is required to make the basic path truthful.

## 7. Connector regression corpus

| Fixture                    | Transport                                       | Auth                        | Why it is mandatory                                                   |
| -------------------------- | ----------------------------------------------- | --------------------------- | --------------------------------------------------------------------- |
| Tavily official hosted     | Streamable HTTP                                 | OAuth and API-key variants  | OAuth metadata/DCR, hosted registration, search/extract names         |
| Firecrawl official         | stdio pinned package and hosted Streamable HTTP | API key                     | local process trust, package spawn, env handling, hosted alternative  |
| n8n                        | custom hosted/local endpoint                    | header/OAuth as configured  | custom URL/import path, workflow tool breadth, user-owned endpoint    |
| Beeper Desktop             | localhost Streamable HTTP                       | OAuth or manual token       | legitimate loopback, local app dependency, restart/availability state |
| deterministic local mock   | stdio                                           | none                        | offline packaged E2E and real `tools/call`                            |
| deterministic remote mock  | Streamable HTTP                                 | none/header/OAuth challenge | redirects, auth expiry, reconnect, `tools/list_changed`               |
| resource/prompt-only mock  | stdio + HTTP                                    | none                        | no-tools is not necessarily a failed MCP server                       |
| large-tool mock            | HTTP                                            | none                        | ToolSearch/progressive discovery and context/cost caps                |
| malicious local manifest   | stdio                                           | none                        | exact-command consent, env injection, sandbox/permission rejection    |
| metadata/rebinding targets | HTTP                                            | none                        | SSRF and redirect revalidation                                        |

Official reference points:

- Tavily documents hosted OAuth and API-key modes at <https://docs.tavily.com/documentation/mcp>.
- Firecrawl documents both hosted and local MCP at <https://docs.firecrawl.dev/ai-onboarding>.
- Beeper documents its localhost Streamable HTTP endpoint at <https://developers.beeper.com/desktop-api/mcp>.
- n8n documents its per-instance Streamable HTTP endpoint (`https://<instance>/mcp-server/http`), OAuth, and bearer access-token modes at <https://docs.n8n.io/connect/connect-to-n8n-mcp-server>.
- MCP client scaling and progressive discovery guidance is at <https://modelcontextprotocol.io/docs/develop/clients/client-best-practices>.

## 8. Backend capability and acceptance matrix

This matrix must be generated from adapters and proven by tests; it must not be a hand-maintained marketing claim.

| Backend                                  |                         stdio |                            SSE |             Streamable HTTP |                     OAuth |                live add |                       existing-session refresh |                             runtime receipt required |
| ---------------------------------------- | ----------------------------: | -----------------------------: | --------------------------: | ------------------------: | ----------------------: | ---------------------------------------------: | ---------------------------------------------------: |
| Wayland Core                             | config only for trusted stdio | config/runtime where supported |              config/runtime |    brokered header/config | pre-message remote only | new session/reconnect unless explicitly proven |                per-server `mcp_ready` / `mcp_failed` |
| Claude ACP/native                        |            adapter capability |             adapter capability |          adapter capability | backend or Wayland broker |        backend-specific |                               backend-specific |                       session registration/tool list |
| Codex ACP/app-server                     |    native config + capability |                  no assumption |           native URL/config |  bearer env / native auth |        backend-specific |               new thread/process unless proven |                           app-server/session receipt |
| Gemini/fork                              |            adapter capability |             adapter capability |          adapter capability |          brokered/backend |        backend-specific |                               backend-specific |                                      session receipt |
| Hermes/OpenClaw/OpenCode/Qwen/custom ACP |   declared adapter capability |    declared adapter capability | declared adapter capability |          adapter-specific |             never infer |                                    never infer | runtime-specific receipt or honest unsupported state |

Unsupported transports must yield an explicit reason before the chat starts. Silent `.map(... => null).filter(...)` drops are forbidden at the user boundary.

### Projection decision: direct where proven, relay where necessary

Wayland should not force every connector through a proxy, and it must not pretend every agent supports every MCP transport. The broker selects one of three explicit projections per connector/backend/session:

1. **Direct:** pass stdio/HTTP/SSE to the agent only when its initialized capability contract supports that transport and the adapter can preserve auth, scope, tool filters, and receipts.
2. **Wayland relay:** when the agent supports mandatory ACP stdio but not the connector's remote transport, launch a Wayland-owned, version-pinned remote-to-stdio relay. Secrets enter through the credential broker/environment, never command arguments; tool/resource/prompt identities, notifications, cancellation, errors, and call receipts remain attributable to the original connector.
3. **Unsupported:** if neither path is safely available, block before send with the exact reason and remediation. Never silently drop the declaration and never inject an ACP transport that the agent advertised as unsupported.

The relay is a compatibility adapter, not a second connector store or a universal traffic choke point. Direct-capable backends stay direct. Relay acceptance requires protocol conformance, auth refresh, revoke, crash containment, request limits, redaction, and packaged proof before production activation.

## 9. Competitive benchmark

### Hermes

Hermes currently has the more cohesive single-agent MCP journey: a curated reviewed catalog, `hermes mcp install/add/test/configure/login`, automatic discovery/registration at startup, per-server tool filtering, capability-aware resource/prompt wrappers, and an approved n8n catalog entry. Its official documentation is at <https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/mcp.md>.

Wayland is stronger in graphical discovery, cross-agent ambition, Project/chat scoping, broad adapter coverage, and provider neutrality. Hermes is materially stronger in lifecycle cohesion because the same Hermes runtime owns configuration, startup discovery, and tool registration. Wayland's multi-backend architecture is strategically stronger only after it brokers the projection honestly.

### OpenClaw

OpenClaw makes a valuable distinction among saved configuration, static `status/doctor`, live `probe`, and runtime reload/restart. Its probe reports tools, resources/prompts, and list-change capability, and its docs explicitly warn that a saved definition is not live proof. It also supports filters, OAuth state, timeouts, TLS/mTLS, redaction, and diagnostics. Official behavior is documented at <https://github.com/openclaw/openclaw/blob/main/docs/cli/mcp.md>.

Wayland is stronger as a consumer-facing multi-agent desktop and catalog. OpenClaw is stronger today at operational honesty and diagnosability. Wayland should adopt the distinction, not its CLI complexity.

### Claude

Claude separates remote connectors, which Anthropic brokers for supported Claude surfaces, from local Desktop Extensions/MCP servers. That narrower ownership lets Claude present a simpler journey inside its own runtime, but it also creates a local-versus-cloud surface boundary. Official guidance is at <https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp> and <https://support.claude.com/en/articles/11725091-when-to-use-desktop-and-web-connectors>.

Wayland can be materially better by presenting local, remote, Project-scoped, and agent-specific connectors through one visual control plane. It is worse today when that control plane reports a saved or reachable declaration as usable without evidence from the selected runtime.

### Codex

Current Codex documentation defines one host-scoped MCP configuration shared by the ChatGPT desktop app, Codex CLI, and IDE extension. It supports stdio and Streamable HTTP, bearer and OAuth authentication, startup/tool timeouts, per-server required/fail-closed startup, per-server allow/deny tool lists, and server/tool approval modes. Its settings explicitly require a restart after adding a server, while `/mcp` exposes connected servers and the tools available to the current session. Official guidance is at <https://learn.chatgpt.com/docs/extend/mcp>.

Codex is materially stronger today at three things the field report exposes: one configuration authority for its local surfaces, an explicit restart boundary, and an in-session tool inventory. Wayland is stronger in provider neutrality, Project/chat selection, catalog breadth, and its ambition to project one connector across Core plus multiple third-party agents. That breadth is an advantage only when every adapter either returns a runtime receipt or is honestly labeled `published_unverified`.

### Competitive consequence

Wayland's differentiator is not “we also have MCP.” It is: **connect once, choose any agent or model, and Wayland proves what that exact session can use.** The parity bar is therefore higher than any single-runtime competitor:

| Operational property                       | Claude                | Codex                       | Hermes        | OpenClaw                    | Wayland target                    |
| ------------------------------------------ | --------------------- | --------------------------- | ------------- | --------------------------- | --------------------------------- |
| saved config distinct from live use        | surface-dependent     | restart + `/mcp`            | runtime-owned | explicit status vs probe    | explicit lifecycle states         |
| current-session tool inventory             | runtime-owned         | `/mcp` tools                | runtime-owned | live probe/runtime registry | per-backend session receipt       |
| one local config across surfaces           | Claude-owned surfaces | desktop/CLI/IDE on one host | Hermes only   | OpenClaw only               | Core + every selected agent       |
| fail closed when required server is absent | runtime-specific      | `required = true`           | runtime-owned | doctor/probe policy         | pre-send selected-server barrier  |
| repair guidance                            | surface-specific      | authenticate/restart        | CLI lifecycle | doctor/reload               | one-click auth/republish/new-chat |

Until the last column is proven, Wayland's breadth creates more failure combinations than user value and no parity claim is permitted.

## 10. Security and trust requirements

1. Local stdio installation shows the exact command/args/source/version and requires explicit consent before first execution.
2. Catalog packages and bootstrap artifacts are pinned and integrity-verified where an immutable digest exists; moving `latest` is not a release proof.
3. Local servers run with least filesystem/network/process authority; additional access is explicit and inspectable.
4. HTTP OAuth follows MCP authorization requirements, including resource/audience binding, PKCE/state, exact redirect validation, secure token storage, and no token passthrough.
5. URL, OAuth metadata, and redirect targets receive scheme, IP, metadata, DNS-rebinding, and redirect-hop validation appropriate to Desktop versus hosted deployment.
6. Localhost/LAN support is an explicit trusted-local mode, not an accidental bypass. The UI and main-process policy share one classifier.
7. MCP tool descriptions, annotations, resources, prompts, and results are hostile data. They cannot grant authority, bypass approval, or mark themselves verified.
8. Cross-server data flow is mediated by the host. Connector A output is never implicitly trusted as safe input to Connector B.
9. Credential values and credential-bearing URL query strings are redacted from logs, receipts, screenshots, exports, analytics, and support bundles.

MCP security references: <https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices> and <https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization>.

## 11. Diagnostics contract

Add a user-facing **Test in this chat** and a structured doctor report:

```text
Tavily
  Declaration       saved, enabled, project: Research
  Authentication    valid OAuth, expires in 41m
  Standalone probe  reachable, Streamable HTTP, 5 tools, 18:42
  Claude             published, session ready, 5 tools
  Codex              restart required; current thread predates connector
  Wayland Core       failed: connector absent from startup config
  ToolSearch         5/5 tools indexed in current session
  Canary             tavily-search succeeded, 812 ms, read-only
```

The report includes copyable remediation but no secret material. “Repair” performs only safe, reversible actions in scope: refresh auth, republish config, start a new session, or reopen a required local app. It never silently broadens Project/tool/permission scope.

## 12. Build packets

### MCP-0 — Stop lying

- split `probe_reachable` from `session_ready` in types and labels;
- remove “Ask any chat” and global green states without a runtime receipt;
- make keyless install probe + publish rather than install-only ready;
- make URL/JSON paths use the same transaction and return results;
- align local URL policy with the authoritative classifier;
- surface unsupported transport and partial backend failures;
- keep Classic behavior behind the rollback flag but do not preserve false claims.

Exit: no deterministic path can render “connected/ready in chat” without active-session evidence.

### MCP-1 — One publication transaction

- create a main-process `McpConnectionBroker` as the single owner of validate → authenticate → probe → persist → publish → session-refresh decision;
- adapters return typed per-backend receipts and failure reasons;
- choose a capability-honest direct, Wayland relay, or explicit unsupported projection for every connector/backend pair;
- config writes are atomic and definition-digest keyed;
- add/remove/reconfigure are idempotent; changed config is not silently ignored;
- normalize canonical display identity separately from backend-safe keys.

Exit: every entry path calls one broker contract and produces the same state graph.

### MCP-2 — Runtime receipts

- consume Core `mcp_ready{name, tools}` and `mcp_failed{name, reason}` as per-server state;
- replace the one-shot Core promise with an expected-server barrier and explicit terminal outcomes;
- stop wire-adding stdio to Core until a trusted published contract allows it; seed trusted startup config or use a Core-provided host-declaration contract;
- add equivalent ACP/native runtime registration evidence where the protocol supports it;
- mark backends without receipts as `published_unverified`, never ready.

Exit: the exact selected server/tool set is correlated to the exact active session.

### MCP-3 — ToolSearch and scale

- index tools from runtime receipts, not stale standalone probes;
- consume `notifications/tools/list_changed` and invalidate affected receipts;
- progressive tool discovery activates by measured context threshold;
- preserve per-server tool allowlists, active-chat scoping, permissions, and provenance;
- distinguish no-tools-but-resources/prompts from connection failure;
- meter definition/context/tool-call and third-party cost separately from Flux model cost.

Exit: large catalogs remain discoverable without tool flooding or false absence.

### MCP-4 — Packaged acceptance and adoption

- deterministic real `tools/call` E2E through at least Core, Claude-compatible ACP, and Codex-compatible ACP/app-server fixtures;
- live canaries for Tavily, Firecrawl, n8n, and Beeper on supported targets with user-provided test credentials;
- six-target packaged proof, restart/reconnect/auth-expiry/revoke tests, and offline/local cases;
- one-click anonymized diagnostic export;
- migration from existing green records to `probe_reachable` until re-proven in a live session.

Exit: J9 passes in packaged builds and no agent-layer test is unconditionally skipped.

## 13. Master-plan integration and gates

This work becomes packet **M1M — MCP truth and live-session contract** in the Desktop master plan.

- MCP-0 may proceed in Wave 0 only within the exact pre-M0A/M1 corrective exception enumerated in `MASTER-BUILD-PLAN.md`: truthful saved/auth/probe/publication copy, fail-closed repair of existing add/import/publication paths, URL safety/identity correction, stale-token refresh in existing adapters, ACP Team acceptance-event renaming, and non-promoting deterministic fixtures/reducers. It may not add a persistent lifecycle schema/store, live credentialed canary, automatic restart, ToolSearch/readiness promotion, invented backend receipt, packaged claim, or M2/M5/M7 expansion.
- MCP-1 depends on M0A state/rollback boundaries and participates in M2's backend-neutral execution model.
- MCP-2 depends on the pinned Core/ACP producer contracts in M1.
- MCP-3 integrates with M5's conversation spine and M7's Library consolidation.
- MCP-4 is mandatory for M8 hardening and J9; it is not deferred polish.

Invited alpha is blocked if:

- a connector can be green while absent from the current session;
- any selected backend silently drops a connector;
- Core/ACP session receipt mismatch is ignored;
- credentials leak into logs/support artifacts;
- revocation fails to remove runtime access;
- the packaged real-invocation journey is skipped or simulation-only.

## 14. Separate Flux cost complaint

The reported rapid depletion of Flux credit during ordinary chat is not classified as an MCP defect. It becomes a separate evidence lane under M1F/M5:

- preserve Flux's already-emitted authoritative per-request `usage.cost_usd`/currency through Core and every Flux-capable ACP adapter instead of replacing it with a catalog estimate;
- correlate Desktop turn, backend session/generation, Flux request, route/model, provider attempt, retry/fallback, token/cache usage, terminal result, and charged cost;
- reconcile authoritative per-request receipts with the conversation total and a consented account/export balance delta; mismatch is an incident, not rounding;
- separate model generation, routing, tool/MCP third-party charges, team/subagent fan-out, retries, and hidden background work;
- show pre-turn estimate/range where possible and post-turn authoritative cost;
- add runaway/retry/fan-out alerts and a per-conversation ledger;
- reproduce with an anonymized account-level export only with user consent.

Current source audit: normative ACP `usage_update.used` is current context occupancy, not cumulative processed or billable tokens; only its cost field is a cumulative session gauge. The corrective Desktop tree now forwards only finite non-negative USD ACP cost, keys its ordinary-chat baseline by backend session, and never manufactures billable tokens from context occupancy. The Team writer and renderer meter now enforce the same rule: new ACP rows retain occupancy only as `context_tokens_used`, publish zero token deltas, and difference only validated cumulative USD cost; legacy ACP rows identified by their context-window payload no longer contribute historical token spend. Focused Team writer/meter coverage passes 91 tests, exact-current TypeScript passes, targeted lint reports zero errors, and diff hygiene passes. WCore separately forwards `session_cost` to conversation Activity while Mission Control computes a catalog-priced row from finish tokens. The cost store still has no Flux request, session generation, route, provider attempt, retry, fallback, cache-write, producer-receipt, or balance-delta fields. These paths can undercount, disagree, or lose provenance even when Flux billed correctly. The accepted Flux fixture corpus proves semantics but has no live producer transport into Desktop, so it cannot explain the user's debit.

Do not explain the charge as “heavy use” without receipts, and do not let the MCP repair broaden into speculative billing changes.

## 15. Immediate order

1. Add red tests for URL-add persistence-without-sync, keyless false-ready, Core per-server readiness, Core stdio rejection, local Beeper URL policy, and the skipped agent-layer journey.
2. Land MCP-0 truth-label and transaction corrections with focused unit/DOM tests.
3. Define the broker/receipt types and Core handoff; replay current Core `mcp_ready/mcp_failed` fixtures through the actual Desktop reducer.
4. Replace the skipped E2E with deterministic packaged agent fixtures.
5. Run the four named live canaries, then broaden the catalog matrix.
6. Re-audit against the security, rollback, Classic, Web/Cloud, and six-target gates before any parity claim.

## 16. Implementation evidence — current Desktop branch

Implemented in the current Wave 0 worktree:

- one shared MCP URL safety classifier now allows legitimate localhost/LAN endpoints (including Beeper) while retaining metadata/link-local denial;
- enabled URL/JSON/catalog additions publish to real adapters and fail closed to disabled/disconnected when publication fails;
- unsupported agent backends no longer count as successful publication or removal;
- Library wording distinguishes saved, authenticated, probed, and statically published state from chat readiness;
- Core user connectors are written to trusted startup config before spawn instead of using the now-rejected runtime stdio command;
- a reserved launch-local Core profile applies the exact per-chat connector allowlist across stdio and hosted transports;
- Core readiness is keyed by server name; every `mcp_ready` preserves exact tool names and every `mcp_failed` preserves the reason;
- a complete Core `mcpSessionState` generation/reducer and exact-launch connector treatment exist as test-harness proof code only. Persistence, broadcast, restart, and readiness promotion require all three conditions: explicit flag, `NODE_ENV=test`, and authoritative `isPackaged=false`; development and every packaged application are structurally denied until M0A/M1/MCP-2 seal definition/session/scope correlation and replay;
- production connector UI does not read legacy persisted receipt state or synthesize readiness from raw `mcp_ready`/`mcp_failed` events. A successful standalone probe is labeled “chat not verified”, and the unscoped list is labeled “Configured”, not “Connected”;
- pre-existing project profiles survive the temporary Desktop profile merge; the reserved Desktop profile wins only its own key.
- connector deletion and disable now treat adapter cleanup as a revocation gate: a partial removal throws, the local declaration remains available for retry, and a disabled record is still cleaned up before deletion;
- configured connector removal now publishes a private, atomic, digest-bound archive of the complete Wayland definition before adapter revocation. Restore preserves command, arguments, environment, headers, transport, OAuth client metadata, allowlists, and original JSON while returning the connector disabled/disconnected; failed revocation, concurrent edit, and config persistence failure retain or compensate active state instead of silently losing it;
- Electron and authenticated hosted WebUI use the same serialized connector archive lifecycle. Hosted list/archive/restore responses expose only secret-free summaries, secure-config-write still gates mutations, and remote WebSocket archive/restore remains denied;
- editing an enabled connector is a revoke → publish transaction. A failed replacement keeps the old declaration and attempts to restore its prior agent publication instead of leaving renamed/orphaned config;
- Claude/Codex ACP preserve `activeMcpServers` through the compatibility bridge and enforce the exact per-chat user-connector selection at session construction; builtins remain available;
- Gemini enforces the same per-chat selection and refreshes hosted OAuth headers during initial worker bootstrap. Definition/credential/selection fingerprinting and worker replacement remain test-harness-only seams; replacement reconstructs the fork only after confirmed old-worker exit, and an unconfirmed Electron termination rejects rather than overlapping a successor;
- Core validation/OAuth/config-write exceptions preserve the expected connector names as terminal failed receipts instead of replacing the launch with an indistinguishable empty selection.
- Codex no longer relies on bootstrap-time publication of every enabled Wayland connector into the user's global `~/.codex/config.toml`. Each conversation gets an isolated `CODEX_HOME` with the exact selected connector set, current bearer references, tool allow-lists, and no raw OAuth bearer in TOML;
- simultaneous native/Flux Codex chats use distinct scoped homes, preventing one chat's sandbox/MCP selection from racing another's config;
- explicit Codex `activeMcpServers: []` now means no user connectors. The backward-compatible undefined/default scope may preserve native Codex entries that Wayland does not manage, while stale Wayland-managed global entries are removed from the scoped clone;
- Codex bearer and arbitrary HTTP header values are injected through per-session environment variables; scoped TOML contains only deterministic environment-variable references and never raw header credentials;
- Claude, Codex, Gemini, Qwen, and CodeBuddy publication adapters now aggregate per-server CLI failures and return failure instead of logging-and-greenlighting them. Codex/native Gemini fail closed where their global CLI registration path would discard required auth fields;
- Core accepts both Desktop `http` and `streamable_http` declarations and serializes them to its `streamable-http` profile transport, closing the imported/plain-URL skip;
- URL imports expose an editable connector name and derive collision-resistant defaults for Beeper, n8n, and arbitrary localhost ports instead of saving every local MCP as `Localhost`;
- reconnect/OAuth completion/install copy now stops when publication fails instead of running a probe that can repaint the connector green;
- secret-safe runtime fingerprinting, encrypted OAuth refresh, and serialized stale-task replacement are implemented only as unpackaged test-harness seams. Development and packaged runtime activation are disabled until M0A/M1/MCP-2 prove queued/running-turn safety and correlated definition/session/scope receipts;
- Core launches sharing one physical project now resolve and capture one canonical workspace before mutation, then use that same physical path for the lease, temporary `.wcore.toml`, child `cwd`, engine ready, and restore. Symlink aliases serialize and alias retargeting cannot redirect an acquired launch. The temporary write is atomic and journaled with ordered rename/unlink metadata flushes; a later launch heals a process-death interruption without overwriting a newer user edit. Target, marker, and backup final-component symlinks are refused;
- all Core config mutation, including MCP publication and other section writers, shares one atomic lock. The manager captures one active-profile home before publication and passes it through engine spawn; corrupt or unreadable profile markers fail closed, while marker activation uses a synced atomic replacement;
- preview receipt reduction rejects connector names outside the exact launch allowlist, and the flyout independently requires expected membership before any ready treatment;
- extension-provided MCP declarations now enter one shared main-process runtime loader used by ACP, Codex, Gemini, and Core. Persisted user declarations win canonical-name collisions, and extension declarations are no longer painted connected merely because an extension manifest exists;
- the composer connector picker now includes extension declarations, preserves live per-chat selection, and distinguishes “declared by extension; tools verified per chat” from runtime proof;
- URL, JSON, and one-click import modals await the complete persistence/publication transaction. They close or advance to success only after publication succeeds; partial batch failures remain visible and failed declarations are disabled/disconnected;
- canonical case-insensitive connector identity prevents case-only duplicates such as `Tavily`/`tavily` across single add, batch import, extension/runtime merging, agent-install detection, stale-config cleanup, and scoped Codex homes;
- one-click CLI import now auto-selects the common single-installed-agent case and fails visibly if its publication callback or imported declarations are unavailable;
- deterministic vendor-shape tests cover Tavily hosted HTTP, Firecrawl stdio/API-key, n8n HTTP/bearer, and Beeper localhost HTTP/bearer through the ACP session declaration;
- the three documented MCP diagnostic commands no longer point at a missing script: list and validate now read the real Desktop config without printing secret values, while probe exercises the production MCP transport and reports the tools actually returned;
- `debug:mcp:doctor` and the shipped in-app Doctor now keep standalone reachability distinct from active-chat publication; a successful probe is an explicit warning, not a connected/session-ready claim;
- ACP user-connector projection now honors the initialized agent's advertised HTTP/SSE capabilities instead of forcing optional transports true. A version-pinned remote-to-stdio relay and visible pre-send unsupported outcome remain MCP-1 work;
- a production-inactive, side-effect-free projection selector now proves the direct / Wayland relay / unsupported decision for stdio, Streamable HTTP, and SSE. It cannot activate the relay until its protocol, security, and packaged gates pass;
- the Electron MCP probe is fail-closed: spawn, initialize, or `tools/list` failure now fails the test instead of warning and returning;
- the standalone probe and every live ACP/Gemini/Core npx serializer now share one bundled-Bun runtime resolver on every platform. POSIX Core config persists portable `bun x --bun` rather than an AppImage mount path, closing the field-observed case where the Library probed green under bundled Bun but chat retried a bare npx from a constrained GUI/agent PATH;
- the unconditional agent-layer skip has been removed. A spawn-boundary ACP integration fixture starts from a persisted Wayland declaration, passes it through the production runtime merge, per-chat selector, and ACP converter, receives the resulting `session/new.mcpServers` declaration, lists the selected server's `echo` tool, calls it, and streams the exact result back through the production `AcpConnection`.

Focused evidence currently green:

```text
Consolidated MCP regression:      20 files / 127 tests
Latest post-transaction subset:   19 files / 113 tests
Broad MCP-adjacent regression:    86 files / 639 passed / 9 skipped
Connector archive/recovery:        6 files / 119 tests
URL/probe/publication CRUD:     11 files / 65 tests
Core receipt/event forwarding:  3 files / 45 tests
MCP truth quarantine gate:      5 files / 45 tests
Latest WCore launch matrix:      7 files / 69 tests
Marker/config/lease security:    7 files / 48 tests
MCP trusted profile + UI:        4 files / 23 tests
Profile/security regression:     3 files / 21 tests
MCP adapter fail-closed:         2 files / 6 tests
CRUD/revocation transactions:    2 files / 9 tests
ACP/Gemini scope + credentials:  5 files / 52 tests
Codex per-chat config authority: 3 files / 23 tests
Named vendor transport shapes:   3 files / 14 tests
ACP agent tools/call seam:        1 file / 1 integration test
Electron MCP probe:               1 spec / 2 tests / 0 skips
ACP capability + Doctor sweep:    8 files / 157 tests
Standalone MCP diagnostics:       1 file / 3 tests + live built-in tools/list (2 tools)
Full exact-current Vitest:       1294 files / 13367 tests passed; 19 files / 140 tests skipped
TypeScript:                      tsc --noEmit passed
Production package build:       passed
Repository lint:                0 errors / 2630 warnings
Diff hygiene:                   git diff --check passed
New security/rebuild lint:        5 files / 0 warnings / 0 errors
Broader touched adapter lint:    21 files / 0 errors / 29 warnings
```

These sets overlap; they are reported as executed proof sets, not summed into a unique-test marketing number.
The broader warnings are tracked debt (principally sequential CLI/config loops, plus legacy typing/shadowing); they are not represented as a clean lint pass and were not parallelized blindly because several adapters mutate one shared CLI config.

Still release-blocking before an MCP parity claim:

1. ACP backends accept `mcpServers` in `session/new/load`, but Desktop has no universal named `tools/list` receipt from Claude/Codex/custom ACP sessions. They remain published/unverified unless the runtime proves more.
2. Fork Gemini now scopes and freshens the launch definition, but Desktop still needs a normalized per-server receipt and registered-tool list rather than implicit worker initialization success.
3. Connector changes do not hot-reload mid-turn. A lazy stale-task rebuild implementation exists but is production-quarantined; activation still requires a visible pending/applied receipt plus packaged proof that queued/running-turn boundaries never lose work.
4. Core team/team-guide bridges still use the separate legacy host-declaration path and require the pinned Core host-delegation contract; this user-connector fix does not widen that authority.
5. `notifications/tools/list_changed`, resources/prompts-only servers, session-bound definition/credential digests, and a unified broker remain MCP-1/MCP-3 work. Config-level revoke failure is now fail-closed, but live disappearance still requires packaged runtime proof.
6. The deterministic agent-layer `tools/call` seam and dev Electron probe now pass without skips. Packaged six-target execution and credentialed live Tavily/Firecrawl/n8n/Beeper canaries remain mandatory; deterministic proof does not substitute for vendor availability/auth proof.
7. Older records that were previously painted green need an explicit migration to `probe_reachable`/unverified until a new live session produces receipts.
8. No credentialed live canary for the student's four exact services was available in this worktree. The official Tavily hosted HTTP, Firecrawl hosted/stdio, n8n Streamable HTTP bearer, and Beeper localhost HTTP bearer shapes all fit the repaired transport model, but vendor-specific availability, scopes, and token validity remain unproven until the live corpus runs.
9. Desktop/Core/Flux version identity and compatibility are not presented as one update journey. The existing Core updater remains buried in Core settings; normal update and diagnostics surfaces need a combined version/compatibility receipt and a single safe next action before support can rely on users independently discovering engine updates.
10. ACP construction currently forces HTTP/SSE capability true for user connectors even when an agent advertises false. Current Claude/Codex bridges report HTTP support, but custom and other ACP agents are not entitled to that assumption. Honor the initialized capability and introduce a proven remote-to-stdio relay or fail before send.

The nine skipped tests in the broad sweep are all pre-existing Concierge diagnostics that require the optional native sqlite test runtime. No connector publication, ToolSearch seam, agent `tools/call`, or preview-quarantine proof is skipped. Production activation of automatic session rebuild remains intentionally unclaimed.

The student report therefore moves MCP from “possible parity backlog” to a release-blocking operational-truth lane. It does not justify claiming the four named vendors are fixed until the packaged/live acceptance corpus passes.
