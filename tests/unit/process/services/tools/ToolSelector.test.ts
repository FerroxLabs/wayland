/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  selectToolsForSession,
  resolveToolBudget,
  DEFAULT_PROVIDER_TOOL_LIMIT,
  BUILTIN_TOOL_HEADROOM,
} from '@process/services/tools/ToolSelector';
import type { CandidateTool } from '@process/services/tools/toolContract';

const tool = (name: string, description = ''): CandidateTool => ({ serverId: 'srv', name, description });

describe('resolveToolBudget', () => {
  it('caps known providers to their limit minus built-in headroom', () => {
    expect(resolveToolBudget('openai')).toBe(128 - BUILTIN_TOOL_HEADROOM);
    expect(resolveToolBudget('gpt-5')).toBe(128 - BUILTIN_TOOL_HEADROOM);
  });

  it('falls back to a safe default for unknown providers (never overflows)', () => {
    expect(resolveToolBudget('some-future-provider')).toBe(DEFAULT_PROVIDER_TOOL_LIMIT - BUILTIN_TOOL_HEADROOM);
    expect(resolveToolBudget('')).toBe(DEFAULT_PROVIDER_TOOL_LIMIT - BUILTIN_TOOL_HEADROOM);
  });
});

describe('selectToolsForSession', () => {
  it('keeps every tool (relevance-ordered) when under budget', () => {
    const candidates = [
      tool('calendar_list', 'list google calendar events'),
      tool('gmail_send', 'send an email message'),
      tool('drive_search', 'search google drive files'),
    ];
    const result = selectToolsForSession(candidates, 'openai', "what's on my calendar today");
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('calendar_list'); // context match ranks first
    expect(new Set(result)).toEqual(new Set(['calendar_list', 'gmail_send', 'drive_search']));
  });

  it('caps an over-budget set to the provider budget (the #344 222 > 128 regression)', () => {
    // 222 candidates, OpenAI -> must come back within the cap, never the full 222.
    const candidates = Array.from({ length: 222 }, (_, i) => tool(`tool_${i}`, `description for tool number ${i}`));
    const result = selectToolsForSession(candidates, 'gpt-5', 'anything');
    expect(result.length).toBe(resolveToolBudget('gpt-5'));
    expect(result.length).toBeLessThanOrEqual(128);
  });

  it('puts the context-relevant tools first when over budget', () => {
    const budget = resolveToolBudget('openai');
    const candidates = [
      ...Array.from({ length: budget + 50 }, (_, i) => tool(`filler_${i}`, `unrelated filler ${i}`)),
      tool('kubernetes_deploy', 'deploy an application to a kubernetes cluster'),
    ];
    const result = selectToolsForSession(candidates, 'openai', 'deploy to kubernetes cluster');
    expect(result[0]).toBe('kubernetes_deploy');
    expect(result.length).toBe(budget);
  });

  it('deduplicates by tool name (two servers exposing the same name)', () => {
    const candidates: CandidateTool[] = [
      { serverId: 'a', name: 'search', description: 'search server A' },
      { serverId: 'b', name: 'search', description: 'search server B' },
      tool('unique', 'a unique tool'),
    ];
    const result = selectToolsForSession(candidates, 'openai', 'search');
    expect(result.filter((n) => n === 'search')).toHaveLength(1);
    expect(result).toContain('unique');
  });

  it('returns [] for no candidates', () => {
    expect(selectToolsForSession([], 'openai', 'anything')).toEqual([]);
  });
});
