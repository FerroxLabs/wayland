/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import WebviewHost from '@/renderer/components/media/WebviewHost';

interface URLViewerProps {
  /** URL to display */
  url: string;
  /** Optional title for the page */
  title?: string;
}

/**
 * URL Preview component - for previewing web pages within the app (conversation preview panel)
 *
 * Delegates to the shared WebviewHost with navigation bar enabled.
 */
const URLViewer: React.FC<URLViewerProps> = ({ url }) => {
  return <WebviewHost url={url} showNavBar className='bg-bg-1' />;
};

export default URLViewer;
