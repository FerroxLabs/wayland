/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import type { TChatConversation } from '@/common/config/storage';
import type { IProject } from '@/common/types/project';
import {
  buildProjectTimeline,
  filterTimeline,
  timelineCounts,
  type EmailIngestRecord,
  type ReferenceFile,
} from '@/renderer/pages/projects/components/projectHistory';

// A translator stub that echoes the key back, so assertions stay decoupled from
// the English copy and only verify that the correct key was chosen.
const t = ((key: string) => key) as unknown as TFunction;

const project: IProject = {
  id: 'p1',
  name: 'Launch funnel',
  pinned: false,
  createTime: 1_700_000_000_000,
  modifyTime: 1_700_000_000_000,
};

const chat = (id: string, modifyTime: number, name = `Chat ${id}`): TChatConversation =>
  ({
    id,
    name,
    type: 'gemini',
    extra: { backend: 'gemini' },
    createTime: modifyTime,
    modifyTime,
  }) as unknown as TChatConversation;

describe('buildProjectTimeline', () => {
  it('always emits a project-created event and nothing else for a bare project', () => {
    const items = buildProjectTimeline(t, { project, conversations: [], emailHistory: [], references: [] });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'project-created', kind: 'project', time: project.createTime });
  });

  it('adds a project-updated event only when modifyTime differs from createTime', () => {
    const updated: IProject = { ...project, modifyTime: project.createTime + 5_000 };
    const items = buildProjectTimeline(t, { project: updated, conversations: [], emailHistory: [], references: [] });
    expect(items.map((i) => i.id)).toContain('project-updated');
  });

  it('maps conversations to chat events with an Open chat target, newest first', () => {
    const items = buildProjectTimeline(t, {
      project,
      conversations: [chat('a', project.createTime + 1_000), chat('b', project.createTime + 9_000)],
      emailHistory: [],
      references: [],
    });
    const chats = items.filter((i) => i.kind === 'chat');
    expect(chats.map((c) => c.id)).toEqual(['chat-b', 'chat-a']);
    expect(chats[0].target).toBe('/conversation/b');
    expect(chats[0].targetLabel).toBeTruthy();
  });

  it('expands an email record into email + reference + remote events by status', () => {
    const email: EmailIngestRecord = {
      id: 'e1',
      from: 'ada@example.com',
      subject: 'Specs',
      receivedAt: project.createTime + 20_000,
      status: 'saved',
      attachmentCount: 3,
      referenceFiles: ['spec.pdf', 'brand.md'],
      remoteAttachmentLinks: [
        { url: 'u1', status: 'saved', savedReferenceFile: 'big.zip' },
        { url: 'u2', status: 'ignored' },
        { url: 'u3', status: 'pending' },
        { url: 'u4', status: 'failed', lastError: 'timeout' },
      ],
    };
    const items = buildProjectTimeline(t, { project, conversations: [], emailHistory: [email], references: [] });
    const kinds = items.map((i) => i.kind);
    expect(kinds.filter((k) => k === 'email')).toHaveLength(1);
    expect(kinds.filter((k) => k === 'reference')).toHaveLength(2);
    expect(kinds.filter((k) => k === 'remote-import')).toHaveLength(1);
    expect(kinds.filter((k) => k === 'remote-ignore')).toHaveLength(1);
    // pending + failed both fall under the remote-pending kind.
    expect(kinds.filter((k) => k === 'remote-pending')).toHaveLength(2);
  });

  it('lists reference-folder files with no timestamp as inventory events, sorted last', () => {
    const references: ReferenceFile[] = [{ name: 'old.pdf', path: '/x/old.pdf', size: 2048 }];
    const items = buildProjectTimeline(t, { project, conversations: [], emailHistory: [], references });
    const inv = items.find((i) => i.kind === 'inventory');
    expect(inv).toBeDefined();
    expect(inv?.time).toBeUndefined();
    expect(items[items.length - 1].kind).toBe('inventory');
  });

  it('does not double-count reference files already saved from an email', () => {
    const email: EmailIngestRecord = {
      id: 'e1',
      from: 'ada@example.com',
      subject: 'Specs',
      receivedAt: project.createTime + 20_000,
      status: 'saved',
      attachmentCount: 1,
      referenceFiles: ['spec.pdf'],
    };
    const references: ReferenceFile[] = [{ name: 'spec.pdf', path: '/x/spec.pdf', size: 1024 }];
    const items = buildProjectTimeline(t, { project, conversations: [], emailHistory: [email], references });
    expect(items.filter((i) => i.kind === 'inventory')).toHaveLength(0);
    expect(items.filter((i) => i.kind === 'reference')).toHaveLength(1);
  });

  it('degrades gracefully with no email history (no email/remote events)', () => {
    const items = buildProjectTimeline(t, {
      project,
      conversations: [chat('a', project.createTime + 1_000)],
      emailHistory: [],
      references: [{ name: 'r.pdf', path: '/x/r.pdf', size: 10 }],
    });
    expect(items.some((i) => i.kind === 'email')).toBe(false);
    expect(items.some((i) => i.kind.startsWith('remote'))).toBe(false);
  });
});

describe('filterTimeline', () => {
  const email: EmailIngestRecord = {
    id: 'e1',
    from: 'ada@example.com',
    subject: 'Specs',
    receivedAt: project.createTime + 20_000,
    status: 'saved',
    attachmentCount: 1,
    referenceFiles: ['spec.pdf'],
    remoteAttachmentLinks: [{ url: 'u1', status: 'saved' }],
  };
  const items = buildProjectTimeline(t, {
    project,
    conversations: [chat('a', project.createTime + 1_000)],
    emailHistory: [email],
    references: [{ name: 'loose.pdf', path: '/x/loose.pdf', size: 10 }],
  });

  it('returns everything for the all filter', () => {
    expect(filterTimeline(items, 'all')).toHaveLength(items.length);
  });

  it('restricts to chat events', () => {
    expect(filterTimeline(items, 'chat').every((i) => i.kind === 'chat')).toBe(true);
  });

  it('treats reference and inventory as the reference filter', () => {
    const kinds = new Set(filterTimeline(items, 'reference').map((i) => i.kind));
    expect([...kinds].every((k) => k === 'reference' || k === 'inventory')).toBe(true);
    expect(kinds.size).toBeGreaterThan(0);
  });

  it('collects all remote kinds under the remote filter', () => {
    expect(filterTimeline(items, 'remote').every((i) => i.kind.startsWith('remote'))).toBe(true);
  });
});

describe('timelineCounts', () => {
  it('counts by source, not by rendered event', () => {
    const email: EmailIngestRecord = {
      id: 'e1',
      from: 'ada@example.com',
      subject: 'Specs',
      receivedAt: project.createTime + 20_000,
      status: 'saved',
      attachmentCount: 1,
      referenceFiles: ['spec.pdf'],
      remoteAttachmentLinks: [
        { url: 'u1', status: 'saved' },
        { url: 'u2', status: 'ignored' },
      ],
    };
    const counts = timelineCounts({
      project,
      conversations: [chat('a', 1), chat('b', 2)],
      emailHistory: [email],
      references: [{ name: 'x.pdf', path: '/x.pdf', size: 1 }],
    });
    expect(counts).toEqual({ chat: 2, email: 1, reference: 1, remote: 2 });
  });
});
