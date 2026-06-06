/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SkillFinding, SkillSeverity, SkillThreat } from '@/common/types/skillTypes';

/** Minimal skill view that Skill Guard scans. */
export type SkillScanInput = {
  name: string;
  body: string;
  description: string;
  tags: string[];
};

export type SkillGuardRule = {
  threat: SkillThreat;
  severity: SkillSeverity;
  test: (input: SkillScanInput) => SkillFinding[];
};

const EVIDENCE_MAX = 120;

const finding = (threat: SkillThreat, severity: SkillSeverity, message: string, evidence: string): SkillFinding => ({
  threat,
  severity,
  message,
  evidence: evidence.length > EVIDENCE_MAX ? evidence.slice(0, EVIDENCE_MAX) + '…' : evidence,
  layer: 'regex',
});

/** Scan body, description, and joined tags against a single regex. */
const scanText = (
  input: SkillScanInput,
  regex: RegExp,
  threat: SkillThreat,
  severity: SkillSeverity,
  message: string
): SkillFinding[] => {
  const out: SkillFinding[] = [];
  for (const text of [input.body, input.description, input.tags.join(' ')]) {
    const m = text.match(regex);
    if (m) {
      out.push(finding(threat, severity, message, m[0]));
      break; // one finding per rule per input is enough
    }
  }
  return out;
};

/**
 * The regex/heuristic ruleset. Each rule scans body + frontmatter description
 * + tags (description goes verbatim into agent prompts, so it is an injection
 * channel). These rules WARN - they are not a guarantee. The agent permission
 * system is the real boundary.
 */
export const SKILL_GUARD_RULES: SkillGuardRule[] = [
  {
    threat: 'credential-access',
    severity: 'critical',
    test: (input) =>
      scanText(
        input,
        /~\/\.ssh\/|AKIA[0-9A-Z]{16}|Bearer\s+[A-Za-z0-9_-]{20,}|\.env\b|\bid_rsa\b/i,
        'credential-access',
        'critical',
        'reference to a credential store or token'
      ),
  },
  {
    threat: 'network-exfiltration',
    severity: 'critical',
    test: (input) =>
      scanText(
        input,
        /\b(curl|wget)\b[^\n]*(?:\bPOST\b|--data|--upload-file|-T\s)/i,
        'network-exfiltration',
        'critical',
        'curl/wget upload to an external host'
      ),
  },
  {
    threat: 'shell-execution',
    severity: 'critical',
    test: (input) =>
      scanText(
        input,
        /\brm\s+-rf\s+\/(?!\w)|\|\s*(?:bash|sh|zsh)\b|\beval\s*[(`]/i,
        'shell-execution',
        'critical',
        'destructive or piped shell execution'
      ),
  },
  {
    threat: 'filesystem-write',
    severity: 'medium',
    test: (input) =>
      scanText(
        input,
        /\b(?:write|tee|>>?)\s+\/etc\/|~\/Library\/(?:Application Support|Preferences)\/|~\/\.config\/[a-z]/i,
        'filesystem-write',
        'medium',
        'writes outside the workspace'
      ),
  },
  {
    threat: 'instruction-override',
    severity: 'medium',
    test: (input) =>
      scanText(
        input,
        /\bignore (?:previous|prior|all|the above) instructions\b|\bdisregard (?:the |your )?(?:system |previous )?(?:prompt|instructions)\b|\boverride (?:the |your )?system\b/i,
        'instruction-override',
        'medium',
        'instruction-override phrasing'
      ),
  },
  {
    threat: 'obfuscation',
    severity: 'medium',
    test: (input) => {
      const body = input.body;
      const blob = body.match(/[A-Za-z0-9+/]{80,}={0,2}/);
      const decodeRun = /\batob\s*\(|\bbase64\s+-(?:d|-decode)\b|\bopenssl\s+enc\b/i.test(body);
      if (!blob || !decodeRun) return [];
      return [finding('obfuscation', 'medium', 'long base64 blob paired with decode-and-run', blob[0])];
    },
  },
  {
    threat: 'index-poisoning',
    severity: 'low',
    test: (input) => {
      if (input.tags.length < 5) return [];
      const body = input.body.toLowerCase();
      const description = input.description.toLowerCase();
      const appearing = input.tags.filter((t) => {
        const tag = t.toLowerCase();
        return body.includes(tag) || description.includes(tag);
      }).length;
      const ratio = appearing / input.tags.length;
      if (ratio >= 0.3) return [];
      return [
        finding(
          'index-poisoning',
          'low',
          `${input.tags.length} tags but only ${Math.round(ratio * 100)}% appear in body/description`,
          input.tags.slice(0, 8).join(', ')
        ),
      ];
    },
  },
];
