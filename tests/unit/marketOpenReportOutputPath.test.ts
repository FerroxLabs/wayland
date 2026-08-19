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
const BUNDLED_ASSISTANT = path.join(REPO_ROOT, 'src/process/resources/assistant');
const BUNDLED_SKILLS_LIBRARY = path.join(REPO_ROOT, 'src/process/resources/skills-library');

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
      ...collectFiles(BUNDLED_ASSISTANT, ['.md']),
      ...collectFiles(BUNDLED_SKILLS_LIBRARY, ['.md']),
    ];
    // Guard against a silent SHRINK, not just a silent zero. The shipped corpus
    // is ~2.3k files (`scripts/build-skill-pack.ts` packs skills-library and
    // bundled-workflows; skills/ and assistant/ ship as loose resources). A
    // guard of >50 passed at 182 while the sweep quietly excluded 92% of it.
    expect(files.length).toBeGreaterThan(2000);

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

/**
 * ---------------------------------------------------------------------------
 * WHERE the path RESOLVES, not what the string looks like.
 *
 * `assertWorkspaceSafeArtifactPath('artifacts/market/')` passes on a bare
 * relative path with no anchor. That is a STRING SHAPE assertion: it is
 * identically green whether the agent is standing in the workspace root or
 * inside `.wayland-core/skills/market-open-report`, which the same documents'
 * command blocks tell it to `cd` into. Resolved after that `cd`, a bare
 * `artifacts/market/` lands at
 * `<workspace>/.wayland-core/skills/market-open-report/artifacts/market/` -
 * inside the very dot directory `fsBridge.ts` and `fileWatchBridge.ts` skip.
 * That is the original defect verbatim.
 *
 * The engine spawns the agent with `cwd: workspace`
 * (src/process/agent/wcore/index.ts:643; the ACP path does the same with
 * `workingDir`), and sets no workspace env var, so `$PWD` at the start of a
 * command block IS the workspace root. Anchoring the output directory to
 * `$PWD` BEFORE the `cd` is therefore what makes the resolved location
 * correct, and it is what this test requires.
 * ---------------------------------------------------------------------------
 */


const SHELL_FENCE = /^(bash|sh|shell|zsh|console|terminal)$/i;

/** Line numbers (1-based) of every line that sits inside a shell fence. */
function shellFenceLines(markdown: string): Array<{ line: number; text: string }> {
  const out: Array<{ line: number; text: string }> = [];
  let inShell = false;
  markdown.split('\n').forEach((raw, i) => {
    const fence = raw.match(/^\s*```(\S*)/);
    if (fence) {
      inShell = inShell ? false : SHELL_FENCE.test(fence[1]);
      return;
    }
    if (inShell) out.push({ line: i + 1, text: raw });
  });
  return out;
}

/**
 * `tvcontrol-setup` is exempt for the same reason it is exempt from the
 * "app-owned" rule: TradingView's `watchlist_import` validator refuses any path
 * that does not resolve under the home directory or the OS temp dir, so its
 * `<OUT>` is deliberately NOT a workspace artifact and must not be anchored to
 * the workspace root.
 */
const OUT_ANCHOR_EXEMPTIONS = new Set(['tvcontrol-setup/SKILL.md']);

describe('a documented output directory resolves against the workspace root, not the cwd after a cd', () => {
  it('every bundled doc that uses <OUT>/$OUT anchors it to $PWD before any cd', () => {
    const files = [
      ...collectFiles(BUNDLED_WORKFLOWS, ['.md']),
      ...collectFiles(BUNDLED_SKILLS, ['.md']),
      ...collectFiles(BUNDLED_ASSISTANT, ['.md']),
    ];
    expect(files.length).toBeGreaterThan(50);

    const offenders: string[] = [];
    for (const file of files) {
      const rel = path.relative(REPO_ROOT, file);
      if ([...OUT_ANCHOR_EXEMPTIONS].some((exempt) => rel.endsWith(exempt))) continue;
      const markdown = readFileSync(file, 'utf-8');
      const shell = shellFenceLines(markdown);

      const uses = shell.filter((l) => /<OUT>|\$\{?OUT\b/.test(l.text));
      if (uses.length === 0) continue;

      // The anchor must be IN the command block, not merely described in prose:
      // prose cannot be executed, and a block that lost its anchor while the
      // prose survived is exactly the regression this guards.
      const anchors = shell.filter((l) => /\bOUT="?\$\{?PWD\}?\//.test(l.text));

      if (anchors.length === 0) {
        offenders.push(`${rel}: uses <OUT> at line ${uses[0].line} but never anchors it to $PWD`);
        continue;
      }
      const firstAnchor = anchors[0].line;
      if (firstAnchor > uses[0].line) {
        offenders.push(`${rel}: anchors OUT at line ${firstAnchor}, after its first use at line ${uses[0].line}`);
      }
      const cdBeforeAnchor = shell.filter((l) => /(^|[;&|]\s*)cd\s+\S/.test(l.text) && l.line < firstAnchor);
      for (const cd of cdBeforeAnchor) {
        offenders.push(
          `${rel}:${cd.line}: cd runs BEFORE OUT is anchored at line ${firstAnchor} - "${cd.text.trim().slice(0, 80)}"`
        );
      }
    }
    expect(offenders).toEqual([]);
  });
});

/**
 * ---------------------------------------------------------------------------
 * The out-of-workspace WRITE, structurally.
 *
 * The "app-owned" assertion above closes one PHRASE. This closes the CLASS it
 * is an instance of: a bundled document whose own shell instructions create or
 * write a path outside the workspace, which the sandbox refuses. Shell lives in
 * two places in this corpus - fenced blocks and inline `code` spans - and the
 * live offender (star-office-helper) is in an inline span, so both are read.
 * ---------------------------------------------------------------------------
 */

/** True for a path token that resolves outside the workspace. `/dev/*` is not a file write. */
function resolvesOutsideWorkspace(token: string): boolean {
  if (token.startsWith('/dev/')) return false;
  return /^(?:~\/|~$|\$HOME|\$\{HOME\}|\/)/.test(token);
}

/** Shell-ish text in a markdown doc: fenced shell blocks plus inline `code` spans. */
function shellCandidates(markdown: string): Array<{ line: number; text: string }> {
  const out = shellFenceLines(markdown);
  markdown.split('\n').forEach((raw, i) => {
    for (const m of raw.matchAll(/`([^`]+)`/g)) {
      // Only spans that actually read as a command, not prose in backticks.
      if (/(^|[;&|]\s*)(cd|mkdir|cp|tee|git\s+clone|npm\s+install)\s/.test(m[1])) {
        out.push({ line: i + 1, text: m[1] });
      }
    }
  });
  return out;
}

/** Every out-of-workspace write target a shell line creates. */
function outOfWorkspaceWriteTargets(rawLine: string): string[] {
  const line = rawLine.replace(/#.*$/, '');
  const command = line.trim();
  const targets: string[] = [];
  const push = (t: string): void => {
    if (resolvesOutsideWorkspace(t)) targets.push(t);
  };

  // Redirection. Require whitespace before `>` so `<OUT>/x` and `<w:p>/` (an
  // XML/XPath fragment, not a redirect) are not misread as one.
  for (const m of line.matchAll(/(?:^|\s)>>?\s*"?([^\s"'`;)|&]+)/g)) push(m[1]);

  // mkdir: every non-flag argument is created.
  if (/^(?:sudo\s+)?mkdir\b/.test(command)) {
    for (const token of command.split(/\s+/).slice(1)) if (!token.startsWith('-')) push(token);
  }
  // tee: only the arguments after `tee` are written.
  const tee = line.match(/\btee\b(.*)$/);
  if (tee) for (const token of tee[1].trim().split(/\s+/)) if (token && !token.startsWith('-')) push(token);

  // cp / git clone: the destination is the last non-flag argument.
  if (/^(?:sudo\s+)?cp\b/.test(command) || /\bgit\s+clone\b/.test(command)) {
    const tokens = command.split(/\s+/).filter((t) => !t.startsWith('-'));
    const last = tokens[tokens.length - 1];
    if (last) push(last);
  }

  // `cd` outside the workspace: every write that follows lands outside too.
  for (const m of line.matchAll(/(?:^|[;&|]\s*)cd\s+"?([^\s"'`;)|&]+)/g)) push(m[1]);

  return [...new Set(targets)];
}

/**
 * Out-of-workspace writes that are DELIBERATE, keyed `<path suffix>::<target>`
 * so a new offending target in an already-listed file still fails. Every entry
 * names why the path cannot be a workspace artifact.
 */
const OUT_OF_WORKSPACE_WRITE_ALLOWLIST = new Map<string, string>([
  // Third-party agent config stores - the other tool reads them from its own
  // fixed location, so a workspace copy would never be found.
  ['skills/moltbook/SKILL.md::~/.moltbot/skills/moltbook', 'moltbot reads its skills from its own config dir'],
  ['skills/moltbook/SKILL.md::~/.moltbot/skills/moltbook/SKILL.md', 'moltbot skill store'],
  ['skills/moltbook/SKILL.md::~/.moltbot/skills/moltbook/HEARTBEAT.md', 'moltbot skill store'],
  ['skills/moltbook/SKILL.md::~/.moltbot/skills/moltbook/MESSAGING.md', 'moltbot skill store'],
  ['skills/moltbook/SKILL.md::~/.moltbot/skills/moltbook/package.json', 'moltbot skill store'],
  ['skills/moltbook/HEARTBEAT.md::~/.moltbot/skills/moltbook/SKILL.md', 'moltbot skill store'],
  ['skills/moltbook/HEARTBEAT.md::~/.moltbot/skills/moltbook/HEARTBEAT.md', 'moltbot skill store'],
  ['assistant/moltbook/moltbook.md::~/.config/moltbook/credentials.json', 'reads the user credential store; the copy target is workspace-relative'],
  ['assistant/moltbook/moltbook-skills.md::~/.config/moltbook/credentials.json', 'reads the user credential store; the copy target is workspace-relative'],
  ['skills/openclaw-setup/references/usage.md::~/.openclaw/workspace/AGENTS.md', 'openclaw reads its own workspace dir'],
  ['skills/openclaw-setup/references/usage.md::~/.openclaw/workspace/SOUL.md', 'openclaw reads its own workspace dir'],
  ['skills/openclaw-setup/references/usage.md::~/.openclaw/workspace/TOOLS.md', 'openclaw reads its own workspace dir'],
  ['skills/openclaw-setup/references/best-practices.md::~/.openclaw/workspace', 'openclaw reads its own workspace dir'],
  ['skills/openclaw-setup/references/uninstallation.md::~/.openclaw.backup', 'backup of the openclaw config store before removing it'],
  // Third-party APPLICATION install root, created by this skill's own setup
  // script (`INSTALL_DIR:-$HOME/Star-Office-UI`). It is a service checkout the
  // user runs, not a Workbench deliverable.
  ['skills/star-office-helper/SKILL.md::~/Star-Office-UI', 'third-party app install root created by star_office_setup.sh'],
  ['skills/star-office-helper/SKILL.md::~/Star-Office-UI/backend', 'third-party app install root'],
  ['skills/star-office-helper/SKILL.md::~/Star-Office-UI/frontend', 'third-party app install root'],
  // skills-library: generic third-party how-to content teaching host sysadmin
  // and shell-config practice. These document the READER's own machine, not a
  // Wayland deliverable path.
  ['skills-library/bodies/skills/devops-cloud/linux-admin/SKILL.md::/shared/team', 'Linux permissions tutorial on the reader host'],
  ['skills-library/bodies/skills/devops-cloud/linux-admin/SKILL.md::/data', 'Linux filesystem tutorial on the reader host'],
  ['skills-library/bodies/skills/writing/how-to-guide/SKILL.md::/var/backups/postgresql', 'sample how-to prose, not an executed instruction'],
  ['skills-library/bodies/skills/software-engineering/cron-scheduler/SKILL.md::~/crontab-backup-$(date', 'backs up the host crontab, which lives outside any workspace'],
  ['skills-library/bodies/skills/software-engineering/terminal-productivity-boost/SKILL.md::~/notes.md', 'shell-config tutorial on the reader host'],
  ['skills-library/bodies/skills/software-engineering/terminal-productivity-boost/SKILL.md::~/.fzf', 'installs fzf into the reader shell'],
]);

describe('no bundled shell instruction writes outside the workspace', () => {
  it('every out-of-workspace write in bundled markdown is on the documented allowlist', () => {
    const files = [
      ...collectFiles(BUNDLED_WORKFLOWS, ['.md']),
      ...collectFiles(BUNDLED_SKILLS, ['.md']),
      ...collectFiles(BUNDLED_ASSISTANT, ['.md']),
      ...collectFiles(BUNDLED_SKILLS_LIBRARY, ['.md']),
    ];
    expect(files.length).toBeGreaterThan(2000);

    const offenders: string[] = [];
    for (const file of files) {
      const rel = path.relative(REPO_ROOT, file);
      for (const { line, text } of shellCandidates(readFileSync(file, 'utf-8'))) {
        for (const target of outOfWorkspaceWriteTargets(text)) {
          const key = [...OUT_OF_WORKSPACE_WRITE_ALLOWLIST.keys()].find(
            (k) => k === `${rel.replace(/^src\/process\/resources\//, '')}::${target}`
          );
          if (key) continue;
          offenders.push(`${rel}:${line}: writes ${target} - "${text.trim().slice(0, 90)}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
