# Inbox Triage — FerroxLabs/wayland — 2026-07-23

**Goal-scoped triage** (not full 141-issue template scoring): find issues we can
**knock out now** while wayland-core is being rebuilt — i.e. desktop-side and
**Core-independent**. 141 open issues total.

## Buckets

- **Core / Flux-gated — SKIP while Core rebuilds: 63.** Everything labelled
  `needs:core` / `area:core` / `needs:flux`, plus the unlabelled bug reports that
  are really Core (command/shell/bash execution #921/#918/#912/#892, browser-policy
  #901/#900/#899, web-search #452, OpenClaw runtime #872/#907, Windows-sandbox
  regressions #756). Includes the SBX-02 Core hook (#911 loopback capability) — the
  exact dependency that blocks our SBX-02 wiring.
- **Vague/empty "Bug report:" stubs: ~10** (#919/#917/#916/#908/#902/#898/#871…) —
  need author info or close; not actionable as-is.
- **Desktop-side, Core-independent — KNOCK-OUT CANDIDATES: see below.**

## Knock-out shortlist (desktop-side, Core-independent, actionable)

### Tier 1 — small, exact, low-risk (fastest wins)
- **#836 — Status-green (`--success #34d399`) fails contrast as text in light mode.**
  Pure CSS token fix in `default-color-scheme.css` (:179 light) + the badge/chip
  families that map `var(--success)` to text. ~1.9:1 → needs ≥4.5:1. Verifiable by
  measurement + the a11y gate. Continues our just-landed a11y/contrast work.
- **#780 — `team-create.e2e.ts` uses pre-v0.6.2.1 selectors (5/6 fail; UI works).**
  Test debt only: update to `data-testid="sider-team-create-inline"` + new modal
  structure. Low risk, removes red from the e2e suite.
- **#842 — Workflow parked on `awaiting_input` notifies nobody.** Author gave the
  exact fix: let `run_mode === 'awaiting_input'` through `taskCompletionNotifier`
  with distinct copy ("Workflow needs your input"), once-per-park. Files:
  `WorkflowSessionService.ts`, `taskCompletionNotifier.isUserFacingConversation`.

### Tier 2 — medium, well-specified
- **#838 — Gemini/OpenClaw/NanoBot/Remote never emit turn-completion** (starves the
  notifier + workflow driver). Four managers only emit `finish`/`error` but never
  call `notifyPotentialCompletion()`; exact file:line given. Pairs naturally with #842.
- **#882 — Show project name on conversation tabs.** Small UI enhancement; secondary
  project label on each tab. Desktop-only.
- **#891 — Memory runtime shows "Degraded" while the memory-server is healthy** on
  127.0.0.1:37891/api/health. Desktop health-check false-negative (wrong probe).

### Tier 3 — larger / more investigation
- **#890 — WhatsApp (baileys) bridge stdout polluted by Wayland's own startup logs**
  → invalid-JSON → bridge exits. Desktop log-hygiene fix (keep startup logs off the
  bridge IPC channel).
- **#885 — Skill Guard quarantines built-in Wayland skills, no unblock path.**
  Provenance-classification + unblock-persistence bug for bundled skills.
- **#853 — Surface the underlying error message, not a generic one.** Error-propagation
  UX so users see the real cli/AV/firewall cause.

## Recommendation
Start with **Tier 1** as a batch (#836 → #780 → #842): all small, exact, low-risk,
Core-independent, and each independently verifiable. #836 continues the a11y/contrast
work already loaded; #838 is a natural follow-on to #842. Skip the 63 Core/Flux-gated
until Core lands.
