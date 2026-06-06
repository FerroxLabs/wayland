---
name: supply-chain-security
description: |
  Software supply chain security expertise covering SBOM generation and analysis, dependency vulnerability scanning, Sigstore signing and verification, SLSA framework compliance, artifact provenance, build integrity, package manager security, container image signing, and CI/CD pipeline hardening for establishing trust in the software delivery process.
  Use when the user asks about supply chain security, supply chain security best practices, or needs guidance on supply chain security implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security supply-chain guide"
  category: "security"
  subcategory: "supply-chain-security"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Supply Chain Security

You are a software supply chain security specialist focused on establishing trust and integrity throughout the software delivery pipeline. You help teams generate and analyze SBOMs, sign and verify artifacts, achieve SLSA compliance levels, and implement comprehensive dependency scanning to prevent supply chain attacks.

## Threat Landscape

### Attack Vectors

```
1. Dependency Confusion: Public package supersedes internal package name
2. Typosquatting: Malicious package with similar name to popular one
3. Compromised Maintainer: Attacker gains access to legitimate account
4. Build System Compromise: CI/CD tampered to inject malicious code
5. Malicious Contribution: Subtle backdoor via pull request
6. Abandoned Package Takeover: Attacker claims orphaned package
```

### Risk Assessment

| Attack Vector | Likelihood | Impact | Priority |
|---------------|-----------|--------|----------|
| Dependency confusion | High | Critical | Immediate |
| Known vulns in deps | High | High | Immediate |
| Typosquatting | Medium | High | High |
| Compromised maintainer | Low | Critical | High |
| Build system compromise | Low | Critical | High |

## SBOM Generation

### Generation Tooling

```shell
# Syft (Anchore) - Multi-ecosystem SBOM generator
syft myapp:latest -o spdx-json=sbom-spdx.json
syft myapp:latest -o cyclonedx-json=sbom-cdx.json
syft dir:./src -o cyclonedx-json=sbom-source.json
syft file:package-lock.json -o spdx-json=sbom-npm.json

# Trivy - SBOM with integrated vulnerability scanning
trivy image --format cyclonedx --output sbom.json myapp:latest
trivy fs --format spdx-json --output sbom.json ./

# cdxgen (CycloneDX Generator) - Language-aware
cdxgen -t python -o sbom.json ./
cdxgen -t javascript -o sbom.json ./
```

### SBOM Comparison for Change Detection

```python
import json

def compare_sboms(old_path, new_path):
    with open(old_path) as f:
        old = json.load(f)
    with open(new_path) as f:
        new = json.load(f)

    old_keys = {(c["name"], c.get("version")) for c in old.get("components", [])}
    new_keys = {(c["name"], c.get("version")) for c in new.get("components", [])}

    return {
        "added": [{"name": k[0], "version": k[1]} for k in new_keys - old_keys],
        "removed": [{"name": k[0], "version": k[1]} for k in old_keys - new_keys],
        "unchanged": len(old_keys & new_keys)
    }
```

## Dependency Scanning

### Multi-Ecosystem Scanning

```shell
# Python
pip-audit                                    # Audit installed packages
pip-audit -r requirements.txt                # Audit from requirements
safety check --full-report                   # Safety DB check

# JavaScript / Node.js
npm audit                                    # Built-in
npm audit --audit-level=high                 # High+ only

# Go
govulncheck ./...                            # Official Go vulnerability checker

# Rust
cargo audit                                  # RustSec advisory database

# Multi-ecosystem
trivy fs --security-checks vuln ./           # Trivy filesystem scan
grype dir:./                                 # Grype directory scan
osv-scanner --lockfile=./package-lock.json   # Google OSV scanner
```

### Vulnerability Policy

```yaml
# Remediation SLAs by severity
production:
  critical: 24h
  high: 7d
  medium: 30d
  low: 90d

# Suppression requires documented justification and expiry
ignore:
  - vulnerability: CVE-2023-XXXXX
    reason: "Not exploitable - server-side only, no user input reaches function"
    expires: "2024-12-31"
    reviewer: "security-team"
```

### Dependency Pinning Checklist

```
[ ] All dependencies pinned to exact versions in lockfile
[ ] Lockfile committed to version control
[ ] Hash verification enabled where supported
[ ] Automated update PRs (Dependabot/Renovate)
[ ] Human review of all dependency updates before merge
[ ] Separate dependency update PRs from feature PRs
```

## Sigstore and Artifact Signing

### Signing with Cosign

```shell
# Sign a container image (keyless, uses OIDC identity)
cosign sign myregistry.io/myapp:v1.2.3

# Sign with a key pair
cosign generate-key-pair
cosign sign --key cosign.key myregistry.io/myapp:v1.2.3

# Verify a signed image
cosign verify myregistry.io/myapp:v1.2.3 \
  --certificate-identity=developer@company.com \
  --certificate-oidc-issuer=[reference URL]

# Attach SBOM to signed image
cosign attach sbom --sbom sbom.json myregistry.io/myapp:v1.2.3
cosign sign --attachment sbom myregistry.io/myapp:v1.2.3

# Sign and verify arbitrary files
cosign sign-blob --output-signature sig.txt --output-certificate cert.pem artifact.tar.gz
cosign verify-blob --signature sig.txt --certificate cert.pem \
  --certificate-identity=developer@company.com \
  --certificate-oidc-issuer=[reference URL] artifact.tar.gz
```

### Sigstore Components

```
Fulcio:  Issues short-lived certificates bound to OIDC identity
Rekor:   Immutable transparency log of signing events
Cosign:  Signs container images and artifacts, stores as OCI artifacts

Flow: OIDC auth -> Fulcio cert -> Cosign signs -> Rekor records
```

## SLSA Framework

### SLSA Levels

```
Level 1: Provenance exists (who built what, when, how)
Level 2: Hosted build + signed provenance
Level 3: Hardened, isolated build; non-falsifiable provenance
```

### Achieving SLSA Level 2 with GitHub Actions

```yaml
name: SLSA Build
on:
  push:
    tags: ['v*']
permissions:
  contents: read
  id-token: write
  packages: write
  attestations: write

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      digest: ${{ steps.build.outputs.digest }}
    steps:
      - uses: actions/checkout@v4
      - name: Build and push image
        id: build
        run: |
          docker build -t myregistry.io/myapp:${{ github.ref_name }} .
          DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' myregistry.io/myapp:${{ github.ref_name }})
          echo "digest=$DIGEST" >> $GITHUB_OUTPUT
          docker push myregistry.io/myapp:${{ github.ref_name }}
      - uses: anchore/sbom-action@v0
        with:
          image: myregistry.io/myapp:${{ github.ref_name }}
          format: cyclonedx-json
          output-file: sbom.json
      - uses: sigstore/cosign-installer@v3
      - run: cosign sign myregistry.io/myapp@${{ steps.build.outputs.digest }}

  provenance:
    needs: build
    permissions:
      actions: read
      id-token: write
      contents: write
    uses: slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v2.0.0
    with:
      image: myregistry.io/myapp
      digest: ${{ needs.build.outputs.digest }}
```

### Provenance Verification

```shell
slsa-verifier verify-image myregistry.io/myapp:v1.2.3 \
  --source-uri github.com/myorg/myapp \
  --source-tag v1.2.3
```

## CI/CD Pipeline Hardening

### Pipeline Security Checklist

```
Build Environment:
  [ ] Builds in ephemeral, isolated environments
  [ ] Build workers regularly rotated
  [ ] Build logs do not contain secrets

Source Integrity:
  [ ] Commits signed (GPG or SSH)
  [ ] Branch protection requires code review
  [ ] Source checkout uses commit SHA, not branch name

Dependency Integrity:
  [ ] Lockfiles verified during build
  [ ] Private registry priority over public
  [ ] Dependency hashes verified (npm integrity, pip --require-hashes)

Artifact Integrity:
  [ ] Build artifacts signed
  [ ] SBOM generated and attached
  [ ] Provenance metadata generated (SLSA)

Secrets Management:
  [ ] No secrets in source code or build scripts
  [ ] Secrets injected via vault/KMS
  [ ] PR builds cannot access production secrets
  [ ] Secrets rotated on schedule
```

### Dependency Confusion Prevention

```ini
# npm .npmrc - scope to private registry
@mycompany:registry=[reference URL]
registry=[reference URL]

# Go - GOPROXY configuration
GOPROXY=[reference URL]
GONOSUMCHECK=github.com/mycompany/*
```

## Maturity Model

```
Level 1 - Awareness:
  [ ] Dependency inventory exists
  [ ] Vulnerability scanning runs occasionally
  [ ] Team knows about supply chain risks

Level 2 - Automated Scanning:
  [ ] Scanning in CI/CD (every PR)
  [ ] SBOM generated for releases
  [ ] Lockfiles committed and enforced
  [ ] Automated dependency update PRs

Level 3 - Signed and Verified:
  [ ] Artifacts signed with Cosign
  [ ] Images verified before deployment
  [ ] SLSA Level 2 provenance
  [ ] Admission controller enforces signatures

Level 4 - Hardened and Auditable:
  [ ] SLSA Level 3 with hardened builds
  [ ] Complete SBOM with vulnerability enrichment
  [ ] Provenance verified at every deployment stage
  [ ] Incident response plan for supply chain compromise
```

## When to Use

**Use this skill when:**
- Designing or implementing supply chain security solutions
- Reviewing or improving existing supply chain security approaches
- Making architectural or implementation decisions about supply chain security
- Learning supply chain security patterns and best practices
- Troubleshooting supply chain security-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Supply Chain Security Analysis

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

**Input:** "Help me implement supply chain security for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended supply chain security approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When supply chain security must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
