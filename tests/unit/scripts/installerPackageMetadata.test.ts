/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

type InstallerPackage = {
  repository?: {
    directory?: string;
  };
};

const ROOT = join(__dirname, '..', '..', '..');
const INSTALLER_PACKAGE = JSON.parse(readFileSync(join(ROOT, 'installer', 'package.json'), 'utf8')) as InstallerPackage;

describe('headless installer package metadata', () => {
  it('points repository metadata at the installer directory', () => {
    expect(INSTALLER_PACKAGE.repository?.directory).toBe('installer');
  });
});
