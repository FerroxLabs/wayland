/**
 * @license
 * Copyright 2025 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * R6 (v0.4.3): SSRF hardening for WhatsApp media downloads.
 * - IP literal rejection (IPv4 + IPv6 private ranges incl. 0.0.0.0, CGNAT)
 * - DNS rebinding defense: hostname that resolves to a private IP rejected.
 *
 * R8 (v0.4.3): testConnection honesty for QR backends.
 * - baileys / whatsapp-web return success:true with warning field.
 * - meta-business has no warning (real probe).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig, IUnifiedOutgoingMessage } from '@process/channels/types';

const { forkSpy, fakeChild, dnsLookupMock, axiosGetMock } = vi.hoisted(() => {
  type Listener = (...args: unknown[]) => void;
  function makeEmitter(): {
    on: (event: string, cb: Listener) => unknown;
    once: (event: string, cb: Listener) => unknown;
    off: (event: string, cb: Listener) => unknown;
    emit: (event: string, ...args: unknown[]) => boolean;
  } {
    const listeners: Record<string, Listener[]> = {};
    return {
      on(event, cb) {
        (listeners[event] ??= []).push(cb);
        return this;
      },
      once(event, cb) {
        const wrap: Listener = (...args) => {
          this.off(event, wrap);
          cb(...args);
        };
        (listeners[event] ??= []).push(wrap);
        return this;
      },
      off(event, cb) {
        const arr = listeners[event];
        if (!arr) return this;
        const idx = arr.indexOf(cb);
        if (idx >= 0) arr.splice(idx, 1);
        return this;
      },
      emit(event, ...args) {
        const arr = listeners[event];
        if (!arr || arr.length === 0) return false;
        for (const cb of arr.slice()) cb(...args);
        return true;
      },
    };
  }
  const stdout = makeEmitter();
  const stdin = { write: vi.fn() };
  const child = {
    ...makeEmitter(),
    pid: 4242,
    stdout,
    stderr: makeEmitter(),
    stdin,
    kill: vi.fn(),
    send: vi.fn(),
  };
  return {
    forkSpy: vi.fn(() => child),
    fakeChild: child,
    dnsLookupMock: vi.fn(),
    axiosGetMock: vi.fn(async () => ({ data: new ArrayBuffer(8) })),
  };
});

vi.mock('child_process', () => ({
  fork: (...args: unknown[]) => forkSpy(...args),
}));

vi.mock('node:dns/promises', () => ({
  default: { lookup: dnsLookupMock },
  lookup: dnsLookupMock,
}));

vi.mock('axios', () => ({
  default: { get: axiosGetMock },
}));

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    default: {
      ...actual,
      promises: { ...actual.promises, writeFile: vi.fn(async () => undefined) },
    },
    promises: { ...actual.promises, writeFile: vi.fn(async () => undefined) },
  };
});

vi.mock('electron', () => ({ app: { getPath: () => '/tmp', getAppPath: () => '/tmp' } }));

import { WhatsAppPlugin, isPrivateIPv4, isPrivateIPv6 } from '@process/channels/plugins/tier1/whatsapp/WhatsAppPlugin';

function makeConfig(): IChannelPluginConfig {
  return {
    pluginInstanceId: 'wa-ssrf',
    pluginType: 'whatsapp',
    enabled: true,
    settings: { backend: 'baileys' },
  } as unknown as IChannelPluginConfig;
}

async function sendImage(plugin: WhatsAppPlugin, mediaUrl: string): Promise<string> {
  const msg: IUnifiedOutgoingMessage = {
    mediaUrl,
    mediaType: 'image',
    fileName: 'x.jpg',
  } as unknown as IUnifiedOutgoingMessage;
  // Reach into private downloadMediaToTemp via a thin wrapper.
  const dl = (
    plugin as unknown as {
      downloadMediaToTemp: (u: string, t: string, f?: string) => Promise<string>;
    }
  ).downloadMediaToTemp.bind(plugin);
  return dl(msg.mediaUrl as string, 'image', 'x.jpg');
}

describe('R6 SSRF hardening - IP/host helper purity', () => {
  it('isPrivateIPv4 covers 10/8, 172.16/12, 192.168/16, 127/8, 169.254/16, 0.0.0.0/8, 100.64/10', () => {
    expect(isPrivateIPv4('10.0.0.5')).toBe(true);
    expect(isPrivateIPv4('172.16.0.1')).toBe(true);
    expect(isPrivateIPv4('172.31.255.255')).toBe(true);
    expect(isPrivateIPv4('192.168.1.1')).toBe(true);
    expect(isPrivateIPv4('127.0.0.1')).toBe(true);
    expect(isPrivateIPv4('169.254.169.254')).toBe(true);
    expect(isPrivateIPv4('0.0.0.0')).toBe(true);
    expect(isPrivateIPv4('100.64.0.1')).toBe(true);
    expect(isPrivateIPv4('8.8.8.8')).toBe(false);
    expect(isPrivateIPv4('1.1.1.1')).toBe(false);
    expect(isPrivateIPv4('172.32.0.1')).toBe(false);
  });

  it('isPrivateIPv6 covers ::1, fc00::/7, fe80::/10, ::ffff:<private v4>', () => {
    expect(isPrivateIPv6('::1')).toBe(true);
    expect(isPrivateIPv6('fc00::1')).toBe(true);
    expect(isPrivateIPv6('fd12:3456::')).toBe(true);
    expect(isPrivateIPv6('fe80::1')).toBe(true);
    expect(isPrivateIPv6('::ffff:127.0.0.1')).toBe(true);
    expect(isPrivateIPv6('2001:4860:4860::8888')).toBe(false);
    expect(isPrivateIPv6('::ffff:8.8.8.8')).toBe(false);
  });
});

describe('R6 SSRF hardening - downloadMediaToTemp guard', () => {
  beforeEach(() => {
    dnsLookupMock.mockReset();
    axiosGetMock.mockReset();
    axiosGetMock.mockResolvedValue({ data: new ArrayBuffer(8) });
  });

  it('rejects literal 127.0.0.1', async () => {
    const p = new WhatsAppPlugin(makeConfig());
    await expect(sendImage(p, 'http://127.0.0.1/foo.jpg')).rejects.toThrow(/SSRF/);
    expect(axiosGetMock).not.toHaveBeenCalled();
  });

  it('rejects literal 10.0.0.5', async () => {
    const p = new WhatsAppPlugin(makeConfig());
    await expect(sendImage(p, 'http://10.0.0.5/x.jpg')).rejects.toThrow(/SSRF/);
    expect(axiosGetMock).not.toHaveBeenCalled();
  });

  it('rejects literal 0.0.0.0', async () => {
    const p = new WhatsAppPlugin(makeConfig());
    await expect(sendImage(p, 'http://0.0.0.0/x.jpg')).rejects.toThrow(/SSRF/);
    expect(axiosGetMock).not.toHaveBeenCalled();
  });

  it('rejects IPv6 literal ::1', async () => {
    const p = new WhatsAppPlugin(makeConfig());
    await expect(sendImage(p, 'http://[::1]/x.jpg')).rejects.toThrow(/SSRF/);
    expect(axiosGetMock).not.toHaveBeenCalled();
  });

  it('rejects IPv6 literal fc00::1', async () => {
    const p = new WhatsAppPlugin(makeConfig());
    await expect(sendImage(p, 'http://[fc00::1]/x.jpg')).rejects.toThrow(/SSRF/);
    expect(axiosGetMock).not.toHaveBeenCalled();
  });

  it('allows public IPv4 8.8.8.8 (DNS not invoked for IP literal)', async () => {
    const p = new WhatsAppPlugin(makeConfig());
    await expect(sendImage(p, 'https://8.8.8.8/x.jpg')).resolves.toMatch(/wayland-wa-/);
    expect(dnsLookupMock).not.toHaveBeenCalled();
    expect(axiosGetMock).toHaveBeenCalledOnce();
  });

  it('rejects DNS-rebinding hostname that resolves to 127.0.0.1', async () => {
    dnsLookupMock.mockResolvedValueOnce([{ address: '127.0.0.1', family: 4 }]);
    const p = new WhatsAppPlugin(makeConfig());
    await expect(sendImage(p, 'https://internal.example.com/x.jpg')).rejects.toThrow(/SSRF/);
    expect(dnsLookupMock).toHaveBeenCalledWith('internal.example.com', { all: true });
    expect(axiosGetMock).not.toHaveBeenCalled();
  });

  it('rejects when ANY resolved address is private (mixed result)', async () => {
    dnsLookupMock.mockResolvedValueOnce([
      { address: '8.8.8.8', family: 4 },
      { address: '10.0.0.5', family: 4 },
    ]);
    const p = new WhatsAppPlugin(makeConfig());
    await expect(sendImage(p, 'https://multi.example.com/x.jpg')).rejects.toThrow(/SSRF/);
    expect(axiosGetMock).not.toHaveBeenCalled();
  });

  it('allows hostname that resolves only to public addresses', async () => {
    dnsLookupMock.mockResolvedValueOnce([{ address: '8.8.8.8', family: 4 }]);
    const p = new WhatsAppPlugin(makeConfig());
    await expect(sendImage(p, 'https://public.example.com/x.jpg')).resolves.toMatch(/wayland-wa-/);
    expect(axiosGetMock).toHaveBeenCalledOnce();
  });

  it('rejects literal localhost', async () => {
    const p = new WhatsAppPlugin(makeConfig());
    await expect(sendImage(p, 'http://localhost/x.jpg')).rejects.toThrow(/SSRF/);
  });
});

describe('R8 testConnection honesty', () => {
  it('baileys backend returns success:true with warning field', async () => {
    const res = await WhatsAppPlugin.testConnection(JSON.stringify({ backend: 'baileys' }));
    expect(res.success).toBe(true);
    expect(res.warning).toMatch(/pending-pairing/);
  });

  it('whatsapp-web backend returns success:true with warning field', async () => {
    const res = await WhatsAppPlugin.testConnection(JSON.stringify({ backend: 'whatsapp-web' }));
    expect(res.success).toBe(true);
    expect(res.warning).toMatch(/pending-pairing/);
  });

  it('meta-business backend (no creds) returns error, no warning', async () => {
    const res = await WhatsAppPlugin.testConnection(JSON.stringify({ backend: 'meta-business' }));
    expect(res.success).toBe(false);
    expect(res.warning).toBeUndefined();
  });
});
