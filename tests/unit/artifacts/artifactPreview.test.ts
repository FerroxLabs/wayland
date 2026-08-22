/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * PREVIEW IS THE FIFTH ACTION, NOT A SHORTCUT PAST THE OTHER FOUR.
 *
 * A preview reads a user's file and hands the bytes to the renderer, so it is
 * the single most obviously dangerous thing in the namespace. It therefore gets
 * the SAME gates Open, Reveal, Save-a-copy and Refresh get - ledger identity,
 * host confinement, the ancestor symlink walk, the digest re-check - plus two
 * that only it needs:
 *
 *  - a SIZE gate that runs on the ledger record BEFORE anything is opened, so a
 *    64 MB deliverable is refused rather than read into the main process and
 *    pushed down an IPC bridge that can neither reject nor carry it;
 *  - a BINARY SNIFF, host-side, so the renderer never has to guess and a PDF
 *    never appears in the hero band of the card as `%PDF-1.7 %âãÏÓ`.
 *
 * Every refusal test here is written so that DELETING the guard makes it fail.
 * Where the guard's value is in what it prevents from being READ, the proof is
 * a spy on `fs.open` - a refusal that still opened the file is not a refusal.
 */

import { promises as fsp } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { previewArtifact, type ArtifactHostEffects } from '@process/services/artifacts/artifactActions';
import {
  artifactLedgerPath,
  readArtifactLedger,
  registerArtifacts,
  type ArtifactRecord,
} from '@process/services/artifacts/artifactLedger';

let root = '';
let workspace = '';
let ledgerPath = '';
let openSpy: ReturnType<typeof vi.spyOn>;

/** Register one real file through the real validator. */
async function registerOne(relative: string, body: Buffer | string): Promise<ArtifactRecord> {
  const target = path.join(workspace, ...relative.split('/'));
  await fsp.mkdir(path.dirname(target), { recursive: true });
  await fsp.writeFile(target, body);
  const result = await registerArtifacts({
    ledgerPath,
    workspace,
    runDir: workspace,
    taskId: 'chat:c1',
    runId: 'c1',
    declaredBy: 'Preview Test',
    declarations: [{ path: relative }],
  });
  expect(result.rejected).toEqual([]);
  return result.registered[0];
}

const effectsWith = (overrides: Partial<ArtifactHostEffects> = {}): ArtifactHostEffects => ({
  readLedger: () => readArtifactLedger(ledgerPath),
  confine: async (target: string) => target,
  launch: async () => ({ ok: true }),
  reveal: async () => ({ ok: true }),
  chooseSaveDestination: async () => null,
  ...overrides,
});

beforeEach(async () => {
  root = await fsp.realpath(await fsp.mkdtemp(path.join(os.tmpdir(), 'wl-preview-')));
  workspace = path.join(root, 'workspace');
  await fsp.mkdir(workspace, { recursive: true });
  ledgerPath = artifactLedgerPath(path.join(root, 'data'));
  await fsp.mkdir(path.dirname(ledgerPath), { recursive: true });
  // The spy WRAPS the real implementation, so registration still works and the
  // count is genuinely "did the preview path open this file".
  openSpy = vi.spyOn(fsp, 'open');
});

afterEach(async () => {
  openSpy.mockRestore();
  await fsp.rm(root, { recursive: true, force: true });
});

/** Opens of the artifact itself, ignoring whatever registration already did. */
const opensOf = (target: string): number =>
  openSpy.mock.calls.filter((call) => String(call[0]) === target).length;

describe('previewArtifact returns real bytes for a real deliverable', () => {
  it('reads the head of a text deliverable and says it truncated', async () => {
    // 5000 bytes: over the 4096-byte head, under every size cap.
    const body = 'x'.repeat(5000);
    const record = await registerOne('artifacts/chat/c1/notes.md', body);

    const preview = await previewArtifact(record.artifactId, effectsWith());

    expect(preview.kind).toBe('text');
    if (preview.kind !== 'text') throw new Error('unreachable');
    expect(preview.truncated).toBe(true);
    expect(preview.text.length).toBe(4096);
    expect(preview.text.startsWith('xxx')).toBe(true);
  });

  it('does not claim truncation for a file that fits', async () => {
    const record = await registerOne('artifacts/chat/c1/short.md', '# Brief\n\nhello');
    const preview = await previewArtifact(record.artifactId, effectsWith());
    expect(preview).toEqual({ kind: 'text', text: '# Brief\n\nhello', truncated: false });
  });

  it('never splits a multi-byte character across the truncation boundary', async () => {
    // 'é' is two bytes. 4095 ASCII bytes then one 'é' puts the split INSIDE it.
    const record = await registerOne('artifacts/chat/c1/accents.md', `${'a'.repeat(4095)}é`);
    const preview = await previewArtifact(record.artifactId, effectsWith());
    if (preview.kind !== 'text') throw new Error('expected text');
    expect(preview.text).not.toContain('�');
    expect(preview.text.length).toBe(4095);
    expect(preview.truncated).toBe(true);
  });

  it('returns an image as a data URL with the mapped MIME', async () => {
    // A real 1x1 PNG. Registered as bytes so the digest is over real content.
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    const record = await registerOne('artifacts/chat/c1/shot.PNG', png);
    const preview = await previewArtifact(record.artifactId, effectsWith());
    expect(preview.kind).toBe('image');
    if (preview.kind !== 'image') throw new Error('unreachable');
    expect(preview.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(Buffer.from(preview.dataUrl.split(',')[1], 'base64').equals(png)).toBe(true);
  });

  it('answers unavailable for an id the ledger does not know', async () => {
    await registerOne('artifacts/chat/c1/notes.md', 'hi');
    const preview = await previewArtifact('0'.repeat(32), effectsWith());
    expect(preview).toEqual({ kind: 'none', reason: 'unavailable' });
  });
});

describe('previewArtifact refuses BEFORE it reads, and the file proves it', () => {
  /**
   * The size guard's whole value is that the file is never opened. A fake 5 MB
   * record over a small file would make this mutation a no-op - with the guard
   * removed the SIZE MISMATCH would refuse anyway and the test would stay
   * green. So the file on disk is really 5 MB and its digest really matches:
   * without the guard this preview SUCCEEDS.
   */
  it('refuses a 5 MB deliverable that would otherwise verify, without opening it', async () => {
    const record = await registerOne('artifacts/chat/c1/huge.md', 'y'.repeat(5 * 1024 * 1024));
    const target = path.join(workspace, 'artifacts', 'chat', 'c1', 'huge.md');
    expect(record.sizeBytes).toBe(5 * 1024 * 1024);
    openSpy.mockClear();

    const preview = await previewArtifact(record.artifactId, effectsWith());

    expect(preview).toEqual({ kind: 'none', reason: 'too-large' });
    expect(opensOf(target)).toBe(0);
  });

  it('refuses an image over the tighter image cap, without opening it', async () => {
    // Under the 4 MB source cap, over the 1 MB image cap: only the image-
    // specific limit can refuse this one.
    const record = await registerOne('artifacts/chat/c1/big.png', Buffer.alloc(2 * 1024 * 1024, 7));
    const target = path.join(workspace, 'artifacts', 'chat', 'c1', 'big.png');
    openSpy.mockClear();

    const preview = await previewArtifact(record.artifactId, effectsWith());

    expect(preview).toEqual({ kind: 'none', reason: 'too-large' });
    expect(opensOf(target)).toBe(0);
  });

  it('refuses when host confinement refuses, and never reads the bytes', async () => {
    const record = await registerOne('artifacts/chat/c1/notes.md', 'secret');
    const target = path.join(workspace, 'artifacts', 'chat', 'c1', 'notes.md');
    const confine = vi.fn(async () => null);
    openSpy.mockClear();

    const preview = await previewArtifact(record.artifactId, effectsWith({ confine }));

    expect(preview).toEqual({ kind: 'none', reason: 'unavailable' });
    expect(confine).toHaveBeenCalledWith(target);
    expect(opensOf(target)).toBe(0);
  });

  /**
   * The reachable shape of the hole confinement closes. `isCanonicalWorkspace`
   * accepts ANY well-formed absolute path, so the ledger is not the
   * authorized-root gate - a record naming a root outside every granted root
   * parses fine and would have had its bytes read and handed to the renderer.
   * `confine` is the only thing between that record and the file.
   */
  it('refuses a record whose workspace is a well-formed root outside every granted root', async () => {
    const outside = path.join(root, 'outside');
    await fsp.mkdir(outside, { recursive: true });
    await fsp.writeFile(path.join(outside, 'stolen.md'), 'private');
    const good = await registerOne('artifacts/chat/c1/notes.md', 'hi');
    // Valid in every respect except that its workspace is not a granted root.
    const hostile = {
      ...good,
      artifactId: 'f'.repeat(32),
      workspace: outside,
      relativePath: 'stolen.md',
      sizeBytes: 7,
      sha256: (await import('crypto')).createHash('sha256').update('private').digest('hex'),
    };
    await fsp.appendFile(ledgerPath, `${JSON.stringify(hostile)}\n`, 'utf8');
    // A confinement that grants the workspace and nothing else - the real one.
    const confine = async (target: string) => (target.startsWith(`${workspace}${path.sep}`) ? target : null);
    openSpy.mockClear();

    const preview = await previewArtifact('f'.repeat(32), effectsWith({ confine }));

    expect(preview).toEqual({ kind: 'none', reason: 'unavailable' });
    expect(opensOf(path.join(outside, 'stolen.md'))).toBe(0);
  });
});

describe('previewArtifact keeps verification, it does not work around it', () => {
  it('reports a hand-edited file as changed rather than showing the new bytes', async () => {
    const record = await registerOne('artifacts/chat/c1/notes.md', 'original');
    await fsp.writeFile(path.join(workspace, 'artifacts', 'chat', 'c1', 'notes.md'), 'tampered!!');

    const preview = await previewArtifact(record.artifactId, effectsWith());

    expect(preview).toEqual({ kind: 'none', reason: 'changed' });
  });

  it('reports a deliverable whose bytes changed WITHOUT changing size as changed', async () => {
    // Same length, different content: only the digest can catch this one.
    const record = await registerOne('artifacts/chat/c1/notes.md', 'original');
    await fsp.writeFile(path.join(workspace, 'artifacts', 'chat', 'c1', 'notes.md'), 'ORIGINAL');

    const preview = await previewArtifact(record.artifactId, effectsWith());

    expect(preview).toEqual({ kind: 'none', reason: 'changed' });
  });

  it('reports a deliverable that is gone as unavailable, not as changed', async () => {
    const record = await registerOne('artifacts/chat/c1/notes.md', 'original');
    await fsp.rm(path.join(workspace, 'artifacts', 'chat', 'c1', 'notes.md'));

    const preview = await previewArtifact(record.artifactId, effectsWith());

    expect(preview).toEqual({ kind: 'none', reason: 'unavailable' });
  });
});

describe('previewArtifact never lets markup or binary reach the preview band', () => {
  it.each(['diagram.svg', 'DIAGRAM.SVG', 'archive.svgz'])('refuses %s as unsupported, never as an image', async (name) => {
    const record = await registerOne(`artifacts/chat/c1/${name}`, '<svg xmlns="http://www.w3.org/2000/svg"/>');
    const preview = await previewArtifact(record.artifactId, effectsWith());
    expect(preview).toEqual({ kind: 'none', reason: 'unsupported-type' });
  });

  it('shows an HTML deliverable as its SOURCE, in the text arm', async () => {
    // The other half of the same decision: markup is never rendered, but a
    // report the user asked for must still show its first lines.
    const record = await registerOne('artifacts/chat/c1/brief.html', '<h1>Brief</h1>');
    const preview = await previewArtifact(record.artifactId, effectsWith());
    expect(preview).toEqual({ kind: 'text', text: '<h1>Brief</h1>', truncated: false });
  });

  it('sniffs a PDF as binary rather than printing its header', async () => {
    const pdf = Buffer.concat([Buffer.from('%PDF-1.7\n%\xe2\xe3\xcf\xd3\n', 'binary'), Buffer.alloc(64, 0)]);
    const record = await registerOne('artifacts/chat/c1/report.pdf', pdf);
    const preview = await previewArtifact(record.artifactId, effectsWith());
    expect(preview).toEqual({ kind: 'none', reason: 'binary' });
  });

  it('sniffs invalid UTF-8 as binary even with no NUL byte in it', async () => {
    // Lone continuation bytes: no NUL, so only the decode can catch this.
    const record = await registerOne('artifacts/chat/c1/blob.md', Buffer.from([0x80, 0x81, 0x82, 0xfe, 0xff]));
    const preview = await previewArtifact(record.artifactId, effectsWith());
    expect(preview).toEqual({ kind: 'none', reason: 'binary' });
  });

  it('keeps the text preview for a CSV, which is plain text', async () => {
    const record = await registerOne('artifacts/chat/c1/rows.csv', 'a,b\n1,2\n');
    const preview = await previewArtifact(record.artifactId, effectsWith());
    expect(preview).toEqual({ kind: 'text', text: 'a,b\n1,2\n', truncated: false });
  });

  it('keeps the text preview for UTF-8 that only LOOKS exotic', async () => {
    // The known NEGATIVE for the sniff. Without it, a sniff that flagged every
    // non-ASCII byte would pass every assertion above.
    const record = await registerOne('artifacts/chat/c1/emoji.md', '# Résumé 🚀 日本語\n');
    const preview = await previewArtifact(record.artifactId, effectsWith());
    expect(preview).toEqual({ kind: 'text', text: '# Résumé 🚀 日本語\n', truncated: false });
  });
});
