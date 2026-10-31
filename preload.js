const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lab", {
  runPython: (payload) => ipcRenderer.invoke("run-python", payload),
  listDataFiles: () => ipcRenderer.invoke("list-data-files"),
  readDataFile: (name) => ipcRenderer.invoke("read-data-file", name),
  getAiSettings: () => ipcRenderer.invoke("ai-settings-get"),
  saveAiSettings: (payload) => ipcRenderer.invoke("ai-settings-save", payload),
  startAiChat: (payload) => ipcRenderer.send("ai-chat", payload),
  stopAiChat: () => ipcRenderer.send("ai-stop"),
  onAiToken: (cb) => {
    ipcRenderer.removeAllListeners("ai-token");
    ipcRenderer.on("ai-token", (_e, text) => cb(text));
  },
  onAiDone: (cb) => {
    ipcRenderer.removeAllListeners("ai-done");
    ipcRenderer.on("ai-done", () => cb());
  },
  onAiError: (cb) => {
    ipcRenderer.removeAllListeners("ai-error");
    ipcRenderer.on("ai-error", (_e, message) => cb(message));
  },
});
