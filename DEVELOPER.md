# Developer Guide

This guide contains all the commands and workflows for developing, testing, building, and publishing the qrimzn package.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Go Binary Development](#go-binary-development)
- [TypeScript Package Development](#typescript-package-development)
- [Testing](#testing)
- [Building & Releases](#building--releases)
- [Local Installation & Testing](#local-installation--testing)
- [Publishing](#publishing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

```bash
# Required tools
- Go 1.21+
- Node.js 18+
- GitHub CLI (gh)
- yarn or npm
```

## Project Structure

```
qrimzn/
├── go/                     # Go binary source
│   ├── main.go            # Main binary logic
│   ├── assets/            # Embedded font files
│   ├── go.mod             # Go dependencies
│   └── README.md          # Go-specific docs
├── src/                   # TypeScript source
│   └── index.ts          # Main library exports
├── scripts/              # Build and install scripts
│   ├── release.sh        # Cross-platform build & GitHub release
│   └── install.cjs       # Post-install binary download
├── dist/                 # Built TypeScript (generated)
├── bin/                  # Local Go binary (generated)
└── package.json          # npm package config
```

## Go Binary Development

### Initial Setup

```bash
cd go
go mod tidy
```

### Local Development Build

```bash
# Build for current platform
cd go
CGO_ENABLED=0 go build -o ../bin/qrimzn main.go

# Make executable (Unix/macOS)
chmod +x ../bin/qrimzn
```

### Cross-Platform Builds

```bash
cd go

# Linux AMD64
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o qrimzn-linux-amd64 main.go

# Linux ARM64
CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o qrimzn-linux-arm64 main.go

# macOS AMD64 (Intel)
CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -o qrimzn-darwin-amd64 main.go

# macOS ARM64 (Apple Silicon)
CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -o qrimzn-darwin-arm64 main.go

# Windows AMD64
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -o qrimzn-windows-amd64.exe main.go
```

### Testing Go Binary

```bash
# Test QR code generation
./bin/qrimzn --help
./bin/qrimzn --type=qrcode --content="https://example.com" --code="TEST" > test.png

# Test image resizing
./bin/qrimzn --type=resize --width=400 < input.jpg > output.png

# Test with piped input
cat test.png | ./bin/qrimzn --type=resize --width=200 > resized.png
```

### Testing Different Image Formats

```bash
# Create test JPEG (macOS)
./bin/qrimzn --type=qrcode --content="test" --code="JPEG_TEST" > test.png
sips -s format jpeg test.png --out test.jpg

# Test JPEG resize
./bin/qrimzn --type=resize --width=400 < test.jpg > resized.png
file resized.png  # Should show PNG format

# Clean up
rm test.png test.jpg resized.png
```

## TypeScript Package Development

### Setup

```bash
# Install dependencies
yarn install
# or
npm install
```

### Building TypeScript

```bash
# Build the package
yarn build
# or
npm run build

# This creates:
# - dist/qrimzn.cjs.js (CommonJS)
# - dist/qrimzn.esm.js (ES modules)
# - dist/index.d.ts (TypeScript definitions)
```

### Development Workflow

```bash
# 1. Make changes to src/index.ts
# 2. Build the package
yarn build

# 3. Test locally (requires local binary)
cd go && CGO_ENABLED=0 go build -o ../bin/qrimzn main.go && cd ..
node -e "
import('./dist/qrimzn.esm.js').then(async ({ createQrCode, resizeImage }) => {
  const qr = await createQrCode('https://example.com', 'TEST');
  console.log('QR generated:', qr.length, 'bytes');
});
"
```

## Testing

### Create Test Scripts

```bash
# Create a comprehensive test file
cat > test-all.js << 'EOF'
import { createQrCode, resizeImage } from './dist/qrimzn.esm.js';
import fs from 'fs';

async function test() {
  console.log('🧪 Testing qrimzn functionality...');

  // Test QR code generation
  console.log('📱 Testing QR code generation...');
  const qr = await createQrCode('https://github.com/outranker/qrimzn', 'QRIMZN');
  fs.writeFileSync('test-qr.png', qr);
  console.log('✅ QR code generated');

  // Test image resizing
  console.log('🔄 Testing image resizing...');
  const sizes = [400, 800, 1200];
  for (const width of sizes) {
    const resized = await resizeImage(qr, width);
    fs.writeFileSync(`test-${width}.png`, resized);
    console.log(`✅ Resized to ${width}px`);
  }

  // Clean up
  fs.unlinkSync('test-qr.png');
  sizes.forEach(w => fs.unlinkSync(`test-${w}.png`));
  console.log('🧹 Cleaned up');
  console.log('🎉 All tests passed!');
}

test().catch(console.error);
EOF

# Run the test
node test-all.js

# Clean up
rm test-all.js
```

### Test JPEG Functionality

```bash
# Create JPEG test
cat > test-jpeg.js << 'EOF'
import { createQrCode, resizeImage } from './dist/qrimzn.esm.js';
import fs from 'fs';
import { execSync } from 'child_process';

async function testJpeg() {
  // Create QR as PNG
  const qr = await createQrCode('https://example.com', 'JPEG_TEST');
  fs.writeFileSync('temp.png', qr);

  // Convert to JPEG (macOS)
  execSync('sips -s format jpeg temp.png --out temp.jpg');

  // Test resizing JPEG
  const jpeg = fs.readFileSync('temp.jpg');
  const resized = await resizeImage(jpeg, 400);
  fs.writeFileSync('resized.png', resized);

  console.log('✅ JPEG resize successful');

  // Clean up
  fs.unlinkSync('temp.png');
  fs.unlinkSync('temp.jpg');
  fs.unlinkSync('resized.png');
}

testJpeg().catch(console.error);
EOF

node test-jpeg.js
rm test-jpeg.js
```

## Building & Releases

### Manual Build Process

```bash
# 1. Update version in package.json
# 2. Build TypeScript
yarn build

# 3. Build Go binaries and create GitHub release
chmod +x scripts/release.sh
./scripts/release.sh v1.1.1

# This will:
# - Build binaries for all platforms
# - Create compressed archives
# - Create GitHub release
# - Upload all artifacts
```

### Build Script Details

The `scripts/release.sh` script builds for these platforms:

- `linux/amd64` → `qrimzn-v{version}-linux-amd64.tar.gz`
- `linux/arm64` → `qrimzn-v{version}-linux-arm64.tar.gz`
- `darwin/amd64` → `qrimzn-v{version}-darwin-amd64.tar.gz`
- `darwin/arm64` → `qrimzn-v{version}-darwin-arm64.tar.gz`
- `windows/amd64` → `qrimzn-v{version}-windows-amd64.zip`

## Local Installation & Testing

### Method 1: npm pack (Recommended for Testing)

```bash
# In qrimzn directory
yarn build
npm pack
# Creates: qrimzn-1.1.1.tgz

# Install in another project
cd /path/to/your/project
npm install /path/to/qrimzn/qrimzn-1.1.1.tgz

# For workspaces:
npm install /path/to/qrimzn/qrimzn-1.1.1.tgz -w package-name
```

### Method 2: npm link (For Active Development)

```bash
# In qrimzn directory
yarn build
npm link

# In your test project
npm link qrimzn

# Use in your project
import { createQrCode, resizeImage } from 'qrimzn';

# Unlink when done
npm unlink qrimzn  # in test project
npm unlink         # in qrimzn directory
```

### Method 3: Local File Path

```bash
# Install directly from local path
cd /path/to/your/project
npm install /Users/justin/Desktop/personalProjects/qrimzn

# For workspaces
npm install /Users/justin/Desktop/personalProjects/qrimzn -w package-name
```

### Method 4: Git Repository

```bash
# Install from git (if pushed to GitHub)
npm install git+https://github.com/outranker/qrimzn.git
npm install git+https://github.com/outranker/qrimzn.git#v1.1.1
```

### Testing Installation Without GitHub Release

```bash
# Build local binary first
cd go && CGO_ENABLED=0 go build -o ../bin/qrimzn main.go && cd ..

# Then test the package
node -e "
import('./dist/qrimzn.esm.js').then(async ({ createQrCode }) => {
  const qr = await createQrCode('test', 'LOCAL');
  console.log('Success:', qr.length, 'bytes');
});
"
```

## Publishing

### GitHub Release (Binaries)

```bash
# Prerequisites: gh CLI authenticated
gh auth status

# Create release with binaries
./scripts/release.sh v1.1.1

# Manual release creation
gh release create v1.1.1 \
  --title "v1.1.1" \
  --notes "Release notes here" \
  dist/*.tar.gz \
  dist/*.zip
```

### npm Package

```bash
# Prerequisites: npm login
npm whoami

# Dry run (safe test)
npm publish --dry-run

# Actual publish
npm publish

# Publish beta/alpha
npm publish --tag beta
npm publish --tag alpha
```

### Full Release Workflow

```bash
# 1. Update version
vim package.json  # Update version field

# 2. Build everything
yarn build

# 3. Create GitHub release with binaries
./scripts/release.sh v1.1.1

# 4. Publish to npm
npm publish

# 5. Tag the commit
git tag v1.1.1
git push origin v1.1.1
```

## Troubleshooting

### Common Issues

#### "Binary not found" Error

```bash
# Check if binary exists
ls -la bin/

# Rebuild binary
cd go && CGO_ENABLED=0 go build -o ../bin/qrimzn main.go

# Check permissions (Unix/macOS)
chmod +x bin/qrimzn
```

#### "Image: unknown format" Error

```bash
# Check supported formats in Go code
grep -r "_ \"image" go/main.go

# Test with different format
file your-image.jpg  # Check actual format
./bin/qrimzn --type=resize --width=400 < your-image.jpg > output.png
```

#### ES Module Issues

```bash
# Check package.json type
grep '"type"' package.json

# Ensure using .cjs for CommonJS scripts
ls scripts/*.cjs

# Test module loading
node --input-type=module -e "import('./dist/qrimzn.esm.js').then(console.log)"
```

#### Install Script Fails

```bash
# Test install script manually
node scripts/install.cjs

# Check GitHub release exists
gh release view v1.1.1

# Test URL manually
curl -I https://github.com/outranker/qrimzn/releases/download/v1.1.1/qrimzn-v1.1.1-darwin-arm64.tar.gz
```

### Debug Commands

```bash
# Check binary info
file bin/qrimzn
ldd bin/qrimzn  # Linux dependencies
otool -L bin/qrimzn  # macOS dependencies

# Test binary directly
echo "test" | ./bin/qrimzn --type=resize --width=400 > /dev/null
echo $?  # Should be 0 for success

# Verbose npm install
npm install --verbose /path/to/qrimzn-1.1.1.tgz

# Check package contents
tar -tzf qrimzn-1.1.1.tgz | head -20
```

### Performance Testing

```bash
# Time QR generation
time ./bin/qrimzn --type=qrcode --content="test" --code="PERF" > /dev/null

# Time image resize
time ./bin/qrimzn --type=resize --width=400 < large-image.jpg > /dev/null

# Memory usage (macOS)
time -l ./bin/qrimzn --type=resize --width=400 < image.jpg > /dev/null
```

## Docker Testing

```bash
# Build test container
cat > Dockerfile.test << 'EOF'
FROM node:18-alpine
RUN apk add --no-cache go
WORKDIR /app
COPY . .
RUN cd go && go build -o ../bin/qrimzn main.go
RUN yarn install && yarn build
CMD ["node", "-e", "import('./dist/qrimzn.esm.js').then(({createQrCode}) => createQrCode('test','docker').then(() => console.log('✅ Works in Docker')))"]
EOF

docker build -f Dockerfile.test -t qrimzn-test .
docker run --rm qrimzn-test

# Clean up
rm Dockerfile.test
```

This guide covers all the major development workflows. Keep it updated as the project evolves!
