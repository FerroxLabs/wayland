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

None. This section previously listed seven `ProtocolEvent` variants —
`workspace_policy`, `capability_activation`, `provider_attempt`,
`provider_retry`, `provider_failure`, `mid_flight_monitor_decision` and
`compact_offload` — that the production sink emits but that no shipped artifact
declared. All seven now have a `WireSpec`, a fixture generated from the real
serializer, and a payload branch in `core-event.schema.json`.

The gap was not cosmetic. A Desktop host knows only what this corpus ships, and
the documented rule for an event type it does not recognise, with no `critical`
field, is to hard error — so `workspace_policy`, which arrives on every session
immediately after `ready`, tore down a corpus-only host. That is now proved from
the consumer side by `tests/desktop_contract_corpus_only_host.rs`, which builds
a host whose known-event set comes only from `manifest.json` and therefore
cannot be fooled by the producer-side `PRODUCER_EVENT_TYPES` constant.

`generated_artifacts()` now refuses to build a corpus whose `EVENT_SPECS` and
`PRODUCER_EVENT_TYPES` disagree, so this hole cannot reopen silently.

CLOSED, same class, command direction (#314): `grant_workspace_capability`,
`grant_path` and `revoke_path` were in `PRODUCER_COMMAND_TYPES` and absent from
`manifest.json`'s `commands`. The blast radius was different — commands travel
host to Core, so an undeclared command does not hard error a host — but a host
that derives its emitter or its conformance check from the published union
cannot send a command that union does not contain, and that failure reads as
"folder grants do not persist" rather than as a contract gap. All three now
carry a `WireSpec`, a fixture generated from the real deserializer, and a branch
in `host-command.schema.json`, and `generated_artifacts()` refuses to build a
corpus whose `COMMAND_SPECS` and `PRODUCER_COMMAND_TYPES` disagree — the parity
gate the event direction already had, which previously covered events only.

Malformed command fixtures and the current unknown-type behavior are proved by
`desktop_contract_adversarial.rs`. Browser, CUA, and plugin event fixtures are
shape-only because no production emitter is proven at this source baseline.
Runtime diagnostics v1 is production-backed by correlated serialized replay;
its executable readiness is non-spawning, launch-environment exact, and
redacted before entering protocol state.
