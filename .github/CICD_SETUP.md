# CI/CD Setup Guide

## Overview

This project is configured with a complete GitHub Actions CI/CD pipeline that supports automated building, testing, and publishing to multiple platforms.

## Workflow Overview

### 1. `build-and-release.yml` - Main Build and Release Pipeline

- **Trigger**: Only on pushes to the `main` branch
- **Features**:
  - Code quality checks (ESLint, Prettier, TypeScript)
  - Multi-platform builds (macOS Intel/Apple Silicon, Windows, Linux)
  - Automatic version tagging
  - Creates a Draft Release (requires manual approval and publishing)
- **Flow**:
  1. Code quality check
  2. Parallel builds across all three platforms
  3. Automatically creates a tag based on the version in `package.json`
  4. Waits for environment approval
  5. Creates a Draft Release (requires manual editing and publishing)

## Required GitHub Secrets

Configure the following secrets under Settings → Secrets and variables → Actions in your GitHub repository:

### macOS App Signing (optional, for publishing to the Mac App Store)

```
APPLE_ID=your-apple-developer-account-email
APPLE_ID_PASSWORD=app-specific-password
TEAM_ID=apple-developer-team-id
IDENTITY=signing-certificate-name
```

### GitHub Token

```
GH_TOKEN=your-Personal-Access-Token (starts with github_pat_)
```

**Note**: Must be configured manually because `contents: write` permission is required to create releases.

### Environment Secrets

Also configure the following under Settings → Environments → release:

```
GH_TOKEN=same-Personal-Access-Token
```

## How to Obtain Apple Signing Configuration

### 1. Apple ID App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. Click "App-Specific Passwords" in the "Sign-In and Security" section
4. Generate a new app-specific password
5. Copy the generated password as `APPLE_ID_PASSWORD`

### 2. Team ID

1. Go to the [Apple Developer Portal](https://developer.apple.com/account/)
2. Find the Team ID under "Membership Details"
3. Copy the Team ID as `TEAM_ID`

### 3. Signing Certificate Identity

1. Open Xcode or Keychain Access
2. Look up your installed developer certificates
3. The certificate name looks like: "Developer ID Application: Your Name (TEAM_ID)"
4. Copy the full certificate name as `IDENTITY`

## Usage

### Recommended Release Flow (using release.sh)

1. Ensure code quality meets requirements
2. Bump the version using the release script:

   ```bash
   # Patch version
   ./scripts/release.sh patch

   # Feature version
   ./scripts/release.sh minor

   # Major version
   ./scripts/release.sh major

   # Pre-release version
   ./scripts/release.sh prerelease
   ```

3. The script will automatically:
   - Run code quality checks
   - Bump the version number
   - Create a git tag
   - Push to the `main` branch
4. GitHub Actions automatically triggers the build
5. Approve the release on the Deployments page
6. Edit the Draft Release content
7. Manually publish to users

### Direct Push Release

1. Manually update the version number in `package.json`
2. Commit and push to the `main` branch
3. GitHub Actions will automatically build and create a Draft Release

### Version Management Convention

- `patch`: Bug fix (1.0.0 → 1.0.1)
- `minor`: New feature (1.0.0 → 1.1.0)
- `major`: Breaking change (1.0.0 → 2.0.0)
- `prerelease`: Pre-release version (1.0.0 → 1.0.1-beta.0)

## Build Artifacts

After a successful build, the following files will be produced:

### macOS

- `.dmg` files (Intel and Apple Silicon versions)
- Application bundle

### Windows

- `.exe` NSIS installer (x64/arm64)
- `.zip` portable application (x64/arm64)

### Linux

- `.deb` package (x64/arm64/armv7l)
- `.AppImage` portable application (x64/arm64/armv7l)

## Troubleshooting

### Common Issues

1. **Release creation fails (403 error)**
   - Check that GH_TOKEN is correctly configured
   - Confirm the token format starts with `github_pat_`
   - Verify that GH_TOKEN is present in both the repository and the environment

2. **macOS signing fails**
   - Check that the Apple ID and password are correct
   - Confirm the Team ID and certificate name are accurate
   - Verify the Apple developer account status

3. **Build timeout (Windows)**
   - Windows builds are typically the slowest (may take 40+ minutes)
   - Consider disabling the MSI target to speed up the build

4. **Duplicate tag error**
   - CI/CD checks for and skips tags that already exist
   - If a tag was created manually, CI/CD will not create a duplicate

### Debugging

1. Check the GitHub Actions logs
2. Run the same build commands locally to test
3. Review the build scripts in `package.json`

## Security Recommendations

1. Regularly update GitHub Actions versions
2. Configure Secrets using the principle of least privilege
3. Periodically review and clean up unused Secrets
4. Monitor build logs to avoid exposing sensitive information

## Advanced Configuration

### Automatic Update Check

You can integrate in-app automatic update functionality using the GitHub Releases API to deliver automatic update notifications.

### Multi-Environment Deployment

The workflow can be extended to support separate deployments for development, testing, and production environments.

### Performance Optimization

- Use build caching to speed up builds
- Build different platforms in parallel
- Optimize dependency installation speed
