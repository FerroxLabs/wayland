# GPT Workflows

This project uses GPT-powered GitHub Actions workflows to assist with PR review.

## Architecture Overview

```
.github/
├── actions/                          # Shared Composite Actions
│   ├── gather-pr-diff/action.yml     # Collects PR diff and list of changed files
│   ├── read-file-contents/action.yml # Reads changed file contents by priority
│   └── call-openai/action.yml        # Calls the OpenAI API (with retry logic)
└── workflows/
    ├── gpt-review.yml                # Code quality review
    ├── gpt-pr-assessment.yml         # PR value assessment
    └── pr-checks.yml                 # PR checks entry point (triggers gpt-review + gpt-pr-assessment)
```

## Comparison of the Two GPT Workflows

|                   | GPT Review                                                            | GPT PR Assessment                                                                    |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Purpose**       | Code quality review (bugs, security, performance)                     | Maintainer value assessment (merge priority, risk)                                   |
| **Role**          | Code review expert                                                    | Project maintainer / tech lead                                                       |
| **Trigger**       | Auto-triggered on PR creation (via pr-checks.yml) + manual dispatch   | Auto-triggered for external contributor PRs (via pr-checks.yml) + manual dispatch    |
| **Extra data**    | None                                                                  | Linked issue content                                                                 |
| **Output method** | PR Review (createReview)                                              | Issue Comment (updated in place, not duplicated)                                     |
| **Output format** | Issue list sorted by severity                                         | 7-dimension structured assessment report                                             |

## Shared Actions

Three Composite Actions encapsulate logic shared between both workflows to avoid duplication:

### `gather-pr-diff`

Collects the PR diff and list of changed files.

- **Inputs**: `pr_number` (required for manual dispatch)
- **Outputs**: `skip`, `pr_number`, `additions`, `deletions`, `total_lines`, `file_count`, `diff_truncated`
- **Temp files**: `pr_diff.txt`, `file_list.json` (written to `RUNNER_TEMP`)

### `read-file-contents`

Reads the full contents of changed files in priority order for cross-file GPT analysis.

- **Outputs**: `contents_truncated`
- **Temp files**: `file_contents.txt` (written to `RUNNER_TEMP`)
- **Prerequisites**: Requires `checkout` and `gather-pr-diff` to run first
- **Limits**: Skips lock files and binary files; total content capped at 80K characters

File read priority (highest to lowest):

1. `src/process/`, `src/agent/`, `src/webserver/` - core backend
2. `src/channels/` - agent communication
3. `src/common/` - shared modules
4. `src/worker/` - worker processes
5. `src/renderer/` - frontend UI
6. Other `.ts/.tsx/.js/.jsx` files
7. All remaining files

### `call-openai`

Calls the OpenAI Chat Completions API with automatic retry, truncation hints, and length limit handling.

- **Inputs**: `openai_api_key`, `output_file`, `diff_truncated`, `contents_truncated`
- **Temp files read**: `system_prompt.txt`, `user_prompt.txt` (read from `RUNNER_TEMP`)
- **Temp files written**: `{output_file}` (written to `RUNNER_TEMP`)
- **Model**: `gpt-5.2`
- **Retry policy**: Up to 2 retries with exponential backoff (on 429/5xx status codes and network errors)

## Data Flow

```
                    ┌─────────────────────┐
                    │  gather-pr-diff     │
                    │  (GitHub API)       │
                    └────────┬────────────┘
                             │
                   pr_diff.txt, file_list.json
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              │              ▼
     ┌────────────────┐     │    ┌───────────────────┐
     │ read-file-     │     │    │ fetch PR metadata  │
     │ contents       │     │    │ + linked issues    │
     │ (local fs)     │     │    │ (assessment only)  │
     └───────┬────────┘     │    └────────┬──────────┘
             │              │             │
   file_contents.txt        │    pr_meta.json,
             │              │    linked_issues.json
             └──────┬───────┘             │
                    │                     │
                    ▼                     │
          ┌──────────────────┐            │
          │ Construct GPT    │◄───────────┘
          │ Prompts          │
          │ (per-workflow)   │
          └────────┬─────────┘
                   │
         system_prompt.txt, user_prompt.txt
                   │
                   ▼
          ┌──────────────────┐
          │  call-openai     │
          │  (OpenAI API)    │
          └────────┬─────────┘
                   │
            {output_file}
                   │
                   ▼
          ┌──────────────────┐
          │ Post Comment     │
          │ (per-workflow)   │
          └──────────────────┘
```

## Language Detection

Both workflows automatically detect the language of the PR title and description, and respond in the same language:

- PR content in Chinese → Chinese comment
- PR content in English → English comment
- Mixed or indeterminate → defaults to English

## Usage

### GPT Review (automatic + manual trigger)

**Automatic trigger**: Triggered automatically via `pr-checks.yml` on first PR submission - no manual action needed.

**Manual trigger**:

1. Go to the GitHub repository → Actions tab
2. Select **GPT Review** on the left
3. Click **Run workflow**
4. Enter the PR number
5. Wait for the run to complete - the review will appear as a PR Review

### GPT PR Assessment (automatic + manual trigger)

**Automatic trigger**: When a non-project member (i.e. `author_association` is neither `OWNER` nor `MEMBER`) submits a PR for the first time, `pr-checks.yml` automatically triggers the assessment after the code quality check passes.

**Manual trigger**:

1. Go to the GitHub repository → Actions tab
2. Select **GPT PR Assessment** on the left
3. Click **Run workflow**
4. Enter the PR number
5. Wait for the run to complete - the assessment report will appear as a comment on the PR

When triggered repeatedly on the same PR, the comment is **updated** rather than created again.

## Secrets Configuration

| Secret           | Purpose                                              |
| ---------------- | ---------------------------------------------------- |
| `OPENAI_API_KEY` | OpenAI API access key, shared by both workflows      |

## Modification Guide

- **Change model**: Edit the `model` field in `.github/actions/call-openai/action.yml`
- **Adjust retry logic**: Edit the `callOpenAI` function in `.github/actions/call-openai/action.yml`
- **Change file priority**: Edit the `filePriority` function in `.github/actions/read-file-contents/action.yml`
- **Modify Review prompt**: Edit the "Construct GPT prompts" step in `gpt-review.yml`
- **Modify Assessment prompt**: Edit the "Construct GPT prompts" step in `gpt-pr-assessment.yml`
