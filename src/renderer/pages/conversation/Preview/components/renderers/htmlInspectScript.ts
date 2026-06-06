/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

interface InspectMessages {
  copySuccess: string;
}

const DEFAULT_MESSAGES: InspectMessages = {
  copySuccess: '✓ Copied HTML snippet',
};

/**
 * Generate HTML inspect mode injection script
 *
 * @param inspectMode - Whether to enable inspect mode
 * @param messages - Custom prompt messages
 * @returns Injection script string
 */
export function generateInspectScript(inspectMode: boolean, messages: InspectMessages = DEFAULT_MESSAGES): string {
  const copySuccess = JSON.stringify(messages.copySuccess);
  return `
    (function() {

      // Remove old inspect mode styles and listeners
      const oldStyle = document.getElementById('inspect-mode-style');
      if (oldStyle) oldStyle.remove();

      const oldOverlay = document.getElementById('inspect-mode-overlay');
      if (oldOverlay) oldOverlay.remove();

      const oldMenu = document.getElementById('inspect-mode-menu');
      if (oldMenu) oldMenu.remove();

      // Remove old event listeners
      const oldListeners = window.__inspectModeListeners || {};
      if (oldListeners.mousemove) {
        document.removeEventListener('mousemove', oldListeners.mousemove);
      }
      if (oldListeners.click) {
        document.removeEventListener('click', oldListeners.click);
      }

      if (!${inspectMode}) {
        // If inspect mode is off, remove all related elements
        document.body.style.cursor = '';
        window.__inspectModeListeners = null;
        return;
      }

      // Add inspect mode styles
      const style = document.createElement('style');
      style.id = 'inspect-mode-style';
      style.textContent = \`
        .inspect-overlay {
          position: fixed;
          pointer-events: none;
          background: rgba(59, 130, 246, 0.1);
          border: 2px solid #3b82f6;
          z-index: 999999;
          transition: all 0.1s ease;
        }
      \`;
      document.head.appendChild(style);

      // Create highlight overlay
      const overlay = document.createElement('div');
      overlay.id = 'inspect-mode-overlay';
      overlay.className = 'inspect-overlay';
      overlay.style.display = 'none';
      document.body.appendChild(overlay);

      let currentElement = null;

      // Show notification
      const showNotification = (message) => {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = \`
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          font-size: 14px;
          z-index: 1000000;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        \`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
      };

      // Highlight element on mouse move
      const handleMouseMove = (e) => {
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (element && element !== currentElement && element !== overlay) {
          currentElement = element;
          const rect = element.getBoundingClientRect();
          overlay.style.display = 'block';
          overlay.style.left = rect.left + 'px';
          overlay.style.top = rect.top + 'px';
          overlay.style.width = rect.width + 'px';
          overlay.style.height = rect.height + 'px';
        }
      };

      // Get simplified tag name for display
      const getSimplifiedTag = (element) => {
        const tagName = element.tagName.toLowerCase();
        const id = element.id ? '#' + element.id : '';
        const className = element.className && typeof element.className === 'string'
          ? '.' + element.className.split(' ').filter(c => c).slice(0, 1).join('.')
          : '';
        return tagName + id + className;
      };

      // Click element to send HTML to parent window
      const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (element && element !== overlay) {
          const html = element.outerHTML;
          const tag = getSimplifiedTag(element);

          // Send message via console.log (webview will capture)
          console.log('__INSPECT_ELEMENT__' + JSON.stringify({ html: html, tag: tag }));

          // Show notification
          showNotification(${copySuccess});
        }
      };

      // Add event listeners
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleClick);

      // Save listener references for later removal
      window.__inspectModeListeners = {
        mousemove: handleMouseMove,
        click: handleClick
      };

      // Change cursor style
      document.body.style.cursor = 'crosshair';
    })();
  `;
}
