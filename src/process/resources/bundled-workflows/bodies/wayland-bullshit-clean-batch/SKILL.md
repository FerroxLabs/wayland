---
name: wayland-bullshit-clean-batch
description: >-
  Batch Bullshit Filter: scan a directory of markdown drafts, run the Filter on
  each, and save a cleaned version of every draft.

  Use when the user has a folder of markdown copy drafts and wants the whole set
  filtered and cleaned in one pass.

  Do NOT use for a single draft (use wayland-bullshit-clean) or when the user
  wants a scored audit rather than an automated cleanup.
license: Apache-2.0
type: workflow
skills: "content-audit convert-bullshit-filter convert-voice"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing conversion copywriting bullshit-filter voice cleanup batch
  category: marketing
  depends: "content-audit convert-bullshit-filter convert-voice"
---

Batch version of the Bullshit Filter cleanup. Resolve a corpus of markdown
drafts, run the Filter across every draft, then rewrite the weakest lines in
each and save the cleaned versions.

Resolve the draft corpus in this order before running:
1. Any folder or files the user attached to the conversation (read from the workspace).
2. Else read markdown drafts from the directory the user supplies as `copy_dir`
   (the connected filesystem location or a synced content export).
3. Else ask the user to attach the drafts or point `copy_dir` at the export.

If no drafts resolve, halt and ask. Do not emit empty or invented cleaned files.
If a `voice-notes.md` voice profile is available, use it for voice-aware cleaning.

**Step 1: Scan the draft directory** (uses: content-audit)

Scan the resolved `copy_dir` and build the list of markdown drafts to process.
Read each file so its full text is available downstream. If the directory is
empty or unreadable, halt and ask the user to point at the right location. Report
the draft count and the file list.

- Input: `copy_dir` (resolved per the corpus order above)
- Output: list of markdown draft files with their contents, and the draft count
- Key focus: enumerate the real corpus, halt rather than invent if empty

**Step 2: Run the Bullshit Filter on each draft** (uses: convert-bullshit-filter)

Run the Bullshit Filter across every draft from Step 1. For each draft, flag the
weak, vague, hype-laden, or method-weak lines and rank them worst-first. Keep the
results keyed per draft so the cleaning step knows which lines to fix in which
file.

- Input: the list of drafts and their contents from Step 1
- Output: per-draft ranked lists of weak lines with reasons
- Key focus: per-file filter results, no rewriting yet

**Step 3: Clean the weakest lines and save** (uses: convert-voice)

For each draft, rewrite its weakest flagged lines in the author's voice using the
per-draft filter results. If a voice profile is present, match it. Save a cleaned
version of every draft back to the workspace (do not overwrite originals unless
the user asked for that). Return a summary: which files were cleaned, how many
lines changed per file, and where the cleaned versions were written.

- Input: drafts, per-draft filter results, optional voice profile path
- Output: cleaned version of each draft saved to disk, plus a per-file change summary
- Key focus: voice-aware batch rewrite of the weakest lines, save every cleaned draft
