/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LoadedExtension } from '../../types';
import fs from 'fs';
import path from 'path';
import semver from 'semver';

/**
 * Current Wayland extension API version.
 * Increment major for breaking changes, minor for new features, patch for fixes.
 */
export const WAYLAND_VERSION = getWaylandVersion();
export const EXTENSION_API_VERSION = '1.0.0';

/**
 * Check whether a version satisfies a semver range expression.
 *
 * Uses the npm `semver` package so the full range grammar is supported -
 * single versions (`1.0.0`), caret (`^1.0.0`), tilde (`~1.0.0`), comparators
 * (`>=1.0.0`), compound ranges (`>=1.0.0 <2.0.0`), x-ranges (`1.x`), and
 * pre-releases. Earlier inline parser only handled single-version, caret,
 * and tilde and would silently return false for any other shape - letting
 * valid extensions get rejected with a misleading "incompatibility" message.
 */
function satisfiesVersion(version: string, range: string): boolean {
  const cleanVersion = semver.coerce(version)?.version ?? version;
  try {
    return semver.satisfies(cleanVersion, range, { includePrerelease: true });
  } catch {
    return false;
  }
}

/**
 * Detect dev (unpacked) mode so engine-compat mismatches downgrade from
 * "skip" to "warn." Lets extensions authored against a future Wayland
 * version surface during integration without blocking the dev session.
 *
 * Production users still get the strict check.
 */
function isUnpackedDevMode(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const electron = require('electron') as { app?: { isPackaged?: boolean } };
    if (typeof electron?.app?.isPackaged === 'boolean') return !electron.app.isPackaged;
  } catch {
    // Non-Electron context (unit tests, node scripts) - treat as dev
    return true;
  }
  return false;
}

/**
 * Get the Wayland version from package.json.
 * Falls back to '0.0.0' if not available.
 */
function getWaylandVersion(): string {
  // Prefer Electron runtime version when available (desktop / packaged mode).
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const electron = require('electron') as { app?: { getVersion?: () => string } };
    const appVersion = electron?.app?.getVersion?.();
    if (appVersion) return appVersion;
  } catch {
    // Ignore: non-Electron contexts (unit tests, node scripts)
  }

  // Fallback to nearest package.json candidates in dev/build contexts.
  const candidates = [
    path.resolve(process.cwd(), 'package.json'),
    path.resolve(__dirname, '../../package.json'),
    path.resolve(__dirname, '../../../package.json'),
  ];

  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) continue;
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const pkg = require(candidate) as { version?: string };
      if (pkg?.version) return pkg.version;
    } catch {
      // Continue trying next candidate
    }
  }

  try {
    return process.env.npm_package_version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export interface EngineValidationResult {
  valid: boolean;
  extensionName: string;
  issues: string[];
}

/**
 * Validate that an extension's engine requirements are satisfied by the current Wayland version.
 *
 * Checks:
 * 1. engine.wayland - does the running Wayland version satisfy the required range?
 * 2. engine.extensionApi - (future) does the extension API version match?
 */
export function validateEngineCompatibility(extension: LoadedExtension): EngineValidationResult {
  const result: EngineValidationResult = {
    valid: true,
    extensionName: extension.manifest.name,
    issues: [],
  };

  const engine = extension.manifest.engine;
  const apiVersion = extension.manifest.apiVersion;

  // Check Wayland core version compatibility
  if (engine?.wayland) {
    if (!satisfiesVersion(WAYLAND_VERSION, engine.wayland)) {
      result.valid = false;
      result.issues.push(
        `Extension "${extension.manifest.name}" requires Wayland ${engine.wayland} but current version is ${WAYLAND_VERSION}`
      );
    }
  }

  // Check extension API version compatibility
  if (apiVersion) {
    if (!satisfiesVersion(EXTENSION_API_VERSION, apiVersion)) {
      result.valid = false;
      result.issues.push(
        `Extension "${extension.manifest.name}" requires extension API ${apiVersion} but current API is ${EXTENSION_API_VERSION}`
      );
    }
  }

  return result;
}

/**
 * Validate engine compatibility for all extensions.
 * Returns extensions that pass validation and logs warnings for those that don't.
 */
export function filterByEngineCompatibility(extensions: LoadedExtension[]): {
  compatible: LoadedExtension[];
  incompatible: Array<{ extension: LoadedExtension; issues: string[] }>;
} {
  const compatible: LoadedExtension[] = [];
  const incompatible: Array<{ extension: LoadedExtension; issues: string[] }> = [];

  const devMode = isUnpackedDevMode();

  for (const ext of extensions) {
    const result = validateEngineCompatibility(ext);
    if (result.valid) {
      compatible.push(ext);
    } else if (devMode) {
      // Dev / unpacked: surface as warning but still load. Lets integration
      // sessions verify extensions whose engine declarations don't match the
      // current Wayland version (e.g. a bundle authored against an unreleased
      // v1.x while we're still on v0.4.x) without editing the bundle.
      for (const issue of result.issues) {
        console.warn(`[Extensions] Engine incompatibility (dev override - loading anyway): ${issue}`);
      }
      compatible.push(ext);
    } else {
      incompatible.push({ extension: ext, issues: result.issues });
      for (const issue of result.issues) {
        console.warn(`[Extensions] Engine incompatibility: ${issue}`);
      }
    }
  }

  return { compatible, incompatible };
}
