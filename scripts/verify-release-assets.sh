#!/usr/bin/env bash
#
# verify-release-assets.sh
#
# Assert that a prepared release-assets/ directory contains the COMPLETE set of
# artifacts the build is supposed to produce - per platform and per target - and
# fail on any absence.
#
# Usage:
#   ./scripts/verify-release-assets.sh [OUTPUT_DIR]
#
# #989: this verifier previously checked a hand-picked SUBSET (the .exe, .dmg
# and .deb distributables) and had no zip expectation at all. That blind spot is
# exactly why #941 shipped: the Windows portable zip was built, discarded by a
# bad artifact glob, and no gate noticed the absence for multiple releases. A
# gate that only confirms a few known names cannot report an artifact class it
# was never told to look for, so the expected set is now DECLARED explicitly
# below and every entry is required.

set -euo pipefail

OUTPUT_DIR="${1:-release-assets}"
CHANNEL="${WAYLAND_UPDATE_CHANNEL:-latest}"
ERRORS=0

if [[ ! "$CHANNEL" =~ ^[a-z0-9-]+$ ]]; then
  echo "FAIL: invalid WAYLAND_UPDATE_CHANNEL: $CHANNEL"
  exit 1
fi

# ---------------------------------------------------------------------------
# 1) Updater metadata - the six feeds electron-updater resolves by name.
# ---------------------------------------------------------------------------
for f in "$CHANNEL.yml" "$CHANNEL-mac.yml" "$CHANNEL-linux.yml" "$CHANNEL-linux-arm64.yml"; do
  if [ ! -f "$OUTPUT_DIR/$f" ]; then
    echo "FAIL: missing canonical metadata: $f"
    ERRORS=$((ERRORS + 1))
  fi
done

extract_ref_file() {
  local metadata_file="$1"
  local ref
  ref=$(grep -E '^path:' "$metadata_file" | head -n 1 | sed -E 's/^path:[[:space:]]*//')
  if [ -z "$ref" ]; then
    ref=$(grep -E '^[[:space:]]*-?[[:space:]]*url:' "$metadata_file" | head -n 1 | sed -E 's/^[[:space:]]*-?[[:space:]]*url:[[:space:]]*//')
  fi
  echo "$ref"
}

assert_metadata_points_to_existing_file() {
  local metadata_name="$1"
  local expected_pattern="$2"
  local metadata_path="$OUTPUT_DIR/$metadata_name"

  local ref_file
  ref_file=$(extract_ref_file "$metadata_path")

  if [ -z "$ref_file" ]; then
    echo "FAIL: $metadata_name has no path/url entry"
    ERRORS=$((ERRORS + 1))
    return
  fi

  if [[ ! "$ref_file" =~ $expected_pattern ]]; then
    echo "FAIL: $metadata_name points to unexpected file: $ref_file"
    ERRORS=$((ERRORS + 1))
    return
  fi

  if [ ! -f "$OUTPUT_DIR/$ref_file" ]; then
    echo "FAIL: $metadata_name references missing file: $ref_file"
    ERRORS=$((ERRORS + 1))
    return
  fi

  echo "PASS: $metadata_name -> $ref_file"
}

assert_metadata_points_to_existing_file "$CHANNEL.yml" "(win-x64|win32-x64|x64)"
assert_metadata_points_to_existing_file "$CHANNEL-mac.yml" "(mac-x64|darwin-x64|x64)"
assert_metadata_points_to_existing_file "$CHANNEL-linux.yml" "(linux|AppImage|deb)"
assert_metadata_points_to_existing_file "$CHANNEL-linux-arm64.yml" "(arm64|aarch64)"

for f in "$CHANNEL-win-arm64.yml" "$CHANNEL-arm64-mac.yml"; do
  if [ ! -f "$OUTPUT_DIR/$f" ]; then
    echo "FAIL: missing arch-specific updater metadata: $f"
    ERRORS=$((ERRORS + 1))
  else
    echo "PASS: $f exists"
  fi
done

# ---------------------------------------------------------------------------
# 2) Resolve the release version the artifact names are built from.
#
# electron-builder.yml sets artifactName to
# ${productName}-${version}-${os}-${arch}.${ext} on every platform, so the whole
# expected set is derivable from one version string. It is read from the
# canonical channel feed (which step 1 already required to exist) so the
# verifier needs no argument on either the CI fixture path or the real release
# path; WAYLAND_RELEASE_VERSION overrides it.
# ---------------------------------------------------------------------------
VERSION="${WAYLAND_RELEASE_VERSION:-}"
if [ -z "$VERSION" ] && [ -f "$OUTPUT_DIR/$CHANNEL.yml" ]; then
  VERSION=$(grep -E '^version:' "$OUTPUT_DIR/$CHANNEL.yml" | head -n 1 | sed -E "s/^version:[[:space:]]*//; s/['\"]//g" || true)
fi

if [ -z "$VERSION" ]; then
  echo "FAIL: cannot resolve release version (no WAYLAND_RELEASE_VERSION and no version: in $CHANNEL.yml)"
  echo ""
  echo "FAILED: $((ERRORS + 1)) errors found"
  exit 1
fi

echo "PASS: resolved release version $VERSION"

# ---------------------------------------------------------------------------
# 3) The DECLARED expected artifact set.
#
# One entry per (platform, target, arch) that electron-builder.yml is configured
# to produce, plus the blockmaps the differential updater depends on. Keep this
# table in lockstep with the `target:` lists in electron-builder.yml - adding a
# target there without adding it here recreates the #989 blind spot.
#
#   win:   nsis (.exe) + zip           -> x64, arm64   (+ .exe.blockmap)
#   mac:   dmg + zip                   -> x64, arm64   (+ .dmg/.zip.blockmap)
#   linux: AppImage + deb + rpm        -> x64, arm64
#
# electron-builder rewrites ${arch} per linux packaging format: deb uses
# amd64/arm64, rpm uses x86_64/aarch64, AppImage uses x86_64/arm64. These are the
# names observed on every shipped release (v0.11.3 through v0.12.0).
#
# No blockmap is required for the Windows zip: it is a portable distribution,
# not an update feed target, and electron-builder emits no blockmap for it.
# No checksum sidecar files are expected - the pipeline publishes none; integrity
# is carried by the sha512 fields inside the updater metadata.
# ---------------------------------------------------------------------------
EXPECTED_ARTIFACTS=(
  # Windows - nsis installer + its differential-update blockmap
  "Wayland-$VERSION-win-x64.exe"
  "Wayland-$VERSION-win-x64.exe.blockmap"
  "Wayland-$VERSION-win-arm64.exe"
  "Wayland-$VERSION-win-arm64.exe.blockmap"
  # Windows - portable zip (the class #941 silently dropped)
  "Wayland-$VERSION-win-x64.zip"
  "Wayland-$VERSION-win-arm64.zip"
  # macOS - dmg + the zip the macOS updater actually downloads
  "Wayland-$VERSION-mac-x64.dmg"
  "Wayland-$VERSION-mac-x64.dmg.blockmap"
  "Wayland-$VERSION-mac-arm64.dmg"
  "Wayland-$VERSION-mac-arm64.dmg.blockmap"
  "Wayland-$VERSION-mac-x64.zip"
  "Wayland-$VERSION-mac-x64.zip.blockmap"
  "Wayland-$VERSION-mac-arm64.zip"
  "Wayland-$VERSION-mac-arm64.zip.blockmap"
  # Linux - all three packaging formats, both arches
  "Wayland-$VERSION-linux-x86_64.AppImage"
  "Wayland-$VERSION-linux-arm64.AppImage"
  "Wayland-$VERSION-linux-amd64.deb"
  "Wayland-$VERSION-linux-arm64.deb"
  "Wayland-$VERSION-linux-x86_64.rpm"
  "Wayland-$VERSION-linux-aarch64.rpm"
)

for f in "${EXPECTED_ARTIFACTS[@]}"; do
  if [ ! -f "$OUTPUT_DIR/$f" ]; then
    echo "FAIL: missing release artifact: $f"
    ERRORS=$((ERRORS + 1))
  else
    echo "PASS: $f exists"
  fi
done

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "FAILED: $ERRORS errors found"
  exit 1
fi

echo "ALL CHECKS PASSED"
