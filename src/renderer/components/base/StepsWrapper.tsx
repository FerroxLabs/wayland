/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { Steps } from '@arco-design/web-react';
import type { StepsProps } from '@arco-design/web-react/es/Steps';
import React from 'react';

interface StepsWrapperProps extends StepsProps {
  className?: string;
}

const StepsWrapper: React.FC<StepsWrapperProps> & { Step: typeof Steps.Step } = ({ className, ...props }) => {
  return <Steps {...props} className={`wayland-steps ${className || ''}`} />;
};

StepsWrapper.Step = Steps.Step;

export default StepsWrapper;
