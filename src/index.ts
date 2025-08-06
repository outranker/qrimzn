import { spawn } from "child_process";
import { Buffer } from "buffer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const binaryPath = path.join(
  __dirname,
  "..",
  "bin",
  process.platform === "win32" ? "qrimzn.exe" : "qrimzn"
);

/**
 * Generate a QR code with a label
 * @param content - The content to encode in the QR code
 * @param code - The label to add to the QR code
 * @returns A Promise that resolves to a Buffer containing the QR code image data
 */
export function createQrCode(content: string, code: string): Promise<Buffer> {
  if (!content) {
    throw new Error("content is required");
  }
  if (!code) {
    throw new Error("code is required");
  }

  // Check if binary exists
  if (!fs.existsSync(binaryPath)) {
    throw new Error(
      `qrimzn binary not found at ${binaryPath}. Make sure the package was installed correctly.`
    );
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(binaryPath, [
      "--type",
      "qrcode",
      "--content",
      content,
      "--code",
      code,
    ]);

    const chunks: Buffer[] = [];

    proc.stdout.on("data", (chunk) => chunks.push(chunk));
    proc.stderr.on("data", (err) => console.error("stderr:", err.toString()));
    proc.on("error", reject);

    proc.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new Error(`qrimzn exited with code ${code}`));
    });
  });
}

/**
 * Resize an image using the qrimzn Go binary
 * @param buffer - Image buffer to resize
 * @param width - Target width (height will be calculated to maintain aspect ratio)
 * @returns Promise<Buffer> - Resized image as PNG buffer
 */
export function resizeImage(
  buffer: Uint8Array | Buffer,
  width: number
): Promise<Buffer> {
  if (!buffer || buffer.length === 0) {
    throw new Error("buffer is required and cannot be empty");
  }
  if (!width || width <= 0) {
    throw new Error("width must be a positive number");
  }

  // Check if binary exists
  if (!fs.existsSync(binaryPath)) {
    throw new Error(
      `qrimzn binary not found at ${binaryPath}. Make sure the package was installed correctly.`
    );
  }

  return new Promise((resolve, reject) => {
    const start = Date.now();
    const proc = spawn(binaryPath, [
      "--type",
      "resize",
      "--width",
      width.toString(),
    ]);

    const chunks: Buffer[] = [];

    proc.stdout.on("data", (chunk) => chunks.push(chunk));
    proc.stderr.on("data", (err) => {
      // Go binary logs timing info and format info to stderr, which is expected
      const errStr = err.toString();
      if (
        !errStr.includes("resizeImg") &&
        !errStr.includes("Decoded image format") &&
        !errStr.includes("Reading image data from stdin")
      ) {
        console.error("stderr:", errStr);
      }
    });
    proc.on("error", reject);

    proc.on("close", (code) => {
      if (code === 0) {
        const end = Date.now();
        console.log(`resizeImg ${width} took ${end - start} ms`);
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`qrimzn resize exited with code ${code}`));
      }
    });

    // Send the image data to stdin
    proc.stdin.write(buffer);
    proc.stdin.end();
  });
}

// Example usage (commented out for library use):
// createQrCode("https://example.com", "ABC12345678")
//   .then((buffer) => {
//     fs.writeFileSync("qr.png", buffer);
//   })
//   .catch((err) => {
//     console.error(err);
//   });
