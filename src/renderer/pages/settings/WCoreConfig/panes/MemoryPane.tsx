/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWcoreConfig } from '@renderer/hooks/useWcoreConfig';
import WcSwitch from '../components/WcSwitch';
import ScopeLabel from '../components/ScopeLabel';
import MemoryEnableOffer from '@renderer/components/memory/MemoryEnableOffer';
import { markMemoryOfferAnswered } from '@renderer/utils/memory/memoryEnableOffer';
import styles from './Panes.module.css';

type MemorySection = {
  enabled: boolean;
};

const MemoryPane: React.FC = () => {
  const { t } = useTranslation();
  const { getSection, patchField } = useWcoreConfig();
  const [section, setSection] = useState<MemorySection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);
  const readVersion = useRef(0);
  const writeVersion = useRef(0);

  const refresh = useCallback(
    async (showLoading = true): Promise<void> => {
      const version = ++readVersion.current;
      if (showLoading) setLoading(true);
      try {
        const raw = await getSection<Record<string, unknown>>('memory');
        const enabled = raw?.enabled;
        if (enabled !== undefined && typeof enabled !== 'boolean')
          throw new Error('Core returned invalid memory.enabled.');
        if (mounted.current && readVersion.current === version) {
          setSection({ enabled: enabled !== false });
          setError(null);
        }
      } catch (readError) {
        if (mounted.current && readVersion.current === version) {
          setSection(null);
          setError(readError instanceof Error ? readError.message : String(readError));
        }
      } finally {
        if (mounted.current && readVersion.current === version) setLoading(false);
      }
    },
    [getSection]
  );

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => {
      mounted.current = false;
      readVersion.current += 1;
      writeVersion.current += 1;
    };
  }, [refresh]);

  const persist = useCallback(
    async (patch: Parameters<typeof patchField>[0]): Promise<void> => {
      if (!section || saving) return;
      const version = ++writeVersion.current;
      setSaving(true);
      setError(null);
      let failure: string | null = null;
      try {
        const result = await patchField(patch);
        if (!mounted.current || writeVersion.current !== version) return;
        if (!result.ok) failure = 'error' in result ? result.error : 'Memory setting could not be saved.';
      } catch (writeError) {
        failure = writeError instanceof Error ? writeError.message : String(writeError);
      }
      // Working the real toggle - in EITHER direction - answers the
      // "should we offer memory?" question by definition. Without this, a user
      // who deliberately switches memory OFF here would be met by an offer to
      // switch it back on, which is nagging someone out of a privacy decision.
      // Only on success: a failed write is not a choice.
      if (!failure && patch.section === 'memory' && patch.field === 'enabled') {
        await markMemoryOfferAnswered();
      }
      if (mounted.current && writeVersion.current === version) {
        await refresh(false);
        if (failure && mounted.current && writeVersion.current === version) setError(failure);
        if (mounted.current && writeVersion.current === version) setSaving(false);
      }
    },
    [patchField, refresh, saving, section]
  );

  const enabled = section?.enabled;

  return (
    <div className={styles.pane}>
      <MemoryEnableOffer source='settings' />
      <div className={styles.head}>
        <div className={styles.eyebrow}>Wayland Core</div>
        <h1 className={styles.title}>{t('settings.wcoreConfig.rail.memory', { defaultValue: 'Memory' })}</h1>
        <p className={styles.sub}>
          {t('settings.wcoreConfig.memory.subtitle', {
            defaultValue:
              'The engine remembers across sessions: facts, preferences, and project context that persist and compound. This control maps directly to the bundled Core memory schema.',
          })}
        </p>
        <ScopeLabel />
      </div>

      {loading ? (
        <div className={styles.runtimeTruthLoading} role='status'>
          {t('settings.wcoreConfig.memory.loading', { defaultValue: 'Reading authoritative memory settings…' })}
        </div>
      ) : error || !section || enabled === undefined ? (
        <div className={styles.runtimeTruthError} role='alert'>
          {t('settings.wcoreConfig.memory.readError', {
            defaultValue: 'Memory settings are unknown. Writes are disabled until Core can be read:',
          })}{' '}
          {error}
        </div>
      ) : (
        <div className={styles.section} aria-busy={saving}>
          <div className={styles.group}>
            <div className={styles.listRow}>
              <div>
                <div className={styles.lrLabel}>
                  {t('settings.wcoreConfig.memory.longTerm', { defaultValue: 'Long-term memory' })}
                </div>
                <div className={styles.lrDesc}>
                  {t('settings.wcoreConfig.memory.longTermDesc', {
                    defaultValue: 'Persist learnings between sessions',
                  })}
                </div>
              </div>
              <div className={styles.lrControl}>
                <WcSwitch
                  checked={enabled}
                  disabled={saving}
                  onChange={(next) => void persist({ section: 'memory', field: 'enabled', value: next })}
                  label={t('settings.wcoreConfig.memory.longTerm', { defaultValue: 'Long-term memory' })}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryPane;
