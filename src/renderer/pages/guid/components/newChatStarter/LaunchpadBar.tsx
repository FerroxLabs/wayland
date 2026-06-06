/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAssistantList } from '@/renderer/hooks/assistant';
import { useLaunchpadBar, LAUNCHPAD_MAX_ENTRIES } from '@/renderer/hooks/launchpad/useLaunchpadBar';
import AssistantIconTile from '@/renderer/pages/guid/components/AssistantIconTile';
import type { QuickLaunchAnchor } from '@/renderer/pages/guid/quickLaunchAnchors';
import { resolveBarEntry, type LaunchpadBarEntry } from './launchpadCatalog';
import LaunchpadPicker from './LaunchpadPicker';
import styles from './LaunchpadBar.module.css';

/**
 * Editable launchpad bar. Drag/drop reorder via dnd-kit, hover-to-remove,
 * + chip opens a picker drawer. Mounts on the launchpad cold-start
 * (mode='compact'), /assistants (mode='expanded'), and Settings (also
 * 'expanded'). All three surfaces share the same useLaunchpadBar hook
 * so a change on one is reflected on the others next time they mount.
 *
 * Keyboard accessibility: dnd-kit's KeyboardSensor handles space-to-lift,
 * arrow-keys-to-move, space-to-drop on the drag handle. Tab targets the
 * grip (top-left of each card) so a screen-reader user can reach the
 * reorder controls without the hover affordance.
 *
 * Click semantics - clicking the card body fires `onAnchorClick(anchor)`
 * where `anchor` is shaped like a QuickLaunchAnchor (so GuidPage's
 * existing handler keeps working unchanged). For non-default cards
 * (picker-added) the prefill is empty; selectPresetAssistant still runs.
 */

export type LaunchpadBarMode = 'compact' | 'expanded';

export type LaunchpadBarProps = {
  /** Fires when the user clicks a card body. Payload mirrors QuickLaunchAnchor. */
  onAnchorClick: (anchor: QuickLaunchAnchor) => void;
  /** Compact mode renders the "View all" link; expanded surfaces (full-page) hide it. */
  onViewAll?: () => void;
  mode?: LaunchpadBarMode;
};

const LaunchpadBar: React.FC<LaunchpadBarProps> = ({ onAnchorClick, onViewAll, mode = 'compact' }) => {
  const { t } = useTranslation();
  const { barOrder, loaded, setBarOrder, addToBar, removeFromBar, resetToDefaults } = useLaunchpadBar();
  const { assistants, localeKey } = useAssistantList();
  const [pickerOpen, setPickerOpen] = useState(false);

  const entries = useMemo<LaunchpadBarEntry[]>(() => {
    return barOrder
      .map((id) => resolveBarEntry(id, assistants, localeKey))
      .filter((e): e is LaunchpadBarEntry => e !== null);
  }, [barOrder, assistants, localeKey]);

  const sortableIds = useMemo(() => entries.map((e) => e.id), [entries]);

  // Real, live count of launchable assistants. Excludes team launchers
  // (`_kind === 'team'`) to match /assistants (which moved teams to /teams),
  // so "View all N" reflects what the picker actually offers, not the raw list.
  const assistantCount = useMemo(() => assistants.filter((a) => a._kind !== 'team').length, [assistants]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = sortableIds.indexOf(String(active.id));
      const newIndex = sortableIds.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(barOrder, barOrder.indexOf(String(active.id)), barOrder.indexOf(String(over.id)));
      setBarOrder(next);
    },
    [barOrder, setBarOrder, sortableIds]
  );

  const handleCardClick = useCallback(
    (entry: LaunchpadBarEntry) => {
      onAnchorClick({
        id: entry.id as QuickLaunchAnchor['id'],
        label: entry.label,
        sub: entry.sub,
        prefill: entry.prefill ?? '',
        assistantId: entry.assistantId,
        lucideIcon: '',
      });
    },
    [onAnchorClick]
  );

  const handleRemove = useCallback(
    (id: string) => {
      removeFromBar(id);
    },
    [removeFromBar]
  );

  const handlePick = useCallback(
    (assistantId: string) => {
      addToBar(assistantId);
    },
    [addToBar]
  );

  const togglePicker = useCallback(() => {
    setPickerOpen((prev) => !prev);
  }, []);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
  }, []);

  // The hook gates render with `loaded` so the bar never flashes the wrong
  // set on first paint. Keep the slot alive (same height as a populated row)
  // so kickoff/intent stacks below don't reflow.
  if (!loaded) {
    return <div className={styles.row} data-testid='launchpad-bar' aria-busy='true' />;
  }

  return (
    <div className={styles.row} data-testid='launchpad-bar' data-launchpad-mode={mode}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          <div className={styles.bar}>
            {entries.length === 0 ? (
              <div className={styles.empty} data-testid='launchpad-bar-empty'>
                {t('guid.launchpad.empty', {
                  defaultValue: 'Bar is empty. Click + to add assistants.',
                })}
              </div>
            ) : (
              entries.map((entry) => (
                <SortableCard
                  key={entry.id}
                  entry={entry}
                  onClick={handleCardClick}
                  onRemove={handleRemove}
                  removeLabel={t('guid.launchpad.remove', {
                    defaultValue: 'Remove {{label}}',
                    label: entry.label,
                  })}
                  dragLabel={t('guid.launchpad.dragHandle', {
                    defaultValue: 'Drag to reorder {{label}}',
                    label: entry.label,
                  })}
                />
              ))
            )}
            {entries.length < LAUNCHPAD_MAX_ENTRIES ? (
              <button
                type='button'
                className={`${styles.addChip} ${pickerOpen ? styles.addOpen : ''}`}
                onClick={togglePicker}
                data-testid='launchpad-add-chip'
                aria-expanded={pickerOpen}
                aria-label={t('guid.launchpad.addAria', { defaultValue: 'Add an assistant to the bar' })}
              >
                <span className={styles.addPlus} aria-hidden='true'>
                  <Plus size={14} />
                </span>
                <span>{t('guid.launchpad.add', { defaultValue: 'Add' })}</span>
              </button>
            ) : null}
          </div>
        </SortableContext>
      </DndContext>

      <div className={styles.actions}>
        {entries.length > 0 ? (
          <button
            type='button'
            className={styles.reset}
            onClick={resetToDefaults}
            data-testid='launchpad-reset'
          >
            {t('guid.launchpad.reset', { defaultValue: 'Reset to defaults' })}
          </button>
        ) : (
          <span />
        )}
        {mode === 'compact' && onViewAll ? (
          <button
            type='button'
            className={styles.viewAll}
            onClick={onViewAll}
            data-testid='launchpad-view-all'
          >
            {t('guid.launchpad.viewAll', {
              defaultValue: 'View all {{count}} →',
              count: assistantCount,
            })}
          </button>
        ) : null}
      </div>

      {pickerOpen ? (
        <LaunchpadPicker
          onClose={closePicker}
          onPick={handlePick}
          pinnedIds={barOrder}
          assistants={assistants}
          localeKey={localeKey}
        />
      ) : null}
    </div>
  );
};

type SortableCardProps = {
  entry: LaunchpadBarEntry;
  onClick: (entry: LaunchpadBarEntry) => void;
  onRemove: (id: string) => void;
  removeLabel: string;
  dragLabel: string;
};

const SortableCard: React.FC<SortableCardProps> = ({ entry, onClick, onRemove, removeLabel, dragLabel }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRemoveClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onRemove(entry.id);
    },
    [entry.id, onRemove]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.cardWrap} ${isDragging ? styles.dragging : ''}`}
      data-launchpad-entry={entry.id}
    >
      <LaunchpadCardBody entry={entry} onClick={() => onClick(entry)} />
      <button
        ref={setActivatorNodeRef}
        type='button'
        className={styles.grip}
        aria-label={dragLabel}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={12} aria-hidden='true' />
      </button>
      <button
        type='button'
        className={styles.removeBtn}
        onClick={handleRemoveClick}
        aria-label={removeLabel}
        data-testid={`launchpad-remove-${entry.id}`}
      >
        <X size={10} aria-hidden='true' />
      </button>
    </div>
  );
};

// Card body deliberately imported inline (rather than reusing QuickLaunchCard)
// because the bar needs (a) arbitrary assistantIds in `data-quicklaunch-id`
// for E2E parity and (b) tile resolution from LaunchpadBarEntry's pre-baked
// palette - which is a superset of QuickLaunchAnchorId. Splitting later if
// QuickLaunchCard ever needs the same flexibility.
const LaunchpadCardBody: React.FC<{ entry: LaunchpadBarEntry; onClick: () => void }> = ({ entry, onClick }) => {
  const { Icon, palette, label, sub, id, isCowork, avatarUrl, avatarEmoji } = entry;
  return (
    <button
      type='button'
      data-quicklaunch-id={id}
      className={`launchpad-body ${isCowork ? 'launchpad-body-anchor' : ''}`}
      onClick={onClick}
      aria-label={`${label} - ${sub}`}
      style={launchpadBodyStyle(isCowork)}
    >
      <AssistantIconTile paletteKey={palette} size='sm'>
        {avatarUrl ? (
          <img src={avatarUrl} alt='' style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
        ) : avatarEmoji ? (
          <span style={{ fontSize: 16, lineHeight: '18px' }}>{avatarEmoji}</span>
        ) : (
          <Icon size={16} />
        )}
      </AssistantIconTile>
      <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.25 }}>{label}</div>
      <div style={{ fontSize: 10.5, color: 'var(--color-text-3)', lineHeight: 1.3 }}>{sub}</div>
    </button>
  );
};

const launchpadBodyStyle = (isCowork: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  padding: '12px 10px 10px',
  background: isCowork
    ? 'linear-gradient(180deg, rgba(249, 115, 22, 0.08), var(--color-fill-2))'
    : 'var(--color-fill-2)',
  border: '1px solid',
  borderColor: isCowork ? 'rgba(249, 115, 22, 0.22)' : 'var(--color-border-2)',
  borderRadius: 10,
  cursor: 'pointer',
  minHeight: 86,
  textAlign: 'center',
  fontFamily: 'inherit',
  color: 'var(--color-text-1)',
  width: '100%',
  height: '100%',
  transition: 'background 120ms ease, border-color 120ms ease, transform 120ms ease',
});

// Drag-handle / remove-button positioning relies on the wrapper having `position: relative`
// (set in CSS module). The PointerSensor `distance: 6` keeps tap-to-click from being
// hijacked by the drag handler on the card body. The grip provides an explicit handle
// for keyboard sensor activation per dnd-kit accessibility docs.

export default LaunchpadBar;
