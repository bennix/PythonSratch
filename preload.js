const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lab", {
  runPython: (payload) => ipcRenderer.invoke("run-python", payload),
  listDataFiles: () => ipcRenderer.invoke("list-data-files"),
  readDataFile: (name) => ipcRenderer.invoke("read-data-file", name),
});
