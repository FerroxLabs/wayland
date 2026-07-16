import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);

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

function bridgePaths(files: string[], terminal: 'invoke' | 'provider'): Set<string> {
  const paths = new Set<string>();
  const pattern = new RegExp(`ipcBridge\\.([A-Za-z0-9_.]+)\\.${terminal}\\b`, 'g');
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(pattern)) paths.add(match[1]);
  }
  return paths;
}

describe('renderer IPC reachability', () => {
  it('backs every renderer invocation with a main-process provider or an explicit unified alias', () => {
    const rendererInvocations = bridgePaths(sourceFiles(path.join(process.cwd(), 'src/renderer')), 'invoke');
    const processProviders = bridgePaths(
      [
        ...sourceFiles(path.join(process.cwd(), 'src/process')),
        path.join(process.cwd(), 'src/index.ts'),
        path.join(process.cwd(), 'src/server.ts'),
      ],
      'provider'
    );
    const unifiedAliases = new Map<string, string>([
      ['acpConversation.sendMessage', 'conversation.sendMessage'],
      ['geminiConversation.sendMessage', 'conversation.sendMessage'],
      ['openclawConversation.sendMessage', 'conversation.sendMessage'],
    ]);

    const unreachable = [...rendererInvocations].filter((invocation) => {
      if (processProviders.has(invocation)) return false;
      const canonical = unifiedAliases.get(invocation);
      return !canonical || !processProviders.has(canonical);
    });

    expect(unreachable.sort()).toEqual([]);
    expect(rendererInvocations.size).toBeGreaterThan(200);
    expect(processProviders.size).toBeGreaterThan(200);
  });
});
