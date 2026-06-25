/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { Dropdown, Menu, Switch } from '@arco-design/web-react';
import { BadgeCheck, Plus, LogIn, RefreshCw, MoreVertical } from 'lucide-react';
import type { CatalogIndexEntry } from '../types';
import type { UIStatus } from '../status';
import { needsAttention } from '../status';
import { useMcpCardActions } from './McpCardActions';
import styles from '../McpLibrary.module.css';

type Props = {
  entry: CatalogIndexEntry;
  installed: boolean;
  /** Health of the installed server for this entry, when one exists. */
  status?: UIStatus;
  /** Tinted "promoted" variant requested by the Popular hero. */
  featured?: boolean;
  onClick: () => void;
};

const MAINTAINER_LABEL_KEY: Record<CatalogIndexEntry['maintainerType'], string> = {
  official: 'maintainerOfficial',
  community: 'maintainerCommunity',
  wayland: 'maintainerWayland',
};

const MAINTAINER_LABEL_DEFAULT: Record<CatalogIndexEntry['maintainerType'], string> = {
  official: 'Official',
  community: 'Community',
  wayland: 'Wayland',
};

/**
 * Browse-grid card on the on-brand recipe. The footer carries at most three
 * elements - maintainer tag + one state-driven affordance (+ kebab when
 * installed) - so it never overflows at the grid's tightest column width. The
 * orange Switch is the "connected" signal for a healthy installed server, which
 * is why no redundant status chip rides along.
 */
export function McpCard({ entry, installed, status, featured = false, onClick }: Props) {
  const { t } = useTranslation();
  const actions = useMcpCardActions();
  const server = installed ? actions?.serverFor(entry.id) : undefined;
  const [iconBroken, setIconBroken] = useState(false);
  // An installed connector that is broken or wants a sign-in is surfaced right
  // on the card so the user can spot it at a glance instead of hunting Installed.
  const attention = installed && status !== undefined && needsAttention(status);
  // Connected + active (enabled + reachable). Gets a persistent green outline so
  // a live connector reads as "connected" at a glance, matching the Channels grid.
  const connected = installed && status === 'running';

  const maintainerTag = (
    <span className={styles.cardTag}>
      {t(
        `mcpLibrary.card.${MAINTAINER_LABEL_KEY[entry.maintainerType]}`,
        MAINTAINER_LABEL_DEFAULT[entry.maintainerType]
      )}
    </span>
  );

  const kebab = (
    <button
      type="button"
      className={styles.cardKebab}
      aria-label={t('mcpLibrary.card.moreActions', 'More actions')}
      onClick={(e) => e.stopPropagation()}
    >
      <MoreVertical size={15} />
    </button>
  );

  // Right-click menu: quick lifecycle actions without opening the detail page.
  // The kebab opens the same droplist via the wrapping Dropdown's contextMenu
  // trigger, so we keep a single menu definition.
  const contextMenu = (
    <Menu
      onClickMenuItem={(key) => {
        if (!actions) return;
        if (key === 'reconnect' && server) actions.onReconnect(server);
        else if (key === 'configure') actions.onConfigure(entry.id);
        else if (key === 'remove' && server) actions.onRemove(server.id);
        else if (key === 'install') actions.onConfigure(entry.id);
        else if (key === 'details') actions.onConfigure(entry.id);
      }}
    >
      {server
        ? [
            <Menu.Item key="reconnect">{t('mcpLibrary.card.reconnect', 'Reconnect')}</Menu.Item>,
            <Menu.Item key="configure">{t('mcpLibrary.card.configure', 'Configure')}</Menu.Item>,
            // No Arco Menu.Divider in this version - the danger Remove item carries
            // a top border (.cardMenuDanger) to read as a separated destructive action.
            <Menu.Item key="remove" className={styles.cardMenuDanger}>
              {t('mcpLibrary.card.remove', 'Remove')}
            </Menu.Item>,
          ]
        : [
            <Menu.Item key="install">{t('mcpLibrary.card.install', 'Install')}</Menu.Item>,
            <Menu.Item key="details">{t('mcpLibrary.card.viewDetails', 'View details')}</Menu.Item>,
          ]}
    </Menu>
  );

  let footerRight: React.ReactNode;
  if (!installed) {
    footerRight = (
      <button
        type="button"
        className={styles.cardInstall}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <Plus size={13} />
        {t('mcpLibrary.card.install', 'Install')}
      </button>
    );
  } else if (attention && status === 'warn') {
    footerRight = (
      <>
        <button
          type="button"
          className={classNames(styles.cardFix, styles.cardFixWarn)}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <LogIn size={13} />
          {t('mcpLibrary.card.signIn', 'Sign in')}
        </button>
        {kebab}
      </>
    );
  } else if (attention && status === 'error') {
    footerRight = (
      <>
        <button
          type="button"
          className={classNames(styles.cardFix, styles.cardFixErr)}
          onClick={(e) => {
            e.stopPropagation();
            if (actions && server) actions.onReconnect(server);
            else onClick();
          }}
        >
          <RefreshCw size={13} />
          {t('mcpLibrary.card.reconnect', 'Reconnect')}
        </button>
        {kebab}
      </>
    );
  } else if (server) {
    // Installed + healthy: the orange Switch IS the connected signal (grey = off).
    footerRight = (
      <>
        <span
          className={styles.cardSwitchWrap}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Switch
            size="small"
            checked={server.enabled}
            onChange={(v) => actions?.onToggle(server.id, v)}
            aria-label={t('mcpLibrary.card.toggleAria', 'Enable or disable {{name}}', {
              name: entry.name,
            })}
          />
        </span>
        {kebab}
      </>
    );
  } else {
    // Installed but no server record available (no actions context): fall back to
    // a leading-edge spacer so the tag still left-aligns.
    footerRight = null;
  }

  const card = (
    <div
      className={classNames(
        styles.card,
        featured && styles.cardFeatured,
        connected && styles.cardConnected,
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.cardTop}>
        <span className={styles.cardLogo}>
          {iconBroken ? (
            <span className={styles.cardLogoLetter}>{entry.name[0]}</span>
          ) : (
            <img src={entry.iconUrl} alt="" onError={() => setIconBroken(true)} />
          )}
        </span>
        <div className={styles.cardMeta}>
          <div className={styles.cardName}>
            <span>{entry.name}</span>
            {entry.verifiedByWayland && <BadgeCheck className={styles.cardTick} size={13} />}
          </div>
        </div>
      </div>
      <div className={styles.cardDesc}>{entry.shortDescription}</div>
      <div className={styles.cardFoot}>
        {maintainerTag}
        {footerRight}
      </div>
    </div>
  );

  // No actions context (e.g. a surface that doesn't wire lifecycle) - render the
  // bare card so the component still works standalone (no switch, no menu).
  if (!actions) return card;

  return (
    <Dropdown droplist={contextMenu} trigger="contextMenu" position="bl">
      {card}
    </Dropdown>
  );
}
