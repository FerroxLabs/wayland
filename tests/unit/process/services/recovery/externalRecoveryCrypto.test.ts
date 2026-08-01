/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
  DuplicateRecoveryTupleError,
  RecoveryTupleRegistry,
  canonicalizeRecoveryJson,
  createRecoveryKeyCreatedEvent,
  createRecoveryKeyRotatedEvent,
  createSameDeviceRecoveryWrap,
  deriveAndVerifyRecoveryKeyState,
  deriveRecoveryKeyId,
  deriveRecoveryRecordKey,
  deriveRecoveryRootKeys,
  openExternalRecoveryRecord,
  openSameDeviceRecoveryWrap,
  parseCanonicalRecoveryJson,
  sealExternalRecoveryRecord,
  verifyRecoveryKeyState,
} from '@process/services/recovery/externalRecoveryCrypto';

const SECRET_A = Buffer.from(Array.from({ length: 32 }, (_, index) => index));
const SECRET_B = Buffer.from(Array.from({ length: 32 }, (_, index) => 255 - index));
const CREATED_AT = '2026-07-17T00:00:00.000Z';
const DIGEST_1 = `sha256:${'1'.repeat(64)}`;
const DIGEST_2 = `sha256:${'2'.repeat(64)}`;

// Independently precomputed with Node's RFC 5869/AES-GCM/HMAC primitives and fixed inputs.
const FIXED_ENVELOPE =
  '{"cipher":{"ciphertextBase64url":"QX1tYFBJkMlv74Cvz7G1os9ymJ2e","name":"AES-256-GCM","nonceBase64url":"QEFCQ0RFRkdISUpL","tagBase64url":"LKV--ievpzzxI__0ru5dRw"},"contract":"wayland-constitution-recovery-envelope/1.0","createdAt":"2026-07-17T00:00:00.000Z","domain":"constitution","kdf":{"infoBase64url":"Y29uc3RpdHV0aW9uAGZpeHR1cmUtMQ","name":"HKDF-SHA-256","saltBase64url":"ICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj8"},"keyId":"rk1:Yw3NKWbEM2aRElRIu7JbT_QSpJxzLbLIq8G4WBvXEN0","mac":{"name":"HMAC-SHA-256","valueBase64url":"CHYDAVXxOl5XnJYo4xwkRLzxvQUclpLSq6OoKZn3W7w"},"plaintext":{"bytes":21,"sha256":"sha256:9ecf29f2bd15b0743217e94830d7a8b4c7841df163eecffeee4dbc4f206e3df4"},"recordContract":"wayland-test-record/1.0","recordId":"fixture-1"}';
const FIXED_AAD =
  '{"contract":"wayland-constitution-recovery-envelope/1.0","createdAt":"2026-07-17T00:00:00.000Z","domain":"constitution","kdf":{"infoBase64url":"Y29uc3RpdHV0aW9uAGZpeHR1cmUtMQ","name":"HKDF-SHA-256","saltBase64url":"ICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj8"},"keyId":"rk1:Yw3NKWbEM2aRElRIu7JbT_QSpJxzLbLIq8G4WBvXEN0","plaintext":{"bytes":21,"sha256":"sha256:9ecf29f2bd15b0743217e94830d7a8b4c7841df163eecffeee4dbc4f206e3df4"},"recordContract":"wayland-test-record/1.0","recordId":"fixture-1"}';

const FIXED_SAME_DEVICE_WRAP =
  '{"contract":"wayland-constitution-recovery-same-device-wrap/1.0","createdAt":"2026-07-17T00:00:00.000Z","keyId":"rk1:Yw3NKWbEM2aRElRIu7JbT_QSpJxzLbLIq8G4WBvXEN0","vaultProvider":"macos-keychain","vaultRef":"vault:key-a","wrappedCiphertextSha256":"sha256:7ef2dd646bf7fd28876e4d0b8b478bd7ea2646925502af31474b826a73c5b150","wrappedSecretBase64url":"dmF1bHQgY2lwaGVydGV4dA"}';

type MutableFixture = Record<string, unknown> & {
  cipher: Record<string, unknown>;
  kdf: Record<string, unknown>;
  mac: Record<string, unknown>;
  macs: Array<Record<string, unknown>>;
  plaintext: Record<string, unknown>;
};

function canonicalMutation(serialized: string | Buffer, mutate: (value: MutableFixture) => void): Buffer {
  const value = JSON.parse(Buffer.from(serialized).toString('utf8')) as MutableFixture;
  mutate(value);
  return canonicalizeRecoveryJson(value);
}

function authenticateEnvelope(value: MutableFixture, key: Buffer): Buffer {
  const { mac: _mac, ...withoutMac } = value;
  value.mac = {
    name: 'HMAC-SHA-256',
    valueBase64url: createHmac('sha256', key).update(canonicalizeRecoveryJson(withoutMac)).digest('base64url'),
  };
  return canonicalizeRecoveryJson(value);
}

function authorityFixture() {
  const genesis = createRecoveryKeyCreatedEvent({
    secret: SECRET_A,
    newVaultRef: 'vault:key-a',
    createdAt: CREATED_AT,
    coveredRecordDigests: [DIGEST_1],
  });
  const rotation = createRecoveryKeyRotatedEvent({
    oldSecret: SECRET_A,
    newSecret: SECRET_B,
    sequence: 1,
    previousEventSha256: genesis.sha256,
    newVaultRef: 'vault:key-b',
    createdAt: '2026-07-18T00:00:00.000Z',
    coveredRecordDigests: [DIGEST_2],
  });
  const secrets = new Map([
    [deriveRecoveryKeyId(SECRET_A), SECRET_A],
    [deriveRecoveryKeyId(SECRET_B), SECRET_B],
  ]);
  return { genesis, rotation, secrets };
}

describe('external recovery canonical JSON', () => {
  it('matches fixed RFC 8785 number, escape, and UTF-16 key-order vectors', () => {
    expect(canonicalizeRecoveryJson([Number('333333333.33333329'), 1e30, 4.5, 2e-3, 1e-27]).toString()).toBe(
      '[333333333.3333333,1e+30,4.5,0.002,1e-27]'
    );
    expect(
      canonicalizeRecoveryJson({
        '\u20ac': 'Euro Sign',
        '\r': 'Carriage Return',
        '\ufb33': 'Hebrew Letter Dalet With Dagesh',
        '1': 'One',
        '\ud83d\ude00': 'Emoji: Grinning Face',
        '\u0080': 'Control',
        '\u00f6': 'Latin Small Letter O With Diaeresis',
      }).toString()
    ).toBe(
      '{"\\r":"Carriage Return","1":"One","":"Control","ö":"Latin Small Letter O With Diaeresis","€":"Euro Sign","😀":"Emoji: Grinning Face","דּ":"Hebrew Letter Dalet With Dagesh"}'
    );
  });

  it('rejects duplicate keys, noncanonical bytes, malformed UTF-8, and unpaired surrogates', () => {
    expect(() => parseCanonicalRecoveryJson(Buffer.from('{"a":1,"a":2}'))).toThrow(/not RFC 8785 canonical/);
    expect(() => parseCanonicalRecoveryJson(Buffer.from('{ "a":1}'))).toThrow(/not RFC 8785 canonical/);
    expect(() => parseCanonicalRecoveryJson(Buffer.from([0xc3, 0x28]))).toThrow(/not valid UTF-8/);
    expect(() => canonicalizeRecoveryJson('\ud800')).toThrow(/unpaired UTF-16 surrogate/);
    expect(() => canonicalizeRecoveryJson({ ['\udc00']: true })).toThrow(/unpaired UTF-16 surrogate/);
    const sparse: unknown[] = [];
    sparse.length = 1;
    expect(() => canonicalizeRecoveryJson(sparse)).toThrow(/sparse arrays/);
    const hidden = {};
    Object.defineProperty(hidden, 'nonceBase64url', { value: 'hidden', enumerable: false });
    expect(() => canonicalizeRecoveryJson(hidden)).toThrow(/enumerable data properties/);
  });
});

describe('external recovery key derivation and record envelope', () => {
  it('matches independent key ID, HKDF role keys, per-record key, AAD, ciphertext, tag, and HMAC vectors', () => {
    expect(deriveRecoveryKeyId(SECRET_A)).toBe('rk1:Yw3NKWbEM2aRElRIu7JbT_QSpJxzLbLIq8G4WBvXEN0');
    const roots = deriveRecoveryRootKeys(SECRET_A);
    expect(roots.encryptionKey.toString('hex')).toBe(
      'e1715feb2f282a95136d78b187258cf191660d5595fd69cf91d04d61ad4c1420'
    );
    expect(roots.macKey.toString('hex')).toBe('defadb8102f4047a585b0916e09298fbb35cae7ec5ba2fbf13af3e5cfd9665fc');
    expect(
      deriveRecoveryRecordKey(
        SECRET_A,
        Buffer.from(Array.from({ length: 32 }, (_, index) => index + 32)),
        'constitution',
        'fixture-1'
      ).toString('hex')
    ).toBe('b3612c421795a1ebd809942b0e5b06dc24a84e7ee5a370b412ebf71be1b7c7ae');
    const envelope = JSON.parse(FIXED_ENVELOPE) as MutableFixture;
    const { cipher: _cipher, mac: _mac, ...aadParts } = envelope;
    expect(canonicalizeRecoveryJson(aadParts).toString()).toBe(FIXED_AAD);
    expect(envelope.cipher).toMatchObject({
      ciphertextBase64url: 'QX1tYFBJkMlv74Cvz7G1os9ymJ2e',
      tagBase64url: 'LKV--ievpzzxI__0ru5dRw',
    });
    expect(envelope.mac.valueBase64url).toBe('CHYDAVXxOl5XnJYo4xwkRLzxvQUclpLSq6OoKZn3W7w');

    const opened = openExternalRecoveryRecord(Buffer.from(FIXED_ENVELOPE), SECRET_A, new RecoveryTupleRegistry());
    expect(opened.plaintext.toString()).toBe('Cycle 22 fixed vector');
  });

  it('round-trips production envelopes with fresh, internally generated tuples', () => {
    const registry = new RecoveryTupleRegistry();
    const input = {
      recordContract: 'wayland-test-record/1.0',
      domain: 'constitution',
      recordId: 'record-1',
      createdAt: CREATED_AT,
      plaintext: Buffer.from('payload'),
    };
    const first = sealExternalRecoveryRecord(input, SECRET_A, registry);
    const second = sealExternalRecoveryRecord(input, SECRET_A, registry);
    const firstEnvelope = JSON.parse(first.toString()) as MutableFixture;
    const secondEnvelope = JSON.parse(second.toString()) as MutableFixture;
    expect(firstEnvelope.kdf.saltBase64url).not.toBe(secondEnvelope.kdf.saltBase64url);
    expect(firstEnvelope.cipher.nonceBase64url).not.toBe(secondEnvelope.cipher.nonceBase64url);
    expect(openExternalRecoveryRecord(first, SECRET_A, registry).plaintext.toString()).toBe('payload');
  });

  it('round-trips an empty plaintext with a canonical empty ciphertext', () => {
    const registry = new RecoveryTupleRegistry();
    const envelope = sealExternalRecoveryRecord(
      {
        recordContract: 'wayland-test-record/1.0',
        domain: 'constitution',
        recordId: 'empty-record',
        createdAt: CREATED_AT,
        plaintext: Buffer.alloc(0),
      },
      SECRET_A,
      registry
    );
    expect((JSON.parse(envelope.toString()) as MutableFixture).cipher.ciphertextBase64url).toBe('');
    expect(openExternalRecoveryRecord(envelope, SECRET_A, registry).plaintext).toEqual(Buffer.alloc(0));
  });

  it('rejects caller-supplied salts/nonces and unknown seal input fields', () => {
    const hostile = {
      recordContract: 'wayland-test-record/1.0',
      domain: 'constitution',
      recordId: 'record-1',
      createdAt: CREATED_AT,
      plaintext: Buffer.from('payload'),
      saltBase64url: 'caller-controlled',
      nonceBase64url: 'caller-controlled',
    };
    expect(() => sealExternalRecoveryRecord(hostile, SECRET_A, new RecoveryTupleRegistry())).toThrow(/unknown fields/);
    expect(sealExternalRecoveryRecord.length).toBe(3);
  });

  it('fails closed on unknown fields, noncanonical base64url, wrong role MAC, KDF, salt, AAD, tag, and digest tampering', () => {
    const unknown = canonicalMutation(FIXED_ENVELOPE, (value) => (value.extra = true));
    expect(() => openExternalRecoveryRecord(unknown, SECRET_A, new RecoveryTupleRegistry())).toThrow(/unknown fields/);
    const padded = canonicalMutation(FIXED_ENVELOPE, (value) => (value.mac.valueBase64url += '='));
    expect(() => openExternalRecoveryRecord(padded, SECRET_A, new RecoveryTupleRegistry())).toThrow(/base64url/);

    const roots = deriveRecoveryRootKeys(SECRET_A);
    const wrongRole = JSON.parse(FIXED_ENVELOPE) as MutableFixture;
    expect(() =>
      openExternalRecoveryRecord(
        authenticateEnvelope(wrongRole, roots.encryptionKey),
        SECRET_A,
        new RecoveryTupleRegistry()
      )
    ).toThrow(/MAC authentication failed/);

    const wrongInfo = canonicalMutation(FIXED_ENVELOPE, (value) => (value.kdf.infoBase64url = 'YQ'));
    expect(() => openExternalRecoveryRecord(wrongInfo, SECRET_A, new RecoveryTupleRegistry())).toThrow(
      /KDF identity or info/
    );

    for (const mutate of [
      (value: MutableFixture) => (value.kdf.saltBase64url = 'ISEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj8'),
      (value: MutableFixture) => (value.plaintext.bytes = 20),
      (value: MutableFixture) => (value.cipher.tagBase64url = 'AKV--ievpzzxI__0ru5dRw'),
      (value: MutableFixture) => (value.plaintext.sha256 = `sha256:${'0'.repeat(64)}`),
    ]) {
      const value = JSON.parse(FIXED_ENVELOPE) as MutableFixture;
      mutate(value);
      expect(() =>
        openExternalRecoveryRecord(authenticateEnvelope(value, roots.macKey), SECRET_A, new RecoveryTupleRegistry())
      ).toThrow(/AES-GCM authentication failed|length or digest/);
    }
  });

  it('quarantines both distinct records when a key/salt/nonce tuple is reused', () => {
    const registry = new RecoveryTupleRegistry();
    const envelope = JSON.parse(FIXED_ENVELOPE);
    registry.observe(envelope, DIGEST_1);
    expect(() => registry.observe(envelope, DIGEST_2)).toThrow(DuplicateRecoveryTupleError);
    expect(registry.quarantinedRecordDigests()).toEqual([DIGEST_1, DIGEST_2]);
  });
});

describe('external recovery key lifecycle authority', () => {
  it('matches fixed genesis/dual-MAC rotation vectors and derives byte-equal active/retired state', () => {
    const { genesis, rotation, secrets } = authorityFixture();
    expect(genesis.event.macs).toEqual([
      {
        keyId: 'rk1:Yw3NKWbEM2aRElRIu7JbT_QSpJxzLbLIq8G4WBvXEN0',
        valueBase64url: 'vZhtee4xgDJ4Nte5cPwGyLI9LcX7lsnzEis5D1QCEmc',
      },
    ]);
    expect(genesis.sha256).toBe('sha256:c3688025bc39d877be8bd612087c37c8f924021df56f7b0e55131ca99fdd2271');
    expect(rotation.event.macs).toEqual([
      {
        keyId: 'rk1:GGXACDHnP37iP8E8stD1iLnDQYNcp0cvjsA1q6S3idY',
        valueBase64url: 'rd8y9rZ4-u0yVqk0FZqupiQE7xO-2rhwZHkdlw0jvq8',
      },
      {
        keyId: 'rk1:Yw3NKWbEM2aRElRIu7JbT_QSpJxzLbLIq8G4WBvXEN0',
        valueBase64url: 'U5u0CsTrZfatfsN23QnpQrAdGekW2pq7_W8KFagosEA',
      },
    ]);
    expect(rotation.sha256).toBe('sha256:ffbe266e9897154da927e7bb6b9d9c747e00abe86b8d36df1a05cf8c50ef321f');

    const derived = deriveAndVerifyRecoveryKeyState([rotation.canonicalBytes, genesis.canonicalBytes], secrets);
    expect(derived.state).toEqual({
      contract: 'wayland-constitution-recovery-key-state/1.0',
      activeKeyId: 'rk1:GGXACDHnP37iP8E8stD1iLnDQYNcp0cvjsA1q6S3idY',
      keys: [
        {
          keyId: 'rk1:GGXACDHnP37iP8E8stD1iLnDQYNcp0cvjsA1q6S3idY',
          status: 'active',
          createdAt: '2026-07-18T00:00:00.000Z',
          retiredAt: null,
          vaultRef: 'vault:key-b',
        },
        {
          keyId: 'rk1:Yw3NKWbEM2aRElRIu7JbT_QSpJxzLbLIq8G4WBvXEN0',
          status: 'retired',
          createdAt: CREATED_AT,
          retiredAt: '2026-07-18T00:00:00.000Z',
          vaultRef: 'vault:key-a',
        },
      ],
      authorityHeadSha256: rotation.sha256,
    });
    expect(
      deriveAndVerifyRecoveryKeyState(
        [genesis.canonicalBytes, rotation.canonicalBytes],
        secrets,
        derived.canonicalBytes
      ).canonicalBytes
    ).toEqual(derived.canonicalBytes);
    expect(derived.coveredRecordDigests).toEqual([DIGEST_2]);
    expect(
      verifyRecoveryKeyState([genesis.canonicalBytes, rotation.canonicalBytes], secrets, derived.canonicalBytes, [
        DIGEST_2,
      ]).canonicalBytes
    ).toEqual(derived.canonicalBytes);
  });

  it('rejects missing retired keys, single-MAC rotations, forks, gaps, duplicate sequences, and false state heads', () => {
    const { genesis, rotation, secrets } = authorityFixture();
    const onlyNew = new Map([[deriveRecoveryKeyId(SECRET_B), SECRET_B]]);
    expect(() => deriveAndVerifyRecoveryKeyState([genesis.canonicalBytes, rotation.canonicalBytes], onlyNew)).toThrow(
      /missing required key/
    );

    const singleMac = canonicalMutation(rotation.canonicalBytes, (value) => value.macs.splice(0, 1));
    expect(() => deriveAndVerifyRecoveryKeyState([genesis.canonicalBytes, singleMac], secrets)).toThrow(
      /single-sided rotation MAC/
    );

    const duplicate = createRecoveryKeyRotatedEvent({
      oldSecret: SECRET_A,
      newSecret: Buffer.alloc(32, 7),
      sequence: 1,
      previousEventSha256: genesis.sha256,
      newVaultRef: 'vault:key-c',
      createdAt: '2026-07-18T01:00:00.000Z',
      coveredRecordDigests: [DIGEST_2],
    });
    expect(() =>
      deriveAndVerifyRecoveryKeyState(
        [genesis.canonicalBytes, rotation.canonicalBytes, duplicate.canonicalBytes],
        secrets
      )
    ).toThrow(/fork, duplicate, or skipped sequence/);

    const gap = canonicalMutation(rotation.canonicalBytes, (value) => (value.sequence = 2));
    expect(() => deriveAndVerifyRecoveryKeyState([genesis.canonicalBytes, gap], secrets)).toThrow(/skipped sequence/);
    const fork = canonicalMutation(rotation.canonicalBytes, (value) => (value.previousEventSha256 = DIGEST_1));
    expect(() => deriveAndVerifyRecoveryKeyState([genesis.canonicalBytes, fork], secrets)).toThrow(
      /unique authority head/
    );

    const derived = deriveAndVerifyRecoveryKeyState([genesis.canonicalBytes, rotation.canonicalBytes], secrets);
    const falseState = canonicalMutation(derived.canonicalBytes, (value) => (value.authorityHeadSha256 = DIGEST_1));
    expect(() =>
      deriveAndVerifyRecoveryKeyState([genesis.canonicalBytes, rotation.canonicalBytes], secrets, falseState)
    ).toThrow(/not byte-equal/);
    expect(() =>
      verifyRecoveryKeyState([genesis.canonicalBytes, rotation.canonicalBytes], secrets, derived.canonicalBytes, [
        DIGEST_1,
      ])
    ).toThrow(/does not cover the complete live record set/);

    const reusedVaultRef = createRecoveryKeyRotatedEvent({
      oldSecret: SECRET_A,
      newSecret: SECRET_B,
      sequence: 1,
      previousEventSha256: genesis.sha256,
      newVaultRef: 'vault:key-a',
      createdAt: '2026-07-18T00:00:00.000Z',
      coveredRecordDigests: [DIGEST_2],
    });
    expect(() =>
      deriveAndVerifyRecoveryKeyState([genesis.canonicalBytes, reusedVaultRef.canonicalBytes], secrets)
    ).toThrow(/would discard a required retired key/);
  });
});

describe('same-device external recovery wraps', () => {
  it('matches the same-device vector and validates provider/ref/digest before vault use and key ID after it', async () => {
    expect(
      createSameDeviceRecoveryWrap({
        secret: SECRET_A,
        createdAt: CREATED_AT,
        vaultProvider: 'macos-keychain',
        vaultRef: 'vault:key-a',
        wrappedSecret: Buffer.from('vault ciphertext'),
      }).toString()
    ).toBe(FIXED_SAME_DEVICE_WRAP);

    const unwrap = vi.fn(async () => SECRET_A);
    await expect(
      openSameDeviceRecoveryWrap(Buffer.from(FIXED_SAME_DEVICE_WRAP), {
        provider: 'macos-keychain',
        vaultRef: 'vault:key-a',
        unwrap,
      })
    ).resolves.toEqual(SECRET_A);
    expect(unwrap).toHaveBeenCalledWith(Buffer.from('vault ciphertext'));

    const neverCalled = vi.fn(async () => SECRET_A);
    await expect(
      openSameDeviceRecoveryWrap(Buffer.from(FIXED_SAME_DEVICE_WRAP), {
        provider: 'windows-dpapi',
        vaultRef: 'vault:key-a',
        unwrap: neverCalled,
      })
    ).rejects.toThrow(/does not match the active platform vault/);
    expect(neverCalled).not.toHaveBeenCalled();

    const badDigest = canonicalMutation(FIXED_SAME_DEVICE_WRAP, (value) => (value.wrappedCiphertextSha256 = DIGEST_1));
    await expect(
      openSameDeviceRecoveryWrap(badDigest, {
        provider: 'macos-keychain',
        vaultRef: 'vault:key-a',
        unwrap: neverCalled,
      })
    ).rejects.toThrow(/ciphertext digest is invalid/);
    expect(neverCalled).not.toHaveBeenCalled();

    await expect(
      openSameDeviceRecoveryWrap(Buffer.from(FIXED_SAME_DEVICE_WRAP), {
        provider: 'macos-keychain',
        vaultRef: 'vault:key-a',
        unwrap: async () => SECRET_B,
      })
    ).rejects.toThrow(/does not match its key ID/);
  });
});
