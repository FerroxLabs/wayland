/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import enCron from '../../../src/renderer/services/i18n/locales/en-US/cron.json';
import { formatSchedule } from '../../../src/renderer/pages/cron/cronUtils';
import type { ICronJob } from '../../../src/common/adapter/ipcBridge';

// Minimal i18next-compatible stub: resolves "cron.page.scheduleDesc.*" keys
// against the real en-US cron.json, applies {{count}} pluralization
// (_one/_other) and {{var}} interpolation exactly like the runtime.
const t = ((key: string, opts?: Record<string, unknown>) => {
  const path = key.replace(/^cron\./, '').split('.');
  let node: unknown = enCron;
  for (const seg of path) {
    if (node && typeof node === 'object' && seg in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[seg];
    } else {
      node = undefined;
      break;
    }
  }

  // Pluralized keys: resolve _one / _other from the count option.
  if (node === undefined && opts && typeof opts.count === 'number') {
    const suffix = opts.count === 1 ? '_one' : '_other';
    const parent = enCron as unknown as Record<string, unknown>;
    let pluralNode: unknown = parent;
    for (const seg of [...path.slice(0, -1), `${path[path.length - 1]}${suffix}`]) {
      if (pluralNode && typeof pluralNode === 'object' && seg in (pluralNode as Record<string, unknown>)) {
        pluralNode = (pluralNode as Record<string, unknown>)[seg];
      } else {
        pluralNode = undefined;
        break;
      }
    }
    node = pluralNode;
  }

  if (typeof node !== 'string') return key;

  return node.replace(/\{\{(\w+)\}\}/g, (_m, name: string) => String(opts?.[name] ?? `{{${name}}}`));
}) as unknown as TFunction;

function cronJob(expr: string): ICronJob {
  return {
    id: 'test',
    name: 'test',
    enabled: true,
    schedule: { kind: 'cron', expr, description: 'fallback-description' },
    target: { payload: { kind: 'message', text: 'hi' } },
    metadata: {
      conversationId: 'c1',
      agentType: 'claude' as ICronJob['metadata']['agentType'],
      createdBy: 'user',
      createdAt: 0,
      updatedAt: 0,
    },
    state: { runCount: 0, retryCount: 0, maxRetries: 0 },
  };
}

describe('formatSchedule cron humanization', () => {
  it('humanizes */N hour step with a fixed minute (regression for #18)', () => {
    expect(formatSchedule(cronJob('17 */4 * * *'), t)).toBe('Every 4 hours at :17');
  });

  it('humanizes */N hour step without a fixed minute', () => {
    expect(formatSchedule(cronJob('* */6 * * *'), t)).toBe('Every 6 hours');
  });

  it('uses singular form for */1 hour step', () => {
    expect(formatSchedule(cronJob('0 */1 * * *'), t)).toBe('Every hour at :00');
  });

  it('humanizes */N minute step', () => {
    expect(formatSchedule(cronJob('*/15 * * * *'), t)).toBe('Every 15 minutes');
  });

  it('still humanizes a plain daily schedule', () => {
    expect(formatSchedule(cronJob('17 9 * * *'), t)).toBe('Every day at 09:17');
  });

  it('still humanizes the every-hour wildcard schedule', () => {
    expect(formatSchedule(cronJob('0 * * * *'), t)).toBe('Every hour');
  });

  it('does not treat a hour step as daily (no more "*/4:17")', () => {
    expect(formatSchedule(cronJob('17 */4 * * *'), t)).not.toContain('*/4');
  });
});
