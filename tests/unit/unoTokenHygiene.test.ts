import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.css']);

/**
 * UnoCSS keys the palette on the bare token: `bg-1`, `text-1`, `border-1`
 * (uno.config.ts, backgroundColors / the text-[1-4] rule). Repeating the prefix
 * produces `bg-bg-1`, which matches no colour and no rule, so the generator
 * emits NOTHING - the class is silently inert and the element loses its colour
 * with no build error, no lint error and no runtime warning.
 *
 * That is not hypothetical: 150 such classes had accumulated across 46 files,
 * including the ones that made a workbench panel invisible. Nothing in the
 * toolchain can catch it, which is why it is caught here.
 */
const DOUBLED_PREFIX = /\b(bg|text|border)-\1(?=-|["'\s`])/;

function sourceFiles(root: string): string[] {
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(candidate);
      else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(candidate);
    }
  };
  visit(root);
  return files;
}

function doubledPrefixHits(files: string[]): string[] {
  const hits: string[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (DOUBLED_PREFIX.test(line)) hits.push(`${path.relative(process.cwd(), file)}:${index + 1}`);
    });
  }
  return hits;
}

describe('UnoCSS token hygiene', () => {
  it('flags a repeated palette prefix, so the detector is known to find a positive', () => {
    // Without this the suite could pass because the pattern matches nothing at all.
    expect(DOUBLED_PREFIX.test("className='bg-bg-2 p-4'")).toBe(true);
    expect(DOUBLED_PREFIX.test("className='border-border-1'")).toBe(true);
    expect(DOUBLED_PREFIX.test("className='text-text-3'")).toBe(true);
    expect(DOUBLED_PREFIX.test("className='border border-solid border-border bg-2'")).toBe(true);

    // ...and leaves the valid forms alone.
    expect(DOUBLED_PREFIX.test("className='bg-2 border-1 text-3 border-base'")).toBe(false);
    expect(DOUBLED_PREFIX.test("className='bg-fill-1 text-t-primary border-b-1'")).toBe(false);
  });

  it('has no inert repeated-prefix colour classes anywhere in the renderer', () => {
    expect(doubledPrefixHits(sourceFiles(path.join(process.cwd(), 'src/renderer')))).toEqual([]);
  });
});
