# Security

## Auto-update integrity

Auto-update `.deb` verification currently relies on GitHub release authentication + HTTPS download integrity. GPG-signed `.deb.sig` artifacts are tracked for the **v0.1.3+ release-infra chain** (requires a long-lived signing key plus a CI signing job, out-of-scope for v0.1.2-safety). See `src/process/services/autoUpdaterService.ts` for the download site where the GPG verification hook will be installed.
