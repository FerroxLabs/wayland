/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import React from 'react';
import OfficeWatchViewer from './OfficeWatchViewer';

interface PptViewerProps {
  filePath?: string;
  content?: string;
}

const PptViewer: React.FC<PptViewerProps> = (props) => <OfficeWatchViewer docType='ppt' {...props} />;

export default PptViewer;
