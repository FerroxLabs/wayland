/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { ipcBridge } from '@/common';
import type {
  IWcoreConfigFieldPatch,
  IWcoreConfigMutationResult,
  IWcoreBrowserPolicy,
  IWcoreBrowserPolicyProjection,
  IWcoreEffectiveRuntime,
  IWcoreReadableConfigSection,
  IWcoreRuntimeFolderTarget,
} from '@/common/adapter/ipcBridge';
import type { OutputBudget } from '@/common/config/outputBudget';

/**
 * Renderer wrapper around the human-only `ipcBridge.wcoreConfig` surface (the
 * engine `config.toml` sections) and `ipcBridge.wcoreProfiles` (profile
 * directories).
 *
 * SECURITY (SEC-6): `patchField` is remote-denied and HUMAN-ONLY - the engine
 * reads this config live, so it must only ever be driven by direct human intent
 * in the trusted renderer, never by the agent. Main accepts only the closed
 * field/value union declared by the IPC contract; there is no arbitrary section
 * or security/env-passthrough writer.
 */
export type UseWcoreConfig = {
  /** Read one top-level `config.toml` section (undefined when absent). */
  getSection: <T = Record<string, unknown>>(section: IWcoreReadableConfigSection) => Promise<T | undefined>;
  /** Atomically merge one validated field under the main-process config lock. */
  patchField: (patch: IWcoreConfigFieldPatch) => Promise<IWcoreConfigMutationResult>;
  getBrowserPolicy: () => Promise<IWcoreBrowserPolicyProjection>;
  setBrowserPolicy: (policy: IWcoreBrowserPolicy) => Promise<IWcoreConfigMutationResult>;
  /** Exact config/profile identity currently selected for Desktop-launched Core sessions. */
  getEffectiveRuntime: () => Promise<IWcoreEffectiveRuntime>;
  /** Persist raw mode through the main-process transactional write seam. */
  setRawEngineMode: (enabled: boolean) => Promise<{ ok: boolean; error?: string }>;
  /** Read/write the main-process output-budget preference with failure truth. */
  getOutputBudget: () => Promise<OutputBudget | undefined>;
  setOutputBudget: (value: OutputBudget) => Promise<{ ok: boolean; error?: string }>;
  /** Open an authoritative runtime directory without accepting a renderer path. */
  openEffectiveRuntimeFolder: (target: IWcoreRuntimeFolderTarget) => Promise<{ ok: boolean; error?: string }>;
};

export function useWcoreConfig(): UseWcoreConfig {
  const getSection = useCallback(
    async <T = Record<string, unknown>>(section: IWcoreReadableConfigSection): Promise<T | undefined> => {
      const result = await ipcBridge.wcoreConfig.getSection.invoke({ section });
      if (result.ok) return result.value as T | undefined;
      throw new Error('error' in result ? result.error : `Core section "${section}" could not be read.`);
    },
    []
  );

  const patchField = useCallback(async (patch: IWcoreConfigFieldPatch): Promise<IWcoreConfigMutationResult> => {
    return ipcBridge.wcoreConfig.patchField.invoke({ patch });
  }, []);

  const getBrowserPolicy = useCallback(async (): Promise<IWcoreBrowserPolicyProjection> => {
    const result = await ipcBridge.wcoreConfig.getBrowserPolicy.invoke();
    if (result.ok) return result.projection;
    throw new Error('error' in result ? result.error : 'Core Browser policy could not be read.');
  }, []);

  const setBrowserPolicy = useCallback(async (policy: IWcoreBrowserPolicy): Promise<IWcoreConfigMutationResult> => {
    return ipcBridge.wcoreConfig.setBrowserPolicy.invoke({ policy });
  }, []);

  const getEffectiveRuntime = useCallback(async (): Promise<IWcoreEffectiveRuntime> => {
    const result = await ipcBridge.wcoreConfig.getEffectiveRuntime.invoke();
    if (result.ok) return result.runtime;
    throw new Error('error' in result ? result.error : 'Effective Core runtime could not be resolved.');
  }, []);

  const setRawEngineMode = useCallback(async (enabled: boolean) => {
    return ipcBridge.wcoreConfig.setRawEngineMode.invoke({ enabled });
  }, []);

  const getOutputBudget = useCallback(async (): Promise<OutputBudget | undefined> => {
    const result = await ipcBridge.wcoreConfig.getOutputBudget.invoke();
    if (result.ok) return result.value;
    throw new Error('error' in result ? result.error : 'Output budget could not be read.');
  }, []);

  const setOutputBudget = useCallback(async (value: OutputBudget) => {
    return ipcBridge.wcoreConfig.setOutputBudget.invoke({ value });
  }, []);

  const openEffectiveRuntimeFolder = useCallback(async (target: IWcoreRuntimeFolderTarget) => {
    return ipcBridge.wcoreConfig.openEffectiveRuntimeFolder.invoke({ target });
  }, []);

  return {
    getSection,
    patchField,
    getBrowserPolicy,
    setBrowserPolicy,
    getEffectiveRuntime,
    setRawEngineMode,
    getOutputBudget,
    setOutputBudget,
    openEffectiveRuntimeFolder,
  };
}
