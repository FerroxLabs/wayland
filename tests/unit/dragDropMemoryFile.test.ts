/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #256 B1 - the drag-drop ingest path (`memory.ingestFiles`) is what "drop a
 * memory via the UI" actually hits, and it was the path the live Windows verify
 * found broken: a BOM-prefixed file stored `title = <filename fallback>` and
 * mangled metadata while the drop-folder path stayed clean. These drive the real
 * assembly (buildDragDropMemoryFile) and assert the persisted frontmatter + the
 * content handed to the FTS5 store are clean for Windows-authored input.
 */
import { describe, expect, it } from 'vitest';
import { buildDragDropMemoryFile } from '@process/bridge/importBridge';

const BOM = '﻿';
const TS = 1_700_000_000_000;

describe('drag-drop memory file assembly (#256 B1)', () => {
  it('derives a clean title/description for a plain (LF, no BOM) file', () => {
    const out = buildDragDropMemoryFile(
      { name: 'hyperframes.md', content: '# HyperFrames Overview\n\nHyperFrames are a modular UI concept.' },
      TS
    );
    expect(out.title).toBe('HyperFrames Overview');
    expect(out.summary).toBe('HyperFrames are a modular UI concept.');
    expect(out.fileContent).toMatch(/^title: HyperFrames Overview$/m);
    expect(out.fileContent).toMatch(/^description: HyperFrames are a modular UI concept\.$/m);
  });

  it('REGRESSION: a Windows file (BOM + CRLF) keeps its heading title instead of the filename fallback', () => {
    const out = buildDragDropMemoryFile(
      {
        name: 'nebula-note.md',
        content: `${BOM}# Nebula Test Memory\r\n\r\nThe codename for the drop-recall test is NEBULA-2287.\r\n`,
      },
      TS
    );

    // The exact bug: before the fix the title fell back to "nebula-note".
    expect(out.title).toBe('Nebula Test Memory');
    expect(out.summary).toBe('The codename for the drop-recall test is NEBULA-2287.');
    expect(out.fileContent).toMatch(/^title: Nebula Test Memory$/m);
    expect(out.fileContent).toMatch(/^description: The codename for the drop-recall test is NEBULA-2287\.$/m);

    // No BOM anywhere in the persisted file, and the content given to the FTS5
    // store is BOM-free and starts at the heading.
    expect(out.fileContent.charCodeAt(0)).not.toBe(0xfeff);
    expect(out.fileContent).not.toContain(BOM);
    expect(out.indexedContent).not.toContain(BOM);
    expect(out.indexedContent.startsWith('# Nebula Test Memory')).toBe(true);
  });

  it('passes through a file that already has YAML frontmatter (BOM stripped)', () => {
    const out = buildDragDropMemoryFile(
      { name: 'preset.md', content: `${BOM}---\ntitle: Preset\n---\n# Body Heading\n\nbody` },
      TS
    );
    // Existing frontmatter is preserved (not double-wrapped), just BOM-stripped.
    expect(out.fileContent.startsWith('---\ntitle: Preset')).toBe(true);
    expect(out.fileContent).not.toContain(BOM);
  });

  it('records the requested scope (defaults to global)', () => {
    const proj = buildDragDropMemoryFile({ name: 'a.md', content: '# A\n\nbody', scope: 'project' }, TS);
    const glob = buildDragDropMemoryFile({ name: 'b.md', content: '# B\n\nbody' }, TS);
    expect(proj.fileContent).toMatch(/^scope: project$/m);
    expect(glob.fileContent).toMatch(/^scope: global$/m);
  });
});
