/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * No credential reaches an ACP conversation row. Migrated Core chats kept the
 * Flux Router provider row in `conversations.model` - `apiKey` in plain text -
 * and any writer handing the repository an ACP conversation with a `model`
 * (the legacy file-storage import, a Core-shaped object) would write it again.
 */
import { describe, expect, it } from 'vitest';
import type { TChatConversation } from '@/common/config/storage';
import { conversationToRow, rowToConversation } from '@process/services/database/types';

const FLUX_KEY = 'sk-flux-0123456789abcdef0123456789abcdef0123456789ab';
const provider = (apiKey: string) => ({
  id: 'flux-router-row',
  name: 'Flux Router',
  platform: 'openai-compatible',
  baseUrl: 'https://api.fluxrouter.ai/v1',
  apiKey,
  bedrockConfig: { authMethod: 'accessKey', region: 'us-east-1', secretAccessKey: 'aws-secret' },
  useModel: 'flux-reasoning',
});

const conversation = (type: string, apiKey: string) =>
  ({
    id: `c-${type}`,
    name: 'chat',
    type,
    extra: { backend: 'fuigo', workspace: '/ws' },
    model: provider(apiKey),
    createTime: 1,
    modifyTime: 2,
  }) as unknown as TChatConversation;

describe('conversationToRow - credentials', () => {
  it('writes no model, and so no key, for an ACP conversation', () => {
    const row = conversationToRow(conversation('acp', FLUX_KEY), 'default');

    expect(row.model).toBeUndefined();
    expect(JSON.stringify(row)).not.toContain(FLUX_KEY);
    expect(JSON.stringify(row)).not.toContain('aws-secret');
  });

  it('loses nothing: an ACP row never read its model back', () => {
    const row = conversationToRow(conversation('acp', FLUX_KEY), 'default');
    expect(rowToConversation({ ...row, model: JSON.stringify(provider(FLUX_KEY)) })).not.toHaveProperty('model');
  });

  it('still writes the Gemini model, which the Gemini runtime reads its key from', () => {
    const row = conversationToRow(conversation('gemini', 'gemini-key'), 'default');
    expect(JSON.parse(row.model!)).toMatchObject({ apiKey: 'gemini-key', useModel: 'flux-reasoning' });
  });
});
