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
  /**
   * True when this section's content is written to FILL its pane rather than to
   * size itself from its own content.
   *
   * The stack sizes every card from its content, which is right for a card that
   * is a list of rows. It is fatal for content built the other way round: the
   * Workspace tree is `flex-1 min-h-0` inside an absolutely-positioned scroll
   * container, and `flex-basis: 0%` in an auto-height column resolves to zero,
   * so the file tree rendered at `height: 0px` - present in the DOM, invisible,
   * with no disclosure triangle to click and react-virtuoso logging
   * "Zero-sized element" on repeat. Opting in here gives that content a pane
   * with a real height to fill.
   */
  fill?: boolean;
  /**
   * True when this section renders a DOCUMENT rather than a rail of controls.
   * A document has a width it needs before it will lay out properly - the
   * morning brief reaches its full layout at 900px and drops the market grid to
   * 2-up below 820 - so the panel opens at `documentPaneDefaultWidth()` instead
   * of the 340px rail default. Only the DEFAULT: a width the user dragged wins.
   */
  prefersDocumentWidth?: boolean;
  /**
   * Controls rendered beside this section's disclosure row. They sit OUTSIDE
   * the disclosure button - a button inside a button is invalid, and a click on
   * a nested control would toggle the section under it.
   */
  headerActions?: React.ReactNode;
}

type PersistedWorkbenchState = {
  /** Sections the user collapsed by hand. */
  collapsedIds?: string[];
  /** Sections the user expanded by hand, against their provider's wishes. */
  expandedIds?: string[];
  width?: number;
  /**
   * True only when a drag produced this width. Without it the width is
   * indistinguishable from the one every mount wrote, and a document section
   * could never be given a default of its own.
   */
  widthSetByUser?: boolean;
};

type WorkbenchRegistryContextValue = {
  register: (section: WorkbenchSectionRegistration) => () => void;
  update: (section: WorkbenchSectionRegistration) => void;
  activate: (id: WorkbenchSectionId) => void;
};

const WorkbenchRegistryContext = createContext<WorkbenchRegistryContextValue | null>(null);

const DEFAULT_WIDTH = 340;
const MIN_WIDTH = 260;
/**
 * 620 was a rail ceiling: enough for a file tree, not for a document. A rendered
 * HTML deliverable at 620px on a wide display is unreadable, and the drag
 * handle stopped before the width that would fix it. The cap now just keeps the
 * chat from being squeezed out entirely; the useful width is the user's to pick.
 */
const MAX_WIDTH = 1200;

/**
 * The width the flagship HTML deliverable needs for its full layout: 4-up
 * market grid AND a two-column trade panel. Read from the document's own media
 * queries, not from impressions. Above it the document's container caps and the
 * extra width is only margin, so there is nothing to buy by opening wider.
 */
export const PREVIEW_PANE_MAX = 900;
/**
 * A real floor for the conversation column, not advice. Below it the artifact
 * card's action strip starts wrapping. Enforced as a `min-width` on the primary
 * column so shrink lands on the panel instead of collapsing the chat: the
 * primary is `flex-1` with `flex-basis: 0`, so without this every pixel of
 * shrink came out of the chat and it could resolve to zero.
 */
export const CHAT_MIN_WIDTH = 560;
/** The existing left nav, which is outside this host but inside the window. */
export const NAV_RAIL_WIDTH = 168;

/**
 * Default width for a pane showing a document, given the window it opens in.
 * 1440 (a laptop) resolves to 712; 1920 resolves to the 900 cap. Never a
 * ceiling on the drag - `MAX_WIDTH` still is - only where the pane STARTS.
 */
export const documentPaneDefaultWidth = (windowWidth: number): number =>
  Math.max(MIN_WIDTH, Math.min(PREVIEW_PANE_MAX, windowWidth - NAV_RAIL_WIDTH - CHAT_MIN_WIDTH));

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
    // The width is re-validated against the SAME bounds the drag writes it
    // under. That is deliberate and load-bearing: raising the drag ceiling
    // without the loader agreeing would let a user drag to the new maximum and
    // then find the panel silently back at the default on the next mount.
    const width =
      typeof parsed.width === 'number' && parsed.width >= MIN_WIDTH && parsed.width <= MAX_WIDTH
        ? parsed.width
        : undefined;
    return {
      collapsedIds: stringArray(parsed.collapsedIds),
      expandedIds: stringArray(parsed.expandedIds),
      width,
      // Rows written before `widthSetByUser` existed recorded the width on
      // EVERY mount, so a stored 340 proves nothing about intent. Any other
      // width is one only a drag could have produced, so it is honoured.
      widthSetByUser: parsed.widthSetByUser === true || (width !== undefined && width !== DEFAULT_WIDTH),
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
  /**
   * Whether `width` is the user's own choice. A dragged width outranks any
   * default a section would like, for as long as the conversation lives.
   */
  const [widthSetByUser, setWidthSetByUser] = useState(persisted.widthSetByUser === true);
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
    setWidthSetByUser(next.widthSetByUser === true);
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
    // A DISMISSIBLE section keeps its own closed-state; `collapsedIds` would be
    // a second copy of it, and the copy outlives the original.
    //
    // `preview` is `available: isPreviewOpen`, so dismissing it removes it from
    // `allSections` entirely. The reveal effect only walks THAT list, so
    // `priorRequests['preview']` is never advanced past the 'open' it held when
    // the section was last seen. The next deliverable asks to open it, the
    // signal equals the stale prior, no reveal fires — and `collapsedIds` still
    // holds 'preview' from the manual collapse, so `isExpanded` is false.
    //
    // The result was that collapsing the Preview card ONCE made every
    // subsequent deliverable open invisibly: present, requested, and rendered
    // collapsed with nothing to say so.
    //
    // So a section that dismisses on collapse is not also recorded as
    // collapsed. Its dismissal already suppresses it — `preview` through
    // `available`, `workspace` through `requestedOpen` — and when it comes back
    // it comes back open, which is what asking for it means.
    if (!section?.onDismiss) {
      setCollapsedIds((current) => {
        if (current.has(id)) return current;
        const next = new Set(current);
        next.add(id);
        return next;
      });
    }
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
          // Only a width the user picked is worth carrying forward. Persisting
          // the default too would make every reload look like an explicit
          // choice and permanently suppress a section's own default width.
          ...(widthSetByUser ? { width, widthSetByUser: true } : {}),
        } satisfies PersistedWorkbenchState)
      );
    } catch {
      // Storage is an enhancement; presentation still works when it is denied.
    }
  }, [collapsedIds, conversationId, expandedIds, width, widthSetByUser]);

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

  /**
   * A document section that has just become visible sets the pane's DEFAULT
   * width, once, and only while the user has not chosen one of their own. The
   * window - not the container - is the input: the formula already subtracts
   * the nav rail and the chat floor from it.
   */
  const documentSectionVisible = useMemo(
    () => visibleSections.some((section) => section.prefersDocumentWidth),
    [visibleSections]
  );

  useEffect(() => {
    if (!documentSectionVisible || widthSetByUser) return;
    setWidth(documentPaneDefaultWidth(typeof window === 'undefined' ? 0 : window.innerWidth));
  }, [documentSectionVisible, widthSetByUser]);

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
        setWidthSetByUser(true);
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
        {/* `min-w-0` is what let the chat collapse: `flex-1` gives the column
            `flex-basis: 0`, so with no floor EVERY pixel of shrink came out of
            the conversation and it could resolve to zero beside a wide pane.
            The floor only applies while a pane is actually docked beside it -
            an overlay panel is absolutely positioned and takes no flow width,
            and on a narrow window a 560px floor would only force a scrollbar. */}
        <div
          className='workbench-host__primary flex flex-1 min-w-0 min-h-0'
          style={panelOpen && !overlay ? { minWidth: `${CHAT_MIN_WIDTH}px` } : undefined}
        >
          {children}
        </div>

        {/* Collapsed rail. Labels once rendered with `[writing-mode:vertical-rl]`,
            which stacked "Workspace Core Observability" sideways down the window
            edge - unreadable at a glance and easy to mistake for a scrollbar.
            The rail stays a single toggle: one horizontal affordance that opens
            the panel, where every section is now listed as a readable row with
            its own glyph beside its label. */}
        {/* No rail toggle here on purpose.
            The app titlebar already carries a workspace toggle
            (Titlebar/index.tsx handleWorkspaceToggle) that opens this very
            panel, so a second 36px strip against the same edge was two controls
            doing one job - and the one nearer the content read as the primary,
            which it was not. One toggle, in the chrome, where every other
            window-level control lives. */}

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
              // The counterpart to the chat floor: a flex item's automatic
              // minimum is its CONTENT, so without this the pane could refuse
              // to give width back and the floor above would only overflow the
              // container instead of moving the shrink here.
              minWidth: 0,
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
                    className={classNames(
                      'workbench-host__section flex flex-col',
                      // A fill section claims the stack's leftover height; every
                      // other card stays sized by its own content.
                      section.fill && expanded ? 'flex-1 min-h-0' : 'shrink-0',
                      styles.section
                    )}
                    data-section-id={section.id}
                    data-expanded={expanded ? 'true' : 'false'}
                  >
                    <div className='flex items-center gap-4px'>
                      <h3 className='m-0 flex-1 min-w-0'>
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
                            section.id === primarySection.id
                              ? 'workbench-panel-title'
                              : `workbench-section-${section.id}`
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
                      {section.headerActions ? (
                        <div
                          className='shrink-0 flex items-center gap-2px'
                          style={{ paddingRight: `${SP.sm}px` }}
                          data-testid={`workbench-section-actions-${section.id}`}
                        >
                          {section.headerActions}
                        </div>
                      ) : null}
                    </div>
                    {mounted && (
                      <div
                        className={classNames(
                          'workbench-host__section-body overflow-auto',
                          section.fill && expanded && 'flex flex-col flex-1 min-h-0'
                        )}
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
