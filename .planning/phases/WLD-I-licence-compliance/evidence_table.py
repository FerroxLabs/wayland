"""
Per-file attribution evidence: what is demonstrably still AionUi's, and what is
Ferrox Labs'.

Reads AIONUI-INVENTORY-1925.csv (produced by inventory.py against the real fork
point) and emits a reviewable table plus the two work-lists:

  AUTO    line_overlap >= 50   - notice restoration is not arguable
  REVIEW  line_overlap <  50   - hand-decide; may owe nothing

Deliberately does NOT decide the REVIEW tier. That is the whole point: those are
the files where Ferrox authorship dominates and a blanket sweep would be the
over-reach we are trying to avoid.

Usage:  python3 evidence_table.py [--write]
"""

import csv
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'AIONUI-INVENTORY-1925.csv')
AUTO_FLOOR = 50.0

if not os.path.isfile(SRC):
    sys.exit(f'inventory not found: {SRC}\nRun inventory.py against the v1.9.25 baseline first.')

rows = list(csv.DictReader(open(SRC)))
for r in rows:
    r['line_overlap'] = float(r['line_overlap'])
    r['id_overlap'] = float(r['id_overlap'])
    r['our_lines'] = int(r['our_lines'])

auto = sorted([r for r in rows if r['line_overlap'] >= AUTO_FLOOR], key=lambda r: -r['line_overlap'])
review = sorted([r for r in rows if r['line_overlap'] < AUTO_FLOOR], key=lambda r: -r['line_overlap'])


def band(v):
    if v >= 99.9:
        return 'identical'
    if v >= 90:
        return 'near-verbatim'
    if v >= 50:
        return 'majority-upstream'
    if v >= 20:
        return 'majority-ferrox'
    return 'ferrox-dominant'


# Retained vs authored line counts make the ownership split concrete per file.
for r in rows:
    r['band'] = band(r['line_overlap'])
    r['upstream_lines'] = round(r['our_lines'] * r['line_overlap'] / 100)
    r['ferrox_lines'] = r['our_lines'] - r['upstream_lines']

total_ours = sum(r['our_lines'] for r in rows)
total_up = sum(r['upstream_lines'] for r in rows)

print(f'Same-path files vs AionUi v1.9.25: {len(rows)}')
print(f'  AUTO   (>= {AUTO_FLOOR:.0f}% retained): {len(auto)}')
print(f'  REVIEW (<  {AUTO_FLOOR:.0f}% retained): {len(review)}')
print()
print('Substantive lines across these files only (excludes every Ferrox-authored file):')
print(f'  retained from upstream: {total_up:>7,}  ({100 * total_up / total_ours:.1f}%)')
print(f'  authored by Ferrox:     {total_ours - total_up:>7,}  ({100 * (total_ours - total_up) / total_ours:.1f}%)')
print()
print(f'REVIEW tier - decide these by hand ({len(review)} files, lowest retention first):')
for r in sorted(review, key=lambda r: r['line_overlap'])[:20]:
    print(
        f"  {r['line_overlap']:5.1f}% up / {r['ferrox_lines']:5d} ferrox lines  {r['file']}"
    )
if len(review) > 20:
    print(f'  ... and {len(review) - 20} more (full list in the CSV)')

if '--write' in sys.argv:
    out = os.path.join(HERE, 'ATTRIBUTION-EVIDENCE.csv')
    with open(out, 'w', newline='') as fh:
        w = csv.DictWriter(
            fh,
            fieldnames=[
                'tier', 'band', 'file', 'upstream', 'our_lines',
                'upstream_lines', 'ferrox_lines', 'line_overlap', 'id_overlap',
            ],
        )
        w.writeheader()
        for r in auto + review:
            w.writerow({
                'tier': 'AUTO' if r['line_overlap'] >= AUTO_FLOOR else 'REVIEW',
                'band': r['band'],
                'file': r['file'],
                'upstream': r['upstream'],
                'our_lines': r['our_lines'],
                'upstream_lines': r['upstream_lines'],
                'ferrox_lines': r['ferrox_lines'],
                'line_overlap': r['line_overlap'],
                'id_overlap': r['id_overlap'],
            })
    print(f'\nwrote {out}')
