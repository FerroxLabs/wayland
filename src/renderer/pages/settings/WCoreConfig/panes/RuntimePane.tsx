/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import type { IWcoreEffectiveRuntime, IWcoreRuntimeFolderTarget } from '@/common/adapter/ipcBridge';
import { useWcoreConfig } from '@renderer/hooks/useWcoreConfig';
import WcSwitch from '../components/WcSwitch';
import ScopeLabel from '../components/ScopeLabel';
import OutputBudgetField, { type OutputBudget } from '../components/OutputBudgetField';
import styles from './Panes.module.css';

function isManagedProfileIsolationError(message: string | null): boolean {
  return message?.startsWith('[PROFILE_ISOLATION] ') === true || message === 'PROFILE_ISOLATION';
}

const RuntimePane: React.FC = () => {
  const { t } = useTranslation();
  const {
    getEffectiveRuntime,
    setRawEngineMode,
    getOutputBudget,
    setOutputBudget: persistOutputBudget,
    openEffectiveRuntimeFolder,
  } = useWcoreConfig();
  const [rawEngine, setRawEngine] = useState<boolean | null>(null);
  const [outputBudget, setOutputBudget] = useState<OutputBudget | null>(null);
  const [outputBudgetLoading, setOutputBudgetLoading] = useState(true);
  const [outputBudgetSaving, setOutputBudgetSaving] = useState(false);
  const [effectiveRuntime, setEffectiveRuntime] = useState<IWcoreEffectiveRuntime | null>(null);
  const [runtimeTruthLoading, setRuntimeTruthLoading] = useState(true);
  const [runtimeTruthError, setRuntimeTruthError] = useState<string | null>(null);
  const [settingsReadError, setSettingsReadError] = useState<string | null>(null);
  const [runtimeActionError, setRuntimeActionError] = useState<string | null>(null);
  const [rawModeSaving, setRawModeSaving] = useState(false);
  const [openingTargets, setOpeningTargets] = useState<Record<IWcoreRuntimeFolderTarget, number>>({
    'core-config': 0,
    'desktop-config': 0,
  });
  const mounted = useRef(false);
  const runtimeRequestId = useRef(0);
  const rawModeWriteVersion = useRef(0);
  const outputBudgetWriteVersion = useRef(0);

  const refreshEffectiveRuntime = useCallback(async (): Promise<void> => {
    const requestId = ++runtimeRequestId.current;
    setRuntimeTruthLoading(true);
    try {
      const runtime = await getEffectiveRuntime();
      if (runtimeRequestId.current === requestId) {
        setEffectiveRuntime(runtime);
        setRawEngine(runtime.mode === 'raw-engine');
        setRuntimeTruthError(null);
      }
    } catch (error) {
      if (runtimeRequestId.current === requestId) {
        const message = error instanceof Error ? error.message : String(error);
        setEffectiveRuntime(null);
        // A managed profile isolation failure proves raw mode is currently off:
        // raw resolution never consults the profile. Keep the recovery switch
        // operable so the corrupt profile cannot trap the user in this pane.
        setRawEngine(isManagedProfileIsolationError(message) ? false : null);
        setRuntimeTruthError(message);
      }
    } finally {
      if (runtimeRequestId.current === requestId) setRuntimeTruthLoading(false);
    }
  }, [getEffectiveRuntime]);

  useEffect(() => {
    let cancelled = false;
    mounted.current = true;
    const reportReadFailure = (label: string, error: unknown): void => {
      if (!cancelled) {
        const detail = error instanceof Error ? error.message : String(error);
        setSettingsReadError(`${label}: ${detail}`);
      }
    };
    void getOutputBudget()
      .then((v) => {
        if (!cancelled) {
          setOutputBudget(v?.mode === 'fixed' ? { mode: 'fixed', value: v.value } : { mode: 'auto' });
          setSettingsReadError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setOutputBudget(null);
        reportReadFailure('Output budget could not be read', error);
      })
      .finally(() => {
        if (!cancelled) setOutputBudgetLoading(false);
      });
    void refreshEffectiveRuntime();
    const refreshOnFocus = (): void => {
      void refreshEffectiveRuntime();
    };
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      cancelled = true;
      mounted.current = false;
      runtimeRequestId.current += 1;
      rawModeWriteVersion.current += 1;
      outputBudgetWriteVersion.current += 1;
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [getOutputBudget, refreshEffectiveRuntime]);

  const onOutputBudgetChange = useCallback(
    (next: OutputBudget): void => {
      if (!outputBudget || outputBudgetSaving) return;
      const version = ++outputBudgetWriteVersion.current;
      setOutputBudgetSaving(true);
      setRuntimeActionError(null);
      void persistOutputBudget(next)
        .then(async (result) => {
          if (!mounted.current || version !== outputBudgetWriteVersion.current) return;
          let authoritative: OutputBudget | null = null;
          try {
            authoritative = (await getOutputBudget()) ?? { mode: 'auto' };
          } catch (readError) {
            setSettingsReadError(
              `Output budget could not be re-read: ${readError instanceof Error ? readError.message : String(readError)}`
            );
          }
          if (mounted.current && version === outputBudgetWriteVersion.current) {
            setOutputBudget(authoritative);
            if (!result.ok) setRuntimeActionError(result.error ?? 'Output budget could not be saved.');
          }
        })
        .catch(async (error: unknown) => {
          if (!mounted.current || version !== outputBudgetWriteVersion.current) return;
          let authoritative: OutputBudget | null = null;
          try {
            authoritative = (await getOutputBudget()) ?? { mode: 'auto' };
          } catch {
            // Null explicitly represents unknown when the authority cannot be read.
          }
          if (mounted.current && version === outputBudgetWriteVersion.current) {
            setOutputBudget(authoritative);
            setRuntimeActionError(error instanceof Error ? error.message : String(error));
          }
        })
        .finally(() => {
          if (mounted.current && version === outputBudgetWriteVersion.current) setOutputBudgetSaving(false);
        });
    },
    [getOutputBudget, outputBudget, persistOutputBudget]
  );

  const toggleRawEngine = useCallback(
    (next: boolean): void => {
      const profileRecovery = rawEngine === false && isManagedProfileIsolationError(runtimeTruthError);
      if (rawEngine === null || runtimeTruthLoading || (runtimeTruthError && !profileRecovery) || rawModeSaving) return;
      const version = ++rawModeWriteVersion.current;
      setRawModeSaving(true);
      setRuntimeActionError(null);
      void setRawEngineMode(next)
        .then(async (result) => {
          if (!mounted.current || version !== rawModeWriteVersion.current) return;
          if (!result.ok) {
            setRuntimeActionError(result.error ?? 'Raw engine mode could not be saved.');
            await refreshEffectiveRuntime();
            return;
          }
          await refreshEffectiveRuntime();
        })
        .catch((error: unknown) => {
          if (!mounted.current || version !== rawModeWriteVersion.current) return;
          setRuntimeActionError(error instanceof Error ? error.message : String(error));
          void refreshEffectiveRuntime();
        })
        .finally(() => {
          if (mounted.current && version === rawModeWriteVersion.current) setRawModeSaving(false);
        });
    },
    [rawEngine, rawModeSaving, refreshEffectiveRuntime, runtimeTruthError, runtimeTruthLoading, setRawEngineMode]
  );

  const rawProfileRecoveryAvailable = rawEngine === false && isManagedProfileIsolationError(runtimeTruthError);

  const openRuntimePath = useCallback(
    (target: IWcoreRuntimeFolderTarget): void => {
      setOpeningTargets((current) => ({ ...current, [target]: current[target] + 1 }));
      setRuntimeActionError(null);
      void openEffectiveRuntimeFolder(target)
        .then((result) => {
          if (mounted.current && !result.ok) {
            setRuntimeActionError(result.error ?? 'The folder could not be opened.');
          }
        })
        .catch((error: unknown) => {
          if (mounted.current) setRuntimeActionError(error instanceof Error ? error.message : String(error));
        })
        .finally(() => {
          if (mounted.current) {
            setOpeningTargets((current) => ({ ...current, [target]: Math.max(0, current[target] - 1) }));
          }
        });
    },
    [openEffectiveRuntimeFolder]
  );

  return (
    <div className={styles.pane}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>Wayland Core</div>
        <h1 className={styles.title}>{t('settings.wcoreConfig.rail.runtime', { defaultValue: 'Runtime' })}</h1>
        <p className={styles.sub}>
          {t('settings.wcoreConfig.runtime.subtitle', {
            defaultValue:
              'Where the engine actually runs. Desktop currently launches its bundled Core locally; remote and headless runtime selection is not yet available.',
          })}
        </p>
        <ScopeLabel />
      </div>

      <div className={styles.section}>
        <div className={styles.group}>
          <div className={styles.listRow}>
            <div>
              <div className={styles.lrLabel}>
                {t('settings.wcoreConfig.runtime.runtimeTopology', { defaultValue: 'Runtime topology' })}
              </div>
              <div className={styles.lrDesc}>
                {t('settings.wcoreConfig.runtime.runtimeTopologyDesc', {
                  defaultValue: 'Desktop launches the bundled Core process locally for each active chat.',
                })}
              </div>
            </div>
            <div className={styles.lrControl}>
              <span className={`${styles.badge} ${styles.ok}`}>
                <span className={styles.bd} />
                {t('settings.wcoreConfig.runtime.embeddedLocal', { defaultValue: 'Embedded local' })}
              </span>
            </div>
          </div>

          <div className={styles.listRow}>
            <div>
              <div className={`${styles.lrLabel} ${styles.lrLabelMono}`}>
                {t('settings.wcoreConfig.runtime.runtimeStatus', { defaultValue: 'Runtime status' })}
              </div>
              <div className={styles.lrDesc}>
                {t('settings.wcoreConfig.runtime.runtimeStatusDesc', {
                  defaultValue: 'This settings pane does not probe a live chat process.',
                })}
              </div>
            </div>
            <div className={styles.lrControl}>
              <span className={`${styles.badge} ${styles.notset}`}>
                <span className={styles.bd} />
                {t('settings.wcoreConfig.runtime.notObserved', { defaultValue: 'Not observed' })}
              </span>
            </div>
          </div>

          <div className={styles.listRow}>
            <div>
              <div className={styles.lrLabel}>
                {t('settings.wcoreConfig.runtime.concurrency', { defaultValue: 'Concurrency' })}
              </div>
              <div className={styles.lrDesc}>
                {t('settings.wcoreConfig.runtime.concurrencyDesc', {
                  defaultValue: 'Core owns execution concurrency; Desktop does not override it.',
                })}
              </div>
            </div>
            <div className={styles.lrControl}>
              <span className={`${styles.badge} ${styles.notset}`}>
                <span className={styles.bd} />
                {t('settings.wcoreConfig.runtime.coreControlled', { defaultValue: 'Core controlled' })}
              </span>
            </div>
          </div>

          {/* #468: Output budget (Auto = engine sizes per-model; Fixed = explicit --max-tokens) */}
          {outputBudgetLoading ? (
            <div className={styles.runtimeTruthLoading} role='status'>
              {t('settings.wcoreConfig.runtime.outputBudgetLoading', { defaultValue: 'Reading output budget…' })}
            </div>
          ) : outputBudget ? (
            outputBudgetSaving ? (
              <div className={styles.runtimeTruthLoading} role='status'>
                {t('settings.wcoreConfig.runtime.outputBudgetSaving', { defaultValue: 'Saving output budget…' })}
              </div>
            ) : (
              <OutputBudgetField value={outputBudget} onChange={onOutputBudgetChange} />
            )
          ) : (
            <div className={styles.runtimeTruthError} role='alert'>
              {t('settings.wcoreConfig.runtime.outputBudgetUnknown', {
                defaultValue: 'Output budget is unknown. Editing is disabled until it can be read.',
              })}
            </div>
          )}
        </div>
      </div>

      <div className={styles.section} data-testid='effective-core-runtime'>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>
            {t('settings.wcoreConfig.runtime.effectiveConfig', { defaultValue: 'Current launch configuration' })}
          </span>
          <span className={styles.sectionHeadLine} />
          <Button
            type='text'
            size='mini'
            className={styles.runtimeRefreshAction}
            aria-label={t('settings.wcoreConfig.runtime.refreshConfig', {
              defaultValue: 'Refresh effective Core configuration',
            })}
            disabled={runtimeTruthLoading}
            onClick={() => void refreshEffectiveRuntime()}
          >
            {t('settings.wcoreConfig.runtime.refresh', { defaultValue: 'Refresh' })}
          </Button>
        </div>

        {runtimeTruthLoading ? (
          <div className={styles.runtimeTruthLoading} role='status'>
            {t('settings.wcoreConfig.runtime.effectiveConfigLoading', {
              defaultValue: 'Checking effective Core configuration…',
            })}
          </div>
        ) : runtimeTruthError ? (
          <div className={styles.runtimeTruthError} role='alert'>
            {t('settings.wcoreConfig.runtime.effectiveConfigError', {
              defaultValue:
                'Wayland could not prove which Core config is currently selected. Launch remains fail-closed for an invalid named profile.',
            })}
            <span className={styles.runtimeErrorDetail}> {runtimeTruthError}</span>
          </div>
        ) : effectiveRuntime ? (
          <div className={styles.runtimeTruthCard}>
            <div className={styles.runtimeTruthHead}>
              <div>
                <div className={styles.runtimeTruthTitle}>
                  {effectiveRuntime.mode === 'raw-engine'
                    ? t('settings.wcoreConfig.runtime.rawConfigTitle', { defaultValue: 'Standalone Core config' })
                    : t('settings.wcoreConfig.runtime.managedConfigTitle', {
                        defaultValue: 'Desktop-managed Core config',
                      })}
                </div>
                <div className={styles.runtimeTruthDescription}>
                  {effectiveRuntime.mode === 'raw-engine'
                    ? t('settings.wcoreConfig.runtime.rawConfigDescription', {
                        defaultValue:
                          'Core selects its own config, model, prompt, and MCP servers. Wayland host integration, permissions, team bridge, and allowlisted tool credentials remain active.',
                      })
                    : effectiveRuntime.desktopPromptOverlayApplied
                      ? t('settings.wcoreConfig.runtime.managedConfigDescriptionWithOverlay', {
                          defaultValue:
                            'Wayland applies this Desktop profile, model, prompt overlay, and selected connectors while keeping host integration active.',
                        })
                      : t('settings.wcoreConfig.runtime.managedConfigDescriptionWithoutOverlay', {
                          defaultValue:
                            'Wayland applies this Desktop profile, model, and selected connectors while keeping host integration active. A prompt overlay is added only when the conversation supplies one; this settings snapshot does not claim one.',
                        })}
                </div>
              </div>
              <span className={`${styles.badge} ${effectiveRuntime.mode === 'raw-engine' ? styles.notset : styles.ok}`}>
                <span className={styles.bd} />
                {effectiveRuntime.mode === 'raw-engine'
                  ? t('settings.wcoreConfig.runtime.rawBadge', { defaultValue: 'Raw' })
                  : t('settings.wcoreConfig.runtime.managedBadge', { defaultValue: 'Managed' })}
              </span>
            </div>

            <div className={styles.runtimePathRow}>
              <div>
                <div className={styles.runtimePathLabel}>
                  {t('settings.wcoreConfig.runtime.coreReads', { defaultValue: 'Core reads' })}
                  {effectiveRuntime.profile ? ` · ${effectiveRuntime.profile}` : ''}
                </div>
                <div className={styles.runtimePathValue}>{effectiveRuntime.engineConfigPath}</div>
              </div>
              <Button
                type='text'
                size='mini'
                className={styles.runtimePathAction}
                aria-label={t('settings.wcoreConfig.runtime.openCoreFolder', {
                  defaultValue: 'Open Core config folder',
                })}
                disabled={openingTargets['core-config'] > 0}
                onClick={() => openRuntimePath('core-config')}
              >
                {t('settings.wcoreConfig.runtime.openFolder', { defaultValue: 'Open folder' })}
              </Button>
            </div>

            <div className={styles.runtimePathRow}>
              <div>
                <div className={styles.runtimePathLabel}>
                  {t('settings.wcoreConfig.runtime.desktopStores', { defaultValue: 'Desktop settings store' })}
                </div>
                <div className={styles.runtimePathValue}>{effectiveRuntime.desktopConfigPath}</div>
              </div>
              <Button
                type='text'
                size='mini'
                className={styles.runtimePathAction}
                aria-label={t('settings.wcoreConfig.runtime.openDesktopFolder', {
                  defaultValue: 'Open Desktop settings folder',
                })}
                disabled={openingTargets['desktop-config'] > 0}
                onClick={() => openRuntimePath('desktop-config')}
              >
                {t('settings.wcoreConfig.runtime.openFolder', { defaultValue: 'Open folder' })}
              </Button>
            </div>

            <div className={styles.runtimeTruthNote}>
              {t('settings.wcoreConfig.runtime.twoConfigExplanation', {
                defaultValue:
                  'These files serve different purposes. Core runtime and sandbox policy come from config.toml above; Desktop chat, connector, and UI preferences live in wayland-config.txt.',
              })}
            </div>
          </div>
        ) : null}
        {runtimeActionError ? (
          <div className={styles.runtimeTruthError} role='alert'>
            {t('settings.wcoreConfig.runtime.actionError', {
              defaultValue: 'The runtime action did not complete:',
            })}{' '}
            <span className={styles.runtimeErrorDetail}>{runtimeActionError}</span>
          </div>
        ) : null}
        {settingsReadError ? (
          <div className={styles.runtimeTruthError} role='alert'>
            {t('settings.wcoreConfig.runtime.settingsReadError', {
              defaultValue: 'Some runtime settings could not be read:',
            })}{' '}
            <span className={styles.runtimeErrorDetail}>{settingsReadError}</span>
          </div>
        ) : null}
      </div>

      {/* Refinement C: raw-engine-mode power-user toggle */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>
            {t('settings.wcoreConfig.runtime.powerUser', { defaultValue: 'Power User' })}
          </span>
          <span className={styles.sectionHeadLine} />
        </div>
        <div className={styles.group}>
          <div className={styles.listRow}>
            <div>
              <div className={styles.lrLabel}>
                {t('settings.wcoreConfig.runtime.rawEngine', { defaultValue: 'Raw engine mode' })}
              </div>
              <div className={styles.lrDesc}>
                {t('settings.wcoreConfig.runtime.rawEngineDesc', {
                  defaultValue:
                    'Let Core choose its config, model, prompt, and MCP servers. Wayland still provides its private protocol, permissions, team bridge, and allowlisted host integration.',
                })}
              </div>
            </div>
            <div className={styles.lrControl}>
              {rawEngine === null || runtimeTruthLoading || (runtimeTruthError && !rawProfileRecoveryAvailable) ? (
                <span className={`${styles.badge} ${styles.notset}`} role='status'>
                  <span className={styles.bd} />
                  {t('settings.wcoreConfig.runtime.unknown', { defaultValue: 'Unknown' })}
                </span>
              ) : (
                <WcSwitch
                  checked={rawEngine}
                  onChange={toggleRawEngine}
                  label={t('settings.wcoreConfig.runtime.rawEngine', { defaultValue: 'Raw engine mode' })}
                  disabled={rawModeSaving}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.infonote}>
        <div className={styles.inTitle}>
          {t('settings.wcoreConfig.runtime.headlessTitle', { defaultValue: 'Remote and headless runtimes' })}
        </div>
        <div className={styles.inBody}>
          {t('settings.wcoreConfig.runtime.headlessBody', {
            defaultValue:
              'Not available in Desktop yet. These options will appear only after a supported launch, health, and authority contract exists.',
          })}
        </div>
      </div>
    </div>
  );
};

export default RuntimePane;
