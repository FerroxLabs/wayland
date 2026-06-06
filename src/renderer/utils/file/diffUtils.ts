/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Parse file path from diff content
 *
 * Supports multiple diff formats:
 * - Index: path/to/file.tsx
 * - --- a/path/to/file.tsx
 * - +++ b/path/to/file.tsx
 *
 * @param diffContent diff content
 * @returns Relative file path, or null if it cannot be parsed
 */
export function parseFilePathFromDiff(diffContent: string): string | null {
  const lines = diffContent.split('\n');

  // Try Index: format (SVN style)
  for (const line of lines) {
    if (line.startsWith('Index: ')) {
      return line.substring(7).trim();
    }
  }

  // Try git diff format (+++ b/ first, since it points to the new file)
  for (const line of lines) {
    if (line.startsWith('+++ b/')) {
      return line.substring(6).trim();
    }
  }

  // Fall back to --- a/ format
  for (const line of lines) {
    if (line.startsWith('--- a/')) {
      return line.substring(6).trim();
    }
  }

  return null;
}

/**
 * Extract actual file content from diff (remove metadata)
 *
 * @param diffContent diff content
 * @returns Clean extracted file content
 */
export function extractContentFromDiff(diffContent: string): string {
  const lines = diffContent.split('\n');
  const contentLines: string[] = [];
  let inDiffBlock = false;

  for (const line of lines) {
    // Skip diff metadata lines
    if (
      line.startsWith('Index:') ||
      line.match(/^={3,}/) ||
      line.startsWith('diff --git') ||
      line.startsWith('---') ||
      line.startsWith('+++') ||
      line.startsWith('@@')
    ) {
      inDiffBlock = true;
      continue;
    }

    if (inDiffBlock) {
      // Extract added lines (remove leading +)
      if (line.startsWith('+')) {
        contentLines.push(line.substring(1));
      }
      // Skip deleted lines and context markers
      else if (line.startsWith('-') || line.startsWith('\\')) {
        continue;
      }
      // Keep empty lines too
      else {
        contentLines.push(line);
      }
    }
  }

  return contentLines.join('\n').trim();
}

/**
 * File change info including diff content
 */
export interface FileChangeInfo {
  /** File name */
  fileName: string;
  /** Full path */
  fullPath: string;
  /** Number of insertions */
  insertions: number;
  /** Number of deletions */
  deletions: number;
  /** Raw diff content */
  diff: string;
}

/**
 * Parse unified diff format, extract file info and change statistics
 *
 * @param diff Unified diff string
 * @param fileNameHint Optional filename hint when diff header is missing
 * @returns Parsed file change info
 */
export const parseDiff = (diff: string, fileNameHint?: string): FileChangeInfo => {
  const lines = diff.split('\n');

  // Extract filename
  const gitLine = lines.find((line) => line.startsWith('diff --git'));
  let fileName = fileNameHint || 'Unknown file';
  let fullPath = fileNameHint || 'Unknown file';

  if (gitLine) {
    const match = gitLine.match(/diff --git a\/(.+) b\/(.+)/);
    if (match) {
      fullPath = match[1];
      fileName = fullPath.split('/').pop() || fullPath;
    }
  } else {
    const parsedPath = parseFilePathFromDiff(diff);
    if (parsedPath) {
      fullPath = parsedPath;
      fileName = parsedPath.split(/[\\/]/).pop() || parsedPath;
    } else if (fileNameHint) {
      fileName = fileNameHint.split(/[\\/]/).pop() || fileNameHint;
      fullPath = fileNameHint;
    }
  }

  // Calculate insertions and deletions
  let insertions = 0;
  let deletions = 0;

  for (const line of lines) {
    // Skip diff header lines
    if (
      line.startsWith('diff --git') ||
      line.startsWith('index ') ||
      line.startsWith('---') ||
      line.startsWith('+++') ||
      line.startsWith('@@') ||
      line.startsWith('\\')
    ) {
      continue;
    }

    if (line.startsWith('+')) {
      insertions++;
    } else if (line.startsWith('-')) {
      deletions++;
    }
  }

  return {
    fileName,
    fullPath,
    insertions,
    deletions,
    diff,
  };
};
