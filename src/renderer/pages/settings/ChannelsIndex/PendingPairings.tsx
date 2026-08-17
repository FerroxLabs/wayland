/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Message } from '@arco-design/web-react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPairingRequest } from '@process/channels/types';

/**
 * PendingPairings - account-wide pairing approval surface.
 *
 * Lists every pending pairing request across all channels (not filtered by
 * platform) and lets the operator Approve or Reject each one. The list loads on
 * mount and stays live via the `channel.pairing-requests-changed` emitter, which
 * fires from PairingService whenever a request is created / approved / rejected /
 * expired - so a request raised by someone messaging a channel they are not yet
 * authorized on appears here without a refresh.
 *
 * Renders nothing when there are no pending requests, so it adds no visual
 * weight to the Channels page in the common case.
 */
const PendingPairings: React.FC = () => {
  const { t } = useTranslation();
  const [pending, setPending] = useState<IChannelPairingRequest[]>([]);
  // `now` ticks once a minute so the "expires in" countdown stays honest while
  // the section is open without re-fetching from the main process.
  const [now, setNow] = useState<number>(Date.now());

  const load = useCallback(() => {
    channel.getPendingPairings
      .invoke()
      .then((result) => {
        if (result?.success && result.data) {
          setPending(result.data);
        }
      })
      .catch(() => {
        /* best-effort; the change emitter will reconcile on the next event */
      });
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = channel.pairingRequestsChanged.on((requests) => {
      // Payload carries the refreshed pending list; fall back to a re-fetch if a
      // future emitter ever sends an empty signal instead.
      if (Array.isArray(requests)) {
        setPending(requests);
      } else {
        load();
      }
    });
    const ticker = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => {
      unsubscribe?.();
      clearInterval(ticker);
    };
  }, [load]);

  const remainingLabel = (expiresAt: number): string => {
    const minutes = Math.max(0, Math.ceil((expiresAt - now) / 1000 / 60));
    if (minutes <= 0) return t('settings.channelsIndex.pendingPairing.expired');
    return `${minutes} min`;
  };

  // approve/reject are remote-denied (a paired WebUI must never self-approve), so
  // on that transport the invoke REJECTS (#979). Catch it, or the operator gets
  // silence where they used to get a failure toast.
  const handleApprove = useCallback(
    async (code: string) => {
      const result = await channel.approvePairing.invoke({ code }).catch((): undefined => undefined);
      if (result?.success) {
        Message.success(t('settings.channelsIndex.pendingPairing.approved'));
      } else {
        Message.error(result?.msg || t('settings.channelsIndex.pendingPairing.approveFailed'));
      }
    },
    [t]
  );

  const handleReject = useCallback(
    async (code: string) => {
      const result = await channel.rejectPairing.invoke({ code }).catch((): undefined => undefined);
      if (result?.success) {
        Message.info(t('settings.channelsIndex.pendingPairing.rejected'));
      } else {
        Message.error(result?.msg || t('settings.channelsIndex.pendingPairing.rejectFailed'));
      }
    },
    [t]
  );

  if (pending.length === 0) return null;

  return (
    <div className='rounded-12px border border-solid border-[var(--color-border-2)] bg-[var(--color-bg-2)] p-16px'>
      <div className='mb-4px text-14px font-semibold text-[var(--color-text-1)]'>
        {t('settings.channelsIndex.pendingPairing.title')}
      </div>
      <div className='mb-12px text-12px text-[var(--color-text-3)]'>
        {t('settings.channelsIndex.pendingPairing.subtitle')}
      </div>
      <div className='flex flex-col gap-12px'>
        {pending.map((request) => (
          <div
            key={request.code}
            className='flex items-center justify-between gap-12px rounded-8px bg-[var(--color-fill-1)] p-12px'
          >
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-8px'>
                <span className='truncate text-14px font-medium text-[var(--color-text-1)]'>
                  {request.displayName || t('settings.channelsIndex.pendingPairing.unknownUser')}
                </span>
                <span className='shrink-0 rounded-full bg-[var(--color-fill-2)] px-8px py-2px text-11px font-medium text-[var(--color-text-3)]'>
                  {request.platformType}
                </span>
              </div>
              <div className='mt-4px text-12px text-[var(--color-text-3)]'>
                {t('settings.channelsIndex.pendingPairing.code')}:{' '}
                <span className='rounded-2px bg-[var(--color-fill-2)] px-4px font-mono'>{request.code}</span>
                <span className='mx-8px'>|</span>
                {t('settings.channelsIndex.pendingPairing.expiresIn')}: {remainingLabel(request.expiresAt)}
              </div>
            </div>
            <div className='flex shrink-0 items-center gap-8px'>
              <Button
                type='primary'
                size='small'
                icon={<CheckCircle2 size={14} />}
                onClick={() => handleApprove(request.code)}
              >
                {t('settings.channelsIndex.pendingPairing.approve')}
              </Button>
              <Button
                type='secondary'
                status='danger'
                size='small'
                icon={<XCircle size={14} />}
                onClick={() => handleReject(request.code)}
              >
                {t('settings.channelsIndex.pendingPairing.reject')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingPairings;
