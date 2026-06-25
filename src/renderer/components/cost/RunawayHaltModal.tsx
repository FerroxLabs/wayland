/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Modal } from '@arco-design/web-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { RunawayHalted } from '@process/services/runaway/RunawayMonitor';

/**
 * Runaway circuit-breaker Phase 2 - the card shown when the loop detector stops
 * a turn that was burning tokens for no progress (re-reading the same content,
 * or a command failing repeatedly). Globally mounted (Layout). Informational:
 * the turn is already stopped gracefully, so the user just acknowledges and can
 * keep going.
 */
const RunawayHaltModal: React.FC = () => {
  const { t } = useTranslation();
  const [halted, setHalted] = useState<RunawayHalted | null>(null);

  useEffect(() => {
    const off = ipcBridge.conversation.runawayHalted.on((payload) => setHalted(payload));
    return () => off();
  }, []);

  if (!halted) return null;

  const bodyKey = halted.kind === 'repeated_read' ? 'messages.runaway.repeatedReadBody' : 'messages.runaway.failingCommandBody';

  return (
    <Modal
      visible
      title={t('messages.runaway.title')}
      onCancel={() => setHalted(null)}
      onOk={() => setHalted(null)}
      okText={t('messages.runaway.dismiss')}
      hideCancel
    >
      <div className='text-13px text-t-secondary leading-relaxed'>{t(bodyKey, { count: halted.count })}</div>
    </Modal>
  );
};

export default RunawayHaltModal;
