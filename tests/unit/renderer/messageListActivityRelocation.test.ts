/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * #252 reframe guard (secondary, lint-style): the source invariants that enforce
 * the relocation. The behavioral coverage lives in
 * messageListActivityRelocation.dom.test.tsx, which renders the message-list
 * switch and asserts no activity card DOM is produced. These string checks stay
 * as a cheap belt-and-suspenders guard against an accidental re-import.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const messageListPath = path.resolve(here, '../../../src/renderer/pages/conversation/Messages/MessageList.tsx');
const source = readFileSync(messageListPath, 'utf8');

describe('MessageList #252 activity relocation (source guard)', () => {
  it('does not render the inline activity card (activity case returns null)', () => {
    expect(source).not.toContain('<MessageActivity');
    const activityCase = source.slice(source.indexOf("case 'activity':"));
    // The case body up to the next case must be a bare `return null`.
    expect(activityCase.slice(0, activityCase.indexOf("case '", 5))).toContain('return null');
  });

  it('no longer imports MessageActivity into the message list', () => {
    expect(source).not.toMatch(/import\s+MessageActivity\s+from/);
  });
});
