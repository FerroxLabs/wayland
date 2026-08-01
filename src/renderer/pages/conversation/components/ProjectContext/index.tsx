/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { FolderOpen } from '@icon-park/react';
import { Tag, Tooltip } from '@arco-design/web-react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';

const ProjectContextBadge: React.FC<{ projectId?: string }> = ({ projectId }) => {
  const { t } = useTranslation();
  const { data, error, isLoading, mutate } = useSWR(
    projectId ? ['conversation-project-context', projectId] : null,
    () => ipcBridge.project.get.invoke({ id: projectId! })
  );

  useEffect(() => {
    if (!projectId) return undefined;
    return ipcBridge.project.changed.on((payload) => {
      if (!payload?.id || payload.id === projectId) void mutate();
    });
  }, [mutate, projectId]);

  if (!projectId) return null;
  const unavailable = !isLoading && (Boolean(error) || data === null);
  const label = unavailable
    ? t('projects.contextBadge.unavailable', { defaultValue: 'Project unavailable' })
    : (data?.name ?? t('projects.contextBadge.project', { defaultValue: 'Project' }));

  return (
    <Tooltip content={unavailable ? projectId : data?.description || label}>
      <Tag
        color={unavailable ? 'orange' : 'arcoblue'}
        icon={<FolderOpen theme='outline' size='14' />}
        data-testid='project-context-badge'
        data-project-id={projectId}
        data-project-state={unavailable ? 'unavailable' : isLoading ? 'loading' : 'available'}
      >
        {label}
      </Tag>
    </Tooltip>
  );
};

export default ProjectContextBadge;
