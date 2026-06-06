/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

// DOM tests for WorkflowAwareMessage (SPEC §8, §11.2).
//
// Verifies the wrapper:
//   - runs the AST-authoritative finalize() pass once per body change
//   - strips valid <step> / <ask> markers from the cleaned body it hands to
//     its render-prop child
//   - fires onMarker for every step marker found
//   - fires onMarker for every ask marker found
//   - leaves markers inside fenced code blocks visible AND does NOT emit them
//   - leaves invalid markers visible in the cleaned body AND does NOT emit them

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { WorkflowAwareMessage } from '@/renderer/pages/guid/components/workflow/WorkflowAwareMessage';
import type { WorkflowMarker } from '@/common/types/workflowTypes';

const TOTAL_STEPS = 6;

const collectChildOutput = (body: string, totalSteps = TOTAL_STEPS) => {
  const seen: string[] = [];
  const markers: WorkflowMarker[] = [];
  const onMarker = vi.fn((m: WorkflowMarker) => {
    markers.push(m);
  });

  render(
    <WorkflowAwareMessage body={body} totalSteps={totalSteps} onMarker={onMarker}>
      {(cleaned) => {
        seen.push(cleaned);
        return <div data-testid="cleaned">{cleaned}</div>;
      }}
    </WorkflowAwareMessage>
  );

  return { seen, markers, onMarker };
};

describe('WorkflowAwareMessage', () => {
  it('strips a valid <step> marker from the cleaned body handed to children', () => {
    const body = 'Working on step 2.<step n="2" status="now"/> Almost there.';
    const { seen } = collectChildOutput(body);
    const cleaned = seen[seen.length - 1];
    expect(cleaned).not.toContain('<step');
    expect(cleaned).toContain('Working on step 2.');
    expect(cleaned).toContain('Almost there.');
  });

  it('fires onMarker for each step marker found', () => {
    const body =
      'Start.<step n="1" status="now"/> Done one.<step n="1" status="done"/> Next.<step n="2" status="now"/>';
    const { markers } = collectChildOutput(body);

    expect(markers).toHaveLength(3);
    expect(markers[0]).toEqual({ kind: 'step', n: 1, status: 'now' });
    expect(markers[1]).toEqual({ kind: 'step', n: 1, status: 'done' });
    expect(markers[2]).toEqual({ kind: 'step', n: 2, status: 'now' });
  });

  it('fires onMarker for an <ask> marker found in the body', () => {
    const body =
      'Quick question:<ask type="text" placeholder="e.g. $500">What is your budget?</ask> Thanks.';
    const { markers, seen } = collectChildOutput(body);

    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({
      kind: 'ask',
      ask: {
        question: 'What is your budget?',
        type: 'text',
        placeholder: 'e.g. $500',
      },
    });

    const cleaned = seen[seen.length - 1];
    expect(cleaned).not.toContain('<ask');
    expect(cleaned).not.toContain('</ask>');
  });

  it('does NOT strip markers inside fenced code blocks AND does NOT emit them', () => {
    const body = [
      'Here is an example agents emit:',
      '```',
      '<step n="3" status="done"/>',
      '```',
      'End.',
    ].join('\n');

    const { seen, markers } = collectChildOutput(body);
    const cleaned = seen[seen.length - 1];

    // Marker survives inside the fence (rendered as visible source).
    expect(cleaned).toContain('<step n="3" status="done"/>');
    // And it MUST NOT have been emitted as a real workflow marker.
    expect(markers).toHaveLength(0);
  });

  it('keeps invalid markers visible in cleaned body and does not emit them', () => {
    // n=99 is out of range (TOTAL_STEPS=6) → invalid → stays visible, no emission.
    const body = 'Bad ref:<step n="99" status="now"/> end.';
    const { seen, markers } = collectChildOutput(body);
    const cleaned = seen[seen.length - 1];

    expect(cleaned).toContain('<step n="99" status="now"/>');
    expect(markers).toHaveLength(0);
  });

  it('mixed body: emits valid markers, strips them, leaves code-fenced + invalid markers visible', () => {
    const body = [
      'Plan begins.<step n="1" status="now"/>',
      'Example for the doc:',
      '```',
      '<ask type="text">ignored sample</ask>',
      '```',
      'Bad: <step n="99" status="now"/>',
      'Real question:<ask type="boolean">Continue?</ask>',
      'Done.<step n="1" status="done"/>',
    ].join('\n');

    const { seen, markers } = collectChildOutput(body);
    const cleaned = seen[seen.length - 1];

    // 3 valid emissions: 2 steps + 1 ask.
    expect(markers).toHaveLength(3);
    const steps = markers.filter((m) => m.kind === 'step');
    const asks = markers.filter((m) => m.kind === 'ask');
    expect(steps).toHaveLength(2);
    expect(asks).toHaveLength(1);

    // Valid markers stripped.
    expect(cleaned).not.toContain('<step n="1" status="now"/>');
    expect(cleaned).not.toContain('<step n="1" status="done"/>');
    expect(cleaned).not.toContain('Real question:<ask');

    // Code-fenced + invalid markers stay visible.
    expect(cleaned).toContain('<ask type="text">ignored sample</ask>');
    expect(cleaned).toContain('<step n="99" status="now"/>');
  });
});
