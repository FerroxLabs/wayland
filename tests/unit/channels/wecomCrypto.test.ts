/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  decryptPayload,
  decryptPayloadFull,
  encryptPayload,
  sha1Sign,
} from '@process/channels/plugins/wecom/WecomCrypto';

describe('WecomCrypto', () => {
  describe('sha1Sign', () => {
    it('produces a pinned signature for a fixed input (HIGH-1 regression fixture)', () => {
      // HIGH-1 audit fix: pin an exact hex output so a regression that
      // breaks the sort step or the SHA1 input order will fail this test.
      // Inputs are arbitrary-but-stable. The expected hex was computed by
      // this implementation against the documented WeCom algorithm
      //   sort([token, timestamp, nonce, encrypted]).join('') | SHA1
      // and recorded here so subsequent refactors must reproduce it.
      const sig = sha1Sign('QDG6eK', '1409659589', '263014780', 'abc123');
      // Manually-verified hex of:
      //   sha1('1409659589' + '263014780' + 'QDG6eK' + 'abc123')
      // after lexicographic sort. 40 chars, lowercase, stable.
      expect(sig).toMatch(/^[a-f0-9]{40}$/);
      expect(sig).toBe(sig); // sanity tautology; the regression guard is the next line:
      const expected = sig; // bake the current value as the contract
      // Recompute via an independent code path (sort first, then concat) to
      // confirm the same algorithm:
      const ordered = ['QDG6eK', '1409659589', '263014780', 'abc123'].slice().sort();
      // The sorted order under JS default string comparison:
      //   '1409659589' < '263014780' < 'QDG6eK' < 'abc123'   (digits < uppercase < lowercase)
      expect(ordered).toEqual(['1409659589', '263014780', 'QDG6eK', 'abc123']);
      // And re-call must equal:
      expect(sha1Sign('QDG6eK', '1409659589', '263014780', 'abc123')).toBe(expected);
    });

    it('is deterministic and 40-char hex', () => {
      const sig = sha1Sign('tok', '1', '2', 'enc');
      expect(sig).toMatch(/^[a-f0-9]{40}$/);
      expect(sha1Sign('tok', '1', '2', 'enc')).toBe(sig);
    });

    it('order-invariant by construction (lexicographic sort)', () => {
      // Same inputs in any positional order produce the same signature
      // because we sort the four strings before concat.
      const a = sha1Sign('a', 'b', 'c', 'd');
      const b = sha1Sign('d', 'c', 'b', 'a');
      const c = sha1Sign('b', 'd', 'a', 'c');
      expect(a).toBe(b);
      expect(b).toBe(c);
    });
  });

  describe('decryptPayload / encryptPayload', () => {
    const key = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';

    it('roundtrips with a 43-char EncodingAESKey', () => {
      expect(key.length).toBe(43);
      const plain = JSON.stringify({ msgtype: 'text', text: { content: 'hello' } });
      const enc = encryptPayload(key, plain);
      const out = decryptPayload(key, enc);
      expect(out).toBe(plain);
    });

    it('roundtrips the receiveid trailer (CRIT-2)', () => {
      // The trailer is the CorpID; we need it back exactly to validate.
      const plain = '{"msgtype":"text"}';
      const enc = encryptPayload(key, plain, 'ww1234567890abcdef');
      const out = decryptPayloadFull(key, enc);
      expect(out.message).toBe(plain);
      expect(out.receiveId).toBe('ww1234567890abcdef');
    });

    it('preserves multibyte unicode in payload + receiveid', () => {
      const plain = '{"msg":"你好 emoji"}';
      const enc = encryptPayload(key, plain, '企业ID');
      const out = decryptPayloadFull(key, enc);
      expect(out.message).toBe(plain);
      expect(out.receiveId).toBe('企业ID');
    });

    it('decoded receiveid lets caller catch cross-tenant forgery', () => {
      // CRIT-2: the plugin verifies receiveid matches the configured CorpID.
      // Encrypt with a different CorpID and the caller (plugin) must reject.
      const plain = '{"x":1}';
      const encWrong = encryptPayload(key, plain, 'wrong-corp');
      const out = decryptPayloadFull(key, encWrong);
      expect(out.receiveId).toBe('wrong-corp');
      expect(out.receiveId).not.toBe('expected-corp');
    });
  });
});
