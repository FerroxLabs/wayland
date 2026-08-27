/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@arco-design/web-react';
import { useWcoreConfig } from '@renderer/hooks/useWcoreConfig';
import {
  hasAnsweredMemoryOffer,
  markMemoryOfferAnswered,
  shouldOfferMemoryEnable,
} from '@renderer/utils/memory/memoryEnableOffer';
import styles from './MemoryEnableOffer.module.css';

/**
 * A one-time offer to switch long-term memory back on.
 *
 * This is the repair for profiles that were silently left memory-less: an older
 * Core re-serialized the whole typed config on any single-field patch and
 * stamped `[memory] enabled = false` in, long after the shipped default became
 * `true`. Those users never chose that and have no reason to suspect it.
 *
 * It is an OFFER and never a silent flip. `enabled = false` on disk looks
 * identical whether it was stamped by that bug or chosen deliberately in
 * Settings, so turning it back on unasked would override a privacy decision we
 * cannot see. Declining is recorded exactly as firmly as accepting, and so is
 * using the real toggle - the question is asked once, ever.
 *
 * Renders nothing at all in the common case (memory already on, or already
 * answered), so it is safe to mount anywhere.
 */
const MemoryEnableOffer: React.FC<{ source: string }> = ({ source }) => {
  const { t } = useTranslation();
  const { getSection, patchField } = useWcoreConfig();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    void (async () => {
      try {
        const raw = await getSection<Record<string, unknown>>('memory');
        const value = raw?.enabled;
        // Absent means Core's own default, which is ON - matching
        // `serde(default = "default_true")`. Only an explicit `false` is off.
        // A non-boolean is malformed, not off: treat it as unreadable rather
        // than offering to "fix" a config we did not understand.
        const enabled = value === undefined ? true : typeof value === 'boolean' ? value : undefined;
        const show = await shouldOfferMemoryEnable(enabled);
        if (mounted.current) setVisible(show);
      } catch {
        // Unreadable engine config is NOT evidence memory is off. Stay silent.
        if (mounted.current) setVisible(false);
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, [getSection]);

  const answerAndClose = useCallback(async () => {
    await markMemoryOfferAnswered();
    if (mounted.current) setVisible(false);
  }, []);

  const accept = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setFailed(null);
    try {
      const result = await patchField({ section: 'memory', field: 'enabled', value: true });
      if (!result.ok) {
        // Do NOT record an answer on failure. The user said yes and did not get
        // it; asking again next launch is the correct behaviour.
        const message = 'error' in result ? result.error : 'Memory could not be turned on.';
        if (mounted.current) {
          setFailed(message);
          setBusy(false);
        }
        return;
      }
      await answerAndClose();
    } catch (error) {
      if (mounted.current) {
        setFailed(error instanceof Error ? error.message : String(error));
        setBusy(false);
      }
    }
  }, [answerAndClose, busy, patchField]);

  if (!visible) return null;

  return (
    <section className={styles.offer} data-testid='memory-enable-offer' data-source={source}>
      <div className={styles.body}>
        <div className={styles.title}>
          {t('memory.offer.title', { defaultValue: 'Long-term memory is switched off' })}
        </div>
        <div className={styles.desc}>
          {t('memory.offer.desc', {
            defaultValue:
              'Wayland is not keeping anything it learns about you between chats. It ships switched on, so this was probably not your choice. You can change it any time in Settings.',
          })}
        </div>
        {failed && <div className={styles.error}>{failed}</div>}
      </div>
      <div className={styles.actions}>
        <Button size='small' onClick={() => void answerAndClose()} data-testid='memory-enable-offer-decline'>
          {t('memory.offer.decline', { defaultValue: 'Leave it off' })}
        </Button>
        <Button
          type='primary'
          size='small'
          loading={busy}
          onClick={() => void accept()}
          data-testid='memory-enable-offer-accept'
        >
          {t('memory.offer.accept', { defaultValue: 'Turn memory on' })}
        </Button>
      </div>
    </section>
  );
};

export default MemoryEnableOffer;
