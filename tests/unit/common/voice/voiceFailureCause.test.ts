/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { describeVoiceFailureCause } from '@/common/voice/voiceFailureCause';

describe('describeVoiceFailureCause', () => {
  it('leads with the first sentence and keeps the whole refusal behind it', () => {
    const raw =
      'Agent failed to start: wcore refused to start: WARNING: [storage.credentials] backend = "plaintext" is ' +
      'configured. Secrets are written UNENCRYPTED to /Users/owner/.wayland/credentials.toml. Remove the setting ' +
      'to use the OS keyring or the encrypted vault instead.';

    const cause = describeVoiceFailureCause(raw);

    expect(cause?.summary).toBe(
      'Agent failed to start: wcore refused to start: WARNING: [storage.credentials] backend = "plaintext" is configured.'
    );
    expect(cause?.full).toBe(raw);
  });

  it('does not mistake a dot inside a path for the end of a sentence', () => {
    const cause = describeVoiceFailureCause('Could not read /etc/wayland/config.toml v1.2.3 and stopped.');

    expect(cause?.summary).toBe('Could not read /etc/wayland/config.toml v1.2.3 and stopped.');
  });

  it('folds a newline-wrapped engine dump into one readable line', () => {
    const cause = describeVoiceFailureCause('wcore refused to start:\n\n  backend = "plaintext"\n  is configured.');

    expect(cause?.summary).toBe('wcore refused to start: backend = "plaintext" is configured.');
  });

  it('clips a run-on with no sentence break at a word boundary rather than mid-word', () => {
    const raw = `${'sustained '.repeat(40)}terminus`;

    const cause = describeVoiceFailureCause(raw);

    expect(cause?.summary.length).toBeLessThanOrEqual(201);
    expect(cause?.summary.endsWith('sustained…')).toBe(true);
    // The point of clipping rather than truncating: nothing is lost.
    expect(cause?.full).toBe(raw.trim());
  });

  it('reads the frame shapes the bridges actually emit, and nothing else', () => {
    expect(describeVoiceFailureCause({ content: 'Model returned no answer.' })?.summary).toBe(
      'Model returned no answer.'
    );
    expect(describeVoiceFailureCause({ message: 'Model returned no answer.' })?.summary).toBe(
      'Model returned no answer.'
    );
    expect(describeVoiceFailureCause(null)).toBeNull();
    expect(describeVoiceFailureCause('   ')).toBeNull();
    expect(describeVoiceFailureCause({ nothing: 'useful' })).toBeNull();
  });
});
