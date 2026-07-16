/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IProject } from '@/common/types/project';
import { Dropdown, Menu } from '@arco-design/web-react';
import { Folder, MessageSquare, MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './projectCards.module.css';

type ProjectCardProps = {
  project: IProject;
  chatCount: number;
  onOpen: (project: IProject) => void;
  onEdit: (project: IProject) => void;
  onDelete: (project: IProject) => void;
  onTogglePin: (project: IProject) => void;
};

/**
 * A single project tile. The chat count + colored chip make the umbrella feel
 * like it accumulates value (Sutherland) rather than being a bare label. The
 * whole card is one obvious click target into the workspace (Krug); secondary
 * actions hide behind a 3-dot menu so they never compete with the primary action.
 */
const ProjectCard: React.FC<ProjectCardProps> = ({ project, chatCount, onOpen, onEdit, onDelete, onTogglePin }) => {
  const { t } = useTranslation();
  const color = project.iconColor || '#FF6A00';

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={() => onOpen(project)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(project);
        }
      }}
      className={`group relative flex flex-col gap-12px p-16px cursor-pointer ${styles.card}`}
      data-appearance-role='project-card'
    >
      <div className='flex items-start justify-between'>
        <div
          className='flex items-center justify-center w-40px h-40px rd-10px flex-shrink-0'
          style={{ background: `${color}1a`, color }}
        >
          <Folder size={20} />
        </div>
        <div className='flex items-center gap-4px'>
          {project.pinned && <Pin size={13} className='text-t-tertiary' fill='currentColor' />}
          <Dropdown
            trigger='click'
            position='br'
            getPopupContainer={() => document.body}
            droplist={
              <Menu
                onClickMenuItem={(key) => {
                  if (key === 'pin') onTogglePin(project);
                  if (key === 'edit') onEdit(project);
                  if (key === 'delete') onDelete(project);
                }}
              >
                <Menu.Item key='pin'>
                  <div className='flex items-center gap-8px'>
                    {project.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    <span>{project.pinned ? t('projects.card.unpin') : t('projects.card.pin')}</span>
                  </div>
                </Menu.Item>
                <Menu.Item key='edit'>
                  <div className='flex items-center gap-8px'>
                    <Pencil size={14} />
                    <span>{t('projects.card.edit')}</span>
                  </div>
                </Menu.Item>
                <Menu.Item key='delete'>
                  <div className='flex items-center gap-8px text-[rgb(var(--warning-6))]'>
                    <Trash2 size={14} />
                    <span>{t('projects.card.delete')}</span>
                  </div>
                </Menu.Item>
              </Menu>
            }
          >
            <span
              role='button'
              tabIndex={-1}
              aria-label={t('projects.card.more')}
              onClick={(e) => e.stopPropagation()}
              className='flex items-center justify-center w-26px h-26px rd-6px text-t-tertiary opacity-0 group-hover:opacity-100 hover:bg-fill-2 transition-opacity cursor-pointer'
            >
              <MoreHorizontal size={16} />
            </span>
          </Dropdown>
        </div>
      </div>

      <div className='flex flex-col gap-4px min-h-0'>
        <div className='text-15px font-600 text-t-primary truncate' title={project.name}>
          {project.name}
        </div>
        <div className='text-12px text-t-secondary line-clamp-2 min-h-32px'>
          {project.description || t('projects.card.noDescription')}
        </div>
      </div>

      <div className='flex items-center gap-4px text-12px text-t-tertiary'>
        <MessageSquare size={13} />
        <span>{t('projects.card.chatCount', { count: chatCount })}</span>
      </div>
    </div>
  );
};

export default ProjectCard;
