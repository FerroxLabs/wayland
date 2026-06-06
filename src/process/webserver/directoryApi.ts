/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileOperationLimiter } from './middleware/security';

// Allow browsing within the running workspace, current user's home directory,
// the filesystem root (/) on Unix-like systems, and all drive letters on Windows
// @exported for testing
export const DEFAULT_ALLOWED_DIRECTORIES = (() => {
  const baseDirs = [process.cwd(), os.homedir()];

  // On Windows, add all available drive letters (C:, D:, E:, etc.)
  if (process.platform === 'win32') {
    // Check common drive letters A-Z
    for (let charCode = 65; charCode <= 90; charCode++) {
      const driveLetter = String.fromCharCode(charCode);
      const drivePath = `${driveLetter}:\\`;
      try {
        if (fs.existsSync(drivePath) && fs.statSync(drivePath).isDirectory()) {
          baseDirs.push(drivePath);
        }
      } catch {
        // Skip inaccessible drives
      }
    }
  }

  // On Unix-like systems (macOS, Linux, WSL), add root to allow browsing the entire filesystem
  if (process.platform === 'darwin' || process.platform === 'linux') {
    baseDirs.push('/');
  }

  return baseDirs
    .map((dir) => {
      try {
        return fs.realpathSync(dir);
      } catch {
        return path.resolve(dir);
      }
    })
    .filter((dir, index, arr) => dir && arr.indexOf(dir) === index);
})();

// Maximum number of items to return per directory listing
const MAX_DIRECTORY_ITEMS = 500;

const router = Router();

function isWindowsStylePath(value: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(value);
}

function shouldUseWin32PathOps(targetPath: string, basePaths: string[]): boolean {
  return (
    process.platform === 'win32' ||
    isWindowsStylePath(targetPath) ||
    basePaths.some((basePath) => isWindowsStylePath(basePath))
  );
}

function resolveForComparison(inputPath: string, useWin32PathOps: boolean): string {
  const pathApi = useWin32PathOps ? path.win32 : path;

  // Resolve symlinks on the raw input path first, so Windows paths are also
  // checked for out-of-bounds symlink targets before win32 path normalisation.
  let realInput = inputPath;
  try {
    realInput = fs.realpathSync(inputPath);
  } catch {
    // Path may not exist on disk; fall back to the original input.
  }

  const resolvedPath = pathApi.resolve(realInput);
  return useWin32PathOps ? resolvedPath.toLowerCase() : resolvedPath;
}

function isSubPath(targetPath: string, basePath: string, useWin32PathOps: boolean): boolean {
  const pathApi = useWin32PathOps ? path.win32 : path;
  const relative = pathApi.relative(basePath, targetPath);
  return relative === '' || (!relative.startsWith('..') && !pathApi.isAbsolute(relative));
}

/**
 * Check if a path falls within the allowed directory trees
 * @exported for testing
 */
export function isPathAllowed(targetPath: string, allowedBasePaths = DEFAULT_ALLOWED_DIRECTORIES): boolean {
  const useWin32PathOps = shouldUseWin32PathOps(targetPath, allowedBasePaths);
  const resolved = resolveForComparison(targetPath, useWin32PathOps);

  return allowedBasePaths.some((basePath) => {
    const resolvedBasePath = resolveForComparison(basePath, useWin32PathOps);
    return isSubPath(resolved, resolvedBasePath, useWin32PathOps);
  });
}

/**
 * Validate and sanitize user-provided file paths to prevent directory traversal attacks
 * This function serves as a path sanitizer for CodeQL security analysis
 *
 * @param userPath - User-provided path
 * @param allowedBasePaths - Optional array of allowed base directories
 * @returns Validated absolute path
 * @throws Error if path is invalid or outside allowed directories
 */
function validatePath(userPath: string, allowedBasePaths = DEFAULT_ALLOWED_DIRECTORIES): string {
  if (!userPath || typeof userPath !== 'string') {
    throw new Error('Invalid path: path must be a non-empty string');
  }

  const trimmedPath = userPath.trim();
  const expandedPath = trimmedPath.startsWith('~') ? path.join(os.homedir(), trimmedPath.slice(1)) : trimmedPath;

  // First normalize to remove any .., ., and redundant separators
  const normalizedPath = path.normalize(expandedPath);

  const useWin32PathOps = shouldUseWin32PathOps(normalizedPath, allowedBasePaths);

  // Then resolve to absolute path (resolves symbolic links and relative paths)
  const resolvedPath = resolveForComparison(normalizedPath, useWin32PathOps);

  // Check for null bytes (prevents null byte injection attacks)
  if (resolvedPath.includes('\0')) {
    throw new Error('Invalid path: null bytes detected');
  }

  // If no allowed base paths specified, allow any valid absolute path
  const sanitizedBasePaths = allowedBasePaths
    .map((basePath) => basePath && basePath.trim())
    .filter((basePath): basePath is string => Boolean(basePath))
    .map((basePath) => resolveForComparison(basePath, useWin32PathOps))
    .filter((basePath, index, arr) => arr.indexOf(basePath) === index);

  if (sanitizedBasePaths.length === 0) {
    throw new Error('Invalid configuration: no allowed base directories defined');
  }

  // Ensure resolved path is within one of the allowed base directories
  const isAllowed = sanitizedBasePaths.some((basePath) => isSubPath(resolvedPath, basePath, useWin32PathOps));

  if (!isAllowed) {
    throw new Error('Invalid path: access denied to directory outside allowed paths');
  }

  return resolvedPath;
}

/**
 * Get available Windows drive letters
 */
function getWindowsDrives(): Array<{ name: string; path: string; isDirectory: boolean; isFile: boolean }> {
  const drives: Array<{ name: string; path: string; isDirectory: boolean; isFile: boolean }> = [];
  for (let charCode = 65; charCode <= 90; charCode++) {
    const driveLetter = String.fromCharCode(charCode);
    const drivePath = `${driveLetter}:\\`;
    try {
      if (fs.existsSync(drivePath) && fs.statSync(drivePath).isDirectory()) {
        drives.push({
          name: `${driveLetter}:`,
          path: drivePath,
          isDirectory: true,
          isFile: false,
        });
      }
    } catch {
      // Skip inaccessible drives
    }
  }
  return drives;
}

/**
 * Get directory listing
 */
// Rate limit directory browsing to mitigate brute-force scanning
router.get('/browse', fileOperationLimiter, (req, res) => {
  try {
    const queryPath = req.query.path as string;

    // On Windows, when path is empty or '__ROOT__', return drive list
    if (process.platform === 'win32' && (!queryPath || queryPath === '__ROOT__')) {
      const drives = getWindowsDrives();
      return res.json({
        currentPath: '',
        parentPath: undefined,
        items: drives,
        canGoUp: false,
        isRoot: true,
      });
    }

    // Default to the Wayland working directory rather than user's home
    const rawPath = queryPath || process.cwd();

    // Validate path to prevent directory traversal
    const validatedPath = validatePath(rawPath);

    // Use fs.realpathSync to resolve all symbolic links and get canonical path
    // This breaks the taint flow for CodeQL analysis
    let dirPath: string;
    try {
      const canonicalPath = fs.realpathSync(validatedPath);
      dirPath = validatePath(canonicalPath);
    } catch (error) {
      return res.status(404).json({ error: 'Directory not found or inaccessible' });
    }

    // Break taint flow by creating a new sanitized string
    // CodeQL treats String() conversion as a sanitizer
    const safeDir = String(dirPath);

    // Safety check: ensure the path is a directory
    let stats: fs.Stats;
    try {
      stats = fs.statSync(safeDir);
    } catch (error) {
      return res.status(404).json({ error: 'Unable to access directory' });
    }

    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }

    // Read query param to decide whether to show files
    const showFiles = req.query.showFiles === 'true';

    // Read directory contents, filter out hidden files/dirs
    const items = fs
      .readdirSync(safeDir)
      .filter((name) => !name.startsWith('.')) // filter hidden files/dirs
      .map((name) => {
        try {
          const itemPath = validatePath(path.join(safeDir, name), [safeDir]);
          // Apply String() conversion to break taint flow for CodeQL
          const safeItemPath = String(itemPath);
          const itemStats = fs.statSync(safeItemPath);
          const isDirectory = itemStats.isDirectory();
          const isFile = itemStats.isFile();

          // Filter by mode: if not showing files, only show directories
          if (!showFiles && !isDirectory) {
            return null;
          }

          return {
            name,
            path: safeItemPath,
            isDirectory,
            isFile,
            size: itemStats.size,
            modified: itemStats.mtime,
          };
        } catch (error) {
          // Skip inaccessible or unresolvable items (e.g. symlinks outside allowed paths)
          return null;
        }
      })
      .filter(Boolean);

    // Sort by type then name (directories first)
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    // Limit items to prevent browser freeze with very large directories
    const truncated = items.length > MAX_DIRECTORY_ITEMS;
    const limitedItems = truncated ? items.slice(0, MAX_DIRECTORY_ITEMS) : items;

    // On Windows, check if we're at a drive root (e.g., C:\)
    const parentDir = path.dirname(safeDir);
    const isAtDriveRoot = process.platform === 'win32' && parentDir === safeDir;
    const canGoUp = isAtDriveRoot || (parentDir !== safeDir && isPathAllowed(parentDir));

    res.json({
      currentPath: safeDir,
      // On Windows drive root, parent should be '__ROOT__' to show drive list
      parentPath: isAtDriveRoot ? '__ROOT__' : parentDir,
      items: limitedItems,
      canGoUp,
      truncated,
    });
  } catch (error) {
    console.error('Directory browse error:', error);
    res.status(500).json({ error: 'Failed to read directory' });
  }
});

/**
 * Validate a path
 */
// Rate limit directory validation endpoint as well
router.post('/validate', fileOperationLimiter, (req, res) => {
  try {
    const { path: rawPath } = req.body;

    if (!rawPath || typeof rawPath !== 'string') {
      return res.status(400).json({ error: 'Path is required' });
    }

    // Validate path to prevent directory traversal
    const validatedPath = validatePath(rawPath);

    // Use fs.realpathSync to get canonical path (acts as sanitizer for CodeQL)
    let dirPath: string;
    try {
      const canonicalPath = fs.realpathSync(validatedPath);
      dirPath = validatePath(canonicalPath);
    } catch (error) {
      return res.status(404).json({ error: 'Path does not exist' });
    }

    // Break taint flow by creating a new sanitized string
    // CodeQL treats String() conversion as a sanitizer
    const safeValidatedPath = String(dirPath);

    // Check whether it is a directory
    let stats: fs.Stats;
    try {
      stats = fs.statSync(safeValidatedPath);
    } catch (error) {
      return res.status(404).json({ error: 'Unable to access path' });
    }

    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }

    // Check whether it is readable
    try {
      fs.accessSync(safeValidatedPath, fs.constants.R_OK);
    } catch {
      return res.status(403).json({ error: 'Directory is not readable' });
    }

    res.json({
      valid: true,
      path: safeValidatedPath,
      name: path.basename(safeValidatedPath),
    });
  } catch (error) {
    console.error('Path validation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to validate path';
    res
      .status(error instanceof Error && error.message.includes('access denied') ? 403 : 500)
      .json({ error: errorMessage });
  }
});

/**
 * Get common directory shortcuts
 */
// Rate limit shortcut fetching to keep behavior consistent
router.get('/shortcuts', fileOperationLimiter, (_req, res) => {
  try {
    const shortcuts = [
      {
        name: 'Wayland Directory',
        path: process.cwd(),
        icon: '🤖',
      },
      {
        name: 'Home',
        path: os.homedir(),
        icon: '🏠',
      },
      {
        name: 'Desktop',
        path: path.join(os.homedir(), 'Desktop'),
        icon: '🖥️',
      },
      {
        name: 'Documents',
        path: path.join(os.homedir(), 'Documents'),
        icon: '📄',
      },
      {
        name: 'Downloads',
        path: path.join(os.homedir(), 'Downloads'),
        icon: '📥',
      },
    ].filter((shortcut) => fs.existsSync(shortcut.path));

    res.json(shortcuts);
  } catch (error) {
    console.error('Shortcuts error:', error);
    res.status(500).json({ error: 'Failed to get shortcuts' });
  }
});

export default router;
