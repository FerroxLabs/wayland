/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronLeft, ChevronRight, PanelRight, Pin, PinOff, X } from 'lucide-react';
import classNames from 'classnames';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type WorkbenchSectionId = 'workspace' | 'preview' | 'observability' | 'mission' | (string & {});

/**
 * A section describes presentation only. Its content continues to use the
 * existing Workspace, Preview, observability, or execution stores. The host
 * never copies those stores into a second model.
 */
export interface WorkbenchSectionRegistration {
  id: WorkbenchSectionId;
  label: React.ReactNode;
  content: React.ReactNode;
  /** Higher priority wins when multiple surfaces request attention together. */
  priority?: number;
  available?: boolean;
  /** True when the underlying canonical store wants its surface presented. */
  requestedOpen?: boolean;
  /** Changes when new relevant work should be disclosed to the user. */
  activationKey?: string | number;
  onActivate?: () => void;
  onDismiss?: () => void;
  testId?: string;
}

type PersistedWorkbenchState = {
  activeId?: string;
  pinnedId?: string;
  closedIds?: string[];
  width?: number;
};

type WorkbenchRegistryContextValue = {
  register: (section: WorkbenchSectionRegistration) => () => void;
  update: (section: WorkbenchSectionRegistration) => void;
  activate: (id: WorkbenchSectionId) => void;
};

const WorkbenchRegistryContext = createContext<WorkbenchRegistryContextValue | null>(null);

const DEFAULT_WIDTH = 340;
const MIN_WIDTH = 260;
const MAX_WIDTH = 620;

const storageKeyFor = (conversationId?: string) => `wayland.workbench.${conversationId?.trim() || 'global'}.v1`;

const loadState = (conversationId?: string): PersistedWorkbenchState => {
  try {
    const raw = localStorage.getItem(storageKeyFor(conversationId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedWorkbenchState;
    return {
      activeId: typeof parsed.activeId === 'string' ? parsed.activeId : undefined,
      pinnedId: typeof parsed.pinnedId === 'string' ? parsed.pinnedId : undefined,
      closedIds: Array.isArray(parsed.closedIds)
        ? parsed.closedIds.filter((id): id is string => typeof id === 'string')
        : [],
      width:
        typeof parsed.width === 'number' && parsed.width >= MIN_WIDTH && parsed.width <= MAX_WIDTH
          ? parsed.width
          : undefined,
    };
  } catch {
    return {};
  }
};

const sortSections = (sections: readonly WorkbenchSectionRegistration[]) =>
  sections.toSorted((left, right) => (right.priority ?? 0) - (left.priority ?? 0));

export const useWorkbenchSection = (section: WorkbenchSectionRegistration): void => {
  const registry = useContext(WorkbenchRegistryContext);
  const sectionRef = useRef(section);
  sectionRef.current = section;

  useEffect(() => {
    if (!registry) return undefined;
    return registry.register(sectionRef.current);
  }, [registry, section.id]);

  useEffect(() => {
    registry?.update(section);
  }, [registry, section]);
};

export const useWorkbenchRegistry = (): Pick<WorkbenchRegistryContextValue, 'activate'> | null => {
  const registry = useContext(WorkbenchRegistryContext);
  return registry ? { activate: registry.activate } : null;
};

const WorkbenchHost: React.FC<{
  children: React.ReactNode;
  conversationId?: string;
  sections?: readonly WorkbenchSectionRegistration[];
  overlay?: boolean;
  /** Explicit user navigation into a known section. Unknown ids remain inert. */
  requestedSectionId?: WorkbenchSectionId;
  /** Stable identity for one navigation request; prevents render-loop reactivation. */
  requestKey?: string;
}> = ({
  children,
  conversationId,
  sections: builtinSections = [],
  overlay = false,
  requestedSectionId,
  requestKey,
}) => {
  const persisted = useMemo(() => loadState(conversationId), [conversationId]);
  const [registered, setRegistered] = useState<Record<string, WorkbenchSectionRegistration>>({});
  const [activeId, setActiveId] = useState<string | undefined>(persisted.activeId);
  const [pinnedId, setPinnedId] = useState<string | undefined>(persisted.pinnedId);
  const [closedIds, setClosedIds] = useState<Set<string>>(() => new Set(persisted.closedIds));
  const [width, setWidth] = useState(persisted.width ?? DEFAULT_WIDTH);
  const priorRequests = useRef<Record<string, string | number | boolean | undefined>>({});
  const handledRequest = useRef<string | undefined>(undefined);

  useEffect(() => {
    const next = loadState(conversationId);
    setActiveId(next.activeId);
    setPinnedId(next.pinnedId);
    setClosedIds(new Set(next.closedIds));
    setWidth(next.width ?? DEFAULT_WIDTH);
    priorRequests.current = {};
    handledRequest.current = undefined;
  }, [conversationId]);

  const register = useCallback((section: WorkbenchSectionRegistration) => {
    setRegistered((current) => ({ ...current, [section.id]: section }));
    return () => {
      setRegistered((current) => {
        if (!(section.id in current)) return current;
        const next = { ...current };
        delete next[section.id];
        return next;
      });
    };
  }, []);

  const update = useCallback((section: WorkbenchSectionRegistration) => {
    setRegistered((current) => (current[section.id] === section ? current : { ...current, [section.id]: section }));
  }, []);

  const allSections = useMemo(() => {
    const merged: Record<string, WorkbenchSectionRegistration> = { ...registered };
    for (const section of builtinSections) merged[section.id] = section;
    return sortSections(Object.values(merged).filter((section) => section.available !== false));
  }, [builtinSections, registered]);

  const byId = useMemo(
    () =>
      Object.fromEntries(allSections.map((section) => [section.id, section])) as Record<
        string,
        WorkbenchSectionRegistration
      >,
    [allSections]
  );
  const byIdRef = useRef(byId);
  byIdRef.current = byId;

  const activate = useCallback((id: WorkbenchSectionId) => {
    const section = byIdRef.current[id];
    if (!section) return;
    setClosedIds((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    setActiveId(id);
    setPinnedId((current) => (current && current !== id ? undefined : current));
    section.onActivate?.();
  }, []);

  const contextValue = useMemo<WorkbenchRegistryContextValue>(
    () => ({ register, update, activate }),
    [activate, register, update]
  );

  // Canonical stores request disclosure. A pinned section cannot be displaced;
  // otherwise the highest-priority newly relevant section becomes active.
  useEffect(() => {
    let candidate: WorkbenchSectionRegistration | undefined;
    for (const section of allSections) {
      const signal = section.requestedOpen === true ? (section.activationKey ?? true) : false;
      const prior = priorRequests.current[section.id];
      priorRequests.current[section.id] = signal;
      if (!candidate && signal !== false && signal !== prior && (prior !== undefined || !closedIds.has(section.id))) {
        candidate = section;
      }
    }
    if (pinnedId && byId[pinnedId]) return;
    if (!candidate) return;
    setClosedIds((current) => {
      if (!current.has(candidate.id)) return current;
      const next = new Set(current);
      next.delete(candidate.id);
      return next;
    });
    setActiveId(candidate.id);
  }, [allSections, byId, closedIds, pinnedId]);

  // If the active section disappears, select another explicitly requested
  // surface. Do not open a dormant workspace merely because it is available.
  useEffect(() => {
    if (activeId && byId[activeId]) return;
    const next = allSections.find((section) => section.requestedOpen === true && !closedIds.has(section.id));
    setActiveId(next?.id);
  }, [activeId, allSections, byId, closedIds]);

  // Activity and other external surfaces may navigate directly to the exact
  // workbench lane that explains an item. This effect deliberately follows
  // automatic relevance selection so the explicit user action wins. Wait until
  // descendant registrations exist, then honor the request once. An unknown or
  // unavailable section fails closed and does nothing.
  useEffect(() => {
    if (!requestedSectionId || !requestKey || handledRequest.current === requestKey) return;
    if (!byId[requestedSectionId]) return;
    handledRequest.current = requestKey;
    activate(requestedSectionId);
  }, [activate, byId, requestKey, requestedSectionId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKeyFor(conversationId),
        JSON.stringify({ activeId, pinnedId, closedIds: [...closedIds], width } satisfies PersistedWorkbenchState)
      );
    } catch {
      // Storage is an enhancement; presentation still works when it is denied.
    }
  }, [activeId, closedIds, conversationId, pinnedId, width]);

  const activeSection = activeId ? byId[activeId] : undefined;
  const panelOpen = Boolean(activeSection && activeSection.requestedOpen !== false && !closedIds.has(activeSection.id));

  const closeActive = useCallback(() => {
    if (!activeSection) return;
    setClosedIds((current) => new Set(current).add(activeSection.id));
    if (pinnedId === activeSection.id) setPinnedId(undefined);
    activeSection.onDismiss?.();
  }, [activeSection, pinnedId]);

  const beginResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== 'touch' && event.button !== 0) return;
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = width;
      const onMove = (moveEvent: PointerEvent) => {
        setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + startX - moveEvent.clientX)));
      };
      const finish = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', finish);
        window.removeEventListener('pointercancel', finish);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', finish);
    },
    [width]
  );

  return (
    <WorkbenchRegistryContext.Provider value={contextValue}>
      <div className='workbench-host flex flex-1 min-w-0 min-h-0 relative' data-testid='workbench-host'>
        <div className='workbench-host__primary flex flex-1 min-w-0 min-h-0'>{children}</div>

        {/* Collapsed rail. Labels used to render with `[writing-mode:vertical-rl]`,
            which stacked "Workspace Core Observability" sideways down the window
            edge - unreadable at a glance and easy to mistake for a scrollbar or
            decoration. The rail is now a single toggle: one horizontal affordance
            that opens the panel, where every section is listed as a readable row.
            Sections carry no icons (label is the only identity they have), so a
            narrow icon rail is not an option - and a 36px column cannot hold
            horizontal text. */}
        {allSections.length > 0 && !panelOpen && (
          <nav
            className='workbench-host__tabs absolute right-0 top-0 bottom-0 z-30 w-36px flex flex-col items-center border-l border-border-1 bg-bg-2 py-8px'
            aria-label='Workbench sections'
          >
            <button
              type='button'
              className='workbench-host__tab h-32px w-32px flex items-center justify-center border-0 bg-transparent cursor-pointer text-t-secondary rounded-6px'
              aria-label={`Open workbench (${allSections.length} section${allSections.length === 1 ? '' : 's'})`}
              onClick={() => activate((activeSection ?? allSections[0]).id)}
            >
              <PanelRight size={16} />
            </button>
          </nav>
        )}

        {panelOpen && activeSection && (
          <aside
            className={classNames(
              'workbench-host__panel flex flex-col min-h-0 bg-bg-2 border-l border-border-1 z-20',
              overlay && 'workbench-host__panel--overlay absolute right-36px top-0 bottom-0 shadow-xl'
            )}
            style={{
              width: overlay ? `min(${width}px, calc(100% - 44px))` : `${width}px`,
              marginRight: overlay ? undefined : '36px',
            }}
            aria-label={`${typeof activeSection.label === 'string' ? activeSection.label : activeSection.id} workbench`}
            data-testid='workbench-panel'
            data-section-id={activeSection.id}
            data-overlay={overlay ? 'true' : 'false'}
          >
            <div
              role='separator'
              aria-orientation='vertical'
              aria-label='Resize workbench'
              className='workbench-host__resize absolute left-0 top-0 bottom-0 w-8px -translate-x-1/2 cursor-col-resize z-30'
              onPointerDown={beginResize}
            />
            <header className='h-44px shrink-0 px-12px flex items-center gap-8px border-b border-border-1'>
              <strong className='min-w-0 truncate' data-testid='workbench-panel-title'>
                {activeSection.label}
              </strong>
              <span className='ml-auto' />
              <button
                type='button'
                className='border-0 bg-transparent cursor-pointer text-t-secondary'
                aria-label={pinnedId === activeSection.id ? 'Unpin workbench section' : 'Pin workbench section'}
                aria-pressed={pinnedId === activeSection.id}
                onClick={() => setPinnedId((current) => (current === activeSection.id ? undefined : activeSection.id))}
              >
                {pinnedId === activeSection.id ? <PinOff size={16} /> : <Pin size={16} />}
              </button>
              <button
                type='button'
                className='border-0 bg-transparent cursor-pointer text-t-secondary'
                aria-label='Close workbench'
                onClick={closeActive}
              >
                <X size={16} />
              </button>
            </header>
            {/* Section switcher, horizontal and readable. Only rendered when
                there is a real choice to make - a single-section workbench keeps
                its title bar and nothing else. */}
            {allSections.length > 1 && (
              <nav
                className='workbench-host__sections shrink-0 flex flex-col border-b border-border-1'
                aria-label='Workbench sections'
              >
                {allSections.map((section) => {
                  const isActive = section.id === activeId;
                  return (
                    <button
                      type='button'
                      key={section.id}
                      className={classNames(
                        'workbench-host__section-row h-36px px-12px flex items-center gap-8px text-13px text-left border-0 bg-transparent cursor-pointer',
                        isActive ? 'text-primary-6 font-600' : 'text-t-secondary'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => activate(section.id)}
                    >
                      <span className='min-w-0 truncate'>{section.label}</span>
                      <ChevronRight size={14} className='ml-auto shrink-0 opacity-60' />
                    </button>
                  );
                })}
              </nav>
            )}
            <div className='flex flex-1 min-h-0 overflow-hidden' data-testid={activeSection.testId}>
              {activeSection.content}
            </div>
          </aside>
        )}

        {!panelOpen && activeSection && activeSection.requestedOpen !== false && closedIds.has(activeSection.id) && (
          <button
            type='button'
            className='absolute right-44px top-8px z-30 h-32px px-8px border border-border-1 rounded-6px bg-bg-2'
            aria-label='Reopen workbench'
            onClick={() => activate(activeSection.id)}
          >
            {overlay ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
      </div>
    </WorkbenchRegistryContext.Provider>
  );
};

export default WorkbenchHost;
