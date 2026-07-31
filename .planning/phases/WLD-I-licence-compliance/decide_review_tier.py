"""
Adjudicate the 148 REVIEW-tier files (under 50% literal retention).

Percentage alone is the wrong instrument here, twice over:

  * It is unstable on small files. `fileTypes.ts` scores 20% off ONE shared
    line, because the whole file has five substantive lines.
  * Identifier overlap cannot be read naively either. This milestone's own
    calibration found a Ferrox-ORIGINAL file shares ~45% of its identifiers
    with an UNRELATED upstream file, so anything under ~55% is noise.

So the measure used is shared EXPRESSION lines: substantive lines present in
both trees, with imports, re-exports and bare type/interface openers removed.
Those are dictated by the framework and the module graph, not authored.

The cut is de minimis. At 1-4 shared expression lines what is shared is a single
type shape or hook signature (`export const STORAGE_KEYS = {`), and a joint
notice would misrepresent the file as co-authored. At 5+ the file's skeleton -
prop interface, component signature, control flow - demonstrably came from
theirs, however much was rewritten around it, and a joint notice is simply true.

Emits REVIEW-DECISIONS.csv with the per-file reason so the call is auditable.
"""

import csv
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
UP = os.environ.get('AIONUI_BASELINE', '/tmp/aionui-v1925')
MIN_SHARED_EXPRESSION_LINES = 5

BOILER = re.compile(
    r'^\s*(import\b|export\s+(?:\*|\{|type\b|default\b)'
    r'|export\s+(?:type|interface)\s+\w+\s*=?\s*\{?\s*$|\}\s*from\b|const\s+\w+\s*=\s*require\()'
)


def expression_lines(src):
    out = []
    for raw in src.splitlines():
        s = raw.strip()
        if not s or s.startswith(('//', '*', '/*', '*/', '#')):
            continue
        s = re.sub(r'\s+', ' ', s)
        if len(s) < 25 or BOILER.match(s):
            continue
        out.append(s)
    return out


rows = [r for r in csv.DictReader(open(os.path.join(HERE, 'ATTRIBUTION-EVIDENCE.csv'))) if r['tier'] == 'REVIEW']
decisions = []
for r in rows:
    ours = os.path.join(ROOT, r['file'])
    theirs = os.path.join(UP, r['upstream'])
    if not (os.path.isfile(ours) and os.path.isfile(theirs)):
        continue
    a = expression_lines(open(ours, encoding='utf-8').read())
    b = set(expression_lines(open(theirs, encoding='utf-8', errors='replace').read()))
    shared = sum(1 for line in a if line in b)
    credit = shared >= MIN_SHARED_EXPRESSION_LINES
    decisions.append({
        'file': r['file'],
        'upstream': r['upstream'],
        'decision': 'CREDIT' if credit else 'NO-CREDIT',
        'shared_expression_lines': shared,
        'our_expression_lines': len(a),
        'line_overlap': r['line_overlap'],
        'id_overlap': r['id_overlap'],
        'reason': 'structure retained from upstream' if credit else 'de minimis - a lone type or signature',
    })

out = os.path.join(HERE, 'REVIEW-DECISIONS.csv')
with open(out, 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=list(decisions[0].keys()))
    w.writeheader()
    w.writerows(sorted(decisions, key=lambda d: -d['shared_expression_lines']))

c = sum(1 for d in decisions if d['decision'] == 'CREDIT')
print(f'REVIEW tier adjudicated: {len(decisions)}')
print(f'  CREDIT    {c}')
print(f'  NO-CREDIT {len(decisions) - c}')
print(f'\nwrote {out}')

if '--list-no-credit' in sys.argv:
    print('\nleft as Ferrox-only:')
    for d in decisions:
        if d['decision'] == 'NO-CREDIT':
            print(f"  {d['shared_expression_lines']:2d} shared  {d['file']}")
