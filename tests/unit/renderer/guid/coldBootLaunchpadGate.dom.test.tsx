/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression for cross-audit live-smoke HIGH ("Cold-boot lands on Cowork
 * hero, not launchpad"). `useGuidAgentSelection` rehydrates the persisted
 * `guid.lastSelectedAgent` key on mount, which can land the page directly
 * in `isPresetAgent === true` mode. GuidPage now gates the preset hero
 * behind a session-level "user has interacted" flag - until the user
 * clicks a pill / quick-launch card / assistant, the launchpad surface
 * wins regardless of the persisted preset.
 *
 * Mounting the full GuidPage in jsdom drags in dozens of unrelated
 * subsystems (IPC bridges, SWR caches, agent registry). Instead this test
 * recreates the EXACT gate expression from `GuidPage.tsx`
 * (`showPresetHero = isPresetAgent && hasInteractedWithAgentSelection`)
 * and verifies that:
 *   1. cold-boot with `isPresetAgent=true` still shows the launchpad,
 *   2. clicking a quick-launch card flips the gate (preset hero mounts),
 *   3. a navigation (location.key change) resets the interaction flag.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import React, { useCallback, useEffect, useState } from 'react';
import { describe, expect, it } from 'vitest';

type Props = {
  isPresetAgent: boolean;
  locationKey: string;
};

const GateHarness: React.FC<Props> = ({ isPresetAgent, locationKey }) => {
  const [hasInteractedWithAgentSelection, setHasInteractedWithAgentSelection] = useState(false);
  useEffect(() => {
    setHasInteractedWithAgentSelection(false);
  }, [locationKey]);
  const showPresetHero = isPresetAgent && hasInteractedWithAgentSelection;

  const handleQuickLaunchAnchor = useCallback(() => {
    setHasInteractedWithAgentSelection(true);
  }, []);

  return (
    <div>
      {showPresetHero ? <div data-testid='preset-hero'>Cowork</div> : null}
      {!showPresetHero ? (
        <div data-testid='launchpad'>
          <button type='button' data-testid='ql-cowork' onClick={handleQuickLaunchAnchor}>
            Cowork card
          </button>
        </div>
      ) : null}
    </div>
  );
};

describe('GuidPage cold-boot launchpad gate (cross-audit live-smoke HIGH)', () => {
  it('shows the launchpad on first load even when a preset is already selected', () => {
    render(<GateHarness isPresetAgent={true} locationKey='nav-1' />);
    expect(screen.getByTestId('launchpad')).toBeTruthy();
    expect(screen.queryByTestId('preset-hero')).toBeNull();
  });

  it('shows the launchpad when no preset is selected (control case)', () => {
    render(<GateHarness isPresetAgent={false} locationKey='nav-1' />);
    expect(screen.getByTestId('launchpad')).toBeTruthy();
    expect(screen.queryByTestId('preset-hero')).toBeNull();
  });

  it('flips to the preset hero once the user clicks a quick-launch card', () => {
    render(<GateHarness isPresetAgent={true} locationKey='nav-1' />);
    expect(screen.queryByTestId('preset-hero')).toBeNull();

    fireEvent.click(screen.getByTestId('ql-cowork'));

    expect(screen.queryByTestId('launchpad')).toBeNull();
    expect(screen.getByTestId('preset-hero')).toBeTruthy();
  });

  it('resets the interaction flag on navigation (locationKey change)', () => {
    const { rerender } = render(<GateHarness isPresetAgent={true} locationKey='nav-1' />);
    fireEvent.click(screen.getByTestId('ql-cowork'));
    expect(screen.getByTestId('preset-hero')).toBeTruthy();

    rerender(<GateHarness isPresetAgent={true} locationKey='nav-2' />);

    expect(screen.queryByTestId('preset-hero')).toBeNull();
    expect(screen.getByTestId('launchpad')).toBeTruthy();
  });
});
