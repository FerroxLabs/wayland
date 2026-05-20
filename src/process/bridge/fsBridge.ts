/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { WAYLAND_TIMESTAMP_SEPARATOR } from '@/common/config/constants';
import fs from 'fs/promises';
import type { Dirent } from 'fs';
import path from 'path';
import os from 'os';
import https from 'node:https';
import http from 'node:http';
import JSZip from 'jszip';
import { ipcBridge } from '@/common';
import {
  getSystemDir,
  getAssistantsDir,
  getSkillsDir,
  getBuiltinSkillsCopyDir,
  getAutoSkillsDir,
  ProcessConfig,
} from '@process/utils/initStorage';
import { readDirectoryRecursive } from '@process/utils';
import { writeFileAtomic } from '@process/utils/atomicWrite';
import { getDatabase } from '@process/services/database';
import { ExtensionRegistry } from '@process/extensions/ExtensionRegistry';
import type { IWorkspaceFlatFile } from '@/common/adapter/ipcBridge';

// ============================================================================
// Helper functions for builtin resource directory resolution
// ============================================================================

type ResourceType = 'rules' | 'skills' | 'assistant';

/**
 * Resolve builtin resource directory without Electron.
 * In development and standalone server mode: searches relative to process.cwd().
 * Returns first existing candidate, falling back to first candidate path.
 */
/**
 * Resolve builtin resource directory without Electron.
 * In development and standalone server mode: searches relative to process.cwd().
 * Returns first existing candidate, falling back to first candidate path.
 */
async function findBuiltinResourceDirNode(resourceType: ResourceType): Promise<string> {
  const base = process.cwd();
  const devDir =
    resourceType === 'skills' || resourceType === 'assistant' ? `src/process/resources/${resourceType}` : resourceType;
  const candidates = [path.join(base, devDir), path.join(base, '..', devDir), path.join(base, resourceType)];
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try next
    }
  }
  return candidates[0];
}

/**
 * Sanitize a skill name parsed from untrusted SKILL.md frontmatter before
 * using it as a directory name on disk. Rejects path separators, drive
 * letters, parent-traversal segments, control characters, and reserved
 * Windows device names. Returns null when the input cannot be safely used
 * as a single-segment directory name.
 *
 * Defense for the path-traversal vector documented in upstream PR #2226:
 * the YAML `name:` field is attacker-controlled, so any value that escapes
 * the user's skills directory must be rejected before `path.join`.
 */
function sanitizeSkillName(rawName: string): string | null {
  if (typeof rawName !== 'string') return null;
  const name = rawName.trim();
  if (name.length === 0 || name.length > 128) return null;
  // Disallow path separators, drive letters, NUL, and shell/FS-reserved chars
  // eslint-disable-next-line no-control-regex
  if (/[\\/:*?"<>|\0]/.test(name)) return null;
  // Disallow control characters (0x00-0x1F, 0x7F)
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(name)) return null;
  // Disallow parent-traversal or current-dir segments
  if (name === '.' || name === '..') return null;
  // Disallow leading dot (hidden files) and trailing dot/space (Windows quirk)
  if (name.startsWith('.') || /[. ]$/.test(name)) return null;
  // Disallow reserved Windows device names (case-insensitive, optional ext)
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i.test(name)) return null;
  return name;
}

/**
 * Copy directory recursively
 */
async function copyDirectory(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Read a builtin resource file (.md only)
 */
async function readBuiltinResource(resourceType: ResourceType, fileName: string): Promise<string> {
  const safeFileName = path.basename(fileName);
  if (!safeFileName.endsWith('.md')) {
    throw new Error('Only .md files are allowed');
  }
  const dir = await findBuiltinResourceDirNode(resourceType);
  return fs.readFile(path.join(dir, safeFileName), 'utf-8');
}

/**
 * Read assistant resource file with locale fallback
 */
async function readAssistantResource(
  resourceType: ResourceType,
  assistantId: string,
  locale: string,
  fileNamePattern: (id: string, loc: string) => string
): Promise<string> {
  const assistantsDir = getAssistantsDir();
  const locales = [locale, 'en-US', 'zh-CN'].filter((l, i, arr) => arr.indexOf(l) === i);

  // 1. Try user data directory first
  for (const loc of locales) {
    const fileName = fileNamePattern(assistantId, loc);
    try {
      return await fs.readFile(path.join(assistantsDir, fileName), 'utf-8');
    } catch {
      // Try next locale
    }
  }

  // 2. Fallback to builtin directory
  const builtinDir = await findBuiltinResourceDirNode(resourceType);
  for (const loc of locales) {
    const fileName = fileNamePattern(assistantId, loc);
    try {
      const content = await fs.readFile(path.join(builtinDir, fileName), 'utf-8');
      console.log(`[fsBridge] Read builtin ${resourceType} for ${assistantId}: ${fileName}`);
      return content;
    } catch {
      // Try next locale
    }
  }

  return ''; // Not found
}

/**
 * Write assistant resource file to user directory
 */
async function writeAssistantResource(
  resourceType: ResourceType,
  assistantId: string,
  content: string,
  locale: string,
  fileNamePattern: (id: string, loc: string) => string
): Promise<boolean> {
  try {
    const assistantsDir = getAssistantsDir();
    await fs.mkdir(assistantsDir, { recursive: true });
    const fileName = fileNamePattern(assistantId, locale);
    await fs.writeFile(path.join(assistantsDir, fileName), content, 'utf-8');
    console.log(`[fsBridge] Wrote assistant ${resourceType}: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`Failed to write assistant ${resourceType}:`, error);
    return false;
  }
}

/**
 * Delete assistant resource files (all locale versions)
 */
async function deleteAssistantResource(resourceType: ResourceType, filePattern: RegExp): Promise<boolean> {
  try {
    const assistantsDir = getAssistantsDir();
    const files = await fs.readdir(assistantsDir);
    for (const file of files) {
      if (filePattern.test(file)) {
        await fs.unlink(path.join(assistantsDir, file));
        console.log(`[fsBridge] Deleted assistant ${resourceType}: ${file}`);
      }
    }
    return true;
  } catch (error) {
    console.error(`Failed to delete assistant ${resourceType}:`, error);
    return false;
  }
}

// File name patterns for rules and skills
const ruleFilePattern = (id: string, loc: string) => `${id}.${loc}.md`;
const skillFilePattern = (id: string, loc: string) => `${id}-skills.${loc}.md`;

const workspaceFileListCache = new Map<string, IWorkspaceFlatFile[]>();
const workspaceFileListInFlight = new Map<string, Promise<IWorkspaceFlatFile[]>>();
const workspaceFileListGeneration = new Map<string, number>();

function isPathWithinRoot(root: string, targetPath: string): boolean {
  const relativePath = path.relative(root, targetPath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function normalizeWorkspaceRelativePath(root: string, fullPath: string): string {
  return path.relative(root, fullPath).split(path.sep).join('/');
}

function invalidateWorkspaceFileListCacheByPath(changedPath: string): void {
  const normalizedPath = path.resolve(changedPath);
  const roots = new Set([...workspaceFileListCache.keys(), ...workspaceFileListInFlight.keys()]);

  for (const root of roots) {
    if (!isPathWithinRoot(root, normalizedPath)) {
      continue;
    }

    workspaceFileListCache.delete(root);
    workspaceFileListInFlight.delete(root);
    workspaceFileListGeneration.set(root, (workspaceFileListGeneration.get(root) ?? 0) + 1);
  }
}

const MAX_WORKSPACE_FILES = 20_000;

async function listWorkspaceFilesRecursive(root: string): Promise<IWorkspaceFlatFile[]> {
  const normalizedRoot = path.resolve(root);
  const entries: IWorkspaceFlatFile[] = [];

  const walk = async (currentDir: string): Promise<void> => {
    if (entries.length >= MAX_WORKSPACE_FILES) {
      return;
    }

    let dirEntries: Dirent[];
    try {
      dirEntries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of dirEntries) {
      if (entries.length >= MAX_WORKSPACE_FILES) {
        break;
      }

      if (entry.name === 'node_modules') {
        continue;
      }

      // Hide dot-prefixed entries (e.g. .wayland-core/, .git/, .DS_Store) from
      // the workspace files panel. They're either engine/tooling implementation
      // details (skill-symlink subdirs created by setupAssistantWorkspace) or
      // OS noise — neither belongs in the user-facing file browser.
      if (entry.name.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        // Intentionally skip symlinks to avoid circular reference risks
        continue;
      }

      entries.push({
        name: entry.name,
        fullPath,
        relativePath: normalizeWorkspaceRelativePath(normalizedRoot, fullPath),
      });
    }
  };

  await walk(normalizedRoot);
  entries.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  return entries;
}

async function getCachedWorkspaceFiles(root: string): Promise<IWorkspaceFlatFile[]> {
  const normalizedRoot = path.resolve(root);

  try {
    const stats = await fs.stat(normalizedRoot);
    if (!stats.isDirectory()) {
      workspaceFileListCache.delete(normalizedRoot);
      workspaceFileListInFlight.delete(normalizedRoot);
      return [];
    }
  } catch {
    workspaceFileListCache.delete(normalizedRoot);
    workspaceFileListInFlight.delete(normalizedRoot);
    return [];
  }

  const cached = workspaceFileListCache.get(normalizedRoot);
  if (cached) {
    return cached;
  }

  const inFlight = workspaceFileListInFlight.get(normalizedRoot);
  if (inFlight) {
    return inFlight;
  }

  const requestGeneration = workspaceFileListGeneration.get(normalizedRoot) ?? 0;
  const request = listWorkspaceFilesRecursive(normalizedRoot)
    .then((files) => {
      if ((workspaceFileListGeneration.get(normalizedRoot) ?? 0) === requestGeneration) {
        workspaceFileListCache.set(normalizedRoot, files);
      }
      return files;
    })
    .finally(() => {
      if (workspaceFileListInFlight.get(normalizedRoot) === request) {
        workspaceFileListInFlight.delete(normalizedRoot);
      }
    });

  workspaceFileListInFlight.set(normalizedRoot, request);
  return request;
}

export function initFsBridge(): void {
  const canceledZipRequests = new Set<string>();

  ipcBridge.fs.getFilesByDir.provider(async ({ dir }) => {
    try {
      const tree = await readDirectoryRecursive(dir);
      return tree ? [tree] : [];
    } catch (error) {
      console.error('[fsBridge] Failed to read directory:', dir, error);
      return [];
    }
  });

  ipcBridge.fs.listWorkspaceFiles.provider(async ({ root }) => {
    try {
      return await getCachedWorkspaceFiles(root);
    } catch (error) {
      console.error('[fsBridge] Failed to list workspace files:', root, error);
      return [];
    }
  });

  ipcBridge.fs.getImageBase64.provider(async ({ path: filePath }) => {
    // Image-MIME allowlist (M7). Unknown extensions are REJECTED — we
    // previously fell back to application/octet-stream, which let a
    // hostile HTML preview inline arbitrary non-image bytes as <img src>
    // via the inliner. This provider trusts the caller's path; containment
    // against the HTML file's directory is enforced in the renderer
    // (HTMLRenderer.tsx). The allowlist here is defense-in-depth so any
    // future caller that forgets containment still cannot smuggle
    // non-image content out as a data: URL.
    //
    // Note: SVG is allowed but is itself an active-content format;
    // sanitization before inlining is tracked as a follow-up item.
    const ALLOWED_IMAGE_EXT_MIME: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
    const PLACEHOLDER =
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
    try {
      const ext = (path.extname(filePath) || '').toLowerCase().replace(/^\./, '');
      const mime = ALLOWED_IMAGE_EXT_MIME[ext];
      if (!mime) {
        console.warn('[fsBridge] getImageBase64 rejected non-allowlisted extension:', ext || '(none)');
        return PLACEHOLDER;
      }
      const base64 = await fs.readFile(filePath, { encoding: 'base64' });
      return `data:${mime};base64,${base64}`;
    } catch (_error) {
      // Return a placeholder data URL instead of throwing
      return PLACEHOLDER;
    }
  });

  // Download remote resource with protocol & redirect guard
  const downloadRemoteBuffer = (
    targetUrl: string,
    redirectCount = 0
  ): Promise<{ buffer: Buffer; contentType?: string }> => {
    const allowedProtocols = new Set(['http:', 'https:']);
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return Promise.reject(new Error(`Invalid URL: ${targetUrl}`));
    }
    if (!allowedProtocols.has(parsedUrl.protocol)) {
      return Promise.reject(new Error('Unsupported protocol'));
    }

    // Restrict to a whitelist of hosts for safety
    const allowedHosts = ['github.com', 'raw.githubusercontent.com', 'contrib.rocks', 'img.shields.io'];
    const isAllowedHost = allowedHosts.some(
      (host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`)
    );
    if (!isAllowedHost) {
      return Promise.reject(new Error('URL not allowed for remote fetch'));
    }

    return new Promise((resolve, reject) => {
      try {
        const client = parsedUrl.protocol === 'https:' ? https : http;
        const request = client.get(
          targetUrl,
          {
            headers: {
              'User-Agent': 'Wayland-Preview',
              Referer: 'https://github.com/TradeCanyon/Wayland',
            },
          },
          (response) => {
            const { statusCode = 0, headers } = response;

            if (statusCode >= 300 && statusCode < 400 && headers.location && redirectCount < 5) {
              let redirectUrl: string;
              try {
                redirectUrl = new URL(headers.location, targetUrl).toString();
              } catch {
                reject(new Error(`Invalid redirect URL: ${headers.location}`));
                return;
              }
              response.resume();
              resolve(downloadRemoteBuffer(redirectUrl, redirectCount + 1));
              return;
            }

            if (statusCode >= 400) {
              response.resume();
              reject(new Error(`Failed to fetch image: HTTP ${statusCode}`));
              return;
            }

            const chunks: Buffer[] = [];
            let receivedBytes = 0;
            const MAX_BYTES = 5 * 1024 * 1024; // 5MB limit

            response.on('data', (chunk: Buffer) => {
              receivedBytes += chunk.length;
              if (receivedBytes > MAX_BYTES) {
                response.destroy(new Error('Remote image exceeds size limit (5MB)'));
                return;
              }
              chunks.push(chunk);
            });

            response.on('end', () => {
              resolve({
                buffer: Buffer.concat(chunks),
                contentType: headers['content-type'],
              });
            });
            response.on('error', (error) => reject(error));
          }
        );

        request.setTimeout(15000, () => {
          request.destroy(new Error('Remote image request timed out'));
        });

        request.on('error', (error) => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  };

  // Fetch remote image via bridge and return base64
  ipcBridge.fs.fetchRemoteImage.provider(async ({ url }) => {
    try {
      const { buffer, contentType } = await downloadRemoteBuffer(url);
      const base64 = buffer.toString('base64');
      return `data:${contentType || 'application/octet-stream'};base64,${base64}`;
    } catch (error) {
      console.warn('[fsBridge] Failed to fetch remote image:', (error as Error).message);
      return '';
    }
  });

  // Create temporary file on disk
  ipcBridge.fs.createTempFile.provider(async ({ fileName }) => {
    try {
      const { cacheDir } = getSystemDir();
      const tempDir = path.join(cacheDir, 'temp');

      // Ensure temp directory exists
      await fs.mkdir(tempDir, { recursive: true });

      // Keep original name but sanitize illegal characters
      const safeFileName = fileName.replace(/[<>:"/\\|?*]/g, '_');
      let tempFilePath = path.join(tempDir, safeFileName);

      // Append timestamp when duplicate exists
      const fileExists = await fs
        .access(tempFilePath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        const timestamp = Date.now();
        const ext = path.extname(safeFileName);
        const name = path.basename(safeFileName, ext);
        const tempFileName = `${name}${WAYLAND_TIMESTAMP_SEPARATOR}${timestamp}${ext}`;
        tempFilePath = path.join(tempDir, tempFileName);
      }

      // Create empty placeholder file
      await fs.writeFile(tempFilePath, Buffer.alloc(0));

      return tempFilePath;
    } catch (error) {
      console.error('Failed to create temp file:', error);
      throw error;
    }
  });

  // Create upload file based on user preference.
  // The "save uploads to workspace" setting decides where the file is stored.
  ipcBridge.fs.createUploadFile.provider(async ({ fileName, conversationId }) => {
    try {
      // Check user preference: save to workspace or cache directory
      const saveToWorkspace = await ProcessConfig.get('upload.saveToWorkspace').catch(() => false);

      let uploadDir: string;
      if (conversationId && saveToWorkspace) {
        // Save to workspace
        try {
          const db = await getDatabase();
          const result = db.getConversation(conversationId);
          const conversationWorkspace = result.data?.extra?.workspace;

          if (!result.success || !conversationWorkspace) {
            throw new Error('Conversation workspace not found');
          }

          const resolvedWorkspace = path.resolve(conversationWorkspace);
          uploadDir = path.join(resolvedWorkspace, 'uploads');
          await fs.mkdir(uploadDir, { recursive: true });
        } catch (error) {
          // Fallback to cache directory if workspace cannot be resolved
          console.warn('[fsBridge] Failed to resolve workspace, using cache directory:', error);
          const { cacheDir } = getSystemDir();
          const tempDir = path.join(cacheDir, 'temp');
          await fs.mkdir(tempDir, { recursive: true });
          uploadDir = tempDir;
        }
      } else {
        // Save to cache directory
        const { cacheDir } = getSystemDir();
        const tempDir = path.join(cacheDir, 'temp');
        await fs.mkdir(tempDir, { recursive: true });
        uploadDir = tempDir;
      }

      // Keep original name but sanitize illegal characters
      const safeFileName = fileName.replace(/[<>:"/\\|?*]/g, '_');
      let filePath = path.join(uploadDir, safeFileName);

      // Append timestamp when duplicate exists
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        const timestamp = Date.now();
        const ext = path.extname(safeFileName);
        const name = path.basename(safeFileName, ext);
        const newFileName = `${name}${WAYLAND_TIMESTAMP_SEPARATOR}${timestamp}${ext}`;
        filePath = path.join(uploadDir, newFileName);
      }

      // Defense in depth: ensure path stays within uploadDir
      const resolvedFilePath = path.resolve(filePath);
      const resolvedUploadDir = path.resolve(uploadDir);
      if (!resolvedFilePath.startsWith(resolvedUploadDir + path.sep)) {
        throw new Error('Invalid file name');
      }

      // Create empty placeholder file
      await fs.writeFile(filePath, Buffer.alloc(0));

      return filePath;
    } catch (error) {
      console.error('Failed to create upload file:', error);
      throw error;
    }
  });

  // Read file content (UTF-8 encoding)
  // V8 string length limit is ~512MB; guard against RangeError on oversized files
  const MAX_READ_FILE_SIZE = 256 * 1024 * 1024; // 256 MB
  // Cap binary reads to prevent main-process OOM on attacker-controlled paths (M6)
  const MAX_READ_FILE_BUFFER_SIZE = 64 * 1024 * 1024; // 64 MB

  ipcBridge.fs.readFile.provider(async ({ path: filePath }) => {
    try {
      const stat = await fs.stat(filePath);
      if (stat.size > MAX_READ_FILE_SIZE) {
        console.warn(`[fsBridge] File too large to read as text (${stat.size} bytes): ${filePath}`);
        return null;
      }
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      // Return null for missing or locked files (e.g., cleaned-up temp workspaces, Windows file locks)
      if (code === 'ENOENT' || code === 'EBUSY') {
        return null;
      }
      console.error('Failed to read file:', error);
      throw error;
    }
  });

  // Read binary file as ArrayBuffer
  ipcBridge.fs.readFileBuffer.provider(async ({ path: filePath }) => {
    try {
      // Cap binary reads to prevent main-process OOM on attacker-controlled paths (M6)
      const stat = await fs.stat(filePath);
      if (stat.size > MAX_READ_FILE_BUFFER_SIZE) {
        console.warn(`[fsBridge] File too large to read as buffer (${stat.size} bytes): ${filePath}`);
        return null;
      }
      const buffer = await fs.readFile(filePath);
      // Convert Node.js Buffer to ArrayBuffer
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT' || code === 'EBUSY') {
        return null;
      }
      console.error('Failed to read file buffer:', error);
      throw error;
    }
  });

  // Write file
  ipcBridge.fs.writeFile.provider(async ({ path: filePath, data }) => {
    try {
      // Handle string type
      if (typeof data === 'string') {
        await fs.writeFile(filePath, data, 'utf-8');

        // Send streaming content update to preview panel (for real-time updates)
        try {
          const pathSegments = filePath.split(path.sep);
          const fileName = pathSegments[pathSegments.length - 1];
          const workspace = pathSegments.slice(0, -1).join(path.sep);

          const eventData = {
            filePath: filePath,
            content: data,
            workspace: workspace,
            relativePath: fileName,
            operation: 'write' as const,
          };

          ipcBridge.fileStream.contentUpdate.emit(eventData);
        } catch (emitError) {
          console.error('[fsBridge] ❌ Failed to emit file stream update:', emitError);
        }

        invalidateWorkspaceFileListCacheByPath(filePath);
        return true;
      }

      // Handle the case where a Uint8Array is serialized into a plain object during IPC transport
      let bufferData;

      // Check whether this looks like a serialized typed array (object with numeric keys)
      if (data && typeof data === 'object' && data.constructor?.name === 'Object') {
        const keys = Object.keys(data);
        // Check whether all keys are numeric strings (the typed-array signature)
        const isTypedArrayLike = keys.length > 0 && keys.every((key) => /^\d+$/.test(key));

        if (isTypedArrayLike) {
          // Ensure the values are a numeric array
          const values = Object.values(data).map((v) => (typeof v === 'number' ? v : parseInt(v, 10)));
          bufferData = Buffer.from(values);
        } else {
          bufferData = data;
        }
      } else if (data instanceof Uint8Array) {
        bufferData = Buffer.from(data);
      } else if (Buffer.isBuffer(data)) {
        bufferData = data;
      } else {
        bufferData = data;
      }

      await fs.writeFile(filePath, bufferData);
      invalidateWorkspaceFileListCacheByPath(filePath);
      return true;
    } catch (error) {
      console.error('Failed to write file:', error);
      return false;
    }
  });

  ipcBridge.fs.cancelZip.provider(async ({ requestId }) => {
    if (!requestId) return false;
    canceledZipRequests.add(requestId);
    return true;
  });

  ipcBridge.fs.createZip.provider(async ({ path: filePath, files, requestId }) => {
    const isCanceled = () => Boolean(requestId && canceledZipRequests.has(requestId));
    try {
      const zip = new JSZip();

      for (const file of files) {
        if (isCanceled()) {
          throw new Error('Zip export canceled');
        }

        if (!file?.name) {
          continue;
        }

        if (typeof file.sourcePath === 'string' && file.sourcePath) {
          try {
            const entryStat = await fs.lstat(file.sourcePath);
            let isRegularFile = entryStat.isFile();

            // Follow symlink target only when needed and keep non-regular files out
            if (!isRegularFile && entryStat.isSymbolicLink()) {
              try {
                const targetStat = await fs.stat(file.sourcePath);
                isRegularFile = targetStat.isFile();
              } catch {
                isRegularFile = false;
              }
            }

            if (!isRegularFile) {
              continue;
            }

            // Guard against hanging reads on unusual filesystems / special files
            const abortController = new AbortController();
            const timeoutId = setTimeout(() => {
              abortController.abort();
            }, 10000);

            try {
              if (isCanceled()) {
                abortController.abort();
              }
              const fileBuffer = await fs.readFile(file.sourcePath, {
                signal: abortController.signal,
              });
              if (isCanceled()) {
                throw new Error('Zip export canceled');
              }
              zip.file(file.name, fileBuffer);
            } finally {
              clearTimeout(timeoutId);
            }
          } catch (error) {
            console.warn('[fsBridge] Skip source file while creating zip:', file.sourcePath, error);
          }
          continue;
        }

        if (typeof file.content === 'string') {
          zip.file(file.name, file.content);
          continue;
        }

        if (file.content instanceof Uint8Array) {
          zip.file(file.name, Buffer.from(file.content));
          continue;
        }

        // Handle serialized Uint8Array from IPC payload
        if (file.content && typeof file.content === 'object') {
          const objectLike = file.content as Record<string, unknown>;
          const keys = Object.keys(objectLike);
          const isTypedArrayLike = keys.length > 0 && keys.every((key) => /^\d+$/.test(key));
          if (isTypedArrayLike) {
            const values = keys
              .toSorted((a, b) => Number(a) - Number(b))
              .map((key) => {
                const value = objectLike[key];
                return typeof value === 'number' ? value : Number(value ?? 0);
              });
            zip.file(file.name, Buffer.from(values));
            continue;
          }
        }
      }

      const zipBuffer = await zip.generateAsync(
        {
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: { level: 9 },
        },
        () => {
          if (isCanceled()) {
            throw new Error('Zip export canceled');
          }
        }
      );

      if (isCanceled()) {
        throw new Error('Zip export canceled');
      }
      // Ensure parent directory exists before writing (may be deleted by OneDrive sync, etc.)
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, zipBuffer);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('canceled')) {
        console.log('[fsBridge] Zip export canceled:', requestId || '(no requestId)');
      } else {
        console.error('Failed to create zip file:', error);
      }
      return false;
    } finally {
      if (requestId) {
        canceledZipRequests.delete(requestId);
      }
    }
  });

  // Get file metadata
  ipcBridge.fs.getFileMetadata.provider(async ({ path: filePath }) => {
    try {
      const stats = await fs.stat(filePath);
      return {
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        type: '', // MIME type can be inferred from the file extension
        lastModified: stats.mtime.getTime(),
      };
    } catch (error) {
      // Return empty metadata instead of throwing to avoid unhandled rejection
      // (bridge provider callbacks have no .catch handler)
      console.error('[fsBridge] Failed to get file metadata:', filePath, error);
      return {
        name: path.basename(filePath),
        path: filePath,
        size: -1,
        type: '',
        lastModified: 0,
      };
    }
  });

  // Copy files into the workspace
  ipcBridge.fs.copyFilesToWorkspace.provider(async ({ filePaths, workspace, sourceRoot }) => {
    try {
      const copiedFiles: string[] = [];
      const failedFiles: Array<{ path: string; error: string }> = [];

      // Ensure workspace directory exists
      await fs.mkdir(workspace, { recursive: true });

      for (const filePath of filePaths) {
        try {
          let targetPath: string;

          if (sourceRoot) {
            // Preserve directory structure
            const relativePath = path.relative(sourceRoot, filePath);
            targetPath = path.join(workspace, relativePath);

            // Ensure parent directory exists
            await fs.mkdir(path.dirname(targetPath), { recursive: true });
          } else {
            // Flatten to root (legacy behavior)
            const fileName = path.basename(filePath);
            targetPath = path.join(workspace, fileName);
          }

          // Check whether the target file already exists
          const exists = await fs
            .access(targetPath)
            .then(() => true)
            .catch(() => false);

          let finalTargetPath = targetPath;
          if (exists) {
            // Append timestamp when target file already exists
            const timestamp = Date.now();
            const ext = path.extname(targetPath);
            const name = path.basename(targetPath, ext);
            // Construct new path in the same directory
            const dir = path.dirname(targetPath);
            const newFileName = `${name}${WAYLAND_TIMESTAMP_SEPARATOR}${timestamp}${ext}`;
            finalTargetPath = path.join(dir, newFileName);
          }

          await fs.copyFile(filePath, finalTargetPath);
          copiedFiles.push(finalTargetPath);
        } catch (error) {
          // Record failed file info so UI can warn user
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Failed to copy file ${filePath}:`, message);
          failedFiles.push({ path: filePath, error: message });
        }
      }

      // Mark operation as non-success if anything failed and provide hint text
      const success = failedFiles.length === 0;
      const msg = success ? undefined : 'Some files failed to copy';
      if (copiedFiles.length > 0) {
        invalidateWorkspaceFileListCacheByPath(workspace);
      }

      return {
        success,
        data: { copiedFiles, failedFiles },
        msg,
      };
    } catch (error) {
      console.error('Failed to copy files to workspace:', error);
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Delete file or directory on disk
  ipcBridge.fs.removeEntry.provider(async ({ path: targetPath }) => {
    try {
      const stats = await fs.lstat(targetPath);
      if (stats.isDirectory()) {
        await fs.rm(targetPath, { recursive: true, force: true });
        invalidateWorkspaceFileListCacheByPath(targetPath);
      } else {
        await fs.unlink(targetPath);

        // Send streaming delete event to preview panel (to close preview)
        try {
          const pathSegments = targetPath.split(path.sep);
          const fileName = pathSegments[pathSegments.length - 1];
          const workspace = pathSegments.slice(0, -1).join(path.sep);

          ipcBridge.fileStream.contentUpdate.emit({
            filePath: targetPath,
            content: '',
            workspace: workspace,
            relativePath: fileName,
            operation: 'delete',
          });
        } catch (emitError) {
          console.error('[fsBridge] Failed to emit file stream delete:', emitError);
        }

        invalidateWorkspaceFileListCacheByPath(targetPath);
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to remove entry:', error);
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Rename file or directory and return new path
  ipcBridge.fs.renameEntry.provider(async ({ path: targetPath, newName }) => {
    try {
      const directory = path.dirname(targetPath);
      const newPath = path.join(directory, newName);

      if (newPath === targetPath) {
        // Skip when the new name equals the original path
        return { success: true, data: { newPath } };
      }

      const exists = await fs
        .access(newPath)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        // Avoid overwriting existing targets
        return { success: false, msg: 'Target path already exists' };
      }

      await fs.rename(targetPath, newPath);
      invalidateWorkspaceFileListCacheByPath(targetPath);
      invalidateWorkspaceFileListCacheByPath(newPath);
      return { success: true, data: { newPath } };
    } catch (error) {
      console.error('Failed to rename entry:', error);
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Read built-in rules file from app resources
  ipcBridge.fs.readBuiltinRule.provider(async ({ fileName }) => {
    try {
      return await readBuiltinResource('rules', fileName);
    } catch (error) {
      console.error('Failed to read builtin rule:', error);
      return '';
    }
  });

  // Read built-in skills file from app resources
  ipcBridge.fs.readBuiltinSkill.provider(async ({ fileName }) => {
    try {
      return await readBuiltinResource('skills', fileName);
    } catch (error) {
      console.error('Failed to read builtin skill:', error);
      return '';
    }
  });

  // Read assistant rule file from user directory or builtin rules
  ipcBridge.fs.readAssistantRule.provider(async ({ assistantId, locale = 'en-US' }) => {
    try {
      return await readAssistantResource('rules', assistantId, locale, ruleFilePattern);
    } catch (error) {
      console.error('Failed to read assistant rule:', error);
      throw error;
    }
  });

  // Write assistant rule file to user directory
  ipcBridge.fs.writeAssistantRule.provider(({ assistantId, content, locale = 'en-US' }) => {
    return writeAssistantResource('rules', assistantId, content, locale, ruleFilePattern);
  });

  // Delete assistant rule files
  ipcBridge.fs.deleteAssistantRule.provider(({ assistantId }) => {
    return deleteAssistantResource('rules', new RegExp(`^${assistantId}\\..*\\.md$`));
  });

  // Read assistant skill file from user directory or builtin skills
  ipcBridge.fs.readAssistantSkill.provider(async ({ assistantId, locale = 'en-US' }) => {
    try {
      return await readAssistantResource('skills', assistantId, locale, skillFilePattern);
    } catch (error) {
      console.error('Failed to read assistant skill:', error);
      throw error;
    }
  });

  // Write assistant skill file to user directory
  ipcBridge.fs.writeAssistantSkill.provider(({ assistantId, content, locale = 'en-US' }) => {
    return writeAssistantResource('skills', assistantId, content, locale, skillFilePattern);
  });

  // Delete assistant skill files
  ipcBridge.fs.deleteAssistantSkill.provider(({ assistantId }) => {
    return deleteAssistantResource('skills', new RegExp(`^${assistantId}-skills\\..*\\.md$`));
  });

  // List available skills from builtin, user, and extension directories
  ipcBridge.fs.listAvailableSkills.provider(async () => {
    try {
      type SkillEntry = {
        name: string;
        description: string;
        location: string;
        isCustom: boolean;
        source: 'builtin' | 'custom' | 'extension';
      };
      const skills: SkillEntry[] = [];

      // Helper: read skills from a directory
      const readSkillsFromDir = async (skillsDir: string, source: 'builtin' | 'custom') => {
        try {
          await fs.access(skillsDir);
          const entries = await fs.readdir(skillsDir, { withFileTypes: true });

          for (const entry of entries) {
            if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;

            // Skip builtin skills directory (_builtin), these are auto-injected, no user selection needed
            if (entry.name === '_builtin') continue;

            const skillMdPath = path.join(skillsDir, entry.name, 'SKILL.md');

            try {
              const content = await fs.readFile(skillMdPath, 'utf-8');
              // Parse YAML front matter
              const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
              if (frontMatterMatch) {
                const yaml = frontMatterMatch[1];
                const nameMatch = yaml.match(/^name:\s*(.+)$/m);
                const descMatch = yaml.match(/^description:\s*['"]?(.+?)['"]?$/m);
                if (nameMatch) {
                  skills.push({
                    name: nameMatch[1].trim(),
                    description: descMatch ? descMatch[1].trim() : '',
                    location: skillMdPath,
                    isCustom: source === 'custom',
                    source,
                  });
                }
              }
            } catch {
              // Skill directory without SKILL.md, skip
            }
          }
        } catch {
          // Directory doesn't exist, skip
        }
      };

      // Read builtin skills from the dedicated builtin-skills/ directory
      const builtinSkillsDir = getBuiltinSkillsCopyDir();
      const builtinCountBefore = skills.length;
      await readSkillsFromDir(builtinSkillsDir, 'builtin');
      const builtinCount = skills.length - builtinCountBefore;

      // Read user-defined skills
      const userSkillsDir = getSkillsDir();
      const userCountBefore = skills.length;
      await readSkillsFromDir(userSkillsDir, 'custom');
      const userCount = skills.length - userCountBefore;

      // Read extension-contributed skills from ExtensionRegistry
      let extensionCount = 0;
      try {
        const registry = ExtensionRegistry.getInstance();
        const extSkills = registry.getSkills();
        for (const extSkill of extSkills) {
          skills.push({
            name: extSkill.name,
            description: extSkill.description,
            location: extSkill.location,
            isCustom: false,
            source: 'extension',
          });
          extensionCount++;
        }
      } catch {
        // ExtensionRegistry not available, skip
      }

      // Deduplicate: builtin > extension > custom (lower source wins on conflict)
      const skillMap = new Map<string, SkillEntry>();
      for (const skill of skills) {
        const existing = skillMap.get(skill.name);
        if (!existing || (existing.source === 'custom' && skill.source !== 'custom')) {
          skillMap.set(skill.name, skill);
        }
      }
      const result = Array.from(skillMap.values());

      console.log(
        `[fsBridge] Listed ${result.length} available skills: builtin=${builtinCount}, custom=${userCount}, extension=${extensionCount}`
      );

      return result;
    } catch (error) {
      console.error('[fsBridge] Failed to list available skills:', error);
      return [];
    }
  });

  // List builtin auto-injected skills from _builtin directory
  ipcBridge.fs.listBuiltinAutoSkills.provider(async () => {
    try {
      const autoSkillsDir = getAutoSkillsDir();
      const skills: Array<{ name: string; description: string }> = [];

      try {
        await fs.access(autoSkillsDir);
      } catch {
        return skills;
      }

      const entries = await fs.readdir(autoSkillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;

        const skillMdPath = path.join(autoSkillsDir, entry.name, 'SKILL.md');
        try {
          const content = await fs.readFile(skillMdPath, 'utf-8');
          const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
          if (frontMatterMatch) {
            const yaml = frontMatterMatch[1];
            const nameMatch = yaml.match(/^name:\s*(.+)$/m);
            const descMatch = yaml.match(/^description:\s*['"]?(.+?)['"]?$/m);
            skills.push({
              name: nameMatch ? nameMatch[1].trim() : entry.name,
              description: descMatch ? descMatch[1].trim() : '',
            });
          }
        } catch {
          // SKILL.md not found or unreadable, skip
        }
      }

      console.log(`[fsBridge] Listed ${skills.length} builtin auto-injected skills`);
      return skills;
    } catch (error) {
      console.error('[fsBridge] Failed to list builtin auto skills:', error);
      return [];
    }
  });

  // Read skill info without importing
  ipcBridge.fs.readSkillInfo.provider(async ({ skillPath }) => {
    try {
      // Verify SKILL.md file exists
      const skillMdPath = path.join(skillPath, 'SKILL.md');
      try {
        await fs.access(skillMdPath);
      } catch {
        return {
          success: false,
          msg: 'SKILL.md file not found in the selected directory',
        };
      }

      // Read SKILL.md to get skill info
      const content = await fs.readFile(skillMdPath, 'utf-8');
      const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      let skillName = path.basename(skillPath); // Default to directory name
      let skillDescription = '';

      if (frontMatterMatch) {
        const yaml = frontMatterMatch[1];
        const nameMatch = yaml.match(/^name:\s*(.+)$/m);
        const descMatch = yaml.match(/^description:\s*['"]?(.+?)['"]?$/m);
        if (nameMatch) {
          skillName = nameMatch[1].trim();
        }
        if (descMatch) {
          skillDescription = descMatch[1].trim();
        }
      }

      return {
        success: true,
        data: {
          name: skillName,
          description: skillDescription,
        },
        msg: 'Skill info loaded successfully',
      };
    } catch (error) {
      console.error('[fsBridge] Failed to read skill info:', error);
      return {
        success: false,
        msg: `Failed to read skill info: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });

  // Import skill directory
  ipcBridge.fs.importSkill.provider(async ({ skillPath }) => {
    try {
      // Verify SKILL.md file exists
      const skillMdPath = path.join(skillPath, 'SKILL.md');
      try {
        await fs.access(skillMdPath);
      } catch {
        return {
          success: false,
          msg: 'SKILL.md file not found in the selected directory',
        };
      }

      // Read SKILL.md to get skill name
      const content = await fs.readFile(skillMdPath, 'utf-8');
      const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      let skillName = path.basename(skillPath); // Default to directory name

      if (frontMatterMatch) {
        const yaml = frontMatterMatch[1];
        const nameMatch = yaml.match(/^name:\s*(.+)$/m);
        if (nameMatch) {
          skillName = nameMatch[1].trim();
        }
      }

      // Sanitize skill name (parsed from untrusted SKILL.md frontmatter)
      // before using it as a directory name to prevent path traversal.
      const safeSkillName = sanitizeSkillName(skillName);
      if (!safeSkillName) {
        return {
          success: false,
          msg: `Invalid skill name "${skillName}" — must not contain path separators or reserved characters`,
        };
      }
      skillName = safeSkillName;

      // Get user skills directory
      const userSkillsDir = getSkillsDir();
      const targetDir = path.join(userSkillsDir, skillName);

      // Check if skill already exists in both builtin and user directories
      const builtinTargetDir = path.join(getBuiltinSkillsCopyDir(), skillName);

      try {
        await fs.access(targetDir);
        // Skill already exists in user directory, treat as success (skip copy)
        console.log(`[fsBridge] Skill "${skillName}" already exists in user skills, skipping import`);
        return {
          success: true,
          data: { skillName },
          msg: `Skill "${skillName}" already exists`,
        };
      } catch {
        // User skill doesn't exist
      }

      try {
        await fs.access(builtinTargetDir);
        return {
          success: false,
          msg: `Skill "${skillName}" already exists in builtin skills`,
        };
      } catch {
        // Builtin skill doesn't exist, proceed with copy
      }

      // Copy entire directory
      await copyDirectory(skillPath, targetDir);

      console.log(`[fsBridge] Successfully imported skill "${skillName}" to ${targetDir}`);

      return {
        success: true,
        data: { skillName },
        msg: `Skill "${skillName}" imported successfully`,
      };
    } catch (error) {
      console.error('[fsBridge] Failed to import skill:', error);
      return {
        success: false,
        msg: `Failed to import skill: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });

  // Scan directory for skills
  ipcBridge.fs.scanForSkills.provider(async ({ folderPath }) => {
    console.log(`[fsBridge] scanForSkills called with path: ${folderPath}`);
    try {
      const skills: Array<{ name: string; description: string; path: string }> = [];

      await fs.access(folderPath);
      const entries = await fs.readdir(folderPath, { withFileTypes: true });
      console.log(`[fsBridge] Found ${entries.length} entries in ${folderPath}`);

      for (const entry of entries) {
        if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;

        const skillDir = path.join(folderPath, entry.name);
        const skillMdPath = path.join(skillDir, 'SKILL.md');

        try {
          const content = await fs.readFile(skillMdPath, 'utf-8');
          // Parse YAML front matter
          const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
          if (frontMatterMatch) {
            const yaml = frontMatterMatch[1];
            const nameMatch = yaml.match(/^name:\s*(.+)$/m);
            const descMatch = yaml.match(/^description:\s*['"]?(.+?)['"]?$/m);
            if (nameMatch) {
              skills.push({
                name: nameMatch[1].trim(),
                description: descMatch ? descMatch[1].trim() : '',
                path: skillDir,
              });
              console.log(`[fsBridge] Found skill in subdirectory: ${nameMatch[1].trim()}`);
            }
          }
        } catch {
          // Skill directory without SKILL.md, skip
        }
      }

      // Si no se encontraron skills en subdirectorios, probamos si la carpeta seleccionada en sí es una skill
      if (skills.length === 0) {
        console.log(`[fsBridge] No skills in subdirectories, checking if ${folderPath} is a skill itself`);
        const skillMdPath = path.join(folderPath, 'SKILL.md');
        try {
          const content = await fs.readFile(skillMdPath, 'utf-8');
          const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
          if (frontMatterMatch) {
            const yaml = frontMatterMatch[1];
            const nameMatch = yaml.match(/^name:\s*(.+)$/m);
            const descMatch = yaml.match(/^description:\s*['"]?(.+?)['"]?$/m);
            if (nameMatch) {
              skills.push({
                name: nameMatch[1].trim(),
                description: descMatch ? descMatch[1].trim() : '',
                path: folderPath,
              });
              console.log(`[fsBridge] Found skill in the folder itself: ${nameMatch[1].trim()}`);
            }
          }
        } catch {
          // Not a skill directory
        }
      }

      console.log(`[fsBridge] scanForSkills finished. Found ${skills.length} skills.`);
      return {
        success: true,
        data: skills,
        msg: `Found ${skills.length} skills`,
      };
    } catch (error) {
      console.error('[fsBridge] Failed to scan skills:', error);
      return {
        success: false,
        msg: `Failed to scan skills: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });

  // Detect common skills paths
  ipcBridge.fs.detectCommonSkillPaths.provider(async () => {
    try {
      const homedir = os.homedir();
      const candidates = [
        {
          name: 'Global Agents',
          path: path.join(homedir, '.agents', 'skills'),
        },
        { name: 'Gemini CLI', path: path.join(homedir, '.gemini', 'skills') },
        { name: 'Claude Code', path: path.join(homedir, '.claude', 'skills') },
        {
          name: 'OpenCode',
          path: path.join(homedir, '.config', 'opencode', 'skills'),
        },
        {
          name: 'OpenCode (Alt)',
          path: path.join(homedir, '.opencode', 'skills'),
        },
      ];

      const detected: Array<{ name: string; path: string }> = [];
      for (const candidate of candidates) {
        try {
          await fs.access(candidate.path);
          detected.push(candidate);
        } catch {
          // Path doesn't exist
        }
      }

      return {
        success: true,
        data: detected,
        msg: `Detected ${detected.length} common paths`,
      };
    } catch (error) {
      console.error('[fsBridge] Failed to detect common paths:', error);
      return {
        success: false,
        msg: 'Failed to detect common paths',
      };
    }
  });

  // Detect external skills with counts
  // ===== Custom external skill paths helpers =====
  const getCustomExternalPathsFile = () => path.join(getSystemDir().workDir, 'custom_external_skill_paths.json');

  const loadCustomExternalPaths = async (): Promise<Array<{ name: string; path: string }>> => {
    try {
      const filePath = getCustomExternalPathsFile();
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as Array<{ name: string; path: string }>;
    } catch {
      return [];
    }
  };

  const saveCustomExternalPaths = async (paths: Array<{ name: string; path: string }>) => {
    const filePath = getCustomExternalPathsFile();
    await writeFileAtomic(filePath, JSON.stringify(paths, null, 2), 'utf-8');
  };

  ipcBridge.fs.getCustomExternalPaths.provider(async () => {
    return loadCustomExternalPaths();
  });

  ipcBridge.fs.addCustomExternalPath.provider(async ({ name, path: skillPath }) => {
    try {
      const existing = await loadCustomExternalPaths();
      if (existing.some((p) => p.path === skillPath)) {
        return { success: false, msg: 'Path already exists' };
      }
      existing.push({ name, path: skillPath });
      await saveCustomExternalPaths(existing);
      return { success: true, msg: 'Custom path added' };
    } catch (error) {
      return {
        success: false,
        msg: `Failed to add path: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });

  ipcBridge.fs.removeCustomExternalPath.provider(async ({ path: skillPath }) => {
    try {
      const existing = await loadCustomExternalPaths();
      const filtered = existing.filter((p) => p.path !== skillPath);
      await saveCustomExternalPaths(filtered);
      return { success: true, msg: 'Custom path removed' };
    } catch (error) {
      return {
        success: false,
        msg: `Failed to remove path: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });

  ipcBridge.fs.detectAndCountExternalSkills.provider(async () => {
    try {
      const homedir = os.homedir();
      const builtinCandidates = [
        {
          name: 'Global Agents',
          path: path.join(homedir, '.agents', 'skills'),
          source: 'global-agents',
        },
        {
          name: 'Gemini CLI',
          path: path.join(homedir, '.gemini', 'skills'),
          source: 'gemini',
        },
        {
          name: 'Claude Code',
          path: path.join(homedir, '.claude', 'skills'),
          source: 'claude',
        },
        {
          name: 'OpenCode',
          path: path.join(homedir, '.config', 'opencode', 'skills'),
          source: 'opencode',
        },
        {
          name: 'OpenCode (Alt)',
          path: path.join(homedir, '.opencode', 'skills'),
          source: 'opencode-alt',
        },
      ];

      // Load custom paths and merge
      const customPaths = await loadCustomExternalPaths();
      const candidates = [
        ...builtinCandidates,
        ...customPaths.map((cp) => ({
          name: cp.name,
          path: cp.path,
          source: `custom-${cp.path}`,
        })),
      ];

      const results: Array<{
        name: string;
        path: string;
        source: string;
        skills: Array<{ name: string; description: string; path: string }>;
      }> = [];

      for (const candidate of candidates) {
        try {
          await fs.access(candidate.path);
          const entries = await fs.readdir(candidate.path, {
            withFileTypes: true,
          });
          const skills: Array<{
            name: string;
            description: string;
            path: string;
          }> = [];

          for (const entry of entries) {
            if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
            const skillDir = path.join(candidate.path, entry.name);

            // Helper: try to parse a single skill directory with SKILL.md
            const tryParseSkill = async (dir: string, fallbackName: string) => {
              const skillMdPath = path.join(dir, 'SKILL.md');
              try {
                const content = await fs.readFile(skillMdPath, 'utf-8');
                const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
                if (frontMatterMatch) {
                  const yaml = frontMatterMatch[1];
                  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
                  const descMatch = yaml.match(/^description:\s*['"]?(.+?)['"]?$/m);
                  const skillName = nameMatch ? nameMatch[1].trim() : fallbackName;

                  return {
                    name: skillName,
                    description: descMatch ? descMatch[1].trim() : '',
                    path: dir,
                  };
                }
              } catch {
                // No SKILL.md or parse error
              }
              return null;
            };

            // Case 1: Direct skill — has SKILL.md at the root of the entry
            const directSkill = await tryParseSkill(skillDir, entry.name);
            if (directSkill) {
              skills.push(directSkill);
              continue;
            }

            // Case 2: Skill pack — entry has a nested skills/ subdirectory containing individual skills
            const nestedSkillsDir = path.join(skillDir, 'skills');
            try {
              await fs.access(nestedSkillsDir);
              const nestedEntries = await fs.readdir(nestedSkillsDir, {
                withFileTypes: true,
              });
              for (const nestedEntry of nestedEntries) {
                if (!nestedEntry.isDirectory() && !nestedEntry.isSymbolicLink()) continue;
                const nestedDir = path.join(nestedSkillsDir, nestedEntry.name);
                const nestedSkill = await tryParseSkill(nestedDir, nestedEntry.name);
                if (nestedSkill) {
                  skills.push(nestedSkill);
                }
              }
            } catch {
              // No nested skills/ dir
            }
          }

          if (skills.length > 0) {
            results.push({
              name: candidate.name,
              path: candidate.path,
              source: candidate.source,
              skills,
            });
          }
        } catch {
          // Path doesn't exist
        }
      }

      return {
        success: true,
        data: results,
        msg: `Found ${results.reduce((sum, r) => sum + r.skills.length, 0)} unimported external skills`,
      };
    } catch (error) {
      console.error('[fsBridge] Failed to detect external skills:', error);
      return {
        success: false,
        msg: 'Failed to detect external skills',
      };
    }
  });

  // Import skill via symlink
  ipcBridge.fs.importSkillWithSymlink.provider(async ({ skillPath }) => {
    try {
      const skillMdPath = path.join(skillPath, 'SKILL.md');
      try {
        await fs.access(skillMdPath);
      } catch {
        return {
          success: false,
          msg: 'SKILL.md file not found in the selected directory',
        };
      }

      const content = await fs.readFile(skillMdPath, 'utf-8');
      const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      let skillName = path.basename(skillPath);
      if (frontMatterMatch) {
        const nameMatch = frontMatterMatch[1].match(/^name:\s*(.+)$/m);
        if (nameMatch) skillName = nameMatch[1].trim();
      }

      // Sanitize skill name (parsed from untrusted SKILL.md frontmatter)
      // before using it as a directory name to prevent path traversal.
      const safeSkillName = sanitizeSkillName(skillName);
      if (!safeSkillName) {
        return {
          success: false,
          msg: `Invalid skill name "${skillName}" — must not contain path separators or reserved characters`,
        };
      }
      skillName = safeSkillName;

      const userSkillsDir = getSkillsDir();
      const targetDir = path.join(userSkillsDir, skillName);

      await fs.mkdir(userSkillsDir, { recursive: true });

      try {
        await fs.access(targetDir);
        return { success: false, msg: `Skill "${skillName}" already exists` };
      } catch {
        // Does not exist, proceed
      }

      await fs.symlink(skillPath, targetDir, 'junction');
      console.log(`[fsBridge] Created symlink for skill "${skillName}" at ${targetDir}`);
      return {
        success: true,
        data: { skillName },
        msg: `Skill "${skillName}" imported successfully`,
      };
    } catch (error) {
      console.error('[fsBridge] Failed to import skill with symlink:', error);
      return {
        success: false,
        msg: `Failed to import skill: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });

  // Delete a user custom skill
  ipcBridge.fs.deleteSkill.provider(async ({ skillName }) => {
    try {
      // Sanitize incoming skill name (IPC arg from renderer) before using it
      // as a directory component. Defense in depth alongside the path-prefix
      // containment check below.
      const safeSkillName = sanitizeSkillName(skillName);
      if (!safeSkillName) {
        return {
          success: false,
          msg: `Invalid skill name "${skillName}"`,
        };
      }

      const userSkillsDir = getSkillsDir();
      const skillDir = path.join(userSkillsDir, safeSkillName);

      const resolvedSkillDir = path.resolve(skillDir);
      const resolvedSkillsDir = path.resolve(userSkillsDir);
      if (!resolvedSkillDir.startsWith(resolvedSkillsDir + path.sep)) {
        return {
          success: false,
          msg: 'Invalid skill path (security check failed)',
        };
      }

      try {
        await fs.access(resolvedSkillDir);
      } catch {
        return { success: false, msg: `Skill "${skillName}" not found` };
      }

      const stat = await fs.lstat(resolvedSkillDir);
      if (stat.isSymbolicLink()) {
        await fs.unlink(resolvedSkillDir);
      } else {
        await fs.rm(resolvedSkillDir, { recursive: true, force: true });
      }

      console.log(`[fsBridge] Deleted skill "${skillName}" from ${resolvedSkillDir}`);
      return { success: true, msg: `Skill "${skillName}" deleted` };
    } catch (error) {
      console.error('[fsBridge] Failed to delete skill:', error);
      return {
        success: false,
        msg: `Failed to delete skill: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });

  // Get skill storage paths
  ipcBridge.fs.getSkillPaths.provider(async () => ({
    userSkillsDir: getSkillsDir(),
    builtinSkillsDir: getBuiltinSkillsCopyDir(),
  }));

  // Export skill to external directory via symlink
  ipcBridge.fs.exportSkillWithSymlink.provider(async ({ skillPath, targetDir }) => {
    try {
      const skillName = path.basename(skillPath);
      const targetPath = path.join(targetDir, skillName);

      // Ensure target base directory exists
      await fs.mkdir(targetDir, { recursive: true });

      // Check if target path already exists
      try {
        await fs.access(targetPath);
        return {
          success: false,
          msg: `Target already exists: ${targetPath}`,
        };
      } catch {
        // Path does not exist, proceed
      }

      // Create symlink
      await fs.symlink(skillPath, targetPath, 'junction');
      console.log(`[fsBridge] Exported skill "${skillName}" to ${targetPath} via symlink`);

      return { success: true, msg: `Successfully exported to ${targetPath}` };
    } catch (error) {
      console.error('[fsBridge] Failed to export skill with symlink:', error);
      return {
        success: false,
        msg: `Failed to export skill: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });

}
