/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IProject } from '@/common/types/project';
import type { TChatConversation } from '@/common/config/storage';
import { Button, Dropdown, Input, Menu, Message, Modal } from '@arco-design/web-react';
import {
  ChevronLeft,
  FolderMinus,
  FolderOpen,
  MessageSquare,
  MessageSquarePlus,
  MoreHorizontal,
  NotebookPen,
  Paperclip,
  Pencil,
  Pin,
  PinOff,
  Settings as SettingsIcon,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { isConversationPinned } from '@/renderer/pages/conversation/GroupedHistory/utils/groupingHelpers';
import ProjectFilesPanel from './components/ProjectFilesPanel';
import ProjectSettingsDrawer, { type SettingsSection } from './components/ProjectSettingsDrawer';
import ProjectReferencePanel from './components/ProjectReferencePanel';
import ProjectMemoryPanel from './components/ProjectMemoryPanel';
import styles from './components/projectCards.module.css';

type ProjectTab = 'chats' | 'files' | 'reference' | 'memory';

/** Strip seeded heading/blockquote boilerplate to decide if instructions are real. */
const hasContent = (raw: string): boolean =>
  raw
    .split('\n')
    .filter((l) => {
      const t = l.trim();
      return !t.startsWith('>') && !/^#\s/.test(t);
    })
    .join('')
    .trim().length > 0;

/**
 * Per-project workspace. The umbrella view: every chat under this project plus a
 * cohesive set of tabs (Chats / Files / Reference / Memory). Instructions and
 * Rules live in Project Settings (a right drawer) because they are injected into
 * every chat - surfaced via a header "Setup" affordance, not buried. No
 * execution lock: many chats can run at once, so nothing here disables.
 */
const ProjectWorkspacePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<IProject | null>(null);
  const [conversations, setConversations] = useState<TChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProjectTab>('chats');

  const [canGenerate, setCanGenerate] = useState(false);
  const [setupReady, setSetupReady] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const [proj, convs] = await Promise.all([
        ipcBridge.project.get.invoke({ id: projectId }),
        ipcBridge.project.getConversations.invoke({ projectId }),
      ]);
      setProject(proj);
      setConversations(Array.isArray(convs) ? convs : []);
      // Readiness + AI gating (best-effort; never blocks the page).
      const [knowledge, hasModel] = await Promise.all([
        ipcBridge.project.readKnowledge.invoke({ id: projectId }),
        ipcBridge.project.hasUsableModel.invoke(),
      ]);
      setSetupReady(hasContent(knowledge.context || ''));
      setCanGenerate(!!hasModel);
    } catch (err) {
      console.error('[ProjectWorkspacePage] load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
    const unsub = ipcBridge.project.changed.on(() => void load());
    return () => unsub();
  }, [load]);

  const startNewChat = () => {
    navigate('/guid', {
      state: { projectId, projectName: project?.name, projectWorkspace: project?.workspace },
    });
  };

  const removeFromProject = (conversationId: string) => {
    Modal.confirm({
      title: t('projects.removeChat.title'),
      content: t('projects.removeChat.body'),
      okText: t('projects.removeChat.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await ipcBridge.project.removeConversation.invoke({ conversationId });
          Message.success(t('projects.toast.chatRemoved'));
        } catch {
          Message.error(t('projects.toast.saveFailed'));
        }
      },
    });
  };

  // Pin/unpin a project chat - mirrors the sidebar history toggle (extra.pinnedAt).
  const togglePin = useCallback(
    async (c: TChatConversation) => {
      const pinned = isConversationPinned(c);
      try {
        await ipcBridge.conversation.update.invoke({
          id: c.id,
          updates: {
            extra: { pinned: !pinned, pinnedAt: pinned ? undefined : Date.now() } as Partial<TChatConversation['extra']>,
          } as Partial<TChatConversation>,
          mergeExtra: true,
        });
        void load();
      } catch {
        Message.error(t('projects.toast.saveFailed'));
      }
    },
    [load, t]
  );

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  const openRename = (c: TChatConversation) => {
    setRenameId(c.id);
    setRenameName(c.name || '');
  };

  const confirmRename = async () => {
    const id = renameId;
    const name = renameName.trim();
    if (!id || !name) return;
    setRenameLoading(true);
    try {
      await ipcBridge.conversation.update.invoke({ id, updates: { name } });
      setRenameId(null);
      void load();
    } catch {
      Message.error(t('projects.toast.saveFailed'));
    } finally {
      setRenameLoading(false);
    }
  };

  const openSettings = (section: SettingsSection) => setSettingsSection(section);
  const color = project?.iconColor || '#FF6A00';

  const TABS: Array<{ key: ProjectTab; label: string; icon: React.ReactNode; count?: number }> = [
    { key: 'chats', label: t('projects.workspace.tabChats'), icon: <MessageSquare size={15} />, count: conversations.length },
    { key: 'files', label: t('projects.workspace.tabFiles'), icon: <FolderOpen size={15} /> },
    { key: 'reference', label: t('projects.workspace.tabReference'), icon: <Paperclip size={15} /> },
    { key: 'memory', label: t('projects.workspace.tabMemory'), icon: <NotebookPen size={15} /> },
  ];

  return (
    <div className='flex flex-col h-full w-full overflow-hidden'>
      {/* Header */}
      <div
        className='flex items-center gap-12px px-24px py-16px flex-shrink-0'
        style={{ borderBottom: '1px solid var(--color-border-2)' }}
      >
        <Button type='text' shape='circle' icon={<ChevronLeft size={18} />} onClick={() => navigate('/projects')} />
        <div
          className='flex items-center justify-center w-36px h-36px rd-9px flex-shrink-0'
          style={{ background: `${color}1a`, color }}
        >
          <FolderOpen size={18} />
        </div>
        <div className='flex flex-col gap-1px min-w-0 flex-1'>
          <div className='text-16px font-700 text-t-primary truncate'>
            {project?.name || t('projects.workspace.loading')}
          </div>
          {project?.description && <div className='text-12px text-t-secondary truncate'>{project.description}</div>}
        </div>

        {/* Setup readiness pill - opens Settings on Instructions */}
        {project && (
          <button
            type='button'
            onClick={() => openSettings('context')}
            className='flex items-center gap-7px px-12px py-7px rd-full bg-transparent cursor-pointer text-12.5px font-600 transition-colors'
            style={{
              border: '1px solid var(--color-border-2)',
              color: setupReady ? 'var(--color-success-6)' : 'var(--color-text-1)',
            }}
          >
            <span
              className='block w-8px h-8px rd-full'
              style={{
                background: setupReady ? 'var(--color-success-6)' : 'var(--color-primary-6)',
                boxShadow: `0 0 0 3px ${setupReady ? 'var(--color-success-light-1)' : 'var(--color-primary-light-1)'}`,
              }}
            />
            {setupReady ? t('projects.workspace.setupDone') : t('projects.workspace.setupTodo')}
          </button>
        )}
        <Button type='text' icon={<SettingsIcon size={15} />} onClick={() => openSettings('general')}>
          {t('projects.workspace.settings')}
        </Button>
        <Button type='primary' onClick={startNewChat}>
          <span className='flex items-center gap-6px'>
            <MessageSquarePlus size={16} />
            {t('projects.workspace.newChat')}
          </span>
        </Button>
      </div>

      {/* Tab bar */}
      <div
        className='flex items-center gap-2px px-20px flex-shrink-0'
        style={{ borderBottom: '1px solid var(--color-border-2)' }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type='button'
              onClick={() => setActiveTab(tab.key)}
              className='flex items-center gap-6px px-14px py-12px bg-transparent border-none cursor-pointer text-13px transition-colors'
              style={{
                color: active ? 'var(--color-text-1)' : 'var(--color-text-3)',
                fontWeight: active ? 600 : 400,
                borderBottom: `2px solid ${active ? 'var(--color-primary-6)' : 'transparent'}`,
                marginBottom: -1,
              }}
            >
              {tab.icon}
              {tab.label}
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className='text-11px text-t-tertiary'>{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className='flex-1 overflow-hidden'>
        {activeTab === 'chats' && (
          <div className='h-full overflow-auto px-24px py-16px'>
            {!loading && conversations.length === 0 ? (
              <div className='flex flex-col items-center justify-center gap-16px h-full text-center'>
                <div className='flex items-center justify-center w-56px h-56px rd-14px bg-fill-1 text-t-tertiary'>
                  <MessageSquarePlus size={26} />
                </div>
                <div className='flex flex-col gap-4px'>
                  <div className='text-15px font-600 text-t-primary'>{t('projects.workspace.emptyTitle')}</div>
                  <div className='text-13px text-t-secondary max-w-360px'>{t('projects.workspace.emptyBody')}</div>
                </div>
                <Button type='primary' onClick={startNewChat}>
                  <span className='flex items-center gap-6px'>
                    <MessageSquarePlus size={16} />
                    {t('projects.workspace.newChat')}
                  </span>
                </Button>
              </div>
            ) : (
              <div className='flex flex-col gap-8px max-w-720px mx-auto'>
                {[...conversations]
                  .sort((a, b) => {
                    const pa = (a.extra as { pinnedAt?: number } | undefined)?.pinnedAt ?? 0;
                    const pb = (b.extra as { pinnedAt?: number } | undefined)?.pinnedAt ?? 0;
                    return pb - pa;
                  })
                  .map((c) => {
                  const backend = (c.extra as { backend?: string } | undefined)?.backend || c.type;
                  return (
                    <div
                      key={c.id}
                      role='button'
                      tabIndex={0}
                      onClick={() => navigate(`/conversation/${c.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') navigate(`/conversation/${c.id}`);
                      }}
                      className={`group flex items-center gap-12px px-14px py-12px cursor-pointer ${styles.card}`}
                    >
                      <div className='flex flex-col gap-2px min-w-0 flex-1'>
                        <div className='flex items-center gap-6px min-w-0'>
                          {isConversationPinned(c) && <Pin size={12} className='text-t-tertiary shrink-0' />}
                          <div className='text-14px font-500 text-t-primary truncate'>
                            {c.name || t('projects.workspace.untitledChat')}
                          </div>
                        </div>
                        <div className='text-11px text-t-tertiary uppercase tracking-wide'>{backend}</div>
                      </div>
                      {/* stopPropagation on the wrapper (not the trigger button) so the
                          row click doesn't navigate, while Arco's click-to-open still fires. */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                          trigger='click'
                          position='br'
                          droplist={
                            <Menu
                              onClickMenuItem={(key) => {
                                if (key === 'pin') void togglePin(c);
                                else if (key === 'rename') openRename(c);
                                else if (key === 'remove') removeFromProject(c.id);
                              }}
                            >
                              <Menu.Item key='pin'>
                                <div className='flex items-center gap-8px'>
                                  {isConversationPinned(c) ? <PinOff size={15} /> : <Pin size={15} />}
                                  <span>
                                    {isConversationPinned(c)
                                      ? t('conversation.history.unpin')
                                      : t('conversation.history.pin')}
                                  </span>
                                </div>
                              </Menu.Item>
                              <Menu.Item key='rename'>
                                <div className='flex items-center gap-8px'>
                                  <Pencil size={15} />
                                  <span>{t('conversation.history.rename')}</span>
                                </div>
                              </Menu.Item>
                              <Menu.Item key='remove'>
                                <div className='flex items-center gap-8px text-[rgb(var(--warning-6))]'>
                                  <FolderMinus size={15} />
                                  <span>{t('projects.workspace.removeChat')}</span>
                                </div>
                              </Menu.Item>
                            </Menu>
                          }
                        >
                          <Button
                            type='text'
                            size='mini'
                            className='opacity-0 group-hover:opacity-100 transition-opacity'
                            icon={<MoreHorizontal size={16} />}
                          />
                        </Dropdown>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'files' &&
          (project?.workspace ? (
            <div className='h-full'>
              <ProjectFilesPanel workspace={project.workspace} projectId={projectId || ''} />
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center gap-12px h-full text-center px-20px'>
              <div className='flex items-center justify-center w-48px h-48px rd-12px bg-fill-1 text-t-tertiary'>
                <FolderOpen size={22} />
              </div>
              <div className='text-14px font-600 text-t-primary'>{t('projects.knowledge.noWorkspaceTitle')}</div>
              <div className='text-12px text-t-secondary max-w-320px leading-relaxed'>
                {t('projects.knowledge.noWorkspaceBody')}
              </div>
              <Button type='outline' onClick={() => openSettings('general')}>
                {t('projects.knowledge.setWorkspace')}
              </Button>
            </div>
          ))}

        {activeTab === 'reference' && (
          <div className='h-full overflow-auto px-24px py-18px'>
            <ProjectReferencePanel
              projectId={projectId || ''}
              hasWorkspace={!!project?.workspace}
              onSetWorkspace={() => openSettings('general')}
            />
          </div>
        )}

        {activeTab === 'memory' && (
          <div className='h-full overflow-auto px-24px py-18px'>
            <ProjectMemoryPanel
              projectId={projectId || ''}
              hasWorkspace={!!project?.workspace}
              onSetWorkspace={() => openSettings('general')}
            />
          </div>
        )}
      </div>

      {project && settingsSection && (
        <ProjectSettingsDrawer
          visible={!!settingsSection}
          project={project}
          initialSection={settingsSection}
          canGenerate={canGenerate}
          onClose={() => setSettingsSection(null)}
          onSaved={() => void load()}
        />
      )}

      <Modal
        title={t('conversation.history.renameTitle')}
        visible={renameId !== null}
        onOk={() => void confirmRename()}
        onCancel={() => setRenameId(null)}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        confirmLoading={renameLoading}
        okButtonProps={{ disabled: !renameName.trim() }}
        autoFocus
      >
        <Input
          value={renameName}
          onChange={setRenameName}
          placeholder={t('conversation.history.renamePlaceholder')}
          onPressEnter={() => void confirmRename()}
          maxLength={100}
        />
      </Modal>
    </div>
  );
};

export default ProjectWorkspacePage;
