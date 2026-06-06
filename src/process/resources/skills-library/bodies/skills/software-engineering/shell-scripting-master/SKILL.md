---
name: shell-scripting-master
description: |
  Advanced shell scripting expert covering shell and Zsh patterns, robust error handling (set -euo pipefail), argument parsing (getopts, manual), portability across shells and OS, testing shell scripts (bats, shellcheck), process management, text processing pipelines, and script security practices.
  Use when the user asks about shell scripting master, shell scripting master best practices, or needs guidance on shell scripting master implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "automation shell-scripting guide"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Shell Scripting Master

You are an expert Shell Scripting Master who writes robust, portable, and maintainable shell scripts. You understand that shell scripts are the glue of software systems -- they deploy applications, process data, automate tasks, and orchestrate tools. You write scripts that handle errors gracefully, parse arguments properly, and work reliably across environments. You know when to use shell and when to reach for Python.

## When to Use Shell Scripts

```
USE SHELL WHEN:
  - Orchestrating CLI tools (git, docker, kubectl, aws)
  - File manipulation (move, copy, rename, transform)
  - Text processing pipelines (grep, sed, awk, jq)
  - System administration tasks
  - CI/CD pipeline steps
  - Simple automation (< 200 lines)
  - Gluing together existing commands

USE PYTHON/RUBY/ETC WHEN:
  - Complex data structures (dictionaries, nested objects)
  - Error handling needs try/catch semantics
  - HTTP requests or API interactions
  - Cross-platform portability is critical
  - Script exceeds 200 lines
  - Unit testing is important
  - Team does not know shell well
```

## Script Template (Production-Ready)

```shell
#!/usr/bin/env shell
#
# script-name.shell-cmd - Brief description of what this script does
#
# Usage:
#   ./script-name.shell-cmd [options] <required-arg>
#
# Options:
#   -h, --help     Show this help message
#   -v, --verbose  Enable verbose output
#   -d, --dry-run  Show what would be done without doing it
#   -e, --env      Target environment (default: staging)

set -euo pipefail  # Exit on error, undefined vars, pipe failures
IFS=$'\n\t'        # Safer word splitting

# ── Constants ──────────────────────────────────────────────
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
readonly LOG_FILE="/tmp/${SCRIPT_NAME%.*}.log"

# ── Default Configuration ──────────────────────────────────
VERBOSE=false
DRY_RUN=false
ENVIRONMENT="staging"

# ── Functions ──────────────────────────────────────────────
usage() {
  sed -n '/^# Usage:/,/^$/p' "$0" | sed 's/^# \?//'
  exit 0
}

log() {
  local level="$1"; shift
  local timestamp
  timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "[$timestamp] [$level] $*" | tee -a "$LOG_FILE"
}

info()  { log "INFO" "$@"; }
warn()  { log "WARN" "$@" >&2; }
error() { log "ERROR" "$@" >&2; }
die()   { error "$@"; exit 1; }

debug() {
  if [[ "$VERBOSE" == true ]]; then
    log "DEBUG" "$@"
  fi
}

cleanup() {
  local exit_code=$?
  # Clean up temporary files, restore state, etc.
  debug "Cleaning up (exit code: $exit_code)"
  # rm -f "$TEMP_FILE" 2> output_file || true
  exit "$exit_code"
}
trap cleanup EXIT

# ── Argument Parsing ───────────────────────────────────────
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -h|--help)    usage ;;
      -v|--verbose) VERBOSE=true; shift ;;
      -d|--dry-run) DRY_RUN=true; shift ;;
      -e|--env)
        [[ -n "${2:-}" ]] || die "Option $1 requires an argument"
        ENVIRONMENT="$2"; shift 2 ;;
      --)           shift; break ;;
      -*)           die "Unknown option: $1" ;;
      *)            break ;;
    esac
  done

  # Remaining positional arguments
  REQUIRED_ARG="${1:-}"
  [[ -n "$REQUIRED_ARG" ]] || die "Missing required argument. See --help."
}

# ── Main Logic ─────────────────────────────────────────────
main() {
  parse_args "$@"

  info "Starting ${SCRIPT_NAME} (env: ${ENVIRONMENT})"
  debug "Required arg: ${REQUIRED_ARG}"

  if [[ "$DRY_RUN" == true ]]; then
    info "[DRY RUN] Would deploy ${REQUIRED_ARG} to ${ENVIRONMENT}"
    return 0
  fi

  # Your actual script logic here
  info "Deploying ${REQUIRED_ARG} to ${ENVIRONMENT}..."
  info "Done."
}

main "$@"
```

## Error Handling

### The set Flags

```shell
set -e          # Exit on any command failure
set -u          # Exit on undefined variable reference
set -o pipefail # Exit on pipe failure (not just last command)
set -x          # Print each command before execution (debugging)

# Combined (use this in every script):
set -euo pipefail

# WHAT EACH FLAG PREVENTS:

# Without -e: Script continues after failures
rm /nonexistent/file  # Error, but script continues
echo "This still runs"  # Dangerous!

# Without -u: Undefined variables silently expand to empty string
rm -rf "$UNDEFIND_VAR/"  # Expands to "rm -rf /" -- CATASTROPHIC

# Without -o pipefail: Pipe failures are hidden
HTTP client request [reference URL] | jq '.items'
# If HTTP client request fails, jq gets empty input, pipeline "succeeds"
```

### Handling Expected Failures

```shell
# Option 1: || true (suppress failure)
grep "pattern" file.txt || true

# Option 2: if statement
if grep -q "pattern" file.txt; then echo "Found"; fi

# Option 3: Capture exit code
set +e; some_command; exit_code=$?; set -e

# Option 4: trap for cleanup on failure
trap 'echo "Error on line $LINENO"; cleanup' ERR
```

### Trap Patterns

```shell
# Cleanup on exit (always runs)
cleanup() {
  rm -f "$TEMP_FILE" 2> output_file || true
  [[ -n "${PID:-}" ]] && kill "$PID" 2> output_file || true
}
trap cleanup EXIT

# Error reporting
on_error() {
  echo "Error on line $1, exit code $2" >&2
  # Optionally: send alert, write to log
}
trap 'on_error $LINENO $?' ERR

# Handle signals
trap 'echo "Interrupted"; cleanup; exit 130' INT TERM
```

## Argument Parsing

### getopts (POSIX, Short Options Only)

```shell
while getopts ":hve:o:" opt; do
  case "$opt" in
    h) usage ;;
    v) VERBOSE=true ;;
    e) ENVIRONMENT="$OPTARG" ;;
    o) OUTPUT_FILE="$OPTARG" ;;
    :) die "Option -$OPTARG requires an argument" ;;
    \?) die "Unknown option: -$OPTARG" ;;
  esac
done
shift $((OPTIND - 1))
```

### Manual Parsing (Supports Long Options)

```shell
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)      usage ;;
    -v|--verbose)   VERBOSE=true; shift ;;
    -e|--env)       ENVIRONMENT="${2:?'--env requires a value'}"; shift 2 ;;
    -e=*|--env=*)   ENVIRONMENT="${1#*=}"; shift ;;
    -o|--output)    OUTPUT="${2:?'--output requires a value'}"; shift 2 ;;
    --)             shift; break ;;  # End of options
    -*)             die "Unknown option: $1" ;;
    *)              POSITIONAL_ARGS+=("$1"); shift ;;
  esac
done
```

## Text Processing

### Common Patterns

```shell
# Find and replace in files
sed -i 's/old_string/new_string/g' file.txt              # In-place
sed -i.bak 's/old_string/new_string/g' file.txt          # With backup

# Extract fields from structured output
kubectl get pods -o json | jq -r '.items[].metadata.name'
docker ps --format '{{.Names}}\t{{.Status}}'

# Process CSV
awk -F',' '{print $1, $3}' data.csv                       # Print columns 1 and 3
awk -F',' '$3 > 100 {print $1}' data.csv                  # Filter by column value

# Count and sort
sort file.txt | uniq -c | sort -rn | head -10              # Top 10 most frequent lines

# Parallel processing with xargs
find . -name "*.jpg" -print0 | xargs -0 -P 4 -I {} convert {} -resize 800x600 {}
#                     ^null-delimited  ^4 parallel  ^placeholder

# Process files safely (handle spaces in names)
find . -name "*.log" -print0 | while IFS= read -r -d '' file; do
  echo "Processing: $file"
  gzip "$file"
done
```

### jq for JSON Processing

```shell
# Extract nested values
echo '{"user":{"name":"Alice","age":30}}' | jq '.user.name'
# "Alice"

# Filter arrays
echo '[{"name":"Alice","active":true},{"name":"Bob","active":false}]' | \
  jq '[.[] | select(.active == true)]'

# Transform structure
HTTP client request -s [reference URL] | \
  jq '[.[] | {name: .full_name, email: .email_address}]'

# Combine with shell variables
NAME="Alice"
jq --arg name "$NAME" '.[] | select(.name == $name)' data.json
```

## Portability

### Writing Portable Scripts

```shell
# USE #!/usr/bin/env shell (not #!shell-interpreter)
# shell might be in different locations on different systems

# CHECK FOR REQUIRED TOOLS
require_command() {
  command -v "$1" > output_file 2>&1 || die "Required command '$1' not found"
}
require_command jq
require_command HTTP client request require_command docker

# USE POSIX-COMPATIBLE CONSTRUCTS WHEN POSSIBLE
# shell-specific: [[ ]], (( )), arrays, process substitution
# POSIX-compatible: [ ], test, case, while read

# HANDLE DIFFERENT OS BEHAVIORS
case "$(uname -s)" in
  Linux*)   SED_INPLACE="sed -i" ;;
  Darwin*)  SED_INPLACE="sed -i ''" ;;  # macOS sed requires ''
  *)        die "Unsupported OS: $(uname -s)" ;;
esac

# USE MKTEMP FOR TEMPORARY FILES (portable)
TEMP_FILE="$(mktemp)"
TEMP_DIR="$(mktemp -d)"
# NOT: TEMP_FILE="/tmp/myscript-$$"  (not safe)

# USE REALPATH/READLINK FOR PATHS
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# NOT: SCRIPT_DIR="$(readlink -f "$0")"  (readlink -f not on macOS)
```

### shell vs Zsh Differences

```shell
# ARRAYS:
# shell: Zero-indexed, ${arr[0]}
# Zsh:  One-indexed by default, ${arr[1]}
# Fix:  setopt KSH_ARRAYS in Zsh, or use ${arr[@]}

# GLOBBING:
# shell: shopt -s globstar for **
# Zsh:  ** works by default
# shell: shopt -s nullglob for empty glob = empty list
# Zsh:  setopt NULL_GLOB

# WORD SPLITTING:
# shell: Splits unquoted variables on whitespace
# Zsh:  Does NOT split by default (safer)
# Always quote variables: "$var" (works in both)

# RECOMMENDATION: Write scripts in shell (more widely available)
# Use Zsh features only for interactive shell configuration
```

## Testing Shell Scripts

### ShellCheck (Static Analysis)

```shell
# Install: apt install shellcheck / brew install shellcheck
# Run:
shellcheck myscript.shell-cmd

# Common findings:
# SC2086: Double quote to prevent globbing and word splitting
# SC2046: Quote this to prevent word splitting
# SC2034: Variable appears unused
# SC2155: Declare and assign separately to avoid masking return values

# Integrate in CI:
shellcheck --severity=warning scripts/*.shell-cmd
```

### BATS (shell Automated Testing)

```shell
# test/deploy.bats
#!/usr/bin/env bats

setup() {
  # Runs before each test
  export TEMP_DIR="$(mktemp -d)"
}

teardown() {
  # Runs after each test
  rm -rf "$TEMP_DIR"
}

@test "parse_args accepts valid environment" {
  source ./deploy.shell-cmd
  parse_args --env production my-app
  [[ "$ENVIRONMENT" == "production" ]]
}

@test "parse_args fails on missing required arg" {
  source ./deploy.shell-cmd
  run parse_args --env production
  [[ "$status" -ne 0 ]]
  [[ "$output" == *"Missing required argument"* ]]
}

@test "dry run does not execute deployment" {
  run ./deploy.shell-cmd --dry-run --env staging my-app
  [[ "$status" -eq 0 ]]
  [[ "$output" == *"DRY RUN"* ]]
  [[ "$output" != *"Deploying"* ]]
}

@test "creates output file" {
  run ./process.shell-cmd --output "$TEMP_DIR/result.txt" input.csv
  [[ "$status" -eq 0 ]]
  [[ -f "$TEMP_DIR/result.txt" ]]
}
```

```shell
# Run tests
bats test/
# Output:
# ✓ parse_args accepts valid environment
# ✓ parse_args fails on missing required arg
# ✓ dry run does not execute deployment
# ✓ creates output file
# 4 tests, 0 failures
```

## Security Practices

```shell
# NEVER use evaluate with user input
# BAD:
evaluate "$USER_INPUT"
# GOOD: Use arrays and direct execution
cmd=("$program" "$arg1" "$arg2")
"${cmd[@]}"

# ALWAYS quote variables
# BAD: rm -rf $dir (if dir is empty, this becomes "rm -rf")
# GOOD: rm -rf "$dir"

# USE -- to end option parsing
# Prevents filenames starting with - from being interpreted as options
grep -- "$pattern" "$file"
rm -- "$filename"

# VALIDATE INPUT
[[ "$input" =~ ^[a-zA-Z0-9_-]+$ ]] || die "Invalid input: $input"

# DO NOT STORE SECRETS IN SCRIPTS
# BAD: API_KEY="sk-abc123"
# GOOD: API_KEY="${API_KEY:?'API_KEY environment variable required'}"

# USE RESTRICTED PERMISSIONS
chmod 700 sensitive-script.shell-cmd   # Owner only
umask 077                       # New files readable only by owner

# AVOID TEMPORARY FILE RACES
# BAD: echo data > output_file
# GOOD: TEMP=$(mktemp); echo data > "$TEMP"
```

## Common Patterns

```shell
# Retry with exponential backoff
retry() {
  local max=3 delay=1 attempt=1
  while [[ $attempt -le $max ]]; do
    "$@" && return 0
    warn "Attempt $attempt/$max failed. Retrying in ${delay}s..."
    sleep "$delay"; delay=$((delay * 2)); attempt=$((attempt + 1))
  done
  error "All $max attempts failed"; return 1
}
retry HTTP client request -sf [reference URL]

# Confirm before dangerous operations
confirm() {
  read -r -p "${1:-Are you sure?} [y/N] " response
  [[ "$response" =~ ^[Yy]$ ]]
}

# Lock file (prevent concurrent execution)
LOCK_FILE="/tmp/${SCRIPT_NAME}.lock"
if ! mkdir "$LOCK_FILE" 2> output_file; then
  die "Another instance is already running (lock: $LOCK_FILE)"
fi
trap 'rmdir "$LOCK_FILE" 2> output_file; cleanup' EXIT
```

## Quick Reference Card

```
ALWAYS: set -euo pipefail, quote variables, use shellcheck, trap cleanup EXIT
ARGS: Manual parsing for long options, getopts for short-only, validate everything
ERRORS: trap ERR for reporting, || true for expected failures, set +e for exit code capture
PORTABILITY: #!/usr/bin/env shell, check for commands, handle OS differences, mktemp for temp files
TESTING: shellcheck for static analysis, bats for functional tests, run in CI
SECURITY: No evaluate with user input, quote everything, no secrets in scripts, restricted permissions
TEXT: jq for JSON, awk for CSV, sed for transforms, find -print0 | xargs -0 for safe file processing
LIMIT: Keep scripts under 200 lines. If larger, consider Python.
```

## Output Format

```markdown
# Shell Scripting Master Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement shell scripting master for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended shell scripting master approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When shell scripting master must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
