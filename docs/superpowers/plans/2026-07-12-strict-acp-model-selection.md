# Strict ACP Model Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every explicit Claude or Codex model selection reach the exact ACP runtime model, block prompts until provider-originated confirmation, and produce a verified Windows NSIS installer.

**Architecture:** The ACP session layer will separate desired model state from provider-confirmed state and expose an exact confirmation result. `AcpAgentManager` will own a latest-wins transaction, staged respawn, persistence commit, restore gate, and prompt gate; the renderer will display confirmed state while showing pending or blocked intent separately. Codex will launch the maintained official ACP package through the existing latest-with-fallback resolver.

**Tech Stack:** Electron, TypeScript strict mode, React, Arco Design, ACP SDK, Vitest 4, Testing Library, Bun, electron-builder/NSIS.

## Global Constraints

- Use `@agentclientprotocol/codex-acp`; never launch or fall back to `@zed-industries/codex-acp`.
- Resolve the latest official Codex ACP package normally; use exact `1.1.2` only when latest resolution is unavailable.
- Cache resolved latest bridge versions for the existing six-hour TTL.
- Accept model confirmation only from `models.currentModelId`, a model config option `currentValue` returned by ACP, or a provider `config_option_update`.
- Never confirm from the outgoing request, spawn environment, local cache mutation, an empty RPC success, or `selectedValue` alone.
- Use a 60-second confirmation timeout after ACP session initialization.
- Preserve full Claude, Bedrock, Vertex, proxy, and alias identifiers exactly; only `opus`, `sonnet`, or `haiku` selected literally remain aliases.
- Persist an explicit model only after exact confirmation. Missing, rejected, mismatched, or unconfirmed restore state blocks prompting and does not erase persistence.
- Latest selection wins. Superseded and late responses cannot mutate confirmed state, persistence, connection ownership, or send readiness.
- Provider default is an explicit runtime transaction that removes the model override before clearing persistence.
- All renderer text uses i18n keys in every configured locale and Arco components.
- Do not log prompts, credentials, access tokens, or environment values.
- Preserve all pre-existing worktree changes. Do not stage a file's baseline hunks with this work; defer a code commit when selective staging cannot prove isolation.
- The requested deliverable is the NSIS installer produced by `bun run dist:win`.

## File Responsibility Map

- `src/common/types/acpTypes.ts`: official Codex package constants and shared selection/result/state contracts.
- `src/process/agent/acp/acpConnectors.ts`: official Codex package resolution and launch diagnostics.
- `src/process/acp/session/ConfigTracker.ts`: desired versus provider-confirmed model state.
- `src/process/acp/session/AcpSession.ts`: non-optimistic ACP model request and provider update handling.
- `src/process/acp/session/SessionLifecycle.ts`: authoritative new/load session state and strict restore reassertion.
- `src/process/acp/compat/AcpAgentV2.ts`: exact confirmation waiter, timeout, mismatch, and confirmed model snapshot.
- `src/process/task/AcpAgentManager.ts`: latest-wins transaction, staged respawn, exact Claude spawn value, persistence, restore/send gate, default transition, and diagnostics.
- `src/common/adapter/ipcBridge.ts` and `src/process/bridge/acpConversationBridge.ts`: discriminated model-selection IPC result.
- `src/renderer/components/agent/AcpModelSelector.tsx`: confirmed-only active label plus pending/blocked recovery UX.
- `src/renderer/components/model/modelSelector/ModelSelectorFlyout.tsx` and `modelSelectorTypes.ts`: provider-default recovery action.
- `src/renderer/pages/conversation/platforms/acp/useAcpMessage.ts` and `AcpSendBox.tsx`: send readiness derived from model state.
- `src/renderer/services/i18n/locales/*/conversation.json`: localized pending, failure, recovery, and default labels.
- Existing ACP/renderer test files listed in each task: regression coverage without adding children to already oversized directories.

---

### Task 1: Migrate Codex to the Official ACP Bridge

**Files:**

- Modify: `src/common/types/acpTypes.ts:7-15`
- Modify: `src/process/agent/acp/acpConnectors.ts:83-150,550-598,787-860`
- Modify: `src/process/resources/skills/cli-setup/SKILL.md:62-65`
- Test: `tests/unit/acpConnectors.test.ts:490-690`
- Test: `tests/unit/process/bridgeVersionResolver.test.ts:77-88`
- Test: `tests/unit/acpBunxCache.test.ts:125-148`

**Interfaces:**

- Consumes: `resolveBridgePackage(fallbackPackage: string): Promise<string>`.
- Produces: `CODEX_ACP_NPX_PACKAGE === '@agentclientprotocol/codex-acp@1.1.2'` and one resolved official package passed to `connectNpxBackend`.

- [ ] **Step 1: Replace obsolete connector tests with failing official-package tests**

```ts
expect(CODEX_ACP_NPX_PACKAGE).toBe('@agentclientprotocol/codex-acp@1.1.2');
resolveBridgePackageMock.mockResolvedValue('@agentclientprotocol/codex-acp@1.2.0');
await connectCodex({ onData, onExit, workspace: 'C:\\Work Folder\\repo' });
expect(resolveBridgePackageMock).toHaveBeenCalledWith('@agentclientprotocol/codex-acp@1.1.2');
expect(connectNpxBackendMock).toHaveBeenCalledTimes(1);
expect(JSON.stringify(connectNpxBackendMock.mock.calls)).toContain('@agentclientprotocol/codex-acp@1.2.0');
expect(JSON.stringify(connectNpxBackendMock.mock.calls)).not.toContain('@zed-industries');
```

Add platform-table cases for `win32/x64`, `win32/arm64`, `linux/x64`, and `darwin/arm64`; each asserts the same official meta-package path. Add resolver registry-failure coverage expecting exact `@agentclientprotocol/codex-acp@1.1.2`, and cache cleanup coverage proving an old Zed cache cannot satisfy the official package.

- [ ] **Step 2: Run the focused tests and verify the old behavior fails**

Run:

```powershell
bun run test -- tests/unit/acpConnectors.test.ts tests/unit/process/bridgeVersionResolver.test.ts tests/unit/acpBunxCache.test.ts
```

Expected: FAIL because constants and Windows candidate selection still use the deprecated Zed package.

- [ ] **Step 3: Implement the official-package resolver path**

```ts
export const CODEX_ACP_BRIDGE_VERSION = '1.1.2';
export const CODEX_ACP_NPX_PACKAGE = `@agentclientprotocol/codex-acp@${CODEX_ACP_BRIDGE_VERSION}`;

export async function connectCodex(options: AcpConnectorOptions): Promise<AcpConnector> {
  const npxPackage = await resolveBridgePackage(CODEX_ACP_NPX_PACKAGE);
  return connectNpxBackend({
    ...options,
    backend: 'codex',
    npxPackage,
    prepareFn: () => prepareCodex(npxPackage),
  });
}
```

Delete Codex OS/architecture package construction, direct-package preference, optional-dependency parsing, and deprecated fallback retries. Derive the logged bridge version from the resolved package spec, while retaining the existing Bun cache-corruption and Windows Defender retry behavior in `connectNpxBackend`.

- [ ] **Step 4: Run focused tests, typecheck the slice, and inspect deprecated references**

```powershell
bun run test -- tests/unit/acpConnectors.test.ts tests/unit/process/bridgeVersionResolver.test.ts tests/unit/acpBunxCache.test.ts
bun run typecheck
rg -n @zed-industries/codex-acp|codex-acp-win32|codex-acp-linux|codex-acp-darwin src tests
```

Expected: tests and typecheck PASS; the search returns no live launch or guidance references.

- [ ] **Step 5: Create an isolated checkpoint**

```powershell
git diff --check
git diff -- src/common/types/acpTypes.ts src/process/agent/acp/acpConnectors.ts src/process/resources/skills/cli-setup/SKILL.md tests/unit/acpConnectors.test.ts tests/unit/process/bridgeVersionResolver.test.ts tests/unit/acpBunxCache.test.ts
```

If these files were clean at baseline, commit with `fix(acp): use official Codex bridge`. If any contained user changes, leave the combined file unstaged and record the passing checkpoint instead.

### Task 2: Make ACP Model Confirmation Provider-Authoritative

**Files:**

- Modify: `src/common/types/acpTypes.ts:994-1100`
- Modify: `src/process/acp/types.ts:95-135`
- Modify: `src/process/acp/session/ConfigTracker.ts:29-165`
- Modify: `src/process/acp/session/AcpSession.ts:239-249,330-360`
- Modify: `src/process/acp/session/SessionLifecycle.ts:244-275,319-338`
- Modify: `src/process/acp/compat/AcpAgentV2.ts:119-132,380-412,782-797,893-914`
- Test: `tests/unit/process/acp/session/ConfigTracker.test.ts`
- Test: `tests/integration/process/acp/session/AcpSession.lifecycle.test.ts`
- Test: `tests/unit/process/acp/compat/AcpAgentV2.test.ts`
- Test: `tests/unit/acpAgentV2ModelInfo.test.ts`
- Test: `tests/unit/acpSessionLifecycleFluxModel.test.ts`

**Interfaces:**

- Consumes: ACP session/new, session/load, session/set_model, session/set_config_option, and `config_option_update`.
- Produces:

```ts
export type AcpModelConfirmationSource =
  | 'session-models'
  | 'config-option-response'
  | 'config-option-update'
  | 'spawn-session';

export type AcpModelSelectionFailureCode =
  | 'unsupported_model'
  | 'model_rejected'
  | 'model_mismatch'
  | 'confirmation_unavailable'
  | 'bridge_unavailable'
  | 'model_switch_timeout';

export type AcpModelSelectionState = 'provider-default' | 'pending' | 'confirmed' | 'blocked';

export type AcpModelSelectionResult =
  | {
      ok: true;
      requestedModelId: string | null;
      confirmedModelId: string | null;
      modelInfo: AcpModelInfo | null;
      confirmationSource: AcpModelConfirmationSource | 'provider-default';
      restarted: boolean;
    }
  | {
      ok: false;
      requestedModelId: string | null;
      previousConfirmedModelId: string | null;
      code: AcpModelSelectionFailureCode;
      message: string;
      modelInfo: AcpModelInfo | null;
    };
```

Extend `AcpModelInfo` with optional `selectionState`, `requestedModelId`, and `selectionFailureCode`; `currentModelId` remains confirmed-only.

- [ ] **Step 1: Write failing tracker, session, and V2 tests**

```ts
it('does not confirm the outgoing model after an empty RPC success', async () => {
  client.setModel.mockResolvedValue(undefined);
  const change = agent.setModelByConfigOption('gpt-5.6-sol');
  await vi.advanceTimersByTimeAsync(60_000);
  await expect(change).rejects.toMatchObject({ code: 'model_switch_timeout' });
  expect(agent.getModelInfo()?.currentModelId).not.toBe('gpt-5.6-sol');
});

it('confirms only an exact provider config update', async () => {
  const change = agent.setModelByConfigOption('gpt-5.6-sol');
  emitConfigUpdate({ category: 'model', currentValue: 'gpt-5.6-sol' });
  await expect(change).resolves.toMatchObject({ currentModelId: 'gpt-5.6-sol' });
});

it('rejects a provider-reported mismatch', async () => {
  const change = agent.setModelByConfigOption('gpt-5.6-sol');
  emitModelUpdate({ currentModelId: 'gpt-5.5', availableModels });
  await expect(change).rejects.toMatchObject({ code: 'model_mismatch' });
});
```

Add session-new/load tests proving `models.currentModelId` and a model-category config option `currentValue` are authoritative. Add negative cases for `selectedValue` alone, local desired state, empty success, stale update, and Flux request echoes.

- [ ] **Step 2: Run tests and confirm the optimistic implementation fails**

```powershell
bun run test -- tests/unit/process/acp/session/ConfigTracker.test.ts tests/integration/process/acp/session/AcpSession.lifecycle.test.ts tests/unit/process/acp/compat/AcpAgentV2.test.ts tests/unit/acpAgentV2ModelInfo.test.ts tests/unit/acpSessionLifecycleFluxModel.test.ts
```

Expected: FAIL because `AcpSession.setModel` locally marks the request current, V2 resolves any snapshot, and its timeout returns stale cached data.

- [ ] **Step 3: Make ConfigTracker and AcpSession non-optimistic**

```ts
export class ConfigTracker {
  syncAuthoritativeModel(modelId: string, availableModels?: ModelSnapshot['availableModels']): ModelSnapshot {
    this.currentModelId = modelId;
    if (availableModels) this.availableModels = availableModels;
    if (this.desiredModelId === modelId) this.desiredModelId = null;
    return this.modelSnapshot();
  }

  updateConfigOptions(options: ConfigOption[]): ModelSnapshot | null {
    this.currentConfigOptions = options;
    const model = options.find(
      (option) => option.category === 'model' && typeof option.currentValue === 'string'
    );
    if (!model || typeof model.currentValue !== 'string') return null;
    const availableModels = (model.options ?? []).map((option) => ({
      modelId: option.id,
      name: option.name,
      description: option.description,
    }));
    return this.syncAuthoritativeModel(model.currentValue, availableModels);
  }
}

async setModel(modelId: string): Promise<void> {
  this.configTracker.setDesiredModel(modelId);
  if (this._status !== 'active' || !this.lifecycle.client || !this.lifecycle.sessionId) {
    throw new Error('ACP session is not active');
  }
  await this.lifecycle.client.setModel(this.lifecycle.sessionId, modelId);
}
```

Map `category`, `description`, `currentValue`, and select options from session/new, session/load, and `config_option_update`. Invoke `onModelUpdate` only when `ConfigTracker` receives provider-originated current state. Remove `setCurrentModel(requested)` after RPC success from `AcpSession` and `SessionLifecycle.reassertConfig`; reassert errors remain observable to the caller.

- [ ] **Step 4: Make AcpAgentV2 wait for exact current state**

```ts
type PendingModelOp = PendingOp<AcpModelInfo> & {
  requestedModelId: string;
  generation: number;
};

async setModelByConfigOption(modelId: string): Promise<AcpModelInfo> {
  const generation = ++this.modelGeneration;
  const confirmation = new Promise<AcpModelInfo>((resolve, reject) => {
    const timer = setTimeout(() => {
      if (this.modelOp?.generation !== generation) return;
      this.modelOp = null;
      reject(Object.assign(new Error(`Model confirmation timed out: ${modelId}`), {
        code: 'model_switch_timeout' as const,
      }));
    }, 60_000);
    this.modelOp = { requestedModelId: modelId, generation, resolve, reject, timer };
  });
  await this.session!.setModel(modelId);
  const confirmed = await confirmation;
  this.userModelOverride = modelId;
  return confirmed;
}
```

In `onModelUpdate`, resolve only when `next.currentModelId === modelOp.requestedModelId`. Reject `model_mismatch` when the provider reports a different non-null current ID after the request. Ignore empty and superseded snapshots. Reject immediately with `unsupported_model` when a non-empty advertised catalog omits the requested exact ID. Do not let `sendMessage` best-effort reassert and continue; the manager's gate in Task 3 owns readiness.

- [ ] **Step 5: Run focused tests and create a checkpoint**

```powershell
bun run test -- tests/unit/process/acp/session/ConfigTracker.test.ts tests/integration/process/acp/session/AcpSession.lifecycle.test.ts tests/unit/process/acp/compat/AcpAgentV2.test.ts tests/unit/acpAgentV2ModelInfo.test.ts tests/unit/acpSessionLifecycleFluxModel.test.ts
bun run typecheck
git diff --check
```

Expected: exact confirmation, mismatch, timeout, session restore, and Flux cases PASS. Commit clean-baseline files as `fix(acp): require provider model confirmation`; leave pre-dirty files unstaged if their baseline hunks cannot be isolated.

### Task 3: Add the Manager Transaction, Exact Claude Spawn, Persistence, and Prompt Gate

**Files:**

- Modify: `src/process/task/AcpAgentManager.ts:128-180,610-725,1053-1069,1303-1480,1487-1683,1915-2092,2234-2250`
- Modify only if its public helper remains needed: `src/process/task/claudeConfig.ts`
- Test: `tests/unit/acpAgentManagerCustomAgentEnvResolution.test.ts`
- Test: `tests/unit/task/fluxRoutingRespawn.test.ts`
- Test: `tests/unit/acpAgentManagerSessionResumeReplay.test.ts`
- Test: `tests/unit/acpAgentManagerCronGuard.test.ts`
- Test: `tests/unit/task/claudeConfig.test.ts`

**Interfaces:**

- Consumes: `AcpAgentV2.setModelByConfigOption(modelId): Promise<AcpModelInfo>` from Task 2.
- Produces: `AcpAgentManager.setModel(modelId: string | null): Promise<AcpModelSelectionResult>`, confirmed-only `getModelInfo()`, and a prompt readiness gate.

```ts
private requestedModelId: string | null;
private confirmedModelId: string | null = null;
private previousConfirmedModelId: string | null = null;
private pendingModelId: string | null = null;
private modelSelectionState: AcpModelSelectionState;
private modelBlockedFailure: AcpModelSelectionFailureCode | null = null;
private modelSwitchGeneration = 0;
private modelTransition: Promise<AcpModelSelectionResult> | null = null;
private lastConfirmationSource: AcpModelConfirmationSource | 'provider-default' | null = null;
private lastModelSwitchRestarted = false;
private resolvedBridgePackage: string | null = null;
private resolvedBridgeVersion: string | null = null;
```

- [ ] **Step 1: Write failing manager transaction tests**

```ts
it('passes a full Claude ID to ANTHROPIC_MODEL unchanged', async () => {
  const config = await resolveAgentCliConfigForTest({
    backend: 'claude',
    currentModelId: 'claude-sonnet-4-8-20260701',
  });
  expect(config.customEnv.ANTHROPIC_MODEL).toBe('claude-sonnet-4-8-20260701');
});

it.each(['opus', 'sonnet', 'haiku', 'anthropic.claude-sonnet-v4:0', 'vertex/claude-sonnet-4'])(
  'passes provider model identifier %s unchanged',
  async (modelId) => {
    expect(
      (await resolveAgentCliConfigForTest({ backend: 'claude', currentModelId: modelId })).customEnv.ANTHROPIC_MODEL
    ).toBe(modelId);
  }
);

it('persists only after exact confirmation', async () => {
  agent.setModelByConfigOption.mockResolvedValue(modelInfo('gpt-5.6-sol'));
  await expect(manager.setModel('gpt-5.6-sol')).resolves.toMatchObject({
    ok: true,
    confirmedModelId: 'gpt-5.6-sol',
  });
  expect(updateConversation).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      extra: expect.objectContaining({ currentModelId: 'gpt-5.6-sol' }),
    })
  );
});

it('blocks before persisting a user message when restore is unconfirmed', async () => {
  managerForPersistedModel('gpt-5.6-sol').forceBlocked('confirmation_unavailable');
  await expect(manager.sendMessage(message)).resolves.toMatchObject({ success: false });
  expect(addMessage).not.toHaveBeenCalled();
  expect(agent.sendMessage).not.toHaveBeenCalled();
});
```

Add tests proving mismatch does not persist; a failed staged candidate leaves the previous agent and confirmed ID; a successful candidate swaps before killing the old agent; latest generation wins; a late result cannot persist; restore retains an unsupported saved ID and blocks; provider default removes `ANTHROPIC_MODEL` or Codex model override before clearing persistence.

- [ ] **Step 2: Run manager tests and confirm current behavior fails**

```powershell
bun run test -- tests/unit/acpAgentManagerCustomAgentEnvResolution.test.ts tests/unit/task/fluxRoutingRespawn.test.ts tests/unit/acpAgentManagerSessionResumeReplay.test.ts tests/unit/acpAgentManagerCronGuard.test.ts tests/unit/task/claudeConfig.test.ts
```

Expected: FAIL because Claude IDs collapse to slots, respawn persists and kills first, restore clears failure state, and send persists the user message before model readiness.

- [ ] **Step 3: Implement exact spawn state and confirmed-only persistence**

```ts
if (data.backend === 'claude' && decision.routing !== 'flux' && data.currentModelId) {
  mergedEnv.ANTHROPIC_MODEL = data.currentModelId;
}

private async saveConfirmedModelId(modelId: string): Promise<void> {
  const db = await getDatabase();
  const result = db.getConversation(this.conversation_id);
  if (!result.success || !result.data || result.data.type !== 'acp') {
    throw new Error('Unable to persist confirmed ACP model');
  }
  const extra = { ...result.data.extra, currentModelId: modelId };
  const updated = db.updateConversation(this.conversation_id, { extra });
  if (!updated.success) throw new Error(updated.msg || 'Unable to persist confirmed ACP model');
  this.options.currentModelId = modelId;
}
```

Constructor state treats `data.currentModelId` as requested/persisted intent, not confirmation. `getModelInfo()` merges the live catalog with manager state so `currentModelId` is `confirmedModelId`, while pending/blocked intent is exposed separately. Replace silent persistence catch with a throwing commit path; add a clear path that deletes `currentModelId` only after a provider-default runtime starts successfully.

- [ ] **Step 4: Implement latest-wins staged switching and the pre-message gate**

```ts
async setModel(modelId: string | null): Promise<AcpModelSelectionResult> {
  const generation = ++this.modelSwitchGeneration;
  this.requestedModelId = modelId;
  this.pendingModelId = modelId;
  this.modelSelectionState = 'pending';
  this.modelBlockedFailure = null;
  this.emitModelInfo();

  const transition = modelId === null
    ? this.transitionToProviderDefault(generation)
    : this.transitionToExactModel(modelId, generation);
  this.modelTransition = transition;
  const result = await transition;
  if (generation !== this.modelSwitchGeneration) {
    return this.failure(modelId, 'model_rejected', 'Model selection was superseded');
  }
  this.modelTransition = null;
  return result;
}

private assertModelReady(): void {
  if (this.modelSelectionState === 'pending' || this.modelSelectionState === 'blocked') {
    throw new Error(
      this.modelBlockedFailure
        ? `MODEL_SELECTION_BLOCKED:${this.modelBlockedFailure}`
        : 'MODEL_SELECTION_PENDING'
    );
  }
  if (this.requestedModelId && this.confirmedModelId !== this.requestedModelId) {
    throw new Error('MODEL_SELECTION_BLOCKED:confirmation_unavailable');
  }
}
```

Extract agent creation from `initAgent` into a helper that can start a candidate without assigning `this.agent` or persisting its session marker. For a respawn transaction: copy options with the exact candidate ID; start/resume the candidate; confirm its exact model through Task 2; re-check generation; assign candidate and committed routing/session state; persist; then kill the prior agent. On failure, kill only the candidate, restore prior routing state, keep the prior confirmed runtime, mark the conversation blocked, and require explicit recovery.

Move `await initAgent`, `await modelTransition`, and `assertModelReady()` before the existing user-message `addMessage`/stream emission block in `sendMessage`. A blocked request returns `{ success: false, msg }` without persisting a user message or calling the ACP prompt. Provider default starts a candidate with the explicit model field/env removed, commits the default state, then clears saved model persistence.

- [ ] **Step 5: Run manager tests, typecheck, and checkpoint**

```powershell
bun run test -- tests/unit/acpAgentManagerCustomAgentEnvResolution.test.ts tests/unit/task/fluxRoutingRespawn.test.ts tests/unit/acpAgentManagerSessionResumeReplay.test.ts tests/unit/acpAgentManagerCronGuard.test.ts tests/unit/task/claudeConfig.test.ts
bun run typecheck
git diff --check
```

Expected: exact Claude ID, staged swap/rollback, latest-wins, persistence, restore, default, and pre-message gate cases PASS. Commit isolated clean-baseline hunks as `fix(acp): make model switching transactional`; otherwise retain the verified unstaged delta.

### Task 4: Wire the IPC Contract and Confirmed-Only Renderer UX

**Files:**

- Modify: `src/common/adapter/ipcBridge.ts:959-967`
- Modify: `src/process/bridge/acpConversationBridge.ts:197-230`
- Modify: `src/renderer/components/agent/AcpModelSelector.tsx:97-206,239-403,445-705`
- Modify: `src/renderer/components/model/modelSelector/modelSelectorTypes.ts`
- Modify: `src/renderer/components/model/modelSelector/ModelSelectorFlyout.tsx`
- Modify: `src/renderer/pages/conversation/platforms/acp/useAcpMessage.ts:235-290`
- Modify: `src/renderer/pages/conversation/platforms/acp/AcpSendBox.tsx:110-160,385-405`
- Modify: all `src/renderer/services/i18n/locales/*/conversation.json`
- Test: `tests/unit/acpConversationBridge.test.ts`
- Test: `tests/unit/AcpModelSelector.dom.test.tsx`
- Test: `tests/unit/renderer/useAcpMessage.dom.test.tsx`
- Test: `tests/unit/renderer/modelSelector/ModelSelectorFlyout.dom.test.tsx`

**Interfaces:**

- Consumes: manager `setModel(modelId: string | null)` and enriched `AcpModelInfo`.
- Produces:

```ts
setModel: buildProvider<
  IBridgeResponse<{ selection: AcpModelSelectionResult }>,
  { conversationId: string; modelId: string | null }
>('acp.set-model');

type AcpModelSelectionResponse = IBridgeResponse<{ selection: AcpModelSelectionResult }>;

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
```

`useAcpMessage` returns `modelSelectionState` and `modelSelectionFailureCode`; `AcpSendBox` disables sending while state is `pending` or `blocked`.

- [ ] **Step 1: Write failing bridge, selector, state-hook, and flyout tests**

```tsx
it('keeps the confirmed label while an exact model switch is pending', async () => {
  const pending = deferred<AcpModelSelectionResponse>();
  ipcMock.setModel.mockReturnValue(pending.promise);
  render(<AcpModelSelector conversationId='conv-1' backend='codex' />);
  await screen.findByText(/GPT-5.5/);
  fireEvent.click(screen.getByText('GPT-5.6-Sol'));
  expect(screen.getAllByText(/GPT-5.5/).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(/Switching to GPT-5.6-Sol/).length).toBeGreaterThan(0);
});

it('keeps the confirmed label and surfaces a blocked mismatch', async () => {
  ipcMock.setModel.mockResolvedValue({
    success: true,
    data: {
      selection: {
        ok: false,
        requestedModelId: 'gpt-5.6-sol',
        previousConfirmedModelId: 'gpt-5.5',
        code: 'model_mismatch',
        message: 'Runtime reported gpt-5.5',
        modelInfo: confirmedInfo('gpt-5.5', 'blocked'),
      },
    },
  });
  await selectModel('GPT-5.6-Sol');
  expect(screen.getAllByText(/GPT-5.5/).length).toBeGreaterThan(0);
  expect(Message.error).toHaveBeenCalled();
});

it('ignores a superseded selection response', async () => {
  const first = deferred<AcpModelSelectionResponse>();
  const second = deferred<AcpModelSelectionResponse>();
  ipcMock.setModel.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  selectModel('gpt-5.5');
  selectModel('gpt-5.6-sol');
  second.resolve(confirmedSelection('gpt-5.6-sol'));
  first.resolve(confirmedSelection('gpt-5.5'));
  await waitFor(() => expect(activeModel()).toBe('gpt-5.6-sol'));
});
```

Add bridge mapping tests for every stable failure code and null/default selection. Add `useAcpMessage` tests for `acp_model_info` pending/confirmed/blocked transitions and flyout coverage for the provider-default action.

- [ ] **Step 2: Run the renderer/bridge tests and verify optimism fails**

```powershell
bun run test -- tests/unit/acpConversationBridge.test.ts tests/unit/AcpModelSelector.dom.test.tsx tests/unit/renderer/useAcpMessage.dom.test.tsx tests/unit/renderer/modelSelector/ModelSelectorFlyout.dom.test.tsx
```

Expected: FAIL because the selector pins the request immediately, failures are ignored, IPC has no discriminated result, and the send hook has no model state.

- [ ] **Step 3: Implement the discriminated IPC and confirmed-only selector**

```tsx
const selectionGenerationRef = useRef(0);
const [pendingSelection, setPendingSelection] = useState<{ generation: number; modelId: string | null } | null>(null);

const handleSelectModel = useCallback(
  async (modelId: string | null) => {
    const generation = ++selectionGenerationRef.current;
    setPendingSelection({ generation, modelId });
    try {
      const response = await ipcBridge.acpConversation.setModel.invoke({ conversationId, modelId });
      if (selectionGenerationRef.current !== generation) return;
      const selection = response.data?.selection;
      if (!response.success || !selection || !selection.ok) {
        if (selection?.modelInfo) updateModelInfo(selection.modelInfo);
        Message.error(
          t(`conversation.modelSelector.failure.${selection?.code ?? 'bridge_unavailable'}`, {
            model: modelId ?? t('conversation.modelSelector.providerDefault'),
          })
        );
        return;
      }
      if (modelId !== null && selection.confirmedModelId !== modelId) {
        Message.error(t('conversation.modelSelector.failure.model_mismatch', { model: modelId }));
        return;
      }
      selectedModelRef.current = selection.confirmedModelId;
      selectedFluxModelRef.current = isFluxModelId(selection.confirmedModelId) ? selection.confirmedModelId : null;
      if (selection.modelInfo) updateModelInfo(selection.modelInfo);
    } finally {
      if (selectionGenerationRef.current === generation) setPendingSelection(null);
    }
  },
  [conversationId, t, updateModelInfo]
);
```

The bridge wraps every manager result in `data.selection`; task-not-found maps to `bridge_unavailable`. Remove the selector's optimistic `setModelInfo` and pre-confirmation pins. Render the confirmed button label throughout pending/blocked state, add an Arco loading/pending label, and show localized failure feedback. A successful exact result alone updates confirmed refs.

- [ ] **Step 4: Add provider-default recovery and send readiness**

```ts
export type ModelSelectorDefaultAction = {
  label: string;
  active: boolean;
  disabled?: boolean;
  onSelect: () => void;
};
```

Add an optional `defaultAction` to `ModelSelectorFlyout`, rendered with an Arco `Button` above model zones. Pass `modelId: null` through `handleSelectModel`. Add i18n keys under `conversation.modelSelector` for `providerDefault`, `switching`, `blocked`, `retry`, `revert`, and each failure code in all 12 configured locales.

```ts
case 'acp_model_info': {
  const info = message.data as AcpModelInfo;
  setModelSelectionState(info.selectionState ?? 'provider-default');
  setModelSelectionFailureCode(info.selectionFailureCode ?? null);
  break;
}
```

Return those fields from `useAcpMessage`. Set `AcpSendBox disabled={modelSelectionState === 'pending' || modelSelectionState === 'blocked'}` and use a localized pending/blocked tooltip or placeholder. The main-process gate remains authoritative for initial messages, command queues, cron turns, and renderer races.

- [ ] **Step 5: Run renderer, bridge, i18n, and type verification**

```powershell
bun run test -- tests/unit/acpConversationBridge.test.ts tests/unit/AcpModelSelector.dom.test.tsx tests/unit/renderer/useAcpMessage.dom.test.tsx tests/unit/renderer/modelSelector/ModelSelectorFlyout.dom.test.tsx
bun run i18n:types
node scripts/check-i18n.js
bun run typecheck
git diff --check
```

Expected: IPC failure mapping, pending label, rollback, mismatch, stale result, default action, send gating, i18n, and type checks PASS. Commit isolated clean-baseline hunks as `fix(renderer): show only confirmed ACP models`; preserve pre-existing dirty hunks unstaged.

### Task 5: Complete Restore, Recovery, and Safe Diagnostics

**Files:**

- Modify: `src/process/task/AcpAgentManager.ts:1053-1069,1303-1344,1915-2044`
- Modify: `src/process/acp/compat/AcpAgentV2.ts:1020-1070`
- Test: `tests/unit/acpAgentManagerSessionResumeReplay.test.ts`
- Test: `tests/unit/task/fluxRoutingRespawn.test.ts`
- Test: `tests/unit/renderer/useAcpMessage.dom.test.tsx`
- Test: `tests/e2e/specs/agent-codex.e2e.ts` when local prerequisites are available

**Interfaces:**

- Consumes: selection state/result from Tasks 2-4.
- Produces: a safe request trace with requested/confirmed model and bridge provenance, plus deterministic blocked recovery across restart.

- [ ] **Step 1: Write failing restore, recovery, and diagnostic tests**

```ts
it('retains an unavailable persisted model and blocks the first prompt', async () => {
  const manager = managerForPersistedModel('gpt-5.6-sol');
  agent.getModelInfo.mockReturnValue(catalogWithout('gpt-5.6-sol'));
  await manager.initAgent();
  expect(manager.getModelInfo()).toMatchObject({
    currentModelId: null,
    requestedModelId: 'gpt-5.6-sol',
    selectionState: 'blocked',
    selectionFailureCode: 'unsupported_model',
  });
  await manager.sendMessage(message);
  expect(agent.sendMessage).not.toHaveBeenCalled();
  expect(savedConversation.extra.currentModelId).toBe('gpt-5.6-sol');
});

it('logs model provenance without prompt or environment secrets', () => {
  manager.emitRequestTraceForTest();
  expect(responseStream.emit).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'request_trace',
      data: expect.objectContaining({
        requestedModelId: 'gpt-5.6-sol',
        confirmedModelId: 'gpt-5.6-sol',
        bridgePackage: '@agentclientprotocol/codex-acp',
        bridgeVersion: expect.any(String),
        confirmationSource: expect.any(String),
        explicitExecutableOverride: false,
      }),
    })
  );
  const serialized = JSON.stringify(responseStream.emit.mock.calls);
  expect(serialized).not.toContain('prompt text');
  expect(serialized).not.toContain('API_KEY');
  expect(serialized).not.toContain('token');
});
```

Add table tests for retry, alternate selection, provider default, and explicit reversion after applicable failure codes. Add candidate restart/resume provenance, stale generation, timeout, cache isolation, and diagnostic redaction cases.

- [ ] **Step 2: Run the recovery tests and verify silent fallback fails**

```powershell
bun run test -- tests/unit/acpAgentManagerSessionResumeReplay.test.ts tests/unit/task/fluxRoutingRespawn.test.ts tests/unit/renderer/useAcpMessage.dom.test.tsx
```

Expected: FAIL because restore clears the saved ID and request trace reports local model belief without confirmation provenance.

- [ ] **Step 3: Implement blocked restore and safe trace fields**

```ts
private emitRequestTrace(): void {
  ipcBridge.acpConversation.responseStream.emit({
    type: 'request_trace',
    conversation_id: this.conversation_id,
    msg_id: uuid(),
    data: {
      agentType: 'acp',
      backend: this.options.backend,
      requestedModelId: this.requestedModelId,
      confirmedModelId: this.confirmedModelId,
      previousConfirmedModelId: this.previousConfirmedModelId,
      bridgePackage: this.resolvedBridgePackage,
      bridgeVersion: this.resolvedBridgeVersion,
      explicitExecutableOverride: Boolean(this.options.cliPath),
      confirmationSource: this.lastConfirmationSource,
      modelSelectionState: this.modelSelectionState,
      modelSelectionFailureCode: this.modelBlockedFailure,
      restarted: this.lastModelSwitchRestarted,
      resumed: Boolean(this.options.acpSessionId),
      routing: this.lastRouting,
      timestamp: Date.now(),
    },
  });
}
```

`restorePersistedState` invokes the same exact confirmation transaction as an in-chat selection. It never clears `requestedModelId` or persisted storage on failure. It emits blocked model info and returns normally so the conversation can render recovery controls, while `sendMessage` remains gated. Explicit revert creates a new generation that reaffirms the prior confirmed ID; retry and alternate/default paths use the same transaction contract.

- [ ] **Step 4: Run cross-layer tests and optional Codex smoke**

```powershell
bun run test -- tests/unit/acpAgentManagerSessionResumeReplay.test.ts tests/unit/task/fluxRoutingRespawn.test.ts tests/unit/renderer/useAcpMessage.dom.test.tsx
bun run test -- tests/unit/acpAgentV2ModelInfo.test.ts tests/unit/acpConversationBridge.test.ts tests/unit/AcpModelSelector.dom.test.tsx
```

When Codex authentication is already available locally, run:

```powershell
bun run test:e2e -- tests/e2e/specs/agent-codex.e2e.ts
```

Expected: recovery and diagnostics PASS. The optional smoke must show the official bridge and exact `gpt-5.6-sol` confirmation before its prompt; if authentication prevents it, record that external prerequisite without weakening unit/integration coverage.

- [ ] **Step 5: Create a safe checkpoint**

```powershell
bun run typecheck
git diff --check
```

Commit isolated clean-baseline hunks as `fix(acp): preserve model state across restore`; leave pre-existing dirty hunks unstaged.

### Task 6: Full Verification and Windows Installer

**Files:**

- Verify: all files changed by Tasks 1-5
- Build config: `package.json`
- Build config: `electron-builder.yml:159-165`
- Output: `out/Wayland-<version>-win-x64.exe`

**Interfaces:**

- Consumes: the complete strict model-selection implementation.
- Produces: passing project checks and a non-empty NSIS Windows installer with a recorded SHA-256 hash.

- [ ] **Step 1: Run the complete targeted regression set**

```powershell
bun run test -- tests/unit/acpConnectors.test.ts tests/unit/process/bridgeVersionResolver.test.ts tests/unit/acpBunxCache.test.ts tests/unit/process/acp/session/ConfigTracker.test.ts tests/integration/process/acp/session/AcpSession.lifecycle.test.ts tests/unit/process/acp/compat/AcpAgentV2.test.ts tests/unit/acpAgentV2ModelInfo.test.ts tests/unit/acpSessionLifecycleFluxModel.test.ts tests/unit/acpAgentManagerCustomAgentEnvResolution.test.ts tests/unit/task/fluxRoutingRespawn.test.ts tests/unit/acpAgentManagerSessionResumeReplay.test.ts tests/unit/acpAgentManagerCronGuard.test.ts tests/unit/task/claudeConfig.test.ts tests/unit/acpConversationBridge.test.ts tests/unit/AcpModelSelector.dom.test.tsx tests/unit/renderer/useAcpMessage.dom.test.tsx tests/unit/renderer/modelSelector/ModelSelectorFlyout.dom.test.tsx
```

Expected: every targeted test PASS.

- [ ] **Step 2: Auto-fix only touched source and run repository quality checks**

```powershell
bun run lint:fix
bun run format
bun run typecheck
bun run i18n:types
node scripts/check-i18n.js
bun run format:check
bun run lint
```

Inspect `git diff` after auto-fix and restore no user changes. Expected: typecheck, i18n, format check, and lint PASS.

- [ ] **Step 3: Run the full test suite**

```powershell
bun run test
```

Expected: PASS with no failed Vitest files. If a failure is unrelated and reproducible on the baseline dirty tree, document the exact test and evidence; do not weaken or skip strict-model tests.

- [ ] **Step 4: Run the final diff and CI-style hygiene checks**

```powershell
git diff --check
git status --short
prek run --all-files
```

Expected: no whitespace errors and no quality failure in changed files. Preserve the user's unrelated dirty files and untracked artifacts.

- [ ] **Step 5: Build the Windows NSIS installer**

```powershell
bun run dist:win
```

Expected: electron-builder completes both NSIS and ZIP targets. The requested installer is expected at `C:\Users\frost\Downloads\wayland-main\wayland-main\out\Wayland-0.12.1-win-x64.exe`; use the version from `package.json` if it changed.

- [ ] **Step 6: Verify and report the exact installer**

```powershell
$installer = Get-ChildItem -LiteralPath .\out -Filter 'Wayland-*-win-x64.exe' |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1
if (-not $installer -or $installer.Length -le 0) { throw 'Windows installer was not produced' }
$hash = Get-FileHash -Algorithm SHA256 -LiteralPath $installer.FullName
[pscustomobject]@{
  FullName = $installer.FullName
  Length = $installer.Length
  LastWriteTime = $installer.LastWriteTime
  SHA256 = $hash.Hash
}
```

Expected: one non-empty installer path, byte size, timestamp, and SHA-256 hash. Hand off that exact `.exe` path to the user.

## Execution Choice

The user already authorized implementation and the requested installer build. Execute with **superpowers:subagent-driven-development**, the recommended option, using a fresh implementation agent per reviewable task and preserving shared-worktree ownership between tasks.
