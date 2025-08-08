# QRIMZN - Image Processing Library

A simple image processing and modifying library with limited functionality, featuring a Go binary backend for high-performance image operations.

## Features

- **QR Code Generation**: Generate QR codes with custom labels
- **Image Resizing**: Resize images to specified widths while maintaining aspect ratio
- **Multiple Formats**: Support for JPEG, PNG, GIF, BMP, TIFF, WebP
- **High Performance**: Go binary backend for fast image processing
- **Cross-Platform**: Works on Linux, macOS, and Windows
- **Raspberry Pi Compatible**: ARM64 support for Raspberry Pi 4

## Installation

```bash
npm install qrimzn
```

## Usage

### QR Code Generation

```javascript
import { createQrCode } from "qrimzn";

const qrBuffer = await createQrCode("https://example.com", "ABC12345678");

// Save to file
fs.writeFileSync("qr.png", qrBuffer);
```

### Image Resizing

```javascript
import { resizeImage } from "qrimzn";
import fs from "fs";

// Read image file
const imageBuffer = fs.readFileSync("input.jpg");

// Resize to 800px width
const resizedBuffer = await resizeImage(imageBuffer, 800);

// Save resized image
fs.writeFileSync("resized.png", resizedBuffer);
```

## API Reference

### `createQrCode(content: string, code: string): Promise<Buffer>`

Generates a QR code with a label.

- **content**: The URL or text to encode in the QR code
- **code**: The label text to display below the QR code
- **Returns**: A Promise that resolves to a Buffer containing the PNG image data

### `resizeImage(buffer: Uint8Array | Buffer, width: number): Promise<Buffer>`

Resizes an image to the specified width.

- **buffer**: Image data as Buffer or Uint8Array
- **width**: Target width in pixels (height calculated automatically)
- **Returns**: A Promise that resolves to a Buffer containing the resized PNG image data

## Test Application

A complete NestJS test application is included in the `app/` directory that demonstrates the library usage.

### Running the Test App

1. **Place your test image:**

   ```bash
   mkdir -p ~/Desktop/images
   # Copy your bergenhordalandnorwayvagen.jpg to ~/Desktop/images/
   ```

2. **Build the Go binary for Raspberry Pi:**

   ```bash
   cd go
   GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -o ../bin/qrimzn main.go
   ```

3. **Build and run the Docker application:**

   ```bash
   cd app
   ./build-docker.sh
   docker run -p 3000:3000 -v $(pwd)/output:/app/output qrimzn-test-app
   ```

4. **Test the application:**
   ```bash
   curl http://localhost:3000/test
   ```

The test application will:

- Copy the test image from `~/Desktop/images/bergenhordalandnorwayvagen.jpg` during Docker build
- Create three versions: 400px, 800px, and 1200px width
- Save the results to `./output/` directory

### Docker Support

The application is containerized and ready to run on Raspberry Pi 4:

```bash
# Build the image
cd app
./build-docker.sh

# Run on Raspberry Pi
docker run -p 3000:3000 \
  -v $(pwd)/output:/app/output \
  qrimzn-test-app
```

## Development

### Building the Go Binary

```bash
cd go
go mod tidy

# Build for current platform
CGO_ENABLED=0 go build -o ../bin/qrimzn main.go

# Build for Raspberry Pi (ARM64)
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -o ../bin/qrimzn main.go
```

### Building the TypeScript Package

```bash
npm run build
```

## Platform Support

- **Linux**: amd64, arm64
- **macOS**: amd64, arm64
- **Windows**: amd64
- **Raspberry Pi**: arm64

## License

MIT
