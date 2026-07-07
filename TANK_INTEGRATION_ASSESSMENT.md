# Integrating Tank into Wayland — effort assessment

**Question:** how much work is it to integrate tank into wayland?

**Short answer:** Anywhere from **~1–2 weeks** (embed tank as a sidecar behind a
Wayland tab) to **2–4+ months** (a true native merge of tank's orchestration
engine). The two products overlap heavily in concept, which makes a _code_ merge
expensive and partly redundant, and cheap-but-loose integration attractive.
There is also one hard gate: **licensing** (see §4).

---

## 1. What each side actually is

|              | **Wayland**                                                                                  | **Tank**                                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Role         | Local-first **desktop** AI agent; drives AI CLIs (Claude Code, Codex, Gemini…) interactively | Multi-agent **mission control**; spawns disposable coding sessions, autonomous queues, schedules across hosts   |
| Stack        | Electron + React + TypeScript (+ Rust `wcore`)                                               | Python FastAPI + SQLite + HTMX, no build step                                                                   |
| Runner       | In-process: `AgentRegistry` + ACP + pty/child_process                                        | `tmux new -d` on a (often remote) host; agents post lifecycle events back over HTTP                             |
| Distribution | Packaged desktop app                                                                         | systemd service + `deploy.sh` over SSH; thin Electron window (`desktop/`) that just points at a tank server URL |
| License      | **AGPL-3.0-or-later**                                                                        | **Proprietary** (Creator Magic Ltd)                                                                             |

**Key realization:** these are _the same category of product_. Wayland already
has `src/process/agent/` (a multi-backend registry: acp, gemini, nanobot,
openclaw, wcore, remote), a **mission-control** page, `task/`, `team/`, `flux/`,
`cron/`, `workflows/`, a `webserver` and a `webui`. Tank has projects, tasks,
agents, queues, schedules, monitors. So integration is not "add a missing
capability" — it's "reconcile two overlapping implementations." The genuinely
_additive_ things tank has that Wayland lacks: the **autonomous overnight queue**
(multi-turn, RC-sentinel completion), **remote fleet / multi-host** orchestration
over SSH+tmux, **schedules/monitors**, and the pluggable **codex/grok/antigravity**
backends via `backends.py`.

---

## 2. Three integration strategies (pick by goal)

### Option A — Embed tank as a sidecar (fastest, ~1–2 weeks)

Tank is already a self-contained web app, and tank's own `desktop/main.js` is
_already just an Electron window around a tank server_. Wayland can do the same:
spawn the Python service as a managed child process and surface its dashboard in
a Wayland tab via a `BrowserView` pointed at `http://localhost:7879`, injecting
the `tank_token` cookie (exactly the mechanism tank/desktop already uses).

- **Work:** process-lifecycle management for the Python service; token/auth
  plumbing; a "Tank" tab; **packaging a Python runtime + venv into the Electron
  distributable** (this is the single biggest line item — PyInstaller-freeze
  tank to a sidecar binary, or don't bundle it and point at a remote/existing
  tank).
- **Gets you:** tank's full feature set, live, with almost no reimplementation.
- **Costs:** two runtimes in one app; HTMX UI won't match Wayland's Arco/React
  look; bloats the installer.

### Option C — Native client against tank's HTTP/SSE API (best balance, ~3–6 weeks)

Keep tank running as its own service (local sidecar or remote), but build a
**native React mission-control in Wayland** that talks to tank's already-rich API
(`/projects`, `/queue`, `/tasks`, `/agents`, `/schedules`, `/monitors`, plus SSE
streams). No HTMX embedded; native Arco UI; tank's proven engine underneath.

- **Work:** a Wayland service client + IPC bridge to tank's REST/SSE; React
  views mirroring the queue/task/schedule flows; auth handshake.
- **Gets you:** native feel + tank's battle-tested orchestration, cleanly
  decoupled (also sidesteps the license issue — see §4, "arms-length").

### Option B — Native merge: port tank's engine into Wayland (largest, 2–4+ months)

Re-implement tank's orchestration in TypeScript on Wayland's existing primitives
(`AgentRegistry`, `task/`, `cron/`, `flux/`, storage). This is the "one unified
product" outcome.

- **Work:** port the queue engine (multi-turn resume, RC-sentinel completion
  model), the remote SSH+tmux runner (Wayland currently drives agents _in-process_
  — remote fleet is a new capability), schedules, monitors, the backend adapters
  (codex/grok/agy), and migrate tank's SQLite schema into Wayland's storage.
- **Costs:** reconcile two data models and two fundamentally different runner
  mechanisms (in-process ACP/pty vs remote tmux+HTTP-hooks). Large, and partly
  re-solves problems Wayland's mission-control already solves.

---

## 3. Effort drivers (independent of option)

1. **Runtime split (Python ↔ Node/Electron).** Options A/C keep it (sidecar or
   remote); B removes it by rewriting. Bundling Python into a desktop installer
   is the top packaging cost in A.
2. **Conceptual overlap = merge friction, not additive work.** Projects/tasks/
   agents/schedules exist on both sides. A code merge means deduplicating, not
   just wiring.
3. **Runner model mismatch.** Tank's remote-host tmux+lifecycle-hook model is its
   crown jewel and Wayland's biggest gap; it's also the hardest piece to port
   natively (Option B).
4. **Security posture.** Tank runs `--dangerously-skip-permissions` as a service
   user with token-cookie/LAN-trust auth; Wayland is a local-first desktop with
   its own login. Any surface that exposes tank inside Wayland inherits tank's
   "agent can touch anything the service user can" posture — must be reconciled.

## 4. The hard gate: licensing ⚠️

- **Wayland: AGPL-3.0-or-later. Tank core: PROPRIETARY** ("all rights reserved",
  Creator Magic Ltd).
- Copying tank's source _into_ the AGPL Wayland tree and distributing it is a
  license conflict: AGPL requires source disclosure of the combined work; the
  proprietary license forbids it. **Option B is legally blocked as-is.**
- **However, you (stormxkt@gmail.com) appear to own both** (tank's desktop author
  is the same identity). So this is a _decision you control_, not an external
  blocker: you can relicense/dual-license tank to enable a merge.
- **Options A and C are AGPL-safe without relicensing**: running tank as a
  separate process communicating over HTTP is "mere aggregation" / an
  arm's-length service, which AGPL permits. This is another reason the
  loose-coupling options are attractive.

---

## 5. Recommendation

- **Want it working this sprint / evaluate the idea:** **Option A** (sidecar +
  embedded tab). Reuses tank's existing "Electron window around a server" design
  almost verbatim.
- **Want it to feel like one product without a rewrite or a license change:**
  **Option C** (native Wayland UI over tank's HTTP/SSE API). Best value/effort;
  license-safe.
- **Want a single unified codebase long-term:** **Option B**, but budget months
  and **relicense tank first**.

Ladder-wise, the lazy first step is A→C: stand tank up as a sidecar, confirm the
value, then replace the embedded HTMX with native React against the API you're
already talking to. Only collapse into a native merge (B) if the two-process
seam actually hurts — and only after the license decision is made.
