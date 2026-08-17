import { describe, it, expect } from 'vitest';
import { isAllowedForRemote, isAllowedOutboundToRemote } from '@/common/adapter/bridgeAllowlist';

/**
 * WS-D / R4: cost observability has no remote (paired-device WebSocket) view
 * today, so the ENTIRE cost.* namespace is denied to remote callers via the
 * `cost.` prefix. byConversation + series disclose per-conversation usage and a
 * fine-grained activity timeline; the WS-F budget mutations
 * (cost.upsertBudget / cost.deleteBudget) are write operations a paired WebUI
 * must never reach. The dispatcher receives each wire key as `subscribe-<key>`.
 */
describe('isAllowedForRemote - cost.* denied to remote callers', () => {
  const deniedKeys: ReadonlyArray<string> = [
    // Coarse aggregates (no remote cost view exists).
    'cost.summary',
    'cost.byModel',
    'cost.byBackend',
    'cost.byTeam',
    // Fine-grained / sensitive reads.
    'cost.byConversation',
    'cost.series',
    // Future WS-F budget mutations (denied now).
    'cost.upsertBudget',
    'cost.deleteBudget',
  ];

  it.each(deniedKeys)('denies %s for remote callers', (key) => {
    expect(isAllowedForRemote(`subscribe-${key}`)).toBe(false);
  });

  // The denylist must not leak to non-cost namespaces: a sibling read the
  // paired WebUI legitimately needs stays allowed (denylist, not whitelist).
  it('still allows a read-only sibling namespace for remote callers', () => {
    expect(isAllowedForRemote('subscribe-usage.queryFrequentlyUsedModels')).toBe(true);
  });
});

/**
 * #987: the OUTBOUND broadcast gate used to carry its own hand-maintained prefix
 * list (`['terminal.']`) and had drifted away from the inbound rule above, so
 * every cost.* EMITTER was still pushed to paired devices even though every
 * cost.* PROVIDER was denied. `cost.budgetGateBlocked` in particular carries the
 * held user message body (`content`) and its attached file paths.
 *
 * Assert the outbound denial for every key the inbound suite covers, so the two
 * directions can never diverge again.
 */
describe('isAllowedOutboundToRemote - cost.* never broadcast to remote peers (#987)', () => {
  const inboundDeniedKeys: ReadonlyArray<string> = [
    'cost.summary',
    'cost.byModel',
    'cost.byBackend',
    'cost.byTeam',
    'cost.byConversation',
    'cost.series',
    'cost.upsertBudget',
    'cost.deleteBudget',
    // Covered by the bun budgets suite (src/common/adapter/bridgeAllowlist.budgets.bun.test.ts).
    'cost.listBudgets',
    // The two REAL emitters that were leaking (ipcBridge.ts cost.budgetAlert /
    // cost.budgetGateBlocked).
    'cost.budgetAlert',
    'cost.budgetGateBlocked',
  ];

  it.each(inboundDeniedKeys)('never broadcasts %s to a remote peer', (key) => {
    expect(isAllowedOutboundToRemote(key)).toBe(false);
  });

  // The invariant, stated directly: inbound-denied implies outbound-denied.
  it.each(inboundDeniedKeys)('keeps outbound denial in lockstep with inbound for %s', (key) => {
    expect(isAllowedForRemote(`subscribe-${key}`)).toBe(false);
    expect(isAllowedOutboundToRemote(key)).toBe(false);
  });

  // Still a denylist, not a whitelist: the emitters a paired device needs remain
  // broadcastable (these are the ones the #645 terminal suite already pins).
  it('still broadcasts emitters a paired device legitimately needs', () => {
    expect(isAllowedOutboundToRemote('chat.response.stream')).toBe(true);
    expect(isAllowedOutboundToRemote('conversation.list-changed')).toBe(true);
    expect(isAllowedOutboundToRemote('project.changed')).toBe(true);
  });
});
