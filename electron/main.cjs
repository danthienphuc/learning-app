const { app, BrowserWindow, ipcMain, shell, protocol, net, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const scanner = require('./scanner.cjs');

// Simple settings storage
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading settings:', e);
    }
    return { scanFolders: [] };
}

function saveSettings(settings) {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch (e) {
        console.error('Error saving settings:', e);
    }
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false
        },
        autoHideMenuBar: true,
    });

    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

protocol.registerSchemesAsPrivileged([
    { scheme: 'local-file', privileges: { bypassCSP: true, stream: true, supportFetchAPI: true, standard: true, secure: true } }
]);

app.whenReady().then(() => {
    protocol.handle('local-file', (request) => {
        const filePath = decodeURIComponent(request.url.replace('local-file://', ''));
        return net.fetch('file://' + filePath);
    });

    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers

// Scan folders and return flat list
ipcMain.handle('scan-folders', async (event, rootPaths) => {
    let allSets = [];
    const pathsToScan = rootPaths || loadSettings().scanFolders;
    for (const root of pathsToScan) {
        if (fs.existsSync(root)) {
            console.log(`Scanning ${root}...`);
            const results = scanner.scanDir(root);
            allSets = allSets.concat(results);
        }
    }
    return allSets;
});

// Scan folders and return tree structure
ipcMain.handle('scan-folders-tree', async (event, rootPaths) => {
    const pathsToScan = rootPaths || loadSettings().scanFolders;
    const trees = [];

    for (const root of pathsToScan) {
        if (fs.existsSync(root)) {
            console.log(`Scanning tree ${root}...`);
            const tree = scanner.scanDirTree(root);
            if (tree) {
                trees.push(tree);
            }
        }
    }
    return trees;
});

// Get files grouped by folder for a specific set
ipcMain.handle('get-set-details-grouped', async (event, setPath) => {
    return scanner.getFilesGrouped(setPath);
});

ipcMain.handle('get-set-details', async (event, setPath) => {
    const docs = scanner.getDocFiles(setPath);
    const audio = scanner.getAudioFiles(setPath);
    return { docs, audio };
});

ipcMain.handle('open-file-external', async (event, filePath) => {
    await shell.openPath(filePath);
    return true;
});

ipcMain.handle('get-file-url', async (event, filePath) => {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const encodedPath = normalizedPath.split('/').map(part => encodeURIComponent(part)).join('/');
    return `file:///${encodedPath}`;
});

ipcMain.handle('get-audio-data', async (event, filePath) => {
    try {
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        let mimeType = 'audio/mpeg';
        if (ext === '.wav') mimeType = 'audio/wav';
        if (ext === '.m4a') mimeType = 'audio/mp4';
        if (ext === '.wma') mimeType = 'audio/x-ms-wma';
        return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (error) {
        console.error('Error reading audio file:', error);
        return null;
    }
});

ipcMain.handle('get-settings', async () => {
    return loadSettings();
});

ipcMain.handle('save-settings', async (event, settings) => {
    saveSettings(settings);
    return true;
});

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select folder to scan'
    });
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

ipcMain.handle('get-thumbnail', async (event, setPath) => {
    try {
        const files = fs.readdirSync(setPath);
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

        // Look for cover images first
        const coverNames = ['cover', 'thumbnail', 'thumb', 'poster', 'image'];
        for (const name of coverNames) {
            for (const ext of imageExts) {
                for (const file of files) {
                    if (file.toLowerCase() === name + ext || file.toLowerCase().startsWith(name)) {
                        const filePath = path.join(setPath, file);
                        const fileExt = path.extname(file).toLowerCase();
                        if (imageExts.includes(fileExt)) {
                            const buffer = fs.readFileSync(filePath);
                            const mimeType = fileExt === '.png' ? 'image/png' : 'image/jpeg';
                            return `data:${mimeType};base64,${buffer.toString('base64')}`;
                        }
                    }
                }
            }
        }

        // Fall back to first image
        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (imageExts.includes(ext)) {
                const imagePath = path.join(setPath, file);
                const buffer = fs.readFileSync(imagePath);
                const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
                return `data:${mimeType};base64,${buffer.toString('base64')}`;
            }
        }
    } catch (e) {
        console.error('Error getting thumbnail:', e);
    }
    return null;
});
