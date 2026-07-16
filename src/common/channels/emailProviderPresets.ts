/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Smart defaults for the Email (IMAP/SMTP) channel. Given a user's email
 * address, detect the well-known provider from the domain and return its
 * IMAP/SMTP host, port, and TLS settings so the user only has to supply their
 * address + app password. Pure data, no network: covers the common consumer
 * providers. Custom domains (e.g. a Google Workspace domain that is really
 * Gmail) are NOT matched here; an MX-record / autoconfig lookup is a future
 * enhancement.
 */

export interface EmailProviderPreset {
  /** Stable id, e.g. 'gmail'. */
  readonly id: string;
  /** Human label, e.g. 'Gmail'. */
  readonly label: string;
  readonly imapHost: string;
  readonly imapPort: number;
  readonly imapTls: boolean;
  readonly smtpHost: string;
  readonly smtpPort: number;
  readonly smtpTls: boolean;
  /** Optional one-line setup note (app password requirement, Proton Bridge, ...). */
  readonly note?: string;
  /** Optional deep link to where the user generates an app password. */
  readonly appPasswordUrl?: string;
}

const PRESETS: Record<string, EmailProviderPreset> = {
  gmail: {
    id: 'gmail',
    label: 'Gmail',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    imapTls: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpTls: true,
    note: 'Requires an app password (enable 2-Step Verification first).',
    appPasswordUrl: 'https://myaccount.google.com/apppasswords',
  },
  outlook: {
    id: 'outlook',
    label: 'Outlook / Hotmail',
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    imapTls: true,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpTls: true,
    note: 'Requires an app password if 2FA is on.',
  },
  icloud: {
    id: 'icloud',
    label: 'iCloud Mail',
    imapHost: 'imap.mail.me.com',
    imapPort: 993,
    imapTls: true,
    smtpHost: 'smtp.mail.me.com',
    smtpPort: 587,
    smtpTls: true,
    note: 'Requires an app-specific password from appleid.apple.com.',
    appPasswordUrl: 'https://appleid.apple.com',
  },
  yahoo: {
    id: 'yahoo',
    label: 'Yahoo Mail',
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    imapTls: true,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 465,
    smtpTls: true,
    note: 'Requires an app password from your Yahoo account security settings.',
  },
  proton: {
    id: 'proton',
    label: 'Proton Mail',
    imapHost: '127.0.0.1',
    imapPort: 1143,
    imapTls: true,
    smtpHost: '127.0.0.1',
    smtpPort: 1025,
    smtpTls: true,
    note: 'Requires Proton Mail Bridge running on this machine. Use the Bridge-generated password, not your Proton login.',
  },
  fastmail: {
    id: 'fastmail',
    label: 'Fastmail',
    imapHost: 'imap.fastmail.com',
    imapPort: 993,
    imapTls: true,
    smtpHost: 'smtp.fastmail.com',
    smtpPort: 465,
    smtpTls: true,
    note: 'Requires an app password from Fastmail settings.',
  },
  aol: {
    id: 'aol',
    label: 'AOL Mail',
    imapHost: 'imap.aol.com',
    imapPort: 993,
    imapTls: true,
    smtpHost: 'smtp.aol.com',
    smtpPort: 465,
    smtpTls: true,
    note: 'Requires an app password from your AOL account security settings.',
  },
  zoho: {
    id: 'zoho',
    label: 'Zoho Mail',
    imapHost: 'imap.zoho.com',
    imapPort: 993,
    imapTls: true,
    smtpHost: 'smtp.zoho.com',
    smtpPort: 465,
    smtpTls: true,
  },
};

/** Domain (lowercase) to preset id. */
const DOMAIN_TO_PRESET: Record<string, string> = {
  'gmail.com': 'gmail',
  'googlemail.com': 'gmail',
  'outlook.com': 'outlook',
  'hotmail.com': 'outlook',
  'hotmail.co.uk': 'outlook',
  'live.com': 'outlook',
  'msn.com': 'outlook',
  'icloud.com': 'icloud',
  'me.com': 'icloud',
  'mac.com': 'icloud',
  'yahoo.com': 'yahoo',
  'yahoo.co.uk': 'yahoo',
  'ymail.com': 'yahoo',
  'rocketmail.com': 'yahoo',
  'protonmail.com': 'proton',
  'proton.me': 'proton',
  'pm.me': 'proton',
  'fastmail.com': 'fastmail',
  'fastmail.fm': 'fastmail',
  'aol.com': 'aol',
  'zoho.com': 'zoho',
  'zohomail.com': 'zoho',
};

/** Extract the lowercased domain from an email address, or null if malformed. */
export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 0) return null;
  const domain = email
    .slice(at + 1)
    .trim()
    .toLowerCase();
  return domain.length > 0 && domain.includes('.') ? domain : null;
}

/**
 * Detect the email provider preset from an address (or bare domain). Returns
 * null for unknown / custom domains.
 */
export function detectEmailProvider(emailOrDomain: string): EmailProviderPreset | null {
  if (!emailOrDomain) return null;
  const domain = emailOrDomain.includes('@') ? emailDomain(emailOrDomain) : emailOrDomain.trim().toLowerCase();
  if (!domain) return null;
  const presetId = DOMAIN_TO_PRESET[domain];
  return presetId ? PRESETS[presetId] : null;
}
