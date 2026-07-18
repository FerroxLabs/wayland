/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ScopeLabel from '../components/ScopeLabel';
import { useWcoreConfig } from '@renderer/hooks/useWcoreConfig';
import type { IWcoreBrowserPolicy } from '@/common/adapter/ipcBridge';
import styles from './Panes.module.css';

const parsePatterns = (value: string): string[] =>
  value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

/**
 * Core v0.12.25 does not accept the controls this pane previously wrote:
 *
 * - approval_mode belongs to [default], with a different value domain;
 * - env_passthrough belongs to [tools];
 * - block_private_urls does not exist;
 * - [security].enabled=false also requires launch-time risk acceptance and is
 *   independent from the Browser tool's hard private/loopback denial.
 *
 * A successful TOML write is not effective-policy evidence. Keep this pane
 * read-only until the versioned Desktop/Core settings contract can prove the
 * active engine consumed and enforced a supported value.
 */
const SecurityPane: React.FC = () => {
  const { t } = useTranslation();
  const { getBrowserPolicy, setBrowserPolicy } = useWcoreConfig();
  const [policy, setPolicy] = useState<IWcoreBrowserPolicy | null>(null);
  const [allowedText, setAllowedText] = useState('');
  const [deniedText, setDeniedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPolicy = async () => {
    setError(null);
    try {
      const current = await getBrowserPolicy();
      setPolicy(current);
      setAllowedText(current.allowedOrigins.join('\n'));
      setDeniedText(current.deniedOrigins.join('\n'));
    } catch (loadError) {
      setPolicy(null);
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    }
  };

  useEffect(() => {
    void loadPolicy();
    // getBrowserPolicy is a stable useCallback authority seam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getBrowserPolicy]);

  const savePolicy = async () => {
    if (!policy || saving) return;
    setSaving(true);
    setError(null);
    const next: IWcoreBrowserPolicy = {
      ...policy,
      allowedOrigins: parsePatterns(allowedText),
      deniedOrigins: parsePatterns(deniedText),
    };
    try {
      const result = await setBrowserPolicy(next);
      if (result.ok === false) throw new Error(result.error);
      await loadPolicy();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.pane}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>Wayland Core</div>
        <h1 className={styles.title}>
          {t('settings.wcoreConfig.rail.security', { defaultValue: 'Security & Permissions' })}
        </h1>
        <p className={styles.sub}>
          {t('settings.wcoreConfig.security.truthSubtitle', {
            defaultValue:
              'See what the bundled engine actually enforces. Unsupported controls stay unavailable instead of saving settings that Core ignores.',
          })}
        </p>
        <ScopeLabel />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>
            {t('settings.wcoreConfig.security.approvalsMode', { defaultValue: 'Approvals Mode' })}
          </span>
          <span className={styles.sectionHeadLine} />
        </div>
        <div className={styles.group}>
          <div className={styles.policyEditor}>
            <div className={styles.lrLabel}>
              {t('settings.wcoreConfig.security.browserPolicy', { defaultValue: 'Browser public-origin policy' })}
            </div>
            <div className={styles.lrDesc}>
              {t('settings.wcoreConfig.security.browserPolicyDesc', {
                defaultValue:
                  'Core hard-blocks loopback, private, link-local and metadata addresses. Denied origins always win. When Allowed origins is nonempty it becomes an exclusive allow-list, even if Unmatched origins says Allow.',
              })}
            </div>
            {policy ? (
              <>
                <label className={styles.policyField}>
                  <span>{t('settings.wcoreConfig.security.defaultAction', { defaultValue: 'Unmatched origins' })}</span>
                  <select
                    aria-label={t('settings.wcoreConfig.security.defaultAction', { defaultValue: 'Unmatched origins' })}
                    value={policy.defaultAction}
                    disabled={saving}
                    onChange={(event) =>
                      setPolicy({
                        ...policy,
                        defaultAction: event.target.value as IWcoreBrowserPolicy['defaultAction'],
                      })
                    }
                  >
                    <option value='deny'>Deny</option>
                    <option value='ask'>Ask</option>
                    <option value='allow'>Allow unmatched public origins</option>
                  </select>
                </label>
                <label className={styles.policyField}>
                  <span>{t('settings.wcoreConfig.security.allowedOrigins', { defaultValue: 'Allowed origins' })}</span>
                  <textarea
                    aria-label={t('settings.wcoreConfig.security.allowedOrigins', { defaultValue: 'Allowed origins' })}
                    value={allowedText}
                    disabled={saving}
                    rows={4}
                    placeholder={'example.com\n*.example.org\n1.1.1.1'}
                    onChange={(event) => setAllowedText(event.target.value)}
                  />
                </label>
                <label className={styles.policyField}>
                  <span>
                    {t('settings.wcoreConfig.security.deniedOrigins', { defaultValue: 'Always denied origins' })}
                  </span>
                  <textarea
                    aria-label={t('settings.wcoreConfig.security.deniedOrigins', {
                      defaultValue: 'Always denied origins',
                    })}
                    value={deniedText}
                    disabled={saving}
                    rows={3}
                    placeholder={'blocked.example.com'}
                    onChange={(event) => setDeniedText(event.target.value)}
                  />
                </label>
                <button className={styles.policySave} type='button' disabled={saving} onClick={() => void savePolicy()}>
                  {saving
                    ? t('settings.wcoreConfig.security.savingPolicy', { defaultValue: 'Saving…' })
                    : t('settings.wcoreConfig.security.savePolicy', { defaultValue: 'Save Browser policy' })}
                </button>
              </>
            ) : !error ? (
              <div className={styles.lrDesc}>Reading Browser policy…</div>
            ) : null}
            {error ? <div className={styles.runtimeTruthError}>{error}</div> : null}
          </div>
          <div className={styles.listRow}>
            <div>
              <div className={styles.lrLabel}>
                {t('settings.wcoreConfig.security.approvalsManagedInTools', {
                  defaultValue: 'Managed in Tools',
                })}
              </div>
              <div className={styles.lrDesc}>
                {t('settings.wcoreConfig.security.approvalsManagedInToolsDesc', {
                  defaultValue:
                    'Core reads the default approval policy from [default]. The working control is in the Tools section; this pane will not write a duplicate value to [security].',
                })}
              </div>
            </div>
            <ShieldCheck size={17} aria-hidden='true' />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>
            {t('settings.wcoreConfig.security.environment', { defaultValue: 'Environment Access' })}
          </span>
          <span className={styles.sectionHeadLine} />
        </div>
        <div className={styles.group}>
          <div className={styles.listRow}>
            <div>
              <div className={styles.lrLabel}>
                {t('settings.wcoreConfig.security.envUnavailable', {
                  defaultValue: 'Environment passthrough is unavailable here',
                })}
              </div>
              <div className={styles.lrDesc}>
                {t('settings.wcoreConfig.security.envUnavailableDesc', {
                  defaultValue:
                    'Core reads allowed variable names from [tools].env_passthrough. Wayland will not write the old [security] value because Core ignores it.',
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>
            {t('settings.wcoreConfig.security.networkPolicy', { defaultValue: 'Network Policy' })}
          </span>
          <span className={styles.sectionHeadLine} />
        </div>
        <div className={styles.group}>
          <div className={styles.listRow}>
            <div>
              <div className={styles.lrLabel}>
                {t('settings.wcoreConfig.security.egressEnforced', {
                  defaultValue: 'Core egress protection remains enabled',
                })}
              </div>
              <div className={styles.lrDesc}>
                {t('settings.wcoreConfig.security.egressEnforcedDesc', {
                  defaultValue:
                    'This build does not offer an off switch: Core requires separate launch-time risk acceptance, and a saved value alone would not prove the firewall changed.',
                })}
              </div>
            </div>
            <ShieldCheck size={17} aria-hidden='true' />
          </div>
          <div className={styles.listRow}>
            <div>
              <div className={styles.lrLabel}>
                {t('settings.wcoreConfig.security.localTargetsBlocked', {
                  defaultValue: 'Private and local Browser targets are blocked',
                })}
              </div>
              <div className={styles.lrDesc}>
                {t('settings.wcoreConfig.security.localTargetsBlockedDesc', {
                  defaultValue:
                    'Bundled Core v0.12.25 has no safe Project-scoped localhost exception. General egress settings do not override the Browser tool’s private-network policy.',
                })}
              </div>
            </div>
          </div>
        </div>
        <div className={styles.dangerNote}>
          <AlertTriangle size={14} aria-hidden='true' />
          <span>
            {t('settings.wcoreConfig.security.noLocalBypass', {
              defaultValue:
                'There is currently no supported Wayland setting that allows localhost Browser access. Changing Raw Engine Mode or editing the old block_private_urls key will not fix it.',
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SecurityPane;
