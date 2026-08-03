const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('macNativeAPI', {
  isElectron: true,
  onNativeClip: (callback) => {
    ipcRenderer.on('native-clipboard-item', (event, data) => callback(data));
  },
  onTriggerQuickPaste: (callback) => {
    ipcRenderer.on('trigger-quick-paste', () => callback());
  },
});
