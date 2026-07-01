/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #256 / #412 - index freshly-ingested memories into the IJFW search index.
 *
 * Dropping a file (Drop folder or drag-drop) writes a .md into ~/.ijfw/memory,
 * which makes it appear in the Memory UI - but free-text recall in the IJFW
 * mcp-server is served from an FTS5 index that is only populated by
 * `ijfw_memory_store`. Because the desktop drop path never called that tool, the
 * agent could not recall what the Memory UI plainly showed ("Memory not found").
 * After persisting the file we therefore also store its content through the MCP
 * client so it lands in the FTS5 index and becomes recallable.
 */
import log from 'electron-log';
import { ijfwMcpClient } from '@process/services/ijfw/ijfwMcpClient';

// ijfw_memory_store caps: content <= 4096 chars, summary (frontmatter name) <= 80.
const MAX_CONTENT = 4096;
const MAX_SUMMARY = 80;

type IndexDroppedMemoryOpts = {
  /** Full text of the ingested memory; truncated to the store's content cap. */
  content: string;
  /** One-line summary used as the entry's frontmatter name. */
  summary: string;
  /** Original source filename, used as a summary fallback. */
  sourceFile?: string;
  /** Tags for the stored entry. Defaults to ['dropped']; the backfill adds 'backfill'. */
  tags?: string[];
};

/**
 * Index a just-ingested memory into the IJFW FTS5 search index so the chat agent
 * can recall it. Best-effort and fire-and-forget: a failure here (mcp-server
 * unavailable, timeout, quota) must never break the drop/ingest itself - the
 * .md file is already safely on disk and visible in the Memory UI.
 */
export async function indexDroppedMemory(opts: IndexDroppedMemoryOpts): Promise<void> {
  const content = opts.content.trim();
  if (!content) return;

  const summary = (opts.summary?.trim() || opts.sourceFile?.trim() || 'Dropped memory')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, MAX_SUMMARY);

  try {
    const result = await ijfwMcpClient.invoke('memory_store', {
      content: content.slice(0, MAX_CONTENT),
      type: 'observation',
      summary,
      tags: opts.tags ?? ['dropped'],
    });
    if (!result.ok) {
      const errorMessage = (result as { error?: string }).error;
      log.warn('[memoryIndexer] memory_store failed', { error: errorMessage, sourceFile: opts.sourceFile });
    } else {
      log.info('[memoryIndexer] indexed dropped memory into FTS5', { sourceFile: opts.sourceFile });
    }
  } catch (err) {
    log.warn('[memoryIndexer] memory_store threw', { err, sourceFile: opts.sourceFile });
  }
}
