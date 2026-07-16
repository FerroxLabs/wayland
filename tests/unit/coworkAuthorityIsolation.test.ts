/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';

function sourceFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolute);
    return /\.tsx?$/.test(entry.name) ? [absolute] : [];
  });
}

describe('Cowork assistant and workspace authority remain separate', () => {
  it('does not encode an access grant in the Cowork preset', () => {
    const cowork = ASSISTANT_PRESETS.find((preset) => preset.id === 'cowork');

    expect(cowork).toBeDefined();
    const serialized = JSON.stringify(cowork);
    expect(serialized).not.toContain('workspaceTrust');
    expect(serialized).not.toContain('workspace.trustLevel');
    expect(serialized).not.toContain('trusted-edits');
  });

  it('has no renderer path that silently arms workspace access', () => {
    const rendererRoot = path.join(process.cwd(), 'src/renderer');
    const offenders = sourceFiles(rendererRoot)
      .filter((file) => fs.readFileSync(file, 'utf8').includes('workspaceTrust.set'))
      .map((file) => path.relative(process.cwd(), file));

    // An explicit access-control UI may be added later, but it must update this
    // guard deliberately. Selecting an assistant, mode, or preset cannot write
    // workspace authority as a side effect.
    expect(offenders).toEqual([]);
  });
});
