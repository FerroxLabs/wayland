# Competitive parity and differentiation

This is a product-level matrix, not a count of hidden implementation toggles. “Lead” means the advantage is both structurally defensible and visible enough to matter; “gap” means the current user outcome is materially behind.

| Dimension                      | Wayland v0.11.18                                                | Claude/Cowork                                   | ChatGPT Work/Codex                                               | Hermes                                               | Position                                             |
| ------------------------------ | --------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| Provider neutrality            | Broad APIs, local models, CLIs, Core, Flux                      | Anthropic-centred                               | OpenAI-centred                                                   | Broad provider/model support                         | **Wayland lead**                                     |
| Agent neutrality               | Many detected external agents plus Core                         | Claude/Code agents                              | Codex/OpenAI agents                                              | Hermes engine and profiles                           | **Wayland lead**                                     |
| Local control                  | Strong Desktop, local files/models/agents                       | Strong Desktop local work                       | Strong Desktop developer/work surfaces                           | Strong CLI/TUI/Desktop orientation                   | Strong                                               |
| Outcome simplicity             | Many overlapping entry nouns and catalogues                     | Cowork task framing is simpler                  | Work/Chat/Codex are increasingly unified                         | Command centre remains technical                     | **Gap**                                              |
| Knowledge-work artifacts       | Office/document tooling exists but lacks one polished lifecycle | Strong file creation/editing and Cowork task UX | Work explicitly targets docs, presentations, spreadsheets, sites | More agent/tool oriented                             | **Gap to leaders**                                   |
| Developer workspaces           | Projects, agents, Core, tools, MCPs                             | Claude Code/Cowork projects                     | Codex worktrees, local/cloud projects, remote handoff            | CLI/TUI and tools                                    | Competitive ingredients; workflow gap                |
| Browser/computer use           | Protocol/UI pieces exist; not a proven flagship journey         | First-class computer use in Cowork              | First-class browser/computer-use surfaces                        | Browser automation/tooling                           | **Gap in productization**                            |
| Scheduled/persistent work      | Scheduled Tasks and Mission Control are real                    | Recurring tasks and remote assignment           | Scheduled tasks and remote work                                  | Cron and gateway                                     | Strong concept; reliability gap                      |
| Cross-device remote continuity | Web UI and remote concepts, divergent/incomplete                | Web, Desktop, mobile Cowork                     | Local/cloud projects and remote connections                      | Remote backend/gateway                               | **Gap**                                              |
| Connectors                     | 107 MCP entries plus channels/extensions                        | Connectors/plugins directory                    | Plugins/MCP/connectors                                           | 40+ tools and messaging gateway                      | Good base; managed auth/scale gap                    |
| Channels                       | Broad messaging/channel configuration                           | Primarily Claude surfaces/connectors            | Primarily ChatGPT surfaces/connectors                            | Telegram/Discord/Slack/WhatsApp/Signal/email gateway | **Wayland/Hermes strength**                          |
| Skills/extensions              | Skills, MCPs, assistants, workflows, extensions                 | Skills/connectors/plugins                       | Skills/plugins/MCP                                               | Skills and tools                                     | Strong, but trust/packaging fragmented               |
| Teams/orchestration            | 60 team templates and Mission Control                           | Task/project collaboration                      | Projects/tasks/remote agents                                     | Profiles and command center                          | Differentiated breadth; semantics need consolidation |
| Evidence/receipts              | Core direction is unusually strong                              | Approvals and task history                      | Logs/diffs/tasks                                                 | Session/tool history                                 | **Potential category lead**, not yet surfaced        |
| Desktop OS reach               | macOS/Windows/Linux, x64/arm64                                  | Desktop focus on macOS/Windows plus web/mobile  | Desktop surfaces vary by product/platform                        | Broad open-source orientation                        | **Wayland strength**                                 |
| Distribution                   | Early GitHub/npm/release momentum                               | Anthropic distribution                          | OpenAI distribution                                              | Nous/open-source audience                            | **Major gap**                                        |

## What parity should mean

Wayland should not copy the competitors' provider-owned product architecture. It needs parity at the outcome layer:

- begin work without configuration archaeology;
- create professional, editable artifacts;
- connect to the user's systems safely;
- use browser/computer capabilities with clear approval;
- continue work remotely and on a schedule;
- resume on another surface without losing state;
- inspect what happened, why, with which model/tool, at what cost;
- export, share, remix, or self-host without lock-in.

## Differentiation to defend

1. **Sovereignty:** users own provider choice, local data, execution host, and portable configuration.
2. **Routing:** Flux can optimize quality, price, latency, and availability across providers instead of merely selecting a model.
3. **Verifiability:** Core receipts can make consequential work inspectable and replayable.
4. **Surface reach:** the same task can enter through Desktop, Web, a channel, a schedule, or an API.
5. **Ecosystem portability:** assistants, workflows, skills, and connectors can be exported and remixed rather than trapped in one provider.

If these five advantages are expressed through a simpler task/workspace UX, Wayland does not need to win by having the largest visible menu.

## Current first-party references

- Claude: [Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork), [computer use](https://support.claude.com/en/articles/14128542-let-claude-use-your-computer-in-cowork), [projects](https://support.claude.com/en/articles/14116274-organize-your-tasks-with-projects-in-claude-cowork), [connectors](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities), [recurring tasks](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork), [file creation](https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude), and [remote assignment](https://support.claude.com/en/articles/13947068-assign-tasks-from-anywhere-in-claude-cowork).
- OpenAI: [desktop quickstart](https://learn.chatgpt.com/docs/quickstart), [Projects](https://learn.chatgpt.com/docs/projects), [remote connections](https://learn.chatgpt.com/docs/remote-connections), [scheduled tasks](https://learn.chatgpt.com/docs/scheduled-tasks), [computer use](https://learn.chatgpt.com/docs/computer-use), [browser](https://learn.chatgpt.com/docs/browser), and [plugins](https://learn.chatgpt.com/docs/plugins).
- Hermes: [Desktop documentation](https://hermes-agent.nousresearch.com/docs/user-guide/desktop) and [source repository](https://github.com/nousresearch/hermes-agent).

Links are maintained in the final audit handoff and should be refreshed quarterly because competitor surfaces change quickly.
