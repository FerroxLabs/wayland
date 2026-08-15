/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * K-02 Task 1 (RED): pure tests for the honest start-failure classifier/hedge.
 *
 * No fs, no `child_process`, no `WCoreAgent` import - `startFailureReason.ts`
 * is a leaf pure module. `WCORE_DESKTOP_MCP_PROFILE` is imported from the REAL
 * `envBuilder.ts` (never hand-duplicated as a string literal) so these tests
 * can never silently drift from the real reserved-profile constant.
 */
import { describe, expect, it } from 'vitest';
import { WCORE_DESKTOP_MCP_PROFILE } from '@process/agent/wcore/envBuilder';
import {
  classifyStartFailureDetail,
  describeContractRejection,
  profileStripHedge,
} from '@process/agent/wcore/startFailureReason';

describe('classifyStartFailureDetail', () => {
  it('classifies arbitrary text with no profile mention as generic', () => {
    expect(classifyStartFailureDetail('wcore exited with code 1 during init: some unrelated engine error')).toBe(
      'generic'
    );
  });

  it('classifies a bail naming the reserved Desktop profile as stripped-config', () => {
    expect(classifyStartFailureDetail(`Error: Profile '${WCORE_DESKTOP_MCP_PROFILE}' not found in config`)).toBe(
      'stripped-config'
    );
  });

  it('classifies a bail naming any OTHER profile as profile-resolution (discriminates on identity)', () => {
    expect(classifyStartFailureDetail("Error: Profile 'my-custom-profile' not found in config")).toBe(
      'profile-resolution'
    );
  });

  it('classifies the double-quote variant of the reserved profile as stripped-config', () => {
    expect(classifyStartFailureDetail(`Error: Profile "${WCORE_DESKTOP_MCP_PROFILE}" not found in config`)).toBe(
      'stripped-config'
    );
  });

  it('classifies the double-quote variant naming another profile as profile-resolution', () => {
    expect(classifyStartFailureDetail('Error: Profile "some-other-profile" not found in config')).toBe(
      'profile-resolution'
    );
  });
});

describe('profileStripHedge', () => {
  it('returns an empty string for generic detail', () => {
    expect(profileStripHedge('wcore exited with code 1 during init: some unrelated engine error')).toBe('');
  });

  it('returns an empty string for ordinary profile-resolution detail', () => {
    expect(profileStripHedge("Error: Profile 'my-custom-profile' not found in config")).toBe('');
  });

  it('returns non-empty, hedge-worded text for a stripped-config detail', () => {
    const hedge = profileStripHedge(`Error: Profile '${WCORE_DESKTOP_MCP_PROFILE}' not found in config`);
    expect(hedge).not.toBe('');
    expect(hedge).toMatch(/likely|inferred|not confirmed/i);
  });
});

describe('describeContractRejection', () => {
  it('keeps the original fallback wording byte-exact when there is no engine stderr', () => {
    const fallbackDetail = 'Core emitted malformed JSON';
    expect(describeContractRejection('', fallbackDetail)).toBe(
      `wcore Desktop contract rejected ready: ${fallbackDetail}`
    );
  });

  it('surfaces the engine stderr detail instead of the abstract phrase when stderr is present', () => {
    const stderrDetail = 'error: something the engine explained';
    const result = describeContractRejection(stderrDetail, 'Core emitted malformed JSON');
    expect(result).toContain(stderrDetail);
    expect(result).not.toContain('Desktop contract rejected ready');
  });

  it('appends the stripped-config hedge when the stderr detail names the reserved profile', () => {
    const stderrDetail = `Error: Profile '${WCORE_DESKTOP_MCP_PROFILE}' not found in config`;
    const result = describeContractRejection(stderrDetail, 'Core emitted malformed JSON');
    expect(result).toContain(stderrDetail);
    expect(result).toMatch(/likely|inferred|not confirmed/i);
  });
});
