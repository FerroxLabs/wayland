import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, CheckCircle2, Copy, RefreshCw, Trash2, XCircle } from 'lucide-react';
import { Button, Dropdown, Empty, Input, Menu, Message, Spin, Tooltip } from '@arco-design/web-react';
import { channel, acpConversation } from '@/common/adapter/ipcBridge';
import { ConfigStorage } from '@/common/config/storage';
import type { IChannelPairingRequest, IChannelPluginStatus, IChannelUser } from '@process/channels/types';
import GeminiModelSelector from '@/renderer/pages/conversation/platforms/gemini/GeminiModelSelector';
import { useChannelModelSelection } from '@renderer/hooks/settings/useChannelModelSelection';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const TelegramSetup: React.FC = () => {
  const { t } = useTranslation();
  const modelSelection = useChannelModelSelection('assistant.telegram.defaultModel');
  const telegramTokenRef = useRef('');

  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);
  const [telegramToken, setTelegramToken] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [pendingPairings, setPendingPairings] = useState<IChannelPairingRequest[]>([]);
  const [authorizedUsers, setAuthorizedUsers] = useState<IChannelUser[]>([]);
  const [availableAgents, setAvailableAgents] = useState<
    Array<{ backend: string; name: string; customAgentId?: string }>
  >([]);
  const [selectedAgent, setSelectedAgent] = useState<{ backend: string; name?: string; customAgentId?: string }>({
    backend: 'gemini',
  });

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'telegram') ?? null);
      }
    } catch (error) {
      console.error('[TelegramSetup] loadStatus failed:', error);
    }
  }, []);

  const loadPendingPairings = useCallback(async () => {
    setPairingLoading(true);
    try {
      const result = await channel.getPendingPairings.invoke();
      if (result.success && result.data) {
        setPendingPairings(result.data.filter((p) => p.platformType === 'telegram'));
      }
    } finally {
      setPairingLoading(false);
    }
  }, []);

  const loadAuthorizedUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const result = await channel.getAuthorizedUsers.invoke();
      if (result.success && result.data) {
        setAuthorizedUsers(result.data.filter((u) => u.platformType === 'telegram'));
      }
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
    void loadPendingPairings();
    void loadAuthorizedUsers();
  }, [loadStatus, loadPendingPairings, loadAuthorizedUsers]);

  useEffect(() => {
    const load = async () => {
      try {
        const [agentsResp, saved] = await Promise.all([
          acpConversation.getAvailableAgents.invoke(),
          ConfigStorage.get('assistant.telegram.agent'),
        ]);
        if (agentsResp.success && agentsResp.data) {
          setAvailableAgents(
            agentsResp.data.filter((a) => !a.isPreset).map((a) => ({ backend: a.backend, name: a.name, customAgentId: a.customAgentId }))
          );
        }
        if (saved && typeof saved === 'object' && 'backend' in saved) {
          const s = saved as { backend: string; customAgentId?: string; name?: string };
          setSelectedAgent({ backend: s.backend, customAgentId: s.customAgentId, name: s.name });
        }
      } catch (error) {
        console.error('[TelegramSetup] loadAgents failed:', error);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'telegram') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = channel.pairingRequested.on((req) => {
      if (req.platformType !== 'telegram') return;
      setPendingPairings((prev) => (prev.some((p) => p.code === req.code) ? prev : [req, ...prev]));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = channel.userAuthorized.on((user) => {
      if (user.platformType !== 'telegram') return;
      setAuthorizedUsers((prev) => (prev.some((u) => u.id === user.id) ? prev : [user, ...prev]));
      setPendingPairings((prev) => prev.filter((p) => p.platformUserId !== user.platformUserId));
    });
    return () => unsub();
  }, []);

  const persistSelectedAgent = async (agent: { backend: string; customAgentId?: string; name?: string }) => {
    try {
      await ConfigStorage.set('assistant.telegram.agent', agent);
      await channel.syncChannelSettings
        .invoke({ platform: 'telegram', agent })
        .catch((err) => console.warn('[TelegramSetup] syncChannelSettings failed:', err));
      Message.success(t('settings.assistant.agentSwitched', 'Agent switched successfully'));
    } catch {
      Message.error(t('common.saveFailed', 'Failed to save'));
    }
  };

  const handleTestConnection = async () => {
    if (!telegramToken.trim()) {
      Message.warning(t('settings.assistant.tokenRequired', 'Please enter a bot token'));
      return;
    }
    setTestLoading(true);
    try {
      const result = await channel.testPlugin.invoke({ pluginId: 'telegram_default', token: telegramToken.trim() });
      if (result.success && result.data?.success) {
        Message.success(t('settings.assistant.connectionSuccess', `Connected! Bot: @${result.data.botUsername ?? 'unknown'}`));
        const enableResult = await channel.enablePlugin.invoke({
          pluginId: 'telegram_default',
          config: { token: telegramToken.trim() },
        });
        if (enableResult.success) {
          Message.success(t('settings.assistant.pluginEnabled', 'Telegram bot enabled'));
          await loadStatus();
        }
      } else {
        Message.error(result.data?.error ?? t('settings.assistant.connectionFailed', 'Connection failed'));
      }
    } catch (error) {
      Message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setTestLoading(false);
    }
  };

  const handleApprovePairing = async (code: string) => {
    const result = await channel.approvePairing.invoke({ code });
    if (result.success) {
      Message.success(t('settings.assistant.pairingApproved', 'Pairing approved'));
      await Promise.all([loadPendingPairings(), loadAuthorizedUsers()]);
    } else {
      Message.error(result.msg ?? t('settings.assistant.approveFailed', 'Failed to approve pairing'));
    }
  };

  const handleRejectPairing = async (code: string) => {
    const result = await channel.rejectPairing.invoke({ code });
    if (result.success) {
      Message.info(t('settings.assistant.pairingRejected', 'Pairing rejected'));
      await loadPendingPairings();
    } else {
      Message.error(result.msg ?? t('settings.assistant.rejectFailed', 'Failed to reject pairing'));
    }
  };

  const handleRevokeUser = async (userId: string) => {
    const result = await channel.revokeUser.invoke({ userId });
    if (result.success) {
      Message.success(t('settings.assistant.userRevoked', 'User access revoked'));
      await loadAuthorizedUsers();
    } else {
      Message.error(result.msg ?? t('settings.assistant.revokeFailed', 'Failed to revoke user'));
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    Message.success(t('common.copySuccess', 'Copied'));
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleString();
  const getRemainingTime = (expiresAt: number) =>
    `${Math.max(0, Math.ceil((expiresAt - Date.now()) / 60000))} min`;

  const isGeminiAgent = selectedAgent.backend === 'gemini' || selectedAgent.backend === 'wcore';
  const agentOptions = availableAgents.length > 0 ? availableAgents : [{ backend: 'gemini', name: 'Gemini CLI' }];
  const hasExistingUsers = authorizedUsers.length > 0;

  return (
    <ChannelDetailLayout
      channelId='telegram'
      displayName='Telegram'
      helpText={t('settings.channels.telegram.help', 'Chat with your Wayland AI assistant via Telegram. Create a bot with @BotFather to get started.')}
    >
      {/* Bot Token */}
      <div className='flex items-center justify-between gap-24px py-12px'>
        <div className='flex-1'>
          <span className='text-14px text-t-primary'>{t('settings.assistant.botToken', 'Bot Token')}</span>
          <div className='text-12px text-t-tertiary mt-2px'>
            {t('settings.assistant.botTokenDesc', 'Open Telegram, find @BotFather and send /newbot to get your Bot Token.')}
          </div>
        </div>
        <div className='flex items-center gap-8px'>
          <Input.Password
            value={telegramToken}
            onChange={(v) => {
              setTelegramToken(v);
              telegramTokenRef.current = v;
            }}
            placeholder={hasExistingUsers || pluginStatus?.hasToken ? '••••••••••••••••' : '123456:ABC-DEF...'}
            style={{ width: 240 }}
            visibilityToggle
            disabled={hasExistingUsers}
          />
          <Button type='outline' loading={testLoading} onClick={() => void handleTestConnection()} disabled={hasExistingUsers}>
            {t('settings.assistant.testConnection', 'Test')}
          </Button>
        </div>
      </div>

      {/* Agent */}
      <div className='flex items-center justify-between gap-24px py-12px'>
        <div className='flex-1'>
          <span className='text-14px text-t-primary'>{t('settings.agent', 'Agent')}</span>
          <div className='text-12px text-t-tertiary mt-2px'>
            {t('settings.assistant.agentDescTelegram', 'Used for Telegram conversations')}
          </div>
        </div>
        <Dropdown
          trigger='click'
          position='br'
          droplist={
            <Menu selectedKeys={[selectedAgent.customAgentId ? `${selectedAgent.backend}|${selectedAgent.customAgentId}` : selectedAgent.backend]}>
              {agentOptions.map((a) => {
                const key = a.customAgentId ? `${a.backend}|${a.customAgentId}` : a.backend;
                return (
                  <Menu.Item
                    key={key}
                    onClick={() => {
                      const next = { backend: a.backend, customAgentId: a.customAgentId, name: a.name };
                      setSelectedAgent(next);
                      void persistSelectedAgent(next);
                    }}
                  >
                    {a.name}
                  </Menu.Item>
                );
              })}
            </Menu>
          }
        >
          <Button type='secondary' className='min-w-160px flex items-center justify-between gap-8px'>
            <span className='truncate'>{selectedAgent.name ?? selectedAgent.backend}</span>
            <ChevronDown size={14} />
          </Button>
        </Dropdown>
      </div>

      {/* Default Model */}
      <div className='flex items-center justify-between gap-24px py-12px'>
        <div className='flex-1'>
          <span className='text-14px text-t-primary'>{t('settings.assistant.defaultModel', 'Default Model')}</span>
          <div className='text-12px text-t-tertiary mt-2px'>
            {t('settings.assistant.defaultModelDesc', 'Model used for Telegram conversations')}
          </div>
        </div>
        <GeminiModelSelector
          selection={isGeminiAgent ? modelSelection : undefined}
          disabled={!isGeminiAgent}
          label={!isGeminiAgent ? t('settings.assistant.autoFollowCliModel', 'Auto-follow CLI model') : undefined}
          variant='settings'
        />
      </div>

      {/* Pending Pairings */}
      {pluginStatus?.enabled && !hasExistingUsers && (
        <div className='bg-fill-1 rd-12px p-16px'>
          <div className='flex items-center justify-between mb-12px'>
            <h3 className='text-14px font-500 text-t-primary m-0'>{t('settings.assistant.pendingPairings', 'Pending Pairing Requests')}</h3>
            <Button size='mini' type='text' icon={<RefreshCw size={14} />} loading={pairingLoading} onClick={() => void loadPendingPairings()}>
              {t('common.refresh', 'Refresh')}
            </Button>
          </div>
          {pairingLoading ? (
            <div className='flex justify-center py-24px'><Spin /></div>
          ) : pendingPairings.length === 0 ? (
            <Empty description={t('settings.assistant.noPendingPairings', 'No pending pairing requests')} />
          ) : (
            <div className='flex flex-col gap-12px'>
              {pendingPairings.map((pairing) => (
                <div key={pairing.code} className='flex items-center justify-between bg-fill-2 rd-8px p-12px'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-8px'>
                      <span className='text-14px font-500 text-t-primary'>{pairing.displayName ?? 'Unknown User'}</span>
                      <Tooltip content={t('settings.assistant.copyCode', 'Copy pairing code')}>
                        <Button type='text' size='mini' icon={<Copy size={14} />} onClick={() => copyToClipboard(pairing.code)} />
                      </Tooltip>
                    </div>
                    <div className='text-12px text-t-tertiary mt-4px'>
                      {t('settings.assistant.pairingCode', 'Code')}: <code className='bg-fill-3 px-4px rd-2px'>{pairing.code}</code>
                      <span className='mx-8px'>|</span>
                      {t('settings.assistant.expiresIn', 'Expires in')}: {getRemainingTime(pairing.expiresAt)}
                    </div>
                  </div>
                  <div className='flex items-center gap-8px'>
                    <Button type='primary' size='small' icon={<CheckCircle2 size={14} />} onClick={() => void handleApprovePairing(pairing.code)}>
                      {t('settings.assistant.approve', 'Approve')}
                    </Button>
                    <Button type='secondary' size='small' status='danger' icon={<XCircle size={14} />} onClick={() => void handleRejectPairing(pairing.code)}>
                      {t('settings.assistant.reject', 'Reject')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Authorized Users */}
      {hasExistingUsers && (
        <div className='bg-fill-1 rd-12px p-16px'>
          <div className='flex items-center justify-between mb-12px'>
            <h3 className='text-14px font-500 text-t-primary m-0'>{t('settings.assistant.authorizedUsers', 'Authorized Users')}</h3>
            <Button size='mini' type='text' icon={<RefreshCw size={14} />} loading={usersLoading} onClick={() => void loadAuthorizedUsers()}>
              {t('common.refresh', 'Refresh')}
            </Button>
          </div>
          {usersLoading ? (
            <div className='flex justify-center py-24px'><Spin /></div>
          ) : (
            <div className='flex flex-col gap-12px'>
              {authorizedUsers.map((user) => (
                <div key={user.id} className='flex items-center justify-between bg-fill-2 rd-8px p-12px'>
                  <div className='flex-1'>
                    <div className='text-14px font-500 text-t-primary'>{user.displayName ?? 'Unknown User'}</div>
                    <div className='text-12px text-t-tertiary mt-4px'>
                      {t('settings.assistant.authorizedAt', 'Authorized')}: {formatTime(user.authorizedAt)}
                    </div>
                  </div>
                  <Tooltip content={t('settings.assistant.revokeAccess', 'Revoke access')}>
                    <Button type='text' status='danger' size='small' icon={<Trash2 size={16} />} onClick={() => void handleRevokeUser(user.id)} />
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ChannelDetailLayout>
  );
};

export default TelegramSetup;
