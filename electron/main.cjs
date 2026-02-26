const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const crypto = require('crypto');
const scanner = require('./scanner.cjs');

// Cấu hình thư mục Cache
const USER_DATA = app.getPath('userData');
const AUDIO_CACHE = path.join(USER_DATA, 'AudioCache');
const SETTINGS_PATH = path.join(USER_DATA, 'settings.json');

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(AUDIO_CACHE)) {
    fs.mkdirSync(AUDIO_CACHE, { recursive: true });
}

function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_PATH)) return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    } catch (e) {}
    return { scanFolders: [] };
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 850,
        title: "Learning Library Pro",
        icon: path.join(__dirname, '../public/logo/config_language_22470.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false // Bắt buộc false để cho phép React (localhost) truy cập trực tiếp file:/// của hệ thống
        },
        autoHideMenuBar: true,
    });

    if (!app.isPackaged) mainWindow.loadURL('http://localhost:5173');
    else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ==========================================
// IPC HANDLERS
// ==========================================

ipcMain.handle('scan-folders-tree', async (event, rootPaths) => {
    const paths = rootPaths || loadSettings().scanFolders;
    return paths.filter(p => fs.existsSync(p)).map(p => scanner.scanDirTree(p));
});

ipcMain.handle('get-thumbnail', async (event, folderPath) => {
    try {
        const files = fs.readdirSync(folderPath);
        // Ưu tiên tìm file ảnh có sẵn (cover.jpg, thumb.png...)
        const imgExts = ['.jpg', '.jpeg', '.png', '.webp'];
        const coverKeywords = ['cover', 'thumb', 'poster', 'main'];
        
        for (const file of files) {
            const lower = file.toLowerCase();
            if (imgExts.some(ext => lower.endsWith(ext)) && coverKeywords.some(key => lower.includes(key))) {
                const buffer = fs.readFileSync(path.join(folderPath, file));
                const mime = lower.endsWith('.png') ? 'image/png' : 'image/jpeg';
                return `data:${mime};base64,${buffer.toString('base64')}`;
            }
        }
    } catch (e) {}
    return null; // Trả về null để React tự tạo background gradient đẹp mắt
});

// HÀM QUAN TRỌNG: Format URL chuẩn xác, không bị lỗi mất ổ đĩa (C:, F:) trên Windows
function formatSafeFileUrl(absolutePath) {
    // url.pathToFileURL sẽ biến "F:\English\file.pdf" thành "file:///F:/English/file.pdf"
    // Định dạng này được trình duyệt Chromium hỗ trợ đọc nguyên bản, không bao giờ bị lỗi parsing.
    return url.pathToFileURL(absolutePath).href;
}

ipcMain.handle('get-audio-data', async (event, filePath) => {
    try {
        const ext = path.extname(filePath).toLowerCase();
        
        // Xử lý riêng cho .wma bằng FFmpeg (Convert sang MP3 và lưu Cache)
        if (ext === '.wma') {
            const hash = crypto.createHash('md5').update(filePath).digest('hex');
            const cachePath = path.join(AUDIO_CACHE, `${hash}.mp3`);

            if (!fs.existsSync(cachePath)) {
                const ffmpeg = require('fluent-ffmpeg');
                const ffmpegPath = require('ffmpeg-static');
                ffmpeg.setFfmpegPath(ffmpegPath);

                await new Promise((resolve, reject) => {
                    ffmpeg(filePath)
                        .toFormat('mp3')
                        .on('end', resolve)
                        .on('error', reject)
                        .save(cachePath);
                });
            }
            return formatSafeFileUrl(cachePath);
        }

        // Các định dạng .mp3, .wav... được Chromium hỗ trợ mặc định
        return formatSafeFileUrl(filePath);
    } catch (error) {
        console.error("Audio error:", error);
        return null;
    }
});

// Cung cấp URL đọc PDF
ipcMain.handle('get-file-url', (event, filePath) => {
    return formatSafeFileUrl(filePath);
});

ipcMain.handle('get-settings', () => loadSettings());
ipcMain.handle('save-settings', (e, s) => fs.writeFileSync(SETTINGS_PATH, JSON.stringify(s)));
ipcMain.handle('open-file-external', (e, p) => shell.openPath(p));
ipcMain.handle('select-folder', async () => {
    const r = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('get-set-details-grouped', (e, p) => scanner.getFilesGrouped(p));