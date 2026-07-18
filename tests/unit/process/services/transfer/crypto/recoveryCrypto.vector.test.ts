import { describe, expect, it } from 'vitest';
import {
  deriveRecoveryKey,
  parseRecoveryChunkEnvelope,
  RecoveryCryptoSession,
} from '@process/services/transfer/crypto';

const VECTOR =
  '{"format":"wayland-transfer-recovery-chunk/1","suite":"WT-R1","cipher":"XChaCha20-Poly1305","bundleId":"bundle-vector-1","schema":"wayland-transfer/1","ordinal":7,"declaredLength":26,"contentDigest":"sha256:84f2ef6e280fd8925ec4fb684dccedcd7908fd7c773fa2943fb1fbf1390c0de1","kdf":{"algorithm":"Argon2id","version":19,"memoryKiB":262144,"iterations":3,"parallelism":1,"keyLength":32,"salt":"AAECAwQFBgcICQoLDA0ODw"},"nonce":"oKGio6SlpqeoqaqrrK2ur7CxsrO0tba3","ciphertext":"6ST-BCRCajYOFjMJLvpmhzTPa32LmWDcZAAfyMT1sOcBw2itzjz7neoT"}';

describe('WT-R1 deterministic vector', () => {
  it('derives the fixed Argon2id v0x13 key', async () => {
    const envelope = parseRecoveryChunkEnvelope(VECTOR);
    const key = await deriveRecoveryKey('correct horse battery staple', envelope.kdf);
    expect(Buffer.from(key).toString('hex')).toBe(
      'aad608b5866cef907f47d5cae529ed01a91301c92c5d5fef46e1a65e394e5742',
    );
  }, 30_000);

  it('decrypts the fixed XChaCha20-Poly1305 envelope', async () => {
    const decrypted = await new RecoveryCryptoSession().decryptChunk(
      VECTOR,
      'correct horse battery staple',
    );
    expect(new TextDecoder().decode(decrypted.plaintext)).toBe('Wayland transfer vector v1');
  }, 30_000);
});
