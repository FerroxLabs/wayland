/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import { extractControlReceipt } from '../../../scripts/verify-wayland-nano-activation';

describe('Wayland Nano activation evidence journal parser', () => {
  it('extracts only the exact internally tagged control receipt', () => {
    const receipt = { decision: 'control_accepted', schema: 'wayland.nano.activation-receipt/v1' };
    const encoded = Buffer.from(JSON.stringify(receipt)).toString('base64');
    const journal = [
      JSON.stringify({ receipt: encoded, record_type: 'decision' }),
      JSON.stringify({
        activation_id: 'activation-1',
        nonce: 'control-1',
        receipt: encoded,
        record_type: 'control',
      }),
    ].join('\n');

    expect(extractControlReceipt(journal, 'activation-1', 'control-1')).toEqual(receipt);
    expect(extractControlReceipt(journal, 'activation-2', 'control-1')).toBeUndefined();
    expect(extractControlReceipt(journal, 'activation-1', 'control-2')).toBeUndefined();
  });

  it('rejects the externally tagged shape that caused the stopped runtime row', () => {
    const encoded = Buffer.from(JSON.stringify({ decision: 'control_accepted' })).toString('base64');
    const wrongShape = JSON.stringify({ Control: { receipt: encoded } });

    expect(extractControlReceipt(wrongShape, 'activation-1', 'control-1')).toBeUndefined();
  });
});
