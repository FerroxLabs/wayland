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
import type { IWcoreBrowserPolicyProjection } from '@/common/adapter/ipcBridge';
import styles from './Panes.module.css';

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
  const { getBrowserPolicy } = useWcoreConfig();
  const [projection, setProjection] = useState<IWcoreBrowserPolicyProjection | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPolicy = async () => {
    setError(null);
    try {
      setProjection(await getBrowserPolicy());
    } catch (loadError) {
      setProjection(null);
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    }
  };

  useEffect(() => {
    void loadPolicy();
    // getBrowserPolicy is a stable useCallback authority seam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getBrowserPolicy]);

  return (
    <div className={styles.pane}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>
          {t('settings.wcoreConfig.security.engineName', { defaultValue: 'Wayland Core' })}
        </div>
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
            {projection ? (
              <div className={styles.group} data-testid='browser-policy-truth'>
                <div className={styles.listRow}>
                  <div>
                    <div className={styles.lrLabel}>
                      {t('settings.wcoreConfig.security.requestedPolicy', { defaultValue: 'Requested policy' })}
                    </div>
                    <div className={styles.lrDesc}>
                      {projection.requested
                        ? t('settings.wcoreConfig.security.requestedPolicyValue', {
                            defaultValue: '{{action}} · {{allowed}} allowed · {{denied}} denied',
                            action: projection.requested.policy.defaultAction,
                            allowed: projection.requested.policy.allowedOrigins.length,
                            denied: projection.requested.policy.deniedOrigins.length,
                          })
                        : t('settings.wcoreConfig.security.requestedPolicyAbsent', {
                            defaultValue: 'No Browser policy is configured in the selected Core config.',
                          })}
                    </div>
                    {projection.requested ? (
                      <>
                        <div className={styles.lrDesc}>
                          {t('settings.wcoreConfig.security.requestedPolicySource', {
                            defaultValue: '{{mode}} · profile {{profile}}',
                            mode: t(
                              projection.requested.mode === 'raw-engine'
                                ? 'settings.wcoreConfig.security.modeRawEngine'
                                : 'settings.wcoreConfig.security.modeDesktopManaged',
                              {
                                defaultValue:
                                  projection.requested.mode === 'raw-engine' ? 'Raw engine' : 'Desktop managed',
                              }
                            ),
                            profile:
                              projection.requested.profile ??
                              t('settings.wcoreConfig.security.profileNone', { defaultValue: 'none' }),
                          })}
                        </div>
                        <div className={styles.lrDesc}>
                          {t('settings.wcoreConfig.security.engineConfigSource', {
                            defaultValue: 'Core config: {{path}}',
                            path: projection.requested.engineConfigPath,
                          })}
                        </div>
                        <div className={styles.lrDesc}>
                          {t('settings.wcoreConfig.security.desktopConfigSource', {
                            defaultValue: 'Desktop config: {{path}}',
                            path: projection.requested.desktopConfigPath,
                          })}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className={styles.listRow}>
                  <div>
                    <div className={styles.lrLabel}>
                      {t('settings.wcoreConfig.security.effectivePolicy', { defaultValue: 'Effective policy' })}
                    </div>
                    <div className={styles.lrDesc}>
                      {t('settings.wcoreConfig.security.effectivePolicyUnavailable', {
                        defaultValue:
                          'Unavailable: Core v0.12.25 does not provide session-correlated enforcement evidence to Desktop.',
                      })}
                    </div>
                  </div>
                </div>
                <div className={styles.listRow}>
                  <div>
                    <div className={styles.lrLabel}>
                      {t('settings.wcoreConfig.security.restartStatus', { defaultValue: 'Restart status' })}
                    </div>
                    <div className={styles.lrDesc}>
                      {t('settings.wcoreConfig.security.restartStatusUnknown', {
                        defaultValue:
                          'Unknown: a saved request is not proof that the current Core session loaded or enforced it.',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : !error ? (
              <div className={styles.lrDesc}>
                {t('settings.wcoreConfig.security.readingPolicy', { defaultValue: 'Reading Browser policy…' })}
              </div>
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
