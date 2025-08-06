# qrimzn

A simple QR code generator library that creates QR codes with custom labels. The library uses a Go binary under the hood for fast QR code generation.

## Features

- Generate QR codes with custom content
- Add custom labels below QR codes
- Cross-platform support (Linux, macOS, Windows)
- Multiple architectures (amd64, arm64)
- Returns PNG images as Buffer for flexible usage

## Installation

```bash
npm install qrimzn
```

The installation will automatically download the appropriate binary for your platform.

## Usage

```typescript
import { createQrCode } from "qrimzn";

// Generate a QR code
const buffer = await createQrCode("https://example.com", "ABC12345678");

// Save to file
import fs from "fs";
fs.writeFileSync("qr.png", buffer);

// Or upload to cloud storage, etc.
```

## API

### `createQrCode(content: string, code: string): Promise<Buffer>`

- `content`: The content to encode in the QR code (typically a URL)
- `code`: The label text to display below the QR code
- Returns: A Promise that resolves to a Buffer containing the PNG image data

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

## Platform Support

- **Linux**: amd64, arm64
- **macOS**: amd64, arm64
- **Windows**: amd64

## License

MIT
