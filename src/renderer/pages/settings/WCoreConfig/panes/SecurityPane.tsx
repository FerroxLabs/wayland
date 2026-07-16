/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ScopeLabel from '../components/ScopeLabel';
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
