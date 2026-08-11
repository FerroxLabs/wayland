/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * "Available to install" — the third band of the Agents page, below "More
 * detected" (decision D3, which keeps the shipped page order intact).
 *
 * Every other surface in the product renders agents the user already has. This
 * band is the only place that renders one they do not, so it carries the whole
 * install story: what it would fetch, where it would go, what it costs, and —
 * on a card for an agent the user already has their own copy of — why Wayland
 * is deliberately not offering to touch it (D1).
 *
 * The card is the same compact tile as "More detected", not a new object: an
 * `absent` card is that tile with a dashed border, a dimmed mark, and an
 * Install button where the toolbar toggle sits. The Flux chip renders BEFORE
 * install, on the `absent` card, because the reason to install has to be
 * visible at the moment of deciding — not revealed afterwards as a surprise.
 */

import React from 'react';
import { Avatar, Button, Modal, Tooltip, Typography } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { ipcBridge } from '@/common';
import type { AgentInstallerReport } from '@/common/types/agentInstaller';
import { resolveAgentLogo } from '@renderer/utils/model/agentLogo';
import FluxCompatChip from './FluxCompatChip';
import { buildInstallableAgents, type InstallableAgent } from './installableAgents';
import { useAgentInstaller, type InstallConsent } from './useAgentInstaller';
import styles from './AgentsSettings.module.css';

/** One fact row of the consent sheet (D2: four facts, each named). */
const ConsentFact: React.FC<{ label: string; value: string; testId: string }> = ({ label, value, testId }) => (
  <div className={styles.consentFactRow}>
    <span className={styles.consentFactLabel}>{label}</span>
    <span className={styles.consentFactValue} data-testid={testId}>
      {value}
    </span>
  </div>
);

/**
 * The consent sheet. One plain sentence stating that this runs code, then the
 * four facts (package, pinned version, destination, install scripts blocked).
 * A bare "Install / Cancel" would hide all four.
 */
const InstallConsentSheet: React.FC<{
  consent: InstallConsent | null;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ consent, onCancel, onConfirm }) => {
  const { t } = useTranslation();
  return (
    <Modal
      visible={consent !== null}
      title={consent ? t('settings.agentsPage.install.consent.title', { agent: consent.name }) : ''}
      onCancel={onCancel}
      autoFocus={false}
      focusLock
      unmountOnExit
      footer={
        <>
          <Button onClick={onCancel} data-testid='install-consent-cancel'>
            {t('settings.agentsPage.install.consent.cancel')}
          </Button>
          <Button type='primary' onClick={onConfirm} data-testid='install-consent-confirm'>
            {t('settings.agentsPage.install.consent.confirm')}
          </Button>
        </>
      }
    >
      {consent && (
        <div data-testid='install-consent-sheet'>
          <Typography.Paragraph className='text-13px'>
            {t('settings.agentsPage.install.consent.body')}
          </Typography.Paragraph>
          <div className={styles.consentFacts}>
            <ConsentFact
              label={t('settings.agentsPage.install.consent.packageLabel')}
              value={consent.npmPackage}
              testId='install-consent-package'
            />
            <ConsentFact
              label={t('settings.agentsPage.install.consent.versionLabel')}
              value={consent.version}
              testId='install-consent-version'
            />
            <ConsentFact
              label={t('settings.agentsPage.install.consent.destinationLabel')}
              value={consent.destination}
              testId='install-consent-destination'
            />
            <ConsentFact
              label={t('settings.agentsPage.install.consent.scriptsLabel')}
              value={t('settings.agentsPage.install.consent.scriptsValue')}
              testId='install-consent-scripts'
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

/**
 * The right-hand slot of the tile — where "More detected" puts its toolbar
 * toggle. Exactly one control per state, and `system` deliberately has none:
 * an Install button next to "uses your system copy" would be an invitation to
 * break a working setup (D1).
 */
const InstallControl: React.FC<{
  agent: InstallableAgent;
  onInstall: () => void;
  onCancel: () => void;
  onRemove: () => void;
}> = ({ agent, onInstall, onCancel, onRemove }) => {
  const { t } = useTranslation();
  const [confirmRemove, setConfirmRemove] = React.useState(false);

  if (agent.state === 'installing') {
    // The spinner is the progress; the pinned version is stated once, on the
    // status line, rather than repeated in the button beside it. Beside it sits
    // the only way out: without this the user's sole option was to wait for the
    // deadline, on a channel that has had a cancel all along.
    return (
      <>
        <Button
          size='mini'
          type='secondary'
          loading
          disabled
          className={styles.installBtn}
          data-testid={`install-progress-${agent.agentId}`}
        >
          {t('settings.agentsPage.install.action')}
        </Button>
        <Button
          size='mini'
          type='text'
          onClick={onCancel}
          className={styles.whyBtn}
          data-testid={`install-cancel-${agent.agentId}`}
        >
          {t('settings.agentsPage.install.cancel')}
        </Button>
      </>
    );
  }

  if (agent.state === 'unavailable') {
    return (
      <Tooltip content={t('settings.agentsPage.install.whyBody')}>
        <Button size='mini' type='text' className={styles.whyBtn} data-testid={`install-why-${agent.agentId}`}>
          {t('settings.agentsPage.install.whyLink')}
        </Button>
      </Tooltip>
    );
  }

  if (agent.state === 'absent' || agent.state === 'failed') {
    return (
      <Button
        size='mini'
        type='primary'
        onClick={onInstall}
        className={styles.installBtn}
        data-testid={`install-button-${agent.agentId}`}
      >
        {t(agent.state === 'failed' ? 'settings.agentsPage.install.retry' : 'settings.agentsPage.install.action')}
      </Button>
    );
  }

  if (agent.state === 'installed') {
    // Wayland put this in its own profile, so Wayland can take it out again.
    // Behind a confirm because it deletes a directory, and worded so the user
    // knows it is Wayland's copy going, not theirs.
    return (
      <>
        <Button
          size='mini'
          type='text'
          status='danger'
          onClick={() => setConfirmRemove(true)}
          className={styles.whyBtn}
          data-testid={`install-remove-${agent.agentId}`}
        >
          {t('settings.agentsPage.install.remove')}
        </Button>
        <Modal
          visible={confirmRemove}
          title={t('settings.agentsPage.install.removeConfirm.title', { agent: agent.name })}
          onCancel={() => setConfirmRemove(false)}
          autoFocus={false}
          focusLock
          unmountOnExit
          footer={
            <>
              <Button onClick={() => setConfirmRemove(false)} data-testid='install-remove-cancel'>
                {t('settings.agentsPage.install.removeConfirm.cancel')}
              </Button>
              <Button
                type='primary'
                status='danger'
                onClick={() => {
                  setConfirmRemove(false);
                  onRemove();
                }}
                data-testid='install-remove-confirm'
              >
                {t('settings.agentsPage.install.removeConfirm.confirm')}
              </Button>
            </>
          }
        >
          <Typography.Paragraph className='text-13px'>
            {t('settings.agentsPage.install.removeConfirm.body')}
          </Typography.Paragraph>
        </Modal>
      </>
    );
  }

  // `system` has its say in the status line below the name and offers no action
  // here: Wayland did not install that copy and must not remove it (D1).
  return null;
};

/** The status line under the agent name — one sentence per state. */
const InstallStatusLine: React.FC<{ agent: InstallableAgent }> = ({ agent }) => {
  const { t } = useTranslation();

  if (agent.state === 'system') {
    return (
      <span className={styles.tileScope} data-testid={`install-state-${agent.agentId}`}>
        {t('settings.agentsPage.install.systemCopy')}
      </span>
    );
  }
  if (agent.state === 'installed') {
    return (
      <span className={styles.tileScope} data-testid={`install-state-${agent.agentId}`}>
        {t('settings.agentsPage.install.installed')}
      </span>
    );
  }
  if (agent.state === 'installing') {
    return (
      <span className={styles.tileScope} data-testid={`install-state-${agent.agentId}`}>
        {t('settings.agentsPage.install.installing', { version: agent.pinnedVersion })}
      </span>
    );
  }
  if (agent.state === 'failed') {
    return (
      <span className={styles.installFailed} data-testid={`install-state-${agent.agentId}`}>
        {t(`settings.agentsPage.install.failed.${agent.failureReason ?? 'error'}`)}
      </span>
    );
  }
  if (agent.state === 'unavailable') {
    return (
      <span className={styles.tileScope} data-testid={`install-state-${agent.agentId}`}>
        {t('settings.agentsPage.install.unavailable')}
      </span>
    );
  }
  // `absent`: the pinned version is the honest headline — it is what an install
  // would fetch, and it is the same number the consent sheet will state.
  return (
    <span className={styles.tileScope} data-testid={`install-state-${agent.agentId}`}>
      {t('settings.agentsPage.install.pinned', { version: agent.pinnedVersion })}
    </span>
  );
};

/**
 * One installable-agent tile. Structurally the "More detected" tile; an
 * `absent` or `unavailable` card dims the mark and switches to a dashed border
 * so "you do not have this" reads at a glance without a second badge.
 */
const InstallableAgentTile: React.FC<{
  agent: InstallableAgent;
  onInstall: () => void;
  onCancel: () => void;
  onRemove: () => void;
}> = ({ agent, onInstall, onCancel, onRemove }) => {
  const dimmed = agent.state === 'absent' || agent.state === 'unavailable' || agent.state === 'failed';
  const logo = resolveAgentLogo({ backend: agent.agentId });

  return (
    <div
      className={`${styles.tile} ${dimmed ? styles.tileAvailable : ''}`}
      data-testid={`installable-tile-${agent.agentId}`}
      data-state={agent.state}
    >
      <Avatar
        size={28}
        shape='square'
        className={`${styles.tileAvatar} ${dimmed ? styles.tileAvatarDim : ''}`}
        style={{ backgroundColor: 'var(--color-fill-2)' }}
      >
        {logo ? <img src={logo} alt={agent.name} /> : '\u{1F916}'}
      </Avatar>
      <div className={styles.tileText}>
        <div className={styles.tileName}>{agent.name}</div>
        <div className={styles.tileScopeRow}>
          <InstallStatusLine agent={agent} />
          {agent.installedVersion && (
            <span className={styles.versionChip} data-testid={`install-version-${agent.agentId}`}>
              {agent.installedVersion}
            </span>
          )}
          {/* The reason to install, visible BEFORE the install. An `absent`
              card carries the same Flux chip a detected one does, because the
              user is deciding right here whether the agent is worth having.
              It is INERT there, though: the setup connector writes the agent's
              own config file, so offering it for software that is not on the
              machine opens a modal that can only fail. Interactive only once
              the agent is actually present, however it got there. */}
          <FluxCompatChip
            backend={agent.agentId}
            interactive={agent.state === 'installed' || agent.state === 'system'}
          />
        </div>
      </div>
      <InstallControl agent={agent} onInstall={onInstall} onCancel={onCancel} onRemove={onRemove} />
    </div>
  );
};

/**
 * The band. Renders nothing at all when the main process has no catalogue to
 * report (an older engine, or a status call that failed) rather than showing an
 * empty header that promises installs the build cannot perform.
 */
const AvailableToInstall: React.FC = () => {
  const { t } = useTranslation();

  const { data: report, mutate } = useSWR<AgentInstallerReport | undefined>('agent-installer.status', async () => {
    return await ipcBridge.agentInstaller.status.invoke();
  });

  // Two derivations of the same catalogue, on purpose:
  //  - `catalogue` carries the MAIN-PROCESS verdict alone. It is what the
  //    consent gate re-checks at execution time, so a stale consent is judged
  //    against observed reality (receipt / PATH), never against a session flag.
  //  - `merged` folds in this session's activity and is what renders, so an
  //    install in flight and a failed install are both visible.
  const catalogue = React.useMemo(() => buildInstallableAgents(report, {}), [report]);
  const controller = useAgentInstaller(catalogue, mutate);
  const merged = React.useMemo(
    () => buildInstallableAgents(report, controller.activity),
    [report, controller.activity]
  );

  if (merged.length === 0) return null;

  return (
    <>
      <div className={styles.sectionLabel}>{t('settings.agentsPage.install.bandTitle')}</div>
      <div className={styles.tileGrid} data-testid='available-to-install'>
        {merged.map((agent) => (
          <InstallableAgentTile
            key={agent.agentId}
            agent={agent}
            onInstall={() => controller.requestInstall(agent)}
            onCancel={() => void controller.cancelInstall(agent.agentId)}
            onRemove={() => void controller.uninstall(agent.agentId)}
          />
        ))}
      </div>
      <InstallConsentSheet
        consent={controller.pendingConsent}
        onCancel={controller.dismissConsent}
        onConfirm={() => void controller.confirmInstall()}
      />
    </>
  );
};

export default AvailableToInstall;
