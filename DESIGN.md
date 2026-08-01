# Wayland Desktop Design Contract

## Product promise

Tell Wayland what you want to accomplish. Wayland assembles the right intelligence, context, tools, trust, and execution, then shows its work.

## Mental model

The interface keeps the familiar nouns users already understand:

1. Chat - ask, steer, and review.
2. Project - related chats with shared context.
3. Workbench - files, changes, terminal, preview, artifacts, activity, teams, and receipts when needed.
4. Library - reusable assistants, workflows, teams, skills, and connections.
5. Automations - work that runs later or repeatedly.
6. Activity - work needing attention, running, upcoming, or recently completed.

Workspace is optional execution scope, not a replacement name for Project. Task is an internal execution spine, not a required top-level user noun.

## Universal work kernel

Every supported journey uses one backend-neutral work kernel for identity, actor, scope, lifecycle, authority, capabilities, economics, outcomes, evidence, interruption, and recovery. The kernel is an internal product contract, not a new destination or vocabulary lesson.

The interface projects only the controls relevant to the current work:

- knowledge work may expose sources, outline, citations, output, and native-format validation;
- development may expose changes, terminal, tests, preview, and repository evidence;
- automation may expose schedule, runs, approvals, logs, and delivery state;
- consequential external actions may expose draft, destination, identity, effect, approval, and receipt.

These are contextual Workbench compositions over the same run and authority state. They are not permanent modes, separate products, or separate stores.

## Experience principles

- Start fast: a normal chat never requires understanding Core, Flux, Teams, workflows, MCP, or workspaces.
- Connection truth: “connected” means the selected live session registered the connector's tools. Saved, authenticated, probe-reachable, published, and restart-required are useful intermediate states, never synonyms for ready.
- Preserve expert power: agent, model route, Project or workspace scope, policy, budget, tools, host, and evidence remain inspectable and directly overridable in the task.
- Progressive disclosure, not removal: show the current effective choice first; reveal the full provider-agnostic catalogue in one deliberate action.
- One system, one authority: Cockpit and Classic share routes, services, IPC, storage, conversations, Projects, agents, settings, and execution state.
- Honest state: approvals, failures, policy, cost, routing, and receipt status are never softened into generic calm or success.
- Familiar before novel: preserve Chat and Project parity with established desktop AI products, then expose Wayland's deeper execution and governance in context.
- Outcome first: catalogues support the work; they do not compete with the user's intent as the primary starting point.
- No dead ends: former top-level capabilities remain reachable within two deliberate navigation actions or universal search.
- One starting point: the composer accepts quick questions and substantial outcomes without requiring the user to select the correct internal mode first.
- Exceptions, not dashboards: healthy readiness collapses to a simple effective state; missing capability, degraded fidelity, network use, cost, or increased authority is surfaced before it matters.
- Honest continuity: provider replacement preserves only Desktop-owned durable context and explicitly discloses backend session, plan, tool, or side-effect state that cannot transfer.

## Cockpit composition

- Home centers one outcome composer, recent work, contextual starters, and attention.
- The selected agent is visible above the composer; the complete agent roster is one click away.
- Model, Project or workspace scope, and permission class stay visible in the composer.
- Advanced route, host, budget, tool, and evidence controls expand in place without navigating away from the task.
- A substantial request may graduate from conversation into visible multi-step work without moving to a different product surface. The user can steer, pause, stop, resume, or narrow it in ordinary language.
- Ordinary chat has no permanent right-hand dashboard. When a run acquires two or more durable steps, outputs, sources/context, approvals, or background state, an adaptive mission rail appears on the same route. It can be closed, pinned, or reopened without changing the work.
- The mission rail composes only active sections: Plan/Progress, Outputs, Context, and Activity/Receipts. Healthy context stays collapsed; blockers, approvals, capability loss, cost uncertainty, and failed validation surface before they matter.
- Plan progress is evidence, not theatre. A backend-declared plan is labeled with its producer and updated only from correlated run events. Desktop may offer a clearly labeled local checklist when a backend cannot plan, but it never invents backend steps or marks work complete from prose alone.
- Adaptive changes preserve an auditable step history and explain additions, removals, reorderings, and replans. Completed work remains inspectable. The user can steer, reorder, pause, stop, approve, or change agent/model at an explicit checkpoint with continuity and capability-loss disclosure.
- The conversation carries a sparse chronological activity spine from the same correlated run events: plan updated, task started/completed, output created/updated, approval or answer needed, validation passed/failed, and recovery/retry. The rail is the current index; the thread is the durable story. They never maintain competing progress state.
- Activity language describes user-meaningful outcomes rather than dumping tool calls. Repeated low-level events collapse behind one inspectable milestone; active work may show elapsed time and the current operation, and every completion/failure links to its output, evidence, or remedy.
- The Workbench is one contextual host. It activates only the domain projections needed by the current outcome and never replaces Chat or Project with Cowork-specific navigation.
- Structural validation, integrity checking, and trusted verification are visually and semantically distinct. Third-party adapter output cannot promote itself to verified.
- The left rail is stable: New chat, Search, Chats, Projects, Library, Automations, Activity, and Settings.
- Classic remains an in-product fallback during the measured transition; switching shells never migrates user data.

### Voice conversation

- Voice and Chat are reversible presentations of the same canonical conversation, Project, actor, model, workspace, authority, tools, plan, outputs, and receipts.
- Voice never becomes a separate simplified product or store. Returning to Chat lands at the same thread with the complete transcript and work state.
- The focused surface keeps one calm, legible state signal for listening, transcribing, thinking, acting, approval-needed, speaking, interrupted, reconnecting, error, and ended. Motion is informative and honors reduced-motion preferences.
- The adaptive mission rail remains available in Voice. Ordinary answers keep it collapsed; substantial progress, outputs, blockers, and approvals surface the same correlated state shown in Chat.
- Persistent controls are end, mute, interrupt, captions/transcript, voice selection, and return to Chat. Voice selection is presentation-only and cannot mutate actor, model, scope, or authority.
- Spoken approval never silently authorizes a consequential action. The canonical visual/keyboard approval and receipt remain required until a separately threat-modeled voice-auth contract exists.
- Local versus hosted capture/synthesis, provider identity, retention, and known or unknown cost are disclosed before audio crosses a network boundary.
- Barge-in must settle playback and turn correlation without duplicate sends, speech, tool actions, or approvals.

## Visual language

- Calm, high-trust dark surfaces with Wayland orange as the primary action and selection signal.
- Strong hierarchy through spacing, type weight, and surface contrast before adding borders or decoration.
- Compact controls use a 36-44 px target and retain clear focus, hover, selected, disabled, loading, and approval states.
- Dense catalogues use search, grouping, counts, and bounded scrolling; do not render walls of equal-weight choices on the home screen.
- Meet WCAG AA contrast, visible keyboard focus, reduced-motion preferences, zoom, and screen-reader name, role, and state requirements.

## Migration guardrails

- Cockpit is a presentation option, not a parallel product or backend.
- Classic behavior and data compatibility are regression-tested while Cockpit is previewed.
- New-user default and Classic retirement require measured task success and rollback evidence; they are not automatic consequences of visual completion.
- A new capability card or starter may not imply parity. It requires a packaged vertical journey, honest capability label, diagnosable failure path, and release gate for every claim it presents.

## Workspace retention

- Deleting a chat, Project, schedule, or activity record never silently deletes
  workspace files, reports, outputs, receipts, or external effects.
- Generated workspaces are inventoried against chats, Projects, schedules,
  active processes, outputs, receipts, filesystem content, and explicit user
  promotion before they can enter any cleanup review.
- Missing or contradictory authority preserves the workspace. The interface
  explains which inventory is incomplete instead of implying that an
  empty-looking folder is disposable.
- The default Storage view answers three questions at a glance: what Wayland
  found, what is protected, and whether anything is reviewable. Raw paths and
  detailed evidence remain secondary.
- Protected entries may be revealed in Finder/Explorer for inspection; reveal
  is not cleanup authority or an ownership mutation.
- Cleanup is a lifecycle: visible dry run, deliberate selection, recoverable
  quarantine, restore window, and receipt. Permanent deletion is a separate
  explicit action; age alone is never deletion authority.

## Current design decision

The full horizontal agent icon rail remains in Classic. Cockpit replaces it with a selected-first agent control showing the current agent and total available roster. Opening it reveals every available agent plus discovery management. This reduces first-screen decision weight without increasing the number of actions required to override the agent.

On Cockpit home, outcome intents sit directly below the composer and the reusable-assistant launchpad follows them. Classic retains its current assistant-first order. This changes hierarchy without hiding either path: the default asks what the user wants to accomplish, while reusable specialists remain immediately visible and editable.

Cowork remains a provider-neutral knowledge-work assistant and starter. It is not the name of the universal work kernel, a security level, a required mode switch, or a second workflow engine. A normal chat can use the same source, artifact, validation, and execution capabilities when the request requires them.

The adaptive mission rail is the compact in-conversation projection of that kernel. It borrows the legibility of a simple progress checklist while retaining Wayland's differentiators only when relevant: acting agent/model, effective authority, capability state, authoritative or unknown cost, schedules, approvals, artifact validation, and receipts. It is not an always-on Mission Control panel and it does not compete with the conversation for primary attention.

The rail and in-thread activity spine are deliberately complementary. The rail answers “where are we and what exists?”; the thread answers “what happened, in what order, and why?” Selecting a step or output cross-highlights its thread milestone and Workbench object. Raw logs, tool traces, and receipts remain one level deeper unless failure, authority, cost, or verification makes them decision-relevant.

Voice uses the same complementary model. The central state signal answers “can I
speak, and what is Wayland doing now?”; the mission rail answers “where is the
work and what needs me?”; Chat remains the durable transcript. None maintains
competing run or approval state.
