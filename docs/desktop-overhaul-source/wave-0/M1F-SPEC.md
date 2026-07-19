# M1F — Flux consumer contract

## Outcome

Desktop displays route, fallback, and cost evidence only when a pinned Flux contract proves it; otherwise it enters an explicit no-Flux degraded profile.

## Required implementation

1. Pin producer commit/version, serialized fixture/schema digest, and generator version.
2. Validate explicit/native, Auto, attempt, retry, fallback, circuit, override, disconnected, cost, latency, unpriced, correlation, and terminal events.
3. Prove an explicit native model is never silently routed through Flux.
4. Correlate Desktop task/turn, backend spawn, attempts, fallback, cost, and terminal outcome.
5. Make absent/stale/unsupported/malformed Flux disable route explanations and cost claims.
6. Replay the contract through Desktop and Web/Cloud composition roots.
7. Preserve authoritative per-request charge semantics (`cost_usd`, currency, explicit BYOK zero, and absent-as-unknown) rather than substituting a Desktop catalog estimate, ACP session aggregate, or current-context occupancy.
8. Version and correlate request/session generation, attempt, retry/fallback, token/cache, terminal, and charge evidence so a conversation total can be reconciled without exposing account data.

## Verification

Fixture and real-boundary replay cover malformed, stale, duplicate, out-of-order, disconnected, invalid-key, unpriced, fallback, transient retry, failed-but-billable attempt, streaming-final-cost, context compaction, session reset, BYOK zero, and total-mismatch states in ordinary chat and Teams. The degraded profile has explicit tests and cannot satisfy SC-14 or SC-14C.

## Receipt fields

Flux commit/version, fixture paths and digest, commands, request/attempt/cost correlation coverage, authoritative-versus-computed provenance, capability state, disabled claims, composition-root results, and remaining limitations.
