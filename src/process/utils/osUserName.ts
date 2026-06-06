/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Resolves the OS account holder's display name.
 *
 * The desktop app has no authenticated user, so the new-chat greeting falls
 * back to the operating-system account name. We resolve the human "full name"
 * where the platform exposes one and reduce it to a first name for a friendly,
 * Claude.ai-style greeting ("Morning, Sean").
 */

import os from 'os';
import { execFileSync } from 'child_process';

let cached: string | null = null;

/** Capitalize the first character, leave the rest as-is. */
const capitalize = (value: string): string => (value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value);

/** First whitespace-delimited token of a name. */
const firstNameOf = (fullName: string): string => fullName.trim().split(/\s+/)[0] ?? '';

/**
 * Best-effort lookup of the OS account's human full name:
 *   macOS - `dscl . -read /Users/<user> RealName`
 *   Linux - the GECOS field of `getent passwd <user>`
 *   else  - the short login name (Windows usernames are already name-like).
 */
const resolveFullName = (shortName: string): string => {
  try {
    if (process.platform === 'darwin') {
      const out = execFileSync('dscl', ['.', '-read', `/Users/${shortName}`, 'RealName'], {
        encoding: 'utf-8',
        timeout: 2000,
      });
      // "RealName:" then the value, possibly on the next (indented) line.
      const value = out.replace(/^RealName:/i, '').trim();
      if (value) return value;
    } else if (process.platform === 'linux') {
      const out = execFileSync('getent', ['passwd', shortName], { encoding: 'utf-8', timeout: 2000 });
      const gecos = out.split(':')[4] ?? '';
      const value = (gecos.split(',')[0] ?? '').trim();
      if (value) return value;
    }
  } catch {
    // dscl/getent unavailable, or the account has no full name - fall through.
  }
  return shortName;
};

/**
 * The OS account's display first name, capitalized. Resolved once and cached.
 * Returns an empty string when no name can be determined, so callers can fall
 * back to a nameless greeting.
 */
export const getOsUserName = (): string => {
  if (cached !== null) return cached;

  let shortName = '';
  try {
    shortName = os.userInfo().username ?? '';
  } catch {
    shortName = '';
  }

  const fullName = shortName ? resolveFullName(shortName) : '';
  cached = capitalize(firstNameOf(fullName));
  return cached;
};
