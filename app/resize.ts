import fs from "fs";
import { spawn } from "child_process";
import path from "path";

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

  const binaryPath = path.join(process.cwd(), "qrimzn-binary");
  // Check if binary exists
  if (!fs.existsSync(binaryPath)) {
    throw new Error(
      `qrimzn binary not found at ${binaryPath}. Make sure the package was installed correctly.`
    );
  }

  return new Promise((resolve, reject) => {
    // Set memory-optimized environment variables for the child process
    const env = {
      ...process.env,
      GOGC: "25",
      GOMEMLIMIT: "200MiB",
      GOMAXPROCS: "1",
    };

    const proc = spawn(
      binaryPath,
      ["--type", "resize", "--width", width.toString()],
      { env }
    );

    const chunks: Buffer[] = [];

    proc.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    proc.stderr.on("data", (err: Buffer) => {
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

    proc.on("close", (code: number) => {
      if (code === 0) {
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
