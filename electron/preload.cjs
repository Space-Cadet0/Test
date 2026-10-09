const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  loginStore: (storefrontId) => ipcRenderer.invoke('auth:storefront', storefrontId),
  syncStore: (storefrontId) => ipcRenderer.invoke('store:sync', storefrontId),
  exchangeCode: (storefrontId, code) => ipcRenderer.invoke('store:exchange-code', { storefrontId, code }),
  scanLocalGames: () => ipcRenderer.invoke('scan:steam-installed'),
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  searchHltb: (title) => ipcRenderer.invoke('hltb:search', title),
});
