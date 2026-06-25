/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpCircle } from 'lucide-react';
import { ipcBridge } from '@/common';
import type { AutoUpdateStatus } from '@/common/update/updateTypes';

/** UpdateModal listens for this window event to open itself (renderer-local). */
const OPEN_UPDATE_MODAL_EVENT = 'wayland-open-update-modal';

/** Statuses worth surfacing as a persistent top-bar affordance. */
const PILL_STATUSES = new Set<AutoUpdateStatus['status']>(['available', 'downloading', 'downloaded']);

/**
 * A small accent pill that appears in the title bar whenever the auto-updater
 * reports an update is available / downloading / ready. Clicking it opens the
 * existing UpdateModal. Driven entirely by the `autoUpdate.status` stream that
 * already feeds the modal, so it stays in sync with no extra plumbing.
 *
 * On the web/remote build (no auto-updater) the status never fires, so the
 * pill simply never renders.
 */
const UpdatePill: React.FC = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<AutoUpdateStatus | null>(null);

  useEffect(() => {
    const removeListener = ipcBridge.autoUpdate.status.on((evt: AutoUpdateStatus) => setStatus(evt));
    // QA/dev seam: a window event lets us drive the pill without a real release.
    //   window.dispatchEvent(new CustomEvent('wayland:update-status', { detail: { status: 'available', version: '9.9.9' } }))
    // Harmless in production (nothing dispatches it); clicking the pill only
    // opens the modal, which re-validates against the real updater.
    const onSim = (e: Event) => setStatus((e as CustomEvent<AutoUpdateStatus>).detail);
    window.addEventListener('wayland:update-status', onSim);
    return () => {
      removeListener?.();
      window.removeEventListener('wayland:update-status', onSim);
    };
  }, []);

  if (!status || !PILL_STATUSES.has(status.status)) {
    return null;
  }

  const label =
    status.status === 'downloaded'
      ? t('update.pill.ready', { defaultValue: 'Restart to update' })
      : status.status === 'downloading'
        ? t('update.pill.downloading', { defaultValue: 'Updating...' })
        : t('update.pill.available', { defaultValue: 'Update' });

  const tooltip = status.version
    ? t('update.pill.tooltip', { defaultValue: 'Update available: {{version}}', version: status.version })
    : label;

  return (
    <button
      type='button'
      className='app-titlebar__update-pill'
      onClick={() => window.dispatchEvent(new Event(OPEN_UPDATE_MODAL_EVENT))}
      aria-label={tooltip}
      title={tooltip}
    >
      <ArrowUpCircle size={13} strokeWidth={2.5} />
      <span>{label}</span>
    </button>
  );
};

export default UpdatePill;
