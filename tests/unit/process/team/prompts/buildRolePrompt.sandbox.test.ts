import { describe, expect, it } from 'vitest';
import { buildRolePrompt } from '@process/team/prompts/buildRolePrompt';
import type { TeamAgent } from '@process/team/types';

const leader: TeamAgent = {
  slotId: 'slot-lead',
  conversationId: 'conv-lead',
  role: 'leader',
  agentType: 'claude',
  agentName: 'Leader',
  conversationType: 'acp',
  status: 'idle',
};

const teammate: TeamAgent = {
  slotId: 'slot-mem',
  conversationId: 'conv-mem',
  role: 'teammate',
  agentType: 'claude',
  agentName: 'Worker',
  conversationType: 'acp',
  status: 'idle',
};

describe('buildRolePrompt - W4c sandbox wrap', () => {
  it('non-sandboxed leader: no wrap, no SYSTEM SANDBOX NOTICE', () => {
    const out = buildRolePrompt({ agent: leader, teammates: [] });
    expect(out).not.toContain('IMPORTED-UNTRUSTED-CONTENT-START');
    expect(out).not.toContain('IMPORTED-UNTRUSTED-CONTENT-END');
    expect(out).not.toContain('SYSTEM SANDBOX NOTICE');
  });

  it('sandboxed leader: wrap markers AND SYSTEM SANDBOX NOTICE suffix', () => {
    const out = buildRolePrompt({ agent: leader, teammates: [], isSandboxed: true });
    expect(out).toContain('<!-- IMPORTED-UNTRUSTED-CONTENT-START -->');
    expect(out).toContain('<!-- IMPORTED-UNTRUSTED-CONTENT-END -->');
    expect(out).toContain('SYSTEM SANDBOX NOTICE (non-overridable)');
    // Suffix must appear AFTER the closing marker
    const closingIdx = out.indexOf('IMPORTED-UNTRUSTED-CONTENT-END');
    const noticeIdx = out.indexOf('SYSTEM SANDBOX NOTICE');
    expect(noticeIdx).toBeGreaterThan(closingIdx);
  });

  it('sandboxed teammate: wrap markers, NO SYSTEM SANDBOX NOTICE', () => {
    const out = buildRolePrompt({ agent: teammate, teammates: [leader], isSandboxed: true });
    expect(out).toContain('IMPORTED-UNTRUSTED-CONTENT-START');
    expect(out).toContain('IMPORTED-UNTRUSTED-CONTENT-END');
    expect(out).not.toContain('SYSTEM SANDBOX NOTICE');
  });

  it('post-trust-grant: caller sets isSandboxed=false → no wrap', () => {
    const out = buildRolePrompt({ agent: leader, teammates: [], isSandboxed: false });
    expect(out).not.toContain('IMPORTED-UNTRUSTED-CONTENT');
    expect(out).not.toContain('SYSTEM SANDBOX NOTICE');
  });
});
