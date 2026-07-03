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
 * A Mail Drop / remote attachment link captured from an email. The email-ingest
 * backend does not exist on this branch yet, so the panel feeds an empty list;
 * the shape is modelled here so the timeline lights up the moment a source lands.
 */
export type RemoteAttachmentLink = {
  url: string;
  label?: string;
  filename?: string;
  size?: string;
  status?: 'pending' | 'saved' | 'failed' | 'ignored';
  savedReferenceFile?: string;
  downloadedAt?: number;
  bytes?: number;
  lastError?: string;
  ignoredAt?: number;
};

/** One project email that was ingested (with any attachments it produced). */
export type EmailIngestRecord = {
  id: string;
  from: string;
  subject: string;
  receivedAt: number;
  status: 'saved' | 'rejected' | 'failed';
  reason?: string;
  referenceFiles: string[];
  attachmentCount: number;
  remoteAttachmentLinks?: RemoteAttachmentLink[];
};

export type HistoryKind =
  | 'project'
  | 'chat'
  | 'email'
  | 'reference'
  | 'remote-import'
  | 'remote-ignore'
  | 'remote-pending'
  | 'inventory';

export type HistoryFilter = 'all' | 'chat' | 'email' | 'reference' | 'remote';

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
  emailHistory: EmailIngestRecord[];
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
  if (kind === 'email') return 'projects.timeline.eyebrow.email';
  if (kind === 'reference' || kind === 'inventory') return 'projects.timeline.eyebrow.reference';
  if (kind === 'remote-import' || kind === 'remote-ignore' || kind === 'remote-pending')
    return 'projects.timeline.eyebrow.remote';
  return 'projects.timeline.eyebrow.project';
};

/**
 * Fold every project artifact (creation, chats, ingested emails, reference saves
 * and remote attachment actions) into a single time-ordered event list. Summaries
 * are derived honestly from data that exists — no transcript summarisation. All
 * copy goes through `t` so the timeline is fully localised.
 */
export function buildProjectTimeline(t: TFunction, input: TimelineInput): HistoryItem[] {
  const { project, conversations, emailHistory, references } = input;
  const items: HistoryItem[] = [];
  const knownReferenceNames = new Set<string>();

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

  for (const record of emailHistory) {
    const receivedAt = normalizeTime(record.receivedAt);
    const remoteLinks = record.remoteAttachmentLinks ?? [];
    const savedReferenceCount = record.referenceFiles?.length ?? 0;
    const emailTitle = record.subject?.trim() || t('projects.timeline.event.email.noSubject');

    items.push({
      id: `email-${record.id}`,
      kind: 'email',
      time: receivedAt,
      title: emailTitle,
      eyebrow: eyebrow('email'),
      summary: record.from
        ? t('projects.timeline.event.email.summaryFrom', { from: record.from, status: record.status })
        : t('projects.timeline.event.email.summary', { status: record.status }),
      meta: record.status,
      related: [
        ...(record.from ? [{ label: t('projects.timeline.field.from'), value: record.from }] : []),
        { label: t('projects.timeline.field.status'), value: record.status },
        ...(record.attachmentCount
          ? [{ label: t('projects.timeline.field.attachments'), value: String(record.attachmentCount) }]
          : []),
        ...(savedReferenceCount
          ? [{ label: t('projects.timeline.field.referencesSaved'), value: String(savedReferenceCount) }]
          : []),
        ...(remoteLinks.length
          ? [{ label: t('projects.timeline.field.remoteLinks'), value: String(remoteLinks.length) }]
          : []),
        ...(record.reason ? [{ label: t('projects.timeline.field.reason'), value: record.reason }] : []),
      ],
    });

    for (const fileName of record.referenceFiles ?? []) {
      knownReferenceNames.add(fileName);
      items.push({
        id: `email-reference-${record.id}-${fileName}`,
        kind: 'reference',
        time: receivedAt,
        title: t('projects.timeline.event.reference.title'),
        eyebrow: eyebrow('reference'),
        summary: t('projects.timeline.event.reference.summary', { file: fileName, subject: emailTitle }),
        meta: emailTitle,
        related: [
          { label: t('projects.timeline.field.file'), value: fileName },
          { label: t('projects.timeline.field.sourceEmail'), value: emailTitle },
          ...(record.from ? [{ label: t('projects.timeline.field.from'), value: record.from }] : []),
        ],
      });
    }

    remoteLinks.forEach((link, index) => {
      const label = link.savedReferenceFile || link.filename || link.label || t('projects.timeline.field.attachment');
      if (link.savedReferenceFile) knownReferenceNames.add(link.savedReferenceFile);
      const sizeMeta = link.size || fmtSize(link.bytes);
      const baseRelated: HistoryRelatedRow[] = [
        { label: t('projects.timeline.field.attachment'), value: label },
        { label: t('projects.timeline.field.sourceEmail'), value: emailTitle },
        ...(sizeMeta ? [{ label: t('projects.timeline.field.size'), value: sizeMeta }] : []),
      ];

      if (link.status === 'saved') {
        items.push({
          id: `remote-import-${record.id}-${index}`,
          kind: 'remote-import',
          time: normalizeTime(link.downloadedAt) ?? receivedAt,
          title: t('projects.timeline.event.remoteImport.title'),
          eyebrow: eyebrow('remote-import'),
          summary: t('projects.timeline.event.remoteImport.summary', { subject: emailTitle }),
          meta: sizeMeta,
          related: baseRelated,
        });
      } else if (link.status === 'ignored') {
        items.push({
          id: `remote-ignore-${record.id}-${index}`,
          kind: 'remote-ignore',
          time: normalizeTime(link.ignoredAt) ?? receivedAt,
          title: t('projects.timeline.event.remoteIgnore.title'),
          eyebrow: eyebrow('remote-ignore'),
          summary: t('projects.timeline.event.remoteIgnore.summary', { subject: emailTitle }),
          meta: sizeMeta,
          related: baseRelated,
        });
      } else {
        const failed = link.status === 'failed';
        items.push({
          id: `remote-pending-${record.id}-${index}`,
          kind: 'remote-pending',
          time: receivedAt,
          title: failed
            ? t('projects.timeline.event.remoteFailed.title')
            : t('projects.timeline.event.remotePending.title'),
          eyebrow: eyebrow('remote-pending'),
          summary: failed
            ? t('projects.timeline.event.remoteFailed.summary', { subject: emailTitle })
            : t('projects.timeline.event.remotePending.summary', { subject: emailTitle }),
          meta: sizeMeta,
          related: [
            ...baseRelated,
            ...(link.lastError ? [{ label: t('projects.timeline.field.lastError'), value: link.lastError }] : []),
          ],
        });
      }
    });
  }

  for (const reference of references) {
    if (knownReferenceNames.has(reference.name)) continue;
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
  if (filter === 'reference') return item.kind === 'reference' || item.kind === 'inventory';
  if (filter === 'remote')
    return item.kind === 'remote-import' || item.kind === 'remote-ignore' || item.kind === 'remote-pending';
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
  email: number;
  reference: number;
  remote: number;
} {
  const remote = input.emailHistory.reduce((n, r) => n + (r.remoteAttachmentLinks?.length ?? 0), 0);
  return {
    chat: input.conversations.length,
    email: input.emailHistory.length,
    reference: input.references.length,
    remote,
  };
}
