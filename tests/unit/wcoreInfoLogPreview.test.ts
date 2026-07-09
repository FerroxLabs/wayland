/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { toSafeInfoLogPreview } from '@process/task/WCoreManager';

// #714: wcore `info` events carry full tool results and were persisted
// verbatim to the daily electron-log file — a Grep over an exported provider
// settings page landed a live API-key object in plaintext on disk. The
// preview must be short and secret-redacted before it reaches mainLog.
describe('toSafeInfoLogPreview (#714 persistent-log tool output)', () => {
  it('passes short, secret-free info lines through unchanged', () => {
    expect(toSafeInfoLogPreview('set_mode acknowledged: auto_edit')).toBe('set_mode acknowledged: auto_edit');
  });

  it('truncates long tool output to a preview with a truncation marker', () => {
    const out = toSafeInfoLogPreview(`[Grep success] ${'x'.repeat(50_000)}`);
    expect(out.length).toBeLessThan(500);
    expect(out).toContain('[Grep success]');
    expect(out).toMatch(/\[\+\d+ chars truncated\]$/);
  });

  it('redacts prefixed provider API keys in the preview', () => {
    const out = toSafeInfoLogPreview(
      '[Grep success] settings.html:17: "api_key":{"label":"sk-or-v1-abcdef0123456789abcdef0123456789"}'
    );
    expect(out).not.toContain('sk-or-v1-abcdef0123456789abcdef0123456789');
    expect(out).toContain('[Grep success]');
  });

  it('redacts Bearer tokens and KEY=value pairs', () => {
    const out = toSafeInfoLogPreview(
      '[Read success] Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload OPENROUTER_API_KEY=sk-or-v1-deadbeef1234'
    );
    expect(out).not.toContain('eyJhbGciOiJIUzI1NiJ9.payload');
    expect(out).not.toContain('sk-or-v1-deadbeef1234');
  });

  it('redacts a secret that sits inside the truncated window', () => {
    const secret = 'sk-or-v1-abcdef0123456789abcdef0123456789';
    const out = toSafeInfoLogPreview(`[Grep success] "label":"${secret}" ${'y'.repeat(10_000)}`);
    expect(out).not.toContain(secret);
    expect(out).toMatch(/\[\+\d+ chars truncated\]$/);
  });

  it('stringifies non-string payloads instead of throwing', () => {
    expect(toSafeInfoLogPreview(undefined)).toBe('undefined');
    expect(toSafeInfoLogPreview(42)).toBe('42');
  });
});
