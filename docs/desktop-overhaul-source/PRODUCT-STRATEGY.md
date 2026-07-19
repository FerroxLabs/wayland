# Product strategy: the outcome operating system

## Product promise

> Tell Wayland what you want to accomplish. Wayland assembles the right Project
> context, execution scope, intelligence, tools, trust, and execution—and shows
> its work.

This is stronger and more legible than “all in one.” It tells a knowledge worker that the system handles complexity and tells a developer that the decisions remain inspectable.

## The unifying interaction

Every meaningful run produces a derived, inspectable execution view. It may sit
inside a durable Project and may use an optional filesystem/host execution
scope; neither a new persisted Task store nor a competing Workspace hierarchy
is introduced:

```text
Outcome
  -> understand and scope
  -> propose plan, host, budget, and permissions
  -> route intelligence through Flux
  -> select an agent: Core or an external CLI
  -> let that agent execute through its declared capabilities
  -> produce artifacts
  -> verify result
  -> record receipt
  -> share, schedule, continue, or automate
```

Assistants, workflows, teams, skills, models, agents, MCPs, and channels become ways Wayland fulfils the task. They remain inspectable and directly selectable, but they stop competing as primary mental models.

## Audience modes without separate products

### Everyday and knowledge work

The default experience should speak in outcomes and artifacts: research this, compare options, draft a document, analyze a sheet, prepare a presentation, organize a project, monitor something, communicate a result. Provider/agent detail stays collapsed unless it affects consent, cost, or quality.

### Developer and power user

The same conversation/run opens deeper controls: repository/worktree, terminal,
diff, tests, host, Core policy, tool scopes, model route, context, receipt, and
replay. Experts can pin an agent/model/workflow without forcing that complexity
on everyone.

### Operator and team

The Mission Control projection inside Activity becomes the attention surface
for remote, scheduled, delegated, and channel-triggered work: what is running,
blocked, awaiting approval, over budget, failed, verified, or ready to publish.
It is not a ninth top-level destination.

## Approved top-level information architecture

1. **New chat/Home** — ask, resume, attention, recent chats and pinned Projects.
2. **Search** — universal retrieval and command over every supported object.
3. **Chats** — familiar conversation history and active work.
4. **Projects** — durable groups of chats, sources, instructions, memory, outputs,
   history, connections, and optional execution scopes.
5. **Library** — assistants, workflows, teams, skills, templates, and compatible
   reusable capabilities under searchable type filters.
6. **Automations** — scheduled and recurring work.
7. **Activity** — Needs you, Running, Upcoming, and Recent.
8. **Settings** — providers, agents, Core, connections, trust, host, appearance,
   storage, and diagnostics.

Artifacts, execution details, approvals, receipts, connection health, and
operational state appear contextually in the conversation/workbench or inside
their owning Project, Library, Automation, Activity, or Settings surface. They
are not additional mandatory top-level mental models. Advanced users may pin
frequent filtered views without changing the canonical hierarchy.

## Home redesign principles

- Start with one outcome composer, recent/active work, and items needing attention.
- Replace the permanent model/agent icon rail with one compact routing summary such as “Auto · local preferred · $2 limit,” expandable before send.
- Offer three to five contextual starting points, not a fixed wall of modes.
- Recommend a workflow/assistant/team after intent is known, with a one-line rationale and an override.
- Show expected artifact, host, permission class, and cost/time range before consequential execution.
- Let users save a successful task as a reusable automation after value has been proven.

## Artifact lifecycle

Knowledge-work parity requires more than generating file bytes. Every artifact needs:

- a first-class preview/editor appropriate to its type;
- source citations and task/receipt provenance;
- versions, comments, comparison, and restore;
- export to open/native formats;
- connector destinations such as Drive, Notion, GitHub, or email;
- explicit publish/share approval;
- a portable bundle for self-hosted and cross-provider use.

The same lifecycle applies to a report, spreadsheet, presentation, code patch, research brief, campaign, or automation.

## Trust UX

Permissions should be understandable at the outcome level without inventing a
second persisted policy vocabulary. The canonical stored Project/workspace
authority remains only `ask` and `trusted-edits`. Interfaces may derive and
explain ordinary-language consequences such as:

- read and analyze;
- draft local artifacts;
- make an external or destructive change after approval; or
- run scheduled/remote work inside an explicit recurring producer-enforced
  policy.

These phrases describe effective behavior; they are not selectable modes and
never widen authority. The user can inspect the underlying file roots, domains,
connector scopes, shell commands, budgets, and recipients. Moving or scheduling
work keeps the same or a narrower effective policy.

## Success metrics

- time from install to first verified artifact;
- percentage of new users completing a useful outcome without opening Settings;
- task completion and verified-artifact rate by audience;
- approval interruption rate and denial/recovery rate;
- scheduled/remote completion reliability;
- share/remix/install conversion;
- seven- and thirty-day retained workspaces;
- provider/agent switching without task abandonment;
- support incidents per 1,000 completed tasks;
- percentage of marketed capabilities with release-gated journeys.
