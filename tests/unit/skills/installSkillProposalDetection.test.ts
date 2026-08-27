/**
 * END TO END on the PARSE half: a real [CONCIERGE_PROPOSE] block, through the
 * real detector, into a real proposal. The validator is unit-tested next door;
 * this pins that the detector actually reaches it, with the right field names.
 */
import { describe, it, expect } from 'vitest';

import { detectConciergeProposals } from '@process/task/ConciergeProposeDetector';

const block = (body: string) => `Here you go.\n\n[CONCIERGE_PROPOSE]\n${body}\n[/CONCIERGE_PROPOSE]\n`;

const GOOD = [
  'kind: install_skill',
  'name: tide-morning-brief',
  'url: https://packs.example.com/tc-tide-1.0.0.zip',
  `sha256: ${'b'.repeat(64)}`,
  'label: TC-TIDE Morning Brief',
].join('\n');

describe('install_skill blocks reach the validator', () => {
  it('CONTROL: a known-good block yields exactly one proposal', () => {
    const found = detectConciergeProposals(block(GOOD));
    expect(found.length).toBe(1);
    const p = found[0];
    expect(p.kind).toBe('install_skill');
    expect(p.kind === 'install_skill' && p.name).toBe('tide-morning-brief');
    expect(p.kind === 'install_skill' && p.label).toBe('TC-TIDE Morning Brief');
  });

  it('drops a block whose hash is missing, rather than proposing an unpinned install', () => {
    const noHash = GOOD.split('\n').filter((l) => !l.startsWith('sha256:')).join('\n');
    expect(detectConciergeProposals(block(noHash)).length).toBe(0);
  });

  it('drops a plain-http block', () => {
    expect(detectConciergeProposals(block(GOOD.replace('https://', 'http://'))).length).toBe(0);
  });

  it('drops a traversal name', () => {
    expect(detectConciergeProposals(block(GOOD.replace('tide-morning-brief', '../../evil'))).length).toBe(0);
  });
});
