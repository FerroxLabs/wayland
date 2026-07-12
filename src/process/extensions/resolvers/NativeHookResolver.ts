/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'path';
import { existsSync } from 'fs';
import type {
  ExtAcronym,
  ExtFilePreviewAction,
  ExtScheduledTaskTemplate,
  ExtWorkflowTemplate,
  ExtWorkspacePanel,
  LoadedExtension,
} from '../types';
import { toAssetUrl } from '../protocol/assetProtocol';
import { isPathWithinDirectory } from '../sandbox/pathSafety';
import { resolveRuntimeEntryPath } from './utils/entryPointResolver';
import { resolveExternalEntryUrl } from './utils/externalEntryUrlResolver';

export type ResolvedExtensionAcronym = {
  id: string;
  acronym: string;
  expansion: string;
  description?: string;
  enabled: boolean;
  _extensionName: string;
};

export type ResolvedWorkspacePanel = {
  id: string;
  name: string;
  icon?: string;
  entryUrl: string;
  order: number;
  _extensionName: string;
};

export type ResolvedFilePreviewAction = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  matchExtensions?: string[];
  promptTemplate?: string;
  entryUrl?: string;
  order: number;
  _extensionName: string;
};

export type ResolvedScheduledTaskTemplate = {
  id: string;
  name: string;
  description?: string;
  promptTemplate: string;
  scheduleHint?: string;
  order: number;
  _extensionName: string;
};

export type ResolvedWorkflowTemplate = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  promptTemplate?: string;
  steps?: string[];
  order: number;
  _extensionName: string;
};

function globalId(extName: string, localId: string): string {
  return `ext-${extName}-${localId}`;
}

function resolveIcon(ext: LoadedExtension, icon: string | undefined, label: string): string | undefined {
  if (!icon) return undefined;
  const absIcon = path.resolve(ext.directory, icon);
  if (isPathWithinDirectory(absIcon, ext.directory) && existsSync(absIcon)) {
    return toAssetUrl(absIcon);
  }
  console.warn(`[Extensions] ${label} icon not found or invalid: ${icon} in ${ext.manifest.name}`);
  return undefined;
}

function resolveEntryUrl(ext: LoadedExtension, entryPoint: string, label: string): string | undefined {
  const isExternalEntry = /^https?:\/\//i.test(entryPoint);
  if (isExternalEntry) {
    // #824: gate cleartext http (loopback-only) through the shared resolver so this
    // surface can't reintroduce the MITM shape once it's wired into a webview.
    return resolveExternalEntryUrl(entryPoint, label, ext.manifest.name);
  }

  const absEntry = resolveRuntimeEntryPath(ext.directory, entryPoint);
  if (!absEntry) {
    const rawPath = path.resolve(ext.directory, entryPoint);
    if (!isPathWithinDirectory(rawPath, ext.directory)) {
      console.warn(`[Extensions] ${label} path traversal attempt: ${entryPoint} in ${ext.manifest.name}`);
      return undefined;
    }
    console.warn(`[Extensions] ${label} entryPoint not found: ${entryPoint} (${ext.manifest.name})`);
    return undefined;
  }
  if (!isPathWithinDirectory(absEntry, ext.directory)) {
    console.warn(`[Extensions] ${label} path traversal attempt: ${entryPoint} in ${ext.manifest.name}`);
    return undefined;
  }
  return toAssetUrl(absEntry);
}

export function resolveExtensionAcronyms(extensions: LoadedExtension[]): ResolvedExtensionAcronym[] {
  const result: ResolvedExtensionAcronym[] = [];
  const seen = new Set<string>();

  for (const ext of extensions) {
    for (const acronym of ext.manifest.contributes.acronyms ?? []) {
      const id = globalId(ext.manifest.name, acronym.acronym.toLowerCase());
      if (seen.has(id)) {
        console.warn(`[Extensions] Duplicate acronym contribution "${id}", skipping`);
        continue;
      }
      seen.add(id);
      result.push({
        id,
        acronym: acronym.acronym,
        expansion: acronym.expansion,
        description: acronym.description,
        enabled: acronym.enabled ?? true,
        _extensionName: ext.manifest.name,
      });
    }
  }

  result.sort((a, b) => a.acronym.localeCompare(b.acronym));
  return result;
}

export function resolveWorkspacePanels(extensions: LoadedExtension[]): ResolvedWorkspacePanel[] {
  const result: ResolvedWorkspacePanel[] = [];
  const seen = new Set<string>();

  for (const ext of extensions) {
    for (const panel of ext.manifest.contributes.workspacePanels ?? []) {
      const id = globalId(ext.manifest.name, panel.id);
      if (seen.has(id)) {
        console.warn(`[Extensions] Duplicate workspace panel contribution "${id}", skipping`);
        continue;
      }
      const entryUrl = resolveEntryUrl(ext, panel.entryPoint, 'workspace panel');
      if (!entryUrl) continue;
      seen.add(id);
      result.push({
        id,
        name: panel.name,
        icon: resolveIcon(ext, panel.icon, 'workspace panel'),
        entryUrl,
        order: panel.order ?? 100,
        _extensionName: ext.manifest.name,
      });
    }
  }

  result.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  return result;
}

export function resolveFilePreviewActions(extensions: LoadedExtension[]): ResolvedFilePreviewAction[] {
  const result: ResolvedFilePreviewAction[] = [];
  const seen = new Set<string>();

  for (const ext of extensions) {
    for (const action of ext.manifest.contributes.filePreviewActions ?? []) {
      const id = globalId(ext.manifest.name, action.id);
      if (seen.has(id)) {
        console.warn(`[Extensions] Duplicate file preview action contribution "${id}", skipping`);
        continue;
      }
      const entryUrl = action.entryPoint ? resolveEntryUrl(ext, action.entryPoint, 'file preview action') : undefined;
      if (action.entryPoint && !entryUrl) continue;
      seen.add(id);
      result.push({
        id,
        name: action.name,
        description: action.description,
        icon: resolveIcon(ext, action.icon, 'file preview action'),
        matchExtensions: action.matchExtensions,
        promptTemplate: action.promptTemplate,
        entryUrl,
        order: action.order ?? 100,
        _extensionName: ext.manifest.name,
      });
    }
  }

  result.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  return result;
}

export function resolveScheduledTaskTemplates(extensions: LoadedExtension[]): ResolvedScheduledTaskTemplate[] {
  const result: ResolvedScheduledTaskTemplate[] = [];
  const seen = new Set<string>();

  for (const ext of extensions) {
    for (const template of ext.manifest.contributes.scheduledTaskTemplates ?? []) {
      const id = globalId(ext.manifest.name, template.id);
      if (seen.has(id)) {
        console.warn(`[Extensions] Duplicate scheduled task template contribution "${id}", skipping`);
        continue;
      }
      seen.add(id);
      result.push({
        id,
        name: template.name,
        description: template.description,
        promptTemplate: template.promptTemplate,
        scheduleHint: template.scheduleHint,
        order: template.order ?? 100,
        _extensionName: ext.manifest.name,
      });
    }
  }

  result.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  return result;
}

export function resolveWorkflowTemplates(extensions: LoadedExtension[]): ResolvedWorkflowTemplate[] {
  const result: ResolvedWorkflowTemplate[] = [];
  const seen = new Set<string>();

  for (const ext of extensions) {
    for (const template of ext.manifest.contributes.workflowTemplates ?? []) {
      const id = globalId(ext.manifest.name, template.id);
      if (seen.has(id)) {
        console.warn(`[Extensions] Duplicate workflow template contribution "${id}", skipping`);
        continue;
      }
      seen.add(id);
      result.push({
        id,
        name: template.name,
        description: template.description,
        category: template.category,
        promptTemplate: template.promptTemplate,
        steps: template.steps,
        order: template.order ?? 100,
        _extensionName: ext.manifest.name,
      });
    }
  }

  result.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  return result;
}
