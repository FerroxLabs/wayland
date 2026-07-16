/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ASSISTANT_PRESETS } from '../../src/common/config/presets/assistantPresets';
import {
  DEFAULT_PRESET_AGENT_TYPE,
  resolvePersistedPresetAgentType,
  resolvePresetAgentType,
} from '../../src/common/config/presets/assistantDefaults';

const cowork = ASSISTANT_PRESETS.find((preset) => preset.id === 'cowork');
const coworkRules = fs.readFileSync(
  path.resolve(process.cwd(), 'src/process/resources/assistant/cowork/cowork.md'),
  'utf8'
);
const obsoleteCoworkSkillManual = path.resolve(
  process.cwd(),
  'src/process/resources/assistant/cowork/cowork-skills.md'
);

function collectSkillFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSkillFiles(target);
    return entry.name === 'SKILL.md' ? [target] : [];
  });
}

describe('Cowork product contract', () => {
  it('keeps the Cowork persona provider-neutral with a replaceable Core default', () => {
    expect(cowork).toBeDefined();
    expect(cowork?.presetAgentType).toBeUndefined();
    expect(resolvePresetAgentType(cowork?.presetAgentType)).toBe(DEFAULT_PRESET_AGENT_TYPE);
    expect(DEFAULT_PRESET_AGENT_TYPE).toBe('wcore');
  });

  it('preserves an existing user engine choice instead of migrating it behind their back', () => {
    expect(resolvePersistedPresetAgentType('gemini', cowork?.presetAgentType)).toBe('gemini');
    expect(resolvePersistedPresetAgentType('codex', cowork?.presetAgentType)).toBe('codex');
    expect(resolvePersistedPresetAgentType(undefined, cowork?.presetAgentType)).toBe('wcore');
  });

  it('uses the modern enabled-skill system without a divergent legacy skill manual', () => {
    expect(cowork).toBeDefined();
    expect(cowork?.skillFiles).toBeUndefined();
    expect(fs.existsSync(obsoleteCoworkSkillManual)).toBe(false);
    expect(cowork?.defaultEnabledSkills).toEqual(
      expect.arrayContaining(['pdf', 'officecli-docx', 'officecli-xlsx', 'officecli-pptx'])
    );
  });

  it('makes capability, provenance, validation, authority, and cost explicit', () => {
    expect(coworkRules).toContain('## Capability truth');
    expect(coworkRules).toContain('source ledger');
    expect(coworkRules).toContain('## Knowledge-work loop');
    expect(coworkRules).toContain('Validation depends on the output');
    expect(coworkRules).toContain('Selecting Cowork does not grant additional authority');
    expect(coworkRules).toContain('credit, metering, or external-service requirement');
  });

  it('does not promise obsolete bundled-script names or a fabricated local outcome', () => {
    expect(coworkRules).not.toContain('convert_pdf_to_images.py');
    expect(coworkRules).not.toContain('unpack.py');
    expect(coworkRules).not.toContain('recalc.py');
    expect(coworkRules).toContain('Never report a local-only outcome if a hosted service performed the work');
  });

  it('never lets a bundled skill bootstrap mutable OfficeCLI code', () => {
    const skillRoot = path.resolve(process.cwd(), 'src/process/resources/skills');
    for (const skillPath of collectSkillFiles(skillRoot)) {
      const body = fs.readFileSync(skillPath, 'utf8');
      expect(body).not.toContain('raw.githubusercontent.com/iOfficeAI/OfficeCLI');
      expect(body).not.toMatch(/\b(?:curl|irm)\b[^\n]*iOfficeAI\/OfficeCLI/i);
      expect(body).not.toContain('npm i -g officecli');
    }

    const skillNames = cowork?.defaultEnabledSkills ?? [];
    for (const skillName of skillNames) {
      const skillPath = path.resolve(process.cwd(), 'src/process/resources/skills', skillName, 'SKILL.md');
      if (!fs.existsSync(skillPath)) continue;
      const body = fs.readFileSync(skillPath, 'utf8');
      expect(body).not.toContain('raw.githubusercontent.com/iOfficeAI/OfficeCLI');
      expect(body).not.toMatch(/\b(?:curl|irm)\b[^\n]*(?:install\.sh|install\.ps1)/i);
    }

    for (const skillName of ['officecli-docx', 'officecli-xlsx', 'officecli-pptx']) {
      const body = fs.readFileSync(
        path.resolve(process.cwd(), 'src/process/resources/skills', skillName, 'SKILL.md'),
        'utf8'
      );
      expect(body).toContain('checksum-pinned native `officecli` runtime');
      expect(body).toContain('requires the exact verified `1.0.136` version');
      expect(body).toContain('without explicit network and cost approval');
    }
  });
});
