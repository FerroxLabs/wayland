/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IProject, ICreateProjectParams } from '@/common/types/project';
import { Button, Message, Modal } from '@arco-design/web-react';
import { FolderPlus, Plus } from 'lucide-react';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useProjects } from './hooks/useProjects';
import ProjectCard from './components/ProjectCard';
import CreateProjectModal from './components/CreateProjectModal';
import NewProjectWizard from './components/NewProjectWizard';

/**
 * Top-level Projects surface: a grid of project tiles plus one obvious "New
 * project" action. Empty state tells the user exactly what the next click does
 * (Krug). Creating a project is one field (name) so the activation cost is near
 * zero (Sutherland).
 */
const ProjectsListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projects, counts, loading, createProject, updateProject, removeProject } = useProjects();

  const [editing, setEditing] = React.useState<IProject | undefined>(undefined);
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [canGenerate, setCanGenerate] = React.useState(false);

  useEffect(() => {
    ipcBridge.project.hasUsableModel
      .invoke()
      .then(setCanGenerate)
      .catch(() => setCanGenerate(false));
  }, []);

  // Card edit uses the compact modal; project CREATION uses the guided wizard.
  const handleEditSubmit = useCallback(
    async (params: ICreateProjectParams) => {
      if (!editing) return;
      try {
        await updateProject(editing.id, params);
        Message.success(t('projects.toast.updated'));
      } catch (err) {
        console.error('[ProjectsListPage] save failed:', err);
        Message.error(t('projects.toast.saveFailed'));
      } finally {
        setEditing(undefined);
      }
    },
    [editing, updateProject, t]
  );

  const completeNewProject = useCallback(
    async (params: ICreateProjectParams, instructions?: string) => {
      const created = await createProject(params);
      // Persist drafted instructions only when there is a workspace to hold them.
      if (instructions && params.workspace) {
        try {
          await ipcBridge.project.writeKnowledge.invoke({ id: created.id, kind: 'context', content: instructions });
        } catch (err) {
          console.error('[ProjectsListPage] write instructions failed:', err);
        }
      }
      Message.success(t('projects.toast.created'));
      navigate(`/project/${created.id}`);
    },
    [createProject, navigate, t]
  );

  const [modalCtrl, modalNode] = CreateProjectModal.useModal({ project: editing, onSubmit: handleEditSubmit });

  const openCreate = () => setWizardOpen(true);
  const openEdit = (project: IProject) => {
    setEditing(project);
    modalCtrl.open({ project });
  };

  const handleDelete = useCallback(
    (project: IProject) => {
      Modal.confirm({
        title: t('projects.delete.title'),
        content: t('projects.delete.body', { name: project.name }),
        okText: t('projects.delete.confirm'),
        cancelText: t('common.cancel'),
        okButtonProps: { status: 'danger' },
        onOk: async () => {
          try {
            await removeProject(project.id);
            Message.success(t('projects.toast.deleted'));
          } catch {
            Message.error(t('projects.toast.deleteFailed'));
          }
        },
      });
    },
    [removeProject, t]
  );

  const handleTogglePin = useCallback(
    (project: IProject) => {
      void updateProject(project.id, { pinned: !project.pinned, pinnedAt: project.pinned ? undefined : Date.now() });
    },
    [updateProject]
  );

  return (
    <div className='flex flex-col h-full w-full overflow-hidden'>
      <div className='flex items-center justify-between px-24px py-20px flex-shrink-0'>
        <div className='flex flex-col gap-2px'>
          <h1 className='text-20px font-700 text-t-primary m-0'>{t('projects.list.title')}</h1>
          <span className='text-13px text-t-secondary'>{t('projects.list.subtitle')}</span>
        </div>
        <Button type='primary' onClick={openCreate}>
          <span className='flex items-center gap-6px'>
            <Plus size={16} />
            {t('projects.list.newButton')}
          </span>
        </Button>
      </div>

      <div className='flex-1 overflow-auto px-24px pb-24px'>
        {!loading && projects.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-16px h-full text-center'>
            <div className='flex items-center justify-center w-64px h-64px rd-16px bg-fill-1 text-t-tertiary'>
              <FolderPlus size={28} />
            </div>
            <div className='flex flex-col gap-4px'>
              <div className='text-16px font-600 text-t-primary'>{t('projects.empty.title')}</div>
              <div className='text-13px text-t-secondary max-w-360px'>{t('projects.empty.body')}</div>
            </div>
            <Button type='primary' onClick={openCreate}>
              <span className='flex items-center gap-6px'>
                <Plus size={16} />
                {t('projects.empty.cta')}
              </span>
            </Button>
          </div>
        ) : (
          <div className='grid gap-16px' style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                chatCount={counts[p.id] ?? 0}
                onOpen={(proj) => navigate(`/project/${proj.id}`)}
                onEdit={openEdit}
                onDelete={handleDelete}
                onTogglePin={handleTogglePin}
              />
            ))}
          </div>
        )}
      </div>

      {modalNode}
      <NewProjectWizard
        visible={wizardOpen}
        canGenerate={canGenerate}
        onClose={() => setWizardOpen(false)}
        onComplete={completeNewProject}
      />
    </div>
  );
};

export default ProjectsListPage;
