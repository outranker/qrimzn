import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

async function generateQR() {
  await exec("./qrcode-gen", [
    "--content",
    "https://ev-nonmember.aceloev.com/pay.html?id=ABC12345678&mode=local",
    "--code",
    "ABC12345678",
  ]);
}

generateQR();
