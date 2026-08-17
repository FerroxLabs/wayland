#!/usr/bin/env bash
#
# create-mock-release-artifacts.sh
#
# Build a fake build-artifacts/ tree shaped exactly like the real one that
# _build-reusable.yml uploads, so prepare-release-assets.sh and
# verify-release-assets.sh can be exercised in CI without a real build.
#
# #989: the artifact names below MIRROR a real release (see any published tag,
# e.g. v0.12.0). They are not illustrative placeholders - verify-release-assets.sh
# asserts the complete declared set, so if this fixture drifts from what
# electron-builder.yml actually emits, the CI release-script-test job goes red
# and the drift is caught here rather than in a shipped release.

set -euo pipefail

ARTIFACTS_DIR="${1:-build-artifacts}"
VERSION="${2:-1.0.0}"

rm -rf "$ARTIFACTS_DIR"
mkdir -p "$ARTIFACTS_DIR/windows-build-x64"
mkdir -p "$ARTIFACTS_DIR/windows-build-arm64"
mkdir -p "$ARTIFACTS_DIR/macos-build-x64"
mkdir -p "$ARTIFACTS_DIR/macos-build-arm64"
mkdir -p "$ARTIFACTS_DIR/linux-build-x64"
mkdir -p "$ARTIFACTS_DIR/linux-build-arm64"

# Windows x64 - nsis installer + blockmap + portable zip
touch "$ARTIFACTS_DIR/windows-build-x64/Wayland-$VERSION-win-x64.exe"
touch "$ARTIFACTS_DIR/windows-build-x64/Wayland-$VERSION-win-x64.exe.blockmap"
touch "$ARTIFACTS_DIR/windows-build-x64/Wayland-$VERSION-win-x64.zip"
cat > "$ARTIFACTS_DIR/windows-build-x64/latest.yml" <<EOF
version: $VERSION
files:
  - url: Wayland-$VERSION-win-x64.exe
    sha512: fake-sha512-x64
    size: 100000
path: Wayland-$VERSION-win-x64.exe
sha512: fake-sha512-x64
releaseDate: '2025-01-01'
EOF

# Windows arm64
touch "$ARTIFACTS_DIR/windows-build-arm64/Wayland-$VERSION-win-arm64.exe"
touch "$ARTIFACTS_DIR/windows-build-arm64/Wayland-$VERSION-win-arm64.exe.blockmap"
touch "$ARTIFACTS_DIR/windows-build-arm64/Wayland-$VERSION-win-arm64.zip"
cat > "$ARTIFACTS_DIR/windows-build-arm64/latest.yml" <<EOF
version: $VERSION
files:
  - url: Wayland-$VERSION-win-arm64.exe
    sha512: fake-sha512-arm64
    size: 100000
path: Wayland-$VERSION-win-arm64.exe
sha512: fake-sha512-arm64
releaseDate: '2025-01-01'
EOF

# macOS x64 - dmg + zip, each with a blockmap
touch "$ARTIFACTS_DIR/macos-build-x64/Wayland-$VERSION-mac-x64.dmg"
touch "$ARTIFACTS_DIR/macos-build-x64/Wayland-$VERSION-mac-x64.dmg.blockmap"
touch "$ARTIFACTS_DIR/macos-build-x64/Wayland-$VERSION-mac-x64.zip"
touch "$ARTIFACTS_DIR/macos-build-x64/Wayland-$VERSION-mac-x64.zip.blockmap"
cat > "$ARTIFACTS_DIR/macos-build-x64/latest-mac.yml" <<EOF
version: $VERSION
files:
  - url: Wayland-$VERSION-mac-x64.dmg
    sha512: fake-sha512-mac-x64
    size: 200000
EOF

# macOS arm64
touch "$ARTIFACTS_DIR/macos-build-arm64/Wayland-$VERSION-mac-arm64.dmg"
touch "$ARTIFACTS_DIR/macos-build-arm64/Wayland-$VERSION-mac-arm64.dmg.blockmap"
touch "$ARTIFACTS_DIR/macos-build-arm64/Wayland-$VERSION-mac-arm64.zip"
touch "$ARTIFACTS_DIR/macos-build-arm64/Wayland-$VERSION-mac-arm64.zip.blockmap"
cat > "$ARTIFACTS_DIR/macos-build-arm64/latest-mac.yml" <<EOF
version: $VERSION
files:
  - url: Wayland-$VERSION-mac-arm64.dmg
    sha512: fake-sha512-mac-arm64
    size: 200000
EOF

# Linux x64 - AppImage + deb + rpm (electron-builder arch naming differs per format)
touch "$ARTIFACTS_DIR/linux-build-x64/Wayland-$VERSION-linux-x86_64.AppImage"
touch "$ARTIFACTS_DIR/linux-build-x64/Wayland-$VERSION-linux-amd64.deb"
touch "$ARTIFACTS_DIR/linux-build-x64/Wayland-$VERSION-linux-x86_64.rpm"
cat > "$ARTIFACTS_DIR/linux-build-x64/latest-linux.yml" <<EOF
version: $VERSION
files:
  - url: Wayland-$VERSION-linux-x86_64.AppImage
    sha512: fake-sha512-linux
    size: 300000
EOF

# Linux arm64
touch "$ARTIFACTS_DIR/linux-build-arm64/Wayland-$VERSION-linux-arm64.AppImage"
touch "$ARTIFACTS_DIR/linux-build-arm64/Wayland-$VERSION-linux-arm64.deb"
touch "$ARTIFACTS_DIR/linux-build-arm64/Wayland-$VERSION-linux-aarch64.rpm"
cat > "$ARTIFACTS_DIR/linux-build-arm64/latest-linux-arm64.yml" <<EOF
version: $VERSION
files:
  - url: Wayland-$VERSION-linux-arm64.AppImage
    sha512: fake-sha512-linux-arm64
    size: 300000
EOF

echo "Mock artifacts created in $ARTIFACTS_DIR:"
find "$ARTIFACTS_DIR" -type f | sort
