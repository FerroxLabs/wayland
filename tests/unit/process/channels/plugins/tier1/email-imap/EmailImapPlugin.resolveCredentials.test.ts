/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Regression coverage for credential normalization. The IMAP plugin was
 * reported to reject a VALID Gmail app password. Root cause was upstream
 * (the form treated a failed connection test as a pass), but resolveCredentials
 * is the single seam every connect path flows through, so we pin its
 * whitespace-stripping, defaults, and required-field behaviour here.
 */

import { describe, expect, it } from 'vitest';
import { resolveCredentials } from '@process/channels/plugins/tier1/email-imap/EmailImapPlugin';

describe('EmailImapPlugin resolveCredentials', () => {
  const base = {
    imapHost: 'imap.gmail.com',
    imapUser: 'waylandbot@ferroxlabs.com',
  };

  it('strips internal spaces from a Gmail-formatted app password', () => {
    const resolved = resolveCredentials({
      ...base,
      imapPassword: 'yahr vkqu tevs rjvy',
    });
    expect(resolved.imap.password).toBe('yahrvkqutevsrjvy');
    // useSameAuth defaults to true, so SMTP mirrors the stripped IMAP password.
    expect(resolved.smtp.password).toBe('yahrvkqutevsrjvy');
  });

  it('strips leading/trailing whitespace from a pasted password', () => {
    const resolved = resolveCredentials({
      ...base,
      imapPassword: '  yahrvkqutevsrjvy  ',
    });
    expect(resolved.imap.password).toBe('yahrvkqutevsrjvy');
  });

  it('leaves a clean password untouched', () => {
    const resolved = resolveCredentials({ ...base, imapPassword: 'yahrvkqutevsrjvy' });
    expect(resolved.imap.password).toBe('yahrvkqutevsrjvy');
  });

  it('applies Gmail-friendly defaults for missing scalar fields', () => {
    const resolved = resolveCredentials({ ...base, imapPassword: 'pw' });
    expect(resolved.imap.port).toBe(993);
    expect(resolved.imap.tls).toBe(true);
    expect(resolved.smtp.host).toBe('imap.gmail.com');
    expect(resolved.smtp.port).toBe(587);
    expect(resolved.smtp.tls).toBe(true);
  });

  it('honours an explicit non-default port and TLS flag', () => {
    const resolved = resolveCredentials({
      ...base,
      imapPassword: 'pw',
      imapPort: 143,
      imapTls: false,
      smtpPort: 465,
      smtpTls: false,
    });
    expect(resolved.imap.port).toBe(143);
    expect(resolved.imap.tls).toBe(false);
    expect(resolved.smtp.port).toBe(465);
    expect(resolved.smtp.tls).toBe(false);
  });

  it('uses a distinct SMTP login (also whitespace-stripped) when useSameAuth is false', () => {
    const resolved = resolveCredentials({
      ...base,
      imapPassword: 'imap-pw',
      useSameAuth: false,
      smtpUser: 'relay@example.com',
      smtpPassword: 'abcd efgh ijkl mnop',
    });
    expect(resolved.smtp.user).toBe('relay@example.com');
    expect(resolved.smtp.password).toBe('abcdefghijklmnop');
    // IMAP password is independent of the SMTP one.
    expect(resolved.imap.password).toBe('imap-pw');
  });

  it('throws a clear error when the password is missing', () => {
    expect(() => resolveCredentials({ ...base })).toThrow('IMAP password is required');
  });

  it('throws a clear error when the password is whitespace-only', () => {
    expect(() => resolveCredentials({ ...base, imapPassword: '   ' })).toThrow('IMAP password is required');
  });

  it('throws when the host or user is missing', () => {
    expect(() => resolveCredentials({ imapUser: 'a@b.com', imapPassword: 'pw' })).toThrow('IMAP host is required');
    expect(() => resolveCredentials({ imapHost: 'imap.gmail.com', imapPassword: 'pw' })).toThrow(
      'IMAP user is required'
    );
  });
});
