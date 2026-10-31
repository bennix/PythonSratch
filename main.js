const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

function rootDir() {
  return app.isPackaged ? process.resourcesPath : __dirname;
}
function pythonPath() {
  const root = rootDir();
  if (process.platform === "win32") return path.join(root, ".venv", "Scripts", "python.exe");
  return path.join(root, ".venv", "bin", "python3");
}
function plotFile() {
  return path.join(app.getPath("temp"), "python-scratch-plot.png");
}

function appIcon() {
  if (process.platform === "win32") return path.join(__dirname, "build", "icon.ico");
  if (process.platform === "linux") return path.join(__dirname, "build", "icons", "512x512.png");
  return path.join(__dirname, "build", "icon.png");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "Python 积木学习台",
    backgroundColor: "#0f1419",
    icon: appIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

ipcMain.handle("list-data-files", async () => {
  const dir = path.join(rootDir(), "data");
  const names = fs.readdirSync(dir).filter((name) => /^[A-Za-z0-9_.-]+\.(txt|log|csv)$/.test(name));
  names.sort();
  return names;
});

ipcMain.handle("read-data-file", async (_event, name) => {
  if (typeof name !== "string" || !/^[A-Za-z0-9_.-]+\.(txt|log|csv)$/.test(name)) {
    return { ok: false, text: "" };
  }
  const file = path.join(rootDir(), "data", name);
  const text = fs.readFileSync(file, "utf8");
  return { ok: true, text: text.slice(0, 20000) };
});

ipcMain.handle("run-python", async (_event, { code, stdin }) => {
  return new Promise((resolve) => {
    const plotPath = plotFile();
    try { fs.unlinkSync(plotPath); } catch (_) {}
    const child = spawn(pythonPath(), ["-c", code], {
      cwd: rootDir(),
      env: { ...process.env, PYTHONIOENCODING: "utf-8", MPLBACKEND: "Agg" },
    });
    let stdout = "";
    let stderr = "";
    const killer = setTimeout(() => {
      child.kill("SIGKILL");
    }, 20000);
    child.stdout.on("data", (d) => {
      stdout += d.toString();
      if (stdout.length > 20000) child.kill("SIGKILL");
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", (err) => {
      clearTimeout(killer);
      resolve({ ok: false, stdout, stderr: "找不到内置 Python。请在项目目录运行 python3 -m venv .venv && .venv/bin/pip install pandas matplotlib\n" + err, code: -1 });
    });
    child.on("close", (code) => {
      clearTimeout(killer);
      let image = "";
      if (fs.existsSync(plotPath)) {
        image = fs.readFileSync(plotPath).toString("base64");
        fs.unlinkSync(plotPath);
      }
      resolve({ ok: code === 0, stdout, stderr, code, image });
    });
    if (stdin) child.stdin.write(stdin.endsWith("\n") ? stdin : stdin + "\n");
    child.stdin.end();
  });
});

app.whenReady().then(() => {
  if (process.platform === "darwin" && app.dock) {
    app.dock.setIcon(path.join(__dirname, "build", "icon.png"));
  }
  createWindow();
});
app.on("window-all-closed", () => app.quit());
