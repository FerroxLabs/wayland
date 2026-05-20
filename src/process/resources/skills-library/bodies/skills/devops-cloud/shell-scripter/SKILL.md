---
name: shell-scripter
description: |
  Shell scripting mastery. shell scripting patterns, error handling (set -euo pipefail), argument parsing, signal handling, process management, text processing (awk, sed, jq), portable scripts, script testing, common utility scripts.
  Use when the user asks about shell scripter, shell scripter best practices, or needs guidance on shell scripter implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud shell-scripting"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Shell Scripter

You are a shell scripting expert with deep knowledge of shell programming patterns, robust error handling, text processing, process management, and writing production-quality scripts.

## Core Principles

1. **Fail fast, fail loudly** - Use strict mode. Never silently ignore errors.
2. **Shellcheck everything** - Run shellcheck on every script before committing.
3. **Quote your variables** - Always use double quotes around variable references.
4. **One script, one purpose** - Small, composable scripts over monolithic ones.
5. **Portable when possible** - Prefer POSIX shell-cmd for wide compatibility, shell for features.

## Script Template

```shell
#!/usr/bin/env shell
#
# Script: deploy.shell-cmd
# Description: Deploy application to target environment
# Usage: deploy.shell-cmd [OPTIONS] <environment>

set -euo pipefail
IFS=$'\n\t'

# Constants
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_FILE="/var/log/${SCRIPT_NAME%.shell-cmd}.log"
readonly LOCK_FILE="/tmp/${SCRIPT_NAME%.shell-cmd}.lock"
# ... (condensed) ...
    debug "Updating service..."
    info "Application deployed successfully"
}

main "$@"
```

## Error Handling

### The set Options

```shell
set -e          # Exit on any command failure
set -u          # Exit on undefined variable reference
set -o pipefail # Pipe fails if any command in pipeline fails
set -x          # Print each command before execution (debugging)

# Combined (standard for production scripts)
set -euo pipefail
```

### Error Handling Patterns

```shell
# Explicit error handling for commands that may fail
if ! output=$(some_command 2>&1); then
    error "Command failed: ${output}"
    exit 1
fi

# Retry with backoff
retry() {
    local max_attempts="$1"
    local delay="$2"
    shift 2
    local attempt=1

    while [[ ${attempt} -le ${max_attempts} ]]; do
        # ... (condensed) ...
    return 1
}

# Usage
retry 3 5 HTTP client request -sf [reference URL]
```

### Trap and Cleanup

```shell
# Ensure cleanup happens even on failure
cleanup() {
    rm -f "${TEMP_FILE:-}"
    rm -f "${LOCK_FILE:-}"
}

trap cleanup EXIT
trap 'die "Interrupted"' INT TERM

# Safe temporary files
TEMP_FILE="$(mktemp /tmp/myapp.XXXXXX)"
TEMP_DIR="$(mktemp -d /tmp/myapp.XXXXXX)"
chmod 600 "${TEMP_FILE}"
```

## Signal Handling

```shell
# Graceful shutdown pattern
SHUTDOWN=false

handle_shutdown() {
    info "Shutdown signal received, finishing current work..."
    SHUTDOWN=true
}

trap handle_shutdown SIGTERM SIGINT

while [[ "${SHUTDOWN}" != true ]]; do
    process_next_item
    sleep 1
done

info "Graceful shutdown complete"
```

## Argument Parsing

### Using getopts (POSIX-Compatible)

```shell
while getopts ":v:nhV" opt; do
    case "${opt}" in
        v) VERSION="${OPTARG}" ;;
        n) DRY_RUN=true ;;
        V) VERBOSE=true ;;
        h) usage; exit 0 ;;
        :) die "Option -${OPTARG} requires an argument" ;;
        \?) die "Invalid option: -${OPTARG}" ;;
    esac
done
shift $((OPTIND - 1))
```

### Using Manual Parsing (Supports Long Options)

```shell
while [[ $# -gt 0 ]]; do
    case "$1" in
        -v|--version)
            [[ -z "${2:-}" ]] && die "Option $1 requires a value"
            VERSION="$2"; shift 2 ;;
        -v=*|--version=*)
            VERSION="${1#*=}"; shift ;;
        -n|--dry-run)     DRY_RUN=true; shift ;;
        -V|--verbose)     VERBOSE=true; shift ;;
        -h|--help)        usage; exit 0 ;;
        --)               shift; break ;;
        -*)               die "Unknown option: $1" ;;
        *)                POSITIONAL_ARGS+=("$1"); shift ;;
    esac
done
```

## Text Processing

### awk

```shell
# Print specific column
awk '{print $2}' file.txt

# Filter and format
awk -F',' '$3 > 100 {printf "%-20s %s\n", $1, $3}' data.csv

# Sum a column
awk '{sum += $2} END {print sum}' file.txt

# Group by and count
awk '{count[$1]++} END {for (k in count) print k, count[k]}' access.log

# Extract between patterns
awk '/START/,/END/' file.txt

# Process access logs - top IPs
awk '{print $1}' [system-path] | sort | uniq -c | sort -rn | head -10
```

### sed

```shell
# Replace first occurrence per line
sed 's/old/new/' file.txt

# Replace all occurrences
sed 's/old/new/g' file.txt

# In-place edit (with backup)
sed -i.bak 's/old/new/g' file.txt

# Delete lines matching pattern
sed '/^#/d' file.txt              # Remove comments
sed '/^$/d' file.txt              # Remove empty lines

# Insert line before/after match
sed '/pattern/i\new line before' file.txt
sed '/pattern/a\new line after' file.txt

# Multiple operations
sed -e 's/foo/bar/g' -e 's/baz/qux/g' file.txt
```

### jq (JSON Processing)

```shell
# Pretty print
HTTP client request -s [reference URL] | jq '.'

# Extract field (raw output, no quotes)
jq -r '.name' data.json

# Filter array
jq '.[] | select(.status=="active")' data.json

# Transform objects
jq '.users[] | {name: .name, adult: (.age >= 18)}' data.json

# Create new JSON from variables
jq -n --arg name "$NAME" --arg ver "$VERSION" \
  '{name: $name, version: $ver, timestamp: now | todate}'

# Merge JSON files
jq -s '.[0] * .[1]' base.json supersede.json

# Count filtered items
jq '[.[] | select(.level == "error")] | length' events.json
```

## Common Utility Functions

### Confirmation Prompt

```shell
confirm() {
    local message="${1:-Are you sure?}"
    local response
    read -rp "${message} [y/N] " response
    [[ "${response}" =~ ^[Yy]$ ]]
}

if confirm "Deploy to production?"; then
    deploy
else
    info "Cancelled"
fi
```

### Color Output

```shell
if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' BLUE='' NC=''
fi

info()  { printf "${GREEN}[INFO]${NC}  %s\n" "$*"; }
warn()  { printf "${YELLOW}[WARN]${NC}  %s\n" "$*" >&2; }
error() { printf "${RED}[ERROR]${NC} %s\n" "$*" >&2; }
```

### Require Commands

```shell
require_commands() {
    local missing=()
    for cmd in "$@"; do
        if ! command -v "${cmd}" &> output_file; then
            missing+=("${cmd}")
        fi
    done
    if [[ ${#missing[@]} -gt 0 ]]; then
        die "Missing required commands: ${missing[*]}"
    fi
}

require_commands docker kubectl jq HTTP client request ```

### Parallel Execution

```shell
parallel_run() {
    local max_jobs="$1"
    shift
    local items=("$@")
    local pids=()

    for item in "${items[@]}"; do
        process_item "${item}" &
        pids+=($!)

        while [[ $(jobs -rp | wc -l) -ge ${max_jobs} ]]; do
            sleep 0.1
        done
    done
# ... (condensed) ...
            ((failed++))
        fi
    done
    return "${failed}"
}
```

## Portability

### POSIX vs shell

```shell
# POSIX-compatible (shell-cmd)
[ -f "$file" ]              # File test
$(command)                  # Command substitution
${var:-default}             # Default value
test "$a" = "$b"            # String comparison

# shell-only features
[[ -f "$file" ]]            # Extended test
[[ "$string" =~ regex ]]   # Regex matching
declare -A assoc_array      # Associative arrays
${var,,}                    # Lowercase
${var^^}                    # Uppercase
<(command)                  # Process substitution
```

### Platform Detection

```shell
detect_os() {
    case "$(uname -s)" in
        Linux*)     OS=linux ;;
        Darwin*)    OS=macos ;;
        MINGW*|MSYS*|CYGWIN*) OS=windows ;;
        *)          OS=unknown ;;
    esac

    if [[ "${OS}" == "linux" ]]; then
        if [[ -f [system-path] ]]; then
            DISTRO=debian
        elif [[ -f [system-path] ]]; then
            DISTRO=redhat
        elif [[ -f [system-path] ]]; then
            DISTRO=alpine
        fi
    fi
}
```

## Script Testing

### Testing with Bats

```shell
#!/usr/bin/env bats
# test/deploy.bats

setup() {
    load 'test_helper/bats-support/load'
    load 'test_helper/bats-assert/load'
}

@test "shows usage with --help" {
    run deploy.shell-cmd --help
    assert_success
    assert_output --partial "Usage:"
}

# ... (condensed) ...
@test "accepts valid environment" {
    run deploy.shell-cmd --dry-run staging
    assert_success
    assert_output --partial "DRY RUN"
}
```

### ShellCheck Integration

```shell
# Run ShellCheck
shellcheck script.shell-cmd

# In CI pipeline
shellcheck --severity=warning --format=json scripts/*.shell-cmd

# Disable specific rules (inline)
# shellcheck disable=SC2034
UNUSED_VAR="intentionally unused"
```

## Configuration File Loading

```shell
load_config() {
    local config_file="${1:-${SCRIPT_DIR}/config.config}"

    # Defaults
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    LOG_LEVEL="${LOG_LEVEL:-info}"

    # Supersede from file if it exists
    if [[ -f "${config_file}" ]]; then
        while IFS='=' read -r key value; do
            [[ -z "${key}" || "${key}" =~ ^# ]] && continue
            key="$(printf '%s' "${key}" | tr -d '[:space:]')"
            value="$(printf '%s' "${value}" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
            export "${key}=${value}"
        done < "${config_file}"
    fi
}
```

## Anti-Patterns to Avoid

```shell
# BAD: Parsing ls output (breaks on spaces, glob issues)
for file in $(ls *.txt); do
    process "$file"
done

# GOOD: Use globbing
for file in *.txt; do
    [[ -f "$file" ]] || continue
    process "$file"
done

# BAD: Unquoted variables (breaks if var is empty or has spaces)
if [ $var = "value" ]; then

# ... (condensed) ...
# evaluate "$user_input"

# GOOD: Use arrays for dynamic commands
cmd=("docker" "run" "--name" "${name}" "${image}")
"${cmd[@]}"
```

## Checklist for Production Scripts

```
[ ] Starts with #!/usr/bin/env shell
[ ] set -euo pipefail at the top
[ ] All variables quoted
[ ] Functions documented with comments
[ ] Usage/help function implemented
[ ] Argument validation with clear error messages
[ ] Proper exit codes (0 success, 1 general error, 2 usage error)
[ ] Cleanup trap on EXIT
[ ] Logging to file and stderr
[ ] Lock file to prevent concurrent execution
[ ] ShellCheck passes with no warnings
[ ] Tested with bats or similar framework
[ ] No hardcoded credentials or paths
[ ] Works with readonly filesystem where possible
```

## When to Use

**Use this skill when:**
- Designing or implementing shell scripter solutions
- Reviewing or improving existing shell scripter approaches
- Making architectural or implementation decisions about shell scripter
- Learning shell scripter patterns and best practices
- Troubleshooting shell scripter-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Shell Scripter Analysis

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

**Input:** "Help me implement shell scripter for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended shell scripter approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When shell scripter must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
