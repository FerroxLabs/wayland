/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Alert, Avatar, Button, Spin, Tooltip, Typography } from '@arco-design/web-react';
import { CheckOne } from '@icon-park/react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { ipcBridge } from '@/common';
import { getFluxCompat } from '@/common/types/acpTypes';
import { resolveAgentLogo } from '@renderer/utils/model/agentLogo';
import { resolveExtensionAssetUrl } from '@renderer/utils/platform';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import RemoteAgents from './RemoteAgents';
import FluxRouterCard from './FluxRouterCard';
import FluxSetupModal from './FluxSetupModal';
import { resolveAgentScope } from './agentScopes';
import styles from './AgentsSettings.module.css';

/**
 * Shape of one detected agent - derived from the `acp.get-available-agents`
 * IPC return type so the page and the bridge contract cannot drift. `avatar`
 * is added locally because extension-contributed agents carry it on the same
 * record even though the bridge type predates the field.
 */
type AvailableAgentsResponse = Awaited<ReturnType<typeof ipcBridge.acpConversation.getAvailableAgents.invoke>>;
type DetectedAgent = NonNullable<AvailableAgentsResponse['data']>[number] & { avatar?: string };

/**
 * Detected agents whose model-scope warrants the full hero/featured card.
 * Keyed by `backend` - must stay consistent with the scope map in
 * `agentScopes.ts` (both are backend-keyed lists).
 */
const FEATURED_BACKENDS = ['wcore', 'claude', 'codex'];

/**
 * The Wayland Core hero card always renders, even when the live agent
 * detector returns no entry for it - the engine is always-available once a
 * model is connected. We compose a static metadata-only record here so the
 * page never goes wcore-less, and let the live detection result decide the
 * "Active" vs "Detected" badge.
 */
const WCORE_STATIC: DetectedAgent = {
  backend: 'wcore',
  name: 'Wayland Core',
  isExtension: false,
  isPreset: false,
};

/**
 * Resolve the best logo for a detected agent, falling back to an extension
 * asset URL when the agent is contributed by an extension.
 */
function agentLogo(agent: DetectedAgent): string | null {
  const extensionAvatar = resolveExtensionAssetUrl(agent.isExtension ? agent.avatar : undefined);
  return (
    extensionAvatar ||
    resolveAgentLogo({
      backend: agent.backend,
      customAgentId: agent.customAgentId,
      isExtension: agent.isExtension,
    })
  );
}

/**
 * Small per-agent Flux status chip. Driven by the backend's `fluxCompat`
 * classification in the registry (single source of truth via `getFluxCompat`):
 *  - 'env'    -> "Flux ready" (positive tone)
 *  - 'setup'  -> "Flux setup" (neutral tone)
 *  - 'vendor' -> "Native only" (muted tone) with a tooltip explaining why.
 * Renders nothing when the backend has no Flux classification.
 */
const FluxCompatChip: React.FC<{ backend: string }> = ({ backend }) => {
  const { t } = useTranslation();
  const [setupOpen, setSetupOpen] = React.useState(false);
  const compat = getFluxCompat(backend);
  if (!compat) return null;

  if (compat === 'env') {
    return (
      <span className={`${styles.fluxChip} ${styles.fluxChipReady}`}>
        <CheckOne theme='filled' size={11} />
        {t('settings.agentsPage.fluxCompat.ready')}
      </span>
    );
  }

  if (compat === 'setup') {
    // opencode and codex have live connectors (a one-time config write routes
    // them through Flux). Render their chip as a clickable button that opens the
    // setup modal for the matching backend; other `setup` backends stay
    // informational.
    if (backend === 'opencode' || backend === 'codex') {
      return (
        <>
          <Button
            type='text'
            size='mini'
            className={`${styles.fluxChip} ${styles.fluxChipSetup} ${styles.fluxChipButton}`}
            onClick={() => setSetupOpen(true)}
            data-testid='flux-setup-chip'
          >
            {t('settings.agentsPage.fluxCompat.setup')}
          </Button>
          <FluxSetupModal visible={setupOpen} onClose={() => setSetupOpen(false)} backend={backend} />
        </>
      );
    }
    return (
      <span className={`${styles.fluxChip} ${styles.fluxChipSetup}`}>{t('settings.agentsPage.fluxCompat.setup')}</span>
    );
  }

  return (
    <Tooltip content={t('settings.agentsPage.fluxCompat.nativeOnlyTooltip')}>
      <span className={`${styles.fluxChip} ${styles.fluxChipNative}`}>
        {t('settings.agentsPage.fluxCompat.nativeOnly')}
      </span>
    </Tooltip>
  );
};

/**
 * One featured agent card (prototype `#screen-agents` `.acard`). States, in a
 * plain sentence, what models the agent runs - no "family" jargon, no padlock.
 */
const AgentCard: React.FC<{ agent: DetectedAgent; hero: boolean }> = ({ agent, hero }) => {
  const { t } = useTranslation();
  const scope = resolveAgentScope(agent.backend);
  const logo = agentLogo(agent);

  return (
    <div className={`${styles.card} ${hero ? styles.cardHero : ''}`} data-testid='agent-card'>
      <div className={styles.cardHead}>
        <Avatar size={42} shape='square' className={styles.avatar} style={{ backgroundColor: 'var(--color-fill-2)' }}>
          {logo ? <img src={logo} alt={agent.name} /> : '\u{1F916}'}
        </Avatar>
        <div className={styles.cardMain}>
          <div className={styles.name}>{agent.name}</div>
          <div className={styles.runsRow}>
            <span className={`${styles.runs} ${scope.accent ? '' : styles.runsMuted}`}>
              {t(`settings.agentsPage.scope.${scope.scopeKey}`)}
            </span>
            <FluxCompatChip backend={agent.backend} />
          </div>
          <div className={styles.desc}>{t(`settings.agentsPage.about.${agent.backend}`, { defaultValue: '' })}</div>
        </div>
        <span className={`${styles.badge} ${hero ? styles.badgeActive : styles.badgeDetected}`}>
          {hero && <span className={styles.badgeDot} />}
          {t(hero ? 'settings.agentsPage.badge.active' : 'settings.agentsPage.badge.detected')}
        </span>
      </div>
    </div>
  );
};

/**
 * One compact tile for a detected agent in the "More detected" grid
 * (prototype `.mtile`). Shows only the agent and its plain-language scope.
 */
const AgentTile: React.FC<{ agent: DetectedAgent }> = ({ agent }) => {
  const { t } = useTranslation();
  const scope = resolveAgentScope(agent.backend);
  const logo = agentLogo(agent);

  return (
    <div className={styles.tile} data-testid='agent-tile'>
      <Avatar size={28} shape='square' className={styles.tileAvatar} style={{ backgroundColor: 'var(--color-fill-2)' }}>
        {logo ? <img src={logo} alt={agent.name} /> : '\u{1F916}'}
      </Avatar>
      <div className={styles.tileText}>
        <div className={styles.tileName}>{agent.name}</div>
        <div className={styles.tileScopeRow}>
          <span className={styles.tileScope}>{t(`settings.agentsPage.scope.${scope.scopeKey}`)}</span>
          <FluxCompatChip backend={agent.backend} />
        </div>
      </div>
    </div>
  );
};

/**
 * Agents settings page - a clean sibling of the Models page (spec §4.7,
 * prototype `#screen-agents`).
 *
 * Three regions:
 *  1. Your agents - Wayland Core as the hero card plus Claude Code / Codex,
 *     each stating in plain language what models it runs.
 *  2. More detected - a compact tile grid for every other detected CLI agent.
 *  3. Remote agents - paired remote connections (OpenClaw, Hermes).
 *  4. Flux Router - live connection status plus the route-through-Flux toggle.
 */
const AgentsSettings: React.FC = () => {
  const { t } = useTranslation();

  // Detected agents - built-in backends and extension-contributed agents,
  // excluding remote and user-custom agents (those have their own surfaces).
  const { data: detectedAgents, isLoading } = useSWR('acp.agents.available.agentsPage', async () => {
    const result = await ipcBridge.acpConversation.getAvailableAgents.invoke();
    if (result.success && result.data) {
      return result.data.filter((agent) => agent.backend !== 'remote' && agent.backend !== 'custom' && !agent.isPreset);
    }
    return [] as DetectedAgent[];
  });

  // Sub-detector load failures (e.g. a remote-agent DB read error) come back
  // separately so the user can tell "nothing detected" from "loading failed".
  const { data: loadErrors } = useSWR('acp.agents.loadErrors.agentsPage', async () => {
    const result = await ipcBridge.acpConversation.getLoadErrors.invoke();
    return result.success && result.data ? result.data : ([] as string[]);
  });

  const agents = detectedAgents ?? [];
  // Wayland Core is always-available - render its hero from static metadata
  // when the live detector doesn't return it, otherwise prefer the live row
  // (so any future detector-supplied fields like `cliPath` flow through).
  const detectedWcore = agents.find((a) => a.backend === 'wcore');
  const wcoreAgent = detectedWcore ?? WCORE_STATIC;
  const wcoreIsActive = Boolean(detectedWcore);
  const featuredRest = FEATURED_BACKENDS.filter((b) => b !== 'wcore').map((backend) =>
    agents.find((a) => a.backend === backend)
  );
  const featured: DetectedAgent[] = [wcoreAgent, ...featuredRest.filter((a): a is DetectedAgent => Boolean(a))];
  const featuredSet = new Set(featured.map((a) => a.backend));
  const moreDetected = agents.filter((a) => !featuredSet.has(a.backend));

  return (
    <SettingsPageShell
      title={t('settings.agentsPage.title')}
      subtitle={t('settings.agentsPage.subtitle')}
      breadcrumb={[{ label: t('settings.modelsPage.crumbAiModels') }, { label: t('settings.agentsPage.title') }]}
      contentClassName='md:max-w-[860px]'
    >
      {loadErrors && loadErrors.length > 0 && (
        <Alert
          type='warning'
          content={
            <div className='flex flex-col gap-4px'>
              <Typography.Text className='text-12px font-medium'>
                {t('settings.agentsPage.loadErrorsTitle')}
              </Typography.Text>
              {loadErrors.map((err) => (
                <Typography.Text key={err} className='text-12px'>
                  {err}
                </Typography.Text>
              ))}
            </div>
          }
        />
      )}

      {/* ---- Your agents ---- */}
      <div className={styles.sectionLabel}>{t('settings.agentsPage.yourAgents')}</div>

      {isLoading && agents.length === 0 ? (
        <div className='flex justify-center py-32px'>
          <Spin />
        </div>
      ) : (
        <>
          <div className={styles.agentList}>
            {featured.map((agent) => (
              <AgentCard key={agent.backend} agent={agent} hero={agent.backend === 'wcore' ? wcoreIsActive : true} />
            ))}
          </div>
          {agents.length === 0 && <div className={styles.emptyNote}>{t('settings.agentsPage.empty')}</div>}
        </>
      )}

      {/* ---- More detected ---- */}
      {moreDetected.length > 0 && (
        <>
          <div className={styles.sectionLabel}>
            {t('settings.agentsPage.moreDetected', { count: moreDetected.length })}
          </div>
          <div className={styles.tileGrid}>
            {moreDetected.map((agent) => (
              <AgentTile key={agent.backend} agent={agent} />
            ))}
          </div>
        </>
      )}

      {/* ---- Remote agents (OpenClaw, Hermes) ---- */}
      <div className={styles.sectionLabel}>{t('settings.agentsPage.remoteAgents')}</div>
      <RemoteAgents />

      {/* ---- Flux Router: live connection status + route-through toggle ---- */}
      <div className={styles.sectionLabel}>{t('settings.agentsPage.flux.title')}</div>
      <FluxRouterCard />
    </SettingsPageShell>
  );
};

export default AgentsSettings;
