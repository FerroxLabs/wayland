/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #180 — the project provenance timeline.
 *
 * The timeline is built only from provenance a project ACTUALLY records: its own
 * create/update stamps, its conversations, and its reference files. It previously
 * also modelled email-ingest records, Mail Drop links and remote attachment
 * imports — none of which exist in this codebase — fed by a hard-coded empty
 * array, so every user saw permanently-empty "Emails 0" and "Remote 0" pills.
 *
 * The last describe block is the guard that stops that class of bug coming back.
 */
import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import type { TChatConversation } from '@/common/config/storage';
import type { IProject } from '@/common/types/project';
import {
  buildProjectTimeline,
  filterTimeline,
  HISTORY_FILTERS,
  itemMatchesFilter,
  timelineCounts,
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
    const items = buildProjectTimeline(t, { project, conversations: [], references: [] });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'project-created', kind: 'project', time: project.createTime });
  });

  it('adds a project-updated event only when modifyTime differs from createTime', () => {
    const updated = { ...project, modifyTime: project.createTime + 5_000 };
    const items = buildProjectTimeline(t, { project: updated, conversations: [], references: [] });
    expect(items.map((i) => i.id)).toEqual(['project-updated', 'project-created']);
  });

  it('maps conversations to chat events with an Open chat target, newest first', () => {
    const items = buildProjectTimeline(t, {
      project,
      conversations: [chat('a', project.createTime + 1_000), chat('b', project.createTime + 9_000)],
      references: [],
    });
    const chats = items.filter((i) => i.kind === 'chat');
    expect(chats.map((i) => i.id)).toEqual(['chat-b', 'chat-a']);
    expect(chats[0].target).toBe('/conversation/b');
  });

  it('lists reference-folder files with no timestamp as inventory events, sorted last', () => {
    const references: ReferenceFile[] = [{ name: 'spec.pdf', path: '/r/spec.pdf', size: 2048 }];
    const items = buildProjectTimeline(t, { project, conversations: [], references });
    const last = items.at(-1)!;
    expect(last).toMatchObject({ id: 'inventory-spec.pdf', kind: 'inventory' });
    // Reference files carry no per-event timestamp (only an fs mtime), so they
    // sort to the bottom rather than pretending to a time they do not have.
    expect(last.time).toBeUndefined();
    expect(last.meta).toBe('2 KB');
  });

  it('only ever emits kinds that a project can actually record', () => {
    const items = buildProjectTimeline(t, {
      project: { ...project, modifyTime: project.createTime + 1 },
      conversations: [chat('a', project.createTime + 1_000)],
      references: [{ name: 'spec.pdf', path: '/r/spec.pdf', size: 10 }],
    });
    expect(new Set(items.map((i) => i.kind))).toEqual(new Set(['project', 'chat', 'inventory']));
  });
});

describe('filterTimeline', () => {
  const items = buildProjectTimeline(t, {
    project,
    conversations: [chat('a', project.createTime + 1_000)],
    references: [{ name: 'spec.pdf', path: '/r/spec.pdf', size: 10 }],
  });

  it('returns everything for the all filter', () => {
    expect(filterTimeline(items, 'all')).toHaveLength(items.length);
  });

  it('restricts to chat events', () => {
    expect(filterTimeline(items, 'chat').map((i) => i.id)).toEqual(['chat-a']);
  });

  it('the reference filter selects the reference-file (inventory) events', () => {
    expect(filterTimeline(items, 'reference').map((i) => i.id)).toEqual(['inventory-spec.pdf']);
  });
});

describe('timelineCounts', () => {
  it('counts by source, not by rendered event', () => {
    expect(
      timelineCounts({
        project,
        conversations: [chat('a', 1), chat('b', 2)],
        references: [{ name: 'spec.pdf', path: '/r/spec.pdf', size: 10 }],
      })
    ).toEqual({ chat: 2, reference: 1 });
  });
});

/**
 * The actual defect #180 shipped: filter pills the timeline can never populate.
 * A pill is a promise that some event exists behind it — so every filter must be
 * reachable from a kind the builder can genuinely emit.
 */
describe('#180: no filter may be permanently empty', () => {
  it('every filter is satisfiable by a kind the builder actually emits', () => {
    // A project exercising every source there is.
    const everything = buildProjectTimeline(t, {
      project: { ...project, modifyTime: project.createTime + 1 },
      conversations: [chat('a', project.createTime + 1_000)],
      references: [{ name: 'spec.pdf', path: '/r/spec.pdf', size: 10 }],
    });

    // Exhaustive at RUNTIME, off the same array the panel renders from.
    //
    // A hand-written `HistoryFilter[]` literal here would NOT be exhaustive — an
    // array is assignable as a SUBSET of the union, so re-adding 'email' would
    // type-check and this guard would silently skip it, missing the exact bug it
    // exists to catch. Nor does a compile-time trick (`Record<HistoryFilter,…>`)
    // help: test files are not in the `tsc --noEmit` program, so it would never
    // run. Iterating the exported const is the only version that actually bites.
    for (const filter of HISTORY_FILTERS) {
      expect(
        everything.some((item) => itemMatchesFilter(item, filter)),
        `filter "${filter}" matches nothing the timeline can ever produce — it is a dead pill`
      ).toBe(true);
    }
  });
});
