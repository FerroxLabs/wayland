// src/process/acp/session/ConfigTracker.ts

import type { AcpModelConfirmationSource } from '@/common/types/acpTypes';
import type {
  AvailableCommand,
  ConfigOption,
  ConfigSnapshot,
  InitialDesiredConfig,
  ModelSnapshot,
  ModeSnapshot,
} from '@process/acp/types';

type SyncResult = {
  currentModelId?: string;
  availableModels?: Array<{ modelId: string; name: string; description?: string }>;
  currentModeId?: string;
  availableModes?: Array<{ id: string; name: string; description?: string }>;
  configOptions?: ConfigOption[];
  cwd: string;
  additionalDirectories?: string[];
  availableCommands?: AvailableCommand[];
  modelConfirmationSource?: AcpModelConfirmationSource;
  configConfirmationSource?: AcpModelConfirmationSource;
};

type PendingChanges = {
  model: string | null;
  mode: string | null;
  configOptions: Array<{ id: string; value: string | boolean }>;
};

export class ConfigTracker {
  // Current (confirmed by agent)
  private cwd = '';
  private additionalDirectories: string[] | undefined;
  private availableModels: Array<{ modelId: string; name: string; description?: string }> = [];
  private availableModes: Array<{ id: string; name: string; description?: string }> = [];
  private availableCommands: AvailableCommand[] = [];

  private currentModelId: string | null = null;
  private currentModelConfirmationSource: AcpModelConfirmationSource | undefined;
  private currentModeId: string | null = null;
  private currentConfigOptions: ConfigOption[] = [];
  // Desired (user intent, not yet synced)
  private desiredModelId: string | null = null;
  private desiredModeId: string | null = null;
  private desiredConfigOptions = new Map<string, string | boolean>();

  constructor(initialDesired?: InitialDesiredConfig) {
    if (!initialDesired) return;
    if (initialDesired.model) this.desiredModelId = initialDesired.model;
    if (initialDesired.mode) this.desiredModeId = initialDesired.mode;
    if (initialDesired.configOptions) {
      for (const [id, value] of Object.entries(initialDesired.configOptions)) {
        this.desiredConfigOptions.set(id, value);
      }
    }
  }

  setDesiredModel(modelId: string): void {
    this.desiredModelId = modelId;
  }

  setCurrentModel(modelId: string): void {
    this.syncAuthoritativeModel(modelId);
  }

  syncAuthoritativeModel(
    modelId: string,
    availableModels?: ModelSnapshot['availableModels'],
    confirmationSource?: AcpModelConfirmationSource
  ): ModelSnapshot {
    this.currentModelId = modelId;
    if (availableModels) this.availableModels = availableModels;
    this.currentModelConfirmationSource = confirmationSource;
    if (this.desiredModelId === modelId) this.desiredModelId = null;
    return this.modelSnapshot();
  }

  setDesiredMode(modeId: string): void {
    this.desiredModeId = modeId;
  }

  setCurrentMode(modeId: string): void {
    this.currentModeId = modeId;
    if (this.desiredModeId === modeId) this.desiredModeId = null;
  }

  setDesiredConfigOption(id: string, value: string | boolean): void {
    this.desiredConfigOptions.set(id, value);
  }

  setCurrentConfigOption(id: string, value: string | boolean): void {
    const opt = this.currentConfigOptions.find((o) => o.id === id);
    if (opt) opt.currentValue = value;
    this.desiredConfigOptions.delete(id);
  }

  syncFromSessionResult(result: SyncResult): ModelSnapshot | null {
    this.cwd = result.cwd;
    this.additionalDirectories = result.additionalDirectories;
    let modelUpdate: ModelSnapshot | null = null;
    const configModel = result.configOptions?.find(
      (option) => option.category === 'model' && typeof option.currentValue === 'string'
    );
    const hasModelConflict =
      result.currentModelId !== undefined &&
      typeof configModel?.currentValue === 'string' &&
      result.currentModelId !== configModel.currentValue;
    if (hasModelConflict && result.currentModelId !== undefined && typeof configModel.currentValue === 'string') {
      const configModels = (configModel.options ?? []).map((option) => ({
        modelId: option.id,
        name: option.name,
        description: option.description,
      }));
      if (result.availableModels) this.availableModels = result.availableModels;
      else if (configModels.length > 0) this.availableModels = configModels;
      modelUpdate = {
        currentModelId: this.currentModelId,
        availableModels: [...this.availableModels],
        modelConflict: {
          modelId: result.currentModelId,
          modelSource: result.modelConfirmationSource,
          configModelId: configModel.currentValue,
          configSource: result.configConfirmationSource,
        },
      };
    } else if (result.currentModelId !== undefined) {
      modelUpdate = this.syncAuthoritativeModel(
        result.currentModelId,
        result.availableModels,
        result.modelConfirmationSource
      );
    } else if (result.availableModels) {
      this.availableModels = result.availableModels;
    }
    if (result.currentModeId !== undefined) this.currentModeId = result.currentModeId;
    if (result.availableModes) this.availableModes = result.availableModes;
    if (result.configOptions) {
      this.currentConfigOptions = result.configOptions;
      if (!modelUpdate) {
        modelUpdate = this.syncModelFromConfigOptions(result.configOptions, result.configConfirmationSource);
      }
    }
    if (result.availableCommands) this.availableCommands = result.availableCommands;
    return modelUpdate;
  }

  /**
   * Seed modes from the initialize response. Some agents (e.g. qwen-code) only
   * advertise availableModes at initialize time and omit them from session/new,
   * so we preload them here. Later session responses can still override via
   * syncFromSessionResult when present.
   */
  syncFromInitializeResult(
    modes: {
      currentModeId?: string;
      availableModes?: Array<{ id: string; name?: string; description?: string }>;
    } | null
  ): void {
    if (!modes) return;
    if (modes.currentModeId !== undefined) this.currentModeId = modes.currentModeId;
    if (modes.availableModes && modes.availableModes.length > 0) {
      this.availableModes = modes.availableModes.map((m) => ({
        id: m.id,
        name: m.name ?? m.id,
        description: m.description,
      }));
    }
  }

  getPendingChanges(): PendingChanges {
    return {
      model: this.desiredModelId,
      mode: this.desiredModeId,
      configOptions: Array.from(this.desiredConfigOptions.entries()).map(([id, value]) => ({
        id,
        value,
      })),
    };
  }

  clearPending(): void {
    this.desiredModelId = null;
    this.desiredModeId = null;
    this.desiredConfigOptions.clear();
  }

  modelSnapshot(): ModelSnapshot {
    return {
      currentModelId: this.currentModelId,
      availableModels: [...this.availableModels],
      ...(this.currentModelConfirmationSource ? { confirmationSource: this.currentModelConfirmationSource } : {}),
    };
  }

  modeSnapshot(): ModeSnapshot {
    return {
      currentModeId: this.currentModeId,
      availableModes: [...this.availableModes],
    };
  }

  configSnapshot(): ConfigSnapshot {
    return {
      configOptions: [...this.currentConfigOptions],
      availableCommands: [...this.availableCommands],
      cwd: this.cwd,
      additionalDirectories: this.additionalDirectories,
    };
  }

  updateConfigOptions(options: ConfigOption[], confirmationSource?: AcpModelConfirmationSource): ModelSnapshot | null {
    this.currentConfigOptions = options;
    for (const option of options) {
      if (this.desiredConfigOptions.get(option.id) === option.currentValue) {
        this.desiredConfigOptions.delete(option.id);
      }
    }
    return this.syncModelFromConfigOptions(options, confirmationSource);
  }

  private syncModelFromConfigOptions(
    options: ConfigOption[],
    confirmationSource?: AcpModelConfirmationSource
  ): ModelSnapshot | null {
    const model = options.find((option) => option.category === 'model' && typeof option.currentValue === 'string');
    if (!model || typeof model.currentValue !== 'string') return null;

    const availableModels = (model.options ?? []).map((option) => ({
      modelId: option.id,
      name: option.name,
      description: option.description,
    }));
    return this.syncAuthoritativeModel(model.currentValue, availableModels, confirmationSource);
  }

  updateAvailableCommands(commands: AvailableCommand[]): void {
    this.availableCommands = commands;
  }
}
