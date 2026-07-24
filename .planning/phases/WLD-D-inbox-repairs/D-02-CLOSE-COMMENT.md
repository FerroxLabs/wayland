# D-02 (#537) — draft close comment + posting notes

**Status:** DRAFT for Sean's review. Do NOT post/close without Sean's nod. Post as FerroxLabs.

## ⚠️ Release-status gate to confirm BEFORE posting/closing
The host-delegated send path (`hostSendMessage.ts`, `envBuilder.ts` delegate flag, `protocol.ts`
`host_send_message_request`/`_result`, `index.ts` wiring) is confirmed present **on this branch**, and
the bundled Core v0.12.25 carries the symbols. But this branch is LOCAL / unreleased. Per the repo rule
(never close as fixed if it is not in a released version — mark `fixed-pending-release` instead):
- **If the host-send hook is already in a shipped desktop release** (verify the release tag) → post the
  comment below and CLOSE.
- **If it is only on this unreleased branch** → post the comment (with "on your next desktop update"
  wording) and label `fixed-pending-release`, do NOT close until the release ships.

Also honest note: we confirmed the path by CODE (hook armed + Core symbols), not by a live end-to-end
email send (Sean opted to skip the throwaway-email setup). The wiring is complete by construction; a
live send would be the belt-and-suspenders confirmation.

## Draft comment (Sean Writer voice, zero em dashes, no backticks, FerroxLabs)

Thanks for the detailed trace on this one. You were right that it was not the #116 core fix and not something upgrading core would solve.

The real gap was that desktop and engine were running two separate channel systems that never talked to each other, so the engine's send_message tool saw an empty channel table and could not match "email" to the email plugin you had configured. We have wired that up. When an agent calls send_message for email now, the engine hands the send back to the desktop, which fulfills it through the same email path your inbound replies already use. That is what clears the "unknown channel: email" error.

Nothing to change on your side, and no core upgrade needed for this. It will be in place on your next desktop update.

If you still hit "unknown channel: email" after updating, reopen and we will jump straight back on it.

All the best,
The Wayland Team
