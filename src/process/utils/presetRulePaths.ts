/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Rewrite a LEADING `skills/` path segment in a bundled preset rule/skill file to
 * the absolute user skills directory, so the model can find scripts it is told to run.
 *
 * ANCHORED DELIBERATELY. The original was `content.replace(/skills\//g, dir + '/')`,
 * duplicated at both copy sites. Every preset except one writes `skills/<name>/...`
 * at the start of a path, so the unanchored form looked correct for years.
 *
 * `smart-trader.md` is the exception: its three occurrences sit INSIDE
 * `.wayland-core/skills/market-open-report`, a workspace-relative path that must stay
 * relative. The unanchored rewrite spliced an absolute path into the middle of it and
 * seeded `cd .wayland-core//Users/<user>/.wayland-config/skills/market-open-report` —
 * a `cd` that can never succeed. The same rule file then instructs the model to treat
 * a failed `cd` as "the skill is not enabled", so Smart Trader's flagship opener
 * confidently reported the morning report skill as missing.
 *
 * The lead character is preserved so a rewrite still fires at a line start and after
 * the delimiters the presets actually use (backtick, quote, space, open paren), while
 * `.wayland-core/skills/` and any other `<segment>/skills/` is left alone.
 */
export function absolutizeSkillPaths(content: string, userSkillsDir: string): string {
  return content.replace(/(^|[\s`'"(])skills\//g, (_m, lead: string) => `${lead}${userSkillsDir}/`);
}
