/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message } from '@arco-design/web-react';
import MonacoEditor from '@monaco-editor/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface HTMLPreviewProps {
  content: string;
  filePath?: string;
  hideToolbar?: boolean;
}

interface SelectedElement {
  path: string; // DOM path, e.g. "html > body > div:nth-child(2) > p:nth-child(1)"
  html: string; // outerHTML of element
  startLine?: number; // Code start line (estimated)
  endLine?: number; // Code end line (estimated)
}

/**
 * Element inspector script. Serialized into the iframe document (which has an
 * opaque origin because it loads from a Blob URL) and communicates back to the
 * parent via window.parent.postMessage - which works cross-origin and does not
 * require `allow-same-origin` on the iframe sandbox.
 */
const INSPECTOR_SCRIPT_SOURCE = `
      (function() {
        let hoveredElement = null;
        let overlay = null;

        // Create highlight overlay
        function createOverlay() {
          overlay = document.createElement('div');
          overlay.style.position = 'absolute';
          overlay.style.border = '2px solid #2196F3';
          overlay.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
          overlay.style.pointerEvents = 'none';
          overlay.style.zIndex = '999999';
          overlay.style.boxSizing = 'border-box';
          document.body.appendChild(overlay);
        }

        // Update overlay position
        function updateOverlay(element) {
          if (!overlay) createOverlay();
          const rect = element.getBoundingClientRect();
          overlay.style.top = rect.top + window.scrollY + 'px';
          overlay.style.left = rect.left + window.scrollX + 'px';
          overlay.style.width = rect.width + 'px';
          overlay.style.height = rect.height + 'px';
          overlay.style.display = 'block';
        }

        // Hide overlay
        function hideOverlay() {
          if (overlay) {
            overlay.style.display = 'none';
          }
        }

        // Get the CSS selector path of an element
        function getElementPath(element) {
          const path = [];
          while (element && element.nodeType === Node.ELEMENT_NODE) {
            let selector = element.nodeName.toLowerCase();
            if (element.id) {
              selector += '#' + element.id;
              path.unshift(selector);
              break;
            } else {
              let sibling = element;
              let nth = 1;
              while (sibling.previousElementSibling) {
                sibling = sibling.previousElementSibling;
                if (sibling.nodeName.toLowerCase() === selector) {
                  nth++;
                }
              }
              if (nth > 1) {
                selector += ':nth-child(' + nth + ')';
              }
            }
            path.unshift(selector);
            element = element.parentElement;
          }
          return path.join(' > ');
        }

        // Mouse move event
        document.addEventListener('mousemove', function(e) {
          hoveredElement = e.target;
          if (hoveredElement && hoveredElement !== document.body && hoveredElement !== document.documentElement) {
            updateOverlay(hoveredElement);
          } else {
            hideOverlay();
          }
        });

        // Mouse leave event
        document.addEventListener('mouseleave', function() {
          hideOverlay();
        });

        // Click event - select element
        document.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();

          if (hoveredElement && hoveredElement !== document.body && hoveredElement !== document.documentElement) {
            const elementInfo = {
              path: getElementPath(hoveredElement),
              html: hoveredElement.outerHTML,
            };

            // Send message to parent window
            window.parent.postMessage({
              type: 'element-selected',
              data: elementInfo
            }, '*');
          }
        });

        // Context menu event
        document.addEventListener('contextmenu', function(e) {
          e.preventDefault();

          if (hoveredElement && hoveredElement !== document.body && hoveredElement !== document.documentElement) {
            const elementInfo = {
              path: getElementPath(hoveredElement),
              html: hoveredElement.outerHTML,
            };

            // Send message to parent window
            window.parent.postMessage({
              type: 'element-contextmenu',
              data: {
                element: elementInfo,
                x: e.clientX,
                y: e.clientY
              }
            }, '*');
          }
        });
      })();
    `;

/**
 * HTML preview component
 * - Supports live preview and code editing
 * - Supports element inspector (DevTools-like)
 * - Supports bidirectional locating: preview <-> code
 */
const HTMLPreview: React.FC<HTMLPreviewProps> = ({ content, filePath, hideToolbar = false }) => {
  const { t } = useTranslation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [htmlCode, setHtmlCode] = useState(content);
  const [inspectorMode, setInspectorMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; element: SelectedElement } | null>(null);
  const [messageApi, messageContextHolder] = Message.useMessage();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
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

  // Build the iframe document (HTML + optional inspector script) and serve it
  // via a Blob URL so the iframe has an opaque origin. This lets us drop
  // `allow-same-origin` from the sandbox, closing H2 (untrusted preview HTML
  // executing as the app origin).
  const [iframeBlobUrl, setIframeBlobUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') return;

    // Inject <base> tag to support relative paths
    let finalHtml = htmlCode;
    if (filePath) {
      // Get directory of the file
      const fileDir = filePath.substring(0, filePath.lastIndexOf('/') + 1);
      // Construct file:// protocol base URL
      const baseUrl = `file://${fileDir}`;

      // Check if base tag exists
      if (!finalHtml.match(/<base\s+href=/i)) {
        if (finalHtml.match(/<head>/i)) {
          finalHtml = finalHtml.replace(/<head>/i, `<head><base href="${baseUrl}">`);
        } else if (finalHtml.match(/<html>/i)) {
          finalHtml = finalHtml.replace(/<html>/i, `<html><head><base href="${baseUrl}"></head>`);
        } else {
          finalHtml = `<head><base href="${baseUrl}"></head>${finalHtml}`;
        }
      }
    }

    if (inspectorMode) {
      const inspectorTag = `<script>${INSPECTOR_SCRIPT_SOURCE}</script>`;
      if (finalHtml.match(/<\/body>/i)) {
        finalHtml = finalHtml.replace(/<\/body>/i, `${inspectorTag}</body>`);
      } else {
        finalHtml = `${finalHtml}${inspectorTag}`;
      }
    }

    const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setIframeBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [htmlCode, inspectorMode, filePath]);

  /**
   * Listen for iframe messages
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'element-selected') {
        const elementInfo: SelectedElement = event.data.data;
        setSelectedElement(elementInfo);
        messageApi.info(t('preview.html.elementSelected', { path: elementInfo.path }));
      } else if (event.data.type === 'element-contextmenu') {
        const { element, x, y } = event.data.data;

        // Compute context menu position (relative to parent window)
        const iframe = iframeRef.current;
        if (iframe) {
          const iframeRect = iframe.getBoundingClientRect();
          setContextMenu({
            x: iframeRect.left + x,
            y: iframeRect.top + y,
            element: element,
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [messageApi]);

  /**
   * Close context menu
   */
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  /**
   * Copy element HTML
   */
  const handleCopyHTML = useCallback(
    (html: string) => {
      void navigator.clipboard.writeText(html);
      messageApi.success(t('preview.html.copySuccess'));
      setContextMenu(null);
    },
    [messageApi, t]
  );

  /**
   * Download HTML
   */
  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filePath?.split('/').pop() || 'document'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Toggle edit mode
   */
  const handleToggleEdit = () => {
    if (editMode) {
      // Save edit
      setHtmlCode(htmlCode);
    }
    setEditMode(!editMode);
  };

  /**
   * Toggle inspector mode
   */
  const handleToggleInspector = () => {
    setInspectorMode(!inspectorMode);
    if (!inspectorMode) {
      messageApi.info(t('preview.html.inspectorEnabled'));
    }
  };

  return (
    <div className='h-full w-full flex flex-col bg-bg-1'>
      {messageContextHolder}

      {/* Toolbar */}
      {!hideToolbar && (
        <div className='flex items-center justify-between h-40px px-12px bg-bg-2 border-b border-border-base flex-shrink-0'>
          <div className='flex items-center gap-8px'>
            {/* Edit button */}
            <button
              onClick={handleToggleEdit}
              className={`px-12px py-4px rd-4px text-12px transition-colors ${editMode ? 'bg-primary text-white' : 'bg-bg-3 text-t-primary hover:bg-bg-4'}`}
            >
              {editMode ? `💾 ${t('common.save')}` : `✏️ ${t('common.edit')}`}
            </button>

            {/* Element inspector button */}
            <button
              onClick={handleToggleInspector}
              className={`px-12px py-4px rd-4px text-12px transition-colors ${inspectorMode ? 'bg-primary text-white' : 'bg-bg-3 text-t-primary hover:bg-bg-4'}`}
              title={t('preview.html.inspectorTooltip')}
            >
              🔍 {inspectorMode ? t('preview.html.inspecting') : t('preview.html.inspectorButton')}
            </button>

            {/* Selected element path */}
            {selectedElement && (
              <div className='text-12px text-t-secondary ml-8px'>
                {t('preview.html.selectedLabel')} <code className='bg-bg-3 px-4px rd-2px'>{selectedElement.path}</code>
              </div>
            )}
          </div>

          <div className='flex items-center gap-8px'>
            {/* Download button */}
            <button
              onClick={handleDownload}
              className='flex items-center gap-4px px-8px py-4px rd-4px cursor-pointer hover:bg-bg-3 transition-colors'
              title={t('preview.html.downloadHtml')}
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
            </button>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className='flex-1 flex overflow-hidden'>
        {/* Left: code editor (shown in edit mode) */}
        {editMode && (
          <div className='flex-1 overflow-hidden border-r border-border-base'>
            <MonacoEditor
              height='100%'
              language='html'
              theme={currentTheme === 'dark' ? 'vs-dark' : 'vs'}
              value={htmlCode}
              onChange={(value) => setHtmlCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>
        )}

        {/* Right: HTML preview */}
        <div className={`${editMode ? 'flex-1' : 'w-full'} overflow-auto bg-white`}>
          <iframe
            ref={iframeRef}
            src={iframeBlobUrl}
            className='w-full h-full border-0'
            // Blob URL gives the iframe an opaque origin, so `allow-same-origin`
            // is intentionally dropped (H2). The element inspector talks back
            // through window.parent.postMessage, which works cross-origin.
            sandbox='allow-scripts'
            title='HTML Preview'
          />
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className='fixed bg-bg-1 border border-border-base rd-6px shadow-lg py-4px z-9999'
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className='px-12px py-6px text-13px text-t-primary hover:bg-bg-2 cursor-pointer transition-colors'
            onClick={() => handleCopyHTML(contextMenu.element.html)}
          >
            📋 {t('preview.html.copyElementHtml')}
          </div>
          <div
            className='px-12px py-6px text-13px text-t-primary hover:bg-bg-2 cursor-pointer transition-colors'
            onClick={() => {
              console.log('[HTMLPreview] Element info:', contextMenu.element);
              messageApi.info(t('preview.html.printedToConsole'));
              setContextMenu(null);
            }}
          >
            🔍 {t('preview.html.viewElementInfo')}
          </div>
        </div>
      )}
    </div>
  );
};

export default HTMLPreview;
