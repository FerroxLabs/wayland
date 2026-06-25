#!/usr/bin/env node
/**
 * convert-team-bundle.mjs
 *
 * Converts the Wayland Teams skills bundle into canonical SKILL.md files,
 * and converts team assistants / agent profiles to AcpBackendConfig-shaped JSON.
 *
 * Usage:
 *   node scripts/convert-team-bundle.mjs [--bundle <path>] [--out <dir>]
 *   node scripts/convert-team-bundle.mjs personas [--assistants <path>] [--agents <path>] [--out <dir>]
 *
 * Defaults:
 *   --bundle      /Users/you/dev/waylandteams/contributes/skills.json
 *   --out         ./out/team-skills
 *   --assistants  /Users/you/dev/waylandteams/contributes/assistants.json
 *   --agents      (none)
 *   --out (personas mode)  ./out/team-personas
 *
 * Environment overrides (lower priority than CLI flags):
 *   TEAM_BUNDLE_PATH   path to skills.json
 *   TEAM_SKILLS_OUT    output directory
 *
 * Exit codes:
 *   0  success
 *   1  error (missing file, empty body, write failure)
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { argv } from 'node:process';

const DEFAULT_BUNDLE = '/Users/you/dev/waylandteams/contributes/skills.json';
const DEFAULT_OUT = './out/team-skills';

/** Convert a name string to kebab-case. */
export function toKebab(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Infer category from the file path in the bundle entry.
 * Path shape: "skills/<category>/<slug>.md"
 * Falls back to 'general' if the shape doesn't match.
 */
export function inferCategory(filePath) {
  const parts = filePath.split('/');
  // parts[0] = "skills", parts[1] = category, parts[2] = slug.md
  if (parts.length >= 3 && parts[0] === 'skills') {
    return parts[1];
  }
  return 'general';
}

/**
 * Build the YAML frontmatter block for a skill entry.
 */
export function buildFrontmatter(entry, category) {
  // Escape single quotes in string values by doubling them (YAML single-quoted style).
  const esc = (s) => s.replace(/'/g, "''");
  return [
    '---',
    `name: '${esc(entry.name)}'`,
    `description: '${esc(entry.description)}'`,
    `source: 'team'`,
    `category: '${esc(category)}'`,
    'security:',
    "  verdict: 'unscanned'",
    '  findings: []',
    '  scannedAt: 0',
    '  scannerVersion: 0',
    '  llmScanned: false',
    '---',
  ].join('\n');
}

/**
 * Core converter. Accepts explicit parameters so it can be called from tests
 * without touching the filesystem at the default paths.
 *
 * @param {object[]} entries          - Parsed skills.json array
 * @param {string}   teamsRoot        - Root directory of the teams bundle
 * @param {string}   outDir           - Output directory for SKILL.md files
 * @param {{ readBody?: (p: string) => string }} [opts]
 *   Optional overrides for I/O (used in tests).
 * @returns {{ count: number }}
 */
export function convertTeamBundle(entries, teamsRoot, outDir, opts = {}) {
  const readBody = opts.readBody ?? ((p) => readFileSync(p, 'utf8'));

  // Clean output dir for idempotency.
  if (existsSync(outDir)) {
    rmSync(outDir, { recursive: true, force: true });
  }
  mkdirSync(outDir, { recursive: true });

  for (const entry of entries) {
    const bodyPath = resolve(teamsRoot, entry.file);
    let body;
    try {
      body = readBody(bodyPath);
    } catch (err) {
      throw new Error(`Cannot read body for skill '${entry.name}' at '${bodyPath}': ${err.message}`);
    }

    if (!body || !body.trim()) {
      throw new Error(`Empty body for skill '${entry.name}' at '${bodyPath}'`);
    }

    const category = inferCategory(entry.file);
    const frontmatter = buildFrontmatter(entry, category);
    const skillDir = join(outDir, toKebab(entry.name));
    mkdirSync(skillDir, { recursive: true });

    const content = `${frontmatter}\n\n${body.trim()}\n`;
    writeFileSync(join(skillDir, 'SKILL.md'), content, 'utf8');
  }

  return { count: entries.length };
}

const DEFAULT_ASSISTANTS = '/Users/you/dev/waylandteams/contributes/assistants.json';
const DEFAULT_PERSONAS_OUT = './out/team-personas';

/**
 * Convert team assistant entries to AcpBackendConfig-shaped objects and write
 * to `<outDir>/assistants.staged.json`. Idempotent (clean overwrite each run).
 *
 * @param {object[]} assistants - Array of team-bundle assistant entries.
 * @param {string}   outDir     - Output directory (created if missing).
 * @returns {{ count: number }}
 */
export function convertTeamAssistants(assistants, outDir) {
  mkdirSync(outDir, { recursive: true });

  const mapped = assistants.map((a) => {
    const entry = {
      isPreset: true,
      id: a.id,
      name: a.name,
      description: a.description,
    };
    if (a.avatar !== undefined) entry.avatar = a.avatar;
    if (a.presetAgentType !== undefined) entry.presetAgentType = a.presetAgentType;
    if (a.contextFile !== undefined) entry.contextFile = a.contextFile;
    if (a.enabledSkills !== undefined) entry.enabledSkills = a.enabledSkills;
    if (a.prompts !== undefined) entry.prompts = a.prompts;
    if (a.category !== undefined) entry.category = a.category;
    if (a.kind !== undefined) entry._kind = a.kind;
    return entry;
  });

  writeFileSync(join(outDir, 'assistants.staged.json'), JSON.stringify(mapped, null, 2), 'utf8');
  return { count: mapped.length };
}

/**
 * Convert agent-profile entries (parsed SKILL.md frontmatter + body) to
 * AcpBackendConfig-shaped objects and write to `<outDir>/agent-profiles.staged.json`.
 * Idempotent (clean overwrite each run).
 *
 * @param {object[]} profiles - Array of { name, description, metadata, body }.
 * @param {string}   outDir   - Output directory (created if missing).
 * @returns {{ count: number }}
 */
export function convertAgentProfiles(profiles, outDir) {
  mkdirSync(outDir, { recursive: true });

  const mapped = profiles.map((p) => ({
    isPreset: true,
    id: toKebab(p.name),
    name: p.name,
    description: p.description,
    avatar: undefined,
    presetAgentType: 'agent-profile',
    models: p.metadata?.model,
    prompts: { system: p.body },
    category: 'agent-profile',
  }));

  writeFileSync(
    join(outDir, 'agent-profiles.staged.json'),
    JSON.stringify(mapped, null, 2),
    'utf8',
  );
  return { count: mapped.length };
}

/** Parse CLI arguments. Returns { bundle, out }. */
function parseCli(args) {
  const result = {
    bundle: process.env.TEAM_BUNDLE_PATH ?? DEFAULT_BUNDLE,
    out: process.env.TEAM_SKILLS_OUT ?? DEFAULT_OUT,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--bundle' && args[i + 1]) result.bundle = args[++i];
    else if (args[i] === '--out' && args[i + 1]) result.out = args[++i];
  }
  return result;
}

/** Parse CLI arguments for the `personas` sub-command. */
function parsePersonasCli(args) {
  const result = {
    assistants: DEFAULT_ASSISTANTS,
    agents: null,
    out: DEFAULT_PERSONAS_OUT,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--assistants' && args[i + 1]) result.assistants = args[++i];
    else if (args[i] === '--agents' && args[i + 1]) result.agents = args[++i];
    else if (args[i] === '--out' && args[i + 1]) result.out = args[++i];
  }
  return result;
}

// ── CLI entry point ──────────────────────────────────────────────────────────

const isMain =
  typeof process !== 'undefined' &&
  argv[1] &&
  resolve(argv[1]) === resolve(new URL(import.meta.url).pathname);

if (isMain) {
  const [subCmd, ...rest] = argv.slice(2);

  if (subCmd === 'personas') {
    const { assistants: assistantsPath, agents: agentsPath, out } = parsePersonasCli(rest);

    if (existsSync(assistantsPath)) {
      try {
        const assistants = JSON.parse(readFileSync(assistantsPath, 'utf8'));
        const { count } = convertTeamAssistants(assistants, out);
        console.log(`[convert-team-bundle] Wrote ${count} assistant entries to '${out}/assistants.staged.json'`);
      } catch (err) {
        console.error(`[convert-team-bundle] Failed to convert assistants: ${err.message}`);
        process.exit(1);
      }
    } else {
      console.warn(`[convert-team-bundle] assistants file not found, skipping: '${assistantsPath}'`);
    }

    if (agentsPath) {
      if (existsSync(agentsPath)) {
        try {
          const profiles = JSON.parse(readFileSync(agentsPath, 'utf8'));
          const { count } = convertAgentProfiles(profiles, out);
          console.log(`[convert-team-bundle] Wrote ${count} agent-profile entries to '${out}/agent-profiles.staged.json'`);
        } catch (err) {
          console.error(`[convert-team-bundle] Failed to convert agent profiles: ${err.message}`);
          process.exit(1);
        }
      } else {
        console.warn(`[convert-team-bundle] agents file not found, skipping: '${agentsPath}'`);
      }
    }
  } else {
    // Default: skills bundle conversion (subCmd may be --bundle flag or undefined)
    const { bundle, out } = parseCli(subCmd ? [subCmd, ...rest] : rest);

    let entries;
    try {
      const raw = readFileSync(bundle, 'utf8');
      entries = JSON.parse(raw);
    } catch (err) {
      console.error(`[convert-team-bundle] Failed to read bundle at '${bundle}': ${err.message}`);
      process.exit(1);
    }

    const teamsRoot = dirname(dirname(bundle)); // skills.json is at <root>/contributes/skills.json

    try {
      const { count } = convertTeamBundle(entries, teamsRoot, out);
      console.log(`[convert-team-bundle] Wrote ${count} SKILL.md files to '${out}'`);
    } catch (err) {
      console.error(`[convert-team-bundle] ${err.message}`);
      process.exit(1);
    }
  }
}
