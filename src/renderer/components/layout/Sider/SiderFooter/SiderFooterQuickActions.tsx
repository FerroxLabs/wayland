/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Three icon-only quick actions docked into the sidebar footer below Settings:
 * ★ Feedback · 🌐 WebUI (live status) · ⬡ GitHub repo. Lifted from
 * `pages/guid/components/QuickActionButtons.tsx` per SPEC §3.4 (v0.6.2 W2c).
 * Preserves the alive-flag + unsubscribe cleanup pattern that prevented the
 * v0.6.1 cross-mount race; without that pattern a route change while WebUI was
 * still loading status would setState on an unmounted component.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bug, Globe, Star } from 'lucide-react';
import { Tooltip } from '@arco-design/web-react';
import { webui } from '@/common/adapter/ipcBridge';
import { openExternalUrl } from '@/renderer/utils/platform';
import classNames from 'classnames';
import styles from './SiderFooterQuickActions.module.css';

type WebuiQuickStatus = 'checking' | 'running' | 'stopped' | 'error';

const GITHUB_REPO_URL = 'https://github.com/FerroxLabs/wayland';
// The issue-template chooser (bug / feature / question), so feedback lands as a
// templated GitHub issue. All Wayland support routes through GitHub, never email.
const GITHUB_ISSUES_URL = 'https://github.com/FerroxLabs/wayland/issues/new/choose';

export interface SiderFooterQuickActionsProps {
  /** Optional bug-report opener. If omitted, the button opens the GitHub issue chooser. */
  onOpenBugReport?: () => void;
  /** Optional external-link opener. Defaults to window.open. */
  onOpenLink?: (url: string) => void;
  collapsed?: boolean;
}

export const SiderFooterQuickActions: React.FC<SiderFooterQuickActionsProps> = ({
  onOpenBugReport,
  onOpenLink,
  collapsed = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [webuiStatus, setWebuiStatus] = useState<WebuiQuickStatus>('checking');

  useEffect(() => {
    let alive = true;

    const loadStatus = async () => {
      try {
        const result = await webui.getStatus.invoke();
        if (!alive) return;
        if (result?.success && result.data) {
          setWebuiStatus(result.data.running ? 'running' : 'stopped');
          return;
        }
        setWebuiStatus('error');
      } catch {
        if (!alive) return;
        setWebuiStatus('error');
      }
    };

    void loadStatus();
    const unsubscribe = webui.statusChanged.on((payload) => {
      if (!alive) return;
      setWebuiStatus(payload.running ? 'running' : 'stopped');
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const handleOpenWebUI = useCallback(() => {
    void navigate('/settings/webui');
  }, [navigate]);

  const handleOpenRepo = useCallback(() => {
    if (onOpenLink) {
      onOpenLink(GITHUB_REPO_URL);
      return;
    }
    void openExternalUrl(GITHUB_REPO_URL);
  }, [onOpenLink]);

  const handleOpenBug = useCallback(() => {
    if (onOpenBugReport) {
      onOpenBugReport();
      return;
    }
    // No host handler supplied: open the GitHub issue chooser, mirroring the
    // repo button's fallback. Without this the button was a silent no-op.
    void openExternalUrl(GITHUB_ISSUES_URL);
  }, [onOpenBugReport]);

  const webuiTitle = t('settings.webui', { defaultValue: 'WebUI' });
  const bugTitle = t('conversation.welcome.quickActionFeedback', { defaultValue: 'Send feedback' });
  const repoTitle = t('conversation.welcome.quickActionStar', { defaultValue: 'Star on GitHub' });

  return (
    <div className={classNames(styles.row, collapsed && styles.rowCollapsed)} data-testid='sider-footer-quick-actions'>
      <Tooltip position='top' content={bugTitle}>
        <button
          type='button'
          className={styles.btn}
          aria-label={bugTitle}
          title={bugTitle}
          onClick={handleOpenBug}
          data-testid='sider-footer-quick-bug'
        >
          <Bug size={16} />
        </button>
      </Tooltip>
      <Tooltip position='top' content={`${webuiTitle} · ${webuiStatus}`}>
        <button
          type='button'
          className={classNames(styles.btn, webuiStatus === 'running' && styles.btnRunning)}
          aria-label={`${webuiTitle} (${webuiStatus})`}
          title={`${webuiTitle} · ${webuiStatus}`}
          onClick={handleOpenWebUI}
          data-testid='sider-footer-quick-webui'
        >
          <Globe size={16} />
        </button>
      </Tooltip>
      <Tooltip position='top' content={repoTitle}>
        <button
          type='button'
          className={styles.btn}
          aria-label={repoTitle}
          title={repoTitle}
          onClick={handleOpenRepo}
          data-testid='sider-footer-quick-repo'
        >
          <Star size={16} />
        </button>
      </Tooltip>
    </div>
  );
};
