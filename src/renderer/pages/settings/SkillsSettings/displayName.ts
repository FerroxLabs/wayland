/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Convert a slugged identifier (`executive-communicator`, `ai-machine-learning`)
 * into a human-friendly display label (`Executive Communicator`,
 * `AI & Machine Learning`).
 *
 * Two passes:
 *   1) Split on hyphens, capitalize each word.
 *   2) Apply small targeted substitutions for common acronyms ("AI", "API",
 *      "URL", "UI", "ID") and the literal `Machine Learning` → `& Machine
 *      Learning` so the canonical category names from the brand mockup read
 *      naturally without us hand-maintaining the full taxonomy in code.
 */

const ACRONYMS = new Set([
  'AI',
  'API',
  'CLI',
  'CRM',
  'CSS',
  'HTML',
  'HTTP',
  'ID',
  'IP',
  'JS',
  'JSON',
  'JTBD',
  'ML',
  'MVP',
  'OS',
  'PR',
  'QA',
  'SDK',
  'SEO',
  'SQL',
  'SSH',
  'TS',
  'UI',
  'URL',
  'UX',
  'VPN',
  'XML',
]);

export function toDisplayName(slug: string): string {
  if (!slug) return '';
  let label = slug
    .split('-')
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  // Canonical join words from the mockup taxonomy ("AI & Machine Learning",
  // "Marketing & Sales", "DevOps & Cloud"). The slug form uses hyphens for
  // both word breaks AND the "&" connector, so we restore the ampersand here.
  label = label.replace(/\bAI Machine Learning\b/g, 'AI & Machine Learning');
  label = label.replace(/\bMarketing Sales\b/g, 'Marketing & Sales');
  label = label.replace(/\bDevOps Cloud\b/g, 'DevOps & Cloud');

  return label;
}
