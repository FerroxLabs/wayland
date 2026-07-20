# Plan 01-11 R6 proof environment

- Source commit: `b34750dd4bfa925825343a1cfa6766c1b85a6285`
- Source tree: `7fd377f4b0ed23d109d149da617c17828aa0c783`
- Audit-test parent: `42d2d4ff265680b06123d65d2ac86a05d45b081e`
- Worktree: `/Users/seandonahoe/gsd-workspaces/wayland-desktop-audit-01-11-r3/app`
- Captured at: `2026-07-19T20:59:50Z`
- OS: `Darwin 25.3.0 arm64`
- Bun: `1.3.11`
- Node: `v25.8.1`
- `bun.lock` SHA-256: `819b4bca770ed7ef660561308f88fa71922e58bde4e7504f45277b204622b0c1`

The aggregate log is sanitized before retention. Generated credentials are
replaced by explicit redaction markers; test counts, warnings, timings, and
exit status remain unchanged.

The focused suite is split into process, crypto/durability, and DOM shards.
Running the Argon2 correctness vectors and DOM worker pool in one Vitest process
was terminated by host resource pressure before producing a terminal receipt;
that incomplete run is not accepted or retained as green evidence. Every test
in the declared focused command is covered exactly once by the three retained
exit-zero shards.
