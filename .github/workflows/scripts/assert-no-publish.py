#!/usr/bin/env python3
"""Prove the acceptance dry-run chain cannot publish anything.

The dry run exists so the four release-acceptance gates can be executed without
pushing a tag. That is only safe if the three files it executes contain no verb
that creates a release, flips a draft, moves a tag, or publishes a package.

This scans the parsed YAML (every `run:` body and every `uses:` action) rather
than grepping the raw text, so the scanner's own pattern list can never match
itself and turn the gate into a false alarm.
"""

import re
import sys

import yaml

FILES = [
    ".github/workflows/release-acceptance-dryrun.yml",
    ".github/workflows/_release-observations-reusable.yml",
    ".github/workflows/_release-acceptance-reusable.yml",
]

# `gh release download` is read-only and is the one allowed `gh release` form.
FORBIDDEN = re.compile(
    r"gh\s+release\s+(edit|create|upload|delete)"
    r"|softprops/action-gh-release"
    r"|git\s+(tag|push)"
    r"|npm\s+publish"
    r"|--draft=false"
)

SKIP_STEP_IDS = {"no-publish-scan"}


def steps(workflow):
    for job in (workflow.get("jobs") or {}).values():
        uses = job.get("uses")
        if uses:
            yield "job.uses", uses
        for step in job.get("steps") or []:
            if step.get("id") in SKIP_STEP_IDS:
                continue
            for key in ("run", "uses"):
                if step.get(key):
                    yield f"step.{key}", str(step[key])


def main():
    failures = []
    for path in FILES:
        with open(path, encoding="utf-8") as handle:
            workflow = yaml.safe_load(handle)
        for where, text in steps(workflow):
            for match in FORBIDDEN.finditer(text):
                failures.append(f"{path}: {where}: {match.group(0)!r}")

    for failure in failures:
        print(f"::error::publishing verb reachable from the dry-run chain: {failure}")
    if failures:
        return 1
    print(f"no-publish invariant holds across {len(FILES)} workflow files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
