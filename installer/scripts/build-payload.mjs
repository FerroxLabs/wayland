#!/usr/bin/env node
/**
 * Assemble the publishable `getwayland` payload from the app build.
 *
 *   1. build the web renderer + the headless server bundle (in ../../)
 *   2. copy dist-server/ and out/renderer/ into ./payload/
 *   3. sync the package version to the app version
 *
 * Run from app/installer:  node scripts/build-payload.mjs   (then `npm publish`)
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = resolve(HERE, '..');
const APP = resolve(PKG, '..'); // app/
const PAYLOAD = join(PKG, 'payload');

function run(cmd, args) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd: APP, stdio: 'inherit' });
  if (r.status !== 0) { console.error(`✗ ${cmd} ${args.join(' ')} failed`); process.exit(1); }
}

console.log('Building Wayland headless payload…');
run('bun', ['run', 'build:renderer:web']);
run('bun', ['run', 'build:server']);
// Builtin MCP stdio servers (team_*, image-gen, search-skills). Built to
// out/main/; copied beside the server bundle below so the headless
// resolveMcpScriptDir() (= the bundle's own dir) finds them.
run('node', ['scripts/build-mcp-servers.js']);

const distServer = join(APP, 'dist-server');
const renderer = join(APP, 'out', 'renderer');
for (const [p, label] of [[distServer, 'dist-server'], [renderer, 'out/renderer']]) {
  if (!existsSync(p)) { console.error(`✗ expected build output missing: ${label} (${p})`); process.exit(1); }
}

rmSync(PAYLOAD, { recursive: true, force: true });
mkdirSync(join(PAYLOAD, 'out'), { recursive: true });
cpSync(distServer, join(PAYLOAD, 'dist-server'), { recursive: true });
cpSync(renderer, join(PAYLOAD, 'out', 'renderer'), { recursive: true });

// MCP stdio scripts: built into out/main/, must sit beside the server bundle
// (payload/dist-server) so the startup canary + team tools resolve them.
const outMain = join(APP, 'out', 'main');
const isMcpScript = (f) =>
  /^(builtin-mcp-.+|team-mcp-stdio|team-guide-mcp-stdio)\.(js|mjs)$/.test(f) || f === 'eventkit-bridge';
const mcpScripts = existsSync(outMain) ? readdirSync(outMain).filter(isMcpScript) : [];
for (const f of mcpScripts) cpSync(join(outMain, f), join(PAYLOAD, 'dist-server', f));
const REQUIRED_MCP = ['builtin-mcp-image-gen.js', 'builtin-mcp-search-skills.js', 'team-mcp-stdio.js', 'team-guide-mcp-stdio.js'];
const missingMcp = REQUIRED_MCP.filter((f) => !mcpScripts.includes(f));
if (missingMcp.length) { console.error(`✗ MCP build incomplete, missing: ${missingMcp.join(', ')}`); process.exit(1); }
console.log(`  + ${mcpScripts.length} MCP scripts → payload/dist-server`);

// Builtin resource trees the server resolves under payload/src/process/resources/.
// (skills + assistant + skills-library + bundled-workflows; matches what the
// desktop ships via viteStaticCopy + extraResources.)
const resSrc = join(APP, 'src', 'process', 'resources');
const resDst = join(PAYLOAD, 'src', 'process', 'resources');
const RESOURCE_DIRS = ['skills', 'assistant', 'skills-library', 'bundled-workflows'];
for (const name of RESOURCE_DIRS) {
  const s = join(resSrc, name);
  if (!existsSync(s)) { console.error(`✗ resource dir missing in source: ${name} (${s})`); process.exit(1); }
  cpSync(s, join(resDst, name), { recursive: true });
}
console.log(`  + resources (${RESOURCE_DIRS.join(', ')}) → payload/src/process/resources`);

// Sync version to the app.
const appPkg = JSON.parse(readFileSync(join(APP, 'package.json'), 'utf8'));
const myPkgPath = join(PKG, 'package.json');
const myPkg = JSON.parse(readFileSync(myPkgPath, 'utf8'));
myPkg.version = appPkg.version;
writeFileSync(myPkgPath, JSON.stringify(myPkg, null, 2) + '\n');

console.log(`\n✓ payload assembled (v${appPkg.version}) → ${PAYLOAD}`);
console.log('  Publish:  cd app/installer && npm publish --access public');
