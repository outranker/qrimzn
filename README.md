# qrimzn

<div align="center">
  
**Pronounced**: "crimson" /ˈkrɪmzən/

**Etymology**: **qr** (QR code) + **im** (image) + **zn** (resize) = **qrimzn** 🎨

</div>

![GitHub release (latest by date)](https://img.shields.io/github/v/release/outranker/qrimzn)
![GitHub](https://img.shields.io/github/license/outranker/qrimzn)
![GitHub issues](https://img.shields.io/github/issues/outranker/qrimzn)
![GitHub pull requests](https://img.shields.io/github/issues-pr/outranker/qrimzn)
![GitHub contributors](https://img.shields.io/github/contributors/outranker/qrimzn)
![GitHub stars](https://img.shields.io/github/stars/outranker/qrimzn)
![GitHub forks](https://img.shields.io/github/forks/outranker/qrimzn)
![GitHub watchers](https://img.shields.io/github/watchers/outranker/qrimzn)
![GitHub last commit](https://img.shields.io/github/last-commit/outranker/qrimzn)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/outranker/qrimzn)

<img src="./assets/logo.png" alt="qrimzn logo" width="140" height="140" align="right">

A fast image processing library that provides QR code generation with custom labels and image resizing capabilities. The library uses a Go binary under the hood for high performance without requiring native dependencies. 🚀
The go library is called by spawning a child process. After the process is spawned, the child process is killed.
Currently, the library supports very limited functionality. Any contributions are welcome.

## Features

- **QR Code Generation**: Create QR codes with custom content and labels
- **Image Resizing**: Resize images with aspect ratio preservation
- **No Native Dependencies**: Unlike Sharp, no additional packages needed for Alpine Linux
- **Cross-platform Support**: Linux, macOS, Windows
- **Multiple Architectures**: amd64, arm64
- **High Performance**: Go binary with optimized image processing
- **Memory Efficient**: Processes images as streams
- **Format Support**: Supports JPEG, PNG input; outputs PNG

## Installation

```bash
npm install qrimzn
```

The installation will automatically download the appropriate binary for your platform.

## Usage

### QR Code Generation

```typescript
import { createQrCode } from "qrimzn";

// Generate a QR code
const buffer = await createQrCode("https://example.com", "ABC12345678");

// Save to file
import fs from "fs";
fs.writeFileSync("qr.png", buffer);

// Or upload to cloud storage, etc.
```

### Image Resizing

```typescript
import { resizeImage } from "qrimzn";
import fs from "fs";

// Read an image file
const imageBuffer = fs.readFileSync("input.jpg");

// Resize to 400px width (height calculated automatically to maintain aspect ratio)
const resized400 = await resizeImage(imageBuffer, 400);
fs.writeFileSync("output-400.png", resized400);

// Multiple sizes
const sizes = [400, 800, 1200];
const resizedImages = await Promise.all(
  sizes.map((width) => resizeImage(imageBuffer, width))
);

// Works with any image format (JPEG, PNG, etc.) - outputs PNG
```

### Replacing Sharp

```typescript
// Before (with Sharp - requires native dependencies)
import sharp from "sharp";
const resized = await sharp(buffer)
  .resize({ width: 400, withoutEnlargement: true, fit: sharp.fit.inside })
  .toBuffer();

// After (with qrimzn - no native dependencies)
import { resizeImage } from "qrimzn";
const resized = await resizeImage(buffer, 400);
```

## API

### `createQrCode(content: string, code: string): Promise<Buffer>`

Generate a QR code with a custom label.

- `content`: The content to encode in the QR code (typically a URL)
- `code`: The label text to display below the QR code
- Returns: A Promise that resolves to a Buffer containing the PNG image data

### `resizeImage(buffer: Uint8Array | Buffer, width: number): Promise<Buffer>`

Resize an image while maintaining aspect ratio.

- `buffer`: Image data as Buffer or Uint8Array (supports JPEG, PNG, and other formats)
- `width`: Target width in pixels (height is calculated automatically)
- Returns: A Promise that resolves to a Buffer containing the resized PNG image data

**Features:**

- Maintains aspect ratio automatically
- Never enlarges images (withoutEnlargement: true behavior)
- Uses high-quality BiLinear interpolation
- Memory efficient streaming processing
- No native dependencies required

## Development

### Building the Go binary

The Go binary is built automatically using GitHub Actions. To build manually:

```bash
cd go
go mod tidy
go build -o qrimzn main.go
```

### Release Process

1. Update version in `package.json`
2. Run the build and release script:
   ```bash
   ./scripts/release.sh v1.0.0
   ```
3. The script will:
   - Build binaries for all supported platforms
   - Create compressed archives
   - Upload to GitHub releases

### Manual Installation Testing

To test the installation script without publishing:

```bash
node scripts/install.js
```

Note: This requires a corresponding GitHub release to exist.

### Manual Testing in Node.js

```bash
yarn build
# this will create a tar.gz file in the root folder
npm pack

# go to nodejs project in install it
npm install /Users/my-user/Desktop/libraries/qrimzn/qrimzn-1.1.0.tgz -w package-name
```

## Platform Support

- **Linux**: amd64, arm64
- **macOS**: amd64, arm64
- **Windows**: amd64

## License

MIT
