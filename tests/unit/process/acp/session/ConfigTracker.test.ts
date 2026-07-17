// tests/unit/process/acp/session/ConfigTracker.test.ts

import { describe, it, expect } from 'vitest';
import { ConfigTracker } from '@process/acp/session/ConfigTracker';

describe('ConfigTracker', () => {
  it('starts with null current values', () => {
    const ct = new ConfigTracker();
    expect(ct.modelSnapshot().currentModelId).toBeNull();
    expect(ct.modeSnapshot().currentModeId).toBeNull();
  });

  it('setDesiredModel caches intent', () => {
    const ct = new ConfigTracker();
    ct.setDesiredModel('gpt-4');
    expect(ct.getPendingChanges().model).toBe('gpt-4');
    expect(ct.modelSnapshot().currentModelId).toBeNull();
  });

  it('confirms a model-category string currentValue from provider session state', () => {
    const ct = new ConfigTracker({ model: 'gpt-5.6-sol' });

    ct.syncFromSessionResult({
      configOptions: [
        {
          id: 'model',
          name: 'Model',
          type: 'select',
          category: 'model',
          currentValue: 'gpt-5.6-sol',
          options: [
            { id: 'gpt-5.6-sol', name: 'GPT-5.6 SOL', description: 'Exact provider model' },
            { id: 'gpt-5.5', name: 'GPT-5.5' },
          ],
        },
      ],
      cwd: '/tmp',
    });

    expect(ct.modelSnapshot()).toEqual({
      currentModelId: 'gpt-5.6-sol',
      availableModels: [
        { modelId: 'gpt-5.6-sol', name: 'GPT-5.6 SOL', description: 'Exact provider model' },
        { modelId: 'gpt-5.5', name: 'GPT-5.5', description: undefined },
      ],
    });
    expect(ct.getPendingChanges().model).toBeNull();
  });

  it('does not confirm selectedValue without a provider currentValue', () => {
    const ct = new ConfigTracker({ model: 'gpt-5.6-sol' });

    ct.syncFromSessionResult({
      configOptions: [
        {
          id: 'model',
          name: 'Model',
          type: 'select',
          category: 'model',
          selectedValue: 'gpt-5.6-sol',
          options: [{ id: 'gpt-5.6-sol', name: 'GPT-5.6 SOL' }],
        } as never,
      ],
      cwd: '/tmp',
    });

    expect(ct.modelSnapshot().currentModelId).toBeNull();
    expect(ct.getPendingChanges().model).toBe('gpt-5.6-sol');
  });

  it('setCurrentModel clears desired (INV-S-11)', () => {
    const ct = new ConfigTracker();
    ct.setDesiredModel('gpt-4');
    ct.setCurrentModel('gpt-4');
    expect(ct.getPendingChanges().model).toBeNull();
    expect(ct.modelSnapshot().currentModelId).toBe('gpt-4');
  });

  it('syncFromSessionResult populates available options', () => {
    const ct = new ConfigTracker({ model: 'claude-3' });
    ct.syncFromSessionResult({
      currentModelId: 'claude-3',
      availableModels: [{ modelId: 'claude-3', name: 'Claude 3' }],
      currentModeId: 'code',
      availableModes: [{ id: 'code', name: 'Code' }],
      configOptions: [{ id: 'think', name: 'Think', type: 'boolean' as const, currentValue: true }],
      cwd: '/tmp',
    });
    expect(ct.modelSnapshot().currentModelId).toBe('claude-3');
    expect(ct.getPendingChanges().model).toBeNull();
    expect(ct.modeSnapshot().currentModeId).toBe('code');
    expect(ct.configSnapshot().configOptions).toHaveLength(1);
  });

  it('reports conflicting provider model sources without confirming either value', () => {
    const ct = new ConfigTracker({ model: 'gpt-5.6-sol' });

    const update = ct.syncFromSessionResult({
      currentModelId: 'gpt-5.6-sol',
      availableModels: [
        { modelId: 'gpt-5.6-sol', name: 'GPT-5.6 SOL' },
        { modelId: 'gpt-5.5', name: 'GPT-5.5' },
      ],
      modelConfirmationSource: 'session-models',
      configConfirmationSource: 'config-option-response',
      configOptions: [
        {
          id: 'model',
          name: 'Model',
          type: 'select',
          category: 'model',
          currentValue: 'gpt-5.5',
          options: [
            { id: 'gpt-5.6-sol', name: 'GPT-5.6 SOL' },
            { id: 'gpt-5.5', name: 'GPT-5.5' },
          ],
        },
      ],
      cwd: '/tmp',
    });

    expect(update).toEqual({
      currentModelId: null,
      availableModels: [
        { modelId: 'gpt-5.6-sol', name: 'GPT-5.6 SOL' },
        { modelId: 'gpt-5.5', name: 'GPT-5.5' },
      ],
      modelConflict: {
        modelId: 'gpt-5.6-sol',
        modelSource: 'session-models',
        configModelId: 'gpt-5.5',
        configSource: 'config-option-response',
      },
    });
    expect(ct.modelSnapshot().currentModelId).toBeNull();
    expect(ct.getPendingChanges().model).toBe('gpt-5.6-sol');
  });

  it('reconciles an effort-qualified Codex session model with its matching base config value', () => {
    const ct = new ConfigTracker({ model: 'gpt-5.6-sol' }, 'codex');

    const update = ct.syncFromSessionResult({
      currentModelId: 'gpt-5.6-sol[ultra]',
      availableModels: [
        { modelId: 'gpt-5.5[high]', name: 'GPT-5.5 (high)' },
        { modelId: 'gpt-5.6-sol[ultra]', name: 'GPT-5.6 SOL (ultra)' },
      ],
      modelConfirmationSource: 'session-models',
      configConfirmationSource: 'config-option-response',
      configOptions: [
        {
          id: 'model',
          name: 'Model',
          type: 'select',
          category: 'model',
          currentValue: 'gpt-5.6-sol',
          options: [
            { id: 'gpt-5.5', name: 'GPT-5.5' },
            { id: 'gpt-5.6-sol', name: 'GPT-5.6 SOL' },
          ],
        },
      ],
      cwd: '/tmp',
    });

    expect(update).toEqual({
      currentModelId: 'gpt-5.6-sol[ultra]',
      availableModels: [
        { modelId: 'gpt-5.5[high]', name: 'GPT-5.5 (high)' },
        { modelId: 'gpt-5.6-sol[ultra]', name: 'GPT-5.6 SOL (ultra)' },
      ],
      confirmationSource: 'session-models',
    });
    expect(ct.getPendingChanges().model).toBeNull();
  });

  it('does not reconcile a Codex effort suffix for a non-Codex backend', () => {
    const ct = new ConfigTracker({ model: 'vendor-model' }, 'custom');

    const update = ct.syncFromSessionResult({
      currentModelId: 'vendor-model[high]',
      modelConfirmationSource: 'session-models',
      configConfirmationSource: 'config-option-response',
      configOptions: [
        {
          id: 'model',
          name: 'Model',
          type: 'select',
          category: 'model',
          currentValue: 'vendor-model',
          options: [{ id: 'vendor-model', name: 'Vendor Model' }],
        },
      ],
      cwd: '/tmp',
    });

    expect(update).toMatchObject({
      currentModelId: null,
      modelConflict: {
        modelId: 'vendor-model[high]',
        configModelId: 'vendor-model',
      },
    });
    expect(ct.getPendingChanges().model).toBe('vendor-model');
  });

  it('desired overrides current when both set', () => {
    const ct = new ConfigTracker();
    ct.setCurrentModel('claude-3');
    ct.setDesiredModel('gpt-4');
    expect(ct.getPendingChanges().model).toBe('gpt-4');
  });

  it('setDesiredMode caches intent', () => {
    const ct = new ConfigTracker();
    ct.setDesiredMode('architect');
    expect(ct.getPendingChanges().mode).toBe('architect');
  });

  it('setDesiredConfigOption caches intent', () => {
    const ct = new ConfigTracker();
    ct.setDesiredConfigOption('think', true);
    expect(ct.getPendingChanges().configOptions).toEqual([{ id: 'think', value: true }]);
  });

  it('clearPending removes all desired values', () => {
    const ct = new ConfigTracker();
    ct.setDesiredModel('gpt-4');
    ct.setDesiredMode('ask');
    ct.clearPending();
    const pending = ct.getPendingChanges();
    expect(pending.model).toBeNull();
    expect(pending.mode).toBeNull();
    expect(pending.configOptions).toEqual([]);
  });

  it('syncFromInitializeResult seeds modes advertised at initialize time', () => {
    const ct = new ConfigTracker();
    ct.syncFromInitializeResult({
      currentModeId: 'default',
      availableModes: [
        { id: 'plan', name: 'Plan' },
        { id: 'default', name: 'Default' },
        { id: 'auto-edit', name: 'Auto Edit' },
        { id: 'yolo', name: 'YOLO' },
      ],
    });
    const snapshot = ct.modeSnapshot();
    expect(snapshot.currentModeId).toBe('default');
    expect(snapshot.availableModes.map((m) => m.id)).toEqual(['plan', 'default', 'auto-edit', 'yolo']);
  });

  it('syncFromInitializeResult is a no-op for null / empty modes', () => {
    const ct = new ConfigTracker();
    ct.syncFromInitializeResult(null);
    expect(ct.modeSnapshot().availableModes).toEqual([]);
    ct.syncFromInitializeResult({ availableModes: [] });
    expect(ct.modeSnapshot().availableModes).toEqual([]);
  });

  it('syncFromSessionResult overrides modes seeded by syncFromInitializeResult', () => {
    const ct = new ConfigTracker();
    ct.syncFromInitializeResult({
      availableModes: [
        { id: 'plan', name: 'Plan' },
        { id: 'default', name: 'Default' },
      ],
    });
    ct.syncFromSessionResult({
      availableModes: [{ id: 'code', name: 'Code' }],
      currentModeId: 'code',
      cwd: '/tmp',
    });
    expect(ct.modeSnapshot().availableModes.map((m) => m.id)).toEqual(['code']);
  });
});
