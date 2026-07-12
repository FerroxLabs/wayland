/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TFunction } from 'i18next';
import type { TChatConversation } from '@/common/config/storage';
import type { IProject } from '@/common/types/project';

/** A file living in the project's `.wayland/reference/` folder. */
export type ReferenceFile = { name: string; path: string; size: number };

/**
 * The timeline is built ONLY from provenance a project actually records: its own
 * create/update stamps, the conversations assigned to it, and the reference files
 * on disk.
 *
 * It previously also modelled email-ingest records, Mail Drop links and remote
 * attachment imports. There is no email-INGEST-INTO-PROJECT backend in this
 * codebase — no service, no table — so the panel fed them a hard-coded empty
 * array and every user saw permanently-empty "Emails 0" and "Remote 0" filter
 * pills. (The `email-imap` channel is a chat TRANSPORT: inbound mail becomes a
 * conversation, which this timeline already surfaces as a `chat` event. It never
 * writes project files.) They were carried over from a fork the reporter
 * prototyped on. Removed rather than left as scaffolding: a filter that can never
 * match anything is not a placeholder, it is a broken control. Re-add the kinds
 * WITH the backend that populates them.
 */
export type HistoryKind = 'project' | 'chat' | 'inventory';

/**
 * The filter pills, as DATA. The type is derived from this array rather than the
 * other way round, so the panel and the "no dead pill" test both enumerate the
 * same single source of truth at RUNTIME.
 *
 * That matters: test files are not part of the `tsc --noEmit` program, so a
 * compile-time exhaustiveness trick in a test never actually runs. Adding a
 * filter here — with no kind behind it — turns the guard red.
 */
export const HISTORY_FILTERS = ['all', 'chat', 'reference'] as const;

export type HistoryFilter = (typeof HISTORY_FILTERS)[number];

export type HistoryRelatedRow = { label: string; value: string };

export type HistoryItem = {
  id: string;
  kind: HistoryKind;
  time?: number;
  title: string;
  eyebrow: string;
  summary: string;
  meta?: string;
  related: HistoryRelatedRow[];
  target?: string;
  targetLabel?: string;
};

export type TimelineInput = {
  project: IProject;
  conversations: TChatConversation[];
  references: ReferenceFile[];
};

/** Coerce a timestamp to milliseconds, treating clearly-second values as seconds. */
export const normalizeTime = (value?: number): number | undefined => {
  if (!value || Number.isNaN(value)) return undefined;
  return value < 10_000_000_000 ? value * 1000 : value;
};

const fmtSize = (bytes?: number): string | undefined => {
  if (!bytes || bytes < 0) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const eyebrowKey = (kind: HistoryKind): string => {
  if (kind === 'chat') return 'projects.timeline.eyebrow.chat';
  if (kind === 'inventory') return 'projects.timeline.eyebrow.reference';
  return 'projects.timeline.eyebrow.project';
};

/**
 * Fold the project's own provenance (creation, updates, its chats, and the
 * reference files it holds) into one time-ordered event list. Summaries are
 * derived honestly from data that exists — no transcript summarisation. All copy
 * goes through `t` so the timeline is fully localised.
 */
export function buildProjectTimeline(t: TFunction, input: TimelineInput): HistoryItem[] {
  const { project, conversations, references } = input;
  const items: HistoryItem[] = [];

  const eyebrow = (kind: HistoryKind): string => t(eyebrowKey(kind));

  items.push({
    id: 'project-created',
    kind: 'project',
    time: normalizeTime(project.createTime),
    title: t('projects.timeline.event.projectCreated.title'),
    eyebrow: eyebrow('project'),
    summary: t('projects.timeline.event.projectCreated.summary', { name: project.name }),
    related: [
      { label: t('projects.timeline.field.project'), value: project.name },
      ...(project.workspace ? [{ label: t('projects.timeline.field.workspace'), value: project.workspace }] : []),
    ],
  });

  const createdMs = normalizeTime(project.createTime);
  const modifiedMs = normalizeTime(project.modifyTime);
  if (modifiedMs && modifiedMs !== createdMs) {
    items.push({
      id: 'project-updated',
      kind: 'project',
      time: modifiedMs,
      title: t('projects.timeline.event.projectUpdated.title'),
      eyebrow: eyebrow('project'),
      summary: t('projects.timeline.event.projectUpdated.summary', { name: project.name }),
      related: [{ label: t('projects.timeline.field.project'), value: project.name }],
    });
  }

  for (const conversation of conversations) {
    const backend = (conversation.extra as { backend?: string } | undefined)?.backend || conversation.type;
    const title = conversation.name || t('projects.timeline.event.chat.untitled');
    items.push({
      id: `chat-${conversation.id}`,
      kind: 'chat',
      time: normalizeTime(conversation.modifyTime ?? conversation.createTime),
      title,
      eyebrow: eyebrow('chat'),
      summary: t('projects.timeline.event.chat.summary', { title, backend }),
      meta: backend,
      related: [
        { label: t('projects.timeline.field.backend'), value: String(backend) },
        { label: t('projects.timeline.field.type'), value: String(conversation.type) },
      ],
      target: `/conversation/${conversation.id}`,
      targetLabel: t('projects.timeline.event.chat.open'),
    });
  }

  for (const reference of references) {
    items.push({
      id: `inventory-${reference.name}`,
      kind: 'inventory',
      title: t('projects.timeline.event.inventory.title'),
      eyebrow: eyebrow('inventory'),
      summary: t('projects.timeline.event.inventory.summary', { file: reference.name }),
      meta: fmtSize(reference.size),
      related: [
        { label: t('projects.timeline.field.file'), value: reference.name },
        ...(fmtSize(reference.size)
          ? [{ label: t('projects.timeline.field.size'), value: fmtSize(reference.size)! }]
          : []),
      ],
    });
  }

  // Newest first; undated inventory items (time undefined → 0) fall to the bottom.
  return items.toSorted((a, b) => (b.time ?? 0) - (a.time ?? 0));
}

/** Does a timeline item belong to the selected filter pill? */
export function itemMatchesFilter(item: HistoryItem, filter: HistoryFilter): boolean {
  if (filter === 'all') return true;
  // The "Refs" pill selects reference files, which are recorded as `inventory`.
  if (filter === 'reference') return item.kind === 'inventory';
  return item.kind === filter;
}

/** Filter a built timeline down to the events a pill selects. */
export function filterTimeline(items: HistoryItem[], filter: HistoryFilter): HistoryItem[] {
  return items.filter((item) => itemMatchesFilter(item, filter));
}

/**
 * Per-source counts for the filter pills — counts inputs, not rendered rows.
 * The "All" pill uses the built timeline's own length, so it is not duplicated here.
 */
export function timelineCounts(input: TimelineInput): {
  chat: number;
  reference: number;
} {
  return {
    chat: input.conversations.length,
    reference: input.references.length,
  };
}
