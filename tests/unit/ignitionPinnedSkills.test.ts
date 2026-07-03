import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { ASSISTANT_PRESETS } from '../../src/common/config/presets/assistantPresets';

/**
 * Ignition is a master income-asset builder. It MUST pin one always-on expert
 * skill per domain it runs end-to-end. Before this pin the preset had no
 * defaultEnabledSkills, so the engine auto-loaded a single wrong library skill
 * (portfolio-allocation-framework) for the opening prompt.
 *
 * Pinnability rule (src/process/utils/initAgent.ts setupAssistantWorkspace):
 * only a skill that exists as a bundled dir under src/process/resources/skills/
 * is symlinked into the CLI-native skills dir and filtered in by name
 * (src/process/agent/gemini/cli/config.ts). Vendored library-only entries are
 * NEVER symlinked. So every pinned id must have a bundled SKILL.md whose
 * frontmatter `name` equals the id — that is exactly what makes it resolve.
 */
const EXPECTED_IGNITION_SKILLS = [
  'startup-advisor',
  'project-manager',
  'frontend-developer',
  'brand-identity-designer',
  'copywriter',
  'marketing-strategist',
] as const;

const BUNDLED_SKILLS_DIR = path.resolve(__dirname, '../../src/process/resources/skills');

function frontmatterName(skillMd: string): string | null {
  const fm = skillMd.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const nameMatch = fm[1].match(/^name:[ \t]*['"]?([^'"\n]+?)['"]?[ \t]*$/m);
  return nameMatch ? nameMatch[1].trim() : null;
}

describe('Ignition pinned skills', () => {
  const ignition = ASSISTANT_PRESETS.find((p) => p.id === 'ignition');

  it('the ignition preset exists', () => {
    expect(ignition).toBeDefined();
  });

  it('pins exactly the six-domain curated master skill set', () => {
    expect(ignition?.defaultEnabledSkills).toEqual([...EXPECTED_IGNITION_SKILLS]);
  });

  it('never leaves ignition with zero pins (the bug: auto-match supplies one wrong skill)', () => {
    expect(ignition?.defaultEnabledSkills?.length).toBeGreaterThan(0);
  });

  it.each(EXPECTED_IGNITION_SKILLS)('pinned skill %s is bundled (symlinkable), not library-only', (id) => {
    const skillMd = path.join(BUNDLED_SKILLS_DIR, id, 'SKILL.md');
    expect(existsSync(skillMd), `${skillMd} must exist so the pin resolves`).toBe(true);
    // The CLI filters bundled skills by frontmatter name === enabled id.
    expect(frontmatterName(readFileSync(skillMd, 'utf-8'))).toBe(id);
  });
});
