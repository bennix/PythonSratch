const { app, BrowserWindow, ipcMain, safeStorage } = require("electron");
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
  const candidate = process.platform === "win32"
    ? path.join(__dirname, "build", "icon.ico")
    : process.platform === "linux"
      ? path.join(__dirname, "build", "icons", "512x512.png")
      : path.join(__dirname, "build", "icon.png");
  return fs.existsSync(candidate) ? candidate : undefined;
}

function createWindow() {
  const icon = appIcon();
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "Python 积木学习台",
    backgroundColor: "#0f1419",
    show: true,
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  win.once("ready-to-show", () => {
    win.show();
    win.focus();
  });
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

const DEFAULT_MODELS = [
  "anthropic/claude-haiku-5.5",
  "openai/gpt-6.1-sol",
  "anthropic/claude-sonnet-5.5",
];

function aiSettingsPath() {
  return path.join(app.getPath("userData"), "ai-settings.json");
}

function readAiSettings() {
  const defaults = {
    baseUrl: "https://zenmux.ai/api/v1",
    model: DEFAULT_MODELS[0],
    models: DEFAULT_MODELS.slice(),
    keyEnc: "",
  };
  try {
    const saved = JSON.parse(fs.readFileSync(aiSettingsPath(), "utf8"));
    const models = Array.isArray(saved.models) && saved.models.length ? saved.models : defaults.models;
    return {
      baseUrl: saved.baseUrl || defaults.baseUrl,
      model: saved.model || models[0],
      models,
      keyEnc: saved.keyEnc || "",
    };
  } catch (_) {
    return defaults;
  }
}

function writeAiSettings(data) {
  fs.mkdirSync(path.dirname(aiSettingsPath()), { recursive: true });
  fs.writeFileSync(aiSettingsPath(), JSON.stringify(data));
}

function decryptKey(keyEnc) {
  if (!keyEnc) return "";
  try {
    const buf = Buffer.from(keyEnc, "base64");
    if (safeStorage.isEncryptionAvailable()) return safeStorage.decryptString(buf);
  } catch (_) {}
  return "";
}

function encryptKey(plain) {
  if (!plain) return "";
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("这台电脑暂时不能加密保存密钥");
  }
  return safeStorage.encryptString(plain).toString("base64");
}

function publicSettings(data) {
  return {
    baseUrl: data.baseUrl,
    model: data.model,
    models: data.models,
    hasKey: Boolean(decryptKey(data.keyEnc)),
  };
}

ipcMain.handle("ai-settings-get", () => publicSettings(readAiSettings()));

ipcMain.handle("ai-settings-save", (_event, payload) => {
  const current = readAiSettings();
  const models = Array.isArray(payload.models)
    ? payload.models.map((m) => String(m).trim()).filter(Boolean)
    : current.models;
  const next = {
    baseUrl: (payload.baseUrl || current.baseUrl).trim().replace(/\/$/, ""),
    model: payload.model || current.model,
    models: models.length ? models : current.models,
    keyEnc: current.keyEnc,
  };
  if (!next.models.includes(next.model)) next.model = next.models[0];
  if (typeof payload.apiKey === "string" && payload.apiKey.trim()) {
    next.keyEnc = encryptKey(payload.apiKey.trim());
  }
  writeAiSettings(next);
  return publicSettings(next);
});

let aiAbort = null;

ipcMain.on("ai-stop", () => {
  if (aiAbort) aiAbort.abort();
});

ipcMain.on("ai-chat", async (event, payload) => {
  const settings = readAiSettings();
  const key = decryptKey(settings.keyEnc);
  if (!key) {
    event.sender.send("ai-error", "还没有 API Key。请打开设置，或使用邀请链接领取。");
    return;
  }
  if (aiAbort) aiAbort.abort();
  aiAbort = new AbortController();
  const model = payload.model || settings.model;
  const url = settings.baseUrl.replace(/\/$/, "") + "/chat/completions";
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: aiAbort.signal,
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: payload.messages || [],
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      event.sender.send("ai-error", "请求失败 " + res.status + " " + detail.slice(0, 400));
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const delta = json.choices && json.choices[0] && json.choices[0].delta;
          const text = delta && delta.content;
          if (text) event.sender.send("ai-token", text);
        } catch (_) {}
      }
    }
    event.sender.send("ai-done");
  } catch (err) {
    if (err.name === "AbortError") event.sender.send("ai-done");
    else event.sender.send("ai-error", err.message || String(err));
  }
});

app.whenReady().then(() => {
  if (!app.isPackaged && process.platform === "darwin" && app.dock) {
    const iconPath = path.join(__dirname, "build", "icon.png");
    if (fs.existsSync(iconPath)) app.dock.setIcon(iconPath);
  }
  createWindow();
});
app.on("window-all-closed", () => app.quit());
