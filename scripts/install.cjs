// scripts/install.cjs
const os = require("os");
const path = require("path");
const fs = require("fs");
const https = require("https");
const { chmodSync, mkdirSync, existsSync, createWriteStream } = require("fs");
const { pipeline } = require("stream");
const { promisify } = require("util");
const zlib = require("zlib");
const tar = require("tar");

const streamPipeline = promisify(pipeline);

const platform = os.platform(); // 'darwin', 'linux', 'win32'
const arch = os.arch(); // 'x64', 'arm64', etc.

// Map Node.js arch to Go arch
const goArch = arch === "x64" ? "amd64" : arch;
// Map Node.js platform to Go platform
const goPlatform = platform === "win32" ? "windows" : platform;

const binaryName = platform === "win32" ? "qrimzn.exe" : "qrimzn";
const version = require("../package.json").version;
const repo = "outranker/qrimzn";

// Determine archive format and name
const isWindows = platform === "win32";
const archiveExt = isWindows ? "zip" : "tar.gz";
const archiveName = `qrimzn-v${version}-${goPlatform}-${goArch}.${archiveExt}`;
const url = `https://github.com/${repo}/releases/download/v${version}/${archiveName}`;

const binDir = path.join(__dirname, "..", "bin");
const destPath = path.join(binDir, binaryName);

if (!existsSync(binDir)) {
  mkdirSync(binDir, { recursive: true });
}

console.log(`Downloading binary from ${url}...`);

function downloadWithRedirects(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    function makeRequest(currentUrl, redirectCount = 0) {
      if (redirectCount > maxRedirects) {
        reject(new Error(`Too many redirects (${redirectCount})`));
        return;
      }

      https
        .get(currentUrl, (res) => {
          // Handle redirects
          if (
            res.statusCode === 301 ||
            res.statusCode === 302 ||
            res.statusCode === 307 ||
            res.statusCode === 308
          ) {
            const redirectUrl = res.headers.location;
            if (!redirectUrl) {
              reject(new Error(`Redirect response without location header`));
              return;
            }

            console.log(`Following redirect to: ${redirectUrl}`);
            makeRequest(redirectUrl, redirectCount + 1);
            return;
          }

          // Handle successful response
          if (res.statusCode === 200) {
            resolve(res);
            return;
          }

          // Handle other error statuses
          reject(
            new Error(
              `Failed to download: ${res.statusCode} ${res.statusMessage}`
            )
          );
        })
        .on("error", reject);
    }

    makeRequest(url);
  });
}

async function downloadAndExtract() {
  try {
    const res = await downloadWithRedirects(url);

    if (isWindows) {
      // For Windows, we need to handle ZIP files
      const tempZip = path.join(binDir, archiveName);
      const file = createWriteStream(tempZip);

      res.pipe(file);

      file.on("finish", () => {
        file.close();

        // Try to extract using built-in methods or external tools
        const { exec } = require("child_process");
        exec(`cd "${binDir}" && unzip -o "${archiveName}"`, (error) => {
          if (error) {
            // Fallback: try PowerShell on Windows
            exec(
              `powershell -command "Expand-Archive -Path '${tempZip}' -DestinationPath '${binDir}' -Force"`,
              (psError) => {
                if (psError) {
                  console.error(`Failed to extract ZIP: ${psError.message}`);
                  process.exit(1);
                }

                // Clean up
                fs.unlinkSync(tempZip);
                console.log(`Binary extracted to ${destPath}`);
              }
            );
            return;
          }

          // Clean up
          fs.unlinkSync(tempZip);
          console.log(`Binary extracted to ${destPath}`);
        });
      });
    } else {
      // For Unix systems, extract tar.gz directly
      const extractStream = tar.extract({
        cwd: binDir,
        strip: 0,
      });

      pipeline(res, zlib.createGunzip(), extractStream, (err) => {
        if (err) {
          console.error(`Failed to extract tar.gz: ${err.message}`);
          process.exit(1);
        }

        // Make binary executable
        if (existsSync(destPath)) {
          chmodSync(destPath, 0o755);
          console.log(`Binary extracted and made executable: ${destPath}`);
        } else {
          console.error(`Binary not found at expected path: ${destPath}`);
          process.exit(1);
        }
      });
    }
  } catch (error) {
    console.error(`Error downloading binary: ${error.message}`);
    process.exit(1);
  }
}

downloadAndExtract();
