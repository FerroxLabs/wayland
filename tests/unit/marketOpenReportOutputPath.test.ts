import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

/**
 * The morning-report workflow was self-contradictory: its own SKILL.md told
 * the agent to write deliverables to an app-owned directory outside the
 * workspace (`~/wayland/outbox/market/`), while also telling it that
 * everything outside the workspace is refused by the sandbox. With nowhere
 * legal to write, the agent fell back to writing beside its own script inside
 * `.wayland-core/skills/market-open-report/` - a dot directory the workspace
 * scanners (`fsBridge.ts`, `fileWatchBridge.ts`) deliberately skip. The result:
 * a real deliverable that is invisible in the Workbench panel.
 *
 * These tests read the actual bundled content (not a copy) so a future edit
 * that reintroduces an out-of-workspace or dot-directory default fails here
 * instead of on a user's machine.
 */
const REPO_ROOT = path.resolve(__dirname, '../..');

/** Extract the output-directory default declared as "... (default `PATH`)". */
function extractDeclaredDefault(markdown: string): string {
  const match = markdown.match(/default\s+`([^`]+)`/);
  if (!match) {
    throw new Error('No output-directory default declared as "(default `PATH`)" was found');
  }
  return match[1];
}

/**
 * A deliverable path is safe for the Workbench only if it is: workspace-
 * relative (not home-relative, not absolute), contains no dot-prefixed
 * segment (dot directories are hidden from the file scanners), and lives
 * under the workspace's `artifacts/` directory.
 */
function assertWorkspaceSafeArtifactPath(declaredPath: string): void {
  expect(declaredPath.startsWith('~')).toBe(false);
  expect(path.isAbsolute(declaredPath)).toBe(false);

  const segments = declaredPath.split('/').filter(Boolean);
  expect(segments.some((segment) => segment.startsWith('.'))).toBe(false);
  expect(segments[0]).toBe('artifacts');
}

describe('bundled market-report deliverables stay inside <workspace>/artifacts/', () => {
  it('wayland-morning-report SKILL.md declares an in-workspace artifacts/ default', () => {
    const md = readFileSync(
      path.join(REPO_ROOT, 'src/process/resources/bundled-workflows/bodies/wayland-morning-report/SKILL.md'),
      'utf-8'
    );
    assertWorkspaceSafeArtifactPath(extractDeclaredDefault(md));
  });

  it('market-open-report SKILL.md declares an in-workspace artifacts/ default', () => {
    const md = readFileSync(path.join(REPO_ROOT, 'src/process/resources/skills/market-open-report/SKILL.md'), 'utf-8');
    assertWorkspaceSafeArtifactPath(extractDeclaredDefault(md));
  });

  it('the Smart Trader persona declares an in-workspace artifacts/ default', () => {
    const md = readFileSync(path.join(REPO_ROOT, 'src/process/resources/assistant/smart-trader/smart-trader.md'), 'utf-8');
    assertWorkspaceSafeArtifactPath(extractDeclaredDefault(md));
  });

  it('the weekday-morning-report routine passes an in-workspace output_dir default', () => {
    const routines = JSON.parse(
      readFileSync(path.join(REPO_ROOT, 'src/process/resources/bundled-workflows/routines.json'), 'utf-8')
    ) as Array<{ id: string; inputs?: Record<string, string> }>;
    const routine = routines.find((r) => r.id === 'weekday-morning-report');
    expect(routine).toBeDefined();
    expect(routine?.inputs?.output_dir).toBeDefined();
    assertWorkspaceSafeArtifactPath(routine!.inputs!.output_dir!);
  });
});
