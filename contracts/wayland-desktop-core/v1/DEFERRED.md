# Deferred Desktop contract adversarial cases

This v1.7 corpus records the current producer wire. Contract negotiation,
unknown-critical rejection, and unknown-noncritical dropping are live and
proved by serialized replay through the reference host observer.

Policy, workflow, and Anvil sub-contract vectors exercise their current
producer identities and reducer rules.

Anvil receipts are publication-bound: the producer binds the serialized
verdict body and immediate post-publication artifact state. Durable Desktop
replay and a persistent later-mutation watcher remain deferred.

- `ordinary_turn_tool_replay_reducer`: legacy ordinary turn and tool events
  still have no producer event ID or monotonic sequence. Recovery v1 instead
  exposes a sanitized, content-free journal cursor and replay stream for
  interrupted-turn restoration; it does not retroactively make legacy event
  payloads authoritative.
- `anvil_desktop_replay_reducer`: deferred until Desktop consumes the Core
  reducer and proves restart/replay against this corpus.
- `anvil_persistent_mutation_watcher`: deferred because Core currently checks
  immediate post-publication mutation, not later filesystem changes over the
  full receipt lifetime.

## Producer events with NO Desktop payload schema

These seven `ProtocolEvent` variants are emitted on the JSON stream by the
production sink (`wcore-agent/src/output/protocol_sink.rs` and, for
`workspace_policy`, `wcore-cli/src/main.rs`), so a Desktop host DOES receive
them. They are absent from `manifest.json` and from `core-event.schema.json`,
and `producer-complete.schema.json` gives them only a bare discriminator in its
"Non-Desktop producer inventory" branch — a `type` enum with
`additionalProperties: true` and no payload properties at all. A host can
therefore recognise the tag and can validate NOTHING about the body.

This section exists because the gap was previously declared NOWHERE. Listing it
is not a fix: it converts an undeclared hole into a declared one, so that
`desktop_contract_selfconsistency.rs` can hold the line while each is modelled
properly. `workspace_policy` is the one to model first — it carries a
`WorkspacePolicyReceipt`, which is safety-class authority.

- `workspace_policy`
- `capability_activation`
- `provider_attempt`
- `provider_retry`
- `provider_failure`
- `mid_flight_monitor_decision`
- `compact_offload`

Malformed command fixtures and the current unknown-type behavior are proved by
`desktop_contract_adversarial.rs`. Browser, CUA, and plugin event fixtures are
shape-only because no production emitter is proven at this source baseline.
Runtime diagnostics v1 is production-backed by correlated serialized replay;
its executable readiness is non-spawning, launch-environment exact, and
redacted before entering protocol state.
