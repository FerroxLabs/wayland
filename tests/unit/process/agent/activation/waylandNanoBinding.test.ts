import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  WaylandNanoActivationKeyStore,
  type WaylandNanoSafeStorage,
} from '@process/agent/activation/waylandNanoActivationKeyStore';
import { resolveWaylandNanoSetup, validateWaylandNanoBinding } from '@process/agent/activation/waylandNanoBinding';
import { WaylandNanoBindingStore } from '@process/agent/activation/waylandNanoBindingStore';

const roots: string[] = [];
afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

function binding(keyRef = 'wayland-nano-key:v1:key_1') {
  return {
    productSubjectId: 'product-opaque-1',
    principalId: 'principal-opaque-1',
    projectId: 'project-opaque-1',
    issuerId: 'desktop',
    issuerKeyRef: keyRef,
    backend: 'wayland-nano' as const,
  };
}

function fakeSafeStorage(
  available = true,
  backend: 'basic_text' | 'gnome_libsecret' = 'gnome_libsecret'
): WaylandNanoSafeStorage {
  return {
    isEncryptionAvailable: () => available,
    getSelectedStorageBackend: () => backend,
    encryptString: (value) => Buffer.from(`wrapped:${value}`),
    decryptString: (value) => value.toString().slice('wrapped:'.length),
  };
}

describe('Wayland Nano durable product binding', () => {
  it('persists only an explicit opaque binding and makes retirement permanent', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'wayland-nano-binding-'));
    roots.push(root);
    const store = new WaylandNanoBindingStore(root);

    await store.put(binding());
    expect(await store.load('product-opaque-1')).toEqual(binding());
    await store.retire('product-opaque-1');

    expect(await store.load('product-opaque-1')).toBeNull();
    await expect(store.put(binding())).rejects.toThrow('permanently retired');
  });

  it('rejects conversation, backend, display, cwd and persona fields as authority substitutes', () => {
    for (const field of ['conversationId', 'customAgentId', 'displayName', 'cwd', 'persona']) {
      expect(validateWaylandNanoBinding({ ...binding(), [field]: 'mutable-product-text' })).toBeNull();
    }
    expect(resolveWaylandNanoSetup(null, new Set(), () => true)).toEqual({ enabled: false, reason: 'binding_missing' });
  });
});

describe('Wayland Nano issuer custody', () => {
  it('stores only enc:v1 ciphertext and signs without persisting private key bytes', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'wayland-nano-key-'));
    roots.push(root);
    const store = new WaylandNanoActivationKeyStore(root, fakeSafeStorage(), process.platform);
    const created = await store.create('desktop-2026-01');
    const signer = await store.signer(created.keyRef);

    expect((await signer.sign(Buffer.from('message'))).byteLength).toBe(64);
    const persisted = await readFile(path.join(root, 'wayland-nano', 'activation-keys.json'), 'utf8');
    expect(persisted).toContain('enc:v1:');
    expect(persisted).not.toContain('BEGIN PRIVATE KEY');
  });

  it.each([
    ['unavailable', fakeSafeStorage(false), 'win32' as const],
    ['basic Linux backend', fakeSafeStorage(true, 'basic_text'), 'linux' as const],
  ])('fails closed for %s custody', async (_name, safeStorage, platform) => {
    const root = await mkdtemp(path.join(tmpdir(), 'wayland-nano-key-'));
    roots.push(root);
    const store = new WaylandNanoActivationKeyStore(root, safeStorage, platform);
    await expect(store.create('desktop-2026-01')).rejects.toThrow(/credential|backend/);
  });
});
