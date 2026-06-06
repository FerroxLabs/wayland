/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { X } from 'lucide-react';
import { joinPath } from '@/common/chat/chatLib';
import { ipcBridge } from '@/common';
import { useAutoScroll } from '@/renderer/hooks/chat/useAutoScroll';
import { useTextSelection } from '@/renderer/hooks/ui/useTextSelection';
import { useTypingAnimation } from '@/renderer/hooks/chat/useTypingAnimation';
import { iconColors } from '@/renderer/styles/colors';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs, vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { Streamdown } from 'streamdown';
import MarkdownEditor from '../editors/MarkdownEditor';
import SelectionToolbar from '../renderers/SelectionToolbar';
import { useContainerScroll, useContainerScrollTarget } from '../../hooks/useScrollSyncHelpers';
import { convertLatexDelimiters } from '@/renderer/utils/chat/latexDelimiters';
import { sanitizeMath } from '@/renderer/utils/sanitize';
import MermaidBlock from '@/renderer/components/Markdown/MermaidBlock';

interface MarkdownPreviewProps {
  content: string; // Markdown content
  onClose?: () => void; // Close callback
  hideToolbar?: boolean; // Hide toolbar
  viewMode?: 'source' | 'preview'; // External view mode
  onViewModeChange?: (mode: 'source' | 'preview') => void; // View mode change callback
  onContentChange?: (content: string) => void; // Content change callback
  containerRef?: React.RefObject<HTMLDivElement>; // Container ref for scroll sync
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void; // Scroll callback
  filePath?: string; // Absolute file path of current markdown
}

const isDataOrRemoteUrl = (value?: string): boolean => {
  if (!value) return false;
  return /^(https?:|data:|blob:|file:)/i.test(value);
};

const isAbsoluteLocalPath = (value?: string): boolean => {
  if (!value) return false;
  return /^([a-zA-Z]:\\|\\\\|\/)/.test(value);
};

interface MarkdownImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  baseDir?: string;
}

const useImageResolverCache = () => {
  const cacheRef = useRef(new Map<string, string>());
  const inflightRef = useRef(new Map<string, Promise<string>>());

  const resolve = useCallback((key: string, loader: () => Promise<string>): Promise<string> => {
    const cache = cacheRef.current;
    if (cache.has(key)) {
      return Promise.resolve(cache.get(key)!);
    }

    const inflight = inflightRef.current;
    if (inflight.has(key)) {
      return inflight.get(key)!;
    }

    const promise = loader()
      .then((result) => {
        cache.set(key, result);
        return result;
      })
      .finally(() => {
        inflight.delete(key);
      });

    inflight.set(key, promise);
    return promise;
  }, []);

  return resolve;
};

const MarkdownImage: React.FC<MarkdownImageProps> = ({ src, alt, baseDir, ...props }) => {
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);
  const resolveImage = useImageResolverCache();

  useEffect(() => {
    let cancelled = false;

    const loadImage = () => {
      if (!src) {
        setResolvedSrc(undefined);
        return;
      }

      if (isDataOrRemoteUrl(src)) {
        if (/^https?:/i.test(src)) {
          resolveImage(src, () => ipcBridge.fs.fetchRemoteImage.invoke({ url: src }))
            .then((dataUrl) => {
              if (!cancelled) {
                setResolvedSrc(dataUrl);
              }
            })
            .catch((error) => {
              console.error('[MarkdownPreview] Failed to fetch remote image:', src, error);
              if (!cancelled) {
                setResolvedSrc(src);
              }
            });
          return;
        }
        setResolvedSrc(src);
        return;
      }

      const normalizedBase = baseDir ? baseDir.replace(/\\/g, '/') : undefined;
      const cleanedSrc = src.replace(/\\/g, '/');
      const absolutePath = isAbsoluteLocalPath(cleanedSrc)
        ? cleanedSrc
        : normalizedBase
          ? joinPath(normalizedBase, cleanedSrc)
          : cleanedSrc;

      if (!absolutePath) {
        setResolvedSrc(src);
        return;
      }

      resolveImage(absolutePath, () => ipcBridge.fs.getImageBase64.invoke({ path: absolutePath }))
        .then((dataUrl) => {
          if (!cancelled) {
            setResolvedSrc(dataUrl);
          }
        })
        .catch((error) => {
          console.error('[MarkdownPreview] Failed to load local image:', { src, absolutePath, error });
          if (!cancelled) {
            setResolvedSrc(src);
          }
        });
    };

    loadImage();

    return () => {
      cancelled = true;
    };
  }, [src, baseDir]);

  if (!resolvedSrc) {
    return alt ? <span>{alt}</span> : null;
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy='no-referrer'
      crossOrigin='anonymous'
      style={{ maxWidth: '100%', width: 'auto', height: 'auto', display: 'block', objectFit: 'contain' }}
      {...props}
    />
  );
};

const encodeHtmlAttribute = (value: string) => value.replace(/&(?!#?[a-z0-9]+;)/gi, '&amp;');

const rewriteExternalMediaUrls = (markdown: string): string => {
  const githubWikiRegex = /https:\/\/github\.com\/([^/]+)\/([^/]+)\/wiki\/([^\s)"'>]+)/gi;
  const rewriteWiki = markdown.replace(githubWikiRegex, (_match, owner, repo, rest) => {
    return `https://raw.githubusercontent.com/wiki/${owner}/${repo}/${rest}`;
  });
  return rewriteWiki.replace(/<(img|a)\b[^>]*>/gi, (tag) => {
    return tag.replace(/(src|href)\s*=\s*(["'])([^"']*)(\2)/gi, (match, attr, quote, value, closingQuote) => {
      return `${attr}=${quote}${encodeHtmlAttribute(value)}${closingQuote}`;
    });
  });
};

/**
 * Markdown preview component
 *
 * Uses ReactMarkdown to render Markdown, supports source/preview toggle and download
 */
// This line has many props; keep it single-line for Prettier and silence max-len warning explicitly
// eslint-disable-next-line max-len
const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  onClose,
  hideToolbar = false,
  viewMode: externalViewMode,
  onViewModeChange,
  onContentChange,
  containerRef: externalContainerRef,
  onScroll: externalOnScroll,
  filePath,
}) => {
  const { t } = useTranslation();
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef || internalContainerRef; // Use external ref or internal ref
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
  });

  // Use scroll sync hooks
  useContainerScroll(containerRef, externalOnScroll);
  useContainerScrollTarget(containerRef);

  const [internalViewMode, setInternalViewMode] = useState<'source' | 'preview'>('preview'); // Internal view mode

  // Use external viewMode if provided, otherwise use internal state
  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;

  // Use typing animation Hook
  const previewSource = useMemo(() => convertLatexDelimiters(rewriteExternalMediaUrls(content)), [content]);

  const { displayedContent, isAnimating } = useTypingAnimation({
    content: previewSource,
    enabled: viewMode === 'preview', // Only enable in preview mode
    speed: 50, // 50 characters per second
  });

  // Use auto-scroll Hook
  useAutoScroll({
    containerRef,
    content,
    enabled: viewMode === 'preview', // Only enable in preview mode
    threshold: 200, // Follow when within 200px from bottom
  });

  // Monitor theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const theme = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
          setCurrentTheme(theme);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Monitor text selection
  const { selectedText, selectionPosition, clearSelection } = useTextSelection(containerRef);

  // Download Markdown file
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `markdown-${Date.now()}.md`;
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

  const baseDir = useMemo(() => {
    if (!filePath) return undefined;
    const normalized = filePath.replace(/\\/g, '/');
    const lastSlash = normalized.lastIndexOf('/');
    if (lastSlash === -1) return undefined;
    return normalized.slice(0, lastSlash);
  }, [filePath]);

  useEffect(() => {
    if (viewMode !== 'preview') return;
    const container = containerRef.current;
    if (!container) return;

    const seen = new WeakSet<HTMLImageElement>();

    const resolveLocalImage = (img: HTMLImageElement) => {
      if (!img || seen.has(img)) return;
      const rawAttr = img.getAttribute('src') || '';
      if (!rawAttr || isDataOrRemoteUrl(rawAttr)) {
        seen.add(img);
        return;
      }

      const normalizedBase = baseDir ? baseDir.replace(/\\/g, '/') : undefined;
      const cleanedSrc = rawAttr.replace(/\\/g, '/');
      const absolutePath = isAbsoluteLocalPath(cleanedSrc)
        ? cleanedSrc
        : normalizedBase
          ? joinPath(normalizedBase, cleanedSrc)
          : undefined;
      if (!absolutePath) {
        seen.add(img);
        return;
      }

      void ipcBridge.fs.getImageBase64
        .invoke({ path: absolutePath })
        .then((dataUrl) => {
          img.src = dataUrl;
        })
        .catch((error) => {
          console.error('[MarkdownPreview] Failed to inline rendered image:', { rawAttr, absolutePath, error });
        })
        .finally(() => {
          seen.add(img);
        });
    };

    const scanImages = () => {
      const images = container.querySelectorAll('img');
      images.forEach((img) => {
        resolveLocalImage(img as HTMLImageElement);
      });
    };

    scanImages();

    const observer = new MutationObserver(() => {
      scanImages();
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [baseDir, containerRef, viewMode, displayedContent]);

  return (
    <div className='flex flex-col w-full h-full overflow-hidden'>
      {/* Toolbar: Tabs toggle + Download button */}
      {!hideToolbar && (
        <div className='flex items-center justify-between h-40px px-12px bg-bg-2 flex-shrink-0 border-b border-border-1 overflow-x-auto'>
          <div className='flex items-center justify-between gap-12px w-full' style={{ minWidth: 'max-content' }}>
            {/* Left: Source/Preview Tabs */}
            <div className='flex items-center h-full gap-2px'>
              {/* Preview Tab */}
              <div
                className={`
                  flex items-center h-full px-16px cursor-pointer transition-all text-14px font-medium
                  ${viewMode === 'preview' ? 'text-primary border-b-2 border-primary' : 'text-t-secondary hover:text-t-primary hover:bg-bg-3'}
                `}
                onClick={() => handleViewModeChange('preview')}
              >
                {t('preview.preview')}
              </div>
              {/* Source Tab */}
              <div
                className={`
                  flex items-center h-full px-16px cursor-pointer transition-all text-14px font-medium
                  ${viewMode === 'source' ? 'text-primary border-b-2 border-primary' : 'text-t-secondary hover:text-t-primary hover:bg-bg-3'}
                `}
                onClick={() => handleViewModeChange('source')}
              >
                {t('preview.source')}
              </div>
            </div>

            {/* Right button group: Download + Close */}
            <div className='flex items-center gap-8px flex-shrink-0'>
              {/* Download button */}
              <div
                className='flex items-center gap-4px px-8px py-4px rd-4px cursor-pointer hover:bg-bg-3 transition-colors'
                onClick={handleDownload}
                title={t('preview.downloadMarkdown')}
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
        </div>
      )}

      {/* Content area */}
      <div
        ref={containerRef}
        className={`flex-1 ${viewMode === 'source' ? 'overflow-hidden' : 'overflow-auto p-32px text-t-primary'}`}
        style={{ minWidth: 0 }}
      >
        {viewMode === 'source' ? (
          // Source mode: Use editor
          <MarkdownEditor value={content} onChange={(value) => onContentChange?.(value)} />
        ) : (
          // Preview mode: Render Markdown
          <div
            style={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
            }}
          >
            <Streamdown
              // Core feature: parse incomplete Markdown for optimal streaming
              parseIncompleteMarkdown={true}
              // Enable animation when typing
              isAnimating={isAnimating}
              remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
              rehypePlugins={[rehypeRaw, rehypeKatex]}
              components={{
                img({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
                  return <MarkdownImage src={src} alt={alt} baseDir={baseDir} {...props} />;
                },
                table({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
                  return (
                    <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
                      <table {...props}>{children}</table>
                    </div>
                  );
                },
                pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
                  return (
                    <pre style={{ maxWidth: '100%', overflowX: 'auto' }} {...props}>
                      {children}
                    </pre>
                  );
                },
                code({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeContent = String(children).replace(/\n$/, '');
                  const language = match ? match[1] : '';
                  const codeTheme = currentTheme === 'dark' ? vs2015 : vs;

                  // Render latex/math code blocks as KaTeX display math
                  // Skip full LaTeX documents (with \documentclass, \begin{document}, etc.) - KaTeX only handles math
                  if (language === 'latex' || language === 'math' || language === 'tex') {
                    const isFullDocument = /\\(documentclass|begin\{document\}|usepackage)\b/.test(codeContent);
                    if (!isFullDocument) {
                      try {
                        const html = katex.renderToString(codeContent, {
                          displayMode: true,
                          throwOnError: false,
                        });
                        return <div className='katex-display' dangerouslySetInnerHTML={{ __html: sanitizeMath(html) }} />;
                      } catch {
                        // Fall through to render as code block if KaTeX fails
                      }
                    }
                  }

                  if (language === 'mermaid') {
                    return <MermaidBlock code={codeContent} showOpenInPanelButton={false} />;
                  }

                  // Code highlighting
                  return language ? (
                    <SyntaxHighlighter
                      // @ts-expect-error - type definition issue for style prop
                      style={codeTheme}
                      language={language}
                      PreTag='div'
                      customStyle={{
                        margin: 0,
                        borderRadius: '8px',
                        padding: '16px',
                        fontSize: '14px',
                        maxWidth: '100%',
                        overflow: 'auto',
                      }}
                      {...props}
                    >
                      {codeContent}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {displayedContent}
            </Streamdown>
          </div>
        )}
      </div>

      {/* Text selection floating toolbar */}
      {selectedText && (
        <SelectionToolbar selectedText={selectedText} position={selectionPosition} onClear={clearSelection} />
      )}
    </div>
  );
};

export default MarkdownPreview;
