/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronLeft, ChevronRight, PanelRight, Pin, PinOff, X } from 'lucide-react';
import classNames from 'classnames';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styles from './WorkbenchHost.module.css';

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

/**
 * Spacing scale for the workbench card. Kept as a tiny local scale rather than
 * scattered magic numbers so the header, tab row and body stay on the same
 * rhythm - uneven padding between those three was most of why the panel read as
 * disjointed.
 */
const SP = { xs: 4, sm: 8, md: 12, lg: 16 } as const;

/** Even inset on all four sides, so the card reads as embedded in the window. */
const CARD_INSET = SP.md;

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
  /**
   * The section the user opened by hand. Deliberately NOT persisted: it is
   * intent for this visit, not a saved preference, and reviving it on reload
   * would re-open a panel the provider considers dormant.
   */
  const [userOpenedId, setUserOpenedId] = useState<string | undefined>();
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
    // A click on a section row is an explicit request to SEE it, and it has to
    // outrank the provider's `requestedOpen`. Without this, activating a
    // section whose store reports `requestedOpen: false` - Workspace does
    // exactly that whenever the right sider is collapsed
    // (ChatLayout/index.tsx: `workspaceEnabled && !rightSiderCollapsed`) -
    // made `panelOpen` false and collapsed the ENTIRE panel to the 36px rail.
    // The reopen button could not rescue it either, because the line above had
    // just removed the id from `closedIds`, which that button requires. The
    // user clicked a section and the whole workbench vanished.
    setUserOpenedId(id);
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
  // Open when the provider asks for it OR when the user explicitly asked for
  // this section. Closing always wins over both.
  const panelOpen = Boolean(
    activeSection &&
      !closedIds.has(activeSection.id) &&
      (activeSection.requestedOpen !== false || userOpenedId === activeSection.id)
  );

  const closeActive = useCallback(() => {
    if (!activeSection) return;
    setClosedIds((current) => new Set(current).add(activeSection.id));
    // Closing retracts the user's open intent, otherwise a dormant section
    // would re-open itself the next time anything re-rendered.
    setUserOpenedId((current) => (current === activeSection.id ? undefined : current));
    if (pinnedId === activeSection.id) setPinnedId(undefined);
    activeSection.onDismiss?.();
  }, [activeSection, pinnedId]);

  /**
   * Arrow-key navigation, which a `role="tablist"` is expected to provide. The
   * old stacked list was a plain set of buttons and got this from normal tab
   * order; a tab row has one tab stop, so the arrows have to do the moving.
   */
  const onTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (delta === 0) return;
      const index = allSections.findIndex((section) => section.id === activeId);
      if (index < 0) return;
      event.preventDefault();
      const next = allSections[(index + delta + allSections.length) % allSections.length];
      activate(next.id);
      // Keep focus on the tab the user just moved to, not the one they left.
      const tabs = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      tabs[(index + delta + allSections.length) % allSections.length]?.focus();
    },
    [activate, activeId, allSections]
  );

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
            className='workbench-host__tabs absolute right-0 top-0 bottom-0 z-30 w-36px flex flex-col items-center border-l border-3 bg-2 py-8px'
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

        {/* A detached card, not a flush column. This used to be the same surface
            as the chat behind it with a single 1px left border, so the workbench
            read as part of the background rather than as its own surface.
            Rounding, a full border, inset margins and elevation give it an edge
            on every side, which is what makes it legible as a distinct panel. */}
        {panelOpen && activeSection && (
          <aside
            className={classNames(
              'workbench-host__panel flex flex-col min-h-0 bg-2 rounded-12px overflow-hidden z-20',
              overlay && 'workbench-host__panel--overlay absolute right-36px top-0 bottom-0'
            )}
            style={{
              width: overlay ? `min(${width}px, calc(100% - ${CARD_INSET * 2}px))` : `${width}px`,
              // An even inset on all four sides is what makes the card read as
              // embedded rather than bolted to the window edge. The collapsed
              // rail is not rendered while the panel is open, so the right side
              // needs no extra gutter for it.
              margin: `${CARD_INSET}px`,
              // Border and elevation are set here rather than as utilities: the
              // `border` and `shadow-*` classes both compiled to nothing in this
              // build (measured 0px width, empty box-shadow), which is a large
              // part of why the panel read as background. Theme vars keep it
              // theme-aware.
              border: '1px solid var(--bg-3)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.32)',
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
            {/* ONE chrome row. Tabs and controls share it, because a separate
                title bar above a tab row just names the active section twice -
                which is the duplication this redesign exists to remove. With a
                single section there is no tab row, so the title takes its place.
                Section content is body-only; see ObservabilityPanel. */}
            <header
              className='h-44px shrink-0 flex items-end gap-8px border-b border-3'
              style={{ padding: `0 ${SP.sm}px 0 ${SP.md}px` }}
            >
              {allSections.length > 1 ? (
                <div
                  className={classNames('workbench-host__sections min-w-0 flex-1 flex gap-2px overflow-x-auto', styles.tabRow)}
                  role='tablist'
                  aria-label='Workbench sections'
                  onKeyDown={onTabKeyDown}
                >
                  {allSections.map((section) => {
                    const isActive = section.id === activeId;
                    return (
                      <button
                        type='button'
                        key={section.id}
                        role='tab'
                        aria-selected={isActive}
                        tabIndex={isActive ? 0 : -1}
                        data-testid={isActive ? 'workbench-panel-title' : undefined}
                        className={classNames(
                          'workbench-host__section-tab shrink-0 border-0 bg-transparent cursor-pointer',
                          styles.tab,
                          isActive ? 'text-t-primary font-600' : 'text-t-secondary'
                        )}
                        style={{
                          padding: '6px 10px 10px',
                          marginBottom: '-1px',
                          borderBottom: `2px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
                        }}
                        onClick={() => activate(section.id)}
                      >
                        <span className='min-w-0 truncate'>{section.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <strong
                  className='min-w-0 flex-1 truncate text-13px'
                  style={{ paddingBottom: '11px' }}
                  data-testid='workbench-panel-title'
                >
                  {activeSection.label}
                </strong>
              )}
              <span className='shrink-0 flex items-center gap-2px' style={{ paddingBottom: '7px' }}>
              <button
                type='button'
                className={classNames('workbench-host__icon-btn w-26px h-26px rounded-6px border-0 bg-transparent cursor-pointer text-t-secondary flex items-center justify-center', styles.iconBtn)}
                aria-label={pinnedId === activeSection.id ? 'Unpin workbench section' : 'Pin workbench section'}
                aria-pressed={pinnedId === activeSection.id}
                onClick={() => setPinnedId((current) => (current === activeSection.id ? undefined : activeSection.id))}
              >
                {pinnedId === activeSection.id ? <PinOff size={15} /> : <Pin size={15} />}
              </button>
              <button
                type='button'
                className={classNames('workbench-host__icon-btn w-26px h-26px rounded-6px border-0 bg-transparent cursor-pointer text-t-secondary flex items-center justify-center', styles.iconBtn)}
                aria-label='Close workbench'
                onClick={closeActive}
              >
                <X size={15} />
              </button>
              </span>
            </header>
            {/* The gutter nothing crosses. Content used to sit 1px from the
                border with no padding, so a nested surface collided with the
                card's own corner radius. */}
            <div
              className='flex flex-1 min-h-0 overflow-auto'
              style={{ padding: `${SP.md}px` }}
              data-testid={activeSection.testId}
            >
              {activeSection.content}
            </div>
          </aside>
        )}

        {!panelOpen && activeSection && activeSection.requestedOpen !== false && closedIds.has(activeSection.id) && (
          <button
            type='button'
            className='absolute right-44px top-8px z-30 h-32px px-8px border border-3 rounded-6px bg-2'
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
