# Deferred Desktop contract adversarial cases

This v1.0 corpus records the current producer wire. Contract negotiation,
unknown-critical rejection, and unknown-noncritical dropping are live and
proved by serialized replay through the reference host observer.

Policy, workflow, and Anvil sub-contract vectors exercise their current
producer identities and reducer rules.

Anvil receipts are publication-bound: the producer binds the serialized
verdict body and immediate post-publication artifact state. Durable Desktop
replay and a persistent later-mutation watcher remain deferred.

- `ordinary_turn_tool_replay_reducer`: deferred because ordinary turn and tool
  events still have no producer event ID or monotonic sequence. Workflow,
  execution-policy, and Anvil streams have their own proved sequencing rules.
- `anvil_desktop_replay_reducer`: deferred until Desktop consumes the Core
  reducer and proves restart/replay against this corpus.
- `anvil_persistent_mutation_watcher`: deferred because Core currently checks
  immediate post-publication mutation, not later filesystem changes over the
  full receipt lifetime.

Malformed command fixtures and the current unknown-type behavior are proved by
`desktop_contract_adversarial.rs`. Browser, CUA, and plugin event fixtures are
shape-only because no production emitter is proven at this source baseline.
