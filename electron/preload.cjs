const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  loginStore: (storefrontId) => ipcRenderer.invoke('auth:storefront', storefrontId),
  scanLocalGames: () => ipcRenderer.invoke('scan:steam-installed'),
});
