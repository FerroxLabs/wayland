import { Input, Switch } from '@arco-design/web-react';
import { Bell, Volume2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import { ConfigStorage } from '@/common/config/storage';
import { Card, PreferenceRow } from '@renderer/components/settings/shared';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import { DEFAULT_QUIET_HOURS } from '@/common/config/notificationDefaults';

type State = {
  master: boolean;
  scheduledTask: boolean;
  agentFinished: boolean;
  agentError: boolean;
  channelMessage: boolean;
  playSound: boolean;
  quietStart: string;
  quietEnd: string;
};

const DEFAULTS: State = {
  master: true,
  scheduledTask: false,
  agentFinished: true,
  agentError: true,
  channelMessage: false,
  playSound: true,
  // Shared with the notifier so the shown default and the effective default match.
  quietStart: DEFAULT_QUIET_HOURS.start,
  quietEnd: DEFAULT_QUIET_HOURS.end,
};

const NotificationsSettings: React.FC = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<State>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      ipcBridge.systemSettings.getNotificationEnabled.invoke(),
      ipcBridge.systemSettings.getCronNotificationEnabled.invoke(),
      ConfigStorage.get('notifications.agentFinished'),
      ConfigStorage.get('notifications.agentError'),
      ConfigStorage.get('notifications.channelMessage'),
      ConfigStorage.get('notifications.playSound'),
      ConfigStorage.get('notifications.quietHours'),
    ])
      .then(([master, scheduled, agentFin, agentErr, channelMsg, sound, quiet]) => {
        if (cancelled) return;
        setState({
          master: master ?? DEFAULTS.master,
          scheduledTask: scheduled ?? DEFAULTS.scheduledTask,
          agentFinished: agentFin ?? DEFAULTS.agentFinished,
          agentError: agentErr ?? DEFAULTS.agentError,
          channelMessage: channelMsg ?? DEFAULTS.channelMessage,
          playSound: sound ?? DEFAULTS.playSound,
          quietStart: quiet?.start ?? DEFAULTS.quietStart,
          quietEnd: quiet?.end ?? DEFAULTS.quietEnd,
        });
        setLoaded(true);
      })
      .catch((err) => {
        console.error('[NotificationsSettings] load failed:', err);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMaster = useCallback(async (enabled: boolean) => {
    setState((s) => ({ ...s, master: enabled }));
    try {
      await ipcBridge.systemSettings.setNotificationEnabled.invoke({ enabled });
    } catch (err) {
      console.error('[NotificationsSettings] master toggle failed:', err);
    }
  }, []);

  const handleScheduled = useCallback(async (enabled: boolean) => {
    setState((s) => ({ ...s, scheduledTask: enabled }));
    try {
      await ipcBridge.systemSettings.setCronNotificationEnabled.invoke({ enabled });
    } catch (err) {
      console.error('[NotificationsSettings] scheduled toggle failed:', err);
    }
  }, []);

  const persist = useCallback(
    <K extends 'agentFinished' | 'agentError' | 'channelMessage' | 'playSound'>(key: K, value: boolean) => {
      setState((s) => ({ ...s, [key]: value }));
      const storageKey = `notifications.${key}` as const;
      void ConfigStorage.set(storageKey, value).catch((err) => {
        console.error('[NotificationsSettings] persist failed:', storageKey, err);
      });
    },
    []
  );

  const persistQuiet = useCallback((field: 'start' | 'end', value: string) => {
    setState((s) => {
      const next = { ...s, [field === 'start' ? 'quietStart' : 'quietEnd']: value };
      void ConfigStorage.set('notifications.quietHours', { start: next.quietStart, end: next.quietEnd }).catch(
        (err) => {
          console.error('[NotificationsSettings] quiet hours persist failed:', err);
        }
      );
      return next;
    });
  }, []);

  const disabled = !state.master;

  return (
    <SettingsPageShell
      title={t('settings.notificationsPage.title', 'Notifications')}
      subtitle={t('settings.notificationsPage.subtitle', 'When and how Wayland alerts you.')}
    >
      <Card title={t('settings.notificationsPage.systemTitle', 'System notifications')} titleIcon={Bell}>
        <PreferenceRow
          label={t('settings.notificationsPage.master', 'Master switch')}
          help={t(
            'settings.notificationsPage.masterHelp',
            'When off, Wayland sends no system notifications. Other rules below are ignored.'
          )}
        >
          <Switch checked={state.master} loading={!loaded} onChange={handleMaster} />
        </PreferenceRow>
        <PreferenceRow
          label={t('settings.notificationsPage.agentFinished', 'Notify when agent finishes')}
          help={t(
            'settings.notificationsPage.agentFinishedHelp',
            'Fires when a long-running task or team launcher completes.'
          )}
        >
          <Switch checked={state.agentFinished} disabled={disabled} onChange={(v) => persist('agentFinished', v)} />
        </PreferenceRow>
        <PreferenceRow
          label={t('settings.notificationsPage.scheduledTask', 'Notify on scheduled task fire')}
          help={t('settings.notificationsPage.scheduledTaskHelp', 'Cron-style tasks notify when they run.')}
        >
          <Switch checked={state.scheduledTask} disabled={disabled} onChange={handleScheduled} />
        </PreferenceRow>
        <PreferenceRow
          label={t('settings.notificationsPage.agentError', 'Notify on agent error')}
          help={t('settings.notificationsPage.agentErrorHelp', 'Failures, timeouts, lost connections.')}
        >
          <Switch checked={state.agentError} disabled={disabled} onChange={(v) => persist('agentError', v)} />
        </PreferenceRow>
        <PreferenceRow
          label={t('settings.notificationsPage.channelMessage', 'Notify on channel message')}
          help={t(
            'settings.notificationsPage.channelMessageHelp',
            'Telegram / Lark / DingTalk / WeChat messages from connected channels.'
          )}
        >
          <Switch checked={state.channelMessage} disabled={disabled} onChange={(v) => persist('channelMessage', v)} />
        </PreferenceRow>
      </Card>

      <Card title={t('settings.notificationsPage.soundTitle', 'Sound')} titleIcon={Volume2}>
        <PreferenceRow
          label={t('settings.notificationsPage.playSound', 'Play sound on notification')}
          help={t('settings.notificationsPage.playSoundHelp', 'Uses the system default sound.')}
        >
          <Switch checked={state.playSound} disabled={disabled} onChange={(v) => persist('playSound', v)} />
        </PreferenceRow>
        <PreferenceRow
          label={t('settings.notificationsPage.quietHours', 'Quiet hours')}
          help={t('settings.notificationsPage.quietHoursHelp', 'Suppress sound between these times.')}
        >
          <div className='flex items-center gap-6px'>
            <Input
              value={state.quietStart}
              onChange={(v) => persistQuiet('start', v)}
              disabled={disabled}
              placeholder='22:00'
              style={{ width: 72, textAlign: 'center' }}
              size='small'
            />
            <span className='text-12px text-[var(--text-muted)]'>-</span>
            <Input
              value={state.quietEnd}
              onChange={(v) => persistQuiet('end', v)}
              disabled={disabled}
              placeholder='07:00'
              style={{ width: 72, textAlign: 'center' }}
              size='small'
            />
          </div>
        </PreferenceRow>
      </Card>
    </SettingsPageShell>
  );
};

export default NotificationsSettings;
