/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Steps } from '@arco-design/web-react';
import type { StepsProps } from '@arco-design/web-react/es/Steps';
import classNames from 'classnames';
import React from 'react';

/**
 * Steps component props
 */
export interface WaylandStepsProps extends StepsProps {
  /** Additional class name */
  className?: string;
}

/**
 * Steps component
 *
 * Wrapper around Arco Design Steps with unified theme styling
 *
 * @features
 * - Custom brand color theme
 * - Special styling for finished state
 * - Full Arco Steps API support
 *
 * @example
 * ```tsx
 * // Basic usage
 * <WaylandSteps current={1}>
 *   <WaylandSteps.Step title="Step 1" description="Description" />
 *   <WaylandSteps.Step title="Step 2" description="Description" />
 *   <WaylandSteps.Step title="Step 3" description="Description" />
 * </WaylandSteps>
 *
 * // Vertical steps
 * <WaylandSteps current={1} direction="vertical">
 *   <WaylandSteps.Step title="Step 1" description="Description" />
 *   <WaylandSteps.Step title="Step 2" description="Description" />
 * </WaylandSteps>
 *
 * // Steps with icons
 * <WaylandSteps current={1}>
 *   <WaylandSteps.Step title="Done" icon={<IconCheck />} />
 *   <WaylandSteps.Step title="In progress" icon={<IconLoading />} />
 *   <WaylandSteps.Step title="Pending" icon={<IconClock />} />
 * </WaylandSteps>
 *
 * // Mini steps
 * <WaylandSteps current={1} size="small" type="dot">
 *   <WaylandSteps.Step title="Step 1" />
 *   <WaylandSteps.Step title="Step 2" />
 *   <WaylandSteps.Step title="Step 3" />
 * </WaylandSteps>
 * ```
 *
 * @see arco-override.css for custom styles (.wayland-steps)
 */
const WaylandSteps: React.FC<WaylandStepsProps> & { Step: typeof Steps.Step } = ({ className, ...props }) => {
  return <Steps {...props} className={classNames('wayland-steps', className)} />;
};

WaylandSteps.displayName = 'WaylandSteps';

// Export sub-component
WaylandSteps.Step = Steps.Step;

export default WaylandSteps;
