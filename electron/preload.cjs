const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    scanFolders: (paths) => ipcRenderer.invoke('scan-folders', paths),
    scanFoldersTree: (paths) => ipcRenderer.invoke('scan-folders-tree', paths),
    getSetDetails: (path) => ipcRenderer.invoke('get-set-details', path),
    getSetDetailsGrouped: (path) => ipcRenderer.invoke('get-set-details-grouped', path),
    openFileExternal: (path) => ipcRenderer.invoke('open-file-external', path),
    getFileUrl: (path) => ipcRenderer.invoke('get-file-url', path),
    getAudioData: (path) => ipcRenderer.invoke('get-audio-data', path),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    getThumbnail: (path) => ipcRenderer.invoke('get-thumbnail', path)
});

console.log('Preload script loaded');
