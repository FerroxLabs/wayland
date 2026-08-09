/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AlertTriangle,
  Bot,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Eye,
  Folder,
  Globe,
  Hammer,
  Layers,
  ListChecks,
  PanelRight,
  Users,
  X,
} from 'lucide-react';
import classNames from 'classnames';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styles from './WorkbenchHost.module.css';

/** `observability` is deliberately absent: that section no longer exists. */
export type WorkbenchSectionId = 'workspace' | 'preview' | 'mission' | (string & {});

/**
 * A section describes presentation only. Its content continues to use the
 * existing Workspace, Preview, or execution stores. The host never copies those
 * stores into a second model.
 */
export interface WorkbenchSectionRegistration {
  id: WorkbenchSectionId;
  label: React.ReactNode;
  content: React.ReactNode;
  /** Higher priority sorts nearer the top of the stack. */
  priority?: number;
  available?: boolean;
  /** True when the underlying canonical store wants its surface presented. */
  requestedOpen?: boolean;
  /** Changes when new relevant work should be disclosed to the user. */
  activationKey?: string | number;
  onActivate?: () => void;
  onDismiss?: () => void;
  testId?: string;
  /** Optional header glyph. Falls back to an id-keyed default, then a generic. */
  icon?: React.ReactNode;
}

type PersistedWorkbenchState = {
  /** Sections the user collapsed by hand. */
  collapsedIds?: string[];
  /** Sections the user expanded by hand, against their provider's wishes. */
  expandedIds?: string[];
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
 * scattered magic numbers so the header, section rows and bodies stay on the
 * same rhythm.
 */
const SP = { xs: 4, sm: 8, md: 12, lg: 16 } as const;

/** Even inset on all four sides, so the card reads as embedded in the window. */
const CARD_INSET = SP.md;

const ICON_SIZE = 14;

/**
 * Default glyphs by section id. Sections had NO icon of their own, which is
 * exactly why an icon-only rail was rejected before (see the rail comment
 * below): the label was their only identity. Giving them a default glyph here
 * means the header can carry an icon BESIDE its label without every call site
 * having to supply one, and without ever replacing the words.
 */
const DEFAULT_ICONS: Record<string, React.ReactNode> = {
  mission: <ListChecks size={ICON_SIZE} />,
  workspace: <Folder size={ICON_SIZE} />,
  preview: <Eye size={ICON_SIZE} />,
  'projection:knowledge': <BookOpen size={ICON_SIZE} />,
  'projection:development': <Hammer size={ICON_SIZE} />,
  'projection:automation': <Bot size={ICON_SIZE} />,
  'projection:consequential': <AlertTriangle size={ICON_SIZE} />,
  'projection:team': <Users size={ICON_SIZE} />,
  'projection:core': <Cpu size={ICON_SIZE} />,
  'projection:browser-cua': <Globe size={ICON_SIZE} />,
};

const iconFor = (section: WorkbenchSectionRegistration): React.ReactNode =>
  section.icon ?? DEFAULT_ICONS[section.id] ?? <Layers size={ICON_SIZE} />;

/**
 * v2: the persisted shape changed from "which single section is active" to
 * "which sections are collapsed / expanded", because the panel no longer has a
 * single active section. Reusing the v1 key would have loaded a blob whose
 * fields no longer mean what they say.
 */
const storageKeyFor = (conversationId?: string) => `wayland.workbench.${conversationId?.trim() || 'global'}.v2`;

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

const loadState = (conversationId?: string): PersistedWorkbenchState => {
  try {
    const raw = localStorage.getItem(storageKeyFor(conversationId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedWorkbenchState;
    return {
      collapsedIds: stringArray(parsed.collapsedIds),
      expandedIds: stringArray(parsed.expandedIds),
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
  /**
   * Two explicit sets rather than one "active" id. A stacked panel has no
   * single active section - that was the whole defect: with five or more
   * sections competing for one horizontal row, Workspace became unreachable
   * behind a scroll arrow nobody noticed, and the set is DYNAMIC (knowledge,
   * automation, consequential, team, browser-cua all appear based on what the
   * run actually did), so the row only ever gets more crowded.
   */
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set(persisted.collapsedIds));
  /**
   * Sections the user opened by hand. Persisted, unlike the old single-active
   * intent: in a stack this is a durable "keep showing me this one" rather than
   * a transient navigation that would revive a dormant panel on reload.
   */
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(persisted.expandedIds));
  const [width, setWidth] = useState(persisted.width ?? DEFAULT_WIDTH);
  const priorRequests = useRef<Record<string, string | number | boolean | undefined>>({});
  const handledRequest = useRef<string | undefined>(undefined);
  /**
   * Sections that have been expanded at least once keep their content mounted
   * (hidden) when collapsed, so collapsing and re-expanding never remounts an
   * expensive surface or throws away its internal state.
   */
  const [mountedIds, setMountedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const next = loadState(conversationId);
    setCollapsedIds(new Set(next.collapsedIds));
    setExpandedIds(new Set(next.expandedIds));
    setWidth(next.width ?? DEFAULT_WIDTH);
    setMountedIds(new Set());
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

  /**
   * A section is shown when its provider asks for it, or when the user asked
   * for it by hand. An explicit collapse beats both - and, unlike the tab row
   * this replaces, expanding one section never takes another away.
   */
  const isExpanded = useCallback(
    (section: WorkbenchSectionRegistration) =>
      !collapsedIds.has(section.id) && (section.requestedOpen !== false || expandedIds.has(section.id)),
    [collapsedIds, expandedIds]
  );

  const expand = useCallback((id: WorkbenchSectionId) => {
    const section = byIdRef.current[id];
    if (!section) return;
    setCollapsedIds((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    // A click on a section header is an explicit request to SEE it, and it has
    // to outrank the provider's `requestedOpen`. Workspace reports
    // `requestedOpen: false` whenever the right sider is collapsed
    // (ChatLayout: `workspaceEnabled && !rightSiderCollapsed`), so without this
    // the section the user just asked for would stay shut.
    setExpandedIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
    section.onActivate?.();
  }, []);

  const collapse = useCallback((id: WorkbenchSectionId) => {
    const section = byIdRef.current[id];
    setCollapsedIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
    // Collapsing retracts the user's open intent, otherwise a dormant section
    // would spring back open on the next render.
    setExpandedIds((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    section?.onDismiss?.();
  }, []);

  const activate = useCallback(
    (id: WorkbenchSectionId) => {
      expand(id);
    },
    [expand]
  );

  const contextValue = useMemo<WorkbenchRegistryContextValue>(
    () => ({ register, update, activate }),
    [activate, register, update]
  );

  // Canonical stores request disclosure. In a stack this EXPANDS the newly
  // relevant section and leaves every other open section exactly where it was,
  // so nothing the user is reading can be yanked away by background relevance.
  // That is what the old pin existed to defend against; the structure now
  // guarantees it, so there is nothing left to pin.
  useEffect(() => {
    const reveal: string[] = [];
    for (const section of allSections) {
      const signal = section.requestedOpen === true ? (section.activationKey ?? true) : false;
      const prior = priorRequests.current[section.id];
      priorRequests.current[section.id] = signal;
      if (signal !== false && signal !== prior && (prior !== undefined || !collapsedIds.has(section.id))) {
        reveal.push(section.id);
      }
    }
    if (reveal.length === 0) return;
    setCollapsedIds((current) => {
      if (!reveal.some((id) => current.has(id))) return current;
      const next = new Set(current);
      for (const id of reveal) next.delete(id);
      return next;
    });
  }, [allSections, collapsedIds]);

  // Activity and other external surfaces may navigate directly to the exact
  // workbench lane that explains an item. Wait until descendant registrations
  // exist, then honor the request once. An unknown or unavailable section fails
  // closed and does nothing.
  useEffect(() => {
    if (!requestedSectionId || !requestKey || handledRequest.current === requestKey) return;
    if (!byId[requestedSectionId]) return;
    handledRequest.current = requestKey;
    expand(requestedSectionId);
  }, [byId, expand, requestKey, requestedSectionId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKeyFor(conversationId),
        JSON.stringify({
          collapsedIds: [...collapsedIds],
          expandedIds: [...expandedIds],
          width,
        } satisfies PersistedWorkbenchState)
      );
    } catch {
      // Storage is an enhancement; presentation still works when it is denied.
    }
  }, [collapsedIds, conversationId, expandedIds, width]);

  const visibleSections = useMemo(() => allSections.filter(isExpanded), [allSections, isExpanded]);
  const panelOpen = visibleSections.length > 0;
  /**
   * The primary section is the highest-priority expanded one. It exists purely
   * so external observers and tests keep a stable "what is this panel showing"
   * handle now that the answer can be more than one thing.
   */
  const primarySection = visibleSections[0];

  useEffect(() => {
    if (visibleSections.length === 0) return;
    setMountedIds((current) => {
      const missing = visibleSections.filter((section) => !current.has(section.id));
      if (missing.length === 0) return current;
      const next = new Set(current);
      for (const section of missing) next.add(section.id);
      return next;
    });
  }, [visibleSections]);

  /** Collapse every section at once - the card's own dismiss. */
  const closePanel = useCallback(() => {
    const ids = allSections.filter(isExpanded).map((section) => section.id);
    if (ids.length === 0) return;
    setCollapsedIds((current) => {
      const next = new Set(current);
      for (const id of ids) next.add(id);
      return next;
    });
    setExpandedIds((current) => {
      const next = new Set(current);
      for (const id of ids) next.delete(id);
      return next;
    });
    for (const id of ids) byIdRef.current[id]?.onDismiss?.();
  }, [allSections, isExpanded]);

  /** The section a reopen affordance would restore: the first that wants to be seen. */
  const reopenTarget = useMemo(
    () => allSections.find((section) => section.requestedOpen !== false && collapsedIds.has(section.id)),
    [allSections, collapsedIds]
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

        {/* Collapsed rail. Labels once rendered with `[writing-mode:vertical-rl]`,
            which stacked "Workspace Core Observability" sideways down the window
            edge - unreadable at a glance and easy to mistake for a scrollbar.
            The rail stays a single toggle: one horizontal affordance that opens
            the panel, where every section is now listed as a readable row with
            its own glyph beside its label. */}
        {allSections.length > 0 && !panelOpen && (
          <nav
            className='workbench-host__tabs absolute right-0 top-0 bottom-0 z-30 w-36px flex flex-col items-center border-l border-3 bg-2 py-8px'
            aria-label='Workbench sections'
          >
            <button
              type='button'
              className='workbench-host__tab h-32px w-32px flex items-center justify-center border-0 bg-transparent cursor-pointer text-t-secondary rounded-6px'
              aria-label={`Open workbench (${allSections.length} section${allSections.length === 1 ? '' : 's'})`}
              onClick={() => expand((reopenTarget ?? allSections[0]).id)}
            >
              <PanelRight size={16} />
            </button>
          </nav>
        )}

        {/* A detached card, not a flush column. Rounding, a full border, inset
            margins and elevation give it an edge on every side, which is what
            makes it legible as its own surface rather than as background. */}
        {panelOpen && primarySection && (
          <aside
            className={classNames(
              // bg-1, one step DARKER than the section cards it holds. The card
              // surface has to sit above its container or the "cards" read as
              // arbitrary rules drawn on a flat panel.
              'workbench-host__panel flex flex-col min-h-0 bg-1 rounded-12px overflow-hidden z-20',
              overlay && 'workbench-host__panel--overlay absolute right-36px top-0 bottom-0'
            )}
            style={{
              width: overlay ? `min(${width}px, calc(100% - ${CARD_INSET * 2}px))` : `${width}px`,
              margin: `${CARD_INSET}px`,
              // Border and elevation are set here rather than as utilities: the
              // `border` and `shadow-*` classes both compiled to nothing in this
              // build (measured 0px width, empty box-shadow), which is a large
              // part of why the panel read as background.
              border: '1px solid var(--bg-3)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.32)',
            }}
            aria-label='Workbench'
            data-testid='workbench-panel'
            data-section-id={primarySection.id}
            data-section-ids={visibleSections.map((section) => section.id).join(' ')}
            data-overlay={overlay ? 'true' : 'false'}
          >
            <div
              role='separator'
              aria-orientation='vertical'
              aria-label='Resize workbench'
              className='workbench-host__resize absolute left-0 top-0 bottom-0 w-8px -translate-x-1/2 cursor-col-resize z-30'
              onPointerDown={beginResize}
            />
            <header
              className='h-40px shrink-0 flex items-center gap-8px border-b border-3'
              style={{ padding: `0 ${SP.sm}px 0 ${SP.md}px` }}
            >
              <strong className='min-w-0 flex-1 truncate text-12px text-t-secondary tracking-wide'>Workbench</strong>
              <button
                type='button'
                className={classNames(
                  'workbench-host__icon-btn w-26px h-26px rounded-6px border-0 bg-transparent cursor-pointer text-t-secondary flex items-center justify-center shrink-0',
                  styles.iconBtn
                )}
                aria-label='Close workbench'
                onClick={closePanel}
              >
                <X size={15} />
              </button>
            </header>

            {/* The stack. It grows DOWNWARD, so the section set can be as large
                and as dynamic as the run makes it without anything being pushed
                out of reach. Every section keeps a visible header even when
                collapsed, which is the part the tab row could not do: you can
                always see what exists.
                Each section is its own rounded card separated by a gap, rather
                than a band divided by a hairline: discrete cards are what make a
                stack read as a set of independent things you can open, instead
                of one long document that happens to have rules in it. */}
            <div
              className={classNames('flex-1 min-h-0 overflow-y-auto flex flex-col', styles.stack)}
              style={{ gap: `${SP.sm}px`, padding: `${SP.sm}px` }}
              data-testid='workbench-stack'
            >
              {allSections.map((section) => {
                const expanded = isExpanded(section);
                const mounted = expanded || mountedIds.has(section.id);
                return (
                  <section
                    key={section.id}
                    className={classNames('workbench-host__section flex flex-col shrink-0', styles.section)}
                    data-section-id={section.id}
                    data-expanded={expanded ? 'true' : 'false'}
                  >
                    <h3 className='m-0'>
                      <button
                        type='button'
                        className={classNames(
                          'workbench-host__section-header w-full flex items-center gap-6px border-0 bg-transparent cursor-pointer text-left',
                          styles.sectionHeader,
                          expanded ? 'text-t-primary' : 'text-t-secondary'
                        )}
                        style={{ padding: `${SP.sm}px ${SP.md}px` }}
                        aria-expanded={expanded}
                        data-testid={
                          section.id === primarySection.id ? 'workbench-panel-title' : `workbench-section-${section.id}`
                        }
                        onClick={() => (expanded ? collapse(section.id) : expand(section.id))}
                      >
                        <span className='shrink-0 flex items-center text-t-tertiary' aria-hidden='true'>
                          {iconFor(section)}
                        </span>
                        <span className={classNames('min-w-0 truncate', styles.sectionLabel)}>{section.label}</span>
                        {/* Beside the title, not banished to the right edge. The
                            chevron belongs to the words it discloses; a
                            far-right chevron reads as an unrelated control and
                            leaves a dead gap across every row. */}
                        <ChevronDown
                          size={14}
                          aria-hidden='true'
                          className={classNames('shrink-0', styles.chev, expanded && styles.chevOpen)}
                        />
                        <span className='flex-1' />
                      </button>
                    </h3>
                    {mounted && (
                      <div
                        className='workbench-host__section-body overflow-auto'
                        style={{ padding: `0 ${SP.md}px ${SP.md}px` }}
                        data-testid={section.testId}
                        hidden={!expanded}
                      >
                        {section.content}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </aside>
        )}

        {!panelOpen && reopenTarget && (
          <button
            type='button'
            className='absolute right-44px top-8px z-30 h-32px px-8px border border-3 rounded-6px bg-2'
            aria-label='Reopen workbench'
            onClick={() => expand(reopenTarget.id)}
          >
            {overlay ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
      </div>
    </WorkbenchRegistryContext.Provider>
  );
};

export default WorkbenchHost;
