/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Layout from '../Layout';
import Sider from '../Sider';

/** The proven shell is a complete, independently loadable composition root. */
const ClassicShellRoot: React.FC = () => <Layout shellExperience='classic' sider={<Sider />} />;

export default ClassicShellRoot;
