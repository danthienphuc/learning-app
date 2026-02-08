const fs = require('fs');
const path = require('path');

const AUDIO_EXTS = ['.mp3', '.wav', '.m4a', '.wma', '.ogg', '.flac'];
const DOC_EXTS = ['.pdf', '.docx', '.doc'];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

// Scan and return flat list of sets (for backward compatibility)
function scanDir(dir, depth = 0) {
    if (depth > 5) return [];

    let results = [];
    let files;

    try {
        if (!fs.existsSync(dir)) return [];
        files = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
        console.error(`Error scanning directory ${dir}:`, err);
        return [];
    }

    let docCount = 0;
    let audioCount = 0;
    let size = 0;
    let firstPdf = null;
    let description = '';
    let birthtime = new Date();
    let mtime = new Date(0);

    try {
        const dirStats = fs.statSync(dir);
        birthtime = dirStats.birthtime;
        mtime = dirStats.mtime;
    } catch (e) { }

    for (const file of files) {
        if (file.isDirectory()) {
            const subResults = scanDir(path.join(dir, file.name), depth + 1);
            results = results.concat(subResults);
        } else {
            const ext = path.extname(file.name).toLowerCase();
            if (DOC_EXTS.includes(ext)) {
                docCount++;
                if (!firstPdf && ext === '.pdf') {
                    firstPdf = path.join(dir, file.name);
                }
            }
            if (AUDIO_EXTS.includes(ext)) audioCount++;

            if (file.name.toLowerCase().startsWith('readme') || file.name.toLowerCase().startsWith('intro')) {
                try {
                    description = fs.readFileSync(path.join(dir, file.name), 'utf8').substring(0, 200);
                } catch (e) { }
            }

            try {
                const stats = fs.statSync(path.join(dir, file.name));
                size += stats.size;
                if (stats.mtime > mtime) mtime = stats.mtime;
            } catch (e) { }
        }
    }

    if (docCount > 0) {
        results.push({
            id: Buffer.from(dir).toString('base64'),
            path: dir,
            name: path.basename(dir),
            docs: docCount,
            audio: audioCount,
            type: audioCount > 0 ? 'Doc + Audio' : 'Doc Only',
            size: size,
            thumbnail: firstPdf,
            description: description.trim(),
            createdAt: birthtime,
            updatedAt: mtime
        });
    }

    return results;
}

// Scan and return tree structure
function scanDirTree(dir, depth = 0, relativePath = '') {
    if (depth > 10) return null;

    let files;
    try {
        if (!fs.existsSync(dir)) return null;
        files = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
        console.error(`Error scanning directory ${dir}:`, err);
        return null;
    }

    const node = {
        id: Buffer.from(dir).toString('base64'),
        name: path.basename(dir),
        path: dir,
        relativePath: relativePath || path.basename(dir),
        type: 'folder',
        children: [],
        docs: 0,
        audio: 0,
        size: 0,
        thumbnailData: null
    };

    let docCount = 0;
    let audioCount = 0;
    let totalSize = 0;
    let hasThumbnail = false;

    // Sort: folders first, then files
    const sortedFiles = files.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
    });

    for (const file of sortedFiles) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            const childNode = scanDirTree(fullPath, depth + 1, path.join(relativePath || path.basename(dir), file.name));
            if (childNode && (childNode.docs > 0 || childNode.audio > 0 || childNode.children.length > 0)) {
                node.children.push(childNode);
                docCount += childNode.docs;
                audioCount += childNode.audio;
                totalSize += childNode.size;
            }
        } else {
            const ext = path.extname(file.name).toLowerCase();

            // Check for thumbnail image
            if (!hasThumbnail && IMAGE_EXTS.includes(ext)) {
                const lowerName = file.name.toLowerCase();
                if (lowerName.includes('cover') || lowerName.includes('thumb') || lowerName.includes('poster')) {
                    hasThumbnail = true;
                    // We'll load thumbnail data later via IPC
                }
            }

            if (DOC_EXTS.includes(ext)) {
                docCount++;
                try {
                    const stats = fs.statSync(fullPath);
                    totalSize += stats.size;
                } catch (e) { }
            }
            if (AUDIO_EXTS.includes(ext)) {
                audioCount++;
                try {
                    const stats = fs.statSync(fullPath);
                    totalSize += stats.size;
                } catch (e) { }
            }
        }
    }

    node.docs = docCount;
    node.audio = audioCount;
    node.size = totalSize;

    return node;
}

// Get all files in a directory recursively, grouped by folder
function getFilesGrouped(dir) {
    const result = {
        docs: [],
        audio: [],
        structure: []
    };

    function scanFolder(folderPath, relativePath = '') {
        let files;
        try {
            files = fs.readdirSync(folderPath, { withFileTypes: true });
        } catch (e) {
            return;
        }

        const folderDocs = [];
        const folderAudio = [];

        // Sort files
        files.sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
        });

        for (const file of files) {
            const fullPath = path.join(folderPath, file.name);
            const relPath = relativePath ? path.join(relativePath, file.name) : file.name;

            if (file.isDirectory()) {
                scanFolder(fullPath, relPath);
            } else {
                const ext = path.extname(file.name).toLowerCase();
                const fileInfo = {
                    name: file.name,
                    path: fullPath,
                    relativePath: relPath,
                    folder: relativePath || '/',
                    type: ext.substring(1)
                };

                if (DOC_EXTS.includes(ext)) {
                    result.docs.push(fileInfo);
                    folderDocs.push(fileInfo);
                }
                if (AUDIO_EXTS.includes(ext)) {
                    result.audio.push(fileInfo);
                    folderAudio.push(fileInfo);
                }
            }
        }

        if (folderDocs.length > 0 || folderAudio.length > 0) {
            result.structure.push({
                folder: relativePath || path.basename(folderPath),
                folderPath: folderPath,
                docs: folderDocs,
                audio: folderAudio
            });
        }
    }

    scanFolder(dir);
    return result;
}

function getAudioFiles(dir) {
    let audioFiles = [];
    try {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
            if (file.isDirectory()) {
                audioFiles = audioFiles.concat(getAudioFiles(path.join(dir, file.name)));
            } else {
                const ext = path.extname(file.name).toLowerCase();
                if (AUDIO_EXTS.includes(ext)) {
                    audioFiles.push({
                        name: file.name,
                        path: path.join(dir, file.name)
                    });
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
    return audioFiles;
}

function getDocFiles(dir) {
    let docFiles = [];
    try {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
            if (!file.isDirectory()) {
                const ext = path.extname(file.name).toLowerCase();
                if (DOC_EXTS.includes(ext)) {
                    docFiles.push({
                        name: file.name,
                        path: path.join(dir, file.name),
                        type: ext.substring(1)
                    });
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
    return docFiles;
}

module.exports = {
    scanDir,
    scanDirTree,
    getAudioFiles,
    getDocFiles,
    getFilesGrouped
};
