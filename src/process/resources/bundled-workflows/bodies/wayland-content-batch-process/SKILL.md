---
name: wayland-content-batch-process
description: >-
  Batch-process a directory of content briefs: scan the briefs, produce a blog
  draft for each, run a humanize pass over the batch, then build repurpose
  chains for email, LinkedIn, and X-thread.

  Use when the user has many content briefs in a folder and wants every one
  turned into a humanized draft with platform derivatives in a single run.

  Do NOT use for a single brief or when no corpus of briefs can be resolved;
  use the single-post blog workflow instead.
license: Apache-2.0
type: workflow
skills: "content-audit content-blog content-humanize content-repurpose"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing content batch repurpose deterministic automation
  category: marketing
  depends: "content-audit content-blog content-humanize content-repurpose"
---
# Content Brief Batch Processor

**Estimated time:** 5-10 minutes per brief

This workflow runs deterministically over a directory of content briefs. It
scans the briefs into a list, produces a full blog draft for each, humanizes the
whole batch against the voice profile, and builds repurpose chains for email,
LinkedIn, and X-thread. It is the bulk counterpart to the single-post publish
flow.

Resolve the content corpus before running. In order: use any file or folder
attached to the conversation (an exported brief bundle, CSV, or zip of markdown
briefs) read from the workspace cwd; else read from a connected filesystem MCP
server or a Google Sheets / Microsoft 365 export holding the brief list; else
ask the user to attach the content briefs export. If no corpus resolves, stop
and ask. Do not produce drafts from empty input.

Inputs: a briefs directory path (required) and an optional path to
voice-notes.md (recommended).

## When to Use

- User has a folder of content briefs to process at once
- User wants every brief turned into a humanized draft plus derivatives
- User wants a repeatable batch run, not an interactive single post

## Workflow Steps

**Step 1: Scan the Briefs** (uses: content-audit)

Resolve and read the briefs directory, then list every brief found (markdown or
JSON) into a structured brief list. If the corpus cannot be resolved, halt and
ask the user to attach it. Do not continue on empty input.

- Input: briefs directory path
- Output: structured list of resolved briefs
- Key focus: a complete, validated brief list; halt on no input

**Step 2: Produce Drafts** (uses: content-blog)

For every brief in the list, produce a full blog draft, applying the voice
profile if one was provided. Process the briefs as a batch and keep each draft
mapped to its source brief. Halt on error rather than skipping silently.

- Input: brief list, optional voice profile path
- Output: one full blog draft per brief
- Key focus: complete batch drafting, drafts mapped to briefs

**Step 3: Humanize the Batch** (uses: content-humanize)

Run a humanize pass over every draft in the batch, applying the voice profile
and stripping AI tells from each. Halt on error.

- Input: batch of drafts, optional voice profile path
- Output: humanized drafts for the full batch
- Key focus: consistent voice across every draft

**Step 4: Build Repurpose Chains** (uses: content-repurpose)

For each humanized draft, build repurpose derivatives for email, LinkedIn, and
an X-thread. Process as a batch. If a single derivative fails, skip it and
continue rather than halting the whole run.

- Input: batch of humanized drafts
- Output: email, LinkedIn, and X-thread derivatives per draft
- Key focus: full-batch repurpose; skip failures, do not halt

**Step 5: Return the Batch Output** (uses: content-repurpose)

Return the deliverable: the humanized drafts, the derivatives, and the original
brief list, so the user has every processed brief and its outputs in one place.

- Input: humanized drafts, derivatives, brief list
- Output: assembled batch result (drafts, derivatives, brief list)
- Key focus: one consolidated batch deliverable
