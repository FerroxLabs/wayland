/**
 * Public barrel for the secrets module.
 *
 * Main-process consumers should import from `@process/secrets` only, never
 * from individual files. This keeps the encryption boundary auditable.
 */

export {
  CIPHER_PREFIX,
  decryptString,
  encryptString,
  isEncryptionAvailable,
  type EncryptedString,
} from './safeStorage';

export { FILE_CIPHER_PREFIX } from './fileKeyStore';

export { SENSITIVE_FIELD_NAMES, isSensitiveField } from './fieldClassification';
