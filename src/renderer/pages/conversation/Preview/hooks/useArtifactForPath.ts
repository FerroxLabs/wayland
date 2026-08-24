/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-9. Is the file currently being previewed a registered deliverable?
 *
 * The match is done HERE, in the renderer, against canonical paths the HOST
 * computed - deliberately, and it is not a hole. The renderer never sends a
 * path anywhere: it receives the host's list, finds the entry whose canonical
 * path equals the one it is previewing, and from then on addresses that entry
 * by ID. A wrong match therefore cannot make the host touch a file of the
 * renderer's choosing; the worst case is that the bar shows for the wrong
 * artifact, and the bar is showing that artifact's canonical path, so the user
 * can see it is wrong.
 *
 * The alternative - asking the host "which artifact is at this path?" - would
 * mean sending a path across the boundary, which is the one thing P2-9 exists
 * to avoid.
 */

import { ipcBridge } from '@/common';
import type { ArtifactSummary } from '@/common/types/artifacts';
import { useEffect, useState } from 'react';

/** Compare two absolute paths for identity, tolerating separator style. */
function samePath(left: string, right: string): boolean {
  const normalize = (value: string): string => value.replace(/\\/g, '/').replace(/\/+$/, '');
  const a = normalize(left);
  const b = normalize(right);
  if (a === b) return true;
  // macOS and Windows are case-insensitive in practice. Linux is not, but a
  // case-only collision between two real deliverables is not a threat here -
  // the bar would offer the other one, showing its path, and every action is
  // still resolved and re-verified by the host from the id.
  return a.toLowerCase() === b.toLowerCase();
}

export function useArtifactForPath(filePath: string | undefined): ArtifactSummary | null {
  const [artifact, setArtifact] = useState<ArtifactSummary | null>(null);

  useEffect(() => {
    if (!filePath) {
      setArtifact(null);
      return;
    }
    let cancelled = false;
    void ipcBridge.artifacts.list
      .invoke()
      .then((listing) => {
        if (cancelled) return;
        setArtifact(
          (listing?.artifacts ?? []).find(
            (entry) =>
              samePath(entry.canonicalPath, filePath) ||
              // The stable copy at the series root is the same deliverable under
              // a path that does not move, and it is the one a person clicks:
              // it is two levels shallower than the dated run directory and it
              // is what a prior-run reader is pointed at. Matching it here is
              // what puts Open, Reveal and the run history on that file too.
              (entry.aliasPaths ?? []).some((alias) => samePath(alias, filePath))
          ) ?? null
        );
      })
      .catch(() => {
        // A missing or unreadable ledger means "not a known deliverable", which
        // is the same as no match. It must never take the preview panel down.
        if (!cancelled) setArtifact(null);
      });
    return () => {
      cancelled = true;
    };
  }, [filePath]);

  return artifact;
}
