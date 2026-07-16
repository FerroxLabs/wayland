import { describe, it, expect } from 'vitest';
import { DEFAULT_ACCOUNT_ID, resolveAccountId } from '@/common/config/account';
import { buildAgentConversationParams } from '@/common/utils/buildAgentConversationParams';
import type { TProviderWithModel } from '@/common/config/storage';

/**
 * Multi-account Phase 1a (audit C2/C5): the account a binding targets is a
 * STRUCTURED field, defaults to `'default'`, and a conversation freezes its own
 * `accountId` at create time so two chats on the same backend can hold
 * different accounts and a resume never re-attributes.
 */
describe('resolveAccountId', () => {
  it('defaults to the implicit single-account row when absent', () => {
    expect(resolveAccountId(undefined)).toBe(DEFAULT_ACCOUNT_ID);
    expect(resolveAccountId(null)).toBe(DEFAULT_ACCOUNT_ID);
    expect(resolveAccountId({})).toBe('default');
    expect(resolveAccountId({ accountId: '' })).toBe('default');
    expect(resolveAccountId({ accountId: '   ' })).toBe('default');
  });

  it('returns an explicit account id verbatim', () => {
    expect(resolveAccountId({ accountId: 'acct_beta' })).toBe('acct_beta');
  });
});

describe('buildAgentConversationParams - account binding stickiness', () => {
  const baseModel = (accountId?: string): TProviderWithModel => ({
    id: 'openrouter',
    platform: 'openai',
    name: 'OpenRouter',
    baseUrl: '',
    apiKey: '',
    useModel: 'qwen3-coder:free',
    ...(accountId ? { accountId } : {}),
  });

  it('preserves a structured accountId through to the conversation model blob', () => {
    const params = buildAgentConversationParams({
      backend: 'wcore',
      name: 'chat A',
      workspace: '/tmp/a',
      model: baseModel('acct_alpha'),
    });
    expect(params.model.accountId).toBe('acct_alpha');
    // Real model ids carry colons - the binding must not corrupt them (audit C2).
    expect(params.model.useModel).toBe('qwen3-coder:free');
  });

  it('lets two conversations on the same backend hold different accounts', () => {
    const a = buildAgentConversationParams({
      backend: 'wcore',
      name: 'A',
      workspace: '/tmp/a',
      model: baseModel('acct_alpha'),
    });
    const b = buildAgentConversationParams({
      backend: 'wcore',
      name: 'B',
      workspace: '/tmp/b',
      model: baseModel('acct_beta'),
    });
    expect(a.model.accountId).toBe('acct_alpha');
    expect(b.model.accountId).toBe('acct_beta');
  });

  it('a binding with no accountId resolves to the default account', () => {
    const params = buildAgentConversationParams({
      backend: 'wcore',
      name: 'A',
      workspace: '/tmp/a',
      model: baseModel(),
    });
    expect(params.model.accountId).toBeUndefined();
    expect(resolveAccountId(params.model)).toBe('default');
  });
});
