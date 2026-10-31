const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

exports.default = async function (context) {
  if (context.electronPlatformName !== "darwin") return;
  const appName = context.packager.appInfo.productFilename;
  const venv = path.join(context.appOutDir, `${appName}.app`, "Contents", "Resources", ".venv");
  const bin = path.join(venv, "bin");
  const libDir = path.join(venv, "lib");
  const link = path.join(bin, "python3");
  if (!fs.existsSync(link) || !fs.lstatSync(link).isSymbolicLink()) return;
  const target = fs.realpathSync(link);
  const listed = execFileSync("otool", ["-L", target], { encoding: "utf8" });
  const dep = listed.split("\n").map((line) => line.trim()).find((line) => line.includes("Python.framework") || line.includes("libpython"));
  const old = dep ? dep.split(" ")[0] : "";
  for (const name of fs.readdirSync(bin)) {
    const file = path.join(bin, name);
    if (fs.lstatSync(file).isSymbolicLink() && fs.realpathSync(file) === target) {
      fs.rmSync(file);
      fs.copyFileSync(target, file);
      fs.chmodSync(file, 0o755);
    }
  }
  if (!old || !fs.existsSync(old)) return;
  const dest = path.join(libDir, "libpython3.10.dylib");
  fs.copyFileSync(old, dest);
  execFileSync("install_name_tool", ["-id", "@executable_path/../lib/libpython3.10.dylib", dest]);
  for (const name of ["python", "python3", "python3.10"]) {
    const file = path.join(bin, name);
    if (fs.existsSync(file)) {
      execFileSync("install_name_tool", ["-change", old, "@executable_path/../lib/libpython3.10.dylib", file]);
    }
  }
};
