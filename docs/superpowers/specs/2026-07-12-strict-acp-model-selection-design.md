# Strict ACP Model Selection for Claude and Codex

**Status:** Approved for implementation planning
**Date:** 2026-07-12
**Decision:** Use transactional, exact-model enforcement for Claude and Codex.

## Problem

Wayland can display a newly selected model before the underlying ACP runtime has
accepted it. If the model change is rejected, omitted during restore, or handled
by an outdated bridge, the picker can continue to show the requested model while
the provider uses its previous or default model.

The observed Codex case is a chat displaying `gpt-5.6-sol` while external usage
telemetry reports GPT-5.5. The current Windows connector prefers the deprecated
`@zed-industries/codex-acp@0.9.5` platform package even though the installed
Codex catalog advertises the exact `gpt-5.6-sol` identifier. Claude has a
separate precision problem: full model identifiers can be collapsed to broad
`opus`, `sonnet`, or `haiku` slots before the runtime is spawned.

## Goals

- Make the model shown as active in Wayland match the exact model identifier
  acknowledged by the active Claude or Codex ACP runtime.
- Prevent a prompt from being sent while an explicit model selection is pending,
  rejected, mismatched, or unconfirmed.
- Preserve exact model selection across process restarts, session resume, and app
  restart.
- Migrate Codex to the maintained official ACP bridge and remove the stale
  platform-package preference.
- Make failures visible and actionable instead of silently falling back.
- Record enough local diagnostics to distinguish the requested model, confirmed
  model, bridge runtime, and failure reason.

## Non-goals

- Wayland will not attempt to prove how a third-party gateway accounts for or
  renames a model after the provider runtime acknowledges it.
- This change will not add a new model-management screen or token-monitoring
  service.
- This change will not redesign the general provider catalog or authentication
  flows.
- This change will not silently translate unavailable model identifiers to a
  supposedly equivalent model.

## Core Model State

Every managed ACP conversation will distinguish these values:

- `requestedModelId`: the exact provider-advertised identifier selected by the
  user.
- `pendingModelId`: the exact identifier currently being applied. It exists only
  during a switch or startup confirmation.
- `confirmedModelId`: the exact identifier acknowledged by the active runtime.
- `persistedModelId`: the last explicitly selected identifier that completed
  confirmation successfully.

The renderer must treat `confirmedModelId` as the only active model. A pending
selection may be shown as progress, but its label must not replace the active
label until confirmation succeeds. Persistence must occur only after exact
confirmation.

Chats without an explicit selection may intentionally use the provider default.
In that state the UI must say that the provider default is active rather than
assigning a specific model label that Wayland has not confirmed.

## Transactional Switching

The model switch is one serialized transaction owned by the main-process agent
manager:

1. The renderer submits the exact selected model ID through the existing IPC
   bridge and marks the selector as pending.
2. Prompt submission is disabled for that conversation while the transaction is
   pending. Draft input remains intact.
3. The manager verifies that the requested ID is advertised by the active ACP
   runtime or by the replacement runtime created for the switch.
4. The manager applies the exact ID using the runtime's advertised ACP model
   configuration capability.
5. The manager reads the runtime's resulting current model and requires exact
   equality with the requested ID.
6. Only then does it update `confirmedModelId`, persist the selection, and return
   success to the renderer.
7. The renderer replaces its active label with the confirmed model and clears
   the pending state.

If a generation is already in progress, the manager waits for that request to
settle before applying the model transaction. A later prompt cannot overtake the
switch.

The IPC result is a discriminated result carrying the requested ID and either the
confirmed ID or a stable failure code. A successful result must never be inferred
merely from the absence of an ACP transport exception.

## Authoritative Confirmation

Wayland accepts exact-model confirmation only from provider-originated ACP state:

- `models.currentModelId` returned by `session/new`, `session/load`, or a model
  configuration response;
- a model-category config option whose `currentValue` is returned by
  `session/setConfigOption`; or
- a subsequent `config_option_update` session notification whose model
  `currentValue` matches the requested ID.

An empty success response, a locally mutated cache, the outgoing request value,
and a spawn environment variable do not count as confirmation. A legacy
`session/set_model` response counts only when it contains authoritative model
state. If authoritative sources disagree, the result is `model_mismatch`. If no
authoritative state arrives before the confirmation timeout, the result is
`confirmation_unavailable`.

For native Claude, the exact spawn value is checked against the model state in the
new or resumed ACP session. For Codex, Wayland uses the advertised model config
option when available and waits for its response or update notification.

## Concurrent Selections

Model selection uses a monotonically increasing transaction generation, and the
latest user selection wins. A newer selection supersedes a queued older one. If
an older provider request is already in flight, its eventual response cannot
swap a connection, update confirmed state, persist a model, display success, or
unblock sending. Candidate runtimes created for superseded or timed-out
transactions are disconnected.

A retry creates a new generation. Only the current generation can confirm a model
and clear the model-blocked state.

## Codex Runtime Migration

Wayland will replace `@zed-industries/codex-acp` with the maintained
`@agentclientprotocol/codex-acp` package.

- Normal startup resolves the latest official package through the same cached
  latest-with-fallback resolver used for Claude.
- `1.1.2` is the exact known-good fallback used only when latest-version
  resolution is unavailable; it is not a minimum-version range.
- Resolved latest versions retain the existing six-hour cache lifetime. Expiry
  triggers a new registry resolution.
- Codex-specific operating-system and architecture package construction is
  removed. The official Node package launches its compatible `@openai/codex`
  dependency, which performs platform executable resolution.
- The deprecated Zed namespace is never retained as a launch fallback.
- Cache identity includes the full package namespace and version, so artifacts
  from the deprecated package cannot satisfy the new resolution.
- An explicit user `CODEX_PATH` override remains supported, but diagnostics must
  identify it. An incompatible override fails exact confirmation instead of
  permitting silent fallback.

After the ACP session is created and before its first prompt, Wayland applies the
persisted or newly requested exact model ID and confirms the runtime's current
model. For the reported case, `gpt-5.6-sol` must be acknowledged exactly; a
response of `gpt-5.5`, an absent model value, or an unsupported response blocks
the prompt.

## Claude Exact-Model Handling

Claude continues to use the maintained official Claude ACP package. The execution
path will no longer derive a broad family slot from a full selected model ID.

- A full provider-canonical ID is assigned unchanged to `ANTHROPIC_MODEL` for
  the replacement native Claude runtime.
- `opus`, `sonnet`, and `haiku` remain valid only when those aliases are the
  identifiers the provider catalog explicitly advertised and the user selected.
- Bedrock, Vertex, and custom proxy identifiers pass through unchanged.
- Ambient environment variables cannot override an explicit Wayland selection.

Because native Claude model changes require a respawn, the manager starts a
replacement ACP connection with the exact requested model and resumes the same
conversation. It confirms the replacement runtime before swapping it into the
active slot. Until that succeeds, the prior connection and confirmed model remain
active, although new prompts stay blocked during the transaction.

## Startup and Resume

When a conversation has a persisted explicit model, initialization is not ready
for prompting until that exact ID is applied and confirmed.

- If the model is available, Wayland confirms it before the first prompt.
- If it is absent from the runtime catalog, rejected, or acknowledged as a
  different ID, the conversation enters a model-blocked state.
- The persisted selection is not erased automatically.
- The UI explains that the saved model could not be restored and lets the user
  retry, select another advertised model, or explicitly choose provider default.

Choosing provider default is an intentional runtime transaction, not only a
storage change. Wayland starts or reconfigures the provider runtime with the
explicit model override removed, resumes the conversation, and waits for normal
session initialization. It clears the persisted explicit model and labels the
chat as provider default only after that transaction succeeds. A concrete current
model reported by ACP is retained for diagnostics but is not represented as an
explicitly pinned selection. Failure leaves the conversation model-blocked.

## Failure Handling and UI

Stable failure categories are:

- `unsupported_model`: the runtime does not advertise the requested ID.
- `model_rejected`: the runtime rejects the configuration request.
- `model_mismatch`: the runtime reports a different current model.
- `confirmation_unavailable`: the runtime cannot report an authoritative current
  model.
- `bridge_unavailable`: the ACP bridge cannot start or resume.
- `model_switch_timeout`: confirmation does not complete within the model-switch
  timeout.

The confirmation timeout is 60 seconds after ACP session initialization. Bridge
installation and startup retain their existing connector timeout because they
occur before model confirmation begins.

On failure, Wayland ends the pending transaction, retains the previous confirmed
runtime and persistence when available, and enters a model-blocked state. The
active label continues to show the previous confirmed model, while the error
identifies the unconfirmed requested model. Sending remains blocked until the user
retries, selects and confirms another model, chooses provider default, or
explicitly reverts to the previously confirmed model. If no confirmed runtime
exists, only the first three recovery actions are available. Errors must never
claim that a requested model is active.

All new user-facing text uses the existing i18n workflow and Arco components.

## Diagnostics

Existing request tracing and ACP logs will record:

- provider and conversation identifier;
- requested, previous confirmed, and resulting confirmed model IDs;
- bridge package name and resolved version;
- whether an explicit executable override was used;
- confirmation source and stable failure code;
- whether a restart or resume occurred.

Diagnostics must not record prompts, credentials, access tokens, or environment
variable values. The confirmed ID is Wayland's statement about what the ACP
runtime acknowledged; downstream gateway accounting remains outside Wayland's
control.

## Compatibility and Rollout

- Existing conversations with a persisted model receive the confirmation gate on
  their next initialization.
- Conversations without a persisted explicit model continue using provider
  default and are labelled accordingly.
- Old Codex ACP cache entries remain on disk but are ignored because their package
  identity differs.
- Parsers tolerate additional ACP capability and configuration fields from newer
  bridge versions.
- Windows paths containing spaces and the official package's first-run dependency
  installation must be covered by connector tests.

## Test Strategy

Implementation follows test-driven development. Required coverage includes:

1. Renderer tests proving a pending choice is not presented as active and that a
   failed IPC result restores the confirmed label with a localized error.
2. IPC contract tests for successful confirmation and every stable failure code.
3. Agent-manager tests proving prompts cannot overtake a pending or failed model
   switch.
4. Codex connector tests proving every supported OS uses the official package,
   latest resolution falls back only to official `1.1.2`, and deprecated cache
   entries are ignored.
5. Codex ACP tests proving `gpt-5.6-sol` is applied and acknowledged before the
   first prompt, while rejection or GPT-5.5 mismatch prevents that prompt.
6. Claude tests proving distinct full model IDs are not collapsed to the same
   family slot and the exact ID reaches the spawned runtime.
7. Claude respawn tests proving session resume and connection swap occur only
   after exact confirmation.
8. Restart tests proving persisted exact models are confirmed before prompting
   and unavailable models produce the blocked recovery state.
9. Pass-through tests for Bedrock, Vertex, custom proxy, and explicitly selected
   alias identifiers.
10. A Windows smoke test covering bridge resolution, existing login reuse, exact
    model selection, one prompt, and diagnostic output.
11. Confirmation-source tests proving request echoes, environment values, local
    cache mutation, and empty success responses cannot confirm a model.
12. Concurrency tests proving the latest selection wins and late, superseded, or
    timed-out responses cannot mutate state, persistence, connections, or send
    readiness.
13. Recovery tests exercising retry, alternate-model selection, provider default,
    and explicit reversion after each applicable failure category.
14. Provider-default tests proving the explicit override is removed from a new or
    reconfigured runtime before persistence is cleared or sending resumes.
15. Diagnostic tests asserting every required field and proving prompts, tokens,
    credentials, and environment values are redacted.

## Acceptance Criteria

- Selecting `gpt-5.6-sol` cannot result in Wayland sending a prompt while the
  confirmed ACP model is GPT-5.5 or unknown.
- The active picker value always comes from confirmed runtime state.
- Local request or configuration state is never treated as runtime confirmation.
- Full Claude model IDs remain exact through spawn, resume, confirmation, and
  persistence.
- Model restoration never silently falls back or erases the saved explicit model.
- A rejected or mismatched switch cannot send another prompt until the user
  explicitly resolves the model-blocked state.
- Choosing provider default removes the explicit runtime override before the chat
  is labelled default or unblocked.
- Codex no longer launches the deprecated Zed ACP package on Windows or any other
  supported platform.
- Every model-switch failure is visible, localized, and leaves the conversation
  in a deterministic recoverable state.
- Targeted tests, type checking, linting, formatting checks, i18n validation, and
  the repository's full test command pass before completion is claimed.
