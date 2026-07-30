import re, os, json, sys, csv

W = '/Users/seandonahoe/dev/wayland-worktrees/packet-attribution'

# usage: inventory.py <baseline-tree> <label> [csv-suffix]
# Baseline trees come from ~/dev/resources/AionUi; check one out with
#   git -C ~/dev/resources/AionUi worktree add -f --detach /tmp/aionui-<tag> <tag>
# The real fork point is v1.9.25 (see FORK-POINT.md), NOT v1.9.5.
UP = sys.argv[1] if len(sys.argv) > 1 else '/tmp/aionui-v1925'
LABEL = sys.argv[2] if len(sys.argv) > 2 else 'AionUi v1.9.25 (fork point, see FORK-POINT.md)'
SUFFIX = sys.argv[3] if len(sys.argv) > 3 else '1925'
if not os.path.isdir(UP):
    sys.exit(f'baseline tree not found: {UP}')

STOP = set('''
string boolean number undefined null return export import function async await const let var
class interface extends implements typeof instanceof Promise Array Object Record Partial
default private public protected readonly static void never unknown Error catch throw finally
require module exports console process Buffer JSON Math Date RegExp Symbol Map Set WeakMap
params options config result response request handler callback resolve reject timeout signal
message content channel channels account accounts client plugin adapter service manager
enabled disabled fallback missing length value values keys entries index chunk chunks
React useState useEffect useMemo useCallback useRef children className onClick styles
'''.split())

def strip_comments(src):
    src = re.sub(r'/\*.*?\*/', ' ', src, flags=re.S)
    src = re.sub(r'//[^\n]*', ' ', src)
    return src

def read(p):
    try:
        return open(p, encoding='utf-8', errors='replace').read()
    except Exception:
        return None

def lines_of(src):
    out = []
    for raw in src.splitlines():
        s = raw.strip()
        if not s or s.startswith(('//', '*', '/*', '*/', '#')):
            continue
        s = re.sub(r'\s+', ' ', s)
        if len(s) < 25:
            continue
        out.append(s)
    return out

def ids_of(src):
    out = set()
    for t in re.findall(r'[A-Za-z_][A-Za-z0-9_]*', strip_comments(src)):
        if len(t) < 6 or t in STOP:
            continue
        out.add(t)
    return out

# build upstream normalised path map
norm = {}
for root, dirs, files in os.walk(UP):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'dist', 'out')]
    for f in files:
        if not f.endswith(('.ts', '.tsx')):
            continue
        full = os.path.join(root, f)
        rel = os.path.relpath(full, UP)
        q = re.sub(r'^packages/[^/]+/', '', rel)
        norm.setdefault(q, full)

# Depth-aware: 'resources' and '.planning' are only skipped at the repo root.
# Skipping them at any depth would wrongly drop src/process/resources/**.
SKIP_ANY = {'node_modules', '.git', 'dist', 'out', 'release'}
SKIP_ROOT_ONLY = {'.planning', 'resources'}

rows = []
for root, dirs, files in os.walk(W):
    at_root = os.path.abspath(root) == os.path.abspath(W)
    dirs[:] = [
        d for d in dirs
        if d not in SKIP_ANY and not (at_root and d in SKIP_ROOT_ONLY)
    ]
    for f in files:
        if not f.endswith(('.ts', '.tsx')):
            continue
        full = os.path.join(root, f)
        rel = os.path.relpath(full, W)
        key = rel[len('src/'):] if rel.startswith('src/') else rel
        cand = norm.get('src/' + key) or norm.get(key)
        if not cand:
            continue
        a, b = read(full), read(cand)
        if a is None or b is None:
            continue
        la, lb = lines_of(a), lines_of(b)
        ia, ib = ids_of(a), ids_of(b)
        if not la or not ia:
            continue
        lov = 100.0 * len(set(la) & set(lb)) / len(la)
        iov = 100.0 * len(ia & ib) / len(ia)
        has_aionui = bool(re.search(r'[Aa]ion[Uu]i', a[:600]))
        rows.append({
            'file': rel,
            'upstream': os.path.relpath(cand, UP),
            'our_lines': len(la),
            'line_overlap': round(lov, 1),
            'id_overlap': round(iov, 1),
            'aionui_notice': has_aionui,
        })

def tier(r):
    if r['line_overlap'] >= 50 or (r['line_overlap'] >= 30 and r['id_overlap'] >= 60):
        return 'DERIVED-HIGH'
    if r['line_overlap'] >= 20 or r['id_overlap'] >= 55:
        return 'DERIVED-LIKELY'
    if r['line_overlap'] >= 8 or r['id_overlap'] >= 35:
        return 'REVIEW'
    return 'DIVERGED'

for r in rows:
    r['tier'] = tier(r)

rows.sort(key=lambda r: (-r['line_overlap'], -r['id_overlap']))

with open(os.path.dirname(os.path.abspath(__file__)) + f'/AIONUI-INVENTORY-{SUFFIX}.csv', 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=['tier', 'file', 'upstream', 'our_lines', 'line_overlap', 'id_overlap', 'aionui_notice'])
    w.writeheader()
    for r in rows:
        w.writerow(r)

from collections import Counter
c = Counter(r['tier'] for r in rows)
in_src = sum(1 for r in rows if r['file'].startswith('src/'))
print(f'same-path files compared: {len(rows)}   (src/ {in_src}, outside src/ {len(rows) - in_src})')
print(f'  upstream baseline: {LABEL}')
print(f'  baseline tree:     {UP}')
print()
for t in ('DERIVED-HIGH', 'DERIVED-LIKELY', 'REVIEW', 'DIVERGED'):
    print(f'  {t:15s} {c.get(t,0):4d}')
print()
print(f'  carrying an AionUi notice already: {sum(1 for r in rows if r["aionui_notice"])}')
print(f'  at 100% line overlap:              {sum(1 for r in rows if r["line_overlap"]>=99.9)}')
print(f'  at >=90% line overlap:             {sum(1 for r in rows if r["line_overlap"]>=90)}')
print()
print('top 20 by line overlap:')
for r in rows[:20]:
    print(f'  {r["line_overlap"]:5.1f}% line {r["id_overlap"]:5.1f}% id  {r["our_lines"]:4d}L  {r["file"]}')
