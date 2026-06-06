/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  lookup: vi.fn(),
}));

vi.mock('node:dns/promises', () => ({
  lookup: mocks.lookup,
}));

import { isSsrfTarget } from '@process/channels/webhook/ssrf-guard';

describe('isSsrfTarget', () => {
  beforeEach(() => {
    mocks.lookup.mockReset();
  });

  describe('literal hosts', () => {
    it('rejects metadata.google.internal without DNS lookup', async () => {
      const result = await isSsrfTarget('http://metadata.google.internal/');
      expect(result).toBe(true);
      expect(mocks.lookup).not.toHaveBeenCalled();
    });

    it('rejects fd00:ec2::254 literal IPv6 metadata host', async () => {
      // IPv6 literal must be bracketed for URL parsing per RFC 3986.
      const result = await isSsrfTarget('http://[fd00:ec2::254]/');
      expect(result).toBe(true);
    });

    it('rejects unparseable URLs', async () => {
      const result = await isSsrfTarget('this is not a url');
      expect(result).toBe(true);
    });
  });

  describe('reserved IPv4 ranges', () => {
    it('rejects 10.0.0.0/8', async () => {
      mocks.lookup.mockResolvedValue([{ address: '10.5.5.5', family: 4 }]);
      expect(await isSsrfTarget('http://internal.example/')).toBe(true);
    });

    it('rejects 192.168.0.0/16', async () => {
      mocks.lookup.mockResolvedValue([{ address: '192.168.1.1', family: 4 }]);
      expect(await isSsrfTarget('http://internal.example/')).toBe(true);
    });

    it('rejects 172.16.0.0/12', async () => {
      mocks.lookup.mockResolvedValue([{ address: '172.20.0.1', family: 4 }]);
      expect(await isSsrfTarget('http://internal.example/')).toBe(true);
    });

    it('rejects 169.254.0.0/16 link-local', async () => {
      mocks.lookup.mockResolvedValue([{ address: '169.254.169.254', family: 4 }]);
      expect(await isSsrfTarget('http://aws-metadata.example/')).toBe(true);
    });

    it('rejects 127.0.0.0/8 loopback', async () => {
      mocks.lookup.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
      expect(await isSsrfTarget('http://loop.example/')).toBe(true);
    });

    it('rejects 100.64.0.0/10 CGNAT', async () => {
      mocks.lookup.mockResolvedValue([{ address: '100.100.0.1', family: 4 }]);
      expect(await isSsrfTarget('http://cgnat.example/')).toBe(true);
    });

    it('accepts a routable public IPv4', async () => {
      mocks.lookup.mockResolvedValue([{ address: '8.8.8.8', family: 4 }]);
      expect(await isSsrfTarget('http://public.example/')).toBe(false);
    });
  });

  describe('reserved IPv6 ranges', () => {
    it('rejects ::1 loopback', async () => {
      mocks.lookup.mockResolvedValue([{ address: '::1', family: 6 }]);
      expect(await isSsrfTarget('http://loop6.example/')).toBe(true);
    });

    it('rejects fe80::/10 link-local', async () => {
      mocks.lookup.mockResolvedValue([{ address: 'fe80::1', family: 6 }]);
      expect(await isSsrfTarget('http://link6.example/')).toBe(true);
    });

    it('rejects fc00::/7 unique-local', async () => {
      mocks.lookup.mockResolvedValue([{ address: 'fd12::1', family: 6 }]);
      expect(await isSsrfTarget('http://unique6.example/')).toBe(true);
    });
  });

  describe('multi-record hosts', () => {
    it('rejects when ANY resolved record points inside a reserved range', async () => {
      mocks.lookup.mockResolvedValue([
        { address: '8.8.8.8', family: 4 },
        { address: '10.0.0.1', family: 4 },
      ]);
      expect(await isSsrfTarget('http://mixed.example/')).toBe(true);
    });
  });

  describe('DNS failure', () => {
    it('treats lookup errors as SSRF targets', async () => {
      mocks.lookup.mockRejectedValue(new Error('ENOTFOUND'));
      expect(await isSsrfTarget('http://unreachable.example/')).toBe(true);
    });

    it('treats empty resolution as SSRF target', async () => {
      mocks.lookup.mockResolvedValue([]);
      expect(await isSsrfTarget('http://noaddr.example/')).toBe(true);
    });
  });
});
