/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Slider } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { ConfigStorage } from '@/common/config/storage';
import { useWcoreConfig } from '@renderer/hooks/useWcoreConfig';
import WcSwitch from '../components/WcSwitch';
import WcSegmented from '../components/WcSegmented';
import ScopeLabel from '../components/ScopeLabel';
import OutputBudgetField, { type OutputBudget } from '../components/OutputBudgetField';
import styles from './Panes.module.css';

const MODE_VALUES = ['local', 'remote', 'headless'] as const;
type RuntimeMode = (typeof MODE_VALUES)[number];

type RuntimeSection = {
  mode?: string;
  concurrency?: number;
  [key: string]: unknown;
};

const RuntimePane: React.FC = () => {
  const { t } = useTranslation();
  const { getSection, setSection } = useWcoreConfig();
  const [section, setLocal] = useState<RuntimeSection | null>(null);
  const [rawEngine, setRawEngine] = useState(false);
  const [outputBudget, setOutputBudget] = useState<OutputBudget>({ mode: 'auto' });

  useEffect(() => {
    let cancelled = false;
    void getSection<RuntimeSection>('runtime').then((s) => {
      if (!cancelled) setLocal(s ?? {});
    });
    void ConfigStorage.get('wcore.rawEngineMode').then((v) => {
      if (!cancelled) setRawEngine(v === true);
    });
    void ConfigStorage.get('wcore.outputBudget').then((v) => {
      if (!cancelled && v?.mode === 'fixed') setOutputBudget({ mode: 'fixed', value: v.value });
    });
    return () => {
      cancelled = true;
    };
  }, [getSection]);

  const persist = useCallback(
    (next: RuntimeSection): void => {
      setLocal(next);
      void setSection('runtime', next);
    },
    [setSection]
  );

  const mode: RuntimeMode = useMemo(() => {
    const m = section?.mode;
    return (MODE_VALUES as readonly string[]).includes(m ?? '') ? (m as RuntimeMode) : 'local';
  }, [section]);
  const concurrency = typeof section?.concurrency === 'number' ? section.concurrency : 6;

  const modeOptions = useMemo(
    () => [
      { value: 'local', label: t('settings.wcoreConfig.runtime.modeLocal', { defaultValue: 'Local' }) },
      { value: 'remote', label: t('settings.wcoreConfig.runtime.modeRemote', { defaultValue: 'Remote' }) },
      {
        value: 'headless',
        label: t('settings.wcoreConfig.runtime.modeHeadless', { defaultValue: 'Headless server' }),
      },
    ],
    [t]
  );

  const onOutputBudgetChange = useCallback((next: OutputBudget): void => {
    setOutputBudget(next);
    // Persist the preference only; the spawn seam (WCoreManager) reads it to set
    // or omit `--max-tokens` per turn (#468). Mirrors rawEngineMode.
    void ConfigStorage.set('wcore.outputBudget', next);
  }, []);

  const toggleRawEngine = useCallback((next: boolean): void => {
    setRawEngine(next);
    // Refinement C: persist the preference only. The spawn seam (WCoreManager)
    // reads it to skip Desktop's model/skills/overlay injection. See the
    // TODO(orchestrator) marker there.
    void ConfigStorage.set('wcore.rawEngineMode', next);
  }, []);

  return (
    <div className={styles.pane}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>Wayland Core</div>
        <h1 className={styles.title}>{t('settings.wcoreConfig.rail.runtime', { defaultValue: 'Runtime' })}</h1>
        <p className={styles.sub}>
          {t('settings.wcoreConfig.runtime.subtitle', {
            defaultValue:
              'Where the engine actually runs. Embedded locally by default; switch to a remote box or a hosted headless server when you need to.',
          })}
        </p>
        <ScopeLabel />
      </div>

      <div className={styles.section}>
        <div className={styles.group}>
          <div className={styles.listRow}>
            <div>
              <div className={styles.lrLabel}>
                {t('settings.wcoreConfig.runtime.runtimeMode', { defaultValue: 'Runtime mode' })}
              </div>
              <div className={styles.lrDesc}>
                {t('settings.wcoreConfig.runtime.runtimeModeDesc', {
                  defaultValue: 'Currently: embedded local engine',
                })}
              </div>
            </div>
            <div className={styles.lrControl}>
              <WcSegmented
                options={modeOptions}
                value={mode}
                onChange={(v) => persist({ ...section, mode: v })}
                label={t('settings.wcoreConfig.runtime.runtimeMode', { defaultValue: 'Runtime mode' })}
              />
            </div>
          </div>

          <div className={styles.listRow}>
            <div>
              <div className={`${styles.lrLabel} ${styles.lrLabelMono}`}>
                {t('settings.wcoreConfig.runtime.endpoint', { defaultValue: 'wcore endpoint' })}
              </div>
              <div className={styles.lrDesc}>
                {t('settings.wcoreConfig.runtime.endpointDesc', { defaultValue: 'Embedded · spawned in-process' })}
              </div>
            </div>
            <div className={styles.lrControl}>
              <span className={`${styles.badge} ${styles.connected}`}>
                <span className={styles.bd} />
                {t('settings.wcoreConfig.runtime.running', { defaultValue: 'Running' })}
              </span>
            </div>
          </div>

          <div className={styles.listRow}>
            <div>
              <div className={styles.lrLabel}>
                {t('settings.wcoreConfig.runtime.concurrency', { defaultValue: 'Concurrency' })}
              </div>
              <div className={styles.lrDesc}>
                {t('settings.wcoreConfig.runtime.concurrencyDesc', { defaultValue: 'Max parallel sub-agents' })}
              </div>
            </div>
            <div className={styles.lrControl}>
              <div className={styles.sliderWrap}>
                <Slider
                  min={1}
                  max={12}
                  step={1}
                  value={concurrency}
                  style={{ flex: 1, minWidth: 180 }}
                  onChange={(v) => persist({ ...section, concurrency: Number(v) })}
                />
                <span className={styles.sliderVal}>
                  {t('settings.wcoreConfig.runtime.agentsVal', {
                    defaultValue: '{{count}} agents',
                    count: concurrency,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* #468: Output budget (Auto = engine sizes per-model; Fixed = explicit --max-tokens) */}
          <OutputBudgetField value={outputBudget} onChange={onOutputBudgetChange} />
        </div>
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
                    'Run the embedded engine on its own config, without overriding with Desktop’s model & skills.',
                })}
              </div>
            </div>
            <div className={styles.lrControl}>
              <WcSwitch
                checked={rawEngine}
                onChange={toggleRawEngine}
                label={t('settings.wcoreConfig.runtime.rawEngine', { defaultValue: 'Raw engine mode' })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.infonote}>
        <div className={styles.inTitle}>
          {t('settings.wcoreConfig.runtime.headlessTitle', { defaultValue: 'Headless server mode' })}
        </div>
        <div className={styles.inBody}>
          {t('settings.wcoreConfig.runtime.headlessBody', {
            defaultValue:
              'Run Wayland Core as a long-lived server (one container per tenant) and reach it over LAN, Tailscale, or the hosted Pro tier.',
          })}
        </div>
      </div>
    </div>
  );
};

export default RuntimePane;
