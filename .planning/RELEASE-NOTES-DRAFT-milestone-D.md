# Release notes draft — Milestone D (Desktop Inbox Repairs)

**Status:** DRAFT ledger, parked for the sean-writer voice pass at actual publish time. This is the
factual change map, NOT the public announcement. Do NOT publish this file as-is. All work is LOCAL
on `worktree-agent-desktop-integration` at `dfe9eb71c`; nothing shipped. These close their GitHub
issues on the release that bundles this branch (mark `fixed-pending-release` only once pushed/tagged).

Each entry: user-facing benefit first (how the announcement should frame it), then the honest scope
underneath. "Bug fix" is banned in the announcement — frame as sharpened / clearer / hardened / added.

---

## Headline framing (for the announcement lead)
Wayland now tells you the truth about what it is doing. When something is degraded, it says why. When
a tool fails, it names the reason and points you at the log. The chat surface reads cleaner — you can
see the runtime, your spend, and which project a tab belongs to at a glance. And long multi-step
workflows stay fast and cheap instead of dragging as they grow.

---

## The changes

### You can always see what is running your chat (#909)
The chat header now shows the runtime (e.g. Wayland Core) next to the assistant when they differ, and
collapses to one clean label when they are the same. It never shows a raw internal backend id again.
- Packet D-06. `resolveRuntimeName()` returns friendly-or-nothing; the cross-audit caught and killed a
  raw "· gemini" leak before it could ship.

### Your spend is one glance away (#508)
A compact spend pill now sits in the title bar, reading your real budgets. Click it to jump straight to
the cost view. It stays out of the way when you have no budget set.
- Packet D-06. Reads existing `cost.listBudgets`; real button with a localized aria-label; hides on
  missing/malformed budget; deep-link switches the cost tab.

### Every tab knows its project (#882)
Conversation tabs now show the owning project as a secondary label, so you always know where a chat
lives. Restored tabs keep their project after a restart.
- Packet D-06. Truncation-safe; no-project tabs just show the name; restored tabs backfill projectId.

### Cleaner, more consistent wording (#910)
"Pin" is now one consistent word across the conversations surface, and the aggregation view reads
"Chats". Small change, less confusion.
- Packet D-06. #910a reuses existing translated keys; #910b "Chats" is an independently revertible
  standalone commit — **pending Sean's ratify at live-verify** (English-only default label).

### Honest diagnostics: Memory tells you WHY (#891)
When the Memory runtime reports as degraded, Wayland now shows the actual reason instead of a bare
"Degraded" badge — on both the status row and the Test-connection result.
- Packet D-04. Renderer-only; threads the real `errorReason` the client already returned; reuses the
  existing localized keys so no new translation debt.

### Honest diagnostics: tool failures name the cause (#853)
When a tool or process fails to run, Wayland now surfaces the real reason — a missing or blocked binary
(ENOENT), a permission problem (EACCES), or a process killed by a signal (SIGKILL) — instead of a
generic "code null", plus a link to the log. Secrets are redacted from the message.
- Packet D-05. New `execFailureReason.ts`; adds the missing `on('error')` handler (also removes a
  main-process crash path); captures the exit signal; double-redacted. Provider API errors were already
  verbatim and are untouched.

### Built-in skills just work (#885)
Wayland's own bundled skills no longer get caught by the skill safety guard meant for imported,
untrusted skills. Your first-party skills load without a false "blocked".
- Packet D-03. Producer-only exemption: trusted only when `source === 'wayland-library'` AND the path is
  relative (both facts — source alone would be a spoof hole). Verified against real shipped bodies:
  2106/2106 built-in skills exempted, zero spoofable surface. Imported skills are still guarded.

### Long workflows stay fast and cheap (#723)
Multi-step in-conversation workflows now reset each step's context in place, so a long workflow does not
get slower and more expensive as it grows. Your visible transcript is untouched — only the model's
working context is bounded.
- Packet D-07. Per-step reset respawns the backend session bounded to the immediately-prior deliverable
  (O(N^2) → O(N)); the advance directive stays hidden from the transcript. Caught a real production
  blocker in cross-audit (the seed was inert on the live message shape, tests false-green) and fixed it.
  **Token-cost sweep pending on a live wcore workflow (batched with Sean).**

### (Already landed earlier this arc) WhatsApp bridge + email send
- #890 WhatsApp bridge reaches QR in packaged builds again (fork→spawn via `resolveJsRuntime`, sidesteps
  the RunAsNode fuse). #537 email-send symbols present (Core v0.12.25) — **draft-close pending Sean's nod**.

---

## What is NOT in this release yet (honest gaps)
- **#910b "Chats"** label — awaiting Sean's ratify (or revert `8f713ea04`).
- **#537** close — draft comment ready (`D-02-CLOSE-COMMENT.md`), post on Sean's nod.
- **Packaged-artifact live-verify + D-07 token-cost sweep** — require a CI-produced sealed build (the
  local sealed-package path is gated by the release-acceptance trust root + GitHub attestations, which
  only the protected CI workflow can mint). Batched for the CI build with Sean.

## Bundled engine
- Ships with whatever `wayland-core` version the release bundles. **Fill in at publish time.** Several
  of the above (#537 host-send, D-07's permanent home) depend on the Core version — confirm the bundle
  before finalizing the announcement.
