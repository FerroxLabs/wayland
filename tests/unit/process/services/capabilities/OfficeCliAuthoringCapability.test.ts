/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  classifyOfficeCliAuthoringContract,
  OFFICECLI_PINNED_AUTHORING_VERSION,
  probeOfficeCliAuthoringCapability,
  REQUIRED_OFFICECLI_AUTHORING_COMMANDS,
  type OfficeCliCommandRunner,
} from '@process/services/capabilities/OfficeCliAuthoringCapability';

describe('OfficeCliAuthoringCapability', () => {
  it('classifies the bundled 0.2 hosted-credit CLI as incompatible authoring', () => {
    const capability = classifyOfficeCliAuthoringContract(
      'officecli version 0.2.79',
      'Commands:\n  new\n  doctor\n  login\n  whoami\n100 free credits'
    );

    expect(capability).toMatchObject({
      state: 'incompatible',
      version: '0.2.79',
      executionMode: 'hosted-credits',
    });
    expect(capability.missingCommands).toEqual(['create', 'open', 'close', 'add', 'set', 'query', 'validate', 'view']);
  });

  it('requires the exact pinned native release and complete resident command contract before reporting ready', () => {
    const capability = classifyOfficeCliAuthoringContract(
      'OfficeCLI v1.0.136',
      'Commands:\n  create  Create a workbook\n  open  Open a workbook\n  close  Close a workbook\n  add  Add content\n  set  Set a value\n  query  Query content\n  validate  Validate output\n  view  Render a preview'
    );

    expect(capability).toEqual({
      state: 'ready',
      version: '1.0.136',
      executionMode: 'local-binary',
      missingCommands: [],
      reason: 'The native low-level Office authoring contract is available.',
    });
  });

  it('rejects a different 1.x release even when its visible commands look compatible', () => {
    const capability = classifyOfficeCliAuthoringContract(
      'OfficeCLI v1.0.63',
      'Commands:\n  create\n  open\n  close\n  add\n  set\n  query\n  validate\n  view'
    );

    expect(capability).toMatchObject({
      state: 'incompatible',
      version: '1.0.63',
      missingCommands: [],
      reason: 'The installed officecli does not match the pinned native 1.0.136 authoring contract.',
    });
  });

  it('does not trust a 1.x version when required commands are absent', () => {
    const capability = classifyOfficeCliAuthoringContract(
      'OfficeCLI 1.2.0',
      'create  Create a workbook\nopen  Open a workbook\nadd  Add content\nset  Set a value'
    );

    expect(capability.state).toBe('incompatible');
    expect(capability.missingCommands).toEqual(['close', 'query', 'validate', 'view']);
  });

  it('does not mistake descriptive prose for a command row', () => {
    const capability = classifyOfficeCliAuthoringContract(
      'officecli 0.2.79',
      'config  View or change runtime settings'
    );

    expect(capability.missingCommands).toContain('view');
  });

  it('returns missing without throwing when the executable is absent', async () => {
    const runner: OfficeCliCommandRunner = vi.fn(async () => {
      throw Object.assign(new Error('spawn officecli ENOENT'), { code: 'ENOENT' });
    });

    await expect(probeOfficeCliAuthoringCapability(runner)).resolves.toMatchObject({
      state: 'missing',
      executionMode: 'unknown',
    });
  });

  it('probes top-level help because format help contains elements rather than commands', async () => {
    const runner: OfficeCliCommandRunner = vi.fn(async (args) => {
      if (args[0] === '--version') return { stdout: '1.0.136', stderr: '' };
      return {
        stdout:
          'Commands:\n  create <file>\n  open <file>\n  close <file>\n  add <file>\n  set <file>\n  query <file>\n  validate <file>\n  view <file>',
        stderr: '',
      };
    });

    await expect(probeOfficeCliAuthoringCapability(runner)).resolves.toMatchObject({
      state: 'ready',
      version: '1.0.136',
    });
    expect(runner).toHaveBeenNthCalledWith(1, ['--version']);
    expect(runner).toHaveBeenNthCalledWith(2, ['--help']);
  });

  it('returns unverified without throwing when a bounded probe does not complete', async () => {
    const runner: OfficeCliCommandRunner = vi.fn(async () => {
      throw Object.assign(new Error('timed out'), { code: 'ETIMEDOUT' });
    });

    await expect(probeOfficeCliAuthoringCapability(runner)).resolves.toMatchObject({
      state: 'unverified',
      executionMode: 'unknown',
    });
  });

  it('stays in lockstep with the versioned OfficeCLI contract while keeping watch separate', () => {
    const contract = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'contracts/officecli/v1/contract.json'), 'utf8')
    ) as { release: string; requiredCommands: string[]; previewCommand: string };

    expect(contract.release).toBe(`v${OFFICECLI_PINNED_AUTHORING_VERSION}`);
    expect(contract.previewCommand).toBe('watch');
    expect(REQUIRED_OFFICECLI_AUTHORING_COMMANDS).toEqual(
      contract.requiredCommands.filter((command) => command !== contract.previewCommand)
    );
  });
});
