/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { shouldRebuildForMcpFingerprint } from '@process/bridge/conversationBridge';

describe('MCP session lazy rebuild gate', () => {
  it.each(['gemini', 'acp', 'codex', 'wcore'])('rebuilds a stale %s task before the next turn', (type) => {
    expect(shouldRebuildForMcpFingerprint(type, 'mcp-v1-old', 'mcp-v1-new')).toBe(true);
  });

  it('does not rebuild for unchanged authority, absent fingerprints, or unrelated runtimes', () => {
    expect(shouldRebuildForMcpFingerprint('wcore', 'same', 'same')).toBe(false);
    expect(shouldRebuildForMcpFingerprint('wcore', undefined, undefined)).toBe(false);
    expect(shouldRebuildForMcpFingerprint('openclaw-gateway', 'old', 'new')).toBe(false);
  });
});
