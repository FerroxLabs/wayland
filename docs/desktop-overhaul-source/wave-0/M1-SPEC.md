# M1 — Core consumer contract

Status: consumer/reducer slice passed and exact Core commit `d0aa0abc75afe056cc5434fcd652efa6d474ab0c` is published and accepted; M1 remains open for the bundled/previous/candidate release matrix and later Cockpit persistence/display obligations.

## Outcome

Desktop accepts Core data only after runtime validation against a pinned producer corpus and can exercise the real process/IPC boundary deterministically.

## Required implementation

1. Pin released Core version, producer commit, fixture/schema digest, and generator version.
2. Validate every stdout frame before it enters typed or verified state.
3. Define obligations for normalize, persist, display, acknowledge, reject/quarantine, and critical unknown events.
4. Replay workflow, child/sub-agent, approval, suspend/resume, terminal, policy, and receipt fixtures.
5. Provide a deterministic fake Core/provider subprocess over the production transport.
6. Capability-gate frontier-only behavior; never consume the dirty Core worktree implicitly.

## Verification

Real decoder/normalizer replay, malformed/oversized/unknown fuzzing, ordering/duplicate correlation, older/bundled/next version matrix, receipt-origin attacks, and autonomous approval cases.

## Receipt fields

Core commit/version, fixture paths and digest, decoder/generator version, commands, event coverage, unknown-event decisions, real-IPC journeys, and disabled capabilities.
