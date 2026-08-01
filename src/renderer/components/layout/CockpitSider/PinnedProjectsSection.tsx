/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@arco-design/web-react';
import { Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { IProject } from '@/common/types/project';
import styles from './CockpitSider.module.css';

type PinnedProjectsSectionProps = {
  collapsed: boolean;
  onNavigate: (path: string) => void;
};

const finiteTimestamp = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const isPinnedProject = (value: unknown): value is IProject => {
  if (!value || typeof value !== 'object') return false;
  const project = value as Partial<IProject>;
  return (
    project.pinned === true &&
    typeof project.id === 'string' &&
    project.id.trim().length > 0 &&
    typeof project.name === 'string' &&
    project.name.trim().length > 0
  );
};

const normalizePinnedProjects = (value: unknown): IProject[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(isPinnedProject).toSorted((left, right) => {
    const pinnedOrder = finiteTimestamp(right.pinnedAt) - finiteTimestamp(left.pinnedAt);
    if (pinnedOrder !== 0) return pinnedOrder;
    const modifiedOrder = finiteTimestamp(right.modifyTime) - finiteTimestamp(left.modifyTime);
    if (modifiedOrder !== 0) return modifiedOrder;
    return left.id.localeCompare(right.id);
  });
};

/** Lightweight project continuity for the Cockpit sidebar. */
export const PinnedProjectsSection: React.FC<PinnedProjectsSectionProps> = ({ collapsed, onNavigate }) => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<IProject[]>([]);
  const aliveRef = useRef(false);
  const generationRef = useRef(0);

  const refresh = useCallback(async () => {
    const generation = ++generationRef.current;
    try {
      const result = await ipcBridge.project.list.invoke();
      if (!aliveRef.current || generation !== generationRef.current) return;
      setProjects(normalizePinnedProjects(result));
    } catch {
      if (!aliveRef.current || generation !== generationRef.current) return;
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    if (collapsed) return;
    aliveRef.current = true;
    void refresh();
    const unsubscribe = ipcBridge.project.changed.on(() => void refresh());
    return () => {
      aliveRef.current = false;
      generationRef.current += 1;
      unsubscribe();
    };
  }, [collapsed, refresh]);

  if (collapsed || projects.length === 0) return null;

  return (
    <section
      className={styles.pinnedProjects}
      data-testid='cockpit-pinned-projects'
      aria-labelledby='pinned-projects-title'
    >
      <h2 id='pinned-projects-title' className={styles.sectionTitle}>
        {t('projects.list.title')}
      </h2>
      <div className={styles.pinnedProjectList}>
        {projects.map((project) => (
          <Button
            key={project.id}
            type='text'
            className={styles.pinnedProject}
            data-project-id={project.id}
            onClick={() => onNavigate(`/project/${encodeURIComponent(project.id)}`)}
          >
            <Folder size={15} aria-hidden='true' />
            <span className={styles.pinnedProjectName}>{project.name}</span>
          </Button>
        ))}
      </div>
    </section>
  );
};
