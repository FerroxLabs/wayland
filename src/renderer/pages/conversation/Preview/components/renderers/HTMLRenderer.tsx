/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { useTypingAnimation } from '@/renderer/hooks/chat/useTypingAnimation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useScrollSyncTarget } from '../../hooks/useScrollSyncHelpers';
import { generateInspectScript } from './htmlInspectScript';

/** Selected element data structure */
export interface InspectedElement {
  /** Full HTML */
  html: string;
  /** Simplified tag name */
  tag: string;
}

interface HTMLRendererProps {
  content: string;
  filePath?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  inspectMode?: boolean; // Whether inspect mode is enabled
  copySuccessMessage?: string;
  /** Element selected callback */
  onElementSelected?: (element: InspectedElement) => void;
}

// Type definition for Electron webview element
interface ElectronWebView extends HTMLElement {
  src: string;
  executeJavaScript: (code: string) => Promise<void>;
}

/**
 * Normalize a filesystem path for containment comparison:
 *  - strip `file://` prefix
 *  - collapse backslashes to forward slashes
 *  - collapse repeated slashes
 *  - drop trailing slash (except root)
 */
function normalizeForContainment(p: string): string {
  let s = p.replace(/^file:\/\//, '').replace(/\\/g, '/');
  s = s.replace(/\/+/g, '/');
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
  return s;
}

/**
 * Returns true iff `candidate` is the same as, or contained within, `baseDir`.
 * Both inputs are expected to be absolute (or `file://`-prefixed). Uses
 * prefix matching on normalized, slash-segmented paths so `/foo/bar` does
 * NOT match `/foo/bar2`.
 *
 * Case-insensitive compare across the whole path - the safer default for a
 * renderer that doesn't know the host filesystem's case-sensitivity. Linux
 * case-sensitivity is intentionally traded away here; the worst case is a
 * stricter, not laxer, check.
 */
function isContained(baseDir: string, candidate: string): boolean {
  const base = normalizeForContainment(baseDir);
  const cand = normalizeForContainment(candidate);
  if (!base || !cand) return false;
  // Defense in depth: reject unresolved traversal segments.
  if (cand.split('/').includes('..')) return false;
  const baseLc = base.toLowerCase();
  const candLc = cand.toLowerCase();
  if (candLc === baseLc) return true;
  const prefix = baseLc.endsWith('/') ? baseLc : baseLc + '/';
  return candLc.startsWith(prefix);
}

/**
 * Extract the directory of the given HTML file path. Strips any `file://`
 * prefix and trailing slash so the result is a directory path suitable for
 * use as a containment boundary.
 */
function htmlBaseDir(htmlFilePath: string): string {
  const clean = htmlFilePath.replace(/^file:\/\//, '');
  const lastFwd = clean.lastIndexOf('/');
  const lastBwd = clean.lastIndexOf('\\');
  const cut = Math.max(lastFwd, lastBwd);
  if (cut < 0) return clean;
  return clean.substring(0, cut);
}

/**
 * Allowlist of image MIME types accepted by the inliner. Other extensions
 * are rejected outright rather than falling back to application/octet-stream
 * (which would let an HTML file inline arbitrary non-image bytes as <img src>).
 *
 * NOTE: SVG is allowed but is itself an active-content format - sanitization
 * before inlining is a separate follow-up item.
 */
const ALLOWED_IMAGE_MIME = new Set<string>([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

function isAllowedImagePath(p: string): boolean {
  const m = /\.([a-zA-Z0-9]+)(?:\?|#|$)/.exec(p);
  if (!m) return false;
  const ext = m[1].toLowerCase();
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };
  const mime = map[ext];
  return Boolean(mime && ALLOWED_IMAGE_MIME.has(mime));
}

/**
 * Resolve relative path to absolute path
 * @param basePath Base file path
 * @param relativePath Relative path
 * @returns Absolute path
 */
function resolveRelativePath(basePath: string, relativePath: string): string {
  // Remove protocol prefix
  const cleanBasePath = basePath.replace(/^file:\/\//, '');
  const baseDir =
    cleanBasePath.substring(0, cleanBasePath.lastIndexOf('/') + 1) ||
    cleanBasePath.substring(0, cleanBasePath.lastIndexOf('\\') + 1);

  // If relative path is already absolute, return directly
  if (relativePath.startsWith('/') || /^[a-zA-Z]:/.test(relativePath)) {
    return relativePath;
  }

  // Handle ./ and ../
  const parts = baseDir.replace(/\\/g, '/').split('/').filter(Boolean);
  const relParts = relativePath.replace(/\\/g, '/').split('/');

  for (const part of relParts) {
    if (part === '..') {
      parts.pop();
    } else if (part !== '.') {
      parts.push(part);
    }
  }

  // Preserve Windows drive letter format
  if (/^[a-zA-Z]:/.test(baseDir)) {
    return parts.join('/');
  }
  return '/' + parts.join('/');
}

/**
 * Inline relative resources in HTML (for browser iframe)
 *
 * - img src -> base64 data URL
 * - link href (CSS) -> inline <style> tag
 * - script src -> inline <script> tag
 *
 * @param html HTML content
 * @param basePath Base file path
 * @returns Processed HTML
 */
async function inlineRelativeResources(html: string, basePath: string): Promise<string> {
  let result = html;

  // Containment boundary: the HTML file's own directory. A malicious HTML
  // file can construct paths like `../../../../etc/passwd`; resolving such
  // a path with `resolveRelativePath` would leave the boundary, so we
  // reject anything not contained inside `baseDir` here in the renderer
  // before invoking any privileged file-read bridge (M7).
  //
  // We deliberately do NOT widen the boundary to the workspace root: the
  // renderer doesn't currently carry that context for previews, and a
  // stricter-than-needed boundary is the safer default. If a future preview
  // legitimately needs sibling-directory resources, plumb the workspace
  // root in and widen `boundary` then.
  const boundary = htmlBaseDir(basePath);

  const tryResolveContained = (relativePath: string, sourceBase: string): string | null => {
    // Reject absolute paths and Windows drive-rooted paths outright. Relative
    // inlining must stay inside the HTML's directory; absolute references
    // bypass the boundary entirely.
    if (relativePath.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(relativePath)) {
      return null;
    }
    // `resolveRelativePath` collapses `..` segments; the containment check
    // below is the actual guard. We allow `..` in the input string because
    // legitimate relative paths like `./assets/../assets/foo.png` exist and
    // still land inside the boundary.
    const absolute = resolveRelativePath(sourceBase, relativePath);
    if (!isContained(boundary, absolute)) {
      return null;
    }
    return absolute;
  };

  // 1. Handle <img src="relative"> -> base64
  const imgRegex = /<img([^>]*)\ssrc=["'](?!https?:\/\/|data:|\/\/)([^"']+)["']([^>]*)>/gi;
  const imgMatches = [...result.matchAll(imgRegex)];

  for (const match of imgMatches) {
    const [fullMatch, before, src, after] = match;
    try {
      const absolutePath = tryResolveContained(src, basePath);
      if (!absolutePath) {
        console.warn('[HTMLRenderer] Rejected out-of-boundary image src:', src);
        continue;
      }
      // MIME allowlist: only accept known image extensions. Unknown
      // extensions are rejected so a hostile HTML cannot smuggle non-image
      // bytes through <img src> via the fsBridge octet-stream fallback (M7).
      if (!isAllowedImagePath(absolutePath)) {
        console.warn('[HTMLRenderer] Rejected non-allowlisted image extension:', src);
        continue;
      }
      const dataUrl = await ipcBridge.fs.getImageBase64.invoke({ path: absolutePath });
      if (dataUrl) {
        // getImageBase64 already returns complete data URL
        const newTag = `<img${before} src="${dataUrl}"${after}>`;
        result = result.replace(fullMatch, newTag);
      }
    } catch (e) {
      console.warn('[HTMLRenderer] Failed to inline image:', src, e);
    }
  }

  // 2. Handle CSS links -> inline <style>
  const linkRegex = /<link([^>]*)\shref=["'](?!https?:\/\/|data:|\/\/)([^"']+)["']([^>]*)>/gi;
  const linkMatches = [...result.matchAll(linkRegex)];

  for (const match of linkMatches) {
    const [fullMatch, _before, href, _after] = match;
    // Check if it's a stylesheet
    const isStylesheet = /rel=["']stylesheet["']/i.test(fullMatch) || href.endsWith('.css');
    if (isStylesheet) {
      try {
        const absolutePath = tryResolveContained(href, basePath);
        if (!absolutePath) {
          console.warn('[HTMLRenderer] Rejected out-of-boundary CSS href:', href);
          continue;
        }
        const cssContent = await ipcBridge.fs.readFile.invoke({ path: absolutePath });
        if (cssContent) {
          // Replace relative url() references in CSS with base64
          let processedCss = cssContent;
          const cssUrlRegex = /url\(["']?(?!https?:\/\/|data:|\/\/)([^"')]+)["']?\)/gi;
          const cssUrlMatches = [...processedCss.matchAll(cssUrlRegex)];

          for (const urlMatch of cssUrlMatches) {
            const [urlFullMatch, urlPath] = urlMatch;
            try {
              // Base path for CSS file
              const cssBasePath = absolutePath;
              const resourcePath = tryResolveContained(urlPath, cssBasePath);
              if (!resourcePath) {
                console.warn('[HTMLRenderer] Rejected out-of-boundary CSS url():', urlPath);
                continue;
              }
              if (!isAllowedImagePath(resourcePath)) {
                console.warn('[HTMLRenderer] Rejected non-allowlisted CSS url() extension:', urlPath);
                continue;
              }
              const dataUrl = await ipcBridge.fs.getImageBase64.invoke({ path: resourcePath });
              if (dataUrl) {
                // getImageBase64 already returns complete data URL
                processedCss = processedCss.replace(urlFullMatch, `url("${dataUrl}")`);
              }
            } catch (e) {
              console.warn('[HTMLRenderer] Failed to inline CSS resource:', urlPath, e);
            }
          }

          const styleTag = `<style>${processedCss}</style>`;
          result = result.replace(fullMatch, styleTag);
        }
      } catch (e) {
        console.warn('[HTMLRenderer] Failed to inline CSS:', href, e);
      }
    }
  }

  // 3. Handle script tags -> inline
  const scriptRegex = /<script([^>]*)\ssrc=["'](?!https?:\/\/|data:|\/\/)([^"']+)["']([^>]*)><\/script>/gi;
  const scriptMatches = [...result.matchAll(scriptRegex)];

  for (const match of scriptMatches) {
    const [fullMatch, before, src, after] = match;
    try {
      const absolutePath = tryResolveContained(src, basePath);
      if (!absolutePath) {
        console.warn('[HTMLRenderer] Rejected out-of-boundary script src:', src);
        continue;
      }
      const scriptContent = await ipcBridge.fs.readFile.invoke({ path: absolutePath });
      if (scriptContent) {
        // Keep other attributes (like type, but defer/async don't work for inline)
        const attrsToKeep = (before + after).replace(/\s*(defer|async)\s*/gi, '');
        const scriptTag = `<script${attrsToKeep}>${scriptContent}</script>`;
        result = result.replace(fullMatch, scriptTag);
      }
    } catch (e) {
      console.warn('[HTMLRenderer] Failed to inline script:', src, e);
    }
  }

  return result;
}

/**
 * HTML renderer component
 *
 * Renders HTML content in iframe/webview (auto-detect environment)
 */
const HTMLRenderer: React.FC<HTMLRendererProps> = ({
  content,
  filePath,
  containerRef,
  onScroll,
  inspectMode = false,
  copySuccessMessage,
  onElementSelected,
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const webviewRef = useRef<ElectronWebView | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const webviewLoadedRef = useRef(false); // Track if webview is loaded
  const isSyncingScrollRef = useRef(false); // Prevent scroll sync loops
  const [webviewContentHeight, setWebviewContentHeight] = useState(0); // webview content height
  const [inlinedHtmlContent, setInlinedHtmlContent] = useState<string>(''); // Inlined HTML (for browser iframe)
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
  });

  // Detect if in Electron environment
  const isElectron = useMemo(() => typeof window !== 'undefined' && window.electronAPI !== undefined, []);

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

  // Determine if should load directly from file (supports relative resources) - Electron only
  const shouldLoadFromFile = useMemo(() => {
    if (!isElectron || !filePath) return false;
    // Check if HTML references relative resources
    const hasRelativeResources =
      /<link[^>]+href=["'](?!https?:\/\/|data:|\/\/)[^"']+["']/i.test(content) ||
      /<script[^>]+src=["'](?!https?:\/\/|data:|\/\/)[^"']+["']/i.test(content) ||
      /<img[^>]+src=["'](?!https?:\/\/|data:|\/\/)[^"']+["']/i.test(content);
    return hasRelativeResources;
  }, [content, filePath, isElectron]);

  // Check if has relative resources (for browser inline processing)
  const hasRelativeResources = useMemo(() => {
    return (
      /<link[^>]+href=["'](?!https?:\/\/|data:|\/\/)[^"']+["']/i.test(content) ||
      /<script[^>]+src=["'](?!https?:\/\/|data:|\/\/)[^"']+["']/i.test(content) ||
      /<img[^>]+src=["'](?!https?:\/\/|data:|\/\/)[^"']+["']/i.test(content)
    );
  }, [content]);

  // Typing animation: provide streaming experience when rendering via data URL
  const { displayedContent } = useTypingAnimation({
    content,
    enabled: !shouldLoadFromFile && !hasRelativeResources,
    speed: 40,
  });

  const htmlContent = useMemo(
    () => (shouldLoadFromFile ? content : displayedContent),
    [shouldLoadFromFile, content, displayedContent]
  );

  // In browser environment, inline relative resources when present
  useEffect(() => {
    if (isElectron) {
      // Electron environment doesn't need inlining, uses webview loading
      return;
    }

    if (!hasRelativeResources || !filePath) {
      // No relative resources or no file path, use original content
      setInlinedHtmlContent(content);
      return;
    }

    // Browser environment with relative resources, perform inlining
    let cancelled = false;
    inlineRelativeResources(content, filePath)
      .then((inlined) => {
        if (!cancelled) {
          setInlinedHtmlContent(inlined);
        }
      })
      .catch((e) => {
        console.warn('[HTMLRenderer] Failed to inline resources:', e);
        if (!cancelled) {
          setInlinedHtmlContent(content); // Fallback to original content
        }
      });

    return () => {
      cancelled = true;
    };
  }, [content, filePath, isElectron, hasRelativeResources]);

  // Final HTML content for browser iframe
  const browserHtmlContent = useMemo(() => {
    if (hasRelativeResources && filePath) {
      return inlinedHtmlContent || content; // Show original content before inlining completes
    }
    return displayedContent;
  }, [hasRelativeResources, filePath, inlinedHtmlContent, content, displayedContent]);

  // Render the browser-fallback iframe via a Blob URL so the iframe has an
  // opaque origin. This lets us drop `allow-same-origin` from the sandbox,
  // which would otherwise let untrusted preview HTML execute as the app
  // origin (H2). Revoke the URL on unmount/content change to avoid leaks.
  const browserBlobUrl = useMemo(() => {
    if (isElectron) return '';
    if (typeof window === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') return '';
    const blob = new Blob([browserHtmlContent ?? ''], { type: 'text/html;charset=utf-8' });
    return URL.createObjectURL(blob);
  }, [browserHtmlContent, isElectron]);

  useEffect(() => {
    if (!browserBlobUrl) return;
    return () => {
      URL.revokeObjectURL(browserBlobUrl);
    };
  }, [browserBlobUrl]);

  // Calculate webview src
  const webviewSrc = useMemo(() => {
    // If has relative resource references and has file path, load directly via file:// URL
    if (shouldLoadFromFile && filePath) {
      return `file://${filePath}`;
    }

    // Otherwise use data URL (for dynamically generated HTML or no external resources)
    let html = htmlContent;

    // Inject base tag for relative paths
    if (filePath) {
      const fileDir = filePath.substring(0, filePath.lastIndexOf('/') + 1);
      const baseUrl = `file://${fileDir}`;

      // Check if base tag exists
      if (!html.match(/<base\s+href=/i)) {
        if (html.match(/<head>/i)) {
          html = html.replace(/<head>/i, `<head><base href="${baseUrl}">`);
        } else if (html.match(/<html>/i)) {
          html = html.replace(/<html>/i, `<html><head><base href="${baseUrl}"></head>`);
        } else {
          html = `<head><base href="${baseUrl}"></head>${html}`;
        }
      }
    }

    const encoded = encodeURIComponent(html);
    return `data:text/html;charset=utf-8,${encoded}`;
  }, [htmlContent, filePath, shouldLoadFromFile]);

  // Reset loading state when webviewSrc changes
  useEffect(() => {
    webviewLoadedRef.current = false;
  }, [webviewSrc]);

  // Listen for webview load completion
  // Depend on webviewSrc to ensure listeners are re-added when webview remounts
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleDidFinishLoad = () => {
      webviewLoadedRef.current = true; // Mark as loaded
    };

    const handleDidFailLoad = (_event: Event) => {
      // Handle webview load failure
    };

    webview.addEventListener('did-finish-load', handleDidFinishLoad);
    webview.addEventListener('did-fail-load', handleDidFailLoad);

    return () => {
      webview.removeEventListener('did-finish-load', handleDidFinishLoad);
      webview.removeEventListener('did-fail-load', handleDidFailLoad);
    };
  }, [webviewSrc]);

  // Generate inspect mode injection script
  // Use useMemo to cache, only regenerate when inspectMode changes
  const copySuccessText = useMemo(() => copySuccessMessage ?? '✓ Copied HTML snippet', [copySuccessMessage]);
  const inspectScript = useMemo(
    () => generateInspectScript(inspectMode, { copySuccess: copySuccessText }),
    [inspectMode, copySuccessText]
  );

  // Function to execute script injection
  // Use useCallback to cache, avoid creating new function on each render
  const executeScript = useCallback(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    // executeJavaScript returns Promise, need to handle it
    void webview
      .executeJavaScript(inspectScript)
      .then(() => {
        // Script injected successfully
      })
      .catch((_error) => {
        // Failed to inject inspect script
      });
  }, [inspectScript, inspectMode]);

  // Inject inspect mode script
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    // If webview is already loaded, execute script immediately
    if (webviewLoadedRef.current) {
      executeScript();
    }

    // Also listen for future page loads
    const handleLoad = () => {
      executeScript();
    };

    webview.addEventListener('did-finish-load', handleLoad);

    return () => {
      webview.removeEventListener('did-finish-load', handleLoad);
    };
  }, [executeScript]);

  // Listen for webview console messages to capture inspect element events and scroll events
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleConsoleMessage = (event: Event) => {
      const consoleEvent = event as Event & { message?: string };
      const message = consoleEvent.message;

      if (typeof message === 'string') {
        // Handle inspect element message
        if (message.startsWith('__INSPECT_ELEMENT__') && onElementSelected) {
          try {
            const jsonStr = message.slice('__INSPECT_ELEMENT__'.length);
            const data = JSON.parse(jsonStr) as InspectedElement;
            onElementSelected(data);
          } catch (e) {
            console.warn('[HTMLRenderer] Failed to parse inspect element message:', e);
          }
        }
        // Handle scroll message
        else if (message.startsWith('__SCROLL_SYNC__') && onScroll) {
          if (isSyncingScrollRef.current) return; // Prevent loop
          try {
            const jsonStr = message.slice('__SCROLL_SYNC__'.length);
            const data = JSON.parse(jsonStr) as { scrollTop: number; scrollHeight: number; clientHeight: number };
            onScroll(data.scrollTop, data.scrollHeight, data.clientHeight);
          } catch (e) {
            console.warn('[HTMLRenderer] Failed to parse scroll message:', e);
          }
        }
        // Handle content height message
        else if (message.startsWith('__CONTENT_HEIGHT__')) {
          try {
            const height = parseInt(message.slice('__CONTENT_HEIGHT__'.length), 10);
            if (!isNaN(height) && height > 0) {
              setWebviewContentHeight(height);
            }
          } catch (e) {
            console.warn('[HTMLRenderer] Failed to parse content height message:', e);
          }
        }
      }
    };

    webview.addEventListener('console-message', handleConsoleMessage);

    return () => {
      webview.removeEventListener('console-message', handleConsoleMessage);
    };
  }, [onElementSelected, onScroll]);

  // Inject scroll listener script
  const scrollSyncScript = useMemo(
    () => `
    (function() {
      if (window.__scrollSyncInitialized) return;
      window.__scrollSyncInitialized = true;

      // Send content height
      function sendContentHeight() {
        const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
        console.log('__CONTENT_HEIGHT__' + scrollHeight);
      }

      // Initial send
      sendContentHeight();

      // Listen for content changes
      const resizeObserver = new ResizeObserver(sendContentHeight);
      resizeObserver.observe(document.body);

      let scrollTimeout;
      window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
          const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
          const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
          const clientHeight = window.innerHeight || document.documentElement.clientHeight;
          console.log('__SCROLL_SYNC__' + JSON.stringify({ scrollTop, scrollHeight, clientHeight }));
        }, 16); // ~60fps throttle
      }, { passive: true });
    })();
  `,
    []
  );

  // Inject scroll sync script
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview || !onScroll) return;

    const injectScrollSync = () => {
      void webview
        .executeJavaScript(scrollSyncScript)
        .catch((err) => console.warn('[HTMLRenderer.injectScrollSync]', err));
    };

    if (webviewLoadedRef.current) {
      injectScrollSync();
    }

    webview.addEventListener('did-finish-load', injectScrollSync);

    return () => {
      webview.removeEventListener('did-finish-load', injectScrollSync);
    };
  }, [scrollSyncScript, onScroll]);

  // Listen for external scroll sync requests
  const handleTargetScroll = useCallback((targetPercent: number) => {
    const webview = webviewRef.current;
    if (!webview || !webviewLoadedRef.current) return;

    void webview
      .executeJavaScript(
        `
          (function() {
            const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
            const clientHeight = window.innerHeight || document.documentElement.clientHeight;
            const targetScroll = ${targetPercent} * (scrollHeight - clientHeight);
            window.scrollTo({ top: targetScroll, behavior: 'auto' });
          })();
        `
      )
      // intentional fire-and-forget; per-event scroll sync, failure is non-actionable
      .catch(() => {});
  }, []);
  // Use external containerRef or internal divRef
  const effectiveContainerRef = containerRef || divRef;
  useScrollSyncTarget(effectiveContainerRef, handleTargetScroll);

  // Listen to container scroll, sync to webview
  useEffect(() => {
    const container = containerRef?.current || divRef.current;
    if (!container) return;

    const handleContainerScroll = () => {
      if (isSyncingScrollRef.current) return;

      const webview = webviewRef.current;
      if (!webview || !webviewLoadedRef.current) return;

      isSyncingScrollRef.current = true;
      const scrollPercentage = container.scrollTop / (container.scrollHeight - container.clientHeight || 1);

      void webview
        .executeJavaScript(
          `
          (function() {
            const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
            const clientHeight = window.innerHeight || document.documentElement.clientHeight;
            const targetScroll = ${scrollPercentage} * (scrollHeight - clientHeight);
            window.scrollTo({ top: targetScroll, behavior: 'auto' });
          })();
        `
        )
        // intentional fire-and-forget; per-event scroll sync, failure is non-actionable
        .catch(() => {})
        .finally(() => {
          setTimeout(() => {
            isSyncingScrollRef.current = false;
          }, 50);
        });
    };

    container.addEventListener('scroll', handleContainerScroll);
    return () => container.removeEventListener('scroll', handleContainerScroll);
  }, [containerRef]);

  // Calculate proxy scroll layer height
  const proxyHeight = webviewContentHeight > 0 ? webviewContentHeight : '100%';

  return (
    <div
      ref={containerRef || divRef}
      className={`h-full w-full overflow-auto relative ${currentTheme === 'dark' ? 'bg-bg-1' : 'bg-white'}`}
    >
      {isElectron ? (
        <>
          {/* Proxy scroll layer: makes container scrollable */}
          <div style={{ height: proxyHeight, width: '100%', pointerEvents: 'none' }} />
          {/* webview fixed at container top */}
          {/* key ensures webview remounts when content changes */}
          <webview
            key={webviewSrc}
            ref={webviewRef}
            src={webviewSrc}
            className='w-full border-0'
            style={{
              display: 'inline-flex',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              height: '100%',
            }}
            webpreferences='javascript=yes, contextIsolation=yes, sandbox=yes'
          />
        </>
      ) : (
        <iframe
          ref={iframeRef}
          src={browserBlobUrl}
          className='w-full h-full border-0'
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
          // Blob URL gives the iframe an opaque origin, so `allow-same-origin`
          // is intentionally dropped. `allow-popups`/`allow-modals` removed as
          // well - preview HTML has no documented need for them.
          sandbox='allow-scripts allow-forms'
        />
      )}
    </div>
  );
};

export default HTMLRenderer;
