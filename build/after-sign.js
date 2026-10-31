const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

exports.default = async function (context) {
  if (context.electronPlatformName !== "darwin") return;
  const appName = context.packager.appInfo.productFilename;
  const root = path.join(context.appOutDir, `${appName}.app`, "Contents", "Resources", ".venv");
  if (!fs.existsSync(root)) return;
  const files = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.lstatSync(full);
      if (stat.isSymbolicLink()) continue;
      if (stat.isDirectory()) walk(full);
      else if (name.endsWith(".so") || name.endsWith(".dylib") || name.startsWith("python")) files.push(full);
    }
  }
  walk(root);
  const entitlements = path.join(context.packager.projectDir, "build", "entitlements.mac.plist");
  for (const file of files) {
    execFileSync("codesign", [
      "--sign", "Developer ID Application: ZHIPING XU (5N66S29EK2)",
      "--force", "--timestamp", "--options", "runtime",
      "--entitlements", entitlements, file,
    ], { stdio: "inherit" });
  }
};
