/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IDirOrFile } from '@/common/adapter/ipcBridge';
import type { NodeInstance } from '@arco-design/web-react/es/Tree/interface';

/**
 * Extract data reference from Tree node
 */
export function extractNodeData(node: NodeInstance | null | undefined): IDirOrFile | null {
  if (!node) return null;
  const props = node.props as { dataRef?: IDirOrFile; _data?: IDirOrFile };
  return props?.dataRef ?? props?._data ?? null;
}

/**
 * Extract key from Tree node (prefer relativePath)
 */
export function extractNodeKey(node: NodeInstance | null | undefined): string | null {
  if (!node) return null;
  const dataRef = extractNodeData(node);
  if (dataRef?.relativePath) {
    return dataRef.relativePath;
  }
  const { key } = node;
  return key == null ? null : String(key);
}

/**
 * Detect correct path separator by platform based on path
 */
export function getPathSeparator(targetPath: string): string {
  return targetPath.includes('\\') ? '\\' : '/';
}

/**
 * Find node in tree by relativePath
 */
export function findNodeByKey(list: IDirOrFile[], key: string): IDirOrFile | null {
  for (const item of list) {
    if (item.relativePath === key) return item;
    if (item.children && item.children.length > 0) {
      const found = findNodeByKey(item.children, key);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get first level node keys (for initial expansion)
 */
export function getFirstLevelKeys(nodes: IDirOrFile[]): string[] {
  if (nodes.length > 0 && nodes[0].relativePath === '') {
    // If first node is root (empty relativePath), expand it
    return [''];
  }
  return [];
}

/**
 * Replace old path with new path in path list
 */
export function replacePathInList(keys: string[], oldPath: string, newPath: string): string[] {
  return keys.map((key) => {
    if (key === oldPath) return newPath;
    if (key.startsWith(oldPath + '/')) {
      return newPath + key.slice(oldPath.length);
    }
    return key;
  });
}

/**
 * Recursively update children paths (for tree update after rename)
 */
export function updateChildrenPaths(
  children: IDirOrFile[] | undefined,
  oldFullPrefix: string,
  newFullPrefix: string,
  oldRelativePrefix: string,
  newRelativePrefix: string
): IDirOrFile[] | undefined {
  if (!children) return undefined;

  return children.map((child) => {
    const updatedChild = { ...child };

    // Update fullPath
    if (child.fullPath.startsWith(oldFullPrefix)) {
      updatedChild.fullPath = newFullPrefix + child.fullPath.slice(oldFullPrefix.length);
    }

    // Update relativePath
    if (child.relativePath && child.relativePath.startsWith(oldRelativePrefix)) {
      updatedChild.relativePath = newRelativePrefix + child.relativePath.slice(oldRelativePrefix.length);
    }

    // Recursively update children
    if (child.children) {
      updatedChild.children = updateChildrenPaths(
        child.children,
        oldFullPrefix,
        newFullPrefix,
        oldRelativePrefix,
        newRelativePrefix
      );
    }

    return updatedChild;
  });
}

/**
 * Recursively update node in tree (for rename)
 */
export function updateTreeForRename(
  list: IDirOrFile[],
  oldKey: string,
  newName: string,
  newFullPath: string
): IDirOrFile[] {
  return list.map((node) => {
    if (node.relativePath === oldKey) {
      // Found target node, update its info
      const oldFullPath = node.fullPath;
      const oldRelativePath = node.relativePath || '';
      const newRelativePath = oldRelativePath.replace(/[^/]+$/, newName);

      const updatedNode: IDirOrFile = {
        ...node,
        name: newName,
        fullPath: newFullPath,
        relativePath: newRelativePath,
      };

      // If has children, recursively update their paths
      if (node.children && node.children.length > 0) {
        const separator = getPathSeparator(oldFullPath);
        const oldFullPrefix = oldFullPath + separator;
        const newFullPrefix = newFullPath + separator;
        const oldRelativePrefix = oldRelativePath + '/';
        const newRelativePrefix = newRelativePath + '/';

        updatedNode.children = updateChildrenPaths(
          node.children,
          oldFullPrefix,
          newFullPrefix,
          oldRelativePrefix,
          newRelativePrefix
        );
      }

      return updatedNode;
    }

    // Recursively check children
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: updateTreeForRename(node.children, oldKey, newName, newFullPath),
      };
    }

    return node;
  });
}

/**
 * Recursively collect all file paths from tree items
 */
export function collectFilePaths(items: IDirOrFile[]): string[] {
  const paths: string[] = [];
  for (const item of items) {
    if (item.isFile && item.fullPath) {
      paths.push(item.fullPath);
    }
    if (item.children && item.children.length > 0) {
      paths.push(...collectFilePaths(item.children));
    }
  }
  return paths;
}

/**
 * If there's only one root directory with children, return its children directly.
 * Used to hide root directory when Toolbar serves as first-level directory.
 */
export function flattenSingleRoot(files: IDirOrFile[]): IDirOrFile[] {
  if (files.length === 1 && (files[0]?.children?.length ?? 0) > 0) {
    return files[0]?.children ?? [];
  }
  return files;
}

/**
 * Clip context menu position to viewport boundaries
 */
export function computeContextMenuPosition(
  x: number,
  y: number,
  menuWidth = 220,
  menuHeight = 220
): { top: number; left: number } {
  let clippedX = x;
  let clippedY = y;
  if (typeof window !== 'undefined') {
    clippedX = Math.min(clippedX, window.innerWidth - menuWidth);
    clippedY = Math.min(clippedY, window.innerHeight - menuHeight);
  }
  return { top: clippedY, left: clippedX };
}

/**
 * Get target folder path from selectedNodeRef or selected keys
 */
export function getTargetFolderPath(
  selectedNodeRef: { relativePath: string; fullPath: string } | null,
  selected: string[],
  files: IDirOrFile[],
  workspace: string
): { fullPath: string; relativePath: string | null } {
  // Prioritize selectedNodeRef
  if (selectedNodeRef) {
    return {
      fullPath: selectedNodeRef.fullPath,
      relativePath: selectedNodeRef.relativePath,
    };
  }

  // Fallback: find the deepest folder from selected keys
  if (selected && selected.length > 0) {
    const folderNodes: IDirOrFile[] = [];
    for (const key of selected) {
      const node = findNodeByKey(files, key);
      if (node && !node.isFile && node.fullPath) {
        folderNodes.push(node);
      }
    }

    if (folderNodes.length > 0) {
      // Sort by deepest relativePath (more path segments)
      folderNodes.sort((a, b) => {
        const aDepth = (a.relativePath || '').split('/').length;
        const bDepth = (b.relativePath || '').split('/').length;
        return bDepth - aDepth;
      });
      return {
        fullPath: folderNodes[0].fullPath,
        relativePath: folderNodes[0].relativePath,
      };
    }
  }

  // Default to workspace root
  return {
    fullPath: workspace,
    relativePath: null,
  };
}
