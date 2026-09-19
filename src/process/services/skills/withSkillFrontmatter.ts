/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Give a skill body the frontmatter every reader requires.
 *
 * `parseFrontmatter` returns null for a document with no `---` block OR no
 * `name:` in it, and both `AcpSkillManager.discoverSkills` and
 * `fs.listAvailableSkills` drop what it refuses - so such a skill cannot be
 * loaded and cannot even be ticked in Settings (#1190).
 *
 * The "already usable" test is `parseFrontmatter` ITSELF rather than a local
 * regex, so this can never disagree with the readers it exists to satisfy.
 *
 * A body it accepts is returned BYTE FOR BYTE. Someone who pastes a real
 * SKILL.md has declared its `name:`, and rewriting that would rename their
 * skill behind their back. A body carrying a block that `parseFrontmatter`
 * refuses (a `---` block with no name) gets a usable block PREPENDED rather
 * than edited in place: the reader takes the first block, and the user's own
 * bytes survive underneath untouched.
 */

import type { SkillType } from '@/common/types/skillTypes';
import { parseFrontmatter } from '@process/task/AcpSkillManager';

export type SkillFrontmatterMeta = {
  name: string;
  description: string;
  /**
   * Omitted when the caller does not actually know. A repair pass reading a
   * body with no frontmatter cannot tell a workflow from a skill, and guessing
   * `skill` would move a workflow onto the Skills page; leaving `type:` out
   * lets each reader apply its own documented default instead.
   */
  type?: SkillType;
};

export function withSkillFrontmatter(body: string, meta: SkillFrontmatterMeta): string {
  if (parseFrontmatter(body)) return body;

  const lines = ['---', `name: ${meta.name}`, `description: ${meta.description.replace(/\r?\n/g, ' ').trim()}`];
  if (meta.type) lines.push(`type: ${meta.type}`);
  lines.push('---', '');

  return `${lines.join('\n')}\n${body}`;
}
