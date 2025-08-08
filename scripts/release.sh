#!/bin/bash
set -e

APP_NAME=qrimzn
DIST_DIR=dist
TAG=${1:-"v1.0.0"}

# Clean previous builds
rm -rf $DIST_DIR
mkdir -p $DIST_DIR

platforms=(
  "linux/amd64"
  "linux/arm64"
  "darwin/amd64"
  "darwin/arm64"
  "windows/amd64"
)

echo "📦 Building binaries for tag: $TAG"

for platform in "${platforms[@]}"; do
  IFS="/" read -r GOOS GOARCH <<< "$platform"
  output_dir="$DIST_DIR/${GOOS}-${GOARCH}"
  output_name=$APP_NAME
  [ "$GOOS" == "windows" ] && output_name+='.exe'

  mkdir -p "$output_dir"
  echo "🔧 Building $APP_NAME for $GOOS/$GOARCH with memory optimizations..."
  cd go
  # Build with memory optimizations for production
  GOOS=$GOOS GOARCH=$GOARCH CGO_ENABLED=0 \
    GOGC=25 GOMEMLIMIT=200MiB \
    go build \
      -ldflags="-s -w" \
      -gcflags="-l=4" \
      -o "../$output_dir/$output_name" main.go
  cd ..

  # Create compressed tarball or zip for each platform
  archive_name="${APP_NAME}-${TAG}-${GOOS}-${GOARCH}"
  if [ "$GOOS" == "windows" ]; then
    zip -j "$DIST_DIR/$archive_name.zip" "$output_dir/$output_name"
  else
    tar -czf "$DIST_DIR/$archive_name.tar.gz" -C "$output_dir" "$output_name"
  fi
done

echo "🚀 Creating GitHub release for $TAG..."

# Create the release if it doesn't exist
gh release view "$TAG" >/dev/null 2>&1 || gh release create "$TAG" -t "$TAG" -n "Release $TAG"

# Upload all artifacts
for file in $DIST_DIR/*.{tar.gz,zip}; do
  echo "⬆️ Uploading $file..."
  gh release upload "$TAG" "$file" --clobber
done

echo "✅ Release $TAG published with binaries."
