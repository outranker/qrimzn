import { spawn } from "child_process";
import { Buffer } from "buffer";
import fs from "fs";
import path from "path";
const binaryPath = path.join(
  __dirname,
  "..",
  "bin",
  process.platform === "win32" ? "qrimzn.exe" : "qrimzn"
);

export function createQrCode(content: string, code: string): Promise<Buffer> {
  if (!content) {
    throw new Error("content is required");
  }
  if (!code) {
    throw new Error("code is required");
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(binaryPath, ["--content", content, "--code", code]);

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

// Example usage (commented out for library use):
// createQrCode("https://example.com", "ABC12345678")
//   .then((buffer) => {
//     fs.writeFileSync("qr.png", buffer);
//   })
//   .catch((err) => {
//     console.error(err);
//   });
