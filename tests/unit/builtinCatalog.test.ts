/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Proves the waylandteams catalog loads as NATIVE built-ins (config.assistants
 * path), with the team metadata + context needed for /teams parity - no
 * extension subsystem involved.
 */
import { describe, expect, it } from 'vitest';

import {
  getBuiltinCatalogAssistants,
  getBuiltinCatalogContext,
  isBuiltinCatalogId,
} from '@process/utils/builtinCatalog';
import { normalizeStoredAssistant } from '@/renderer/pages/settings/AssistantSettings/assistantUtils';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';

describe('native builtin catalog (waylandteams)', () => {
  const records = getBuiltinCatalogAssistants();

  it('emits all 88 records as native built-ins (60 teams + 28 specialists)', () => {
    expect(records.length).toBe(88);
    expect(records.filter((r) => r.kind === 'team').length).toBe(60);
    expect(records.filter((r) => r.kind === 'specialist').length).toBe(28);
  });

  it('every record is a native built-in preset, enabled, with a data-URI avatar', () => {
    for (const r of records) {
      expect(r.id.startsWith('builtin-')).toBe(true);
      expect(r.isBuiltin).toBe(true);
      expect(r.isPreset).toBe(true);
      expect(r.enabled).toBe(true);
      expect(String(r.avatar).startsWith('data:image/svg+xml;base64,')).toBe(true);
    }
  });

  it('does not store context in the config record (served via fsBridge instead)', () => {
    for (const r of records) {
      expect((r as { context?: string }).context).toBeUndefined();
    }
  });

  it('serves context for every record id and resolves ids correctly', () => {
    for (const r of records) {
      expect(isBuiltinCatalogId(r.id)).toBe(true);
      const ctx = getBuiltinCatalogContext(r.id);
      expect(typeof ctx === 'string' && ctx.length > 0).toBe(true);
    }
    expect(isBuiltinCatalogId('builtin-word-creator')).toBe(false); // a real preset, not catalog
    expect(getBuiltinCatalogContext('nope')).toBeUndefined();
  });

  it('team records carry roster/standing metadata; standing companies are flagged', () => {
    const standing = records.filter((r) => r.standing === true);
    expect(standing.length).toBeGreaterThan(0);
    for (const s of standing) {
      expect(s.kind).toBe('team');
      expect(Array.isArray(s.teammates)).toBe(true);
    }
  });

  it('normalizeStoredAssistant maps kind/teammates/standing onto the renderer _ fields', () => {
    const team = records.find((r) => r.kind === 'team' && (r.teammates?.length ?? 0) > 0)!;
    const mapped = normalizeStoredAssistant(team as AssistantListItem);
    expect(mapped._kind).toBe('team');
    expect(mapped._teammates).toEqual(team.teammates);
    expect(mapped._standing).toBe(team.standing);

    // A plain preset row (no kind) is returned untouched - no _kind injected.
    const preset = { id: 'builtin-word-creator', name: 'Word', isBuiltin: true } as AssistantListItem;
    expect(normalizeStoredAssistant(preset)._kind).toBeUndefined();
  });
});
