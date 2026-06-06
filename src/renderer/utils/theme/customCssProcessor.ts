/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Custom CSS processing utility
 * Centralizes adding !important and formatting custom CSS
 */

/**
 * Automatically append !important to every CSS property
 * @param css - Raw CSS string
 * @returns Processed CSS string (every property has !important)
 */
export const addImportantToAll = (css: string): string => {
  if (!css || !css.trim()) {
    return '';
  }

  return css.replace(/([a-zA-Z-]+)\s*:\s*([^;!}]+);/g, (match, property, value) => {
    const trimmedValue = value.trim();
    // If !important is already present, do not append again
    if (trimmedValue.endsWith('!important')) {
      return match;
    }
    // Append !important
    return `${property}: ${trimmedValue} !important;`;
  });
};

/**
 * Wrap custom CSS with explanatory comments
 * @param css - Processed CSS string
 * @returns CSS string with comments
 */
export const wrapCustomCss = (css: string): string => {
  if (!css || !css.trim()) {
    return '';
  }

  return `
/* User custom styles - !important added automatically for highest specificity */
${css}
  `.trim();
};

/**
 * Full pipeline: process and wrap custom CSS
 * @param css - Raw CSS string
 * @returns Processed and wrapped CSS string
 */
export const processCustomCss = (css: string): string => {
  const processed = addImportantToAll(css);
  return wrapCustomCss(processed);
};

/**
 * Validate CSS syntax (lightweight check)
 * @param css - CSS string
 * @returns Whether the CSS is valid
 */
export const validateCss = (css: string): { valid: boolean; error?: string } => {
  if (!css || !css.trim()) {
    return { valid: true };
  }

  try {
    // Simple check: brace pairs balance
    const openBraces = (css.match(/\{/g) || []).length;
    const closeBraces = (css.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      return {
        valid: false,
        error: 'Unmatched braces: { and } count does not match',
      };
    }

    // Check for the basic CSS structure
    if (openBraces > 0 && !css.includes(':')) {
      return {
        valid: false,
        error: 'Invalid CSS: no property declarations found',
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
