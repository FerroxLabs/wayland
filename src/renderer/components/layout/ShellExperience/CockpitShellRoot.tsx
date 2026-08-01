/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import CockpitSider from '../CockpitSider';
import Layout from '../Layout';

export type CockpitShellFaultInjection = {
  initializeState?: () => void;
  renderRoot?: () => void;
  renderRoute?: () => React.ReactNode;
};

export type CockpitShellRootProps = {
  faultInjection?: CockpitShellFaultInjection;
};

/** The preview shell is isolated so any failure is caught before Classic loads. */
const CockpitShellRoot: React.FC<CockpitShellRootProps> = ({ faultInjection }) => {
  useState(() => {
    faultInjection?.initializeState?.();
    return true;
  });
  faultInjection?.renderRoot?.();

  return (
    <>
      {faultInjection?.renderRoute?.()}
      <Layout shellExperience='cockpit' sider={<CockpitSider />} />
    </>
  );
};

export default CockpitShellRoot;
