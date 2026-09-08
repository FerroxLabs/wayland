const fs = require('fs');
const path = require('path');
function allowsDmgRecovery(args, localVerification = false) {
  if (localVerification || /(?:^|\s)--dir(?:\s|$)/.test(args)) return false;
  const tokens = args.trim().split(/\s+/);
  const index = tokens.findIndex((t) => t === '--mac' || t === '-m' || t.startsWith('--mac='));
  if (index < 0) return tokens.includes('--all');
  const targets = tokens[index].includes('=') ? [tokens[index].split('=')[1]] : [];
  for (let i = index + 1; i < tokens.length && !tokens[i].startsWith('-'); i++) targets.push(tokens[i]);
  return targets.length === 0 || targets.includes('dmg');
}
function configureDmgEnvironment(outDir, env = process.env) {
  return {
    ...env,
    CUSTOM_DMGBUILD_PATH: path.join(__dirname, 'dmgbuildCheckedCopy.cjs'),
    WAYLAND_DMG_REPORT_DIR: path.join(outDir, 'dmg-packaging', `${Date.now()}-${process.pid}`),
  };
}
function deterministicDmgFailure(env) {
  try {
    return (
      JSON.parse(fs.readFileSync(path.join(env.WAYLAND_DMG_REPORT_DIR, 'failure.json'), 'utf8')).deterministic === true
    );
  } catch {
    return false;
  }
}
module.exports = { allowsDmgRecovery, configureDmgEnvironment, deterministicDmgFailure };
