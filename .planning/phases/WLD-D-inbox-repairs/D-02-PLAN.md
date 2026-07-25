---
phase: WLD-D-inbox-repairs
plan: D-02
type: verify
wave: D1
depends_on: []
files_modified: []
autonomous: false
blocking: false
github_issue: 537
---

> **Source of truth:** `D-01-RESEARCH.md` §"#537 — Verification Procedure + Decision Tree" and
> the RESEARCH VERDICT in `D-CONTEXT.md`. Verdict: **closeable pending one live send.** This is
> VERIFICATION ONLY — no desktop source changes. If the live send unexpectedly fails, STOP for
> Sean rather than shipping a desktop change (it would be Core-side).

<objective>
#537 — engine `send_message` returned "unknown channel: email". Both halves of the host-delegated
send path are already present and armed: the bundled Core binary
(`resources/bundled-wayland-core/darwin-arm64/wayland-core`, v0.12.25) emits
`host_send_message_request` / `WAYLAND_SEND_MESSAGE_HOST_DELEGATE` / `HostSendMessageResult` and
the log line "send_message runs host-delegated…" (confirmed via `strings`), and the desktop hook is
armed (`envBuilder.ts:1040` sets `WAYLAND_SEND_MESSAGE_HOST_DELEGATE='1'`; `hostSendMessage.ts`
`handleHostSendMessageRequest`; `index.ts` wires the event). So #537 lands on the "live-verify one
agent email send, then close" branch — not "route to Core".

Deliver: confirm the Core emit path + desktop hook are present in THIS tree, run ONE real
host-delegated agent email send end-to-end with the burner Flux key, and — only if it succeeds —
post a Sean-Writer-voice closing comment on #537 and close it. Do NOT tell users to upgrade Core
(channel code byte-identical 0.12.17..0.12.19).

Purpose: close a verified-fixed issue with a live receipt, not a guess.
Output: a live send receipt + the #537 close (or a captured error and a STOP for Sean).
</objective>

<tasks>

**Task 1 — Static re-confirm (both halves present in THIS tree).**

- Core emit path: `resources/bundled-wayland-core/darwin-arm64/wayland-core --version` → expect
  `wayland-core 0.12.25`; `strings` on the binary contains `host_send_message_request`,
  `WAYLAND_SEND_MESSAGE_HOST_DELEGATE`, `ProtocolCommand::HostSendMessageResult`, and the
  "send_message runs host-delegated…" line.
- Desktop hook armed: `envBuilder.ts:1040` sets `WAYLAND_SEND_MESSAGE_HOST_DELEGATE='1'`;
  `hostSendMessage.ts` exports `handleHostSendMessageRequest`; `index.ts` handles the
  `host_send_message_request` event.
  Verify: both greps + `--version` succeed. If EITHER half is absent → skip to Task 3's Core-side
  branch (route to Core, mark blocked-on-Core, do NOT close, do NOT ship a desktop change).
  Done: static evidence confirms the delegated send path exists on both sides.

**Task 2 — Live host-delegated agent email send (the authoritative step).**

- Use the burner Flux key at `~/.config/wayland-smoke/flux-test-key`. **Never commit it, never log
  its contents, never paste it into a comment or SUMMARY.** Reference it by path only.
- Spawn an agent host-delegated (desktop already sets `WAYLAND_SEND_MESSAGE_HOST_DELEGATE=1` via
  `envBuilder.ts:1040`). Ask the agent to send an email via `send_message` to a channel of type
  `email`.
- **Observe the delegated path fires — via a NAMED, falsifiable signal (W4), not "the log looks
  right":** require at least one of these concrete observables before calling it verified:
  (a) the Core log line `send_message runs host-delegated (WAYLAND_SEND_MESSAGE_HOST_DELEGATE=1): …`
  emitted for THIS send; and/or (b) desktop `handleHostSendMessageRequest` (`hostSendMessage.ts`,
  wired at `index.ts` ~:1459) actually executing for THIS send (log/instrument it). The literal
  `"unknown channel: "` still exists in the binary as the NON-delegated fallback, and a plain
  channel send can also "succeed" — so a bare "email sent" is NOT sufficient. Verify the DELEGATED
  path specifically (signal a and/or b present); if the email sends but neither delegated signal
  appears, treat it as NOT verified (→ Task 3 STOP-for-Sean), not a pass.
  Verify: the agent email send completes host-delegated end-to-end; capture the log line + a one-line
  receipt (no secret material).
  Done: one real delegated email send observed succeeding, or a captured exact error (→ Task 3
  Core-side branch).

**Task 3 — Decision tree + close (or STOP).**

- **If the live send SUCCEEDED (expected):** draft a closing comment via the `sean-writer` skill —
  FerroxLabs voice, zero em dashes, no backticks in the body, signed "All the best, The Wayland
  Team". The comment states the host-delegated send path is present and verified working end-to-end;
  it does NOT tell users to upgrade Core (channel code byte-identical 0.12.17..0.12.19) and does NOT
  claim a desktop code change (there was none — this is verification). Post it as FerroxLabs and
  close #537. No AI-signature attribution anywhere.
- **If the live send FAILED (unexpected — e.g. still `unknown channel: email`, or the desktop hook
  is absent):** capture the exact error text and **STOP for Sean.** Do NOT close, do NOT ship any
  desktop change. Route to `wayland-core`, mark #537 blocked-on-Core. This would be Core-side, and
  shipping a desktop change would be wrong.
  Verify: #537 closed with the FerroxLabs closing comment AND a live receipt — OR an open STOP with
  the captured error surfaced to Sean.
  Done: #537 resolved correctly per which branch fired.

</tasks>

<verification>
- `wayland-core --version` = 0.12.25 and `strings` shows the host-send symbols; desktop hook greps
  pass.
- ONE live host-delegated agent email send observed succeeding (delegated path, not the
  non-delegated `unknown channel` fallback).
- Closing comment is Sean-Writer voice, FerroxLabs, zero em dashes, no backticks, signed "All the
  best, The Wayland Team", no upgrade-Core advice, no AI-signature attribution.
- Burner key never committed/logged.
- LOCAL only — the GH close is the only outward action; surface the drafted comment to Sean before
  closing if he wants to review.
</verification>

<success_criteria>
#537 is verified closeable by a live delegated email send and closed with a FerroxLabs comment —
or, if the send fails, left open with a captured error and routed to Core. No desktop source change
ships either way. #537 auto-closes on merge if a stamp is used (`github_issue: 537`); the live-verify
close is the primary path here.
</success_criteria>

<output>
Write `D-02-SUMMARY.md` recording: the static confirmation (version + symbols + hook), the live
send receipt (log line, no secret material), which decision-tree branch fired, and the #537 close
(or the captured error + STOP-for-Sean note).
</output>
