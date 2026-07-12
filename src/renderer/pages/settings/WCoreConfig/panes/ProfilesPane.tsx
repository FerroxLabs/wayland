/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Clock, Cpu, Plus, Sparkles, Wrench } from 'lucide-react';
import { Button, Input, Message, Modal } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { IWcoreProfile } from '@/common/adapter/ipcBridge';
import ScopeLabel from '../components/ScopeLabel';
import styles from './Panes.module.css';

/** Mirror of the main-process sanitizer for instant client-side validation. */
const PROFILE_NAME_RE = /^[A-Za-z0-9_-]{1,64}$/;

/** Abbreviate a home-rooted absolute path to `~/…` for compact display. */
function tildify(p: string): string {
  return p.replace(/^(\/Users\/[^/]+|\/home\/[^/]+|[A-Za-z]:\\Users\\[^\\]+)/, '~');
}

/**
 * Locale-aware "x ago" for the updated chip. Uses `Intl.RelativeTimeFormat`
 * (no i18n key needed - the value itself is localized by the platform).
 */
function relativeTime(epochMs: number): string {
  const diff = epochMs - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  if (abs < HOUR) return rtf.format(Math.round(diff / MIN), 'minute');
  if (abs < DAY) return rtf.format(Math.round(diff / HOUR), 'hour');
  return rtf.format(Math.round(diff / DAY), 'day');
}

const ProfilesPane: React.FC = () => {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<IWcoreProfile[]>([]);
  const [modal, setModal] = useState<{ mode: 'new' | 'clone'; from?: string } | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    const list = await ipcBridge.wcoreProfiles.list.invoke();
    setProfiles(list);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activate = useCallback(
    async (profileName: string): Promise<void> => {
      const r = await ipcBridge.wcoreProfiles.activate.invoke({ name: profileName });
      if (r.ok) await refresh();
      else Message.error(r.error ?? t('settings.wcoreConfig.profiles.activateFailed', { defaultValue: 'Failed.' }));
    },
    [refresh, t]
  );

  const removeProfile = useCallback(
    async (profileName: string): Promise<void> => {
      const r = await ipcBridge.wcoreProfiles.remove.invoke({ name: profileName });
      if (r.ok) await refresh();
      else Message.error(r.error ?? t('settings.wcoreConfig.profiles.deleteFailed', { defaultValue: 'Failed.' }));
    },
    [refresh, t]
  );

  const submit = useCallback(async (): Promise<void> => {
    const target = name.trim();
    if (!PROFILE_NAME_RE.test(target)) {
      Message.error(
        t('settings.wcoreConfig.profiles.nameInvalid', {
          defaultValue: 'Names use letters, digits, - and _ only (max 64).',
        })
      );
      return;
    }
    setBusy(true);
    try {
      const r =
        modal?.mode === 'clone' && modal.from
          ? await ipcBridge.wcoreProfiles.clone.invoke({ from: modal.from, to: target })
          : await ipcBridge.wcoreProfiles.create.invoke({ name: target });
      if (r.ok) {
        setModal(null);
        setName('');
        await refresh();
      } else {
        Message.error(r.error ?? t('settings.wcoreConfig.profiles.createFailed', { defaultValue: 'Failed.' }));
      }
    } finally {
      setBusy(false);
    }
  }, [modal, name, refresh, t]);

  return (
    <div className={styles.pane}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>Wayland Core</div>
        <h1 className={styles.title}>{t('settings.wcoreConfig.rail.profiles', { defaultValue: 'Profiles' })}</h1>
        <p className={styles.sub}>
          {t('settings.wcoreConfig.profiles.subtitle', {
            defaultValue:
              'Directory-isolated configurations. Each profile carries its own model, tools, keys, skills and memory, so you switch context instantly without cross-contamination.',
          })}
        </p>
        <ScopeLabel />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>
            {t('settings.wcoreConfig.profiles.yourProfiles', { defaultValue: 'Your Profiles' })}
          </span>
          <span className={styles.pill}>{profiles.length}</span>
          <span className={styles.sectionHeadLine} />
        </div>
        <div className={styles.group}>
          {profiles.map((p) => (
            <div key={p.name} className={styles.profile}>
              <div>
                <div className={styles.profileName}>
                  {p.name}
                  {p.active && (
                    <span className={`${styles.badge} ${styles.ok}`}>
                      <span className={styles.bd} />
                      {t('settings.wcoreConfig.profiles.active', { defaultValue: 'Active' })}
                    </span>
                  )}
                </div>
                <div className={styles.profilePath}>{p.dir ? tildify(p.dir) : `~/.wayland/profiles/${p.name}`}</div>
                {(p.model || p.tools !== undefined || p.skills !== undefined || p.updatedAt) && (
                  <div className={styles.statChipsRow}>
                    {p.model && (
                      <span className={styles.statChip}>
                        <Cpu size={11} />
                        <b>{p.model}</b>
                      </span>
                    )}
                    {p.tools !== undefined && (
                      <span className={styles.statChip}>
                        <Wrench size={11} />
                        {t('settings.wcoreConfig.profiles.toolsChip', {
                          defaultValue: '{{count}} tools',
                          count: p.tools,
                        })}
                      </span>
                    )}
                    {p.skills !== undefined && (
                      <span className={styles.statChip}>
                        <Sparkles size={11} />
                        {t('settings.wcoreConfig.profiles.skillsChip', {
                          defaultValue: '{{count}} skills',
                          count: p.skills,
                        })}
                      </span>
                    )}
                    {p.updatedAt && (
                      <span className={styles.statChip}>
                        <Clock size={11} />
                        {relativeTime(p.updatedAt)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className={styles.profileActions}>
                {!p.active && (
                  <Button type='primary' size='small' onClick={() => void activate(p.name)}>
                    {t('settings.wcoreConfig.profiles.activate', { defaultValue: 'Activate' })}
                  </Button>
                )}
                <Button size='small' onClick={() => setModal({ mode: 'clone', from: p.name })}>
                  {t('settings.wcoreConfig.profiles.clone', { defaultValue: 'Clone' })}
                </Button>
                {p.name !== 'default' && (
                  <Button size='small' status='danger' onClick={() => void removeProfile(p.name)}>
                    {t('settings.wcoreConfig.profiles.delete', { defaultValue: 'Delete' })}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.rowActions}>
          <Button
            type='primary'
            icon={<Plus size={14} />}
            onClick={() => {
              setName('');
              setModal({ mode: 'new' });
            }}
          >
            {t('settings.wcoreConfig.profiles.newProfile', { defaultValue: 'New profile' })}
          </Button>
        </div>
      </div>

      <Modal
        visible={modal !== null}
        title={
          modal?.mode === 'clone'
            ? t('settings.wcoreConfig.profiles.cloneTitle', { defaultValue: 'Clone profile' })
            : t('settings.wcoreConfig.profiles.newTitle', { defaultValue: 'New profile' })
        }
        onCancel={() => setModal(null)}
        onOk={() => void submit()}
        confirmLoading={busy}
        okText={t('settings.wcoreConfig.profiles.createOk', { defaultValue: 'Create' })}
      >
        {modal?.mode === 'clone' && (
          <p className={styles.lrDesc} style={{ marginBottom: 10 }}>
            {t('settings.wcoreConfig.profiles.cloningFrom', {
              defaultValue: 'Cloning from “{{from}}”.',
              from: modal.from,
            })}
          </p>
        )}
        <Input
          value={name}
          onChange={setName}
          onPressEnter={() => void submit()}
          autoFocus
          placeholder={t('settings.wcoreConfig.profiles.namePlaceholder', { defaultValue: 'profile-name' })}
        />
      </Modal>
    </div>
  );
};

export default ProfilesPane;
