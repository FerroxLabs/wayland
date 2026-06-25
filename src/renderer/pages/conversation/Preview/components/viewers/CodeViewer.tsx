/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { X } from 'lucide-react';
import { useAutoScroll } from '@/renderer/hooks/chat/useAutoScroll';
import { useTextSelection } from '@/renderer/hooks/ui/useTextSelection';
import { useTypingAnimation } from '@/renderer/hooks/chat/useTypingAnimation';
import { iconColors } from '@/renderer/styles/colors';
import { LARGE_TEXT_VIEWER_RENDER_LIMIT, LARGE_TEXT_VIEWER_THRESHOLD } from '../../constants';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs, vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import SelectionToolbar from '../renderers/SelectionToolbar';

interface CodePreviewProps {
  content: string; // Code content
  language?: string; // Programming language
  onClose?: () => void; // Close callback
  hideToolbar?: boolean; // Hide toolbar
  viewMode?: 'source' | 'preview'; // External view mode
  onViewModeChange?: (mode: 'source' | 'preview') => void; // View mode change callback
}

/**
 * Code preview component
 *
 * Uses SyntaxHighlighter to render code block, supports source/preview toggle and download
 */
const CodePreview: React.FC<CodePreviewProps> = ({
  content,
  language = 'text',
  onClose,
  hideToolbar = false,
  viewMode: externalViewMode,
  onViewModeChange,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
  });
  const [internalViewMode, setInternalViewMode] = useState<'source' | 'preview'>('preview'); // Internal view mode

  // Use external viewMode if provided, otherwise use internal state
  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;

  // Disable highlight/animation for large texts to avoid UI freezes in SyntaxHighlighter
  const isLargeContent = content.length > LARGE_TEXT_VIEWER_THRESHOLD;

  // Render only the first chunk for very large text to reduce tab switch/close jank
  const renderedContent = isLargeContent ? content.slice(0, LARGE_TEXT_VIEWER_RENDER_LIMIT) : content;
  const isRenderedTruncated = renderedContent.length < content.length;

  // Use typing animation Hook
  const { displayedContent } = useTypingAnimation({
    content: renderedContent,
    enabled: viewMode === 'preview' && !isLargeContent, // Show truncated content directly for large text
    speed: 50, // 50 characters per second
  });

  // Use auto-scroll Hook
  useAutoScroll({
    containerRef,
    content: renderedContent,
    enabled: viewMode === 'preview' && !isLargeContent, // Disable for large text
    threshold: 200, // Follow when within 200px from bottom
  });

  // Monitor theme changes
  useEffect(() => {
    const updateTheme = () => {
      const theme = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
      setCurrentTheme(theme);
    };

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  // Monitor text selection
  const { selectedText, selectionPosition, clearSelection } = useTextSelection(containerRef, !isLargeContent);

  // Download code file
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Set file extension based on language
    const ext =
      language === 'javascript' || language === 'js'
        ? 'js'
        : language === 'typescript' || language === 'ts'
          ? 'ts'
          : language === 'python' || language === 'py'
            ? 'py'
            : language === 'java'
              ? 'java'
              : language === 'cpp' || language === 'c++'
                ? 'cpp'
                : language === 'c'
                  ? 'c'
                  : language === 'html'
                    ? 'html'
                    : language === 'css'
                      ? 'css'
                      : language === 'json'
                        ? 'json'
                        : language === 'markdown' || language === 'md'
                          ? 'md'
                          : 'txt';
    link.download = `code-${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Toggle view mode
  const handleViewModeChange = (mode: 'source' | 'preview') => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
  };

  return (
    <div className='flex flex-col w-full h-full overflow-hidden'>
      {/* Toolbar: Source/Preview toggle + Download button */}
      {!hideToolbar && (
        <div className='flex items-center justify-between h-40px px-12px bg-bg-2 flex-shrink-0'>
          <div className='flex items-center gap-4px'>
            {/* Source button */}
            <div
              className={`px-12px py-4px rd-4px cursor-pointer transition-colors text-12px ${viewMode === 'source' ? 'bg-primary text-white' : 'text-t-secondary hover:bg-bg-3'}`}
              onClick={() => handleViewModeChange('source')}
            >
              {t('preview.source')}
            </div>
            {/* Preview button */}
            <div
              className={`px-12px py-4px rd-4px cursor-pointer transition-colors text-12px ${viewMode === 'preview' ? 'bg-primary text-white' : 'text-t-secondary hover:bg-bg-3'}`}
              onClick={() => handleViewModeChange('preview')}
            >
              {t('preview.preview')}
            </div>
          </div>

          {/* Right button group: Download + Close */}
          <div className='flex items-center gap-8px'>
            {/* Download button */}
            <div
              className='flex items-center gap-4px px-8px py-4px rd-4px cursor-pointer hover:bg-bg-3 transition-colors'
              onClick={handleDownload}
              title={t('preview.downloadCode', { language: (language || 'text').toUpperCase() })}
            >
              <svg
                width='14'
                height='14'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                className='text-t-secondary'
              >
                <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                <polyline points='7 10 12 15 17 10' />
                <line x1='12' y1='15' x2='12' y2='3' />
              </svg>
              <span className='text-12px text-t-secondary'>{t('common.download')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Content area */}
      <div ref={containerRef} className='flex-1 overflow-auto p-16px'>
        {isRenderedTruncated && (
          <div className='mb-12px px-10px py-8px rd-6px bg-bg-2 text-12px text-t-secondary'>
            {t('preview.largeTextTruncatedHint', { count: renderedContent.length })}
          </div>
        )}
        {viewMode === 'source' || isLargeContent ? (
          // Source mode or large text: render plain text to avoid highlighter blocking
          <pre className='w-full m-0 p-12px bg-bg-2 rd-8px overflow-auto font-mono text-12px text-t-primary whitespace-pre-wrap break-words'>
            {displayedContent}
          </pre>
        ) : (
          // Preview mode: Syntax highlighting
          <SyntaxHighlighter
            style={currentTheme === 'dark' ? vs2015 : vs}
            language={language}
            PreTag='div'
            wrapLongLines={language === 'text' || language === 'txt'}
            customStyle={
              language === 'text' || language === 'txt'
                ? { whiteSpace: 'pre-wrap', wordBreak: 'break-word' }
                : undefined
            }
          >
            {displayedContent}
          </SyntaxHighlighter>
        )}
      </div>

      {/* Text selection floating toolbar */}
      {selectedText && (
        <SelectionToolbar selectedText={selectedText} position={selectionPosition} onClear={clearSelection} />
      )}
    </div>
  );
};

export default CodePreview;
