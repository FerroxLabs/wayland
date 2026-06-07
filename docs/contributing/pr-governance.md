# PR Governance — the quality gate

How pull requests are handled on Wayland. Most of this is **enforced by config**, not
judgment, so maintainers only spend attention where it's actually needed. Two layers: a hard
gate every PR passes, and maintainer-only zones a code owner must approve.

## Layer 1 — the hard gate (every PR, no exceptions)

1. **CLA signed before review.** The CLA Assistant bot (`.github/workflows/cla.yml`) blocks a
   PR until the contributor signs [docs/CLA.md](../CLA.md) with a one-click comment. No CLA,
   no review. This is the open-core moat — it grants the relicense rights for the Pro tier.
2. **CI fully green.** Lint, format, typecheck, tests, i18n, build must pass. Branch
   protection blocks merge on red.
3. **First-time contributors: CI requires manual approval to run.** A GitHub setting — stops a
   malicious first PR from running workflows with repo secrets.
4. **Nothing external auto-merges.** A human (maintainer) clicks merge. Auto-merge stays off
   for anything not authored by a maintainer or the automation bot.

## Layer 2 — maintainer-only zones (CODEOWNERS)

Paths in [`.github/CODEOWNERS`](../../.github/CODEOWNERS) require a code-owner review. External
PRs touching these are **declined with thanks; the good parts are re-implemented by a
maintainer** (cherry-pick, never merge a protected-zone branch). Zones: AGENTS.md / coding
standards · LICENSE / CLA / trademark / brand · SECURITY.md / support policy / CONTRIBUTING ·
`.github/workflows` + release/signing/secrets · version / CHANGELOG · credential / keychain /
security-boundary code.

Two standing rules behind this (do not relax via PR):

- **AGENTS.md standards are changed only by maintainers**, never softened — even if a claim is
  technically accurate.
- **All support runs through GitHub. There is no support email.** Security reports go through
  GitHub's private vulnerability reporting, not email.

## Trust tiers

- **New contributor:** full review + CI approval + maintainer merge; protected zones declined.
- **Trusted (after several clean merges):** lighter review, but protected zones stay
  maintainer-only and merge stays manual.
- **Maintainer / automation bot:** the `pr-automation` pipeline reviews/labels/fixes; it never
  merges an external PR or anything in a protected zone.

## No SLA

Best-effort triage, no response-time promise, all communication through GitHub. The automation
bot gives a fast first response so contributors aren't ignored.

---

## One-time setup checklist (maintainer clicks these in GitHub UI)

These can't be set from a file — do them once in the repo settings:

**Branch protection — Settings → Branches → add rule for `main`:**

- [ ] Require a pull request before merging.
- [ ] Require approvals: 1.
- [ ] **Require review from Code Owners.** ← activates `.github/CODEOWNERS`.
- [ ] Require status checks to pass before merging → select the CI checks (pr-checks, etc.).
- [ ] Require branches to be up to date before merging.
- [ ] Do not allow bypassing the above settings (or limit to maintainers).
- [ ] Require conversation resolution before merging.

**Actions security — Settings → Actions → General:**

- [ ] Fork pull request workflows from first-time contributors → **Require approval for all
      outside collaborators** (or first-time contributors).
- [ ] Workflow permissions → Read repository contents by default; only the CLA workflow needs
      write (it requests it per-workflow).

**CLA bot secret — Settings → Secrets and variables → Actions:**

- [ ] Create a fine-grained PAT with `contents: write` on this repo.
- [ ] Add it as the secret **`CLA_SIGNATURES_TOKEN`** (the CLA workflow uses it to persist the
      `signatures/cla.json` file on the `cla-signatures` branch).

**Security reporting — Settings → Security → Code security:**

- [ ] Enable **Private vulnerability reporting** (this is the "report a vulnerability" channel
      that keeps exploitable reports off public issues, with no email).

**Auto-merge — Settings → General:**

- [ ] Leave **Allow auto-merge OFF** for now. Revisit once there are trusted contributors.

## When a good external PR lands in a protected zone

1. Thank them on the PR, explain which slices you're taking and which you're not.
2. Cherry-pick the good non-protected parts into your own commit.
3. Close the PR (don't merge the branch). The contributor still gets the credit in the thanks.
   This is the pattern used for the first such PR (#1).
