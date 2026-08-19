import { readdirSync, readFileSync } from 'fs';
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

/**
 * ---------------------------------------------------------------------------
 * The CLASS, not the instance.
 *
 * The morning-report defect was one instance of a general failure: bundled
 * content that instructs an agent to write somewhere the sandbox will refuse.
 * The three assertions below cover the whole bundled content set so the next
 * one fails here rather than on a user's machine.
 * ---------------------------------------------------------------------------
 */

const BUNDLED_WORKFLOWS = path.join(REPO_ROOT, 'src/process/resources/bundled-workflows');
const BUNDLED_SKILLS = path.join(REPO_ROOT, 'src/process/resources/skills');

/**
 * "app-owned" is the phrase that caused the bug: it tells the agent to write
 * outside the workspace, which the sandbox refuses, leaving it to fall back to
 * a hidden directory. Exactly one bundled skill may legitimately say it.
 *
 * tvcontrol-setup is exempt because TradingView's own `watchlist_import`
 * validator rejects any path that does not resolve under the home directory or
 * the OS temp dir ("Paths must resolve under home directory or system tmp").
 * That file is an INPUT handed to TradingView, not a Workbench deliverable.
 */
const APP_OWNED_EXEMPTIONS = new Set(['tvcontrol-setup/SKILL.md']);

function collectFiles(root: string, extensions: string[]): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (extensions.some((ext) => entry.name.endsWith(ext))) out.push(full);
    }
  };
  walk(root);
  return out;
}

describe('no bundled content sends a deliverable outside the workspace', () => {
  it('no bundled workflow or skill tells the agent to write to an "app-owned" location', () => {
    const files = [
      ...collectFiles(BUNDLED_WORKFLOWS, ['.md', '.json']),
      ...collectFiles(BUNDLED_SKILLS, ['.md']),
    ];
    // Guard against a silent zero: the sweep must actually be reading content.
    expect(files.length).toBeGreaterThan(50);

    const offenders: string[] = [];
    for (const file of files) {
      const rel = path.relative(REPO_ROOT, file);
      if ([...APP_OWNED_EXEMPTIONS].some((exempt) => rel.endsWith(exempt))) continue;
      const text = readFileSync(file, 'utf-8');
      text.split('\n').forEach((line, i) => {
        if (line.includes('app-owned')) offenders.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  /**
   * Keys whose value the routine hands the agent as a WRITE target. Established
   * by execution, not by reading names:
   *  - `output_dir` - the rendered HTML brief and `--json` land there.
   *  - `cache_dir`  - exported as `MARKET_OPEN_REPORT_CACHE`; `yahooData.mjs`
   *    calls `mkdirSync(cacheDir, {recursive:true})` + `writeFileSync` on it.
   * Every other routine input is read-only, so an out-of-workspace value there
   * is legal (the sandbox restricts writes, not reads).
   */
  const WRITE_TARGET_KEYS = new Set(['output_dir', 'cache_dir']);

  /**
   * Every home-relative (`~/`) routine input that is deliberately a READ. A new
   * `~/` path must be added here consciously, which is the point: this list
   * fails closed so an out-of-workspace WRITE cannot be introduced silently.
   */
  const DOCUMENTED_READ_ONLY_HOME_INPUTS = new Set([
    'daily-launch-status.active_launch_path',
    'daily-launch-status.data_dirs',
    'weekly-listing-audit.inventory_path',
    'weekly-content-batch.briefs_dir',
    'weekly-content-batch.voice_profile_path',
    'weekly-copy-review.copy_dir',
    'weekly-copy-review.voice_profile_path',
    'monday-cashflow.bank_csv_dir',
    'monday-cashflow.forecast_path',
    'monthly-budget-variance.actuals_dir',
    'monthly-budget-variance.budget_path',
    'weekly-competitor-watch.competitor_list_path',
    'weekly-competitor-watch.last_scan_path',
    'friday-weekly-review.data_dirs',
    'friday-weekly-review.prior_review_path',
    'month-end-review.data_dirs',
    'month-end-review.prior_review_path',
    'monthly-investor-update.data_dir',
    'monthly-investor-update.prior_update_path',
    'friday-pipeline-review.pipeline_dir',
    'weekday-morning-report.watchlist_path',
    'weekday-morning-report.positions_path',
    'weekly-support-review.tickets_dir',
    'weekly-support-review.sla_targets_path',
  ]);

  const routines = JSON.parse(
    readFileSync(path.join(BUNDLED_WORKFLOWS, 'routines.json'), 'utf-8')
  ) as Array<{ id: string; inputs?: Record<string, string> }>;

  it('no bundled routine hands the agent a write target outside the workspace', () => {
    expect(routines.length).toBeGreaterThan(5);

    const offenders: string[] = [];
    for (const routine of routines) {
      for (const [key, value] of Object.entries(routine.inputs ?? {})) {
        if (!WRITE_TARGET_KEYS.has(key)) continue;
        const segments = value.split('/').filter(Boolean);
        if (
          value.startsWith('~') ||
          path.isAbsolute(value) ||
          segments.some((segment) => segment.startsWith('.'))
        ) {
          offenders.push(`${routine.id}.${key} = ${value}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('every home-relative routine input is a documented read, never an undeclared write', () => {
    const undocumented: string[] = [];
    for (const routine of routines) {
      for (const [key, value] of Object.entries(routine.inputs ?? {})) {
        if (!value.includes('~/')) continue;
        const id = `${routine.id}.${key}`;
        if (!DOCUMENTED_READ_ONLY_HOME_INPUTS.has(id)) undocumented.push(`${id} = ${value}`);
      }
    }
    expect(undocumented).toEqual([]);
  });
});
