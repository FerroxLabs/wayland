/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * WikilinkRenderer - parse wikilink syntax in body text and render them
 * as BacklinkChip components.
 *
 * Parses: [[X]] and [[X|alias]] syntax from text.
 * NOTE: intentionally does NOT import from src/process/. The regex is replicated
 * here because wikilinkResolver.ts is main-process-only.
 */

import React from 'react';
import { BacklinkChip } from './BacklinkChip';

// Matches [[X]] and [[X|alias]] - capture group 1 = target, group 2 = alias (optional)
const WIKILINK_PATTERN = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

export type BacklinkResolver = (name: string) => { slug: string | null };

export type WikilinkRendererProps = {
  text: string;
  resolveBacklink: BacklinkResolver;
  onNavigate?: (slug: string) => void;
};

export function WikilinkRenderer({
  text,
  resolveBacklink,
  onNavigate,
}: WikilinkRendererProps): React.ReactElement {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const re = new RegExp(WIKILINK_PATTERN.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const [fullMatch, target, alias] = match;
    const start = match.index;

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    const displayName = alias ?? target;
    const { slug } = resolveBacklink(target);

    parts.push(
      <BacklinkChip
        key={`${start}-${target}`}
        name={displayName}
        slug={slug}
        onClick={onNavigate}
      />,
    );

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
