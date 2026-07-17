/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type MetaWhatsAppCredentialIssue = 'accessTokenAndPhoneNumberId' | 'verifyToken' | 'appSecret';

type MetaWhatsAppCredentials = {
  accessToken: string;
  phoneNumberId: string;
  verifyToken: string;
  appSecret: string;
};

/** Return the first missing credential required for a secure Meta channel. */
export function findMissingMetaCredential(credentials: MetaWhatsAppCredentials): MetaWhatsAppCredentialIssue | null {
  if (!credentials.accessToken.trim() || !credentials.phoneNumberId.trim()) {
    return 'accessTokenAndPhoneNumberId';
  }
  if (!credentials.verifyToken.trim()) return 'verifyToken';
  if (!credentials.appSecret.trim()) return 'appSecret';
  return null;
}
