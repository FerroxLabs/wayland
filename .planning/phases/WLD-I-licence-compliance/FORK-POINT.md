# Fork point: AionUi v1.9.25, on an abandoned side branch

**Established 2026-07-30. This supersedes every earlier baseline claim.**

| | |
|---|---|
| **Fork point** | **`v1.9.25`** (iOfficeAI/AionUi) |
| Upstream archive | `~/dev/resources/AionUi` (full clone, 256 tags) |
| Superseded claims | `v1.9.5` (`5b2c741f9`) — wrong, 20 tags early. `v1.9.8` — wrong, floor only. |
| Divergence point | `4db788bf26688c609140eb650d0b8dc078246356` (= `v1.9.20~10`) |
| On upstream mainline? | **No.** `git merge-base --is-ancestor v1.9.25 v2.1.44` → **NO** |
| Commits on our side of the split | **50** |

## Why the earlier baselines were wrong

`v1.9.5` was supplied verbally and taken as authoritative. It is contradicted by the tree: we ship
files that did not exist at `v1.9.5`. `v1.9.8` was the first tag at which that became *visible*
(via `public/pet-states/`), so it is a floor, not the answer.

## Evidence — two independent methods, same conclusion

### Method 1: first-appearance floor (hard)

A file cannot predate the commit that created it. Counting files **we ship** that first appear at
each upstream tag:

| tag range | our files first appearing |
|---|---|
| v1.9.5 → v1.9.8 | 176 |
| v1.9.8 → v1.9.10 | 35 |
| v1.9.10 → v1.9.12 | 40 |
| v1.9.12 → v1.9.15 | 99 |
| v1.9.15 → v1.9.19 | 152 |
| v1.9.19 → v1.9.20 | 24 |
| v1.9.20 → v1.9.22 | 17 |
| **v1.9.22 → v1.9.25** | **3** |

The v1.9.25 witnesses: `src/process/resources/skills/officecli-word-form/SKILL.md`,
`src/process/resources/assistant/word-form-creator/word-form-creator.md`,
`tests/unit/updateBridgeCdnRewrite.test.ts`. Nothing first-appears after v1.9.25.

### Method 2: same-path byte-identical blob count

Git blob SHAs are content-addressed and therefore comparable across repositories. Comparing
`git ls-tree -r <tag>` against our `HEAD` tree, matching on path:

| tag | same-path files | byte-identical |
|---|---|---|
| v1.9.5 | 1604 | 396 |
| v1.9.8 | 1780 | 448 |
| v1.9.19 | 2106 | 584 |
| **v1.9.25** | **2150** | **590 (peak)** |
| `archive/main-before-backend-migration` | 2157 | 590 |
| v2.1.0 | 331 | 152 |
| v2.1.44 | 301 | 147 |

Peak at v1.9.25; the collapse at v2.1.x is the `src/` → `packages/desktop/src/` restructure moving
paths, not a content change.

> **Method note.** An earlier attempt at fork-point detection by **blob-set intersection over all
> paths** was recorded as refuted — the rebrand (copyright line swapped in ~981 files) destroys
> byte-identity, giving a flat ~4% with no peak. **Same-path** blob comparison is a different
> method and does work: it produced a clean monotone curve with a peak. Do not conflate the two.

## Consequences

1. **`AIONUI-INVENTORY.csv` (1005 same-path / 981 derived / 186 byte-identical) was measured against
   `v1.9.5`.** That baseline is wrong and the error direction is **under-counting**: files scored
   `DIVERGED` against v1.9.5 may match cleanly at v1.9.25. **Re-run `inventory.py` against v1.9.25
   before the §4(c) sweep sizes anything.** The script takes the baseline as a directory argument,
   so this is a re-run, not a rewrite.
2. **We forked from a branch upstream abandoned.** v1.9.25 is not an ancestor of v2.1.44. Any
   statement of the form "upstream is N commits ahead of us" must be computed from the merge-base
   `4db788bf2`, not from a tag-to-tag range.
3. **WLD-J's headline "1784 commits" is the `v1.9.5..v2.1.44` range** — a range whose start is not
   our baseline and whose endpoints have no direct ancestry. The research conclusions are unaffected
   (measured cherry-pick clean-apply 5.2%; Electron 41.6.0 vs upstream 37.x; 31 upstream fixes
   checked with none reproducing), but the figure needs restating against the merge-base.
4. **The 50 commits on our side of the split are unexamined.** They may contain fixes that upstream
   mainline never received — a second, independent reason our tree leads rather than lags.

## Reproducing this

```bash
cd ~/dev/resources/AionUi
git merge-base --is-ancestor v1.9.25 v2.1.44   # exit 1 = not an ancestor
git merge-base v1.9.25 v2.1.44                 # 4db788bf2...
git rev-list --count 4db788bf2..v1.9.25        # 50
```

Use `rtk proxy git ...` for anything that enumerates — plain `git log` silently truncated a
1779-commit range to 50 rows during this work.
