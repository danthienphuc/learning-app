# 📚 Learning App

A modern desktop application for organizing and studying learning materials. Built with Electron, React, and Tailwind CSS.

![Learning App Screenshot](screenshots/dashboard.png)

## ✨ Features

- 📁 **Folder Tree View** - Organize your courses by folder structure
- 📄 **PDF Viewer** - Read PDF documents directly in the app
- 📝 **Word Document Support** - Open DOCX files in Microsoft Word
- 🎵 **Audio Player** - Built-in audio player with:
  - Play/Pause, Previous/Next controls
  - Seek bar with time display
  - Playback speed control (0.5x - 2x)
  - Auto-play next track
- 🖼️ **Thumbnail Display** - Show cover images for courses
- ⚙️ **Customizable Folders** - Add any folder to scan for learning materials
- 🔍 **Search** - Quickly find courses by name
- 🌙 **Modern UI** - Clean, responsive interface with dark mode support

## 📥 Download & Installation

### Option 1: Download Pre-built Release (Recommended)

1. Go to the [Releases](https://github.com/YOUR_USERNAME/learning-app/releases) page
2. Download the latest version:
   - **Windows**: `Learning.App.Setup.1.0.0.exe` (Installer) or `Learning.App.1.0.0.exe` (Portable)
   - **macOS**: `Learning.App-1.0.0.dmg`
   - **Linux**: `Learning.App-1.0.0.AppImage`
3. Run the downloaded file

### Option 2: Build from Source

#### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/)

#### Steps

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/learning-app.git
cd learning-app

# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Build for production
npm run electron:build
```

The built application will be in the `release` folder.

## 🚀 Quick Start

1. **Launch the app**
2. **Click the ⚙️ Settings icon** (top right)
3. **Add your learning folders** - Click "Add Folder" and select folders containing your PDF, DOCX, or audio files
4. **Click "Save & Reload"**
5. **Browse your courses** in the tree view
6. **Click a course** to open it
7. **Select documents or audio** from the sidebar

## 📂 Supported File Types

| Type | Extensions |
|------|------------|
| Documents | `.pdf`, `.docx`, `.doc` |
| Audio | `.mp3`, `.wav`, `.m4a`, `.wma`, `.ogg`, `.flac` |
| Thumbnails | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` |

## 📁 Folder Structure

The app scans your folders and automatically finds learning sets:

```
My Learning Folder/
├── English Course/
│   ├── cover.jpg          ← Thumbnail (optional)
│   ├── Lesson 1.pdf
│   ├── Lesson 2.pdf
│   └── Audio/
│       ├── Track 01.mp3
│       └── Track 02.mp3
└── Chinese Course/
    ├── HSK1.pdf
    └── Vocabulary.mp3
```

## 🛠️ Development

### Project Structure

```
learning-app/
├── electron/
│   ├── main.cjs         # Electron main process
│   ├── preload.cjs      # Preload script (IPC bridge)
│   └── scanner.cjs      # File scanning logic
├── src/
│   ├── App.jsx          # Main React component
│   ├── main.jsx         # React entry point
│   ├── index.css        # Tailwind CSS styles
│   └── lib/
│       └── utils.js     # Utility functions
├── public/              # Static assets
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (web only) |
| `npm run electron:dev` | Start app in development mode |
| `npm run electron:build` | Build for all platforms |
| `npm run electron:build:win` | Build for Windows |
| `npm run electron:build:mac` | Build for macOS |
| `npm run electron:build:linux` | Build for Linux |

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

Daniel Mai - danthienphuc@gmail.com

Project Link: [https://github.com/danthienphuc/learning-app](https://github.com/danthienphuc/learning-app)

Learning material: https://drive.google.com/drive/folders/1_k1pKP56u_tfEVQkMAlDql_zFbt6IsI8?usp=drive_link

---

⭐ **If you find this project useful, please give it a star!** ⭐
