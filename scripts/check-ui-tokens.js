#!/usr/bin/env node
/**
 * UI token drift validator
 *
 * Catches the class of CSS-var bugs that caused the dark-mode legibility
 * regression: undefined token names like var(--text-tertiary) or
 * var(--fill-2) - they look defined but fall back to browser defaults
 * because the canonical names are var(--color-text-3) / var(--color-fill-2)
 * etc.
 *
 * Errors block the commit. Warnings (raw hex outside themes/) only print.
 *
 * Usage: node scripts/check-ui-tokens.js
 */

const fs = require('fs');
const path = require('path');

const RENDERER_DIR = path.resolve(__dirname, '../src/renderer');

// Banned token names + their canonical replacement. Each pattern fails the
// commit. Add a new row whenever a drift bug class is fixed in the codebase
// so it can't recur.
const BANNED_TOKENS = [
  { pattern: /var\(--text-tertiary\)/g, replace: 'var(--color-text-3)' },
  { pattern: /var\(--border-1\)/g, replace: 'var(--color-border-1)' },
  { pattern: /var\(--border-2\)/g, replace: 'var(--color-border-2)' },
  { pattern: /var\(--fill-1\)/g, replace: 'var(--color-fill-1)' },
  { pattern: /var\(--fill-2\)/g, replace: 'var(--color-fill-2)' },
  { pattern: /var\(--fill-3\)/g, replace: 'var(--color-fill-3)' },
  { pattern: /var\(--fill-4\)/g, replace: 'var(--color-fill-4)' },
  { pattern: /var\(--bg\)(?!-)/g, replace: 'var(--color-bg-1)' },
  { pattern: /var\(--border-strong\)/g, replace: 'var(--color-border-3)' },
];

// Files where hex literals are the source of truth, not drift.
// - styles/themes, arco-override, base, colors: canonical token definitions.
// - Titlebar OS-spec red/white (Windows close button) - UX spec, not theme.
// - Layout / main / ModelModalContent: console.log('%c…', 'color:#X') strings
//   style the F12 DevTools console; they never paint UI pixels.
// - ThoughtDisplay: gradient anchors swapped via theme const; theme-correct.
// - TestShowcase: palette/token visual demo page; hex is the demo content.
const HEX_ALLOWLIST = [
  /\/styles\/themes\//,
  /\/styles\/arco-override\.css$/,
  /\/styles\/base\.css$/,
  /\/styles\/colors\.ts$/,
  /\/components\/layout\/Titlebar\/titlebar\.css$/,
  /\/components\/layout\/Layout\.tsx$/,
  /\/renderer\/main\.tsx$/,
  /\/SettingsModal\/contents\/ModelModalContent\.tsx$/,
  /\/components\/chat\/ThoughtDisplay\.tsx$/,
  /\/pages\/TestShowcase\.tsx$/,
];

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

const errors = [];
const warnings = [];

function walk(dir, filter) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'out') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full, filter));
    } else if (filter(full)) {
      out.push(full);
    }
  }
  return out;
}

function lineNumberAt(content, index) {
  return content.slice(0, index).split('\n').length;
}

function checkBannedTokens(files) {
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const rel = path.relative(process.cwd(), file);
    for (const { pattern, replace } of BANNED_TOKENS) {
      for (const m of content.matchAll(pattern)) {
        errors.push(`${rel}:${lineNumberAt(content, m.index)}: undefined token "${m[0]}" - use "${replace}"`);
      }
    }
  }
}

// Strip block comments + JS line comments + var() fallback hex expressions
// so the hex scan only flags actually-rendered raw colors. The fallback
// inside `var(--token, #abc)` never paints when --token is defined; flagging
// it produced noise without surfacing real drift.
function stripFalsePositives(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/var\(\s*--[\w-]+\s*,\s*#[0-9a-fA-F]{3,8}\s*\)/g, '');
}

function checkRawHex(files) {
  for (const file of files) {
    if (HEX_ALLOWLIST.some((re) => re.test(file))) continue;
    const content = fs.readFileSync(file, 'utf-8');
    const stripped = stripFalsePositives(content);
    const rel = path.relative(process.cwd(), file);
    for (const m of stripped.matchAll(HEX_RE)) {
      warnings.push(`${rel}:${lineNumberAt(stripped, m.index)}: raw hex "${m[0]}"`);
    }
  }
}

function main() {
  console.log('\n🔍 UI token validator started');
  const files = walk(RENDERER_DIR, (f) => /\.(tsx?|css)$/.test(f));
  checkBannedTokens(files);
  checkRawHex(files);

  if (errors.length > 0) {
    console.error(`\n❌ ${errors.length} undefined-token usage${errors.length === 1 ? '' : 's'}:`);
    for (const e of errors) console.error('  ' + e);
  }

  if (warnings.length > 0) {
    console.warn(`\n⚠️  ${warnings.length} raw-hex usage${warnings.length === 1 ? '' : 's'} outside themes/:`);
    const max = 30;
    for (const w of warnings.slice(0, max)) console.warn('  ' + w);
    if (warnings.length > max) console.warn(`  … and ${warnings.length - max} more (informational; prefer semantic tokens)`);
  }

  if (errors.length > 0) {
    console.error('\nFix the undefined tokens before committing.');
    process.exit(1);
  }

  console.log(`\n✅ UI token validator passed (${files.length} files scanned)`);
  process.exit(0);
}

main();
