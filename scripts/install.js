// scripts/install.js
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

async function downloadAndExtract() {
  try {
    await new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          if (res.statusCode !== 200) {
            reject(
              new Error(
                `Failed to download: ${res.statusCode} ${res.statusMessage}`
              )
            );
            return;
          }

          if (isWindows) {
            // For Windows, we need to handle ZIP files
            // Since Node.js doesn't have built-in ZIP support, we'll use a simpler approach
            // or require the user to have unzip available
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
                        reject(
                          new Error(`Failed to extract ZIP: ${psError.message}`)
                        );
                        return;
                      }

                      // Clean up
                      fs.unlinkSync(tempZip);
                      console.log(`Binary extracted to ${destPath}`);
                      resolve();
                    }
                  );
                  return;
                }

                // Clean up
                fs.unlinkSync(tempZip);
                console.log(`Binary extracted to ${destPath}`);
                resolve();
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
                reject(err);
                return;
              }

              // Make binary executable
              if (existsSync(destPath)) {
                chmodSync(destPath, 0o755);
                console.log(
                  `Binary extracted and made executable: ${destPath}`
                );
              }
              resolve();
            });
          }
        })
        .on("error", reject);
    });
  } catch (error) {
    console.error(`Error downloading binary: ${error.message}`);
    process.exit(1);
  }
}

downloadAndExtract();
