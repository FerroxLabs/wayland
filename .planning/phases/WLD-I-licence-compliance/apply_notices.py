"""
Restore the upstream copyright alongside ours (Apache-2.0 §4(c)) and record that
we modified the file (§4(b)) — but ONLY where the evidence supports it.

Scope discipline, in order of strength:

  1. AUTO tier only (>= 50% of substantive lines retained from upstream). The
     REVIEW tier is Ferrox-dominant and is a human decision, not a sweep.
  2. The upstream file must ACTUALLY have carried a copyright notice. Measured,
     not assumed: of the AUTO tier, 492 files never had one upstream, so nothing
     is owed and they are left alone.
  3. The notice restored is the upstream line VERBATIM — including its year and
     holder. We are retaining their notice, not reconstructing one. 740 files
     read `Copyright 2025 AionUi`, 2 read 2026, and 13 (the gemini-cli lineage)
     read `Copyright 2025 Google LLC`.

This never removes or weakens the Ferrox Labs line. Both stand: theirs first as
the earlier author, ours after, then the §4(b) statement. Asserting our
copyright beside theirs is a stronger position than a lone Ferrox line with a
git history showing it replaced someone else's.

Files Ferrox authored from scratch never appear here — the inventory only
compares files that exist at the same path in both trees.

Usage:
  python3 apply_notices.py            # dry run
  python3 apply_notices.py --write    # apply
"""

import csv
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
EVIDENCE = os.path.join(HERE, 'ATTRIBUTION-EVIDENCE.csv')
UPSTREAM_TREE = os.environ.get('AIONUI_BASELINE', '/tmp/aionui-v1925')

MODIFIED_LINE = ' * Modified by Ferrox Labs. Changes are documented in the project history.'
FERROX_RE = re.compile(r'^\s*\*\s*Copyright\s+\d{4}\s+Ferrox Labs\s*$')
COPYRIGHT_RE = re.compile(r'^\s*\*?\s*(Copyright\s+.+?)\s*$')
HAS_UPSTREAM_CREDIT = re.compile(r'[Aa]ion[Uu]i|Google LLC')

if not os.path.isfile(EVIDENCE):
    sys.exit('ATTRIBUTION-EVIDENCE.csv missing — run evidence_table.py --write first.')
if not os.path.isdir(UPSTREAM_TREE):
    sys.exit(
        f'baseline tree not found: {UPSTREAM_TREE}\n'
        'git -C ~/dev/resources/AionUi worktree add -f --detach /tmp/aionui-v1925 v1.9.25'
    )


def upstream_copyright_lines(upstream_path):
    """The verbatim `Copyright ...` lines from the upstream file's header block."""
    try:
        head = open(upstream_path, encoding='utf-8', errors='replace').read()[:600]
    except OSError:
        return []
    out = []
    for raw in head.split('\n')[:12]:
        m = COPYRIGHT_RE.match(raw)
        if m and 'Ferrox' not in m.group(1):
            out.append(f' * {m.group(1)}')
    return out


rows = [r for r in csv.DictReader(open(EVIDENCE)) if r['tier'] == 'AUTO']

applied, no_upstream_notice, already, no_header, missing = [], [], [], [], []
samples = []

for r in rows:
    rel = r['file']
    path = os.path.join(ROOT, rel)
    if not os.path.isfile(path):
        missing.append(rel)
        continue

    notices = upstream_copyright_lines(os.path.join(UPSTREAM_TREE, r['upstream']))
    if not notices:
        no_upstream_notice.append(rel)
        continue

    src = open(path, encoding='utf-8').read()
    if HAS_UPSTREAM_CREDIT.search(src[:600]):
        already.append(rel)
        continue

    lines = src.split('\n')
    idx = next((i for i, ln in enumerate(lines[:12]) if FERROX_RE.match(ln)), None)
    if idx is None:
        # No Ferrox header to attach to. These need a whole header authored,
        # which is a different (and rarer) edit — left for the manual pass.
        no_header.append(rel)
        continue

    new = lines[:idx] + notices + lines[idx:]
    spdx = next((i for i, ln in enumerate(new[:16]) if 'SPDX-License-Identifier' in ln), None)
    if spdx is not None:
        new = new[: spdx + 1] + [MODIFIED_LINE] + new[spdx + 1 :]

    if len(samples) < 2:
        samples.append((rel, '\n'.join(lines[:5]), '\n'.join(new[:8])))
    if '--write' in sys.argv:
        open(path, 'w', encoding='utf-8').write('\n'.join(new))
    applied.append(rel)

print(f'AUTO tier files:                     {len(rows)}')
print(f'  restored (upstream notice existed): {len(applied)}')
print(f'  upstream had NO notice — owed none: {len(no_upstream_notice)}')
print(f'  already credited:                   {len(already)}')
print(f'  no Ferrox header (manual pass):     {len(no_header)}')
print(f'  not on disk:                        {len(missing)}')

if no_header:
    print(f'\n  manual-pass files ({len(no_header)}), first 15:')
    for f in no_header[:15]:
        print(f'    {f}')

for rel, before, after in samples:
    print(f'\n--- {rel}\nBEFORE\n{before}\n\nAFTER\n{after}')

print('\nWROTE.' if '--write' in sys.argv else '\nDry run. Re-run with --write to apply.')
