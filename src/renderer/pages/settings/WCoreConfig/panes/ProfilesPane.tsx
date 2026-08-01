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
import styles from './Panes.module.css';

/** Mirror of the main-process sanitizer for instant client-side validation. */
const PROFILE_NAME_RE = /^[A-Za-z0-9._-]{1,64}$/;
const WINDOWS_RESERVED = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  ...Array.from({ length: 10 }, (_, index) => `COM${index}`),
  ...Array.from({ length: 10 }, (_, index) => `LPT${index}`),
]);

function isValidProfileName(name: string): boolean {
  const stem = name.split('.')[0]?.toUpperCase() ?? '';
  return (
    PROFILE_NAME_RE.test(name) &&
    !name.startsWith('.') &&
    !name.startsWith('-') &&
    !name.endsWith('.') &&
    !/^\.+$/.test(name) &&
    name.toLowerCase() !== 'active' &&
    !WINDOWS_RESERVED.has(stem)
  );
}

function failureMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

const profileSelector = (profile: IWcoreProfile) =>
  profile.kind === 'native' ? ({ kind: 'native' } as const) : ({ kind: 'named', name: profile.name } as const);

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ mode: 'new' | 'clone'; from?: IWcoreProfile } | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const activeMarkerNeedsRepair = profiles.length > 0 && profiles.every((profile) => !profile.active);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const list = await ipcBridge.wcoreProfiles.list.invoke();
      if (list.ok === true) {
        setProfiles(list.profiles);
        setLoadError(null);
        return;
      }
      setProfiles([]);
      setLoadError(list.error);
    } catch (error) {
      setProfiles([]);
      setLoadError(
        failureMessage(
          error,
          t('settings.wcoreConfig.profiles.loadFailed', { defaultValue: 'Could not load profiles.' })
        )
      );
    }
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activate = useCallback(
    async (profile: IWcoreProfile): Promise<void> => {
      try {
        const r = await ipcBridge.wcoreProfiles.activate.invoke({ selector: profileSelector(profile) });
        if (r.ok) await refresh();
        else Message.error(r.error ?? t('settings.wcoreConfig.profiles.activateFailed', { defaultValue: 'Failed.' }));
      } catch (error) {
        Message.error(
          failureMessage(
            error,
            t('settings.wcoreConfig.profiles.activateFailed', { defaultValue: 'Could not activate profile.' })
          )
        );
      }
    },
    [refresh, t]
  );

  const archiveProfile = useCallback(
    async (profile: IWcoreProfile): Promise<void> => {
      if (profile.kind !== 'named') return;
      try {
        const r = await ipcBridge.wcoreProfiles.remove.invoke({ kind: 'named', name: profile.name });
        if (r.ok) await refresh();
        else Message.error(r.error ?? t('settings.wcoreConfig.profiles.archiveFailed', { defaultValue: 'Failed.' }));
      } catch (error) {
        Message.error(
          failureMessage(
            error,
            t('settings.wcoreConfig.profiles.archiveFailed', { defaultValue: 'Could not archive profile.' })
          )
        );
      }
    },
    [refresh, t]
  );

  const confirmArchive = useCallback(
    (profile: IWcoreProfile): void => {
      if (profile.kind !== 'named') return;
      Modal.confirm({
        title: t('settings.wcoreConfig.profiles.archiveTitle', { defaultValue: 'Archive profile?' }),
        content: t('settings.wcoreConfig.profiles.archiveBody', {
          defaultValue:
            '“{{name}}” will be moved to Wayland Core’s local profile archive. Running conversations are not interrupted.',
          name: profile.name,
        }),
        okText: t('settings.wcoreConfig.profiles.archive', { defaultValue: 'Archive' }),
        cancelText: t('common.cancel', { defaultValue: 'Cancel' }),
        okButtonProps: { status: 'danger' },
        onOk: () => archiveProfile(profile),
      });
    },
    [archiveProfile, t]
  );

  const submit = useCallback(async (): Promise<void> => {
    const target = name.trim();
    if (!isValidProfileName(target)) {
      Message.error(
        t('settings.wcoreConfig.profiles.nameInvalid', {
          defaultValue: 'Use 1-64 letters, digits, dots, dashes or underscores; reserved system names are unavailable.',
        })
      );
      return;
    }
    setBusy(true);
    try {
      const r =
        modal?.mode === 'clone' && modal.from
          ? await ipcBridge.wcoreProfiles.clone.invoke({ from: profileSelector(modal.from), to: target })
          : await ipcBridge.wcoreProfiles.create.invoke({ name: target });
      if (r.ok) {
        setModal(null);
        setName('');
        await refresh();
      } else {
        Message.error(r.error ?? t('settings.wcoreConfig.profiles.createFailed', { defaultValue: 'Failed.' }));
      }
    } catch (error) {
      Message.error(
        failureMessage(
          error,
          t('settings.wcoreConfig.profiles.createFailed', { defaultValue: 'Could not create profile.' })
        )
      );
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
              'Directory-isolated Wayland Core configurations. Activation applies to new conversations; conversations already running keep the profile they started with.',
          })}
        </p>
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
          {loadError && <div className={styles.updateError}>{loadError}</div>}
          {activeMarkerNeedsRepair && (
            <div className={styles.updateError} role='alert'>
              {t('settings.wcoreConfig.profiles.activeMarkerNeedsRepair', {
                defaultValue:
                  'The active-profile marker is invalid or unreadable. Nothing was activated automatically. Choose Activate on Default or another healthy profile to repair it.',
              })}
            </div>
          )}
          {profiles.map((p) => (
            <div key={`${p.kind}:${p.name}`} className={styles.profile}>
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
                <div className={styles.profilePath}>
                  {p.dir
                    ? tildify(p.dir)
                    : t('settings.wcoreConfig.profiles.pathUnavailable', { defaultValue: 'Path unavailable' })}
                </div>
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
                  <Button type='primary' size='small' onClick={() => void activate(p)}>
                    {t('settings.wcoreConfig.profiles.activate', { defaultValue: 'Activate' })}
                  </Button>
                )}
                <Button size='small' onClick={() => setModal({ mode: 'clone', from: p })}>
                  {t('settings.wcoreConfig.profiles.clone', { defaultValue: 'Clone' })}
                </Button>
                {p.kind === 'named' && (
                  <Button size='small' status='danger' onClick={() => confirmArchive(p)}>
                    {t('settings.wcoreConfig.profiles.archive', { defaultValue: 'Archive' })}
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
          <>
            <p className={styles.lrDesc} style={{ marginBottom: 10 }}>
              {t('settings.wcoreConfig.profiles.cloningFrom', {
                defaultValue: 'Cloning configuration and skills from “{{from}}”.',
                from: modal.from?.name,
              })}
            </p>
            <p className={styles.lrDesc} style={{ marginBottom: 10 }}>
              {t('settings.wcoreConfig.profiles.cloneSecurityNote', {
                defaultValue:
                  'Vaults, history and structured credentials are not copied. User-authored skill files are copied verbatim; review them if you may have embedded secrets.',
              })}
            </p>
          </>
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
