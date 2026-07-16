import { describe, expect, it } from 'vitest';
import {
  isMcpSessionTruthPreviewEnabled,
  MCP_SESSION_TRUTH_PREVIEW_ENV,
} from '@process/services/mcpServices/mcpSessionTruthGate';

describe('MCP session-truth preview gate', () => {
  it('is disabled by default', () => {
    expect(isMcpSessionTruthPreviewEnabled({ NODE_ENV: 'development' }, false)).toBe(false);
  });

  it('can be enabled only in an unpackaged test harness', () => {
    expect(isMcpSessionTruthPreviewEnabled({ NODE_ENV: 'test', [MCP_SESSION_TRUTH_PREVIEW_ENV]: '1' }, false)).toBe(
      true
    );
  });

  it('cannot be enabled in development, production, or a packaged test-shaped process', () => {
    expect(
      isMcpSessionTruthPreviewEnabled({ NODE_ENV: 'development', [MCP_SESSION_TRUTH_PREVIEW_ENV]: '1' }, false)
    ).toBe(false);
    expect(
      isMcpSessionTruthPreviewEnabled({ NODE_ENV: 'production', [MCP_SESSION_TRUTH_PREVIEW_ENV]: '1' }, false)
    ).toBe(false);
    expect(isMcpSessionTruthPreviewEnabled({ NODE_ENV: 'test', [MCP_SESSION_TRUTH_PREVIEW_ENV]: '1' }, true)).toBe(
      false
    );
  });
});
