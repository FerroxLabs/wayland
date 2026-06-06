/**
 * @license
 * Copyright 2025 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Canonical skill types for the Wayland skills subsystem.
 */

export type SkillSource = 'wayland-library' | 'team' | 'user' | 'imported' | 'cli-discovered';
export type SkillType = 'skill' | 'workflow' | 'agent-profile';
export type SkillVerdict = 'clean' | 'review' | 'blocked' | 'unscanned';
export type SkillThreat =
  | 'credential-access'
  | 'network-exfiltration'
  | 'shell-execution'
  | 'filesystem-write'
  | 'instruction-override'
  | 'obfuscation'
  | 'index-poisoning';
export type SkillSeverity = 'critical' | 'medium' | 'low';

export type SkillMetadata = {
  author?: string;
  version?: string;
  tags: string[];
  category?: string;
  subcategory?: string;
  difficulty?: string;
  model?: string;
  tools?: string;
  depends?: string[];
};

export type SkillFinding = {
  threat: SkillThreat;
  severity: SkillSeverity;
  message: string;
  evidence: string;
  layer: 'regex' | 'llm';
};

export type SkillSecurityReport = {
  verdict: SkillVerdict;
  findings: SkillFinding[];
  scannedAt: number;
  scannerVersion: number;
  llmScanned: boolean;
};

export type SkillIndexEntry = {
  name: string;
  title?: string;
  description: string;
  type: SkillType;
  source: SkillSource;
  sourceLabel?: string;
  metadata: SkillMetadata;
  path: string;
  security?: SkillSecurityReport;
};

export const SKILL_SCANNER_VERSION = 1;
